"use client";

import { useEffect, useState, useRef } from "react";
import { CheckCircle2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  fetchContest, fetchContestQuestions, fetchMyRegistration, fetchMySubmission,
  submitContestAnswers, contestPhase, getContestSettings,
} from "@/lib/contests";
import { seededShuffle } from "@/lib/quizRandom";
import { useIsWindowed } from "@/components/window/is-windowed";
import { resolveRollNumber } from "@/lib/proctoring";
import { useProctorSession } from "@/components/proctor/use-proctor-session";
import { ProctorGate } from "@/components/proctor/proctor-gate";
import { ProctorSelfView, ProctorWarning, ProctorObstruction } from "@/components/proctor/proctor-hud";
import { ContestClipboardLock } from "@/components/proctor/contest-clipboard-lock";

function toDate(v) {
  if (!v) return null;
  return typeof v.toDate === "function" ? v.toDate() : new Date(v);
}

function pad(n) { return String(n).padStart(2, "0"); }

function isBlank(v) {
  return v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0);
}

// Shared by the standalone /arena/contests/attempt route and ContestHub's
// in-place view - see contest-details-view.jsx's header comment for why.
export function ContestAttemptView({ contestId, onBack, onViewResults }) {
  const windowed = useIsWindowed();
  const { user, userData, loading: authLoading } = useAuth();

  const [contest, setContest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [blocked, setBlocked] = useState(null);
  const [answers, setAnswers] = useState({});
  const [qIndex, setQIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Proctoring. `proctorReady` flips once the student has consented and the
  // camera + fullscreen are actually up; the timer is not started before that,
  // so a device problem never eats contest time.
  const [rollNumber, setRollNumber] = useState("");
  const [proctorReady, setProctorReady] = useState(false);

  const answersRef = useRef({});
  const startedAtRef = useRef(null);
  const submittedRef = useRef(false);
  // See the auto-submit guard below - true once the student genuinely had time.
  const clockRanRef = useRef(false);

  useEffect(() => { answersRef.current = answers; }, [answers]);

  useEffect(() => {
    if (authLoading) return;
    if (!contestId) { setBlocked("No contest specified."); setLoading(false); return; }
    if (!user) { window.location.href = `/login?next=${encodeURIComponent(`/arena/contests/attempt?id=${contestId}`)}`; return; }

    (async () => {
      const c = await fetchContest(contestId);
      if (!c) { setBlocked("Contest not found."); setLoading(false); return; }
      const phase = contestPhase(c);
      if (phase !== "live") {
        setBlocked(phase === "past" ? "This contest has ended." : "This contest hasn't started yet.");
        setLoading(false); return;
      }
      const reg = await fetchMyRegistration(contestId, user.uid);
      if (!reg) { setBlocked("You're not registered for this contest."); setLoading(false); return; }
      const existingSub = await fetchMySubmission(contestId, user.uid);
      if (existingSub) { setBlocked("You've already submitted your attempt for this contest."); setLoading(false); return; }

      const qs = await fetchContestQuestions(contestId);
      const shuffled = seededShuffle(qs, `${user.uid}:${contestId}:q`).map(q => ({
        ...q,
        options: q.options?.length ? seededShuffle(q.options, `${user.uid}:${contestId}:${q.id}`) : q.options,
      }));

      // Roll number is resolved before the gate renders so the consent screen
      // can show the student exactly which roll number their photos will be
      // filed under - vague "your photos are stored" wording is what gets
      // consent disputed later.
      if (getContestSettings(c).proctoringEnabled) {
        setRollNumber(await resolveRollNumber(user.uid, userData));
      }

      setContest(c);
      setQuestions(shuffled);
      setLoading(false);
    })();
    // userData is deliberately not a dependency: it arrives from a live profile
    // listener and re-running this would refetch the paper and reshuffle it
    // mid-attempt. The roll number only needs to be right once, at the gate.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, contestId]);

  const settings = getContestSettings(contest);
  const proctored = !!contest && settings.proctoringEnabled;

  // The clock starts only once invigilation is actually up (or immediately, for
  // an unproctored contest). Starting it at load would bill a student for the
  // time they spent granting camera permission.
  const clockRunning = !!contest && (!proctored || proctorReady);

  useEffect(() => {
    if (!clockRunning || startedAtRef.current !== null) return;
    startedAtRef.current = Date.now();
    const end = toDate(contest.contestEnd).getTime();
    const capEnd = startedAtRef.current + (contest.durationMinutes || 60) * 60 * 1000;
    const effectiveEnd = Math.min(end, capEnd);
    setSecondsLeft(Math.max(0, Math.floor((effectiveEnd - Date.now()) / 1000)));
  }, [clockRunning, contest]);

  const handleSubmit = async () => {
    if (submittedRef.current || !user) return;
    submittedRef.current = true;
    setSubmitting(true);
    try {
      const timeTakenSeconds = Math.round((Date.now() - (startedAtRef.current ?? Date.now())) / 1000);
      const maxScore = questions.reduce((sum, q) => sum + (q.marks || 1), 0);
      await submitContestAnswers(contestId, user.uid, answersRef.current, timeTakenSeconds, maxScore);
      // Releases the camera and drops out of fullscreen. Runs after the answers
      // are safely written - never risk the submission for the sake of tidying
      // up the hardware.
      await proctor.finish().catch(() => {});
      setSubmitted(true);
    } catch (e) {
      console.error(e);
      const existingSub = await fetchMySubmission(contestId, user.uid);
      if (existingSub) {
        setBlocked("You've already submitted your attempt for this contest.");
      } else {
        submittedRef.current = false;
        setSubmitError("Something went wrong submitting your attempt. Please try again.");
      }
    }
    finally { setSubmitting(false); }
  };

  // handleSubmit and the proctor session reference each other - the session can
  // force a submit at the violation limit, and a submit tears the session down.
  // Both resolve through closures at call time, so the cycle is fine; the hook
  // keeps onSubmitRequested in a ref precisely so this does not re-register the
  // event listeners on every render.
  const proctor = useProctorSession({
    contestId,
    uid: user?.uid,
    rollNumber,
    displayName: userData?.displayName || user?.displayName || "",
    enabled: proctored,
    snapshotSeconds: settings.proctorSnapshotSeconds,
    requireFullscreen: settings.proctorRequireFullscreen,
    retainFrames: settings.proctorRetainFrames,
    maxViolations: settings.proctorMaxViolations,
    onSubmitRequested: handleSubmit,
  });

  useEffect(() => {
    if (secondsLeft === null || submitted) return;

    if (secondsLeft > 0) clockRanRef.current = true;

    if (secondsLeft <= 0) {
      // Auto-submit only an attempt that actually ran. Firing this on a paper
      // that opened with zero time wrote an EMPTY submission, and
      // fetchMySubmission() then refuses re-entry for any existing doc - so it
      // locked students out of a contest they never sat. See the matching
      // comment in campus-contests.jsx and
      // scripts/clear-empty-contest-submissions.mjs.
      if (clockRanRef.current) handleSubmit();
      else setBlocked("This contest has already ended - there was no time left when the paper opened. Nothing has been submitted for you.");
      return;
    }

    const t = setTimeout(() => setSecondsLeft(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft, submitted]);

  const rootClass = `${windowed ? "min-h-full" : "min-h-screen"} pt-10 pb-32 px-6 relative`;

  if (loading) {
    return <main className={rootClass}><p className="font-mono text-xs text-white/25 animate-pulse text-center mt-20">loading...</p></main>;
  }

  if (blocked) {
    return (
      <main className={rootClass}>
        <div className="max-w-md mx-auto text-center mt-20">
          <p className="font-mono text-sm text-white/50 mb-4">{blocked}</p>
          <button onClick={() => onBack(contestId)} className="font-mono text-xs text-neon-cyan border border-neon-cyan/30 px-4 py-2 rounded-lg hover:bg-neon-cyan/8 transition-colors">
            back to contest
          </button>
        </div>
      </main>
    );
  }

  if (submitted) {
    return (
      <main className={rootClass}>
        <div className="max-w-md mx-auto text-center mt-20">
          <CheckCircle2 size={32} className="mx-auto mb-4" style={{ color: "#00FF41" }} />
          <h1 className="font-sans text-xl font-bold text-white mb-2">Submission Recorded</h1>
          <p className="font-mono text-xs text-white/40 mb-6">
            Results and the leaderboard unlock once the contest ends.
          </p>
          <button onClick={() => onViewResults(contestId)} className="font-mono text-xs text-neon-cyan border border-neon-cyan/30 px-4 py-2 rounded-lg hover:bg-neon-cyan/8 transition-colors">
            go to results page
          </button>
        </div>
      </main>
    );
  }

  // The gate owns the same videoRef the HUD will use, so the stream started here
  // survives straight into the attempt with no second permission prompt.
  if (proctored && !proctorReady) {
    return (
      <main className={rootClass}>
        <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none" />
        <div className="relative">
          <ProctorGate
            contestTitle={contest.title}
            rollNumber={rollNumber}
            snapshotSeconds={settings.proctorSnapshotSeconds}
            requireFullscreen={settings.proctorRequireFullscreen}
            retainFrames={settings.proctorRetainFrames}
            videoRef={proctor.videoRef}
            cameraState={proctor.cameraState}
            cameraError={proctor.cameraError}
            onBegin={async () => {
              const ok = await proctor.begin();
              if (ok) setProctorReady(true);
              return ok;
            }}
            onCancel={() => onBack(contestId)}
          />
        </div>
      </main>
    );
  }

  const q = questions[qIndex];
  const h = Math.floor(secondsLeft / 3600), m = Math.floor((secondsLeft % 3600) / 60), s = secondsLeft % 60;
  const timerColor = secondsLeft > 300 ? "#00FF41" : secondsLeft > 60 ? "#FF9500" : "#FF5050";

  const setAnswer = (value) => setAnswers(p => ({ ...p, [q.id]: value }));

  return (
    <main className={rootClass}>
      <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none" />

      {proctored && (
        <>
          {/* Clipboard lockdown, mounted for the attempt only. The site-wide
              content guard exempts .monaco-editor by design, which leaves the
              code editor - the one field worth pasting a solution into - open
              during an invigilated paper. See that component own header. */}
          <ContestClipboardLock />
          {/* Self-view stays mounted even while obstructed - seeing your own
              face is what makes the overlay feel supervised rather than broken. */}
          <ProctorSelfView
            videoRef={proctor.videoRef}
            cameraState={proctor.cameraState}
            violations={proctor.violations}
            snapshotCount={proctor.snapshotCount}
          />
          <ProctorWarning warning={proctor.warning} onDismiss={proctor.dismissWarning} />
          {proctor.obstructed && (
            <ProctorObstruction
              cameraState={proctor.cameraState}
              cameraError={proctor.cameraError}
              isFullscreen={proctor.isFullscreen}
              requireFullscreen={settings.proctorRequireFullscreen}
              onRetryCamera={proctor.retryCamera}
              onEnterFullscreen={proctor.enterFullscreen}
            />
          )}
        </>
      )}

      <div className="relative max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <p className="font-mono text-xs text-white/30">{contest.title}</p>
          <p className="font-mono text-lg font-bold" style={{ color: timerColor }}>{h > 0 ? `${pad(h)}:` : ""}{pad(m)}:{pad(s)}</p>
        </div>

        <div className="flex gap-1 flex-wrap mb-5">
          {questions.map((qq, i) => (
            <button key={qq.id} onClick={() => setQIndex(i)}
              className="w-6 h-6 rounded font-mono text-[10px] flex items-center justify-center transition-colors"
              style={{
                color: i === qIndex ? "#050505" : !isBlank(answers[qq.id]) ? "#00FF41" : "rgba(255,255,255,0.35)",
                background: i === qIndex ? "#00FFFF" : !isBlank(answers[qq.id]) ? "rgba(0,255,65,0.12)" : "rgba(255,255,255,0.04)",
              }}>
              {i + 1}
            </button>
          ))}
        </div>

        <div className="terminal-window">
          <div className="terminal-header">
            <div className="terminal-dot bg-red-500/70" /><div className="terminal-dot bg-yellow-500/70" /><div className="terminal-dot bg-green-500/70" />
            <span className="font-mono text-[10px] text-white/25 ml-2">question {qIndex + 1} / {questions.length}</span>
          </div>
          <div className="p-5">
            <p className="font-mono text-[13px] text-white/80 leading-relaxed mb-5 whitespace-pre-wrap">{q.question}</p>

            {q.type === "fillblank" ? (
              <input value={answers[q.id] || ""} onChange={e => setAnswer(e.target.value)}
                placeholder="type your answer..."
                className="w-full font-mono text-sm text-white/80 px-4 py-3 rounded-lg outline-none"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }} />
            ) : (
              <div className="space-y-2">
                {q.options.map(opt => {
                  const isMulti = q.type === "multiselect";
                  const current = answers[q.id];
                  const isSelected = isMulti ? (current || []).includes(opt.id) : current === opt.id;
                  return (
                    <button key={opt.id} onClick={() => {
                      if (isMulti) {
                        const arr = answers[q.id] || [];
                        setAnswer(arr.includes(opt.id) ? arr.filter(i => i !== opt.id) : [...arr, opt.id]);
                      } else {
                        setAnswer(opt.id);
                      }
                    }}
                      className="w-full flex items-center gap-2.5 px-4 py-3 rounded-lg text-left transition-colors"
                      style={{
                        background: isSelected ? "rgba(0,255,255,0.06)" : "rgba(255,255,255,0.03)",
                        border: isSelected ? "1px solid rgba(0,255,255,0.3)" : "1px solid rgba(255,255,255,0.06)",
                      }}>
                      <span className="w-4 h-4 flex-shrink-0"
                        style={{
                          borderRadius: isMulti ? 4 : 999,
                          border: `1px solid ${isSelected ? "#00FFFF" : "rgba(255,255,255,0.2)"}`,
                          background: isSelected ? "#00FFFF" : "transparent",
                        }} />
                      <span className="font-mono text-[13px] text-white/75">{opt.text}</span>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button onClick={() => setQIndex(i => Math.max(0, i - 1))} disabled={qIndex === 0}
                className="font-mono text-xs px-4 py-2.5 rounded-lg border border-white/10 text-white/40 hover:text-white/70 transition-colors disabled:opacity-30">
                ← prev
              </button>
              {qIndex < questions.length - 1 ? (
                <button onClick={() => setQIndex(i => Math.min(questions.length - 1, i + 1))}
                  className="flex-1 font-mono text-xs py-2.5 rounded-lg border border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/8 transition-colors">
                  next →
                </button>
              ) : (
                <button onClick={handleSubmit} disabled={submitting}
                  className="flex-1 font-mono text-xs py-2.5 rounded-lg border border-neon-green/30 text-neon-green hover:bg-neon-green/8 transition-colors disabled:opacity-50">
                  {submitting ? "submitting..." : "submit contest"}
                </button>
              )}
            </div>
          </div>
        </div>

        {submitError && <p className="font-mono text-[10px] text-red-400 mt-3 text-center">{submitError}</p>}

        <button onClick={() => { if (confirm("Submit your contest now? You can't change answers after this.")) handleSubmit(); }}
          disabled={submitting}
          className="w-full mt-4 font-mono text-[10px] text-white/25 hover:text-red-400 transition-colors disabled:opacity-30">
          submit early
        </button>
      </div>
    </main>
  );
}
