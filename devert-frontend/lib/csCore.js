// CS Core - identical architecture to lib/programming.js (global,
// admin-authored subject/topic catalog): OS, DBMS, Networks, OOP, etc. are
// the same curriculum for every institution, not per-campus content.
import { db } from "@/lib/firebase";
import {
  collection, doc, getDoc, getDocs, setDoc, deleteDoc, query, where,
  serverTimestamp, updateDoc, increment, writeBatch, arrayUnion,
} from "firebase/firestore";
import { logCoinTransaction } from "@/lib/economy";

// See lib/programming.js's fetchLanguages for why: the where("status",...)
// filter is required (not optional) for a non-admin list() read to pass
// firestore.rules at all, and orderBy is intentionally done client-side to
// avoid needing a composite index for filter+sort on different fields.
export async function fetchSubjects({ includeUnpublished = false } = {}) {
  const col = collection(db, "csCoreSubjects");
  const snap = await getDocs(includeUnpublished ? col : query(col, where("status", "==", "published")));
  return snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (a.order || 0) - (b.order || 0));
}

export async function fetchSubject(subjectId) {
  const snap = await getDoc(doc(db, "csCoreSubjects", subjectId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function saveSubject(subjectId, data) {
  await setDoc(doc(db, "csCoreSubjects", subjectId), { updatedAt: serverTimestamp(), ...data }, { merge: true });
}

export async function deleteSubject(subjectId) {
  const topicsSnap = await getDocs(collection(db, "csCoreSubjects", subjectId, "topics"));
  const batch = writeBatch(db);
  topicsSnap.docs.forEach(d => batch.delete(d.ref));
  batch.delete(doc(db, "csCoreSubjects", subjectId));
  await batch.commit();
}

export async function fetchTopics(subjectId, { includeUnpublished = false } = {}) {
  const col = collection(db, "csCoreSubjects", subjectId, "topics");
  const snap = await getDocs(includeUnpublished ? col : query(col, where("status", "==", "published")));
  return snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (a.order || 0) - (b.order || 0));
}

export async function fetchTopic(subjectId, topicId) {
  const snap = await getDoc(doc(db, "csCoreSubjects", subjectId, "topics", topicId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function saveTopic(subjectId, topicId, data) {
  await setDoc(doc(db, "csCoreSubjects", subjectId, "topics", topicId), { updatedAt: serverTimestamp(), ...data }, { merge: true });
}

export async function deleteTopic(subjectId, topicId) {
  await deleteDoc(doc(db, "csCoreSubjects", subjectId, "topics", topicId));
}

function progressId(uid, subjectId) { return `${uid}_${subjectId}`; }

export async function fetchSubjectProgress(uid, subjectId) {
  const snap = await getDoc(doc(db, "cscore_progress", progressId(uid, subjectId)));
  return snap.exists() ? snap.data() : null;
}

export async function fetchAllUserProgress(uid) {
  const snap = await getDocs(query(collection(db, "cscore_progress"), where("uid", "==", uid)));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function markTopicOpened(uid, subjectId, topicId) {
  await setDoc(doc(db, "cscore_progress", progressId(uid, subjectId)), {
    uid, subjectId, lastOpenedTopicId: topicId, lastOpenedAt: serverTimestamp(), startedAt: serverTimestamp(),
  }, { merge: true });
}

export async function completeTopic({ uid, subjectId, topicId, xpReward = 0, coinReward = 0 }) {
  const existing = await fetchSubjectProgress(uid, subjectId);
  const alreadyCompleted = !!existing?.completedTopicIds?.includes(topicId);

  await setDoc(doc(db, "cscore_progress", progressId(uid, subjectId)), {
    uid, subjectId,
    completedTopicIds: arrayUnion(topicId),
    lastOpenedTopicId: topicId,
    lastCompletedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }, { merge: true });

  if (!alreadyCompleted) {
    if (xpReward > 0) await updateDoc(doc(db, "users", uid), { xp: increment(xpReward) });
    if (coinReward > 0) {
      await setDoc(doc(db, "user_earnings", uid), {
        pulseCoins: increment(coinReward), totalCoins: increment(coinReward),
      }, { merge: true });
      logCoinTransaction(uid, "cscore_topic_completed", coinReward);
    }
  }
  return !alreadyCompleted;
}

export const CS_CORE_DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"];
