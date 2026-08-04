"use client";

// The institution admin's own "Overview" - previously admins saw the exact
// same personal Score/XP/Coins OverviewTab a student sees (confirmed nothing
// else existed anywhere in this codebase). Every widget here is backed by
// data that already exists and is already fetched somewhere else in Campus
// Admin (fetchPendingStudents, fetchClassrooms/fetchRosterStudents,
// fetchCampusAverages, fetchPublishedInstitutionContests) - nothing
// fabricated (no placement-readiness/gender/attendance metrics, since none
// of that data exists in this schema yet). Deliberately does NOT call
// fetchClassroomAnalytics per classroom here (multiple reads per classroom,
// see that function's own comment) - the Classroom Overview table below
// shows only the free/already-fetched student count per classroom, and
// links out to the existing full ClassroomDashboard (Manage > Students >
// Classrooms) for the expensive per-classroom drill-down.

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  UserPlus, Trophy, GraduationCap, BookOpen, Palette, ClipboardCheck,
  Activity, Award, Power, ChevronRight, Clock, Check, Building2, ShieldCheck,
} from "lucide-react";
import { StaffDashboardHero } from "@/components/campus/campus-dashboard-widgets";
import { CAMPUS } from "@/lib/campus-theme";
import {
  CampusCard, CampusChip, CampusStat, CampusSkeleton,
  CampusEmptyState, CampusTable, ReportDownloadButton,
} from "@/components/campus/campus-ui";
import {
  fetchPendingStudents, fetchRosterStudents, fetchClassrooms, approveStudent,
  fetchLeaderboardSettings, LEADERBOARD_METRICS, MODULES, isModuleEnabledForClassroom, YEARS,
} from "@/lib/institutions";
import { fetchCampusAverages } from "@/lib/classroomAnalytics";
import { fetchInstitutionContests, bucketContests } from "@/lib/contests";
import { fetchModuleConfig } from "@/lib/dailyLearning";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { gatherRosterReport, gatherClassroomAnalyticsReport } from "@/lib/campusReports";

function SectionHeading({ icon: Icon, title, action }) {
  return (
    <div className="flex items-center gap-2.5 mb-3">
      <Icon size={16} style={{ color: CAMPUS.teal }} />
      <h2 className="text-[15px] font-semibold flex-1" style={{ color: CAMPUS.ink }}>{title}</h2>
      {action}
    </div>
  );
}

function timeAgo(date) {
  const mins = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

// Top-5 campus-scope leaderboard for the admin snapshot - admins have no
// department/year/section of their own, so "campus" (not section/department)
// is the only scope that makes sense here, unlike the student-facing
// CampusLeaderboardTab which defaults to the viewer's own narrowest scope.
async function fetchCampusTop5(institutionId, metric, classrooms) {
  const visibilityByClassroomId = new Map(classrooms.map(c => [c.id, c.leaderboardVisibility || {}]));
  const snap = await getDocs(query(
    collection(db, "users"), where("institutionId", "==", institutionId), orderBy(metric, "desc"), limit(25),
  ));
  return snap.docs
    .map(d => ({ uid: d.id, ...d.data() }))
    .filter(r => !r.classroomId || visibilityByClassroomId.get(r.classroomId)?.campus !== false)
    .slice(0, 5);
}

export function CampusAdminOverview({ slug, institution, onOpenContest }) {
  const [pending, setPending] = useState(null);
  const [roster, setRoster] = useState(null);
  const [classrooms, setClassrooms] = useState(null);
  const [averages, setAverages] = useState(null);
  const [contests, setContests] = useState(null);
  const [leaderboard, setLeaderboard] = useState(null);
  const [leaderboardMetric, setLeaderboardMetric] = useState("score");
  const [dailyLearningEnabled, setDailyLearningEnabled] = useState(true);
  const [approving, setApproving] = useState({});

  const reload = () => {
    fetchPendingStudents(slug).then(setPending).catch(() => setPending([]));
    fetchRosterStudents(slug).then(setRoster).catch(() => setRoster([]));
  };
  useEffect(reload, [slug]);
  useEffect(() => { fetchClassrooms(slug).then(setClassrooms).catch(() => setClassrooms([])); }, [slug]);
  useEffect(() => { fetchCampusAverages(slug).then(setAverages).catch(() => setAverages(null)); }, [slug]);
  useEffect(() => { fetchInstitutionContests(slug).then(setContests).catch(() => setContests([])); }, [slug]);
  useEffect(() => { fetchModuleConfig(slug).then(cfg => setDailyLearningEnabled(cfg.enabled !== false)).catch(() => {}); }, [slug]);

  useEffect(() => {
    fetchLeaderboardSettings(slug)
      .then(settings => { setLeaderboardMetric(settings.rankingMetric || "score"); return settings; })
      .catch(() => {});
  }, [slug]);

  useEffect(() => {
    if (!classrooms) return;
    fetchCampusTop5(slug, leaderboardMetric, classrooms).then(setLeaderboard).catch(() => setLeaderboard([]));
  }, [slug, leaderboardMetric, classrooms]);

  const classroomStudentCounts = useMemo(() => {
    const counts = new Map();
    (roster || []).forEach(s => {
      if (!s.classroomId) return;
      counts.set(s.classroomId, (counts.get(s.classroomId) || 0) + 1);
    });
    return counts;
  }, [roster]);

  const moduleHealth = useMemo(() => {
    if (!classrooms) return [];
    const total = classrooms.length;
    return MODULES.filter(m => m.key !== "dailyLearning").map(m => ({
      ...m,
      enabledCount: classrooms.filter(c => isModuleEnabledForClassroom(c, m.key)).length,
      total,
    }));
  }, [classrooms]);

  const recentActivity = useMemo(() => {
    if (!roster) return [];
    const events = [];
    roster.forEach(s => {
      if (s.reviewedAt?.toDate) events.push({ type: s.status === "suspended" ? "suspended" : "approved", student: s, at: s.reviewedAt.toDate() });
      else if (s.requestedAt?.toDate) events.push({ type: "requested", student: s, at: s.requestedAt.toDate() });
    });
    return events.sort((a, b) => b.at - a.at).slice(0, 15);
  }, [roster]);

  const contestBuckets = useMemo(() => bucketContests(contests || []), [contests]);
  const metricLabel = LEADERBOARD_METRICS.find(m => m.key === leaderboardMetric)?.label || "Score";

  const handleApprove = async (student) => {
    setApproving(p => ({ ...p, [student.uid]: true }));
    try {
      await approveStudent(slug, student.uid, { department: student.department, year: student.year, section: student.section });
      setPending(p => p.filter(s => s.uid !== student.uid));
      reload();
    } catch (e) {
      window.alert(e.message || "Failed to approve.");
    } finally {
      setApproving(p => ({ ...p, [student.uid]: false }));
    }
  };

  const classroomRows = useMemo(() => {
    if (!classrooms) return null;
    return [...classrooms].sort((a, b) =>
      YEARS.indexOf(a.year) - YEARS.indexOf(b.year)
      || (a.department || "").localeCompare(b.department || "")
      || (a.section || "").localeCompare(b.section || "")
    ).map(c => ({ ...c, studentCount: classroomStudentCounts.get(c.id) || 0 }));
  }, [classrooms, classroomStudentCounts]);

  return (
    // campus-sharp removed here too - it was squaring off this whole screen on
    // top of the workspace-root copy (see campus-app.jsx's comment).
    <div className="space-y-5">
      <StaffDashboardHero
        icon={ShieldCheck}
        title={institution?.name || "Command Center"}
        subtitle="Institution admin overview"
        meta={
          <>
            <CampusChip color={CAMPUS.teal}>ADMIN</CampusChip>
            {pending?.length > 0 && (
              <CampusChip color={CAMPUS.warn} icon={UserPlus}>{pending.length} PENDING</CampusChip>
            )}
            {contestBuckets.live.length > 0 && (
              <CampusChip color={CAMPUS.good} icon={Trophy}>{contestBuckets.live.length} LIVE</CampusChip>
            )}
          </>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <CampusStat label="Total Students" value={institution?.studentCount ?? "-"} color={CAMPUS.teal} icon={GraduationCap} />
        <CampusStat label="Pending Requests" value={pending?.length ?? "-"} color={CAMPUS.warn} icon={UserPlus} />
        <CampusStat label="Classrooms" value={classrooms?.length ?? "-"} color={CAMPUS.purple} icon={Building2} />
        <CampusStat label="Live Contests" value={contestBuckets.live.length} color={CAMPUS.good} icon={Trophy}
          hint={`${contestBuckets.upcoming.length} upcoming`} />
      </div>

      <div>
        <SectionHeading icon={ClipboardCheck} title="Quick Actions" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <Link href={`/campus/${slug}/manage/students`} className="block">
            <CampusCard hover className="p-3.5 flex flex-col items-center text-center gap-1.5">
              <UserPlus size={17} style={{ color: CAMPUS.teal }} />
              <span className="text-[11.5px] font-semibold" style={{ color: CAMPUS.ink }}>Approve Students</span>
            </CampusCard>
          </Link>
          <Link href={`/campus/${slug}/manage/contests?view=studio`} className="block">
            <CampusCard hover className="p-3.5 flex flex-col items-center text-center gap-1.5">
              <Trophy size={17} style={{ color: CAMPUS.purple }} />
              <span className="text-[11.5px] font-semibold" style={{ color: CAMPUS.ink }}>Create Contest</span>
            </CampusCard>
          </Link>
          <Link href={`/campus/${slug}/manage/daily-learning?editDay=new`} className="block">
            <CampusCard hover className="p-3.5 flex flex-col items-center text-center gap-1.5">
              <BookOpen size={17} style={{ color: CAMPUS.gold }} />
              <span className="text-[11.5px] font-semibold" style={{ color: CAMPUS.ink }}>Add Daily Learning Day</span>
            </CampusCard>
          </Link>
          <Link href={`/campus/${slug}/manage/branding`} className="block">
            <CampusCard hover className="p-3.5 flex flex-col items-center text-center gap-1.5">
              <Palette size={17} style={{ color: CAMPUS.blue }} />
              <span className="text-[11.5px] font-semibold" style={{ color: CAMPUS.ink }}>Manage Branding</span>
            </CampusCard>
          </Link>
        </div>
      </div>

      {contestBuckets.upcoming.length + contestBuckets.live.length > 0 && (
        <div>
          <SectionHeading icon={Trophy} title="Upcoming Contests"
            action={<Link href={`/campus/${slug}/manage/contests`} className="text-[11px] font-semibold" style={{ color: CAMPUS.teal }}>View all &rarr;</Link>} />
          <div className="space-y-2">
            {[...contestBuckets.live, ...contestBuckets.upcoming].slice(0, 3).map(c => (
              <button key={c.id} onClick={() => onOpenContest?.(c.id)} className="block w-full text-left">
                <CampusCard hover className="p-3.5 flex items-center gap-3">
                  <Trophy size={15} style={{ color: CAMPUS.purple, flexShrink: 0 }} />
                  <span className="flex-1 text-[12.5px] font-medium truncate" style={{ color: CAMPUS.ink }}>{c.title}</span>
                  <CampusChip color={contestBuckets.live.includes(c) ? CAMPUS.good : CAMPUS.teal}>
                    {contestBuckets.live.includes(c) ? "LIVE" : "UPCOMING"}
                  </CampusChip>
                </CampusCard>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-5">
        <div>
          <SectionHeading icon={UserPlus} title="Pending Approvals"
            action={<Link href={`/campus/${slug}/manage/students`} className="text-[11px] font-semibold" style={{ color: CAMPUS.teal }}>View all &rarr;</Link>} />
          {pending === null ? (
            <CampusCard className="p-4 space-y-2"><CampusSkeleton variant="rect" height={60} /></CampusCard>
          ) : pending.length === 0 ? (
            <CampusEmptyState size="sm" icon={UserPlus} title="No pending requests" description="New join requests will appear here." />
          ) : (
            <div className="space-y-2">
              {pending.slice(0, 5).map(s => (
                <CampusCard key={s.uid} className="p-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-[12.5px] font-semibold truncate" style={{ color: CAMPUS.ink }}>{s.name}</p>
                    <p className="text-[10.5px] font-mono" style={{ color: CAMPUS.inkFaint }}>{s.rollNumber} - {s.department} - {s.year}</p>
                  </div>
                  <button onClick={() => handleApprove(s)} disabled={approving[s.uid]}
                    className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg disabled:opacity-50"
                    style={{ color: "#fff", background: CAMPUS.good }}>
                    <Check size={12} /> Approve
                  </button>
                </CampusCard>
              ))}
            </div>
          )}
        </div>

        <div>
          <SectionHeading icon={Award} title={`Leaderboard Snapshot - ${metricLabel}`}
            action={<Link href={`/campus/${slug}?tab=leaderboard`} className="text-[11px] font-semibold" style={{ color: CAMPUS.teal }}>View full &rarr;</Link>} />
          {leaderboard === null ? (
            <CampusCard className="p-4"><CampusSkeleton variant="rect" height={60} /></CampusCard>
          ) : leaderboard.length === 0 ? (
            <CampusEmptyState size="sm" icon={Award} title="No ranked students yet" />
          ) : (
            <CampusCard className="p-0 overflow-hidden">
              {leaderboard.map((r, i) => (
                <div key={r.uid} className="flex items-center gap-3 px-4 py-2.5" style={{ borderTop: i > 0 ? `1px solid ${CAMPUS.line}` : "none" }}>
                  <span className="text-[12px] font-mono w-5" style={{ color: CAMPUS.inkFaint }}>#{i + 1}</span>
                  <span className="flex-1 text-[12.5px] truncate" style={{ color: CAMPUS.ink }}>{r.campusFullName || r.displayName || r.rollNumber || "Student"}</span>
                  <span className="text-[11.5px] font-mono" style={{ color: CAMPUS.gold }}>{r[leaderboardMetric] ?? 0}</span>
                </div>
              ))}
            </CampusCard>
          )}
        </div>
      </div>

      <div>
        <SectionHeading icon={Activity} title="Campus-Wide Averages" />
        {averages === null ? (
          <CampusCard className="p-4"><CampusSkeleton variant="rect" height={60} /></CampusCard>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <CampusStat label="Avg Score" value={averages.avgScore} color={CAMPUS.purple} />
            <CampusStat label="Avg XP" value={averages.avgXp} color={CAMPUS.teal} />
            <CampusStat label="Avg Problems Solved" value={averages.avgProblemsSolved} color={CAMPUS.blue} />
          </div>
        )}
      </div>

      <div>
        <SectionHeading icon={GraduationCap} title="Classroom Overview"
          action={<ReportDownloadButton label="Export" size="sm" getReport={() => gatherClassroomAnalyticsReport(slug, institution?.name)} />} />
        {classroomRows === null ? (
          <CampusCard className="p-4"><CampusSkeleton variant="rect" height={140} /></CampusCard>
        ) : classroomRows.length === 0 ? (
          <CampusEmptyState size="sm" icon={GraduationCap} title="No classrooms yet"
            description="Classrooms appear automatically once students are approved with a Department, Year, and Section." />
        ) : (
          <CampusTable
            columns={[
              { key: "year", label: "Year" },
              { key: "department", label: "Department" },
              { key: "section", label: "Section" },
              { key: "studentCount", label: "Students", sortable: true },
              {
                key: "view", label: "", render: (row) => (
                  <Link href={`/campus/${slug}/manage/students/classrooms?year=${encodeURIComponent(row.year)}&dept=${encodeURIComponent(row.department)}&section=${encodeURIComponent(row.section)}`}
                    className="text-[11px] font-semibold flex items-center gap-1" style={{ color: CAMPUS.teal }}>
                    View <ChevronRight size={12} />
                  </Link>
                ),
              },
            ]}
            rows={classroomRows}
            rowKey="id"
          />
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <div>
          <SectionHeading icon={Clock} title="Recent Activity" />
          {roster === null ? (
            <CampusCard className="p-4"><CampusSkeleton variant="rect" height={100} /></CampusCard>
          ) : recentActivity.length === 0 ? (
            <CampusEmptyState size="sm" icon={Clock} title="Nothing yet" />
          ) : (
            <CampusCard className="p-0 overflow-hidden">
              {recentActivity.map((e, i) => (
                <div key={`${e.student.uid}-${e.type}-${i}`} className="flex items-center gap-3 px-4 py-2.5" style={{ borderTop: i > 0 ? `1px solid ${CAMPUS.line}` : "none" }}>
                  <span className="flex-1 text-[12px] truncate" style={{ color: CAMPUS.inkSoft }}>
                    <b style={{ color: CAMPUS.ink }}>{e.student.name}</b>{" "}
                    {e.type === "approved" ? "was approved" : e.type === "suspended" ? "was suspended" : "requested to join"}
                  </span>
                  <span className="text-[10.5px] font-mono flex-shrink-0" style={{ color: CAMPUS.inkFaint }}>{timeAgo(e.at)}</span>
                </div>
              ))}
            </CampusCard>
          )}
        </div>

        <div>
          <SectionHeading icon={Power} title="Module Health" />
          <CampusCard className="p-0 overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-2.5">
              <span className="flex-1 text-[12.5px]" style={{ color: CAMPUS.ink }}>Daily Learning</span>
              <CampusChip color={dailyLearningEnabled ? CAMPUS.good : CAMPUS.inkFaint}>{dailyLearningEnabled ? "ENABLED" : "DISABLED"}</CampusChip>
            </div>
            {moduleHealth.map(m => (
              <div key={m.key} className="flex items-center gap-3 px-4 py-2.5" style={{ borderTop: `1px solid ${CAMPUS.line}` }}>
                <span className="flex-1 text-[12.5px]" style={{ color: CAMPUS.ink }}>{m.label}</span>
                <span className="text-[11px] font-mono" style={{ color: CAMPUS.inkFaint }}>{m.enabledCount}/{m.total} classrooms</span>
              </div>
            ))}
          </CampusCard>
        </div>
      </div>

      <div className="flex justify-end">
        <ReportDownloadButton label="Download Roster" getReport={() => gatherRosterReport(slug, institution?.name)} />
      </div>
    </div>
  );
}
