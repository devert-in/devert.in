"use client";

// Self-serve free trial for DeVert Campus Individual Premium.
//
// Distinct from lib/payments.js's subscriptions/{uid} (that's the separate
// DeVert Pro product - individual proctored-assessment/CodeLab-capacity
// entitlement, unrelated pricing and features). Campus Premium has no
// payment integration at all yet, so this grants a real, time-boxed trial
// instead of a purchase - one per account, via startCampusPremiumTrial
// (Cloud Function, Admin SDK) rather than a client-writable Firestore
// field: firestore.rules denies every
// client write to campus_premium_trials/{uid} for the same reason it denies
// subscriptions/{uid} - "am I trialling" must not be a field the visitor
// sets about themselves.

import { functions, db, httpsCallable, doc, onSnapshot } from "@/lib/firebase";

export const CAMPUS_TRIAL_DAYS = 11;

export function watchCampusTrial(uid, cb) {
  if (!uid) { cb(null); return () => {}; }
  return onSnapshot(
    doc(db, "campus_premium_trials", uid),
    (snap) => cb(snap.exists() ? { id: snap.id, ...snap.data() } : null),
    () => cb(null),
  );
}

// Pure - an expired-but-present doc must not read as active just because
// status says so; the function sets status once and never revisits it.
export function isCampusTrialActive(trial, now = Date.now()) {
  if (!trial || trial.status !== "active") return false;
  const until = trial.expiresAtMs || trial.expiresAt?.toMillis?.() || 0;
  return until > now;
}

export async function startCampusTrial() {
  const res = await httpsCallable(functions, "startCampusPremiumTrial")();
  return res.data;
}
