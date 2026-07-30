"use client";

import { useEffect, useMemo, useState } from "react";
import { Users, BarChart3, Trophy, Download, Pencil, Copy, Archive, Medal, Settings, ChevronDown, ChevronUp, Award, X, Printer, RotateCcw, AlertTriangle } from "lucide-react";
import { CAMPUS } from "@/lib/campus-theme";
import { CampusCard, CampusChip, CampusStat, CampusSkeleton, CampusEmptyState, CampusBackButton, CampusButton, ReportDownloadButton } from "@/components/campus/campus-ui";
import {
  fetchContest, contestPhase, fetchContestRegistrations, fetchContestSubmissions,
  fetchLeaderboard, duplicateContest, updateContest, fetchContestQuestions, fetchContestAnswerKeys,
  isAnswerCorrect, getContestSettings, updateContestSettings, setManualRelease, resetContestAttempt,
} from "@/lib/contests";
import { fetchApprovedStudents, fetchInstitution } from "@/lib/institutions";
import { gatherContestResultsReport } from "@/lib/campusReports";
import { useAuth } from "@/context/AuthContext";

function toDate(v) {
  if (!v) return null;
  return typeof v.toDate === "function" ? v.toDate() : new Date(v);
}
function pad(n) { return String(n).padStart(2, "0"); }
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

  const handleArchive = async () => {
    setBusy(true);
    try {
      await updateContest(contestId, { status: contest.status === "archived" ? "published" : "archived" });
      await load();
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
          <button onClick={() => onEdit?.(contestId)} className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-lg" style={{ border: `1px solid ${CAMPUS.line}`, color: CAMPUS.inkSoft }}>
            <Pencil size={12} /> Edit
          </button>
          <button onClick={handleDuplicate} disabled={busy} className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-lg disabled:opacity-50" style={{ border: `1px solid ${CAMPUS.line}`, color: CAMPUS.inkSoft }}>
            <Copy size={12} /> Duplicate
          </button>
          <button onClick={handleArchive} disabled={busy} className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-lg disabled:opacity-50" style={{ background: CAMPUS.badTint, color: CAMPUS.bad }}>
            <Archive size={12} /> {contest.status === "archived" ? "Unarchive" : "Archive"}
          </button>
        </div>
      </div>

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

      <CampusCard className="p-4 mt-4">
        <p className="text-[12.5px] font-semibold mb-2 flex items-center gap-1.5" style={{ color: CAMPUS.ink }}><BarChart3 size={13} /> Contest info</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11.5px]" style={{ color: CAMPUS.inkSoft }}>
          <span>Category: {contest.category}</span>
          <span>Difficulty: {contest.difficulty}</span>
          <span>Questions: {contest.questionCount || 0}</span>
          <span>Duration: {contest.durationMinutes} min</span>
          <span>Reg. ends: {formatDate(contest.registrationEnd)}</span>
          <span>Starts: {formatDate(contest.contestStart)}</span>
          <span>Ends: {formatDate(contest.contestEnd)}</span>
        </div>
      </CampusCard>

      {certRow && <CampusCertificateModal contest={contest} institution={institution} row={certRow} onClose={() => setCertRow(null)} />}
    </div>
  );
}
