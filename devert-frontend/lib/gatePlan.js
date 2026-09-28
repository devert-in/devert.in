import { db } from "@/lib/firebase";
import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, onSnapshot,
  addDoc, writeBatch, serverTimestamp, deleteField,
} from "firebase/firestore";

// GATE 2027 Plan - the 96-day CS + DA preparation cohort.
//
// Source: GATE/GATE_2027_Daily_Resources_Planner.xlsx (the day cards, formula
// bank, resources) via scripts/extract-gate-plan.mjs -> import-gate-plan.mjs,
// and GATE/GATE_2027_CS_DA_Preparation_Plan_v3_3.5h.pdf (the strategy around
// them), hand-transcribed into lib/gatePlanGuide.js.
//
// THREE THINGS TO UNDERSTAND FIRST:
//
//   1. IT IS A COHORT, like DeVert 100 (lib/devert100.js). Day N is the same
//      calendar date for everyone. Someone approved on day 30 starts ON day 30;
//      days before that are backlog, never "missed".
//
//   2. ACCESS IS BY REQUEST, NOT BY JOINING. A student files a request
//      (gate_plan_requests/{uid}); the platform admin approves it, which
//      creates gate_plan_members/{uid}. Only a member with access "active" can
//      read the day cards, the formula bank and the resources - and that is
//      enforced in firestore.rules (isGatePlanMember()), not just hidden here.
//      The public can read gate_plan_meta/index: the outline of what the plan
//      covers, which is what someone needs to decide whether to ask for a seat.
//
//   3. NOTHING HERE GRADES ANYTHING. The plan points at PYQs on GATE Overflow;
//      it contains no questions and no answers. Scores are the student's own
//      "correct / attempted" count, exactly as the workbook's yellow cells
//      were. Accuracy is derived from what they typed, and the UI says so.

// D0. Sun 27 Sep 2026, the setup day; D95 is Thu 31 Dec 2026. The workbook's
// dates, the PDF's dates and every weekday label agree on this (the extractor
// asserts it). Changing it moves every day for everyone.
export const GATE_PLAN_START = "2026-09-27";
export const GATE_PLAN_LAST_DAY = 95;
export const GATE_PLAN_TOTAL_DAYS = 96; // D0..D95
export const HOURS_PER_DAY = 3.5;

// Cohort boundaries roll at IST midnight - same reasoning as DeVert 100: on UTC
// the day would flip at 05:30 IST and a 1 AM study session would land on the
// wrong day.
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

function istDayIndex(date) {
  return Math.floor((date.getTime() + IST_OFFSET_MS) / DAY_MS);
}
function startDayIndex() {
  const [y, m, d] = GATE_PLAN_START.split("-").map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / DAY_MS);
}

// Raw plan day for an instant: <0 before D0, >95 after the plan.
export function planDayOn(now = new Date()) {
  return istDayIndex(now) - startDayIndex();
}

// The live day clamped into the plan, or -1 before it starts.
export function currentPlanDay(now = new Date()) {
  const n = planDayOn(now);
  if (n < 0) return -1;
  return Math.min(n, GATE_PLAN_LAST_DAY);
}
export const hasPlanStarted = (now = new Date()) => planDayOn(now) >= 0;
export const hasPlanEnded = (now = new Date()) => planDayOn(now) > GATE_PLAN_LAST_DAY;

export function dateForPlanDay(day) {
  return new Date((startDayIndex() + day) * DAY_MS);
}

// en-GB for the same reason as DeVert 100: en-IN writes "Sept", which makes a
// grid of date labels visibly ragged.
export function formatPlanDate(day, opts = {}) {
  return dateForPlanDay(day).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", ...(opts.year ? { year: "numeric" } : {}),
    ...(opts.weekday ? { weekday: "short" } : {}), timeZone: "UTC",
  });
}

export const dayLabel = (day) => `D${day}`;

// ── vocabulary ────────────────────────────────────────────────────────────

// Mirrors the workbook's own Status dropdown (Daily Plan column V):
// Not started / In progress / Done / Missed / Moved to Sunday. "Not started" is
// the absence of a log, not a stored value.
export const LOG_STATUS = {
  IN_PROGRESS: "in-progress",
  DONE: "done",
  MISSED: "missed",
  MOVED: "moved",
};
export const LOG_STATUS_LABEL = {
  "not-started": "Not started",
  "in-progress": "In progress",
  done: "Done",
  missed: "Missed",
  moved: "Moved to Sunday",
};

export const PAPER_LABEL = { BOTH: "Both papers", CS: "CS only", DA: "DA only" };
export const DAY_TYPE_LABEL = { setup: "Setup", topic: "Topic day", sunday: "Sunday test", lockin: "Lock-in" };

// Week keys as the workbook writes them, in plan order.
export const WEEK_KEYS = ["Start", ...Array.from({ length: 13 }, (_, i) => `W${i + 1}`), "Lock-in"];
export const weekNumber = (key) => (/^W(\d+)$/.test(key || "") ? Number(key.slice(1)) : null);

// The workbook's colour rule, verbatim: green at >= 75%, amber 60-75%, red
// below 60%. Returned as a band name so each app maps it to its own palette.
export function accuracyBand(pct) {
  if (pct == null || Number.isNaN(pct)) return "none";
  if (pct >= 75) return "good";
  if (pct >= 60) return "warn";
  return "bad";
}

export function pct(correct, attempted) {
  const a = Number(attempted) || 0;
  if (a <= 0) return null;
  return Math.round((100 * (Number(correct) || 0)) / a);
}

// ── day states ────────────────────────────────────────────────────────────
// A day is UPCOMING purely by calendar. Unlike DeVert 100, an upcoming day's
// card is still READABLE by a member: this is a study plan whose whole PDF
// hands the student every day up front, and seeing Friday's topic on Monday is
// how someone plans their week. What the calendar gates is LOGGING - you cannot
// record a score for a day that has not happened.
export const DAY_STATE = { DONE: "done", TODAY: "today", OPEN: "open", UPCOMING: "upcoming" };

export function planDayState(day, logs, now = new Date()) {
  const live = currentPlanDay(now);
  if (logs?.[String(day)]?.status === LOG_STATUS.DONE) return DAY_STATE.DONE;
  if (live < 0 || day > live) return DAY_STATE.UPCOMING;
  if (day === live && !hasPlanEnded(now)) return DAY_STATE.TODAY;
  return DAY_STATE.OPEN;
}

export const canLogDay = (day, now = new Date()) => Number.isInteger(day) && day >= 0 && day <= GATE_PLAN_LAST_DAY && day <= planDayOn(now);

// ── collections ───────────────────────────────────────────────────────────

export const GATE_PLAN_DAYS = "gate_plan_days";
export const GATE_PLAN_CONTENT = "gate_plan_content";
export const GATE_PLAN_META = "gate_plan_meta";
export const GATE_PLAN_REQUESTS = "gate_plan_requests";
export const GATE_PLAN_MEMBERS = "gate_plan_members";

// ── public content ────────────────────────────────────────────────────────

export async function fetchPlanIndex() {
  const snap = await getDoc(doc(db, GATE_PLAN_META, "index"));
  return snap.exists() ? (snap.data().days || []) : [];
}

export function subscribeToPlanSettings(callback) {
  return onSnapshot(
    doc(db, GATE_PLAN_META, "settings"),
    snap => callback(normaliseSettings(snap.exists() ? snap.data() : {})),
    () => callback(normaliseSettings({})),
  );
}

// A missing settings document means "requests open, no notice" - the same
// default firestore.rules applies, so the form and the rule never disagree.
function normaliseSettings(d) {
  return {
    requestsOpen: d.requestsOpen !== false,
    notice: String(d.notice || ""),
    noticeUpdatedAt: d.noticeUpdatedAt || null,
    closedMessage: String(d.closedMessage || ""),
  };
}

export async function updatePlanSettings(patch) {
  const clean = {};
  if ("requestsOpen" in patch) clean.requestsOpen = !!patch.requestsOpen;
  if ("notice" in patch) { clean.notice = String(patch.notice || "").slice(0, 1000); clean.noticeUpdatedAt = serverTimestamp(); }
  if ("closedMessage" in patch) clean.closedMessage = String(patch.closedMessage || "").slice(0, 400);
  await setDoc(doc(db, GATE_PLAN_META, "settings"), { ...clean, updatedAt: serverTimestamp() }, { merge: true });
}

// ── member-only content ───────────────────────────────────────────────────
// Each of these REJECTS for a non-member (permission-denied from the rules).
// Callers treat that as "not a member", never as an outage.

export async function fetchPlanDay(day) {
  const snap = await getDoc(doc(db, GATE_PLAN_DAYS, String(day)));
  return snap.exists() ? { ...snap.data(), day: Number(day) } : null;
}

export async function fetchFormulaBank() {
  const snap = await getDoc(doc(db, GATE_PLAN_CONTENT, "formulas"));
  return snap.exists() ? (snap.data().rows || []) : [];
}

export async function fetchPlanResources() {
  const snap = await getDoc(doc(db, GATE_PLAN_CONTENT, "resources"));
  return snap.exists() ? snap.data() : null;
}

// ── requests ──────────────────────────────────────────────────────────────

export const REQUEST_STATUS = { PENDING: "pending", APPROVED: "approved", REJECTED: "rejected", REVOKED: "revoked" };

// Where the student is now. Kept to a fixed list so the admin queue can filter
// by it, and so the rule can validate it (firestore.rules lists the same keys).
export const REQUEST_STAGES = [
  { value: "pre-final", label: "Pre-final year student" },
  { value: "final-year", label: "Final year student" },
  { value: "graduate", label: "Graduated, preparing full time" },
  { value: "working", label: "Working professional" },
  { value: "other", label: "Other" },
];
export const REQUEST_PAPERS = [
  { value: "BOTH", label: "CS + DA (both papers)" },
  { value: "CS", label: "CS only" },
  { value: "DA", label: "DA only" },
];
export const REQUEST_ATTEMPTS = [
  { value: "first", label: "First attempt" },
  { value: "repeat", label: "Attempted before" },
];

// cleanRequest() below emits exactly the field set a student may write -
// firestore.rules' gate_plan_requests keys().hasOnly(...) lists the same keys
// (plus uid/status/timestamps), so adding a field means changing both.

export const REQUEST_LIMITS = { name: 80, email: 120, college: 120, gradYear: 4, prevScore: 40, goal: 600 };

function cleanRequest(form) {
  const s = (k) => String(form[k] ?? "").trim().slice(0, REQUEST_LIMITS[k] || 200);
  return {
    name: s("name"),
    email: s("email"),
    papers: ["CS", "DA", "BOTH"].includes(form.papers) ? form.papers : "BOTH",
    stage: REQUEST_STAGES.some(x => x.value === form.stage) ? form.stage : "other",
    college: s("college"),
    gradYear: s("gradYear"),
    attempt: form.attempt === "repeat" ? "repeat" : "first",
    prevScore: form.attempt === "repeat" ? s("prevScore") : "",
    hoursOk: form.hoursOk === true,
    goal: s("goal"),
  };
}

export function validateRequest(form) {
  const c = cleanRequest(form);
  if (!c.name) return "Add your name.";
  if (!c.hoursOk) return "The plan needs 3.5 hours every day. Tick the commitment to continue.";
  if (c.gradYear && !/^\d{4}$/.test(c.gradYear)) return "Graduation year should be four digits, e.g. 2027.";
  return "";
}

export function subscribeToRequest(uid, callback) {
  if (!uid) { callback(null); return () => {}; }
  return onSnapshot(
    doc(db, GATE_PLAN_REQUESTS, uid),
    snap => callback(snap.exists() ? { uid, ...snap.data() } : null),
    () => callback(null),
  );
}

// Create, or re-submit after a rejection. The rule allows the owner to write
// only while the request is pending or rejected, and only ever to "pending" -
// so a student can never approve themselves, and an approved/revoked request
// is frozen from their side.
export async function submitJoinRequest(uid, form) {
  if (!uid) throw new Error("Sign in to request a seat.");
  const problem = validateRequest(form);
  if (problem) throw new Error(problem);
  const ref = doc(db, GATE_PLAN_REQUESTS, uid);
  const existing = await getDoc(ref);
  const data = cleanRequest(form);
  if (!existing.exists()) {
    await setDoc(ref, {
      uid, ...data, status: REQUEST_STATUS.PENDING, requestedOnDay: currentPlanDay(),
      createdAt: serverTimestamp(), updatedAt: serverTimestamp(), submissions: 1,
    });
    return;
  }
  const status = existing.data().status;
  if (status !== REQUEST_STATUS.PENDING && status !== REQUEST_STATUS.REJECTED) {
    throw new Error("This request has already been decided.");
  }
  await updateDoc(ref, {
    ...data, status: REQUEST_STATUS.PENDING, updatedAt: serverTimestamp(),
    requestedOnDay: currentPlanDay(),
    submissions: (Number(existing.data().submissions) || 1) + (status === REQUEST_STATUS.REJECTED ? 1 : 0),
  });
}

export async function withdrawJoinRequest(uid) {
  await deleteDoc(doc(db, GATE_PLAN_REQUESTS, uid));
}

// ── membership ────────────────────────────────────────────────────────────

export function subscribeToMembership(uid, callback) {
  if (!uid) { callback(null); return () => {}; }
  return onSnapshot(
    doc(db, GATE_PLAN_MEMBERS, uid),
    snap => callback(snap.exists() ? { uid, ...snap.data() } : null),
    () => callback(null),
  );
}

export const isActiveMember = (m) => !!m && m.access === "active";

// ── admin actions ─────────────────────────────────────────────────────────
// All of these need isAdmin() in firestore.rules; for anyone else they fail
// with permission-denied. They live here, not in the admin panel, so the one
// place that knows a member document's shape is this file.

export async function fetchAllRequests() {
  const snap = await getDocs(collection(db, GATE_PLAN_REQUESTS));
  return snap.docs.map(d => ({ uid: d.id, ...d.data() }));
}

export async function fetchAllMembers() {
  const snap = await getDocs(collection(db, GATE_PLAN_MEMBERS));
  return snap.docs.map(d => ({ uid: d.id, ...d.data() }));
}

// The notification is best-effort: a failed bell write must never undo, or
// block, an approval that already committed.
async function notify(targetUid, payload) {
  try {
    await addDoc(collection(db, "notifications"), {
      targetUid, ctaHref: null, ctaLabel: null, ...payload, createdAt: serverTimestamp(),
    });
  } catch { /* best effort */ }
}

const PLAN_URL = "https://campus.devert.in/gate?section=plan";

// Approve = one batch: the request flips to approved AND the member document is
// created, so there is no window where one exists without the other.
// approvedOnDay is today's plan day (or 0 before D0): it is what "missed since
// you joined" counts from, so a day-30 approval never greets anyone with 30
// misses.
export async function approveRequest(request, adminUid) {
  const uid = request.uid;
  const batch = writeBatch(db);
  const onDay = Math.max(0, currentPlanDay());
  batch.update(doc(db, GATE_PLAN_REQUESTS, uid), {
    status: REQUEST_STATUS.APPROVED, reviewedAt: serverTimestamp(), reviewedBy: adminUid || null,
    reviewNote: deleteField(), updatedAt: serverTimestamp(),
  });
  // merge: a member who was revoked and is being re-approved keeps every log
  // they already wrote.
  batch.set(doc(db, GATE_PLAN_MEMBERS, uid), {
    uid, access: "active",
    name: request.name || "", email: request.email || "", papers: request.papers || "BOTH",
    college: request.college || "", stage: request.stage || "",
    approvedAt: serverTimestamp(), approvedBy: adminUid || null, approvedOnDay: onDay,
    updatedAt: serverTimestamp(),
  }, { merge: true });
  await batch.commit();
  await notify(uid, {
    type: "approval",
    title: "You're in the GATE 2027 Plan",
    body: `Your request was approved. Day ${onDay} is live - open today's card and start the 3.5-hour routine.`,
    ctaHref: PLAN_URL, ctaLabel: "Open the plan",
  });
}

export async function rejectRequest(uid, note, adminUid) {
  await updateDoc(doc(db, GATE_PLAN_REQUESTS, uid), {
    status: REQUEST_STATUS.REJECTED, reviewNote: String(note || "").slice(0, 500),
    reviewedAt: serverTimestamp(), reviewedBy: adminUid || null, updatedAt: serverTimestamp(),
  });
  await notify(uid, {
    type: "rejection",
    title: "GATE 2027 Plan request not approved",
    body: note ? `Note from the admin: ${String(note).slice(0, 200)}` : "Your request was not approved this time. You can update it and apply again.",
    ctaHref: PLAN_URL, ctaLabel: "View request",
  });
}

// Revoke keeps the member document (and every log in it) and just closes the
// door, so restoring access is lossless.
export async function revokeMember(uid, note, adminUid) {
  const batch = writeBatch(db);
  batch.update(doc(db, GATE_PLAN_MEMBERS, uid), {
    access: "revoked", revokedAt: serverTimestamp(), revokedBy: adminUid || null,
    revokeNote: String(note || "").slice(0, 500), updatedAt: serverTimestamp(),
  });
  batch.set(doc(db, GATE_PLAN_REQUESTS, uid), {
    uid, status: REQUEST_STATUS.REVOKED, reviewNote: String(note || "").slice(0, 500),
    reviewedAt: serverTimestamp(), reviewedBy: adminUid || null, updatedAt: serverTimestamp(),
  }, { merge: true });
  await batch.commit();
}

export async function restoreMember(uid, adminUid) {
  const batch = writeBatch(db);
  batch.update(doc(db, GATE_PLAN_MEMBERS, uid), {
    access: "active", revokedAt: deleteField(), revokedBy: deleteField(), revokeNote: deleteField(),
    restoredAt: serverTimestamp(), restoredBy: adminUid || null, updatedAt: serverTimestamp(),
  });
  batch.set(doc(db, GATE_PLAN_REQUESTS, uid), {
    uid, status: REQUEST_STATUS.APPROVED, reviewNote: deleteField(),
    reviewedAt: serverTimestamp(), reviewedBy: adminUid || null, updatedAt: serverTimestamp(),
  }, { merge: true });
  await batch.commit();
}

// ── the daily log ─────────────────────────────────────────────────────────
// One dotted key per day (logs.27), so two days saved from two tabs cannot
// clobber each other. Logs are EDITABLE - unlike DeVert 100's monotonic
// completedDays - because the plan's own contract moves a missed weekday to
// Sunday and then marks it done, so a status has to be able to change. That is
// safe because nothing reads these numbers for coins, XP or payouts; they are
// the student's own record. If that ever changes, this needs the bounded-delta
// treatment CLAUDE.md describes, not a UI guard.

const n = (v, max = 999) => {
  if (v === "" || v == null) return null;
  const x = Math.round(Number(v));
  return Number.isFinite(x) ? Math.max(0, Math.min(max, x)) : null;
};

export function cleanLog(log) {
  const status = Object.values(LOG_STATUS).includes(log.status) ? log.status : LOG_STATUS.IN_PROGRESS;
  const out = {
    status,
    topicCorrect: n(log.topicCorrect), topicAttempted: n(log.topicAttempted),
    eveningCorrect: n(log.eveningCorrect), eveningAttempted: n(log.eveningAttempted),
    gaCorrect: n(log.gaCorrect), gaAttempted: n(log.gaAttempted),
    hours: log.hours === "" || log.hours == null ? null : Math.max(0, Math.min(16, Math.round(Number(log.hours) * 4) / 4)) || null,
    mistake: String(log.mistake || "").slice(0, 1500),
    weakest: String(log.weakest || "").slice(0, 200),
    repair: String(log.repair || "").slice(0, 400),
  };
  // A correct count above its attempted count is a typo, not a score - clamp
  // it rather than let a 12/10 day push the week above 100%.
  for (const k of ["topic", "evening", "ga"]) {
    if (out[`${k}Correct`] != null && out[`${k}Attempted`] != null && out[`${k}Correct`] > out[`${k}Attempted`]) {
      out[`${k}Correct`] = out[`${k}Attempted`];
    }
  }
  return out;
}

export async function saveDayLog(uid, day, log) {
  if (!uid) throw new Error("Sign in to log a day.");
  const d = Number(day);
  if (!canLogDay(d)) throw new Error(`D${day} has not happened yet - you can log it on ${formatPlanDate(d)}.`);
  await updateDoc(doc(db, GATE_PLAN_MEMBERS, uid), {
    [`logs.${d}`]: { ...cleanLog(log), loggedAt: new Date().toISOString() },
    lastLoggedDay: d,
    updatedAt: serverTimestamp(),
  });
}

export async function clearDayLog(uid, day) {
  await updateDoc(doc(db, GATE_PLAN_MEMBERS, uid), {
    [`logs.${Number(day)}`]: deleteField(), updatedAt: serverTimestamp(),
  });
}

// Topic checklist (PDF section 13): four ticks per item - Learned, PYQs, 70%,
// Revised. Stored as checklist.<itemId> = { learn, pyqs, seventy, rev }.
export const CHECK_COLUMNS = [
  { key: "learn", label: "Learned", hint: "Lecture + notes" },
  { key: "pyqs", label: "PYQs", hint: "Topic-wise set done" },
  { key: "seventy", label: "70%", hint: "Accuracy reached" },
  { key: "rev", label: "Revised", hint: "Evening slot, Sunday test or lock-in" },
];

export async function setChecklistItem(uid, itemId, cols) {
  const clean = Object.fromEntries(CHECK_COLUMNS.map(c => [c.key, !!cols[c.key]]));
  await updateDoc(doc(db, GATE_PLAN_MEMBERS, uid), {
    [`checklist.${itemId}`]: clean, updatedAt: serverTimestamp(),
  });
}

// ── derived progress ──────────────────────────────────────────────────────
// ONE function turns a member document plus the calendar into every number a
// dashboard shows - used by the student's own view AND the admin console, so
// the two can never disagree about someone's streak or misses.

function sum(logs, key) {
  return logs.reduce((t, l) => t + (Number(l?.[key]) || 0), 0);
}

export function planSummary(member, now = new Date()) {
  const logs = member?.logs || {};
  const live = currentPlanDay(now);
  const started = hasPlanStarted(now);
  const ended = hasPlanEnded(now);
  const entries = Object.entries(logs).map(([k, v]) => [Number(k), v]).filter(([k]) => Number.isInteger(k));
  const done = entries.filter(([, v]) => v?.status === LOG_STATUS.DONE).map(([k]) => k).sort((a, b) => a - b);
  const doneSet = new Set(done);
  const moved = entries.filter(([, v]) => v?.status === LOG_STATUS.MOVED).length;

  // Missed counts from the day they were APPROVED, not from D0 - see the
  // header. Everything before is backlog: optional and never a debt.
  const joinedOn = Math.min(Math.max(Number(member?.approvedOnDay) || 0, 0), GATE_PLAN_LAST_DAY);
  // "Unlocked" excludes today: today is not missed while it is still today.
  const lastClosed = ended ? GATE_PLAN_LAST_DAY : live - 1;
  let missed = 0;
  for (let d = joinedOn; d <= lastClosed; d++) {
    const st = logs[String(d)]?.status;
    if (st !== LOG_STATUS.DONE && st !== LOG_STATUS.MOVED) missed++;
  }
  const backlogTotal = joinedOn;
  const backlogDone = done.filter(d => d < joinedOn).length;

  // Streak = consecutive DONE days. Current only if it reaches today or
  // yesterday - today still being open does not break it.
  let longest = 0, run = 0, prev = null;
  for (const d of done) { run = prev !== null && d === prev + 1 ? run + 1 : 1; longest = Math.max(longest, run); prev = d; }
  let current = 0;
  const anchor = doneSet.has(live) ? live : doneSet.has(live - 1) ? live - 1 : null;
  if (anchor !== null) { for (let d = anchor; doneSet.has(d); d--) current++; }

  // "Never miss twice" (the daily contract, rule 6): the two most recent
  // closed days since joining both lack a Done/Moved log.
  const closedSinceJoin = [lastClosed, lastClosed - 1].filter(d => d >= joinedOn && d >= 0);
  const missedTwice = closedSinceJoin.length === 2 && closedSinceJoin.every(d => {
    const st = logs[String(d)]?.status;
    return st !== LOG_STATUS.DONE && st !== LOG_STATUS.MOVED;
  });

  const all = entries.map(([, v]) => v);
  const topicA = sum(all, "topicAttempted"), topicC = sum(all, "topicCorrect");
  const eveA = sum(all, "eveningAttempted"), eveC = sum(all, "eveningCorrect");
  const gaA = sum(all, "gaAttempted"), gaC = sum(all, "gaCorrect");
  const hours = all.reduce((t, l) => t + (Number(l?.hours) || 0), 0);

  return {
    live, started, ended, joinedOnDay: joinedOn,
    done: done.length, doneDays: done, moved, missed, missedTwice,
    percent: Math.round((100 * done.length) / GATE_PLAN_TOTAL_DAYS),
    remaining: GATE_PLAN_TOTAL_DAYS - done.length,
    currentStreak: current, longestStreak: longest,
    backlogTotal, backlogDone, backlogLeft: Math.max(0, backlogTotal - backlogDone),
    topic: { correct: topicC, attempted: topicA, pct: pct(topicC, topicA) },
    evening: { correct: eveC, attempted: eveA, pct: pct(eveC, eveA) },
    ga: { correct: gaC, attempted: gaA, pct: pct(gaC, gaA) },
    overall: { correct: topicC + eveC + gaC, attempted: topicA + eveA + gaA, pct: pct(topicC + eveC + gaC, topicA + eveA + gaA) },
    pyqsSolved: topicA + eveA,
    hoursLogged: Math.round(hours * 10) / 10,
    lastLoggedAt: all.reduce((m, l) => (l?.loggedAt && l.loggedAt > m ? l.loggedAt : m), ""),
    isComplete: done.length >= GATE_PLAN_TOTAL_DAYS,
  };
}

// The workbook's "Weekly Tracker" sheet, computed rather than formula'd.
export function weeklyTracker(index, logs, now = new Date()) {
  const live = currentPlanDay(now);
  return WEEK_KEYS.map(key => {
    const days = (index || []).filter(d => d.week === key);
    const ls = days.map(d => logs?.[String(d.day)]).filter(Boolean);
    const count = (st) => ls.filter(l => l.status === st).length;
    const tA = sum(ls, "topicAttempted"), tC = sum(ls, "topicCorrect");
    const eA = sum(ls, "eveningAttempted"), eC = sum(ls, "eveningCorrect");
    const gA = sum(ls, "gaAttempted"), gC = sum(ls, "gaCorrect");
    const first = days[0]?.day, last = days[days.length - 1]?.day;
    return {
      key, days, first, last,
      planned: days.length, done: count(LOG_STATUS.DONE), missed: count(LOG_STATUS.MISSED), moved: count(LOG_STATUS.MOVED),
      completion: days.length ? Math.round((100 * count(LOG_STATUS.DONE)) / days.length) : 0,
      topic: pct(tC, tA), topicC: tC, topicA: tA,
      evening: pct(eC, eA), eveningC: eC, eveningA: eA,
      ga: pct(gC, gA), gaC: gC, gaA: gA,
      targetHours: days.length * HOURS_PER_DAY,
      hours: Math.round(ls.reduce((t, l) => t + (Number(l.hours) || 0), 0) * 10) / 10,
      state: first == null ? "empty" : live < first ? "upcoming" : live > last ? "past" : "current",
      signOff: ls.find(l => l.weakest || l.repair) || null,
    };
  }).filter(w => w.planned > 0);
}

// Topic-PYQ accuracy by subject, from the logs. Only subjects that have been
// attempted appear - an empty bar for a subject not reached yet reads as 0%.
export function subjectAccuracy(index, logs) {
  const by = {};
  for (const d of index || []) {
    if (d.type !== "topic") continue;
    const l = logs?.[String(d.day)];
    const s = (by[d.subject] = by[d.subject] || { subject: d.subject, paper: d.paper, days: 0, done: 0, correct: 0, attempted: 0 });
    s.days++;
    if (l?.status === LOG_STATUS.DONE) s.done++;
    s.correct += Number(l?.topicCorrect) || 0;
    s.attempted += Number(l?.topicAttempted) || 0;
  }
  return Object.values(by).map(s => ({ ...s, pct: pct(s.correct, s.attempted) }));
}

// Topics that need the repair loop: attempted, and under the plan's 60% red
// line. Sorted worst first. This is the "list of your weak topics" the PDF
// says you should hold by Dec 31.
export function weakTopics(index, logs, threshold = 60) {
  return (index || [])
    .filter(d => d.type === "topic")
    .map(d => {
      const l = logs?.[String(d.day)];
      return { ...d, correct: Number(l?.topicCorrect) || 0, attempted: Number(l?.topicAttempted) || 0, pct: pct(l?.topicCorrect, l?.topicAttempted) };
    })
    .filter(d => d.pct != null && d.pct < threshold)
    .sort((a, b) => a.pct - b.pct);
}

// Admin status for one member, from the same summary they see.
export function memberStatus(s, access) {
  if (access === "revoked") return { key: "revoked", label: "Revoked" };
  if (s.isComplete) return { key: "finished", label: "Finished" };
  if (s.done === 0 && !s.lastLoggedAt) return { key: "not_started", label: "Not started" };
  const idleDays = s.lastLoggedAt ? (Date.now() - Date.parse(s.lastLoggedAt)) / DAY_MS : Infinity;
  if (idleDays > 7) return { key: "inactive", label: "Inactive 7d+" };
  if (s.missed === 0) return { key: "on_track", label: "On track" };
  if (s.missed <= 3) return { key: "slightly_behind", label: "Slightly behind" };
  return { key: "behind", label: "Behind" };
}
