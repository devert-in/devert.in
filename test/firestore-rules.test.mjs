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
