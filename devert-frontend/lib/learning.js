import { db } from "@/lib/firebase";
import { collection, doc, getDocs, getDoc, query, orderBy } from "firebase/firestore";

// Course -> Module -> Task(+Quiz) hierarchy helpers, shared between the
// admin content manager, the learning dashboard card, and the /learn page,
// so "what's unlocked" is computed identically everywhere.

export async function fetchCourseTree(courseId) {
  const courseSnap = await getDoc(doc(db, "courses", courseId));
  if (!courseSnap.exists()) return null;
  const modulesSnap = await getDocs(query(collection(db, "courses", courseId, "modules"), orderBy("order", "asc")));
  const modules = await Promise.all(modulesSnap.docs.map(async (m) => {
    const tasksSnap = await getDocs(query(collection(db, "courses", courseId, "modules", m.id, "tasks"), orderBy("order", "asc")));
    return { id: m.id, ...m.data(), tasks: tasksSnap.docs.map(t => ({ id: t.id, ...t.data() })) };
  }));
  return { id: courseSnap.id, ...courseSnap.data(), modules };
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
