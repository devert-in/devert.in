"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Activity, AlertTriangle, BarChart3, BookMarked, BookOpen, Bookmark, CalendarCheck,
  ClipboardList, FileQuestion, GraduationCap, Layers, Library, ListChecks, Repeat,
  ScrollText, Sigma, Target, Trophy,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { CAMPUS } from "@/lib/campus-theme";
import {
  CampusCard, CampusEmptyState, CampusSkeleton, CampusButton,
} from "@/components/campus/campus-ui";
import { useCampusBackHandler } from "@/lib/campusNav";
import {
  fetchPapers, fetchAllProgress, fetchProgress, fetchSyllabusTree, resolveTargetPaper,
  setTargetPaper, fetchDailyHistory, computeCompletion, dateKey, fetchDailyPlan,
} from "@/lib/gate";
import { fetchPyqProgress, fetchNotes } from "@/lib/gatePyq";
import { fetchMyAttempts } from "@/lib/gateTests";

import { GateOverview } from "@/components/campus/gate/gate-overview";
import { GateSyllabus } from "@/components/campus/gate/gate-syllabus";
import { GateSubjects, GateTopicView } from "@/components/campus/gate/gate-subjects";
import { GateDaily } from "@/components/campus/gate/gate-daily";
import { GatePractice } from "@/components/campus/gate/gate-practice";
import { GatePyqBrowser } from "@/components/campus/gate/gate-pyq";
import { GateTestList, GateTestFlow } from "@/components/campus/gate/gate-tests";
import { GateRevision, GateShortNotes } from "@/components/campus/gate/gate-revision";
import { GateFormulaBook } from "@/components/campus/gate/gate-formula-book";
import { GateBookmarks, GateMistakes } from "@/components/campus/gate/gate-notebook";
import { GateAnalytics } from "@/components/campus/gate/gate-analytics";
import { GateLeaderboard } from "@/components/campus/gate/gate-leaderboard";
import { GateResources } from "@/components/campus/gate/gate-resources";

// The GATE module's own workspace - one Campus tab on the outside, sixteen
// destinations on the inside.
//
// Why a nested nav rather than sixteen Campus tabs: CLAUDE.md is explicit that
// new features integrate into an existing route rather than growing top-level
// navigation, and a rail with sixteen more entries would drown the eleven that
// are already there. GATE is one destination in the rail (peer to Programming
// and CS Core) that opens into its own workspace, exactly as Programming opens
// into a language/topic hierarchy of its own.
//
// The nav is two rows, not one scroller: five groups, then the sections within
// the active group. Sixteen pills in a single horizontal scroller means half the
// module is permanently off-screen and undiscoverable, which is how a feature
// this size gets used as if it were three screens.

// ---------------- section registry ----------------

// The single source of truth for the sub-nav, same discipline as
// lib/campusNavConfig.js: one array, so a new section cannot be added to the
// router but forgotten in the nav (or vice versa).
export const GATE_SECTIONS = [
  { key: "overview", label: "Overview", icon: Target, group: "prepare" },
  { key: "syllabus", label: "Syllabus", icon: ListChecks, group: "prepare" },
  { key: "subjects", label: "Subjects", icon: Layers, group: "prepare" },
  { key: "daily", label: "Daily GATE", icon: CalendarCheck, group: "prepare" },

  { key: "practice", label: "Topic Practice", icon: BookOpen, group: "practice" },
  { key: "pyq", label: "Previous Year Questions", icon: FileQuestion, group: "practice" },

  { key: "mocks", label: "Mock Tests", icon: ClipboardList, group: "test" },
  { key: "subjectTests", label: "Subject Tests", icon: BookMarked, group: "test" },

  { key: "revision", label: "Revision", icon: Repeat, group: "revise" },
  { key: "formula", label: "Formula Book", icon: Sigma, group: "revise" },
  { key: "shortNotes", label: "Short Notes", icon: ScrollText, group: "revise" },

  { key: "bookmarks", label: "Bookmarks", icon: Bookmark, group: "track" },
  { key: "mistakes", label: "Mistakes Notebook", icon: AlertTriangle, group: "track" },
  { key: "analytics", label: "Analytics", icon: BarChart3, group: "track" },
  { key: "leaderboard", label: "Leaderboard", icon: Trophy, group: "track" },
  { key: "resources", label: "Resources", icon: Library, group: "track" },
];

const GATE_GROUPS = [
  { key: "prepare", label: "Prepare", icon: GraduationCap },
  { key: "practice", label: "Practice", icon: BookOpen },
  { key: "test", label: "Test", icon: ClipboardList },
  { key: "revise", label: "Revise", icon: Repeat },
  { key: "track", label: "Track", icon: Activity },
];

function sectionMeta(key) {
  return GATE_SECTIONS.find(s => s.key === key) || GATE_SECTIONS[0];
}

// ---------------- shared data context ----------------

// One fetch of each shared document per session, shared by every section,
// instead of sixteen screens each re-reading the same syllabus tree and progress
// doc on every navigation. `reload` handles the narrow set of cases where a
// section's own write changes data another section renders (completing a topic
// changes the Overview's completion, filing a mistake changes the notebook's
// count) - targeted reloaders rather than one blunt refetch-everything, so
// marking a topic complete doesn't re-download the whole PYQ attempt history.
const GateContext = createContext(null);

export function useGate() {
  const ctx = useContext(GateContext);
  if (!ctx) throw new Error("useGate must be used inside the GATE workspace.");
  return ctx;
}

function useGateData(user) {
  const [state, setState] = useState({
    loading: true, error: null,
    papers: [], paper: null, allProgress: [],
    tree: [], progress: null, notes: null, pyqProgress: null,
    attempts: [], dailyHistory: [], today: null,
  });

  // Papers first, because everything else is scoped to the resolved target
  // paper. A student with no papers published yet is a real, renderable state
  // (the module is installed but content authoring hasn't started), not an
  // error.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const papers = await fetchPapers();
        if (cancelled) return;
        if (!papers.length) {
          setState(s => ({ ...s, loading: false, papers: [], paper: null }));
          return;
        }
        const allProgress = user ? await fetchAllProgress(user.uid, papers).catch(() => []) : [];
        if (cancelled) return;
        const paper = resolveTargetPaper(allProgress, papers);
        setState(s => ({ ...s, papers, allProgress, paper }));
      } catch (e) {
        if (!cancelled) setState(s => ({ ...s, loading: false, error: e?.message || "Could not load GATE papers." }));
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  // Then everything scoped to that paper. Re-runs on a paper switch, which is
  // exactly right: switching from CS to DA must not leave DA's screens rendering
  // CS's syllabus tree.
  const paperId = state.paper?.id;
  useEffect(() => {
    if (!paperId) return;
    let cancelled = false;
    setState(s => ({ ...s, loading: true }));
    (async () => {
      const [tree, progress, notes, pyqProgress, attempts, dailyHistory, today] = await Promise.all([
        fetchSyllabusTree(paperId).catch(() => []),
        user ? fetchProgress(user.uid, paperId).catch(() => null) : Promise.resolve(null),
        user ? fetchNotes(user.uid, paperId).catch(() => null) : Promise.resolve(null),
        user ? fetchPyqProgress(user.uid, paperId).catch(() => null) : Promise.resolve(null),
        user ? fetchMyAttempts(user.uid, paperId).catch(() => []) : Promise.resolve([]),
        user ? fetchDailyHistory(user.uid, paperId, 90).catch(() => []) : Promise.resolve([]),
        user ? fetchDailyPlan(user.uid, paperId).catch(() => null) : Promise.resolve(null),
      ]);
      if (cancelled) return;
      setState(s => ({ ...s, loading: false, tree, progress, notes, pyqProgress, attempts, dailyHistory, today }));
    })();
    return () => { cancelled = true; };
  }, [paperId, user]);

  const reload = useMemo(() => ({
    progress: async () => {
      if (!user || !paperId) return;
      const progress = await fetchProgress(user.uid, paperId).catch(() => null);
      setState(s => ({ ...s, progress }));
    },
    notes: async () => {
      if (!user || !paperId) return;
      const notes = await fetchNotes(user.uid, paperId).catch(() => null);
      setState(s => ({ ...s, notes }));
    },
    pyqProgress: async () => {
      if (!user || !paperId) return;
      const pyqProgress = await fetchPyqProgress(user.uid, paperId).catch(() => null);
      setState(s => ({ ...s, pyqProgress }));
    },
    attempts: async () => {
      if (!user || !paperId) return;
      const attempts = await fetchMyAttempts(user.uid, paperId).catch(() => []);
      setState(s => ({ ...s, attempts }));
    },
    daily: async () => {
      if (!user || !paperId) return;
      const [dailyHistory, today] = await Promise.all([
        fetchDailyHistory(user.uid, paperId, 90).catch(() => []),
        fetchDailyPlan(user.uid, paperId).catch(() => null),
      ]);
      setState(s => ({ ...s, dailyHistory, today }));
    },
  }), [user, paperId]);

  const switchPaper = useCallback(async (nextPaperId) => {
    const paper = state.papers.find(p => p.id === nextPaperId);
    if (!paper) return;
    setState(s => ({ ...s, paper, tree: [], progress: null, notes: null, pyqProgress: null, attempts: [] }));
    if (user) {
      await setTargetPaper(user.uid, nextPaperId, state.papers.map(p => p.id)).catch(() => {});
      const allProgress = await fetchAllProgress(user.uid, state.papers).catch(() => []);
      setState(s => ({ ...s, allProgress }));
    }
  }, [state.papers, user]);

  const completion = useMemo(() => computeCompletion(state.tree, state.progress), [state.tree, state.progress]);

  return { ...state, reload, switchPaper, completion, todayKey: dateKey() };
}

// ---------------- top-level router ----------------

export function CampusGateTab() {
  const { user } = useAuth();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const slug = pathname.split("/").filter(Boolean)[1];
  const data = useGateData(user);

  // Read once on mount from the query string. CampusWorkspace's own URL-sync
  // effect deliberately skips this tab (NAV_ITEMS' ownUrl: true), so this
  // self-owned effect below is not clobbered - same precedent as Programming,
  // CS Core, Aptitude and Manage.
  const [screen, setScreen] = useState(() => {
    const section = searchParams.get("section");
    const known = GATE_SECTIONS.some(s => s.key === section);
    return {
      section: known ? section : "overview",
      subjectId: searchParams.get("subject") || null,
      topicId: searchParams.get("topic") || null,
      testId: searchParams.get("test") || null,
    };
  });

  const [group, setGroup] = useState(() => sectionMeta(screen.section).group);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams({ tab: "gate", section: screen.section });
    if (screen.subjectId) params.set("subject", screen.subjectId);
    if (screen.topicId) params.set("topic", screen.topicId);
    if (screen.testId) params.set("test", screen.testId);
    window.history.replaceState(null, "", `/campus/${slug}?${params.toString()}`);
  }, [screen, slug]);

  const go = useCallback((section, params = {}) => {
    setScreen({ section, subjectId: null, topicId: null, testId: null, ...params });
    setGroup(sectionMeta(section).group);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  // Depth 2 is "this tab's own sub-screen" and depth 3 a drill-down inside one
  // (a topic inside Subjects, a live attempt inside Mock Tests) - see
  // lib/campusNav.js. Registering both means Back walks
  // topic -> subject list -> Overview -> (leave Campus) instead of asking to
  // leave from four screens deep.
  const inDrillDown = !!(screen.topicId || screen.testId);
  useCampusBackHandler(3, inDrillDown, () => setScreen(s => ({ ...s, topicId: null, testId: null })));
  useCampusBackHandler(2, !inDrillDown && screen.section !== "overview", () => go("overview"));

  if (data.error) {
    return <CampusEmptyState icon={AlertTriangle} title="GATE module unavailable" description={data.error} />;
  }

  if (!data.paper && !data.loading) {
    return (
      <CampusEmptyState icon={GraduationCap} title="GATE preparation is being set up"
        description="No GATE paper has been published yet. A platform admin seeds the official syllabus and publishes a paper from /admin - once that's done, the full module appears here." />
    );
  }

  const visibleSections = GATE_SECTIONS.filter(s => s.group === group);
  const Section = SECTION_COMPONENTS[screen.section] || GateOverview;

  return (
    <GateContext.Provider value={{ ...data, go, screen, slug }}>
      <div className="space-y-5">
        <GateHeader paper={data.paper} papers={data.papers} onSwitchPaper={data.switchPaper}
          completion={data.completion} loading={data.loading} />

        <GateSectionNav group={group} setGroup={setGroup} sections={visibleSections}
          active={screen.section} onSelect={(key) => go(key)} />

        {data.loading ? (
          <div className="space-y-4">
            <CampusCard className="p-4"><CampusSkeleton height={110} /></CampusCard>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[0, 1, 2].map(i => <CampusCard key={i} className="p-4"><CampusSkeleton height={80} /></CampusCard>)}
            </div>
          </div>
        ) : (
          <Section />
        )}
      </div>
    </GateContext.Provider>
  );
}

// Sections that own a drill-down render it themselves rather than being replaced
// here, so the section nav stays visible and a student never loses their place.
// The two exceptions are a topic lesson and a live test attempt, both of which
// are full-screen by design - a timed attempt with a nav bar inviting you to
// leave mid-paper is a worse product, and a lesson wants the full column width.
const SECTION_COMPONENTS = {
  overview: GateOverview,
  syllabus: GateSyllabus,
  subjects: SubjectsRoute,
  daily: GateDaily,
  practice: GatePractice,
  pyq: GatePyqBrowser,
  mocks: MocksRoute,
  subjectTests: SubjectTestsRoute,
  revision: GateRevision,
  formula: GateFormulaBook,
  shortNotes: GateShortNotes,
  bookmarks: GateBookmarks,
  mistakes: GateMistakes,
  analytics: GateAnalytics,
  leaderboard: GateLeaderboard,
  resources: GateResources,
};

function SubjectsRoute() {
  const { screen } = useGate();
  return screen.topicId ? <GateTopicView /> : <GateSubjects />;
}

// Mock Tests and Subject Tests are the same list component behind two different
// filters, not two implementations - "mock" means whole-paper-shaped
// (full/mixed/weekly/pyq), "subject" means scoped (subject/topic/revision).
// One component means a change to how a test card renders lands in both.
function MocksRoute() {
  const { screen } = useGate();
  if (screen.testId) return <GateTestFlow />;
  return <GateTestList kinds={["full", "mixed", "weekly", "pyq"]}
    title="Mock Tests"
    description="Full-length and whole-paper tests under real GATE timing and marking. One attempt each - treat them like the exam." />;
}

function SubjectTestsRoute() {
  const { screen } = useGate();
  if (screen.testId) return <GateTestFlow />;
  return <GateTestList kinds={["subject", "topic", "revision"]}
    title="Subject & Topic Tests"
    description="Shorter, scoped tests to check one subject or one topic before you move on." />;
}

// ---------------- header ----------------

function GateHeader({ paper, papers, onSwitchPaper, completion, loading }) {
  const [picking, setPicking] = useState(false);
  if (!paper) return <CampusCard className="p-4"><CampusSkeleton height={70} /></CampusCard>;

  return (
    <div className="rounded-2xl p-5 sm:p-6" style={{ background: CAMPUS.chromeBg }}>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <GraduationCap size={15} style={{ color: CAMPUS.gold }} />
            <span className="text-[10px] font-mono tracking-widest" style={{ color: CAMPUS.goldTint }}>
              GATE PREPARATION{paper.syllabusVersion ? ` · ${paper.syllabusVersion.toUpperCase()}` : ""}
            </span>
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-white mb-1">{paper.name} - {paper.fullName}</h1>
          <p className="text-[12.5px] leading-relaxed max-w-2xl" style={{ color: "rgba(255,255,255,0.6)" }}>
            {paper.description}
          </p>
        </div>

        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          {papers.length > 1 && (
            <div className="relative">
              <button onClick={() => setPicking(p => !p)}
                className="text-[11.5px] font-mono font-semibold px-3 py-1.5 rounded-lg transition-colors"
                style={{ background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.18)" }}>
                Switch paper
              </button>
              {picking && (
                <>
                  <div onClick={() => setPicking(false)} className="fixed inset-0 z-10" />
                  <div className="absolute right-0 mt-1.5 z-20 rounded-xl overflow-hidden min-w-[220px]"
                    style={{ background: CAMPUS.surface, border: `1px solid ${CAMPUS.line}`, boxShadow: CAMPUS.shadowLg }}>
                    {papers.map(p => (
                      <button key={p.id} onClick={() => { setPicking(false); onSwitchPaper(p.id); }}
                        className="block w-full text-left px-3.5 py-2.5"
                        style={{
                          background: p.id === paper.id ? CAMPUS.tealTint : "transparent",
                          borderBottom: `1px solid ${CAMPUS.line}`,
                        }}>
                        <b className="block text-[12.5px]" style={{ color: p.id === paper.id ? CAMPUS.teal : CAMPUS.ink }}>{p.name}</b>
                        <span className="block text-[10.5px]" style={{ color: CAMPUS.inkFaint }}>{p.fullName}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
          {!loading && completion.total > 0 && (
            <span className="text-[11px] font-mono" style={{ color: "rgba(255,255,255,0.55)" }}>
              {completion.done} / {completion.total} topics done
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------- section nav ----------------

function GateSectionNav({ group, setGroup, sections, active, onSelect }) {
  return (
    <div className="space-y-2 sticky top-0 z-20 -mx-1 px-1 py-2 backdrop-blur"
      style={{ background: `color-mix(in srgb, ${CAMPUS.paper} 90%, transparent)` }}>
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
        {GATE_GROUPS.map(g => {
          const isActive = g.key === group;
          const Icon = g.icon;
          return (
            <button key={g.key} onClick={() => {
              setGroup(g.key);
              // Switching group lands on that group's first section rather than
              // showing a group whose sections don't include what's on screen -
              // otherwise the nav highlights nothing and looks broken.
              const first = GATE_SECTIONS.find(s => s.group === g.key);
              if (first && !GATE_SECTIONS.filter(s => s.group === g.key).some(s => s.key === active)) onSelect(first.key);
            }}
              className="flex items-center gap-1.5 text-[11.5px] font-mono font-semibold tracking-wide px-3 py-1.5 rounded-lg whitespace-nowrap flex-shrink-0 transition-colors"
              style={{
                background: isActive ? CAMPUS.chromeBg : CAMPUS.surface,
                color: isActive ? CAMPUS.chromeFg : CAMPUS.inkSoft,
                border: `1px solid ${isActive ? CAMPUS.chromeBg : CAMPUS.line}`,
              }}>
              <Icon size={12} /> {g.label.toUpperCase()}
            </button>
          );
        })}
      </div>
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
        {sections.map(s => {
          const isActive = s.key === active;
          const Icon = s.icon;
          return (
            <button key={s.key} onClick={() => onSelect(s.key)}
              aria-current={isActive ? "page" : undefined}
              className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-full whitespace-nowrap flex-shrink-0 transition-colors"
              style={{
                background: isActive ? CAMPUS.tealTint : CAMPUS.paper,
                border: `1px solid ${isActive ? CAMPUS.teal : CAMPUS.line}`,
                color: isActive ? CAMPUS.teal : CAMPUS.inkSoft,
              }}>
              <Icon size={12} /> {s.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Shared "you need to be signed in" and "nothing authored yet" states, so
// sixteen sections don't each invent their own wording for the same two
// situations.
export function GateSignInPrompt({ what = "your GATE progress" }) {
  return (
    <CampusEmptyState icon={GraduationCap} title="Sign in to continue"
      description={`Sign in to track ${what}. Your progress, attempts and notebook are tied to your DeVert account.`} />
  );
}

export function GateNoContent({ what, hint }) {
  return (
    <CampusEmptyState icon={Library} title={`No ${what} published yet`}
      description={hint || `Your ${what} bank is still being authored. Check back soon - a platform admin adds these from /admin.`} />
  );
}

export function GateSectionFooterLink({ label, onClick }) {
  return (
    <div className="pt-1">
      <CampusButton variant="ghost" size="sm" onClick={onClick}>{label}</CampusButton>
    </div>
  );
}
