"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Map, CheckCircle2, ArrowRight, Sparkles, CalendarDays, TrendingUp, TrendingDown,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { CAMPUS, tint } from "@/lib/campus-theme";
import { CampusCard, CampusChip, CampusButton, CampusSkeleton, CampusEmptyState } from "@/components/campus/campus-ui";
import { useGate, GateSignInPrompt } from "@/components/campus/gate/gate-app";
import { GateSectionHeading, GateStat } from "@/components/campus/gate/gate-ui";
import {
  fetchRoadmapDays, fetchRoadmapProgress, completeRoadmapDay,
  roadmapDayStatus, roadmapPaceStatus, TOTAL_ROADMAP_DAYS,
} from "@/lib/gateRoadmap";

// The GATE Roadmap - a SELF-PACED day-by-day plan on top of the existing
// syllabus tree. Only "cs" has a curated plan as of this writing (see
// scripts/seed-gate-roadmap.mjs's own header for why DA/CS+DA don't yet - no
// official DA syllabus was available to verify a topic breakdown against,
// and this module follows the same "don't invent, cite the source" rule
// every other GATE lesson does). Other papers render an honest empty state
// rather than a plan nobody checked.
//
// No day is ever locked (see lib/gateRoadmap.js's own header) - every day is
// open from day 1, so a fast student can work ahead and a slower one is
// never punished for falling behind their own pace. "Current" and the
// ahead/behind-schedule stat are informational only.

const KIND_LABEL = {
  new: { label: "New topics", color: CAMPUS.teal },
  pyq: { label: "PYQs + Revision", color: CAMPUS.gold },
  revision: { label: "Revision", color: CAMPUS.good },
  "month-close": { label: "Month close", color: CAMPUS.purple },
};

function groupByWeek(days) {
  const weeks = new Map();
  for (const d of days) {
    const w = d.week || Math.ceil(d.dayNumber / 7);
    if (!weeks.has(w)) weeks.set(w, []);
    weeks.get(w).push(d);
  }
  return [...weeks.entries()].sort((a, b) => a[0] - b[0]);
}

function DayCard({ day, status, onComplete, onOpenTopic }) {
  const kind = KIND_LABEL[day.kind] || KIND_LABEL.new;
  const done = status === "done";
  const current = status === "current";
  return (
    <CampusCard
      className="p-4 flex flex-col gap-2.5"
      style={{
        border: current ? `1px solid ${tint(CAMPUS.teal, 45)}` : undefined,
        boxShadow: current ? `0 0 0 1px ${tint(CAMPUS.teal, 25)}, ${CAMPUS.shadow}` : CAMPUS.shadow,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-mono text-[13px] font-bold flex-shrink-0" style={{ color: CAMPUS.ink }}>
            Day {day.dayNumber}
          </span>
          {done && <CheckCircle2 size={14} style={{ color: CAMPUS.good }} />}
        </div>
        <CampusChip color={kind.color}>{kind.label}</CampusChip>
      </div>

      <div className="min-w-0">
        <p className="text-[13px] font-semibold truncate" style={{ color: CAMPUS.ink }}>{day.subjectLabel}</p>
        <p className="text-[11.5px] leading-relaxed mt-0.5" style={{ color: CAMPUS.inkSoft }}>{day.topicsSummary}</p>
      </div>

      <div className="flex items-center justify-between gap-2 mt-1 pt-2.5" style={{ borderTop: `1px solid ${CAMPUS.line}` }}>
        <span className="text-[10.5px] font-mono" style={{ color: CAMPUS.inkFaint }}>
          {day.estimatedMinutes ? `~${Math.round(day.estimatedMinutes / 60 * 10) / 10} hrs` : ""}
        </span>
        {done ? (
          <span className="text-[11px] font-semibold" style={{ color: CAMPUS.good }}>Done</span>
        ) : day.topicIds?.length ? (
          <button onClick={() => onOpenTopic(day)} className="flex items-center gap-1 text-[11.5px] font-semibold" style={{ color: CAMPUS.teal }}>
            Open <ArrowRight size={12} />
          </button>
        ) : null}
      </div>

      {!done && (
        <CampusButton size="sm" variant={current ? "primary" : "secondary"} icon={CheckCircle2} onClick={() => onComplete(day)}>
          Mark day complete
        </CampusButton>
      )}
    </CampusCard>
  );
}

export function GateRoadmap() {
  const { user } = useAuth();
  const { paper, go } = useGate();
  const [days, setDays] = useState(null);       // null = loading
  const [progress, setProgress] = useState(null);
  const [completing, setCompleting] = useState(null);

  useEffect(() => {
    if (!paper?.id) return;
    setDays(null);
    fetchRoadmapDays(paper.id).then(setDays).catch(() => setDays([]));
  }, [paper?.id]);

  useEffect(() => {
    if (!user || !paper?.id) { setProgress(null); return; }
    fetchRoadmapProgress(user.uid, paper.id).then(setProgress).catch(() => setProgress(null));
  }, [user, paper?.id]);

  const completedDayNumbers = progress?.completedDayNumbers || [];
  const doneCount = completedDayNumbers.length;
  const pace = useMemo(
    () => roadmapPaceStatus({ startedAt: progress?.startedAt, completedCount: doneCount }),
    [progress?.startedAt, doneCount]);
  const personalDay = pace.personalDay;

  const handleComplete = async (day) => {
    if (!user || completing) return;
    setCompleting(day.dayNumber);
    try {
      await completeRoadmapDay({ uid: user.uid, paperId: paper.id, dayNumber: day.dayNumber });
      const fresh = await fetchRoadmapProgress(user.uid, paper.id);
      setProgress(fresh);
    } finally {
      setCompleting(null);
    }
  };

  const handleOpenTopic = (day) => {
    if (day.topicIds?.[0] && day.subjectId) go("subjects", { subjectId: day.subjectId, topicId: day.topicIds[0] });
    else go("subjects");
  };

  if (!user) return <GateSignInPrompt />;

  return (
    <div className="space-y-5">
      <GateSectionHeading
        label="GATE PREPARATION · ROADMAP"
        icon={Map}
        title="Day-by-day plan"
        description={`${TOTAL_ROADMAP_DAYS} days, entirely self-paced - every day is open from Day 1. Move faster if you already know a topic, slower where you don't; nothing here ever locks.`}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <GateStat label="Days completed" value={doneCount} sub={days ? `of ${days.length} curated` : ""} icon={CheckCircle2} color={CAMPUS.good} />
        <GateStat label="Your pace" value={pace.started ? `Day ${personalDay}` : "Not started"}
          sub={pace.started ? "days since you began" : "complete a day to begin"} icon={CalendarDays} color={CAMPUS.teal} />
        {pace.started && (
          <GateStat label={pace.delta >= 0 ? "Ahead of pace" : "Behind pace"}
            value={pace.delta === 0 ? "On pace" : `${Math.abs(pace.delta)} day${Math.abs(pace.delta) === 1 ? "" : "s"}`}
            icon={pace.delta >= 0 ? TrendingUp : TrendingDown} color={pace.delta >= 0 ? CAMPUS.good : CAMPUS.warn} />
        )}
        <GateStat label="Total program" value={`${TOTAL_ROADMAP_DAYS} days`} sub="self-paced" icon={Sparkles} color={CAMPUS.purple} />
      </div>

      {days === null ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[0, 1, 2, 3, 4, 5].map(i => <CampusCard key={i} className="p-4"><CampusSkeleton variant="rect" height={120} /></CampusCard>)}
        </div>
      ) : days.length === 0 ? (
        <CampusEmptyState icon={Map} color={CAMPUS.teal} title="No roadmap curated for this paper yet"
          description={`${paper?.name || "This paper"} doesn't have a curated day-by-day plan yet - only GATE CS has one so far, built from its official syllabus. Switch to the CS paper to see it, or use Daily GATE for a shorter, recurring daily ritual instead.`}
          action={<CampusButton size="sm" variant="secondary" onClick={() => go("daily")}>Open Daily GATE</CampusButton>} />
      ) : (
        groupByWeek(days).map(([week, weekDays]) => (
          <div key={week}>
            <h3 className="text-[13px] font-semibold mb-3" style={{ color: CAMPUS.inkSoft }}>
              Week {week} <span className="font-mono text-[11px]" style={{ color: CAMPUS.inkFaint }}>· Days {weekDays[0].dayNumber}-{weekDays[weekDays.length - 1].dayNumber}</span>
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
              {weekDays.map(day => (
                <DayCard key={day.dayNumber} day={day}
                  status={roadmapDayStatus(day, { completedDayNumbers, personalDay })}
                  onComplete={handleComplete} onOpenTopic={handleOpenTopic} />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
