"use client";

// /prep/contests/run?id=X — the live contest runner (design §2, §5, §6).
//
// Integrity model: the paper (prompts/starter/public tests, no answers) is
// only readable once the exam has started (Firestore rules time-gate it) —
// a permission-denied here just means "not started yet", handled as a
// state, not an error. The submission doc is created on first entry and
// every RUN_TESTS result autosaves into it (debounced 5s per question) via
// upsertSubmission; final SUBMIT_CONTEST flushes pending autosaves, then
// writes the full responses map + status:'submitted' — after that, writes
// are rejected by rules (write-once semantics) so the recap always reads
// the true submitted state back from Firestore.

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, Loader2, Lock, Send, Swords, Trophy } from "lucide-react";
import {
  PrepShell,
  TerminalCard,
  BracketButton,
  NeonBadge,
  Tag,
  Countdown,
  PrepModal,
  MarkdownBlock,
  EmptyState,
  ProgressBar,
} from "@/components/prep/ui";
import CodeRunner from "@/components/prep/CodeRunner";
import QuestionTabs from "@/components/prep/code/QuestionTabs";
import { RequireOnboarded } from "@/components/prep/guards";
import { useAuth } from "@/context/AuthContext";
import {
  getExam,
  getPaper,
  getMySubmission,
  startSubmission,
  upsertSubmission,
  submitExam,
} from "@/lib/prep/db";
import { scoreSubmission } from "@/lib/prep/grading";
import { CATEGORY_MAP } from "@/lib/prep/constants";

const DEBOUNCE_MS = 5000;

function toMs(ts) {
  if (!ts) return null;
  if (typeof ts.toMillis === "function") return ts.toMillis();
  if (ts instanceof Date) return ts.getTime();
  if (typeof ts === "number") return ts;
  return null;
}

function ContestRunContent() {
  const params = useSearchParams();
  const examId = params.get("id");
  const { user, profile } = useAuth();

  const [phase, setPhase] = useState("loading");
  // loading | not-found | not-started | active | submitted | closed | error
  const [errMsg, setErrMsg] = useState("");
  const [exam, setExam] = useState(null);
  const [paper, setPaper] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [responses, setResponses] = useState({});
  const [activeIdx, setActiveIdx] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // Rough clock-skew correction (design §5.4): measured once at start so the
  // client-side Countdown lines up with the server-enforced deadline instead
  // of the student's possibly-wrong system clock.
  const [skewMs, setSkewMs] = useState(0);

  const timersRef = useRef({});

  const load = useCallback(async () => {
    if (!user) return;
    if (!examId) {
      setPhase("not-found");
      return;
    }
    setPhase("loading");
    setErrMsg("");
    try {
      const ex = await getExam(examId);
      if (!ex || ex.kind !== "coding-contest") {
        setPhase("not-found");
        return;
      }
      setExam(ex);
      const startMs = toMs(ex.startsAt);
      const endMs = toMs(ex.endsAt);
      const now = Date.now();

      const mySub = await getMySubmission(examId, user.uid);

      if (mySub && mySub.status === "submitted") {
        setSubmission(mySub);
        setResponses(mySub.responses || {});
        const p = await getPaper(examId).catch(() => null);
        setPaper(p);
        setPhase("submitted");
        return;
      }

      if (startMs != null && now < startMs) {
        setPhase("not-started");
        return;
      }

      if (endMs != null && now > endMs) {
        setSubmission(mySub);
        setResponses(mySub?.responses || {});
        setPhase("closed");
        return;
      }

      // Only measure skew on a brand-new start: if a submission already
      // existed, `started.startedAt` is from whenever the student first
      // entered (possibly long ago), and comparing it to "now" would measure
      // elapsed session time, not clock skew.
      const isFreshStart = !mySub;
      const t0 = Date.now();
      const started = await startSubmission(examId, user.uid, {
        rollNumber: profile?.rollNumber,
        classGroup: profile?.classGroup,
        branch: profile?.branch,
        displayName: profile?.displayName || user.displayName || "",
      });
      const t1 = Date.now();
      if (isFreshStart) {
        const serverStartedMs = toMs(started?.startedAt);
        if (serverStartedMs != null) setSkewMs((t0 + t1) / 2 - serverStartedMs);
      }

      setSubmission(started);
      setResponses(started?.responses || {});
      const p = await getPaper(examId);
      setPaper(p);
      setPhase("active");
    } catch (e) {
      const msg = e?.message || "Failed to load contest";
      if (/permission-denied/i.test(msg) || /unlocks when the exam starts/i.test(msg)) {
        setPhase("not-started");
      } else {
        setErrMsg(msg);
        setPhase("error");
      }
    }
  }, [examId, user, profile]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(
    () => () => {
      Object.values(timersRef.current).forEach(clearTimeout);
    },
    []
  );

  const scheduleSave = useCallback(
    (idx, entry) => {
      if (timersRef.current[idx]) clearTimeout(timersRef.current[idx]);
      timersRef.current[idx] = setTimeout(() => {
        upsertSubmission(examId, user.uid, { responses: { [idx]: entry } }).catch(() => {
          // transient failure — the next RUN_TESTS on this question retries the save
        });
      }, DEBOUNCE_MS);
    },
    [examId, user]
  );

  const handleResult = useCallback(
    (idx, lang, code, summary) => {
      const entry = { lang, code, publicPassed: summary.passed, publicTotal: summary.total };
      setResponses((prev) => ({ ...prev, [idx]: entry }));
      scheduleSave(idx, entry);
    },
    [scheduleSave]
  );

  const flushAll = useCallback(async () => {
    Object.values(timersRef.current).forEach(clearTimeout);
    timersRef.current = {};
    try {
      await upsertSubmission(examId, user.uid, { responses });
    } catch {
      // best-effort; submitExam below sends the authoritative full map anyway
    }
  }, [examId, user, responses]);

  const doSubmit = useCallback(async () => {
    if (submitting || !user) return;
    setSubmitting(true);
    setErrMsg("");
    try {
      await flushAll();
      await submitExam(examId, user.uid, responses);
      const fresh = await getMySubmission(examId, user.uid);
      setSubmission(fresh);
      setResponses(fresh?.responses || responses);
      setPhase("submitted");
      setShowConfirm(false);
    } catch (e) {
      setErrMsg(e?.message || "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  }, [submitting, user, flushAll, examId, responses]);

  const autoSubmittedRef = useRef(false);
  const handleAutoSubmit = useCallback(() => {
    if (autoSubmittedRef.current || phase !== "active") return;
    autoSubmittedRef.current = true;
    doSubmit();
  }, [doSubmit, phase]);

  const questions = useMemo(() => paper?.questions || [], [paper]);
  const question = questions[activeIdx];

  const attemptedMap = useMemo(() => {
    const m = {};
    questions.forEach((q) => {
      const r = responses[q.idx];
      m[q.idx] = !!(r && (r.code || r.publicTotal));
    });
    return m;
  }, [questions, responses]);

  const endTargetMs = useMemo(() => {
    if (!exam || !submission) return null;
    const endMs = toMs(exam.endsAt);
    const startedMs = toMs(submission.startedAt) ?? Date.now();
    const durMs = (Number(exam.durationMins) || 0) * 60000;
    const deadline = endMs != null ? Math.min(endMs, startedMs + durMs) : startedMs + durMs;
    return deadline + skewMs;
  }, [exam, submission, skewMs]);

  const startTargetMs = useMemo(() => {
    const ms = toMs(exam?.startsAt);
    return ms != null ? ms + skewMs : null;
  }, [exam, skewMs]);

  if (phase === "loading") {
    return (
      <PrepShell kicker="// /prep/contests/run — loading.sh" title="LOADING" accent="CONTEST">
        <div className="flex items-center gap-3 font-mono text-sm text-white/40">
          <Loader2 size={16} className="animate-spin text-neon-cyan/60" />
          fetching contest data…
        </div>
      </PrepShell>
    );
  }

  if (phase === "not-found") {
    return (
      <PrepShell kicker="// /prep/contests/run — 404.sh" title="CONTEST" accent="NOT_FOUND">
        <EmptyState
          icon={AlertTriangle}
          title="contest not found"
          message="This link is invalid, or the contest was removed."
          action={<BracketButton href="/prep/contests">BACK_TO_CONTESTS</BracketButton>}
        />
      </PrepShell>
    );
  }

  if (phase === "error") {
    return (
      <PrepShell kicker="// /prep/contests/run — error.sh" title="SOMETHING" accent="BROKE">
        <EmptyState
          icon={AlertTriangle}
          title="couldn't load this contest"
          message={errMsg}
          action={<BracketButton onClick={load}>RETRY</BracketButton>}
        />
      </PrepShell>
    );
  }

  if (phase === "not-started") {
    return (
      <PrepShell kicker="// /prep/contests/run — locked.sh" title="NOT" accent="STARTED">
        <TerminalCard filename="waiting_room.sh" icon={Lock}>
          <h3 className="font-sans text-xl font-bold text-white mb-2">{exam?.title || "Contest"}</h3>
          <p className="font-mono text-xs text-white/40 mb-5 leading-relaxed">
            The question paper unlocks the moment this contest starts. Leave this tab open — it will
            unlock itself.
          </p>
          {startTargetMs != null && (
            <Countdown target={startTargetMs} prefix="starts in" onExpire={load} className="text-lg" />
          )}
          <div className="mt-5">
            <BracketButton onClick={load} variant="ghost">
              REFRESH
            </BracketButton>
          </div>
        </TerminalCard>
      </PrepShell>
    );
  }

  if (phase === "closed") {
    return (
      <PrepShell kicker="// /prep/contests/run — closed.sh" title="WINDOW" accent="CLOSED">
        <TerminalCard filename="closed.sh" icon={Lock}>
          <h3 className="font-sans text-xl font-bold text-white mb-2">{exam?.title || "Contest"}</h3>
          <p className="font-mono text-xs text-white/40 leading-relaxed">
            {submission
              ? "The contest window ended before you submitted. Only submitted attempts are scored — your last autosaved answers were not counted."
              : "The contest window has closed. You did not enter before it ended."}
          </p>
          <div className="mt-5">
            <BracketButton href="/prep/contests" variant="ghost">
              BACK_TO_CONTESTS
            </BracketButton>
          </div>
        </TerminalCard>
      </PrepShell>
    );
  }

  if (phase === "submitted") {
    const score = scoreSubmission(submission?.responses || responses, {}, paper || { questions: [] });
    const totalPassed = (paper?.questions || []).reduce(
      (s, q) => s + (submission?.responses?.[q.idx]?.publicPassed || 0),
      0
    );
    const totalCases = (paper?.questions || []).reduce(
      (s, q) => s + (submission?.responses?.[q.idx]?.publicTotal || 0),
      0
    );
    const accuracy = totalCases > 0 ? Math.round((totalPassed / totalCases) * 100) : 0;

    return (
      <PrepShell kicker="// /prep/contests/run — recap.sh" title="SUBMISSION" accent="RECAP">
        <TerminalCard filename="recap.sh" icon={Trophy} className="mb-6">
          <div className="flex items-center gap-6 flex-wrap">
            <div>
              <p className="font-mono text-[10px] tracking-wider text-white/30 uppercase mb-1">score</p>
              <p className="font-sans text-3xl font-bold text-white">
                {score.total}
                <span className="text-white/30 text-lg"> / {score.max}</span>
              </p>
            </div>
            <div className="flex-1 min-w-[180px]">
              <ProgressBar
                value={accuracy}
                color={accuracy >= 70 ? "#00FF41" : accuracy >= 40 ? "#FF9500" : "#FF3B3B"}
                label={`PUBLIC_TEST_ACCURACY — ${totalPassed}/${totalCases}`}
              />
            </div>
          </div>
        </TerminalCard>

        {(paper?.questions || []).length === 0 ? (
          <EmptyState title="paper unavailable" message="Your submission was recorded, but the question paper could not be reloaded for recap." />
        ) : (
          <div className="space-y-4">
            {(paper?.questions || []).map((q, i) => {
              const r = submission?.responses?.[q.idx];
              const passed = r?.publicPassed || 0;
              const total = r?.publicTotal || 0;
              const cat = CATEGORY_MAP[q.category];
              const color = total > 0 && passed === total ? "#00FF41" : passed > 0 ? "#FF9500" : "#FF3B3B";
              return (
                <TerminalCard key={q.idx} filename={`Q${i + 1}.${q.category || "coding"}`} delay={i * 0.05}>
                  <div className="flex items-center gap-2 flex-wrap mb-3">
                    <NeonBadge color="#00FFFF">Q{i + 1}</NeonBadge>
                    {cat && <NeonBadge color={cat.color}>{cat.label.toUpperCase()}</NeonBadge>}
                    <span className="ml-auto font-mono text-xs" style={{ color }}>
                      {passed}/{total} tests
                    </span>
                  </div>
                  <MarkdownBlock className="mb-2">{q.prompt}</MarkdownBlock>
                  {r?.lang && <p className="font-mono text-[10px] text-white/25">submitted in {r.lang}</p>}
                </TerminalCard>
              );
            })}
          </div>
        )}

        <div className="mt-8">
          <BracketButton href="/prep/contests" variant="ghost">
            BACK_TO_CONTESTS
          </BracketButton>
        </div>
      </PrepShell>
    );
  }

  // phase === "active"
  return (
    <PrepShell
      kicker={`// /prep/contests/run — ${exam?.title || "contest"}.sh`}
      title="CODING"
      accent="CONTEST"
      subtitle={exam?.description}
      actions={
        <div className="flex items-center gap-4 flex-wrap">
          {endTargetMs != null && (
            <Countdown
              target={endTargetMs}
              onExpire={handleAutoSubmit}
              prefix="time left"
              warnUnderMs={5 * 60 * 1000}
              className="text-base"
            />
          )}
          <BracketButton variant="green" onClick={() => setShowConfirm(true)}>
            <Send size={11} className="inline -mt-0.5 mr-1" />
            SUBMIT_CONTEST
          </BracketButton>
        </div>
      }
    >
      {errMsg && (
        <div className="mb-4 flex items-start gap-2 rounded border border-[#FF3B3B]/30 bg-[#FF3B3B]/[0.05] px-3 py-2.5">
          <AlertTriangle size={13} className="text-[#FF3B3B] flex-shrink-0 mt-0.5" />
          <p className="font-mono text-[11px] text-[#FF3B3B]">{errMsg}</p>
        </div>
      )}

      <QuestionTabs questions={questions} activeIdx={activeIdx} onSelect={setActiveIdx} attempted={attemptedMap} />

      {question ? (
        <TerminalCard filename={`Q${activeIdx + 1}.${question.category || "coding"}`} icon={Swords}>
          <div className="flex items-center gap-2 flex-wrap mb-4">
            <NeonBadge color="#00FFFF">
              Q{activeIdx + 1} / {questions.length}
            </NeonBadge>
            <Tag>{question.marks} marks</Tag>
            {question.topic && <Tag>{question.topic}</Tag>}
          </div>
          <MarkdownBlock className="mb-6">{question.prompt}</MarkdownBlock>
          <CodeRunner
            key={`${examId}-${question.idx}`}
            question={{ id: `${examId}_q${question.idx}` }}
            starterCode={question.starterCode}
            testCases={question.publicTestCases}
            onResult={(lang, code, summary) => handleResult(question.idx, lang, code, summary)}
            heightClass="h-[50vh] min-h-[360px]"
          />
        </TerminalCard>
      ) : (
        <EmptyState title="no questions in this paper" message="Contact staff — this contest has no questions attached." />
      )}

      <PrepModal
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        title="Submit this contest?"
        filename="confirm_submit.sh"
        footer={
          <>
            <BracketButton variant="ghost" onClick={() => setShowConfirm(false)} disabled={submitting}>
              CANCEL
            </BracketButton>
            <BracketButton variant="green" onClick={doSubmit} loading={submitting} loadingText="SUBMITTING">
              CONFIRM_SUBMIT
            </BracketButton>
          </>
        }
      >
        <p className="font-mono text-xs text-white/50 leading-relaxed">
          Once submitted you cannot change your answers. Make sure you&apos;ve run{" "}
          <span className="text-neon-green">RUN_TESTS</span> on every question you want scored — only
          the last saved run per question counts.
        </p>
      </PrepModal>
    </PrepShell>
  );
}

function ContestRunFallback() {
  return (
    <PrepShell kicker="// /prep/contests/run — loading.sh" title="LOADING" accent="CONTEST">
      <div className="font-mono text-sm text-white/40">preparing…</div>
    </PrepShell>
  );
}

export default function ContestRunPage() {
  return (
    <RequireOnboarded>
      <Suspense fallback={<ContestRunFallback />}>
        <ContestRunContent />
      </Suspense>
    </RequireOnboarded>
  );
}
