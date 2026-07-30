"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft, ArrowRight, BookOpen, CheckCircle2, RotateCcw, Sparkles, XCircle,
} from "lucide-react";
import { CAMPUS } from "@/lib/campus-theme";
import {
  CampusCard, CampusButton, CampusSkeleton,
} from "@/components/campus/campus-ui";
import { useKeyedFetch } from "@/lib/useKeyedFetch";
import { dateKey } from "@/lib/gate";
import {
  fetchPyqs, buildPracticeSet, recordPyqAttempt, isPyqCorrect, PRACTICE_MODES,
  toggleBookmark, isBookmarked, normalizeAttempt,
} from "@/lib/gatePyq";
import { useGate, GateSignInPrompt, GateNoContent } from "@/components/campus/gate/gate-app";
import {
  GateSectionHeading, GateQuestion, GateSolution, GateStat, GateFilterRow,
  formatDuration,
} from "@/components/campus/gate/gate-ui";
import { useAuth } from "@/context/AuthContext";

// Topic Practice: untimed, immediate-feedback drilling over the previous-year
// bank, with the set composed for this student rather than picked by hand.
//
// The five modes come from lib/gatePyq.js's PRACTICE_MODES and are the honest
// version of "adaptive practice": weak topics, fresh questions, redo my
// mistakes, revision, or a mixed bag. There is no hidden difficulty ladder
// silently deciding what a student sees - each mode says exactly what it selects,
// and when a mode has nothing to offer (no weak topics yet, an empty mistake
// notebook) the UI says so and offers a mixed set instead of pretending.
//
// Practice is deliberately not scored against a clock or a leaderboard. Its
// value is volume with instant correction; the moment you put a rank on it,
// students start optimising for the number instead of learning.

export function GatePractice() {
  const { user } = useAuth();
  const { paper, tree, pyqProgress, notes } = useGate();

  const [mode, setMode] = useState("mixed");
  const [subjectId, setSubjectId] = useState(null);
  const [size, setSize] = useState(15);
  const [running, setRunning] = useState(false);
  // Bumped by "New set" - it feeds the selection seed (so the questions genuinely
  // change) AND the child's React key (so every scrap of per-question state is
  // discarded by remounting, rather than by a reset effect that has to remember
  // every field).
  const [setNonce, setSetNonce] = useState(0);
  const [pyqs] = useKeyedFetch(paper?.id, () => fetchPyqs(paper.id), { fallback: [] });

  const subjectOptions = useMemo(
    () => (tree || []).map(s => ({ v: s.id, label: s.name })),
    [tree]);

  // Seeded on the day, so a set generated this morning is the same set this
  // afternoon - reshuffling under someone mid-practice is disorienting. dayKey is
  // read here rather than inside buildPracticeSet so the selection stays a pure
  // function of its inputs.
  const preview = useMemo(() => {
    if (!pyqs?.length || !user) return { questions: [], poolSize: 0, fellBack: false };
    return buildPracticeSet({
      pyqs, progress: pyqProgress, notes, mode, size, subjectId,
      seed: `${user.uid}:${mode}:${subjectId || "all"}:${dateKey()}:${setNonce}`,
    });
  }, [pyqs, pyqProgress, notes, mode, size, subjectId, user, setNonce]);

  if (!user) return <GateSignInPrompt what="your practice history" />;
  if (pyqs === null) return <CampusCard className="p-4"><CampusSkeleton height={200} /></CampusCard>;
  if (pyqs.length === 0) {
    return <GateNoContent what="practice questions"
      hint="Topic practice draws from the previous-year question bank. Once a platform admin publishes questions for this paper, practice sets generate automatically." />;
  }

  if (running) {
    return <PracticeSession key={setNonce} questions={preview.questions}
      onExit={() => setRunning(false)}
      onRestart={() => setSetNonce(n => n + 1)} />;
  }

  const attemptedCount = Object.keys(pyqProgress?.attempted || {}).length;
  const solvedCount = Object.values(pyqProgress?.attempted || {})
    .filter(a => normalizeAttempt(a).everCorrect).length;

  return (
    <div className="space-y-5">
      <GateSectionHeading label="TOPIC PRACTICE" icon={BookOpen} title="Practice"
        description="Untimed drilling with the solution one tap away. Pick what the set should be made of, then work through it - every attempt feeds your analytics and your mistake notebook." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <GateStat label="Questions attempted" value={attemptedCount} color={CAMPUS.teal} />
        <GateStat label="Ever solved" value={solvedCount} color={CAMPUS.good} />
        <GateStat label="In the bank" value={pyqs.length} color={CAMPUS.blue} />
        <GateStat label="Never attempted" value={Math.max(0, pyqs.length - attemptedCount)} color={CAMPUS.warn} />
      </div>

      <CampusCard className="p-4 space-y-4">
        <div>
          <p className="text-[9.5px] font-mono tracking-widest mb-2" style={{ color: CAMPUS.inkFaint }}>WHAT SHOULD THIS SET BE MADE OF?</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {PRACTICE_MODES.map(m => {
              const active = m.key === mode;
              return (
                <button key={m.key} onClick={() => setMode(m.key)}
                  className="text-left p-3 rounded-xl transition-colors"
                  style={{
                    background: active ? CAMPUS.tealTint : CAMPUS.paper,
                    border: `1px solid ${active ? CAMPUS.teal : CAMPUS.line}`,
                  }}>
                  <b className="block text-[12.5px] mb-0.5" style={{ color: active ? CAMPUS.teal : CAMPUS.ink }}>{m.label}</b>
                  <span className="block text-[11px] leading-snug" style={{ color: CAMPUS.inkFaint }}>{m.detail}</span>
                </button>
              );
            })}
          </div>
        </div>

        <GateFilterRow label="SUBJECT" options={subjectOptions} value={subjectId} onChange={setSubjectId}
          allLabel="Every subject" />

        <div>
          <p className="text-[9.5px] font-mono tracking-widest mb-1.5" style={{ color: CAMPUS.inkFaint }}>HOW MANY QUESTIONS</p>
          <div className="flex gap-1.5">
            {[10, 15, 25, 40].map(n => (
              <button key={n} onClick={() => setSize(n)}
                className="text-[12px] font-mono font-semibold px-3 py-1.5 rounded-lg"
                style={{
                  background: size === n ? CAMPUS.tealTint : CAMPUS.paper,
                  border: `1px solid ${size === n ? CAMPUS.teal : CAMPUS.line}`,
                  color: size === n ? CAMPUS.teal : CAMPUS.inkSoft,
                }}>
                {n}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 flex-wrap pt-1" style={{ borderTop: `1px solid ${CAMPUS.line}` }}>
          <div className="pt-3">
            <p className="text-[12.5px]" style={{ color: CAMPUS.inkSoft }}>
              {preview.questions.length === 0
                ? "Nothing available for that combination."
                : <>This set: <b style={{ color: CAMPUS.ink }}>{preview.questions.length} questions</b> from a pool of {preview.poolSize}.</>}
            </p>
            {preview.fellBack && (
              <p className="text-[11.5px] mt-0.5" style={{ color: CAMPUS.warn }}>
                Nothing matched &quot;{PRACTICE_MODES.find(m => m.key === mode)?.label}&quot; yet - showing a mixed set instead.
              </p>
            )}
          </div>
          <CampusButton className="mt-3" disabled={preview.questions.length === 0}
            onClick={() => setRunning(true)}>
            Start practising
          </CampusButton>
        </div>
      </CampusCard>
    </div>
  );
}

// One question at a time, answered then checked then explained. Deliberately not
// a scrollable list of twenty questions: the whole point of practice is the
// feedback loop, and a list invites answering everything first and reading
// nothing.
function PracticeSession({ questions, onExit, onRestart }) {
  const { user } = useAuth();
  const { paper, notes, reload } = useGate();

  const [index, setIndex] = useState(0);

  // Per-question state is keyed by question index rather than reset by an effect,
  // so a checked answer can never bleed into the next question and there is no
  // render in between where it has. `Date.now()` is read inside the effect below,
  // never during render - calling it in a useRef initializer runs it on every
  // render and is an impure read (react-hooks/purity).
  const [attempt, setAttempt] = useState({ key: 0, answer: null, checked: false });
  const answer = attempt.key === index ? attempt.answer : null;
  const checked = attempt.key === index ? attempt.checked : false;
  const setAnswer = (v) => setAttempt({ key: index, answer: v, checked: false });

  const [results, setResults] = useState({});
  const startedAt = useRef(0);

  const question = questions[index];
  const done = Object.keys(results).length;

  useEffect(() => { startedAt.current = Date.now(); }, [index]);

  const check = async () => {
    if (!question) return;
    const timeSec = Math.round((Date.now() - startedAt.current) / 1000);
    // The PYQ document carries its own answer data, so grading uses the exact
    // same comparison a test does - imported, not reimplemented.
    const correct = isPyqCorrect(question, question, answer);
    setAttempt({ key: index, answer, checked: true });
    setResults(r => ({ ...r, [question.id]: { correct, timeSec } }));
    if (user) {
      await recordPyqAttempt({ uid: user.uid, paperId: paper.id, pyq: question, given: answer, correct, timeSec })
        .catch(() => {});
      // The notebook and the topic rollups both changed - refresh them so the
      // Overview and Mistakes screens are correct the moment practice ends.
      await Promise.all([reload.pyqProgress(), reload.notes()]).catch(() => {});
    }
  };

  if (!question) {
    const correctCount = Object.values(results).filter(r => r.correct).length;
    const totalTime = Object.values(results).reduce((n, r) => n + (r.timeSec || 0), 0);
    return (
      <div className="space-y-4">
        <CampusCard className="p-6 text-center">
          <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ background: CAMPUS.goodTint, color: CAMPUS.good }}>
            <Sparkles size={22} />
          </div>
          <h2 className="text-[17px] font-bold mb-1" style={{ color: CAMPUS.ink }}>Session complete</h2>
          <p className="text-[13px] mb-4" style={{ color: CAMPUS.inkSoft }}>
            {correctCount} of {done} correct · {formatDuration(totalTime)} total ·
            {" "}{done > 0 ? Math.round(totalTime / done) : 0}s average per question
          </p>
          <div className="flex items-center justify-center gap-2">
            <CampusButton variant="secondary" icon={RotateCcw} onClick={onRestart}>New set</CampusButton>
            <CampusButton onClick={onExit}>Back to practice</CampusButton>
          </div>
        </CampusCard>
        {done > correctCount && (
          <CampusCard className="p-4">
            <p className="text-[12.5px]" style={{ color: CAMPUS.inkSoft }}>
              The {done - correctCount} you missed are now in your Mistakes Notebook, filed under their topics.
            </p>
          </CampusCard>
        )}
      </div>
    );
  }

  const result = results[question.id];
  const bookmarked = isBookmarked(notes, "pyq", question.id);

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <button onClick={onExit} className="flex items-center gap-1.5 text-xs font-medium" style={{ color: CAMPUS.inkFaint }}>
          <ArrowLeft size={12} /> End session
        </button>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono" style={{ color: CAMPUS.inkFaint }}>
            {index + 1} / {questions.length}
          </span>
          <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ background: CAMPUS.line }}>
            <div className="h-full rounded-full" style={{ width: `${((index + 1) / questions.length) * 100}%`, background: CAMPUS.teal }} />
          </div>
        </div>
      </div>

      <GateQuestion question={question} index={index} total={questions.length}
        answer={answer} onAnswer={setAnswer}
        mode={checked ? "review" : "answer"}
        answerKey={checked ? question : null}
        bookmarked={bookmarked}
        onToggleBookmark={user ? async () => {
          await toggleBookmark({ uid: user.uid, paperId: paper.id, kind: "pyq", id: question.id, on: !bookmarked }).catch(() => {});
          await reload.notes();
        } : undefined}
        timeSec={result?.timeSec} />

      {checked && (
        <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl"
          style={{
            background: result?.correct ? CAMPUS.goodTint : CAMPUS.badTint,
            border: `1px solid ${result?.correct ? CAMPUS.good : CAMPUS.bad}40`,
          }}>
          {result?.correct
            ? <CheckCircle2 size={15} style={{ color: CAMPUS.good, flexShrink: 0 }} />
            : <XCircle size={15} style={{ color: CAMPUS.bad, flexShrink: 0 }} />}
          <span className="text-[12.5px] font-semibold" style={{ color: result?.correct ? CAMPUS.good : CAMPUS.bad }}>
            {result?.correct ? "Correct." : "Not correct - read the solution below before moving on."}
          </span>
        </div>
      )}

      {checked && <GateSolution answerKey={question} defaultOpen={!result?.correct} />}

      <div className="flex items-center justify-between gap-3">
        <CampusButton variant="secondary" disabled={index === 0} onClick={() => setIndex(i => i - 1)}>
          Previous
        </CampusButton>
        {!checked ? (
          <CampusButton onClick={check} disabled={answer === null || answer === "" || (Array.isArray(answer) && !answer.length)}>
            Check answer
          </CampusButton>
        ) : (
          <CampusButton icon={ArrowRight} onClick={() => setIndex(i => i + 1)}>
            {index === questions.length - 1 ? "Finish session" : "Next question"}
          </CampusButton>
        )}
      </div>
    </div>
  );
}
