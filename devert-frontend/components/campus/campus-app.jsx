"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  MapPin, Search, LayoutDashboard, BookOpen, ClipboardCheck, Trophy, BarChart3,
  ShieldCheck, Clock, XCircle, Ban, LogOut, Sun, Moon, IdCard, ArrowLeft,
  Mail, Phone, GraduationCap, Building2, Hash, Flame, Rocket, Target,
  ChevronRight, Users, ArrowUpRight, Medal, Code2, Briefcase, ChevronDown,
  UserCircle2, TrendingUp, X as CloseIcon, PanelLeftClose, PanelLeftOpen,
  Activity, Megaphone, Share2, Link2, Bookmark, BookmarkCheck, Check,
  AlertTriangle, DoorOpen,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, limit, getDocs, getCountFromServer } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import {
  fetchInstitutions, fetchInstitution, fetchMyMembership, requestToJoin,
  fetchMyInstitutionAdminRole, fetchApprovedStudents, toggleFavoriteInstitution, fetchAnnouncements,
} from "@/lib/institutions";
import { fetchInstitutionContests, fetchPublishedContests, contestPhase, bucketContests } from "@/lib/contests";
import { fetchCourseTree, flattenTasks, getCurrentTask, courseProgressPct } from "@/lib/learning";
import { CODELAB_CATEGORIES, CODELAB_DIFFICULTIES, fetchUserCodelabProgress, fetchPublishedProblems } from "@/lib/codelab";
import { CAMPUS } from "@/lib/campus-theme";
import { slideUp, staggerContainer } from "@/lib/campus-motion";
import {
  CampusCard, CampusChip, CampusProgressBar, CampusStat, CampusGoogleButton,
  CampusSkeleton, CampusEmptyState, CampusButton, CampusTable, CampusBackButton,
} from "@/components/campus/campus-ui";
import { CampusContestFlow } from "@/components/campus/campus-contests";
import { CampusPracticeList, CampusProblemView, SidebarFilterGroup } from "@/components/campus/campus-practice";
import { CampusCompanyPrepFlow } from "@/components/campus/campus-company-prep";
import { CampusLearningSection } from "@/components/campus/campus-learning";
import { CampusDailyLearningTab, CampusDailyAssessmentsTab, CampusDayLeaderboard } from "@/components/campus/campus-daily-learning";
import { mondayOf, DOW_LABELS, todayISO, fetchWeekItems } from "@/lib/dailyLearning";
import { fetchContentVisibility } from "@/lib/contentVisibility";
import { CampusManage } from "@/components/campus/campus-manage";

const TABS = [
  { key: "dashboard",     label: "Overview",          icon: LayoutDashboard },
  { key: "profile",       label: "Profile",           icon: IdCard },
  { key: "learning",      label: "Daily Learning",    icon: BookOpen },
  { key: "dsa",           label: "DSA",               icon: Code2 },
  { key: "companyVault",  label: "Company Vault",     icon: Briefcase },
  { key: "assessments",   label: "Assessments",       icon: ClipboardCheck },
  { key: "contests",      label: "Contests",          icon: Trophy },
  { key: "leaderboard",   label: "Leaderboard",       icon: BarChart3 },
];

// Bottom-nav on mobile only fits a handful of targets before it gets
// cramped - the busiest tabs, matching what a student actually reaches for
// daily. DSA keeps the slot the combined "Practice" tab used to hold;
// Company Vault (like Profile/Assessments/Leaderboard/Manage) stays
// reachable via the Overview quick-actions grid, the top bar avatar, or the
// desktop rail instead of crowding the bottom nav further.
const MOBILE_TABS = TABS.filter(t => ["dashboard", "learning", "dsa", "contests"].includes(t.key));

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
const CampusThemeContext = createContext({ theme: "light", toggleTheme: () => {} });
function useCampusTheme() { return useContext(CampusThemeContext); }

function CampusThemeProvider({ children }) {
  const [theme, setTheme] = useState("light");
  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("campus-theme") : null;
    if (saved === "dark" || saved === "light") setTheme(saved);
  }, []);
  const toggleTheme = () => setTheme(t => {
    const next = t === "light" ? "dark" : "light";
    localStorage.setItem("campus-theme", next);
    return next;
  });
  return <CampusThemeContext.Provider value={{ theme, toggleTheme }}>{children}</CampusThemeContext.Provider>;
}

// Contests/Learning/Practice are usable before picking a college at all
// (none of the underlying data is institution-scoped), so they get their own
// real top-level paths rather than living as view-state nested under
// /campus - anything else after /campus is treated as an institution slug.
const GLOBAL_SECTIONS = ["contests", "learning", "practice"];

export function CampusApp({ initialTab }) {
  const pathname = usePathname();
  const [first, second, third] = pathname.split("/").filter(Boolean).slice(1);

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
    body = <CampusDirectory />;
  } else if (GLOBAL_SECTIONS.includes(first)) {
    body = <CampusGlobalSection key={first} section={first} />;
  } else {
    body = <CampusWorkspace key={first} slug={first} initialTab={initialTab} initialContestId={second === "contest" ? third : null} />;
  }

  return <CampusThemeProvider>{body}</CampusThemeProvider>;
}

function CampusThemeToggle({ className = "" }) {
  const { theme, toggleTheme } = useCampusTheme();
  return (
    <button onClick={toggleTheme} title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
      className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${className}`}
      style={{ background: CAMPUS.tealTint, color: CAMPUS.teal }}>
      {theme === "light" ? <Moon size={14} /> : <Sun size={14} />}
    </button>
  );
}

function CampusShell({ children }) {
  const { theme } = useCampusTheme();
  return (
    <main data-theme={theme} style={{ background: CAMPUS.paper, minHeight: "100vh", colorScheme: theme }}
      className="campus-theme relative flex items-center justify-center px-6">
      <div className="absolute top-5 right-5"><CampusThemeToggle /></div>
      {children}
    </main>
  );
}

function Centered({ children }) {
  return <p className="text-sm" style={{ color: CAMPUS.inkFaint }}>{children}</p>;
}

// A persistent left nav rail for the pre-auth global Campus sections
// (Practice/Learning/Contests), purpose-built for CampusGlobalSection (see
// below) - the authenticated Workspace's own sidebar (CampusNavRail) lists
// DSA and Company Vault as fully separate tabs, and this rail mirrors that
// same split rather than a mode toggle. Grouped nav items (not just the two
// Practice buttons) so jumping between DSA, Company Vault, Daily Learning
// and Contests doesn't require leaving the rail and re-finding your way
// back through a "Back" link each time - every item here is a real
// destination, active-highlighted by whichever section/mode you're
// actually in.
function CampusSidebarNavRail({ section, practiceMode, onGoPractice, onGoRoute }) {
  const NavItem = ({ label, active, onClick }) => (
    <button onClick={onClick}
      className="w-full text-left text-[13px] px-3 py-2 rounded-lg transition-colors"
      style={{
        background: active ? CAMPUS.tealTint : "transparent",
        color: active ? CAMPUS.teal : CAMPUS.inkSoft,
        fontWeight: active ? 600 : 500,
        borderLeft: `3px solid ${active ? CAMPUS.teal : "transparent"}`,
      }}>
      {label}
    </button>
  );
  const GroupLabel = ({ icon: Icon, children }) => (
    <div className="flex items-center gap-1.5 mb-2 px-1">
      <Icon size={12} style={{ color: CAMPUS.inkFaint }} />
      <p className="text-[9px] font-mono tracking-widest" style={{ color: CAMPUS.inkFaint }}>{children}</p>
    </div>
  );
  return (
    <nav className="space-y-6">
      <div>
        <GroupLabel icon={Code2}>PRACTICE</GroupLabel>
        <div className="space-y-1">
          <NavItem label="DSA" active={section === "practice" && practiceMode === "coding"} onClick={() => onGoPractice("coding")} />
          <NavItem label="Company Vault" active={section === "practice" && practiceMode === "companyPrep"} onClick={() => onGoPractice("companyPrep")} />
        </div>
      </div>
      <div>
        <GroupLabel icon={BookOpen}>LEARNING</GroupLabel>
        <div className="space-y-1">
          <NavItem label="Daily Learning" active={section === "learning"} onClick={() => onGoRoute("/campus/learning")} />
          <NavItem label="Contests" active={section === "contests"} onClick={() => onGoRoute("/campus/contests")} />
        </div>
      </div>
    </nav>
  );
}

// CodeLab-specific (Company Vault tracks its own solved/bookmarked counts
// per question instead, shown inline as you practice) - only ever rendered
// next to DSA. Skeleton while the two fetches settle, a sign-in prompt if
// there's no uid to key progress on at all.
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

// ---------------- Directory (/campus) ----------------

// Flat, hairline-bordered - the new landing page's own visual language
// (see CampusLandingNav/CampusProfileFlyout above), deliberately not the
// rounded CampusCard used in the workspace. Every card carries its own
// right+bottom border and the wrapping grid supplies only the top+left frame
// (className="border-t border-l" at each call site) - wrap-safe at any
// column count, unlike an index-based "is this the last card" check, which
// only produces a correct single hairline when the grid never wraps.
function InstitutionCard({ inst, studentCount, featured }) {
  return (
    <Link href={`/campus/${inst.id}`} className="block p-6" style={{ background: CAMPUS.surface, borderRight: `1px solid ${CAMPUS.line}`, borderBottom: `1px solid ${CAMPUS.line}` }}>
      {featured && (
        <span className="inline-flex text-[10px] font-bold px-2.5 py-1 mb-3" style={{ background: CAMPUS.goldTint, color: CAMPUS.gold, letterSpacing: "0.03em" }}>
          FEATURED
        </span>
      )}
      <div className="w-11 h-11 flex items-center justify-center font-bold text-[15px] mb-4"
        style={{ background: CAMPUS.teal, color: "#fff" }}>
        {inst.name?.slice(0, 2).toUpperCase() || "??"}
      </div>
      <h4 className="text-[16px] font-semibold mb-1" style={{ color: CAMPUS.ink }}>{inst.name}</h4>
      {inst.location && (
        <div className="text-xs flex items-center gap-1 mb-4" style={{ color: CAMPUS.inkFaint }}>
          <MapPin size={11} /> {inst.location}
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 pt-4" style={{ borderTop: `1px solid ${CAMPUS.line}` }}>
        <div>
          <span className="block text-[10px] font-mono uppercase tracking-wide" style={{ color: CAMPUS.inkFaint }}>Status</span>
          <span className="block font-mono text-[13px] font-bold mt-0.5" style={{ color: (inst.accessMode || "public") === "public" ? CAMPUS.good : CAMPUS.warn }}>
            {(inst.accessMode || "public") === "public" ? "OPEN" : inst.accessMode.replace("_", " ").toUpperCase()}
          </span>
        </div>
        {studentCount != null && (
          <div>
            <span className="block text-[10px] font-mono uppercase tracking-wide" style={{ color: CAMPUS.inkFaint }}>Students</span>
            <span className="block font-mono text-[13px] font-bold mt-0.5" style={{ color: CAMPUS.ink }}>{studentCount}</span>
          </div>
        )}
      </div>
    </Link>
  );
}

// Landing-page-only, so this is square/hairline directly (no shared-component
// concern like UpcomingContestRow/LearningJourneyCard below, which the
// authenticated workspace's Overview tab also renders and must keep rounded).
function TrackChip({ label, onClick }) {
  return (
    <button onClick={onClick}
      className="inline-flex items-center gap-1.5 text-[12.5px] font-medium px-3.5 py-2 transition-colors"
      style={{ background: CAMPUS.surface, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.inkSoft }}>
      {label} <ChevronRight size={12} style={{ color: CAMPUS.inkFaint }} />
    </button>
  );
}

// `sharp` opts into the landing page's square/hairline language without
// touching the rounded CampusCard rendering the authenticated workspace's
// Overview tab still uses for this exact same component.
function UpcomingContestRow({ contest, onClick, sharp }) {
  const phase = contestPhase(contest);
  const content = (
    <>
      <div className={`w-9 h-9 flex items-center justify-center flex-shrink-0 ${sharp ? "" : "rounded-lg"}`}
        style={{ background: sharp ? CAMPUS.teal : CAMPUS.purpleTint, color: sharp ? "#fff" : CAMPUS.purple }}>
        <Trophy size={15} />
      </div>
      <div className="flex-1 min-w-0">
        <b className="block text-[13.5px] truncate" style={{ color: CAMPUS.ink }}>{contest.title}</b>
        <span className="text-[11px]" style={{ color: CAMPUS.inkFaint }}>{contest.category}{contest.difficulty ? ` · ${contest.difficulty}` : ""}</span>
      </div>
      {sharp ? (
        <span className="text-[10px] font-mono font-bold px-2 py-1 flex-shrink-0" style={{ background: phase === "live" ? CAMPUS.goodTint : CAMPUS.goldTint, color: phase === "live" ? CAMPUS.good : CAMPUS.gold }}>
          {phase.toUpperCase()}
        </span>
      ) : (
        <CampusChip color={phase === "live" ? CAMPUS.good : CAMPUS.warn}>{phase.toUpperCase()}</CampusChip>
      )}
    </>
  );
  return (
    <button onClick={() => onClick(contest.id)} className="block w-full h-full text-left">
      {sharp ? (
        <div className="flex items-center gap-3 p-4 h-full" style={{ background: CAMPUS.surface, border: `1px solid ${CAMPUS.line}` }}>{content}</div>
      ) : (
        <CampusCard hover className="p-4 flex items-center gap-3 h-full">{content}</CampusCard>
      )}
    </button>
  );
}

// `sharp` opts into the landing page's square/hairline language, same reason
// as UpcomingContestRow above - this component is also rendered rounded, by
// the authenticated workspace's Overview tab.
function LearningJourneyCard({ onContinue, sharp }) {
  const { user } = useAuth();
  const [state, setState] = useState({ loading: true, course: null, progress: null });

  useEffect(() => {
    if (!user) { setState({ loading: false, course: null, progress: null }); return; }
    let cancelled = false;
    (async () => {
      try {
        const { doc, getDoc } = await import("firebase/firestore");
        const progSnap = await getDoc(doc(db, "user_learning", user.uid));
        if (!progSnap.exists()) { if (!cancelled) setState({ loading: false, course: null, progress: null }); return; }
        const progress = progSnap.data();
        const course = await fetchCourseTree(progress.enrolledCourseId);
        if (!cancelled) setState({ loading: false, course, progress });
      } catch {
        if (!cancelled) setState({ loading: false, course: null, progress: null });
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  if (!user) return null;

  if (state.loading) {
    const skeleton = <CampusSkeleton variant="rect" height={54} />;
    return sharp
      ? <div className="p-5 h-full" style={{ background: CAMPUS.surface, border: `1px solid ${CAMPUS.line}` }}>{skeleton}</div>
      : <CampusCard className="p-5 h-full">{skeleton}</CampusCard>;
  }

  if (!state.course) {
    const emptyContent = (
      <>
        <div>
          <b className="block text-[13.5px] mb-0.5" style={{ color: CAMPUS.ink }}>You haven&apos;t started a course yet</b>
          <span className="text-[12px]" style={{ color: CAMPUS.inkFaint }}>Browse Daily Learning to pick one up.</span>
        </div>
        <button onClick={onContinue} className="text-[12.5px] font-semibold flex items-center gap-1 flex-shrink-0" style={{ color: CAMPUS.teal }}>
          Browse <ArrowUpRight size={13} />
        </button>
      </>
    );
    return sharp ? (
      <div className="p-5 flex items-center justify-between gap-4 h-full" style={{ background: CAMPUS.surface, border: `1px solid ${CAMPUS.line}` }}>{emptyContent}</div>
    ) : (
      <CampusCard className="p-5 flex items-center justify-between gap-4 h-full">{emptyContent}</CampusCard>
    );
  }

  const flatTasks = flattenTasks(state.course);
  const completedTaskIds = state.progress?.completedTaskIds || [];
  const current = getCurrentTask(flatTasks, completedTaskIds);
  const pct = courseProgressPct(flatTasks, completedTaskIds);

  const progressContent = (
    <>
      <div className="flex items-center justify-between mb-2">
        <b className="text-[13.5px]" style={{ color: CAMPUS.ink }}>{state.course.title}</b>
        <span className="font-mono text-xs font-bold" style={{ color: CAMPUS.teal }}>{pct}%</span>
      </div>
      <CampusProgressBar pct={pct} color={CAMPUS.teal} />
      {current && (
        <p className="text-[12px] mt-2.5" style={{ color: CAMPUS.inkFaint }}>
          Next: {current.title}
        </p>
      )}
    </>
  );

  return (
    <button onClick={onContinue} className="block w-full h-full text-left">
      {sharp ? (
        <div className="p-5 h-full flex flex-col justify-center" style={{ background: CAMPUS.surface, border: `1px solid ${CAMPUS.line}` }}>{progressContent}</div>
      ) : (
        <CampusCard hover className="p-5 h-full flex flex-col justify-center">{progressContent}</CampusCard>
      )}
    </button>
  );
}

// Sharp-cornered, hairline-bordered landing nav + slide-in profile flyout -
// deliberately a different visual language from the rounded CampusCard
// system used everywhere else in Campus (workspace, admin). This is the
// pre-auth "front door" (see the approved design proposal); once inside a
// specific college's workspace, the existing rounded UI is untouched.
function CampusLandingNav({ onOpenFlyout }) {
  const { theme, toggleTheme } = useCampusTheme();
  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <nav className="flex items-center gap-8 px-6 sm:px-10"
      style={{ height: 72, borderBottom: `1px solid ${CAMPUS.line}`, background: CAMPUS.surface, position: "sticky", top: 0, zIndex: 30 }}>
      <div className="flex items-center gap-2.5 font-bold text-[17px] flex-shrink-0" style={{ color: CAMPUS.ink }}>
        <span className="w-[30px] h-[30px] flex items-center justify-center font-mono text-[13px] font-bold flex-shrink-0" style={{ background: CAMPUS.ink, color: "#fff" }}>D</span>
        DeVert Campus
      </div>
      <div className="hidden md:flex items-center gap-1 flex-1">
        <button onClick={() => scrollTo("featured-campuses")} className="text-[14.5px] font-medium px-3.5 py-2 transition-colors" style={{ color: CAMPUS.ink }}>Campuses</button>
        <Link href="/campus/learning" className="text-[14.5px] font-medium px-3.5 py-2 transition-colors" style={{ color: CAMPUS.ink }}>Learning</Link>
        <Link href="/campus/contests" className="text-[14.5px] font-medium px-3.5 py-2 transition-colors" style={{ color: CAMPUS.ink }}>Contests</Link>
        <Link href="/campus/practice" className="text-[14.5px] font-medium px-3.5 py-2 transition-colors" style={{ color: CAMPUS.ink }}>Practice</Link>
        <button onClick={() => scrollTo("campus-features")} className="text-[14.5px] font-medium px-3.5 py-2 transition-colors" style={{ color: CAMPUS.ink }}>Features</button>
      </div>
      <div className="flex items-center gap-4 sm:gap-5 flex-shrink-0 ml-auto">
        <button onClick={toggleTheme} title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"} style={{ color: CAMPUS.ink }}>
          {theme === "light" ? <Moon size={19} /> : <Sun size={19} />}
        </button>
        <Link href="/" title="Return to DeVert" className="hidden sm:block" style={{ color: CAMPUS.ink }}><ArrowLeft size={19} /></Link>
        <button onClick={onOpenFlyout} title="Account"
          className="w-[34px] h-[34px] rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.inkSoft }}>
          <UserCircle2 size={19} />
        </button>
      </div>
    </nav>
  );
}

function CampusProfileFlyout({ open, onClose }) {
  const { user, userData, logout } = useAuth();
  const router = useRouter();
  if (!open) return null;

  const tiles = user
    ? [
        { icon: LayoutDashboard, label: "My dashboard", href: "/campus" },
        { icon: BookOpen,        label: "My learning",  href: "/campus/learning" },
        { icon: Trophy,          label: "My contests",  href: "/campus/contests" },
        { icon: Code2,           label: "My practice",  href: "/campus/practice" },
      ]
    : [
        { icon: LayoutDashboard, label: "Campus dashboard",    href: "/campus" },
        { icon: ClipboardCheck,  label: "Weekly assessments",  href: "/campus/learning" },
        { icon: Trophy,          label: "Coding contests",     href: "/campus/contests" },
        { icon: TrendingUp,      label: "Placement readiness", href: "/campus/practice" },
      ];

  const benefits = [
    { icon: BookOpen,       label: "Daily Learning" },
    { icon: ClipboardCheck, label: "Weekly Assessments" },
    { icon: Trophy,         label: "Coding Contests" },
    { icon: BarChart3,      label: "Leaderboards" },
    { icon: Users,          label: "Bulk roster onboarding" },
  ];

  return (
    <>
      <div className="fixed inset-0 z-40" style={{ background: "rgba(0,0,0,0.35)" }} onClick={onClose} />
      <aside className="fixed top-0 right-0 h-full z-50 overflow-y-auto"
        style={{ width: 420, maxWidth: "90vw", background: CAMPUS.surface, borderLeft: `1px solid ${CAMPUS.line}`, padding: "30px 34px" }}>
        <div className="flex items-start justify-between gap-3 mb-7">
          <p className="text-[19px] font-semibold leading-tight" style={{ color: CAMPUS.ink }}>
            {user ? `Welcome back, ${(userData?.displayName || "there").split(" ")[0]}` : "Get more with a DeVert Campus account"}
          </p>
          <button onClick={onClose} className="flex-shrink-0" style={{ color: CAMPUS.inkFaint }}><CloseIcon size={18} /></button>
        </div>

        <div className="grid grid-cols-2 gap-x-5 gap-y-7 mb-7">
          {tiles.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.label} onClick={() => { router.push(t.href); onClose(); }} className="flex flex-col items-start gap-2.5 text-left">
                <Icon size={26} style={{ color: CAMPUS.teal }} />
                <span className="text-[14px] font-medium" style={{ color: CAMPUS.ink }}>{t.label}</span>
              </button>
            );
          })}
        </div>

        {!user ? (
          <>
            <p className="text-[12px] mb-4" style={{ color: CAMPUS.inkSoft }}>
              Access is granted by your college&apos;s Training &amp; Placement Cell after you request to join.
            </p>
            <CampusGoogleButton label="Log in or register" style={{ background: CAMPUS.teal, color: "#fff", borderRadius: 0, width: "100%" }} />
          </>
        ) : (
          <button onClick={async () => { await logout(); onClose(); }}
            className="w-full text-[14.5px] font-bold py-3.5" style={{ background: CAMPUS.ink, color: "#fff" }}>
            Sign out
          </button>
        )}

        <div className="h-px my-5" style={{ background: CAMPUS.line, marginLeft: -34, marginRight: -34 }} />

        <div className="flex items-center justify-between mb-7">
          <span className="text-[13px] px-3 py-2 flex items-center gap-1.5" style={{ border: `1px solid ${CAMPUS.line}`, color: CAMPUS.ink }}>
            English <ChevronDown size={12} />
          </span>
          <a href="mailto:devert.contact@gmail.com" className="text-[13px] font-medium" style={{ color: CAMPUS.teal }}>Contact us</a>
        </div>

        <p className="text-[10.5px] font-mono tracking-wide uppercase mb-1" style={{ color: CAMPUS.inkFaint }}>
          {user ? "What you're using" : "What you get, once approved"}
        </p>
        {benefits.map(b => {
          const Icon = b.icon;
          return (
            <div key={b.label} className="flex items-center gap-2.5 py-2.5 text-[13.5px]" style={{ borderBottom: `1px solid ${CAMPUS.line}`, color: CAMPUS.ink }}>
              <Icon size={16} style={{ color: CAMPUS.inkSoft }} /> {b.label}
            </div>
          );
        })}
      </aside>
    </>
  );
}

function CampusDirectory() {
  const { theme } = useCampusTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [institutions, setInstitutions] = useState([]);
  const [studentCounts, setStudentCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [upcomingContests, setUpcomingContests] = useState([]);
  const [flyoutOpen, setFlyoutOpen] = useState(false);
  const [activeContestCount, setActiveContestCount] = useState(0);
  const [totalDevertUsers, setTotalDevertUsers] = useState(null);

  useEffect(() => {
    // The real, whole-platform DeVert user count - not just students already
    // approved into a Campus institution (that number is tiny right now,
    // with only one institution live, and would double-count anyway since
    // every approved Campus student is already a row in this same
    // collection). A cheap aggregate count, not a full download.
    getCountFromServer(collection(db, "users")).then(snap => setTotalDevertUsers(snap.data().count)).catch(() => setTotalDevertUsers(null));

    fetchInstitutions().then(async (list) => {
      setInstitutions(list);
      // Real, computed counts - not the stale studentCount field on the doc
      // (written once at creation, never incremented since).
      const counts = {};
      await Promise.all(list.map(async (inst) => {
        try { counts[inst.id] = (await fetchApprovedStudents(inst.id)).length; }
        catch { counts[inst.id] = null; }
      }));
      setStudentCounts(counts);
    }).catch(console.error).finally(() => setLoading(false));

    fetchPublishedContests()
      .then(list => {
        const bucketed = bucketContests(list);
        setUpcomingContests(bucketed.upcoming.slice(0, 3));
        setActiveContestCount(bucketed.live.length + bucketed.upcoming.length);
      })
      .catch(() => setUpcomingContests([]));
  }, []);

  const q = search.trim().toLowerCase();
  const filtered = q
    ? institutions.filter(inst => inst.name?.toLowerCase().includes(q) || inst.location?.toLowerCase().includes(q))
    : institutions;

  const featured = useMemo(
    () => [...institutions].sort((a, b) => (studentCounts[b.id] || 0) - (studentCounts[a.id] || 0)).slice(0, 3),
    [institutions, studentCounts],
  );
  const featuredIds = new Set(featured.map(i => i.id));

  // All of them, not just the first few - this used to be .slice(0, 6), which
  // silently hid every topic added after "Trees" (Graphs, DP, Backtracking,
  // Heap, Trie, Bit Manipulation...) despite all of them having real problems.
  const tracks = CODELAB_CATEGORIES;

  const directoryJsonLd = institutions.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": institutions.map((inst, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "item": {
        "@type": "EducationalOrganization",
        "name": inst.name,
        "url": `https://devert.in/campus/${inst.id}`,
        ...(inst.location ? { "address": inst.location } : {}),
      },
    })),
  } : null;

  const totalDepartments = institutions.reduce((s, i) => s + (i.departments?.length || 0), 0);

  return (
    <main data-theme={theme} style={{ background: CAMPUS.paper, minHeight: "100vh", colorScheme: theme }} className="campus-theme campus-sharp">
      {directoryJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(directoryJsonLd) }} />
      )}

      <CampusLandingNav onOpenFlyout={() => setFlyoutOpen(true)} />
      <CampusProfileFlyout open={flyoutOpen} onClose={() => setFlyoutOpen(false)} />

      {/* Hero - full-bleed dark ground, sharp filled CTA, abstract mark echoing the
          approved reference's layered-disc graphic, recolored teal-to-gold. */}
      <div className="relative overflow-hidden flex items-end" style={{ minHeight: 420, background: "#0C1116" }}>
        <svg className="absolute pointer-events-none hidden sm:block" style={{ right: -60, top: -40, width: 480, height: 480 }} viewBox="0 0 640 640">
          <defs>
            <linearGradient id="campusHeroGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#0E7C86" /><stop offset="100%" stopColor="#A9720B" />
            </linearGradient>
          </defs>
          <g opacity="0.9">
            <ellipse cx="420" cy="300" rx="220" ry="220" fill="url(#campusHeroGrad)" opacity="0.15" />
            <ellipse cx="420" cy="300" rx="180" ry="180" fill="url(#campusHeroGrad)" opacity="0.22" />
            <ellipse cx="420" cy="300" rx="140" ry="140" fill="url(#campusHeroGrad)" opacity="0.32" />
            <ellipse cx="420" cy="300" rx="100" ry="100" fill="url(#campusHeroGrad)" opacity="0.5" />
            <ellipse cx="420" cy="300" rx="60" ry="60" fill="url(#campusHeroGrad)" opacity="0.85" />
          </g>
        </svg>
        <div className="relative z-10 px-6 sm:px-10 py-14 max-w-2xl">
          <div className="flex items-center gap-2.5 mb-6">
            <span className="w-[22px] h-[22px]" style={{ background: CAMPUS.teal, transform: "rotate(45deg)" }} />
            <span className="text-[17px] font-semibold text-white">DeVert Campus</span>
          </div>
          <h1 className="font-semibold leading-[1.08] mb-5 text-white" style={{ letterSpacing: "-0.015em", fontSize: "clamp(1.9rem,4.5vw,2.9rem)" }}>
            Structured learning &amp; placement prep, run by your college.
          </h1>
          <p className="text-[15px] mb-8 max-w-[46ch]" style={{ color: "rgba(255,255,255,0.68)" }}>
            Daily practice, weekly assessments, coding contests, and a real leaderboard - gated to your students, run by your own Training &amp; Placement Cell.
          </p>
          <button onClick={() => document.getElementById("featured-campuses")?.scrollIntoView({ behavior: "smooth" })}
            className="text-[14.5px] font-bold px-7 py-3.5" style={{ background: CAMPUS.teal, color: "#fff" }}>
            Explore campuses
          </button>
        </div>
      </div>

      {/* Stat strip - dark inverted band, the one deliberate contrast beat, real numbers only.
          Divider is sm:+ only, not index-based - at grid-cols-2 (mobile) every "i > 0" item
          would wrongly inherit the divider meant for an interior COLUMN even when it's
          actually starting a new row, so the border/padding themselves only exist at sm:+,
          where the grid is a single row of 4 and index really does equal column. */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-7 gap-x-6 sm:gap-x-0" style={{ background: "#0C1116", padding: "36px 40px" }}>
        {[
          { label: "Partner institutions", value: institutions.length },
          { label: "Registered students", value: totalDevertUsers != null ? totalDevertUsers.toLocaleString() : "…" },
          { label: "Departments", value: totalDepartments },
          { label: "Active contests", value: activeContestCount },
        ].map((s, i) => (
          <div key={s.label} className={i > 0 ? "sm:border-l sm:pl-5" : ""} style={{ borderColor: "rgba(255,255,255,0.15)" }}>
            <b className="block font-mono font-bold text-white" style={{ fontSize: 30 }}>{s.value}</b>
            <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.55)" }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Search band - flat/boxy, no floating card, matches the reference exactly.
          Directly above the results it filters, not sandwiched by the stat strip. */}
      <div className="px-6 sm:px-10 py-8" style={{ borderBottom: `1px solid ${CAMPUS.line}`, background: CAMPUS.surface }}>
        <div className="max-w-2xl flex items-stretch" style={{ border: `1px solid ${CAMPUS.line}` }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search your college by name, city, or state..."
            className="flex-1 text-[14px] px-4 py-3.5 outline-none bg-transparent" style={{ color: CAMPUS.ink }} />
          <button className="px-6 text-[12.5px] font-bold flex-shrink-0" style={{ background: CAMPUS.ink, color: "#fff" }}>SEARCH</button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12">
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[0, 1, 2].map(i => (
              <div key={i} className="p-6 space-y-4" style={{ background: CAMPUS.surface, border: `1px solid ${CAMPUS.line}` }}>
                <CampusSkeleton variant="rect" width={44} height={44} />
                <CampusSkeleton variant="text" width="70%" height={16} />
                <CampusSkeleton variant="text" width="45%" />
              </div>
            ))}
          </div>
        ) : institutions.length === 0 ? (
          <CampusEmptyState icon={Building2} title="No colleges on DeVert Campus yet"
            description="Once your institution's Training & Placement Cell signs up, it'll appear here." />
        ) : (
          <>
            {!q && featured.length > 0 && (
              <div id="featured-campuses" className="mb-14 scroll-mt-20">
                <SectionHeading icon={Flame} title="Featured Campuses" />
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 border-t border-l" style={{ borderColor: CAMPUS.line }}>
                  {featured.map((inst) => (
                    <InstitutionCard key={inst.id} inst={inst} studentCount={studentCounts[inst.id]} featured />
                  ))}
                </div>
              </div>
            )}

            <div className="mb-14">
              <SectionHeading icon={Building2} title={q ? `Results for "${search}"` : "All Campuses"} />
              {filtered.length === 0 ? (
                <CampusEmptyState size="sm" icon={Search} title="No matches" description={`No college matches "${search}".`} />
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 border-t border-l" style={{ borderColor: CAMPUS.line }}>
                  {filtered.filter(i => q || !featuredIds.has(i.id)).map((inst) => (
                    <InstitutionCard key={inst.id} inst={inst} studentCount={studentCounts[inst.id]} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Features - flat, hairline-divided grid, no card shadows */}
        <div id="campus-features" className="mb-14 scroll-mt-20">
          <SectionHeading icon={GraduationCap} title="Everything a placement cell actually needs" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4" style={{ borderTop: `1px solid ${CAMPUS.line}`, borderLeft: `1px solid ${CAMPUS.line}` }}>
            {[
              { icon: BookOpen, title: "Daily Learning", body: "Notes, videos and concepts, published by your own faculty, with practice attached." },
              { icon: ClipboardCheck, title: "Weekly Assessments", body: "Scheduled, negative-marked, department-scoped tests with real analytics after." },
              { icon: Trophy, title: "Coding Contests", body: "Your own contests, on the same engine that powers DeVert's public Arena." },
              { icon: Users, title: "Bulk Onboarding", body: "CSV roster import matches existing join requests by roll number, in one pass." },
            ].map(f => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="p-6" style={{ borderRight: `1px solid ${CAMPUS.line}`, borderBottom: `1px solid ${CAMPUS.line}`, background: CAMPUS.surface }}>
                  <Icon size={22} style={{ color: CAMPUS.teal }} className="mb-4" />
                  <h4 className="text-[14.5px] font-semibold mb-1.5" style={{ color: CAMPUS.ink }}>{f.title}</h4>
                  <p className="text-[12.5px] leading-relaxed" style={{ color: CAMPUS.inkSoft }}>{f.body}</p>
                </div>
              );
            })}
          </div>
        </div>

        {user && (
          <div className="mb-10">
            <SectionHeading icon={Rocket} title="Your Learning Journey" />
            <LearningJourneyCard sharp onContinue={() => router.push("/campus/learning")} />
          </div>
        )}

        <div className="mb-10">
          <SectionHeading icon={Target} title="Trending Placement Tracks" />
          <div className="flex flex-wrap gap-2.5">
            {tracks.map(t => (
              <TrackChip key={t} label={t} onClick={() => router.push(`/campus/practice?category=${encodeURIComponent(t)}`)} />
            ))}
          </div>
        </div>

        {upcomingContests.length > 0 && (
          <div>
            <SectionHeading icon={Trophy} title="Upcoming Contests" action={
              <button onClick={() => router.push("/campus/contests")} className="text-[12.5px] font-semibold flex items-center gap-1" style={{ color: CAMPUS.teal }}>
                View all <ArrowUpRight size={13} />
              </button>
            } />
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {upcomingContests.map(c => (
                <UpcomingContestRow key={c.id} contest={c} sharp onClick={(id) => router.push(`/campus/contests?open=${id}`)} />
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

// ---------------- Global sections (/campus/contests, /campus/learning, /campus/practice) ----------------

// Real, dedicated, linkable paths for the pre-auth-usable flows (see
// GLOBAL_SECTIONS above) - CampusContestFlow/CampusLearningSection/
// CampusPracticeList here are the exact same components the authenticated
// Workspace tabs render below; the sharp/hairline look comes entirely from
// the .campus-sharp ancestor class (globals.css), not from a different
// component. `atTop` only shows this section's own "back to Campus" control
// at the section's own list level - CampusContestFlow/CampusProblemView
// already render their own "Back" once you're inside a contest or problem,
// and showing both at once is exactly the stacked-back-button pattern this
// was meant to replace.
function CampusGlobalSection({ section }) {
  const { theme } = useCampusTheme();
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [contests, setContests] = useState([]);
  const [contestsLoading, setContestsLoading] = useState(section === "contests");
  const [contestScreen, setContestScreen] = useState({ view: "list" });
  const [practiceScreen, setPracticeScreen] = useState({ view: "list" });
  // Seeded once from ?mode=companyPrep (the nav rail deep-links here from
  // another section) or defaults to coding - same "read once at mount, no
  // sync effect needed" reasoning as ?category= below.
  const [practiceMode, setPracticeMode] = useState(() => (searchParams.get("mode") === "companyPrep" ? "companyPrep" : "coding"));
  const [companyPrepScreen, setCompanyPrepScreen] = useState({ view: "list" });
  // Seeded once from ?category=... (a "Trending Placement Tracks" chip deep
  // link) - searchParams is already available synchronously on first render
  // for a client component, so this needs no separate sync effect.
  const [practiceCategory, setPracticeCategory] = useState(() => searchParams.get("category") || "All");
  const [practiceDifficulty, setPracticeDifficulty] = useState("All");
  const [codelabStats, setCodelabStats] = useState(null);

  useEffect(() => {
    if (section !== "contests") return;
    fetchPublishedContests().then(setContests).catch(() => setContests([])).finally(() => setContestsLoading(false));
  }, [section]);

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

  const practiceAtTop = practiceMode === "coding" ? practiceScreen.view === "list" : companyPrepScreen.view === "list";
  const atTop = section === "learning" ? true
    : section === "contests" ? contestScreen.view === "list"
    : practiceAtTop;
  const showPracticeFilters = practiceMode === "coding" && practiceScreen.view === "list";

  // The rail always jumps to that destination's own top level - clicking
  // "DSA" while already deep in a problem returns to the list, the same
  // way clicking a site's logo always returns home rather than doing
  // nothing if you're already somewhere under it.
  const goPractice = (mode) => {
    if (section !== "practice") { router.push(mode === "companyPrep" ? "/campus/practice?mode=companyPrep" : "/campus/practice"); return; }
    setPracticeMode(mode);
    if (mode === "coding") setPracticeScreen({ view: "list" });
    else setCompanyPrepScreen({ view: "list" });
  };
  const goRoute = (path) => router.push(path);

  return (
    <main data-theme={theme} style={{ background: CAMPUS.paper, minHeight: "100vh", colorScheme: theme }} className="campus-theme campus-sharp px-6 py-10 pb-16">
      <div className="max-w-6xl mx-auto">
        {/* router.back(), not push("/campus") - every real path into this
            section is an in-app click (a nav link, a "Trending Placement
            Tracks" chip, an "Upcoming Contests" row...), so real browser back
            both returns to the exact page that link lived on AND restores
            its scroll position, neither of which push() to a fixed
            destination can do - push() always lands at the top of a fresh
            /campus, discarding wherever the user actually came from. */}
        {atTop && <CampusBackButton onClick={() => router.back()} />}
        <div className="flex gap-8 flex-col lg:flex-row">
          {/* The nav rail (Practice/Learning/Contests) spans every global
              section, not just Practice - previously only Practice had a
              sidebar at all, which made it feel bolted on rather than a
              real, persistent piece of Campus navigation. */}
          <aside className="lg:w-56 flex-shrink-0">
            <div className="flex flex-col gap-6 lg:sticky lg:top-6">
              <CampusSidebarNavRail section={section} practiceMode={practiceMode} onGoPractice={goPractice} onGoRoute={goRoute} />
              {section === "practice" && practiceMode === "coding" && (
                <PracticeProgressCard user={user} stats={codelabStats} />
              )}
            </div>
          </aside>

          <div className="flex-1 min-w-0">
            {section === "contests" && (
              <CampusContestFlow contests={contests} loading={contestsLoading} screen={contestScreen} setScreen={setContestScreen} />
            )}
            {section === "learning" && <CampusLearningSection />}
            {section === "practice" && (
              <>
                {showPracticeFilters && (
                  <div className="flex gap-5 flex-wrap mb-6">
                    <SidebarFilterGroup horizontal label="CATEGORY" options={["All", ...CODELAB_CATEGORIES]} value={practiceCategory} onChange={setPracticeCategory} />
                    <SidebarFilterGroup horizontal label="DIFFICULTY" options={["All", ...CODELAB_DIFFICULTIES]} value={practiceDifficulty} onChange={setPracticeDifficulty} />
                  </div>
                )}
                {practiceMode === "coding" ? (
                  practiceScreen.view === "problem"
                    ? <CampusProblemView problemId={practiceScreen.problemId} onBack={() => setPracticeScreen({ view: "list" })}
                        onSelectProblem={(id) => setPracticeScreen({ view: "problem", problemId: id })} />
                    : <CampusPracticeList hideFilters category={practiceCategory} difficulty={practiceDifficulty}
                        onSelect={(id) => setPracticeScreen({ view: "problem", problemId: id })} />
                ) : (
                  <CampusCompanyPrepFlow screen={companyPrepScreen} setScreen={setCompanyPrepScreen} />
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
  SUSPENDED: "suspended", ADMIN: "admin", APPROVED: "approved",
};

function CampusWorkspace({ slug, initialTab, initialContestId }) {
  const { theme } = useCampusTheme();
  const { user, userData, adminChecked } = useAuth();
  const router = useRouter();

  const [phase, setPhase] = useState(CAMPUS_PHASE.CHECKING);
  const [institution, setInstitution] = useState(null);
  const [membership, setMembership] = useState(null);
  const [tab, setTab] = useState(initialContestId ? "contests" : initialTab);
  const [contestScreen, setContestScreen] = useState(
    initialContestId ? { view: "details", contestId: initialContestId } : { view: "list" },
  );
  const [practiceScreen, setPracticeScreen] = useState({ view: "list" });
  const [companyPrepScreen, setCompanyPrepScreen] = useState({ view: "list" });
  const [practiceCategory, setPracticeCategory] = useState("All");
  const [practiceDifficulty, setPracticeDifficulty] = useState("All");
  const [contentVisibility, setContentVisibility] = useState({ hiddenProblemIds: [], hiddenCompanyIds: [] });
  const isInstAdmin = phase === CAMPUS_PHASE.ADMIN;
  // Only guards a real, rendered workspace - not the checking/pending/
  // signed-out screens above, which have nothing worth protecting against
  // an accidental Back press.
  const exitGuard = useCampusExitGuard(phase === CAMPUS_PHASE.APPROVED || phase === CAMPUS_PHASE.ADMIN);

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

      const [m, adminRole] = await Promise.all([
        fetchMyMembership(slug, user.uid).catch(() => null),
        fetchMyInstitutionAdminRole(slug, user.uid).catch(() => null),
      ]);
      if (cancelled) return;
      setMembership(m);
      if (adminRole) { console.log(`[Auth Debug] Workspace phase: ADMIN for user ${user.uid}`); setPhase(CAMPUS_PHASE.ADMIN); return; }
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

  // Keeps the URL in sync with the contest sub-screen, whatever put it
  // there - Overview's "onOpenContest" shortcut or a row clicked inside the
  // Contests tab's own list - so a real /campus/{slug}/contest/{id} link
  // exists whenever a specific contest is open, and the plain tab URL
  // otherwise. replace, not push - these are sub-states of one tab, not
  // separate history entries worth stepping back through one at a time.
  useEffect(() => {
    const url = tab === "contests" && contestScreen.view !== "list"
      ? `/campus/${slug}/contest/${contestScreen.contestId}`
      : `/campus/${slug}?tab=${tab}`;
    
    if (typeof window !== "undefined") {
      console.log(`[Auth Debug] Updating URL to ${url} via replaceState (bypassing Next.js router to prevent hard reload)`);
      window.history.replaceState(null, '', url);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, contestScreen, slug]);

  const goTab = (t) => {
    setTab(t);
    if (t !== "contests") setContestScreen({ view: "list" });
  };

  const openContest = (contestId) => {
    setContestScreen({ view: "details", contestId });
    goTab("contests");
  };

  // Exactly one screen per phase. Nothing here re-derives or second-
  // guesses `phase` - it was already decided, once, by the effect above.
  if (phase === CAMPUS_PHASE.CHECKING) {
    return <CampusShell><Centered>Loading...</Centered></CampusShell>;
  }
  if (phase === CAMPUS_PHASE.NOT_FOUND) {
    return <CampusShell><Centered>This college isn&apos;t on DeVert Campus (yet).</Centered></CampusShell>;
  }
  if (phase === CAMPUS_PHASE.SIGNED_OUT) {
    return (
      <CampusShell>
        <CampusCard className="p-7 text-center max-w-sm">
          <h3 className="text-[17px] font-semibold mb-2" style={{ color: CAMPUS.ink }}>Sign in to continue</h3>
          <p className="text-[13.5px] mb-5" style={{ color: CAMPUS.inkSoft }}>
            You&apos;ll need a DeVert account to request access to {institution.name}&apos;s Campus workspace.
          </p>
          <CampusGoogleButton style={{ background: CAMPUS.ink, color: "#fff" }} />
          <p className="text-[11.5px] mt-3" style={{ color: CAMPUS.inkFaint }}>
            New to DeVert? Signing in with Google creates your account automatically - no separate signup needed.
          </p>
        </CampusCard>
      </CampusShell>
    );
  }
  if (phase === CAMPUS_PHASE.NO_REQUEST) {
    return (
      <CampusShell>
        {institution.accessMode === "invite_only" ? (
          <CampusIdentityForm slug={slug} institution={institution} uid={user.uid}
            onSubmitted={handleJoinSubmitted} />
        ) : (
          <JoinForm slug={slug} institution={institution} uid={user.uid} userData={userData}
            onSubmitted={handleJoinSubmitted} />
        )}
      </CampusShell>
    );
  }
  if (phase === CAMPUS_PHASE.PENDING) {
    return <CampusShell><PendingCard institution={institution} membership={membership} /></CampusShell>;
  }
  if (phase === CAMPUS_PHASE.REJECTED) {
    return (
      <CampusShell>
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
      </CampusShell>
    );
  }
  if (phase === CAMPUS_PHASE.SUSPENDED) {
    return (
      <CampusShell>
        <CampusCard className="p-7 text-center max-w-sm">
          <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: CAMPUS.badTint, color: CAMPUS.bad }}>
            <Ban size={22} />
          </div>
          <h3 className="text-[17px] font-semibold mb-2" style={{ color: CAMPUS.ink }}>Access suspended</h3>
          <p className="text-[13.5px]" style={{ color: CAMPUS.inkSoft }}>
            Your access to {institution.name}&apos;s Campus workspace has been suspended. Contact your Training &amp; Placement Cell.
          </p>
        </CampusCard>
      </CampusShell>
    );
  }

  // Only CAMPUS_PHASE.APPROVED or CAMPUS_PHASE.ADMIN reach here.
  return (
    <div data-theme={theme} style={{ background: CAMPUS.paper, minHeight: "100vh", colorScheme: theme }} className="campus-theme campus-sharp flex flex-col lg:flex-row">
      <CampusExitConfirmDialog open={exitGuard.exitDialogOpen} institutionName={institution.name}
        onStay={exitGuard.stay} onLeave={exitGuard.leave} />
      <CampusNavRail institution={institution} tab={tab} setTab={goTab} isInstAdmin={isInstAdmin}
        onRequestExit={exitGuard.requestExit} />
      <div className="flex-1 min-w-0 flex flex-col">
        <CampusTopBar institution={institution} userData={userData} setTab={goTab} slug={slug} uid={user.uid} />
        <div className="flex-1 px-5 sm:px-8 py-6 pb-24 lg:pb-6 min-w-0">
          {tab === "dashboard" && (
            <OverviewTab slug={slug} userData={userData} membership={membership} isInstAdmin={isInstAdmin}
              onOpenContest={openContest} onContinueLearning={() => goTab("learning")}
              onBrowseDsa={() => goTab("dsa")} onBrowseCompanyVault={() => goTab("companyVault")}
              onBrowseLeaderboard={() => goTab("leaderboard")} onManage={() => goTab("manage")} />
          )}
          {tab === "profile" && (
            <ProfileTab userData={userData} membership={membership} institution={institution} isInstAdmin={isInstAdmin} />
          )}
          {tab === "learning" && <CampusDailyLearningTab slug={slug} />}
          {tab === "dsa" && (
            <>
              {practiceScreen.view === "list" && (
                <div className="flex gap-5 flex-wrap mb-6">
                  <SidebarFilterGroup horizontal label="CATEGORY" options={["All", ...CODELAB_CATEGORIES]} value={practiceCategory} onChange={setPracticeCategory} />
                  <SidebarFilterGroup horizontal label="DIFFICULTY" options={["All", ...CODELAB_DIFFICULTIES]} value={practiceDifficulty} onChange={setPracticeDifficulty} />
                </div>
              )}
              {practiceScreen.view === "problem"
                ? <CampusProblemView problemId={practiceScreen.problemId} onBack={() => setPracticeScreen({ view: "list" })} />
                : <CampusPracticeList hideFilters category={practiceCategory} difficulty={practiceDifficulty}
                    hiddenIds={new Set(contentVisibility.hiddenProblemIds)}
                    onSelect={(id) => setPracticeScreen({ view: "problem", problemId: id })} />
              }
            </>
          )}
          {tab === "companyVault" && (
            <CampusCompanyPrepFlow screen={companyPrepScreen} setScreen={setCompanyPrepScreen}
              hiddenIds={new Set(contentVisibility.hiddenCompanyIds)} />
          )}
          {tab === "assessments" && <CampusDailyAssessmentsTab slug={slug} />}
          {tab === "contests" && (
            <CampusContestsTabContent institutionId={slug} screen={contestScreen} setScreen={setContestScreen} />
          )}
          {tab === "leaderboard" && <CampusLeaderboardTab slug={slug} myUid={user.uid} />}
          {tab === "manage" && isInstAdmin && <CampusManage institutionId={slug} institution={institution} />}
        </div>
      </div>
      <CampusBottomNav tab={tab} setTab={goTab} />
    </div>
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
// unmounts the workspace or loses tab/scroll state, it just re-arms the
// guard and opens the dialog. Switching tabs never touches history at all
// (see the tab-sync effect above, which uses replaceState), so this never
// fires for in-workspace navigation - only for a real attempt to leave.
function useCampusExitGuard(active) {
  const router = useRouter();
  const [exitDialogOpen, setExitDialogOpen] = useState(false);
  const pendingDestination = useRef("/campus");

  useEffect(() => {
    if (!active) return;
    window.history.pushState({ campusExitGuard: true }, "");
    const onPopState = () => {
      window.history.pushState({ campusExitGuard: true }, "");
      pendingDestination.current = "/campus";
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
              You're currently inside the <b style={{ color: CAMPUS.ink }}>{institutionName} Campus Workspace</b>. Are you sure you want to leave? You can always re-enter this campus later from the Campus section.
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

// Groups TABS under unlabeled section breaks so the rail reads like a real
// product's nav (not a flat list) - Overview/Profile stay ungrouped at top,
// Manage is a separate admin-only group at the bottom (see render below).
const NAV_GROUPS = [
  { label: null,      keys: ["dashboard", "profile"] },
  { label: "Learn",   keys: ["learning", "dsa", "companyVault", "assessments"] },
  { label: "Compete", keys: ["contests", "leaderboard"] },
];

// Hoisted to module scope (not defined inside CampusNavRail's render) so it
// keeps a stable identity across re-renders instead of being torn down and
// recreated on every parent render.
function NavItem({ item, tab, setTab, collapsed }) {
  const Icon = item.icon;
  const active = tab === item.key;
  return (
    <button onClick={() => setTab(item.key)} title={collapsed ? item.label : undefined}
      className={`relative flex items-center gap-2.5 py-2 rounded-lg text-[13px] font-medium whitespace-nowrap transition-colors ${collapsed ? "justify-center px-0" : "px-3"}`}
      style={{ background: active ? CAMPUS.tealTint : "transparent", color: active ? CAMPUS.teal : CAMPUS.inkSoft }}>
      {active && <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full" style={{ background: CAMPUS.teal }} />}
      <Icon size={15} className="flex-shrink-0" /> {!collapsed && item.label}
    </button>
  );
}

// Desktop-only icon+label rail - hidden below lg, replaced by CampusBottomNav.
// Collapsible (persisted like the theme toggle) so it can shrink to an
// icon-only rail without losing the current tab.
function CampusNavRail({ institution, tab, setTab, isInstAdmin, onRequestExit }) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("campus-nav-collapsed") === "1") setCollapsed(true);
  }, []);

  const toggleCollapsed = () => setCollapsed(c => {
    const next = !c;
    localStorage.setItem("campus-nav-collapsed", next ? "1" : "0");
    return next;
  });

  return (
    <aside style={{ background: CAMPUS.surface, borderRight: `1px solid ${CAMPUS.line}` }}
      className={`hidden lg:flex flex-shrink-0 lg:sticky lg:top-0 lg:h-screen lg:self-start px-3 py-5 flex-col gap-1 transition-[width] duration-200 ${collapsed ? "lg:w-[76px]" : "lg:w-[220px]"}`}>
      <div className={`flex items-center gap-2.5 px-1 pb-5 mb-1 ${collapsed ? "justify-center" : ""}`} style={{ borderBottom: `1px solid ${CAMPUS.line}` }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[13px] flex-shrink-0" style={{ background: CAMPUS.teal, color: "#fff" }}>
          {institution.name?.slice(0, 2).toUpperCase()}
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <b className="block text-[13px] truncate" style={{ color: CAMPUS.ink }}>{institution.name}</b>
            <span className="block text-[10px] font-mono tracking-wide" style={{ color: CAMPUS.inkFaint }}>CAMPUS WORKSPACE</span>
          </div>
        )}
      </div>

      <nav className="flex flex-col gap-3 flex-1 overflow-y-auto">
        {NAV_GROUPS.map((g, gi) => (
          <div key={gi} className="flex flex-col gap-1">
            {g.label && !collapsed && (
              <span className="px-3 text-[9.5px] font-mono tracking-widest" style={{ color: CAMPUS.inkFaint }}>{g.label.toUpperCase()}</span>
            )}
            {TABS.filter(t => g.keys.includes(t.key)).map(item => <NavItem key={item.key} item={item} tab={tab} setTab={setTab} collapsed={collapsed} />)}
          </div>
        ))}
        {isInstAdmin && (
          <div className="flex flex-col gap-1 mt-auto pt-3" style={{ borderTop: `1px solid ${CAMPUS.line}` }}>
            {!collapsed && <span className="px-3 text-[9.5px] font-mono tracking-widest" style={{ color: CAMPUS.inkFaint }}>ADMIN</span>}
            <NavItem item={{ key: "manage", label: "Manage", icon: ShieldCheck }} tab={tab} setTab={setTab} collapsed={collapsed} />
          </div>
        )}
      </nav>

      <button onClick={toggleCollapsed}
        className={`flex items-center gap-1.5 text-[11px] font-medium pt-3 mt-1 transition-colors ${collapsed ? "justify-center" : ""}`}
        style={{ color: CAMPUS.inkFaint, borderTop: `1px solid ${CAMPUS.line}` }}>
        {collapsed ? <PanelLeftOpen size={14} /> : <><PanelLeftClose size={13} /> Collapse</>}
      </button>
      <Link href="/" title="Return to DeVert" onClick={(e) => { e.preventDefault(); onRequestExit("/"); }}
        className={`flex items-center gap-1.5 text-[11px] font-medium pt-2 ${collapsed ? "justify-center" : ""}`} style={{ color: CAMPUS.inkFaint }}>
        <ArrowLeft size={12} /> {!collapsed && "Return to DeVert"}
      </Link>
    </aside>
  );
}

// Fixed Material-style bottom nav, mobile only (lg:hidden) - the busiest
// tabs only (see MOBILE_TABS); Profile/Manage stay reachable via the top bar.
function CampusBottomNav({ tab, setTab }) {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-20 flex items-stretch"
      style={{ background: CAMPUS.surface, borderTop: `1px solid ${CAMPUS.line}`, boxShadow: CAMPUS.shadowHover }}>
      {MOBILE_TABS.map(t => {
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
// Everything anchored to the top-right profile avatar - Share/Copy link/Save
// this Campus, then View Profile and Sign out below a divider. Consolidated
// here (rather than a separate "..." icon) so the avatar is the one place
// every account/campus-level action lives.
function CampusProfileMenu({ institution, slug, userData, uid, setTab }) {
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

  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/campus/${slug}` : `/campus/${slug}`;
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
    router.push("/campus");
  };

  const ITEM_STYLE = { color: CAMPUS.ink };
  const onEnter = (e) => { e.currentTarget.style.background = CAMPUS.paper; };
  const onLeave = (e) => { e.currentTarget.style.background = "transparent"; };

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(o => !o)} title="Account"
        className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
        style={{ background: CAMPUS.goldTint, color: CAMPUS.gold }}>
        {(userData?.displayName || "?").slice(0, 2).toUpperCase()}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 z-30 rounded-lg overflow-hidden"
          style={{ width: 230, background: CAMPUS.surface, border: `1px solid ${CAMPUS.line}`, boxShadow: CAMPUS.shadowLg }}>
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
          <button onClick={() => { setTab("profile"); setOpen(false); }} onMouseEnter={onEnter} onMouseLeave={onLeave}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[12.5px] text-left transition-colors"
            style={{ ...ITEM_STYLE, borderTop: `1px solid ${CAMPUS.line}` }}>
            <IdCard size={14} style={{ color: CAMPUS.inkFaint }} /> View Profile
          </button>
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

function CampusTopBar({ institution, userData, setTab, slug, uid }) {
  return (
    <header className="flex items-center gap-3 px-5 sm:px-8 py-3.5 flex-shrink-0"
      style={{ background: CAMPUS.surface, borderBottom: `1px solid ${CAMPUS.line}` }}>
      <div className="lg:hidden w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[12px] flex-shrink-0" style={{ background: CAMPUS.teal, color: "#fff" }}>
        {institution.name?.slice(0, 2).toUpperCase()}
      </div>
      <span className="hidden lg:inline text-[12.5px] font-medium truncate" style={{ color: CAMPUS.inkFaint }}>{institution.name}</span>
      <div className="flex-1" />
      <CampusThemeToggle />
      <CampusProfileMenu institution={institution} slug={slug} userData={userData} uid={uid} setTab={setTab} />
    </header>
  );
}

// Real institution-scoped rank, computed from the same xp-ordered query used
// by CampusLeaderboardTab below - not a fabricated number. Returns null
// (renders nothing) rather than guessing if the roster hasn't loaded yet.
function useMyInstitutionRank(slug, myUid) {
  const [rank, setRank] = useState(null);
  useEffect(() => {
    if (!slug || !myUid) return;
    getDocs(query(collection(db, "users"), where("institutionId", "==", slug), orderBy("xp", "desc"), limit(200)))
      .then(snap => {
        const idx = snap.docs.findIndex(d => d.id === myUid);
        setRank(idx === -1 ? null : idx + 1);
      })
      .catch(() => setRank(null));
  }, [slug, myUid]);
  return rank;
}

// Real navigation shortcuts only - every entry routes to a tab that already
// exists and already works, never a placeholder feature.
function QuickActionsRow({ onDsa, onCompanyVault, onLeaderboard, onLearning, onManage, isInstAdmin }) {
  const actions = [
    { label: "DSA", icon: Code2, onClick: onDsa },
    { label: "Company Vault", icon: Briefcase, onClick: onCompanyVault },
    { label: "Leaderboard", icon: BarChart3, onClick: onLeaderboard },
    { label: "Daily Learning", icon: BookOpen, onClick: onLearning },
    ...(isInstAdmin ? [{ label: "Manage", icon: ShieldCheck, onClick: onManage }] : []),
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {actions.map(a => (
        <CampusButton key={a.label} variant="secondary" rounded="2xl" icon={a.icon} onClick={a.onClick}
          className="w-full py-3.5" style={{ boxShadow: CAMPUS.shadow }}>
          {a.label}
        </CampusButton>
      ))}
    </div>
  );
}

function OverviewTab({ slug, userData, membership, isInstAdmin, onOpenContest, onContinueLearning, onBrowseDsa, onBrowseCompanyVault, onBrowseLeaderboard, onManage }) {
  const rank = useMyInstitutionRank(slug, userData?.uid);
  const [contests, setContests] = useState([]);
  const [contestsLoading, setContestsLoading] = useState(true);
  const [announcements, setAnnouncements] = useState([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(true);
  const [noticeItem, setNoticeItem] = useState(undefined); // undefined = loading, null = no weekly program

  useEffect(() => {
    fetchInstitutionContests(slug)
      .then(list => setContests(bucketContests(list.filter(c => c.status === "published")).upcoming.slice(0, 2)))
      .catch(() => setContests([]))
      .finally(() => setContestsLoading(false));
  }, [slug]);

  useEffect(() => {
    fetchAnnouncements(slug)
      .then(list => setAnnouncements(list.slice(0, 3)))
      .catch(() => setAnnouncements([]))
      .finally(() => setAnnouncementsLoading(false));
  }, [slug]);

  useEffect(() => {
    fetchWeekItems(slug, mondayOf()).then(items => {
      const past = items.filter(it => it.date <= todayISO());
      setNoticeItem(past.length ? past[past.length - 1] : null);
    }).catch(() => setNoticeItem(null));
  }, [slug]);

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="campus-sharp">
      <motion.div variants={slideUp} className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-semibold" style={{ color: CAMPUS.ink }}>
          Welcome, {(userData?.displayName || "there").split(" ")[0]}
        </h2>
        <CampusChip color={CAMPUS.teal}>{isInstAdmin ? "ADMIN" : (membership?.department || "STUDENT")}</CampusChip>
      </motion.div>

      <motion.div variants={slideUp} className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <CampusStat label="XP" value={userData?.xp ?? 0} color={CAMPUS.teal} />
        <CampusStat label="Coins" value={userData?.credits ?? 0} color={CAMPUS.gold} />
        <CampusStat label="Problems Solved" value={userData?.problemsSolvedCount ?? 0} color={CAMPUS.blue} />
        <CampusStat label="Campus Rank" value={rank ? `#${rank}` : "-"} color={CAMPUS.purple} />
      </motion.div>

      <motion.div variants={slideUp}>
        <QuickActionsRow onDsa={onBrowseDsa} onCompanyVault={onBrowseCompanyVault} onLeaderboard={onBrowseLeaderboard} onLearning={onContinueLearning} onManage={onManage} isInstAdmin={isInstAdmin} />
      </motion.div>

      <motion.div variants={slideUp} className="grid md:grid-cols-2 gap-5 mb-6 items-stretch">
        <div className="flex flex-col h-full">
          <SectionHeading icon={Rocket} title="Continue Learning" />
          <div className="flex-1 flex flex-col">
            <LearningJourneyCard onContinue={onContinueLearning} />
          </div>
        </div>
        <div className="flex flex-col h-full">
          <SectionHeading icon={Trophy} title="Upcoming Contests" />
          <div className="flex-1 flex flex-col">
            {contestsLoading ? (
              <CampusCard className="p-5 space-y-2.5 h-full">
                <CampusSkeleton variant="rect" height={20} width="70%" />
                <CampusSkeleton variant="rect" height={14} width="40%" />
              </CampusCard>
            ) : contests.length === 0 ? (
              <CampusEmptyState size="sm" icon={Trophy} title="No contests scheduled"
                description="Check back once your institution schedules a new contest." className="h-full" />
            ) : (
              <div className="space-y-2.5 h-full">
                {contests.map(c => <UpcomingContestRow key={c.id} contest={c} onClick={onOpenContest} />)}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {noticeItem && (
        <motion.div variants={slideUp} className="mb-6">
          <SectionHeading icon={Megaphone} title={`Noticeboard - ${DOW_LABELS[noticeItem.dow]}'s Leaderboard`} />
          <CampusDayLeaderboard slug={slug} date={noticeItem.date} dayLabel={DOW_LABELS[noticeItem.dow]} myUid={userData?.uid} compact />
          <button onClick={onBrowseLeaderboard} className="mt-2 text-[11px] font-medium" style={{ color: CAMPUS.teal }}>
            view full leaderboard &rarr;
          </button>
        </motion.div>
      )}

      <motion.div variants={slideUp} className="grid sm:grid-cols-2 gap-4">
        {noticeItem === null && (
          <CampusEmptyState size="sm" icon={Activity} color={CAMPUS.blue} title="Recent Activity"
            description="Your activity feed isn't live yet - it'll show your latest submissions, XP gains, and completions here." />
        )}
        {announcementsLoading ? (
          <CampusCard className="p-4 space-y-2"><CampusSkeleton variant="text" width="60%" /><CampusSkeleton variant="text" width="90%" /></CampusCard>
        ) : announcements.length === 0 ? (
          <CampusEmptyState size="sm" icon={Megaphone} color={CAMPUS.gold} title="Announcements"
            description="Institution-wide announcements from your Training & Placement Cell will appear here once available." />
        ) : (
          <CampusCard className="p-4">
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
        <CampusEmptyState size="sm" icon={BarChart3} color={CAMPUS.purple} title="Learning Analytics"
          description="Deeper progress analytics (time spent, streaks, topic breakdowns) are coming to Daily Learning." />
        <CampusEmptyState size="sm" icon={Target} color={CAMPUS.warn} title="Placement Readiness"
          description="A readiness score based on your practice, contests, and learning progress is coming soon." />
      </motion.div>
    </motion.div>
  );
}

function ProfileRow({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-3 py-3" style={{ borderBottom: `1px solid ${CAMPUS.line}` }}>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: CAMPUS.tealTint, color: CAMPUS.teal }}>
        <Icon size={14} />
      </div>
      <div className="min-w-0">
        <span className="block text-[10px] font-mono tracking-wide mb-0.5" style={{ color: CAMPUS.inkFaint }}>{label.toUpperCase()}</span>
        <span className="block text-[13.5px] font-medium truncate" style={{ color: CAMPUS.ink }}>{value}</span>
      </div>
    </div>
  );
}

function ProfileTab({ userData, membership, institution, isInstAdmin }) {
  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible">
      <motion.div variants={slideUp} className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold flex-shrink-0"
          style={{ background: CAMPUS.goldTint, color: CAMPUS.gold }}>
          {(userData?.displayName || "?").slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0">
          <h2 className="text-xl font-semibold truncate" style={{ color: CAMPUS.ink }}>{userData?.displayName || "Your Profile"}</h2>
          <p className="text-[13px]" style={{ color: CAMPUS.inkSoft }}>@{userData?.handle || "-"}</p>
          <span className="inline-block mt-1.5">
            <CampusChip color={CAMPUS.teal}>{isInstAdmin ? "INSTITUTION ADMIN" : "STUDENT"}</CampusChip>
          </span>
        </div>
      </motion.div>

      <motion.div variants={slideUp} className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <CampusStat label="XP" value={userData?.xp ?? 0} color={CAMPUS.teal} />
        <CampusStat label="Coins" value={userData?.credits ?? 0} />
        <CampusStat label="Year" value={membership?.year || "-"} />
        <CampusStat label="Section" value={membership?.section || "-"} />
      </motion.div>

      <motion.div variants={slideUp}>
        <CampusCard className="px-5">
          <ProfileRow icon={Building2} label="Institution" value={institution?.name} />
          <ProfileRow icon={Hash} label="Roll number" value={membership?.rollNumber} />
          <ProfileRow icon={GraduationCap} label="Department" value={membership?.department} />
          <ProfileRow icon={Mail} label="Contact email" value={userData?.contactEmail} />
          <ProfileRow icon={Phone} label="Phone" value={membership?.phone} />
        </CampusCard>
      </motion.div>
    </motion.div>
  );
}

// Real, institution-scoped xp leaderboard - mirrors app/ranks/page.jsx's
// query pattern with one added `where`, using the composite index already
// provisioned in firestore.indexes.json ([institutionId, xp desc]).
function CampusLeaderboardTab({ slug, myUid }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [weekItems, setWeekItems] = useState([]);
  const [filter, setFilter] = useState("xp"); // "xp" or an item's date

  useEffect(() => {
    getDocs(query(collection(db, "users"), where("institutionId", "==", slug), orderBy("xp", "desc"), limit(50)))
      .then(snap => setRows(snap.docs.map((d, i) => ({ rank: i + 1, uid: d.id, ...d.data() }))))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    fetchWeekItems(slug, mondayOf()).then(setWeekItems).catch(() => setWeekItems([]));
  }, [slug]);

  const activeItem = weekItems.find(it => it.date === filter);

  const filterChips = (
    <div className="flex items-center gap-1.5 flex-wrap mb-4">
      <button onClick={() => setFilter("xp")} className="text-[11px] font-mono font-semibold px-3 py-1.5 rounded-lg transition-colors"
        style={{
          color: filter === "xp" ? CAMPUS.teal : CAMPUS.inkSoft,
          background: filter === "xp" ? CAMPUS.tealTint : "transparent",
          border: `1px solid ${filter === "xp" ? CAMPUS.teal : CAMPUS.line}`,
        }}>
        Overall XP
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

  if (filter !== "xp" && activeItem) {
    return (
      <div>
        {filterChips}
        <CampusDayLeaderboard slug={slug} date={activeItem.date} dayLabel={DOW_LABELS[activeItem.dow]} myUid={myUid} />
      </div>
    );
  }

  if (loading) {
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
    { key: "xp", label: "XP", sortable: true, render: r => <span className="font-mono font-semibold" style={{ color: CAMPUS.teal }}>{(r.xp || 0).toLocaleString()}</span> },
  ];

  return (
    <div>
      {weekItems.length > 0 && filterChips}
      <CampusCard className="overflow-hidden">
        <CampusTable columns={columns} rows={rows} rowKey="uid"
          rowStyle={r => ({ background: r.uid === myUid ? CAMPUS.tealTint : "transparent" })}
          emptyState={<CampusEmptyState icon={Medal} title="No ranked students yet" description="Once students start earning XP, they'll show up here." />} />
      </CampusCard>
    </div>
  );
}

// Institution-scoped contests are real contests/{id} docs (see lib/contests.js's
// fetchInstitutionContests + firestore.rules). CampusContestFlow (below) then
// handles list -> details -> attempt -> results entirely natively, reusing
// registerForContest/submitContestAnswers/gradeSubmission/persistGrading etc.
// verbatim - see components/campus/campus-contests.jsx.
function CampusContestsTabContent({ institutionId, screen, setScreen }) {
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInstitutionContests(institutionId)
      .then(list => setContests(list.filter(c => c.status === "published")))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [institutionId]);

  return <CampusContestFlow contests={contests} loading={loading} screen={screen} setScreen={setScreen} />;
}

// Invite-only campuses show this instead of the full JoinForm - just two
// fields (Full Name + Roll Number), a mandatory warning/review step before
// submission, and no self-edit afterward (Roll Number Lock - enforced by
// firestore.rules' students/{uid} update rule, which is admin-only). Still
// submits via requestToJoin() as a "pending" roster doc, same as public
// campuses - the institution's admin reviews and approves it exactly the
// same way; only the client-side form and the lock/warning are different.
function CampusIdentityForm({ slug, institution, uid, onSubmitted }) {
  const [step, setStep] = useState("form"); // "form" | "review"
  const [name, setName] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const canReview = name.trim() && rollNumber.trim();

  const handleConfirm = async () => {
    setError(""); setSubmitting(true);
    try {
      const payload = { name: name.trim(), rollNumber: rollNumber.trim() };
      await requestToJoin(slug, uid, payload);
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
        <div className="rounded-lg p-3.5 mb-5" style={{ background: CAMPUS.warnTint, border: `1px solid ${CAMPUS.warn}40` }}>
          <p className="flex items-center gap-1.5 text-[12px] font-semibold mb-1.5" style={{ color: CAMPUS.warn }}>
            <AlertTriangle size={13} /> Campus Identity
          </p>
          <p className="text-[11.5px] leading-relaxed" style={{ color: CAMPUS.inkSoft }}>
            Your Full Name and Roll Number become your official identity for <b>{institution.name}</b>. These
            are used for leaderboards, contest rankings, certificates, progress tracking, analytics, and campus
            reports. <b>After submission you cannot modify these details yourself</b> - only your Training &amp;
            Placement Cell can. Please verify everything carefully before continuing.
          </p>
        </div>
        <div className="space-y-2.5 mb-6">
          <div className="flex items-center justify-between text-[12.5px] pb-2.5" style={{ borderBottom: `1px solid ${CAMPUS.line}` }}>
            <span style={{ color: CAMPUS.inkFaint }}>Full Name</span>
            <b style={{ color: CAMPUS.ink }}>{name}</b>
          </div>
          <div className="flex items-center justify-between text-[12.5px]">
            <span style={{ color: CAMPUS.inkFaint }}>Roll Number</span>
            <b className="font-mono" style={{ color: CAMPUS.ink }}>{rollNumber}</b>
          </div>
        </div>
        {error && <p className="text-[11.5px] mb-3" style={{ color: CAMPUS.bad }}>{error}</p>}
        <button onClick={handleConfirm} disabled={submitting}
          className="w-full text-[13px] font-semibold py-2.5 rounded-lg disabled:opacity-50"
          style={{ background: CAMPUS.ink, color: "#fff" }}>
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
      </div>
      <button onClick={() => setStep("review")} disabled={!canReview}
        className="w-full mt-5 text-[13px] font-semibold py-2.5 rounded-lg disabled:opacity-50"
        style={{ background: CAMPUS.ink, color: "#fff" }}>
        Review
      </button>
    </CampusCard>
  );
}

function JoinForm({ slug, institution, uid, userData, onSubmitted }) {
  const [form, setForm] = useState({
    name: userData?.displayName || "", rollNumber: "", department: "", year: "", section: "", phone: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!form.name.trim() || !form.rollNumber.trim()) { setError("Name and roll number are required."); return; }
    setError(""); setSubmitting(true);
    try {
      await requestToJoin(slug, uid, form);
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
        Your Training &amp; Placement Cell reviews requests before granting access.
      </p>
      <div className="space-y-3">
        <Field label="Full name" value={form.name} onChange={v => setForm(p => ({ ...p, name: v }))} />
        <Field label="Roll number" value={form.rollNumber} onChange={v => setForm(p => ({ ...p, rollNumber: v }))} placeholder="21A91A0512" />
        <Field label="Department" value={form.department} onChange={v => setForm(p => ({ ...p, department: v }))} placeholder="CSE" />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Year" value={form.year} onChange={v => setForm(p => ({ ...p, year: v }))} placeholder="3" />
          <Field label="Section" value={form.section} onChange={v => setForm(p => ({ ...p, section: v }))} placeholder="A" />
        </div>
      </div>
      {error && <p className="text-[11.5px] mt-3" style={{ color: CAMPUS.bad }}>{error}</p>}
      <button onClick={submit} disabled={submitting}
        className="w-full mt-5 text-[13px] font-semibold py-2.5 rounded-lg disabled:opacity-50"
        style={{ background: CAMPUS.ink, color: "#fff" }}>
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

function PendingCard({ institution, membership }) {
  return (
    <CampusCard className="p-7 w-full max-w-sm text-center">
      <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: CAMPUS.warnTint, color: CAMPUS.warn }}>
        <Clock size={20} />
      </div>
      <h3 className="text-[16px] font-semibold mb-2" style={{ color: CAMPUS.ink }}>Request sent to {institution.name}</h3>
      <p className="text-[13px] mb-4" style={{ color: CAMPUS.inkSoft }}>
        You&apos;ll get a notification the moment you&apos;re approved.
      </p>
      <div className="flex justify-between text-[11.5px] py-2" style={{ borderTop: `1px solid ${CAMPUS.line}`, color: CAMPUS.inkFaint }}>
        <span>Roll number</span><span className="font-mono" style={{ color: CAMPUS.ink }}>{membership.rollNumber}</span>
      </div>
    </CampusCard>
  );
}
