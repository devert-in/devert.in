import { db } from "@/lib/firebase";
import { doc, updateDoc, setDoc, increment, serverTimestamp } from "firebase/firestore";
import { logCoinTransaction } from "@/lib/economy";

// Single, shared reward-granting entry point for every self-reported
// learning-completion path (Daily Learning, Programming, CS Core, Contests,
// ...) - so the three metrics stay architecturally separate instead of each
// call site hand-rolling its own xp/coins update and forgetting Score:
//   - score: permanent academic performance. NEVER decreases (enforced in
//     firestore.rules' selfScoreWriteSane), never spent/converted, not shown
//     as if interchangeable with XP. Used for every leaderboard/ranking
//     internally - the UI shows XP/Coins, not a raw "Score" column, but the
//     sort key underneath stays this never-decreasing field on purpose (see
//     this file's own header comment history / the reward-integrity plan).
//   - xp:    spendable reward points - convertible to coins on the Wallet
//     page (see app/wallet/page.jsx), can decrease after conversion. Never
//     used for rankings.
//   - coins: wallet balance - lives on user_earnings/{uid}, not users/{uid}.
//
// scoreReward currently defaults to equal xpReward at every call site (no
// per-activity admin-configurable "Score Reward" field exists yet - that's
// real follow-up editor UI work, not built in this pass) - every completed
// milestone permanently banks the same number of Score points it grants in
// spendable XP, on top of the XP remaining available to convert to coins
// later.
//
// reward_grants/{uid}_{activityType}_{activityId} is the central, immutable
// reward ledger - the single source of truth an admin's Reward Timeline
// reads from, and the cross-module idempotency backstop (firestore.rules
// makes this collection create-only per doc: a SECOND attempt to write the
// same (uid, activityType, activityId) is rejected as an `update` against an
// already-existing doc, since only `create` is allowed - defense in depth
// beyond whatever check the caller already did). This function itself never
// READS the ledger - Firestore transactions require every read to happen
// before any write, and by the time most callers reach this function they've
// already issued their own completion-flag write earlier in the same
// transaction (see dailyLearning.js's submitDayCompletion). The caller is
// responsible for deciding IF a reward should be granted (via its own
// existing flag, or via isAlreadyGranted() below called as one of its FIRST
// reads if it has no flag of its own); this function only ever writes.
//
// `tx`: an active Firestore Transaction (from runTransaction), optional. When
// provided, every write goes through tx.update/tx.set instead of the
// standalone updateDoc/setDoc calls, so the reward lands in the SAME atomic
// commit as whatever completion-flag write the caller already made inside
// that transaction - critical, since granting the reward as a separate call
// AFTER a transaction has already committed its idempotency flag means a
// dropped connection in between permanently strands the reward (no retry is
// possible once the flag already says "already rewarded"). Every current
// call site (dailyLearning.js, programming.js, csCore.js) passes its own tx;
// omit it only for a caller with no transaction of its own to join.
export function rewardLedgerId(uid, activityType, activityId) {
  return `${uid}_${activityType}_${activityId}`;
}

export function rewardLedgerRef(uid, activityType, activityId) {
  return doc(db, "reward_grants", rewardLedgerId(uid, activityType, activityId));
}

// Callers with no idempotency flag of their own (generic Learning module,
// Contest grading, Aptitude, admin manual grant) should call this as one of
// their FIRST reads inside runTransaction, before any writes, then only
// proceed to write + call grantRewards(...) if this returns false.
export async function isAlreadyGranted(tx, uid, activityType, activityId) {
  const ref = rewardLedgerRef(uid, activityType, activityId);
  const snap = await tx.get(ref);
  return snap.exists() && snap.data()?.status === "granted";
}

export async function grantRewards(uid, {
  xpReward = 0, coinReward = 0, scoreReward = 0, transactionType,
  activityType, activityId, sourceModule, grantedBy = "system",
} = {}, tx = null) {
  if (!uid) return;
  const userRef = doc(db, "users", uid);
  const earningsRef = doc(db, "user_earnings", uid);
  // xpReward may be NEGATIVE - per-question quiz scoring deducts XP for wrong
  // answers (see lib/rewardPolicy.js's computeQuizReward). firestore.rules'
  // selfWriteDeltaSane caps only the upper end of an xp delta, so a decrease
  // needs no rules change. Callers are responsible for having already floored
  // the delta so a balance cannot go below zero - grantRewards writes whatever
  // it is handed and does not read the current balance (a Firestore
  // transaction requires every read before any write, and by the time most
  // callers reach here they have already written).
  //
  // scoreReward is deliberately still gated on > 0: Score never decreases
  // (selfScoreWriteSane rejects it outright), so a negative score reward is a
  // caller bug, not something to silently pass through.
  if (xpReward !== 0 || scoreReward > 0) {
    const patch = {};
    if (xpReward !== 0) patch.xp = increment(xpReward);
    if (scoreReward > 0) patch.score = increment(scoreReward);
    if (tx) tx.update(userRef, patch); else await updateDoc(userRef, patch);
  }
  if (coinReward > 0) {
    const earningsPatch = { pulseCoins: increment(coinReward), totalCoins: increment(coinReward) };
    if (tx) tx.set(earningsRef, earningsPatch, { merge: true }); else await setDoc(earningsRef, earningsPatch, { merge: true });
    // Best-effort analytics log, deliberately NOT part of the atomic
    // transaction - losing this one log entry to a rare mid-transaction
    // crash is an acceptable analytics gap, unlike losing the reward itself.
    if (transactionType) logCoinTransaction(uid, transactionType, coinReward);
  }
  // Central audit-trail ledger entry - a plain, unmerged set (never merge:
  // true) so a client-side repeat call is rejected by firestore.rules as an
  // `update` to an existing doc rather than silently succeeding a second
  // time.
  if (activityType && activityId) {
    const ledgerRef = rewardLedgerRef(uid, activityType, activityId);
    const ledgerData = {
      uid, activityType, activityId,
      xp: xpReward, coins: coinReward, score: scoreReward || xpReward,
      sourceModule: sourceModule || activityType,
      grantedAt: serverTimestamp(), grantedBy, status: "granted",
    };
    if (tx) tx.set(ledgerRef, ledgerData); else await setDoc(ledgerRef, ledgerData);
  }
}
