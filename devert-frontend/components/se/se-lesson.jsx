"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  AlertTriangle, ArrowRight, Bookmark, BookmarkCheck, BookOpen,
  Check, CheckCircle2, ChevronLeft, Clock, Coins, Copy, Eye, FileText,
  FlaskConical, Landmark, Lightbulb, ListChecks, Notebook, Rocket, Sparkles,
  Target, Terminal, TrendingUp, XCircle, Zap, ExternalLink, Download, Film,
} from "lucide-react";
import {
  fetchLesson, markLessonOpened, completeLesson, recordKnowledgeCheck,
  toggleLabDone, saveLessonNote, toggleBookmark, lessonNeighbours, videoState,
} from "@/lib/softwareEngineering";
import { shuffleQuizForAttempt, buildQuizSeedKey, loadQuizDraft, saveQuizDraft } from "@/lib/quizRandom";
import { SE_ACCENTS } from "@/lib/seCurriculum";
import { SE_ACCENT, SeLessonBody, SeConcept, Inline } from "@/components/se/se-lesson-blocks";
import {
  SeCard, SeChip, SeLabel, SeButton, SeEmpty, SeTerminal,
  SeReadingBar, SeVideoSlot,
} from "@/components/se/se-ui";
import { useSe } from "@/components/se/se-app";

// The lesson reader.
//
// Sixteen authored sections, rendered in the fixed pedagogical order declared by
// LESSON_SECTIONS in lib/softwareEngineering.js: story before theory, theory
// before code, code before the graded check. That order is the product - it is
// what separates a page a beginner can follow from a reference only someone who
// already knows the topic can use.
//
// Every section renders ONLY when authored. A lesson with just `concept` filled
// in reads as a clean single article, not as fifteen empty headings - which is
// what makes it safe to publish the curriculum skeleton before the content
// exists.

const SECTION_ICON = {
  learningObjectives: Target,
  prerequisites: ListChecks,
  story: BookOpen,
  problemStatement: AlertTriangle,
  walkthrough: Terminal,
  commonMistakes: XCircle,
  industryPerspective: Landmark,
  devertCaseStudy: Rocket,
  summary: CheckCircle2,
  goingDeeper: TrendingUp,
};

export function SeLessonReader() {
  const { tree, progress, screen, go, reloadProgress, user } = useSe();
  const { moduleId, lessonId } = screen;

  const mod = useMemo(() => tree.find(m => m.id === moduleId), [tree, moduleId]);
  const accent = SE_ACCENTS[mod?.accent] || SE_ACCENT.green;

  const [lesson, setLesson] = useState(null);
  const [missing, setMissing] = useState(false);
  const [checkAnswers, setCheckAnswers] = useState({});
  const [checkSubmitted, setCheckSubmitted] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);
  const [note, setNote] = useState("");
  const [noteSaved, setNoteSaved] = useState(false);

  const articleRef = useRef(null);
  const readingPct = useReadingProgress(articleRef);
  const reduce = useReducedMotion();

  const neighbours = useMemo(() => lessonNeighbours(tree, lessonId), [tree, lessonId]);
  const done = !!progress?.completedLessonIds?.includes(lessonId);
  const bookmarked = !!progress?.bookmarkedLessonIds?.includes(lessonId);
  const labDone = !!progress?.labsCompleted?.includes(lessonId);

  const checkSeed = buildQuizSeedKey({ uid: user?.uid, scope: `se:${lessonId}` });
  const draftKey = user ? `se:${user.uid}:${lessonId}` : null;

  // Full lesson body is fetched on open rather than carried in the course tree:
  // the tree holds ~90 lessons and shipping every body in it would make the
  // roadmap's first paint depend on the entire course's prose.
  useEffect(() => {
    if (!moduleId || !lessonId) return;
    let cancelled = false;
    setLesson(null);
    setMissing(false);
    fetchLesson(moduleId, lessonId)
      .then(l => { if (!cancelled) { if (l) setLesson(l); else setMissing(true); } })
      .catch(() => { if (!cancelled) setMissing(true); });
    return () => { cancelled = true; };
  }, [moduleId, lessonId]);

  useEffect(() => {
    if (!user || !moduleId || !lessonId) return;
    markLessonOpened(user.uid, moduleId, lessonId).catch(() => {});
  }, [user, moduleId, lessonId]);

  useEffect(() => { setNote(progress?.notes?.[lessonId] || ""); }, [progress, lessonId]);

  // Restore an in-progress or already-submitted knowledge check - a refresh must
  // never silently reset unsubmitted answers to blank.
  useEffect(() => {
    if (!draftKey) { setCheckAnswers({}); setCheckSubmitted(false); return; }
    const draft = loadQuizDraft(draftKey);
    setCheckAnswers(draft?.answers || {});
    setCheckSubmitted(!!draft?.submitted);
  }, [draftKey]);

  useEffect(() => {
    if (!draftKey) return;
    saveQuizDraft(draftKey, { answers: checkAnswers, submitted: checkSubmitted });
  }, [draftKey, checkAnswers, checkSubmitted]);

  const checks = lesson?.knowledgeChecks || [];
  const checksPending = checks.length > 0 && !checkSubmitted;

  const submitChecks = async () => {
    setCheckSubmitted(true);
    const correct = checks.reduce((n, q, i) => n + (checkAnswers[i] === q.correctIndex ? 1 : 0), 0);
    if (user) {
      await recordKnowledgeCheck({ uid: user.uid, lessonId, correct, total: checks.length }).catch(() => {});
      await reloadProgress();
    }
  };

  const handleComplete = async () => {
    if (!user) return;
    setCompleting(true);
    try {
      const isNew = await completeLesson({
        uid: user.uid, moduleId, lessonId,
        xpReward: lesson.xpReward || 20, coinReward: lesson.coinReward || 8,
      });
      setJustCompleted(isNew);
      await reloadProgress();
    } finally {
      setCompleting(false);
    }
  };

  if (missing) {
    return (
      <SeEmpty icon={AlertTriangle} title="Lesson not found"
        description="This lesson has been removed or unpublished since your link was created."
        action={<SeButton size="sm" variant="secondary" onClick={() => go({ moduleId, lessonId: null })}>Back to the module</SeButton>} />
    );
  }

  if (!lesson) {
    return (
      <div className="space-y-4 max-w-3xl">
        <div className="h-4 w-40 animate-pulse rounded bg-white/[0.04]" />
        <div className="h-9 w-3/4 animate-pulse rounded bg-white/[0.04]" />
        <SeCard className="p-6"><div className="h-64 animate-pulse rounded bg-white/[0.03]" /></SeCard>
      </div>
    );
  }

  const video = videoState(lesson);
  const hasBody = !!(lesson.concept?.trim() || lesson.story?.trim());

  return (
    <div className="max-w-3xl">
      {/* breadcrumb */}
      <nav className="flex items-center gap-1.5 font-mono text-[11px] mb-5 flex-wrap">
        <button onClick={() => go({ moduleId: null, lessonId: null })} className="text-white/25 hover:text-white/60 transition-colors">
          Fundamentals
        </button>
        <span className="text-white/15">/</span>
        <button onClick={() => go({ moduleId, lessonId: null })} className="text-white/25 hover:text-white/60 transition-colors">
          Module {mod?.number}
        </button>
        <span className="text-white/15">/</span>
        <span className="text-white/50">{lesson.title}</span>
      </nav>

      {/* header */}
      <div className="mb-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <SeChip color={accent}>MODULE {mod?.number}</SeChip>
              {lesson.difficulty && <SeChip color="rgba(255,255,255,0.28)">{lesson.difficulty.toUpperCase()}</SeChip>}
              {lesson.estimatedMinutes > 0 && (
                <span className="flex items-center gap-1 font-mono text-[10.5px] text-white/25">
                  <Clock size={10} /> {lesson.estimatedMinutes} min read
                </span>
              )}
              {neighbours.index >= 0 && (
                <span className="font-mono text-[10.5px] text-white/20">
                  {neighbours.index + 1} of {neighbours.total}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-[28px] font-bold tracking-tight text-white/95 leading-tight">
              {lesson.title}
            </h1>
            {lesson.subtitle && (
              <p className="text-[14px] mt-2 leading-relaxed" style={{ color: `${accent}CC` }}>{lesson.subtitle}</p>
            )}
          </div>
          {user && (
            <button
              onClick={async () => {
                await toggleBookmark({ uid: user.uid, lessonId, on: !bookmarked }).catch(() => {});
                await reloadProgress();
              }}
              title={bookmarked ? "Remove bookmark" : "Bookmark this lesson"}
              className="p-1.5 rounded flex-shrink-0 transition-colors"
              style={{ color: bookmarked ? SE_ACCENT.gold : "rgba(255,255,255,0.25)" }}>
              {bookmarked ? <BookmarkCheck size={17} /> : <Bookmark size={17} />}
            </button>
          )}
        </div>
      </div>

      {/* the video slot - always present, playback gated on status */}
      <div className="mb-6">
        <SeVideoSlot state={video} lessonTitle={lesson.title} />
      </div>

      {!hasBody ? (
        <SeEmpty icon={FileText} title="This lesson is being written"
          description="It's on the curriculum and its place in the course is fixed, but the body hasn't been authored yet. The rest of the module is readable now."
          action={
            <div className="flex items-center gap-2 flex-wrap">
              <SeButton size="sm" variant="secondary" onClick={() => go({ moduleId, lessonId: null })}>Back to the module</SeButton>
              {neighbours.next && (
                <SeButton size="sm" icon={ArrowRight}
                  onClick={() => go({ moduleId: neighbours.next.moduleId, lessonId: neighbours.next.id })}>
                  Next lesson
                </SeButton>
              )}
            </div>
          } />
      ) : (
        <article ref={articleRef} className="space-y-6">
          <SeReadingBar pct={readingPct} />

          {/* 1-2. objectives + prerequisites */}
          {lesson.learningObjectives?.length > 0 && (
            <ListSection sectionKey="learningObjectives" title="What you'll understand by the end"
              items={lesson.learningObjectives} color={SE_ACCENT.cyan} checkItems />
          )}
          {lesson.prerequisites?.length > 0 && (
            <ListSection sectionKey="prerequisites" title="Before this lesson"
              items={lesson.prerequisites} color={SE_ACCENT.purple} />
          )}

          {/* 3. the story - deliberately first, before any terminology */}
          {lesson.story?.trim() && (
            <TextSection sectionKey="story" title="Start here" color={SE_ACCENT.purple} text={lesson.story} />
          )}

          {/* 4. the problem the concept exists to solve */}
          {lesson.problemStatement?.trim() && (
            <TextSection sectionKey="problemStatement" title="The problem" color={SE_ACCENT.orange}
              text={lesson.problemStatement} />
          )}

          {/* 5. the main body - full sectioned reading experience with jump rail */}
          {lesson.concept?.trim() && (
            <div className="pt-1">
              <SeLessonBody text={lesson.concept} />
            </div>
          )}

          {/* 6. step-by-step walkthrough */}
          {lesson.walkthrough?.trim() && (
            <TextSection sectionKey="walkthrough" title="Step by step" color={SE_ACCENT.cyan}
              text={lesson.walkthrough} />
          )}

          {/* 7. mini demo */}
          {lesson.codeExample?.code?.trim() && <CodeBlock example={lesson.codeExample} />}

          {/* 8. common mistakes */}
          {lesson.commonMistakes?.length > 0 && (
            <ListSection sectionKey="commonMistakes" title="Where people go wrong"
              items={lesson.commonMistakes} color={SE_ACCENT.red} />
          )}

          {/* 9-10. industry + DeVert case study */}
          {lesson.industryPerspective?.trim() && (
            <TextSection sectionKey="industryPerspective" title="How the industry actually does it"
              color={SE_ACCENT.gold} text={lesson.industryPerspective} />
          )}
          {lesson.devertCaseStudy?.trim() && (
            <TextSection sectionKey="devertCaseStudy" title="Inside DeVert" color={SE_ACCENT.green}
              text={lesson.devertCaseStudy}
              footnote="This is the real architecture of the platform you're reading this on - not a simplified teaching example." />
          )}

          {/* 11. knowledge check */}
          {checks.length > 0 && (
            <KnowledgeCheck checks={checks} seedKey={checkSeed} answers={checkAnswers} submitted={checkSubmitted}
              onAnswer={(i, v) => setCheckAnswers(p => ({ ...p, [i]: v }))} onSubmit={submitChecks} />
          )}

          {/* 12. lab */}
          {(lesson.lab?.title?.trim() || lesson.lab?.brief?.trim()) && (
            <LabSection lab={lesson.lab} done={labDone} canToggle={!!user}
              onToggle={async () => {
                await toggleLabDone({ uid: user.uid, lessonId, done: !labDone }).catch(() => {});
                await reloadProgress();
              }} />
          )}

          {/* 13. assignment */}
          {lesson.assignment && <AssignmentSection assignment={lesson.assignment} />}

          {/* 14. summary */}
          {lesson.summary?.trim() && (
            <SeCard className="p-5" style={{ background: `${SE_ACCENT.green}0A`, border: `1px solid ${SE_ACCENT.green}2E` }}>
              <div className="flex items-center gap-2 mb-2.5">
                <CheckCircle2 size={13} style={{ color: SE_ACCENT.green }} />
                <SeLabel color={SE_ACCENT.green}>THE WHOLE LESSON IN ONE PARAGRAPH</SeLabel>
              </div>
              <p className="text-[13.5px] leading-relaxed whitespace-pre-wrap text-white/70">
                <Inline text={lesson.summary} />
              </p>
            </SeCard>
          )}

          {/* 15. going deeper */}
          {lesson.goingDeeper?.trim() && <GoingDeeper text={lesson.goingDeeper} />}

          {/* 16. resources */}
          {lesson.resources?.length > 0 && <ResourceList resources={lesson.resources} />}

          {/* personal notes */}
          {user && (
            <SeCard className="p-4">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <Notebook size={13} className="text-white/25" />
                  <SeLabel>YOUR NOTES ON THIS LESSON</SeLabel>
                </div>
                {noteSaved && <span className="font-mono text-[10px]" style={{ color: SE_ACCENT.green }}>saved</span>}
              </div>
              <textarea value={note} onChange={e => setNote(e.target.value)} rows={3} maxLength={4000}
                placeholder="Your own wording beats anyone else's. What clicked, what didn't?"
                className="w-full text-[13px] px-3 py-2 rounded-lg outline-none resize-y text-white/80 placeholder:text-white/20"
                style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.08)" }} />
              <SeButton size="sm" variant="secondary" className="mt-2"
                onClick={async () => {
                  await saveLessonNote({ uid: user.uid, lessonId, text: note }).catch(() => {});
                  setNoteSaved(true);
                  setTimeout(() => setNoteSaved(false), 2000);
                  await reloadProgress();
                }}>
                Save note
              </SeButton>
            </SeCard>
          )}

          {/* completion */}
          <SeCard className="p-5">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="min-w-0">
                <b className="text-[14px] text-white/90 block">
                  {done ? "Lesson complete" : "Mark this lesson complete"}
                </b>
                {!done && (
                  <p className="flex items-center gap-3 font-mono text-[11px] mt-1 text-white/35">
                    <span className="flex items-center gap-1"><Zap size={11} /> +{lesson.xpReward || 20} XP</span>
                    <span className="flex items-center gap-1"><Coins size={11} /> +{lesson.coinReward || 8} coins</span>
                  </p>
                )}
                {!done && checksPending && (
                  <p className="text-[11.5px] mt-1.5" style={{ color: SE_ACCENT.orange }}>
                    Answer the knowledge check above to unlock this.
                  </p>
                )}
                {!user && (
                  <p className="text-[11.5px] mt-1.5 text-white/35">Sign in to track progress and earn XP.</p>
                )}
              </div>
              {done ? (
                <SeChip color={SE_ACCENT.green} icon={Check}>DONE</SeChip>
              ) : (
                <SeButton onClick={handleComplete} disabled={completing || !user || checksPending}>
                  {completing ? "Saving..." : "Complete lesson"}
                </SeButton>
              )}
            </div>
          </SeCard>

          {justCompleted && (
            <motion.p
              initial={reduce ? false : { opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              className="text-[12.5px] text-center px-3 py-2.5 rounded-lg flex items-center justify-center gap-2"
              style={{ background: `${SE_ACCENT.green}14`, color: SE_ACCENT.green }}>
              <Sparkles size={13} /> Lesson complete. XP and coins added.
            </motion.p>
          )}
        </article>
      )}

      {/* prev / next */}
      <div className="flex items-center justify-between gap-3 mt-8 pt-6"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        {neighbours.prev ? (
          <button onClick={() => go({ moduleId: neighbours.prev.moduleId, lessonId: neighbours.prev.id })}
            className="flex items-center gap-2 text-left min-w-0 group">
            <ChevronLeft size={15} className="text-white/25 flex-shrink-0 group-hover:text-white/60 transition-colors" />
            <span className="min-w-0">
              <span className="block font-mono text-[9.5px] tracking-wider text-white/25">PREVIOUS</span>
              <span className="block text-[12.5px] text-white/60 truncate group-hover:text-white/90 transition-colors">
                {neighbours.prev.title}
              </span>
            </span>
          </button>
        ) : <span />}
        {neighbours.next ? (
          <button onClick={() => go({ moduleId: neighbours.next.moduleId, lessonId: neighbours.next.id })}
            className="flex items-center gap-2 text-right min-w-0 group ml-auto">
            <span className="min-w-0">
              <span className="block font-mono text-[9.5px] tracking-wider text-white/25">NEXT</span>
              <span className="block text-[12.5px] text-white/60 truncate group-hover:text-white/90 transition-colors">
                {neighbours.next.title}
              </span>
            </span>
            <ArrowRight size={15} className="text-white/25 flex-shrink-0 group-hover:text-white/60 transition-colors" />
          </button>
        ) : <span />}
      </div>
    </div>
  );
}

// ---------------- section primitives ----------------

function TextSection({ sectionKey, title, color, text, footnote }) {
  const Icon = SECTION_ICON[sectionKey] || Lightbulb;
  return (
    <SeCard className="p-5" style={{ background: `${color}08`, border: `1px solid ${color}26` }}>
      <div className="flex items-center gap-2 mb-3">
        <Icon size={13} style={{ color }} />
        <SeLabel color={color}>{title.toUpperCase()}</SeLabel>
      </div>
      <SeConcept text={text} />
      {footnote && <p className="text-[11px] mt-3 leading-relaxed text-white/30">{footnote}</p>}
    </SeCard>
  );
}

function ListSection({ sectionKey, title, items, color, checkItems = false }) {
  const Icon = SECTION_ICON[sectionKey] || ListChecks;
  return (
    <SeCard className="p-4" style={{ background: `${color}08`, border: `1px solid ${color}26` }}>
      <div className="flex items-center gap-2 mb-2.5">
        <Icon size={13} style={{ color }} />
        <SeLabel color={color}>{title.toUpperCase()}</SeLabel>
      </div>
      <ul className="space-y-1.5">
        {items.map((it, i) => (
          <li key={i} className="flex items-start gap-2 text-[13px] leading-relaxed text-white/65">
            {checkItems
              ? <CheckCircle2 size={13} className="flex-shrink-0 mt-[3px]" style={{ color }} />
              : <span className="mt-[8px] w-1 h-1 rounded-full flex-shrink-0" style={{ background: color }} />}
            <span><Inline text={it} /></span>
          </li>
        ))}
      </ul>
    </SeCard>
  );
}

// A read-only, copyable code block rather than an embedded editor. The Campus
// lesson renderer runs examples live through Judge0, but that pulls Monaco (~1MB)
// into the bundle, and these are illustrative five-line snippets rather than
// exercises. Making them runnable is a worthwhile follow-up, not a prerequisite -
// so this stays a static block with an honest expected output instead of a
// half-working Run button.
function CodeBlock({ example }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(example.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <SeTerminal label={`demo.${example.language || "txt"}`} accent={SE_ACCENT.cyan}>
      <div className="flex items-center justify-between px-4 py-2"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <span className="font-mono text-[10px] tracking-wider" style={{ color: SE_ACCENT.cyan }}>
          {(example.language || "code").toUpperCase()}
        </span>
        <button onClick={copy} className="flex items-center gap-1 font-mono text-[10px] text-white/30 hover:text-white/60 transition-colors">
          <Copy size={10} /> {copied ? "copied" : "copy"}
        </button>
      </div>
      <pre className="font-mono text-[12.5px] leading-relaxed p-4 overflow-x-auto text-white/75"
        style={{ background: "rgba(0,0,0,0.35)" }}>{example.code}</pre>
      {example.expectedOutput && (
        <div className="px-4 py-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <SeLabel color={SE_ACCENT.green} className="mb-1.5">OUTPUT</SeLabel>
          <pre className="font-mono text-[12px] whitespace-pre-wrap text-white/60">{example.expectedOutput}</pre>
        </div>
      )}
    </SeTerminal>
  );
}

// The graded check, distinct from the inline `::: checkpoint` blocks in the
// lesson body: this one is recorded, and it gates completion. Shuffled for
// display but graded against the ORIGINAL index, so the stored answers map keeps
// its meaning regardless of render order.
function KnowledgeCheck({ checks, seedKey, answers, submitted, onAnswer, onSubmit }) {
  const shuffled = useMemo(() => shuffleQuizForAttempt(checks, seedKey), [checks, seedKey]);
  const score = checks.reduce((n, q, i) => n + (answers[i] === q.correctIndex ? 1 : 0), 0);
  const allAnswered = Object.keys(answers).length >= checks.length;

  return (
    <SeTerminal label="knowledge_check.sh" accent={SE_ACCENT.gold}>
      <div className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <ListChecks size={14} style={{ color: SE_ACCENT.gold }} />
          <SeLabel color={SE_ACCENT.gold}>KNOWLEDGE CHECK</SeLabel>
        </div>

        <div className="space-y-5">
          {shuffled.map((q, i) => (
            <div key={q._origIndex}>
              <p className="text-[13.5px] font-medium mb-2.5 text-white/85">{i + 1}. {q.question}</p>
              <div className="space-y-1.5">
                {q.options.map(opt => {
                  const selected = answers[q._origIndex] === opt.originalIndex;
                  const isCorrect = submitted && opt.originalIndex === q.correctIndex;
                  const isWrong = submitted && selected && opt.originalIndex !== q.correctIndex;
                  const border = isCorrect ? SE_ACCENT.green : isWrong ? SE_ACCENT.red
                    : selected ? SE_ACCENT.cyan : "rgba(255,255,255,0.1)";
                  return (
                    <button key={opt.originalIndex} disabled={submitted}
                      onClick={() => onAnswer(q._origIndex, opt.originalIndex)}
                      className="w-full flex items-start gap-2 text-left text-[12.5px] px-3 py-2 rounded-lg transition-colors"
                      style={{
                        background: isCorrect ? `${SE_ACCENT.green}12` : isWrong ? `${SE_ACCENT.red}12`
                          : selected ? `${SE_ACCENT.cyan}12` : "rgba(255,255,255,0.02)",
                        border: `1px solid ${border}`,
                        color: "rgba(255,255,255,0.8)",
                      }}>
                      {isCorrect && <CheckCircle2 size={12} className="flex-shrink-0 mt-[2px]" style={{ color: SE_ACCENT.green }} />}
                      {isWrong && <XCircle size={12} className="flex-shrink-0 mt-[2px]" style={{ color: SE_ACCENT.red }} />}
                      <span className="flex-1">{opt.text}</span>
                    </button>
                  );
                })}
              </div>
              {submitted && checks[q._origIndex]?.explanation && (
                <p className="text-[12px] leading-relaxed mt-2 px-3 py-2 rounded-lg text-white/50"
                  style={{ background: "rgba(255,255,255,0.02)" }}>
                  {checks[q._origIndex].explanation}
                </p>
              )}
            </div>
          ))}
        </div>

        {!submitted ? (
          <div className="mt-4">
            <SeButton size="sm" onClick={onSubmit} disabled={!allAnswered}>
              Submit answers
            </SeButton>
            {!allAnswered && (
              <p className="font-mono text-[10.5px] mt-2 text-white/25">
                {checks.length - Object.keys(answers).length} question(s) left
              </p>
            )}
          </div>
        ) : (
          <p className="text-[13px] font-semibold mt-4"
            style={{ color: score === checks.length ? SE_ACCENT.green : SE_ACCENT.gold }}>
            {score} / {checks.length} correct
            {score === checks.length ? " - all right." : " - read the explanations above."}
          </p>
        )}
      </div>
    </SeTerminal>
  );
}

function LabSection({ lab, done, canToggle, onToggle }) {
  return (
    <SeTerminal label="lab.sh" accent={SE_ACCENT.green}>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
          <div className="flex items-center gap-2">
            <FlaskConical size={14} style={{ color: SE_ACCENT.green }} />
            <SeLabel color={SE_ACCENT.green}>HANDS-ON LAB</SeLabel>
          </div>
          {canToggle && (
            <button onClick={onToggle}
              className="flex items-center gap-1.5 font-mono text-[10.5px] px-2.5 py-1 rounded-full transition-colors"
              style={{
                background: done ? `${SE_ACCENT.green}14` : "rgba(255,255,255,0.03)",
                border: `1px solid ${done ? `${SE_ACCENT.green}55` : "rgba(255,255,255,0.1)"}`,
                color: done ? SE_ACCENT.green : "rgba(255,255,255,0.4)",
              }}>
              {done ? <><Check size={10} /> DONE</> : "MARK AS DONE"}
            </button>
          )}
        </div>

        {lab.title && <b className="block text-[14px] text-white/90 mb-2">{lab.title}</b>}
        {lab.brief && <div className="mb-3"><SeConcept text={lab.brief} /></div>}

        {lab.steps?.length > 0 && (
          <ol className="space-y-2 mt-3">
            {lab.steps.map((s, i) => (
              <li key={i} className="flex items-start gap-2.5 text-[12.5px] leading-relaxed text-white/60">
                <span className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 font-mono text-[10px] font-bold mt-[1px]"
                  style={{ background: `${SE_ACCENT.green}14`, color: SE_ACCENT.green }}>{i + 1}</span>
                <span><Inline text={s} /></span>
              </li>
            ))}
          </ol>
        )}

        {lab.starterCode?.trim() && (
          <pre className="font-mono text-[12px] p-3 rounded-lg overflow-x-auto mt-3 text-white/70"
            style={{ background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.07)" }}>
            {lab.starterCode}
          </pre>
        )}
      </div>
    </SeTerminal>
  );
}

const ASSIGNMENT_PARTS = [
  { key: "reading", label: "Read", icon: BookOpen },
  { key: "practice", label: "Practise", icon: Terminal },
  { key: "coding", label: "Build", icon: FlaskConical },
  { key: "reflection", label: "Reflect", icon: Lightbulb },
  { key: "observation", label: "Notice in the wild", icon: Eye },
];

function AssignmentSection({ assignment }) {
  const parts = ASSIGNMENT_PARTS.filter(p => assignment[p.key]?.trim());
  if (parts.length === 0) return null;
  return (
    <SeCard className="p-5" style={{ background: `${SE_ACCENT.purple}08`, border: `1px solid ${SE_ACCENT.purple}26` }}>
      <div className="flex items-center gap-2 mb-3">
        <Target size={13} style={{ color: SE_ACCENT.purple }} />
        <SeLabel color={SE_ACCENT.purple}>ASSIGNMENT</SeLabel>
      </div>
      <div className="space-y-3">
        {parts.map(p => (
          <div key={p.key} className="flex items-start gap-2.5">
            <span className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-[1px]"
              style={{ background: `${SE_ACCENT.purple}14`, color: SE_ACCENT.purple }}>
              <p.icon size={12} />
            </span>
            <div className="min-w-0">
              <span className="block font-mono text-[9.5px] tracking-wider mb-0.5" style={{ color: `${SE_ACCENT.purple}CC` }}>
                {p.label.toUpperCase()}
              </span>
              <p className="text-[12.5px] leading-relaxed text-white/60"><Inline text={assignment[p.key]} /></p>
            </div>
          </div>
        ))}
      </div>
    </SeCard>
  );
}

function GoingDeeper({ text }) {
  const [open, setOpen] = useState(false);
  return (
    <SeCard className="overflow-hidden">
      <button onClick={() => setOpen(o => !o)} aria-expanded={open}
        className="w-full flex items-center gap-2 p-4 text-left">
        <TrendingUp size={14} style={{ color: SE_ACCENT.purple, flexShrink: 0 }} />
        <span className="flex-1 text-[13px] font-semibold text-white/85">Going deeper</span>
        <SeChip color={SE_ACCENT.purple}>OPTIONAL</SeChip>
      </button>
      {open && (
        <div className="px-5 pb-5 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <SeConcept text={text} />
        </div>
      )}
    </SeCard>
  );
}

const RESOURCE_ICON = { pdf: Download, cheatsheet: FileText, notes: FileText, video: Film, link: ExternalLink, code: Terminal };

function ResourceList({ resources }) {
  return (
    <div>
      <SeLabel className="mb-2.5">RESOURCES</SeLabel>
      <div className="grid sm:grid-cols-2 gap-2.5">
        {resources.map((r, i) => {
          const Icon = RESOURCE_ICON[r.kind] || ExternalLink;
          const inner = (
            <div className="flex items-start gap-3">
              <span className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: `${SE_ACCENT.cyan}12`, color: SE_ACCENT.cyan }}>
                <Icon size={14} />
              </span>
              <div className="min-w-0 flex-1">
                <b className="block text-[12.5px] text-white/85 truncate">{r.title}</b>
                {r.description && <span className="block text-[11px] mt-0.5 text-white/35">{r.description}</span>}
              </div>
              {r.url && <ExternalLink size={12} className="text-white/20 flex-shrink-0" />}
            </div>
          );
          // rel="noreferrer": these are admin-authored links off-platform, and a
          // learner's session is not something to leak to third parties.
          return r.url ? (
            <SeCard key={i} hover accent={SE_ACCENT.cyan} as="a" href={r.url} target="_blank"
              rel="noreferrer noopener" className="p-3.5 block">
              {inner}
            </SeCard>
          ) : (
            <SeCard key={i} className="p-3.5">{inner}</SeCard>
          );
        })}
      </div>
    </div>
  );
}

// ---------------- reading progress ----------------

// Window-scroll based: this page scrolls the document, so there is no inner
// container to attach to. Returns 0-100 over the whole article, quiz and lab
// included - "80% through the lesson" has to mean the lesson.
function useReadingProgress(ref) {
  const [pct, setPct] = useState(0);

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const total = rect.height - window.innerHeight;
    // A lesson shorter than the viewport is "read" once it is on screen -
    // otherwise its bar sits at 0% forever with nothing left to scroll.
    if (total <= 0) { setPct(rect.top <= window.innerHeight * 0.5 ? 100 : 0); return; }
    const scrolled = Math.min(Math.max(-rect.top, 0), total);
    setPct(Math.round((scrolled / total) * 100));
  }, [ref]);

  useEffect(() => {
    // Deferred a frame rather than measured inline: measuring in the effect body
    // both sets state during commit and reads a layout that has not settled.
    const raf = requestAnimationFrame(measure);
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  return pct;
}
