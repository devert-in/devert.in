"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Zap, Coins, ListChecks, Medal, Trophy, Target, Clock, TrendingUp, TrendingDown, XCircle, MinusCircle, BarChart3 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  fetchContest, fetchContestQuestions, fetchContestAnswerKeys, fetchMyRegistration,
  fetchMySubmission, registerForContest, submitContestAnswers, contestPhase,
  gradeSubmission, computeRewards, persistGrading, fetchLeaderboard, fetchMyRank,
  getContestSettings, isSettingReleased, isAnswerCorrect,
} from "@/lib/contests";
import { seededShuffle } from "@/lib/contestRandom";
import { CAMPUS } from "@/lib/campus-theme";
import { CampusCard, CampusChip, CampusGoogleButton, CampusBackButton, CampusSkeleton, CampusEmptyState, CampusTable } from "@/components/campus/campus-ui";

// Native, light-themed port of components/contests/{attempt,details,results}-view.jsx
// for DeVert Campus - reuses every read/write/grading/shuffle function from
// lib/contests.js + lib/contestRandom.js verbatim (all pure or Firestore-only,
// zero dark-theme coupling - see the port research). Only the JSX chrome
// changes. Never redirects to devert.in for auth - shows the same inline
// CampusGoogleButton "sign in to continue" pattern used elsewhere in Campus,
// instead of the dark app's `window.location.href = "/login?next=..."`.

const DIFF_COLOR = { Easy: CAMPUS.good, Medium: CAMPUS.warn, Hard: CAMPUS.bad };

function toDate(v) {
  if (!v) return null;
  return typeof v.toDate === "function" ? v.toDate() : new Date(v);
}
function pad(n) { return String(n).padStart(2, "0"); }
function isBlank(v) {
  return v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0);
}
function formatDate(v) {
  const d = toDate(v);
  if (!d) return "TBA";
  return d.toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
function formatCountdown(ms) {
  if (ms <= 0) return "00:00:00";
  const totalSec = Math.floor(ms / 1000);
  const days = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return days > 0 ? `${days}d ${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(h)}:${pad(m)}:${pad(s)}`;
}

function SignInPrompt({ message }) {
  return (
    <CampusCard className="p-7 text-center max-w-sm mx-auto">
      <h3 className="text-[16px] font-semibold mb-2" style={{ color: CAMPUS.ink }}>Sign in to continue</h3>
      <p className="text-[13px] mb-5" style={{ color: CAMPUS.inkSoft }}>{message}</p>
      <CampusGoogleButton style={{ background: CAMPUS.ink, color: "#fff" }} />
    </CampusCard>
  );
}

// ---------------- List ----------------

export function CampusContestList({ contests, loading, onSelect }) {
  if (loading) {
    return (
      <div className="space-y-2.5">
        {[0, 1, 2].map(i => (
          <CampusCard key={i} className="p-4 flex items-center gap-3">
            <CampusSkeleton variant="rect" width={36} height={36} />
            <div className="flex-1 space-y-2">
              <CampusSkeleton variant="text" width="50%" />
              <CampusSkeleton variant="text" width="30%" />
            </div>
          </CampusCard>
        ))}
      </div>
    );
  }
  if (contests.length === 0) {
    return <CampusEmptyState icon={Trophy} title="No contests yet" description="Check back soon." />;
  }
  return (
    <div className="space-y-2.5">
      {contests.map(c => {
        const phase = contestPhase(c);
        return (
          <button key={c.id} onClick={() => onSelect(c.id)} className="block w-full text-left">
            <CampusCard hover className="p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: CAMPUS.purpleTint, color: CAMPUS.purple }}>
                <Trophy size={15} />
              </div>
              <div className="flex-1 min-w-0">
                <b className="block text-[13.5px] truncate" style={{ color: CAMPUS.ink }}>{c.title}</b>
                <span className="text-[11px]" style={{ color: CAMPUS.inkFaint }}>{c.category}{c.difficulty ? ` · ${c.difficulty}` : ""}</span>
              </div>
              <CampusChip color={phase === "live" ? CAMPUS.good : phase === "upcoming" ? CAMPUS.warn : CAMPUS.inkFaint}>{phase.toUpperCase()}</CampusChip>
            </CampusCard>
          </button>
        );
      })}
    </div>
  );
}

// ---------------- Details ----------------

function Stat({ label, value }) {
  return (
    <div>
      <p className="text-[9px] font-mono tracking-widest mb-0.5" style={{ color: CAMPUS.inkFaint }}>{label}</p>
      <p className="text-xs" style={{ color: CAMPUS.inkSoft }}>{value}</p>
    </div>
  );
}

export function CampusContestDetails({ contestId, onBack, onEnterAttempt, onViewResults }) {
  const { user } = useAuth();
  const [contest, setContest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registered, setRegistered] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    if (!contestId) { setLoading(false); return; }
    fetchContest(contestId).then(setContest).catch(console.error).finally(() => setLoading(false));
  }, [contestId]);

  useEffect(() => {
    if (!user || !contestId) { setRegistered(false); return; }
    fetchMyRegistration(contestId, user.uid).then(r => setRegistered(!!r)).catch(console.error);
  }, [user, contestId]);

  useEffect(() => {
    const iv = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(iv);
  }, []);

  const handleRegister = async () => {
    if (!user) return;
    setRegistering(true);
    try {
      await registerForContest(contestId, user.uid);
      setRegistered(true);
    } catch (e) { console.error(e); }
    finally { setRegistering(false); }
  };

  if (loading) {
    return (
      <div className="max-w-2xl space-y-4">
        <CampusSkeleton variant="text" width={110} />
        <CampusCard className="p-5 space-y-3">
          <CampusSkeleton variant="text" width="70%" height={22} />
          <CampusSkeleton variant="text" />
          <CampusSkeleton variant="text" width="50%" />
        </CampusCard>
      </div>
    );
  }
  if (!contest) return <CampusEmptyState icon={Trophy} title="Contest not found" description="This contest may have ended or been removed." />;

  const settings = getContestSettings(contest);
  const leaderboardVisible = settings.leaderboardEnabled && settings.rankingVisibility !== "hidden";
  const phase = contestPhase(contest, now);
  const start = toDate(contest.contestStart);
  const end = toDate(contest.contestEnd);
  const countdownTarget = phase === "upcoming" || phase === "closed" ? start : phase === "live" ? end : null;
  const countdown = countdownTarget ? formatCountdown(countdownTarget.getTime() - now.getTime()) : null;

  return (
    <div className="max-w-2xl">
      <CampusBackButton onClick={onBack} />

      {contest.bannerUrl && (
        <div className="w-full h-40 rounded-xl mb-5 bg-cover bg-center" style={{ backgroundImage: `url(${contest.bannerUrl})`, border: `1px solid ${CAMPUS.line}` }} />
      )}

      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <CampusChip color={CAMPUS.inkFaint}>{contest.category}</CampusChip>
        <CampusChip color={DIFF_COLOR[contest.difficulty] || CAMPUS.good}>{contest.difficulty}</CampusChip>
      </div>
      <h1 className="text-2xl font-bold mb-4 leading-tight" style={{ color: CAMPUS.ink }}>{contest.title}</h1>

      {countdown && (
        <CampusCard className="p-5 text-center mb-5">
          <p className="text-[10px] font-mono tracking-wider mb-2" style={{ color: CAMPUS.inkFaint }}>{phase === "live" ? "TIME REMAINING" : "STARTS IN"}</p>
          <p className="text-3xl font-bold font-mono" style={{ color: phase === "live" ? CAMPUS.warn : CAMPUS.teal }}>{countdown}</p>
        </CampusCard>
      )}

      <CampusCard className="p-5 space-y-4 mb-5">
        {contest.description && <p className="text-xs leading-relaxed whitespace-pre-wrap" style={{ color: CAMPUS.inkSoft }}>{contest.description}</p>}
        {contest.rules && (
          <div>
            <p className="text-[9px] font-mono tracking-widest mb-1" style={{ color: CAMPUS.inkFaint }}>RULES</p>
            <p className="text-xs leading-relaxed whitespace-pre-wrap" style={{ color: CAMPUS.inkSoft }}>{contest.rules}</p>
          </div>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-3" style={{ borderTop: `1px solid ${CAMPUS.line}` }}>
          <Stat label="ELIGIBILITY" value={contest.eligibility || "Open to all"} />
          <Stat label="ORGANIZER" value={contest.organizer || "DeVert"} />
          <Stat label="DURATION" value={`${contest.durationMinutes} min`} />
          <Stat label="REGISTRATION ENDS" value={formatDate(contest.registrationEnd)} />
          <Stat label="CONTEST STARTS" value={formatDate(contest.contestStart)} />
          <Stat label="CONTEST ENDS" value={formatDate(contest.contestEnd)} />
          <Stat label="PARTICIPANTS" value={contest.participantCount || 0} />
          <Stat label="QUESTIONS" value={contest.questionCount || 0} />
        </div>
        <div className="flex items-center gap-4 text-xs pt-3" style={{ borderTop: `1px solid ${CAMPUS.line}` }}>
          {contest.prizeXp > 0 && <span className="flex items-center gap-1" style={{ color: CAMPUS.good }}><Zap size={12} /> {contest.prizeXp} XP</span>}
          {contest.prizeCoins > 0 && <span className="flex items-center gap-1" style={{ color: CAMPUS.gold }}><Coins size={12} /> {contest.prizeCoins} coins</span>}
          {contest.prizeText && <span style={{ color: CAMPUS.inkFaint }}>{contest.prizeText}</span>}
        </div>
      </CampusCard>

      {!user ? (
        <SignInPrompt message="You'll need a DeVert account to register for this contest." />
      ) : (
        <div className="flex gap-3 flex-wrap">
          {registered ? (
            phase === "live" ? (
              <button onClick={() => onEnterAttempt(contestId)} className="flex-1 text-center text-sm font-semibold py-3 rounded-xl transition-colors"
                style={{ color: CAMPUS.good, border: `1px solid ${CAMPUS.good}50`, background: CAMPUS.goodTint }}>
                enter contest →
              </button>
            ) : phase === "past" ? (
              <button onClick={() => onViewResults(contestId)} className="flex-1 text-center text-sm font-semibold py-3 rounded-xl transition-colors"
                style={{ color: CAMPUS.teal, border: `1px solid ${CAMPUS.teal}50`, background: CAMPUS.tealTint }}>
                view results
              </button>
            ) : (
              <span className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold py-3 rounded-xl" style={{ color: CAMPUS.good, border: `1px solid ${CAMPUS.good}50` }}>
                <CheckCircle2 size={14} /> registered — come back at start time
              </span>
            )
          ) : phase === "past" ? (
            <button onClick={() => onViewResults(contestId)} className="flex-1 text-center text-sm font-semibold py-3 rounded-xl transition-colors"
              style={{ color: CAMPUS.teal, border: `1px solid ${CAMPUS.teal}50`, background: CAMPUS.tealTint }}>
              view results
            </button>
          ) : phase === "closed" ? (
            <span className="flex-1 text-center text-sm py-3 rounded-xl" style={{ color: CAMPUS.inkFaint, border: `1px solid ${CAMPUS.line}` }}>registration closed</span>
          ) : (
            <button onClick={handleRegister} disabled={registering} className="flex-1 text-sm font-semibold py-3 rounded-xl disabled:opacity-50 transition-colors"
              style={{ color: CAMPUS.good, border: `1px solid ${CAMPUS.good}50`, background: CAMPUS.goodTint }}>
              {registering ? "registering..." : "register for contest"}
            </button>
          )}
          {leaderboardVisible && (
            <button onClick={() => onViewResults(contestId)} className="text-sm px-5 py-3 rounded-xl flex items-center gap-2 transition-colors"
              style={{ color: CAMPUS.inkSoft, border: `1px solid ${CAMPUS.line}` }}>
              <ListChecks size={14} /> leaderboard
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------- Attempt ----------------

export function CampusContestAttempt({ contestId, onBack, onViewResults }) {
  const { user } = useAuth();

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

  const answersRef = useRef({});
  const startedAtRef = useRef(null);
  const submittedRef = useRef(false);
  // Per-question timing for the Student Analysis Dashboard's "time per
  // question" / "fastest correct answer" - accumulated across however many
  // times a student revisits a question, not just first-visit duration.
  const timingsRef = useRef({});
  const questionEnteredAtRef = useRef(null);

  const recordElapsed = () => {
    if (questionEnteredAtRef.current == null) return;
    const q = questions[qIndex];
    if (!q) return;
    const elapsed = Math.round((Date.now() - questionEnteredAtRef.current) / 1000);
    timingsRef.current[q.id] = (timingsRef.current[q.id] || 0) + elapsed;
  };
  const goToQuestion = (newIndex) => {
    recordElapsed();
    questionEnteredAtRef.current = Date.now();
    setQIndex(newIndex);
  };

  useEffect(() => { answersRef.current = answers; }, [answers]);

  useEffect(() => {
    if (!contestId) { setBlocked("No contest specified."); setLoading(false); return; }
    if (!user) { setLoading(false); return; }

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
      questionEnteredAtRef.current = Date.now();
      setLoading(false);
    })();
  }, [user, contestId]);

  const handleSubmit = async () => {
    if (submittedRef.current || !user) return;
    submittedRef.current = true;
    setSubmitting(true);
    try {
      recordElapsed();
      const timeTakenSeconds = Math.round((Date.now() - startedAtRef.current) / 1000);
      const maxScore = questions.reduce((sum, q) => sum + (q.marks || 1), 0);
      await submitContestAnswers(contestId, user.uid, answersRef.current, timeTakenSeconds, maxScore, timingsRef.current);
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

  useEffect(() => {
    if (secondsLeft === null || submitted) return;
    if (secondsLeft <= 0) { handleSubmit(); return; }
    const t = setTimeout(() => setSecondsLeft(s => s - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, submitted]);

  if (!user) return <SignInPrompt message="You'll need a DeVert account to take this contest." />;

  if (loading) {
    return (
      <div className="max-w-2xl">
        <CampusSkeleton variant="text" width={140} className="mb-5" />
        <CampusCard className="p-5 space-y-3">
          <CampusSkeleton variant="text" width="80%" />
          <CampusSkeleton variant="rect" height={44} />
          <CampusSkeleton variant="rect" height={44} />
        </CampusCard>
      </div>
    );
  }

  if (blocked) {
    return (
      <CampusCard className="p-7 text-center max-w-sm mx-auto">
        <p className="text-sm mb-4" style={{ color: CAMPUS.inkSoft }}>{blocked}</p>
        <CampusBackButton onClick={() => onBack(contestId)} className="justify-center" />
      </CampusCard>
    );
  }

  if (submitted) {
    return (
      <CampusCard className="p-7 text-center max-w-sm mx-auto">
        <CheckCircle2 size={32} className="mx-auto mb-4" style={{ color: CAMPUS.good }} />
        <h1 className="text-lg font-bold mb-2" style={{ color: CAMPUS.ink }}>Submission Recorded</h1>
        <p className="text-xs mb-5" style={{ color: CAMPUS.inkFaint }}>Results and the leaderboard unlock once the contest ends.</p>
        <button onClick={() => onViewResults(contestId)} className="text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
          style={{ color: CAMPUS.teal, border: `1px solid ${CAMPUS.teal}50` }}>
          go to results page
        </button>
      </CampusCard>
    );
  }

  const q = questions[qIndex];
  const h = Math.floor(secondsLeft / 3600), m = Math.floor((secondsLeft % 3600) / 60), s = secondsLeft % 60;
  const timerColor = secondsLeft > 300 ? CAMPUS.good : secondsLeft > 60 ? CAMPUS.warn : CAMPUS.bad;

  const setAnswer = (value) => setAnswers(p => ({ ...p, [q.id]: value }));

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-5">
        <p className="text-xs" style={{ color: CAMPUS.inkFaint }}>{contest.title}</p>
        <p className="text-lg font-bold font-mono" style={{ color: timerColor }}>{h > 0 ? `${pad(h)}:` : ""}{pad(m)}:{pad(s)}</p>
      </div>

      <div className="flex gap-1.5 flex-wrap mb-5">
        {questions.map((qq, i) => (
          <button key={qq.id} onClick={() => goToQuestion(i)}
            className="w-7 h-7 rounded-lg text-[11px] font-semibold flex items-center justify-center transition-colors"
            style={{
              color: i === qIndex ? "#fff" : !isBlank(answers[qq.id]) ? CAMPUS.good : CAMPUS.inkFaint,
              background: i === qIndex ? CAMPUS.teal : !isBlank(answers[qq.id]) ? CAMPUS.goodTint : CAMPUS.paper,
              border: `1px solid ${i === qIndex ? CAMPUS.teal : CAMPUS.line}`,
            }}>
            {i + 1}
          </button>
        ))}
      </div>

      <CampusCard className="p-5">
        <p className="text-[13px] leading-relaxed mb-5 whitespace-pre-wrap" style={{ color: CAMPUS.ink }}>{q.question}</p>

        {q.type === "fillblank" ? (
          <input value={answers[q.id] || ""} onChange={e => setAnswer(e.target.value)}
            placeholder="type your answer..."
            className="w-full text-sm px-4 py-3 rounded-lg outline-none"
            style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.ink }} />
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
                    background: isSelected ? CAMPUS.tealTint : CAMPUS.paper,
                    border: `1px solid ${isSelected ? CAMPUS.teal + "60" : CAMPUS.line}`,
                  }}>
                  <span className="w-4 h-4 flex-shrink-0"
                    style={{
                      borderRadius: isMulti ? 4 : 999,
                      border: `1.5px solid ${isSelected ? CAMPUS.teal : CAMPUS.inkFaint}`,
                      background: isSelected ? CAMPUS.teal : "transparent",
                    }} />
                  <span className="text-[13px]" style={{ color: CAMPUS.inkSoft }}>{opt.text}</span>
                </button>
              );
            })}
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <button onClick={() => goToQuestion(Math.max(0, qIndex - 1))} disabled={qIndex === 0}
            className="text-xs px-4 py-2.5 rounded-lg transition-colors disabled:opacity-30"
            style={{ color: CAMPUS.inkFaint, border: `1px solid ${CAMPUS.line}` }}>
            ← prev
          </button>
          {qIndex < questions.length - 1 ? (
            <button onClick={() => goToQuestion(Math.min(questions.length - 1, qIndex + 1))}
              className="flex-1 text-xs font-semibold py-2.5 rounded-lg transition-colors"
              style={{ color: CAMPUS.teal, border: `1px solid ${CAMPUS.teal}50`, background: CAMPUS.tealTint }}>
              next →
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={submitting}
              className="flex-1 text-xs font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50"
              style={{ color: CAMPUS.good, border: `1px solid ${CAMPUS.good}50`, background: CAMPUS.goodTint }}>
              {submitting ? "submitting..." : "submit contest"}
            </button>
          )}
        </div>
      </CampusCard>

      {submitError && <p className="text-[11px] mt-3 text-center" style={{ color: CAMPUS.bad }}>{submitError}</p>}

      <button onClick={() => { if (window.confirm("Submit your contest now? You can't change answers after this.")) handleSubmit(); }}
        disabled={submitting}
        className="w-full mt-4 text-[11px] transition-colors disabled:opacity-30"
        style={{ color: CAMPUS.inkFaint }}>
        submit early
      </button>
    </div>
  );
}

// ---------------- Results ----------------

function ResultStat({ label, value, color }) {
  return (
    <div className="text-center">
      <p className="text-lg font-bold font-mono" style={{ color: color || CAMPUS.teal }}>{value}</p>
      <p className="text-[9px] font-mono tracking-wider mt-0.5" style={{ color: CAMPUS.inkFaint }}>{label}</p>
    </div>
  );
}

function Bar({ pct, color }) {
  return (
    <div className="h-1.5 rounded-full overflow-hidden flex-1" style={{ background: CAMPUS.line }}>
      <div className="h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, pct))}%`, background: color }} />
    </div>
  );
}

// Question-wise breakdown used both to build the topic/difficulty aggregates
// and to render the per-question review list - a stable single source so the
// two never disagree on what counts as correct/skipped for a given question.
function buildQuestionReview(questions, answerKeys, submission) {
  return questions.map(q => {
    const given = submission.answers?.[q.id];
    const key = answerKeys[q.id];
    const skipped = isBlank(given);
    const correct = !skipped && key ? isAnswerCorrect(q, key, given) : false;
    const timeSpent = submission.answerTimings?.[q.id] || 0;
    return { question: q, given, key, skipped, correct, timeSpent };
  });
}

function StudentAnalysisDashboard({ contest, submission, questions, answerKeys, rank, settings, phase, manual }) {
  const review = buildQuestionReview(questions, answerKeys, submission);
  const correctCount = review.filter(r => r.correct).length;
  const wrongCount = review.filter(r => !r.skipped && !r.correct).length;
  const skippedCount = review.filter(r => r.skipped).length;
  const negativeLost = review.reduce((sum, r) => (!r.skipped && !r.correct ? sum + (r.question.negativeMarks || 0) : sum), 0);
  const totalTime = review.reduce((sum, r) => sum + r.timeSpent, 0);
  const avgTimePerQuestion = questions.length > 0 ? Math.round(totalTime / questions.length) : 0;
  const fastestCorrect = review.filter(r => r.correct && r.timeSpent > 0).sort((a, b) => a.timeSpent - b.timeSpent)[0];

  const byTopic = {};
  const byDifficulty = {};
  for (const r of review) {
    const topic = r.question.topic || "General";
    byTopic[topic] = byTopic[topic] || { correct: 0, total: 0 };
    byTopic[topic].total++;
    if (r.correct) byTopic[topic].correct++;

    const diff = r.question.difficulty || "medium";
    byDifficulty[diff] = byDifficulty[diff] || { correct: 0, total: 0 };
    byDifficulty[diff].total++;
    if (r.correct) byDifficulty[diff].correct++;
  }
  const topicRows = Object.entries(byTopic).map(([topic, v]) => ({ topic, pct: Math.round((v.correct / v.total) * 100), ...v }))
    .sort((a, b) => b.pct - a.pct);
  const strongTopics = topicRows.slice(0, 3);
  const weakTopics = [...topicRows].reverse().slice(0, 3);
  const difficultyRows = ["easy", "medium", "hard"].filter(d => byDifficulty[d]).map(d => ({
    difficulty: d, pct: Math.round((byDifficulty[d].correct / byDifficulty[d].total) * 100), ...byDifficulty[d],
  }));

  const answerKeyReleased = isSettingReleased(settings.answerKeyRelease, phase, manual.answerKey);
  const explanationsReleased = isSettingReleased(settings.explanationsRelease, phase, manual.explanations);
  const showCorrect = settings.showCorrectAnswers && answerKeyReleased;
  const highlightWrong = settings.highlightIncorrect;
  const canReview = settings.allowQuestionReview;

  return (
    <div className="space-y-5 mt-6">
      <div className="flex items-center gap-2">
        <BarChart3 size={16} style={{ color: CAMPUS.teal }} />
        <h2 className="text-sm font-bold" style={{ color: CAMPUS.ink }}>Your Performance Analysis</h2>
      </div>

      <CampusCard className="p-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <ResultStat label="CORRECT" value={correctCount} color={CAMPUS.good} />
          <ResultStat label="WRONG" value={wrongCount} color={CAMPUS.bad} />
          <ResultStat label="SKIPPED" value={skippedCount} color={CAMPUS.inkFaint} />
          <ResultStat label="NEGATIVE MARKS" value={negativeLost > 0 ? `-${negativeLost}` : "0"} color={negativeLost > 0 ? CAMPUS.bad : CAMPUS.inkFaint} />
          <ResultStat label="AVG TIME/Q" value={`${avgTimePerQuestion}s`} />
          <ResultStat label="FASTEST CORRECT" value={fastestCorrect ? `${fastestCorrect.timeSpent}s` : "-"} color={CAMPUS.good} />
          <ResultStat label="CAMPUS RANK" value={rank ? `#${rank}` : "-"} color={CAMPUS.gold} />
          <ResultStat label="TIME TAKEN" value={`${Math.round((submission.timeTakenSeconds || 0) / 60)}m`} />
        </div>
      </CampusCard>

      {topicRows.length > 0 && (
        <CampusCard className="p-5">
          <p className="text-[10px] font-mono tracking-widest mb-3" style={{ color: CAMPUS.inkFaint }}>ACCURACY BY TOPIC</p>
          <div className="space-y-2.5">
            {topicRows.map(t => (
              <div key={t.topic} className="flex items-center gap-3">
                <span className="text-xs w-28 truncate flex-shrink-0" style={{ color: CAMPUS.inkSoft }}>{t.topic}</span>
                <Bar pct={t.pct} color={t.pct >= 60 ? CAMPUS.good : t.pct >= 30 ? CAMPUS.warn : CAMPUS.bad} />
                <span className="text-[11px] font-mono w-9 text-right flex-shrink-0" style={{ color: CAMPUS.inkFaint }}>{t.pct}%</span>
              </div>
            ))}
          </div>
        </CampusCard>
      )}

      {difficultyRows.length > 0 && (
        <CampusCard className="p-5">
          <p className="text-[10px] font-mono tracking-widest mb-3" style={{ color: CAMPUS.inkFaint }}>DIFFICULTY-WISE PERFORMANCE</p>
          <div className="space-y-2.5">
            {difficultyRows.map(d => (
              <div key={d.difficulty} className="flex items-center gap-3">
                <span className="text-xs w-28 capitalize flex-shrink-0" style={{ color: DIFF_COLOR[d.difficulty[0].toUpperCase() + d.difficulty.slice(1)] || CAMPUS.inkSoft }}>{d.difficulty}</span>
                <Bar pct={d.pct} color={d.pct >= 60 ? CAMPUS.good : d.pct >= 30 ? CAMPUS.warn : CAMPUS.bad} />
                <span className="text-[11px] font-mono w-9 text-right flex-shrink-0" style={{ color: CAMPUS.inkFaint }}>{d.correct}/{d.total}</span>
              </div>
            ))}
          </div>
        </CampusCard>
      )}

      {(strongTopics.length > 0 || weakTopics.length > 0) && (
        <div className="grid sm:grid-cols-2 gap-4">
          <CampusCard className="p-4">
            <p className="text-[10px] font-mono tracking-widest mb-2 flex items-center gap-1.5" style={{ color: CAMPUS.good }}><TrendingUp size={12} /> STRONG TOPICS</p>
            {strongTopics.map(t => (
              <p key={t.topic} className="text-xs py-1" style={{ color: CAMPUS.inkSoft }}>{t.topic} <span style={{ color: CAMPUS.inkFaint }}>· {t.pct}%</span></p>
            ))}
          </CampusCard>
          <CampusCard className="p-4">
            <p className="text-[10px] font-mono tracking-widest mb-2 flex items-center gap-1.5" style={{ color: CAMPUS.bad }}><TrendingDown size={12} /> SUGGESTED REVISION</p>
            {weakTopics.map(t => (
              <p key={t.topic} className="text-xs py-1" style={{ color: CAMPUS.inkSoft }}>{t.topic} <span style={{ color: CAMPUS.inkFaint }}>· {t.pct}%</span></p>
            ))}
          </CampusCard>
        </div>
      )}

      {canReview && (
        <CampusCard className="p-5">
          <p className="text-[10px] font-mono tracking-widest mb-3" style={{ color: CAMPUS.inkFaint }}>QUESTION-WISE REVIEW</p>
          <div className="space-y-3">
            {review.map((r, i) => {
              const q = r.question;
              const rowColor = r.correct ? CAMPUS.good : r.skipped ? CAMPUS.inkFaint : (highlightWrong ? CAMPUS.bad : CAMPUS.inkSoft);
              const RowIcon = r.correct ? CheckCircle2 : r.skipped ? MinusCircle : XCircle;
              return (
                <div key={q.id} className="p-3 rounded-lg" style={{ border: `1px solid ${CAMPUS.line}`, background: r.correct ? CAMPUS.goodTint : (!r.skipped && highlightWrong) ? CAMPUS.badTint : "transparent" }}>
                  <div className="flex items-start gap-2 mb-1.5">
                    <RowIcon size={14} className="mt-0.5 flex-shrink-0" style={{ color: rowColor }} />
                    <p className="text-xs leading-relaxed flex-1" style={{ color: CAMPUS.ink }}>{i + 1}. {q.question}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap mb-1.5 pl-5">
                    {q.topic && <CampusChip color={CAMPUS.teal}>{q.topic}</CampusChip>}
                    {q.difficulty && <CampusChip color={DIFF_COLOR[q.difficulty[0].toUpperCase() + q.difficulty.slice(1)] || CAMPUS.inkFaint}>{q.difficulty}</CampusChip>}
                    <span className="text-[10px] font-mono flex items-center gap-1" style={{ color: CAMPUS.inkFaint }}><Clock size={10} /> {r.timeSpent}s</span>
                  </div>
                  <div className="pl-5 text-[11px] space-y-0.5" style={{ color: CAMPUS.inkSoft }}>
                    <p>Your answer: <span style={{ color: rowColor }}>{formatGivenAnswer(q, r.given)}</span></p>
                    {showCorrect && !r.correct && r.key && <p>Correct answer: <span style={{ color: CAMPUS.good }}>{formatKeyAnswer(q, r.key)}</span></p>}
                    {explanationsReleased && q.explanation && <p style={{ color: CAMPUS.inkFaint }}>Explanation: {q.explanation}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </CampusCard>
      )}
    </div>
  );
}

function formatGivenAnswer(q, given) {
  if (isBlank(given)) return "— not answered —";
  if (q.type === "multiselect") return (given || []).map(id => q.options?.find(o => o.id === id)?.text || id).join(", ");
  if (q.type === "fillblank") return String(given);
  return q.options?.find(o => o.id === given)?.text || given;
}
function formatKeyAnswer(q, key) {
  if (q.type === "multiselect") return (key.correctOptionIds || []).map(id => q.options?.find(o => o.id === id)?.text || id).join(", ");
  if (q.type === "fillblank") return (key.correctText || "").split("|")[0];
  return q.options?.find(o => o.id === (key.correctOptionIds || [])[0])?.text || "";
}

export function CampusContestResults({ contestId, onBack }) {
  const { user, refreshProfile } = useAuth();

  const [contest, setContest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mySubmission, setMySubmission] = useState(null);
  const [myRank, setMyRank] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [grading, setGrading] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [answerKeys, setAnswerKeys] = useState({});

  useEffect(() => {
    if (!contestId) { setLoading(false); return; }

    (async () => {
      const c = await fetchContest(contestId);
      setContest(c);
      if (!c || contestPhase(c) !== "past") { setLoading(false); return; }

      const lb = await fetchLeaderboard(contestId).catch(() => []);
      setLeaderboard(lb);

      if (user) {
        let sub = await fetchMySubmission(contestId, user.uid).catch(() => null);
        if (sub) {
          const [qs, keys] = await Promise.all([
            fetchContestQuestions(contestId), fetchContestAnswerKeys(contestId),
          ]);
          setQuestions(qs);
          setAnswerKeys(keys);
          if (!sub.graded) {
            setGrading(true);
            try {
              const result = gradeSubmission(qs, keys, sub.answers);
              const rewards = computeRewards(c, result.accuracyRatio);
              await persistGrading(contestId, user.uid, result, rewards);
              sub = { ...sub, graded: true, ...result, ...rewards };
              refreshProfile?.();
              setLeaderboard(await fetchLeaderboard(contestId).catch(() => []));
            } catch (e) { console.error(e); }
            finally { setGrading(false); }
          }
        }
        setMySubmission(sub);
        if (sub?.graded) setMyRank(await fetchMyRank(contestId, sub.score).catch(() => null));
      }
      setLoading(false);
    })();
  }, [contestId, user]);

  if (loading) {
    return (
      <div className="max-w-2xl space-y-4">
        <CampusSkeleton variant="text" width={140} />
        <CampusCard className="p-5 space-y-3">
          {[0, 1, 2].map(i => (
            <div key={i} className="flex items-center gap-3">
              <CampusSkeleton variant="circle" width={26} />
              <CampusSkeleton variant="text" width={`${55 - i * 8}%`} />
            </div>
          ))}
        </CampusCard>
      </div>
    );
  }
  if (!contest) return <CampusEmptyState icon={Trophy} title="Contest not found" description="This contest may have ended or been removed." />;

  const phase = contestPhase(contest);
  const settings = getContestSettings(contest);
  const manual = contest.manualReleases || {};
  const leaderboardVisible = settings.leaderboardEnabled && settings.rankingVisibility !== "hidden";
  const scoreReleased = isSettingReleased(settings.scoreRelease, phase, manual.score);
  const analysisReleased = settings.analysisRelease !== "disabled" && isSettingReleased(settings.analysisRelease, phase, manual.analysis);

  return (
    <div className="max-w-2xl">
      <CampusBackButton onClick={() => onBack(contestId)} />

      <p className="text-xs mb-1.5" style={{ color: CAMPUS.teal }}>{contest.title}</p>
      <h1 className="text-xl font-bold mb-6" style={{ color: CAMPUS.ink }}>Leaderboard &amp; Results</h1>

      {phase !== "past" ? (
        <CampusCard className="p-6 text-center">
          <p className="text-xs" style={{ color: CAMPUS.inkSoft }}>Results unlock once the contest ends — {formatDate(contest.contestEnd)}.</p>
        </CampusCard>
      ) : (
        <>
          {user && grading && <p className="text-xs mb-4 text-center" style={{ color: CAMPUS.inkFaint }}>grading your submission...</p>}
          {user && mySubmission?.graded && (
            scoreReleased ? (
              <CampusCard className="p-5 mb-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <ResultStat label="RANK" value={myRank ? `#${myRank}` : "-"} color={CAMPUS.gold} />
                  <ResultStat label="SCORE" value={`${mySubmission.score}/${mySubmission.maxScore}`} />
                  <ResultStat label="ACCURACY" value={`${mySubmission.accuracy}%`} color={CAMPUS.good} />
                  <ResultStat label="XP / COINS" value={`+${mySubmission.xpEarned} / +${mySubmission.coinsEarned}`} color={CAMPUS.gold} />
                </div>
              </CampusCard>
            ) : (
              <p className="text-xs text-center mb-6" style={{ color: CAMPUS.inkFaint }}>Your score hasn&apos;t been released yet — check back soon.</p>
            )
          )}
          {user && !mySubmission && !grading && (
            <p className="text-xs text-center mb-6" style={{ color: CAMPUS.inkFaint }}>You didn&apos;t submit an attempt for this contest.</p>
          )}
          {!user && (
            <SignInPrompt message="Sign in to see your personal result." />
          )}

          {leaderboardVisible ? (
            <CampusCard className="overflow-hidden">
              <CampusTable
                rows={leaderboard}
                rowKey="uid"
                rowStyle={row => ({ background: user && row.uid === user.uid ? CAMPUS.tealTint : "transparent" })}
                emptyState={<CampusEmptyState size="sm" icon={Medal} title="No graded submissions yet" />}
                columns={[
                  { key: "rank", label: "#", render: row => (
                    row.rank <= 3
                      ? <span className="flex items-center gap-1 font-bold" style={{ color: row.rank === 1 ? CAMPUS.gold : row.rank === 2 ? "#9CA3AF" : "#B87333" }}><Medal size={12} /> {row.rank}</span>
                      : <span style={{ color: CAMPUS.inkFaint }}>{row.rank}</span>
                  ) },
                  { key: "participant", label: "Participant", render: row => {
                    const isMe = user && row.uid === user.uid;
                    return (
                      <div style={{ color: isMe ? CAMPUS.good : CAMPUS.ink }}>
                        <span>
                          {row.campusFullName || (row.handle ? `@${row.handle}` : row.uid.slice(0, 10))}
                          {isMe && <span className="text-[9px] ml-1.5" style={{ color: CAMPUS.good }}>you</span>}
                        </span>
                        {row.rollNumber && <span className="block text-[9.5px] font-mono" style={{ color: CAMPUS.inkFaint }}>{row.rollNumber}</span>}
                      </div>
                    );
                  } },
                  { key: "score", label: "Score", sortable: true, render: row => <span style={{ color: CAMPUS.teal }}>{row.score}/{row.maxScore}</span> },
                  { key: "accuracy", label: "Accuracy", sortable: true, render: row => <span style={{ color: CAMPUS.inkSoft }}>{row.accuracy}%</span> },
                  { key: "timeTakenSeconds", label: "Time", sortable: true, render: row => <span style={{ color: CAMPUS.inkFaint }}>{row.timeTakenSeconds}s</span> },
                ]}
              />
            </CampusCard>
          ) : (
            <CampusEmptyState size="sm" icon={ListChecks} title="Leaderboard hidden" description="The contest admin has turned off the leaderboard for this contest." />
          )}

          {user && mySubmission?.graded && questions.length > 0 && (
            analysisReleased ? (
              <StudentAnalysisDashboard contest={contest} submission={mySubmission} questions={questions} answerKeys={answerKeys} rank={myRank} settings={settings} phase={phase} manual={manual} />
            ) : (
              <p className="text-xs text-center mt-6" style={{ color: CAMPUS.inkFaint }}>Your detailed performance analysis hasn&apos;t been released yet.</p>
            )
          )}
        </>
      )}
    </div>
  );
}

// ---------------- Orchestrator ----------------

// Owns the list/details/attempt/results screen transitions for a given set of
// contests - used both by the Directory (platform-wide contests, no
// institution context) and the Workspace Contests tab (institution-scoped).
// `screen`/`setScreen` can be lifted by the caller (Workspace does this, so
// Overview's "Upcoming Contests" widget can jump straight into a contest's
// details from a different tab) or left local (Directory's own useState).
export function CampusContestFlow({ contests, loading, screen, setScreen }) {
  if (screen.view === "details") {
    return <CampusContestDetails contestId={screen.contestId} onBack={() => setScreen({ view: "list" })}
      onEnterAttempt={(id) => setScreen({ view: "attempt", contestId: id })}
      onViewResults={(id) => setScreen({ view: "results", contestId: id })} />;
  }
  if (screen.view === "attempt") {
    return <CampusContestAttempt contestId={screen.contestId} onBack={(id) => setScreen({ view: "details", contestId: id })}
      onViewResults={(id) => setScreen({ view: "results", contestId: id })} />;
  }
  if (screen.view === "results") {
    return <CampusContestResults contestId={screen.contestId} onBack={(id) => setScreen({ view: "details", contestId: id })} />;
  }
  return <CampusContestList contests={contests} loading={loading} onSelect={(id) => setScreen({ view: "details", contestId: id })} />;
}
