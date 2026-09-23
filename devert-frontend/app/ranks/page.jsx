"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Lock, Medal } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { loadTierLadder, DEFAULT_TIERS } from "@/lib/ranks";

function tierBg(color) {
  const hex = color.replace("#", "");
  const n = parseInt(hex.length === 3 ? hex.split("").map(c => c + c).join("") : hex, 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return `rgba(${r},${g},${b},0.06)`;
}

const TIER_COLORS = { LEGEND: "#FFD700", ELITE: "#FF6B35", ARCHITECT: "#00FFFF", BUILDER: "#00FF41", RECRUIT: "#666" };

function getTierName(xp = 0) {
  if (xp >= 10000) return "LEGEND";
  if (xp >= 5000)  return "ELITE";
  if (xp >= 2000)  return "ARCHITECT";
  if (xp >= 500)   return "BUILDER";
  return "RECRUIT";
}

export default function RanksPage() {
  const { user, userData } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [tiers, setTiers]             = useState(DEFAULT_TIERS);

  useEffect(() => { loadTierLadder().then(setTiers); }, []);

  useEffect(() => {
    getDocs(query(collection(db, "users"), orderBy("xp", "desc"), limit(50)))
      .then(snap => {
        setLeaderboard(snap.docs.map((d, i) => {
          const data = d.data();
          const tierName = getTierName(data.xp);
          return {
            rank: i + 1,
            handle: data.handle || data.email?.split("@")[0] || "dev",
            uid: data.uid,
            xp: (data.xp || 0).toLocaleString(),
            tierName,
            tierColor: TIER_COLORS[tierName],
          };
        }));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const myRow = user && leaderboard.find(r => r.uid === user.uid);

  return (
    <main className="min-h-screen pt-10 pb-32 px-6 relative">
      <div className="absolute inset-0 grid-bg opacity-25 pointer-events-none" />

      <div className="relative max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
          <p className="font-mono text-xs text-neon-green/55 mb-3 tracking-wider">// /ranks - tier_registry.db</p>
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
              {tiers.map((t, i) => (
                <motion.div key={t.tier}
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08, type: "spring", stiffness: 200, damping: 22 }}
                  whileHover={!t.locked ? { borderColor: `${t.color}40` } : {}}
                  className="terminal-window transition-colors cursor-default"
                  style={{ background: tierBg(t.color) }}
                >
                  <div className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-1 h-8 rounded-full flex-shrink-0" style={{ background: t.color, boxShadow: `0 0 8px ${t.color}` }} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-bold tracking-wider" style={{ color: t.color }}>{t.tier}</span>
                          {t.locked && <Lock size={11} style={{ color: "rgba(255,255,255,0.2)" }} />}
                          {userData?.tier?.name === t.tier && (
                            <span className="font-mono text-[9px] text-neon-green/60 border border-neon-green/25 px-1.5 py-0.5 rounded ml-auto">YOU</span>
                          )}
                        </div>
                        <p className="font-mono text-[10px] text-white/30 mt-0.5">{t.req} · {t.xp} XP</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {t.perks.map(p => (
                        <span key={p} className="font-mono text-[9px] text-white/28 border border-white/8 px-1.5 py-0.5 rounded">{p}</span>
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
                <Trophy size={10} className="ml-2 text-white/25" />
                <span className="font-mono text-[10px] text-white/25 ml-1">all_time.top</span>
              </div>

              {loading ? (
                <div className="px-4 py-10 text-center">
                  <p className="font-mono text-xs text-white/25 animate-pulse">loading leaderboard...</p>
                </div>
              ) : leaderboard.length === 0 ? (
                <div className="px-4 py-10 text-center">
                  <p className="font-mono text-xs text-white/25 mb-1">no builders yet</p>
                  <p className="font-mono text-[10px] text-white/15">// be the first to claim rank #1</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/6">
                        {["#", "HANDLE", "XP", "TIER"].map(h => (
                          <th key={h} className="font-mono text-[9px] text-white/25 text-left px-4 py-2.5 tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboard.map((p, i) => {
                        const isMe = user && p.uid === user.uid;
                        return (
                          <motion.tr key={p.uid}
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 + i * 0.025 }}
                            className="border-b border-white/4 hover:bg-white/2 transition-colors"
                            style={isMe ? { background: "rgba(0,255,65,0.04)" } : {}}
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
                            <td className="font-mono text-xs px-4 py-3" style={{ color: isMe ? "#00FF41" : "white" }}>
                              @{p.handle}{isMe && <span className="text-[9px] text-neon-green/50 ml-1.5">you</span>}
                            </td>
                            <td className="font-mono text-xs text-neon-cyan px-4 py-3">{p.xp}</td>
                            <td className="px-4 py-3">
                              <span className="font-mono text-[9px] px-1.5 py-0.5 rounded"
                                style={{ color: p.tierColor, background: `${p.tierColor}15` }}>
                                {p.tierName}
                              </span>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
              className="terminal-window mt-4 p-5 text-center"
            >
              {user ? (
                <>
                  <p className="font-mono text-xs text-white/30 mb-1">
                    Your rank: {myRow ? `#${myRow.rank} of ${leaderboard.length}` : "not ranked yet"}
                  </p>
                  <p className="font-mono text-sm text-white/55">Keep grinding. Every XP counts.</p>
                </>
              ) : (
                <>
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
                </>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </main>
  );
}
