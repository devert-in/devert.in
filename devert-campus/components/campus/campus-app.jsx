"use client";

import { useEffect, useMemo, useRef, useState, Suspense } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  BookOpen, ClipboardCheck, BarChart3,
  ShieldCheck, Clock, XCircle, Ban, LogOut, IdCard, ArrowLeft,
  Mail, Phone, GraduationCap, Building2, Hash, Rocket, Target,
  ChevronRight, ChevronDown, ArrowUpRight, Medal, Code2, Briefcase,
  PanelLeftClose, PanelLeftOpen,
  Megaphone, Share2, Link2, Bookmark, BookmarkCheck, Check,
  AlertTriangle, DoorOpen, Lock, Star, Repeat, Menu, CodeXml, BrainCircuit, Calculator,
  Zap, Coins as CoinsIcon, Camera, Loader2, Flame, TrendingUp,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  db, storage, collection, query, where, orderBy, limit, getDocs, doc, onSnapshot,
  storageRef, uploadBytes, getDownloadURL,
} from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import {
  fetchInstitution, fetchMyMembership, requestToJoin,
  fetchMyInstitutionAdminRole, toggleFavoriteInstitution, fetchAnnouncements, isAnnouncementActive,
  institutionInitials, DEPARTMENTS, YEARS,
  fetchLeaderboardSettings, fetchClassroom, fetchClassrooms, classroomKey, LEADERBOARD_METRICS,
  isModuleEnabledForClassroom,
  fetchMyRoleAssignment, fetchRolePermissionDefaults,
} from "@/lib/institutions";
import { ROLE_CATALOG } from "@/lib/permissions";
import { CampusPermissionsContext } from "@/lib/campusPermissions";
import Dropdown from "@/components/dropdown";
import { fetchPublishedInstitutionContests, fetchPublishedContests, bucketContests, contestMatchesStudent } from "@/lib/contests";
import { CODELAB_DIFFICULTIES, fetchUserCodelabProgress, fetchPublishedProblems } from "@/lib/codelab";
import { subscribeToProblemNotes, isRevisionDue } from "@/lib/problemNotes";
import { CAMPUS, campusPhotoBg, tint } from "@/lib/campus-theme";
import { slideUp, staggerContainer } from "@/lib/campus-motion";
import { fetchDashboardInsights, levelFromXp } from "@/lib/campusDashboard";
import {
  DashboardHero, WeeklyProgressCard, RecentActivityCard,
  ContestCtaBanner, WeakTopicsCard, UpcomingCard, DashboardStatPill,
  GoalsRingsCard, DashboardProfileCard, ContinueLearningTiles,
} from "@/components/campus/campus-dashboard-widgets";
import {
  CampusCard, CampusChip, CampusProgressBar, CampusStat, CampusGoogleButton,
  CampusSkeleton, CampusEmptyState, CampusButton, CampusTable, CampusBackButton,
  CampusTabBar,
} from "@/components/campus/campus-ui";
import { CampusContestFlow } from "@/components/campus/campus-contests";
import { CampusPracticeList, CampusProblemView, SidebarFilterGroup, CategoryFilterList, CompanyFilterList } from "@/components/campus/campus-practice";
import { CampusDsaConcepts } from "@/components/campus/campus-dsa-concepts";
import { CampusDsaSheets } from "@/components/campus/campus-dsa-sheet";
import { CampusCompanyPrepFlow } from "@/components/campus/campus-company-prep";
import { fetchPublishedCompanies } from "@/lib/companyPrep";
import { CampusLearningSection } from "@/components/campus/campus-learning";
import { CampusDailyLearningLanding, CampusDailyAssessmentsTab, CampusDayLeaderboard } from "@/components/campus/campus-daily-learning";
import { CampusFundamentalsTab } from "@/components/campus/campus-fundamentals";
import { CampusProgrammingTab } from "@/components/campus/campus-programming";
import { CampusCsCoreTab } from "@/components/campus/campus-cscore";
import { CampusRoadmapsTab } from "@/components/campus/campus-roadmaps";
import { CampusAptitudeTab } from "@/components/campus/campus-aptitude";
import { ProfileTab } from "@/components/campus/campus-profile";
import { CampusGateTab } from "@/components/campus/gate/gate-app";
import { mondayOf, DOW_LABELS, todayISO, fetchWeekItems } from "@/lib/dailyLearning";
import { pingActivity, PING_INTERVAL_MIN } from "@/lib/activity";
import { useCampusBackHandler, popCampusBack, OVERLAY_BACK_DEPTH } from "@/lib/campusNav";
import { fetchContentVisibility } from "@/lib/contentVisibility";
import { CampusManage, SEGMENT_TO_MANAGE_TAB } from "@/components/campus/campus-manage";
import { CampusAdminOverview } from "@/components/campus/campus-admin-overview";
import { CampusStaffOverview } from "@/components/campus/campus-staff-overview";
import { CampusHodDashboard, CampusPrincipalDashboard } from "@/components/campus/campus-departments";
import { CampusFacultyDashboard } from "@/components/campus/campus-classrooms";
import { NAV_ITEMS, GROUP_ORDER } from "@/lib/campusNavConfig";
import { CampusMobileDrawer } from "@/components/campus/campus-mobile-drawer";
import { CampusSidebarSearch } from "@/components/campus/campus-search";
import { CampusStaffLogin } from "@/components/campus/campus-staff-login";
import { CampusThemeProvider, useCampusTheme, CampusThemeToggle, CampusShell } from "@/components/campus/campus-theme-provider";
// The public front door at /campus. Lives in its own module because it shares
// nothing with the authenticated workspace below except the theme provider and
// the CampusCard/Chip primitives - it is a marketing/discovery surface, not a
// tab of the workspace, and keeping it here made this file the only place a
// logged-out visitor's whole first impression was buried inside 3,000 lines of
// membership-phase machinery.
import { CampusLanding, CampusInfoPage } from "@/components/campus/campus-landing";
// The one public header, shared by the marketing pages (through campus-landing)
// and by CampusGlobalSection/the institution gate screens below - so a visitor
// never loses the nav by following one of its own links. Imported here, not
// inside campus-theme-provider.jsx, precisely because that file must stay free
// of Campus feature imports: campus-public-nav.jsx reads useCampusTheme from it,
// and the reverse import would close the cycle.
import { CampusPublicNav } from "@/components/campus/campus-public-nav";
import { GLOBAL_SECTIONS, LANDING_PAGE_SECTIONS } from "@/lib/campus-seo";

// DeVert Campus is a deliberately separate "academic" surface - see the design
// proposal shared with the team for why (Builder's OS's dark terminal theme is
// wrong for faculty/placement officers who aren't developers) - but unlike
// Builder's OS, Campus supports BOTH light and dark, toggled independently of
// the rest of the site (which stays permanently dark) and persisted to
// localStorage. Every CAMPUS.* color is a CSS var (see lib/campus-theme.js),
// scoped under the .campus-theme class with the light/dark values swapped via
// this data-theme attribute - so toggling repaints every component below
// without threading a resolved-color prop through each one.
// components/navbar.jsx (+footer/command-palette/window-layer) suppresses all
// DeVert chrome on every /campus/* route; this component owns its own chrome
// entirely, right down to color-scheme. Just as important: NOTHING in this
// surface navigates back out to devert.in except the one explicit "Return to
// DeVert" link - Contests/Practice/Daily Learning are all native, full
// implementations living here (components/campus/campus-{contests,practice,
// learning}.jsx), reusing the exact same lib/*.js data/grading/reward logic
// the main dark app uses, not links out to it.
// Contests/Learning/Practice are usable before picking a college at all
// (none of the underlying data is institution-scoped), so they get their own
// real top-level paths rather than living as view-state nested under
// /campus - anything else after /campus is treated as an institution slug.
// Defined in lib/campus-seo.js (not here) so app/campus/[slug]/page.jsx - a
// server component - can import the same list at build time; re-exported
// under this name for every existing call site in this file.

// Maps a login page's own URL segment to the roleKey lib/permissions.js's
// ROLE_CATALOG uses - "faculty" is the public-facing/URL name for what the
// data model calls "facultyClassTeacher" (Faculty and Class Teacher are one
// unified role, not two - see lib/permissions.js's own comment).
const STAFF_LOGIN_ROLE = { principal: "principal", hod: "hod", faculty: "facultyClassTeacher" };

export function CampusApp({ initialTab }) {
  const pathname = usePathname();
  // No leading "campus" segment to drop anymore - this app IS the root of
  // campus.devert.in, so the institution slug (or a global section name) is
  // the first path segment, not the second.
  const [first, second, third, fourth] = pathname.split("/").filter(Boolean);

  // key={first} forces a full remount whenever the section/college itself
  // changes (Contests -> Learning, or one college -> another) - without it,
  // React reuses the same CampusGlobalSection/CampusWorkspace instance across
  // navigations (same position in the tree, only props differ), so internal
  // state like contestScreen/practiceScreen/tab survives when it shouldn't -
  // e.g. leaving a specific contest open, navigating to a different section
  // or college, then back, would reopen that stale contest instead of a
  // fresh list.
  let body;
  if (!first) {
    body = <CampusLanding />;
  } else if (LANDING_PAGE_SECTIONS.includes(first)) {
    // Marketing/info pages (Campuses, For institutions, Pricing) - the landing
    // page's own chrome and bands, NOT the learning shell below. They are
    // separate routes rather than anchors on /campus so each can be linked,
    // shared and indexed on its own. No Suspense wrapper: unlike
    // CampusGlobalSection these read no search params.
    body = <CampusInfoPage section={first} />;
  } else if (GLOBAL_SECTIONS.includes(first)) {
    // CampusGlobalSection reads ?open=/?category=/?problem= via
    // useSearchParams() too - same Suspense requirement as CampusWorkspace
    // below. Only surfaced once these 3 paths were added to
    // generateStaticParams (see app/campus/[slug]/page.jsx) - before that,
    // this branch only ever rendered client-side, where the requirement
    // doesn't bite.
    body = <Suspense fallback={null}><CampusGlobalSection key={first} section={first} /></Suspense>;
  } else {
    // /campus/{slug}/principal|hod|faculty - dedicated, admin-provisioned-
    // only login pages (see components/campus/campus-staff-login.jsx). These
    // deliberately reuse this SAME router/CampusThemeProvider tree rather
    // than a fourth parallel one - same reasoning as GLOBAL_SECTIONS above,
    // just keyed on `second` instead of `first` since these are nested under
    // one specific institution.
    if (STAFF_LOGIN_ROLE[second] && !third) {
      return <CampusThemeProvider><CampusStaffLogin slug={first} roleKey={STAFF_LOGIN_ROLE[second]} /></CampusThemeProvider>;
    }

    // /campus/{slug}/manage/{tabSegment}/{studentsSubView} - resolved back
    // into (manage tab key, students sub-view) via the same segment table
    // campus-manage.jsx's own URL-sync effect writes with, so a direct load,
    // refresh, or shared link lands on the right tab instead of always
    // defaulting to Students.
    const isManage = second === "manage";
    body = (
      // CampusWorkspace reads ?problem=/?company= via useSearchParams() (see
      // its practiceScreen/companyPrepScreen initializers) - Next's static
      // export prerendering requires that behind a Suspense boundary, same
      // as /campus/page.jsx's own top-level useSearchParams() usage.
      <Suspense fallback={null}>
        <CampusWorkspace key={first} slug={first} initialTab={initialTab}
          initialContestId={second === "contest" ? third : null}
          initialManageTab={isManage ? (SEGMENT_TO_MANAGE_TAB[third] || "students") : undefined}
          initialManageStudentsView={isManage && fourth === "classrooms" ? "classrooms" : undefined} />
      </Suspense>
    );
  }

  return <CampusThemeProvider>{body}</CampusThemeProvider>;
}

function Centered({ children }) {
  return <p className="text-sm" style={{ color: CAMPUS.inkFaint }}>{children}</p>;
}

// Every institution gate screen (checking / not-found / signed-out / join form /
// pending / rejected / suspended) with the public header on top.
//
// These are Campus pages too. Someone who follows a shared link to
// /campus/{slug} while signed out used to get a single centred card and one
// small "Back to Campus" corner link - no way to reach Learn, Practice or
// Contests, all of which are open to them right now without any college
// approving anything. The nav is the fix, and CampusShell takes it as a slot so
// the staff login pages can keep the bare version.
function CampusGateShell({ children }) {
  return <CampusShell nav={<CampusPublicNav />}>{children}</CampusShell>;
}

// THE LEFT NAV RAIL THAT USED TO LIVE HERE IS GONE, deliberately.
//
// It listed every Learn module, every Practice mode and Contests down the side
// of whichever one you had actually opened. So following "Programming" from the
// landing page's own menu landed you on a screen whose most prominent element
// was a list of the six things you had NOT asked for - and the real nav, the one
// you had just used, disappeared at the same moment because it only existed on
// the marketing pages. Two competing navigation systems, and the wrong one won
// on the page where you were trying to read.
//
// CampusPublicNav (campus-public-nav.jsx) is now on every public Campus page,
// carrying the same tree in its mega-menus, so a section renders ONLY the thing
// that was clicked. Switching modules is a real navigation to a real URL rather
// than hidden component state, which is what the searchParams sync in
// CampusGlobalSection below exists to honour.

// The public Learn hub's modules, in rail order.
//
// `programming` is the default, NOT the `courses` catalog that used to be this
// route's only surface. CampusLearningSection gates itself behind a "Sign in to
// continue" card (it reads user_learning/{uid} for enrollment), so a logged-out
// visitor following "Learn" landed on a wall - the same dead end the /campus
// redesign exists to remove, just one level deeper. Programming reads only
// world-readable central content, so it works signed out, and the catalog stays
// one rail click away at the bottom.
//
// `?tab=` is NOT a convention invented here: CampusProgrammingTab,
// CampusCsCoreTab, CampusAptitudeTab and SeCourseApp (via
// CampusFundamentalsTab's staticQuery) each write exactly this key into the URL
// from their own replaceState effects. Seeding this state from the same key is
// what makes a deep link round-trip instead of fighting the component that owns
// the URL below it - the alternative, a separate ?module= param, would have
// left two competing writers on one address bar.
const LEARN_MODULES = ["programming", "csCore", "fundamentals", "aptitude", "courses"];

// Practice's four surfaces. "sheets"/"concepts" mirror the authenticated DSA
// tab's own Sheet/Concepts/Problems trio (see dsaMode in CampusWorkspace) -
// the same components, unscoped, because none of that content is
// institution-owned.
const PRACTICE_MODES = ["coding", "companyPrep", "sheets", "concepts"];


// CodeLab-specific (Company Vault tracks its own solved/bookmarked counts
// per question instead, shown inline as you practice) - only ever rendered
// next to DSA. Skeleton while the two fetches settle, a sign-in prompt if
// there's no uid to key progress on at all.
// Top-of-page DSA progress summary for the Workspace's own DSA tab (distinct
// from PracticeProgressCard below, which is CodeLab's own sidebar widget for
// the pre-auth global Practice section) - solved count across ALL published
// problems, not scoped to whatever category/difficulty filter is currently
// active, so switching filters never makes this number jump around.
function DsaProgressSummary({ user }) {
  const [state, setState] = useState({ loading: true, solved: 0, total: 0 });
  // Study-card metadata (favorites/needs-revision/due) is a live subscription,
  // not part of the Promise.all above - a toggle made on a card below this
  // summary should update these counts immediately, same reasoning as
  // CampusPracticeList's own subscribeToProblemNotes usage.
  const [studyStats, setStudyStats] = useState({ favorites: 0, needsRevision: 0, due: 0 });

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchPublishedProblems(), user ? fetchUserCodelabProgress(user.uid) : Promise.resolve(null)])
      .then(([problems, progress]) => {
        if (cancelled) return;
        setState({ loading: false, total: problems.length, solved: Object.keys(progress?.solvedProblems || {}).length });
      })
      .catch(() => { if (!cancelled) setState({ loading: false, solved: 0, total: 0 }); });
    return () => { cancelled = true; };
  }, [user]);

  useEffect(() => {
    if (!user) { setStudyStats({ favorites: 0, needsRevision: 0, due: 0 }); return; }
    return subscribeToProblemNotes(user.uid, (map) => {
      const notes = Object.values(map);
      setStudyStats({
        favorites: notes.filter(n => n.favorite).length,
        needsRevision: notes.filter(n => n.needsRevision).length,
        due: notes.filter(isRevisionDue).length,
      });
    });
  }, [user]);

  if (state.loading || state.total === 0) return null;
  const pct = Math.round((state.solved / state.total) * 100);
  const hasStudyStats = studyStats.favorites > 0 || studyStats.needsRevision > 0 || studyStats.due > 0;

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11.5px] font-semibold" style={{ color: CAMPUS.ink }}>DSA Progress</span>
        <span className="text-[11.5px] font-mono" style={{ color: CAMPUS.inkFaint }}>{state.solved}/{state.total} solved</span>
      </div>
      <CampusProgressBar pct={pct} color={CAMPUS.teal} />
      {hasStudyStats && (
        <div className="flex items-center gap-4 mt-2.5 flex-wrap">
          {studyStats.favorites > 0 && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: CAMPUS.gold }}>
              <Star size={11} fill={CAMPUS.gold} /> {studyStats.favorites} favorite{studyStats.favorites === 1 ? "" : "s"}
            </span>
          )}
          {studyStats.needsRevision > 0 && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: CAMPUS.purple }}>
              <Repeat size={11} /> {studyStats.needsRevision} need{studyStats.needsRevision === 1 ? "s" : ""} revision
            </span>
          )}
          {studyStats.due > 0 && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: CAMPUS.bad }}>
              <AlertTriangle size={11} /> {studyStats.due} due for revision
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function PracticeProgressCard({ user, stats }) {
  return (
    <div className="rounded-xl p-4" style={{ background: CAMPUS.surface, border: `1px solid ${CAMPUS.line}` }}>
      <p className="text-[9px] font-mono tracking-widest mb-2.5" style={{ color: CAMPUS.inkFaint }}>PROGRESS</p>
      {!user ? (
        <p className="text-[12px] leading-relaxed" style={{ color: CAMPUS.inkFaint }}>Sign in to track solved problems.</p>
      ) : !stats ? (
        <CampusSkeleton variant="text" width="70%" />
      ) : (
        <>
          <CampusProgressBar pct={stats.total ? (stats.solved / stats.total) * 100 : 0} />
          <p className="text-[12px] mt-2.5" style={{ color: CAMPUS.inkSoft }}>
            <b style={{ color: CAMPUS.ink }}>{stats.solved}</b> of {stats.total} problems solved
          </p>
        </>
      )}
    </div>
  );
}

function SectionHeading({ icon: Icon, title, action }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <Icon size={16} style={{ color: CAMPUS.teal }} />
      <h2 className="text-[15px] font-semibold flex-1" style={{ color: CAMPUS.ink }}>{title}</h2>
      {action}
    </div>
  );
}

// The institution card, the contest teaser row and the whole /campus front
// door used to live here. They now live in components/campus/campus-landing.jsx
// - see the import at the top of this file for why. Everything remaining below
// belongs to an authenticated, institution-scoped workspace.

// ---------------- Global sections (/campus/contests, /campus/learning, /campus/practice) ----------------

// Real, dedicated, linkable paths for the pre-auth-usable flows (see
// GLOBAL_SECTIONS above) - CampusContestFlow/CampusLearningSection/
// CampusPracticeList here are the exact same components the authenticated
// Workspace tabs render below, and they now render in the same rounded
// CampusCard vocabulary too: .campus-sharp used to flatten this whole surface
// and came off with the landing redesign (see campus-landing.jsx's CampusLanding
// for the reasoning).
//
// EXACTLY ONE THING RENDERS HERE - whichever module the URL names, and nothing
// else. Navigation between modules belongs to CampusPublicNav at the top of the
// page, not to a rail listing every sibling of the thing you just opened.
//
// `atTop` only shows this section's own "back" control at the section's own
// list level - CampusContestFlow/CampusProblemView already render their own
// "Back" once you're inside a contest or problem, and showing both at once is
// exactly the stacked-back-button pattern this was meant to replace.
function CampusGlobalSection({ section }) {
  const { theme } = useCampusTheme();
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [contests, setContests] = useState([]);
  const [contestsLoading, setContestsLoading] = useState(section === "contests");
  const [contestsError, setContestsError] = useState(false);
  const [contestScreen, setContestScreen] = useState({ view: "list" });
  // The portal target the active module renders its own contextual sub-nav
  // into. State, not a ref: mutating a ref's .current does not re-render, so the
  // module would be handed `undefined` on the render that matters and portal
  // nothing. Same callback-ref-into-state pattern CampusWorkspace already uses
  // for its own sidebar.
  const [sidebarEl, setSidebarEl] = useState(null);

  // WHICH MODULE THIS HUB IS SHOWING IS DERIVED FROM THE URL, NOT MIRRORED INTO
  // STATE - and that is the whole fix for "clicking Programming should open
  // Programming and nothing else".
  //
  // Switching modules is a real navigation now that the shared nav does it:
  // "CS Core" is a <Link> to /campus/learning?tab=csCore. But CampusApp keys
  // this component on the FIRST path segment only (key={first}), and that stays
  // "learning" across such a link - React reuses this exact instance and nothing
  // remounts. Read-once-at-mount state therefore went deaf: the address bar said
  // csCore while the page kept rendering Programming. Deriving leaves exactly
  // one source of truth, so there is no second copy to fall out of step and no
  // sync effect to cascade a render.
  //
  // Safe against the modules that own the URL below this: CampusProgrammingTab,
  // CampusCsCoreTab and CampusAptitudeTab each replaceState their own
  // ?lang=/?subject=/?topic= state, and every one of them writes its own ?tab=
  // back unchanged, so this reads the same value it already had. Fundamentals
  // and Courses never touch the URL at all.
  const learnModule = useMemo(() => {
    const t = searchParams.get("tab");
    return LEARN_MODULES.includes(t) ? t : "programming";
  }, [searchParams]);

  // Practice's own switch. Unlike ?tab=, an ABSENT ?mode= is meaningful here -
  // it is exactly what "DSA Problems" links to (/campus/practice) - so it falls
  // back to coding rather than being ignored.
  const practiceMode = useMemo(() => {
    const m = searchParams.get("mode");
    return PRACTICE_MODES.includes(m) ? m : "coding";
  }, [searchParams]);

  // Which surfaces have anything to put in the rail. The four learning modules
  // each portal their own list into `sidebarEl` (Programming's languages, CS
  // Core's subjects, Aptitude's topics, Fundamentals' modules); "courses" is the
  // enrollable catalog and portals nothing, and Contests has no sub-navigation
  // at all. Practice earns the rail only in coding mode, for the progress card.
  // GATE always earns the rail: CampusGateTab portals its own sixteen-section
  // GateSidebarNav into the slot (see gate-app.jsx), which on desktop is the
  // ONLY way to move between its sections - without a slot it renders no
  // sub-nav at all and the module comes out as a single unnavigable column.
  const showSidebar = (section === "learning" && learnModule !== "courses")
    || (section === "practice" && practiceMode === "coding")
    || section === "gate";

  // Both drill-down screens are STAMPED with the mode they were opened under, so
  // changing mode discards them without an effect having to reach in and reset
  // anything: a problem opened out of a sheet must not still be sitting there
  // when you come back to Company Vault later. `mode: null` on the initial value
  // never matches a real mode, which is just as well - the initial value is the
  // list view either way.
  const [practiceScreenState, setPracticeScreen] = useState({ mode: null, view: "list" });
  const practiceScreen = practiceScreenState.mode === practiceMode ? practiceScreenState : { view: "list" };
  const [companyPrepScreenState, setCompanyPrepScreenState] = useState({ mode: null, view: "list" });
  const companyPrepScreen = companyPrepScreenState.mode === practiceMode ? companyPrepScreenState : { view: "list" };
  // CampusCompanyPrepFlow only ever calls this with a plain object (never a
  // functional updater - see its own setScreen call sites), so stamping here is
  // safe and keeps the stamp out of that component's business.
  const setCompanyPrepScreen = (next) => setCompanyPrepScreenState({ ...next, mode: practiceMode });
  // Seeded once from ?category=... (a bookmarked or shared category link) -
  // searchParams is already available synchronously on first render for a
  // client component, so this needs no separate sync effect.
  const [practiceCategory, setPracticeCategory] = useState(() => searchParams.get("category") || "All");
  const [practiceDifficulty, setPracticeDifficulty] = useState("All");
  const [practiceCompany, setPracticeCompany] = useState("All");
  const [codelabStats, setCodelabStats] = useState(null);

  const loadContests = () => {
    if (section !== "contests") return;
    setContestsLoading(true); setContestsError(false);
    fetchPublishedContests().then(setContests).catch(() => setContestsError(true)).finally(() => setContestsLoading(false));
  };
  useEffect(loadContests, [section]);

  useEffect(() => {
    const openId = searchParams.get("open");
    if (section === "contests" && openId) setContestScreen({ view: "details", contestId: openId });
  }, [section, searchParams]);

  useEffect(() => {
    if (!user || section !== "practice" || practiceMode !== "coding") { setCodelabStats(null); return; }
    Promise.all([fetchUserCodelabProgress(user.uid), fetchPublishedProblems()])
      .then(([progress, problems]) => setCodelabStats({ solved: progress.problemsSolvedCount || 0, total: problems.length }))
      .catch(() => {});
  }, [user, section, practiceMode]);

  // A problem opened out of Sheets or Concepts renders the same
  // CampusProblemView the coding mode does, so "am I at the top" is that
  // screen's question first, whichever mode is underneath it.
  const practiceAtTop = practiceScreen.view === "problem" ? false
    : practiceMode === "companyPrep" ? companyPrepScreen.view === "list"
    : true;
  // Every Learn module except the course catalog owns its own back chrome
  // (each registers a useCampusBackHandler and renders its own CampusBackButton
  // once it is deeper than its list), so showing this section's back button
  // there too is exactly the stacked-back-button pattern the comment above
  // describes getting rid of. The rail's own "DeVert Campus" link is the
  // always-available exit instead.
  // GATE is excluded for the SAME reason the Learn modules above are, and was
  // simply missed when it was added: gate-app.jsx registers its own
  // useCampusBackHandler at depths 2 and 3 and its rail is the way back to
  // Overview, so a section-level button on top of that is the stacked-back
  // pattern this comment describes removing. Worse here than there, though -
  // without this, GATE fell through to practiceAtTop, which is true whenever
  // Practice is in its default coding/list state, so /gate rendered the button
  // unconditionally and router.back() on a directly-opened /gate (a shared
  // link, a bookmark, an SEO landing) leaves the site entirely.
  const atTop = section === "learning" ? learnModule === "courses"
    : section === "contests" ? contestScreen.view === "list"
    : section === "gate" ? false
    : practiceAtTop;
  const showPracticeFilters = practiceMode === "coding" && practiceScreen.view === "list";

  // Shared by Sheets, Concepts and the problem list - all three hand a problem
  // id to the same viewer rather than each reimplementing one. Stamped with the
  // mode it was opened from (see practiceScreen above) so it is discarded the
  // moment the URL moves to a different surface. `contextOrder` (Sheets/
  // Concepts only - the flat problem list passes nothing) is the curriculum
  // order CampusProblemView's "Next Problem" should follow instead of its
  // own contextless global-catalog sort - see campus-dsa-sheet.jsx's/
  // campus-dsa-concepts.jsx's identical openProblemWithContext.
  const openProblem = (id, contextOrder) => setPracticeScreen({ mode: practiceMode, view: "problem", problemId: id, contextOrder: contextOrder || null });

  return (
    // No campus-sharp, and the nav is now part of the page rather than
    // something only the marketing pages had - see campus-landing.jsx's
    // CampusLanding for why the class came off all four public surfaces
    // together. Padding moved off <main> and onto the content wrapper so the
    // nav can span the full width the way it does everywhere else.
    // campus-square keeps this in step with the landing and info pages - the
    // three public surfaces share one corner language. Not campus-sharp: that
    // one also strips inline shadows (see globals.css).
    <main data-theme={theme} style={{ ...campusPhotoBg(theme), minHeight: "100vh", colorScheme: theme }} className="campus-theme campus-square campus-photo-bg">
      <CampusPublicNav />

      <div className="max-w-6xl mx-auto px-6 py-8 pb-16">
        {/* router.back(), not push("/") - every real path into this
            section is an in-app click (a nav link, an "Upcoming Contests"
            row, a drawer category row...), so real browser back
            both returns to the exact page that link lived on AND restores
            its scroll position, neither of which push() to a fixed
            destination can do - push() always lands at the top of a fresh
            /campus, discarding wherever the user actually came from. */}
        {atTop && <CampusBackButton onClick={() => router.back()} />}

        {/* Two columns, the same shape the authenticated workspace uses. The top
            nav switches BETWEEN modules; this rail navigates WITHIN the one you
            opened - Programming's language list, CS Core's subjects, Aptitude's
            topics. Those are the module's own contextual nav, and each module
            already knows how to render it: they accept a `sidebarSlot` DOM node
            and portal their list into it (see CampusProgrammingTab). Without a
            slot to hand them they render no sub-nav at all, which is why these
            pages came out as a bare full-width list. */}
        {/* Only the surfaces that actually put something in the rail reserve
            space for it - otherwise a 240px empty column sits next to Contests
            and the Courses catalog, neither of which portals anything. The
            learning modules each render their own list into `sidebarEl`;
            practice's coding mode has the progress card below. */}
        <div className="flex gap-8 flex-col lg:flex-row">
          <aside className="lg:w-60 flex-shrink-0" hidden={!showSidebar}>
            {/* max-h + overflow so the rail scrolls inside itself: a sticky
                element taller than the viewport still loses its top edge. */}
            <div className="flex flex-col gap-5 lg:sticky lg:top-[88px] lg:max-h-[calc(100vh-108px)] lg:overflow-y-auto lg:pr-1">
              <div ref={setSidebarEl} />
              {section === "practice" && practiceMode === "coding" && (
                <PracticeProgressCard user={user} stats={codelabStats} />
              )}
            </div>
          </aside>

          <div className="flex-1 min-w-0">
            {section === "contests" && (
              <CampusContestFlow contests={contests} loading={contestsLoading} error={contestsError} onRetry={loadContests} screen={contestScreen} setScreen={setContestScreen} />
            )}
            {/* Every one of these takes no institution slug - they read the
                central, world-readable content collections directly (see
                lib/campusCatalog.js), which is exactly why they can serve a
                logged-out visitor here and an approved student inside a
                workspace from the same component. No `hiddenIds` is passed:
                per-institution content visibility is a campus setting and has
                no meaning on the public surface. */}
            {section === "learning" && (
              learnModule === "fundamentals" ? <CampusFundamentalsTab sidebarSlot={sidebarEl} />
                : learnModule === "programming" ? <CampusProgrammingTab sidebarSlot={sidebarEl} />
                : learnModule === "csCore" ? <CampusCsCoreTab sidebarSlot={sidebarEl} />
                : learnModule === "aptitude" ? <CampusAptitudeTab sidebarSlot={sidebarEl} />
                : <CampusLearningSection />
            )}
            {/* The SAME component the institution workspace mounts at
                ?tab=gate - not a public-facing copy of it. It takes no slug and
                reads only the global gatePapers/gate_pyqs/gate_tests
                collections, so the one implementation serves a logged-out
                visitor here and an enrolled student inside a workspace, and a
                fix to either lands in both. What differs is only the gate: this
                route is deliberately NOT behind isTabAllowed("gate")'s
                per-classroom module toggle - see GLOBAL_SECTIONS in
                lib/campus-seo.js. */}
            {section === "gate" && <CampusGateTab sidebarSlot={sidebarEl} />}
            {section === "practice" && (
              <>
                {showPracticeFilters && (
                  <div className="flex gap-5 flex-wrap mb-6">
                    <CategoryFilterList horizontal value={practiceCategory} onChange={setPracticeCategory} />
                    <SidebarFilterGroup horizontal label="DIFFICULTY" options={["All", ...CODELAB_DIFFICULTIES]} value={practiceDifficulty} onChange={setPracticeDifficulty} />
                    <CompanyFilterList horizontal value={practiceCompany} onChange={setPracticeCompany} />
                  </div>
                )}
                {/* The problem view wins over the mode underneath it, so a
                    problem opened from a sheet or a concept returns TO that
                    sheet/concept instead of dumping the learner on the flat
                    problem list - same reasoning as the DSA tab's own
                    "deliberately does NOT switch mode" note below. */}
                {practiceScreen.view === "problem" ? (
                  <CampusProblemView problemId={practiceScreen.problemId} onBack={() => setPracticeScreen({ view: "list" })}
                    onSelectProblem={openProblem} contextOrder={practiceScreen.contextOrder}
                    backLabel={practiceMode === "sheets" ? "Sheet" : practiceMode === "concepts" ? "Concepts" : "DSA"} />
                ) : practiceMode === "companyPrep" ? (
                  <CampusCompanyPrepFlow screen={companyPrepScreen} setScreen={setCompanyPrepScreen} />
                ) : practiceMode === "sheets" ? (
                  // Concepts are per-language and a sheet doesn't know which
                  // language this learner picked, so this hands off to the
                  // Concepts surface (where they choose) rather than guessing.
                  //
                  // A real navigation, not setPracticeMode: the mode is derived
                  // from ?mode= now (see the sync effect above), so setting it
                  // directly would leave the URL saying "sheets" while the page
                  // showed Concepts - and the next click on "DSA Sheets" in the
                  // nav would then be a no-op, since that URL is already current.
                  <CampusDsaSheets onOpenProblem={openProblem} onOpenConcept={() => router.push("/practice?mode=concepts")} />
                ) : practiceMode === "concepts" ? (
                  <CampusDsaConcepts onOpenProblem={openProblem} />
                ) : (
                  <CampusPracticeList hideFilters category={practiceCategory} difficulty={practiceDifficulty} company={practiceCompany}
                    onSelect={openProblem} />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

// ---------------- Workspace (/campus/[slug]) ----------------

// Every possible screen this workspace can show, and nothing else. One
// effect below computes exactly one of these and nothing ever second-
// guesses it afterward except a genuinely new check (sign-out, or a fresh
// mount). No loading flags to keep in sync with each other, no optimistic
// state that a slower fetch can race and clobber, no generation counters -
// the database is the only source of truth, read exactly once per visit.
const CAMPUS_PHASE = {
  CHECKING: "checking", NOT_FOUND: "not-found", SIGNED_OUT: "signed-out",
  NO_REQUEST: "no-request", PENDING: "pending", REJECTED: "rejected",
  // STAFF covers Principal/HOD/Faculty-Class-Teacher uniformly - the *role*
  // is a value inside this one phase (see staffScope below), exactly like
  // ADMIN already covers every full Institution Admin uniformly regardless
  // of the (purely cosmetic) admins/{uid}.role string.
  SUSPENDED: "suspended", ADMIN: "admin", STAFF: "staff", APPROVED: "approved",
};

// The DSA tab's three surfaces, in the order the tab bar shows them. Declared
// here rather than inline because it is also the ?dsa= whitelist - an unknown
// value in the URL must fall back to the default, never render a blank tab.
const DSA_MODES = ["sheet", "concepts", "problems"];

// CAMPUS_PHASE.CHECKING's screen - shaped like the real sidebar+topbar+content
// workspace shell (same widths, same photo background) rather than a
// generic centered spinner, so the fetch resolving reads as content filling
// in rather than a different app appearing. Deliberately NOT CampusCard/glass
// for the skeleton blocks themselves (CampusSkeleton's own shimmer is the
// point) - only the outer shell chrome borrows the real glass treatment.
function CampusWorkspaceSkeleton({ theme, campusBgUrl }) {
  return (
    <div data-theme={theme} style={{ ...campusPhotoBg(theme, campusBgUrl), minHeight: "100vh", colorScheme: theme }}
      className="campus-theme campus-photo-bg flex flex-col lg:flex-row gap-3 p-3 lg:gap-4 lg:p-4">
      <aside className="hidden lg:flex flex-shrink-0 lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)] lg:w-[230px] campus-glass rounded-[24px] p-4 flex-col gap-4"
        style={{ border: `1px solid ${CAMPUS.glassBorder}`, boxShadow: CAMPUS.shadow }}>
        <CampusSkeleton variant="rect" height={32} />
        <CampusSkeleton variant="rect" height={36} />
        <div className="flex flex-col gap-2 mt-2">
          {[0, 1, 2, 3, 4].map(i => <CampusSkeleton key={i} variant="rect" height={36} />)}
        </div>
      </aside>
      <div className="flex-1 min-w-0 flex flex-col gap-3 lg:gap-4">
        <div className="campus-glass rounded-[22px] px-5 sm:px-8 py-3.5 h-[61px] flex-shrink-0"
          style={{ border: `1px solid ${CAMPUS.glassBorder}`, boxShadow: CAMPUS.shadow }} />
        <div className="flex-1 px-5 sm:px-8 py-6 space-y-4">
          <CampusSkeleton variant="rect" height={180} />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map(i => <CampusSkeleton key={i} variant="rect" height={90} />)}
          </div>
          <CampusSkeleton variant="rect" height={260} />
        </div>
      </div>
    </div>
  );
}

function CampusWorkspace({ slug, initialTab, initialContestId, initialManageTab, initialManageStudentsView }) {
  const { theme } = useCampusTheme();
  const { user, userData, adminChecked, logout } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [phase, setPhase] = useState(CAMPUS_PHASE.CHECKING);
  const [institution, setInstitution] = useState(null);
  const [membership, setMembership] = useState(null);
  // Principal/HOD/Faculty-Class-Teacher membership - see Part D3's own
  // comment on the phase-determination effect below for why this is read
  // in the SAME Promise.all as membership/adminRole, never a second
  // competing fetch.
  const [staffRoleAssignment, setStaffRoleAssignment] = useState(null);
  const [rolePermissionDefaults, setRolePermissionDefaults] = useState(null);
  const [tab, setTab] = useState(initialContestId ? "contests" : initialTab);
  // ?screen=attempt/results (read once, alongside initialContestId) - without
  // this, refreshing mid-attempt or on a results screen always landed back
  // on Details, since that URL used to be identical across all three states.
  const [contestScreen, setContestScreen] = useState(() => {
    if (!initialContestId) return { view: "list" };
    const screenParam = searchParams.get("screen");
    const view = screenParam === "attempt" || screenParam === "results" ? screenParam : "details";
    return { view, contestId: initialContestId };
  });
  // Contests' own sidebar phase filter (Live/Upcoming/Past/All) - lives here
  // rather than inside CampusContestsTabContent so it survives that
  // component's own remounts (none currently, but consistent with every
  // other sidebar-filter state in this file living in the workspace).
  const [contestPhaseFilter, setContestPhaseFilter] = useState("all");
  // Read once on mount from ?problem=/?company=&view= - the only way a
  // refresh or shared link inside DSA/Company Vault can land back on the
  // exact problem/company instead of always falling back to the tab's list
  // view (a real reported bug: this state used to live in plain useState
  // with nothing at all in the URL). Lazy initializers, not a reactive
  // effect - searchParams is already synchronously available on first
  // render, same precedent as CampusGlobalSection's practiceCategory below.
  const [practiceScreen, setPracticeScreen] = useState(() => {
    const problemId = searchParams.get("problem");
    return problemId ? { view: "problem", problemId } : { view: "list" };
  });
  // The DSA tab holds three surfaces: the curated Sheet, the concept roadmap
  // (learning), and the raw problem set (practice). Defaults to "problems" so
  // the tab opens exactly where it always has for existing students - Sheet and
  // Concepts are additions, not relocations.
  //
  // IN THE URL, and it has to be. Opening a problem writes ?problem=, and this
  // was the one piece of DSA navigation state that never reached the address
  // bar - so a reload, a shared link, or opening a problem in a second tab
  // restored the problem but always restored "problems" underneath it. Back
  // from a problem opened out of the Sheet then landed on the Problems list,
  // losing the learner's place in the roadmap entirely. Absent means "problems",
  // so every link that predates this keeps behaving exactly as it did.
  const [dsaMode, setDsaMode] = useState(() => {
    const m = searchParams.get("dsa");
    return DSA_MODES.includes(m) ? m : "problems";
  });
  const [companyPrepScreen, setCompanyPrepScreen] = useState(() => {
    const companyId = searchParams.get("company");
    if (!companyId) return { view: "list" };
    return searchParams.get("view") === "practice" ? { view: "practice", companyId } : { view: "company", companyId };
  });
  // Read once on mount, same as practiceScreen/companyPrepScreen above - a
  // refresh mid-filter used to always drop back to "All" for all three,
  // since nothing wrote them into the URL at all (see the tab-sync effect
  // below, now extended to include them for the "dsa" tab's list view).
  const [practiceCategory, setPracticeCategory] = useState(() => searchParams.get("category") || "All");
  const [practiceDifficulty, setPracticeDifficulty] = useState(() => searchParams.get("difficulty") || "All");
  const [practiceCompany, setPracticeCompany] = useState(() => searchParams.get("askedIn") || "All");
  const [contentVisibility, setContentVisibility] = useState({ hiddenProblemIds: [], hiddenCompanyIds: [] });
  const isInstAdmin = phase === CAMPUS_PHASE.ADMIN;
  // null outside the STAFF phase - a differently-scoped view of the SAME
  // nav/tab machinery every other identity already uses (see NAV_ITEMS'
  // staffRoles field, isTabAllowed/hiddenTabKeys below), not a fourth shell.
  // Memoized (not a plain ternary) so its object identity stays stable
  // across renders where the underlying role/scope hasn't actually changed -
  // otherwise every useMemo/useEffect below that depends on it would treat
  // it as "changed" on every single render.
  const staffScope = useMemo(() => (
    phase === CAMPUS_PHASE.STAFF && staffRoleAssignment
      ? { role: staffRoleAssignment.roleKey, department: staffRoleAssignment.scope?.department || null, classroomId: staffRoleAssignment.scope?.classroomId || null }
      : null
  ), [phase, staffRoleAssignment]);
  // Merges this admin's own explicit overrides on top of their role's
  // configured defaults - mirrors firestore.rules' hasPermission() exactly
  // (override-if-present, else role default), computed once here rather
  // than per-component. isInstAdmin bypasses this entirely at the point of
  // use (useHasPermission) - it predates the granular system and must never
  // regress while permissions roll out.
  const permissionsCtxValue = useMemo(() => {
    const defaults = (rolePermissionDefaults && staffRoleAssignment) ? (rolePermissionDefaults[staffRoleAssignment.roleKey] || {}) : {};
    const overrides = staffRoleAssignment?.permissionOverrides || {};
    const merged = { ...defaults, ...overrides };
    return {
      role: isInstAdmin ? "admin" : staffScope?.role || (phase === CAMPUS_PHASE.APPROVED ? "student" : null),
      permissions: new Set(Object.keys(merged).filter(k => merged[k])),
      isInstAdmin,
      // Same values as staffScope above, republished through the context so a
      // deeply-nested writer (CampusManage's Daily Learning editor) can stamp
      // the scope field rules will check its write against - see
      // lib/campusPermissions.js's useCampusScope.
      department: staffScope?.department || null,
      classroomId: staffScope?.classroomId || null,
    };
  }, [isInstAdmin, staffScope, staffRoleAssignment, rolePermissionDefaults, phase]);

  // Mobile hamburger drawer - lives here (not inside a standalone stateful
  // component) since CampusTopBar's hamburger button and the drawer itself
  // are distant siblings under this common parent, same pattern as
  // useCampusExitGuard's dialog state below.
  const [drawerOpen, setDrawerOpen] = useState(false);
  // Lets the drawer command an already-mounted CampusManage into a specific
  // sub-tab (e.g. its search result for "Manage -> Students") - see
  // CampusManage's own jumpToManageTab handling in campus-manage.jsx.
  const [manageJump, setManageJump] = useState(null);
  const jumpNonceRef = useRef(0);
  // Same nonce-jump mechanism as Manage above, for the mobile drawer's own
  // nested Daily Learning track list (see campus-mobile-drawer.jsx) - lets
  // the drawer switch an already-mounted CampusDailyLearningLanding straight
  // to a specific track without needing it to remount.
  const [learningJump, setLearningJump] = useState(null);
  const learningJumpNonceRef = useRef(0);
  const jumpToTrack = (trackId) => {
    goTab("learning");
    setLearningJump({ trackId, nonce: ++learningJumpNonceRef.current });
  };
  // DSA's category filter lives directly in this component's own state (no
  // child module owns it, unlike Programming/CS Core) - so unlike those,
  // the mobile drawer's nested DSA category list just sets it straight,
  // no jump/nonce/remount machinery needed.
  const jumpToDsaCategory = (category) => {
    setPracticeCategory(category);
    goTab("dsa");
  };
  // Company Vault's screen state lives directly in this component too (same
  // reasoning as DSA above), so this is the same direct-set pattern rather
  // than the shared search-select jump.
  const jumpToCompany = (companyId) => {
    setCompanyPrepScreen({ view: "company", companyId });
    goTab("companyVault");
  };
  // Contests' phase filter is likewise local state in this component.
  const jumpToContestPhase = (phase) => {
    setContestPhaseFilter(phase);
    goTab("contests");
  };
  // Assessments' openTest state lives inside CampusDailyAssessmentsTab
  // itself (unlike DSA/Company Vault/Contests above), so this needs the
  // same nonce-jump mechanism as Manage/Daily Learning rather than a direct
  // setter call.
  const [assessmentJump, setAssessmentJump] = useState(null);
  const assessmentJumpNonceRef = useRef(0);
  const jumpToAssessment = (date) => {
    goTab("assessments");
    setAssessmentJump({ date, nonce: ++assessmentJumpNonceRef.current });
  };

  // Search-result navigation. Two steps, and both are needed:
  //
  //   1. Write the target URL through the router, not a raw history mutation.
  //      useSearchParams() reads from Next's own router context, which only
  //      updates on a router navigation (push/replace) - a bare
  //      window.history.replaceState() moves the address bar but never touches
  //      that context, so a freshly-mounted module would read stale (missing)
  //      params and land on the right tab without drilling into the topic.
  //      Every deep-linkable module (Programming, CS Core, Aptitude, GATE)
  //      already initialises its screen state from useSearchParams() in a
  //      useState initialiser, so the params are how the destination is
  //      expressed - no new per-module prop needed once they're real.
  //
  //   2. Bump a nonce that is part of the module's React key, forcing a remount
  //      so that initialiser runs again. Without this, jumping to a topic inside
  //      the module you are ALREADY in would change the URL and nothing else,
  //      because the initialiser only runs on mount.
  //
  // router.replace rather than router.push: a search jump is a destination,
  // not a step worth walking back through one param at a time (the Back-stack
  // registry in lib/campusNav.js already handles in-module back navigation).
  const [searchNonce, setSearchNonce] = useState(0);
  const handleSearchSelect = (item) => {
    if (!item) return;
    const params = new URLSearchParams({ tab: item.tab, ...(item.params || {}) });
    router.replace(`/${slug}?${params.toString()}`, { scroll: false });
    goTab(item.tab);
    // Only deep results need a remount; a plain module result is just a tab
    // switch, and remounting there would needlessly discard that module's state.
    if (Object.keys(item.params || {}).length > 0) setSearchNonce(n => n + 1);
  };

  // Navigation Architecture 2.0: CampusContextSidebar is a generic, empty
  // portal target - whichever module is active portals ITS OWN existing
  // sub-navigation (Manage's tab list, Daily Learning's track list, ...) into
  // this DOM node rather than CampusWorkspace owning a second copy of that
  // module's state. A callback-ref state setter (not a plain useRef) so the
  // very first portal call - which can happen in the same commit this node
  // mounts - has a non-null target to render into.
  const [sidebarEl, setSidebarEl] = useState(null);
  // Collapse persistence carried over unchanged from the old CampusNavRail
  // (same "campus-nav-collapsed" localStorage key/values) - lifted up here
  // because the toggle button now lives inside CampusContextSidebar, which
  // no longer owns any state of its own (see that component's own comment).
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("campus-nav-collapsed") === "1") setSidebarCollapsed(true);
  }, []);
  const toggleSidebarCollapsed = () => setSidebarCollapsed(c => {
    const next = !c;
    localStorage.setItem("campus-nav-collapsed", next ? "1" : "0");
    return next;
  });

  // Same lift-state-up/localStorage pattern as sidebarCollapsed above, for
  // the "Quick Access" group (Dashboard/Daily Learning/Contests/Leaderboard)
  // inside CampusContextSidebar - collapsible so it doesn't eat vertical
  // space above the active module's own contextual sub-nav once a student
  // already knows where those four live.
  const [quickAccessOpen, setQuickAccessOpen] = useState(true);
  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("campus-quick-access-collapsed") === "1") setQuickAccessOpen(false);
  }, []);
  const toggleQuickAccess = () => setQuickAccessOpen(o => {
    const next = !o;
    localStorage.setItem("campus-quick-access-collapsed", next ? "0" : "1");
    return next;
  });

  // Classroom-level module access (see NAV_ITEMS' moduleKey/lib/institutions.js's
  // MODULES) - fetched once here, not per-tab, so every gated tab (and the
  // nav rail/bottom nav deciding what to even show) reads the same value.
  // undefined = still loading (content renders normally rather than
  // flashing "Access Restricted" during the brief fetch); null = no
  // classroom on file, which isModuleEnabledForClassroom already treats as
  // "nothing to restrict" (default enabled). Admins are never gated - they
  // need to see and manage every module regardless of what's configured.
  const [myClassroom, setMyClassroom] = useState(undefined);
  const myClassroomId = userData?.classroomId
    || (userData?.department && userData?.year && userData?.section ? classroomKey(userData.year, userData.department, userData.section) : null);
  useEffect(() => {
    if (isInstAdmin || !myClassroomId) { setMyClassroom(null); return; }
    fetchClassroom(slug, myClassroomId).then(setMyClassroom).catch(() => setMyClassroom(null));
  }, [slug, myClassroomId, isInstAdmin]);

  // Static export's generateMetadata only sets the browser tab title at
  // build time, from whatever branding existed then - this keeps it live for
  // the rest of the CURRENT session, so a branding save (which already
  // updates `institution` in place, see onInstitutionUpdated above) is
  // reflected in the tab title immediately, matching the sidebar/top bar.
  useEffect(() => {
    if (typeof document === "undefined" || !institution?.name) return;
    document.title = `${institution.shortName || institution.name} | DeVert Campus`;
  }, [institution?.name, institution?.shortName]);

  // Overview/Profile's own "Coins" stat used to read users.credits - only
  // ever incremented by contest rewards (lib/contests.js) - while Daily
  // Learning/Programming/CS Core rewards all write user_earnings/{uid}.
  // totalCoins instead, the same field Wallet and Classroom Analytics
  // already correctly read. Live subscription (not a one-time fetch) so
  // this stays in sync the instant any reward-granting action fires,
  // without a refresh - fetched once here, not duplicated per tab.
  const [totalCoins, setTotalCoins] = useState(null);
  useEffect(() => {
    if (!user?.uid) { setTotalCoins(null); return; }
    return onSnapshot(doc(db, "user_earnings", user.uid), snap => {
      setTotalCoins(snap.exists() ? (snap.data().totalCoins || 0) : 0);
    }, () => setTotalCoins(0));
  }, [user?.uid]);

  // Chrome's back-forward cache can restore a fully frozen snapshot of this
  // page - DOM, React fiber tree, and all - on a Back/Forward navigation,
  // WITHOUT re-running any of this component's code from scratch. If that
  // snapshot was frozen mid-transition, or from a stale history entry this
  // exact URL never legitimately produces (e.g. the query-string
  // "?tab=overview" shape used by an old, now-removed routing scheme), the
  // resumed page can render a genuinely blank content area with no way for
  // any of the state-sync logic above to ever run and correct it - nothing
  // "reacts" to a bfcache restore the way it reacts to a real popstate.
  // pageshow's `persisted` flag is the one reliable signal that this
  // happened; forcing a real reload guarantees a fresh, correct mount
  // instead of trusting whatever was frozen.
  useEffect(() => {
    const onPageShow = (e) => { if (e.persisted) window.location.reload(); };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  // Real activity/engagement tracking (lib/activity.js) - one ping on mount
  // and one every PING_INTERVAL_MIN while the tab stays visible, so the
  // Classroom Analytics Activity/Overview tabs have genuine "active today"
  // data instead of a fabricated one. Skipped while the visibility check
  // itself fails (backgrounded tab) so pingCount stays a meaningful estimate
  // of actual engaged time, not just "the tab was open".
  useEffect(() => {
    if (phase !== CAMPUS_PHASE.APPROVED && phase !== CAMPUS_PHASE.ADMIN) return;
    if (!user?.uid) return;
    const uid = user.uid;
    const sendPing = () => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      pingActivity(uid).catch(() => {});
    };
    sendPing();
    const interval = setInterval(sendPing, PING_INTERVAL_MIN * 60 * 1000);
    return () => clearInterval(interval);
  }, [phase, user?.uid]);

  const isTabAllowed = (tabKey) => {
    const item = NAV_ITEMS.find(i => i.key === tabKey);
    if (item?.adminOnly) return isInstAdmin;
    // staffRoles is Principal/HOD/Faculty's own gate - separate from
    // adminOnly (isInstAdmin) and moduleKey (classroom-level student gating),
    // since a staff-only nav destination (Departments, Manage-equivalent
    // faculty views, etc.) shouldn't be reachable by ordinary students OR by
    // a staff member holding the wrong one of the three roles.
    if (item?.staffRoles) return isInstAdmin || (staffScope && item.staffRoles.includes(staffScope.role));
    const moduleKey = item?.moduleKey;
    // Principal/HOD/Faculty see every content module regardless of any one
    // classroom's moduleAccess toggle - that toggle is a per-classroom
    // student-facing gate (Manage Access), not a restriction on staff who
    // need to see/manage the module in the first place, same reasoning as
    // the existing isInstAdmin bypass right next to it.
    if (!moduleKey || isInstAdmin || staffScope) return true;
    if (myClassroom === undefined) return true; // still loading - don't flash a false restriction
    return isModuleEnabledForClassroom(myClassroom, moduleKey);
  };
  // adminOnly/staffRoles items are hidden from the wrong identity regardless
  // of myClassroom's loading state, since admin/staff status is already
  // known synchronously - unlike moduleKey gating, there's no "flash of
  // false restriction" risk to wait out.
  const hiddenTabKeys = useMemo(() => {
    const hidden = new Set();
    for (const item of NAV_ITEMS) {
      if (item.adminOnly) { if (!isInstAdmin) hidden.add(item.key); continue; }
      if (item.staffRoles) { if (!isInstAdmin && !(staffScope && item.staffRoles.includes(staffScope.role))) hidden.add(item.key); continue; }
      if (isInstAdmin || staffScope || myClassroom === undefined) continue;
      if (item.moduleKey && !isModuleEnabledForClassroom(myClassroom, item.moduleKey)) hidden.add(item.key);
    }
    return hidden;
  }, [myClassroom, isInstAdmin, staffScope]);
  // Which tabs currently contribute their own sub-navigation to
  // CampusContextSidebar (Navigation Architecture 2.0) - mirrors the exact
  // same moduleKey/isTabAllowed guard the main content switch below uses for
  // ModuleAccessRestricted, so a student whose classroom has e.g. Programming
  // disabled sees a fully collapsed sidebar (nothing to portal into) rather
  // than an empty frame with just the institution logo.
  const SIDEBAR_TABS = new Set(["learning", "dsa", "programming", "csCore", "aptitude", "gate", "companyVault", "contests", "assessments", "roadmaps"]);
  // "manage" reads isTabAllowed too, for the same reason the content switch
  // below does: an HOD may reach Manage (NAV_ITEMS' staffRoles), and Manage
  // portals its own sub-navigation into this sidebar slot - gating the slot on
  // isInstAdmin while the tab itself renders would leave a scoped HOD in
  // Manage with no sub-nav to move between its tabs with.
  const hasSidebarContent = (tab === "manage" && isTabAllowed("manage")) || (SIDEBAR_TABS.has(tab) && isTabAllowed(tab));
  // Only guards a real, rendered workspace - not the checking/pending/
  // signed-out screens above, which have nothing worth protecting against
  // an accidental Back press.
  const exitGuard = useCampusExitGuard(phase === CAMPUS_PHASE.APPROVED || phase === CAMPUS_PHASE.ADMIN || phase === CAMPUS_PHASE.STAFF);

  // The ONLY check. Runs once per (slug, signed-in identity). Institution
  // existence, then membership/admin status, read in that order, exactly
  // once each - never re-derived from a second competing fetch, never
  // patched over with an optimistic guess. `cancelled` only protects
  // against a genuinely stale run (e.g. the user signed out mid-check)
  // still writing state after a newer run has already started - the
  // standard React effect-cleanup pattern, not a bespoke ordering scheme.
  useEffect(() => {
    if (!adminChecked) return;
    let cancelled = false;
    (async () => {
      const inst = await fetchInstitution(slug).catch(() => null);
      if (cancelled) return;
      setInstitution(inst);
      if (!inst) { console.log(`[Auth Debug] Workspace phase: NOT_FOUND for slug ${slug}`); setPhase(CAMPUS_PHASE.NOT_FOUND); return; }
      if (!user) { console.log(`[Auth Debug] Workspace phase: SIGNED_OUT for slug ${slug}`); setPhase(CAMPUS_PHASE.SIGNED_OUT); return; }

      const [m, adminRole, roleAssignment] = await Promise.all([
        fetchMyMembership(slug, user.uid).catch(() => null),
        fetchMyInstitutionAdminRole(slug, user.uid).catch(() => null),
        fetchMyRoleAssignment(slug, user.uid).catch(() => null),
      ]);
      if (cancelled) return;
      setMembership(m);
      setStaffRoleAssignment(roleAssignment);
      if (adminRole) { console.log(`[Auth Debug] Workspace phase: ADMIN for user ${user.uid}`); setPhase(CAMPUS_PHASE.ADMIN); return; }
      if (roleAssignment) {
        if (roleAssignment.status === "active") {
          console.log(`[Auth Debug] Workspace phase: STAFF (${roleAssignment.roleKey}) for user ${user.uid}`);
          // Small, rarely-changing config doc - fetched only once a real
          // staff identity is confirmed, not on every visit regardless of
          // role (isInstAdmin implicitly satisfies every permission, so
          // Institution Admins never need this fetched at all).
          fetchRolePermissionDefaults().then(d => { if (!cancelled) setRolePermissionDefaults(d || {}); }).catch(() => { if (!cancelled) setRolePermissionDefaults({}); });
          setPhase(CAMPUS_PHASE.STAFF);
        } else {
          console.log(`[Auth Debug] Workspace phase: SUSPENDED (disabled staff account) for user ${user.uid}`);
          setPhase(CAMPUS_PHASE.SUSPENDED);
        }
        return;
      }
      if (!m) { console.log(`[Auth Debug] Workspace phase: NO_REQUEST for user ${user.uid}`); setPhase(CAMPUS_PHASE.NO_REQUEST); return; }
      const newPhase = m.status === "approved" ? CAMPUS_PHASE.APPROVED
        : m.status === "rejected" ? CAMPUS_PHASE.REJECTED
        : m.status === "suspended" ? CAMPUS_PHASE.SUSPENDED
        : CAMPUS_PHASE.PENDING;
      console.log(`[Auth Debug] Workspace phase: ${newPhase} for user ${user.uid}`);
      setPhase(newPhase);
    })();
    return () => { cancelled = true; };
  }, [slug, user, adminChecked]);

  // Keeps membership's DISPLAY fields (rollNumber/department/year/section on
  // ProfileTab/OverviewTab) live after the one-time phase-determination
  // fetch above - that effect intentionally only re-runs on slug/user/
  // adminChecked changes (phase transitions are deliberately not re-derived
  // from a second competing fetch, see its own comment), so an admin's
  // mid-session roster edit/reassignment previously left the visible badges
  // showing the old values indefinitely, even though userData (used for
  // gating elsewhere) already updates live. Deliberately does NOT touch
  // `phase` - a live phase transition (e.g. a mid-session suspension) is a
  // separate, bigger change out of scope here.
  useEffect(() => {
    if (!slug || !user) return;
    const unsub = onSnapshot(doc(db, "institutions", slug, "students", user.uid), snap => {
      setMembership(snap.exists() ? { id: snap.id, ...snap.data() } : null);
    }, err => console.error("[onSnapshot:campusMembership]", err));
    return unsub;
  }, [slug, user]);

  // The submit handlers already wrote the doc with status "pending" (or,
  // for a resubmission, are about to) - there's nothing left to fetch or
  // guess. Setting the phase directly to what we know we just wrote is not
  // an "optimistic" update racing a slower read; it IS the current state
  // of the database, because this call is what just changed it.
  const handleJoinSubmitted = (formData) => {
    setMembership({ status: "pending", rollNumber: formData.rollNumber });
    setPhase(CAMPUS_PHASE.PENDING);
  };

  useEffect(() => {
    if (phase !== CAMPUS_PHASE.APPROVED && !isInstAdmin) return;
    fetchContentVisibility(slug).then(setContentVisibility).catch(() => {});
  }, [slug, phase, isInstAdmin]);

  // Keeps the URL in sync with each tab's own sub-screen, whatever put it
  // there - Overview's "onOpenContest" shortcut, a row clicked inside a
  // tab's own list, or a direct problem/company link - so a refresh or a
  // shared link lands back on the exact contest/problem/company instead of
  // always falling back to the tab's plain list view. replace, not push -
  // these are sub-states of one tab, not separate history entries worth
  // stepping back through one at a time.
  useEffect(() => {
    // Tabs whose child component already owns a deeper URL-sync effect of
    // its own (NAV_ITEMS' ownUrl: true - "manage" has /manage/{tab}/
    // {subView}, "programming"/"csCore"/"aptitude" their own lang(or
    // subject)/topic URL, "learning" its own ?problem=, "assessments" its
    // own ?test=/?problem=) are skipped entirely here. Since child effects
    // run before parent effects, this one would otherwise fire second and
    // clobber that more specific URL back down to a flat base path every
    // time.
    const navItem = NAV_ITEMS.find(i => i.key === tab);
    if (navItem?.ownUrl) return;
    const segment = navItem?.urlSegment;
    const hasSegment = typeof segment === "string";
    const basePath = hasSegment ? `/${slug}${segment ? `/${segment}` : ""}` : `/${slug}`;
    const baseQuery = hasSegment ? "" : `?tab=${tab}`;

    let url;
    if (tab === "contests" && contestScreen.view !== "list") {
      // attempt/results get their own ?screen= query param - previously
      // details/attempt/results all produced the exact same URL, so a
      // refresh mid-attempt (or on a results screen) always reloaded back
      // into Details, silently discarding whatever screen was actually open.
      const screenParam = contestScreen.view !== "details" ? `?screen=${contestScreen.view}` : "";
      url = `/${slug}/contest/${contestScreen.contestId}${screenParam}`;
    } else if (tab === "dsa" && practiceScreen.view === "problem") {
      // ?dsa= rides along with ?problem= so Back returns to the surface the
      // problem was opened FROM - the Sheet, a concept, or the problem list -
      // and keeps doing so after a reload or on a link shared to someone else.
      const params = new URLSearchParams({ problem: practiceScreen.problemId });
      if (dsaMode !== "problems") params.set("dsa", dsaMode);
      url = `${basePath}?${params.toString()}`;
    } else if (tab === "dsa") {
      // List view - category/difficulty/askedIn used to never reach the URL
      // at all, so refreshing mid-filter always silently reset back to
      // "All" x3. Only appended when actually filtered, so the common
      // unfiltered case still gets the same bare basePath as before.
      const params = new URLSearchParams();
      if (dsaMode !== "problems") params.set("dsa", dsaMode);
      if (practiceCategory !== "All") params.set("category", practiceCategory);
      if (practiceDifficulty !== "All") params.set("difficulty", practiceDifficulty);
      if (practiceCompany !== "All") params.set("askedIn", practiceCompany);
      const qs = params.toString();
      url = qs ? `${basePath}?${qs}` : basePath;
    } else if (tab === "companyVault" && companyPrepScreen.view !== "list") {
      url = `${basePath}?company=${encodeURIComponent(companyPrepScreen.companyId)}${companyPrepScreen.view === "practice" ? "&view=practice" : ""}`;
    } else {
      url = `${basePath}${baseQuery}`;
    }

    if (typeof window !== "undefined") {
      console.log(`[Auth Debug] Updating URL to ${url} via replaceState (bypassing Next.js router to prevent hard reload)`);
      window.history.replaceState(null, '', url);
    }

  }, [tab, contestScreen, practiceScreen, companyPrepScreen, slug, dsaMode, practiceCategory, practiceDifficulty, practiceCompany]);

  const goTab = (t) => {
    setTab(t);
    if (t !== "contests") setContestScreen({ view: "list" });
  };

  const openContest = (contestId) => {
    setContestScreen({ view: "details", contestId });
    goTab("contests");
  };

  // Switches to Manage AND tells it which sub-tab to land on, in one call -
  // used by the mobile drawer's Admin section and its search results (e.g.
  // typing "students"). See CampusManage's jumpToManageTab prop handling.
  const jumpToManage = (manageTabKey) => {
    goTab("manage");
    setManageJump({ tab: manageTabKey, nonce: ++jumpNonceRef.current });
  };

  // Defense in depth against the content area's tab-switch below silently
  // rendering nothing: it only has an explicit branch per real NAV_ITEMS
  // key, so ANY unrecognized value - a stale bfcache-restored `tab`, a bad
  // prop, a future typo - would otherwise fall through to a blank content
  // pane with the nav rail still fully visible (a real, reported bug).
  // Self-corrects to the workspace root instead of ever showing that blank
  // state.
  useEffect(() => {
    if (!NAV_ITEMS.some(i => i.key === tab)) goTab("dashboard");
  }, [tab]);

  // Registers this workspace's own drill-downs with the shared Back-stack
  // (see lib/campusNav.js) so the browser Back button - and the exit guard -
  // step through them instead of immediately asking to leave Campus. Depth
  // 2 (each tab's own sub-screen) always beats depth 1 (falling back to
  // Overview) since popCampusBack() picks the highest registered depth.
  // Practice/Company Vault/Contests keep their sub-state here (not inside a
  // child component), so they register directly in this component.
  useCampusBackHandler(2, tab === "dsa" && practiceScreen.view !== "list", () => setPracticeScreen({ view: "list" }));
  // Company Vault is a real 3-level stack (list -> company -> practice), not
  // a flat list<->detail toggle - "practice" steps up to "company" first,
  // matching CampusCompanyPrepFlow's own onBack prop one level down.
  useCampusBackHandler(2, tab === "companyVault" && companyPrepScreen.view !== "list", () => {
    if (companyPrepScreen.view === "practice") setCompanyPrepScreen({ view: "company", companyId: companyPrepScreen.companyId });
    else setCompanyPrepScreen({ view: "list" });
  });
  // Contests is a real 3-level stack (list -> details -> attempt/results),
  // not a flat list<->detail toggle - attempt/results step back to details
  // first, matching CampusContestFlow's own in-page onBack one level down
  // (previously this jumped straight to "list", silently skipping Details).
  useCampusBackHandler(2, tab === "contests" && contestScreen.view !== "list", () => {
    if (contestScreen.view === "attempt" || contestScreen.view === "results") {
      setContestScreen({ view: "details", contestId: contestScreen.contestId });
    } else {
      setContestScreen({ view: "list" });
    }
  });
  useCampusBackHandler(1, tab !== "dashboard", () => goTab("dashboard"));
  // The drawer is an overlay, not a mutually-exclusive tab state - it can
  // be open at the same time as any of the drill-downs above, so it gets
  // its own reserved depth (see lib/campusNav.js) instead of reusing 1/2,
  // which would silently clobber whichever handler registered second.
  useCampusBackHandler(OVERLAY_BACK_DEPTH, drawerOpen, () => setDrawerOpen(false));

  // Exactly one screen per phase. Nothing here re-derives or second-
  // guesses `phase` - it was already decided, once, by the effect above.
  //
  // CHECKING used to render CampusGateShell (the public marketing nav +
  // "Loading..."), which is visually almost the same chrome as the plain
  // /campus landing page - so every single load of an institution slug
  // looked like "/campus loads, THEN /campus/{slug} loads", a full chrome
  // swap the instant the institution/membership fetch resolved. A skeleton
  // shaped like the REAL workspace shell (same sidebar/topbar geometry, same
  // photo background) turns that into content filling in, not a different
  // app appearing.
  if (phase === CAMPUS_PHASE.CHECKING) {
    return <CampusWorkspaceSkeleton theme={theme} campusBgUrl={userData?.campusBgUrl} />;
  }
  if (phase === CAMPUS_PHASE.NOT_FOUND) {
    return <CampusGateShell><Centered>This college isn&apos;t on DeVert Campus (yet).</Centered></CampusGateShell>;
  }
  if (phase === CAMPUS_PHASE.SIGNED_OUT) {
    return (
      <CampusGateShell>
        <CampusCard className="p-7 text-center max-w-sm">
          <h3 className="text-[17px] font-semibold mb-2" style={{ color: CAMPUS.ink }}>Sign in to continue</h3>
          <p className="text-[13.5px] mb-5" style={{ color: CAMPUS.inkSoft }}>
            You&apos;ll need a DeVert account to request access to {institution.name}&apos;s Campus workspace.
          </p>
          <CampusGoogleButton style={{ background: CAMPUS.chromeBg, color: CAMPUS.chromeFg }} />
          <p className="text-[11.5px] mt-3" style={{ color: CAMPUS.inkFaint }}>
            New to DeVert? Signing in with Google creates your account automatically - no separate signup needed.
          </p>
        </CampusCard>
      </CampusGateShell>
    );
  }
  if (phase === CAMPUS_PHASE.NO_REQUEST) {
    return (
      <CampusGateShell>
        {institution.accessMode === "invite_only" ? (
          <CampusIdentityForm slug={slug} institution={institution} user={user}
            onSubmitted={handleJoinSubmitted} />
        ) : (
          <JoinForm slug={slug} institution={institution} user={user} userData={userData}
            onSubmitted={handleJoinSubmitted} />
        )}
      </CampusGateShell>
    );
  }
  if (phase === CAMPUS_PHASE.PENDING) {
    return <CampusGateShell><PendingCard institution={institution} membership={membership} /></CampusGateShell>;
  }
  if (phase === CAMPUS_PHASE.REJECTED) {
    return (
      <CampusGateShell>
        <CampusCard className="p-7 text-center max-w-sm">
          <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: CAMPUS.badTint, color: CAMPUS.bad }}>
            <XCircle size={22} />
          </div>
          <h3 className="text-[17px] font-semibold mb-2" style={{ color: CAMPUS.ink }}>Request declined</h3>
          <p className="text-[13.5px] mb-4" style={{ color: CAMPUS.inkSoft }}>
            {institution.name} declined your request to join.
            {membership?.rejectionReason ? ` Reason: ${membership.rejectionReason}` : " Contact your Training & Placement Cell for details."}
          </p>
          <button onClick={() => setPhase(CAMPUS_PHASE.NO_REQUEST)}
            className="text-[12.5px] font-semibold px-4 py-2 rounded-lg" style={{ border: `1px solid ${CAMPUS.line}`, color: CAMPUS.inkSoft }}>
            Resubmit your request
          </button>
        </CampusCard>
      </CampusGateShell>
    );
  }
  if (phase === CAMPUS_PHASE.SUSPENDED) {
    return (
      <CampusGateShell>
        <CampusCard className="p-7 text-center max-w-sm">
          <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: CAMPUS.badTint, color: CAMPUS.bad }}>
            <Ban size={22} />
          </div>
          <h3 className="text-[17px] font-semibold mb-2" style={{ color: CAMPUS.ink }}>Access suspended</h3>
          <p className="text-[13.5px]" style={{ color: CAMPUS.inkSoft }}>
            Your access to {institution.name}&apos;s Campus workspace has been suspended. Contact your Training &amp; Placement Cell.
          </p>
        </CampusCard>
      </CampusGateShell>
    );
  }

  // Only CAMPUS_PHASE.APPROVED, CAMPUS_PHASE.ADMIN, or CAMPUS_PHASE.STAFF
  // reach here.

  return (
    <CampusPermissionsContext.Provider value={permissionsCtxValue}>
    {/* NOT campus-sharp. That class exists for the pre-auth landing flows only
        (see CampusGlobalSection above and the rule's own comment in
        globals.css: "the authenticated Workspace keeps the rounded, shadowed
        CampusCard untouched"). Having it here contradicted that: it applies
        `border-radius: 0 !important` to every .rounded-md/lg/xl/2xl and
        `box-shadow: none !important` to every inline shadow, so EVERY card,
        stat, banner, tab bar and hero in the entire authenticated Campus app
        rendered square and flat - nullifying the rounded-corner-and-soft-shadow
        vocabulary that CampusCard, the CAMPUS.shadow* tokens and the whole
        premium-SaaS design system are built on. */}
    {/* Floating-shell layout: sidebar and top bar are no longer flush against
        the viewport/each other - gap-3/p-3 (lg: 4) insets everything. The
        photographic backdrop (campusPhotoBg) and the glass sidebar/top bar
        now apply to EVERY tab of the workspace, not just the student
        Dashboard this treatment started on - a student opening DSA or a
        principal opening Manage sees the same chrome language rather than
        the app visually splitting in two depending which tab is active. */}
    <div data-theme={theme} style={{ ...campusPhotoBg(theme, userData?.campusBgUrl), minHeight: "100vh", colorScheme: theme }}
      className="campus-theme campus-photo-bg flex flex-col lg:flex-row gap-3 p-3 lg:gap-4 lg:p-4">
      <CampusExitConfirmDialog open={exitGuard.exitDialogOpen} institutionName={institution.name}
        onStay={exitGuard.stay} onLeave={exitGuard.leave} />
      <CampusContextSidebar institution={institution} collapsed={sidebarCollapsed} onToggleCollapse={toggleSidebarCollapsed}
        quickAccessOpen={quickAccessOpen} onToggleQuickAccess={toggleQuickAccess}
        slotRef={setSidebarEl} hasContent={hasSidebarContent}
        slug={slug} hiddenTabKeys={hiddenTabKeys} tab={tab} setTab={goTab}
        onSearchSelect={handleSearchSelect} userData={userData}
        onExpandSidebar={() => setSidebarCollapsed(false)} glass />
      <CampusMobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)}
        institution={institution} slug={slug} tab={tab} goTab={goTab} isInstAdmin={isInstAdmin}
        hiddenTabKeys={hiddenTabKeys} onJumpToManage={jumpToManage} onJumpToTrack={jumpToTrack}
        onJumpToDsaCategory={jumpToDsaCategory} onJumpToCompany={jumpToCompany} onJumpToContestPhase={jumpToContestPhase}
        onJumpToAssessment={jumpToAssessment} onSearchSelect={handleSearchSelect} onRequestExit={exitGuard.requestExit}
        onSignOut={async () => { await logout(); router.push("/"); }} />
      {/* Every tab: CampusTopBar used to have the rest of the workspace's
          content scroll underneath it by design (see CampusTopBar's own
          comment - .campus-glass-nav is deliberately readable-through for
          that, at 88% opacity precisely so text doesn't stay legible through
          it while scrolling). In practice every tab has SOMETHING sitting
          close enough to the top (a hero, a sub-tab strip, a leaderboard
          scope switcher) that it visibly collides with the bar almost
          immediately, not just "soft colour" scrolling past - actual heading/
          tab-label text behind the bar. So every tab now gets its own
          bounded, internally-scrolling region instead: same sticky/height-
          calc formula the sidebar already uses (lg:top-4 +
          lg:h-[calc(100vh-2rem)]), wrapped around CampusTopBar + content
          together so content can never be laid out behind the bar at all,
          regardless of scroll position - a bigger top margin only buys a few
          more pixels before the same slide-under happens, it doesn't stop it.
          CampusTopBar's own `sticky` becomes inert here (its containing block
          no longer scrolls), which is harmless - not worth a prop just to
          suppress a no-op class.
          Known, accepted tradeoff: a few tabs (campus-practice.jsx,
          gate-app.jsx, campus-dsa-sheet.jsx, campus-landing.jsx,
          lesson-blocks.jsx) call `window.scrollTo`/read `window.scrollY` for
          scroll-to-top-on-navigate and remember-my-scroll-position. Now that
          this div - not the window - is what actually scrolls, those calls
          quietly no-op instead of erroring (the window itself never moves),
          so those two conveniences stop working but nothing breaks. Revisit
          per-file if that's noticed and matters more than the overlap fix.
          No `overflow-hidden` on THIS outer box - it isn't needed for the
          vertical-bounding trick (the inner content div's own overflow-y-auto
          already contains its own overflow once flex-1 has sized it to
          "remaining height after CampusTopBar"), and overflow-hidden clips
          BOTH axes, not just vertical - it was cutting off content that
          overflowed sideways too (e.g. a wide promo banner card), not just
          preventing vertical slide-under. */}
      <div className="flex-1 min-w-0 flex flex-col gap-3 lg:gap-4 lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)]">
        <CampusTopBar institution={institution} userData={userData} setTab={goTab} slug={slug} uid={user?.uid} membership={membership}
          onOpenDrawer={() => setDrawerOpen(true)} drawerOpen={drawerOpen}
          tab={tab} hiddenTabKeys={hiddenTabKeys} onRequestExit={exitGuard.requestExit} glass />
        <div className="flex-1 px-5 sm:px-8 py-6 pb-24 lg:pb-0 min-w-0 lg:overflow-y-auto">
          {NAV_ITEMS.find(i => i.key === tab)?.moduleKey && !isTabAllowed(tab) ? (
            <ModuleAccessRestricted moduleLabel={NAV_ITEMS.find(i => i.key === tab)?.label || "This section"} onBack={() => goTab("dashboard")} />
          ) : tab === "dashboard" && isInstAdmin ? (
            <CampusAdminOverview slug={slug} institution={institution} onOpenContest={openContest} />
          ) : tab === "dashboard" && staffScope?.role === "hod" ? (
            <CampusHodDashboard institutionId={slug} department={staffScope.department} />
          ) : tab === "dashboard" && staffScope?.role === "facultyClassTeacher" ? (
            <CampusFacultyDashboard institutionId={slug} classroomId={staffScope.classroomId} />
          ) : tab === "dashboard" && staffScope?.role === "principal" ? (
            <CampusPrincipalDashboard institutionId={slug} institution={institution} />
          ) : tab === "dashboard" && staffScope ? (
            <CampusStaffOverview slug={slug} institution={institution} staffScope={staffScope} />
          ) : tab === "dashboard" ? (
            <OverviewTab slug={slug} userData={userData} totalCoins={totalCoins} membership={membership} isInstAdmin={isInstAdmin}
              onOpenContest={openContest} onContinueLearning={() => goTab("learning")}
              onBrowseDsa={() => goTab("dsa")} onBrowseCompanyVault={() => goTab("companyVault")}
              onBrowseLeaderboard={() => goTab("leaderboard")} onAssessments={() => goTab("assessments")}
              onBrowseContests={() => goTab("contests")}
              onManage={() => goTab("manage")} onProgramming={() => goTab("programming")}
              onCsCore={() => goTab("csCore")} onAptitude={() => goTab("aptitude")} />
          ) : null}
          {isTabAllowed("profile") && tab === "profile" && (
            <ProfileTab userData={userData} totalCoins={totalCoins} membership={membership} institution={institution} isInstAdmin={isInstAdmin} staffScope={staffScope} />
          )}
          {/* No isTabAllowed() moduleKey gate - roadmaps has moduleKey: null in
              campusNavConfig.js (a global, non-institution-scoped catalog with
              no per-classroom toggle), so isTabAllowed("roadmaps") is
              trivially true for every approved student; kept for consistency
              with every other tab here rather than special-cased away. */}
          {isTabAllowed("roadmaps") && tab === "roadmaps" && <CampusRoadmapsTab key={searchNonce} sidebarSlot={sidebarEl} />}
          {isTabAllowed("learning") && tab === "learning" && <CampusDailyLearningLanding slug={slug} sidebarSlot={sidebarEl} jumpToTrack={learningJump} onSearchSelect={handleSearchSelect} />}
          {isTabAllowed("fundamentals") && tab === "fundamentals" && <CampusFundamentalsTab sidebarSlot={sidebarEl} />}
          {isTabAllowed("programming") && tab === "programming" && <CampusProgrammingTab key={searchNonce} sidebarSlot={sidebarEl} />}
          {isTabAllowed("csCore") && tab === "csCore" && <CampusCsCoreTab key={searchNonce} sidebarSlot={sidebarEl} />}
          {isTabAllowed("aptitude") && tab === "aptitude" && <CampusAptitudeTab key={searchNonce} sidebarSlot={sidebarEl} />}
          {isTabAllowed("gate") && tab === "gate" && <CampusGateTab key={searchNonce} sidebarSlot={sidebarEl} />}
          {isTabAllowed("dsa") && tab === "dsa" && (
            <>
              {/* Category filter is a PROBLEM-LIST control, so it's portaled only
                  in problems mode - in sheet/concepts mode the roadmap is the
                  navigation and a stray category filter would do nothing. Gated
                  on the list view too: while a problem is open it filters a list
                  that isn't on screen, and changing it there silently discarded
                  the return position. */}
              {sidebarEl && dsaMode === "problems" && practiceScreen.view === "list" && createPortal(
                <>
                  <div className="px-1 pb-2 mb-1 text-[10px] font-mono tracking-widest" style={{ color: CAMPUS.inkFaint }}>DSA</div>
                  <CategoryFilterList sortAlpha value={practiceCategory} onChange={setPracticeCategory} />
                </>,
                sidebarEl
              )}
              {/* Hidden while a problem is open: the problem view is a full
                  screen with its own back affordance, and a mode switch there
                  would silently discard the learner's in-progress attempt. */}
              {practiceScreen.view === "list" && (
                <div className="mb-4">
                  <CampusTabBar value={dsaMode} onChange={setDsaMode} tabs={[
                    { key: "sheet", label: "Sheet" },
                    { key: "concepts", label: "Concepts" },
                    { key: "problems", label: "Problems" },
                  ]} />
                </div>
              )}
              {practiceScreen.view === "list" && dsaMode === "sheet" ? (
                <CampusDsaSheets hiddenIds={new Set(contentVisibility.hiddenProblemIds)}
                  // Deliberately does NOT switch dsaMode: opening a problem from
                  // the sheet should return TO the sheet, so the learner keeps
                  // their place in the roadmap.
                  onOpenProblem={(id) => setPracticeScreen({ view: "problem", problemId: id })}
                  // Concepts are per-language and the sheet doesn't know which
                  // language this learner picked, so this hands off to the
                  // Concepts surface (where they choose) rather than guessing.
                  onOpenConcept={() => setDsaMode("concepts")} />
              ) : practiceScreen.view === "list" && dsaMode === "concepts" ? (
                <CampusDsaConcepts
                  // The bridge in the practice direction: opening a linked
                  // problem from a concept hands off to the real problem view
                  // rather than reimplementing it here.
                  //
                  // Deliberately does NOT switch dsaMode, for the same reason
                  // the Sheet above doesn't: the problem view renders from the
                  // else-branch below regardless of which mode is active, so
                  // switching bought nothing and cost the return journey -
                  // Back landed on the Problems list instead of the concept
                  // the learner was reading.
                  onOpenProblem={(id) => setPracticeScreen({ view: "problem", problemId: id })} />
              ) : (
              <>
              {practiceScreen.view === "list" && (
                <>
                  <DsaProgressSummary user={user} />
                  {/* Shown inline on every screen size now, not just below lg:
                      (it used to be lg:hidden because the desktop sidebar's own
                      portaled copy of this same list was considered enough -
                      but that one's easy to miss/scroll past, and the request
                      was for topic counts to sit in the main content next to
                      Difficulty, LeetCode-tag-cloud style, not tucked in the
                      rail). The sidebar's own CategoryFilterList portal stays
                      too - same value/onChange, so the two can never disagree. */}
                  <div className="mb-4">
                    <CategoryFilterList horizontal sortAlpha value={practiceCategory} onChange={setPracticeCategory} />
                  </div>
                  <div className="flex gap-5 flex-wrap mb-6">
                    <SidebarFilterGroup horizontal label="DIFFICULTY" options={["All", ...CODELAB_DIFFICULTIES]} value={practiceDifficulty} onChange={setPracticeDifficulty} />
                    <CompanyFilterList horizontal value={practiceCompany} onChange={setPracticeCompany} />
                  </div>
                </>
              )}
              {practiceScreen.view === "problem"
                ? <CampusProblemView problemId={practiceScreen.problemId} onBack={() => setPracticeScreen({ view: "list" })} backLabel="DSA" />
                : <CampusPracticeList hideFilters category={practiceCategory} difficulty={practiceDifficulty} company={practiceCompany}
                    hiddenIds={new Set(contentVisibility.hiddenProblemIds)}
                    onSelect={(id) => setPracticeScreen({ view: "problem", problemId: id })} />
              }
              </>
              )}
            </>
          )}
          {isTabAllowed("companyVault") && tab === "companyVault" && (
            <>
              {sidebarEl && createPortal(
                <CompanySidebarList activeCompanyId={companyPrepScreen.view !== "list" ? companyPrepScreen.companyId : null}
                  onSelect={(companyId) => setCompanyPrepScreen({ view: "company", companyId })} />,
                sidebarEl
              )}
              <CampusCompanyPrepFlow screen={companyPrepScreen} setScreen={setCompanyPrepScreen}
                hiddenIds={new Set(contentVisibility.hiddenCompanyIds)} />
            </>
          )}
          {isTabAllowed("assessments") && tab === "assessments" && <CampusDailyAssessmentsTab slug={slug} sidebarSlot={sidebarEl} jumpToAssessment={assessmentJump} />}
          {isTabAllowed("contests") && tab === "contests" && (
            <CampusContestsTabContent institutionId={slug} screen={contestScreen} setScreen={setContestScreen}
              sidebarSlot={sidebarEl} phaseFilter={contestPhaseFilter} setPhaseFilter={setContestPhaseFilter}
              student={{ uid: user?.uid, department: membership?.department, year: membership?.year, section: membership?.section, classroomId: membership?.classroomId }}
              bypassScope={isInstAdmin || !!staffScope} canManage={isTabAllowed("manage")} />
          )}
          {tab === "leaderboard" && <CampusLeaderboardTab slug={slug} myUid={user?.uid} myClassroom={myClassroom} />}
          {tab === "manage" && (
            // isTabAllowed("manage"), NOT isInstAdmin directly - the nav item
            // and the thing it navigates to have to read the same gate, or
            // they disagree: NAV_ITEMS' "manage" entry lists staffRoles
            // ["hod"], so an HOD was shown the Manage nav item and then hit
            // "Access restricted" the moment they clicked it. isTabAllowed
            // resolves that one staffRoles list for both surfaces.
            isTabAllowed("manage")
              ? <CampusManage institutionId={slug} institution={institution}
                  initialTab={initialManageTab} initialStudentsView={initialManageStudentsView}
                  jumpToManageTab={manageJump} sidebarSlot={sidebarEl}
                  onInstitutionUpdated={(patch) => setInstitution(prev => ({ ...(prev || {}), ...patch }))} />
              // Frontend gate only for the UI decision of what to render - the
              // real authority is firestore.rules, which gates each Manage
              // write on isInstitutionAdmin() or, for the collections that
              // carry a scope field, isHodOfDepartment(). So someone hitting a
              // /manage/* URL directly still can't write anything their role
              // doesn't already allow; this just gives them an honest message
              // instead of a blank panel. WHICH tabs a scoped role sees inside
              // Manage is a separate, narrower decision - see
              // campus-manage.jsx's SCOPED_ROLE_MANAGE_TABS.
              : (
                <CampusEmptyState icon={Lock} title="Access restricted"
                  description="Manage is only available to this campus's own admins." />
              )
          )}
        </div>
      </div>
      <CampusBottomNav tab={tab} setTab={goTab} hiddenTabKeys={hiddenTabKeys} />
    </div>
    </CampusPermissionsContext.Provider>
  );
}

// Shown instead of a gated tab's real content when the signed-in student's
// own classroom has this module disabled (Manage -> that module's own tab ->
// Manage Access) - covers every way the tab could be reached, not just the
// nav rail: a static SEO route (e.g. /campus/mrcet/dsa), a stale ?tab=dsa
// link, or the mobile bottom nav all render this same check, since it lives
// in the one place every tab's content is actually chosen (CampusWorkspace's
// render), not in the nav components that merely link to it.
function ModuleAccessRestricted({ moduleLabel, onBack }) {
  return (
    <CampusEmptyState icon={Lock} title="Access restricted"
      description={`${moduleLabel} isn't enabled for your classroom right now. If you think this is a mistake, contact your campus admin.`}
      action={<CampusButton variant="secondary" onClick={onBack}>Back to Overview</CampusButton>} />
  );
}

// Makes a real institution workspace behave like a dedicated app rather than
// a normal page - the browser Back button (and the "Return to DeVert" link,
// wired up separately by whoever calls requestExit) asks for confirmation
// instead of silently dropping the user back on the Campus directory.
//
// The Back-button half works by keeping one extra, same-URL history entry
// "in reserve" ahead of wherever the user actually is: pushState on mount
// adds it, and every popstate (a real Back press) immediately pushes another
// one right back - since the URL never changes, nothing here ever actually
// unmounts the workspace or loses tab/scroll state.
//
// CORRECTNESS-CRITICAL: tab switching (and Manage's own nested tab/
// studentsView sync) only ever uses history.replaceState, never pushState -
// so there are NO real intermediate history entries for a Back press to
// consume on its way "up" through in-campus navigation. Every popstate,
// however deep the user has drilled in, lands on this SAME one reserved
// entry. Without the popCampusBack() check below, that meant the very FIRST
// Back press anywhere inside Campus (Manage, Classrooms, Programming's
// topic view, anywhere) incorrectly asked to leave instead of stepping back
// one level - a real, repeatedly-reported bug. popCampusBack() (see
// lib/campusNav.js) asks every currently-mounted non-root screen "do you
// have a step back to take" first; only when NOTHING is registered (every
// screen is already at its own shallowest view) does this actually show the
// Leave Campus dialog.
function useCampusExitGuard(active) {
  const router = useRouter();
  const [exitDialogOpen, setExitDialogOpen] = useState(false);
  const pendingDestination = useRef("/");

  useEffect(() => {
    if (!active) return;
    window.history.pushState({ campusExitGuard: true }, "");
    const onPopState = () => {
      window.history.pushState({ campusExitGuard: true }, "");
      if (popCampusBack()) return;
      pendingDestination.current = "/";
      setExitDialogOpen(true);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [active]);

  const requestExit = (destination) => {
    pendingDestination.current = destination;
    setExitDialogOpen(true);
  };
  const stay = () => setExitDialogOpen(false);
  const leave = () => {
    setExitDialogOpen(false);
    router.push(pendingDestination.current);
  };

  return { exitDialogOpen, requestExit, stay, leave };
}

// Esc-to-cancel, backdrop blur, focus lands on "Stay" (the safe default) so
// an accidental Enter never leaves the workspace. institutionName is always
// passed in live from the current institution doc - never hardcoded.
function CampusExitConfirmDialog({ open, institutionName, onStay, onLeave }) {
  const stayRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    stayRef.current?.focus();
    document.body.style.overflow = "hidden";
    const onKey = (e) => { if (e.key === "Escape") onStay(); };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div key="backdrop" onClick={onStay}
            className="fixed inset-0 z-[70]" style={{ background: "rgba(10,16,20,0.55)", backdropFilter: "blur(4px)" }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} />
          <motion.div key="dialog" role="dialog" aria-modal="true" aria-labelledby="campus-exit-title" aria-describedby="campus-exit-desc"
            className="fixed z-[71] left-1/2 top-1/2 w-[92vw] max-w-[420px] p-6"
            style={{ background: CAMPUS.surface, border: `1px solid ${CAMPUS.line}`, borderRadius: 16, boxShadow: CAMPUS.shadowLg }}
            initial={{ opacity: 0, scale: 0.95, x: "-50%", y: "-45%" }}
            animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
            exit={{ opacity: 0, scale: 0.95, x: "-50%", y: "-45%" }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: CAMPUS.tealTint, color: CAMPUS.teal }}>
              <DoorOpen size={20} />
            </div>
            <h3 id="campus-exit-title" className="text-[17px] font-semibold mb-2" style={{ color: CAMPUS.ink }}>
              Leave {institutionName} Campus?
            </h3>
            <p id="campus-exit-desc" className="text-[13.5px] leading-relaxed mb-6" style={{ color: CAMPUS.inkSoft }}>
              You&apos;re currently inside the <b style={{ color: CAMPUS.ink }}>{institutionName} Campus Workspace</b>. Are you sure you want to leave? You can always re-enter this campus later from the Campus section.
            </p>
            <div className="flex gap-2.5">
              <button ref={stayRef} onClick={onStay}
                className="flex-1 text-[13px] font-semibold py-2.5 rounded-lg transition-opacity hover:opacity-90"
                style={{ background: CAMPUS.teal, color: "#fff" }}>
                Stay in Campus
              </button>
              <button onClick={onLeave}
                className="flex-1 text-[13px] font-medium py-2.5 rounded-lg transition-colors"
                style={{ border: `1px solid ${CAMPUS.line}`, color: CAMPUS.inkSoft }}>
                Leave Campus
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Company Vault's own sub-navigation, portaled into CampusContextSidebar's
// slot - the published company list, same data CampusCompanyPrepFlow's own
// list view already fetches, just a second, independent fetch for the more
// compact sidebar rendering (same tradeoff already made for every other
// sidebar list in this file).
function CompanySidebarList({ activeCompanyId, onSelect }) {
  const [companies, setCompanies] = useState(null);
  useEffect(() => { fetchPublishedCompanies().then(setCompanies).catch(() => setCompanies([])); }, []);
  return (
    <>
      <div className="px-1 pb-2 mb-1 text-[10px] font-mono tracking-widest" style={{ color: CAMPUS.inkFaint }}>COMPANY VAULT</div>
      {companies === null ? (
        <CampusSkeleton height={100} className="mx-1" />
      ) : companies.map(c => (
        <button key={c.id} onClick={() => onSelect(c.id)}
          className="campus-btn flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all duration-150"
          style={{
            background: activeCompanyId === c.id ? CAMPUS.gradientPrimary : "transparent",
            color: activeCompanyId === c.id ? "#fff" : CAMPUS.inkSoft,
            boxShadow: activeCompanyId === c.id ? CAMPUS.shadow : "none",
          }}>
          <span className="text-[13px] font-medium truncate">{c.name}</span>
        </button>
      ))}
    </>
  );
}

// Navigation Architecture 2.0 - Level 1 (Global Navigation). Horizontal
// top-navbar rendering of the exact same NAV_ITEMS/hiddenTabKeys/GROUP_ORDER
// data the old vertical CampusNavRail used to render - same array, same
// role-gating logic, just a different renderer, so no authorization logic is
// duplicated. GROUP_ORDER draws a subtle divider between groups rather than a
// labeled section (a flat horizontal row reads fine at 13 items; stacked
// group headers don't translate to a horizontal layout). Desktop-only
// (lg:flex) - mobile keeps CampusBottomNav/CampusMobileDrawer, unchanged.
function TopNavItem({ item, tab, setTab }) {
  const Icon = item.icon;
  const active = tab === item.key;
  return (
    // Solid filled pill on the active tab (rounded-full, not a tint wash in
    // a rounded-lg box) - the Material-style segmented-tab pattern, matching
    // the reference's solid-color active pill rather than the previous
    // subtle-tint treatment.
    <button onClick={() => setTab(item.key)}
      className="relative flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[13px] font-semibold whitespace-nowrap flex-shrink-0 transition-colors"
      style={{ color: active ? "#fff" : CAMPUS.inkSoft }}>
      {active && (
        <motion.span layoutId="campus-top-nav-active" className="absolute inset-0 rounded-full -z-10"
          style={{ background: CAMPUS.teal }} transition={{ type: "spring", stiffness: 500, damping: 35 }} />
      )}
      <Icon size={14} className="flex-shrink-0" /> {item.label}
    </button>
  );
}

function CampusTopNavbar({ tab, setTab, hiddenTabKeys }) {
  const groups = GROUP_ORDER
    // "profile" is deliberately excluded from the top navbar - it already
    // has a dedicated entry point via the account avatar menu's "View
    // Profile" (CampusProfileMenu), so listing it a second time here would
    // just be redundant clutter in the busiest nav surface. Still present in
    // CampusBottomNav/CampusMobileDrawer on mobile, where there's no
    // equivalent shortcut.
    .map(groupKey => ({ key: groupKey, items: NAV_ITEMS.filter(i => i.parentGroup === groupKey && i.key !== "profile" && i.desktopVisibility && !hiddenTabKeys?.has(i.key)) }))
    .filter(g => g.items.length > 0);
  return (
    <nav className="hidden lg:flex items-center gap-0.5 overflow-x-auto no-scrollbar flex-1 min-w-0">
      {groups.map((group, i) => (
        <div key={group.key} className="flex items-center gap-0.5 flex-shrink-0"
          style={i > 0 ? { marginLeft: 6, paddingLeft: 6, borderLeft: `1px solid ${CAMPUS.line}` } : undefined}>
          {group.items.map(item => <TopNavItem key={item.key} item={item} tab={tab} setTab={setTab} />)}
        </div>
      ))}
    </nav>
  );
}


// The sidebar's own nav-row treatment. Deliberately NOT shared with TopNavItem:
// that one is a horizontal pill with a layoutId transition between siblings, and
// this is a full-width vertical row with a leading accent bar. Forcing one
// component to do both would take more props than either needs.
function SidebarNavButton({ item, active, collapsed, onClick }) {
  if (!item) return null;
  const Icon = item.icon;
  return (
    <button onClick={onClick} title={collapsed ? item.label : undefined}
      className={`flex items-center gap-2.5 rounded-xl text-[12.5px] font-semibold transition-all ${collapsed ? "justify-center py-1.5" : "px-2 py-1.5"}`}
      style={{ color: active ? CAMPUS.ink : CAMPUS.inkSoft }}>
      {/* Filled CAMPUS.gradientPrimary badge behind the icon on the active
          item, not a tinted row + left bar - a solid indigo/violet chip
          reads as "current location" more clearly than a wash, and reuses
          the same gradient the sidebar's own logo badge and every primary
          button already use (no new color introduced). */}
      <span className="w-8 h-8 rounded-[10px] flex items-center justify-center flex-shrink-0 transition-all"
        style={active
          ? { background: CAMPUS.gradientPrimary, color: "#fff", boxShadow: CAMPUS.shadowHover }
          : { background: "transparent", color: "inherit" }}>
        <Icon size={15} />
      </span>
      {!collapsed && item.label}
    </button>
  );
}

// Navigation Architecture 2.0 - Level 2 (Contextual Sidebar). A generic,
// config-agnostic portal target living in the exact physical slot the old
// CampusNavRail occupied (same width tokens, same collapse toggle/icons) -
// but it knows nothing about NAV_ITEMS, MANAGE_TABS, or TRACK_CATALOG. The
// active module portals ITS OWN existing sub-navigation list into `slotRef`
// instead of this component (or CampusWorkspace) owning a second copy of
// that module's state - see CampusManage/CampusDailyLearningLanding for the
// two modules wired up so far (more follow in later migration passes).
// Collapses to nothing (not an empty box) when the active module has no
// sub-navigation to contribute, per the Navigation Architecture 2.0 RFC's
// "Empty Modules" guidance.
// `hasContent` no longer gates the whole aside. It used to, per the Navigation
// Architecture 2.0 RFC's "Empty Modules" guidance - a sidebar with nothing in it
// collapsed to nothing rather than rendering an empty box. That still holds for
// the module-contributed portion, but the sidebar now also carries chrome that
// is global rather than contextual: Search, plus whichever NAV_ITEMS entries
// are flagged `sidebarGlobal` (currently Dashboard and Daily Learning - see
// campusNavConfig.js). Those are always present, so the aside always renders
// and `hasContent` instead decides whether the module slot gets a divider
// above it.
const SIDEBAR_GLOBAL_ITEMS = NAV_ITEMS.filter(i => i.sidebarGlobal);

function CampusContextSidebar({
  institution, collapsed, onToggleCollapse, slotRef, hasContent,
  slug, hiddenTabKeys, tab, setTab, onSearchSelect, onExpandSidebar, userData, glass = false,
  quickAccessOpen = true, onToggleQuickAccess,
}) {
  return (
    // A floating rail, inset on every side by the workspace shell's own
    // gap/padding (campus-app.jsx's root div) rather than a flush panel with
    // one right border. Opaque Material surface + soft shadow elevation
    // (CAMPUS.surface/CAMPUS.shadow, the same fill/shadow CampusCard uses by
    // default), NOT .campus-glass/backdrop-filter by default - real Google
    // Material's own depth language is layered shadow elevation, not frosted
    // blur. `glass` opts into .campus-glass instead - passed true only while
    // the student Dashboard's photo backdrop is showing (CampusWorkspace's
    // isStudentDashboardHome), where an opaque panel would hide the photo
    // entirely rather than let it read through like every other card there.
    // lg:top-4/h-[calc(...)] keep it pinned at that 1rem inset instead of
    // overflowing past the viewport by the padding it now sits inside.
    <aside style={{ ...(glass ? {} : { background: CAMPUS.surface }), border: `1px solid ${glass ? CAMPUS.glassBorder : CAMPUS.line}`, boxShadow: CAMPUS.shadow }}
      className={`hidden lg:flex flex-shrink-0 lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)] lg:self-start rounded-[24px] overflow-hidden py-4 flex-col transition-[width] duration-200 ${glass ? "campus-glass" : ""} ${collapsed ? "lg:w-[60px]" : "lg:w-[230px]"}`}>
      {/* Institution logo/name also appears in CampusTopBar (the global
          "where am I" chrome) - kept here too, at the requester's ask, so
          the sidebar keeps its own identity marker even when scrolled past
          the top bar or when the top bar's copy is out of view. */}
      <div className={`flex items-center gap-2.5 px-3 pb-4 mb-1 ${collapsed ? "justify-center" : ""}`} style={{ borderBottom: `1px solid ${CAMPUS.line}` }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-[13px] flex-shrink-0 overflow-hidden"
          style={institution?.logoUrl
            ? { background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}` }
            : { background: CAMPUS.gradientPrimary, color: "#fff", boxShadow: CAMPUS.shadow }}>
          {institution?.logoUrl
            ? <img src={institution.logoUrl} alt="" className="w-full h-full object-cover" />
            : institution?.name?.slice(0, 2).toUpperCase()}
        </div>
        {!collapsed && (
          <b className="min-w-0 truncate text-[13px]" style={{ color: CAMPUS.ink }} title={institution?.name}>
            {institution?.shortName?.trim() || institutionInitials(institution?.name) || institution?.name}
          </b>
        )}
      </div>
      {/* Global, always-present sidebar chrome: Search. Sits ABOVE the module
          slot because it is not contextual - it means the same thing whichever
          module is open, and is the fastest route to anything, including the
          module you are already in. */}
      <div className={`${collapsed ? "px-2" : "px-3"} pt-3 flex flex-col gap-1`}>
        <CampusSidebarSearch slug={slug} hiddenTabKeys={hiddenTabKeys} collapsed={collapsed}
          onSelect={onSearchSelect} onExpandSidebar={onExpandSidebar} />
        {/* "Quick Access" heading only makes sense at full width - a 60px
            icon rail has no room for the label anyway, so collapsed mode
            skips straight to the bare icon buttons, unaffected by
            quickAccessOpen. */}
        {collapsed ? (
          SIDEBAR_GLOBAL_ITEMS.filter(i => !hiddenTabKeys?.has(i.key)).map(item => (
            <SidebarNavButton key={item.key} item={item} active={tab === item.key} collapsed={collapsed}
              onClick={() => setTab(item.key)} />
          ))
        ) : (
          <>
            <button onClick={onToggleQuickAccess} aria-expanded={quickAccessOpen}
              className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-mono font-semibold tracking-widest transition-colors"
              style={{ color: CAMPUS.inkFaint }}>
              {quickAccessOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              QUICK ACCESS
            </button>
            {quickAccessOpen && SIDEBAR_GLOBAL_ITEMS.filter(i => !hiddenTabKeys?.has(i.key)).map(item => (
              <SidebarNavButton key={item.key} item={item} active={tab === item.key} collapsed={collapsed}
                onClick={() => setTab(item.key)} />
            ))}
          </>
        )}
      </div>

      {/* Portal target - deliberately empty here; whichever module is active
          renders its own list into this node via createPortal. */}
      <div ref={slotRef}
        className={`flex-1 overflow-y-auto min-h-0 px-3 flex flex-col gap-1 ${hasContent ? "pt-3 mt-3" : ""}`}
        style={hasContent ? { borderTop: `1px solid ${CAMPUS.line}` } : undefined} />
      {/* Streak footer widget - real userData.streak/bestStreak, same honest
          "% of your own best" framing StreakRingCard uses on the dashboard
          (no streak GOAL exists in the data model, so that's the only
          truthful denominator). Hidden when collapsed - there's no room for
          copy at 60px, and a bare flame icon with no number is just noise. */}
      {!collapsed && userData && (
        <div className="px-3 pt-3 mt-1">
          <div className="rounded-xl p-3" style={{ background: CAMPUS.orangeTint }}>
            <div className="flex items-center gap-2">
              <Flame size={14} style={{ color: CAMPUS.orange }} />
              <span className="text-[12.5px] font-bold" style={{ color: CAMPUS.ink }}>
                {userData.streak ?? 0} {(userData.streak ?? 0) === 1 ? "Day" : "Days"} Streak
              </span>
            </div>
            <p className="text-[10.5px] mt-1 leading-snug" style={{ color: CAMPUS.inkSoft }}>
              {(userData.streak ?? 0) > 0 ? "Keep the momentum going!" : "Complete an activity today to start."}
            </p>
          </div>
        </div>
      )}
      <button onClick={onToggleCollapse}
        className={`flex items-center gap-1.5 text-[11px] font-medium pt-3 mt-1 mx-3 transition-colors ${collapsed ? "justify-center" : ""}`}
        style={{ color: CAMPUS.inkFaint, borderTop: `1px solid ${CAMPUS.line}` }}>
        {collapsed ? <PanelLeftOpen size={14} /> : <><PanelLeftClose size={13} /> Collapse</>}
      </button>
    </aside>
  );
}

// Fixed Material-style bottom nav, mobile only (lg:hidden) - the busiest
// tabs only (NAV_ITEMS entries with mobileVisibility "bottomNav"), always a
// strict subset of what the hamburger drawer shows; everything else stays
// reachable via the drawer instead of crowding the bottom nav further.
const BOTTOM_NAV_ITEMS = NAV_ITEMS.filter(i => i.mobileVisibility === "bottomNav").sort((a, b) => a.order - b.order);

function CampusBottomNav({ tab, setTab, hiddenTabKeys }) {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-20 flex items-stretch"
      style={{ background: CAMPUS.surface, borderTop: `1px solid ${CAMPUS.line}`, boxShadow: CAMPUS.shadowHover }}>
      {BOTTOM_NAV_ITEMS.filter(t => !hiddenTabKeys?.has(t.key)).map(t => {
        const Icon = t.icon;
        const active = tab === t.key;
        return (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="flex-1 flex flex-col items-center gap-1 py-2.5 transition-colors"
            style={{ color: active ? CAMPUS.teal : CAMPUS.inkFaint }}>
            <Icon size={18} />
            <span className="text-[10px] font-medium">{t.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

// Kebab menu of page-level actions for the current institution's workspace -
// Share (native share sheet where supported, falls back to copy), Copy link,
// and Save this Campus (a real toggle, written to the user's own profile doc
// via toggleFavoriteInstitution - not a UI stub with no effect).
// Everything anchored to the top-right profile avatar. Opens on an identity
// header (photo, name, roll number - the same membership field ProfileTab's
// own "Roll number" row reads) so the menu confirms who you're signed in as
// before listing actions, then Share/Copy link/Save this Campus, then
// Return to DeVert and Sign out below a divider. Consolidated here (rather
// than a separate "..." icon) so the avatar is the one place every account/
// campus-level action lives.
function CampusProfileMenu({ institution, slug, userData, uid, membership, setTab, onRequestExit }) {
  const { logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/${slug}` : `/${slug}`;
  const isSaved = (userData?.favoriteInstitutions || []).includes(slug);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (e) { console.error(e); }
  };

  const handleShare = async () => {
    const shareData = { title: `${institution.name} on DeVert Campus`, text: `Join ${institution.name}'s workspace on DeVert Campus.`, url: shareUrl };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch { /* user cancelled the share sheet */ }
      setOpen(false);
    } else {
      await copyLink();
    }
  };

  const handleToggleSave = async () => {
    if (!uid || saving) return;
    setSaving(true);
    try { await toggleFavoriteInstitution(uid, slug, isSaved); }
    catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  // Signing out of a college's workspace should land back on the Campus
  // directory, not the main DeVert marketing/dashboard route - this is a
  // separate application from the student's point of view.
  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const ITEM_STYLE = { color: CAMPUS.ink };
  const onEnter = (e) => { e.currentTarget.style.background = CAMPUS.paper; };
  const onLeave = (e) => { e.currentTarget.style.background = "transparent"; };

  const goToProfile = () => { setTab("profile"); setOpen(false); };

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(o => !o)} title="Account"
        className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 overflow-hidden"
        style={{ background: CAMPUS.goldTint, color: CAMPUS.gold }}>
        {userData?.photoURL
          ? <img src={userData.photoURL} alt="" className="w-full h-full object-cover" />
          : (userData?.displayName || "?").slice(0, 2).toUpperCase()}
      </button>
      {open && (
        // Opaque (CAMPUS.surface), not .campus-glass - this menu has no
        // photo backdrop to let show through like the sidebar's `glass` prop
        // does, so the shared glass class's ~50% fill just made whatever
        // page content sits behind it (section headers, card text) bleed
        // through and compete with the menu's own labels.
        <div className="absolute right-0 top-full mt-2 z-30 rounded-lg overflow-hidden"
          style={{ width: 250, background: CAMPUS.surface, border: `1px solid ${CAMPUS.line}`, boxShadow: CAMPUS.shadowLg }}>
          {/* Identity header - who's signed in, plus a one-tap way to the full
              ProfileTab (avatar upload, department/phone/contact email, and
              this same roll number). Not a duplicate of that page, just the
              at-a-glance version + a way there. */}
          <div className="flex items-center gap-2.5 px-3.5 pt-3.5 pb-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-bold flex-shrink-0 overflow-hidden"
              style={{ background: CAMPUS.goldTint, color: CAMPUS.gold }}>
              {userData?.photoURL
                ? <img src={userData.photoURL} alt="" className="w-full h-full object-cover" />
                : (userData?.displayName || "?").slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold truncate" style={{ color: CAMPUS.ink }}>{userData?.displayName || "Your account"}</p>
              {membership?.rollNumber
                ? (
                  <p className="flex items-center gap-1 text-[11.5px] font-mono truncate" style={{ color: CAMPUS.inkFaint }}>
                    <Hash size={10} /> {membership.rollNumber}
                  </p>
                )
                : userData?.handle && (
                  <p className="text-[11.5px] truncate" style={{ color: CAMPUS.inkFaint }}>@{userData.handle}</p>
                )}
            </div>
          </div>
          <button onClick={goToProfile} onMouseEnter={onEnter} onMouseLeave={onLeave}
            className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 text-[12.5px] text-left transition-colors"
            style={{ ...ITEM_STYLE, borderTop: `1px solid ${CAMPUS.line}`, borderBottom: `1px solid ${CAMPUS.line}` }}>
            <span className="flex items-center gap-2.5"><IdCard size={14} style={{ color: CAMPUS.teal }} /> View full profile</span>
            <ChevronRight size={14} style={{ color: CAMPUS.inkFaint }} />
          </button>
          <button onClick={handleShare} onMouseEnter={onEnter} onMouseLeave={onLeave}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[12.5px] text-left transition-colors" style={ITEM_STYLE}>
            <Share2 size={14} style={{ color: CAMPUS.teal }} /> Share {institution.name}
          </button>
          <button onClick={copyLink} onMouseEnter={onEnter} onMouseLeave={onLeave}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[12.5px] text-left transition-colors"
            style={{ ...ITEM_STYLE, borderTop: `1px solid ${CAMPUS.line}` }}>
            {copied ? <Check size={14} style={{ color: CAMPUS.good }} /> : <Link2 size={14} style={{ color: CAMPUS.blue }} />}
            {copied ? "Link copied!" : "Copy link"}
          </button>
          {uid && (
            <button onClick={handleToggleSave} disabled={saving} onMouseEnter={onEnter} onMouseLeave={onLeave}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[12.5px] text-left transition-colors disabled:opacity-50"
              style={{ ...ITEM_STYLE, borderTop: `1px solid ${CAMPUS.line}` }}>
              {isSaved ? <BookmarkCheck size={14} style={{ color: CAMPUS.good }} /> : <Bookmark size={14} style={{ color: CAMPUS.gold }} />}
              {isSaved ? "Saved to your Campuses" : "Save this Campus"}
            </button>
          )}
          {onRequestExit && (
            <button onClick={() => { setOpen(false); onRequestExit("/"); }} onMouseEnter={onEnter} onMouseLeave={onLeave}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[12.5px] text-left transition-colors"
              style={{ ...ITEM_STYLE, borderTop: `1px solid ${CAMPUS.line}` }}>
              <ArrowLeft size={14} style={{ color: CAMPUS.inkFaint }} /> Return to DeVert Campus
            </button>
          )}
          <button onClick={handleLogout} onMouseEnter={onEnter} onMouseLeave={onLeave}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[12.5px] text-left transition-colors"
            style={{ color: CAMPUS.bad, borderTop: `1px solid ${CAMPUS.line}` }}>
            <LogOut size={14} /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}

function CampusTopBar({ institution, userData, setTab, slug, uid, membership, onOpenDrawer, drawerOpen, tab, hiddenTabKeys, onRequestExit, glass = false }) {
  return (
    // Floating pill, same opaque Material surface + shadow as the sidebar by
    // default - sticky top-3/lg:top-4 matches the sidebar's own inset so
    // scrolled content stays pinned at the same gap on both instead of one
    // flush at 0 and the other floating at 1rem. `glass` uses .campus-glass-nav,
    // NOT .campus-glass (the sidebar's own card-glass variant) - this bar has
    // the whole tab's content scrolling underneath it, same as campus-public-
    // nav.jsx's <nav>, and .campus-glass's weaker blur/saturation lets that
    // scrolling text stay readable through the bar instead of softening into
    // "colour and movement". See both classes' comments in globals.css.
    // py-[18px] (not py-3.5) so this bar's total height matches the sidebar's
    // own logo row exactly: that row is the aside's py-4 (16px) + its w-9 h-9
    // logo (36px) + its own pb-4 (16px) = 68px; this bar's tallest child is
    // the 32px avatar/theme-toggle buttons (w-8 h-8), so 18px top+bottom
    // padding (36px) + 32px = 68px too. Bumped from 14px specifically to
    // land on that number, not a rounder Tailwind step like py-4 (which
    // would land on 64px, 4px short).
    // This header's PARENT (the wrapper div in CampusWorkspace's render) is
    // now `lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)]` for EVERY tab, not
    // just Dashboard/Manage (that started tab-scoped, then widened - see the
    // wrapper's own comment). Nesting a SECOND `position: sticky` element
    // with its own `top` inset directly inside a sticky ancestor makes
    // browsers apply that inset as a permanent downward shift even at scroll
    // position 0 - confirmed by reproducing the exact class combination in
    // isolation, not a guess. That was caught and fixed for Dashboard/Manage
    // specifically before the wrapper went universal, which silently
    // reintroduced the same bug for every OTHER tab (their header still had
    // `lg:top-4` since the wrapper wasn't sticky for them yet at the time).
    // `lg:static` is therefore now unconditional, for the same reason on
    // every tab: the ALREADY-pinned, already-bounded wrapper is what keeps
    // this header in view; it doesn't need to independently stick to
    // anything itself. The sidebar never hit this because it's a single,
    // non-nested sticky element with no sticky ancestor of its own.
    <header className={`flex items-center gap-3 px-5 sm:px-8 py-[18px] flex-shrink-0 sticky top-3 lg:static z-30 rounded-[22px] ${glass ? "campus-glass-nav" : ""}`}
      style={{ ...(glass ? {} : { background: CAMPUS.surface }), border: `1px solid ${glass ? CAMPUS.glassBorder : CAMPUS.line}`, boxShadow: CAMPUS.shadow }}>
      <button onClick={onOpenDrawer} aria-label="Open navigation" aria-expanded={drawerOpen} aria-haspopup="dialog"
        className="lg:hidden flex items-center justify-center flex-shrink-0 rounded-lg -ml-1.5"
        style={{ width: 44, height: 44, color: CAMPUS.inkSoft }}>
        <Menu size={20} />
      </button>
      <div className="lg:hidden w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[12px] flex-shrink-0 overflow-hidden"
        style={institution.logoUrl ? { background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}` } : { background: CAMPUS.teal, color: "#fff" }}>
        {institution.logoUrl
          ? <img src={institution.logoUrl} alt="" className="w-full h-full object-cover" />
          : institution.name?.slice(0, 2).toUpperCase()}
      </div>
      {/* Institution branding lives only in CampusContextSidebar now - was
          duplicated here briefly, but the ask was to move it, not show it
          in both places. */}
      <CampusTopNavbar tab={tab} setTab={setTab} hiddenTabKeys={hiddenTabKeys} />
      <div className="lg:hidden flex-1" />
      {/* Real XP balance (userData.xp, the same number the dashboard's own
          stat card shows) as its own pill - CAMPUS.teal, same primary accent
          the rest of the chrome uses, not a new color. */}
      <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full flex-shrink-0" style={{ background: CAMPUS.tealTint, color: CAMPUS.teal }}>
        <Zap size={13} />
        <span className="text-[12px] font-bold tabular-nums">{(userData?.xp ?? 0).toLocaleString()} XP</span>
      </div>
      <CampusProfileMenu institution={institution} slug={slug} userData={userData} uid={uid} membership={membership} setTab={setTab} onRequestExit={onRequestExit} />
    </header>
  );
}

// Real institution-scoped rank, computed from the same xp-ordered query used
// by CampusLeaderboardTab below - not a fabricated number. Returns null
// (renders nothing) rather than guessing if the roster hasn't loaded yet.
function useMyInstitutionRank(slug, myUid) {
  const [rank, setRank] = useState(null);
  // Live onSnapshot on the query itself, not a one-time getDocs - the Score
  // stat right next to this in OverviewTab/ProfileTab already updates
  // instantly (its own onSnapshot on users/{uid}), so Campus Rank staying
  // frozen until a full reload was a jarring inconsistency inside the same
  // small stat row, not just a minor staleness gap.
  useEffect(() => {
    if (!slug || !myUid) return;
    const unsub = onSnapshot(
      query(collection(db, "users"), where("institutionId", "==", slug), orderBy("score", "desc"), limit(200)),
      snap => {
        const idx = snap.docs.findIndex(d => d.id === myUid);
        setRank(idx === -1 ? null : idx + 1);
      },
      () => setRank(null),
    );
    return unsub;
  }, [slug, myUid]);
  return rank;
}

function OverviewTab({ slug, userData, totalCoins, membership, isInstAdmin, onOpenContest, onContinueLearning, onBrowseDsa, onBrowseCompanyVault, onBrowseLeaderboard, onAssessments, onManage, onProgramming, onCsCore, onAptitude, onBrowseContests }) {
  const rank = useMyInstitutionRank(slug, userData?.uid);
  const [contests, setContests] = useState([]);
  const [contestsLoading, setContestsLoading] = useState(true);
  const [announcements, setAnnouncements] = useState([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(true);
  const [noticeItem, setNoticeItem] = useState(undefined); // undefined = loading, null = no weekly program
  const [insights, setInsights] = useState(undefined);     // undefined = loading, null = read failed
  // DSA solved/total - same two reads DsaProgressSummary already makes
  // elsewhere in this file, just for GoalsRingsCard's "DSA Progress" ring.
  const [dsaStats, setDsaStats] = useState(undefined);      // undefined = loading, null = read failed

  useEffect(() => {
    if (!userData?.uid) { setDsaStats(null); return; }
    let cancelled = false;
    Promise.all([fetchPublishedProblems(), fetchUserCodelabProgress(userData.uid)])
      .then(([problems, progress]) => {
        if (cancelled) return;
        const total = problems.length;
        const solved = Object.keys(progress?.solvedProblems || {}).length;
        setDsaStats({ solved, total, pct: total ? (solved / total) * 100 : 0 });
      })
      .catch(() => { if (!cancelled) setDsaStats(null); });
    return () => { cancelled = true; };
  }, [userData?.uid]);

  useEffect(() => {
    const student = { uid: userData?.uid, department: membership?.department, year: membership?.year, section: membership?.section, classroomId: membership?.classroomId };
    fetchPublishedInstitutionContests(slug)
      .then(list => setContests(bucketContests(list.filter(c => contestMatchesStudent(c, student))).upcoming.slice(0, 2)))
      .catch(() => setContests([]))
      .finally(() => setContestsLoading(false));
  }, [slug, userData?.uid, membership?.department, membership?.year, membership?.section, membership?.classroomId]);

  useEffect(() => {
    fetchAnnouncements(slug)
      .then(list => setAnnouncements(list.filter(a => isAnnouncementActive(a)).slice(0, 3)))
      .catch(() => setAnnouncements([]))
      .finally(() => setAnnouncementsLoading(false));
  }, [slug]);

  useEffect(() => {
    fetchWeekItems(slug, mondayOf()).then(items => {
      const past = items.filter(it => it.date <= todayISO());
      setNoticeItem(past.length ? past[past.length - 1] : null);
    }).catch(() => setNoticeItem(null));
  }, [slug]);

  // ONE reward_grants query (plus the student's own aptitude progress doc)
  // backs four widgets at once: the Weekly Progress chart, the Recent Activity
  // feed, the week-over-week trend on the XP card, and Revision Due. Failing
  // soft to null matters here - an insights read that errors must degrade those
  // four cards individually, never blank the whole dashboard, since the KPI row
  // above them is driven entirely by userData/rank and is still perfectly good.
  useEffect(() => {
    if (!userData?.uid) return undefined;
    let cancelled = false;
    fetchDashboardInsights(userData.uid)
      .then(data => { if (!cancelled) setInsights(data); })
      .catch(e => {
        console.error("[Campus] dashboard insights failed", e);
        if (!cancelled) setInsights(null);
      });
    return () => { cancelled = true; };
  }, [userData?.uid]);

  const insightsLoading = insights === undefined;
  const streak = userData?.streak ?? 0;
  const xp = userData?.xp ?? 0;
  const coins = totalCoins ?? 0;
  const level = levelFromXp(xp);
  const roleLabel = isInstAdmin ? "Institution Admin" : (membership?.department ? `${membership.department}${membership.year ? ` - ${membership.year}` : ""}` : "Student");

  // Two-column shell matching the redesign: a wide left column (welcome,
  // stats, learning progress + goals, continue learning) and a narrow right
  // column (identity, wallet, recent activity) that runs the full height of
  // the left one. Below lg: the right column simply drops beneath the left
  // one - grid-cols-1 there makes both `lg:col-span-2` blocks further down a
  // no-op, so nothing needs a separate mobile layout.
  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible"
      className="grid lg:grid-cols-[minmax(0,1fr)_300px] gap-5 items-start">
      <div className="flex flex-col gap-5 min-w-0">
        {/* The decorative flourish here used to be a Lucide icon in a gradient
            blob, on the reasoning that Campus is a Lucide-only design system.
            That rule is about ICONS (and about never reaching for an emoji) -
            an original inline SVG scene is a different thing, and it's what
            the approved dashboard design calls for. HeroIllustration is
            authored in this repo and painted entirely in CAMPUS.* tokens, so
            unlike an image asset it re-tints itself in dark mode and still
            ships no external request (the CSP would block one anyway). */}
        <motion.div variants={slideUp}>
          <DashboardHero name={userData?.displayName} badge={isInstAdmin ? "ADMIN" : (membership?.department || "STUDENT")} />
        </motion.div>

        <motion.div variants={slideUp} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <DashboardStatPill icon={Flame} color={CAMPUS.warn} value={`${streak} Day${streak === 1 ? "" : "s"} Streak`} label="Keep it going!" />
          <DashboardStatPill icon={Zap} color={CAMPUS.teal} value={`${xp.toLocaleString()} XP`} label="Keep learning!" />
          <DashboardStatPill icon={CoinsIcon} color={CAMPUS.gold} value={`${coins.toLocaleString()} Coins`} label="Collect more!" />
          <DashboardStatPill icon={TrendingUp} color={CAMPUS.blue} value={`Level ${level}`} label="Keep growing!" />
        </motion.div>

        {/* items-start, not grid's default stretch: stretch forces the
            shorter column to match the taller one, and in dark mode
            CAMPUS.surface barely contrasts against CAMPUS.paper, so the
            padded-out card reads as a blank gap rather than an oversized
            card. */}
        <motion.div variants={slideUp} className="grid lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] gap-5 items-start">
          <WeeklyProgressCard
            series7={insights?.series7 || []}
            series30={insights?.series30 || []}
            loading={insightsLoading}
            totals={insights ? [
              { label: "Activities", value: insights.thisWeek.activities, color: CAMPUS.purple },
              { label: "XP earned", value: insights.thisWeek.xp, color: CAMPUS.teal },
              { label: "Coins", value: insights.thisWeek.coins, color: CAMPUS.gold },
              {
                label: "Aptitude accuracy",
                value: insights.aptitudeAccuracyPct == null ? "-" : `${insights.aptitudeAccuracyPct}%`,
                color: CAMPUS.good,
              },
            ] : undefined}
          />
          <GoalsRingsCard dsaPct={dsaStats?.pct} aptitudePct={insights?.aptitudeAccuracyPct}
            loading={insightsLoading || dsaStats === undefined} />
        </motion.div>

        <motion.div variants={slideUp}>
          <ContinueLearningTiles onLearning={onContinueLearning} onProgramming={onProgramming} onCsCore={onCsCore}
            onAptitude={onAptitude} onDsa={onBrowseDsa} onCompanyVault={onBrowseCompanyVault}
            onAssessments={onAssessments} onLeaderboard={onBrowseLeaderboard} />
        </motion.div>

        {isInstAdmin && (
          <motion.div variants={slideUp}>
            <CampusButton variant="secondary" icon={ShieldCheck} onClick={onManage}>Manage this Campus</CampusButton>
          </motion.div>
        )}

        {/* Everything below this line existed on the dashboard before this
            redesign and isn't part of the new reference composition, but
            still carries real, working functionality (a live contest
            countdown, weak-topic detection, institution announcements) that
            dropping outright would have thrown away for no reason beyond
            "the screenshot doesn't show it" - so it stays, further down the
            page rather than competing with the redesigned fold above. */}
        <motion.div variants={slideUp} className="grid lg:grid-cols-2 gap-5 [&>*]:h-full">
          <UpcomingCard contests={contests} loading={contestsLoading}
            onOpenContest={onOpenContest} onBrowseContests={onBrowseContests} />
          <WeakTopicsCard topics={insights?.weakTopics || []} accuracyPct={insights?.aptitudeAccuracyPct}
            loading={insightsLoading} onPractice={onAptitude} />
        </motion.div>

        <motion.div variants={slideUp}>
          <ContestCtaBanner contestCount={contests.length} onExplore={onBrowseContests} rank={rank} xp={xp} />
        </motion.div>

        {/* initial/animate declared HERE rather than inherited from the
            staggerContainer parent. noticeItem starts undefined and is filled
            by an async fetch, so this block MOUNTS AFTER the parent has
            already finished animating to "visible" - and a variant child that
            appears late never picks that state up. It stayed at slideUp's
            `hidden` (opacity 0) forever while still occupying full layout
            height, which read as ~450px of blank space. Any other
            conditionally-rendered child of a stagger container needs the
            same treatment. */}
        {noticeItem && (
          <motion.div variants={slideUp} initial="hidden" animate="visible">
            <SectionHeading icon={Megaphone} title={`Noticeboard - ${DOW_LABELS[noticeItem.dow]}'s Leaderboard`} />
            <CampusDayLeaderboard slug={slug} date={noticeItem.date} dayLabel={DOW_LABELS[noticeItem.dow]} myUid={userData?.uid} compact />
            <button onClick={onBrowseLeaderboard} className="mt-2 text-[11px] font-medium" style={{ color: CAMPUS.teal }}>
              view full leaderboard &rarr;
            </button>
          </motion.div>
        )}

        <motion.div variants={slideUp} className="grid lg:grid-cols-2 gap-5 items-start">
          {announcementsLoading ? (
            <CampusCard glass className="p-4 space-y-2"><CampusSkeleton variant="text" width="60%" /><CampusSkeleton variant="text" width="90%" /></CampusCard>
          ) : announcements.length === 0 ? (
            <CampusEmptyState glass size="sm" icon={Megaphone} color={CAMPUS.gold} title="Announcements"
              description="Institution-wide announcements from your Training & Placement Cell will appear here once available." />
          ) : (
            <CampusCard glass className="p-4">
              <p className="text-[11px] font-mono tracking-widest mb-2.5 flex items-center gap-1.5" style={{ color: CAMPUS.gold }}><Megaphone size={12} /> ANNOUNCEMENTS</p>
              <div className="space-y-2.5">
                {announcements.map(a => (
                  <div key={a.id} style={{ borderTop: `1px solid ${CAMPUS.line}` }} className="pt-2 first:border-0 first:pt-0">
                    <b className="text-[12.5px]" style={{ color: CAMPUS.ink }}>{a.title}</b>
                    <p className="text-[11.5px] mt-0.5" style={{ color: CAMPUS.inkSoft }}>{a.message}</p>
                    <p className="text-[10px] mt-1" style={{ color: CAMPUS.inkFaint }}>{a.createdAt?.toDate ? a.createdAt.toDate().toLocaleDateString() : ""}</p>
                  </div>
                ))}
              </div>
            </CampusCard>
          )}
          <CampusEmptyState glass size="sm" icon={Target} color={CAMPUS.warn} title="Placement Readiness"
            description="A readiness score based on your practice, contests, and learning progress is coming soon." />
        </motion.div>
      </div>

      {/* Right column - identity, recent activity - stays pinned alongside
          the left column on desktop (self-start, sticky) so it reads as one
          persistent panel rather than scrolling away under the much taller
          left column. Wallet balance/access deliberately doesn't appear
          anywhere in Campus - it's a devert.in/wallet-only surface. */}
      <div className="flex flex-col gap-5 min-w-0 lg:sticky lg:top-4">
        <motion.div variants={slideUp}>
          <DashboardProfileCard name={userData?.displayName} photoURL={userData?.photoURL} roleLabel={roleLabel} />
        </motion.div>
        <motion.div variants={slideUp}>
          <RecentActivityCard items={insights?.recent || []} loading={insightsLoading} onViewAll={onBrowseLeaderboard} />
        </motion.div>
        <motion.div variants={slideUp}>
          <BackgroundUploadCard userData={userData} />
        </motion.div>
      </div>
    </motion.div>
  );
}

// Lets a student swap the default hanging-bulb photo (campusPhotoBg's own
// dark/light defaults) for one of their own - stored on their own profile
// doc (users/{uid}.campusBgUrl) via the same updateProfile() ProfileTab's
// avatar upload already uses, so it re-skins every tab of the workspace
// (CampusWorkspace reads it off userData, not just this Dashboard screen),
// not only the card that exposes the control. 1920px cap (vs the avatar
// upload's 512px): this is a full-viewport backdrop, not a small thumbnail.
function BackgroundUploadCard({ userData }) {
  const { user, updateProfile } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) { setError("Please choose an image file."); return; }
    if (file.size > 8 * 1024 * 1024) { setError("Image must be under 8MB."); return; }
    setError("");
    setUploading(true);
    try {
      const resized = await resizeAvatarImage(file, 1920);
      const sRef = storageRef(storage, `campus-backgrounds/${user.uid}/background.jpg`);
      await uploadBytes(sRef, resized);
      const campusBgUrl = await getDownloadURL(sRef);
      await updateProfile({ campusBgUrl });
    } catch (err) {
      console.error(err);
      setError("Upload failed - try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleReset = async () => {
    try { await updateProfile({ campusBgUrl: "" }); } catch (err) { console.error(err); }
  };

  return (
    <CampusCard className="p-4">
      <p className="text-[10px] font-mono tracking-widest mb-2" style={{ color: CAMPUS.inkFaint }}>DASHBOARD BACKGROUND</p>
      <p className="text-[11.5px] leading-relaxed mb-3" style={{ color: CAMPUS.inkSoft }}>
        Use your own photo as the backdrop across Campus instead of the default.
      </p>
      <div className="flex items-center gap-2">
        <label className={`campus-btn inline-flex items-center justify-center gap-1.5 text-[12px] font-semibold px-3 py-2 rounded-lg flex-1 ${uploading ? "" : "cursor-pointer"}`}
          style={{ background: CAMPUS.gradientPrimary, color: "#fff" }}>
          {uploading ? <Loader2 size={13} className="animate-spin" /> : <Camera size={13} />}
          {uploading ? "Uploading..." : "Upload photo"}
          <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={handleFile} />
        </label>
        {userData?.campusBgUrl && (
          <button onClick={handleReset} title="Reset to default background"
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.inkSoft }}>
            <XCircle size={15} />
          </button>
        )}
      </div>
      {error && <p className="text-[11px] mt-2" style={{ color: CAMPUS.bad }}>{error}</p>}
    </CampusCard>
  );
}

// Downscales to maxDim and re-encodes as JPEG via canvas - this also strips
// EXIF (orientation/GPS/etc) as a side effect, since canvas drawing never
// copies source metadata. Same technique as app/profile/page.jsx's avatar
// upload, kept local here rather than shared - it's a single self-contained
// helper, not a growing API.
const resizeAvatarImage = (file, maxDim = 512) => new Promise((resolve, reject) => {
  const img = new Image();
  const url = URL.createObjectURL(file);
  img.onload = () => {
    URL.revokeObjectURL(url);
    const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("canvas encode failed")), "image/jpeg", 0.9);
  };
  img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("image load failed")); };
  img.src = url;
});


// Real, institution-scoped xp leaderboard - mirrors app/ranks/page.jsx's
// query pattern with one added `where`, using the composite index already
// provisioned in firestore.indexes.json ([institutionId, xp desc]).
const LEADERBOARD_SCOPE_LABELS = { section: "My Section", department: "My Department", campus: "Campus" };

// Class -> Department -> Campus scoping, on top of the pre-existing
// campus-wide-only leaderboard. Which scopes actually show up is the
// intersection of three things: the institution-wide master switch and
// per-scope toggle (Manage -> Leaderboards, lib/institutions.js's
// fetchLeaderboardSettings), THIS student's own classroom's visibility map
// (Manage -> Classrooms -> a classroom's Leaderboard Visibility, defaults
// all-true), and simply having enough academic data to scope by (no
// department/year/section on file at all means only Campus can ever apply -
// there's nothing to scope Section/Department to). The existing day-specific
// Daily Learning leaderboard (filterChips/CampusDayLeaderboard below) stays
// campus-wide only, exactly as before - it was never asked to gain
// class/department scoping, unlike the overall ranking metric.
function CampusLeaderboardTab({ slug, myUid, myClassroom }) {
  const { userData } = useAuth();
  const [settings, setSettings] = useState(null);
  const classroom = myClassroom;
  const [scope, setScope] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [weekItems, setWeekItems] = useState([]);
  const [filter, setFilter] = useState("metric"); // "metric" or an item's date - campus scope only

  useEffect(() => {
    fetchLeaderboardSettings(slug)
      .then(setSettings)
      .catch(() => setSettings({ enabled: true, sectionEnabled: true, departmentEnabled: true, campusEnabled: true, rankingMetric: "score" }));
  }, [slug]);

  const availableScopes = useMemo(() => {
    if (!settings || settings.enabled === false) return [];
    const visibility = classroom?.leaderboardVisibility || {};
    const out = [];
    if (settings.sectionEnabled !== false && visibility.section !== false && userData?.department && userData?.year && userData?.section) out.push("section");
    if (settings.departmentEnabled !== false && visibility.department !== false && userData?.department && userData?.year) out.push("department");
    if (settings.campusEnabled !== false && visibility.campus !== false) out.push("campus");
    return out;
  }, [settings, classroom, userData?.department, userData?.year, userData?.section]);

  useEffect(() => {
    if (availableScopes.length === 0) { setScope(null); return; }
    if (!scope || !availableScopes.includes(scope)) setScope(availableScopes[0]);
  }, [availableScopes]);

  useEffect(() => {
    fetchWeekItems(slug, mondayOf()).then(setWeekItems).catch(() => setWeekItems([]));
  }, [slug]);

  const metric = settings?.rankingMetric || "score";
  // "Score", not "XP" - LEADERBOARD_METRICS is score-only now, so falling
  // back to a literal "XP" here could show that label while actually
  // sorting/rendering the score field, if metric were ever anything else.
  const metricLabel = LEADERBOARD_METRICS.find(m => m.key === metric)?.label || "Score";

  useEffect(() => {
    if (!scope) return;
    setLoading(true);
    const col = collection(db, "users");
    const filters = [where("institutionId", "==", slug)];
    if (scope === "section") filters.push(where("department", "==", userData.department), where("year", "==", userData.year), where("section", "==", userData.section));
    if (scope === "department") filters.push(where("department", "==", userData.department), where("year", "==", userData.year));
    Promise.all([
      getDocs(query(col, ...filters, orderBy(metric, "desc"), limit(50))),
      // department/campus merge students from MANY classrooms - a classroom
      // that opted out of THIS scope's visibility (Manage > Leaderboards)
      // must have its own students excluded from every OTHER classroom's
      // view of that scope, not just hidden from its own students' tab list
      // (availableScopes above only gates the viewer's OWN classroom).
      // section never needs this: it's already exactly one classroom's own
      // roster, so there's no other classroom's data to leak in the first
      // place.
      scope !== "section" ? fetchClassrooms(slug) : Promise.resolve([]),
    ])
      .then(([snap, classrooms]) => {
        const visibilityByClassroomId = new Map(classrooms.map(c => [c.id, c.leaderboardVisibility || {}]));
        const rows = snap.docs
          .map(d => ({ uid: d.id, ...d.data() }))
          .filter(r => !r.classroomId || visibilityByClassroomId.get(r.classroomId)?.[scope] !== false)
          .map((r, i) => ({ ...r, rank: i + 1 }));
        setRows(rows);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [scope, slug, metric, userData?.department, userData?.year, userData?.section]);

  const activeItem = weekItems.find(it => it.date === filter);

  const filterChips = (
    <div className="flex items-center gap-1.5 flex-wrap mb-4">
      <button onClick={() => setFilter("metric")} className="text-[11px] font-mono font-semibold px-3 py-1.5 rounded-lg transition-colors"
        style={{
          color: filter === "metric" ? CAMPUS.teal : CAMPUS.inkSoft,
          background: filter === "metric" ? CAMPUS.tealTint : "transparent",
          border: `1px solid ${filter === "metric" ? CAMPUS.teal : CAMPUS.line}`,
        }}>
        Overall {metricLabel}
      </button>
      {weekItems.filter(it => it.date <= todayISO()).map(it => (
        <button key={it.date} onClick={() => setFilter(it.date)} className="text-[11px] font-mono font-semibold px-3 py-1.5 rounded-lg transition-colors"
          style={{
            color: filter === it.date ? CAMPUS.teal : CAMPUS.inkSoft,
            background: filter === it.date ? CAMPUS.tealTint : "transparent",
            border: `1px solid ${filter === it.date ? CAMPUS.teal : CAMPUS.line}`,
          }}>
          {DOW_LABELS[it.dow]}{it.type === "test" ? " (test)" : ""}
        </button>
      ))}
    </div>
  );

  const scopeTabs = availableScopes.length > 1 && (
    <div className="flex items-center gap-1.5 flex-wrap mb-4">
      {availableScopes.map(s => (
        <button key={s} onClick={() => setScope(s)} className="text-[12px] font-semibold px-3.5 py-1.5 rounded-lg transition-colors"
          style={{ color: scope === s ? "#fff" : CAMPUS.inkSoft, background: scope === s ? CAMPUS.teal : "transparent", border: `1px solid ${scope === s ? CAMPUS.teal : CAMPUS.line}` }}>
          {LEADERBOARD_SCOPE_LABELS[s]}
        </button>
      ))}
    </div>
  );

  if (settings && availableScopes.length === 0) {
    return <CampusEmptyState icon={Medal} title="Leaderboards are disabled" description="Your campus admin has turned off leaderboards for now." />;
  }

  if (scope === "campus" && filter !== "metric" && activeItem) {
    return (
      <div>
        {scopeTabs}
        {filterChips}
        <CampusDayLeaderboard slug={slug} date={activeItem.date} dayLabel={DOW_LABELS[activeItem.dow]} myUid={myUid} />
      </div>
    );
  }

  if (!settings || !scope || loading) {
    return (
      <CampusCard className="p-5 space-y-4">
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} className="flex items-center gap-3">
            <CampusSkeleton variant="circle" width={26} />
            <CampusSkeleton variant="text" width={`${60 - i * 8}%`} />
          </div>
        ))}
      </CampusCard>
    );
  }

  const columns = [
    { key: "rank", label: "#", render: r => (
      r.rank <= 3
        ? <span className="flex items-center gap-1 font-mono font-bold" style={{ color: CAMPUS.gold }}><Medal size={12} /> {r.rank}</span>
        : <span className="font-mono" style={{ color: CAMPUS.inkFaint }}>{r.rank}</span>
    ) },
    { key: "displayName", label: "Participant", render: r => (
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0" style={{ background: CAMPUS.tealTint, color: CAMPUS.teal }}>
          {(r.campusFullName || r.displayName || r.handle || "?").slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0">
          <span className="block truncate font-medium" style={{ color: r.uid === myUid ? CAMPUS.teal : CAMPUS.ink }}>
            {r.campusFullName || r.displayName || r.handle || "dev"}{r.uid === myUid && " (you)"}
          </span>
          {r.rollNumber && <span className="block truncate text-[10px] font-mono" style={{ color: CAMPUS.inkFaint }}>{r.rollNumber}</span>}
        </div>
      </div>
    ) },
    { key: metric, label: metricLabel, sortable: true, render: r => <span className="font-mono font-semibold" style={{ color: CAMPUS.teal }}>{(r[metric] || 0).toLocaleString()}</span> },
  ];

  return (
    <div>
      {scopeTabs}
      {scope === "campus" && weekItems.length > 0 && filterChips}
      <CampusCard className="overflow-hidden">
        <CampusTable columns={columns} rows={rows} rowKey="uid"
          rowStyle={r => ({ background: r.uid === myUid ? CAMPUS.tealTint : "transparent" })}
          emptyState={<CampusEmptyState icon={Medal} title="No ranked students yet" description={`Once ${scope === "campus" ? "students" : scope === "section" ? "your section" : "your department"} start earning ${metricLabel.toLowerCase()}, they'll show up here.`} />} />
      </CampusCard>
    </div>
  );
}

// Institution-scoped contests are real contests/{id} docs (see lib/contests.js's
// fetchInstitutionContests + firestore.rules). CampusContestFlow (below) then
// handles list -> details -> attempt -> results entirely natively, reusing
// registerForContest/submitContestAnswers/gradeSubmission/persistGrading etc.
// verbatim - see components/campus/campus-contests.jsx.
// Contests didn't have any real sub-navigation before - "upcoming/live/past"
// only existed as a computed per-card badge (contestPhase()). This adds a
// genuine phase filter, portaled into the sidebar like every other module -
// a client-side filter over bucketContests' own grouping (already used
// elsewhere for the exact same phases), not a new data source.
const CONTEST_PHASE_FILTERS = [
  { key: "all", label: "All Contests" },
  { key: "live", label: "Live" },
  { key: "upcoming", label: "Upcoming" },
  { key: "past", label: "Past" },
];

function ContestsSidebarList({ counts, active, onSelect }) {
  return (
    <>
      <div className="px-1 pb-2 mb-1 text-[10px] font-mono tracking-widest" style={{ color: CAMPUS.inkFaint }}>CONTESTS</div>
      {CONTEST_PHASE_FILTERS.map(f => (
        <button key={f.key} onClick={() => onSelect(f.key)}
          className="campus-btn flex items-center justify-between px-3 py-2 rounded-lg text-left transition-all duration-150"
          style={{
            background: active === f.key ? CAMPUS.gradientPrimary : "transparent",
            color: active === f.key ? "#fff" : CAMPUS.inkSoft,
            boxShadow: active === f.key ? CAMPUS.shadow : "none",
          }}>
          <span className="text-[13px] font-medium">{f.label}</span>
          <span className="text-[10.5px] font-mono flex-shrink-0" style={{ color: active === f.key ? "rgba(255,255,255,0.8)" : CAMPUS.inkFaint }}>
            {counts[f.key]}
          </span>
        </button>
      ))}
    </>
  );
}

function CampusContestsTabContent({ institutionId, screen, setScreen, sidebarSlot, phaseFilter, setPhaseFilter, student, bypassScope, canManage }) {
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = () => {
    setLoading(true); setError(false);
    fetchPublishedInstitutionContests(institutionId)
      .then(setContests)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };
  useEffect(load, [institutionId]);

  // Staff/admins keep seeing every contest (they manage all of them); a
  // student only ever sees the paper(s) targetScope actually admits them to -
  // fetchPublishedInstitutionContests has no scope awareness, it just returns
  // every published contest for the institution.
  const audienceContests = useMemo(
    () => bypassScope ? contests : contests.filter(c => contestMatchesStudent(c, student)),
    [contests, bypassScope, student]
  );
  const bucketed = useMemo(() => bucketContests(audienceContests), [audienceContests]);
  const counts = { all: audienceContests.length, live: bucketed.live.length, upcoming: bucketed.upcoming.length, past: bucketed.past.length };
  const visibleContests = phaseFilter === "all" ? audienceContests : bucketed[phaseFilter] || [];

  return (
    <>
      {sidebarSlot && createPortal(
        <ContestsSidebarList counts={counts} active={phaseFilter} onSelect={setPhaseFilter} />,
        sidebarSlot
      )}
      <CampusContestFlow contests={visibleContests} loading={loading} error={error} onRetry={load} screen={screen} setScreen={setScreen}
        institutionId={institutionId} canManage={canManage} />
    </>
  );
}

// Invite-only campuses show this instead of the full JoinForm - just two
// fields (Full Name + Roll Number), a mandatory warning/review step before
// submission, and no self-edit afterward (Roll Number Lock - enforced by
// firestore.rules' students/{uid} update rule, which is admin-only). Still
// submits via requestToJoin() as a "pending" roster doc, same as public
// campuses - the institution's admin reviews and approves it exactly the
// same way; only the client-side form and the lock/warning are different.
function CampusIdentityForm({ slug, institution, user, onSubmitted }) {
  const [step, setStep] = useState("form"); // "form" | "review"
  const [name, setName] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [department, setDepartment] = useState("");
  const [year, setYear] = useState("");
  const [section, setSection] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const canReview = name.trim() && rollNumber.trim() && department && year && section;

  const handleConfirm = async () => {
    setError(""); setSubmitting(true);
    try {
      const payload = { name: name.trim(), rollNumber: rollNumber.trim(), department, year, section };
      await requestToJoin(slug, user, payload);
      onSubmitted(payload);
    } catch (e) {
      setError(e.message || "Failed to submit.");
    } finally {
      setSubmitting(false);
    }
  };

  if (step === "review") {
    return (
      <CampusCard className="p-7 w-full max-w-sm">
        <h3 className="text-[16px] font-semibold mb-4" style={{ color: CAMPUS.ink }}>Confirm your Campus Identity</h3>
        <div className="rounded-lg p-3.5 mb-5" style={{ background: CAMPUS.warnTint, border: `1px solid ${tint(CAMPUS.warn, 25)}` }}>
          <p className="flex items-center gap-1.5 text-[12px] font-semibold mb-1.5" style={{ color: CAMPUS.warn }}>
            <AlertTriangle size={13} /> Campus Identity
          </p>
          <p className="text-[11.5px] leading-relaxed" style={{ color: CAMPUS.inkSoft }}>
            Your Full Name, Roll Number, Department, Year, and Section become your official identity for
            <b> {institution.name}</b> - they&apos;re also what places you in the right classroom. These are used
            for leaderboards, contest rankings, certificates, progress tracking, analytics, and campus reports.
            <b> After submission you cannot modify these details yourself</b> - only your Training &amp;
            Placement Cell can. Please verify everything carefully before continuing.
          </p>
        </div>
        <div className="space-y-2.5 mb-6">
          <div className="flex items-center justify-between text-[12.5px] pb-2.5" style={{ borderBottom: `1px solid ${CAMPUS.line}` }}>
            <span style={{ color: CAMPUS.inkFaint }}>Full Name</span>
            <b style={{ color: CAMPUS.ink }}>{name}</b>
          </div>
          <div className="flex items-center justify-between text-[12.5px] pb-2.5" style={{ borderBottom: `1px solid ${CAMPUS.line}` }}>
            <span style={{ color: CAMPUS.inkFaint }}>Roll Number</span>
            <b className="font-mono" style={{ color: CAMPUS.ink }}>{rollNumber}</b>
          </div>
          <div className="flex items-center justify-between text-[12.5px] pb-2.5" style={{ borderBottom: `1px solid ${CAMPUS.line}` }}>
            <span style={{ color: CAMPUS.inkFaint }}>Classroom</span>
            <b style={{ color: CAMPUS.ink }}>{year} · {department} · Sec {section}</b>
          </div>
        </div>
        {error && <p className="text-[11.5px] mb-3" style={{ color: CAMPUS.bad }}>{error}</p>}
        <button onClick={handleConfirm} disabled={submitting}
          className="w-full text-[13px] font-semibold py-2.5 rounded-lg disabled:opacity-50"
          style={{ background: CAMPUS.chromeBg, color: CAMPUS.chromeFg }}>
          {submitting ? "Joining..." : "Confirm & Join Campus"}
        </button>
        <button onClick={() => setStep("form")} disabled={submitting}
          className="w-full mt-2.5 text-[11.5px] disabled:opacity-50" style={{ color: CAMPUS.inkFaint }}>
          ← back to edit
        </button>
      </CampusCard>
    );
  }

  return (
    <CampusCard className="p-7 w-full max-w-sm">
      <h3 className="text-[16px] font-semibold mb-1.5" style={{ color: CAMPUS.ink }}>Campus Identity Verification</h3>
      <p className="text-[12.5px] mb-5" style={{ color: CAMPUS.inkSoft }}>
        {institution.name} is invite-only. Confirm your identity below - your Training &amp; Placement Cell
        reviews and approves access.
      </p>
      <div className="space-y-3">
        <Field label="Full name" value={name} onChange={setName} />
        <Field label="Roll number" value={rollNumber} onChange={setRollNumber} placeholder="21A91A0512" />
        <LabeledDropdown label="Department" value={department} options={DEPARTMENTS} onChange={setDepartment} />
        <div className="grid grid-cols-2 gap-3">
          <LabeledDropdown label="Year" value={year} options={YEARS} onChange={setYear} />
          <SectionField value={section} onChange={setSection} />
        </div>
      </div>
      <button onClick={() => setStep("review")} disabled={!canReview}
        className="w-full mt-5 text-[13px] font-semibold py-2.5 rounded-lg disabled:opacity-50"
        style={{ background: CAMPUS.chromeBg, color: CAMPUS.chromeFg }}>
        Review
      </button>
    </CampusCard>
  );
}

function JoinForm({ slug, institution, user, userData, onSubmitted }) {
  const [form, setForm] = useState({
    name: userData?.displayName || "", rollNumber: "", department: "", year: "", section: "", phone: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!form.name.trim() || !form.rollNumber.trim() || !form.department || !form.year || !form.section) {
      setError("Name, roll number, department, year, and section are all required.");
      return;
    }
    setError(""); setSubmitting(true);
    try {
      await requestToJoin(slug, user, form);
      onSubmitted(form);
    } catch (e) {
      setError(e.message || "Failed to submit request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <CampusCard className="p-7 w-full max-w-sm">
      <h3 className="text-[16px] font-semibold mb-1.5" style={{ color: CAMPUS.ink }}>Join {institution.name}</h3>
      <p className="text-[12.5px] mb-5" style={{ color: CAMPUS.inkSoft }}>
        Your Training &amp; Placement Cell reviews requests before granting access. Department/Year/Section
        also place you in the right classroom automatically once approved.
      </p>
      <div className="space-y-3">
        <Field label="Full name" value={form.name} onChange={v => setForm(p => ({ ...p, name: v }))} />
        <Field label="Roll number" value={form.rollNumber} onChange={v => setForm(p => ({ ...p, rollNumber: v }))} placeholder="21A91A0512" />
        <LabeledDropdown label="Department" value={form.department} options={DEPARTMENTS} onChange={v => setForm(p => ({ ...p, department: v }))} />
        <div className="grid grid-cols-2 gap-3">
          <LabeledDropdown label="Year" value={form.year} options={YEARS} onChange={v => setForm(p => ({ ...p, year: v }))} />
          <SectionField value={form.section} onChange={v => setForm(p => ({ ...p, section: v }))} />
        </div>
      </div>
      {error && <p className="text-[11.5px] mt-3" style={{ color: CAMPUS.bad }}>{error}</p>}
      <button onClick={submit} disabled={submitting}
        className="w-full mt-5 text-[13px] font-semibold py-2.5 rounded-lg disabled:opacity-50"
        style={{ background: CAMPUS.chromeBg, color: CAMPUS.chromeFg }}>
        {submitting ? "Submitting..." : "Request access"}
      </button>
    </CampusCard>
  );
}

function Field({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="block text-[10.5px] font-mono tracking-wide mb-1" style={{ color: CAMPUS.inkFaint }}>{label.toUpperCase()}</label>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full text-[13px] px-3 py-2 rounded-lg outline-none"
        style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.ink }} />
    </div>
  );
}

// Department/Year - canonical dropdowns (DEPARTMENTS/YEARS, lib/institutions.js),
// not free text, so every submission lands cleanly in one classroom instead of
// fragmenting across "CSE"/"cse"/"Cse" typos - firestore.rules enforces the
// same two lists server-side on the students/{uid} create rule.
function LabeledDropdown({ label, value, options, onChange }) {
  return (
    <div>
      <label className="block text-[10.5px] font-mono tracking-wide mb-1" style={{ color: CAMPUS.inkFaint }}>{label.toUpperCase()}</label>
      <Dropdown value={value} options={options} onChange={onChange} className="w-full"
        buttonClassName="text-[13px] px-3 py-2 rounded-lg bg-[var(--campus-paper)] border border-[var(--campus-line)] text-[var(--campus-ink)]" />
    </div>
  );
}

// Exactly one uppercase letter - matches firestore.rules' section.matches('^[A-Z]$')
// on the same create rule. Forces uppercase as the student types rather than
// rejecting lowercase after the fact.
function SectionField({ value, onChange }) {
  return (
    <div>
      <label className="block text-[10.5px] font-mono tracking-wide mb-1" style={{ color: CAMPUS.inkFaint }}>SECTION</label>
      <input value={value} maxLength={1} placeholder="A"
        onChange={e => onChange(e.target.value.replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 1))}
        className="w-full text-[13px] px-3 py-2 rounded-lg outline-none"
        style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.ink }} />
    </div>
  );
}

// A pending join request can sit for days - leaving the student with nothing
// to do but this one card was the dead end the nav audit flagged. The "while
// you wait" links point at the global (non-institution-scoped) sections -
// see GLOBAL_SECTIONS above - so a not-yet-approved student can still
// practice DSA, browse Company Vault, and take public contests in the
// meantime, not just stare at a waiting screen.
function PendingCard({ institution, membership }) {
  const exploreLinks = [
    { label: "Daily Learning", href: "/learning" },
    { label: "DSA Practice", href: "/practice" },
    { label: "Company Vault", href: "/practice?mode=companyPrep" },
    { label: "Contests", href: "/contests" },
  ];
  return (
    <CampusCard className="p-7 w-full max-w-sm text-center">
      <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: CAMPUS.warnTint, color: CAMPUS.warn }}>
        <Clock size={20} />
      </div>
      <h3 className="text-[16px] font-semibold mb-2" style={{ color: CAMPUS.ink }}>Request sent to {institution.name}</h3>
      <p className="text-[13px] mb-4" style={{ color: CAMPUS.inkSoft }}>
        You&apos;ll get a notification the moment you&apos;re approved.
      </p>
      <div className="flex justify-between text-[11.5px] py-2 mb-5" style={{ borderTop: `1px solid ${CAMPUS.line}`, color: CAMPUS.inkFaint }}>
        <span>Roll number</span><span className="font-mono" style={{ color: CAMPUS.ink }}>{membership.rollNumber}</span>
      </div>
      <p className="text-[9px] font-mono tracking-widest mb-2.5 text-left" style={{ color: CAMPUS.inkFaint }}>WHILE YOU WAIT</p>
      <div className="grid grid-cols-2 gap-2">
        {exploreLinks.map(l => (
          <Link key={l.label} href={l.href}
            className="text-[12px] font-medium px-3 py-2 rounded-lg text-center transition-colors hover:opacity-80"
            style={{ background: CAMPUS.surface, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.inkSoft }}>
            {l.label}
          </Link>
        ))}
      </div>
    </CampusCard>
  );
}
