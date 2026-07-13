"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Code2, Clock, Zap, Coins, CheckCircle2 } from "lucide-react";
import { acceptanceRate } from "@/lib/codelab";

const DIFF_COLOR = { Easy: "#00FF41", Medium: "#FF9500", Hard: "#FF5050" };

export function ProblemCard({ problem, solved }) {
  const rate = acceptanceRate(problem);

  return (
    <motion.div whileHover={{ borderColor: "rgba(0,255,255,0.25)" }} className="terminal-window">
      <div className="terminal-header">
        <div className="terminal-dot bg-red-500/70" /><div className="terminal-dot bg-yellow-500/70" /><div className="terminal-dot bg-green-500/70" />
        <Code2 size={10} className="ml-2 text-white/25" />
        {solved && (
          <span className="ml-auto flex items-center gap-1 font-mono text-[9px] px-1.5 py-0.5 rounded" style={{ color: "#00FF41", background: "rgba(0,255,65,0.1)" }}>
            <CheckCircle2 size={9} /> SOLVED
          </span>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="font-mono text-[9px] text-white/25 border border-white/8 px-1.5 py-0.5 rounded">{problem.category}</span>
          <span className="font-mono text-[9px] px-1.5 py-0.5 rounded"
            style={{ color: DIFF_COLOR[problem.difficulty] || "#00FF41", background: `${DIFF_COLOR[problem.difficulty] || "#00FF41"}15` }}>
            {problem.difficulty}
          </span>
        </div>
        <h3 className="font-sans text-base font-semibold text-white mb-2 leading-snug">{problem.title}</h3>
        <div className="flex items-center gap-3 flex-wrap font-mono text-[10px] text-white/35 mb-3">
          <span className="flex items-center gap-1"><Clock size={10} /> ~{problem.estimatedTime || 15} min</span>
          {rate !== null && <span>{rate}% acceptance</span>}
        </div>
        <div className="flex items-center gap-3 font-mono text-[10px] mb-4">
          {problem.xpReward > 0 && <span className="flex items-center gap-1" style={{ color: "#00FF41" }}><Zap size={10} /> {problem.xpReward} XP</span>}
          {problem.coinReward > 0 && <span className="flex items-center gap-1" style={{ color: "#FFD700" }}><Coins size={10} /> {problem.coinReward}</span>}
        </div>
        <Link href={`/arena/codelab/problem?id=${problem.id}`}
          className="block text-center font-mono text-xs py-2 rounded-lg border border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/8 transition-colors">
          solve
        </Link>
      </div>
    </motion.div>
  );
}
