// Roadmaps module - a GLOBAL, role/career-based catalog of learning paths
// (roadmaps/{roadmapId}/modules/{moduleId}/topics/{topicId}) and per-user
// progress against it.
//
// One global catalog, deliberately NOT institution-scoped - every DeVert
// Campus user sees the identical set of roadmaps and identical content,
// confirmed explicitly rather than assumed. Contrast Daily Learning
// (institutions/{slug}/dailyLearning), the one genuinely per-institution
// content system on this platform. Roadmaps are role/career-based (e.g.
// "ML Engineer", "AI Scientist", "VLSI Engineer", "Cybersecurity Engineer"),
// not bare subject names - a subject like "Java" or "Python" already lives
// in the separate Programming module.
//
// Levels (Beginner/Intermediate/Advanced) are a FIELD on the module doc
// (`level`), not a fourth subcollection tier - see ROADMAP_LEVELS below.
// There are always exactly three, they're never independently published,
// and they're ADVISORY ONLY (never locked - see isTopicUnlocked, always
// true). That makes a level a grouping attribute, exactly like this
// module's own `module` string field on GATE's topics (groupModulesByLevel
// below is modeled directly on lib/gate.js's groupTopicsByModule) - not a
// real hierarchy tier. Reclassifying a module between levels is therefore a
// one-field edit, not a document move that would orphan every student's
// completedTopicIds for it.
//
// Everything else follows the conventions every other global catalog here
// already established, for the same hard-won reasons documented there:
//   - Published content is world-readable, drafts are admin-only - see
//     firestore.rules' contentReadable()/isAdmin().
//   - Every non-admin list() MUST carry where("status","==","published")
//     AND where("audiences","array-contains-any", currentAudiences()) - see
//     lib/programming.js's fetchLanguages comment. An unfiltered query plus
//     client-side filtering is DENIED outright for a real student, not
//     merely slower.
//   - orderBy is done client-side so filter+sort never needs a composite
//     index.
//   - Per-user progress is read with getDoc() by known id, never a
//     where("uid","==",uid) list() - ownership is proven from the wildcard
//     PATH SEGMENT in the doc id, which Firestore's rules engine cannot
//     statically relate to a field-filtered query. This exact mistake
//     shipped silently for months elsewhere in this app as a permanent
//     "0/X" progress display - see lib/programming.js's
//     fetchAllUserProgress for the full story.
//   - Reward-bearing completion is transaction-wrapped and idempotent, and
//     grants through the one shared grantRewards() ledger; bumpStreak()
//     runs AFTER that transaction resolves, never inside it (see
//     lib/rewards.js's bumpStreak header - nesting it inside a retried
//     transaction callback would over-increment the streak once per retry).
import { db } from "@/lib/firebase";
import { currentAudiences, AUDIENCE_PUBLIC, AUDIENCE_LEGACY } from "@/lib/audiences";
import { withVersionSnapshot } from "@/lib/contentVersioning";
import {
  collection, doc, getDoc, getDocs, setDoc, deleteDoc, query, where,
  serverTimestamp, writeBatch, arrayUnion, arrayRemove, runTransaction,
} from "firebase/firestore";
import { grantRewards, bumpStreak } from "@/lib/rewards";

export const ROADMAP_DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"];

export const ROADMAP_LEVELS = [
  { key: "beginner", label: "Beginner", order: 1 },
  { key: "intermediate", label: "Intermediate", order: 2 },
  { key: "advanced", label: "Advanced", order: 3 },
];

export const ROADMAP_RESOURCE_KINDS = ["doc", "link", "video", "course", "book", "repo", "tool", "cheatsheet"];

// Deliberately its own vocabulary, NOT unified with lib/gateLessonImport.js's
// RESOURCE_KINDS or components/admin/se-panel.jsx's list - those two have
// already drifted from each other (se-panel added "code", gate's didn't), so
// a shared list would have to be a superset, and narrowing it later would
// invalidate already-authored `kind` values in live content. Define
// independently and say so, rather than let a future reader assume unity.

// The 13-section contract driving BOTH the admin editor and the student
// reader off one shared array - mirrors lib/softwareEngineering.js's
// LESSON_SECTIONS, built specifically to prevent "the editor and the reader
// silently disagree about which fields exist" bugs (this exact class of bug
// already happened once for GATE's keyPoints field).
export const TOPIC_SECTIONS = [
  { key: "description", label: "What This Is", kind: "text" },
  { key: "whyItMatters", label: "Why It Matters", kind: "text" },
  { key: "prerequisiteTopicIds", label: "Prerequisites", kind: "custom" },
  { key: "keyConcepts", label: "Key Concepts", kind: "list" },
  { key: "concept", label: "How It Works", kind: "text" },
  { key: "tools", label: "Tools & Technologies", kind: "list" },
  { key: "practiceExercises", label: "Practice", kind: "list" },
  { key: "projects", label: "Projects", kind: "custom" },
  { key: "commonMistakes", label: "Common Mistakes", kind: "list" },
  { key: "interviewRelevance", label: "In Interviews", kind: "text" },
  { key: "realWorldApplications", label: "Where This Is Used", kind: "list" },
  { key: "mcqs", label: "Knowledge Check", kind: "custom" },
  { key: "resources", label: "Resources", kind: "custom" },
];
export const TOPIC_SECTION_KEYS = TOPIC_SECTIONS.map((s) => s.key);

export function authoredTopicSections(topic) {
  return TOPIC_SECTIONS.filter((s) => {
    const v = topic?.[s.key];
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === "string") return v.trim().length > 0;
    return !!v;
  });
}

export function topicHasContent(topic) {
  return !!(topic?.description?.trim() || topic?.concept?.trim());
}

// Roadmaps migrated from the old Intel lib/roadmaps.js (see
// scripts/export-legacy-roadmaps.mjs) are flagged "migrated-shell" rather
// than "authored" - a single-topic module with none of the 13 TOPIC_SECTIONS
// filled in is thinner than this content model, and shipping that as fully
// "authored" would hide the real gap. Drives a visible "needs real
// authoring" badge in the admin catalog list.
export const AUTHORING_STATUSES = ["authored", "migrated-shell"];

function defaultAudiences() {
  return [AUDIENCE_PUBLIC, AUDIENCE_LEGACY];
}

// ---------------- roadmaps ----------------

export async function fetchRoadmaps({ includeUnpublished = false } = {}) {
  const col = collection(db, "roadmaps");
  const snap = await getDocs(includeUnpublished
    ? col
    : query(col, where("status", "==", "published"), where("audiences", "array-contains-any", currentAudiences())));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (a.order || 0) - (b.order || 0));
}

export async function fetchRoadmap(roadmapId) {
  const snap = await getDoc(doc(db, "roadmaps", roadmapId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// Slug -> id resolution happens against the already-fetched small catalog
// list (10-20 docs at MVP scale), never a where("slug","==",...) query -
// that would need a new composite index and contradicts this codebase's
// client-side-filter convention for small catalogs. Slug uniqueness is
// therefore advisory, not enforced; lowest `order` wins a collision so a
// duplicate slug degrades to "reaches the wrong one of two roadmaps," never
// a blank screen.
export async function fetchRoadmapBySlug(slug, { includeUnpublished = false } = {}) {
  const all = await fetchRoadmaps({ includeUnpublished });
  return all.find((r) => r.slug === slug) || null;
}

// Creates with a Firestore auto-ID, never a slugified title - a deliberate
// break from every other catalog module's `title.toLowerCase().replace(...)`
// scheme, which silently collides two similarly-titled roadmaps (a second
// setDoc with merge:true just overwrites the first) and breaks on rename.
// `slug` is a separate, freely-editable field used only for the URL.
//
// audiences defaults to [public, legacy] ON CREATE ONLY, never overwritten
// on a later update (see saveRoadmap) - contentReadable() requires a
// non-empty audiences array or the document is invisible to every
// non-admin, and nothing else in this codebase's admin panels has ever set
// this field on its own (only a one-off backfill script has). Silently
// shipping that same gap here would mean a newly-created, newly-published
// roadmap is invisible to every student with no error anywhere.
export async function createRoadmap(data) {
  const ref = doc(collection(db, "roadmaps"));
  await setDoc(ref, {
    status: "draft",
    authoringStatus: "authored",
    categories: [], tags: [],
    outcomes: [], careerRoles: [], resources: [],
    prerequisiteRoadmapIds: [],
    levels: {
      beginner: { summary: "", outcomes: [], estimatedWeeks: 0 },
      intermediate: { summary: "", outcomes: [], estimatedWeeks: 0 },
      advanced: { summary: "", outcomes: [], estimatedWeeks: 0 },
    },
    moduleCount: 0,
    topicCount: 0,
    levelTopicCounts: { beginner: 0, intermediate: 0, advanced: 0 },
    previousVersions: [],
    updatedAt: serverTimestamp(),
    ...data,
    audiences: data.audiences || defaultAudiences(),
  });
  return ref.id;
}

export async function saveRoadmap(roadmapId, data) {
  const ref = doc(db, "roadmaps", roadmapId);
  const existing = (await getDoc(ref)).data();
  await setDoc(ref, {
    updatedAt: serverTimestamp(),
    ...withVersionSnapshot(existing),
    ...data,
  }, { merge: true });
}

// Editing one level's authored copy MUST use a dotted field path, never a
// nested object literal - under merge:true a nested literal replaces the
// WHOLE `levels` map, wiping the other two levels. Identical trap to
// lib/gate.js's markTopicRevised for revisedAt/revisionCount.
export async function saveRoadmapLevel(roadmapId, levelKey, data) {
  const patch = {};
  for (const [k, v] of Object.entries(data)) patch[`levels.${levelKey}.${k}`] = v;
  await setDoc(doc(db, "roadmaps", roadmapId), { ...patch, updatedAt: serverTimestamp() }, { merge: true });
}

// Rewrites moduleCount/topicCount/levelTopicCounts from a live tree read -
// the denormalized counts are admin-write-only and WILL drift as
// non-developer admins add/remove content directly, so this is the explicit
// "Recount tree" repair action rather than a promise they never drift.
export async function recountRoadmap(roadmapId) {
  const tree = await fetchRoadmapTree(roadmapId, { includeUnpublished: true });
  const levelTopicCounts = { beginner: 0, intermediate: 0, advanced: 0 };
  let topicCount = 0;
  for (const m of tree) {
    const key = ROADMAP_LEVELS.some((l) => l.key === m.level) ? m.level : "beginner";
    levelTopicCounts[key] += m.topics.length;
    topicCount += m.topics.length;
  }
  await saveRoadmap(roadmapId, { moduleCount: tree.length, topicCount, levelTopicCounts });
}

export async function deleteRoadmap(roadmapId) {
  const modulesSnap = await getDocs(collection(db, "roadmaps", roadmapId, "modules"));
  const refs = [];
  for (const moduleDoc of modulesSnap.docs) {
    const topicsSnap = await getDocs(collection(db, "roadmaps", roadmapId, "modules", moduleDoc.id, "topics"));
    refs.push(...topicsSnap.docs.map((d) => d.ref), moduleDoc.ref);
  }
  const progressSnap = await getDocs(query(collection(db, "roadmap_progress"), where("roadmapId", "==", roadmapId)));
  refs.push(...progressSnap.docs.map((d) => d.ref), doc(db, "roadmaps", roadmapId));
  await commitInChunks(refs.map((ref) => ({ op: "delete", ref })));
}

// Chunked at 450 ops/batch (Firestore's cap is 500) - same convention every
// other catalog module here uses (lib/gate.js, lib/programming.js).
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
export { commitInChunks };

// ---------------- modules ----------------

export async function fetchModules(roadmapId, { includeUnpublished = false } = {}) {
  const col = collection(db, "roadmaps", roadmapId, "modules");
  const snap = await getDocs(includeUnpublished
    ? col
    : query(col, where("status", "==", "published"), where("audiences", "array-contains-any", currentAudiences())));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (a.order || 0) - (b.order || 0));
}

export async function fetchModule(roadmapId, moduleId) {
  const snap = await getDoc(doc(db, "roadmaps", roadmapId, "modules", moduleId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function createModule(roadmapId, data) {
  const ref = doc(collection(db, "roadmaps", roadmapId, "modules"));
  await setDoc(ref, {
    status: "draft",
    resources: [], projects: [], milestones: [],
    topicCount: 0,
    previousVersions: [],
    updatedAt: serverTimestamp(),
    ...data,
    audiences: data.audiences || defaultAudiences(),
  });
  return ref.id;
}

export async function saveModule(roadmapId, moduleId, data) {
  const ref = doc(db, "roadmaps", roadmapId, "modules", moduleId);
  const existing = (await getDoc(ref)).data();
  await setDoc(ref, {
    updatedAt: serverTimestamp(),
    ...withVersionSnapshot(existing),
    ...data,
  }, { merge: true });
}

// Also scrubs every deleted topicId out of every student's
// completedTopicIds AND startedTopicIds for this roadmap - without it, a
// student's displayed completion percentage could exceed 100% once the
// denominator shrinks. Same fix as lib/gate.js's deleteSubject/
// lib/csCore.js's deleteTopic.
export async function deleteModule(roadmapId, moduleId) {
  const topicsSnap = await getDocs(collection(db, "roadmaps", roadmapId, "modules", moduleId, "topics"));
  const topicIds = topicsSnap.docs.map((d) => d.id);
  await scrubTopicIds(roadmapId, topicIds);
  await commitInChunks([
    ...topicsSnap.docs.map((d) => ({ op: "delete", ref: d.ref })),
    { op: "delete", ref: doc(db, "roadmaps", roadmapId, "modules", moduleId) },
  ]);
}

async function scrubTopicIds(roadmapId, topicIds) {
  if (topicIds.length === 0) return;
  const progressSnap = await getDocs(query(collection(db, "roadmap_progress"), where("roadmapId", "==", roadmapId)));
  const ops = [];
  for (const d of progressSnap.docs) {
    const data = d.data();
    const completedHits = topicIds.filter((id) => (data.completedTopicIds || []).includes(id));
    const startedHits = topicIds.filter((id) => (data.startedTopicIds || []).includes(id));
    if (completedHits.length || startedHits.length) {
      const patch = {};
      if (completedHits.length) patch.completedTopicIds = arrayRemove(...completedHits);
      if (startedHits.length) patch.startedTopicIds = arrayRemove(...startedHits);
      ops.push({ op: "update", ref: d.ref, data: patch });
    }
  }
  await commitInChunks(ops);
}

// ---------------- topics ----------------

export async function fetchTopics(roadmapId, moduleId, { includeUnpublished = false } = {}) {
  const col = collection(db, "roadmaps", roadmapId, "modules", moduleId, "topics");
  const snap = await getDocs(includeUnpublished
    ? col
    : query(col, where("status", "==", "published"), where("audiences", "array-contains-any", currentAudiences())));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (a.order || 0) - (b.order || 0));
}

export async function fetchTopic(roadmapId, moduleId, topicId) {
  const snap = await getDoc(doc(db, "roadmaps", roadmapId, "modules", moduleId, "topics", topicId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function createTopic(roadmapId, moduleId, data) {
  const ref = doc(collection(db, "roadmaps", roadmapId, "modules", moduleId, "topics"));
  await setDoc(ref, {
    status: "draft",
    resources: [], projects: [], mcqs: [],
    keyConcepts: [], tools: [], practiceExercises: [], commonMistakes: [], realWorldApplications: [],
    prerequisiteTopicIds: [], prerequisiteRoadmapIds: [],
    languageVariants: {},
    previousVersions: [],
    updatedAt: serverTimestamp(),
    ...data,
    audiences: data.audiences || defaultAudiences(),
  });
  return ref.id;
}

export async function saveTopic(roadmapId, moduleId, topicId, data) {
  const ref = doc(db, "roadmaps", roadmapId, "modules", moduleId, "topics", topicId);
  const existing = (await getDoc(ref)).data();
  await setDoc(ref, {
    updatedAt: serverTimestamp(),
    ...withVersionSnapshot(existing),
    ...data,
  }, { merge: true });
}

export async function deleteTopic(roadmapId, moduleId, topicId) {
  await scrubTopicIds(roadmapId, [topicId]);
  await deleteDoc(doc(db, "roadmaps", roadmapId, "modules", moduleId, "topics", topicId));
}

// The whole roadmap tree in one pass - modules each carrying their own
// topics array. Per-module queries issued in PARALLEL (Firestore has no
// "all topics under this roadmap" read without a collectionGroup query, and
// a collectionGroup on `topics` would collide with programmingLanguages'/
// csCoreSubjects'/gatePapers' identically-named subcollections - never
// issue one). Small and static enough per session that callers cache it in
// component state.
export async function fetchRoadmapTree(roadmapId, { includeUnpublished = false } = {}) {
  const modules = await fetchModules(roadmapId, { includeUnpublished });
  const topicLists = await Promise.all(
    modules.map((m) => fetchTopics(roadmapId, m.id, { includeUnpublished }).catch(() => []))
  );
  return modules.map((m, i) => ({ ...m, topics: topicLists[i] }));
}

// Groups a roadmap's modules by their `level` field - the grouping-not-
// hierarchy choice this file's header explains. Preserves authored order
// within each level (via each module's own `order`) rather than sorting
// alphabetically. A module with an invalid/missing level falls back to
// "beginner" rather than being silently dropped.
export function groupModulesByLevel(modules) {
  const byLevel = { beginner: [], intermediate: [], advanced: [] };
  for (const m of modules || []) {
    const key = ROADMAP_LEVELS.some((l) => l.key === m.level) ? m.level : "beginner";
    byLevel[key].push(m);
  }
  return ROADMAP_LEVELS.map((l) => ({ ...l, modules: byLevel[l.key] }));
}

// Prerequisites are authored and stored, but the gate is a permanent no-op -
// every level is always open and every topic is always reachable, matching
// the confirmed "advisory ordering, never a lock" decision (Software
// Engineering's own no-sequential-lock choice, generalized here). Mirrors
// lib/dsaConcepts.js's isConceptUnlocked exactly, including the reasoning:
// re-enabling a real gate later is then a one-line revert, not a
// re-authoring pass.
export function isTopicUnlocked() {
  return true;
}

// The advisory "finish X first" copy for a topic's UI, even though nothing
// is actually locked. An unresolvable prerequisite id (a content typo, or a
// prerequisite topic since deleted) is silently dropped rather than listed
// as a permanent blocker - same reasoning as lib/dsaConcepts.js's
// missingPrerequisites: a content mistake must never become an unbreakable
// dead end.
export function missingPrerequisites(topic, completedTopicIds, knownTopicIds) {
  const completed = new Set(completedTopicIds || []);
  const known = new Set(knownTopicIds || []);
  return (topic?.prerequisiteTopicIds || []).filter((id) => known.has(id) && !completed.has(id));
}

// ---------------- per-user progress ----------------

export function roadmapProgressId(uid, roadmapId) { return `${uid}_${roadmapId}`; }

export async function fetchRoadmapProgress(uid, roadmapId) {
  const snap = await getDoc(doc(db, "roadmap_progress", roadmapProgressId(uid, roadmapId)));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// Per-roadmap getDoc() calls, NOT a where("uid","==",uid) list query - see
// this file's own header and lib/programming.js's fetchAllUserProgress for
// why such a query is denied outright even for the owner's own uid.
export async function fetchAllRoadmapProgress(uid, roadmaps) {
  const list = roadmaps || (await fetchRoadmaps());
  const results = await Promise.all(list.map((r) => fetchRoadmapProgress(uid, r.id).catch(() => null)));
  return list.map((r, i) => results[i]).filter(Boolean);
}

// A student's single "active" roadmap - the one the dashboard's daily-focus
// card (shown ALONGSIDE, never inside, the existing Daily Learning module -
// that module's own scheduling/streak system is untouched by this feature)
// resumes into. Lives on the progress doc, not users/{uid}, so pinning a
// new roadmap never touches the shared profile document half the platform
// listens to, and switching paths keeps independent progress for each
// roadmap. Mirrors lib/gate.js's setTargetPaper/resolveTargetPaper exactly.
export async function setPinnedRoadmap(uid, roadmapId, allRoadmapIds = []) {
  const ops = allRoadmapIds
    .filter((id) => id !== roadmapId)
    .map((id) => ({ op: "set", ref: doc(db, "roadmap_progress", roadmapProgressId(uid, id)), data: { isPinned: false } }));
  await commitInChunks(ops);
  await setDoc(doc(db, "roadmap_progress", roadmapProgressId(uid, roadmapId)), {
    uid, roadmapId, isPinned: true, startedAt: serverTimestamp(),
  }, { merge: true });
}

export function resolvePinnedRoadmap(allProgress, roadmaps) {
  const flagged = allProgress.find((p) => p.isPinned);
  if (flagged) return roadmaps.find((r) => r.id === flagged.roadmapId) || null;
  const recent = [...allProgress].sort((a, b) => (b.lastOpenedAt?.seconds || 0) - (a.lastOpenedAt?.seconds || 0))[0];
  return (recent && roadmaps.find((r) => r.id === recent.roadmapId)) || null;
}

// Exposed for lib/quizAttempts.js's submitQuizAttempt, so the completion
// write happens inside the same transaction that grades the quiz - see the
// identical pair in lib/gate.js (gateProgressRef/gateCompletionPayload) for
// the reasoning: granting the reward as a separate call after commit could
// permanently strand it if the connection drops in between.
export function roadmapProgressRef(uid, roadmapId) {
  return doc(db, "roadmap_progress", roadmapProgressId(uid, roadmapId));
}

export function roadmapCompletionPayload(uid, roadmapId, level, moduleId, topicId) {
  return {
    uid, roadmapId,
    completedTopicIds: arrayUnion(topicId),
    startedTopicIds: arrayUnion(topicId),
    lastOpenedLevel: level,
    lastOpenedModuleId: moduleId,
    lastOpenedTopicId: topicId,
    lastOpenedAt: serverTimestamp(),
    lastCompletedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

export async function markRoadmapTopicOpened(uid, roadmapId, level, moduleId, topicId) {
  await setDoc(doc(db, "roadmap_progress", roadmapProgressId(uid, roadmapId)), {
    uid, roadmapId,
    startedTopicIds: arrayUnion(topicId),
    lastOpenedLevel: level,
    lastOpenedModuleId: moduleId,
    lastOpenedTopicId: topicId,
    lastOpenedAt: serverTimestamp(),
    startedAt: serverTimestamp(),
  }, { merge: true });
}

// Mirrors lib/csCore.js's completeTopic / lib/gate.js's completeTopic
// exactly - same self-reported-completion trust boundary, same shared
// grantRewards() split (xp/coins/score), same transaction-wrapped
// idempotency check rather than a plain get()-then-set() (which lets two
// near-simultaneous completions both read "not yet completed" before
// either write lands, double-awarding the reward - Firestore retries this
// callback when the doc changes underneath it, so the loser of the race
// re-reads an already-completed doc and earns nothing).
export async function completeRoadmapTopic({ uid, roadmapId, level, moduleId, topicId, xpReward = 0, coinReward = 0 }) {
  const ref = roadmapProgressRef(uid, roadmapId);
  let alreadyCompleted;

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    alreadyCompleted = !!(snap.exists() ? snap.data() : null)?.completedTopicIds?.includes(topicId);
    tx.set(ref, roadmapCompletionPayload(uid, roadmapId, level, moduleId, topicId), { merge: true });
    if (!alreadyCompleted) {
      grantRewards(uid, {
        xpReward, coinReward, scoreReward: xpReward,
        transactionType: "roadmap_topic_completed",
        activityType: "roadmap_topic",
        // Byte-identical activityId to the quiz path (submitQuizAttempt's
        // scopeId) - what makes the create-only reward_grants ledger a
        // cross-path backstop: a topic that later gains a quiz can never
        // pay twice for the same completion.
        activityId: `${roadmapId}_${topicId}`,
        sourceModule: "roadmaps",
      }, tx);
    }
  });

  // See bumpStreak's own header (lib/rewards.js) for why this runs out
  // here, after the transaction has resolved, rather than inside it -
  // Firestore retries a contended transaction, and nesting a streak bump
  // inside a retried callback would over-increment it once per retry.
  await bumpStreak(uid);
  return !alreadyCompleted;
}

// ---------------- completion maths ----------------

// One place deriving every "X% done" figure, so the roadmap card, the level
// rail, the module list and the topic footer can never disagree. Percentages
// are of PUBLISHED topics only - a draft topic nobody can open must not
// count against a student. Level and roadmap percentages are computed by
// SUMMING topic counts, never averaging module percentages - averaging
// would weight a 2-topic module equally with a 20-topic one (same reasoning
// as lib/gate.js's computeCompletion).
export function computeRoadmapCompletion(tree, progress) {
  const done = new Set(progress?.completedTopicIds || []);
  const started = new Set(progress?.startedTopicIds || []);

  const modules = (tree || []).map((m) => {
    const total = m.topics.length;
    const completed = m.topics.filter((t) => done.has(t.id)).length;
    const inProgress = m.topics.filter((t) => !done.has(t.id) && started.has(t.id)).length;
    return {
      moduleId: m.id, title: m.title, level: m.level, order: m.order,
      total, completed, inProgress,
      pct: total > 0 ? Math.round((completed / total) * 100) : 0,
      isComplete: total > 0 && completed === total,
      // Milestone completion is DERIVED here and stored nowhere - reached
      // iff every required topic id is already in completedTopicIds. No
      // separate write path, no divergent second source of truth.
      milestones: (m.milestones || []).map((ms) => ({
        key: ms.key, label: ms.label, description: ms.description,
        reached: (ms.requiresTopicIds || []).length > 0 && (ms.requiresTopicIds || []).every((id) => done.has(id)),
      })),
    };
  });

  const levels = ROADMAP_LEVELS.map((lv) => {
    const mods = modules.filter((m) => m.level === lv.key);
    const total = mods.reduce((n, m) => n + m.total, 0);
    const completed = mods.reduce((n, m) => n + m.completed, 0);
    return {
      level: lv.key, label: lv.label, modules: mods, total, completed,
      pct: total > 0 ? Math.round((completed / total) * 100) : 0,
      isComplete: total > 0 && completed === total,
      // ADVISORY ONLY - always false, always present, so no consumer ever
      // has to ask whether locking exists. See isTopicUnlocked's header.
      locked: false,
    };
  });

  const total = levels.reduce((n, l) => n + l.total, 0);
  const completed = levels.reduce((n, l) => n + l.completed, 0);
  return {
    levels, modules, total, completed,
    inProgress: modules.reduce((n, m) => n + m.inProgress, 0),
    pct: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
}

// Topic status is DERIVED from two monotonic arrays, never a stored status
// map - a topicState:{[id]:"in-progress"} map would need dotted-path writes
// forever or risk the same merge:true whole-map-wipe trap the `levels` field
// above already avoids. "completed" wins over "started" when a topic is in
// both, which is always the correct read since completedTopicIds only ever
// grows (rules-guarded append-only).
export function topicStatus(topicId, progress) {
  if ((progress?.completedTopicIds || []).includes(topicId)) return "completed";
  if ((progress?.startedTopicIds || []).includes(topicId)) return "in-progress";
  return "not-started";
}

// "What should I do next" without any AI - the first incomplete topic in
// LEVEL order (Beginner before Intermediate before Advanced) inside the
// least-complete module that still has authored content. Deterministic,
// explainable, correct on day one with no attempt history. This is what the
// dashboard's "your roadmap" card (alongside Daily Learning) resumes into.
export function recommendNextTopic(tree, progress) {
  const completed = new Set(progress?.completedTopicIds || []);
  const byLevel = groupModulesByLevel(tree);
  for (const level of byLevel) {
    const candidates = level.modules
      .map((m) => {
        const next = m.topics.find((t) => !completed.has(t.id) && topicHasContent(t));
        if (!next) return null;
        const done = m.topics.filter((t) => completed.has(t.id)).length;
        return { module: m, topic: next, pct: m.topics.length ? done / m.topics.length : 0 };
      })
      .filter(Boolean);
    if (candidates.length === 0) continue;
    // Prefer a module already in progress over one never touched -
    // finishing what you started beats scattering across every module.
    const started = candidates.filter((c) => c.pct > 0);
    const pool = started.length ? started : candidates;
    pool.sort((a, b) => b.pct - a.pct);
    return { level: level.key, moduleId: pool[0].module.id, moduleTitle: pool[0].module.title, topic: pool[0].topic };
  }
  return null;
}
