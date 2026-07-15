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

// Proxies code execution to OnlineCompiler.io so its API key never reaches the browser.
// Replaced Judge0 CE (RapidAPI) for a far higher free quota (1M req/month vs ~50/day) -
// see the deploy notes for the tradeoff this came with.
//
// Unlike Judge0, this API does NOT compare output against an expected answer
// server-side - it only runs the code and returns raw stdout/stderr. GradingService
// does the pass/fail comparison itself (see its runTest()).
//
// Known limitation, confirmed by direct testing against the live API (not a guess):
// compile/runtime errors come back with full diagnostic text for C and C++ ("gcc-15" /
// "g++-15"), but for Python, Java and JavaScript ("python-3.14" / "openjdk-25" /
// "typescript-deno") EVERY failure - syntax error, uncaught exception, infinite loop -
// collapses into the same generic "Internal error: code execution failed" with
// exit_code -1. There is no way to distinguish Compilation Error from Runtime Error
// from Time Limit Exceeded for those three languages with this provider. Accepted
// tradeoff for now; revisit if CodeLab's error-message fidelity for those languages
// becomes a real problem.
@Service
public class CodeExecutionService {

    private static final String EXEC_URL = "https://api.onlinecompiler.io/api/run-code-sync/";

    @Value("${onlinecompiler.api.key:}")
    private String apiKey;

    private static final Map<String, String> COMPILER_IDS = new HashMap<>();
    static {
        COMPILER_IDS.put("c", "gcc-15");
        COMPILER_IDS.put("cpp", "g++-15");
        COMPILER_IDS.put("java", "openjdk-25");
        COMPILER_IDS.put("python", "python-3.14");
        COMPILER_IDS.put("javascript", "typescript-deno");
    }

    public String compilerId(String language) {
        return COMPILER_IDS.get(language == null ? "" : language.toLowerCase());
    }

    public ExecutionResult run(String compilerId, String sourceCode, String stdin) {
        RestTemplate restTemplate = new RestTemplate();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", apiKey);

        Map<String, Object> body = new HashMap<>();
        body.put("compiler", compilerId);
        body.put("code", sourceCode);
        body.put("input", stdin == null ? "" : stdin);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
        return restTemplate.exchange(EXEC_URL, HttpMethod.POST, entity, ExecutionResult.class).getBody();
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class ExecutionResult {
        public String output;
        public String error;
        public String status; // "success" or "error" - see class javadoc for the error-fidelity caveat

        @JsonProperty("exit_code")
        public Integer exitCode;

        public String time;   // seconds, as a string, e.g. "0.0589" - excludes compile time
        public String memory; // KB, as a string, e.g. "15120"
    }
}
