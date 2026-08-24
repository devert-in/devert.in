// Real, non-fabricated per-classroom aggregation for the Classroom Analytics
// dashboard (campus-classrooms.jsx's ClassroomDashboard). Every number here
// is read from data that already exists elsewhere - this file only joins and
// shapes it for one Department+Year+Section cohort at a time. Deliberately
// does NOT invent attendance, contest Elo/rating, or session durations with
// no underlying collection.
import { db } from "@/lib/firebase";
import { collection, doc, getDoc, getDocs, query, where, documentId, getAggregateFromServer, sum, count } from "firebase/firestore";
import { lastNDatesIST, todayIST, dateToISTString, istMidnightUtcMillis } from "@/lib/activity";
import { fetchLogsForDateByUids } from "@/lib/dailyLearning";
import { fetchSubmissionDatesForUser } from "@/lib/codelab";
import { fetchTransactionDatesForUser } from "@/lib/economy";

// A department is the same joins as a classroom with ~5-10x the cohort (a
// real one here is 303 students, not the tens a single section has), and the
// per-student reads below are unavoidable: user_earnings, coin_transactions
// and codelab_submissions are GLOBAL collections whose read rules resolve
// scope from each doc's own uid, so a cohort-wide "uid in [30]" query against
// them would spend 2 uncached rules lookups per returned doc and blow
// Firestore's ~10-call-per-query budget (see firestore.rules'
// dailyLearningLog comment for the emulator-verified numbers). One small read
// per student is the only shape that stays authorized.
//
// What must NOT happen is issuing all of them at once. Unbounded Promise.all
// over 303 students fans out to ~900 simultaneous reads, which the Web SDK
// accepts and then serializes badly behind its own connection pool - slow
// enough to look hung, and liable to come back RESOURCE_EXHAUSTED. A fixed
// in-flight window does the identical total work in predictable batches.
const READ_CONCURRENCY = 24;

async function mapWithConcurrency(items, fn, limit = READ_CONCURRENCY) {
  const out = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    for (let i = next++; i < items.length; i = next++) out[i] = await fn(items[i], i);
  }));
  return out;
}

// Fetches by the roster's OWN uids (documentId() "in" queries, 30/chunk),
// not by re-filtering users on department/year/section - that used to be a
// SEPARATE query that was supposed to return the same cohort as the roster
// but could silently diverge (e.g. a suspended student's users/{uid} fields
// get cleared, or an identity edit made while suspended skips mirroring to
// users/{uid} - see updateStudentIdentity/suspendStudent in institutions.js),
// silently zeroing a real roster member's stats in every KPI/average below
// whenever their users-doc fields didn't exactly match this classroom's
// department/year/section at query time. Deriving directly from the
// roster's own uid list makes that class of drift structurally impossible.
// users/{uid} is publicly readable, so unlike the collections below this one
// CAN be batched 30-at-a-time - and the chunks run concurrently rather than
// one round trip after another, which is the difference between 1 and 11
// serial hops for a 303-student department.
export async function fetchClassroomUsers(uids) {
  const chunks = [];
  for (let i = 0; i < uids.length; i += 30) chunks.push(uids.slice(i, i + 30));
  const snaps = await mapWithConcurrency(chunks, chunk =>
    getDocs(query(collection(db, "users"), where(documentId(), "in", chunk))));
  const usersByUid = new Map();
  snaps.forEach(snap => snap.docs.forEach(d => usersByUid.set(d.id, { uid: d.id, ...d.data() })));
  return uids.map(uid => usersByUid.get(uid) || { uid });
}

// True lifetime coin total, not the partial `users.credits` field - that
// field predates the Coins architecture (contest AND CodeLab rewards both
// used to land only there, never touching the real wallet) and is kept
// only for backward-compat display; every coin-earning path (Daily
// Learning, Programming, CS Core, CodeLab, Contests) now also credits
// user_earnings.totalCoins, the one real spendable/withdrawable balance.
// One getDoc per student - user_earnings' read rule allows
// isAdminOfStudent(uid)/isHodOfStudent(uid) (same access shape as
// user_codelab_progress), and a single-doc get is the only shape that check
// stays affordable in: it gets its own rules-call budget, where a batched
// "documentId() in [30]" list would have to pay those same lookups 30 times
// over inside one budget. Bounded rather than fully parallel because a
// department cohort is hundreds of students, not the tens a classroom has.
export async function fetchClassroomEarnings(uids) {
  const rows = await mapWithConcurrency(uids, async (uid) => {
    const snap = await getDoc(doc(db, "user_earnings", uid)).catch(() => null);
    return { uid, totalCoins: snap?.exists() ? (snap.data().totalCoins || 0) : 0 };
  });
  return new Map(rows.map(r => [r.uid, r.totalCoins]));
}

// One query per (date, uid-chunk-of-30) against the institution's own
// dailyLearningLog, scoped to exactly this cohort's own uids -
// fetchLogsForDateByUids (not the plain date-only fetchLogsForDate) so an
// HOD/Faculty caller (CampusHodDashboard/CampusFacultyDashboard) only ever
// downloads its own department's/classroom's rows rather than the whole
// institution's. See that function's comment for why this is now a
// data-minimization choice rather than the authorization workaround it
// started as. isInstitutionAdmin/Principal callers work identically either
// way, since they already have unscoped read access.
export async function fetchClassroomDailyLearningTrend(institutionId, uids, dates) {
  const uidSet = new Set(uids);
  const perDate = await Promise.all(dates.map(date => fetchLogsForDateByUids(institutionId, date, uids)));
  return dates.map((date, i) => {
    const rows = perDate[i].filter(r => !!r.completedAt && uidSet.has(r.uid));
    return { date, completedCount: rows.length, rows };
  });
}

// Real "did this student do a meaningful learning action" signal - NOT app-
// open pings. lib/activity.js's pingActivity keeps running (still real,
// still cheap), but is deliberately not consulted here: per the explicit
// product requirement, opening the app must never count as "active" on its
// own. Three genuine action sources are combined:
//  1. Daily Learning completion (already fetched per-date for the trend
//     chart below - zero extra reads).
//  2. coin_transactions (one query per student since the start of the
//     window) - this log already covers Daily Learning, Programming, and CS
//     Core completions (see lib/economy.js's logCoinTransaction callers), so
//     it alone recovers Programming/CS Core activity that has no dedicated
//     per-day log of its own.
//  3. codelab_submissions (one query per student) - DSA/Practice solves,
//     which coin_transactions does NOT cover (GradingService.java never
//     logs there).
// Both #2 and #3 use the same "N small reads for a classroom-sized cohort"
// shape already established by fetchClassroomEarnings.
//
// Still NOT included: Contest participation and Company Vault/Assessment
// attempts that don't otherwise touch the sources above - lib/contests.js
// never calls logCoinTransaction, and there's no institution-scoped daily
// log for contest submissions the way dailyLearningLog gives Daily Learning.
// That gap is deliberate and flagged, not silently glossed over.
async function fetchClassroomActionDates(uids, sinceDateStr) {
  const sinceDate = new Date(istMidnightUtcMillis(sinceDateStr));
  const rows = await mapWithConcurrency(uids, async (uid) => {
    const [codelabDates, coinTxDates] = await Promise.all([
      fetchSubmissionDatesForUser(uid, sinceDate).catch(() => []),
      fetchTransactionDatesForUser(uid, sinceDate).catch(() => []),
    ]);
    const dateSet = new Set([...codelabDates, ...coinTxDates].map(dateToISTString));
    return { uid, dateSet };
  });
  return new Map(rows.map(r => [r.uid, r.dateSet]));
}

// Everything CampusClassrooms' ClassroomDashboard Overview tab needs, joined
// in one place so it isn't re-fetched per sub-tab. `students` is the roster
// slice already loaded by the caller (fetchRosterStudents) - never re-fetched
// here.
export async function fetchClassroomAnalytics(institutionId, students) {
  const uids = students.map(s => s.uid);
  const today = todayIST();
  const week = lastNDatesIST(7);

  const [users, earningsByUid, dlTrend, actionDatesByUid] = await Promise.all([
    fetchClassroomUsers(uids),
    fetchClassroomEarnings(uids),
    fetchClassroomDailyLearningTrend(institutionId, uids, week),
    fetchClassroomActionDates(uids, week[0]),
  ]);
  const usersByUid = new Map(users.map(u => [u.uid, u]));

  // Per-uid set of Daily-Learning-completed dates, built from the trend
  // rows already fetched above (each row carries its own uid) - no extra
  // reads beyond the CodeLab submission dates.
  const dlDatesByUid = new Map();
  dlTrend.forEach(day => {
    day.rows.forEach(r => {
      if (!dlDatesByUid.has(r.uid)) dlDatesByUid.set(r.uid, new Set());
      dlDatesByUid.get(r.uid).add(day.date);
    });
  });

  const merged = students.map(s => {
    const u = usersByUid.get(s.uid) || {};
    const activeDates = new Set([...(dlDatesByUid.get(s.uid) || []), ...(actionDatesByUid.get(s.uid) || [])]);
    const daysActive = week.filter(d => activeDates.has(d)).length;
    const lastActiveDay = [...week].reverse().find(d => activeDates.has(d)) || null;
    return {
      uid: s.uid,
      name: s.name || u.campusFullName || u.displayName || "(no name)",
      rollNumber: s.rollNumber || u.rollNumber || "",
      status: s.status,
      reviewedAt: s.reviewedAt || null,
      xp: u.xp || 0,
      score: u.score || 0,
      totalCoins: earningsByUid.get(s.uid) || 0,
      problemsSolvedCount: u.problemsSolvedCount || 0,
      activeToday: activeDates.has(today),
      daysActiveThisWeek: daysActive,
      lastActiveDate: lastActiveDay,
    };
  });

  const activeTodayCount = merged.filter(s => s.activeToday).length;
  const activeThisWeekCount = merged.filter(s => s.daysActiveThisWeek > 0).length;
  const avg = (arr) => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;

  const dlToday = dlTrend[dlTrend.length - 1];
  const fallingBehind = merged.filter(s => s.daysActiveThisWeek === 0);
  const topPerformers = [...merged].sort((a, b) => b.score - a.score).slice(0, 5);

  return {
    students: merged,
    kpis: {
      totalStudents: students.length,
      activeToday: activeTodayCount,
      activeThisWeek: activeThisWeekCount,
      avgScore: avg(merged.map(s => s.score)),
      avgXp: avg(merged.map(s => s.xp)),
      avgCoins: avg(merged.map(s => s.totalCoins)),
      avgProblemsSolved: avg(merged.map(s => s.problemsSolvedCount)),
      dailyLearningCompletedToday: dlToday?.completedCount || 0,
      fallingBehindCount: fallingBehind.length,
    },
    dailyLearningTrend: dlTrend.map(d => ({ date: d.date, completedCount: d.completedCount })),
    fallingBehind,
    topPerformers,
  };
}

// Whole-campus averages via a Firestore aggregation query (sum()/count(),
// firebase v10.6+) - one cheap server-side computation over every student's
// users/{uid} doc, not a download of every row, so this stays affordable even
// for a large institution. Used only for the Analytics tab's "vs campus
// average" comparison, fetched lazily (not part of fetchClassroomAnalytics)
// since Overview doesn't need it.
//
// Deliberately sum()/count() divided here, NOT Firestore's own average() -
// verified directly against production (via firebase-admin) that average()
// divides by the count of documents that HAVE the field set, not by the
// total number of matching documents. Every user doc has `xp` (defaulted to
// 0 at account creation - see AuthContext.js), so average("xp") happens to
// come out correct today, but `problemsSolvedCount` is only ever written
// once a problem is actually solved - most students never have the field at
// all, so average("problemsSolvedCount") silently divided by ~1/10th of the
// real student count and returned a ~10x-inflated number (2.35 instead of
// the real ~0.23). sum()/total avoids that trap entirely and matches the
// exact "SUM / Total Students" formula this feature is spec'd to use.
//
// Two separate aggregate calls (one per field), not one combined spec -
// Firestore requires its OWN composite index per aggregated field
// (institutionId+xp and institutionId+problemsSolvedCount, both ASCENDING -
// distinct from the existing DESCENDING indexes those same fields already
// have for leaderboard sorting), and combining both sums into one query
// would need a single 3-field index instead of reusing two simpler ones.
export async function fetchCampusAverages(institutionId) {
  const col = collection(db, "users");
  const [xpSnap, problemsSnap, scoreSnap] = await Promise.all([
    getAggregateFromServer(query(col, where("institutionId", "==", institutionId)), { sumXp: sum("xp"), total: count() }),
    getAggregateFromServer(query(col, where("institutionId", "==", institutionId)), { sumProblems: sum("problemsSolvedCount") }),
    getAggregateFromServer(query(col, where("institutionId", "==", institutionId)), { sumScore: sum("score") }),
  ]);
  const total = xpSnap.data().total || 0;
  return {
    avgXp: total ? Math.round((xpSnap.data().sumXp || 0) / total) : 0,
    avgProblemsSolved: total ? Math.round((problemsSnap.data().sumProblems || 0) / total) : 0,
    avgScore: total ? Math.round((scoreSnap.data().sumScore || 0) / total) : 0,
    totalStudents: total,
  };
}
