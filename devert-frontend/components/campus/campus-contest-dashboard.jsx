"use client";

import { useEffect, useMemo, useState } from "react";
import { Users, BarChart3, Trophy, Download, Pencil, Copy, Medal, Settings, ChevronDown, ChevronUp, Award, X, Printer, RotateCcw, AlertTriangle, Workflow, Play, Pause, Search } from "lucide-react";
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
import { ContestReviewersPanel } from "@/components/campus/contest-reviewers";
import { ContestProctorConsole } from "@/components/campus/contest-proctor-console";
import { plainInline } from "@/lib/lessonBlocks";
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

// "8m 15s" / "1h 04m". Submissions written before timeTakenSeconds existed have
// no value at all, so this must render a dash rather than "0m 00s" - claiming
// someone finished instantly is worse than admitting it wasn't recorded.
function formatDuration(seconds) {
  if (typeof seconds !== "number" || !isFinite(seconds) || seconds < 0) return "-";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return h > 0 ? `${h}h ${pad(m)}m` : `${m}m ${pad(s)}s`;
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

// Exports exactly the rows currently on screen, filters and all - so "export
// III Year / CSE(AI&ML) / C, no-attempt only" is just filter-then-export rather
// than a separate feature. Non-attempters export with blank score columns and an
// explicit status, never as a zero, which would be indistinguishable from a
// student who sat the paper and scored nothing.
function exportParticipantsCsv(rows, title) {
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const header = "rank,name,rollNumber,class,status,score,maxScore,percent,correct,attempted,accuracy,timeTaken,timeTakenSeconds";
  const body = rows.map(r => [
    r.rank ?? "", r.name, r.rollNumber, r.className,
    r.attempted ? (r.graded ? "attempted" : "attempted (ungraded)") : "did not attempt",
    r.attempted ? r.score : "", r.attempted ? r.maxScore : "", r.attempted ? r.pct : "",
    r.attempted ? r.correct : "", r.attempted ? r.attemptedCount : "", r.attempted ? r.accuracy : "",
    r.attempted ? formatDuration(r.timeTakenSeconds) : "", r.attempted ? (r.timeTakenSeconds ?? "") : "",
  ].map(esc).join(","));
  const blob = new Blob([[header, ...body].join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `${title.replace(/\s+/g, "-").toLowerCase()}-full-leaderboard.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// The hand-rolled CSV-only exporter that used to live here is gone. The
// Classwise Results card now uses ReportDownloadButton, which offers CSV, Excel
// AND PDF from one getReport() via lib/campusReports.js - so this function was
// both redundant and the reason there was no PDF option.

// One ranked block - the printable classwise report's layout brought in-app:
// a heading carrying the class's own summary, then the full table (rank, name,
// roll number, score, %, correct, attempted, accuracy, time) with the top three
// tinted gold/silver/bronze.
//
// `limit` caps a section that is only ever a preview (the overall Top 25).
// A CLASS section is never silently truncated - a class teacher reading their
// own class's results must see every student in it - so a long class collapses
// behind an explicit "show all N", which states the count it is hiding rather
// than quietly cutting the list off.
function ClasswiseSection({ group, title, limit, open, onToggle }) {
  const collapsible = typeof onToggle === "function";
  const PREVIEW = 5;
  const rows = limit ? group.rows.slice(0, limit)
    : (collapsible && !open) ? group.rows.slice(0, PREVIEW)
    : group.rows;
  const hidden = group.rows.length - rows.length;
  const medalTint = (i) => i === 0 ? `${CAMPUS.gold}1F` : i === 1 ? "#9CA3AF1F" : i === 2 ? "#B873331F" : "transparent";
  const th = "text-[9.5px] uppercase tracking-wide font-semibold py-1 whitespace-nowrap";

  return (
    <div className="mt-4">
      <div className="flex items-baseline justify-between gap-2 flex-wrap pb-1.5 mb-1"
        style={{ borderBottom: `2px solid ${CAMPUS.purple}` }}>
        <p className="text-[11.5px] font-bold" style={{ color: CAMPUS.purple }}>{title || group.label}</p>
        <p className="text-[10px]" style={{ color: CAMPUS.inkFaint }}>
          {group.rows.length} students &middot; avg {group.avgPct}% &middot; avg time {formatDuration(group.avgTime)}
          {!title && <> &middot; top: <b style={{ color: CAMPUS.inkSoft }}>{group.rows[0].name}</b> ({group.rows[0].pct}%)</>}
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{ color: CAMPUS.inkFaint }}>
              <th className={`${th} text-left pr-2`}>#</th>
              <th className={`${th} text-left`}>Name</th>
              <th className={`${th} text-right pl-2`}>Score</th>
              <th className={`${th} text-right pl-2`}>%</th>
              <th className={`${th} text-right pl-2`}>Correct</th>
              <th className={`${th} text-right pl-2`}>Att.</th>
              <th className={`${th} text-right pl-2`}>Acc.</th>
              <th className={`${th} text-right pl-2`}>Time</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.uid} style={{ borderTop: `1px solid ${CAMPUS.line}`, background: medalTint(i) }}>
                <td className="text-[11px] py-1.5 pr-2 w-7">
                  {i < 3
                    ? <span className="flex items-center gap-0.5 font-bold" style={{ color: i === 0 ? CAMPUS.gold : i === 1 ? "#9CA3AF" : "#B87333" }}><Medal size={10} /> {i + 1}</span>
                    : <span style={{ color: CAMPUS.inkFaint }}>{i + 1}</span>}
                </td>
                <td className="text-[11px] py-1.5 min-w-0" style={{ color: CAMPUS.ink }}>
                  <span className="block truncate">{r.name}</span>
                  {r.rollNumber && <span className="block font-mono text-[9.5px]" style={{ color: CAMPUS.inkFaint }}>{r.rollNumber}</span>}
                </td>
                <td className="text-[11px] py-1.5 pl-2 text-right font-mono whitespace-nowrap" style={{ color: CAMPUS.teal }}>{r.score}/{r.maxScore}</td>
                <td className="text-[11px] py-1.5 pl-2 text-right font-mono" style={{ color: CAMPUS.ink }}>{r.pct}%</td>
                <td className="text-[11px] py-1.5 pl-2 text-right font-mono" style={{ color: CAMPUS.inkFaint }}>{r.correct}</td>
                <td className="text-[11px] py-1.5 pl-2 text-right font-mono" style={{ color: CAMPUS.inkFaint }}>{r.attempted}</td>
                <td className="text-[11px] py-1.5 pl-2 text-right font-mono" style={{ color: CAMPUS.inkFaint }}>{r.accuracy}%</td>
                <td className="text-[11px] py-1.5 pl-2 text-right font-mono whitespace-nowrap" style={{ color: CAMPUS.inkFaint }}>{formatDuration(r.timeTakenSeconds)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {collapsible && hidden > 0 && (
        <button onClick={onToggle} className="text-[10.5px] mt-1 flex items-center gap-1" style={{ color: CAMPUS.teal }}>
          <ChevronDown size={11} /> show all {group.rows.length}
        </button>
      )}
      {collapsible && open && (
        <button onClick={onToggle} className="text-[10.5px] mt-1 flex items-center gap-1" style={{ color: CAMPUS.teal }}>
          <ChevronUp size={11} /> collapse
        </button>
      )}
      {limit && group.rows.length > limit && (
        <p className="text-[10px] mt-1" style={{ color: CAMPUS.inkFaint }}>
          showing top {limit} of {group.rows.length} - per-class tables below cover everyone
        </p>
      )}
    </div>
  );
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

// Number field for the proctoring cadence/limit settings. Clamped on commit
// rather than on keystroke, so typing "12" through the intermediate "1" does not
// fight the user by snapping to the minimum mid-edit.
function SettingNumber({ value, onChange, min, max, step = 1, suffix }) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => { setDraft(String(value)); }, [value]);

  const commit = () => {
    const n = Number(draft);
    if (!Number.isFinite(n)) { setDraft(String(value)); return; }
    onChange(Math.min(max, Math.max(min, Math.round(n / step) * step)));
  };

  return (
    <span className="flex items-center gap-1.5">
      <input type="number" value={draft} min={min} max={max} step={step}
        onChange={e => setDraft(e.target.value)} onBlur={commit}
        onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); commit(); } }}
        className="text-[12px] w-20 px-2.5 py-1.5 rounded-lg outline-none text-right"
        style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.ink }} />
      {suffix && <span className="text-[11px]" style={{ color: CAMPUS.inkFaint }}>{suffix}</span>}
    </span>
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

          {/* Invigilation. Off by default and never implied by anything else -
              turning a contest into a camera-monitored session is a decision
              that has to be made explicitly, per contest. */}
          <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${CAMPUS.line}` }}>
            <p className="text-[11px] font-mono tracking-wide mb-1" style={{ color: CAMPUS.inkFaint }}>
              INVIGILATION (PROCTORING)
            </p>
          </div>
          <SettingRow label="Camera proctoring">
            <SettingToggle value={settings.proctoringEnabled} onChange={v => patch("proctoringEnabled", v)} />
          </SettingRow>

          {settings.proctoringEnabled && (
            <>
              <SettingRow label="Photo every">
                <SettingNumber value={settings.proctorSnapshotSeconds} min={60} max={1800} step={30}
                  suffix={`sec (${Math.round(settings.proctorSnapshotSeconds / 60)} min)`}
                  onChange={v => patch("proctorSnapshotSeconds", v)} />
              </SettingRow>
              <SettingRow label="Require fullscreen">
                <SettingToggle value={settings.proctorRequireFullscreen} onChange={v => patch("proctorRequireFullscreen", v)} />
              </SettingRow>
              <SettingRow label="Keep every photo">
                <SettingToggle value={settings.proctorRetainFrames} onChange={v => patch("proctorRetainFrames", v)} />
              </SettingRow>
              <SettingRow label="Auto-submit after N violations">
                <SettingNumber value={settings.proctorMaxViolations} min={0} max={20}
                  suffix={settings.proctorMaxViolations === 0 ? "off (warn only)" : "violations"}
                  onChange={v => patch("proctorMaxViolations", v)} />
              </SettingRow>

              <p className="text-[11px] leading-relaxed mt-2 px-3 py-2 rounded-lg"
                style={{ color: CAMPUS.inkSoft, background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}` }}>
                {settings.proctorRetainFrames
                  ? "Every photo is archived, so a disputed result has a full timeline. ~35KB per photo per student."
                  : "Only the newest photo is kept - each capture replaces the last. A challenge later will have no timeline to review."}
                {" "}Students must consent before the timer starts, and the contest must be served over https or the
                camera cannot be granted.
              </p>
            </>
          )}

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
  const [regQuery, setRegQuery] = useState("");
  const [expandedClass, setExpandedClass] = useState(null);
  const [participantClass, setParticipantClass] = useState("all");
  const [participantStatus, setParticipantStatus] = useState("all");
  const [participantQuery, setParticipantQuery] = useState("");
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

  // Filtered BEFORE the 100-row display cap below, not after - on a cohort of
  // 120+ registrants the student an admin is looking for is very often past
  // row 100, and searching a list that had already been truncated would simply
  // never find them. Roll number is matched as well as name because that is
  // what an admin reads off an attendance sheet.
  const filteredRegistrations = useMemo(() => {
    const q = regQuery.trim().toLowerCase();
    if (!q) return registrations;
    return registrations.filter(r =>
      (r.campusFullName || "").toLowerCase().includes(q)
      || (r.rollNumber || "").toLowerCase().includes(q)
      || (r.handle || "").toLowerCase().includes(q)
      || (r.uid || "").toLowerCase().includes(q)
    );
  }, [registrations, regQuery]);

  // Classwise results - built from the submissions and roster this dashboard
  // already loads, so it costs no extra reads.
  //
  // Ranked on PERCENTAGE, not raw score. For an ordinary contest where every
  // student sat the same paper the two are identical orderings, so this changes
  // nothing; it only diverges when a paper was edited mid-contest and different
  // students have different maxScore values, where ranking on raw score would
  // place a perfect 10/10 below a 12/20. Time is the tiebreak, matching
  // fetchLeaderboard's own score-then-timeTakenSeconds ordering; a missing time
  // sorts last so it can never win a tie by default.
  const classwise = useMemo(() => {
    const rosterByUid = new Map(roster.map(s => [s.uid, s]));
    const graded = submissions.filter(s => s.graded);
    const groups = new Map();
    for (const s of graded) {
      const r = rosterByUid.get(s.uid) || {};
      const label = (r.year || r.department || r.section)
        ? `${r.year || "?"} / ${r.department || "?"} / ${r.section || "?"}`
        : "Unassigned";
      const max = s.maxScore || 0;
      const row = {
        uid: s.uid,
        name: r.name || s.campusFullName || (s.uid || "").slice(0, 10),
        rollNumber: r.rollNumber || s.rollNumber || "",
        score: s.score || 0, maxScore: max,
        pct: max > 0 ? Math.round(((s.score || 0) / max) * 1000) / 10 : 0,
        correct: s.correctCount ?? 0,
        // Not stored on the submission - derived the same way gradeSubmission
        // counts it, so "attempted" here means the same thing as the accuracy
        // denominator rather than merely "has a key in answers".
        attempted: Object.values(s.answers || {}).filter(v =>
          !(v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0))).length,
        accuracy: s.accuracy ?? 0,
        timeTakenSeconds: s.timeTakenSeconds,
      };
      if (!groups.has(label)) groups.set(label, []);
      groups.get(label).push(row);
    }
    const byRank = (a, b) => b.pct - a.pct || b.score - a.score
      || ((a.timeTakenSeconds ?? Infinity) - (b.timeTakenSeconds ?? Infinity));
    const summarise = (label, rows) => {
      rows.sort(byRank);
      const timed = rows.filter(r => typeof r.timeTakenSeconds === "number");
      return {
        label, rows,
        avgPct: Math.round((rows.reduce((a, r) => a + r.pct, 0) / rows.length) * 10) / 10,
        avgTime: timed.length ? Math.round(timed.reduce((a, r) => a + r.timeTakenSeconds, 0) / timed.length) : null,
      };
    };
    const classes = [...groups.entries()]
      .map(([label, rows]) => summarise(label, rows))
      .sort((a, b) => a.label.localeCompare(b.label));
    // Whether a single paper had more than one maxScore - drives the footnote
    // explaining why ranking is on percentage rather than raw score.
    const mixedPapers = new Set(graded.map(s => s.maxScore)).size > 1;
    return {
      classes,
      overall: graded.length ? summarise("Overall", [...classes.flatMap(c => c.rows)]) : null,
      mixedPapers,
    };
  }, [submissions, roster]);

  // EVERY registrant, not just the ones who scored - built from registrations
  // joined to submissions, so the students who registered and never opened the
  // paper are present as rows rather than absent from the record. That absence
  // is the point: "who didn't attempt" is a question the dashboard is asked far
  // more often than "who came 47th", and fetchLeaderboard cannot answer it -
  // it queries submissions (so non-attempters do not exist there) and caps at
  // topN=50 (so on a 122-registrant contest most attempters are missing too).
  // Everything here is already in memory; this costs no extra reads.
  const participants = useMemo(() => {
    const rosterByUid = new Map(roster.map(s => [s.uid, s]));
    const subByUid = new Map(submissions.map(s => [s.uid, s]));
    const uids = new Set([...registrations.map(r => r.uid), ...submissions.map(s => s.uid)]);

    const rows = [...uids].map(uid => {
      const reg = registrations.find(r => r.uid === uid) || {};
      const r = rosterByUid.get(uid) || {};
      const s = subByUid.get(uid);
      const max = s?.maxScore || 0;
      const attempted = !!s;
      return {
        uid,
        name: r.name || reg.campusFullName || (reg.handle ? `@${reg.handle}` : uid.slice(0, 10)),
        rollNumber: r.rollNumber || reg.rollNumber || "",
        className: (r.year || r.department || r.section)
          ? `${r.year || "?"} / ${r.department || "?"} / ${r.section || "?"}` : "Unassigned",
        attempted,
        graded: !!s?.graded,
        registered: registrations.some(x => x.uid === uid),
        score: attempted ? (s.score || 0) : null,
        maxScore: max,
        pct: attempted && max > 0 ? Math.round(((s.score || 0) / max) * 1000) / 10 : null,
        correct: attempted ? (s.correctCount ?? 0) : null,
        attemptedCount: attempted
          ? Object.values(s.answers || {}).filter(v =>
              !(v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0))).length
          : null,
        accuracy: attempted ? (s.accuracy ?? 0) : null,
        timeTakenSeconds: attempted ? s.timeTakenSeconds : null,
      };
    });

    // Attempters rank above non-attempters; an unattempted paper has no rank at
    // all rather than a rank of zero, which would read as a score.
    rows.sort((a, b) => {
      if (a.attempted !== b.attempted) return a.attempted ? -1 : 1;
      if (!a.attempted) return (a.name || "").localeCompare(b.name || "");
      return b.pct - a.pct || b.score - a.score
        || ((a.timeTakenSeconds ?? Infinity) - (b.timeTakenSeconds ?? Infinity));
    });
    rows.forEach((r, i) => { r.rank = r.attempted ? i + 1 : null; });

    return {
      rows,
      classNames: [...new Set(rows.map(r => r.className))].sort(),
      attemptedCount: rows.filter(r => r.attempted).length,
      noAttemptCount: rows.filter(r => !r.attempted).length,
    };
  }, [registrations, submissions, roster]);

  const filteredParticipants = useMemo(() => {
    const q = participantQuery.trim().toLowerCase();
    return participants.rows.filter(r => {
      if (participantClass !== "all" && r.className !== participantClass) return false;
      if (participantStatus === "attempted" && !r.attempted) return false;
      if (participantStatus === "notAttempted" && r.attempted) return false;
      if (!q) return true;
      return (r.name || "").toLowerCase().includes(q)
        || (r.rollNumber || "").toLowerCase().includes(q)
        || (r.className || "").toLowerCase().includes(q);
    });
  }, [participants, participantClass, participantStatus, participantQuery]);

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
          {/* Counts down to contestEnd - when the WINDOW shuts - not to any one
              student's deadline. On a paper open 07:00-23:30 that reads as ~14
              hours, which under a bare "TIME REMAINING" looks like the exam
              length. Each student gets durationMinutes from their own start, so
              both numbers are stated rather than one being mistaken for the
              other. Same fix as the student-facing details card in
              campus-contests.jsx. */}
          <p className="text-[10px] font-mono tracking-wider mb-1.5" style={{ color: CAMPUS.inkFaint }}>
            {phase === "live" ? "CONTEST WINDOW CLOSES IN" : "WINDOW OPENS IN"}
          </p>
          <p className="text-2xl font-bold font-mono" style={{ color: phase === "live" ? CAMPUS.warn : CAMPUS.teal }}>{countdown}</p>
          {contest.durationMinutes > 0 && (
            <p className="text-[11px] mt-2" style={{ color: CAMPUS.inkSoft }}>
              Each student gets <b style={{ color: CAMPUS.ink }}>{contest.durationMinutes} min</b> from their own start
            </p>
          )}
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
            <button onClick={() => exportRegistrationsCsv(filteredRegistrations, contest.title)} disabled={filteredRegistrations.length === 0}
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
            <>
              <div className="relative mb-2">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: CAMPUS.inkFaint }} />
                <input value={regQuery} onChange={e => setRegQuery(e.target.value)} placeholder="Search by name or roll number..."
                  className="w-full text-[12px] pl-9 pr-8 py-1.5 rounded-lg outline-none"
                  style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.ink }} />
                {regQuery && (
                  <button onClick={() => setRegQuery("")} title="Clear search"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2" style={{ color: CAMPUS.inkFaint }}>
                    <X size={12} />
                  </button>
                )}
              </div>
              {regQuery.trim() && (
                <p className="text-[10.5px] mb-1.5" style={{ color: CAMPUS.inkFaint }}>
                  {filteredRegistrations.length} of {registrations.length} match &quot;{regQuery.trim()}&quot;
                </p>
              )}
              {filteredRegistrations.length === 0 ? (
                <div className="py-6 text-center">
                  <Search size={18} style={{ color: CAMPUS.inkFaint }} className="mx-auto mb-2" />
                  <p className="text-[12px]" style={{ color: CAMPUS.inkFaint }}>No registrant matches that search.</p>
                </div>
              ) : (
            <div className="max-h-56 overflow-y-auto space-y-1">
              {filteredRegistrations.slice(0, 100).map(r => (
                <div key={r.uid} className="flex items-center justify-between gap-2 text-[11.5px]">
                  <span className="truncate flex-1 min-w-0" style={{ color: CAMPUS.inkSoft }}>{participantLabel(r)}</span>
                  {r.rollNumber && <span className="font-mono flex-shrink-0" style={{ color: CAMPUS.inkFaint }}>{r.rollNumber}</span>}
                  {submittedUids.has(r.uid) && (
                    <button onClick={() => handleResetAttempt(r.uid)} disabled={resettingUid === r.uid} title="Reset attempt"
                      className="flex-shrink-0 disabled:opacity-40" style={{ color: CAMPUS.bad }}>
                      <RotateCcw size={12} />
                    </button>
                  )}
                </div>
              ))}
              {filteredRegistrations.length > 100 && <p className="text-[10.5px]" style={{ color: CAMPUS.inkFaint }}>+{filteredRegistrations.length - 100} more - search above, or export CSV for the full list.</p>}
            </div>
              )}
            </>
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
                      {/* Time is already what fetchLeaderboard breaks ties on
                          (score desc, timeTakenSeconds asc), so two students on
                          the same score were always ordered by it - showing it
                          just makes the ordering legible instead of arbitrary. */}
                      <td className="text-[11.5px] py-1.5 pl-2 text-right font-mono whitespace-nowrap" style={{ color: CAMPUS.inkFaint }}>{formatDuration(row.timeTakenSeconds)}</td>
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

      {participants.rows.length > 0 && (
        <CampusCard className="p-4 mt-4 min-w-0">
          <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
            <p className="text-[12.5px] font-semibold flex items-center gap-1.5" style={{ color: CAMPUS.ink }}>
              <Trophy size={13} /> Full Leaderboard
              <span className="font-normal" style={{ color: CAMPUS.inkFaint }}>
                {participants.rows.length} registered &middot; {participants.attemptedCount} attempted &middot; {participants.noAttemptCount} did not
              </span>
            </p>
            <button onClick={() => exportParticipantsCsv(filteredParticipants, contest.title)}
              disabled={filteredParticipants.length === 0}
              className="flex items-center gap-1 text-[11px] disabled:opacity-40" style={{ color: CAMPUS.teal }}>
              <Download size={11} /> export csv ({filteredParticipants.length})
            </button>
          </div>

          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <select value={participantClass} onChange={e => setParticipantClass(e.target.value)}
              className="text-[11px] px-2 py-1.5 rounded-lg outline-none"
              style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.ink }}>
              <option value="all">All classes ({participants.rows.length})</option>
              {participants.classNames.map(cn => (
                <option key={cn} value={cn}>{cn} ({participants.rows.filter(r => r.className === cn).length})</option>
              ))}
            </select>
            {[["all", "All"], ["attempted", `Attempted (${participants.attemptedCount})`], ["notAttempted", `No attempt (${participants.noAttemptCount})`]].map(([v, label]) => (
              <button key={v} onClick={() => setParticipantStatus(v)}
                className="text-[11px] px-2.5 py-1.5 rounded-lg transition-colors"
                style={participantStatus === v
                  ? { background: `${CAMPUS.purple}1F`, color: CAMPUS.purple, border: `1px solid ${CAMPUS.purple}55` }
                  : { background: CAMPUS.paper, color: CAMPUS.inkFaint, border: `1px solid ${CAMPUS.line}` }}>
                {label}
              </button>
            ))}
            <div className="relative flex-1 min-w-[140px]">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: CAMPUS.inkFaint }} />
              <input value={participantQuery} onChange={e => setParticipantQuery(e.target.value)} placeholder="name, roll number or class..."
                className="w-full text-[11px] pl-7 pr-7 py-1.5 rounded-lg outline-none"
                style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.ink }} />
              {participantQuery && (
                <button onClick={() => setParticipantQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2" style={{ color: CAMPUS.inkFaint }}>
                  <X size={11} />
                </button>
              )}
            </div>
          </div>

          {filteredParticipants.length === 0 ? (
            <div className="py-6 text-center">
              <Search size={18} style={{ color: CAMPUS.inkFaint }} className="mx-auto mb-2" />
              <p className="text-[12px]" style={{ color: CAMPUS.inkFaint }}>Nobody matches these filters.</p>
            </div>
          ) : (
            <div className="max-h-[26rem] overflow-y-auto overflow-x-auto">
              <table className="w-full">
                <thead className="sticky top-0" style={{ background: CAMPUS.surface }}>
                  <tr style={{ color: CAMPUS.inkFaint }}>
                    {["#", "Name", "Class", "Score", "%", "Correct", "Att.", "Acc.", "Time"].map((h, i) => (
                      <th key={h} className={`text-[9.5px] uppercase tracking-wide font-semibold py-1.5 whitespace-nowrap ${i <= 2 ? "text-left" : "text-right pl-2"} ${i === 0 ? "pr-2" : ""}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredParticipants.map(r => (
                    <tr key={r.uid} style={{ borderTop: `1px solid ${CAMPUS.line}`, opacity: r.attempted ? 1 : 0.55 }}>
                      <td className="text-[11px] py-1.5 pr-2 w-7">
                        {r.rank && r.rank <= 3
                          ? <span className="flex items-center gap-0.5 font-bold" style={{ color: r.rank === 1 ? CAMPUS.gold : r.rank === 2 ? "#9CA3AF" : "#B87333" }}><Medal size={10} /> {r.rank}</span>
                          : <span style={{ color: CAMPUS.inkFaint }}>{r.rank ?? "-"}</span>}
                      </td>
                      <td className="text-[11px] py-1.5 min-w-0" style={{ color: CAMPUS.ink }}>
                        <span className="block truncate">{r.name}</span>
                        {r.rollNumber && <span className="block font-mono text-[9.5px]" style={{ color: CAMPUS.inkFaint }}>{r.rollNumber}</span>}
                      </td>
                      <td className="text-[10px] py-1.5 whitespace-nowrap" style={{ color: CAMPUS.inkFaint }}>{r.className}</td>
                      {r.attempted ? (
                        <>
                          <td className="text-[11px] py-1.5 pl-2 text-right font-mono whitespace-nowrap" style={{ color: CAMPUS.teal }}>{r.score}/{r.maxScore}</td>
                          <td className="text-[11px] py-1.5 pl-2 text-right font-mono" style={{ color: CAMPUS.ink }}>{r.pct}%</td>
                          <td className="text-[11px] py-1.5 pl-2 text-right font-mono" style={{ color: CAMPUS.inkFaint }}>{r.correct}</td>
                          <td className="text-[11px] py-1.5 pl-2 text-right font-mono" style={{ color: CAMPUS.inkFaint }}>{r.attemptedCount}</td>
                          <td className="text-[11px] py-1.5 pl-2 text-right font-mono" style={{ color: CAMPUS.inkFaint }}>{r.accuracy}%</td>
                          <td className="text-[11px] py-1.5 pl-2 text-right font-mono whitespace-nowrap" style={{ color: CAMPUS.inkFaint }}>{formatDuration(r.timeTakenSeconds)}</td>
                        </>
                      ) : (
                        <td colSpan={6} className="text-[10.5px] py-1.5 pl-2 text-right italic" style={{ color: CAMPUS.inkFaint }}>
                          registered - did not attempt
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CampusCard>
      )}

      {classwise.overall && (
        <CampusCard className="p-4 mt-4 min-w-0">
          <div className="flex items-center justify-between mb-1 gap-2 flex-wrap">
            <p className="text-[12.5px] font-semibold flex items-center gap-1.5" style={{ color: CAMPUS.ink }}>
              <Users size={13} /> Classwise Results
              <span className="font-normal" style={{ color: CAMPUS.inkFaint }}>
                {classwise.overall.rows.length} students &middot; {classwise.classes.length} {classwise.classes.length === 1 ? "class" : "classes"}
              </span>
            </p>
            {/* Was a CSV-only anchor. ReportDownloadButton is the existing
                report control (campus-ui.jsx) and already offers CSV, Excel and
                PDF off one `getReport()` - lib/campusReports.js does the PDF via
                jspdf + jspdf-autotable, both already dependencies. So a PDF of
                the classwise sheet needed wiring, not new machinery.
                Rows are flattened class-by-class with the class label and the
                WITHIN-CLASS rank on each row, so the ordering that makes the
                on-screen blocks readable survives into a flat table. */}
            <ReportDownloadButton
              label="Download results"
              size="sm"
              getReport={() => ({
                title: `${contest.title} - Classwise Results`,
                filename: `${contest.title.replace(/\s+/g, "-").toLowerCase()}-classwise-results`,
                columns: [
                  { label: "Class", value: r => r.className },
                  { label: "Rank in class", value: r => r.classRank },
                  { label: "Name", value: r => r.name },
                  { label: "Roll number", value: r => r.rollNumber },
                  { label: "Score", value: r => `${r.score}/${r.maxScore}` },
                  { label: "Percent", value: r => `${r.pct}%` },
                  { label: "Correct", value: r => r.correct },
                  { label: "Attempted", value: r => r.attempted },
                  { label: "Accuracy", value: r => `${r.accuracy}%` },
                  { label: "Time taken", value: r => formatDuration(r.timeTakenSeconds) },
                ],
                rows: classwise.classes.flatMap(cls =>
                  cls.rows.map((r, i) => ({ ...r, className: cls.label, classRank: i + 1 }))),
              })} />
          </div>
          {classwise.mixedPapers && (
            <p className="text-[10.5px] mb-3 px-2.5 py-1.5 rounded-md"
              style={{ color: CAMPUS.inkSoft, background: `${CAMPUS.warn}14`, borderLeft: `2px solid ${CAMPUS.warn}` }}>
              Students sat papers of different lengths, so ranking is by <b>percentage</b> - ranking on raw score
              would place a perfect 10/10 below a 12/20.
            </p>
          )}

          <ClasswiseSection group={classwise.overall} title="Overall - Top 25" limit={25} />
          {classwise.classes.map(cls => (
            <ClasswiseSection key={cls.label} group={cls}
              open={expandedClass === cls.label}
              onToggle={() => setExpandedClass(expandedClass === cls.label ? null : cls.label)} />
          ))}
        </CampusCard>
      )}

      {/* min-w-0 on the grid children below is load-bearing: `truncate` sets
          white-space:nowrap, and a grid item defaults to min-width:auto, so
          without it the item refuses to shrink below one very long unwrapped
          question line and pushes the whole page into a horizontal scroll on
          mobile. */}
      {analytics.perQuestion.length > 0 && (
        <div className="grid lg:grid-cols-2 gap-4 mt-4">
          <CampusCard className="p-4 min-w-0">
            <p className="text-[12.5px] font-semibold mb-3" style={{ color: CAMPUS.ink }}>Most Incorrect Questions</p>
            <div className="space-y-2.5">
              {analytics.mostIncorrect.map(q => (
                <div key={q.id}>
                  <p className="text-[11.5px] truncate mb-1" style={{ color: CAMPUS.inkSoft }}>{plainInline(q.question)}</p>
                  <div className="flex items-center gap-2"><Bar pct={q.accuracy ?? 0} color={CAMPUS.bad} /><span className="text-[10px] font-mono" style={{ color: CAMPUS.inkFaint }}>{q.incorrect} wrong</span></div>
                </div>
              ))}
            </div>
          </CampusCard>
          <CampusCard className="p-4 min-w-0">
            <p className="text-[12.5px] font-semibold mb-3" style={{ color: CAMPUS.ink }}>Most Skipped Questions</p>
            <div className="space-y-2.5">
              {analytics.mostSkipped.map(q => (
                <div key={q.id}>
                  <p className="text-[11.5px] truncate mb-1" style={{ color: CAMPUS.inkSoft }}>{plainInline(q.question)}</p>
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

      {/* Sits directly under Settings, where the proctoring toggle lives, so the
          switch and its consequences read as one thing. Renders its own "off"
          explainer rather than being hidden when proctoring is disabled - an
          invigilator looking for footage that was never captured needs to be
          told why, not shown nothing. */}
      <ContestProctorConsole
        contestId={contestId}
        proctoringEnabled={getContestSettings(contest).proctoringEnabled}
      />

      <ContestReviewersPanel contestId={contestId} roster={roster} adminUid={user?.uid} />

      <ContestInfoCard contest={contest} onSaved={load} />

      {certRow && <CampusCertificateModal contest={contest} institution={institution} row={certRow} onClose={() => setCertRow(null)} />}
    </div>
  );
}
