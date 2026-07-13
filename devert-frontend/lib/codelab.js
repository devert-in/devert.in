import { db } from "@/lib/firebase";
import { collection, doc, getDocs, getDoc, query, orderBy, where, limit } from "firebase/firestore";

export const CODELAB_CATEGORIES = [
  "Arrays", "Strings", "Linked List", "Stack", "Queue", "Trees", "Graphs",
  "Recursion", "Dynamic Programming", "Greedy", "Math", "Bit Manipulation",
  "Binary Search", "Sliding Window", "Two Pointer", "Hashing", "Sorting",
  "Searching", "Backtracking", "SQL",
];

export const CODELAB_DIFFICULTIES = ["Easy", "Medium", "Hard"];

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
// XP/coins server-side and returns the verdict for display.
export async function submitCode({ uid, problemId, language, code }) {
  const base = apiUrl();
  if (!base) throw new Error("Submissions aren't configured yet (NEXT_PUBLIC_API_URL is unset).");
  const res = await fetch(`${base}/api/coding/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uid, problemId, language, code }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Submission failed.");
  return data;
}
