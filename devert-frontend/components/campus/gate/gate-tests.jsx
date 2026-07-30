"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle, ArrowLeft, ArrowRight, Award, BarChart3, Brain, CheckCircle2,
  ClipboardList, Clock, Flag, Gauge, ListChecks, Lock, MinusCircle, Play,
  SkipForward, Target, Timer, Trophy, XCircle, Repeat,
} from "lucide-react";
import { CAMPUS } from "@/lib/campus-theme";
import {
  CampusCard, CampusChip, CampusButton, CampusSkeleton, CampusEmptyState,
  CampusBackButton, CampusProgressBar,
} from "@/components/campus/campus-ui";
import {
  fetchTests, fetchTest, fetchTestQuestions, fetchAttempt, startAttempt,
  saveAttemptAnswer, submitAndGrade, gradeGateTest, fetchTestAnswerKeys,
  analyseTiming, analyseConfidence, estimateRank, testTypeLabel, TEST_TYPES,
} from "@/lib/gateTests";
import { recordTestMistakes } from "@/lib/gatePyq";
import { useKeyedFetch } from "@/lib/useKeyedFetch";
import { useGate, GateSignInPrompt, GateNoContent } from "@/components/campus/gate/gate-app";
import {
  GateSectionHeading, GateStat, GateQuestion, GateSolution, GateQuestionPalette,
  GateBarList, GateEstimateNote, GateProgressRing, formatClock, formatDuration, formatMarks,
} from "@/components/campus/gate/gate-ui";
import { useAuth } from "@/context/AuthContext";

// ---------------- test list ----------------

// `kinds` splits the same catalog into the Mock Tests and Subject Tests screens -
// see gate-app.jsx's MocksRoute/SubjectTestsRoute for why that is a filter and
// not two components.
export function GateTestList({ kinds, title, description }) {
  const { user } = useAuth();
  const { paper, attempts, go } = useGate();
  const [typeFilter, setTypeFilter] = useState(null);
  const [tests] = useKeyedFetch(paper?.id, () => fetchTests(paper.id), { fallback: [] });

  const attemptByTest = useMemo(() => {
    const m = new Map();
    for (const a of attempts) m.set(a.testId, a);
    return m;
  }, [attempts]);

  if (tests === null) return <CampusCard className="p-4"><CampusSkeleton height={200} /></CampusCard>;

  const scoped = tests.filter(t => kinds.includes(t.testType));
  const shown = typeFilter ? scoped.filter(t => t.testType === typeFilter) : scoped;
  const availableTypes = TEST_TYPES.filter(t => kinds.includes(t.key) && scoped.some(s => s.testType === t.key));

  if (scoped.length === 0) {
    return (
      <div className="space-y-5">
        <GateSectionHeading label="TESTS" icon={ClipboardList} title={title} description={description} />
        <GateNoContent what="tests"
          hint="Tests are authored in /admin > GATE > Tests, question by question or by bulk import. Each one is timed, single-attempt, and marked exactly as GATE marks." />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <GateSectionHeading label="TESTS" icon={ClipboardList} title={title} description={description} />

      {availableTypes.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
          {[{ key: null, label: "All" }, ...availableTypes].map(t => {
            const active = typeFilter === t.key;
            return (
              <button key={String(t.key)} onClick={() => setTypeFilter(t.key)}
                className="text-[12px] font-semibold px-3 py-1.5 rounded-full whitespace-nowrap flex-shrink-0"
                style={{
                  background: active ? CAMPUS.tealTint : CAMPUS.paper,
                  border: `1px solid ${active ? CAMPUS.teal : CAMPUS.line}`,
                  color: active ? CAMPUS.teal : CAMPUS.inkSoft,
                }}>
                {t.label}
              </button>
            );
          })}
        </div>
      )}

      {!user && <GateSignInPrompt what="your test attempts" />}

      <div className="grid sm:grid-cols-2 gap-4">
        {shown.map(test => {
          const attempt = attemptByTest.get(test.id);
          return <TestCard key={test.id} test={test} attempt={attempt}
            onOpen={() => go(kinds.includes("full") ? "mocks" : "subjectTests", { testId: test.id })} />;
        })}
      </div>
    </div>
  );
}

function TestCard({ test, attempt, onOpen }) {
  const submitted = !!attempt?.submitted;
  const pct = submitted && attempt.maxScore
    ? Math.round((Math.max(0, attempt.score) / attempt.maxScore) * 100) : null;

  return (
    <CampusCard hover className="p-4 cursor-pointer flex flex-col" onClick={onOpen}>
      <div className="flex items-start gap-2 mb-2 flex-wrap">
        <b className="text-[14px] flex-1 min-w-0" style={{ color: CAMPUS.ink }}>{test.title}</b>
        <CampusChip color={CAMPUS.blue}>{testTypeLabel(test.testType).toUpperCase()}</CampusChip>
      </div>
      {test.description && (
        <p className="text-[11.5px] leading-relaxed mb-3 flex-1" style={{ color: CAMPUS.inkSoft }}>{test.description}</p>
      )}
      <div className="flex items-center gap-3 text-[10.5px] font-mono mb-3 flex-wrap" style={{ color: CAMPUS.inkFaint }}>
        <span className="flex items-center gap-1"><ListChecks size={10} /> {test.questionCount || 0} questions</span>
        <span className="flex items-center gap-1"><Clock size={10} /> {test.durationMinutes} min</span>
        <span className="flex items-center gap-1"><Award size={10} /> {test.totalMarks || 0} marks</span>
        {test.sourceYear && <span>GATE {test.sourceYear}</span>}
      </div>

      {submitted ? (
        <div>
          <div className="flex items-baseline justify-between gap-2 mb-1.5">
            <span className="text-[12.5px] font-semibold" style={{ color: CAMPUS.ink }}>
              {formatMarks(attempt.score)} / {attempt.maxScore}
            </span>
            <span className="text-[11px] font-mono" style={{ color: CAMPUS.inkFaint }}>
              {attempt.accuracy}% accuracy
            </span>
          </div>
          <CampusProgressBar pct={pct} color={pct >= 60 ? CAMPUS.good : pct >= 35 ? CAMPUS.warn : CAMPUS.bad} />
          <p className="text-[10.5px] mt-1.5" style={{ color: CAMPUS.teal }}>View full analysis</p>
        </div>
      ) : attempt ? (
        <p className="flex items-center gap-1.5 text-[11.5px] font-semibold" style={{ color: CAMPUS.warn }}>
          <Timer size={12} /> Attempt in progress - resume
        </p>
      ) : (
        <p className="flex items-center gap-1.5 text-[11.5px] font-semibold" style={{ color: CAMPUS.teal }}>
          <Play size={12} /> Not attempted yet
        </p>
      )}
    </CampusCard>
  );
}

// ---------------- test flow ----------------

// One attempt per test, and the state machine that follows from it:
//   no attempt          -> instructions
//   attempt, unsubmitted -> live attempt (resumable - a closed tab is not a
//                          forfeited paper, and the clock keeps running from the
//                          server-recorded start time either way)
//   attempt, submitted   -> results
export function GateTestFlow() {
  const { user } = useAuth();
  const { paper, screen, go, reload } = useGate();
  const testId = screen.testId;

  const [test, setTest] = useState(null);
  const [questions, setQuestions] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [phase, setPhase] = useState("loading");
  const [busy, setBusy] = useState(false);

  const backTarget = screen.section === "mocks" ? "mocks" : "subjectTests";

  useEffect(() => {
    if (!testId) return;
    let cancelled = false;
    (async () => {
      const [t, qs, a] = await Promise.all([
        fetchTest(testId),
        fetchTestQuestions(testId).catch(() => []),
        user ? fetchAttempt(user.uid, testId).catch(() => null) : Promise.resolve(null),
      ]);
      if (cancelled) return;
      setTest(t);
      setQuestions(qs);
      setAttempt(a);
      setPhase(!t ? "missing" : a?.submitted ? "results" : a ? "attempt" : "instructions");
    })();
    return () => { cancelled = true; };
  }, [testId, user]);

  const begin = async () => {
    if (!user || !test) return;
    setBusy(true);
    try {
      await startAttempt({
        uid: user.uid, paperId: paper.id, testId,
        testType: test.testType, durationMinutes: test.durationMinutes,
      });
      // Re-read rather than trusting the local object: startedAt was written as
      // serverTimestamp() and the authoritative value only exists after the
      // write lands. The whole timer depends on it.
      const fresh = await fetchAttempt(user.uid, testId);
      setAttempt(fresh);
      setPhase(fresh?.submitted ? "results" : "attempt");
    } finally {
      setBusy(false);
    }
  };

  if (phase === "loading") return <CampusCard className="p-4"><CampusSkeleton height={280} /></CampusCard>;
  if (phase === "missing") {
    return (
      <div>
        <CampusBackButton onClick={() => go(backTarget)} label="Back to tests" />
        <CampusEmptyState icon={AlertTriangle} title="Test not found"
          description="This test has been removed or unpublished since your link was created." />
      </div>
    );
  }

  if (phase === "instructions") {
    return <TestInstructions test={test} questions={questions} busy={busy}
      onBack={() => go(backTarget)} onBegin={begin} signedIn={!!user} />;
  }

  if (phase === "attempt") {
    return <TestAttempt test={test} questions={questions} attempt={attempt}
      onSubmitted={async (result) => {
        setAttempt(a => ({ ...a, ...result.stored, submitted: true, graded: true }));
        setPhase("results");
        await reload.attempts();
      }} />;
  }

  return <TestResults test={test} questions={questions} attempt={attempt} onBack={() => go(backTarget)} />;
}

// ---------------- instructions ----------------

function TestInstructions({ test, questions, onBack, onBegin, busy, signedIn }) {
  const marks1 = questions.filter(q => q.marks === 1).length;
  const marks2 = questions.filter(q => q.marks === 2).length;
  const byType = questions.reduce((acc, q) => ({ ...acc, [q.questionType]: (acc[q.questionType] || 0) + 1 }), {});

  return (
    <div className="max-w-2xl">
      <CampusBackButton onClick={onBack} label="Back to tests" />

      <CampusCard className="p-5">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <CampusChip color={CAMPUS.blue}>{testTypeLabel(test.testType).toUpperCase()}</CampusChip>
          {test.sourceYear && <CampusChip color={CAMPUS.gold}>GATE {test.sourceYear}</CampusChip>}
        </div>
        <h1 className="text-xl font-bold mb-1.5" style={{ color: CAMPUS.ink }}>{test.title}</h1>
        {test.description && (
          <p className="text-[13px] leading-relaxed mb-4" style={{ color: CAMPUS.inkSoft }}>{test.description}</p>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <GateStat label="Questions" value={questions.length} icon={ListChecks} color={CAMPUS.teal} />
          <GateStat label="Marks" value={test.totalMarks || 0} icon={Award} color={CAMPUS.gold} />
          <GateStat label="Duration" value={`${test.durationMinutes}m`} icon={Clock} color={CAMPUS.blue} />
          <GateStat label="Attempts" value="1" icon={Lock} color={CAMPUS.bad} hint="Single attempt, exactly like the real exam." />
        </div>

        <div className="rounded-xl p-4 mb-4" style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}` }}>
          <p className="text-[10px] font-mono tracking-widest mb-2.5" style={{ color: CAMPUS.inkFaint }}>MARKING SCHEME</p>
          <ul className="space-y-1.5 text-[12.5px]" style={{ color: CAMPUS.inkSoft }}>
            <li className="flex items-start gap-2">
              <MinusCircle size={12} className="flex-shrink-0 mt-[3px]" style={{ color: CAMPUS.bad }} />
              <span>MCQ ({byType.mcq || 0} question{(byType.mcq || 0) === 1 ? "" : "s"}): a wrong answer costs <b style={{ color: CAMPUS.ink }}>1/3 mark</b> on 1-mark questions and <b style={{ color: CAMPUS.ink }}>2/3 mark</b> on 2-mark questions.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 size={12} className="flex-shrink-0 mt-[3px]" style={{ color: CAMPUS.good }} />
              <span>MSQ ({byType.msq || 0}): no negative marking, but no partial credit - your selection must match exactly.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 size={12} className="flex-shrink-0 mt-[3px]" style={{ color: CAMPUS.good }} />
              <span>NAT ({byType.nat || 0}): type the number. No negative marking.</span>
            </li>
            <li className="flex items-start gap-2">
              <SkipForward size={12} className="flex-shrink-0 mt-[3px]" style={{ color: CAMPUS.inkFaint }} />
              <span>Skipping never costs anything. {marks1} one-mark and {marks2} two-mark questions in this paper.</span>
            </li>
          </ul>
          <p className="text-[11.5px] mt-3" style={{ color: CAMPUS.inkFaint }}>
            This is GATE&apos;s own scheme and it is not adjustable per test - practising against softer marking teaches the
            wrong instinct about when a guess is worth taking.
          </p>
        </div>

        {test.instructions?.trim() && (
          <div className="rounded-xl p-4 mb-4" style={{ background: CAMPUS.warnTint, border: `1px solid ${CAMPUS.warn}40` }}>
            <p className="text-[10px] font-mono tracking-widest mb-2" style={{ color: CAMPUS.warn }}>BEFORE YOU START</p>
            <p className="text-[12.5px] leading-relaxed whitespace-pre-wrap" style={{ color: CAMPUS.inkSoft }}>{test.instructions}</p>
          </div>
        )}

        <ul className="space-y-1.5 text-[12px] mb-5" style={{ color: CAMPUS.inkFaint }}>
          <li>The clock starts when you begin and runs from the server, not your device - closing the tab does not pause it.</li>
          <li>Answers save as you go, so a disconnection or a closed tab loses nothing. You can resume the same attempt.</li>
          <li>Solutions stay locked until you submit. This is enforced by the database, not just hidden in the interface.</li>
          <li>The paper submits itself when time runs out.</li>
        </ul>

        {signedIn ? (
          <CampusButton onClick={onBegin} disabled={busy || questions.length === 0} icon={Play}>
            {busy ? "Starting..." : "Start the test"}
          </CampusButton>
        ) : (
          <p className="text-[12.5px]" style={{ color: CAMPUS.warn }}>Sign in to take this test.</p>
        )}
      </CampusCard>
    </div>
  );
}

// ---------------- live attempt ----------------

function TestAttempt({ test, questions, attempt, onSubmitted }) {
  const { user, userData } = useAuth();
  const { paper } = useGate();

  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState(() => attempt?.answers || {});
  const [reviewFlags, setReviewFlags] = useState(() => attempt?.reviewFlags || {});
  const [timings, setTimings] = useState(() => attempt?.answerTimings || {});
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showPalette, setShowPalette] = useState(false);

  // The deadline is derived from the SERVER-recorded start time, so a student
  // cannot buy time by changing their system clock. The countdown still ticks on
  // the local clock (there is no alternative in a browser), but it counts down to
  // a fixed, server-anchored instant rather than from a locally-chosen one.
  const startedMs = attempt?.startedAt?.toMillis?.() ?? Date.now();
  const deadlineMs = startedMs + (test.durationMinutes || 180) * 60000;
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const remainingSec = Math.max(0, Math.round((deadlineMs - now) / 1000));

  const question = questions[index];
  const enteredAt = useRef(Date.now());
  useEffect(() => { enteredAt.current = Date.now(); }, [index]);

  // Time is accumulated per question on leaving it, not sampled - a student who
  // returns to Q12 three times has spent the sum of those visits on it, and the
  // post-test time analysis is only useful if that is what it measures.
  const accrueTime = useCallback(() => {
    const q = questions[index];
    if (!q) return 0;
    const delta = Math.round((Date.now() - enteredAt.current) / 1000);
    if (delta <= 0) return timings[q.id] || 0;
    const next = (timings[q.id] || 0) + delta;
    setTimings(t => ({ ...t, [q.id]: next }));
    enteredAt.current = Date.now();
    return next;
  }, [index, questions, timings]);

  const persist = useCallback(async (q, answer, flagged, seconds) => {
    if (!user) return;
    await saveAttemptAnswer({
      uid: user.uid, testId: test.id, questionId: q.id,
      answer, secondsSpent: seconds, markedForReview: flagged,
    }).catch(() => {});
  }, [user, test.id]);

  const setAnswer = (value) => {
    if (!question) return;
    const seconds = accrueTime();
    setAnswers(a => ({ ...a, [question.id]: value }));
    persist(question, value, reviewFlags[question.id], seconds);
  };

  const toggleFlag = () => {
    if (!question) return;
    const next = !reviewFlags[question.id];
    setReviewFlags(f => ({ ...f, [question.id]: next }));
    persist(question, answers[question.id] ?? null, next, accrueTime());
  };

  const jump = (i) => {
    accrueTime();
    setIndex(i);
    setShowPalette(false);
  };

  const doSubmit = useCallback(async () => {
    if (!user || submitting) return;
    setSubmitting(true);
    try {
      const finalTimings = { ...timings };
      const q = questions[index];
      if (q) {
        const delta = Math.round((Date.now() - enteredAt.current) / 1000);
        if (delta > 0) finalTimings[q.id] = (finalTimings[q.id] || 0) + delta;
      }
      const timeTakenSeconds = Math.round((Date.now() - startedMs) / 1000);
      const result = await submitAndGrade({
        uid: user.uid, paperId: paper.id, testId: test.id, questions,
        answers, answerTimings: finalTimings, reviewFlags, timeTakenSeconds, paper,
        // Display-only denormalized fields for the leaderboard's answer-free
        // results doc - see persistGrading. Roll number and classroom scope are
        // already on users/{uid} (stamped at campus approval), so nothing new is
        // being collected here.
        profile: {
          handle: userData?.handle || "",
          campusFullName: userData?.campusFullName || "",
          rollNumber: userData?.rollNumber || "",
          institutionId: userData?.institutionId || "",
          department: userData?.department || "",
          year: userData?.year || "",
          section: userData?.section || "",
        },
      });
      // Filing the mistakes here, once, rather than per wrong answer - see
      // recordTestMistakes. Failure to file must never block seeing the result.
      await recordTestMistakes({
        uid: user.uid, paperId: paper.id, testId: test.id,
        grading: result.grading, questions,
      }).catch(() => {});
      onSubmitted({ stored: { score: result.grading.score, maxScore: result.grading.maxScore } });
    } finally {
      setSubmitting(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, submitting, timings, questions, index, answers, reviewFlags, startedMs, test.id, paper]);

  // Auto-submit when the clock runs out. Guarded on `submitting` so the ticking
  // `now` can't fire this twice, and the grading write is transactional anyway
  // (see persistGrading) so a race could not double-grade even if it did.
  useEffect(() => {
    if (remainingSec === 0 && !submitting) doSubmit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remainingSec]);

  const answeredCount = questions.filter(q => {
    const v = answers[q.id];
    return v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && v.length === 0);
  }).length;
  const flaggedCount = questions.filter(q => reviewFlags[q.id]).length;
  const urgent = remainingSec < 300;

  return (
    <div className="max-w-3xl">
      {/* Sticky exam chrome: clock, counts, submit. Deliberately no back link and
          no section nav - leaving a timed paper by accident is a real cost. */}
      <div className="sticky top-0 z-30 -mx-1 px-1 py-2 mb-4 backdrop-blur"
        style={{ background: `color-mix(in srgb, ${CAMPUS.paper} 92%, transparent)` }}>
        <CampusCard className="p-3 flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Timer size={15} style={{ color: urgent ? CAMPUS.bad : CAMPUS.teal, flexShrink: 0 }} />
            <span className="font-mono text-[16px] font-bold tabular-nums"
              style={{ color: urgent ? CAMPUS.bad : CAMPUS.ink }}>
              {formatClock(remainingSec)}
            </span>
            <span className="text-[10.5px] font-mono truncate" style={{ color: CAMPUS.inkFaint }}>
              {test.title}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-[11px] font-mono" style={{ color: CAMPUS.good }}>{answeredCount} answered</span>
            {flaggedCount > 0 && <span className="text-[11px] font-mono" style={{ color: CAMPUS.warn }}>{flaggedCount} flagged</span>}
            <CampusButton size="sm" variant="secondary" onClick={() => setShowPalette(p => !p)}>
              {showPalette ? "Hide grid" : "Question grid"}
            </CampusButton>
            <CampusButton size="sm" onClick={() => setConfirming(true)} disabled={submitting}>
              Submit
            </CampusButton>
          </div>
        </CampusCard>
        {showPalette && (
          <CampusCard className="p-3 mt-2">
            <GateQuestionPalette questions={questions} answers={answers} reviewFlags={reviewFlags}
              current={index} onJump={jump} />
            <div className="flex items-center gap-3 mt-3 flex-wrap text-[10px] font-mono" style={{ color: CAMPUS.inkFaint }}>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded" style={{ background: CAMPUS.goodTint, border: `1px solid ${CAMPUS.good}` }} /> answered
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded" style={{ background: CAMPUS.warnTint, border: `1px solid ${CAMPUS.warn}` }} /> flagged
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded" style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}` }} /> not answered
              </span>
            </div>
          </CampusCard>
        )}
      </div>

      {question && (
        <GateQuestion question={question} index={index} total={questions.length}
          answer={answers[question.id] ?? null} onAnswer={setAnswer}
          mode="answer"
          reviewFlagged={!!reviewFlags[question.id]} onToggleReviewFlag={toggleFlag} />
      )}

      <div className="flex items-center justify-between gap-3 mt-4">
        <CampusButton variant="secondary" icon={ArrowLeft} disabled={index === 0} onClick={() => jump(index - 1)}>
          Previous
        </CampusButton>
        <div className="flex items-center gap-2">
          <CampusButton size="sm" variant="ghost" icon={Flag} onClick={toggleFlag}>
            {reviewFlags[question?.id] ? "Unflag" : "Mark for review"}
          </CampusButton>
          {index < questions.length - 1 ? (
            <CampusButton icon={ArrowRight} onClick={() => jump(index + 1)}>Next</CampusButton>
          ) : (
            <CampusButton onClick={() => setConfirming(true)}>Review &amp; submit</CampusButton>
          )}
        </div>
      </div>

      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-5"
          style={{ background: "rgba(0,0,0,0.55)" }} onClick={e => e.target === e.currentTarget && setConfirming(false)}>
          <CampusCard className="p-5 max-w-sm w-full">
            <h3 className="text-[16px] font-bold mb-2" style={{ color: CAMPUS.ink }}>Submit this paper?</h3>
            <p className="text-[12.5px] mb-3" style={{ color: CAMPUS.inkSoft }}>
              {answeredCount} of {questions.length} answered
              {questions.length - answeredCount > 0 ? `, ${questions.length - answeredCount} left blank` : ""}.
              {flaggedCount > 0 ? ` ${flaggedCount} still flagged for review.` : ""}
            </p>
            <p className="text-[12px] mb-4" style={{ color: CAMPUS.warn }}>
              You get one attempt at this test. Submitting is final, and it unlocks the solutions.
            </p>
            <div className="flex items-center gap-2">
              <CampusButton onClick={doSubmit} disabled={submitting}>
                {submitting ? "Grading..." : "Submit and see results"}
              </CampusButton>
              <CampusButton variant="secondary" onClick={() => setConfirming(false)} disabled={submitting}>
                Keep working
              </CampusButton>
            </div>
          </CampusCard>
        </div>
      )}
    </div>
  );
}

// ---------------- results and analysis ----------------

// Everything the product asks for after a test: score, estimated AIR and
// percentile, subject-wise accuracy, time analysis, attempt/skip breakdown, marks
// lost to negative marking, strong and weak topics, recommended revision,
// question-wise detail and confidence analysis.
//
// Answer keys are fetched HERE rather than being carried over from the attempt -
// the grading already happened at submit time, but the review needs the full
// solutions, and this is the first point at which the database will hand them
// over (the submitted attempt is what authorises the read).
function TestResults({ test, questions, attempt, onBack }) {
  const { paper, tree, go } = useGate();
  const [answerKeys, setAnswerKeys] = useState(null);
  const [filter, setFilter] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchTestAnswerKeys(test.id).then(k => { if (!cancelled) setAnswerKeys(k); }).catch(() => setAnswerKeys({}));
    return () => { cancelled = true; };
  }, [test.id]);

  const grading = useMemo(() => {
    if (!answerKeys) return null;
    return gradeGateTest(questions, answerKeys, attempt.answers || {}, attempt.answerTimings || {});
  }, [answerKeys, questions, attempt]);

  const timing = useMemo(() => (grading ? analyseTiming(grading) : null), [grading]);
  const confidence = useMemo(
    () => (grading ? analyseConfidence(grading, attempt.reviewFlags || {}) : null),
    [grading, attempt]);
  const estimate = useMemo(() => {
    if (!grading || !grading.maxScore) return null;
    return estimateRank((grading.score / grading.maxScore) * 100, paper);
  }, [grading, paper]);

  const subjectNames = useMemo(() => new Map((tree || []).map(s => [s.id, s.name])), [tree]);
  const topicNames = useMemo(() => {
    const m = new Map();
    for (const s of tree || []) for (const t of s.topics || []) m.set(t.id, { title: t.title, subjectId: s.id });
    return m;
  }, [tree]);

  if (!grading) {
    return (
      <div>
        <CampusBackButton onClick={onBack} label="Back to tests" />
        <CampusSkeleton height={300} />
      </div>
    );
  }

  const scorePct = Math.round((Math.max(0, grading.score) / Math.max(1, grading.maxScore)) * 100);
  const byId = new Map(questions.map(q => [q.id, q]));

  // Weak and strong topics from THIS test only - a per-test verdict, distinct
  // from the Overview's cross-everything ranking. Two attempts on one topic in a
  // single paper is enough here because the sample is the paper itself.
  const topicRollup = {};
  for (const p of grading.perQuestion) {
    if (p.status === "skipped") continue;
    const key = p.topicId || "unassigned";
    const t = topicRollup[key] || (topicRollup[key] = { topicId: key, correct: 0, attempted: 0 });
    t.attempted++;
    if (p.status === "correct") t.correct++;
  }
  const topicRows = Object.values(topicRollup).map(t => ({
    ...t,
    name: topicNames.get(t.topicId)?.title || t.topicId,
    accuracy: Math.round((t.correct / t.attempted) * 100),
  }));
  const weakTopics = topicRows.filter(t => t.accuracy < 50).sort((a, b) => a.accuracy - b.accuracy);
  const strongTopics = topicRows.filter(t => t.accuracy === 100 && t.attempted >= 2);

  const filteredQuestions = grading.perQuestion.filter(p => !filter || p.status === filter);

  return (
    <div className="space-y-5 max-w-3xl">
      <CampusBackButton onClick={onBack} label="Back to tests" />

      {/* headline */}
      <CampusCard className="p-5">
        <div className="flex items-start gap-5 flex-wrap">
          <GateProgressRing pct={scorePct} size={84} stroke={7} label="SCORE"
            color={scorePct >= 60 ? CAMPUS.good : scorePct >= 35 ? CAMPUS.warn : CAMPUS.bad} />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-mono tracking-widest mb-1" style={{ color: CAMPUS.inkFaint }}>
              {testTypeLabel(test.testType).toUpperCase()} · SUBMITTED
            </p>
            <h1 className="text-xl font-bold mb-1" style={{ color: CAMPUS.ink }}>
              {formatMarks(grading.score)} / {grading.maxScore} marks
            </h1>
            <p className="text-[12.5px]" style={{ color: CAMPUS.inkSoft }}>
              {grading.correctCount} correct · {grading.wrongCount} wrong · {grading.skippedCount} skipped ·
              {" "}{grading.accuracy}% accuracy on what you attempted
            </p>
            {grading.penalty > 0 && (
              <p className="flex items-center gap-1.5 text-[12px] mt-1.5" style={{ color: CAMPUS.bad }}>
                <MinusCircle size={12} /> {formatMarks(grading.penalty)} marks lost to negative marking - you would have
                scored {formatMarks(grading.rawCorrectMarks)} with no wrong answers attempted.
              </p>
            )}
          </div>
        </div>
      </CampusCard>

      {/* rank estimate */}
      {estimate && (
        <CampusCard className="p-4">
          <p className="text-[10px] font-mono tracking-widest mb-3" style={{ color: CAMPUS.inkFaint }}>IF THIS WERE THE REAL PAPER</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <GateStat label="Estimated AIR" icon={Trophy} color={CAMPUS.gold}
              value={estimate.belowRange ? `>${estimate.air.toLocaleString("en-IN")}` : `~${estimate.air.toLocaleString("en-IN")}`} />
            <GateStat label="Percentile" value={`${estimate.percentile}`} icon={BarChart3} color={CAMPUS.blue} />
            <GateStat label="Marks out of 100" value={formatMarks((grading.score / grading.maxScore) * 100)}
              icon={Gauge} color={CAMPUS.purple} />
          </div>
          <GateEstimateNote>
            Estimated by interpolating historical marks-to-rank data
            {estimate.isDefaultCurve ? " with a generic curve not yet tuned for this paper" : ""}, against
            ~{estimate.candidateCount.toLocaleString("en-IN")} candidates. A single test - especially a scoped one - is a weak
            predictor; the Analytics screen&apos;s projection across several attempts is the more meaningful number.
          </GateEstimateNote>
        </CampusCard>
      )}

      {/* attempt strategy */}
      <div className="grid sm:grid-cols-2 gap-4">
        <CampusCard className="p-4">
          <p className="text-[10px] font-mono tracking-widest mb-3" style={{ color: CAMPUS.inkFaint }}>ATTEMPT BREAKDOWN</p>
          <div className="space-y-2">
            {[
              { label: "Correct", n: grading.correctCount, color: CAMPUS.good, icon: CheckCircle2 },
              { label: "Wrong", n: grading.wrongCount, color: CAMPUS.bad, icon: XCircle },
              { label: "Skipped", n: grading.skippedCount, color: CAMPUS.inkFaint, icon: SkipForward },
            ].map(row => (
              <div key={row.label} className="flex items-center gap-2.5">
                <row.icon size={13} style={{ color: row.color, flexShrink: 0 }} />
                <span className="text-[12.5px] flex-1" style={{ color: CAMPUS.ink }}>{row.label}</span>
                <span className="font-mono text-[12.5px] font-bold" style={{ color: row.color }}>{row.n}</span>
                <span className="font-mono text-[11px] w-10 text-right" style={{ color: CAMPUS.inkFaint }}>
                  {Math.round((row.n / Math.max(1, questions.length)) * 100)}%
                </span>
              </div>
            ))}
          </div>
          <p className="text-[11.5px] mt-3 pt-3" style={{ color: CAMPUS.inkFaint, borderTop: `1px solid ${CAMPUS.line}` }}>
            You attempted {grading.attemptRate}% of the paper.
            {grading.wrongCount > grading.correctCount
              ? " More wrong than right on what you attempted - with negative marking, attempting less would have scored more."
              : grading.skippedCount > questions.length * 0.4
                ? " A large share left blank. If any of those were guessable down to two options, attempting them is mathematically worth it."
                : " A reasonable balance of aggression and restraint."}
          </p>
        </CampusCard>

        {timing && (
          <CampusCard className="p-4">
            <p className="text-[10px] font-mono tracking-widest mb-3" style={{ color: CAMPUS.inkFaint }}>TIME ANALYSIS</p>
            <div className="space-y-2 text-[12.5px]">
              <Row label="Total time" value={formatDuration(attempt.timeTakenSeconds || grading.totalTimeSec)} />
              <Row label="Average per question" value={`${timing.avgTimeSec}s`} />
              {timing.avgTimeCorrect != null && <Row label="Average when correct" value={`${timing.avgTimeCorrect}s`} color={CAMPUS.good} />}
              {timing.avgTimeWrong != null && <Row label="Average when wrong" value={`${timing.avgTimeWrong}s`} color={CAMPUS.bad} />}
              <Row label="Time on questions that scored nothing" value={formatDuration(timing.wastedSec)} color={CAMPUS.warn} />
            </div>
            {timing.avgTimeWrong != null && timing.avgTimeCorrect != null && timing.avgTimeWrong > timing.avgTimeCorrect && (
              <p className="text-[11.5px] mt-3 pt-3" style={{ color: CAMPUS.warn, borderTop: `1px solid ${CAMPUS.line}` }}>
                Your wrong answers took longer than your right ones. That is a question-selection problem, not a speed
                problem - the fix is recognising sooner which questions to leave.
              </p>
            )}
          </CampusCard>
        )}
      </div>

      {/* confidence */}
      {confidence && (
        <CampusCard className="p-4">
          <div className="flex items-center gap-1.5 mb-3">
            <Brain size={13} style={{ color: CAMPUS.purple }} />
            <p className="text-[10px] font-mono tracking-widest" style={{ color: CAMPUS.purple }}>CONFIDENCE ANALYSIS</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
            <GateStat label="Sure & right" value={confidence.confidentCorrect.length} color={CAMPUS.good} />
            <GateStat label="Sure & wrong" value={confidence.confidentWrong.length} color={CAMPUS.bad}
              hint="Answered quickly, never flagged, and wrong - these are misconceptions, not gaps." />
            <GateStat label="Unsure & right" value={confidence.unsureCorrect.length} color={CAMPUS.teal} />
            <GateStat label="Unsure & wrong" value={confidence.unsureWrong.length} color={CAMPUS.warn} />
          </div>
          <p className="text-[12px] leading-relaxed" style={{ color: CAMPUS.inkSoft }}>
            {confidence.confidentWrong.length > 0 ? (
              <>
                <b style={{ color: CAMPUS.bad }}>{confidence.confidentWrong.length} question{confidence.confidentWrong.length === 1 ? "" : "s"} you
                answered quickly and confidently were wrong</b> ({confidence.misconceptionRate}% of everything you were sure
                about). These are the dangerous ones: you did not know you were wrong, so extra practice on the questions you
                flagged will never find them. Re-read those topics from scratch rather than drilling them.
              </>
            ) : (
              <>Nothing you answered confidently was wrong - your sense of your own certainty is well calibrated, which is
              a genuinely valuable exam skill.</>
            )}
            {confidence.recoveryRate != null && (
              <> Of the questions you were unsure about, you got {confidence.recoveryRate}% right.</>
            )}
          </p>
          <p className="text-[10.5px] mt-2" style={{ color: CAMPUS.inkFaint }}>
            Confidence is inferred from whether you flagged a question and how long you spent on it, not self-reported -
            nobody rates their own certainty honestly under a clock.
          </p>
        </CampusCard>
      )}

      {/* subject-wise */}
      <CampusCard className="p-4">
        <p className="text-[10px] font-mono tracking-widest mb-3" style={{ color: CAMPUS.inkFaint }}>SUBJECT-WISE ACCURACY</p>
        <GateBarList
          rows={grading.subjectBreakdown.map(s => ({
            key: s.subjectId, label: subjectNames.get(s.subjectId) || s.subjectId,
            pct: s.accuracy, sub: `${formatMarks(s.marks)}/${s.maxMarks} marks`,
            color: s.accuracy >= 70 ? CAMPUS.good : s.accuracy >= 40 ? CAMPUS.warn : CAMPUS.bad,
          }))}
          emptyLabel="No subject tags on this test's questions." />
      </CampusCard>

      {/* strengths / weaknesses / next steps */}
      <div className="grid sm:grid-cols-2 gap-4">
        <CampusCard className="p-4">
          <div className="flex items-center gap-1.5 mb-2.5">
            <Target size={13} style={{ color: CAMPUS.bad }} />
            <p className="text-[10px] font-mono tracking-widest" style={{ color: CAMPUS.bad }}>WEAK IN THIS PAPER</p>
          </div>
          {weakTopics.length === 0 ? (
            <p className="text-[12px]" style={{ color: CAMPUS.inkFaint }}>Nothing below 50% - no single topic dragged this score.</p>
          ) : (
            <ul className="space-y-1.5">
              {weakTopics.slice(0, 6).map(t => (
                <li key={t.topicId} className="flex items-center justify-between gap-2 text-[12.5px]">
                  <span className="truncate" style={{ color: CAMPUS.ink }}>{t.name}</span>
                  <span className="font-mono text-[11px] flex-shrink-0" style={{ color: CAMPUS.bad }}>{t.correct}/{t.attempted}</span>
                </li>
              ))}
            </ul>
          )}
        </CampusCard>

        <CampusCard className="p-4">
          <div className="flex items-center gap-1.5 mb-2.5">
            <Repeat size={13} style={{ color: CAMPUS.purple }} />
            <p className="text-[10px] font-mono tracking-widest" style={{ color: CAMPUS.purple }}>RECOMMENDED NEXT</p>
          </div>
          <ul className="space-y-2 text-[12.5px]" style={{ color: CAMPUS.inkSoft }}>
            {grading.wrongCount > 0 && (
              <li>
                The {grading.wrongCount} you got wrong {grading.wrongCount === 1 ? "is" : "are"} now in your Mistakes
                Notebook. Redo them from there in a week, not today.
              </li>
            )}
            {weakTopics.length > 0 && (
              <li>Re-read {weakTopics.slice(0, 2).map(t => t.name).join(" and ")} before practising them again.</li>
            )}
            {strongTopics.length > 0 && (
              <li>{strongTopics.length} topic{strongTopics.length === 1 ? "" : "s"} came out clean - they only need spaced revision now.</li>
            )}
            {timing?.wastedSec > 600 && (
              <li>{formatDuration(timing.wastedSec)} went on questions that scored nothing. Practise abandoning a question at the 3-minute mark.</li>
            )}
          </ul>
          <div className="flex items-center gap-2 mt-3">
            <CampusButton size="sm" variant="secondary" onClick={() => go("mistakes")}>Mistakes notebook</CampusButton>
            <CampusButton size="sm" variant="secondary" onClick={() => go("revision")}>Revision plan</CampusButton>
          </div>
        </CampusCard>
      </div>

      {/* question-wise review */}
      <div>
        <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
          <p className="text-[10px] font-mono tracking-widest" style={{ color: CAMPUS.inkFaint }}>QUESTION-WISE REVIEW</p>
          <div className="flex gap-1.5">
            {[
              { v: null, label: `All ${questions.length}` },
              { v: "wrong", label: `Wrong ${grading.wrongCount}` },
              { v: "skipped", label: `Skipped ${grading.skippedCount}` },
              { v: "correct", label: `Correct ${grading.correctCount}` },
            ].map(f => (
              <button key={String(f.v)} onClick={() => setFilter(f.v)}
                className="text-[11.5px] font-semibold px-2.5 py-1 rounded-full"
                style={{
                  background: filter === f.v ? CAMPUS.tealTint : CAMPUS.paper,
                  border: `1px solid ${filter === f.v ? CAMPUS.teal : CAMPUS.line}`,
                  color: filter === f.v ? CAMPUS.teal : CAMPUS.inkSoft,
                }}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {filteredQuestions.map((p) => {
            const q = byId.get(p.questionId);
            if (!q) return null;
            const originalIndex = questions.findIndex(x => x.id === p.questionId);
            return (
              <div key={p.questionId} className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <CampusChip color={p.status === "correct" ? CAMPUS.good : p.status === "wrong" ? CAMPUS.bad : CAMPUS.inkFaint}>
                    {p.status.toUpperCase()}
                  </CampusChip>
                  <span className="text-[11px] font-mono" style={{ color: p.awarded > 0 ? CAMPUS.good : p.awarded < 0 ? CAMPUS.bad : CAMPUS.inkFaint }}>
                    {p.awarded > 0 ? "+" : ""}{formatMarks(p.awarded)} marks
                  </span>
                  {attempt.reviewFlags?.[p.questionId] && <CampusChip color={CAMPUS.warn} icon={Flag}>WAS FLAGGED</CampusChip>}
                </div>
                <GateQuestion question={q} index={originalIndex} total={questions.length}
                  answer={attempt.answers?.[p.questionId] ?? null} onAnswer={() => {}}
                  mode="review" answerKey={answerKeys[p.questionId]} timeSec={p.timeSec} />
                <GateSolution answerKey={answerKeys[p.questionId]} defaultOpen={p.status === "wrong"} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, color }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span style={{ color: CAMPUS.inkSoft }}>{label}</span>
      <span className="font-mono font-semibold tabular-nums" style={{ color: color || CAMPUS.ink }}>{value}</span>
    </div>
  );
}
