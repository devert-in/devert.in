// Regression tests for the GATE 2027 Plan's access boundary (firestore.rules,
// "GATE 2027 Plan" block; client in devert-frontend/lib/gatePlan.js).
//
// The plan is REQUEST-TO-JOIN. The rules are the whole of that gate - the UI
// only hides things - so each promise the feature makes is pinned here:
//
//   1. The day cards / formula bank / resources are unreadable to anyone
//      without an ACTIVE member doc, including a signed-in stranger and a
//      member whose access was revoked. The outline (gate_plan_meta) is public.
//   2. A student can file a request, but only ever as 'pending' - never
//      'approved' - and cannot forge the admin's review fields.
//   3. A decided (approved/revoked) request is frozen from the student's side;
//      a rejected one can be re-submitted, back to 'pending' only.
//   4. Closing requests (gate_plan_meta/settings.requestsOpen == false) blocks
//      new requests at the rule level, not just in the form.
//   5. Only the admin creates a member doc (approval), and a member can write
//      their own logs/checklist but never their access or approvedOnDay.
//
// Run with: npm test   (or `node --test test/` against a running emulator)
import test from "node:test";
import { readFileSync } from "fs";
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} from "@firebase/rules-unit-testing";

let testEnv;

const ADMIN = { email: "devert.contact@gmail.com", email_verified: true, admin: true };

const REQUEST = {
  uid: "stu", name: "Asha", email: "asha@example.com", papers: "BOTH", stage: "final-year",
  college: "Some College", gradYear: "2027", attempt: "first", prevScore: "", hoursOk: true, goal: "M.Tech",
  status: "pending", requestedOnDay: 1, submissions: 1,
};

test.before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "devert-gate-plan-rules-test",
    firestore: { rules: readFileSync("firestore.rules", "utf8"), host: "127.0.0.1", port: 8089 },
  });
});

test.after(async () => { await testEnv.cleanup(); });

test.beforeEach(async () => {
  await testEnv.clearFirestore();
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await db.doc("gate_plan_meta/index").set({ days: [{ day: 0, topic: "Setup" }] });
    await db.doc("gate_plan_days/1").set({ day: 1, topic: "Counting", mustKnow: "nPr = n!/(n-r)!" });
    await db.doc("gate_plan_content/formulas").set({ rows: [{ day: 1, text: "nCr" }] });
    await db.doc("gate_plan_members/member").set({ uid: "member", access: "active", approvedOnDay: 1, logs: {}, checklist: {} });
    await db.doc("gate_plan_members/revoked").set({ uid: "revoked", access: "revoked", approvedOnDay: 1, logs: {} });
  });
});

// ── 1. content gate ───────────────────────────────────────────────────────

test("the outline and settings are public; day cards and the formula bank are not", async () => {
  const anon = testEnv.unauthenticatedContext().firestore();
  await assertSucceeds(anon.doc("gate_plan_meta/index").get());
  await assertFails(anon.doc("gate_plan_days/1").get());

  const stranger = testEnv.authenticatedContext("stranger").firestore();
  await assertFails(stranger.doc("gate_plan_days/1").get());
  await assertFails(stranger.doc("gate_plan_content/formulas").get());
});

test("an active member reads the day cards and formula bank; a revoked member cannot", async () => {
  const member = testEnv.authenticatedContext("member").firestore();
  await assertSucceeds(member.doc("gate_plan_days/1").get());
  await assertSucceeds(member.doc("gate_plan_content/formulas").get());

  const revoked = testEnv.authenticatedContext("revoked").firestore();
  await assertFails(revoked.doc("gate_plan_days/1").get());
  await assertFails(revoked.doc("gate_plan_content/formulas").get());
});

test("nobody but the admin writes plan content", async () => {
  const member = testEnv.authenticatedContext("member").firestore();
  await assertFails(member.doc("gate_plan_days/1").set({ topic: "Hacked" }));
  await assertFails(member.doc("gate_plan_meta/settings").set({ requestsOpen: true }));
  const admin = testEnv.authenticatedContext("admin", ADMIN).firestore();
  await assertSucceeds(admin.doc("gate_plan_days/1").set({ topic: "Counting" }));
  await assertSucceeds(admin.doc("gate_plan_meta/settings").set({ requestsOpen: false }));
});

// ── 2-4. requests ─────────────────────────────────────────────────────────

test("a student files a pending request for themselves only", async () => {
  const stu = testEnv.authenticatedContext("stu").firestore();
  await assertSucceeds(stu.doc("gate_plan_requests/stu").set(REQUEST));
  await assertSucceeds(stu.doc("gate_plan_requests/stu").get());
  // Not for someone else, and nobody else can read it.
  await assertFails(stu.doc("gate_plan_requests/other").set({ ...REQUEST, uid: "other" }));
  await assertFails(testEnv.authenticatedContext("other").firestore().doc("gate_plan_requests/stu").get());
});

test("a student cannot self-approve or forge review fields", async () => {
  const stu = testEnv.authenticatedContext("stu").firestore();
  await assertFails(stu.doc("gate_plan_requests/stu").set({ ...REQUEST, status: "approved" }));
  await assertFails(stu.doc("gate_plan_requests/stu").set({ ...REQUEST, reviewedBy: "admin" }));
  await assertFails(stu.doc("gate_plan_requests/stu").set({ ...REQUEST, hoursOk: false }));
  await assertFails(stu.doc("gate_plan_requests/stu").set({ ...REQUEST, papers: "ALL" }));
  await assertFails(stu.doc("gate_plan_requests/stu").set({ ...REQUEST, goal: "x".repeat(601) }));

  await assertSucceeds(stu.doc("gate_plan_requests/stu").set(REQUEST));
  await assertFails(stu.doc("gate_plan_requests/stu").update({ status: "approved" }));
});

test("an approved request is frozen from the student's side; a rejected one can be re-submitted as pending", async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().doc("gate_plan_requests/stu").set({ ...REQUEST, status: "approved" });
    await ctx.firestore().doc("gate_plan_requests/rej").set({ ...REQUEST, uid: "rej", status: "rejected", reviewNote: "Full" });
  });
  const stu = testEnv.authenticatedContext("stu").firestore();
  await assertFails(stu.doc("gate_plan_requests/stu").update({ status: "pending", goal: "again" }));
  await assertFails(stu.doc("gate_plan_requests/stu").delete());

  const rej = testEnv.authenticatedContext("rej").firestore();
  await assertFails(rej.doc("gate_plan_requests/rej").delete());
  await assertFails(rej.doc("gate_plan_requests/rej").update({ status: "approved" }));
  await assertFails(rej.doc("gate_plan_requests/rej").update({ status: "pending", reviewNote: "" }));
  await assertSucceeds(rej.doc("gate_plan_requests/rej").update({ status: "pending", goal: "Updated goal", submissions: 2 }));
  // A rejected request cannot be deleted (it would erase the decision) - but a pending one can be withdrawn.
  await assertSucceeds(rej.doc("gate_plan_requests/rej").delete());
});

test("closing requests blocks new ones at the rule level", async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().doc("gate_plan_meta/settings").set({ requestsOpen: false });
  });
  const stu = testEnv.authenticatedContext("stu").firestore();
  await assertFails(stu.doc("gate_plan_requests/stu").set(REQUEST));
});

// ── 5. membership ─────────────────────────────────────────────────────────

test("only the admin creates a member doc", async () => {
  const stu = testEnv.authenticatedContext("stu").firestore();
  await assertFails(stu.doc("gate_plan_members/stu").set({ uid: "stu", access: "active", approvedOnDay: 0 }));
  const admin = testEnv.authenticatedContext("admin", ADMIN).firestore();
  await assertSucceeds(admin.doc("gate_plan_members/stu").set({ uid: "stu", access: "active", approvedOnDay: 0 }));
  // An admin CLAIM on any other email grants nothing (CLAUDE.md's one-admin rule).
  const fake = testEnv.authenticatedContext("fake", { email: "someone@example.com", email_verified: true, admin: true }).firestore();
  await assertFails(fake.doc("gate_plan_members/x").set({ uid: "x", access: "active" }));
});

test("a member writes their own logs and checklist but never access or approvedOnDay", async () => {
  const member = testEnv.authenticatedContext("member").firestore();
  await assertSucceeds(member.doc("gate_plan_members/member").update({
    "logs.1": { status: "done", topicCorrect: 12, topicAttempted: 16 }, lastLoggedDay: 1,
  }));
  await assertSucceeds(member.doc("gate_plan_members/member").update({
    "checklist.probability-and-statistics--counting": { learn: true, pyqs: false, seventy: false, rev: false },
  }));
  await assertFails(member.doc("gate_plan_members/member").update({ access: "active", approvedOnDay: 0 }));
  await assertFails(member.doc("gate_plan_members/member").update({ approvedOnDay: 0 }));
  // Someone else's progress is neither readable nor writable.
  const other = testEnv.authenticatedContext("other").firestore();
  await assertFails(other.doc("gate_plan_members/member").get());
  await assertFails(other.doc("gate_plan_members/member").update({ "logs.2": { status: "done" } }));
});

test("a revoked member cannot keep logging", async () => {
  const revoked = testEnv.authenticatedContext("revoked").firestore();
  await assertSucceeds(revoked.doc("gate_plan_members/revoked").get());
  await assertFails(revoked.doc("gate_plan_members/revoked").update({ "logs.3": { status: "done" } }));
});
