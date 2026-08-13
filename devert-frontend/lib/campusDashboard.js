// Powers the insight widgets on a student's OWN Campus dashboard (Recent
// Activity, Weekly Progress, the week-over-week trend on the KPI row, Today's
// Focus). Deliberately NOT lib/studentAnalytics.js's fetchStudentAnalytics -
// that one walks every language, every subject, every published problem, every
// submission and the entire Company Vault question tree, which is fine for an
// admin opening one student occasionally but would be dozens of Firestore
// reads on every single campus page load. Everything below derives from ONE
// query (this uid's reward_grants ledger) plus the aptitude progress doc the
// weak-topics widget needs, reusing lib/studentAnalytics.js's own
// fetchAptitudeSummary rather than re-deriving weakness detection here.
//
// Same principle as lib/studentAnalytics.js's header comment: nothing here
// invents a metric with no underlying collection. There is no session/duration
// tracking anywhere in DeVert, so there is no "study time" or "minutes
// remaining" number in this file - the dashboard shows real counts instead.
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { fetchAptitudeSummary } from "@/lib/studentAnalytics";

// Human-readable label per reward_grants activityType. Moved here from
// campus-student-dashboard.jsx (which now imports it) so this stays the ONE
// place a new reward-granting module's type string gets a friendly name -
// the admin student dashboard and the student's own activity feed render the
// same ledger and must not drift into two different vocabularies.
export const ACTIVITY_LABELS = {
  daily_learning_day: "Daily Learning - Day Completed",
  daily_learning_problem: "Daily Learning - Practice Problem",
  programming_topic: "Programming Lesson",
  cscore_topic: "CS Core Lesson",
  // These six were missing, so activityLabel() fell through to its raw-key
  // fallback and the admin Reward Timeline literally rendered "gate_topic" to
  // principals. Every activityType any module actually writes (see the
  // grantRewards call sites and REWARD_POLICY.modules in lib/rewardPolicy.js)
  // needs an entry here, or it surfaces as a database key.
  gate_topic: "GATE Topic",
  gate_day: "GATE Daily Goal",
  se_topic: "Fundamentals Topic",
  se_lesson: "Fundamentals Lesson",
  dsa_concept: "DSA Concept",
  aptitude_topic: "Aptitude Topic",
  contest: "Contest",
  arena_match: "Arena Solo Challenge",
  codelab_problem: "DSA / CodeLab Problem",
  learning_task: "Learning Module Task",
  aptitude_question: "Aptitude Question",
  admin_manual: "Manual Admin Adjustment",
  duplicate_reversal: "Duplicate Reward Correction",
  disallowed_module_reversal: "Module Access Reward Reversed",
};

export function activityLabel(activityType) {
  return ACTIVITY_LABELS[activityType] || activityType || "Activity";
}

const DOW_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function millis(ts) { return ts?.toMillis?.() || 0; }

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

// A rolling "last N days ending today" window, NOT lib/dailyLearning.js's
// mondayOf() calendar week - a student opening the dashboard on Tuesday should
// see seven days of history, not a two-day-wide chart. The two windows answer
// different questions, so this isn't a duplicate of that helper.
function rollingDays(days, now) {
  const today = startOfDay(now);
  const out = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    out.push(d);
  }
  return out;
}

// Only status === "granted" counts. A "reversed" grant (see lib/rewards.js's
// duplicate correction path) is still in the ledger and must stay visible in
// the activity feed - flagged, not hidden, same as the admin dashboard does -
// but it must never inflate a chart total or a completion count.
function isGranted(g) { return g.status !== "reversed"; }

/**
 * Buckets granted rewards into one entry per day over a rolling window.
 * Returns [{ key, label, date, xp, coins, activities }] oldest-first, with
 * zero-filled days so the chart never silently compresses an idle day away.
 */
export function buildDailySeries(grants, days = 7, now = new Date()) {
  const buckets = rollingDays(days, now).map(d => ({
    key: d.getTime(),
    label: DOW_SHORT[d.getDay()],
    date: d,
    xp: 0,
    coins: 0,
    activities: 0,
  }));
  const byKey = new Map(buckets.map(b => [b.key, b]));

  for (const g of grants) {
    if (!isGranted(g)) continue;
    const ms = millis(g.grantedAt);
    if (!ms) continue;
    const bucket = byKey.get(startOfDay(new Date(ms)).getTime());
    if (!bucket) continue;
    bucket.activities += 1;
    bucket.xp += g.xp || 0;
    bucket.coins += g.coins || 0;
  }
  return buckets;
}

function totalsBetween(grants, fromMs, toMs) {
  let activities = 0, xp = 0, coins = 0;
  for (const g of grants) {
    if (!isGranted(g)) continue;
    const ms = millis(g.grantedAt);
    if (ms < fromMs || ms >= toMs) continue;
    activities += 1;
    xp += g.xp || 0;
    coins += g.coins || 0;
  }
  return { activities, xp, coins };
}

// Formats a period-over-period delta into the exact "+8%" / "-3%" string
// shape CampusStat's `trend` prop already parses (leading sign picks the
// arrow + good/bad color). Returns null - not "0%" or "+0%" - when there is
// nothing meaningful to claim, so the caller renders no trend at all rather
// than a confident-looking zero. A jump from a zero baseline is reported as
// "new" by the caller instead of a meaningless +100%.
export function pctChange(current, previous) {
  if (!previous) return null;
  const delta = Math.round(((current - previous) / previous) * 100);
  if (delta === 0) return null;
  return `${delta > 0 ? "+" : "-"}${Math.abs(delta)}%`;
}

/**
 * One reward_grants read, shaped into every ledger-derived widget the
 * dashboard needs. Single-field equality filter (uid only) sorted client-side,
 * matching lib/studentAnalytics.js's fetchRewardTimeline - avoids needing a
 * composite index just for a student to see their own history.
 */
export async function fetchRewardInsights(uid, { now = new Date(), feedLimit = 8 } = {}) {
  const snap = await getDocs(query(collection(db, "reward_grants"), where("uid", "==", uid)));
  const grants = snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => millis(b.grantedAt) - millis(a.grantedAt));

  const todayMs = startOfDay(now).getTime();
  const dayMs = 86400000;
  const weekAgoMs = todayMs - 6 * dayMs;          // inclusive start of the 7-day window
  const prevWeekStartMs = weekAgoMs - 7 * dayMs;
  const tomorrowMs = todayMs + dayMs;

  const thisWeek = totalsBetween(grants, weekAgoMs, tomorrowMs);
  const lastWeek = totalsBetween(grants, prevWeekStartMs, weekAgoMs);
  const today = totalsBetween(grants, todayMs, tomorrowMs);

  return {
    grants,
    series7: buildDailySeries(grants, 7, now),
    series30: buildDailySeries(grants, 30, now),
    thisWeek,
    lastWeek,
    today,
    // Lifetime count of real (non-reversed) rewarded activities - the same
    // definition the admin dashboard's "ACTIVITIES COMPLETED" stat uses.
    activitiesCompleted: grants.filter(isGranted).length,
    activityTrend: pctChange(thisWeek.activities, lastWeek.activities),
    xpTrend: pctChange(thisWeek.xp, lastWeek.xp),
    recent: grants.slice(0, feedLimit).map(g => ({
      id: g.id,
      activityType: g.activityType,
      label: activityLabel(g.activityType),
      grantedAt: g.grantedAt || null,
      xp: g.xp || 0,
      coins: g.coins || 0,
      reversed: g.status === "reversed",
    })),
  };
}

/**
 * Everything the student dashboard's new widgets need, in one call.
 * Aptitude weak topics fail soft (null) so a student who has never opened
 * Aptitude - or a transient read failure - never blanks the whole dashboard.
 */
export async function fetchDashboardInsights(uid, options = {}) {
  const [rewards, aptitude] = await Promise.all([
    fetchRewardInsights(uid, options),
    fetchAptitudeSummary(uid).catch(() => null),
  ]);
  return {
    ...rewards,
    weakTopics: aptitude?.weakTopics || [],
    aptitudeAccuracyPct: aptitude?.overallAccuracyPct ?? null,
    aptitudeQuestionsAttempted: aptitude?.questionsAttempted || 0,
  };
}

// A transparent, stated milestone ladder derived from real XP - not a stored
// field and not a fabricated metric (contrast lib/studentAnalytics.js's
// "never invent a number with no collection behind it": XP itself IS the
// real, tracked collection here, Level is just a deterministic bucket of it).
// 500 XP per level, flat - simple enough that a student can recompute it
// themselves from the XP number sitting right next to it.
export const XP_PER_LEVEL = 500;
export function levelFromXp(xp) {
  return Math.floor((xp || 0) / XP_PER_LEVEL) + 1;
}

// Relative timestamp for the activity feed ("2h ago"), falling back to an
// absolute date past a week where "9d ago" stops being useful.
export function relativeTime(ts, now = new Date()) {
  const ms = millis(ts);
  if (!ms) return "";
  const diff = now.getTime() - ms;
  if (diff < 60000) return "just now";
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ms).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}
