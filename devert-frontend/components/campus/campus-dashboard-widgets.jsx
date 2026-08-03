"use client";

// The presentational widgets that make up a student's Campus dashboard: hero
// illustration + rotating quote, animated counters, progress rings, the weekly
// progress chart, the activity feed, the streak ring and the contest CTA.
//
// Two rules every widget here follows, both from CLAUDE.md:
//  - No emoji, ever. Where a design calls for a flame/star/coin/trophy glyph,
//    that's a lucide-react icon in a tinted chip, not a codepoint.
//  - Colors come from CAMPUS.* tokens (never literal hex), so every widget
//    repaints correctly when .campus-theme[data-theme] flips to dark. Tints go
//    through tint() rather than an alpha-suffixed string - see its comment in
//    lib/campus-theme.js for why the suffix form silently failed.
//
// Charts are hand-rolled SVG on purpose: there is no charting library in
// package.json, and adding one (recharts is ~90kB gzipped) to draw a 7-point
// sparkline would be the single largest dependency in a static-export bundle.
// A fixed viewBox scaled to width="100%" keeps it resolution-independent with
// no ResizeObserver and no layout measurement.

import { useEffect, useId, useMemo, useState, useSyncExternalStore } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import {
  Flame, Zap, Coins, Trophy, Target, Medal, BookOpen, ArrowRight, Gift,
  Activity, AlertTriangle, Quote as QuoteIcon, ChevronRight, Clock,
} from "lucide-react";
import { CAMPUS, tint } from "@/lib/campus-theme";
// CampusSkeleton, not a hand-rolled `animate-pulse` block: its shimmer runs
// line -> surface -> line, which stays visible in BOTH themes. A plain tinted
// block using CAMPUS.surface2 (#F0F1FA) sits ~1.5% away from CAMPUS.paper
// (#F6F7FC) in light mode, so a loading dashboard read as one large blank void
// rather than as content arriving.
import { CampusCard, CampusButton, CampusEmptyState, CampusChip, CampusSkeleton } from "@/components/campus/campus-ui";
import { relativeTime } from "@/lib/campusDashboard";

/* ------------------------------------------------------------------ counters */

// Counts a number up on mount/change. Falls straight through to the final
// value (no animation, no interim frames) under prefers-reduced-motion, and
// for any non-finite value - so callers can pass "-" or "#12" without a guard.
//
// Driven by a framer-motion MotionValue rather than React state on purpose: a
// count-up is ~50 frames, and one setState per frame is 50 re-renders of this
// component (and, since these sit inside hero/KPI cards, of everything React
// re-reconciles alongside them). A MotionValue writes the text node directly,
// so the animation costs zero renders - which is also why there's no
// setState-in-effect here for the React Compiler's lint to object to.
export function CountUp({ value, duration = 900, className = "", style }) {
  const reduce = useReducedMotion();
  const numeric = typeof value === "number" && Number.isFinite(value);
  const motionValue = useMotionValue(0);
  const text = useTransform(motionValue, v => Math.round(v).toLocaleString());

  useEffect(() => {
    if (!numeric) return undefined;
    if (reduce) { motionValue.set(value); return undefined; }
    const controls = animate(motionValue, value, {
      duration: duration / 1000,
      ease: [0.22, 1, 0.36, 1],
    });
    return () => controls.stop();
  }, [value, duration, reduce, numeric, motionValue]);

  if (!numeric) return <span className={className} style={style}>{value}</span>;
  return <motion.span className={`tabular-nums ${className}`} style={style}>{text}</motion.span>;
}

/* --------------------------------------------------------------------- rings */

// Circular progress indicator. `size`/`stroke` are px; label/sublabel render
// centered inside. The ring animates its stroke-dashoffset rather than a width,
// which keeps it on the GPU-friendly property set and lets framer-motion drop
// the animation entirely under prefers-reduced-motion.
export function ProgressRing({
  pct, size = 76, stroke = 7, color = CAMPUS.teal, trackColor,
  children, className = "", ariaLabel,
}) {
  const reduce = useReducedMotion();
  const clamped = Math.max(0, Math.min(100, Number(pct) || 0));
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - clamped / 100);

  return (
    <div className={`relative flex-shrink-0 ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" role="img"
        aria-label={ariaLabel || `${Math.round(clamped)} percent complete`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke}
          stroke={trackColor || CAMPUS.line} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke}
          stroke={color} strokeLinecap="round" strokeDasharray={circumference}
          initial={{ strokeDashoffset: reduce ? offset : circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={reduce ? { duration: 0 } : { duration: 0.9, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children ?? (
          <span className="text-[13px] font-bold" style={{ color: CAMPUS.ink }}>
            {Math.round(clamped)}%
          </span>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------- illustration */

// An ORIGINAL, self-authored flat-vector scene (desk + laptop + seated figure +
// floating code chips), not a copy of any reference illustration and not a
// third-party asset: the CSP on this project forbids remote assets outright,
// and tracing someone else's artwork would be an IP problem regardless of
// hosting. Every fill is a CAMPUS.* token, so it re-tints itself in dark mode
// instead of staying a light-mode PNG on a navy page - which is the actual
// reason this is inline SVG rather than an image file.
//
// aria-hidden + no title: it carries no information the adjacent heading
// doesn't already state, so announcing it would just be noise for a screen
// reader. The gentle float is decorative and disabled under reduced-motion.
export function HeroIllustration({ className = "" }) {
  const reduce = useReducedMotion();
  const float = (delay) => reduce ? {} : {
    animate: { y: [0, -5, 0] },
    transition: { duration: 4.5, repeat: Infinity, ease: "easeInOut", delay },
  };

  return (
    <svg viewBox="0 0 260 190" className={className} aria-hidden="true" focusable="false">
      {/* soft backdrop blooms */}
      <circle cx="150" cy="80" r="72" fill={tint(CAMPUS.teal, 16)} />
      <circle cx="206" cy="128" r="34" fill={tint(CAMPUS.purple, 18)} />

      {/* floating code chips */}
      <motion.g {...float(0)}>
        <rect x="24" y="26" width="54" height="34" rx="10" fill={CAMPUS.surface} stroke={CAMPUS.line} />
        <path d="M40 37l-6 6 6 6M62 37l6 6-6 6M56 35l-10 16" stroke={CAMPUS.teal} strokeWidth="2.4"
          strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </motion.g>
      <motion.g {...float(1.1)}>
        <rect x="196" y="20" width="42" height="30" rx="9" fill={CAMPUS.surface} stroke={CAMPUS.line} />
        <path d="M206 35l5 5 10-11" stroke={CAMPUS.good} strokeWidth="2.6" strokeLinecap="round"
          strokeLinejoin="round" fill="none" />
      </motion.g>
      <motion.g {...float(2.2)}>
        <rect x="14" y="92" width="46" height="30" rx="9" fill={CAMPUS.surface} stroke={CAMPUS.line} />
        <rect x="23" y="102" width="20" height="3.4" rx="1.7" fill={tint(CAMPUS.purple, 55)} />
        <rect x="23" y="109" width="28" height="3.4" rx="1.7" fill={tint(CAMPUS.teal, 45)} />
      </motion.g>

      {/* desk */}
      <rect x="70" y="158" width="164" height="5" rx="2.5" fill={tint(CAMPUS.inkFaint, 34)} />

      {/* seated figure - simple geometric shapes, no facial detail (keeps it
          neutral rather than depicting a specific person) */}
      <path d="M96 158c0-24 11-38 26-38s26 14 26 38z" fill={CAMPUS.purple} />
      <circle cx="122" cy="104" r="15" fill={tint(CAMPUS.gold, 62)} />
      <path d="M107 100a15 15 0 0130 0c0-9-7-14-15-14s-15 5-15 14z" fill={CAMPUS.ink} opacity="0.72" />
      <path d="M142 152c10-3 17-9 20-17" stroke={CAMPUS.purple} strokeWidth="9" strokeLinecap="round" fill="none" />

      {/* laptop */}
      <path d="M158 158l8-40h48l8 40z" fill={CAMPUS.surface2} stroke={CAMPUS.line} />
      <rect x="164" y="86" width="52" height="36" rx="4" fill={CAMPUS.chromeBg} />
      <path d="M176 99l-4 5 4 5M204 99l4 5-4 5M198 97l-8 14" stroke={CAMPUS.cyan} strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <rect x="152" y="156" width="80" height="6" rx="3" fill={tint(CAMPUS.inkFaint, 46)} />

      {/* mug */}
      <rect x="82" y="142" width="15" height="16" rx="3" fill={CAMPUS.teal} />
      <path d="M97 147h5a4 4 0 010 8h-5" stroke={CAMPUS.teal} strokeWidth="2.4" fill="none" />
    </svg>
  );
}

/* ---------------------------------------------------------------- quote card */

// Curated, attributable quotes only - no scraped "motivational" text with a
// dubious byline, since this renders as a factual attribution to a real person.
const QUOTES = [
  { text: "The expert in anything was once a beginner.", author: "Helen Hayes" },
  { text: "The only way to learn a new programming language is by writing programs in it.", author: "Dennis Ritchie" },
  { text: "First, solve the problem. Then, write the code.", author: "John Johnson" },
  { text: "Programs must be written for people to read, and only incidentally for machines to execute.", author: "Harold Abelson" },
  { text: "Talk is cheap. Show me the code.", author: "Linus Torvalds" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "Learning never exhausts the mind.", author: "Leonardo da Vinci" },
  { text: "The beautiful thing about learning is that no one can take it away from you.", author: "B.B. King" },
  { text: "Make it work, make it right, make it fast.", author: "Kent Beck" },
  { text: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier" },
];

function dayOfYear(d) {
  return Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86400000);
}

// Rotates once per calendar day, indexed by day-of-year rather than random, so
// the quote is stable across tabs/reloads within a day (a quote that reshuffles
// on every re-render reads as a glitch, not a flourish).
//
// useSyncExternalStore, not a date read during render: this app is a static
// export, so the HTML is prerendered at BUILD time, and a build-day-dependent
// index would disagree with whatever day the visitor actually loads it on -
// a hydration mismatch on visible text. The server snapshot pins index 0 for
// the prerender and the client snapshot resolves the real day, which is exactly
// the contract this hook exists for. getSnapshot stays consistent between
// renders (the day doesn't change mid-render), so it can't loop.
const subscribeToNothing = () => () => {};

function useDailyQuoteIndex() {
  return useSyncExternalStore(
    subscribeToNothing,
    () => dayOfYear(new Date()) % QUOTES.length,
    () => 0,
  );
}

export function DailyQuoteCard({ className = "" }) {
  const reduce = useReducedMotion();
  const index = useDailyQuoteIndex();
  const quote = QUOTES[index];

  return (
    <div className={`rounded-2xl p-5 flex flex-col justify-center ${className}`}
      style={{ background: tint(CAMPUS.surface, 62), border: `1px solid ${CAMPUS.line}` }}>
      <QuoteIcon size={22} style={{ color: tint(CAMPUS.teal, 70) }} aria-hidden="true" />
      <motion.blockquote
        key={index}
        initial={reduce ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="mt-2"
      >
        <p className="text-[15px] font-semibold leading-snug" style={{ color: CAMPUS.ink }}>
          {quote.text}
        </p>
        <footer className="text-[12.5px] mt-2.5" style={{ color: CAMPUS.teal }}>
          &ndash; {quote.author}
        </footer>
      </motion.blockquote>
    </div>
  );
}

/* ----------------------------------------------------------- hero stat chips */

// The inline achievement chips that sit under the hero greeting. Each is a
// lucide icon in a tinted square + value + caption - deliberately a lighter
// treatment than CampusStat, since these repeat information the KPI row also
// shows and shouldn't compete with it visually.
export function HeroStatChip({ icon: Icon, color, value, label, hint }) {
  return (
    <div className="flex items-center gap-2.5 min-w-0" title={hint || undefined}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: tint(color, 16), color }}>
        <Icon size={16} />
      </div>
      <div className="min-w-0">
        <p className="text-[13.5px] font-bold leading-tight truncate" style={{ color: CAMPUS.ink }}>
          {typeof value === "number" ? <CountUp value={value} /> : value}
        </p>
        <p className="text-[11px] leading-tight truncate" style={{ color: CAMPUS.inkFaint }}>{label}</p>
      </div>
    </div>
  );
}

export function HeroStatChips({ streak, bestStreak, xp, coins, rank, className = "" }) {
  return (
    <div className={`flex items-center gap-x-6 gap-y-3.5 flex-wrap ${className}`}>
      <HeroStatChip icon={Flame} color={CAMPUS.warn} value={`${streak ?? 0} Day Streak`}
        label={bestStreak ? `Best: ${bestStreak} days` : "Keep it going!"}
        hint="Consecutive days with at least one completed learning activity." />
      <HeroStatChip icon={Zap} color={CAMPUS.teal} value={`${(xp ?? 0).toLocaleString()} XP`}
        label="Keep learning!"
        hint="Spendable reward points earned from learning activities." />
      <HeroStatChip icon={Coins} color={CAMPUS.gold} value={`${(coins ?? 0).toLocaleString()} Coins`}
        label="Collect more!"
        hint="Your real wallet balance - withdrawable as INR from the Wallet page." />
      {rank ? (
        <HeroStatChip icon={Medal} color={CAMPUS.good} value={`#${rank}`} label="Campus rank"
          hint="Your rank within this campus, based on Score." />
      ) : null}
    </div>
  );
}

/* --------------------------------------------------------------------- chart */

const CHART_METRICS = [
  { key: "xp",         label: "XP Earned",  color: CAMPUS.teal,   icon: Zap },
  { key: "activities", label: "Activities", color: CAMPUS.purple, icon: Activity },
  { key: "coins",      label: "Coins",      color: CAMPUS.gold,   icon: Coins },
];

const VB_W = 640, VB_H = 200, PAD_L = 34, PAD_R = 12, PAD_T = 14, PAD_B = 26;

// Catmull-Rom -> cubic bezier, which gives the "smooth line" the design calls
// for while still passing exactly through every data point (a plain quadratic
// smoothing would visually misreport values, which matters when the line is
// someone's XP history).
function smoothPath(points) {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;
    const c1x = p1.x + (p2.x - p0.x) / 6, c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6, c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

function niceCeil(n) {
  if (n <= 4) return 4;
  const mag = Math.pow(10, Math.floor(Math.log10(n)));
  return Math.ceil(n / (mag / 2)) * (mag / 2);
}

/**
 * Weekly/monthly progress chart over the reward ledger's per-day buckets.
 * `series7`/`series30` come from lib/campusDashboard.js's buildDailySeries, so
 * idle days are already zero-filled - the line never skips a day and silently
 * implies activity that didn't happen.
 */
export function WeeklyProgressCard({ series7 = [], series30 = [], totals, loading = false }) {
  const gradientId = useId();
  const reduce = useReducedMotion();
  const [metricKey, setMetricKey] = useState("xp");
  const [range, setRange] = useState(7);
  const [hover, setHover] = useState(null);

  const metric = CHART_METRICS.find(m => m.key === metricKey) || CHART_METRICS[0];
  const series = range === 7 ? series7 : series30;

  const { points, max, areaPath, linePath } = useMemo(() => {
    const values = series.map(d => d[metric.key] || 0);
    const peak = niceCeil(Math.max(...values, 0));
    const innerW = VB_W - PAD_L - PAD_R;
    const innerH = VB_H - PAD_T - PAD_B;
    const step = series.length > 1 ? innerW / (series.length - 1) : 0;
    const pts = series.map((d, i) => ({
      x: PAD_L + i * step,
      y: PAD_T + innerH * (1 - (d[metric.key] || 0) / peak),
      datum: d,
      value: d[metric.key] || 0,
      index: i,
    }));
    const line = smoothPath(pts);
    const baseline = PAD_T + innerH;
    const area = pts.length
      ? `${line} L ${pts[pts.length - 1].x} ${baseline} L ${pts[0].x} ${baseline} Z`
      : "";
    return { points: pts, max: peak, areaPath: area, linePath: line };
  }, [series, metric.key]);

  const gridLines = [0, 0.25, 0.5, 0.75, 1];
  const total = series.reduce((s, d) => s + (d[metric.key] || 0), 0);

  // Only label every Nth tick on the 30-day range - 30 day-labels in ~600px of
  // viewBox overlap into an unreadable smear.
  const labelEvery = range === 7 ? 1 : 5;

  if (loading) {
    return (
      <CampusCard className="p-5 space-y-3">
        <CampusSkeleton variant="rect" height={18} width="38%" />
        <CampusSkeleton variant="rect" height={210} />
      </CampusCard>
    );
  }

  return (
    <CampusCard className="p-5">
      <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
        <div>
          <h3 className="text-[15px] font-semibold" style={{ color: CAMPUS.ink }}>Weekly Progress</h3>
          <p className="text-[12px] mt-0.5" style={{ color: CAMPUS.inkFaint }}>
            {total.toLocaleString()} {metric.label.toLowerCase()} in the last {range} days
          </p>
        </div>
        <div className="flex items-center gap-1.5 p-1 rounded-xl flex-shrink-0"
          style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}` }}>
          {[7, 30].map(r => (
            <button key={r} onClick={() => { setRange(r); setHover(null); }}
              className="text-[11.5px] font-semibold px-2.5 py-1 rounded-lg transition-colors"
              style={r === range
                ? { background: CAMPUS.surface, color: CAMPUS.ink, boxShadow: CAMPUS.shadow }
                : { color: CAMPUS.inkFaint }}>
              {r}d
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap mb-3">
        {CHART_METRICS.map(m => {
          const active = m.key === metricKey;
          return (
            <button key={m.key} onClick={() => { setMetricKey(m.key); setHover(null); }}
              className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold px-2.5 py-1 rounded-full transition-all"
              style={active
                ? { background: tint(m.color, 16), color: m.color, border: `1px solid ${tint(m.color, 30)}` }
                : { background: "transparent", color: CAMPUS.inkFaint, border: `1px solid ${CAMPUS.line}` }}>
              <m.icon size={11} /> {m.label}
            </button>
          );
        })}
      </div>

      <div className="relative">
        <svg viewBox={`0 0 ${VB_W} ${VB_H}`} width="100%" style={{ display: "block", overflow: "visible" }}
          role="img"
          aria-label={`${metric.label} per day over the last ${range} days. Total ${total}. Peak ${Math.max(...series.map(d => d[metric.key] || 0), 0)}.`}
          onMouseLeave={() => setHover(null)}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const xInVb = ((e.clientX - rect.left) / rect.width) * VB_W;
            let nearest = points[0];
            for (const p of points) {
              if (Math.abs(p.x - xInVb) < Math.abs(nearest.x - xInVb)) nearest = p;
            }
            setHover(nearest || null);
          }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={metric.color} stopOpacity="0.28" />
              <stop offset="100%" stopColor={metric.color} stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {gridLines.map(g => {
            const y = PAD_T + (VB_H - PAD_T - PAD_B) * g;
            return (
              <g key={g}>
                <line x1={PAD_L} y1={y} x2={VB_W - PAD_R} y2={y} stroke={CAMPUS.line} strokeWidth="1" />
                <text x={PAD_L - 8} y={y + 3.5} textAnchor="end" fontSize="10" fill={CAMPUS.inkFaint}>
                  {Math.round(max * (1 - g))}
                </text>
              </g>
            );
          })}

          {areaPath && (
            <motion.path d={areaPath} fill={`url(#${gradientId})`}
              initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }} />
          )}
          {linePath && (
            <motion.path d={linePath} fill="none" stroke={metric.color} strokeWidth="2.4"
              strokeLinecap="round" strokeLinejoin="round"
              initial={reduce ? false : { pathLength: 0 }} animate={{ pathLength: 1 }}
              transition={{ duration: 0.9, ease: "easeOut" }} />
          )}

          {points.map(p => (
            <g key={p.index}>
              {p.index % labelEvery === 0 && (
                <text x={p.x} y={VB_H - 8} textAnchor="middle" fontSize="10" fill={CAMPUS.inkFaint}>
                  {range === 7 ? p.datum.label : p.datum.date.getDate()}
                </text>
              )}
              {hover?.index === p.index && (
                <line x1={p.x} y1={PAD_T} x2={p.x} y2={VB_H - PAD_B} stroke={metric.color}
                  strokeWidth="1" strokeDasharray="3 3" opacity="0.55" />
              )}
              <circle cx={p.x} cy={p.y} r={hover?.index === p.index ? 5 : 3}
                fill={CAMPUS.surface} stroke={metric.color} strokeWidth="2.2" />
            </g>
          ))}
        </svg>

        {hover && (
          <div className="absolute pointer-events-none z-10 px-2.5 py-1.5 rounded-lg whitespace-nowrap"
            style={{
              left: `${(hover.x / VB_W) * 100}%`,
              top: `${(hover.y / VB_H) * 100}%`,
              transform: "translate(-50%, calc(-100% - 10px))",
              background: CAMPUS.chromeBg, color: CAMPUS.chromeFg, boxShadow: CAMPUS.shadowLg,
            }}>
            <span className="text-[11px] font-bold">{hover.value.toLocaleString()} {metric.label.toLowerCase()}</span>
            <span className="block text-[10px] opacity-75">
              {hover.datum.date.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}
            </span>
          </div>
        )}
      </div>

      {totals && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-4" style={{ borderTop: `1px solid ${CAMPUS.line}` }}>
          {totals.map(t => (
            <div key={t.label} className="px-3 py-2 rounded-xl" style={{ background: CAMPUS.paper }}>
              <p className="text-[10px] font-mono tracking-wider" style={{ color: CAMPUS.inkFaint }}>
                {t.label.toUpperCase()}
              </p>
              <p className="text-[15px] font-bold mt-0.5" style={{ color: t.color || CAMPUS.ink }}>{t.value}</p>
            </div>
          ))}
        </div>
      )}
    </CampusCard>
  );
}

/* ----------------------------------------------------------- activity feed */

const ACTIVITY_ICONS = {
  daily_learning_day: BookOpen,
  daily_learning_problem: Target,
  programming_topic: BookOpen,
  cscore_topic: BookOpen,
  contest: Trophy,
  arena_match: Trophy,
  codelab_problem: Target,
  learning_task: BookOpen,
  aptitude_question: Target,
  admin_manual: Zap,
  duplicate_reversal: AlertTriangle,
};

// Renders the reward_grants ledger directly - this is the same source the admin
// student dashboard reads, so a student sees exactly what staff sees about how
// their XP was earned, including reversals (flagged, never hidden).
export function RecentActivityCard({ items = [], loading = false, onViewAll }) {
  if (loading) {
    return (
      <CampusCard className="p-5 space-y-3">
        <CampusSkeleton variant="rect" height={18} width="42%" />
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="flex items-center gap-3">
            <CampusSkeleton variant="circle" width={32} />
            <CampusSkeleton variant="text" width={`${72 - i * 9}%`} />
          </div>
        ))}
      </CampusCard>
    );
  }

  if (items.length === 0) {
    return (
      <CampusEmptyState icon={Activity} color={CAMPUS.blue} title="No activity yet"
        description="Complete a Daily Learning day, solve a problem, or enter a contest - everything you earn shows up here." />
    );
  }

  return (
    <CampusCard className="p-5">
      <div className="flex items-center justify-between gap-2 mb-3.5">
        <h3 className="text-[15px] font-semibold" style={{ color: CAMPUS.ink }}>Recent Activity</h3>
        {onViewAll && (
          <button onClick={onViewAll} className="inline-flex items-center gap-1 text-[11.5px] font-semibold"
            style={{ color: CAMPUS.teal }}>
            View all <ChevronRight size={12} />
          </button>
        )}
      </div>

      {/* A real <ol> with a rendered rail, not a stack of divs - it's a
          chronological list, so the markup should say so. */}
      <ol className="relative space-y-0.5">
        {items.map((item, i) => {
          const Icon = ACTIVITY_ICONS[item.activityType] || Activity;
          const accent = item.reversed ? CAMPUS.bad : item.coins > 0 ? CAMPUS.gold : CAMPUS.teal;
          const last = i === items.length - 1;
          return (
            <li key={item.id} className="relative flex gap-3 pb-3">
              {!last && (
                <span className="absolute left-[15px] top-9 bottom-0 w-px" style={{ background: CAMPUS.line }}
                  aria-hidden="true" />
              )}
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 z-10"
                style={{ background: tint(accent, 16), color: accent }}>
                <Icon size={14} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium leading-tight" style={{ color: CAMPUS.ink }}>
                  {item.label}
                  {item.reversed && <span className="ml-1.5 text-[10px] font-bold" style={{ color: CAMPUS.bad }}>REVERSED</span>}
                </p>
                <p className="text-[11px] mt-0.5 flex items-center gap-1" style={{ color: CAMPUS.inkFaint }}>
                  <Clock size={9} /> {relativeTime(item.grantedAt)}
                </p>
              </div>
              <div className="flex items-center gap-2.5 flex-shrink-0 pt-0.5">
                {!!item.xp && (
                  <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold tabular-nums"
                    style={{ color: item.xp < 0 ? CAMPUS.bad : CAMPUS.teal }}>
                    <Zap size={10} /> {item.xp > 0 ? "+" : ""}{item.xp}
                  </span>
                )}
                {!!item.coins && (
                  <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold tabular-nums"
                    style={{ color: item.coins < 0 ? CAMPUS.bad : CAMPUS.gold }}>
                    <Coins size={10} /> {item.coins > 0 ? "+" : ""}{item.coins}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </CampusCard>
  );
}

/* --------------------------------------------------------------- streak ring */

// The ring fills toward the student's own personal best rather than an
// arbitrary 7- or 30-day target: there is no configurable streak goal anywhere
// in the data model, so "% of your best" is the only honest denominator. A
// first-time streak (no best yet) fills against 7 as a starter milestone, which
// the caption states outright instead of implying a goal that was never set.
export function StreakRingCard({ streak = 0, bestStreak = 0, className = "" }) {
  const target = bestStreak > streak ? bestStreak : (bestStreak || 7);
  const pct = target ? (streak / target) * 100 : 0;
  const atBest = streak > 0 && streak >= (bestStreak || 0);

  return (
    <CampusCard className={`p-5 ${className}`}>
      <div className="flex items-center gap-4">
        <ProgressRing pct={pct} size={78} stroke={7} color={CAMPUS.warn}
          ariaLabel={`Current streak ${streak} days out of a personal best of ${target}`}>
          <Flame size={24} style={{ color: CAMPUS.warn }} />
        </ProgressRing>
        <div className="min-w-0">
          <p className="text-[10px] font-mono tracking-widest" style={{ color: CAMPUS.inkFaint }}>
            LEARNING STREAK
          </p>
          <p className="text-[20px] font-bold leading-tight mt-1" style={{ color: CAMPUS.ink }}>
            <CountUp value={streak} /> {streak === 1 ? "Day" : "Days"}
          </p>
          <p className="text-[12px] mt-1" style={{ color: CAMPUS.inkSoft }}>
            {streak === 0
              ? "Complete an activity today to start a streak."
              : atBest
                ? "That's your personal best - keep it up!"
                : `${target - streak} more to beat your best of ${target}.`}
          </p>
        </div>
      </div>
    </CampusCard>
  );
}

/* ------------------------------------------------------------- contest promo */

// The one full-bleed gradient CTA on the dashboard. Uses CAMPUS.gradientHero-
// adjacent chrome tokens so the white text keeps its contrast in both themes
// (CAMPUS.ink would invert and disappear against the gradient).
export function ContestCtaBanner({ onExplore, contestCount = 0 }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      whileHover={reduce ? undefined : { y: -2 }}
      transition={{ duration: 0.2 }}
      className="relative overflow-hidden rounded-2xl p-6"
      style={{ background: CAMPUS.gradientPrimary, boxShadow: "0 14px 38px rgba(99,102,241,0.28)" }}
    >
      <div className="absolute -right-8 -top-10 w-48 h-48 rounded-full pointer-events-none"
        style={{ background: "rgba(255,255,255,0.12)" }} aria-hidden="true" />
      <div className="absolute right-16 -bottom-14 w-32 h-32 rounded-full pointer-events-none"
        style={{ background: "rgba(255,255,255,0.10)" }} aria-hidden="true" />

      <div className="relative flex items-center justify-between gap-5 flex-wrap">
        <div className="min-w-0">
          <h3 className="flex items-center gap-2 text-[19px] font-bold text-white">
            Join Contests &amp; Win Rewards
            <Gift size={19} className="flex-shrink-0" />
          </h3>
          <p className="text-[13px] mt-1" style={{ color: "rgba(255,255,255,0.86)" }}>
            {contestCount > 0
              ? `${contestCount} contest${contestCount === 1 ? "" : "s"} open now - test your skills and climb the leaderboard.`
              : "Test your skills against your cohort and climb the leaderboard."}
          </p>
        </div>
        <div className="flex items-center gap-4 flex-shrink-0">
          <CampusButton variant="glass" rounded="xl" icon={ArrowRight}
            onClick={onExplore}
            style={{ background: "rgba(255,255,255,0.18)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)" }}>
            Explore Contests
          </CampusButton>
          <Trophy size={54} className="hidden sm:block flex-shrink-0"
            style={{ color: "rgba(255,255,255,0.9)" }} strokeWidth={1.4} aria-hidden="true" />
        </div>
      </div>
    </motion.div>
  );
}

/* --------------------------------------------------------------- weak topics */

// "Revision due" / "weak subjects", straight from lib/aptitude.js's
// detectWeakTopics - the same detector the Aptitude module itself uses, so the
// dashboard and the module never disagree about what's weak.
export function WeakTopicsCard({ topics = [], accuracyPct, onPractice, loading = false }) {
  if (loading) {
    return (
      <CampusCard className="p-5 space-y-2.5">
        <CampusSkeleton variant="rect" height={18} width="40%" />
        {[0, 1, 2].map(i => <CampusSkeleton key={i} variant="rect" height={34} />)}
      </CampusCard>
    );
  }

  if (topics.length === 0) {
    return (
      <CampusEmptyState icon={Target} color={CAMPUS.good}
        title={accuracyPct == null ? "No weak topics yet" : "Nothing flagged for revision"}
        description={accuracyPct == null
          ? "Attempt some Aptitude questions and this will highlight the topics worth revising."
          : `You're averaging ${accuracyPct}% accuracy with no topics below the revision threshold. Nice work.`}
        action={onPractice ? <CampusButton size="sm" icon={Target} onClick={onPractice}>Practice Aptitude</CampusButton> : undefined} />
    );
  }

  return (
    <CampusCard className="p-5">
      <div className="flex items-center justify-between gap-2 mb-3.5">
        <div>
          <h3 className="text-[15px] font-semibold" style={{ color: CAMPUS.ink }}>Revision Due</h3>
          <p className="text-[11.5px] mt-0.5" style={{ color: CAMPUS.inkFaint }}>
            Topics where your accuracy is lagging
          </p>
        </div>
        <CampusChip color={CAMPUS.warn} icon={AlertTriangle}>{topics.length}</CampusChip>
      </div>

      <div className="space-y-2">
        {topics.map(t => (
          <div key={`${t.category}-${t.name}`} className="flex items-center gap-3 px-3 py-2 rounded-xl"
            style={{ background: CAMPUS.paper }}>
            <div className="min-w-0 flex-1">
              <p className="text-[12.5px] font-medium truncate" style={{ color: CAMPUS.ink }}>{t.name}</p>
              <p className="text-[10.5px] truncate" style={{ color: CAMPUS.inkFaint }}>{t.category}</p>
            </div>
            <span className="text-[12px] font-bold tabular-nums flex-shrink-0"
              style={{ color: t.accuracy < 40 ? CAMPUS.bad : CAMPUS.warn }}>
              {Math.round(t.accuracy)}%
            </span>
          </div>
        ))}
      </div>

      {onPractice && (
        <CampusButton size="sm" variant="secondary" icon={Target} className="mt-3.5 w-full" onClick={onPractice}>
          Practice these topics
        </CampusButton>
      )}
    </CampusCard>
  );
}

/* ------------------------------------------------------------------ upcoming */

function countdownLabel(startAt) {
  const ms = startAt?.toMillis?.() ?? (startAt instanceof Date ? startAt.getTime() : 0);
  if (!ms) return null;
  const diff = ms - Date.now();
  if (diff <= 0) return "Live now";
  const days = Math.floor(diff / 86400000);
  if (days >= 1) return `Starts in ${days} day${days === 1 ? "" : "s"}`;
  const hours = Math.floor(diff / 3600000);
  if (hours >= 1) return `Starts in ${hours}h`;
  return `Starts in ${Math.max(1, Math.floor(diff / 60000))}m`;
}

// The mockup's "Upcoming" column, driven by real scheduled contests. It does
// NOT render a "Notify Me" button: there is no subscription collection behind
// one, and a button that silently does nothing is worse than no button - the
// row opens the contest instead, which is a real destination.
export function UpcomingCard({ contests = [], loading = false, onOpenContest, onBrowseContests }) {
  if (loading) {
    return (
      <CampusCard className="p-5 space-y-2.5">
        <CampusSkeleton variant="rect" height={18} width="34%" />
        {[0, 1].map(i => <CampusSkeleton key={i} variant="rect" height={52} />)}
      </CampusCard>
    );
  }

  if (contests.length === 0) {
    return (
      <CampusEmptyState icon={Trophy} color={CAMPUS.gold} title="Nothing scheduled yet"
        description="When your institution schedules a contest or assessment, it'll appear here with a countdown."
        action={onBrowseContests
          ? <CampusButton size="sm" variant="secondary" icon={Trophy} onClick={onBrowseContests}>Browse contests</CampusButton>
          : undefined} />
    );
  }

  return (
    <CampusCard className="p-5">
      <h3 className="text-[15px] font-semibold mb-3.5" style={{ color: CAMPUS.ink }}>Upcoming</h3>
      <div className="space-y-2">
        {contests.map(c => {
          const countdown = countdownLabel(c.startAt || c.startsAt || c.startTime);
          return (
            <button key={c.id} onClick={() => onOpenContest?.(c)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors campus-card-hover"
              style={{ background: CAMPUS.paper }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: tint(CAMPUS.gold, 16), color: CAMPUS.gold }}>
                <Trophy size={15} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium truncate" style={{ color: CAMPUS.ink }}>
                  {c.title || c.name || "Contest"}
                </p>
                {countdown && (
                  <p className="text-[11px] mt-0.5" style={{ color: CAMPUS.inkFaint }}>{countdown}</p>
                )}
              </div>
              <ChevronRight size={14} style={{ color: CAMPUS.inkFaint, flexShrink: 0 }} />
            </button>
          );
        })}
      </div>
    </CampusCard>
  );
}

/* -------------------------------------------------------------- module rings */

// The "Progress Rings" row - one ring per learning surface, each linking into
// that module. Percentages are passed in by the caller from data it already
// loaded; this component never fetches, so dropping it from a page costs
// nothing in reads.
export function ModuleProgressRings({ modules = [], className = "" }) {
  if (modules.length === 0) return null;
  return (
    <CampusCard className={`p-5 ${className}`}>
      <h3 className="text-[15px] font-semibold mb-4" style={{ color: CAMPUS.ink }}>Progress</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {modules.map(m => (
          <button key={m.label} onClick={m.onClick} disabled={!m.onClick}
            className="flex flex-col items-center gap-2 disabled:cursor-default">
            <ProgressRing pct={m.pct} size={68} stroke={6} color={m.color}
              ariaLabel={`${m.label}: ${Math.round(m.pct)} percent`}>
              <span className="text-[12px] font-bold" style={{ color: CAMPUS.ink }}>{Math.round(m.pct)}%</span>
            </ProgressRing>
            <span className="text-[11.5px] font-medium text-center leading-tight" style={{ color: CAMPUS.inkSoft }}>
              {m.label}
            </span>
            {m.hint && (
              <span className="text-[10px] text-center leading-tight" style={{ color: CAMPUS.inkFaint }}>{m.hint}</span>
            )}
          </button>
        ))}
      </div>
    </CampusCard>
  );
}

/* ---------------------------------------------------------------- hero shell */

// The staff/admin counterpart to DashboardHero below - same gradient band and
// rounding, but titled by ROLE rather than by streak/XP/coins, which a faculty
// member or principal doesn't have. Kept generic (icon + title + subtitle +
// optional right-hand slot) so the HOD, Principal, Faculty, Institution Admin
// and generic-staff dashboards all open with the same treatment instead of five
// hand-rolled headers.
export function StaffDashboardHero({ icon: Icon, title, subtitle, meta, actions, color = CAMPUS.teal }) {
  return (
    <div className="relative overflow-hidden rounded-2xl p-6"
      style={{ background: CAMPUS.gradientHero, border: `1px solid ${CAMPUS.line}` }}>
      <div className="absolute -right-10 -top-16 w-56 h-56 rounded-full pointer-events-none"
        style={{ background: color, opacity: 0.1 }} aria-hidden="true" />
      <div className="relative flex items-start justify-between gap-5 flex-wrap">
        <div className="flex items-start gap-3.5 min-w-0">
          {Icon && (
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: CAMPUS.gradientPrimary, boxShadow: "0 10px 26px rgba(99,102,241,0.28)" }}>
              <Icon size={22} color="#fff" strokeWidth={1.8} />
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-[22px] sm:text-[25px] font-bold tracking-tight" style={{ color: CAMPUS.ink }}>{title}</h1>
            {subtitle && <p className="text-[13.5px] mt-1" style={{ color: CAMPUS.inkSoft }}>{subtitle}</p>}
            {meta && <div className="flex items-center gap-2 flex-wrap mt-2.5">{meta}</div>}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2 flex-wrap flex-shrink-0">{actions}</div>}
      </div>
    </div>
  );
}

// The full hero band: greeting + stat chips on the left, illustration in the
// middle, quote on the right. Collapses to a single column below lg: with the
// illustration dropped first (it's decorative; the chips are not).
export function DashboardHero({ name, subtitle, streak, bestStreak, xp, coins, rank, badge }) {
  const firstName = (name || "there").trim().split(/\s+/)[0];
  return (
    <div className="relative overflow-hidden rounded-2xl p-6 sm:p-7"
      style={{ background: CAMPUS.gradientHero, border: `1px solid ${CAMPUS.line}` }}>
      <div className="absolute -right-10 -top-16 w-56 h-56 rounded-full pointer-events-none"
        style={{ background: CAMPUS.teal, opacity: 0.1 }} aria-hidden="true" />

      <div className="relative grid lg:grid-cols-[1.15fr_auto_0.85fr] gap-6 items-center">
        <div className="min-w-0">
          <p className="text-[13.5px]" style={{ color: CAMPUS.inkSoft }}>Welcome back,</p>
          <h1 className="text-[26px] sm:text-[30px] font-bold tracking-tight mt-0.5 flex items-center gap-2.5 flex-wrap"
            style={{ color: CAMPUS.ink }}>
            {name || firstName}
            {badge ? <CampusChip color={CAMPUS.teal}>{badge}</CampusChip> : null}
          </h1>
          <p className="text-[13.5px] mt-1.5" style={{ color: CAMPUS.inkSoft }}>
            {subtitle || "Let's continue your learning journey."}
          </p>
          <div className="mt-5 pt-5" style={{ borderTop: `1px solid ${CAMPUS.line}` }}>
            <HeroStatChips streak={streak} bestStreak={bestStreak} xp={xp} coins={coins} rank={rank} />
          </div>
        </div>

        <HeroIllustration className="hidden lg:block w-[260px] h-[190px] flex-shrink-0" />

        <DailyQuoteCard className="lg:h-full" />
      </div>
    </div>
  );
}
