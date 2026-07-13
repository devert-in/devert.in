package com.devert.backend.controller;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import jakarta.servlet.http.HttpServletRequest;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.devert.backend.dto.CodeRunRequest;
import com.devert.backend.dto.CodeSubmitRequest;
import com.devert.backend.service.GradingService;
import com.devert.backend.service.Judge0Service;

@RestController
@RequestMapping("/api/coding")
@CrossOrigin(origins = "*")
public class CodeExecutionController {

    @Autowired
    private Judge0Service judge0;

    @Autowired
    private GradingService gradingService;

    // Basic in-process cooldown - not real auth/rate-limiting (no per-user identity is
    // verified here yet), just a cheap guard against a scripted loop burning through
    // the Judge0 quota. Resets on redeploy and doesn't coordinate across instances -
    // documented as a Phase 2 hardening gap (needs Firebase ID token verification).
    private final Map<String, Long> lastRunAt = new ConcurrentHashMap<>();
    private static final long RUN_COOLDOWN_MS = 2000;
    private static final long SUBMIT_COOLDOWN_MS = 5000;

    @PostMapping("/run")
    public ResponseEntity<?> run(@RequestBody CodeRunRequest request, HttpServletRequest httpRequest) {
        if (cooling(httpRequest.getRemoteAddr(), RUN_COOLDOWN_MS)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(err("Slow down - try again in a few seconds."));
        }
        Integer languageId = judge0.languageId(request.getLanguage());
        if (languageId == null) {
            return ResponseEntity.badRequest().body(err("Unsupported language: " + request.getLanguage()));
        }
        try {
            Judge0Service.Judge0Result result = judge0.run(languageId, request.getCode(), request.getStdin());
            Map<String, Object> body = new HashMap<>();
            body.put("stdout", result.stdout);
            body.put("stderr", result.stderr);
            body.put("compileOutput", result.compileOutput);
            body.put("status", result.status != null ? result.status.description : "Unknown");
            body.put("timeMs", result.time != null ? (long) (Double.parseDouble(result.time) * 1000) : 0);
            body.put("memoryKb", result.memory);
            return ResponseEntity.ok(body);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(err("Execution failed: " + e.getMessage()));
        }
    }

    @PostMapping("/submit")
    public ResponseEntity<?> submit(@RequestBody CodeSubmitRequest request, HttpServletRequest httpRequest) {
        if (request.getUid() == null || request.getProblemId() == null) {
            return ResponseEntity.badRequest().body(err("uid and problemId are required."));
        }
        if (cooling(request.getUid(), SUBMIT_COOLDOWN_MS)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(err("Please wait before submitting again."));
        }
        try {
            Map<String, Object> result = gradingService.gradeSubmission(
                request.getUid(), request.getProblemId(), request.getLanguage(), request.getCode()
            );
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(err(e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(err("Grading failed: " + e.getMessage()));
        }
    }

    private boolean cooling(String key, long cooldownMs) {
        if (key == null) return false;
        long now = System.currentTimeMillis();
        Long last = lastRunAt.put(key, now);
        return last != null && (now - last) < cooldownMs;
    }

    private Map<String, String> err(String message) {
        Map<String, String> body = new HashMap<>();
        body.put("error", message);
        return body;
    }
}
