"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { GraduationCap, CheckCircle2, ArrowRight } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, getDoc, getDocs, collection, setDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { fetchCourseTree, flattenTasks, getCurrentTask, courseProgressPct } from "@/lib/learning";

export function TodayTaskCard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [progress, setProgress] = useState(null); // user_learning doc
  const [course, setCourse] = useState(null);
  const [availableCourse, setAvailableCourse] = useState(null); // the one course to offer, Phase 1

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const [progressSnap, coursesSnap] = await Promise.all([
          getDoc(doc(db, "user_learning", user.uid)),
          getDocs(collection(db, "courses")),
        ]);
        const firstCourse = coursesSnap.docs[0];
        if (firstCourse) setAvailableCourse({ id: firstCourse.id, ...firstCourse.data() });

        if (progressSnap.exists() && progressSnap.data().enrolledCourseId) {
          const data = progressSnap.data();
          setProgress(data);
          const tree = await fetchCourseTree(data.enrolledCourseId);
          setCourse(tree);
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [user]);

  const handleEnroll = async () => {
    if (!availableCourse || enrolling) return;
    setEnrolling(true);
    try {
      await setDoc(doc(db, "user_learning", user.uid), {
        enrolledCourseId: availableCourse.id,
        completedTaskIds: [],
        quizAttempts: {},
        enrolledAt: serverTimestamp(),
      }, { merge: true });
      const tree = await fetchCourseTree(availableCourse.id);
      setCourse(tree);
      setProgress({ enrolledCourseId: availableCourse.id, completedTaskIds: [], quizAttempts: {} });
    } catch (e) { console.error(e); }
    finally { setEnrolling(false); }
  };

  if (!user || loading) return null;

  // Not enrolled yet - offer the available course.
  if (!progress?.enrolledCourseId) {
    if (!availableCourse) return null; // no courses published yet
    return (
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.02 }}
        className="terminal-window p-5 mb-5">
        <div className="flex items-center gap-2 mb-2">
          <GraduationCap size={14} style={{ color: availableCourse.color || "#00FF41" }} />
          <p className="font-mono text-[10px] text-white/25 tracking-wider">// learning_hub.new</p>
        </div>
        <h3 className="font-sans text-base font-bold text-white mb-1">{availableCourse.title}</h3>
        <p className="font-mono text-xs text-white/40 mb-4 leading-relaxed">{availableCourse.description}</p>
        <button onClick={handleEnroll} disabled={enrolling}
          className="font-mono text-xs px-4 py-2 text-neon-green border border-neon-green/30 hover:bg-neon-green/8 transition-colors disabled:opacity-50">
          {enrolling ? "enrolling..." : "start learning"}
        </button>
      </motion.div>
    );
  }

  const flatTasks = flattenTasks(course);
  const completedTaskIds = progress.completedTaskIds || [];
  const currentTask = getCurrentTask(flatTasks, completedTaskIds);
  const pct = courseProgressPct(flatTasks, completedTaskIds);

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.02 }}
      className="terminal-window p-5 mb-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <GraduationCap size={14} style={{ color: course?.color || "#00FF41" }} />
          <p className="font-mono text-[10px] text-white/25 tracking-wider">{course?.title}</p>
        </div>
        <span className="font-mono text-[10px] text-white/30">{pct}% complete</span>
      </div>

      <div className="w-full h-1.5 bg-white/6 rounded-full overflow-hidden mb-4">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: course?.color || "#00FF41" }} />
      </div>

      {currentTask ? (
        <>
          <p className="font-mono text-[10px] text-white/25 mb-1 tracking-wider">TODAY'S TASK - {currentTask.moduleTitle}</p>
          <h3 className="font-sans text-base font-bold text-white mb-3">{currentTask.title}</h3>
          <Link href={`/learn?courseId=${course.id}&taskId=${currentTask.id}`}>
            <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 font-mono text-xs px-4 py-2 text-neon-green border border-neon-green/30 hover:bg-neon-green/8 transition-colors">
              start task <ArrowRight size={12} />
            </motion.button>
          </Link>
        </>
      ) : (
        <div className="flex items-center gap-2">
          <CheckCircle2 size={16} style={{ color: "#00FF41" }} />
          <p className="font-mono text-sm text-neon-green">Course complete! More modules coming soon.</p>
        </div>
      )}
    </motion.div>
  );
}
