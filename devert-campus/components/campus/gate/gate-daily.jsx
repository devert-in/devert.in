"use client";

import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight, CalendarCheck, Check, CheckCircle2, Circle, Coins, Flame,
  Sparkles, Zap,
} from "lucide-react";
import { CAMPUS } from "@/lib/campus-theme";
import {
  CampusCard, CampusChip, CampusButton, CampusProgressBar, } from "@/components/campus/campus-ui";
import {
  DAILY_STEPS, toggleDailyStep, setDailyTopic, completeDay, isDayComplete,
  computeStreak, recommendNextTopic, } from "@/lib/gate";
import { buildHeatmap, buildSessionPlan, buildRevisionPlan } from "@/lib/gateRevision";
import { useGate, GateSignInPrompt } from "@/components/campus/gate/gate-app";
import { GateSectionHeading, GateStat } from "@/components/campus/gate/gate-ui";
import { useAuth } from "@/context/AuthContext";

// Daily GATE: one page that says exactly what to do today, in order, and records
// that you did it.
//
// The six steps are fixed (lib/gate.js's DAILY_STEPS) rather than configurable,
// which is the point - a planner whose shape a student redesigns every morning is
// a procrastination surface. What IS personalised is the content of each step:
// which topic to learn comes from the syllabus progress, which topic to revise
// comes from the revision engine.
//
// Completion is self-reported. That is a deliberate trust boundary, identical to
// Daily Learning's and Programming's: there is no way for a static client to
// verify a student really read a lesson, and building a fake verification
// (time-on-page thresholds, scroll tracking) would only teach students to game
// it. The reward is small, idempotent, and once per day.

export function GateDaily() {
  const { user } = useAuth();
  const { paper, tree, progress, notes, pyqProgress, today, dailyHistory, go, reload, todayKey } = useGate();
  const [busy, setBusy] = useState(false);
  const [celebrated, setCelebrated] = useState(false);
  const reduceMotion = useReducedMotion();

  const streak = useMemo(() => computeStreak(dailyHistory), [dailyHistory]);
  const heatmap = useMemo(() => buildHeatmap(dailyHistory), [dailyHistory]);
  const nextTopic = useMemo(() => recommendNextTopic(tree, progress), [tree, progress]);
  const revisionPlan = useMemo(
    () => buildRevisionPlan({ tree, progress, notes, pyqProgress }),
    [tree, progress, notes, pyqProgress]);
  const revisionSession = useMemo(() => buildSessionPlan(revisionPlan, { size: 1 }), [revisionPlan]);

  // The topic for today is pinned onto the day document the first time the
  // student opens the plan, so it does not change under them if they complete
  // something else mid-day and the recommender's answer moves.
  //
  // Resolved BEFORE the signed-out early return below - every hook in this
  // component has to run unconditionally on every render, or React loses track
  // of which hook is which between renders.
  const plannedTopicId = today?.topicId || nextTopic?.topic?.id || null;
  const plannedTopic = useMemo(() => {
    if (!plannedTopicId) return null;
    for (const s of tree || []) {
      const t = (s.topics || []).find(x => x.id === plannedTopicId);
      if (t) return { subjectId: s.id, subjectName: s.name, topic: t };
    }
    return null;
  }, [tree, plannedTopicId]);

  if (!user) return <GateSignInPrompt what="your daily plan" />;

  const steps = today?.steps || {};
  const doneCount = DAILY_STEPS.filter(s => steps[s.key]).length;
  const complete = isDayComplete(today);
  const rewarded = !!today?.rewarded;

  const toggle = async (stepKey) => {
    setBusy(true);
    try {
      await toggleDailyStep(user.uid, paper.id, todayKey, stepKey, !steps[stepKey]).catch(() => {});
      // Pin today's topic on the first interaction, so the plan is stable.
      if (!today?.topicId && plannedTopic) {
        await setDailyTopic(user.uid, paper.id, todayKey, plannedTopic.subjectId, plannedTopic.topic.id).catch(() => {});
      }
      await reload.daily();
    } finally {
      setBusy(false);
    }
  };

  const finish = async () => {
    setBusy(true);
    try {
      const granted = await completeDay({ uid: user.uid, paperId: paper.id, date: todayKey });
      setCelebrated(granted);
      await reload.daily();
    } finally {
      setBusy(false);
    }
  };

  const stepTarget = {
    learn: plannedTopic ? () => go("subjects", { subjectId: plannedTopic.subjectId, topicId: plannedTopic.topic.id }) : () => go("subjects"),
    practice: () => go("practice"),
    pyq: () => go("pyq"),
    quiz: () => go("subjectTests"),
    revision: revisionSession.items[0]
      ? () => go("subjects", { subjectId: revisionSession.items[0].subjectId, topicId: revisionSession.items[0].topicId })
      : () => go("revision"),
    formula: () => go("formula"),
  };

  const stepDetail = {
    learn: plannedTopic ? `${plannedTopic.topic.title} · ${plannedTopic.subjectName}` : "Pick any subject to begin",
    practice: "A short set from your weak topics",
    pyq: "Previous year questions on today's topic",
    quiz: "A topic or subject test, timed",
    revision: revisionSession.items[0]
      ? `${revisionSession.items[0].title}${revisionSession.aheadOfSchedule ? " (ahead of schedule)" : " · due today"}`
      : "Nothing due yet - revision starts once you've completed topics",
    formula: "Skim the formula cards for today's subject",
  };

  return (
    <div className="space-y-5">
      <GateSectionHeading label="DAILY GATE" icon={CalendarCheck} title="Today's plan"
        description="Six steps, the same six every day. Consistency beats intensity over a GATE cycle - the streak is the point, not the volume." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <GateStat label="Streak" value={streak} sub={streak === 1 ? "day" : "days"} color={streak > 0 ? CAMPUS.warn : CAMPUS.inkFaint} icon={Flame} />
        <GateStat label="Today" value={`${doneCount}/${DAILY_STEPS.length}`} color={complete ? CAMPUS.good : CAMPUS.teal} icon={CheckCircle2} />
        <GateStat label="Active days" value={heatmap.activeDays} sub={`of last ${heatmap.totalDays}`} color={CAMPUS.blue} />
        <GateStat label="Consistency" value={`${heatmap.totalDays ? Math.round((heatmap.activeDays / heatmap.totalDays) * 100) : 0}%`}
          color={CAMPUS.purple} hint="Share of the last 90 days with at least one step completed." />
      </div>

      <CampusCard className="p-4">
        <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
          <div>
            <p className="text-[10px] font-mono tracking-widest mb-0.5" style={{ color: CAMPUS.inkFaint }}>
              {new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}
            </p>
            <b className="text-[14.5px]" style={{ color: complete ? CAMPUS.good : CAMPUS.ink }}>
              {complete ? (rewarded ? "Day complete" : "All six done - claim your day") : `${DAILY_STEPS.length - doneCount} steps to go`}
            </b>
          </div>
          {complete && !rewarded && (
            <CampusButton onClick={finish} disabled={busy} icon={Sparkles}>
              {busy ? "Saving..." : "Complete the day"}
            </CampusButton>
          )}
          {rewarded && <CampusChip color={CAMPUS.good} icon={Check}>REWARDED</CampusChip>}
        </div>
        <CampusProgressBar pct={Math.round((doneCount / DAILY_STEPS.length) * 100)}
          color={complete ? CAMPUS.good : CAMPUS.teal} />
        {!rewarded && (
          <p className="text-[11px] flex items-center gap-2.5 mt-2" style={{ color: CAMPUS.inkFaint }}>
            <span className="flex items-center gap-1"><Zap size={11} /> +20 XP</span>
            <span className="flex items-center gap-1"><Coins size={11} /> +8 coins</span>
            <span>once, when all six are done</span>
          </p>
        )}
      </CampusCard>

      <div className="space-y-2">
        {DAILY_STEPS.map((step, i) => {
          const done = !!steps[step.key];
          return (
            <CampusCard key={step.key} className="p-3.5">
              <div className="flex items-start gap-3">
                <button onClick={() => toggle(step.key)} disabled={busy}
                  aria-pressed={done} title={done ? "Mark as not done" : "Mark as done"}
                  className="flex-shrink-0 mt-0.5">
                  {done
                    ? <CheckCircle2 size={20} style={{ color: CAMPUS.good }} />
                    : <Circle size={20} style={{ color: CAMPUS.line }} />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono" style={{ color: CAMPUS.inkFaint }}>STEP {i + 1}</span>
                    <b className="text-[13px]" style={{ color: done ? CAMPUS.inkFaint : CAMPUS.ink, textDecoration: done ? "line-through" : "none" }}>
                      {step.label}
                    </b>
                  </div>
                  <p className="text-[11.5px] mt-0.5" style={{ color: CAMPUS.inkSoft }}>{stepDetail[step.key]}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: CAMPUS.inkFaint }}>{step.detail}</p>
                </div>
                <CampusButton size="sm" variant="secondary" icon={ArrowRight} className="flex-shrink-0"
                  onClick={stepTarget[step.key]}>
                  Go
                </CampusButton>
              </div>
            </CampusCard>
          );
        })}
      </div>

      {celebrated && (
        <motion.p
          initial={reduceMotion ? false : { opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          className="text-[12.5px] text-center px-3 py-2.5 rounded-lg flex items-center justify-center gap-2"
          style={{ background: CAMPUS.goodTint, color: CAMPUS.good }}>
          <Sparkles size={13} /> Day {streak + 1} of your streak. XP and coins added.
        </motion.p>
      )}

      <CampusCard className="p-4">
        <p className="text-[10px] font-mono tracking-widest mb-3" style={{ color: CAMPUS.inkFaint }}>LAST 90 DAYS</p>
        <Heatmap heatmap={heatmap} />
      </CampusCard>
    </div>
  );
}

// Intensity is how many of the six steps were completed that day, not minutes -
// see lib/gate.js on why measured wall-clock time from a browser is not something
// worth showing anyone.
function Heatmap({ heatmap }) {
  const shade = (level) => {
    if (!level) return CAMPUS.line;
    const alpha = 0.2 + (level / 6) * 0.8;
    return `color-mix(in srgb, ${CAMPUS.teal} ${Math.round(alpha * 100)}%, transparent)`;
  };
  return (
    <div>
      <div className="flex gap-[3px] overflow-x-auto pb-1">
        {heatmap.weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px] flex-shrink-0">
            {week.map((cell, di) => (
              <span key={di}
                title={cell ? `${cell.date} - ${cell.level}/6 steps${cell.completed ? " (day complete)" : ""}` : ""}
                className="rounded-[2px]"
                style={{
                  width: 11, height: 11,
                  background: cell ? shade(cell.level) : "transparent",
                  border: cell?.completed ? `1px solid ${CAMPUS.good}` : "none",
                }} />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-2.5 text-[10px] font-mono" style={{ color: CAMPUS.inkFaint }}>
        <span>less</span>
        {[0, 2, 4, 6].map(l => (
          <span key={l} className="rounded-[2px]" style={{ width: 10, height: 10, background: shade(l) }} />
        ))}
        <span>more</span>
        <span className="ml-2 flex items-center gap-1">
          <span className="rounded-[2px]" style={{ width: 10, height: 10, background: shade(6), border: `1px solid ${CAMPUS.good}` }} />
          all six done
        </span>
      </div>
    </div>
  );
}
