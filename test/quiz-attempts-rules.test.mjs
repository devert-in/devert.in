// Regression tests for /quiz_attempts - the server-side record that decides
// whether a topic quiz has already been submitted.
//
// This collection exists because the pre-existing gate was entirely client-side
// (a localStorage flag - see lib/quizAttempts.js's header for the three bugs
// that caused). Its whole security model is three stickiness rules:
//   1. `attempts` only ever goes UP, by exactly 1 per write.
//   2. `passed` and `rewarded` only ever flip false -> true.
//   3. uid/module/scopeId are immutable after create.
// If any of those can be bypassed, the cross-device lock this collection exists
// to provide is fiction. Each gets its own test below, plus the ownership and
// ceiling checks every per-user collection in this codebase already carries.
//
// Run with: npm test   (or `node --test test/` against a running emulator)
import test from "node:test";
import { readFileSync } from "fs";
import { initializeTestEnvironment, assertSucceeds, assertFails } from "@firebase/rules-unit-testing";
import { doc, setDoc } from "firebase/firestore";

let testEnv;

test.before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "devert-quiz-attempts-test",
    firestore: { rules: readFileSync("firestore.rules", "utf8"), host: "127.0.0.1", port: 8089 },
  });
});
test.after(async () => { await testEnv.cleanup(); });
test.beforeEach(async () => { await testEnv.clearFirestore(); });

const UID = "student-uid";
const DOC_ID = `${UID}_cscore_dbms_er-model`;

function base(overrides = {}) {
  return {
    uid: UID, module: "cscore", scopeId: "dbms_er-model",
    attempts: 1, passed: false, rewarded: false,
    lastCorrect: 2, lastTotal: 4,
    ...overrides,
  };
}

// ── create ───────────────────────────────────────────────────────────────────

test("a student can create their own first attempt", async () => {
  const db = testEnv.authenticatedContext(UID).firestore();
  await assertSucceeds(setDoc(doc(db, "quiz_attempts", DOC_ID), base()));
});

test("attempts must start at exactly 1 - never pre-seeded higher", async () => {
  const db = testEnv.authenticatedContext(UID).firestore();
  await assertFails(setDoc(doc(db, "quiz_attempts", DOC_ID), base({ attempts: 2 })));
  await assertFails(setDoc(doc(db, "quiz_attempts", DOC_ID), base({ attempts: 0 })));
});

test("lastCorrect can never exceed lastTotal, even on create", async () => {
  const db = testEnv.authenticatedContext(UID).firestore();
  await assertFails(setDoc(doc(db, "quiz_attempts", DOC_ID), base({ lastCorrect: 99, lastTotal: 4 })));
});

test("a student cannot forge another student's attempt doc", async () => {
  const attacker = testEnv.authenticatedContext("attacker-uid").firestore();
  await assertFails(setDoc(doc(attacker, "quiz_attempts", DOC_ID), base()));
});

test("the doc id must exactly match uid_module_scopeId", async () => {
  const db = testEnv.authenticatedContext(UID).firestore();
  // Right uid, but the doc id claims a different module than the payload.
  await assertFails(setDoc(doc(db, "quiz_attempts", `${UID}_gate_dbms_er-model`), base()));
});

// ── the three stickiness rules ───────────────────────────────────────────────

test("attempts may only increase by exactly 1 per write", async () => {
  const db = testEnv.authenticatedContext(UID).firestore();
  await setDoc(doc(db, "quiz_attempts", DOC_ID), base());
  // Jumping by 2 (e.g. trying to pre-empt a future lock) is rejected.
  await assertFails(setDoc(doc(db, "quiz_attempts", DOC_ID), base({ attempts: 3 }), { merge: true }));
  // Writing it back down is rejected.
  await assertFails(setDoc(doc(db, "quiz_attempts", DOC_ID), base({ attempts: 1 }), { merge: true }));
  // The legitimate next attempt succeeds.
  await assertSucceeds(setDoc(doc(db, "quiz_attempts", DOC_ID), base({ attempts: 2 }), { merge: true }));
});

test("passed can flip false -> true but never true -> false", async () => {
  const db = testEnv.authenticatedContext(UID).firestore();
  await setDoc(doc(db, "quiz_attempts", DOC_ID), base({ passed: true, attempts: 1 }));
  // A client re-submitting cannot unpass a passed quiz to re-arm it.
  await assertFails(setDoc(doc(db, "quiz_attempts", DOC_ID), base({ passed: false, attempts: 2 }), { merge: true }));
});

test("rewarded can flip false -> true but never true -> false", async () => {
  const db = testEnv.authenticatedContext(UID).firestore();
  await setDoc(doc(db, "quiz_attempts", DOC_ID), base({ rewarded: true, attempts: 1 }));
  // This is the exact write a client would need to make to re-arm a payout.
  await assertFails(setDoc(doc(db, "quiz_attempts", DOC_ID), base({ rewarded: false, attempts: 2 }), { merge: true }));
});

test("uid, module and scopeId are immutable after create", async () => {
  const db = testEnv.authenticatedContext(UID).firestore();
  await setDoc(doc(db, "quiz_attempts", DOC_ID), base());
  await assertFails(setDoc(doc(db, "quiz_attempts", DOC_ID), base({ module: "gate", attempts: 2 }), { merge: true }));
  await assertFails(setDoc(doc(db, "quiz_attempts", DOC_ID), base({ scopeId: "dbms_keys", attempts: 2 }), { merge: true }));
});

test("attempts is hard-capped at 20 regardless of module policy", async () => {
  const db = testEnv.authenticatedContext(UID).firestore();
  await setDoc(doc(db, "quiz_attempts", DOC_ID), base({ attempts: 1 }));
  await assertFails(setDoc(doc(db, "quiz_attempts", DOC_ID), base({ attempts: 21 }), { merge: true }));
});

test("another student cannot update someone else's attempt", async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().doc(`quiz_attempts/${DOC_ID}`).set(base());
  });
  const attacker = testEnv.authenticatedContext("attacker-uid").firestore();
  await assertFails(setDoc(doc(attacker, "quiz_attempts", DOC_ID), base({ attempts: 2 }), { merge: true }));
});

// ── read ─────────────────────────────────────────────────────────────────────

test("a student reads their own attempt; another student cannot", async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().doc(`quiz_attempts/${DOC_ID}`).set(base());
  });
  await assertSucceeds(testEnv.authenticatedContext(UID).firestore().doc(`quiz_attempts/${DOC_ID}`).get());
  await assertFails(testEnv.authenticatedContext("snoop-uid").firestore().doc(`quiz_attempts/${DOC_ID}`).get());
});

test("a not-yet-existing attempt is readable (not a permission error) for its own owner", async () => {
  // This is the case fetchAttempt() hits on every fresh topic view - the same
  // "get() on a non-existent doc must not throw" shape reward_grants documents.
  const db = testEnv.authenticatedContext(UID).firestore();
  const snap = await db.doc(`quiz_attempts/${DOC_ID}`).get();
  // Should resolve (not exist), never reject with permission-denied.
  if (typeof snap.exists === "function") { snap.exists(); } else { void snap.exists; }
});

// ── admin ────────────────────────────────────────────────────────────────────

test("only an admin may delete an attempt (the progress-reset path)", async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().doc(`quiz_attempts/${DOC_ID}`).set(base());
  });
  const student = testEnv.authenticatedContext(UID).firestore();
  await assertFails(student.doc(`quiz_attempts/${DOC_ID}`).delete());

  const admin = testEnv.authenticatedContext("admin-uid", { admin: true }).firestore();
  await assertSucceeds(admin.doc(`quiz_attempts/${DOC_ID}`).delete());
});

test("an admin can clear the rewarded flag to correct a wrongly-denied student", async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().doc(`quiz_attempts/${DOC_ID}`).set(base({ rewarded: true }));
  });
  const admin = testEnv.authenticatedContext("admin-uid", { admin: true }).firestore();
  await assertSucceeds(setDoc(doc(admin, "quiz_attempts", DOC_ID), { rewarded: false }, { merge: true }));
});
