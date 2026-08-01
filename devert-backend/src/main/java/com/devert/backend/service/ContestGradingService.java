package com.devert.backend.service;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.google.cloud.Timestamp;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.FieldValue;
import com.google.cloud.firestore.Firestore;

// Contest coding questions are "a contests/{id}/questions/{qid} doc + the
// exact same sampleTests/hiddenTests subcollection shape as a CodeLab
// problem" - graded through GradingService's shared runProblemTests() core
// (via its public gradeAgainstTests() wrapper), just against that reference
// instead of problems/{id}. Unlike CodeLab/Arena, this NEVER grants XP/Coins
// (contests are 100% reward-free by platform policy - see lib/contests.js's
// own comment on this) and writes its result to its own dedicated
// subcollection (submissions/{uid}/codingResults/{questionId}), never onto
// the parent submission doc directly - see lib/contests.js's
// fetchContestCodingResults for exactly why that separation matters (the
// parent doc's create/update firestore.rules branches are shaped around the
// student's own final MCQ submit, and a premature write there would flip
// which branch that later write has to satisfy).
@Service
public class ContestGradingService {

    @Autowired(required = false)
    private Firestore db;

    @Autowired
    private GradingService gradingService;

    public Map<String, Object> gradeContestSubmission(String uid, String contestId, String questionId, String language, String code) throws Exception {
        if (db == null) {
            throw new IllegalStateException("Contest grading isn't configured yet (missing FIREBASE_SERVICE_ACCOUNT_JSON).");
        }
        if (language == null || language.isBlank()) {
            throw new IllegalArgumentException("language is required.");
        }

        DocumentReference contestRef = db.collection("contests").document(contestId);
        DocumentSnapshot contest = contestRef.get().get();
        if (!contest.exists()) {
            throw new IllegalArgumentException("Contest not found: " + contestId);
        }

        DocumentReference questionRef = contestRef.collection("questions").document(questionId);
        DocumentSnapshot question = questionRef.get().get();
        if (!question.exists()) {
            throw new IllegalArgumentException("Question not found: " + questionId);
        }
        if (!"coding".equals(question.getString("type"))) {
            throw new IllegalArgumentException("This question isn't a coding question.");
        }

        // Registration required UNLESS this uid is a listed, enabled Mock
        // Reviewer - a reviewer never registers (see contest-reviewers.jsx),
        // and is very often reviewing a contest that is still in draft, with
        // no registrant at all yet. Mirrors the frontend's own dryRun bypass
        // in CampusContestAttempt's load() - a reviewer is checking the
        // paper, not participating in the contest.
        DocumentSnapshot registration = contestRef.collection("registrations").document(uid).get().get();
        DocumentSnapshot reviewerDoc = contestRef.collection("reviewers").document(uid).get().get();
        boolean isReviewer = reviewerDoc.exists() && !Boolean.FALSE.equals(reviewerDoc.getBoolean("enabled"));
        if (!registration.exists() && !isReviewer) {
            throw new IllegalArgumentException("You're not registered for this contest.");
        }
        boolean isDryRun = !registration.exists() && isReviewer;

        // Server-stamped time/paused check, never a client-reported "still in
        // time" - same reasoning as gradeArenaSubmission's elapsed-time check.
        // Skipped entirely for a dry run, same as the frontend's own gate.
        if (!isDryRun) {
            if (Boolean.TRUE.equals(contest.getBoolean("paused"))) {
                throw new IllegalArgumentException("This contest is currently paused by your institution admin - try again once it resumes.");
            }
            Timestamp contestEnd = contest.getTimestamp("contestEnd");
            if (contestEnd != null) {
                long graceMinutes = contest.contains("graceMinutes") && contest.getLong("graceMinutes") != null
                    ? contest.getLong("graceMinutes") : 0;
                long deadlineMs = contestEnd.toDate().getTime() + graceMinutes * 60_000L;
                if (System.currentTimeMillis() > deadlineMs) {
                    throw new IllegalArgumentException("The submission window for this contest has closed.");
                }
            }
        }

        double marks = question.contains("marks") && question.getDouble("marks") != null ? question.getDouble("marks") : 1.0;

        Map<String, Object> grade = gradingService.gradeAgainstTests(questionRef, language, code);
        int testsPassed = (Integer) grade.get("testsPassed");
        int testsTotal = (Integer) grade.get("testsTotal");
        // Proportional, not all-or-nothing - a contest awards partial credit for a
        // partially-correct solution (unlike CodeLab's own Accepted/not-Accepted
        // problem grading), matching how a marks-based exam question is usually
        // scored. Rounded to 2 decimals so the stored value stays human-readable.
        double score = testsTotal > 0 ? Math.round((marks * testsPassed / testsTotal) * 100.0) / 100.0 : 0.0;

        Map<String, Object> resultDoc = new HashMap<>();
        resultDoc.put("verdict", grade.get("verdict"));
        resultDoc.put("testsPassed", testsPassed);
        resultDoc.put("testsTotal", testsTotal);
        resultDoc.put("score", score);
        resultDoc.put("maxScore", marks);
        resultDoc.put("runtimeMs", grade.get("runtimeMs"));
        resultDoc.put("memoryKb", grade.get("memoryKb"));
        resultDoc.put("language", language.toLowerCase());
        resultDoc.put("gradedAt", FieldValue.serverTimestamp());

        // A dry run's coding results live under dryRuns/{uid}, never
        // submissions/{uid} - same isolation reasoning as the MCQ dry-run
        // write (lib/contests.js's submitContestDryRun): none of this may
        // reach the leaderboard, participantCount, or any average.
        DocumentReference resultRef = (isDryRun
            ? contestRef.collection("dryRuns").document(uid)
            : contestRef.collection("submissions").document(uid))
            .collection("codingResults").document(questionId);
        resultRef.set(resultDoc).get();

        return resultDoc;
    }
}
