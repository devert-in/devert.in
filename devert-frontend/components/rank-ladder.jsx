"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Lock } from "lucide-react";

const TIERS = [
  { tier: "LEGEND",    color: "#FFD700", req: "Invited only",       xp: "10,000+", width: "40%",  locked: true  },
  { tier: "ELITE",     color: "#FF6B35", req: "Top 10% in Arena",   xp: "2,000+",  width: "55%",  locked: true  },
  { tier: "ARCHITECT", color: "#00FFFF", req: "Win a Mission",      xp: "500+",    width: "70%",  locked: false },
  { tier: "BUILDER",   color: "#00FF41", req: "Ship 1 project",     xp: "100+",    width: "85%",  locked: false },
  { tier: "RECRUIT",   color: "#555",    req: "Join the platform",  xp: "0",       width: "100%", locked: false },
];

export function RankLadder() {
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
              // /ranks - tier_registry.json
            </p>
            <h2 className="font-sans font-bold text-white tracking-tighter" style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)" }}>
              THE <span className="text-neon-cyan">LADDER</span>
            </h2>
          </div>
          <Link href="/ranks">
            <motion.div
              whileHover={{ x: 4 }}
              className="flex items-center gap-2 font-mono text-xs text-white/35 hover:text-neon-cyan transition-colors"
            >
              check your rank <ArrowRight size={12} />
            </motion.div>
          </Link>
        </motion.div>

        <div className="max-w-2xl">
          {TIERS.map((t, i) => (
            <motion.div
              key={t.tier}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, type: "spring", stiffness: 200, damping: 22 }}
              className="mb-3"
            >
              <div
                className="relative flex items-center gap-4 px-4 py-3 border border-white/6 rounded-lg transition-colors group cursor-default max-w-full"
                style={{ width: t.width, minWidth: 240, background: "rgba(255,255,255,0.02)" }}
              >
                {/* Glow bar on left */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-lg"
                  style={{ background: t.color, boxShadow: `0 0 8px ${t.color}` }}
                />

                <div className="flex-1 min-w-0 ml-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="font-mono text-xs font-bold tracking-wider truncate"
                      style={{ color: t.color }}
                    >
                      {t.tier}
                    </span>
                    {t.locked && <Lock size={10} className="flex-shrink-0" style={{ color: "rgba(255,255,255,0.2)" }} />}
                  </div>
                  <p className="font-mono text-[10px] text-white/30 mt-0.5 truncate">{t.req}</p>
                </div>

                <span className="font-mono text-[10px] text-white/25 flex-shrink-0">{t.xp} XP</span>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="font-mono text-xs text-white/20 mt-6"
        >
          // You start as RECRUIT. Everything above is earned.
        </motion.p>
      </div>
    </section>
  );
}
