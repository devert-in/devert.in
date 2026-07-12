"use client";

// /prep/learn — weekday LMS. Course list -> expandable 5-lesson course view
// (MON-FRI, today highlighted) -> lesson (markdown + inline quiz, one
// question at a time, instant reveal). Deep-linkable via ?course=&lesson=
// query params (static-export friendly), hence the Suspense boundary.

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  BookOpen,
  Target,
  CheckCircle2,
  Circle,
  AlertCircle,
  ArrowLeft,
  RotateCcw,
  Trophy,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { RequireAuth, LoadingScreen } from "@/components/prep/guards";
import {
  cn,
  PrepShell,
  TerminalCard,
  BracketButton,
  NeonBadge,
  ProgressBar,
  EmptyState,
  LoadingRows,
  MarkdownBlock,
} from "@/components/prep/ui";
import QuestionCard from "@/components/prep/QuestionCard";
import DailyMissionsPanel, { lessonCompletionKey } from "@/components/prep/hub/DailyMissions";
import { getCourses, getQuestion, getDailyTasks, getMyAttempts, logAttempt, bumpProgress, dateKey } from "@/lib/prep/db";
import { CATEGORY_MAP } from "@/lib/prep/constants";

const DAY_LABELS = { 1: "MON", 2: "TUE", 3: "WED", 4: "THU", 5: "FRI" };

function getISTWeekday(d = new Date()) {
  try {
    const wd = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Kolkata", weekday: "short" }).format(d);
    return { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 }[wd] || 0;
  } catch {
    return 0;
  }
}

function readLessonCompletion(uid, courseId, lessonId) {
  if (!uid || typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(lessonCompletionKey(uid, courseId, lessonId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeLessonCompletion(uid, courseId, lessonId, data) {
  if (!uid || typeof window === "undefined") return;
  try {
    window.localStorage.setItem(lessonCompletionKey(uid, courseId, lessonId), JSON.stringify(data));
  } catch {
    // storage unavailable — the quiz score still shows for this session
  }
}

/* ──────────────────────────────── Course card ────────────────────────────── */

function CourseCard({ course, index, uid, onSelect }) {
  const lessons = Array.isArray(course.lessons) ? course.lessons : [];
  const completedCount = lessons.filter((l) => readLessonCompletion(uid, course.id, l.id)?.completed).length;
  const cat = CATEGORY_MAP[course.category];
  return (
    <button type="button" onClick={onSelect} className="w-full text-left cursor-pointer block">
      <TerminalCard filename={`${course.category || "course"}.md`} icon={BookOpen} hover delay={index * 0.08}>
        <div className="flex items-start justify-between gap-4 mb-3 flex-wrap">
          <div className="min-w-0">
            <h3 className="font-sans text-lg font-bold text-white mb-1">{course.title}</h3>
            <p className="font-mono text-[11px] text-white/40 leading-relaxed">{course.description}</p>
          </div>
          {cat && (
            <NeonBadge color={cat.color} className="flex-shrink-0">
              {cat.label.toUpperCase()}
            </NeonBadge>
          )}
        </div>
        <div className="flex items-center gap-3">
          <ProgressBar
            value={lessons.length ? (completedCount / lessons.length) * 100 : 0}
            color="#00FF41"
            className="flex-1"
          />
          <span className="font-mono text-[10px] text-white/30 flex-shrink-0">
            {completedCount}/{lessons.length} lessons
          </span>
        </div>
      </TerminalCard>
    </button>
  );
}

/* ─────────────────────────────── Course detail ───────────────────────────── */

function CourseDetail({ course, uid, todayWeekday, onSelectLesson, onBack }) {
  const lessons = useMemo(
    () => [...(course.lessons || [])].sort((a, b) => (a.day || 0) - (b.day || 0)),
    [course]
  );
  const cat = CATEGORY_MAP[course.category];

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center gap-4 mb-6 flex-wrap">
        <BracketButton variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft size={11} /> ALL_COURSES
        </BracketButton>
        {cat && <NeonBadge color={cat.color}>{cat.label.toUpperCase()}</NeonBadge>}
      </div>
      <h2 className="font-sans text-2xl font-bold text-white mb-2">{course.title}</h2>
      <p className="font-mono text-sm text-white/40 mb-8 max-w-2xl leading-relaxed">{course.description}</p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {lessons.map((lesson, i) => {
          const completion = readLessonCompletion(uid, course.id, lesson.id);
          const isToday = lesson.day === todayWeekday;
          return (
            <motion.button
              key={lesson.id}
              type="button"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, type: "spring", stiffness: 220, damping: 22 }}
              whileHover={{ y: -3 }}
              onClick={() => onSelectLesson(lesson.id)}
              className={cn(
                "terminal-window p-4 text-left transition-colors cursor-pointer",
                isToday ? "border-neon-cyan/50" : "hover:border-white/20"
              )}
              style={isToday ? { boxShadow: "0 0 20px rgba(0,255,255,0.12)" } : undefined}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className="font-mono text-[10px] tracking-wider"
                  style={{ color: isToday ? "#00FFFF" : "rgba(255,255,255,0.35)" }}
                >
                  {DAY_LABELS[lesson.day] || `DAY ${lesson.day}`}
                </span>
                {completion?.completed ? (
                  <CheckCircle2 size={13} className="text-neon-green" />
                ) : (
                  <Circle size={13} className="text-white/15" />
                )}
              </div>
              <p className="font-sans text-sm font-semibold text-white leading-snug mb-1">{lesson.title}</p>
              {completion?.completed ? (
                <p className="font-mono text-[9px] text-neon-green/70">
                  scored {completion.score}/{completion.total}
                </p>
              ) : isToday ? (
                <p className="font-mono text-[9px] text-neon-cyan/70">today</p>
              ) : null}
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}

/* ──────────────────────────────── Lesson + quiz ──────────────────────────── */

function LessonView({ course, lesson, uid, profile, onBack }) {
  const [questions, setQuestions] = useState(null); // null = loading
  const [qError, setQError] = useState("");
  const [idx, setIdx] = useState(0);
  const [chosen, setChosen] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [results, setResults] = useState([]); // boolean per question index
  const [finished, setFinished] = useState(false);
  const [logError, setLogError] = useState("");
  // Set for real in the effect below (per-lesson reset); render-time init just
  // needs a stable placeholder — Date.now() is impure and must not run at render.
  const questionStartRef = useRef(null);

  const priorCompletion = useMemo(
    () => readLessonCompletion(uid, course.id, lesson.id),
    [uid, course.id, lesson.id]
  );

  useEffect(() => {
    let cancelled = false;
    // Reset all per-lesson state synchronously before the async question fetch starts.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQuestions(null);
    setQError("");
    setIdx(0);
    setChosen(null);
    setRevealed(false);
    setResults([]);
    setFinished(false);
    setLogError("");
    questionStartRef.current = Date.now();
    (async () => {
      try {
        const ids = Array.isArray(lesson.questionIds) ? lesson.questionIds : [];
        const rows = await Promise.all(ids.map((qid) => getQuestion(qid)));
        if (cancelled) return;
        setQuestions(rows.filter(Boolean));
      } catch (err) {
        if (!cancelled) setQError(err?.message || "Couldn't load this lesson's quiz.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [lesson.id, lesson.questionIds]);

  const question = questions?.[idx];

  const handleChoose = async (i) => {
    if (revealed || !question) return;
    setChosen(i);
    setRevealed(true);
    const correct = i === question.correctIndex;
    setResults((prev) => {
      const next = [...prev];
      next[idx] = correct;
      return next;
    });
    setLogError("");
    try {
      await logAttempt(uid, {
        qid: question.id,
        category: question.category,
        topic: question.topic,
        difficulty: question.difficulty,
        correct,
        source: "lesson",
        courseId: course.id,
        timeMs: Date.now() - questionStartRef.current,
      });
      await bumpProgress(uid, {
        category: question.category,
        correct,
        rollNumber: profile?.rollNumber,
        classGroup: profile?.classGroup,
      });
    } catch (err) {
      setLogError(err?.message || "Scored locally, but couldn't sync this attempt to the server.");
    }
  };

  const handleNext = () => {
    if (idx + 1 >= (questions?.length || 0)) {
      const total = questions.length;
      const score = results.filter(Boolean).length;
      writeLessonCompletion(uid, course.id, lesson.id, { completed: true, score, total, ts: Date.now() });
      setFinished(true);
    } else {
      setIdx((v) => v + 1);
      setChosen(null);
      setRevealed(false);
      questionStartRef.current = Date.now();
    }
  };

  const markNoQuizComplete = () => {
    writeLessonCompletion(uid, course.id, lesson.id, { completed: true, score: 0, total: 0, ts: Date.now() });
    setFinished(true);
  };

  const retry = () => {
    setIdx(0);
    setChosen(null);
    setRevealed(false);
    setResults([]);
    setFinished(false);
    questionStartRef.current = Date.now();
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <BracketButton variant="ghost" size="sm" onClick={onBack} className="mb-6">
        <ArrowLeft size={11} /> BACK_TO_LESSONS
      </BracketButton>

      <TerminalCard filename="lesson.md" icon={BookOpen} className="mb-6">
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <NeonBadge color="#00FFFF">{DAY_LABELS[lesson.day] || `DAY ${lesson.day}`}</NeonBadge>
          {priorCompletion?.completed && !finished && (
            <NeonBadge color="#00FF41">
              PREVIOUSLY SCORED {priorCompletion.score}/{priorCompletion.total}
            </NeonBadge>
          )}
        </div>
        <h2 className="font-sans text-2xl font-bold text-white mb-4">{lesson.title}</h2>
        <MarkdownBlock content={lesson.contentMarkdown} />
      </TerminalCard>

      <TerminalCard filename="quiz.sh" icon={Target}>
        {qError && (
          <EmptyState
            icon={AlertCircle}
            title="couldn't load quiz"
            message={qError}
          />
        )}

        {!qError && questions === null && <LoadingRows rows={3} />}

        {!qError && questions && questions.length === 0 && (
          <EmptyState
            title="no quiz linked"
            message="This lesson doesn't have any quiz questions yet."
            action={
              !finished ? (
                <BracketButton variant="green" onClick={markNoQuizComplete}>
                  MARK_LESSON_COMPLETE
                </BracketButton>
              ) : (
                <p className="font-mono text-xs text-neon-green">✓ marked complete</p>
              )
            }
          />
        )}

        {!qError && questions && questions.length > 0 && !finished && question && (
          <div>
            <div className="flex items-center justify-between mb-4 font-mono text-[10px] text-white/30 tracking-wider">
              <span>
                QUESTION {idx + 1} / {questions.length}
              </span>
              <span>{results.filter(Boolean).length} correct so far</span>
            </div>
            <QuestionCard
              question={question}
              chosen={chosen}
              onChoose={handleChoose}
              revealed={revealed}
              index={idx}
              showMeta
            />
            {logError && <p className="mt-3 font-mono text-[11px] text-[#FF9500]">{logError}</p>}
            {revealed && (
              <div className="mt-5">
                <BracketButton variant="cyan" onClick={handleNext}>
                  {idx + 1 >= questions.length ? "FINISH_QUIZ" : "NEXT_QUESTION"}
                </BracketButton>
              </div>
            )}
          </div>
        )}

        {!qError && questions && questions.length > 0 && finished && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3 mb-5">
              <Trophy size={20} className="text-[#FFD700] flex-shrink-0" />
              <div>
                <p className="font-sans text-xl font-bold text-white">
                  {results.filter(Boolean).length} / {questions.length} correct
                </p>
                <p className="font-mono text-[11px] text-white/35">
                  {Math.round((results.filter(Boolean).length / questions.length) * 100)}% — lesson marked
                  complete
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-6">
              {questions.map((q, i) => (
                <span
                  key={q.id || i}
                  title={`Question ${i + 1}: ${results[i] ? "correct" : "incorrect"}`}
                  className={cn(
                    "w-7 h-7 rounded flex items-center justify-center font-mono text-[10px] border",
                    results[i]
                      ? "border-neon-green/50 text-neon-green bg-neon-green/10"
                      : "border-[#FF3B3B]/50 text-[#FF3B3B] bg-[#FF3B3B]/10"
                  )}
                >
                  {i + 1}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <BracketButton variant="cyan" onClick={retry}>
                <RotateCcw size={11} /> RETRY_QUIZ
              </BracketButton>
              <BracketButton variant="ghost" onClick={onBack}>
                BACK_TO_LESSONS
              </BracketButton>
            </div>
          </motion.div>
        )}
      </TerminalCard>
    </motion.div>
  );
}

/* ─────────────────────────────────── Page ────────────────────────────────── */

function LearnPageContent() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [courses, setCourses] = useState(null);
  const [coursesError, setCoursesError] = useState("");

  const [dailyItems, setDailyItems] = useState([]);
  const [dailyLoading, setDailyLoading] = useState(true);
  const [dailyError, setDailyError] = useState("");
  const [todayAttempts, setTodayAttempts] = useState([]);

  const courseIdParam = searchParams.get("course");
  const lessonIdParam = searchParams.get("lesson");

  const loadCourses = useCallback(async () => {
    setCourses(null);
    setCoursesError("");
    try {
      const rows = await getCourses({ publishedOnly: true });
      setCourses(rows || []);
    } catch (err) {
      setCoursesError(err?.message || "Couldn't load courses.");
      setCourses([]);
    }
  }, []);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const items = await getDailyTasks(dateKey());
        if (!cancelled) setDailyItems(items || []);
      } catch (err) {
        if (!cancelled) setDailyError(err?.message || "Couldn't load today's missions.");
      } finally {
        if (!cancelled) setDailyLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!user) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const attempts = await getMyAttempts(user.uid, { max: 60 });
        const today = dateKey();
        if (!cancelled) setTodayAttempts((attempts || []).filter((a) => a.date === today));
      } catch {
        // ticks are a nice-to-have — silent fail keeps the panel usable
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const selectedCourse = useMemo(
    () => courses?.find((c) => c.id === courseIdParam) || null,
    [courses, courseIdParam]
  );
  const selectedLesson = useMemo(
    () => selectedCourse?.lessons?.find((l) => l.id === lessonIdParam) || null,
    [selectedCourse, lessonIdParam]
  );

  const goToCourse = (id) => router.replace(id ? `/prep/learn?course=${encodeURIComponent(id)}` : "/prep/learn");
  const goToLesson = (lessonId) =>
    router.replace(
      `/prep/learn?course=${encodeURIComponent(selectedCourse.id)}&lesson=${encodeURIComponent(lessonId)}`
    );
  const goToList = () => router.replace("/prep/learn");

  const todayWeekday = getISTWeekday();

  return (
    <PrepShell
      kicker="// /prep/learn — weekday_lms.sh"
      title="LEARN"
      accent="TRACK"
      subtitle="Five lessons a week. Answer, get feedback instantly, keep moving."
    >
      {!selectedCourse && (
        <div className="grid lg:grid-cols-[1fr_320px] gap-8">
          <div className="min-w-0">
            <p className="font-mono text-xs text-white/25 mb-4 tracking-wider">{"// courses"}</p>
            {coursesError && (
              <EmptyState
                icon={AlertCircle}
                title="couldn't load courses"
                message={coursesError}
                action={
                  <BracketButton onClick={loadCourses} variant="cyan">
                    RETRY
                  </BracketButton>
                }
              />
            )}
            {!coursesError && courses === null && <LoadingRows rows={4} />}
            {!coursesError && courses && courses.length === 0 && (
              <EmptyState
                title="no courses published yet"
                message="Check back soon — staff are still building the curriculum."
              />
            )}
            {!coursesError && courses && courses.length > 0 && (
              <div className="space-y-4">
                {courses.map((course, i) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    index={i}
                    uid={user?.uid}
                    onSelect={() => goToCourse(course.id)}
                  />
                ))}
              </div>
            )}
          </div>
          <div>
            <p className="font-mono text-xs text-white/25 mb-4 tracking-wider">{"// today's missions"}</p>
            <DailyMissionsPanel
              items={dailyItems}
              loading={dailyLoading}
              error={dailyError}
              uid={user?.uid}
              todayAttempts={todayAttempts}
            />
          </div>
        </div>
      )}

      {selectedCourse && !selectedLesson && (
        <CourseDetail
          course={selectedCourse}
          uid={user?.uid}
          todayWeekday={todayWeekday}
          onSelectLesson={goToLesson}
          onBack={goToList}
        />
      )}

      {selectedCourse && selectedLesson && user && (
        <LessonView
          course={selectedCourse}
          lesson={selectedLesson}
          uid={user.uid}
          profile={profile}
          onBack={() => goToCourse(selectedCourse.id)}
        />
      )}
    </PrepShell>
  );
}

export default function LearnPage() {
  return (
    <RequireAuth>
      <Suspense fallback={<LoadingScreen />}>
        <LearnPageContent />
      </Suspense>
    </RequireAuth>
  );
}
