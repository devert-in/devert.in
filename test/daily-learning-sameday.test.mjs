// The same-day reward window for Daily Learning.
//
// lib/dailyLearning.js applies this client-side, but that is the UX. Coins
// convert to real INR (see CLAUDE.md), so a client-only check is a one-line
// bypass through the Firestore SDK. These tests are about the rule.
//
// The rule builds today's IST date as a STRING to compare against the log's own
// `date` field, because rules cannot parse a date out of a string. That string
// building (timestamp + duration, string(), zero-padding via ternary) is not
// something to assume works - the first test proves it does.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "fs";
import { initializeTestEnvironment, assertSucceeds, assertFails } from "@firebase/rules-unit-testing";
import { doc, setDoc } from "firebase/firestore";

const INSTITUTION = "mrcet";
const STUDENT = "student-sameday";

// The IST date as the rule computes it, derived independently here so the test
// does not just re-run the rule's own arithmetic.
function istToday() {
  return new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);
}
function istOffset(days) {
  return new Date(Date.now() + 5.5 * 3600 * 1000 + days * 86400000).toISOString().slice(0, 10);
}

let testEnv;

test.before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "devert-sameday-test",
    firestore: { rules: readFileSync("firestore.rules", "utf8"), host: "127.0.0.1", port: 8089 },
  });
});
test.after(async () => { await testEnv.cleanup(); });

test.beforeEach(async () => {
  await testEnv.clearFirestore();
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, `institutions/${INSTITUTION}`), { name: "MRCET", status: "published" });
    // An approved student with the Daily Learning module enabled.
    await setDoc(doc(db, `institutions/${INSTITUTION}/students/${STUDENT}`), {
      uid: STUDENT, status: "approved", department: "cse", year: "3", section: "A",
    });
  });
});

const student = () => testEnv.authenticatedContext(STUDENT, {}).firestore();

const logDoc = (date) => `institutions/${INSTITUTION}/dailyLearningLog/${STUDENT}_${date}`;
const payload = (date, xp, coins) => ({
  uid: STUDENT, date, weekId: date, dow: "fri", type: "lesson",
  xpEarned: xp, coinEarned: coins, mcqScore: 2, mcqTotal: 2,
  completedAt: new Date(),
});

test("rules can build today's IST date as a string at all", async () => {
  // If istTodayStr() were malformed - unpadded month, wrong type, an
  // evaluation error - the on-time write below would fail and every other
  // result in this file would be meaningless. Proving the mechanism first.
  await assertSucceeds(setDoc(doc(student(), logDoc(istToday())), payload(istToday(), 50, 20)));
});

test("completing TODAY's day with rewards is allowed", async () => {
  await assertSucceeds(setDoc(doc(student(), logDoc(istToday())), payload(istToday(), 50, 20)));
});

test("claiming rewards for YESTERDAY's day is denied", async () => {
  const y = istOffset(-1);
  await assertFails(setDoc(doc(student(), logDoc(y)), payload(y, 50, 20)));
});

test("claiming rewards for a day last week is denied", async () => {
  const old = istOffset(-8);
  await assertFails(setDoc(doc(student(), logDoc(old)), payload(old, 50, 20)));
});

test("a LATE day can still be recorded, as long as it claims nothing", async () => {
  // The whole point of the rule: catching up must remain possible, and must
  // keep counting toward progress/streak/analytics. It just cannot pay.
  const y = istOffset(-1);
  await assertSucceeds(setDoc(doc(student(), logDoc(y)), payload(y, 0, 0)));
});

test("a late day cannot sneak through with only coins, or only XP", async () => {
  const y = istOffset(-1);
  await assertFails(setDoc(doc(student(), logDoc(y)), payload(y, 0, 20)));
  await assertFails(setDoc(doc(student(), logDoc(y)), payload(y, 50, 0)));
});

test("a FUTURE day cannot claim rewards either", async () => {
  // Not the user's stated concern, but the same comparison closes it: without
  // it, setting a device clock forward would mint rewards for unpublished days.
  const t = istOffset(1);
  await assertFails(setDoc(doc(student(), logDoc(t)), payload(t, 50, 20)));
});

test("the reward amount is still bounded on an on-time day", async () => {
  // The pre-existing 0..2000 bound must survive the new clause being ANDed in.
  await assertFails(setDoc(doc(student(), logDoc(istToday())), payload(istToday(), 999999, 999999)));
  await assertFails(setDoc(doc(student(), logDoc(istToday())), payload(istToday(), -50, -20)));
});

test("a student still cannot write into another student's log slot", async () => {
  // The doc-id ownership binding must survive too.
  const other = `institutions/${INSTITUTION}/dailyLearningLog/victim_${istToday()}`;
  await assertFails(setDoc(doc(student(), other), payload(istToday(), 50, 20)));
});

test("an institution admin may still correct a past log, rewards included", async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), `institutions/${INSTITUTION}/admins/admin-uid`), { uid: "admin-uid", role: "admin" });
  });
  const admin = testEnv.authenticatedContext("admin-uid", {}).firestore();
  const y = istOffset(-1);
  await assertSucceeds(setDoc(doc(admin, logDoc(y)), payload(y, 50, 20)));
});
