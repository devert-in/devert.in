"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Check, ChevronRight, Clock, Video, Youtube,
} from "lucide-react";
import { SE_ACCENT } from "@/components/se/se-lesson-blocks";
import { useSe } from "@/components/se/se-app";
import { CAMPUS } from "@/lib/campus-theme";

// Shared primitives for the Software Engineering course, serving BOTH the
// standalone /fundamentals route (neon-terminal dark theme, mirroring the
// core platform's terminal chrome - see app/globals.css) and DeVert Campus's
// "Fundamentals" tab (Campus's own light-capable premium-SaaS tokens, see
// lib/campus-theme.js). Every primitive reads `campusMode` off useSe() and
// branches its own colors via usePalette()/campusAccent() below rather than
// each call site passing theme-aware props - so none of the ~90 lessons'
// worth of call sites in se-app.jsx/se-lesson.jsx/se-lesson-blocks.jsx that
// already pass `accent={SE_ACCENT.green}` etc. need to change at all.

// Neon-terminal literal values (unchanged from before campusMode existed) vs
// CAMPUS token equivalents - one switch point per visual property instead of
// a ternary at every className/style in this file.
export function usePalette() {
  const { campusMode } = useSe();
  return campusMode
    ? {
      // Glass, not a flat CAMPUS.surface fill - every one of these cards
      // renders over the Dashboard's photo backdrop (campusPhotoBg), and an
      // opaque fill blocked it out entirely, same bug the sidebar/topbar had
      // before they picked up .campus-glass. var(--campus-glass-*) are the
      // exact same tokens that class reads, so this stays in lockstep with
      // whatever globals.css tunes them to - see its own comment. The
      // gradient sheen is .campus-glass's own recipe (globals.css), copied
      // here because these render via a plain inline `background:` string
      // rather than that class - there is no backdrop-filter blur riding
      // along with it (that needs the actual CSS property, not a color
      // string), but the photo behind is already blurred by
      // .campus-photo-bg, so a translucent fill alone already reads as
      // frosted rather than a flat grey window.
      cardBg: "linear-gradient(165deg, rgba(255,255,255,0.14), rgba(255,255,255,0) 45%), var(--campus-glass-bg)",
      cardBgHover: "linear-gradient(165deg, rgba(255,255,255,0.22), rgba(255,255,255,0) 45%), var(--campus-glass-bg)",
      cardBorder: "var(--campus-glass-border)", cardBorderHover: null,
      ink: CAMPUS.ink, inkSoft: CAMPUS.inkSoft, inkFaint: CAMPUS.inkFaint, inkFainter: CAMPUS.inkFaint,
      track: CAMPUS.line, rowBorder: CAMPUS.line, rowHoverBg: CAMPUS.surface2,
      chipDefault: CAMPUS.inkFaint, labelDefault: CAMPUS.inkFaint, primaryAccent: CAMPUS.teal,
    }
    : {
      cardBg: "rgba(255,255,255,0.02)", cardBgHover: "rgba(255,255,255,0.04)", cardBorder: "rgba(255,255,255,0.07)", cardBorderHover: "44",
      ink: "rgba(255,255,255,0.9)", inkSoft: "rgba(255,255,255,0.55)", inkFaint: "rgba(255,255,255,0.3)", inkFainter: "rgba(255,255,255,0.2)",
      track: "rgba(255,255,255,0.07)", rowBorder: "rgba(255,255,255,0.05)", rowHoverBg: "rgba(255,255,255,0.02)",
      chipDefault: "rgba(255,255,255,0.35)", labelDefault: "rgba(255,255,255,0.3)", primaryAccent: SE_ACCENT.green,
    };
}

const SE_TO_CAMPUS_ACCENT = {
  [SE_ACCENT.green]: CAMPUS.good,
  [SE_ACCENT.cyan]: CAMPUS.cyan,
  [SE_ACCENT.orange]: CAMPUS.warn,
  [SE_ACCENT.purple]: CAMPUS.purple,
  [SE_ACCENT.gold]: CAMPUS.gold,
  [SE_ACCENT.red]: CAMPUS.bad,
  [SE_ACCENT.blue]: CAMPUS.blue,
  [SE_ACCENT.violet]: CAMPUS.purple,
};

// Remaps one of the course's fixed SE_ACCENT hex values (module/callout
// color-coding, passed down unchanged from every existing call site) onto
// Campus's equivalent semantic token, preserving the per-module color
// variety instead of everything collapsing onto one flat accent.
export function useCampusAccent(hex) {
  const { campusMode } = useSe();
  if (!campusMode || !hex) return hex;
  return SE_TO_CAMPUS_ACCENT[hex] || CAMPUS.teal;
}

export function SeTerminal({ label, children, className = "", accent }) {
  const { campusMode } = useSe();
  const resolvedAccent = useCampusAccent(accent);
  if (campusMode) {
    return (
      <div className={`rounded-2xl overflow-hidden ${className}`} style={{ background: CAMPUS.surface, border: `1px solid ${CAMPUS.line}` }}>
        <div className="flex items-center gap-2 px-4 py-2.5" style={{ borderBottom: `1px solid ${CAMPUS.line}` }}>
          <span className="font-mono text-[10.5px] font-medium" style={{ color: resolvedAccent || CAMPUS.inkFaint }}>{label}</span>
        </div>
        {children}
      </div>
    );
  }
  return (
    <div className={`terminal-window ${className}`}>
      <div className="terminal-header">
        <span className="font-mono text-[10px] ml-2" style={{ color: accent || "rgba(255,255,255,0.25)" }}>
          {label}
        </span>
      </div>
      {children}
    </div>
  );
}

export function SeCard({ children, className = "", accent, hover = false, as: As = "div", ...rest }) {
  const [lifted, setLifted] = useState(false);
  const { campusMode } = useSe();
  const p = usePalette();
  const resolvedAccent = useCampusAccent(accent);
  return (
    <As
      className={`rounded-xl transition-all ${hover ? "cursor-pointer" : ""} ${className}`}
      style={{
        background: lifted ? p.cardBgHover : p.cardBg,
        border: `1px solid ${lifted && resolvedAccent && p.cardBorderHover ? `${resolvedAccent}${p.cardBorderHover}` : lifted && resolvedAccent ? resolvedAccent : p.cardBorder}`,
        // Real frosting (not just usePalette()'s translucent fill) for the
        // one card primitive most of the lesson UI actually renders through -
        // same blur/saturate recipe as .campus-glass (globals.css), applied
        // here rather than via that class since this element's background is
        // a per-instance computed string, not a fixed CSS rule.
        ...(campusMode ? { backdropFilter: "blur(28px) saturate(165%)", WebkitBackdropFilter: "blur(28px) saturate(165%)" } : null),
      }}
      onMouseEnter={hover ? () => setLifted(true) : undefined}
      onMouseLeave={hover ? () => setLifted(false) : undefined}
      {...rest}
    >
      {children}
    </As>
  );
}

export function SeChip({ children, color, icon: Icon, className = "" }) {
  const p = usePalette();
  const resolvedColor = useCampusAccent(color) || p.chipDefault;
  return (
    <span className={`inline-flex items-center gap-1 font-mono text-[9.5px] tracking-wider px-2 py-0.5 rounded-full flex-shrink-0 ${className}`}
      style={{ color: resolvedColor, background: `${resolvedColor}14`, border: `1px solid ${resolvedColor}30` }}>
      {Icon && <Icon size={9} />}
      {children}
    </span>
  );
}

export function SeLabel({ children, color, className = "" }) {
  const p = usePalette();
  return (
    <p className={`font-mono text-[10px] tracking-[0.15em] ${className}`} style={{ color: useCampusAccent(color) || p.labelDefault }}>
      {children}
    </p>
  );
}

export function SeButton({ children, variant = "primary", size = "md", icon: Icon, className = "", ...rest }) {
  const { campusMode } = useSe();
  const sizing = size === "sm" ? "px-3 py-1.5 text-[11.5px]" : "px-4 py-2.5 text-[13px]";
  const styles = campusMode
    ? {
      primary: { background: CAMPUS.gradientPrimary, color: "#fff", border: "1px solid transparent" },
      secondary: { background: CAMPUS.surface, color: CAMPUS.inkSoft, border: `1px solid ${CAMPUS.line}` },
      ghost: { background: "transparent", color: CAMPUS.teal, border: "1px solid transparent" },
    }
    : {
      primary: { background: SE_ACCENT.green, color: "#050505", border: "1px solid transparent" },
      secondary: { background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.75)", border: "1px solid rgba(255,255,255,0.1)" },
      ghost: { background: "transparent", color: SE_ACCENT.cyan, border: "1px solid transparent" },
    };
  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 font-mono font-semibold rounded-lg transition-opacity disabled:opacity-40 ${sizing} ${className}`}
      style={styles[variant] || styles.primary}
      {...rest}
    >
      {Icon && <Icon size={size === "sm" ? 12 : 14} />}
      {children}
    </button>
  );
}

export function SeProgressBar({ pct, color, height = 4 }) {
  const p = usePalette();
  const resolvedColor = useCampusAccent(color) || p.primaryAccent;
  const clamped = Math.max(0, Math.min(100, pct || 0));
  return (
    <div className="w-full rounded-full overflow-hidden" style={{ height, background: p.track }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${clamped}%` }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="h-full rounded-full"
        style={{ background: resolvedColor }}
      />
    </div>
  );
}

export function SeStat({ label, value, sub, color, icon: Icon, hint, onClick }) {
  const p = usePalette();
  const resolvedColor = useCampusAccent(color);
  return (
    <SeCard hover={!!onClick} accent={color} onClick={onClick} className="p-3.5">
      <div className="flex items-center gap-1.5 mb-1.5">
        {Icon && <Icon size={11} style={{ color: resolvedColor || p.inkFaint }} />}
        <span className="font-mono text-[9px] tracking-[0.15em] truncate" style={{ color: p.inkFaint }} title={hint || undefined}>
          {label.toUpperCase()}
        </span>
      </div>
      <span className="block font-mono text-xl font-bold leading-none" style={{ color: resolvedColor || p.ink }}>
        {value}
      </span>
      {sub && <span className="block text-[10.5px] mt-1" style={{ color: p.inkFaint }}>{sub}</span>}
    </SeCard>
  );
}

export function SeProgressRing({ pct, size = 64, stroke = 5, color, label }) {
  const p = usePalette();
  const resolvedColor = useCampusAccent(color) || p.primaryAccent;
  const clamped = Math.max(0, Math.min(100, pct || 0));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const reduce = useReducedMotion();
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={p.track} strokeWidth={stroke} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={resolvedColor} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={c}
          initial={reduce ? false : { strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - (c * clamped) / 100 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-[13px] font-bold leading-none" style={{ color: p.ink }}>{clamped}%</span>
        {label && <span className="font-mono text-[7.5px] tracking-wider mt-0.5" style={{ color: p.inkFainter }}>{label}</span>}
      </div>
    </div>
  );
}

export function SeEmpty({ icon: Icon, title, description, action, color }) {
  const p = usePalette();
  const { campusMode } = useSe();
  const resolvedColor = useCampusAccent(color) || (campusMode ? CAMPUS.teal : SE_ACCENT.cyan);
  return (
    <SeCard className="p-6">
      <div className="flex items-start gap-3.5">
        {Icon && (
          <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: `${resolvedColor}14`, color: resolvedColor }}>
            <Icon size={18} />
          </div>
        )}
        <div className="min-w-0">
          <h3 className="text-[14.5px] font-semibold mb-1" style={{ color: p.ink }}>{title}</h3>
          {description && <p className="text-[13px] leading-relaxed" style={{ color: p.inkSoft }}>{description}</p>}
          {action && <div className="mt-3.5">{action}</div>}
        </div>
      </div>
    </SeCard>
  );
}

// One "reading progress" ring for a lesson, driven by scroll. Measured over
// the whole article rather than the prose alone, so "80% through" means the
// lesson, not the paragraph before the quiz. Static, not sticky - it sits
// once at the top of the article and scrolls away with the rest of the
// lesson like any other element, rather than staying pinned on screen the
// whole read and visibly overlapping whatever text scrolls past underneath.
export function SeReadingBar({ pct }) {
  const p = usePalette();
  const size = 34, stroke = 3, r = (size - stroke) / 2, c = 2 * Math.PI * r;
  return (
    <div className="flex items-center gap-2 -mx-1 px-1 py-2">
      <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={p.track} strokeWidth={stroke} />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={p.primaryAccent} strokeWidth={stroke}
            strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)}
            style={{ transition: "stroke-dashoffset 0.1s linear" }} />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center font-mono text-[8px] font-bold tabular-nums"
          style={{ color: p.primaryAccent }}>{pct}</span>
      </div>
      <span className="font-mono text-[9px] tracking-[0.15em]" style={{ color: p.inkFainter }}>PROGRESS</span>
    </div>
  );
}

// ---------------- the video slot ----------------

// The architecture is complete; playback is gated on `status`. See
// lib/softwareEngineering.js's videoState for why: the YouTube series does not
// exist yet, and a lesson rendering a dead embed or an empty 16:9 hole is worse
// than one that says plainly that the video is coming. Everything a real video
// needs - provider, id, duration, chapters, transcript, notes - is already
// modelled, so switching a lesson on later is a data edit.
//
// The placeholder is deliberately a designed card rather than a grey box: this
// slot appears on every one of ~90 lessons, so a lazy placeholder would be the
// most-seen element in the course.
export function SeVideoSlot({ state, lessonTitle }) {
  if (!state?.show) return null;

  if (state.playable) {
    const v = state.video;
    const src = v.provider === "youtube" && v.youtubeId
      ? `https://www.youtube-nocookie.com/embed/${v.youtubeId}`
      : v.url;
    return (
      <SeTerminal label="video_lesson.mp4" accent={SE_ACCENT.red}>
        <div className="relative w-full" style={{ aspectRatio: "16 / 9", background: "#000" }}>
          {/* youtube-nocookie: this is a learning surface, and the standard
              youtube.com embed sets tracking cookies before a learner has
              pressed play. */}
          <iframe
            src={src}
            title={`${lessonTitle} - video lesson`}
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
            className="absolute inset-0 w-full h-full"
            style={{ border: 0 }}
          />
        </div>
        {v.chapters?.length > 0 && (
          <div className="p-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <SeLabel className="mb-2">CHAPTERS</SeLabel>
            <div className="space-y-1">
              {v.chapters.map((ch, i) => (
                <div key={i} className="flex items-center gap-2 font-mono text-[11.5px] text-white/55">
                  <span style={{ color: SE_ACCENT.cyan }}>{formatTimestamp(ch.atSeconds)}</span>
                  <span>{ch.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </SeTerminal>
    );
  }

  return (
    <SeTerminal label="video_lesson.mp4" accent="rgba(255,255,255,0.2)">
      <div className="relative flex flex-col items-center justify-center text-center px-6 py-10"
        style={{ aspectRatio: "16 / 9", background: "rgba(0,0,0,0.35)" }}>
        <div className="absolute inset-0 grid-bg opacity-[0.12] pointer-events-none" />
        <div className="relative">
          <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <Video size={22} className="text-white/25" />
          </div>
          <div className="flex items-center justify-center gap-1.5 mb-2">
            <SeChip color={SE_ACCENT.orange} icon={Clock}>COMING SOON</SeChip>
          </div>
          <p className="text-[13.5px] font-semibold text-white/70 mb-1.5">
            A video walkthrough for this lesson is on the way
          </p>
          <p className="text-[12px] leading-relaxed text-white/35 max-w-sm mx-auto">
            The written lesson below is complete and self-contained - nothing here is waiting on the video. When the
            DeVert series records this topic, it will appear in this slot with chapters and a transcript.
          </p>
        </div>
      </div>
    </SeTerminal>
  );
}

function formatTimestamp(sec) {
  const s = Math.max(0, Math.round(sec || 0));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

// ---------------- lesson row (module lists, search results, roadmap) ----------------

export function SeLessonRow({ lesson, index, done, accent, hasContent, onClick, showModule }) {
  const p = usePalette();
  const resolvedAccent = useCampusAccent(accent) || p.primaryAccent;
  const redAccent = useCampusAccent(SE_ACCENT.red);
  return (
    <button onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
      style={{ borderTop: `1px solid ${p.rowBorder}` }}
      onMouseEnter={e => { e.currentTarget.style.background = p.rowHoverBg; }}
      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
      <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
        style={{
          background: done ? `${resolvedAccent}18` : "transparent",
          border: `1px solid ${done ? resolvedAccent : p.cardBorder}`,
        }}>
        {done && <Check size={10} style={{ color: resolvedAccent }} />}
      </span>
      {index != null && (
        <span className="font-mono text-[10px] w-6 flex-shrink-0 tabular-nums" style={{ color: p.inkFainter }}>
          {String(index + 1).padStart(2, "0")}
        </span>
      )}
      <span className="flex-1 min-w-0">
        <span className="block text-[13px] leading-snug" style={{ color: p.inkSoft }}>{lesson.title}</span>
        {showModule && lesson.moduleTitle && (
          <span className="block font-mono text-[10px] mt-0.5" style={{ color: p.inkFaint }}>
            Module {lesson.moduleNumber} · {lesson.moduleTitle}
          </span>
        )}
      </span>
      <span className="flex items-center gap-1.5 flex-shrink-0">
        {lesson.video?.status === "published" && (
          <Youtube size={12} style={{ color: redAccent }} title="Has a video" />
        )}
        {lesson.estimatedMinutes > 0 && (
          <span className="font-mono text-[10px]" style={{ color: p.inkFaint }}>{lesson.estimatedMinutes}m</span>
        )}
        {!hasContent && <SeChip>SOON</SeChip>}
        <ChevronRight size={13} style={{ color: p.inkFainter }} />
      </span>
    </button>
  );
}
