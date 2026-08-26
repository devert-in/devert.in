import { auth, db } from "@/lib/firebase";
import { collection, doc, getDocs, getDoc, setDoc, onSnapshot, query, orderBy, where, limit, serverTimestamp, Timestamp } from "firebase/firestore";
import { fetchWithRetry } from "@/lib/fetchRetry";

export const CODELAB_CATEGORIES = [
  "Arrays", "Strings", "Linked List", "Stack", "Queue", "Trees", "Graphs",
  "Recursion", "Dynamic Programming", "Greedy", "Math", "Bit Manipulation",
  "Binary Search", "Sliding Window", "Two Pointer", "Hashing", "Sorting",
  "Searching", "Backtracking", "SQL", "Heap", "Trie",
];

export const CODELAB_DIFFICULTIES = ["Easy", "Medium", "Hard"];

// Autocomplete SUGGESTIONS only for the admin's "which companies ask this"
// tagging UI - never written anywhere by default and never implies any of
// these companies actually asks any given problem. A problem's real
// `companies` array is 100% admin-authored (see admin/page.jsx's Companies
// editor); this list exists only so an admin typing a tag doesn't have to
// remember/retype "Google" vs "google" vs "Alphabet/Google" consistently.
// Deliberately NOT the same list as the `companies` Firestore collection
// (Company Vault's own full interview-prep hubs, lib/companyPrep.js) - most
// of these (Amazon, Google, Meta...) have no Company Vault page today, and
// tagging a DSA problem "asked by Amazon" doesn't require one to exist.
export const COMPANY_TAG_SUGGESTIONS = [
  "Amazon", "Google", "Microsoft", "Meta", "Apple", "Netflix", "Adobe", "Oracle",
  "Goldman Sachs", "Atlassian", "Uber", "Flipkart", "PhonePe", "Paytm", "Razorpay",
  "Swiggy", "Zomato", "TCS", "Infosys", "Wipro", "Accenture", "Capgemini",
  "Cognizant", "Tech Mahindra", "Deloitte",
];

// Shared with Arena's solo-challenge editor (arena-app.jsx) - a challenge is
// graded through this exact same starter-code/language set, just with a
// timer wrapper, so both surfaces reuse this one map instead of drifting.
export const STARTER_CODE = {
  java: "public class Main {\n    public static void main(String[] args) {\n        \n    }\n}\n",
  python: "def solve():\n    pass\n\nsolve()\n",
  cpp: "#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    \n    return 0;\n}\n",
  javascript: "function solve() {\n  \n}\n\nsolve();\n",
  c: "#include <stdio.h>\n\nint main() {\n    \n    return 0;\n}\n",
};

// Phase 1: five languages, kept in sync with Judge0Service's LANGUAGE_IDS map on
// devert-backend - adding a language means updating both places.
export const CODELAB_LANGUAGES = [
  { id: "java",       label: "Java",       monacoId: "java" },
  { id: "python",     label: "Python",     monacoId: "python" },
  { id: "cpp",        label: "C++",        monacoId: "cpp" },
  { id: "javascript", label: "JavaScript", monacoId: "javascript" },
  { id: "c",          label: "C",          monacoId: "c" },
];

function apiUrl() {
  return process.env.NEXT_PUBLIC_API_URL || "";
}

export async function fetchPublishedProblems() {
  const snap = await getDocs(query(collection(db, "problems"), where("status", "==", "published")));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function fetchProblem(problemId) {
  const snap = await getDoc(doc(db, "problems", problemId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function fetchSampleTests(problemId) {
  const snap = await getDocs(collection(db, "problems", problemId, "sampleTests"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export function acceptanceRate(problem) {
  const total = problem.totalSubmissions || 0;
  if (total === 0) return null;
  return Math.round(((problem.acceptedSubmissions || 0) / total) * 100);
}

export async function fetchUserCodelabProgress(uid) {
  const snap = await getDoc(doc(db, "user_codelab_progress", uid));
  return snap.exists() ? snap.data() : { solvedProblems: {}, languageUsage: {}, totalSubmissions: 0, problemsSolvedCount: 0 };
}

// In-progress code (not yet submitted) per problem, so leaving mid-attempt -
// closing the tab, a crash, opening the same problem on another device -
// never loses unsubmitted work. Lives as a map on the same small
// user_codelab_progress/{uid} doc (already isOwner-write, no field
// allow-list, so no rules change needed) rather than a new collection - the
// realistic number of problems a student has an in-progress draft for at
// once is small, so this doesn't risk unbounded doc growth the way an
// unpruned submission log would.
export async function fetchCodeDraft(uid, problemId) {
  const snap = await getDoc(doc(db, "user_codelab_progress", uid));
  return snap.exists() ? (snap.data().codeDrafts?.[problemId] || null) : null;
}

// consoleText/panelOpen/panelTab are optional - callers with no such UI
// (the standalone CodeLab ProblemView) simply never pass them, and the
// nested-map merge below leaves any previously-saved value alone rather
// than wiping it, so passing a partial draft object is always safe.
export async function saveCodeDraft(uid, problemId, { language, code, consoleText, panelOpen, panelTab }) {
  const draft = { language, code, updatedAt: serverTimestamp() };
  if (consoleText !== undefined) draft.consoleText = consoleText;
  if (panelOpen !== undefined) draft.panelOpen = panelOpen;
  if (panelTab !== undefined) draft.panelTab = panelTab;
  await setDoc(doc(db, "user_codelab_progress", uid), {
    codeDrafts: { [problemId]: draft },
  }, { merge: true });
}

// Live counterpart to fetchUserCodelabProgress - a solved-map update from a
// submission made anywhere (another tab, Arena, a re-solve) reaches every
// mounted problem list immediately, no navigation/remount required to see
// it. Cheap to keep live: one small document, not a growing query.
export function subscribeToCodelabProgress(uid, callback) {
  return onSnapshot(doc(db, "user_codelab_progress", uid), snap => {
    callback(snap.exists() ? snap.data() : { solvedProblems: {}, languageUsage: {}, totalSubmissions: 0, problemsSolvedCount: 0 });
  }, err => console.error("[onSnapshot:codelabProgress]", err));
}

// Distinct problem ids a user has ever submitted for, regardless of verdict -
// lets a problem list show "attempted, not yet solved" instead of only ever
// "solved" or blank. A plain where("uid","==") needs no composite index
// (unlike fetchMySubmissions' uid+createdAt ordering), so this stays a
// single simple query even as submission history grows.
export async function fetchAttemptedProblemIds(uid) {
  const snap = await getDocs(query(collection(db, "codelab_submissions"), where("uid", "==", uid)));
  return new Set(snap.docs.map(d => d.data().problemId));
}

// Scoped to one problem, for that problem's own Submission History tab.
// Deliberately no orderBy alongside the two equality filters - that combo
// would need a new composite Firestore index deployed before it could ever
// run; sorting the (small, per-problem) result client-side instead needs
// nothing beyond what's already indexed.
export async function fetchProblemSubmissions(uid, problemId, topN = 20) {
  const snap = await getDocs(query(
    collection(db, "codelab_submissions"),
    where("uid", "==", uid),
    where("problemId", "==", problemId),
  ));
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0))
    .slice(0, topN);
}

// Every submission a user has ever made, unfiltered by problem - powers a
// real per-student acceptance rate (accepted/total by verdict) instead of
// the coarser problemsSolvedCount/totalSubmissions ratio, which conflates
// "solved on the Nth try" with "solved on the first try". Same no-orderBy
// shape as fetchAttemptedProblemIds for the same reason (a uid+createdAt
// composite index isn't provisioned).
export async function fetchAllSubmissionsForUser(uid) {
  const snap = await getDocs(query(collection(db, "codelab_submissions"), where("uid", "==", uid)));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// Real submission timestamps (not just the cumulative solvedProblems/
// totalSubmissions counters, which carry no per-day information) since a
// given date - the Classroom Analytics dashboard's "Active" signal needs to
// know WHICH days a student actually submitted code, not just their
// lifetime total. Needs its own uid+createdAt composite index (every other
// codelab_submissions query in this file deliberately avoids orderBy
// alongside where("uid") for exactly this reason - this is the one case
// where the index is worth provisioning, since "activity since date X" has
// no cheaper equivalent).
export async function fetchSubmissionDatesForUser(uid, sinceDate) {
  const snap = await getDocs(query(
    collection(db, "codelab_submissions"),
    where("uid", "==", uid),
    where("createdAt", ">=", Timestamp.fromDate(sinceDate)),
  ));
  return snap.docs.map(d => d.data().createdAt?.toDate?.()).filter(Boolean);
}

// Reduces fetchAllSubmissionsForUser's flat list into per-problem
// {attempts, accepted, lastAt} - powers a DSA card's "3 attempts, last solved
// 2 days ago" without any new Firestore read or denormalized counter, since
// this student's full submission history is already fetched in one query.
export function computeSubmissionStatsByProblem(submissions) {
  const map = {};
  for (const s of submissions) {
    const entry = map[s.problemId] || { attempts: 0, accepted: 0, lastAt: null };
    entry.attempts += 1;
    if (s.verdict === "Accepted") entry.accepted += 1;
    const t = s.createdAt?.toMillis?.() ?? 0;
    if (t && (!entry.lastAt || t > entry.lastAt)) entry.lastAt = t;
    map[s.problemId] = entry;
  }
  return map;
}

export async function fetchMySubmissions(uid, topN = 10) {
  const snap = await getDocs(query(
    collection(db, "codelab_submissions"),
    where("uid", "==", uid),
    orderBy("createdAt", "desc"),
    limit(topN),
  ));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function fetchTopSolvers(topN = 20) {
  const snap = await getDocs(query(
    collection(db, "users"),
    orderBy("problemsSolvedCount", "desc"),
    limit(topN),
  ));
  return snap.docs.map((d, i) => ({ rank: i + 1, uid: d.id, ...d.data() })).filter(u => (u.problemsSolvedCount || 0) > 0);
}

// Runs code against arbitrary stdin (Playground) or a problem's sample tests (Run in
// Problem view) - no grading, no XP, proxied through devert-backend so the Judge0 key
// never reaches the browser.
export async function runCode({ language, code, stdin }) {
  const base = apiUrl();
  if (!base) throw new Error("Code execution isn't configured yet (NEXT_PUBLIC_API_URL is unset).");
  const res = await fetchWithRetry(`${base}/api/coding/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ language, code, stdin }),
  });
  const data = await res.json().catch(() => ({}));
  // A 5xx here is CodeExecutionController.run()'s generic catch, which embeds the
  // raw Java exception in data.error (e.g. a credentials/Firestore outage) - that
  // string is meaningless to a student and looks alarming shown verbatim. Every
  // other status the backend returns (400/401/404/429) is already a clean,
  // human-written message, so only 5xx needs overriding here.
  if (!res.ok) throw new Error(res.status >= 500
    ? "The run server had a problem. Wait a moment and try again."
    : (data.error || "Execution failed."));
  return data;
}

// Full grading against hidden tests - only devert-backend ever reads them. Awards
// XP/coins server-side and returns the verdict for display. The backend verifies
// the Firebase ID token itself and grades against THAT uid - it never trusts a
// uid from the request body, so there's nothing to pass here besides the token.
// suppressReward: true when this problem is embedded inside a Daily
// Learning day/assessment as one of its own completion requirements - the
// day already grants one flat XP/coin/score bonus for finishing everything,
// so the standalone per-problem CodeLab reward is skipped here to avoid
// double-counting the same piece of work (see the backend's
// CodeSubmitRequest for the full rationale). Defaults to false - a real,
// standalone DSA-tab submission - so every existing caller keeps its
// current behavior unchanged.
export async function submitCode({ problemId, language, code, suppressReward = false }) {
  const base = apiUrl();
  if (!base) throw new Error("Submissions aren't configured yet (NEXT_PUBLIC_API_URL is unset).");
  if (!auth.currentUser) throw new Error("Sign in to submit.");
  const idToken = await auth.currentUser.getIdToken();
  const res = await fetchWithRetry(`${base}/api/coding/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${idToken}` },
    body: JSON.stringify({ problemId, language, code, suppressReward }),
  });
  const data = await res.json().catch(() => ({}));
  // Same reasoning as runCode() above: a 5xx is gradeSubmission()'s generic
  // catch, which embeds the raw exception (Firestore/credentials failures
  // included) in data.error. gradeSubmission()'s very first line reads the
  // problem doc, before anything is graded or written - so on a 5xx nothing
  // was actually persisted server-side. Don't claim otherwise; the code the
  // student typed is still sitting in their own editor either way.
  if (!res.ok) throw new Error(res.status >= 500
    ? "The grading server had a problem and this submission didn't go through. Your code is still in the editor - wait a moment and submit again."
    : (data.error || "Submission failed."));
  return data;
}

// Arena's solo-challenge counterpart to submitCode() - same shape (verified ID
// token, backend never trusts a client uid), but grades against an
// arena_matches session instead of a bare problemId, since Arena also needs
// the match's own server-stamped start time to compute a speed bonus and to
// reject a submit after the session has already been resolved.
export async function submitArenaCode({ matchId, language, code }) {
  const base = apiUrl();
  if (!base) throw new Error("Arena submissions aren't configured yet (NEXT_PUBLIC_API_URL is unset).");
  if (!auth.currentUser) throw new Error("Sign in to submit.");
  const idToken = await auth.currentUser.getIdToken();
  const res = await fetchWithRetry(`${base}/api/coding/arena/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${idToken}` },
    body: JSON.stringify({ matchId, language, code }),
  });
  const data = await res.json().catch(() => ({}));
  // Same reasoning as submitCode() above - a 5xx is the backend's generic
  // catch, which embeds the raw exception rather than a message meant for a
  // student to read.
  if (!res.ok) throw new Error(res.status >= 500
    ? "The grading server had a problem and this submission didn't go through. Your code is still in the editor - wait a moment and submit again."
    : (data.error || "Submission failed."));
  return data;
}
