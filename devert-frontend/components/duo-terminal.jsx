"use client";

import { motion } from "framer-motion";
import { GitCommit, Terminal } from "lucide-react";

const ARCHITECT_LOG = [
  { hash: "a3f9b2c", msg: "feat: implement JWT auth middleware",       time: "2h ago",  type: "feat" },
  { hash: "b8e1d4f", msg: "fix: resolve N+1 query in user service",   time: "5h ago",  type: "fix" },
  { hash: "c2a7e9b", msg: "refactor: extract payment processor",       time: "1d ago",  type: "refactor" },
  { hash: "d5f3a1c", msg: "perf: add Redis caching layer",            time: "2d ago",  type: "perf" },
  { hash: "e1b9c3d", msg: "feat: rate limiting on all endpoints",     time: "3d ago",  type: "feat" },
];

const BUILDER_LOG = [
  { hash: "f9b2d6e", msg: "deploy: ship v2.3.1 to prod",             time: "1h ago",  type: "deploy" },
  { hash: "g4c8a3f", msg: "feat: responsive HUD dashboard layout",    time: "4h ago",  type: "feat" },
  { hash: "h7d1b5c", msg: "fix: hydration mismatch in hero section", time: "8h ago",  type: "fix" },
  { hash: "i2e9f4a", msg: "chore: update firebase config",           time: "1d ago",  type: "chore" },
  { hash: "j6a3c7b", msg: "style: terminal chrome across all cards", time: "2d ago",  type: "style" },
];

const TYPE_COLORS = {
  feat:     "#00FFFF",
  fix:      "#FF5050",
  refactor: "#FF9500",
  perf:     "#00FF41",
  deploy:   "#00FF41",
  chore:    "rgba(255,255,255,0.3)",
  style:    "#C77DFF",
};

function CommitLog({ title, role, commits, align }) {
  return (
    <div className="terminal-window flex-1 min-w-0">
      <div className="terminal-header">
        <div className="terminal-dot bg-red-500/70" />
        <div className="terminal-dot bg-yellow-500/70" />
        <div className="terminal-dot bg-green-500/70" />
        <Terminal size={10} className="ml-2 text-white/25" />
        <span className="font-mono text-[11px] text-white/25 ml-1 truncate">
          {role.toLowerCase().replace(" ", "_")}.log
        </span>
      </div>

      <div className="p-4">
        {/* Identity */}
        <div className={`flex items-start gap-3 mb-5 ${align === "right" ? "flex-row-reverse" : ""}`}>
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-mono font-bold text-sm"
            style={{
              background: align === "right" ? "rgba(0,255,65,0.1)" : "rgba(0,255,255,0.1)",
              color: align === "right" ? "#00FF41" : "#00FFFF",
              border: `1px solid ${align === "right" ? "rgba(0,255,65,0.2)" : "rgba(0,255,255,0.2)"}`,
            }}
          >
            {title[0]}
          </div>
          <div className={align === "right" ? "text-right" : ""}>
            <p className="font-sans text-sm font-bold text-white">{title}</p>
            <p className="font-mono text-[10px] text-white/35">{role}</p>
          </div>
        </div>

        {/* Commit list */}
        <div className="space-y-0">
          {commits.map((c, i) => (
            <motion.div
              key={c.hash}
              initial={{ opacity: 0, x: align === "right" ? 10 : -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
              className="flex items-start gap-2.5 py-2 border-b border-white/4 last:border-0 group"
            >
              <GitCommit size={11} className="mt-0.5 flex-shrink-0 text-white/20 group-hover:text-white/40 transition-colors" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                  <span
                    className="font-mono text-[9px] font-bold"
                    style={{ color: TYPE_COLORS[c.type] || "rgba(255,255,255,0.3)" }}
                  >
                    {c.type}:
                  </span>
                  <span className="font-mono text-[10px] text-white/55 truncate">{c.msg.split(": ")[1]}</span>
                </div>
                <span className="font-mono text-[9px] text-white/20">{c.hash} · {c.time}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function DuoTerminal() {
  return (
    <section className="px-6 py-20">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-10"
        >
          <p className="font-mono text-xs text-neon-green/55 mb-2 tracking-wider">
            // /about — git log --all
          </p>
          <h2 className="font-sans font-bold text-white tracking-tighter" style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)" }}>
            MEET <span className="text-neon-cyan">THE DUO</span>
          </h2>
          <p className="font-mono text-sm text-white/35 mt-3 max-w-lg">
            Two builders. One mission. Ship everything, document nothing, regret nothing.
          </p>
        </motion.div>

        {/* Split screen commit logs */}
        <div className="flex flex-col md:flex-row gap-4">
          <CommitLog
            title="The Architect"
            role="Backend · Logic · Systems"
            commits={ARCHITECT_LOG}
            align="left"
          />
          <CommitLog
            title="The Builder"
            role="Frontend · Deploy · Ship"
            commits={BUILDER_LOG}
            align="right"
          />
        </div>
      </div>
    </section>
  );
}
