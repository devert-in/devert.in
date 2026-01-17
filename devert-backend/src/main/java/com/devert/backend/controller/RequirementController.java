package com.devert.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.List;
import java.util.ArrayList;

@RestController
@RequestMapping("/api/requirements")
@CrossOrigin(origins = "*")
public class RequirementController {

    // In a real implementation, you would inject a Service here that talks to Firestore
    
    @PostMapping
    public ResponseEntity<String> createRequirement(@RequestBody Map<String, Object> requirementData) {
        // Logic to validate and save to Firebase would go here
        System.out.println("Received Requirement: " + requirementData);
        return ResponseEntity.ok("Requirement Received by Backend Core");
    }

    @GetMapping
    public ResponseEntity<List<String>> getRequirements() {
        // Logic to fetch from Firebase
        List<String> mockList = new ArrayList<>();
        mockList.add("Backend Connected Project 1");
        mockList.add("Backend Connected Project 2");
        return ResponseEntity.ok(mockList);
    }
}
