"use client";

import { motion } from "framer-motion";
import { Swords, Timer, Users, Terminal, Lock, Trophy } from "lucide-react";

const LEADERBOARD = [
  { rank: 1, handle: "rk_codes",  wins: 47, losses: 8,  ratio: "85%", tier: "LEGEND",    tierColor: "#FFD700" },
  { rank: 2, handle: "sam_builds",wins: 39, losses: 12, ratio: "76%", tier: "ELITE",     tierColor: "#FF6B35" },
  { rank: 3, handle: "anon_dev",  wins: 31, losses: 15, ratio: "67%", tier: "ARCHITECT", tierColor: "#00FFFF" },
  { rank: 4, handle: "ui_witch",  wins: 22, losses: 18, ratio: "55%", tier: "BUILDER",   tierColor: "#00FF41" },
  { rank: 5, handle: "code_zero", wins: 18, losses: 14, ratio: "56%", tier: "BUILDER",   tierColor: "#00FF41" },
  { rank: 6, handle: "d3v_null",  wins: 11, losses: 20, ratio: "35%", tier: "RECRUIT",   tierColor: "#555" },
];

const CHALLENGES = [
  { id: 1, title: "Binary Tree Maximum Path Sum",      difficulty: "HARD",   diffColor: "#FF3B3B", time: "30 min", tags: ["Trees","DFS","DP"],       locked: false },
  { id: 2, title: "LRU Cache Implementation",          difficulty: "MEDIUM", diffColor: "#FF9500", time: "25 min", tags: ["HashMap","DLL"],          locked: false },
  { id: 3, title: "Design Distributed Rate Limiter",   difficulty: "SYSTEM", diffColor: "#00FFFF", time: "45 min", tags: ["Architecture","Redis"],   locked: true  },
];

const STATS = [
  { label: "MATCHES_TODAY", value: "142", icon: Swords },
  { label: "ACTIVE_PLAYERS", value: "23",  icon: Users  },
  { label: "AVG_MATCH_TIME", value: "18m", icon: Timer  },
];

export default function ArenaPage() {
  return (
    <main className="min-h-screen pt-10 pb-32 px-6 relative">
      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />

      <div className="relative max-w-6xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
          <p className="font-mono text-xs text-neon-green/55 mb-3 tracking-wider">// /arena — code_combat.exe</p>
          <h1 className="font-sans font-bold tracking-tighter text-white leading-none mb-3" style={{ fontSize: "clamp(2.5rem,7vw,5rem)" }}>
            CODE <span className="text-neon-cyan">COMBAT</span>
          </h1>
          <p className="font-mono text-sm text-white/35">Head-to-head. Timed. Brutal. No mercy.</p>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
          className="grid grid-cols-3 gap-3 mb-10"
        >
          {STATS.map(s => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="terminal-window p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={11} style={{ color: "rgba(0,255,255,0.55)" }} />
                  <span className="font-mono text-[9px] text-white/28 tracking-wider">{s.label}</span>
                </div>
                <div className="font-mono text-2xl font-bold text-white">{s.value}</div>
              </div>
            );
          })}
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Challenges */}
          <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}>
            <div className="terminal-window h-full">
              <div className="terminal-header">
                <div className="terminal-dot bg-red-500/70" />
                <div className="terminal-dot bg-yellow-500/70" />
                <div className="terminal-dot bg-green-500/70" />
                <Terminal size={10} className="ml-2 text-white/25" />
                <span className="font-mono text-[10px] text-white/25 ml-1">challenges.json</span>
              </div>
              <div className="p-4 space-y-3">
                {CHALLENGES.map(ch => (
                  <motion.div
                    key={ch.id}
                    whileHover={{ borderColor: "rgba(0,255,255,0.2)" }}
                    className="border border-white/6 rounded-lg p-4 cursor-pointer transition-colors hover:bg-white/2"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="font-sans text-sm font-medium text-white leading-snug">{ch.title}</span>
                      {ch.locked
                        ? <Lock size={13} style={{ color: "rgba(255,255,255,0.2)", flexShrink: 0 }} />
                        : <span className="font-mono text-[9px] px-1.5 py-0.5 rounded flex-shrink-0"
                            style={{ color: ch.diffColor, background: `${ch.diffColor}18` }}>
                            {ch.difficulty}
                          </span>
                      }
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-mono text-[10px] text-white/28 flex items-center gap-1">
                        <Timer size={9} /> {ch.time}
                      </span>
                      {ch.tags.map(t => (
                        <span key={t} className="font-mono text-[9px] text-white/25 border border-white/8 px-1.5 py-0.5 rounded">{t}</span>
                      ))}
                    </div>
                  </motion.div>
                ))}
                <motion.button
                  whileHover={{ scale: 1.01, background: "rgba(0,255,255,0.06)" }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full font-mono text-sm text-neon-cyan border border-neon-cyan/30 py-3 transition-colors mt-2"
                >
                  [ ENTER_MATCH ]
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* Leaderboard */}
          <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
            <div className="terminal-window h-full">
              <div className="terminal-header">
                <div className="terminal-dot bg-red-500/70" />
                <div className="terminal-dot bg-yellow-500/70" />
                <div className="terminal-dot bg-green-500/70" />
                <Trophy size={10} className="ml-2 text-white/25" />
                <span className="font-mono text-[10px] text-white/25 ml-1">leaderboard.db</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/6">
                      {["#","HANDLE","W/L","RATIO","TIER"].map(h => (
                        <th key={h} className="font-mono text-[9px] text-white/25 text-left px-4 py-2.5 tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {LEADERBOARD.map(p => (
                      <tr key={p.rank} className="border-b border-white/4 hover:bg-white/2 transition-colors">
                        <td className="font-mono text-xs text-white/35 px-4 py-3">{p.rank}</td>
                        <td className="font-mono text-xs text-white px-4 py-3">{p.handle}</td>
                        <td className="font-mono text-xs text-white/55 px-4 py-3">{p.wins}/{p.losses}</td>
                        <td className="font-mono text-xs px-4 py-3" style={{ color: "#00FF41" }}>{p.ratio}</td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-[9px] px-1.5 py-0.5 rounded"
                            style={{ color: p.tierColor, background: `${p.tierColor}15` }}>
                            {p.tier}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </main>
  );
}
