"use client";

import { motion } from "framer-motion";
import { ShieldOff, Swords, TrendingUp, Lock } from "lucide-react";

const PROMISES = [
  { icon: ShieldOff,   color: "#FF6430", title: "NO FLUFF",            body: "No filler videos, no engagement-bait threads. Every module exists to make you ship faster." },
  { icon: Swords,      color: "#00FFFF", title: "REAL COMPETITION",    body: "Arena matches, hackathons, and mission boards judge output, not attendance." },
  { icon: TrendingUp,  color: "#00FF41", title: "EARN WHILE YOU BUILD", body: "XP, rank, and coins convertible to real payouts - progress that compounds into something real." },
  { icon: Lock,        color: "#C77DFF", title: "EARNED, NOT GIVEN",    body: "Ranks and perks unlock through shipped work and match wins. No shortcuts, no paid tiers to skip the line." },
];

export function PlatformPromises() {
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
            // platform.promises
          </p>
          <h2 className="font-sans font-bold text-white tracking-tighter" style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)" }}>
            WHAT WE <span className="text-neon-cyan">PROMISE</span>
          </h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          transition={{ staggerChildren: 0.08 }}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {PROMISES.map(p => (
            <motion.div
              key={p.title}
              variants={{ hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 200, damping: 22 } } }}
              whileHover={{ y: -4, borderColor: `${p.color}40` }}
              className="terminal-window p-5 transition-colors"
            >
              <p.icon size={18} style={{ color: p.color }} className="mb-4" />
              <h3 className="font-sans text-sm font-bold text-white mb-2 tracking-wide">{p.title}</h3>
              <p className="font-mono text-[11px] text-white/35 leading-relaxed">{p.body}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
