// Follow-up to scripts/audit-quiz-reward-integrity.mjs's XP reversal.
//
// That script reversed XP for 337 topic-completion grants (12 students) that
// were completed under 15 seconds after the previous one - too fast to have
// plausibly involved reading the lesson or engaging with the quiz. XP was
// clawed back; coins and Score were deliberately left alone at the time,
// since neither is normally reversible (coins are real-money-adjacent, Score
// is rules-enforced as never-decreasing).
//
// On reflection: if the completion itself was fabricated, EVERYTHING it paid
// was fabricated - XP, coins, AND Score alike. This script closes that gap for
// the exact same 337 grants, using the exact per-grant totals already computed
// in scripts/quiz-reward-audit-applied-2026-08-07.json (not re-derived), so
// this stays 1:1 consistent with the XP reversal that already ran.
//
// Score decrease is a genuine, deliberate exception to this app's normal
// invariant (Score never decreases - see firestore.rules' selfScoreWriteSane,
// which blocks this for any CLIENT write; this runs via the Admin SDK, which
// bypasses client rules entirely). This is a one-time correction for grants
// already proven fabricated by timestamp evidence, not a supported general
// operation - every reversal is written to reward_grants as its own
// permanently visible ledger entry, specifically typed apart from the earlier
// XP-only reversal, so this correction is exactly as auditable as the
// original bug.
//
// Coins and score are each floored at the student's CURRENT balance, same as
// the XP reversal already was - a student who converted some of these coins
// to a real payout, or whose score/coins were separately adjusted since, must
// never be driven negative by this.
//
// DRY RUN BY DEFAULT.
// Usage:
//   node scripts/reverse-fast-completion-coins-score.mjs             (report only)
//   node scripts/reverse-fast-completion-coins-score.mjs --execute
import admin from "firebase-admin";
import { readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(join(__dirname, "service-account.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const EXECUTE = process.argv.includes("--execute");
const SOURCE_REPORT = join(__dirname, "quiz-reward-audit-applied-2026-08-07.json");

async function main() {
  const source = JSON.parse(readFileSync(SOURCE_REPORT, "utf8"));
  const perStudent = source.fastCompletions.perStudent;
  console.log(EXECUTE
    ? `EXECUTE MODE - reversing coins + Score for the ${perStudent.length} students already XP-reversed in ${SOURCE_REPORT}`
    : `DRY RUN - no writes. Would reverse coins + Score for ${perStudent.length} students.`);
  console.log("");

  const uids = perStudent.map(s => s.uid);
  const userRefs = uids.map(uid => db.collection("users").doc(uid));
  const earningsRefs = uids.map(uid => db.collection("user_earnings").doc(uid));
  const [userSnaps, earningsSnaps] = await Promise.all([
    db.getAll(...userRefs),
    db.getAll(...earningsRefs),
  ]);

  const rows = [];
  let totalCoinsReversed = 0, totalScoreReversed = 0;

  for (let i = 0; i < perStudent.length; i++) {
    const s = perStudent[i];
    const userSnap = userSnaps[i];
    const earningsSnap = earningsSnaps[i];
    if (!userSnap.exists) { console.log(`  ! ${s.uid} - user doc missing, skipping`); continue; }

    const currentScore = userSnap.data().score || 0;
    const currentCoins = earningsSnap.exists ? (earningsSnap.data().pulseCoins || 0) : 0;
    const currentTotalCoins = earningsSnap.exists ? (earningsSnap.data().totalCoins || 0) : 0;

    const scoreDelta = -Math.min(s.score, currentScore);
    const coinsDelta = -Math.min(s.coins, currentCoins);
    const totalCoinsDelta = -Math.min(s.coins, currentTotalCoins);

    totalCoinsReversed += -coinsDelta;
    totalScoreReversed += -scoreDelta;

    rows.push({
      uid: s.uid,
      handle: userSnap.data().handle || userSnap.data().displayName || null,
      rollNumber: userSnap.data().rollNumber || null,
      campusFullName: userSnap.data().campusFullName || null,
      institutionSlug: userSnap.data().institutionSlug || userSnap.data().institutionId || null,
      grantsReversed: s.grants.length,
      xpAlreadyReversed: s.xp,
      currentScore, scoreDelta, newScore: currentScore + scoreDelta,
      currentCoins, coinsDelta, newCoins: currentCoins + coinsDelta,
      currentTotalCoins, totalCoinsDelta,
      grantIds: s.grants.map(g => g.id),
    });
  }

  console.log("Per-student reversal plan:");
  rows.forEach(r => {
    console.log(`  ${(r.campusFullName || r.handle || r.uid).padEnd(28)} roll=${r.rollNumber || "?"} score ${r.currentScore}->${r.newScore}  coins ${r.currentCoins}->${r.newCoins}`);
  });
  console.log(`\nTotal coins to reverse: ${totalCoinsReversed}`);
  console.log(`Total score to reverse: ${totalScoreReversed}`);

  const report = {
    generatedAt: new Date().toISOString(),
    mode: EXECUTE ? "execute" : "dry-run",
    sourceReport: SOURCE_REPORT,
    totalCoinsReversed, totalScoreReversed,
    students: rows,
  };
  const outPath = join(__dirname, `coins-score-reversal-${EXECUTE ? "applied" : "dryrun"}-${new Date().toISOString().slice(0, 10)}.json`);
  writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(`\nreport -> ${outPath}`);

  if (!EXECUTE) {
    console.log("\nDry run complete. Re-run with --execute to apply.");
    return;
  }

  console.log("\nApplying reversals...");
  for (const r of rows) {
    await db.runTransaction(async (tx) => {
      const userRef = db.collection("users").doc(r.uid);
      const earningsRef = db.collection("user_earnings").doc(r.uid);
      if (r.scoreDelta !== 0) tx.update(userRef, { score: admin.firestore.FieldValue.increment(r.scoreDelta) });
      if (r.coinsDelta !== 0 || r.totalCoinsDelta !== 0) {
        tx.set(earningsRef, {
          pulseCoins: admin.firestore.FieldValue.increment(r.coinsDelta),
          totalCoins: admin.firestore.FieldValue.increment(r.totalCoinsDelta),
        }, { merge: true });
      }
      tx.set(db.collection("reward_grants").doc(`${r.uid}_coins_score_reversal_fastcompletion_${Date.now()}`), {
        uid: r.uid,
        activityType: "coins_score_reversal",
        activityId: `fast_completion_followup_${r.grantsReversed}_grants`,
        xp: 0, coins: r.coinsDelta, score: r.scoreDelta,
        sourceModule: "migration",
        grantedAt: admin.firestore.FieldValue.serverTimestamp(),
        grantedBy: "migration:reverse-fast-completion-coins-score",
        status: "granted",
        note: "One-time correction via Admin SDK for grants already proven fabricated by timestamp evidence (see audit-quiz-reward-integrity.mjs). Not a supported general operation - Score does not otherwise decrease.",
        reversedGrantIds: r.grantIds.slice(0, 200),
      });
    });
  }
  console.log(`Applied coins + score reversal for ${rows.length} students.`);
}

main().catch(e => { console.error(e); process.exit(1); });
