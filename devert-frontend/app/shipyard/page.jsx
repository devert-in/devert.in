"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { Anchor, Terminal, ExternalLink, Plus, Filter, Flame, Wrench } from "lucide-react";

const TAG_META = {
  Fire:         { Icon: Flame,  color: "#FF6430", bg: "rgba(255,100,48,0.1)"  },
  Shipped:      { Icon: Anchor, color: "#00FFFF", bg: "rgba(0,255,255,0.08)"  },
  "Needs Work": { Icon: Wrench, color: "#FF5050", bg: "rgba(255,80,80,0.08)"  },
};

const ALL_PROJECTS = [
  { name: "NeuroLink API",    builder: "@rk_codes",   stack: ["Python","FastAPI","Redis"],       reaction: "Fire",        desc: "Async inference pipeline with sub-20ms latency",          week: "this week"  },
  { name: "GridLock DB",      builder: "@sam_builds",  stack: ["Go","PostgreSQL","Docker"],       reaction: "Shipped",     desc: "Zero-downtime migration engine for distributed databases", week: "this week"  },
  { name: "ZeroDay CLI",      builder: "@anon_dev",    stack: ["Rust","WASM"],                    reaction: "Fire",        desc: "Blazing-fast terminal toolchain for web scraping",         week: "this week"  },
  { name: "PulseBoard",       builder: "@ui_witch",    stack: ["Next.js","Firebase"],             reaction: "Needs Work",  desc: "Real-time analytics dashboard with live subscriptions",    week: "this week"  },
  { name: "VaultKey Auth",    builder: "@d3v_null",    stack: ["Node.js","JWT","Redis"],          reaction: "Shipped",     desc: "Zero-trust auth service with hardware key support",        week: "last week"  },
  { name: "ByteScale CDN",    builder: "@code_zero",   stack: ["Go","Nginx","Cloudflare"],        reaction: "Fire",        desc: "Edge caching layer with smart content routing",            week: "last week"  },
  { name: "SyncLock ORM",     builder: "@rk_codes",    stack: ["TypeScript","Prisma"],            reaction: "Needs Work",  desc: "Type-safe ORM with automatic migration generation",        week: "last week"  },
  { name: "Quantum Queue",    builder: "@sam_builds",  stack: ["Kafka","Java","Spring"],          reaction: "Shipped",     desc: "High-throughput message queue with dead letter support",   week: "all time"   },
];

const FILTERS = ["all", "this week", "last week", "fire", "shipped", "needs work"];

export default function ShipyardPage() {
  const [filter, setFilter] = useState("all");

  const filtered = ALL_PROJECTS.filter(p => {
    if (filter === "all") return true;
    if (filter === "this week" || filter === "last week") return p.week === filter;
    if (filter === "fire")        return p.reaction === "Fire";
    if (filter === "shipped")     return p.reaction === "Shipped";
    if (filter === "needs work")  return p.reaction === "Needs Work";
    return true;
  });

  return (
    <main className="min-h-screen pt-10 pb-32 px-6 relative">
      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />

      <div className="relative max-w-6xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between flex-wrap gap-4 mb-10">
          <div>
            <p className="font-mono text-xs text-neon-green/55 mb-3 tracking-wider">// /shipyard — projects.feed</p>
            <h1 className="font-sans font-bold tracking-tighter text-white leading-none mb-3" style={{ fontSize: "clamp(2.5rem,7vw,5rem)" }}>
              THE <span className="text-neon-cyan">SHIPYARD</span>
            </h1>
            <p className="font-mono text-sm text-white/35">Builders ship here. Community judges.</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(0,255,255,0.15)" }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 font-mono text-sm text-neon-cyan border border-neon-cyan/30 px-5 py-2.5 mt-2 transition-all hover:bg-neon-cyan/5"
          >
            <Plus size={14} /> [ DOCK_YOUR_SHIP ]
          </motion.button>
        </motion.div>

        {/* Filters */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
          className="flex items-center gap-2 flex-wrap mb-8"
        >
          <Filter size={12} className="text-white/25" />
          {FILTERS.map(f => {
            const keyMap = { fire: "Fire", shipped: "Shipped", "needs work": "Needs Work" };
            const m = TAG_META[keyMap[f]];
            return (
              <button key={f} onClick={() => setFilter(f)}
                className="font-mono text-[11px] px-3 py-1.5 rounded transition-all flex items-center gap-1.5"
                style={{
                  color: filter === f ? (m ? m.color : "#00FFFF") : "rgba(255,255,255,0.3)",
                  background: filter === f ? (m ? m.bg : "rgba(0,255,255,0.08)") : "rgba(255,255,255,0.03)",
                  border: filter === f ? `1px solid ${m ? m.color + "40" : "rgba(0,255,255,0.25)"}` : "1px solid rgba(255,255,255,0.06)",
                }}
              >
                {m && <m.Icon size={9} />}
                {f}
              </button>
            );
          })}
        </motion.div>

        {/* Projects grid */}
        <motion.div
          layout
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {filtered.map((p, i) => (
            <motion.div
              key={p.name}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -4, borderColor: "rgba(0,255,255,0.2)" }}
              className="terminal-window group cursor-pointer transition-colors"
            >
              <div className="terminal-header">
                <div className="terminal-dot bg-red-500/70" />
                <div className="terminal-dot bg-yellow-500/70" />
                <div className="terminal-dot bg-green-500/70" />
                <ExternalLink size={10} className="ml-auto text-white/18 group-hover:text-neon-cyan/55 transition-colors" />
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-sans text-sm font-semibold text-white leading-snug">{p.name}</h3>
                  {(() => {
                    const m = TAG_META[p.reaction];
                    return (
                      <span className="font-mono text-[9px] px-1.5 py-0.5 rounded flex-shrink-0 flex items-center gap-1"
                        style={{ color: m.color, background: m.bg }}>
                        <m.Icon size={8} /> {p.reaction}
                      </span>
                    );
                  })()}
                </div>
                <p className="font-mono text-[10px] text-white/32 mb-4 leading-relaxed">{p.desc}</p>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-neon-green/60">{p.builder}</span>
                  <div className="flex gap-1 flex-wrap justify-end">
                    {p.stack.slice(0, 2).map(t => (
                      <span key={t} className="font-mono text-[9px] text-white/25 border border-white/8 px-1 py-0.5 rounded">{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </main>
  );
}
