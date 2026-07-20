import { auth, db } from "@/lib/firebase";
import { collection, doc, getDocs, getDoc, onSnapshot, query, orderBy, where, limit } from "firebase/firestore";

export const CODELAB_CATEGORIES = [
  "Arrays", "Strings", "Linked List", "Stack", "Queue", "Trees", "Graphs",
  "Recursion", "Dynamic Programming", "Greedy", "Math", "Bit Manipulation",
  "Binary Search", "Sliding Window", "Two Pointer", "Hashing", "Sorting",
  "Searching", "Backtracking", "SQL", "Heap", "Trie",
];

export const CODELAB_DIFFICULTIES = ["Easy", "Medium", "Hard"];

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

// Live counterpart to fetchUserCodelabProgress - a solved-map update from a
// submission made anywhere (another tab, Arena, a re-solve) reaches every
// mounted problem list immediately, no navigation/remount required to see
// it. Cheap to keep live: one small document, not a growing query.
export function subscribeToCodelabProgress(uid, callback) {
  return onSnapshot(doc(db, "user_codelab_progress", uid), snap => {
    callback(snap.exists() ? snap.data() : { solvedProblems: {}, languageUsage: {}, totalSubmissions: 0, problemsSolvedCount: 0 });
  });
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
  const res = await fetch(`${base}/api/coding/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ language, code, stdin }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Execution failed.");
  return data;
}

// Full grading against hidden tests - only devert-backend ever reads them. Awards
// XP/coins server-side and returns the verdict for display. The backend verifies
// the Firebase ID token itself and grades against THAT uid - it never trusts a
// uid from the request body, so there's nothing to pass here besides the token.
export async function submitCode({ problemId, language, code }) {
  const base = apiUrl();
  if (!base) throw new Error("Submissions aren't configured yet (NEXT_PUBLIC_API_URL is unset).");
  if (!auth.currentUser) throw new Error("Sign in to submit.");
  const idToken = await auth.currentUser.getIdToken();
  const res = await fetch(`${base}/api/coding/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${idToken}` },
    body: JSON.stringify({ problemId, language, code }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Submission failed.");
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
  const res = await fetch(`${base}/api/coding/arena/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${idToken}` },
    body: JSON.stringify({ matchId, language, code }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Submission failed.");
  return data;
}
