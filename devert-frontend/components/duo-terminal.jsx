"use client";

import { motion } from "framer-motion";
import { GitCommit, Terminal, ExternalLink } from "lucide-react";
import Link from "next/link";
import { FOUNDERS } from "@/lib/founders";

// Names/handles/roles come from the shared registry the navbars also read, so
// this page and every nav surface cannot disagree about who the founders are.
// `tagline` and the commit logs below stay local - they are this component's
// own voice, not founder identity.
const BHANU = FOUNDERS.find(f => f.key === "bhanu");
const SAMUEL = FOUNDERS.find(f => f.key === "samuel");

const BHANU_LOG = [
  { hash: "b1f9a3c", msg: "feat: distributed auth service with zero-trust model",  time: "1h ago",   type: "feat"     },
  { hash: "c4e7d2a", msg: "perf: cut API latency 60% with connection pooling",      time: "6h ago",   type: "perf"     },
  { hash: "d2b8f1e", msg: "fix: race condition in concurrent job scheduler",        time: "1d ago",   type: "fix"      },
  { hash: "e9a3c6b", msg: "refactor: event-driven microservices with Kafka",        time: "2d ago",   type: "refactor" },
  { hash: "f3d1e7a", msg: "feat: real-time leaderboard with Redis sorted sets",     time: "3d ago",   type: "feat"     },
];

const SAMUEL_LOG = [
  { hash: "a7c2f4e", msg: "deploy: DeVert v1.0 - live at devert.in",               time: "just now", type: "deploy"   },
  { hash: "b5e9a1d", msg: "feat: command palette + user search across platform",    time: "3h ago",   type: "feat"     },
  { hash: "c8f3b2a", msg: "feat: Pulse feed with coin economy + admin moderation",  time: "8h ago",   type: "feat"     },
  { hash: "d1a7e5c", msg: "fix: follow system - uid from Firestore doc ID",         time: "1d ago",   type: "fix"      },
  { hash: "e4b2c9f", msg: "style: neon terminal UI - zero CSS frameworks, full custom", time: "2d ago", type: "style" },
];

const TYPE_COLORS = {
  feat:     "#00FFFF",
  fix:      "#FF5050",
  refactor: "#FF9500",
  perf:     "#FFD700",
  deploy:   "#00FF41",
  chore:    "rgba(255,255,255,0.3)",
  style:    "#C77DFF",
};

const TYPE_BG = {
  feat:     "rgba(0,255,255,0.06)",
  fix:      "rgba(255,59,59,0.06)",
  refactor: "rgba(255,149,0,0.06)",
  perf:     "rgba(255,215,0,0.06)",
  deploy:   "rgba(0,255,65,0.08)",
  chore:    "rgba(255,255,255,0.02)",
  style:    "rgba(199,125,255,0.06)",
};

// `handle` is COSMETIC - the short "@bhanu"/"@sammyyy" the terminal chrome
// prints. `profileHandle` is the real users-collection handle the link
// actually resolves to, and the two differ for Bhanu: "@bhanu" is the
// established display text here but no account has ever held that handle, so
// this component shipped a live 404 on "view @bhanu" until the two were split
// apart. Never build a URL from `handle`.
function CommitLog({ name, handle, profileHandle, role, tagline, commits, accent, align }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5 }}
      className="terminal-window flex-1 min-w-0"
      style={{ boxShadow: `0 0 40px ${accent}08` }}
    >
      <div className="terminal-header">
        <div className="terminal-dot bg-red-500/70" />
        <div className="terminal-dot bg-yellow-500/70" />
        <div className="terminal-dot bg-green-500/70" />
        <Terminal size={10} className="ml-2 text-white/20" />
        <span className="font-mono text-[10px] text-white/22 ml-1 truncate">
          {handle}.git
        </span>
      </div>

      <div className="p-5">
        {/* Identity card */}
        <div className={`flex items-start gap-4 mb-5 ${align === "right" ? "flex-row-reverse" : ""}`}>
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 font-mono font-bold text-base"
            style={{
              background: `${accent}12`,
              color:       accent,
              border:     `1px solid ${accent}30`,
              boxShadow:  `0 0 20px ${accent}14`,
            }}
          >
            {name.split(" ").map(w => w[0]).slice(0, 2).join("")}
          </div>

          <div className={`flex-1 min-w-0 ${align === "right" ? "text-right" : ""}`}>
            <p className="font-sans text-sm font-bold text-white leading-tight">{name}</p>
            <p className="font-mono text-[10px] mb-1" style={{ color: accent }}>{role}</p>
            <p className="font-mono text-[10px] text-white/28 leading-snug">{tagline}</p>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px mb-4" style={{ background: `linear-gradient(to right, ${accent}20, transparent)` }} />

        {/* Commit log */}
        <div className="space-y-0">
          {commits.map((c, i) => (
            <motion.div
              key={c.hash}
              initial={{ opacity: 0, x: align === "right" ? 12 : -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.08 + i * 0.07, duration: 0.35 }}
              className="flex items-start gap-2.5 py-2.5 border-b border-white/4 last:border-0 group cursor-default"
            >
              <GitCommit size={11} className="mt-0.5 flex-shrink-0 transition-colors"
                style={{ color: i === 0 ? accent : "rgba(255,255,255,0.18)" }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                  <span
                    className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded"
                    style={{
                      color:      TYPE_COLORS[c.type] || "rgba(255,255,255,0.3)",
                      background: TYPE_BG[c.type]     || "rgba(255,255,255,0.02)",
                    }}
                  >
                    {c.type}
                  </span>
                  <span className="font-mono text-[10px] text-white/55 leading-snug">{c.msg.split(": ")[1]}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[9px] text-white/20">{c.hash}</span>
                  <span className="font-mono text-[9px]" style={{ color: i === 0 ? `${accent}80` : "rgba(255,255,255,0.18)" }}>
                    {c.time}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Profile link */}
        <Link href={`/u/${profileHandle}`}
          className="mt-4 flex items-center gap-1.5 font-mono text-[10px] transition-colors group"
          style={{ color: "rgba(255,255,255,0.2)" }}
        >
          <span className="group-hover:underline">view @{handle}</span>
          <ExternalLink size={9} className="group-hover:opacity-70 opacity-40" />
        </Link>
      </div>
    </motion.div>
  );
}

export function DuoTerminal() {
  return (
    <section className="px-6 py-24 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/4 w-96 h-96 -translate-y-1/2 rounded-full opacity-[0.04]"
          style={{ background: "#00FFFF", filter: "blur(80px)" }} />
        <div className="absolute top-1/2 right-1/4 w-96 h-96 -translate-y-1/2 rounded-full opacity-[0.04]"
          style={{ background: "#00FF41", filter: "blur(80px)" }} />
      </div>

      <div className="max-w-6xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <p className="font-mono text-xs text-neon-green/55 mb-3 tracking-widest">// git log --authors</p>
          <h2 className="font-sans font-bold text-white tracking-tighter mb-4"
            style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)" }}>
            MEET <span className="text-neon-cyan">THE DUO</span>
          </h2>
          <p className="font-mono text-sm text-white/35 max-w-xl leading-relaxed">
            Two devs. One platform. Built from scratch, shipped to prod, and still iterating at 2 AM.
          </p>

          {/* Stats bar */}
          <div className="flex flex-wrap gap-6 mt-6">
            {[
              { label: "commits this sprint",  value: "47+",    color: "#00FFFF" },
              { label: "features shipped",      value: "22",     color: "#00FF41" },
              { label: "bugs crushed",          value: "∞",      color: "#FF9500" },
              { label: "sleep hours lost",      value: "many",   color: "#C77DFF" },
            ].map(s => (
              <div key={s.label} className="flex flex-col">
                <span className="font-mono text-lg font-bold leading-none" style={{ color: s.color }}>{s.value}</span>
                <span className="font-mono text-[9px] text-white/25 tracking-wider mt-0.5">{s.label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="flex flex-col md:flex-row gap-4">
          <CommitLog
            name={BHANU.name}
            handle={BHANU.displayHandle}
            profileHandle={BHANU.handle}
            role={BHANU.focus}
            tagline="Turns caffeine into distributed systems. If it doesn't scale, it doesn't ship."
            commits={BHANU_LOG}
            accent="#00FFFF"
            align="left"
          />
          <CommitLog
            name={SAMUEL.name}
            handle={SAMUEL.displayHandle}
            profileHandle={SAMUEL.handle}
            role={SAMUEL.focus}
            tagline="Pixel-perfect at 2 AM. Breaks prod, fixes prod, ships anyway."
            commits={SAMUEL_LOG}
            accent="#00FF41"
            align="right"
          />
        </div>
      </div>
    </section>
  );
}
