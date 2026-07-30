import { db } from "@/lib/firebase";
import { currentAudiences } from "@/lib/audiences";
import {
  collection, doc, getDocs, getDoc, setDoc, query, where, orderBy,
  serverTimestamp, runTransaction, arrayUnion,
} from "firebase/firestore";
import { withVersionSnapshot } from "@/lib/contentVersioning";
import { grantRewards } from "@/lib/rewards";

export const APTITUDE_CATEGORIES = ["Quantitative", "Logical", "Verbal"];

// Fixed vocabulary for exam-relevance badges - single source of truth,
// shared by the admin authoring form/CSV importer and the question workspace.
export const APTITUDE_EXAM_TAGS = ["GATE", "CAT", "Campus Placement", "Product Companies", "Banking", "SSC", "UPSC", "GRE"];

const MAX_ATTEMPT_HISTORY = 10;

// Same "where(status) is REQUIRED, not optional" reasoning as
// lib/programming.js's fetchLanguages/fetchTopics: once firestore.rules
// gates aptitude_topics' read on status=='published', a non-admin list()
// query with no matching filter is denied outright, not silently
// filtered - includeUnpublished is the admin-only escape hatch (topic
// authoring screen needs to see drafts).
export async function fetchAptitudeTopics({ includeUnpublished = false } = {}) {
  const col = collection(db, "aptitude_topics");
  const snap = await getDocs(includeUnpublished ? query(col, orderBy("order", "asc")) : query(col, where("status", "==", "published"), where("audiences", "array-contains-any", currentAudiences())));
  return snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (a.order || 0) - (b.order || 0));
}

export async function fetchAptitudeTopic(topicId) {
  const snap = await getDoc(doc(db, "aptitude_topics", topicId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// Lesson-content authoring save (the new concept/keyPoints/mcqs/etc. layer -
// see AptitudeTopicsPanel in app/admin/page.jsx) - separate from the
// existing AptitudePanel's handleAddTopic/handleAddQuestion, which still own
// the category/name/description create flow and the practice-question
// subcollection untouched by this function.
export async function saveAptitudeTopic(topicId, data) {
  const ref = doc(db, "aptitude_topics", topicId);
  const existing = (await getDoc(ref)).data();
  await setDoc(ref, {
    updatedAt: serverTimestamp(),
    ...withVersionSnapshot(existing),
    ...data,
  }, { merge: true });
}

export async function fetchTopicQuestions(topicId) {
  const snap = await getDocs(query(collection(db, "aptitude_topics", topicId, "questions"), orderBy("order", "asc")));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// Same transaction-wrapped idempotency pattern as programming.js/csCore.js's
// completeTopic - reuses the EXISTING user_aptitude_progress/{uid} doc
// (adding completedTopicIds alongside its current attempted/topicStats/
// bookmarks fields) rather than a new collection, since that doc already IS
// this user's aptitude state.
export async function completeAptitudeTopic({ uid, topicId, xpReward = 0, coinReward = 0 }) {
  const progressRef = doc(db, "user_aptitude_progress", uid);
  let alreadyCompleted;

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(progressRef);
    const existing = snap.exists() ? snap.data() : null;
    alreadyCompleted = !!existing?.completedTopicIds?.includes(topicId);

    tx.set(progressRef, {
      completedTopicIds: arrayUnion(topicId),
      lastOpenedTopicId: topicId,
      lastCompletedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });

    if (!alreadyCompleted) {
      grantRewards(uid, {
        xpReward, coinReward, scoreReward: xpReward, transactionType: "aptitude_topic_completed",
        activityType: "aptitude_topic", activityId: topicId, sourceModule: "aptitude",
      }, tx);
    }
  });

  return !alreadyCompleted;
}

export async function fetchTopicWithQuestions(topicId) {
  const topicSnap = await getDoc(doc(db, "aptitude_topics", topicId));
  if (!topicSnap.exists()) return null;
  const questions = await fetchTopicQuestions(topicId);
  return { id: topicSnap.id, ...topicSnap.data(), questions };
}

export function groupTopicsByCategory(topics) {
  const grouped = {};
  for (const cat of APTITUDE_CATEGORIES) grouped[cat] = [];
  for (const t of topics) {
    if (!grouped[t.category]) grouped[t.category] = [];
    grouped[t.category].push(t);
  }
  return grouped;
}

export function topicAccuracy(topicStats, topicId) {
  const s = topicStats?.[topicId];
  if (!s || !s.attempted) return null;
  return Math.round((s.correct / s.attempted) * 100);
}

// ── attempt history ──────────────────────────────────────────────────────────
// `attempted[qid]` used to be a single overwritten object
// ({selectedIndex, correct, attemptedAt}). Normalize both that legacy shape
// and the new {history, everCorrect, bestTimeSec, attempts} shape into one
// read model, so old per-user docs keep working without a bulk migration.

export function normalizeAttemptEntry(entry) {
  if (!entry) return { history: [], everCorrect: false, bestTimeSec: null, attempts: 0 };
  if (entry.history) return entry;
  // Legacy single-attempt shape - treat as a one-entry history for display.
  return {
    history: [{ selectedIndex: entry.selectedIndex, correct: entry.correct, timeSec: null, attemptedAt: entry.attemptedAt }],
    everCorrect: !!entry.correct,
    bestTimeSec: null,
    attempts: 1,
  };
}

// Builds the next `attempted[qid]` value to write after a new attempt.
// `timeSec` should already be a concrete number (attemptedAt must be a
// concrete client timestamp, e.g. Timestamp.now() - serverTimestamp() is
// illegal inside array elements in Firestore).
export function appendAttempt(prevEntry, { selectedIndex, correct, timeSec, attemptedAt }) {
  const prev = normalizeAttemptEntry(prevEntry);
  const nextEntry = { selectedIndex, correct, timeSec: timeSec ?? null, attemptedAt };
  const history = [...prev.history, nextEntry].slice(-MAX_ATTEMPT_HISTORY);
  const everCorrect = prev.everCorrect || correct;
  const bestTimeSec = correct && timeSec != null
    ? (prev.bestTimeSec == null ? timeSec : Math.min(prev.bestTimeSec, timeSec))
    : prev.bestTimeSec;
  return { history, everCorrect, bestTimeSec, attempts: (prev.attempts || 0) + 1 };
}

// ── global (cross-user) stats ────────────────────────────────────────────────
// Derived from the bounded client-writable counters on the question doc
// (attemptCount/correctCount/totalTimeSec - see firestore.rules). These are
// NOT tamper-proof (no Cloud Function verifies an attempt actually
// happened), only bounded to a sane per-write delta - a known, accepted
// limitation until this project has server-side grading.
export function questionGlobalStats(question) {
  const attemptCount = question?.attemptCount || 0;
  const correctCount = question?.correctCount || 0;
  const totalTimeSec = question?.totalTimeSec || 0;
  return {
    attemptCount,
    accuracy: attemptCount > 0 ? Math.round((correctCount / attemptCount) * 100) : null,
    avgTimeSec: attemptCount > 0 ? Math.round(totalTimeSec / attemptCount) : null,
  };
}

// Positive = you were faster than the global average, negative = slower.
export function compareToAverageTime(yourTimeSec, avgTimeSec) {
  if (yourTimeSec == null || !avgTimeSec) return null;
  return Math.round(((avgTimeSec - yourTimeSec) / avgTimeSec) * 100);
}

// ── related questions ────────────────────────────────────────────────────────
// Derived entirely client-side from a topic's already-fetched question list -
// no new query, no admin-authored "related" field to maintain.
export function deriveRelatedQuestions(topicQuestions, currentQuestion, perDifficulty = 2) {
  const buckets = { easy: [], medium: [], hard: [] };
  for (const q of topicQuestions) {
    if (q.id === currentQuestion?.id) continue;
    const bucket = buckets[q.difficulty] || buckets.medium;
    if (bucket.length < perDifficulty) bucket.push(q);
  }
  return buckets;
}

// Company tags are authored per-question, not tracked as a separate global
// counter - "asked ×N" is counted from the questions already loaded for the
// current topic (i.e. "in this topic", not a full cross-topic bank scan).
export function companyFrequencyInSet(questions) {
  const freq = {};
  for (const q of questions) {
    for (const company of q.companies || []) freq[company] = (freq[company] || 0) + 1;
  }
  return Object.entries(freq).sort((a, b) => b[1] - a[1]).map(([company, count]) => ({ company, count }));
}

// ── weakness detection ───────────────────────────────────────────────────────
// Purely derived from topicStats already collected for the streak/accuracy
// feature - no AI, no new storage. A topic only counts once there's enough
// signal (minAttempts) so a single unlucky miss doesn't flag it.
export function detectWeakTopics(topics, topicStats, { minAttempts = 3, maxAccuracy = 50 } = {}) {
  return topics
    .map(t => ({ topic: t, accuracy: topicAccuracy(topicStats, t.id), attempted: topicStats?.[t.id]?.attempted || 0 }))
    .filter(t => t.attempted >= minAttempts && t.accuracy !== null && t.accuracy < maxAccuracy)
    .sort((a, b) => a.accuracy - b.accuracy);
}
