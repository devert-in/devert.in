"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Clock, Users, Trophy } from "lucide-react";

const MISSIONS = [
  {
    codename: "OPERATION: ZERO LATENCY",
    objective: "Build a real-time data pipeline under 10ms",
    prize: "₹50,000",
    deadline: "3 days",
    team: 4,
    status: "OPEN",
    statusColor: "#00FF41",
    difficulty: "HARD",
  },
  {
    codename: "PROJECT: NEURAL DEPLOY",
    objective: "Ship an AI-powered DevOps automation tool",
    prize: "₹25,000",
    deadline: "7 days",
    team: 2,
    status: "CLASSIFIED",
    statusColor: "#FF6B35",
    difficulty: "EXTREME",
  },
  {
    codename: "MISSION: FULL STACK",
    objective: "Build a SaaS product from scratch in 48hrs",
    prize: "₹75,000",
    deadline: "12 days",
    team: 3,
    status: "OPEN",
    statusColor: "#00FF41",
    difficulty: "MEDIUM",
  },
];

export function MissionBoard() {
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
              // /missions — classified.db
            </p>
            <h2 className="font-sans font-bold text-white tracking-tighter" style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)" }}>
              MISSION <span className="text-neon-cyan">BOARD</span>
            </h2>
          </div>
          <Link href="/missions">
            <motion.div
              whileHover={{ x: 4 }}
              className="flex items-center gap-2 font-mono text-xs text-white/35 hover:text-neon-cyan transition-colors"
            >
              all missions <ArrowRight size={12} />
            </motion.div>
          </Link>
        </motion.div>

        {/* Mission cards */}
        <div className="grid md:grid-cols-3 gap-5">
          {MISSIONS.map((m, i) => (
            <motion.div
              key={m.codename}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, type: "spring", stiffness: 200, damping: 22 }}
              whileHover={{ y: -5, borderColor: "rgba(0,255,255,0.2)" }}
              className="terminal-window group cursor-pointer transition-colors"
            >
              {/* Classified stamp header */}
              <div className="terminal-header relative overflow-hidden">
                <div className="terminal-dot bg-red-500/70" />
                <div className="terminal-dot bg-yellow-500/70" />
                <div className="terminal-dot bg-green-500/70" />
                <span className="font-mono text-[9px] text-white/25 ml-2 truncate">mission_brief.pdf</span>
                <motion.span
                  whileHover={{ rotate: -8 }}
                  className="ml-auto font-mono text-[9px] px-2 py-0.5 rounded border"
                  style={{
                    color: m.statusColor,
                    borderColor: `${m.statusColor}40`,
                    background: `${m.statusColor}0D`,
                  }}
                >
                  {m.status}
                </motion.span>
              </div>

              <div className="p-5">
                {/* Codename */}
                <p className="font-mono text-[10px] text-white/30 mb-1 tracking-wider">CODENAME</p>
                <h3 className="font-sans text-sm font-bold text-white mb-3 leading-tight group-hover:text-neon-cyan transition-colors">
                  {m.codename}
                </h3>

                <p className="font-mono text-[11px] text-white/38 mb-5 leading-relaxed">{m.objective}</p>

                {/* Meta */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-mono text-[11px] text-white/35">
                      <Trophy size={11} style={{ color: "#00FFFF" }} />
                      Prize
                    </div>
                    <span className="font-mono text-xs font-bold text-neon-cyan">{m.prize}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-mono text-[11px] text-white/35">
                      <Clock size={11} />
                      Deadline
                    </div>
                    <span className="font-mono text-xs text-white/60">{m.deadline}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-mono text-[11px] text-white/35">
                      <Users size={11} />
                      Team size
                    </div>
                    <span className="font-mono text-xs text-white/60">{m.team} devs</span>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-white/5">
                  <span className="font-mono text-[9px] px-2 py-0.5 rounded" style={{
                    color: m.difficulty === "EXTREME" ? "#FF3B3B" : m.difficulty === "HARD" ? "#FF9500" : "#00FF41",
                    background: m.difficulty === "EXTREME" ? "rgba(255,59,59,0.1)" : m.difficulty === "HARD" ? "rgba(255,149,0,0.1)" : "rgba(0,255,65,0.08)",
                  }}>
                    {m.difficulty}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
