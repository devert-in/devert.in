"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Swords, Anchor, Zap, Radio, Target, Tv2, ArrowUpRight } from "lucide-react";

const FEATURES = [
  { icon: Swords, color: "#FF9500", title: "ARENA",     href: "/arena",     body: "Timed, head-to-head coding matches. Win XP, climb the combat leaderboard." },
  { icon: Anchor, color: "#00FFFF", title: "SHIPYARD",  href: "/shipyard",  body: "Dock your projects, get judged by the community, build a public track record." },
  { icon: Zap,     color: "#00FF41", title: "GRIND",     href: "/grind",     body: "A daily DSA, system-design, or build challenge. One rep a day, compounding." },
  { icon: Radio,   color: "#C77DFF", title: "INTEL",     href: "/intel",     body: "Curated tech news, job drops, and a signal feed that filters the noise." },
  { icon: Target,  color: "#FF6430", title: "MISSIONS",  href: "/missions",  body: "Team up on real build briefs with prize pools and deadlines." },
  { icon: Tv2,     color: "#FFD700", title: "BROADCAST", href: "/broadcast", body: "Live build sessions and past episodes from the DeVert duo." },
];

export function CoreFeatures() {
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
            // core.modules
          </p>
          <h2 className="font-sans font-bold text-white tracking-tighter" style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)" }}>
            EVERYTHING YOU <span className="text-neon-cyan">NEED TO BUILD</span>
          </h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          transition={{ staggerChildren: 0.07 }}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {FEATURES.map(f => (
            <motion.div
              key={f.title}
              variants={{ hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 200, damping: 22 } } }}
            >
              <Link href={f.href}>
                <motion.div
                  whileHover={{ y: -4, borderColor: `${f.color}40` }}
                  className="terminal-window p-5 h-full transition-colors group cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-4">
                    <f.icon size={18} style={{ color: f.color }} />
                    <ArrowUpRight size={13} className="text-white/15 group-hover:text-white/40 transition-colors" />
                  </div>
                  <h3 className="font-sans text-sm font-bold text-white mb-2 tracking-wide">{f.title}</h3>
                  <p className="font-mono text-[11px] text-white/35 leading-relaxed">{f.body}</p>
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
