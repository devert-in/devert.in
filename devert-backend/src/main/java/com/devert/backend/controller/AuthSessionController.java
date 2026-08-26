package com.devert.backend.controller;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseToken;
import com.google.firebase.auth.SessionCookieOptions;

// Cross-subdomain session bridge for devert.in / campus.devert.in. A Firebase
// Auth client session (IndexedDB-backed) never spans two different origins on
// its own, so this hands out a real Set-Cookie(Domain=.devert.in) session
// cookie that BOTH origins can read, then lets either origin exchange that
// cookie for a fresh custom token to re-establish a genuine client SDK
// session there (signInWithCustomToken) - the cookie itself is never treated
// as an auth session by the client SDK or by Firestore's security rules,
// which only ever see request.auth from that re-established session.
//
// Deliberately reachable ONLY via each Hosting site's own same-origin
// "/api/auth/**" -> Cloud Run rewrite (see firebase.json), never called
// directly against the *.run.app URL other controllers use - a Set-Cookie
// with Domain=.devert.in from a run.app response is invalid and browsers
// silently drop it, so this only works same-origin by construction.
@RestController
@RequestMapping("/api/auth")
public class AuthSessionController {

    private static final Logger log = LoggerFactory.getLogger(AuthSessionController.class);
    private static final String COOKIE_NAME = "devert_session";
    // Firebase caps session cookie lifetime at 14 days - matches that ceiling
    // rather than picking an arbitrary shorter value, since the whole point is
    // to avoid asking someone to sign in twice.
    private static final long EXPIRES_MS = TimeUnit.DAYS.toMillis(14);

    @Autowired(required = false)
    private FirebaseAuth firebaseAuth;

    @PostMapping("/session")
    public ResponseEntity<?> mintSession(@RequestBody Map<String, String> body) {
        if (firebaseAuth == null) return unavailable();
        String idToken = body.get("idToken");
        if (idToken == null || idToken.isBlank()) return ResponseEntity.badRequest().body(err("idToken is required."));
        try {
            // Verifying first rejects a stale/forged token with a real 401
            // instead of letting createSessionCookie fail less legibly.
            firebaseAuth.verifyIdToken(idToken);
            SessionCookieOptions options = SessionCookieOptions.builder().setExpiresIn(EXPIRES_MS).build();
            String sessionCookie = firebaseAuth.createSessionCookie(idToken, options);
            ResponseCookie cookie = ResponseCookie.from(COOKIE_NAME, sessionCookie)
                .domain(".devert.in").path("/").httpOnly(true).secure(true).sameSite("None")
                .maxAge(EXPIRES_MS / 1000).build();
            return ResponseEntity.ok().header(HttpHeaders.SET_COOKIE, cookie.toString()).body(ok());
        } catch (Exception e) {
            log.warn("mintSession failed", e);
            return unauthorized();
        }
    }

    @GetMapping("/session/exchange")
    public ResponseEntity<?> exchangeSession(@CookieValue(value = COOKIE_NAME, required = false) String sessionCookie) {
        if (firebaseAuth == null) return unavailable();
        if (sessionCookie == null || sessionCookie.isBlank()) return unauthorized();
        try {
            FirebaseToken decoded = firebaseAuth.verifySessionCookie(sessionCookie, true);
            String customToken = firebaseAuth.createCustomToken(decoded.getUid());
            Map<String, Object> body = ok();
            body.put("customToken", customToken);
            return ResponseEntity.ok(body);
        } catch (Exception e) {
            // Expected/routine for a signed-out visitor (no cookie) or an
            // expired/revoked one - not worth logging at warn level.
            return unauthorized();
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        ResponseCookie cleared = ResponseCookie.from(COOKIE_NAME, "")
            .domain(".devert.in").path("/").httpOnly(true).secure(true).sameSite("None")
            .maxAge(0).build();
        return ResponseEntity.ok().header(HttpHeaders.SET_COOKIE, cleared.toString()).body(ok());
    }

    private ResponseEntity<?> unauthorized() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(err("Not signed in."));
    }

    private ResponseEntity<?> unavailable() {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(err("Auth isn't configured."));
    }

    private Map<String, Object> ok() {
        Map<String, Object> body = new HashMap<>();
        body.put("ok", true);
        return body;
    }

    private Map<String, String> err(String message) {
        Map<String, String> body = new HashMap<>();
        body.put("error", message);
        return body;
    }
}
