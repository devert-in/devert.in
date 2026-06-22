"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { Clock, Users, Trophy, Target, Lock, ChevronDown } from "lucide-react";

const MISSIONS = [
  {
    codename: "OPERATION: ZERO LATENCY",
    classification: "TOP SECRET",
    objective: "Build a real-time data pipeline processing 1M events/sec under 10ms latency.",
    prize: "₹50,000",
    deadline: "3 days",
    team: 4,
    status: "OPEN",
    statusColor: "#00FF41",
    difficulty: "HARD",
    diffColor: "#FF3B3B",
    tags: ["Backend","Distributed Systems","Go"],
    slots: 12,
    filled: 8,
  },
  {
    codename: "PROJECT: NEURAL DEPLOY",
    classification: "CLASSIFIED",
    objective: "Ship an AI-powered DevOps automation tool that reduces deployment errors by 80%.",
    prize: "₹25,000",
    deadline: "7 days",
    team: 2,
    status: "CLASSIFIED",
    statusColor: "#FF6B35",
    difficulty: "EXTREME",
    diffColor: "#FF3B3B",
    tags: ["AI/ML","DevOps","Python"],
    slots: 6,
    filled: 6,
  },
  {
    codename: "MISSION: FULL STACK",
    classification: "UNCLASSIFIED",
    objective: "Build a complete SaaS product from scratch with a paying customer in 48 hours.",
    prize: "₹75,000",
    deadline: "12 days",
    team: 3,
    status: "OPEN",
    statusColor: "#00FF41",
    difficulty: "MEDIUM",
    diffColor: "#FF9500",
    tags: ["Full Stack","SaaS","Ship"],
    slots: 20,
    filled: 5,
  },
  {
    codename: "DELTA: API DOMINATION",
    classification: "TOP SECRET",
    objective: "Design and ship a public API used by 100 devs within 5 days of launch.",
    prize: "₹30,000",
    deadline: "18 days",
    team: 2,
    status: "OPEN",
    statusColor: "#00FF41",
    difficulty: "MEDIUM",
    diffColor: "#FF9500",
    tags: ["API Design","Marketing","Node.js"],
    slots: 10,
    filled: 3,
  },
  {
    codename: "OMEGA: SECURITY AUDIT",
    classification: "CLASSIFIED",
    objective: "Find and patch 10 critical vulnerabilities in an open-source financial system.",
    prize: "₹1,00,000",
    deadline: "Coming Soon",
    team: 4,
    status: "LOCKED",
    statusColor: "#555",
    difficulty: "EXTREME",
    diffColor: "#FF3B3B",
    tags: ["Security","Pentesting","Rust"],
    slots: 4,
    filled: 0,
  },
  {
    codename: "SIGMA: OPEN SOURCE",
    classification: "UNCLASSIFIED",
    objective: "Ship a meaningful open-source contribution to a top-100 GitHub repo.",
    prize: "₹15,000",
    deadline: "30 days",
    team: 1,
    status: "OPEN",
    statusColor: "#00FF41",
    difficulty: "EASY",
    diffColor: "#00FF41",
    tags: ["Open Source","Any Stack"],
    slots: 50,
    filled: 12,
  },
];

function MissionCard({ m, i }) {
  const [expanded, setExpanded] = useState(false);
  const isLocked = m.status === "LOCKED";

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.07, type: "spring", stiffness: 200, damping: 22 }}
      whileHover={!isLocked ? { y: -4, borderColor: "rgba(0,255,255,0.2)" } : {}}
      className="terminal-window transition-colors"
    >
      <div className="terminal-header">
        <div className="terminal-dot bg-red-500/70" />
        <div className="terminal-dot bg-yellow-500/70" />
        <div className="terminal-dot bg-green-500/70" />
        <span className="font-mono text-[9px] text-white/22 ml-2">{m.classification}</span>
        <span className="ml-auto font-mono text-[9px] px-2 py-0.5 rounded border"
          style={{ color: m.statusColor, borderColor: `${m.statusColor}40`, background: `${m.statusColor}0D` }}>
          {isLocked ? <Lock size={9} /> : m.status}
        </span>
      </div>

      <div className="p-5">
        <p className="font-mono text-[9px] text-white/28 mb-1 tracking-wider">CODENAME</p>
        <h3 className="font-sans text-sm font-bold text-white mb-3 leading-snug">{m.codename}</h3>
        <p className="font-mono text-[11px] text-white/38 mb-4 leading-relaxed">{m.objective}</p>

        {/* Meta grid */}
        <div className="grid grid-cols-2 gap-2 mb-4 text-[11px] font-mono">
          <div className="flex items-center gap-1.5 text-white/32">
            <Trophy size={10} style={{ color: "#00FFFF" }} />
            <span className="text-neon-cyan font-bold">{m.prize}</span>
          </div>
          <div className="flex items-center gap-1.5 text-white/32">
            <Clock size={10} />
            {m.deadline}
          </div>
          <div className="flex items-center gap-1.5 text-white/32">
            <Users size={10} />
            {m.team} devs/team
          </div>
          <div className="flex items-center gap-1.5 text-white/32">
            <Target size={10} />
            {m.filled}/{m.slots} slots
          </div>
        </div>

        {/* Slot bar */}
        <div className="h-1 w-full rounded-full mb-4 overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(m.filled / m.slots) * 100}%` }}
            transition={{ delay: i * 0.07 + 0.3, duration: 0.8 }}
            className="h-full rounded-full"
            style={{ background: m.statusColor }}
          />
        </div>

        {/* Tags + difficulty */}
        <div className="flex flex-wrap gap-1 mb-4">
          {m.tags.map(t => (
            <span key={t} className="font-mono text-[9px] text-white/28 border border-white/8 px-1.5 py-0.5 rounded">{t}</span>
          ))}
          <span className="font-mono text-[9px] px-1.5 py-0.5 rounded ml-auto"
            style={{ color: m.diffColor, background: `${m.diffColor}12` }}>
            {m.difficulty}
          </span>
        </div>

        <motion.button
          whileHover={!isLocked ? { scale: 1.01, background: "rgba(0,255,255,0.08)" } : {}}
          whileTap={!isLocked ? { scale: 0.99 } : {}}
          className="w-full font-mono text-sm py-2.5 border transition-all"
          style={isLocked ? {
            color: "rgba(255,255,255,0.2)",
            borderColor: "rgba(255,255,255,0.06)",
            cursor: "not-allowed",
          } : {
            color: "#00FFFF",
            borderColor: "rgba(0,255,255,0.3)",
          }}
          disabled={isLocked}
        >
          {isLocked ? "[ LOCKED ]" : "[ ACCEPT_MISSION ]"}
        </motion.button>
      </div>
    </motion.div>
  );
}

export default function MissionsPage() {
  return (
    <main className="min-h-screen pt-10 pb-32 px-6 relative">
      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />

      <div className="relative max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
          <p className="font-mono text-xs text-neon-green/55 mb-3 tracking-wider">// /missions — classified.db</p>
          <h1 className="font-sans font-bold tracking-tighter text-white leading-none mb-3" style={{ fontSize: "clamp(2.5rem,7vw,5rem)" }}>
            MISSION <span className="text-neon-cyan">BRIEFING</span>
          </h1>
          <p className="font-mono text-sm text-white/35">Choose your mission. Accept the risk. Ship or die.</p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {MISSIONS.map((m, i) => <MissionCard key={m.codename} m={m} i={i} />)}
        </div>
      </div>
    </main>
  );
}
