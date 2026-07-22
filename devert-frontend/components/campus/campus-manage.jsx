"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check, X, Upload, Plus, Trophy, BookOpen, Search, Pencil, Download,
  UserX, UserCheck, History, Megaphone, Eye, Power, ChevronRight, ClipboardCheck, Copy, Trash2,
  MoreVertical, UserMinus, CalendarClock, Mail, Ban,
} from "lucide-react";
import {
  fetchPendingStudents, fetchApprovedStudents, fetchRosterStudents, approveStudent, rejectStudent,
  bulkAssignByRollNumber, updateStudentIdentity, suspendStudent, sendAnnouncement,
  fetchAnnouncements, deleteAnnouncement, isAnnouncementActive, announcementStatus,
  removeStudentFromInstitution, setContestRestriction, DEPARTMENTS, YEARS,
  fetchLeaderboardSettings, saveLeaderboardSettings, LEADERBOARD_METRICS,
} from "@/lib/institutions";
import { fetchInstitutionContests, contestPhase } from "@/lib/contests";
import { fetchPublishedProblems } from "@/lib/codelab";
import { fetchContentVisibility, setProblemHidden, setCompanyHidden } from "@/lib/contentVisibility";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import {
  DOW_LABELS, mondayOf, shiftWeek, todayISO, fetchWeekItems, fetchModuleConfig, setModuleEnabled,
  setItemStatus, fetchDayLeaderboard, duplicateItem, deleteItem,
} from "@/lib/dailyLearning";
import { DailyLearningItemEditor } from "@/components/campus/campus-daily-learning-editor";
import { useAuth } from "@/context/AuthContext";
import { CAMPUS } from "@/lib/campus-theme";
import { CampusCard, CampusChip, CampusButton, CampusSkeleton, CampusEmptyState, CampusBackButton } from "@/components/campus/campus-ui";
import { CampusContestStudio } from "@/components/campus/campus-contest-studio";
import { CampusContestDashboard } from "@/components/campus/campus-contest-dashboard";
import { CampusQuestionBank } from "@/components/campus/campus-question-bank";
import { CampusDailyLearningAdminPreview } from "@/components/campus/campus-daily-learning";
import { CampusPracticeList, CampusProblemView } from "@/components/campus/campus-practice";
import { CampusCompanyPrepFlow } from "@/components/campus/campus-company-prep";
import { CampusBrandingForm } from "@/components/campus/campus-branding";
import { StudentAnalyticsDashboard } from "@/components/campus/campus-student-dashboard";
import { CampusClassrooms } from "@/components/campus/campus-classrooms";

const MANAGE_TABS = [
  { key: "students", label: "Students" },
  { key: "contests",  label: "Contests" },
  { key: "dailyLearning", label: "Daily Learning" },
  { key: "practice", label: "Practice & DSA" },
  { key: "companyPrep", label: "Company Vault" },
  { key: "leaderboards", label: "Leaderboards" },
  { key: "branding", label: "Branding" },
];

export function CampusManage({ institutionId, institution }) {
  const [tab, setTab] = useState("students");
  return (
    <div>
      <div className="flex gap-1.5 mb-5">
        {MANAGE_TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="text-[12.5px] font-semibold px-3.5 py-1.5 rounded-lg transition-colors"
            style={{
              background: tab === t.key ? CAMPUS.tealTint : "transparent",
              color: tab === t.key ? CAMPUS.teal : CAMPUS.inkSoft,
            }}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === "students" && <ManageStudents institutionId={institutionId} institution={institution} />}
      {tab === "contests" && <CampusContestsTab institutionId={institutionId} />}
      {tab === "dailyLearning" && <ManageDailyLearning institutionId={institutionId} />}
      {tab === "practice" && <ManagePracticePreview institutionId={institutionId} />}
      {tab === "companyPrep" && <ManageCompanyPrepPreview institutionId={institutionId} />}
      {tab === "leaderboards" && <ManageLeaderboards institutionId={institutionId} />}
      {tab === "branding" && <ManageBranding institutionId={institutionId} institution={institution} />}
    </div>
  );
}

// Institution-wide leaderboard configuration - master on/off, per-scope
// enables (Section/Department/Campus - the three scopes that actually exist,
// see CampusLeaderboardTab in campus-app.jsx), and which stat ranks students.
// Per-classroom visibility (further restricting these for one specific
// classroom) lives on the classroom itself - see campus-classrooms.jsx's
// ClassroomDashboard - not here, since that's a finer grain than an
// institution-wide setting. "Reset weekly/monthly" and "Archive previous
// leaderboards" from the original spec aren't built here: this app has no
// Cloud Functions (blocked on the same Firebase billing gap noted throughout
// lib/institutions.js), so a true scheduled reset isn't reliably buildable
// yet - only a live, all-time ranking exists today.
function ManageLeaderboards({ institutionId }) {
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = () => { fetchLeaderboardSettings(institutionId).then(setSettings); };
  useEffect(load, [institutionId]);

  const save = async (patch) => {
    setSaving(true);
    const next = { ...settings, ...patch };
    setSettings(next);
    try {
      await saveLeaderboardSettings(institutionId, patch);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      window.alert(e.message || "Failed to save.");
      load();
    } finally {
      setSaving(false);
    }
  };

  if (!settings) return <CampusCard className="p-5"><CampusSkeleton variant="rect" height={140} /></CampusCard>;

  const scopeRows = [
    { key: "sectionEnabled", label: "Section (Class) Leaderboard", description: "Students ranked against classmates in the exact same Department + Year + Section." },
    { key: "departmentEnabled", label: "Department Leaderboard", description: "Students ranked against their whole Department + Year, across every section." },
    { key: "campusEnabled", label: "Overall Campus Leaderboard", description: "Every approved student at this institution, ranked together." },
  ];

  return (
    <div className="space-y-5 max-w-2xl">
      <h2 className="text-lg font-semibold" style={{ color: CAMPUS.ink }}>Leaderboards</h2>

      {saved && (
        <p className="text-[12.5px] px-3 py-2 rounded-lg" style={{ background: CAMPUS.goodTint, color: CAMPUS.good }}>Saved.</p>
      )}

      <CampusCard className="p-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-[13.5px] font-semibold" style={{ color: CAMPUS.ink }}>Leaderboards module</p>
          <p className="text-[11px]" style={{ color: CAMPUS.inkFaint }}>When disabled, students see no leaderboard tab at all for this campus.</p>
        </div>
        <ToggleSwitch value={settings.enabled !== false} onChange={(v) => save({ enabled: v })} />
      </CampusCard>

      <CampusCard className="p-4">
        <p className="text-[10px] font-mono tracking-widest mb-3" style={{ color: CAMPUS.inkFaint }}>SCOPES</p>
        <div className="space-y-3">
          {scopeRows.map(r => (
            <div key={r.key} className="flex items-center justify-between gap-4 py-2" style={{ borderTop: `1px solid ${CAMPUS.line}` }}>
              <div className="min-w-0">
                <p className="text-[13px] font-medium" style={{ color: CAMPUS.ink }}>{r.label}</p>
                <p className="text-[11px] mt-0.5" style={{ color: CAMPUS.inkFaint }}>{r.description}</p>
              </div>
              <ToggleSwitch value={settings[r.key] !== false} onChange={(v) => save({ [r.key]: v })} />
            </div>
          ))}
        </div>
        <p className="text-[10.5px] mt-3" style={{ color: CAMPUS.inkFaint }}>
          A classroom can further hide a scope just for itself from Students -&gt; Classrooms view -&gt; open a classroom -&gt; Leaderboard Visibility.
        </p>
      </CampusCard>

      <CampusCard className="p-4">
        <p className="text-[10px] font-mono tracking-widest mb-3" style={{ color: CAMPUS.inkFaint }}>RANKING METRIC</p>
        <div className="flex gap-2 flex-wrap">
          {LEADERBOARD_METRICS.map(m => (
            <button key={m.key} onClick={() => save({ rankingMetric: m.key })} disabled={saving}
              className="text-[12px] font-semibold px-3.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
              style={{
                color: (settings.rankingMetric || "xp") === m.key ? "#fff" : CAMPUS.inkSoft,
                background: (settings.rankingMetric || "xp") === m.key ? CAMPUS.teal : "transparent",
                border: `1px solid ${(settings.rankingMetric || "xp") === m.key ? CAMPUS.teal : CAMPUS.line}`,
              }}>
              {m.label}
            </button>
          ))}
        </div>
      </CampusCard>
    </div>
  );
}

function ManageBranding({ institutionId, institution }) {
  const [saved, setSaved] = useState(false);
  return (
    <div className="max-w-lg">
      <h2 className="text-lg font-semibold mb-1" style={{ color: CAMPUS.ink }}>Campus Branding</h2>
      <p className="text-[12.5px] mb-4" style={{ color: CAMPUS.inkFaint }}>
        Customize how {institution?.name || "your campus"} appears in search results and social sharing previews -
        banner, logo, tagline, and accent color. The logo also shows in place of initials in the sidebar and Campus
        directory. There's no on-page banner display right now - this only affects search/share metadata and the logo.
      </p>
      {saved && (
        <p className="text-[12.5px] mb-4 px-3 py-2 rounded-lg" style={{ background: CAMPUS.goodTint, color: CAMPUS.good }}>
          Branding saved. Refresh to see it live.
        </p>
      )}
      <CampusBrandingForm institutionId={institutionId} institution={institution}
        onSaved={() => { setSaved(true); setTimeout(() => setSaved(false), 4000); }} />
    </div>
  );
}

// ---------------- Daily Learning: enable/disable, per-day analytics, preview ----------------

// Explicit pixel sizes, not Tailwind classes - "h-5.5"/"w-4.5" aren't real
// steps in Tailwind's default scale, so they silently apply no height/width
// rule at all, leaving the button's box sized by nothing but its content
// (the blobby, oversized pill this replaces).
function ToggleSwitch({ value, onChange }) {
  return (
    <button onClick={() => onChange(!value)} className="relative flex-shrink-0 rounded-full transition-colors"
      style={{ width: 38, height: 21, padding: 0, border: "none", cursor: "pointer", background: value ? CAMPUS.teal : CAMPUS.line }}>
      <span className="absolute rounded-full bg-white transition-transform" style={{ width: 17, height: 17, top: 2, left: 2, transform: value ? "translateX(17px)" : "translateX(0)", boxShadow: "0 1px 2px rgba(0,0,0,0.25)" }} />
    </button>
  );
}

function DailyLearningCard({ item, stat, approvedCount, onToggleStatus, onEdit, onDuplicate, onDelete }) {
  const published = item.status !== "draft";

  return (
    <CampusCard className="p-4" style={!published ? { opacity: 0.6 } : undefined}>
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          {item.type === "test" ? <ClipboardCheck size={13} style={{ color: CAMPUS.purple }} /> : <BookOpen size={13} style={{ color: CAMPUS.teal }} />}
          <span className="text-[11px] font-mono font-semibold" style={{ color: CAMPUS.inkFaint }}>{DOW_LABELS[item.dow].toUpperCase()} - {item.date}</span>
        </div>
        <ToggleSwitch value={published} onChange={(v) => onToggleStatus(v ? "published" : "draft")} />
      </div>

      <b className="block text-[13.5px] mb-2" style={{ color: CAMPUS.ink }}>{item.title}</b>

      <div className="flex items-center gap-3 text-[11px] font-mono mb-3" style={{ color: CAMPUS.inkFaint }}>
        <CampusChip color={published ? CAMPUS.good : CAMPUS.inkFaint}>{published ? "PUBLISHED" : "DRAFT"}</CampusChip>
        <span style={{ color: CAMPUS.teal }}>{stat ? `${stat.completed}/${approvedCount} completed` : "-"}</span>
      </div>
      {stat && (
        <div className="flex items-center gap-3 text-[10.5px] font-mono mb-3" style={{ color: CAMPUS.inkFaint }}>
          <span>avg MCQ {stat.avgMcqPct}%</span>
          <span>avg problems {stat.avgProbPct}%</span>
        </div>
      )}

      <div className="flex items-center gap-1.5 pt-2" style={{ borderTop: `1px solid ${CAMPUS.line}` }}>
        <button onClick={onEdit} className="flex items-center gap-1 text-[10.5px] font-semibold px-2 py-1 rounded-lg" style={{ color: CAMPUS.teal }}>
          <Pencil size={10} /> edit
        </button>
        <button onClick={onDuplicate} className="flex items-center gap-1 text-[10.5px] font-semibold px-2 py-1 rounded-lg" style={{ color: CAMPUS.purple }}>
          <Copy size={10} /> duplicate
        </button>
        <button onClick={onDelete} className="flex items-center gap-1 text-[10.5px] font-semibold px-2 py-1 rounded-lg ml-auto" style={{ color: CAMPUS.bad }}>
          <Trash2 size={10} /> delete
        </button>
      </div>
    </CampusCard>
  );
}

function ManageDailyLearning({ institutionId }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [items, setItems] = useState(undefined);
  const [moduleEnabled, setModuleEnabledState] = useState(true);
  const [approvedCount, setApprovedCount] = useState(0);
  const [stats, setStats] = useState({});
  const [showPreview, setShowPreview] = useState(false);
  const [editorState, setEditorState] = useState(null); // null | "new" | an item object
  const weekId = shiftWeek(mondayOf(), weekOffset);

  const reload = () => {
    Promise.all([
      fetchWeekItems(institutionId, weekId, { includeUnpublished: true }),
      fetchModuleConfig(institutionId),
      fetchApprovedStudents(institutionId),
    ]).then(([rows, cfg, students]) => {
      setItems(rows);
      setModuleEnabledState(cfg.enabled !== false);
      setApprovedCount(students.length);
    }).catch(() => setItems([]));
  };

  useEffect(reload, [institutionId, weekId]);

  useEffect(() => {
    if (!items?.length) { setStats({}); return; }
    Promise.all(items.map(it => fetchDayLeaderboard(institutionId, it.date))).then(results => {
      const byDate = {};
      items.forEach((it, i) => {
        const rows = results[i];
        const completed = rows.length;
        const pct = (num, den) => (den ? Math.round((num / den) * 100) : 0);
        const avgMcqPct = completed ? Math.round(rows.reduce((s, r) => s + pct(r.mcqScore, r.mcqTotal), 0) / completed) : 0;
        const avgProbPct = completed ? Math.round(rows.reduce((s, r) => s + pct((r.problemsSolved || []).length, r.problemsTotal), 0) / completed) : 0;
        byDate[it.date] = { completed, avgMcqPct, avgProbPct };
      });
      setStats(byDate);
    }).catch(() => {});
  }, [items, institutionId]);

  const toggleModule = async (next) => {
    setModuleEnabledState(next);
    await setModuleEnabled(institutionId, next);
  };

  const toggleDayStatus = async (date, nextStatus) => {
    setItems(prev => prev.map(it => it.date === date ? { ...it, status: nextStatus } : it));
    await setItemStatus(institutionId, date, nextStatus);
  };

  const handleDuplicate = async (item) => {
    const toDate = window.prompt(`Duplicate "${item.title}" to which date (YYYY-MM-DD)? Must be Monday-Saturday and not already used.`, "");
    if (!toDate) return;
    if (items.some(it => it.date === toDate)) { window.alert("That date already has a day - pick a different one."); return; }
    try {
      await duplicateItem(institutionId, item.date, toDate);
      reload();
    } catch (e) { window.alert(e.message); }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete "${item.title}" (${item.date})? This can't be undone.`)) return;
    await deleteItem(institutionId, item.date);
    setItems(prev => prev.filter(it => it.date !== item.date));
  };

  if (items === undefined) return <CampusCard className="p-5 space-y-3"><CampusSkeleton variant="rect" height={100} /></CampusCard>;

  if (editorState) {
    return (
      <DailyLearningItemEditor slug={institutionId} item={editorState === "new" ? null : editorState}
        defaultDate={editorState === "new" ? todayISO() : undefined}
        onClose={() => setEditorState(null)}
        onSaved={() => { setEditorState(null); reload(); }} />
    );
  }

  if (showPreview) {
    return (
      <div>
        <CampusBackButton onClick={() => setShowPreview(false)} label="Back to Daily Learning management" />
        <CampusDailyLearningAdminPreview slug={institutionId} weekId={weekId} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <CampusCard className="p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <Power size={15} style={{ color: moduleEnabled ? CAMPUS.good : CAMPUS.inkFaint }} />
          <div>
            <p className="text-[13.5px] font-semibold" style={{ color: CAMPUS.ink }}>Daily Learning module</p>
            <p className="text-[11px]" style={{ color: CAMPUS.inkFaint }}>When disabled, students see the generic course catalog instead of this week-wise program.</p>
          </div>
        </div>
        <ToggleSwitch value={moduleEnabled} onChange={toggleModule} />
      </CampusCard>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button onClick={() => setWeekOffset(w => w - 1)} className="text-[11px] font-mono px-2 py-1 rounded-lg" style={{ border: `1px solid ${CAMPUS.line}`, color: CAMPUS.inkSoft }}>&larr; prev</button>
          <p className="text-[11px] font-mono tracking-widest" style={{ color: CAMPUS.inkFaint }}>
            WEEK OF {weekId} {weekOffset === 0 && "(CURRENT)"} - {approvedCount} APPROVED STUDENTS
          </p>
          <button onClick={() => setWeekOffset(w => w + 1)} className="text-[11px] font-mono px-2 py-1 rounded-lg" style={{ border: `1px solid ${CAMPUS.line}`, color: CAMPUS.inkSoft }}>next &rarr;</button>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setEditorState("new")} className="flex items-center gap-1.5 text-[11.5px] font-semibold px-3 py-1.5 rounded-lg"
            style={{ color: "#fff", background: CAMPUS.teal }}>
            <Plus size={12} /> add day
          </button>
          <button onClick={() => setShowPreview(true)} className="flex items-center gap-1.5 text-[11.5px] font-semibold px-3 py-1.5 rounded-lg"
            style={{ color: CAMPUS.teal, border: `1px solid ${CAMPUS.teal}50`, background: CAMPUS.tealTint }}>
            <Eye size={12} /> preview as student
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <CampusEmptyState icon={BookOpen} title="Nothing authored for this week" description="No Daily Learning content exists yet for the week starting on this Monday." />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map(item => (
            <DailyLearningCard key={item.date} item={item} stat={stats[item.date]} approvedCount={approvedCount}
              onToggleStatus={(s) => toggleDayStatus(item.date, s)}
              onEdit={() => setEditorState(item)}
              onDuplicate={() => handleDuplicate(item)}
              onDelete={() => handleDelete(item)} />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------- Practice & DSA preview + cohort analytics ----------------

function studentLabel(s) {
  return s.campusFullName || s.name || s.displayName || s.rollNumber || "Student";
}

function ManagePracticePreview({ institutionId }) {
  const [view, setView] = useState("analytics"); // "analytics" | "preview" | problemId
  const [problems, setProblems] = useState(undefined);
  const [students, setStudents] = useState([]);
  const [visibility, setVisibility] = useState({ hiddenProblemIds: [] });
  const [selectedCategory, setSelectedCategory] = useState(null);

  const reloadVisibility = () => fetchContentVisibility(institutionId).then(setVisibility).catch(() => {});

  useEffect(() => {
    fetchPublishedProblems().then(setProblems).catch(() => setProblems([]));
    fetchApprovedStudents(institutionId).then(setStudents).catch(() => setStudents([]));
    reloadVisibility();
  }, [institutionId]);

  const [cohortProgress, setCohortProgress] = useState(undefined);
  useEffect(() => {
    if (!students.length) { setCohortProgress([]); return; }
    Promise.all(students.map(s => getDoc(doc(db, "user_codelab_progress", s.uid)).then(snap => ({
      uid: s.uid, label: studentLabel(s), rollNumber: s.rollNumber,
      solvedProblems: snap.exists() ? (snap.data().solvedProblems || {}) : {},
    })))).then(setCohortProgress).catch(() => setCohortProgress([]));
  }, [students]);

  const hiddenIds = useMemo(() => new Set(visibility.hiddenProblemIds || []), [visibility]);
  const toggleHidden = async (problemId, hidden) => {
    setVisibility(v => ({ ...v, hiddenProblemIds: hidden ? [...(v.hiddenProblemIds || []), problemId] : (v.hiddenProblemIds || []).filter(id => id !== problemId) }));
    await setProblemHidden(institutionId, problemId, hidden);
  };

  if (view === "preview") {
    return (
      <div>
        <CampusBackButton onClick={() => setView("analytics")} label="Back to Practice & DSA management" />
        <CampusPracticeList onSelect={(id) => setView(id)} adminMode hiddenIds={hiddenIds} onToggleHidden={toggleHidden} />
      </div>
    );
  }
  if (view !== "analytics") {
    // No extra CampusBackButton here - CampusProblemView already renders its
    // own (wired to the same setView("preview") destination), and stacking
    // a second one on top of it just duplicates the same control twice.
    return <CampusProblemView problemId={view} onBack={() => setView("preview")} />;
  }

  if (problems === undefined || cohortProgress === undefined) {
    return <CampusCard className="p-5"><CampusSkeleton variant="rect" height={140} /></CampusCard>;
  }

  if (selectedCategory) {
    return (
      <TopicAnalytics category={selectedCategory} problems={problems.filter(p => p.category === selectedCategory)}
        cohortProgress={cohortProgress} onBack={() => setSelectedCategory(null)} />
    );
  }

  const byCategory = {};
  problems.forEach(p => { byCategory[p.category] = byCategory[p.category] || { total: 0, solved: 0 }; byCategory[p.category].total++; });
  const solvedUnion = new Set();
  cohortProgress.forEach(row => Object.keys(row.solvedProblems || {}).forEach(id => solvedUnion.add(id)));
  problems.forEach(p => { if (solvedUnion.has(p.id) && byCategory[p.category]) byCategory[p.category].solved++; });

  const totalSolvedAcrossCohort = cohortProgress.reduce((s, r) => s + Object.keys(r.solvedProblems || {}).length, 0);
  const avgPerStudent = students.length ? Math.round((totalSolvedAcrossCohort / students.length) * 10) / 10 : 0;

  const withSubmissions = problems.filter(p => (p.totalSubmissions || 0) > 0);
  const mostAttempted = [...withSubmissions].sort((a, b) => (b.totalSubmissions || 0) - (a.totalSubmissions || 0)).slice(0, 5);
  const hardest = [...withSubmissions].sort((a, b) => (a.acceptedSubmissions / a.totalSubmissions) - (b.acceptedSubmissions / b.totalSubmissions)).slice(0, 5);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-mono tracking-widest" style={{ color: CAMPUS.inkFaint }}>{problems.length} PROBLEMS - {students.length} APPROVED STUDENTS</p>
        <button onClick={() => setView("preview")} className="flex items-center gap-1.5 text-[11.5px] font-semibold px-3 py-1.5 rounded-lg"
          style={{ color: CAMPUS.teal, border: `1px solid ${CAMPUS.teal}50`, background: CAMPUS.tealTint }}>
          <Eye size={12} /> preview / hide problems
        </button>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <CampusCard className="p-4 text-center"><p className="text-lg font-bold" style={{ color: CAMPUS.teal }}>{avgPerStudent}</p><p className="text-[10px] font-mono tracking-wider mt-1" style={{ color: CAMPUS.inkFaint }}>AVG SOLVED / STUDENT</p></CampusCard>
        <CampusCard className="p-4 text-center"><p className="text-lg font-bold" style={{ color: CAMPUS.good }}>{solvedUnion.size}</p><p className="text-[10px] font-mono tracking-wider mt-1" style={{ color: CAMPUS.inkFaint }}>DISTINCT PROBLEMS SOLVED BY COHORT</p></CampusCard>
        <CampusCard className="p-4 text-center"><p className="text-lg font-bold" style={{ color: CAMPUS.purple }}>{totalSolvedAcrossCohort}</p><p className="text-[10px] font-mono tracking-wider mt-1" style={{ color: CAMPUS.inkFaint }}>TOTAL SOLVES (COHORT)</p></CampusCard>
      </div>

      <div>
        <p className="text-[9px] font-mono tracking-widest mb-2" style={{ color: CAMPUS.inkFaint }}>TOPIC-WISE COHORT COMPLETION - CLICK A TOPIC FOR FULL ANALYTICS</p>
        <div className="space-y-2">
          {Object.entries(byCategory).sort((a, b) => b[1].total - a[1].total).map(([cat, c]) => (
            <button key={cat} onClick={() => setSelectedCategory(cat)} className="w-full flex items-center gap-3 group">
              <span className="text-[11.5px] w-32 flex-shrink-0 truncate text-left group-hover:underline" style={{ color: CAMPUS.inkSoft }}>{cat}</span>
              <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: CAMPUS.line }}>
                <div className="h-full rounded-full" style={{ width: `${Math.round((c.solved / c.total) * 100)}%`, background: CAMPUS.teal }} />
              </div>
              <span className="text-[10.5px] font-mono w-16 text-right" style={{ color: CAMPUS.inkFaint }}>{c.solved}/{c.total}</span>
              <ChevronRight size={12} style={{ color: CAMPUS.inkFaint }} />
            </button>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <p className="text-[9px] font-mono tracking-widest mb-2" style={{ color: CAMPUS.inkFaint }}>MOST ATTEMPTED (PLATFORM-WIDE)</p>
          <div className="space-y-1.5">
            {mostAttempted.map(p => (
              <div key={p.id} className="flex items-center justify-between text-[12px] px-3 py-2 rounded-lg" style={{ border: `1px solid ${CAMPUS.line}` }}>
                <span className="truncate" style={{ color: CAMPUS.ink }}>{p.number}. {p.title}</span>
                <span className="font-mono flex-shrink-0 ml-2" style={{ color: CAMPUS.inkFaint }}>{p.totalSubmissions}</span>
              </div>
            ))}
            {mostAttempted.length === 0 && <p className="text-[11px]" style={{ color: CAMPUS.inkFaint }}>No submissions recorded yet.</p>}
          </div>
        </div>
        <div>
          <p className="text-[9px] font-mono tracking-widest mb-2" style={{ color: CAMPUS.inkFaint }}>HARDEST (LOWEST ACCEPTANCE, PLATFORM-WIDE)</p>
          <div className="space-y-1.5">
            {hardest.map(p => (
              <div key={p.id} className="flex items-center justify-between text-[12px] px-3 py-2 rounded-lg" style={{ border: `1px solid ${CAMPUS.line}` }}>
                <span className="truncate" style={{ color: CAMPUS.ink }}>{p.number}. {p.title}</span>
                <span className="font-mono flex-shrink-0 ml-2" style={{ color: CAMPUS.bad }}>{Math.round((p.acceptedSubmissions / p.totalSubmissions) * 100)}%</span>
              </div>
            ))}
            {hardest.length === 0 && <p className="text-[11px]" style={{ color: CAMPUS.inkFaint }}>No submissions recorded yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

// Per-topic drill-down: every problem in the topic, how many of THIS
// institution's approved students solved it, and (on click) exactly who -
// the two things the aggregate topic bar on the main analytics screen
// can't show.
function TopicAnalytics({ category, problems, cohortProgress, onBack }) {
  const [expanded, setExpanded] = useState(null);
  const sorted = [...problems].sort((a, b) => (a.number || 0) - (b.number || 0));

  return (
    <div>
      <CampusBackButton onClick={onBack} label="Back to Practice & DSA analytics" />
      <p className="text-[11px] font-mono tracking-widest mb-3" style={{ color: CAMPUS.inkFaint }}>{category.toUpperCase()} - {problems.length} PROBLEMS</p>
      <div className="space-y-2">
        {sorted.map(p => {
          const solvers = cohortProgress.filter(s => s.solvedProblems?.[p.id]);
          const isOpen = expanded === p.id;
          return (
            <CampusCard key={p.id} className="overflow-hidden">
              <button onClick={() => setExpanded(isOpen ? null : p.id)} className="w-full flex items-center gap-3 p-3.5 text-left">
                <span className="text-[13px] font-medium flex-1 truncate" style={{ color: CAMPUS.ink }}>{p.number}. {p.title}</span>
                <CampusChip color={{ Easy: CAMPUS.good, Medium: CAMPUS.warn, Hard: CAMPUS.bad }[p.difficulty] || CAMPUS.good}>{p.difficulty}</CampusChip>
                <span className="font-mono text-[12px] flex-shrink-0" style={{ color: solvers.length ? CAMPUS.good : CAMPUS.inkFaint }}>{solvers.length} solved</span>
                <ChevronRight size={13} style={{ color: CAMPUS.inkFaint, transform: isOpen ? "rotate(90deg)" : "none", transition: "transform 0.15s" }} />
              </button>
              {isOpen && (
                <div className="px-3.5 pb-3.5" style={{ borderTop: `1px solid ${CAMPUS.line}` }}>
                  {solvers.length === 0 ? (
                    <p className="text-[11.5px] pt-3" style={{ color: CAMPUS.inkFaint }}>No approved student has solved this yet.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5 pt-3">
                      {solvers.map(s => (
                        <span key={s.uid} className="text-[11px] px-2.5 py-1 rounded-lg" style={{ background: CAMPUS.goodTint, color: CAMPUS.good }}>
                          {s.label}{s.rollNumber ? ` (${s.rollNumber})` : ""}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CampusCard>
          );
        })}
      </div>
    </div>
  );
}

// ---------------- Company Vault preview ----------------

function ManageCompanyPrepPreview({ institutionId }) {
  const [screen, setScreen] = useState({ view: "list" });
  const [visibility, setVisibility] = useState({ hiddenCompanyIds: [] });

  useEffect(() => {
    fetchContentVisibility(institutionId).then(setVisibility).catch(() => {});
  }, [institutionId]);

  const hiddenIds = useMemo(() => new Set(visibility.hiddenCompanyIds || []), [visibility]);
  const toggleHidden = async (companyId, hidden) => {
    setVisibility(v => ({ ...v, hiddenCompanyIds: hidden ? [...(v.hiddenCompanyIds || []), companyId] : (v.hiddenCompanyIds || []).filter(id => id !== companyId) }));
    await setCompanyHidden(institutionId, companyId, hidden);
  };

  return (
    <div>
      <p className="text-[11px] font-mono tracking-widest mb-3" style={{ color: CAMPUS.inkFaint }}>PREVIEW - HIDE/UNHIDE COMPANIES FOR THIS INSTITUTION'S STUDENTS</p>
      <CampusCompanyPrepFlow screen={screen} setScreen={setScreen} adminMode hiddenIds={hiddenIds} onToggleHidden={toggleHidden} />
    </div>
  );
}

// Campus Contest Studio entry point - a Campus admin owns the whole contest
// lifecycle here (create -> questions -> preview -> publish -> dashboard)
// with no separate DeVert-admin approval step anywhere in this flow. Replaces
// the old flat-form InstitutionContestsPanel (superseded, retired) entirely.
function CampusContestsTab({ institutionId }) {
  const [view, setView] = useState({ mode: "list" });
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetchInstitutionContests(institutionId).then(setContests).catch(console.error).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [institutionId]);

  if (view.mode === "studio") {
    return (
      <CampusContestStudio institutionId={institutionId} contestId={view.contestId}
        onCancel={() => { setView({ mode: "list" }); load(); }}
        onDone={(id) => { setView({ mode: "dashboard", contestId: id }); load(); }} />
    );
  }
  if (view.mode === "dashboard") {
    return (
      <CampusContestDashboard contestId={view.contestId}
        onBack={() => { setView({ mode: "list" }); load(); }}
        onEdit={(id) => setView({ mode: "studio", contestId: id })}
        onDuplicated={(id) => setView({ mode: "studio", contestId: id })} />
    );
  }
  if (view.mode === "bank") {
    return (
      <div>
        <button onClick={() => setView({ mode: "list" })} className="text-[12.5px] mb-4" style={{ color: CAMPUS.inkFaint }}>← back to contests</button>
        <CampusQuestionBank institutionId={institutionId} />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-lg font-semibold" style={{ color: CAMPUS.ink }}>Contests</h2>
        <div className="flex gap-2">
          <CampusButton variant="secondary" icon={BookOpen} onClick={() => setView({ mode: "bank" })}>
            Question Bank
          </CampusButton>
          <CampusButton icon={Plus} onClick={() => setView({ mode: "studio", contestId: null })}>
            Create Contest
          </CampusButton>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[0, 1].map(i => (
            <CampusCard key={i} className="p-4 flex items-center gap-3">
              <CampusSkeleton variant="rect" width={36} height={36} />
              <div className="flex-1 space-y-2">
                <CampusSkeleton variant="text" width="45%" />
                <CampusSkeleton variant="text" width="25%" />
              </div>
            </CampusCard>
          ))}
        </div>
      ) : contests.length === 0 ? (
        <CampusEmptyState icon={Trophy} title="No contests yet"
          description="Create your first contest - it publishes instantly, no approval needed."
          action={<CampusButton icon={Plus} onClick={() => setView({ mode: "studio", contestId: null })}>Create Contest</CampusButton>} />
      ) : (
        <div className="space-y-2">
          {contests.map(c => {
            const phase = contestPhase(c);
            return (
              <button key={c.id} onClick={() => setView({ mode: c.status === "draft" ? "studio" : "dashboard", contestId: c.id })}
                className="block w-full text-left">
                <CampusCard hover className="p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: CAMPUS.purpleTint, color: CAMPUS.purple }}>
                    <Trophy size={15} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <b className="block text-[13.5px] truncate" style={{ color: CAMPUS.ink }}>{c.title}</b>
                    <span className="text-[11px]" style={{ color: CAMPUS.inkFaint }}>{c.questionCount || 0} questions · {c.participantCount || 0} registered</span>
                  </div>
                  <CampusChip color={c.status === "published" ? (phase === "live" ? CAMPUS.good : CAMPUS.teal) : c.status === "archived" ? CAMPUS.bad : CAMPUS.warn}>
                    {c.status === "draft" ? "DRAFT" : c.status === "archived" ? "ARCHIVED" : phase.toUpperCase()}
                  </CampusChip>
                </CampusCard>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Simple, no-library CSV parser - good enough for the flat rollNumber/department/
// year/section shape this needs. Assumes a header row; doesn't handle quoted
// commas - fine for a roster export, not a general-purpose CSV parser.
function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
  return lines.slice(1).map(line => {
    const cells = line.split(",").map(c => c.trim());
    const row = {};
    headers.forEach((h, i) => { row[h] = cells[i] || ""; });
    return row;
  }).filter(r => r.rollnumber || r.rollNumber);
}

// Bulk-assign CSV template - matches the columns handleCsv/parseCsv expect
// (rollNumber/department/year/section), with one example row so admins know
// the expected format without guessing at it from the bulk-assign result text.
// department/year must be one of DEPARTMENTS/YEARS (lib/institutions.js) or
// handleCsv now rejects the row client-side before it ever reaches
// firestore.rules' own enum check on the students/{uid} create/update path.
function downloadBulkAssignTemplate() {
  const csv = [
    "rollNumber,department,year,section",
    "21CS001,CSE,III Year,A",
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "bulk-assign-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

// "2h 34m" style waiting duration, and the exact requested date/time - so an
// admin working the pending queue immediately knows how long a request has
// sat there, not just when it arrived.
function formatWaitingTime(requestedAt) {
  if (!requestedAt?.toDate) return "-";
  const totalMin = Math.max(0, Math.floor((Date.now() - requestedAt.toDate().getTime()) / 60000));
  const days = Math.floor(totalMin / 1440);
  const hours = Math.floor((totalMin % 1440) / 60);
  const mins = totalMin % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}
function formatRequestedAt(requestedAt) {
  if (!requestedAt?.toDate) return "-";
  const d = requestedAt.toDate();
  return {
    date: d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" }),
    time: d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
  };
}

// Roster export - same client-side Blob-download pattern as
// exportRegistrationsCsv (app/admin/page.jsx, campus-contest-dashboard.jsx),
// extended with the identity/academic columns a TPC actually wants in a
// roster report.
function exportRosterCsv(students, institutionName) {
  const header = "name,rollNumber,department,year,section,status,requestedAt";
  const rows = students.map(s => {
    const requestedAt = s.requestedAt?.toDate ? s.requestedAt.toDate().toISOString() : "";
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    return [s.name, s.rollNumber, s.department, s.year, s.section, s.status, requestedAt].map(esc).join(",");
  });
  const csv = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `${(institutionName || "campus").replace(/\s+/g, "-").toLowerCase()}-roster.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// Classrooms is a sub-view of Students, not its own MANAGE_TABS entry - per
// CLAUDE.md, the admin console extends existing tabs rather than growing a
// new top-level surface.
function StudentsViewToggle({ studentsView, setStudentsView }) {
  const options = [
    { key: "requests", label: "Requests & Roster" },
    { key: "classrooms", label: "Classrooms" },
  ];
  return (
    <div className="flex gap-1.5 mb-4">
      {options.map(o => (
        <button key={o.key} onClick={() => setStudentsView(o.key)}
          className="text-[12px] font-semibold px-3 py-3 rounded-lg transition-colors"
          style={{
            background: studentsView === o.key ? CAMPUS.tealTint : "transparent",
            color: studentsView === o.key ? CAMPUS.teal : CAMPUS.inkFaint,
          }}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

function ManageStudents({ institutionId, institution }) {
  const { user } = useAuth();
  const [studentsView, setStudentsView] = useState("requests"); // "requests" | "classrooms"
  const [pending, setPending] = useState([]);
  const [approved, setApproved] = useState([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState({});
  const [error, setError] = useState("");
  const [rejecting, setRejecting] = useState(null); // uid currently showing the reason field
  const [reason, setReason] = useState("");
  const [csvResult, setCsvResult] = useState(null);
  const [csvBusy, setCsvBusy] = useState(false);
  const fileRef = useRef(null);

  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [pendingDeptFilter, setPendingDeptFilter] = useState("all");
  const [pendingYearFilter, setPendingYearFilter] = useState("all");
  const [pendingSectionFilter, setPendingSectionFilter] = useState("all");
  const [editingUid, setEditingUid] = useState(null);
  const [editName, setEditName] = useState("");
  const [editRoll, setEditRoll] = useState("");
  const [editDept, setEditDept] = useState("");
  const [editYear, setEditYear] = useState("");
  const [editSection, setEditSection] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [historyUid, setHistoryUid] = useState(null);
  const [moreMenuUid, setMoreMenuUid] = useState(null);
  const [removingUid, setRemovingUid] = useState(null);
  // Just the uid, not the row object - the displayed student is always
  // re-derived from `approved` below, so actions taken inside the dashboard
  // (suspend, restrict, identity edit) reflect immediately on the next
  // `load()` instead of showing a stale snapshot from the moment the row
  // was clicked. If the student gets removed from the institution, they
  // disappear from `approved` and the dashboard naturally falls back to the
  // roster list - no special-case handling needed.
  const [viewingStudentUid, setViewingStudentUid] = useState(null);

  const [selectedUids, setSelectedUids] = useState(new Set());
  const [composing, setComposing] = useState(false);
  const [annTitle, setAnnTitle] = useState("");
  const [annMessage, setAnnMessage] = useState("");
  const [annScheduleFor, setAnnScheduleFor] = useState(""); // datetime-local string, blank = immediately
  const [annDuration, setAnnDuration] = useState("");       // "", "1", "3", "7", "30" (days), or "custom"
  const [annCustomExpiry, setAnnCustomExpiry] = useState(""); // datetime-local string, only used when annDuration === "custom"
  const [annSending, setAnnSending] = useState(false);
  const [annSent, setAnnSent] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(true);
  const [deletingAnnId, setDeletingAnnId] = useState(null);

  const load = () => {
    setLoading(true);
    Promise.all([fetchPendingStudents(institutionId), fetchRosterStudents(institutionId)])
      .then(([p, a]) => { setPending(p); setApproved(a); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [institutionId]);

  const loadAnnouncements = () => {
    setAnnouncementsLoading(true);
    fetchAnnouncements(institutionId)
      .then(setAnnouncements)
      .catch(console.error)
      .finally(() => setAnnouncementsLoading(false));
  };
  useEffect(() => { loadAnnouncements(); }, [institutionId]);

  const departments = useMemo(() => [...new Set(approved.map(s => s.department).filter(Boolean))], [approved]);
  const years = useMemo(() => [...new Set(approved.map(s => s.year).filter(Boolean))], [approved]);

  const filteredApproved = useMemo(() => {
    const q = search.trim().toLowerCase();
    return approved.filter(s => {
      if (deptFilter !== "all" && s.department !== deptFilter) return false;
      if (yearFilter !== "all" && s.year !== yearFilter) return false;
      if (q && !(s.name || "").toLowerCase().includes(q) && !(s.rollNumber || "").toLowerCase().includes(q)) return false;
      return true;
    });
  }, [approved, search, deptFilter, yearFilter]);

  // Same derived-from-data filter pattern as the approved list above, just
  // applied to `pending` and with a Section filter added (neither list had
  // one before this).
  const pendingDepartments = useMemo(() => [...new Set(pending.map(s => s.department).filter(Boolean))], [pending]);
  const pendingYears = useMemo(() => [...new Set(pending.map(s => s.year).filter(Boolean))], [pending]);
  const pendingSections = useMemo(() => [...new Set(pending.map(s => s.section).filter(Boolean))].sort(), [pending]);

  const filteredPending = useMemo(() => {
    return pending.filter(s => {
      if (pendingDeptFilter !== "all" && s.department !== pendingDeptFilter) return false;
      if (pendingYearFilter !== "all" && s.year !== pendingYearFilter) return false;
      if (pendingSectionFilter !== "all" && s.section !== pendingSectionFilter) return false;
      return true;
    });
  }, [pending, pendingDeptFilter, pendingYearFilter, pendingSectionFilter]);

  const handleApprove = async (student) => {
    setError("");
    setWorking(p => ({ ...p, [student.uid]: true }));
    try {
      await approveStudent(institutionId, student.uid, {
        department: student.department, year: student.year, section: student.section,
      });
      setPending(p => p.filter(s => s.uid !== student.uid));
      load();
    } catch (e) {
      setError(e.message || "Failed to approve.");
    } finally {
      setWorking(p => ({ ...p, [student.uid]: false }));
    }
  };

  const startEdit = (s) => {
    setEditingUid(s.uid);
    setEditName(s.name || ""); setEditRoll(s.rollNumber || "");
    setEditDept(s.department || ""); setEditYear(s.year || ""); setEditSection(s.section || "");
  };

  const saveEdit = async (uid) => {
    setEditSaving(true);
    try {
      await updateStudentIdentity(institutionId, uid, {
        name: editName.trim(), rollNumber: editRoll.trim(),
        department: editDept.trim(), year: editYear.trim(), section: editSection.trim(),
      }, user?.uid);
      setEditingUid(null);
      load();
    } catch (e) {
      setError(e.message || "Failed to update identity.");
    } finally {
      setEditSaving(false);
    }
  };

  const handleToggleContestRestriction = async (s) => {
    setWorking(p => ({ ...p, [s.uid]: true }));
    try {
      await setContestRestriction(institutionId, s.uid, !s.contestRestricted);
      load();
    } catch (e) {
      setError(e.message || "Failed to update contest access.");
    } finally {
      setWorking(p => ({ ...p, [s.uid]: false }));
    }
  };

  const handleRemoveStudent = async (uid) => {
    setWorking(p => ({ ...p, [uid]: true }));
    try {
      await removeStudentFromInstitution(institutionId, uid);
      setRemovingUid(null);
      setMoreMenuUid(null);
      load();
    } catch (e) {
      setError(e.message || "Failed to remove student.");
    } finally {
      setWorking(p => ({ ...p, [uid]: false }));
    }
  };

  const handleToggleSuspend = async (s) => {
    setWorking(p => ({ ...p, [s.uid]: true }));
    try {
      if (s.status === "suspended") await approveStudent(institutionId, s.uid, { department: s.department, year: s.year, section: s.section });
      else await suspendStudent(institutionId, s.uid);
      load();
    } catch (e) {
      setError(e.message || "Failed to update account.");
    } finally {
      setWorking(p => ({ ...p, [s.uid]: false }));
    }
  };

  const confirmReject = async (student) => {
    setError("");
    setWorking(p => ({ ...p, [student.uid]: true }));
    try {
      await rejectStudent(institutionId, student.uid, reason);
      setPending(p => p.filter(s => s.uid !== student.uid));
      setRejecting(null);
      setReason("");
    } catch (e) {
      setError(e.message || "Failed to reject.");
    } finally {
      setWorking(p => ({ ...p, [student.uid]: false }));
    }
  };

  const toggleSelect = (uid) => {
    setSelectedUids(p => {
      const next = new Set(p);
      if (next.has(uid)) next.delete(uid); else next.add(uid);
      return next;
    });
  };

  // Duration -> expiresAt Date, computed from whichever "start" the
  // announcement actually has (the scheduled time if set, else now) - a
  // "3 day" announcement scheduled for tomorrow should expire 3 days after
  // it goes live, not 3 days from the moment it was authored.
  const computeExpiresAt = () => {
    if (annDuration === "custom") return annCustomExpiry ? new Date(annCustomExpiry) : null;
    if (!annDuration) return null;
    const start = annScheduleFor ? new Date(annScheduleFor) : new Date();
    return new Date(start.getTime() + Number(annDuration) * 24 * 60 * 60 * 1000);
  };

  const handleSendAnnouncement = async () => {
    setAnnSending(true);
    try {
      await sendAnnouncement(institutionId, {
        title: annTitle.trim(), message: annMessage.trim(), targetUids: [...selectedUids],
        scheduledFor: annScheduleFor ? new Date(annScheduleFor) : null,
        expiresAt: computeExpiresAt(),
      }, user?.uid);
      setAnnTitle(""); setAnnMessage(""); setSelectedUids(new Set()); setComposing(false);
      setAnnScheduleFor(""); setAnnDuration(""); setAnnCustomExpiry("");
      setAnnSent(true);
      loadAnnouncements();
      setTimeout(() => setAnnSent(false), 4000);
    } catch (e) {
      setError(e.message || "Failed to send announcement.");
    } finally {
      setAnnSending(false);
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    try {
      await deleteAnnouncement(institutionId, id);
      setDeletingAnnId(null);
      loadAnnouncements();
    } catch (e) {
      setError(e.message || "Failed to delete announcement.");
    }
  };

  const handleCsv = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvBusy(true);
    setCsvResult(null);
    setError("");
    try {
      const text = await file.text();
      const parsed = parseCsv(text).map(r => ({
        rollNumber: r.rollnumber, department: r.department, year: r.year, section: r.section,
      }));
      // Validated client-side against the same DEPARTMENTS/YEARS list
      // firestore.rules now enforces server-side - a row with a value the
      // rules would reject is skipped here with a clear count, instead of
      // silently failing (or worse, half-applying) once it hits the rules.
      const invalidRows = parsed.filter(r =>
        !DEPARTMENTS.includes(r.department) || !YEARS.includes(r.year) || !/^[A-Za-z]$/.test(r.section || ""));
      const rows = parsed.filter(r => !invalidRows.includes(r)).map(r => ({ ...r, section: r.section.toUpperCase() }));
      const result = await bulkAssignByRollNumber(institutionId, rows);
      setCsvResult({ ...result, total: parsed.length, invalid: invalidRows.length });
      load();
    } catch (err) {
      setError(err.message || "Failed to process CSV.");
    } finally {
      setCsvBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const viewingStudent = viewingStudentUid ? approved.find(a => a.uid === viewingStudentUid) : null;
  if (viewingStudent) {
    return (
      <StudentAnalyticsDashboard institutionId={institutionId} institution={institution} student={viewingStudent}
        onBack={() => setViewingStudentUid(null)} onChanged={load} />
    );
  }

  if (studentsView === "classrooms") {
    return (
      <div>
        <StudentsViewToggle studentsView={studentsView} setStudentsView={setStudentsView} />
        <CampusClassrooms institutionId={institutionId} institution={institution} />
      </div>
    );
  }

  return (
    <div>
      <StudentsViewToggle studentsView={studentsView} setStudentsView={setStudentsView} />
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h2 className="text-lg font-semibold" style={{ color: CAMPUS.ink }}>
          Pending join requests {!loading && <span style={{ color: CAMPUS.warn }}>({pending.length})</span>}
        </h2>
        <div className="flex items-center gap-2 flex-wrap">
          <button type="button" onClick={downloadBulkAssignTemplate}
            className="text-[12.5px] font-semibold px-3.5 py-2 rounded-lg cursor-pointer inline-flex items-center gap-1.5"
            style={{ background: CAMPUS.surface, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.inkSoft }}>
            <Download size={13} /> Download template
          </button>
          <label className="text-[12.5px] font-semibold px-3.5 py-2 rounded-lg cursor-pointer inline-flex items-center gap-1.5"
            style={{ background: CAMPUS.surface, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.ink }}>
            <Upload size={13} /> {csvBusy ? "Processing..." : "Bulk-assign via CSV"}
            <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleCsv} disabled={csvBusy} />
          </label>
        </div>
      </div>

      {error && (
        <p className="text-[12.5px] mb-4 px-3 py-2 rounded-lg" style={{ background: CAMPUS.badTint, color: CAMPUS.bad }}>{error}</p>
      )}

      {csvResult && (
        <p className="text-[12.5px] mb-4" style={{ color: CAMPUS.inkSoft }}>
          Matched {csvResult.matched} of {csvResult.total} rows to existing pending requests by roll number and approved them.
          {csvResult.matched < csvResult.total - csvResult.invalid && " Unmatched rows had no matching pending request - the student needs to request access first."}
          {csvResult.invalid > 0 && ` ${csvResult.invalid} row${csvResult.invalid === 1 ? "" : "s"} skipped - department/year/section didn't match the canonical lists.`}
        </p>
      )}

      {pending.length > 0 && (pendingDepartments.length > 0 || pendingYears.length > 0 || pendingSections.length > 0) && (
        <div className="flex gap-2 flex-wrap mb-4">
          {pendingDepartments.length > 0 && (
            <select value={pendingDeptFilter} onChange={e => setPendingDeptFilter(e.target.value)}
              className="text-[12.5px] px-3 py-2 rounded-lg outline-none"
              style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.ink }}>
              <option value="all">All departments</option>
              {pendingDepartments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          )}
          {pendingYears.length > 0 && (
            <select value={pendingYearFilter} onChange={e => setPendingYearFilter(e.target.value)}
              className="text-[12.5px] px-3 py-2 rounded-lg outline-none"
              style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.ink }}>
              <option value="all">All years</option>
              {pendingYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          )}
          {pendingSections.length > 0 && (
            <select value={pendingSectionFilter} onChange={e => setPendingSectionFilter(e.target.value)}
              className="text-[12.5px] px-3 py-2 rounded-lg outline-none"
              style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.ink }}>
              <option value="all">All sections</option>
              {pendingSections.map(sec => <option key={sec} value={sec}>Section {sec}</option>)}
            </select>
          )}
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[0, 1].map(i => (
            <CampusCard key={i} className="p-4">
              <CampusSkeleton variant="text" width="35%" className="mb-2" />
              <CampusSkeleton variant="text" width="55%" />
            </CampusCard>
          ))}
        </div>
      ) : pending.length === 0 ? (
        <CampusEmptyState size="sm" icon={Check} title="No pending requests" description="New join requests will show up here for approval." />
      ) : filteredPending.length === 0 ? (
        <CampusEmptyState size="sm" icon={Check} title="No requests match these filters" description="Try a different department, year, or section." />
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${CAMPUS.line}` }}>
          {filteredPending.map((s, i) => (
            <div key={s.uid} style={{ background: CAMPUS.surface, borderTop: i > 0 ? `1px solid ${CAMPUS.line}` : "none" }}>
              <div className="flex items-center gap-3 px-4 py-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <b className="block text-[13px]" style={{ color: CAMPUS.ink }}>{s.name || "(no name given)"}</b>
                  <span className="text-[11px] font-mono" style={{ color: CAMPUS.inkFaint }}>
                    {s.rollNumber} {s.department && `· ${s.department}`} {s.year && `· ${s.year}`} {s.section && `· Sec ${s.section}`}
                  </span>
                  <span className="block text-[10.5px] mt-0.5" style={{ color: CAMPUS.inkFaint }}>
                    Requested {formatRequestedAt(s.requestedAt).date} · {formatRequestedAt(s.requestedAt).time}
                    <b style={{ color: CAMPUS.warn }}> · Waiting {formatWaitingTime(s.requestedAt)}</b>
                  </span>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => { setRejecting(rejecting === s.uid ? null : s.uid); setReason(""); }} disabled={working[s.uid]}
                    className="text-[12px] font-semibold px-3 py-1.5 rounded-lg inline-flex items-center gap-1 disabled:opacity-50"
                    style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.inkSoft }}>
                    <X size={12} /> Reject
                  </button>
                  <button onClick={() => handleApprove(s)} disabled={working[s.uid]}
                    className="text-[12px] font-semibold px-3 py-1.5 rounded-lg inline-flex items-center gap-1 disabled:opacity-50"
                    style={{ background: CAMPUS.good, color: "#fff" }}>
                    <Check size={12} /> Approve
                  </button>
                </div>
              </div>
              {rejecting === s.uid && (
                <div className="px-4 pb-3 flex items-center gap-2">
                  <input value={reason} onChange={e => setReason(e.target.value)} placeholder="Reason (optional)" autoFocus
                    className="flex-1 text-[12.5px] px-3 py-1.5 rounded-lg outline-none"
                    style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.ink }} />
                  <button onClick={() => setRejecting(null)} className="text-[12px] font-semibold px-3 py-1.5 rounded-lg"
                    style={{ color: CAMPUS.inkFaint }}>
                    Cancel
                  </button>
                  <button onClick={() => confirmReject(s)} disabled={working[s.uid]}
                    className="text-[12px] font-semibold px-3 py-1.5 rounded-lg disabled:opacity-50"
                    style={{ background: CAMPUS.bad, color: "#fff" }}>
                    Confirm reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mb-4 mt-8 flex-wrap gap-3">
        <h2 className="text-lg font-semibold" style={{ color: CAMPUS.ink }}>
          Students {!loading && <span style={{ color: CAMPUS.inkFaint }}>({approved.length})</span>}
        </h2>
        <div className="flex gap-2">
          <CampusButton variant="secondary" size="sm" icon={Megaphone} onClick={() => setComposing(o => !o)}
            disabled={approved.length === 0}>
            {selectedUids.size > 0 ? `Message ${selectedUids.size} selected` : "Send announcement"}
          </CampusButton>
          <CampusButton variant="secondary" size="sm" icon={Download} onClick={() => exportRosterCsv(approved, institution?.name)}
            disabled={approved.length === 0}>
            Export roster CSV
          </CampusButton>
        </div>
      </div>

      {annSent && (
        <p className="text-[12.5px] mb-4 px-3 py-2 rounded-lg" style={{ background: CAMPUS.goodTint, color: CAMPUS.good }}>Announcement sent.</p>
      )}

      {composing && (
        <CampusCard className="p-4 mb-4 space-y-2.5">
          <p className="text-[12px]" style={{ color: CAMPUS.inkFaint }}>
            {selectedUids.size > 0 ? `Sending to ${selectedUids.size} selected student${selectedUids.size === 1 ? "" : "s"}.` : "No students selected - this will broadcast to every student in this campus."}
          </p>
          <input value={annTitle} onChange={e => setAnnTitle(e.target.value)} placeholder="Title"
            className="w-full text-[12.5px] px-3 py-1.5 rounded-lg outline-none"
            style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.ink }} />
          <textarea value={annMessage} onChange={e => setAnnMessage(e.target.value)} placeholder="Message" rows={3}
            className="w-full text-[12.5px] px-3 py-1.5 rounded-lg outline-none resize-none"
            style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.ink }} />
          <div className="flex gap-2 flex-wrap">
            <div className="flex-1 min-w-[180px]">
              <label className="block text-[10px] font-mono tracking-widest mb-1" style={{ color: CAMPUS.inkFaint }}>SCHEDULE FOR (optional)</label>
              <input type="datetime-local" value={annScheduleFor} onChange={e => setAnnScheduleFor(e.target.value)}
                className="w-full text-[12.5px] px-3 py-1.5 rounded-lg outline-none"
                style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.ink }} />
            </div>
            <div className="flex-1 min-w-[180px]">
              <label className="block text-[10px] font-mono tracking-widest mb-1" style={{ color: CAMPUS.inkFaint }}>DURATION</label>
              <select value={annDuration} onChange={e => setAnnDuration(e.target.value)}
                className="w-full text-[12.5px] px-3 py-1.5 rounded-lg outline-none"
                style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.ink }}>
                <option value="">No expiry</option>
                <option value="1">1 day</option>
                <option value="3">3 days</option>
                <option value="7">7 days</option>
                <option value="30">30 days</option>
                <option value="custom">Custom date...</option>
              </select>
            </div>
            {annDuration === "custom" && (
              <div className="flex-1 min-w-[180px]">
                <label className="block text-[10px] font-mono tracking-widest mb-1" style={{ color: CAMPUS.inkFaint }}>EXPIRES AT</label>
                <input type="datetime-local" value={annCustomExpiry} onChange={e => setAnnCustomExpiry(e.target.value)}
                  className="w-full text-[12.5px] px-3 py-1.5 rounded-lg outline-none"
                  style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.ink }} />
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={handleSendAnnouncement} disabled={annSending || !annTitle.trim() || !annMessage.trim()}
              className="text-[12px] font-semibold px-3 py-1.5 rounded-lg disabled:opacity-50" style={{ background: CAMPUS.ink, color: "#fff" }}>
              {annSending ? "Sending..." : annScheduleFor ? "Schedule" : "Send"}
            </button>
            <button onClick={() => setComposing(false)} className="text-[12px] font-semibold px-3 py-1.5 rounded-lg" style={{ color: CAMPUS.inkFaint }}>
              Cancel
            </button>
          </div>
        </CampusCard>
      )}

      {!announcementsLoading && announcements.length > 0 && (
        <CampusCard className="p-4 mb-6">
          <p className="text-[10px] font-mono tracking-widest mb-3 flex items-center gap-1.5" style={{ color: CAMPUS.inkFaint }}>
            <Megaphone size={11} /> ANNOUNCEMENTS ({announcements.length})
          </p>
          <div className="space-y-2">
            {announcements.map(a => {
              const status = announcementStatus(a);
              const statusColor = status === "active" ? CAMPUS.good : status === "scheduled" ? CAMPUS.warn : CAMPUS.inkFaint;
              return (
                <div key={a.id} className="py-2 first:pt-0" style={{ borderTop: `1px solid ${CAMPUS.line}` }}>
                  <div className="flex items-start gap-2 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <b className="text-[12.5px]" style={{ color: CAMPUS.ink }}>{a.title}</b>
                        <CampusChip color={statusColor}>{status.toUpperCase()}</CampusChip>
                        {a.targetUids?.length > 0 && <span className="text-[10.5px]" style={{ color: CAMPUS.inkFaint }}>{a.targetUids.length} student{a.targetUids.length === 1 ? "" : "s"}</span>}
                      </div>
                      <p className="text-[11.5px] mt-0.5" style={{ color: CAMPUS.inkSoft }}>{a.message}</p>
                      <p className="text-[10px] mt-1 flex items-center gap-1" style={{ color: CAMPUS.inkFaint }}>
                        <CalendarClock size={10} />
                        {a.scheduledFor?.toDate ? `Starts ${a.scheduledFor.toDate().toLocaleString()}` : "Immediate"}
                        {a.expiresAt?.toDate ? ` · Expires ${a.expiresAt.toDate().toLocaleString()}` : " · No expiry"}
                      </p>
                    </div>
                    {deletingAnnId === a.id ? (
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button onClick={() => handleDeleteAnnouncement(a.id)} className="text-[11px] font-semibold px-2.5 py-1 rounded-lg" style={{ background: CAMPUS.bad, color: "#fff" }}>Confirm</button>
                        <button onClick={() => setDeletingAnnId(null)} className="text-[11px] font-semibold px-2 py-1" style={{ color: CAMPUS.inkFaint }}>Cancel</button>
                      </div>
                    ) : (
                      <button onClick={() => setDeletingAnnId(a.id)} title="Delete announcement" className="flex-shrink-0" style={{ color: CAMPUS.inkFaint }}>
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CampusCard>
      )}

      <div className="flex gap-2 flex-wrap mb-4">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: CAMPUS.inkFaint }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or roll number..."
            className="w-full text-[12.5px] pl-8 pr-3 py-2 rounded-lg outline-none"
            style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.ink }} />
        </div>
        {departments.length > 0 && (
          <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
            className="text-[12.5px] px-3 py-2 rounded-lg outline-none"
            style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.ink }}>
            <option value="all">All departments</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        )}
        {years.length > 0 && (
          <select value={yearFilter} onChange={e => setYearFilter(e.target.value)}
            className="text-[12.5px] px-3 py-2 rounded-lg outline-none"
            style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.ink }}>
            <option value="all">All years</option>
            {years.map(y => <option key={y} value={y}>Year {y}</option>)}
          </select>
        )}
      </div>

      {loading ? null : approved.length === 0 ? (
        <CampusEmptyState size="sm" icon={Check} title="No students yet" description="Approved students will show up here." />
      ) : filteredApproved.length === 0 ? (
        <CampusEmptyState size="sm" icon={Search} title="No matches" description="No student matches your search or filters." />
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${CAMPUS.line}` }}>
          {filteredApproved.map((s, i) => (
            <div key={s.uid} style={{ background: CAMPUS.surface, borderTop: i > 0 ? `1px solid ${CAMPUS.line}` : "none" }}>
              {editingUid === s.uid ? (
                <div className="p-4 space-y-2.5">
                  <input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Full name"
                    className="w-full text-[12.5px] px-3 py-1.5 rounded-lg outline-none"
                    style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.ink }} />
                  <input value={editRoll} onChange={e => setEditRoll(e.target.value)} placeholder="Roll number"
                    className="w-full text-[12.5px] px-3 py-1.5 rounded-lg outline-none font-mono"
                    style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.ink }} />
                  <div className="flex gap-2">
                    <input value={editDept} onChange={e => setEditDept(e.target.value)} placeholder="Department"
                      className="flex-1 text-[12.5px] px-3 py-1.5 rounded-lg outline-none"
                      style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.ink }} />
                    <input value={editYear} onChange={e => setEditYear(e.target.value)} placeholder="Year"
                      className="w-24 text-[12.5px] px-3 py-1.5 rounded-lg outline-none"
                      style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.ink }} />
                    <input value={editSection} onChange={e => setEditSection(e.target.value)} placeholder="Section"
                      className="w-24 text-[12.5px] px-3 py-1.5 rounded-lg outline-none"
                      style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.ink }} />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => saveEdit(s.uid)} disabled={editSaving}
                      className="text-[12px] font-semibold px-3 py-1.5 rounded-lg disabled:opacity-50" style={{ background: CAMPUS.ink, color: "#fff" }}>
                      {editSaving ? "Saving..." : "Save"}
                    </button>
                    <button onClick={() => setEditingUid(null)} className="text-[12px] font-semibold px-3 py-1.5 rounded-lg" style={{ color: CAMPUS.inkFaint }}>
                      Cancel
                    </button>
                  </div>
                  <p className="text-[10.5px]" style={{ color: CAMPUS.inkFaint }}>
                    Edits are logged in this student&apos;s identity audit history.
                  </p>
                </div>
              ) : (
                <div onClick={() => setViewingStudentUid(s.uid)} className="flex items-center gap-3 px-4 py-3 flex-wrap cursor-pointer">
                  <input type="checkbox" checked={selectedUids.has(s.uid)} onChange={() => toggleSelect(s.uid)}
                    onClick={(e) => e.stopPropagation()}
                    className="flex-shrink-0" style={{ accentColor: CAMPUS.teal }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <b className="text-[13px]" style={{ color: CAMPUS.ink }}>{s.name || "(no name)"}</b>
                      {s.status === "suspended" && <CampusChip color={CAMPUS.bad}>SUSPENDED</CampusChip>}
                      {s.contestRestricted && <CampusChip color={CAMPUS.warn}>CONTEST RESTRICTED</CampusChip>}
                    </div>
                    <span className="text-[11px] font-mono" style={{ color: CAMPUS.inkFaint }}>
                      {s.rollNumber} {s.department && `· ${s.department}`} {s.year && `· Year ${s.year}`} {s.section && `· Sec ${s.section}`}
                    </span>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); setMoreMenuUid(moreMenuUid === s.uid ? null : s.uid); setRemovingUid(null); }}
                    title="More options" className="flex-shrink-0" style={{ color: CAMPUS.inkFaint }}>
                    <MoreVertical size={16} />
                  </button>
                </div>
              )}
              {moreMenuUid === s.uid && (
                <div className="px-4 pb-3">
                  <div className="rounded-lg" style={{ border: `1px solid ${CAMPUS.line}`, background: CAMPUS.surface }}>
                    <div className="px-3 py-2.5 flex items-center gap-2" style={{ borderBottom: `1px solid ${CAMPUS.line}` }}>
                      <Mail size={12} style={{ color: CAMPUS.inkFaint }} />
                      <span className="text-[12px] font-mono" style={{ color: CAMPUS.inkSoft }}>{s.email || "(no email on file)"}</span>
                    </div>

                    {removingUid === s.uid ? (
                      <div className="p-3 space-y-2" style={{ background: CAMPUS.badTint }}>
                        <p className="text-[12px]" style={{ color: CAMPUS.bad }}>
                          Permanently remove {s.name || "this student"} from {institution?.name}? Their roster record is deleted
                          (not just suspended) and their roll number becomes claimable again. To rejoin, they'll have to submit a
                          brand new request that your Training &amp; Placement Cell reviews - they are never re-added automatically.
                          Their DeVert account, XP and coins are untouched.
                        </p>
                        <div className="flex gap-2">
                          <button onClick={() => handleRemoveStudent(s.uid)} disabled={working[s.uid]}
                            className="text-[12px] font-semibold px-3 py-1.5 rounded-lg disabled:opacity-50" style={{ background: CAMPUS.bad, color: "#fff" }}>
                            {working[s.uid] ? "Removing..." : "Confirm removal"}
                          </button>
                          <button onClick={() => setRemovingUid(null)} className="text-[12px] font-semibold px-3 py-1.5 rounded-lg" style={{ color: CAMPUS.inkFaint }}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <button onClick={() => { startEdit(s); setMoreMenuUid(null); }}
                          className="w-full text-left text-[12.5px] font-semibold px-3 py-2.5 flex items-center gap-2" style={{ color: CAMPUS.ink }}>
                          <Pencil size={13} /> Edit name, roll number, dept/year/section
                        </button>
                        {s.identityAuditLog?.length > 0 && (
                          <button onClick={() => { setHistoryUid(historyUid === s.uid ? null : s.uid); setMoreMenuUid(null); }}
                            className="w-full text-left text-[12.5px] font-semibold px-3 py-2.5 flex items-center gap-2" style={{ color: CAMPUS.ink, borderTop: `1px solid ${CAMPUS.line}` }}>
                            <History size={13} /> View identity edit history
                          </button>
                        )}
                        <button onClick={() => handleToggleSuspend(s)} disabled={working[s.uid]}
                          className="w-full text-left text-[12.5px] font-semibold px-3 py-2.5 flex items-center gap-2 disabled:opacity-50"
                          style={{ color: s.status === "suspended" ? CAMPUS.good : CAMPUS.bad, borderTop: `1px solid ${CAMPUS.line}` }}>
                          {s.status === "suspended" ? <UserCheck size={13} /> : <UserX size={13} />}
                          {s.status === "suspended" ? "Reactivate (un-suspend)" : "Suspend from institution"}
                        </button>
                        <button onClick={() => handleToggleContestRestriction(s)} disabled={working[s.uid]}
                          className="w-full text-left text-[12.5px] font-semibold px-3 py-2.5 flex items-center gap-2 disabled:opacity-50"
                          style={{ color: s.contestRestricted ? CAMPUS.good : CAMPUS.warn, borderTop: `1px solid ${CAMPUS.line}` }}>
                          <Ban size={13} /> {s.contestRestricted ? "Lift contest restriction" : "Restrict from contests"}
                        </button>
                        <button onClick={() => setRemovingUid(s.uid)}
                          className="w-full text-left text-[12.5px] font-semibold px-3 py-2.5 flex items-center gap-2"
                          style={{ color: CAMPUS.bad, borderTop: `1px solid ${CAMPUS.line}` }}>
                          <UserMinus size={13} /> Remove from institution
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
              {historyUid === s.uid && s.identityAuditLog?.length > 0 && (
                <div className="px-4 pb-3 space-y-1.5">
                  {s.identityAuditLog.slice().reverse().map((entry, ei) => (
                    <p key={ei} className="text-[10.5px] font-mono" style={{ color: CAMPUS.inkFaint }}>
                      {entry.field}: &quot;{entry.oldValue}&quot; → &quot;{entry.newValue}&quot; · {new Date(entry.editedAt).toLocaleString()}
                    </p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
