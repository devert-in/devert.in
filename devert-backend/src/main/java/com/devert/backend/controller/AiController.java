package com.devert.backend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.devert.backend.service.AiService;
import java.util.Map;

@RestController
@RequestMapping("/api/execution-ai")
@CrossOrigin(origins = "*")
public class AiController {

    @Autowired
    private AiService aiService;

    @PostMapping("/evaluate")
    public ResponseEntity<Map<String, Object>> evaluateIdea(@RequestBody Map<String, String> request) {
        String userInput = request.get("userInput");
        if (userInput == null || userInput.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Input is required"));
        }

        try {
            Map<String, Object> report = aiService.generateExecutionReport(userInput);
            return ResponseEntity.ok(report);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Failed to generate report: " + e.getMessage()));
        }
    }
}
