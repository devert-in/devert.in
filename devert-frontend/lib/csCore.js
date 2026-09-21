// CS Core - identical architecture to lib/programming.js (global,
// admin-authored subject/topic catalog): OS, DBMS, Networks, OOP, etc. are
// the same curriculum for every institution, not per-campus content.
import { db } from "@/lib/firebase";
import { currentAudiences } from "@/lib/audiences";
import {
  collection, doc, getDoc, getDocs, setDoc, deleteDoc, query, where,
  serverTimestamp, writeBatch, arrayUnion, arrayRemove, runTransaction,
} from "firebase/firestore";
import { grantRewards, bumpStreak } from "@/lib/rewards";
import { withVersionSnapshot } from "@/lib/contentVersioning";

// See lib/programming.js's fetchLanguages for why: the where("status",...)
// filter is required (not optional) for a non-admin list() read to pass
// firestore.rules at all, and orderBy is intentionally done client-side to
// avoid needing a composite index for filter+sort on different fields.
export async function fetchSubjects({ includeUnpublished = false } = {}) {
  const col = collection(db, "csCoreSubjects");
  const snap = await getDocs(includeUnpublished ? col : query(col, where("status", "==", "published"), where("audiences", "array-contains-any", currentAudiences())));
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
  const snap = await getDocs(includeUnpublished ? col : query(col, where("status", "==", "published"), where("audiences", "array-contains-any", currentAudiences())));
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

// Also scrubs topicId out of every student's completedTopicIds AND, if it was
// their lastOpenedTopicId, clears that too - see lib/programming.js's
// identical deleteTopic for the full reasoning. Without the second part, a
// 100%-complete student whose last-opened topic gets deleted (content
// restructuring) has nextTopic's fallback chain (SubjectRoadmap, above) find
// no match for either check and silently land them on topics[0] instead of a
// real "subject complete" state.
export async function deleteTopic(subjectId, topicId) {
  const progressSnap = await getDocs(query(collection(db, "cscore_progress"), where("subjectId", "==", subjectId)));
  const ops = [];
  progressSnap.docs.forEach(d => {
    const data = d.data();
    const patch = {};
    if ((data.completedTopicIds || []).includes(topicId)) patch.completedTopicIds = arrayRemove(topicId);
    if (data.lastOpenedTopicId === topicId) patch.lastOpenedTopicId = null;
    if (Object.keys(patch).length) ops.push({ ref: d.ref, patch });
  });
  for (let i = 0; i < ops.length; i += 450) {
    const batch = writeBatch(db);
    ops.slice(i, i + 450).forEach(({ ref, patch }) => batch.update(ref, patch));
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

// The progress doc ref and the exact completion patch, exposed so
// lib/quizAttempts.js's submitQuizAttempt can write the completion INSIDE the
// same transaction that grades the quiz and moves the XP. Keeping the shape
// here (rather than inlining it at the call site) means completeTopic below and
// the quiz path can never drift into writing two different completion records
// for the same topic.
export function csCoreProgressRef(uid, subjectId) {
  return doc(db, "cscore_progress", progressId(uid, subjectId));
}

export function csCoreCompletionPayload(uid, subjectId, topicId) {
  return {
    uid, subjectId,
    completedTopicIds: arrayUnion(topicId),
    lastOpenedTopicId: topicId,
    lastCompletedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
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

  // See bumpStreak's own header (lib/rewards.js) for why this runs out here,
  // after the transaction has resolved, rather than inside it.
  await bumpStreak(uid);
  return !alreadyCompleted;
}

export const CS_CORE_DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"];

// ---------------- in-module search ----------------
//
// The sidebar's global search (lib/campusSearch.js) already indexes CS Core, but
// it indexes it the way it indexes everything: subject and topic NAMES only, in a
// dropdown shared with eight other modules. Inside CS Core that isn't enough - a
// student searching "deadlock" or "normalization" is naming a concept, not a
// lesson title, and 26 subjects x ~10 topics is exactly the size where browsing
// stops working and searching has to start.
//
// So this is a second, deliberately deeper index scoped to this module: it also
// carries each topic's own vocabulary (what you'll learn, key points, common
// mistakes, interview tips) as searchable keywords. That is affordable here and
// would not be globally - the global index covers five modules and cannot fetch
// every lesson body in all of them.
//
// Same shape as lib/campusSearch.js's items, so searchCampus()/groupResults()
// rank and group it with no CS-Core-specific ranking logic to drift.
let _searchCache = null;
let _searchCacheKey = null;
let _searchInflight = null;

// A topic's searchable vocabulary, flattened and lowercased once at index time
// so every keystroke is a plain substring test. The lesson BODY is deliberately
// excluded: `concept` runs 2-4KB per topic, so including it would put ~700KB
// through a regex on every keystroke to surface matches whose only evidence is a
// word buried mid-paragraph. The authored list fields are the topic's own
// summary of itself, which is the better signal anyway.
function topicKeywords(topic) {
  return [
    topic.module,
    ...(topic.whatYoullLearn || []),
    ...(topic.keyPoints || []),
    ...(topic.commonMistakes || []),
    ...(topic.interviewTips || []),
  ].filter(Boolean).join(" ").toLowerCase();
}

export async function buildCsCoreSearchIndex() {
  // Keyed by the reader's audiences, so signing in or out rebuilds rather than
  // serving an index built under the previous permissions.
  const key = currentAudiences().join(",");
  if (_searchCache && _searchCacheKey === key) return _searchCache;
  if (_searchInflight && _searchCacheKey === key) return _searchInflight;

  _searchCacheKey = key;
  _searchInflight = (async () => {
    const subjects = await fetchSubjects();
    // Per-subject fetches are individually caught: one subject failing must cost
    // its own topics, never the whole search box.
    const topicLists = await Promise.all(
      subjects.map(s => fetchTopics(s.id).catch(() => []))
    );

    const out = [];
    subjects.forEach((subject, i) => {
      const topics = topicLists[i];
      out.push({
        id: `subject:${subject.id}`,
        title: subject.name,
        subtitle: subject.difficulty || "",
        kind: "Subject",
        path: ["CS Core", subject.name],
        keywords: [subject.placementRelevance, subject.industryUsage].filter(Boolean).join(" ").toLowerCase(),
        subjectId: subject.id,
        topicId: null,
      });
      for (const t of topics) {
        out.push({
          id: `topic:${subject.id}:${t.id}`,
          title: t.title,
          subtitle: subject.name,
          kind: "Topic",
          path: ["CS Core", subject.name, ...(t.module ? [t.module] : []), t.title],
          keywords: topicKeywords(t),
          subjectId: subject.id,
          topicId: t.id,
        });
      }
    });

    _searchCache = out;
    _searchInflight = null;
    return out;
  })();

  return _searchInflight;
}

export function clearCsCoreSearchIndex() {
  _searchCache = null;
  _searchCacheKey = null;
  _searchInflight = null;
}
