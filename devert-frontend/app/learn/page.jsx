"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { CheckCircle2, XCircle, ArrowLeft, Lock, GraduationCap } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { fetchCourseTree, flattenTasks, getTaskStatus, completeTask } from "@/lib/learning";

function TerminalShell({ children, label }) {
  return (
    <div className="terminal-window w-full">
      <div className="terminal-header">
        <div className="terminal-dot bg-red-500/70" />
        <div className="terminal-dot bg-yellow-500/70" />
        <div className="terminal-dot bg-green-500/70" />
        <span className="font-mono text-[10px] text-white/25 ml-2">{label}</span>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function LearnContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get("courseId");
  const taskId = searchParams.get("taskId");

  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState(null);
  const [progress, setProgress] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitNotice, setSubmitNotice] = useState(null); // { type: "info" | "error", message }
  const [justRewarded, setJustRewarded] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(`/learn?courseId=${courseId || ""}&taskId=${taskId || ""}`)}`);
      return;
    }
    if (!courseId || !taskId) { setLoading(false); return; }
    (async () => {
      try {
        const [tree, progressSnap] = await Promise.all([
          fetchCourseTree(courseId),
          getDoc(doc(db, "user_learning", user.uid)),
        ]);
        setCourse(tree);
        setProgress(progressSnap.exists() ? progressSnap.data() : { completedTaskIds: [], quizAttempts: {} });
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [user, authLoading, courseId, taskId]);

  if (authLoading || loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="font-mono text-xs text-white/25 animate-pulse">loading task...</p>
      </main>
    );
  }
  if (!user) return null;

  if (!course || !courseId || !taskId) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <p className="font-mono text-sm text-white/30">Task not found.</p>
      </main>
    );
  }

  const flatTasks = flattenTasks(course);
  const task = flatTasks.find(t => t.id === taskId);
  const completedTaskIds = progress?.completedTaskIds || [];
  const status = task ? getTaskStatus(flatTasks, taskId, completedTaskIds) : "unknown";

  if (!task) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <p className="font-mono text-sm text-white/30">Task not found.</p>
      </main>
    );
  }

  if (status === "locked") {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-sm w-full">
          <TerminalShell label="access_locked.sh">
            <div className="text-center">
              <Lock size={24} className="mx-auto mb-3 text-white/20" />
              <p className="font-mono text-xs text-white/40 mb-4 leading-relaxed">
                Complete the previous task first to unlock this one.
              </p>
              <Link href="/" className="font-mono text-xs text-neon-cyan/70 hover:text-neon-cyan border border-neon-cyan/25 px-4 py-2 rounded inline-block">
                back to dashboard
              </Link>
            </div>
          </TerminalShell>
        </div>
      </main>
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
      // Set only once the write above (if any) has actually confirmed - a
      // failed write now throws before this line, instead of leaving the UI
      // showing "passed" when nothing was actually saved.
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

  return (
    <main className="min-h-screen pt-10 pb-32 px-6 relative">
      <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none" />
      <div className="relative max-w-2xl mx-auto">
        <Link href="/" className="flex items-center gap-1.5 font-mono text-[10px] text-white/25 hover:text-white/50 transition-colors mb-6">
          <ArrowLeft size={11} /> dashboard
        </Link>

        <div className="flex items-center gap-2 mb-2">
          <GraduationCap size={13} style={{ color: course.color || "#00FF41" }} />
          <p className="font-mono text-[10px] text-white/25 tracking-wider">{course.title} / {task.moduleTitle}</p>
        </div>
        <h1 className="font-sans text-2xl font-bold text-white mb-6">{task.title}</h1>

        <TerminalShell label="lesson.md">
          <p className="font-mono text-[13px] text-white/70 leading-relaxed whitespace-pre-wrap">{task.lessonBody}</p>
        </TerminalShell>

        {quiz.length > 0 && (
          <div className="mt-6">
            <TerminalShell label="quiz.exe">
              {!result ? (
                <div className="space-y-5">
                  {quiz.map((q, qi) => (
                    <div key={q.id}>
                      <p className="font-mono text-xs text-white/70 mb-2">{qi + 1}. {q.text}</p>
                      <div className="space-y-1.5">
                        {q.options.map((opt, oi) => (
                          <button key={oi} onClick={() => setAnswers(prev => ({ ...prev, [q.id]: oi }))}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors"
                            style={{
                              background: answers[q.id] === oi ? "rgba(0,255,65,0.08)" : "rgba(255,255,255,0.03)",
                              border: answers[q.id] === oi ? "1px solid rgba(0,255,65,0.35)" : "1px solid rgba(255,255,255,0.06)",
                            }}>
                            <span className="w-3.5 h-3.5 rounded-full border flex-shrink-0"
                              style={{ borderColor: answers[q.id] === oi ? "#00FF41" : "rgba(255,255,255,0.2)", background: answers[q.id] === oi ? "#00FF41" : "transparent" }} />
                            <span className="font-mono text-[12px] text-white/70">{opt}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  {submitNotice?.type === "error" && (
                    <p className="font-mono text-[11px] text-red-400">{submitNotice.message}</p>
                  )}
                  <motion.button whileHover={allAnswered ? { scale: 1.01 } : {}} whileTap={allAnswered ? { scale: 0.98 } : {}}
                    onClick={handleSubmit} disabled={!allAnswered || submitting}
                    className="w-full font-mono text-sm py-3 rounded-xl transition-all disabled:opacity-40"
                    style={{ background: "#00FF41", color: "#050505" }}>
                    {submitting ? "grading..." : "submit quiz"}
                  </motion.button>
                </div>
              ) : (
                <div className="text-center py-4">
                  {result.passed ? (
                    <>
                      <CheckCircle2 size={32} className="mx-auto mb-3" style={{ color: "#00FF41" }} />
                      <p className="font-mono text-sm text-neon-green mb-1">
                        {justRewarded ? `Passed! ${result.score}/${result.total}` : "Already completed"}
                      </p>
                      {submitNotice?.type === "info" && (
                        <p className="font-mono text-[11px] mb-5 text-white/40">{submitNotice.message}</p>
                      )}
                      {nextTask ? (
                        <Link href={`/learn?courseId=${courseId}&taskId=${nextTask.id}`}>
                          <button className="font-mono text-xs px-5 py-2.5 text-neon-cyan border border-neon-cyan/30 hover:bg-neon-cyan/8 transition-colors">
                            next task →
                          </button>
                        </Link>
                      ) : (
                        <Link href="/">
                          <button className="font-mono text-xs px-5 py-2.5 text-neon-cyan border border-neon-cyan/30 hover:bg-neon-cyan/8 transition-colors">
                            back to dashboard
                          </button>
                        </Link>
                      )}
                    </>
                  ) : (
                    <>
                      <XCircle size={32} className="mx-auto mb-3 text-red-400/70" />
                      <p className="font-mono text-sm text-red-400 mb-1">{result.score}/{result.total} - not quite</p>
                      <p className="font-mono text-xs text-white/40 mb-5">Review the lesson above and try again.</p>
                      <button onClick={handleRetry} className="font-mono text-xs px-5 py-2.5 text-white/50 border border-white/15 hover:text-white/80 transition-colors">
                        retry quiz
                      </button>
                    </>
                  )}
                </div>
              )}
            </TerminalShell>
          </div>
        )}
      </div>
    </main>
  );
}

export default function LearnPage() {
  return (
    <Suspense fallback={null}>
      <LearnContent />
    </Suspense>
  );
}
