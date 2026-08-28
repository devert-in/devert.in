// GATE Roadmap - a SELF-PACED day-by-day study plan (139 day-slots) layered
// on top of the existing GATE catalog (gatePapers/{paperId}/subjects/
// {subjectId}/topics/{topicId}). A roadmap day never duplicates lesson
// content - it only REFERENCES real topicIds that already exist in that
// paper's tree (see topicIds below), the same way lib/gate.js's own
// recommendNextTopic() points at existing topics rather than copying them.
//
// Two-collection split, same reasoning as every other GATE progress pair:
//   - gate_roadmap_days: the STATIC plan. Identical for every student on a
//     given paper, admin-authored/seeded, world-readable-when-published -
//     same shape as gatePapers itself (see firestore.rules). Its `date`
//     field is a leftover from the plan's original calendar-locked seeding
//     and is no longer read for gating - kept only as historical metadata.
//   - gate_roadmap_progress: the PER-STUDENT completion state, one doc per
//     (uid, paperId), same id/monotonicity pattern as gate_progress's
//     completedTopicIds (see completeRoadmapDay below). Also carries each
//     student's own `startedAt`, stamped on their first completed day.
//
// SELF-PACED, not calendar-locked: this module originally gated a day open
// by a fixed calendar date (Day 1 = 15 Aug 2026 for every student, via
// ROADMAP_START_DATE). That meant a student ahead of the material had no way
// to move faster, and one who fell behind stayed locked out until the real
// calendar caught up. It's since been converted to track each student's OWN
// startedAt instead - every day is reachable from day 1 onward (no "locked"
// state at all); personalDayNumber()/roadmapPaceStatus() below are purely
// informational pacing signals ("you're 3 days ahead of your own pace"), the
// same "roadmap day never gates on lesson content" model that has always
// applied to topics, just now applied to pace too.
//
// NO REWARDS: completeRoadmapDay deliberately never calls grantRewards -
// same precedent as lib/gate.js's markTopicRevised(). This plan is meant to
// be Learning -> Practice -> PYQs -> Revision -> Testing, not a coin/XP
// source; topic completion elsewhere in GATE (lib/gate.js's completeTopic)
// still rewards normally.
import { db } from "@/lib/firebase";
import {
  collection, doc, getDoc, getDocs, query, where, orderBy,
  serverTimestamp, arrayUnion, runTransaction,
} from "firebase/firestore";

export const TOTAL_ROADMAP_DAYS = 139;

// Days elapsed since a student's OWN startedAt, clamped to [1,
// TOTAL_ROADMAP_DAYS]. No startedAt yet (hasn't completed a first day) reads
// as day 1 - "recommended today" before a student has begun.
export function personalDayNumber(startedAt, now = new Date()) {
  if (!startedAt) return 1;
  const start = startedAt.toDate ? startedAt.toDate() : new Date(startedAt);
  const diffDays = Math.floor((now.getTime() - start.getTime()) / 86400000) + 1;
  return Math.max(1, Math.min(TOTAL_ROADMAP_DAYS, diffDays));
}

// How many days a student's actual completions run ahead of or behind their
// own elapsed-day pace - positive delta = ahead of schedule, negative =
// behind. Purely informational (see module header) - never gates access.
export function roadmapPaceStatus({ startedAt, completedCount, now = new Date() }) {
  if (!startedAt) return { started: false, personalDay: 1, delta: 0 };
  const personalDay = personalDayNumber(startedAt, now);
  return { started: true, personalDay, delta: (completedCount || 0) - personalDay };
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

// "done" / "current" / "open" - no "locked" state (see module header). Every
// day is reachable regardless of personal pace; "current" just highlights
// where a student's own elapsed-day count puts them today.
export function roadmapDayStatus(day, { completedDayNumbers, personalDay }) {
  if ((completedDayNumbers || []).includes(day.dayNumber)) return "done";
  if (day.dayNumber === personalDay) return "current";
  return "open";
}

// Records ONE roadmap day complete, exactly once, ever - same idempotency
// shape as lib/gate.js's completeDay(): read-check-inside-the-transaction,
// never trust a client's own "have I already done this" render state.
// startedAt is stamped only on the first-ever call for this (uid, paperId),
// then left untouched - it anchors personalDayNumber()/roadmapPaceStatus().
// Deliberately does NOT call grantRewards - see module header.
export async function completeRoadmapDay({ uid, paperId, dayNumber }) {
  if (!uid) return { alreadyDone: true };
  const ref = doc(db, "gate_roadmap_progress", roadmapProgressId(uid, paperId));

  return runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const existing = snap.exists() ? snap.data() : null;
    const alreadyDone = !!existing?.completedDayNumbers?.includes(dayNumber);

    tx.set(ref, {
      uid,
      paperId,
      startedAt: existing?.startedAt || serverTimestamp(),
      completedDayNumbers: arrayUnion(dayNumber),
      lastCompletedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });

    return { alreadyDone };
  });
}
