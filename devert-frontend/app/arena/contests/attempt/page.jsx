"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  fetchContest, fetchContestQuestions, fetchMyRegistration, fetchMySubmission,
  submitContestAnswers, contestPhase,
} from "@/lib/contests";
import { seededShuffle } from "@/lib/contestRandom";

function toDate(v) {
  if (!v) return null;
  return typeof v.toDate === "function" ? v.toDate() : new Date(v);
}

function pad(n) { return String(n).padStart(2, "0"); }

function isBlank(v) {
  return v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0);
}

function ContestAttemptContent() {
  const contestId = useSearchParams().get("id");
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [contest, setContest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [blocked, setBlocked] = useState(null);
  const [answers, setAnswers] = useState({});
  const [qIndex, setQIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const answersRef = useRef({});
  const startedAtRef = useRef(null);
  const submittedRef = useRef(false);

  useEffect(() => { answersRef.current = answers; }, [answers]);

  useEffect(() => {
    if (authLoading) return;
    if (!contestId) { setBlocked("No contest specified."); setLoading(false); return; }
    if (!user) { router.replace(`/login?next=${encodeURIComponent(`/arena/contests/attempt?id=${contestId}`)}`); return; }

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

      const end = toDate(c.contestEnd).getTime();
      startedAtRef.current = Date.now();
      const capEnd = startedAtRef.current + (c.durationMinutes || 60) * 60 * 1000;
      const effectiveEnd = Math.min(end, capEnd);

      setContest(c);
      setQuestions(shuffled);
      setSecondsLeft(Math.max(0, Math.floor((effectiveEnd - Date.now()) / 1000)));
      setLoading(false);
    })();
  }, [authLoading, user, contestId]);

  const handleSubmit = async () => {
    if (submittedRef.current || !user) return;
    submittedRef.current = true;
    setSubmitting(true);
    try {
      const timeTakenSeconds = Math.round((Date.now() - startedAtRef.current) / 1000);
      await submitContestAnswers(contestId, user.uid, answersRef.current, timeTakenSeconds);
      setSubmitted(true);
    } catch (e) { console.error(e); submittedRef.current = false; }
    finally { setSubmitting(false); }
  };

  useEffect(() => {
    if (secondsLeft === null || submitted) return;
    if (secondsLeft <= 0) { handleSubmit(); return; }
    const t = setTimeout(() => setSecondsLeft(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft, submitted]);

  if (loading) {
    return <main className="min-h-screen pt-10 pb-32 px-6"><p className="font-mono text-xs text-white/25 animate-pulse text-center mt-20">loading...</p></main>;
  }

  if (blocked) {
    return (
      <main className="min-h-screen pt-10 pb-32 px-6">
        <div className="max-w-md mx-auto text-center mt-20">
          <p className="font-mono text-sm text-white/50 mb-4">{blocked}</p>
          <Link href={`/arena/contests/details?id=${contestId}`} className="font-mono text-xs text-neon-cyan border border-neon-cyan/30 px-4 py-2 rounded-lg hover:bg-neon-cyan/8 transition-colors">
            back to contest
          </Link>
        </div>
      </main>
    );
  }

  if (submitted) {
    return (
      <main className="min-h-screen pt-10 pb-32 px-6">
        <div className="max-w-md mx-auto text-center mt-20">
          <CheckCircle2 size={32} className="mx-auto mb-4" style={{ color: "#00FF41" }} />
          <h1 className="font-sans text-xl font-bold text-white mb-2">Submission Recorded</h1>
          <p className="font-mono text-xs text-white/40 mb-6">
            Results and the leaderboard unlock once the contest ends.
          </p>
          <Link href={`/arena/contests/results?id=${contestId}`} className="font-mono text-xs text-neon-cyan border border-neon-cyan/30 px-4 py-2 rounded-lg hover:bg-neon-cyan/8 transition-colors">
            go to results page
          </Link>
        </div>
      </main>
    );
  }

  const q = questions[qIndex];
  const h = Math.floor(secondsLeft / 3600), m = Math.floor((secondsLeft % 3600) / 60), s = secondsLeft % 60;
  const timerColor = secondsLeft > 300 ? "#00FF41" : secondsLeft > 60 ? "#FF9500" : "#FF5050";

  const setAnswer = (value) => setAnswers(p => ({ ...p, [q.id]: value }));

  return (
    <main className="min-h-screen pt-10 pb-32 px-6 relative">
      <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none" />
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

        <button onClick={() => { if (confirm("Submit your contest now? You can't change answers after this.")) handleSubmit(); }}
          disabled={submitting}
          className="w-full mt-4 font-mono text-[10px] text-white/25 hover:text-red-400 transition-colors disabled:opacity-30">
          submit early
        </button>
      </div>
    </main>
  );
}

export default function ContestAttemptPage() {
  return (
    <Suspense fallback={null}>
      <ContestAttemptContent />
    </Suspense>
  );
}
