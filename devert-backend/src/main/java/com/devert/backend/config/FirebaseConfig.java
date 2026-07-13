package com.devert.backend.config;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.firestore.Firestore;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.cloud.FirestoreClient;

// Re-added deliberately for CodeLab: this is the only way to read hidden test cases
// (which must never be exposed to the client) and to write graded submissions/award
// XP-coins as a trusted server, bypassing Firestore security rules entirely. It was
// removed earlier as unused scaffolding - this is the first real workload for it.
@Configuration
public class FirebaseConfig {

    // FIREBASE_SERVICE_ACCOUNT_JSON holds the service-account.json content, either as
    // raw JSON or base64-encoded (to make pasting a multi-line secret into Render's
    // dashboard easier) - both are accepted.
    @Value("${firebase.service-account-json:}")
    private String serviceAccountJson;

    // Must never throw: this bean is constructed at application startup, and this
    // service also handles the pre-existing, currently-working email endpoints that
    // have nothing to do with CodeLab. If FIREBASE_SERVICE_ACCOUNT_JSON isn't set yet
    // (e.g. right after this deploy, before the secret is added), CodeLab's endpoints
    // should report "not configured" - the rest of the backend must keep working.
    @Bean
    public Firestore firestore() {
        if (serviceAccountJson == null || serviceAccountJson.isBlank()) {
            System.err.println("FIREBASE_SERVICE_ACCOUNT_JSON not set - CodeLab endpoints will report unavailable.");
            return null;
        }
        try {
            if (FirebaseApp.getApps().isEmpty()) {
                String json = decodeIfBase64(serviceAccountJson);
                GoogleCredentials credentials = GoogleCredentials.fromStream(
                    new ByteArrayInputStream(json.getBytes(StandardCharsets.UTF_8))
                );
                FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(credentials)
                    .build();
                FirebaseApp.initializeApp(options);
            }
            return FirestoreClient.getFirestore();
        } catch (Exception e) {
            System.err.println("Failed to initialize Firebase - CodeLab endpoints will report unavailable: " + e.getMessage());
            return null;
        }
    }

    private String decodeIfBase64(String value) {
        String trimmed = value.trim();
        if (trimmed.startsWith("{")) return trimmed; // already raw JSON
        return new String(Base64.getDecoder().decode(trimmed), StandardCharsets.UTF_8);
    }
}
