"use client";

import { motion } from "framer-motion";
import { GraduationCap } from "lucide-react";
import { PortfolioSection, SectionHeading, EmptyState } from "./terminal-section";

function formatRange(startDate, endDate, current) {
  const parts = [startDate, current ? "Present" : endDate].filter(Boolean);
  return parts.join(" – ");
}

export default function EducationSection({ education = [] }) {
  return (
    <PortfolioSection id="education">
      <SectionHeading comment="degree.json" title="Education" lastWordColor="#C77DFF" />
      {education.length === 0 ? (
        <div className="terminal-window"><EmptyState line1="no education listed yet" line2="stay tuned" /></div>
      ) : (
        <div className="space-y-4">
          {education.map((ed, i) => (
            <motion.div key={ed.id || i} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: 0.08 * i }}
              className="terminal-window overflow-hidden">
              <div className="h-1" style={{ background: "linear-gradient(90deg, #C77DFF, transparent)" }} />
              <div className="terminal-header">
                <div className="terminal-dot bg-red-500/70" />
                <div className="terminal-dot bg-yellow-500/70" />
                <div className="terminal-dot bg-green-500/70" />
                <GraduationCap size={10} className="ml-2 text-white/25" />
                <span className="font-mono text-[10px] text-white/25 ml-1.5">degree.json</span>
              </div>
              <div className="p-5">
                <div className="flex items-baseline justify-between flex-wrap gap-2 mb-1">
                  <h3 className="font-sans font-semibold text-white text-base">{ed.degree}{ed.field ? ` in ${ed.field}` : ""}</h3>
                  <span className="font-mono text-[10px] text-white/25">{formatRange(ed.startDate, ed.endDate, ed.current)}</span>
                </div>
                <p className="font-mono text-xs text-neon-purple mb-2">{ed.institution}</p>
                {ed.grade && <p className="font-mono text-[11px] text-white/35 mb-2">{ed.grade}</p>}
                {ed.description && <p className="font-mono text-xs text-white/40 leading-relaxed">{ed.description}</p>}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </PortfolioSection>
  );
}
