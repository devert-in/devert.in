"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronRight, Users, GraduationCap, Medal } from "lucide-react";
import { CAMPUS } from "@/lib/campus-theme";
import {
  fetchRosterStudents, YEARS, classroomKey, fetchClassroom, updateClassroomLeaderboardVisibility,
  LEADERBOARD_SCOPES,
} from "@/lib/institutions";
import {
  CampusCard, CampusChip, CampusBreadcrumb, CampusEmptyState, CampusSkeleton,
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

// Year -> Department -> Section browse tree, computed live from
// fetchRosterStudents() (approved + suspended) every time this mounts - no
// separate "classroom stats" are ever stored (see ensureClassroom's comment
// in lib/institutions.js for why: no Cloud Functions in this project means
// nothing would keep a stored count/average in sync). Same
// grouped-from-live-data approach ManageStudents already uses for its own
// department/year filters, just one level deeper.
//
// Only students whose `year` is one of the canonical YEARS values are
// grouped here - a student with old free-text data (e.g. year "3" from
// before this rework) isn't silently bucketed into a stray, non-canonical
// group. They stay reachable via the flat Students list and the
// unclassified-count banner below points admins at fixing them via the
// identity-edit flow (updateStudentIdentity already assigns a classroomId
// the moment department/year/section all become canonical).
export function CampusClassrooms({ institutionId, institution }) {
  const [students, setStudents] = useState(null);
  const [screen, setScreen] = useState({ view: "tree" });
  const [viewingStudentUid, setViewingStudentUid] = useState(null);

  const load = () => {
    setStudents(null);
    fetchRosterStudents(institutionId).then(setStudents).catch(() => setStudents([]));
  };
  useEffect(load, [institutionId]);

  const isClassroomed = (s) => s.year && s.department && s.section && YEARS.includes(s.year);

  const tree = useMemo(() => {
    if (!students) return [];
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
  }, [students]);

  const unclassifiedCount = useMemo(() => (students || []).filter(s => !isClassroomed(s)).length, [students]);

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

function ClassroomDashboard({ institutionId, year, department, section, students, onBack, onOpenStudent }) {
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter(s => (s.name || "").toLowerCase().includes(q) || (s.rollNumber || "").toLowerCase().includes(q));
  }, [students, search]);

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

      <ClassroomLeaderboardVisibility institutionId={institutionId} year={year} department={department} section={section} />

      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or roll number..."
        className="w-full text-[12.5px] px-3 py-2 rounded-lg outline-none mb-4"
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
                  <b className="block text-[13px]" style={{ color: CAMPUS.ink }}>{s.name || "(no name)"}</b>
                  <span className="text-[11px] font-mono" style={{ color: CAMPUS.inkFaint }}>{s.rollNumber}</span>
                </div>
                {s.status === "suspended" && <CampusChip color={CAMPUS.bad}>SUSPENDED</CampusChip>}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
