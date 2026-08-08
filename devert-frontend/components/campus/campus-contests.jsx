"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { CheckCircle2, ListChecks, Medal, Trophy, Target, Clock, TrendingUp, TrendingDown, XCircle, MinusCircle, BarChart3, AlertTriangle, Pause, Play, Send, FlaskConical, Settings } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  fetchContest, fetchContestQuestions, fetchContestAnswerKeys, fetchMyRegistration,
  fetchMySubmission, registerForContest, submitContestAnswers, contestPhase,
  gradeSubmission, persistGrading, fetchLeaderboard, fetchMyRank,
  getContestSettings, isSettingReleased, isAnswerCorrect,
  fetchContestCodingResults, submitContestCodingAnswer,
  fetchContestQuestionSampleTests, submitContestDryRun, fetchMyContestReviewer,
  fetchContestRegistrations,
} from "@/lib/contests";
import { CODELAB_LANGUAGES, STARTER_CODE, runCode } from "@/lib/codelab";
import { resolveRollNumber } from "@/lib/proctoring";
import { useProctorSession } from "@/components/proctor/use-proctor-session";
import { ProctorGate } from "@/components/proctor/proctor-gate";
import { ProctorSelfView, ProctorWarning, ProctorObstruction } from "@/components/proctor/proctor-hud";

// "III Year / CSE(AI&ML) / C" from the fields fetchLeaderboard denormalizes off
// users/{uid}. A platform (non-Campus) submitter has none of them, and a Campus
// student whose roster row predates classrooms may have only some - both fall
// back to "Unassigned" rather than rendering "? / ? / ?".
function classLabel(row) {
  if (!row?.year && !row?.department && !row?.section) return "Unassigned";
  return `${row.year || "?"} / ${row.department || "?"} / ${row.section || "?"}`;
}

// Seconds as stored, rendered for humans: "3m 34s", "1h 02m", "-" when absent.
function formatAttemptTime(seconds) {
  if (typeof seconds !== "number" || !isFinite(seconds) || seconds < 0) return "-";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const two = (n) => String(n).padStart(2, "0");
  return h > 0 ? `${h}h ${two(m)}m` : `${m}m ${two(s)}s`;
}
import { ContestShareButton } from "@/components/campus/contest-share";
import { Inline } from "@/components/campus/lesson-blocks";
import { seededShuffle } from "@/lib/quizRandom";
import { CAMPUS } from "@/lib/campus-theme";
import { CampusCard, CampusChip, CampusGoogleButton, CampusBackButton, CampusBreadcrumb, CampusButton, CampusSkeleton, CampusEmptyState, CampusTable } from "@/components/campus/campus-ui";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

// Native, light-themed port of components/contests/{attempt,details,results}-view.jsx
// for DeVert Campus - reuses every read/write/grading/shuffle function from
// lib/contests.js + lib/quizRandom.js verbatim (all pure or Firestore-only,
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
      <CampusGoogleButton style={{ background: CAMPUS.chromeBg, color: CAMPUS.chromeFg }} />
    </CampusCard>
  );
}

// ---------------- List ----------------

export function CampusContestList({ contests, loading, error, onRetry, onSelect, institutionId, canManage }) {
  const router = useRouter();
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
  if (error) {
    return (
      <CampusEmptyState icon={AlertTriangle} color={CAMPUS.bad} title="Couldn't load contests"
        description="Check your connection and try again."
        action={<CampusButton variant="secondary" size="sm" onClick={onRetry}>Retry</CampusButton>} />
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
          // CampusCard (a div, not a button) carries the "open details" click -
          // the Manage button below is a real sibling <button>, not nested
          // inside another button, which onSelect wrapped in a <button> would
          // have forced and broken (nested buttons are invalid HTML and eat
          // the inner click).
          <CampusCard key={c.id} hover className="p-4 flex items-center gap-3" onClick={() => onSelect(c.id)}>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: CAMPUS.purpleTint, color: CAMPUS.purple }}>
              <Trophy size={15} />
            </div>
            <div className="flex-1 min-w-0">
              <b className="block text-[13.5px] truncate" style={{ color: CAMPUS.ink }}>{c.title}</b>
              <span className="text-[11px]" style={{ color: CAMPUS.inkFaint }}>{c.category}{c.difficulty ? ` · ${c.difficulty}` : ""}</span>
            </div>
            {/* Admin/staff-only shortcut straight into Contest Studio's Target
                Audience step - editing which departments/years/sections/
                classrooms a contest is scoped to, without leaving this list.
                Same route (manage/contests?view=studio) CampusManage's own
                contest list already opens on click; this just makes it
                reachable from here too, since staff browse this tab as often
                as Manage itself. */}
            {canManage && institutionId && (
              <button
                onClick={(e) => { e.stopPropagation(); router.push(`/campus/${institutionId}/manage/contests?view=studio&contestId=${c.id}`); }}
                title="Manage audience & settings" className="p-1.5 rounded-md flex-shrink-0 transition-colors hover:bg-black/5"
                style={{ color: CAMPUS.inkFaint }}>
                <Settings size={14} />
              </button>
            )}
            <CampusChip color={phase === "live" ? CAMPUS.good : phase === "upcoming" ? CAMPUS.warn : CAMPUS.inkFaint}>{phase.toUpperCase()}</CampusChip>
          </CampusCard>
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
  const [error, setError] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [registerError, setRegisterError] = useState("");
  const [now, setNow] = useState(new Date());
  const [reviewer, setReviewer] = useState(null);

  const load = () => {
    if (!contestId) { setLoading(false); return; }
    setLoading(true); setError(false);
    fetchContest(contestId).then(setContest).catch(() => setError(true)).finally(() => setLoading(false));
  };
  useEffect(load, [contestId]);

  useEffect(() => {
    if (!user || !contestId) { setRegistered(false); return; }
    fetchMyRegistration(contestId, user.uid).then(r => setRegistered(!!r)).catch(console.error);
  }, [user, contestId]);

  // A Mock Reviewer sees this regardless of whether the contest has ever been
  // published or is out of their own audience - see firestore.rules'
  // isContestReviewer(). fetchContest above already succeeds for them even on
  // a still-draft contest, so this is purely "should the Dry Run entry point
  // show", not a visibility gate of its own.
  useEffect(() => {
    if (!user || !contestId) { setReviewer(null); return; }
    fetchMyContestReviewer(contestId, user.uid).then(setReviewer).catch(() => setReviewer(null));
  }, [user, contestId]);

  useEffect(() => {
    const iv = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(iv);
  }, []);

  const handleRegister = async () => {
    if (!user) return;
    setRegistering(true);
    setRegisterError("");
    try {
      await registerForContest(contestId, user.uid);
      setRegistered(true);
    } catch (e) {
      console.error(e);
      setRegisterError(
        e.code === "permission-denied"
          ? "You're not eligible to register for this contest - contact your Training & Placement Cell if you think this is a mistake."
          : "Failed to register. Please try again."
      );
    }
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
  if (error) {
    return (
      <div className="max-w-2xl">
        <CampusBackButton onClick={onBack} label="Back to contests" />
        <CampusEmptyState icon={AlertTriangle} color={CAMPUS.bad} title="Couldn't load this contest"
          description="Check your connection and try again."
          action={<CampusButton variant="secondary" size="sm" onClick={load}>Retry</CampusButton>} />
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
      <CampusBreadcrumb items={[{ label: "Contests", onClick: onBack }, { label: contest.title }]} />

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
        {contest.description && <p className="text-xs leading-relaxed whitespace-pre-wrap" style={{ color: CAMPUS.inkSoft }}><Inline text={contest.description} /></p>}
        {contest.rules && (
          <div>
            <p className="text-[9px] font-mono tracking-widest mb-1" style={{ color: CAMPUS.inkFaint }}>RULES</p>
            <p className="text-xs leading-relaxed whitespace-pre-wrap" style={{ color: CAMPUS.inkSoft }}><Inline text={contest.rules} /></p>
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
        {contest.prizeText && (
          <div className="flex items-center gap-4 text-xs pt-3" style={{ borderTop: `1px solid ${CAMPUS.line}` }}>
            <span style={{ color: CAMPUS.inkFaint }}>{contest.prizeText}</span>
          </div>
        )}
      </CampusCard>

      {user && reviewer && (
        <CampusCard className="p-5 mb-5" style={{ borderColor: CAMPUS.purple }}>
          <div className="flex items-center gap-2 mb-1.5">
            <FlaskConical size={14} style={{ color: CAMPUS.purple }} />
            <b className="text-sm" style={{ color: CAMPUS.ink }}>You&apos;re a Mock Reviewer for this contest</b>
          </div>
          <p className="text-xs mb-3" style={{ color: CAMPUS.inkSoft }}>
            Sit the paper end to end, even before it opens. Your attempt is saved separately and never reaches the
            leaderboard, participant count, or any average - you can redo it as many times as you like.
          </p>
          <button onClick={() => onEnterAttempt(contestId, { dryRun: true })}
            className="w-full text-sm font-semibold py-3 rounded-xl transition-colors"
            style={{ color: CAMPUS.purple, border: `1px solid ${CAMPUS.purple}50`, background: `${CAMPUS.purple}14` }}>
            start dry run →
          </button>
        </CampusCard>
      )}

      {!user ? (
        <SignInPrompt message="You'll need a DeVert account to register for this contest." />
      ) : contest.status !== "published" ? (
        !reviewer && (
          <span className="flex-1 text-center text-sm py-3 rounded-xl block" style={{ color: CAMPUS.inkFaint, border: `1px solid ${CAMPUS.line}` }}>
            This contest hasn&apos;t been published yet.
          </span>
        )
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
            <div className="flex-1">
              <button onClick={handleRegister} disabled={registering} className="w-full text-sm font-semibold py-3 rounded-xl disabled:opacity-50 transition-colors"
                style={{ color: CAMPUS.good, border: `1px solid ${CAMPUS.good}50`, background: CAMPUS.goodTint }}>
                {registering ? "registering..." : "register for contest"}
              </button>
              {registerError && <p className="text-xs mt-2" style={{ color: CAMPUS.bad }}>{registerError}</p>}
            </div>
          )}
          {leaderboardVisible && (
            <button onClick={() => onViewResults(contestId)} className="text-sm px-5 py-3 rounded-xl flex items-center gap-2 transition-colors"
              style={{ color: CAMPUS.inkSoft, border: `1px solid ${CAMPUS.line}` }}>
              <ListChecks size={14} /> leaderboard
            </button>
          )}
          {/* Shown in every phase, including past - a finished contest's link
              is still worth passing around for its results and leaderboard. */}
          <ContestShareButton contestId={contestId} title={contest.title}
            startText={start ? start.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : ""} />
        </div>
      )}
    </div>
  );
}

// ---------------- Attempt: coding question panel ----------------

function ContestCodingPanel({ state, isPaused, onLanguageChange, onCodeChange, onRun, onSubmit }) {
  if (!state) return <CampusSkeleton variant="rect" height={300} />;
  const { language, code, sampleTests, sampleTestsLoaded, running, runResults, submitting, result, error } = state;

  return (
    <div className="space-y-3">
      <div className="flex gap-1.5 flex-wrap">
        {CODELAB_LANGUAGES.map(l => (
          <button key={l.id} disabled={isPaused} onClick={() => onLanguageChange(l.id)}
            className="text-[11px] font-mono px-2.5 py-1 rounded-lg disabled:opacity-40"
            style={{ color: language === l.id ? CAMPUS.teal : CAMPUS.inkSoft, background: language === l.id ? CAMPUS.tealTint : CAMPUS.surface, border: `1px solid ${language === l.id ? CAMPUS.teal : CAMPUS.line}` }}>
            {l.label}
          </button>
        ))}
      </div>

      <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${CAMPUS.line}`, height: 320 }}>
        <MonacoEditor height="100%" language={CODELAB_LANGUAGES.find(l => l.id === language)?.monacoId || "plaintext"}
          theme="light" value={code} onChange={v => onCodeChange(v || "")}
          options={{ fontSize: 13, minimap: { enabled: false }, automaticLayout: true, wordWrap: "on", readOnly: isPaused }} />
      </div>

      <div className="flex gap-2">
        <button onClick={onRun} disabled={running || isPaused || !sampleTestsLoaded || sampleTests.length === 0}
          className="flex-1 text-xs font-semibold py-2.5 rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
          style={{ color: CAMPUS.teal, border: `1px solid ${CAMPUS.teal}50`, background: CAMPUS.tealTint }}>
          <Play size={12} /> {running ? "running..." : "run sample tests"}
        </button>
        <button onClick={onSubmit} disabled={submitting || isPaused}
          className="flex-1 text-xs font-semibold py-2.5 rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
          style={{ color: CAMPUS.good, border: `1px solid ${CAMPUS.good}50`, background: CAMPUS.goodTint }}>
          <Send size={12} /> {submitting ? "submitting..." : "submit for grading"}
        </button>
      </div>

      {error && <p className="text-[11px]" style={{ color: CAMPUS.bad }}>{error}</p>}

      {runResults && (
        <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${CAMPUS.line}` }}>
          {runResults.map((r, i) => (
            <div key={i} className="px-3 py-2 text-[11.5px]" style={{ background: CAMPUS.surface, borderTop: i > 0 ? `1px solid ${CAMPUS.line}` : "none" }}>
              <span className="flex items-center gap-1.5" style={{ color: r.passed ? CAMPUS.good : CAMPUS.bad }}>
                {r.passed ? <CheckCircle2 size={12} /> : <XCircle size={12} />} {r.label}: {r.passed ? "Passed" : "Failed"}
              </span>
            </div>
          ))}
        </div>
      )}

      {result && (
        <div className="rounded-lg p-3" style={{ background: result.verdict === "Accepted" ? CAMPUS.goodTint : CAMPUS.warnTint }}>
          <p className="text-[12.5px] font-semibold" style={{ color: result.verdict === "Accepted" ? CAMPUS.good : CAMPUS.warn }}>
            {/* Marks deliberately not shown. A per-question score mid-contest
                tells a student exactly how much a question is worth and how far
                they are from full credit, which is scoreRelease's decision to
                make (settings.scoreRelease, default after_end) - not something a
                run-tests panel should leak. Test counts are feedback on their
                own code and stay. */}
            {result.verdict} - {result.testsPassed}/{result.testsTotal} tests passed
          </p>
          <p className="text-[10.5px] mt-1" style={{ color: CAMPUS.inkFaint }}>You can keep editing and resubmit - the latest submission is what counts.</p>
        </div>
      )}
    </div>
  );
}

// ---------------- Attempt ----------------

// `dryRun` is the admin's own sit-through of the paper, launched from the
// Manage dashboard (which is already institution-admin gated, so this component
// does not re-derive permission - firestore.rules refuses the dryRuns write to
// anyone else regardless).
//
// It differs from a real attempt in exactly three ways, all of them here:
//   - the phase gate is skipped, so a paper can be checked BEFORE it opens,
//     which is the whole point of a dry run;
//   - no registration is required, since an admin is deliberately outside the
//     contest's target audience and could never register;
//   - the result is written to contests/{id}/dryRuns, never to submissions, so
//     it cannot reach the leaderboard, participantCount, or any average.
// Everything else - shuffling, the timer, autosave, the question palette - is
// the identical code path a student runs, which is what makes it a real check.
export function CampusContestAttempt({ contestId, onBack, onViewResults, dryRun = false }) {
  const { user, userData } = useAuth();

  // Proctoring - applied to a dry run exactly as to a real attempt for a
  // proctored contest, on purpose: the whole point of a Mock Reviewer sit-
  // through is catching a broken camera prompt or a fullscreen quirk before
  // 500 students hit it live, not after. Session/photos still go through the
  // dryRun-flagged path in useProctorSession (dryRunProctorSessions /
  // proctor-dryrun), never the real proctorSessions collection, so this can
  // never block or blend into that same reviewer's own later genuine attempt.
  const [rollNumber, setRollNumber] = useState("");
  const [proctorReady, setProctorReady] = useState(false);

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
  // Admin Pause/Extend/Reduce Time (campus-contest-dashboard.jsx's Lifecycle
  // panel) write straight to the contest doc - this screen has to actually
  // notice, not just gate entry once at load(). isPaused freezes the tick
  // effect below (no countdown, no auto-submit); the poll effect refreshes
  // secondsLeft from the contest doc's current contestEnd so an Extend/
  // Reduce mid-attempt takes effect without the student reloading the page.
  const [isPaused, setIsPaused] = useState(false);
  // Coding questions live outside `answers` entirely - keyed by questionId:
  // { language, code, sampleTests, running, runResults, submitting, result, error }.
  // Submitted per-question (submitContestCodingAnswer), not part of the final
  // handleSubmit() below - a compile/run round-trip can't wait for one
  // end-of-contest submit the way MCQs do.
  const [codingByQuestion, setCodingByQuestion] = useState({});

  const answersRef = useRef({});
  const startedAtRef = useRef(null);
  const submittedRef = useRef(false);
  // True once the countdown has been positive at least once, i.e. the student
  // genuinely had time on this paper. Guards the auto-submit below so a
  // zero-time open can never write an empty submission and lock them out.
  const clockRanRef = useRef(false);
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

  // Lazy-init a coding question's editor state (+ fetch its client-visible
  // sample tests) the first time it's actually visited, not for every
  // question up front - most contests mix a handful of coding questions with
  // many MCQs.
  useEffect(() => {
    const q = questions[qIndex];
    if (!q || q.type !== "coding" || codingByQuestion[q.id]) return;
    setCodingByQuestion(p => ({ ...p, [q.id]: {
      language: "java", code: STARTER_CODE.java, sampleTests: [], sampleTestsLoaded: false,
      running: false, runResults: null, submitting: false, result: null, error: "",
    } }));
    fetchContestQuestionSampleTests(contestId, q.id).then(tests => {
      setCodingByQuestion(p => ({ ...p, [q.id]: { ...p[q.id], sampleTests: tests, sampleTestsLoaded: true } }));
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qIndex, questions]);

  const patchCoding = (questionId, patch) =>
    setCodingByQuestion(p => ({ ...p, [questionId]: { ...p[questionId], ...patch } }));

  const handleCodingRun = async (questionId) => {
    const c = codingByQuestion[questionId];
    if (!c) return;
    patchCoding(questionId, { running: true, error: "", runResults: null });
    try {
      const results = await Promise.all(c.sampleTests.map(async (t, i) => {
        const res = await runCode({ language: c.language, code: c.code, stdin: t.input });
        const pass = (res.stdout || "").trim() === (t.expectedOutput || "").trim();
        return { label: `Sample ${i + 1}`, passed: pass, expected: t.expectedOutput, actual: res.stdout, stderr: res.stderr };
      }));
      patchCoding(questionId, { runResults: results });
    } catch (e) {
      patchCoding(questionId, { error: e.message || "Run failed." });
    } finally {
      patchCoding(questionId, { running: false });
    }
  };

  const handleCodingSubmit = async (questionId) => {
    const c = codingByQuestion[questionId];
    if (!c) return;
    patchCoding(questionId, { submitting: true, error: "" });
    try {
      const result = await submitContestCodingAnswer(contestId, questionId, c.language, c.code);
      patchCoding(questionId, { result });
    } catch (e) {
      patchCoding(questionId, { error: e.message || "Submission failed." });
    } finally {
      patchCoding(questionId, { submitting: false });
    }
  };

  const [loadError, setLoadError] = useState(false);

  const load = () => {
    setLoading(true); setLoadError(false); setBlocked(null);
    (async () => {
      if (!contestId) { setBlocked("No contest specified."); setLoading(false); return; }
      if (!user) { setLoading(false); return; }

      const c = await fetchContest(contestId);
      if (!c) { setBlocked("Contest not found."); setLoading(false); return; }
      // A dry run deliberately ignores both gates - see the note on this
      // component. It is checking the paper, not participating in the contest.
      if (!dryRun) {
        const phase = contestPhase(c);
        if (phase !== "live") {
          setBlocked(phase === "past" ? "This contest has ended." : "This contest hasn't started yet.");
          setLoading(false); return;
        }
        const reg = await fetchMyRegistration(contestId, user.uid);
        if (!reg) { setBlocked("You're not registered for this contest."); setLoading(false); return; }
        const existingSub = await fetchMySubmission(contestId, user.uid);
        if (existingSub) { setBlocked("You've already submitted your attempt for this contest."); setLoading(false); return; }
      }

      const qs = await fetchContestQuestions(contestId);
      const shuffled = seededShuffle(qs, `${user.uid}:${contestId}:q`).map(q => ({
        ...q,
        options: q.options?.length ? seededShuffle(q.options, `${user.uid}:${contestId}:${q.id}`) : q.options,
      }));

      const proctorOn = getContestSettings(c).proctoringEnabled;
      if (proctorOn) {
        // Resolved before the gate renders so the consent screen can name the
        // exact roll number the photos will be filed under.
        setRollNumber(await resolveRollNumber(user.uid, userData));
      }

      setContest(c);
      setQuestions(shuffled);
      setIsPaused(!!c.paused);

      // An unproctored attempt starts its clock here, exactly as before. A
      // proctored one defers to the effect below, so the seconds spent granting
      // camera permission are not billed to the student.
      if (!proctorOn) {
        const end = toDate(c.contestEnd).getTime();
        startedAtRef.current = Date.now();
        const capEnd = startedAtRef.current + (c.durationMinutes || 60) * 60 * 1000;
        const effectiveEnd = (dryRun ? capEnd : Math.min(end, capEnd));
        setSecondsLeft(Math.max(0, Math.floor((effectiveEnd - Date.now()) / 1000)));
        questionEnteredAtRef.current = Date.now();
      }
      setLoading(false);
    })().catch((e) => {
      console.error(e);
      setLoadError(true);
      setLoading(false);
    });
  };
  useEffect(load, [user, contestId]);

  const settings = getContestSettings(contest);
  const proctored = !!contest && settings.proctoringEnabled;

  // Starts the clock for a proctored attempt, once camera + fullscreen are up.
  useEffect(() => {
    if (!proctored || !proctorReady || startedAtRef.current !== null) return;
    startedAtRef.current = Date.now();
    const end = toDate(contest.contestEnd).getTime();
    const capEnd = startedAtRef.current + (contest.durationMinutes || 60) * 60 * 1000;
    // Same dry-run exception as the unproctored clock-start path above: a dry
    // run checks the paper independent of the real schedule, often before
    // contestStart and sometimes after contestEnd has already passed - it
    // must never inherit "0 seconds left" from a schedule it isn't bound by.
    const effectiveEnd = dryRun ? capEnd : Math.min(end, capEnd);
    setSecondsLeft(Math.max(0, Math.floor((effectiveEnd - Date.now()) / 1000)));
    questionEnteredAtRef.current = Date.now();
  }, [proctored, proctorReady, contest, dryRun]);

  const handleSubmit = async () => {
    if (submittedRef.current || !user) return;
    submittedRef.current = true;
    setSubmitting(true);
    try {
      recordElapsed();
      const timeTakenSeconds = Math.round((Date.now() - (startedAtRef.current ?? Date.now())) / 1000);
      const maxScore = questions.reduce((sum, q) => sum + (q.marks || 1), 0);
      if (dryRun) {
        // Scored here and now rather than left for a results view to grade:
        // an admin can already read the answer keys, and the whole point is to
        // see the score immediately. Coding questions have no client-gradable
        // key (hidden tests are server-only), so gradeSubmission scores them 0
        // and the MCQ total is what a dry run is actually telling you.
        const keys = await fetchContestAnswerKeys(contestId).catch(() => ({}));
        const grading = gradeSubmission(questions, keys, answersRef.current, {});
        await submitContestDryRun(contestId, user.uid, {
          answers: answersRef.current, answerTimings: timingsRef.current,
          timeTakenSeconds, maxScore, graded: true,
          score: grading.score, accuracy: grading.accuracy, correctCount: grading.correctCount,
        });
      } else {
        await submitContestAnswers(contestId, user.uid, answersRef.current, timeTakenSeconds, maxScore, timingsRef.current);
      }
      // Releases the camera and leaves fullscreen, only after the answers are
      // safely written - never risk the submission to tidy up hardware.
      if (proctored) await proctor.finish().catch(() => {});
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

  // handleSubmit and the proctor session reference each other (the session can
  // force a submit at the violation limit; a submit tears the session down).
  // Both resolve through closures at call time, and the hook holds
  // onSubmitRequested in a ref so this does not re-register its listeners.
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
    dryRun,
  });

  useEffect(() => {
    if (secondsLeft === null || submitted) return;
    if (isPaused) return; // frozen - no countdown, no auto-submit while paused

    if (secondsLeft > 0) clockRanRef.current = true;

    if (secondsLeft <= 0) {
      // THE PHANTOM-SUBMISSION FIX. This used to call handleSubmit()
      // unconditionally, so a paper that opened with no time left - a student
      // arriving in the final second, a clock skewed against contestEnd, a poll
      // that refreshed against an end time already past - wrote an EMPTY
      // submission before the student had read a single question.
      //
      // fetchMySubmission() then refuses re-entry for any existing submission
      // doc, so that empty write locked them out of a contest they never sat,
      // permanently, with no self-service recovery. See
      // scripts/clear-empty-contest-submissions.mjs, which exists only to undo
      // the damage this line did.
      //
      // An auto-submit is only legitimate for an attempt that actually ran.
      if (clockRanRef.current) handleSubmit();
      else setBlocked("This contest has already ended - there was no time left when the paper opened. Nothing has been submitted for you.");
      return;
    }

    const t = setTimeout(() => setSecondsLeft(s => s - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, submitted, isPaused]);

  // Re-checks the contest doc periodically (not a live listener - a 10s poll
  // is plenty fresh for a pause/extend/reduce admin action, and far cheaper
  // than an onSnapshot per concurrent test-taker on contest day) so Pause/
  // Resume/Extend/Reduce Time actually reach a student already mid-attempt,
  // not just one who hasn't loaded the page yet.
  useEffect(() => {
    if (loading || blocked || submitted || !contest) return;
    const poll = setInterval(async () => {
      try {
        const c = await fetchContest(contestId);
        if (!c) return;
        setIsPaused(!!c.paused);

        // THE CLOCK HAS NOT STARTED YET - RECOMPUTE NOTHING.
        //
        // This guard is the whole fix for a live incident that submitted ~69
        // students' papers the instant they pressed Start, before they had seen
        // a single question.
        //
        // A proctored attempt leaves startedAtRef null until the student
        // consents and the camera is up. This poll runs regardless - it has to,
        // so Pause/Extend reach someone still on the consent gate - and it used
        // to compute `startedAtRef.current + duration`. With null on the left,
        // JS coerces to 0, so capEnd became 1 Jan 1970 + 60 minutes; every
        // student on the gate had secondsLeft clamped to 0 within ten seconds of
        // loading the page, and the countdown effect then read that as "time is
        // up" and auto-submitted an empty paper the moment the attempt opened.
        //
        // Only the two clock-start effects may set the initial secondsLeft. Once
        // startedAtRef is a real timestamp this poll resumes its actual job of
        // applying an admin's Extend/Reduce mid-attempt.
        if (startedAtRef.current === null) return;

        const end = toDate(c.contestEnd).getTime();
        const capEnd = startedAtRef.current + (c.durationMinutes || 60) * 60 * 1000;
        const effectiveEnd = (dryRun ? capEnd : Math.min(end, capEnd));
        setSecondsLeft(Math.max(0, Math.floor((effectiveEnd - Date.now()) / 1000)));
      } catch {
        // transient - next poll retries, no need to surface a blip to the student
      }
    }, 10000);
    return () => clearInterval(poll);
  }, [loading, blocked, submitted, contest, contestId]);

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

  if (loadError) {
    return (
      <CampusCard className="p-7 text-center max-w-sm mx-auto">
        <p className="text-sm mb-4" style={{ color: CAMPUS.bad }}>Couldn&apos;t load this contest. Check your connection and try again.</p>
        <div className="flex items-center justify-center gap-3">
          <CampusButton variant="secondary" size="sm" onClick={load}>Retry</CampusButton>
          <CampusBackButton onClick={() => onBack(contestId)} label="Back to contest details" className="justify-center" />
        </div>
      </CampusCard>
    );
  }

  if (blocked) {
    return (
      <CampusCard className="p-7 text-center max-w-sm mx-auto">
        <p className="text-sm mb-4" style={{ color: CAMPUS.inkSoft }}>{blocked}</p>
        <CampusBackButton onClick={() => onBack(contestId)} label="Back to contest details" className="justify-center" />
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

  // Consent + device check + the fullscreen gesture, before the paper exists and
  // before the clock starts. Shares proctor.videoRef with the HUD below, so the
  // stream started here carries into the attempt with no second prompt.
  if (proctored && !proctorReady) {
    return (
      <ProctorGate
        contestTitle={dryRun ? `${contest.title} (Dry Run)` : contest.title}
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
    );
  }

  const q = questions[qIndex];
  const h = Math.floor(secondsLeft / 3600), m = Math.floor((secondsLeft % 3600) / 60), s = secondsLeft % 60;
  const timerColor = secondsLeft > 300 ? CAMPUS.good : secondsLeft > 60 ? CAMPUS.warn : CAMPUS.bad;

  const setAnswer = (value) => setAnswers(p => ({ ...p, [q.id]: value }));

  return (
    <>
      {/* HUD layers sit outside the scroll container - each is position:fixed
          in its own right and must not scroll away with the paper. */}
      {proctored && (
        <>
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

      {/* A proctored attempt takes over the entire viewport.
          Rendering inside the campus shell left the sidebar and top nav live
          during the exam, so a student could open Daily Learning or another
          contest in the same tab - and because that is a client-side route
          change within one document, it fires NO visibilitychange and NO blur,
          so it was not even recorded as a violation. Covering the chrome is
          what makes "only the test is on screen" actually true, rather than
          merely discouraged.

          z-150 sits below the HUD layers (self-view 300, warning 310,
          obstruction 320) so those stay on top of the paper. */}
      <div
        className={proctored ? "fixed inset-0 z-[150] overflow-y-auto" : ""}
        style={proctored ? { background: CAMPUS.paper } : undefined}
      >
        <div className={proctored ? "max-w-2xl mx-auto px-4 py-6" : "max-w-2xl"}>
      <div className="flex items-center justify-between mb-5">
        <p className="text-xs" style={{ color: CAMPUS.inkFaint }}>{contest.title}</p>
        <p className="text-lg font-bold font-mono" style={{ color: timerColor }}>{h > 0 ? `${pad(h)}:` : ""}{pad(m)}:{pad(s)}</p>
      </div>

      {isPaused && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg mb-5" style={{ background: CAMPUS.warnTint, color: CAMPUS.warn }}>
          <Pause size={14} className="flex-shrink-0" />
          <p className="text-[12.5px] font-semibold">Paused by your institution admin - the timer is frozen, hang tight.</p>
        </div>
      )}

      <div className="flex gap-1.5 flex-wrap mb-5">
        {questions.map((qq, i) => {
          const answered = qq.type === "coding" ? !!codingByQuestion[qq.id]?.result : !isBlank(answers[qq.id]);
          return (
            <button key={qq.id} disabled={isPaused} onClick={() => goToQuestion(i)}
              className="w-7 h-7 rounded-lg text-[11px] font-semibold flex items-center justify-center transition-colors disabled:opacity-40"
              style={{
                color: i === qIndex ? "#fff" : answered ? CAMPUS.good : CAMPUS.inkFaint,
                background: i === qIndex ? CAMPUS.teal : answered ? CAMPUS.goodTint : CAMPUS.paper,
                border: `1px solid ${i === qIndex ? CAMPUS.teal : CAMPUS.line}`,
              }}>
              {i + 1}
            </button>
          );
        })}
      </div>

      <CampusCard className="p-5">
        {/* Question bodies are authored in the same light markdown the rest of
            Campus uses (**bold**, `code`), so they render through the shared
            Inline tokenizer rather than as raw text - otherwise a problem
            statement shows literal asterisks to every student sitting it.
            whitespace-pre-wrap still carries the line breaks; Inline never
            emits HTML, so this opens no injection path. */}
        <p className="text-[13px] leading-relaxed mb-5 whitespace-pre-wrap" style={{ color: CAMPUS.ink }}>
          <Inline text={q.question} />
        </p>

        {q.type === "coding" ? (
          <ContestCodingPanel state={codingByQuestion[q.id]} isPaused={isPaused}
            onLanguageChange={lang => patchCoding(q.id, { language: lang, code: STARTER_CODE[lang] || "" })}
            onCodeChange={code => patchCoding(q.id, { code })}
            onRun={() => handleCodingRun(q.id)} onSubmit={() => handleCodingSubmit(q.id)} />
        ) : q.type === "fillblank" ? (
          <input value={answers[q.id] || ""} onChange={e => setAnswer(e.target.value)} disabled={isPaused}
            placeholder="type your answer..."
            className="w-full text-sm px-4 py-3 rounded-lg outline-none disabled:opacity-50"
            style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.ink }} />
        ) : (
          <div className="space-y-2">
            {q.options.map(opt => {
              const isMulti = q.type === "multiselect";
              const current = answers[q.id];
              const isSelected = isMulti ? (current || []).includes(opt.id) : current === opt.id;
              return (
                <button key={opt.id} disabled={isPaused} onClick={() => {
                  if (isMulti) {
                    const arr = answers[q.id] || [];
                    setAnswer(arr.includes(opt.id) ? arr.filter(i => i !== opt.id) : [...arr, opt.id]);
                  } else {
                    setAnswer(opt.id);
                  }
                }}
                  className="w-full flex items-center gap-2.5 px-4 py-3 rounded-lg text-left transition-colors disabled:opacity-50"
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
          <button onClick={() => goToQuestion(Math.max(0, qIndex - 1))} disabled={qIndex === 0 || isPaused}
            className="text-xs px-4 py-2.5 rounded-lg transition-colors disabled:opacity-30"
            style={{ color: CAMPUS.inkFaint, border: `1px solid ${CAMPUS.line}` }}>
            ← prev
          </button>
          {qIndex < questions.length - 1 ? (
            <button onClick={() => goToQuestion(Math.min(questions.length - 1, qIndex + 1))} disabled={isPaused}
              className="flex-1 text-xs font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-30"
              style={{ color: CAMPUS.teal, border: `1px solid ${CAMPUS.teal}50`, background: CAMPUS.tealTint }}>
              next →
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={submitting || isPaused}
              className="flex-1 text-xs font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50"
              style={{ color: CAMPUS.good, border: `1px solid ${CAMPUS.good}50`, background: CAMPUS.goodTint }}>
              {submitting ? "submitting..." : "submit contest"}
            </button>
          )}
        </div>
      </CampusCard>

      {submitError && <p className="text-[11px] mt-3 text-center" style={{ color: CAMPUS.bad }}>{submitError}</p>}

      <button onClick={() => { if (window.confirm("Submit your contest now? You can't change answers after this.")) handleSubmit(); }}
        disabled={submitting || isPaused}
        className="w-full mt-4 text-[11px] transition-colors disabled:opacity-30"
        style={{ color: CAMPUS.inkFaint }}>
        submit early
      </button>
        </div>
      </div>
    </>
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

export function CampusContestResults({ contestId, onBack, onBackToList }) {
  const { user, refreshProfile } = useAuth();

  const [contest, setContest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [mySubmission, setMySubmission] = useState(null);
  const [myRank, setMyRank] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [classFilter, setClassFilter] = useState("all");
  const [showNonAttempters, setShowNonAttempters] = useState(false);
  const [grading, setGrading] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [answerKeys, setAnswerKeys] = useState({});

  const load = () => {
    if (!contestId) { setLoading(false); return; }
    setLoading(true); setLoadError(false);

    (async () => {
      const c = await fetchContest(contestId);
      setContest(c);
      if (!c || contestPhase(c) !== "past") { setLoading(false); return; }

      const lb = await fetchLeaderboard(contestId).catch(() => []);
      setLeaderboard(lb);

      // Rules-gated to owner/admin (firestore.rules registrations/{uid}), so
      // this resolves to [] for an ordinary student and to the full roster for
      // an admin viewing the same screen. That IS the permission check - no
      // client-side role test to keep in sync, and no way for it to over-share:
      // a student who never registered gets nothing, and one who did gets only
      // their own row, which the leaderboard already shows them.
      setRegistrations(await fetchContestRegistrations(contestId).catch(() => []));

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
              const codingResults = await fetchContestCodingResults(contestId, user.uid).catch(() => ({}));
              const result = gradeSubmission(qs, keys, sub.answers, codingResults);
              await persistGrading(contestId, user.uid, result);
              sub = { ...sub, graded: true, ...result };
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
    })().catch((e) => {
      console.error(e);
      setLoadError(true);
      setLoading(false);
    });
  };
  useEffect(load, [contestId, user]);

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
  if (loadError) {
    return (
      <div className="max-w-2xl">
        <CampusBackButton onClick={() => onBack(contestId)} label="Back to contest details" />
        <CampusEmptyState icon={AlertTriangle} color={CAMPUS.bad} title="Couldn't load results"
          description="Check your connection and try again."
          action={<CampusButton variant="secondary" size="sm" onClick={load}>Retry</CampusButton>} />
      </div>
    );
  }
  if (!contest) return <CampusEmptyState icon={Trophy} title="Contest not found" description="This contest may have ended or been removed." />;

  // Everyone who registered but has no graded submission. Empty for students,
  // since the registrations fetch above is rules-gated to admins.
  const rankedUids = new Set(leaderboard.map(r => r.uid));
  const nonAttempters = registrations
    .filter(r => !rankedUids.has(r.uid))
    .map(r => ({ ...r, didNotAttempt: true, rank: null, score: null, maxScore: null, accuracy: null, timeTakenSeconds: null }))
    .sort((a, b) => (a.campusFullName || "").localeCompare(b.campusFullName || ""));

  const boardRows = showNonAttempters ? [...leaderboard, ...nonAttempters] : leaderboard;
  const classOptions = [...new Set(boardRows.map(classLabel))].filter(c => c !== "Unassigned").sort();
  const visibleRows = classFilter === "all" ? boardRows : boardRows.filter(r => classLabel(r) === classFilter);

  const phase = contestPhase(contest);
  const settings = getContestSettings(contest);
  const manual = contest.manualReleases || {};
  const leaderboardVisible = settings.leaderboardEnabled && settings.rankingVisibility !== "hidden";
  const scoreReleased = isSettingReleased(settings.scoreRelease, phase, manual.score);
  const analysisReleased = settings.analysisRelease !== "disabled" && isSettingReleased(settings.analysisRelease, phase, manual.analysis);

  return (
    <div className="max-w-2xl">
      <CampusBreadcrumb items={[
        { label: "Contests", onClick: onBackToList },
        { label: contest.title, onClick: () => onBack(contestId) },
        { label: "Results" },
      ]} />

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
                <div className="grid grid-cols-3 gap-4">
                  <ResultStat label="RANK" value={myRank ? `#${myRank}` : "-"} color={CAMPUS.gold} />
                  <ResultStat label="SCORE" value={`${mySubmission.score}/${mySubmission.maxScore}`} />
                  <ResultStat label="ACCURACY" value={`${mySubmission.accuracy}%`} color={CAMPUS.good} />
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
              {(classOptions.length > 1 || nonAttempters.length > 0) && (
                <div className="flex items-center gap-2 flex-wrap p-3" style={{ borderBottom: `1px solid ${CAMPUS.line}` }}>
                  {classOptions.length > 1 && (
                    <select value={classFilter} onChange={e => setClassFilter(e.target.value)}
                      className="text-[11px] px-2 py-1.5 rounded-lg outline-none"
                      style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.ink }}>
                      <option value="all">All sections ({boardRows.length})</option>
                      {classOptions.map(cn => (
                        <option key={cn} value={cn}>{cn} ({boardRows.filter(r => classLabel(r) === cn).length})</option>
                      ))}
                    </select>
                  )}
                  {/* Only an admin ever has these rows - fetchContestRegistrations
                      is rules-gated to owner/admin, so a student's fetch returns
                      nothing and this control never appears for them. */}
                  {nonAttempters.length > 0 && (
                    <button onClick={() => setShowNonAttempters(v => !v)}
                      className="text-[11px] px-2.5 py-1.5 rounded-lg"
                      style={showNonAttempters
                        ? { background: `${CAMPUS.purple}1F`, color: CAMPUS.purple, border: `1px solid ${CAMPUS.purple}55` }
                        : { background: CAMPUS.paper, color: CAMPUS.inkFaint, border: `1px solid ${CAMPUS.line}` }}>
                      {showNonAttempters ? "hide" : "show"} no-attempt ({nonAttempters.length})
                    </button>
                  )}
                  <span className="text-[10.5px] ml-auto" style={{ color: CAMPUS.inkFaint }}>
                    {visibleRows.length} shown
                  </span>
                </div>
              )}
              <CampusTable
                rows={visibleRows}
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
                        {classLabel(row) !== "Unassigned" && <span className="block text-[9.5px]" style={{ color: CAMPUS.inkFaint }}>{classLabel(row)}</span>}
                      </div>
                    );
                  } },
                  { key: "score", label: "Score", sortable: true, render: row => (
                    row.didNotAttempt
                      ? <span className="italic text-[10.5px]" style={{ color: CAMPUS.inkFaint }}>no attempt</span>
                      : <span style={{ color: CAMPUS.teal }}>{row.score}/{row.maxScore}</span>
                  ) },
                  { key: "accuracy", label: "Accuracy", sortable: true, render: row => <span style={{ color: CAMPUS.inkSoft }}>{row.didNotAttempt ? "-" : `${row.accuracy}%`}</span> },
                  // Raw seconds ("214s") read badly past a minute or two - a
                  // 22-minute attempt showed as "1334s", which nobody parses at
                  // a glance on a results screen.
                  { key: "timeTakenSeconds", label: "Time", sortable: true, render: row => <span style={{ color: CAMPUS.inkFaint }}>{formatAttemptTime(row.timeTakenSeconds)}</span> },
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
export function CampusContestFlow({ contests, loading, error, onRetry, screen, setScreen, institutionId, canManage }) {
  if (screen.view === "details") {
    return <CampusContestDetails contestId={screen.contestId} onBack={() => setScreen({ view: "list" })}
      onEnterAttempt={(id, opts) => setScreen({ view: "attempt", contestId: id, dryRun: !!opts?.dryRun })}
      onViewResults={(id) => setScreen({ view: "results", contestId: id })} />;
  }
  if (screen.view === "attempt") {
    return <CampusContestAttempt contestId={screen.contestId} dryRun={!!screen.dryRun}
      onBack={(id) => setScreen({ view: "details", contestId: id })}
      onViewResults={(id) => setScreen({ view: "results", contestId: id })} />;
  }
  if (screen.view === "results") {
    return <CampusContestResults contestId={screen.contestId} onBack={(id) => setScreen({ view: "details", contestId: id })}
      onBackToList={() => setScreen({ view: "list" })} />;
  }
  return <CampusContestList contests={contests} loading={loading} error={error} onRetry={onRetry}
    onSelect={(id) => setScreen({ view: "details", contestId: id })}
    institutionId={institutionId} canManage={canManage} />;
}
