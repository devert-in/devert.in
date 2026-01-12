package com.devert.backend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.devert.backend.dto.ChallengeRegistrationRequest;
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
}
