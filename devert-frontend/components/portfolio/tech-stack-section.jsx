"use client";

import { motion } from "framer-motion";
import { Code2 } from "lucide-react";
import { PortfolioSection, SectionHeading, TerminalCard, EmptyState } from "./terminal-section";

const LEVEL_LABEL = ["", "Beginner", "Basic", "Intermediate", "Advanced", "Expert"];

export default function TechStackSection({ skills = [] }) {
  return (
    <PortfolioSection id="techstack">
      <SectionHeading comment="skills.sh" title="Tech Stack" />
      <TerminalCard filename="skills.profile" icon={Code2}>
        {skills.length === 0 ? (
          <EmptyState line1="no skills listed" line2="stay tuned" />
        ) : (
          <div className="space-y-3.5">
            {skills.map((s, i) => (
              <motion.div key={s.name + i} initial={{ opacity: 0, x: -8 }} whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }} transition={{ delay: 0.03 * i }}
                className="flex items-center gap-3">
                <span className="font-mono text-xs text-white/65 flex-1 min-w-0 truncate">{s.name}</span>
                <div className="flex gap-[3px]">
                  {Array.from({ length: 5 }, (_, j) => (
                    <div key={j} className="w-1.5 h-1.5 rounded-full"
                      style={{ background: j < s.level ? "#00FF41" : "rgba(255,255,255,0.08)" }} />
                  ))}
                </div>
                <span className="font-mono text-[9px] w-20 text-right text-white/22 hidden sm:block">{LEVEL_LABEL[s.level]}</span>
              </motion.div>
            ))}
          </div>
        )}
      </TerminalCard>
    </PortfolioSection>
  );
}
