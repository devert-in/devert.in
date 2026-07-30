// Software Engineering Fundamentals - the core-platform flagship course.
//
// WHY THIS IS NOT PART OF THE EXISTING /learn FEATURE. `courses`/`user_learning`
// models a Learning Path as a tree of TASKS with a quiz gate and sequential
// unlock. This course is a different product: a lesson here is a long-form,
// story-first reading experience with fifteen optional authored sections, a lab,
// a video slot and its own resources. Forcing it into the task shape would mean
// either gutting the lesson structure or overloading `courses` with fields that
// mean nothing to the paths already in it. So: new collections, same conventions.
//
// WHY THIS IS NOT PART OF CAMPUS. Campus content is institution-scoped and
// rendered in the light/dark Campus theme. This is global, available to every
// DeVert user signed in or not, and rendered in the core platform's permanent
// dark neon theme. It is a peer of CodeLab and Arena, not of CS Core.
//
// Conventions followed from the existing global catalogs (lib/programming.js,
// lib/csCore.js, lib/gate.js) and for the same hard-won reasons documented
// there:
//   - Published content is world-readable; drafts are admin-only.
//   - Every non-admin list() MUST carry where("status","==","published") or
//     Firestore denies the whole query.
//   - orderBy is client-side so filter+sort never needs a composite index.
//   - Per-user progress is read by known doc id, never a where("uid","==") list.
//   - Reward-bearing completion is transaction-wrapped, idempotent, and goes
//     through the one shared grantRewards() ledger.
import { db } from "@/lib/firebase";
import { currentAudiences } from "@/lib/audiences";
import { withVersionSnapshot } from "@/lib/contentVersioning";
import {
  collection, doc, getDoc, getDocs, setDoc, deleteDoc, query, where,
  serverTimestamp, writeBatch, arrayUnion, arrayRemove, runTransaction,
} from "firebase/firestore";
import { grantRewards } from "@/lib/rewards";

export const SE_DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"];

// A lesson's authored sections, in the exact order the reader renders them.
// This array IS the contract between the admin CMS, the reader and the importer -
// one source of truth, so a section cannot be authorable but unrendered (the
// `keyPoints` class of bug from the GATE module, where three files disagreed
// about which fields existed and content was silently dropped).
//
// `kind` drives how the CMS edits it and how the reader draws it:
//   text   - single prose string, parsed through lib/lessonBlocks.js
//   list   - array of strings, rendered as an accented card
//   plain  - prose rendered WITHOUT the block parser (no ::: fences)
//   custom - has its own component; not a generic field
export const LESSON_SECTIONS = [
  { key: "learningObjectives", label: "Learning Objectives", kind: "list", accent: "cyan" },
  { key: "prerequisites", label: "Prerequisites", kind: "list", accent: "purple" },
  { key: "story", label: "Real-Life Story", kind: "text", accent: "purple" },
  { key: "problemStatement", label: "The Problem", kind: "text", accent: "orange" },
  { key: "concept", label: "How It Works", kind: "text", accent: "green" },
  { key: "walkthrough", label: "Step-by-Step Walkthrough", kind: "text", accent: "cyan" },
  { key: "codeExample", label: "Mini Demo", kind: "custom" },
  { key: "commonMistakes", label: "Common Mistakes", kind: "list", accent: "red" },
  { key: "industryPerspective", label: "How the Industry Does It", kind: "text", accent: "gold" },
  { key: "devertCaseStudy", label: "Inside DeVert", kind: "text", accent: "green" },
  { key: "knowledgeChecks", label: "Knowledge Check", kind: "custom" },
  { key: "lab", label: "Hands-On Lab", kind: "custom" },
  { key: "assignment", label: "Assignment", kind: "custom" },
  { key: "summary", label: "Summary", kind: "plain", accent: "green" },
  { key: "goingDeeper", label: "Going Deeper", kind: "text", accent: "purple" },
  { key: "resources", label: "Resources", kind: "custom" },
];

export const SECTION_KEYS = LESSON_SECTIONS.map(s => s.key);

// ---------------- modules ----------------

export async function fetchModules({ includeUnpublished = false } = {}) {
  const col = collection(db, "seModules");
  const snap = await getDocs(includeUnpublished ? col : query(col, where("status", "==", "published"), where("audiences", "array-contains-any", currentAudiences())));
  return snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (a.order || 0) - (b.order || 0));
}

export async function fetchModule(moduleId) {
  const snap = await getDoc(doc(db, "seModules", moduleId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function saveModule(moduleId, data) {
  await setDoc(doc(db, "seModules", moduleId), { updatedAt: serverTimestamp(), ...data }, { merge: true });
}

// Also scrubs the module's lesson ids out of every user's completedLessonIds -
// without this a student's completion percentage can exceed 100% once the
// denominator shrinks. Same fix as lib/programming.js's deleteLanguage.
export async function deleteModule(moduleId) {
  const lessonsSnap = await getDocs(collection(db, "seModules", moduleId, "lessons"));
  await scrubCompletedLessonIds(lessonsSnap.docs.map(d => d.id));
  const refs = [...lessonsSnap.docs.map(d => d.ref), doc(db, "seModules", moduleId)];
  await commitInChunks(refs.map(ref => ({ op: "delete", ref })));
}

// 450 ops/batch - Firestore's cap is 500, and the progress-doc sweep below can
// exceed one batch on its own once the course has real enrolment.
async function commitInChunks(ops) {
  for (let i = 0; i < ops.length; i += 450) {
    const batch = writeBatch(db);
    for (const { op, ref, data } of ops.slice(i, i + 450)) {
      if (op === "delete") batch.delete(ref);
      else if (op === "set") batch.set(ref, data, { merge: true });
      else batch.update(ref, data);
    }
    await batch.commit();
  }
}

// Unlike the per-(uid,paper) progress docs in GATE, this course has ONE progress
// doc per user, so a cleanup sweep has to scan the collection. That is an
// admin-only operation (see firestore.rules) and runs only on a destructive
// content edit, which is rare - the alternative, leaving orphaned lesson ids in
// every learner's array, is a permanent correctness bug in exchange.
async function scrubCompletedLessonIds(lessonIds) {
  if (lessonIds.length === 0) return;
  const snap = await getDocs(collection(db, "se_progress"));
  const ops = [];
  for (const d of snap.docs) {
    const done = d.data().completedLessonIds || [];
    const hits = lessonIds.filter(id => done.includes(id));
    if (hits.length) ops.push({ op: "update", ref: d.ref, data: { completedLessonIds: arrayRemove(...hits) } });
  }
  await commitInChunks(ops);
}

// ---------------- lessons ----------------

export async function fetchLessons(moduleId, { includeUnpublished = false } = {}) {
  const col = collection(db, "seModules", moduleId, "lessons");
  const snap = await getDocs(includeUnpublished ? col : query(col, where("status", "==", "published"), where("audiences", "array-contains-any", currentAudiences())));
  return snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (a.order || 0) - (b.order || 0));
}

export async function fetchLesson(moduleId, lessonId) {
  const snap = await getDoc(doc(db, "seModules", moduleId, "lessons", lessonId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function saveLesson(moduleId, lessonId, data) {
  const ref = doc(db, "seModules", moduleId, "lessons", lessonId);
  const existing = (await getDoc(ref)).data();
  await setDoc(ref, {
    updatedAt: serverTimestamp(),
    ...withVersionSnapshot(existing),
    ...data,
  }, { merge: true });
}

export async function deleteLesson(moduleId, lessonId) {
  await scrubCompletedLessonIds([lessonId]);
  await deleteDoc(doc(db, "seModules", moduleId, "lessons", lessonId));
}

// The whole course tree in one pass - modules each carrying their lessons.
// Sequential per-module queries are unavoidable (a collectionGroup on "lessons"
// would collide with nothing today but is a name this codebase has already been
// burned by, see lib/contests.js's fetchRecentAnnouncements), but they run in
// parallel and the tree is small and cached in component state for the session.
export async function fetchCourseTree({ includeUnpublished = false } = {}) {
  const modules = await fetchModules({ includeUnpublished });
  const lessonLists = await Promise.all(
    modules.map(m => fetchLessons(m.id, { includeUnpublished }).catch(() => []))
  );
  return modules.map((m, i) => ({ ...m, lessons: lessonLists[i] }));
}

// A lesson counts as authored once it has the one section that cannot be
// skipped. Everything else in LESSON_SECTIONS is genuinely optional, so a
// stricter test would mark perfectly good short lessons as empty.
export function lessonHasContent(lesson) {
  return !!(lesson?.concept?.trim() || lesson?.story?.trim());
}

// Which of the fifteen authored sections this lesson actually has. Drives the
// reader's section rail and the CMS's completeness indicator, so both agree.
export function authoredSections(lesson) {
  return LESSON_SECTIONS.filter(s => {
    const v = lesson?.[s.key];
    if (v == null) return false;
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === "object") return Object.keys(v).length > 0 && !isEmptyCustom(s.key, v);
    return String(v).trim().length > 0;
  });
}

function isEmptyCustom(key, v) {
  if (key === "codeExample") return !v.code?.trim();
  if (key === "lab") return !v.title?.trim() && !v.brief?.trim();
  if (key === "assignment") return !Object.values(v).some(x => String(x || "").trim());
  return false;
}

// ---------------- video (architecture present, playback gated) ----------------

// Video is fully modelled now and deliberately not playable yet: the YouTube
// series does not exist, and a lesson that renders an empty player or a dead
// embed is worse than one that honestly says the video is coming. Every field a
// real video needs is already here, so publishing later is a data change and not
// a schema change.
//
// `status` is the only gate. "coming-soon" renders the placeholder; "published"
// renders the player. Nothing else in the reader needs to change.
export const VIDEO_STATUSES = ["coming-soon", "published", "hidden"];

export function blankVideo() {
  return {
    status: "coming-soon",
    provider: "youtube",   // youtube | self-hosted
    youtubeId: "",
    url: "",
    durationSeconds: null,
    chapters: [],          // [{ label, atSeconds }]
    transcript: "",
    notesUrl: "",
  };
}

export function videoState(lesson) {
  const v = lesson?.video;
  if (!v || v.status === "hidden") return { show: false };
  if (v.status === "published" && (v.youtubeId || v.url)) {
    return { show: true, playable: true, video: v };
  }
  // Authored as published but with nothing to play - treated as coming soon
  // rather than rendering a broken embed.
  return { show: true, playable: false, video: v || blankVideo() };
}

// ---------------- per-user progress ----------------

// ONE document per user, because this is a single course rather than a set of
// papers. Read by known id so the rule can key off the doc id and stay
// list()-free (see lib/gate.js's fetchProgress for why a field-filtered list
// against a path-segment rule is denied).
export async function fetchProgress(uid) {
  const snap = await getDoc(doc(db, "se_progress", uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function markLessonOpened(uid, moduleId, lessonId) {
  await setDoc(doc(db, "se_progress", uid), {
    uid,
    lastOpenedModuleId: moduleId,
    lastOpenedLessonId: lessonId,
    lastOpenedAt: serverTimestamp(),
    startedAt: serverTimestamp(),
  }, { merge: true });
}

// Knowledge-check results, stored per lesson as a dotted field path so two
// lessons answered in quick succession cannot clobber each other's entry, and a
// merge never replaces the whole map. Not reward-bearing on its own - the reward
// is attached to lesson completion below.
export async function recordKnowledgeCheck({ uid, lessonId, correct, total }) {
  await setDoc(doc(db, "se_progress", uid), {
    uid,
    [`checks.${lessonId}`]: { correct, total, at: new Date().toISOString() },
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function toggleLabDone({ uid, lessonId, done }) {
  await setDoc(doc(db, "se_progress", uid), {
    uid,
    labsCompleted: done ? arrayUnion(lessonId) : arrayRemove(lessonId),
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function saveLessonNote({ uid, lessonId, text }) {
  await setDoc(doc(db, "se_progress", uid), {
    uid,
    [`notes.${lessonId}`]: (text || "").slice(0, 4000),
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function toggleBookmark({ uid, lessonId, on }) {
  await setDoc(doc(db, "se_progress", uid), {
    uid,
    bookmarkedLessonIds: on ? arrayUnion(lessonId) : arrayRemove(lessonId),
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

// Mirrors lib/csCore.js's completeTopic: same self-reported-completion trust
// boundary, same shared grantRewards() split, and the idempotency check wrapped
// in a transaction rather than a get()-then-set() - two near-simultaneous
// completions would otherwise both read "not yet completed" and double-award.
export async function completeLesson({ uid, moduleId, lessonId, xpReward = 0, coinReward = 0 }) {
  const ref = doc(db, "se_progress", uid);
  let alreadyCompleted;

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const existing = snap.exists() ? snap.data() : null;
    alreadyCompleted = !!existing?.completedLessonIds?.includes(lessonId);

    tx.set(ref, {
      uid,
      completedLessonIds: arrayUnion(lessonId),
      lastOpenedModuleId: moduleId,
      lastOpenedLessonId: lessonId,
      lastCompletedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });

    // Inside the same transaction as the completion flag - see
    // lib/dailyLearning.js's submitDayCompletion for why granting after commit
    // could permanently strand the reward.
    if (!alreadyCompleted) {
      grantRewards(uid, {
        xpReward, coinReward, scoreReward: xpReward,
        transactionType: "se_lesson_completed",
        activityType: "se_lesson", activityId: lessonId, sourceModule: "softwareEngineering",
      }, tx);
    }
  });

  return !alreadyCompleted;
}

// ---------------- derived progress ----------------

// One place deriving every completion figure, so the overview, the module cards,
// the roadmap and the lesson footer can never disagree. Percentages count
// PUBLISHED lessons only - a draft nobody can open must not count against a
// learner.
export function computeProgress(tree, progress) {
  const done = new Set(progress?.completedLessonIds || []);
  const modules = (tree || []).map(m => {
    const total = m.lessons.length;
    const completed = m.lessons.filter(l => done.has(l.id)).length;
    return {
      moduleId: m.id, title: m.title, number: m.number,
      total, completed,
      pct: total > 0 ? Math.round((completed / total) * 100) : 0,
      // A module is unlocked when the previous one is finished, but this is
      // ADVISORY only - see nextLesson below. Nothing is actually blocked.
      isComplete: total > 0 && completed === total,
    };
  });
  const total = modules.reduce((n, m) => n + m.total, 0);
  const completed = modules.reduce((n, m) => n + m.completed, 0);
  return {
    modules, total, completed,
    pct: total > 0 ? Math.round((completed / total) * 100) : 0,
    labsCompleted: (progress?.labsCompleted || []).length,
    checksTaken: Object.keys(progress?.checks || {}).length,
  };
}

// Deliberately NO sequential lock. The existing /learn Learning Paths gate each
// task on the previous one, which suits a short guided path; this is a 60-lesson
// reference course, and a learner who already knows HTTP should be able to jump
// straight to Authentication. The roadmap shows recommended order and marks what
// is done - it does not forbid anything.
export function nextLesson(tree, progress) {
  const done = new Set(progress?.completedLessonIds || []);
  for (const m of tree || []) {
    const lesson = m.lessons.find(l => !done.has(l.id) && lessonHasContent(l));
    if (lesson) return { moduleId: m.id, moduleTitle: m.title, moduleNumber: m.number, lesson };
  }
  return null;
}

export function resumePoint(tree, progress) {
  if (!progress?.lastOpenedLessonId) return null;
  for (const m of tree || []) {
    const lesson = m.lessons.find(l => l.id === progress.lastOpenedLessonId);
    if (lesson) return { moduleId: m.id, moduleTitle: m.title, moduleNumber: m.number, lesson };
  }
  return null;
}

// Flat, ordered lesson list across the whole course - powers prev/next
// navigation inside the reader and the search index.
export function flattenLessons(tree) {
  const out = [];
  for (const m of tree || []) {
    for (const l of m.lessons) {
      out.push({ ...l, moduleId: m.id, moduleTitle: m.title, moduleNumber: m.number });
    }
  }
  return out;
}

export function lessonNeighbours(tree, lessonId) {
  const flat = flattenLessons(tree);
  const i = flat.findIndex(l => l.id === lessonId);
  if (i === -1) return { prev: null, next: null, index: -1, total: flat.length };
  return { prev: flat[i - 1] || null, next: flat[i + 1] || null, index: i, total: flat.length };
}

// ---------------- search ----------------

// Client-side over the already-loaded tree. Firestore has no substring matching
// and an external index is disproportionate for a course of this size - the
// whole tree is in memory the moment the course opens. Searches titles,
// summaries, objectives and concept bodies, so looking for "DNS" finds a lesson
// that never says DNS in its title.
export function searchLessons(tree, term) {
  const q = (term || "").trim().toLowerCase();
  if (!q) return [];
  const out = [];
  for (const l of flattenLessons(tree)) {
    const haystack = [
      l.title, l.subtitle, l.summary, l.story, l.concept, l.problemStatement,
      ...(l.learningObjectives || []), ...(l.tags || []),
    ].filter(Boolean).join(" ").toLowerCase();
    if (!haystack.includes(q)) continue;
    // A title match is worth far more than a body match, so results are ranked
    // rather than returned in tree order.
    const score = (l.title || "").toLowerCase().includes(q) ? 0
      : (l.summary || "").toLowerCase().includes(q) ? 1 : 2;
    out.push({ lesson: l, score });
  }
  return out.sort((a, b) => a.score - b.score).map(r => r.lesson);
}
