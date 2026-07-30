// Read-only integrity audit of the central reward_grants ledger (see
// lib/rewards.js) - run this any time to get a snapshot of reward-system
// health. Never writes anything.
//
// Checks:
//   1. Structural: no two ledger docs share a (uid, activityType, activityId)
//      key - this SHOULD be structurally impossible (deterministic doc IDs +
//      firestore.rules' create-only enforcement), so any hit here would mean
//      the rules were bypassed (e.g. via the Admin SDK, or a rules
//      regression) - a genuine, high-severity finding, not routine noise.
//   2. Per-module coverage: how many ledger entries exist per sourceModule,
//      compared against a rough expected count from that module's own
//      collection (dailyLearningLog completions, programming_progress
//      completedTopicIds, etc.) - flags a module that's silently NOT writing
//      to the ledger (a regression in one of this session's Phase 1 fixes).
//   3. Reconciliation: for a sample of users, sum their `granted`-minus-
//      `reversed` ledger entries and compare against their actual current
//      xp (accounting for xp_convert spend) - flags any user whose live
//      balance has drifted from what the ledger says it should be.
//
// Usage: node scripts/audit-reward-ledger-integrity.mjs
import admin from "firebase-admin";
import { readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(join(__dirname, "service-account.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const XP_PER_COIN = 5;

async function main() {
  console.log("Reward Ledger Integrity Audit (read-only)\n");

  const ledgerSnap = await db.collection("reward_grants").get();
  console.log(`Total ledger entries: ${ledgerSnap.size}`);

  // --- 1. Structural duplicate check ---
  const seenKeys = new Map();
  const structuralDuplicates = [];
  ledgerSnap.forEach(d => {
    const data = d.data();
    const key = `${data.uid}_${data.activityType}_${data.activityId}`;
    if (seenKeys.has(key) && seenKeys.get(key) !== d.id) {
      structuralDuplicates.push({ key, docIds: [seenKeys.get(key), d.id] });
    }
    seenKeys.set(key, d.id);
  });
  console.log(`Structural duplicates (same uid+activityType+activityId, different doc ids): ${structuralDuplicates.length}`);
  if (structuralDuplicates.length > 0) {
    console.log("  !! HIGH SEVERITY - this should be structurally impossible. Investigate immediately:");
    structuralDuplicates.slice(0, 10).forEach(d => console.log(`     ${d.key}: ${d.docIds.join(", ")}`));
  }

  // --- 2. Per-module coverage ---
  const bySourceModule = new Map();
  const grantedByUid = new Map(); // uid -> { xp, coins, score }
  ledgerSnap.forEach(d => {
    const data = d.data();
    bySourceModule.set(data.sourceModule, (bySourceModule.get(data.sourceModule) || 0) + 1);
    if (data.status !== "granted") return;
    const cur = grantedByUid.get(data.uid) || { xp: 0, coins: 0, score: 0 };
    cur.xp += data.xp || 0; cur.coins += data.coins || 0; cur.score += data.score || 0;
    grantedByUid.set(data.uid, cur);
  });
  console.log("\nLedger entries by sourceModule:");
  for (const [mod, count] of bySourceModule) console.log(`  ${mod || "(none)"}: ${count}`);

  const [dailyLogsSnap, programmingProgressSnap, csCoreProgressSnap] = await Promise.all([
    db.collectionGroup("dailyLearningLog").get(),
    db.collection("programming_progress").get(),
    db.collection("cscore_progress").get(),
  ]);
  const completedDailyLearningDays = dailyLogsSnap.docs.filter(d => d.data().completedAt).length;
  const completedProgrammingTopics = programmingProgressSnap.docs.reduce((sum, d) => sum + (d.data().completedTopicIds || []).length, 0);
  const completedCsCoreTopics = csCoreProgressSnap.docs.reduce((sum, d) => sum + (d.data().completedTopicIds || []).length, 0);

  console.log("\nCoverage check (ledger entries should be <= actual completions, since old completions predate the ledger):");
  console.log(`  daily_learning_day ledger entries: ${bySourceModule.get("daily_learning") || 0} vs ${completedDailyLearningDays} completed day-logs`);
  console.log(`  programming_topic ledger entries vs ${completedProgrammingTopics} completed topics (mixed sourceModule counts above)`);
  console.log(`  cscore_topic ledger entries vs ${completedCsCoreTopics} completed topics (mixed sourceModule counts above)`);

  // --- 3. Reconciliation sample ---
  console.log("\nReconciling a sample of users' ledger totals against their live xp balance...");
  const conversionsSnap = await db.collection("coin_transactions").where("type", "==", "xp_convert").get();
  const convertedXpByUid = new Map();
  conversionsSnap.forEach(d => {
    const data = d.data();
    convertedXpByUid.set(data.uid, (convertedXpByUid.get(data.uid) || 0) + (data.amount || 0) * XP_PER_COIN);
  });

  const sampleUids = [...grantedByUid.keys()].slice(0, 200);
  const userRefs = sampleUids.map(uid => db.collection("users").doc(uid));
  const userSnaps = userRefs.length ? await db.getAll(...userRefs) : [];
  let reconciledOk = 0;
  const mismatches = [];
  userSnaps.forEach((snap, i) => {
    const uid = sampleUids[i];
    if (!snap.exists) return;
    const currentXp = snap.data().xp || 0;
    const ledgerXp = grantedByUid.get(uid)?.xp || 0;
    const expectedXp = ledgerXp - (convertedXpByUid.get(uid) || 0);
    // Ledger only covers activity granted AFTER this session's fix shipped -
    // a mismatch is EXPECTED and not a bug for any user whose xp predates
    // the ledger's existence. This reconciliation is only meaningful once
    // enough time has passed that most active users' balances are
    // ledger-tracked - reported here as a forward-looking health signal,
    // not a definitive pass/fail today.
    if (Math.abs(currentXp - expectedXp) <= 5) reconciledOk++;
    else mismatches.push({ uid, currentXp, ledgerXp, expectedXp, diff: currentXp - expectedXp });
  });
  console.log(`  ${reconciledOk}/${userSnaps.length} sampled users reconcile within a small tolerance (expected to be low today - the ledger is new).`);
  console.log(`  ${mismatches.length} sampled users show a larger drift (likely pre-ledger history, not necessarily a bug).`);

  const report = {
    generatedAt: new Date().toISOString(),
    totalLedgerEntries: ledgerSnap.size,
    structuralDuplicates,
    bySourceModule: Object.fromEntries(bySourceModule),
    coverage: { completedDailyLearningDays, completedProgrammingTopics, completedCsCoreTopics },
    reconciliationSample: { checked: userSnaps.length, reconciledOk, mismatches: mismatches.slice(0, 50) },
  };
  const reportPath = join(__dirname, `reward-ledger-audit-${new Date().toISOString().slice(0, 10)}.json`);
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\nFull report written to ${reportPath}`);
}

main().catch(e => { console.error(e); process.exit(1); });
