import { db } from "@/lib/firebase";
import {
  collection, collectionGroup, doc, getDocs, getDoc, setDoc, updateDoc, query, orderBy, where,
  limit, increment, serverTimestamp, getCountFromServer,
} from "firebase/firestore";

export const CONTEST_CATEGORIES = [
  "Aptitude & Reasoning", "Programming Fundamentals", "Java", "Python", "C++", "SQL",
  "DBMS", "Operating Systems", "Computer Networks", "OOP", "AI & ML",
  "Web Development", "Placement Preparation", "General Knowledge",
];

export const CONTEST_DIFFICULTIES = ["Easy", "Medium", "Hard"];
export const QUESTION_TYPES = ["mcq", "multiselect", "truefalse", "fillblank"];

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

export async function fetchPublishedContests() {
  const snap = await getDocs(query(collection(db, "contests"), where("status", "==", "published")));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function fetchContest(contestId) {
  const snap = await getDoc(doc(db, "contests", contestId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
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

// Cross-contest feed for the Contest Hub's "Announcements" sub-view - relies on the
// same nested announcements rule applying to collection-group queries.
export async function fetchRecentAnnouncements(topN = 10) {
  const snap = await getDocs(query(collectionGroup(db, "announcements"), orderBy("createdAt", "desc"), limit(topN)));
  return snap.docs.map(d => ({ id: d.id, contestId: d.ref.parent.parent.id, ...d.data() }));
}

export async function fetchMyRegistration(contestId, uid) {
  const snap = await getDoc(doc(db, "contests", contestId, "registrations", uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function fetchMySubmission(contestId, uid) {
  const snap = await getDoc(doc(db, "contests", contestId, "submissions", uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function registerForContest(contestId, uid) {
  await setDoc(doc(db, "contests", contestId, "registrations", uid), {
    registeredAt: serverTimestamp(),
  });
  await updateDoc(doc(db, "contests", contestId), { participantCount: increment(1) });
}

export async function submitContestAnswers(contestId, uid, answers, timeTakenSeconds) {
  await setDoc(doc(db, "contests", contestId, "submissions", uid), {
    answers, timeTakenSeconds, submittedAt: serverTimestamp(), graded: false,
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

function isAnswerCorrect(question, key, given) {
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

// Reward is proportional to accuracyRatio, hard-capped at the contest's own announced
// prize - matches the Firestore rules bound on the submission's grading update.
export function computeRewards(contest, accuracyRatio) {
  const xpEarned = Math.max(0, Math.round((contest.prizeXp || 0) * accuracyRatio));
  const coinsEarned = Math.max(0, Math.round((contest.prizeCoins || 0) * accuracyRatio));
  return { xpEarned, coinsEarned };
}

// One-time, irreversible grading write - rules enforce graded false->true and the
// xpEarned/coinsEarned caps; this also bumps the user's contest + global XP/coin totals.
export async function persistGrading(contestId, uid, grading, rewards) {
  await updateDoc(doc(db, "contests", contestId, "submissions", uid), {
    graded: true,
    score: grading.score,
    maxScore: grading.maxScore,
    accuracy: grading.accuracy,
    correctCount: grading.correctCount,
    xpEarned: rewards.xpEarned,
    coinsEarned: rewards.coinsEarned,
  });
  await updateDoc(doc(db, "users", uid), {
    xp: increment(rewards.xpEarned),
    credits: increment(rewards.coinsEarned),
    contestXp: increment(rewards.xpEarned),
    contestCoins: increment(rewards.coinsEarned),
    contestsParticipated: increment(1),
  });
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
  const handles = await Promise.all(rows.map(r => getDoc(doc(db, "users", r.uid)).then(u => u.exists() ? u.data().handle : null).catch(() => null)));
  return rows.map((r, i) => ({ ...r, handle: handles[i] }));
}

// Cheap rank-beyond-top-N via a count aggregation instead of downloading the whole
// submissions collection.
export async function fetchMyRank(contestId, myScore) {
  const countSnap = await getCountFromServer(query(
    collection(db, "contests", contestId, "submissions"),
    where("graded", "==", true),
    where("score", ">", myScore),
  ));
  return countSnap.data().count + 1;
}
