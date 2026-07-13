package com.devert.backend.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.FieldValue;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;

// Runs entirely server-side: reads hidden test cases via the admin SDK (bypassing
// Firestore rules - this is the ONLY code path that ever reads them), grades against
// Judge0, then writes the submission and awards XP/coins itself. The client never sees
// hidden test content and never has a legal path to write a submission or its own
// grade - see firestore.rules's codelab_submissions/hiddenTests rules for the other
// half of this trust boundary.
@Service
public class GradingService {

    @Autowired(required = false)
    private Firestore db;

    @Autowired
    private Judge0Service judge0;

    public Map<String, Object> gradeSubmission(String uid, String problemId, String language, String code) throws Exception {
        if (db == null) {
            throw new IllegalStateException("CodeLab isn't configured yet (missing FIREBASE_SERVICE_ACCOUNT_JSON).");
        }
        Integer languageId = judge0.languageId(language);
        if (languageId == null) {
            throw new IllegalArgumentException("Unsupported language: " + language);
        }

        DocumentReference problemRef = db.collection("problems").document(problemId);
        DocumentSnapshot problem = problemRef.get().get();
        if (!problem.exists()) {
            throw new IllegalArgumentException("Problem not found: " + problemId);
        }

        List<QueryDocumentSnapshot> sampleTests = problemRef.collection("sampleTests").get().get().getDocuments();
        List<QueryDocumentSnapshot> hiddenTests = problemRef.collection("hiddenTests").get().get().getDocuments();

        int totalTests = sampleTests.size() + hiddenTests.size();
        int passed = 0;
        String verdict = "Accepted";
        long maxTimeMs = 0;
        long maxMemoryKb = 0;

        for (QueryDocumentSnapshot test : sampleTests) {
            TestOutcome outcome = runTest(languageId, code, test);
            passed += outcome.passed ? 1 : 0;
            maxTimeMs = Math.max(maxTimeMs, outcome.timeMs);
            maxMemoryKb = Math.max(maxMemoryKb, outcome.memoryKb);
            if (!outcome.passed && "Accepted".equals(verdict)) verdict = outcome.verdict;
        }
        for (QueryDocumentSnapshot test : hiddenTests) {
            TestOutcome outcome = runTest(languageId, code, test);
            passed += outcome.passed ? 1 : 0;
            maxTimeMs = Math.max(maxTimeMs, outcome.timeMs);
            maxMemoryKb = Math.max(maxMemoryKb, outcome.memoryKb);
            if (!outcome.passed && "Accepted".equals(verdict)) verdict = outcome.verdict;
        }
        if (totalTests == 0) verdict = "No Test Cases";

        boolean accepted = "Accepted".equals(verdict) && passed == totalTests && totalTests > 0;

        DocumentReference progressRef = db.collection("user_codelab_progress").document(uid);
        DocumentSnapshot progress = progressRef.get().get();
        boolean alreadySolved = progress.exists()
            && progress.contains("solvedProblems." + problemId)
            && Boolean.TRUE.equals(progress.get("solvedProblems." + problemId));

        long xpReward = problem.contains("xpReward") ? problem.getLong("xpReward") : 0;
        long coinReward = problem.contains("coinReward") ? problem.getLong("coinReward") : 0;
        long xpEarned = (accepted && !alreadySolved) ? xpReward : 0;
        long coinsEarned = (accepted && !alreadySolved) ? coinReward : 0;

        Map<String, Object> submission = new HashMap<>();
        submission.put("uid", uid);
        submission.put("problemId", problemId);
        submission.put("language", language);
        submission.put("code", code);
        submission.put("verdict", verdict);
        submission.put("testsPassed", passed);
        submission.put("testsTotal", totalTests);
        submission.put("runtimeMs", maxTimeMs);
        submission.put("memoryKb", maxMemoryKb);
        submission.put("xpEarned", xpEarned);
        submission.put("coinsEarned", coinsEarned);
        submission.put("createdAt", FieldValue.serverTimestamp());
        db.collection("codelab_submissions").add(submission).get();

        Map<String, Object> progressUpdate = new HashMap<>();
        progressUpdate.put("totalSubmissions", FieldValue.increment(1));
        progressUpdate.put("languageUsage." + language, FieldValue.increment(1));
        if (accepted && !alreadySolved) {
            progressUpdate.put("solvedProblems." + problemId, true);
            progressUpdate.put("problemsSolvedCount", FieldValue.increment(1));
        }
        progressRef.set(progressUpdate, com.google.cloud.firestore.SetOptions.merge()).get();

        Map<String, Object> problemUpdate = new HashMap<>();
        problemUpdate.put("totalSubmissions", FieldValue.increment(1));
        if (accepted) problemUpdate.put("acceptedSubmissions", FieldValue.increment(1));
        problemRef.set(problemUpdate, com.google.cloud.firestore.SetOptions.merge()).get();

        if (xpEarned > 0 || coinsEarned > 0) {
            Map<String, Object> userUpdate = new HashMap<>();
            userUpdate.put("xp", FieldValue.increment(xpEarned));
            userUpdate.put("credits", FieldValue.increment(coinsEarned));
            db.collection("users").document(uid).set(userUpdate, com.google.cloud.firestore.SetOptions.merge()).get();
        }

        Map<String, Object> result = new HashMap<>();
        result.put("verdict", verdict);
        result.put("testsPassed", passed);
        result.put("testsTotal", totalTests);
        result.put("xpEarned", xpEarned);
        result.put("coinsEarned", coinsEarned);
        result.put("runtimeMs", maxTimeMs);
        result.put("alreadySolved", alreadySolved);
        return result;
    }

    private TestOutcome runTest(int languageId, String code, QueryDocumentSnapshot test) {
        String input = test.contains("input") ? test.getString("input") : "";
        String expected = test.contains("expectedOutput") ? test.getString("expectedOutput") : "";
        Judge0Service.Judge0Result result = judge0.run(languageId, code, input, expected);

        TestOutcome outcome = new TestOutcome();
        outcome.timeMs = result != null && result.time != null ? (long) (Double.parseDouble(result.time) * 1000) : 0;
        outcome.memoryKb = result != null && result.memory != null ? result.memory : 0;

        int statusId = result != null && result.status != null ? result.status.id : -1;
        if (statusId == 3) {
            outcome.passed = true;
            outcome.verdict = "Accepted";
        } else if (statusId == 4) {
            outcome.passed = false;
            outcome.verdict = "Wrong Answer";
        } else if (statusId == 5) {
            outcome.passed = false;
            outcome.verdict = "Time Limit Exceeded";
        } else if (statusId == 6) {
            outcome.passed = false;
            outcome.verdict = "Compilation Error";
        } else if (statusId >= 7 && statusId <= 12) {
            outcome.passed = false;
            outcome.verdict = "Runtime Error";
        } else {
            outcome.passed = false;
            outcome.verdict = "Judge Error";
        }
        return outcome;
    }

    private static class TestOutcome {
        boolean passed;
        String verdict;
        long timeMs;
        long memoryKb;
    }
}
