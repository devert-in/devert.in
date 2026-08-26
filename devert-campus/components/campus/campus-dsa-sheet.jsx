"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronRight, ChevronDown, CheckCircle2, Circle, Bookmark, RotateCcw,
  Clock, ArrowRight, BookOpen, ListChecks, AlertTriangle, Building2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { CAMPUS } from "@/lib/campus-theme";
import { fetchSheets, fetchSheet, fetchSheetSections, buildSheet, nextUnsolved } from "@/lib/dsaSheets";
import { fetchPublishedProblems, fetchUserCodelabProgress } from "@/lib/codelab";
import { subscribeToProblemNotes } from "@/lib/problemNotes";
import {
  CampusCard, CampusButton, CampusEmptyState, CampusSkeleton,
  CampusProgressBar, CampusBreadcrumb,
} from "@/components/campus/campus-ui";
import { useCampusBackHandler } from "@/lib/campusNav";

// DSA Sheets - a curated, ordered curriculum rendered over the EXISTING problem
// set. See lib/dsaSheets.js's header for the "a sheet owns no problems and no
// progress" rule this UI depends on:
//
//  - every row's solved state comes from user_codelab_progress, so a problem
//    solved anywhere (DSA Practice, a contest, another sheet) is already ticked
//    here with no write of our own;
//  - every row's bookmark/revision state comes from lib/problemNotes.js, which
//    is per-problem and therefore already shared across sheets;
//  - opening a row hands off to the real CampusProblemView rather than
//    reimplementing a problem page.
//
// Consequence: adding Blind 75 or a company sheet needs no code in this file.

const DIFFICULTY_COLOR = { Easy: CAMPUS.good, Medium: CAMPUS.warn, Hard: CAMPUS.bad };

// RETURNING TO WHERE YOU LEFT.
//
// Opening a problem from a sheet row unmounts this whole component - the sheet
// and the problem view are sibling branches of one ternary in campus-app.jsx,
// not a stack. So without this, coming back gave you the right sheet with every
// section collapsed and the page scrolled to the top, which is the right place
// but not the place you were.
//
// sessionStorage rather than lifting the state into CampusWorkspace: it also
// survives a reload and a link opened in a second tab, which is exactly the
// case where this was reported. Per-tab and per-session by definition, so it
// never becomes stale cross-device state that has to be migrated or cleaned up.
function sheetStateKey(sheetId) {
  return `devert:dsa-sheet:${sheetId}`;
}

function loadSheetState(sheetId) {
  if (typeof window === "undefined") return { expanded: new Set(), scrollY: 0 };
  try {
    const parsed = JSON.parse(sessionStorage.getItem(sheetStateKey(sheetId)) || "null");
    return { expanded: new Set(parsed?.expanded || []), scrollY: parsed?.scrollY || 0 };
  } catch {
    return { expanded: new Set(), scrollY: 0 };
  }
}

function saveSheetState(sheetId, expanded, scrollY) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(sheetStateKey(sheetId), JSON.stringify({ expanded: [...expanded], scrollY }));
  } catch {
    // Private browsing or a full quota. Losing a scroll position is not worth
    // throwing over - the sheet still renders, just at the top.
  }
}

export function CampusDsaSheets({ onOpenProblem, onOpenConcept, hiddenIds }) {
  const [sheets, setSheets] = useState(null);
  const [pickedSheetId, setPickedSheetId] = useState(null);

  useEffect(() => { fetchSheets().then(setSheets).catch(() => setSheets([])); }, []);

  // Derived, not stored: a single sheet is the common case today, and it opens
  // directly rather than behind a picker that would be one card wide. Computing
  // it here avoids an effect that writes state back during the same commit.
  const openSheetId = pickedSheetId || (sheets?.length === 1 ? sheets[0].id : null);

  useCampusBackHandler(3, !!openSheetId && (sheets?.length || 0) > 1, () => setPickedSheetId(null));

  if (sheets === null) return <CampusCard className="p-5"><CampusSkeleton variant="rect" height={240} /></CampusCard>;
  if (sheets.length === 0) {
    return <CampusEmptyState icon={ListChecks} title="No sheets published yet"
      description="Curated DSA sheets will appear here. The full problem set is on the Problems tab." />;
  }

  if (openSheetId) {
    return (
      <SheetView key={openSheetId} sheetId={openSheetId}
        onOpenProblem={onOpenProblem} onOpenConcept={onOpenConcept} hiddenIds={hiddenIds}
        onBack={sheets.length > 1 ? () => setPickedSheetId(null) : null} />
    );
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {sheets.map(s => (
        <button key={s.id} onClick={() => setPickedSheetId(s.id)} className="text-left">
          <CampusCard hover className="p-5 h-full flex flex-col gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: CAMPUS.tealTint, color: CAMPUS.teal }}>
                <ListChecks size={18} />
              </div>
              <b className="text-[14.5px]" style={{ color: CAMPUS.ink }}>{s.title}</b>
            </div>
            {s.description && <p className="text-[12px]" style={{ color: CAMPUS.inkSoft }}>{s.description}</p>}
            <span className="text-[11.5px] mt-auto" style={{ color: CAMPUS.inkFaint }}>
              {s.sectionCount || 0} sections &middot; {s.problemCount || 0} problems
            </span>
          </CampusCard>
        </button>
      ))}
    </div>
  );
}

function SheetView({ sheetId, onBack, onOpenProblem, onOpenConcept, hiddenIds }) {
  const { user } = useAuth();
  const [sheet, setSheet] = useState(undefined);
  const [sections, setSections] = useState(null);
  const [problems, setProblems] = useState(null);
  const [progress, setProgress] = useState(null);
  const [notes, setNotes] = useState({});
  // Read once, in a lazy initializer rather than an effect. Safe against the
  // static export's prerender for a specific reason: everything below returns a
  // skeleton until `sheet` and `built` land from client-side Firestore reads,
  // so `expanded` is never rendered during hydration and cannot disagree with
  // the server's HTML. loadSheetState guards `window` for the prerender itself.
  //
  // A mount-time read is the whole story because SheetView is keyed by sheetId
  // upstream - picking a different sheet remounts this component rather than
  // reusing it, so there is no sheet change for this to have to react to.
  const [restored] = useState(() => loadSheetState(sheetId));
  const [expanded, setExpanded] = useState(restored.expanded);
  const didRestoreScrollRef = useRef(false);
  const scrollYRef = useRef(0);

  useEffect(() => {
    fetchSheet(sheetId).then(setSheet).catch(() => setSheet(null));
    fetchSheetSections(sheetId).then(setSections).catch(() => setSections([]));
    fetchPublishedProblems().then(setProblems).catch(() => setProblems([]));
  }, [sheetId]);

  // No synchronous setState for the signed-out case: `progress` simply stays
  // null, which buildSheet already treats as "nothing solved yet". A signed-out
  // visitor therefore sees the full roadmap with 0% progress, which is exactly
  // right for a public sheet.
  useEffect(() => {
    if (!user) return;
    fetchUserCodelabProgress(user.uid).then(setProgress).catch(() => setProgress({}));
  }, [user]);

  // Live, so ticking "needs revision" on a problem page is reflected here
  // without a refetch - the same subscription CampusPracticeList already uses.
  useEffect(() => {
    if (!user) return;
    return subscribeToProblemNotes(user.uid, map => setNotes(map || {}));
  }, [user]);

  const built = useMemo(
    () => (sections && problems ? buildSheet(sections, problems, progress, hiddenIds) : null),
    [sections, problems, progress, hiddenIds]);
  const next = useMemo(() => (built ? nextUnsolved(built) : null), [built]);

  const toggle = useCallback((id) => {
    setExpanded(prev => {
      const nextSet = new Set(prev);
      if (nextSet.has(id)) nextSet.delete(id); else nextSet.add(id);
      return nextSet;
    });
  }, []);

  // Tracked in a ref, not read off `window` in the cleanup below - by the time
  // that runs React may already have torn down the rows this page's height
  // depended on, which collapses the document and reports a scrollY of 0.
  useEffect(() => {
    const onScroll = () => { scrollYRef.current = window.scrollY; };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Written on the way out - the unmount IS the moment the learner opened a
  // problem, so there is nothing to throttle and no reason to write on every
  // scroll event.
  useEffect(() => {
    return () => saveSheetState(sheetId, expanded, scrollYRef.current);
  }, [sheetId, expanded]);

  // Once, after the rows actually exist - restoring before `built` lands would
  // scroll a page that is still one skeleton card tall and go nowhere.
  useEffect(() => {
    if (!built || didRestoreScrollRef.current) return;
    didRestoreScrollRef.current = true;
    if (restored.scrollY > 0) window.scrollTo(0, restored.scrollY);
  }, [built, restored]);

  if (sheet === undefined || !built) return <CampusCard className="p-5"><CampusSkeleton variant="rect" height={280} /></CampusCard>;
  if (sheet === null) {
    return <CampusEmptyState icon={AlertTriangle} color={CAMPUS.bad} title="Sheet not found"
      description="It may have been unpublished." />;
  }

  return (
    <div>
      {onBack && <CampusBreadcrumb items={[{ label: "Sheets", onClick: onBack }, { label: sheet.title }]} />}

      {/* Header: overall progress, difficulty split, and the one thing the
          learner actually wants - what to do next. */}
      <CampusCard className="p-5 mb-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold" style={{ color: CAMPUS.ink }}>{sheet.title}</h2>
            {sheet.description && <p className="text-[12.5px] mt-0.5" style={{ color: CAMPUS.inkSoft }}>{sheet.description}</p>}
          </div>
          <div className="text-right">
            <b className="block text-[22px] font-mono" style={{ color: CAMPUS.ink }}>{built.pct}%</b>
            <span className="text-[11.5px]" style={{ color: CAMPUS.inkFaint }}>{built.solved} / {built.total}</span>
          </div>
        </div>

        <div className="mt-3"><CampusProgressBar pct={built.pct} /></div>

        <div className="flex items-center gap-4 mt-3 flex-wrap">
          {["Easy", "Medium", "Hard"].map(d => (
            <span key={d} className="flex items-center gap-1.5 text-[12px]" style={{ color: CAMPUS.inkSoft }}>
              <span className="w-2 h-2 rounded-full" style={{ background: DIFFICULTY_COLOR[d] }} />
              {d} <b className="font-mono" style={{ color: CAMPUS.ink }}>{built.breakdown[d].solved}</b>
              <span style={{ color: CAMPUS.inkFaint }}>/{built.breakdown[d].total}</span>
            </span>
          ))}
          {built.estimatedMinutes > 0 && (
            <span className="flex items-center gap-1 text-[12px]" style={{ color: CAMPUS.inkFaint }}>
              <Clock size={11} /> ~{Math.round(built.estimatedMinutes / 60)}h remaining at full length
            </span>
          )}
        </div>

        {next ? (
          <div className="mt-4 pt-4 flex items-center justify-between gap-3 flex-wrap"
            style={{ borderTop: `1px solid ${CAMPUS.line}` }}>
            <div className="min-w-0">
              <p className="text-[10px] font-mono tracking-widest" style={{ color: CAMPUS.inkFaint }}>UP NEXT</p>
              <b className="block text-[13.5px] truncate" style={{ color: CAMPUS.ink }}>
                {next.problem.number ? `${next.problem.number}. ` : ""}{next.problem.title}
              </b>
              <span className="text-[11.5px]" style={{ color: CAMPUS.inkFaint }}>
                {next.section.title} &middot; {next.subsection.title}
              </span>
            </div>
            <CampusButton icon={ArrowRight} onClick={() => onOpenProblem?.(next.problem.id)}>Continue</CampusButton>
          </div>
        ) : built.total > 0 && (
          <p className="mt-4 pt-4 text-[13px]" style={{ borderTop: `1px solid ${CAMPUS.line}`, color: CAMPUS.good }}>
            Every problem in this sheet is solved. That is the whole roadmap.
          </p>
        )}
      </CampusCard>

      <div className="space-y-2">
        {built.sections.map(section => (
          <SectionRow key={section.id} section={section}
            open={expanded.has(section.id)} onToggle={() => toggle(section.id)}
            notes={notes} onOpenProblem={onOpenProblem} onOpenConcept={onOpenConcept} />
        ))}
      </div>
    </div>
  );
}

function SectionRow({ section, open, onToggle, notes, onOpenProblem, onOpenConcept }) {
  // A section with no problems but WITH a concept lesson is not empty - several
  // roadmap sections (Learn the Basics, Language Collections & STL, Advanced DP,
  // Segment Trees...) are deliberately lesson-only, because there is nothing to
  // solve there, only something to learn. Treating them as empty made them read
  // as "Coming soon" while a full lesson sat behind them, unreachable.
  const hasLesson = (section.conceptIds || []).length > 0 && !!onOpenConcept;
  const lessonOnly = section.total === 0 && hasLesson;
  const empty = section.total === 0 && !hasLesson;
  return (
    <CampusCard className="overflow-hidden">
      <button onClick={empty ? undefined : onToggle} aria-expanded={open}
        className="w-full text-left p-4 flex items-center gap-3" style={empty ? { opacity: 0.7 } : undefined}>
        {empty
          ? <Circle size={15} style={{ color: CAMPUS.inkFaint, flexShrink: 0 }} />
          : open ? <ChevronDown size={15} style={{ color: CAMPUS.teal, flexShrink: 0 }} />
            : <ChevronRight size={15} style={{ color: CAMPUS.inkFaint, flexShrink: 0 }} />}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <b className="text-[13.5px]" style={{ color: CAMPUS.ink }}>{section.title}</b>
            {section.solved === section.total && section.total > 0 && (
              <CheckCircle2 size={14} style={{ color: CAMPUS.good }} />
            )}
          </div>
          {section.blurb && <p className="text-[12px] mt-0.5" style={{ color: CAMPUS.inkFaint }}>{section.blurb}</p>}
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {empty ? (
            <span className="text-[11px]" style={{ color: CAMPUS.inkFaint }}>Coming soon</span>
          ) : lessonOnly ? (
            <span className="flex items-center gap-1.5 text-[11.5px] font-semibold" style={{ color: CAMPUS.purple }}>
              <BookOpen size={12} /> Lesson
            </span>
          ) : (
            <>
              <div className="hidden sm:block w-24"><CampusProgressBar pct={section.pct} /></div>
              <span className="text-[12px] font-mono tabular-nums" style={{ color: CAMPUS.inkSoft }}>
                {section.solved} / {section.total}
              </span>
            </>
          )}
        </div>
      </button>

      {open && !empty && (
        <div style={{ borderTop: `1px solid ${CAMPUS.line}` }}>
          {/* Concept-before-problems: if this section has a concept lesson, it is
              offered above the problem rows, not buried under them. */}
          {(section.conceptIds || []).length > 0 && onOpenConcept && (
            <div className="px-4 py-3 flex items-center gap-2 flex-wrap" style={{ background: CAMPUS.paper }}>
              <BookOpen size={13} style={{ color: CAMPUS.purple }} />
              <span className="text-[12px]" style={{ color: CAMPUS.inkSoft }}>
                {section.total > 0 ? "Learn the concept first:" : "This section is a lesson:"}
              </span>
              {section.conceptIds.map(cid => (
                <button key={cid} onClick={() => onOpenConcept(cid)}
                  className="text-[12px] font-semibold hover:underline" style={{ color: CAMPUS.purple }}>
                  {section.title}
                </button>
              ))}
            </div>
          )}

          {section.subsections.map(sub => (
            <div key={sub.id}>
              <div className="px-4 py-2 flex items-center justify-between gap-2"
                style={{ background: CAMPUS.paper, borderTop: `1px solid ${CAMPUS.line}` }}>
                <span className="text-[10px] font-mono tracking-widest"
                  style={{ color: DIFFICULTY_COLOR[sub.title] || CAMPUS.inkFaint }}>
                  {sub.title.toUpperCase()}
                </span>
                <span className="text-[11px] font-mono tabular-nums" style={{ color: CAMPUS.inkFaint }}>
                  {sub.solved} / {sub.total}
                </span>
              </div>
              {sub.rows.map(row => (
                <ProblemRow key={row.id} problem={row} note={notes[row.id]}
                  onOpen={() => onOpenProblem?.(row.id)} />
              ))}
            </div>
          ))}
        </div>
      )}
    </CampusCard>
  );
}

function ProblemRow({ problem, note, onOpen }) {
  const companies = problem.companies || [];
  return (
    <button onClick={onOpen} className="w-full text-left px-4 py-2.5 flex items-center gap-3"
      style={{ borderTop: `1px solid ${CAMPUS.line}` }}>
      {problem.solved
        ? <CheckCircle2 size={15} style={{ color: CAMPUS.good, flexShrink: 0 }} />
        : <Circle size={15} style={{ color: CAMPUS.inkFaint, flexShrink: 0 }} />}

      <span className="flex-1 min-w-0 text-[12.5px] truncate" style={{ color: CAMPUS.ink }}>
        {problem.number ? <span className="font-mono mr-1" style={{ color: CAMPUS.inkFaint }}>{problem.number}.</span> : null}
        {problem.title}
      </span>

      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Annotations come from problemNotes, so they are the same flags the
            problem page itself writes - no sheet-local duplicate. */}
        {note?.bookmarked && <Bookmark size={12} style={{ color: CAMPUS.teal }} />}
        {note?.needsRevision && <RotateCcw size={12} style={{ color: CAMPUS.warn }} />}
        {companies.length > 0 && (
          <span className="hidden lg:flex items-center gap-1 text-[11px]" style={{ color: CAMPUS.inkFaint }}>
            <Building2 size={10} />
            {companies.slice(0, 2).join(", ")}{companies.length > 2 ? ` +${companies.length - 2}` : ""}
          </span>
        )}
        <span className="text-[10.5px] font-mono w-14 text-right"
          style={{ color: DIFFICULTY_COLOR[problem.difficulty] || CAMPUS.inkFaint }}>
          {problem.difficulty}
        </span>
      </div>
    </button>
  );
}
