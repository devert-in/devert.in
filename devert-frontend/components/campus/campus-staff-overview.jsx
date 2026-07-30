"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, Building2 } from "lucide-react";
import { CAMPUS } from "@/lib/campus-theme";
import { CampusCard, CampusStat, CampusSkeleton } from "@/components/campus/campus-ui";
import { ROLE_CATALOG } from "@/lib/permissions";
import { fetchApprovedStudentCount, fetchDepartments } from "@/lib/institutions";

// Principal's Overview tab - institution-wide, same breadth as
// CampusAdminOverview but without its Manage-tab quick-links (Principal
// doesn't have the Manage tab by default - see the Manage Admins module's
// own scope decision). HOD/Faculty get the fuller DepartmentDashboard/
// ClassroomDashboard instead (see CampusHodDashboard/CampusFacultyDashboard
// in campus-departments.jsx/campus-classrooms.jsx) - this component is
// Principal-only.
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
    <div className="campus-sharp">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: CAMPUS.tealTint, color: CAMPUS.teal }}>
          <ShieldCheck size={18} />
        </div>
        <div>
          <h2 className="text-xl font-semibold" style={{ color: CAMPUS.ink }}>{roleLabel} Dashboard</h2>
          <p className="text-[13px]" style={{ color: CAMPUS.inkSoft }}>{institution.name}</p>
        </div>
      </div>

      {!stats ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          <CampusSkeleton className="h-20" /><CampusSkeleton className="h-20" />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          <CampusStat label="Students" value={stats.studentCount} color={CAMPUS.teal} hint="Approved students across the whole institution." />
          <CampusStat label="Departments" value={stats.departmentCount} color={CAMPUS.purple} hint="Departments configured for this institution." />
        </div>
      )}

      <CampusCard className="p-5 flex items-start gap-3">
        <Building2 size={18} style={{ color: CAMPUS.inkFaint }} className="mt-0.5" />
        <div>
          <p className="text-[13.5px] font-semibold mb-1" style={{ color: CAMPUS.ink }}>Institution-wide access</p>
          <p className="text-[12.5px]" style={{ color: CAMPUS.inkSoft }}>
            Use the sidebar to reach Daily Learning, Programming, CS Core, Aptitude, DSA, Company Vault,
            Assessments, Contests, and Leaderboards - everything here is institution-wide, same as an Institution Admin.
          </p>
        </div>
      </CampusCard>
    </div>
  );
}
