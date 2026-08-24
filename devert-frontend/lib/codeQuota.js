// Daily CodeLab run quota.
//
// Read the limitation before relying on this: it is ADVISORY, not enforcement.
// lib/codelab.js's runCode() posts to devert-backend's /api/coding/run with no ID
// token at all, so the backend cannot tell whose run it is and cannot refuse one.
// Anyone bypassing the UI - or simply hitting that URL directly, which today
// needs no account whatsoever - gets unlimited runs.
//
// What this DOES buy, which is still worth having:
//   - an honest limit for the ~all users who use the product normally
//   - a real usage signal, so "is 15/day the right number" becomes answerable
//   - the ledger the backend will read once it verifies tokens, so the schema
//     does not have to change when enforcement lands
//
// The fix is a backend change: verify the Firebase ID token on /api/coding/run
// (submitCode already does exactly this) and check this same document. Until
// then, do not describe this as a paywall in user-facing copy - describe it as a
// fair-use limit, because that is what it is.

import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, updateDoc, increment, serverTimestamp, onSnapshot } from "firebase/firestore";
import { FREE_DAILY_CODE_RUNS } from "@/lib/entitlements";

// IST, deliberately - the entire user base is in one timezone and a UTC day
// boundary would reset everyone's quota at 5:30am local, mid-study-session.
export function istDateId(now = new Date()) {
  const ist = new Date(now.getTime() + (5 * 60 + 30) * 60 * 1000);
  return ist.toISOString().slice(0, 10);
}

function quotaRef(uid, dateId = istDateId()) {
  return doc(db, "code_runs", uid, "daily", dateId);
}

export async function fetchRunsUsed(uid, dateId = istDateId()) {
  if (!uid) return 0;
  try {
    const snap = await getDoc(quotaRef(uid, dateId));
    return snap.exists() ? (snap.data().count || 0) : 0;
  } catch {
    // A failed read must not block a run - failing open here is right, because
    // the alternative is denying a paying-or-free user their work over a
    // transient network error on an advisory counter.
    return 0;
  }
}

export function watchRunsUsed(uid, cb, dateId = istDateId()) {
  if (!uid) { cb(0); return () => {}; }
  return onSnapshot(
    quotaRef(uid, dateId),
    (snap) => cb(snap.exists() ? (snap.data().count || 0) : 0),
    () => cb(0),
  );
}

/**
 * Records one run. Returns the new count.
 *
 * create-then-update rather than a single set({merge}) with increment(), because
 * the rules deliberately allow only two shapes: a create at exactly 1, and an
 * update of exactly +1. That is what makes the counter unforgeable from devtools;
 * a blanket merge would need a looser rule.
 */
export async function recordRun(uid) {
  if (!uid) return 0;
  const ref = quotaRef(uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, { count: 1, updatedAt: serverTimestamp() });
    return 1;
  }
  await updateDoc(ref, { count: increment(1), updatedAt: serverTimestamp() });
  return (snap.data().count || 0) + 1;
}

export function runsRemaining(used, isPro) {
  if (isPro) return Infinity;
  return Math.max(0, FREE_DAILY_CODE_RUNS - (used || 0));
}

export function quotaExhausted(used, isPro) {
  return !isPro && (used || 0) >= FREE_DAILY_CODE_RUNS;
}
