"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Lock, Terminal, ArrowRight, Zap, Code, Cpu } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";

const TYPE_ICONS = { DSA: Code, SYSTEM_DESIGN: Cpu, BUILD: Zap };

function todayIST() {
  const IST = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
  return IST.toISOString().slice(0, 10);
}

export function GrindPreview() {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState([]);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    getDoc(doc(db, "dailyGrind", todayIST()))
      .then(snap => {
        if (snap.exists()) setChallenges((snap.data().challenges || []).slice(0, 3));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="px-6 py-20">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-end justify-between mb-10 flex-wrap gap-4"
        >
          <div>
            <p className="font-mono text-xs text-neon-green/55 mb-2 tracking-wider">
              // /grind - daily_reset: midnight IST
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

        {loading ? (
          <div className="grid md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="terminal-window animate-pulse">
                <div className="terminal-header" />
                <div className="p-5 space-y-3">
                  <div className="h-3 bg-white/5 rounded w-1/2" />
                  <div className="h-3 bg-white/5 rounded w-3/4" />
                  <div className="h-3 bg-white/5 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : challenges.length === 0 ? (
          <div className="terminal-window max-w-md">
            <div className="terminal-header">
              <span className="font-mono text-[10px] text-white/25 ml-2">daily_challenges.sh</span>
            </div>
            <div className="p-8 text-center">
              <p className="font-mono text-xs text-white/25 mb-1">today&apos;s challenges haven&apos;t dropped yet</p>
              <p className="font-mono text-[10px] text-white/15">// check back soon · resets at midnight IST</p>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-4">
            {challenges.map((ch, i) => {
              const Icon     = TYPE_ICONS[ch.type] || Code;
              const isLocked = !user && i > 0;
              return (
                <motion.div
                  key={ch.type || i}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, type: "spring", stiffness: 200, damping: 22 }}
                  whileHover={!isLocked ? { y: -4, borderColor: "rgba(0,255,255,0.22)" } : {}}
                  className="terminal-window transition-colors"
                >
                  <div className="terminal-header">
                    <Terminal size={10} className="ml-2 text-white/25" />
                    <span className="font-mono text-[10px] text-white/25 ml-1">{(ch.type || "challenge").toLowerCase()}.sh</span>
                    {isLocked && <Lock size={10} className="ml-auto text-white/20" />}
                  </div>

                  <div className={`p-5 relative ${isLocked ? "select-none" : ""}`}>
                    {isLocked && (
                      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-b-lg backdrop-blur-[2px]"
                        style={{ background: "rgba(5,5,5,0.7)" }}
                      >
                        <Lock size={18} className="text-white/25" />
                        <p className="font-mono text-[11px] text-white/30">Login to unlock</p>
                      </div>
                    )}

                    <div className="flex items-center gap-2 mb-3">
                      <Icon size={12} style={{ color: ch.typeColor || "rgba(0,255,255,0.6)" }} />
                      <span className="font-mono text-[10px] text-white/30 tracking-wider">{ch.type}</span>
                      <span className="ml-auto font-mono text-[9px] px-1.5 py-0.5 rounded"
                        style={{ color: ch.diffColor || "#00FF41", background: ch.diffBg || "rgba(0,255,65,0.08)" }}>
                        {ch.difficulty}
                      </span>
                    </div>

                    <h3 className="font-sans text-sm font-semibold text-white mb-3 leading-snug">{ch.title}</h3>

                    <div className="flex flex-wrap gap-1 mb-4">
                      {(ch.tags || []).map(t => (
                        <span key={t} className="font-mono text-[9px] text-white/28 border border-white/8 px-1.5 py-0.5 rounded">{t}</span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-white/28">⏱ {ch.time}</span>
                      {!isLocked && (
                        <span className="font-mono text-[10px] text-neon-green">$ ./solve.sh</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

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
