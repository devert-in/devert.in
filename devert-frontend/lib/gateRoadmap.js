// GATE Roadmap - a fixed, dated day-by-day study plan (Day 1 = 15 Aug 2026)
// layered on top of the existing GATE catalog (gatePapers/{paperId}/subjects/
// {subjectId}/topics/{topicId}). A roadmap day never duplicates lesson
// content - it only REFERENCES real topicIds that already exist in that
// paper's tree (see topicIds below), the same way lib/gate.js's own
// recommendNextTopic() points at existing topics rather than copying them.
//
// Two-collection split, same reasoning as every other GATE progress pair:
//   - gate_roadmap_days: the STATIC plan. Identical for every student on a
//     given paper, admin-authored/seeded, world-readable-when-published -
//     same shape as gatePapers itself (see firestore.rules).
//   - gate_roadmap_progress: the PER-STUDENT completion state, one doc per
//     (uid, paperId), same id/monotonicity pattern as gate_progress's
//     completedTopicIds (see completeRoadmapDay below).
//
// "Locked" here is CALENDAR-DATE based, not completion-based - mirroring
// campus-daily-learning.jsx's dayStatus() (the one existing "locked" pattern
// in Campus), not inventing a new kind of gate. A roadmap day opens once its
// date arrives, regardless of whether earlier days were finished - the same
// paced-program framing Daily Learning already uses, since a completion-gated
// lock would strand a student who missed a day behind their own calendar.
import { db } from "@/lib/firebase";
import {
  collection, doc, getDoc, getDocs, query, where, orderBy,
  serverTimestamp, arrayUnion, runTransaction,
} from "firebase/firestore";
import { grantRewards, isAlreadyGranted } from "@/lib/rewards";

// Day 1 of the roadmap, IST. Every other day's date is derived from this one
// constant plus its dayNumber - see roadmapDateForDay() - so the whole plan
// shifts by editing one line if the program's start date ever changes.
export const ROADMAP_START_DATE = "2026-08-15";
export const TOTAL_ROADMAP_DAYS = 139; // 15 Aug 2026 -> 31 Dec 2026 inclusive

export function roadmapDateForDay(dayNumber) {
  // Deliberately UTC (no +05:30): this only ever does calendar-day
  // arithmetic on ROADMAP_START_DATE, never a real-time comparison, and
  // toISOString() reads back the UTC calendar date - stamping the instant
  // at IST midnight instead would read back as the PREVIOUS day everywhere
  // downstream (18:30 UTC the day before). currentRoadmapDayNumber() below
  // does compare against a real `now`, so it correctly keeps +05:30.
  const start = new Date(`${ROADMAP_START_DATE}T00:00:00Z`);
  const d = new Date(start.getTime() + (dayNumber - 1) * 86400000);
  return d.toISOString().slice(0, 10);
}

// Whole-plan day count elapsed since the start date, IST, clamped to
// [1, TOTAL_ROADMAP_DAYS] - "Day X / 139" on the roadmap header.
export function currentRoadmapDayNumber(now = new Date()) {
  const start = new Date(`${ROADMAP_START_DATE}T00:00:00+05:30`);
  const diffDays = Math.floor((now.getTime() - start.getTime()) / 86400000) + 1;
  return Math.max(1, Math.min(TOTAL_ROADMAP_DAYS, diffDays));
}

export function roadmapDayId(paperId, dayNumber) {
  return `${paperId}_${dayNumber}`;
}

export function roadmapProgressId(uid, paperId) {
  return `${uid}_${paperId}`;
}

// All published days for a paper, in day order. Distinct from every other
// GATE fetch in this file's sibling modules (fetchProgress etc.) in that this
// one CAN safely be a collection query, not a per-id getDoc loop -
// gate_roadmap_days is a shared, admin-authored catalog (like gatePapers),
// not a per-user doc keyed by a uid the rules can't statically filter on.
export async function fetchRoadmapDays(paperId) {
  const snap = await getDocs(query(
    collection(db, "gate_roadmap_days"),
    where("paperId", "==", paperId),
    where("status", "==", "published"),
    orderBy("dayNumber"),
  ));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function fetchRoadmapProgress(uid, paperId) {
  if (!uid) return null;
  const snap = await getDoc(doc(db, "gate_roadmap_progress", roadmapProgressId(uid, paperId)));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// "locked" / "done" / "current" / "open" - current is today's actual day
// number, not just "not locked and not done", so the UI can highlight it
// distinctly from every other already-open day.
export function roadmapDayStatus(day, { completedDayNumbers, todayDayNumber }) {
  if (day.dayNumber > todayDayNumber) return "locked";
  if ((completedDayNumbers || []).includes(day.dayNumber)) return "done";
  if (day.dayNumber === todayDayNumber) return "current";
  return "open";
}

// Grades and records ONE roadmap day, exactly once, ever - same idempotency
// shape as lib/gate.js's completeDay(): read-check-inside-the-transaction,
// never trust a client's own "have I already done this" render state.
// activityId is unique per (paperId, dayNumber), so the create-only
// reward_grants ledger is a second, independent backstop beyond the
// monotonic completedDayNumbers array below (identical defense-in-depth to
// every other reward path in this codebase).
export async function completeRoadmapDay({ uid, paperId, dayNumber, xpReward = 15, coinReward = 6 }) {
  if (!uid) return { alreadyDone: true };
  const ref = doc(db, "gate_roadmap_progress", roadmapProgressId(uid, paperId));
  const activityType = "gate_roadmap_day";
  const activityId = `${paperId}_day${dayNumber}`;

  return runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const existing = snap.exists() ? snap.data() : null;
    const alreadyDone = !!existing?.completedDayNumbers?.includes(dayNumber);
    const alreadyPaid = alreadyDone || await isAlreadyGranted(tx, uid, activityType, activityId);

    tx.set(ref, {
      uid,
      paperId,
      completedDayNumbers: arrayUnion(dayNumber),
      lastCompletedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });

    if (!alreadyPaid) {
      grantRewards(uid, {
        xpReward, coinReward, scoreReward: xpReward,
        transactionType: "gate_roadmap_day_completed",
        activityType, activityId, sourceModule: "gate",
      }, tx);
    }
    return { alreadyDone: alreadyPaid };
  });
}
