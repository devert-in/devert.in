import { db } from "@/lib/firebase";
import { collection, doc, getDocs, getDoc, query, orderBy, runTransaction, arrayUnion, serverTimestamp } from "firebase/firestore";

// Course -> Module -> Task(+Quiz) hierarchy helpers, shared between the
// admin content manager, the learning dashboard card, and the /learn page,
// so "what's unlocked" is computed identically everywhere.

// In-module cache, keyed by courseId - the course/module/task tree is
// admin-authored content that changes rarely, but this was being re-fetched
// (with its own internal N+1: one query per module for that module's tasks)
// on nearly every Home dashboard load (today-task-card.jsx), every /learn
// visit, and every Campus Learning tab open. fetchCompanyVaultTree in
// lib/studentAnalytics.js is the established precedent for exactly this
// trade-off - safe here too since the admin content manager (app/admin/page.jsx)
// manages courses/modules/tasks through its own separate queries, never
// through this function, so there's no "admin edits, then immediately sees
// stale content through this same cache" risk.
const courseTreeCache = new Map();
export async function fetchCourseTree(courseId) {
  if (courseTreeCache.has(courseId)) return courseTreeCache.get(courseId);
  const courseSnap = await getDoc(doc(db, "courses", courseId));
  if (!courseSnap.exists()) return null;
  const modulesSnap = await getDocs(query(collection(db, "courses", courseId, "modules"), orderBy("order", "asc")));
  const modules = await Promise.all(modulesSnap.docs.map(async (m) => {
    const tasksSnap = await getDocs(query(collection(db, "courses", courseId, "modules", m.id, "tasks"), orderBy("order", "asc")));
    return { id: m.id, ...m.data(), tasks: tasksSnap.docs.map(t => ({ id: t.id, ...t.data() })) };
  }));
  const tree = { id: courseSnap.id, ...courseSnap.data(), modules };
  courseTreeCache.set(courseId, tree);
  return tree;
}

// Flat, ordered list of every task across every module in the course - the
// single sequence sequential unlock is measured against.
export function flattenTasks(course) {
  return (course?.modules || []).flatMap(m =>
    (m.tasks || []).map(t => ({ ...t, moduleId: m.id, moduleTitle: m.title, courseId: course.id, courseTitle: course.title }))
  );
}

export function getTaskStatus(flatTasks, taskId, completedTaskIds) {
  const idx = flatTasks.findIndex(t => t.id === taskId);
  if (idx === -1) return "unknown";
  if (completedTaskIds.includes(taskId)) return "completed";
  if (idx === 0) return "unlocked";
  return completedTaskIds.includes(flatTasks[idx - 1].id) ? "unlocked" : "locked";
}

// The next task the learner should do - first one not yet completed.
export function getCurrentTask(flatTasks, completedTaskIds) {
  return flatTasks.find(t => !completedTaskIds.includes(t.id)) || null;
}

export function courseProgressPct(flatTasks, completedTaskIds) {
  if (!flatTasks.length) return 0;
  const done = flatTasks.filter(t => completedTaskIds.includes(t.id)).length;
  return Math.round((done / flatTasks.length) * 100);
}

// Learn/Courses grants no XP/Coins/Score at all (platform policy: only
// Daily Learning, Programming, and CS Core reward) - this only tracks
// completion/quiz-attempt progress. Wrapped in a transaction, re-reading
// completedTaskIds live immediately before writing, so two tabs or a
// double-submit can't both observe "not yet completed" - not that it would
// matter for a reward anymore, but it still matters for not double-recording
// a quiz attempt/completion event.
export async function completeTask({ uid, courseId, taskId, quizScore, quizTotal }) {
  const progressRef = doc(db, "user_learning", uid);
  let alreadyCompleted;

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(progressRef);
    const existing = snap.exists() ? snap.data() : null;
    alreadyCompleted = !!existing?.completedTaskIds?.includes(taskId);

    tx.set(progressRef, {
      enrolledCourseId: courseId,
      completedTaskIds: arrayUnion(taskId),
      [`quizAttempts.${taskId}`]: { score: quizScore, total: quizTotal, passed: true, answeredAt: serverTimestamp() },
    }, { merge: true });
  });

  return !alreadyCompleted;
}
