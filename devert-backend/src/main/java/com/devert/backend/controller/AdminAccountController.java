package com.devert.backend.controller;

import java.util.HashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.devert.backend.dto.CreateStaffAccountRequest;
import com.devert.backend.dto.LoginFailureRequest;
import com.devert.backend.dto.StaffAccountStatusRequest;
import com.devert.backend.dto.StaffAccountUidRequest;
import com.devert.backend.dto.UpdateStaffPermissionsRequest;
import com.devert.backend.service.AdminAccountService;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseToken;

// Principal/HOD/Faculty-Class-Teacher account management - every mutating
// endpoint here requires a verified Firebase ID token (never a client-
// supplied uid) and re-derives the caller's own authorization server-side via
// AdminAccountService before touching anything. Institution Admin's existing
// full rights are the top of this hierarchy (see WHO_CAN_ACT there) - this
// controller only ever ADDS new, narrower account types underneath it.
@RestController
@RequestMapping("/api/campus")
public class AdminAccountController {

    private static final Logger log = LoggerFactory.getLogger(AdminAccountController.class);

    @Autowired
    private AdminAccountService adminAccountService;

    @Autowired(required = false)
    private FirebaseAuth firebaseAuth;

    @PostMapping("/accounts")
    public ResponseEntity<?> create(@RequestBody CreateStaffAccountRequest request,
                                     @RequestHeader(value = "Authorization", required = false) String authHeader) {
        String callerUid = verify(authHeader);
        if (callerUid == null) return unauthorized();
        try {
            Map<String, Object> result = adminAccountService.createAccount(
                callerUid, request.getInstitutionId(), request.getRoleKey(), request.getEmail(),
                request.getDisplayName(), request.getDepartment(), request.getClassroomId());
            return ResponseEntity.ok(result);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(err(e.getMessage()));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(err(e.getMessage()));
        } catch (Exception e) {
            log.error("createAccount failed for caller={}", callerUid, e);
            return ResponseEntity.internalServerError().body(err("Could not create account: " + e.getMessage()));
        }
    }

    @PostMapping("/accounts/{uid}/resend-setup")
    public ResponseEntity<?> resendSetup(@RequestBody StaffAccountUidRequest request,
                                          @RequestHeader(value = "Authorization", required = false) String authHeader) {
        String callerUid = verify(authHeader);
        if (callerUid == null) return unauthorized();
        try {
            adminAccountService.resendSetup(callerUid, request.getInstitutionId(), request.getUid());
            return ResponseEntity.ok(ok());
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(err(e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(err(e.getMessage()));
        } catch (Exception e) {
            log.error("resendSetup failed for caller={}", callerUid, e);
            return ResponseEntity.internalServerError().body(err("Could not resend setup email: " + e.getMessage()));
        }
    }

    @PatchMapping("/accounts/{uid}/status")
    public ResponseEntity<?> setStatus(@RequestBody StaffAccountStatusRequest request,
                                        @RequestHeader(value = "Authorization", required = false) String authHeader) {
        String callerUid = verify(authHeader);
        if (callerUid == null) return unauthorized();
        try {
            adminAccountService.setStatus(callerUid, request.getInstitutionId(), request.getUid(), request.getStatus());
            return ResponseEntity.ok(ok());
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(err(e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(err(e.getMessage()));
        } catch (Exception e) {
            log.error("setStatus failed for caller={}", callerUid, e);
            return ResponseEntity.internalServerError().body(err("Could not update status: " + e.getMessage()));
        }
    }

    @PostMapping("/accounts/{uid}/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody StaffAccountUidRequest request,
                                            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        String callerUid = verify(authHeader);
        if (callerUid == null) return unauthorized();
        try {
            adminAccountService.resetPassword(callerUid, request.getInstitutionId(), request.getUid());
            return ResponseEntity.ok(ok());
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(err(e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(err(e.getMessage()));
        } catch (Exception e) {
            log.error("resetPassword failed for caller={}", callerUid, e);
            return ResponseEntity.internalServerError().body(err("Could not reset password: " + e.getMessage()));
        }
    }

    @PatchMapping("/accounts/{uid}/permissions")
    public ResponseEntity<?> updatePermissions(@RequestBody UpdateStaffPermissionsRequest request,
                                                @RequestHeader(value = "Authorization", required = false) String authHeader) {
        String callerUid = verify(authHeader);
        if (callerUid == null) return unauthorized();
        try {
            adminAccountService.updatePermissions(callerUid, request.getInstitutionId(), request.getUid(), request.getPermissionOverrides());
            return ResponseEntity.ok(ok());
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(err(e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(err(e.getMessage()));
        } catch (Exception e) {
            log.error("updatePermissions failed for caller={}", callerUid, e);
            return ResponseEntity.internalServerError().body(err("Could not update permissions: " + e.getMessage()));
        }
    }

    // Self-action - the newly-authenticated account reports its own
    // successful sign-in. Always 200: never reveals anything about whether
    // an account/role exists to a caller that isn't already that account.
    @PostMapping("/auth/login-success")
    public ResponseEntity<?> loginSuccess(@RequestBody Map<String, String> body,
                                           @RequestHeader(value = "Authorization", required = false) String authHeader) {
        String uid = verify(authHeader);
        if (uid != null) {
            try {
                adminAccountService.recordLoginSuccess(uid, body.get("institutionId"));
            } catch (Exception e) {
                log.warn("recordLoginSuccess failed for uid={}", uid, e);
            }
        }
        return ResponseEntity.ok(ok());
    }

    // Deliberately unauthenticated (see LoginFailureRequest) - always 200,
    // never reveals whether the email exists.
    @PostMapping("/auth/login-failure")
    public ResponseEntity<?> loginFailure(@RequestBody LoginFailureRequest request) {
        try {
            adminAccountService.recordLoginFailure(request.getInstitutionId(), request.getEmail());
        } catch (Exception e) {
            log.warn("recordLoginFailure failed", e);
        }
        return ResponseEntity.ok(ok());
    }

    private String verify(String authHeader) {
        if (firebaseAuth == null || authHeader == null || !authHeader.startsWith("Bearer ")) return null;
        try {
            FirebaseToken decoded = firebaseAuth.verifyIdToken(authHeader.substring(7));
            return decoded.getUid();
        } catch (Exception e) {
            return null;
        }
    }

    private ResponseEntity<?> unauthorized() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(err("Sign in required."));
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
