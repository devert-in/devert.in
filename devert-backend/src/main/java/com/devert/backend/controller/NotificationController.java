package com.devert.backend.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.devert.backend.dto.ChallengeRegistrationRequest;
import com.devert.backend.dto.PayoutStatusRequest;
import com.devert.backend.service.EmailService;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseToken;

@RestController
@RequestMapping("/api/notify")
public class NotificationController {

    private static final Logger log = LoggerFactory.getLogger(NotificationController.class);

    @Autowired
    private EmailService emailService;

    @Autowired(required = false)
    private FirebaseAuth firebaseAuth;

    // Both endpoints used to accept ANY caller and send mail to ANY address
    // with caller-supplied names/amounts - a phishing relay on DeVert's own
    // SMTP. Now: a verified ID token is required; the challenge confirmation
    // goes only to the caller's OWN verified email; payout-status is platform
    // admin only (same one-account test as firestore.rules' isAdmin()).
    // EmailService HTML-escapes every interpolated value.
    private static final String PLATFORM_OWNER_EMAIL = "devert.contact@gmail.com";

    private FirebaseToken verify(String authHeader) {
        if (firebaseAuth == null || authHeader == null || !authHeader.startsWith("Bearer ")) return null;
        try { return firebaseAuth.verifyIdToken(authHeader.substring(7)); } catch (Exception e) { return null; }
    }

    private static boolean isPlatformAdmin(FirebaseToken t) {
        return t != null && t.isEmailVerified()
            && PLATFORM_OWNER_EMAIL.equalsIgnoreCase(t.getEmail())
            && Boolean.TRUE.equals(t.getClaims().get("admin"));
    }

    @PostMapping("/challenge-connected")
    public ResponseEntity<String> sendChallengeConfirmation(@RequestBody ChallengeRegistrationRequest request,
                                                            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        FirebaseToken caller = verify(authHeader);
        if (caller == null || caller.getEmail() == null || !caller.isEmailVerified()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Sign in required.");
        }
        try {
            // Recipient is the caller's own verified email - never the body's.
            emailService.sendChallengeConfirmation(caller.getEmail(), request.getLeadName(), request.getTeamName());
            return ResponseEntity.ok("Transmission Successful");
        } catch (Exception e) {
            log.error("Failed to send challenge confirmation email", e);
            return ResponseEntity.internalServerError().body("Transmission Failed.");
        }
    }

    // Called by the admin console after a payout request is approved/rejected -
    // Firestore is already updated by that point; this is a best-effort email
    // side-effect, not the source of truth.
    @PostMapping("/payout-status")
    public ResponseEntity<String> sendPayoutStatus(@RequestBody PayoutStatusRequest request,
                                                   @RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (!isPlatformAdmin(verify(authHeader))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Platform admin only.");
        }
        try {
            emailService.sendPayoutStatus(
                request.getEmail(), request.getDisplayName(), request.getStatus(),
                request.getCoins(), request.getInrAmount()
            );
            return ResponseEntity.ok("Transmission Successful");
        } catch (Exception e) {
            log.error("Failed to send payout status email", e);
            return ResponseEntity.internalServerError().body("Transmission Failed.");
        }
    }
}
