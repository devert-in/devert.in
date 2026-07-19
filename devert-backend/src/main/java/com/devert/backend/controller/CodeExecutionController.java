package com.devert.backend.controller;

import java.util.HashMap;
import java.util.Map;

import jakarta.servlet.http.HttpServletRequest;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.devert.backend.dto.ArenaSubmitRequest;
import com.devert.backend.dto.CodeRunRequest;
import com.devert.backend.dto.CodeSubmitRequest;
import com.devert.backend.service.CodeExecutionService;
import com.devert.backend.service.GradingService;
import com.devert.backend.service.RateLimiter;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseToken;

@RestController
@RequestMapping("/api/coding")
public class CodeExecutionController {

    private static final Logger log = LoggerFactory.getLogger(CodeExecutionController.class);

    @Autowired
    private CodeExecutionService codeExecutionService;

    @Autowired
    private GradingService gradingService;

    @Autowired
    private RateLimiter rateLimiter;

    @Autowired(required = false)
    private FirebaseAuth firebaseAuth;

    // "Run" has no rate limit at all - removed per explicit request (it was
    // getting in the way of normal testing/demo use more than it was
    // stopping abuse). Submissions still are: they're signed in, so they're
    // keyed by the verified uid rather than IP. See RateLimiter's javadoc
    // for why an in-process limiter is an accepted tradeoff here.
    private static final long SUBMIT_COOLDOWN_MS = 5000;
    private static final int SUBMIT_WINDOW_LIMIT = 15;
    private static final long SUBMIT_WINDOW_MS = 10 * 60 * 1000;

    // Generous but bounded - a legitimate solution is never anywhere near this size;
    // this exists purely to cap the payload we forward to Judge0 on someone's behalf.
    private static final int MAX_CODE_LENGTH = 20_000;

    @PostMapping("/run")
    public ResponseEntity<?> run(@RequestBody CodeRunRequest request) {
        if (request.getCode() != null && request.getCode().length() > MAX_CODE_LENGTH) {
            return ResponseEntity.badRequest().body(err("Code is too long."));
        }
        String compilerId = codeExecutionService.compilerId(request.getLanguage());
        if (compilerId == null) {
            return ResponseEntity.badRequest().body(err("Unsupported language: " + request.getLanguage()));
        }
        try {
            CodeExecutionService.ExecutionResult result = codeExecutionService.run(compilerId, request.getCode(), request.getStdin());
            Map<String, Object> body = new HashMap<>();
            body.put("stdout", result.output);
            // No separate compile-output field from this provider - error text (compile
            // or runtime) all comes back in one field. See CodeExecutionService's class
            // comment on the error-fidelity gap for Python/Java/JS specifically.
            body.put("stderr", result.error);
            body.put("compileOutput", null);
            body.put("status", result.status != null ? result.status : "Unknown");
            body.put("timeMs", result.time != null ? (long) (Double.parseDouble(result.time) * 1000) : 0);
            body.put("memoryKb", result.memory);
            return ResponseEntity.ok(body);
        } catch (Exception e) {
            log.error("Code execution failed", e);
            return ResponseEntity.internalServerError().body(err("Execution failed: " + e.getMessage()));
        }
    }

    @PostMapping("/submit")
    public ResponseEntity<?> submit(@RequestBody CodeSubmitRequest request, HttpServletRequest httpRequest,
                                     @RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (firebaseAuth == null) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(err("Submissions aren't configured yet."));
        }
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(err("Sign in required."));
        }
        // The verified token's own uid is the ONLY identity ever used below - the
        // request body's uid (if the client still sends one) is never trusted, since
        // that was letting anyone grant XP/coins to an arbitrary account by guessing
        // their uid.
        String uid;
        try {
            FirebaseToken decoded = firebaseAuth.verifyIdToken(authHeader.substring(7));
            uid = decoded.getUid();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(err("Invalid or expired session - please sign in again."));
        }
        if (request.getProblemId() == null) {
            return ResponseEntity.badRequest().body(err("problemId is required."));
        }
        if (request.getCode() != null && request.getCode().length() > MAX_CODE_LENGTH) {
            return ResponseEntity.badRequest().body(err("Code is too long."));
        }
        if (!rateLimiter.allow("submit:" + uid, 1, SUBMIT_COOLDOWN_MS)
            || !rateLimiter.allow("submit-window:" + uid, SUBMIT_WINDOW_LIMIT, SUBMIT_WINDOW_MS)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(err("Please wait before submitting again."));
        }
        try {
            Map<String, Object> result = gradingService.gradeSubmission(
                uid, request.getProblemId(), request.getLanguage(), request.getCode()
            );
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(err(e.getMessage()));
        } catch (Exception e) {
            log.error("Grading failed for uid={} problemId={}", uid, request.getProblemId(), e);
            return ResponseEntity.internalServerError().body(err("Grading failed: " + e.getMessage()));
        }
    }

    @PostMapping("/arena/submit")
    public ResponseEntity<?> arenaSubmit(@RequestBody ArenaSubmitRequest request, HttpServletRequest httpRequest,
                                          @RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (firebaseAuth == null) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(err("Arena submissions aren't configured yet."));
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
        if (request.getMatchId() == null) {
            return ResponseEntity.badRequest().body(err("matchId is required."));
        }
        if (request.getCode() != null && request.getCode().length() > MAX_CODE_LENGTH) {
            return ResponseEntity.badRequest().body(err("Code is too long."));
        }
        if (!rateLimiter.allow("submit:" + uid, 1, SUBMIT_COOLDOWN_MS)
            || !rateLimiter.allow("submit-window:" + uid, SUBMIT_WINDOW_LIMIT, SUBMIT_WINDOW_MS)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(err("Please wait before submitting again."));
        }
        try {
            Map<String, Object> result = gradingService.gradeArenaSubmission(
                uid, request.getMatchId(), request.getLanguage(), request.getCode()
            );
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(err(e.getMessage()));
        } catch (Exception e) {
            log.error("Arena grading failed for uid={} matchId={}", uid, request.getMatchId(), e);
            return ResponseEntity.internalServerError().body(err("Grading failed: " + e.getMessage()));
        }
    }

    private Map<String, String> err(String message) {
        Map<String, String> body = new HashMap<>();
        body.put("error", message);
        return body;
    }
}
