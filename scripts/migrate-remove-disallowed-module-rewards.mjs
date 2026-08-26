// Detects (and, only with --execute, reverses) historical XP/Coins granted
// by modules that are no longer allowed to reward at all under the new
// platform policy: only Daily Learning, Programming, and CS Core grant
// XP/Coins/Score. Every other module (DSA Practice/CodeLab, Arena, Contests,
// Pulse likes/comments/saves, Learn/Courses, Aptitude/Grind) has already had
// its reward-GRANTING code removed (see this session's stabilization pass) -
// this script is the one-time cleanup of whatever those sources already
// granted historically, before that code was removed.
//
// Per-source recomputation (each summed independently, per uid):
//   - codelab:  sum(codelab_submissions.xpEarned / .coinsEarned) - covers
//     BOTH standalone and Daily-Learning-embedded solves; the embedded ones
//     already correctly recorded 0 (suppressReward), so summing everything
//     is safe and simpler than trying to distinguish the two.
//   - arena:    sum(arena_matches WHERE status=='won'.xpEarned) - no coins.
//   - contests: sum(collectionGroup('submissions') WHERE graded==true,
//     keyed by doc id == uid, .xpEarned + .coinsEarned).
//   - pulse:    sum(coin_transactions WHERE type IN
//     ['like_received','comment_received','save_received'].amount) - coins
//     only, credited historically to the POST AUTHOR (receiving uid).
//   - learn:    user_learning.completedTaskIds cross-referenced against
//     courses/*/modules/*/tasks/*'s own xpReward/coinReward (task ids are
//     Firestore auto-ids, assumed globally unique, so this doesn't need to
//     know which course a completed task belonged to).
//   - aptitude: user_aptitude_progress.dailyXp map, summed across every
//     date - xp only, no coins.
//
// *** SCORE IS DELIBERATELY NOT TOUCHED BY THIS SCRIPT, EVEN WITH --execute.
// *** Score is designed to be a PERMANENT, never-decreasing academic record
// *** (see lib/rewards.js's own header comment and firestore.rules'
// *** selfScoreWriteSane) - whether a policy change should claw back score
// *** that was legitimately earned under the OLD (more permissive) reward
// *** rules is a product decision, not a bug fix, and this script does not
// *** make that call for you. The score subtotal per user is still reported
// *** below for your own review.
//
// *** REAL-MONEY SAFETY SCOPE - READ BEFORE USING --execute ***
// Coins are convertible to real INR payouts (app/wallet/page.jsx,
// payout_requests). This script will NEVER propose reversing more coins
// than a user's CURRENT pulseCoins balance can absorb without going
// negative, and NEVER for a user who has ANY approved payout_request ever
// (real money already sent - clawing that back is a business/legal decision,
// not something an automated migration should do). Every user who fails
// either check has their coin reversal REDUCED or ZEROED and is flagged
// under "coinReversalLimited", never silently over-reversed.
//
// DRY RUN BY DEFAULT.
// Usage:
//   node scripts/migrate-remove-disallowed-module-rewards.mjs            (report only)
//   node scripts/migrate-remove-disallowed-module-rewards.mjs --execute  (reverses XP
//     and safety-checked Coins only - never Score, see above)
import admin from "firebase-admin";
import { readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(join(__dirname, "service-account.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const EXECUTE = process.argv.includes("--execute");

function add(map, key, amount) {
  if (!key || !amount) return;
  map.set(key, (map.get(key) || 0) + amount);
}

async function sumCodelab() {
  const xp = new Map(), coins = new Map();
  const snap = await db.collection("codelab_submissions").get();
  snap.forEach(d => {
    const data = d.data();
    add(xp, data.uid, data.xpEarned || 0);
    add(coins, data.uid, data.coinsEarned || 0);
  });
  return { xp, coins };
}

async function sumArena() {
  const xp = new Map();
  const snap = await db.collection("arena_matches").where("status", "==", "won").get();
  snap.forEach(d => add(xp, d.data().uid, d.data().xpEarned || 0));
  return { xp };
}

async function sumContests() {
  const xp = new Map(), coins = new Map();
  const snap = await db.collectionGroup("submissions").get();
  snap.forEach(d => {
    const data = d.data();
    if (!data.graded) return;
    // Only real contest submissions live at contests/{id}/submissions/{uid} -
    // collectionGroup('submissions') could in principle match a same-named
    // subcollection elsewhere; guard by parent path shape.
    if (d.ref.parent.parent?.parent?.id !== "contests") return;
    add(xp, d.id, data.xpEarned || 0);
    add(coins, d.id, data.coinsEarned || 0);
  });
  return { xp, coins };
}

async function sumPulse() {
  const coins = new Map();
  const types = ["like_received", "comment_received", "save_received"];
  for (const type of types) {
    const snap = await db.collection("coin_transactions").where("type", "==", type).get();
    snap.forEach(d => add(coins, d.data().uid, d.data().amount || 0));
  }
  return { coins };
}

async function buildTaskRewardLookup() {
  const lookup = new Map(); // taskId -> { xpReward, coinReward }
  const courses = await db.collection("courses").get();
  for (const course of courses.docs) {
    const modules = await course.ref.collection("modules").get();
    for (const mod of modules.docs) {
      const tasks = await mod.ref.collection("tasks").get();
      tasks.forEach(t => lookup.set(t.id, { xpReward: t.data().xpReward || 0, coinReward: t.data().coinReward || 0 }));
    }
  }
  return lookup;
}

async function sumLearn(taskRewardLookup) {
  const xp = new Map(), coins = new Map();
  const snap = await db.collection("user_learning").get();
  snap.forEach(d => {
    const data = d.data();
    (data.completedTaskIds || []).forEach(taskId => {
      const reward = taskRewardLookup.get(taskId);
      if (!reward) return;
      add(xp, d.id, reward.xpReward);
      add(coins, d.id, reward.coinReward);
    });
  });
  return { xp, coins };
}

async function sumAptitude() {
  const xp = new Map();
  const snap = await db.collection("user_aptitude_progress").get();
  snap.forEach(d => {
    const dailyXp = d.data().dailyXp || {};
    const total = Object.values(dailyXp).reduce((a, b) => a + (b || 0), 0);
    add(xp, d.id, total);
  });
  return { xp };
}

async function usersWithApprovedPayout() {
  const set = new Set();
  const snap = await db.collection("payout_requests").where("status", "==", "approved").get();
  snap.forEach(d => set.add(d.data().uid));
  return set;
}

async function main() {
  console.log(EXECUTE
    ? "Running in EXECUTE mode - WILL reverse XP and safety-checked Coins from disallowed-module sources. Score is NEVER touched by this script."
    : "Running in DRY RUN mode - no writes will be made.");
  console.log("");

  console.log("Summing historical grants from each disallowed module...");
  const [codelab, arena, contests, pulse, taskRewardLookup, aptitude, payoutUsers] = await Promise.all([
    sumCodelab(), sumArena(), sumContests(), sumPulse(),
    buildTaskRewardLookup(), sumAptitude(), usersWithApprovedPayout(),
  ]);
  const learn = await sumLearn(taskRewardLookup);

  const allUids = new Set([
    ...codelab.xp.keys(), ...arena.xp.keys(), ...contests.xp.keys(),
    ...pulse.coins.keys(), ...learn.xp.keys(), ...aptitude.xp.keys(),
  ]);

  const usersSnap = await db.getAll(...[...allUids].map(uid => db.collection("users").doc(uid)));
  const earningsSnap = await db.getAll(...[...allUids].map(uid => db.collection("user_earnings").doc(uid)));
  const currentXpByUid = new Map();
  const currentCoinsByUid = new Map();
  usersSnap.forEach((snap, i) => currentXpByUid.set([...allUids][i], snap.exists ? (snap.data().xp || 0) : 0));
  earningsSnap.forEach((snap, i) => currentCoinsByUid.set([...allUids][i], snap.exists ? (snap.data().pulseCoins || 0) : 0));

  let totalXpToRevoke = 0, totalCoinsProposed = 0, totalCoinsActuallyRevoked = 0;
  let usersAffected = 0, usersCoinLimited = 0;
  const perUser = {};

  for (const uid of allUids) {
    const bySource = {
      codelab:  { xp: codelab.xp.get(uid) || 0, coins: codelab.coins.get(uid) || 0 },
      arena:    { xp: arena.xp.get(uid) || 0, coins: 0 },
      contests: { xp: contests.xp.get(uid) || 0, coins: contests.coins.get(uid) || 0 },
      pulse:    { xp: 0, coins: pulse.coins.get(uid) || 0 },
      learn:    { xp: learn.xp.get(uid) || 0, coins: learn.coins.get(uid) || 0 },
      aptitude: { xp: aptitude.xp.get(uid) || 0, coins: 0 },
    };
    const xpTotal = Object.values(bySource).reduce((s, v) => s + v.xp, 0);
    const coinsProposed = Object.values(bySource).reduce((s, v) => s + v.coins, 0);
    if (xpTotal === 0 && coinsProposed === 0) continue;

    usersAffected++;
    totalXpToRevoke += xpTotal;
    totalCoinsProposed += coinsProposed;

    const currentCoins = currentCoinsByUid.get(uid) || 0;
    const hasApprovedPayout = payoutUsers.has(uid);
    let coinsToRevoke = coinsProposed;
    let coinReversalLimited = null;
    if (hasApprovedPayout) {
      coinReversalLimited = "user has at least one APPROVED payout (real money already sent) - coin reversal zeroed, needs manual/business review";
      coinsToRevoke = 0;
    } else if (coinsProposed > currentCoins) {
      coinReversalLimited = `proposed reversal (${coinsProposed}) exceeds current balance (${currentCoins}) - likely already spent; reversal capped to current balance`;
      coinsToRevoke = currentCoins;
    }
    totalCoinsActuallyRevoked += coinsToRevoke;
    if (coinReversalLimited) usersCoinLimited++;

    perUser[uid] = {
      currentXp: currentXpByUid.get(uid) || 0,
      currentCoins,
      bySource,
      xpToRevoke: xpTotal,
      coinsProposedForRevocation: coinsProposed,
      coinsToRevoke,
      coinReversalLimited,
      scoreNote: `This user's score was also inflated by ~${xpTotal} from these same sources historically (score mirrors xp at grant time) - NOT reversed by this script, see header comment. Manual product decision required if you want score adjusted too.`,
    };
  }

  console.log(`Users affected: ${usersAffected}`);
  console.log(`Total XP to revoke: ${totalXpToRevoke}`);
  console.log(`Total Coins identified from disallowed sources: ${totalCoinsProposed}`);
  console.log(`Total Coins actually ${EXECUTE ? "revoked" : "that would be revoked"} (after payout/balance safety limits): ${totalCoinsActuallyRevoked}`);
  console.log(`Users whose coin reversal was limited by the safety checks: ${usersCoinLimited}`);
  console.log("Score: NOT touched (see header comment) - reported per-user for your own review only.");
  console.log("");

  if (EXECUTE) {
    console.log("Reversing XP and safety-checked Coins...");
    for (const [uid, row] of Object.entries(perUser)) {
      if (row.xpToRevoke === 0 && row.coinsToRevoke === 0) continue;
      await db.runTransaction(async (tx) => {
        if (row.xpToRevoke > 0) {
          tx.update(db.collection("users").doc(uid), {
            xp: admin.firestore.FieldValue.increment(-row.xpToRevoke),
          });
        }
        if (row.coinsToRevoke > 0) {
          tx.set(db.collection("user_earnings").doc(uid), {
            pulseCoins: admin.firestore.FieldValue.increment(-row.coinsToRevoke),
            totalCoins: admin.firestore.FieldValue.increment(-row.coinsToRevoke),
          }, { merge: true });
        }
        tx.set(db.collection("reward_grants").doc(`${uid}_disallowed_module_reversal_${Date.now()}`), {
          uid, activityType: "disallowed_module_reversal", activityId: "policy_migration_2026",
          xp: -row.xpToRevoke, coins: -row.coinsToRevoke, score: 0, sourceModule: "migration",
          grantedAt: admin.firestore.FieldValue.serverTimestamp(),
          grantedBy: "migration:remove-disallowed-module-rewards", status: "granted",
        });
      });
    }
    console.log("Completed successfully.");
  } else {
    console.log("Dry run complete - no writes made. Review this report, then re-run with --execute to apply.");
  }

  const report = {
    mode: EXECUTE ? "execute" : "dry-run",
    generatedAt: new Date().toISOString(),
    usersAffected,
    totalXpToRevoke,
    totalCoinsProposed,
    totalCoinsActuallyRevoked,
    usersCoinLimited,
    scoreTouched: false,
    perUser,
  };
  const reportPath = join(__dirname, `disallowed-module-rewards-${EXECUTE ? "applied" : "dryrun"}-${new Date().toISOString().slice(0, 10)}.json`);
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`Full report written to ${reportPath}`);
}

main().catch(e => { console.error(e); process.exit(1); });
