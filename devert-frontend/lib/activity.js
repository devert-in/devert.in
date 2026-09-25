import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

// Real, non-fabricated activity tracking - the one piece of infrastructure
// that genuinely didn't exist anywhere in this app before (see the earlier
// audit this session: "no login/session tracking beyond a single
// lastActiveAt timestamp"). Design constraint: this project has no Cloud
// Functions (blocked on Firebase billing reactivation, same blocker noted
// throughout lib/institutions.js/lib/programming.js), so there's no way to
// run a nightly job that rolls up raw event logs into daily/weekly/monthly
// aggregates. Storing one document PER DAY PER STUDENT (updated live via
// merge writes while they're actually using the app) is the only shape that
// stays cheap to read later without server-side aggregation - a classroom's
// "active today" query is one getDoc per student for one known date, not a
// scan over a growing raw-event collection.
//
// "Active minutes" is a heartbeat-based ESTIMATE (pingCount * PING_INTERVAL_MIN),
// not a measured continuous duration - this is the same heuristic real
// analytics tools use for "engaged time" when they don't instrument every
// keystroke. It's always presented as an estimate, never as exact wall-clock
// session length.
export const PING_INTERVAL_MIN = 1;

// IST (UTC+5:30) to match GradingService.java's own streak-day boundary - a
// student's "day" for activity purposes should be the same day their
// streak/XP logic already uses, not the browser's local timezone. Takes an
// explicit date (pure) so it can convert an arbitrary submission timestamp,
// not just "now" - todayIST() below is the only caller that supplies `new
// Date()` (the one legitimately impure spot, isolated to a single line).
export function dateToISTString(date) {
  // toISOString() is always UTC, so the shift is exactly +5:30 - never the
  // browser's own offset. Adding getTimezoneOffset() here (as this used to)
  // cancelled the +5:30 in every Indian browser, returning the UTC date: a
  // day behind IST between 00:00 and 05:30 IST, and out of step with
  // firestore.rules' istTodayStr() (same-day reward and streak rules).
  return new Date(date.getTime() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function todayIST() {
  return dateToISTString(new Date());
}

// The UTC instant corresponding to 00:00:00 IST on the given "YYYY-MM-DD"
// calendar date - IST is UTC+5:30, so IST midnight is 18:30 UTC the previous
// day. Used to build a `createdAt >= X` Firestore range boundary that lines
// up with the same IST calendar day fetchDayLeaderboard/todayIST already use,
// rather than accidentally splitting a day at the UTC boundary instead.
export function istMidnightUtcMillis(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return Date.UTC(y, m - 1, d) - 5.5 * 3600 * 1000;
}

function docId(uid, date) { return `${uid}_${date}`; }

// Called once on mount and then on a repeating interval while the tab is
// visible (see the caller in campus-app.jsx). Auto-detects the FIRST ping of
// a given day itself (rather than trusting a caller-tracked flag, which
// would be wrong across multiple open tabs or a session spanning midnight
// IST) by reading the day's doc once and checking whether it already has a
// firstSeenAt - that single read also gives us the current pingCount, so
// this stays one round trip, not two.
export async function pingActivity(uid) {
  if (!uid) return;
  const date = todayIST();
  const ref = doc(db, "user_activity_daily", docId(uid, date));
  const existing = await getDoc(ref).catch(() => null);
  const data = existing?.exists() ? existing.data() : null;
  await setDoc(ref, {
    uid, date,
    ...(data?.firstSeenAt ? {} : { firstSeenAt: serverTimestamp() }),
    lastSeenAt: serverTimestamp(),
    pingCount: (data?.pingCount || 0) + 1,
  }, { merge: true });
}

export async function hasActivityToday(uid) {
  const date = todayIST();
  const snap = await getDoc(doc(db, "user_activity_daily", docId(uid, date))).catch(() => null);
  return !!snap?.exists();
}

export async function fetchActivityDay(uid, date) {
  const snap = await getDoc(doc(db, "user_activity_daily", docId(uid, date))).catch(() => null);
  return snap?.exists() ? snap.data() : null;
}

// One getDoc per (student, date) - deliberately NOT a where("uid","in",...)
// list query. A campus-admin read of another student's activity is gated by
// the same isAdminOfStudent()-style rule check used for Programming/CS Core
// progress elsewhere in this app, and that check breaks under list queries
// (verified against the emulator earlier this session) - individual get()
// reads are the proven-safe shape for this exact access pattern. Classroom
// sizes are small enough (tens of students) that N parallel single-doc
// reads per date is cheap; this does NOT scale to "every student on the
// whole campus" without batching, which no caller here needs.
export async function fetchActivityForStudents(uids, date) {
  const rows = await Promise.all(uids.map(async (uid) => ({ uid, activity: await fetchActivityDay(uid, date) })));
  return rows;
}

// Same per-student, per-date shape, across a range of dates (e.g. the last
// 7 days for a weekly view) - one Promise.all per student, not a single
// giant fan-out, so a slow/missing day for one student doesn't block the
// others' data from resolving.
export async function fetchActivityForStudentsRange(uids, dates) {
  const rows = await Promise.all(uids.map(async (uid) => {
    const days = await Promise.all(dates.map(date => fetchActivityDay(uid, date)));
    return { uid, days: dates.map((date, i) => ({ date, activity: days[i] })) };
  }));
  return rows;
}

export function lastNDatesIST(n) {
  const today = todayIST();
  const [y, m, d] = today.split("-").map(Number);
  const base = Date.UTC(y, m - 1, d);
  return Array.from({ length: n }, (_, i) => {
    const dt = new Date(base - i * 86400000);
    return dt.toISOString().slice(0, 10);
  }).reverse();
}

export { todayIST };
