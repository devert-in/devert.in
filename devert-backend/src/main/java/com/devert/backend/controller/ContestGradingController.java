package com.devert.backend.controller;

import java.util.HashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.devert.backend.dto.ContestCodeSubmitRequest;
import com.devert.backend.service.ContestGradingService;
import com.devert.backend.service.RateLimiter;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseToken;

// Contest coding questions' own submit endpoint - deliberately separate from
// CodeExecutionController's /api/coding/submit (hardwired to a global
// problemId) and /api/coding/arena/submit (hardwired to an arena_matches
// session). Same verified-ID-token trust model as both of those: the token's
// own uid is the only identity ever used, never a client-supplied one.
@RestController
@RequestMapping("/api/contests")
public class ContestGradingController {

    private static final Logger log = LoggerFactory.getLogger(ContestGradingController.class);

    @Autowired
    private ContestGradingService contestGradingService;

    @Autowired
    private RateLimiter rateLimiter;

    @Autowired(required = false)
    private FirebaseAuth firebaseAuth;

    // Same cooldown/window shape as CodeExecutionController's own submit
    // endpoints - a contest submit is no less expensive to run than a CodeLab
    // one, and shares the same single-instance CodeExecutionService deployment.
    private static final long SUBMIT_COOLDOWN_MS = 5000;
    private static final int SUBMIT_WINDOW_LIMIT = 15;
    private static final long SUBMIT_WINDOW_MS = 10 * 60 * 1000;
    private static final int MAX_CODE_LENGTH = 20_000;

    @PostMapping("/{contestId}/questions/{questionId}/submit")
    public ResponseEntity<?> submit(@PathVariable String contestId, @PathVariable String questionId,
                                     @RequestBody ContestCodeSubmitRequest request,
                                     @RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (firebaseAuth == null) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(err("Contest submissions aren't configured yet."));
        }
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(err("Sign in required."));
        }
        String uid;
        try {
            FirebaseToken decoded = firebaseAuth.verifyIdToken(authHeader.substring(7));
            uid = decoded.getUid();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(err("Invalid or expired session - please sign in again."));
        }
        if (request.getCode() != null && request.getCode().length() > MAX_CODE_LENGTH) {
            return ResponseEntity.badRequest().body(err("Code is too long."));
        }
        if (!rateLimiter.allow("contest-submit:" + uid, 1, SUBMIT_COOLDOWN_MS)
            || !rateLimiter.allow("contest-submit-window:" + uid, SUBMIT_WINDOW_LIMIT, SUBMIT_WINDOW_MS)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(err("Please wait before submitting again."));
        }
        try {
            Map<String, Object> result = contestGradingService.gradeContestSubmission(
                uid, contestId, questionId, request.getLanguage(), request.getCode()
            );
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(err(e.getMessage()));
        } catch (Exception e) {
            log.error("Contest grading failed for uid={} contestId={} questionId={}", uid, contestId, questionId, e);
            return ResponseEntity.internalServerError().body(err("Grading failed: " + e.getMessage()));
        }
    }

    private Map<String, String> err(String message) {
        Map<String, String> body = new HashMap<>();
        body.put("error", message);
        return body;
    }
}
