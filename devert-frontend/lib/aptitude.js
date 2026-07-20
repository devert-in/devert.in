import { db } from "@/lib/firebase";
import { collection, doc, getDocs, getDoc, query, orderBy } from "firebase/firestore";

export const APTITUDE_CATEGORIES = ["Quantitative", "Logical", "Verbal"];

// Fixed vocabulary for exam-relevance badges - single source of truth,
// shared by the admin authoring form/CSV importer and the question workspace.
export const APTITUDE_EXAM_TAGS = ["GATE", "CAT", "Campus Placement", "Product Companies", "Banking", "SSC", "UPSC", "GRE"];

const MAX_ATTEMPT_HISTORY = 10;

export async function fetchAptitudeTopics() {
  const snap = await getDocs(query(collection(db, "aptitude_topics"), orderBy("order", "asc")));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function fetchTopicQuestions(topicId) {
  const snap = await getDocs(query(collection(db, "aptitude_topics", topicId, "questions"), orderBy("order", "asc")));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
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
