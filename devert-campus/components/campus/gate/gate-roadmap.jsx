"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Map, Lock, CheckCircle2, ArrowRight, Sparkles, CalendarDays,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { CAMPUS, tint } from "@/lib/campus-theme";
import { CampusCard, CampusChip, CampusButton, CampusSkeleton, CampusEmptyState } from "@/components/campus/campus-ui";
import { useGate, GateSignInPrompt } from "@/components/campus/gate/gate-app";
import { GateSectionHeading, GateStat } from "@/components/campus/gate/gate-ui";
import {
  fetchRoadmapDays, fetchRoadmapProgress, completeRoadmapDay,
  roadmapDayStatus, currentRoadmapDayNumber, TOTAL_ROADMAP_DAYS,
} from "@/lib/gateRoadmap";

// The GATE Roadmap - a fixed, dated day-by-day plan on top of the existing
// syllabus tree. Only "cs" has a curated plan as of this writing (see
// scripts/seed-gate-roadmap.mjs's own header for why DA/CS+DA don't yet - no
// official DA syllabus was available to verify a topic breakdown against,
// and this module follows the same "don't invent, cite the source" rule
// every other GATE lesson does). Other papers render an honest empty state
// rather than a plan nobody checked.
//
// "Locked" is calendar-date based (see lib/gateRoadmap.js's own header) - a
// day opens once its date arrives, not once a prior day is finished, so
// missing a day never strands you behind your own calendar.

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
  const locked = status === "locked";
  const done = status === "done";
  const current = status === "current";
  return (
    <CampusCard
      className="p-4 flex flex-col gap-2.5"
      style={{
        opacity: locked ? 0.55 : 1,
        border: current ? `1px solid ${tint(CAMPUS.teal, 45)}` : undefined,
        boxShadow: current ? `0 0 0 1px ${tint(CAMPUS.teal, 25)}, ${CAMPUS.shadow}` : CAMPUS.shadow,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-mono text-[13px] font-bold flex-shrink-0" style={{ color: CAMPUS.ink }}>
            Day {day.dayNumber}
          </span>
          {locked && <Lock size={12} style={{ color: CAMPUS.inkFaint }} />}
          {done && <CheckCircle2 size={14} style={{ color: CAMPUS.good }} />}
        </div>
        <CampusChip color={kind.color}>{kind.label}</CampusChip>
      </div>

      <p className="font-mono text-[10.5px]" style={{ color: CAMPUS.inkFaint }}>{day.date}</p>

      <div className="min-w-0">
        <p className="text-[13px] font-semibold truncate" style={{ color: CAMPUS.ink }}>{day.subjectLabel}</p>
        <p className="text-[11.5px] leading-relaxed mt-0.5" style={{ color: CAMPUS.inkSoft }}>{day.topicsSummary}</p>
      </div>

      {!locked && (
        <div className="flex items-center justify-between gap-2 mt-1 pt-2.5" style={{ borderTop: `1px solid ${CAMPUS.line}` }}>
          <span className="text-[10.5px] font-mono" style={{ color: CAMPUS.inkFaint }}>
            {day.estimatedMinutes ? `${Math.round(day.estimatedMinutes / 60 * 10) / 10} hrs` : ""} · +{day.xpReward || 0} XP
          </span>
          {done ? (
            <span className="text-[11px] font-semibold" style={{ color: CAMPUS.good }}>Done</span>
          ) : day.topicIds?.length ? (
            <button onClick={() => onOpenTopic(day)} className="flex items-center gap-1 text-[11.5px] font-semibold" style={{ color: CAMPUS.teal }}>
              Open <ArrowRight size={12} />
            </button>
          ) : null}
        </div>
      )}

      {!locked && !done && (
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

  const todayDayNumber = useMemo(() => currentRoadmapDayNumber(), []);

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
        description={`Day ${todayDayNumber} of ${TOTAL_ROADMAP_DAYS} · 15 Aug 2026 → 31 Dec 2026. A day opens on its own date whether or not you finished the last one - missing a day never locks you out.`}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <GateStat label="Today" value={`Day ${todayDayNumber}`} icon={CalendarDays} color={CAMPUS.teal} />
        <GateStat label="Days completed" value={doneCount} sub={days ? `of ${days.length} curated` : ""} icon={CheckCircle2} color={CAMPUS.good} />
        <GateStat label="Plan window" value="Aug 15–31" sub="curated so far" icon={Sparkles} color={CAMPUS.gold} />
        <GateStat label="Total program" value={`${TOTAL_ROADMAP_DAYS} days`} sub="15 Aug – 31 Dec" icon={Map} color={CAMPUS.purple} />
      </div>

      {days === null ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[0, 1, 2, 3, 4, 5].map(i => <CampusCard key={i} className="p-4"><CampusSkeleton variant="rect" height={120} /></CampusCard>)}
        </div>
      ) : days.length === 0 ? (
        <CampusEmptyState icon={Map} color={CAMPUS.teal} title="No roadmap curated for this paper yet"
          description={`${paper?.name || "This paper"} doesn't have a curated day-by-day plan yet - only GATE CS has one so far, built from its official syllabus. Switch to the CS paper to see it, or use Daily GATE for a plan that adapts to your own progress instead of a fixed calendar.`}
          action={<CampusButton size="sm" variant="secondary" onClick={() => go("daily")}>Open Daily GATE</CampusButton>} />
      ) : (
        groupByWeek(days).map(([week, weekDays]) => (
          <div key={week}>
            <h3 className="text-[13px] font-semibold mb-3" style={{ color: CAMPUS.inkSoft }}>
              Week {week} <span className="font-mono text-[11px]" style={{ color: CAMPUS.inkFaint }}>· {weekDays[0].date} – {weekDays[weekDays.length - 1].date}</span>
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
              {weekDays.map(day => (
                <DayCard key={day.dayNumber} day={day}
                  status={roadmapDayStatus(day, { completedDayNumbers, todayDayNumber })}
                  onComplete={handleComplete} onOpenTopic={handleOpenTopic} />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
