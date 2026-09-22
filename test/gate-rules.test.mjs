// Regression tests for the GATE module's security boundaries.
//
// CLAUDE.md is explicit that firestore.rules IS the authority boundary for this
// project - nothing server-side double-checks it. The GATE module adds three
// boundaries worth pinning down with tests rather than trusting to a comment:
//
//   1. A test's answer keys are unreadable until YOUR OWN attempt is submitted.
//      This is what makes client-side grading honest at all.
//   2. completedTopicIds is monotonic, so a student cannot arrayRemove a topic
//      and re-earn its XP/coins. Same reward-replay exploit already closed on
//      programming_progress and cscore_progress.
//   3. Attempt documents (which contain answers) are owner-only, while the
//      answer-free per-test results docs are readable to signed-in users so
//      leaderboards work. Getting this pair backwards would leak answers.
//
// Plus the list()-provability trap this codebase has hit repeatedly: a rule that
// checks a doc-ID path segment cannot back a where()-filtered list() query.
// fetchMyAttempts depends on that, so it is tested as a real query.
//
// Run with: npm test   (or `node --test test/` against a running emulator)
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "fs";
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} from "@firebase/rules-unit-testing";
import { collection, query, where, orderBy, limit, getDocs, getCountFromServer } from "firebase/firestore";

let testEnv;

test.before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "devert-gate-rules-test",
    firestore: {
      rules: readFileSync("firestore.rules", "utf8"),
      host: "127.0.0.1",
      port: 8089,
    },
  });
});

test.after(async () => { await testEnv.cleanup(); });

test.beforeEach(async () => {
  await testEnv.clearFirestore();
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await db.doc("gatePapers/cs").set({ name: "GATE CS", status: "published", audiences: ["legacy"], order: 10 });
    await db.doc("gatePapers/draft-paper").set({ name: "Unfinished", status: "draft", order: 20 });
    await db.doc("gatePapers/cs/subjects/algorithms").set({ name: "Algorithms", status: "published", audiences: ["legacy"] });
    await db.doc("gatePapers/cs/subjects/algorithms/topics/sorting").set({ title: "Sorting", status: "published", audiences: ["legacy"] });
    await db.doc("gatePapers/cs/subjects/algorithms/topics/unfinished").set({ title: "WIP", status: "draft" });

    await db.doc("gate_pyqs/pyq1").set({ paperId: "cs", status: "published", audiences: ["legacy"], question: "Q", solution: "S" });
    await db.doc("gate_pyqs/pyq-draft").set({ paperId: "cs", status: "draft", question: "Q", solution: "S" });

    await db.doc("gate_tests/test1").set({ paperId: "cs", status: "published", audiences: ["legacy"], title: "Mock 1", durationMinutes: 180 });
    await db.doc("gate_tests/test1/questions/q1").set({ question: "2+2?", marks: 1, questionType: "mcq" });
    await db.doc("gate_tests/test1/answerKeys/q1").set({ correctOptionIds: ["b"], explanation: "It is 4." });
  });
});

// ── published vs draft content ──────────────────────────────────────────────

test("a student reads published GATE content but never drafts", async () => {
  const student = testEnv.authenticatedContext("student-uid");
  const db = student.firestore();
  await assertSucceeds(db.doc("gatePapers/cs").get());
  await assertFails(db.doc("gatePapers/draft-paper").get());
  await assertSucceeds(db.doc("gatePapers/cs/subjects/algorithms/topics/sorting").get());
  await assertFails(db.doc("gatePapers/cs/subjects/algorithms/topics/unfinished").get());
  await assertSucceeds(db.doc("gate_pyqs/pyq1").get());
  await assertFails(db.doc("gate_pyqs/pyq-draft").get());
});

// ── the PDF-extracted draft bank ────────────────────────────────────────────
//
// scripts/extract-gate-pyqs.mjs imports over a thousand questions pulled out of
// the official question-paper PDFs, every one as status:"draft" because the
// source papers carry NO answer keys and the extraction loses mathematical
// symbols. The single property that makes that import safe is that a draft is
// unreachable from every student-facing path - not just from a direct get(),
// which is all the test above proves, but from the LIST and COUNT queries the
// product actually issues. Those are separately provable in firestore.rules and
// have their own failure modes, so they get their own tests.

test("fetchPyqs' real query shape is permitted, and returns no drafts", async () => {
  const student = testEnv.authenticatedContext("student-uid");
  const db = student.firestore();
  // Exactly the query lib/gatePyq.js's fetchPyqs() builds for a non-admin.
  const snap = await assertSucceeds(getDocs(query(
    collection(db, "gate_pyqs"),
    where("paperId", "==", "cs"),
    where("status", "==", "published"),
  )));
  assert.deepEqual(snap.docs.map(d => d.id), ["pyq1"]);
});

test("dropping the status filter denies the whole PYQ list rather than leaking drafts", async () => {
  const student = testEnv.authenticatedContext("student-uid");
  const db = student.firestore();
  // The trap lib/programming.js's fetchLanguages comment warns about: an
  // unfiltered list is DENIED outright, it does not quietly return the
  // published subset. So "filter client-side instead" is not an option a
  // future change can accidentally take.
  await assertFails(getDocs(query(collection(db, "gate_pyqs"), where("paperId", "==", "cs"))));
  await assertFails(getDocs(collection(db, "gate_pyqs")));
});

test("the landing page's PYQ count works signed-out and excludes drafts", async () => {
  // lib/campusCatalog.js's countPublishedPyqs(), issued by an anonymous
  // visitor on campus.devert.in. Two ways this breaks silently and both are
  // covered here: if rules denied it the landing page would show a dash
  // forever, and if the filter were dropped the advertised figure would
  // include every unreviewed PDF extraction.
  const visitor = testEnv.unauthenticatedContext();
  const snap = await assertSucceeds(getCountFromServer(query(
    collection(visitor.firestore(), "gate_pyqs"),
    where("status", "==", "published"),
  )));
  assert.equal(snap.data().count, 1);
});

test("an unfiltered PYQ count is denied, so drafts can never be counted", async () => {
  const visitor = testEnv.unauthenticatedContext();
  await assertFails(getCountFromServer(collection(visitor.firestore(), "gate_pyqs")));
});

test("the landing page's GATE paper query works signed-out", async () => {
  // lib/campusCatalog.js's fetchGatePapers(). Same filters lib/gate.js's
  // fetchPapers() uses; pinned here because the landing page is the one caller
  // that issues it with no signed-in user at all.
  const visitor = testEnv.unauthenticatedContext();
  const snap = await assertSucceeds(getDocs(query(
    collection(visitor.firestore(), "gatePapers"),
    where("status", "==", "published"),
    where("audiences", "array-contains-any", ["public", "legacy"]),
  )));
  assert.deepEqual(snap.docs.map(d => d.id), ["cs"]);
});

test("a student can never write GATE catalog content", async () => {
  const student = testEnv.authenticatedContext("student-uid");
  const db = student.firestore();
  await assertFails(db.doc("gatePapers/cs").set({ name: "hacked" }, { merge: true }));
  await assertFails(db.doc("gatePapers/cs/subjects/algorithms/topics/sorting").set({ title: "hacked" }, { merge: true }));
  await assertFails(db.doc("gate_pyqs/pyq1").set({ question: "hacked" }, { merge: true }));
  await assertFails(db.doc("gate_tests/test1").set({ title: "hacked" }, { merge: true }));
});

test("a published test's questions are readable, so a student can attempt it", async () => {
  const student = testEnv.authenticatedContext("student-uid");
  await assertSucceeds(student.firestore().doc("gate_tests/test1/questions/q1").get());
});

// ── THE testing-engine boundary: answer keys ────────────────────────────────

test("answer keys are DENIED before submitting, and only to the student who submitted", async () => {
  const student = testEnv.authenticatedContext("student-uid");
  const other = testEnv.authenticatedContext("other-uid");

  // No attempt at all yet.
  await assertFails(student.firestore().doc("gate_tests/test1/answerKeys/q1").get());

  // An attempt exists but is NOT submitted - still denied. This is the case that
  // matters: it is exactly the state a student is in mid-paper.
  await assertSucceeds(student.firestore().doc("gate_attempts/student-uid_test1").set({
    uid: "student-uid", paperId: "cs", testId: "test1",
    submitted: false, graded: false, answers: {},
  }));
  await assertFails(student.firestore().doc("gate_tests/test1/answerKeys/q1").get());

  // Submitted - now readable.
  await assertSucceeds(student.firestore().doc("gate_attempts/student-uid_test1").set({
    submitted: true,
  }, { merge: true }));
  await assertSucceeds(student.firestore().doc("gate_tests/test1/answerKeys/q1").get());

  // Another student's submission grants THEM nothing.
  await assertFails(other.firestore().doc("gate_tests/test1/answerKeys/q1").get());
});

test("a student cannot forge someone else's submitted attempt to unlock keys", async () => {
  const attacker = testEnv.authenticatedContext("attacker-uid");
  await assertFails(attacker.firestore().doc("gate_attempts/victim-uid_test1").set({
    uid: "victim-uid", paperId: "cs", testId: "test1", submitted: true, graded: false,
  }));
});

test("an attempt cannot be created pre-scored or pre-graded", async () => {
  const student = testEnv.authenticatedContext("student-uid");
  const db = student.firestore();
  await assertFails(db.doc("gate_attempts/student-uid_test1").set({
    uid: "student-uid", paperId: "cs", testId: "test1",
    submitted: false, graded: true, score: 100, maxScore: 100,
  }));
  await assertFails(db.doc("gate_attempts/student-uid_test1").set({
    uid: "student-uid", paperId: "cs", testId: "test1",
    submitted: false, graded: false, score: 100, maxScore: 100,
  }));
});

test("a graded attempt can never be re-graded, and score can never exceed maxScore", async () => {
  const student = testEnv.authenticatedContext("student-uid");
  const db = student.firestore();
  await assertSucceeds(db.doc("gate_attempts/student-uid_test1").set({
    uid: "student-uid", paperId: "cs", testId: "test1", submitted: false, graded: false,
  }));
  // score above maxScore is rejected outright.
  await assertFails(db.doc("gate_attempts/student-uid_test1").set({
    graded: true, score: 500, maxScore: 100,
  }, { merge: true }));
  // A legitimate grading write lands.
  await assertSucceeds(db.doc("gate_attempts/student-uid_test1").set({
    submitted: true, graded: true, score: 62, maxScore: 100,
  }, { merge: true }));
  // ...and is then final: no second, higher score.
  await assertFails(db.doc("gate_attempts/student-uid_test1").set({ score: 99 }, { merge: true }));
});

// ── attempts are private, results are public ────────────────────────────────

test("attempt documents (which hold answers) are unreadable by other students", async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().doc("gate_attempts/victim-uid_test1").set({
      uid: "victim-uid", paperId: "cs", testId: "test1",
      submitted: true, graded: true, score: 80, maxScore: 100,
      answers: { q1: "b" },
    });
  });
  const snoop = testEnv.authenticatedContext("snoop-uid");
  await assertFails(snoop.firestore().doc("gate_attempts/victim-uid_test1").get());
});

test("the answer-free results doc IS readable by any signed-in user, for leaderboards", async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().doc("gate_tests/test1/results/victim-uid").set({
      uid: "victim-uid", testId: "test1", score: 80, maxScore: 100, accuracy: 90,
    });
  });
  const viewer = testEnv.authenticatedContext("viewer-uid");
  await assertSucceeds(viewer.firestore().doc("gate_tests/test1/results/victim-uid").get());
  // ...but not writable by them, and not revisable once written.
  await assertFails(viewer.firestore().doc("gate_tests/test1/results/victim-uid").set({ score: 100 }, { merge: true }));
});

test("a results doc must be bounded and self-owned at create time", async () => {
  const student = testEnv.authenticatedContext("student-uid");
  const db = student.firestore();
  // score above maxScore.
  await assertFails(db.doc("gate_tests/test1/results/student-uid").set({
    uid: "student-uid", score: 500, maxScore: 100, accuracy: 100, timeTakenSeconds: 10,
  }));
  // maxScore beyond the sanity cap.
  await assertFails(db.doc("gate_tests/test1/results/student-uid").set({
    uid: "student-uid", score: 5000, maxScore: 5000, accuracy: 100, timeTakenSeconds: 10,
  }));
  // Writing into someone else's slot.
  await assertFails(db.doc("gate_tests/test1/results/other-uid").set({
    uid: "other-uid", score: 10, maxScore: 100, accuracy: 10, timeTakenSeconds: 10,
  }));
  // A legitimate one succeeds.
  await assertSucceeds(db.doc("gate_tests/test1/results/student-uid").set({
    uid: "student-uid", score: 62, maxScore: 100, accuracy: 75, timeTakenSeconds: 5400,
    handle: "student", department: "CSE", section: "A",
  }));
});

test("fetchMyAttempts' uid-filtered list() query is actually permitted", async () => {
  // The trap this codebase has hit repeatedly (reward_grants, problem_notes,
  // programming_progress): a rule that only checks a doc-ID path segment cannot
  // back a where()-filtered list(), and the query fails for EVERY real user.
  // gate_attempts' read rule carries a field-based branch specifically so this
  // works - so it is tested as the real query, not as a get().
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await db.doc("gate_attempts/student-uid_test1").set({
      uid: "student-uid", paperId: "cs", testId: "test1", graded: true,
      score: 60, maxScore: 100, submittedAt: new Date(),
    });
    await db.doc("gate_attempts/other-uid_test1").set({
      uid: "other-uid", paperId: "cs", testId: "test1", graded: true,
      score: 90, maxScore: 100, submittedAt: new Date(),
    });
  });
  const student = testEnv.authenticatedContext("student-uid");
  await assertSucceeds(getDocs(query(
    collection(student.firestore(), "gate_attempts"),
    where("uid", "==", "student-uid"),
    where("paperId", "==", "cs"),
    orderBy("submittedAt", "desc"),
    limit(50),
  )));
  // The same query for someone else's uid must fail, not silently return theirs.
  await assertFails(getDocs(query(
    collection(student.firestore(), "gate_attempts"),
    where("uid", "==", "other-uid"),
    where("paperId", "==", "cs"),
  )));
});

// ── reward-replay guards ────────────────────────────────────────────────────

test("completedTopicIds is monotonic - a topic cannot be removed and re-earned", async () => {
  const student = testEnv.authenticatedContext("student-uid");
  const ref = student.firestore().doc("gate_progress/student-uid_cs");
  await assertSucceeds(ref.set({ uid: "student-uid", paperId: "cs", completedTopicIds: ["sorting"] }));
  // Adding more is fine.
  await assertSucceeds(ref.set({ completedTopicIds: ["sorting", "hashing"] }, { merge: true }));
  // Dropping one is the reward-replay exploit - denied.
  await assertFails(ref.set({ completedTopicIds: ["sorting"] }, { merge: true }));
  await assertFails(ref.set({ completedTopicIds: [] }, { merge: true }));
});

test("another student cannot touch someone's GATE progress", async () => {
  const attacker = testEnv.authenticatedContext("attacker-uid");
  await assertFails(attacker.firestore().doc("gate_progress/victim-uid_cs").set({
    uid: "victim-uid", paperId: "cs", completedTopicIds: ["sorting"],
  }));
  await assertFails(attacker.firestore().doc("gate_progress/victim-uid_cs").get());
});

test("a day's `rewarded` flag is one-way, so a day cannot be re-claimed", async () => {
  const student = testEnv.authenticatedContext("student-uid");
  const ref = student.firestore().doc("gate_daily/student-uid_cs_2026-07-29");
  const allSix = { learn: true, practice: true, pyq: true, quiz: true, revision: true, formula: true };
  await assertSucceeds(ref.set({ uid: "student-uid", paperId: "cs", date: "2026-07-29", steps: allSix }));
  await assertSucceeds(ref.set({ completed: true, rewarded: true }, { merge: true }));
  // Un-ticking rewarded to farm the day's XP again is denied.
  await assertFails(ref.set({ rewarded: false }, { merge: true }));
});

// ── the notebook is strictly private ───────────────────────────────────────

test("a student's mistake notebook and bookmarks are private to them", async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().doc("gate_notes/victim-uid_cs").set({
      uid: "victim-uid", paperId: "cs",
      mistakes: { "pyq__pyq1": { stem: "got this wrong", reason: "concept-gap" } },
    });
  });
  const snoop = testEnv.authenticatedContext("snoop-uid");
  await assertFails(snoop.firestore().doc("gate_notes/victim-uid_cs").get());
  await assertFails(snoop.firestore().doc("gate_notes/victim-uid_cs").set({ mistakes: {} }, { merge: true }));

  const owner = testEnv.authenticatedContext("victim-uid");
  await assertSucceeds(owner.firestore().doc("gate_notes/victim-uid_cs").get());
  await assertSucceeds(owner.firestore().doc("gate_notes/victim-uid_cs").set({
    bookmarkedTopicIds: ["sorting"],
  }, { merge: true }));
});

test("PYQ practice progress is owner-only", async () => {
  const owner = testEnv.authenticatedContext("student-uid");
  await assertSucceeds(owner.firestore().doc("gate_pyq_progress/student-uid_cs").set({
    uid: "student-uid", paperId: "cs", attempted: { pyq1: { attempts: 1, everCorrect: true } },
  }));
  const snoop = testEnv.authenticatedContext("snoop-uid");
  await assertFails(snoop.firestore().doc("gate_pyq_progress/student-uid_cs").get());
});

// ── signed-out access ──────────────────────────────────────────────────────

test("a signed-out visitor reads published catalog content but no per-user state", async () => {
  const anon = testEnv.unauthenticatedContext();
  const db = anon.firestore();
  // Matches the problems/programmingLanguages precedent - published catalog
  // content is world-readable, which is what makes GATE content indexable.
  await assertSucceeds(db.doc("gatePapers/cs").get());
  await assertSucceeds(db.doc("gate_pyqs/pyq1").get());
  // But nothing per-user, and no answer keys.
  await assertFails(db.doc("gate_tests/test1/answerKeys/q1").get());
  await assertFails(db.doc("gate_progress/student-uid_cs").get());
  await assertFails(db.doc("gate_notes/student-uid_cs").get());
});
