// CS Core - identical architecture to lib/programming.js (global,
// admin-authored subject/topic catalog): OS, DBMS, Networks, OOP, etc. are
// the same curriculum for every institution, not per-campus content.
import { db } from "@/lib/firebase";
import {
  collection, doc, getDoc, getDocs, setDoc, deleteDoc, query, where,
  serverTimestamp, writeBatch, arrayUnion, arrayRemove, runTransaction,
} from "firebase/firestore";
import { grantRewards } from "@/lib/rewards";
import { withVersionSnapshot } from "@/lib/contentVersioning";

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

// Also deletes every student's cscore_progress doc for this subject - see
// lib/programming.js's deleteLanguage for the identical reasoning (orphaned
// progress docs, isAdmin() write access, 450-op batch chunking).
export async function deleteSubject(subjectId) {
  const [topicsSnap, progressSnap] = await Promise.all([
    getDocs(collection(db, "csCoreSubjects", subjectId, "topics")),
    getDocs(query(collection(db, "cscore_progress"), where("subjectId", "==", subjectId))),
  ]);
  const refs = [...topicsSnap.docs.map(d => d.ref), ...progressSnap.docs.map(d => d.ref), doc(db, "csCoreSubjects", subjectId)];
  for (let i = 0; i < refs.length; i += 450) {
    const batch = writeBatch(db);
    refs.slice(i, i + 450).forEach(ref => batch.delete(ref));
    await batch.commit();
  }
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
  const ref = doc(db, "csCoreSubjects", subjectId, "topics", topicId);
  const existing = (await getDoc(ref)).data();
  await setDoc(ref, { updatedAt: serverTimestamp(), ...withVersionSnapshot(existing), ...data }, { merge: true });
}

// Also scrubs topicId out of every student's completedTopicIds - see
// lib/programming.js's identical deleteTopic for the full reasoning.
export async function deleteTopic(subjectId, topicId) {
  const progressSnap = await getDocs(query(collection(db, "cscore_progress"), where("subjectId", "==", subjectId)));
  const affected = progressSnap.docs.filter(d => (d.data().completedTopicIds || []).includes(topicId));
  for (let i = 0; i < affected.length; i += 450) {
    const batch = writeBatch(db);
    affected.slice(i, i + 450).forEach(d => batch.update(d.ref, { completedTopicIds: arrayRemove(topicId) }));
    await batch.commit();
  }
  await deleteDoc(doc(db, "csCoreSubjects", subjectId, "topics", topicId));
}

function progressId(uid, subjectId) { return `${uid}_${subjectId}`; }

export async function fetchSubjectProgress(uid, subjectId) {
  const snap = await getDoc(doc(db, "cscore_progress", progressId(uid, subjectId)));
  return snap.exists() ? snap.data() : null;
}

// Per-subject getDoc() calls, NOT a where("uid","==",uid) list query - same
// fix as lib/programming.js's fetchAllUserProgress, for the identical
// reason: verified against the emulator that such a query is DENIED
// outright for the owner's own uid ("Null value error ... for 'list'"),
// since firestore.rules' rule here checks the wildcard path segment
// (progressId.split('_')[0]), which Firestore can't statically relate to a
// query filtered on the `uid` field. The previous version silently caught
// that denial and rendered every subject card as 0/X regardless of real
// progress.
export async function fetchAllUserProgress(uid) {
  const subjects = await fetchSubjects();
  const progressList = await Promise.all(subjects.map(subject => fetchSubjectProgress(uid, subject.id)));
  return subjects
    .map((subject, i) => progressList[i] ? { id: progressId(uid, subject.id), ...progressList[i] } : null)
    .filter(Boolean);
}

export async function markTopicOpened(uid, subjectId, topicId) {
  await setDoc(doc(db, "cscore_progress", progressId(uid, subjectId)), {
    uid, subjectId, lastOpenedTopicId: topicId, lastOpenedAt: serverTimestamp(), startedAt: serverTimestamp(),
  }, { merge: true });
}

// Same transaction-wrapped idempotency fix as lib/programming.js's identical
// completeTopic - two near-simultaneous completions used to both read "not
// yet completed" before either write landed, double-awarding XP/coins/score.
export async function completeTopic({ uid, subjectId, topicId, xpReward = 0, coinReward = 0 }) {
  const progressRef = doc(db, "cscore_progress", progressId(uid, subjectId));
  let alreadyCompleted;

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(progressRef);
    const existing = snap.exists() ? snap.data() : null;
    alreadyCompleted = !!existing?.completedTopicIds?.includes(topicId);

    tx.set(progressRef, {
      uid, subjectId,
      completedTopicIds: arrayUnion(topicId),
      lastOpenedTopicId: topicId,
      lastCompletedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });

    // Inside the same transaction as the completion flag - see
    // lib/dailyLearning.js's submitDayCompletion for why granting the reward
    // as a separate call after commit could permanently strand it.
    if (!alreadyCompleted) {
      grantRewards(uid, {
        xpReward, coinReward, scoreReward: xpReward, transactionType: "cscore_topic_completed",
        activityType: "cscore_topic", activityId: `${subjectId}_${topicId}`, sourceModule: "cscore",
      }, tx);
    }
  });

  return !alreadyCompleted;
}

export const CS_CORE_DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"];
