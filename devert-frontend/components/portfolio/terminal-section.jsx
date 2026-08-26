"use client";

import { motion } from "framer-motion";

// Shared chrome for every portfolio section below the hero - extracted from
// the duplicated markup that used to live inline in app/u/page.jsx and
// app/profile/page.jsx. Every new portfolio section wraps its content in
// <PortfolioSection> for the grid-bg + spacing rhythm, and <SectionHeading>
// for the "// comment.sh" mono label + big title with a colored last word
// (matches nandhakishor-portfolio's SectionTitle convention, itself already
// close to devert.in's own house style).

export function PortfolioSection({ id, children, className = "" }) {
  return (
    <section id={id} className={`relative py-14 ${className}`}>
      <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none" />
      <div className="relative max-w-5xl mx-auto px-6">{children}</div>
    </section>
  );
}

export function SectionHeading({ comment, title, lastWordColor = "#00FFFF", subtitle }) {
  const words = title.split(" ");
  const last = words.pop();
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="mb-8"
    >
      {comment && <p className="font-mono text-xs text-neon-green/55 mb-2 tracking-wider">// {comment}</p>}
      <h2 className="font-sans font-black tracking-tight text-white leading-[0.95]" style={{ fontSize: "clamp(2.4rem,6.5vw,4.2rem)" }}>
        {words.length > 0 && <>{words.join(" ")} </>}
        <span style={{ color: lastWordColor }}>{last}</span>
      </h2>
      {subtitle && <p className="font-mono text-sm text-white/30 mt-2">{subtitle}</p>}
    </motion.div>
  );
}

// The 3-dot terminal-window card, used for every content block within a section.
export function TerminalCard({ filename, icon: Icon, badge, children, className = "" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`terminal-window ${className}`}
    >
      <div className="terminal-header">
        <div className="terminal-dot bg-red-500/70" />
        <div className="terminal-dot bg-yellow-500/70" />
        <div className="terminal-dot bg-green-500/70" />
        {Icon && <Icon size={10} className="ml-2 text-white/25" />}
        <span className="font-mono text-[10px] text-white/25 ml-1.5">{filename}</span>
        {badge && <span className="ml-auto">{badge}</span>}
      </div>
      <div className="p-5">{children}</div>
    </motion.div>
  );
}

export function EmptyState({ line1, line2 }) {
  return (
    <div className="py-8 text-center">
      <p className="font-mono text-xs text-white/22">{line1}</p>
      {line2 && <p className="font-mono text-[9px] text-white/12 mt-1">// {line2}</p>}
    </div>
  );
}
