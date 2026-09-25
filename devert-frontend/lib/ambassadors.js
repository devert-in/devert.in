// Campus Ambassador programme.
//
// The growth thesis, since it explains every design choice below: DeVert's
// cheapest path into a college is a student who already goes there. One
// ambassador brings a cohort, a cohort makes the institution deal obvious, and an
// institution deal is worth orders of magnitude more than the individual
// subscriptions it replaces. So this is deliberately B2B2C plumbing, not an
// affiliate scheme bolted onto a consumer product.
//
// Trust boundaries, all three of which matter:
//
// 1. An application is a REQUEST, never a grant. ambassadors/{uid}.status starts
//    at "pending" and only an admin moves it. A student cannot appoint themselves
//    the representative of their college.
// 2. Referral attribution is write-once. referrals/{referredUid} can be created
//    but never updated by a client, so a later ambassador cannot steal an earlier
//    one's signup, and a user cannot re-attribute themselves for a bonus.
// 3. Rewards are NOT computed here. Counting referrals client-side would make
//    payout arithmetic a client concern, and this codebase already pays real INR
//    out of coin balances - see the bounded-delta warnings in CLAUDE.md. Any
//    money movement stays server-side.

import { db } from "@/lib/firebase";
import {
  doc, getDoc, setDoc, collection, query, where, getDocs, onSnapshot,
  serverTimestamp, limit,
} from "firebase/firestore";

export const AMBASSADOR_STATUS = Object.freeze({
  PENDING: "pending",
  ACTIVE: "active",
  REJECTED: "rejected",
  SUSPENDED: "suspended",
});

// What an ambassador actually gets. Kept as data so the apply page and any future
// admin copy cannot drift from each other. `live: false` marks a promise that is
// not built yet - the page labels those "coming soon" rather than presenting
// them as something an approved ambassador can use today.
export const AMBASSADOR_PERKS = Object.freeze([
  // Real: lib/useTier.js resolves an ACTIVE ambassador to Pro.
  { text: "DeVert Pro free for as long as you are active", live: true },
  { text: "Your own referral code, and credit for every signup that uses it", live: true },
  { text: "First in line when your college becomes a paid campus", live: true },
  { text: "Run proctored contests for your own college", live: false },
  { text: "Named on your college's Campus page once it goes live", live: false },
]);

// A referral counts for a NEW account only. Without this, an existing user who
// merely clicked an ambassador's link got credited as that ambassador's
// "signup". Checked client-side in components/referral-capture.jsx against the
// Auth account's creation time - display-only credit, see the note on rewards
// at the top of this file.
export const REFERRAL_NEW_ACCOUNT_WINDOW_MS = 24 * 60 * 60 * 1000;

// Derived from the display name, not random: a code a student can say out loud in
// a classroom gets shared, and a UUID does not. Collisions are resolved by the
// caller appending digits, not by silently overwriting.
export function suggestReferralCode(displayName, uid) {
  const base = (displayName || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 8);
  const tail = (uid || "").slice(0, 4).toUpperCase();
  return (base || "DEVERT") + tail;
}

export function normalizeReferralCode(code) {
  return (code || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export async function fetchMyAmbassador(uid) {
  if (!uid) return null;
  const snap = await getDoc(doc(db, "ambassadors", uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export function watchMyAmbassador(uid, cb) {
  if (!uid) { cb(null); return () => {}; }
  return onSnapshot(
    doc(db, "ambassadors", uid),
    (s) => cb(s.exists() ? { id: s.id, ...s.data() } : null),
    () => cb(null),
  );
}

/**
 * Submits an application. Idempotent-ish: an existing application is returned
 * rather than overwritten, so a double-click cannot reset a decision an admin has
 * already made.
 */
export async function applyForAmbassador(uid, {
  collegeName, city, referralCode, displayName, email, whyMe, expectedReach,
}) {
  if (!uid) throw new Error("Sign in to apply.");

  const existing = await fetchMyAmbassador(uid);
  if (existing) return existing;

  const code = (normalizeReferralCode(referralCode) || suggestReferralCode(displayName, uid)).slice(0, 20);

  // The code index is a separate doc keyed by the code itself - that is what
  // makes "look up an ambassador by their code at signup" a single read instead
  // of a query, and what makes uniqueness expressible as a create-if-absent.
  //
  // Claimed BEFORE the application is written, and retried on a clash. The
  // first version wrote the application first and the index second, with one
  // unchecked random suffix on a clash: if that suffix was also taken, the
  // index write was denied (firestore.rules allows no client update) AFTER the
  // application already carried the code - an ambassador approved with a code
  // that resolved to nobody, crediting zero signups forever.
  const finalCode = await claimReferralCode(uid, code);

  const payload = {
    uid,
    displayName: displayName || "",
    email: email || "",
    collegeName: (collegeName || "").trim(),
    city: (city || "").trim(),
    whyMe: (whyMe || "").trim().slice(0, 1000),
    expectedReach: Number(expectedReach) || 0,
    referralCode: finalCode,
    status: AMBASSADOR_STATUS.PENDING,
    appliedAt: serverTimestamp(),
  };

  await setDoc(doc(db, "ambassadors", uid), payload);
  return { id: uid, ...payload };
}

// Create-if-absent on referral_codes/{code}. A code already pointing at this
// uid (a retried submit) is reused; one owned by someone else gets a numeric
// suffix and another try. A lost race surfaces as permission-denied - the
// rules refuse the update a second writer's setDoc turns into - so that is
// treated as "taken" too.
async function claimReferralCode(uid, base) {
  for (let attempt = 0; attempt < 6; attempt++) {
    const candidate = attempt === 0 ? base : `${base}${Math.floor(Math.random() * 900 + 100)}`;
    const ref = doc(db, "referral_codes", candidate);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      if (snap.data().uid === uid) return candidate;
      continue;
    }
    try {
      await setDoc(ref, { uid, code: candidate, createdAt: serverTimestamp() });
      return candidate;
    } catch (err) {
      if (err?.code !== "permission-denied") throw err;
    }
  }
  throw new Error("Could not reserve a referral code - try a different one.");
}

export async function fetchAmbassadorByCode(code) {
  const norm = normalizeReferralCode(code);
  if (!norm) return null;
  const snap = await getDoc(doc(db, "referral_codes", norm));
  if (!snap.exists()) return null;
  const uid = snap.data().uid;
  const amb = await getDoc(doc(db, "ambassadors", uid));
  // Only an ACTIVE ambassador's code attributes anything - a pending or
  // suspended one must not silently accrue credit.
  if (!amb.exists() || amb.data().status !== AMBASSADOR_STATUS.ACTIVE) return null;
  return { id: amb.id, ...amb.data() };
}

/**
 * Records that `referredUid` arrived via a code. Write-once by rule: if a doc
 * already exists this returns it untouched, so attribution cannot be rewritten
 * later by anyone.
 */
export async function attributeReferral(referredUid, code) {
  if (!referredUid) return null;
  const existing = await getDoc(doc(db, "referrals", referredUid));
  if (existing.exists()) return { id: existing.id, ...existing.data() };

  const amb = await fetchAmbassadorByCode(code);
  if (!amb) return null;
  if (amb.uid === referredUid) return null; // self-referral

  const payload = {
    referredUid,
    ambassadorUid: amb.uid,
    referralCode: amb.referralCode,
    collegeName: amb.collegeName || "",
    createdAt: serverTimestamp(),
  };
  await setDoc(doc(db, "referrals", referredUid), payload);
  return { id: referredUid, ...payload };
}

// Ambassador's own dashboard number. Counting on the client is fine here because
// it is DISPLAY only - nothing is paid out from it. Any reward must be computed
// server-side against the same collection.
export function watchMyReferralCount(ambassadorUid, cb) {
  if (!ambassadorUid) { cb(0); return () => {}; }
  return onSnapshot(
    query(collection(db, "referrals"), where("ambassadorUid", "==", ambassadorUid)),
    (snap) => cb(snap.size),
    () => cb(0),
  );
}

// Admin review queue. Newest first, sorted HERE rather than with orderBy():
// where(status) + orderBy(appliedAt) needs a composite index, and the queue
// sat broken behind "The query requires an index" until one was deployed.
// A single-field equality needs none, and one status's applications are few.
export async function fetchAmbassadorApplications(status = AMBASSADOR_STATUS.PENDING, max = 200) {
  const snap = await getDocs(query(
    collection(db, "ambassadors"),
    where("status", "==", status),
    limit(max),
  ));
  const ms = (t) => (t?.toMillis ? t.toMillis() : 0);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => ms(b.appliedAt) - ms(a.appliedAt));
}
