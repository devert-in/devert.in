// Turns one row of the reward ledger into something an admin can actually read.
//
// THE PROBLEM THIS SOLVES: reward_grants stores only (activityType, activityId,
// xp, coins, score, grantedAt) - by design, since it is an immutable audit
// ledger and denormalising a lesson title into it would let the two drift. So
// the admin Reward Timeline could only ever render "gate_topic", which tells a
// principal nothing about what the student actually did, and nothing at all
// about whether they got the questions right.
//
// Both answers exist already, in two places the ledger deliberately does not
// duplicate:
//   - WHAT: the content document the activityId points at. Resolved here, on
//     demand, only when a row is expanded - never as part of the timeline list,
//     which would turn one screen into a hundred reads.
//   - HOW WELL: quiz_attempts/{uid}_{moduleKey}_{scopeId}, whose `history`
//     array holds correct / wrong / unanswered / pct / passed per attempt (see
//     lib/quizAttempts.js). firestore.rules already lets an institution admin,
//     HOD or faculty read their own students' attempts, so this needs no rules
//     change.
import { db } from "@/lib/firebase";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { fetchAttempt } from "@/lib/quizAttempts";

// activityType (what the ledger records) -> moduleKey (what quiz_attempts is
// keyed by). The inverse of REWARD_POLICY.modules[*].activity in
// lib/rewardPolicy.js - if a module is added there, add it here too or its
// rewards will render without their quiz result.
export const ACTIVITY_MODULE = {
  cscore_topic: "cscore",
  gate_topic: "gate",
  programming_topic: "programming",
  se_topic: "softwareEngineering",
  dsa_concept: "dsaConcepts",
  aptitude_topic: "aptitude",
};

// Human labels for every activityType the ledger can hold. ACTIVITY_LABELS in
// lib/campusDashboard.js covers only some of them and falls through to the raw
// key for the rest - which is exactly why "gate_topic" was showing up in the UI.
export const ACTIVITY_TITLES = {
  cscore_topic: "CS Core topic",
  gate_topic: "GATE topic",
  gate_day: "GATE daily goal",
  programming_topic: "Programming topic",
  se_topic: "Fundamentals topic",
  se_lesson: "Fundamentals lesson",
  dsa_concept: "DSA concept",
  aptitude_topic: "Aptitude topic",
  daily_learning_day: "Daily Learning day",
  daily_learning_problem: "Daily Learning problem",
  codelab_problem: "DSA problem",
  contest: "Contest",
  arena_match: "Arena challenge",
  learning_task: "Learning task",
  admin_manual: "Manual admin adjustment",
  duplicate_reversal: "Duplicate reward correction",
};

export function activityTitle(activityType) {
  return ACTIVITY_TITLES[activityType] || activityType || "Activity";
}

// Composite activity ids are `${parentId}_${childId}`. Both halves are slugs
// that may themselves contain '_', so which underscore splits them is genuinely
// ambiguous - callers below therefore try the first-underscore reading, and fall
// back to the last-underscore one if that document does not exist, rather than
// guessing once and silently showing "unknown".
function splitCandidates(id) {
  const first = id.indexOf("_");
  const last = id.lastIndexOf("_");
  if (first < 0) return [];
  const out = [[id.slice(0, first), id.slice(first + 1)]];
  if (last !== first) out.push([id.slice(0, last), id.slice(last + 1)]);
  return out;
}

function pickName(data) {
  return data?.title || data?.name || data?.topicTitle || data?.label || null;
}

async function firstExisting(paths) {
  for (const { ref, parentRef } of paths) {
    const snap = await getDoc(ref).catch(() => null);
    if (snap?.exists()) {
      const parent = parentRef ? await getDoc(parentRef).catch(() => null) : null;
      return { name: pickName(snap.data()), context: parent?.exists() ? pickName(parent.data()) : null };
    }
  }
  return null;
}

// One two-level lookup: content/{parent}/{sub}/{child}, with the parent doc read
// too so the dialog can say "Arrays - Java" rather than just "Arrays".
async function resolveTwoLevel(rootCol, subCol, activityId) {
  const paths = splitCandidates(activityId).map(([parentId, childId]) => ({
    ref: doc(db, rootCol, parentId, subCol, childId),
    parentRef: doc(db, rootCol, parentId),
  }));
  return firstExisting(paths);
}

// GATE topics sit one level deeper than their activityId records:
// gatePapers/{paperId}/subjects/{subjectId}/topics/{topicId}, but the ledger
// only stores `${paperId}_${topicId}`. The subject is therefore unknown, so this
// reads the paper's subject list (a short, cached-by-Firestore collection) and
// probes each one in parallel. Bounded by subject count, and only ever run when
// an admin actually expands a GATE row.
async function resolveGateTopic(activityId) {
  for (const [paperId, topicId] of splitCandidates(activityId)) {
    const subjects = await getDocs(collection(db, "gatePapers", paperId, "subjects")).catch(() => null);
    if (!subjects || subjects.empty) continue;
    const hits = await Promise.all(subjects.docs.map(async (s) => {
      const snap = await getDoc(doc(db, "gatePapers", paperId, "subjects", s.id, "topics", topicId)).catch(() => null);
      return snap?.exists() ? { name: pickName(snap.data()), context: pickName(s.data()) } : null;
    }));
    const found = hits.find(Boolean);
    if (found) return found;
  }
  return null;
}

async function resolveContent(activityType, activityId) {
  if (!activityId) return null;
  switch (activityType) {
    case "programming_topic": return resolveTwoLevel("programmingLanguages", "topics", activityId);
    case "cscore_topic":      return resolveTwoLevel("csCoreSubjects", "topics", activityId);
    case "dsa_concept":       return resolveTwoLevel("dsaConceptTracks", "concepts", activityId);
    case "gate_topic":        return resolveGateTopic(activityId);
    case "aptitude_topic": {
      const snap = await getDoc(doc(db, "aptitude_topics", activityId)).catch(() => null);
      return snap?.exists() ? { name: pickName(snap.data()), context: null } : null;
    }
    // se_lesson records only the lessonId, with no module to look it up under,
    // and Daily Learning ids are institution-scoped dates rather than content
    // refs - both fall through to the raw id, which is still more than the
    // timeline used to show.
    default: return null;
  }
}

// The whole payload behind one expanded timeline row. Content resolution and the
// quiz read run together - neither depends on the other, and a failure in either
// degrades that half only, so a missing lesson title never hides a quiz score.
export async function fetchRewardDetail(grant) {
  const moduleKey = ACTIVITY_MODULE[grant.activityType];
  const [content, attempt] = await Promise.all([
    resolveContent(grant.activityType, grant.activityId).catch(() => null),
    moduleKey && grant.uid
      ? fetchAttempt(grant.uid, moduleKey, grant.activityId).catch(() => null)
      : Promise.resolve(null),
  ]);

  // Newest attempt first - an admin asking "did they get it right" means the
  // most recent submission, with earlier tries as supporting history.
  const history = [...(attempt?.history || [])].reverse();

  return {
    kind: activityTitle(grant.activityType),
    name: content?.name || null,
    context: content?.context || null,
    // Shown when nothing resolved, so the row is still identifiable.
    rawId: grant.activityId || null,
    attempt: attempt
      ? {
          attempts: attempt.attempts || 0,
          passed: !!attempt.passed,
          rewarded: !!attempt.rewarded,
          lastSubmittedAt: attempt.lastSubmittedAt || null,
        }
      : null,
    history,
    // True when this activity type has no quiz behind it at all, so the UI can
    // say "no quiz for this activity" instead of "no data", which reads like a
    // loading failure.
    quizless: !moduleKey,
  };
}
