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
import {
  collection, query, where, getDocs, getCountFromServer,
  doc, getDoc, setDoc, addDoc, serverTimestamp,
} from "firebase/firestore";

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
    // Mirrors scripts/seed-role-permission-defaults.mjs - a small subset
    // (just the keys the RBAC tests below actually exercise) is enough here;
    // the full catalog lives in lib/permissions.js/that seed script.
    await ctx.firestore().doc("system/rolePermissionDefaults").set({
      principal: { "students.view": true, "students.edit": true, "dailyLearning.publish": true, "classrooms.manage": true },
      hod: { "students.view": true, "students.edit": true, "dailyLearning.publish": true, "classrooms.manage": true },
      facultyClassTeacher: { "students.view": true, "dailyLearning.publish": true, "classrooms.manage": true },
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

// The owner-branch's selfWriteDeltaSane() checks were all vacuously true for
// any field they don't name, so a write touching ONLY one of the ten
// boundedUserCounterWrite() fields (never named there) made the whole owner
// branch collapse to plain isOwner(uid) - no bound at all. Every one of
// these must now be denied from the owner branch and instead forced through
// boundedUserCounterWrite's +-1 check (still available to the owner, since
// that branch only requires isAuth()).
test("the owner CANNOT forge their own social-proof counters to an arbitrary value (devtools)", async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().doc("users/owner-uid").set({
      handle: "owner", followersCount: 3, pulsePostsCount: 1, totalLikesReceived: 2,
      totalCommentsReceived: 0, totalSavesReceived: 0, totalSharesReceived: 0,
      totalViewsReceived: 0, totalRepostsReceived: 0, totalRepostsMade: 0, profileViews: 0,
    });
  });
  const owner = testEnv.authenticatedContext("owner-uid");
  const ownDoc = owner.firestore().doc("users/owner-uid");
  await assertFails(ownDoc.update({ followersCount: 999999999 }));
  await assertFails(ownDoc.update({ pulsePostsCount: 999999999 }));
  await assertFails(ownDoc.update({ totalLikesReceived: 999999999 }));
  await assertFails(ownDoc.update({ profileViews: 999999999 }));
  // A legitimate +-1 bump (e.g. undo-follow rolling back the owner's own
  // pulsePostsCount after deleting a post) must still work.
  await assertSucceeds(ownDoc.update({ pulsePostsCount: 0 }));
});

test("a non-owner cannot set another user's coin balance to an arbitrary value", async () => {
  const attacker = testEnv.authenticatedContext("attacker-uid");
  const victimEarnings = attacker.firestore().doc("user_earnings/victim-uid");
  await assertFails(victimEarnings.set({ pulseCoins: 999999999, totalCoins: 999999999 }));
});

// Pulse's per-like/comment/save coin-crediting flow (a non-owner crediting
// the POST AUTHOR's balance) was removed entirely - pulse-app.jsx no longer
// writes to user_earnings at all for engagement, and this rule's non-owner
// branch was removed to match. A non-owner can never write user_earnings
// now, for any amount, matching/known-reward-rate or not.
test("a non-owner can never credit user_earnings for any amount, known reward rate or not", async () => {
  const liker = testEnv.authenticatedContext("liker-uid");
  const authorEarnings = liker.firestore().doc("user_earnings/author-uid");
  await assertFails(authorEarnings.set({ pulseCoins: 10, totalCoins: 10 }, { merge: true }));

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

// coin_transactions used to also allow a non-owner to create a
// 'like_received'/'comment_received'/'save_received' entry crediting someone
// ELSE's uid, left over from before Pulse engagement stopped granting coins.
// It could no longer inflate the real user_earnings balance (that disjunct
// was already removed), but it let anyone forge a fake "you got a like" row
// on a stranger's coin history/Wallet activity feed. Only a self-logged
// entry (request.resource.data.uid == request.auth.uid) may be created now.
test("coin_transactions can only be self-logged, never forged onto someone else's uid", async () => {
  const liker = testEnv.authenticatedContext("liker-uid");
  await assertFails(liker.firestore().collection("coin_transactions").add({
    uid: "author-uid", amount: 10, type: "like_received",
  }));
  await assertSucceeds(liker.firestore().collection("coin_transactions").add({
    uid: "liker-uid", amount: 25, type: "daily_learning",
  }));
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

// Published aptitude topics (and their questions) are publicly readable;
// only admin can write. Draft topics (the new lesson-content authoring
// state - see the status-gate regression test elsewhere in this file) are
// correctly hidden from a guest, not readable-by-default the way this test
// used to assume before aptitude_topics gained a real draft/published
// lifecycle.
test("a published aptitude topic (and its questions) is publicly readable; a draft is not; only admin can write", async () => {
  const admin = testEnv.authenticatedContext("admin-uid", { admin: true });
  await assertSucceeds(admin.firestore().doc("aptitude_topics/percentages").set({ name: "Percentages", category: "Quantitative", status: "published", audiences: ["legacy"] }));
  await assertSucceeds(admin.firestore().doc("aptitude_topics/percentages/questions/q1").set({ question: "2+2?" }));

  const guest = testEnv.unauthenticatedContext();
  await assertSucceeds(guest.firestore().doc("aptitude_topics/percentages").get());
  await assertSucceeds(guest.firestore().doc("aptitude_topics/percentages/questions/q1").get());
  await assertFails(guest.firestore().doc("aptitude_topics/percentages").set({ name: "hack" }));

  await assertSucceeds(admin.firestore().doc("aptitude_topics/draft-topic").set({ name: "Unpublished", category: "Quantitative", status: "draft" }));
  await assertFails(guest.firestore().doc("aptitude_topics/draft-topic").get());
  await assertSucceeds(admin.firestore().doc("aptitude_topics/draft-topic").get());
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

// Today's date in IST, matching istTodayStr() in firestore.rules. Daily Learning
// logs may only claim XP/coins on the day they are FOR, so any test asserting a
// REWARDED log write has to use the current date - a hardcoded one silently
// becomes a past date the day after it is written, and the test starts failing
// for a reason that has nothing to do with what it is checking.
const IST_TODAY = new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);
const PAST = new Date(Date.now() - 60 * 60 * 1000);    // -1h, mirrors a contest that has ended

async function seedContest(ctx, contestId, overrides = {}) {
  await ctx.firestore().doc(`contests/${contestId}`).set({
    status: "published", audiences: ["legacy"],
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

// attemptDrafts/{uid} - the draft-only autosave contest attempts write to so
// a mid-attempt refresh doesn't discard unsubmitted answers (see
// lib/contests.js's saveContestDraft/fetchContestDraft). Genuinely separate
// from submissions/{uid} - this test only needs to confirm it is owner-only
// both ways, since the create-vs-update distinction the real submission path
// depends on is exercised by the surrounding submission tests instead.
test("a user can create/update only their own contest attemptDraft, never read or write a peer's", async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => { await seedContest(ctx, "c-draft"); });
  const user = testEnv.authenticatedContext("user-uid");
  await assertSucceeds(user.firestore().doc("contests/c-draft/attemptDrafts/user-uid").set({
    answers: { q1: "a" }, qIndex: 0,
  }));
  // The cheap update path (no isApprovedForContest re-check, see its own
  // comment in firestore.rules) is still owner-only.
  await assertSucceeds(user.firestore().doc("contests/c-draft/attemptDrafts/user-uid").update({
    answers: { q1: "a", q2: "b" }, qIndex: 1,
  }));
  await assertFails(user.firestore().doc("contests/c-draft/attemptDrafts/other-uid").set({
    answers: { q1: "a" }, qIndex: 0,
  }));
  const peer = testEnv.authenticatedContext("peer-uid");
  await assertFails(peer.firestore().doc("contests/c-draft/attemptDrafts/user-uid").get());
  await assertFails(peer.firestore().doc("contests/c-draft/attemptDrafts/user-uid").update({ qIndex: 5 }));
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
  await ctx.firestore().doc(`problems/${problemId}`).set({ status: "published", audiences: ["legacy"], ...overrides });
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
  await assertSucceeds(admin.firestore().doc("problems/p1").set({ status: "published", audiences: ["legacy"], title: "Two Sum" }));
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

// Regression test for the isAdminOfStudent security fix, now defended at TWO
// layers: an institution admin must NOT be able to read a stranger's global
// progress docs (for the Student Analytics Dashboard) just because that
// stranger's own users/{uid} doc happens to claim the admin's institutionId -
// the field alone is not trustworthy. Only a REAL approved roster entry
// (institutions/{id}/students/{uid}.status == 'approved') should unlock it.
// A SECOND, later hardening (see the users/{uid} update rule's own comment)
// closed this even earlier: an admin can no longer even WRITE institutionId
// onto an arbitrary uid's users/{uid} doc without a pre-existing roster
// entry for that exact uid already existing - so the forged-field write
// itself is now denied too, not just the subsequent read.
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

  // Layer 1 (the newer hardening): with NO roster entry for victim-uid under
  // mrcet at all, the admin can't even write institutionId onto the victim's
  // profile in the first place - the write itself is denied.
  await assertFails(mrcetAdmin.firestore().doc("users/victim-uid").set({ institutionId: "mrcet" }, { merge: true }));
  await assertFails(mrcetAdmin.firestore().doc("user_codelab_progress/victim-uid").get());

  // Once a real approved roster entry exists for that exact uid under this
  // admin's own institution (simulating a genuine prior requestToJoin() +
  // approveStudent()), the write is now reachable, AND read access is
  // correctly granted via isAdminOfStudent - Layer 2 still holds even though
  // Layer 1 no longer lets the exploit's setup happen at all.
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().doc("institutions/mrcet/students/victim-uid").set({ uid: "victim-uid", status: "approved" });
  });
  await assertSucceeds(mrcetAdmin.firestore().doc("users/victim-uid").set({ institutionId: "mrcet" }, { merge: true }));
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

// Regression test for a real production bug: approveStudent() (lib/institutions.js)
// writes classroomId onto BOTH institutions/{id}/students/{uid} AND the
// denormalized users/{uid} copy in one batch - the users/{uid} update rule's
// institution-admin branch originally allow-listed only the pre-classroom
// seven fields via affectedKeys().hasOnly([...]), so adding the eighth field
// (classroomId) without also adding it to that allow-list made hasOnly()
// false and silently rejected the ENTIRE batch (both writes), breaking every
// real approval in production ("Missing or insufficient permissions").
// Exercises the exact multi-doc write shape approveStudent() performs.
test("approving a student with a classroom assignment writes classroomId to both the roster doc and the denormalized users/{uid} copy in one batch", async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await seedInstitution(ctx, "mrcet");
    await ctx.firestore().doc("institutions/mrcet/admins/mrcet-admin-uid").set({ uid: "mrcet-admin-uid", role: "faculty" });
    await ctx.firestore().doc("institutions/mrcet/students/student-uid").set({
      uid: "student-uid", name: "A Student", rollNumber: "21A1", status: "pending",
      department: "CSE(AI&ML)", year: "III Year", section: "A",
    });
    await ctx.firestore().doc("users/student-uid").set({ displayName: "A Student" });
  });
  const mrcetAdmin = testEnv.authenticatedContext("mrcet-admin-uid");

  const batch = mrcetAdmin.firestore().batch();
  batch.update(mrcetAdmin.firestore().doc("institutions/mrcet/students/student-uid"), {
    status: "approved", department: "CSE(AI&ML)", year: "III Year", section: "A", classroomId: "iii-year-cse-ai-ml-a",
  });
  batch.update(mrcetAdmin.firestore().doc("users/student-uid"), {
    institutionId: "mrcet", institutionSlug: "mrcet", department: "CSE(AI&ML)", year: "III Year", section: "A",
    rollNumber: "21A1", campusFullName: "A Student", classroomId: "iii-year-cse-ai-ml-a",
  });
  await assertSucceeds(batch.commit());
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
    // The users/{uid} update rule's institution-admin branch now ALSO requires
    // a real institutions/{id}/students/{uid} roster entry to already exist
    // (closing a since-fixed exploit - see that rule's own comment) - so this
    // admin write is only reachable at all once a genuine prior
    // requestToJoin()/approveStudent() has happened, exactly like production.
    await ctx.firestore().doc("institutions/mrcet/students/student-uid").set({ uid: "student-uid", status: "approved" });
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

// fullAccess switches off sequential unlocking across Learn and DSA Concepts
// (getTaskStatus / isConceptUnlocked). Those are pedagogical gates rather than
// confidentiality ones, so this leaks nothing either way - but WHO may grant it
// is still an authority question, and the answer must not be "the account
// itself". Hence its place in the users-update denylist.
test("a user cannot grant themselves fullAccess - only a platform admin can set it", async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().doc("users/learner-uid").set({ handle: "learner", xp: 0, bio: "hi" });
  });
  const learner = testEnv.authenticatedContext("learner-uid");
  await assertFails(learner.firestore().doc("users/learner-uid").update({ fullAccess: true }));
  // Nor smuggled in beside an edit that WOULD otherwise be allowed.
  await assertFails(learner.firestore().doc("users/learner-uid").update({ bio: "updated", fullAccess: true }));
  // Revoking it is equally not theirs to do - the denylist is on the key, not the value.
  await assertFails(learner.firestore().doc("users/learner-uid").update({ fullAccess: false }));
  // An ordinary profile edit still works, so the guard is scoped to this key.
  await assertSucceeds(learner.firestore().doc("users/learner-uid").update({ bio: "still editable" }));

  const platformAdmin = testEnv.authenticatedContext("root-uid", { admin: true });
  await assertSucceeds(platformAdmin.firestore().doc("users/learner-uid").update({ fullAccess: true }));
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
    await ctx.firestore().doc("contests/inst-contest").set({ title: "MRCET Contest", status: "published", audiences: ["legacy"], institutionId: "mrcet" });
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
    await ctx.firestore().doc("contests/global-contest").set({ title: "Global Arena Contest", status: "published", audiences: ["legacy"] });
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

test("a contest's targetScope narrows an institution-scoped contest to matching students only, AND-ing hierarchy filters together", async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await seedContest(ctx, "scoped-contest", {
      institutionId: "mrcet",
      targetScope: { mode: "scoped", departments: ["CSE"], years: ["III Year"], sections: [], classroomIds: [], uids: [] },
    });
    // Matches both department AND year.
    await ctx.firestore().doc("institutions/mrcet/students/match-uid").set({ uid: "match-uid", status: "approved", department: "CSE", year: "III Year" });
    // Right department, wrong year - hierarchy filters AND together, so this must fail.
    await ctx.firestore().doc("institutions/mrcet/students/wrong-year-uid").set({ uid: "wrong-year-uid", status: "approved", department: "CSE", year: "II Year" });
    // Wrong department entirely.
    await ctx.firestore().doc("institutions/mrcet/students/wrong-dept-uid").set({ uid: "wrong-dept-uid", status: "approved", department: "ECE", year: "III Year" });
  });

  await assertSucceeds(testEnv.authenticatedContext("match-uid").firestore().doc("contests/scoped-contest").get());
  await assertFails(testEnv.authenticatedContext("wrong-year-uid").firestore().doc("contests/scoped-contest").get());
  await assertFails(testEnv.authenticatedContext("wrong-dept-uid").firestore().doc("contests/scoped-contest").get());
});

test("a contest's targetScope.uids grants access to specifically-listed students on top of (not instead of) the hierarchy filters", async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await seedContest(ctx, "scoped-with-uids", {
      institutionId: "mrcet", contestEnd: FUTURE, registrationEnd: FUTURE,
      targetScope: { mode: "scoped", departments: ["CSE"], years: [], sections: [], classroomIds: [], uids: ["allowlisted-uid"] },
    });
    // Outside the department filter, but explicitly allowlisted by uid.
    await ctx.firestore().doc("institutions/mrcet/students/allowlisted-uid").set({ uid: "allowlisted-uid", status: "approved", department: "MECH", year: "I Year" });
    // Outside both the department filter and the allowlist.
    await ctx.firestore().doc("institutions/mrcet/students/neither-uid").set({ uid: "neither-uid", status: "approved", department: "MECH", year: "I Year" });
  });

  await assertSucceeds(testEnv.authenticatedContext("allowlisted-uid").firestore().doc("contests/scoped-with-uids/registrations/allowlisted-uid").set({ registeredAt: new Date() }));
  await assertFails(testEnv.authenticatedContext("neither-uid").firestore().doc("contests/scoped-with-uids/registrations/neither-uid").set({ registeredAt: new Date() }));
});

test("a scoped contest with every targetScope filter left empty fails open (matches every approved student), not closed", async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await seedContest(ctx, "scoped-but-empty", {
      institutionId: "mrcet",
      targetScope: { mode: "scoped", departments: [], years: [], sections: [], classroomIds: [], uids: [] },
    });
    await ctx.firestore().doc("institutions/mrcet/students/any-uid").set({ uid: "any-uid", status: "approved", department: "CIVIL", year: "IV Year" });
  });
  await assertSucceeds(testEnv.authenticatedContext("any-uid").firestore().doc("contests/scoped-but-empty").get());
});

test("a student's bounded +-1 participantCount self-update cannot smuggle a lifecycleState/targetScope change alongside it", async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await seedContest(ctx, "lifecycle-c1", { participantCount: 0, lifecycleState: "registrationOpen" });
  });
  const user = testEnv.authenticatedContext("random-uid");
  // participantCount alone, by exactly +1 - still allowed, unchanged from before.
  await assertSucceeds(user.firestore().doc("contests/lifecycle-c1").update({ participantCount: 1 }));
  // Same bounded +1, but riding along with a lifecycleState/targetScope change - rejected,
  // since the self-service branch requires affectedKeys().hasOnly(['participantCount']).
  await assertFails(user.firestore().doc("contests/lifecycle-c1").update({ participantCount: 1, lifecycleState: "live" }));
  await assertFails(user.firestore().doc("contests/lifecycle-c1").update({
    participantCount: 1, targetScope: { mode: "scoped", departments: [], years: [], sections: [], classroomIds: [], uids: ["random-uid"] },
  }));
});

// --- Company Prep ---

async function seedCompanyQuestion(ctx, companyId, { status = "published" } = {}) {
  // audiences mirrors the Phase 0 backfill - every production content document
  // carries ["legacy"], which every reader carries, so publication behaviour is
  // governed by `status` exactly as before.
  await ctx.firestore().doc(`companies/${companyId}`).set({ name: "Cognizant", status, order: 0, audiences: ["legacy"] });
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
    await seedCompanyQuestion(ctx, "cog-live", { status: "published", audiences: ["legacy"] });
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

// institutions/{id}/settings/{settingId} - backs Manage > Leaderboards
// (fetchLeaderboardSettings/saveLeaderboardSettings, lib/institutions.js).
// Approved students need read (their own Leaderboard tab checks it) but
// never write; only that institution's own admin (or platform admin) may
// configure it. An outsider (no membership at this institution at all) must
// see neither.
test("institution settings (e.g. leaderboard config) are readable by that institution's own approved students and admins, writable only by admins", async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await seedInstitution(ctx, "mrcet");
    await ctx.firestore().doc("institutions/mrcet/admins/mrcet-admin-uid").set({ uid: "mrcet-admin-uid", role: "faculty" });
    await ctx.firestore().doc("institutions/mrcet/students/approved-uid").set({ uid: "approved-uid", status: "approved" });
  });

  const outsider = testEnv.authenticatedContext("outsider-uid");
  await assertFails(outsider.firestore().doc("institutions/mrcet/settings/leaderboard").get());
  await assertFails(outsider.firestore().doc("institutions/mrcet/settings/leaderboard").set({ enabled: false }));

  const approvedStudent = testEnv.authenticatedContext("approved-uid");
  await assertSucceeds(approvedStudent.firestore().doc("institutions/mrcet/settings/leaderboard").get());
  await assertFails(approvedStudent.firestore().doc("institutions/mrcet/settings/leaderboard").set({ enabled: false }));

  const mrcetAdmin = testEnv.authenticatedContext("mrcet-admin-uid");
  await assertSucceeds(mrcetAdmin.firestore().doc("institutions/mrcet/settings/leaderboard").set({
    enabled: true, sectionEnabled: true, departmentEnabled: true, campusEnabled: true, rankingMetric: "credits",
  }, { merge: true }));
});

// --- Central reward ledger (reward_grants) - the reward-integrity overhaul's
// core trust boundary. Regression coverage for both the app-level idempotency
// check it backstops (a second create attempt for an already-existing doc)
// and the field-shape/ownership bounds a client create must satisfy.

test("the owner can write their own reward ledger entry with a bounded, well-formed grant", async () => {
  const owner = testEnv.authenticatedContext("owner-uid");
  await assertSucceeds(owner.firestore().doc("reward_grants/owner-uid_daily_learning_day_mrcet_2026-07-24").set({
    uid: "owner-uid", activityType: "daily_learning_day", activityId: "mrcet_2026-07-24",
    xp: 50, coins: 20, score: 50, sourceModule: "daily_learning", status: "granted",
  }));
});

test("a client cannot create a reward ledger entry for someone else's uid", async () => {
  const attacker = testEnv.authenticatedContext("attacker-uid");
  await assertFails(attacker.firestore().doc("reward_grants/victim-uid_daily_learning_day_mrcet_2026-07-24").set({
    uid: "victim-uid", activityType: "daily_learning_day", activityId: "mrcet_2026-07-24",
    xp: 50, coins: 20, score: 50, sourceModule: "daily_learning", status: "granted",
  }));
});

test("a client cannot write a reward ledger entry with an out-of-bounds xp/coins amount", async () => {
  const owner = testEnv.authenticatedContext("owner-uid");
  await assertFails(owner.firestore().doc("reward_grants/owner-uid_admin_manual_forged").set({
    uid: "owner-uid", activityType: "admin_manual", activityId: "forged",
    xp: 999999, coins: 0, score: 0, sourceModule: "admin_manual", status: "granted",
  }));
});

test("a repeat grant attempt for the same (uid, activityType, activityId) is rejected - the ledger's core duplicate-prevention backstop", async () => {
  const owner = testEnv.authenticatedContext("owner-uid");
  const ledgerDoc = owner.firestore().doc("reward_grants/owner-uid_programming_topic_java_arrays");
  await assertSucceeds(ledgerDoc.set({
    uid: "owner-uid", activityType: "programming_topic", activityId: "java_arrays",
    xp: 20, coins: 8, score: 20, sourceModule: "programming", status: "granted",
  }));
  // Same call again (simulating a caller bug that re-invoked grantRewards for
  // an activity it should have already known was granted) - Firestore treats
  // this second attempt as an `update` to an already-existing doc, and no
  // update path is granted to a non-admin client, so it's denied outright
  // regardless of whether the payload is identical or different.
  await assertFails(ledgerDoc.set({
    uid: "owner-uid", activityType: "programming_topic", activityId: "java_arrays",
    xp: 20, coins: 8, score: 20, sourceModule: "programming", status: "granted",
  }));
});

test("a client can never update or delete their own existing reward ledger entry", async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().doc("reward_grants/owner-uid_cscore_topic_os_deadlocks").set({
      uid: "owner-uid", activityType: "cscore_topic", activityId: "os_deadlocks",
      xp: 20, coins: 8, score: 20, sourceModule: "cscore", status: "granted",
    });
  });
  const owner = testEnv.authenticatedContext("owner-uid");
  await assertFails(owner.firestore().doc("reward_grants/owner-uid_cscore_topic_os_deadlocks").update({ xp: 5000 }));
  await assertFails(owner.firestore().doc("reward_grants/owner-uid_cscore_topic_os_deadlocks").delete());
});

// Regression test for a real production bug: isAlreadyGranted() (lib/rewards.js)
// calls get() specifically to check whether a reward does NOT exist yet -
// the common case, hit on every single fresh activity (Daily Learning
// problem solve, Programming/CS Core/Aptitude topic completion). An earlier
// version of the read rule dereferenced resource.data.uid unconditionally,
// which throws when the doc doesn't exist (resource == null), denying the
// read outright with permission-denied instead of a clean "not found" -
// this made the very first attempt at any reward-eligible activity look
// completely dead in the UI, since the check that should return false
// (not yet granted) errored out instead.
test("a signed-in user can read their OWN reward ledger slot even when it does NOT exist yet - the isAlreadyGranted() check", async () => {
  const owner = testEnv.authenticatedContext("owner-uid");
  await assertSucceeds(owner.firestore().doc("reward_grants/owner-uid_daily_learning_problem_mrcet_2026-07-27_two-sum").get());
});

test("a signed-in user cannot read another uid's non-existent reward ledger slot either", async () => {
  const stranger = testEnv.authenticatedContext("stranger-uid");
  await assertFails(stranger.firestore().doc("reward_grants/owner-uid_daily_learning_problem_mrcet_2026-07-27_two-sum").get());
});

test("reward ledger reads are restricted to the owner, a real institution admin of that student, or platform admin", async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await seedInstitution(ctx, "mrcet");
    await ctx.firestore().doc("institutions/mrcet/admins/mrcet-admin-uid").set({ uid: "mrcet-admin-uid", role: "faculty" });
    await ctx.firestore().doc("institutions/mrcet/students/owner-uid").set({ uid: "owner-uid", status: "approved" });
    await ctx.firestore().doc("users/owner-uid").set({ displayName: "Student", institutionId: "mrcet" });
    await ctx.firestore().doc("reward_grants/owner-uid_daily_learning_day_mrcet_2026-07-24").set({
      uid: "owner-uid", activityType: "daily_learning_day", activityId: "mrcet_2026-07-24",
      xp: 50, coins: 20, score: 50, sourceModule: "daily_learning", status: "granted",
    });
  });

  const owner = testEnv.authenticatedContext("owner-uid");
  await assertSucceeds(owner.firestore().doc("reward_grants/owner-uid_daily_learning_day_mrcet_2026-07-24").get());

  const stranger = testEnv.authenticatedContext("stranger-uid");
  await assertFails(stranger.firestore().doc("reward_grants/owner-uid_daily_learning_day_mrcet_2026-07-24").get());

  const mrcetAdmin = testEnv.authenticatedContext("mrcet-admin-uid");
  await assertSucceeds(mrcetAdmin.firestore().doc("reward_grants/owner-uid_daily_learning_day_mrcet_2026-07-24").get());

  const platformAdmin = testEnv.authenticatedContext("platform-admin-uid", { admin: true });
  await assertSucceeds(platformAdmin.firestore().doc("reward_grants/owner-uid_daily_learning_day_mrcet_2026-07-24").get());
});

test("platform admin can create, update, and delete any reward ledger entry (manual-grant and reversal escape hatch)", async () => {
  const admin = testEnv.authenticatedContext("admin-uid", { admin: true });
  const ledgerDoc = admin.firestore().doc("reward_grants/some-uid_admin_manual_grant1");
  await assertSucceeds(ledgerDoc.set({
    uid: "some-uid", activityType: "admin_manual", activityId: "grant1",
    xp: 100, coins: 0, score: 0, sourceModule: "admin_manual", grantedBy: "admin-uid", status: "granted",
  }));
  await assertSucceeds(ledgerDoc.update({ status: "reversed" }));
  await assertSucceeds(ledgerDoc.delete());
});

// Regression coverage for the Student Analytics Dashboard's Reward Timeline
// (lib/studentAnalytics.js's fetchRewardTimeline) - a uid-filtered LIST
// query, not a single get(), and this codebase has a documented quirk where
// isAdmin()/isAdminOfStudent()-style rules can silently break list() safety
// analysis if not structured carefully (see payout_requests/notifications'
// own comments above) - this must be verified directly, not assumed.
test("a uid-filtered list() query against reward_grants works correctly for the owner, a real institution admin of that student, and is empty (not denied) for a stranger", async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await seedInstitution(ctx, "mrcet");
    await ctx.firestore().doc("institutions/mrcet/admins/mrcet-admin-uid").set({ uid: "mrcet-admin-uid", role: "faculty" });
    await ctx.firestore().doc("institutions/mrcet/students/owner-uid").set({ uid: "owner-uid", status: "approved" });
    await ctx.firestore().doc("users/owner-uid").set({ displayName: "Student", institutionId: "mrcet" });
    await ctx.firestore().doc("reward_grants/owner-uid_daily_learning_day_mrcet_2026-07-24").set({
      uid: "owner-uid", activityType: "daily_learning_day", activityId: "mrcet_2026-07-24",
      xp: 50, coins: 20, score: 50, sourceModule: "daily_learning", status: "granted",
    });
  });

  const timelineQuery = (ctx) => query(collection(ctx.firestore(), "reward_grants"), where("uid", "==", "owner-uid"));

  const owner = testEnv.authenticatedContext("owner-uid");
  const ownerSnap = await assertSucceeds(getDocs(timelineQuery(owner)));
  assert.equal(ownerSnap.size, 1);

  const mrcetAdmin = testEnv.authenticatedContext("mrcet-admin-uid");
  const adminSnap = await assertSucceeds(getDocs(timelineQuery(mrcetAdmin)));
  assert.equal(adminSnap.size, 1);

  // A stranger's query is scoped to a uid they have no claim over - Firestore
  // denies the whole list() here (none of the OR branches can be proven safe
  // for an arbitrary uid), which is the CORRECT, expected outcome (not a bug):
  // the admin dashboard only ever queries its OWN admin's students, so a
  // legitimate caller never hits this path in the first place.
  const stranger = testEnv.authenticatedContext("stranger-uid");
  await assertFails(getDocs(timelineQuery(stranger)));
});

// --- Daily Learning's per-student completion log (dailyLearningLog) - a
// privilege-escalation gap found by audit: the write rule bound isOwner() to
// the PAYLOAD's uid field but never to the doc ID itself (logId), unlike
// every sibling composite-key collection (programming_progress,
// cscore_progress, user_activity_daily). An approved student could target
// ANY other student's log slot by uid substitution in the doc ID while
// spoofing the payload's own uid field to pass isOwner() - pre-setting
// completedAt to silently deny a victim's future real reward, or (once set)
// overwriting mcqAnswers/mcqScore/displayName/rollNumber under the victim's
// slot. Fixed by requiring logId.split('_')[0] == request.auth.uid, plus a
// new bound on xpEarned/coinEarned matching reward_grants' own cap.

test("an approved student can write their own dailyLearningLog slot", async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await seedInstitution(ctx, "mrcet");
    await ctx.firestore().doc("institutions/mrcet/students/owner-uid").set({ uid: "owner-uid", status: "approved" });
  });
  const owner = testEnv.authenticatedContext("owner-uid");
  await assertSucceeds(owner.firestore().doc(`institutions/mrcet/dailyLearningLog/owner-uid_${IST_TODAY}`).set({
    uid: "owner-uid", date: IST_TODAY, weekId: "2026-07-20", dow: "fri", type: "lesson",
    xpEarned: 50, coinEarned: 20, completedAt: new Date(),
  }));
});

test("an approved student cannot write into ANOTHER student's dailyLearningLog slot, even by spoofing the payload's own uid field", async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await seedInstitution(ctx, "mrcet");
    await ctx.firestore().doc("institutions/mrcet/students/attacker-uid").set({ uid: "attacker-uid", status: "approved" });
  });
  const attacker = testEnv.authenticatedContext("attacker-uid");
  // Doc ID targets victim-uid's slot; payload uid is spoofed to the
  // attacker's own uid to try to pass isOwner() - must still fail because
  // logId's uid prefix doesn't match the caller.
  await assertFails(attacker.firestore().doc("institutions/mrcet/dailyLearningLog/victim-uid_2026-07-24").set({
    uid: "attacker-uid", date: "2026-07-24", weekId: "2026-07-20", dow: "fri", type: "lesson",
    xpEarned: 50, coinEarned: 20, completedAt: new Date(),
  }));
});

test("a student cannot forge an out-of-bounds xpEarned/coinEarned on their own dailyLearningLog slot", async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await seedInstitution(ctx, "mrcet");
    await ctx.firestore().doc("institutions/mrcet/students/owner-uid").set({ uid: "owner-uid", status: "approved" });
  });
  const owner = testEnv.authenticatedContext("owner-uid");
  await assertFails(owner.firestore().doc("institutions/mrcet/dailyLearningLog/owner-uid_2026-07-24").set({
    uid: "owner-uid", date: "2026-07-24", weekId: "2026-07-20", dow: "fri", type: "lesson",
    xpEarned: 999999, coinEarned: 20, completedAt: new Date(),
  }));
});

test("a draft-only dailyLearningLog write (no xpEarned/coinEarned/completedAt yet) still succeeds for the owner", async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await seedInstitution(ctx, "mrcet");
    await ctx.firestore().doc("institutions/mrcet/students/owner-uid").set({ uid: "owner-uid", status: "approved" });
  });
  const owner = testEnv.authenticatedContext("owner-uid");
  await assertSucceeds(owner.firestore().doc("institutions/mrcet/dailyLearningLog/owner-uid_2026-07-24").set({
    uid: "owner-uid", date: "2026-07-24", weekId: "2026-07-20", dow: "fri", type: "lesson",
    draftAnswers: { q1: 0 }, updatedAt: new Date(),
  }, { merge: true }));
});

test("an institution admin can still write any student's dailyLearningLog slot (legitimate correction)", async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await seedInstitution(ctx, "mrcet");
    await ctx.firestore().doc("institutions/mrcet/admins/mrcet-admin-uid").set({ uid: "mrcet-admin-uid", role: "faculty" });
    await ctx.firestore().doc("institutions/mrcet/students/owner-uid").set({ uid: "owner-uid", status: "approved" });
  });
  const mrcetAdmin = testEnv.authenticatedContext("mrcet-admin-uid");
  await assertSucceeds(mrcetAdmin.firestore().doc("institutions/mrcet/dailyLearningLog/owner-uid_2026-07-24").set({
    uid: "owner-uid", date: "2026-07-24", weekId: "2026-07-20", dow: "fri", type: "lesson",
    xpEarned: 50, coinEarned: 20, completedAt: new Date(),
  }));
});

// Regression: Department/Classroom Analytics' "Couldn't load analytics" bug -
// an HOD/Faculty caller could read the roster (isHodOfDepartment) but had NO
// read path at all into dailyLearningLog, so fetchClassroomAnalytics' own
// dailyLearningLog reads threw for every HOD/Faculty viewer.
//
// The first fix (isHodOfStudent/isFacultyOfStudent, resolved from the LOG's
// own uid) was correct per-document but did not survive contact with a real
// cohort: rules get ~10 exists()/get() calls PER QUERY REQUEST, cached by
// path and shared across every doc a list() returns, and those helpers spend
// 2 uncached lookups on each returned log (a different uid every time). The
// scale test below pins the exact boundary that produced - it passed at 4
// logs and failed at 5, so the bug reappeared the moment a department (303
// students at MRCET) actually had a day's worth of activity.
//
// Now a constant-cost hasRoleAssignment() check. The pair of tests below is
// the whole argument for why that is not an escalation: institution staff
// gain exactly the breadth an approved STUDENT of the same institution
// already had on this collection, and nothing outside the institution.

async function seedDeptCohort(ctx, n, date) {
  const fs = ctx.firestore();
  await seedInstitution(ctx, "mrcet");
  await fs.doc("institutions/mrcet/roleAssignments/hod-uid").set({
    uid: "hod-uid", institutionId: "mrcet", roleKey: "hod", status: "active",
    scope: { department: "CSE(AI&ML)", classroomId: null },
  });
  for (let i = 0; i < n; i++) {
    const uid = `dept-s${i}`;
    await fs.doc(`users/${uid}`).set({ institutionId: "mrcet", department: "CSE(AI&ML)" });
    await fs.doc(`institutions/mrcet/students/${uid}`).set({
      uid, status: "approved", department: "CSE(AI&ML)", year: "2nd Year", section: "A", classroomId: "c1",
    });
    await fs.doc(`institutions/mrcet/dailyLearningLog/${uid}_${date}`).set({
      uid, date, weekId: "2026-07-20", dow: "fri", type: "lesson",
      xpEarned: 50, coinEarned: 20, completedAt: new Date(),
    });
  }
}

// The actual reported failure: a department-sized chunk, every doc matching.
// Pre-fix this was denied outright ("evaluation error ... for 'list'") for
// any n >= 5, which is every real department.
test("an HOD can list a full 30-uid chunk of dailyLearningLog for their own department", async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => { await seedDeptCohort(ctx, 30, "2026-07-24"); });
  const hodDb = testEnv.authenticatedContext("hod-uid").firestore();
  const uids = Array.from({ length: 30 }, (_, i) => `dept-s${i}`);
  const snap = await assertSucceeds(getDocs(query(
    collection(hodDb, "institutions/mrcet/dailyLearningLog"),
    where("date", "==", "2026-07-24"), where("uid", "in", uids),
  )));
  assert.equal(snap.size, 30);
});

test("an HOD can read a single dailyLearningLog entry for a student in their own department", async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => { await seedDeptCohort(ctx, 1, "2026-07-24"); });
  const hod = testEnv.authenticatedContext("hod-uid");
  await assertSucceeds(hod.firestore().doc("institutions/mrcet/dailyLearningLog/dept-s0_2026-07-24").get());
});

// The boundary that still holds, and the one that matters: staff of ANOTHER
// institution get nothing. Department scoping inside one institution is
// deliberately not enforced on this collection - an approved student of the
// same institution can already list all of it (that is what powers the day
// leaderboard), so scoping an HOD below their own students would be
// theatre, not confidentiality.
test("dailyLearningLog stays closed to staff of a different institution, and open to that institution's own students", async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await seedDeptCohort(ctx, 1, "2026-07-24");
    await seedInstitution(ctx, "other-college");
    await ctx.firestore().doc("institutions/other-college/roleAssignments/outsider-hod").set({
      uid: "outsider-hod", institutionId: "other-college", roleKey: "hod", status: "active",
      scope: { department: "CSE(AI&ML)", classroomId: null },
    });
    // A plain approved student of MRCET, for the comparison.
    await ctx.firestore().doc("institutions/mrcet/students/peer-uid").set({ uid: "peer-uid", status: "approved", department: "ECE" });
  });
  const outsider = testEnv.authenticatedContext("outsider-hod");
  await assertFails(outsider.firestore().doc("institutions/mrcet/dailyLearningLog/dept-s0_2026-07-24").get());

  const peer = testEnv.authenticatedContext("peer-uid");
  await assertSucceeds(peer.firestore().doc("institutions/mrcet/dailyLearningLog/dept-s0_2026-07-24").get());
});

// A disabled staff account loses this the moment status flips - hasRoleAssignment
// requires status == 'active', same as every other role-gated rule.
test("a disabled HOD cannot read their own department's dailyLearningLog", async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await seedDeptCohort(ctx, 1, "2026-07-24");
    await ctx.firestore().doc("institutions/mrcet/roleAssignments/hod-uid").set({
      uid: "hod-uid", institutionId: "mrcet", roleKey: "hod", status: "disabled",
      scope: { department: "CSE(AI&ML)", classroomId: null },
    });
  });
  const disabled = testEnv.authenticatedContext("hod-uid");
  await assertFails(disabled.firestore().doc("institutions/mrcet/dailyLearningLog/dept-s0_2026-07-24").get());
});

// The per-student collections the department dashboard ALSO joins keep their
// scoped isHodOfStudent checks - affordable there because each request covers
// exactly one uid, so the 2 lookups are cached once instead of paid per doc.
// Asserted at 25 docs so a future rules change that makes these per-document
// again fails here rather than in production.
test("an HOD's per-student coin_transactions/codelab_submissions queries survive a full history", async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await seedDeptCohort(ctx, 1, "2026-07-24");
    const fs = ctx.firestore();
    for (let i = 0; i < 25; i++) {
      await fs.doc(`coin_transactions/dept-tx${i}`).set({ uid: "dept-s0", amount: 5, type: "daily_learning", createdAt: new Date() });
      await fs.doc(`codelab_submissions/dept-sub${i}`).set({ uid: "dept-s0", verdict: "Accepted", createdAt: new Date() });
    }
  });
  const hodDb = testEnv.authenticatedContext("hod-uid").firestore();
  await assertSucceeds(getDocs(query(collection(hodDb, "coin_transactions"), where("uid", "==", "dept-s0"))));
  await assertSucceeds(getDocs(query(collection(hodDb, "codelab_submissions"), where("uid", "==", "dept-s0"))));
});

// --- Multi-track Daily Learning (institutions/{id}/learningTracks/{trackId}/
// {items,logs}) - every NEW track (Aptitude Series first) besides the
// grandfathered "dsa" track lives here instead of in dailyLearning/
// dailyLearningLog above (see lib/dailyLearning.js's trackPaths). Same read/
// write shape as those two collections, just parameterized by trackId - these
// tests mirror the dailyLearning/dailyLearningLog suites above 1:1, plus one
// proving the whole reason for this design: a DSA item and an Aptitude item
// sharing the exact same calendar date never collide, because they live in
// entirely separate collections.

test("daily learning items in a non-dsa track are invisible to non-members, visible to that college's approved students and admins", async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await seedInstitution(ctx, "mrcet");
    await ctx.firestore().doc("institutions/mrcet/learningTracks/aptitude/items/2026-07-24").set({ title: "Percentages" });
    await ctx.firestore().doc("institutions/mrcet/students/approved-uid").set({ uid: "approved-uid", status: "approved" });
    await ctx.firestore().doc("institutions/mrcet/students/pending-uid").set({ uid: "pending-uid", status: "pending" });
  });
  const outsider = testEnv.authenticatedContext("outsider-uid");
  await assertFails(outsider.firestore().doc("institutions/mrcet/learningTracks/aptitude/items/2026-07-24").get());

  const pending = testEnv.authenticatedContext("pending-uid");
  await assertFails(pending.firestore().doc("institutions/mrcet/learningTracks/aptitude/items/2026-07-24").get());

  const approved = testEnv.authenticatedContext("approved-uid");
  await assertSucceeds(approved.firestore().doc("institutions/mrcet/learningTracks/aptitude/items/2026-07-24").get());
  await assertFails(approved.firestore().doc("institutions/mrcet/learningTracks/aptitude/items/2026-07-24").set({ title: "hacked" }));

  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().doc("institutions/mrcet/admins/mrcet-admin-uid").set({ uid: "mrcet-admin-uid", role: "faculty" });
  });
  const mrcetAdmin = testEnv.authenticatedContext("mrcet-admin-uid");
  await assertSucceeds(mrcetAdmin.firestore().doc("institutions/mrcet/learningTracks/aptitude/items/2026-07-24").set({ title: "Percentages, revised" }));
});

test("an approved student can write their own learningTracks log slot", async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await seedInstitution(ctx, "mrcet");
    await ctx.firestore().doc("institutions/mrcet/students/owner-uid").set({ uid: "owner-uid", status: "approved" });
  });
  const owner = testEnv.authenticatedContext("owner-uid");
  await assertSucceeds(owner.firestore().doc("institutions/mrcet/learningTracks/aptitude/logs/owner-uid_2026-07-24").set({
    uid: "owner-uid", date: "2026-07-24", weekId: "2026-07-20", dow: "fri", type: "lesson",
    xpEarned: 50, coinEarned: 20, completedAt: new Date(),
  }));
});

test("an approved student cannot write into ANOTHER student's learningTracks log slot, even by spoofing the payload's own uid field", async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await seedInstitution(ctx, "mrcet");
    await ctx.firestore().doc("institutions/mrcet/students/attacker-uid").set({ uid: "attacker-uid", status: "approved" });
  });
  const attacker = testEnv.authenticatedContext("attacker-uid");
  await assertFails(attacker.firestore().doc("institutions/mrcet/learningTracks/aptitude/logs/victim-uid_2026-07-24").set({
    uid: "attacker-uid", date: "2026-07-24", weekId: "2026-07-20", dow: "fri", type: "lesson",
    xpEarned: 50, coinEarned: 20, completedAt: new Date(),
  }));
});

test("a student cannot forge an out-of-bounds xpEarned/coinEarned on their own learningTracks log slot", async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await seedInstitution(ctx, "mrcet");
    await ctx.firestore().doc("institutions/mrcet/students/owner-uid").set({ uid: "owner-uid", status: "approved" });
  });
  const owner = testEnv.authenticatedContext("owner-uid");
  await assertFails(owner.firestore().doc("institutions/mrcet/learningTracks/aptitude/logs/owner-uid_2026-07-24").set({
    uid: "owner-uid", date: "2026-07-24", weekId: "2026-07-20", dow: "fri", type: "lesson",
    xpEarned: 999999, coinEarned: 20, completedAt: new Date(),
  }));
});

test("completedAt is monotonic on a student's own learningTracks log slot - once set, they cannot silently change or clear it to replay a reward", async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await seedInstitution(ctx, "mrcet");
    await ctx.firestore().doc("institutions/mrcet/students/owner-uid").set({ uid: "owner-uid", status: "approved" });
    await ctx.firestore().doc("institutions/mrcet/learningTracks/aptitude/logs/owner-uid_2026-07-24").set({
      uid: "owner-uid", date: "2026-07-24", weekId: "2026-07-20", dow: "fri", type: "lesson",
      xpEarned: 50, coinEarned: 20, completedAt: new Date("2026-07-24T10:00:00Z"),
    });
  });
  const owner = testEnv.authenticatedContext("owner-uid");
  await assertFails(owner.firestore().doc("institutions/mrcet/learningTracks/aptitude/logs/owner-uid_2026-07-24").set({
    uid: "owner-uid", date: "2026-07-24", weekId: "2026-07-20", dow: "fri", type: "lesson",
    xpEarned: 50, coinEarned: 20, completedAt: new Date("2026-07-25T10:00:00Z"),
  }));
});

test("an institution admin can still write any student's learningTracks log slot (legitimate correction)", async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await seedInstitution(ctx, "mrcet");
    await ctx.firestore().doc("institutions/mrcet/admins/mrcet-admin-uid").set({ uid: "mrcet-admin-uid", role: "faculty" });
    await ctx.firestore().doc("institutions/mrcet/students/owner-uid").set({ uid: "owner-uid", status: "approved" });
  });
  const mrcetAdmin = testEnv.authenticatedContext("mrcet-admin-uid");
  await assertSucceeds(mrcetAdmin.firestore().doc("institutions/mrcet/learningTracks/aptitude/logs/owner-uid_2026-07-24").set({
    uid: "owner-uid", date: "2026-07-24", weekId: "2026-07-20", dow: "fri", type: "lesson",
    xpEarned: 50, coinEarned: 20, completedAt: new Date(),
  }));
});

test("a DSA dailyLearning item and an Aptitude learningTracks item on the SAME calendar date coexist independently, with no collision", async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await seedInstitution(ctx, "mrcet");
    await ctx.firestore().doc("institutions/mrcet/dailyLearning/2026-07-24").set({ title: "Binary Search Trees" });
    await ctx.firestore().doc("institutions/mrcet/learningTracks/aptitude/items/2026-07-24").set({ title: "Percentages" });
    await ctx.firestore().doc("institutions/mrcet/students/approved-uid").set({ uid: "approved-uid", status: "approved" });
  });
  const approved = testEnv.authenticatedContext("approved-uid");
  const dsaDay = await approved.firestore().doc("institutions/mrcet/dailyLearning/2026-07-24").get();
  const aptitudeDay = await approved.firestore().doc("institutions/mrcet/learningTracks/aptitude/items/2026-07-24").get();
  assert.strictEqual(dsaDay.data().title, "Binary Search Trees");
  assert.strictEqual(aptitudeDay.data().title, "Percentages");

  // Same shape one level down: a student's completion log for the same date,
  // in each track, are two entirely separate documents.
  await approved.firestore().doc(`institutions/mrcet/dailyLearningLog/approved-uid_${IST_TODAY}`).set({
    uid: "approved-uid", date: IST_TODAY, weekId: "2026-07-20", dow: "fri", type: "lesson", xpEarned: 30, coinEarned: 10,
  });
  await approved.firestore().doc(`institutions/mrcet/learningTracks/aptitude/logs/approved-uid_${IST_TODAY}`).set({
    uid: "approved-uid", date: IST_TODAY, weekId: "2026-07-20", dow: "fri", type: "lesson", xpEarned: 40, coinEarned: 15,
  });
  const dsaLog = await approved.firestore().doc(`institutions/mrcet/dailyLearningLog/approved-uid_${IST_TODAY}`).get();
  const aptitudeLog = await approved.firestore().doc(`institutions/mrcet/learningTracks/aptitude/logs/approved-uid_${IST_TODAY}`).get();
  assert.strictEqual(dsaLog.data().xpEarned, 30);
  assert.strictEqual(aptitudeLog.data().xpEarned, 40);
});

// --- Per-student DSA study-card metadata (problem_notes) - favorite/
// bookmark/review-later/needs-revision/confidence/personal rating/notes/
// tags/revision schedule. Purely personal organization (no reward/coin/XP
// field involved), but ownership must still be airtight since it's writable
// straight from the client with no backend in the path.

test("a student can create and update their own problem_notes doc", async () => {
  const owner = testEnv.authenticatedContext("owner-uid");
  const ref = owner.firestore().doc("problem_notes/owner-uid_problem123");
  await assertSucceeds(ref.set({
    uid: "owner-uid", problemId: "problem123", favorite: true, tags: ["Interview"], notes: "sliding window trick",
  }));
  await assertSucceeds(ref.set({ needsRevision: true }, { merge: true }));
});

test("a client cannot create a problem_notes doc for someone else's uid, even by matching the doc-ID prefix to the attacker's own uid", async () => {
  const attacker = testEnv.authenticatedContext("attacker-uid");
  await assertFails(attacker.firestore().doc("problem_notes/victim-uid_problem123").set({
    uid: "victim-uid", problemId: "problem123", favorite: true,
  }));
  // Spoofing the payload's own uid field while keeping the attacker's real
  // doc-ID prefix is caught by the docId == uid + '_' + problemId check.
  await assertFails(attacker.firestore().doc("problem_notes/attacker-uid_problem123").set({
    uid: "victim-uid", problemId: "problem123", favorite: true,
  }));
});

test("a client cannot write an out-of-bounds personalRating, an oversized notes string, or too many tags", async () => {
  const owner = testEnv.authenticatedContext("owner-uid");
  await assertFails(owner.firestore().doc("problem_notes/owner-uid_problem123").set({
    uid: "owner-uid", problemId: "problem123", personalRating: 99,
  }));
  await assertFails(owner.firestore().doc("problem_notes/owner-uid_problem123").set({
    uid: "owner-uid", problemId: "problem123", notes: "x".repeat(2001),
  }));
  await assertFails(owner.firestore().doc("problem_notes/owner-uid_problem123").set({
    uid: "owner-uid", problemId: "problem123", tags: Array.from({ length: 21 }, (_, i) => `tag${i}`),
  }));
});

test("only the owner, that student's institution admin, or a platform admin can read a problem_notes doc", async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await seedInstitution(ctx, "mrcet");
    await ctx.firestore().doc("institutions/mrcet/admins/mrcet-admin-uid").set({ uid: "mrcet-admin-uid", role: "faculty" });
    await ctx.firestore().doc("institutions/mrcet/students/owner-uid").set({ uid: "owner-uid", status: "approved" });
    await ctx.firestore().doc("users/owner-uid").set({ displayName: "Student", institutionId: "mrcet" });
    await ctx.firestore().doc("problem_notes/owner-uid_problem123").set({ uid: "owner-uid", problemId: "problem123", favorite: true });
  });

  const owner = testEnv.authenticatedContext("owner-uid");
  await assertSucceeds(owner.firestore().doc("problem_notes/owner-uid_problem123").get());

  const stranger = testEnv.authenticatedContext("stranger-uid");
  await assertFails(stranger.firestore().doc("problem_notes/owner-uid_problem123").get());

  const mrcetAdmin = testEnv.authenticatedContext("mrcet-admin-uid");
  await assertSucceeds(mrcetAdmin.firestore().doc("problem_notes/owner-uid_problem123").get());

  const platformAdmin = testEnv.authenticatedContext("platform-admin-uid", { admin: true });
  await assertSucceeds(platformAdmin.firestore().doc("problem_notes/owner-uid_problem123").get());
});

// Same list()-safety shape as reward_grants above, and the same accepted
// resolution: a uid-filtered list() query succeeds for the owner (and would
// for that student's real institution admin), but Firestore denies the
// WHOLE list() outright for a stranger scoped to a uid they have no claim
// over - none of the OR branches can be statically proven safe for an
// arbitrary uid, so the safety analyzer fails closed rather than silently
// returning an empty page. This is the documented, accepted outcome for this
// rule shape (see reward_grants' own list() test above) - no legitimate
// caller ever queries someone else's problem_notes by uid in the first
// place, so this never bites a real user.
test("a uid-filtered list() query against problem_notes works for the owner, and is denied outright (not silently empty) for a stranger", async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().doc("users/owner-uid").set({ displayName: "Student", institutionId: "" });
    await ctx.firestore().doc("problem_notes/owner-uid_problem123").set({ uid: "owner-uid", problemId: "problem123", favorite: true });
    await ctx.firestore().doc("problem_notes/owner-uid_problem456").set({ uid: "owner-uid", problemId: "problem456", bookmarked: true });
  });

  const owner = testEnv.authenticatedContext("owner-uid");
  const ownQuery = (ctx) => query(collection(ctx.firestore(), "problem_notes"), where("uid", "==", "owner-uid"));
  const ownSnap = await assertSucceeds(getDocs(ownQuery(owner)));
  assert.equal(ownSnap.size, 2);

  const stranger = testEnv.authenticatedContext("stranger-uid");
  await assertFails(getDocs(ownQuery(stranger)));
});

// aptitude_topics gained a real lesson-content layer (concept/keyPoints/mcqs/
// etc, authored progressively as drafts) - read is now status-gated like
// Programming/CS Core, instead of the old unconditional `if true`.
test("aptitude_topics read is gated on published status for non-admins, same as Programming/CS Core", async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().doc("aptitude_topics/percentages").set({ category: "Quantitative", name: "Percentages", status: "draft" });
  });
  const student = testEnv.authenticatedContext("student-uid");
  await assertFails(student.firestore().doc("aptitude_topics/percentages").get());

  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().doc("aptitude_topics/percentages").update({ status: "published", audiences: ["legacy"] });
  });
  await assertSucceeds(student.firestore().doc("aptitude_topics/percentages").get());

  const admin = testEnv.authenticatedContext("admin-uid", { admin: true });
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().doc("aptitude_topics/percentages").update({ status: "draft" });
  });
  await assertSucceeds(admin.firestore().doc("aptitude_topics/percentages").get());
});

// user_aptitude_progress gained a monotonicity guard on completedTopicIds
// now that completeAptitudeTopic (lib/aptitude.js) can grant XP/coins - once
// a topicId is in there it can never be removed, same protection
// programming_progress/cscore_progress already have. Pre-existing
// attempted/topicStats/bookmarks writes (no completedTopicIds involved at
// all) must remain completely unaffected.
test("user_aptitude_progress.completedTopicIds is monotonic (can grow, never shrink), but unrelated fields are unaffected", async () => {
  const owner = testEnv.authenticatedContext("owner-uid");
  const progressDoc = owner.firestore().doc("user_aptitude_progress/owner-uid");

  // Pre-existing practice-attempt writes (no completedTopicIds field at all
  // yet) still work exactly as before.
  await assertSucceeds(progressDoc.set({ attempted: { q1: { history: [], attempts: 1 } }, topicStats: {}, bookmarks: [] }, { merge: true }));

  // First topic completion succeeds.
  await assertSucceeds(progressDoc.set({ completedTopicIds: ["percentages"] }, { merge: true }));
  // Adding a second completed topic (superset) still succeeds.
  await assertSucceeds(progressDoc.set({ completedTopicIds: ["percentages", "profit-loss"] }, { merge: true }));
  // Removing an already-completed topic id is rejected outright.
  await assertFails(progressDoc.set({ completedTopicIds: ["percentages"] }, { merge: true }));
  // A completely different, non-superset array is also rejected.
  await assertFails(progressDoc.set({ completedTopicIds: ["profit-loss"] }, { merge: true }));

  // Unrelated fields (topicStats) can still be freely updated without
  // needing to also touch completedTopicIds at all.
  await assertSucceeds(progressDoc.set({ topicStats: { percentages: { attempted: 5, correct: 4 } } }, { merge: true }));
});

// Company Vault gained two new admin-curated/configured subcollections
// (interviewExperiences, mockInterviews) - same read gate as rounds/
// categories (admin or a published company), write is admin-only for both,
// no student write path exists for either.
test("companies/{id}/interviewExperiences and mockInterviews follow the same published-gate read, admin-only write as rounds/categories", async () => {
  const admin = testEnv.authenticatedContext("admin-uid", { admin: true });
  await assertSucceeds(admin.firestore().doc("companies/knowvation").set({ name: "Knowvation Learnings", status: "draft" }));
  await assertSucceeds(admin.firestore().doc("companies/knowvation/interviewExperiences/exp1").set({ studentName: "A. Student", tips: "Practice REST APIs" }));
  await assertSucceeds(admin.firestore().doc("companies/knowvation/mockInterviews/mock1").set({ name: "Technical Mock", type: "technical", timeLimitMinutes: 30, categoryRefs: [] }));

  const student = testEnv.authenticatedContext("student-uid");
  // Draft company - hidden from a non-admin, same as its rounds/categories.
  await assertFails(student.firestore().doc("companies/knowvation/interviewExperiences/exp1").get());
  await assertFails(student.firestore().doc("companies/knowvation/mockInterviews/mock1").get());
  await assertFails(student.firestore().doc("companies/knowvation/interviewExperiences/exp2").set({ tips: "hack" }));
  await assertFails(student.firestore().doc("companies/knowvation/mockInterviews/mock2").set({ name: "hack" }));

  await assertSucceeds(admin.firestore().doc("companies/knowvation").update({ status: "published", audiences: ["legacy"] }));
  await assertSucceeds(student.firestore().doc("companies/knowvation/interviewExperiences/exp1").get());
  await assertSucceeds(student.firestore().doc("companies/knowvation/mockInterviews/mock1").get());
  await assertFails(student.firestore().doc("companies/knowvation/interviewExperiences/exp1").set({ tips: "hacked" }));
  await assertFails(student.firestore().doc("companies/knowvation/mockInterviews/mock1").set({ name: "hacked" }));
});

// ---------------------------------------------------------------------------
// Principal / HOD / Faculty-Class-Teacher hierarchy (institutions/{id}/
// roleAssignments/{uid}) - the newest and most security-critical addition to
// this file. isInstitutionAdmin()/isPrincipal() give Principal identical
// institution-wide breadth with zero new rules paths; isHodOfDepartment()/
// isFacultyOfClassroom() are the genuinely new scope-matching mechanic.
// ---------------------------------------------------------------------------

test("a Principal has full institution-wide rights, same as an Institution Admin", async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().doc("institutions/mrcet/roleAssignments/principal-uid").set({
      uid: "principal-uid", institutionId: "mrcet", roleKey: "principal",
      scope: { department: null, classroomId: null }, permissionOverrides: {}, status: "active",
    });
  });
  const principal = testEnv.authenticatedContext("principal-uid");
  // Same breadth an Institution Admin already has - dailyLearning authoring,
  // reading any student, updating a classroom's identity fields.
  await assertSucceeds(principal.firestore().doc("institutions/mrcet/dailyLearning/day1").set({ title: "Arrays 101" }));
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().doc("institutions/mrcet/students/any-student").set({ uid: "any-student", status: "approved", department: "CSE" });
  });
  await assertSucceeds(principal.firestore().doc("institutions/mrcet/students/any-student").get());
  await assertSucceeds(principal.firestore().doc("institutions/mrcet/classrooms/iii-year-cse-a").set({ department: "CSE", year: "III Year", section: "A" }));
});

test("an HOD can read/write only their own department's students, denied for another department", async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().doc("institutions/mrcet/roleAssignments/hod-cse-uid").set({
      uid: "hod-cse-uid", institutionId: "mrcet", roleKey: "hod",
      scope: { department: "CSE", classroomId: null }, permissionOverrides: {}, status: "active",
    });
    await ctx.firestore().doc("institutions/mrcet/students/cse-student").set({ uid: "cse-student", status: "approved", department: "CSE" });
    await ctx.firestore().doc("institutions/mrcet/students/ece-student").set({ uid: "ece-student", status: "approved", department: "ECE" });
  });
  const hod = testEnv.authenticatedContext("hod-cse-uid");
  await assertSucceeds(hod.firestore().doc("institutions/mrcet/students/cse-student").get());
  await assertSucceeds(hod.firestore().doc("institutions/mrcet/students/cse-student").update({ phone: "9999999999" }));
  // Another department entirely - denied both read and write.
  await assertFails(hod.firestore().doc("institutions/mrcet/students/ece-student").get());
  await assertFails(hod.firestore().doc("institutions/mrcet/students/ece-student").update({ phone: "8888888888" }));
  // Cannot use an edit to relocate a student OUT of their own department.
  await assertFails(hod.firestore().doc("institutions/mrcet/students/cse-student").update({ department: "ECE" }));
});

test("a Faculty/Class Teacher can read/write only their own classroom, denied for another classroom", async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().doc("institutions/mrcet/roleAssignments/teacher-uid").set({
      uid: "teacher-uid", institutionId: "mrcet", roleKey: "facultyClassTeacher",
      scope: { department: null, classroomId: "iii-year-cse-a" }, permissionOverrides: {}, status: "active",
    });
    await ctx.firestore().doc("institutions/mrcet/students/my-student").set({ uid: "my-student", status: "approved", classroomId: "iii-year-cse-a" });
    await ctx.firestore().doc("institutions/mrcet/students/other-student").set({ uid: "other-student", status: "approved", classroomId: "iii-year-cse-b" });
    await ctx.firestore().doc("institutions/mrcet/classrooms/iii-year-cse-a").set({ department: "CSE", year: "III Year", section: "A" });
  });
  const teacher = testEnv.authenticatedContext("teacher-uid");
  await assertSucceeds(teacher.firestore().doc("institutions/mrcet/students/my-student").get());
  await assertFails(teacher.firestore().doc("institutions/mrcet/students/other-student").get());
  // Faculty may toggle their own classroom's moduleAccess/leaderboardVisibility...
  await assertSucceeds(teacher.firestore().doc("institutions/mrcet/classrooms/iii-year-cse-a").update({ moduleAccess: { dsa: false } }));
  // ...but never identity fields, and never another classroom at all.
  await assertFails(teacher.firestore().doc("institutions/mrcet/classrooms/iii-year-cse-a").update({ section: "Z" }));
  await assertFails(teacher.firestore().doc("institutions/mrcet/classrooms/iii-year-cse-b").update({ moduleAccess: { dsa: false } }));
});

test("a disabled roleAssignment loses all elevated access immediately, even mid-session", async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().doc("institutions/mrcet/roleAssignments/disabled-hod-uid").set({
      uid: "disabled-hod-uid", institutionId: "mrcet", roleKey: "hod",
      scope: { department: "CSE", classroomId: null }, permissionOverrides: {}, status: "disabled",
    });
    await ctx.firestore().doc("institutions/mrcet/students/cse-student2").set({ uid: "cse-student2", status: "approved", department: "CSE" });
  });
  const disabledHod = testEnv.authenticatedContext("disabled-hod-uid");
  await assertFails(disabledHod.firestore().doc("institutions/mrcet/students/cse-student2").get());
  await assertFails(disabledHod.firestore().doc("institutions/mrcet/dailyLearning/scoped-item").set({ scopeDepartment: "CSE" }));
});

test("a permission override can both revoke a role's default grant and grant something the role lacks by default", async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    // hod's default template grants students.edit - override it OFF for this
    // one HOD specifically.
    await ctx.firestore().doc("institutions/mrcet/roleAssignments/restricted-hod-uid").set({
      uid: "restricted-hod-uid", institutionId: "mrcet", roleKey: "hod",
      scope: { department: "CSE", classroomId: null },
      permissionOverrides: { "students.edit": false }, status: "active",
    });
    // facultyClassTeacher's default template has no students.edit at all -
    // grant it via override for this one teacher specifically.
    await ctx.firestore().doc("institutions/mrcet/roleAssignments/empowered-teacher-uid").set({
      uid: "empowered-teacher-uid", institutionId: "mrcet", roleKey: "facultyClassTeacher",
      scope: { department: null, classroomId: "iii-year-cse-a" },
      permissionOverrides: { "students.edit": true }, status: "active",
    });
    await ctx.firestore().doc("institutions/mrcet/students/cse-student3").set({ uid: "cse-student3", status: "approved", department: "CSE", classroomId: "iii-year-cse-a" });
  });
  const restrictedHod = testEnv.authenticatedContext("restricted-hod-uid");
  await assertFails(restrictedHod.firestore().doc("institutions/mrcet/students/cse-student3").update({ phone: "111" }));

  const empoweredTeacher = testEnv.authenticatedContext("empowered-teacher-uid");
  await assertSucceeds(empoweredTeacher.firestore().doc("institutions/mrcet/students/cse-student3").update({ phone: "222" }));
});

test("roleAssignments is never directly client-writable - not by the account itself, an institution admin, or anyone but devert-backend", async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().doc("institutions/mrcet/admins/mrcet-admin-uid").set({ uid: "mrcet-admin-uid", role: "faculty" });
  });
  const selfWrite = testEnv.authenticatedContext("sneaky-uid");
  await assertFails(selfWrite.firestore().doc("institutions/mrcet/roleAssignments/sneaky-uid").set({
    uid: "sneaky-uid", institutionId: "mrcet", roleKey: "principal", scope: { department: null, classroomId: null }, status: "active",
  }));
  const institutionAdmin = testEnv.authenticatedContext("mrcet-admin-uid");
  await assertFails(institutionAdmin.firestore().doc("institutions/mrcet/roleAssignments/some-new-hod").set({
    uid: "some-new-hod", institutionId: "mrcet", roleKey: "hod", scope: { department: "CSE", classroomId: null }, status: "active",
  }));
});

// Regression: an HOD's own dashboard showed "HOD: Unassigned" for the very
// person looking at it, and an empty Faculty tab. Two causes, both fixed:
// the client listed roleAssignments UNSCOPED (denied all-or-nothing the
// moment a Principal or other-department doc came back - now
// fetchRoleAssignmentsByDepartment), and AdminAccountService wrote
// scope.department == null on every facultyClassTeacher doc, so
// isHodOfDepartment() could never match one however the query was shaped.
test("an HOD can list their own department's roleAssignments - their own doc and their department's faculty - but not another department's or the Principal's", async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const fs = ctx.firestore();
    await seedInstitution(ctx, "mrcet");
    await fs.doc("institutions/mrcet/roleAssignments/hod-cse-ai-uid").set({
      uid: "hod-cse-ai-uid", institutionId: "mrcet", roleKey: "hod", status: "active",
      displayName: "CSE(AI&ML) HOD", scope: { department: "CSE(AI&ML)", classroomId: null },
    });
    // Faculty in the SAME department - carries scope.department now, which is
    // the whole point of the AdminAccountService change + backfill script.
    await fs.doc("institutions/mrcet/roleAssignments/faculty-in-dept-uid").set({
      uid: "faculty-in-dept-uid", institutionId: "mrcet", roleKey: "facultyClassTeacher", status: "active",
      displayName: "2A Class Teacher", scope: { department: "CSE(AI&ML)", classroomId: "c-2a" },
    });
    await fs.doc("institutions/mrcet/roleAssignments/faculty-other-dept-uid").set({
      uid: "faculty-other-dept-uid", institutionId: "mrcet", roleKey: "facultyClassTeacher", status: "active",
      scope: { department: "ECE", classroomId: "c-ece-2a" },
    });
    await fs.doc("institutions/mrcet/roleAssignments/principal-uid").set({
      uid: "principal-uid", institutionId: "mrcet", roleKey: "principal", status: "active",
      scope: { department: null, classroomId: null },
    });
  });
  const hodDb = testEnv.authenticatedContext("hod-cse-ai-uid").firestore();

  const scoped = await assertSucceeds(getDocs(query(
    collection(hodDb, "institutions/mrcet/roleAssignments"),
    where("scope.department", "==", "CSE(AI&ML)"),
  )));
  assert.deepEqual(scoped.docs.map(d => d.id).sort(), ["faculty-in-dept-uid", "hod-cse-ai-uid"]);

  // The unscoped list the institution-admin path uses stays denied for an
  // HOD - this is what the client used to issue and silently swallow.
  await assertFails(getDocs(collection(hodDb, "institutions/mrcet/roleAssignments")));
  await assertFails(hodDb.doc("institutions/mrcet/roleAssignments/faculty-other-dept-uid").get());
  await assertFails(hodDb.doc("institutions/mrcet/roleAssignments/principal-uid").get());
});

// The department on a Faculty doc must not be mistakable for HOD authority -
// isHodOfDepartment() checks roleKey == 'hod' as its own conjunct.
test("a facultyClassTeacher carrying scope.department gains no HOD powers from it", async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const fs = ctx.firestore();
    await seedInstitution(ctx, "mrcet");
    await fs.doc("institutions/mrcet/roleAssignments/faculty-uid").set({
      uid: "faculty-uid", institutionId: "mrcet", roleKey: "facultyClassTeacher", status: "active",
      scope: { department: "CSE(AI&ML)", classroomId: "c-2a" },
    });
    // A student in the faculty's department but NOT in their classroom.
    await fs.doc("institutions/mrcet/students/other-class-uid").set({
      uid: "other-class-uid", status: "approved", department: "CSE(AI&ML)", classroomId: "c-2b",
    });
    await fs.doc("users/other-class-uid").set({ institutionId: "mrcet" });
  });
  const faculty = testEnv.authenticatedContext("faculty-uid");
  await assertFails(faculty.firestore().doc("institutions/mrcet/students/other-class-uid").get());
});

// Regression: every read behind Manage -> Daily Learning as an HOD. The screen
// reported "0 APPROVED STUDENTS", "No classrooms yet" and "Nothing authored
// for this week" all at once for a 304-student department with a fully
// authored week - because the client issued the UNSCOPED variant of each query
// (denied all-or-nothing for a department-scoped caller) and then collapsed all
// three into one Promise.all().catch(). These tests pin the scoped query shape
// each of those reads now uses, so a future revert to an unscoped one fails
// here instead of silently rendering zeros in production.
async function seedManageScope(ctx) {
  const fs = ctx.firestore();
  await seedInstitution(ctx, "mrcet");
  await fs.doc("institutions/mrcet/roleAssignments/hod-uid").set({
    uid: "hod-uid", institutionId: "mrcet", roleKey: "hod", status: "active",
    scope: { department: "CSE(AI&ML)", classroomId: null }, permissionOverrides: {},
  });
  // Two departments, so an unscoped query has something out-of-scope to trip on.
  for (const [dept, n] of [["CSE(AI&ML)", 3], ["ECE", 2]]) {
    for (let i = 0; i < n; i++) {
      await fs.doc(`institutions/mrcet/students/${dept}-s${i}`).set({
        uid: `${dept}-s${i}`, status: "approved", department: dept, year: "2nd Year", section: "A",
        classroomId: `${dept}-2a`,
      });
      await fs.doc(`users/${dept}-s${i}`).set({ institutionId: "mrcet", department: dept });
    }
    await fs.doc(`institutions/mrcet/classrooms/${dept}-2a`).set({
      department: dept, year: "2nd Year", section: "A", moduleAccess: { dailyLearning: true },
    });
  }
  // An institution-wide Daily Learning item - no scope fields, which is what
  // the admin/Principal catalog actually consists of.
  await fs.doc("institutions/mrcet/dailyLearning/2026-08-03").set({
    date: "2026-08-03", weekId: "2026-08-03", dow: "mon", type: "lesson", title: "Stacks", status: "published",
  });
  await fs.doc("institutions/mrcet/dailyLearning/_module").set({ enabled: true });
}

test("an HOD can count/list only their OWN department's students and classrooms - the unscoped queries stay denied", async () => {
  await testEnv.withSecurityRulesDisabled(seedManageScope);
  const hodDb = testEnv.authenticatedContext("hod-uid").firestore();

  // fetchApprovedStudentCountByDepartment - an aggregate is evaluated over the
  // whole matched set, so the department filter is what makes it authorized.
  const count = await assertSucceeds(getCountFromServer(query(
    collection(hodDb, "institutions/mrcet/students"),
    where("department", "==", "CSE(AI&ML)"), where("status", "==", "approved"))));
  assert.equal(count.data().count, 3);
  await assertFails(getCountFromServer(query(
    collection(hodDb, "institutions/mrcet/students"), where("status", "==", "approved"))));

  // fetchClassroomsByDepartment vs the unscoped fetchClassrooms.
  const rooms = await assertSucceeds(getDocs(query(
    collection(hodDb, "institutions/mrcet/classrooms"), where("department", "==", "CSE(AI&ML)"))));
  assert.deepEqual(rooms.docs.map(d => d.id), ["CSE(AI&ML)-2a"]);
  await assertFails(getDocs(collection(hodDb, "institutions/mrcet/classrooms")));
});

test("an HOD reads the institution-wide Daily Learning catalog but cannot author it or flip the module kill switch", async () => {
  await testEnv.withSecurityRulesDisabled(seedManageScope);
  const hod = testEnv.authenticatedContext("hod-uid");
  const hodDb = hod.firestore();

  // fetchWeekItems - staff read the catalog institution-wide (hasRoleAssignment).
  const items = await assertSucceeds(getDocs(query(
    collection(hodDb, "institutions/mrcet/dailyLearning"), where("weekId", "==", "2026-08-03"))));
  assert.equal(items.size, 1);
  await assertSucceeds(hodDb.doc("institutions/mrcet/dailyLearning/_module").get());

  // ...but authoring stays admin/Principal-only, which is why the UI hides
  // add day / edit / delete / publish for a scoped role rather than offering
  // buttons whose write is refused here.
  await assertFails(hodDb.doc("institutions/mrcet/dailyLearning/2026-08-03").update({ status: "draft" }));
  await assertFails(hodDb.doc("institutions/mrcet/dailyLearning/2026-08-04").set({
    date: "2026-08-04", weekId: "2026-08-03", dow: "tue", type: "lesson", title: "Forged", status: "published",
  }));
  // The kill switch is institution-wide (no scope field) - denied, hence hidden.
  await assertFails(hodDb.doc("institutions/mrcet/dailyLearning/_module").set({ enabled: false }, { merge: true }));
});

test("an HOD may toggle moduleAccess on their own department's classroom only, and nothing else on it", async () => {
  await testEnv.withSecurityRulesDisabled(seedManageScope);
  const hodDb = testEnv.authenticatedContext("hod-uid").firestore();

  // What ModuleAccessSummary's toggle and "Enable/Disable All" actually write.
  await assertSucceeds(hodDb.doc("institutions/mrcet/classrooms/CSE(AI&ML)-2a")
    .update({ "moduleAccess.programming": false }));
  // Another department's classroom - the reason bulkSetModuleAccess must be
  // scoped: a batch is atomic, so including this one would fail the whole commit.
  await assertFails(hodDb.doc("institutions/mrcet/classrooms/ECE-2a")
    .update({ "moduleAccess.programming": false }));
  // Still bounded to moduleAccess/leaderboardVisibility on their own classroom.
  await assertFails(hodDb.doc("institutions/mrcet/classrooms/CSE(AI&ML)-2a")
    .update({ department: "ECE" }));
});

// contentVisibility is why Practice & DSA / Company Vault are deliberately NOT
// in SCOPED_ROLE_MANAGE_TABS - its read rule covers approved students and
// institution admins but no staff role, and the client swallows the denial into
// empty state, so those tabs would quietly claim an empty cohort.
test("an HOD cannot read contentVisibility, so the tabs depending on it stay out of their Manage", async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await seedManageScope(ctx);
    await ctx.firestore().doc("institutions/mrcet/contentVisibility/dsa").set({ hiddenProblemIds: [] });
  });
  const hodDb = testEnv.authenticatedContext("hod-uid").firestore();
  await assertFails(hodDb.doc("institutions/mrcet/contentVisibility/dsa").get());
});

// Staff dry runs (contests/{id}/dryRuns/{uid}) - an admin taking the paper to
// verify it without becoming a participant. The whole point of the separate
// collection is that nothing which reads `submissions` can see these, so the
// boundary that matters is: only that contest's own institution admin touches
// them, and a student can neither read one (it is a full worked attempt,
// answers included) nor mint one for themselves.
test("a contest dry run is readable and writable only by that contest's own institution admin", async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().doc("contests/dryrun-contest").set({
      title: "MRCET Placement Sprint", status: "published", audiences: ["legacy"], institutionId: "mrcet",
    });
    await ctx.firestore().doc("institutions/mrcet/admins/mrcet-admin-uid").set({ uid: "mrcet-admin-uid" });
    await ctx.firestore().doc("institutions/mrcet/students/approved-uid").set({ uid: "approved-uid", status: "approved" });
    await ctx.firestore().doc("institutions/other-college/admins/other-admin-uid").set({ uid: "other-admin-uid" });
  });

  const payload = { isDryRun: true, answers: { q1: "b" }, score: 20, maxScore: 25, timeTakenSeconds: 300 };
  const mrcetAdmin = testEnv.authenticatedContext("mrcet-admin-uid");
  await assertSucceeds(mrcetAdmin.firestore().doc("contests/dryrun-contest/dryRuns/mrcet-admin-uid").set(payload));
  await assertSucceeds(mrcetAdmin.firestore().doc("contests/dryrun-contest/dryRuns/mrcet-admin-uid").get());
  // Scratch data - re-runnable and deletable, unlike a real submission.
  await assertSucceeds(mrcetAdmin.firestore().doc("contests/dryrun-contest/dryRuns/mrcet-admin-uid").set({ ...payload, score: 25 }));
  await assertSucceeds(mrcetAdmin.firestore().doc("contests/dryrun-contest/dryRuns/mrcet-admin-uid").delete());

  // An approved student of this very institution still gets nothing: a dry run
  // holds a complete correct attempt, so reading one is reading the answer key.
  const student = testEnv.authenticatedContext("approved-uid");
  await assertFails(student.firestore().doc("contests/dryrun-contest/dryRuns/mrcet-admin-uid").get());
  await assertFails(student.firestore().doc("contests/dryrun-contest/dryRuns/approved-uid").set(payload));

  // Another college's admin is an outsider here, same as anywhere else.
  const otherAdmin = testEnv.authenticatedContext("other-admin-uid");
  await assertFails(otherAdmin.firestore().doc("contests/dryrun-contest/dryRuns/other-admin-uid").set(payload));
  await assertFails(otherAdmin.firestore().doc("contests/dryrun-contest/dryRuns/mrcet-admin-uid").get());

  const stranger = testEnv.authenticatedContext("random-uid");
  await assertFails(stranger.firestore().doc("contests/dryrun-contest/dryRuns/random-uid").set(payload));
  const anon = testEnv.unauthenticatedContext();
  await assertFails(anon.firestore().doc("contests/dryrun-contest/dryRuns/mrcet-admin-uid").get());
});

// The reason the separate collection exists at all: a dry run must be
// structurally incapable of showing up in the leaderboard query.
test("a dry run does not appear in the submissions collection the leaderboard reads", async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().doc("contests/leak-contest").set({
      title: "Leak check", status: "published", audiences: ["legacy"], institutionId: "mrcet",
      contestEnd: new Date(Date.now() - 60000),
    });
    await ctx.firestore().doc("institutions/mrcet/admins/mrcet-admin-uid").set({ uid: "mrcet-admin-uid" });
    await ctx.firestore().doc("contests/leak-contest/dryRuns/mrcet-admin-uid").set({
      isDryRun: true, graded: true, score: 25, maxScore: 25, timeTakenSeconds: 1,
    });
    await ctx.firestore().doc("contests/leak-contest/submissions/real-student").set({
      graded: true, score: 12, maxScore: 25, timeTakenSeconds: 900,
    });
  });
  const admin = testEnv.authenticatedContext("mrcet-admin-uid");
  const snap = await admin.firestore().collection("contests/leak-contest/submissions")
    .where("graded", "==", true).get();
  assert.deepEqual(snap.docs.map(d => d.id), ["real-student"],
    "a perfect-scoring dry run must not be in the collection the leaderboard queries");
});

// rankingVisibility used to live only in the component, deciding whether a
// Leaderboard button rendered - while the submissions collection stayed
// readable by every in-audience student the moment contestEnd passed. "Hidden"
// hid the widget, not the data. These pin the setting as a real read condition.
test("a peer can read another student's contest submission only when rankings are actually published", async () => {
  const ended = new Date(Date.now() - 60_000);
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    for (const [id, settings] of [
      ["rank-open", { leaderboardEnabled: true, rankingVisibility: "campus_only" }],
      ["rank-hidden", { leaderboardEnabled: true, rankingVisibility: "hidden" }],
      ["rank-off", { leaderboardEnabled: false, rankingVisibility: "campus_only" }],
      ["rank-default", undefined],
    ]) {
      await ctx.firestore().doc(`contests/${id}`).set({
        title: id, status: "published", audiences: ["legacy"], institutionId: "mrcet",
        contestEnd: ended, ...(settings ? { settings } : {}),
      });
      await ctx.firestore().doc(`contests/${id}/submissions/peer-uid`).set({
        graded: true, score: 22, maxScore: 25, timeTakenSeconds: 800,
      });
      await ctx.firestore().doc(`contests/${id}/submissions/me-uid`).set({
        graded: true, score: 11, maxScore: 25, timeTakenSeconds: 1500,
      });
    }
    await ctx.firestore().doc("institutions/mrcet/students/me-uid").set({ uid: "me-uid", status: "approved" });
    await ctx.firestore().doc("institutions/mrcet/students/peer-uid").set({ uid: "peer-uid", status: "approved" });
    await ctx.firestore().doc("institutions/mrcet/admins/mrcet-admin-uid").set({ uid: "mrcet-admin-uid" });
  });

  const me = testEnv.authenticatedContext("me-uid");
  // Published (explicitly, and by default) - peer scores are readable.
  await assertSucceeds(me.firestore().doc("contests/rank-open/submissions/peer-uid").get());
  await assertSucceeds(me.firestore().doc("contests/rank-default/submissions/peer-uid").get());
  // Hidden or disabled - the peer's score is genuinely unreadable now.
  await assertFails(me.firestore().doc("contests/rank-hidden/submissions/peer-uid").get());
  await assertFails(me.firestore().doc("contests/rank-off/submissions/peer-uid").get());

  // Your own submission is always yours, whatever the ranking setting says -
  // hiding a leaderboard must never hide a student's own result from them.
  await assertSucceeds(me.firestore().doc("contests/rank-hidden/submissions/me-uid").get());
  await assertSucceeds(me.firestore().doc("contests/rank-off/submissions/me-uid").get());

  // The institution admin still sees everything - they run the contest.
  const admin = testEnv.authenticatedContext("mrcet-admin-uid");
  await assertSucceeds(admin.firestore().doc("contests/rank-hidden/submissions/peer-uid").get());
});

// Grading used to be locked to isOwner(uid), so a student who submitted and
// never reopened their result stayed graded:false forever - absent from the
// leaderboard and from the average/highest/lowest, which are computed over
// graded submissions only. The institution admin now may grade too, so a sweep
// can close that gap. What must NOT change is what a grading write may say.
test("an institution admin can grade a student's abandoned submission, under the same bounds as the student", async () => {
  const ended = new Date(Date.now() - 60_000);
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().doc("contests/sweep-contest").set({
      title: "Sweep", status: "published", audiences: ["legacy"], institutionId: "mrcet",
      contestEnd: ended, prizeXp: 0, prizeCoins: 0,
    });
    await ctx.firestore().doc("institutions/mrcet/admins/mrcet-admin-uid").set({ uid: "mrcet-admin-uid" });
    await ctx.firestore().doc("institutions/other-college/admins/other-admin-uid").set({ uid: "other-admin-uid" });
    await ctx.firestore().doc("institutions/mrcet/students/ghost-uid").set({ uid: "ghost-uid", status: "approved" });
    await ctx.firestore().doc("institutions/mrcet/students/peer-uid").set({ uid: "peer-uid", status: "approved" });
    for (const uid of ["ghost-uid", "ghost2-uid", "ghost3-uid", "ghost4-uid"]) {
      await ctx.firestore().doc(`contests/sweep-contest/submissions/${uid}`).set({
        graded: false, maxScore: 25, answers: {}, timeTakenSeconds: 900,
      });
    }
  });
  const admin = testEnv.authenticatedContext("mrcet-admin-uid");
  const good = { graded: true, score: 18, accuracy: 72, correctCount: 9 };

  await assertSucceeds(admin.firestore().doc("contests/sweep-contest/submissions/ghost-uid").update(good));

  // The bounds are unchanged - a score above the locked maxScore is still refused.
  await assertFails(admin.firestore().doc("contests/sweep-contest/submissions/ghost2-uid")
    .update({ graded: true, score: 999, accuracy: 100, correctCount: 25 }));
  // ...and so is smuggling a prize in on the same write.
  await assertFails(admin.firestore().doc("contests/sweep-contest/submissions/ghost3-uid")
    .update({ ...good, xpEarned: 500 }));
  // Re-grading an already-graded submission stays impossible, for anyone.
  await assertFails(admin.firestore().doc("contests/sweep-contest/submissions/ghost-uid")
    .update({ graded: true, score: 25, accuracy: 100, correctCount: 25 }));

  // Widening WHO may grade must not have opened it to students at large.
  const peer = testEnv.authenticatedContext("peer-uid");
  await assertFails(peer.firestore().doc("contests/sweep-contest/submissions/ghost4-uid").update(good));
  // Nor to another college's admin.
  const otherAdmin = testEnv.authenticatedContext("other-admin-uid");
  await assertFails(otherAdmin.firestore().doc("contests/sweep-contest/submissions/ghost4-uid").update(good));
});

// The grading rule bounded xpEarned/coinsEarned with DOT ACCESS. Dot-accessing
// a key that is absent from the resulting document throws in rules, which
// denies the whole expression - and those fields are absent from every real
// grading write (the create rule forbids them; persistGrading writes only
// graded/score/accuracy/correctCount, because contests grant no XP or coins).
// So grading was impossible for everyone. This is the exact payload
// persistGrading sends.
test("a student can grade their own submission with the payload persistGrading actually sends", async () => {
  const ended = new Date(Date.now() - 60_000);
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().doc("contests/grade-contest").set({
      title: "Grade", status: "published", audiences: ["legacy"], institutionId: "mrcet",
      contestEnd: ended, prizeXp: 0, prizeCoins: 0,
    });
    await ctx.firestore().doc("institutions/mrcet/students/grader-uid").set({ uid: "grader-uid", status: "approved" });
    for (const uid of ["grader-uid", "capped-uid"]) {
      await ctx.firestore().doc(`contests/grade-contest/submissions/${uid}`).set({
        graded: false, maxScore: 25, answers: {}, timeTakenSeconds: 900,
      });
    }
    await ctx.firestore().doc("institutions/mrcet/students/capped-uid").set({ uid: "capped-uid", status: "approved" });
  });
  const me = testEnv.authenticatedContext("grader-uid");
  // No xpEarned / coinsEarned anywhere - exactly what persistGrading writes.
  await assertSucceeds(me.firestore().doc("contests/grade-contest/submissions/grader-uid").update({
    graded: true, score: 18, accuracy: 72, correctCount: 9,
  }));

  // The prize caps still bite when the fields ARE supplied: this contest awards
  // nothing, so any nonzero xpEarned must still be refused.
  const capped = testEnv.authenticatedContext("capped-uid");
  await assertFails(capped.firestore().doc("contests/grade-contest/submissions/capped-uid").update({
    graded: true, score: 10, accuracy: 40, correctCount: 5, xpEarned: 250,
  }));
});

// Mock Reviewers - people the contest admin lists to test a paper end to end
// before it opens. A reviewer is usually a student who is deliberately OUTSIDE
// the target audience, so the whole feature hinges on granting exactly enough
// to sit the paper and nothing that touches production.
test("a mock reviewer can sit a contest they are not eligible for, without touching production data", async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().doc("contests/rev-contest").set({
      title: "Bi-Weekly #1", status: "published", audiences: ["legacy"], institutionId: "mrcet",
      contestEnd: new Date(Date.now() + 3600_000), registrationEnd: new Date(Date.now() + 1800_000),
      // III Year only - the reviewer below is II Year, i.e. genuinely ineligible.
      targetScope: { mode: "scoped", departments: [], years: ["III Year"], sections: [], classroomIds: [], uids: [] },
    });
    await ctx.firestore().doc("contests/rev-contest/questions/q1").set({ type: "mcq", question: "Q", marks: 1, order: 0 });
    await ctx.firestore().doc("contests/rev-contest/answerKeys/q1").set({ correctOptionIds: ["b"] });
    await ctx.firestore().doc("institutions/mrcet/admins/mrcet-admin-uid").set({ uid: "mrcet-admin-uid" });
    await ctx.firestore().doc("institutions/mrcet/students/reviewer-uid").set({ uid: "reviewer-uid", status: "approved", year: "II Year" });
    await ctx.firestore().doc("institutions/mrcet/students/outsider-uid").set({ uid: "outsider-uid", status: "approved", year: "II Year" });
    await ctx.firestore().doc("contests/rev-contest/reviewers/reviewer-uid").set({ uid: "reviewer-uid", enabled: true });
  });

  const reviewer = testEnv.authenticatedContext("reviewer-uid");
  const outsider = testEnv.authenticatedContext("outsider-uid");

  // Can open the contest and read the paper despite being out of audience.
  await assertSucceeds(reviewer.firestore().doc("contests/rev-contest").get());
  await assertSucceeds(reviewer.firestore().doc("contests/rev-contest/questions/q1").get());
  // An equally-ineligible non-reviewer still cannot - being listed is what grants it.
  await assertFails(outsider.firestore().doc("contests/rev-contest/questions/q1").get());

  // Answer keys are NOT readable up front - review access must not be a way to
  // read the answers early, which matters because a reviewer is often a student.
  await assertFails(reviewer.firestore().doc("contests/rev-contest/answerKeys/q1").get());

  // Can record their own dry run...
  await assertSucceeds(reviewer.firestore().doc("contests/rev-contest/dryRuns/reviewer-uid").set({
    isDryRun: true, answers: { q1: "b" }, score: 1, maxScore: 1, timeTakenSeconds: 60,
  }));
  // ...and only then see the keys, to check the paper is correctly keyed.
  await assertSucceeds(reviewer.firestore().doc("contests/rev-contest/answerKeys/q1").get());

  // ISOLATION. None of this may reach production.
  await assertFails(reviewer.firestore().doc("contests/rev-contest/submissions/reviewer-uid").set({
    graded: false, maxScore: 1, answers: {}, timeTakenSeconds: 60,
  }));
  await assertFails(reviewer.firestore().doc("contests/rev-contest/registrations/reviewer-uid").set({ registeredAt: new Date() }));
  await assertFails(reviewer.firestore().doc("contests/rev-contest").update({ participantCount: 99 }));

  // Cannot fabricate an attempt for anyone else, nor read theirs.
  await assertFails(reviewer.firestore().doc("contests/rev-contest/dryRuns/someone-else").set({ isDryRun: true, score: 25 }));
  await assertFails(reviewer.firestore().doc("contests/rev-contest/dryRuns/mrcet-admin-uid").get());
  // Cannot add themselves, or anyone, to the reviewer roster.
  await assertFails(reviewer.firestore().doc("contests/rev-contest/reviewers/outsider-uid").set({ uid: "outsider-uid", enabled: true }));
  // May read their own roster entry, so the client can show review mode.
  await assertSucceeds(reviewer.firestore().doc("contests/rev-contest/reviewers/reviewer-uid").get());

  // A non-reviewer cannot dry-run at all.
  await assertFails(outsider.firestore().doc("contests/rev-contest/dryRuns/outsider-uid").set({ isDryRun: true, score: 1 }));
});

test("a mock reviewer can read a contest that is still in draft, before it has ever been published", async () => {
  // The whole point of the feature ("let someone sit this paper before it
  // opens") - a reviewer's access must not depend on status=='published' at
  // all, only on being listed. Regression test for a bug where
  // isContestReviewer() was nested inside the published-only branch of the
  // contest read rule, so a reviewer could bypass the audience check but
  // never the draft status - defeating "before it opens" entirely.
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().doc("contests/draft-contest").set({
      title: "Unpublished paper", status: "draft", institutionId: "mrcet",
    });
    await ctx.firestore().doc("contests/draft-contest/questions/q1").set({ type: "mcq", question: "Q", marks: 1, order: 0 });
    await ctx.firestore().doc("institutions/mrcet/students/reviewer-uid").set({ uid: "reviewer-uid", status: "approved" });
    await ctx.firestore().doc("contests/draft-contest/reviewers/reviewer-uid").set({ uid: "reviewer-uid", enabled: true });
  });

  const reviewer = testEnv.authenticatedContext("reviewer-uid");
  await assertSucceeds(reviewer.firestore().doc("contests/draft-contest").get());
  await assertSucceeds(reviewer.firestore().doc("contests/draft-contest/questions/q1").get());

  // A non-reviewer, even an otherwise-approved student, still cannot see a draft at all.
  const outsider = testEnv.authenticatedContext("outsider-uid");
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().doc("institutions/mrcet/students/outsider-uid").set({ uid: "outsider-uid", status: "approved" });
  });
  await assertFails(outsider.firestore().doc("contests/draft-contest").get());
});

test("a disabled reviewer loses access without losing their attempt history", async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().doc("contests/rev-off").set({
      title: "Suspended reviewer", status: "published", audiences: ["legacy"], institutionId: "mrcet",
      contestEnd: new Date(Date.now() + 3600_000),
      targetScope: { mode: "scoped", departments: [], years: ["III Year"], sections: [], classroomIds: [], uids: [] },
    });
    await ctx.firestore().doc("contests/rev-off/questions/q1").set({ type: "mcq", question: "Q", marks: 1, order: 0 });
    await ctx.firestore().doc("institutions/mrcet/students/paused-uid").set({ uid: "paused-uid", status: "approved", year: "II Year" });
    await ctx.firestore().doc("contests/rev-off/reviewers/paused-uid").set({ uid: "paused-uid", enabled: false });
    await ctx.firestore().doc("contests/rev-off/dryRuns/paused-uid").set({ isDryRun: true, score: 12 });
  });
  const paused = testEnv.authenticatedContext("paused-uid");
  await assertFails(paused.firestore().doc("contests/rev-off/questions/q1").get());
  await assertFails(paused.firestore().doc("contests/rev-off/dryRuns/paused-uid").set({ isDryRun: true, score: 20 }));
  // The record of what they already did survives for the admin.
  await assertSucceeds(paused.firestore().doc("contests/rev-off/dryRuns/paused-uid").get());
});

// user_aptitude_progress was the only progress collection granting platform
// isAdmin() alone, with no isAdminOfStudent - so an institution admin opening
// Student Analytics got a permission denial. fetchStudentAnalytics Promise.all's
// every summary, so that one denied read rejected the whole page rather than
// degrading to a missing aptitude section.
test("an institution admin can read a student's aptitude progress, like every other progress collection", async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().doc("institutions/mrcet/admins/apt-admin-uid").set({ uid: "apt-admin-uid" });
    await ctx.firestore().doc("institutions/mrcet/students/apt-student").set({ uid: "apt-student", status: "approved" });
    await ctx.firestore().doc("users/apt-student").set({ institutionId: "mrcet" });
    await ctx.firestore().doc("user_aptitude_progress/apt-student").set({ solved: 12 });
    await ctx.firestore().doc("user_earnings/apt-student").set({ totalCoins: 5 });
    await ctx.firestore().doc("institutions/other/admins/other-apt-admin").set({ uid: "other-apt-admin" });
  });
  const admin = testEnv.authenticatedContext("apt-admin-uid");
  // The read that was failing, alongside a sibling that already worked - both
  // must succeed for the analytics page to render at all.
  await assertSucceeds(admin.firestore().doc("user_aptitude_progress/apt-student").get());
  await assertSucceeds(admin.firestore().doc("user_earnings/apt-student").get());

  // Still not public, and still not another institution's business.
  const stranger = testEnv.authenticatedContext("nobody-uid");
  await assertFails(stranger.firestore().doc("user_aptitude_progress/apt-student").get());
  const otherAdmin = testEnv.authenticatedContext("other-apt-admin");
  await assertFails(otherAdmin.firestore().doc("user_aptitude_progress/apt-student").get());
  // And the widening was read-only.
  await assertFails(admin.firestore().doc("user_aptitude_progress/apt-student").set({ solved: 999 }));
});

// ---------------------------------------------------------------------------
// HOD/Faculty read visibility into institution CONTENT and CONTEST RESULTS.
//
// Three reported symptoms, one cause: an HOD could not read the institution-
// WIDE rows of the collections their dashboard lists. isHodOfDepartment()/
// isFacultyOfClassroom() both require a non-empty department/classroom, so an
// item carrying no scope field matched neither - and because a Firestore list()
// is denied all-or-nothing, the whole query died. It surfaced as an empty
// "Day 1 - 0% Complete" Daily Learning hub and a "Couldn't load contests"
// error rather than as anything that looked like a permission problem.
//
// Staff READ access is now keyed on hasRoleAssignment(institutionId) - any
// active staff member of that institution. These tests pin both halves: the
// grant works, and it stops hard at the institution boundary, at
// status == 'active', and at read-only.
// ---------------------------------------------------------------------------

async function seedHodAndContent(ctx) {
  const fs = ctx.firestore();
  await seedInstitution(ctx, "mrcet");
  await fs.doc("institutions/mrcet/roleAssignments/vis-hod").set({
    uid: "vis-hod", institutionId: "mrcet", roleKey: "hod", status: "active",
    scope: { department: "CSE(AI&ML)", classroomId: null },
  });
  await fs.doc("institutions/mrcet/roleAssignments/vis-faculty").set({
    uid: "vis-faculty", institutionId: "mrcet", roleKey: "facultyClassTeacher", status: "active",
    scope: { department: "CSE(AI&ML)", classroomId: "iv-year-cse-ai-ml-a" },
  });
  // The institution-WIDE catalog item - no scopeDepartment/scopeClassroomId.
  // This is the row that used to poison the entire list() for an HOD.
  await fs.doc("institutions/mrcet/dailyLearning/week3-stacks").set({
    title: "Week 3 - Stacks and Queues", weekId: "2026-07-20", type: "lesson",
  });
  // A department-scoped item, for contrast.
  await fs.doc("institutions/mrcet/dailyLearning/week3-dept").set({
    title: "Dept only", weekId: "2026-07-20", scopeDepartment: "CSE(AI&ML)",
  });
}

async function seedOutsiderHod(ctx) {
  await seedInstitution(ctx, "other-college");
  await ctx.firestore().doc("institutions/other-college/roleAssignments/outsider-hod").set({
    uid: "outsider-hod", institutionId: "other-college", roleKey: "hod", status: "active",
    scope: { department: "CSE(AI&ML)", classroomId: null },
  });
}

test("an HOD reads their institution-WIDE dailyLearning items, not only their own department's", async () => {
  await testEnv.withSecurityRulesDisabled(seedHodAndContent);
  const hod = testEnv.authenticatedContext("vis-hod");
  await assertSucceeds(hod.firestore().doc("institutions/mrcet/dailyLearning/week3-stacks").get());
  await assertSucceeds(hod.firestore().doc("institutions/mrcet/dailyLearning/week3-dept").get());
  // The actual regression: the unfiltered list() the Daily Learning hub issues.
  await assertSucceeds(hod.firestore().collection("institutions/mrcet/dailyLearning").get());

  // A Faculty/Class Teacher gets the same catalog visibility.
  const faculty = testEnv.authenticatedContext("vis-faculty");
  await assertSucceeds(faculty.firestore().collection("institutions/mrcet/dailyLearning").get());
});

test("staff dailyLearning visibility is read-only and institution-bounded", async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await seedHodAndContent(ctx);
    await seedOutsiderHod(ctx);
  });
  // Seeing the catalog must not confer authorship - the create/update branches
  // stay scope-bounded, so an institution-wide item is still untouchable.
  const hod = testEnv.authenticatedContext("vis-hod");
  await assertFails(hod.firestore().doc("institutions/mrcet/dailyLearning/week3-stacks").set({ title: "hijacked" }));
  await assertFails(hod.firestore().doc("institutions/mrcet/dailyLearning/week3-stacks").delete());

  // Another institution's HOD sees none of MRCET's catalog.
  const outsider = testEnv.authenticatedContext("outsider-hod");
  await assertFails(outsider.firestore().doc("institutions/mrcet/dailyLearning/week3-stacks").get());
  await assertFails(outsider.firestore().collection("institutions/mrcet/dailyLearning").get());
});

test("a disabled HOD loses dailyLearning read access immediately", async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await seedHodAndContent(ctx);
    await ctx.firestore().doc("institutions/mrcet/roleAssignments/vis-hod").set({
      uid: "vis-hod", institutionId: "mrcet", roleKey: "hod", status: "disabled",
      scope: { department: "CSE(AI&ML)", classroomId: null },
    });
  });
  const disabled = testEnv.authenticatedContext("vis-hod");
  await assertFails(disabled.firestore().doc("institutions/mrcet/dailyLearning/week3-stacks").get());
});

async function seedContestWithParticipant(ctx) {
  const fs = ctx.firestore();
  await seedHodAndContent(ctx);
  await fs.doc("contests/mrcet-contest").set({
    title: "Mid-sem Mock", institutionId: "mrcet", status: "published",
    contestEnd: new Date("2026-07-01"), rankingsPublished: false,
  });
  await fs.doc("contests/mrcet-contest/registrations/part-uid").set({ uid: "part-uid", registeredAt: new Date() });
  await fs.doc("contests/mrcet-contest/submissions/part-uid").set({
    uid: "part-uid", score: 42, maxScore: 50, correctCount: 21, graded: true,
  });
  await fs.doc("contests/mrcet-contest/submissions/part-uid/codingResults/q1").set({ passed: 3, total: 4 });
}

test("an HOD can load their institution's contests and see participant results/performance", async () => {
  await testEnv.withSecurityRulesDisabled(seedContestWithParticipant);
  const hod = testEnv.authenticatedContext("vis-hod");
  // "Couldn't load contests" was this exact query being denied.
  await assertSucceeds(hod.firestore().collection("contests").where("institutionId", "==", "mrcet").get());
  await assertSucceeds(hod.firestore().doc("contests/mrcet-contest").get());
  // Results and per-participant performance, including the coding detail behind
  // a row. rankingsPublished is false here on purpose: staff are deliberately
  // NOT gated on it (or on contestEnd), exactly like an institution admin.
  await assertSucceeds(hod.firestore().collection("contests/mrcet-contest/registrations").get());
  await assertSucceeds(hod.firestore().collection("contests/mrcet-contest/submissions").get());
  await assertSucceeds(hod.firestore().doc("contests/mrcet-contest/submissions/part-uid").get());
  await assertSucceeds(hod.firestore().doc("contests/mrcet-contest/submissions/part-uid/codingResults/q1").get());
});

test("staff contest visibility is read-only and never crosses to another institution", async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await seedContestWithParticipant(ctx);
    await seedOutsiderHod(ctx);
  });
  // Read-only: no editing the contest, forging a score, or resetting an attempt.
  const hod = testEnv.authenticatedContext("vis-hod");
  await assertFails(hod.firestore().doc("contests/mrcet-contest").update({ title: "renamed" }));
  await assertFails(hod.firestore().doc("contests/mrcet-contest/submissions/part-uid").update({ score: 50 }));
  await assertFails(hod.firestore().doc("contests/mrcet-contest/submissions/part-uid").delete());
  await assertFails(hod.firestore().doc("contests/mrcet-contest/questions/q1").set({ text: "leak" }));

  // Another college's HOD gets nothing.
  const outsider = testEnv.authenticatedContext("outsider-hod");
  await assertFails(outsider.firestore().doc("contests/mrcet-contest").get());
  await assertFails(outsider.firestore().doc("contests/mrcet-contest/submissions/part-uid").get());
  await assertFails(outsider.firestore().collection("contests/mrcet-contest/submissions").get());

  // And the pre-existing student-facing gate is untouched: a random signed-in
  // user still cannot read a peer's attempt while rankings are unpublished.
  const stranger = testEnv.authenticatedContext("nobody-uid");
  await assertFails(stranger.firestore().doc("contests/mrcet-contest/submissions/part-uid").get());
});

// ---------------------------------------------------------------------------
// DSA Concepts (dsaConceptTracks/{langId}/concepts/{conceptId} +
// dsa_concept_progress) - the bridge module between Programming and DSA
// Practice. Same authority shape as programmingLanguages/programming_progress,
// so these tests mirror that collection's guarantees: published content is
// world-readable, drafts never leak, only a platform admin authors, and the
// owner's completed array is monotonic so a concept's XP/coins can't be
// re-earned by removing an id and re-completing it.
// ---------------------------------------------------------------------------

async function seedDsaConcepts(ctx) {
  const fs = ctx.firestore();
  await fs.doc("dsaConceptTracks/java").set({
    label: "Java", status: "published", audiences: ["public", "legacy"], order: 10,
  });
  // `audiences` is REQUIRED on a concept, not decoration: contentReadable()
  // checks it, so a concept authored without one is invisible to every
  // non-admin no matter what its status says.
  await fs.doc("dsaConceptTracks/java/concepts/sliding-window").set({
    title: "Sliding Window", status: "published", audiences: ["public", "legacy"], order: 110,
    problemCategories: ["Sliding Window"], prerequisites: ["arrays"],
    xpReward: 60, coinReward: 12,
  });
  // A draft concept, and a whole draft track - neither may leak.
  await fs.doc("dsaConceptTracks/java/concepts/segment-tree").set({
    title: "Segment Trees", status: "draft", audiences: ["public", "legacy"], order: 900,
  });
  await fs.doc("dsaConceptTracks/rust").set({ label: "Rust", status: "draft", audiences: ["public"], order: 99 });
}

test("published DSA concept content is world-readable; drafts stay admin-only", async () => {
  await testEnv.withSecurityRulesDisabled(seedDsaConcepts);

  // Unauthenticated - published global content is deliberately public here,
  // exactly like programmingLanguages/problems/courses.
  const guest = testEnv.unauthenticatedContext();
  await assertSucceeds(guest.firestore().doc("dsaConceptTracks/java").get());
  await assertSucceeds(guest.firestore().doc("dsaConceptTracks/java/concepts/sliding-window").get());
  await assertFails(guest.firestore().doc("dsaConceptTracks/java/concepts/segment-tree").get());
  await assertFails(guest.firestore().doc("dsaConceptTracks/rust").get());

  // The list() shape lib/dsaConcepts.js actually issues: the status filter is
  // REQUIRED, not cosmetic. Unfiltered must be denied, filtered must succeed -
  // this is the exact trap programming.js's fetchLanguages comment documents.
  // Both filters are needed - status alone is NOT enough, because
  // contentReadable() also checks `audiences`. This asserts the exact query
  // lib/dsaConcepts.js's fetchConcepts issues (a status-only version of it was
  // caught failing here).
  const learner = testEnv.authenticatedContext("dsa-learner");
  await assertFails(learner.firestore().collection("dsaConceptTracks/java/concepts").get());
  await assertFails(learner.firestore()
    .collection("dsaConceptTracks/java/concepts").where("status", "==", "published").get());
  await assertSucceeds(learner.firestore().collection("dsaConceptTracks/java/concepts")
    .where("status", "==", "published").where("audiences", "array-contains-any", ["public", "legacy"]).get());

  // Authoring is platform-admin-only in both directions.
  await assertFails(learner.firestore().doc("dsaConceptTracks/java/concepts/sliding-window").set({ title: "hijacked" }));
  await assertFails(learner.firestore().doc("dsaConceptTracks/java").set({ label: "hijacked" }));
  const admin = testEnv.authenticatedContext("plat-admin", { admin: true });
  await assertSucceeds(admin.firestore().doc("dsaConceptTracks/java/concepts/segment-tree").get());
  await assertSucceeds(admin.firestore().doc("dsaConceptTracks/java/concepts/sliding-window").set({ xpReward: 75 }, { merge: true }));
});

test("DSA concept progress is owner-scoped, and its completed array is monotonic", async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await seedDsaConcepts(ctx);
    await ctx.firestore().doc("dsa_concept_progress/dsa-learner_java").set({
      uid: "dsa-learner", langId: "java", completedConceptIds: ["arrays", "sliding-window"],
    });
  });

  const learner = testEnv.authenticatedContext("dsa-learner");
  await assertSucceeds(learner.firestore().doc("dsa_concept_progress/dsa-learner_java").get());
  // Adding is fine.
  await assertSucceeds(learner.firestore().doc("dsa_concept_progress/dsa-learner_java")
    .set({ completedConceptIds: ["arrays", "sliding-window", "two-pointer"] }, { merge: true }));
  // Dropping a completed id is the reward-replay exploit - refused.
  await assertFails(learner.firestore().doc("dsa_concept_progress/dsa-learner_java")
    .set({ completedConceptIds: ["arrays"] }, { merge: true }));
  // markConceptOpened-style writes that never touch the array still work.
  await assertSucceeds(learner.firestore().doc("dsa_concept_progress/dsa-learner_java")
    .set({ lastOpenedConceptId: "sliding-window" }, { merge: true }));

  // Nobody else's business, in either direction.
  const other = testEnv.authenticatedContext("other-learner");
  await assertFails(other.firestore().doc("dsa_concept_progress/dsa-learner_java").get());
  await assertFails(other.firestore().doc("dsa_concept_progress/dsa-learner_java").set({ completedConceptIds: ["x"] }, { merge: true }));
});

test("a campus admin and the student's own HOD can read their DSA concept progress", async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const fs = ctx.firestore();
    await seedDsaConcepts(ctx);
    await seedInstitution(ctx, "mrcet");
    await fs.doc("users/dsa-student").set({ institutionId: "mrcet", department: "CSE(AI&ML)" });
    await fs.doc("institutions/mrcet/students/dsa-student").set({
      uid: "dsa-student", status: "approved", department: "CSE(AI&ML)", classroomId: "c1",
    });
    await fs.doc("institutions/mrcet/admins/inst-admin").set({ uid: "inst-admin" });
    await fs.doc("institutions/mrcet/roleAssignments/dsa-hod").set({
      uid: "dsa-hod", institutionId: "mrcet", roleKey: "hod", status: "active",
      scope: { department: "CSE(AI&ML)", classroomId: null },
    });
    await fs.doc("dsa_concept_progress/dsa-student_java").set({
      uid: "dsa-student", langId: "java", completedConceptIds: ["arrays"],
    });
  });

  // Student Analytics joins every progress collection with Promise.all, so a
  // denial here fails the WHOLE page rather than hiding one section.
  const instAdmin = testEnv.authenticatedContext("inst-admin");
  await assertSucceeds(instAdmin.firestore().doc("dsa_concept_progress/dsa-student_java").get());
  const hod = testEnv.authenticatedContext("dsa-hod");
  await assertSucceeds(hod.firestore().doc("dsa_concept_progress/dsa-student_java").get());

  // Read-only for staff - progress is still the learner's own record.
  await assertFails(instAdmin.firestore().doc("dsa_concept_progress/dsa-student_java")
    .set({ completedConceptIds: ["arrays", "forged"] }, { merge: true }));
  // And another institution's staff get nothing.
  const outsider = testEnv.authenticatedContext("nobody-uid");
  await assertFails(outsider.firestore().doc("dsa_concept_progress/dsa-student_java").get());
});

// ---------------------------------------------------------------------------
// DSA Sheets (dsaSheets/{sheetId}/sections/{sectionId}) - curated orderings
// over the EXISTING problems collection.
//
// The property most worth pinning is a negative one: a sheet stores only
// problemIds, so being able to read a sheet must NOT become a way to read a
// problem (or its hidden tests) that the problems rules wouldn't already allow.
// A sheet is an index, not a capability.
// ---------------------------------------------------------------------------

async function seedDsaSheet(ctx) {
  const fs = ctx.firestore();
  await fs.doc("dsaSheets/devert-dsa").set({
    title: "DeVert DSA Sheet", status: "published", audiences: ["public", "legacy"], order: 10,
    sectionCount: 2, problemCount: 3,
  });
  await fs.doc("dsaSheets/devert-dsa/sections/arrays").set({
    title: "Arrays", order: 10, status: "published", audiences: ["public", "legacy"],
    conceptIds: ["arrays"],
    subsections: [{ id: "easy", title: "Easy", problemIds: ["p-easy-1", "p-easy-2"] }],
  });
  await fs.doc("dsaSheets/devert-dsa/sections/segment-tree").set({
    title: "Segment Trees", order: 900, status: "draft", audiences: ["public", "legacy"], subsections: [],
  });
  // A real published problem plus its hidden tests, to prove the sheet grants
  // nothing extra over either.
  await fs.doc("problems/p-easy-1").set({ title: "Two Sum", status: "published", audiences: ["public", "legacy"], category: "Arrays", difficulty: "Easy" });
  await fs.doc("problems/p-easy-1/hiddenTests/t1").set({ input: "1 2", expected: "3" });
}

test("a published DSA sheet and its sections are readable; drafts and authoring are not", async () => {
  await testEnv.withSecurityRulesDisabled(seedDsaSheet);

  const guest = testEnv.unauthenticatedContext();
  await assertSucceeds(guest.firestore().doc("dsaSheets/devert-dsa").get());
  await assertSucceeds(guest.firestore().doc("dsaSheets/devert-dsa/sections/arrays").get());
  await assertFails(guest.firestore().doc("dsaSheets/devert-dsa/sections/segment-tree").get());

  // The exact query lib/dsaSheets.js issues - both filters required, because
  // contentReadable() checks status AND audiences.
  const learner = testEnv.authenticatedContext("sheet-learner");
  await assertFails(learner.firestore().collection("dsaSheets/devert-dsa/sections").get());
  await assertFails(learner.firestore().collection("dsaSheets/devert-dsa/sections").where("status", "==", "published").get());
  await assertSucceeds(learner.firestore().collection("dsaSheets/devert-dsa/sections")
    .where("status", "==", "published").where("audiences", "array-contains-any", ["public", "legacy"]).get());

  // Authoring is platform-admin-only.
  await assertFails(learner.firestore().doc("dsaSheets/devert-dsa").set({ title: "hijacked" }, { merge: true }));
  await assertFails(learner.firestore().doc("dsaSheets/devert-dsa/sections/arrays")
    .set({ subsections: [{ id: "easy", title: "Easy", problemIds: ["anything"] }] }, { merge: true }));
  const admin = testEnv.authenticatedContext("plat-admin", { admin: true });
  await assertSucceeds(admin.firestore().doc("dsaSheets/devert-dsa/sections/segment-tree").get());
  await assertSucceeds(admin.firestore().doc("dsaSheets/devert-dsa/sections/arrays").set({ order: 20 }, { merge: true }));
});

test("reading a DSA sheet grants no extra access to the problems it references", async () => {
  await testEnv.withSecurityRulesDisabled(seedDsaSheet);
  const learner = testEnv.authenticatedContext("sheet-learner");

  // The sheet lists p-easy-1. Reading the published problem was ALREADY allowed
  // and still is - the sheet neither adds nor removes that.
  await assertSucceeds(learner.firestore().doc("problems/p-easy-1").get());
  // Hidden tests stay unreachable: only devert-backend's grading path (admin
  // SDK, bypassing rules) ever sees these. A sheet referencing the problem must
  // not become a side door.
  await assertFails(learner.firestore().doc("problems/p-easy-1/hiddenTests/t1").get());
  await assertFails(learner.firestore().collection("problems/p-easy-1/hiddenTests").get());
  // And a referenced id that doesn't exist is simply unreadable, not an error
  // path that leaks anything - lib/dsaSheets.js drops such rows client-side.
  await assertFails(learner.firestore().doc("problems/p-missing").get());
});

// --- Careers (job_openings / job_applications) -----------------------------
// Two collections with opposite trust models, so both directions are worth
// pinning down: a posting anyone may READ but only an admin may write, and an
// application anyone may WRITE but only an admin may read.

async function seedJobOpenings(ctx) {
  const fs = ctx.firestore();
  await fs.doc("job_openings/frontend-engineer").set({
    slug: "frontend-engineer", title: "Frontend Engineer", status: "published",
    team: "Engineering", employmentType: "full-time", locationType: "hybrid", order: 100,
  });
  await fs.doc("job_openings/secret-role").set({
    slug: "secret-role", title: "Unannounced Role", status: "draft", order: 900,
  });
}

// The minimum valid application, as components/careers/apply-form.jsx sends it.
function validApplication(extra = {}) {
  return {
    jobId: "frontend-engineer",
    jobTitle: "Frontend Engineer",
    name: "Ada Lovelace",
    email: "ada@example.com",
    status: "new",
    createdAt: serverTimestamp(),
    ...extra,
  };
}

test("a job opening is world-readable, and only an admin can write one", async () => {
  await testEnv.withSecurityRulesDisabled(seedJobOpenings);

  // Public read is the point: a posting nobody can read without an account is
  // not a posting, and the static export reads these anonymously at build time
  // to emit JobPosting structured data.
  const guest = testEnv.unauthenticatedContext();
  await assertSucceeds(getDoc(doc(guest.firestore(), "job_openings/frontend-engineer")));

  // A draft is UNLISTED, not secret - /careers filters on status, but the doc
  // itself is readable by anyone who guesses the slug. This test exists to make
  // that explicit rather than to be fixed: see the rule's own comment before
  // putting anything confidential in an unpublished posting.
  await assertSucceeds(getDoc(doc(guest.firestore(), "job_openings/secret-role")));

  // Authoring is platform-admin-only. A signed-in stranger must not be able to
  // post a job as DeVert, edit the pay-free perks list, or publish their own.
  const stranger = testEnv.authenticatedContext("job-seeker");
  await assertFails(setDoc(doc(stranger.firestore(), "job_openings/frontend-engineer"), { title: "hijacked" }, { merge: true }));
  await assertFails(setDoc(doc(stranger.firestore(), "job_openings/fake-role"), { title: "Pay me", status: "published" }));

  const admin = testEnv.authenticatedContext("plat-admin", { admin: true });
  await assertSucceeds(setDoc(doc(admin.firestore(), "job_openings/frontend-engineer"), { order: 50 }, { merge: true }));
  await assertSucceeds(setDoc(doc(admin.firestore(), "job_openings/secret-role"), { status: "published" }, { merge: true }));
});

test("anyone can apply for a job without an account, but cannot forge the decision", async () => {
  const guest = testEnv.unauthenticatedContext();
  const apps = () => collection(guest.firestore(), "job_applications");

  // The whole point of the unauthenticated create: no account needed to apply.
  await assertSucceeds(addDoc(apps(), validApplication()));
  await assertSucceeds(addDoc(apps(), validApplication({
    phone: "+91 90000 00000",
    resumeUrl: "https://example.com/ada.pdf",
    githubUrl: "https://github.com/ada",
    linkedinUrl: "https://linkedin.com/in/ada",
    portfolioUrl: "https://ada.dev",
    devertHandle: "ada",
    coverNote: "I built a difference engine.",
    source: "careers/frontend-engineer",
  })));

  // status is pinned to "new" on create - an applicant must never be able to
  // write themselves into a decision.
  await assertFails(addDoc(apps(), validApplication({ status: "hired" })));
  await assertFails(addDoc(apps(), validApplication({ status: "interviewing" })));

  // createdAt must be the server's clock, not the client's.
  await assertFails(addDoc(apps(), validApplication({ createdAt: new Date("2020-01-01") })));

  // Field whitelist: anything not named in the rule is rejected outright, so a
  // future reviewer field cannot be smuggled in before it exists.
  await assertFails(addDoc(apps(), validApplication({ rating: 10 })));
  await assertFails(addDoc(apps(), validApplication({ internalNote: "hire me" })));

  // Length caps - these are unauthenticated writes, so an uncapped text field is
  // free storage for anyone who finds the form.
  await assertFails(addDoc(apps(), validApplication({ coverNote: "x".repeat(2001) })));
  await assertFails(addDoc(apps(), validApplication({ resumeUrl: `https://e.com/${"x".repeat(500)}` })));
  await assertFails(addDoc(apps(), validApplication({ name: "x".repeat(81) })));

  // Required fields and a plausible email.
  await assertFails(addDoc(apps(), validApplication({ email: "not-an-email" })));
  await assertFails(addDoc(apps(), validApplication({ name: "A" })));
  await assertFails(addDoc(apps(), { jobId: "frontend-engineer", status: "new", createdAt: serverTimestamp() }));
});

test("an application's uid cannot be attributed to somebody else", async () => {
  // Signed in, claiming your own uid: fine, and it is how the admin inbox shows
  // the MEMBER badge.
  const applicant = testEnv.authenticatedContext("applicant-uid");
  await assertSucceeds(addDoc(
    collection(applicant.firestore(), "job_applications"),
    validApplication({ uid: "applicant-uid" }),
  ));

  // Signed in, claiming someone else's: denied.
  await assertFails(addDoc(
    collection(applicant.firestore(), "job_applications"),
    validApplication({ uid: "someone-else-uid" }),
  ));

  // Logged out, claiming any uid at all: denied. request.auth is null here, so
  // this also proves the isAuth() guard runs before request.auth.uid is touched.
  const guest = testEnv.unauthenticatedContext();
  await assertFails(addDoc(
    collection(guest.firestore(), "job_applications"),
    validApplication({ uid: "applicant-uid" }),
  ));
});

test("nobody but an admin can read or change a submitted application", async () => {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().doc("job_applications/app1").set({
      jobId: "frontend-engineer", name: "Ada Lovelace", email: "ada@example.com",
      phone: "+91 90000 00000", coverNote: "private", status: "new", uid: "applicant-uid",
      createdAt: new Date(),
    });
  });

  // These carry phone numbers, resumes and cover notes. A logged-out visitor,
  // any signed-in user, and even the applicant themselves are all denied - the
  // applicant has no read path back to their own row by design, so enumerating
  // the collection reveals nothing about who else applied.
  const guest = testEnv.unauthenticatedContext();
  await assertFails(getDoc(doc(guest.firestore(), "job_applications/app1")));
  await assertFails(getDocs(collection(guest.firestore(), "job_applications")));

  const stranger = testEnv.authenticatedContext("nosy-uid");
  await assertFails(getDoc(doc(stranger.firestore(), "job_applications/app1")));
  await assertFails(getDocs(collection(stranger.firestore(), "job_applications")));

  const applicant = testEnv.authenticatedContext("applicant-uid");
  await assertFails(getDoc(doc(applicant.firestore(), "job_applications/app1")));
  // ...and cannot advance their own application either.
  await assertFails(setDoc(doc(applicant.firestore(), "job_applications/app1"), { status: "hired" }, { merge: true }));

  const admin = testEnv.authenticatedContext("plat-admin", { admin: true });
  await assertSucceeds(getDoc(doc(admin.firestore(), "job_applications/app1")));
  await assertSucceeds(getDocs(collection(admin.firestore(), "job_applications")));
  await assertSucceeds(setDoc(doc(admin.firestore(), "job_applications/app1"), { status: "screening" }, { merge: true }));
});
