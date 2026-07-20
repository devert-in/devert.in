import { db } from "@/lib/firebase";
import {
  collection, doc, getDocs, getDoc, query, where, setDoc, updateDoc, deleteDoc, increment, serverTimestamp,
} from "firebase/firestore";
import { logCoinTransaction } from "@/lib/economy";

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

export async function setItemTitle(slug, date, title) {
  await updateDoc(doc(db, "institutions", slug, "dailyLearning", date), { title });
}

export function todayISO() {
  return toISODate(new Date());
}

// `includeUnpublished`: admin-only escape hatch (Manage's preview/analytics
// screen) - every student-facing call site leaves this false, so a day an
// admin has disabled disappears from the student view without needing a
// second "is this visible" check scattered through every consumer.
export async function fetchWeekItems(slug, weekId, { includeUnpublished = false } = {}) {
  const snap = await getDocs(query(collection(db, "institutions", slug, "dailyLearning"), where("weekId", "==", weekId)));
  let rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  if (!includeUnpublished) rows = rows.filter(it => it.status !== "draft");
  return rows.sort((a, b) => DOW_ORDER.indexOf(a.dow) - DOW_ORDER.indexOf(b.dow));
}

export async function setItemStatus(slug, date, status) {
  await updateDoc(doc(db, "institutions", slug, "dailyLearning", date), { status });
}

// Module-level kill switch, stored as a sentinel doc inside the SAME
// collection (id "_module" - never collides with a real "YYYY-MM-DD" date
// id) rather than a field on institutions/{slug} itself, because
// firestore.rules only lets a platform admin write the institution doc -
// isInstitutionAdmin already has write access to anything under
// dailyLearning/*, so this needs zero rule changes to let a campus admin
// toggle it.
export async function fetchModuleConfig(slug) {
  const snap = await getDoc(doc(db, "institutions", slug, "dailyLearning", "_module"));
  return snap.exists() ? snap.data() : { enabled: true };
}

export async function setModuleEnabled(slug, enabled) {
  await setDoc(doc(db, "institutions", slug, "dailyLearning", "_module"), { enabled }, { merge: true });
}

export async function fetchItemByDate(slug, date) {
  const snap = await getDoc(doc(db, "institutions", slug, "dailyLearning", date));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

function logId(uid, date) { return `${uid}_${date}`; }

export async function fetchLog(slug, uid, date) {
  const snap = await getDoc(doc(db, "institutions", slug, "dailyLearningLog", logId(uid, date)));
  return snap.exists() ? snap.data() : null;
}

export async function fetchUserWeekLogs(slug, uid, weekId) {
  const snap = await getDocs(query(collection(db, "institutions", slug, "dailyLearningLog"), where("uid", "==", uid), where("weekId", "==", weekId)));
  const byDate = {};
  snap.docs.forEach(d => { byDate[d.data().date] = d.data(); });
  return byDate;
}

// Self-reported completion, same trust level as the generic Learning
// module's own handleSubmit (lib is owner-write, rules gate on
// isApprovedStudent + isOwner) - xp/coin increments follow the exact
// pattern campus-learning.jsx already uses for lesson completion.
export async function submitDayCompletion({ slug, uid, profile, item, mcqAnswers, correctCount, problemsSolved }) {
  const existing = await fetchLog(slug, uid, item.date);
  const alreadyRewarded = !!existing;

  await setDoc(doc(db, "institutions", slug, "dailyLearningLog", logId(uid, item.date)), {
    uid,
    date: item.date,
    weekId: item.weekId,
    dow: item.dow,
    dayLabel: DOW_LABELS[item.dow],
    type: item.type,
    displayName: profile?.campusFullName || profile?.displayName || profile?.handle || "Student",
    rollNumber: profile?.rollNumber || null,
    mcqAnswers,
    mcqScore: correctCount,
    mcqTotal: (item.mcqs || []).length,
    problemsSolved,
    problemsTotal: (item.problemIds || []).length,
    xpEarned: alreadyRewarded ? (existing.xpEarned || 0) : (item.xpReward || 0),
    coinEarned: alreadyRewarded ? (existing.coinEarned || 0) : (item.coinReward || 0),
    completedAt: existing?.completedAt || serverTimestamp(),
    updatedAt: serverTimestamp(),
  }, { merge: true });

  if (!alreadyRewarded) {
    if (item.xpReward > 0) await updateDoc(doc(db, "users", uid), { xp: increment(item.xpReward) });
    if (item.coinReward > 0) {
      await setDoc(doc(db, "user_earnings", uid), {
        pulseCoins: increment(item.coinReward),
        totalCoins: increment(item.coinReward),
      }, { merge: true });
      await logCoinTransaction(uid, "daily_learning_completed", item.coinReward);
    }
  }
  return !alreadyRewarded;
}

// Single-equality-filter query (date only) so this never needs a composite
// index - cohort size is small enough that an in-memory sort by score is
// completely fine, and it keeps this feature deployable without waiting on
// a Firestore index build first.
export async function fetchDayLeaderboard(slug, date) {
  const snap = await getDocs(query(collection(db, "institutions", slug, "dailyLearningLog"), where("date", "==", date)));
  const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  rows.sort((a, b) => (b.mcqScore - a.mcqScore) || (b.problemsSolved?.length - a.problemsSolved?.length) || 0);
  return rows.map((r, i) => ({ ...r, rank: i + 1 }));
}

// Full create/edit save - the Manage editor form writes every field back
// through this one function whether it's a brand-new day or an existing
// one, since a date-keyed doc is naturally idempotent (set with merge just
// overwrites the fields the form actually owns).
export async function saveItem(slug, item) {
  const { date, ...rest } = item;
  await setDoc(doc(db, "institutions", slug, "dailyLearning", date), {
    ...rest,
    date,
    weekId: mondayOf(new Date(`${date}T00:00:00`)),
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function deleteItem(slug, date) {
  await deleteDoc(doc(db, "institutions", slug, "dailyLearning", date));
}

// Copies one day's content onto a different (currently-empty) date - lets
// an admin duplicate a lesson as a starting point for a new week instead of
// authoring from a blank form every time.
export async function duplicateItem(slug, fromDate, toDate) {
  const source = await fetchItemByDate(slug, fromDate);
  if (!source) throw new Error("Source day not found.");
  const { id, createdAt, updatedAt, ...rest } = source;
  await saveItem(slug, { ...rest, date: toDate, dow: dowOfDate(toDate), status: "draft" });
}

export async function fetchWeekTests(slug, { includeUnpublished = false } = {}) {
  const snap = await getDocs(query(collection(db, "institutions", slug, "dailyLearning"), where("type", "==", "test")));
  let rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  if (!includeUnpublished) rows = rows.filter(it => it.status !== "draft");
  return rows.sort((a, b) => (a.date < b.date ? 1 : -1));
}
