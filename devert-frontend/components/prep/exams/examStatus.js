// Shared exam-window helpers — pure functions, no Firebase/React imports.
// Used by /prep/exams (list), /prep/exams/take, /prep/exams/review and
// /prep/analytics so status logic is computed exactly once.

import { COLORS } from "@/lib/prep/constants";

/** Firestore Timestamp | Date | number | null -> epoch ms | null */
export function toMillis(v) {
  if (v == null) return null;
  if (typeof v.toMillis === "function") return v.toMillis();
  if (v instanceof Date) return v.getTime();
  if (typeof v === "number") return v;
  return null;
}

/**
 * status: 'upcoming' | 'live' | 'ended' | 'unknown'
 * unknown = exam is missing startsAt/endsAt (shouldn't happen for published
 * exams, but keeps the UI honest instead of crashing).
 */
export function computeExamStatus(exam, nowMs = Date.now()) {
  const startsAt = toMillis(exam?.startsAt);
  const endsAt = toMillis(exam?.endsAt);
  if (startsAt == null || endsAt == null) {
    return { status: "unknown", label: "UNKNOWN", color: "rgba(255,255,255,0.3)", startsAt, endsAt };
  }
  if (nowMs < startsAt) {
    return { status: "upcoming", label: "UPCOMING", color: COLORS.cyan, startsAt, endsAt };
  }
  if (nowMs <= endsAt) {
    return { status: "live", label: "LIVE", color: COLORS.green, startsAt, endsAt };
  }
  return { status: "ended", label: "ENDED", color: "rgba(255,255,255,0.35)", startsAt, endsAt };
}

/** true if the exam is open to every class group, or the student's group is targeted. */
export function cohortAllowed(exam, classGroup) {
  const groups = Array.isArray(exam?.classGroups) ? exam.classGroups : [];
  if (groups.length === 0) return true;
  return !!classGroup && groups.includes(classGroup);
}

export function fmtDateTime(ms) {
  if (ms == null) return "--";
  try {
    return new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(ms));
  } catch {
    return new Date(ms).toLocaleString();
  }
}
