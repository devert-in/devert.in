// Regression tests for Software Engineering Fundamentals' security boundaries.
//
// Two things are worth pinning down here rather than trusting to a comment:
//
//   1. The course is world-readable when published (that is the point - a
//      prospective student reads it before signing up, and search engines index
//      it) but drafts must stay admin-only, or in-progress authoring leaks.
//
//   2. completedLessonIds is monotonic. Completing a lesson grants XP and coins
//      through the shared reward ledger, so if a learner could arrayRemove an id
//      and re-complete the lesson they would mint currency indefinitely. This is
//      the same exploit already closed on programming_progress, cscore_progress
//      and gate_progress; this test is what stops it being reopened here.
//
// Plus the admin list() on se_progress, which deleteModule's cleanup sweep needs
// and which is easy to break by nesting isAdmin() inside isAuth().
import test from "node:test";
import { readFileSync } from "fs";
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} from "@firebase/rules-unit-testing";
import { collection, getDocs } from "firebase/firestore";

let testEnv;

test.before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "devert-se-rules-test",
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
    await db.doc("seModules/the-internet").set({ title: "The Internet", status: "published", audiences: ["legacy"], number: 1, order: 20 });
    await db.doc("seModules/unfinished").set({ title: "Draft Module", status: "draft", number: 99, order: 990 });
    await db.doc("seModules/the-internet/lessons/what-is-dns").set({ title: "DNS", status: "published", audiences: ["legacy"], order: 10 });
    await db.doc("seModules/the-internet/lessons/wip").set({ title: "WIP", status: "draft", order: 20 });
  });
});

// ── published vs draft ──────────────────────────────────────────────────────

test("a signed-out visitor can read published modules and lessons", async () => {
  const anon = testEnv.unauthenticatedContext();
  await assertSucceeds(anon.firestore().doc("seModules/the-internet").get());
  await assertSucceeds(anon.firestore().doc("seModules/the-internet/lessons/what-is-dns").get());
});

test("drafts are invisible to everyone but an admin", async () => {
  const anon = testEnv.unauthenticatedContext();
  const student = testEnv.authenticatedContext("student-uid");
  await assertFails(anon.firestore().doc("seModules/unfinished").get());
  await assertFails(student.firestore().doc("seModules/unfinished").get());
  await assertFails(student.firestore().doc("seModules/the-internet/lessons/wip").get());
});

test("a student can never write course content", async () => {
  const student = testEnv.authenticatedContext("student-uid");
  const db = student.firestore();
  await assertFails(db.doc("seModules/the-internet").set({ title: "hacked" }, { merge: true }));
  await assertFails(db.doc("seModules/the-internet/lessons/what-is-dns").set({ concept: "hacked" }, { merge: true }));
  await assertFails(db.doc("seModules/brand-new").set({ title: "mine", status: "published" }));
});

// ── progress is private ─────────────────────────────────────────────────────

test("course progress is readable and writable only by its owner", async () => {
  const owner = testEnv.authenticatedContext("owner-uid");
  const snoop = testEnv.authenticatedContext("snoop-uid");

  await assertSucceeds(owner.firestore().doc("se_progress/owner-uid").set({
    uid: "owner-uid", completedLessonIds: ["what-is-dns"],
  }));
  await assertSucceeds(owner.firestore().doc("se_progress/owner-uid").get());

  await assertFails(snoop.firestore().doc("se_progress/owner-uid").get());
  await assertFails(snoop.firestore().doc("se_progress/owner-uid").set({ completedLessonIds: [] }, { merge: true }));
});

// ── the reward-replay guard ─────────────────────────────────────────────────

test("completedLessonIds is monotonic - a lesson cannot be un-completed and re-earned", async () => {
  const owner = testEnv.authenticatedContext("owner-uid");
  const ref = owner.firestore().doc("se_progress/owner-uid");

  await assertSucceeds(ref.set({ uid: "owner-uid", completedLessonIds: ["what-is-dns"] }));
  // Adding more is fine.
  await assertSucceeds(ref.set({ completedLessonIds: ["what-is-dns", "http"] }, { merge: true }));
  // Dropping one is the reward-replay exploit.
  await assertFails(ref.set({ completedLessonIds: ["what-is-dns"] }, { merge: true }));
  await assertFails(ref.set({ completedLessonIds: [] }, { merge: true }));
  // Swapping the array for an unrelated one is the same exploit wearing a hat.
  await assertFails(ref.set({ completedLessonIds: ["something-else"] }, { merge: true }));
});

test("the monotonic guard does not block the writes that never touch it", async () => {
  const owner = testEnv.authenticatedContext("owner-uid");
  const ref = owner.firestore().doc("se_progress/owner-uid");
  await assertSucceeds(ref.set({ uid: "owner-uid", completedLessonIds: ["what-is-dns"] }));

  // Notes, bookmarks, lab ticks and knowledge-check results are all ordinary
  // owner writes and must stay unaffected by the completion guard - if they were
  // caught by it, the whole lesson UI would break for anyone who had completed
  // anything.
  await assertSucceeds(ref.set({ notes: { "what-is-dns": "my note" } }, { merge: true }));
  await assertSucceeds(ref.set({ bookmarkedLessonIds: ["http"] }, { merge: true }));
  await assertSucceeds(ref.set({ labsCompleted: ["what-is-dns"] }, { merge: true }));
  await assertSucceeds(ref.set({ checks: { "what-is-dns": { correct: 3, total: 4 } } }, { merge: true }));
  // ...and a later bookmark REMOVAL is fine, because only completions are monotonic.
  await assertSucceeds(ref.set({ bookmarkedLessonIds: [] }, { merge: true }));
});

test("the first write to a fresh progress doc is allowed", async () => {
  // resource == null on create, so the guard must not reject the very first
  // completion - an off-by-one here would make the course impossible to start.
  const fresh = testEnv.authenticatedContext("fresh-uid");
  await assertSucceeds(fresh.firestore().doc("se_progress/fresh-uid").set({
    uid: "fresh-uid", completedLessonIds: ["what-is-dns"],
  }));
});

// ── admin sweep ─────────────────────────────────────────────────────────────

test("an unfiltered list() of se_progress is denied to a student", async () => {
  // Nothing stops a curious student trying this from devtools; it must fail
  // rather than dump every learner's progress.
  const student = testEnv.authenticatedContext("student-uid");
  await assertFails(getDocs(collection(student.firestore(), "se_progress")));
});
