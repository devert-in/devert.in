// Server-authoritative quiz attempts - the record that decides whether a quiz
// has already been submitted, whether it was passed, and whether it has been
// paid for.
//
// WHY THIS EXISTS
//
// Until now a topic quiz's entire state lived in React state plus a
// localStorage draft (lib/quizRandom.js's loadQuizDraft/saveQuizDraft). That
// had three consequences, all of them reported from production:
//
//   1. The "have you already submitted this?" question had no cross-device
//      answer. Two browsers each held their own `quizSubmitted` boolean, so a
//      page left open on a second machine still rendered an armed "Complete
//      Topic" button after the first machine had completed the topic. The
//      reward itself was never actually double-granted (completeTopic's
//      transaction re-reads completedTopicIds, and reward_grants is create-only
//      - the live ledger shows 3,866 grants with zero duplicate keys), but the
//      UI gave every appearance of it, and nothing server-side ever told the
//      stale tab it was stale.
//   2. Both the CS Core and GATE topic views ran a load-draft effect and a
//      save-draft effect against the same key in one commit, so switching
//      topics wrote the PREVIOUS topic's `submitted: true` under the NEW
//      topic's key - a topic you had never opened could render as submitted.
//   3. localStorage is student-writable. The submit gate was advisory.
//
// This collection replaces all three with one doc per (student, quiz) that
// Firestore rules make append-only: attempts can only ever increase, `passed`
// and `rewarded` can only ever flip false -> true, and only an admin can reset
// one. See firestore.rules' /quiz_attempts block.
//
// WHY ONE DOC RATHER THAN ONE DOC PER ATTEMPT
//
// The question every caller asks is "may this student submit, and have they
// been paid?" - that is a single-document read on a known id, which is also
// the only shape firestore.rules can authorize cheaply here (the same
// "list() is unprovable, get() by known id works" constraint documented on
// cscore_progress, gate_daily and problem_notes). Per-attempt history is kept
// inline in `history` (capped, see MAX_HISTORY) rather than as a subcollection,
// so the admin Reward Audit view needs no collection-group query.
import { db } from "@/lib/firebase";
import {
  doc, getDoc, setDoc, deleteDoc, runTransaction, serverTimestamp, increment,
} from "firebase/firestore";
import { grantRewards, isAlreadyGranted } from "@/lib/rewards";
import { policyFor, gradeQuiz, computeQuizReward } from "@/lib/rewardPolicy";

// Bounded so a quiz a module later configures for many attempts can't grow a
// document past Firestore's 1MB limit. The ledger and reward_grants remain the
// audit authority; this is a convenience trail.
const MAX_HISTORY = 20;

// uid first, and a Firebase Auth uid never contains '_', so rules can isolate
// the owner with attemptId.split('_')[0] exactly as every other per-user
// collection in firestore.rules already does.
export function attemptId(uid, moduleKey, scopeId) {
  return `${uid}_${moduleKey}_${scopeId}`;
}

export function attemptRef(uid, moduleKey, scopeId) {
  return doc(db, "quiz_attempts", attemptId(uid, moduleKey, scopeId));
}

export async function fetchAttempt(uid, moduleKey, scopeId) {
  if (!uid) return null;
  const snap = await getDoc(attemptRef(uid, moduleKey, scopeId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// What the UI needs to render a quiz correctly on a cold load, on a second
// device, or after a refresh - derived from the server record, never from
// localStorage. `locked` is the one the submit button keys off.
export function attemptState(attempt, policy) {
  const used = attempt?.attempts || 0;
  const passed = !!attempt?.passed;
  const rewarded = !!attempt?.rewarded;
  // A passed quiz is always locked: there is nothing left to earn and letting
  // it be resubmitted is exactly the farm this file exists to close. A failed
  // quiz locks once attempts are exhausted, or immediately when the module's
  // policy says lockOnFail.
  const exhausted = used >= policy.maxAttempts || (used > 0 && policy.lockOnFail);
  return {
    attemptsUsed: used,
    maxAttempts: policy.maxAttempts,
    attemptsLeft: Math.max(0, policy.maxAttempts - used),
    submitted: used > 0,
    passed,
    rewarded,
    locked: passed || exhausted,
    // Mirrors submitQuizAttempt's own `completed` formula exactly (see that
    // function's identical line) - a cold-loaded/reopened attempt has to agree
    // with what a fresh submission just returned, or the UI tells two
    // different stories about the same document depending on how it got here.
    // Only meaningful once `submitted` - an attempt not yet taken is neither
    // complete nor incomplete.
    completed: used > 0 && (passed || !policy.completionRequiresPass),
    lastCorrect: attempt?.lastCorrect ?? null,
    lastTotal: attempt?.lastTotal ?? null,
    lastPct: attempt?.lastPct ?? null,
    lastAnswers: attempt?.lastAnswers || null,
  };
}

/**
 * Grade and record one quiz submission, and - only if it passes - mark the
 * module's own completion and grant the reward, all in ONE transaction.
 *
 * Every read happens before every write (a Firestore transaction requirement),
 * which is also why the caller hands us `progressRef`/`progressPayload` rather
 * than doing its own completion write afterwards: splitting them means a
 * dropped connection between the two can strand a reward permanently, the
 * exact failure lib/dailyLearning.js's submitDayCompletion documents.
 *
 * Returns a discriminated result rather than throwing on the ordinary
 * already-submitted path, because "you already did this on another device" is
 * a normal thing to render, not an error:
 *   { status: "locked" }   - attempts exhausted or already passed; nothing written
 *   { status: "graded", passed, rewarded, correct, total, pct, xp, coins, ... }
 */
export async function submitQuizAttempt({
  uid,
  moduleKey,
  scopeId,
  mcqs = [],
  answers = {},
  item = null,
  progressRef = null,
  progressPayload = null,
  activityId,
  transactionType,
  sourceModule,
}) {
  if (!uid) return { status: "locked", reason: "not-signed-in" };

  const policy = policyFor(moduleKey, item);
  const ref = attemptRef(uid, moduleKey, scopeId);
  const ledgerActivity = policy.activity;
  const ledgerActivityId = activityId || scopeId;

  return runTransaction(db, async (tx) => {
    // ---- reads, all of them, first ----
    const snap = await tx.get(ref);
    const existing = snap.exists() ? snap.data() : null;
    const state = attemptState(existing, policy);

    // Cross-device stop. This is the check that was missing: a second browser
    // that never saw the first submission still lands here and is refused,
    // because the answer lives on the server rather than in that tab's memory.
    if (state.locked) {
      return {
        status: "locked",
        reason: state.passed ? "already-passed" : "attempts-exhausted",
        ...state,
      };
    }

    const progressSnap = progressRef ? await tx.get(progressRef) : null;
    const progressData = progressSnap?.exists() ? progressSnap.data() : null;

    // Legacy completions predate this collection entirely - a topic already in
    // completedTopicIds was paid under the old rules and must never pay twice,
    // regardless of what this attempt scores.
    const alreadyCompleted = !!progressPayload?.completedIdField
      && (progressData?.[progressPayload.completedIdField] || []).includes(progressPayload.completedId);

    // Ledger is the cross-module backstop; consulted as a read here so the
    // decision to grant is made before any write, per transaction rules.
    const alreadyPaid = alreadyCompleted
      || await isAlreadyGranted(tx, uid, ledgerActivity, ledgerActivityId);

    // Current balance, read here (before any write) purely so a penalty can be
    // floored - a bad paper must never drive a student's XP below zero, since
    // XP converts to real INR through the Wallet.
    const userRef = doc(db, "users", uid);
    const userSnap = alreadyPaid ? null : await tx.get(userRef);
    const currentXp = userSnap?.exists() ? (userSnap.data().xp || 0) : 0;

    // ---- grade, per question ----
    const result = gradeQuiz(mcqs, answers, policy.passPct);
    const reward = computeQuizReward(policy, result);
    const attemptNo = state.attemptsUsed + 1;

    // Payment happens on the first GRADED attempt whether it passes or fails -
    // a failed paper still has to be able to deduct for its wrong answers.
    // Completion (below) is what passing actually gates. The create-only ledger
    // means this can only ever happen once per (student, topic).
    const willReward = !alreadyPaid;
    const xpDelta = willReward ? Math.max(reward.xpNet, -currentXp) : 0;

    // ---- writes ----
    const historyEntry = {
      attemptNo,
      correct: result.correct,
      wrong: result.wrong,
      unanswered: result.unanswered,
      total: result.total,
      pct: Number(result.pct.toFixed(4)),
      passed: result.passed,
      xpEarned: willReward ? reward.xpEarned : 0,
      xpPenalty: willReward ? reward.xpPenalty : 0,
      xpNet: xpDelta,
      coins: willReward ? reward.coins : 0,
      // Client clock, and labelled as such - serverTimestamp() is not usable
      // inside an array element. The authoritative time is lastSubmittedAt.
      atClient: new Date().toISOString(),
    };
    const history = [...(existing?.history || []), historyEntry].slice(-MAX_HISTORY);

    tx.set(ref, {
      uid,
      module: moduleKey,
      scopeId,
      attempts: increment(1),
      // Sticky: once true, never written back to false by this path. Rules
      // enforce the same thing independently.
      passed: state.passed || result.passed,
      rewarded: state.rewarded || willReward,
      lastCorrect: result.correct,
      lastWrong: result.wrong,
      lastUnanswered: result.unanswered,
      lastTotal: result.total,
      lastPct: Number(result.pct.toFixed(4)),
      // The student's actual answer sheet. Recorded because until now nothing
      // anywhere stored whether a CS Core or GATE answer was RIGHT - which is
      // why historical XP cannot be recomputed against correctness: the data to
      // do it with was never written. From here on it is.
      lastAnswers: answers,
      lastPassed: result.passed,
      lastXpEarned: willReward ? reward.xpEarned : 0,
      lastXpPenalty: willReward ? reward.xpPenalty : 0,
      lastXpNet: xpDelta,
      history,
      firstSubmittedAt: existing?.firstSubmittedAt || serverTimestamp(),
      lastSubmittedAt: serverTimestamp(),
    }, { merge: true });

    // COMPLETION is gated on passing UNLESS the module's policy says otherwise
    // (policy.completionRequiresPass: false - currently only cscore). Where it
    // does gate, a paper below passPct records its attempt and its per-question
    // XP movement, but does not mark the topic complete and does not advance
    // progress - so a wrong answer can no longer buy a tick. Where it doesn't,
    // any attempted paper (right or wrong) advances progress; only the XP
    // payment below still depends on correctness.
    const completed = result.passed || !policy.completionRequiresPass;
    if (completed && progressRef && progressPayload?.data) {
      tx.set(progressRef, progressPayload.data, { merge: true });
    }

    // PAYMENT is per question and happens once. Correct answers earn; wrong (and
    // by default unanswered) answers deduct. Coins and Score carry only the
    // positive half - see lib/rewardPolicy.js's header for why those two are
    // one-way.
    if (willReward) {
      grantRewards(uid, {
        xpReward: xpDelta,
        coinReward: reward.coins,
        scoreReward: reward.score,
        transactionType: transactionType || `${moduleKey}_quiz_graded`,
        activityType: ledgerActivity,
        activityId: ledgerActivityId,
        sourceModule: sourceModule || moduleKey,
      }, tx);
    }

    return {
      status: "graded",
      passed: result.passed,
      // Distinct from `passed` only where policy.completionRequiresPass is
      // false - everywhere else completed === passed, so existing callers that
      // never learned about this field keep behaving exactly as before.
      completed,
      rewarded: willReward,
      alreadyPaid,
      correct: result.correct,
      wrong: result.wrong,
      unanswered: result.unanswered,
      total: result.total,
      pct: result.pct,
      passPct: policy.passPct,
      perQuestion: result.perQuestion,
      xpEarned: willReward ? reward.xpEarned : 0,
      xpPenalty: willReward ? reward.xpPenalty : 0,
      xp: xpDelta,
      coins: willReward ? reward.coins : 0,
      score: willReward ? reward.score : 0,
      perCorrectXp: reward.perCorrectXp,
      perWrongXp: reward.perWrongXp,
      attemptsUsed: attemptNo,
      maxAttempts: policy.maxAttempts,
      attemptsLeft: Math.max(0, policy.maxAttempts - attemptNo),
      locked: result.passed || attemptNo >= policy.maxAttempts || policy.lockOnFail,
    };
  });
}

// Admin-only: re-open a quiz for one student. Deletes the attempt record so the
// student may sit it again. Deliberately does NOT touch reward_grants or the
// module's completedTopicIds - a student who already legitimately earned this
// topic keeps the XP, and the create-only ledger still stops a second payout.
// Use resetModuleProgress (below) when the intent really is to claw a
// completion back.
export async function adminResetAttempt(uid, moduleKey, scopeId) {
  await deleteDoc(attemptRef(uid, moduleKey, scopeId));
}

// Admin-only: mark an attempt as re-payable again, for the genuine
// "this student was wrongly denied" case. Requires an admin token - the rules
// block every client from writing `rewarded` back to false.
export async function adminClearRewardedFlag(uid, moduleKey, scopeId) {
  await setDoc(attemptRef(uid, moduleKey, scopeId), { rewarded: false }, { merge: true });
}
