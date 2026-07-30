"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
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
import { SE_ACCENTS } from "@/lib/seCurriculum";
import { SE_ACCENT } from "@/components/se/se-lesson-blocks";
import {
  SeCard, SeChip, SeLabel, SeButton, SeProgressBar, SeStat,
  SeEmpty, SeLessonRow, SeTerminal,
} from "@/components/se/se-ui";
import { SeLessonReader } from "@/components/se/se-lesson";

// Software Engineering Fundamentals - the core-platform course shell.
//
// Three screens behind one static route: the roadmap (course overview), a module
// view, and the lesson reader. State lives in the query string
// (?module=&lesson=) rather than in dynamic route segments, because the app is a
// static export - the same approach /campus takes, for the same reason. A
// Suspense boundary around useSearchParams is required by the export
// prerenderer.

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

export function SeCourseApp() {
  const { user } = useAuth();
  const pathname = usePathname();
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
  // on a static export triggers a full segment fetch.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams();
    if (screen.moduleId) params.set("module", screen.moduleId);
    if (screen.lessonId) params.set("lesson", screen.lessonId);
    const qs = params.toString();
    window.history.replaceState(null, "", qs ? `${pathname}?${qs}` : pathname);
  }, [screen, pathname]);

  const go = useCallback((next) => {
    setScreen(next);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  const courseProgress = useMemo(() => computeProgress(tree, progress), [tree, progress]);

  if (tree === null) {
    return (
      <Shell>
        <div className="space-y-4">
          <SeCard className="p-6"><div className="h-24 animate-pulse rounded bg-white/[0.03]" /></SeCard>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[0, 1, 2, 3, 4, 5].map(i => (
              <SeCard key={i} className="p-5"><div className="h-28 animate-pulse rounded bg-white/[0.03]" /></SeCard>
            ))}
          </div>
        </div>
      </Shell>
    );
  }

  if (tree.length === 0) {
    return (
      <Shell>
        <SeEmpty icon={GraduationCap} title="The course is being set up"
          description="No modules have been published yet. A platform admin seeds the curriculum in one click from /admin - once that's done, the full course appears here."
          action={<Link href="/"><SeButton size="sm" variant="secondary">Back to Home</SeButton></Link>} />
      </Shell>
    );
  }

  const ctx = { tree, progress, courseProgress, go, screen, reloadProgress, user };

  return (
    <SeContext.Provider value={ctx}>
      <Shell>
        {screen.lessonId && screen.moduleId
          ? <SeLessonReader />
          : screen.moduleId
            ? <ModuleView />
            : <CourseRoadmap />}
      </Shell>
    </SeContext.Provider>
  );
}

function Shell({ children }) {
  return (
    <main className="min-h-screen pt-10 pb-32 px-5 sm:px-6 relative">
      <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none" />
      <div className="relative max-w-5xl mx-auto">{children}</div>
    </main>
  );
}

// ---------------- roadmap / course overview ----------------

function CourseRoadmap() {
  const { tree, progress, courseProgress, go, user } = useSe();
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
        <p className="font-mono text-xs mb-3 tracking-wider" style={{ color: `${SE_ACCENT.green}8C` }}>
          // /fundamentals - how_software_works.sh
        </p>
        <h1 className="font-sans font-bold tracking-tighter text-white leading-none mb-4"
          style={{ fontSize: "clamp(2rem,5.5vw,3.5rem)" }}>
          SOFTWARE ENGINEERING<br />
          <span style={{ color: SE_ACCENT.green }}>FUNDAMENTALS</span>
        </h1>
        <p className="text-[15px] leading-relaxed text-white/55 max-w-2xl">
          You can already write code. This is the course about everything <i className="text-white/75">around</i> the
          code - how a keystroke in a browser becomes a query on a database in another country, and back again, in a
          fifth of a second.
        </p>
        <p className="text-[13.5px] leading-relaxed text-white/35 max-w-2xl mt-3">
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
              style={{ background: `${SE_ACCENT.green}14`, color: SE_ACCENT.green }}>
              <Rocket size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <SeLabel className="mb-1">{resume ? "PICK UP WHERE YOU LEFT OFF" : "START HERE"}</SeLabel>
              <b className="text-[15px] text-white/90 block truncate">{(resume || next).lesson.title}</b>
              <span className="font-mono text-[11px] text-white/30">
                Module {(resume || next).moduleNumber} · {(resume || next).moduleTitle}
              </span>
            </div>
            <ArrowRight size={18} className="text-white/25 flex-shrink-0" />
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
            <b className="text-[14px] text-white/85 block mb-1">Read anything without signing in</b>
            <p className="text-[12.5px] text-white/40 leading-relaxed">
              The whole course is open. Sign in only if you want progress, XP and your notes saved.
            </p>
          </div>
          <Link href={`/login?next=${encodeURIComponent("/fundamentals")}`}>
            <SeButton size="sm">Sign in to track progress</SeButton>
          </Link>
        </SeCard>
      )}

      {/* search */}
      <div>
        <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <Search size={14} className="text-white/25 flex-shrink-0" />
          <input value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search the whole course - DNS, JWT, indexes, CORS..."
            className="flex-1 bg-transparent outline-none text-[13px] text-white/80 placeholder:text-white/25" />
          {query && (
            <button onClick={() => setQuery("")} className="text-white/25 hover:text-white/60 transition-colors">
              <XIcon size={14} />
            </button>
          )}
        </div>

        {query.trim() && (
          <SeCard className="mt-2.5 overflow-hidden">
            {results.length === 0 ? (
              <p className="p-4 text-[13px] text-white/40">
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
            <Compass size={14} style={{ color: SE_ACCENT.cyan }} />
            <SeLabel color={SE_ACCENT.cyan}>THE ROADMAP</SeLabel>
          </div>
          <p className="text-[13px] text-white/40 leading-relaxed mb-5 max-w-2xl">
            Modules run in a deliberate order - each one answers a question the previous one raises. Nothing is locked
            though: if you already know HTTP, skip straight to Authentication.
          </p>

          <div className="space-y-3">
            {tree.map(mod => (
              <ModuleCard key={mod.id} module={module} index={i}
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
            style={{ background: `${SE_ACCENT.red}14`, color: SE_ACCENT.red }}>
            <Video size={16} />
          </div>
          <div className="min-w-0">
            <b className="text-[13.5px] text-white/85 block mb-1">Video lessons are coming</b>
            <p className="text-[12.5px] leading-relaxed text-white/40">
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
  const accent = accentOf(mod);
  const authored = mod.lessons.filter(lessonHasContent).length;
  const done = stat?.completed || 0;
  const total = stat?.total || mod.lessons.length;

  return (
    <SeCard hover accent={accent} className="p-5 cursor-pointer" onClick={onOpen}>
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
            <b className="text-[15px] text-white/90">{mod.title}</b>
            {mod.estimatedHours > 0 && <SeChip color="rgba(255,255,255,0.25)">{mod.estimatedHours}H</SeChip>}
            {authored === 0 && <SeChip color="rgba(255,255,255,0.25)">NOT WRITTEN YET</SeChip>}
          </div>

          {mod.question && (
            <p className="text-[13.5px] italic leading-relaxed mb-2" style={{ color: `${accent}CC` }}>
              {mod.question}
            </p>
          )}
          {mod.description && (
            <p className="text-[12.5px] leading-relaxed text-white/40 mb-3">{mod.description}</p>
          )}

          <div className="flex items-center gap-3 font-mono text-[10.5px] text-white/25 mb-2.5 flex-wrap">
            <span>{total} lessons</span>
            {authored > 0 && authored < total && <span style={{ color: SE_ACCENT.orange }}>{authored} written</span>}
            {done > 0 && <span style={{ color: accent }}>{done} done</span>}
          </div>

          <SeProgressBar pct={stat?.pct || 0} color={accent} />
        </div>

        <ArrowRight size={16} className="text-white/20 flex-shrink-0 mt-1" />
      </div>
    </SeCard>
  );
}

// ---------------- module view ----------------

function ModuleView() {
  const { tree, progress, courseProgress, go, screen } = useSe();
  const mod = tree.find(m => m.id === screen.moduleId);

  if (!mod) {
    return (
      <SeEmpty icon={Layers} title="Module not found"
        description="This module has been removed or unpublished since your link was created."
        action={<SeButton size="sm" variant="secondary" onClick={() => go({ moduleId: null, lessonId: null })}>Back to the roadmap</SeButton>} />
    );
  }

  const accent = accentOf(mod);
  const stat = courseProgress.modules.find(m => m.moduleId === mod.id);
  const done = new Set(progress?.completedLessonIds || []);
  const moduleIndex = tree.findIndex(m => m.id === mod.id);
  const nextModule = tree[moduleIndex + 1] || null;

  return (
    <div className="space-y-6">
      <button onClick={() => go({ moduleId: null, lessonId: null })}
        className="inline-flex items-center gap-1.5 font-mono text-[11.5px] text-white/30 hover:text-white/60 transition-colors">
        <ChevronLeft size={13} /> the roadmap
      </button>

      <div>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center font-mono font-bold text-[17px] flex-shrink-0"
            style={{ background: `${accent}14`, border: `1px solid ${accent}33`, color: accent }}>
            {mod.number}
          </div>
          <div className="min-w-0">
            <SeLabel color={accent}>MODULE {mod.number}</SeLabel>
            <h1 className="text-2xl font-bold text-white/95">{mod.title}</h1>
          </div>
        </div>

        {mod.question && (
          <p className="text-[15px] italic leading-relaxed mb-3 max-w-2xl" style={{ color: `${accent}CC` }}>
            {mod.question}
          </p>
        )}
        {mod.description && (
          <p className="text-[13.5px] leading-relaxed text-white/45 max-w-2xl">{mod.description}</p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <SeStat label="Lessons" value={stat?.total || 0} icon={BookOpen} color={accent} />
        <SeStat label="Completed" value={stat?.completed || 0} icon={CheckCircle2} color={SE_ACCENT.green} />
        <SeStat label="Est. time" value={`${mod.estimatedHours || 0}h`} icon={Clock} color={SE_ACCENT.purple} />
      </div>

      <SeTerminal label={`module_${mod.number}/lessons`} accent={accent}>
        {mod.lessons.length === 0 ? (
          <p className="p-5 text-[13px] text-white/40">No lessons published in this module yet.</p>
        ) : (
          <div>
            {mod.lessons.map((lesson, i) => (
              <SeLessonRow key={lesson.id} lesson={lesson} index={i} accent={accent}
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
              <b className="text-[13.5px] text-white/85">
                Module {nextModule.number} · {nextModule.title}
              </b>
            </div>
            <ArrowRight size={15} className="text-white/25" />
          </div>
        </SeCard>
      )}
    </div>
  );
}
