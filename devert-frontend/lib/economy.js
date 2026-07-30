import { db } from "@/lib/firebase";
import { doc, getDoc, collection, addDoc, getDocs, query, where, serverTimestamp, Timestamp } from "firebase/firestore";

export const DEFAULT_ECONOMY = {
  PER_LIKE:      10,
  PER_COMMENT:   25,
  PER_SAVE:      15,
  XP_PER_COIN:   5,     // 5 XP -> 1 coin
  COINS_PER_INR: 200,   // 200 coins = Rs 1
  MIN_PAYOUT:    2000,  // Rs 10 minimum
};

// Mutated in place once loadEconomy() resolves, so every module that imports
// ECONOMY shares the same live values without prop drilling.
export const ECONOMY = { ...DEFAULT_ECONOMY };

let loaded = false;

export async function loadEconomy() {
  if (loaded) return ECONOMY;
  loaded = true;
  try {
    const snap = await getDoc(doc(db, "system", "economy"));
    if (snap.exists()) Object.assign(ECONOMY, snap.data());
  } catch (err) {
    console.error(err);
  }
  return ECONOMY;
}

// One record per coin-earning/spending event, so the Wallet page can show a
// real "today vs lifetime" breakdown instead of just a running total.
export function logCoinTransaction(uid, type, amount) {
  if (!uid || !amount) return;
  addDoc(collection(db, "coin_transactions"), {
    uid, type, amount, createdAt: serverTimestamp(),
  }).catch(() => {});
}

// Real per-event timestamps since a given date, for one student - the
// Classroom Analytics "Active" signal's broadest source: this log already
// covers Daily Learning completions, Programming topic completions, and CS
// Core topic completions (see logCoinTransaction's callers), so a single
// query here catches activity across three modules at once instead of
// querying each separately. Needs its own uid+createdAt composite index
// (the Wallet page's own query deliberately avoids one - see that file's
// comment - this is the one caller where it's worth provisioning). Does NOT
// cover CodeLab/DSA solves (GradingService.java never writes here) or
// Contest rewards (lib/contests.js never calls logCoinTransaction) - those
// need their own signals (see lib/codelab.js's fetchSubmissionDatesForUser).
export async function fetchTransactionDatesForUser(uid, sinceDate) {
  const snap = await getDocs(query(
    collection(db, "coin_transactions"),
    where("uid", "==", uid),
    where("createdAt", ">=", Timestamp.fromDate(sinceDate)),
  ));
  return snap.docs.map(d => d.data().createdAt?.toDate?.()).filter(Boolean);
}
