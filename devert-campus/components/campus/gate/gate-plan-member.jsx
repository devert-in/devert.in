"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays, CheckCircle2, Flame, Target, TrendingUp, AlertTriangle, Clock, ArrowRight, Megaphone,
  Layers, BarChart3, Wrench, Lock, Hourglass, Moon, Sigma,
} from "lucide-react";
import { CAMPUS, tint } from "@/lib/campus-theme";
import { CampusCard, CampusChip, CampusButton, CampusProgressBar, CampusSkeleton } from "@/components/campus/campus-ui";
import { GateStat, GateBarList } from "@/components/campus/gate/gate-ui";
import {
  GATE_PLAN_LAST_DAY, GATE_PLAN_TOTAL_DAYS, HOURS_PER_DAY, formatPlanDate, currentPlanDay, hasPlanStarted, hasPlanEnded,
  planDayState, DAY_STATE, planSummary, weeklyTracker, subjectAccuracy, weakTopics, fetchPlanDay,
  LOG_STATUS, LOG_STATUS_LABEL, WEEK_KEYS,
} from "@/lib/gatePlan";
import { WEEKS, ladderStep, SCORECARD_TARGETS, CUT_LIST, CLOSING_LINE } from "@/lib/gatePlanGuide";
import {
  Panel, PaperChip, TypeChip, AccuracyFigure, bandColor, fmtPct, PAPER_COLOR, STATUS_COLOR,
} from "@/components/campus/gate/gate-plan-ui";

function Acc({ v }) {
  return <span className="font-mono font-bold" style={{ color: bandColor(v) }}>{fmtPct(v)}</span>;
}

// The member's own dashboard - the workbook's Daily Plan + Weekly Tracker
// sheets, live. Every number comes from lib/gatePlan.js's planSummary(), the
// same function the admin console uses, so the two never disagree.

// ── Today ─────────────────────────────────────────────────────────────────

export function PlanToday({ index, member, settings, adminPreview, onOpenDay, onTab }) {
  const logs = useMemo(() => member?.logs || {}, [member]);
  const s = useMemo(() => planSummary(member), [member]);
  const live = currentPlanDay();
  const started = hasPlanStarted();
  const ended = hasPlanEnded();
  const focusDay = !started ? 0 : live;
  const [today, setToday] = useState(undefined);

  // One full read for the hero card - the index has no cover text or
  // must-know line, and those are what "today" is actually about.
  useEffect(() => {
    let cancelled = false;
    fetchPlanDay(focusDay).then(d => !cancelled && setToday(d)).catch(() => !cancelled && setToday(null));
    return () => { cancelled = true; };
  }, [focusDay]);

  const weekKey = index.find(d => d.day === focusDay)?.week;
  const weekDays = index.filter(d => d.week === weekKey);
  const tomorrow = index.find(d => d.day === focusDay + 1);
  const weak = useMemo(() => weakTopics(index, logs).slice(0, 5), [index, logs]);
  const subjects = useMemo(() => subjectAccuracy(index, logs).filter(x => x.attempted > 0)
    .sort((a, b) => a.pct - b.pct)
    .map(x => ({ key: x.subject, label: x.subject, pct: x.pct, sub: `${x.correct}/${x.attempted}`, color: bandColor(x.pct) })), [index, logs]);
  const todayLog = logs[String(focusDay)];
  const targetHours = Math.max(0, (Math.max(0, live) - s.joinedOnDay + 1)) * HOURS_PER_DAY;

  return (
    <div className="space-y-4">
      {settings.notice && (
        <CampusCard className="p-4 flex items-start gap-3" style={{ border: `1px solid ${tint(CAMPUS.cyan, 40)}` }}>
          <Megaphone size={16} className="flex-shrink-0 mt-0.5" style={{ color: CAMPUS.cyan }} />
          <div className="min-w-0">
            <p className="text-[10px] font-mono tracking-widest mb-0.5" style={{ color: CAMPUS.cyan }}>COHORT NOTICE</p>
            <p className="text-[13px] leading-relaxed whitespace-pre-line" style={{ color: CAMPUS.ink }}>{settings.notice}</p>
          </div>
        </CampusCard>
      )}

      {!adminPreview && s.missedTwice && (
        <CampusCard className="p-4 flex items-start gap-3" style={{ border: `1px solid ${tint(CAMPUS.bad, 45)}` }}>
          <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" style={{ color: CAMPUS.bad }} />
          <div className="min-w-0">
            <p className="text-[13px] font-semibold" style={{ color: CAMPUS.ink }}>Never miss twice.</p>
            <p className="text-[12.5px] leading-relaxed mt-0.5" style={{ color: CAMPUS.inkSoft }}>
              The last two days have no Done or Moved log. Today is the day the chain restarts - do Block A at minimum (2.5 h),
              and move the missed topic block to Sunday. If a whole week slips, apply the cut list, starting with {CUT_LIST[0][0].toLowerCase()}.
            </p>
          </div>
        </CampusCard>
      )}

      {/* ── stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <GateStat icon={CalendarDays} color={CAMPUS.cyan} label="Plan day"
          value={!started ? "D0" : ended ? "Ended" : `D${live}`} sub={!started ? `starts ${formatPlanDate(0)}` : `of D${GATE_PLAN_LAST_DAY} · ${formatPlanDate(live)}`} />
        <GateStat icon={CheckCircle2} color={CAMPUS.good} label="Days done" value={s.done}
          sub={`${s.percent}% of ${GATE_PLAN_TOTAL_DAYS}`} />
        <GateStat icon={Flame} color={CAMPUS.orange} label="Streak" value={s.currentStreak} sub={`longest ${s.longestStreak}`}
          hint="Consecutive days marked Done. Today still being open does not break it." />
        <GateStat icon={Target} color={bandColor(s.overall.pct)} label="PYQ accuracy" value={fmtPct(s.overall.pct)}
          sub={s.overall.attempted ? `${s.overall.correct}/${s.overall.attempted} self-reported` : "log a score to see it"}
          hint="Your own correct / attempted counts across topic, revision, Sunday tests and GA." />
      </div>
      {!adminPreview && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <GateStat icon={AlertTriangle} color={s.missed ? CAMPUS.warn : CAMPUS.inkFaint} label="Missed since joining" value={s.missed}
            sub={s.moved ? `${s.moved} moved to Sunday` : s.missed === 0 ? "every day kept" : "move them to Sunday"} />
          <GateStat icon={Clock} color={CAMPUS.blue} label="Hours logged" value={s.hoursLogged}
            sub={targetHours ? `target ${targetHours} h so far` : "3.5 h a day"} hint="Only counts days where you entered hours." />
          <GateStat icon={TrendingUp} color={CAMPUS.purple} label="PYQs attempted" value={s.pyqsSolved} sub="topic + revision" />
          <GateStat icon={Hourglass} color={CAMPUS.inkSoft} label="Days left" value={Math.max(0, GATE_PLAN_LAST_DAY - Math.max(0, live))}
            sub="until Dec 31, then mocks" />
        </div>
      )}
      <CampusProgressBar pct={s.percent} color={CAMPUS.good} />
      {!adminPreview && s.backlogLeft > 0 && (
        <p className="text-[12px]" style={{ color: CAMPUS.inkFaint }}>
          You were approved on D{s.joinedOnDay}. D0-D{s.joinedOnDay - 1} are open whenever you want them - they never count as missed
          {s.backlogDone ? ` (${s.backlogDone} already done)` : ""}.
        </p>
      )}

      {/* ── today ── */}
      <CampusCard className="p-5 sm:p-6" style={{ border: `1px solid ${tint(todayLog?.status === LOG_STATUS.DONE ? CAMPUS.good : CAMPUS.teal, 40)}` }}>
        <div className="flex flex-wrap items-center gap-1.5 mb-2">
          <CampusChip color={todayLog?.status === LOG_STATUS.DONE ? CAMPUS.good : CAMPUS.cyan} icon={todayLog?.status === LOG_STATUS.DONE ? CheckCircle2 : Target}>
            {ended ? "Last day" : !started ? "Starts soon" : todayLog?.status === LOG_STATUS.DONE ? `D${focusDay} done` : `D${focusDay} · today`}
          </CampusChip>
          {today && <PaperChip paper={today.paper} />}
          {today && <TypeChip type={today.type} />}
          <span className="text-[11px] font-mono" style={{ color: CAMPUS.inkFaint }}>{formatPlanDate(focusDay, { weekday: true })}</span>
        </div>
        {today === undefined ? <CampusSkeleton height={70} /> : today ? (
          <>
            <p className="text-[11px] font-mono tracking-widest" style={{ color: CAMPUS.inkFaint }}>{today.subject.toUpperCase()}</p>
            <h3 className="text-xl font-bold mt-0.5 mb-2" style={{ color: CAMPUS.ink }}>{today.topic}</h3>
            {today.cover && <p className="text-[13px] leading-relaxed mb-3" style={{ color: CAMPUS.inkSoft }}>{today.cover}</p>}
            {today.blocks?.length > 0 && (
              <p className="text-[12.5px] leading-relaxed mb-3" style={{ color: CAMPUS.inkSoft }}>
                {today.blocks.map(b => `${b.label} ${b.minutes} min`).join(" · ")}
              </p>
            )}
            {today.mustKnow && (
              <p className="text-[12.5px] leading-relaxed rounded-xl p-3 mb-3" style={{ color: CAMPUS.ink, background: tint(CAMPUS.gold, 8), border: `1px solid ${tint(CAMPUS.gold, 30)}` }}>
                <span className="block text-[10px] font-mono tracking-widest mb-0.5" style={{ color: CAMPUS.gold }}>MUST-KNOW</span>
                {today.mustKnow}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <CampusButton icon={ArrowRight} onClick={() => onOpenDay(focusDay)}>
                {todayLog?.status === LOG_STATUS.DONE ? "Review today" : "Open today's card"}
              </CampusButton>
              {today.evening?.kind === "revise" && (
                <span className="text-[12px] flex items-center gap-1" style={{ color: CAMPUS.inkFaint }}>
                  <Moon size={12} /> Evening: revise D{today.evening.reviseDay} · {today.evening.topic}
                </span>
              )}
              {today.evening?.kind === "compiler" && (
                <span className="text-[12px] flex items-center gap-1" style={{ color: CAMPUS.inkFaint }}>
                  <Moon size={12} /> Evening: Compiler {today.evening.compilerSession?.n}/{today.evening.compilerSession?.of}
                </span>
              )}
            </div>
          </>
        ) : <p className="text-[12.5px]" style={{ color: CAMPUS.inkFaint }}>Today&apos;s card could not be loaded.</p>}
        {tomorrow && (
          <p className="text-[11.5px] mt-4 pt-3" style={{ color: CAMPUS.inkFaint, borderTop: `1px solid ${CAMPUS.line}` }}>
            Tomorrow · D{tomorrow.day}: <span style={{ color: CAMPUS.inkSoft }}>{tomorrow.subject} - {tomorrow.topic}</span>
          </p>
        )}
      </CampusCard>

      {/* ── this week ── */}
      {weekDays.length > 0 && (
        <Panel title={`THIS WEEK · ${weekKey === "Start" ? "DAY 0" : weekKey.toUpperCase()}${WEEKS[weekKey]?.title ? ` · ${WEEKS[weekKey].title.toUpperCase()}` : ""}`} icon={Layers}
          action={<CampusButton variant="ghost" size="sm" onClick={() => onTab("tracker")}>Weekly tracker</CampusButton>}>
          {WEEKS[weekKey]?.goal && weekKey !== "Start" && (
            <p className="text-[12px] leading-relaxed mb-3" style={{ color: CAMPUS.inkSoft }}>
              <b style={{ color: CAMPUS.ink }}>{weekKey === "Lock-in" ? "By Dec 31:" : "Goal by Sunday:"}</b> {WEEKS[weekKey].goal}
            </p>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {weekDays.map(d => <DayTile key={d.day} d={d} logs={logs} onOpen={() => onOpenDay(d.day)} />)}
          </div>
        </Panel>
      )}

      {/* ── accuracy + repair ── */}
      {!adminPreview && (
        <div className="grid lg:grid-cols-2 gap-4 items-start">
          <Panel title="ACCURACY" icon={BarChart3}>
            <div className="grid grid-cols-3 gap-2 mt-2 mb-4">
              <AccuracyFigure label="Topic + tests" {...s.topic} />
              <AccuracyFigure label="Revision" {...s.evening} />
              <AccuracyFigure label="GA" {...s.ga} />
            </div>
            <p className="text-[10px] font-mono tracking-widest mb-2" style={{ color: CAMPUS.inkFaint }}>TOPIC PYQS BY SUBJECT · WEAKEST FIRST</p>
            <GateBarList rows={subjects} emptyLabel="Log a topic day's score to see subjects here." />
            <p className="text-[10.5px] mt-3" style={{ color: CAMPUS.inkFaint }}>Green at 75%+, amber 60-75%, red below 60% - the plan&apos;s own bands. To turn ~90 covered marks into 70 you need ~78%.</p>
          </Panel>
          <Panel title="REPAIR LIST · BELOW 60%" icon={Wrench} color={CAMPUS.bad}>
            {weak.length === 0 ? (
              <p className="text-[12.5px] mt-2" style={{ color: CAMPUS.inkFaint }}>Nothing under 60% yet. Topics land here as soon as a logged score drops below the red line.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {weak.map(w => (
                  <li key={w.day}>
                    <button onClick={() => onOpenDay(w.day)} className="w-full text-left rounded-xl p-3 transition-colors"
                      style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}` }}>
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-[12.5px] font-semibold truncate" style={{ color: CAMPUS.ink }}>D{w.day} · {w.topic}</span>
                        <span className="font-mono text-[12px] font-bold flex-shrink-0" style={{ color: bandColor(w.pct) }}>{w.pct}% <span style={{ color: CAMPUS.inkFaint }}>({w.correct}/{w.attempted})</span></span>
                      </div>
                      <p className="text-[11.5px] mt-0.5" style={{ color: CAMPUS.inkSoft }}>{ladderStep(w.pct)?.next}.</p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <p className="text-[10.5px] mt-3" style={{ color: CAMPUS.inkFaint }}>Repair loop: 30-min concept refresh, redo every wrong PYQ, then 3 fresh PYQs to confirm.</p>
          </Panel>
        </div>
      )}

      <p className="text-center text-[11.5px] font-mono pt-2" style={{ color: CAMPUS.inkFaint }}>{CLOSING_LINE}</p>
    </div>
  );
}

function DayTile({ d, logs, onOpen }) {
  const state = planDayState(d.day, logs);
  const log = logs?.[String(d.day)];
  const st = log?.status || "not-started";
  const color = state === DAY_STATE.DONE ? CAMPUS.good : state === DAY_STATE.TODAY ? CAMPUS.cyan
    : log ? STATUS_COLOR[st] : state === DAY_STATE.UPCOMING ? CAMPUS.inkFaint : CAMPUS.inkSoft;
  const p = log && d.type === "topic" && Number(log.topicAttempted) ? Math.round((100 * (Number(log.topicCorrect) || 0)) / Number(log.topicAttempted)) : null;
  return (
    <button onClick={onOpen}
      className="text-left rounded-xl p-2.5 h-full transition-colors campus-card-hover"
      style={{
        background: CAMPUS.paper,
        border: `1px solid ${state === DAY_STATE.TODAY ? CAMPUS.cyan : state === DAY_STATE.DONE ? tint(CAMPUS.good, 45) : CAMPUS.line}`,
        opacity: state === DAY_STATE.UPCOMING ? 0.7 : 1,
      }}
      title={`${formatPlanDate(d.day, { weekday: true })} · ${LOG_STATUS_LABEL[st]}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="font-mono text-[10.5px] font-bold" style={{ color }}>D{d.day}</span>
        {state === DAY_STATE.DONE ? <CheckCircle2 size={12} style={{ color: CAMPUS.good }} />
          : state === DAY_STATE.UPCOMING ? <Lock size={10} style={{ color: CAMPUS.inkFaint }} />
          : state === DAY_STATE.TODAY ? <Target size={12} style={{ color: CAMPUS.cyan }} /> : null}
      </div>
      <p className="text-[9.5px] font-mono tracking-wider truncate" style={{ color: PAPER_COLOR[d.paper] || CAMPUS.inkFaint }}>
        {d.type === "topic" ? d.subject.toUpperCase() : d.type === "sunday" ? "SUNDAY TEST" : d.type === "lockin" ? "LOCK-IN" : "SETUP"}
      </p>
      <p className="text-[12px] leading-snug mt-0.5" style={{ color: CAMPUS.ink, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{d.topic}</p>
      <div className="flex items-center gap-1.5 mt-1.5">
        <span className="text-[9.5px] font-mono" style={{ color: CAMPUS.inkFaint }}>{formatPlanDate(d.day)}</span>
        {log && st !== LOG_STATUS.DONE && <span className="text-[9.5px] font-semibold" style={{ color: STATUS_COLOR[st] }}>{LOG_STATUS_LABEL[st]}</span>}
        {p != null && <span className="text-[9.5px] font-mono font-bold ml-auto" style={{ color: bandColor(p) }}>{p}%</span>}
      </div>
    </button>
  );
}

// ── Journey ───────────────────────────────────────────────────────────────

export function PlanJourney({ index, member, onOpenDay }) {
  const logs = useMemo(() => member?.logs || {}, [member]);
  const [paper, setPaper] = useState(null);
  const weeks = useMemo(() => WEEK_KEYS.map(k => ({ key: k, days: index.filter(d => d.week === k) })).filter(w => w.days.length), [index]);
  const s = useMemo(() => planSummary(member), [member]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px]">
          <p className="text-[13px] font-semibold" style={{ color: CAMPUS.ink }}>{s.done} of {GATE_PLAN_TOTAL_DAYS} days done</p>
          <div className="mt-1.5 max-w-md"><CampusProgressBar pct={s.percent} color={CAMPUS.good} /></div>
        </div>
        <div className="flex gap-1.5">
          {[[null, "All"], ["BOTH", "Both"], ["CS", "CS"], ["DA", "DA"]].map(([v, l]) => (
            <button key={l} onClick={() => setPaper(v)}
              className="text-[11.5px] font-semibold px-2.5 py-1 rounded-full"
              style={{ background: paper === v ? CAMPUS.tealTint : CAMPUS.paper, border: `1px solid ${paper === v ? CAMPUS.teal : CAMPUS.line}`, color: paper === v ? CAMPUS.teal : CAMPUS.inkSoft }}>{l}</button>
          ))}
        </div>
      </div>
      {weeks.map(w => {
        const done = w.days.filter(d => logs[String(d.day)]?.status === LOG_STATUS.DONE).length;
        const shown = paper ? w.days.filter(d => d.type !== "topic" || d.paper === paper) : w.days;
        return (
          <div key={w.key}>
            <div className="flex items-baseline gap-3 mb-2 flex-wrap">
              <span className="font-mono text-[11.5px] font-bold tracking-wider" style={{ color: CAMPUS.teal }}>{w.key === "Start" ? "DAY 0" : w.key.toUpperCase()}</span>
              <span className="text-[12px]" style={{ color: CAMPUS.inkSoft }}>{WEEKS[w.key]?.title}</span>
              <span className="text-[11px] font-mono" style={{ color: CAMPUS.inkFaint }}>{WEEKS[w.key]?.dates}</span>
              <span className="text-[11px] font-mono ml-auto" style={{ color: CAMPUS.inkFaint }}>{done}/{w.days.length}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2">
              {shown.map(d => <DayTile key={d.day} d={d} logs={logs} onOpen={() => onOpenDay(d.day)} />)}
            </div>
          </div>
        );
      })}
      <p className="text-[11.5px] text-center" style={{ color: CAMPUS.inkFaint }}>
        Every day&apos;s card is open to read ahead. A day can be logged from its own date onwards - past days never lock.
      </p>
    </div>
  );
}

// ── Weekly tracker ────────────────────────────────────────────────────────

export function PlanTracker({ index, member, onOpenDay }) {
  const logs = useMemo(() => member?.logs || {}, [member]);
  const weeks = useMemo(() => weeklyTracker(index, logs), [index, logs]);
  const s = useMemo(() => planSummary(member), [member]);
  const tot = weeks.reduce((t, w) => ({
    planned: t.planned + w.planned, done: t.done + w.done, missed: t.missed + w.missed, moved: t.moved + w.moved,
    tC: t.tC + w.topicC, tA: t.tA + w.topicA, eC: t.eC + w.eveningC, eA: t.eA + w.eveningA, gC: t.gC + w.gaC, gA: t.gA + w.gaA,
    hours: t.hours + w.hours, target: t.target + w.targetHours,
  }), { planned: 0, done: 0, missed: 0, moved: 0, tC: 0, tA: 0, eC: 0, eA: 0, gC: 0, gA: 0, hours: 0, target: 0 });
  const p = (c, a) => (a ? Math.round((100 * c) / a) : null);

  return (
    <div className="space-y-4">
      <Panel title="WEEKLY TRACKER" icon={BarChart3}>
        <p className="text-[12px] mt-1 mb-3" style={{ color: CAMPUS.inkSoft }}>Fills itself from your daily logs - the workbook&apos;s Weekly Tracker sheet, live.</p>
        <div className="overflow-x-auto -mx-1">
          <table className="w-full min-w-[820px] text-left">
            <thead>
              <tr style={{ borderBottom: `1px solid ${CAMPUS.line}` }}>
                {["Week", "Dates", "Done", "Missed", "Moved", "Completion", "Topic acc.", "Revision acc.", "GA acc.", "Hours", "Weakest topic"].map(h => (
                  <th key={h} className="px-2 py-2 text-[9.5px] font-mono tracking-widest font-normal whitespace-nowrap" style={{ color: CAMPUS.inkFaint }}>{h.toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {weeks.map(w => (
                <tr key={w.key} style={{ borderBottom: `1px solid ${CAMPUS.line}`, background: w.state === "current" ? tint(CAMPUS.cyan, 6) : undefined, opacity: w.state === "upcoming" ? 0.55 : 1 }}>
                  <td className="px-2 py-2 text-[12px] font-mono font-bold" style={{ color: w.state === "current" ? CAMPUS.cyan : CAMPUS.ink }}>
                    <button onClick={() => onOpenDay(w.first)}>{w.key}</button>
                  </td>
                  <td className="px-2 py-2 text-[11.5px] whitespace-nowrap" style={{ color: CAMPUS.inkSoft }}>{WEEKS[w.key]?.dates}</td>
                  <td className="px-2 py-2 text-[12px] font-mono" style={{ color: CAMPUS.ink }}>{w.done}/{w.planned}</td>
                  <td className="px-2 py-2 text-[12px] font-mono" style={{ color: w.missed ? CAMPUS.bad : CAMPUS.inkFaint }}>{w.missed}</td>
                  <td className="px-2 py-2 text-[12px] font-mono" style={{ color: w.moved ? CAMPUS.warn : CAMPUS.inkFaint }}>{w.moved}</td>
                  <td className="px-2 py-2 w-[110px]">
                    <span className="text-[11px] font-mono" style={{ color: CAMPUS.inkSoft }}>{w.completion}%</span>
                    <CampusProgressBar pct={w.completion} color={w.completion >= 75 ? CAMPUS.good : w.completion >= 60 ? CAMPUS.warn : CAMPUS.bad} />
                  </td>
                  <td className="px-2 py-2 text-[12px]"><Acc v={w.topic} /></td>
                  <td className="px-2 py-2 text-[12px]"><Acc v={w.evening} /></td>
                  <td className="px-2 py-2 text-[12px]"><Acc v={w.ga} /></td>
                  <td className="px-2 py-2 text-[11.5px] font-mono whitespace-nowrap" style={{ color: CAMPUS.inkSoft }}>{w.hours || "-"} / {w.targetHours}</td>
                  <td className="px-2 py-2 text-[11.5px] max-w-[200px]" style={{ color: CAMPUS.inkSoft }}>
                    {w.signOff ? <span title={w.signOff.repair || ""}>{w.signOff.weakest || "-"}</span> : "-"}
                  </td>
                </tr>
              ))}
              <tr>
                <td className="px-2 py-2.5 text-[12px] font-bold" style={{ color: CAMPUS.ink }}>Total</td>
                <td className="px-2 py-2.5 text-[11.5px]" style={{ color: CAMPUS.inkSoft }}>Sep 27 - Dec 31</td>
                <td className="px-2 py-2.5 text-[12px] font-mono font-bold" style={{ color: CAMPUS.ink }}>{tot.done}/{tot.planned}</td>
                <td className="px-2 py-2.5 text-[12px] font-mono">{tot.missed}</td>
                <td className="px-2 py-2.5 text-[12px] font-mono">{tot.moved}</td>
                <td className="px-2 py-2.5 text-[12px] font-mono">{Math.round((100 * tot.done) / Math.max(1, tot.planned))}%</td>
                <td className="px-2 py-2.5 text-[12px]"><Acc v={p(tot.tC, tot.tA)} /></td>
                <td className="px-2 py-2.5 text-[12px]"><Acc v={p(tot.eC, tot.eA)} /></td>
                <td className="px-2 py-2.5 text-[12px]"><Acc v={p(tot.gC, tot.gA)} /></td>
                <td className="px-2 py-2.5 text-[11.5px] font-mono" style={{ color: CAMPUS.inkSoft }}>{Math.round(tot.hours * 10) / 10} / {tot.target}</td>
                <td />
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-[10.5px] mt-3" style={{ color: CAMPUS.inkFaint }}>
          Overall progress {s.percent}% · {Math.max(0, GATE_PLAN_TOTAL_DAYS - s.done)} days left in the plan. Accuracy below 60% = red (repair), 60-75% = amber, 75%+ = green.
          Target hours assume 3.5 h per day. Weakest topic comes from each Sunday&apos;s sign-off.
        </p>
      </Panel>

      <Panel title="WEEKLY SCORECARD TARGETS" icon={Target}>
        <dl className="grid sm:grid-cols-2 gap-2 mt-2">
          {SCORECARD_TARGETS.map(([k, v]) => (
            <div key={k} className="rounded-xl px-3 py-2" style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}` }}>
              <dt className="text-[9.5px] font-mono tracking-widest" style={{ color: CAMPUS.inkFaint }}>{k.toUpperCase()}</dt>
              <dd className="text-[12.5px]" style={{ color: CAMPUS.ink }}>{v}</dd>
            </div>
          ))}
        </dl>
      </Panel>

      <Panel title="STREAK CALENDAR · NO ZERO DAYS" icon={Sigma}>
        <p className="text-[12px] mt-1 mb-3" style={{ color: CAMPUS.inkSoft }}>
          Cross off each day only after the daily contract is met. The goal is an unbroken chain from D0 to D95.
        </p>
        <div className="grid grid-cols-8 sm:grid-cols-12 lg:grid-cols-16 gap-1">
          {index.map(d => {
            const st = logs[String(d.day)]?.status;
            const state = planDayState(d.day, logs);
            const bg = st === LOG_STATUS.DONE ? CAMPUS.good : st === LOG_STATUS.MOVED ? tint(CAMPUS.warn, 55) : st === LOG_STATUS.MISSED ? tint(CAMPUS.bad, 50) : "transparent";
            return (
              <button key={d.day} onClick={() => onOpenDay(d.day)}
                title={`D${d.day} · ${formatPlanDate(d.day, { weekday: true })} · ${LOG_STATUS_LABEL[st || "not-started"]}`}
                className="aspect-square rounded-md flex items-center justify-center font-mono text-[9.5px]"
                style={{
                  background: bg,
                  border: `1px solid ${state === DAY_STATE.TODAY ? CAMPUS.cyan : d.type === "sunday" ? tint(CAMPUS.gold, 45) : d.type === "lockin" ? tint(CAMPUS.orange, 45) : CAMPUS.line}`,
                  color: st === LOG_STATUS.DONE ? "#fff" : CAMPUS.inkFaint,
                  opacity: state === DAY_STATE.UPCOMING ? 0.5 : 1,
                }}>{d.day}</button>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-3 mt-3 text-[10.5px]" style={{ color: CAMPUS.inkFaint }}>
          {[[CAMPUS.good, "Done"], [tint(CAMPUS.warn, 55), "Moved to Sunday"], [tint(CAMPUS.bad, 50), "Missed"]].map(([c, l]) => (
            <span key={l} className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: c }} />{l}</span>
          ))}
          <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ border: `1px solid ${tint(CAMPUS.gold, 45)}` }} />Sunday</span>
          <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ border: `1px solid ${tint(CAMPUS.orange, 45)}` }} />Lock-in</span>
        </div>
      </Panel>
    </div>
  );
}

