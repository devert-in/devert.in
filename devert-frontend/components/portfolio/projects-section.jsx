"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Anchor, ExternalLink, Github, X } from "lucide-react";
import { PortfolioSection, SectionHeading, EmptyState } from "./terminal-section";

const STATUS_COLOR = {
  "In Progress": "#FF9500",
  "Completed": "#00FF41",
  "Archived": "rgba(255,255,255,0.3)",
};

// Old Shipyard docs only have `reaction` (Fire/Shipped/Needs Work), not the
// newer `status` field - derive a sane display fallback rather than backfill.
function effectiveStatus(p) {
  if (p.status) return p.status;
  return p.reaction === "Needs Work" ? "In Progress" : "Completed";
}

function formatRange(start, end) {
  if (!start) return "";
  return `${start} – ${end || "ongoing"}`;
}

function ProjectCard({ p, onOpen }) {
  const status = effectiveStatus(p);
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
      onClick={() => onOpen(p)}
      className="terminal-window cursor-pointer group"
      onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; e.currentTarget.style.transform = "translateY(-3px)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.transform = "translateY(0)"; }}
      style={{ transition: "transform 0.15s, border-color 0.15s" }}>
      {p.images?.[0] && (
        <img src={p.images[0]} alt={p.name} className="w-full h-36 object-cover border-b border-white/6" />
      )}
      <div className="terminal-header">
        <div className="terminal-dot bg-red-500/70" /><div className="terminal-dot bg-yellow-500/70" /><div className="terminal-dot bg-green-500/70" />
        <span className="font-mono text-[9px] ml-auto px-1.5 py-0.5 rounded" style={{ color: STATUS_COLOR[status], background: `${STATUS_COLOR[status]}12` }}>
          {status}
        </span>
      </div>
      <div className="p-4">
        <h3 className="font-sans font-semibold text-sm text-white/85 mb-1.5">{p.name}</h3>
        <p className="font-mono text-[11px] text-white/40 leading-relaxed mb-3 line-clamp-2">{p.description}</p>
        {p.stack?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {p.stack.slice(0, 4).map(t => (
              <span key={t} className="font-mono text-[9px] text-white/35 border border-white/8 px-1.5 py-0.5 rounded">{t}</span>
            ))}
          </div>
        )}
        {p.url && (
          <a href={p.url.startsWith("http") ? p.url : `https://${p.url}`} target="_blank" rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="inline-flex items-center gap-1 font-mono text-[10px] text-neon-cyan hover:underline">
            live demo <ExternalLink size={10} />
          </a>
        )}
      </div>
    </motion.div>
  );
}

function ProjectModal({ p, onClose }) {
  const status = effectiveStatus(p);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.75)" }}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
        onClick={e => e.stopPropagation()}
        className="terminal-window max-w-2xl w-full max-h-[85vh] overflow-y-auto">
        <div className="terminal-header">
          <div className="terminal-dot bg-red-500/70" /><div className="terminal-dot bg-yellow-500/70" /><div className="terminal-dot bg-green-500/70" />
          <span className="font-mono text-[10px] text-white/25 ml-1.5">{p.name}</span>
          <button onClick={onClose} className="ml-auto text-white/30 hover:text-white/70"><X size={14} /></button>
        </div>
        <div className="p-6">
          {p.images?.[0] && <img src={p.images[0]} alt={p.name} className="w-full rounded-lg mb-4 border border-white/6" />}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="font-mono text-[9px] px-1.5 py-0.5 rounded" style={{ color: STATUS_COLOR[status], background: `${STATUS_COLOR[status]}12` }}>{status}</span>
            {formatRange(p.timelineStart, p.timelineEnd) && <span className="font-mono text-[10px] text-white/25">{formatRange(p.timelineStart, p.timelineEnd)}</span>}
          </div>
          <h2 className="font-sans font-bold text-xl text-white mb-3">{p.name}</h2>
          <p className="font-mono text-xs text-white/50 leading-relaxed mb-4">{p.description}</p>
          {p.stack?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {p.stack.map(t => <span key={t} className="font-mono text-[9px] text-white/40 border border-white/8 px-1.5 py-0.5 rounded">{t}</span>)}
            </div>
          )}
          <div className="flex gap-2.5">
            {p.url && (
              <a href={p.url.startsWith("http") ? p.url : `https://${p.url}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 font-mono text-xs py-2 px-4 border transition-all"
                style={{ color: "#00FFFF", borderColor: "rgba(0,255,255,0.3)", background: "rgba(0,255,255,0.05)" }}>
                <ExternalLink size={12} /> live demo
              </a>
            )}
            {p.repoUrl && (
              <a href={p.repoUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 font-mono text-xs py-2 px-4 border border-white/10 text-white/50 hover:text-white/80 transition-all">
                <Github size={12} /> source
              </a>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function ProjectsSection({ projects = [] }) {
  const [active, setActive] = useState(null);

  return (
    <PortfolioSection id="projects">
      <SectionHeading comment="ships.dock" title="Projects" lastWordColor="#00FFFF" />
      {projects.length === 0 ? (
        <div className="terminal-window"><EmptyState line1="no projects docked yet" line2="ships launching soon" /></div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(p => <ProjectCard key={p.id} p={p} onOpen={setActive} />)}
        </div>
      )}
      <AnimatePresence>
        {active && <ProjectModal p={active} onClose={() => setActive(null)} />}
      </AnimatePresence>
    </PortfolioSection>
  );
}
