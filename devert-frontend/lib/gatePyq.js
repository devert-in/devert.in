// GATE previous-year questions: the bank itself, open-ended practice over it,
// per-student attempt history, bookmarks, and the automatically-populated
// mistake notebook.
//
// PYQs are STUDY MATERIAL, not assessment - which is why, unlike a test's
// answer keys (lib/gateTests.js), a PYQ document carries its full solution
// inline and is readable the moment it is published. That is the correct trust
// boundary for this content: a student working through the 2019 paper topic by
// topic is supposed to be able to check the worked solution, and hiding it
// behind an attempt would make the bank worse at its actual job. The timed,
// answers-hidden version of the same material is a "Previous Year Mock" test in
// lib/gateTests.js, authored separately and gated properly.
//
// The bank is a FLAT collection keyed on (paperId, year, subjectId, topicId)
// rather than nested under gatePapers/{id}/subjects/{id}/topics/{id}, because
// every one of the nine views the product asks for slices it a different way -
// by year, by subject, by topic, by difficulty, by marks, by repetition, by
// organizing institute. A nested layout would make eight of those nine views a
// fan-out of dozens of queries; a flat collection with composite indexes makes
// them all a single query.
import { db } from "@/lib/firebase";
import {
  collection, doc, addDoc, deleteDoc, getDoc, getDocs, setDoc, updateDoc,
  query, where, serverTimestamp, writeBatch, arrayUnion, arrayRemove,
  increment, Timestamp, deleteField,
} from "firebase/firestore";

// GATE's organizing institute rotates annually and candidates genuinely track
// it, because a paper's flavour tends to follow the institute's own teaching
// emphasis. Stored per-question rather than derived from the year so a
// re-tagged or corrected entry never needs a lookup table update.
export const GATE_ORGANIZING_INSTITUTES = [
  "IIT Madras", "IISc Bangalore", "IIT Kanpur", "IIT Delhi", "IIT Bombay",
  "IIT Kharagpur", "IIT Roorkee", "IIT Guwahati", "IIT Hyderabad",
];

const MAX_ATTEMPT_HISTORY = 10;
// The mistake notebook is one Firestore document, so it needs a hard ceiling
// well below the 1 MB limit. At ~400 bytes per entry (a truncated stem plus
// metadata) 400 entries is roughly 160 KB - generous for a notebook a student
// actually revisits, and far from the limit. Past the cap, the oldest RESOLVED
// entries are evicted first, and only then the oldest unresolved ones, so
// clearing out mistakes you have genuinely fixed is what makes room.
const MAX_MISTAKES = 400;
const MISTAKE_STEM_CHARS = 240;

// ---------------- the bank ----------------

// Every non-admin list() carries where("status","==","published") - mandatory,
// not stylistic (see lib/programming.js's fetchLanguages). Each of the
// filtered variants below needs its own composite index; they are all declared
// in firestore.indexes.json.
export async function fetchPyqs(paperId, { year, subjectId, topicId, includeUnpublished = false } = {}) {
  const filters = [where("paperId", "==", paperId)];
  if (!includeUnpublished) filters.push(where("status", "==", "published"));
  // At most ONE of year/subject/topic is pushed as a query filter and the rest
  // are applied in memory. Firestore would happily index every combination,
  // but that is a combinatorial index explosion for a bank small enough
  // (a few thousand documents per paper, at the very most) that one broad
  // query plus client-side narrowing is both cheaper and simpler to reason
  // about. The chosen filter is the most selective one available.
  if (topicId) filters.push(where("topicId", "==", topicId));
  else if (subjectId) filters.push(where("subjectId", "==", subjectId));
  else if (year) filters.push(where("year", "==", Number(year)));

  const snap = await getDocs(query(collection(db, "gate_pyqs"), ...filters));
  let rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  if (topicId && subjectId) rows = rows.filter(r => r.subjectId === subjectId);
  if (year && (topicId || subjectId)) rows = rows.filter(r => r.year === Number(year));
  if (subjectId && topicId) rows = rows.filter(r => r.topicId === topicId);
  return sortPyqs(rows);
}

// Year descending (most recent paper first - what a candidate wants), then
// question order within a paper.
function sortPyqs(rows) {
  return rows.sort((a, b) => (b.year || 0) - (a.year || 0) || (a.order || 0) - (b.order || 0));
}

export async function fetchPyq(pyqId) {
  const snap = await getDoc(doc(db, "gate_pyqs", pyqId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function savePyq(pyqId, data) {
  const payload = {
    ...data,
    year: Number(data.year) || null,
    marks: Number(data.marks) === 2 ? 2 : 1,
    updatedAt: serverTimestamp(),
  };
  if (pyqId) {
    await setDoc(doc(db, "gate_pyqs", pyqId), payload, { merge: true });
    return pyqId;
  }
  const ref = await addDoc(collection(db, "gate_pyqs"), { ...payload, createdAt: serverTimestamp() });
  return ref.id;
}

export async function deletePyq(pyqId) {
  await deleteDoc(doc(db, "gate_pyqs", pyqId));
}

// ---------------- review queue (PDF-extracted drafts) ----------------

// A question imported from an official GATE question paper by
// scripts/extract-gate-pyqs.mjs arrives as status:"draft" with a non-empty
// reviewFlags array and NO ANSWER - the source PDFs contain no answer key, so
// there is nothing to import one from. These helpers are the path from that
// state to a published question, and they exist in this module rather than in
// the admin component so the "what makes a question publishable" rule lives
// next to the schema it is about.

// The flags scripts/extract-gate-pyqs.mjs raises, with what each one means for
// a reviewer. Kept here, beside the bank, so the admin UI and the extractor
// cannot drift into describing the same flag differently.
export const PYQ_REVIEW_FLAGS = {
  "no-answer-key": "The source paper has no answer key - supply the answer",
  "symbol-loss": "Mathematical symbols were dropped in extraction - check against the original",
  "figure-reference": "Refers to a figure/diagram that is not in the text",
  "truncated-stem": "Stem is suspiciously short - probably an image-based question",
  "option-count": "Does not have exactly four options",
  "empty-option": "At least one option extracted as empty - likely image options",
};

// The one gate between an extracted draft and a student seeing it. Publishing
// a question whose answer nobody supplied would be worse than not having the
// question: a candidate revising would be marked wrong on a correct answer and
// have it filed into their mistakes notebook, and the per-topic accuracy the
// analytics screen reports would be measuring the import, not the student.
// Hence a hard refusal here rather than a warning in the UI.
export function pyqPublishBlockers(pyq) {
  const blockers = [];
  if (!(pyq.question || "").trim()) blockers.push("The question text is empty.");
  if (pyq.questionType === "nat") {
    if (!Number.isFinite(pyq.natMin)) blockers.push("A NAT question needs an accepted numeric answer.");
  } else {
    if (!(pyq.options || []).length) blockers.push("No options.");
    if (!(pyq.correctOptionIds || []).length) blockers.push("No correct answer has been supplied.");
    if (pyq.questionType === "mcq" && (pyq.correctOptionIds || []).length > 1) {
      blockers.push("An MCQ must have exactly one correct option (use MSQ for several).");
    }
    if ((pyq.options || []).some(o => !(o.text || "").trim())) blockers.push("An option is empty.");
  }
  if (!(pyq.subjectId || "").trim()) blockers.push("No subject assigned.");
  return blockers;
}

// Marks a draft verified and publishes it in ONE write, because the two are
// the same decision: "I have checked this against the original paper" is
// exactly what makes it fit to show. Splitting them into verify-then-publish
// would create a third state (verified but invisible) that nothing renders and
// nobody would remember to clear.
export async function verifyAndPublishPyq(pyqId, pyq, reviewerUid) {
  const blockers = pyqPublishBlockers(pyq);
  if (blockers.length) throw new Error(blockers.join(" "));
  await updateDoc(doc(db, "gate_pyqs", pyqId), {
    status: "published",
    needsReview: false,
    reviewedAt: serverTimestamp(),
    reviewedBy: reviewerUid || null,
    updatedAt: serverTimestamp(),
  });
}

// Sends a published question back to the queue - the honest action when a
// student reports that an answer is wrong. It un-publishes rather than just
// tagging it, so the questionable version stops being served the moment the
// doubt is raised rather than when the correction is finished.
export async function sendPyqBackToReview(pyqId, reason) {
  await updateDoc(doc(db, "gate_pyqs", pyqId), {
    status: "draft",
    needsReview: true,
    reviewedAt: null,
    reviewedBy: null,
    reviewFlags: arrayUnion(reason || "reopened"),
    updatedAt: serverTimestamp(),
  });
}

export async function importPyqsBatch(rows) {
  for (let i = 0; i < rows.length; i += 200) {
    const batch = writeBatch(db);
    rows.slice(i, i + 200).forEach((row, idx) => {
      batch.set(doc(collection(db, "gate_pyqs")), {
        ...row,
        year: Number(row.year) || null,
        marks: Number(row.marks) === 2 ? 2 : 1,
        order: row.order ?? (i + idx + 1),
        createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
      });
    });
    await batch.commit();
  }
}

// ---------------- exam analysis (pure, over an already-fetched bank) ----------------

export function availableYears(pyqs) {
  return [...new Set(pyqs.map(p => p.year).filter(Boolean))].sort((a, b) => b - a);
}

// Per-year, per-subject question and mark counts - the "what does this paper
// actually weight" table. Everything here is derived from the bank rather than
// from an admin-typed weightage, so it can't drift from the questions that
// exist.
export function analyseByYear(pyqs) {
  const years = {};
  for (const p of pyqs) {
    if (!p.year) continue;
    const y = years[p.year] || (years[p.year] = {
      year: p.year, count: 0, marks: 0, institute: p.organizingInstitute || "",
      bySubject: {}, byType: { mcq: 0, msq: 0, nat: 0 },
    });
    y.count++;
    y.marks += p.marks || 1;
    y.byType[p.questionType] = (y.byType[p.questionType] || 0) + 1;
    const sid = p.subjectId || "unassigned";
    y.bySubject[sid] = (y.bySubject[sid] || 0) + (p.marks || 1);
    if (!y.institute && p.organizingInstitute) y.institute = p.organizingInstitute;
  }
  return Object.values(years).sort((a, b) => b.year - a.year);
}

// Topics ranked by how much of the paper they have historically been worth.
// `yearsAsked` matters more than raw count for planning: a topic worth 6 marks
// once is a gamble, a topic worth 2 marks in eight of the last ten papers is
// a certainty.
export function analyseByTopic(pyqs, { minYears = 1 } = {}) {
  const topics = {};
  for (const p of pyqs) {
    const key = p.topicId || "unassigned";
    const t = topics[key] || (topics[key] = {
      topicId: key, subjectId: p.subjectId || "", count: 0, marks: 0, years: new Set(),
    });
    t.count++;
    t.marks += p.marks || 1;
    if (p.year) t.years.add(p.year);
  }
  return Object.values(topics)
    .map(t => ({ ...t, years: [...t.years].sort((a, b) => b - a), yearsAsked: t.years.size }))
    .filter(t => t.yearsAsked >= minYears)
    .sort((a, b) => b.marks - a.marks || b.yearsAsked - a.yearsAsked);
}

// "Frequently asked" is defined here, once, rather than being a vibe each
// screen guesses at: a topic asked in at least a third of the years the bank
// covers, with at least three questions. Both thresholds are needed - the
// first alone promotes a topic with one question spread thinly, the second
// alone promotes a topic that appeared three times in a single paper and never
// again.
export function frequentlyAskedTopics(pyqs) {
  const totalYears = availableYears(pyqs).length;
  if (totalYears === 0) return [];
  const threshold = Math.max(2, Math.ceil(totalYears / 3));
  return analyseByTopic(pyqs).filter(t => t.yearsAsked >= threshold && t.count >= 3);
}

// Repeated questions. `isRepeated`/`repeatGroup` are admin-authored (a human
// decides two questions are "the same question rephrased" - no string-similarity
// heuristic is trustworthy enough to make that call and then show it to a
// student as fact). Questions sharing a repeatGroup are returned grouped.
export function repeatedQuestionGroups(pyqs) {
  const groups = {};
  for (const p of pyqs) {
    if (!p.repeatGroup) continue;
    (groups[p.repeatGroup] || (groups[p.repeatGroup] = [])).push(p);
  }
  return Object.entries(groups)
    .map(([key, items]) => ({
      repeatGroup: key,
      items: sortPyqs(items),
      years: [...new Set(items.map(i => i.year).filter(Boolean))].sort((a, b) => b - a),
    }))
    .filter(g => g.items.length > 1)
    .sort((a, b) => b.items.length - a.items.length);
}

export function groupByInstitute(pyqs) {
  const byInstitute = {};
  for (const p of pyqs) {
    const key = p.organizingInstitute || "Unattributed";
    const g = byInstitute[key] || (byInstitute[key] = { institute: key, count: 0, years: new Set(), byType: {} });
    g.count++;
    if (p.year) g.years.add(p.year);
    g.byType[p.questionType] = (g.byType[p.questionType] || 0) + 1;
  }
  return Object.values(byInstitute)
    .map(g => ({ ...g, years: [...g.years].sort((a, b) => b - a) }))
    .sort((a, b) => b.count - a.count);
}

// ---------------- per-student PYQ attempts ----------------

export function pyqProgressId(uid, paperId) { return `${uid}_${paperId}`; }

export async function fetchPyqProgress(uid, paperId) {
  const snap = await getDoc(doc(db, "gate_pyq_progress", pyqProgressId(uid, paperId)));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// Normalizes one entry of the `attempted` map. Kept as an explicit read model
// (rather than trusting the stored shape) so a doc written by an older version
// of this code keeps working without a bulk migration - the identical approach
// lib/aptitude.js's normalizeAttemptEntry takes, and for the same reason.
export function normalizeAttempt(entry) {
  if (!entry) return { history: [], everCorrect: false, bestTimeSec: null, attempts: 0 };
  if (entry.history) return entry;
  return {
    history: [{ correct: !!entry.correct, timeSec: entry.timeSec ?? null, attemptedAt: entry.attemptedAt }],
    everCorrect: !!entry.correct,
    bestTimeSec: entry.timeSec ?? null,
    attempts: 1,
  };
}

// Records one attempt at one PYQ, and - when it was wrong - files it into the
// mistake notebook in the same call. Coupling those two writes here is
// deliberate: a "mistake notebook" that depends on every call site remembering
// to also log the mistake is a notebook with holes in it.
//
// Dotted field paths inside merge:true, never a nested object literal: a
// nested literal would replace the entire `attempted` map and wipe every other
// question's history. attemptedAt uses Timestamp.now(), not serverTimestamp() -
// the sentinel is illegal inside array elements in Firestore, which is why the
// history array carries a client clock (same constraint documented in
// lib/aptitude.js's appendAttempt and lib/contentVersioning.js).
export async function recordPyqAttempt({ uid, paperId, pyq, correct, timeSec }) {
  const ref = doc(db, "gate_pyq_progress", pyqProgressId(uid, paperId));
  const existing = await getDoc(ref);
  const prev = normalizeAttempt(existing.data()?.attempted?.[pyq.id]);

  const entry = {
    correct: !!correct,
    timeSec: Number.isFinite(timeSec) ? timeSec : null,
    attemptedAt: Timestamp.now(),
  };
  const history = [...prev.history, entry].slice(-MAX_ATTEMPT_HISTORY);
  const bestTimeSec = correct && Number.isFinite(timeSec)
    ? (prev.bestTimeSec == null ? timeSec : Math.min(prev.bestTimeSec, timeSec))
    : prev.bestTimeSec;

  await setDoc(ref, {
    uid, paperId,
    [`attempted.${pyq.id}`]: {
      history, bestTimeSec: bestTimeSec ?? null,
      everCorrect: prev.everCorrect || !!correct,
      attempts: (prev.attempts || 0) + 1,
    },
    // Per-topic rollups, so the revision engine and the analytics screen never
    // have to walk the whole attempted map to answer "how am I doing on
    // pipelining". increment() is safe on a non-reward statistic.
    [`topicStats.${pyq.topicId || "unassigned"}.attempted`]: increment(1),
    [`topicStats.${pyq.topicId || "unassigned"}.correct`]: increment(correct ? 1 : 0),
    [`subjectStats.${pyq.subjectId || "unassigned"}.attempted`]: increment(1),
    [`subjectStats.${pyq.subjectId || "unassigned"}.correct`]: increment(correct ? 1 : 0),
    updatedAt: serverTimestamp(),
  }, { merge: true });

  if (!correct) {
    await recordMistake({
      uid, paperId,
      source: "pyq", questionId: pyq.id,
      subjectId: pyq.subjectId || "", topicId: pyq.topicId || "",
      stem: pyq.question || "", year: pyq.year || null,
      reason: "wrong-answer",
    });
  } else if (prev.attempts > 0) {
    // Got it right after previously getting it wrong: the notebook entry stays
    // (so the student can see what they fixed) but is marked resolved, which is
    // also what makes it first in line for eviction when the cap is hit.
    await resolveMistake({ uid, paperId, source: "pyq", questionId: pyq.id });
  }
}

// ---------------- mistake notebook ----------------

export function notesDocId(uid, paperId) { return `${uid}_${paperId}`; }
export function mistakeKey(source, questionId) { return `${source}__${questionId}`; }

export async function fetchNotes(uid, paperId) {
  const snap = await getDoc(doc(db, "gate_notes", notesDocId(uid, paperId)));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// `reason` is a small closed vocabulary rather than free text, because the
// notebook's filters ("show me only the ones I ran out of time on") are only
// useful if the values are consistent.
export const MISTAKE_REASONS = [
  { key: "wrong-answer", label: "Wrong answer" },
  { key: "too-slow", label: "Took too long" },
  { key: "silly-mistake", label: "Silly mistake" },
  { key: "concept-gap", label: "Concept not clear" },
  { key: "misread", label: "Misread the question" },
  { key: "guessed", label: "Guessed" },
];

export async function recordMistake({ uid, paperId, source, questionId, subjectId, topicId, stem, year, reason = "wrong-answer" }) {
  const ref = doc(db, "gate_notes", notesDocId(uid, paperId));
  const existing = (await getDoc(ref)).data();
  const key = mistakeKey(source, questionId);
  const prev = existing?.mistakes?.[key];

  // Only the stem is stored, truncated - not the options, not the solution.
  // The notebook needs enough text to recognise the question; the authoritative
  // copy is still the bank document, which the notebook links to.
  const patch = {
    uid, paperId,
    [`mistakes.${key}`]: {
      source, questionId, subjectId: subjectId || "", topicId: topicId || "",
      stem: (stem || "").slice(0, MISTAKE_STEM_CHARS),
      year: year ?? null,
      reason,
      timesWrong: (prev?.timesWrong || 0) + 1,
      firstWrongAt: prev?.firstWrongAt || Timestamp.now(),
      lastWrongAt: Timestamp.now(),
      resolved: false,
    },
    updatedAt: serverTimestamp(),
  };
  await setDoc(ref, patch, { merge: true });

  // Eviction runs after the write, not before: the entry that just happened is
  // the one the student cares about most, so it must land even if the notebook
  // is already at the cap.
  const count = Object.keys({ ...(existing?.mistakes || {}), [key]: 1 }).length;
  if (count > MAX_MISTAKES) await evictOldestMistakes(ref, count - MAX_MISTAKES);
}

// deleteField(), not a null value: writing null into a merge:true set stores a
// null, it does not remove the field, so the entry would still count toward the
// cap forever.
async function evictOldestMistakes(ref, howMany) {
  const data = (await getDoc(ref)).data();
  const entries = Object.entries(data?.mistakes || {});
  const age = ([, m]) => m.lastWrongAt?.seconds ?? 0;
  // Resolved first, oldest within each group - see MAX_MISTAKES.
  entries.sort((a, b) => (Number(!!b[1].resolved) - Number(!!a[1].resolved)) || (age(a) - age(b)));
  const doomed = entries.slice(0, howMany);
  if (!doomed.length) return;
  const del = {};
  for (const [key] of doomed) del[`mistakes.${key}`] = deleteField();
  await updateDoc(ref, del);
}

export async function resolveMistake({ uid, paperId, source, questionId }) {
  const ref = doc(db, "gate_notes", notesDocId(uid, paperId));
  const key = mistakeKey(source, questionId);
  const existing = (await getDoc(ref)).data();
  if (!existing?.mistakes?.[key]) return;
  await setDoc(ref, {
    [`mistakes.${key}.resolved`]: true,
    [`mistakes.${key}.resolvedAt`]: Timestamp.now(),
  }, { merge: true });
}

export async function setMistakeReason({ uid, paperId, source, questionId, reason }) {
  await setDoc(doc(db, "gate_notes", notesDocId(uid, paperId)), {
    [`mistakes.${mistakeKey(source, questionId)}.reason`]: reason,
  }, { merge: true });
}

export async function clearMistake({ uid, paperId, source, questionId }) {
  await updateDoc(doc(db, "gate_notes", notesDocId(uid, paperId)), {
    [`mistakes.${mistakeKey(source, questionId)}`]: deleteField(),
  });
}

// Bulk capture from a graded test, called once from the results screen. One
// write for the whole test rather than one per wrong question: a 65-question
// mock would otherwise fire dozens of sequential document writes.
export async function recordTestMistakes({ uid, paperId, testId, grading, questions }) {
  const wrong = grading.perQuestion.filter(p => p.status === "wrong");
  const slow = grading.perQuestion.filter(p => p.status === "correct" && Number.isFinite(p.timeSec));
  const avgCorrect = slow.length ? slow.reduce((n, p) => n + p.timeSec, 0) / slow.length : null;
  // A correct-but-very-slow answer is a real weakness in a timed exam, so it
  // is filed too - with its own reason, so the notebook doesn't imply it was
  // answered incorrectly.
  const tooSlow = avgCorrect
    ? grading.perQuestion.filter(p => p.status === "correct" && p.timeSec > avgCorrect * 2.5)
    : [];
  if (!wrong.length && !tooSlow.length) return;

  const byId = new Map(questions.map(q => [q.id, q]));
  const patch = { uid, paperId, updatedAt: serverTimestamp() };
  const now = Timestamp.now();
  const file = (p, reason) => {
    const q = byId.get(p.questionId);
    const key = mistakeKey(`test:${testId}`, p.questionId);
    patch[`mistakes.${key}`] = {
      source: `test:${testId}`, questionId: p.questionId,
      subjectId: p.subjectId || "", topicId: p.topicId || "",
      stem: (q?.question || "").slice(0, MISTAKE_STEM_CHARS),
      year: null, reason, timesWrong: 1,
      firstWrongAt: now, lastWrongAt: now, resolved: false,
    };
  };
  wrong.forEach(p => file(p, "wrong-answer"));
  tooSlow.forEach(p => file(p, "too-slow"));

  await setDoc(doc(db, "gate_notes", notesDocId(uid, paperId)), patch, { merge: true });
}

export function mistakeList(notes, { reason = null, subjectId = null, includeResolved = false } = {}) {
  const all = Object.entries(notes?.mistakes || {}).map(([key, m]) => ({ key, ...m }));
  return all
    .filter(m => includeResolved || !m.resolved)
    .filter(m => !reason || m.reason === reason)
    .filter(m => !subjectId || m.subjectId === subjectId)
    .sort((a, b) => (b.timesWrong || 0) - (a.timesWrong || 0)
      || ((b.lastWrongAt?.seconds || 0) - (a.lastWrongAt?.seconds || 0)));
}

// Concepts a student gets wrong repeatedly, across both PYQs and tests -
// "weak concepts" in the product spec. Two-strike threshold: one wrong answer
// is noise, the same topic twice is a pattern.
export function weakConceptsFromMistakes(notes, { minHits = 2 } = {}) {
  const byTopic = {};
  for (const m of mistakeList(notes, { includeResolved: false })) {
    const key = m.topicId || "unassigned";
    const t = byTopic[key] || (byTopic[key] = { topicId: key, subjectId: m.subjectId, hits: 0, questions: [] });
    t.hits += m.timesWrong || 1;
    t.questions.push(m);
  }
  return Object.values(byTopic).filter(t => t.hits >= minHits).sort((a, b) => b.hits - a.hits);
}

// ---------------- bookmarks ----------------

// Three separate arrays on one document rather than three documents: bookmarks
// are always read together (the Bookmarks screen shows all three kinds) and are
// small enough that a single doc read is strictly cheaper.
const BOOKMARK_FIELDS = {
  topic: "bookmarkedTopicIds",
  pyq: "bookmarkedPyqIds",
  formula: "bookmarkedFormulaIds",
  question: "bookmarkedQuestionIds",
};

export async function toggleBookmark({ uid, paperId, kind, id, on }) {
  const field = BOOKMARK_FIELDS[kind];
  if (!field) throw new Error(`Unknown bookmark kind "${kind}".`);
  await setDoc(doc(db, "gate_notes", notesDocId(uid, paperId)), {
    uid, paperId,
    [field]: on ? arrayUnion(id) : arrayRemove(id),
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export function isBookmarked(notes, kind, id) {
  return !!notes?.[BOOKMARK_FIELDS[kind]]?.includes(id);
}

// ---------------- personal notes ----------------

export async function saveTopicNote({ uid, paperId, topicId, text }) {
  await setDoc(doc(db, "gate_notes", notesDocId(uid, paperId)), {
    uid, paperId,
    [`topicNotes.${topicId}`]: (text || "").slice(0, 4000),
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

// ---------------- generated practice sets ----------------

// Adaptive / revision / daily-mini practice is COMPOSED here from the PYQ bank
// rather than authored as a gate_tests document, and that is the whole reason
// those modes can exist at all: nobody can hand-author a personalised test per
// student per day. Because the source is study material with open solutions,
// these sets are practice (immediate feedback, unlimited retries), never scored
// assessments - see this file's header for why that distinction is enforced by
// where the content lives rather than by a flag.
//
// Pure and deterministic given the same inputs, with no Math.random(): the
// ordering is a stable hash of the question id and a caller-supplied seed, so
// re-opening today's practice set shows the same questions in the same order
// instead of silently reshuffling under the student.
function seededRank(id, seed) {
  let h = 2166136261;
  const s = `${seed}:${id}`;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0) / 4294967295;
}

export const PRACTICE_MODES = [
  { key: "weak", label: "Weak topics", detail: "Questions from the topics you get wrong most." },
  { key: "unattempted", label: "Fresh questions", detail: "Only questions you have never attempted." },
  { key: "mistakes", label: "Redo my mistakes", detail: "Exactly the questions in your mistake notebook." },
  { key: "revision", label: "Revision", detail: "Topics you have studied but not revised recently." },
  { key: "mixed", label: "Mixed bag", detail: "A spread across everything in the bank." },
];

export function buildPracticeSet({
  pyqs, progress, notes, mode = "mixed", size = 15, seed = "", subjectId = null, topicIds = null,
}) {
  const attempted = progress?.attempted || {};
  const weak = new Set(weakConceptsFromMistakes(notes).map(t => t.topicId));
  const mistakeIds = new Set(mistakeList(notes).filter(m => m.source === "pyq").map(m => m.questionId));

  let pool = pyqs.filter(p => !subjectId || p.subjectId === subjectId);
  if (topicIds?.length) {
    const allow = new Set(topicIds);
    pool = pool.filter(p => allow.has(p.topicId));
  }

  if (mode === "weak") pool = pool.filter(p => weak.has(p.topicId));
  else if (mode === "unattempted") pool = pool.filter(p => !attempted[p.id]);
  else if (mode === "mistakes") pool = pool.filter(p => mistakeIds.has(p.id));
  else if (mode === "revision") pool = pool.filter(p => attempted[p.id] && normalizeAttempt(attempted[p.id]).everCorrect);

  // A mode with nothing to offer falls back to the full pool rather than
  // rendering an empty screen - but the caller is told, so the UI can say
  // "no weak topics yet, here's a mixed set instead" instead of quietly
  // substituting different content.
  const fellBack = pool.length === 0 && pyqs.length > 0;
  if (fellBack) pool = pyqs.filter(p => !subjectId || p.subjectId === subjectId);

  const ranked = [...pool].sort((a, b) => seededRank(a.id, seed) - seededRank(b.id, seed));
  return { questions: ranked.slice(0, size), poolSize: pool.length, fellBack, mode };
}

// A PYQ is graded with the same rules a test question is - imported rather than
// reimplemented, so "correct" can never mean two different things in two
// screens.
export { isCorrectAnswer as isPyqCorrect } from "@/lib/gateTests";
