"use client";

import { useEffect, useMemo, useState } from "react";
import { Users, BarChart3, Trophy, Download, Pencil, Copy, Medal, Settings, ChevronDown, ChevronUp, Award, X, Printer, RotateCcw, AlertTriangle, Workflow, Play, Pause } from "lucide-react";
import { CAMPUS } from "@/lib/campus-theme";
import { CampusCard, CampusChip, CampusStat, CampusSkeleton, CampusEmptyState, CampusBackButton, CampusButton, ReportDownloadButton } from "@/components/campus/campus-ui";
import {
  fetchContest, contestPhase, fetchContestRegistrations, fetchContestSubmissions,
  fetchLeaderboard, duplicateContest, updateContest, fetchContestQuestions, fetchContestAnswerKeys,
  isAnswerCorrect, getContestSettings, updateContestSettings, setManualRelease, resetContestAttempt,
  gradeUngradedSubmissions,
  LIFECYCLE_LABELS, legalNextLifecycleStates, transitionContestLifecycle,
  pauseContest, resumeContest, extendContestTime, forceEndContest, restartContest,
} from "@/lib/contests";
import { fetchApprovedStudents, fetchInstitution } from "@/lib/institutions";
import { gatherContestResultsReport } from "@/lib/campusReports";
import { ContestPreviewButton } from "@/components/campus/contest-preview";
import { ContestInfoCard } from "@/components/campus/contest-info-editor";
import { CampusContestAttempt } from "@/components/campus/campus-contests";
import { useAuth } from "@/context/AuthContext";

function toDate(v) {
  if (!v) return null;
  return typeof v.toDate === "function" ? v.toDate() : new Date(v);
}
function pad(n) { return String(n).padStart(2, "0"); }
function formatCountdown(ms) {
  if (ms <= 0) return "00:00:00";
  const totalSec = Math.floor(ms / 1000);
  const days = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return days > 0 ? `${days}d ${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(h)}:${pad(m)}:${pad(s)}`;
}

function participantLabel(r) {
  return r.campusFullName || (r.handle ? `@${r.handle}` : (r.uid || "").slice(0, 10));
}

function exportRegistrationsCsv(registrations, title) {
  const header = "name,rollNumber,uid,registeredAt";
  const rows = registrations.map(r => {
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    return [r.campusFullName || "", r.rollNumber || "", r.uid, toDate(r.registeredAt)?.toISOString() || ""].map(esc).join(",");
  });
  const csv = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `${title.replace(/\s+/g, "-").toLowerCase()}-registrations.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// A tiny inline bar - no charting library anywhere in this codebase, and one
// row of stats doesn't warrant adding one.
function Bar({ pct, color }) {
  return (
    <div className="h-1.5 rounded-full overflow-hidden flex-1" style={{ background: CAMPUS.line }}>
      <div className="h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, pct))}%`, background: color }} />
    </div>
  );
}

// Student Management's "issue certificates" - reuses the same "styled HTML +
// browser print-to-PDF" approach as every other export in this codebase
// (no jsPDF/react-pdf dependency anywhere). The @media print block hides
// everything except .devert-certificate, so window.print() from here yields
// a clean, chrome-free single page a student can save as PDF.
function CampusCertificateModal({ contest, institution, row, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }}>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .devert-certificate, .devert-certificate * { visibility: visible; }
          .devert-certificate { position: fixed; inset: 0; margin: 0; box-shadow: none; }
          .no-print { display: none !important; }
        }
      `}</style>
      <div className="devert-certificate w-full max-w-2xl rounded-2xl p-10 text-center"
        style={{ background: "#fff", border: "10px double #C9A227" }}>
        <p className="text-[11px] tracking-[0.3em] mb-1" style={{ color: "#C9A227" }}>CERTIFICATE OF ACHIEVEMENT</p>
        <h1 className="text-2xl font-bold mb-6" style={{ color: "#111" }}>{institution?.name || "DeVert Campus"}</h1>
        <p className="text-xs mb-2" style={{ color: "#555" }}>This certifies that</p>
        <p className="text-3xl font-bold mb-1" style={{ color: "#111", fontFamily: "serif" }}>{row.campusFullName || row.handle || "Student"}</p>
        {row.rollNumber && <p className="text-xs font-mono mb-5" style={{ color: "#777" }}>{row.rollNumber}</p>}
        <p className="text-xs mb-6" style={{ color: "#555" }}>
          has successfully participated in <b>{contest.title}</b>
          {row.rank ? <> and secured <b>Rank #{row.rank}</b></> : null}
          {typeof row.score === "number" ? <> with a score of <b>{row.score}/{row.maxScore}</b></> : null}.
        </p>
        <p className="text-[11px]" style={{ color: "#999" }}>{new Date().toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}</p>
        <p className="text-[10px] mt-6" style={{ color: "#bbb" }}>Issued via DeVert Campus</p>
      </div>
      <div className="no-print fixed top-6 right-6 flex gap-2">
        <button onClick={() => window.print()} className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-lg" style={{ background: CAMPUS.good, color: "#fff" }}>
          <Printer size={13} /> Print / Save as PDF
        </button>
        <button onClick={onClose} className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-lg" style={{ background: CAMPUS.surface, color: CAMPUS.ink, border: `1px solid ${CAMPUS.line}` }}>
          <X size={13} /> Close
        </button>
      </div>
    </div>
  );
}

const RELEASE_LABELS = {
  immediate: "Immediately", after_submission: "After Submission", after_end: "After Contest Ends",
  manual: "Manual Release", never: "Never", disabled: "Disabled",
};

function SettingRow({ label, children }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 flex-wrap" style={{ borderTop: `1px solid ${CAMPUS.line}` }}>
      <span className="text-[12.5px]" style={{ color: CAMPUS.inkSoft }}>{label}</span>
      {children}
    </div>
  );
}

function SettingSelect({ value, options, onChange }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      className="text-[12px] px-2.5 py-1.5 rounded-lg outline-none"
      style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.ink }}>
      {options.map(o => <option key={o} value={o}>{RELEASE_LABELS[o] || o}</option>)}
    </select>
  );
}

function SettingToggle({ value, onChange }) {
  return (
    <button onClick={() => onChange(!value)}
      className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
      style={{ background: value ? CAMPUS.goodTint : CAMPUS.badTint, color: value ? CAMPUS.good : CAMPUS.bad }}>
      {value ? "ON" : "OFF"}
    </button>
  );
}

// Contest Administration Controls (spec section 6) - every toggle here
// defaults to today's hardcoded behavior (see CONTEST_SETTINGS_DEFAULTS in
// lib/contests.js), so this panel only ever loosens/tightens visibility from
// an already-correct baseline, never silently changes a live contest.
function CampusContestSettingsPanel({ contest, onSaved }) {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState(() => getContestSettings(contest));
  const [saving, setSaving] = useState(false);

  const patch = (key, value) => setSettings(p => ({ ...p, [key]: value }));

  const save = async () => {
    setSaving(true);
    try { await updateContestSettings(contest.id, settings); onSaved?.(); }
    finally { setSaving(false); }
  };

  return (
    <CampusCard className="p-4 mt-4">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between">
        <p className="text-[12.5px] font-semibold flex items-center gap-1.5" style={{ color: CAMPUS.ink }}>
          <Settings size={13} /> Contest Settings
        </p>
        {open ? <ChevronUp size={14} style={{ color: CAMPUS.inkFaint }} /> : <ChevronDown size={14} style={{ color: CAMPUS.inkFaint }} />}
      </button>
      {open && (
        <div className="mt-2">
          <SettingRow label="Leaderboard"><SettingToggle value={settings.leaderboardEnabled} onChange={v => patch("leaderboardEnabled", v)} /></SettingRow>
          <SettingRow label="Ranking visibility">
            <SettingSelect value={settings.rankingVisibility} options={["public", "campus_only", "hidden"]} onChange={v => patch("rankingVisibility", v)} />
          </SettingRow>
          <SettingRow label="Publish answer key">
            <SettingSelect value={settings.answerKeyRelease} options={["immediate", "after_submission", "after_end", "manual"]} onChange={v => patch("answerKeyRelease", v)} />
          </SettingRow>
          <SettingRow label="Show explanations">
            <SettingSelect value={settings.explanationsRelease} options={["immediate", "after_end", "never"]} onChange={v => patch("explanationsRelease", v)} />
          </SettingRow>
          <SettingRow label="Student performance analysis">
            <SettingSelect value={settings.analysisRelease} options={["immediate", "after_end", "manual", "disabled"]} onChange={v => patch("analysisRelease", v)} />
          </SettingRow>
          <SettingRow label="Show final score">
            <SettingSelect value={settings.scoreRelease} options={["immediate", "after_end", "manual"]} onChange={v => patch("scoreRelease", v)} />
          </SettingRow>
          <SettingRow label="Allow question review"><SettingToggle value={settings.allowQuestionReview} onChange={v => patch("allowQuestionReview", v)} /></SettingRow>
          <SettingRow label="Show correct answers"><SettingToggle value={settings.showCorrectAnswers} onChange={v => patch("showCorrectAnswers", v)} /></SettingRow>
          <SettingRow label="Highlight incorrect answers"><SettingToggle value={settings.highlightIncorrect} onChange={v => patch("highlightIncorrect", v)} /></SettingRow>

          {(settings.answerKeyRelease === "manual" || settings.analysisRelease === "manual" || settings.scoreRelease === "manual") && (
            <div className="mt-3 pt-3 space-y-2" style={{ borderTop: `1px solid ${CAMPUS.line}` }}>
              <p className="text-[11px] font-mono tracking-wide" style={{ color: CAMPUS.inkFaint }}>MANUAL RELEASE (flip on when ready)</p>
              {settings.answerKeyRelease === "manual" && (
                <SettingRow label="Release answer key now">
                  <SettingToggle value={!!contest.manualReleases?.answerKey} onChange={v => setManualRelease(contest.id, "answerKey", v).then(onSaved)} />
                </SettingRow>
              )}
              {settings.analysisRelease === "manual" && (
                <SettingRow label="Release analysis now">
                  <SettingToggle value={!!contest.manualReleases?.analysis} onChange={v => setManualRelease(contest.id, "analysis", v).then(onSaved)} />
                </SettingRow>
              )}
              {settings.scoreRelease === "manual" && (
                <SettingRow label="Release score now">
                  <SettingToggle value={!!contest.manualReleases?.score} onChange={v => setManualRelease(contest.id, "score", v).then(onSaved)} />
                </SettingRow>
              )}
            </div>
          )}

          <button onClick={save} disabled={saving}
            className="mt-3 text-[12px] font-semibold px-3.5 py-2 rounded-lg disabled:opacity-50"
            style={{ background: CAMPUS.chromeBg, color: CAMPUS.chromeFg }}>
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      )}
    </CampusCard>
  );
}

// The real admin-driven lifecycle state machine (lib/contests.js's
// LIFECYCLE_TRANSITIONS) replaces the old hardcoded Publish/Archive action
// pair - "Archive" now only ever appears here, as whichever legal
// next-state button it actually is from the current state (draft/hidden/
// resultsPublished), which keeps lifecycleState and the older `status`
// field from ever drifting apart the way a raw status toggle could.
// Un-archiving is intentionally not offered - archived is a terminal state
// (see LIFECYCLE_TRANSITIONS); "Duplicate" in the header above is the
// escape hatch for "run this again."
function CampusContestLifecyclePanel({ contest, uid, onChanged }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const current = contest.lifecycleState || "draft";
  const nextStates = legalNextLifecycleStates(current);
  const isLive = current === "live";
  const isPaused = !!contest.paused;

  const run = async (fn) => {
    setBusy(true); setError("");
    try { await fn(); await onChanged(); }
    catch (e) { setError(e.message || "That action failed."); }
    finally { setBusy(false); }
  };

  const handleExtend = (sign) => {
    const raw = window.prompt(`${sign > 0 ? "Extend" : "Reduce"} the contest end time by how many minutes?`, "5");
    const minutes = parseInt(raw);
    if (!minutes || minutes <= 0) return;
    run(() => extendContestTime(contest.id, sign * minutes, uid));
  };

  // Quick edits, alongside the full 7-step wizard's own Edit button (header
  // above) - renaming doesn't need to reopen every step just to reach the one
  // field that actually needs changing. Rescheduling the start (and every
  // other schedule field) has its own proper inline editor now - see
  // ContestInfoCard (contest-info-editor.jsx), rendered further down this
  // same dashboard - so it isn't duplicated here as a second, worse path.
  const handleRename = () => {
    const raw = window.prompt("New contest title:", contest.title);
    if (raw == null) return;
    const title = raw.trim();
    if (!title || title === contest.title) return;
    run(() => updateContest(contest.id, { title }));
  };

  const handleForceEnd = () => {
    if (!window.confirm("End submissions right now, ahead of the scheduled end time? Students will no longer be able to submit.")) return;
    run(() => forceEndContest(contest.id, uid));
  };

  const handleRestart = () => {
    if (!window.confirm("Restart this contest? This deletes EVERY existing submission so every registrant can attempt again from scratch. This cannot be undone.")) return;
    run(() => restartContest(contest.id, uid));
  };

  return (
    <CampusCard className="p-4 my-4">
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <p className="text-[12.5px] font-semibold flex items-center gap-1.5" style={{ color: CAMPUS.ink }}>
          <Workflow size={13} /> Lifecycle:
        </p>
        <CampusChip color={isLive ? CAMPUS.good : CAMPUS.teal}>{LIFECYCLE_LABELS[current] || current}</CampusChip>
        {isPaused && <CampusChip color={CAMPUS.warn}>PAUSED</CampusChip>}
      </div>

      {nextStates.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-1">
          {nextStates.map(s => (
            <button key={s} disabled={busy} onClick={() => run(() => transitionContestLifecycle(contest.id, s, uid))}
              className="text-[11.5px] font-semibold px-3 py-1.5 rounded-lg disabled:opacity-50"
              style={{ background: CAMPUS.surface, color: CAMPUS.teal, border: `1px solid ${CAMPUS.teal}` }}>
              → {LIFECYCLE_LABELS[s] || s}
            </button>
          ))}
        </div>
      )}

      {isLive && (
        <div className="mt-3 pt-3 space-y-2" style={{ borderTop: `1px solid ${CAMPUS.line}` }}>
          <p className="text-[11px] font-mono tracking-wide" style={{ color: CAMPUS.inkFaint }}>LIVE CONTROLS</p>
          <div className="flex flex-wrap gap-1.5">
            <button disabled={busy} onClick={() => run(() => (isPaused ? resumeContest : pauseContest)(contest.id, uid))}
              className="flex items-center gap-1.5 text-[11.5px] font-semibold px-3 py-1.5 rounded-lg disabled:opacity-50"
              style={{ background: isPaused ? CAMPUS.goodTint : CAMPUS.warnTint, color: isPaused ? CAMPUS.good : CAMPUS.warn }}>
              {isPaused ? <><Play size={12} /> Resume</> : <><Pause size={12} /> Pause</>}
            </button>
            <button disabled={busy} onClick={() => handleExtend(1)}
              className="text-[11.5px] font-semibold px-3 py-1.5 rounded-lg disabled:opacity-50" style={{ border: `1px solid ${CAMPUS.line}`, color: CAMPUS.inkSoft }}>
              + Extend Time
            </button>
            <button disabled={busy} onClick={() => handleExtend(-1)}
              className="text-[11.5px] font-semibold px-3 py-1.5 rounded-lg disabled:opacity-50" style={{ border: `1px solid ${CAMPUS.line}`, color: CAMPUS.inkSoft }}>
              − Reduce Time
            </button>
            <button disabled={busy} onClick={handleForceEnd}
              className="text-[11.5px] font-semibold px-3 py-1.5 rounded-lg disabled:opacity-50" style={{ background: CAMPUS.badTint, color: CAMPUS.bad }}>
              Force End
            </button>
            <button disabled={busy} onClick={handleRestart}
              className="text-[11.5px] font-semibold px-3 py-1.5 rounded-lg disabled:opacity-50" style={{ background: CAMPUS.badTint, color: CAMPUS.bad }}>
              Restart
            </button>
          </div>
        </div>
      )}

      <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${CAMPUS.line}` }}>
        <p className="text-[11px] font-mono tracking-wide mb-2" style={{ color: CAMPUS.inkFaint }}>QUICK EDITS</p>
        <div className="flex flex-wrap gap-1.5">
          <button disabled={busy} onClick={handleRename}
            className="text-[11.5px] font-semibold px-3 py-1.5 rounded-lg disabled:opacity-50" style={{ border: `1px solid ${CAMPUS.line}`, color: CAMPUS.inkSoft }}>
            Rename
          </button>
        </div>
      </div>

      {error && <p className="text-[12px] mt-2" style={{ color: CAMPUS.bad }}>{error}</p>}
    </CampusCard>
  );
}

// Post-publish landing page for a single contest - the thing that makes
// "no reason to ever open /admin" actually true: everything a Campus admin
// would need to check on a live/ended contest lives here.
export function CampusContestDashboard({ contestId, onBack, onEdit, onDuplicated }) {
  const { user } = useAuth();
  const [contest, setContest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [registrations, setRegistrations] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [answerKeys, setAnswerKeys] = useState({});
  const [roster, setRoster] = useState([]);
  const [institution, setInstitution] = useState(null);
  const [now, setNow] = useState(new Date());
  const [busy, setBusy] = useState(false);
  const [resettingUid, setResettingUid] = useState(null);
  const [sweeping, setSweeping] = useState(false);
  const [sweepResult, setSweepResult] = useState(null);
  const [dryRunOpen, setDryRunOpen] = useState(false);
  const [certRow, setCertRow] = useState(null);

  const load = async () => {
    setLoading(true); setLoadError(false);
    try {
      const c = await fetchContest(contestId);
      setContest(c);
      const [regs, subs, lb, qs, keys, students, inst] = await Promise.all([
        fetchContestRegistrations(contestId).catch(() => []),
        fetchContestSubmissions(contestId).catch(() => []),
        fetchLeaderboard(contestId).catch(() => []),
        fetchContestQuestions(contestId).catch(() => []),
        fetchContestAnswerKeys(contestId).catch(() => ({})),
        c?.institutionId ? fetchApprovedStudents(c.institutionId).catch(() => []) : Promise.resolve([]),
        c?.institutionId ? fetchInstitution(c.institutionId).catch(() => null) : Promise.resolve(null),
      ]);
      setRegistrations(regs); setSubmissions(subs); setLeaderboard(lb);
      setQuestions(qs); setAnswerKeys(keys); setRoster(students); setInstitution(inst);
    } catch (e) {
      console.error(e);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, [contestId]);

  // Submissions nobody has scored. Grading normally runs in the student's own
  // browser when they reopen their result, so anyone who submitted and left is
  // stuck at graded:false - invisible to the leaderboard and excluded from the
  // averages below, which quietly makes every score stat a measure of the
  // students who came back rather than the students who sat the contest.
  const ungraded = submissions.filter(s => !s.graded);

  const handleGradeSweep = async () => {
    setSweeping(true);
    setSweepResult(null);
    try {
      const r = await gradeUngradedSubmissions(contestId);
      setSweepResult(r);
      await load();
    } catch (e) {
      setSweepResult({ total: ungraded.length, graded: 0, failed: ungraded.length, errors: [{ uid: "-", message: e?.message || String(e) }] });
    } finally {
      setSweeping(false);
    }
  };

  const submittedUids = useMemo(() => new Set(submissions.map(s => s.uid)), [submissions]);

  const handleResetAttempt = async (uid) => {
    if (!window.confirm("Reset this student's attempt? Their existing submission will be deleted and they'll be able to attempt the contest again.")) return;
    setResettingUid(uid);
    try {
      await resetContestAttempt(contestId, uid);
      await load();
    } finally {
      setResettingUid(null);
    }
  };

  useEffect(() => {
    const iv = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(iv);
  }, []);

  const handleDuplicate = async () => {
    setBusy(true);
    try {
      const newId = await duplicateContest(contest, user?.uid);
      onDuplicated?.(newId);
    } finally {
      setBusy(false);
    }
  };

  // All admin-analytics aggregation is pure client-side computation over
  // data already fetched above - no new Firestore schema, same convention as
  // the rest of this dashboard.
  const analytics = useMemo(() => {
    const graded = submissions.filter(s => s.graded);
    const scores = graded.map(s => s.score || 0);
    const rosterByUid = new Map(roster.map(s => [s.uid, s]));

    const byKey = (getKey) => {
      const counts = {};
      for (const r of registrations) {
        const student = rosterByUid.get(r.uid);
        const key = student ? (getKey(student) || "Unassigned") : "Unassigned";
        counts[key] = (counts[key] || 0) + 1;
      }
      return Object.entries(counts).sort((a, b) => b[1] - a[1]);
    };

    const difficultyCounts = {};
    for (const q of questions) difficultyCounts[q.difficulty || "medium"] = (difficultyCounts[q.difficulty || "medium"] || 0) + 1;

    // Per-question accuracy across every graded submission - needs each
    // submission's own `answers` map compared against the shared answer key,
    // same correctness logic gradeSubmission uses (isAnswerCorrect, exported
    // from lib/contests.js specifically so this dashboard doesn't duplicate it).
    const perQuestion = questions.map(q => {
      const key = answerKeys[q.id];
      let correct = 0, incorrect = 0, skipped = 0;
      for (const s of graded) {
        const given = s.answers?.[q.id];
        const isBlank = given === undefined || given === null || given === "" || (Array.isArray(given) && given.length === 0);
        if (isBlank) { skipped++; continue; }
        if (key && isAnswerCorrect(q, key, given)) correct++; else incorrect++;
      }
      const attempted = correct + incorrect;
      return { id: q.id, question: q.question, difficulty: q.difficulty, topic: q.topic, correct, incorrect, skipped, accuracy: attempted > 0 ? Math.round((correct / attempted) * 100) : null };
    });

    return {
      registered: registrations.length,
      attempted: submissions.length,
      submitted: graded.length,
      avgScore: graded.length ? (scores.reduce((a, b) => a + b, 0) / graded.length).toFixed(1) : "-",
      highestScore: scores.length ? Math.max(...scores) : "-",
      lowestScore: scores.length ? Math.min(...scores) : "-",
      avgAccuracy: graded.length ? Math.round(graded.reduce((s, x) => s + (x.accuracy || 0), 0) / graded.length) : null,
      difficultyCounts,
      perQuestion,
      mostIncorrect: [...perQuestion].sort((a, b) => b.incorrect - a.incorrect).slice(0, 5),
      mostSkipped: [...perQuestion].sort((a, b) => b.skipped - a.skipped).slice(0, 5),
      byDepartment: byKey(s => s.department),
      byYear: byKey(s => s.year),
      bySection: byKey(s => s.section),
    };
  }, [registrations, submissions, questions, answerKeys, roster]);

  if (loading) {
    return (
      <div className="space-y-4">
        <CampusSkeleton variant="text" width={140} />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[0, 1, 2, 3].map(i => <CampusCard key={i} className="p-3.5"><CampusSkeleton variant="text" width="60%" className="mb-2" /><CampusSkeleton variant="text" width="40%" height={20} /></CampusCard>)}
        </div>
      </div>
    );
  }
  if (loadError) {
    return (
      <div>
        <CampusBackButton onClick={onBack} label="back to contests" />
        <CampusEmptyState icon={AlertTriangle} color={CAMPUS.bad} title="Couldn't load this dashboard"
          description="Check your connection and try again."
          action={<CampusButton variant="secondary" size="sm" onClick={load}>Retry</CampusButton>} />
      </div>
    );
  }
  if (!contest) return <CampusEmptyState icon={Trophy} title="Contest not found" description="This contest may have been deleted." />;

  // Takes over the whole dashboard while running, rather than opening in a
  // modal - a dry run is meant to reproduce the student's screen, and a paper
  // checked inside a cramped dialog is not the paper students will see.
  if (dryRunOpen) {
    return (
      <div>
        <div className="mb-3 px-3.5 py-2.5 rounded-lg flex items-center gap-2 flex-wrap"
          style={{ background: CAMPUS.warnTint, color: CAMPUS.warn, border: `1px solid ${CAMPUS.warn}40` }}>
          <AlertTriangle size={14} />
          <span className="text-[12.5px] flex-1">
            <b>Dry run</b> — this is the real paper on the real timer, but nothing you do here counts.
            It is saved outside the results and never appears in the leaderboard or averages.
          </span>
          <button onClick={() => { setDryRunOpen(false); load(); }}
            className="text-[11.5px] font-semibold px-3 py-1.5 rounded-lg"
            style={{ background: CAMPUS.surface, color: CAMPUS.inkSoft, border: `1px solid ${CAMPUS.line}` }}>
            Exit dry run
          </button>
        </div>
        <CampusContestAttempt contestId={contestId} dryRun
          onBack={() => { setDryRunOpen(false); load(); }}
          onViewResults={() => { setDryRunOpen(false); load(); }} />
      </div>
    );
  }

  const phase = contestPhase(contest, now);
  const start = toDate(contest.contestStart), end = toDate(contest.contestEnd);
  const countdownTarget = phase === "upcoming" || phase === "closed" ? start : phase === "live" ? end : null;
  const countdown = countdownTarget ? formatCountdown(countdownTarget.getTime() - now.getTime()) : null;
  const maxDeptCount = Math.max(1, ...analytics.byDepartment.map(([, c]) => c));

  return (
    <div>
      <CampusBackButton onClick={onBack} label="back to contests" />

      <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <CampusChip color={phase === "live" ? CAMPUS.good : phase === "upcoming" ? CAMPUS.warn : CAMPUS.inkFaint}>{phase.toUpperCase()}</CampusChip>
            <CampusChip color={contest.status === "archived" ? CAMPUS.bad : CAMPUS.teal}>{contest.status.toUpperCase()}</CampusChip>
          </div>
          <h1 className="text-xl font-bold" style={{ color: CAMPUS.ink }}>{contest.title}</h1>
        </div>
        <div className="flex gap-2 flex-wrap">
          <ReportDownloadButton label="Full Report" size="sm" getReport={() => gatherContestResultsReport(contestId, contest.title)} />
          <ContestPreviewButton contestId={contestId} questionCount={contest.questionCount} />
          {/* Sit the paper exactly as a student would, at any time - before the
              contest opens, which is the whole point. Writes to dryRuns, so it
              never reaches the leaderboard or any average. */}
          <button onClick={() => setDryRunOpen(true)}
            title="Take the contest yourself to check it - excluded from all results"
            className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-lg"
            style={{ border: `1px solid ${CAMPUS.line}`, color: CAMPUS.inkSoft }}>
            <Play size={12} /> Dry run
          </button>
          {/* Only offered when there is actually something unscored - a button
              that always reads "Grade 0 pending" trains you to ignore it. */}
          {ungraded.length > 0 && (
            <button onClick={handleGradeSweep} disabled={sweeping}
              title="Score submissions the student never reopened - they are missing from the leaderboard and averages"
              className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-lg disabled:opacity-50"
              style={{ border: `1px solid ${CAMPUS.warn}`, background: CAMPUS.warnTint, color: CAMPUS.warn }}>
              <BarChart3 size={12} /> {sweeping ? "Grading..." : `Grade ${ungraded.length} pending`}
            </button>
          )}
          <button onClick={() => onEdit?.(contestId)} title="Edit name, schedule, duration, audience and questions"
            className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-lg" style={{ border: `1px solid ${CAMPUS.line}`, color: CAMPUS.inkSoft }}>
            <Pencil size={12} /> Edit
          </button>
          <button onClick={handleDuplicate} disabled={busy} className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-lg disabled:opacity-50" style={{ border: `1px solid ${CAMPUS.line}`, color: CAMPUS.inkSoft }}>
            <Copy size={12} /> Duplicate
          </button>
        </div>
      </div>

      {sweepResult && (
        <div className="mb-3 px-3.5 py-2.5 rounded-lg text-[12.5px]"
          style={sweepResult.failed
            ? { background: CAMPUS.badTint, color: CAMPUS.bad, border: `1px solid ${CAMPUS.bad}40` }
            : { background: CAMPUS.goodTint, color: CAMPUS.good, border: `1px solid ${CAMPUS.good}40` }}>
          Graded {sweepResult.graded} of {sweepResult.total} pending submission{sweepResult.total === 1 ? "" : "s"}.
          {/* Naming the ones that failed, not just counting them - "3 failed"
              gives an admin nothing to act on. */}
          {sweepResult.failed > 0 && (
            <> {sweepResult.failed} could not be graded:{" "}
              <span className="font-mono text-[11.5px]">
                {sweepResult.errors.slice(0, 3).map(e => e.uid).join(", ")}
                {sweepResult.errors.length > 3 ? ` +${sweepResult.errors.length - 3} more` : ""}
              </span>. {sweepResult.errors[0]?.message}
            </>
          )}
        </div>
      )}

      <CampusContestLifecyclePanel contest={contest} uid={user?.uid} onChanged={load} />

      {countdown && (
        <CampusCard className="p-4 text-center my-4">
          <p className="text-[10px] font-mono tracking-wider mb-1.5" style={{ color: CAMPUS.inkFaint }}>{phase === "live" ? "TIME REMAINING" : "STARTS IN"}</p>
          <p className="text-2xl font-bold font-mono" style={{ color: phase === "live" ? CAMPUS.warn : CAMPUS.teal }}>{countdown}</p>
        </CampusCard>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
        <CampusStat label="Registrations" value={analytics.registered} color={CAMPUS.purple} />
        <CampusStat label="Submissions" value={analytics.submitted} color={CAMPUS.blue} />
        <CampusStat label="Avg Score" value={analytics.avgScore} color={CAMPUS.gold} />
        <CampusStat label="Avg Accuracy" value={analytics.avgAccuracy !== null ? `${analytics.avgAccuracy}%` : "-"} color={CAMPUS.good} />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <CampusStat label="Highest Score" value={analytics.highestScore} color={CAMPUS.good} />
        <CampusStat label="Lowest Score" value={analytics.lowestScore} color={CAMPUS.warn} />
        <CampusStat label="Easy / Med / Hard" value={`${analytics.difficultyCounts.easy || 0}/${analytics.difficultyCounts.medium || 0}/${analytics.difficultyCounts.hard || 0}`} color={CAMPUS.purple} />
        <CampusStat label="Registered but no attempt" value={Math.max(0, analytics.registered - submissions.length)} color={CAMPUS.bad} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <CampusCard className="p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[12.5px] font-semibold flex items-center gap-1.5" style={{ color: CAMPUS.ink }}><Users size={13} /> Registrations</p>
            <button onClick={() => exportRegistrationsCsv(registrations, contest.title)} disabled={registrations.length === 0}
              className="flex items-center gap-1 text-[11px] disabled:opacity-40" style={{ color: CAMPUS.teal }}>
              <Download size={11} /> export csv
            </button>
          </div>
          {registrations.length === 0 ? (
            <div className="py-6 text-center">
              <Users size={18} style={{ color: CAMPUS.inkFaint }} className="mx-auto mb-2" />
              <p className="text-[12px]" style={{ color: CAMPUS.inkFaint }}>No registrations yet.</p>
            </div>
          ) : (
            <div className="max-h-56 overflow-y-auto space-y-1">
              {registrations.slice(0, 100).map(r => (
                <div key={r.uid} className="flex items-center justify-between gap-2 text-[11.5px]">
                  <span className="truncate flex-1" style={{ color: CAMPUS.inkSoft }}>{participantLabel(r)}</span>
                  {r.rollNumber && <span className="font-mono flex-shrink-0" style={{ color: CAMPUS.inkFaint }}>{r.rollNumber}</span>}
                  {submittedUids.has(r.uid) && (
                    <button onClick={() => handleResetAttempt(r.uid)} disabled={resettingUid === r.uid} title="Reset attempt"
                      className="flex-shrink-0 disabled:opacity-40" style={{ color: CAMPUS.bad }}>
                      <RotateCcw size={12} />
                    </button>
                  )}
                </div>
              ))}
              {registrations.length > 100 && <p className="text-[10.5px]" style={{ color: CAMPUS.inkFaint }}>+{registrations.length - 100} more - export CSV for the full list.</p>}
            </div>
          )}
        </CampusCard>

        <CampusCard className="p-4 overflow-hidden">
          <p className="text-[12.5px] font-semibold mb-3 flex items-center gap-1.5" style={{ color: CAMPUS.ink }}><Trophy size={13} /> Leaderboard</p>
          {leaderboard.length === 0 ? (
            <div className="py-6 text-center">
              <Medal size={18} style={{ color: CAMPUS.inkFaint }} className="mx-auto mb-2" />
              <p className="text-[12px]" style={{ color: CAMPUS.inkFaint }}>No graded submissions yet.</p>
            </div>
          ) : (
            <div className="max-h-56 overflow-y-auto overflow-x-auto">
              <table className="w-full">
                <tbody>
                  {leaderboard.map(row => (
                    <tr key={row.uid} style={{ borderTop: `1px solid ${CAMPUS.line}` }}>
                      <td className="text-[11.5px] py-1.5 pr-2 w-8">
                        {row.rank <= 3
                          ? <span className="flex items-center gap-1 font-bold" style={{ color: row.rank === 1 ? CAMPUS.gold : row.rank === 2 ? "#9CA3AF" : "#B87333" }}><Medal size={11} /> {row.rank}</span>
                          : <span style={{ color: CAMPUS.inkFaint }}>{row.rank}</span>}
                      </td>
                      <td className="text-[11.5px] py-1.5 truncate" style={{ color: CAMPUS.ink }}>
                        {participantLabel(row)}
                        {row.rollNumber && <span className="block font-mono text-[9.5px]" style={{ color: CAMPUS.inkFaint }}>{row.rollNumber}</span>}
                      </td>
                      <td className="text-[11.5px] py-1.5 text-right" style={{ color: CAMPUS.teal }}>{row.score}/{row.maxScore}</td>
                      <td className="text-[11.5px] py-1.5 pl-2 text-right" style={{ color: CAMPUS.inkFaint }}>{row.accuracy}%</td>
                      <td className="py-1.5 pl-2 text-right">
                        <button onClick={() => setCertRow(row)} title="Issue certificate" style={{ color: CAMPUS.gold }}>
                          <Award size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CampusCard>
      </div>

      {analytics.perQuestion.length > 0 && (
        <div className="grid lg:grid-cols-2 gap-4 mt-4">
          <CampusCard className="p-4">
            <p className="text-[12.5px] font-semibold mb-3" style={{ color: CAMPUS.ink }}>Most Incorrect Questions</p>
            <div className="space-y-2.5">
              {analytics.mostIncorrect.map(q => (
                <div key={q.id}>
                  <p className="text-[11.5px] truncate mb-1" style={{ color: CAMPUS.inkSoft }}>{q.question}</p>
                  <div className="flex items-center gap-2"><Bar pct={q.accuracy ?? 0} color={CAMPUS.bad} /><span className="text-[10px] font-mono" style={{ color: CAMPUS.inkFaint }}>{q.incorrect} wrong</span></div>
                </div>
              ))}
            </div>
          </CampusCard>
          <CampusCard className="p-4">
            <p className="text-[12.5px] font-semibold mb-3" style={{ color: CAMPUS.ink }}>Most Skipped Questions</p>
            <div className="space-y-2.5">
              {analytics.mostSkipped.map(q => (
                <div key={q.id}>
                  <p className="text-[11.5px] truncate mb-1" style={{ color: CAMPUS.inkSoft }}>{q.question}</p>
                  <div className="flex items-center gap-2"><Bar pct={analytics.submitted ? (q.skipped / analytics.submitted) * 100 : 0} color={CAMPUS.warn} /><span className="text-[10px] font-mono" style={{ color: CAMPUS.inkFaint }}>{q.skipped} skipped</span></div>
                </div>
              ))}
            </div>
          </CampusCard>
        </div>
      )}

      {(analytics.byDepartment.length > 0 || analytics.byYear.length > 0) && (
        <div className="grid sm:grid-cols-3 gap-4 mt-4">
          {[["Department", analytics.byDepartment], ["Year", analytics.byYear], ["Section", analytics.bySection]].map(([label, data]) => (
            data.length > 0 && (
              <CampusCard key={label} className="p-4">
                <p className="text-[12.5px] font-semibold mb-3" style={{ color: CAMPUS.ink }}>Participation by {label}</p>
                <div className="space-y-2">
                  {data.map(([k, c]) => (
                    <div key={k} className="flex items-center gap-2">
                      <span className="text-[11px] w-16 truncate flex-shrink-0" style={{ color: CAMPUS.inkSoft }}>{k}</span>
                      <Bar pct={(c / maxDeptCount) * 100} color={CAMPUS.blue} />
                      <span className="text-[10.5px] font-mono flex-shrink-0" style={{ color: CAMPUS.inkFaint }}>{c}</span>
                    </div>
                  ))}
                </div>
              </CampusCard>
            )
          ))}
        </div>
      )}

      <CampusContestSettingsPanel contest={contest} onSaved={load} />

      <ContestInfoCard contest={contest} onSaved={load} />

      {certRow && <CampusCertificateModal contest={contest} institution={institution} row={certRow} onClose={() => setCertRow(null)} />}
    </div>
  );
}
