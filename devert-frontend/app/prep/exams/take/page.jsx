"use client";

// /prep/exams/take?id=X - THE weekend test runner (design §5).
// One question per screen, question palette, mark-for-review, autosave,
// server-skew-corrected countdown with auto-submit at zero. No score is
// ever computed or shown here - the key is unreadable during the window.

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Flag,
  AlertTriangle,
  Loader2,
  Lock,
  Clock,
  CheckCircle2,
  FileWarning,
  Save,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { RequireOnboarded, GuardShell, LoadingScreen } from "@/components/prep/guards";
import {
  TerminalCard,
  BracketButton,
  NeonBadge,
  Countdown,
  PrepModal,
  MarkdownBlock,
} from "@/components/prep/ui";
import { QuestionCard } from "@/components/prep/QuestionCard";
import { QuestionPalette } from "@/components/prep/exams/QuestionPalette";
import { computeExamStatus, cohortAllowed, toMillis } from "@/components/prep/exams/examStatus";
import { CATEGORY_MAP, DIFFICULTY_MAP } from "@/lib/prep/constants";
import { getExam, getMySubmission, getPaper, startSubmission, submitExam, upsertSubmission } from "@/lib/prep/db";

// CodeMirror is heavy - only pull it in when a test actually has a coding
// question (design §8: keep the judge/editor code-split off the base bundle).
const CodeRunner = dynamic(() => import("@/components/prep/CodeRunner"), {
  ssr: false,
  loading: () => (
    <div className="rounded-lg border border-white/10 bg-black/40 h-80 flex items-center justify-center">
      <p className="font-mono text-xs text-white/30 flex items-center gap-2">
        <Loader2 size={13} className="animate-spin" /> loading code editor…
      </p>
    </div>
  ),
});

function StatusScreen({ icon: Icon = Lock, kicker, title, message, children }) {
  return (
    <GuardShell>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 22 }}
        className="terminal-window overflow-hidden"
      >
        <div className="terminal-header">
          <span className="font-mono text-[10px] text-white/25 ml-2">exam_status.sh</span>
        </div>
        <div className="p-8 flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ background: "rgba(0,255,255,0.08)" }}>
            <Icon size={24} className="text-neon-cyan" />
          </div>
          {kicker && <p className="font-mono text-xs text-neon-green/55 tracking-wider">{kicker}</p>}
          <h2 className="font-sans text-xl font-bold text-white leading-snug">{title}</h2>
          {message && <p className="font-mono text-xs text-white/40 leading-relaxed">{message}</p>}
          {children}
        </div>
      </motion.div>
    </GuardShell>
  );
}

function TakeExamRunner({ examId }) {
  const { user, profile } = useAuth();
  const router = useRouter();

  const [phase, setPhase] = useState("loading");
  const [error, setError] = useState("");
  const [exam, setExam] = useState(null);
  const [paper, setPaper] = useState(null);
  const [target, setTarget] = useState(null);
  const [responses, setResponses] = useState({});
  const [current, setCurrent] = useState(0);
  const [marked, setMarked] = useState(() => new Set());
  const [saveState, setSaveState] = useState("idle"); // idle|saving|saved|error
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const responsesRef = useRef(responses);
  responsesRef.current = responses;
  const submitLockRef = useRef(false);
  const autoSubmittedRef = useRef(false);
  const dirtyRef = useRef(false);

  // ── load exam + start/resume submission + fetch paper ──────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const ex = await getExam(examId);
        if (cancelled) return;
        if (!ex || !ex.published) {
          setError("This test doesn't exist or isn't published yet.");
          setPhase("error");
          return;
        }
        setExam(ex);

        if (!cohortAllowed(ex, profile?.classGroup)) {
          setPhase("not-cohort");
          return;
        }

        const status = computeExamStatus(ex);

        // Check for an already-submitted attempt first, regardless of window
        // state, so a student revisiting the link after submitting sees the
        // right screen instead of "window closed".
        const existing = await getMySubmission(examId, user.uid);
        if (existing?.status === "submitted") {
          setPhase("already-submitted");
          return;
        }

        if (status.status === "upcoming") {
          setPhase("not-started");
          return;
        }
        if (status.status === "ended") {
          setPhase("window-closed");
          return;
        }

        // live - create/resume the submission, measuring round-trip clock skew.
        const t0 = Date.now();
        const sub = await startSubmission(examId, user.uid, {
          rollNumber: profile?.rollNumber,
          classGroup: profile?.classGroup,
          branch: profile?.branch,
          displayName: profile?.displayName || user?.displayName || "",
        });
        const t1 = Date.now();
        if (cancelled) return;
        if (!sub) throw new Error("Could not start the test");
        if (sub.status === "submitted") {
          setPhase("already-submitted");
          return;
        }
        setResponses(sub.responses || {});

        const clientMid = (t0 + t1) / 2;
        const startedAtMs = sub.startedAt?.toMillis?.() ?? clientMid;
        const skew = startedAtMs - clientMid; // server_now - client_now, roughly
        const endsAtMs = toMillis(ex.endsAt);
        const durationDeadline = startedAtMs + (Number(ex.durationMins) || 60) * 60000;
        const deadlineServerMs = Math.min(endsAtMs ?? durationDeadline, durationDeadline);
        setTarget(deadlineServerMs - skew);

        let paperDoc;
        try {
          paperDoc = await getPaper(examId);
        } catch (err) {
          // permission-denied here means the window isn't actually open yet
          // from the server's point of view (client clock drift) - treat as
          // not-started rather than a hard error.
          if (cancelled) return;
          setError(err?.message || "The paper isn't available yet.");
          setPhase("not-started");
          return;
        }
        if (cancelled) return;
        if (!paperDoc || !Array.isArray(paperDoc.questions) || paperDoc.questions.length === 0) {
          setError("This test has no questions yet.");
          setPhase("error");
          return;
        }
        setPaper(paperDoc);
        setPhase("active");
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || "Failed to load the test");
          setPhase("error");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId, user?.uid]);

  const saveNow = useCallback(
    async (resp) => {
      if (submitLockRef.current) return;
      setSaveState("saving");
      try {
        await upsertSubmission(examId, user.uid, { responses: resp });
        dirtyRef.current = false;
        setSaveState("saved");
      } catch {
        setSaveState("error");
      }
    },
    [examId, user?.uid]
  );

  // debounced autosave ~5s after a change
  useEffect(() => {
    if (phase !== "active" || !dirtyRef.current) return undefined;
    const t = setTimeout(() => saveNow(responsesRef.current), 5000);
    return () => clearTimeout(t);
  }, [responses, phase, saveNow]);

  // 25s heartbeat regardless of changes, so updatedAt never goes stale
  useEffect(() => {
    if (phase !== "active") return undefined;
    const iv = setInterval(() => saveNow(responsesRef.current), 25000);
    return () => clearInterval(iv);
  }, [phase, saveNow]);

  const setResponse = useCallback((idx, value) => {
    dirtyRef.current = true;
    setResponses((prev) => ({ ...prev, [idx]: value }));
  }, []);

  const toggleMarked = useCallback((idx) => {
    setMarked((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }, []);

  const doSubmit = useCallback(async () => {
    if (submitLockRef.current) return;
    submitLockRef.current = true;
    setSubmitting(true);
    try {
      await submitExam(examId, user.uid, responsesRef.current);
      router.replace(`/prep/exams/review?id=${examId}`);
    } catch (err) {
      submitLockRef.current = false;
      setSubmitting(false);
      setError(err?.message || "Failed to submit the test");
    }
  }, [examId, user?.uid, router]);

  const handleExpire = useCallback(() => {
    if (autoSubmittedRef.current) return;
    autoSubmittedRef.current = true;
    doSubmit();
  }, [doSubmit]);

  const questions = useMemo(() => {
    const qs = (paper?.questions || []).slice();
    qs.sort((a, b) => a.idx - b.idx);
    return qs;
  }, [paper]);

  const isAnswered = useCallback(
    (idx) => {
      const v = responses[idx];
      if (v == null) return false;
      if (typeof v === "number") return true;
      if (typeof v === "object") return !!v.code && v.code.trim().length > 0;
      return false;
    },
    [responses]
  );

  const answeredSet = useMemo(() => {
    const s = new Set();
    questions.forEach((q) => {
      if (isAnswered(q.idx)) s.add(q.idx);
    });
    return s;
  }, [questions, isAnswered]);

  const answeredCount = answeredSet.size;
  const blankCount = questions.length - answeredCount;
  const q = questions[current];

  if (phase === "loading") return <LoadingScreen />;

  if (phase === "error") {
    return (
      <StatusScreen icon={AlertTriangle} kicker="// error" title="Couldn't load this test" message={error}>
        <BracketButton variant="cyan" href="/prep/exams">
          BACK_TO_TESTS
        </BracketButton>
      </StatusScreen>
    );
  }

  if (phase === "not-cohort") {
    return (
      <StatusScreen
        icon={Lock}
        kicker="// /prep/exams/take - access_denied.sh"
        title="Not Your Cohort"
        message="This test is targeted at a different class group. Contact your faculty/TPO if you believe this is a mistake."
      >
        <BracketButton variant="cyan" href="/prep/exams">
          BACK_TO_TESTS
        </BracketButton>
      </StatusScreen>
    );
  }

  if (phase === "not-started") {
    const startsAtMs = toMillis(exam?.startsAt);
    return (
      <StatusScreen
        icon={Clock}
        kicker="// /prep/exams/take - not_live_yet.sh"
        title="This Test Hasn't Started"
        message={error || "Come back when the window opens - the countdown will update automatically."}
      >
        {startsAtMs && <Countdown target={startsAtMs} prefix="starts in" />}
        <BracketButton variant="cyan" href="/prep/exams" className="mt-2">
          BACK_TO_TESTS
        </BracketButton>
      </StatusScreen>
    );
  }

  if (phase === "window-closed") {
    return (
      <StatusScreen
        icon={FileWarning}
        kicker="// /prep/exams/take - window_closed.sh"
        title="The Test Window Has Closed"
        message="You didn't attempt this test before it ended, so it can no longer be started."
      >
        <BracketButton variant="cyan" href="/prep/exams">
          BACK_TO_TESTS
        </BracketButton>
      </StatusScreen>
    );
  }

  if (phase === "already-submitted") {
    const ended = exam ? computeExamStatus(exam).status === "ended" : false;
    return (
      <StatusScreen
        icon={CheckCircle2}
        kicker="// /prep/exams/take - already_submitted.sh"
        title="Already Submitted"
        message={
          ended
            ? "Your submission is locked in. Results are ready to review."
            : "Your submission is locked in. Results unlock once the test window closes."
        }
      >
        {ended ? (
          <BracketButton variant="green" href={`/prep/exams/review?id=${examId}`}>
            VIEW_RESULTS
          </BracketButton>
        ) : (
          <BracketButton variant="cyan" href="/prep/exams">
            BACK_TO_TESTS
          </BracketButton>
        )}
      </StatusScreen>
    );
  }

  // phase === 'active'
  return (
    <main className="min-h-screen pt-8 pb-32 px-6 relative">
      <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none" />
      <div className="relative max-w-6xl mx-auto">
        {/* header */}
        <TerminalCard
          animate
          filename="weekend_test_runner.sh"
          headerRight={
            <div className="flex items-center gap-3">
              <span
                className="font-mono text-[10px] flex items-center gap-1"
                style={{ color: saveState === "error" ? "#FF3B3B" : "rgba(255,255,255,0.3)" }}
              >
                <Save size={11} />
                {saveState === "saving" ? "saving…" : saveState === "error" ? "save failed" : saveState === "saved" ? "saved" : "autosave ready"}
              </span>
              <Countdown target={target} onExpire={handleExpire} warnUnderMs={120000} />
            </div>
          }
          className="mb-6"
        >
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="font-sans text-xl font-bold text-white mb-1.5">{exam?.title}</h1>
              <div className="flex items-center gap-2 flex-wrap">
                <NeonBadge color="#FFD700">TEST ID: {profile?.rollNumber || "-"}</NeonBadge>
                <NeonBadge color="#00FF41">{answeredCount}/{questions.length} ANSWERED</NeonBadge>
              </div>
            </div>
            <BracketButton variant="red" onClick={() => setConfirmOpen(true)} disabled={submitting}>
              SUBMIT_TEST
            </BracketButton>
          </div>
        </TerminalCard>

        <div className="grid md:grid-cols-[1fr_260px] gap-6 items-start">
          {/* question area */}
          <TerminalCard
            animate
            filename={`q${current + 1}.txt`}
            headerRight={
              <span className="font-mono text-[10px] text-white/30">
                Question {current + 1} / {questions.length}
              </span>
            }
          >
            {q && (
              <>
                <div className="flex items-center gap-1.5 flex-wrap mb-4">
                  {CATEGORY_MAP[q.category] && (
                    <NeonBadge color={CATEGORY_MAP[q.category].color}>
                      {CATEGORY_MAP[q.category].label.toUpperCase()}
                    </NeonBadge>
                  )}
                  {DIFFICULTY_MAP[q.difficulty] && (
                    <NeonBadge color={DIFFICULTY_MAP[q.difficulty].color}>
                      {DIFFICULTY_MAP[q.difficulty].label}
                    </NeonBadge>
                  )}
                  <span className="ml-auto font-mono text-[10px] text-white/25">{q.marks} mark{q.marks === 1 ? "" : "s"}</span>
                </div>

                {q.type === "coding" ? (
                  <div>
                    <MarkdownBlock className="mb-4">{q.prompt || ""}</MarkdownBlock>
                    <CodeRunner
                      question={{ id: `${examId}-${q.idx}`, ...q }}
                      starterCode={q.starterCode}
                      testCases={(q.publicTestCases || []).map((t) => ({ ...t, hidden: false }))}
                      onResult={(lang, code, summary) =>
                        setResponse(q.idx, {
                          lang,
                          code,
                          publicPassed: summary?.passed ?? 0,
                          publicTotal: summary?.total ?? 0,
                        })
                      }
                    />
                  </div>
                ) : (
                  <QuestionCard
                    question={q}
                    chosen={typeof responses[q.idx] === "number" ? responses[q.idx] : null}
                    onChoose={(i) => setResponse(q.idx, i)}
                    revealed={false}
                  />
                )}

                <div className="flex items-center justify-between gap-3 mt-6 pt-5 border-t border-white/8 flex-wrap">
                  <BracketButton
                    variant="ghost"
                    onClick={() => setCurrent((c) => Math.max(0, c - 1))}
                    disabled={current === 0}
                  >
                    <span className="inline-flex items-center gap-1"><ChevronLeft size={12} /> PREV</span>
                  </BracketButton>

                  <BracketButton
                    variant={marked.has(q.idx) ? "gold" : "ghost"}
                    onClick={() => toggleMarked(q.idx)}
                  >
                    <span className="inline-flex items-center gap-1">
                      <Flag size={12} /> {marked.has(q.idx) ? "MARKED" : "MARK_FOR_REVIEW"}
                    </span>
                  </BracketButton>

                  <BracketButton
                    variant="ghost"
                    onClick={() => setCurrent((c) => Math.min(questions.length - 1, c + 1))}
                    disabled={current === questions.length - 1}
                  >
                    <span className="inline-flex items-center gap-1">NEXT <ChevronRight size={12} /></span>
                  </BracketButton>
                </div>
              </>
            )}
          </TerminalCard>

          {/* palette */}
          <TerminalCard animate filename="palette.map" className="md:sticky md:top-6">
            <div className="flex items-center gap-3 font-mono text-[9px] text-white/30 mb-3 flex-wrap">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-neon-green/60 inline-block" /> answered</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm border border-neon-cyan inline-block" /> current</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm border border-white/15 inline-block" /> blank</span>
            </div>
            <QuestionPalette
              total={questions.length}
              current={current}
              answeredSet={answeredSet}
              markedSet={marked}
              onJump={setCurrent}
            />
            <p className="font-mono text-[10px] text-white/25 mt-4">
              {blankCount} blank · {marked.size} marked for review
            </p>
          </TerminalCard>
        </div>
      </div>

      <PrepModal
        open={confirmOpen}
        onClose={() => (submitting ? null : setConfirmOpen(false))}
        title="Submit this test?"
        filename="confirm_submit.sh"
        footer={
          <>
            <BracketButton variant="ghost" onClick={() => setConfirmOpen(false)} disabled={submitting}>
              CANCEL
            </BracketButton>
            <BracketButton variant="red" onClick={doSubmit} loading={submitting} loadingText="SUBMITTING">
              CONFIRM_SUBMIT
            </BracketButton>
          </>
        }
      >
        <p className="font-mono text-xs text-white/50 leading-relaxed mb-3">
          You cannot change your answers after submitting.
        </p>
        <div className="flex items-center gap-4 font-mono text-xs">
          <span className="text-neon-green">{answeredCount} answered</span>
          <span className="text-white/30">{blankCount} blank</span>
          {marked.size > 0 && <span className="text-[#FFD700]">{marked.size} marked</span>}
        </div>
      </PrepModal>
    </main>
  );
}

function MissingIdScreen() {
  return (
    <StatusScreen
      icon={AlertTriangle}
      kicker="// /prep/exams/take - missing_id.sh"
      title="No Test Selected"
      message="Open this page from the weekend tests list."
    >
      <BracketButton variant="cyan" href="/prep/exams">
        BACK_TO_TESTS
      </BracketButton>
    </StatusScreen>
  );
}

function TakeExamPageInner() {
  const searchParams = useSearchParams();
  const examId = searchParams.get("id");
  return <RequireOnboarded>{examId ? <TakeExamRunner examId={examId} /> : <MissingIdScreen />}</RequireOnboarded>;
}

export default function TakeExamPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <TakeExamPageInner />
    </Suspense>
  );
}
