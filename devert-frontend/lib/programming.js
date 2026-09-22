// Programming module - a GLOBAL language/topic catalog (same shape as
// lib/codelab.js's `problems` collection, not per-institution like
// lib/dailyLearning.js) - one curriculum per language, authored once via
// /admin, shared by every institution. See firestore.rules'
// `programmingLanguages`/`programming_progress` blocks for the read/write
// authority this all defers to.
import { db } from "@/lib/firebase";
import { currentAudiences } from "@/lib/audiences";
import { withVersionSnapshot } from "@/lib/contentVersioning";
import {
  collection, doc, getDoc, getDocs, setDoc, deleteDoc, query, where,
  serverTimestamp, writeBatch, arrayUnion, arrayRemove, runTransaction,
} from "firebase/firestore";
import { grantRewards, bumpStreak } from "@/lib/rewards";

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
  const snap = await getDocs(includeUnpublished ? col : query(col, where("status", "==", "published"), where("audiences", "array-contains-any", currentAudiences())));
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

// Also deletes every student's programming_progress doc for this language -
// without this, deleting a language left every student who'd ever opened it
// with a permanently orphaned progress doc (completedTopicIds referencing
// topics that no longer exist). firestore.rules grants isAdmin() write
// access to programming_progress specifically so this cleanup can run.
// Chunked at 450 deletes/batch (Firestore's 500-op cap) - a popular
// language's progress docs alone could exceed one batch's limit even though
// its topics never would.
export async function deleteLanguage(langId) {
  const [topicsSnap, progressSnap] = await Promise.all([
    getDocs(collection(db, "programmingLanguages", langId, "topics")),
    getDocs(query(collection(db, "programming_progress"), where("langId", "==", langId))),
  ]);
  const refs = [...topicsSnap.docs.map(d => d.ref), ...progressSnap.docs.map(d => d.ref), doc(db, "programmingLanguages", langId)];
  for (let i = 0; i < refs.length; i += 450) {
    const batch = writeBatch(db);
    refs.slice(i, i + 450).forEach(ref => batch.delete(ref));
    await batch.commit();
  }
}

export async function fetchTopics(langId, { includeUnpublished = false } = {}) {
  const col = collection(db, "programmingLanguages", langId, "topics");
  const snap = await getDocs(includeUnpublished ? col : query(col, where("status", "==", "published"), where("audiences", "array-contains-any", currentAudiences())));
  return snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (a.order || 0) - (b.order || 0));
}

export async function fetchTopic(langId, topicId) {
  const snap = await getDoc(doc(db, "programmingLanguages", langId, "topics", topicId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function saveTopic(langId, topicId, data) {
  const ref = doc(db, "programmingLanguages", langId, "topics", topicId);
  const existing = (await getDoc(ref)).data();
  await setDoc(ref, {
    updatedAt: serverTimestamp(),
    ...withVersionSnapshot(existing),
    ...data,
  }, { merge: true });
}

// Also scrubs topicId out of every student's completedTopicIds for this
// language - without this, a deleted topic stayed in every progress doc that
// had completed it, letting a student's displayed completion % exceed 100%
// (fetchProgrammingSummary divides completed count by the CURRENT topic
// total, which just went down by one). isAdmin() write access already
// exists on programming_progress; arrayRemove here isn't blocked by that
// collection's owner-only monotonicity guard, which only applies to the
// isOwner() branch.
// Also clears lastOpenedTopicId when it's the deleted topic - without this,
// a 100%-complete student whose last-opened topic gets deleted (content
// restructuring) falls through nextTopic's whole fallback chain to
// topics[0], silently landing them back at the start instead of a real
// "subject complete" state. Same fix as lib/csCore.js's identical deleteTopic.
export async function deleteTopic(langId, topicId) {
  const progressSnap = await getDocs(query(collection(db, "programming_progress"), where("langId", "==", langId)));
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
  await deleteDoc(doc(db, "programmingLanguages", langId, "topics", topicId));
}

function progressId(uid, langId) { return `${uid}_${langId}`; }

export async function fetchLanguageProgress(uid, langId) {
  const snap = await getDoc(doc(db, "programming_progress", progressId(uid, langId)));
  return snap.exists() ? snap.data() : null;
}

// All of a student's progress docs across every language they've touched -
// powers the landing page's "Continue Learning"/"Recently Opened" and every
// language card's "X/Y completed" figure.
//
// Per-language getDoc() calls, NOT a where("uid","==",uid) list query -
// verified directly against the emulator that such a query is DENIED
// outright ("Null value error ... for 'list'"): firestore.rules' rule here
// checks the wildcard path segment (progressId.split('_')[0] ==
// request.auth.uid), which has no relationship Firestore's rules engine can
// statically prove to a query filtered on the `uid` FIELD instead - the
// exact same "list() is unprovable, get() by known id works fine" pattern
// already hit for programming_progress/cscore_progress under
// isAdminOfStudent() elsewhere in this app, just triggered here for the
// OWNER's own read instead of a campus admin's. The previous version of this
// function silently caught that denial (ProgrammingLanding's
// .catch(() => setAllProgress([]))) and rendered every language card as
// 0/X regardless of real progress - this was a standing, platform-wide bug,
// not something that only showed up occasionally.
export async function fetchAllUserProgress(uid) {
  const languages = await fetchLanguages();
  const progressList = await Promise.all(languages.map(lang => fetchLanguageProgress(uid, lang.id)));
  return languages
    .map((lang, i) => progressList[i] ? { id: progressId(uid, lang.id), ...progressList[i] } : null)
    .filter(Boolean);
}

export async function markTopicOpened(uid, langId, topicId) {
  await setDoc(doc(db, "programming_progress", progressId(uid, langId)), {
    uid, langId,
    lastOpenedTopicId: topicId,
    lastOpenedAt: serverTimestamp(),
    startedAt: serverTimestamp(),
  }, { merge: true });
}

// Exposed for lib/quizAttempts.js's submitQuizAttempt, so a graded quiz writes
// its completion inside the same transaction that moves the XP - see the
// identical pair in lib/csCore.js.
export function programmingProgressRef(uid, langId) {
  return doc(db, "programming_progress", progressId(uid, langId));
}

export function programmingCompletionPayload(uid, langId, topicId) {
  return {
    uid, langId,
    completedTopicIds: arrayUnion(topicId),
    lastOpenedTopicId: topicId,
    lastCompletedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

// Mirrors lib/dailyLearning.js's submitDayCompletion() - same self-reported-
// completion trust boundary, same shared grantRewards() split (xp/coins/
// score). The idempotency check (is topicId already in completedTopicIds?)
// is wrapped in a transaction, not a plain get()-then-set() - two
// near-simultaneous completions used to both read "not yet completed"
// before either write landed, double-awarding XP/coins/score; Firestore now
// retries this callback if the progress doc changes underneath it, so the
// loser of the race re-reads an already-completed doc and earns nothing.
export async function completeTopic({ uid, langId, topicId, xpReward = 0, coinReward = 0 }) {
  const progressRef = doc(db, "programming_progress", progressId(uid, langId));
  let alreadyCompleted;

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(progressRef);
    const existing = snap.exists() ? snap.data() : null;
    alreadyCompleted = !!existing?.completedTopicIds?.includes(topicId);

    tx.set(progressRef, {
      uid, langId,
      completedTopicIds: arrayUnion(topicId),
      lastOpenedTopicId: topicId,
      lastCompletedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });

    // Inside the same transaction as the completion flag - see
    // dailyLearning.js's submitDayCompletion for why granting the reward as
    // a separate call after commit could permanently strand it.
    if (!alreadyCompleted) {
      grantRewards(uid, {
        xpReward, coinReward, scoreReward: xpReward, transactionType: "programming_topic_completed",
        activityType: "programming_topic", activityId: `${langId}_${topicId}`, sourceModule: "programming",
      }, tx);
    }
  });

  // See bumpStreak's own header (lib/rewards.js) for why this runs out here,
  // after the transaction has resolved, rather than inside it.
  await bumpStreak(uid);
  return !alreadyCompleted;
}

export const PROGRAMMING_DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"];
