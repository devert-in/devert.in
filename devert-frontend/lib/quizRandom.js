// Shared MCQ randomization engine - the single place question/option shuffling
// lives for Daily Learning, CS Core, Programming, Company Vault and Contests.
//
// Shuffling is a pure rendering concern: every caller keeps grading and
// storage keyed off the ORIGINAL stored option index (or a stable question
// id), never a shuffled position. That's what makes this safe to apply
// on top of years of already-authored content with zero data migration -
// nothing about `correctIndex` or an answers map ever needs to change,
// only what order things are painted in.
//
// The shuffle is deterministic (seeded from uid + a stable scope key), not
// truly random, on purpose: a deterministic seed reproduces the exact same
// question/option order on every render without persisting a shuffle seed
// anywhere. Refreshing, navigating away and back, or reconnecting all derive
// the same seed and land on the same order - there is no state to lose and
// nothing for a student to defeat by reloading.

function hashSeed(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

function mulberry32(seed) {
  let a = seed;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seededRandom(key) {
  const seedFn = hashSeed(String(key));
  const seed = Math.floor(seedFn() * 4294967296);
  return mulberry32(seed);
}

export function seededShuffle(array, key) {
  const rand = seededRandom(key);
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Builds the deterministic seed key for one (student, quiz-scope) shuffle.
// `scope` should uniquely identify the quiz itself (a topic id, a day's
// date, a question id, a contest id...). Pass `attemptId` only for quizzes
// that will support multiple attempts in the future (e.g. a "retake" flow) -
// a fresh attemptId reshuffles into a new order, while resuming with the
// SAME attemptId reproduces the same one. Every current caller is
// single-attempt and omits it, which is exactly today's behavior unchanged.
// `uid` alone already guarantees no two students collide (Firebase Auth uids
// are globally unique across the whole platform, not per-institution), so
// there's no need to separately fold in an institution id for uniqueness.
export function buildQuizSeedKey({ uid, scope, attemptId } = {}) {
  const base = `${uid || "preview"}:${scope}`;
  return attemptId ? `${base}:${attemptId}` : base;
}

// Shuffles both question order and, within each question, option order for
// one quiz attempt. Every question in the returned array gains `_origIndex`
// (its position in the input `mcqs` array - the stable identity to key an
// answers map off when the question has no `id` of its own) and its
// `options` become `{ originalIndex, text }` objects in shuffled display
// order. `originalIndex` is what grading must compare against
// `question.correctIndex` and what an answers map should store - never the
// rendered position.
//
// `seedKey` should be unique per (student, quiz) - e.g. `${uid}:${topicId}`
// - so two students see different orders but the same student always sees
// the same order for that quiz. Include something that changes on a genuine
// retake (a fresh date, a new attempt id) if the quiz can be retaken, so a
// retake gets a fresh shuffle instead of memorizing the first one's layout.
const DRAFT_KEY_PREFIX = "devert_quiz_draft:";

// Lightweight resume-after-refresh for quizzes that have no Firestore
// attempt doc of their own (CS Core/Programming topic quizzes gate a local
// "Complete Topic" action, not a graded/persisted score - Daily Learning and
// Contests already have their own Firestore-backed draft/submission
// persistence and don't need this). Order never needs to be stored here -
// shuffleQuizForAttempt already reproduces it deterministically - only the
// in-progress answers/submitted flag do.
export function loadQuizDraft(storageKey) {
  if (typeof window === "undefined" || !storageKey) return null;
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY_PREFIX + storageKey);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveQuizDraft(storageKey, draft) {
  if (typeof window === "undefined" || !storageKey) return;
  try {
    window.localStorage.setItem(DRAFT_KEY_PREFIX + storageKey, JSON.stringify(draft));
  } catch {
    // best-effort only - a full/blocked localStorage just means no resume, not a broken quiz
  }
}

export function shuffleQuizForAttempt(mcqs, seedKey) {
  if (!Array.isArray(mcqs) || mcqs.length === 0) return [];
  const questionOrder = seededShuffle(mcqs.map((_, i) => i), `${seedKey}:qorder`);
  return questionOrder.map(qi => {
    const q = mcqs[qi];
    const stableQKey = q.id != null ? q.id : `i${qi}`;
    const options = Array.isArray(q.options) ? q.options : [];
    const optionOrder = seededShuffle(options.map((_, i) => i), `${seedKey}:${stableQKey}:opts`);
    return {
      ...q,
      _origIndex: qi,
      options: optionOrder.map(oi => ({ originalIndex: oi, text: options[oi] })),
    };
  });
}
