"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Lock, Terminal, ArrowRight, Zap, Code, Cpu } from "lucide-react";

const CHALLENGES = [
  {
    type: "DSA",
    icon: Code,
    title: "Binary Tree Maximum Path Sum",
    difficulty: "HARD",
    diffColor: "#FF3B3B",
    diffBg: "rgba(255,59,59,0.08)",
    time: "30 min",
    tags: ["Trees", "DFS", "DP"],
    locked: false,
  },
  {
    type: "SYSTEM_DESIGN",
    icon: Cpu,
    title: "Design a Distributed Rate Limiter",
    difficulty: "MEDIUM",
    diffColor: "#FF9500",
    diffBg: "rgba(255,149,0,0.08)",
    time: "45 min",
    tags: ["Architecture", "Redis", "API"],
    locked: true,
  },
  {
    type: "BUILD",
    icon: Zap,
    title: "Ship a REST API in 2 Hours",
    difficulty: "OPEN",
    diffColor: "#00FF41",
    diffBg: "rgba(0,255,65,0.08)",
    time: "2 hrs",
    tags: ["Backend", "Ship it"],
    locked: true,
  },
];

export function GrindPreview() {
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
              // /grind — daily_reset: 00:00 UTC
            </p>
            <h2 className="font-sans font-bold text-white tracking-tighter" style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)" }}>
              TODAY&apos;S <span className="text-neon-cyan">GRIND</span>
            </h2>
          </div>
          <Link href="/grind">
            <motion.div
              whileHover={{ x: 4 }}
              className="flex items-center gap-2 font-mono text-xs text-white/35 hover:text-neon-cyan transition-colors"
            >
              start grinding <ArrowRight size={12} />
            </motion.div>
          </Link>
        </motion.div>

        {/* Challenge terminal windows */}
        <div className="grid md:grid-cols-3 gap-4">
          {CHALLENGES.map((ch, i) => {
            const Icon = ch.icon;
            return (
              <motion.div
                key={ch.type}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, type: "spring", stiffness: 200, damping: 22 }}
                whileHover={!ch.locked ? { y: -4, borderColor: "rgba(0,255,255,0.22)" } : {}}
                className="terminal-window transition-colors"
              >
                <div className="terminal-header">
                  <div className="terminal-dot bg-red-500/70" />
                  <div className="terminal-dot bg-yellow-500/70" />
                  <div className="terminal-dot bg-green-500/70" />
                  <Terminal size={10} className="ml-2 text-white/25" />
                  <span className="font-mono text-[10px] text-white/25 ml-1">{ch.type.toLowerCase()}.sh</span>
                  {ch.locked && <Lock size={10} className="ml-auto text-white/20" />}
                </div>

                <div className={`p-5 relative ${ch.locked ? "select-none" : ""}`}>
                  {ch.locked && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-b-lg backdrop-blur-[2px]"
                      style={{ background: "rgba(5,5,5,0.7)" }}
                    >
                      <Lock size={18} className="text-white/25" />
                      <p className="font-mono text-[11px] text-white/30">Login to unlock</p>
                    </div>
                  )}

                  <div className="flex items-center gap-2 mb-3">
                    <Icon size={12} style={{ color: "rgba(0,255,255,0.6)" }} />
                    <span className="font-mono text-[10px] text-white/30 tracking-wider">{ch.type}</span>
                    <span
                      className="ml-auto font-mono text-[9px] px-1.5 py-0.5 rounded"
                      style={{ color: ch.diffColor, background: ch.diffBg }}
                    >
                      {ch.difficulty}
                    </span>
                  </div>

                  <h3 className="font-sans text-sm font-semibold text-white mb-3 leading-snug">{ch.title}</h3>

                  <div className="flex flex-wrap gap-1 mb-4">
                    {ch.tags.map(t => (
                      <span key={t} className="font-mono text-[9px] text-white/28 border border-white/8 px-1.5 py-0.5 rounded">
                        {t}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-white/28">⏱ {ch.time}</span>
                    {!ch.locked && (
                      <span className="font-mono text-[10px] text-neon-green">$ ./solve.sh</span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-8 text-center"
        >
          <Link href="/grind">
            <motion.button
              whileHover={{ scale: 1.02, boxShadow: "0 0 30px rgba(0,255,65,0.2)" }}
              whileTap={{ scale: 0.98 }}
              className="font-mono text-sm text-neon-green border border-neon-green/30 px-8 py-3 transition-all hover:bg-neon-green/5"
            >
              [ UNLOCK_GRIND ]
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
