"use client";

import { forwardRef, useContext, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "next/navigation";
import {
  Check, X, Upload, Plus, Trophy, BookOpen, Search, Pencil, Download,
  UserX, UserCheck, History, Megaphone, Eye, Power, ChevronRight, ClipboardCheck, Copy, Trash2,
  MoreVertical, UserMinus, CalendarClock, Mail, Ban, Medal,
} from "lucide-react";
import {
  fetchPendingStudents, fetchApprovedStudents, fetchApprovedStudentCount, fetchApprovedStudentCountByDepartment,
  fetchRosterStudents, approveStudent, rejectStudent,
  bulkAssignByRollNumber, updateStudentIdentity, suspendStudent, sendAnnouncement,
  fetchAnnouncements, deleteAnnouncement, isAnnouncementActive, announcementStatus,
  removeStudentFromInstitution, setContestRestriction, DEPARTMENTS, YEARS,
  fetchLeaderboardSettings, saveLeaderboardSettings, LEADERBOARD_METRICS,
  fetchWeeklyLeaderboardSettings, startNewLeaderboardWeek, announceWeeklyLeaderboard,
} from "@/lib/institutions";
import { fetchInstitutionContests, contestPhase } from "@/lib/contests";
import { fetchPublishedProblems } from "@/lib/codelab";
import { fetchContentVisibility, setProblemHidden, setCompanyHidden } from "@/lib/contentVisibility";
import { db } from "@/lib/firebase";
import { collection, query, where, documentId, getDocs, orderBy, limit } from "firebase/firestore";
import {
  DOW_LABELS, mondayOf, shiftWeek, todayISO, fetchWeekItems, fetchModuleConfig, setModuleEnabled,
  setItemStatus, fetchDayLeaderboard, duplicateItem, deleteItem, TRACK_CATALOG,
} from "@/lib/dailyLearning";
import { DailyLearningItemEditor } from "@/components/campus/campus-daily-learning-editor";
import { useAuth } from "@/context/AuthContext";
import { CAMPUS } from "@/lib/campus-theme";
import { CampusCard, CampusChip, CampusButton, CampusSkeleton, CampusEmptyState, CampusBackButton, CampusBreadcrumb, ReportDownloadButton } from "@/components/campus/campus-ui";
import { gatherPendingRequestsReport } from "@/lib/campusReports";
import { CampusContestStudio } from "@/components/campus/campus-contest-studio";
import { CampusContestDashboard } from "@/components/campus/campus-contest-dashboard";
import { CampusQuestionBank } from "@/components/campus/campus-question-bank";
import { CampusDailyLearningAdminPreview } from "@/components/campus/campus-daily-learning";
import { CampusPracticeList, CampusProblemView } from "@/components/campus/campus-practice";
import { CampusCompanyPrepFlow } from "@/components/campus/campus-company-prep";
import { CampusBrandingForm } from "@/components/campus/campus-branding";
import { StudentAnalyticsDashboard } from "@/components/campus/campus-student-dashboard";
import { RosterToolbar } from "@/components/campus/roster-toolbar";
import {
  DEFAULT_ROSTER_FILTERS, PENDING_SORTS, ROSTER_SORTS,
  applyRosterFilters, sortRoster, sortIsRanked, sortNeedsStats,
} from "@/lib/rosterFilters";
import { fetchClassroomUsers } from "@/lib/classroomAnalytics";
import { CampusClassrooms } from "@/components/campus/campus-classrooms";
import { ModuleAccessSummary } from "@/components/campus/campus-module-access";
import { useCampusBackHandler } from "@/lib/campusNav";
import { CampusEmailMigration } from "@/components/campus/campus-email-migration";
import { CampusManageAdmins } from "@/components/campus/campus-manage-admins";
import { CampusDepartments } from "@/components/campus/campus-departments";
import { CampusPermissionsContext } from "@/lib/campusPermissions";

// Exported so the mobile nav drawer (campus-mobile-drawer.jsx) can list and
// search these as admin destinations without duplicating the array.
export const MANAGE_TABS = [
  { key: "students", label: "Students" },
  { key: "departments", label: "Departments" },
  { key: "manageAdmins", label: "Manage Admins" },
  { key: "contests",  label: "Contests" },
  { key: "dailyLearning", label: "Daily Learning" },
  { key: "fundamentals", label: "Fundamentals" },
  { key: "programming", label: "Programming" },
  { key: "csCore", label: "CS Core" },
  { key: "aptitude", label: "Aptitude" },
  { key: "practice", label: "Practice & DSA" },
  { key: "companyPrep", label: "Company Vault" },
  { key: "leaderboards", label: "Leaderboards" },
  { key: "branding", label: "Branding" },
];

// URL segment for each manage tab (app/campus/[slug]/manage/<segment>/page.jsx),
// mirroring TAB_URL_SEGMENT's shape in campus-app.jsx one level deeper.
// Exported so campus-app.jsx's routing entry point can resolve a URL back
// into (initialManageTab, initialManageStudentsView) without duplicating
// this table.
export const MANAGE_TAB_SEGMENT = {
  students: "students", departments: "departments", manageAdmins: "manage-admins", contests: "contests", dailyLearning: "daily-learning",
  fundamentals: "fundamentals", programming: "programming", csCore: "cs-core", aptitude: "aptitude", practice: "practice-dsa",
  companyPrep: "company-vault", leaderboards: "leaderboards", branding: "branding",
};
export const SEGMENT_TO_MANAGE_TAB = Object.fromEntries(Object.entries(MANAGE_TAB_SEGMENT).map(([k, v]) => [v, k]));

// Which lib/permissions.js key gates each tab's visibility for a Principal/
// HOD/Faculty-Class-Teacher account (an Institution Admin - isInstAdmin -
// always sees every tab regardless, same as it always satisfies
// useHasPermission()). This is a UI gate only, exactly like
// useHasPermission's own header comment says - the real boundary is
// firestore.rules' hasPermission(), independently checked on every actual
// write.
const MANAGE_TAB_PERMISSION = {
  students: "students.view",
  departments: "departments.manage",
  manageAdmins: "faculty.manage",
  contests: "contests.manage",
  dailyLearning: "dailyLearning.publish",
  fundamentals: "fundamentals.manage",
  programming: "programming.manage",
  csCore: "csCore.manage",
  aptitude: "aptitude.manage",
  practice: "dsa.manage",
  companyPrep: "companyPrep.manage",
  leaderboards: "leaderboards.view",
};

// branding has no key in PERMISSIONS and isn't getting a speculative one: it
// edits the institution's own identity (name, logo, colors) and is the one
// Manage tab that is institution-wide by definition, so "Institution Admin
// only" IS its rule rather than a permission nobody would ever grant a
// department-scoped role. Listed explicitly because the alternative - leaving
// it out of MANAGE_TAB_PERMISSION - made it ungated, i.e. visible to EVERY
// staff role the moment one of them could reach Manage at all. companyPrep
// was ungated the same way and now uses the companyPrep.manage key that
// already existed in PERMISSIONS unused.
const ADMIN_ONLY_MANAGE_TABS = new Set(["branding"]);

// A department- or classroom-scoped staff role sees ONLY these Manage tabs,
// regardless of what its permissions otherwise grant. Two separate reasons,
// and both matter:
//
//  1. Authority shape. An HOD's seeded defaults include institution-wide
//     permissions (departments.manage, faculty.manage, leaderboards.view,
//     students.view) that were written for the dashboards those keys gate,
//     not for Manage's institution-wide editors. Without this allowlist,
//     handing HOD the Manage nav item would have handed them the Departments
//     list for the WHOLE institution, the Manage Admins console, and the
//     leaderboard config - the opposite of department-scoped.
//
//  2. What rules actually permit. This is per-tab, and the distinction is
//     what the tab actually EDITS - not what its label suggests:
//
//     - dailyLearning authors real content, and it is the only content
//       collection whose firestore.rules create/update accepts a scoped staff
//       writer, via isHodOfDepartment(scopeDepartment).
//     - fundamentals/programming/csCore/aptitude author NOTHING. Each renders
//       ManageModuleAccessOnly, whose only write is `moduleAccess.<key>` on a
//       classroom - and the classrooms update rule already accepts an HOD for
//       their OWN department's classrooms, bounded to
//       hasOnly(['moduleAccess','leaderboardVisibility']) plus a
//       classrooms.manage permission check. Safe to list, as long as the
//       classroom list they render is department-scoped (scopeDepartment
//       below) - an unscoped one is denied all-or-nothing and shows a
//       misleading "No classrooms yet".
//     - practice/companyPrep LOOK like the four above but are not: they render
//       ManagePracticePreview/ManageCompanyPrepPreview, which read the
//       unscoped roster (fetchApprovedStudents - denied for a scoped caller)
//       and contentVisibility, whose read rule covers approved students and
//       institution admins but NOT staff roles. Both failures are swallowed
//       into empty state, so an HOD would get a cohort-analytics screen
//       quietly claiming zero students. Out until those two reads are scoped.
//     - students/departments/manageAdmins/contests/leaderboards/branding stay
//       out: institution-wide surfaces whose queries or writes have no scoped
//       path. students specifically is read-scopeable but its UPDATE rule is
//       admin-only, so the roster's approve/reject/edit/CSV controls would all
//       fail - a read-only department roster belongs on the HOD dashboard
//       (which already has one), not in Manage.
//
// So widening this table is only safe where a scoped rules path already
// exists; anything else is a rules + data-model change first. Faculty/Class
// Teacher is deliberately absent entirely - it has its own classroom
// dashboard and no Manage nav item.
const SCOPED_ROLE_MANAGE_TABS = {
  hod: new Set(["dailyLearning", "fundamentals", "programming", "csCore", "aptitude"]),
};

// Manage's own sub-navigation, portaled into CampusContextSidebar's slot
// (see CampusManage's render below) - a vertical rendering of the exact same
// visibleManageTabs/handleTabClick CampusManage already computed for the old
// inline tab strip, not a second copy of that state.
function ManageSidebarList({ tabs, active, onSelect }) {
  return (
    <>
      <div className="px-1 pb-2 mb-1 text-[10px] font-mono tracking-widest" style={{ color: CAMPUS.inkFaint }}>MANAGE</div>
      {tabs.map(t => (
        <button key={t.key} onClick={() => onSelect(t.key)}
          className="campus-btn flex items-center text-[13px] font-medium px-3 py-2 rounded-lg text-left whitespace-nowrap transition-all duration-150"
          style={{
            background: active === t.key ? CAMPUS.gradientPrimary : "transparent",
            color: active === t.key ? "#fff" : CAMPUS.inkSoft,
            boxShadow: active === t.key ? "0 3px 10px rgba(99,102,241,0.28)" : "none",
          }}>
          {t.label}
        </button>
      ))}
    </>
  );
}

export function CampusManage({ institutionId, institution, initialTab, initialStudentsView, onInstitutionUpdated, jumpToManageTab, sidebarSlot }) {
  // jumpToManageTab lets the mobile nav drawer command an already-mounted
  // Manage into a specific sub-tab (e.g. its in-drawer search result for
  // "students") - the lazy initializer alone covers the common case
  // (CampusManage remounts fresh every time the outer workspace tab
  // switches away from and back to "manage"), the nonce-effect below
  // covers only the rarer case of jumping between sub-tabs while already
  // inside Manage.
  const [tab, setTab] = useState(() =>
    (jumpToManageTab?.tab && MANAGE_TABS.some(t => t.key === jumpToManageTab.tab)) ? jumpToManageTab.tab
    : (initialTab && MANAGE_TABS.some(t => t.key === initialTab)) ? initialTab : "students");

  // A Principal/HOD/Faculty account only sees the tabs its role/permission
  // overrides actually grant - an Institution Admin (isInstAdmin) always
  // sees every tab, same as useHasPermission's own isInstAdmin-bypasses-
  // everything rule. Reads the context once (not per-tab, to stay a single
  // hook call) and checks it with a plain function instead - calling a hook
  // once per tab inside .filter() would break the rules of hooks.
  const { isInstAdmin, permissions, role, department } = useContext(CampusPermissionsContext);
  const hasManagePermission = (key) => !key || isInstAdmin || permissions.has(key);
  // For a role with an allowlist, that list is a hard ceiling INTERSECTED
  // with the usual permission check - never a replacement for it. So a
  // permission override added later (deliberately or by accident) can widen
  // what an HOD does inside Daily Learning, but can never hand them the
  // Departments or Branding editor; and an HOD whose dailyLearning.publish
  // was revoked correctly loses the tab rather than getting an editor whose
  // Save is denied.
  const scopedTabs = isInstAdmin ? null : SCOPED_ROLE_MANAGE_TABS[role];
  const visibleManageTabs = useMemo(
    () => MANAGE_TABS.filter(t => {
      if (scopedTabs && !scopedTabs.has(t.key)) return false;
      if (ADMIN_ONLY_MANAGE_TABS.has(t.key)) return isInstAdmin;
      return hasManagePermission(MANAGE_TAB_PERMISSION[t.key]);
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isInstAdmin, permissions, scopedTabs]
  );
  // If the current tab is no longer one this role can see (e.g. a stale
  // deep link, or permissions changed mid-session), fall back to the first
  // tab actually visible rather than rendering a blank/forbidden panel.
  useEffect(() => {
    if (visibleManageTabs.length && !visibleManageTabs.some(t => t.key === tab)) {
      setTab(visibleManageTabs[0].key);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleManageTabs]);
  // Branding is the one tab whose form can hold real unsaved changes - these
  // three pieces let the tab-switcher intercept a click AWAY from Branding
  // while dirty and show a Save/Discard/Cancel dialog, instead of silently
  // discarding edits (see BrandingUnsavedDialog below). brandingFormRef's
  // imperative handle (isDirty/save/discard) is exposed by ManageBranding ->
  // CampusBrandingForm.
  const [brandingDirty, setBrandingDirty] = useState(false);
  const [pendingTab, setPendingTab] = useState(null);
  const brandingFormRef = useRef(null);
  // Lifted out of ManageStudents (which used to own this itself) so the URL
  // can reflect /manage/students/classrooms as a real, addressable state -
  // this is the one sub-view that got an explicit path segment per the
  // routing request; every other manage tab's internal filters/search/sort
  // stay component-local for now (see ManageStudents/campus-classrooms.jsx),
  // not yet synced to the URL.
  const [studentsView, setStudentsView] = useState(initialStudentsView === "classrooms" ? "classrooms" : "requests");

  useEffect(() => {
    if (!jumpToManageTab?.tab || !MANAGE_TABS.some(t => t.key === jumpToManageTab.tab)) return;
    setTab(jumpToManageTab.tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jumpToManageTab?.nonce]);

  // Same history.replaceState technique as campus-app.jsx's own TAB_URL_SEGMENT
  // effect (a real, bookmarkable/refreshable URL without a Next.js
  // navigation/remount) - just one level deeper, under whatever the current
  // top-level tab's own URL already is.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const segment = MANAGE_TAB_SEGMENT[tab];
    const sub = tab === "students" ? `/${studentsView}` : "";
    const url = `/campus/${institutionId}/manage/${segment}${sub}`;
    window.history.replaceState(null, "", url);
  }, [tab, studentsView, institutionId]);

  // Manage's own tabs are lateral (like the top-level Campus tabs), with
  // Students/Requests & Roster as the true root - one step back from
  // anywhere else in Manage lands there directly, matching how the outer
  // workspace's own tab switch works. See lib/campusNav.js.
  useCampusBackHandler(2, tab !== "students" || studentsView !== "requests", () => {
    if (tab !== "students") { setTab("students"); setStudentsView("requests"); }
    else setStudentsView("requests");
  });

  // The only interception point tab-switching needs: leaving Branding while
  // it has real unsaved changes opens the confirm dialog instead of
  // switching immediately; every other tab switches exactly as before.
  const handleTabClick = (nextKey) => {
    if (tab === "branding" && nextKey !== "branding" && brandingDirty) {
      setPendingTab(nextKey);
      return;
    }
    setTab(nextKey);
  };

  const resolvePendingTab = async (action) => {
    if (action === "save") {
      await brandingFormRef.current?.save();
      // save() itself flips brandingDirty to false via CampusBrandingForm's
      // own onDirtyChange effect before this resolves - if the save FAILED,
      // isDirty stays true and we deliberately do NOT navigate away, so the
      // admin doesn't lose an error they haven't seen yet.
      if (!brandingFormRef.current?.isDirty()) { setTab(pendingTab); setPendingTab(null); }
    } else if (action === "discard") {
      brandingFormRef.current?.discard();
      setTab(pendingTab);
      setPendingTab(null);
    } else {
      setPendingTab(null);
    }
  };

  return (
    <div>
      {/* Manage's own sub-navigation lives in the shared contextual sidebar
          (Navigation Architecture 2.0) instead of an inline tab strip - same
          visibleManageTabs/handleTabClick this file already owned, just
          portaled into the slot CampusWorkspace hands down rather than
          rendered here. sidebarSlot is null the one render before
          CampusContextSidebar's ref callback fires, and on any screen where
          this ever mounted outside that shell (there is none today, but the
          guard costs nothing). */}
      {sidebarSlot && createPortal(
        <ManageSidebarList tabs={visibleManageTabs} active={tab} onSelect={handleTabClick} />,
        sidebarSlot
      )}
      <CampusBreadcrumb className="mb-4" items={[
        { label: "Manage", onClick: tab !== visibleManageTabs[0]?.key ? () => handleTabClick(visibleManageTabs[0]?.key) : undefined },
        { label: MANAGE_TABS.find(t => t.key === tab)?.label || "" },
      ]} />
      {/* Nothing renders unless the active tab is one this caller may
          actually see. The fallback effect above already corrects `tab` to a
          visible one, but it runs AFTER this render commits - and `tab`'s own
          lazy initializer defaults to "students", which is not a tab a
          department-scoped HOD has. Without this guard that ordering shows a
          real flash of the institution-wide Students roster (and, if
          visibleManageTabs is ever empty, shows it permanently, since the
          fallback effect has nothing to correct to). */}
      {!visibleManageTabs.some(t => t.key === tab) ? (
        visibleManageTabs.length === 0 && (
          <CampusEmptyState icon={ShieldCheck} title="Nothing to manage yet"
            description="Your role doesn't currently include any management permissions. Ask an institution admin if you think this is wrong." />
        )
      ) : (
      <>
      {tab === "students" && <ManageStudents institutionId={institutionId} institution={institution}
        studentsView={studentsView} setStudentsView={setStudentsView} />}
      {tab === "departments" && <CampusDepartments institutionId={institutionId} />}
      {tab === "manageAdmins" && <CampusManageAdmins institutionId={institutionId} />}
      {tab === "contests" && <CampusContestsTab institutionId={institutionId} />}
      {tab === "dailyLearning" && <ManageDailyLearning institutionId={institutionId} scopeDepartment={scopedTabs ? department : null} />}
      {tab === "fundamentals" && <ManageModuleAccessOnly institutionId={institutionId} moduleKey="fundamentals" moduleLabel="Fundamentals"
        scopeDepartment={scopedTabs ? department : null}
        description="Fundamentals' curriculum is authored once, platform-wide, in Platform Admin - not per campus. What you control here is which of your classrooms can currently open the module at all." />}
      {tab === "programming" && <ManageModuleAccessOnly institutionId={institutionId} moduleKey="programming" moduleLabel="Programming"
        scopeDepartment={scopedTabs ? department : null}
        description="Programming's language/topic curriculum is authored once, platform-wide, in Platform Admin - not per campus. What you control here is which of your classrooms can currently open the module at all." />}
      {tab === "csCore" && <ManageModuleAccessOnly institutionId={institutionId} moduleKey="csCore" moduleLabel="CS Core"
        scopeDepartment={scopedTabs ? department : null}
        description="CS Core's subject/topic curriculum is authored once, platform-wide, in Platform Admin - not per campus. What you control here is which of your classrooms can currently open the module at all." />}
      {tab === "aptitude" && <ManageModuleAccessOnly institutionId={institutionId} moduleKey="aptitude" moduleLabel="Aptitude"
        scopeDepartment={scopedTabs ? department : null}
        description="Aptitude's topic curriculum is authored once, platform-wide, in Platform Admin - not per campus. What you control here is which of your classrooms can currently open the module at all." />}
      {tab === "practice" && <ManagePracticePreview institutionId={institutionId} />}
      {tab === "companyPrep" && <ManageCompanyPrepPreview institutionId={institutionId} />}
      {tab === "leaderboards" && <ManageLeaderboards institutionId={institutionId} institution={institution} />}
      {tab === "branding" && <ManageBranding ref={brandingFormRef} institutionId={institutionId} institution={institution}
        onDirtyChange={setBrandingDirty} onInstitutionUpdated={onInstitutionUpdated} />}
      </>
      )}
      <BrandingUnsavedDialog pendingTab={pendingTab} onResolve={resolvePendingTab} />
    </div>
  );
}

// Mirrors campus-app.jsx's own CampusExitConfirmDialog visual language
// (backdrop blur, centered card, focus-safe default) - a smaller, local
// version rather than a shared extraction, since this is the only place in
// Manage that needs a 3-way (not 2-way) confirm.
function BrandingUnsavedDialog({ pendingTab, onResolve }) {
  if (!pendingTab) return null;
  return (
    <>
      <div onClick={() => onResolve("cancel")} className="fixed inset-0 z-[70]" style={{ background: "rgba(10,16,20,0.55)", backdropFilter: "blur(4px)" }} />
      <div role="dialog" aria-modal="true" className="fixed z-[71] left-1/2 top-1/2 w-[92vw] max-w-[420px] p-6"
        style={{ background: CAMPUS.surface, border: `1px solid ${CAMPUS.line}`, borderRadius: 16, boxShadow: CAMPUS.shadowLg, transform: "translate(-50%,-50%)" }}>
        <h3 className="text-[15px] font-semibold mb-2" style={{ color: CAMPUS.ink }}>Unsaved branding changes</h3>
        <p className="text-[13px] mb-5" style={{ color: CAMPUS.inkSoft }}>
          You have unsaved branding changes. Do you want to leave without saving?
        </p>
        <div className="flex flex-col gap-2">
          <CampusButton onClick={() => onResolve("save")}>Save & Continue</CampusButton>
          <CampusButton variant="danger" onClick={() => onResolve("discard")}>Discard Changes</CampusButton>
          <button onClick={() => onResolve("cancel")} className="text-[12.5px] font-semibold py-1.5" style={{ color: CAMPUS.inkFaint }}>Cancel</button>
        </div>
      </div>
    </>
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
function ManageLeaderboards({ institutionId, institution }) {
  const { user } = useAuth();
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [weeklySettings, setWeeklySettings] = useState(null);
  const [weeklyBusy, setWeeklyBusy] = useState(false);
  const [weeklyNotice, setWeeklyNotice] = useState(null);
  const [ranked, setRanked] = useState(undefined);
  const [viewingStudentUid, setViewingStudentUid] = useState(null);
  const [rosterByUid, setRosterByUid] = useState(new Map());

  useEffect(() => {
    getDocs(query(collection(db, "users"), where("institutionId", "==", institutionId), orderBy("score", "desc"), limit(100)))
      .then(snap => setRanked(snap.docs.map((d, i) => ({ uid: d.id, rank: i + 1, ...d.data() }))))
      .catch(() => setRanked([]));
    fetchRosterStudents(institutionId).then(rows => setRosterByUid(new Map(rows.map(r => [r.id, r])))).catch(() => {});
  }, [institutionId]);

  const load = () => { fetchLeaderboardSettings(institutionId).then(setSettings); };
  useEffect(load, [institutionId]);

  const loadWeekly = () => { fetchWeeklyLeaderboardSettings(institutionId).then(setWeeklySettings); };
  useEffect(loadWeekly, [institutionId]);

  const currentWeekId = mondayOf();

  const handleAnnounce = async () => {
    if (!user || weeklyBusy) return;
    setWeeklyBusy(true);
    setWeeklyNotice(null);
    try {
      const rows = await announceWeeklyLeaderboard(institutionId, weeklySettings?.currentWeekId || currentWeekId, user.uid);
      setWeeklyNotice({ type: "success", message: `Leaderboard announced and reward conversion unlocked - ${rows.length} student(s) ranked.` });
      loadWeekly();
    } catch (e) {
      setWeeklyNotice({ type: "error", message: e.message || "Failed to announce the leaderboard." });
    } finally {
      setWeeklyBusy(false);
    }
  };

  const handleStartNewWeek = async () => {
    if (!user || weeklyBusy) return;
    setWeeklyBusy(true);
    setWeeklyNotice(null);
    try {
      await startNewLeaderboardWeek(institutionId, currentWeekId);
      setWeeklyNotice({ type: "success", message: "New week started - reward conversion is locked again until this week is announced." });
      loadWeekly();
    } catch (e) {
      setWeeklyNotice({ type: "error", message: e.message || "Failed to start a new week." });
    } finally {
      setWeeklyBusy(false);
    }
  };

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

  if (viewingStudentUid) {
    const rosterStudent = rosterByUid.get(viewingStudentUid);
    const rankedRow = ranked?.find(r => r.uid === viewingStudentUid);
    // Falls back to a minimal synthetic student object built straight from
    // the ranked row if the roster lookup somehow missed this uid (roster
    // and score-ranking are two independent queries) - QuickActions'
    // student-management actions still need real status/email/
    // contestRestricted, which only the roster doc carries, so this
    // fallback is deliberately minimal rather than pretending to have data
    // it doesn't.
    const student = rosterStudent || (rankedRow ? {
      uid: rankedRow.uid, name: rankedRow.displayName || rankedRow.handle || "Student",
      rollNumber: rankedRow.rollNumber, department: rankedRow.department, year: rankedRow.year, section: rankedRow.section,
      status: "approved",
    } : null);
    return (
      <div>
        <CampusBackButton onClick={() => setViewingStudentUid(null)} label="Back to Leaderboards" />
        {student
          ? <StudentAnalyticsDashboard institutionId={institutionId} institution={institution} student={student} onBack={() => setViewingStudentUid(null)} />
          : <CampusEmptyState icon={Trophy} title="Couldn't load this student" description="Try again from the leaderboard list." />}
      </div>
    );
  }

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
                color: (settings.rankingMetric || "score") === m.key ? "#fff" : CAMPUS.inkSoft,
                background: (settings.rankingMetric || "score") === m.key ? CAMPUS.teal : "transparent",
                border: `1px solid ${(settings.rankingMetric || "score") === m.key ? CAMPUS.teal : CAMPUS.line}`,
              }}>
              {m.label}
            </button>
          ))}
        </div>
      </CampusCard>

      <CampusCard className="p-4">
        <p className="text-[10px] font-mono tracking-widest mb-1" style={{ color: CAMPUS.inkFaint }}>WEEKLY LEADERBOARD & REWARD CONVERSION</p>
        <p className="text-[11px] mb-3" style={{ color: CAMPUS.inkFaint }}>
          Students can&apos;t convert XP -&gt; Coins -&gt; Wallet until you announce the week&apos;s leaderboard. There&apos;s no automatic
          weekly reset - &ldquo;Start New Week&rdquo; re-locks conversion for the next cycle, &ldquo;Announce&rdquo; freezes the current
          ranking, unlocks conversion, and notifies every student.
        </p>
        {weeklySettings && (
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <CampusChip color={weeklySettings.rewardConversionLocked !== false ? CAMPUS.bad : CAMPUS.good}>
              {weeklySettings.rewardConversionLocked !== false ? "Conversion locked" : "Conversion unlocked"}
            </CampusChip>
            {weeklySettings.lastAnnouncedWeekId && (
              <span className="text-[10.5px]" style={{ color: CAMPUS.inkFaint }}>
                Last announced: week of {weeklySettings.lastAnnouncedWeekId}
              </span>
            )}
          </div>
        )}
        {weeklyNotice && (
          <p className="text-[12px] px-3 py-2 rounded-lg mb-3" style={{
            background: weeklyNotice.type === "error" ? CAMPUS.badTint : CAMPUS.goodTint,
            color: weeklyNotice.type === "error" ? CAMPUS.bad : CAMPUS.good,
          }}>
            {weeklyNotice.message}
          </p>
        )}
        <div className="flex items-center gap-2 flex-wrap">
          <CampusButton onClick={handleAnnounce} disabled={weeklyBusy || !weeklySettings}>
            {weeklyBusy ? "working..." : "Announce Weekly Leaderboard"}
          </CampusButton>
          <CampusButton variant="secondary" onClick={handleStartNewWeek} disabled={weeklyBusy || !weeklySettings}>
            Start New Week
          </CampusButton>
        </div>
      </CampusCard>

      <CampusCard className="p-4">
        <p className="text-[10px] font-mono tracking-widest mb-3" style={{ color: CAMPUS.inkFaint }}>CAMPUS RANKING (TOP 100 BY SCORE) - CLICK A STUDENT FOR FULL REWARD ANALYTICS</p>
        {ranked === undefined ? (
          <CampusSkeleton variant="rect" height={140} />
        ) : ranked.length === 0 ? (
          <CampusEmptyState size="sm" icon={Trophy} title="No ranked students yet" description="Once students start earning, they'll show up here." />
        ) : (
          <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${CAMPUS.line}` }}>
            {ranked.map((r, i) => (
              <button key={r.uid} onClick={() => setViewingStudentUid(r.uid)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left transition-colors"
                style={{ background: CAMPUS.surface, borderTop: i > 0 ? `1px solid ${CAMPUS.line}` : "none" }}>
                <div className="flex items-center gap-2.5 min-w-0">
                  {i < 3 ? <Medal size={14} style={{ color: CAMPUS.gold, flexShrink: 0 }} /> : <span className="text-[11px] font-mono w-3.5 text-center flex-shrink-0" style={{ color: CAMPUS.inkFaint }}>{r.rank}</span>}
                  <div className="min-w-0">
                    <b className="block text-[13px] truncate" style={{ color: CAMPUS.ink }}>{r.displayName || r.handle || "Student"}</b>
                    <span className="text-[10.5px] font-mono" style={{ color: CAMPUS.inkFaint }}>{r.rollNumber || "-"}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 text-[11.5px] font-mono">
                  <span style={{ color: CAMPUS.teal }}>{(r.xp || 0).toLocaleString()} XP</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </CampusCard>
    </div>
  );
}

// Programming/CS Core have no campus-owned content to manage at all (see
// MODULES' comment in lib/institutions.js) - Platform Admin authors the
// shared curriculum once, for every institution. This tab's only real job is
// surfacing that module's classroom access control in the same place every
// other module's lives, not standing up a parallel content-editing surface
// this campus was never meant to have.
function ManageModuleAccessOnly({ institutionId, moduleKey, moduleLabel, description, scopeDepartment = null }) {
  return (
    <div className="max-w-2xl">
      <h2 className="text-lg font-semibold mb-1" style={{ color: CAMPUS.ink }}>{moduleLabel}</h2>
      <p className="text-[12.5px] mb-4" style={{ color: CAMPUS.inkFaint }}>{description}</p>
      {scopeDepartment && (
        <p className="text-[11px] font-mono tracking-widest mb-3" style={{ color: CAMPUS.inkFaint }}>
          SCOPED TO {scopeDepartment.toUpperCase()}
        </p>
      )}
      <ModuleAccessSummary institutionId={institutionId} moduleKey={moduleKey} moduleLabel={moduleLabel}
        scopeDepartment={scopeDepartment} />
    </div>
  );
}

// forwardRef purely to pass CampusBrandingForm's imperative handle
// (isDirty/save/discard) up to CampusManage's tab-switcher - see
// BrandingUnsavedDialog. onInstitutionUpdated (from CampusWorkspace, via
// CampusManage) is how a successful save propagates instantly to the
// sidebar/top bar/browser title without a refresh - no live Firestore
// listener needed, since the save response IS the current state of the
// document (same "the write is the truth" pattern used elsewhere in this
// app, e.g. handleJoinSubmitted in campus-app.jsx).
const ManageBranding = forwardRef(function ManageBranding({ institutionId, institution, onDirtyChange, onInstitutionUpdated }, ref) {
  return (
    <div className="max-w-lg">
      <h2 className="text-lg font-semibold mb-1" style={{ color: CAMPUS.ink }}>Campus Branding</h2>
      <p className="text-[12.5px] mb-4" style={{ color: CAMPUS.inkFaint }}>
        Customize how {institution?.name || "your campus"} appears in search results and social sharing previews -
        banner, logo, tagline, and accent color. The logo also shows in place of initials in the sidebar and Campus
        directory. There&apos;s no on-page banner display right now - this only affects search/share metadata and the logo.
      </p>
      <CampusBrandingForm ref={ref} institutionId={institutionId} institution={institution}
        onDirtyChange={onDirtyChange} onSaved={onInstitutionUpdated} />
    </div>
  );
});

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

// readOnly is for a department-scoped viewer (HOD). firestore.rules' split is
// "admins/Principal author, HOD/Faculty gate access" - a scoped role's write to
// an institution-wide item is denied, so rendering these controls would just
// produce buttons that fail. The publish toggle is included in that: it's an
// update to the item itself, not an access setting.
function DailyLearningCard({ item, stat, approvedCount, onToggleStatus, onEdit, onDuplicate, onDelete, readOnly = false }) {
  const published = item.status !== "draft";

  return (
    <CampusCard className="p-4" style={!published ? { opacity: 0.6 } : undefined}>
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          {item.type === "test" ? <ClipboardCheck size={13} style={{ color: CAMPUS.purple }} /> : <BookOpen size={13} style={{ color: CAMPUS.teal }} />}
          <span className="text-[11px] font-mono font-semibold" style={{ color: CAMPUS.inkFaint }}>{DOW_LABELS[item.dow].toUpperCase()} - {item.date}</span>
        </div>
        {readOnly
          ? <CampusChip color={published ? CAMPUS.good : CAMPUS.inkFaint}>{published ? "PUBLISHED" : "DRAFT"}</CampusChip>
          : <ToggleSwitch value={published} onChange={(v) => onToggleStatus(v ? "published" : "draft")} />}
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

      {!readOnly && (
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
      )}
    </CampusCard>
  );
}

// scopeDepartment is set for a department-scoped role (HOD) and null for an
// Institution Admin/Principal. It does two things here: narrows the reads that
// are otherwise denied outright for a scoped caller, and turns the authoring
// controls read-only (see DailyLearningCard's readOnly comment).
function ManageDailyLearning({ institutionId, scopeDepartment = null }) {
  const searchParams = useSearchParams();
  const [weekOffset, setWeekOffset] = useState(() => {
    const w = Number(searchParams.get("week"));
    return Number.isFinite(w) ? w : 0;
  });
  // Defaults to "dsa" so an admin who never touches this chip row sees
  // exactly the same behavior as before multi-track existed - the chip row
  // itself is the only new surface, everything below it (week nav, editor,
  // preview) just threads whichever trackId is currently selected through to
  // the same lib/dailyLearning.js calls that already accept one.
  const [trackId, setTrackId] = useState(() => searchParams.get("track") || "dsa");
  const [items, setItems] = useState(undefined);
  const [moduleEnabled, setModuleEnabledState] = useState(true);
  const [approvedCount, setApprovedCount] = useState(0);
  const [stats, setStats] = useState({});
  const [showPreview, setShowPreview] = useState(() => searchParams.get("view") === "preview");
  const [editorState, setEditorState] = useState(null); // null | "new" | an item object
  // The URL can only carry a serializable "which day" (a date string, or
  // "new"), not the full item object editorState ends up holding - this
  // resolves that identifier against `items` once it loads (see the effect
  // below), matching how campus-app.jsx resolves initialContestId the same way.
  const [pendingEditDay, setPendingEditDay] = useState(() => searchParams.get("editDay") || null);
  // Depth 3 - both showPreview and editorState are full-screen replacements
  // of the main list (early returns below, each already has its own
  // CampusBackButton/close), previously entirely unregistered. They're
  // opened independently from the main list, never one from the other, so
  // whichever is open just closes back to the list.
  useCampusBackHandler(3, showPreview || editorState !== null, () => {
    if (editorState !== null) setEditorState(null);
    else setShowPreview(false);
  });
  useEffect(() => {
    if (!items || !pendingEditDay) return;
    setEditorState(pendingEditDay === "new" ? "new" : (items.find(it => it.date === pendingEditDay) || null));
    setPendingEditDay(null);
  }, [items, pendingEditDay]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams();
    if (weekOffset) params.set("week", String(weekOffset));
    if (trackId !== "dsa") params.set("track", trackId);
    if (editorState) params.set("editDay", editorState === "new" ? "new" : editorState.date);
    else if (showPreview) params.set("view", "preview");
    const qs = params.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${qs ? `?${qs}` : ""}`);
  }, [weekOffset, trackId, editorState, showPreview]);
  const weekId = shiftWeek(mondayOf(), weekOffset);

  // allSettled, NOT Promise.all: these three reads have independent rules
  // outcomes, and one rejection used to blank all three at once. That is
  // literally what an HOD saw - the unscoped student count is denied for a
  // scoped caller, so its rejection dropped the whole chain into
  // `.catch(() => setItems([]))` and the screen reported "0 APPROVED STUDENTS"
  // AND "Nothing authored for this week" for a department with 304 students and
  // a fully authored week. Each read now stands or falls on its own.
  const reload = () => {
    Promise.allSettled([
      fetchWeekItems(institutionId, weekId, { includeUnpublished: true }, trackId),
      fetchModuleConfig(institutionId),
      // The unscoped count is denied for a department-scoped caller (an
      // aggregate is evaluated over the whole matched set, and the roster read
      // rule only clears that caller's own department's rows).
      scopeDepartment
        ? fetchApprovedStudentCountByDepartment(institutionId, scopeDepartment)
        : fetchApprovedStudentCount(institutionId),
    ]).then(([itemsRes, cfgRes, countRes]) => {
      setItems(itemsRes.status === "fulfilled" ? itemsRes.value : []);
      if (cfgRes.status === "fulfilled") setModuleEnabledState(cfgRes.value.enabled !== false);
      if (countRes.status === "fulfilled") setApprovedCount(countRes.value);
    });
  };

  useEffect(reload, [institutionId, weekId, trackId]);

  useEffect(() => {
    if (!items?.length) { setStats({}); return; }
    Promise.all(items.map(it => fetchDayLeaderboard(institutionId, it.date, trackId))).then(results => {
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
  }, [items, institutionId, trackId]);

  const toggleModule = async (next) => {
    setModuleEnabledState(next);
    await setModuleEnabled(institutionId, next);
  };

  const toggleDayStatus = async (date, nextStatus) => {
    setItems(prev => prev.map(it => it.date === date ? { ...it, status: nextStatus } : it));
    await setItemStatus(institutionId, date, nextStatus, trackId);
  };

  const handleDuplicate = async (item) => {
    const toDate = window.prompt(`Duplicate "${item.title}" to which date (YYYY-MM-DD)? Must be Monday-Saturday and not already used.`, "");
    if (!toDate) return;
    if (items.some(it => it.date === toDate)) { window.alert("That date already has a day - pick a different one."); return; }
    try {
      await duplicateItem(institutionId, item.date, toDate, trackId);
      reload();
    } catch (e) { window.alert(e.message); }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete "${item.title}" (${item.date})? This can't be undone.`)) return;
    await deleteItem(institutionId, item.date, trackId);
    setItems(prev => prev.filter(it => it.date !== item.date));
  };

  if (items === undefined) return <CampusCard className="p-5 space-y-3"><CampusSkeleton variant="rect" height={100} /></CampusCard>;

  if (editorState) {
    return (
      <DailyLearningItemEditor slug={institutionId} item={editorState === "new" ? null : editorState}
        defaultDate={editorState === "new" ? todayISO() : undefined} trackId={trackId}
        onClose={() => setEditorState(null)}
        onSaved={() => { setEditorState(null); reload(); }} />
    );
  }

  if (showPreview) {
    return (
      <div>
        <CampusBackButton onClick={() => setShowPreview(false)} label="Back to Daily Learning management" />
        <CampusDailyLearningAdminPreview slug={institutionId} weekId={weekId} trackId={trackId} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 flex-wrap">
        {TRACK_CATALOG.map(t => (
          <button key={t.key} onClick={() => setTrackId(t.key)}
            className="text-[11.5px] font-semibold px-3 py-1.5 rounded-lg transition-colors"
            style={{
              color: trackId === t.key ? "#fff" : CAMPUS.inkSoft,
              background: trackId === t.key ? CAMPUS.teal : "transparent",
              border: `1px solid ${trackId === t.key ? CAMPUS.teal : CAMPUS.line}`,
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* The module kill switch writes dailyLearning/_module, an
          institution-WIDE doc with no scope field - so rules deny it for a
          department-scoped role, and showing the toggle would mean an HOD
          flipping the whole campus's module off in the UI while the write
          silently failed. A scoped role gets per-classroom access control
          (below) instead, which is the equivalent power at their own scope. */}
      {!scopeDepartment && (
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
      )}

      <ModuleAccessSummary institutionId={institutionId} moduleKey="dailyLearning" moduleLabel="Daily Learning"
        scopeDepartment={scopeDepartment} />

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button onClick={() => setWeekOffset(w => w - 1)} className="text-[11px] font-mono px-2 py-1 rounded-lg" style={{ border: `1px solid ${CAMPUS.line}`, color: CAMPUS.inkSoft }}>&larr; prev</button>
          <p className="text-[11px] font-mono tracking-widest" style={{ color: CAMPUS.inkFaint }}>
            WEEK OF {weekId} {weekOffset === 0 && "(CURRENT)"} - {approvedCount} APPROVED STUDENTS
            {scopeDepartment ? ` IN ${scopeDepartment.toUpperCase()}` : ""}
          </p>
          <button onClick={() => setWeekOffset(w => w + 1)} className="text-[11px] font-mono px-2 py-1 rounded-lg" style={{ border: `1px solid ${CAMPUS.line}`, color: CAMPUS.inkSoft }}>next &rarr;</button>
        </div>
        <div className="flex items-center gap-2">
          {/* Authoring is admin/Principal-only by design (see firestore.rules'
              dailyLearning comment). A scoped role reads the catalog and
              controls which of its own classrooms can open it. */}
          {!scopeDepartment && (
            <button onClick={() => setEditorState("new")} className="flex items-center gap-1.5 text-[11.5px] font-semibold px-3 py-1.5 rounded-lg"
              style={{ color: "#fff", background: CAMPUS.teal }}>
              <Plus size={12} /> add day
            </button>
          )}
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
              readOnly={!!scopeDepartment}
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
  const searchParams = useSearchParams();
  // "analytics" | "preview" | a problemId
  const [view, setView] = useState(() => searchParams.get("problem") || (searchParams.get("view") === "preview" ? "preview" : "analytics"));
  // Depth 3 - one level under Manage's own depth-2 tab/studentsView handler.
  // This is a real 3-level stack (analytics -> preview -> a specific
  // problem), previously entirely unregistered - Back from any of it used to
  // fall straight through to Manage's own root instead of stepping up one
  // level at a time.
  useCampusBackHandler(3, view !== "analytics", () => setView(view === "preview" ? "analytics" : "preview"));
  const [problems, setProblems] = useState(undefined);
  const [students, setStudents] = useState([]);
  const [visibility, setVisibility] = useState({ hiddenProblemIds: [] });
  const [selectedCategory, setSelectedCategory] = useState(() => searchParams.get("category") || null);
  // Depth 4 - a topic's cohort-analytics drill-down (TopicAnalytics) reached
  // from INSIDE the "analytics" view specifically (view stays "analytics"
  // the whole time, mutually exclusive with depth 3's preview/problemId
  // states), so it needs its own deeper registration - previously missing,
  // which meant Back from TopicAnalytics fell through to Manage's own
  // depth-2 handler and ejected the admin straight to Students instead of
  // stepping back to the topic list one level up.
  useCampusBackHandler(4, selectedCategory !== null, () => setSelectedCategory(null));
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams();
    if (selectedCategory) params.set("category", selectedCategory);
    else if (view !== "analytics" && view !== "preview") params.set("problem", view);
    else if (view === "preview") params.set("view", "preview");
    const qs = params.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${qs ? `?${qs}` : ""}`);
  }, [view, selectedCategory]);

  const reloadVisibility = () => fetchContentVisibility(institutionId).then(setVisibility).catch(() => {});

  useEffect(() => {
    fetchPublishedProblems().then(setProblems).catch(() => setProblems([]));
    fetchApprovedStudents(institutionId).then(setStudents).catch(() => setStudents([]));
    reloadVisibility();
  }, [institutionId]);

  const [cohortProgress, setCohortProgress] = useState(undefined);
  useEffect(() => {
    if (!students.length) { setCohortProgress([]); return; }
    // Batched via documentId() "in" queries (30 uids/chunk, user_codelab_progress
    // docs are keyed by uid directly) instead of one getDoc per student -
    // same fix already applied to fetchContestRegistrations/fetchLeaderboard
    // (lib/contests.js) and fetchClassroomUsers (lib/classroomAnalytics.js).
    (async () => {
      const progressByUid = new Map();
      const uids = students.map(s => s.uid);
      for (let i = 0; i < uids.length; i += 30) {
        const chunk = uids.slice(i, i + 30);
        const snap = await getDocs(query(collection(db, "user_codelab_progress"), where(documentId(), "in", chunk)));
        snap.docs.forEach(d => progressByUid.set(d.id, d.data().solvedProblems || {}));
      }
      setCohortProgress(students.map(s => ({
        uid: s.uid, label: studentLabel(s), rollNumber: s.rollNumber,
        solvedProblems: progressByUid.get(s.uid) || {},
      })));
    })().catch(() => setCohortProgress([]));
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
      <ModuleAccessSummary institutionId={institutionId} moduleKey="dsa" moduleLabel="DSA / Practice" />

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
  const searchParams = useSearchParams();
  const [screen, setScreen] = useState(() => {
    const v = searchParams.get("view");
    if (v === "company" || v === "practice") {
      return { view: v, companyId: searchParams.get("company") || null };
    }
    return { view: "list" };
  });
  // Depth 3, same reasoning as ManagePracticePreview above. CampusCompanyPrepFlow
  // is a real 3-level stack (list -> company -> practice) - "practice" steps
  // up to "company" first, matching the student-facing companyPrepScreen fix
  // in campus-app.jsx, not straight to "list".
  useCampusBackHandler(3, screen.view !== "list", () => {
    if (screen.view === "practice") setScreen({ view: "company", companyId: screen.companyId });
    else setScreen({ view: "list" });
  });
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams();
    if (screen.view !== "list") {
      params.set("view", screen.view);
      if (screen.companyId) params.set("company", screen.companyId);
    }
    const qs = params.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${qs ? `?${qs}` : ""}`);
  }, [screen]);
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
      <ModuleAccessSummary institutionId={institutionId} moduleKey="companyPrep" moduleLabel="Company Vault" />
      <p className="text-[11px] font-mono tracking-widest mb-3" style={{ color: CAMPUS.inkFaint }}>PREVIEW - HIDE/UNHIDE COMPANIES FOR THIS INSTITUTION&apos;S STUDENTS</p>
      <CampusCompanyPrepFlow screen={screen} setScreen={setScreen} adminMode hiddenIds={hiddenIds} onToggleHidden={toggleHidden} />
    </div>
  );
}

// Campus Contest Studio entry point - a Campus admin owns the whole contest
// lifecycle here (create -> questions -> preview -> publish -> dashboard)
// with no separate DeVert-admin approval step anywhere in this flow. Replaces
// the old flat-form InstitutionContestsPanel (superseded, retired) entirely.
function CampusContestsTab({ institutionId }) {
  const searchParams = useSearchParams();
  const [view, setView] = useState(() => {
    const v = searchParams.get("view");
    if (v === "studio" || v === "dashboard" || v === "bank") {
      return { mode: v, contestId: searchParams.get("contestId") || null };
    }
    return { mode: "list" };
  });
  // Depth 3 - studio/dashboard/bank are all flat siblings of "list" (each
  // already steps straight back to list via its own onCancel/onBack prop
  // above), previously entirely unregistered with the back-stack.
  useCampusBackHandler(3, view.mode !== "list", () => setView({ mode: "list" }));
  // Refresh/deep-link persistence: append this tab's own sub-view onto
  // whatever pathname CampusManage's own tab-level effect already wrote,
  // rather than rebuilding the base path here too - keeps this component
  // ignorant of the manage-tab URL segment scheme entirely.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams();
    if (view.mode !== "list") {
      params.set("view", view.mode);
      if (view.contestId) params.set("contestId", view.contestId);
    }
    const qs = params.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${qs ? `?${qs}` : ""}`);
  }, [view]);
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

      <ModuleAccessSummary institutionId={institutionId} moduleKey="contests" moduleLabel="Contests" />

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
// `students` is the filtered, sorted list the admin is looking at, not the whole
// roster. The stat columns are emitted only when the ranking sorts have already
// loaded users/{uid} - writing 0 for every student because the optional fetch
// never ran would look like real data saying nobody has any XP.
function exportRosterCsv(students, institutionName, { statsByUid } = {}) {
  const statCols = statsByUid ? ",xp,score,problemsSolved,streak" : "";
  const header = `rank,name,rollNumber,department,year,section,status,email,contestRestricted,requestedAt${statCols}`;
  const rows = students.map((s, i) => {
    const requestedAt = s.requestedAt?.toDate ? s.requestedAt.toDate().toISOString() : "";
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const u = statsByUid?.get(s.uid) || {};
    const cells = [
      // Position in the export, so a ranked export stays ranked after the
      // spreadsheet's own sort inevitably gets applied to it.
      i + 1,
      s.name, s.rollNumber, s.department, s.year, s.section, s.status, s.email,
      s.contestRestricted ? "yes" : "no", requestedAt,
    ];
    if (statsByUid) cells.push(u.xp || 0, u.score || 0, u.problemsSolvedCount || 0, u.streak || 0);
    return cells.map(esc).join(",");
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
          className="campus-btn text-[12px] font-semibold px-3.5 py-2 rounded-xl transition-all duration-150"
          style={{
            background: studentsView === o.key ? CAMPUS.gradientPrimary : "transparent",
            color: studentsView === o.key ? "#fff" : CAMPUS.inkFaint,
            boxShadow: studentsView === o.key ? "0 3px 10px rgba(99,102,241,0.28)" : "none",
          }}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

function ManageStudents({ institutionId, institution, studentsView, setStudentsView }) {
  const { user } = useAuth();
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

  const [filters, setFilters] = useState(DEFAULT_ROSTER_FILTERS);
  const [sort, setSort] = useState("cohortAsc");
  const [pendingFilters, setPendingFilters] = useState(DEFAULT_ROSTER_FILTERS);
  const [pendingSort, setPendingSort] = useState("joinedAsc");
  // users/{uid} stats (xp / score / streak / problemsSolvedCount) live outside
  // the roster doc, so the performance sorts need one extra batched pass. Loaded
  // lazily the first time such a sort is picked and then kept - an admin who
  // only ever sorts by roll number never pays for it. See loadStats below.
  const [statsByUid, setStatsByUid] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
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
  // Depth 3, one level deeper than CampusManage's own depth-2 handler above
  // (tab/studentsView) - without this, Back while a student's profile was
  // open silently changed the (invisible, since viewingStudent's early
  // return skips rendering the roster/requests view entirely) studentsView
  // state instead of closing the profile, and the NEXT Back press then fell
  // through to CampusWorkspace's depth-1 handler, ejecting the admin out of
  // Manage entirely instead of back to the roster.
  useCampusBackHandler(3, viewingStudentUid !== null, () => setViewingStudentUid(null));

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

  // Filter, then sort - never the reverse. Sorting the full roster and then
  // filtering would do the expensive pass over rows that are about to be thrown
  // away, and `sortRoster` is what assigns rank position for the ranked sorts,
  // so it has to see exactly the rows being displayed.
  const filteredApproved = useMemo(() => {
    const rows = applyRosterFilters(approved, filters);
    return sortRoster(rows, sort, { statsByUid, dateField: "reviewedAt" });
  }, [approved, filters, sort, statsByUid]);

  const filteredPending = useMemo(() => {
    const rows = applyRosterFilters(pending, pendingFilters);
    return sortRoster(rows, pendingSort, { dateField: "requestedAt" });
  }, [pending, pendingFilters, pendingSort]);

  // Fetched by the roster's own uids rather than by re-querying users on
  // department/year/section - reusing fetchClassroomUsers inherits its
  // documentId()-in-chunks-of-30 shape and the drift argument in its comment
  // (a suspended student's users doc can stop matching their roster row).
  // 276 students is 10 queries; a failure leaves the ranking sorts falling back
  // to name order rather than silently ordering everyone as 0.
  const handleSortChange = async (nextSort) => {
    setSort(nextSort);
    if (!sortNeedsStats(nextSort) || statsByUid || statsLoading || !approved.length) return;
    setStatsLoading(true);
    try {
      const users = await fetchClassroomUsers(approved.map(s => s.uid));
      setStatsByUid(new Map(users.map(u => [u.uid, u])));
    } catch (e) {
      console.error(e);
      setError("Couldn't load student XP and scores, so ranking sorts are unavailable. Everything else still works.");
    } finally {
      setStatsLoading(false);
    }
  };

  const ranked = sortIsRanked(sort) && !!statsByUid;
  const statOf = (uid, field) => statsByUid?.get(uid)?.[field] || 0;

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

  // Scoped to the rows currently passing the filters, never to the whole
  // roster - "select all" next to a filtered list of 259 has to mean those 259.
  // Rows selected under a previous filter are deliberately left alone by both
  // branches, so building a selection across two cohorts works.
  const allVisibleSelected = filteredApproved.length > 0
    && filteredApproved.every(s => selectedUids.has(s.uid));

  const toggleSelectAllVisible = () => {
    setSelectedUids(p => {
      const next = new Set(p);
      if (allVisibleSelected) filteredApproved.forEach(s => next.delete(s.uid));
      else filteredApproved.forEach(s => next.add(s.uid));
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
          <ReportDownloadButton label="Export Requests" size="sm" getReport={() => gatherPendingRequestsReport(institutionId, institution?.name)} />
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

      {/* Status/flag filters are off here: every row in this list is pending by
          definition, and a request has no classroom or contest restriction yet. */}
      {pending.length > 0 && (
        <RosterToolbar
          students={pending}
          filters={pendingFilters} onFiltersChange={setPendingFilters}
          sort={pendingSort} onSortChange={setPendingSort}
          sortOptions={PENDING_SORTS}
          showStatusFilters={false}
          resultCount={filteredPending.length} totalCount={pending.length}
          searchPlaceholder="Search requests by name, roll number or email..."
        />
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
          Students {!loading && (
            <span style={{ color: CAMPUS.inkFaint }}>
              ({filteredApproved.length === approved.length
                ? approved.length
                : `${filteredApproved.length} of ${approved.length}`})
            </span>
          )}
        </h2>
        <div className="flex gap-2">
          <CampusButton variant="secondary" size="sm" icon={Megaphone} onClick={() => setComposing(o => !o)}
            disabled={approved.length === 0}>
            {selectedUids.size > 0 ? `Message ${selectedUids.size} selected` : "Send announcement"}
          </CampusButton>
          {/* Exports exactly what is on screen, in the order it is on screen -
              an export that quietly ignored the filters would be the single
              most misleading button here. */}
          <CampusButton variant="secondary" size="sm" icon={Download}
            onClick={() => exportRosterCsv(filteredApproved, institution?.name, { statsByUid })}
            disabled={filteredApproved.length === 0}>
            {filteredApproved.length === approved.length ? "Export roster CSV" : `Export ${filteredApproved.length} shown`}
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
              className="text-[12px] font-semibold px-3 py-1.5 rounded-lg disabled:opacity-50" style={{ background: CAMPUS.chromeBg, color: CAMPUS.chromeFg }}>
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

      {approved.length > 0 && (
        <RosterToolbar
          students={approved}
          filters={filters} onFiltersChange={setFilters}
          sort={sort} onSortChange={handleSortChange}
          sortOptions={ROSTER_SORTS}
          statsLoading={statsLoading}
          resultCount={filteredApproved.length} totalCount={approved.length}
        />
      )}

      {/* Makes the filters actionable rather than merely visual: filter to
          CSE(AI&ML) III Year, select all 259, message exactly them. Selecting
          only ever adds the currently-visible rows and clearing only ever drops
          them, so a selection built across two different filters is preserved
          instead of being silently discarded by the next filter change. */}
      {filteredApproved.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <label className="text-[11.5px] font-semibold inline-flex items-center gap-1.5 cursor-pointer" style={{ color: CAMPUS.inkSoft }}>
            <input type="checkbox" checked={allVisibleSelected}
              onChange={() => toggleSelectAllVisible()} style={{ accentColor: CAMPUS.teal }} />
            Select all {filteredApproved.length} shown
          </label>
          {selectedUids.size > 0 && (
            <>
              <span className="text-[11px] font-mono" style={{ color: CAMPUS.teal }}>{selectedUids.size} selected</span>
              <button onClick={() => setSelectedUids(new Set())} className="text-[11px] font-semibold" style={{ color: CAMPUS.inkFaint }}>
                Clear selection
              </button>
            </>
          )}
        </div>
      )}

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
                      className="text-[12px] font-semibold px-3 py-1.5 rounded-lg disabled:opacity-50" style={{ background: CAMPUS.chromeBg, color: CAMPUS.chromeFg }}>
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
                  {/* Only under a ranking sort - a position number next to a
                      list sorted by roll number would be meaningless. */}
                  {ranked && (
                    <span className="flex-shrink-0 text-[11px] font-mono font-bold w-7 text-right"
                      style={{ color: i < 3 ? CAMPUS.gold : CAMPUS.inkFaint }}>
                      #{i + 1}
                    </span>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <b className="text-[13px]" style={{ color: CAMPUS.ink }}>{s.name || "(no name)"}</b>
                      {s.status === "suspended" && <CampusChip color={CAMPUS.bad}>SUSPENDED</CampusChip>}
                      {s.contestRestricted && <CampusChip color={CAMPUS.warn}>CONTEST RESTRICTED</CampusChip>}
                    </div>
                    <span className="text-[11px] font-mono" style={{ color: CAMPUS.inkFaint }}>
                      {/* `year` holds a canonical string ("III Year"), so the
                          old `Year ${s.year}` here rendered "Year III Year". */}
                      {s.rollNumber} {s.department && `· ${s.department}`} {s.year && `· ${s.year}`} {s.section && `· Sec ${s.section}`}
                    </span>
                  </div>
                  {statsByUid && (
                    <span className="flex-shrink-0 text-[11px] font-mono hidden sm:inline" style={{ color: CAMPUS.purple }}>
                      {statOf(s.uid, "xp").toLocaleString()} XP · {statOf(s.uid, "score").toLocaleString()} pts
                    </span>
                  )}
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
                          (not just suspended) and their roll number becomes claimable again. To rejoin, they&apos;ll have to submit a
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

      <CampusEmailMigration institutionId={institutionId} />
    </div>
  );
}
