"use client";

import { motion } from "framer-motion";
import { Crosshair, Telescope } from "lucide-react";

const CARDS = [
  {
    icon: Crosshair,
    color: "#00FFFF",
    label: "// mission.md",
    title: "MISSION",
    body: "Give serious developers a single place to prove it - not another course platform, not another content feed. Build real things, compete for real stakes, and let the work speak.",
  },
  {
    icon: Telescope,
    color: "#00FF41",
    label: "// vision.md",
    title: "VISION",
    body: "The default proving ground for the next generation of builders in India and beyond - where a shipped project and a rank on the ladder mean more than a certificate ever did.",
  },
];

export function MissionVision() {
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
            // why_devert.exists
          </p>
          <h2 className="font-sans font-bold text-white tracking-tighter" style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)" }}>
            MISSION <span className="text-neon-cyan">&amp;</span> VISION
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-5">
          {CARDS.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, type: "spring", stiffness: 200, damping: 22 }}
              className="terminal-window p-6"
            >
              <div className="flex items-center gap-2.5 mb-4">
                <c.icon size={16} style={{ color: c.color }} />
                <p className="font-mono text-[10px] tracking-wider" style={{ color: c.color }}>{c.label}</p>
              </div>
              <h3 className="font-sans text-xl font-bold text-white mb-3 tracking-tight">{c.title}</h3>
              <p className="font-mono text-[13px] text-white/40 leading-relaxed">{c.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
