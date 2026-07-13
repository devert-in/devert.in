package com.devert.backend.service;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

// Proxies code execution to Judge0 CE, hosted on RapidAPI, so the API key never
// reaches the browser. The language IDs below match Judge0 CE's classic default
// language list; verify against your RapidAPI listing's GET /languages if results
// look wrong (different Judge0 CE listings occasionally support a different set).
@Service
public class Judge0Service {

    @Value("${judge0.api.url}")
    private String apiUrl;

    @Value("${judge0.api.key:}")
    private String apiKey;

    @Value("${judge0.api.host}")
    private String apiHost;

    private static final Map<String, Integer> LANGUAGE_IDS = new HashMap<>();
    static {
        LANGUAGE_IDS.put("c", 50);          // C (GCC 9.2.0)
        LANGUAGE_IDS.put("cpp", 54);         // C++ (GCC 9.2.0)
        LANGUAGE_IDS.put("java", 62);        // Java (OpenJDK 13.0.1)
        LANGUAGE_IDS.put("python", 71);      // Python (3.8.1)
        LANGUAGE_IDS.put("javascript", 63);  // JavaScript (Node.js 12.14.0)
    }

    public Integer languageId(String language) {
        return LANGUAGE_IDS.get(language == null ? "" : language.toLowerCase());
    }

    public Judge0Result run(int languageId, String sourceCode, String stdin) {
        return run(languageId, sourceCode, stdin, null);
    }

    // Passing expectedOutput lets Judge0 itself do the (whitespace-trimmed) comparison
    // and set status to Accepted(3)/Wrong Answer(4) - avoids re-implementing Judge0's
    // own output-normalization rules here. Used by GradingService for real submissions;
    // the plain "Run" endpoint (Playground / sample-only runs) omits it.
    public Judge0Result run(int languageId, String sourceCode, String stdin, String expectedOutput) {
        RestTemplate restTemplate = new RestTemplate();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-RapidAPI-Key", apiKey);
        headers.set("X-RapidAPI-Host", apiHost);

        Map<String, Object> body = new HashMap<>();
        body.put("source_code", sourceCode);
        body.put("language_id", languageId);
        body.put("stdin", stdin == null ? "" : stdin);
        if (expectedOutput != null && !expectedOutput.isEmpty()) {
            body.put("expected_output", expectedOutput);
        }

        String url = apiUrl + "/submissions?base64_encoded=false&wait=true";
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
        return restTemplate.exchange(url, HttpMethod.POST, entity, Judge0Result.class).getBody();
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Judge0Result {
        public String stdout;
        public String stderr;

        @JsonProperty("compile_output")
        public String compileOutput;

        public String message;
        public String time;   // seconds, as a string, e.g. "0.012"
        public Integer memory; // KB

        public Status status;

        @JsonIgnoreProperties(ignoreUnknown = true)
        public static class Status {
            public int id;
            public String description;
        }
    }
}
