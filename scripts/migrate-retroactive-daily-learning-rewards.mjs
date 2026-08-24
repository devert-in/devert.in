// Retroactively grants the new, flat 25 XP / 5 coin Daily Learning
// per-problem reward (see lib/dailyLearning.js's
// grantDailyLearningProblemReward and DAILY_LEARNING_PROBLEM_XP/COINS
// constants) for every problem a student already solved BEFORE this reward
// existed - so students who did the work under the old suppressReward
// (0 XP/0 coins) behavior don't permanently lose credit for it.
//
// DRY RUN BY DEFAULT. Prints the exact report format requested (scanned /
// rewarded / skipped / duplicates-removed / completion line) and NEVER
// writes to Firestore unless invoked with --execute. Review the dry-run
// report before ever passing --execute against production.
//
// Usage:
//   node scripts/migrate-retroactive-daily-learning-rewards.mjs           (dry run)
//   node scripts/migrate-retroactive-daily-learning-rewards.mjs --execute (writes reward_grants + users/user_earnings)
//
// Idempotent by construction: eligibility is decided by checking the SAME
// central reward_grants ledger this migration writes to (activityType
// "daily_learning_problem", activityId "{slug}_{date}_{problemId}") - running
// this script twice (or running it, then having the live app grant the same
// problem organically) never double-grants, since a second attempt for an
// already-existing ledger doc is simply skipped here (and would be REJECTED
// by firestore.rules if it ever came from a client instead).
import admin from "firebase-admin";
import { readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(join(__dirname, "service-account.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const EXECUTE = process.argv.includes("--execute");
const DAILY_LEARNING_PROBLEM_XP = 25;
const DAILY_LEARNING_PROBLEM_COINS = 5;

function ledgerId(uid, activityType, activityId) {
  return `${uid}_${activityType}_${activityId}`;
}

async function main() {
  console.log(EXECUTE
    ? "Running in EXECUTE mode - reward_grants/users/user_earnings WILL be written."
    : "Running in DRY RUN mode - no writes will be made.");
  console.log("");
  console.log("Scanning solved Daily Learning problems...");

  // dailyLearningLog is a collectionGroup across every institution
  // (institutions/{slug}/dailyLearningLog/{uid}_{date}) - the slug isn't a
  // field on the doc itself, so it's recovered from the doc ref's parent
  // path (institutions/{slug}/dailyLearningLog/{docId}).
  const logsSnap = await db.collectionGroup("dailyLearningLog").get();

  let usersScanned = 0;
  let problemsRewarded = 0;
  let rewardsSkippedAlreadyGranted = 0;
  let totalXpGranted = 0;
  let totalCoinsGranted = 0;
  const perUser = new Map(); // uid -> { problemsRewarded, xp, coins }
  const eligibleGrants = []; // { uid, slug, date, problemId, activityId }

  for (const logDoc of logsSnap.docs) {
    const data = logDoc.data();
    const uid = data.uid;
    const date = data.date;
    const problemsSolved = data.problemsSolved || [];
    if (!uid || !date || problemsSolved.length === 0) continue;

    // institutions/{slug}/dailyLearningLog/{docId}
    const slug = logDoc.ref.parent.parent.id;
    usersScanned++;

    for (const problemId of problemsSolved) {
      const activityId = `${slug}_${date}_${problemId}`;
      const gid = ledgerId(uid, "daily_learning_problem", activityId);
      const ledgerSnap = await db.collection("reward_grants").doc(gid).get();
      if (ledgerSnap.exists) {
        rewardsSkippedAlreadyGranted++;
        continue;
      }
      eligibleGrants.push({ uid, slug, date, problemId, activityId, gid });
    }
  }

  console.log(`Users scanned: ${usersScanned}`);
  console.log(`Eligible problems found (not yet rewarded): ${eligibleGrants.length}`);
  console.log(`Rewards skipped (already granted): ${rewardsSkippedAlreadyGranted}`);
  console.log("");

  if (EXECUTE) {
    console.log("Granting rewards...");
    for (const g of eligibleGrants) {
      await db.runTransaction(async (tx) => {
        const ledgerRef = db.collection("reward_grants").doc(g.gid);
        const recheck = await tx.get(ledgerRef);
        if (recheck.exists) return; // granted by something else since the scan above
        tx.update(db.collection("users").doc(g.uid), {
          xp: admin.firestore.FieldValue.increment(DAILY_LEARNING_PROBLEM_XP),
          score: admin.firestore.FieldValue.increment(DAILY_LEARNING_PROBLEM_XP),
        });
        tx.set(db.collection("user_earnings").doc(g.uid), {
          pulseCoins: admin.firestore.FieldValue.increment(DAILY_LEARNING_PROBLEM_COINS),
          totalCoins: admin.firestore.FieldValue.increment(DAILY_LEARNING_PROBLEM_COINS),
        }, { merge: true });
        tx.set(ledgerRef, {
          uid: g.uid, activityType: "daily_learning_problem", activityId: g.activityId,
          xp: DAILY_LEARNING_PROBLEM_XP, coins: DAILY_LEARNING_PROBLEM_COINS, score: DAILY_LEARNING_PROBLEM_XP,
          sourceModule: "daily_learning", grantedAt: admin.firestore.FieldValue.serverTimestamp(),
          grantedBy: "migration:retroactive-daily-learning-rewards", status: "granted",
        });
      });
      problemsRewarded++;
      totalXpGranted += DAILY_LEARNING_PROBLEM_XP;
      totalCoinsGranted += DAILY_LEARNING_PROBLEM_COINS;
      const u = perUser.get(g.uid) || { problemsRewarded: 0, xp: 0, coins: 0 };
      u.problemsRewarded++; u.xp += DAILY_LEARNING_PROBLEM_XP; u.coins += DAILY_LEARNING_PROBLEM_COINS;
      perUser.set(g.uid, u);
    }
  } else {
    // Dry run still reports what WOULD happen, per-user, without writing.
    for (const g of eligibleGrants) {
      const u = perUser.get(g.uid) || { problemsRewarded: 0, xp: 0, coins: 0 };
      u.problemsRewarded++; u.xp += DAILY_LEARNING_PROBLEM_XP; u.coins += DAILY_LEARNING_PROBLEM_COINS;
      perUser.set(g.uid, u);
    }
    problemsRewarded = eligibleGrants.length;
    totalXpGranted = eligibleGrants.length * DAILY_LEARNING_PROBLEM_XP;
    totalCoinsGranted = eligibleGrants.length * DAILY_LEARNING_PROBLEM_COINS;
  }

  console.log(`Problems ${EXECUTE ? "rewarded" : "that would be rewarded"}: ${problemsRewarded}`);
  console.log(`Total XP ${EXECUTE ? "granted" : "that would be granted"}: ${totalXpGranted}`);
  console.log(`Total coins ${EXECUTE ? "granted" : "that would be granted"}: ${totalCoinsGranted}`);
  console.log("");
  console.log(EXECUTE ? "Completed successfully." : "Dry run complete - no writes made. Re-run with --execute to apply.");

  const report = {
    mode: EXECUTE ? "execute" : "dry-run",
    generatedAt: new Date().toISOString(),
    usersScanned,
    problemsRewarded,
    rewardsSkippedAlreadyGranted,
    totalXpGranted,
    totalCoinsGranted,
    perUser: Object.fromEntries(perUser),
  };
  const reportPath = join(__dirname, `retroactive-daily-learning-rewards-${EXECUTE ? "applied" : "dryrun"}-${new Date().toISOString().slice(0, 10)}.json`);
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`Full report written to ${reportPath}`);
}

main().catch(e => { console.error(e); process.exit(1); });
