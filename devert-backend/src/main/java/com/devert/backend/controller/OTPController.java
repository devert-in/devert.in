package com.devert.backend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.devert.backend.dto.OTPRequest;
import com.devert.backend.service.EmailService;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class OTPController {

    @Autowired
    private EmailService emailService;

    // Simple in-memory store for OTPs (In production, use Redis or DB with expiry)
    private static final Map<String, String> otpStorage = new ConcurrentHashMap<>();

    @PostMapping("/send-otp")
    public ResponseEntity<String> sendOTP(@RequestBody OTPRequest request) {
        try {
            String email = request.getEmail();
            if (email == null || !email.contains("@")) {
                return ResponseEntity.badRequest().body("Invalid Email Profile");
            }

            // Generate 6-digit OTP
            String otp = String.format("%06d", new Random().nextInt(999999));
            otpStorage.put(email, otp);

            emailService.sendOTP(email, otp);
            return ResponseEntity.ok("OTP_TRANSMITTED_SUCCESSFULLY");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("TRANSMISSION_FAILED: " + e.getMessage());
        }
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<String> verifyOTP(@RequestBody OTPRequest request) {
        String email = request.getEmail();
        String receivedOtp = request.getOtp();

        if (otpStorage.containsKey(email) && otpStorage.get(email).equals(receivedOtp)) {
            otpStorage.remove(email); // One-time use
            return ResponseEntity.ok("VERIFICATION_SUCCESSFUL");
        } else {
            return ResponseEntity.status(401).body("INVALID_OTP_OR_EXPIRED");
        }
    }
}
