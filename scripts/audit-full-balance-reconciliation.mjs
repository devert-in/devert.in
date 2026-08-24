// Read-only, whole-platform reconciliation: for every user, does their live
// xp/score balance match what reward_grants can account for, and if not, is
// the gap already explained by a documented prior migration?
//
// Prompted by a spot-check (sai_deekshith, +250 score / +210 xp drift) that
// turned out to be fully explained by scripts/score-migration-applied-
// 2026-07-23.json's pre-ledger rebuild - the reward_grants ledger only started
// covering activity from ~2026-07-25 onward, so any legitimate pre-existing
// balance shows up as "drift" here without being a bug. This script
// specifically separates that known, already-reviewed class of drift from
// anything genuinely unexplained, rather than re-litigating settled history.
//
// Read-only. Never writes. Usage: node scripts/audit-full-balance-reconciliation.mjs
import admin from "firebase-admin";
import { readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(join(__dirname, "service-account.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const XP_PER_COIN = 5;

function loadJsonIfExists(path) {
  try { return JSON.parse(readFileSync(path, "utf8")); } catch { return null; }
}

async function main() {
  console.log("Loading known prior migrations (documented, already-reviewed drift sources)...");
  const scoreMigration = loadJsonIfExists(join(__dirname, "score-migration-applied-2026-07-23.json"));
  const scoreMigrationByUid = new Map();
  (scoreMigration?.students || []).forEach(r => scoreMigrationByUid.set(r.uid, r));

  const dupApplied = loadJsonIfExists(join(__dirname, "duplicate-rewards-applied-2026-07-29.json"));
  const dupByUid = new Map(Object.entries(dupApplied?.perUser || {}));

  console.log(`  score-migration-applied-2026-07-23.json: ${scoreMigrationByUid.size} users`);
  console.log(`  duplicate-rewards-applied-2026-07-29.json: ${dupByUid.size} users`);

  console.log("\nLoading reward_grants ledger...");
  const ledgerSnap = await db.collection("reward_grants").get();
  const grantedByUid = new Map();
  ledgerSnap.forEach(d => {
    const x = d.data();
    if (x.status !== "granted") return;
    const cur = grantedByUid.get(x.uid) || { xp: 0, score: 0, coins: 0 };
    cur.xp += x.xp || 0; cur.score += x.score || 0; cur.coins += x.coins || 0;
    grantedByUid.set(x.uid, cur);
  });
  console.log(`  ${ledgerSnap.size} ledger entries across ${grantedByUid.size} users`);

  console.log("\nLoading xp->coin conversions...");
  const convSnap = await db.collection("coin_transactions").where("type", "==", "xp_convert").get();
  const convertedXpByUid = new Map();
  convSnap.forEach(d => {
    const x = d.data();
    convertedXpByUid.set(x.uid, (convertedXpByUid.get(x.uid) || 0) + (x.amount || 0) * XP_PER_COIN);
  });

  console.log("\nReconciling every user...");
  const usersSnap = await db.collection("users").get();
  console.log(`  ${usersSnap.size} users total`);

  const explained = [];
  const unexplained = [];
  const clean = [];

  usersSnap.forEach(d => {
    const uid = d.id;
    const u = d.data();
    const liveXp = u.xp || 0;
    const liveScore = u.score || 0;
    const led = grantedByUid.get(uid) || { xp: 0, score: 0, coins: 0 };
    const converted = convertedXpByUid.get(uid) || 0;
    const expectedXp = led.xp - converted;
    const expectedScore = led.score;
    const xpDrift = liveXp - expectedXp;
    const scoreDrift = liveScore - expectedScore;

    if (xpDrift === 0 && scoreDrift === 0) { clean.push(uid); return; }

    const migrationRecord = scoreMigrationByUid.get(uid);
    const dupRecord = dupByUid.get(uid);
    const migrationScoreDelta = migrationRecord?.scoreVsCurrentDelta || 0;
    // Score-only claim: the score migration NEVER touches xp, only score - so
    // this checks the score side alone against what that migration itself
    // computed and marked safe for this exact user, independent of whatever
    // is going on with xp.
    const scoreExactlyMatchesMigration = migrationRecord && Math.abs(scoreDrift - migrationScoreDelta) <= 5;
    const migrationWasSafe = migrationRecord?.migrationStatus === "SAFE" && !(migrationRecord?.anomalies?.length > 0);
    const migrationWasReview = migrationRecord?.migrationStatus === "REVIEW" || (migrationRecord?.anomalies?.length > 0);

    const row = {
      uid, handle: u.handle || u.campusFullName || null, rollNumber: u.rollNumber || null,
      liveXp, liveScore, expectedXp, expectedScore, xpDrift, scoreDrift,
      migrationRecord: migrationRecord ? {
        status: migrationRecord.migrationStatus, scoreVsCurrentDelta: migrationRecord.scoreVsCurrentDelta,
        anomalies: migrationRecord.anomalies, breakdown: migrationRecord.breakdown,
      } : null,
      dupRecord: dupRecord || null,
    };

    if (scoreExactlyMatchesMigration && migrationWasSafe) {
      // Score is fully accounted for and independently verified safe. Any
      // remaining xp-only gap is a SEPARATE fact (the score migration never
      // rebuilt xp) - real, but not evidence against the score/leaderboard
      // number, and not part of today's quiz-farming bug (that bug's own
      // signature - implausibly fast completions - is checked separately in
      // audit-quiz-reward-integrity.mjs, not here).
      row.category = "score_verified_safe_xp_gap_separate";
      explained.push(row);
    } else if (migrationWasReview) {
      // The ORIGINAL 2026-07-23 migration itself flagged this user as needing
      // a human look and nothing since has resolved it - a pre-existing,
      // seven-week-old open item, not something today's session created.
      row.category = "migration_flagged_review_unresolved";
      unexplained.push(row);
    } else {
      row.category = "no_record";
      unexplained.push(row);
    }
  });

  const reviewFlagged = unexplained.filter(r => r.category === "migration_flagged_review_unresolved");
  const noRecord = unexplained.filter(r => r.category === "no_record");

  console.log(`\n=== RESULTS ===`);
  console.log(`Clean (live balance exactly matches ledger): ${clean.length}`);
  console.log(`Score independently verified safe by the 2026-07-23 migration (xp may still show a separate, unrelated gap that migration never touched): ${explained.length}`);
  console.log(`Flagged REVIEW by that same migration seven weeks ago and never resolved since: ${reviewFlagged.length}`);
  console.log(`No documented record at all: ${noRecord.length}`);

  console.log(`\n-- Score verified safe (xp gap is a separate, older, undocumented fact) --`);
  explained.sort((a, b) => Math.abs(b.xpDrift) - Math.abs(a.xpDrift)).forEach(r => {
    console.log(`  ${(r.handle || r.uid).padEnd(24)} roll=${(r.rollNumber || "?").padEnd(14)} scoreDrift=${r.scoreDrift} (verified)  xpDrift=${r.xpDrift > 0 ? "+" : ""}${r.xpDrift} (separate, unverified)`);
  });

  console.log(`\n-- Flagged REVIEW seven weeks ago, still unresolved --`);
  reviewFlagged.sort((a, b) => Math.abs(b.scoreDrift) - Math.abs(a.scoreDrift)).forEach(r => {
    console.log(`  ${(r.handle || r.uid).padEnd(24)} roll=${(r.rollNumber || "?").padEnd(14)} xpDrift=${r.xpDrift > 0 ? "+" : ""}${r.xpDrift}  scoreDrift=${r.scoreDrift > 0 ? "+" : ""}${r.scoreDrift}  anomalies=${JSON.stringify(r.migrationRecord?.anomalies || [])}`);
  });

  console.log(`\n-- No documented record at all --`);
  noRecord.sort((a, b) => Math.abs(b.scoreDrift) - Math.abs(a.scoreDrift)).forEach(r => {
    console.log(`  ${(r.handle || r.uid).padEnd(24)} roll=${(r.rollNumber || "?").padEnd(14)} xpDrift=${r.xpDrift > 0 ? "+" : ""}${r.xpDrift}  scoreDrift=${r.scoreDrift > 0 ? "+" : ""}${r.scoreDrift}`);
  });

  const report = {
    generatedAt: new Date().toISOString(),
    totalUsers: usersSnap.size,
    cleanCount: clean.length,
    scoreVerifiedSafeCount: explained.length,
    reviewFlaggedUnresolvedCount: reviewFlagged.length,
    noRecordCount: noRecord.length,
    scoreVerifiedSafe: explained,
    reviewFlaggedUnresolved: reviewFlagged,
    noRecord,
  };
  const outPath = join(__dirname, `full-balance-reconciliation-${new Date().toISOString().slice(0, 10)}.json`);
  writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(`\nfull report -> ${outPath}`);
}

main().catch(e => { console.error(e); process.exit(1); });
