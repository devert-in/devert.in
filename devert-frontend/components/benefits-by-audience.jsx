"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { GraduationCap, Briefcase, Rocket } from "lucide-react";

const AUDIENCES = [
  {
    key: "student", label: "STUDENTS", icon: GraduationCap, color: "#00FFFF",
    benefits: [
      "Daily Grind builds real DSA/system-design reps outside the classroom",
      "A public Shipyard portfolio recruiters can actually check",
      "Rank ladder gives you a concrete goal beyond grades",
    ],
  },
  {
    key: "seeker", label: "JOB SEEKERS", icon: Briefcase, color: "#00FF41",
    benefits: [
      "Intel feed surfaces curated job drops and hiring signals",
      "Arena wins and shipped projects double as interview talking points",
      "Hackathons put you in front of teams building under real pressure",
    ],
  },
  {
    key: "indie", label: "INDIE HACKERS", icon: Rocket, color: "#FF9500",
    benefits: [
      "Dock every project in the Shipyard and get judged by builders, not bots",
      "Missions connect you with teammates for bigger builds",
      "Pulse coins turn community traction into real payouts",
    ],
  },
];

export function BenefitsByAudience() {
  const [active, setActive] = useState(AUDIENCES[0].key);
  const current = AUDIENCES.find(a => a.key === active);

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
            // built_for.whoami
          </p>
          <h2 className="font-sans font-bold text-white tracking-tighter" style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)" }}>
            BUILT FOR <span className="text-neon-cyan">EVERY BUILDER</span>
          </h2>
        </motion.div>

        <div className="flex gap-2 mb-6 flex-wrap">
          {AUDIENCES.map(a => (
            <button key={a.key} onClick={() => setActive(a.key)}
              className="flex items-center gap-2 font-mono text-xs px-4 py-2 rounded-lg transition-colors"
              style={{
                color:      active === a.key ? a.color : "rgba(255,255,255,0.3)",
                background: active === a.key ? `${a.color}12` : "rgba(255,255,255,0.03)",
                border:     active === a.key ? `1px solid ${a.color}40` : "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <a.icon size={13} /> {a.label}
            </button>
          ))}
        </div>

        <motion.div
          key={current.key}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="terminal-window p-6"
        >
          <div className="space-y-4">
            {current.benefits.map((b, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="font-mono text-xs mt-0.5 flex-shrink-0" style={{ color: current.color }}>{String(i + 1).padStart(2, "0")}</span>
                <p className="font-mono text-[13px] text-white/45 leading-relaxed">{b}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
