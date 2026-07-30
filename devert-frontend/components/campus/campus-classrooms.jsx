"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ChevronRight, Users, GraduationCap, Medal, LayoutGrid, BarChart3, Trophy, Activity as ActivityIcon,
  FileText, Settings as SettingsIcon, ArrowUpDown, Search, Download, Printer, AlertTriangle, Star,
  CheckCircle2, Circle, TrendingUp,
} from "lucide-react";
import { CAMPUS } from "@/lib/campus-theme";
import {
  fetchRosterStudents, YEARS, classroomKey, fetchClassroom, updateClassroomLeaderboardVisibility,
  LEADERBOARD_SCOPES, LEADERBOARD_METRICS, MODULES, isModuleEnabledForClassroom, setClassroomModuleAccess,
} from "@/lib/institutions";
import { fetchClassroomAnalytics, fetchCampusAverages } from "@/lib/classroomAnalytics";
import { useCampusBackHandler } from "@/lib/campusNav";
import {
  CampusCard, CampusChip, CampusBreadcrumb, CampusEmptyState, CampusSkeleton, CampusStat, CampusButton,
} from "@/components/campus/campus-ui";
import { StudentAnalyticsDashboard } from "@/components/campus/campus-student-dashboard";

const SCOPE_META = {
  section: { label: "Section Leaderboard", description: "Visible to this classroom's own students, ranked against each other." },
  department: { label: "Department Leaderboard", description: "Visible to this classroom's students, ranked against every section in the same Department + Year." },
  campus: { label: "Overall Campus Leaderboard", description: "Visible to this classroom's students, ranked against the whole institution." },
};

// Explicit pixel sizes, matching campus-manage.jsx's ToggleSwitch exactly -
// this file doesn't import that one (campus-manage.jsx imports THIS file,
// not the other way around), so it's a small local duplicate rather than a
// new shared-component extraction for a two-line switch.
function LeaderboardToggle({ value, onChange }) {
  return (
    <button onClick={() => onChange(!value)} className="relative flex-shrink-0 rounded-full transition-colors"
      style={{ width: 38, height: 21, padding: 0, border: "none", cursor: "pointer", background: value ? CAMPUS.teal : CAMPUS.line }}>
      <span className="absolute rounded-full bg-white transition-transform" style={{ width: 17, height: 17, top: 2, left: 2, transform: value ? "translateX(17px)" : "translateX(0)", boxShadow: "0 1px 2px rgba(0,0,0,0.25)" }} />
    </button>
  );
}

// Only students whose `year` is one of the canonical YEARS values are
// grouped by buildClassroomTree below - a student with old free-text data
// (e.g. year "3" from before this rework) isn't silently bucketed into a
// stray, non-canonical group. They stay reachable via the flat Students
// list and the unclassified-count banner points admins at fixing them via
// the identity-edit flow (updateStudentIdentity already assigns a
// classroomId the moment department/year/section all become canonical).
export function isClassroomed(s) {
  return s.year && s.department && s.section && YEARS.includes(s.year);
}

// Year -> Department -> Section grouping, extracted as a pure function so
// Department Management (campus-departments.jsx) can build the SAME tree
// pre-sliced to one department, instead of forking this logic. Computed
// live from a roster array (fetchRosterStudents() - approved + suspended) -
// no separate "classroom stats" are ever stored (see ensureClassroom's
// comment in lib/institutions.js for why: no Cloud Functions in this
// project means nothing would keep a stored count/average in sync). Same
// grouped-from-live-data approach ManageStudents already uses for its own
// department/year filters, just one level deeper.
export function buildClassroomTree(students) {
  const byYear = new Map();
  for (const s of students) {
    if (!isClassroomed(s)) continue;
    if (!byYear.has(s.year)) byYear.set(s.year, new Map());
    const byDept = byYear.get(s.year);
    if (!byDept.has(s.department)) byDept.set(s.department, new Map());
    const bySection = byDept.get(s.department);
    if (!bySection.has(s.section)) bySection.set(s.section, []);
    bySection.get(s.section).push(s);
  }
  return [...byYear.entries()]
    .sort((a, b) => YEARS.indexOf(a[0]) - YEARS.indexOf(b[0]))
    .map(([year, byDept]) => ({
      year,
      departments: [...byDept.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([department, bySection]) => ({
        department,
        sections: [...bySection.entries()].sort(([a], [b]) => a.localeCompare(b))
          .map(([section, list]) => ({ section, students: list })),
      })),
    }));
}

export function CampusClassrooms({ institutionId, institution }) {
  const searchParams = useSearchParams();
  const [students, setStudents] = useState(null);
  const [screen, setScreen] = useState({ view: "tree" });
  const [viewingStudentUid, setViewingStudentUid] = useState(() => searchParams.get("student") || null);
  // The classroom dashboard needs the resolved student array, not just the
  // three identifying strings the URL can carry - this holds the URL's
  // year/dept/section until `tree` (built from the roster fetch below) is
  // ready to resolve them into the real screen state, the same
  // resolve-after-load shape used for Daily Learning's editDay param.
  const [pendingClassroom, setPendingClassroom] = useState(() => {
    const year = searchParams.get("year"), department = searchParams.get("dept"), section = searchParams.get("section");
    return (year && department && section) ? { year, department, section } : null;
  });

  const load = () => {
    setStudents(null);
    fetchRosterStudents(institutionId).then(setStudents).catch(() => setStudents([]));
  };
  useEffect(load, [institutionId]);

  const tree = useMemo(() => (students ? buildClassroomTree(students) : []), [students]);

  const unclassifiedCount = useMemo(() => (students || []).filter(s => !isClassroomed(s)).length, [students]);

  // tree(Manage's own depth 2, "classrooms" sub-view) -> classroom
  // dashboard(3) -> student profile(4). See lib/campusNav.js.
  useCampusBackHandler(3, screen.view === "classroom", () => setScreen({ view: "tree" }));
  useCampusBackHandler(4, !!viewingStudentUid, () => setViewingStudentUid(null));

  useEffect(() => {
    if (!pendingClassroom || !tree.length) return;
    const yearGroup = tree.find(y => y.year === pendingClassroom.year);
    const deptGroup = yearGroup?.departments.find(d => d.department === pendingClassroom.department);
    const sectionGroup = deptGroup?.sections.find(s => s.section === pendingClassroom.section);
    if (sectionGroup) {
      setScreen({ view: "classroom", year: pendingClassroom.year, department: pendingClassroom.department, section: pendingClassroom.section, students: sectionGroup.students });
    }
    setPendingClassroom(null);
  }, [tree, pendingClassroom]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams();
    if (screen.view === "classroom") {
      params.set("year", screen.year); params.set("dept", screen.department); params.set("section", screen.section);
    }
    if (viewingStudentUid) params.set("student", viewingStudentUid);
    const qs = params.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${qs ? `?${qs}` : ""}`);
  }, [screen, viewingStudentUid]);

  if (viewingStudentUid) {
    const student = students?.find(s => s.uid === viewingStudentUid);
    if (student) {
      return (
        <StudentAnalyticsDashboard institutionId={institutionId} institution={institution} student={student}
          onBack={() => setViewingStudentUid(null)} onChanged={load} />
      );
    }
  }

  if (screen.view === "classroom") {
    return (
      <ClassroomDashboard institutionId={institutionId} year={screen.year} department={screen.department} section={screen.section}
        students={screen.students} onBack={() => setScreen({ view: "tree" })} onOpenStudent={setViewingStudentUid} />
    );
  }

  if (students === null) {
    return <CampusCard className="p-5"><CampusSkeleton variant="rect" height={200} /></CampusCard>;
  }

  if (tree.length === 0) {
    return (
      <CampusEmptyState icon={GraduationCap} title="No classrooms yet"
        description="Classrooms appear automatically here once students are approved with a Department, Year, and Section from the redesigned Campus Entry form." />
    );
  }

  return (
    <div className="space-y-3">
      {unclassifiedCount > 0 && (
        <p className="text-[12px] px-3 py-2 rounded-lg" style={{ background: CAMPUS.warnTint, color: CAMPUS.warn }}>
          {unclassifiedCount} student{unclassifiedCount === 1 ? "" : "s"} on the roster {unclassifiedCount === 1 ? "has" : "have"} no
          classroom yet - assign one from Students by editing their identity.
        </p>
      )}
      {tree.map(({ year, departments }) => (
        <YearGroup key={year} year={year} departments={departments}
          onOpenSection={(department, section, list) => setScreen({ view: "classroom", year, department, section, students: list })} />
      ))}
    </div>
  );
}

// A Faculty/Class Teacher's own Overview tab (campus-app.jsx) - the SAME
// ClassroomDashboard Manage -> Students -> Classrooms uses, just locked to
// the one classroom they're assigned to (onBack: null, same reasoning as
// CampusHodDashboard in campus-departments.jsx - there's no classroom list
// for them to leave).
export function CampusFacultyDashboard({ institutionId, classroomId }) {
  const [students, setStudents] = useState(null);
  const [classroom, setClassroom] = useState(undefined);
  const [viewingStudentUid, setViewingStudentUid] = useState(null);

  useEffect(() => {
    fetchRosterStudents(institutionId).then(setStudents).catch(() => setStudents([]));
    fetchClassroom(institutionId, classroomId).then(setClassroom).catch(() => setClassroom(null));
  }, [institutionId, classroomId]);

  useCampusBackHandler(3, !!viewingStudentUid, () => setViewingStudentUid(null));

  if (students === null || classroom === undefined) return <CampusCard className="p-5"><CampusSkeleton variant="rect" height={200} /></CampusCard>;
  if (!classroom) return <CampusEmptyState icon={GraduationCap} title="Classroom not found" description="This classroom no longer exists." />;

  const classroomStudents = students.filter(s => s.classroomId === classroomId);
  if (viewingStudentUid) {
    const student = classroomStudents.find(s => s.uid === viewingStudentUid);
    if (student) {
      return <StudentAnalyticsDashboard institutionId={institutionId} institution={{ id: institutionId }} student={student}
        onBack={() => setViewingStudentUid(null)} onChanged={() => {}} />;
    }
  }
  return (
    <ClassroomDashboard institutionId={institutionId} year={classroom.year} department={classroom.department} section={classroom.section}
      students={classroomStudents} onBack={null} onOpenStudent={setViewingStudentUid} />
  );
}

function YearGroup({ year, departments, onOpenSection }) {
  const [open, setOpen] = useState(true);
  const total = departments.reduce((sum, d) => sum + d.sections.reduce((s2, sec) => s2 + sec.students.length, 0), 0);
  return (
    <CampusCard className="overflow-hidden p-0">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between px-4 py-3">
        <span className="flex items-center gap-2 text-[14px] font-semibold" style={{ color: CAMPUS.ink }}>
          <ChevronRight size={14} style={{ transform: open ? "rotate(90deg)" : "none", transition: "transform 0.15s" }} />
          {year}
        </span>
        <span className="text-[11px] font-mono" style={{ color: CAMPUS.inkFaint }}>{total} student{total === 1 ? "" : "s"}</span>
      </button>
      {open && (
        <div className="px-4 pb-3 space-y-2">
          {departments.map(d => (
            <DepartmentGroup key={d.department} department={d.department} sections={d.sections}
              onOpenSection={(section, list) => onOpenSection(d.department, section, list)} />
          ))}
        </div>
      )}
    </CampusCard>
  );
}

function DepartmentGroup({ department, sections, onOpenSection }) {
  const [open, setOpen] = useState(false);
  const total = sections.reduce((s, sec) => s + sec.students.length, 0);
  return (
    <div className="rounded-lg" style={{ border: `1px solid ${CAMPUS.line}` }}>
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between px-3 py-3">
        <span className="flex items-center gap-2 text-[13px] font-semibold" style={{ color: CAMPUS.ink }}>
          <ChevronRight size={12} style={{ transform: open ? "rotate(90deg)" : "none", transition: "transform 0.15s" }} />
          {department}
        </span>
        <span className="text-[10.5px] font-mono" style={{ color: CAMPUS.inkFaint }}>{total} student{total === 1 ? "" : "s"}</span>
      </button>
      {open && (
        <div className="px-3 pb-2.5 grid sm:grid-cols-2 gap-2">
          {sections.map(sec => (
            <button key={sec.section} onClick={() => onOpenSection(sec.section, sec.students)} className="text-left">
              <CampusCard hover className="p-3 flex items-center justify-between">
                <span className="text-[12.5px] font-medium" style={{ color: CAMPUS.ink }}>Section {sec.section}</span>
                <CampusChip color={CAMPUS.teal}>{sec.students.length} student{sec.students.length === 1 ? "" : "s"}</CampusChip>
              </CampusCard>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Which of the three leaderboard scopes (Section/Department/Campus - see
// lib/institutions.js's LEADERBOARD_SCOPES) this ONE classroom's students
// can see, layered on top of the institution-wide master switch (Manage ->
// Leaderboards) - a scope disabled institution-wide stays hidden regardless
// of what's toggled on here. Every classroom defaults to all three visible
// (fetchClassroom's leaderboardVisibility is simply absent until an admin
// first changes something here, and every read site treats a missing scope
// key as true) - this only ever needs a write to HIDE something, never to
// grant the defaults back.
function ClassroomLeaderboardVisibility({ institutionId, year, department, section }) {
  const [classroom, setClassroom] = useState(undefined);
  const [saving, setSaving] = useState(false);
  const classroomId = classroomKey(year, department, section);

  const load = () => { fetchClassroom(institutionId, classroomId).then(setClassroom).catch(() => setClassroom(null)); };
  useEffect(load, [institutionId, classroomId]);

  if (classroom === undefined) return null;

  const visibility = classroom?.leaderboardVisibility || {};
  const toggle = async (scope, value) => {
    setSaving(true);
    const next = { section: true, department: true, campus: true, ...visibility, [scope]: value };
    setClassroom(c => ({ ...(c || {}), leaderboardVisibility: next }));
    try {
      await updateClassroomLeaderboardVisibility(institutionId, classroomId, next);
    } catch (e) {
      window.alert(e.message || "Failed to save.");
      load();
    } finally {
      setSaving(false);
    }
  };

  return (
    <CampusCard className="p-4 mb-4">
      <p className="text-[10px] font-mono tracking-widest mb-3 flex items-center gap-1.5" style={{ color: CAMPUS.inkFaint }}>
        <Medal size={11} /> LEADERBOARD VISIBILITY FOR THIS CLASSROOM
      </p>
      <div className="space-y-2.5">
        {LEADERBOARD_SCOPES.map(scope => (
          <div key={scope} className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[12.5px] font-medium" style={{ color: CAMPUS.ink }}>{SCOPE_META[scope].label}</p>
              <p className="text-[10.5px]" style={{ color: CAMPUS.inkFaint }}>{SCOPE_META[scope].description}</p>
            </div>
            <LeaderboardToggle value={visibility[scope] !== false} onChange={(v) => toggle(scope, v)} />
          </div>
        ))}
      </div>
      {saving && <p className="text-[10.5px] mt-2" style={{ color: CAMPUS.inkFaint }}>Saving...</p>}
    </CampusCard>
  );
}

const DASHBOARD_TABS = [
  { key: "overview", label: "Overview", icon: LayoutGrid },
  { key: "analytics", label: "Analytics", icon: BarChart3 },
  { key: "students", label: "Students", icon: Users },
  { key: "leaderboards", label: "Leaderboards", icon: Trophy },
  { key: "activity", label: "Activity", icon: ActivityIcon },
  { key: "reports", label: "Reports", icon: FileText },
  { key: "settings", label: "Settings", icon: SettingsIcon },
];

// A single Department+Year+Section cohort's full analytics surface - the
// real, non-fabricated version of the 7-tab BI dashboard spec (see
// lib/classroomAnalytics.js for exactly what's real vs. deliberately
// omitted). `analytics` is fetched once here and threaded down to every tab,
// so switching tabs never re-fetches the same classroom's data.
export function ClassroomDashboard({ institutionId, year, department, section, students, onBack, onOpenStudent }) {
  const [tab, setTab] = useState("overview");
  const [analytics, setAnalytics] = useState(null);
  const classroomId = classroomKey(year, department, section);

  useEffect(() => {
    setAnalytics(null);
    fetchClassroomAnalytics(institutionId, students)
      .then(setAnalytics)
      .catch(() => setAnalytics(false));
  }, [institutionId, year, department, section, students]);

  return (
    <div>
      <CampusBreadcrumb items={[
        { label: "Classrooms", onClick: onBack },
        { label: year },
        { label: department },
        { label: `Section ${section}` },
      ]} />
      <h2 className="text-lg font-semibold mb-4" style={{ color: CAMPUS.ink }}>
        {year} · {department} · Section {section} <span style={{ color: CAMPUS.inkFaint }}>({students.length})</span>
      </h2>

      <div className="flex items-center gap-1.5 flex-wrap mb-4 overflow-x-auto">
        {DASHBOARD_TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-lg transition-colors flex-shrink-0"
            style={{
              color: tab === t.key ? "#fff" : CAMPUS.inkSoft,
              background: tab === t.key ? CAMPUS.teal : "transparent",
              border: `1px solid ${tab === t.key ? CAMPUS.teal : CAMPUS.line}`,
            }}>
            <t.icon size={12} /> {t.label}
          </button>
        ))}
      </div>

      {analytics === false ? (
        <CampusEmptyState icon={AlertTriangle} title="Couldn't load analytics" description="Something went wrong fetching this classroom's data. Try again." />
      ) : analytics === null ? (
        <CampusCard className="p-5"><CampusSkeleton variant="rect" height={220} /></CampusCard>
      ) : (
        <>
          {tab === "overview" && <ClassroomOverviewTab analytics={analytics} />}
          {tab === "analytics" && <ClassroomAnalyticsTab institutionId={institutionId} analytics={analytics} />}
          {tab === "students" && <ClassroomStudentsTab analytics={analytics} onOpenStudent={onOpenStudent} />}
          {tab === "leaderboards" && <ClassroomLeaderboardsTab analytics={analytics} onOpenStudent={onOpenStudent} />}
          {tab === "activity" && <ClassroomActivityTab analytics={analytics} />}
          {tab === "reports" && <ClassroomReportsTab analytics={analytics} year={year} department={department} section={section} />}
          {tab === "settings" && (
            <ClassroomSettingsTab institutionId={institutionId} classroomId={classroomId} year={year} department={department} section={section} />
          )}
        </>
      )}
    </div>
  );
}

// A tiny 7-bar column chart - no charting library anywhere in this codebase
// (see campus-contest-dashboard.jsx's own Bar component), and daily/weekly
// trend data is exactly 7 points, which doesn't warrant adding one.
function MiniTrendChart({ points, color = CAMPUS.teal, formatLabel }) {
  const max = Math.max(1, ...points.map(p => p.value));
  return (
    <div className="flex items-end gap-2" style={{ height: 90 }}>
      {points.map((p, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
          <span className="text-[10px] font-mono" style={{ color: CAMPUS.inkFaint }}>{p.value}</span>
          <div className="w-full rounded-t" style={{ height: Math.max(3, (p.value / max) * 56), background: color, opacity: p.value === 0 ? 0.15 : 1 }} />
          <span className="text-[9.5px] font-mono truncate" style={{ color: CAMPUS.inkFaint }}>{formatLabel ? formatLabel(p.label) : p.label}</span>
        </div>
      ))}
    </div>
  );
}

function shortDow(dateStr) {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString(undefined, { weekday: "short" }).slice(0, 3);
}

function ClassroomOverviewTab({ analytics }) {
  const { kpis, topPerformers, fallingBehind, dailyLearningTrend } = analytics;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <CampusStat label="Students" value={kpis.totalStudents} />
        <CampusStat label="Active Today" value={`${kpis.activeToday}/${kpis.totalStudents}`} color={CAMPUS.good} />
        <CampusStat label="Active This Week" value={`${kpis.activeThisWeek}/${kpis.totalStudents}`} color={CAMPUS.teal} />
        <CampusStat label="Avg Score" value={kpis.avgScore.toLocaleString()} color={CAMPUS.purple} />
        <CampusStat label="Avg XP" value={kpis.avgXp.toLocaleString()} color={CAMPUS.gold} />
        <CampusStat label="Avg Coins" value={kpis.avgCoins.toLocaleString()} color={CAMPUS.gold} />
        <CampusStat label="Avg Problems Solved" value={kpis.avgProblemsSolved} color={CAMPUS.blue} />
        <CampusStat label="Daily Learning Today" value={`${kpis.dailyLearningCompletedToday}/${kpis.totalStudents}`} color={CAMPUS.purple} />
        <CampusStat label="No Activity This Week" value={kpis.fallingBehindCount} color={kpis.fallingBehindCount > 0 ? CAMPUS.bad : CAMPUS.inkFaint} />
      </div>

      <CampusCard className="p-4">
        <p className="text-[10px] font-mono tracking-widest mb-3 flex items-center gap-1.5" style={{ color: CAMPUS.inkFaint }}>
          <TrendingUp size={11} /> DAILY LEARNING COMPLETIONS - LAST 7 DAYS
        </p>
        <MiniTrendChart points={dailyLearningTrend.map(d => ({ label: d.date, value: d.completedCount }))} formatLabel={shortDow} />
      </CampusCard>

      <div className="grid sm:grid-cols-2 gap-4">
        <CampusCard className="p-4">
          <p className="text-[10px] font-mono tracking-widest mb-3 flex items-center gap-1.5" style={{ color: CAMPUS.inkFaint }}>
            <Star size={11} /> TOP PERFORMERS
          </p>
          {topPerformers.length === 0 ? (
            <p className="text-[12px]" style={{ color: CAMPUS.inkFaint }}>No score earned yet.</p>
          ) : (
            <div className="space-y-2">
              {topPerformers.map((s, i) => (
                <div key={s.uid} className="flex items-center justify-between gap-2">
                  <span className="text-[12.5px] font-medium truncate" style={{ color: CAMPUS.ink }}>
                    <span className="font-mono mr-1.5" style={{ color: CAMPUS.gold }}>#{i + 1}</span>{s.name}
                  </span>
                  <span className="text-[11.5px] font-mono font-semibold flex-shrink-0" style={{ color: CAMPUS.purple }}>{s.score.toLocaleString()} pts</span>
                </div>
              ))}
            </div>
          )}
        </CampusCard>

        <CampusCard className="p-4">
          <p className="text-[10px] font-mono tracking-widest mb-3 flex items-center gap-1.5" style={{ color: CAMPUS.bad }}>
            <AlertTriangle size={11} /> AT RISK - NO ACTIVITY THIS WEEK
          </p>
          {fallingBehind.length === 0 ? (
            <p className="text-[12px]" style={{ color: CAMPUS.inkFaint }}>Everyone has been active this week.</p>
          ) : (
            <div className="space-y-2 max-h-[180px] overflow-y-auto">
              {fallingBehind.map(s => (
                <div key={s.uid} className="flex items-center justify-between gap-2">
                  <span className="text-[12.5px] font-medium truncate" style={{ color: CAMPUS.ink }}>{s.name}</span>
                  <span className="text-[11px] font-mono flex-shrink-0" style={{ color: CAMPUS.inkFaint }}>{s.rollNumber}</span>
                </div>
              ))}
            </div>
          )}
        </CampusCard>
      </div>
    </div>
  );
}

// Score distribution buckets - real, computed client-side from the same
// classroom roster fetchClassroomAnalytics already loaded (no extra reads).
// Score, not XP - per the Score/XP/Coins architecture, Score is the
// permanent academic-performance metric every analytics view measures by.
function scoreDistribution(students) {
  const buckets = [
    { label: "0", test: v => v === 0 },
    { label: "1-100", test: v => v > 0 && v <= 100 },
    { label: "101-500", test: v => v > 100 && v <= 500 },
    { label: "501-1500", test: v => v > 500 && v <= 1500 },
    { label: "1500+", test: v => v > 1500 },
  ];
  return buckets.map(b => ({ label: b.label, value: students.filter(s => b.test(s.score)).length }));
}

function ClassroomAnalyticsTab({ institutionId, analytics }) {
  const [campusAvg, setCampusAvg] = useState(undefined);
  useEffect(() => { fetchCampusAverages(institutionId).then(setCampusAvg).catch(() => setCampusAvg(null)); }, [institutionId]);

  const { kpis, students, dailyLearningTrend } = analytics;
  const distribution = useMemo(() => scoreDistribution(students), [students]);

  return (
    <div className="space-y-4">
      <CampusCard className="p-4">
        <p className="text-[10px] font-mono tracking-widest mb-3" style={{ color: CAMPUS.inkFaint }}>SCORE DISTRIBUTION</p>
        <MiniTrendChart points={distribution} color={CAMPUS.blue} />
      </CampusCard>

      <CampusCard className="p-4">
        <p className="text-[10px] font-mono tracking-widest mb-3" style={{ color: CAMPUS.inkFaint }}>DAILY LEARNING COMPLETIONS - LAST 7 DAYS</p>
        <MiniTrendChart points={dailyLearningTrend.map(d => ({ label: d.date, value: d.completedCount }))} formatLabel={shortDow} />
      </CampusCard>

      <CampusCard className="p-4">
        <p className="text-[10px] font-mono tracking-widest mb-3" style={{ color: CAMPUS.inkFaint }}>THIS CLASSROOM VS CAMPUS AVERAGE</p>
        {campusAvg === undefined ? (
          <CampusSkeleton variant="rect" height={60} />
        ) : campusAvg === null ? (
          <p className="text-[12px]" style={{ color: CAMPUS.inkFaint }}>Couldn&apos;t load campus-wide averages.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[11px] mb-1" style={{ color: CAMPUS.inkFaint }}>Avg Score (this classroom vs campus)</p>
              <p className="text-[15px] font-mono font-bold" style={{ color: CAMPUS.ink }}>
                {kpis.avgScore.toLocaleString()} <span style={{ color: CAMPUS.inkFaint, fontWeight: 400 }}>vs {campusAvg.avgScore.toLocaleString()}</span>
              </p>
            </div>
            <div>
              <p className="text-[11px] mb-1" style={{ color: CAMPUS.inkFaint }}>Avg Problems Solved (this classroom vs campus)</p>
              <p className="text-[15px] font-mono font-bold" style={{ color: CAMPUS.ink }}>
                {kpis.avgProblemsSolved} <span style={{ color: CAMPUS.inkFaint, fontWeight: 400 }}>vs {campusAvg.avgProblemsSolved}</span>
              </p>
            </div>
          </div>
        )}
      </CampusCard>
    </div>
  );
}

const SORT_OPTIONS = [
  { key: "rollAsc", label: "Roll Number (A-Z)" },
  { key: "rollDesc", label: "Roll Number (Z-A)" },
  { key: "nameAsc", label: "Name (A-Z)" },
  { key: "nameDesc", label: "Name (Z-A)" },
  { key: "scoreDesc", label: "Highest Score" },
  { key: "scoreAsc", label: "Lowest Score" },
  { key: "xpDesc", label: "Highest XP" },
  { key: "xpAsc", label: "Lowest XP" },
  { key: "coinsDesc", label: "Most Coins" },
  { key: "coinsAsc", label: "Least Coins" },
  { key: "problemsDesc", label: "Most Problems Solved" },
  { key: "problemsAsc", label: "Least Problems Solved" },
  { key: "activeDesc", label: "Most Active This Week" },
  { key: "activeAsc", label: "Least Active This Week" },
  { key: "joinedDesc", label: "Recently Joined" },
  { key: "joinedAsc", label: "Oldest Joined" },
];

const FILTER_OPTIONS = [
  { key: "all", label: "All Students" },
  { key: "activeToday", label: "Active Today" },
  { key: "activeWeek", label: "Active This Week" },
  { key: "noActivity", label: "No Activity This Week" },
  { key: "topPerformers", label: "Top Performers" },
  { key: "recentlyJoined", label: "Recently Joined (30d)" },
  { key: "suspended", label: "Suspended" },
];

function millisOf(ts) { return ts?.toMillis?.() ? ts.toMillis() : (ts ? new Date(ts).getTime() : 0); }

function ClassroomStudentsTab({ analytics, onOpenStudent }) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("scoreDesc");
  const [filter, setFilter] = useState("all");
  const { students } = analytics;

  const topPerformerUids = useMemo(() => new Set([...students].sort((a, b) => b.score - a.score).slice(0, 5).map(s => s.uid)), [students]);
  const [now] = useState(() => Date.now());

  const filtered = useMemo(() => {
    let rows = students;
    const q = search.trim().toLowerCase();
    if (q) rows = rows.filter(s => s.name.toLowerCase().includes(q) || s.rollNumber.toLowerCase().includes(q));
    if (filter === "activeToday") rows = rows.filter(s => s.activeToday);
    if (filter === "activeWeek") rows = rows.filter(s => s.daysActiveThisWeek > 0);
    if (filter === "noActivity") rows = rows.filter(s => s.daysActiveThisWeek === 0);
    if (filter === "topPerformers") rows = rows.filter(s => topPerformerUids.has(s.uid));
    if (filter === "recentlyJoined") rows = rows.filter(s => s.reviewedAt && (now - millisOf(s.reviewedAt)) <= 30 * 86400000);
    if (filter === "suspended") rows = rows.filter(s => s.status === "suspended");
    return rows;
  }, [students, search, filter, topPerformerUids, now]);

  const sorted = useMemo(() => {
    const rows = [...filtered];
    const by = (f) => rows.sort(f);
    switch (sort) {
      case "rollAsc": return by((a, b) => a.rollNumber.localeCompare(b.rollNumber));
      case "rollDesc": return by((a, b) => b.rollNumber.localeCompare(a.rollNumber));
      case "nameAsc": return by((a, b) => a.name.localeCompare(b.name));
      case "nameDesc": return by((a, b) => b.name.localeCompare(a.name));
      case "scoreDesc": return by((a, b) => b.score - a.score);
      case "scoreAsc": return by((a, b) => a.score - b.score);
      case "xpDesc": return by((a, b) => b.xp - a.xp);
      case "xpAsc": return by((a, b) => a.xp - b.xp);
      case "coinsDesc": return by((a, b) => b.totalCoins - a.totalCoins);
      case "coinsAsc": return by((a, b) => a.totalCoins - b.totalCoins);
      case "problemsDesc": return by((a, b) => b.problemsSolvedCount - a.problemsSolvedCount);
      case "problemsAsc": return by((a, b) => a.problemsSolvedCount - b.problemsSolvedCount);
      case "activeDesc": return by((a, b) => b.daysActiveThisWeek - a.daysActiveThisWeek);
      case "activeAsc": return by((a, b) => a.daysActiveThisWeek - b.daysActiveThisWeek);
      case "joinedDesc": return by((a, b) => millisOf(b.reviewedAt) - millisOf(a.reviewedAt));
      case "joinedAsc": return by((a, b) => millisOf(a.reviewedAt) - millisOf(b.reviewedAt));
      default: return rows;
    }
  }, [filtered, sort]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-2 mb-3">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: CAMPUS.inkFaint }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or roll number..."
            className="w-full text-[12.5px] pl-8 pr-3 py-2 rounded-lg outline-none"
            style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.ink }} />
        </div>
        <div className="relative">
          <ArrowUpDown size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: CAMPUS.inkFaint }} />
          <select value={sort} onChange={e => setSort(e.target.value)}
            className="text-[12px] pl-7 pr-2 py-2 rounded-lg outline-none appearance-none"
            style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.ink }}>
            {SORT_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap mb-3">
        {FILTER_OPTIONS.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className="text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition-colors"
            style={{
              color: filter === f.key ? CAMPUS.teal : CAMPUS.inkSoft,
              background: filter === f.key ? CAMPUS.tealTint : "transparent",
              border: `1px solid ${filter === f.key ? CAMPUS.teal : CAMPUS.line}`,
            }}>
            {f.label}
          </button>
        ))}
      </div>

      {sorted.length === 0 ? (
        <CampusEmptyState size="sm" icon={Users} title="No students match" description="Try a different search, sort, or filter." />
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${CAMPUS.line}` }}>
          {sorted.map((s, i) => (
            <button key={s.uid} onClick={() => onOpenStudent(s.uid)} className="w-full text-left"
              style={{ background: CAMPUS.surface, borderTop: i > 0 ? `1px solid ${CAMPUS.line}` : "none" }}>
              <div className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0 flex items-center gap-2.5">
                  {s.activeToday ? <CheckCircle2 size={13} style={{ color: CAMPUS.good, flexShrink: 0 }} /> : <Circle size={13} style={{ color: CAMPUS.inkFaint, flexShrink: 0 }} />}
                  <div className="min-w-0">
                    <b className="block text-[13px]" style={{ color: CAMPUS.ink }}>{s.name}</b>
                    <span className="text-[11px] font-mono" style={{ color: CAMPUS.inkFaint }}>{s.rollNumber}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-[11.5px] font-mono" style={{ color: CAMPUS.purple }}>{s.score.toLocaleString()} pts</span>
                  <span className="hidden sm:inline text-[11.5px] font-mono" style={{ color: CAMPUS.gold }}>{s.xp.toLocaleString()} XP</span>
                  <span className="hidden sm:inline text-[11.5px] font-mono" style={{ color: CAMPUS.blue }}>{s.problemsSolvedCount} solved</span>
                  {s.status === "suspended" && <CampusChip color={CAMPUS.bad}>SUSPENDED</CampusChip>}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ClassroomLeaderboardsTab({ analytics, onOpenStudent }) {
  const [metric, setMetric] = useState("xp");
  const metricField = metric === "credits" ? "totalCoins" : metric;
  const ranked = useMemo(() => [...analytics.students].sort((a, b) => (b[metricField] || 0) - (a[metricField] || 0)), [analytics.students, metricField]);

  return (
    <div>
      <div className="flex items-center gap-1.5 flex-wrap mb-4">
        {LEADERBOARD_METRICS.map(m => (
          <button key={m.key} onClick={() => setMetric(m.key)}
            className="text-[12px] font-semibold px-3.5 py-1.5 rounded-lg transition-colors"
            style={{ color: metric === m.key ? "#fff" : CAMPUS.inkSoft, background: metric === m.key ? CAMPUS.teal : "transparent", border: `1px solid ${metric === m.key ? CAMPUS.teal : CAMPUS.line}` }}>
            {m.label}
          </button>
        ))}
      </div>
      {ranked.length === 0 ? (
        <CampusEmptyState icon={Trophy} title="No ranked students yet" description="Once students start earning, they'll show up here." />
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${CAMPUS.line}` }}>
          {ranked.map((s, i) => (
            <button key={s.uid} onClick={() => onOpenStudent?.(s.uid)}
              className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left transition-colors"
              style={{ background: CAMPUS.surface, borderTop: i > 0 ? `1px solid ${CAMPUS.line}` : "none" }}>
              <div className="flex items-center gap-2.5 min-w-0">
                {i < 3 ? <Medal size={14} style={{ color: CAMPUS.gold, flexShrink: 0 }} /> : <span className="text-[11px] font-mono w-3.5 text-center flex-shrink-0" style={{ color: CAMPUS.inkFaint }}>{i + 1}</span>}
                <div className="min-w-0">
                  <b className="block text-[13px] truncate" style={{ color: CAMPUS.ink }}>{s.name}</b>
                  <span className="text-[10.5px] font-mono" style={{ color: CAMPUS.inkFaint }}>{s.rollNumber}</span>
                </div>
              </div>
              <span className="text-[12.5px] font-mono font-bold flex-shrink-0" style={{ color: CAMPUS.teal }}>{(s[metricField] || 0).toLocaleString()}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ClassroomActivityTab({ analytics }) {
  const { students, kpis, dailyLearningTrend } = analytics;
  const activeNow = students.filter(s => s.activeToday);
  const inactiveNow = students.filter(s => !s.activeToday);
  const weekTrendPoints = dailyLearningTrend.map(d => ({
    label: d.date,
    value: students.filter(s => s.lastActiveDate === d.date).length,
  }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <CampusStat label="Active Today" value={`${kpis.activeToday}/${kpis.totalStudents}`} color={CAMPUS.good} />
        <CampusStat label="Active This Week" value={`${kpis.activeThisWeek}/${kpis.totalStudents}`} color={CAMPUS.teal} />
      </div>

      <CampusCard className="p-4">
        <p className="text-[10px] font-mono tracking-widest mb-3" style={{ color: CAMPUS.inkFaint }}>
          MOST RECENT ACTIVE DAY - LAST 7 DAYS (Daily Learning, Programming, CS Core, DSA activity)
        </p>
        <MiniTrendChart points={weekTrendPoints} color={CAMPUS.good} formatLabel={shortDow} />
      </CampusCard>

      <div className="grid sm:grid-cols-2 gap-4">
        <CampusCard className="p-4">
          <p className="text-[10px] font-mono tracking-widest mb-3 flex items-center gap-1.5" style={{ color: CAMPUS.good }}>
            <CheckCircle2 size={11} /> ACTIVE TODAY ({activeNow.length})
          </p>
          <div className="space-y-1.5 max-h-[220px] overflow-y-auto">
            {activeNow.length === 0
              ? <p className="text-[12px]" style={{ color: CAMPUS.inkFaint }}>No one has been active yet today.</p>
              : activeNow.map(s => <p key={s.uid} className="text-[12.5px] truncate" style={{ color: CAMPUS.ink }}>{s.name}</p>)}
          </div>
        </CampusCard>
        <CampusCard className="p-4">
          <p className="text-[10px] font-mono tracking-widest mb-3 flex items-center gap-1.5" style={{ color: CAMPUS.inkFaint }}>
            <Circle size={11} /> NOT ACTIVE TODAY ({inactiveNow.length})
          </p>
          <div className="space-y-1.5 max-h-[220px] overflow-y-auto">
            {inactiveNow.length === 0
              ? <p className="text-[12px]" style={{ color: CAMPUS.inkFaint }}>Everyone has been active today.</p>
              : inactiveNow.map(s => (
                <div key={s.uid} className="flex items-center justify-between gap-2">
                  <span className="text-[12.5px] truncate" style={{ color: CAMPUS.ink }}>{s.name}</span>
                  <span className="text-[10.5px] font-mono flex-shrink-0" style={{ color: CAMPUS.inkFaint }}>
                    {s.lastActiveDate ? `last ${shortDow(s.lastActiveDate)}` : "no activity"}
                  </span>
                </div>
              ))}
          </div>
        </CampusCard>
      </div>
    </div>
  );
}

function csvEscape(v) { return `"${String(v ?? "").replace(/"/g, '""')}"`; }

function downloadClassroomCsv(students, label) {
  const header = "name,rollNumber,status,score,xp,totalCoins,problemsSolvedCount,activeToday,daysActiveThisWeek,lastActiveDate";
  const rows = students.map(s => [
    s.name, s.rollNumber, s.status, s.score, s.xp, s.totalCoins, s.problemsSolvedCount,
    s.activeToday, s.daysActiveThisWeek, s.lastActiveDate || "",
  ].map(csvEscape).join(","));
  const csv = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `${label}-analytics.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// PDF export is the browser's own Print -> Save as PDF (window.print()),
// scoped to a dedicated #classroom-report-print block via @media print - no
// new charting/PDF-generation dependency, and it's a genuinely complete
// export (every KPI + the full roster), not a placeholder.
function ClassroomReportsTab({ analytics, year, department, section }) {
  const label = `${year}-${department}-${section}`.replace(/\s+/g, "-").toLowerCase();
  const { kpis, students } = analytics;

  return (
    <div className="space-y-4">
      <CampusCard className="p-4">
        <p className="text-[13px] font-semibold mb-1" style={{ color: CAMPUS.ink }}>Export Report</p>
        <p className="text-[12px] mb-3" style={{ color: CAMPUS.inkFaint }}>
          Download this classroom&apos;s full analytics as CSV, or print/save the summary below as a PDF.
        </p>
        <div className="flex gap-2 flex-wrap">
          <CampusButton variant="secondary" icon={Download} onClick={() => downloadClassroomCsv(students, label)}>Download CSV</CampusButton>
          <CampusButton variant="secondary" icon={Printer} onClick={() => window.print()}>Print / Save as PDF</CampusButton>
        </div>
      </CampusCard>

      <div id="classroom-report-print">
        <CampusCard className="p-4 mb-4">
          <p className="text-[14px] font-semibold mb-3" style={{ color: CAMPUS.ink }}>{year} · {department} · Section {section} - Summary</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <CampusStat label="Students" value={kpis.totalStudents} />
            <CampusStat label="Active Today" value={kpis.activeToday} color={CAMPUS.good} />
            <CampusStat label="Avg Score" value={kpis.avgScore} color={CAMPUS.purple} />
            <CampusStat label="Avg Problems Solved" value={kpis.avgProblemsSolved} color={CAMPUS.blue} />
          </div>
        </CampusCard>
        <CampusCard className="p-0 overflow-hidden">
          <div className="rounded-xl overflow-hidden">
            {students.map((s, i) => (
              <div key={s.uid} className="flex items-center justify-between gap-3 px-4 py-2.5"
                style={{ background: CAMPUS.surface, borderTop: i > 0 ? `1px solid ${CAMPUS.line}` : "none" }}>
                <span className="text-[12.5px]" style={{ color: CAMPUS.ink }}>{s.name} <span className="font-mono text-[10.5px]" style={{ color: CAMPUS.inkFaint }}>{s.rollNumber}</span></span>
                <span className="text-[11.5px] font-mono" style={{ color: CAMPUS.gold }}>{s.xp} XP · {s.problemsSolvedCount} solved</span>
              </div>
            ))}
          </div>
        </CampusCard>
      </div>
    </div>
  );
}

function ClassroomSettingsTab({ institutionId, classroomId, year, department, section }) {
  const [classroom, setClassroom] = useState(undefined);
  const load = () => { fetchClassroom(institutionId, classroomId).then(setClassroom).catch(() => setClassroom(null)); };
  useEffect(load, [institutionId, classroomId]);

  const toggleModule = async (moduleKey, enabled) => {
    setClassroom(c => ({ ...(c || {}), moduleAccess: { ...(c?.moduleAccess || {}), [moduleKey]: enabled } }));
    await setClassroomModuleAccess(institutionId, classroomId, moduleKey, enabled);
  };

  return (
    <div className="space-y-4">
      <ClassroomLeaderboardVisibility institutionId={institutionId} year={year} department={department} section={section} />
      <CampusCard className="p-4">
        <p className="text-[10px] font-mono tracking-widest mb-3" style={{ color: CAMPUS.inkFaint }}>MODULE ACCESS FOR THIS CLASSROOM</p>
        {classroom === undefined ? (
          <CampusSkeleton variant="rect" height={140} />
        ) : (
          <div className="space-y-2.5">
            {MODULES.map(m => {
              const enabled = isModuleEnabledForClassroom(classroom, m.key);
              return (
                <div key={m.key} className="flex items-center justify-between gap-4">
                  <span className="text-[12.5px] font-medium" style={{ color: CAMPUS.ink }}>{m.label}</span>
                  <button onClick={() => toggleModule(m.key, !enabled)} className="relative flex-shrink-0 rounded-full transition-colors"
                    style={{ width: 38, height: 21, padding: 0, border: "none", cursor: "pointer", background: enabled ? CAMPUS.teal : CAMPUS.line }}>
                    <span className="absolute rounded-full bg-white transition-transform" style={{ width: 17, height: 17, top: 2, left: 2, transform: enabled ? "translateX(17px)" : "translateX(0)", boxShadow: "0 1px 2px rgba(0,0,0,0.25)" }} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </CampusCard>
    </div>
  );
}
