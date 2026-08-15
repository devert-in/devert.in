"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, useReducedMotion } from "framer-motion";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Rocket, Clock, Briefcase, ChevronDown, ChevronRight, ChevronLeft, TrendingUp,
  Check, Lightbulb, ListChecks, Target, BookOpen, Code2,
  AlertTriangle, Sparkles, Coins, Zap, ArrowRight, GraduationCap, Cpu,
  Database, Network, Puzzle, Ruler, CircuitBoard, Hammer, Blocks, Landmark,
  Cloud, Terminal, GitBranch, Plug, ShieldCheck, Calculator, Binary,
  ToggleLeft, Share2, Brain, LineChart, MessageSquare, Palette, PieChart,
  Layers, MemoryStick, ShieldAlert,
  Search, X as XIcon, CornerDownLeft, Loader2, Star, Building2, HelpCircle,
  Compass, Route, Globe,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { CAMPUS, tint } from "@/lib/campus-theme";
import {
  CampusCard, CampusChip, CampusButton, CampusBackButton, CampusEmptyState,
  CampusSkeleton, CampusProgressBar, CampusTabBar, RoadmapTimeline,
} from "@/components/campus/campus-ui";
import {
  fetchSubjects, fetchSubject, fetchTopics, fetchTopic,
  fetchSubjectProgress, fetchAllUserProgress, markTopicOpened, completeTopic,
  csCoreProgressRef, csCoreCompletionPayload,
  buildCsCoreSearchIndex,
} from "@/lib/csCore";
import { searchCampus, groupResults } from "@/lib/campusSearch";
import { buildQuizSeedKey } from "@/lib/quizRandom";
import { fetchAttempt, submitQuizAttempt, attemptState } from "@/lib/quizAttempts";
import { GradedQuiz } from "@/components/campus/graded-quiz";
import { policyFor } from "@/lib/rewardPolicy";
import {
  LessonBody, InfoListCard, CodeExampleBlock, LessonProgressBar, useReadingProgress,
} from "@/components/campus/lesson-blocks";
import { useCampusBackHandler } from "@/lib/campusNav";
import { CampusProblemView } from "@/components/campus/campus-practice";

const DIFF_COLOR = { Beginner: CAMPUS.good, Intermediate: CAMPUS.warn, Advanced: CAMPUS.bad };

// Subject badges are Lucide icons, not the free-text emoji admins can type
// into a subject's `icon` field - see the identical reasoning in
// campus-programming.jsx's LANGUAGE_ICONS. Matched by a substring of the
// subject name (lowercased) since these names are long/prose-like, not slugs
// ("System Design (Beginner)"), with a generic fallback for anything new.
const SUBJECT_ICONS = [
  ["operating system", Cpu],
  ["database", Database],
  ["computer networks", Network],
  ["object-oriented", Puzzle],
  ["software engineering", Ruler],
  ["organization", CircuitBoard],
  ["architecture", CircuitBoard],
  ["compiler", Hammer],
  ["design pattern", Blocks],
  ["system design", Landmark],
  ["cloud", Cloud],
  ["linux", Terminal],
  ["git & github", GitBranch],
  ["rest api", Plug],
  ["security fundamentals", ShieldCheck],
  ["aptitude", Calculator],
  ["theory of computation", Binary],
  ["digital logic", ToggleLeft],
  ["distributed systems", Share2],
  ["artificial intelligence", Brain],
  ["machine learning", LineChart],
  ["natural language", MessageSquare],
  ["computer graphics", Palette],
  ["data mining", PieChart],
  ["parallel computing", Layers],
  ["microprocessor", MemoryStick],
  ["cyber security", ShieldAlert],
];
export function subjectIcon(name) {
  const n = (name || "").toLowerCase();
  return (SUBJECT_ICONS.find(([key]) => n.includes(key)) || [null, BookOpen])[1];
}

function topicHasContent(topic) {
  return !!(topic?.concept?.trim() || topic?.keyPoints?.length || topic?.codeExample?.code?.trim());
}

// ---------------- Top-level screen router ----------------

export function CampusCsCoreTab({ sidebarSlot }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const slug = pathname.split("/").filter(Boolean)[1];

  // Read once on mount from ?subject=/?topic= - CampusWorkspace's own
  // URL-sync effect deliberately excludes the "csCore" tab (see its own
  // comment) so this self-owned effect below isn't clobbered, same
  // precedent as CampusManage owning its own deeper URL.
  const [screen, setScreen] = useState(() => {
    const subjectId = searchParams.get("subject");
    if (!subjectId) return { view: "list" };
    const topicId = searchParams.get("topic");
    return topicId ? { view: "topic", subjectId, topicId } : { view: "roadmap", subjectId };
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    let url = `/campus/${slug}?tab=csCore`;
    if (screen.view === "roadmap") url += `&subject=${encodeURIComponent(screen.subjectId)}`;
    else if (screen.view === "topic") url += `&subject=${encodeURIComponent(screen.subjectId)}&topic=${encodeURIComponent(screen.topicId)}`;
    window.history.replaceState(null, "", url);
  }, [screen, slug]);

  // See lib/campusNav.js - same registration as Programming's identical
  // screen-stack shape, so Back steps list<-roadmap<-topic instead of
  // immediately asking to leave Campus.
  useCampusBackHandler(2, screen.view !== "list", () => {
    if (screen.view === "topic") setScreen({ view: "roadmap", subjectId: screen.subjectId });
    else setScreen({ view: "list" });
  });

  const sidebar = sidebarSlot && createPortal(
    <CsCoreSidebarList screen={screen}
      onSelectSubject={(subjectId) => setScreen({ view: "roadmap", subjectId })}
      onSelectTopic={(topicId) => setScreen({ view: "topic", subjectId: screen.subjectId, topicId })}
      onBackToList={() => setScreen({ view: "list" })} />,
    sidebarSlot
  );

  if (screen.view === "roadmap") {
    return (
      <>
        {sidebar}
        <SubjectRoadmap subjectId={screen.subjectId}
          onBack={() => setScreen({ view: "list" })}
          onOpenTopic={(topicId) => setScreen({ view: "topic", subjectId: screen.subjectId, topicId })} />
      </>
    );
  }
  if (screen.view === "topic") {
    return (
      <>
        {sidebar}
        <TopicView subjectId={screen.subjectId} topicId={screen.topicId}
          onBack={() => setScreen({ view: "roadmap", subjectId: screen.subjectId })} />
      </>
    );
  }
  return (
    <>
      {sidebar}
      <CsCoreLanding
        onOpenSubject={(subjectId) => setScreen({ view: "roadmap", subjectId })}
        onOpenTopic={(subjectId, topicId) => setScreen({ view: "topic", subjectId, topicId })} />
    </>
  );
}

// Navigation Architecture 2.0 - CS Core's own sub-navigation, portaled into
// CampusContextSidebar's slot - same shape as Programming's sidebar (subject
// list on the landing screen, that subject's own topic tree once open), a
// second independent fetch of fetchTopics(subjectId) rather than threading
// state through SubjectRoadmap.
function CsCoreSidebarList({ screen, onSelectSubject, onSelectTopic, onBackToList }) {
  if (screen.view === "list") {
    return <CsCoreSubjectSidebar onSelect={onSelectSubject} />;
  }
  // Keyed by subjectId so switching subjects remounts this fresh - see the
  // identical comment on campus-programming.jsx's ProgrammingTopicSidebar.
  return <CsCoreTopicSidebar key={screen.subjectId} subjectId={screen.subjectId} activeTopicId={screen.topicId}
    onSelectTopic={onSelectTopic} onBackToList={onBackToList} />;
}

function CsCoreSubjectSidebar({ onSelect }) {
  const [subjects, setSubjects] = useState(null);
  useEffect(() => { fetchSubjects().then(setSubjects).catch(() => setSubjects([])); }, []);
  return (
    <>
      <div className="px-1 pb-2 mb-1 text-[10px] font-mono tracking-widest" style={{ color: CAMPUS.inkFaint }}>CS CORE</div>
      {subjects === null ? <CampusSkeleton height={100} className="mx-1" /> : subjects.map(subject => {
        const Icon = subjectIcon(subject.name);
        return (
          <button key={subject.id} onClick={() => onSelect(subject.id)}
            className="campus-btn flex items-start gap-2.5 px-3 py-2 rounded-lg text-left transition-all duration-150"
            style={{ color: CAMPUS.inkSoft }}>
            <Icon size={15} className="flex-shrink-0 mt-0.5" />
            <span className="text-[13px] font-medium leading-snug">{subject.name}</span>
          </button>
        );
      })}
    </>
  );
}

function CsCoreTopicSidebar({ subjectId, activeTopicId, onSelectTopic, onBackToList }) {
  const [topics, setTopics] = useState(null);
  useEffect(() => { fetchTopics(subjectId).then(setTopics).catch(() => setTopics([])); }, [subjectId]);
  const modules = useMemo(() => {
    if (!topics) return [];
    const byModule = []; const seen = new Map();
    topics.forEach(t => {
      const key = t.module || "General";
      if (!seen.has(key)) { seen.set(key, { module: key, topics: [] }); byModule.push(seen.get(key)); }
      seen.get(key).topics.push(t);
    });
    return byModule;
  }, [topics]);
  return (
    <>
      <button onClick={onBackToList} className="flex items-center gap-1 px-1 pb-2 mb-1 text-[11px] font-semibold" style={{ color: CAMPUS.inkFaint }}>
        <ChevronLeft size={12} /> All subjects
      </button>
      {topics === null ? <CampusSkeleton height={120} className="mx-1" /> : modules.map(({ module, topics: moduleTopics }) => (
        <div key={module} className="mb-1.5">
          <div className="px-3 py-1 text-[9.5px] font-mono tracking-widest truncate" style={{ color: CAMPUS.inkFaint }}>{module.toUpperCase()}</div>
          {moduleTopics.map(t => (
            <button key={t.id} onClick={() => onSelectTopic(t.id)}
              className="campus-btn w-full flex items-center px-3 py-1.5 rounded-lg text-left transition-all duration-150"
              style={{
                background: activeTopicId === t.id ? CAMPUS.gradientPrimary : "transparent",
                color: activeTopicId === t.id ? "#fff" : CAMPUS.inkSoft,
              }}>
              <span className="text-[12.5px] leading-snug">{t.title}</span>
            </button>
          ))}
        </div>
      ))}
    </>
  );
}

// ---------------- In-module search ----------------

// CS Core's own search field, on the landing screen.
//
// The sidebar's global search can already reach a CS Core lesson, but it is a
// module SWITCHER first - it competes 26 subjects against every language, GATE
// paper and DSA problem, and it matches on names only. This one is scoped to
// this module and searches each lesson's own vocabulary too (see
// buildCsCoreSearchIndex), which is what a student naming a concept - "deadlock",
// "normalization", "TCP" - actually needs.
//
// Ranking and grouping are searchCampus()/groupResults() from lib/campusSearch,
// deliberately not a second implementation: two search boxes on one platform that
// disagree about which result ranks first is a bug that only ever shows up in
// front of a student.
function CsCoreSearch({ onOpenSubject, onOpenTopic }) {
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);
  const wrapRef = useRef(null);

  // Built on first interaction, not on mount - a student who scrolls straight to
  // the subject grid never pays for 27 Firestore reads they didn't ask for.
  const ensureIndex = useCallback(async () => {
    if (index || loading) return;
    setLoading(true);
    try {
      setIndex(await buildCsCoreSearchIndex());
    } catch {
      setIndex([]);
    } finally {
      setLoading(false);
    }
  }, [index, loading]);

  const results = useMemo(() => searchCampus(index, query, { limit: 30 }), [index, query]);
  const groups = useMemo(() => groupResults(results), [results]);
  const flat = useMemo(() => groups.flatMap(g => g.items), [groups]);

  useEffect(() => { setActive(0); }, [query]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => { if (!wrapRef.current?.contains(e.target)) setOpen(false); };
    window.addEventListener("pointerdown", onDown);
    return () => window.removeEventListener("pointerdown", onDown);
  }, [open]);

  const choose = (item) => {
    if (!item) return;
    setOpen(false);
    setQuery("");
    if (item.topicId) onOpenTopic(item.subjectId, item.topicId);
    else onOpenSubject(item.subjectId);
  };

  const onKeyDown = (e) => {
    if (e.key === "Escape") { setOpen(false); inputRef.current?.blur(); return; }
    if (!flat.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActive(i => (i + 1) % flat.length); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive(i => (i - 1 + flat.length) % flat.length); }
    else if (e.key === "Enter") { e.preventDefault(); choose(flat[active]); }
  };

  const showDropdown = open && query.trim().length >= 2;

  return (
    <div ref={wrapRef} className="relative">
      <div className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl"
        style={{
          background: CAMPUS.surface,
          border: `1px solid ${open ? CAMPUS.teal : CAMPUS.line}`,
          boxShadow: open ? CAMPUS.shadow : "none",
          transition: "border-color 0.15s, box-shadow 0.15s",
        }}>
        {loading
          ? <Loader2 size={15} className="animate-spin flex-shrink-0" style={{ color: CAMPUS.teal }} />
          : <Search size={15} className="flex-shrink-0" style={{ color: CAMPUS.inkFaint }} />}
        <input
          ref={inputRef}
          value={query}
          onFocus={() => { setOpen(true); ensureIndex(); }}
          onChange={e => { setQuery(e.target.value); setOpen(true); ensureIndex(); }}
          onKeyDown={onKeyDown}
          placeholder="Search CS Core - a subject, a lesson, or a concept like deadlock or normalization..."
          aria-label="Search CS Core"
          className="flex-1 min-w-0 bg-transparent outline-none text-[13px]"
          style={{ color: CAMPUS.ink }}
        />
        {query && (
          <button onClick={() => { setQuery(""); inputRef.current?.focus(); }} aria-label="Clear search"
            className="flex-shrink-0" style={{ color: CAMPUS.inkFaint }}>
            <XIcon size={14} />
          </button>
        )}
      </div>

      {showDropdown && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-40 rounded-xl overflow-hidden"
          style={{
            background: CAMPUS.surface,
            border: `1px solid ${CAMPUS.line}`,
            boxShadow: CAMPUS.shadowLg,
            maxHeight: "min(65vh, 460px)",
            overflowY: "auto",
          }}>
          {loading && flat.length === 0 && (
            <p className="px-4 py-3 text-[12.5px]" style={{ color: CAMPUS.inkFaint }}>Searching every lesson...</p>
          )}

          {!loading && flat.length === 0 && (
            <div className="px-4 py-3.5">
              <p className="text-[12.5px]" style={{ color: CAMPUS.inkSoft }}>Nothing in CS Core matches &quot;{query.trim()}&quot;.</p>
              <p className="text-[11.5px] mt-1" style={{ color: CAMPUS.inkFaint }}>Try a subject (DBMS), a lesson (Deadlock), or a concept (ACID, OSI, indexing).</p>
            </div>
          )}

          {groups.map(group => (
            <div key={group.kind}>
              <p className="px-4 pt-3 pb-1 text-[9.5px] font-mono tracking-widest" style={{ color: CAMPUS.inkFaint }}>
                {group.kind === "Subject" ? "SUBJECTS" : "LESSONS"}
              </p>
              {group.items.map(item => {
                const i = flat.indexOf(item);
                const isActive = i === active;
                return (
                  <button key={item.id} onClick={() => choose(item)} onMouseEnter={() => setActive(i)}
                    className="w-full text-left px-4 py-2.5 flex items-start gap-2"
                    style={{ background: isActive ? CAMPUS.tealTint : "transparent" }}>
                    <div className="min-w-0 flex-1">
                      <span className="block text-[13px] font-medium truncate" style={{ color: isActive ? CAMPUS.teal : CAMPUS.ink }}>
                        {item.title}
                      </span>
                      {/* The route, not just the name - a student searching a concept
                          needs to learn which subject owns it, not only jump once. */}
                      <span className="flex items-center gap-1 flex-wrap mt-0.5">
                        {item.path.slice(1).map((seg, si) => (
                          <span key={si} className="flex items-center gap-1">
                            {si > 0 && <ChevronRight size={9} style={{ color: CAMPUS.inkFaint, flexShrink: 0 }} />}
                            <span className="text-[10.5px]" style={{ color: CAMPUS.inkFaint }}>{seg}</span>
                          </span>
                        ))}
                      </span>
                    </div>
                    {isActive && <CornerDownLeft size={12} className="flex-shrink-0 mt-1" style={{ color: CAMPUS.teal }} />}
                  </button>
                );
              })}
            </div>
          ))}

          {flat.length > 0 && (
            <p className="px-4 py-2 text-[10px] font-mono" style={{ borderTop: `1px solid ${CAMPUS.line}`, color: CAMPUS.inkFaint }}>
              up/down to move · enter to open · esc to close
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------- Landing ----------------

function CsCoreLanding({ onOpenSubject, onOpenTopic }) {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState(null);
  const [allProgress, setAllProgress] = useState([]);

  useEffect(() => {
    fetchSubjects().then(setSubjects).catch(() => setSubjects([]));
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchAllUserProgress(user.uid).then(setAllProgress).catch(() => setAllProgress([]));
  }, [user]);

  const progressBySubject = useMemo(() => {
    const map = {};
    allProgress.forEach(p => { map[p.subjectId] = p; });
    return map;
  }, [allProgress]);

  // Progress docs only carry the subject SLUG, so every place one is shown by
  // itself ("Continue learning", "Recently viewed") read "operating-systems"
  // rather than "Operating Systems" until this lookup existed.
  const subjectNameById = useMemo(() => {
    const map = {};
    (subjects || []).forEach(s => { map[s.id] = s.name; });
    return map;
  }, [subjects]);

  const continueEntry = useMemo(() => {
    const withOpen = allProgress.filter(p => p.lastOpenedTopicId && p.lastOpenedAt);
    withOpen.sort((a, b) => (b.lastOpenedAt?.seconds || 0) - (a.lastOpenedAt?.seconds || 0));
    return withOpen[0] || null;
  }, [allProgress]);

  const recentlyOpened = useMemo(() => {
    const withOpen = allProgress.filter(p => p.lastOpenedAt);
    withOpen.sort((a, b) => (b.lastOpenedAt?.seconds || 0) - (a.lastOpenedAt?.seconds || 0));
    return withOpen.slice(0, 4);
  }, [allProgress]);

  const totalCompleted = allProgress.reduce((sum, p) => sum + (p.completedTopicIds?.length || 0), 0);
  const subjectsStarted = allProgress.length;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl p-6 sm:p-8" style={{ background: CAMPUS.chromeBg }}>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={16} style={{ color: CAMPUS.gold }} />
          <span className="text-[11px] font-mono tracking-widest" style={{ color: CAMPUS.goldTint }}>CS CORE</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">Core Computer Science, interview-ready.</h1>
        <p className="text-[13px] leading-relaxed max-w-2xl" style={{ color: "rgba(255,255,255,0.65)" }}>
          Operating Systems, DBMS, Networks, and every other core CS subject asked in technical interviews -
          explained practically, not as textbook chapters, with real interview questions and mock tests built in.
        </p>
      </div>

      <CsCoreSearch onOpenSubject={onOpenSubject} onOpenTopic={onOpenTopic} />

      {continueEntry && (
        <CampusCard hover className="p-4 flex items-center gap-4 cursor-pointer"
          onClick={() => onOpenSubject(continueEntry.subjectId)}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: CAMPUS.tealTint, color: CAMPUS.teal }}>
            <Rocket size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-mono tracking-widest mb-0.5" style={{ color: CAMPUS.inkFaint }}>CONTINUE LEARNING</p>
            <b className="text-[14px]" style={{ color: CAMPUS.ink }}>Pick up where you left off in {subjectNameById[continueEntry.subjectId] || continueEntry.subjectId}</b>
          </div>
          <ArrowRight size={16} style={{ color: CAMPUS.inkFaint }} />
        </CampusCard>
      )}

      {recentlyOpened.length > 0 && (
        <div>
          <p className="text-[11px] font-mono tracking-widest mb-2.5" style={{ color: CAMPUS.inkFaint }}>RECENTLY VIEWED</p>
          <div className="flex gap-2.5 flex-wrap">
            {recentlyOpened.map(p => (
              <button key={p.id} onClick={() => onOpenSubject(p.subjectId)}
                className="text-[12.5px] font-semibold px-3.5 py-2 rounded-lg"
                style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.ink }}>
                {subjectNameById[p.subjectId] || p.subjectId}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <CampusCard hover className="p-4 cursor-pointer" onClick={() => onOpenSubject("operating-systems")}>
          <div className="flex items-center gap-2 mb-1.5">
            <GraduationCap size={16} style={{ color: CAMPUS.blue }} />
            <b className="text-[13.5px]" style={{ color: CAMPUS.ink }}>Fundamentals Path</b>
          </div>
          <p className="text-[12px]" style={{ color: CAMPUS.inkSoft }}>New to core CS? Start with Operating Systems - it underpins almost every other subject here.</p>
        </CampusCard>
        <CampusCard hover className="p-4 cursor-pointer" onClick={() => onOpenSubject("dbms")}>
          <div className="flex items-center gap-2 mb-1.5">
            <Briefcase size={16} style={{ color: CAMPUS.warn }} />
            <b className="text-[13.5px]" style={{ color: CAMPUS.ink }}>Interview Readiness Path</b>
          </div>
          <p className="text-[12px]" style={{ color: CAMPUS.inkSoft }}>OS, DBMS, Networks and OOP are the four subjects asked in almost every technical interview.</p>
        </CampusCard>
      </div>

      {user && allProgress.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
          <CampusCard className="p-4">
            <p className="text-[10px] font-mono tracking-widest mb-1" style={{ color: CAMPUS.inkFaint }}>TOPICS COMPLETED</p>
            <b className="text-2xl" style={{ color: CAMPUS.teal }}>{totalCompleted}</b>
          </CampusCard>
          <CampusCard className="p-4">
            <p className="text-[10px] font-mono tracking-widest mb-1" style={{ color: CAMPUS.inkFaint }}>SUBJECTS STARTED</p>
            <b className="text-2xl" style={{ color: CAMPUS.purple }}>{subjectsStarted}</b>
          </CampusCard>
        </div>
      )}

      <div>
        <p className="text-[11px] font-mono tracking-widest mb-2.5" style={{ color: CAMPUS.inkFaint }}>CORE SUBJECTS</p>
        {subjects === null ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[0, 1, 2].map(i => <CampusCard key={i} className="p-4"><CampusSkeleton height={90} /></CampusCard>)}
          </div>
        ) : subjects.length === 0 ? (
          <CampusEmptyState icon={Cpu} title="No subjects published yet" description="Check back soon - your Training & Placement Cell is setting this up." />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.map(subject => (
              <SubjectCard key={subject.id} subject={subject} progress={progressBySubject[subject.id]} onClick={() => onOpenSubject(subject.id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SubjectCard({ subject, progress, onClick }) {
  const completed = progress?.completedTopicIds?.length || 0;
  const total = subject.topicCount || 0;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  // Not a "component created during render" - subjectIcon() is a pure lookup
  // into a fixed table, always returning the SAME Lucide component reference
  // for a given subject name (see language-logo.jsx's identical pattern/comment).
  const Icon = subjectIcon(subject.name);

  return (
    <CampusCard hover className="p-4 cursor-pointer" onClick={onClick}>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: CAMPUS.tealTint, border: `1px solid ${CAMPUS.line}` }}>
          {/* eslint-disable-next-line react-hooks/static-components */}
          <Icon size={18} style={{ color: CAMPUS.teal }} />
        </div>
        <div className="min-w-0">
          <b className="text-[14px] block truncate" style={{ color: CAMPUS.ink }}>{subject.name}</b>
          <CampusChip color={DIFF_COLOR[subject.difficulty] || CAMPUS.inkFaint}>{subject.difficulty}</CampusChip>
        </div>
      </div>
      <p className="text-[11.5px] leading-relaxed mb-3" style={{ color: CAMPUS.inkSoft }}>{subject.placementRelevance}</p>
      <div className="flex items-center gap-3 text-[10.5px] font-mono mb-3" style={{ color: CAMPUS.inkFaint }}>
        <span className="flex items-center gap-1"><Clock size={11} /> {subject.estimatedDuration}</span>
        {total > 0 && <span>{total} topics</span>}
      </div>
      {total > 0 && (
        <>
          <CampusProgressBar pct={pct} />
          <p className="text-[10px] mt-1" style={{ color: CAMPUS.inkFaint }}>{completed}/{total} completed</p>
        </>
      )}
    </CampusCard>
  );
}

// ---------------- Subject screen (Overview + Roadmap) ----------------

// True when an admin has authored the subject-level introduction. Everything
// below degrades to the roadmap alone when this is false, so a subject that
// hasn't been written yet is never a broken screen - only a plainer one.
function subjectHasIntro(subject) {
  return !!(subject?.overview?.trim() || subject?.whyLearn?.length || subject?.whereUsed?.length);
}

function SubjectRoadmap({ subjectId, onBack, onOpenTopic }) {
  const { user } = useAuth();
  const [subject, setSubject] = useState(null);
  const [topics, setTopics] = useState(null);
  const [progress, setProgress] = useState(null);
  const [openModules, setOpenModules] = useState(new Set());
  // null until the subject loads, then resolved ONCE below. Deliberately not
  // derived per-render from `progress`: that arrives on a second round trip, so
  // a derived default would render Overview and then yank the student to
  // Roadmap a moment later. The hero's Continue button is what keeps defaulting
  // to Overview cheap for a returning student - it's one click either way.
  const [tab, setTab] = useState(null);

  useEffect(() => {
    fetchSubject(subjectId).then(s => {
      setSubject(s);
      setTab(subjectHasIntro(s) ? "overview" : "roadmap");
    }).catch(() => setSubject(null));
    fetchTopics(subjectId).then(list => {
      setTopics(list);
      setOpenModules(new Set([list[0]?.module].filter(Boolean)));
    }).catch(() => setTopics([]));
  }, [subjectId]);

  useEffect(() => {
    if (!user) return;
    fetchSubjectProgress(user.uid, subjectId).then(setProgress).catch(() => setProgress(null));
  }, [user, subjectId]);

  const modules = useMemo(() => {
    if (!topics) return [];
    const byModule = [];
    const seen = new Map();
    topics.forEach(t => {
      const key = t.module || "General";
      if (!seen.has(key)) { seen.set(key, { module: key, topics: [] }); byModule.push(seen.get(key)); }
      seen.get(key).topics.push(t);
    });
    return byModule;
  }, [topics]);

  const completedIds = new Set(progress?.completedTopicIds || []);
  const toggleModule = (m) => setOpenModules(prev => {
    const next = new Set(prev);
    if (next.has(m)) next.delete(m); else next.add(m);
    return next;
  });

  if (!subject || topics === null) {
    return (
      <div>
        <CampusBackButton onClick={onBack} label="Back to CS Core" />
        <CampusSkeleton height={200} className="mt-4" />
      </div>
    );
  }

  const completed = completedIds.size;
  const total = topics.length;
  // Not a "component created during render" - see subjectIcon()'s own comment above.
  const SubjIcon = subjectIcon(subject.name);
  const hasIntro = subjectHasIntro(subject);

  // The first unfinished topic, so "Continue" lands on work rather than on
  // something already ticked off. Falls back to whatever was last opened (a
  // student mid-way through a lesson they haven't completed), then to the start.
  const nextTopic = topics.find(t => !completedIds.has(t.id))
    || topics.find(t => t.id === progress?.lastOpenedTopicId)
    || topics[0];
  const started = completed > 0 || !!progress?.lastOpenedTopicId;

  return (
    <div>
      <CampusBackButton onClick={onBack} label="Back to CS Core" />

      <div className="mt-4 mb-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: CAMPUS.tealTint, border: `1px solid ${CAMPUS.line}` }}>
              {/* eslint-disable-next-line react-hooks/static-components */}
              <SubjIcon size={20} style={{ color: CAMPUS.teal }} />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold" style={{ color: CAMPUS.ink }}>{subject.name}</h1>
              <div className="flex items-center gap-2.5 flex-wrap mt-1">
                {subject.difficulty && <CampusChip color={DIFF_COLOR[subject.difficulty] || CAMPUS.inkFaint}>{subject.difficulty}</CampusChip>}
                {subject.estimatedDuration && (
                  <span className="text-[11px] font-mono flex items-center gap-1" style={{ color: CAMPUS.inkFaint }}>
                    <Clock size={11} /> {subject.estimatedDuration}
                  </span>
                )}
                {total > 0 && <span className="text-[11px] font-mono" style={{ color: CAMPUS.inkFaint }}>{total} lessons</span>}
                {subject.interviewImportance > 0 && <InterviewStars value={subject.interviewImportance} />}
              </div>
            </div>
          </div>
          {nextTopic && (
            <CampusButton icon={started ? Rocket : Zap} onClick={() => onOpenTopic(nextTopic.id)}>
              {started ? "Continue" : "Start learning"}
            </CampusButton>
          )}
        </div>

        {total > 0 && started && (
          <div className="mt-4">
            <CampusProgressBar pct={Math.round((completed / total) * 100)} />
            <p className="text-[11px] mt-1" style={{ color: CAMPUS.inkFaint }}>{completed} of {total} lessons completed</p>
          </div>
        )}
      </div>

      {hasIntro && (
        <CampusTabBar className="mb-5" value={tab || "roadmap"} onChange={setTab} tabs={[
          { key: "overview", label: "Overview", icon: Compass },
          { key: "roadmap", label: "Roadmap", icon: Route },
        ]} />
      )}

      {hasIntro && tab === "overview" ? (
        <SubjectOverview subject={subject} modules={modules} totalTopics={total}
          onStart={() => nextTopic && onOpenTopic(nextTopic.id)}
          onSeeRoadmap={() => setTab("roadmap")} />
      ) : total === 0 ? (
        <CampusEmptyState icon={Cpu} title="Roadmap coming soon" description={`${subject.name}'s topic list is being written - check back soon.`} />
      ) : (
        <RoadmapTimeline modules={modules} completedIds={completedIds} openModules={openModules}
          onToggleModule={toggleModule} onOpenTopic={onOpenTopic} topicHasContent={topicHasContent} />
      )}
    </div>
  );
}

// How heavily this subject is asked in interviews, 1-5. Lucide stars rather
// than the "★★★★★" text run, per the design system's no-emoji rule - and it
// stays legible at 12px in a chip row, which the glyph does not.
function InterviewStars({ value }) {
  const n = Math.max(0, Math.min(5, Math.round(value)));
  return (
    <span className="flex items-center gap-0.5" title={`Interview importance: ${n} of 5`}>
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} size={10.5}
          style={{ color: i <= n ? CAMPUS.gold : CAMPUS.line }}
          fill={i <= n ? "currentColor" : "none"} />
      ))}
    </span>
  );
}

// The subject introduction - what this subject is, why it's worth the six
// weeks, where it shows up in real software, and what the interview actually
// asks. It exists because every subject used to open directly onto an accordion
// of chapter names: fine if you already know what DBMS is, useless if the reason
// you're here is that you don't.
//
// Every section is individually optional. A subject with only `overview`
// authored renders one card, not a page of empty headings.
function SubjectOverview({ subject, modules, totalTopics, onStart, onSeeRoadmap }) {
  return (
    <div className="space-y-5">
      {subject.overview?.trim() && (
        <CampusCard className="p-5">
          <LessonBody text={subject.overview} />
        </CampusCard>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {subject.whyLearn?.length > 0 && (
          <InfoListCard icon={Target} title="Why learn this" items={subject.whyLearn} color={CAMPUS.teal} tint={CAMPUS.tealTint} />
        )}
        {subject.whereUsed?.length > 0 && (
          <InfoListCard icon={Globe} title="Where it's used" items={subject.whereUsed} color={CAMPUS.blue} tint={CAMPUS.blueTint} />
        )}
        {subject.skillsGained?.length > 0 && (
          <InfoListCard icon={Sparkles} title="Skills you'll gain" items={subject.skillsGained} color={CAMPUS.good} tint={CAMPUS.goodTint} checkItems />
        )}
        {subject.prerequisites?.length > 0 && (
          <InfoListCard icon={ListChecks} title="Before you start" items={subject.prerequisites} color={CAMPUS.purple} tint={CAMPUS.purpleTint} />
        )}
      </div>

      {/* Derived from the topics themselves, never authored twice - the path a
          student is promised here and the accordion they land on cannot drift. */}
      {modules.length > 0 && (
        <CampusCard className="p-5">
          <div className="flex items-center justify-between gap-3 mb-3.5 flex-wrap">
            <p className="text-[11px] font-mono tracking-widest flex items-center gap-1.5" style={{ color: CAMPUS.inkFaint }}>
              <Route size={12} /> YOUR LEARNING PATH
            </p>
            <button onClick={onSeeRoadmap} className="text-[11.5px] font-semibold flex items-center gap-1" style={{ color: CAMPUS.teal }}>
              See all {totalTopics} lessons <ArrowRight size={12} />
            </button>
          </div>
          <div className="space-y-2">
            {modules.map(({ module, topics: moduleTopics }, i) => (
              <div key={module} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 text-[11px] font-mono font-bold"
                  style={{ background: CAMPUS.tealTint, color: CAMPUS.teal }}>
                  {i + 1}
                </div>
                <span className="flex-1 text-[13px] min-w-0 truncate" style={{ color: CAMPUS.ink }}>{module}</span>
                <span className="text-[10.5px] font-mono flex-shrink-0" style={{ color: CAMPUS.inkFaint }}>
                  {moduleTopics.length} {moduleTopics.length === 1 ? "lesson" : "lessons"}
                </span>
              </div>
            ))}
          </div>
        </CampusCard>
      )}

      {(subject.interviewImportance > 0 || subject.topCompanies?.length > 0 || subject.interviewQuestions?.length > 0) && (
        <CampusCard className="p-5">
          <p className="text-[11px] font-mono tracking-widest mb-3.5 flex items-center gap-1.5" style={{ color: CAMPUS.warn }}>
            <Briefcase size={12} /> IN THE INTERVIEW
          </p>

          {subject.interviewImportance > 0 && (
            <div className="flex items-center gap-2.5 mb-3.5">
              <InterviewStars value={subject.interviewImportance} />
              <span className="text-[12.5px]" style={{ color: CAMPUS.inkSoft }}>
                {INTERVIEW_WEIGHT_LABEL[Math.round(subject.interviewImportance)] || ""}
              </span>
            </div>
          )}

          {subject.placementRelevance && (
            <p className="text-[12.5px] leading-relaxed mb-3.5" style={{ color: CAMPUS.inkSoft }}>{subject.placementRelevance}</p>
          )}

          {subject.topCompanies?.length > 0 && (
            <div className="mb-3.5">
              <p className="text-[10px] font-mono tracking-widest mb-2 flex items-center gap-1.5" style={{ color: CAMPUS.inkFaint }}>
                <Building2 size={11} /> ASKED AT
              </p>
              <div className="flex gap-1.5 flex-wrap">
                {subject.topCompanies.map(c => (
                  <span key={c} className="text-[11.5px] font-medium px-2.5 py-1 rounded-lg"
                    style={{ background: tint(CAMPUS.warn, 10), border: `1px solid ${CAMPUS.line}`, color: CAMPUS.ink }}>
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}

          {subject.interviewQuestions?.length > 0 && (
            <div>
              <p className="text-[10px] font-mono tracking-widest mb-2 flex items-center gap-1.5" style={{ color: CAMPUS.inkFaint }}>
                <HelpCircle size={11} /> QUESTIONS THAT ACTUALLY COME UP
              </p>
              <ul className="space-y-1.5">
                {subject.interviewQuestions.map((q, i) => (
                  <li key={i} className="flex items-start gap-2 text-[12.5px] leading-relaxed" style={{ color: CAMPUS.inkSoft }}>
                    <ChevronRight size={13} className="flex-shrink-0 mt-0.5" style={{ color: CAMPUS.warn }} />
                    <span>{q}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CampusCard>
      )}

      <CampusCard className="p-5 flex items-center justify-between gap-4 flex-wrap"
        style={{ background: CAMPUS.chromeBg, border: "none" }}>
        <div className="min-w-0">
          <b className="text-[14px] block" style={{ color: CAMPUS.chromeFg }}>Ready to start {subject.name}?</b>
          <p className="text-[12px] mt-0.5" style={{ color: "rgba(255,255,255,0.6)" }}>
            {totalTopics} lessons{subject.estimatedDuration ? ` · ${subject.estimatedDuration}` : ""} · XP and coins on every one you finish.
          </p>
        </div>
        <CampusButton icon={Zap} onClick={onStart}>Start learning</CampusButton>
      </CampusCard>
    </div>
  );
}

const INTERVIEW_WEIGHT_LABEL = {
  1: "Rarely asked - study it for depth, not for the interview.",
  2: "Occasionally asked, usually for specific roles.",
  3: "Regularly asked - worth being comfortable with.",
  4: "Asked in most technical interviews.",
  5: "Asked in almost every technical interview.",
};

// ---------------- Topic view ----------------

function TopicView({ subjectId, topicId, onBack }) {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [topic, setTopic] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  // The server's record of this (student, topic) quiz - null until loaded.
  // Replaces the old localStorage `submitted` flag entirely; see
  // lib/quizAttempts.js's header for the three bugs that flag caused.
  const [attempt, setAttempt] = useState(null);
  const [attemptLoaded, setAttemptLoaded] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  // Surfaces a failed quiz write instead of silently re-enabling the button.
  const [quizError, setQuizError] = useState("");
  const [practiceScreen, setPracticeScreen] = useState(() => {
    const problemId = searchParams.get("practiceProblem");
    return problemId ? { view: "problem", problemId } : { view: "list" };
  });
  const [completing, setCompleting] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);
  const [alreadyDone, setAlreadyDone] = useState(false);
  // Defaults closed - see campus-programming.jsx's identical field/reasoning.
  const [showGoingDeeper, setShowGoingDeeper] = useState(false);
  // Measured over the whole lesson article (concept + code + key points +
  // quiz + assignment), not just the prose - "80% through this lesson" has to
  // mean the lesson, or the bar hits 100% while a quiz is still unanswered.
  const articleRef = useRef(null);
  const readingPct = useReadingProgress(articleRef);
  const reduceMotion = useReducedMotion();

  // Same seed every render for this (student, topic) - shuffleQuizForAttempt
  // reproduces the identical question/option order on every refresh with
  // nothing to persist.
  const quizSeedKey = buildQuizSeedKey({ uid: user?.uid, scope: `${subjectId}:${topicId}` });
  const quizScopeId = `${subjectId}_${topicId}`;

  // Everything keyed to this topic is reset SYNCHRONOUSLY as topicId changes,
  // and every async result is discarded if the topic changed while it was in
  // flight. The previous version left `topic`, `alreadyDone` and the quiz flag
  // holding the PREVIOUS topic's values until each fetch resolved, so opening a
  // second topic briefly rendered the first topic's content, its "DONE" chip
  // and an already-unlocked completion button under the new topic's id.
  useEffect(() => {
    let cancelled = false;
    setTopic(null);
    setQuizAnswers({});
    setAttempt(null);
    setAttemptLoaded(false);
    setLastResult(null);
    setJustCompleted(false);
    setAlreadyDone(false);

    fetchTopic(subjectId, topicId)
      .then(t => { if (!cancelled) setTopic(t); })
      .catch(() => { if (!cancelled) setTopic(null); });

    if (user) {
      markTopicOpened(user.uid, subjectId, topicId).catch(() => {});
      fetchSubjectProgress(user.uid, subjectId)
        .then(p => { if (!cancelled) setAlreadyDone(!!p?.completedTopicIds?.includes(topicId)); })
        .catch(() => {});
      // The cross-device check. A tab opened on another machine loads the same
      // record and renders the quiz locked, instead of offering a submit button
      // that would be refused server-side anyway.
      fetchAttempt(user.uid, "cscore", quizScopeId)
        .then(a => { if (!cancelled) { setAttempt(a); setAttemptLoaded(true); } })
        .catch(() => { if (!cancelled) setAttemptLoaded(true); });
    } else {
      setAttemptLoaded(true);
    }

    return () => { cancelled = true; };
  }, [subjectId, topicId, user, quizScopeId]);

  // Submitting the quiz IS the completion for a topic that has one: it grades
  // server-side, moves XP per question, and marks the topic complete only if the
  // paper passes. There is no separate "Complete Topic" click to make afterwards
  // - that button was the thing paying full XP for a wrong paper.
  const handleSubmitQuiz = async () => {
    if (!user || !topic) return;
    setSubmitting(true);
    setQuizError("");
    try {
      const res = await submitQuizAttempt({
        uid: user.uid,
        moduleKey: "cscore",
        scopeId: quizScopeId,
        mcqs: topic.mcqs || [],
        answers: quizAnswers,
        item: topic,
        progressRef: csCoreProgressRef(user.uid, subjectId),
        progressPayload: {
          completedIdField: "completedTopicIds",
          completedId: topicId,
          data: csCoreCompletionPayload(user.uid, subjectId, topicId),
        },
        activityId: quizScopeId,
        transactionType: "cscore_topic_completed",
        sourceModule: "cscore",
      });
      setLastResult(res);
      if (res.status === "graded") {
        // completed, not passed - CS Core has no minimum score to advance (see
        // rewardPolicy.js's completionRequiresPass), only to earn XP.
        setJustCompleted(res.completed);
        if (res.completed) setAlreadyDone(true);
      }
      const fresh = await fetchAttempt(user.uid, "cscore", quizScopeId).catch(() => null);
      setAttempt(fresh);
    } catch (e) {
      console.error("cscore quiz submit failed", e);
      setQuizError(e?.code === "permission-denied"
        ? "Your account is not allowed to record this attempt."
        : "Could not submit - " + (e?.message || "unknown error") + ".");
    } finally {
      setSubmitting(false);
    }
  };

  // Reading-only topics (no authored quiz) keep the acknowledge-to-complete
  // flow, since there is nothing to grade.
  const handleComplete = async () => {
    if (!user) return;
    setCompleting(true);
    try {
      const isNew = await completeTopic({
        uid: user.uid, subjectId, topicId,
        xpReward: topic.xpReward || 25, coinReward: topic.coinReward || 10,
      });
      setJustCompleted(isNew);
      setAlreadyDone(true);
    } finally {
      setCompleting(false);
    }
  };

  // Depth 3 - one level deeper than the roadmap/topic screen-stack (depth 2)
  // this TopicView itself lives inside; see lib/campusNav.js.
  useCampusBackHandler(3, practiceScreen.view === "problem", () => setPracticeScreen({ view: "list" }));

  // Appends onto whatever the parent CampusCsCoreTab's own effect already
  // wrote (?tab=csCore&subject=&topic=) instead of rebuilding it here too.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (practiceScreen.view === "problem") url.searchParams.set("practiceProblem", practiceScreen.problemId);
    else url.searchParams.delete("practiceProblem");
    window.history.replaceState(null, "", `${url.pathname}${url.search}`);
  }, [practiceScreen]);

  if (practiceScreen.view === "problem") {
    return <CampusProblemView problemId={practiceScreen.problemId} onBack={() => setPracticeScreen({ view: "list" })} />;
  }

  if (!topic) {
    return (
      <div>
        <CampusBackButton onClick={onBack} label="Back to roadmap" />
        <CampusSkeleton height={300} className="mt-4" />
      </div>
    );
  }

  const hasContent = topicHasContent(topic);
  const mcqs = topic.mcqs || [];
  const hasQuiz = mcqs.length > 0;
  const policy = policyFor("cscore", topic);
  // Derived from the SERVER record, so a second device, a refresh, or a cleared
  // browser store all land on the same answer.
  const quizState = attemptState(attempt, policy);

  return (
    <div className="max-w-3xl">
      <CampusBackButton onClick={onBack} label="Back to roadmap" />

      <div className="mt-4 mb-5">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          {topic.difficulty && <CampusChip color={DIFF_COLOR[topic.difficulty] || CAMPUS.inkFaint}>{topic.difficulty}</CampusChip>}
          {topic.estimatedMinutes && <span className="text-[11px] flex items-center gap-1" style={{ color: CAMPUS.inkFaint }}><Clock size={11} /> ~{topic.estimatedMinutes} min</span>}
        </div>
        <h1 className="text-xl font-bold" style={{ color: CAMPUS.ink }}>{topic.title}</h1>
      </div>

      {!hasContent ? (
        <CampusEmptyState icon={BookOpen} title="This lesson is being written"
          description="Real content for this topic hasn't been published yet - check back soon, or ask your admin to add it via /admin." />
      ) : (
        <article ref={articleRef} className="space-y-5">
          <LessonProgressBar pct={readingPct} />

          {topic.whatYoullLearn?.length > 0 && (
            <InfoListCard icon={Target} title="What you'll learn" items={topic.whatYoullLearn} color={CAMPUS.teal} tint={CAMPUS.tealTint} />
          )}
          {topic.prerequisites?.length > 0 && (
            <InfoListCard icon={ListChecks} title="Prerequisites" items={topic.prerequisites} color={CAMPUS.purple} tint={CAMPUS.purpleTint} />
          )}

          {topic.concept && (
            <CampusCard className="p-5">
              <LessonBody text={topic.concept} />
            </CampusCard>
          )}

          {topic.codeExample?.code && <CodeExampleBlock codeExample={topic.codeExample} />}

          {topic.keyPoints?.length > 0 && (
            <InfoListCard icon={Lightbulb} title="Key Points" items={topic.keyPoints} color={CAMPUS.gold} tint={CAMPUS.goldTint} checkItems />
          )}
          {topic.commonMistakes?.length > 0 && (
            <InfoListCard icon={AlertTriangle} title="Common Mistakes" items={topic.commonMistakes} color={CAMPUS.bad} tint={CAMPUS.badTint} />
          )}
          {topic.realWorldApplications?.length > 0 && (
            <InfoListCard icon={Briefcase} title="Real-World Usage" items={topic.realWorldApplications} color={CAMPUS.blue} tint={CAMPUS.blueTint} />
          )}
          {topic.interviewTips?.length > 0 && (
            <InfoListCard icon={Sparkles} title="Interview Tips" items={topic.interviewTips} color={CAMPUS.warn} tint={CAMPUS.warnTint} />
          )}

          {topic.goingDeeper?.trim() && (
            <CampusCard className="p-0 overflow-hidden">
              <button onClick={() => setShowGoingDeeper(o => !o)} className="w-full flex items-center gap-2 p-4 text-left">
                <TrendingUp size={14} style={{ color: CAMPUS.purple, flexShrink: 0 }} />
                <span className="text-[13px] font-semibold flex-1" style={{ color: CAMPUS.ink }}>Going Deeper</span>
                <CampusChip color={CAMPUS.purple}>ADVANCED</CampusChip>
                <ChevronDown size={14} style={{ color: CAMPUS.inkFaint, transform: showGoingDeeper ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
              </button>
              {showGoingDeeper && (
                <div className="px-4 pb-4" style={{ borderTop: `1px solid ${CAMPUS.line}` }}>
                  <p className="text-xs leading-relaxed whitespace-pre-wrap pt-3.5" style={{ color: CAMPUS.inkSoft }}>{topic.goingDeeper}</p>
                </div>
              )}
            </CampusCard>
          )}

          {topic.practiceProblemIds?.length > 0 && (
            <div>
              <p className="text-[11px] font-mono tracking-widest mb-2.5" style={{ color: CAMPUS.inkFaint }}>PRACTICE EXERCISES</p>
              <div className="space-y-2">
                {topic.practiceProblemIds.map(pid => (
                  <CampusCard key={pid} hover className="p-3.5 flex items-center justify-between cursor-pointer"
                    onClick={() => setPracticeScreen({ view: "problem", problemId: pid })}>
                    <span className="text-[13px] font-medium flex items-center gap-2" style={{ color: CAMPUS.ink }}>
                      <Code2 size={14} style={{ color: CAMPUS.teal }} /> Solve on CodeLab
                    </span>
                    <ArrowRight size={14} style={{ color: CAMPUS.inkFaint }} />
                  </CampusCard>
                ))}
              </div>
            </div>
          )}

          {hasQuiz && (
            <GradedQuiz
              mcqs={mcqs}
              seedKey={quizSeedKey}
              answers={quizState.locked && quizState.lastAnswers ? quizState.lastAnswers : quizAnswers}
              onAnswer={(i, v) => setQuizAnswers(p => ({ ...p, [i]: v }))}
              state={quizState}
              policy={policy}
              result={lastResult}
              error={quizError}
              loading={!attemptLoaded}
              submitting={submitting}
              onSubmit={handleSubmitQuiz} />
          )}

          {topic.assignment && (
            <CampusCard className="p-4">
              <p className="text-[11px] font-mono tracking-widest mb-2 flex items-center gap-1.5" style={{ color: CAMPUS.purple }}>
                <ListChecks size={12} /> ASSIGNMENT
              </p>
              <p className="text-[13px]" style={{ color: CAMPUS.inkSoft }}>{topic.assignment}</p>
            </CampusCard>
          )}

          {/* A topic with a quiz has no separate "complete" action any more -
              submitting the quiz grades it, pays per question and marks it
              complete only if it passes. Keeping a second button here is exactly
              how a wrong paper used to bank the full topic reward. Reading-only
              topics still acknowledge completion, since there is nothing to
              grade. */}
          {!hasQuiz && (
            <CampusCard className="p-4 flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-[13px] font-semibold" style={{ color: CAMPUS.ink }}>
                  {alreadyDone ? "Topic completed" : "Mark this topic complete"}
                </p>
                {!alreadyDone && (
                  <p className="text-[11px] flex items-center gap-2 mt-0.5" style={{ color: CAMPUS.inkFaint }}>
                    <span className="flex items-center gap-1"><Zap size={11} /> +{topic.xpReward || 25} XP</span>
                    <span className="flex items-center gap-1"><Coins size={11} /> +{topic.coinReward || 10} coins</span>
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

          {hasQuiz && alreadyDone && (
            <CampusCard className="p-4 flex items-center justify-between flex-wrap gap-3">
              <p className="text-[13px] font-semibold" style={{ color: CAMPUS.ink }}>Topic completed</p>
              <CampusChip color={CAMPUS.good} icon={Check}>DONE</CampusChip>
            </CampusCard>
          )}

          {justCompleted && (
            <motion.p
              initial={reduceMotion ? false : { opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              className="text-[12.5px] text-center px-3 py-2.5 rounded-lg flex items-center justify-center gap-2"
              style={{ background: CAMPUS.goodTint, color: CAMPUS.good }}>
              <Sparkles size={13} /> {lastResult?.xp > 0 ? "Nice work! XP and coins added." : "Topic completed - review the ones you missed and keep going."}
            </motion.p>
          )}
        </article>
      )}
    </div>
  );
}
