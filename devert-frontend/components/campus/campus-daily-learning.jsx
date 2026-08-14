"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, XCircle, Circle, Lock, BookOpen, Code2, Zap, Coins, ClipboardCheck,
  ChevronRight, X as CloseIcon, Trophy, Medal, Target, AlertTriangle, Info,
  Briefcase, ArrowRight, Lightbulb, ListChecks, Clock, Pencil, Calculator, GraduationCap,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { fetchProblem, subscribeToCodelabProgress } from "@/lib/codelab";
import {
  DOW_LABELS, DOW_ORDER, mondayOf, todayISO, fetchWeekItems, fetchLog,
  fetchUserWeekLogs, submitDayCompletion, saveDraftProgress, fetchDayLeaderboard, fetchWeekTests,
  fetchModuleConfig, grantDailyLearningProblemReward, TRACK_CATALOG, fetchTrackProgress,
  isSameDayAsToday, shiftWeek,
} from "@/lib/dailyLearning";
import { CAMPUS, tint } from "@/lib/campus-theme";
import { shuffleQuizForAttempt, buildQuizSeedKey } from "@/lib/quizRandom";
import {
  CampusCard, CampusChip, CampusTable, CampusSkeleton, CampusEmptyState, CampusBackButton, CampusButton, CampusBreadcrumb,
} from "@/components/campus/campus-ui";
import { CampusProblemView } from "@/components/campus/campus-practice";
import { CampusLearningSection } from "@/components/campus/campus-learning";
import { useCampusBackHandler } from "@/lib/campusNav";
import { useCampusScope } from "@/lib/campusPermissions";
import { LessonBody, InfoListCard, CodeExampleBlock } from "@/components/campus/lesson-blocks";

// Institution-scoped Mon-Sat structured learning, backed by
// institutions/{slug}/dailyLearning (see lib/dailyLearning.js for the
// schema rationale). Entirely separate from the generic global `courses`
// collection campus-learning.jsx reads - so an institution with no weekly
// program configured still falls back to that generic catalog unchanged,
// while one that has real weekly content (MRCET) never shows the generic
// catalog at all.

const DIFF_COLOR = { Easy: CAMPUS.good, Medium: CAMPUS.warn, Hard: CAMPUS.bad };

function dayStatus(item, log) {
  if (item.date > todayISO()) return "locked";
  // completedAt specifically, not mere doc existence - a draft-only doc
  // (saveDraftProgress writes readAt/draftAnswers well before a real
  // submission) must still show as "open", not "done".
  if (log?.completedAt) return "done";
  return "open";
}

// The lesson body (`item.concept`) is one freeform string, and the parser +
// renderers that turn it into prose/callouts/diagrams/checkpoints now live in
// components/campus/lesson-blocks.jsx (+ lib/lessonBlocks.js), shared with
// every other learning module. They were originally defined here, which meant
// CS Core, Programming, Aptitude and Company Prep all imported their lesson
// rendering out of the *Daily Learning* file - see that module's header for
// the format itself.

function NextLessonCard({ dayCompleted, nextItem, onGoToNext }) {
  if (!nextItem) return null;
  return (
    <button onClick={onGoToNext} className="w-full text-left mt-2">
      <CampusCard hover className="p-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: CAMPUS.tealTint, color: CAMPUS.teal }}>
          {nextItem.type === "test" ? <ClipboardCheck size={16} /> : <BookOpen size={16} />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[9.5px] font-mono tracking-widest mb-0.5" style={{ color: CAMPUS.inkFaint }}>{dayCompleted ? "COMPLETED · UP NEXT" : "UP NEXT"}</p>
          <b className="block text-[13.5px] truncate" style={{ color: CAMPUS.ink }}>{nextItem.title}</b>
        </div>
        <span className="flex items-center gap-1 text-[12px] font-semibold flex-shrink-0" style={{ color: CAMPUS.teal }}>Continue <ArrowRight size={13} /></span>
      </CampusCard>
    </button>
  );
}

// ---------------- Landing page (track picker) ----------------

// Not yet real TRACK_CATALOG entries - just a visual teaser so the landing
// page matches the product spec's "Coming Soon" row. Deliberately static
// (no Firestore doc, no click handler) since these tracks have no content
// model yet; each becomes a real TRACK_CATALOG entry (see lib/dailyLearning.js)
// the day it's actually built, at which point it moves out of this list.
// GATE Prep Series lived here until it was discovered the GATE module
// already has its own real, working "Daily GATE" plan (GateDaily, driven by
// lib/gate.js's fetchDailyPlan) - not a placeholder, so it gets a real,
// clickable shortcut below instead of a disabled teaser tile.
const COMING_SOON_TRACKS = [
  { label: "Communication Series", icon: Lightbulb },
  { label: "AI & ML Series", icon: Zap },
];

const TRACK_ICONS = { Code2, Calculator };

function TrackProgressCard({ slug, track, onOpen }) {
  const { user } = useAuth();
  const { role, isInstAdmin } = useCampusScope();
  const [progress, setProgress] = useState(undefined); // undefined = loading

  useEffect(() => {
    if (!user) return;
    fetchTrackProgress(slug, user.uid, track.key).then(setProgress).catch(() => setProgress(null));
  }, [slug, user, track.key]);

  const Icon = TRACK_ICONS[track.icon] || BookOpen;
  const empty = progress && progress.totalCount === 0;
  // Anyone who isn't a learner - HOD, Faculty/Class Teacher, Principal,
  // Institution Admin. Their own completedCount is structurally always 0, so
  // the student-facing "Day N - X% Complete" read as if the series were brand
  // new and empty (the exact confusion this replaced). Staff get the SERIES'
  // published state instead: how many days exist, and how many have landed as
  // of today. Both numbers already come back from fetchTrackProgress -
  // currentDayIndex counts published days dated on or before today - so this
  // needs no extra read.
  const isStaffViewer = !!role || isInstAdmin;

  return (
    <button onClick={() => onOpen(track.key)} className="w-full text-left">
      <CampusCard hover className="p-5 flex items-center gap-4">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: CAMPUS.tealTint, color: CAMPUS.teal }}>
          <Icon size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <b className="block text-[14.5px]" style={{ color: CAMPUS.ink }}>{track.label}</b>
          {progress === undefined ? (
            <CampusSkeleton variant="rect" height={14} className="mt-1.5 w-2/3" />
          ) : empty ? (
            <p className="text-[12px] mt-0.5" style={{ color: CAMPUS.inkFaint }}>
              {isStaffViewer ? "No days published yet" : "Coming soon for your batch"}
            </p>
          ) : isStaffViewer ? (
            <p className="text-[12px] mt-0.5" style={{ color: CAMPUS.inkSoft }}>
              Day {Math.max(1, progress?.currentDayIndex || 1)} of {progress.totalCount} published
            </p>
          ) : (
            <p className="text-[12px] mt-0.5" style={{ color: CAMPUS.inkSoft }}>
              Day {Math.max(1, progress?.currentDayIndex || 1)} &middot; {progress?.percentComplete || 0}% Complete
            </p>
          )}
        </div>
        <span className="flex items-center gap-1 text-[12px] font-semibold flex-shrink-0" style={{ color: CAMPUS.teal }}>
          Continue <ArrowRight size={13} />
        </span>
      </CampusCard>
    </button>
  );
}

// Sidebar rendering of TRACK_CATALOG (+ the same COMING_SOON_TRACKS teaser
// row shown on the landing screen), portaled into CampusContextSidebar's
// slot (Navigation Architecture 2.0) - shown the instant Daily Learning is
// opened, not just once a track is picked, so the sidebar always reflects
// "what's inside Daily Learning" the same way the landing page's own cards
// do. Reuses fetchTrackProgress exactly like TrackProgressCard - no new data
// source, just a second, more compact renderer of the same numbers.
function TrackSidebarItem({ slug, track, active, onSelect }) {
  const { user } = useAuth();
  const [progress, setProgress] = useState(undefined);
  useEffect(() => {
    if (!user) return;
    fetchTrackProgress(slug, user.uid, track.key).then(setProgress).catch(() => setProgress(null));
  }, [slug, user, track.key]);
  const Icon = TRACK_ICONS[track.icon] || BookOpen;
  return (
    <button onClick={() => onSelect(track.key)}
      className="campus-btn flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all duration-150"
      style={{
        background: active ? CAMPUS.gradientPrimary : "transparent",
        color: active ? "#fff" : CAMPUS.inkSoft,
        boxShadow: active ? `0 3px 10px ${tint(CAMPUS.teal, 28)}` : "none",
      }}>
      <Icon size={15} className="flex-shrink-0" />
      <span className="flex-1 min-w-0">
        <span className="block text-[13px] font-medium truncate">{track.label}</span>
        {progress !== undefined && progress !== null && (
          <span className="block text-[10.5px] truncate" style={{ color: active ? "rgba(255,255,255,0.75)" : CAMPUS.inkFaint }}>
            Day {Math.max(1, progress?.currentDayIndex || 1)} &middot; {progress?.percentComplete || 0}%
          </span>
        )}
      </span>
    </button>
  );
}

// GATE's own "Daily GATE" plan already exists as a real, working feature
// (GateDaily, in gate-daily.jsx, driven by lib/gate.js's fetchDailyPlan) -
// this is a shortcut INTO that existing section, not a new track/content
// model. Navigation reuses the same shared search-select jump every other
// deep link inside Programming/CS Core/Aptitude/GATE already goes through
// (see campus-app.jsx's handleSearchSelect) rather than a bespoke prop.
function GateDailyCard({ onOpen }) {
  return (
    <button onClick={onOpen} className="w-full text-left">
      <CampusCard hover className="p-5 flex items-center gap-4">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: CAMPUS.tealTint, color: CAMPUS.teal }}>
          <GraduationCap size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <b className="block text-[14.5px]" style={{ color: CAMPUS.ink }}>Daily GATE</b>
          <p className="text-[12px] mt-0.5" style={{ color: CAMPUS.inkSoft }}>Your day&apos;s GATE prep plan, inside the GATE module</p>
        </div>
        <span className="flex items-center gap-1 text-[12px] font-semibold flex-shrink-0" style={{ color: CAMPUS.teal }}>
          Continue <ArrowRight size={13} />
        </span>
      </CampusCard>
    </button>
  );
}

function GateDailySidebarItem({ onSelect }) {
  return (
    <button onClick={onSelect}
      className="campus-btn flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all duration-150"
      style={{ color: CAMPUS.inkSoft }}>
      <GraduationCap size={15} className="flex-shrink-0" />
      <span className="text-[13px] font-medium truncate">Daily GATE</span>
    </button>
  );
}

function DailyLearningSidebarList({ slug, activeTrackId, onSelect, onOpenGateDaily }) {
  return (
    <>
      <div className="px-1 pb-2 mb-1 text-[10px] font-mono tracking-widest" style={{ color: CAMPUS.inkFaint }}>DAILY LEARNING</div>
      {TRACK_CATALOG.map(track => (
        <TrackSidebarItem key={track.key} slug={slug} track={track} active={activeTrackId === track.key} onSelect={onSelect} />
      ))}
      <GateDailySidebarItem onSelect={onOpenGateDaily} />
      <div className="px-1 pt-3 pb-1 text-[9.5px] font-mono tracking-widest" style={{ color: CAMPUS.inkFaint }}>COMING SOON</div>
      {COMING_SOON_TRACKS.map(t => (
        <div key={t.label} className="flex items-center gap-2.5 px-3 py-2 rounded-lg opacity-50" style={{ cursor: "not-allowed" }}>
          <t.icon size={14} className="flex-shrink-0" style={{ color: CAMPUS.inkFaint }} />
          <span className="text-[12.5px] font-medium truncate" style={{ color: CAMPUS.inkFaint }}>{t.label}</span>
        </div>
      ))}
    </>
  );
}

// The Daily Learning tab's real entry screen - one progress card per
// TRACK_CATALOG series, routing into the existing CampusDailyLearningTab
// (unmodified below) with an explicit trackId once a card is tapped. Reads
// ?track= once on mount (a shared link/refresh mid-track lands back on that
// track, not the picker) and registers depth 1 on the Back-button registry
// (see lib/campusNav.js) so hardware/gesture Back steps out to the picker
// before it ever reaches the "Leave Campus?" exit guard - one level shallower
// than CampusDailyLearningWeek's own depth-2 problem-view drill-down.
// sidebarSlot (Navigation Architecture 2.0) is the DOM node CampusWorkspace
// hands down for this module's own sub-navigation - portaled unconditionally
// (both on the picker screen and once a track is open), not just after a
// track is picked.
export function CampusDailyLearningLanding({ slug, sidebarSlot, jumpToTrack, onSearchSelect }) {
  const searchParams = useSearchParams();
  const [trackId, setTrackId] = useState(() => searchParams.get("track") || null);

  // Routes into GATE's own existing Daily GATE section via the shared
  // search-select jump (campus-app.jsx's handleSearchSelect), which is what
  // every other cross-module deep link already uses - so this needs no
  // bespoke navigation of its own.
  const openGateDaily = () => onSearchSelect?.({ tab: "gate", params: { section: "daily" } });

  // Lets the mobile drawer's nested track list (see campus-mobile-drawer.jsx)
  // command an already-mounted landing screen straight to a track, the same
  // nonce-jump mechanism CampusManage already uses for its own sub-tabs.
  useEffect(() => {
    if (!jumpToTrack?.trackId) return;
    setTrackId(jumpToTrack.trackId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jumpToTrack?.nonce]);

  useCampusBackHandler(1, trackId !== null, () => setTrackId(null));

  useEffect(() => {
    if (typeof window === "undefined" || trackId) return;
    window.history.replaceState(null, "", `/campus/${slug}/daily-learning`);
  }, [trackId, slug]);

  const sidebar = sidebarSlot && createPortal(
    <DailyLearningSidebarList slug={slug} activeTrackId={trackId} onSelect={setTrackId}
      onOpenGateDaily={openGateDaily} />,
    sidebarSlot
  );

  if (trackId) {
    return (
      <div>
        {sidebar}
        <CampusBreadcrumb className="mb-4" items={[
          { label: "Daily Learning", onClick: () => setTrackId(null) },
          { label: TRACK_CATALOG.find(t => t.key === trackId)?.label || "" },
        ]} />
        <CampusDailyLearningTab slug={slug} trackId={trackId} />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sidebar}
      {TRACK_CATALOG.map(track => (
        <TrackProgressCard key={track.key} slug={slug} track={track} onOpen={setTrackId} />
      ))}
      {/* Sits with the real tracks rather than under COMING SOON, because
          unlike those it is a live feature - it just lives in the GATE module. */}
      <GateDailyCard onOpen={openGateDaily} />
      <div className="pt-2">
        <p className="text-[9.5px] font-mono tracking-widest mb-2" style={{ color: CAMPUS.inkFaint }}>COMING SOON</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {COMING_SOON_TRACKS.map(t => (
            <CampusCard key={t.label} className="p-4 flex items-center gap-2.5 opacity-60">
              <t.icon size={16} style={{ color: CAMPUS.inkFaint }} />
              <span className="text-[12px] font-semibold" style={{ color: CAMPUS.inkFaint }}>{t.label}</span>
            </CampusCard>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------- Tab entry point (Daily Learning) ----------------

export function CampusDailyLearningTab({ slug, trackId = "dsa" }) {
  const [items, setItems] = useState(undefined); // undefined = loading
  const [moduleEnabled, setModuleEnabled] = useState(true);
  const [error, setError] = useState(false);
  // Which week is on screen. Previously this was hardcoded to mondayOf(), so
  // everything a student had already worked through became unreachable the
  // moment Monday came round - and with content authored weeks ahead, whole
  // weeks could scroll past unseen. `weekOffset` counts back from the current
  // week; 0 is this week and negatives are the archive.
  const [weekOffset, setWeekOffset] = useState(0);
  const currentWeekId = mondayOf();
  const weekId = shiftWeek(currentWeekId, weekOffset);

  const load = () => {
    setItems(undefined); setError(false);
    Promise.all([fetchWeekItems(slug, weekId, {}, trackId), fetchModuleConfig(slug)])
      .then(([rows, cfg]) => { setItems(rows); setModuleEnabled(cfg.enabled !== false); })
      .catch(() => setError(true));
  };
  useEffect(load, [slug, weekId, trackId]);

  if (error) {
    return (
      <CampusEmptyState icon={AlertTriangle} color={CAMPUS.bad} title="Couldn't load Daily Learning"
        description="Check your connection and try again."
        action={<CampusButton variant="secondary" size="sm" onClick={load}>Retry</CampusButton>} />
    );
  }
  if (items === undefined) return <CampusCard className="p-5"><CampusSkeleton variant="rect" height={54} /></CampusCard>;
  // Only the DSA track falls back to the generic global Learning catalog
  // when nothing's been authored yet - a non-DSA track (e.g. Aptitude
  // Series) with no published days yet should show its own "coming soon"
  // empty state instead (see CampusDailyLearningLanding), not silently swap
  // in unrelated generic content.
  //
  // Scoped to the CURRENT week only: an empty PAST week is a real, navigable
  // state that should say so, not dump the visitor into unrelated generic
  // content or make them think the archive is broken.
  const viewingCurrentWeek = weekOffset === 0;
  if (viewingCurrentWeek && (!moduleEnabled || (items.length === 0 && trackId === "dsa"))) return <CampusLearningSection />;

  return (
    <div>
      <WeekNav weekId={weekId} weekOffset={weekOffset} onChange={setWeekOffset} />
      {items.length === 0 ? (
        <CampusEmptyState icon={BookOpen} title={viewingCurrentWeek ? "Nothing published yet" : "Nothing published that week"}
          description={viewingCurrentWeek
            ? "This series doesn't have any published days yet - check back soon."
            : "No days were published for this week. Use the arrows to browse another one."} />
      ) : (
        // Remount on week change so every day-level piece of state (selected
        // day, answers, draft progress) is rebuilt for the week being shown
        // rather than carried across from the previous one.
        <CampusDailyLearningWeek key={weekId} slug={slug} items={items} trackId={trackId} />
      )}
    </div>
  );
}

// Week stepper for the archive. Forward is capped at the current week: days
// beyond today already render locked, and letting a student page into empty
// future weeks reads as broken rather than as "not written yet".
function WeekNav({ weekId, weekOffset, onChange }) {
  const start = new Date(`${weekId}T00:00:00`);
  const end = new Date(start); end.setDate(end.getDate() + 5); // Mon-Sat
  const fmt = (d) => d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
  const atCurrent = weekOffset === 0;

  return (
    <div className="flex items-center gap-2 mb-3">
      <button onClick={() => onChange(weekOffset - 1)} aria-label="Previous week"
        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: CAMPUS.surface, border: `1px solid ${CAMPUS.line}`, color: CAMPUS.inkSoft }}>
        <ChevronRight size={14} style={{ transform: "rotate(180deg)" }} />
      </button>

      <div className="flex-1 min-w-0 text-center">
        <p className="text-[12.5px] font-semibold truncate" style={{ color: CAMPUS.ink }}>
          {fmt(start)} &ndash; {fmt(end)}
        </p>
        <p className="text-[10px] font-mono tracking-widest" style={{ color: atCurrent ? CAMPUS.teal : CAMPUS.inkFaint }}>
          {atCurrent ? "THIS WEEK" : `${Math.abs(weekOffset)} WEEK${Math.abs(weekOffset) === 1 ? "" : "S"} AGO`}
        </p>
      </div>

      <button onClick={() => onChange(Math.min(0, weekOffset + 1))} disabled={atCurrent} aria-label="Next week"
        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{
          background: CAMPUS.surface, border: `1px solid ${CAMPUS.line}`,
          color: CAMPUS.inkSoft, opacity: atCurrent ? 0.4 : 1,
          cursor: atCurrent ? "not-allowed" : "pointer",
        }}>
        <ChevronRight size={14} />
      </button>

      {!atCurrent && (
        <CampusButton size="sm" variant="secondary" onClick={() => onChange(0)}>Today</CampusButton>
      )}
    </div>
  );
}

// ---------------- Admin preview (Manage tab) ----------------

// Institution admins never enroll as students, so they had no way to see
// the week's content at all before this - this reuses the exact same item
// viewer students get (in readOnly mode: MCQ correct answers pre-revealed,
// no mark-as-read gate, no save/XP/coin writes) rather than a second,
// drift-prone rendering of the same data. Every day is openable regardless
// of date - an admin previewing content needs to see Thursday's lesson on
// a Monday, unlike the calendar-locked student view.
export function CampusDailyLearningAdminPreview({ slug, weekId: weekIdProp, trackId = "dsa" }) {
  const [items, setItems] = useState(undefined);
  const [selected, setSelected] = useState(null);
  const [openProblemId, setOpenProblemId] = useState(null);
  const weekId = weekIdProp || mondayOf();

  useEffect(() => {
    fetchWeekItems(slug, weekId, { includeUnpublished: true }, trackId).then(rows => { setItems(rows); setSelected(rows[0]?.date || null); }).catch(() => setItems([]));
  }, [slug, weekId, trackId]);

  if (items === undefined) return <CampusCard className="p-5"><CampusSkeleton variant="rect" height={54} /></CampusCard>;
  if (items.length === 0) {
    return <CampusEmptyState icon={BookOpen} title="No Daily Learning content yet"
      description="Nothing has been authored for this institution's current week yet." />;
  }

  if (openProblemId) return <CampusProblemView problemId={openProblemId} onBack={() => setOpenProblemId(null)} backLabel="Daily Learning" suppressReward />;
  const item = items.find(it => it.date === selected) || items[0];

  return (
    <div>
      <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1">
        {items.map(it => {
          const active = it.date === selected;
          const Icon = it.type === "test" ? ClipboardCheck : BookOpen;
          return (
            <button key={it.date} onClick={() => setSelected(it.date)}
              className="flex flex-col items-center gap-1.5 px-3.5 py-2.5 rounded-xl flex-shrink-0 transition-colors"
              style={{ background: active ? CAMPUS.tealTint : "transparent", border: `1px solid ${active ? CAMPUS.teal : CAMPUS.line}` }}>
              <Icon size={14} style={{ color: active ? CAMPUS.teal : CAMPUS.inkSoft }} />
              <span className="text-[10.5px] font-mono font-semibold" style={{ color: active ? CAMPUS.teal : CAMPUS.inkSoft }}>
                {DOW_LABELS[it.dow].slice(0, 3).toUpperCase()}
              </span>
            </button>
          );
        })}
      </div>
      {/* No Next Lesson nav here - the day-picker tabs above already cover
          jumping between days in admin preview, unlike the student flow
          where future days are locked and not directly clickable. */}
      <CampusDailyLearningItemView slug={slug} item={item} readOnly onOpenProblem={setOpenProblemId} trackId={trackId} />
    </div>
  );
}

function CampusDailyLearningWeek({ slug, items, trackId = "dsa" }) {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [logs, setLogs] = useState({});
  // Read once on mount from ?problem= - CampusWorkspace's own URL-sync
  // effect deliberately excludes the "learning" tab (see its own comment)
  // so this self-owned effect below isn't clobbered, same precedent as
  // Programming/CS Core.
  const [openProblemId, setOpenProblemId] = useState(() => searchParams.get("problem"));
  const weekId = items[0]?.weekId;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams();
    // "dsa" stays param-free - every existing bookmark/shared link to plain
    // /daily-learning (no ?track=) keeps landing on DSA exactly as before.
    if (trackId !== "dsa") params.set("track", trackId);
    if (openProblemId) params.set("problem", openProblemId);
    const qs = params.toString();
    window.history.replaceState(null, "", `/campus/${slug}/daily-learning${qs ? `?${qs}` : ""}`);
  }, [openProblemId, slug, trackId]);

  useEffect(() => {
    if (!user) return;
    fetchUserWeekLogs(slug, user.uid, weekId, trackId).then(setLogs).catch(() => {});
  }, [slug, user, weekId, trackId]);

  const today = todayISO();
  const defaultItem = items.find(it => it.date === today && it.date <= today)
    || [...items].reverse().find(it => it.date <= today)
    || items[0];
  const [selected, setSelected] = useState(defaultItem.date);
  const item = items.find(it => it.date === selected) || defaultItem;

  // Day tabs are a lateral switch (always visible, like the top-level Campus
  // tabs), not a drill-down - only the embedded practice-problem view is a
  // real "go deeper" step. See lib/campusNav.js.
  useCampusBackHandler(2, openProblemId !== null, () => setOpenProblemId(null));

  if (openProblemId) {
    // No suppressReward here anymore - embedded problems now earn their own
    // flat Daily Learning reward (grantDailyLearningProblemReward, see
    // lib/dailyLearning.js) instead of being silently zeroed out. That flat
    // reward is granted from CampusDailyLearningItemView's own live
    // solved-problem subscription, not from CodeLab's standalone grading
    // path, so this problem view intentionally still passes no reward
    // override - CodeLab's own per-problem reward would otherwise ALSO fire
    // and double the intended total.
    return <CampusProblemView problemId={openProblemId} onBack={() => setOpenProblemId(null)} backLabel="Daily Learning" suppressReward />;
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1">
        {items.map(it => {
          const log = logs[it.date];
          const status = dayStatus(it, log);
          const active = it.date === selected;
          const Icon = status === "locked" ? Lock : status === "done" ? CheckCircle2 : Circle;
          return (
            <button key={it.date} onClick={() => status !== "locked" && setSelected(it.date)} disabled={status === "locked"}
              className="flex flex-col items-center gap-1.5 px-3.5 py-2.5 rounded-xl flex-shrink-0 transition-colors disabled:cursor-not-allowed"
              style={{
                background: active ? CAMPUS.tealTint : "transparent",
                border: `1px solid ${active ? CAMPUS.teal : CAMPUS.line}`,
              }}>
              <Icon size={14} style={{ color: status === "locked" ? CAMPUS.inkFaint : status === "done" ? CAMPUS.good : (active ? CAMPUS.teal : CAMPUS.inkSoft) }} />
              <span className="text-[10.5px] font-mono font-semibold" style={{ color: active ? CAMPUS.teal : CAMPUS.inkSoft }}>
                {DOW_LABELS[it.dow].slice(0, 3).toUpperCase()}
              </span>
            </button>
          );
        })}
      </div>

      {item.date > today ? (
        <CampusEmptyState icon={Lock} title={`${DOW_LABELS[item.dow]}'s lesson opens on ${item.date}`}
          description="This program is paced day by day - come back once it unlocks." />
      ) : (
        <CampusDailyLearningItemView slug={slug} item={item} log={logs[item.date]} trackId={trackId}
          onLogged={(log) => setLogs(prev => ({ ...prev, [item.date]: log }))}
          onOpenProblem={setOpenProblemId}
          nextItem={(() => {
            const next = items[items.findIndex(it => it.date === item.date) + 1];
            return next && next.date <= today ? next : null;
          })()}
          onGoToNext={() => {
            const next = items[items.findIndex(it => it.date === item.date) + 1];
            if (next) setSelected(next.date);
          }} />
      )}
    </div>
  );
}

// ---------------- Assessments tab (Saturday master tests) ----------------

export function CampusDailyAssessmentsTab({ slug, sidebarSlot, jumpToAssessment }) {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [tests, setTests] = useState(undefined);
  const [testsError, setTestsError] = useState(false);
  const [logs, setLogs] = useState({});
  const [openTest, setOpenTest] = useState(null);
  // Read once from ?problem= - doesn't depend on any async fetch, unlike
  // openTest below.
  const [openProblemId, setOpenProblemId] = useState(() => searchParams.get("problem"));
  // openTest is a full item object (not just a date), so it can't be resolved
  // from the URL until `tests` has actually loaded - this ref remembers the
  // ?test= date from the very first render and is consumed (and cleared)
  // by the effect below once tests arrives, same reasoning DSA/Company
  // Vault's own ?problem=/?company= resolution doesn't need since those
  // don't require an extra async round trip to resolve an id into an object.
  const pendingTestDateRef = useRef(searchParams.get("test"));

  const loadTests = () => {
    setTests(undefined); setTestsError(false);
    fetchWeekTests(slug).then(setTests).catch(() => setTestsError(true));
  };
  useEffect(loadTests, [slug]);

  // Mobile drawer's nested assessment list (see campus-mobile-drawer.jsx)
  // jumps here the same nonce way Manage/Daily Learning already do - if
  // `tests` is already loaded this resolves immediately, otherwise it
  // reuses the exact same pendingTestDateRef the ?test= URL param already
  // relies on below.
  useEffect(() => {
    if (!jumpToAssessment?.date) return;
    if (tests?.length) {
      const match = tests.find(t => t.date === jumpToAssessment.date);
      if (match) setOpenTest(match);
    } else {
      pendingTestDateRef.current = jumpToAssessment.date;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jumpToAssessment?.nonce]);

  useEffect(() => {
    if (!tests?.length || !pendingTestDateRef.current) return;
    const match = tests.find(t => t.date === pendingTestDateRef.current);
    pendingTestDateRef.current = null;
    if (match) setOpenTest(match);
  }, [tests]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let url = `/campus/${slug}/assessments`;
    if (openTest) url += `?test=${encodeURIComponent(openTest.date)}${openProblemId ? `&problem=${encodeURIComponent(openProblemId)}` : ""}`;
    window.history.replaceState(null, "", url);
  }, [openTest, openProblemId, slug]);

  useEffect(() => {
    if (!user || !tests?.length) return;
    Promise.all(tests.map(t => fetchLog(slug, user.uid, t.date))).then(results => {
      const byDate = {};
      tests.forEach((t, i) => { if (results[i]) byDate[t.date] = results[i]; });
      setLogs(byDate);
    }).catch(() => {});
  }, [slug, user, tests]);

  // list(1) -> openTest(2) -> openProblemId(3) - both can be active at once
  // (a problem is only ever opened from within a test), and popCampusBack()
  // always prefers the deeper one. See lib/campusNav.js.
  useCampusBackHandler(2, !!openTest, () => setOpenTest(null));
  useCampusBackHandler(3, openProblemId !== null, () => setOpenProblemId(null));

  // Portaled into the sidebar the same way every other module's sub-nav is -
  // computed once and prepended to every branch below (loading/error/open
  // test/empty/list) so it's visible for the whole time this tab is active,
  // not just on the plain list view.
  const sidebar = sidebarSlot && createPortal(
    <AssessmentsSidebarList tests={tests} logs={logs} activeDate={openTest?.date}
      onSelect={(t) => setOpenTest(t)} />,
    sidebarSlot
  );

  if (testsError) {
    return (
      <>
        {sidebar}
        <CampusEmptyState icon={AlertTriangle} color={CAMPUS.bad} title="Couldn't load assessments"
          description="Check your connection and try again."
          action={<CampusButton variant="secondary" size="sm" onClick={loadTests}>Retry</CampusButton>} />
      </>
    );
  }
  if (tests === undefined) return <>{sidebar}<CampusCard className="p-5"><CampusSkeleton variant="rect" height={54} /></CampusCard></>;

  // suppressReward stays true here for the same reason as the Daily Learning
  // week view - the flat per-problem reward is granted separately by
  // CampusDailyLearningItemView's own solved-problem subscription, not by
  // CodeLab's standalone grading path.
  if (openProblemId) return <>{sidebar}<CampusProblemView problemId={openProblemId} onBack={() => setOpenProblemId(null)} backLabel={openTest?.title || "Assessments"} suppressReward /></>;
  if (openTest) {
    return (
      <div>
        {sidebar}
        <CampusBackButton onClick={() => setOpenTest(null)} label="Back to assessments" />
        <CampusDailyLearningItemView slug={slug} item={openTest} log={logs[openTest.date]}
          onLogged={(log) => setLogs(prev => ({ ...prev, [openTest.date]: log }))}
          onOpenProblem={setOpenProblemId} />
      </div>
    );
  }

  if (tests.length === 0) {
    return <>{sidebar}<CampusEmptyState icon={ClipboardCheck} title="No assessments scheduled yet" description="Your institution hasn't published a weekly test yet - check back soon." /></>;
  }

  return (
    <div>
      {sidebar}
      <div className="grid sm:grid-cols-2 gap-3">
        {tests.map(t => {
          const log = logs[t.date];
          const locked = t.date > todayISO();
          return (
            <button key={t.date} disabled={locked} onClick={() => setOpenTest(t)} className="text-left disabled:cursor-not-allowed">
              <CampusCard hover={!locked} className="p-5 h-full" style={locked ? { opacity: 0.55 } : undefined}>
                <div className="flex items-center gap-2 mb-2">
                  <ClipboardCheck size={14} style={{ color: CAMPUS.purple }} />
                  <span className="text-[10px] font-mono" style={{ color: CAMPUS.inkFaint }}>{t.date}</span>
                  {log && <CampusChip color={CAMPUS.good} icon={CheckCircle2} className="ml-auto">DONE</CampusChip>}
                  {locked && !log && <CampusChip color={CAMPUS.inkFaint} icon={Lock} className="ml-auto">LOCKED</CampusChip>}
                </div>
                <b className="block text-[14.5px] mb-1.5" style={{ color: CAMPUS.ink }}>{t.title}</b>
                <p className="text-[11.5px]" style={{ color: CAMPUS.inkFaint }}>
                  {(t.problemIds || []).length} coding problems · {(t.mcqs || []).length} MCQs
                  {log && ` · scored ${log.mcqScore}/${log.mcqTotal}`}
                </p>
              </CampusCard>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Assessments' own sidebar - the published weekly tests, portaled the same
// way Daily Learning's own track list is (see DailyLearningSidebarList
// above), so a phone/desktop user can jump straight to a specific week's
// test without going through the list view first.
function AssessmentsSidebarList({ tests, logs, activeDate, onSelect }) {
  return (
    <>
      <div className="px-1 pb-2 mb-1 text-[10px] font-mono tracking-widest" style={{ color: CAMPUS.inkFaint }}>ASSESSMENTS</div>
      {tests === undefined ? (
        <CampusSkeleton height={100} className="mx-1" />
      ) : tests.length === 0 ? (
        <p className="px-3 py-2 text-[11.5px]" style={{ color: CAMPUS.inkFaint }}>None published yet</p>
      ) : tests.map(t => {
        const log = logs[t.date];
        const locked = t.date > todayISO();
        const active = activeDate === t.date;
        return (
          <button key={t.date} disabled={locked} onClick={() => onSelect(t)}
            className="campus-btn flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: active ? CAMPUS.gradientPrimary : "transparent",
              color: active ? "#fff" : CAMPUS.inkSoft,
              boxShadow: active ? `0 3px 10px ${tint(CAMPUS.teal, 28)}` : "none",
            }}>
            {locked ? <Lock size={13} className="flex-shrink-0" /> : log ? <CheckCircle2 size={13} className="flex-shrink-0" /> : <ClipboardCheck size={13} className="flex-shrink-0" />}
            <span className="text-[13px] font-medium truncate">{t.title}</span>
          </button>
        );
      })}
    </>
  );
}

// A day's optional `timedQuiz: { timeLimitSeconds, mcqIds }` references a
// subset of that SAME day's `mcqs` by id - reuses the exact question data,
// adds only a countdown-timer wrapper. Deliberately ungraded/unsaved/
// unlimited-retake (same "formative aside, not the real quiz" spirit as the
// existing lesson-block `checkpoint` type) - the real reward stays tied to
// the day's own completion (mark-as-read + the main Practice MCQs above),
// so this needs no new Firestore write path or rules change at all.
function TimedMiniQuiz({ mcqs, timeLimitSeconds }) {
  const [started, setStarted] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(timeLimitSeconds);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!started || submitted) return;
    if (secondsLeft <= 0) { setSubmitted(true); return; }
    const t = setTimeout(() => setSecondsLeft(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [started, submitted, secondsLeft]);

  const score = mcqs.filter(q => answers[q.id] === q.correctIndex).length;
  const mm = Math.floor(Math.max(0, secondsLeft) / 60), ss = Math.max(0, secondsLeft) % 60;

  const reset = () => { setStarted(false); setSubmitted(false); setAnswers({}); setSecondsLeft(timeLimitSeconds); };

  if (!started) {
    return (
      <CampusCard className="p-5 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[13px] font-semibold" style={{ color: CAMPUS.ink }}>Test your speed</p>
          <p className="text-[11.5px]" style={{ color: CAMPUS.inkFaint }}>
            {mcqs.length} question{mcqs.length === 1 ? "" : "s"} - {Math.round(timeLimitSeconds / 60)} min. Ungraded practice, retake anytime.
          </p>
        </div>
        <CampusButton onClick={() => setStarted(true)}>Start Timed Quiz</CampusButton>
      </CampusCard>
    );
  }

  return (
    <CampusCard className="p-5 space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-[12px] font-semibold" style={{ color: CAMPUS.ink }}>Timed Mini Quiz</p>
        {!submitted ? (
          <span className="flex items-center gap-1.5 text-[13px] font-mono font-bold" style={{ color: secondsLeft <= 30 ? CAMPUS.bad : CAMPUS.teal }}>
            <Clock size={13} /> {mm}:{String(ss).padStart(2, "0")}
          </span>
        ) : (
          <span className="text-[13px] font-bold" style={{ color: CAMPUS.good }}>{score} / {mcqs.length}</span>
        )}
      </div>
      {mcqs.map((q, qi) => (
        <div key={q.id}>
          <p className="text-xs mb-2" style={{ color: CAMPUS.inkSoft }}>{qi + 1}. {q.text}</p>
          <div className="space-y-1.5">
            {q.options.map((opt, oi) => {
              const isChosen = answers[q.id] === oi;
              const isCorrect = oi === q.correctIndex;
              let border = CAMPUS.line, bg = CAMPUS.paper;
              if (submitted && isCorrect) { border = CAMPUS.good + "60"; bg = CAMPUS.goodTint; }
              else if (submitted && isChosen && !isCorrect) { border = CAMPUS.bad + "60"; bg = CAMPUS.badTint; }
              else if (isChosen) { border = CAMPUS.teal + "60"; bg = CAMPUS.tealTint; }
              return (
                <button key={oi} disabled={submitted} onClick={() => setAnswers(prev => ({ ...prev, [q.id]: oi }))}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors disabled:cursor-default"
                  style={{ background: bg, border: `1px solid ${border}` }}>
                  <span className="text-[12px]" style={{ color: CAMPUS.inkSoft }}>{opt}</span>
                </button>
              );
            })}
          </div>
          {submitted && q.explanation && (
            <p className="text-[11.5px] mt-2 px-3 py-2 rounded-lg" style={{ background: CAMPUS.tealTint, color: CAMPUS.inkSoft }}>{q.explanation}</p>
          )}
        </div>
      ))}
      {!submitted ? (
        <CampusButton onClick={() => setSubmitted(true)} className="w-full">Submit</CampusButton>
      ) : (
        <button onClick={reset} className="text-[12px] font-semibold" style={{ color: CAMPUS.teal }}>Retake</button>
      )}
    </CampusCard>
  );
}

// ---------------- Shared day/test content viewer ----------------

function CampusDailyLearningItemView({ slug, item, log, onLogged, onOpenProblem, readOnly = false, nextItem, onGoToNext, trackId = "dsa" }) {
  const { user, userData } = useAuth();
  // Draft state (readAt/draftAnswers, written by saveDraftProgress as soon as
  // the student marks a lesson read or picks an MCQ answer) restores
  // markedRead/answers even before the final "Save Progress" submit exists -
  // previously this only ever restored from a COMPLETED log, so refreshing,
  // switching devices, or the tab crashing mid-lesson silently discarded
  // everything up to that point.
  const [markedRead, setMarkedRead] = useState(!!(log?.completedAt || log?.readAt));
  const [answers, setAnswers] = useState(log?.mcqAnswers || log?.draftAnswers || {});
  const [problems, setProblems] = useState([]);
  const [solvedIds, setSolvedIds] = useState(new Set());
  const [codeDrafts, setCodeDrafts] = useState({});
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(log?.completedAt ? { score: log.mcqScore, total: log.mcqTotal } : null);
  const [saveNotice, setSaveNotice] = useState(null); // { type: "info" | "error", message }
  const [draftSaveStatus, setDraftSaveStatus] = useState("idle"); // idle | saving | saved | failed
  const skipNextDraftSave = useRef(true);

  useEffect(() => {
    setMarkedRead(!!(log?.completedAt || log?.readAt));
    setAnswers(log?.mcqAnswers || log?.draftAnswers || {});
    setResult(log?.completedAt ? { score: log.mcqScore, total: log.mcqTotal } : null);
    skipNextDraftSave.current = true; // this state change came FROM the loaded log, not the student - don't echo it straight back
  }, [item.date, log]);

  // Debounced draft autosave - fires on every markedRead/answers change
  // except the one caused by the load effect above (skipNextDraftSave), so
  // opening a lesson never immediately re-writes back the exact data it just
  // read. Skipped entirely once a real result exists (nothing left to
  // draft) or in read-only admin preview. Deliberately NOT gated on
  // markedRead - MCQ answers must save the instant a student picks one,
  // whether or not they've clicked "mark as read" yet (that used to also
  // block the MCQ buttons themselves - see the disabled prop below).
  //
  // Previously this swallowed every write error completely silently - if the
  // dailyLearningLog write was ever transiently rejected (network blip,
  // rules hiccup), NOTHING for that session was actually persisted, with no
  // indicator anywhere that autosave had stopped working, right up until a
  // refresh (or the final submit) surfaced the loss. One automatic retry,
  // then a visible (not console-only) "not saved" state, closes that gap.
  useEffect(() => {
    if (skipNextDraftSave.current) { skipNextDraftSave.current = false; return; }
    if (readOnly || !user || result) return;
    let cancelled = false;
    const t = setTimeout(async () => {
      setDraftSaveStatus("saving");
      try {
        await saveDraftProgress(slug, user.uid, item, { markedRead, mcqAnswers: answers }, trackId);
        if (!cancelled) setDraftSaveStatus("saved");
      } catch {
        try {
          await saveDraftProgress(slug, user.uid, item, { markedRead, mcqAnswers: answers }, trackId);
          if (!cancelled) setDraftSaveStatus("saved");
        } catch {
          if (!cancelled) setDraftSaveStatus("failed");
        }
      }
    }, 500);
    return () => { cancelled = true; clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markedRead, answers]);

  useEffect(() => {
    Promise.all((item.problemIds || []).map(id => fetchProblem(id))).then(rows => setProblems(rows.filter(Boolean))).catch(() => setProblems([]));
  }, [item.problemIds]);

  // Live, not a one-time fetch - solving a problem (or just saving a code
  // draft) updates this card's status the instant it happens, with no
  // remount/refresh needed - the whole point of "update immediately after a
  // successful submission" and "student cannot tell what's in progress".
  useEffect(() => {
    if (!user || readOnly) return;
    return subscribeToCodelabProgress(user.uid, p => {
      setSolvedIds(new Set(Object.keys(p.solvedProblems || {})));
      setCodeDrafts(p.codeDrafts || {});
    });
  }, [user, readOnly]);

  // Flat 25 XP / 5 coin reward per embedded problem, on top of the day's own
  // completion bonus - granted the moment a problem shows as solved for this
  // day. Safe to attempt for every currently-solved problem on every
  // solvedIds update (not just a "just solved" transition): the ledger check
  // inside grantDailyLearningProblemReward makes a repeat attempt for an
  // already-rewarded problem a harmless no-op, so this doesn't need fragile
  // client-side "was this newly solved" tracking. grantAttemptedRef only
  // exists to avoid re-firing the network call on every render for a
  // problem already attempted this session - keyed by date+problemId so the
  // same problem embedded on a different day is tracked independently.
  const grantAttemptedRef = useRef(new Set());
  useEffect(() => {
    if (!user || readOnly || problems.length === 0) return;
    problems.forEach(p => {
      const key = `${item.date}_${p.id}`;
      if (solvedIds.has(p.id) && !grantAttemptedRef.current.has(key)) {
        grantAttemptedRef.current.add(key);
        grantDailyLearningProblemReward({ slug, uid: user.uid, date: item.date, problemId: p.id, trackId })
          .catch(() => { grantAttemptedRef.current.delete(key); });
      }
    });
  }, [solvedIds, problems, user, readOnly, slug, item.date, trackId]);

  // Not Started / In Progress / Solved - "in progress" is real, not
  // fabricated: it's true only when a code draft actually exists for that
  // problem (see saveCodeDraft in lib/codelab.js), not a guess.
  const problemStatus = (problemId) => {
    if (solvedIds.has(problemId)) return "solved";
    if (codeDrafts[problemId]?.code) return "inProgress";
    return "notStarted";
  };

  const mcqs = item.mcqs || [];
  // Shuffled purely for display - deterministic per (student, day), so a
  // refresh/reconnect reproduces the exact same question/option order with
  // nothing to persist, while two different students (or the same student on
  // two different days) see different orders. Grading below always compares
  // against the ORIGINAL q.correctIndex, never the shuffled position.
  const shuffledMcqs = useMemo(
    () => shuffleQuizForAttempt(mcqs, buildQuizSeedKey({ uid: user?.uid, scope: `${slug}:${item.date}` })),
    [mcqs, user?.uid, slug, item.date]
  );
  const allAnswered = mcqs.every(q => answers[q.id] !== undefined);
  const answeredCount = mcqs.filter(q => answers[q.id] !== undefined).length;
  const solvedCount = problems.filter(p => solvedIds.has(p.id)).length;

  // A real, non-fabricated completion percentage - built only from state that
  // already exists (read/answered/solved), weighted equally across whichever
  // of the three actually apply to this day (a lesson with no problems
  // attached isn't penalized for having nothing to solve).
  const progressPct = useMemo(() => {
    const steps = [markedRead || !!result ? 1 : 0];
    if (mcqs.length > 0) steps.push(answeredCount / mcqs.length);
    if (problems.length > 0) steps.push(problems.length ? solvedCount / problems.length : 0);
    return Math.round((steps.reduce((a, b) => a + b, 0) / steps.length) * 100);
  }, [markedRead, result, mcqs.length, answeredCount, problems.length, solvedCount]);

  // Previously `result` (which drives the "Submitted" confirmation UI) was
  // set BEFORE awaiting submitDayCompletion, and a thrown error was only
  // logged to console with no rollback - a failed write still looked
  // submitted until a refresh re-derived state from the real log and
  // revealed nothing had actually saved. Now `result` is only set once the
  // write genuinely confirms, and a failure surfaces a visible, retryable
  // message instead of silently reverting on refresh.
  const handleSave = async () => {
    if (!user || saving) return;
    setSaving(true);
    setSaveNotice(null);
    try {
      let correct = 0;
      mcqs.forEach(q => { if (answers[q.id] === q.correctIndex) correct++; });
      const solvedNow = problems.filter(p => solvedIds.has(p.id)).map(p => p.id);
      const { rewarded, alreadyCompleted, onTime, meetsRequirements } = await submitDayCompletion({ slug, uid: user.uid, profile: userData, item, mcqAnswers: answers, correctCount: correct, problemsSolved: solvedNow, trackId });
      setResult({ score: correct, total: mcqs.length });
      onLogged?.({ mcqAnswers: answers, mcqScore: correct, mcqTotal: mcqs.length, problemsSolved: solvedNow, problemsTotal: problems.length });
      // Four genuinely different outcomes, four different messages. Saying
      // "already rewarded" to someone catching up on last Tuesday is wrong and
      // reads as a bug - same for saying nothing at all when the problems
      // just aren't solved yet (canSave below should stop this case from
      // being reachable in practice, but submitDayCompletion is the real
      // trust boundary and can still say no on its own, e.g. stale local
      // solvedIds state).
      if (alreadyCompleted) {
        setSaveNotice({ type: "info", message: "You have already completed this activity and received your rewards." });
      } else if (!meetsRequirements) {
        setSaveNotice({
          type: "info",
          message: "Saved your answers, but solve every problem below before submitting to earn XP and coins for this day.",
        });
      } else if (!onTime) {
        setSaveNotice({
          type: "info",
          message: "Saved, and it counts toward your progress - but XP and coins are only awarded on the day itself.",
        });
      } else if (rewarded) {
        setSaveNotice(null);
      }
    } catch (e) {
      console.error(e);
      setSaveNotice({ type: "error", message: "Couldn't submit - check your connection and try again." });
    } finally { setSaving(false); }
  };

  const canSave = markedRead && allAnswered && (problems.length === 0 || solvedCount === problems.length);
  // A day whose own date is not today earns nothing - see isSameDayAsToday in
  // lib/dailyLearning.js. readOnly is the admin preview, which never rewards
  // anyway, so it is excluded to avoid shouting "NO REWARDS" at an admin
  // reviewing content.
  const isLate = !readOnly && !isSameDayAsToday(item.date);
  const reveal = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } };

  return (
    // A day is NOT a pure reading page, which is why it no longer keeps the
    // flat max-w-2xl the legal/changelog pages use. Below the concept prose sit
    // a pseudocode block, a five-option MCQ list and the day's problem cards -
    // all of which were squeezed into 672px while ~1100px of the viewport sat
    // empty beside them.
    //
    // Capped at 4xl rather than left uncapped: CLAUDE.md's "don't widen reading
    // pages" is a LINE-LENGTH rule, and prose here is already ~90 characters at
    // 2xl, so this trades a little more length for markedly better use of the
    // screen. Tightening the prose measure itself would mean capping
    // LessonBlocks' paragraph renderer, which is shared with CS Core,
    // Programming, Aptitude and Company Prep - a change to four other modules,
    // and deliberately not made here.
    <motion.div className="max-w-2xl lg:max-w-3xl xl:max-w-4xl" initial="hidden" animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.05 } } }}>
      {/* ---------------- Header ---------------- */}
      <motion.div variants={reveal} initial="hidden" animate="visible" className="flex items-center gap-2 mb-1">
        {item.type === "test" ? <ClipboardCheck size={13} style={{ color: CAMPUS.purple }} /> : <BookOpen size={13} style={{ color: CAMPUS.teal }} />}
        <p className="text-[11px]" style={{ color: CAMPUS.inkFaint }}>{DOW_LABELS[item.dow]} · {item.date}</p>
      </motion.div>
      <motion.h1 variants={reveal} initial="hidden" animate="visible" className="text-xl font-bold mb-3" style={{ color: CAMPUS.ink }}>{item.title}</motion.h1>

      <motion.div variants={reveal} initial="hidden" animate="visible" className="flex items-center gap-2 mb-4 flex-wrap">
        {item.difficulty && <CampusChip color={DIFF_COLOR[item.difficulty] || CAMPUS.good}>{item.difficulty}</CampusChip>}
        {item.estimatedMinutes > 0 && (
          <span className="flex items-center gap-1 text-[11px]" style={{ color: CAMPUS.inkFaint }}><Clock size={11} /> {item.estimatedMinutes} min</span>
        )}
        {/* Rewards are same-day only, so a past day must not advertise XP it
            will never pay - showing "+50 XP" and then awarding nothing reads as
            a broken promise. The amounts are struck through and the reason is
            stated BEFORE the work, not after submitting it. */}
        {isLate ? (
          <>
            <span className="flex items-center gap-1.5 text-[11px] line-through" style={{ color: CAMPUS.inkFaint }}>
              <Zap size={11} /> +{item.xpReward} XP
            </span>
            <span className="flex items-center gap-1.5 text-[11px] line-through" style={{ color: CAMPUS.inkFaint }}>
              <Coins size={11} /> +{item.coinReward} coins
            </span>
            <CampusChip color={CAMPUS.warn}>PAST DAY &middot; NO REWARDS</CampusChip>
          </>
        ) : (
          <>
            <span className="flex items-center gap-1.5 text-[11px]" style={{ color: CAMPUS.teal }}><Zap size={11} /> +{item.xpReward} XP</span>
            <span className="flex items-center gap-1.5 text-[11px]" style={{ color: CAMPUS.good }}><Coins size={11} /> +{item.coinReward} coins</span>
          </>
        )}
        {!readOnly && (
          <div className="flex items-center gap-2 ml-auto">
            <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: CAMPUS.line }}>
              <motion.div className="h-full rounded-full" style={{ background: CAMPUS.teal }}
                initial={{ width: 0 }} animate={{ width: `${progressPct}%` }} transition={{ duration: 0.5, ease: "easeOut" }} />
            </div>
            <span className="text-[10.5px] font-mono font-semibold" style={{ color: CAMPUS.inkFaint }}>{progressPct}%</span>
          </div>
        )}
      </motion.div>

      {readOnly && (
        <motion.div variants={reveal} initial="hidden" animate="visible" className="mb-4 px-3.5 py-2.5 rounded-lg text-[11.5px] font-medium" style={{ color: CAMPUS.purple, background: CAMPUS.purpleTint, border: `1px solid ${tint(CAMPUS.purple, 25)}` }}>
          Admin preview - this is exactly what students see. Correct MCQ answers are highlighted below; nothing here is saved.
        </motion.div>
      )}

      {/* ---------------- What you'll learn / Prerequisites ---------------- */}
      <motion.div variants={reveal} initial="hidden" animate="visible" className="space-y-3 mb-3">
        <InfoListCard icon={Target} title="WHAT YOU'LL LEARN" items={item.learningObjectives} color={CAMPUS.teal} tint={CAMPUS.tealTint} checkItems />
        <InfoListCard icon={BookOpen} title="PREREQUISITES" items={item.prerequisites} color={CAMPUS.blue} tint={CAMPUS.blueTint} checkItems />
      </motion.div>

      {/* ---------------- Concept ---------------- */}
      <motion.div variants={reveal} initial="hidden" animate="visible">
        <CampusCard className="p-5">
          <p className="text-[9px] font-mono tracking-widest mb-3" style={{ color: CAMPUS.inkFaint }}>CONCEPT</p>
          <LessonBody text={item.concept} />
          {item.codeExample?.code && <div className="mt-4"><CodeExampleBlock codeExample={item.codeExample} /></div>}
          <div className="flex items-center justify-between gap-4 mt-5 pt-4 flex-wrap" style={{ borderTop: `1px solid ${CAMPUS.line}` }}>
            <span className="text-[11px]" style={{ color: CAMPUS.inkFaint }}>Read through the concept above before continuing.</span>
            {readOnly ? null : !markedRead ? (
              <button onClick={() => setMarkedRead(true)} className="text-[11px] font-semibold px-3.5 py-1.5 rounded-lg transition-colors flex-shrink-0"
                style={{ color: CAMPUS.teal, border: `1px solid ${tint(CAMPUS.teal, 31)}`, background: CAMPUS.tealTint }}>
                mark as read
              </button>
            ) : (
              <span className="flex items-center gap-1.5 text-[11px] font-medium flex-shrink-0" style={{ color: CAMPUS.good }}><CheckCircle2 size={12} /> read</span>
            )}
          </div>
        </CampusCard>
      </motion.div>

      {!readOnly && !result && draftSaveStatus !== "idle" && (
        <motion.p variants={reveal} initial="hidden" animate="visible" className="text-[10.5px] mt-1.5 flex items-center gap-1.5"
          style={{ color: draftSaveStatus === "failed" ? CAMPUS.bad : CAMPUS.inkFaint }}>
          {draftSaveStatus === "saving" && "saving progress…"}
          {draftSaveStatus === "saved" && "progress saved"}
          {draftSaveStatus === "failed" && (
            <><AlertTriangle size={11} /> progress not saved - check your connection</>
          )}
        </motion.p>
      )}

      {/* ---------------- Key points / notes / mistakes / tips / applications ---------------- */}
      <motion.div variants={reveal} initial="hidden" animate="visible" className="space-y-3 mt-3">
        <InfoListCard icon={ListChecks} title="KEY TAKEAWAYS" items={item.keyPoints} color={CAMPUS.good} tint={CAMPUS.goodTint} checkItems />
        <InfoListCard icon={Info} title="IMPORTANT" items={item.importantNotes} color={CAMPUS.warn} tint={CAMPUS.warnTint} />
        <InfoListCard icon={AlertTriangle} title="COMMON MISTAKES TO AVOID" items={item.commonMistakes} color={CAMPUS.bad} tint={CAMPUS.badTint} />
        <InfoListCard icon={Lightbulb} title="INTERVIEW TIP" items={item.interviewTips} color={CAMPUS.blue} tint={CAMPUS.blueTint} />
        <InfoListCard icon={Briefcase} title="REAL-WORLD APPLICATIONS" items={item.realWorldApplications} color={CAMPUS.purple} tint={CAMPUS.purpleTint} />
      </motion.div>

      {problems.length > 0 && (
        <motion.div variants={reveal} initial="hidden" animate="visible" className="mt-5">
          <p className="text-[9px] font-mono tracking-widest mb-2" style={{ color: CAMPUS.inkFaint }}>
            PRACTICE PROBLEMS {readOnly ? `(${problems.length})` : `(${solvedCount}/${problems.length} solved)`}
          </p>
          <div className="space-y-2">
            {problems.map(p => {
              const status = problemStatus(p.id);
              const cardStyle = status === "solved"
                ? { border: `1px solid ${tint(CAMPUS.good, 31)}`, background: CAMPUS.goodTint }
                : status === "inProgress"
                  ? { border: `1px solid ${tint(CAMPUS.warn, 31)}`, background: CAMPUS.warnTint }
                  : undefined;
              const draftAt = codeDrafts[p.id]?.updatedAt;
              return (
                <button key={p.id} onClick={() => onOpenProblem(p.id)} className="w-full text-left">
                  <CampusCard hover className="p-3.5 flex items-center gap-3" style={cardStyle}>
                    {status === "solved" ? <CheckCircle2 size={14} style={{ color: CAMPUS.good }} className="flex-shrink-0" />
                      : status === "inProgress" ? <Pencil size={13} style={{ color: CAMPUS.warn }} className="flex-shrink-0" />
                      : <Code2 size={14} style={{ color: CAMPUS.inkFaint }} className="flex-shrink-0" />}
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-medium truncate" style={{ color: CAMPUS.ink }}>
                        {p.number != null && <span style={{ color: CAMPUS.inkFaint }}>{p.number}. </span>}{p.title}
                      </span>
                      {status === "inProgress" && draftAt?.toDate && (
                        <span className="block text-[10px] font-mono mt-0.5" style={{ color: CAMPUS.inkFaint }}>
                          last worked on {draftAt.toDate().toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                        </span>
                      )}
                    </span>
                    <CampusChip color={{ Easy: CAMPUS.good, Medium: CAMPUS.warn, Hard: CAMPUS.bad }[p.difficulty] || CAMPUS.good}>{p.difficulty}</CampusChip>
                    {status === "solved" && <CampusChip color={CAMPUS.good} icon={CheckCircle2}>SOLVED</CampusChip>}
                    {status === "inProgress" && <CampusChip color={CAMPUS.warn} icon={Pencil}>IN PROGRESS</CampusChip>}
                    <ChevronRight size={13} style={{ color: CAMPUS.inkFaint }} />
                  </CampusCard>
                </button>
              );
            })}
          </div>
        </motion.div>
      )}

      {mcqs.length > 0 && (
        <motion.div variants={reveal} initial="hidden" animate="visible" className="mt-5">
          <p className="text-[9px] font-mono tracking-widest mb-2" style={{ color: CAMPUS.inkFaint }}>
            {item.type === "test" ? "TEST MCQs" : "KNOWLEDGE CHECK"} ({mcqs.length})
          </p>

          {result && (
            <CampusCard className="p-4 mb-3 flex items-center justify-between gap-4 flex-wrap"
              style={{ background: CAMPUS.goodTint, border: `1px solid ${tint(CAMPUS.good, 25)}` }}>
              <div>
                <p className="text-[13px] font-semibold flex items-center gap-1.5" style={{ color: CAMPUS.good }}>
                  <CheckCircle2 size={14} /> Knowledge Check completed
                </p>
                {log?.completedAt?.toDate && (
                  <p className="text-[10.5px] mt-0.5" style={{ color: CAMPUS.inkFaint }}>
                    Completed {log.completedAt.toDate().toLocaleString(undefined, { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-lg font-bold" style={{ color: CAMPUS.good }}>{result.score} / {result.total}</p>
                <p className="text-[10.5px] font-mono" style={{ color: CAMPUS.inkFaint }}>{result.total ? Math.round((result.score / result.total) * 100) : 0}%</p>
              </div>
            </CampusCard>
          )}

          <CampusCard className="p-5 space-y-5">
            {shuffledMcqs.map((q, qi) => {
              const chosen = answers[q.id];
              const graded = !!result || readOnly;
              return (
                <div key={q.id}>
                  <p className="text-xs mb-2" style={{ color: CAMPUS.inkSoft }}>{qi + 1}. {q.text}</p>
                  <div className="space-y-1.5">
                    {q.options.map((opt) => {
                      const isChosen = chosen === opt.originalIndex;
                      const isCorrect = opt.originalIndex === q.correctIndex;
                      let border = CAMPUS.line, bg = CAMPUS.paper;
                      if (graded && isChosen && isCorrect) { border = CAMPUS.good + "60"; bg = CAMPUS.goodTint; }
                      else if (graded && isChosen && !isCorrect) { border = CAMPUS.bad + "60"; bg = CAMPUS.badTint; }
                      else if (graded && isCorrect) { border = CAMPUS.good + "60"; bg = "transparent"; }
                      else if (isChosen) { border = CAMPUS.teal + "60"; bg = CAMPUS.tealTint; }
                      return (
                        // Disabled only once truly graded (a real submission exists) or
                        // in read-only admin preview - NOT gated on "mark as read"
                        // anymore, which used to block every option from being
                        // selected at all until that separate button was clicked.
                        <button key={opt.originalIndex} disabled={graded || saving} onClick={() => !graded && setAnswers(prev => ({ ...prev, [q.id]: opt.originalIndex }))}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors disabled:cursor-default"
                          style={{ background: bg, border: `1px solid ${border}` }}>
                          {graded && (isChosen || isCorrect) ? (
                            isCorrect
                              ? <CheckCircle2 size={14} className="flex-shrink-0" style={{ color: CAMPUS.good }} />
                              : <XCircle size={14} className="flex-shrink-0" style={{ color: CAMPUS.bad }} />
                          ) : (
                            <span className="w-3.5 h-3.5 rounded-full flex-shrink-0" style={{ border: `1.5px solid ${isChosen ? CAMPUS.teal : CAMPUS.inkFaint}`, background: isChosen ? CAMPUS.teal : "transparent" }} />
                          )}
                          <span className="text-[12px]" style={{ color: CAMPUS.inkSoft }}>{opt.text}</span>
                          {graded && isChosen && <span className="ml-auto text-[10px] font-mono flex-shrink-0" style={{ color: CAMPUS.inkFaint }}>your answer</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </CampusCard>
        </motion.div>
      )}

      {item.timedQuiz?.mcqIds?.length > 0 && (
        <motion.div variants={reveal} initial="hidden" animate="visible" className="mt-5">
          <p className="text-[9px] font-mono tracking-widest mb-2" style={{ color: CAMPUS.inkFaint }}>TIMED MINI QUIZ</p>
          <TimedMiniQuiz mcqs={mcqs.filter(q => item.timedQuiz.mcqIds.includes(q.id))} timeLimitSeconds={item.timedQuiz.timeLimitSeconds || 300} />
        </motion.div>
      )}

      {!readOnly && saveNotice && (
        <motion.div variants={reveal} initial="hidden" animate="visible"
          className="flex items-center gap-2 mt-5 px-3.5 py-2.5 rounded-lg text-[12px] font-medium"
          style={saveNotice.type === "error"
            ? { color: CAMPUS.bad, background: CAMPUS.badTint, border: `1px solid ${tint(CAMPUS.bad, 25)}` }
            : { color: CAMPUS.teal, background: CAMPUS.tealTint, border: `1px solid ${tint(CAMPUS.teal, 25)}` }}>
          {saveNotice.type === "error" ? <AlertTriangle size={13} /> : <CheckCircle2 size={13} />}
          {saveNotice.message}
        </motion.div>
      )}

      <motion.div variants={reveal} initial="hidden" animate="visible" className="mt-5">
        {readOnly ? null : !user ? (
          <p className="text-xs" style={{ color: CAMPUS.inkFaint }}>Sign in to save your progress.</p>
        ) : result ? (
          // Already submitted - a disabled confirmation, not a re-clickable
          // button, so there's no accidental duplicate submission. There's no
          // per-lesson "allow multiple attempts" setting today, so this is
          // always the single-attempt state - a real Retake flow (with
          // attempt history) would need that admin toggle to exist first.
          <div className="w-full flex items-center justify-center gap-2 text-sm font-semibold py-3 rounded-xl"
            style={{ background: CAMPUS.goodTint, color: CAMPUS.good, border: `1px solid ${tint(CAMPUS.good, 25)}` }}>
            <CheckCircle2 size={15} /> {mcqs.length > 0 ? "Knowledge Check Submitted" : "Today's learning complete"}
          </div>
        ) : (
          <motion.button whileHover={canSave ? { scale: 1.01 } : {}} whileTap={canSave ? { scale: 0.98 } : {}}
            onClick={handleSave} disabled={!canSave || saving}
            className="w-full text-sm font-semibold py-3 rounded-xl transition-all disabled:opacity-40"
            style={{ background: CAMPUS.teal, color: "#fff" }}>
            {saving ? "submitting..." : mcqs.length > 0 ? "Submit Knowledge Check" : "mark today's learning as done"}
          </motion.button>
        )}
      </motion.div>

      {!readOnly && onGoToNext && (
        <motion.div variants={reveal} initial="hidden" animate="visible">
          <NextLessonCard dayCompleted={!!log} nextItem={nextItem} onGoToNext={onGoToNext} />
        </motion.div>
      )}
    </motion.div>
  );
}

// ---------------- Day-filtered leaderboard + click-through analysis ----------------

// Reused by both the Leaderboard tab (full day-picker) and the Overview
// "noticeboard" snapshot (a fixed date, no picker) - one table+drawer
// implementation instead of two.
export function CampusDayLeaderboard({ slug, date, dayLabel, myUid, compact = false }) {
  const [rows, setRows] = useState(undefined);
  const [analysis, setAnalysis] = useState(null);

  useEffect(() => {
    setRows(undefined);
    fetchDayLeaderboard(slug, date).then(setRows).catch(() => setRows([]));
  }, [slug, date]);

  if (rows === undefined) return <CampusCard className="p-5"><CampusSkeleton variant="rect" height={compact ? 90 : 160} /></CampusCard>;

  const shown = compact ? rows.slice(0, 5) : rows;

  const columns = [
    { key: "rank", label: "#", render: r => (
      r.rank <= 3 ? <span className="flex items-center gap-1 font-mono font-bold" style={{ color: CAMPUS.gold }}><Medal size={12} /> {r.rank}</span>
        : <span className="font-mono" style={{ color: CAMPUS.inkFaint }}>{r.rank}</span>
    ) },
    { key: "displayName", label: "Student", render: r => (
      <div className="min-w-0">
        <span className="font-medium block truncate" style={{ color: r.uid === myUid ? CAMPUS.teal : CAMPUS.ink }}>
          {r.displayName}{r.rollNumber ? ` · ${r.rollNumber}` : ""}{r.uid === myUid && " (you)"}
        </span>
        {(r.department || r.year || r.section) && (
          <span className="block text-[10px] font-mono truncate" style={{ color: CAMPUS.inkFaint }}>
            {[r.department, r.year && `Year ${r.year}`, r.section && `Sec ${r.section}`].filter(Boolean).join(" · ")}
          </span>
        )}
      </div>
    ) },
    { key: "mcqScore", label: "MCQs", render: r => <span className="font-mono" style={{ color: CAMPUS.teal }}>{r.mcqScore}/{r.mcqTotal}</span> },
    { key: "problemsSolved", label: "Problems", render: r => <span className="font-mono" style={{ color: CAMPUS.good }}>{(r.problemsSolved || []).length}/{r.problemsTotal}</span> },
    { key: "xpEarned", label: "XP", sortable: true, render: r => <span className="font-mono font-semibold" style={{ color: CAMPUS.gold }}>+{r.xpEarned || 0}</span> },
  ];

  return (
    <>
      <CampusCard className="overflow-hidden">
        <CampusTable columns={columns} rows={shown} rowKey="uid" onRowClick={setAnalysis}
          rowStyle={r => ({ background: r.uid === myUid ? CAMPUS.tealTint : "transparent" })}
          emptyState={<CampusEmptyState icon={Trophy} title="No one's completed this day yet" description={dayLabel ? `Be the first to finish ${dayLabel}'s learning.` : "Check back once students start completing it."} />} />
      </CampusCard>
      {analysis && <CampusDayAnalysisDrawer row={analysis} onClose={() => setAnalysis(null)} />}
    </>
  );
}

function CampusDayAnalysisDrawer({ row, onClose }) {
  return (
    <>
      <div className="fixed inset-0 z-40" style={{ background: "rgba(0,0,0,0.35)" }} onClick={onClose} />
      <aside className="fixed top-0 right-0 h-full z-50 overflow-y-auto"
        style={{ width: 420, maxWidth: "90vw", background: CAMPUS.surface, borderLeft: `1px solid ${CAMPUS.line}`, padding: "30px 34px" }}>
        <div className="flex items-start justify-between gap-3 mb-6">
          <div>
            <p className="text-[17px] font-semibold" style={{ color: CAMPUS.ink }}>{row.displayName}</p>
            <p className="text-[11px]" style={{ color: CAMPUS.inkFaint }}>{row.dayLabel} · {row.date}{row.rollNumber ? ` · ${row.rollNumber}` : ""}</p>
          </div>
          <button onClick={onClose} className="flex-shrink-0" style={{ color: CAMPUS.inkFaint }}><CloseIcon size={18} /></button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <CampusCard className="p-4 text-center">
            <p className="text-lg font-bold" style={{ color: CAMPUS.teal }}>{row.mcqScore}/{row.mcqTotal}</p>
            <p className="text-[10px] font-mono tracking-wider mt-1" style={{ color: CAMPUS.inkFaint }}>MCQ SCORE</p>
          </CampusCard>
          <CampusCard className="p-4 text-center">
            <p className="text-lg font-bold" style={{ color: CAMPUS.good }}>{(row.problemsSolved || []).length}/{row.problemsTotal}</p>
            <p className="text-[10px] font-mono tracking-wider mt-1" style={{ color: CAMPUS.inkFaint }}>PROBLEMS SOLVED</p>
          </CampusCard>
        </div>

        <div className="flex items-center gap-4 mb-2 flex-wrap">
          <span className="flex items-center gap-1.5 text-[11px]" style={{ color: CAMPUS.teal }}><Zap size={12} /> +{row.xpEarned || 0} XP earned</span>
          <span className="flex items-center gap-1.5 text-[11px]" style={{ color: CAMPUS.good }}><Coins size={12} /> +{row.coinEarned || 0} coins earned</span>
        </div>
        {row.completedAt?.toDate && (
          <p className="text-[10.5px] mb-6" style={{ color: CAMPUS.inkFaint }}>
            Submitted {row.completedAt.toDate().toLocaleString(undefined, { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })}
          </p>
        )}

        <p className="text-[9px] font-mono tracking-widest mb-2" style={{ color: CAMPUS.inkFaint }}>MCQ ANSWERS (BY SELECTED OPTION INDEX)</p>
        <div className="space-y-1.5">
          {Object.entries(row.mcqAnswers || {}).map(([qId, idx]) => (
            <div key={qId} className="flex items-center justify-between text-[12px] px-3 py-2 rounded-lg" style={{ border: `1px solid ${CAMPUS.line}` }}>
              <span style={{ color: CAMPUS.inkSoft }}>{qId}</span>
              <span className="font-mono" style={{ color: CAMPUS.ink }}>option {idx + 1}</span>
            </div>
          ))}
        </div>
      </aside>
    </>
  );
}
