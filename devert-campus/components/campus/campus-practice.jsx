"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, Send, RotateCcw, Copy, Lightbulb, CheckCircle2, CircleDot, XCircle, Monitor, Code2,
  Search, Eye, EyeOff, ChevronUp, ChevronDown, GripHorizontal, Terminal, History, PartyPopper,
  Coins, Flame, ArrowRight, RefreshCw, Clock, MemoryStick, ListChecks, Check, Youtube, AlertTriangle,
  Star, Bookmark, Tag, MoreVertical, CalendarClock, StickyNote, Repeat, X, Gauge, Building2,
} from "lucide-react";

// Fallback labels only - a problem's own solutions.brute/better/optimal.title
// (set by whoever authors it) always wins when present.
const SOLUTION_APPROACHES = ["brute", "better", "optimal"];
const SOLUTION_LABELS = { brute: "Brute Force", better: "Better", optimal: "Optimal" };

// Whether this problem has ANY "teach it like a beginner" enrichment field
// set (see admin/page.jsx's "SIMPLE EXPLANATION" panel) - none of these are
// required, so most not-yet-enriched problems render none of this and fall
// straight through to the original statement, unchanged.
function hasSimpleExplanation(problem) {
  return !!(problem.simpleExplanation || problem.realWorldAnalogy || problem.visualWalkthrough?.length
    || problem.dryRun || problem.bruteForceIntuition || problem.optimizedIntuition
    || problem.timeComplexityPlain || problem.spaceComplexityPlain || problem.interviewTip || problem.keyObservation);
}

function SimpleExplanationBlock({ title, text, icon: Icon }) {
  return (
    <div>
      <p className="text-[10px] font-mono tracking-widest mb-1 flex items-center gap-1" style={{ color: CAMPUS.inkFaint }}>
        {Icon && <Icon size={10} />} {title.toUpperCase()}
      </p>
      <p className="text-xs leading-relaxed whitespace-pre-wrap" style={{ color: CAMPUS.inkSoft }}>{text}</p>
    </div>
  );
}
import { useAuth } from "@/context/AuthContext";
import {
  fetchPublishedProblems, fetchProblem, fetchSampleTests, subscribeToCodelabProgress,
  fetchAttemptedProblemIds, fetchProblemSubmissions, fetchAllSubmissionsForUser, runCode, submitCode,
  fetchCodeDraft, saveCodeDraft, computeSubmissionStatsByProblem,
  acceptanceRate, CODELAB_CATEGORIES, CODELAB_DIFFICULTIES, CODELAB_LANGUAGES, STARTER_CODE,
} from "@/lib/codelab";
import {
  subscribeToProblemNotes, toggleFavorite, toggleBookmark, toggleReviewLater, toggleNeedsRevision,
  setConfidence, setPersonalDifficulty, setPersonalRating, saveNotes, saveTags,
  scheduleRevision, clearRevisionSchedule, isRevisionDue, formatRevisionLabel,
  CONFIDENCE_LEVELS, SUGGESTED_TAGS, REVISION_PRESETS,
} from "@/lib/problemNotes";
import { CAMPUS, tint } from "@/lib/campus-theme";
import { CampusCard, CampusChip, CampusGoogleButton, CampusBackButton, CampusBreadcrumb, CampusSkeleton, CampusEmptyState, CampusButton } from "@/components/campus/campus-ui";

// Native, light-themed port of components/codelab/problem-view.jsx for
// DeVert Campus - reuses lib/codelab.js's run/submit/fetch functions verbatim
// (same backend calls, same grading) and components/dropdown.jsx as-is (it's
// already theme-agnostic via --dropdown-* CSS vars already aliased in
// .campus-theme). The one functional change Monaco itself needs: "vs-dark" ->
// "light" - nothing else couples the editor to the dark app (confirmed by
// port research). Never redirects to /login - shows the same inline
// CampusGoogleButton prompt used everywhere else in Campus.

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });
const DIFF_COLOR = { Easy: CAMPUS.good, Medium: CAMPUS.warn, Hard: CAMPUS.bad };

// Per-language accents drawn from the same CAMPUS.* palette every other
// Campus surface already uses (never a one-off hex) - each language tab
// gets its own card color instead of a single flat active/inactive teal.
const LANGUAGE_COLOR = {
  java: CAMPUS.warn, python: CAMPUS.blue, cpp: CAMPUS.purple, javascript: CAMPUS.gold, c: CAMPUS.teal,
};

// A vertical, single-select filter list for the practice sidebar - reads
// like a nav (a label heading + a column of options, active one tinted),
// filling the wide empty gutter a plain top-of-grid dropdown row left behind
// instead of just labeling that same dropdown. Wraps into a horizontal chip
// row below `lg` where there's no side gutter to speak of.
// `horizontal` renders as a compact, bordered chip row (for a filter bar
// above content) instead of the default full-width nav-list column (for an
// actual sidebar) - same active/inactive tokens either way, just different
// shape, so switching a caller between the two is a one-prop change.
export function SidebarFilterGroup({ label, options, value, onChange, horizontal = false }) {
  return (
    <div>
      <p className="text-[9px] font-mono tracking-widest mb-2" style={{ color: CAMPUS.inkFaint }}>{label}</p>
      <div className={`flex flex-wrap gap-1.5 ${horizontal ? "" : "lg:flex-col"}`}>
        {options.map(opt => {
          const active = value === opt;
          return (
            <button key={opt} onClick={() => onChange(opt)}
              className={`text-left text-[12.5px] px-3 py-2 rounded-lg transition-colors ${horizontal ? "border" : ""}`}
              style={{
                background: active ? CAMPUS.tealTint : (horizontal ? CAMPUS.paper : "transparent"),
                color: active ? CAMPUS.teal : CAMPUS.inkSoft,
                fontWeight: active ? 600 : 500,
                borderColor: horizontal ? (active ? CAMPUS.teal : CAMPUS.line) : undefined,
              }}>
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Same shape/behavior as SidebarFilterGroup (single-select, active/inactive
// tint, horizontal-chip vs vertical-nav modes) but each option additionally
// shows this student's solved/total for that category - computed client-side
// from the `problems` array CampusPracticeList already fetches in full (see
// lib/codelab.js's fetchPublishedProblems, no orderBy/limit) crossed with
// the live `solvedIds` set, so this costs zero extra Firestore reads. Kept
// separate from SidebarFilterGroup (rather than bolting counts onto it)
// because that component is also used unchanged for the DIFFICULTY row here
// and for both filter rows on campus-app.jsx's public/pre-auth practice
// preview, where per-student progress doesn't apply.
// Self-fetching (own fetchPublishedProblems + subscribeToCodelabProgress, same
// pattern CampusPracticeList itself already uses) rather than taking
// `problems`/`solvedIds` as props, specifically so this is a drop-in
// replacement for `SidebarFilterGroup horizontal label="CATEGORY"` at EVERY
// call site - including the two in campus-app.jsx (CampusWorkspace's own DSA
// tab, which renders this row itself and passes `hideFilters` into
// CampusPracticeList, and CampusGlobalSection's public/pre-auth preview) -
// with zero prop-threading. This does mean a second, redundant
// fetchPublishedProblems() call when both this and CampusPracticeList render
// on the same page (as in the real DSA tab) - already an accepted tradeoff
// in this file (see fetchPublishedProblems's own call sites), and cheap: a
// single equality-filtered query over ~hundreds of docs, not a per-render
// cost.
export function CategoryFilterList({ value, onChange, horizontal = false, sortAlpha = false }) {
  const { user } = useAuth();
  const [problems, setProblems] = useState([]);
  const [solvedIds, setSolvedIds] = useState(new Set());

  useEffect(() => {
    fetchPublishedProblems().then(setProblems).catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) { setSolvedIds(new Set()); return; }
    return subscribeToCodelabProgress(user.uid, p => setSolvedIds(new Set(Object.keys(p.solvedProblems || {}))));
  }, [user]);

  const counts = useMemo(() => {
    const map = {};
    problems.forEach(p => {
      const c = map[p.category] || { total: 0, solved: 0 };
      c.total += 1;
      if (solvedIds.has(p.id)) c.solved += 1;
      map[p.category] = c;
    });
    return map;
  }, [problems, solvedIds]);
  const allTotal = problems.length;
  const allSolved = problems.reduce((n, p) => n + (solvedIds.has(p.id) ? 1 : 0), 0);
  // Navigation Architecture 2.0's sidebar wants categories in alphabetical
  // order (a browsing list, scanned by name) - every other call site keeps
  // CODELAB_CATEGORIES' own curated order (roughly easiest/most-common
  // first), so this is opt-in rather than a change to the shared constant.
  const categoryOptions = sortAlpha ? [...CODELAB_CATEGORIES].sort((a, b) => a.localeCompare(b)) : CODELAB_CATEGORIES;

  return (
    <div>
      <p className="text-[9px] font-mono tracking-widest mb-2" style={{ color: CAMPUS.inkFaint }}>CATEGORY</p>
      <div className={`flex flex-wrap gap-1.5 ${horizontal ? "" : "lg:flex-col"}`}>
        {["All", ...categoryOptions].map(opt => {
          const active = value === opt;
          const c = opt === "All" ? { total: allTotal, solved: allSolved } : (counts[opt] || { total: 0, solved: 0 });
          return (
            <button key={opt} onClick={() => onChange(opt)}
              className={`text-left text-[12.5px] px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${horizontal ? "border" : ""}`}
              style={{
                background: active ? CAMPUS.tealTint : (horizontal ? CAMPUS.paper : "transparent"),
                color: active ? CAMPUS.teal : CAMPUS.inkSoft,
                fontWeight: active ? 600 : 500,
                borderColor: horizontal ? (active ? CAMPUS.teal : CAMPUS.line) : undefined,
              }}>
              {opt}
              <span className="text-[10px] font-mono flex-shrink-0" style={{ color: active ? CAMPUS.teal : CAMPUS.inkFaint }}>
                {c.total > 0 ? `${c.solved}/${c.total}` : "0"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

const COMPANY_SHOW_MORE_STEP = 12;

// "Which companies ask this problem" filter - same self-fetching, drop-in
// shape as CategoryFilterList above, but the company LIST itself isn't a
// fixed enum like CODELAB_CATEGORIES: it's derived from whatever admins have
// actually tagged on `problems/{id}.companies` (see admin/page.jsx's
// Companies editor), sorted by how many problems carry each tag. Renders
// nothing at all until at least one problem has a real company tag - an
// empty "Companies: All" row with nothing under it would be worse than no
// row, and this is brand-new, 100% admin-authored metadata with zero
// existing problems tagged on the day this shipped.
export function CompanyFilterList({ value, onChange, horizontal = false }) {
  const [problems, setProblems] = useState([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetchPublishedProblems().then(setProblems).catch(() => {});
  }, []);

  const counts = useMemo(() => {
    const map = {};
    problems.forEach(p => { (p.companies || []).forEach(c => { map[c] = (map[c] || 0) + 1; }); });
    return map;
  }, [problems]);
  const companies = useMemo(() => Object.keys(counts).sort((a, b) => counts[b] - counts[a]), [counts]);

  if (companies.length === 0) return null;
  const visible = expanded ? companies : companies.slice(0, COMPANY_SHOW_MORE_STEP);

  return (
    <div>
      <p className="text-[9px] font-mono tracking-widest mb-2" style={{ color: CAMPUS.inkFaint }}>COMPANIES</p>
      <div className={`flex flex-wrap gap-1.5 ${horizontal ? "" : "lg:flex-col"}`}>
        {["All", ...visible].map(opt => {
          const active = value === opt;
          const count = opt === "All" ? problems.length : counts[opt];
          return (
            <button key={opt} onClick={() => onChange(opt)}
              className={`text-left text-[12.5px] px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${horizontal ? "border" : ""}`}
              style={{
                background: active ? CAMPUS.tealTint : (horizontal ? CAMPUS.paper : "transparent"),
                color: active ? CAMPUS.teal : CAMPUS.inkSoft,
                fontWeight: active ? 600 : 500,
                borderColor: horizontal ? (active ? CAMPUS.teal : CAMPUS.line) : undefined,
              }}>
              {opt}
              <span className="text-[10px] font-mono flex-shrink-0" style={{ color: active ? CAMPUS.teal : CAMPUS.inkFaint }}>{count}</span>
            </button>
          );
        })}
        {!expanded && companies.length > COMPANY_SHOW_MORE_STEP && (
          <button onClick={() => setExpanded(true)}
            className={`text-[12.5px] px-3 py-2 rounded-lg transition-colors ${horizontal ? "border" : ""}`}
            style={{ color: CAMPUS.inkFaint, borderColor: horizontal ? CAMPUS.line : undefined }}>
            Show More ({companies.length - COMPANY_SHOW_MORE_STEP})
          </button>
        )}
      </div>
    </div>
  );
}

// Multi-select chip row (unlike SidebarFilterGroup's single-select) - any
// number of these can be active at once, ANDed together in CampusPracticeList's
// `filtered` computation. Every option here reads from data already loaded
// client-side (notesMap, solvedIds) - no new query fires when a filter is
// toggled.
const STATUS_FILTER_OPTIONS = [
  { key: "favorite", label: "Favorites", icon: Star, color: CAMPUS.gold },
  { key: "bookmarked", label: "Bookmarked", icon: Bookmark, color: CAMPUS.blue },
  { key: "needsRevision", label: "Needs Revision", icon: Repeat, color: CAMPUS.purple },
  { key: "reviewLater", label: "Review Later", icon: CalendarClock, color: CAMPUS.warn },
  { key: "hasNotes", label: "Has Notes", icon: StickyNote, color: CAMPUS.teal },
  { key: "revisionDue", label: "Due For Revision", icon: AlertTriangle, color: CAMPUS.bad },
  { key: "solved", label: "Solved", icon: CheckCircle2, color: CAMPUS.good },
  { key: "unsolved", label: "Unsolved", icon: CircleDot, color: CAMPUS.inkFaint },
];

function matchesStatusFilter(key, note, solved) {
  switch (key) {
    case "favorite": return !!note.favorite;
    case "bookmarked": return !!note.bookmarked;
    case "needsRevision": return !!note.needsRevision;
    case "reviewLater": return !!note.reviewLater;
    case "hasNotes": return !!(note.notes && note.notes.trim());
    case "revisionDue": return isRevisionDue(note);
    case "solved": return solved;
    case "unsolved": return !solved;
    default: return true;
  }
}

function StatusFilterChips({ active, onToggle }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {STATUS_FILTER_OPTIONS.map(opt => {
        const isActive = active.has(opt.key);
        return (
          <button key={opt.key} onClick={() => onToggle(opt.key)}
            className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold px-2.5 py-1.5 rounded-lg border transition-colors"
            style={{
              background: isActive ? `${opt.color}18` : CAMPUS.paper,
              color: isActive ? opt.color : CAMPUS.inkSoft,
              borderColor: isActive ? `${opt.color}40` : CAMPUS.line,
            }}>
            <opt.icon size={12} fill={isActive ? opt.color : "none"} /> {opt.label}
          </button>
        );
      })}
    </div>
  );
}

const SORT_OPTIONS = [
  { key: "default", label: "Default Order" },
  { key: "difficulty_asc", label: "Difficulty: Easy → Hard" },
  { key: "difficulty_desc", label: "Difficulty: Hard → Easy" },
  { key: "favorite_first", label: "Favorites First" },
  { key: "rating_desc", label: "My Rating: High → Low" },
  { key: "attempts_desc", label: "Most Attempted" },
  { key: "recent_solved", label: "Recently Solved" },
];
const DIFFICULTY_RANK = { Easy: 0, Medium: 1, Hard: 2 };

// Plain in-memory re-sort of the already-filtered, already-fetched list -
// same "small dataset, no new query" reasoning as CampusTable's
// useSortableRows in campus-ui.jsx.
function sortProblems(list, sortKey, notesMap, submissionStats) {
  if (sortKey === "default") return list;
  const withMeta = list.map(p => ({ p, note: notesMap[p.id] || {}, stats: submissionStats[p.id] }));
  withMeta.sort((a, b) => {
    switch (sortKey) {
      case "difficulty_asc": return (DIFFICULTY_RANK[a.p.difficulty] ?? 1) - (DIFFICULTY_RANK[b.p.difficulty] ?? 1);
      case "difficulty_desc": return (DIFFICULTY_RANK[b.p.difficulty] ?? 1) - (DIFFICULTY_RANK[a.p.difficulty] ?? 1);
      case "favorite_first": return (b.note.favorite ? 1 : 0) - (a.note.favorite ? 1 : 0);
      case "rating_desc": return (b.note.personalRating || 0) - (a.note.personalRating || 0);
      case "attempts_desc": return (b.stats?.attempts || 0) - (a.stats?.attempts || 0);
      case "recent_solved": return (b.stats?.lastAt || 0) - (a.stats?.lastAt || 0);
      default: return 0;
    }
  });
  return withMeta.map(x => x.p);
}

function MiniStars({ value, onChange, size = 12 }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} onClick={(e) => { e.stopPropagation(); onChange(n === value ? 0 : n); }} className="p-0 leading-none">
          <Star size={size} fill={n <= value ? CAMPUS.gold : "none"} style={{ color: n <= value ? CAMPUS.gold : CAMPUS.inkFaint }} />
        </button>
      ))}
    </div>
  );
}

const CONFIDENCE_COLOR = {
  very_confident: CAMPUS.good, confident: CAMPUS.teal, average: CAMPUS.warn,
  needs_practice: CAMPUS.gold, didnt_understand: CAMPUS.bad,
};

// The DSA card's "three-dot menu", built as a self-contained floating
// popover (same absolute-positioned, framer-motion, click-outside-closes
// shape as pulse-app.jsx's PostMenu) rather than a plain list of buttons -
// every action here is a direct, optimistic-by-Firestore's-own-onSnapshot
// write through lib/problemNotes.js (no local pending state to reconcile;
// the live subscribeToProblemNotes listener in CampusPracticeList reflects
// each write back into `note` on its own).
//
// Deliberately does NOT include "Mark Solved/Unsolved" or "Reset Progress":
// user_codelab_progress.solvedProblems is a monotonic map by design (see
// firestore.rules' own comment on that collection) - once a problemId key is
// set, even the owner can never clear it client-side, specifically so a
// student can't clear a solve and re-trigger reward logic. Exposing a menu
// item that promises to do exactly that would either silently no-op or
// require reopening that trust boundary, so it's left out rather than built
// half-working.
function ProblemStudyMenu({ problem, note, uid, onClose, onOpenProblem }) {
  const ref = useRef(null);
  const [notesDraft, setNotesDraft] = useState(note.notes || "");
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [onClose]);

  const tags = note.tags || [];
  const addTag = (raw) => {
    const clean = raw.trim();
    if (!clean || tags.includes(clean)) return;
    saveTags(uid, problem.id, [...tags, clean]).catch(() => {});
  };
  const removeTag = (t) => saveTags(uid, problem.id, tags.filter(x => x !== t)).catch(() => {});
  const revisionLabel = formatRevisionLabel(note);

  const TOGGLES = [
    { key: "favorite", icon: Star, label: "Favorite", active: !!note.favorite, color: CAMPUS.gold, onClick: () => toggleFavorite(uid, problem.id, !note.favorite) },
    { key: "bookmarked", icon: Bookmark, label: "Save", active: !!note.bookmarked, color: CAMPUS.blue, onClick: () => toggleBookmark(uid, problem.id, !note.bookmarked) },
    { key: "reviewLater", icon: CalendarClock, label: "Review", active: !!note.reviewLater, color: CAMPUS.warn, onClick: () => toggleReviewLater(uid, problem.id, !note.reviewLater) },
    { key: "needsRevision", icon: Repeat, label: "Revise", active: !!note.needsRevision, color: CAMPUS.purple, onClick: () => toggleNeedsRevision(uid, problem.id, !note.needsRevision) },
  ];

  return (
    <motion.div ref={ref} onClick={(e) => e.stopPropagation()}
      initial={{ opacity: 0, scale: 0.96, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: -4 }}
      transition={{ duration: 0.14 }}
      className="absolute top-9 right-0 z-30 w-[268px] max-h-[75vh] overflow-y-auto rounded-xl p-3"
      style={{ background: CAMPUS.surface, border: `1px solid ${CAMPUS.line}`, boxShadow: CAMPUS.shadowLg }}>
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <p className="text-[12px] font-semibold leading-snug" style={{ color: CAMPUS.ink }}>{problem.title}</p>
        <button onClick={onClose} className="flex-shrink-0" style={{ color: CAMPUS.inkFaint }}><X size={14} /></button>
      </div>

      <div className="grid grid-cols-4 gap-1.5 mb-3">
        {TOGGLES.map(a => (
          <button key={a.key} onClick={a.onClick} title={a.label}
            className="flex flex-col items-center gap-1 py-2 rounded-lg transition-colors"
            style={{ background: a.active ? `${a.color}18` : CAMPUS.paper, color: a.active ? a.color : CAMPUS.inkFaint, border: `1px solid ${a.active ? `${a.color}40` : CAMPUS.line}` }}>
            <a.icon size={14} fill={a.active ? a.color : "none"} />
            <span className="text-[9px] font-semibold">{a.label}</span>
          </button>
        ))}
      </div>

      <p className="text-[9px] font-mono tracking-widest mb-1.5" style={{ color: CAMPUS.inkFaint }}>CONFIDENCE</p>
      <div className="flex flex-wrap gap-1 mb-3">
        {CONFIDENCE_LEVELS.map(c => {
          const active = note.confidence === c.key;
          const color = CONFIDENCE_COLOR[c.key];
          return (
            <button key={c.key} onClick={() => setConfidence(uid, problem.id, active ? null : c.key)}
              className="text-[10px] font-semibold px-2 py-1 rounded-full transition-colors"
              style={{ background: active ? tint(color, 14) : CAMPUS.paper, color: active ? color : CAMPUS.inkFaint, border: `1px solid ${active ? tint(color, 34) : CAMPUS.line}` }}>
              {c.label}
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-[9px] font-mono tracking-widest mb-1" style={{ color: CAMPUS.inkFaint }}>YOUR DIFFICULTY</p>
          <div className="flex gap-1">
            {CODELAB_DIFFICULTIES.map(d => {
              const active = note.personalDifficulty === d;
              const color = DIFF_COLOR[d];
              return (
                <button key={d} onClick={() => setPersonalDifficulty(uid, problem.id, active ? null : d)}
                  className="text-[10px] font-semibold w-6 h-6 rounded-full"
                  style={{ background: active ? tint(color, 14) : CAMPUS.paper, color: active ? color : CAMPUS.inkFaint, border: `1px solid ${active ? tint(color, 34) : CAMPUS.line}` }}>
                  {d[0]}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <p className="text-[9px] font-mono tracking-widest mb-1 text-right" style={{ color: CAMPUS.inkFaint }}>YOUR RATING</p>
          <MiniStars value={note.personalRating || 0} onChange={(n) => setPersonalRating(uid, problem.id, n)} />
        </div>
      </div>

      <p className="text-[9px] font-mono tracking-widest mb-1.5" style={{ color: CAMPUS.inkFaint }}>NOTES</p>
      <textarea value={notesDraft} onChange={(e) => setNotesDraft(e.target.value)}
        onBlur={() => { if (notesDraft !== (note.notes || "")) saveNotes(uid, problem.id, notesDraft).catch(() => {}); }}
        placeholder="Sliding window trick, DP recurrence..." rows={2}
        className="w-full text-[11px] rounded-lg p-2 mb-3 outline-none resize-none"
        style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.ink }} />

      <p className="text-[9px] font-mono tracking-widest mb-1.5" style={{ color: CAMPUS.inkFaint }}>TAGS</p>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-1.5">
          {tags.map(t => (
            <span key={t} className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: CAMPUS.tealTint, color: CAMPUS.teal }}>
              {t} <button onClick={() => removeTag(t)}><X size={9} /></button>
            </span>
          ))}
        </div>
      )}
      <input value={tagInput} onChange={(e) => setTagInput(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(tagInput); setTagInput(""); } }}
        placeholder="Add a tag, press Enter" className="w-full text-[11px] rounded-lg px-2 py-1.5 mb-1.5 outline-none"
        style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.ink }} />
      <div className="flex flex-wrap gap-1 mb-3">
        {SUGGESTED_TAGS.filter(t => !tags.includes(t)).slice(0, 4).map(t => (
          <button key={t} onClick={() => addTag(t)} className="text-[9.5px] font-medium px-1.5 py-0.5 rounded-full" style={{ color: CAMPUS.inkFaint, border: `1px solid ${CAMPUS.line}` }}>
            + {t}
          </button>
        ))}
      </div>

      <p className="text-[9px] font-mono tracking-widest mb-1.5" style={{ color: CAMPUS.inkFaint }}>REVISION SCHEDULE</p>
      {revisionLabel && (
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-semibold" style={{ color: CAMPUS.purple }}>Next: {revisionLabel}</span>
          <button onClick={() => clearRevisionSchedule(uid, problem.id)} className="text-[10px]" style={{ color: CAMPUS.inkFaint }}>Clear</button>
        </div>
      )}
      <div className="flex flex-wrap gap-1 mb-3">
        {REVISION_PRESETS.map(r => (
          <button key={r.label} onClick={() => scheduleRevision(uid, problem.id, r.days)}
            className="text-[10px] font-semibold px-2 py-1 rounded-full" style={{ color: CAMPUS.inkSoft, border: `1px solid ${CAMPUS.line}` }}>
            {r.label}
          </button>
        ))}
      </div>

      <button onClick={onOpenProblem} className="w-full text-[11.5px] font-semibold py-2 rounded-lg" style={{ background: CAMPUS.teal, color: "#fff" }}>
        Open Problem
      </button>
    </motion.div>
  );
}

function SignInPrompt({ message }) {
  return (
    <CampusCard className="p-7 text-center max-w-sm mx-auto">
      <h3 className="text-[16px] font-semibold mb-2" style={{ color: CAMPUS.ink }}>Sign in to continue</h3>
      <p className="text-[13px] mb-5" style={{ color: CAMPUS.inkSoft }}>{message}</p>
      <CampusGoogleButton style={{ background: CAMPUS.chromeBg, color: CAMPUS.chromeFg }} />
    </CampusCard>
  );
}

// ---------------- List ----------------

// `category`/`difficulty` (controlled) let a caller that already renders its
// own filter sidebar elsewhere (see CampusGlobalSection's practice section)
// drive the filtering itself, passing `hideFilters` to skip this
// component's own <aside> so the two don't render side by side. Omit both
// and this manages its own category/difficulty state + sidebar, unchanged
// for every other caller (e.g. the authenticated Workspace's Practice tab).
// `adminMode`/`hiddenIds`/`onToggleHidden`: Manage's Practice & DSA screen
// reuses this exact list (rather than a second, drift-prone rendering) to
// let a campus admin hide a problem from THEIR institution's students -
// in adminMode, hidden problems stay visible (dimmed, with an unhide
// button) instead of disappearing, so there's something to click to
// restore them. Every real student-facing call site leaves these unset,
// so hidden problems just vanish from `filtered` as if they never existed.
export function CampusPracticeList({ onSelect, initialCategory, category: controlledCategory, difficulty: controlledDifficulty, company: controlledCompany, hideFilters = false, adminMode = false, hiddenIds, onToggleHidden }) {
  const { user } = useAuth();
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [categoryState, setCategoryState] = useState(initialCategory || "All");
  const [difficultyState, setDifficultyState] = useState("All");
  const [companyState, setCompanyState] = useState("All");
  const [search, setSearch] = useState("");
  const [solvedIds, setSolvedIds] = useState(new Set());
  const [attemptedIds, setAttemptedIds] = useState(new Set());
  const [notesMap, setNotesMap] = useState({});
  const [submissionStats, setSubmissionStats] = useState({});
  const [statusFilters, setStatusFilters] = useState(new Set());
  const [sortKey, setSortKey] = useState("default");
  const [openMenuId, setOpenMenuId] = useState(null);
  const category = controlledCategory ?? categoryState;
  const difficulty = controlledDifficulty ?? difficultyState;
  const company = controlledCompany ?? companyState;

  const loadProblems = () => {
    setLoading(true); setError(false);
    fetchPublishedProblems().then(setProblems).catch(() => setError(true)).finally(() => setLoading(false));
  };
  useEffect(loadProblems, []);

  useEffect(() => {
    if (!user) { setSolvedIds(new Set()); setAttemptedIds(new Set()); setNotesMap({}); setSubmissionStats({}); return; }
    // Live, not a one-time fetch - a problem solved in another tab (or just
    // now, in the problem view this list returns to) shows SOLVED here
    // immediately, with no remount/refresh needed to see it.
    const unsubscribe = subscribeToCodelabProgress(user.uid, p => setSolvedIds(new Set(Object.keys(p.solvedProblems || {}))));
    // Same live-not-one-time reasoning for study-card metadata - a favorite/
    // note/tag toggled from another tab (or this same card, re-rendered
    // after its own write) reflects immediately.
    const unsubscribeNotes = subscribeToProblemNotes(user.uid, setNotesMap);
    fetchAttemptedProblemIds(user.uid).then(setAttemptedIds).catch(() => {});
    // One-time - "attempts/last solved" only needs to reflect submissions
    // made before this page load; a fresh submission during this session
    // already flips `solved` live via the listener above, which is the part
    // that actually gates UI behavior.
    fetchAllSubmissionsForUser(user.uid).then(subs => setSubmissionStats(computeSubmissionStatsByProblem(subs))).catch(() => {});
    return () => { unsubscribe(); unsubscribeNotes(); };
  }, [user]);

  const q = search.trim().toLowerCase();
  const preSort = problems.filter(p => {
    const note = notesMap[p.id] || {};
    const solved = solvedIds.has(p.id);
    return (adminMode || !hiddenIds?.has(p.id))
      && (category === "All" || p.category === category)
      && (difficulty === "All" || p.difficulty === difficulty)
      && (company === "All" || (p.companies || []).includes(company))
      && (!q || p.title?.toLowerCase().includes(q) || String(p.number ?? "").includes(q))
      && Array.from(statusFilters).every(key => matchesStatusFilter(key, note, solved));
  });
  const filtered = sortProblems(preSort, sortKey, notesMap, submissionStats);

  const toggleStatusFilter = (key) => {
    setStatusFilters(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  return (
    <div className={hideFilters ? "" : "flex gap-6 flex-col lg:flex-row"}>
      {!hideFilters && (
        <aside className="lg:w-52 flex-shrink-0">
          <div className="flex flex-row lg:flex-col gap-5 lg:gap-6 lg:sticky lg:top-6">
            <CategoryFilterList value={category} onChange={setCategoryState} />
            <SidebarFilterGroup label="DIFFICULTY" options={["All", ...CODELAB_DIFFICULTIES]} value={difficulty} onChange={setDifficultyState} />
            <CompanyFilterList value={company} onChange={setCompanyState} />
          </div>
        </aside>
      )}

      <div className={hideFilters ? "" : "flex-1 min-w-0"}>
        <div className="relative mb-4">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: CAMPUS.inkFaint }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search problems by title or number..."
            className="w-full text-[13px] pl-9 pr-3 py-2.5 rounded-lg outline-none"
            style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.ink }}
          />
        </div>
        {user && (
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <StatusFilterChips active={statusFilters} onToggle={toggleStatusFilter} />
            </div>
            <select value={sortKey} onChange={(e) => setSortKey(e.target.value)}
              className="text-[11.5px] font-semibold px-2.5 py-1.5 rounded-lg outline-none flex-shrink-0"
              style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.inkSoft }}>
              {SORT_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
            </select>
          </div>
        )}
        {loading ? (
          <div className="grid sm:grid-cols-2 gap-3">
            {[0, 1, 2, 3].map(i => (
              <CampusCard key={i} className="p-4 space-y-3">
                <CampusSkeleton variant="rect" width={70} height={18} />
                <CampusSkeleton variant="text" width="65%" height={16} />
                <CampusSkeleton variant="text" width="35%" />
              </CampusCard>
            ))}
          </div>
        ) : error ? (
          <CampusEmptyState icon={AlertTriangle} color={CAMPUS.bad} title="Couldn't load problems"
            description="Check your connection and try again."
            action={<CampusButton variant="secondary" size="sm" onClick={loadProblems}>Retry</CampusButton>} />
        ) : filtered.length === 0 ? (
          <CampusEmptyState icon={Code2} title="No problems match" description="Try a different category or difficulty." />
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {filtered.map(p => {
              const rate = acceptanceRate(p);
              const solved = solvedIds.has(p.id);
              const attempted = !solved && attemptedIds.has(p.id);
              const hidden = adminMode && hiddenIds?.has(p.id);
              const note = notesMap[p.id] || {};
              const stats = submissionStats[p.id];
              const revisionDue = isRevisionDue(note);
              const revisionLabel = formatRevisionLabel(note);
              const tags = note.tags || [];
              const hasMeta = !hidden && (note.favorite || note.bookmarked || note.reviewLater || note.needsRevision
                || revisionDue || note.notes?.trim() || note.confidence || note.personalRating > 0
                || (note.personalDifficulty && note.personalDifficulty !== p.difficulty) || tags.length > 0);
              return (
                <div key={p.id} className="relative">
                  {!hidden && solved && (
                    <div className="absolute -top-2 -left-2 z-10 w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ background: CAMPUS.good, boxShadow: CAMPUS.shadow }} title="Solved">
                      <Check size={13} color="#fff" strokeWidth={3} />
                    </div>
                  )}
                  <button onClick={() => onSelect(p.id)} className="text-left w-full">
                    <CampusCard hover className="p-4 h-full" style={hidden ? { opacity: 0.5 } : (solved ? { borderColor: tint(CAMPUS.good, 31) } : undefined)}>
                      <div className="flex items-center gap-2 mb-2 flex-wrap pr-16">
                        <CampusChip color={CAMPUS.inkFaint}>{p.category}</CampusChip>
                        <CampusChip color={DIFF_COLOR[p.difficulty] || CAMPUS.good}>{p.difficulty}</CampusChip>
                        {hidden && <CampusChip color={CAMPUS.bad} icon={EyeOff} className="ml-auto">HIDDEN</CampusChip>}
                        {!hidden && solved && <CampusChip color={CAMPUS.good} icon={CheckCircle2} className="ml-auto">SOLVED</CampusChip>}
                        {!hidden && attempted && <CampusChip color={CAMPUS.warn} icon={CircleDot} className="ml-auto">ATTEMPTED</CampusChip>}
                      </div>
                      <b className="block text-[14px] mb-1" style={{ color: CAMPUS.ink }}>
                        {p.number != null && <span style={{ color: CAMPUS.inkFaint }}>{p.number}. </span>}
                        {p.title}
                      </b>
                      {p.companies?.length > 0 && (
                        <div className="flex items-center gap-1 mb-2 flex-wrap">
                          <Building2 size={10} style={{ color: CAMPUS.inkFaint }} />
                          <span className="text-[10.5px]" style={{ color: CAMPUS.inkFaint }}>
                            Asked in {p.companies.slice(0, 3).join(", ")}{p.companies.length > 3 ? ` +${p.companies.length - 3}` : ""}
                          </span>
                        </div>
                      )}
                      {hasMeta && (
                        <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                          {note.favorite && <CampusChip color={CAMPUS.gold} icon={Star}>FAVORITE</CampusChip>}
                          {note.bookmarked && <CampusChip color={CAMPUS.blue} icon={Bookmark}>SAVED</CampusChip>}
                          {revisionDue && <CampusChip color={CAMPUS.bad} icon={AlertTriangle}>REVISE {revisionLabel?.toUpperCase()}</CampusChip>}
                          {!revisionDue && note.needsRevision && <CampusChip color={CAMPUS.purple} icon={Repeat}>NEEDS REVISION</CampusChip>}
                          {!revisionDue && note.reviewLater && <CampusChip color={CAMPUS.warn} icon={CalendarClock}>REVIEW{revisionLabel ? ` ${revisionLabel.toUpperCase()}` : ""}</CampusChip>}
                          {note.confidence && <CampusChip color={CONFIDENCE_COLOR[note.confidence]} icon={Gauge}>{CONFIDENCE_LEVELS.find(c => c.key === note.confidence)?.label?.toUpperCase()}</CampusChip>}
                          {note.personalRating > 0 && <CampusChip color={CAMPUS.gold} icon={Star}>{note.personalRating}/5</CampusChip>}
                          {note.personalDifficulty && note.personalDifficulty !== p.difficulty && <CampusChip color={DIFF_COLOR[note.personalDifficulty]}>YOU: {note.personalDifficulty.toUpperCase()}</CampusChip>}
                          {note.notes?.trim() && <CampusChip color={CAMPUS.teal} icon={StickyNote}>NOTES</CampusChip>}
                          {tags.slice(0, 2).map(t => <CampusChip key={t} color={CAMPUS.inkFaint} icon={Tag}>{t}</CampusChip>)}
                          {tags.length > 2 && <CampusChip color={CAMPUS.inkFaint}>+{tags.length - 2}</CampusChip>}
                        </div>
                      )}
                      <div className="flex items-center gap-3 text-[11px]" style={{ color: CAMPUS.inkFaint }}>
                        <span>~{p.estimatedTime || 15} min</span>
                        {rate !== null && <span>{rate}% acceptance</span>}
                        {stats?.attempts > 0 && <span>{stats.attempts} attempt{stats.attempts === 1 ? "" : "s"}</span>}
                      </div>
                    </CampusCard>
                  </button>
                  {adminMode && (
                    <button onClick={(e) => { e.stopPropagation(); onToggleHidden(p.id, !hidden); }}
                      className="absolute top-3 right-3 flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg"
                      style={{ color: hidden ? CAMPUS.good : CAMPUS.bad, background: hidden ? CAMPUS.goodTint : CAMPUS.badTint }}>
                      {hidden ? <><Eye size={10} /> unhide</> : <><EyeOff size={10} /> hide</>}
                    </button>
                  )}
                  {!hidden && !adminMode && user && (
                    <div className="absolute top-3 right-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => toggleFavorite(user.uid, p.id, !note.favorite)} title="Favorite"
                          className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
                          style={{ background: note.favorite ? CAMPUS.goldTint : CAMPUS.paper, color: note.favorite ? CAMPUS.gold : CAMPUS.inkFaint }}>
                          <Star size={13} fill={note.favorite ? CAMPUS.gold : "none"} />
                        </button>
                        <button onClick={() => toggleBookmark(user.uid, p.id, !note.bookmarked)} title="Bookmark"
                          className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
                          style={{ background: note.bookmarked ? CAMPUS.blueTint : CAMPUS.paper, color: note.bookmarked ? CAMPUS.blue : CAMPUS.inkFaint }}>
                          <Bookmark size={13} fill={note.bookmarked ? CAMPUS.blue : "none"} />
                        </button>
                        <button onClick={() => setOpenMenuId(openMenuId === p.id ? null : p.id)} title="More actions"
                          className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
                          style={{ background: openMenuId === p.id ? CAMPUS.tealTint : CAMPUS.paper, color: openMenuId === p.id ? CAMPUS.teal : CAMPUS.inkFaint }}>
                          <MoreVertical size={13} />
                        </button>
                      </div>
                      <AnimatePresence>
                        {openMenuId === p.id && (
                          <ProblemStudyMenu problem={p} note={note} uid={user.uid}
                            onClose={() => setOpenMenuId(null)}
                            onOpenProblem={() => { setOpenMenuId(null); onSelect(p.id); }} />
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------- Problem view ----------------

// Defaults to true (desktop) rather than false - this view's primary layout
// IS the desktop split-pane one, so assuming desktop until proven otherwise
// avoids a flash of the mobile-stacked layout on every first render.
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return isDesktop;
}

function formatRelativeTime(ts) {
  if (!ts) return "";
  const date = typeof ts.toDate === "function" ? ts.toDate() : new Date(ts);
  const diffSec = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (diffSec < 60) return "just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
}

// One test's own card. `showDiff` is only ever true for Run's sample tests -
// their input/expected/output are already public and known client-side, so
// showing them is harmless. Submit's per-test summaries (sample AND hidden)
// never carry a diff at all - the backend deliberately never returns
// expected/actual for a submission, since hidden test answers must never
// reach the browser (see GradingService's own header comment) - showing a
// diff for a sample test at submit-time would be inconsistent for no real
// benefit, so submit results stay pass/fail-only across the board.
function TestCaseCard({ label, passed, verdict, input, expected, actual, showDiff }) {
  const stateColor = passed ? CAMPUS.good : verdict === "Error" ? CAMPUS.warn : CAMPUS.bad;
  const stateTint = passed ? CAMPUS.goodTint : verdict === "Error" ? CAMPUS.warnTint : CAMPUS.badTint;
  return (
    <div className="rounded-lg p-3 mb-2" style={{ border: `1px solid ${stateColor}40`, background: stateTint }}>
      <div className="flex items-center gap-2">
        {passed ? <CheckCircle2 size={13} style={{ color: stateColor }} /> : <XCircle size={13} style={{ color: stateColor }} />}
        <span className="text-[12px] font-semibold" style={{ color: CAMPUS.ink }}>{label}</span>
        <span className="ml-auto text-[10.5px] font-mono font-semibold" style={{ color: stateColor }}>{passed ? "Passed" : verdict}</span>
      </div>
      {showDiff && (
        <div className="mt-2.5 space-y-2">
          <div>
            <p className="text-[9px] font-mono tracking-widest mb-1" style={{ color: CAMPUS.inkFaint }}>INPUT</p>
            <pre className="text-[11px] whitespace-pre-wrap rounded p-2" style={{ background: CAMPUS.surface, color: CAMPUS.inkSoft }}>{input || "—"}</pre>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-[9px] font-mono tracking-widest mb-1" style={{ color: CAMPUS.inkFaint }}>EXPECTED</p>
              <pre className="text-[11px] whitespace-pre-wrap rounded p-2" style={{ background: CAMPUS.surface, color: CAMPUS.inkSoft }}>{expected || "—"}</pre>
            </div>
            <div>
              <p className="text-[9px] font-mono tracking-widest mb-1" style={{ color: passed ? CAMPUS.inkFaint : CAMPUS.bad }}>YOUR OUTPUT</p>
              <pre className="text-[11px] whitespace-pre-wrap rounded p-2" style={{ background: CAMPUS.surface, color: passed ? CAMPUS.inkSoft : CAMPUS.bad }}>{actual || "—"}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCell({ icon: Icon, label, value, color }) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon size={12} style={{ color: color || CAMPUS.inkFaint }} className="flex-shrink-0" />
      <div className="min-w-0">
        <p className="text-[9px] font-mono tracking-wide" style={{ color: CAMPUS.inkFaint }}>{label}</p>
        <p className="text-[11.5px] font-semibold truncate" style={{ color: CAMPUS.ink }}>{value}</p>
      </div>
    </div>
  );
}

// The professional result summary - real fields only: runtimeMs/memoryKb are
// always present (submit and Run both report them via the backend); XP/coin
// cells only render when actually earned (a re-solve or a failed run earns
// neither, and shouldn't show a hollow "+0").
function ResultSummaryStrip({ verdict }) {
  const accepted = verdict.verdict === "Accepted";
  return (
    <div className="rounded-lg p-3 mb-3" style={{ border: `1px solid ${accepted ? CAMPUS.good : CAMPUS.bad}50`, background: accepted ? CAMPUS.goodTint : CAMPUS.badTint }}>
      <div className="flex items-center justify-between flex-wrap gap-2 mb-2.5">
        <span className="text-[14px] font-bold" style={{ color: accepted ? CAMPUS.good : CAMPUS.bad }}>{verdict.verdict}</span>
        <span className="text-[11px] font-mono" style={{ color: CAMPUS.inkFaint }}>{verdict.testsPassed}/{verdict.testsTotal} tests</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <StatCell icon={Clock} label="RUNTIME" value={`${verdict.runtimeMs ?? 0} ms`} />
        <StatCell icon={MemoryStick} label="MEMORY" value={verdict.memoryKb ? `${(verdict.memoryKb / 1024).toFixed(1)} MB` : "—"} />
        {verdict.xpEarned > 0 && <StatCell icon={PartyPopper} label="XP EARNED" value={`+${verdict.xpEarned}`} color={CAMPUS.gold} />}
        {verdict.coinsEarned > 0 && <StatCell icon={Coins} label="COINS" value={`+${verdict.coinsEarned}`} color={CAMPUS.gold} />}
      </div>
      {verdict.alreadySolved && accepted && (
        <p className="text-[10.5px] mt-2.5" style={{ color: CAMPUS.inkFaint }}>Already solved earlier - no additional XP this time.</p>
      )}
    </div>
  );
}

const RESULTS_PANEL_MIN = 160;
const RESULTS_PANEL_MAX = 560;

// VS Code Terminal-style bottom panel, living inside the editor card (not a
// viewport-fixed bar - this is one problem's own console, not a global one).
// Drag the grip to resize, click a tab (or the chevron) to expand/collapse -
// Run/Submit force it open from outside via `open`/`onToggleOpen`, everything
// else is this component's own state.
function CampusResultsPanel({
  open, onToggleOpen, height, onHeightChange, tab, onTabChange,
  resultsView, consoleText, historyItems, historyLoading, onLoadHistory,
  onReopenSubmission, activeSubmissionId,
}) {
  const dragState = useRef(null);

  useEffect(() => {
    const onMove = (e) => {
      if (!dragState.current) return;
      const delta = dragState.current.startY - e.clientY;
      onHeightChange(Math.min(RESULTS_PANEL_MAX, Math.max(RESULTS_PANEL_MIN, dragState.current.startHeight + delta)));
    };
    const onUp = () => { dragState.current = null; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [onHeightChange]);

  const TABS = [
    { key: "tests", label: "Test Cases", icon: ListChecks },
    { key: "console", label: "Console", icon: Terminal },
    { key: "history", label: "Submission History", icon: History },
  ];

  return (
    <div>
      {open && (
        <div onMouseDown={(e) => { dragState.current = { startY: e.clientY, startHeight: height }; }}
          className="h-2 cursor-row-resize flex items-center justify-center flex-shrink-0" style={{ background: CAMPUS.paper }}>
          <GripHorizontal size={12} style={{ color: CAMPUS.inkFaint }} />
        </div>
      )}
      <div className="flex items-center gap-0.5 px-1" style={{ background: CAMPUS.paper }}>
        {TABS.map(t => {
          const Icon = t.icon;
          const active = open && tab === t.key;
          return (
            <button key={t.key}
              onClick={() => { onTabChange(t.key); if (!open) onToggleOpen(true); if (t.key === "history") onLoadHistory(); }}
              className="flex items-center gap-1.5 text-[11.5px] font-medium px-3 py-2 transition-colors"
              style={{ color: active ? CAMPUS.teal : CAMPUS.inkFaint, borderBottom: `2px solid ${active ? CAMPUS.teal : "transparent"}` }}>
              <Icon size={12} /> {t.label}
            </button>
          );
        })}
        <button onClick={() => onToggleOpen(!open)} className="ml-auto p-2" style={{ color: CAMPUS.inkFaint }} title={open ? "Collapse" : "Expand"}>
          {open ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </button>
      </div>

      <motion.div animate={{ height: open ? height : 0 }} initial={false} transition={{ type: "spring", stiffness: 340, damping: 34 }}
        className="overflow-y-auto" style={{ background: CAMPUS.surface }}>
        <div className="p-3">
          {tab === "tests" && (
            resultsView ? (
              <>
                {resultsView.verdict && <ResultSummaryStrip verdict={resultsView.verdict} />}
                {resultsView.items.map((it, i) => <TestCaseCard key={i} {...it} showDiff={resultsView.kind === "run"} />)}
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-[12px] mb-3" style={{ color: CAMPUS.inkFaint }}>Run your code to view:</p>
                <ul className="inline-flex flex-col gap-1 text-left text-[11.5px]" style={{ color: CAMPUS.inkFaint }}>
                  <li>• Test case results</li>
                  <li>• Console output</li>
                  <li>• Runtime &amp; memory usage</li>
                  <li>• Submission history</li>
                </ul>
              </div>
            )
          )}
          {tab === "console" && (
            consoleText ? (
              <pre className="text-[11.5px] whitespace-pre-wrap font-mono" style={{ color: CAMPUS.inkSoft }}>{consoleText}</pre>
            ) : (
              <p className="text-[12px] text-center py-8" style={{ color: CAMPUS.inkFaint }}>Nothing run yet.</p>
            )
          )}
          {tab === "history" && (
            historyLoading ? (
              <div className="space-y-2">{[0, 1, 2].map(i => <CampusSkeleton key={i} variant="rect" height={40} />)}</div>
            ) : !historyItems || historyItems.length === 0 ? (
              <p className="text-[12px] text-center py-8" style={{ color: CAMPUS.inkFaint }}>No submissions yet for this problem.</p>
            ) : (
              <div className="space-y-1.5">
                {historyItems.map(s => (
                  <button key={s.id} onClick={() => onReopenSubmission(s)}
                    className="w-full text-left flex items-center gap-3 rounded-lg p-2.5 transition-colors flex-wrap"
                    style={{ border: `1px solid ${s.id === activeSubmissionId ? CAMPUS.teal : CAMPUS.line}`, background: s.id === activeSubmissionId ? CAMPUS.tealTint : "transparent" }}>
                    {s.verdict === "Accepted" ? <CheckCircle2 size={13} style={{ color: CAMPUS.good }} /> : <XCircle size={13} style={{ color: CAMPUS.bad }} />}
                    <span className="text-[11.5px] font-mono font-semibold" style={{ color: CAMPUS.ink }}>{s.language}</span>
                    <span className="text-[11px]" style={{ color: CAMPUS.inkFaint }}>{s.testsPassed}/{s.testsTotal}</span>
                    <span className="text-[11px]" style={{ color: CAMPUS.inkFaint }}>{s.runtimeMs ?? 0} ms</span>
                    <span className="ml-auto text-[10.5px]" style={{ color: CAMPUS.inkFaint }}>{formatRelativeTime(s.createdAt)}</span>
                  </button>
                ))}
              </div>
            )
          )}
        </div>
      </motion.div>
    </div>
  );
}

// A real, generic loading sequence tied to the actual pending request below
// (not a fake simulation of separate server round-trips - it's one request,
// grading everything at once) - purely a "here's what's happening" pacing
// aid while that one call is in flight.
const SUBMIT_STAGES = ["Submitting...", "Checking test cases...", "Running hidden test cases...", "Evaluating solution...", "Finalizing..."];

function SubmitProgressLine({ stageIndex }) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg p-3" style={{ border: `1px solid ${CAMPUS.line}`, background: CAMPUS.paper }}>
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.9, ease: "linear" }}
        className="w-3.5 h-3.5 rounded-full flex-shrink-0" style={{ border: `2px solid ${tint(CAMPUS.teal, 25)}`, borderTopColor: CAMPUS.teal }} />
      <AnimatePresence mode="wait">
        <motion.span key={stageIndex} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
          className="text-[12px] font-medium" style={{ color: CAMPUS.inkSoft }}>
          {SUBMIT_STAGES[stageIndex] ?? "Working..."}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

// Subtle, not excessive - a handful of small pieces, one burst, no repeat.
function ConfettiBurst() {
  const pieces = useMemo(() => Array.from({ length: 14 }, (_, i) => ({
    id: i,
    x: (Math.random() - 0.5) * 240,
    rotate: Math.random() * 360,
    color: [CAMPUS.teal, CAMPUS.gold, CAMPUS.purple, CAMPUS.good][i % 4],
    delay: Math.random() * 0.15,
  })), []);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map(p => (
        <motion.span key={p.id}
          initial={{ opacity: 1, x: "50%", y: "35%", rotate: 0, scale: 0 }}
          animate={{ opacity: 0, x: `calc(50% + ${p.x}px)`, y: "115%", rotate: p.rotate, scale: 1 }}
          transition={{ duration: 1.1, delay: p.delay, ease: "easeOut" }}
          className="absolute w-1.5 h-3 rounded-sm" style={{ background: p.color }} />
      ))}
    </div>
  );
}

function RewardChip({ icon: Icon, label, value, color }) {
  return (
    <div className="rounded-lg p-2.5" style={{ background: CAMPUS.paper }}>
      <Icon size={14} className="mx-auto mb-1" style={{ color }} />
      <p className="text-[13px] font-bold" style={{ color: CAMPUS.ink }}>{value}</p>
      <p className="text-[9px] font-mono tracking-wide" style={{ color: CAMPUS.inkFaint }}>{label}</p>
    </div>
  );
}

// "Next Problem" only appears when a real next problem was actually
// computed (see CampusProblemView's `nextProblem`) - never a dead-end
// button. There's no "View Solution" here: no problem doc in this schema
// carries reference-solution content, so a button promising one would just
// be decoration - see this file's own scope note further down.
function CodeLabSuccessDialog({ verdict, problemTitle, hasNext, onNext, onBackToList, backLabel = "Problems", onClose }) {
  return (
    <AnimatePresence>
      {verdict && (
        <>
          <motion.div key="backdrop" onClick={onClose} className="fixed inset-0 z-[80]"
            style={{ background: "rgba(10,16,20,0.55)", backdropFilter: "blur(4px)" }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
          <motion.div key="dialog" role="dialog" aria-modal="true" className="fixed z-[81] left-1/2 top-1/2 w-[92vw] max-w-[440px] p-6 overflow-hidden"
            style={{ background: CAMPUS.surface, border: `1px solid ${CAMPUS.line}`, borderRadius: 16, boxShadow: CAMPUS.shadowLg }}
            initial={{ opacity: 0, scale: 0.95, x: "-50%", y: "-45%" }} animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }} exit={{ opacity: 0, scale: 0.95, x: "-50%", y: "-45%" }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}>
            <ConfettiBurst />
            <div className="relative text-center">
              <div className="w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ background: CAMPUS.goodTint, color: CAMPUS.good }}>
                <PartyPopper size={26} />
              </div>
              <h3 className="text-[18px] font-bold mb-1" style={{ color: CAMPUS.ink }}>Problem Solved!</h3>
              <p className="text-[13px] mb-4" style={{ color: CAMPUS.inkSoft }}>{problemTitle}</p>
              <div className="flex items-center justify-center gap-1.5 text-[13px] font-semibold mb-4" style={{ color: CAMPUS.good }}>
                <CheckCircle2 size={14} /> All {verdict.testsTotal} test case{verdict.testsTotal === 1 ? "" : "s"} passed
              </div>
              {/* DSA Practice tracks completion/streak but no longer grants XP/Coins
                  (only Daily Learning, Programming, and CS Core do) - these three
                  chips are all non-reward stats, never a claim of something earned. */}
              <div className="grid grid-cols-3 gap-2 mb-5">
                <RewardChip icon={Flame} label="STREAK" value={verdict.streak != null ? `${verdict.streak}d` : "-"} color={CAMPUS.warn} />
                <RewardChip icon={Clock} label="RUNTIME" value={`${verdict.runtimeMs ?? 0}ms`} color={CAMPUS.blue} />
                <RewardChip icon={MemoryStick} label="MEMORY" value={`${verdict.memoryKb ?? 0}KB`} color={CAMPUS.blue} />
              </div>
              <div className="flex flex-col gap-2">
                {hasNext && (
                  <button onClick={onNext} className="text-[13px] font-semibold py-2.5 rounded-lg flex items-center justify-center gap-1.5" style={{ background: CAMPUS.teal, color: "#fff" }}>
                    Next Problem <ArrowRight size={13} />
                  </button>
                )}
                <button onClick={onBackToList} className="text-[12.5px] font-medium py-2.5 rounded-lg" style={{ border: `1px solid ${CAMPUS.line}`, color: CAMPUS.inkSoft }}>
                  Back to {backLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function CodeLabFailDialog({ verdict, onViewFailed, onRetry }) {
  return (
    <AnimatePresence>
      {verdict && (
        <>
          <motion.div key="backdrop" onClick={onRetry} className="fixed inset-0 z-[80]"
            style={{ background: "rgba(10,16,20,0.55)", backdropFilter: "blur(4px)" }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
          <motion.div key="dialog" role="dialog" aria-modal="true" className="fixed z-[81] left-1/2 top-1/2 w-[92vw] max-w-[400px] p-6"
            style={{ background: CAMPUS.surface, border: `1px solid ${CAMPUS.line}`, borderRadius: 16, boxShadow: CAMPUS.shadowLg }}
            initial={{ opacity: 0, scale: 0.95, x: "-50%", y: "-45%" }} animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }} exit={{ opacity: 0, scale: 0.95, x: "-50%", y: "-45%" }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}>
            <div className="text-center">
              <div className="w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ background: CAMPUS.badTint, color: CAMPUS.bad }}>
                <XCircle size={26} />
              </div>
              <h3 className="text-[17px] font-bold mb-1" style={{ color: CAMPUS.ink }}>Almost there</h3>
              <p className="text-[13px] mb-5" style={{ color: CAMPUS.inkSoft }}>
                <b style={{ color: CAMPUS.ink }}>{verdict.testsPassed} / {verdict.testsTotal}</b> test cases passed. Review the failed cases and try again.
              </p>
              <div className="flex gap-2">
                <button onClick={onViewFailed} className="flex-1 text-[12.5px] font-semibold py-2.5 rounded-lg" style={{ background: CAMPUS.teal, color: "#fff" }}>
                  View Failed Cases
                </button>
                <button onClick={onRetry} className="flex-1 text-[12.5px] font-medium py-2.5 rounded-lg flex items-center justify-center gap-1.5" style={{ border: `1px solid ${CAMPUS.line}`, color: CAMPUS.inkSoft }}>
                  <RefreshCw size={12} /> Retry
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function CampusProblemView({ problemId, onBack, onSelectProblem, backLabel = "Problems", suppressReward = false, contextOrder = null }) {
  const { user } = useAuth();

  // Opening a problem is a navigation, so it starts at the top of the problem.
  // Nothing reset the scroll before this: every caller (the DSA sheet, a
  // concept's related-problems list, the problem list, Daily Learning, a CS
  // Core lesson) swaps this view in where the previous screen was, so tapping a
  // row 3000px down a long sheet dropped the learner into the middle of the
  // problem statement. Keyed on problemId, not mount, because "Next problem"
  // changes the prop without remounting.
  useEffect(() => {
    if (typeof window !== "undefined") window.scrollTo(0, 0);
  }, [problemId]);

  const [problem, setProblem] = useState(null);
  const [sampleTests, setSampleTests] = useState([]);
  const [solved, setSolved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [allProblems, setAllProblems] = useState([]);

  const [language, setLanguage] = useState("java");
  const [code, setCode] = useState(STARTER_CODE.java);
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitStageIndex, setSubmitStageIndex] = useState(0);
  const [error, setError] = useState("");
  const [revealedHints, setRevealedHints] = useState(0);
  const [activeSolution, setActiveSolution] = useState(null);
  // Defaults open - "story before theory" (see campus-cscore.jsx/
  // campus-programming.jsx's identical framing) means this should be the
  // first thing a student reads, not something buried behind a click.
  const [showSimpleExplanation, setShowSimpleExplanation] = useState(true);

  // resultsView: null, or { kind: "run"|"submit", verdict?, items: [...] } -
  // one shape covers both Run's sample-test cards (with a real diff) and
  // Submit's pass/fail summaries (sample+hidden, never a diff - see
  // TestCaseCard's own comment on why).
  const [resultsView, setResultsView] = useState(null);
  const [consoleText, setConsoleText] = useState("");
  const [draftRestoredNotice, setDraftRestoredNotice] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelHeight, setPanelHeight] = useState(260);
  const [panelTab, setPanelTab] = useState("tests");

  const [historyItems, setHistoryItems] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [activeSubmissionId, setActiveSubmissionId] = useState(null);

  const [successVerdict, setSuccessVerdict] = useState(null);
  const [failVerdict, setFailVerdict] = useState(null);

  // Horizontal split between Statement and Editor - desktop only, same
  // drag-a-handle pattern as the results panel's own vertical resize below.
  const [statementPct, setStatementPct] = useState(50);
  const isDesktop = useIsDesktop();
  const splitContainerRef = useRef(null);
  const draggingH = useRef(false);

  useEffect(() => {
    const onMove = (e) => {
      if (!draggingH.current || !splitContainerRef.current) return;
      const rect = splitContainerRef.current.getBoundingClientRect();
      const pct = ((e.clientX - rect.left) / rect.width) * 100;
      setStatementPct(Math.min(70, Math.max(30, pct)));
    };
    const onUp = () => { draggingH.current = false; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, []);

  const loadProblem = () => {
    if (!problemId) { setLoading(false); return; }
    setLoading(true); setFetchError(false);
    Promise.all([fetchProblem(problemId), fetchSampleTests(problemId)])
      .then(([p, tests]) => { setProblem(p); setSampleTests(tests); })
      .catch(() => setFetchError(true))
      .finally(() => setLoading(false));
  };
  useEffect(loadProblem, [problemId]);

  useEffect(() => {
    if (!user || !problemId) return;
    const unsubscribe = subscribeToCodelabProgress(user.uid, p => setSolved(!!p.solvedProblems?.[problemId]));
    return unsubscribe;
  }, [user, problemId]);

  // A fresh problem (via Next Problem or picking a new one from the list)
  // should never show the previous problem's stale run/submit state.
  useEffect(() => {
    setResultsView(null); setConsoleText(""); setPanelOpen(false); setError("");
    setActiveSubmissionId(null); setHistoryItems(null); setRevealedHints(0); setActiveSolution(null);
  }, [problemId]);

  // Restores unsubmitted code (any device, any session) instead of always
  // starting from STARTER_CODE - the whole point of saveCodeDraft below.
  // skipNextCodeSave is set synchronously here, before the async fetch below
  // resolves, so the autosave effect doesn't immediately re-write back the
  // exact draft it just restored as if it were a fresh edit.
  const skipNextCodeSave = useRef(true);
  useEffect(() => {
    skipNextCodeSave.current = true;
    if (!user || !problemId) {
      setLanguage("java"); setCode(STARTER_CODE.java);
      setConsoleText(""); setPanelOpen(false); setPanelTab("tests");
      return;
    }
    let cancelled = false;
    fetchCodeDraft(user.uid, problemId).then(draft => {
      if (cancelled) return;
      // Only a genuinely-edited draft counts as "restored" - a draft whose
      // code is still exactly the untouched starter for its language isn't
      // work the student would recognize as theirs coming back.
      const isRealDraft = !!draft?.code && draft.code !== STARTER_CODE[draft.language || "java"];
      if (draft?.code) { setLanguage(draft.language || "java"); setCode(draft.code); }
      else { setLanguage("java"); setCode(STARTER_CODE.java); }
      // Last execution output and expanded-panel state restore alongside the
      // code itself - a draft with no saved panel state yet (an older draft
      // from before these fields existed) falls back to today's defaults.
      setConsoleText(draft?.consoleText || "");
      setPanelOpen(!!draft?.panelOpen);
      setPanelTab(draft?.panelTab || "tests");
      if (isRealDraft) {
        setDraftRestoredNotice(true);
        setTimeout(() => setDraftRestoredNotice(false), 4000);
      }
    }).catch(() => {
      if (cancelled) return;
      setLanguage("java"); setCode(STARTER_CODE.java);
      setConsoleText(""); setPanelOpen(false); setPanelTab("tests");
    });
    return () => { cancelled = true; };
  }, [user, problemId]);

  // Debounced periodic autosave - fires on every code/language/console-
  // output/panel-state change except the one caused by the restore effect
  // above. handleRun/handleSubmit below additionally save immediately (not
  // debounced) before firing their real request, and the visibility/unload
  // listeners below save immediately when the student switches tabs or
  // leaves, so unsubmitted work is covered by more than just the
  // idle-debounce window.
  useEffect(() => {
    if (skipNextCodeSave.current) { skipNextCodeSave.current = false; return; }
    if (!user || !problemId) return;
    const t = setTimeout(() => { saveCodeDraft(user.uid, problemId, { language, code, consoleText, panelOpen, panelTab }).catch(() => {}); }, 2000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, language, consoleText, panelOpen, panelTab]);

  // "Save before leaving the page" / "save when switching tabs" - fires
  // immediately (no debounce) rather than waiting on the idle timer above,
  // since both events mean the debounce may never get a chance to fire.
  useEffect(() => {
    if (!user || !problemId) return;
    const saveNow = () => { saveCodeDraft(user.uid, problemId, { language, code, consoleText, panelOpen, panelTab }).catch(() => {}); };
    const onVisibility = () => { if (document.visibilityState === "hidden") saveNow(); };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("beforeunload", saveNow);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("beforeunload", saveNow);
    };
  }, [user, problemId, language, code, consoleText, panelOpen, panelTab]);

  // Fetched once, used only to compute "Next Problem" - not shown as a list
  // here, so one fetch for the lifetime of this view is enough.
  useEffect(() => {
    fetchPublishedProblems().then(setAllProblems).catch(() => {});
  }, []);

  // When opened from the DSA Sheet or a Concept's related-problems list,
  // `contextOrder` carries that curriculum's own full id order (see
  // campus-app.jsx's openProblem/campus-dsa-sheet.jsx's/
  // campus-dsa-concepts.jsx's openProblemWithContext) - "Next Problem"
  // follows THAT instead of the plain category/number sort below, which is
  // otherwise blind to what the student was actually working through and
  // could drop them into an unrelated category (or one they already solved).
  // Falls through to the global sort if contextOrder doesn't contain this
  // problem (shouldn't normally happen) so a stale/mismatched order degrades
  // to today's behavior rather than showing no next problem at all.
  const nextProblem = useMemo(() => {
    if (contextOrder && contextOrder.length > 0) {
      const idx = contextOrder.indexOf(problemId);
      if (idx !== -1) {
        return idx < contextOrder.length - 1 ? (allProblems.find(p => p.id === contextOrder[idx + 1]) || null) : null;
      }
    }
    if (!problem || allProblems.length === 0) return null;
    const sorted = [...allProblems].sort((a, b) =>
      (a.category || "").localeCompare(b.category || "") ||
      (a.number ?? 0) - (b.number ?? 0) ||
      (a.title || "").localeCompare(b.title || ""));
    const idx = sorted.findIndex(p => p.id === problemId);
    return idx >= 0 && idx < sorted.length - 1 ? sorted[idx + 1] : null;
  }, [problem, allProblems, problemId, contextOrder]);

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    setCode(STARTER_CODE[lang] || "");
    setResultsView(null);
    setActiveSubmissionId(null);
  };

  const handleRun = async () => {
    if (user && problemId) saveCodeDraft(user.uid, problemId, { language, code }).catch(() => {});
    setRunning(true); setError(""); setPanelOpen(true); setPanelTab("tests");
    try {
      const results = await Promise.all(sampleTests.map(async (t, i) => {
        const res = await runCode({ language, code, stdin: t.input });
        const pass = (res.stdout || "").trim() === (t.expectedOutput || "").trim();
        return {
          label: `Sample Test ${i + 1}`, passed: pass,
          verdict: pass ? "Accepted" : (res.status === "success" ? "Wrong Answer" : "Error"),
          input: t.input, expected: t.expectedOutput, actual: res.stdout, stderr: res.stderr,
        };
      }));
      setResultsView({ kind: "run", items: results });
      setConsoleText(results.map(r => `$ ${r.label}\n${r.actual || ""}${r.stderr ? "\n" + r.stderr : ""}`).join("\n\n"));
    } catch (e) { setError(e.message); }
    finally { setRunning(false); }
  };

  const handleSubmit = async () => {
    if (user && problemId) saveCodeDraft(user.uid, problemId, { language, code }).catch(() => {});
    setSubmitting(true); setError(""); setSubmitStageIndex(0); setPanelOpen(true); setPanelTab("tests");
    const stageTimer = setInterval(() => setSubmitStageIndex(i => Math.min(i + 1, SUBMIT_STAGES.length - 1)), 550);
    // Real request and a minimum display time for the staged text run
    // together - the dialog only opens once BOTH are done, so a fast
    // response doesn't skip straight past "Submitting..." to "Done!".
    const minDelay = new Promise(resolve => setTimeout(resolve, 550 * (SUBMIT_STAGES.length - 1)));
    try {
      const [result] = await Promise.all([submitCode({ problemId, language, code, suppressReward }), minDelay]);
      const items = (result.testSummaries || []).map(t => ({ label: t.label, passed: t.passed, verdict: t.verdict }));
      setResultsView({ kind: "submit", verdict: result, items });
      setActiveSubmissionId(null);
      if (result.verdict === "Accepted") {
        setSolved(true);
        setSuccessVerdict(result);
      } else {
        setFailVerdict(result);
      }
      if (user) fetchProblemSubmissions(user.uid, problemId).then(setHistoryItems).catch(() => {});
    } catch (e) {
      setError(e.message);
    } finally {
      clearInterval(stageTimer);
      setSubmitting(false);
    }
  };

  const loadHistory = () => {
    if (!user || historyItems !== null || historyLoading) return;
    setHistoryLoading(true);
    fetchProblemSubmissions(user.uid, problemId).then(setHistoryItems).catch(() => setHistoryItems([])).finally(() => setHistoryLoading(false));
  };

  const handleReopenSubmission = (submission) => {
    setLanguage(submission.language);
    setCode(submission.code || "");
    setActiveSubmissionId(submission.id);
    const items = (submission.testSummaries || []).map(t => ({ label: t.label, passed: t.passed, verdict: t.verdict }));
    setResultsView({ kind: "submit", verdict: submission, items });
    setPanelTab("tests");
    setPanelOpen(true);
  };

  const goToNextProblem = () => {
    setSuccessVerdict(null);
    // contextOrder carries forward unchanged - the sheet/concept's own order
    // doesn't change as the student moves through it, only their position
    // in it does (recomputed above from the new problemId next render).
    if (nextProblem && onSelectProblem) onSelectProblem(nextProblem.id, contextOrder);
    else onBack();
  };

  if (loading) {
    return (
      <div className="grid lg:grid-cols-2 gap-5 items-start">
        <CampusCard className="p-5 space-y-3">
          <CampusSkeleton variant="rect" width={90} height={16} />
          <CampusSkeleton variant="text" width="80%" height={22} />
          <CampusSkeleton variant="text" />
          <CampusSkeleton variant="text" width="60%" />
        </CampusCard>
        <CampusCard style={{ height: 420 }} className="p-5">
          <CampusSkeleton variant="rect" height="100%" />
        </CampusCard>
      </div>
    );
  }
  if (!problem) {
    return (
      <div>
        <CampusBackButton onClick={onBack} label={backLabel} />
        {fetchError ? (
          <CampusEmptyState icon={AlertTriangle} color={CAMPUS.bad} title="Couldn't load this problem"
            description="Check your connection and try again."
            action={<CampusButton variant="secondary" size="sm" onClick={loadProblem}>Retry</CampusButton>} />
        ) : (
          <CampusEmptyState icon={Code2} title="Problem not found" description="This problem may have been unpublished or removed." />
        )}
      </div>
    );
  }

  const rate = acceptanceRate(problem);

  return (
    <div>
      <CampusBreadcrumb items={[{ label: backLabel, onClick: onBack }, { label: problem.title }]} />

      <div ref={splitContainerRef} className="flex flex-col lg:flex-row items-start lg:items-stretch gap-5 lg:gap-0">
        {/* Statement */}
        <div className="w-full min-w-0 flex" style={isDesktop ? { flex: `0 0 calc(${statementPct}% - 5px)` } : undefined}>
        <CampusCard className="w-full h-full flex flex-col">
          {SOLUTION_APPROACHES.filter(k => problem.solutions?.[k]?.explanation).length > 0 && (
            <div className="p-3" style={{ borderBottom: `1px solid ${CAMPUS.line}` }}>
              <div className="no-scrollbar flex items-center gap-1.5 flex-nowrap overflow-x-auto">
                {SOLUTION_APPROACHES.filter(k => problem.solutions?.[k]?.explanation).map(k => {
                  const active = activeSolution === k;
                  return (
                    <button key={k} onClick={() => setActiveSolution(active ? null : k)}
                      className="flex-shrink-0 whitespace-nowrap text-[11.5px] font-semibold px-3 py-1.5 rounded-lg transition-all"
                      style={{
                        background: active ? CAMPUS.purpleTint : CAMPUS.paper,
                        color: active ? CAMPUS.purple : CAMPUS.inkSoft,
                        border: `1.5px solid ${active ? CAMPUS.purple : CAMPUS.line}`,
                        boxShadow: active ? CAMPUS.shadow : "none",
                      }}>
                      {problem.solutions[k].title || SOLUTION_LABELS[k]}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          <div className="p-5">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <CampusChip color={CAMPUS.inkFaint}>{problem.category}</CampusChip>
              <CampusChip color={DIFF_COLOR[problem.difficulty] || CAMPUS.good}>{problem.difficulty}</CampusChip>
              {rate !== null && <span className="text-[11px]" style={{ color: CAMPUS.inkFaint }}>{rate}% acceptance</span>}
              <div className="ml-auto flex items-center gap-2">
                {problem.videoUrl && (
                  <a href={problem.videoUrl} target="_blank" rel="noreferrer" title="Watch video explanation"
                    className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition-colors"
                    style={{ color: CAMPUS.bad, border: `1px solid ${tint(CAMPUS.bad, 25)}`, background: CAMPUS.badTint }}>
                    <Youtube size={13} /> Watch
                  </a>
                )}
                {solved && <CampusChip color={CAMPUS.good} icon={CheckCircle2}>SOLVED</CampusChip>}
              </div>
            </div>
            <h1 className="text-xl font-bold mb-4" style={{ color: CAMPUS.ink }}>
              {problem.number != null && <span style={{ color: CAMPUS.inkFaint }}>{problem.number}. </span>}
              {problem.title}
            </h1>

            {activeSolution && problem.solutions?.[activeSolution]?.explanation && (
              <div className="rounded-lg p-3.5 mb-4" style={{ background: CAMPUS.purpleTint, border: `1px solid ${tint(CAMPUS.purple, 26)}` }}>
                <p className="text-xs leading-relaxed whitespace-pre-wrap" style={{ color: CAMPUS.inkSoft }}>{problem.solutions[activeSolution].explanation}</p>
                {(problem.solutions[activeSolution].timeComplexity || problem.solutions[activeSolution].spaceComplexity) && (
                  <div className="flex items-center gap-4 text-[11px] font-mono mt-2.5 pt-2.5" style={{ color: CAMPUS.purple, borderTop: `1px solid ${tint(CAMPUS.purple, 15)}` }}>
                    {problem.solutions[activeSolution].timeComplexity && <span>Time: {problem.solutions[activeSolution].timeComplexity}</span>}
                    {problem.solutions[activeSolution].spaceComplexity && <span>Space: {problem.solutions[activeSolution].spaceComplexity}</span>}
                  </div>
                )}
              </div>
            )}

            {hasSimpleExplanation(problem) && (
              <div className="rounded-lg mb-4 overflow-hidden" style={{ background: CAMPUS.goldTint, border: `1px solid ${tint(CAMPUS.gold, 25)}` }}>
                <button onClick={() => setShowSimpleExplanation(o => !o)} className="w-full flex items-center gap-2 p-3.5 text-left">
                  <Lightbulb size={14} style={{ color: CAMPUS.gold, flexShrink: 0 }} />
                  <span className="text-[12.5px] font-semibold flex-1" style={{ color: CAMPUS.ink }}>Simple Explanation</span>
                  {showSimpleExplanation ? <ChevronUp size={14} style={{ color: CAMPUS.inkFaint }} /> : <ChevronDown size={14} style={{ color: CAMPUS.inkFaint }} />}
                </button>
                {showSimpleExplanation && (
                  <div className="px-3.5 pb-3.5 space-y-3">
                    {problem.simpleExplanation && (
                      <p className="text-xs leading-relaxed whitespace-pre-wrap" style={{ color: CAMPUS.inkSoft }}>{problem.simpleExplanation}</p>
                    )}
                    {problem.realWorldAnalogy && (
                      <SimpleExplanationBlock title="Real-World Analogy" text={problem.realWorldAnalogy} />
                    )}
                    {problem.visualWalkthrough?.length > 0 && (
                      <div>
                        <p className="text-[10px] font-mono tracking-widest mb-1.5" style={{ color: CAMPUS.inkFaint }}>VISUAL WALKTHROUGH</p>
                        <div className="space-y-1.5">
                          {problem.visualWalkthrough.map((step, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs" style={{ color: CAMPUS.inkSoft }}>
                              <span className="font-mono font-semibold flex-shrink-0" style={{ color: CAMPUS.gold }}>{i + 1}.</span>
                              <span className="whitespace-pre-wrap">{step}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {problem.dryRun && <SimpleExplanationBlock title="Dry Run" text={problem.dryRun} />}
                    {problem.bruteForceIntuition && <SimpleExplanationBlock title="Brute Force Intuition" text={problem.bruteForceIntuition} />}
                    {problem.optimizedIntuition && <SimpleExplanationBlock title="Optimized Intuition" text={problem.optimizedIntuition} />}
                    {(problem.timeComplexityPlain || problem.spaceComplexityPlain) && (
                      <div className="grid sm:grid-cols-2 gap-3">
                        {problem.timeComplexityPlain && <SimpleExplanationBlock title="Time Complexity" text={problem.timeComplexityPlain} icon={Clock} />}
                        {problem.spaceComplexityPlain && <SimpleExplanationBlock title="Space Complexity" text={problem.spaceComplexityPlain} icon={MemoryStick} />}
                      </div>
                    )}
                    {problem.keyObservation && <SimpleExplanationBlock title="Key Observation" text={problem.keyObservation} />}
                    {problem.interviewTip && <SimpleExplanationBlock title="Interview Tip" text={problem.interviewTip} />}
                  </div>
                )}
              </div>
            )}

            <p className="text-xs leading-relaxed whitespace-pre-wrap mb-4" style={{ color: CAMPUS.inkSoft }}>{problem.statement}</p>

            {problem.inputFormat && (
              <div className="mb-4">
                <p className="text-[9px] font-mono tracking-widest mb-1" style={{ color: CAMPUS.inkFaint }}>INPUT FORMAT</p>
                <p className="text-xs leading-relaxed whitespace-pre-wrap" style={{ color: CAMPUS.inkFaint }}>{problem.inputFormat}</p>
              </div>
            )}
            {problem.outputFormat && (
              <div className="mb-4">
                <p className="text-[9px] font-mono tracking-widest mb-1" style={{ color: CAMPUS.inkFaint }}>OUTPUT FORMAT</p>
                <p className="text-xs leading-relaxed whitespace-pre-wrap" style={{ color: CAMPUS.inkFaint }}>{problem.outputFormat}</p>
              </div>
            )}
            {problem.constraints && (
              <div className="mb-4">
                <p className="text-[9px] font-mono tracking-widest mb-1" style={{ color: CAMPUS.inkFaint }}>CONSTRAINTS</p>
                <p className="text-xs whitespace-pre-wrap" style={{ color: CAMPUS.inkFaint }}>{problem.constraints}</p>
              </div>
            )}
            {problem.examplesText && (
              <div className="mb-4">
                <p className="text-[9px] font-mono tracking-widest mb-1" style={{ color: CAMPUS.inkFaint }}>EXAMPLES</p>
                <pre className="text-xs whitespace-pre-wrap rounded-lg p-3" style={{ color: CAMPUS.inkFaint, background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}` }}>{problem.examplesText}</pre>
              </div>
            )}
            {problem.edgeCases && (
              <div className="mb-4">
                <p className="text-[9px] font-mono tracking-widest mb-1" style={{ color: CAMPUS.inkFaint }}>EDGE CASES TO CONSIDER</p>
                <p className="text-xs leading-relaxed whitespace-pre-wrap" style={{ color: CAMPUS.inkFaint }}>{problem.edgeCases}</p>
              </div>
            )}
            {/* Sourced from the SAME solutions.optimal (falling back to better/
                brute) an admin already writes in the Video & Solutions editor -
                not a new fact, just a labeled, always-visible section for data
                that previously only surfaced when a student expanded that
                specific solution tab. */}
            {(() => {
              const best = problem.solutions?.optimal || problem.solutions?.better || problem.solutions?.brute;
              if (!best?.timeComplexity && !best?.spaceComplexity) return null;
              return (
                <div className="mb-4">
                  <p className="text-[9px] font-mono tracking-widest mb-1" style={{ color: CAMPUS.inkFaint }}>EXPECTED COMPLEXITY</p>
                  <div className="flex items-center gap-4 text-xs font-mono" style={{ color: CAMPUS.inkFaint }}>
                    {best.timeComplexity && <span>Time: {best.timeComplexity}</span>}
                    {best.spaceComplexity && <span>Space: {best.spaceComplexity}</span>}
                  </div>
                </div>
              );
            })()}
            {problem.hints?.length > 0 && (
              <div className="mb-2">
                <p className="text-[9px] font-mono tracking-widest mb-1.5 flex items-center gap-1" style={{ color: CAMPUS.inkFaint }}><Lightbulb size={10} /> HINTS</p>
                <div className="space-y-1.5">
                  {problem.hints.slice(0, revealedHints).map((h, i) => (
                    <p key={i} className="text-xs rounded-lg p-2.5" style={{ color: CAMPUS.inkFaint, border: `1px solid ${CAMPUS.line}` }}>{h}</p>
                  ))}
                </div>
                {revealedHints < problem.hints.length && (
                  <button onClick={() => setRevealedHints(n => n + 1)} className="mt-1.5 text-[10px] hover:underline" style={{ color: CAMPUS.purple }}>
                    reveal hint {revealedHints + 1} of {problem.hints.length} →
                  </button>
                )}
              </div>
            )}
          </div>
        </CampusCard>
        </div>

        {/* Drag handle - desktop only; below lg the two panels stack and
            there's nothing horizontal left to resize. */}
        <div onMouseDown={() => { draggingH.current = true; }}
          className="hidden lg:flex w-2.5 flex-shrink-0 self-stretch cursor-col-resize items-center justify-center">
          <div className="w-[3px] h-10 rounded-full" style={{ background: CAMPUS.line }} />
        </div>

        {/* Editor */}
        <div className="w-full min-w-0 flex" style={isDesktop ? { flex: `1 1 calc(${100 - statementPct}% - 5px)` } : undefined}>
        <CampusCard className="w-full h-full flex flex-col">
          <AnimatePresence>
            {draftRestoredNotice && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-1.5 text-[11px] font-medium px-3 pt-2 flex-shrink-0 overflow-hidden"
                style={{ color: CAMPUS.teal }}>
                <History size={12} /> Draft restored successfully.
              </motion.div>
            )}
          </AnimatePresence>
          <div className="flex items-center gap-2 p-3 flex-wrap flex-shrink-0" style={{ borderBottom: `1px solid ${CAMPUS.line}` }}>
            <div className="flex items-center gap-1.5 flex-wrap">
              {CODELAB_LANGUAGES.map(l => {
                const color = LANGUAGE_COLOR[l.id] || CAMPUS.teal;
                const active = language === l.id;
                return (
                  <button key={l.id} onClick={() => handleLanguageChange(l.id)}
                    className="text-[11.5px] font-mono font-semibold px-3 py-1.5 rounded-lg transition-all"
                    style={{
                      background: active ? tint(color, 18) : tint(color, 6),
                      color,
                      border: `1.5px solid ${active ? color : `${color}35`}`,
                      boxShadow: active ? CAMPUS.shadow : "none",
                    }}>
                    {l.label}
                  </button>
                );
              })}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button onClick={() => { navigator.clipboard?.writeText(code); }} title="Copy" style={{ color: CAMPUS.inkFaint }}><Copy size={13} /></button>
              <button onClick={() => setCode(STARTER_CODE[language] || "")} title="Reset" style={{ color: CAMPUS.inkFaint }}><RotateCcw size={13} /></button>
            </div>
          </div>

          {/* Monaco is desktop/tablet only - same graceful degradation as the
              main app's CodeLab (mobile isn't meant for writing full programs) */}
          <div className="hidden lg:block flex-1 min-h-0" style={{ minHeight: 420 }}>
            <MonacoEditor
              height="100%"
              language={CODELAB_LANGUAGES.find(l => l.id === language)?.monacoId || "plaintext"}
              theme="light"
              value={code}
              onChange={(v) => setCode(v || "")}
              options={{ fontSize: 13, minimap: { enabled: false }, automaticLayout: true, wordWrap: "on" }}
            />
          </div>
          <div className="lg:hidden p-8 text-center">
            <Monitor size={24} className="mx-auto mb-3" style={{ color: CAMPUS.inkFaint }} />
            <p className="text-xs" style={{ color: CAMPUS.inkSoft }}>Switch to a larger screen to use the code editor.</p>
          </div>

          <div className="p-4 space-y-3 flex-shrink-0" style={{ borderTop: `1px solid ${CAMPUS.line}` }}>
            {!user ? (
              <SignInPrompt message="You'll need a DeVert account to submit for grading." />
            ) : (
              <div className="hidden lg:flex gap-2">
                <button onClick={handleRun} disabled={running || sampleTests.length === 0}
                  className="flex-1 text-xs font-semibold py-2.5 rounded-lg disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
                  style={{ color: CAMPUS.teal, border: `1px solid ${tint(CAMPUS.teal, 31)}`, background: CAMPUS.tealTint }}>
                  <Play size={12} /> {running ? "running..." : "run"}
                </button>
                <button onClick={handleSubmit} disabled={submitting}
                  className="flex-1 text-xs font-semibold py-2.5 rounded-lg disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
                  style={{ color: CAMPUS.good, border: `1px solid ${tint(CAMPUS.good, 31)}`, background: CAMPUS.goodTint }}>
                  <Send size={12} /> {submitting ? "submitting..." : "submit"}
                </button>
              </div>
            )}

            {error && <p className="text-[10px]" style={{ color: CAMPUS.bad }}>{error}</p>}
            {submitting && <SubmitProgressLine stageIndex={submitStageIndex} />}
          </div>
        </CampusCard>
        </div>
      </div>

      {/* Results panel - full width, a shared workspace below BOTH the
          statement and the editor, not tucked under just one side of them. */}
      {user && (
        <CampusCard className="mt-5 overflow-hidden">
          <CampusResultsPanel
            open={panelOpen} onToggleOpen={setPanelOpen}
            height={panelHeight} onHeightChange={setPanelHeight}
            tab={panelTab} onTabChange={setPanelTab}
            resultsView={resultsView} consoleText={consoleText}
            historyItems={historyItems} historyLoading={historyLoading} onLoadHistory={loadHistory}
            onReopenSubmission={handleReopenSubmission} activeSubmissionId={activeSubmissionId}
          />
        </CampusCard>
      )}

      <CodeLabSuccessDialog
        verdict={successVerdict} problemTitle={problem.title} hasNext={!!nextProblem}
        onNext={goToNextProblem} onBackToList={onBack} backLabel={backLabel} onClose={() => setSuccessVerdict(null)}
      />
      <CodeLabFailDialog
        verdict={failVerdict}
        onViewFailed={() => setFailVerdict(null)}
        onRetry={() => setFailVerdict(null)}
      />
    </div>
  );
}
