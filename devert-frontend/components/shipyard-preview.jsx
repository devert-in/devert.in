"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, ExternalLink, Flame, Anchor, Wrench } from "lucide-react";

const TAG_META = {
  Fire:       { Icon: Flame,  color: "#FF6430", bg: "rgba(255,100,0,0.15)"  },
  Shipped:    { Icon: Anchor, color: "#00FFFF", bg: "rgba(0,255,255,0.08)"  },
  "Needs Work":{ Icon: Wrench, color: "#FF5050", bg: "rgba(255,50,50,0.1)"  },
};

const PROJECTS = [
  {
    name: "NeuroLink API",
    builder: "@rk_codes",
    stack: ["Python", "FastAPI", "Redis"],
    tag: "Fire",
    desc: "Async inference pipeline with sub-20ms latency",
  },
  {
    name: "GridLock DB",
    builder: "@sam_builds",
    stack: ["Go", "PostgreSQL", "Docker"],
    tag: "Shipped",
    desc: "Zero-downtime migration engine for distributed DBs",
  },
  {
    name: "ZeroDay CLI",
    builder: "@anon_dev",
    stack: ["Rust", "WASM"],
    tag: "Fire",
    desc: "Blazing-fast terminal toolchain for web scraping",
  },
  {
    name: "PulseBoard",
    builder: "@ui_witch",
    stack: ["Next.js", "Firebase"],
    tag: "Needs Work",
    desc: "Real-time analytics dashboard with live subscriptions",
  },
];

const sectionVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 200, damping: 22 } },
};

export function ShipyardPreview() {
  return (
    <section className="px-6 py-20">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-end justify-between mb-10 flex-wrap gap-4"
        >
          <div>
            <p className="font-mono text-xs text-neon-green/55 mb-2 tracking-wider">
              // /shipyard — this_week.log
            </p>
            <h2 className="font-sans font-bold text-white tracking-tighter" style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)" }}>
              THIS WEEK IN THE <span className="text-neon-cyan">SHIPYARD</span>
            </h2>
          </div>
          <Link href="/shipyard">
            <motion.div
              whileHover={{ x: 4 }}
              className="flex items-center gap-2 font-mono text-xs text-white/35 hover:text-neon-cyan transition-colors"
            >
              view all ships <ArrowRight size={12} />
            </motion.div>
          </Link>
        </motion.div>

        {/* Cards grid */}
        <motion.div
          variants={sectionVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {PROJECTS.map((p) => (
            <motion.div
              key={p.name}
              variants={cardVariants}
              whileHover={{ y: -4, borderColor: "rgba(0,255,255,0.2)" }}
              className="terminal-window p-5 cursor-pointer group transition-colors"
            >
              <div className="terminal-header -mx-5 -mt-5 mb-4">
                <div className="terminal-dot bg-red-500/70" />
                <div className="terminal-dot bg-yellow-500/70" />
                <div className="terminal-dot bg-green-500/70" />
                <ExternalLink size={10} className="ml-auto text-white/20 group-hover:text-neon-cyan/60 transition-colors" />
              </div>

              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-sans text-sm font-semibold text-white leading-tight">{p.name}</h3>
                {(() => {
                  const m = TAG_META[p.tag];
                  return (
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded flex-shrink-0 flex items-center gap-1"
                      style={{ background: m.bg, color: m.color }}>
                      <m.Icon size={9} /> {p.tag}
                    </span>
                  );
                })()}
              </div>

              <p className="font-mono text-[11px] text-white/35 mb-4 leading-relaxed">{p.desc}</p>

              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-neon-green/60">{p.builder}</span>
                <div className="flex gap-1 flex-wrap justify-end">
                  {p.stack.map(t => (
                    <span key={t} className="font-mono text-[9px] text-white/30 border border-white/8 px-1.5 py-0.5 rounded">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
