import { db } from "@/lib/firebase";
import {
  collection, doc, getDocs, getDoc, query, where, setDoc, updateDoc, deleteDoc, serverTimestamp, runTransaction, writeBatch,
} from "firebase/firestore";
import { grantRewards, isAlreadyGranted } from "@/lib/rewards";

// Institution-scoped Monday-Saturday structured learning program (e.g. the
// MRCET cohort). Lives under institutions/{slug}/dailyLearning - a
// collection firestore.rules already anticipated (isApprovedStudent/
// isInstitutionAdmin gating) but nothing in the app used until now. Kept
// entirely separate from the generic global `courses` collection
// (lib/learning.js) that /learn, today-task-card.jsx and the admin Content
// Manager already depend on - no shared schema, so none of that breaks.
//
// One doc per calendar date, doc id = ISO date ("2026-07-20"), that IS the
// week's Monday) so a query for "everything in this week" or "today's item"
// never needs a composite index. `type` is "lesson" (Mon-Fri) or "test"
// (Saturday's heavier master test) - the viewer renders both from the same
// shape, just with more questions/problems and a bigger reward on "test".
//
// MULTI-TRACK: every function below takes a trailing `trackId = "dsa"`
// param. "dsa" resolves to the legacy top-level dailyLearning/
// dailyLearningLog collections above, completely unchanged - every existing
// call site that doesn't pass a trackId keeps working exactly as it always
// has, on the exact same live data (293 real MRCET students' worth of DSA
// completion history), zero migration. Any OTHER trackId (e.g. "aptitude")
// resolves to its own namespaced institutions/{slug}/learningTracks/{trackId}/
// {items,logs} subtree instead - a totally separate date space, so a DSA day
// and an Aptitude Series day can legitimately land on the same calendar date
// without ever colliding (the doc-id-is-a-bare-date design below could not
// otherwise support two tracks at once - see trackPaths()). See
// TRACK_CATALOG for the literal "new track = configuration" surface this
// unlocks for future series (Programming, CS Core, GATE, ...).
export const TRACK_CATALOG = [
  { key: "dsa", label: "DSA Series", icon: "Code2" },
  { key: "aptitude", label: "Aptitude Series", icon: "Calculator" },
];

function trackPaths(institutionId, trackId) {
  return trackId === "dsa"
    ? { items: `institutions/${institutionId}/dailyLearning`, logs: `institutions/${institutionId}/dailyLearningLog` }
    : { items: `institutions/${institutionId}/learningTracks/${trackId}/items`, logs: `institutions/${institutionId}/learningTracks/${trackId}/logs` };
}

export const DOW_LABELS = { mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday", fri: "Friday", sat: "Saturday" };
export const DOW_ORDER = ["mon", "tue", "wed", "thu", "fri", "sat"];

// LOCAL calendar date, not toISOString()'s UTC one - IST is UTC+5:30, so
// anywhere between midnight and 5:30am IST, toISOString() would silently
// roll back to "yesterday" (still-UTC-yesterday), computing the wrong
// weekId/date and making real, already-seeded content look like it
// doesn't exist. Every date in this file must be built from local
// getters, never toISOString().
function toISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// The Monday (as an ISO date string) of the week containing `d` - used as
// both the `weekId` grouping field and to derive every other day in that
// week by adding offsets, so authoring only ever needs one anchor date.
export function mondayOf(d = new Date()) {
  const copy = new Date(d);
  const dow = copy.getDay(); // 0=Sun..6=Sat
  const diff = dow === 0 ? -6 : 1 - dow;
  copy.setDate(copy.getDate() + diff);
  return toISODate(copy);
}

export function dateForDow(weekId, dow) {
  const idx = DOW_ORDER.indexOf(dow);
  const d = new Date(`${weekId}T00:00:00`);
  d.setDate(d.getDate() + idx);
  return toISODate(d);
}

// The reverse of dateForDow - which weekday slot a given ISO date falls on.
// Returns undefined for a Sunday date - there is no Sunday slot in this
// Mon-Sat program, so the form's date picker should never offer one.
export function dowOfDate(dateStr) {
  const jsDay = new Date(`${dateStr}T00:00:00`).getDay(); // 0=Sun..6=Sat
  return jsDay === 0 ? undefined : DOW_ORDER[jsDay - 1];
}

// weekOffset weeks from `weekId` (negative = earlier) - lets Manage step
// through "this week" / "next week" / etc. without re-deriving from today.
export function shiftWeek(weekId, weekOffset) {
  const d = new Date(`${weekId}T00:00:00`);
  d.setDate(d.getDate() + weekOffset * 7);
  return toISODate(d);
}

export async function setItemTitle(slug, date, title, trackId = "dsa") {
  await updateDoc(doc(db, trackPaths(slug, trackId).items, date), { title });
}

export function todayISO() {
  return toISODate(new Date());
}

// `includeUnpublished`: admin-only escape hatch (Manage's preview/analytics
// screen) - every student-facing call site leaves this false, so a day an
// admin has disabled disappears from the student view without needing a
// second "is this visible" check scattered through every consumer.
export async function fetchWeekItems(slug, weekId, { includeUnpublished = false } = {}, trackId = "dsa") {
  const snap = await getDocs(query(collection(db, trackPaths(slug, trackId).items), where("weekId", "==", weekId)));
  let rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  if (!includeUnpublished) rows = rows.filter(it => it.status !== "draft");
  return rows.sort((a, b) => DOW_ORDER.indexOf(a.dow) - DOW_ORDER.indexOf(b.dow));
}

export async function setItemStatus(slug, date, status, trackId = "dsa") {
  await updateDoc(doc(db, trackPaths(slug, trackId).items, date), { status });
}

// Module-level kill switch - deliberately INSTITUTION-WIDE, not per-track
// (Aptitude Series is a track *within* the one Daily Learning module, not a
// separate module to toggle) - always lives in the legacy top-level
// dailyLearning collection regardless of which track a caller is otherwise
// working with, stored as a sentinel doc (id "_module" - never collides
// with a real "YYYY-MM-DD" date id) rather than a field on
// institutions/{slug} itself, because firestore.rules only lets a platform
// admin write the institution doc - isInstitutionAdmin already has write
// access to anything under dailyLearning/*, so this needs zero rule changes
// to let a campus admin toggle it.
export async function fetchModuleConfig(slug) {
  const snap = await getDoc(doc(db, "institutions", slug, "dailyLearning", "_module"));
  return snap.exists() ? snap.data() : { enabled: true };
}

export async function setModuleEnabled(slug, enabled) {
  await setDoc(doc(db, "institutions", slug, "dailyLearning", "_module"), { enabled }, { merge: true });
}

export async function fetchItemByDate(slug, date, trackId = "dsa") {
  const snap = await getDoc(doc(db, trackPaths(slug, trackId).items, date));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// Every published item a track has ever had, oldest-first - small, bounded
// collection (one doc per calendar date a lesson was ever authored for),
// same "just fetch the whole small collection" precedent as
// fetchClassrooms/fetchInstitutionAdmins elsewhere in this codebase. Used
// for the Daily Learning landing page's per-track progress ("Day N of
// however many have been published so far"), not a hot path. Filters out
// the "_module" sentinel unconditionally - harmless for tracks that never
// have one (everything but "dsa"), required for "dsa" (whose items
// collection IS the legacy dailyLearning collection the sentinel also
// lives in).
export async function fetchAllTrackItems(slug, trackId = "dsa", { includeUnpublished = false } = {}) {
  const snap = await getDocs(collection(db, trackPaths(slug, trackId).items));
  let rows = snap.docs.filter(d => d.id !== "_module").map(d => ({ id: d.id, ...d.data() }));
  if (!includeUnpublished) rows = rows.filter(it => it.status !== "draft");
  return rows.sort((a, b) => (a.date < b.date ? -1 : 1));
}

function logId(uid, date) { return `${uid}_${date}`; }

export async function fetchLog(slug, uid, date, trackId = "dsa") {
  const snap = await getDoc(doc(db, trackPaths(slug, trackId).logs, logId(uid, date)));
  return snap.exists() ? snap.data() : null;
}

export async function fetchUserWeekLogs(slug, uid, weekId, trackId = "dsa") {
  const snap = await getDocs(query(collection(db, trackPaths(slug, trackId).logs), where("uid", "==", uid), where("weekId", "==", weekId)));
  const byDate = {};
  snap.docs.forEach(d => { byDate[d.data().date] = d.data(); });
  return byDate;
}

// Every day this student has ever completed (or drafted), not scoped to one
// week - same single-equality-filter shape as fetchUserWeekLogs (just
// dropping the weekId filter), so it needs no composite index and stays
// safe under firestore.rules' isApprovedStudent list-safety analysis. Used
// for a student's own all-time Daily Learning analytics/heatmap, and for
// the landing page's per-track "X% complete" (see fetchTrackProgress).
export async function fetchAllUserLogs(slug, uid, trackId = "dsa") {
  const snap = await getDocs(query(collection(db, trackPaths(slug, trackId).logs), where("uid", "==", uid)));
  return snap.docs.map(d => d.data());
}

// Daily Learning landing page's per-track progress card ("Day N",
// "X% Complete") - computed live from the two small collections above, not
// denormalized (same "no Cloud Functions in this project, compute from
// small collections instead" discipline used throughout this codebase -
// see ensureClassroom in lib/institutions.js for the identical reasoning).
// currentDayIndex = how many of this track's published days have a date on
// or before today, i.e. "the Nth lesson chronologically" - robust and
// always computable, unlike trying to parse a day number back out of
// whatever an admin happened to title the lesson ("Day 11: ...").
export async function fetchTrackProgress(slug, uid, trackId) {
  const [items, logs] = await Promise.all([
    fetchAllTrackItems(slug, trackId),
    fetchAllUserLogs(slug, uid, trackId),
  ]);
  const todayStr = todayISO();
  const currentDayIndex = items.filter(it => it.date <= todayStr).length;
  const completedCount = logs.filter(l => !!l.completedAt).length;
  const totalCount = items.length;
  return {
    currentDayIndex,
    totalCount,
    completedCount,
    percentComplete: totalCount ? Math.round((completedCount / totalCount) * 100) : 0,
  };
}

// Self-reported completion, same trust level as the generic Learning
// module's own handleSubmit (lib is owner-write, rules gate on
// isApprovedStudent + isOwner). The read-check-write (is this already
// rewarded?) is wrapped in a transaction, not a plain get()-then-set() -
// two near-simultaneous submits (double-click, two tabs) used to both read
// "not yet completed" before either write landed, double-awarding the day's
// XP/coins/score; Firestore now retries this whole callback if the log doc
// changes underneath it, so the loser of the race re-reads an
// already-completed doc and is correctly denied a second reward.
// Is this day's work being done ON that day? Daily Learning is a daily-habit
// program, and paying full XP/coins for a fortnight of catch-up in one sitting
// rewards the opposite of the behaviour it exists to build. From 2026-07-31, a
// day completed late still records completion and still counts toward progress
// and streak history - it just earns nothing.
//
// Deliberately compares two LOCAL ISO date strings (toISODate uses local
// getters, never toISOString) so a student in IST submitting at 00:30 is judged
// against their own calendar day, not a UTC one that is still "yesterday" until
// 05:30. This file's toISODate comment documents the same trap.
//
// This is a client-side check on a client-side reward path, so it is enforced
// again in firestore.rules - see the dailyLearningLog write rule. Coins convert
// to real INR, so the rule is the authority and this is the UX.
export function isSameDayAsToday(date) {
  return date === todayISO();
}

export async function submitDayCompletion({ slug, uid, profile, item, mcqAnswers, correctCount, problemsSolved, trackId = "dsa" }) {
  const logRef = doc(db, trackPaths(slug, trackId).logs, logId(uid, item.date));
  let alreadyRewarded;

  // Read once, outside the transaction body, so a retry cannot straddle
  // midnight and grant on one attempt but not the next.
  const onTime = isSameDayAsToday(item.date);

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(logRef);
    const existing = snap.exists() ? snap.data() : null;
    // completedAt specifically, not mere doc existence - saveDraftProgress
    // below writes to this same doc (readAt/draftAnswers) well before a real
    // submission, so a draft-only doc must never be mistaken for "already
    // rewarded" and silently zero out this student's XP/coins/score for the day.
    alreadyRewarded = !!existing?.completedAt;

    tx.set(logRef, {
      uid,
      date: item.date,
      weekId: item.weekId,
      dow: item.dow,
      dayLabel: DOW_LABELS[item.dow],
      type: item.type,
      displayName: profile?.campusFullName || profile?.displayName || profile?.handle || "Student",
      rollNumber: profile?.rollNumber || null,
      department: profile?.department || null,
      year: profile?.year || null,
      section: profile?.section || null,
      mcqAnswers,
      mcqScore: correctCount,
      mcqTotal: (item.mcqs || []).length,
      problemsSolved,
      problemsTotal: (item.problemIds || []).length,
      xpEarned: alreadyRewarded ? (existing.xpEarned || 0) : (onTime ? (item.xpReward || 0) : 0),
      coinEarned: alreadyRewarded ? (existing.coinEarned || 0) : (onTime ? (item.coinReward || 0) : 0),
      // Why the day earned nothing, recorded on the log itself rather than
      // inferred later - "completed but 0 XP" is otherwise indistinguishable
      // from a bug, both to a student asking and to anyone reading analytics.
      lateSubmission: alreadyRewarded ? (existing.lateSubmission ?? false) : !onTime,
      completedAt: existing?.completedAt || serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });

    // Reward writes happen INSIDE this same transaction, not as a separate
    // call after commit - grantRewards used to run after this transaction
    // had already committed the completedAt flag, so a dropped connection
    // between the two left the flag set but the xp/score/coins permanently
    // stranded (no retry possible - the flag already says "rewarded"). Given
    // the tx argument, grantRewards uses tx.update/tx.set instead of the
    // standalone SDK calls, making the whole thing one atomic commit.
    // `onTime` gates the grant entirely - a late day writes its log (so
    // progress, streak history and analytics still see it) but never touches
    // the reward ledger at all, rather than granting zero through it.
    if (!alreadyRewarded && onTime) {
      grantRewards(uid, {
        xpReward: item.xpReward || 0,
        coinReward: item.coinReward || 0,
        scoreReward: item.xpReward || 0,
        transactionType: "daily_learning_completed",
        activityType: "daily_learning_day",
        activityId: `${slug}_${trackId}_${item.date}`,
        sourceModule: "daily_learning",
      }, tx);
    }
  });

  // { rewarded, onTime } rather than a bare boolean - the caller needs to tell
  // "you already did this" apart from "you did it late", because those are two
  // different messages to show a student.
  return { rewarded: !alreadyRewarded && onTime, alreadyCompleted: alreadyRewarded, onTime };
}

// Flat per-problem reward for solving a practice/coding problem embedded in
// a Daily Learning day - deliberately a FIXED amount (not that problem's own
// standalone CodeLab xpReward/coinReward, which can vary 30-50 XP/10-20
// coins by difficulty), separate from and on top of the day's own 50 XP/20
// coin completion bonus above. Previously these embedded solves passed
// `suppressReward` to the CodeLab grading call specifically to avoid
// double-counting against the day's flat bonus - that suppression is now
// removed (see campus-daily-learning.jsx), and THIS is the reward that
// replaces it, granted the moment a problem transitions to solved while
// viewing it inside a Daily Learning day. Keyed by (trackId, date, problemId),
// not problemId alone, so the same problem appearing on a different day (a
// different lesson's embedded practice) - or the same date's problem in a
// DIFFERENT track - can be rewarded again, but solving the identical problem
// twice on the SAME day within the SAME track only ever rewards once.
export const DAILY_LEARNING_PROBLEM_XP = 25;
export const DAILY_LEARNING_PROBLEM_COINS = 5;

export async function grantDailyLearningProblemReward({ slug, uid, date, problemId, trackId = "dsa" }) {
  // Same same-day rule as submitDayCompletion. Without it the day bonus would
  // be withheld for late work while the per-problem rewards - 25 XP each, which
  // on a two-problem day is most of the value - still paid out in full, leaving
  // the rule trivially sidesteppable by just solving the problems.
  if (!isSameDayAsToday(date)) return false;
  const activityId = `${slug}_${trackId}_${date}_${problemId}`;
  return runTransaction(db, async (tx) => {
    const already = await isAlreadyGranted(tx, uid, "daily_learning_problem", activityId);
    if (already) return false;
    await grantRewards(uid, {
      xpReward: DAILY_LEARNING_PROBLEM_XP,
      coinReward: DAILY_LEARNING_PROBLEM_COINS,
      scoreReward: DAILY_LEARNING_PROBLEM_XP,
      transactionType: "daily_learning_problem_solved",
      activityType: "daily_learning_problem",
      activityId,
      sourceModule: "daily_learning",
    }, tx);
    return true;
  });
}

// Lightweight, non-scoring save - called as soon as a student flips "mark as
// read" or changes an MCQ answer, so that state survives a refresh/crash/
// leaving mid-lesson even before the final "Save Progress" submit at the
// bottom of the page. Deliberately never writes completedAt/mcqScore/
// xpEarned/coinEarned - submitDayCompletion's alreadyRewarded check keys off
// completedAt specifically (not mere doc existence) for exactly this reason,
// so this draft write can never cause a student to lose credit for the day.
export async function saveDraftProgress(slug, uid, item, { markedRead, mcqAnswers }, trackId = "dsa") {
  await setDoc(doc(db, trackPaths(slug, trackId).logs, logId(uid, item.date)), {
    uid, date: item.date, weekId: item.weekId, dow: item.dow, type: item.type,
    ...(markedRead ? { readAt: serverTimestamp() } : {}),
    draftAnswers: mcqAnswers,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

// Single-equality-filter query (date only) so this never needs a composite
// index - cohort size is small enough that an in-memory sort by score is
// completely fine, and it keeps this feature deployable without waiting on
// a Firestore index build first. Raw rows (drafts included) - callers decide
// what counts as "real" (see fetchDayLeaderboard's completedAt filter below).
export async function fetchLogsForDate(slug, date, trackId = "dsa") {
  const snap = await getDocs(query(collection(db, trackPaths(slug, trackId).logs), where("date", "==", date)));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// Scoped counterpart to fetchLogsForDate, for HOD/Faculty callers viewing
// their own department/classroom's analytics (see lib/classroomAnalytics.js's
// fetchClassroomDailyLearningTrend). fetchLogsForDate's plain date-only query
// returns every student's log institution-wide - fine for isApprovedStudent/
// isInstitutionAdmin callers, but firestore.rules' dailyLearningLog read rule
// only grants an HOD/Faculty caller access to docs belonging to a student in
// their OWN scope (via isHodOfStudent/isFacultyOfStudent), so that unscoped
// query is denied in full the instant even one returned doc belongs to a
// student outside their department/classroom - the same "list queries fail
// all-or-nothing" trap fetchRosterStudentsByDepartment/ByClassroom already
// work around. Chunked into groups of 30 (Firestore's "in" cap).
export async function fetchLogsForDateByUids(slug, date, uids, trackId = "dsa") {
  const rows = [];
  for (let i = 0; i < uids.length; i += 30) {
    const chunk = uids.slice(i, i + 30);
    if (!chunk.length) continue;
    const snap = await getDocs(query(
      collection(db, trackPaths(slug, trackId).logs),
      where("date", "==", date), where("uid", "in", chunk),
    ));
    snap.docs.forEach(d => rows.push({ id: d.id, ...d.data() }));
  }
  return rows;
}

// Filters to completedAt specifically, not mere doc existence - saveDraftProgress
// (above) writes a doc for this same (uid, date) the moment a student marks a
// lesson read or picks one MCQ answer, well before any real completion, and
// that draft-only doc has no displayName/rollNumber/mcqScore/xpEarned at all.
// Without this filter, every student mid-lesson shows up as a blank,
// nameless row - ranked, sorted, and counted alongside real completions.
// Ranks are assigned AFTER this filter (array index + 1 on the filtered,
// sorted list), so a student with no real completion for the day can never
// consume a rank number either.
export async function fetchDayLeaderboard(slug, date, trackId = "dsa") {
  const rows = (await fetchLogsForDate(slug, date, trackId)).filter(r => !!r.completedAt);
  rows.sort((a, b) =>
    (b.xpEarned || 0) - (a.xpEarned || 0)
    || (b.problemsSolved?.length || 0) - (a.problemsSolved?.length || 0)
    || (b.mcqScore || 0) - (a.mcqScore || 0)
    || (a.completedAt?.toMillis?.() ?? Infinity) - (b.completedAt?.toMillis?.() ?? Infinity));
  return rows.map((r, i) => ({ ...r, rank: i + 1 }));
}

// Full create/edit save - the Manage editor form writes every field back
// through this one function whether it's a brand-new day or an existing
// one, since a date-keyed doc is naturally idempotent (set with merge just
// overwrites the fields the form actually owns).
export async function saveItem(slug, item, trackId = "dsa") {
  const { date, ...rest } = item;
  await setDoc(doc(db, trackPaths(slug, trackId).items, date), {
    ...rest,
    date,
    weekId: mondayOf(new Date(`${date}T00:00:00`)),
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

// Also deletes every student's completion log for this exact date - without
// this, a deleted day left its {logs}/{uid}_{date} docs behind forever
// (isInstitutionAdmin can write/delete these same as the day item itself,
// see firestore.rules), permanently orphaned since nothing else ever
// queries a log whose parent day no longer exists. Bounded to this one
// date's rows (fetchLogsForDate already scopes by date, not a full-collection
// scan), so this stays cheap even for a large institution.
export async function deleteItem(slug, date, trackId = "dsa") {
  const logs = await fetchLogsForDate(slug, date, trackId);
  const paths = trackPaths(slug, trackId);
  if (logs.length) {
    const batch = writeBatch(db);
    logs.forEach(log => batch.delete(doc(db, paths.logs, log.id)));
    await batch.commit();
  }
  await deleteDoc(doc(db, paths.items, date));
}

// Copies one day's content onto a different (currently-empty) date - lets
// an admin duplicate a lesson as a starting point for a new week instead of
// authoring from a blank form every time.
// Checks the target date directly against Firestore, not just whatever week
// the admin's Manage screen happens to have loaded - saveItem's setDoc(merge:
// true) would otherwise silently overwrite a real, already-authored day in a
// DIFFERENT week than the one currently on screen, with no way to undo it.
export async function duplicateItem(slug, fromDate, toDate, trackId = "dsa") {
  const source = await fetchItemByDate(slug, fromDate, trackId);
  if (!source) throw new Error("Source day not found.");
  const existing = await fetchItemByDate(slug, toDate, trackId);
  if (existing) throw new Error("That date already has a day - pick a different one.");
  const { id, createdAt, updatedAt, ...rest } = source;
  await saveItem(slug, { ...rest, date: toDate, dow: dowOfDate(toDate), status: "draft" }, trackId);
}

export async function fetchWeekTests(slug, { includeUnpublished = false } = {}, trackId = "dsa") {
  const snap = await getDocs(query(collection(db, trackPaths(slug, trackId).items), where("type", "==", "test")));
  let rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  if (!includeUnpublished) rows = rows.filter(it => it.status !== "draft");
  return rows.sort((a, b) => (a.date < b.date ? 1 : -1));
}
