"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Lock, GraduationCap, BookOpen } from "lucide-react";
import { db, collection, getDocs, query, where, orderBy, doc, getDoc, setDoc, serverTimestamp } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { fetchCourseTree, flattenTasks, getTaskStatus, getCurrentTask, courseProgressPct, completeTask } from "@/lib/learning";
import { CAMPUS, tint } from "@/lib/campus-theme";
import { CampusCard, CampusChip, CampusProgressBar, CampusGoogleButton, CampusSkeleton, CampusEmptyState } from "@/components/campus/campus-ui";

// Native, light-themed port of app/learn/page.jsx for DeVert Campus - reuses
// lib/learning.js and the exact user_learning/{uid} read/write contract
// verbatim (same enrollment/completion/quiz-grading writes as the main app).
// The course CATALOG below is genuinely new - no browse/pick UI exists
// anywhere today (the main app's today-task-card.jsx just auto-suggests
// "first doc in an unordered courses query", an explicit Phase-1 placeholder)
// - this is a real improvement, not just a reskin.

function SignInPrompt({ message }) {
  return (
    <CampusCard className="p-7 text-center max-w-sm mx-auto">
      <h3 className="text-[16px] font-semibold mb-2" style={{ color: CAMPUS.ink }}>Sign in to continue</h3>
      <p className="text-[13px] mb-5" style={{ color: CAMPUS.inkSoft }}>{message}</p>
      <CampusGoogleButton style={{ background: CAMPUS.chromeBg, color: CAMPUS.chromeFg }} />
    </CampusCard>
  );
}

// ---------------- Orchestrator: catalog <-> lesson viewer ----------------

export function CampusLearningSection() {
  const { user } = useAuth();
  const [enrolledCourseId, setEnrolledCourseId] = useState(undefined); // undefined = still checking
  const [activeCourseId, setActiveCourseId] = useState(null); // explicit "view this course" override

  useEffect(() => {
    if (!user) { setEnrolledCourseId(null); return; }
    getDoc(doc(db, "user_learning", user.uid))
      .then(snap => setEnrolledCourseId(snap.exists() ? snap.data().enrolledCourseId || null : null))
      .catch(() => setEnrolledCourseId(null));
  }, [user]);

  if (!user) return <SignInPrompt message="Sign in to browse courses and track your progress." />;
  if (enrolledCourseId === undefined) return <CampusCard className="p-5"><CampusSkeleton variant="rect" height={54} /></CampusCard>;

  const courseId = activeCourseId || enrolledCourseId;
  if (courseId) {
    return (
      <CampusLessonViewer
        courseId={courseId}
        onBrowseCourses={() => setActiveCourseId("__catalog__")}
        onEnrolled={(id) => { setEnrolledCourseId(id); setActiveCourseId(null); }}
      />
    );
  }
  return <CampusCourseCatalog onEnrolled={(id) => { setEnrolledCourseId(id); setActiveCourseId(null); }} />;
}

// ---------------- Catalog ----------------

function CampusCourseCatalog({ onEnrolled }) {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(null);

  useEffect(() => {
    getDocs(query(collection(db, "courses"), where("status", "==", "published"), orderBy("order", "asc")))
      .then(snap => setCourses(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleEnroll = async (course) => {
    setEnrolling(course.id);
    try {
      await setDoc(doc(db, "user_learning", user.uid), {
        enrolledCourseId: course.id,
        completedTaskIds: [],
        quizAttempts: {},
        enrolledAt: serverTimestamp(),
      }, { merge: true });
      onEnrolled(course.id);
    } catch (e) { console.error(e); }
    finally { setEnrolling(null); }
  };

  if (loading) {
    return (
      <div className="grid sm:grid-cols-2 gap-4">
        {[0, 1].map(i => (
          <CampusCard key={i} className="p-5 space-y-3">
            <CampusSkeleton variant="rect" width={36} height={36} />
            <CampusSkeleton variant="text" width="70%" height={16} />
            <CampusSkeleton variant="text" />
          </CampusCard>
        ))}
      </div>
    );
  }
  if (courses.length === 0) {
    return <CampusEmptyState icon={BookOpen} title="No courses published yet" description="Check back soon." />;
  }

  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {courses.map(c => (
        <CampusCard key={c.id} className="p-5">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3" style={{ background: `${c.color || CAMPUS.teal}18`, color: c.color || CAMPUS.teal }}>
            <GraduationCap size={16} />
          </div>
          <b className="block text-[14.5px] mb-1.5" style={{ color: CAMPUS.ink }}>{c.title}</b>
          {c.description && <p className="text-xs mb-4" style={{ color: CAMPUS.inkSoft }}>{c.description}</p>}
          {c.category && <span className="inline-block mb-4"><CampusChip color={CAMPUS.inkFaint}>{c.category}</CampusChip></span>}
          <button onClick={() => handleEnroll(c)} disabled={enrolling === c.id}
            className="w-full text-xs font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50"
            style={{ color: CAMPUS.teal, border: `1px solid ${tint(CAMPUS.teal, 31)}`, background: CAMPUS.tealTint }}>
            {enrolling === c.id ? "enrolling..." : "start learning"}
          </button>
        </CampusCard>
      ))}
    </div>
  );
}

// ---------------- Lesson viewer ----------------

function CampusLessonViewer({ courseId, onBrowseCourses, onEnrolled }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState(null);
  const [progress, setProgress] = useState(null);
  const [taskId, setTaskId] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitNotice, setSubmitNotice] = useState(null); // { type: "info" | "error", message }
  const [justRewarded, setJustRewarded] = useState(false);

  useEffect(() => {
    if (courseId === "__catalog__") { setLoading(false); return; }
    (async () => {
      setLoading(true);
      try {
        const [tree, progressSnap] = await Promise.all([
          fetchCourseTree(courseId),
          getDoc(doc(db, "user_learning", user.uid)),
        ]);
        setCourse(tree);
        const prog = progressSnap.exists() ? progressSnap.data() : { completedTaskIds: [], quizAttempts: {} };
        setProgress(prog);
        // Resume at the current (first-incomplete) task by default.
        const flat = flattenTasks(tree);
        const current = getCurrentTask(flat, prog.completedTaskIds || []);
        setTaskId(current?.id || flat[0]?.id || null);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [courseId, user]);

  if (courseId === "__catalog__") {
    return <CampusCourseCatalog onEnrolled={onEnrolled} />;
  }

  if (loading) {
    return (
      <div className="max-w-2xl">
        <CampusSkeleton variant="text" width="40%" className="mb-3" />
        <CampusSkeleton variant="rect" height={6} className="mb-5" />
        <CampusSkeleton variant="text" width="60%" height={24} className="mb-5" />
        <CampusCard className="p-5 space-y-3">
          <CampusSkeleton variant="text" />
          <CampusSkeleton variant="text" width="80%" />
          <CampusSkeleton variant="text" width="50%" />
        </CampusCard>
      </div>
    );
  }
  if (!course) return <CampusEmptyState icon={GraduationCap} title="Course not found" description="This course may have been unpublished or removed." />;

  const flatTasks = flattenTasks(course);
  const task = flatTasks.find(t => t.id === taskId);
  const completedTaskIds = progress?.completedTaskIds || [];
  const status = task ? getTaskStatus(flatTasks, taskId, completedTaskIds) : "unknown";
  const pct = courseProgressPct(flatTasks, completedTaskIds);

  if (!task) return <CampusEmptyState icon={GraduationCap} title="Task not found" description="This lesson may have been removed." />;

  if (status === "locked") {
    return (
      <CampusCard className="p-7 text-center max-w-sm mx-auto">
        <Lock size={24} className="mx-auto mb-3" style={{ color: CAMPUS.inkFaint }} />
        <p className="text-xs mb-4 leading-relaxed" style={{ color: CAMPUS.inkSoft }}>
          Complete the previous task first to unlock this one.
        </p>
      </CampusCard>
    );
  }

  const alreadyCompleted = status === "completed";
  const quiz = task.quiz || [];
  const allAnswered = quiz.every(q => answers[q.id] !== undefined);

  const handleSubmit = async () => {
    if (submitting || !allAnswered) return;
    setSubmitting(true);
    setSubmitNotice(null);
    try {
      let correct = 0;
      quiz.forEach(q => { if (answers[q.id] === q.correctIndex) correct++; });
      const passed = quiz.length === 0 || correct === quiz.length;

      if (passed && !alreadyCompleted) {
        const freshlyCompleted = await completeTask({
          uid: user.uid, courseId, taskId,
          quizScore: correct, quizTotal: quiz.length,
        });
        setProgress(prev => ({ ...prev, completedTaskIds: [...(prev?.completedTaskIds || []), taskId] }));
        setJustRewarded(freshlyCompleted);
        if (!freshlyCompleted) {
          setSubmitNotice({ type: "info", message: "You have already completed this activity." });
        }
      }
      // Only set once any write above has actually confirmed - previously
      // this was set before the writes even started, so a failed write still
      // showed "passed" until a refresh revealed nothing had saved.
      setResult({ score: correct, total: quiz.length, passed });
    } catch (e) {
      console.error(e);
      setSubmitNotice({ type: "error", message: "Couldn't submit - check your connection and try again." });
    }
    finally { setSubmitting(false); }
  };

  const handleRetry = () => { setAnswers({}); setResult(null); };

  const nextTask = (() => {
    const idx = flatTasks.findIndex(t => t.id === taskId);
    return flatTasks[idx + 1] || null;
  })();

  const goToTask = (id) => { setTaskId(id); setAnswers({}); setResult(null); };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <GraduationCap size={13} style={{ color: course.color || CAMPUS.teal }} />
          <p className="text-[11px]" style={{ color: CAMPUS.inkFaint }}>{course.title} / {task.moduleTitle}</p>
        </div>
        <button onClick={onBrowseCourses} className="text-[11px] font-medium transition-colors" style={{ color: CAMPUS.teal }}>
          browse courses
        </button>
      </div>

      <div className="mb-3">
        <CampusProgressBar pct={pct} color={course.color || CAMPUS.teal} />
      </div>

      <h1 className="text-xl font-bold mb-5" style={{ color: CAMPUS.ink }}>{task.title}</h1>

      <CampusCard className="p-5">
        <p className="text-[13px] leading-relaxed whitespace-pre-wrap" style={{ color: CAMPUS.inkSoft }}>{task.lessonBody}</p>
      </CampusCard>

      {quiz.length > 0 && (
        <div className="mt-5">
          <CampusCard className="p-5">
            {!result ? (
              <div className="space-y-5">
                {quiz.map((q, qi) => (
                  <div key={q.id}>
                    <p className="text-xs mb-2" style={{ color: CAMPUS.inkSoft }}>{qi + 1}. {q.text}</p>
                    <div className="space-y-1.5">
                      {q.options.map((opt, oi) => (
                        <button key={oi} onClick={() => setAnswers(prev => ({ ...prev, [q.id]: oi }))}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors"
                          style={{
                            background: answers[q.id] === oi ? CAMPUS.tealTint : CAMPUS.paper,
                            border: `1px solid ${answers[q.id] === oi ? CAMPUS.teal + "60" : CAMPUS.line}`,
                          }}>
                          <span className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                            style={{ border: `1.5px solid ${answers[q.id] === oi ? CAMPUS.teal : CAMPUS.inkFaint}`, background: answers[q.id] === oi ? CAMPUS.teal : "transparent" }} />
                          <span className="text-[12px]" style={{ color: CAMPUS.inkSoft }}>{opt}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                {submitNotice?.type === "error" && (
                  <p className="text-[11px]" style={{ color: CAMPUS.bad }}>{submitNotice.message}</p>
                )}
                <motion.button whileHover={allAnswered ? { scale: 1.01 } : {}} whileTap={allAnswered ? { scale: 0.98 } : {}}
                  onClick={handleSubmit} disabled={!allAnswered || submitting}
                  className="w-full text-sm font-semibold py-3 rounded-xl transition-all disabled:opacity-40"
                  style={{ background: CAMPUS.teal, color: "#fff" }}>
                  {submitting ? "grading..." : "submit quiz"}
                </motion.button>
              </div>
            ) : (
              <div className="text-center py-4">
                {result.passed ? (
                  <>
                    <CheckCircle2 size={32} className="mx-auto mb-3" style={{ color: CAMPUS.good }} />
                    <p className="text-sm mb-1" style={{ color: CAMPUS.good }}>
                      {justRewarded ? `Passed! ${result.score}/${result.total}` : "Already completed"}
                    </p>
                    {submitNotice?.type === "info" && (
                      <p className="text-xs mb-5" style={{ color: CAMPUS.inkFaint }}>{submitNotice.message}</p>
                    )}
                    {nextTask ? (
                      <button onClick={() => goToTask(nextTask.id)} className="text-xs font-semibold px-5 py-2.5 rounded-lg transition-colors"
                        style={{ color: CAMPUS.teal, border: `1px solid ${tint(CAMPUS.teal, 31)}` }}>
                        next task →
                      </button>
                    ) : (
                      <button onClick={onBrowseCourses} className="text-xs font-semibold px-5 py-2.5 rounded-lg transition-colors"
                        style={{ color: CAMPUS.teal, border: `1px solid ${tint(CAMPUS.teal, 31)}` }}>
                        browse more courses
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <XCircle size={32} className="mx-auto mb-3" style={{ color: CAMPUS.bad }} />
                    <p className="text-sm mb-1" style={{ color: CAMPUS.bad }}>{result.score}/{result.total} - not quite</p>
                    <p className="text-xs mb-5" style={{ color: CAMPUS.inkFaint }}>Review the lesson above and try again.</p>
                    <button onClick={handleRetry} className="text-xs font-semibold px-5 py-2.5 rounded-lg transition-colors" style={{ color: CAMPUS.inkSoft, border: `1px solid ${CAMPUS.line}` }}>
                      retry quiz
                    </button>
                  </>
                )}
              </div>
            )}
          </CampusCard>
        </div>
      )}
    </div>
  );
}
