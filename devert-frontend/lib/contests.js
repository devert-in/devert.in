import { auth, db } from "@/lib/firebase";
import {
  collection, doc, addDoc, deleteDoc, getDocs, getDoc, setDoc, updateDoc, query, orderBy, where,
  limit, increment, serverTimestamp, getCountFromServer, writeBatch, documentId, runTransaction,
  Timestamp,
} from "firebase/firestore";

// Firestore rejects the serverTimestamp() sentinel ANYWHERE inside an array
// ("FieldValue.serverTimestamp() cannot be used inside of an array") - the
// write throws before it leaves the client. lifecycleHistory is an array of
// audit entries, so every entry's `at` has to be a concrete client-side
// Timestamp instead. Using serverTimestamp() there made createContest and
// EVERY lifecycle transition throw, which is why the only lifecycleHistory
// entries in production were written by the "_migration" backfill and not one
// by the app itself - an admin could never move a contest to Live at all.
//
// The tradeoff is deliberate and small: `at` is now the client's clock rather
// than the server's, so a wrong device clock writes a wrong audit timestamp.
// That is acceptable for a display-only audit trail, and it is the standard
// workaround. It is NOT acceptable for anything a rule or a deadline depends
// on - contestStart/contestEnd/registeredAt/submittedAt are all top-level
// fields and deliberately keep using the real serverTimestamp().
function historyStamp() {
  return Timestamp.now();
}

export const CONTEST_CATEGORIES = [
  "Aptitude & Reasoning", "Programming Fundamentals", "Java", "Python", "C++", "SQL",
  "DBMS", "Operating Systems", "Computer Networks", "OOP", "AI & ML",
  "Web Development", "Placement Preparation", "General Knowledge",
];

export const CONTEST_DIFFICULTIES = ["Easy", "Medium", "Hard"];
// "coding" is graded entirely differently from the other four - never
// client-side (there's no answerKey for it; see gradeSubmission's coding
// branch below) and never by a shared answerKeys doc, since hidden tests
// can never be client-readable. See addContestQuestion/deleteContestQuestion
// and the new fetchContestQuestionSampleTests/saveContestCodingTests below.
export const QUESTION_TYPES = ["mcq", "multiselect", "truefalse", "fillblank", "coding"];

export const CONTEST_STATUSES = [
  { v: "draft",     c: "rgba(255,255,255,0.4)" },
  { v: "published", c: "#00FF41" },
  { v: "archived",  c: "rgba(255,255,255,0.25)" },
];

// What KIND of contest this is - purely descriptive/filtering metadata today
// (doesn't gate which question types are allowed; a "coding" contest could
// still add an MCQ question if an admin wants). Default stays "mixed" so an
// existing contest with no contestType set reads the same as before.
export const CONTEST_TYPES = [
  { v: "coding",       label: "Coding" },
  { v: "mcq",          label: "MCQ" },
  { v: "mixed",        label: "Mixed (Coding + MCQ)" },
  { v: "aptitude",     label: "Aptitude" },
  { v: "placement",    label: "Placement Round" },
  { v: "internalExam", label: "Internal Exam" },
  { v: "practice",     label: "Practice" },
  { v: "custom",       label: "Custom" },
];

// Real lifecycle state machine - see LIFECYCLE_TRANSITIONS below for the
// legal moves between these. Distinct from (but kept in sync with) the
// older `status` field: `status` is still what every existing read/rule
// checks for "is this contest visible/published" (published ⇔ lifecycleState
// is anywhere from registrationOpen through resultsPublished; archived ⇔
// lifecycleState === "archived"), so nothing that reads `status` today
// breaks. `lifecycleState` is the new, richer, admin-transitioned source of
// truth going forward.
export const LIFECYCLE_STATES = [
  "draft", "hidden", "registrationOpen", "registrationClosed",
  "live", "submissionClosed", "evaluation", "resultsPublished", "archived",
];

export const LIFECYCLE_LABELS = {
  draft: "Draft", hidden: "Hidden", registrationOpen: "Registration Open",
  registrationClosed: "Registration Closed", live: "Live",
  submissionClosed: "Submission Closed", evaluation: "Evaluation",
  resultsPublished: "Results Published", archived: "Archived",
};

// Legal next states from each state - both the forward path and the
// explicit admin-controlled back-steps (Force End = an early live ->
// submissionClosed; Resume = a submissionClosed -> live reopen; Restart -
// see restartContest below - is handled separately since it clears
// submissions rather than just moving state). Pause/Resume/Extend/Reduce
// Time during Live do NOT change lifecycleState at all - see
// pauseContest/resumeContest, a separate mechanism, since a contest is
// still "live" while paused.
const LIFECYCLE_TRANSITIONS = {
  draft: ["hidden", "registrationOpen", "archived"],
  hidden: ["registrationOpen", "draft", "archived"],
  registrationOpen: ["registrationClosed", "hidden"],
  registrationClosed: ["live", "registrationOpen"],
  live: ["submissionClosed"],
  submissionClosed: ["evaluation", "live"],
  evaluation: ["resultsPublished", "submissionClosed"],
  resultsPublished: ["archived", "evaluation"],
  archived: [],
};

export function legalNextLifecycleStates(current) {
  return LIFECYCLE_TRANSITIONS[current] || [];
}

// Shared by both the global admin ContestsPanel and Campus's institution-scoped
// contest manager (components/campus/institution-contests-panel.jsx) - same
// create/question-authoring shape either way, just optionally carrying an
// institutionId.
// Default target scope - "all" (institution-wide) is today's only behavior,
// so a contest an admin never touches Step 3 for keeps working exactly as
// before. `mode: "scoped"` is what actually activates the narrower filters.
export function blankTargetScope() {
  return { mode: "all", departments: [], years: [], sections: [], classroomIds: [], uids: [] };
}

export function blankContestForm() {
  return {
    title: "", category: CONTEST_CATEGORIES[0], difficulty: "Easy", bannerUrl: "",
    description: "", rules: "", eligibility: "", organizer: "", tags: "",
    contestType: "mixed", targetScope: blankTargetScope(),
    registrationStart: "", registrationEnd: "", contestStart: "", contestEnd: "",
    graceMinutes: "0", resultPublishAt: "", leaderboardPublishAt: "",
    // prizeXp/prizeCoins default to 0, not a nonzero placeholder - contests no
    // longer grant platform XP/Coins at all (see persistGrading), so these
    // fields are no longer collected in the authoring form; a stale nonzero
    // default here would otherwise silently persist on every new contest with
    // no UI to notice or change it.
    durationMinutes: "60", prizeXp: "0", prizeCoins: "0", prizeText: "", status: "draft",
  };
}

// NOTE: the client-side audience matcher that used to live here has been
// removed. It was exported and documented as "the" audience filter but had no
// callers anywhere in the app, so the next person to change audience logic
// would have edited it, seen nothing break, and shipped a no-op.
//
// Audience scoping is enforced in exactly one place: matchesContestScope() /
// isInContestAudience() in firestore.rules, which gate isApprovedForContest()
// and therefore every read of a contest, its questions, and its answer keys.
// That is the authority boundary - there is deliberately no client mirror of
// it to drift out of sync.

export function blankContestQuestionForm(type = "mcq") {
  return {
    type, question: "", options: ["", "", "", ""], correctIndices: [0], correctText: "",
    marks: "1", negativeMarks: "0", explanation: "", topic: "", difficulty: "medium",
    // Coding-only - sampleTests are client-visible (shown to the student
    // during the attempt, same as problems/{id}/sampleTests); hiddenTests
    // never leave this form/the admin wizard once saved (see
    // saveContestCodingTests below - written straight to a subcollection
    // firestore.rules makes admin-read-only, mirroring problems/{id}/hiddenTests).
    sampleTests: type === "coding" ? [{ input: "", expectedOutput: "", explanation: "" }] : [],
    hiddenTests: type === "coding" ? [{ input: "", expectedOutput: "" }] : [],
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

// Prefers the real lifecycleState when a contest has one (set by
// transitionContestLifecycle below) - only falls back to the old
// timestamp-derived guess for contests created before this existed, so
// neither path is a second parallel implementation of "what phase is this
// contest in", just two ways of arriving at the same four buckets every
// existing caller (bucketContests, the student Contests list, the admin
// dashboard) already understands.
// lifecycleState ARMS a contest; the clock decides whether it is actually open.
//
// This used to return "live" on lifecycleState alone, without ever reading
// contestStart - so moving a contest to Live hours ahead of time (a perfectly
// reasonable thing for an admin to do while setting up) opened it to students
// immediately, against a paper nobody was supposed to have seen yet. It also
// never re-read contestEnd, so a contest whose end time had passed stayed open
// until a human remembered to close it, and late submissions kept landing.
//
// Nothing in this project runs on a schedule - the only deployed Cloud
// Functions are link-preview routers, and Firestore rules cannot act on their
// own - so a state that ignores the clock is never corrected by anything. The
// dates have to be the bound, with lifecycleState as the gate on top:
//
//   not "live" yet          -> the clock cannot open it
//   "live" but before start -> armed, still shows as upcoming/closed
//   "live" and within window-> genuinely live
//   "live" but past the end -> over, whether or not anyone clicked
//
// Both admin overrides still work, by different routes: Extend/Reduce Time
// rewrite contestEnd, so the clock branch below picks them up; Force End moves
// the state to submissionClosed, which resolves to "past" without consulting
// the clock at all. Neither needed changing for this.
export function contestPhase(contest, now = new Date()) {
  const regEnd = toDate(contest.registrationEnd);
  const start = toDate(contest.contestStart);
  const end = toDate(contest.contestEnd);

  // The clock alone, used both by the legacy no-lifecycleState path and as the
  // resolver once lifecycleState says the contest is allowed to be running.
  const byClock = () => {
    if (end && now > end) return "past";
    if (start && now >= start) return "live";
    if (regEnd && now > regEnd) return "closed"; // registration shut, not yet started
    return "upcoming";
  };

  if (contest.lifecycleState) {
    switch (contest.lifecycleState) {
      case "draft": case "hidden": case "registrationOpen":
        // Still taking registrations - but once the registration window shuts,
        // say so rather than showing a Register button that the rules will
        // reject (request.time <= registrationEnd is enforced server-side).
        return regEnd && now > regEnd ? "closed" : "upcoming";
      case "registrationClosed":
        return "closed";
      case "live":
        return byClock();
      default:
        // submissionClosed, evaluation, resultsPublished, archived
        return "past";
    }
  }
  return byClock();
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
// codingResults: { [questionId]: { score, testsPassed, testsTotal, verdict } } -
// fetched separately via fetchContestCodingResults (see below - its own
// submissions/{uid}/codingResults subcollection, NOT a field on the
// submission doc itself: devert-backend writes a coding question's result
// the moment a student hits Submit on it, which can happen well before the
// final submitContestAnswers() plain setDoc() - if that result lived on the
// submission doc directly, the backend's earlier write would make the doc
// already exist by the time the final submit runs, and firestore.rules would
// then evaluate it as an `update` rather than a `create`, which only permits
// the later graded:false->true flip fields, not answers/maxScore. A separate
// subcollection sidesteps that ordering trap entirely). Already server-
// graded (the ONLY code path that ever sees hidden tests) and folded
// straight in, not recomputed here - there is no answerKey for a coding
// question and never will be, since correctness can only ever be judged by
// actually running the code. A coding question with no codingResults entry
// yet (student never hit Submit on it) counts toward maxScore but
// contributes 0, same "unattempted" treatment as a blank MCQ.
export function gradeSubmission(questions, answerKeys, answers, codingResults = {}) {
  let score = 0;
  let maxScore = 0;
  let correctCount = 0;
  let attemptedCount = 0;

  for (const q of questions) {
    const marks = q.marks || 1;
    maxScore += marks;

    if (q.type === "coding") {
      const result = codingResults[q.id];
      if (!result) continue;
      attemptedCount++;
      score += Math.max(0, Math.min(marks, result.score || 0));
      if (result.verdict === "Accepted") correctCount++;
      continue;
    }

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

// Grades every submission that the student never came back to grade.
//
// Grading is otherwise lazy: persistGrading only runs in the student's own
// browser, the first time they reopen their result after the contest ends. A
// student who submitted and closed the tab stays graded:false forever, appears
// in no leaderboard, and is excluded from the average / highest / lowest, since
// those are computed over graded submissions only. The reported numbers were
// therefore drawn from a self-selected subset - the students who came back.
//
// Scores with the SAME pure gradeSubmission() the student path uses, against
// the same answer keys and the same backend-written coding results, so a swept
// score is identical to the one that student would have produced themselves.
// Idempotent per submission: persistGrading re-reads `graded` inside a
// transaction, so re-running the sweep (or racing a student who opens their
// result mid-sweep) cannot double-grade or overwrite.
//
// Sequential, not Promise.all - this can touch hundreds of submissions and each
// one is a transaction; a burst of parallel writes buys nothing here and risks
// contention. Returns per-submission outcomes so the caller can report honestly
// rather than claiming a clean sweep it didn't verify.
export async function gradeUngradedSubmissions(contestId, { onProgress } = {}) {
  const [questions, answerKeys, subsSnap] = await Promise.all([
    fetchContestQuestions(contestId),
    fetchContestAnswerKeys(contestId),
    getDocs(collection(db, "contests", contestId, "submissions")),
  ]);
  const pending = subsSnap.docs.filter(d => !d.data().graded);
  const result = { total: pending.length, graded: 0, failed: 0, errors: [] };

  for (let i = 0; i < pending.length; i++) {
    const d = pending[i];
    try {
      const codingResults = await fetchContestCodingResults(contestId, d.id).catch(() => ({}));
      const grading = gradeSubmission(questions, answerKeys, d.data().answers || {}, codingResults);
      await persistGrading(contestId, d.id, grading);
      result.graded++;
    } catch (e) {
      result.failed++;
      // Keep the uid - "3 failed" is useless without knowing which.
      result.errors.push({ uid: d.id, message: e?.message || String(e) });
    }
    onProgress?.(i + 1, pending.length);
  }
  return result;
}

// ---------------- Staff dry runs ----------------

// An admin taking the paper end-to-end to verify it, WITHOUT becoming a
// participant.
//
// WHY A SEPARATE COLLECTION AND NOT AN isDryRun FLAG ON submissions. Every
// analytics read - fetchLeaderboard, fetchMyRank's count aggregations, and the
// dashboard's registration/submission/average cards - queries the submissions
// collection. Excluding a flagged doc from all of those would mean:
//   - Firestore's `!=` skips documents where the field is ABSENT, so every
//     submission already written would be excluded too, silently emptying the
//     leaderboards of the two contests that already ran.
//   - or backfilling isDryRun:false onto every historical submission and
//     adding the field to composite indexes, to solve a problem caused by a
//     handful of staff runs.
// Writing dry runs to their own path sidesteps both: nothing that reads
// `submissions` can see them, with no query, index, or backfill change at all.
// The cost is that a dry run does not get the real attempt's coding-grading
// (devert-backend writes into submissions/{uid}/codingResults), so MCQ scoring
// is authoritative here and coding is recorded as answered-but-ungraded.
export async function submitContestDryRun(contestId, uid, payload) {
  await setDoc(doc(db, "contests", contestId, "dryRuns", uid), {
    ...payload,
    isDryRun: true,
    submittedAt: serverTimestamp(),
  });
}

// ---------------- Mock Reviewers ----------------

// Per-contest, not a global role: being trusted to review one paper says
// nothing about any other, and a reviewer is very often a student who will sit
// a different contest for real. firestore.rules enforces the whole boundary -
// a reviewer may read this contest and write their own dryRun, and may not
// register, submit, or touch anyone else's anything.
export async function addContestReviewer(contestId, uid, meta = {}, byUid = "") {
  await setDoc(doc(db, "contests", contestId, "reviewers", uid), {
    uid,
    name: meta.name || "", rollNumber: meta.rollNumber || "", email: meta.email || "",
    enabled: true, addedAt: serverTimestamp(), addedBy: byUid || "",
  }, { merge: true });
}

export async function removeContestReviewer(contestId, uid) {
  await deleteDoc(doc(db, "contests", contestId, "reviewers", uid));
}

// Suspends access without losing what they already tested - the roster doc is
// also the record of who reviewed, so deleting it to pause someone would throw
// that away.
export async function setContestReviewerEnabled(contestId, uid, enabled) {
  await updateDoc(doc(db, "contests", contestId, "reviewers", uid), { enabled: !!enabled });
}

export async function fetchContestReviewers(contestId) {
  const snap = await getDocs(collection(db, "contests", contestId, "reviewers"));
  return snap.docs.map(d => ({ uid: d.id, ...d.data() }));
}

// Lets the attempt screen show the review-mode banner. Returns null for
// everyone who isn't a listed, enabled reviewer.
export async function fetchMyContestReviewer(contestId, uid) {
  if (!contestId || !uid) return null;
  const snap = await getDoc(doc(db, "contests", contestId, "reviewers", uid)).catch(() => null);
  if (!snap?.exists()) return null;
  const data = snap.data();
  return data.enabled === false ? null : { uid, ...data };
}

export async function fetchContestDryRuns(contestId) {
  const snap = await getDocs(collection(db, "contests", contestId, "dryRuns"));
  return snap.docs.map(d => ({ uid: d.id, ...d.data() }));
}

// Deliberately deletable, unlike a real submission - a dry run is scratch data
// an admin should be able to clear and redo as many times as they want.
export async function deleteContestDryRun(contestId, uid) {
  await deleteDoc(doc(db, "contests", contestId, "dryRuns", uid));
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
  const initialStatus = form.status || "draft";
  const ref = await addDoc(collection(db, "contests"), {
    title: form.title.trim(), category: form.category, difficulty: form.difficulty,
    bannerUrl: form.bannerUrl.trim(), description: form.description.trim(), rules: form.rules.trim(),
    eligibility: form.eligibility.trim(), organizer: form.organizer.trim(),
    tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
    contestType: form.contestType || "mixed",
    targetScope: form.targetScope || blankTargetScope(),
    registrationStart, registrationEnd, contestStart, contestEnd,
    graceMinutes: parseInt(form.graceMinutes) || 0,
    resultPublishAt: form.resultPublishAt ? new Date(form.resultPublishAt) : null,
    leaderboardPublishAt: form.leaderboardPublishAt ? new Date(form.leaderboardPublishAt) : null,
    durationMinutes: parseInt(form.durationMinutes) || 60,
    prizeXp: parseInt(form.prizeXp) || 0, prizeCoins: parseInt(form.prizeCoins) || 0,
    prizeText: form.prizeText.trim(), status: initialStatus,
    // New contests get a real lifecycleState from day one - "draft" status
    // maps to lifecycleState "draft", "published" (the only other status the
    // create form ever sets) maps to "registrationOpen", the first published
    // state - an admin can immediately transition further if registration
    // should already be closed.
    lifecycleState: initialStatus === "published" ? "registrationOpen" : "draft",
    lifecycleHistory: [{ state: initialStatus === "published" ? "registrationOpen" : "draft", at: historyStamp(), byUid: uid || "" }],
    institutionId, participantCount: 0, questionCount: 0,
    createdAt: serverTimestamp(), createdBy: uid || "",
  });
  return ref.id;
}

// ---------------- Lifecycle transitions ----------------

// The one function every lifecycle-changing UI action goes through -
// validates the move is legal (see LIFECYCLE_TRANSITIONS), keeps the older
// `status` field in sync so every existing status-based read/rule keeps
// working unchanged, and appends an audit entry. Rejects client-side before
// ever hitting Firestore; firestore.rules independently re-checks
// admin/institution-admin on the write itself (a rejected client-side check
// is a UX nicety, never the real boundary).
export async function transitionContestLifecycle(contestId, toState, uid) {
  if (!LIFECYCLE_STATES.includes(toState)) throw new Error(`Unknown lifecycle state "${toState}".`);
  const contestRef = doc(db, "contests", contestId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(contestRef);
    if (!snap.exists()) throw new Error("Contest not found.");
    const current = snap.data().lifecycleState || "draft";
    if (!legalNextLifecycleStates(current).includes(toState)) {
      throw new Error(`Cannot move from "${current}" to "${toState}".`);
    }
    const history = snap.data().lifecycleHistory || [];
    const newStatus = toState === "archived" ? "archived"
      : ["registrationOpen", "registrationClosed", "live", "submissionClosed", "evaluation", "resultsPublished"].includes(toState) ? "published"
      : "draft";
    tx.update(contestRef, {
      lifecycleState: toState,
      status: newStatus,
      lifecycleHistory: [...history, { state: toState, at: historyStamp(), byUid: uid || "" }],
    });
  });
}

// Shared by pause/resume/extend/reduce/force-end below - every live-contest
// admin action appends the same kind of audit entry as a real lifecycle
// transition, just without necessarily changing lifecycleState itself.
async function appendContestHistory(contestId, entry) {
  const contestRef = doc(db, "contests", contestId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(contestRef);
    if (!snap.exists()) throw new Error("Contest not found.");
    const history = snap.data().lifecycleHistory || [];
    tx.update(contestRef, { ...entry.patch, lifecycleHistory: [...history, { state: entry.state, at: historyStamp(), byUid: entry.uid || "" }] });
  });
}

// Pause/Resume are deliberately NOT lifecycle transitions - a paused contest
// is still "live" (still submissionClosed-bound by the same contestEnd), it
// just tells the student attempt screen to freeze the countdown and block
// further answering until resumed. See campus-contests.jsx's timer, which
// reads this flag on every tick.
export async function pauseContest(contestId, uid) {
  await appendContestHistory(contestId, { state: "paused", uid, patch: { paused: true, pausedAt: serverTimestamp() } });
}

export async function resumeContest(contestId, uid) {
  await appendContestHistory(contestId, { state: "resumed", uid, patch: { paused: false } });
}

// deltaMinutes may be negative (Reduce Time) - both push/pull the live
// contestEnd timestamp directly, which is all the student attempt screen's
// countdown needs (it already recomputes effectiveEnd from the contest doc
// on every tick, not a value cached at mount).
export async function extendContestTime(contestId, deltaMinutes, uid) {
  const contestRef = doc(db, "contests", contestId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(contestRef);
    if (!snap.exists()) throw new Error("Contest not found.");
    const currentEnd = toDate(snap.data().contestEnd) || new Date();
    const newEnd = new Date(currentEnd.getTime() + deltaMinutes * 60000);
    const history = snap.data().lifecycleHistory || [];
    tx.update(contestRef, {
      contestEnd: newEnd,
      lifecycleHistory: [...history, { state: deltaMinutes >= 0 ? "extended" : "reduced", at: historyStamp(), byUid: uid || "" }],
    });
  });
}

// Force End is just an early, admin-triggered live -> submissionClosed -
// the same legal transition Restart's counterpart (submissionClosed -> live,
// i.e. resumeContest... no, transitionContestLifecycle) already allows, just
// invoked ahead of the scheduled contestEnd rather than after it.
export async function forceEndContest(contestId, uid) {
  await transitionContestLifecycle(contestId, "submissionClosed", uid);
}

// Restart - a live-only control (see the user-facing control list above),
// distinct from Resume: clears every existing submission (a real do-over
// for everyone, not just reopening a paused window) and unpauses if paused.
// Doesn't touch lifecycleState at all - the contest is already "live" for
// this control to even be shown, same reasoning as pause/resume. Institution-
// admin/admin only, same authority as the single-student
// resetContestAttempt above, just applied to every registrant at once.
export async function restartContest(contestId, uid) {
  const subSnap = await getDocs(collection(db, "contests", contestId, "submissions"));
  await Promise.all(subSnap.docs.map(d => deleteDoc(d.ref)));
  await appendContestHistory(contestId, { state: "restarted", uid, patch: { paused: false } });
}

export async function updateContest(contestId, patch) {
  await updateDoc(doc(db, "contests", contestId), patch);
}

export async function duplicateContest(contest, uid) {
  const [qSnap, akSnap] = await Promise.all([
    getDocs(collection(db, "contests", contest.id, "questions")),
    getDocs(collection(db, "contests", contest.id, "answerKeys")),
  ]);
  const { id, participantCount, createdAt, lifecycleState, lifecycleHistory, paused, pausedAt, ...rest } = contest;
  const newRef = await addDoc(collection(db, "contests"), {
    ...rest, title: `${contest.title} (Copy)`, status: "draft", participantCount: 0,
    // A duplicate is a fresh draft, not a resurrection of wherever the
    // original contest's lifecycle ended up (resultsPublished/archived/
    // paused) - reset the whole lifecycle, same reasoning as status: "draft"
    // right above, which this used to be inconsistent with before
    // lifecycleState existed.
    lifecycleState: "draft",
    lifecycleHistory: [{ state: "draft", at: historyStamp(), byUid: uid || "" }],
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

// Also clears a coding question's sampleTests/hiddenTests subcollections -
// Firestore never cascade-deletes a subcollection on its own, and leaving
// them behind would just be dead, unreadable-forever docs (harmless read of
// two empty snapshots for every non-coding question, not worth branching on
// q.type just to skip it).
export async function deleteContestQuestion(contestId, questionId) {
  const [sampleSnap, hiddenSnap] = await Promise.all([
    getDocs(collection(db, "contests", contestId, "questions", questionId, "sampleTests")),
    getDocs(collection(db, "contests", contestId, "questions", questionId, "hiddenTests")),
  ]);
  const batch = writeBatch(db);
  sampleSnap.docs.forEach(d => batch.delete(d.ref));
  hiddenSnap.docs.forEach(d => batch.delete(d.ref));
  batch.delete(doc(db, "contests", contestId, "questions", questionId));
  batch.delete(doc(db, "contests", contestId, "answerKeys", questionId));
  await batch.commit();
}

export async function fetchContestQuestionSampleTests(contestId, questionId) {
  const snap = await getDocs(collection(db, "contests", contestId, "questions", questionId, "sampleTests"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// Admin-only (see firestore.rules) - exists purely so the Contest Studio's
// own "edit an existing coding question" flow can load back what an
// institution admin already authored. Never called from the student attempt
// path - that only ever reads sampleTests, and grading itself happens
// server-side via devert-backend's firebase-admin SDK, which bypasses these
// rules entirely (identical trust boundary to problems/{id}/hiddenTests).
export async function fetchContestQuestionHiddenTests(contestId, questionId) {
  const snap = await getDocs(collection(db, "contests", contestId, "questions", questionId, "hiddenTests"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// Full-replace, not incremental per-test CRUD - mirrors how MCQ options are
// always saved as one complete array rather than patched test-by-test.
export async function saveContestCodingTests(contestId, questionId, sampleTests, hiddenTests) {
  const sampleColl = collection(db, "contests", contestId, "questions", questionId, "sampleTests");
  const hiddenColl = collection(db, "contests", contestId, "questions", questionId, "hiddenTests");
  const [existingSample, existingHidden] = await Promise.all([getDocs(sampleColl), getDocs(hiddenColl)]);
  const batch = writeBatch(db);
  existingSample.docs.forEach(d => batch.delete(d.ref));
  existingHidden.docs.forEach(d => batch.delete(d.ref));
  (sampleTests || []).filter(t => t.input || t.expectedOutput).forEach(t =>
    batch.set(doc(sampleColl), { input: t.input || "", expectedOutput: t.expectedOutput || "", explanation: t.explanation || "" }));
  (hiddenTests || []).filter(t => t.input || t.expectedOutput).forEach(t =>
    batch.set(doc(hiddenColl), { input: t.input || "", expectedOutput: t.expectedOutput || "" }));
  await batch.commit();
}

function contestApiUrl() {
  return process.env.NEXT_PUBLIC_API_URL || "";
}

// No separate "run against samples" endpoint here - a contest coding
// question's sample tests are client-readable (fetchContestQuestionSampleTests),
// same as problems/{id}/sampleTests, so the student attempt view runs them
// exactly the way CampusProblemView already does: call lib/codelab.js's
// generic, problem-agnostic runCode() once per sample test and compare
// stdout against expectedOutput itself. Only grading against HIDDEN tests
// needs a backend round-trip, since only the backend ever reads them.

// Full grading against sample + hidden tests, scored against this question's
// own marks - mirrors lib/codelab.js's submitCode(), but this is the ONLY
// legal way a coding question's score is ever produced (there is no
// answerKey to grade against client-side). The backend verifies the Firebase
// ID token itself and writes the result into
// contests/{contestId}/submissions/{uid}/codingResults/{questionId} - see
// ContestGradingService on devert-backend and fetchContestCodingResults'
// comment on why that's a separate subcollection, not a field on the parent
// submission doc. Per-question, not part of the final MCQ
// submitContestAnswers() - a coding question's compile/run round-trip can't
// wait for one end-of-contest submit the way MCQs do.
export async function submitContestCodingAnswer(contestId, questionId, language, code) {
  const base = contestApiUrl();
  if (!base) throw new Error("Submissions aren't configured yet.");
  if (!auth.currentUser) throw new Error("Sign in to submit.");
  const idToken = await auth.currentUser.getIdToken();
  const res = await fetch(`${base}/api/contests/${contestId}/questions/${questionId}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${idToken}` },
    body: JSON.stringify({ language, code }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // A 404 here does not mean "your code is wrong" - it means this backend
    // build predates ContestGradingController, so the grading endpoint is not
    // deployed at all. Spring's bare "Not Found" surfaced straight to students
    // mid-contest, which reads like their submission was rejected. The backend
    // deploys separately from the frontend (CI ships hosting + functions only,
    // Cloud Run is manual), so the two genuinely can drift.
    if (res.status === 404) {
      throw new Error("Code grading isn't available right now - this is a server problem, not your code. Tell your Training & Placement Cell; your answers are still saved.");
    }
    if (res.status === 401 || res.status === 403) {
      throw new Error("Your session expired. Refresh the page and submit again - your code is saved.");
    }
    if (res.status >= 500) {
      throw new Error("The grading server had a problem. Wait a moment and submit again - your code is saved.");
    }
    throw new Error(data.error || `Submission failed (${res.status}).`);
  }
  return data;
}

// Owner (or admin/that institution's admin, or anyone once the contest has
// ended - same visibility as the parent submission doc) reads back every
// coding question this uid has ever submitted for this contest. Keyed by
// questionId so gradeSubmission's codingResults param can be built directly
// from this without any reshaping.
export async function fetchContestCodingResults(contestId, uid) {
  const snap = await getDocs(collection(db, "contests", contestId, "submissions", uid, "codingResults"));
  const results = {};
  snap.docs.forEach(d => { results[d.id] = d.data(); });
  return results;
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
