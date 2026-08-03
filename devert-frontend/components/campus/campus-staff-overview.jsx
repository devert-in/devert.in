"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, Building2, Users, Compass } from "lucide-react";
import { CAMPUS } from "@/lib/campus-theme";
import { CampusCard, CampusStat, CampusSkeleton, CampusChip } from "@/components/campus/campus-ui";
import { StaffDashboardHero } from "@/components/campus/campus-dashboard-widgets";
import { ROLE_CATALOG } from "@/lib/permissions";
import { fetchApprovedStudentCount, fetchDepartments } from "@/lib/institutions";

// The Overview tab for an institution-wide staff role that isn't HOD, Faculty
// or Principal - see campus-app.jsx's `tab === "dashboard"` branch chain, where
// this is the last staffScope fallback. (An earlier comment here described it as
// the Principal's dashboard; that stopped being true once CampusPrincipalDashboard
// was added, so this is a generic-staff surface, not a Principal one. HOD and
// Faculty get the richer DepartmentDashboard/ClassroomDashboard instead.)
export function CampusStaffOverview({ slug, institution, staffScope }) {
  const roleLabel = ROLE_CATALOG[staffScope.role]?.label || "Staff";
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetchApprovedStudentCount(slug).catch(() => 0),
      fetchDepartments(slug).catch(() => []),
    ]).then(([studentCount, departments]) => {
      if (!cancelled) setStats({ studentCount, departmentCount: departments.length });
    });
    return () => { cancelled = true; };
  }, [slug]);

  return (
    // No `campus-sharp` here any more. That class is the pre-auth landing
    // page's deliberately sharp-cornered, hairline-bordered language (see
    // CampusLandingNav's comment in campus-app.jsx) - applying it to an
    // authenticated staff dashboard made this one screen render as the
    // marketing front door while every other in-app surface stayed rounded.
    <div className="space-y-5">
      <StaffDashboardHero
        icon={ShieldCheck}
        title={`${roleLabel} Dashboard`}
        subtitle={institution?.name}
        meta={<CampusChip color={CAMPUS.teal}>INSTITUTION-WIDE</CampusChip>}
      />

      {/* Two stats in a two-up grid. This was `sm:grid-cols-3` with exactly two
          children, which left a permanently empty third column on desktop. */}
      {!stats ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* CampusSkeleton sets height inline from its `height` prop, so the
              previous `className="h-20"` was overridden and these rendered as
              hairlines rather than card-sized blocks. */}
          <CampusSkeleton variant="rect" height={92} />
          <CampusSkeleton variant="rect" height={92} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <CampusStat label="Students" value={stats.studentCount} color={CAMPUS.teal} icon={Users}
            hint="Approved students across the whole institution." />
          <CampusStat label="Departments" value={stats.departmentCount} color={CAMPUS.purple} icon={Building2}
            hint="Departments configured for this institution." />
        </div>
      )}

      <CampusCard className="p-5">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: CAMPUS.tealTint, color: CAMPUS.teal }}>
            <Compass size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-[14.5px] font-semibold mb-1" style={{ color: CAMPUS.ink }}>Institution-wide access</p>
            <p className="text-[13px] leading-relaxed" style={{ color: CAMPUS.inkSoft }}>
              Use the sidebar to reach Daily Learning, Programming, CS Core, Aptitude, DSA, Company Vault,
              Assessments, Contests, and Leaderboards - everything here is institution-wide, same as an Institution Admin.
            </p>
          </div>
        </div>
      </CampusCard>
    </div>
  );
}
