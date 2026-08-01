"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight, BookOpen, CheckCircle2, ChevronLeft, Clock, Compass,
  GraduationCap, Layers, Rocket, Search, Trophy, Video, X as XIcon,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  fetchCourseTree, fetchProgress, computeProgress, nextLesson, resumePoint,
  lessonHasContent, searchLessons, flattenLessons,
} from "@/lib/softwareEngineering";
import { useKeyedFetch } from "@/lib/useKeyedFetch";
import { SE_ACCENTS, SE_ACCENT } from "@/lib/seCurriculum";
import {
  SeCard, SeChip, SeLabel, SeButton, SeProgressBar, SeStat,
  SeEmpty, SeLessonRow, SeTerminal, usePalette, useCampusAccent,
} from "@/components/se/se-ui";
import { SeLessonReader } from "@/components/se/se-lesson";
import { CAMPUS } from "@/lib/campus-theme";
import { useCampusBackHandler } from "@/lib/campusNav";

// Software Engineering Fundamentals - the core-platform course shell.
//
// Three screens behind one static route: the roadmap (course overview), a module
// view, and the lesson reader. State lives in the query string
// (?module=&lesson=) rather than in dynamic route segments, because the app is a
// static export - the same approach /campus takes, for the same reason. A
// Suspense boundary around useSearchParams is required by the export
// prerenderer.
//
// Also mounted a second place: DeVert Campus's "Fundamentals" tab
// (components/campus/campus-fundamentals.jsx) embeds this exact component
// inside a workspace that owns its OWN base route (/campus/{slug}) and its
// own sidebar/back-button chrome. `basePath`/`staticQuery` let the URL-sync
// effect below write the right URL in either context instead of always
// assuming the standalone /fundamentals route; `sidebarSlot`/
// `enableBackHandler` are no-ops unless Campus passes them in.

const SeContext = createContext(null);
export function useSe() {
  const ctx = useContext(SeContext);
  if (!ctx) throw new Error("useSe must be used inside the course shell.");
  return ctx;
}

function accentOf(mod) {
  return SE_ACCENTS[mod?.accent] || SE_ACCENT.green;
}

// ---------------- shell ----------------

export function SeCourseApp({ basePath = "/fundamentals", staticQuery = "", sidebarSlot, enableBackHandler = false, campusMode = false } = {}) {
  const { user } = useAuth();
  const searchParams = useSearchParams();

  const [screen, setScreen] = useState(() => ({
    moduleId: searchParams.get("module") || null,
    lessonId: searchParams.get("lesson") || null,
  }));

  // Both reads go through useKeyedFetch rather than a hand-rolled effect: it
  // keys stored data by what it was fetched FOR, so signing out reads as "no
  // progress" without a synchronous setState reset inside the effect body
  // (react-hooks/set-state-in-effect). See lib/useKeyedFetch.js.
  const [tree] = useKeyedFetch("course", () => fetchCourseTree(), { fallback: [] });
  const [progress, reloadProgress] = useKeyedFetch(user?.uid, () => fetchProgress(user.uid));

  // replaceState, not the router: these are sub-states of one page, not separate
  // history entries worth stepping through, and pushing through the Next router
  // on a static export triggers a full segment fetch. staticQuery carries
  // whatever query params the embedding route needs preserved alongside
  // module/lesson (Campus's own `?tab=fundamentals`) - see the file header.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(staticQuery);
    if (screen.moduleId) params.set("module", screen.moduleId);
    if (screen.lessonId) params.set("lesson", screen.lessonId);
    const qs = params.toString();
    window.history.replaceState(null, "", qs ? `${basePath}?${qs}` : basePath);
  }, [screen, basePath, staticQuery]);

  // Same depth-registry back button integration every other Campus tab with
  // its own drill-down uses (see lib/campusNav.js) - a no-op on the
  // standalone /fundamentals route, where enableBackHandler stays false and
  // nothing registers.
  useCampusBackHandler(2, enableBackHandler && !!screen.moduleId && !screen.lessonId, () => setScreen({ moduleId: null, lessonId: null }));
  useCampusBackHandler(3, enableBackHandler && !!screen.lessonId, () => setScreen({ moduleId: screen.moduleId, lessonId: null }));

  const go = useCallback((next) => {
    setScreen(next);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  const courseProgress = useMemo(() => computeProgress(tree, progress), [tree, progress]);
  const sidebar = sidebarSlot && createPortal(
    <SeSidebarModuleList tree={tree} screen={screen} progress={progress} onOpenModule={id => go({ moduleId: id, lessonId: null })}
      onOpenLesson={(moduleId, lessonId) => go({ moduleId, lessonId })} onBackToRoadmap={() => go({ moduleId: null, lessonId: null })} />,
    sidebarSlot
  );

  const skeletonBg = campusMode ? CAMPUS.line : "rgba(255,255,255,0.03)";

  // The provider wraps every branch below, not just the "tree loaded" one -
  // SeCard/SeEmpty/SeButton/etc. (se-ui.jsx) read campusMode off useSe()
  // internally now, and the loading/empty states below render those same
  // primitives before `tree` (and therefore courseProgress) exist yet.
  const ctx = { tree, progress, courseProgress, go, screen, reloadProgress, user, basePath, staticQuery, campusMode };

  return (
    <SeContext.Provider value={ctx}>
      {tree === null ? (
        <Shell campusMode={campusMode}>
          {sidebar}
          <div className="space-y-4">
            <SeCard className="p-6"><div className="h-24 animate-pulse rounded" style={{ background: skeletonBg }} /></SeCard>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[0, 1, 2, 3, 4, 5].map(i => (
                <SeCard key={i} className="p-5"><div className="h-28 animate-pulse rounded" style={{ background: skeletonBg }} /></SeCard>
              ))}
            </div>
          </div>
        </Shell>
      ) : tree.length === 0 ? (
        <Shell campusMode={campusMode}>
          {sidebar}
          <SeEmpty icon={GraduationCap} title="The course is being set up"
            description="No modules have been published yet. A platform admin seeds the curriculum in one click from /admin - once that's done, the full course appears here."
            action={<Link href="/"><SeButton size="sm" variant="secondary">Back to Home</SeButton></Link>} />
        </Shell>
      ) : (
        <Shell campusMode={campusMode}>
          {sidebar}
          {screen.lessonId && screen.moduleId
            ? <SeLessonReader />
            : screen.moduleId
              ? <ModuleView />
              : <CourseRoadmap />}
        </Shell>
      )}
    </SeContext.Provider>
  );
}

// Standalone /fundamentals is its own full page (own <main>, own vertical
// rhythm, the neon grid-bg decoration). Embedded in Campus, the tab content
// area (components/campus/campus-app.jsx's `flex-1 px-5 sm:px-8 py-6 ...`
// div) already supplies that page-level chrome - a second nested <main> plus
// its own min-h-screen/padding would double up padding and force an
// oversized scroll area, so campusMode renders a plain, unpadded wrapper.
function Shell({ children, campusMode }) {
  if (campusMode) {
    // No max-w/mx-auto here - campus-app.jsx's own tab content container
    // (`flex-1 px-5 sm:px-8 ...`) is already unconstrained for every other
    // dashboard-style Campus tab (OverviewTab, Programming, CS Core all fill
    // it), so adding a second, narrower centered box here on top of that
    // just produces lopsided-looking gutters instead of matching siblings.
    // The one place that genuinely wants a narrower reading width - the
    // lesson reader - already sets its own max-w-3xl (se-lesson.jsx),
    // independent of this wrapper.
    return <div className="relative">{children}</div>;
  }
  return (
    <main className="min-h-screen pt-10 pb-32 px-5 sm:px-6 relative">
      <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none" />
      <div className="relative max-w-5xl mx-auto">{children}</div>
    </main>
  );
}

// Sidebar module/lesson list portaled into Campus's CampusContextSidebar
// (see the file header) - same two-level list/detail pattern and CAMPUS
// token styling as CampusProgrammingTab's ProgrammingSidebarList, so
// Fundamentals reads as a sibling of Programming/CS Core rather than a
// bolted-on module. Renders nothing on the standalone /fundamentals route,
// where sidebarSlot is never provided.
function SeSidebarModuleList({ tree, screen, progress, onOpenModule, onOpenLesson, onBackToRoadmap }) {
  if (!tree || tree.length === 0) return null;

  if (!screen.moduleId) {
    return (
      <>
        <div className="px-1 pb-2 mb-1 text-[10px] font-mono tracking-widest" style={{ color: CAMPUS.inkFaint }}>FUNDAMENTALS</div>
        {tree.map(mod => (
          <button key={mod.id} onClick={() => onOpenModule(mod.id)}
            className="campus-btn flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all duration-150"
            style={{ color: CAMPUS.inkSoft }}>
            <span className="font-mono text-[10.5px] flex-shrink-0" style={{ color: CAMPUS.inkFaint }}>{mod.number}</span>
            <span className="text-[13px] font-medium truncate">{mod.title}</span>
          </button>
        ))}
      </>
    );
  }

  const mod = tree.find(m => m.id === screen.moduleId);
  if (!mod) return null;
  const done = new Set(progress?.completedLessonIds || []);

  return (
    <>
      <button onClick={onBackToRoadmap} className="flex items-center gap-1 px-1 pb-2 mb-1 text-[11px] font-semibold" style={{ color: CAMPUS.inkFaint }}>
        <ChevronLeft size={12} /> All modules
      </button>
      <div className="px-3 py-1 text-[9.5px] font-mono tracking-widest truncate" style={{ color: CAMPUS.inkFaint }}>MODULE {mod.number}</div>
      {mod.lessons.map(lesson => {
        const active = screen.lessonId === lesson.id;
        return (
          <button key={lesson.id} onClick={() => onOpenLesson(mod.id, lesson.id)}
            className="campus-btn w-full flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-left transition-all duration-150"
            style={{ background: active ? CAMPUS.gradientPrimary : "transparent", color: active ? "#fff" : CAMPUS.inkSoft }}>
            {done.has(lesson.id) && <CheckCircle2 size={11} className="flex-shrink-0" style={{ color: active ? "#fff" : CAMPUS.good }} />}
            <span className="text-[12.5px] truncate">{lesson.title}</span>
          </button>
        );
      })}
    </>
  );
}

// ---------------- roadmap / course overview ----------------

function CourseRoadmap() {
  const { tree, progress, courseProgress, go, user, basePath, staticQuery, campusMode } = useSe();
  const p = usePalette();
  const selfUrl = staticQuery ? `${basePath}?${staticQuery}` : basePath;
  const [query, setQuery] = useState("");

  const next = useMemo(() => nextLesson(tree, progress), [tree, progress]);
  const resume = useMemo(() => resumePoint(tree, progress), [tree, progress]);
  const results = useMemo(() => searchLessons(tree, query), [tree, query]);
  const allLessons = useMemo(() => flattenLessons(tree), [tree]);
  const authoredCount = allLessons.filter(lessonHasContent).length;
  const totalHours = tree.reduce((n, m) => n + (m.estimatedHours || 0), 0);

  return (
    <div className="space-y-7">
      {/* hero */}
      <div>
        <p className="font-mono text-xs mb-3 tracking-wider" style={{ color: campusMode ? p.primaryAccent : `${SE_ACCENT.green}8C` }}>
          // /fundamentals - how_software_works.sh
        </p>
        <h1 className="font-sans font-bold tracking-tighter leading-none mb-4"
          style={{ fontSize: "clamp(2rem,5.5vw,3.5rem)", color: campusMode ? p.ink : "#fff" }}>
          SOFTWARE ENGINEERING<br />
          <span style={{ color: p.primaryAccent }}>FUNDAMENTALS</span>
        </h1>
        <p className="text-[15px] leading-relaxed max-w-2xl" style={{ color: p.inkSoft }}>
          You can already write code. This is the course about everything <i style={{ color: p.ink }}>around</i> the
          code - how a keystroke in a browser becomes a query on a database in another country, and back again, in a
          fifth of a second.
        </p>
        <p className="text-[13.5px] leading-relaxed max-w-2xl mt-3" style={{ color: p.inkFaint }}>
          Not a React course. Not a Node course. The one that explains how the pieces connect, so that every framework
          you learn afterwards has somewhere to fit.
        </p>
      </div>

      {/* headline stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SeStat label="Modules" value={tree.length} icon={Layers} color={SE_ACCENT.cyan} />
        <SeStat label="Lessons" value={courseProgress.total} icon={BookOpen} color={SE_ACCENT.green}
          sub={authoredCount < courseProgress.total ? `${authoredCount} written so far` : "all written"} />
        <SeStat label="Est. time" value={`${totalHours}h`} icon={Clock} color={SE_ACCENT.purple} />
        <SeStat label="Your progress" value={`${courseProgress.pct}%`} icon={Trophy} color={SE_ACCENT.gold}
          sub={user ? `${courseProgress.completed} of ${courseProgress.total} done` : "sign in to track"} />
      </div>

      {/* continue / start */}
      {user && (resume || next) && (
        <SeCard hover accent={SE_ACCENT.green} className="p-5 cursor-pointer"
          onClick={() => {
            const target = resume || next;
            go({ moduleId: target.moduleId, lessonId: target.lesson.id });
          }}>
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${p.primaryAccent}14`, color: p.primaryAccent }}>
              <Rocket size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <SeLabel className="mb-1">{resume ? "PICK UP WHERE YOU LEFT OFF" : "START HERE"}</SeLabel>
              <b className="text-[15px] block truncate" style={{ color: p.ink }}>{(resume || next).lesson.title}</b>
              <span className="font-mono text-[11px]" style={{ color: p.inkFaint }}>
                Module {(resume || next).moduleNumber} · {(resume || next).moduleTitle}
              </span>
            </div>
            <ArrowRight size={18} className="flex-shrink-0" style={{ color: p.inkFainter }} />
          </div>
          {courseProgress.total > 0 && (
            <div className="mt-4">
              <SeProgressBar pct={courseProgress.pct} />
            </div>
          )}
        </SeCard>
      )}

      {!user && (
        <SeCard className="p-5 flex items-center gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <b className="text-[14px] block mb-1" style={{ color: p.ink }}>Read anything without signing in</b>
            <p className="text-[12.5px] leading-relaxed" style={{ color: p.inkFaint }}>
              The whole course is open. Sign in only if you want progress, XP and your notes saved.
            </p>
          </div>
          <Link href={`/login?next=${encodeURIComponent(selfUrl)}`}>
            <SeButton size="sm">Sign in to track progress</SeButton>
          </Link>
        </SeCard>
      )}

      {/* search */}
      <div>
        <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl"
          style={{ background: campusMode ? CAMPUS.surface : "rgba(255,255,255,0.03)", border: `1px solid ${p.cardBorder}` }}>
          <Search size={14} className="flex-shrink-0" style={{ color: p.inkFainter }} />
          <input value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search the whole course - DNS, JWT, indexes, CORS..."
            className="flex-1 bg-transparent outline-none text-[13px]" style={{ color: p.inkSoft }} />
          {query && (
            <button onClick={() => setQuery("")} style={{ color: p.inkFainter }}>
              <XIcon size={14} />
            </button>
          )}
        </div>

        {query.trim() && (
          <SeCard className="mt-2.5 overflow-hidden">
            {results.length === 0 ? (
              <p className="p-4 text-[13px]" style={{ color: p.inkFaint }}>
                Nothing matches &quot;{query.trim()}&quot;.
              </p>
            ) : (
              <>
                <SeLabel className="px-4 pt-3.5 pb-1">{results.length} MATCHING LESSON{results.length === 1 ? "" : "S"}</SeLabel>
                {results.slice(0, 12).map(l => (
                  <SeLessonRow key={`${l.moduleId}/${l.id}`} lesson={l} showModule
                    done={!!progress?.completedLessonIds?.includes(l.id)}
                    hasContent={lessonHasContent(l)}
                    onClick={() => go({ moduleId: l.moduleId, lessonId: l.id })} />
                ))}
              </>
            )}
          </SeCard>
        )}
      </div>

      {/* the roadmap */}
      {!query.trim() && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Compass size={14} style={{ color: p.primaryAccent }} />
            <SeLabel color={SE_ACCENT.cyan}>THE ROADMAP</SeLabel>
          </div>
          <p className="text-[13px] leading-relaxed mb-5 max-w-2xl" style={{ color: p.inkFaint }}>
            Modules run in a deliberate order - each one answers a question the previous one raises. Nothing is locked
            though: if you already know HTTP, skip straight to Authentication.
          </p>

          <div className="space-y-3">
            {tree.map(mod => (
              <ModuleCard key={mod.id} mod={mod}
                stat={courseProgress.modules.find(m => m.moduleId === mod.id)}
                onOpen={() => go({ moduleId: mod.id, lessonId: null })} />
            ))}
          </div>
        </div>
      )}

      {/* video note */}
      <SeCard className="p-5">
        <div className="flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: `${useCampusAccent(SE_ACCENT.red)}14`, color: useCampusAccent(SE_ACCENT.red) }}>
            <Video size={16} />
          </div>
          <div className="min-w-0">
            <b className="text-[13.5px] block mb-1" style={{ color: p.ink }}>Video lessons are coming</b>
            <p className="text-[12.5px] leading-relaxed" style={{ color: p.inkFaint }}>
              Every lesson has a video slot already built in. The written lessons are complete and stand on their own -
              nothing is waiting on the recordings. As the DeVert series covers each topic, the video appears in place
              with chapters and a transcript.
            </p>
          </div>
        </div>
      </SeCard>
    </div>
  );
}

function ModuleCard({ mod, stat, onOpen }) {
  const { campusMode } = useSe();
  const p = usePalette();
  const rawAccent = accentOf(mod);
  const accent = useCampusAccent(rawAccent);
  const orangeAccent = useCampusAccent(SE_ACCENT.orange);
  const authored = mod.lessons.filter(lessonHasContent).length;
  const done = stat?.completed || 0;
  const total = stat?.total || mod.lessons.length;

  return (
    <SeCard hover accent={rawAccent} className="p-5 cursor-pointer" onClick={onOpen}>
      <div className="flex items-start gap-4">
        {/* module number badge */}
        <div className="flex flex-col items-center gap-2 flex-shrink-0">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center font-mono font-bold text-[15px]"
            style={{ background: `${accent}14`, border: `1px solid ${accent}33`, color: accent }}>
            {mod.number}
          </div>
          {stat?.isComplete && <CheckCircle2 size={14} style={{ color: accent }} />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <b className="text-[15px]" style={{ color: p.ink }}>{mod.title}</b>
            {mod.estimatedHours > 0 && <SeChip>{mod.estimatedHours}H</SeChip>}
            {authored === 0 && <SeChip>NOT WRITTEN YET</SeChip>}
          </div>

          {mod.question && (
            <p className="text-[13.5px] italic leading-relaxed mb-2" style={{ color: campusMode ? accent : `${accent}CC` }}>
              {mod.question}
            </p>
          )}
          {mod.description && (
            <p className="text-[12.5px] leading-relaxed mb-3" style={{ color: p.inkFaint }}>{mod.description}</p>
          )}

          <div className="flex items-center gap-3 font-mono text-[10.5px] mb-2.5 flex-wrap" style={{ color: p.inkFainter }}>
            <span>{total} lessons</span>
            {authored > 0 && authored < total && <span style={{ color: orangeAccent }}>{authored} written</span>}
            {done > 0 && <span style={{ color: accent }}>{done} done</span>}
          </div>

          <SeProgressBar pct={stat?.pct || 0} color={rawAccent} />
        </div>

        <ArrowRight size={16} className="flex-shrink-0 mt-1" style={{ color: p.inkFainter }} />
      </div>
    </SeCard>
  );
}

// ---------------- module view ----------------

function ModuleView() {
  const { tree, progress, courseProgress, go, screen, campusMode } = useSe();
  const p = usePalette();
  const mod = tree.find(m => m.id === screen.moduleId);
  const accent = useCampusAccent(mod ? accentOf(mod) : null);

  if (!mod) {
    return (
      <SeEmpty icon={Layers} title="Module not found"
        description="This module has been removed or unpublished since your link was created."
        action={<SeButton size="sm" variant="secondary" onClick={() => go({ moduleId: null, lessonId: null })}>Back to the roadmap</SeButton>} />
    );
  }

  const stat = courseProgress.modules.find(m => m.moduleId === mod.id);
  const done = new Set(progress?.completedLessonIds || []);
  const moduleIndex = tree.findIndex(m => m.id === mod.id);
  const nextModule = tree[moduleIndex + 1] || null;

  return (
    <div className="space-y-6">
      <button onClick={() => go({ moduleId: null, lessonId: null })}
        className="inline-flex items-center gap-1.5 font-mono text-[11.5px] transition-colors"
        style={{ color: p.inkFaint }}>
        <ChevronLeft size={13} /> the roadmap
      </button>

      <div>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center font-mono font-bold text-[17px] flex-shrink-0"
            style={{ background: `${accent}14`, border: `1px solid ${accent}33`, color: accent }}>
            {mod.number}
          </div>
          <div className="min-w-0">
            <SeLabel color={accentOf(mod)}>MODULE {mod.number}</SeLabel>
            <h1 className="text-2xl font-bold" style={{ color: p.ink }}>{mod.title}</h1>
          </div>
        </div>

        {mod.question && (
          <p className="text-[15px] italic leading-relaxed mb-3 max-w-2xl" style={{ color: campusMode ? accent : `${accent}CC` }}>
            {mod.question}
          </p>
        )}
        {mod.description && (
          <p className="text-[13.5px] leading-relaxed max-w-2xl" style={{ color: p.inkFaint }}>{mod.description}</p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <SeStat label="Lessons" value={stat?.total || 0} icon={BookOpen} color={accentOf(mod)} />
        <SeStat label="Completed" value={stat?.completed || 0} icon={CheckCircle2} color={SE_ACCENT.green} />
        <SeStat label="Est. time" value={`${mod.estimatedHours || 0}h`} icon={Clock} color={SE_ACCENT.purple} />
      </div>

      <SeTerminal label={`module_${mod.number}/lessons`} accent={accentOf(mod)}>
        {mod.lessons.length === 0 ? (
          <p className="p-5 text-[13px]" style={{ color: p.inkFaint }}>No lessons published in this module yet.</p>
        ) : (
          <div>
            {mod.lessons.map((lesson, i) => (
              <SeLessonRow key={lesson.id} lesson={lesson} index={i} accent={accentOf(mod)}
                done={done.has(lesson.id)} hasContent={lessonHasContent(lesson)}
                onClick={() => go({ moduleId: mod.id, lessonId: lesson.id })} />
            ))}
          </div>
        )}
      </SeTerminal>

      {nextModule && (
        <SeCard hover accent={accentOf(nextModule)} className="p-4 cursor-pointer"
          onClick={() => go({ moduleId: nextModule.id, lessonId: null })}>
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <SeLabel className="mb-1">UP NEXT</SeLabel>
              <b className="text-[13.5px]" style={{ color: p.inkSoft }}>
                Module {nextModule.number} · {nextModule.title}
              </b>
            </div>
            <ArrowRight size={15} style={{ color: p.inkFainter }} />
          </div>
        </SeCard>
      )}
    </div>
  );
}
