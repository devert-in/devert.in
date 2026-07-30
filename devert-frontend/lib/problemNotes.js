import { db } from "@/lib/firebase";
import { collection, doc, setDoc, onSnapshot, query, where, serverTimestamp, Timestamp } from "firebase/firestore";

// Per-student, per-DSA-problem study metadata - favorite/bookmark/review-later/
// needs-revision/confidence/personal rating/personal difficulty/notes/tags/
// revision scheduling. Never touches the `problems` doc itself (shared,
// world-readable content) or `user_codelab_progress` (the reward-sensitive
// solved/attempt ledger) - this is purely personal organization, same spirit
// as user_companyPrep's bookmarked map but one doc PER touched problem
// (problem_notes/{uid}_{problemId}) rather than one flat map on a single doc,
// since a rich per-problem record (notes text, tag list, rating) would risk
// an unbounded single-doc size if every field lived in one nested map keyed
// by problemId. A student who never favorites/bookmarks/annotates anything
// creates zero docs here - lazy by construction.

export const CONFIDENCE_LEVELS = [
  { key: "very_confident", label: "Very Confident" },
  { key: "confident", label: "Confident" },
  { key: "average", label: "Average" },
  { key: "needs_practice", label: "Needs Practice" },
  { key: "didnt_understand", label: "Didn't Understand" },
];

export const SUGGESTED_TAGS = [
  "Amazon", "Google", "Microsoft", "Important", "Interview", "Revision",
  "Frequently Asked", "Hard Pattern", "Company Favorite",
];

export const REVISION_PRESETS = [
  { label: "Tomorrow", days: 1 },
  { label: "3 Days", days: 3 },
  { label: "1 Week", days: 7 },
  { label: "2 Weeks", days: 14 },
  { label: "1 Month", days: 30 },
];

function docId(uid, problemId) {
  return `${uid}_${problemId}`;
}

export function emptyProblemNote(uid, problemId) {
  return {
    uid, problemId,
    favorite: false, bookmarked: false, reviewLater: false, needsRevision: false,
    confidence: null, personalDifficulty: null, personalRating: 0,
    notes: "", tags: [], nextRevisionAt: null,
  };
}

// Live map of every problem this student has ever touched - a single
// where("uid","==") query (no orderBy, no composite index needed, same shape
// as fetchAttemptedProblemIds in lib/codelab.js), kept live so a toggle made
// in another tab (or a different card instance of the same problem) reflects
// immediately everywhere without a remount.
export function subscribeToProblemNotes(uid, callback) {
  return onSnapshot(query(collection(db, "problem_notes"), where("uid", "==", uid)), snap => {
    const map = {};
    snap.docs.forEach(d => { map[d.data().problemId] = { id: d.id, ...d.data() }; });
    callback(map);
  });
}

export async function upsertProblemNote(uid, problemId, patch) {
  await setDoc(doc(db, "problem_notes", docId(uid, problemId)), {
    uid, problemId, ...patch, updatedAt: serverTimestamp(),
  }, { merge: true });
}

export function toggleFavorite(uid, problemId, next) {
  return upsertProblemNote(uid, problemId, { favorite: next });
}

export function toggleBookmark(uid, problemId, next) {
  return upsertProblemNote(uid, problemId, { bookmarked: next });
}

export function toggleReviewLater(uid, problemId, next) {
  return upsertProblemNote(uid, problemId, { reviewLater: next });
}

export function toggleNeedsRevision(uid, problemId, next) {
  return upsertProblemNote(uid, problemId, { needsRevision: next });
}

export function setConfidence(uid, problemId, confidence) {
  return upsertProblemNote(uid, problemId, { confidence });
}

export function setPersonalDifficulty(uid, problemId, personalDifficulty) {
  return upsertProblemNote(uid, problemId, { personalDifficulty });
}

export function setPersonalRating(uid, problemId, personalRating) {
  return upsertProblemNote(uid, problemId, { personalRating });
}

export function saveNotes(uid, problemId, notes) {
  return upsertProblemNote(uid, problemId, { notes: notes.slice(0, 2000) });
}

export function saveTags(uid, problemId, tags) {
  return upsertProblemNote(uid, problemId, { tags: tags.slice(0, 20) });
}

export function scheduleRevision(uid, problemId, days) {
  const at = new Date();
  at.setDate(at.getDate() + days);
  return upsertProblemNote(uid, problemId, { nextRevisionAt: Timestamp.fromDate(at) });
}

export function clearRevisionSchedule(uid, problemId) {
  return upsertProblemNote(uid, problemId, { nextRevisionAt: null });
}

export function isRevisionDue(note) {
  const at = note?.nextRevisionAt;
  if (!at) return false;
  const ms = typeof at.toMillis === "function" ? at.toMillis() : new Date(at).getTime();
  return ms <= Date.now();
}

// "Tomorrow" / "in 3 days" / "Overdue by 2 days" / "Today" - relative to now,
// not an absolute date, matching how every revision preset button is framed.
export function formatRevisionLabel(note) {
  const at = note?.nextRevisionAt;
  if (!at) return null;
  const ms = typeof at.toMillis === "function" ? at.toMillis() : new Date(at).getTime();
  const diffDays = Math.round((ms - Date.now()) / 86400000);
  if (diffDays < 0) return `Overdue by ${Math.abs(diffDays)}d`;
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  return `in ${diffDays}d`;
}
