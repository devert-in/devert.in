"use client";

import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import { PortfolioSection, SectionHeading, EmptyState } from "./terminal-section";

export default function AchievementsSection({ achievements = [] }) {
  return (
    <PortfolioSection id="achievements">
      <SectionHeading comment="wins.log" title="Achievements" lastWordColor="#FFD700" />
      {achievements.length === 0 ? (
        <div className="terminal-window"><EmptyState line1="no achievements listed yet" line2="stay tuned" /></div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map((a, i) => (
            <motion.div key={a.id || i} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: 0.06 * i }}
              className="border border-white/6 rounded-lg p-4 overflow-hidden relative">
              <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: `linear-gradient(90deg, ${a.color || "#FFD700"}, transparent)` }} />
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded flex items-center justify-center flex-shrink-0" style={{ background: `${a.color || "#FFD700"}12` }}>
                  <Trophy size={16} style={{ color: a.color || "#FFD700" }} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="font-sans font-semibold text-sm text-white/85 leading-snug">{a.title}</p>
                    {a.date && <span className="font-mono text-[9px] text-white/25 flex-shrink-0">{a.date}</span>}
                  </div>
                  {a.org && <p className="font-mono text-[10px] text-white/35 mt-0.5">{a.org}</p>}
                  {a.description && <p className="font-mono text-[10px] text-white/30 mt-1.5 leading-relaxed">{a.description}</p>}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </PortfolioSection>
  );
}
