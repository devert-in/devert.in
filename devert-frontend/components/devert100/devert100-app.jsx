"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Flame, Target, CheckCircle2, Lock, CalendarDays, ArrowRight, Loader2,
  TrendingUp, Layers, Trophy, AlertCircle, LogIn,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useIsWindowed } from "@/components/window/is-windowed";
import {
  DEVERT100_TOTAL_DAYS, DAY_STATE, dayState, currentDay, hasRunStarted,
  formatDayDate, dateForDay, fetchDayIndex, subscribeToParticipant,
  joinDevert100, progressSummary, breakdowns, problemLabel,
} from "@/lib/devert100";

const GREEN = "#00FF41";
const CYAN = "#00FFFF";
const GOLD = "#FFD700";

const DIFFICULTY_COLOR = { Easy: GREEN, Medium: "#FF9500", Hard: "#FF5050" };

// ── small shared pieces ───────────────────────────────────────────────────

function Stat({ icon: Icon, label, value, sub, color = CYAN }) {
  return (
    <div className="terminal-window p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={14} style={{ color }} />
        <span className="font-mono text-[10px] text-white/30 tracking-wider">{label}</span>
      </div>
      <p className="font-sans text-2xl font-bold text-white leading-none">{value}</p>
      {sub && <p className="font-mono text-[11px] text-white/35 mt-1.5">{sub}</p>}
    </div>
  );
}

// Progress bar rather than a ring: at 1% a ring is a nearly invisible arc,
// and this run spends its first week there.
function ProgressBar({ percent, color = GREEN }) {
  return (
    <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.max(percent, percent > 0 ? 1.5 : 0)}%` }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="h-full rounded-full"
        style={{ background: color }}
      />
    </div>
  );
}

function BreakdownRows({ title, data, color }) {
  const rows = Object.entries(data).sort((a, b) => b[1].total - a[1].total);
  if (!rows.length) return null;
  return (
    <div className="terminal-window overflow-hidden">
      <div className="terminal-header">
        <span className="font-mono text-[10px] text-white/25 ml-2">{title}</span>
      </div>
      <div className="p-4 space-y-3">
        {rows.map(([name, { total, completed }]) => (
          <div key={name}>
            <div className="flex items-baseline justify-between gap-3 mb-1.5">
              <span className="font-mono text-[11px] text-white/60 truncate">{name}</span>
              <span className="font-mono text-[11px] text-white/35 flex-shrink-0">{completed}/{total}</span>
            </div>
            <ProgressBar percent={(completed / total) * 100} color={color} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── the 100-day grid ──────────────────────────────────────────────────────
// Grouped by week, because 100 undifferentiated squares is a heat map, not a
// plan - the weeks are how the curriculum is actually structured and how
// someone locates "where am I".

function JourneyGrid({ dayIndex, completedDays, joined }) {
  const weeks = useMemo(() => {
    const m = new Map();
    for (const d of dayIndex) {
      const w = d.week || Math.ceil(d.day / 7);
      if (!m.has(w)) m.set(w, []);
      m.get(w).push(d);
    }
    return [...m.entries()].sort((a, b) => a[0] - b[0]);
  }, [dayIndex]);

  const live = currentDay();

  return (
    <div className="space-y-5">
      {weeks.map(([week, days]) => {
        const doneInWeek = days.filter(d => completedDays[String(d.day)]).length;
        return (
          <div key={week}>
            <div className="flex items-baseline gap-3 mb-2.5">
              <span className="font-mono text-[11px] text-white/45 tracking-wider">WEEK {week}</span>
              <span className="font-mono text-[10px] text-white/22">{days[0]?.topic}</span>
              <span className="font-mono text-[10px] text-white/22 ml-auto">{doneInWeek}/{days.length}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2">
              {days.map(d => {
                const state = dayState(d.day, completedDays);
                const locked = state === DAY_STATE.LOCKED;
                const done = state === DAY_STATE.COMPLETED;
                const today = state === DAY_STATE.TODAY;
                const accent = done ? GREEN : today ? CYAN : "rgba(255,255,255,0.14)";

                const inner = (
                  <>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-[10px]" style={{ color: locked ? "rgba(255,255,255,0.2)" : accent }}>
                        DAY {d.day}
                      </span>
                      {done ? <CheckCircle2 size={12} style={{ color: GREEN }} />
                        : locked ? <Lock size={11} className="text-white/18" />
                        : today ? <Target size={12} style={{ color: CYAN }} /> : null}
                    </div>
                    <p className={`font-sans text-[12px] leading-snug mb-1.5 ${locked ? "text-white/25" : "text-white/80"}`}
                      style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {d.name}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[9px]" style={{ color: locked ? "rgba(255,255,255,0.18)" : (DIFFICULTY_COLOR[d.difficulty] || "rgba(255,255,255,0.3)") }}>
                        {d.difficulty}
                      </span>
                      {problemLabel(d) && (
                        <span className="font-mono text-[9px]" style={{ color: locked ? "rgba(255,255,255,0.15)" : "rgba(0,255,255,0.5)" }}>
                          {problemLabel(d)}
                        </span>
                      )}
                      <span className="font-mono text-[9px] text-white/20 ml-auto">{formatDayDate(d.day).replace(/ \d{4}$/, "")}</span>
                    </div>
                  </>
                );

                const cls = "terminal-window p-2.5 h-full transition-colors duration-150 block";
                const style = { borderColor: done ? `${GREEN}35` : today ? `${CYAN}45` : undefined };

                // A locked day is not a link at all rather than a link that
                // bounces - a dead-end tap on mobile is worse than an obviously
                // inert card.
                return locked ? (
                  <div key={d.day} className={`${cls} opacity-55 cursor-not-allowed`} style={style}
                    title={`Unlocks ${formatDayDate(d.day)}`}>{inner}</div>
                ) : (
                  <Link key={d.day} href={`/devert100/day/${d.day}`} className={`${cls} hover:border-white/25`} style={style}>
                    {inner}
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
      {!joined && live > 0 && (
        <p className="font-mono text-[11px] text-white/30 text-center pt-2">
          Every past day stays open. Join to track what you finish.
        </p>
      )}
    </div>
  );
}

// ── page ──────────────────────────────────────────────────────────────────

export function Devert100App() {
  const windowed = useIsWindowed();
  const { user, loading: authLoading } = useAuth();

  const [dayIndex, setDayIndex] = useState(null);   // null = loading
  const [participant, setParticipant] = useState(undefined); // undefined = loading
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetchDayIndex()
      .then(d => { if (!cancelled) setDayIndex(d); })
      .catch(() => { if (!cancelled) setDayIndex([]); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (authLoading) return undefined;
    if (!user) { setParticipant(null); return undefined; }
    return subscribeToParticipant(user.uid, setParticipant);
  }, [user, authLoading]);

  const completedDays = participant?.completedDays || {};
  const summary = useMemo(() => progressSummary(participant), [participant]);
  const { byTopic, byDifficulty } = useMemo(
    () => breakdowns(dayIndex || [], completedDays),
    [dayIndex, completedDays],
  );

  const live = currentDay();
  const started = hasRunStarted();
  const joined = !!participant;
  const todayEntry = (dayIndex || []).find(d => d.day === live) || null;

  async function handleJoin() {
    if (!user) return;
    setJoining(true); setError("");
    try {
      await joinDevert100(user.uid);
    } catch (e) {
      setError(e?.message || "Could not join. Try again.");
    } finally {
      setJoining(false);
    }
  }

  const loading = dayIndex === null || participant === undefined || authLoading;

  return (
    <main className={`${windowed ? "min-h-full" : "min-h-screen"} pt-10 pb-32 px-5 sm:px-6 relative`}>
      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />

      <div className="relative max-w-6xl mx-auto">
        {/* ── header ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <p className="font-mono text-xs text-neon-green/55 mb-3 tracking-wider">// /devert100 - execute.sh</p>
          <h1 className="font-sans font-bold tracking-tighter text-white leading-none mb-3"
            style={{ fontSize: "clamp(2.5rem,7vw,5rem)" }}>
            DEVERT <span className="text-neon-green">100</span>
          </h1>
          <p className="font-mono text-sm text-white/40 max-w-2xl">
            100 days. 100+ problems. One developer transformation.
          </p>
        </motion.div>

        {loading ? (
          <div className="terminal-window p-10 flex items-center justify-center gap-3">
            <Loader2 size={16} className="animate-spin text-white/30" />
            <span className="font-mono text-xs text-white/35">loading the run...</span>
          </div>
        ) : !started ? (
          /* ── before day 1 ── */
          <div className="terminal-window overflow-hidden">
            <div className="terminal-header"><span className="font-mono text-[10px] text-white/25 ml-2">countdown</span></div>
            <div className="p-8 text-center">
              <CalendarDays size={26} style={{ color: CYAN }} className="mx-auto mb-4" />
              <h2 className="font-sans text-2xl font-bold text-white mb-2">Day 1 is {formatDayDate(1)}</h2>
              <p className="font-mono text-xs text-white/40">
                {Math.ceil((dateForDay(1) - new Date()) / 86400000)} days out. The run ends {formatDayDate(100)}.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* ── join / progress strip ── */}
            {!joined ? (
              <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                className="terminal-window overflow-hidden mb-8" style={{ borderColor: `${GREEN}30` }}>
                <div className="terminal-header"><span className="font-mono text-[10px] text-white/25 ml-2">join.sh</span></div>
                <div className="p-5 sm:p-7">
                  <h2 className="font-sans text-xl sm:text-2xl font-bold text-white mb-2">
                    Stop collecting tutorials. Start solving.
                  </h2>
                  <p className="font-mono text-[13px] text-white/45 mb-5 max-w-2xl leading-relaxed">
                    A structured 100-day DSA run for developers who want to actually execute.
                    One problem a day, with the pattern, the brute force, the optimal approach and
                    the follow-ups already written down. Day {live} is live right now.
                  </p>

                  {error && (
                    <div className="flex items-start gap-2 mb-4 font-mono text-[11px]" style={{ color: "#FF5050" }}>
                      <AlertCircle size={13} className="mt-0.5 flex-shrink-0" /> {error}
                    </div>
                  )}

                  {user ? (
                    <button onClick={handleJoin} disabled={joining}
                      className="inline-flex items-center gap-2 font-mono text-xs font-semibold px-5 py-3 rounded disabled:opacity-60"
                      style={{ background: GREEN, color: "#05080F" }}>
                      {joining ? <Loader2 size={13} className="animate-spin" /> : <Flame size={13} />}
                      {joining ? "JOINING..." : "JOIN DEVERT 100"}
                    </button>
                  ) : (
                    <div className="flex flex-wrap items-center gap-3">
                      <Link href="/login?next=/devert100"
                        className="inline-flex items-center gap-2 font-mono text-xs font-semibold px-5 py-3 rounded"
                        style={{ background: GREEN, color: "#05080F" }}>
                        <LogIn size={13} /> SIGN IN TO JOIN
                      </Link>
                      <span className="font-mono text-[11px] text-white/30">
                        Uses your existing DeVert account. Browsing stays open.
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                  <Stat icon={CalendarDays} label="RUN_DAY" value={`${live}/${DEVERT100_TOTAL_DAYS}`}
                    sub={formatDayDate(live)} color={CYAN} />
                  <Stat icon={CheckCircle2} label="COMPLETED" value={summary.completed}
                    sub={`${summary.percent}% of the run`} color={GREEN} />
                  <Stat icon={Flame} label="STREAK" value={summary.currentStreak}
                    sub={`longest ${summary.longestStreak}`} color="#FF6430" />
                  <Stat icon={Trophy} label="REMAINING" value={summary.remaining}
                    sub={summary.missed > 0 ? `${summary.missed} unfinished so far` : "on pace"} color={GOLD} />
                </div>
                <ProgressBar percent={summary.percent} />
              </motion.div>
            )}

            {/* ── today's mission ── */}
            {todayEntry && (
              <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                className="terminal-window overflow-hidden mb-8" style={{ borderColor: `${CYAN}30` }}>
                <div className="terminal-header">
                  <span className="font-mono text-[10px] text-white/25 ml-2">todays_mission</span>
                </div>
                <div className="p-5 sm:p-6 flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <span className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-widest px-2 py-1 rounded mb-2.5"
                      style={{ color: completedDays[String(live)] ? GREEN : CYAN,
                        background: `${completedDays[String(live)] ? GREEN : CYAN}15`,
                        border: `1px solid ${completedDays[String(live)] ? GREEN : CYAN}35` }}>
                      {completedDays[String(live)] ? <><CheckCircle2 size={11} /> DAY {live} DONE</> : <><Target size={11} /> DAY {live} - TODAY</>}
                    </span>
                    <h2 className="font-sans text-xl sm:text-2xl font-bold text-white mb-1.5">{todayEntry.name}</h2>
                    <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                      {problemLabel(todayEntry) && (
                        <span className="font-mono text-[11px] px-1.5 rounded" style={{ color: CYAN, background: `${CYAN}12` }}>
                          {problemLabel(todayEntry)}
                        </span>
                      )}
                      <span className="font-mono text-[11px] text-white/55">{todayEntry.topic}</span>
                      <span className="font-mono text-[11px]" style={{ color: DIFFICULTY_COLOR[todayEntry.difficulty] || "#fff6" }}>
                        {todayEntry.difficulty}
                      </span>
                      <span className="font-mono text-[11px] text-white/40">{todayEntry.pattern}</span>
                    </div>
                  </div>
                  {/* Signed out, this goes through login and lands on the day
                      afterwards. The day itself stays publicly readable - but
                      "START MISSION" promises tracked progress, and delivering
                      an untracked page instead is the kind of small broken
                      promise that stops someone bothering to sign in at all. */}
                  <Link href={user ? `/devert100/day/${live}` : `/login?next=/devert100/day/${live}`}
                    className="flex-shrink-0 inline-flex items-center gap-1.5 font-mono text-xs font-semibold px-4 py-2.5 rounded"
                    style={{ background: completedDays[String(live)] ? "rgba(255,255,255,0.08)" : CYAN,
                      color: completedDays[String(live)] ? "#fff" : "#05080F" }}>
                    {completedDays[String(live)] ? "REVIEW" : !user ? "SIGN IN TO START" : "START MISSION"} <ArrowRight size={13} />
                  </Link>
                </div>
              </motion.div>
            )}

            {/* ── what it is ── */}
            <div className="terminal-window overflow-hidden mb-8">
              <div className="terminal-header"><span className="font-mono text-[10px] text-white/25 ml-2">what_is_devert_100</span></div>
              <div className="p-5 sm:p-6">
                <p className="font-mono text-[13px] text-white/50 leading-relaxed mb-4">
                  A structured 100-day DSA execution run. Every day: understand the problem, name the
                  pattern, study the brute force, derive the optimal approach, write it, test it, mark
                  the day, share it, come back tomorrow.
                </p>
                <p className="font-mono text-[12px] text-white/35 leading-relaxed">
                  The goal is not to finish 100 problems. It is to build problem solving, pattern
                  recognition, consistency and interview readiness - in that order.
                </p>
                <div className="flex flex-wrap gap-2 mt-5">
                  {["Learn", "Think", "Code", "Solve", "Ship"].map((step, i) => (
                    <span key={step} className="font-mono text-[10px] px-2.5 py-1 rounded tracking-wider"
                      style={{ color: i % 2 ? CYAN : GREEN, background: `${i % 2 ? CYAN : GREEN}12`, border: `1px solid ${i % 2 ? CYAN : GREEN}28` }}>
                      {step.toUpperCase()}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* ── breakdowns, only once there is something to break down ── */}
            {joined && summary.completed > 0 && (
              <div className="grid lg:grid-cols-2 gap-4 mb-8">
                <BreakdownRows title="topic_progress" data={byTopic} color={GREEN} />
                <BreakdownRows title="difficulty_progress" data={byDifficulty} color={CYAN} />
              </div>
            )}

            {/* ── the journey ── */}
            <div className="mb-4 flex items-baseline gap-3">
              <Layers size={14} style={{ color: CYAN }} />
              <h2 className="font-mono text-xs text-white/50 tracking-wider">YOUR_100_DAY_JOURNEY</h2>
              <span className="font-mono text-[10px] text-white/22 ml-auto flex items-center gap-1.5">
                <TrendingUp size={11} /> {summary.completed}/{DEVERT100_TOTAL_DAYS}
              </span>
            </div>
            <JourneyGrid dayIndex={dayIndex || []} completedDays={completedDays} joined={joined} />
          </>
        )}
      </div>
    </main>
  );
}
