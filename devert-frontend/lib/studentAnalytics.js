// Aggregates a single student's real progress across every global catalog
// module (Programming, CS Core, DSA/CodeLab, Company Vault) for the Campus
// Admin Student Analytics Dashboard. Every number here is read from data
// that already exists elsewhere in the app (see lib/programming.js,
// lib/csCore.js, lib/codelab.js, lib/companyPrep.js) - this file only joins
// and shapes it for one uid. Deliberately does NOT invent session/login
// tracking, contest ratings, or any other metric with no underlying
// collection - see the CS/Campus admin dashboard spec discussion for why.
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { fetchLanguages, fetchLanguageProgress } from "@/lib/programming";
import { fetchSubjects, fetchSubjectProgress } from "@/lib/csCore";
import { fetchUserCodelabProgress, fetchPublishedProblems, fetchAllSubmissionsForUser } from "@/lib/codelab";
import {
  fetchUserCompanyPrepProgress, fetchPublishedCompanies,
  fetchCompanyRounds, fetchRoundCategories, fetchCategoryQuestions,
} from "@/lib/companyPrep";
import { fetchAllUserLogs } from "@/lib/dailyLearning";
import { fetchAptitudeTopics, topicAccuracy, detectWeakTopics } from "@/lib/aptitude";

export async function fetchStudentProfile(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? { uid, ...snap.data() } : null;
}

function millis(ts) { return ts?.toMillis?.() || 0; }

// Per-language getDoc() calls, not a where("uid","==",uid) list query -
// firestore.rules' isAdminOfStudent() check (nested get() calls resolving
// the student's institution) only evaluates for a single known document;
// combined with a list() query it fails outright (verified against the
// emulator), so a campus admin viewing a student's dashboard has to ask
// "does this student have progress in Java?" once per published language
// instead of "give me every progress doc this uid has ever touched". Only
// ~12 languages exist, so this stays cheap.
export async function fetchProgrammingSummary(uid) {
  const languages = await fetchLanguages();
  const progressList = await Promise.all(languages.map(lang => fetchLanguageProgress(uid, lang.id)));

  const languageBreakdown = languages
    .map((lang, i) => {
      const progress = progressList[i];
      if (!progress) return null;
      const total = lang.topicCount || 0;
      const completed = progress.completedTopicIds?.length || 0;
      return {
        id: lang.id, name: lang.name || lang.id,
        total, completed,
        pct: total ? Math.round((completed / total) * 100) : 0,
        lastOpenedAt: progress.lastOpenedAt || null,
      };
    })
    .filter(Boolean)
    .sort((a, b) => millis(b.lastOpenedAt) - millis(a.lastOpenedAt));

  return {
    languagesEnrolled: languageBreakdown.length,
    languagesCompleted: languageBreakdown.filter(l => l.total > 0 && l.completed >= l.total).length,
    currentLanguage: languageBreakdown[0]?.name || null,
    totalTopicsCompleted: languageBreakdown.reduce((s, l) => s + l.completed, 0),
    languageBreakdown,
  };
}

// Same per-subject getDoc() shape as fetchProgrammingSummary, for the same
// list()-query-vs-isAdminOfStudent() reason.
export async function fetchCsCoreSummary(uid) {
  const subjects = await fetchSubjects();
  const progressList = await Promise.all(subjects.map(subject => fetchSubjectProgress(uid, subject.id)));

  const subjectBreakdown = subjects
    .map((subject, i) => {
      const progress = progressList[i];
      if (!progress) return null;
      const total = subject.topicCount || 0;
      const completed = progress.completedTopicIds?.length || 0;
      return {
        id: subject.id, name: subject.name || subject.id,
        total, completed,
        pct: total ? Math.round((completed / total) * 100) : 0,
        lastOpenedAt: progress.lastOpenedAt || null,
      };
    })
    .filter(Boolean)
    .sort((a, b) => millis(b.lastOpenedAt) - millis(a.lastOpenedAt));

  const completed = subjectBreakdown.filter(s => s.total > 0 && s.completed >= s.total);
  const strongest = [...subjectBreakdown].sort((a, b) => b.pct - a.pct)[0] || null;
  const weakest = subjectBreakdown.filter(s => s.pct < 100).sort((a, b) => a.pct - b.pct)[0] || null;

  return {
    subjectsStarted: subjectBreakdown.length,
    subjectsCompleted: completed.length,
    totalTopicsCompleted: subjectBreakdown.reduce((s, l) => s + l.completed, 0),
    strongestSubject: strongest?.name || null,
    weakestSubject: weakest?.name || null,
    subjectBreakdown,
  };
}

export async function fetchDsaSummary(uid) {
  const [progress, problems, submissions] = await Promise.all([
    fetchUserCodelabProgress(uid), fetchPublishedProblems(), fetchAllSubmissionsForUser(uid),
  ]);
  const problemsById = new Map(problems.map(p => [p.id, p]));
  const solvedIds = Object.keys(progress.solvedProblems || {});

  const byDifficulty = { Easy: 0, Medium: 0, Hard: 0 };
  solvedIds.forEach(id => {
    const difficulty = problemsById.get(id)?.difficulty;
    if (byDifficulty[difficulty] !== undefined) byDifficulty[difficulty]++;
  });

  const byCategory = {};
  problems.forEach(p => { byCategory[p.category] = byCategory[p.category] || { total: 0, solved: 0 }; byCategory[p.category].total++; });
  solvedIds.forEach(id => {
    const category = problemsById.get(id)?.category;
    if (category && byCategory[category]) byCategory[category].solved++;
  });

  const accepted = submissions.filter(s => s.verdict === "Accepted").length;

  return {
    problemsSolved: progress.problemsSolvedCount || solvedIds.length,
    byDifficulty,
    totalSubmissions: submissions.length || progress.totalSubmissions || 0,
    acceptanceRate: submissions.length ? Math.round((accepted / submissions.length) * 100) : null,
    languageUsage: progress.languageUsage || {},
    topicBreakdown: Object.entries(byCategory)
      .map(([category, v]) => ({ category, ...v, pct: v.total ? Math.round((v.solved / v.total) * 100) : 0 }))
      .filter(t => t.solved > 0)
      .sort((a, b) => b.solved - a.solved),
  };
}

// Only walks the Company -> Round -> Category -> Question tree (needed to
// map a bare questionId back to which company it belongs to) when this
// student has actually touched Company Vault at all - most students never
// will, and the full tree walk is real Firestore reads, not free.
// The company -> round -> category -> question tree is admin-authored and
// changes rarely, unlike per-student progress which changes constantly -
// fetchCompanyVaultSummary used to re-walk the ENTIRE tree (every company,
// every round, every category, every question) on every single call, even
// though only the id->company mapping and per-company question counts were
// actually needed (questionIds are bare Firestore auto-IDs with no
// company/round/category encoding, so there's no way to attribute a solved
// id to a company without building this map at least once). Cached
// in-module for the life of the tab/session - correct as long as the page
// isn't open while an admin is actively restructuring Company Vault content,
// an acceptable trade-off for a dashboard summary, not a real-time view.
let companyVaultTreeCache = null;
async function fetchCompanyVaultTree() {
  if (companyVaultTreeCache) return companyVaultTreeCache;
  const companies = await fetchPublishedCompanies();
  companyVaultTreeCache = await Promise.all(companies.map(async company => {
    const rounds = await fetchCompanyRounds(company.id);
    const categoriesByRound = await Promise.all(rounds.map(r => fetchRoundCategories(company.id, r.id)));
    const questionSets = await Promise.all(
      rounds.flatMap((r, ri) => categoriesByRound[ri].map(cat => fetchCategoryQuestions(company.id, r.id, cat.id)))
    );
    return { id: company.id, name: company.name || company.id, questionIds: questionSets.flat().map(q => q.id) };
  }));
  return companyVaultTreeCache;
}

export async function fetchCompanyVaultSummary(uid) {
  const progress = await fetchUserCompanyPrepProgress(uid);
  const solvedIds = new Set(Object.keys(progress.solved || {}));
  const bookmarkedIds = new Set(Object.keys(progress.bookmarked || {}));

  if (solvedIds.size === 0 && bookmarkedIds.size === 0) {
    return { companiesStarted: 0, companiesCompleted: 0, totalSolved: 0, totalBookmarked: 0, companyBreakdown: [] };
  }

  const tree = await fetchCompanyVaultTree();
  const companyBreakdown = tree.map(company => {
    const total = company.questionIds.length;
    const solved = company.questionIds.filter(id => solvedIds.has(id)).length;
    const bookmarked = company.questionIds.filter(id => bookmarkedIds.has(id)).length;
    return { id: company.id, name: company.name, total, solved, bookmarked, pct: total ? Math.round((solved / total) * 100) : 0 };
  });

  const touched = companyBreakdown.filter(c => c.solved > 0 || c.bookmarked > 0);

  return {
    companiesStarted: touched.length,
    companiesCompleted: touched.filter(c => c.total > 0 && c.solved >= c.total).length,
    totalSolved: solvedIds.size,
    totalBookmarked: bookmarkedIds.size,
    companyBreakdown: touched.sort((a, b) => b.solved - a.solved),
  };
}

// Every reward a student has ever been granted, straight from the central
// reward_grants ledger (lib/rewards.js) - never computed/assumed from
// progress percentages, so an admin sees exactly where each XP/coin came
// from, including manual admin grants (activityType "admin_manual",
// grantedBy set to the acting admin's uid) that have no other visible
// trace anywhere else in the app. Single-field equality filter (uid only),
// sorted client-side by grantedAt - avoids needing a composite index just
// to show one student's own timeline, same reasoning as this file's other
// per-uid queries.
export async function fetchRewardTimeline(uid) {
  const snap = await getDocs(query(collection(db, "reward_grants"), where("uid", "==", uid)));
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => millis(b.grantedAt) - millis(a.grantedAt));
}

// Daily Learning's own per-day log doc already carries mcqScore/mcqTotal/
// problemsSolved/xpEarned/coinEarned (see lib/dailyLearning.js's
// submitDayCompletion) - this just rolls every day this student has ever
// completed into one summary, the same "join what already exists" approach
// as every other fetch*Summary in this file. Requires institutionId since
// Daily Learning is institution-scoped, unlike the global catalogs above.
export async function fetchDailyLearningSummary(uid, institutionId) {
  if (!institutionId) return { daysCompleted: 0, avgMcqScorePct: null, totalProblemsSolved: 0, xpEarned: 0, coinsEarned: 0, recentDays: [] };
  const logs = await fetchAllUserLogs(institutionId, uid);
  const completed = logs.filter(l => l.completedAt);

  const mcqRatios = completed.filter(l => (l.mcqTotal || 0) > 0).map(l => l.mcqScore / l.mcqTotal);
  const avgMcqScorePct = mcqRatios.length ? Math.round((mcqRatios.reduce((a, b) => a + b, 0) / mcqRatios.length) * 100) : null;

  return {
    daysCompleted: completed.length,
    avgMcqScorePct,
    totalProblemsSolved: completed.reduce((s, l) => s + (l.problemsSolved?.length || 0), 0),
    xpEarned: completed.reduce((s, l) => s + (l.xpEarned || 0), 0),
    coinsEarned: completed.reduce((s, l) => s + (l.coinEarned || 0), 0),
    recentDays: completed.sort((a, b) => (b.date || "").localeCompare(a.date || "")).slice(0, 10),
  };
}

// Aptitude/Grind's own per-question attempt history + per-topic accuracy
// (lib/aptitude.js) rolled into one summary, reusing detectWeakTopics/
// topicAccuracy verbatim rather than re-deriving weakness detection here.
export async function fetchAptitudeSummary(uid) {
  const [progressSnap, topics] = await Promise.all([
    getDoc(doc(db, "user_aptitude_progress", uid)),
    fetchAptitudeTopics(),
  ]);
  const progress = progressSnap.exists() ? progressSnap.data() : null;
  if (!progress) return { topicsCompleted: 0, questionsAttempted: 0, overallAccuracyPct: null, weakTopics: [], categoryBreakdown: [] };

  const attempted = progress.attempted || {};
  const topicStats = progress.topicStats || {};
  const attemptedIds = Object.keys(attempted);
  const correctCount = attemptedIds.filter(qid => attempted[qid]?.everCorrect ?? attempted[qid]?.correct).length;

  const byCategory = {};
  for (const t of topics) {
    byCategory[t.category] = byCategory[t.category] || { attempted: 0, correct: 0 };
    const s = topicStats[t.id];
    if (s) { byCategory[t.category].attempted += s.attempted || 0; byCategory[t.category].correct += s.correct || 0; }
  }

  return {
    topicsCompleted: (progress.completedTopicIds || []).length,
    questionsAttempted: attemptedIds.length,
    overallAccuracyPct: attemptedIds.length ? Math.round((correctCount / attemptedIds.length) * 100) : null,
    weakTopics: detectWeakTopics(topics, topicStats).slice(0, 5).map(t => ({ name: t.topic.name, category: t.topic.category, accuracy: t.accuracy })),
    categoryBreakdown: Object.entries(byCategory)
      .map(([category, v]) => ({ category, ...v, pct: v.attempted ? Math.round((v.correct / v.attempted) * 100) : 0 }))
      .filter(c => c.attempted > 0),
  };
}

export async function fetchStudentAnalytics(uid) {
  // profile is fetched first (not folded into the Promise.all below) since
  // dailyLearningSummary needs its institutionId before it can even build
  // the right query - everything else has no such dependency.
  const profile = await fetchStudentProfile(uid);
  const [programming, csCore, dsa, companyVault, dailyLearning, aptitude, rewardTimeline, earningsSnap] = await Promise.all([
    fetchProgrammingSummary(uid),
    fetchCsCoreSummary(uid),
    fetchDsaSummary(uid),
    fetchCompanyVaultSummary(uid),
    fetchDailyLearningSummary(uid, profile?.institutionId),
    fetchAptitudeSummary(uid),
    fetchRewardTimeline(uid),
    getDoc(doc(db, "user_earnings", uid)),
  ]);
  const rewards = {
    xp: profile?.xp || 0,
    score: profile?.score || 0,
    coins: earningsSnap.exists() ? (earningsSnap.data().pulseCoins || 0) : 0,
    streak: profile?.streak || 0,
    totalActivitiesCompleted: rewardTimeline.filter(r => r.status === "granted").length,
  };
  return { profile, programming, csCore, dsa, companyVault, dailyLearning, aptitude, rewardTimeline, rewards };
}
