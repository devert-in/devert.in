"use client";

import { motion } from "framer-motion";
import { Trophy, Zap, Lock, Star, Medal } from "lucide-react";

const TIERS = [
  { tier: "LEGEND",    color: "#FFD700", bgAlpha: "rgba(255,215,0,0.06)",  req: "Invited only",         xp: "10,000+", perks: ["Lifetime access","Direct duo mentorship","Custom badge","Featured on homepage"],               locked: true,  count: 3   },
  { tier: "ELITE",     color: "#FF6B35", bgAlpha: "rgba(255,107,53,0.06)", req: "Top 10% in Arena",     xp: "2,000+",  perks: ["Priority mission slots","Profile badge","Early access to features","XP multiplier 2x"],        locked: true,  count: 28  },
  { tier: "ARCHITECT", color: "#00FFFF", bgAlpha: "rgba(0,255,255,0.05)",  req: "Win 1 Mission",        xp: "500+",    perks: ["Mentor badge","Private channels","Mission creation rights","Resume review"],                     locked: false, count: 142 },
  { tier: "BUILDER",   color: "#00FF41", bgAlpha: "rgba(0,255,65,0.04)",   req: "Ship 1 project",       xp: "100+",    perks: ["Full platform access","Shipyard rights","Arena access","Intel feed"],                           locked: false, count: 412 },
  { tier: "RECRUIT",   color: "#666",    bgAlpha: "rgba(100,100,100,0.04)",req: "Join the platform",    xp: "0",       perks: ["Grind access (1/day)","Read-only Intel","Mission browsing"],                                     locked: false, count: 265 },
];

const LEADERBOARD = [
  { rank: 1, handle: "rk_codes",   xp: "12,400", tier: "LEGEND",    tierColor: "#FFD700", change: "+2"  },
  { rank: 2, handle: "anon_dev",   xp: "11,850", tier: "LEGEND",    tierColor: "#FFD700", change: "—"   },
  { rank: 3, handle: "sam_builds", xp: "4,200",  tier: "ELITE",     tierColor: "#FF6B35", change: "+1"  },
  { rank: 4, handle: "ui_witch",   xp: "3,800",  tier: "ELITE",     tierColor: "#FF6B35", change: "-1"  },
  { rank: 5, handle: "code_zero",  xp: "2,100",  tier: "ELITE",     tierColor: "#FF6B35", change: "+3"  },
  { rank: 6, handle: "d3v_null",   xp: "850",    tier: "ARCHITECT", tierColor: "#00FFFF", change: "—"   },
  { rank: 7, handle: "byte_king",  xp: "620",    tier: "ARCHITECT", tierColor: "#00FFFF", change: "+5"  },
  { rank: 8, handle: "null_ptr",   xp: "380",    tier: "BUILDER",   tierColor: "#00FF41", change: "+2"  },
];

export default function RanksPage() {
  return (
    <main className="min-h-screen pt-10 pb-32 px-6 relative">
      <div className="absolute inset-0 grid-bg opacity-25 pointer-events-none" />

      <div className="relative max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
          <p className="font-mono text-xs text-neon-green/55 mb-3 tracking-wider">// /ranks — tier_registry.db</p>
          <h1 className="font-sans font-bold tracking-tighter text-white leading-none mb-3" style={{ fontSize: "clamp(2.5rem,7vw,5rem)" }}>
            RANK <span className="text-neon-cyan">REGISTRY</span>
          </h1>
          <p className="font-mono text-sm text-white/35">Five tiers. All earned. None given.</p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Tier ladder */}
          <div>
            <p className="font-mono text-xs text-white/22 mb-5 tracking-wider">// tier_system.json</p>
            <div className="space-y-3">
              {TIERS.map((t, i) => (
                <motion.div
                  key={t.tier}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08, type: "spring", stiffness: 200, damping: 22 }}
                  whileHover={!t.locked ? { borderColor: `${t.color}40` } : {}}
                  className="terminal-window transition-colors cursor-default"
                  style={{ background: t.bgAlpha }}
                >
                  <div className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-1 h-8 rounded-full flex-shrink-0" style={{ background: t.color, boxShadow: `0 0 8px ${t.color}` }} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-bold tracking-wider" style={{ color: t.color }}>{t.tier}</span>
                          {t.locked && <Lock size={11} style={{ color: "rgba(255,255,255,0.2)" }} />}
                          <span className="font-mono text-[10px] text-white/22 ml-auto">{t.count} builders</span>
                        </div>
                        <p className="font-mono text-[10px] text-white/30 mt-0.5">{t.req} · {t.xp} XP</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {t.perks.map(p => (
                        <span key={p} className="font-mono text-[9px] text-white/28 border border-white/8 px-1.5 py-0.5 rounded">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Leaderboard */}
          <div>
            <p className="font-mono text-xs text-white/22 mb-5 tracking-wider">// global_leaderboard.db</p>
            <div className="terminal-window">
              <div className="terminal-header">
                <div className="terminal-dot bg-red-500/70" />
                <div className="terminal-dot bg-yellow-500/70" />
                <div className="terminal-dot bg-green-500/70" />
                <Trophy size={10} className="ml-2 text-white/25" />
                <span className="font-mono text-[10px] text-white/25 ml-1">all_time.top</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/6">
                      {["#","HANDLE","XP","TIER","Δ"].map(h => (
                        <th key={h} className="font-mono text-[9px] text-white/25 text-left px-4 py-2.5 tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {LEADERBOARD.map((p, i) => (
                      <motion.tr key={p.rank}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.15 + i * 0.06 }}
                        className="border-b border-white/4 hover:bg-white/2 transition-colors"
                      >
                        <td className="font-mono text-xs px-4 py-3">
                          {p.rank <= 3 ? (
                            <span className="flex items-center gap-1 font-bold"
                              style={{ color: p.rank === 1 ? "#FFD700" : p.rank === 2 ? "#C0C0C0" : "#CD7F32" }}>
                              <Medal size={12} /> {p.rank}
                            </span>
                          ) : (
                            <span className="text-white/30">{p.rank}</span>
                          )}
                        </td>
                        <td className="font-mono text-xs text-white px-4 py-3">{p.handle}</td>
                        <td className="font-mono text-xs text-neon-cyan px-4 py-3">{p.xp}</td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-[9px] px-1.5 py-0.5 rounded"
                            style={{ color: p.tierColor, background: `${p.tierColor}15` }}>
                            {p.tier}
                          </span>
                        </td>
                        <td className="font-mono text-xs px-4 py-3"
                          style={{ color: p.change.startsWith("+") ? "#00FF41" : p.change === "—" ? "rgba(255,255,255,0.25)" : "#FF5050" }}>
                          {p.change}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Join CTA */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="terminal-window mt-4 p-5 text-center"
            >
              <p className="font-mono text-xs text-white/30 mb-1">Your rank: NOT_FOUND</p>
              <p className="font-mono text-sm text-white/55 mb-4">Join to claim your place on the ladder.</p>
              <a href="/login">
                <motion.button
                  whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(0,255,65,0.2)" }}
                  whileTap={{ scale: 0.98 }}
                  className="font-mono text-sm text-black bg-neon-green px-8 py-3 transition-all"
                >
                  [ START_AS_RECRUIT ]
                </motion.button>
              </a>
            </motion.div>
          </div>
        </div>
      </div>
    </main>
  );
}
