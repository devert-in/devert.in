package com.devert.backend.service;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClientException;
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

    private static final Logger log = LoggerFactory.getLogger(CodeExecutionService.class);

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

    // One shared, timeout-bounded client rather than a `new RestTemplate()` per
    // execution. A submit runs every sample + hidden test back-to-back (8+ calls
    // for a typical contest coding question), so per-call construction meant a
    // fresh connection pool each time - and, worse, RestTemplate's default is NO
    // timeout at all, so one hung provider request could pin a Cloud Run request
    // thread indefinitely.
    // Deliberately tight. The service runs at maxScale=1 with a 300s Cloud Run
    // request timeout, and one submit runs 8+ tests sequentially - so the worst
    // case has to be (tests x attempts x read timeout) < 300s, or a submission
    // that was merely slow gets killed by the platform instead of returning.
    private static final int CONNECT_TIMEOUT_MS = 4_000;
    private static final int READ_TIMEOUT_MS = 10_000;
    private final RestTemplate restTemplate = buildRestTemplate();

    private static RestTemplate buildRestTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(CONNECT_TIMEOUT_MS);
        factory.setReadTimeout(READ_TIMEOUT_MS);
        return new RestTemplate(factory);
    }

    // Transient-failure retries. THE BUG THIS EXISTS FOR: this method used to call
    // restTemplate.exchange() bare. RestTemplate throws - it does not return a
    // non-2xx body - so a single 429 or 5xx from the provider raised a
    // RuntimeException that propagated through runTest -> runProblemTests ->
    // gradeAgainstTests -> gradeContestSubmission and out of
    // ContestGradingController's `catch (Exception e)` as a blanket HTTP 500.
    //
    // That is why "run sample tests" worked while "submit for grading" did not:
    // a run is 2 executions, a submit is every sample AND hidden test fired
    // back-to-back (8 for the contest question this was found on), which is
    // exactly the burst a free-tier quota rejects. runTest() was already written
    // to handle a null/non-success result per test, so the missing try/catch was
    // the whole defect.
    // A rejected-for-quota 429 comes back in milliseconds, so 3 attempts costs
    // roughly a second of backoff on the common path; it is only the rare
    // timeout case that approaches 3 x READ_TIMEOUT_MS. See the timeout note
    // above for why this product has to stay under the Cloud Run request budget.
    private static final int MAX_ATTEMPTS = 3;
    private static final long RETRY_BASE_DELAY_MS = 400;

    public ExecutionResult run(String compilerId, String sourceCode, String stdin) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", apiKey);

        Map<String, Object> body = new HashMap<>();
        body.put("compiler", compilerId);
        body.put("code", sourceCode);
        body.put("input", stdin == null ? "" : stdin);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        for (int attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
            try {
                return restTemplate.exchange(EXEC_URL, HttpMethod.POST, entity, ExecutionResult.class).getBody();
            } catch (HttpStatusCodeException e) {
                // 429 (quota/burst) and 5xx (provider wobble) are worth retrying;
                // any other 4xx is a request WE got wrong and will fail identically
                // however many times it is repeated.
                int status = e.getStatusCode().value();
                boolean retryable = status == 429 || status >= 500;
                log.warn("Code execution provider returned {} (attempt {}/{}){}",
                    status, attempt, MAX_ATTEMPTS, retryable ? ", retrying" : ", giving up");
                if (!retryable || attempt == MAX_ATTEMPTS) return null;
            } catch (ResourceAccessException e) {
                // Connect/read timeout or a dropped connection.
                log.warn("Code execution provider unreachable (attempt {}/{}): {}",
                    attempt, MAX_ATTEMPTS, e.getMessage());
                if (attempt == MAX_ATTEMPTS) return null;
            } catch (RestClientException e) {
                // Malformed/unparseable response - not retryable.
                log.warn("Code execution provider returned an unusable response: {}", e.getMessage());
                return null;
            }
            // Exponential backoff with jitter - 48 students submitting at once
            // would otherwise retry in lockstep and rebuild the same burst that
            // triggered the rejection.
            long delay = RETRY_BASE_DELAY_MS * (1L << (attempt - 1));
            try {
                Thread.sleep(delay + ThreadLocalRandom.current().nextLong(RETRY_BASE_DELAY_MS));
            } catch (InterruptedException ie) {
                Thread.currentThread().interrupt();
                return null;
            }
        }
        return null;
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
