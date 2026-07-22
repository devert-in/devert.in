// Aggregates a single student's real progress across every global catalog
// module (Programming, CS Core, DSA/CodeLab, Company Vault) for the Campus
// Admin Student Analytics Dashboard. Every number here is read from data
// that already exists elsewhere in the app (see lib/programming.js,
// lib/csCore.js, lib/codelab.js, lib/companyPrep.js) - this file only joins
// and shapes it for one uid. Deliberately does NOT invent session/login
// tracking, contest ratings, or any other metric with no underlying
// collection - see the CS/Campus admin dashboard spec discussion for why.
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { fetchLanguages, fetchLanguageProgress } from "@/lib/programming";
import { fetchSubjects, fetchSubjectProgress } from "@/lib/csCore";
import { fetchUserCodelabProgress, fetchPublishedProblems, fetchAllSubmissionsForUser } from "@/lib/codelab";
import {
  fetchUserCompanyPrepProgress, fetchPublishedCompanies,
  fetchCompanyRounds, fetchRoundCategories, fetchCategoryQuestions,
} from "@/lib/companyPrep";

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
export async function fetchCompanyVaultSummary(uid) {
  const progress = await fetchUserCompanyPrepProgress(uid);
  const solvedIds = new Set(Object.keys(progress.solved || {}));
  const bookmarkedIds = new Set(Object.keys(progress.bookmarked || {}));

  if (solvedIds.size === 0 && bookmarkedIds.size === 0) {
    return { companiesStarted: 0, companiesCompleted: 0, totalSolved: 0, totalBookmarked: 0, companyBreakdown: [] };
  }

  const companies = await fetchPublishedCompanies();
  const companyBreakdown = await Promise.all(companies.map(async company => {
    const rounds = await fetchCompanyRounds(company.id);
    const categoriesByRound = await Promise.all(rounds.map(r => fetchRoundCategories(company.id, r.id)));
    const questionSets = await Promise.all(
      rounds.flatMap((r, ri) => categoriesByRound[ri].map(cat => fetchCategoryQuestions(company.id, r.id, cat.id)))
    );
    const questionIds = questionSets.flat().map(q => q.id);
    const total = questionIds.length;
    const solved = questionIds.filter(id => solvedIds.has(id)).length;
    const bookmarked = questionIds.filter(id => bookmarkedIds.has(id)).length;
    return { id: company.id, name: company.name || company.id, total, solved, bookmarked, pct: total ? Math.round((solved / total) * 100) : 0 };
  }));

  const touched = companyBreakdown.filter(c => c.solved > 0 || c.bookmarked > 0);

  return {
    companiesStarted: touched.length,
    companiesCompleted: touched.filter(c => c.total > 0 && c.solved >= c.total).length,
    totalSolved: solvedIds.size,
    totalBookmarked: bookmarkedIds.size,
    companyBreakdown: touched.sort((a, b) => b.solved - a.solved),
  };
}

export async function fetchStudentAnalytics(uid) {
  const [profile, programming, csCore, dsa, companyVault] = await Promise.all([
    fetchStudentProfile(uid),
    fetchProgrammingSummary(uid),
    fetchCsCoreSummary(uid),
    fetchDsaSummary(uid),
    fetchCompanyVaultSummary(uid),
  ]);
  return { profile, programming, csCore, dsa, companyVault };
}
