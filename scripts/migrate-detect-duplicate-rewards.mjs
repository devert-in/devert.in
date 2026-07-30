// Detects (and, only with explicit review, can remove) historical
// duplicate-reward inflation in `xp` and `user_earnings.pulseCoins`/
// `totalCoins` - the same class of bug `score` was already rebuilt from
// scratch for in scripts/rebuild-score-migration.mjs (applied
// 2026-07-23, see score-migration-applied-2026-07-23.json), which was
// caused by Daily Learning granting its flat day-completion bonus AND each
// embedded CodeLab problem's own standalone reward separately, before
// suppressReward existed. `xp`/coins were NEVER rebuilt the way `score`
// was - this script extends that exact same verified 5-source
// reconstruction to them, this time also accounting for legitimate XP->Coin
// conversions (score never decreases, so that rebuild didn't need to).
//
// IMPORTANT, READ BEFORE USING --execute: this script can only detect
// discrepancies against a RECOMPUTED baseline - it cannot see admin manual
// grants made through the Admin console's own +XP/-XP action (those are
// legitimate, deliberate adjustments with no "source" this recompute knows
// about) or any other legitimate reward path not modeled in the 5 sources
// below. A flagged discrepancy is evidence worth investigating, not proof
// of a duplicate - --execute revokes ONLY the specific excess this script
// can positively attribute to the known historical double-grant bug
// (Daily-Learning-embedded CodeLab submissions counted twice), never a
// generic "recomputed doesn't match current" adjustment. Everything else
// stays in the dry-run report for manual review.
//
// DRY RUN BY DEFAULT.
// Usage:
//   node scripts/migrate-detect-duplicate-rewards.mjs             (report only)
//   node scripts/migrate-detect-duplicate-rewards.mjs --execute   (revokes ONLY the
//     specific, positively-identified double-grant excess described above)
import admin from "firebase-admin";
import { readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(join(__dirname, "service-account.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const EXECUTE = process.argv.includes("--execute");
const XP_PER_COIN = 5; // DEFAULT_ECONOMY.XP_PER_COIN, lib/economy.js

function add(map, key, amount) {
  if (!key || !amount) return;
  map.set(key, (map.get(key) || 0) + amount);
}

async function buildEmbeddedProblemIdSet() {
  const set = new Set();
  const snap = await db.collectionGroup("dailyLearning").get();
  snap.forEach(d => (d.data().problemIds || []).forEach(id => set.add(id)));
  return set;
}

// Every codelab_submissions row whose problemId is embedded in SOME Daily
// Learning day, for a student who has since had that exact problem rewarded
// again by the NEW flat daily_learning_problem ledger entry (this session's
// fix) - if their historical codelab_submissions xpEarned/coinsEarned for
// that same problemId is ALSO non-zero, that non-zero amount is the
// positively-identified historical double-grant (pre-suppressReward-fix
// era), safe to revoke.
async function findPositivelyIdentifiedDoubleGrants(embeddedProblemIds) {
  const excess = new Map(); // uid -> { xp, coins, submissionIds: [] }
  const snap = await db.collection("codelab_submissions").get();
  for (const d of snap.docs) {
    const data = d.data();
    if (!embeddedProblemIds.has(data.problemId)) continue;
    const xp = data.xpEarned || 0;
    const coins = data.coinsEarned || 0;
    if (xp === 0 && coins === 0) continue; // already correctly suppressed - nothing to revoke
    const cur = excess.get(data.uid) || { xp: 0, coins: 0, submissionIds: [] };
    cur.xp += xp; cur.coins += coins; cur.submissionIds.push(d.id);
    excess.set(data.uid, cur);
  }
  return excess;
}

async function sumDailyLearning() {
  const map = new Map();
  const snap = await db.collectionGroup("dailyLearningLog").get();
  snap.forEach(d => { const data = d.data(); if (data.completedAt) add(map, data.uid, data.xpEarned || 0); });
  return map;
}

async function buildTopicRewardLookup(parentCollection) {
  const lookup = new Map();
  const parents = await db.collection(parentCollection).get();
  for (const parent of parents.docs) {
    const topics = await parent.ref.collection("topics").get();
    const topicMap = new Map();
    topics.forEach(t => topicMap.set(t.id, t.data().xpReward || 0));
    lookup.set(parent.id, topicMap);
  }
  return lookup;
}

async function sumProgress(progressCollection, rewardLookup) {
  const map = new Map();
  const snap = await db.collection(progressCollection).get();
  snap.forEach(d => {
    const data = d.data();
    const topicMap = rewardLookup.get(data.langId || data.subjectId);
    (data.completedTopicIds || []).forEach(topicId => {
      const reward = topicMap?.get(topicId);
      if (reward !== undefined) add(map, data.uid, reward);
    });
  });
  return map;
}

async function sumContests() {
  const map = new Map();
  const snap = await db.collectionGroup("submissions").get();
  snap.forEach(d => { if (d.data().graded) add(map, d.id, d.data().xpEarned || 0); });
  return map;
}

async function sumCodelab(embeddedProblemIds) {
  const map = new Map();
  const snap = await db.collection("codelab_submissions").get();
  snap.forEach(d => { if (!embeddedProblemIds.has(d.data().problemId)) add(map, d.data().uid, d.data().xpEarned || 0); });
  return map;
}

async function sumXpConversions() {
  const map = new Map(); // uid -> total XP spent converting to coins
  const snap = await db.collection("coin_transactions").where("type", "==", "xp_convert").get();
  snap.forEach(d => { const data = d.data(); add(map, data.uid, (data.amount || 0) * XP_PER_COIN); });
  return map;
}

async function main() {
  console.log(EXECUTE
    ? "Running in EXECUTE mode - WILL revoke only the positively-identified historical double-grant excess described in this script's header comment."
    : "Running in DRY RUN mode - no writes will be made.");
  console.log("");

  console.log("Building embedded-problem-id set...");
  const embeddedProblemIds = await buildEmbeddedProblemIdSet();

  console.log("Finding positively-identified historical double-grants (Daily Learning problem also rewarded via standalone CodeLab)...");
  const doubleGrants = await findPositivelyIdentifiedDoubleGrants(embeddedProblemIds);

  console.log("Recomputing expected xp baseline from all reward sources (for the broader discrepancy report)...");
  const [dailyLearningMap, programmingRewards, csCoreRewards, contestMap, codelabMap, conversionMap] = await Promise.all([
    sumDailyLearning(),
    buildTopicRewardLookup("programmingLanguages").then(r => sumProgress("programming_progress", r)),
    buildTopicRewardLookup("csCoreSubjects").then(r => sumProgress("cscore_progress", r)),
    sumContests(),
    sumCodelab(embeddedProblemIds),
    sumXpConversions(),
  ]);

  const usersSnap = await db.collection("users").get();
  let usersScanned = 0;
  let duplicatesFound = 0;
  let xpToRevoke = 0;
  let coinsToRevoke = 0;
  const perUserReport = {};

  for (const userDoc of usersSnap.docs) {
    usersScanned++;
    const uid = userDoc.id;
    const currentXp = userDoc.data().xp || 0;
    const recomputedGross = (dailyLearningMap.get(uid) || 0) + (programmingRewards.get(uid) || 0)
      + (csCoreRewards.get(uid) || 0) + (contestMap.get(uid) || 0) + (codelabMap.get(uid) || 0);
    const converted = conversionMap.get(uid) || 0;
    const expectedXp = recomputedGross - converted;
    const dg = doubleGrants.get(uid);

    if (dg || Math.abs(currentXp - expectedXp) > 0) {
      duplicatesFound += dg ? 1 : 0;
      xpToRevoke += dg?.xp || 0;
      coinsToRevoke += dg?.coins || 0;
      perUserReport[uid] = {
        currentXp, expectedXpFromKnownSources: expectedXp, discrepancy: currentXp - expectedXp,
        positivelyIdentifiedDoubleGrant: dg ? { xp: dg.xp, coins: dg.coins, submissionIds: dg.submissionIds } : null,
        note: dg
          ? "Positively identified: this amount came from a Daily-Learning-embedded problem ALSO paying out its standalone CodeLab reward (pre-suppressReward-fix era)."
          : "Discrepancy vs recomputed baseline - NOT auto-revoked; may be a legitimate admin manual grant or another source this script doesn't model. Needs manual review.",
      };
    }
  }

  console.log(`Users scanned: ${usersScanned}`);
  console.log(`Positively-identified duplicate-reward users: ${duplicatesFound}`);
  console.log(`XP ${EXECUTE ? "revoked" : "that would be revoked"}: ${xpToRevoke}`);
  console.log(`Coins ${EXECUTE ? "revoked" : "that would be revoked"}: ${coinsToRevoke}`);
  console.log(`Additional users with an unexplained discrepancy (flagged for manual review, NOT auto-revoked): ${Object.keys(perUserReport).length - duplicatesFound}`);
  console.log("");

  if (EXECUTE) {
    console.log("Revoking positively-identified double-grants...");
    for (const [uid, dg] of doubleGrants) {
      await db.runTransaction(async (tx) => {
        tx.update(db.collection("users").doc(uid), {
          xp: admin.firestore.FieldValue.increment(-dg.xp),
        });
        if (dg.coins > 0) {
          tx.set(db.collection("user_earnings").doc(uid), {
            pulseCoins: admin.firestore.FieldValue.increment(-dg.coins),
            totalCoins: admin.firestore.FieldValue.increment(-dg.coins),
          }, { merge: true });
        }
        tx.set(db.collection("reward_grants").doc(`${uid}_duplicate_reversal_${dg.submissionIds.join("-").slice(0, 200)}`), {
          uid, activityType: "duplicate_reversal", activityId: dg.submissionIds.join(","),
          xp: -dg.xp, coins: -dg.coins, score: 0, sourceModule: "migration",
          grantedAt: admin.firestore.FieldValue.serverTimestamp(),
          grantedBy: "migration:detect-duplicate-rewards", status: "granted",
        });
      });
    }
    console.log("Completed successfully.");
  } else {
    console.log("Dry run complete - no writes made. Re-run with --execute to revoke ONLY the positively-identified double-grants.");
  }

  const report = {
    mode: EXECUTE ? "execute" : "dry-run",
    generatedAt: new Date().toISOString(),
    usersScanned,
    duplicatesFound,
    xpRevoked: xpToRevoke,
    coinsRevoked: coinsToRevoke,
    perUser: perUserReport,
  };
  const reportPath = join(__dirname, `duplicate-rewards-${EXECUTE ? "applied" : "dryrun"}-${new Date().toISOString().slice(0, 10)}.json`);
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`Full report written to ${reportPath}`);
}

main().catch(e => { console.error(e); process.exit(1); });
