"use client";

import { motion } from "framer-motion";
import { UserPlus, Compass, Rocket, Trophy } from "lucide-react";

const STEPS = [
  { icon: UserPlus, color: "#00FFFF", step: "01", title: "SIGN UP",         body: "One click with Google. No forms, no verification emails to babysit." },
  { icon: Compass,  color: "#00FF41", step: "02", title: "PICK A TRACK",    body: "Daily Grind for reps, Missions for team builds, Arena for combat." },
  { icon: Rocket,   color: "#FF9500", step: "03", title: "SHIP OR COMPETE", body: "Dock a project in the Shipyard, win a match, or hit a mission deadline." },
  { icon: Trophy,   color: "#FFD700", step: "04", title: "EARN RANK & COINS", body: "XP moves you up the ladder. Pulse coins convert to real payouts." },
];

export function HowItWorks() {
  return (
    <section className="px-6 py-20">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <p className="font-mono text-xs text-neon-green/55 mb-2 tracking-wider">
            // boot_sequence.sh
          </p>
          <h2 className="font-sans font-bold text-white tracking-tighter" style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)" }}>
            HOW <span className="text-neon-cyan">DEVERT</span> WORKS
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 relative">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, type: "spring", stiffness: 200, damping: 22 }}
              className="relative"
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="font-mono text-2xl font-bold" style={{ color: `${s.color}55` }}>{s.step}</span>
                <s.icon size={16} style={{ color: s.color }} />
              </div>
              <h3 className="font-sans text-sm font-bold text-white mb-2 tracking-wide">{s.title}</h3>
              <p className="font-mono text-[11px] text-white/35 leading-relaxed">{s.body}</p>
              {i < STEPS.length - 1 && (
                <div className="hidden lg:block absolute top-3 -right-2.5 w-5 h-px" style={{ background: "rgba(255,255,255,0.1)" }} />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
