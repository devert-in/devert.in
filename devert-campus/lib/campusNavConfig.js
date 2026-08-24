import {
  LayoutDashboard, IdCard, BookOpen, CodeXml, BrainCircuit, Calculator,
  Code2, Briefcase, ClipboardCheck, Trophy, BarChart3, ShieldCheck, GraduationCap, Layers, Route,
} from "lucide-react";

// The single source of truth for every Campus workspace destination -
// CampusNavRail (desktop sidebar), CampusBottomNav (mobile bottom bar) and
// CampusMobileDrawer (mobile hamburger menu) all derive their filtered/
// grouped view from THIS array instead of each keeping their own hand-
// maintained list. That's the whole point: "aptitude" was previously
// missing from NAV_GROUPS (a separate array nobody remembered to update
// when Aptitude was added to TABS) - with one array, a new tab can no
// longer be silently left out of one surface but not another, because
// there is only one place to add it.
//
// Field meanings:
// - parentGroup: which section this item belongs to, for both the
//   desktop rail's grouped headers and the drawer's collapsible groups.
//   See GROUP_ORDER/NAV_GROUP_LABELS below for display order/labels.
// - moduleKey: the lib/institutions.js MODULES key that gates this tab
//   per-classroom (isModuleEnabledForClassroom) - null if never gated.
// - adminOnly: gated on isInstAdmin instead of (or in addition to)
//   moduleKey. No item uses it any more - "manage" was its only user and
//   now uses staffRoles instead (see that entry), since isTabAllowed checks
//   adminOnly FIRST and returns early, which would have made an
//   adminOnly + staffRoles combination silently ignore the staffRoles half.
//   Kept as a supported field for a future genuinely admin-only destination.
// - staffRoles: which Principal/HOD/Faculty roleKeys may reach this item,
//   in addition to isInstAdmin (who always may). An item with staffRoles is
//   hidden from ordinary students outright.
// - urlSegment: the clean static URL segment this tab's base URL uses
//   (e.g. "dsa" -> /campus/{slug}/dsa), or null if this tab has no
//   dedicated institution-scoped segment and instead falls back to a plain
//   ?tab= query param within the workspace (profile, fundamentals,
//   programming, csCore, aptitude, gate, manage, roadmaps - this comment
//   was stale claiming "just profile" long before roadmaps existed).
//   roadmaps is null for a different reason than the others: it's a
//   GLOBAL, non-institution-scoped catalog with its own real static SEO
//   home at /campus/roadmaps (see app/campus/roadmaps/**) - giving it an
//   urlSegment here would mean a second, per-institution-titled copy of
//   identical content at /campus/{slug}/roadmaps, which is exactly the
//   "not MRCET's roadmaps, not any college's" outcome this module must
//   avoid.
// - ownUrl: true if a CHILD component already owns a deeper URL-sync
//   effect for this tab (its own history.replaceState with further
//   sub-state, e.g. Programming's language/topic or Manage's own
//   /manage/{tab}/{subView}) - the top-level URL-sync effect in
//   CampusWorkspace must skip these entirely, or it would clobber the
//   more specific URL the child just set (child effects run before
//   parent effects). "aptitude" is included here even though it wasn't
//   in the old hardcoded skip-list - campus-aptitude.jsx already runs its
//   own replaceState effect, so leaving it out was a latent bug (the
//   parent effect could race it and stomp the topic-level URL back down
//   to a bare ?tab=aptitude) that this fixes as a byproduct.
// - order: gapped (10, 20, 30...) so a future insertion between two
//   existing items never requires renumbering its siblings.
// - mobileVisibility: "bottomNav" (shown in both the bottom bar and the
//   drawer) or "drawerOnly" (drawer only) - the bottom nav's set is
//   always a strict subset of the drawer's by construction, not by
//   remembering to keep two lists in sync.
// - desktopVisibility: whether the desktop TOP NAVBAR (CampusTopNavbar)
//   shows this item. Most items are true; "dashboard" and "learning" are
//   false because sidebarGlobal already places them in the desktop
//   CampusContextSidebar instead - a destination lives in exactly one of
//   the two desktop surfaces, never both.
// - sidebarGlobal: true for items pinned at the top of the desktop
//   CampusContextSidebar (above the active module's own contextual
//   sub-nav) rather than in the horizontal top navbar - see
//   CampusContextSidebar in campus-app.jsx. Independent of mobile, which
//   keeps its own bottomNav/drawerOnly placement regardless of this flag.
export const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, parentGroup: "root", moduleKey: null, adminOnly: false, urlSegment: "", ownUrl: false, order: 10, mobileVisibility: "bottomNav", desktopVisibility: false, sidebarGlobal: true },
  { key: "profile", label: "Profile", icon: IdCard, parentGroup: "root", moduleKey: null, adminOnly: false, urlSegment: null, ownUrl: false, order: 20, mobileVisibility: "bottomNav", desktopVisibility: true },
  // The "where do I even start" entry point for the whole Learn group, so it
  // sits FIRST in it (order 25, in the gap the gapped scheme exists for - no
  // sibling renumbered). moduleKey: null - every DeVert Campus user sees the
  // identical, global set of roadmaps, so there is no per-classroom toggle to
  // gate it on (same reasoning as "leaderboard" above). urlSegment: null, NOT
  // "roadmaps" - the catalog's indexable home is the dedicated, GLOBAL
  // /campus/roadmaps route (app/campus/roadmaps/**), not a per-institution
  // URL; a /campus/{slug}/roadmaps segment here would just be N duplicate
  // copies of identical content titled after each college. Inside a
  // workspace it is therefore a ?tab= module like Programming/CS Core/GATE,
  // and ownUrl: true because it owns ?roadmap=/?topic= itself.
  { key: "roadmaps", label: "Roadmaps", icon: Route, parentGroup: "learn", moduleKey: null, adminOnly: false, urlSegment: null, ownUrl: true, order: 25, mobileVisibility: "drawerOnly", desktopVisibility: true },
  { key: "learning", label: "Daily Learning", icon: BookOpen, parentGroup: "learn", moduleKey: "dailyLearning", adminOnly: false, urlSegment: "daily-learning", ownUrl: true, order: 30, mobileVisibility: "bottomNav", desktopVisibility: false, sidebarGlobal: true },
  // Same course shell as the main site's /fundamentals route (components/se/
  // se-app.jsx) - see CampusFundamentalsTab. ownUrl: true because it owns its
  // own ?module=/?lesson= sub-state the same way Programming owns ?lang=/?topic=.
  { key: "fundamentals", label: "Fundamentals", icon: Layers, parentGroup: "learn", moduleKey: "fundamentals", adminOnly: false, urlSegment: null, ownUrl: true, order: 35, mobileVisibility: "drawerOnly", desktopVisibility: true },
  { key: "programming", label: "Programming", icon: CodeXml, parentGroup: "learn", moduleKey: "programming", adminOnly: false, urlSegment: null, ownUrl: true, order: 40, mobileVisibility: "drawerOnly", desktopVisibility: true },
  { key: "csCore", label: "CS Core", icon: BrainCircuit, parentGroup: "learn", moduleKey: "csCore", adminOnly: false, urlSegment: null, ownUrl: true, order: 50, mobileVisibility: "drawerOnly", desktopVisibility: true },
  { key: "aptitude", label: "Aptitude", icon: Calculator, parentGroup: "learn", moduleKey: "aptitude", adminOnly: false, urlSegment: null, ownUrl: true, order: 60, mobileVisibility: "drawerOnly", desktopVisibility: true },
  // GATE is one rail entry that opens into its own sixteen-section workspace
  // (components/campus/gate/gate-app.jsx), the same way Programming opens into a
  // language/topic hierarchy - see that file's header for why the module's own
  // sections are nested rather than promoted into this array. ownUrl: true
  // because CampusGateTab owns ?section=/?subject=/?topic=/?test= itself.
  // order 65 slots it between Aptitude and DSA without renumbering either -
  // exactly what the gapped numbering above exists for.
  { key: "gate", label: "GATE", icon: GraduationCap, parentGroup: "learn", moduleKey: "gate", adminOnly: false, urlSegment: null, ownUrl: true, order: 65, mobileVisibility: "drawerOnly", desktopVisibility: true },
  { key: "dsa", label: "DSA", icon: Code2, parentGroup: "learn", moduleKey: "dsa", adminOnly: false, urlSegment: "dsa", ownUrl: false, order: 70, mobileVisibility: "bottomNav", desktopVisibility: true },
  { key: "companyVault", label: "Company Vault", icon: Briefcase, parentGroup: "learn", moduleKey: "companyPrep", adminOnly: false, urlSegment: "company-vault", ownUrl: false, order: 80, mobileVisibility: "drawerOnly", desktopVisibility: true },
  { key: "assessments", label: "Assessments", icon: ClipboardCheck, parentGroup: "learn", moduleKey: "dailyLearning", adminOnly: false, urlSegment: "assessments", ownUrl: true, order: 90, mobileVisibility: "drawerOnly", desktopVisibility: true },
  // Contests lives in the desktop SIDEBAR, not the top navbar: desktopVisibility
  // false takes it out of CampusTopNavbar, sidebarGlobal pins it into the rail
  // alongside Dashboard/Daily Learning/Leaderboard. Mobile is untouched - it
  // stays in the bottom nav, where it was already reachable.
  { key: "contests", label: "Contests", icon: Trophy, parentGroup: "compete", moduleKey: "contests", adminOnly: false, urlSegment: "contests", ownUrl: false, order: 100, mobileVisibility: "bottomNav", desktopVisibility: false, sidebarGlobal: true },
  { key: "leaderboard", label: "Leaderboard", icon: BarChart3, parentGroup: "compete", moduleKey: null, adminOnly: false, urlSegment: "leaderboard", ownUrl: false, order: 110, mobileVisibility: "drawerOnly", desktopVisibility: false, sidebarGlobal: true },
  // HOD reaches Manage too, not just an Institution Admin - but lands on a
  // deliberately much narrower version of it: SCOPED_ROLE_MANAGE_TABS in
  // campus-manage.jsx restricts a department-scoped role to the content tabs
  // whose docs can actually carry a department scope, so none of Manage's
  // institution-wide surfaces (Departments, Manage Admins, Branding,
  // Leaderboards) are reachable from it. Principal is deliberately absent
  // (see campus-staff-overview.jsx's own note) and Faculty has its own
  // classroom dashboard instead.
  { key: "manage", label: "Manage", icon: ShieldCheck, parentGroup: "admin", moduleKey: null, adminOnly: false, staffRoles: ["hod"], urlSegment: null, ownUrl: true, order: 120, mobileVisibility: "drawerOnly", desktopVisibility: false, sidebarGlobal: true },
];

export const GROUP_ORDER = ["root", "learn", "compete", "admin"];
export const NAV_GROUP_LABELS = { root: null, learn: "Learn", compete: "Compete", admin: "Admin" };
