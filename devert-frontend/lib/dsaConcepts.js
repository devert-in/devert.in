// DSA Concepts - the bridge module between Programming (language syntax) and
// DSA Practice (problems). A GLOBAL, admin-authored catalog, same authority
// shape as lib/programming.js's programmingLanguages/programming_progress:
// one curated concept roadmap PER LANGUAGE, authored once, shared by every
// institution. See firestore.rules' `dsaConceptTracks`/`dsa_concept_progress`
// blocks for the read/write authority this all defers to.
//
// WHY A SIBLING OF programming.js RATHER THAN A FORK OR A MERGE
// -------------------------------------------------------------
// The two are deliberately the same SHAPE but different collections.
// "Learn Java" and "Learn DSA in Java" are different curricula with different
// orderings, prerequisites and completion semantics, so folding DSA concepts
// into programmingLanguages/{langId}/topics would conflate two roadmaps in one
// ordered list. Keeping them separate also means this module can carry fields
// Programming has no use for (patternTriggers, commonMistakes, visualization,
// prerequisites) without widening Programming's own schema.
//
// They are, however, close enough that a future pass can collapse both onto
// one parameterised engine - exactly the way lib/dailyLearning.js's
// trackPaths(institutionId, trackId) already generalises ITS collections
// ("new track = configuration"). That refactor is deliberately NOT done here:
// it would touch every live Programming call site (and 293 students' worth of
// real progress data) for zero user-visible gain. When it happens, the seam is
// conceptPaths() below plus programming.js's own literal paths.
//
// CONCEPT -> PROBLEM LINKING
// --------------------------
// Deliberately NOT a new tag field duplicated onto every problem. A problem
// already carries `category` from lib/codelab.js's CODELAB_CATEGORIES, and
// those 22 categories already ARE the concept spine (Arrays, Sliding Window,
// Two Pointer, Hashing, Trees, Graphs, DP, ...). A concept therefore declares
// which categories it teaches (`problemCategories`) and the related-problems
// list is derived live from the existing published problem set - so a problem
// added to DSA Practice tomorrow shows up under its concept with no
// re-tagging, and there is exactly one source of truth for the mapping.
import { db } from "@/lib/firebase";
import { currentAudiences } from "@/lib/audiences";
import {
  collection, doc, getDoc, getDocs, setDoc, deleteDoc, query, where,
  serverTimestamp, writeBatch, arrayUnion, runTransaction,
} from "firebase/firestore";
import { grantRewards } from "@/lib/rewards";

// Mirrors lib/codelab.js's CODELAB_LANGUAGES ids exactly (java/python/cpp/
// javascript/c) so a learner's chosen concept language and the language they
// then solve the linked problem in are the same identifier end to end - and so
// Judge0 (whose LANGUAGE_IDS map is keyed on these same ids in
// devert-backend's Judge0Service) needs no translation layer.
function conceptPaths(langId) {
  return {
    track: ["dsaConceptTracks", langId],
    concepts: ["dsaConceptTracks", langId, "concepts"],
  };
}

// Same required-where-clause contract as programming.js's fetchLanguages: the
// non-admin read branch in firestore.rules checks resource.data.status, so a
// list() MUST carry a matching status filter or Firestore denies the whole
// query for every real student. Sorting by `order` happens in memory to avoid
// needing a composite index alongside the filters.
export async function fetchConceptTracks({ includeUnpublished = false } = {}) {
  const col = collection(db, "dsaConceptTracks");
  const snap = await getDocs(includeUnpublished
    ? col
    : query(col, where("status", "==", "published"), where("audiences", "array-contains-any", currentAudiences())));
  return snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (a.order || 0) - (b.order || 0));
}

export async function fetchConceptTrack(langId) {
  const snap = await getDoc(doc(db, ...conceptPaths(langId).track));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// BOTH filters are required, not just status: the concepts subcollection is
// gated by the same contentReadable() as the track above, and that predicate
// checks `audiences` as well - so a status-only query is denied outright for
// every non-admin (mirrors fetchTopics in lib/programming.js exactly). Every
// concept doc must therefore be authored WITH an `audiences` array, which
// scripts/seed-dsa-concepts.mjs does.
export async function fetchConcepts(langId, { includeUnpublished = false } = {}) {
  const col = collection(db, ...conceptPaths(langId).concepts);
  const snap = await getDocs(includeUnpublished
    ? col
    : query(col, where("status", "==", "published"), where("audiences", "array-contains-any", currentAudiences())));
  return snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (a.order || 0) - (b.order || 0));
}

export async function fetchConcept(langId, conceptId) {
  const snap = await getDoc(doc(db, ...conceptPaths(langId).concepts, conceptId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function saveConceptTrack(langId, data) {
  await setDoc(doc(db, ...conceptPaths(langId).track), { updatedAt: serverTimestamp(), ...data }, { merge: true });
}

export async function saveConcept(langId, conceptId, data) {
  await setDoc(doc(db, ...conceptPaths(langId).concepts, conceptId), { updatedAt: serverTimestamp(), ...data }, { merge: true });
}

// Mirrors programming.js's deleteTopic: also scrubs conceptId out of every
// learner's completedConceptIds, because fetchConceptSummary divides the
// completed count by the CURRENT concept total. Leaving a deleted concept in
// those arrays lets a displayed completion percentage exceed 100%. The rules'
// monotonicity guard only constrains the isOwner() branch, so an isAdmin()
// write may legitimately remove ids here.
export async function deleteConcept(langId, conceptId) {
  const progressSnap = await getDocs(query(collection(db, "dsa_concept_progress"), where("langId", "==", langId)));
  const stale = progressSnap.docs.filter(d => (d.data().completedConceptIds || []).includes(conceptId));
  // Chunked at 450 (Firestore's 500-op batch cap), same as deleteLanguage.
  for (let i = 0; i < stale.length; i += 450) {
    const batch = writeBatch(db);
    for (const d of stale.slice(i, i + 450)) {
      batch.set(d.ref, { completedConceptIds: (d.data().completedConceptIds || []).filter(id => id !== conceptId) }, { merge: true });
    }
    await batch.commit();
  }
  await deleteDoc(doc(db, ...conceptPaths(langId).concepts, conceptId));
}

// ---- prerequisite gating ---------------------------------------------------

// A concept unlocks once every id in its `prerequisites` array is completed.
// Evaluated client-side only: this is a pedagogical guardrail (don't drop
// someone into Dynamic Programming before Recursion), never a security
// boundary - the concept docs themselves are readable to anyone who can read
// the catalog, exactly like every other published lesson in this app. An empty
// or absent `prerequisites` means "always unlocked", so the first concept in a
// roadmap needs no special casing.
export function isConceptUnlocked(concept, completedIds) {
  const prereqs = concept?.prerequisites || [];
  if (prereqs.length === 0) return true;
  const done = new Set(completedIds || []);
  return prereqs.every(id => done.has(id));
}

// The concepts blocking `concept`, as full concept objects (for a "finish
// Recursion first" message that can name and link them, rather than printing
// raw ids at the learner).
export function missingPrerequisites(concept, allConcepts, completedIds) {
  const done = new Set(completedIds || []);
  const byId = new Map(allConcepts.map(c => [c.id, c]));
  return (concept?.prerequisites || [])
    .filter(id => !done.has(id))
    .map(id => byId.get(id) || { id, title: id });
}

// ---- progress -------------------------------------------------------------

// One doc per (uid, langId), id `${uid}_${langId}` - the same split('_')[0]
// convention firestore.rules relies on to prove ownership from the doc id
// alone (see programming_progress/cscore_progress/gate_progress).
function progressId(uid, langId) { return `${uid}_${langId}`; }

export async function fetchConceptProgress(uid, langId) {
  const snap = await getDoc(doc(db, "dsa_concept_progress", progressId(uid, langId)));
  return snap.exists() ? snap.data() : null;
}

// Per-language getDoc()s, NOT a where("uid","==",uid) list query - that query
// is denied outright, because the rule proves ownership from the doc ID's
// wildcard segment and Firestore's rules engine can't statically relate that
// to a filter on the `uid` FIELD. programming.js's fetchAllUserProgress
// documents this in full; it was a real, silently-swallowed platform bug there.
export async function fetchAllConceptProgress(uid) {
  const tracks = await fetchConceptTracks();
  const list = await Promise.all(tracks.map(t => fetchConceptProgress(uid, t.id)));
  return tracks
    .map((t, i) => list[i] ? { id: progressId(uid, t.id), langId: t.id, ...list[i] } : null)
    .filter(Boolean);
}

export async function markConceptOpened(uid, langId, conceptId) {
  await setDoc(doc(db, "dsa_concept_progress", progressId(uid, langId)), {
    uid, langId,
    lastOpenedConceptId: conceptId,
    lastOpenedAt: serverTimestamp(),
    startedAt: serverTimestamp(),
  }, { merge: true });
}

// Mirrors programming.js's completeTopic and dailyLearning.js's
// submitDayCompletion - the same self-reported-completion trust boundary, and
// the same reason the idempotency check lives INSIDE a transaction: two
// near-simultaneous completions (double-click, two tabs) would otherwise both
// read "not yet completed" before either write landed and double-award XP and
// coins. Coins convert to real INR, so this matters. Firestore retries the
// callback when the doc changes underneath it, so the loser of the race
// re-reads an already-completed doc and earns nothing.
//
// grantRewards is called with the SAME tx, not after commit - see
// submitDayCompletion's comment on why granting after commit can permanently
// strand a reward.
export async function completeConcept({ uid, langId, conceptId, xpReward = 0, coinReward = 0 }) {
  const ref = doc(db, "dsa_concept_progress", progressId(uid, langId));
  let alreadyCompleted;

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    alreadyCompleted = !!(snap.exists() ? snap.data() : null)?.completedConceptIds?.includes(conceptId);

    tx.set(ref, {
      uid, langId,
      completedConceptIds: arrayUnion(conceptId),
      lastOpenedConceptId: conceptId,
      lastCompletedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });

    if (!alreadyCompleted) {
      grantRewards(uid, {
        xpReward, coinReward, scoreReward: xpReward,
        transactionType: "dsa_concept_completed",
        activityType: "dsa_concept", activityId: `${langId}_${conceptId}`, sourceModule: "dsaConcepts",
      }, tx);
    }
  });

  return { alreadyCompleted };
}

// Landing-card figure: "7/24 concepts". Kept as a pure function of the two
// values the caller already holds so no card triggers its own extra reads.
export function conceptSummary(concepts, progress) {
  const total = concepts.length;
  const completed = (progress?.completedConceptIds || []).filter(id => concepts.some(c => c.id === id)).length;
  return { total, completed, percentComplete: total ? Math.round((completed / total) * 100) : 0 };
}

// ---- concept -> practice problems -----------------------------------------

// Derived live from the existing published problem set via `category`, never
// from a duplicated tag list on the concept - see this file's header. Returns
// problems grouped by difficulty, which is how the concept page renders them
// (Easy / Medium / Hard columns), and preserves each problem's own `number`
// ordering inside a group so the list matches DSA Practice's own ordering.
//
// `problems` is passed in rather than fetched here: the concept page already
// has the published problem list for its related-problems section, and
// fetchPublishedProblems() is a whole-collection read that should happen once
// per screen, not once per concept.
export function relatedProblemsForConcept(concept, problems) {
  const categories = new Set(concept?.problemCategories || []);
  if (categories.size === 0) return { Easy: [], Medium: [], Hard: [], total: 0 };

  const matched = (problems || [])
    .filter(p => categories.has(p.category))
    .sort((a, b) => (a.number || 0) - (b.number || 0));

  return {
    Easy: matched.filter(p => p.difficulty === "Easy"),
    Medium: matched.filter(p => p.difficulty === "Medium"),
    Hard: matched.filter(p => p.difficulty === "Hard"),
    total: matched.length,
  };
}

// The reverse direction: given a problem, which concepts teach it. Powers a
// "learn this concept first" link from a problem back into the roadmap, which
// is the half of the bridge that makes practice feel connected to learning
// rather than the other way round only.
export function conceptsForProblem(problem, concepts) {
  if (!problem?.category) return [];
  return (concepts || []).filter(c => (c.problemCategories || []).includes(problem.category));
}
