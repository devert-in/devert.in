import { db } from "@/lib/firebase";
import { doc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";

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
