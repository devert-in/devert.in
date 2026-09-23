"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ChevronDown, ExternalLink, Map as MapIcon } from "lucide-react";

// ── Picker grid - one card per roadmap ──────────────────────────────────────────

export function RoadmapGrid({ roadmaps, onPick }) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {roadmaps.map((r, i) => {
        const Icon = r.icon;
        return (
          <motion.button
            key={r.id}
            onClick={() => onPick(r.id)}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ y: -2 }}
            className="terminal-window text-left p-5 transition-colors hover:bg-white/2"
            style={{ borderColor: `${r.color}20` }}
          >
            <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-4"
              style={{ background: `${r.color}12`, border: `1px solid ${r.color}30` }}>
              <Icon size={16} style={{ color: r.color }} />
            </div>
            <p className="font-sans text-sm font-semibold text-white mb-1.5">{r.title}</p>
            <p className="font-mono text-[11px] text-white/35 leading-relaxed mb-4">{r.tagline}</p>
            <span className="font-mono text-[10px]" style={{ color: r.color }}>
              {r.steps.length} steps →
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}

// ── Detail view - a connected vertical path of steps ────────────────────────────

function StepNode({ step, index, total, color, open, onToggle }) {
  return (
    <div className="relative flex gap-4 px-5">
      {/* Connecting line + dot */}
      <div className="flex flex-col items-center flex-shrink-0">
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center font-mono text-[10px] font-bold flex-shrink-0 z-10"
          style={{ background: `${color}15`, border: `1.5px solid ${color}`, color }}
        >
          {index + 1}
        </div>
        {index < total - 1 && (
          <div className="w-px flex-1 my-1" style={{ background: `${color}25`, minHeight: 24 }} />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pb-6">
        <button
          onClick={onToggle}
          className="w-full flex items-start justify-between gap-3 text-left group"
        >
          <span className="font-sans text-sm font-medium text-white/85 group-hover:text-white transition-colors pt-0.5">
            {step.title}
          </span>
          <ChevronDown
            size={14}
            className="text-white/25 flex-shrink-0 mt-1 transition-transform"
            style={{ transform: open ? "rotate(180deg)" : "none" }}
          />
        </button>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <p className="font-mono text-xs text-white/40 leading-relaxed mt-2 mb-3">
                {step.description}
              </p>
              {step.resources?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {step.resources.map((res) => (
                    <a
                      key={res.url}
                      href={res.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 font-mono text-[10px] px-2.5 py-1.5 rounded-lg border transition-colors"
                      style={{ borderColor: `${color}25`, color: `${color}` }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = `${color}0C`; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                    >
                      {res.label} <ExternalLink size={9} />
                    </a>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export function RoadmapPath({ roadmap, onBack }) {
  const [openIndex, setOpenIndex] = useState(0);
  const Icon = roadmap.icon;

  return (
    <div>
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 font-mono text-xs text-white/30 hover:text-white/60 transition-colors mb-5"
      >
        <ArrowLeft size={12} /> back to roadmaps
      </button>

      <div className="terminal-window">
        <div className="terminal-header">
          <MapIcon size={10} className="ml-2 text-white/25" />
          <span className="font-mono text-[10px] text-white/25 ml-1">
            {roadmap.id.replace(/-/g, "_")}.roadmap
          </span>
        </div>

        <div className="p-5 pb-2 flex items-start gap-4 border-b border-white/6">
          <div className="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: `${roadmap.color}12`, border: `1px solid ${roadmap.color}30` }}>
            <Icon size={18} style={{ color: roadmap.color }} />
          </div>
          <div>
            <h3 className="font-sans text-lg font-bold text-white mb-1">{roadmap.title}</h3>
            <p className="font-mono text-xs text-white/35">{roadmap.tagline}</p>
          </div>
        </div>

        <div className="pt-6">
          {roadmap.steps.map((step, i) => (
            <StepNode
              key={i}
              step={step}
              index={i}
              total={roadmap.steps.length}
              color={roadmap.color}
              open={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? -1 : i)}
            />
          ))}
        </div>
      </div>

      <p className="font-mono text-[10px] text-white/18 text-center mt-6">
        Curated by DeVert, written from scratch.
        {roadmap.id === "ruby-rails" && " Course ordering cross-checked against The Odin Project's open (MIT-licensed) curriculum for accuracy."}
      </p>
    </div>
  );
}
