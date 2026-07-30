"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Check, ChevronRight, Clock, Video, Youtube,
} from "lucide-react";
import { SE_ACCENT } from "@/components/se/se-lesson-blocks";

// Shared dark primitives for the Software Engineering course. These exist
// because five or more screens use each of them; anything used once stays local
// to its screen. The vocabulary deliberately mirrors the core platform's
// terminal chrome (see app/globals.css) rather than inventing a second one.

export function SeTerminal({ label, children, className = "", accent }) {
  return (
    <div className={`terminal-window ${className}`}>
      <div className="terminal-header">
        <div className="terminal-dot bg-red-500/70" />
        <div className="terminal-dot bg-yellow-500/70" />
        <div className="terminal-dot bg-green-500/70" />
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
  return (
    <As
      className={`rounded-xl transition-all ${hover ? "cursor-pointer" : ""} ${className}`}
      style={{
        background: lifted ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)",
        border: `1px solid ${lifted && accent ? `${accent}44` : "rgba(255,255,255,0.07)"}`,
      }}
      onMouseEnter={hover ? () => setLifted(true) : undefined}
      onMouseLeave={hover ? () => setLifted(false) : undefined}
      {...rest}
    >
      {children}
    </As>
  );
}

export function SeChip({ children, color = "rgba(255,255,255,0.35)", icon: Icon, className = "" }) {
  return (
    <span className={`inline-flex items-center gap-1 font-mono text-[9.5px] tracking-wider px-2 py-0.5 rounded-full flex-shrink-0 ${className}`}
      style={{ color, background: `${color}14`, border: `1px solid ${color}30` }}>
      {Icon && <Icon size={9} />}
      {children}
    </span>
  );
}

export function SeLabel({ children, color = "rgba(255,255,255,0.3)", className = "" }) {
  return (
    <p className={`font-mono text-[10px] tracking-[0.15em] ${className}`} style={{ color }}>
      {children}
    </p>
  );
}

export function SeButton({ children, variant = "primary", size = "md", icon: Icon, className = "", ...rest }) {
  const sizing = size === "sm" ? "px-3 py-1.5 text-[11.5px]" : "px-4 py-2.5 text-[13px]";
  const styles = {
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

export function SeProgressBar({ pct, color = SE_ACCENT.green, height = 4 }) {
  const clamped = Math.max(0, Math.min(100, pct || 0));
  return (
    <div className="w-full rounded-full overflow-hidden" style={{ height, background: "rgba(255,255,255,0.07)" }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${clamped}%` }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="h-full rounded-full"
        style={{ background: color }}
      />
    </div>
  );
}

export function SeStat({ label, value, sub, color, icon: Icon, hint, onClick }) {
  return (
    <SeCard hover={!!onClick} accent={color} onClick={onClick} className="p-3.5">
      <div className="flex items-center gap-1.5 mb-1.5">
        {Icon && <Icon size={11} style={{ color: color || "rgba(255,255,255,0.3)" }} />}
        <span className="font-mono text-[9px] tracking-[0.15em] text-white/30 truncate" title={hint || undefined}>
          {label.toUpperCase()}
        </span>
      </div>
      <span className="block font-mono text-xl font-bold leading-none" style={{ color: color || "rgba(255,255,255,0.9)" }}>
        {value}
      </span>
      {sub && <span className="block text-[10.5px] mt-1 text-white/30">{sub}</span>}
    </SeCard>
  );
}

export function SeProgressRing({ pct, size = 64, stroke = 5, color = SE_ACCENT.green, label }) {
  const clamped = Math.max(0, Math.min(100, pct || 0));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const reduce = useReducedMotion();
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={c}
          initial={reduce ? false : { strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - (c * clamped) / 100 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-[13px] font-bold leading-none text-white/90">{clamped}%</span>
        {label && <span className="font-mono text-[7.5px] tracking-wider mt-0.5 text-white/25">{label}</span>}
      </div>
    </div>
  );
}

export function SeEmpty({ icon: Icon, title, description, action, color = SE_ACCENT.cyan }) {
  return (
    <SeCard className="p-6">
      <div className="flex items-start gap-3.5">
        {Icon && (
          <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: `${color}14`, color }}>
            <Icon size={18} />
          </div>
        )}
        <div className="min-w-0">
          <h3 className="text-[14.5px] font-semibold text-white/90 mb-1">{title}</h3>
          {description && <p className="text-[13px] leading-relaxed text-white/45">{description}</p>}
          {action && <div className="mt-3.5">{action}</div>}
        </div>
      </div>
    </SeCard>
  );
}

// One "reading progress" bar for a lesson, driven by scroll. Measured over the
// whole article rather than the prose alone, so "80% through" means the lesson,
// not the paragraph before the quiz.
export function SeReadingBar({ pct }) {
  return (
    <div className="sticky top-0 z-20 -mx-1 px-1 py-2 backdrop-blur" style={{ background: "rgba(5,5,5,0.88)" }}>
      <div className="flex items-center gap-2.5">
        <span className="font-mono text-[9px] tracking-[0.15em] text-white/25 flex-shrink-0">PROGRESS</span>
        <div className="flex-1 h-[3px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
          <div className="h-full rounded-full"
            style={{ width: `${pct}%`, background: SE_ACCENT.green, transition: "width 0.1s linear" }} />
        </div>
        <span className="font-mono text-[10px] font-bold flex-shrink-0 tabular-nums" style={{ color: SE_ACCENT.green }}>
          {pct}%
        </span>
      </div>
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

export function SeLessonRow({ lesson, index, done, accent = SE_ACCENT.green, hasContent, onClick, showModule }) {
  return (
    <button onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.02]"
      style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
      <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
        style={{
          background: done ? `${accent}18` : "transparent",
          border: `1px solid ${done ? accent : "rgba(255,255,255,0.12)"}`,
        }}>
        {done && <Check size={10} style={{ color: accent }} />}
      </span>
      {index != null && (
        <span className="font-mono text-[10px] text-white/20 w-6 flex-shrink-0 tabular-nums">
          {String(index + 1).padStart(2, "0")}
        </span>
      )}
      <span className="flex-1 min-w-0">
        <span className="block text-[13px] text-white/80 truncate">{lesson.title}</span>
        {showModule && lesson.moduleTitle && (
          <span className="block font-mono text-[10px] text-white/25 mt-0.5">
            Module {lesson.moduleNumber} · {lesson.moduleTitle}
          </span>
        )}
      </span>
      <span className="flex items-center gap-1.5 flex-shrink-0">
        {lesson.video?.status === "published" && (
          <Youtube size={12} style={{ color: SE_ACCENT.red }} title="Has a video" />
        )}
        {lesson.estimatedMinutes > 0 && (
          <span className="font-mono text-[10px] text-white/25">{lesson.estimatedMinutes}m</span>
        )}
        {!hasContent && <SeChip color="rgba(255,255,255,0.28)">SOON</SeChip>}
        <ChevronRight size={13} className="text-white/20" />
      </span>
    </button>
  );
}
