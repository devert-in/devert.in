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
import { collection, query, where, getDocs } from "firebase/firestore";

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

test("the owner can write arbitrary portfolio fields to their own profile doc", async () => {
  const owner = testEnv.authenticatedContext("owner-uid");
  await assertSucceeds(owner.firestore().doc("users/owner-uid").set({
    handle: "owner", headline: "Backend Engineer", experience: [{ role: "Intern" }],
    theme: { accent: "#00FF41" }, sectionOrder: ["projects", "experience"],
  }));
});

test("a non-owner may bump profileViews alone, but not alongside any other field", async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().doc("users/victim-uid").set({ handle: "victim", profileViews: 0, xp: 100 });
  });
  const visitor = testEnv.authenticatedContext("visitor-uid");
  await assertSucceeds(visitor.firestore().doc("users/victim-uid").update({ profileViews: 1 }));
  await assertFails(visitor.firestore().doc("users/victim-uid").update({ profileViews: 2, bio: "hacked" }));
  await assertFails(visitor.firestore().doc("users/victim-uid").update({ xp: 999999 }));
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

test("the owner CANNOT set an arbitrary balance on their own earnings doc (forging via devtools)", async () => {
  const owner = testEnv.authenticatedContext("owner-uid");
  const ownEarnings = owner.firestore().doc("user_earnings/owner-uid");
  await assertFails(ownEarnings.set({ pulseCoins: 250000, totalCoins: 250000 }, { merge: true }));
});

test("the owner CAN convert XP to coins - a bounded, positive, lockstep increase", async () => {
  const owner = testEnv.authenticatedContext("owner-uid");
  const ownEarnings = owner.firestore().doc("user_earnings/owner-uid");
  await assertSucceeds(ownEarnings.set({ pulseCoins: 100, totalCoins: 100 }, { merge: true }));
  // A second conversion must still move both fields by the same amount.
  await assertFails(ownEarnings.set({ pulseCoins: 300, totalCoins: 250 }, { merge: true }));
});

test("the owner CANNOT convert more than the per-write coin cap in one shot", async () => {
  const owner = testEnv.authenticatedContext("owner-uid");
  const ownEarnings = owner.firestore().doc("user_earnings/owner-uid");
  await assertFails(ownEarnings.set({ pulseCoins: 5001, totalCoins: 5001 }, { merge: true }));
});

test("the owner CAN reserve/withdraw coins on payout - pulseCoins decreases, totalCoins never moves", async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().doc("user_earnings/owner-uid").set({ pulseCoins: 5000, totalCoins: 5000 });
  });
  const owner = testEnv.authenticatedContext("owner-uid");
  const ownEarnings = owner.firestore().doc("user_earnings/owner-uid");
  await assertSucceeds(ownEarnings.update({ pulseCoins: 3000 }));
  // Can't sneak totalCoins down in the same "withdrawal" shape.
  await assertFails(ownEarnings.update({ pulseCoins: 1000, totalCoins: 4000 }));
  // Can't go negative.
  await assertFails(ownEarnings.update({ pulseCoins: -1 }));
});

test("any signed-in user may bump a mission's filled count by exactly one when accepting it", async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().doc("missions/m1").set({ title: "First Ship", slots: 10, filled: 0 });
  });
  const user = testEnv.authenticatedContext("user-uid");
  await assertFails(user.firestore().doc("missions/m1").update({ filled: 5 }));
  await assertSucceeds(user.firestore().doc("missions/m1").update({ filled: 1 }));
});

test("a player can start an arena match session for themself, but not for someone else or already-won", async () => {
  const player = testEnv.authenticatedContext("player-uid");
  await assertSucceeds(player.firestore().collection("arena_matches").add({
    uid: "player-uid", problemId: "p1", status: "in_progress",
  }));
  await assertFails(player.firestore().collection("arena_matches").add({
    uid: "someone-else", problemId: "p1", status: "in_progress",
  }));
  await assertFails(player.firestore().collection("arena_matches").add({
    uid: "player-uid", problemId: "p1", status: "won", xpEarned: 500,
  }));
});

test("a player can self-report a forfeit/timeout (0 XP) but can never flip their own match to won", async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().doc("arena_matches/m1").set({ uid: "player-uid", problemId: "p1", status: "in_progress" });
  });
  const player = testEnv.authenticatedContext("player-uid");
  await assertSucceeds(player.firestore().doc("arena_matches/m1").update({ status: "forfeit" }));
});

test("a player cannot forge their own arena win or touch xp/testsPassed on a match doc", async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().doc("arena_matches/m2").set({ uid: "player-uid", problemId: "p1", status: "in_progress" });
  });
  const player = testEnv.authenticatedContext("player-uid");
  await assertFails(player.firestore().doc("arena_matches/m2").update({ status: "won", xpEarned: 500, testsPassed: 5 }));
  await assertFails(player.firestore().doc("arena_matches/m2").update({ status: "forfeit", xpEarned: 500 }));
});

test("a non-owner cannot resolve or touch someone else's arena match", async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().doc("arena_matches/m3").set({ uid: "victim-uid", problemId: "p1", status: "in_progress" });
  });
  const attacker = testEnv.authenticatedContext("attacker-uid");
  await assertFails(attacker.firestore().doc("arena_matches/m3").update({ status: "forfeit" }));
});

test("a new pulse post must start with every engagement counter at zero", async () => {
  const author = testEnv.authenticatedContext("author-uid");
  await assertFails(author.firestore().doc("pulse_posts/forged-post").set({
    uid: "author-uid", status: "approved", likeCount: 99999,
  }));
  await assertSucceeds(author.firestore().doc("pulse_posts/real-post").set({
    uid: "author-uid", status: "approved", likeCount: 0, commentCount: 0,
  }));
});

test("a user can only create a pulse_like under their own uid, not impersonate another user's like", async () => {
  const attacker = testEnv.authenticatedContext("attacker-uid");
  await assertFails(attacker.firestore().doc("pulse_likes/post-1_victim-uid").set({
    postId: "post-1", uid: "victim-uid",
  }));
  await assertSucceeds(attacker.firestore().doc("pulse_likes/post-1_attacker-uid").set({
    postId: "post-1", uid: "attacker-uid",
  }));
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

test("a signed-in user may bump an aptitude question's global stat counters by one attempt's worth, but not touch its content", async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().doc("aptitude_topics/percentages/questions/q1").set({
      question: "2+2?", options: ["3", "4", "5", "6"], correctIndex: 1,
      attemptCount: 0, correctCount: 0, totalTimeSec: 0,
    });
  });
  const user = testEnv.authenticatedContext("user-uid");
  const ref = user.firestore().doc("aptitude_topics/percentages/questions/q1");

  // Bounded stat bump: allowed.
  await assertSucceeds(ref.update({ attemptCount: 1, correctCount: 1, totalTimeSec: 42 }));
  // Guest (unauthenticated) may not, even bounded.
  await assertFails(testEnv.unauthenticatedContext().firestore().doc("aptitude_topics/percentages/questions/q1")
    .update({ attemptCount: 2, correctCount: 1, totalTimeSec: 10 }));
  // Jumping attemptCount by more than one attempt: denied.
  await assertFails(ref.update({ attemptCount: 10 }));
  // Touching content fields, even alongside a valid counter bump: denied.
  await assertFails(ref.update({ attemptCount: 2, correctIndex: 0 }));
  await assertFails(ref.update({ question: "hacked" }));
});

test("a user can only read/write their own aptitude progress, not someone else's", async () => {
  const owner = testEnv.authenticatedContext("owner-uid");
  await assertSucceeds(owner.firestore().doc("user_aptitude_progress/owner-uid").set({ attempted: {} }));

  const other = testEnv.authenticatedContext("other-uid");
  await assertFails(other.firestore().doc("user_aptitude_progress/owner-uid").set({ attempted: {} }));
  await assertFails(other.firestore().doc("user_aptitude_progress/owner-uid").get());
});

test("a user's email lives in users_private, readable only by owner/admin - never the public users doc", async () => {
  const owner = testEnv.authenticatedContext("owner-uid");
  await assertSucceeds(owner.firestore().doc("users_private/owner-uid").set({ email: "owner@example.com" }));
  await assertSucceeds(owner.firestore().doc("users_private/owner-uid").get());

  const stranger = testEnv.authenticatedContext("stranger-uid");
  await assertFails(stranger.firestore().doc("users_private/owner-uid").get());

  const guest = testEnv.unauthenticatedContext();
  await assertFails(guest.firestore().doc("users_private/owner-uid").get());
});

test("notifications are only readable by their own targetUid (or the 'all' broadcast), not the whole world", async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().doc("notifications/n1").set({ targetUid: "victim-uid", title: "payout approved" });
    await ctx.firestore().doc("notifications/n2").set({ targetUid: "all", title: "platform update" });
  });
  const guest = testEnv.unauthenticatedContext();
  await assertFails(guest.firestore().doc("notifications/n1").get());

  const stranger = testEnv.authenticatedContext("stranger-uid");
  await assertFails(stranger.firestore().doc("notifications/n1").get());
  await assertSucceeds(stranger.firestore().doc("notifications/n2").get());

  const victim = testEnv.authenticatedContext("victim-uid");
  await assertSucceeds(victim.firestore().doc("notifications/n1").get());
});

test("a hackathon submission owner cannot forge their own score/rank/winner, only admin can", async () => {
  const user = testEnv.authenticatedContext("user-uid");
  await assertFails(user.firestore().doc("hackathon_submissions/hack1_user-uid").set({
    uid: "user-uid", hackathonSlug: "hack1", score: 9999, winner: true, rank: 1,
  }));
  await assertSucceeds(user.firestore().doc("hackathon_submissions/hack1_user-uid").set({
    uid: "user-uid", hackathonSlug: "hack1", score: null, winner: false, rank: null,
  }));
  // Once admin scores it, the owner is locked out of further edits entirely.
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().doc("hackathon_submissions/hack1_user-uid").update({ score: 80 });
  });
  await assertFails(user.firestore().doc("hackathon_submissions/hack1_user-uid").update({ projectName: "still mine" }));
  const admin = testEnv.authenticatedContext("admin-uid", { admin: true });
  await assertSucceeds(admin.firestore().doc("hackathon_submissions/hack1_user-uid").update({ score: 95, winner: true, rank: 1 }));
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

test("a user can create their own contest submission with raw answers + honest maxScore only, not with a score", async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => { await seedContest(ctx, "c1"); });
  const user = testEnv.authenticatedContext("user-uid");
  await assertSucceeds(user.firestore().doc("contests/c1/submissions/user-uid").set({
    answers: { q1: "a" }, graded: false, maxScore: 10,
  }));
  await assertFails(user.firestore().doc("contests/c1/submissions/other-uid").set({
    answers: { q1: "a" }, graded: false, maxScore: 10,
  }));
  await assertFails(user.firestore().doc("contests/c1/submissions/user-uid2").set({
    answers: { q1: "a" }, graded: false, score: 999, maxScore: 10,
  }));
  // No maxScore at all, or an absurd one - rejected.
  await assertFails(user.firestore().doc("contests/c1/submissions/user-uid3").set({
    answers: { q1: "a" }, graded: false,
  }));
  await assertFails(user.firestore().doc("contests/c1/submissions/user-uid4").set({
    answers: { q1: "a" }, graded: false, maxScore: 5000,
  }));
});

test("a user cannot grade their own contest submission before contestEnd, above the contest's prize caps, or above maxScore", async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await seedContest(ctx, "c-live", { contestEnd: FUTURE, prizeXp: 100, prizeCoins: 50 });
    await seedContest(ctx, "c-ended", { contestEnd: PAST, prizeXp: 100, prizeCoins: 50 });
    await ctx.firestore().doc("contests/c-live/submissions/user-uid").set({ answers: {}, graded: false, maxScore: 10 });
    await ctx.firestore().doc("contests/c-ended/submissions/user-uid").set({ answers: {}, graded: false, maxScore: 10 });
  });
  const user = testEnv.authenticatedContext("user-uid");
  // Contest still running - grading update rejected regardless of amount.
  await assertFails(user.firestore().doc("contests/c-live/submissions/user-uid").update({
    graded: true, score: 10, accuracy: 100, correctCount: 10, xpEarned: 50, coinsEarned: 20,
  }));
  // Contest ended, but claiming more than the announced prize cap - rejected.
  await assertFails(user.firestore().doc("contests/c-ended/submissions/user-uid").update({
    graded: true, score: 10, accuracy: 100, correctCount: 10, xpEarned: 99999, coinsEarned: 50,
  }));
  // Contest ended, within prize caps but score forged past the honest maxScore - rejected.
  await assertFails(user.firestore().doc("contests/c-ended/submissions/user-uid").update({
    graded: true, score: 999, accuracy: 100, correctCount: 10, xpEarned: 50, coinsEarned: 20,
  }));
  // Contest ended, within caps and within maxScore - allowed, exactly once.
  await assertSucceeds(user.firestore().doc("contests/c-ended/submissions/user-uid").update({
    graded: true, score: 10, accuracy: 100, correctCount: 10, xpEarned: 50, coinsEarned: 20,
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

// Regression test for the isAdminOfStudent security fix: an institution
// admin must NOT be able to read a stranger's global progress docs (for the
// Student Analytics Dashboard) just because that stranger's own users/{uid}
// doc happens to claim the admin's institutionId - the field alone is not
// trustworthy (any institution admin can write it - see the users/{uid}
// rule's institution-admin branch). Only a REAL approved roster entry
// (institutions/{id}/students/{uid}.status == 'approved') should unlock it.
test("an institution admin can only read a student's global progress docs if a real approved roster entry backs it - a forged users.institutionId alone is not enough", async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await seedInstitution(ctx, "mrcet");
    await ctx.firestore().doc("institutions/mrcet/admins/mrcet-admin-uid").set({ uid: "mrcet-admin-uid", role: "faculty" });
    await ctx.firestore().doc("user_codelab_progress/victim-uid").set({ solvedProblems: {} });
    // Pre-existing users/{uid} doc, with no institutionId yet - the admin's
    // write below must be an update (merge onto an existing doc), matching
    // real usage (every real user doc is created at signup, long before any
    // campus membership exists).
    await ctx.firestore().doc("users/victim-uid").set({ displayName: "Victim" });
  });
  const mrcetAdmin = testEnv.authenticatedContext("mrcet-admin-uid");

  // The admin forges the victim's own users/{uid}.institutionId (a write the
  // users/{uid} rule's institution-admin branch already permits) - without a
  // matching real, approved institutions/mrcet/students/victim-uid doc, that
  // alone must NOT unlock read access to the victim's progress.
  await assertSucceeds(mrcetAdmin.firestore().doc("users/victim-uid").set({ institutionId: "mrcet" }, { merge: true }));
  await assertFails(mrcetAdmin.firestore().doc("user_codelab_progress/victim-uid").get());

  // Once a real approved roster entry exists for that exact uid under this
  // admin's own institution, read access is correctly granted.
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().doc("institutions/mrcet/students/victim-uid").set({ uid: "victim-uid", status: "approved" });
  });
  await assertSucceeds(mrcetAdmin.firestore().doc("user_codelab_progress/victim-uid").get());
});

// --- DeVert Campus ---

async function seedInstitution(ctx, institutionId, overrides = {}) {
  await ctx.firestore().doc(`institutions/${institutionId}`).set({
    name: "Test College", slug: institutionId, accessMode: "public", status: "active",
    ...overrides,
  });
}

test("anyone can read the institutions directory; only platform admin can create/edit one", async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => { await seedInstitution(ctx, "mrcet"); });
  const guest = testEnv.unauthenticatedContext();
  await assertSucceeds(guest.firestore().doc("institutions/mrcet").get());
  await assertFails(guest.firestore().doc("institutions/other").set({ name: "hack" }));

  const admin = testEnv.authenticatedContext("admin-uid", { admin: true });
  await assertSucceeds(admin.firestore().doc("institutions/other").set({ name: "Other College", slug: "other" }));
});

test("a student can request to join (create their own pending doc), but cannot self-approve or request for someone else", async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => { await seedInstitution(ctx, "mrcet"); });
  const student = testEnv.authenticatedContext("student-uid");
  await assertSucceeds(student.firestore().doc("institutions/mrcet/students/student-uid").set({
    uid: "student-uid", name: "A Student", rollNumber: "21A1", status: "pending",
    department: "CSE", year: "I Year", section: "A",
  }));
  await assertFails(student.firestore().doc("institutions/mrcet/students/other-uid").set({
    uid: "other-uid", status: "pending",
  }));
  await assertFails(student.firestore().doc("institutions/mrcet/students/student-uid2").set({
    uid: "student-uid2", status: "approved",
  }));
});

test("Campus Entry rejects a department/year not in the canonical lists, a multi-char section, and a missing department entirely - but never throws, always a clean permission-denied", async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => { await seedInstitution(ctx, "mrcet"); });
  const student = testEnv.authenticatedContext("student-uid");
  await assertFails(student.firestore().doc("institutions/mrcet/students/student-uid").set({
    uid: "student-uid", status: "pending", department: "Not A Real Dept", year: "I Year", section: "A",
  }));
  await assertFails(student.firestore().doc("institutions/mrcet/students/student-uid").set({
    uid: "student-uid", status: "pending", department: "CSE", year: "5th Year", section: "A",
  }));
  await assertFails(student.firestore().doc("institutions/mrcet/students/student-uid").set({
    uid: "student-uid", status: "pending", department: "CSE", year: "I Year", section: "AB",
  }));
  // No department/year/section field at all (e.g. a stale client) must be a
  // graceful deny, not a rules evaluation error - regression test for the
  // isValidDepartment/isValidYear .get(field, '') fix (direct property
  // access on a genuinely-missing field throws in rules, denying the whole
  // OR'd expression rather than just this branch).
  await assertFails(student.firestore().doc("institutions/mrcet/students/student-uid").set({
    uid: "student-uid", status: "pending", name: "No academic fields",
  }));
  await assertSucceeds(student.firestore().doc("institutions/mrcet/students/student-uid").set({
    uid: "student-uid", status: "pending", department: "CSE(AI&ML)", year: "III Year", section: "A",
  }));
});

test("only that institution's own admin (or platform admin) can approve/reject a student - not a random user, not another college's admin", async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await seedInstitution(ctx, "mrcet");
    await seedInstitution(ctx, "other-college");
    await ctx.firestore().doc("institutions/mrcet/students/student-uid").set({ uid: "student-uid", status: "pending" });
    await ctx.firestore().doc("institutions/mrcet/admins/mrcet-admin-uid").set({ uid: "mrcet-admin-uid", role: "faculty" });
    await ctx.firestore().doc("institutions/other-college/admins/other-admin-uid").set({ uid: "other-admin-uid", role: "faculty" });
  });
  const randomUser = testEnv.authenticatedContext("random-uid");
  await assertFails(randomUser.firestore().doc("institutions/mrcet/students/student-uid").update({ status: "approved" }));

  // Cross-tenant isolation: an admin of a DIFFERENT college cannot touch mrcet's roster.
  const wrongCollegeAdmin = testEnv.authenticatedContext("other-admin-uid");
  await assertFails(wrongCollegeAdmin.firestore().doc("institutions/mrcet/students/student-uid").update({ status: "approved" }));

  const mrcetAdmin = testEnv.authenticatedContext("mrcet-admin-uid");
  await assertSucceeds(mrcetAdmin.firestore().doc("institutions/mrcet/students/student-uid").update({
    status: "approved", department: "CSE", year: 2,
  }));
});

test("daily learning / announcements are invisible to non-members, visible to that college's approved students and admins", async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await seedInstitution(ctx, "mrcet");
    await ctx.firestore().doc("institutions/mrcet/dailyLearning/day1").set({ title: "Arrays 101" });
    await ctx.firestore().doc("institutions/mrcet/students/approved-uid").set({ uid: "approved-uid", status: "approved" });
    await ctx.firestore().doc("institutions/mrcet/students/pending-uid").set({ uid: "pending-uid", status: "pending" });
  });
  const outsider = testEnv.authenticatedContext("outsider-uid");
  await assertFails(outsider.firestore().doc("institutions/mrcet/dailyLearning/day1").get());

  const pending = testEnv.authenticatedContext("pending-uid");
  await assertFails(pending.firestore().doc("institutions/mrcet/dailyLearning/day1").get());

  const approved = testEnv.authenticatedContext("approved-uid");
  await assertSucceeds(approved.firestore().doc("institutions/mrcet/dailyLearning/day1").get());
  await assertFails(approved.firestore().doc("institutions/mrcet/dailyLearning/day1").set({ title: "hacked" }));
});

test("a student can never set their own institutionId/department on their public profile - only that college's admin can, and only those fields", async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await seedInstitution(ctx, "mrcet");
    await ctx.firestore().doc("users/student-uid").set({ handle: "student", xp: 0 });
    await ctx.firestore().doc("institutions/mrcet/admins/mrcet-admin-uid").set({ uid: "mrcet-admin-uid" });
  });
  const student = testEnv.authenticatedContext("student-uid");
  await assertFails(student.firestore().doc("users/student-uid").update({ institutionId: "mrcet" }));
  // Sneaking it in alongside an otherwise-legal profile edit is also denied.
  await assertFails(student.firestore().doc("users/student-uid").update({ bio: "hi", institutionId: "mrcet" }));

  const mrcetAdmin = testEnv.authenticatedContext("mrcet-admin-uid");
  await assertSucceeds(mrcetAdmin.firestore().doc("users/student-uid").update({
    institutionId: "mrcet", institutionSlug: "mrcet", department: "CSE", year: 2, section: "A",
  }));
  // That admin's write path is ONLY those five fields - can't ride along with xp/credits.
  await assertFails(mrcetAdmin.firestore().doc("users/student-uid").update({ institutionId: "mrcet", xp: 999999 }));
});

// --- DeVert Campus: institution-scoped contests ---

test("an institution admin can create a contest for their own institution, but not for one they don't admin", async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().doc("institutions/mrcet/admins/mrcet-admin-uid").set({ uid: "mrcet-admin-uid" });
  });
  const mrcetAdmin = testEnv.authenticatedContext("mrcet-admin-uid");
  await assertSucceeds(mrcetAdmin.firestore().collection("contests").add({
    title: "MRCET Weekly Aptitude", status: "draft", institutionId: "mrcet", participantCount: 0,
  }));
  await assertFails(mrcetAdmin.firestore().collection("contests").add({
    title: "Sneaky global contest", status: "draft", participantCount: 0,
  }));
  await assertFails(mrcetAdmin.firestore().collection("contests").add({
    title: "Someone else's college", status: "draft", institutionId: "other-college", participantCount: 0,
  }));
  const randomUser = testEnv.authenticatedContext("random-uid");
  await assertFails(randomUser.firestore().collection("contests").add({
    title: "Not an admin at all", status: "draft", institutionId: "mrcet", participantCount: 0,
  }));
});

test("an institution-scoped contest is invisible to outsiders even when published, visible to that institution's approved students/admins", async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().doc("contests/inst-contest").set({ title: "MRCET Contest", status: "published", institutionId: "mrcet" });
    await ctx.firestore().doc("institutions/mrcet/students/approved-uid").set({ uid: "approved-uid", status: "approved" });
    await ctx.firestore().doc("institutions/mrcet/admins/mrcet-admin-uid").set({ uid: "mrcet-admin-uid" });
    await ctx.firestore().doc("institutions/other-college/admins/other-admin-uid").set({ uid: "other-admin-uid" });
  });
  const outsider = testEnv.authenticatedContext("outsider-uid");
  await assertFails(outsider.firestore().doc("contests/inst-contest").get());

  const wrongCollegeAdmin = testEnv.authenticatedContext("other-admin-uid");
  await assertFails(wrongCollegeAdmin.firestore().doc("contests/inst-contest").get());

  const approvedStudent = testEnv.authenticatedContext("approved-uid");
  await assertSucceeds(approvedStudent.firestore().doc("contests/inst-contest").get());

  const mrcetAdmin = testEnv.authenticatedContext("mrcet-admin-uid");
  await assertSucceeds(mrcetAdmin.firestore().doc("contests/inst-contest").get());

  // Global Arena hub is unaffected - a contest with no institutionId stays exactly
  // as open as before.
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().doc("contests/global-contest").set({ title: "Global Arena Contest", status: "published" });
  });
  await assertSucceeds(outsider.firestore().doc("contests/global-contest").get());
});

test("an institution admin can manage their own contest's questions/answerKeys, but not another institution's, and can't reassign institutionId", async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().doc("contests/inst-contest").set({ title: "MRCET Contest", status: "draft", institutionId: "mrcet" });
    await ctx.firestore().doc("institutions/mrcet/admins/mrcet-admin-uid").set({ uid: "mrcet-admin-uid" });
    await ctx.firestore().doc("institutions/other-college/admins/other-admin-uid").set({ uid: "other-admin-uid" });
  });
  const mrcetAdmin = testEnv.authenticatedContext("mrcet-admin-uid");
  await assertSucceeds(mrcetAdmin.firestore().doc("contests/inst-contest/questions/q1").set({ question: "2+2?", options: [] }));
  await assertSucceeds(mrcetAdmin.firestore().doc("contests/inst-contest/answerKeys/q1").set({ correctOptionIds: ["a"] }));
  await assertSucceeds(mrcetAdmin.firestore().doc("contests/inst-contest").update({ status: "published" }));
  // Can't move it to a different institution (or make it global) via update.
  await assertFails(mrcetAdmin.firestore().doc("contests/inst-contest").update({ institutionId: "other-college" }));

  const wrongCollegeAdmin = testEnv.authenticatedContext("other-admin-uid");
  await assertFails(wrongCollegeAdmin.firestore().doc("contests/inst-contest/questions/q2").set({ question: "hack" }));
  await assertFails(wrongCollegeAdmin.firestore().doc("contests/inst-contest").update({ status: "archived" }));
});

test("an institution-scoped contest's questions/answerKeys/submissions/registration are restricted to that college's own approved students - not any signed-in DeVert user", async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await seedContest(ctx, "inst-ended", { institutionId: "mrcet", contestEnd: PAST });
    await ctx.firestore().doc("contests/inst-ended/questions/q1").set({ question: "2+2?", options: [] });
    await ctx.firestore().doc("contests/inst-ended/answerKeys/q1").set({ correctOptionIds: ["a"] });
    await ctx.firestore().doc("contests/inst-ended/submissions/approved-uid").set({ answers: {}, graded: true, maxScore: 10, score: 8 });
    await seedContest(ctx, "inst-live", { institutionId: "mrcet", contestEnd: FUTURE, registrationEnd: FUTURE });
    await ctx.firestore().doc("institutions/mrcet/students/approved-uid").set({ uid: "approved-uid", status: "approved" });
  });

  const outsider = testEnv.authenticatedContext("outsider-uid");
  await assertFails(outsider.firestore().doc("contests/inst-ended/questions/q1").get());
  await assertFails(outsider.firestore().doc("contests/inst-ended/answerKeys/q1").get());
  await assertFails(outsider.firestore().doc("contests/inst-ended/submissions/approved-uid").get());
  await assertFails(outsider.firestore().doc("contests/inst-live/registrations/outsider-uid").set({ registeredAt: new Date() }));

  const approvedStudent = testEnv.authenticatedContext("approved-uid");
  await assertSucceeds(approvedStudent.firestore().doc("contests/inst-ended/questions/q1").get());
  await assertSucceeds(approvedStudent.firestore().doc("contests/inst-ended/answerKeys/q1").get());
  await assertSucceeds(approvedStudent.firestore().doc("contests/inst-ended/submissions/approved-uid").get());
  await assertSucceeds(approvedStudent.firestore().doc("contests/inst-live/registrations/approved-uid").set({ registeredAt: new Date() }));

  // A global (no institutionId) contest stays exactly as open as before - the
  // fix only tightens institution-scoped contests, never today's Arena behavior.
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await seedContest(ctx, "global-ended", { contestEnd: PAST });
    await ctx.firestore().doc("contests/global-ended/questions/q1").set({ question: "2+2?", options: [] });
  });
  await assertSucceeds(outsider.firestore().doc("contests/global-ended/questions/q1").get());
});

// --- Company Prep ---

async function seedCompanyQuestion(ctx, companyId, { status = "published" } = {}) {
  await ctx.firestore().doc(`companies/${companyId}`).set({ name: "Cognizant", status, order: 0 });
  await ctx.firestore().doc(`companies/${companyId}/rounds/technical`).set({ name: "Technical Assessment", order: 0 });
  await ctx.firestore().doc(`companies/${companyId}/rounds/technical/categories/oop`).set({ name: "OOP", order: 0 });
  await ctx.firestore().doc(`companies/${companyId}/rounds/technical/categories/oop/questions/q1`).set({
    question: "What is encapsulation?", options: ["A", "B", "C", "D"], correctIndex: 0,
    attemptCount: 0, correctCount: 0, totalTimeSec: 0,
  });
}

test("a draft company's questions are admin-only; a published company's are public, and a signed-in user may only bump the bounded stat counters", async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await seedCompanyQuestion(ctx, "cog-draft", { status: "draft" });
    await seedCompanyQuestion(ctx, "cog-live", { status: "published" });
  });
  const qPath = (companyId) => `companies/${companyId}/rounds/technical/categories/oop/questions/q1`;

  const outsider = testEnv.authenticatedContext("outsider-uid");
  await assertFails(outsider.firestore().doc("companies/cog-draft").get());
  await assertFails(outsider.firestore().doc(qPath("cog-draft")).get());
  await assertSucceeds(outsider.firestore().doc("companies/cog-live").get());
  await assertSucceeds(outsider.firestore().doc(qPath("cog-live")).get());

  // Bounded counter bump only - not the question content itself.
  await assertSucceeds(outsider.firestore().doc(qPath("cog-live")).update({
    attemptCount: 1, correctCount: 1, totalTimeSec: 30,
  }));
  await assertFails(outsider.firestore().doc(qPath("cog-live")).update({ correctIndex: 2 }));
  await assertFails(outsider.firestore().doc(qPath("cog-live")).update({
    attemptCount: 5, correctCount: 1, totalTimeSec: 30,
  }));

  // Not an admin at all - can't author a new company.
  await assertFails(outsider.firestore().collection("companies").add({ name: "New Co", status: "draft", order: 1 }));
});

test("a user can only read/write their own Company Prep solved/bookmarked progress, not someone else's", async () => {
  const me = testEnv.authenticatedContext("me-uid");
  const other = testEnv.authenticatedContext("other-uid");
  await assertSucceeds(me.firestore().doc("user_companyPrep/me-uid").set({ solved: { q1: true } }, { merge: true }));
  await assertSucceeds(me.firestore().doc("user_companyPrep/me-uid").get());
  await assertFails(other.firestore().doc("user_companyPrep/me-uid").set({ solved: { q1: true } }, { merge: true }));
  await assertFails(other.firestore().doc("user_companyPrep/me-uid").get());
});

// --- Institution access modes ---

test("a private institution is invisible to outsiders (get and list) but visible to its own approved students/admins", async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().doc("institutions/secret-college").set({ name: "Secret College", accessMode: "private", status: "active" });
    await ctx.firestore().doc("institutions/secret-college/students/approved-uid").set({ uid: "approved-uid", status: "approved" });
    await ctx.firestore().doc("institutions/secret-college/admins/admin-uid").set({ uid: "admin-uid" });
    await ctx.firestore().doc("institutions/open-college").set({ name: "Open College", accessMode: "public", status: "active" });
  });

  const outsider = testEnv.authenticatedContext("outsider-uid");
  await assertFails(outsider.firestore().doc("institutions/secret-college").get());

  // A blanket, unfiltered list() is NOT retroactively filtered per-document
  // by this rule (verified: Firestore can only prove a `list()` safe when
  // the query's own `where` matches the rule's condition, same as
  // fetchPublishedContests()/fetchPublishedCompanies() elsewhere in this
  // file) - so the real app's fetchInstitutions() query (lib/institutions.js)
  // must itself filter on accessMode, which is what's under test here, not
  // a bare collection().get().
  const scopedQuery = query(collection(outsider.firestore(), "institutions"), where("accessMode", "in", ["public", "invite_only"]));
  const outsiderList = await getDocs(scopedQuery);
  assert.ok(!outsiderList.docs.some(d => d.id === "secret-college"), "private institution leaked into fetchInstitutions()'s query shape");
  assert.ok(outsiderList.docs.some(d => d.id === "open-college"), "public institution wrongly excluded from fetchInstitutions()'s query shape");

  // Confirms the earlier, unscoped list() really is unfiltered by the rule
  // alone (documenting the Firestore behavior the comment above describes,
  // not something to fix here) - this is exactly why fetchInstitutions()
  // must filter server-side rather than relying on firestore.rules to do it
  // for an arbitrary query shape.
  const unscopedList = await getDocs(collection(outsider.firestore(), "institutions"));
  assert.ok(unscopedList.docs.some(d => d.id === "secret-college"), "expected the unscoped list() to still include the private doc (Firestore doesn't retroactively filter it)");

  const approvedStudent = testEnv.authenticatedContext("approved-uid");
  await assertSucceeds(approvedStudent.firestore().doc("institutions/secret-college").get());
  const admin = testEnv.authenticatedContext("admin-uid");
  await assertSucceeds(admin.firestore().doc("institutions/secret-college").get());
});

test("invite_only institutions accept a self-serve pending submission (Campus Identity Verification), same as public - the client form differs, not the rule", async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().doc("institutions/vip-college").set({ name: "VIP College", accessMode: "invite_only", status: "active" });
    await ctx.firestore().doc("institutions/vip-college/admins/admin-uid").set({ uid: "admin-uid" });
  });

  const student = testEnv.authenticatedContext("student-uid");
  await assertSucceeds(student.firestore().doc("institutions/vip-college/students/student-uid").set({
    uid: "student-uid", status: "pending", name: "Test Student", rollNumber: "21A91A0512",
    department: "CSE", year: "I Year", section: "A",
  }));
  // A student can never set themselves straight to "approved," invite_only or not.
  await assertFails(student.firestore().doc("institutions/vip-college/students/student-uid").set({ uid: "student-uid", status: "approved" }));
  // Roll Number Lock: the student can never update their own submitted doc afterward.
  await assertFails(student.firestore().doc("institutions/vip-college/students/student-uid").update({ name: "Changed Name" }));

  // The institution's own admin can approve it, and can edit identity fields
  // afterward (the only path for post-submission corrections).
  const admin = testEnv.authenticatedContext("admin-uid");
  await assertSucceeds(admin.firestore().doc("institutions/vip-college/students/student-uid").update({ status: "approved" }));
  await assertSucceeds(admin.firestore().doc("institutions/vip-college/students/student-uid").update({
    rollNumber: "21A91A0599", identityAuditLog: ["placeholder-array-write-still-an-update"],
  }));
});
