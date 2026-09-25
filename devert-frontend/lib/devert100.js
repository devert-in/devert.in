import { db } from "@/lib/firebase";
import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, onSnapshot,
  query, orderBy, serverTimestamp, increment,
} from "firebase/firestore";

// DeVert 100 - the 100-day DSA execution run.
//
// THE ONE THING TO UNDERSTAND FIRST: this is a COHORT, not a per-user clock.
// Day 27 is the same calendar date for every participant. Someone who joins on
// day 30 joins ON day 30 - they do not start their own day 1 thirty days late.
// That is what makes "Day 27/100" mean the same thing in two people's LinkedIn
// posts on the same morning, which is the whole point of running it as a
// series rather than a self-paced course.
//
// The consequence to keep in mind when reading the rest of this file: a user's
// progress and the run's current day are INDEPENDENT. currentDay comes from the
// calendar; completedDays comes from the user. Someone can be on day 40 of the
// run having completed 12 days, and that is a normal state, not an error.

// Day 1. Set by the product, NOT by the spreadsheet - the sheet's own editable
// start cell holds 2026-09-24, one day later. 2026-09-23 is correct because it
// puts day 100 exactly on 2026-12-31: the run is meant to end with the year.
// Changing this moves every unlock for everyone, so it lives here alone and is
// never derived from the source spreadsheet.
export const DEVERT100_START = "2026-09-23";
export const DEVERT100_TOTAL_DAYS = 100;

// Every date boundary is evaluated in IST, not the viewer's zone and not UTC.
// A run aimed at Indian developers has to roll over at local midnight: on UTC
// the day would flip at 05:30 IST, so someone solving at 01:00 would have it
// counted against the previous day and their streak would break while they
// were sitting there having just solved it.
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

// Calendar-day index in IST, floored. Comparing these integers is what makes
// all the date maths below immune to the time of day.
function istDayIndex(date) {
  return Math.floor((date.getTime() + IST_OFFSET_MS) / DAY_MS);
}

function startDayIndex() {
  // Parsed as UTC midnight, then shifted the same way every other instant is,
  // so the start line sits on the same grid as `now`.
  const [y, m, d] = DEVERT100_START.split("-").map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / DAY_MS);
}

// Which day of the run it is right now.
//   0             -> the run has not started yet
//   1..100        -> that day is live
//   >100          -> the run is over (callers clamp; see currentDay)
export function runDayOn(now = new Date()) {
  return istDayIndex(now) - startDayIndex() + 1;
}

// The live day, clamped into the run. Returns 0 before the start so callers can
// distinguish "not begun" from "day 1".
export function currentDay(now = new Date()) {
  const n = runDayOn(now);
  if (n < 1) return 0;
  return Math.min(n, DEVERT100_TOTAL_DAYS);
}

export function hasRunStarted(now = new Date()) { return runDayOn(now) >= 1; }
export function hasRunEnded(now = new Date()) { return runDayOn(now) > DEVERT100_TOTAL_DAYS; }

// The calendar date a given day falls on - used for the journey grid's labels
// and for "unlocks in N days" copy.
export function dateForDay(day) {
  return new Date((startDayIndex() + day - 1) * DAY_MS);
}

export function formatDayDate(day) {
  // en-GB, not en-IN: both are day-month-year, but en-IN abbreviates September
  // as "Sept" while every other month gets three letters, which makes a grid of
  // 100 date labels visibly ragged.
  return dateForDay(day).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric", timeZone: "UTC",
  });
}

// ── day states ────────────────────────────────────────────────────────────
// A day is LOCKED purely by the calendar. Note what this deliberately does NOT
// do: it never locks a day because an earlier one is unfinished. Sequential
// gating on top of a cohort calendar would mean someone who misses day 3 can
// never reach day 4's content while the rest of the run moves on, which turns
// one missed day into dropping out. Every past day stays open.
export const DAY_STATE = {
  COMPLETED: "completed",
  TODAY: "today",
  AVAILABLE: "available",
  LOCKED: "locked",
};

export function dayState(day, completedDays, now = new Date()) {
  const live = currentDay(now);
  if (completedDays && completedDays[String(day)]) return DAY_STATE.COMPLETED;
  if (live === 0 || day > live) return DAY_STATE.LOCKED;
  if (day === live) return DAY_STATE.TODAY;
  return DAY_STATE.AVAILABLE;
}

// ── streaks ───────────────────────────────────────────────────────────────
// Counted over DAY NUMBERS actually completed, not over login dates or write
// timestamps. Two consequences, both intended:
//   - Catching up counts. Completing days 5, 6 and 7 in one sitting is a
//     3-streak, because the work is what the streak measures.
//   - It cannot be farmed. Re-saving the same day, or opening the app daily
//     without finishing anything, moves nothing.
// The streak is "current" only if it reaches today or yesterday; otherwise the
// run has moved past the user and the streak is broken, which is the honest
// reading and the thing that makes keeping it feel like it matters.
export function computeStreaks(completedDays, now = new Date()) {
  const days = Object.keys(completedDays || {}).map(Number).filter(Number.isInteger).sort((a, b) => a - b);
  if (!days.length) return { current: 0, longest: 0, total: 0 };

  let longest = 1, run = 1;
  for (let i = 1; i < days.length; i++) {
    run = days[i] === days[i - 1] + 1 ? run + 1 : 1;
    if (run > longest) longest = run;
  }

  const live = currentDay(now);
  const last = days[days.length - 1];
  let current = 0;
  if (last >= live - 1) {
    current = 1;
    for (let i = days.length - 1; i > 0; i--) {
      if (days[i] === days[i - 1] + 1) current++; else break;
    }
  }
  return { current, longest, total: days.length };
}

// ── content ───────────────────────────────────────────────────────────────
// Two shapes on purpose. The journey grid needs 100 cards at once, and pulling
// 100 full day documents (each carrying problem statements, both approaches,
// key points and follow-ups) to render a grid of titles would be roughly half a
// megabyte for a screen that shows none of it. The importer therefore also
// writes ONE index document holding just what a card needs; the workspace
// fetches the single full day when you open it.
export const DEVERT100_DAYS = "devert100_days";
export const DEVERT100_META = "devert100_meta";
export const DEVERT100_PARTICIPANTS = "devert100_participants";

export async function fetchDayIndex() {
  const snap = await getDoc(doc(db, DEVERT100_META, "index"));
  return snap.exists() ? (snap.data().days || []) : [];
}

export async function fetchDay(day) {
  const snap = await getDoc(doc(db, DEVERT100_DAYS, String(day)));
  return snap.exists() ? { day: Number(day), ...snap.data() } : null;
}

// Admin/debug only - the app never needs all 100 full documents at once.
export async function fetchAllDays() {
  const snap = await getDocs(query(collection(db, DEVERT100_DAYS), orderBy("day")));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export function mainProblem(dayDoc) {
  if (!dayDoc?.problems?.length) return null;
  return dayDoc.problems.find(p => p.type === "Main") || dayDoc.problems[0];
}

export function bonusProblems(dayDoc) {
  return (dayDoc?.problems || []).filter(p => p.type !== "Main");
}

// The problem's catalogue number, as a developer would say it out loud: "LC
// 283". It is the fastest way to recognise a problem you have seen before, so
// it belongs anywhere the title appears.
//
// 104 of the 112 problems have a real number. The 8 GFG-only ones carry "-" in
// the sheet's LC column, because they have no LeetCode number to carry - those
// fall back to the platform name rather than rendering "LC -". Nothing is
// invented: if there is no number, none is shown.
export function problemLabel(problem) {
  if (!problem) return "";
  const n = String(problem.problemNumber || "").trim();
  const hasNumber = /^\d+$/.test(n);
  if (hasNumber) return `LC ${n}`;
  // "LeetCode / GFG" without a number would read oddly as a badge; take the
  // first platform named and leave it at that.
  return String(problem.platform || "").split("/")[0].trim();
}

// ── video solutions ───────────────────────────────────────────────────────
// THE SOURCE SPREADSHEET HAS NO VIDEO LINKS. Not one of the 112 rows carries a
// URL to a walkthrough, so there is nothing to import and nothing that could be
// imported without making it up.
//
// So this resolves in two steps, and the UI must label them differently:
//
//   curated: true   an admin filled in videoUrl on that problem. A specific
//                   video someone chose. Say "Video solution".
//   curated: false  nobody has. We hand over a YouTube SEARCH built from the
//                   problem's own name and number, which is exactly what a
//                   developer would type. Say "Search YouTube" - calling a
//                   search a solution would be a small lie that costs trust the
//                   first time the top result is wrong.
//
// The field is read straight off the problem, so curating one is a content
// edit (admin write to devert100_days) and needs no code change.
export function videoSearchUrl(problem) {
  if (!problem?.name) return "";
  const n = String(problem.problemNumber || "").trim();
  const q = [problem.name, /^\d+$/.test(n) ? `leetcode ${n}` : problem.platform, "solution explained"]
    .filter(Boolean).join(" ");
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
}

export function problemVideo(problem) {
  if (!problem) return null;
  const curated = String(problem.videoUrl || "").trim();
  if (/^https?:\/\//.test(curated)) return { url: curated, curated: true, label: "Video solution" };
  const search = videoSearchUrl(problem);
  return search ? { url: search, curated: false, label: "Search YouTube" } : null;
}

// ── participation ─────────────────────────────────────────────────────────
export function subscribeToParticipant(uid, callback) {
  if (!uid) { callback(null); return () => {}; }
  return onSnapshot(
    doc(db, DEVERT100_PARTICIPANTS, uid),
    snap => callback(snap.exists() ? { uid, ...snap.data() } : null),
    () => callback(null),
  );
}

export async function fetchParticipant(uid) {
  if (!uid) return null;
  const snap = await getDoc(doc(db, DEVERT100_PARTICIPANTS, uid));
  return snap.exists() ? { uid, ...snap.data() } : null;
}

// Idempotent: joining twice must not reset someone's progress back to zero.
// merge:true plus a read-first guard rather than a blind set - the guard is
// what protects joinedAt and completedDays, and merge is what keeps a
// half-written document from losing fields if this races with itself.
export async function joinDevert100(uid) {
  if (!uid) throw new Error("Sign in to join DeVert 100.");
  const ref = doc(db, DEVERT100_PARTICIPANTS, uid);
  const existing = await getDoc(ref);
  if (existing.exists()) return { uid, ...existing.data(), alreadyJoined: true };

  await setDoc(ref, {
    uid,
    joinedAt: serverTimestamp(),
    joinedOnDay: currentDay(),
    status: "active",
    completedDays: {},
    totalCompleted: 0,
    updatedAt: serverTimestamp(),
  }, { merge: true });
  return { uid, alreadyJoined: false };
}

// Marking a day complete.
//
// IDEMPOTENT BY CONSTRUCTION. Re-completing an already-completed day returns
// early and writes nothing, so a double-click, a retried request or a user
// revisiting an old day can never double-count. This matters beyond tidiness:
// totalCompleted drives the public "N days done" figure.
//
// It writes ONE dotted key (completedDays.27) rather than the whole map, so two
// days completed from two tabs cannot clobber each other - and so the security
// rule can prove the write only ever ADDS a key. See firestore.rules: the owner
// may add to completedDays but never remove from it.
export async function completeDay(uid, day, { confidence = null, minutes = null, notes = "" } = {}) {
  if (!uid) throw new Error("Sign in to record progress.");
  const n = Number(day);
  if (!Number.isInteger(n) || n < 1 || n > DEVERT100_TOTAL_DAYS) throw new Error(`Day ${day} is not part of this run.`);
  if (n > currentDay()) throw new Error(`Day ${n} has not unlocked yet.`);

  const ref = doc(db, DEVERT100_PARTICIPANTS, uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Join DeVert 100 before recording a day.");
  if (snap.data().completedDays?.[String(n)]) return { alreadyComplete: true };

  await updateDoc(ref, {
    [`completedDays.${n}`]: {
      completedAt: new Date().toISOString(),
      // Null rather than a default: an unanswered "how confident were you?" is
      // not the same as 3/5, and averaging invented middles would quietly
      // flatten the only self-assessment signal the run collects.
      confidence: confidence === null ? null : Number(confidence),
      minutes: minutes === null ? null : Number(minutes),
      notes: String(notes || "").slice(0, 2000),
    },
    totalCompleted: increment(1),
    lastCompletedDay: n,
    updatedAt: serverTimestamp(),
  });
  return { alreadyComplete: false };
}

// Personal notes/confidence on an ALREADY completed day. Separate from
// completeDay so editing a note can never touch totalCompleted.
export async function updateDayReflection(uid, day, { confidence = null, minutes = null, notes = "" } = {}) {
  if (!uid) throw new Error("Sign in to record progress.");
  const n = Number(day);
  const ref = doc(db, DEVERT100_PARTICIPANTS, uid);
  const snap = await getDoc(ref);
  const existing = snap.exists() ? snap.data().completedDays?.[String(n)] : null;
  if (!existing) throw new Error("Complete this day first.");
  await updateDoc(ref, {
    [`completedDays.${n}`]: {
      ...existing,
      confidence: confidence === null ? null : Number(confidence),
      minutes: minutes === null ? null : Number(minutes),
      notes: String(notes || "").slice(0, 2000),
    },
    updatedAt: serverTimestamp(),
  });
}

// ── derived progress ──────────────────────────────────────────────────────
// One place that turns a participant document plus the calendar into every
// number the dashboard shows, so the card, the dashboard and the share image
// can never disagree about what day it is or how far along someone is.
export function progressSummary(participant, now = new Date()) {
  const completedDays = participant?.completedDays || {};
  const { current, longest, total } = computeStreaks(completedDays, now);
  const live = currentDay(now);
  return {
    joined: !!participant,
    runDay: live,
    started: hasRunStarted(now),
    ended: hasRunEnded(now),
    completed: total,
    remaining: DEVERT100_TOTAL_DAYS - total,
    percent: Math.round((total / DEVERT100_TOTAL_DAYS) * 100),
    currentStreak: current,
    longestStreak: longest,
    // Days that have unlocked but were never finished. The honest number, and
    // the one worth surfacing - "3 missed" is actionable in a way that
    // "27% complete" is not.
    missed: Math.max(0, live - total),
    isComplete: total >= DEVERT100_TOTAL_DAYS,
  };
}

// Topic and difficulty breakdowns, computed from the lightweight index so the
// dashboard never pulls 100 full documents to draw two bar charts.
export function breakdowns(dayIndex, completedDays) {
  const done = completedDays || {};
  const byTopic = {};
  const byDifficulty = {};
  for (const entry of dayIndex || []) {
    const t = entry.topic || "Other";
    const d = entry.difficulty || "Unrated";
    byTopic[t] = byTopic[t] || { total: 0, completed: 0 };
    byDifficulty[d] = byDifficulty[d] || { total: 0, completed: 0 };
    byTopic[t].total++;
    byDifficulty[d].total++;
    if (done[String(entry.day)]) { byTopic[t].completed++; byDifficulty[d].completed++; }
  }
  return { byTopic, byDifficulty };
}
