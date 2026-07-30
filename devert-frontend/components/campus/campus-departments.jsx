"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Building2, Users, GraduationCap, Download, LayoutGrid, BarChart3,
  Settings as SettingsIcon, ChevronRight, Star, AlertTriangle, TrendingUp,
} from "lucide-react";
import { CAMPUS } from "@/lib/campus-theme";
import {
  fetchRosterStudents, fetchRosterStudentsByDepartment, fetchRoleAssignments, fetchDepartments, fetchDepartment, updateDepartment, departmentKey,
} from "@/lib/institutions";
import { fetchClassroomAnalytics, fetchCampusAverages } from "@/lib/classroomAnalytics";
import { useCampusBackHandler } from "@/lib/campusNav";
import {
  CampusCard, CampusChip, CampusBreadcrumb, CampusEmptyState, CampusSkeleton, CampusStat, CampusButton,
} from "@/components/campus/campus-ui";
import { buildClassroomTree, ClassroomDashboard } from "@/components/campus/campus-classrooms";
import { StudentAnalyticsDashboard } from "@/components/campus/campus-student-dashboard";
import { useHasPermission } from "@/lib/campusPermissions";

// Departments as real entities (not just a flat Year/Dept/Section filter -
// see ManageStudents' own department dropdown for that older, still-intact
// pattern). Reuses buildClassroomTree/ClassroomDashboard from
// campus-classrooms.jsx rather than forking the Year->Section drill-down -
// a department is exactly "the same tree, pre-sliced to one department."
export function CampusDepartments({ institutionId }) {
  const [students, setStudents] = useState(null);
  const [roleAssignments, setRoleAssignments] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [screen, setScreen] = useState({ view: "list" });

  useEffect(() => {
    fetchRosterStudents(institutionId).then(setStudents).catch(() => setStudents([]));
    fetchRoleAssignments(institutionId).then(setRoleAssignments).catch(() => setRoleAssignments([]));
    fetchDepartments(institutionId).then(setDepartments).catch(() => setDepartments([]));
  }, [institutionId]);

  useCampusBackHandler(3, screen.view !== "list", () => setScreen({ view: "list" }));

  if (screen.view === "department") {
    return (
      <DepartmentDashboard institutionId={institutionId} department={screen.department}
        students={(students || []).filter(s => s.department === screen.department)}
        hod={roleAssignments.find(r => r.roleKey === "hod" && r.scope?.department === screen.department && r.status === "active")}
        faculty={roleAssignments.filter(r => r.roleKey === "facultyClassTeacher" && r.status === "active")}
        onBack={() => setScreen({ view: "list" })} />
    );
  }

  if (students === null) {
    return <CampusCard className="p-5"><CampusSkeleton variant="rect" height={200} /></CampusCard>;
  }

  const cards = departments.map(dept => {
    const deptStudents = students.filter(s => s.department === dept.name);
    const tree = buildClassroomTree(deptStudents);
    const sectionCount = tree.reduce((sum, y) => sum + y.departments.reduce((s2, d) => s2 + d.sections.length, 0), 0);
    const hod = roleAssignments.find(r => r.roleKey === "hod" && r.scope?.department === dept.name && r.status === "active");
    const facultyCount = roleAssignments.filter(r => r.roleKey === "facultyClassTeacher" && r.status === "active"
      && deptStudents.some(s => s.classroomId === r.scope?.classroomId)).length;
    return { dept, deptStudents, yearsAvailable: tree.length, sectionCount, hod, facultyCount };
  });

  return (
    <div className="space-y-3">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {cards.map(({ dept, deptStudents, yearsAvailable, sectionCount, hod, facultyCount }) => (
          <button key={dept.id} onClick={() => setScreen({ view: "department", department: dept.name })} className="text-left">
            <CampusCard hover className="p-4 h-full flex flex-col gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: CAMPUS.tealTint, color: CAMPUS.teal }}>
                  <Building2 size={16} />
                </div>
                <div className="min-w-0">
                  <b className="block text-[13.5px] truncate" style={{ color: CAMPUS.ink }}>{dept.name}</b>
                  <span className="text-[11px]" style={{ color: CAMPUS.inkFaint }}>{hod ? hod.displayName : "No HOD assigned"}</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div><b className="block text-[15px]" style={{ color: CAMPUS.ink }}>{deptStudents.length}</b><span className="text-[9.5px]" style={{ color: CAMPUS.inkFaint }}>STUDENTS</span></div>
                <div><b className="block text-[15px]" style={{ color: CAMPUS.ink }}>{facultyCount}</b><span className="text-[9.5px]" style={{ color: CAMPUS.inkFaint }}>FACULTY</span></div>
                <div><b className="block text-[15px]" style={{ color: CAMPUS.ink }}>{sectionCount}</b><span className="text-[9.5px]" style={{ color: CAMPUS.inkFaint }}>SECTIONS</span></div>
              </div>
              <span className="text-[10.5px]" style={{ color: CAMPUS.inkFaint }}>{yearsAvailable} year{yearsAvailable === 1 ? "" : "s"} active</span>
            </CampusCard>
          </button>
        ))}
      </div>
    </div>
  );
}

// An HOD's own Overview tab (campus-app.jsx) - the SAME DepartmentDashboard
// Manage -> Departments uses, just locked to the one department they're
// assigned to (onBack: null renders the breadcrumb's first crumb as plain
// text, not a link - there's no department list for an HOD to leave).
export function CampusHodDashboard({ institutionId, department }) {
  const [deptStudents, setDeptStudents] = useState(null);
  const [roleAssignments, setRoleAssignments] = useState([]);

  useEffect(() => {
    fetchRosterStudentsByDepartment(institutionId, department).then(setDeptStudents).catch(() => setDeptStudents([]));
    fetchRoleAssignments(institutionId).then(setRoleAssignments).catch(() => setRoleAssignments([]));
  }, [institutionId, department]);

  if (deptStudents === null) return <CampusCard className="p-5"><CampusSkeleton variant="rect" height={200} /></CampusCard>;

  const hod = roleAssignments.find(r => r.roleKey === "hod" && r.scope?.department === department && r.status === "active");
  const faculty = roleAssignments.filter(r => r.roleKey === "facultyClassTeacher" && r.status === "active");
  return <DepartmentDashboard institutionId={institutionId} department={department} students={deptStudents} hod={hod} faculty={faculty} onBack={null} />;
}

// Principal's own Overview tab - identical breadth to Institution Admin at
// the rules layer (see firestore.rules' isPrincipal(), folded directly into
// isInstitutionAdmin()), so an unscoped fetchRosterStudents() is genuinely
// safe here unlike CampusHodDashboard/CampusFacultyDashboard above. Reuses
// the same rich DepartmentDashboard those get, just fed the WHOLE roster
// instead of one department/classroom's slice - hideSettingsTab, since that
// tab edits one department's own description field, which has no
// institution-wide equivalent. The Faculty tab's own "classroom appears in
// the given student list" filter naturally becomes "every classroom in the
// institution" when given every student, so it reads as a full staff
// directory with no extra logic needed.
export function CampusPrincipalDashboard({ institutionId, institution }) {
  const [students, setStudents] = useState(null);
  const [roleAssignments, setRoleAssignments] = useState([]);

  useEffect(() => {
    fetchRosterStudents(institutionId).then(setStudents).catch(() => setStudents([]));
    fetchRoleAssignments(institutionId).then(setRoleAssignments).catch(() => setRoleAssignments([]));
  }, [institutionId]);

  if (students === null) return <CampusCard className="p-5"><CampusSkeleton variant="rect" height={200} /></CampusCard>;

  const faculty = roleAssignments.filter(r => r.roleKey === "facultyClassTeacher" && r.status === "active");
  return (
    <DepartmentDashboard institutionId={institutionId} department={institution?.name || "All Departments"}
      students={students} hod={null} faculty={faculty} onBack={null} hideSettingsTab />
  );
}

const DEPT_TABS = [
  { key: "overview", label: "Overview", icon: LayoutGrid },
  { key: "students", label: "Students", icon: Users },
  { key: "faculty", label: "Faculty", icon: GraduationCap },
  { key: "years", label: "Years", icon: ChevronRight },
  { key: "analytics", label: "Analytics", icon: BarChart3 },
  { key: "reports", label: "Reports", icon: Download },
  { key: "settings", label: "Settings", icon: SettingsIcon },
];

// One department's own 7-tab dashboard - Overview/Analytics reuse
// fetchClassroomAnalytics (it accepts any student array, not just one
// classroom's), Years reuses buildClassroomTree + the imported
// ClassroomDashboard for its Section drill-down, so this is genuinely
// additive on top of campus-classrooms.jsx, not a fork of it.
export function DepartmentDashboard({ institutionId, department, students, hod, faculty, onBack, hideSettingsTab = false }) {
  const [tab, setTab] = useState("overview");
  const [analytics, setAnalytics] = useState(null);
  const [viewingStudentUid, setViewingStudentUid] = useState(null);
  const [yearSection, setYearSection] = useState(null); // { year, section, students }
  const tabs = hideSettingsTab ? DEPT_TABS.filter(t => t.key !== "settings") : DEPT_TABS;

  useEffect(() => {
    setAnalytics(null);
    fetchClassroomAnalytics(institutionId, students).then(setAnalytics).catch(() => setAnalytics(false));
  }, [institutionId, students]);

  useCampusBackHandler(4, !!viewingStudentUid || !!yearSection, () => { setViewingStudentUid(null); setYearSection(null); });

  if (viewingStudentUid) {
    const student = students.find(s => s.uid === viewingStudentUid);
    if (student) {
      return <StudentAnalyticsDashboard institutionId={institutionId} institution={{ id: institutionId }} student={student}
        onBack={() => setViewingStudentUid(null)} onChanged={() => {}} />;
    }
  }
  if (yearSection) {
    return (
      <ClassroomDashboard institutionId={institutionId} year={yearSection.year} department={department} section={yearSection.section}
        students={yearSection.students} onBack={() => setYearSection(null)} onOpenStudent={setViewingStudentUid} />
    );
  }

  return (
    <div>
      <CampusBreadcrumb items={[{ label: "Departments", onClick: onBack }, { label: department }]} />
      <h2 className="text-lg font-semibold mb-4" style={{ color: CAMPUS.ink }}>
        {department} <span style={{ color: CAMPUS.inkFaint }}>({students.length})</span>
      </h2>

      <div className="flex items-center gap-1.5 flex-wrap mb-4 overflow-x-auto">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-lg transition-colors flex-shrink-0"
            style={{ color: tab === t.key ? "#fff" : CAMPUS.inkSoft, background: tab === t.key ? CAMPUS.teal : "transparent", border: `1px solid ${tab === t.key ? CAMPUS.teal : CAMPUS.line}` }}>
            <t.icon size={12} /> {t.label}
          </button>
        ))}
      </div>

      {analytics === false ? (
        <CampusEmptyState icon={AlertTriangle} title="Couldn't load analytics" description="Something went wrong fetching this department's data. Try again." />
      ) : analytics === null ? (
        <CampusCard className="p-5"><CampusSkeleton variant="rect" height={220} /></CampusCard>
      ) : (
        <>
          {tab === "overview" && <DeptOverviewTab analytics={analytics} hod={hod} />}
          {tab === "students" && <DeptStudentsTab students={students} onOpenStudent={setViewingStudentUid} />}
          {tab === "faculty" && <DeptFacultyTab hod={hod} faculty={faculty} students={students} />}
          {tab === "years" && <DeptYearsTab students={students} onOpenSection={(year, section, list) => setYearSection({ year, section, students: list })} />}
          {tab === "analytics" && <DeptAnalyticsTab institutionId={institutionId} analytics={analytics} />}
          {tab === "reports" && <DeptReportsTab department={department} students={students} analytics={analytics} />}
          {tab === "settings" && <DeptSettingsTab institutionId={institutionId} department={department} />}
        </>
      )}
    </div>
  );
}

function DeptOverviewTab({ analytics, hod }) {
  const { kpis, topPerformers, fallingBehind } = analytics;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <CampusStat label="Students" value={kpis.totalStudents} />
        <CampusStat label="HOD" value={hod ? hod.displayName : "Unassigned"} />
        <CampusStat label="Avg Score" value={kpis.avgScore.toLocaleString()} color={CAMPUS.purple} />
        <CampusStat label="Active This Week" value={`${kpis.activeThisWeek}/${kpis.totalStudents}`} color={CAMPUS.teal} />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <CampusCard className="p-4">
          <p className="text-[10px] font-mono tracking-widest mb-3 flex items-center gap-1.5" style={{ color: CAMPUS.inkFaint }}>
            <Star size={11} /> TOP PERFORMERS
          </p>
          {topPerformers.length === 0 ? <p className="text-[12px]" style={{ color: CAMPUS.inkFaint }}>No score earned yet.</p> : (
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
          {fallingBehind.length === 0 ? <p className="text-[12px]" style={{ color: CAMPUS.inkFaint }}>Everyone has been active this week.</p> : (
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

function DeptStudentsTab({ students, onOpenStudent }) {
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter(s => s.name?.toLowerCase().includes(q) || s.rollNumber?.toLowerCase().includes(q));
  }, [students, search]);

  return (
    <div>
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or roll number..."
        className="w-full text-[12.5px] px-3 py-2 rounded-lg outline-none mb-3"
        style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.ink }} />
      {filtered.length === 0 ? (
        <CampusEmptyState size="sm" icon={Users} title="No students match" description="Try a different search." />
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${CAMPUS.line}` }}>
          {filtered.map((s, i) => (
            <button key={s.uid} onClick={() => onOpenStudent(s.uid)} className="w-full text-left"
              style={{ background: CAMPUS.surface, borderTop: i > 0 ? `1px solid ${CAMPUS.line}` : "none" }}>
              <div className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <b className="block text-[13px]" style={{ color: CAMPUS.ink }}>{s.name}</b>
                  <span className="text-[11px] font-mono" style={{ color: CAMPUS.inkFaint }}>{s.rollNumber} - {s.year} {s.section}</span>
                </div>
                <span className="text-[11.5px] font-mono flex-shrink-0" style={{ color: CAMPUS.purple }}>{(s.score || 0).toLocaleString()} pts</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function DeptFacultyTab({ hod, faculty, students }) {
  const classroomIds = useMemo(() => new Set(students.map(s => s.classroomId).filter(Boolean)), [students]);
  const deptFaculty = faculty.filter(f => classroomIds.has(f.scope?.classroomId));
  return (
    <div className="space-y-3">
      <CampusCard className="p-4">
        <p className="text-[10px] font-mono tracking-widest mb-2" style={{ color: CAMPUS.inkFaint }}>HEAD OF DEPARTMENT</p>
        {hod ? (
          <div className="flex items-center justify-between">
            <div><b className="text-[13.5px]" style={{ color: CAMPUS.ink }}>{hod.displayName}</b><p className="text-[11.5px]" style={{ color: CAMPUS.inkFaint }}>{hod.email}</p></div>
            <CampusChip color={CAMPUS.good}>ACTIVE</CampusChip>
          </div>
        ) : <p className="text-[12.5px]" style={{ color: CAMPUS.inkFaint }}>No HOD assigned yet - add one from Manage &rarr; Manage Admins.</p>}
      </CampusCard>
      <CampusCard className="p-4">
        <p className="text-[10px] font-mono tracking-widest mb-2" style={{ color: CAMPUS.inkFaint }}>FACULTY & CLASS TEACHERS ({deptFaculty.length})</p>
        {deptFaculty.length === 0 ? <p className="text-[12.5px]" style={{ color: CAMPUS.inkFaint }}>None assigned yet.</p> : (
          <div className="space-y-2">
            {deptFaculty.map(f => (
              <div key={f.id} className="flex items-center justify-between">
                <span className="text-[13px]" style={{ color: CAMPUS.ink }}>{f.displayName}</span>
                <CampusChip color={f.status === "active" ? CAMPUS.good : CAMPUS.bad}>{f.status?.toUpperCase()}</CampusChip>
              </div>
            ))}
          </div>
        )}
      </CampusCard>
    </div>
  );
}

function DeptYearsTab({ students, onOpenSection }) {
  const tree = useMemo(() => buildClassroomTree(students), [students]);
  if (tree.length === 0) return <CampusEmptyState icon={GraduationCap} title="No classrooms yet" description="Classrooms appear once students are approved with a Year and Section." />;
  return (
    <div className="space-y-2">
      {tree.map(({ year, departments }) => {
        const sections = departments[0]?.sections || [];
        return (
          <CampusCard key={year} className="p-4">
            <p className="text-[13px] font-semibold mb-2.5" style={{ color: CAMPUS.ink }}>{year}</p>
            <div className="grid sm:grid-cols-2 gap-2">
              {sections.map(sec => (
                <button key={sec.section} onClick={() => onOpenSection(year, sec.section, sec.students)} className="text-left">
                  <CampusCard hover className="p-3 flex items-center justify-between">
                    <span className="text-[12.5px] font-medium" style={{ color: CAMPUS.ink }}>Section {sec.section}</span>
                    <CampusChip color={CAMPUS.teal}>{sec.students.length} student{sec.students.length === 1 ? "" : "s"}</CampusChip>
                  </CampusCard>
                </button>
              ))}
            </div>
          </CampusCard>
        );
      })}
    </div>
  );
}

function DeptAnalyticsTab({ institutionId, analytics }) {
  const [campusAvg, setCampusAvg] = useState(undefined);
  useEffect(() => { fetchCampusAverages(institutionId).then(setCampusAvg).catch(() => setCampusAvg(null)); }, [institutionId]);
  const { kpis } = analytics;
  return (
    <CampusCard className="p-4">
      <p className="text-[10px] font-mono tracking-widest mb-3 flex items-center gap-1.5" style={{ color: CAMPUS.inkFaint }}>
        <TrendingUp size={11} /> THIS DEPARTMENT VS CAMPUS AVERAGE
      </p>
      {campusAvg === undefined ? <CampusSkeleton variant="rect" height={60} /> : campusAvg === null ? (
        <p className="text-[12px]" style={{ color: CAMPUS.inkFaint }}>Couldn&apos;t load campus-wide averages.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[11px] mb-1" style={{ color: CAMPUS.inkFaint }}>Avg Score (department vs campus)</p>
            <p className="text-[15px] font-mono font-bold" style={{ color: CAMPUS.ink }}>
              {kpis.avgScore.toLocaleString()} <span style={{ color: CAMPUS.inkFaint, fontWeight: 400 }}>vs {campusAvg.avgScore.toLocaleString()}</span>
            </p>
          </div>
          <div>
            <p className="text-[11px] mb-1" style={{ color: CAMPUS.inkFaint }}>Avg Problems Solved (department vs campus)</p>
            <p className="text-[15px] font-mono font-bold" style={{ color: CAMPUS.ink }}>
              {kpis.avgProblemsSolved} <span style={{ color: CAMPUS.inkFaint, fontWeight: 400 }}>vs {campusAvg.avgProblemsSolved}</span>
            </p>
          </div>
        </div>
      )}
    </CampusCard>
  );
}

function csvEscape(v) { return `"${String(v ?? "").replace(/"/g, '""')}"`; }

function DeptReportsTab({ department, students, analytics }) {
  const { kpis } = analytics;
  const download = () => {
    const header = "name,rollNumber,year,section,status,score,xp,problemsSolvedCount";
    const rows = students.map(s => [s.name, s.rollNumber, s.year, s.section, s.status, s.score, s.xp, s.problemsSolvedCount].map(csvEscape).join(","));
    const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${department.replace(/\s+/g, "-").toLowerCase()}-report.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <CampusCard className="p-4">
      <p className="text-[13px] font-semibold mb-1" style={{ color: CAMPUS.ink }}>Export Report</p>
      <p className="text-[12px] mb-3" style={{ color: CAMPUS.inkFaint }}>
        {department} - {kpis.totalStudents} students, {kpis.avgScore.toLocaleString()} avg score.
      </p>
      <CampusButton variant="secondary" icon={Download} onClick={download}>Download CSV</CampusButton>
    </CampusCard>
  );
}

function DeptSettingsTab({ institutionId, department }) {
  const canManage = useHasPermission("departments.manage");
  const key = useMemo(() => departmentKey(department), [department]);
  const [description, setDescription] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchDepartment(institutionId, key).then(d => { setDescription(d?.description || ""); setLoaded(true); }).catch(() => setLoaded(true));
  }, [institutionId, key]);

  const handleSave = async () => {
    setSaving(true); setSaved(false);
    try {
      await updateDepartment(institutionId, key, { description });
      setSaved(true);
    } catch (e) {
      alert(e.message || "Could not save.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <CampusCard className="p-4">
      <p className="text-[10px] font-mono tracking-widest mb-2" style={{ color: CAMPUS.inkFaint }}>DEPARTMENT DESCRIPTION</p>
      <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} disabled={!canManage || !loaded}
        placeholder="A short description shown on this department's own dashboard..."
        className="w-full px-3 py-2 rounded-lg text-[13px] outline-none resize-none disabled:opacity-60"
        style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.ink }} />
      {canManage && (
        <CampusButton onClick={handleSave} disabled={saving} className="mt-3">{saving ? "Saving..." : saved ? "Saved" : "Save"}</CampusButton>
      )}
    </CampusCard>
  );
}
