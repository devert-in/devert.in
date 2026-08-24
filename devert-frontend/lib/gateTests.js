// GATE testing engine - authored tests, timed attempts, GATE's real marking
// scheme, post-test analysis, and score-to-rank estimation.
//
// SCOPE BOUNDARY, deliberately drawn: this module owns ASSESSMENTS - things
// with a clock, one attempt, and answers hidden until you submit. Open-ended
// practice over the previous-year bank (where the solution is meant to be
// readable while you work) lives in lib/gatePyq.js instead. That split is why
// answer keys here can be genuinely read-gated while PYQ solutions stay open:
// they are different products, not the same one with a flag.
//
// The question/answerKey split mirrors lib/contests.js exactly - a test's
// `questions` subcollection carries NO correct-answer data, and the sibling
// `answerKeys` subcollection is gated in firestore.rules on the requester
// having an already-submitted attempt for that test. So the flow is
// necessarily: write the attempt (submitted) -> only then read keys -> grade ->
// persist the grading. Reading the keys before submitting is not "discouraged
// by the UI", it is denied by the database.
import { db } from "@/lib/firebase";
import {
  collection, doc, addDoc, deleteDoc, getDoc, getDocs, setDoc, updateDoc,
  query, where, orderBy, limit, serverTimestamp, writeBatch, runTransaction,
} from "firebase/firestore";

// ---------------- question model ----------------

// GATE's three real question types. Nothing else appears on the paper, so
// nothing else is modelled - a true/false or fill-in-the-blank question would
// be inauthentic practice.
export const GATE_QUESTION_TYPES = [
  { key: "mcq", label: "MCQ", detail: "Single correct option. Negative marking applies." },
  { key: "msq", label: "MSQ", detail: "Multiple select, all-or-nothing. No negative marking." },
  { key: "nat", label: "NAT", detail: "Numerical answer typed in. No negative marking." },
];

export const GATE_MARKS = [1, 2];

// GATE's actual marking scheme, as published in every information brochure:
//   - MCQ, 1 mark  -> minus 1/3 for a wrong answer
//   - MCQ, 2 marks -> minus 2/3 for a wrong answer
//   - MSQ          -> no negative marking, but no partial credit either:
//                     the selected set must match the key exactly
//   - NAT          -> no negative marking
// Unattempted questions never score and never penalise, for any type.
//
// This is the single source of truth for penalties. A test document may NOT
// override it: an "exam-realistic mock" whose marking differs from the exam
// teaches the wrong risk calculus about when to guess, which is one of the few
// genuinely decisive skills in a GATE attempt. Admins can still author easier
// practice by choosing question types (all MSQ/NAT = no penalty at all), which
// is an honest lever; silently softening MCQ penalties is not.
export function negativeMarkFor(question) {
  if (question?.questionType !== "mcq") return 0;
  return (question.marks === 2) ? 2 / 3 : 1 / 3;
}

export const TEST_TYPES = [
  { key: "full", label: "Full Length", detail: "65 questions, 100 marks, 180 minutes - the whole paper.", icon: "full" },
  { key: "subject", label: "Subject Test", detail: "One subject, end to end.", icon: "subject" },
  { key: "topic", label: "Topic Test", detail: "A single topic, short and focused.", icon: "topic" },
  { key: "mixed", label: "Mixed Test", detail: "Several subjects together, like the real paper's jumbled order.", icon: "mixed" },
  { key: "weekly", label: "Weekly Test", detail: "A scheduled weekly checkpoint.", icon: "weekly" },
  { key: "pyq", label: "Previous Year Mock", detail: "A real past paper, reconstructed and timed.", icon: "pyq" },
  { key: "revision", label: "Revision Test", detail: "Drawn from topics you have already studied.", icon: "revision" },
];

export function testTypeLabel(key) {
  return TEST_TYPES.find(t => t.key === key)?.label || key;
}

// ---------------- test catalog ----------------

// Same mandatory where("status","==","published") as every other catalog here -
// see lib/programming.js's fetchLanguages. paperId is the second filter; the
// pair needs the composite index declared in firestore.indexes.json.
export async function fetchTests(paperId, { includeUnpublished = false } = {}) {
  const col = collection(db, "gate_tests");
  const q = includeUnpublished
    ? query(col, where("paperId", "==", paperId))
    : query(col, where("paperId", "==", paperId), where("status", "==", "published"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (a.order || 0) - (b.order || 0));
}

export async function fetchTest(testId) {
  const snap = await getDoc(doc(db, "gate_tests", testId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function saveTest(testId, data) {
  if (testId) {
    await setDoc(doc(db, "gate_tests", testId), { updatedAt: serverTimestamp(), ...data }, { merge: true });
    return testId;
  }
  const ref = await addDoc(collection(db, "gate_tests"), {
    createdAt: serverTimestamp(), updatedAt: serverTimestamp(), ...data,
  });
  return ref.id;
}

export async function deleteTest(testId) {
  const [qSnap, akSnap] = await Promise.all([
    getDocs(collection(db, "gate_tests", testId, "questions")),
    getDocs(collection(db, "gate_tests", testId, "answerKeys")),
  ]);
  const refs = [...qSnap.docs, ...akSnap.docs].map(d => d.ref);
  for (let i = 0; i < refs.length; i += 450) {
    const batch = writeBatch(db);
    refs.slice(i, i + 450).forEach(ref => batch.delete(ref));
    await batch.commit();
  }
  await deleteDoc(doc(db, "gate_tests", testId));
}

export async function fetchTestQuestions(testId) {
  const snap = await getDocs(query(collection(db, "gate_tests", testId, "questions"), orderBy("order", "asc")));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// Denied by firestore.rules unless this user already has a SUBMITTED attempt
// for this test. Callers must therefore submit first and only then grade -
// gradeAndPersist() below encodes that ordering so no call site has to remember
// it.
export async function fetchTestAnswerKeys(testId) {
  const snap = await getDocs(collection(db, "gate_tests", testId, "answerKeys"));
  const keys = {};
  snap.docs.forEach(d => { keys[d.id] = d.data(); });
  return keys;
}

export async function addTestQuestion(testId, question, order) {
  const qRef = doc(collection(db, "gate_tests", testId, "questions"));
  await setDoc(qRef, buildQuestionDoc(question, order));
  await setDoc(doc(db, "gate_tests", testId, "answerKeys", qRef.id), buildAnswerKeyDoc(question));
  return qRef.id;
}

export async function updateTestQuestion(testId, questionId, question, order) {
  await setDoc(doc(db, "gate_tests", testId, "questions", questionId), buildQuestionDoc(question, order), { merge: true });
  await setDoc(doc(db, "gate_tests", testId, "answerKeys", questionId), buildAnswerKeyDoc(question), { merge: true });
}

export async function deleteTestQuestion(testId, questionId) {
  await deleteDoc(doc(db, "gate_tests", testId, "questions", questionId));
  await deleteDoc(doc(db, "gate_tests", testId, "answerKeys", questionId));
}

// The two halves of a question, split at exactly the trust boundary: anything
// that would give the answer away (correct options, the accepted numeric range,
// the worked solution, the explanation) goes in the key; everything a student
// needs in order to attempt it goes in the question.
function buildQuestionDoc(q, order) {
  return {
    questionType: q.questionType || "mcq",
    marks: Number(q.marks) === 2 ? 2 : 1,
    question: (q.question || "").trim(),
    options: q.questionType === "nat" ? [] : (q.options || []).filter(o => o?.text?.trim()),
    subjectId: q.subjectId || "",
    topicId: q.topicId || "",
    difficulty: q.difficulty || "Moderate",
    natUnit: (q.natUnit || "").trim(),
    imageUrl: (q.imageUrl || "").trim(),
    codeSnippet: q.codeSnippet || "",
    estimatedTimeSec: Number(q.estimatedTimeSec) || null,
    order: order ?? (q.order || 0),
    createdAt: serverTimestamp(),
  };
}

function buildAnswerKeyDoc(q) {
  return {
    correctOptionIds: q.questionType === "nat" ? [] : (q.correctOptionIds || []),
    // A NAT answer is a closed interval, never a float equality test -
    // GATE itself publishes ranges, and comparing typed decimals for exact
    // equality would fail a correct answer entered as 0.30 instead of 0.3.
    natMin: q.questionType === "nat" ? Number(q.natMin) : null,
    natMax: q.questionType === "nat" ? Number(q.natMax ?? q.natMin) : null,
    solution: (q.solution || "").trim(),
    explanation: (q.explanation || "").trim(),
    alternateSolution: (q.alternateSolution || "").trim(),
    timeSavingTrick: (q.timeSavingTrick || "").trim(),
    whyStudentsErr: (q.whyStudentsErr || "").trim(),
    relatedConcepts: q.relatedConcepts || [],
  };
}

export async function setTestQuestionStats(testId, questions) {
  await updateDoc(doc(db, "gate_tests", testId), {
    questionCount: questions.length,
    totalMarks: questions.reduce((n, q) => n + (q.marks || 1), 0),
  });
}

// Pure - no reads. The one gate every publish path calls, so a test can never
// go live in a state that would mis-grade or mislead. Checks the things that
// actually break an attempt, not stylistic preferences.
export function validateTestForPublish(test, questions, answerKeys) {
  const errors = [];
  if (!test.title?.trim()) errors.push("Title is required.");
  if (!test.paperId) errors.push("A test must belong to a paper.");
  if (!(Number(test.durationMinutes) > 0)) errors.push("Duration must be greater than 0 minutes.");
  if (!questions?.length) errors.push("A test needs at least one question before it can be published.");

  (questions || []).forEach((q, i) => {
    const n = i + 1;
    const key = answerKeys?.[q.id];
    if (!q.question?.trim()) errors.push(`Q${n}: statement is empty.`);
    if (![1, 2].includes(q.marks)) errors.push(`Q${n}: marks must be 1 or 2 (GATE has no other values).`);
    if (!key) { errors.push(`Q${n}: no answer key.`); return; }
    if (q.questionType === "nat") {
      if (!Number.isFinite(key.natMin) || !Number.isFinite(key.natMax)) errors.push(`Q${n}: NAT needs a numeric accepted range.`);
      else if (key.natMin > key.natMax) errors.push(`Q${n}: NAT range is inverted (min > max).`);
    } else {
      if ((q.options || []).length < 2) errors.push(`Q${n}: needs at least 2 options.`);
      if (!(key.correctOptionIds || []).length) errors.push(`Q${n}: no correct option marked.`);
      if (q.questionType === "mcq" && (key.correctOptionIds || []).length !== 1) {
        errors.push(`Q${n}: an MCQ must have exactly one correct option - use MSQ for multiple.`);
      }
    }
    if (!key.explanation?.trim() && !key.solution?.trim()) errors.push(`Q${n}: no solution or explanation authored.`);
  });

  return { valid: errors.length === 0, errors };
}

// ---------------- attempts ----------------

// One attempt per (student, test) - the id encodes both, which is what lets
// firestore.rules prove ownership from the path and lets the answer-key rule
// check "has this user submitted this test" with a single exists().
export function attemptId(uid, testId) { return `${uid}_${testId}`; }

export async function fetchAttempt(uid, testId) {
  const snap = await getDoc(doc(db, "gate_attempts", attemptId(uid, testId)));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// Every attempt this student has ever made for a paper, newest first - powers
// the mock-score trend, the rank projection and the analytics screen. This one
// IS a list() query and is legal precisely because it filters on the `uid`
// FIELD, which the matching rule also checks on the field (not on a path
// segment) - see firestore.rules' gate_attempts block, and contrast with the
// gate_progress rule where the uid lives in the doc id and a field filter is
// therefore unprovable.
export async function fetchMyAttempts(uid, paperId, { max = 50 } = {}) {
  const snap = await getDocs(query(
    collection(db, "gate_attempts"),
    where("uid", "==", uid),
    where("paperId", "==", paperId),
    orderBy("submittedAt", "desc"),
    limit(max),
  ));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// Starts the clock server-side (serverTimestamp), not from the client's own
// Date.now() - otherwise a student could gain time by moving their system
// clock backwards. The remaining-time display still runs off the local clock
// (it has to), but the authoritative startedAt that submission is checked
// against is the server's.
export async function startAttempt({ uid, paperId, testId, testType, durationMinutes }) {
  const ref = doc(db, "gate_attempts", attemptId(uid, testId));
  const existing = await getDoc(ref);
  if (existing.exists() && existing.data().submitted) return { id: ref.id, ...existing.data(), alreadySubmitted: true };
  if (existing.exists()) return { id: ref.id, ...existing.data() };
  await setDoc(ref, {
    uid, paperId, testId, testType, durationMinutes,
    answers: {}, answerTimings: {}, markedForReview: [],
    submitted: false, graded: false,
    startedAt: serverTimestamp(), updatedAt: serverTimestamp(),
  });
  return { id: ref.id, uid, paperId, testId, testType, durationMinutes, answers: {}, answerTimings: {}, markedForReview: [] };
}

// Autosave during an attempt. Dotted field paths so two questions answered in
// quick succession can't clobber each other's entry, and so a merge never
// replaces the whole answers map - the same class of bug as the
// solvedProblems/languageUsage fix in this repo's history.
export async function saveAttemptAnswer({ uid, testId, questionId, answer, secondsSpent, markedForReview }) {
  const patch = {
    [`answers.${questionId}`]: answer === undefined ? null : answer,
    updatedAt: serverTimestamp(),
  };
  if (Number.isFinite(secondsSpent)) patch[`answerTimings.${questionId}`] = secondsSpent;
  if (markedForReview !== undefined) patch[`reviewFlags.${questionId}`] = !!markedForReview;
  await setDoc(doc(db, "gate_attempts", attemptId(uid, testId)), patch, { merge: true });
}

// ---------------- grading ----------------

export function isBlankAnswer(given) {
  return given === undefined || given === null || given === ""
    || (Array.isArray(given) && given.length === 0);
}

export function isCorrectAnswer(question, key, given) {
  if (!key) return false;
  if (question.questionType === "nat") {
    const n = typeof given === "number" ? given : parseFloat(String(given).trim());
    if (!Number.isFinite(n)) return false;
    // Inclusive interval, and tolerant of a key authored with min/max swapped.
    const lo = Math.min(key.natMin, key.natMax);
    const hi = Math.max(key.natMin, key.natMax);
    return n >= lo && n <= hi;
  }
  const correct = [...(key.correctOptionIds || [])].sort();
  if (question.questionType === "msq") {
    // All-or-nothing, exactly as GATE grades an MSQ: no partial credit for a
    // correct subset, and no credit at all if any wrong option is selected.
    const picked = [...(Array.isArray(given) ? given : [given])].sort();
    return picked.length === correct.length && picked.every((v, i) => v === correct[i]);
  }
  const picked = Array.isArray(given) ? given[0] : given;
  return picked === correct[0];
}

// Pure grading - no Firestore access, so it is trivially testable and produces
// the same numbers for the review screen, the analysis screen and the stored
// summary. Correctness is keyed on stable question.id / option.id, never array
// position, so shuffling questions for display can never affect a score.
export function gradeGateTest(questions, answerKeys, answers, timings = {}) {
  let score = 0, maxScore = 0, penalty = 0;
  let correctCount = 0, wrongCount = 0, skippedCount = 0;
  const perQuestion = [];
  const bySubject = {};

  for (const q of questions) {
    const marks = q.marks || 1;
    maxScore += marks;
    const key = answerKeys?.[q.id];
    const given = answers?.[q.id];
    const blank = isBlankAnswer(given);
    const correct = !blank && isCorrectAnswer(q, key, given);
    const neg = (!blank && !correct) ? negativeMarkFor(q) : 0;

    if (blank) skippedCount++;
    else if (correct) { correctCount++; score += marks; }
    else { wrongCount++; penalty += neg; score -= neg; }

    const timeSec = timings?.[q.id] ?? null;
    perQuestion.push({
      questionId: q.id, subjectId: q.subjectId || "", topicId: q.topicId || "",
      questionType: q.questionType, marks, difficulty: q.difficulty || "Moderate",
      given: blank ? null : given, status: blank ? "skipped" : correct ? "correct" : "wrong",
      awarded: blank ? 0 : correct ? marks : -neg, timeSec,
    });

    const sid = q.subjectId || "unassigned";
    const s = bySubject[sid] || (bySubject[sid] = {
      subjectId: sid, total: 0, attempted: 0, correct: 0, wrong: 0, skipped: 0,
      maxMarks: 0, marks: 0, timeSec: 0,
    });
    s.total++; s.maxMarks += marks;
    if (blank) s.skipped++;
    else {
      s.attempted++;
      if (correct) { s.correct++; s.marks += marks; }
      else { s.wrong++; s.marks -= neg; }
    }
    if (Number.isFinite(timeSec)) s.timeSec += timeSec;
  }

  const attemptedCount = correctCount + wrongCount;
  // Round to 2dp only at the boundary: GATE scores land on thirds, and letting
  // 1/3 penalties accumulate as raw floats produces figures like 46.99999999996
  // in the UI.
  const round2 = (n) => Math.round(n * 100) / 100;

  return {
    score: round2(score),
    maxScore,
    penalty: round2(penalty),
    rawCorrectMarks: round2(score + penalty),
    correctCount, wrongCount, skippedCount, attemptedCount,
    accuracy: attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : 0,
    attemptRate: questions.length > 0 ? Math.round((attemptedCount / questions.length) * 100) : 0,
    perQuestion,
    subjectBreakdown: Object.values(bySubject).map(s => ({
      ...s,
      marks: round2(s.marks),
      accuracy: s.attempted > 0 ? Math.round((s.correct / s.attempted) * 100) : 0,
      pct: s.maxMarks > 0 ? Math.round((Math.max(0, s.marks) / s.maxMarks) * 100) : 0,
    })).sort((a, b) => b.maxMarks - a.maxMarks),
    totalTimeSec: perQuestion.reduce((n, p) => n + (p.timeSec || 0), 0),
  };
}

// Time analysis: which questions ate the clock, and whether that time bought
// anything. `avgTimeCorrect` vs `avgTimeWrong` is the number that actually
// changes behaviour - when wrong answers take longer than right ones, the
// problem is question selection, not speed.
export function analyseTiming(grading, { slowMultiplier = 2 } = {}) {
  const timed = grading.perQuestion.filter(p => Number.isFinite(p.timeSec) && p.timeSec > 0);
  if (timed.length === 0) return null;
  const avg = timed.reduce((n, p) => n + p.timeSec, 0) / timed.length;
  const mean = (list) => (list.length ? Math.round(list.reduce((n, p) => n + p.timeSec, 0) / list.length) : null);
  return {
    avgTimeSec: Math.round(avg),
    avgTimeCorrect: mean(timed.filter(p => p.status === "correct")),
    avgTimeWrong: mean(timed.filter(p => p.status === "wrong")),
    slowQuestions: timed.filter(p => p.timeSec > avg * slowMultiplier).sort((a, b) => b.timeSec - a.timeSec),
    // Time spent on questions that scored nothing or lost marks - the single
    // biggest recoverable resource in a 180-minute paper.
    wastedSec: timed.filter(p => p.status !== "correct").reduce((n, p) => n + p.timeSec, 0),
  };
}

// Confidence analysis, derived rather than self-reported: a student never has
// to rate their own certainty (nobody does it honestly under a clock). Instead
// each answered question is bucketed by whether it was flagged for review or
// took unusually long, crossed with whether it was actually right.
//
// The bucket that matters is `confidentWrong` - answered fast, never flagged,
// and wrong. Those are misconceptions, not gaps: the student does not know they
// don't know, so no amount of extra practice on flagged questions will find
// them. Surfacing that distinction is the entire point of this function.
export function analyseConfidence(grading, reviewFlags = {}) {
  const timed = grading.perQuestion.filter(p => p.status !== "skipped");
  if (timed.length === 0) return null;
  const withTime = timed.filter(p => Number.isFinite(p.timeSec) && p.timeSec > 0);
  const avg = withTime.length ? withTime.reduce((n, p) => n + p.timeSec, 0) / withTime.length : null;

  const unsure = (p) => !!reviewFlags[p.questionId] || (avg != null && p.timeSec > avg * 1.5);
  const buckets = { confidentCorrect: [], confidentWrong: [], unsureCorrect: [], unsureWrong: [] };
  for (const p of timed) {
    const u = unsure(p);
    const right = p.status === "correct";
    if (!u && right) buckets.confidentCorrect.push(p);
    else if (!u && !right) buckets.confidentWrong.push(p);
    else if (u && right) buckets.unsureCorrect.push(p);
    else buckets.unsureWrong.push(p);
  }
  return {
    ...buckets,
    // Answered confidently and got it wrong, as a share of everything answered
    // confidently. High values mean the gap is understanding, not effort.
    misconceptionRate: (buckets.confidentCorrect.length + buckets.confidentWrong.length) > 0
      ? Math.round((buckets.confidentWrong.length / (buckets.confidentCorrect.length + buckets.confidentWrong.length)) * 100)
      : null,
    // Flagged or slow, and still right - a real skill, and a signal the student
    // should trust their working more and flag less.
    recoveryRate: (buckets.unsureCorrect.length + buckets.unsureWrong.length) > 0
      ? Math.round((buckets.unsureCorrect.length / (buckets.unsureCorrect.length + buckets.unsureWrong.length)) * 100)
      : null,
  };
}

// ---------------- rank and percentile estimation ----------------

// HONEST LABELLING MATTERS HERE. This is an estimate from the historical
// relationship between GATE CS marks and All India Rank, not a prediction with
// any official standing, and every surface that renders it says so. It exists
// because "I scored 52, is that a good score?" is otherwise unanswerable for a
// first-time candidate, and a rough anchor beats no anchor.
//
// The default curve below is a piecewise set of (marks, AIR) anchors shaped
// like published GATE CS score-to-rank data. Interpolation is LINEAR IN
// log(rank), not in rank - the relationship spans four orders of magnitude, so
// linear interpolation between anchors would badly misestimate the middle of
// every segment. Admins can override the anchors per paper
// (gatePapers/{id}.rankAnchors) because DA's candidate pool is an order of
// magnitude smaller than CS's and the same curve would be nonsense for it.
export const DEFAULT_RANK_ANCHORS = [
  { marks: 95, air: 1 },
  { marks: 90, air: 5 },
  { marks: 85, air: 12 },
  { marks: 80, air: 30 },
  { marks: 75, air: 70 },
  { marks: 70, air: 150 },
  { marks: 65, air: 300 },
  { marks: 60, air: 550 },
  { marks: 55, air: 950 },
  { marks: 50, air: 1600 },
  { marks: 45, air: 2600 },
  { marks: 40, air: 4200 },
  { marks: 35, air: 6800 },
  { marks: 30, air: 11000 },
  { marks: 25, air: 18000 },
  { marks: 20, air: 30000 },
  { marks: 15, air: 50000 },
  { marks: 10, air: 80000 },
];

export const DEFAULT_CANDIDATE_COUNT = 130000;

export function getRankModel(paper) {
  const anchors = (paper?.rankAnchors?.length ? paper.rankAnchors : DEFAULT_RANK_ANCHORS)
    .map(a => ({ marks: Number(a.marks), air: Number(a.air) }))
    .filter(a => Number.isFinite(a.marks) && a.air > 0)
    .sort((a, b) => b.marks - a.marks);
  return {
    anchors,
    candidateCount: Number(paper?.candidateCount) > 0 ? Number(paper.candidateCount) : DEFAULT_CANDIDATE_COUNT,
    // Whether this paper's curve has actually been reviewed by an admin, or is
    // still the generic CS-shaped default. The UI marks unreviewed estimates
    // more cautiously.
    isDefaultCurve: !paper?.rankAnchors?.length,
  };
}

// Returns null - never a number - when there is nothing meaningful to say
// (no anchors, or a score of zero). A fabricated rank is worse than an absent
// one, and every caller renders the null case explicitly.
export function estimateRank(marks, paper) {
  const { anchors, candidateCount, isDefaultCurve } = getRankModel(paper);
  if (!anchors.length || !Number.isFinite(marks) || marks <= 0) return null;

  const top = anchors[0], bottom = anchors[anchors.length - 1];
  let air;
  if (marks >= top.marks) air = top.air;
  else if (marks <= bottom.marks) {
    // Below the lowest anchor, extrapolating the curve would produce ranks
    // beyond the candidate pool. Clamp to the pool size instead and let the UI
    // say "outside the estimable range".
    air = Math.min(candidateCount, Math.round(bottom.air * (bottom.marks / Math.max(marks, 1))));
  } else {
    const hi = anchors.find((a, i) => marks <= a.marks && marks >= anchors[i + 1]?.marks);
    const lo = anchors[anchors.indexOf(hi) + 1];
    const t = (hi.marks - marks) / (hi.marks - lo.marks);
    // Geometric (log-space) interpolation - see the comment on the anchors.
    air = Math.round(Math.exp(Math.log(hi.air) + t * (Math.log(lo.air) - Math.log(hi.air))));
  }
  air = Math.max(1, Math.min(candidateCount, air));
  return {
    air,
    percentile: Math.round((1 - air / candidateCount) * 1000) / 10,
    candidateCount,
    isDefaultCurve,
    belowRange: marks < bottom.marks,
  };
}

// A projection from a student's mock history rather than a single test, because
// one mock is noise. Uses the mean of the best three recent attempts: a plain
// average punishes the early practice mocks everyone bombs, and a plain
// best-ever over-promises. Needs at least two graded attempts to say anything.
export function projectFromAttempts(attempts, paper) {
  const scored = (attempts || [])
    .filter(a => a.graded && Number.isFinite(a.score) && a.maxScore > 0)
    // Normalise to a 100-mark scale so a 30-mark subject test and a 100-mark
    // full mock are comparable at all. Full-length attempts are weighted
    // exclusively when any exist, since a subject test predicts nothing about
    // a whole paper.
    .map(a => ({ ...a, normalized: (a.score / a.maxScore) * 100 }));
  if (scored.length === 0) return null;

  const full = scored.filter(a => a.testType === "full" || a.testType === "pyq");
  const pool = full.length ? full : scored;
  const best3 = [...pool].sort((a, b) => b.normalized - a.normalized).slice(0, 3);
  const projectedMarks = Math.round((best3.reduce((n, a) => n + a.normalized, 0) / best3.length) * 10) / 10;

  return {
    projectedMarks,
    basis: full.length ? "full-length mocks" : "subject and topic tests",
    sampleSize: pool.length,
    confident: full.length >= 2,
    rank: estimateRank(projectedMarks, paper),
    trend: computeTrend(pool),
  };
}

// Direction of travel over the last few attempts - the difference between the
// mean of the most recent third and the oldest third of the sample, in marks.
// Deliberately not a regression slope: with five data points a slope reads as
// precision that isn't there.
function computeTrend(pool) {
  const chron = [...pool].sort((a, b) => (a.submittedAt?.seconds || 0) - (b.submittedAt?.seconds || 0));
  if (chron.length < 4) return null;
  const n = Math.max(1, Math.floor(chron.length / 3));
  const mean = (arr) => arr.reduce((s, a) => s + a.normalized, 0) / arr.length;
  const delta = mean(chron.slice(-n)) - mean(chron.slice(0, n));
  return { deltaMarks: Math.round(delta * 10) / 10, improving: delta > 1, declining: delta < -1 };
}

// ---------------- submit + grade ----------------

// The mandated ordering, in one place so no screen can get it wrong:
//   1. mark the attempt submitted (this is what unlocks answer-key reads)
//   2. read the keys
//   3. grade purely, in memory
//   4. persist the grading, once, transactionally
//
// Step 4 is transaction-wrapped and re-reads `graded` live immediately before
// writing, so a double-click or a second tab can't both grade the same attempt -
// the loser re-reads an already-graded doc and writes nothing. Same guard as
// lib/contests.js's persistGrading, and it matters more here because the score
// feeds a rank estimate a student will screenshot.
//
// GATE tests grant NO XP/coins/score. That is a deliberate platform decision,
// not an oversight: a scored assessment whose marks also convert into wallet
// currency creates an incentive to farm easy tests, and Contests already
// established this precedent in this codebase (see persistGrading's comment
// there). Preparation REWARDS come from learning and revising - topic
// completion and Daily GATE, in lib/gate.js.
export async function submitAttempt({ uid, testId, answers, answerTimings, reviewFlags, timeTakenSeconds }) {
  await setDoc(doc(db, "gate_attempts", attemptId(uid, testId)), {
    answers: answers || {},
    answerTimings: answerTimings || {},
    reviewFlags: reviewFlags || {},
    timeTakenSeconds: Math.max(0, Math.round(timeTakenSeconds || 0)),
    submitted: true,
    submittedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function persistGrading(uid, testId, grading, paper, profile = {}) {
  const ref = doc(db, "gate_attempts", attemptId(uid, testId));
  // A SEPARATE, answer-free summary document, written in the same transaction as
  // the grading. This exists purely so leaderboards are possible without making
  // attempt documents readable to other students - the attempt carries the
  // student's actual answers, and a per-test ranking that required reading it
  // would hand every question's answer to anyone who opened the leaderboard.
  // Nothing here can be used to reconstruct an answer: score totals only.
  const resultRef = doc(db, "gate_tests", testId, "results", uid);
  let alreadyGraded;

  const estimate = estimateRank((grading.score / Math.max(1, grading.maxScore)) * 100, paper);

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    alreadyGraded = !!snap.data()?.graded;
    if (alreadyGraded) return;
    const timeTakenSeconds = snap.data()?.timeTakenSeconds ?? 0;

    tx.update(ref, {
      graded: true,
      score: grading.score,
      maxScore: grading.maxScore,
      penalty: grading.penalty,
      correctCount: grading.correctCount,
      wrongCount: grading.wrongCount,
      skippedCount: grading.skippedCount,
      attemptedCount: grading.attemptedCount,
      accuracy: grading.accuracy,
      subjectBreakdown: grading.subjectBreakdown,
      // Stored so the results screen and the analytics trend agree without
      // re-deriving from a curve that may have been re-tuned since.
      estimatedAir: estimate?.air ?? null,
      estimatedPercentile: estimate?.percentile ?? null,
      gradedAt: serverTimestamp(),
    });

    // Denormalized display fields (handle/roll number/classroom scope) come from
    // the caller's already-loaded profile rather than a read inside the
    // transaction - the same approach lib/institutions.js takes when it stamps
    // rollNumber/campusFullName onto users at approval. They are display-only;
    // firestore.rules bounds what a student may write here regardless.
    tx.set(resultRef, {
      uid, testId,
      paperId: grading.paperId || profile.paperId || "",
      score: grading.score,
      maxScore: grading.maxScore,
      accuracy: grading.accuracy,
      attemptedCount: grading.attemptedCount,
      timeTakenSeconds,
      subjectBreakdown: grading.subjectBreakdown,
      handle: profile.handle || "",
      campusFullName: profile.campusFullName || "",
      rollNumber: profile.rollNumber || "",
      institutionId: profile.institutionId || "",
      department: profile.department || "",
      year: profile.year || "",
      section: profile.section || "",
      submittedAt: serverTimestamp(),
    });
  });

  return { firstGrading: !alreadyGraded, estimate };
}

// The whole submit->grade->persist sequence, which is what every attempt screen
// actually wants. Returns the grading plus everything the analysis screen
// needs, so the caller never has to re-fetch.
export async function submitAndGrade({
  uid, paperId, testId, questions, answers, answerTimings, reviewFlags,
  timeTakenSeconds, paper, profile,
}) {
  await submitAttempt({ uid, testId, answers, answerTimings, reviewFlags, timeTakenSeconds });
  const answerKeys = await fetchTestAnswerKeys(testId);
  const grading = gradeGateTest(questions, answerKeys, answers, answerTimings);
  const { estimate } = await persistGrading(uid, testId, { ...grading, paperId }, paper, { ...profile, paperId });
  return {
    grading, answerKeys, estimate,
    timing: analyseTiming(grading),
    confidence: analyseConfidence(grading, reviewFlags),
  };
}

// ---------------- leaderboard ----------------

// Per-test ranking, read from the answer-free results subcollection (see
// persistGrading) rather than from attempt documents. Ordered by score desc then
// time asc - not a tie-break GATE itself uses, but the only one the data affords,
// and the one every timed-practice platform applies. Requires the composite index
// declared in firestore.indexes.json.
export async function fetchTestResults(testId, topN = 100) {
  const snap = await getDocs(query(
    collection(db, "gate_tests", testId, "results"),
    orderBy("score", "desc"),
    orderBy("timeTakenSeconds", "asc"),
    limit(topN),
  ));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// Ranks the rows AFTER any client-side scope filter (campus, department, year,
// section, date window) has been applied - a department leaderboard must number
// its own rows 1..n, not preserve gaps from the global ordering, or the top of a
// department board reads as rank 47.
export function rankRows(rows) {
  return [...rows]
    .sort((a, b) => (b.score - a.score) || ((a.timeTakenSeconds || 0) - (b.timeTakenSeconds || 0)))
    .map((r, i) => ({ ...r, rank: i + 1 }));
}

// Aggregate several tests into one board. Bounded by construction: the caller
// decides how many tests and how deep, and `basis` records exactly what was
// included so the UI can state it rather than implying a complete ranking.
//
// Scores are normalised to 100 before summing, so a 30-mark subject test cannot
// contribute more than a 100-mark mock just by being longer, and a student who
// took a different subset of tests is compared on their average rather than their
// total (otherwise the leaderboard just ranks whoever took the most tests).
export function aggregateResults(resultsByTest) {
  const byUid = new Map();
  for (const { testId, results } of resultsByTest) {
    for (const r of results) {
      if (!r.maxScore) continue;
      const entry = byUid.get(r.uid) || {
        uid: r.uid, handle: r.handle, campusFullName: r.campusFullName, rollNumber: r.rollNumber,
        institutionId: r.institutionId, department: r.department, year: r.year, section: r.section,
        testsTaken: 0, normalizedTotal: 0, timeTakenSeconds: 0, testIds: [],
      };
      entry.testsTaken++;
      entry.normalizedTotal += (r.score / r.maxScore) * 100;
      entry.timeTakenSeconds += r.timeTakenSeconds || 0;
      entry.testIds.push(testId);
      byUid.set(r.uid, entry);
    }
  }
  return [...byUid.values()].map(e => ({
    ...e,
    score: Math.round((e.normalizedTotal / e.testsTaken) * 10) / 10,
    maxScore: 100,
  }));
}
