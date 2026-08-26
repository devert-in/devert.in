import { db } from "@/lib/firebase";
import { currentAudiences } from "@/lib/audiences";
import { collection, doc, getDocs, getDoc, query, orderBy, where, updateDoc, setDoc, increment } from "firebase/firestore";
import { parseCSV } from "@/lib/contests";

// Company Prep - Company -> Round -> Category -> Question, global
// DeVert-authored content (see firestore.rules' companies/{id} tree). Same
// shape as aptitude_topics (lib/aptitude.js) one level deeper on each side -
// a company groups its own hiring rounds, each round groups its own
// categories, since no two companies structure their process the same way
// (Cognizant's Communication/Aptitude/Technical/HR rounds look nothing like
// Google's Coding/DSA/OA). Every fetcher here is student-facing and reads
// one level at a time (company list -> its rounds -> a round's categories ->
// a category's questions), mirroring how CampusPracticeList/CampusProblemView
// already fetch progressively instead of eagerly hydrating a whole tree
// nobody asked for yet. Admin authoring (create/update/delete, CSV import)
// writes Firestore directly from the admin panel, same convention as
// AptitudePanel/ContestsPanel in app/admin/page.jsx - this file only covers
// reads + the pure/CSV helpers both admin and student surfaces share.

export const COMPANY_QUESTION_DIFFICULTIES = ["Easy", "Medium", "Hard"];

// where + orderBy on a different field would need a composite index; the
// companies list is a small, curated set (not thousands of docs), so - same
// call fetchPublishedContests() already makes for the identical shape -
// filter server-side and sort client-side instead of provisioning one.
export async function fetchPublishedCompanies() {
  const snap = await getDocs(query(collection(db, "companies"), where("status", "==", "published"), where("audiences", "array-contains-any", currentAudiences())));
  return snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (a.order || 0) - (b.order || 0));
}

export async function fetchCompany(companyId) {
  const snap = await getDoc(doc(db, "companies", companyId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function fetchCompanyRounds(companyId) {
  const snap = await getDocs(query(collection(db, "companies", companyId, "rounds"), orderBy("order", "asc")));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function fetchRoundCategories(companyId, roundId) {
  const snap = await getDocs(
    query(collection(db, "companies", companyId, "rounds", roundId, "categories"), orderBy("order", "asc"))
  );
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function fetchCategoryQuestions(companyId, roundId, categoryId) {
  const snap = await getDocs(
    query(collection(db, "companies", companyId, "rounds", roundId, "categories", categoryId, "questions"), orderBy("order", "asc"))
  );
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ── interview experiences (admin-curated, v1) ───────────────────────────────
// Read-only from the student side by design - genuine student-submitted
// experiences are a real follow-up feature, not built here (see the
// reward-integrity-epic-style plan this was scoped from). Same read gate as
// categories (isCompanyPublished), write is isAdmin()-only.

export async function fetchCompanyInterviewExperiences(companyId) {
  const snap = await getDocs(query(collection(db, "companies", companyId, "interviewExperiences"), orderBy("order", "asc")));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ── mock interviews (admin-configured, timed, assembled from existing categories) ──
// A mock interview doesn't duplicate questions - it references existing
// (roundId, categoryId) pairs and pulls their real questions live, so
// editing/adding a question in the source category automatically flows into
// any mock interview that references it, no re-authoring needed.

export async function fetchCompanyMockInterviews(companyId) {
  const snap = await getDocs(query(collection(db, "companies", companyId, "mockInterviews"), orderBy("order", "asc")));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function fetchMockInterviewQuestions(companyId, mockInterview) {
  const perCategory = await Promise.all(
    (mockInterview.categoryRefs || []).map(({ roundId, categoryId }) => fetchCategoryQuestions(companyId, roundId, categoryId))
  );
  return perCategory.flat();
}

export async function recordMockInterviewAttempt(uid, companyId, mockInterviewId, { score, total }) {
  await setDoc(doc(db, "user_companyPrep", uid), {
    mockInterviewAttempts: { [mockInterviewId]: { companyId, score, total, completedAt: new Date() } },
  }, { merge: true });
}

// ── self-assessment checklist (Resume / Communication / Confidence, etc.) ──
// Deliberately separate from the computed, real-signal readiness score below
// - these are subjective, self-reported checkboxes with no underlying
// platform data to verify them against, so they're never blended into the
// one honest, derived technical-readiness percentage.

export async function setCompanySelfAssessment(uid, companyId, item, checked) {
  await setDoc(doc(db, "user_companyPrep", uid), {
    selfAssessment: { [companyId]: { [item]: checked } },
  }, { merge: true });
}

// Every question across every round/category of a company - used only for
// the readiness score below (a single upfront cost when the overview loads,
// acceptable at this vault's real size: tens to low hundreds of questions
// per company, not thousands).
export async function fetchAllCompanyQuestions(companyId, rounds) {
  const perRound = await Promise.all(rounds.map(async (r) => {
    const categories = await fetchRoundCategories(companyId, r.id);
    const perCategory = await Promise.all(categories.map(c => fetchCategoryQuestions(companyId, r.id, c.id)));
    return perCategory.flat();
  }));
  return perRound.flat();
}

// ── readiness score (computed client-side, real signals only) ──────────────
// Per-category accuracy/attempted-coverage across every question the student
// has actually attempted in this company's vault, averaged across categories
// that have at least one attempt - NOT a fabricated aggregate blending in
// untracked things like "resume quality" (see setCompanySelfAssessment above
// for that, kept visually separate on the overview screen).
export function companyReadinessScore(allQuestions, solvedMap) {
  if (!allQuestions.length) return null;
  const solvedCount = allQuestions.filter(q => solvedMap?.[q.id]).length;
  return Math.round((solvedCount / allQuestions.length) * 100);
}

// ── per-user progress (solved / bookmarked) ────────────────────────────────
// Flat maps keyed by questionId - same shape as user_codelab_progress's
// solvedProblems. Firestore auto-IDs are globally unique across the whole
// companies collection, so a bare questionId key (no company/round/category
// prefix needed) can't collide between two different companies' questions.

export async function fetchUserCompanyPrepProgress(uid) {
  const snap = await getDoc(doc(db, "user_companyPrep", uid));
  return snap.exists() ? { solved: {}, bookmarked: {}, ...snap.data() } : { solved: {}, bookmarked: {} };
}

export async function markCompanyQuestionSolved(uid, questionId) {
  await setDoc(doc(db, "user_companyPrep", uid), { solved: { [questionId]: true } }, { merge: true });
}

export async function setCompanyQuestionBookmarked(uid, questionId, bookmarked) {
  await setDoc(doc(db, "user_companyPrep", uid), { bookmarked: { [questionId]: bookmarked } }, { merge: true });
}

// One attempt's worth per call, same bounded-delta shape firestore.rules
// enforces (attemptCount +1, correctCount +0/+1, totalTimeSec clamped to a
// sane single-question range) - not tamper-proof, only bounded, same
// accepted trade-off as aptitude-section.jsx's identical write.
export async function recordCompanyQuestionAttempt(companyId, roundId, categoryId, questionId, { correct, timeSec = 0 }) {
  await updateDoc(doc(db, "companies", companyId, "rounds", roundId, "categories", categoryId, "questions", questionId), {
    attemptCount: increment(1),
    correctCount: increment(correct ? 1 : 0),
    totalTimeSec: increment(Math.min(Math.max(Math.round(timeSec), 0), 3600)),
  });
}

// Derived entirely from the bounded client-writable counters on the question
// doc (attemptCount/correctCount/totalTimeSec - see firestore.rules), same
// shape and same accepted trust-boundary limitation as aptitude.js's
// questionGlobalStats (no Cloud Function verifies an attempt actually
// happened, only bounds the per-write delta).
export function companyQuestionStats(question) {
  const attemptCount = question?.attemptCount || 0;
  const correctCount = question?.correctCount || 0;
  const totalTimeSec = question?.totalTimeSec || 0;
  return {
    attemptCount,
    accuracy: attemptCount > 0 ? Math.round((correctCount / attemptCount) * 100) : null,
    avgTimeSec: attemptCount > 0 ? Math.round(totalTimeSec / attemptCount) : null,
  };
}

// ── CSV bulk import (per category) ──────────────────────────────────────────
// Deliberately simpler than lib/contests.js's importer - every company-prep
// question is a single-answer MCQ (no multiselect/truefalse/fillblank), so
// there's no `type` column to route on. Reuses contests.js's parseCSV
// verbatim (a generic delimiter/quote-aware parser, not contest-specific).

export const COMPANY_QUESTION_CSV_HEADER = "question,optiona,optionb,optionc,optiond,correctanswer,difficulty,marks,explanation,tags";
const COMPANY_QUESTION_CSV_EXAMPLE_ROWS = [
  ['To take with a grain of salt.', 'To take it lightly', 'To take with some reservation', 'Not to believe anyone', 'To take it on heart', 'B', 'Easy', '1', 'The idiom means to view something with skepticism.', 'Idioms'],
  ['A senior Christian priest', 'Pastor', 'Preacher', 'Evangelist', 'Archdeacon', 'D', 'Medium', '1', '', 'Vocabulary'],
];
export const COMPANY_QUESTION_CSV_TEMPLATE = [COMPANY_QUESTION_CSV_HEADER, ...COMPANY_QUESTION_CSV_EXAMPLE_ROWS.map(r =>
  r.map(f => (f.includes(",") || f.includes('"') ? `"${f.replace(/"/g, '""')}"` : f)).join(",")
)].join("\n");
export const COMPANY_QUESTION_CSV_HELP = `Columns (first row = header, exact names): question,optionA,optionB,optionC,optionD,correctAnswer,difficulty,marks,explanation,tags
correctAnswer: a single letter A-D. difficulty: Easy | Medium | Hard. tags: semicolon-separated (e.g. "Idioms;Vocabulary"). marks and explanation are optional.`;

export function downloadCompanyQuestionCsvTemplate() {
  const blob = new Blob([COMPANY_QUESTION_CSV_TEMPLATE], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "company-prep-questions-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export function csvRowsToCompanyQuestions(rows) {
  if (rows.length < 2) return { questions: [], errors: ["No data rows found (need a header row + at least one question row)."] };
  const header = rows[0].map(h => h.trim().toLowerCase());
  const col = name => header.indexOf(name);
  const missing = ["question", "correctanswer"].filter(n => col(n) === -1);
  if (missing.length) return { questions: [], errors: [`Missing required column(s): ${missing.join(", ")}`] };

  const letters = ["a", "b", "c", "d"];
  const questions = [];
  const errors = [];

  rows.slice(1).forEach((r, i) => {
    const lineNo = i + 2;
    const get = name => (col(name) !== -1 ? (r[col(name)] || "").trim() : "");
    const question = get("question");
    if (!question) { errors.push(`Line ${lineNo}: missing question text.`); return; }

    // Keep the raw per-letter values around so a blank middle option (e.g.
    // C empty, D filled) doesn't desync correctIndex from the filtered
    // array - correctIndex must be the option's position AFTER filtering,
    // not its original letter position.
    const optionValues = letters.map(l => get(`option${l}`));
    const options = optionValues.filter(Boolean);
    if (options.length < 2) { errors.push(`Line ${lineNo}: needs at least 2 options.`); return; }

    const correctLetter = get("correctanswer").toUpperCase();
    const letterIndex = letters.indexOf(correctLetter.toLowerCase());
    if (letterIndex === -1 || !optionValues[letterIndex]) {
      errors.push(`Line ${lineNo}: correctAnswer "${correctLetter}" doesn't match a filled-in option.`);
      return;
    }
    const correctIndex = optionValues.slice(0, letterIndex).filter(Boolean).length;

    const difficultyRaw = get("difficulty");
    const difficulty = COMPANY_QUESTION_DIFFICULTIES.find(d => d.toLowerCase() === difficultyRaw.toLowerCase()) || "Medium";
    const marksRaw = get("marks");

    questions.push({
      question,
      options,
      correctIndex,
      difficulty,
      marks: marksRaw ? parseFloat(marksRaw) : 1,
      explanation: get("explanation"),
      tags: get("tags").split(";").map(t => t.trim()).filter(Boolean),
      attemptCount: 0, correctCount: 0, totalTimeSec: 0,
    });
  });

  return { questions, errors };
}
