package com.devert.backend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.devert.backend.dto.ChallengeRegistrationRequest;
import com.devert.backend.dto.PayoutStatusRequest;
import com.devert.backend.service.EmailService;

@RestController
@RequestMapping("/api/notify")
@CrossOrigin(origins = "*") // Allow frontend access
public class NotificationController {

    @Autowired
    private EmailService emailService;

    @PostMapping("/challenge-connected")
    public ResponseEntity<String> sendChallengeConfirmation(@RequestBody ChallengeRegistrationRequest request) {
        try {
            emailService.sendChallengeConfirmation(request.getEmail(), request.getLeadName(), request.getTeamName());
            return ResponseEntity.ok("Transmission Successful");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Transmission Failed: " + e.getMessage());
        }
    }

    // Called by the admin console after a payout request is approved/rejected -
    // Firestore is already updated by that point; this is a best-effort email
    // side-effect, not the source of truth.
    @PostMapping("/payout-status")
    public ResponseEntity<String> sendPayoutStatus(@RequestBody PayoutStatusRequest request) {
        try {
            emailService.sendPayoutStatus(
                request.getEmail(), request.getDisplayName(), request.getStatus(),
                request.getCoins(), request.getInrAmount()
            );
            return ResponseEntity.ok("Transmission Successful");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Transmission Failed: " + e.getMessage());
        }
    }
}
