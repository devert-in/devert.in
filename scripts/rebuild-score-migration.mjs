// Rebuilds every student's `score` field from REAL, verified learning
// history - never by copying the existing `xp` field, since `xp` is known to
// contain at least one historical duplicate-reward bug (Daily Learning used
// to grant its flat day-completion bonus AND each embedded CodeLab problem's
// own reward separately, before this pass's suppressReward fix). Score is
// reconstructed fresh from the underlying completion records themselves.
//
// DRY RUN BY DEFAULT. Prints a per-student report (also written in full to a
// JSON file next to this script) and NEVER writes to Firestore unless
// invoked with --apply. Review the dry-run report yourself before ever
// passing --apply against production - this script will not ask again.
//
// Usage:
//   node scripts/rebuild-score-migration.mjs             (dry run, writes report)
//   node scripts/rebuild-score-migration.mjs --apply      (writes users/{uid}.score)
//
// Five independent sources are summed per uid:
//   1. Daily Learning - institutions/*/dailyLearningLog docs with completedAt
//      set, summing xpEarned. Covers Mon-Fri lessons AND Saturday
//      Assessments/tests (same collection, type:"test").
//   2. Programming - programming_progress docs' completedTopicIds, each
//      looked up against programmingLanguages/{langId}/topics/{topicId}'s
//      CURRENT xpReward (the progress doc itself never stored the amount,
//      only the completion flag - this is a "recompute at current config"
//      rebuild, not a replay of a historical ledger).
//   3. CS Core - identical pattern via cscore_progress + csCoreSubjects/*/topics.
//   4. Contests - contests/*/submissions docs (doc id == uid) where graded
//      is true, summing xpEarned - already an immutable per-contest ledger.
//   5. CodeLab/DSA standalone - codelab_submissions docs, summing xpEarned,
//      EXCLUDING any submission whose problemId appears in ANY institution's
//      Daily Learning day (institutions/*/dailyLearning docs' problemIds
//      array) - those are already counted once via source #1's flat day
//      bonus, and double-counting them here would reproduce the exact
//      historical bug this whole redesign exists to fix.
//
// Company Vault and Assessments are NOT separate sources - Company Vault has
// no reward-granting mechanism today (confirmed: no grantRewards call
// anywhere in lib/companyPrep.js, nothing real to sum), and Assessments is
// Daily Learning's own Saturday type:"test" content, already inside source
// #1 - this report never claims a module contributed when it structurally
// couldn't have.
import admin from "firebase-admin";
import { readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(join(__dirname, "service-account.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const APPLY = process.argv.includes("--apply");

function add(map, key, amount) {
  if (!key || !amount) return;
  map.set(key, (map.get(key) || 0) + amount);
}

async function buildEmbeddedProblemIdSet() {
  const set = new Set();
  const snap = await db.collectionGroup("dailyLearning").get();
  snap.forEach(d => {
    const ids = d.data().problemIds || [];
    ids.forEach(id => set.add(id));
  });
  return set;
}

async function buildTopicRewardLookup(parentCollection) {
  // Map<parentDocId, Map<topicId, xpReward>>
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

async function sumDailyLearning() {
  const map = new Map();
  const snap = await db.collectionGroup("dailyLearningLog").get();
  snap.forEach(d => {
    const data = d.data();
    if (!data.completedAt) return;
    add(map, data.uid, data.xpEarned || 0);
  });
  return map;
}

async function sumProgress(progressCollection, rewardLookup) {
  const map = new Map();
  const skippedTopicsByUid = new Map();
  const snap = await db.collection(progressCollection).get();
  snap.forEach(d => {
    const data = d.data();
    const parentId = data.langId || data.subjectId;
    const topicMap = rewardLookup.get(parentId);
    (data.completedTopicIds || []).forEach(topicId => {
      const reward = topicMap?.get(topicId);
      if (reward === undefined) {
        if (!skippedTopicsByUid.has(data.uid)) skippedTopicsByUid.set(data.uid, []);
        skippedTopicsByUid.get(data.uid).push(`${parentId}/${topicId}`);
        return;
      }
      add(map, data.uid, reward);
    });
  });
  return { map, skippedTopicsByUid };
}

async function sumContests() {
  const map = new Map();
  const snap = await db.collectionGroup("submissions").get();
  snap.forEach(d => {
    const data = d.data();
    if (!data.graded) return;
    // doc id under contests/{contestId}/submissions is the uid itself.
    add(map, d.id, data.xpEarned || 0);
  });
  return map;
}

async function sumCodelab(embeddedProblemIds) {
  const map = new Map();
  let excludedCount = 0;
  const snap = await db.collection("codelab_submissions").get();
  snap.forEach(d => {
    const data = d.data();
    if (embeddedProblemIds.has(data.problemId)) { excludedCount++; return; }
    add(map, data.uid, data.xpEarned || 0);
  });
  return { map, excludedCount };
}

// user_earnings/{uid} in chunks via getAll() (handles its own internal
// batching) rather than one getDoc per user awaited sequentially.
async function fetchAllCoins(uids) {
  const map = new Map();
  for (let i = 0; i < uids.length; i += 300) {
    const chunk = uids.slice(i, i + 300);
    const refs = chunk.map(uid => db.collection("user_earnings").doc(uid));
    const snaps = await db.getAll(...refs);
    snaps.forEach((snap, idx) => map.set(chunk[idx], snap.exists ? (snap.data().totalCoins || 0) : 0));
  }
  return map;
}

// Institution-scoped rank by a numeric field, descending, 1-indexed - same
// "rank within your own campus" semantics as CampusWorkspace's own
// useMyInstitutionRank, computed locally here instead of one query per
// institution since we already have every user in memory.
function computeRanks(usersByInstitution, field) {
  const rankByUid = new Map();
  for (const users of usersByInstitution.values()) {
    const sorted = [...users].sort((a, b) => (b[field] || 0) - (a[field] || 0));
    sorted.forEach((u, i) => rankByUid.set(u.uid, i + 1));
  }
  return rankByUid;
}

console.log(APPLY ? "Running in APPLY mode - users/{uid}.score WILL be overwritten." : "Running in DRY RUN mode - no writes will be made.");
console.log("");

console.log("Building embedded-problem-id set from every institution's Daily Learning days...");
const embeddedProblemIds = await buildEmbeddedProblemIdSet();
console.log(`  ${embeddedProblemIds.size} distinct problem IDs are embedded in some Daily Learning day.`);

console.log("Building topic reward lookups (Programming, CS Core)...");
const [programmingRewards, csCoreRewards] = await Promise.all([
  buildTopicRewardLookup("programmingLanguages"),
  buildTopicRewardLookup("csCoreSubjects"),
]);

console.log("Summing all five reward sources...");
const [dailyLearningMap, programmingResult, csCoreResult, contestMap, codelabResult] = await Promise.all([
  sumDailyLearning(),
  sumProgress("programming_progress", programmingRewards),
  sumProgress("cscore_progress", csCoreRewards),
  sumContests(),
  sumCodelab(embeddedProblemIds),
]);

if (programmingResult.skippedTopicsByUid.size) console.log(`  ${programmingResult.skippedTopicsByUid.size} student(s) have a completed Programming topic whose config no longer exists (content was deleted since completion) - flagged per-student below, not silently dropped.`);
if (csCoreResult.skippedTopicsByUid.size) console.log(`  ${csCoreResult.skippedTopicsByUid.size} student(s) have a completed CS Core topic whose config no longer exists.`);
console.log(`  Excluded ${codelabResult.excludedCount} CodeLab submission(s) already counted via a Daily Learning day (avoiding the known historical double-reward bug).`);

console.log("Fetching all users...");
const usersSnap = await db.collection("users").get();
const allUids = usersSnap.docs.map(d => d.id);
const allUidSet = new Set(allUids);

console.log(`Fetching user_earnings (Coins) for ${allUids.length} users...`);
const coinsByUid = await fetchAllCoins(allUids);

// First pass: compute breakdown/proposedScore per user and group by
// institution so ranks can be computed in a second pass.
const usersByInstitution = new Map();
const perUid = new Map();
for (const userDoc of usersSnap.docs) {
  const uid = userDoc.id;
  const data = userDoc.data();
  const breakdown = {
    dailyLearning: dailyLearningMap.get(uid) || 0,
    programming: programmingResult.map.get(uid) || 0,
    csCore: csCoreResult.map.get(uid) || 0,
    contests: contestMap.get(uid) || 0,
    codelab: codelabResult.map.get(uid) || 0,
  };
  const proposedScore = Object.values(breakdown).reduce((a, b) => a + b, 0);
  const record = {
    uid,
    currentXp: data.xp || 0,
    proposedScore,
  };
  perUid.set(uid, { data, breakdown, proposedScore });
  const instId = data.institutionId || "(none)";
  if (!usersByInstitution.has(instId)) usersByInstitution.set(instId, []);
  usersByInstitution.get(instId).push(record);
}

const currentXpRankByUid = computeRanks(usersByInstitution, "currentXp");
const proposedScoreRankByUid = computeRanks(usersByInstitution, "proposedScore");

const MODULE_LABELS = { dailyLearning: "Daily Learning", programming: "Programming", csCore: "CS Core", contests: "Contests", codelab: "DSA / CodeLab" };

const allRows = [];
for (const userDoc of usersSnap.docs) {
  const uid = userDoc.id;
  const { data, breakdown, proposedScore } = perUid.get(uid);
  const currentScore = data.score || 0;
  const currentXp = data.xp || 0;
  const currentCoins = coinsByUid.get(uid) || 0;

  // "Duplicate XP" only makes sense as a positive figure - currentXp sitting
  // ABOVE the freshly-recomputed total suggests the live xp field still
  // carries an uncorrected historical double-reward. currentXp sitting
  // BELOW the recomputed total is normal and expected for any student who
  // has ever converted XP to Coins in the Wallet (xp can decrease; Score
  // never does), so that direction is never labeled "duplicate."
  const xpVsScoreDelta = currentXp - proposedScore;
  const duplicateXpSuspected = Math.max(0, xpVsScoreDelta);

  const modulesContributing = Object.entries(breakdown).filter(([, v]) => v > 0).map(([k]) => MODULE_LABELS[k]);

  const anomalies = [];
  if (!data.institutionId) anomalies.push("No institutionId on this user - not ranked on any campus leaderboard.");
  if (currentScore > 0 && currentScore !== proposedScore) anomalies.push(`Live score field is already non-zero (${currentScore}) and disagrees with the recomputed total - the incremental reward system may already be running for this user.`);
  if (programmingResult.skippedTopicsByUid.has(uid)) anomalies.push(`${programmingResult.skippedTopicsByUid.get(uid).length} completed Programming topic(s) reference deleted content: ${programmingResult.skippedTopicsByUid.get(uid).join(", ")}`);
  if (csCoreResult.skippedTopicsByUid.has(uid)) anomalies.push(`${csCoreResult.skippedTopicsByUid.get(uid).length} completed CS Core topic(s) reference deleted content: ${csCoreResult.skippedTopicsByUid.get(uid).join(", ")}`);
  if (currentXp > 0 && proposedScore === 0) anomalies.push("Has XP but zero recomputed Score - likely a manual admin XP grant (Admin > Users) with no matching learning-activity record, not a bug in this script.");
  if (duplicateXpSuspected > 0 && currentXp > 0 && duplicateXpSuspected / currentXp > 0.5) anomalies.push(`Suspected duplicate XP (${duplicateXpSuspected}) is over half of current XP (${currentXp}) - review manually before trusting either the old xp figure or this recompute.`);

  const migrationStatus = anomalies.length ? "REVIEW" : "SAFE";

  allRows.push({
    uid,
    handle: data.handle || data.campusFullName || data.email || "(no handle)",
    institutionId: data.institutionId || null,
    currentXp,
    currentCoins,
    currentScore,
    currentXpRank: currentXpRankByUid.get(uid) ?? null,
    proposedScore,
    proposedScoreRank: proposedScoreRankByUid.get(uid) ?? null,
    scoreVsCurrentDelta: proposedScore - currentScore,
    duplicateXpSuspected,
    modulesContributing,
    breakdown,
    anomalies,
    migrationStatus,
  });
}

// Orphaned progress/log/submission records referencing a uid with no users/{uid}
// doc at all - flagged, not silently dropped, since it may mean a deleted
// account whose Firestore data was never fully cleaned up.
const orphanUids = new Set();
[dailyLearningMap, programmingResult.map, csCoreResult.map, contestMap, codelabResult.map].forEach(map => {
  for (const uid of map.keys()) if (!allUidSet.has(uid)) orphanUids.add(uid);
});

const changedRows = allRows.filter(r => r.scoreVsCurrentDelta !== 0).sort((a, b) => Math.abs(b.scoreVsCurrentDelta) - Math.abs(a.scoreVsCurrentDelta));
const reviewRows = allRows.filter(r => r.migrationStatus === "REVIEW");

console.log("");
console.log(`${allRows.length} total users. ${changedRows.length} would have their score change. ${reviewRows.length} flagged REVIEW (everyone else is SAFE).`);
if (orphanUids.size) console.log(`WARNING: ${orphanUids.size} uid(s) have reward history but no users/{uid} doc (orphaned/deleted accounts) - excluded from the report entirely.`);

function printStudent(r) {
  console.log(`\nStudent\n\n${r.handle}\n\nCurrent XP: ${r.currentXp}\nCurrent Coins: ${r.currentCoins}\nCurrent Leaderboard Position: ${r.currentXpRank ? `#${r.currentXpRank} (by XP, pre-migration)` : "unranked"}\n\nCalculated Score: ${r.proposedScore}\nProposed Leaderboard Position: ${r.proposedScoreRank ? `#${r.proposedScoreRank} (by Score)` : "unranked"}\n\nSuspected Duplicate XP: ${r.duplicateXpSuspected}\n\nModules\n${r.modulesContributing.length ? r.modulesContributing.map(m => `  check ${m}`).join("\n") : "  (none - no recorded activity under the new architecture)"}\n\nAnomalies\n${r.anomalies.length ? r.anomalies.map(a => `  ! ${a}`).join("\n") : "  none"}\n\nMigration Status\n\n${r.migrationStatus}`);
}

console.log("\n" + "=".repeat(60));
console.log(`TOP ${Math.min(15, changedRows.length)} LARGEST CHANGES (full detail)`);
console.log("=".repeat(60));
changedRows.slice(0, 15).forEach(printStudent);

if (reviewRows.length) {
  console.log("\n" + "=".repeat(60));
  console.log(`ALL ${reviewRows.length} STUDENTS FLAGGED "REVIEW" (full detail)`);
  console.log("=".repeat(60));
  reviewRows.forEach(printStudent);
}

const reportPath = join(__dirname, `_score-migration-report-${Date.now()}.json`);
writeFileSync(reportPath, JSON.stringify({
  generatedAt: new Date().toISOString(),
  totalUsers: allRows.length,
  changedUsers: changedRows.length,
  safeCount: allRows.length - reviewRows.length,
  reviewCount: reviewRows.length,
  orphanUids: [...orphanUids],
  students: allRows,
}, null, 2));
console.log("");
console.log(`Full per-student report (every user, not just changed/flagged ones) written to ${reportPath}`);

if (!APPLY) {
  console.log("");
  console.log("Dry run complete. Review the report above/in the JSON file - especially every REVIEW-flagged student - then re-run with --apply to write these scores.");
  process.exit(0);
}

console.log("");
console.log(`Applying ${changedRows.length} score update(s) in batches of 400...`);
for (let i = 0; i < changedRows.length; i += 400) {
  const chunk = changedRows.slice(i, i + 400);
  const batch = db.batch();
  chunk.forEach(r => batch.update(db.collection("users").doc(r.uid), { score: r.proposedScore }));
  await batch.commit();
  console.log(`  committed ${Math.min(i + 400, changedRows.length)}/${changedRows.length}`);
}
console.log("Done.");
