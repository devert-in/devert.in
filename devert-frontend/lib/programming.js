// Programming module - a GLOBAL language/topic catalog (same shape as
// lib/codelab.js's `problems` collection, not per-institution like
// lib/dailyLearning.js) - one curriculum per language, authored once via
// /admin, shared by every institution. See firestore.rules'
// `programmingLanguages`/`programming_progress` blocks for the read/write
// authority this all defers to.
import { db } from "@/lib/firebase";
import {
  collection, doc, getDoc, getDocs, setDoc, deleteDoc, query, where,
  serverTimestamp, updateDoc, increment, writeBatch, arrayUnion,
} from "firebase/firestore";
import { logCoinTransaction } from "@/lib/economy";

// No orderBy in the Firestore query itself - combining it with the
// where("status",...) filter needed for non-admin reads would require a
// composite index. Sorting by `order` client-side avoids that entirely
// (same "single-filter query, sort in memory" pattern lib/dailyLearning.js
// already uses). The where() clause itself is REQUIRED, not optional: a
// list() query gated by firestore.rules' resource.data.status check must be
// provably restricted by a matching query filter, or Firestore denies the
// whole request with permission-denied for any non-admin - fetching
// everything and filtering client-side (the original version of this
// function) looked correct but failed for every real student.
export async function fetchLanguages({ includeUnpublished = false } = {}) {
  const col = collection(db, "programmingLanguages");
  const snap = await getDocs(includeUnpublished ? col : query(col, where("status", "==", "published")));
  return snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (a.order || 0) - (b.order || 0));
}

export async function fetchLanguage(langId) {
  const snap = await getDoc(doc(db, "programmingLanguages", langId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function saveLanguage(langId, data) {
  await setDoc(doc(db, "programmingLanguages", langId), {
    updatedAt: serverTimestamp(),
    ...data,
  }, { merge: true });
}

export async function deleteLanguage(langId) {
  const topicsSnap = await getDocs(collection(db, "programmingLanguages", langId, "topics"));
  const batch = writeBatch(db);
  topicsSnap.docs.forEach(d => batch.delete(d.ref));
  batch.delete(doc(db, "programmingLanguages", langId));
  await batch.commit();
}

export async function fetchTopics(langId, { includeUnpublished = false } = {}) {
  const col = collection(db, "programmingLanguages", langId, "topics");
  const snap = await getDocs(includeUnpublished ? col : query(col, where("status", "==", "published")));
  return snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (a.order || 0) - (b.order || 0));
}

export async function fetchTopic(langId, topicId) {
  const snap = await getDoc(doc(db, "programmingLanguages", langId, "topics", topicId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function saveTopic(langId, topicId, data) {
  await setDoc(doc(db, "programmingLanguages", langId, "topics", topicId), {
    updatedAt: serverTimestamp(),
    ...data,
  }, { merge: true });
}

export async function deleteTopic(langId, topicId) {
  await deleteDoc(doc(db, "programmingLanguages", langId, "topics", topicId));
}

function progressId(uid, langId) { return `${uid}_${langId}`; }

export async function fetchLanguageProgress(uid, langId) {
  const snap = await getDoc(doc(db, "programming_progress", progressId(uid, langId)));
  return snap.exists() ? snap.data() : null;
}

// All of a student's progress docs across every language they've touched -
// powers the landing page's "Continue Learning"/"Recently Opened" without
// needing to know which languages to check up front.
export async function fetchAllUserProgress(uid) {
  const snap = await getDocs(query(collection(db, "programming_progress"), where("uid", "==", uid)));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function markTopicOpened(uid, langId, topicId) {
  await setDoc(doc(db, "programming_progress", progressId(uid, langId)), {
    uid, langId,
    lastOpenedTopicId: topicId,
    lastOpenedAt: serverTimestamp(),
    startedAt: serverTimestamp(),
  }, { merge: true });
}

// Mirrors lib/dailyLearning.js's submitDayCompletion() exactly - same
// self-reported-completion trust boundary, same XP-to-users/{uid}.xp +
// coins-to-user_earnings/{uid} split, same coin_transactions log entry.
// Idempotent via completedTopicIds membership, not a transaction (same
// acceptable race-window as Daily Learning's, per that function's own
// comment - a student completing the same topic twice in quick succession
// is a non-issue, not a security boundary).
export async function completeTopic({ uid, langId, topicId, xpReward = 0, coinReward = 0 }) {
  const existing = await fetchLanguageProgress(uid, langId);
  const alreadyCompleted = !!existing?.completedTopicIds?.includes(topicId);

  await setDoc(doc(db, "programming_progress", progressId(uid, langId)), {
    uid, langId,
    completedTopicIds: arrayUnion(topicId),
    lastOpenedTopicId: topicId,
    lastCompletedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }, { merge: true });

  if (!alreadyCompleted) {
    if (xpReward > 0) await updateDoc(doc(db, "users", uid), { xp: increment(xpReward) });
    if (coinReward > 0) {
      await setDoc(doc(db, "user_earnings", uid), {
        pulseCoins: increment(coinReward),
        totalCoins: increment(coinReward),
      }, { merge: true });
      logCoinTransaction(uid, "programming_topic_completed", coinReward);
    }
  }
  return !alreadyCompleted;
}

export const PROGRAMMING_DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"];
