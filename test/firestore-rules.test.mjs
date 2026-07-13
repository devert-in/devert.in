// Regression tests for the coin-economy security fixes: a non-owner must
// never be able to set someone's balance/engagement counters to an
// arbitrary value, only a bounded, known-reward delta. Run with:
//   npm test
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "fs";
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} from "@firebase/rules-unit-testing";

let testEnv;

test.before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "devert-rules-test",
    firestore: {
      rules: readFileSync("firestore.rules", "utf8"),
      host: "127.0.0.1",
      port: 8089,
    },
  });
});

test.after(async () => {
  await testEnv.cleanup();
});

test.beforeEach(async () => {
  await testEnv.clearFirestore();
  // Seed the live economy config the rules read via get() - mirrors
  // lib/economy.js's DEFAULT_ECONOMY.
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().doc("system/economy").set({
      PER_LIKE: 10, PER_COMMENT: 25, PER_SAVE: 15,
    });
  });
});

test("a non-owner cannot set another user's coin balance to an arbitrary value", async () => {
  const attacker = testEnv.authenticatedContext("attacker-uid");
  const victimEarnings = attacker.firestore().doc("user_earnings/victim-uid");
  await assertFails(victimEarnings.set({ pulseCoins: 999999999, totalCoins: 999999999 }));
});

test("a non-owner CAN credit exactly the configured per-like reward (the real like flow)", async () => {
  const liker = testEnv.authenticatedContext("liker-uid");
  const authorEarnings = liker.firestore().doc("user_earnings/author-uid");
  await assertSucceeds(authorEarnings.set({ pulseCoins: 10, totalCoins: 10 }, { merge: true }));
});

test("a non-owner cannot credit an amount that doesn't match a known reward rate", async () => {
  const attacker = testEnv.authenticatedContext("attacker-uid");
  const victimEarnings = attacker.firestore().doc("user_earnings/victim-uid");
  await assertFails(victimEarnings.set({ pulseCoins: 12345, totalCoins: 12345 }, { merge: true }));
});

test("the owner can still freely write their own earnings (self-serve XP conversion)", async () => {
  const owner = testEnv.authenticatedContext("owner-uid");
  const ownEarnings = owner.firestore().doc("user_earnings/owner-uid");
  await assertSucceeds(ownEarnings.set({ pulseCoins: 250000, totalCoins: 250000 }, { merge: true }));
});

test("a non-owner cannot jump a post's likeCount by more than one", async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().doc("pulse_posts/post-1").set({ uid: "author-uid", likeCount: 0 });
  });
  const liker = testEnv.authenticatedContext("liker-uid");
  const post = liker.firestore().doc("pulse_posts/post-1");
  await assertFails(post.update({ likeCount: 500 }));
});

test("a non-owner CAN bump a post's likeCount by exactly one (the real like flow)", async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().doc("pulse_posts/post-1").set({ uid: "author-uid", likeCount: 0 });
  });
  const liker = testEnv.authenticatedContext("liker-uid");
  const post = liker.firestore().doc("pulse_posts/post-1");
  await assertSucceeds(post.update({ likeCount: 1 }));
});

test("a logged-out user cannot write to any post's counters", async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().doc("pulse_posts/post-1").set({ uid: "author-uid", likeCount: 0 });
  });
  const guest = testEnv.unauthenticatedContext();
  const post = guest.firestore().doc("pulse_posts/post-1");
  await assertFails(post.update({ likeCount: 1 }));
});

test("only a user with the admin custom claim can write system config", async () => {
  const nonAdmin = testEnv.authenticatedContext("random-uid");
  await assertFails(nonAdmin.firestore().doc("system/economy").set({ PER_LIKE: 999 }));

  const admin = testEnv.authenticatedContext("admin-uid", { admin: true });
  await assertSucceeds(admin.firestore().doc("system/economy").set({ PER_LIKE: 999 }));
});

test("anyone can read aptitude topics/questions, only admin can write them", async () => {
  const guest = testEnv.unauthenticatedContext();
  await assertSucceeds(guest.firestore().doc("aptitude_topics/percentages").get());
  await assertFails(guest.firestore().doc("aptitude_topics/percentages").set({ name: "hack" }));

  const admin = testEnv.authenticatedContext("admin-uid", { admin: true });
  await assertSucceeds(admin.firestore().doc("aptitude_topics/percentages").set({ name: "Percentages", category: "Quantitative" }));
  await assertSucceeds(admin.firestore().doc("aptitude_topics/percentages/questions/q1").set({ question: "2+2?" }));
});

test("a user can only read/write their own aptitude progress, not someone else's", async () => {
  const owner = testEnv.authenticatedContext("owner-uid");
  await assertSucceeds(owner.firestore().doc("user_aptitude_progress/owner-uid").set({ attempted: {} }));

  const other = testEnv.authenticatedContext("other-uid");
  await assertFails(other.firestore().doc("user_aptitude_progress/owner-uid").set({ attempted: {} }));
  await assertFails(other.firestore().doc("user_aptitude_progress/owner-uid").get());
});

// --- Contest Platform ---

const FUTURE = new Date(Date.now() + 60 * 60 * 1000); // +1h, mirrors an in-progress/upcoming contest
const PAST = new Date(Date.now() - 60 * 60 * 1000);    // -1h, mirrors a contest that has ended

async function seedContest(ctx, contestId, overrides = {}) {
  await ctx.firestore().doc(`contests/${contestId}`).set({
    status: "published",
    registrationEnd: FUTURE,
    contestEnd: FUTURE,
    prizeXp: 100,
    prizeCoins: 50,
    participantCount: 0,
    ...overrides,
  });
}

test("a non-admin cannot read a contest's answerKeys before contestEnd, but can after", async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await seedContest(ctx, "c-live", { contestEnd: FUTURE });
    await seedContest(ctx, "c-ended", { contestEnd: PAST });
    await ctx.firestore().doc("contests/c-live/answerKeys/q1").set({ correctOptionIds: ["a"] });
    await ctx.firestore().doc("contests/c-ended/answerKeys/q1").set({ correctOptionIds: ["a"] });
  });
  const user = testEnv.authenticatedContext("user-uid");
  await assertFails(user.firestore().doc("contests/c-live/answerKeys/q1").get());
  await assertSucceeds(user.firestore().doc("contests/c-ended/answerKeys/q1").get());
});

test("a user can create their own contest submission with raw answers only, not with a score", async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => { await seedContest(ctx, "c1"); });
  const user = testEnv.authenticatedContext("user-uid");
  await assertSucceeds(user.firestore().doc("contests/c1/submissions/user-uid").set({
    answers: { q1: "a" }, graded: false,
  }));
  await assertFails(user.firestore().doc("contests/c1/submissions/other-uid").set({
    answers: { q1: "a" }, graded: false,
  }));
  await assertFails(user.firestore().doc("contests/c1/submissions/user-uid2").set({
    answers: { q1: "a" }, graded: false, score: 999,
  }));
});

test("a user cannot grade their own contest submission before contestEnd, or above the contest's prize caps", async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await seedContest(ctx, "c-live", { contestEnd: FUTURE, prizeXp: 100, prizeCoins: 50 });
    await seedContest(ctx, "c-ended", { contestEnd: PAST, prizeXp: 100, prizeCoins: 50 });
    await ctx.firestore().doc("contests/c-live/submissions/user-uid").set({ answers: {}, graded: false });
    await ctx.firestore().doc("contests/c-ended/submissions/user-uid").set({ answers: {}, graded: false });
  });
  const user = testEnv.authenticatedContext("user-uid");
  // Contest still running - grading update rejected regardless of amount.
  await assertFails(user.firestore().doc("contests/c-live/submissions/user-uid").update({
    graded: true, score: 10, xpEarned: 50, coinsEarned: 20,
  }));
  // Contest ended, but claiming more than the announced prize cap - rejected.
  await assertFails(user.firestore().doc("contests/c-ended/submissions/user-uid").update({
    graded: true, score: 999, xpEarned: 99999, coinsEarned: 50,
  }));
  // Contest ended, within caps - allowed, exactly once.
  await assertSucceeds(user.firestore().doc("contests/c-ended/submissions/user-uid").update({
    graded: true, score: 10, xpEarned: 50, coinsEarned: 20,
  }));
});

test("contest submissions are readable by anyone signed in once the contest ends (drives the leaderboard)", async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await seedContest(ctx, "c-live", { contestEnd: FUTURE });
    await seedContest(ctx, "c-ended", { contestEnd: PAST });
    await ctx.firestore().doc("contests/c-live/submissions/author-uid").set({ answers: {}, graded: false });
    await ctx.firestore().doc("contests/c-ended/submissions/author-uid").set({ answers: {}, graded: false });
  });
  const other = testEnv.authenticatedContext("other-uid");
  await assertFails(other.firestore().doc("contests/c-live/submissions/author-uid").get());
  await assertSucceeds(other.firestore().doc("contests/c-ended/submissions/author-uid").get());
});

test("any signed-in user may bump a contest's participantCount by exactly one, not an arbitrary amount", async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => { await seedContest(ctx, "c1", { participantCount: 0 }); });
  const user = testEnv.authenticatedContext("user-uid");
  await assertFails(user.firestore().doc("contests/c1").update({ participantCount: 500 }));
  await assertSucceeds(user.firestore().doc("contests/c1").update({ participantCount: 1 }));
});

test("only admin can write contest questions/answerKeys; anyone can read published contests and their questions", async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => { await seedContest(ctx, "c1"); });
  const guest = testEnv.unauthenticatedContext();
  await assertSucceeds(guest.firestore().doc("contests/c1").get());
  await assertSucceeds(guest.firestore().doc("contests/c1/questions/q1").get());
  await assertFails(guest.firestore().doc("contests/c1/questions/q1").set({ question: "hack" }));

  const admin = testEnv.authenticatedContext("admin-uid", { admin: true });
  await assertSucceeds(admin.firestore().doc("contests/c1/questions/q1").set({ question: "2+2?", options: [] }));
  await assertSucceeds(admin.firestore().doc("contests/c1/answerKeys/q1").set({ correctOptionIds: ["a"] }));
});

// --- CodeLab ---

async function seedProblem(ctx, problemId, overrides = {}) {
  await ctx.firestore().doc(`problems/${problemId}`).set({ status: "published", ...overrides });
}

test("anyone can read a published problem and its sample tests; a client can NEVER read hidden tests", async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await seedProblem(ctx, "p1");
    await ctx.firestore().doc("problems/p1/sampleTests/t1").set({ input: "1", expectedOutput: "1" });
    await ctx.firestore().doc("problems/p1/hiddenTests/t1").set({ input: "2", expectedOutput: "4" });
  });
  const guest = testEnv.unauthenticatedContext();
  await assertSucceeds(guest.firestore().doc("problems/p1").get());
  await assertSucceeds(guest.firestore().doc("problems/p1/sampleTests/t1").get());
  await assertFails(guest.firestore().doc("problems/p1/hiddenTests/t1").get());

  const user = testEnv.authenticatedContext("user-uid");
  await assertFails(user.firestore().doc("problems/p1/hiddenTests/t1").get());

  const admin = testEnv.authenticatedContext("admin-uid", { admin: true });
  await assertSucceeds(admin.firestore().doc("problems/p1/hiddenTests/t1").get());
});

test("only admin can write problems/sample/hidden tests", async () => {
  const user = testEnv.authenticatedContext("user-uid");
  await assertFails(user.firestore().doc("problems/p1").set({ status: "published", title: "hack" }));
  const admin = testEnv.authenticatedContext("admin-uid", { admin: true });
  await assertSucceeds(admin.firestore().doc("problems/p1").set({ status: "published", title: "Two Sum" }));
});

test("codelab_submissions are owner/admin read-only; a client can never write one directly (grading is backend-only)", async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().doc("codelab_submissions/s1").set({ uid: "owner-uid", verdict: "Accepted" });
  });
  const owner = testEnv.authenticatedContext("owner-uid");
  await assertSucceeds(owner.firestore().doc("codelab_submissions/s1").get());
  await assertFails(owner.firestore().doc("codelab_submissions/s1").set({ uid: "owner-uid", verdict: "Accepted" }));

  const other = testEnv.authenticatedContext("other-uid");
  await assertFails(other.firestore().doc("codelab_submissions/s1").get());
});

test("a user can only read/write their own codelab progress, not someone else's", async () => {
  const owner = testEnv.authenticatedContext("owner-uid");
  await assertSucceeds(owner.firestore().doc("user_codelab_progress/owner-uid").set({ solvedProblems: {} }));
  const other = testEnv.authenticatedContext("other-uid");
  await assertFails(other.firestore().doc("user_codelab_progress/owner-uid").get());
});
