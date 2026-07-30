import { db } from "@/lib/firebase";
import {
  collection, doc, addDoc, deleteDoc, getDocs, getDoc, setDoc, updateDoc, query, orderBy, where,
  limit, increment, serverTimestamp, getCountFromServer, writeBatch, documentId, runTransaction,
} from "firebase/firestore";

export const CONTEST_CATEGORIES = [
  "Aptitude & Reasoning", "Programming Fundamentals", "Java", "Python", "C++", "SQL",
  "DBMS", "Operating Systems", "Computer Networks", "OOP", "AI & ML",
  "Web Development", "Placement Preparation", "General Knowledge",
];

export const CONTEST_DIFFICULTIES = ["Easy", "Medium", "Hard"];
export const QUESTION_TYPES = ["mcq", "multiselect", "truefalse", "fillblank"];

export const CONTEST_STATUSES = [
  { v: "draft",     c: "rgba(255,255,255,0.4)" },
  { v: "published", c: "#00FF41" },
  { v: "archived",  c: "rgba(255,255,255,0.25)" },
];

// Shared by both the global admin ContestsPanel and Campus's institution-scoped
// contest manager (components/campus/institution-contests-panel.jsx) - same
// create/question-authoring shape either way, just optionally carrying an
// institutionId.
export function blankContestForm() {
  return {
    title: "", category: CONTEST_CATEGORIES[0], difficulty: "Easy", bannerUrl: "",
    description: "", rules: "", eligibility: "", organizer: "", tags: "",
    registrationStart: "", registrationEnd: "", contestStart: "", contestEnd: "",
    // prizeXp/prizeCoins default to 0, not a nonzero placeholder - contests no
    // longer grant platform XP/Coins at all (see persistGrading), so these
    // fields are no longer collected in the authoring form; a stale nonzero
    // default here would otherwise silently persist on every new contest with
    // no UI to notice or change it.
    durationMinutes: "60", prizeXp: "0", prizeCoins: "0", prizeText: "", status: "draft",
  };
}

export function blankContestQuestionForm(type = "mcq") {
  return {
    type, question: "", options: ["", "", "", ""], correctIndices: [0], correctText: "",
    marks: "1", negativeMarks: "0", explanation: "", topic: "", difficulty: "medium",
  };
}

export const CONTEST_CSV_HEADER = "question,optiona,optionb,optionc,optiond,correctanswer,type,difficulty,marks,negativemarks,explanation,topic";
const CONTEST_CSV_EXAMPLE_ROWS = [
  ['What is the time complexity of binary search?', 'O(n)', 'O(log n)', 'O(n^2)', 'O(1)', 'B', 'mcq', 'medium', '2', '0', 'Binary search halves the search space every step.', 'Algorithms'],
  ['Java is platform independent.', 'True', 'False', '', '', 'True', 'truefalse', 'easy', '1', '0', 'Java compiles to bytecode run by the JVM on any platform.', 'Java Basics'],
  ['Which of these are valid SQL joins? (select all that apply)', 'INNER', 'OUTER', 'CARTESIAN', 'RECURSIVE', 'A,B,C', 'multiselect', 'hard', '3', '1', 'INNER, OUTER (LEFT/RIGHT/FULL) and CARTESIAN (CROSS) are all valid SQL join types.', 'SQL'],
  ['The ___ keyword is used to inherit a class in Java.', '', '', '', '', 'extends', 'fillblank', 'easy', '1', '0', 'A subclass uses `extends` to inherit from a superclass.', 'Java Basics'],
];
export const CONTEST_CSV_TEMPLATE = [CONTEST_CSV_HEADER, ...CONTEST_CSV_EXAMPLE_ROWS.map(r =>
  r.map(f => (f.includes(",") || f.includes('"') ? `"${f.replace(/"/g, '""')}"` : f)).join(",")
)].join("\n");
export const CONTEST_CSV_HELP = `Columns (first row = header, exact names): question,optionA,optionB,optionC,optionD,correctAnswer,type,difficulty,marks,negativeMarks,explanation,topic
type: mcq | multiselect | truefalse | fillblank
correctAnswer: letter(s) A-D for mcq/multiselect (e.g. "B" or "A,C"), True/False for truefalse, the accepted text for fillblank (use | for alternatives, e.g. "extends|inherits")`;

export function downloadContestCsvTemplate() {
  const blob = new Blob([CONTEST_CSV_TEMPLATE], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "contest-questions-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

// Generic delimited-text parser (comma or tab, quote-aware) - not contest-specific,
// but only contest question import uses it today.
export function parseCSV(text) {
  const firstLine = text.split(/\r?\n/, 1)[0] || "";
  const delimiter = (firstLine.split("\t").length > firstLine.split(",").length) ? "\t" : ",";
  const rows = [];
  let row = [], field = "", inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i], next = text[i + 1];
    if (inQuotes) {
      if (c === '"' && next === '"') { field += '"'; i++; }
      else if (c === '"') { inQuotes = false; }
      else field += c;
    } else if (c === '"') { inQuotes = true; }
    else if (c === delimiter) { row.push(field); field = ""; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && next === '\n') i++;
      row.push(field); field = "";
      if (row.length > 1 || row[0] !== "") rows.push(row);
      row = [];
    } else field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}

// Parses bulk-imported contest questions into a {questions, answerKey} pair per row -
// questions hold no correct-answer data (mirrors the Firestore split), answerKey data
// is written to a sibling subcollection so it can be read-gated separately.
export function csvRowsToContestQuestions(rows) {
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
    const type = (get("type").toLowerCase() || "mcq");
    const correctRaw = get("correctanswer");
    const marks = parseFloat(get("marks")) || 1;
    const negativeMarks = parseFloat(get("negativemarks")) || 0;
    const explanation = get("explanation");
    const topic = get("topic");
    const difficulty = get("difficulty") || "medium";

    if (!question || !correctRaw) { errors.push(`Row ${lineNo}: skipped - missing question or correctAnswer.`); return; }
    if (!QUESTION_TYPES.includes(type)) { errors.push(`Row ${lineNo}: skipped - unknown type "${type}".`); return; }

    if (type === "fillblank") {
      questions.push({ question, type, options: [], marks, negativeMarks, explanation, topic, difficulty, correctOptionIds: [], correctText: correctRaw });
      return;
    }
    if (type === "truefalse") {
      const norm = correctRaw.toLowerCase();
      const correctId = (norm === "true" || norm === "t") ? "true" : "false";
      questions.push({
        question, type, options: [{ id: "true", text: "True" }, { id: "false", text: "False" }],
        marks, negativeMarks, explanation, topic, difficulty, correctOptionIds: [correctId], correctText: "",
      });
      return;
    }
    // mcq / multiselect
    const optionTexts = letters.map(l => get(`option${l}`));
    const options = letters.map((id, idx) => ({ id, text: optionTexts[idx] })).filter(o => o.text);
    if (options.length < 2) { errors.push(`Row ${lineNo}: skipped - needs at least 2 non-empty options.`); return; }
    const correctOptionIds = correctRaw.split(",").map(s => s.trim().toLowerCase()).filter(l => options.some(o => o.id === l));
    if (correctOptionIds.length === 0) { errors.push(`Row ${lineNo}: skipped - correctAnswer must reference option letters A-D.`); return; }
    if (type === "mcq" && correctOptionIds.length !== 1) { errors.push(`Row ${lineNo}: skipped - mcq needs exactly one correct option.`); return; }
    questions.push({ question, type, options, marks, negativeMarks, explanation, topic, difficulty, correctOptionIds, correctText: "" });
  });

  return { questions, errors };
}

// Institution-scoped contests are plain contests/{id} docs with an institutionId
// field (see firestore.rules) - fetchPublishedContests() above stays the global,
// unscoped feed; this is the Campus-side equivalent for "my college's contests"
// (used by both the student Contests tab and the admin manager, which also wants
// to see its own drafts - hence no status filter here, unlike the public feed).
// Admin-facing (Manage -> Contests) - every status, including drafts.
// isContestInstitutionAdmin(contestId) in firestore.rules resolves via a
// fresh get() on the contest's own id, not resource.data, so it doesn't need
// a matching query filter the way a resource.data condition would.
export async function fetchInstitutionContests(institutionId) {
  const snap = await getDocs(query(collection(db, "contests"), where("institutionId", "==", institutionId), orderBy("createdAt", "desc")));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// Student-facing - the where("status","==","published") filter is REQUIRED,
// not optional: firestore.rules' contests/{contestId} read rule's
// non-admin branch checks resource.data.status == 'published', a real data
// field the query itself must also filter on or Firestore rejects the whole
// list() as unprovable for any non-admin - same "status filter mandatory"
// trap as lib/programming.js's fetchLanguages. No orderBy alongside it (that
// combo needs a composite index); sorted client-side instead.
export async function fetchPublishedInstitutionContests(institutionId) {
  const snap = await getDocs(query(collection(db, "contests"), where("institutionId", "==", institutionId), where("status", "==", "published")));
  return snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
}

function toDate(v) {
  if (!v) return null;
  return typeof v.toDate === "function" ? v.toDate() : new Date(v);
}

export function contestPhase(contest, now = new Date()) {
  const regEnd = toDate(contest.registrationEnd);
  const start = toDate(contest.contestStart);
  const end = toDate(contest.contestEnd);
  if (end && now > end) return "past";
  if (start && now >= start) return "live";
  if (regEnd && now > regEnd) return "closed"; // registration closed, not yet started
  return "upcoming";
}

export function bucketContests(contests, now = new Date()) {
  const buckets = { live: [], upcoming: [], past: [] };
  for (const c of contests) {
    const phase = contestPhase(c, now);
    if (phase === "live") buckets.live.push(c);
    else if (phase === "past") buckets.past.push(c);
    else buckets.upcoming.push(c);
  }
  return buckets;
}

// The platform-wide, campus-agnostic contest feed - Arena's Contest Hub, the
// Home dashboard's upcoming-contests widget, sitemap.ts, and every Campus
// surface reachable BEFORE picking a specific college (the directory teaser,
// the global /campus/contests page) all call this expecting exactly that:
// contests anyone can see, not one institution's private roster. Institution-
// scoped contests (contests/{id}.institutionId set - see the Contest Studio)
// are firestore.rules-gated to that institution's own approved students, but
// an approved student of college A is still a normal signed-in user
// everywhere else - without this filter, college A's own contests would leak
// into every one of those "public" surfaces for that student specifically.
// Institution-scoped contests are only ever fetched via fetchInstitutionContests(id)
// below, from inside that institution's own workspace.
export async function fetchPublishedContests() {
  const snap = await getDocs(query(collection(db, "contests"), where("status", "==", "published")));
  return snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(c => !c.institutionId);
}

export async function fetchContest(contestId) {
  const snap = await getDoc(doc(db, "contests", contestId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// ---------------- Contest Administration Controls ----------------
// Every value here defaults to today's existing hardcoded behavior
// (leaderboard on, everything gated to contest-end) so publishing this
// feature never changes an already-live contest's behavior until an admin
// actually opens Contest Settings and changes something.
export const CONTEST_SETTINGS_DEFAULTS = {
  leaderboardEnabled: true,
  answerKeyRelease: "after_end",    // 'immediate' | 'after_submission' | 'after_end' | 'manual'
  explanationsRelease: "after_end", // 'immediate' | 'after_end' | 'never'
  analysisRelease: "after_end",     // 'immediate' | 'after_end' | 'manual' | 'disabled'
  allowQuestionReview: true,
  showCorrectAnswers: true,
  highlightIncorrect: true,
  scoreRelease: "after_end",        // 'immediate' | 'after_end' | 'manual'
  rankingVisibility: "campus_only", // 'public' | 'campus_only' | 'hidden'
};

export function getContestSettings(contest) {
  return { ...CONTEST_SETTINGS_DEFAULTS, ...(contest?.settings || {}) };
}

export async function updateContestSettings(contestId, settings) {
  await updateDoc(doc(db, "contests", contestId), { settings });
}

// One "manual release" flag per gated thing an admin can flip open early,
// independent of contest phase - stored separately from `settings` so
// flipping a release doesn't require re-saving the whole settings object.
export async function setManualRelease(contestId, key, value) {
  await updateDoc(doc(db, "contests", contestId), { [`manualReleases.${key}`]: value });
}

// Pure - resolves one release-mode setting against the contest's current
// phase and (if mode === 'manual') the admin's manual-release flag.
export function isSettingReleased(mode, phase, manualFlag) {
  if (mode === "immediate") return true;
  if (mode === "never" || mode === "disabled") return false;
  if (mode === "manual") return !!manualFlag;
  if (mode === "after_end" || mode === "after_submission") return phase === "past";
  return false;
}

export async function fetchContestQuestions(contestId) {
  const snap = await getDocs(query(collection(db, "contests", contestId, "questions"), orderBy("order", "asc")));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function fetchContestAnswerKeys(contestId) {
  const snap = await getDocs(collection(db, "contests", contestId, "answerKeys"));
  const keys = {};
  snap.docs.forEach(d => { keys[d.id] = d.data(); });
  return keys;
}

export async function fetchContestAnnouncements(contestId) {
  const snap = await getDocs(query(collection(db, "contests", contestId, "announcements"), orderBy("createdAt", "desc")));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// Cross-contest feed for the Contest Hub's "Announcements" sub-view. Fans out
// one bounded query per contest the caller can already see (contestIds comes
// from the Hub's own already-loaded fetchPublishedContests() list) rather
// than a single collectionGroup(db, "announcements") query - Firestore
// rejects a collection-group `list` outright when the same collection name
// is matched by two structurally different rule blocks (this one is also
// used by institutions/{id}/announcements, a completely unrelated feature
// with its own targetUids-based rule), since it can't statically prove every
// possible matching document is readable from the query shape alone. That
// made the old query fail closed for literally everyone, including admins
// and approved students who should have had full access - verified directly
// against the emulator, not assumed from a lint-style read of the rules.
export async function fetchRecentAnnouncements(contestIds, topN = 10) {
  if (!contestIds?.length) return [];
  const perContest = await Promise.all(contestIds.map(contestId =>
    getDocs(query(collection(db, "contests", contestId, "announcements"), orderBy("createdAt", "desc"), limit(topN)))
      .then(snap => snap.docs.map(d => ({ id: d.id, contestId, ...d.data() })))
      .catch(() => [])
  ));
  return perContest.flat()
    .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0))
    .slice(0, topN);
}

export async function fetchMyRegistration(contestId, uid) {
  const snap = await getDoc(doc(db, "contests", contestId, "registrations", uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function fetchMySubmission(contestId, uid) {
  const snap = await getDoc(doc(db, "contests", contestId, "submissions", uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// Student Management's "reset a student's contest attempt" - deletes their
// submission doc (registration stays intact) so they can attempt again; the
// registration's own re-entry gating in CampusContestAttempt already blocks
// re-submission only via an existing submission doc, so removing it is
// sufficient to unblock a retry. Institution-admin-only, see firestore.rules.
export async function resetContestAttempt(contestId, uid) {
  await deleteDoc(doc(db, "contests", contestId, "submissions", uid));
}

export async function registerForContest(contestId, uid) {
  // Skip the participantCount bump entirely if this uid is already
  // registered - a duplicate call (second tab, retry) must not double-count
  // someone who only ever gets one registration doc.
  const existing = await fetchMyRegistration(contestId, uid);
  if (existing) return;
  await setDoc(doc(db, "contests", contestId, "registrations", uid), {
    registeredAt: serverTimestamp(),
  });
  await updateDoc(doc(db, "contests", contestId), { participantCount: increment(1) });
}

// maxScore (sum of every question's marks) must be passed in and is written
// honestly at create time - firestore.rules locks it from then on and bounds
// the later grading update's score/correctCount against it.
// answerTimings: { [questionId]: secondsSpent } - powers the Student Analysis
// Dashboard's "time per question" / "fastest correct answer" view. Optional
// (defaults to {}) so this stays backward-compatible with any in-flight
// attempt started before this field existed.
export async function submitContestAnswers(contestId, uid, answers, timeTakenSeconds, maxScore, answerTimings = {}) {
  await setDoc(doc(db, "contests", contestId, "submissions", uid), {
    answers, timeTakenSeconds, maxScore, answerTimings, submittedAt: serverTimestamp(), graded: false,
  });
}

// Pure scoring - no Firestore reads/writes. Correctness is always keyed by stable
// question.id / option.id, never array index, so client-side shuffling can never
// affect grading.
export function gradeSubmission(questions, answerKeys, answers) {
  let score = 0;
  let maxScore = 0;
  let correctCount = 0;
  let attemptedCount = 0;

  for (const q of questions) {
    const marks = q.marks || 1;
    maxScore += marks;
    const key = answerKeys[q.id];
    const given = answers?.[q.id];
    const isBlank = given === undefined || given === null || given === ""
      || (Array.isArray(given) && given.length === 0);
    if (!key || isBlank) continue;

    attemptedCount++;
    const correct = isAnswerCorrect(q, key, given);
    if (correct) { score += marks; correctCount++; }
    else if (q.negativeMarks) score -= q.negativeMarks;
  }

  const accuracy = attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : 0;
  const accuracyRatio = maxScore > 0 ? Math.max(0, score) / maxScore : 0;
  return { score, maxScore, correctCount, attemptedCount, accuracy, accuracyRatio };
}

export function isAnswerCorrect(question, key, given) {
  if (question.type === "multiselect") {
    const a = [...given].sort();
    const b = [...(key.correctOptionIds || [])].sort();
    return a.length === b.length && a.every((v, i) => v === b[i]);
  }
  if (question.type === "fillblank") {
    const accepted = (key.correctText || "").split("|").map(s => s.trim().toLowerCase()).filter(Boolean);
    return accepted.includes(String(given).trim().toLowerCase());
  }
  return given === (key.correctOptionIds || [])[0];
}

// Contests intentionally grant no XP/Coins/Score (platform policy: only
// Daily Learning, Programming, and CS Core reward) - this only ever
// persists the grading result (score/accuracy/rank inputs), never touches
// users/{uid}, user_earnings/{uid}, or reward_grants.
//
// One-time, irreversible grading write. Wrapped in a transaction,
// re-reading `graded` live immediately before writing, so two
// near-simultaneous grading calls (a double-click, or two tabs) can't both
// read the submission as `graded: false` and both commit - the loser of the
// race re-reads an already-graded submission and writes nothing.
export async function persistGrading(contestId, uid, grading) {
  const submissionRef = doc(db, "contests", contestId, "submissions", uid);
  let alreadyGraded;

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(submissionRef);
    alreadyGraded = !!snap.data()?.graded;
    if (alreadyGraded) return;

    tx.update(submissionRef, {
      graded: true,
      score: grading.score,
      maxScore: grading.maxScore,
      accuracy: grading.accuracy,
      correctCount: grading.correctCount,
    });
  });

  return !alreadyGraded;
}

export async function fetchLeaderboard(contestId, topN = 50) {
  const snap = await getDocs(query(
    collection(db, "contests", contestId, "submissions"),
    where("graded", "==", true),
    orderBy("score", "desc"),
    orderBy("timeTakenSeconds", "asc"),
    limit(topN),
  ));
  const rows = snap.docs.map((d, i) => ({ rank: i + 1, uid: d.id, ...d.data() }));
  // rollNumber/campusFullName are only present for a Campus-institution
  // submitter (denormalized onto users/{uid} at approval - see
  // approveStudent in lib/institutions.js); undefined for a platform Arena
  // contest, where callers fall back to handle/uid as before. Batched via
  // documentId() "in" queries (30 uids/chunk) instead of one getDoc per
  // row - same fix already applied to fetchContestRegistrations below.
  const uids = rows.map(r => r.uid);
  const profilesByUid = new Map();
  for (let i = 0; i < uids.length; i += 30) {
    const chunk = uids.slice(i, i + 30);
    const chunkSnap = await getDocs(query(collection(db, "users"), where(documentId(), "in", chunk)));
    chunkSnap.docs.forEach(d => profilesByUid.set(d.id, { handle: d.data().handle, rollNumber: d.data().rollNumber, campusFullName: d.data().campusFullName }));
  }
  return rows.map(r => ({ ...r, ...(profilesByUid.get(r.uid) || null) }));
}

// Cheap rank-beyond-top-N via count aggregations instead of downloading the whole
// submissions collection. Mirrors fetchLeaderboard's score desc, timeTakenSeconds
// asc ordering: ahead of me = anyone with a strictly higher score, OR the same
// score but a faster time.
export async function fetchMyRank(contestId, myScore, myTimeTakenSeconds) {
  const [higherScore, tiedFaster] = await Promise.all([
    getCountFromServer(query(
      collection(db, "contests", contestId, "submissions"),
      where("graded", "==", true),
      where("score", ">", myScore),
    )),
    getCountFromServer(query(
      collection(db, "contests", contestId, "submissions"),
      where("graded", "==", true),
      where("score", "==", myScore),
      where("timeTakenSeconds", "<", myTimeTakenSeconds),
    )),
  ]);
  return higherScore.data().count + tiedFaster.data().count + 1;
}

// ---------------- Campus Contest Studio ----------------
// Below: shared create/update/duplicate/validate/question-bank/dashboard-fetch
// helpers, extracted so institution-contests-panel.jsx's old inlined-per-panel
// logic (and app/admin/page.jsx's near-identical copy) has one shared home.

export async function createContest(form, institutionId, uid) {
  const contestStart = new Date(form.contestStart);
  const contestEnd = new Date(form.contestEnd);
  const registrationEnd = form.registrationEnd ? new Date(form.registrationEnd) : contestStart;
  const registrationStart = form.registrationStart ? new Date(form.registrationStart) : new Date();
  const ref = await addDoc(collection(db, "contests"), {
    title: form.title.trim(), category: form.category, difficulty: form.difficulty,
    bannerUrl: form.bannerUrl.trim(), description: form.description.trim(), rules: form.rules.trim(),
    eligibility: form.eligibility.trim(), organizer: form.organizer.trim(),
    tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
    registrationStart, registrationEnd, contestStart, contestEnd,
    durationMinutes: parseInt(form.durationMinutes) || 60,
    prizeXp: parseInt(form.prizeXp) || 0, prizeCoins: parseInt(form.prizeCoins) || 0,
    prizeText: form.prizeText.trim(), status: form.status || "draft",
    institutionId, participantCount: 0, questionCount: 0,
    createdAt: serverTimestamp(), createdBy: uid || "",
  });
  return ref.id;
}

export async function updateContest(contestId, patch) {
  await updateDoc(doc(db, "contests", contestId), patch);
}

export async function duplicateContest(contest, uid) {
  const [qSnap, akSnap] = await Promise.all([
    getDocs(collection(db, "contests", contest.id, "questions")),
    getDocs(collection(db, "contests", contest.id, "answerKeys")),
  ]);
  const { id, participantCount, createdAt, ...rest } = contest;
  const newRef = await addDoc(collection(db, "contests"), {
    ...rest, title: `${contest.title} (Copy)`, status: "draft", participantCount: 0,
    createdAt: serverTimestamp(), createdBy: uid || "",
  });
  await Promise.all([
    ...qSnap.docs.map(d => setDoc(doc(db, "contests", newRef.id, "questions", d.id), d.data())),
    ...akSnap.docs.map(d => setDoc(doc(db, "contests", newRef.id, "answerKeys", d.id), d.data())),
  ]);
  return newRef.id;
}

export async function deleteContest(contestId) {
  const [qSnap, akSnap, regSnap, subSnap, annSnap] = await Promise.all([
    getDocs(collection(db, "contests", contestId, "questions")),
    getDocs(collection(db, "contests", contestId, "answerKeys")),
    getDocs(collection(db, "contests", contestId, "registrations")),
    getDocs(collection(db, "contests", contestId, "submissions")),
    getDocs(collection(db, "contests", contestId, "announcements")),
  ]);
  await Promise.all([
    ...qSnap.docs.map(d => deleteDoc(d.ref)), ...akSnap.docs.map(d => deleteDoc(d.ref)),
    ...regSnap.docs.map(d => deleteDoc(d.ref)), ...subSnap.docs.map(d => deleteDoc(d.ref)),
    ...annSnap.docs.map(d => deleteDoc(d.ref)),
  ]);
  await deleteDoc(doc(db, "contests", contestId));
}

// Pure - no Firestore reads. "A contest should never be publishable without at
// least one valid question": this is the single gate every publish path must
// call before flipping status to "published".
export function validateContestForPublish(form, questions) {
  const errors = [];
  if (!form.title?.trim()) errors.push("Title is required.");
  const regEnd = form.registrationEnd ? new Date(form.registrationEnd) : null;
  const start = form.contestStart ? new Date(form.contestStart) : null;
  const end = form.contestEnd ? new Date(form.contestEnd) : null;
  if (!start || !end) errors.push("Contest start and end dates are required.");
  else if (start >= end) errors.push("Contest end must be after contest start.");
  if (regEnd && start && regEnd > start) errors.push("Registration must close before the contest starts.");
  if (!(parseInt(form.durationMinutes) > 0)) errors.push("Duration must be greater than 0 minutes.");
  if (!questions || questions.length === 0) {
    errors.push("A contest needs at least one question before it can be published.");
  }
  (questions || []).forEach((q, i) => {
    const n = i + 1;
    if (!q.question?.trim()) errors.push(`Question ${n}: statement is empty.`);
    if (q.type === "fillblank") {
      if (!q.correctText?.trim()) errors.push(`Question ${n}: accepted answer is empty.`);
    } else {
      if (!q.options || q.options.length < 2) errors.push(`Question ${n}: needs at least 2 options.`);
      if (!q.correctOptionIds || q.correctOptionIds.length === 0) errors.push(`Question ${n}: no correct option marked.`);
    }
    if (!q.explanation?.trim()) errors.push(`Question ${n}: explanation is empty.`);
    if (!(parseFloat(q.marks) > 0)) errors.push(`Question ${n}: marks must be greater than 0.`);
  });
  return { valid: errors.length === 0, errors };
}

export async function addContestQuestion(contestId, question, order) {
  const qRef = doc(collection(db, "contests", contestId, "questions"));
  await setDoc(qRef, {
    type: question.type, question: question.question.trim(), options: question.options || [],
    marks: parseFloat(question.marks) || 1, negativeMarks: parseFloat(question.negativeMarks) || 0,
    topic: (question.topic || "").trim(), category: (question.category || "").trim(),
    tags: question.tags || [], difficulty: question.difficulty || "medium", order,
    estimatedTimeSec: question.estimatedTimeSec || null, hintText: (question.hintText || "").trim(),
    imageUrl: (question.imageUrl || "").trim(), codeSnippet: question.codeSnippet || "",
    createdAt: serverTimestamp(),
  });
  await setDoc(doc(db, "contests", contestId, "answerKeys", qRef.id), {
    correctOptionIds: question.correctOptionIds || [], correctText: question.correctText || "",
    explanation: (question.explanation || "").trim(),
  });
  return qRef.id;
}

export async function updateContestQuestion(contestId, questionId, patch, answerPatch) {
  await updateDoc(doc(db, "contests", contestId, "questions", questionId), patch);
  if (answerPatch) await updateDoc(doc(db, "contests", contestId, "answerKeys", questionId), answerPatch);
}

export async function deleteContestQuestion(contestId, questionId) {
  await deleteDoc(doc(db, "contests", contestId, "questions", questionId));
  await deleteDoc(doc(db, "contests", contestId, "answerKeys", questionId));
}

// Chunked writeBatch import (200 rows/batch, mirrors institution-contests-panel.jsx's
// existing convention) - used by both the manual-CSV and .xlsx bulk-upload paths in
// the Contest Studio's question step.
export async function importContestQuestionsBatch(contestId, questions, startOrder) {
  for (let i = 0; i < questions.length; i += 200) {
    const chunk = questions.slice(i, i + 200);
    const batch = writeBatch(db);
    chunk.forEach((q, idx) => {
      const qRef = doc(collection(db, "contests", contestId, "questions"));
      batch.set(qRef, {
        type: q.type, question: q.question, options: q.options, marks: q.marks,
        negativeMarks: q.negativeMarks, topic: q.topic, difficulty: q.difficulty,
        order: startOrder + i + idx, createdAt: serverTimestamp(),
      });
      batch.set(doc(db, "contests", contestId, "answerKeys", qRef.id), {
        correctOptionIds: q.correctOptionIds, correctText: q.correctText, explanation: q.explanation,
      });
    });
    await batch.commit();
  }
}

export async function setContestQuestionCount(contestId, count) {
  await updateDoc(doc(db, "contests", contestId), { questionCount: count });
}

// ---------------- Per-institution Question Bank ----------------
// institutions/{institutionId}/questionBank/{questionId} - never read by
// students (firestore.rules gates it to admin/institution-admin only); adding
// a bank question to a contest COPIES it into that contest's own questions/
// answerKeys subcollections via addContestQuestion above, same denormalized
// shape as every other contest question.

export async function fetchQuestionBank(institutionId) {
  const snap = await getDocs(query(collection(db, "institutions", institutionId, "questionBank"), orderBy("createdAt", "desc")));
  return snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(q => !q.archived);
}

export async function saveToQuestionBank(institutionId, question, uid) {
  const ref = await addDoc(collection(db, "institutions", institutionId, "questionBank"), {
    ...question, archived: false, createdAt: serverTimestamp(), createdBy: uid || "",
  });
  return ref.id;
}

export async function updateBankQuestion(institutionId, questionId, patch) {
  await updateDoc(doc(db, "institutions", institutionId, "questionBank", questionId), patch);
}

export async function archiveBankQuestion(institutionId, questionId) {
  await updateDoc(doc(db, "institutions", institutionId, "questionBank", questionId), { archived: true });
}

// ---------------- Contest dashboard fetchers ----------------

// Batched via documentId() "in" queries (30 uids per query, Firestore's own
// cap) instead of one getDoc() per registrant - a contest with hundreds or
// thousands of registrants used to fire that many individual reads in one
// Promise.all burst. users/{uid} is public-read (see firestore.rules), so
// this needs no per-uid permission check the way a single getDoc did.
export async function fetchContestRegistrations(contestId) {
  const snap = await getDocs(collection(db, "contests", contestId, "registrations"));
  const rows = snap.docs.map(d => ({ uid: d.id, ...d.data() }));
  const uids = rows.map(r => r.uid);
  const profilesByUid = new Map();
  for (let i = 0; i < uids.length; i += 30) {
    const chunk = uids.slice(i, i + 30);
    const chunkSnap = await getDocs(query(collection(db, "users"), where(documentId(), "in", chunk)));
    chunkSnap.docs.forEach(d => profilesByUid.set(d.id, { handle: d.data().handle, rollNumber: d.data().rollNumber, campusFullName: d.data().campusFullName }));
  }
  return rows.map(r => ({ ...r, ...(profilesByUid.get(r.uid) || null) }));
}

export async function fetchContestSubmissions(contestId) {
  const snap = await getDocs(collection(db, "contests", contestId, "submissions"));
  return snap.docs.map(d => ({ uid: d.id, ...d.data() }));
}

// Dynamically imported so the ~1MB SheetJS parser is only ever fetched by a
// browser that actually opens the .xlsx upload path, not on every Campus load.
// Converts the first sheet to CSV text, then hands off to the SAME parseCSV/
// csvRowsToContestQuestions used by the plain-.csv path - no duplicated
// validation logic for the second file format.
export async function xlsxToCsvText(file) {
  const XLSX = await import("xlsx");
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_csv(sheet);
}
