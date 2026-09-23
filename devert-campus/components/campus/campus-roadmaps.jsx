"use client";

// Career Roadmaps - a GLOBAL, role/career-based catalog (ML Engineer, AI
// Scientist, VLSI Engineer, Cybersecurity Engineer, ...), NOT institution-
// scoped and NOT customized per college - every DeVert Campus user sees the
// identical set of roadmaps and identical content. See lib/roadmaps.js's
// header for the full data-model reasoning.
//
// Two entry points share everything below the outer chrome:
//   - CampusRoadmapsTab: the authenticated-workspace ?tab=roadmaps module,
//     structurally cloned from campus-cscore.jsx's CampusCsCoreTab (screen-
//     stack state, useCampusBackHandler, portaled sidebar).
//   - CampusRoadmapsRoute: the public, SEO-indexable /campus/roadmaps and
//     /campus/roadmaps/{slug} static routes (see app/campus/roadmaps/**),
//     wrapped in its own CampusThemeProvider - CampusApp's dispatch only
//     covers /campus/[slug]/**, and these are deliberate static SIBLINGS of
//     that dynamic route, not routed through it (see lib/roadmaps-seo.js's
//     header for why: a global, non-institution catalog belongs at a global
//     URL, never a per-college one).
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, useReducedMotion } from "framer-motion";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Rocket, Zap, Check, ListChecks, ArrowRight, Sparkles, Coins,
  ChevronDown, Search, X as XIcon, Loader2,
  BrainCircuit, Server, Layout, Layers, Cloud, BarChart3, Smartphone,
  ShieldAlert, CircuitBoard, Bot, Palette, Briefcase, FlaskConical,
  Code2, Compass, Route, Clock, AlertTriangle,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { CAMPUS } from "@/lib/campus-theme";
import {
  CampusCard, CampusChip, CampusButton, CampusBackButton, CampusEmptyState,
  CampusSkeleton, CampusProgressBar, CampusTabBar, LessonNavFooter,
  SidebarSectionLabel, SidebarBackLink, SidebarNavRow, SidebarTopicRow, SidebarModuleGroup,
} from "@/components/campus/campus-ui";
import { RoadmapFlowchart } from "@/components/campus/roadmap-flowchart";
import { CampusThemeProvider } from "@/components/campus/campus-theme-provider";
import { CampusPublicNav } from "@/components/campus/campus-public-nav";
import { campusPhotoBg } from "@/lib/campus-theme";
import { useCampusTheme } from "@/components/campus/campus-theme-provider";
import {
  fetchRoadmaps, fetchRoadmapBySlug, fetchRoadmapTree,
  fetchRoadmapProgress, fetchAllRoadmapProgress, markRoadmapTopicOpened, completeRoadmapTopic,
  roadmapProgressRef, roadmapCompletionPayload,
  groupModulesByLevel, computeRoadmapCompletion, recommendNextTopic,
  ROADMAP_LEVELS,
} from "@/lib/roadmaps";
import { activeCategories, categoryLabel, loadRoadmapTaxonomy, ROADMAP_TAXONOMY } from "@/lib/roadmapTaxonomy";
import { buildQuizSeedKey } from "@/lib/quizRandom";
import { fetchAttempt, submitQuizAttempt, attemptState } from "@/lib/quizAttempts";
import { GradedQuiz } from "@/components/campus/graded-quiz";
import { policyFor } from "@/lib/rewardPolicy";
import { LessonBody, InfoListCard, LessonProgressBar, useReadingProgress } from "@/components/campus/lesson-blocks";
import { useCampusBackHandler } from "@/lib/campusNav";

const LEVEL_COLOR = { beginner: CAMPUS.good, intermediate: CAMPUS.warn, advanced: CAMPUS.bad };

// A roadmap's `icon` field is a STRING NAME (e.g. "BrainCircuit"), never a
// component reference - a component cannot be written to Firestore at all.
// Resolved through this one whitelist map, the same single-source-of-truth
// discipline campus-cscore.jsx's subjectIcon()/language-logo.jsx already use,
// with a generic fallback for a name that isn't in the map (a typo in an
// admin form must never crash the page).
const ROADMAP_ICON_MAP = {
  BrainCircuit, Server, Layout, Layers, Cloud, BarChart3, Smartphone,
  ShieldAlert, CircuitBoard, Bot, Palette, Briefcase, FlaskConical, Code2,
};
export function roadmapIcon(name) {
  return ROADMAP_ICON_MAP[name] || Route;
}

// ---------------- Workspace entry ----------------

export function CampusRoadmapsTab({ sidebarSlot }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const slug = pathname.split("/").filter(Boolean)[0];

  const [screen, setScreen] = useState(() => {
    const roadmapId = searchParams.get("roadmap");
    if (!roadmapId) return { view: "list" };
    const topicId = searchParams.get("topic");
    return topicId ? { view: "topic", roadmapId, topicId } : { view: "detail", roadmapId };
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    let url = `/${slug}?tab=roadmaps`;
    if (screen.view === "detail") url += `&roadmap=${encodeURIComponent(screen.roadmapId)}`;
    else if (screen.view === "topic") url += `&roadmap=${encodeURIComponent(screen.roadmapId)}&topic=${encodeURIComponent(screen.topicId)}`;
    window.history.replaceState(null, "", url);
  }, [screen, slug]);

  useCampusBackHandler(2, screen.view !== "list", () => {
    if (screen.view === "topic") setScreen({ view: "detail", roadmapId: screen.roadmapId });
    else setScreen({ view: "list" });
  });

  const sidebar = sidebarSlot && createPortal(
    <RoadmapsSidebarList screen={screen}
      onSelectRoadmap={(roadmapId) => setScreen({ view: "detail", roadmapId })}
      onSelectTopic={(topicId) => setScreen({ view: "topic", roadmapId: screen.roadmapId, topicId })}
      onBackToList={() => setScreen({ view: "list" })} />,
    sidebarSlot
  );

  return (
    <>
      {sidebar}
      <RoadmapsScreens screen={screen} setScreen={setScreen} />
    </>
  );
}

// ---------------- Public / SEO entry ----------------

// Wraps its own CampusThemeProvider - see this file's header. Path-shaped
// URLs (/campus/roadmaps, /campus/roadmaps/{slug}), not the ?roadmap= query
// param the workspace tab above uses, so a search engine or a shared link
// resolves to real, distinct static pages per app/campus/roadmaps/**'s
// generateStaticParams.
export function CampusRoadmapsRoute({ initialRoadmapSlug = null }) {
  return (
    <CampusThemeProvider>
      <CampusRoadmapsPublicShell initialRoadmapSlug={initialRoadmapSlug} />
    </CampusThemeProvider>
  );
}

function CampusRoadmapsPublicShell({ initialRoadmapSlug }) {
  const { theme } = useCampusTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [screen, setScreen] = useState(() => {
    if (!initialRoadmapSlug) return { view: "list" };
    const topicId = searchParams.get("topic");
    return { view: initialRoadmapSlug ? "detail" : "list", roadmapSlug: initialRoadmapSlug, topicId: topicId || null };
  });
  // roadmapId is resolved once the roadmap loads (screens below key off id,
  // not slug, so progress/completion share the exact same code path as the
  // workspace tab) - see RoadmapDetail's own slug->id resolution.
  const [resolvedId, setResolvedId] = useState(null);

  const goToRoadmap = useCallback((roadmapId, slug) => {
    setResolvedId(roadmapId);
    setScreen({ view: "detail", roadmapSlug: slug, roadmapId });
    if (typeof window !== "undefined") window.history.pushState(null, "", `/roadmaps/${slug}`);
  }, []);

  const goToTopic = useCallback((topicId) => {
    setScreen((s) => ({ ...s, view: "topic", topicId }));
    if (typeof window !== "undefined" && screen.roadmapSlug) {
      window.history.pushState(null, "", `/roadmaps/${screen.roadmapSlug}?topic=${encodeURIComponent(topicId)}`);
    }
  }, [screen.roadmapSlug]);

  const goToList = useCallback(() => {
    setScreen({ view: "list" });
    if (typeof window !== "undefined") window.history.pushState(null, "", "/roadmaps");
  }, []);

  const routedScreen = screen.view === "detail"
    ? { view: "detail", roadmapId: resolvedId, roadmapSlug: screen.roadmapSlug }
    : screen.view === "topic"
      ? { view: "topic", roadmapId: resolvedId, roadmapSlug: screen.roadmapSlug, topicId: screen.topicId }
      : { view: "list" };

  return (
    <main data-theme={theme} style={{ ...campusPhotoBg(theme), minHeight: "100vh", colorScheme: theme }}
      className="campus-theme campus-square campus-photo-bg">
      <CampusPublicNav />
      <div className="max-w-6xl mx-auto px-6 py-8 pb-16">
        <RoadmapsScreens
          screen={routedScreen}
          setScreen={(next) => {
            if (next.view === "list") goToList();
            // Was calling setScreen(...) directly with the stale-closure
            // screen.roadmapSlug (undefined, since a click from the list
            // view has no roadmap open yet) instead of goToRoadmap - which
            // is the only thing that also sets resolvedId and pushes the
            // real /roadmaps/{slug} URL. routedScreen's own roadmapId comes
            // from resolvedId, not screen.roadmapId, so skipping goToRoadmap
            // left resolvedId null forever: RoadmapDetail got roadmapId=null
            // roadmapSlug=undefined and sat on its loading skeleton with no
            // error - clicking a card did something, but never opened it.
            else if (next.view === "detail") goToRoadmap(next.roadmapId, next.roadmapSlug);
            else goToTopic(next.topicId);
          }}
          onResolveRoadmap={(id) => setResolvedId(id)}
        />
      </div>
    </main>
  );
}

// ---------------- Shared screen router ----------------

function RoadmapsScreens({ screen, setScreen, onResolveRoadmap }) {
  if (screen.view === "detail") {
    return (
      <RoadmapDetail
        roadmapId={screen.roadmapId} roadmapSlug={screen.roadmapSlug}
        onBack={() => setScreen({ view: "list" })}
        onOpenTopic={(topicId) => setScreen({ view: "topic", roadmapId: screen.roadmapId, topicId })}
        onResolved={onResolveRoadmap}
      />
    );
  }
  if (screen.view === "topic") {
    return (
      <RoadmapTopicView
        roadmapId={screen.roadmapId} roadmapSlug={screen.roadmapSlug} topicId={screen.topicId}
        onBack={() => setScreen({ view: "detail", roadmapId: screen.roadmapId })}
        onOpenTopic={(topicId) => setScreen({ view: "topic", roadmapId: screen.roadmapId, topicId })}
      />
    );
  }
  return (
    <RoadmapsLanding
      onOpenRoadmap={(roadmapId, roadmapSlug) => setScreen({ view: "detail", roadmapId, roadmapSlug })}
    />
  );
}

// ---------------- Sidebar (workspace only) ----------------

function RoadmapsSidebarList({ screen, onSelectRoadmap, onSelectTopic, onBackToList }) {
  if (screen.view === "list") return <RoadmapsListSidebar onSelect={onSelectRoadmap} />;
  return <RoadmapsTreeSidebar key={screen.roadmapId} roadmapId={screen.roadmapId} activeTopicId={screen.topicId}
    onSelectTopic={onSelectTopic} onBackToList={onBackToList} />;
}

function RoadmapsListSidebar({ onSelect }) {
  const [roadmaps, setRoadmaps] = useState(null);
  useEffect(() => { fetchRoadmaps().then(setRoadmaps).catch(() => setRoadmaps([])); }, []);
  return (
    <>
      <SidebarSectionLabel>ROADMAPS</SidebarSectionLabel>
      {roadmaps === null ? <CampusSkeleton height={100} className="mx-1" /> : roadmaps.map((r) => (
        <SidebarNavRow key={r.id} label={r.title} icon={roadmapIcon(r.icon)} onClick={() => onSelect(r.id)} />
      ))}
    </>
  );
}

function RoadmapsTreeSidebar({ roadmapId, activeTopicId, onSelectTopic, onBackToList }) {
  const { user } = useAuth();
  const [tree, setTree] = useState(null);
  const [progress, setProgress] = useState(null);
  // First module (of the first level) open by default, plus whichever
  // module the active topic (if any) belongs to - same idiom
  // campus-aptitude.jsx's AptitudeSidebarList already used for its own
  // category accordion. Keyed by module id, not title - two levels can
  // legitimately share a module title (see groupModulesByLevel/
  // RoadmapTimeline's own moduleLabel comment), so a title-keyed Set would
  // open/close both at once.
  const [openModules, setOpenModules] = useState(new Set());
  useEffect(() => {
    fetchRoadmapTree(roadmapId).then(t => {
      setTree(t);
      const firstLevel = groupModulesByLevel(t).find(l => l.modules.length > 0);
      setOpenModules(new Set([firstLevel?.modules[0]?.id].filter(Boolean)));
    }).catch(() => setTree([]));
  }, [roadmapId]);
  useEffect(() => {
    if (!user) return;
    fetchRoadmapProgress(user.uid, roadmapId).then(setProgress).catch(() => setProgress(null));
  }, [user, roadmapId]);
  const byLevel = useMemo(() => (tree ? groupModulesByLevel(tree) : []), [tree]);
  const completedIds = useMemo(() => new Set(progress?.completedTopicIds || []), [progress]);
  const activeModuleId = useMemo(() => {
    for (const level of byLevel) {
      const m = level.modules.find(m => m.topics.some(t => t.id === activeTopicId));
      if (m) return m.id;
    }
    return undefined;
  }, [byLevel, activeTopicId]);
  const toggleModule = (id) => setOpenModules(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  return (
    <>
      <SidebarBackLink onClick={onBackToList}>All roadmaps</SidebarBackLink>
      {tree === null ? <CampusSkeleton height={140} className="mx-1" /> : byLevel.map((level) => level.modules.length > 0 && (
        <div key={level.key} className="mb-2">
          <div className="px-3 py-1 text-[9.5px] font-mono tracking-widest" style={{ color: LEVEL_COLOR[level.key] }}>{level.label.toUpperCase()}</div>
          {level.modules.map((m) => (
            <SidebarModuleGroup key={m.id} label={m.title.toUpperCase()}
              open={openModules.has(m.id) || m.id === activeModuleId} onToggle={() => toggleModule(m.id)}>
              {m.topics.map((t) => (
                <SidebarTopicRow key={t.id} label={t.title} active={activeTopicId === t.id}
                  done={completedIds.has(t.id)} onClick={() => onSelectTopic(t.id)} />
              ))}
            </SidebarModuleGroup>
          ))}
        </div>
      ))}
    </>
  );
}

// ---------------- Landing (list + filters) ----------------

const DURATION_BUCKETS = [
  { key: "all", label: "Any duration" },
  { key: "short", label: "Under 3 months", test: (w) => w < 13 },
  { key: "medium", label: "3-6 months", test: (w) => w >= 13 && w <= 26 },
  { key: "long", label: "6+ months", test: (w) => w > 26 },
];

// Pure, so the facet logic is a one-line swap later (server-side queries,
// per-domain index docs) without touching any component - see the project's
// Roadmaps build plan's evolution note.
function filterRoadmaps(roadmaps, { category, duration, query }) {
  let list = roadmaps;
  if (category && category !== "all") list = list.filter((r) => (r.categories || []).includes(category));
  if (duration && duration !== "all") {
    const bucket = DURATION_BUCKETS.find((b) => b.key === duration);
    if (bucket?.test) list = list.filter((r) => bucket.test(r.estimatedWeeks || 0));
  }
  if (query?.trim()) {
    const q = query.trim().toLowerCase();
    list = list.filter((r) =>
      r.title?.toLowerCase().includes(q) ||
      r.tagline?.toLowerCase().includes(q) ||
      (r.careerRoles || []).some((role) => role.toLowerCase().includes(q)) ||
      (r.tags || []).some((tag) => tag.toLowerCase().includes(q))
    );
  }
  return list;
}

function RoadmapsLanding({ onOpenRoadmap }) {
  const { user } = useAuth();
  const [roadmaps, setRoadmaps] = useState(null);
  const [allProgress, setAllProgress] = useState(null);
  const [category, setCategory] = useState("all");
  const [duration, setDuration] = useState("all");
  const [query, setQuery] = useState("");
  const [taxonomyReady, setTaxonomyReady] = useState(false);

  useEffect(() => { fetchRoadmaps().then(setRoadmaps).catch(() => setRoadmaps([])); }, []);
  useEffect(() => { loadRoadmapTaxonomy().finally(() => setTaxonomyReady(true)); }, []);
  useEffect(() => {
    if (!user || !roadmaps) return;
    fetchAllRoadmapProgress(user.uid, roadmaps).then(setAllProgress).catch(() => setAllProgress([]));
  }, [user, roadmaps]);

  const progressByRoadmap = useMemo(() => {
    const map = new Map();
    (allProgress || []).forEach((p) => map.set(p.roadmapId, p));
    return map;
  }, [allProgress]);

  const filtered = useMemo(() => roadmaps ? filterRoadmaps(roadmaps, { category, duration, query }) : [], [roadmaps, category, duration, query]);
  const categories = taxonomyReady ? activeCategories() : [];

  return (
    <div>
      <div className="mb-6">
        <p className="text-[10px] font-mono tracking-widest mb-2" style={{ color: CAMPUS.teal }}>// DEVERT CAMPUS</p>
        <h1 className="text-xl sm:text-2xl font-bold" style={{ color: CAMPUS.ink }}>Career Roadmaps</h1>
        <p className="text-[13px] mt-1.5 max-w-2xl" style={{ color: CAMPUS.inkSoft }}>
          Structured, level-by-level paths for real roles - not a syllabus for a subject, a plan for a job.
        </p>
      </div>

      <div className="relative mb-5">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: CAMPUS.inkFaint }} />
        <input value={query} onChange={(e) => setQuery(e.target.value)}
          placeholder="Search a role, technology or skill - ML Engineer, cybersecurity, VLSI..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl text-[13px]"
          style={{ background: CAMPUS.surface, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.ink }} />
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <FilterChip active={category === "all"} onClick={() => setCategory("all")}>All domains</FilterChip>
        {categories.map((c) => (
          <FilterChip key={c.key} active={category === c.key} onClick={() => setCategory(c.key)}>{c.label}</FilterChip>
        ))}
        <span className="w-px my-1" style={{ background: CAMPUS.line }} />
        {DURATION_BUCKETS.map((b) => (
          <FilterChip key={b.key} active={duration === b.key} onClick={() => setDuration(b.key)}>{b.label}</FilterChip>
        ))}
      </div>

      {roadmaps === null ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => <CampusSkeleton key={i} variant="rect" height={140} />)}
        </div>
      ) : filtered.length === 0 ? (
        <CampusEmptyState icon={Compass} title="No roadmaps match" description="Try a different search term or clear the filters." />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((r) => (
            <RoadmapCard key={r.id} roadmap={r} progress={progressByRoadmap.get(r.id)} onClick={() => onOpenRoadmap(r.id, r.slug)} />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({ active, onClick, children }) {
  return (
    <button onClick={onClick}
      className="text-[11.5px] font-medium px-3 py-1.5 rounded-full transition-colors"
      style={active
        ? { background: CAMPUS.teal, color: "#fff" }
        : { background: CAMPUS.surface, color: CAMPUS.inkSoft, border: `1px solid ${CAMPUS.line}` }}>
      {children}
    </button>
  );
}

function RoadmapCard({ roadmap, progress, onClick }) {
  const Icon = roadmapIcon(roadmap.icon);
  const total = progress ? (progress.total ?? null) : null;
  const completed = progress?.completedTopicIds?.length || 0;
  const pct = roadmap.topicCount > 0 ? Math.round((completed / roadmap.topicCount) * 100) : 0;
  return (
    <CampusCard as="a" href={`/roadmaps/${roadmap.slug}`} hover
      onClick={(e) => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return; e.preventDefault(); onClick(); }}
      className="p-4 block">
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: CAMPUS.tealTint }}>
          <Icon size={17} style={{ color: CAMPUS.teal }} />
        </div>
        <b className="text-[14px] truncate" style={{ color: CAMPUS.ink }}>{roadmap.title}</b>
      </div>
      <p className="text-[12px] leading-relaxed mb-3 line-clamp-2" style={{ color: CAMPUS.inkSoft }}>{roadmap.tagline}</p>
      <div className="flex items-center gap-2 flex-wrap mb-3">
        {(roadmap.categories || []).slice(0, 2).map((c) => (
          <CampusChip key={c} color={CAMPUS.inkFaint}>{categoryLabel(c)}</CampusChip>
        ))}
        {roadmap.estimatedWeeks && (
          <span className="text-[10.5px] font-mono flex items-center gap-1" style={{ color: CAMPUS.inkFaint }}>
            <Clock size={10} /> {roadmap.estimatedWeeks}w
          </span>
        )}
      </div>
      {progress && (
        <>
          <CampusProgressBar pct={pct} />
          <p className="text-[10.5px] mt-1" style={{ color: CAMPUS.inkFaint }}>{completed}/{roadmap.topicCount} topics</p>
        </>
      )}
    </CampusCard>
  );
}

// ---------------- Detail (Overview / Path) ----------------

function RoadmapDetail({ roadmapId, roadmapSlug, onBack, onOpenTopic, onResolved }) {
  const { user } = useAuth();
  const [roadmap, setRoadmap] = useState(null);
  const [tree, setTree] = useState(null);
  const [progress, setProgress] = useState(null);
  // Overview first: a roadmap detail page opens on what the track IS, not on a
  // 13-node graph. Path is one click away.
  const [tab, setTab] = useState("overview");

  useEffect(() => {
    let cancelled = false;
    const load = roadmapId ? fetchRoadmapWithTreeById(roadmapId) : fetchRoadmapWithTreeBySlug(roadmapSlug);
    load.then(({ roadmap: r, tree: t }) => {
      if (cancelled) return;
      setRoadmap(r);
      setTree(t);
      if (r && onResolved) onResolved(r.id);
    }).catch(() => { if (!cancelled) { setRoadmap(null); setTree([]); } });
    return () => { cancelled = true; };
  }, [roadmapId, roadmapSlug]);

  useEffect(() => {
    if (!user || !roadmap) return;
    fetchRoadmapProgress(user.uid, roadmap.id).then(setProgress).catch(() => setProgress(null));
  }, [user, roadmap]);

  if (!roadmap || tree === null) {
    return (
      <div>
        <CampusBackButton onClick={onBack} label="Back to Roadmaps" />
        <CampusSkeleton height={220} className="mt-4" />
      </div>
    );
  }

  const completion = computeRoadmapCompletion(tree, progress);
  const Icon = roadmapIcon(roadmap.icon);
  const started = completion.completed > 0 || !!progress?.startedAt;
  const next = recommendNextTopic(tree, progress);

  return (
    <div>
      <CampusBackButton onClick={onBack} label="Back to Roadmaps" />

      <div className="mt-4 mb-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: CAMPUS.tealTint, border: `1px solid ${CAMPUS.line}` }}>
              <Icon size={20} style={{ color: CAMPUS.teal }} />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold" style={{ color: CAMPUS.ink }}>{roadmap.title}</h1>
              <p className="text-[12.5px] mt-0.5" style={{ color: CAMPUS.inkSoft }}>{roadmap.tagline}</p>
            </div>
          </div>
          {next && (
            <CampusButton icon={started ? Rocket : Zap} onClick={() => onOpenTopic(next.topic.id)}>
              {started ? "Continue" : "Start Roadmap"}
            </CampusButton>
          )}
        </div>

        {started && completion.total > 0 && (
          <div className="mt-4">
            <CampusProgressBar pct={completion.pct} />
            <p className="text-[11px] mt-1" style={{ color: CAMPUS.inkFaint }}>{completion.completed} of {completion.total} topics completed</p>
          </div>
        )}
      </div>

      <CampusTabBar className="mb-5" value={tab} onChange={setTab} tabs={[
        { key: "overview", label: "Overview", icon: Compass },
        { key: "path", label: "Path", icon: Route },
      ]} />

      {tab === "overview" ? (
        <RoadmapOverview roadmap={roadmap} completion={completion} />
      ) : (
        // A connected node diagram (roadmap-flowchart.jsx), not an accordion -
        // one continuous path for the whole role with difficulty implied by
        // vertical position/colour, matching the reference point given
        // (roadmap.sh's own visual style) rather than three stacked lists
        // that read as separate roadmaps bolted together.
        <RoadmapFlowchart tree={tree} progress={progress} onOpenTopic={onOpenTopic} />
      )}
    </div>
  );
}

function RoadmapOverview({ roadmap, completion }) {
  return (
    <div className="space-y-4">
      <CampusCard className="p-5">
        {roadmap.summary
          ? <LessonBody text={roadmap.summary} />
          : <p className="text-[13px]" style={{ color: CAMPUS.inkSoft }}>{roadmap.tagline}</p>}
      </CampusCard>
      {roadmap.outcomes?.length > 0 && (
        <InfoListCard icon={Check} title="What you'll be able to do" items={roadmap.outcomes} color={CAMPUS.good} tint={CAMPUS.goodTint} checkItems />
      )}
      {roadmap.careerRoles?.length > 0 && (
        <InfoListCard icon={Briefcase} title="Career roles" items={roadmap.careerRoles} color={CAMPUS.teal} tint={CAMPUS.tealTint} />
      )}
      {roadmap.resources?.length > 0 && (
        <CampusCard className="p-5">
          <p className="text-[13px] font-semibold mb-3" style={{ color: CAMPUS.ink }}>Resources</p>
          <div className="space-y-2">
            {roadmap.resources.map((res, i) => (
              <a key={i} href={res.url} target="_blank" rel="noreferrer"
                className="flex items-center justify-between gap-2 p-2.5 rounded-lg" style={{ background: CAMPUS.paper }}>
                <span className="text-[12.5px]" style={{ color: CAMPUS.ink }}>{res.title}</span>
                {res.isFree && <CampusChip color={CAMPUS.good}>FREE</CampusChip>}
              </a>
            ))}
          </div>
        </CampusCard>
      )}
      {roadmap.attribution && (
        <p className="text-[10.5px] text-center" style={{ color: CAMPUS.inkFaint }}>{roadmap.attribution}</p>
      )}
    </div>
  );
}

async function fetchRoadmapWithTreeById(roadmapId) {
  const roadmaps = await fetchRoadmaps();
  const roadmap = roadmaps.find((r) => r.id === roadmapId) || null;
  const tree = roadmap ? await fetchRoadmapTree(roadmap.id) : [];
  return { roadmap, tree };
}
async function fetchRoadmapWithTreeBySlug(slug) {
  const roadmap = await fetchRoadmapBySlug(slug);
  const tree = roadmap ? await fetchRoadmapTree(roadmap.id) : [];
  return { roadmap, tree };
}

// ---------------- Topic reader ----------------

function RoadmapTopicView({ roadmapId, roadmapSlug, topicId, onBack, onOpenTopic }) {
  const { user } = useAuth();
  const [roadmap, setRoadmap] = useState(null);
  const [tree, setTree] = useState(null);
  const [topic, setTopic] = useState(null);
  const [moduleInfo, setModuleInfo] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [attempt, setAttempt] = useState(null);
  const [attemptLoaded, setAttemptLoaded] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [quizError, setQuizError] = useState("");
  const [completing, setCompleting] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);
  const [alreadyDone, setAlreadyDone] = useState(false);
  const [progress, setProgress] = useState(null);
  const articleRef = useRef(null);
  const readingPct = useReadingProgress(articleRef);
  const reduceMotion = useReducedMotion();

  const policy = policyFor("roadmaps", topic);
  const quizSeedKey = buildQuizSeedKey({ uid: user?.uid, scope: `roadmaps:${roadmapId}:${topicId}` });
  const quizScopeId = `${roadmapId}_${topicId}`;
  const hasQuiz = (topic?.mcqs || []).length > 0;

  useEffect(() => {
    let cancelled = false;
    setTopic(null); setQuizAnswers({}); setAttempt(null); setAttemptLoaded(false);
    setLastResult(null); setJustCompleted(false); setAlreadyDone(false);

    const load = roadmapId ? fetchRoadmapWithTreeById(roadmapId) : fetchRoadmapWithTreeBySlug(roadmapSlug);
    load.then(({ roadmap: r, tree: t }) => {
      if (cancelled || !r) return;
      setRoadmap(r);
      setTree(t);
      let found = null, foundModule = null;
      for (const m of t) {
        const hit = m.topics.find((x) => x.id === topicId);
        if (hit) { found = hit; foundModule = m; break; }
      }
      setTopic(found);
      setModuleInfo(foundModule);
      if (user) {
        markRoadmapTopicOpened(user.uid, r.id, foundModule?.level, foundModule?.id, topicId).catch(() => {});
        fetchRoadmapProgress(user.uid, r.id).then((p) => {
          if (cancelled) return;
          setProgress(p);
          setAlreadyDone(!!p?.completedTopicIds?.includes(topicId));
        }).catch(() => {});
        fetchAttempt(user.uid, "roadmaps", quizScopeId).then((a) => { if (!cancelled) { setAttempt(a); setAttemptLoaded(true); } }).catch(() => { if (!cancelled) setAttemptLoaded(true); });
      } else {
        setAttemptLoaded(true);
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [roadmapId, roadmapSlug, topicId, user]);

  const handleSubmitQuiz = async () => {
    if (!user || !topic || !roadmap) return;
    setSubmitting(true); setQuizError("");
    try {
      const res = await submitQuizAttempt({
        uid: user.uid,
        moduleKey: "roadmaps",
        scopeId: quizScopeId,
        mcqs: topic.mcqs || [],
        answers: quizAnswers,
        item: topic,
        progressRef: roadmapProgressRef(user.uid, roadmap.id),
        progressPayload: {
          completedIdField: "completedTopicIds",
          completedId: topicId,
          data: roadmapCompletionPayload(user.uid, roadmap.id, moduleInfo?.level, moduleInfo?.id, topicId),
        },
        activityId: quizScopeId,
        transactionType: "roadmap_topic_completed",
        sourceModule: "roadmaps",
      });
      setLastResult(res);
      if (res.status === "graded") {
        setJustCompleted(res.completed);
        if (res.completed) setAlreadyDone(true);
      }
      const fresh = await fetchAttempt(user.uid, "roadmaps", quizScopeId).catch(() => null);
      setAttempt(fresh);
    } catch (e) {
      setQuizError(e?.code === "permission-denied" ? "Your account is not allowed to record this attempt." : "Could not submit - " + (e?.message || "unknown error") + ".");
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplete = async () => {
    if (!user || !topic || !roadmap || completing) return;
    setCompleting(true);
    try {
      const isNew = await completeRoadmapTopic({
        uid: user.uid, roadmapId: roadmap.id, level: moduleInfo?.level, moduleId: moduleInfo?.id, topicId,
        xpReward: policy.xp, coinReward: policy.coins,
      });
      setAlreadyDone(true);
      setJustCompleted(isNew);
    } catch {
      // best-effort, matches every other module's reading-only complete button
    } finally {
      setCompleting(false);
    }
  };

  const nextTopicInfo = useMemo(() => {
    if (!tree) return null;
    const flat = tree.flatMap((m) => m.topics.map((t) => ({ topic: t, module: m })));
    const idx = flat.findIndex((x) => x.topic.id === topicId);
    if (idx === -1) return null;
    const prev = flat[idx - 1]?.topic || null;
    if (idx === flat.length - 1) return { done: true, prev };
    const current = flat[idx];
    const next = flat[idx + 1];
    return { prev, next: next.topic, crossesModule: next.module.id !== current.module.id, nextModuleTitle: next.module.title };
  }, [tree, topicId]);

  if (!topic) {
    return (
      <div>
        <CampusBackButton onClick={onBack} label="Back to Roadmap" />
        <CampusSkeleton height={300} className="mt-4" />
      </div>
    );
  }

  return (
    <div>
      <CampusBackButton onClick={onBack} label="Back to Roadmap" />
      <article ref={articleRef} className="mt-4 space-y-4">
        <LessonProgressBar pct={readingPct} />

        <div>
          <p className="text-[10px] font-mono tracking-widest mb-1.5" style={{ color: LEVEL_COLOR[moduleInfo?.level] || CAMPUS.teal }}>
            {(moduleInfo?.level || "").toUpperCase()} · {moduleInfo?.title}
          </p>
          <h1 className="text-xl font-bold" style={{ color: CAMPUS.ink }}>{topic.title}</h1>
          {topic.estimatedMinutes && (
            <span className="text-[11px] flex items-center gap-1 mt-1" style={{ color: CAMPUS.inkFaint }}>
              <Clock size={11} /> ~{topic.estimatedMinutes} min
            </span>
          )}
        </div>

        {topic.description && <p className="text-[13.5px] leading-relaxed" style={{ color: CAMPUS.inkSoft }}>{topic.description}</p>}
        {topic.whyItMatters && (
          <InfoListCard icon={Sparkles} title="Why it matters" items={[topic.whyItMatters]} color={CAMPUS.gold} tint={CAMPUS.goldTint} />
        )}
        {topic.concept && <LessonBody text={topic.concept} />}
        {topic.keyConcepts?.length > 0 && <InfoListCard icon={ListChecks} title="Key Concepts" items={topic.keyConcepts} color={CAMPUS.teal} tint={CAMPUS.tealTint} />}
        {topic.tools?.length > 0 && <InfoListCard icon={Code2} title="Tools & Technologies" items={topic.tools} color={CAMPUS.cyan} tint={CAMPUS.cyanTint} />}
        {topic.practiceExercises?.length > 0 && <InfoListCard icon={Zap} title="Practice" items={topic.practiceExercises} color={CAMPUS.warn} tint={CAMPUS.warnTint} />}
        {topic.commonMistakes?.length > 0 && <InfoListCard icon={AlertTriangle} title="Common Mistakes" items={topic.commonMistakes} color={CAMPUS.bad} tint={CAMPUS.badTint} />}
        {topic.realWorldApplications?.length > 0 && <InfoListCard icon={Compass} title="Where This Is Used" items={topic.realWorldApplications} color={CAMPUS.gold} tint={CAMPUS.goldTint} />}
        {topic.interviewRelevance && (
          <InfoListCard icon={Briefcase} title="In Interviews" items={[topic.interviewRelevance]} color={CAMPUS.purple} tint={CAMPUS.purpleTint} />
        )}
        {topic.resources?.length > 0 && (
          <CampusCard className="p-4">
            <p className="text-[12.5px] font-semibold mb-2.5" style={{ color: CAMPUS.ink }}>Resources</p>
            <div className="space-y-1.5">
              {topic.resources.map((res, i) => (
                <a key={i} href={res.url} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-2 text-[12.5px] p-2 rounded-lg" style={{ background: CAMPUS.paper, color: CAMPUS.ink }}>
                  {res.title} {res.isFree && <CampusChip color={CAMPUS.good}>FREE</CampusChip>}
                </a>
              ))}
            </div>
          </CampusCard>
        )}

        {hasQuiz ? (
          !attemptLoaded ? <CampusSkeleton height={140} /> : (
            <GradedQuiz
              mcqs={topic.mcqs} seedKey={quizSeedKey} answers={quizAnswers}
              onAnswer={(i, v) => setQuizAnswers((p) => ({ ...p, [i]: v }))}
              state={attemptState(attempt, policy)} policy={policy} result={lastResult}
              error={quizError} loading={false} submitting={submitting} onSubmit={handleSubmitQuiz}
              label="KNOWLEDGE CHECK" submitLabel="Submit" />
          )
        ) : (
          <CampusCard className="p-4 flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-[13px] font-semibold" style={{ color: CAMPUS.ink }}>{alreadyDone ? "Topic completed" : "Mark this topic complete"}</p>
              {!alreadyDone && (
                <p className="text-[11px] flex items-center gap-2 mt-0.5" style={{ color: CAMPUS.inkFaint }}>
                  <span className="flex items-center gap-1"><Zap size={11} /> +{policy.xp} XP</span>
                  <span className="flex items-center gap-1"><Coins size={11} /> +{policy.coins} coins</span>
                </p>
              )}
            </div>
            {alreadyDone ? (
              <CampusChip color={CAMPUS.good} icon={Check}>DONE</CampusChip>
            ) : (
              <CampusButton onClick={handleComplete} disabled={completing || !user}>
                {completing ? "Saving..." : "Complete Topic"}
              </CampusButton>
            )}
          </CampusCard>
        )}

        {justCompleted && (
          <motion.p initial={reduceMotion ? false : { opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.28 }}
            className="text-[12.5px] text-center px-3 py-2.5 rounded-lg flex items-center justify-center gap-2"
            style={{ background: CAMPUS.goodTint, color: CAMPUS.good }}>
            <Sparkles size={13} /> {lastResult?.xp > 0 ? "Nice work! XP and coins added." : "Topic completed - keep going."}
          </motion.p>
        )}

        <LessonNavFooter
          next={nextTopicInfo?.next ? { ...nextTopicInfo.next, groupLabel: nextTopicInfo.nextModuleTitle } : null}
          prev={nextTopicInfo?.prev ? { id: nextTopicInfo.prev.id, title: nextTopicInfo.prev.title } : null}
          crossesModule={nextTopicInfo?.crossesModule}
          done={!!nextTopicInfo?.done}
          onOpenTopic={onOpenTopic}
          onBack={onBack}
          endTitle="You've reached the end of this roadmap"
          endBody="Head back to review anything, or start another roadmap."
          endButtonLabel="Back to Roadmap"
        />
      </article>
    </div>
  );
}
