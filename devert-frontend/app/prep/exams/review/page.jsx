"use client";

// /prep/exams/review?id=X — post-exam review (design §5). Score is NEVER
// trusted from the submission doc: it's always recomputed here from the
// immutable `responses` + the answer key, once the key becomes readable
// (rules time-gate it to request.time > exam.endsAt).

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { AlertTriangle, Award, CheckCircle2, Clock, FileQuestion, Lock, XCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { RequireOnboarded, GuardShell, LoadingScreen } from "@/components/prep/guards";
import {
  PrepShell,
  TerminalCard,
  StatTile,
  BracketButton,
  NeonBadge,
  MarkdownBlock,
  EmptyState,
} from "@/components/prep/ui";
import { QuestionCard } from "@/components/prep/QuestionCard";
import { CategoryBreakdown } from "@/components/prep/exams/CategoryBreakdown";
import { computeExamStatus, toMillis } from "@/components/prep/exams/examStatus";
import { CATEGORY_MAP, DIFFICULTY_MAP, LANGUAGE_MAP } from "@/lib/prep/constants";
import { getExam, getKey, getMySubmission, getPaper } from "@/lib/prep/db";
import { scoreSubmission } from "@/lib/prep/grading";

function LockedScreen({ endsAtMs, message }) {
  return (
    <GuardShell>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 22 }}
        className="terminal-window overflow-hidden"
      >
        <div className="terminal-header">
          <div className="terminal-dot bg-red-500/70" />
          <div className="terminal-dot bg-yellow-500/70" />
          <div className="terminal-dot bg-green-500/70" />
          <span className="font-mono text-[10px] text-white/25 ml-2">results_locked.sh</span>
        </div>
        <div className="p-8 flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ background: "rgba(0,255,255,0.08)" }}>
            <Lock size={24} className="text-neon-cyan" />
          </div>
          <p className="font-mono text-xs text-neon-green/55 tracking-wider">{"// /prep/exams/review — locked.sh"}</p>
          <h2 className="font-sans text-xl font-bold text-white leading-snug">Results Are Still Locked</h2>
          <p className="font-mono text-xs text-white/40 leading-relaxed">
            {message || "Results unlock automatically once the test window closes."}
          </p>
          {endsAtMs && (
            <div className="font-mono text-sm text-neon-cyan flex items-center gap-1.5">
              <Clock size={13} /> unlocks in <CountdownInline target={endsAtMs} />
            </div>
          )}
          <BracketButton variant="cyan" href="/prep/exams" className="mt-1">
            BACK_TO_TESTS
          </BracketButton>
        </div>
      </motion.div>
    </GuardShell>
  );
}

// Tiny local countdown (avoids importing the shared Countdown just for a
// one-line inline readout on the lock screen).
function CountdownInline({ target }) {
  const [remaining, setRemaining] = useState(() => Math.max(0, target - Date.now()));
  useEffect(() => {
    const iv = setInterval(() => setRemaining(Math.max(0, target - Date.now())), 1000);
    return () => clearInterval(iv);
  }, [target]);
  const s = Math.floor(remaining / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return <span>{h > 0 ? `${pad(h)}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`}</span>;
}

function ReviewBody({ examId }) {
  const { user } = useAuth();
  const [phase, setPhase] = useState("loading");
  const [error, setError] = useState("");
  const [exam, setExam] = useState(null);
  const [paper, setPaper] = useState(null);
  const [key, setKey] = useState(null);
  const [submission, setSubmission] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const uid = user?.uid;
        if (!uid) return; // guard above handles the unauthenticated case

        const ex = await getExam(examId);
        if (cancelled) return;
        if (!ex) {
          setError("This test doesn't exist.");
          setPhase("error");
          return;
        }
        setExam(ex);

        const status = computeExamStatus(ex);
        const sub = await getMySubmission(examId, uid);
        if (cancelled) return;

        if (!sub) {
          setPhase("no-attempt");
          return;
        }
        setSubmission(sub);

        if (status.status !== "ended") {
          setPhase("locked");
          return;
        }

        let paperDoc, keyDoc;
        try {
          [paperDoc, keyDoc] = await Promise.all([getPaper(examId), getKey(examId)]);
        } catch (err) {
          if (cancelled) return;
          setError(err?.message || "");
          setPhase("locked");
          return;
        }
        if (cancelled) return;
        setPaper(paperDoc);
        setKey(keyDoc);
        setPhase("ready");
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || "Failed to load results");
          setPhase("error");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [examId, user?.uid]);

  const score = useMemo(() => {
    if (!paper || !key || !submission) return null;
    return scoreSubmission(submission.responses, key, paper);
  }, [paper, key, submission]);

  const stats = useMemo(() => {
    if (!score || !paper) return null;
    const responses = submission?.responses || {};
    let correct = 0;
    let wrong = 0;
    let blank = 0;
    const categoryMap = {};

    paper.questions.forEach((pq) => {
      const raw = responses[pq.idx];
      const isBlank = pq.type === "coding" ? !(raw && raw.code && raw.code.trim()) : typeof raw !== "number";
      const perQ = score.perQuestion.find((p) => p.idx === pq.idx);
      const isCorrect = !!perQ?.correct;

      if (isBlank) blank++;
      else if (isCorrect) correct++;
      else wrong++;

      const cat = pq.category || "aptitude";
      if (!categoryMap[cat]) categoryMap[cat] = { category: cat, attempted: 0, correct: 0 };
      if (!isBlank) {
        categoryMap[cat].attempted++;
        if (isCorrect) categoryMap[cat].correct++;
      }
    });

    return {
      correct,
      wrong,
      blank,
      categories: Object.values(categoryMap).sort((a, b) => b.attempted - a.attempted),
    };
  }, [score, paper, submission]);

  if (phase === "loading") return <LoadingScreen />;

  if (phase === "error") {
    return (
      <PrepShell kicker="// /prep/exams/review — error.sh" title="COULDN'T LOAD" accent="RESULTS">
        <EmptyState icon={AlertTriangle} title="something went wrong" message={error} action={<BracketButton href="/prep/exams">BACK_TO_TESTS</BracketButton>} />
      </PrepShell>
    );
  }

  if (phase === "no-attempt") {
    return (
      <PrepShell kicker="// /prep/exams/review — no_attempt.sh" title="NO" accent="ATTEMPT">
        <EmptyState
          icon={FileQuestion}
          title="you didn't attempt this test"
          message="There's no submission on record for this test, so there's nothing to review."
          action={<BracketButton href="/prep/exams">BACK_TO_TESTS</BracketButton>}
        />
      </PrepShell>
    );
  }

  if (phase === "locked") {
    const endsAtMs = toMillis(exam?.endsAt);
    return <LockedScreen endsAtMs={endsAtMs} message={error || undefined} />;
  }

  const questions = (paper?.questions || []).slice().sort((a, b) => a.idx - b.idx);
  const responses = submission?.responses || {};

  return (
    <PrepShell
      kicker="// /prep/exams/review — score_report.sh"
      title="TEST"
      accent="RESULTS"
      subtitle={exam?.title}
      actions={<NeonBadge color="#FFD700">TEST ID: {submission?.rollNumber || "—"}</NeonBadge>}
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatTile label="score" value={`${score.total}/${score.max}`} icon={Award} color="#FFD700" delay={0} />
        <StatTile label="correct" value={stats.correct} icon={CheckCircle2} color="#00FF41" delay={0.05} />
        <StatTile label="wrong" value={stats.wrong} icon={XCircle} color="#FF3B3B" delay={0.1} />
        <StatTile label="blank" value={stats.blank} icon={FileQuestion} color="rgba(255,255,255,0.4)" delay={0.15} />
      </div>

      {stats.categories.length > 0 && (
        <TerminalCard filename="category_breakdown.log" className="mb-8" delay={0.2}>
          <CategoryBreakdown items={stats.categories} />
        </TerminalCard>
      )}

      <div className="space-y-5">
        {questions.map((pq, i) => {
          if (pq.type === "coding") {
            const raw = responses[pq.idx];
            const perQ = score.perQuestion.find((p) => p.idx === pq.idx);
            const langMeta = raw?.lang ? LANGUAGE_MAP[raw.lang] : null;
            return (
              <TerminalCard key={pq.idx} filename={`q${i + 1}_coding.txt`} delay={0.05 * i} animate={i < 12}>
                <div className="flex items-center gap-1.5 flex-wrap mb-3">
                  <span className="font-mono text-xs text-neon-cyan/70 mr-1">Q{String(i + 1).padStart(2, "0")}</span>
                  {CATEGORY_MAP[pq.category] && <NeonBadge color={CATEGORY_MAP[pq.category].color}>{CATEGORY_MAP[pq.category].label.toUpperCase()}</NeonBadge>}
                  {DIFFICULTY_MAP[pq.difficulty] && <NeonBadge color={DIFFICULTY_MAP[pq.difficulty].color}>{DIFFICULTY_MAP[pq.difficulty].label}</NeonBadge>}
                  <span
                    className="ml-auto font-mono text-[11px]"
                    style={{ color: perQ?.correct ? "#00FF41" : "#FF3B3B" }}
                  >
                    {perQ?.marksAwarded ?? 0}/{perQ?.marks ?? pq.marks} marks
                  </span>
                </div>
                <MarkdownBlock className="mb-4">{pq.prompt || ""}</MarkdownBlock>
                {raw?.code ? (
                  <>
                    <p className="font-mono text-[9px] tracking-wider text-white/25 uppercase mb-1">
                      your submission {langMeta ? `(${langMeta.label})` : ""} — public tests {raw.publicPassed ?? 0}/{raw.publicTotal ?? 0}
                    </p>
                    <pre className="font-mono text-[11px] whitespace-pre-wrap break-words bg-black/60 border border-white/8 rounded p-3 max-h-64 overflow-y-auto text-neon-green">
                      {raw.code}
                    </pre>
                  </>
                ) : (
                  <p className="font-mono text-[11px] text-white/30">No code was submitted for this question.</p>
                )}
                {key.explanations?.[pq.idx] && (
                  <div className="mt-3 rounded-lg border border-[#FFD700]/25 bg-[#FFD700]/[0.04] p-4">
                    <p className="font-mono text-[10px] tracking-wider text-[#FFD700]/80 mb-2">EXPLANATION</p>
                    <MarkdownBlock>{key.explanations[pq.idx]}</MarkdownBlock>
                  </div>
                )}
              </TerminalCard>
            );
          }

          const questionForCard = {
            ...pq,
            correctIndex: key.answers?.[pq.idx],
            explanation: key.explanations?.[pq.idx],
          };
          return (
            <TerminalCard key={pq.idx} filename={`q${i + 1}.txt`} delay={0.05 * i} animate={i < 12}>
              <QuestionCard question={questionForCard} chosen={typeof responses[pq.idx] === "number" ? responses[pq.idx] : null} revealed index={i} showMeta />
            </TerminalCard>
          );
        })}
      </div>
    </PrepShell>
  );
}

function MissingIdScreen() {
  return (
    <PrepShell kicker="// /prep/exams/review — missing_id.sh" title="NO TEST" accent="SELECTED">
      <EmptyState icon={AlertTriangle} title="nothing to review" message="Open this page from the weekend tests list." action={<BracketButton href="/prep/exams">BACK_TO_TESTS</BracketButton>} />
    </PrepShell>
  );
}

function ReviewPageInner() {
  const searchParams = useSearchParams();
  const examId = searchParams.get("id");
  return <RequireOnboarded>{examId ? <ReviewBody examId={examId} /> : <MissingIdScreen />}</RequireOnboarded>;
}

export default function ReviewPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <ReviewPageInner />
    </Suspense>
  );
}
