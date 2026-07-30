// Reverses XP->Coin conversions made BEFORE the weekly-leaderboard-lock
// policy existed (requirement: reward conversion should have been locked
// until an admin announces the week's leaderboard, but wasn't, since that
// feature didn't exist until now).
//
// *** REAL-MONEY SAFETY SCOPE - READ BEFORE USING --execute ***
// Coins are convertible to real INR payouts (see app/wallet/page.jsx,
// payout_requests). This script will NEVER propose reversing a conversion
// whose resulting coins may have already left the platform as an APPROVED
// payout (real money already sent to a student's bank account) - asking a
// student to return money that's already been paid out is a business/legal
// decision, not something an automated migration should ever do. A
// conversion is only ever considered reversible if BOTH hold:
//   1. The student has ZERO approved payout_requests, ever (nothing has left
//      the platform as real money for this student at all), AND
//   2. Their CURRENT pulseCoins balance is >= the coins from that specific
//      conversion (a conservative signal the coins are very likely still
//      sitting unspent - this is a heuristic, not a precise per-coin trace,
//      since coins aren't individually tagged by origin).
// Every conversion that fails either check is reported under
// "excludedFromReversal" with the reason, NEVER auto-reversed, regardless of
// --execute.
//
// DRY RUN BY DEFAULT.
// Usage:
//   node scripts/migrate-reverse-premature-conversions.mjs             (report only)
//   node scripts/migrate-reverse-premature-conversions.mjs --execute   (reverses ONLY
//     the conversions that pass both safety checks above, notifies affected students)
import admin from "firebase-admin";
import { readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(join(__dirname, "service-account.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const EXECUTE = process.argv.includes("--execute");
const XP_PER_COIN = 5;

async function main() {
  console.log(EXECUTE
    ? "Running in EXECUTE mode - WILL reverse ONLY conversions that pass both real-money safety checks (see header comment)."
    : "Running in DRY RUN mode - no writes will be made.");
  console.log("");

  console.log("Finding students with at least one approved payout (real money already sent - excluded entirely)...");
  const approvedPayoutUids = new Set();
  const payoutsSnap = await db.collection("payout_requests").where("status", "==", "approved").get();
  payoutsSnap.forEach(d => approvedPayoutUids.add(d.data().uid));
  console.log(`  ${approvedPayoutUids.size} student(s) have at least one approved payout - their conversions are never touched by this script.`);

  console.log("Fetching all xp_convert conversion records...");
  const conversionsSnap = await db.collection("coin_transactions").where("type", "==", "xp_convert").get();

  console.log("Fetching current coin balances...");
  const earningsSnap = await db.collection("user_earnings").get();
  const pulseCoinsByUid = new Map();
  earningsSnap.forEach(d => pulseCoinsByUid.set(d.id, d.data().pulseCoins || 0));

  let scanned = 0;
  let reversible = 0;
  let excluded = 0;
  let xpRestored = 0;
  let coinsRemoved = 0;
  const reversibleList = [];
  const excludedList = [];

  for (const d of conversionsSnap.docs) {
    scanned++;
    const data = d.data();
    const uid = data.uid;
    const coinsFromThisConversion = data.amount || 0;
    const xpToRestore = coinsFromThisConversion * XP_PER_COIN;
    const currentBalance = pulseCoinsByUid.get(uid) || 0;

    if (approvedPayoutUids.has(uid)) {
      excluded++;
      excludedList.push({ txId: d.id, uid, coins: coinsFromThisConversion, reason: "student has at least one approved payout - real money may already have moved" });
      continue;
    }
    if (currentBalance < coinsFromThisConversion) {
      excluded++;
      excludedList.push({ txId: d.id, uid, coins: coinsFromThisConversion, reason: `current balance (${currentBalance}) is less than this conversion's coins - likely already spent/withdrawn elsewhere` });
      continue;
    }

    reversible++;
    xpRestored += xpToRestore;
    coinsRemoved += coinsFromThisConversion;
    reversibleList.push({ txId: d.id, uid, coinsToRemove: coinsFromThisConversion, xpToRestore });
    // Decrement the tracked balance as we go, so a student with MULTIPLE
    // conversions doesn't have each one independently pass the "balance
    // covers it" check against the same, un-decremented current balance.
    pulseCoinsByUid.set(uid, currentBalance - coinsFromThisConversion);
  }

  console.log(`Conversions scanned: ${scanned}`);
  console.log(`Reversible (passes both safety checks): ${reversible}`);
  console.log(`Excluded (real-money-risk or already-spent): ${excluded}`);
  console.log(`XP ${EXECUTE ? "restored" : "that would be restored"}: ${xpRestored}`);
  console.log(`Coins ${EXECUTE ? "removed" : "that would be removed"}: ${coinsRemoved}`);
  console.log("");

  if (EXECUTE) {
    console.log("Reversing eligible conversions and notifying affected students...");
    const affectedUids = new Set();
    for (const r of reversibleList) {
      await db.runTransaction(async (tx) => {
        tx.update(db.collection("users").doc(r.uid), {
          xp: admin.firestore.FieldValue.increment(r.xpToRestore),
        });
        tx.set(db.collection("user_earnings").doc(r.uid), {
          pulseCoins: admin.firestore.FieldValue.increment(-r.coinsToRemove),
          totalCoins: admin.firestore.FieldValue.increment(-r.coinsToRemove),
        }, { merge: true });
        tx.set(db.collection("coin_transactions").doc(), {
          uid: r.uid, type: "xp_convert_reversed_policy_change", amount: -r.coinsToRemove,
          relatedTxId: r.txId, createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      });
      affectedUids.add(r.uid);
    }
    for (const uid of affectedUids) {
      await db.collection("notifications").add({
        targetUid: uid, type: "policy_change",
        title: "A previous reward conversion was reversed",
        body: "Your previous reward conversion has been reversed because weekly leaderboard finalization is now required before reward redemption. Your XP has been restored.",
        fromUid: "system", createdAt: admin.firestore.FieldValue.serverTimestamp(),
      }).catch(() => {});
    }
    console.log(`Completed successfully. Notified ${affectedUids.size} student(s).`);
  } else {
    console.log("Dry run complete - no writes made. Review excludedFromReversal in the report carefully before ever running --execute.");
  }

  const report = {
    mode: EXECUTE ? "execute" : "dry-run",
    generatedAt: new Date().toISOString(),
    conversionsScanned: scanned,
    reversible,
    excluded,
    xpRestored,
    coinsRemoved,
    reversibleList,
    excludedFromReversal: excludedList,
  };
  const reportPath = join(__dirname, `reverse-premature-conversions-${EXECUTE ? "applied" : "dryrun"}-${new Date().toISOString().slice(0, 10)}.json`);
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`Full report written to ${reportPath}`);
}

main().catch(e => { console.error(e); process.exit(1); });
