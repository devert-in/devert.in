// GATE preparation module - the paper/subject/topic catalog and per-user
// preparation state.
//
// Architecture is deliberately a THREE-level catalog
// (gatePapers/{paperId}/subjects/{subjectId}/topics/{topicId}) rather than the
// two-level shape lib/programming.js and lib/csCore.js use. That extra level is
// the entire reason this module scales to new GATE papers without a schema
// change: GATE CS, GATE DA, GATE EC and every future paper are sibling
// documents under `gatePapers`, each owning its own subject tree, its own
// previous-year questions, its own tests and its own per-user progress doc.
// Adding GATE ME later is authoring work in /admin, not a migration.
//
// Everything else follows the conventions the other global catalogs already
// established, and for the same hard-won reasons documented there:
//   - Published content is world-readable, drafts are admin-only, so
//     in-progress authoring never leaks (see firestore.rules).
//   - Every non-admin list() MUST carry where("status","==","published") or
//     Firestore denies the whole query - see lib/programming.js's
//     fetchLanguages comment. This is not a nicety; an unfiltered query plus
//     client-side filtering fails for every real student.
//   - orderBy is done client-side so filter+sort never needs a composite index.
//   - Per-user progress is read with getDoc() by known id, never a
//     where("uid","==",uid) list() - the rules here key off the wildcard path
//     segment, which Firestore cannot statically relate to a field filter.
//   - Reward-bearing completion is transaction-wrapped and idempotent, and
//     grants through the one shared grantRewards() ledger.
import { db } from "@/lib/firebase";
import { currentAudiences, AUDIENCE_PUBLIC, AUDIENCE_LEGACY } from "@/lib/audiences";
import { withVersionSnapshot } from "@/lib/contentVersioning";
import {
  collection, doc, getDoc, getDocs, setDoc, deleteDoc, query, where,
  serverTimestamp, writeBatch, arrayUnion, arrayRemove, runTransaction, increment,
} from "firebase/firestore";
import { grantRewards, bumpStreak } from "@/lib/rewards";

export const GATE_DIFFICULTIES = ["Easy", "Moderate", "Hard"];

// Same default as lib/roadmaps.js's defaultAudiences() - contentReadable()
// in firestore.rules requires a non-empty `audiences` array or the document
// is invisible to every reader with no error anywhere. Unlike roadmaps.js,
// this module has no separate createX/saveX split (paper/subject/topic ids
// are meaningful strings the caller picks, not Firestore auto-IDs), so
// savePaper/saveSubject/saveTopic below default this only when it's
// genuinely absent (a real create) and otherwise leave an existing value
// alone - same "never overwritten on a later update" intent, adapted to a
// single upsert function instead of two.
function defaultAudiences() {
  return [AUDIENCE_PUBLIC, AUDIENCE_LEGACY];
}

// The paper codes GATE itself uses, so a paper doc's id is the official code
// lowercased ("cs", "da", "cs-da"). Only the first three are authored today;
// the rest exist here purely so the admin's "new paper" dropdown offers the
// real GATE vocabulary instead of a free-text field that drifts. Nothing in
// this module treats the authored set as fixed - fetchPapers() returns
// whatever exists.
export const GATE_PAPER_CATALOG = [
  { code: "CS", name: "Computer Science & IT", id: "cs" },
  { code: "DA", name: "Data Science & AI", id: "da" },
  { code: "CS+DA", name: "CS + DA Combined", id: "cs-da" },
  { code: "EC", name: "Electronics & Communication", id: "ec" },
  { code: "EE", name: "Electrical Engineering", id: "ee" },
  { code: "ME", name: "Mechanical Engineering", id: "me" },
  { code: "CE", name: "Civil Engineering", id: "ce" },
  { code: "AI", name: "Artificial Intelligence", id: "ai" },
  { code: "ST", name: "Statistics", id: "st" },
  { code: "MA", name: "Mathematics", id: "ma" },
  { code: "IN", name: "Instrumentation Engineering", id: "in" },
  { code: "PH", name: "Physics", id: "ph" },
];

// ---------------- papers ----------------

export async function fetchPapers({ includeUnpublished = false } = {}) {
  const col = collection(db, "gatePapers");
  const snap = await getDocs(includeUnpublished ? col : query(col, where("status", "==", "published"), where("audiences", "array-contains-any", currentAudiences())));
  return snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (a.order || 0) - (b.order || 0));
}

export async function fetchPaper(paperId) {
  const snap = await getDoc(doc(db, "gatePapers", paperId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function savePaper(paperId, data) {
  const ref = doc(db, "gatePapers", paperId);
  const existing = (await getDoc(ref)).data();
  await setDoc(ref, {
    updatedAt: serverTimestamp(),
    ...data,
    audiences: data.audiences || existing?.audiences || defaultAudiences(),
  }, { merge: true });
}

// Deletes the paper, every subject and topic under it, and every student's
// progress doc for it - same orphan-cleanup reasoning as
// lib/programming.js's deleteLanguage, one level deeper. Deliberately does NOT
// touch gate_pyqs / gate_tests / gate_formulas: those are flat, paperId-tagged
// collections an admin manages (and can re-point) from their own panels, and
// silently destroying a year's worth of authored previous-year questions as a
// side effect of removing a paper shell would be the more destructive default.
// deletePaperContent() below is the explicit opt-in for that.
export async function deletePaper(paperId) {
  const subjectsSnap = await getDocs(collection(db, "gatePapers", paperId, "subjects"));
  const refs = [];
  for (const subjectDoc of subjectsSnap.docs) {
    const topicsSnap = await getDocs(collection(db, "gatePapers", paperId, "subjects", subjectDoc.id, "topics"));
    refs.push(...topicsSnap.docs.map(d => d.ref), subjectDoc.ref);
  }
  const progressSnap = await getDocs(query(collection(db, "gate_progress"), where("paperId", "==", paperId)));
  refs.push(...progressSnap.docs.map(d => d.ref), doc(db, "gatePapers", paperId));
  await commitInChunks(refs.map(ref => ({ op: "delete", ref })));
}

// The explicit "also remove this paper's question/test/formula/resource banks"
// action, kept separate from deletePaper so it can never happen by accident.
export async function deletePaperContent(paperId) {
  const cols = ["gate_pyqs", "gate_tests", "gate_formulas", "gate_resources"];
  for (const col of cols) {
    const snap = await getDocs(query(collection(db, col), where("paperId", "==", paperId)));
    // gate_tests carries questions/answerKeys subcollections that a parent
    // delete would orphan, so those are cleared first.
    if (col === "gate_tests") {
      for (const testDoc of snap.docs) {
        const [qSnap, akSnap] = await Promise.all([
          getDocs(collection(db, "gate_tests", testDoc.id, "questions")),
          getDocs(collection(db, "gate_tests", testDoc.id, "answerKeys")),
        ]);
        await commitInChunks([...qSnap.docs, ...akSnap.docs].map(d => ({ op: "delete", ref: d.ref })));
      }
    }
    await commitInChunks(snap.docs.map(d => ({ op: "delete", ref: d.ref })));
  }
}

// Chunked at 450 ops/batch (Firestore's cap is 500) - the same convention
// lib/programming.js uses, and necessary for the same reason: a popular
// paper's progress docs alone can exceed one batch even though its subject
// tree never would.
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

// ---------------- subjects ----------------

export async function fetchSubjects(paperId, { includeUnpublished = false } = {}) {
  const col = collection(db, "gatePapers", paperId, "subjects");
  const snap = await getDocs(includeUnpublished ? col : query(col, where("status", "==", "published"), where("audiences", "array-contains-any", currentAudiences())));
  return snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (a.order || 0) - (b.order || 0));
}

export async function fetchSubject(paperId, subjectId) {
  const snap = await getDoc(doc(db, "gatePapers", paperId, "subjects", subjectId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function saveSubject(paperId, subjectId, data) {
  const ref = doc(db, "gatePapers", paperId, "subjects", subjectId);
  const existing = (await getDoc(ref)).data();
  await setDoc(ref, {
    updatedAt: serverTimestamp(),
    ...data,
    audiences: data.audiences || existing?.audiences || defaultAudiences(),
  }, { merge: true });
}

// Also scrubs every deleted topicId out of every student's completedTopicIds
// for this paper - without it, a student's displayed completion could exceed
// 100% (the denominator just shrank while their completed array didn't). Same
// fix as lib/csCore.js's deleteTopic, applied at subject granularity because
// deleting a subject removes many topics at once.
export async function deleteSubject(paperId, subjectId) {
  const topicsSnap = await getDocs(collection(db, "gatePapers", paperId, "subjects", subjectId, "topics"));
  const topicIds = topicsSnap.docs.map(d => d.id);
  await scrubCompletedTopicIds(paperId, topicIds);
  await commitInChunks([
    ...topicsSnap.docs.map(d => ({ op: "delete", ref: d.ref })),
    { op: "delete", ref: doc(db, "gatePapers", paperId, "subjects", subjectId) },
  ]);
}

async function scrubCompletedTopicIds(paperId, topicIds) {
  if (topicIds.length === 0) return;
  const progressSnap = await getDocs(query(collection(db, "gate_progress"), where("paperId", "==", paperId)));
  const ops = [];
  for (const d of progressSnap.docs) {
    const completed = d.data().completedTopicIds || [];
    const hits = topicIds.filter(id => completed.includes(id));
    if (hits.length) ops.push({ op: "update", ref: d.ref, data: { completedTopicIds: arrayRemove(...hits) } });
  }
  await commitInChunks(ops);
}

// ---------------- topics ----------------

export async function fetchTopics(paperId, subjectId, { includeUnpublished = false } = {}) {
  const col = collection(db, "gatePapers", paperId, "subjects", subjectId, "topics");
  const snap = await getDocs(includeUnpublished ? col : query(col, where("status", "==", "published"), where("audiences", "array-contains-any", currentAudiences())));
  return snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (a.order || 0) - (b.order || 0));
}

export async function fetchTopic(paperId, subjectId, topicId) {
  const snap = await getDoc(doc(db, "gatePapers", paperId, "subjects", subjectId, "topics", topicId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function saveTopic(paperId, subjectId, topicId, data) {
  const ref = doc(db, "gatePapers", paperId, "subjects", subjectId, "topics", topicId);
  const existing = (await getDoc(ref)).data();
  await setDoc(ref, {
    updatedAt: serverTimestamp(),
    ...withVersionSnapshot(existing),
    ...data,
    audiences: data.audiences || existing?.audiences || defaultAudiences(),
  }, { merge: true });
}

export async function deleteTopic(paperId, subjectId, topicId) {
  await scrubCompletedTopicIds(paperId, [topicId]);
  await deleteDoc(doc(db, "gatePapers", paperId, "subjects", subjectId, "topics", topicId));
}

// The whole syllabus tree for a paper in one pass - subjects each carrying
// their own topics array. Used by the Syllabus screen, the Overview's
// completion maths, the Analytics screen and the revision engine, all of which
// need the full tree rather than one subject at a time. Sequential per-subject
// queries are unavoidable (Firestore has no "all topics under this paper" read
// without a collectionGroup query, and a collectionGroup on `topics` would
// collide with programmingLanguages'/csCoreSubjects' identically-named
// subcollections - the exact failure lib/contests.js's fetchRecentAnnouncements
// documents), but they're issued in parallel and the tree is small and static
// enough that callers cache it in component state for the session.
export async function fetchSyllabusTree(paperId, { includeUnpublished = false } = {}) {
  const subjects = await fetchSubjects(paperId, { includeUnpublished });
  const topicLists = await Promise.all(
    subjects.map(s => fetchTopics(paperId, s.id, { includeUnpublished }).catch(() => []))
  );
  return subjects.map((subject, i) => ({ ...subject, topics: topicLists[i] }));
}

// Groups a subject's topics by their `module` field (the official syllabus's
// own sub-heading, e.g. Engineering Mathematics -> "Discrete Mathematics"),
// preserving authored order rather than sorting alphabetically - the syllabus
// has a deliberate sequence and re-sorting it would misrepresent the document.
export function groupTopicsByModule(topics) {
  const groups = [];
  const seen = new Map();
  for (const t of topics || []) {
    const key = t.module || "General";
    if (!seen.has(key)) { seen.set(key, { module: key, topics: [] }); groups.push(seen.get(key)); }
    seen.get(key).topics.push(t);
  }
  return groups;
}

export function topicHasContent(topic) {
  return !!(topic?.concept?.trim() || topic?.keyPoints?.length || topic?.formulas?.length);
}

// ---------------- per-user progress ----------------

export function progressId(uid, paperId) { return `${uid}_${paperId}`; }

export async function fetchProgress(uid, paperId) {
  const snap = await getDoc(doc(db, "gate_progress", progressId(uid, paperId)));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// Per-paper getDoc() calls, NOT a where("uid","==",uid) list query - verified
// in the other modules that such a query is DENIED outright even for the
// owner's own uid, because firestore.rules here checks the wildcard path
// segment (progressId.split('_')[0]) and Firestore's rules engine has no way
// to statically relate that to a filter on the `uid` FIELD. See
// lib/programming.js's fetchAllUserProgress for the full story - it silently
// rendered every card as 0/X for months.
export async function fetchAllProgress(uid, papers) {
  const list = papers || await fetchPapers();
  const results = await Promise.all(list.map(p => fetchProgress(uid, p.id).catch(() => null)));
  return list.map((p, i) => results[i]).filter(Boolean);
}

// A student's chosen target paper lives on their progress doc for that paper
// (`isTarget`), not on users/{uid} - keeping it here means switching targets
// never touches the shared profile document that half the platform listens to,
// and a student preparing for two papers keeps independent state for each.
export async function setTargetPaper(uid, paperId, allPaperIds = []) {
  const ops = allPaperIds
    .filter(id => id !== paperId)
    .map(id => ({ op: "set", ref: doc(db, "gate_progress", progressId(uid, id)), data: { isTarget: false } }));
  await commitInChunks(ops);
  await setDoc(doc(db, "gate_progress", progressId(uid, paperId)), {
    uid, paperId, isTarget: true, targetSetAt: serverTimestamp(), startedAt: serverTimestamp(),
  }, { merge: true });
}

export function resolveTargetPaper(allProgress, papers) {
  const flagged = allProgress.find(p => p.isTarget);
  if (flagged) return papers.find(p => p.id === flagged.paperId) || null;
  // No explicit choice yet - fall back to whichever paper they've actually
  // opened most recently, then to the first published paper, so the module is
  // never a dead end for someone who skipped the picker.
  const recent = [...allProgress].sort((a, b) => (b.lastOpenedAt?.seconds || 0) - (a.lastOpenedAt?.seconds || 0))[0];
  return (recent && papers.find(p => p.id === recent.paperId)) || papers[0] || null;
}

// Exposed for lib/quizAttempts.js's submitQuizAttempt, so the completion write
// happens inside the same transaction that grades the quiz - see the identical
// pair in lib/csCore.js for the reasoning.
export function gateProgressRef(uid, paperId) {
  return doc(db, "gate_progress", progressId(uid, paperId));
}

export function gateCompletionPayload(uid, paperId, subjectId, topicId) {
  return {
    uid, paperId,
    completedTopicIds: arrayUnion(topicId),
    lastOpenedSubjectId: subjectId,
    lastOpenedTopicId: topicId,
    lastCompletedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

export async function markTopicOpened(uid, paperId, subjectId, topicId) {
  await setDoc(doc(db, "gate_progress", progressId(uid, paperId)), {
    uid, paperId,
    lastOpenedSubjectId: subjectId,
    lastOpenedTopicId: topicId,
    lastOpenedAt: serverTimestamp(),
    startedAt: serverTimestamp(),
  }, { merge: true });
}

// Mirrors lib/csCore.js's completeTopic exactly - same self-reported-completion
// trust boundary, same shared grantRewards() split (xp/coins/score), and the
// idempotency check wrapped in a transaction rather than a plain
// get()-then-set(): two near-simultaneous completions used to both read "not
// yet completed" before either write landed, double-awarding the reward.
// Firestore retries this callback when the progress doc changes underneath it,
// so the loser of the race re-reads an already-completed doc and earns nothing.
export async function completeTopic({ uid, paperId, subjectId, topicId, xpReward = 0, coinReward = 0 }) {
  const progressRef = doc(db, "gate_progress", progressId(uid, paperId));
  let alreadyCompleted;

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(progressRef);
    const existing = snap.exists() ? snap.data() : null;
    alreadyCompleted = !!existing?.completedTopicIds?.includes(topicId);

    tx.set(progressRef, {
      uid, paperId,
      completedTopicIds: arrayUnion(topicId),
      lastOpenedSubjectId: subjectId,
      lastOpenedTopicId: topicId,
      lastCompletedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });

    // Inside the same transaction as the completion flag - see
    // lib/dailyLearning.js's submitDayCompletion for why granting the reward
    // as a separate call after commit could permanently strand it.
    if (!alreadyCompleted) {
      grantRewards(uid, {
        xpReward, coinReward, scoreReward: xpReward, transactionType: "gate_topic_completed",
        activityType: "gate_topic", activityId: `${paperId}_${topicId}`, sourceModule: "gate",
      }, tx);
    }
  });

  // See bumpStreak's own header (lib/rewards.js) for why this runs out here,
  // after the transaction has resolved, rather than inside it.
  await bumpStreak(uid);
  return !alreadyCompleted;
}

// Marking a topic revised is deliberately NOT reward-bearing and deliberately
// NOT monotonic - unlike completion, revising the same topic again next month
// is the whole point, and each pass overwrites the timestamp the revision
// engine schedules from (see lib/gateRevision.js). Stored as two maps keyed by
// topicId (last-revised date, times-revised count) rather than arrays, so
// "when did I last revise X, and how often" is a single field read.
//
// Dotted field paths inside a merge:true setDoc, NOT nested object literals -
// see the `solvedProblems`/`languageUsage` fix in git history: a nested literal
// under merge:true replaces the whole map, wiping every other topic's revision
// record. A dotted key updates exactly one entry. increment() is safe here
// because a revision has no reward attached, so a lost or doubled count costs
// nothing but a slightly-off statistic.
export async function markTopicRevised(uid, paperId, topicId) {
  await setDoc(doc(db, "gate_progress", progressId(uid, paperId)), {
    uid, paperId,
    [`revisedAt.${topicId}`]: new Date().toISOString(),
    [`revisionCount.${topicId}`]: increment(1),
    lastRevisedAt: serverTimestamp(),
  }, { merge: true });
}

// ---------------- study time + streak ----------------

// Study minutes and the streak are derived from gate_daily docs (one per
// student per calendar day - see lib/gate.js's daily-plan helpers below), not
// from a wall-clock timer running in the browser: a tab left open overnight
// would otherwise report sixteen hours of studying. A day counts toward the
// streak only once its plan records real completed work.
export function dateKey(d = new Date()) {
  const IST = new Date(d.getTime() + 5.5 * 60 * 60 * 1000);
  return IST.toISOString().slice(0, 10);
}

export function dailyDocId(uid, paperId, date) { return `${uid}_${paperId}_${date}`; }

export async function fetchDailyPlan(uid, paperId, date = dateKey()) {
  const snap = await getDoc(doc(db, "gate_daily", dailyDocId(uid, paperId, date)));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// The last `days` days of daily docs, for the streak/heatmap/consistency graph.
// Explicit getDoc per date (bounded, at most ~120) rather than a range query,
// because gate_daily's rule keys off the uid embedded in the doc id - the same
// "list() is unprovable, get() by known id works" constraint as every other
// per-user collection here.
export async function fetchDailyHistory(uid, paperId, days = 90) {
  const dates = [];
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(dateKey(d));
  }
  const snaps = await Promise.all(dates.map(date =>
    getDoc(doc(db, "gate_daily", dailyDocId(uid, paperId, date))).catch(() => null)
  ));
  return dates
    .map((date, i) => (snaps[i]?.exists() ? { date, ...snaps[i].data() } : { date, empty: true }))
    .reverse();
}

// The six steps of a Daily GATE day, in the order the planner walks a student
// through them. Each is a boolean on the day doc's `steps` map; `allDone`
// gates the day-completion reward so the XP can't be banked by ticking one box.
export const DAILY_STEPS = [
  { key: "learn", label: "Learn a topic", detail: "Open today's recommended topic and read it end to end." },
  { key: "practice", label: "Practice questions", detail: "Attempt the topic's practice MCQs and numericals." },
  { key: "pyq", label: "Previous year questions", detail: "Solve the PYQs tagged to today's topic." },
  { key: "quiz", label: "Mini quiz", detail: "A short timed quiz to check retention." },
  { key: "revision", label: "Revision", detail: "Re-read one topic the revision engine says is due." },
  { key: "formula", label: "Formula revision", detail: "Skim the formula cards for today's subject." },
];

export async function toggleDailyStep(uid, paperId, date, stepKey, done) {
  await setDoc(doc(db, "gate_daily", dailyDocId(uid, paperId, date)), {
    uid, paperId, date,
    [`steps.${stepKey}`]: done,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function setDailyTopic(uid, paperId, date, subjectId, topicId) {
  await setDoc(doc(db, "gate_daily", dailyDocId(uid, paperId, date)), {
    uid, paperId, date, subjectId, topicId, updatedAt: serverTimestamp(),
  }, { merge: true });
}

export function isDayComplete(day) {
  return DAILY_STEPS.every(s => day?.steps?.[s.key]);
}

// Completing a full Daily GATE day is reward-bearing, so it needs the same
// transaction-wrapped idempotency as topic completion - and its own ledger
// activityId (the date) so yesterday's reward never blocks today's.
export async function completeDay({ uid, paperId, date, xpReward = 20, coinReward = 8 }) {
  const dayRef = doc(db, "gate_daily", dailyDocId(uid, paperId, date));
  let alreadyRewarded;

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(dayRef);
    const existing = snap.exists() ? snap.data() : null;
    alreadyRewarded = !!existing?.rewarded;
    // The steps themselves are the authority on whether the day is finishable -
    // re-read live inside the transaction rather than trusted from the caller's
    // stale render, so a client can't post "complete" for an empty day.
    if (!isDayComplete(existing)) { alreadyRewarded = true; return; }

    tx.set(dayRef, {
      uid, paperId, date, completed: true, rewarded: true,
      completedAt: serverTimestamp(),
    }, { merge: true });

    if (!alreadyRewarded) {
      grantRewards(uid, {
        xpReward, coinReward, scoreReward: xpReward, transactionType: "gate_day_completed",
        activityType: "gate_day", activityId: `${paperId}_${date}`, sourceModule: "gate",
      }, tx);
    }
  });

  // See bumpStreak's own header (lib/rewards.js) for why this runs out here,
  // after the transaction has resolved, rather than inside it.
  await bumpStreak(uid);
  return !alreadyRewarded;
}

// Consecutive days ending today (or yesterday, so a streak isn't "broken" at
// 00:01 before that day's first study session). `history` is
// fetchDailyHistory's oldest-first array.
export function computeStreak(history) {
  const done = new Set(history.filter(d => d.completed || isDayComplete(d)).map(d => d.date));
  let streak = 0;
  for (let i = 0; i < 400; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = dateKey(d);
    if (done.has(key)) streak++;
    else if (i === 0) continue; // today not finished yet - don't reset
    else break;
  }
  return streak;
}

// ---------------- completion maths ----------------

// One place deriving every "X% done" figure the module shows, so the Overview,
// the Syllabus tree, Analytics and the subject cards can never disagree about
// what completion means. Percentages are of PUBLISHED topics only - a draft
// topic nobody can open must not count against a student's progress.
export function computeCompletion(tree, progress) {
  const completed = new Set(progress?.completedTopicIds || []);
  const subjects = (tree || []).map(subject => {
    const total = subject.topics.length;
    const done = subject.topics.filter(t => completed.has(t.id)).length;
    return {
      subjectId: subject.id, name: subject.name, total, done,
      pct: total > 0 ? Math.round((done / total) * 100) : 0,
      weightageMarks: subject.weightageMarks || 0,
    };
  });
  const total = subjects.reduce((n, s) => n + s.total, 0);
  const done = subjects.reduce((n, s) => n + s.done, 0);
  return { subjects, total, done, pct: total > 0 ? Math.round((done / total) * 100) : 0 };
}

// Days until the exam, from the paper's own admin-set examDate. Returns null
// (not a negative number or a fabricated date) when no date is set, so the
// countdown card renders an honest "date not announced yet" instead of a
// misleading zero.
export function daysUntilExam(paper) {
  const raw = paper?.examDate;
  if (!raw) return null;
  const exam = typeof raw.toDate === "function" ? raw.toDate() : new Date(raw);
  if (Number.isNaN(exam.getTime())) return null;
  const diff = Math.ceil((exam.getTime() - Date.now()) / 86400000);
  return diff;
}

// "What should I study next" without any AI: the first incomplete topic in
// syllabus order inside the least-complete subject that still has authored
// content. Deterministic, explainable, and correct on day one with no attempt
// history - lib/gateRevision.js layers the performance-aware recommendations
// on top once a student has actually answered things.
export function recommendNextTopic(tree, progress) {
  const completed = new Set(progress?.completedTopicIds || []);
  const candidates = (tree || [])
    .map(subject => {
      const next = subject.topics.find(t => !completed.has(t.id) && topicHasContent(t));
      if (!next) return null;
      const done = subject.topics.filter(t => completed.has(t.id)).length;
      return { subject, topic: next, pct: subject.topics.length ? done / subject.topics.length : 0 };
    })
    .filter(Boolean);
  if (candidates.length === 0) return null;
  // Prefer a subject already in progress over one never touched - finishing
  // what you started beats scattering across ten subjects at 5% each.
  const started = candidates.filter(c => c.pct > 0);
  const pool = started.length ? started : candidates;
  pool.sort((a, b) => b.pct - a.pct);
  return { subjectId: pool[0].subject.id, subjectName: pool[0].subject.name, topic: pool[0].topic };
}
