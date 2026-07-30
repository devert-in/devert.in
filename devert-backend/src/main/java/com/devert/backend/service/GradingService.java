package com.devert.backend.service;

import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
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
import com.google.cloud.firestore.SetOptions;

// Runs entirely server-side: reads hidden test cases via the admin SDK (bypassing
// Firestore rules - this is the ONLY code path that ever reads them), grades by running
// each test through CodeExecutionService and comparing output itself, then writes the
// submission/progress/completion record. Neither DSA Practice/CodeLab nor Arena grants
// XP/Coins/Score (platform policy: only Daily Learning, Programming, and CS Core do) -
// this class only ever writes completion tracking (solved map, streak, arenaWins), never
// a reward. The client never sees hidden test content and never has a legal path to
// write a submission or its own grade - see firestore.rules's codelab_submissions/
// hiddenTests rules for the other half of this trust boundary.
@Service
public class GradingService {

    @Autowired(required = false)
    private Firestore db;

    @Autowired
    private CodeExecutionService codeExecutionService;

    public Map<String, Object> gradeSubmission(String uid, String problemId, String language, String code, boolean suppressReward) throws Exception {
        if (db == null) {
            throw new IllegalStateException("CodeLab isn't configured yet (missing FIREBASE_SERVICE_ACCOUNT_JSON).");
        }
        // Normalize casing before persisting anywhere - languageId() (inside
        // runProblemTests) already lowercases for the lookup, but a raw API call with
        // e.g. "Java" would otherwise fragment languageUsage stats into a separate key
        // from "java".
        language = language.toLowerCase();

        DocumentReference problemRef = db.collection("problems").document(problemId);
        DocumentSnapshot problem = problemRef.get().get();
        if (!problem.exists()) {
            throw new IllegalArgumentException("Problem not found: " + problemId);
        }

        ProblemGradeResult grade = runProblemTests(problemRef, language, code);

        boolean accepted = grade.accepted;
        // DSA Practice/CodeLab grants no XP/Coins/Score at all (platform policy: only
        // Daily Learning, Programming, and CS Core reward) - xpReward/coinReward are
        // hardcoded to 0 regardless of the problem's own authored xpReward/coinReward
        // fields or the (now-vestigial, always-0-effect) suppressReward flag.
        // solvedProblems/problemsSolvedCount/streak/submission history are all still
        // fully tracked below - only the reward amounts are gone.
        long xpReward = 0;
        long coinReward = 0;

        DocumentReference progressRef = db.collection("user_codelab_progress").document(uid);
        DocumentReference userRef = db.collection("users").document(uid);
        DocumentReference submissionRef = db.collection("codelab_submissions").document();

        // Loop-mutated locals aren't effectively final, so the transaction lambda below
        // needs its own stable copies to close over.
        String finalLanguage = language;
        String finalVerdict = grade.verdict;
        int finalPassed = grade.passed;
        int totalTests = grade.totalTests;
        long finalMaxTimeMs = grade.maxTimeMs;
        long finalMaxMemoryKb = grade.maxMemoryKb;
        List<Map<String, Object>> finalTestSummaries = grade.testSummaries;

        // Wrapped in a transaction so two near-simultaneous submissions for the same
        // problem can't both read solvedProblems=false and both get awarded XP/coins:
        // Firestore retries this whole callback if progressRef changes underneath it,
        // so the loser of the race re-reads an already-solved doc and earns nothing.
        return db.runTransaction(transaction -> {
            DocumentSnapshot progressSnap = transaction.get(progressRef).get();
            // Only read on an accepted submission - a wrong answer never touches streak,
            // so there's nothing worth an extra read for otherwise. Firestore requires
            // every transaction read before any write, so this has to happen up here.
            DocumentSnapshot userSnap = accepted ? transaction.get(userRef).get() : null;

            boolean alreadySolved = progressSnap.exists()
                && progressSnap.contains("solvedProblems." + problemId)
                && Boolean.TRUE.equals(progressSnap.get("solvedProblems." + problemId));

            long xpEarned = (accepted && !alreadySolved) ? xpReward : 0;
            long coinsEarned = (accepted && !alreadySolved) ? coinReward : 0;

            // Streak: mirrors Aptitude/Grind's own day/yesterday/reset rule (see
            // aptitude-section.jsx) - a correct submission is what keeps the streak
            // alive, same as Aptitude's "first correct answer of the day," on ANY
            // accepted submission (including re-solving an already-solved problem),
            // not just a brand-new solve. IST (UTC+5:30) to match Aptitude's own clock.
            Long newStreak = null;
            String today = null;
            Long currentStreak = null;
            if (accepted) {
                ZoneOffset ist = ZoneOffset.ofHoursMinutes(5, 30);
                today = LocalDate.now(ist).toString();
                String lastSolvedDate = userSnap != null && userSnap.contains("lastSolvedDate") ? userSnap.getString("lastSolvedDate") : "";
                currentStreak = userSnap != null && userSnap.contains("streak") ? userSnap.getLong("streak") : 0;
                if (!today.equals(lastSolvedDate)) {
                    String yesterday = LocalDate.now(ist).minusDays(1).toString();
                    newStreak = yesterday.equals(lastSolvedDate) ? currentStreak + 1 : 1;
                }
            }

            Map<String, Object> submission = new HashMap<>();
            submission.put("uid", uid);
            submission.put("problemId", problemId);
            submission.put("language", finalLanguage);
            submission.put("code", code);
            submission.put("verdict", finalVerdict);
            submission.put("testsPassed", finalPassed);
            submission.put("testsTotal", totalTests);
            submission.put("runtimeMs", finalMaxTimeMs);
            submission.put("memoryKb", finalMaxMemoryKb);
            submission.put("xpEarned", xpEarned);
            submission.put("coinsEarned", coinsEarned);
            submission.put("testSummaries", finalTestSummaries);
            submission.put("createdAt", FieldValue.serverTimestamp());
            transaction.set(submissionRef, submission);

            // NOTE: these two fields are genuinely NESTED Maps, not dotted string
            // keys like "languageUsage." + finalLanguage - Map<String,Object> keys
            // passed to set(..., SetOptions.merge()) are taken LITERALLY (a key
            // containing a period becomes a real field named e.g.
            // "languageUsage.java", not a nested field languageUsage -> java).
            // Dotted-string-as-nested-path only works for update()/FieldPath, not
            // for a plain Map given to set(merge). A real nested Map object here
            // merges correctly (only the touched sub-key changes, siblings like
            // other languages/problems are left alone) - see the historical bug
            // this replaced, which silently created garbage top-level fields
            // literally named "solvedProblems.<problemId>" and meant
            // alreadySolved (below) could never find a real solve, so every
            // resubmission of an already-accepted problem re-awarded XP/coins.
            Map<String, Object> progressUpdate = new HashMap<>();
            progressUpdate.put("totalSubmissions", FieldValue.increment(1));
            progressUpdate.put("languageUsage", Map.of(finalLanguage, FieldValue.increment(1)));
            if (accepted && !alreadySolved) {
                progressUpdate.put("solvedProblems", Map.of(problemId, true));
                progressUpdate.put("problemsSolvedCount", FieldValue.increment(1));
            }
            transaction.set(progressRef, progressUpdate, SetOptions.merge());

            Map<String, Object> problemUpdate = new HashMap<>();
            problemUpdate.put("totalSubmissions", FieldValue.increment(1));
            if (accepted) problemUpdate.put("acceptedSubmissions", FieldValue.increment(1));
            transaction.set(problemRef, problemUpdate, SetOptions.merge());

            // No xp/score/credits/coins writes here anymore (CodeLab grants no
            // reward) - only progress/completion tracking survives: the
            // denormalized problemsSolvedCount (so a "Top Solvers" leaderboard can
            // query users/{uid} directly - user_codelab_progress itself stays
            // owner-only readable) and the streak/lastSolvedDate carried over from
            // before. No reward_grants ledger entry either - there is nothing to
            // audit once nothing is granted.
            if ((accepted && !alreadySolved) || newStreak != null) {
                Map<String, Object> userUpdate = new HashMap<>();
                if (accepted && !alreadySolved) userUpdate.put("problemsSolvedCount", FieldValue.increment(1));
                if (newStreak != null) { userUpdate.put("streak", newStreak); userUpdate.put("lastSolvedDate", today); }
                transaction.set(userRef, userUpdate, SetOptions.merge());
            }

            Map<String, Object> result = new HashMap<>();
            result.put("verdict", finalVerdict);
            result.put("testsPassed", finalPassed);
            result.put("testsTotal", totalTests);
            result.put("xpEarned", xpEarned);
            result.put("coinsEarned", coinsEarned);
            result.put("runtimeMs", finalMaxTimeMs);
            result.put("memoryKb", finalMaxMemoryKb);
            result.put("alreadySolved", alreadySolved);
            result.put("testSummaries", finalTestSummaries);
            if (accepted) result.put("streak", newStreak != null ? newStreak : currentStreak);
            return result;
        }).get();
    }

    // Arena solo challenges are "a CodeLab problem + a timed session wrapper" - graded
    // through this exact same execution/hidden-test pipeline, just with a different reward
    // shape (arena_matches' own xpBase + a speed bonus, not the problem's xpReward/
    // coinReward) and a different collection to resolve. See firestore.rules'
    // arena_matches block: the client can create a session and self-report a harmless
    // loss, but only this method (via firebase-admin, bypassing rules) can ever flip a
    // match to "won" or touch xp/arenaWins.
    public Map<String, Object> gradeArenaSubmission(String uid, String matchId, String language, String code) throws Exception {
        if (db == null) {
            throw new IllegalStateException("Arena grading isn't configured yet (missing FIREBASE_SERVICE_ACCOUNT_JSON).");
        }
        language = language.toLowerCase();

        DocumentReference matchRef = db.collection("arena_matches").document(matchId);
        DocumentSnapshot match = matchRef.get().get();
        if (!match.exists()) {
            throw new IllegalArgumentException("Match not found: " + matchId);
        }
        if (!uid.equals(match.getString("uid"))) {
            throw new IllegalArgumentException("This match doesn't belong to you.");
        }
        if (!"in_progress".equals(match.getString("status"))) {
            throw new IllegalArgumentException("This match has already been resolved.");
        }

        String problemId = match.getString("problemId");
        DocumentReference problemRef = db.collection("problems").document(problemId);
        if (!problemRef.get().get().exists()) {
            throw new IllegalArgumentException("Problem not found: " + problemId);
        }

        long startedAtMs = match.getTimestamp("startedAt") != null
            ? match.getTimestamp("startedAt").toDate().getTime() : System.currentTimeMillis();
        long timeLimitSeconds = match.contains("timeLimitSeconds") ? match.getLong("timeLimitSeconds") : 0;
        long elapsedSeconds = (System.currentTimeMillis() - startedAtMs) / 1000;

        Map<String, Object> result = new HashMap<>();
        // Decided server-side from the session's own server-stamped startedAt, not a
        // client-reported "time remaining" - a paused tab or clock skew can't buy extra time.
        if (timeLimitSeconds > 0 && elapsedSeconds > timeLimitSeconds) {
            result.put("verdict", "Expired");
            result.put("testsPassed", 0);
            result.put("testsTotal", 0);
            result.put("xpEarned", 0);
            result.put("runtimeMs", 0);
            return result;
        }

        ProblemGradeResult grade = runProblemTests(problemRef, language, code);
        if (!grade.accepted) {
            result.put("verdict", grade.verdict);
            result.put("testsPassed", grade.passed);
            result.put("testsTotal", grade.totalTests);
            result.put("xpEarned", 0);
            result.put("runtimeMs", grade.maxTimeMs);
            return result;
        }

        // Arena grants no XP/Coins/Score (platform policy: only Daily Learning,
        // Programming, and CS Core reward) - xpEarned is always 0 in every
        // response/doc field below, not a computed-but-uncredited number, so no
        // frontend surface can end up displaying a reward that was never granted.
        long xpEarned = 0;
        DocumentReference userRef = db.collection("users").document(uid);

        // Transaction re-reads the match's status fresh, so two near-simultaneous
        // submits for the same match can't both credit XP - the loser of the race
        // sees status is no longer "in_progress" and earns nothing.
        return db.runTransaction(transaction -> {
            DocumentSnapshot freshMatch = transaction.get(matchRef).get();
            if (!"in_progress".equals(freshMatch.getString("status"))) {
                Map<String, Object> alreadyResolved = new HashMap<>();
                alreadyResolved.put("verdict", grade.verdict);
                alreadyResolved.put("testsPassed", grade.passed);
                alreadyResolved.put("testsTotal", grade.totalTests);
                alreadyResolved.put("xpEarned", 0);
                alreadyResolved.put("runtimeMs", grade.maxTimeMs);
                return alreadyResolved;
            }

            Map<String, Object> matchUpdate = new HashMap<>();
            matchUpdate.put("status", "won");
            matchUpdate.put("finishedAt", FieldValue.serverTimestamp());
            matchUpdate.put("testsPassed", grade.passed);
            matchUpdate.put("testsTotal", grade.totalTests);
            matchUpdate.put("xpEarned", xpEarned);
            transaction.set(matchRef, matchUpdate, SetOptions.merge());

            // Only arenaWins (a completion counter) is tracked here now - no
            // xp/score increment and no reward_grants ledger entry, since Arena
            // grants nothing to credit or audit.
            Map<String, Object> userUpdate = new HashMap<>();
            userUpdate.put("arenaWins", FieldValue.increment(1));
            transaction.set(userRef, userUpdate, SetOptions.merge());

            Map<String, Object> out = new HashMap<>();
            out.put("verdict", "Accepted");
            out.put("testsPassed", grade.passed);
            out.put("testsTotal", grade.totalTests);
            out.put("xpEarned", xpEarned);
            out.put("runtimeMs", grade.maxTimeMs);
            return out;
        }).get();
    }

    // Shared grading core: runs every sample + hidden test for a problem and
    // aggregates pass/fail - used by both CodeLab's gradeSubmission and Arena's
    // gradeArenaSubmission, which differ only in what happens after (reward shape,
    // which collection gets resolved), not in how a submission is judged.
    private ProblemGradeResult runProblemTests(DocumentReference problemRef, String language, String code) throws Exception {
        String compilerId = codeExecutionService.compilerId(language);
        if (compilerId == null) {
            throw new IllegalArgumentException("Unsupported language: " + language);
        }

        List<QueryDocumentSnapshot> sampleTests = problemRef.collection("sampleTests").get().get().getDocuments();
        List<QueryDocumentSnapshot> hiddenTests = problemRef.collection("hiddenTests").get().get().getDocuments();

        int totalTests = sampleTests.size() + hiddenTests.size();
        int passed = 0;
        String verdict = "Accepted";
        long maxTimeMs = 0;
        long maxMemoryKb = 0;
        // Pass/fail (+ which verdict) per test, never the input/expected/actual values -
        // hidden test content must never reach the client (see this class's own header
        // comment), and sample test replay already happens client-side via /run, so the
        // submit response stays uniform rather than special-casing samples here too.
        List<Map<String, Object>> testSummaries = new ArrayList<>();

        int sampleIndex = 0;
        for (QueryDocumentSnapshot test : sampleTests) {
            sampleIndex++;
            TestOutcome outcome = runTest(compilerId, code, test);
            passed += outcome.passed ? 1 : 0;
            maxTimeMs = Math.max(maxTimeMs, outcome.timeMs);
            maxMemoryKb = Math.max(maxMemoryKb, outcome.memoryKb);
            if (!outcome.passed && "Accepted".equals(verdict)) verdict = outcome.verdict;
            testSummaries.add(testSummary("Sample Test " + sampleIndex, outcome));
        }
        int hiddenIndex = 0;
        for (QueryDocumentSnapshot test : hiddenTests) {
            hiddenIndex++;
            TestOutcome outcome = runTest(compilerId, code, test);
            passed += outcome.passed ? 1 : 0;
            maxTimeMs = Math.max(maxTimeMs, outcome.timeMs);
            maxMemoryKb = Math.max(maxMemoryKb, outcome.memoryKb);
            if (!outcome.passed && "Accepted".equals(verdict)) verdict = outcome.verdict;
            testSummaries.add(testSummary("Hidden Test " + hiddenIndex, outcome));
        }
        if (totalTests == 0) verdict = "No Test Cases";

        ProblemGradeResult result = new ProblemGradeResult();
        result.verdict = verdict;
        result.passed = passed;
        result.totalTests = totalTests;
        result.maxTimeMs = maxTimeMs;
        result.maxMemoryKb = maxMemoryKb;
        result.testSummaries = testSummaries;
        result.accepted = "Accepted".equals(verdict) && passed == totalTests && totalTests > 0;
        return result;
    }

    // OnlineCompiler.io doesn't compare output against an expected answer itself (Judge0
    // did) - so the pass/fail call is made here, by trimmed string equality, same as
    // Judge0's own whitespace-trimmed comparison rule.
    private TestOutcome runTest(String compilerId, String code, QueryDocumentSnapshot test) {
        String input = test.contains("input") ? test.getString("input") : "";
        String expected = test.contains("expectedOutput") ? test.getString("expectedOutput") : "";
        CodeExecutionService.ExecutionResult result = codeExecutionService.run(compilerId, code, input);

        TestOutcome outcome = new TestOutcome();
        outcome.timeMs = parseSecondsToMs(result != null ? result.time : null);
        outcome.memoryKb = parseMemoryKb(result != null ? result.memory : null);

        if (result == null) {
            outcome.passed = false;
            outcome.verdict = "Judge Error";
            return outcome;
        }
        if (!"success".equals(result.status)) {
            // See CodeExecutionService's class comment: this provider can't distinguish
            // Compilation Error / Runtime Error / Time Limit Exceeded for most languages,
            // so "Error" is the most honest single verdict across all 5 languages.
            outcome.passed = false;
            outcome.verdict = "Error";
            return outcome;
        }
        String actual = result.output == null ? "" : result.output.trim();
        if (actual.equals(expected.trim())) {
            outcome.passed = true;
            outcome.verdict = "Accepted";
        } else {
            outcome.passed = false;
            outcome.verdict = "Wrong Answer";
        }
        return outcome;
    }

    private static Map<String, Object> testSummary(String label, TestOutcome outcome) {
        Map<String, Object> summary = new HashMap<>();
        summary.put("label", label);
        summary.put("passed", outcome.passed);
        summary.put("verdict", outcome.verdict);
        return summary;
    }

    private static long parseSecondsToMs(String seconds) {
        try {
            return (long) (Double.parseDouble(seconds) * 1000);
        } catch (Exception e) {
            return 0;
        }
    }

    private static long parseMemoryKb(String memory) {
        try {
            return (long) Double.parseDouble(memory);
        } catch (Exception e) {
            return 0;
        }
    }

    private static class TestOutcome {
        boolean passed;
        String verdict;
        long timeMs;
        long memoryKb;
    }

    private static class ProblemGradeResult {
        String verdict;
        int passed;
        int totalTests;
        long maxTimeMs;
        long maxMemoryKb;
        List<Map<String, Object>> testSummaries;
        boolean accepted;
    }
}
