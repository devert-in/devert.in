"use client";

import { motion } from "framer-motion";
import { Briefcase, Calendar } from "lucide-react";
import { PortfolioSection, SectionHeading, EmptyState } from "./terminal-section";

function formatRange(startDate, endDate, current) {
  const parts = [startDate, current ? "Present" : endDate].filter(Boolean);
  return parts.join(" - ");
}

function fileNameFor(company) {
  return (company || "role").toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "") + ".sh";
}

export default function ExperienceSection({ experience = [] }) {
  return (
    <PortfolioSection id="experience">
      <SectionHeading comment="experience.log" title="Work Experience" lastWordColor="#FF9500" />
      {experience.length === 0 ? (
        <div className="terminal-window"><EmptyState line1="no experience listed yet" line2="stay tuned" /></div>
      ) : (
        <div className="space-y-4">
          {experience.map((exp, i) => (
            <motion.div key={exp.id || i} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: 0.08 * i }}
              className="terminal-window">
              <div className="terminal-header">
                <Briefcase size={10} className="ml-2 text-white/25" />
                <span className="font-mono text-[10px] text-white/25 ml-1.5">{fileNameFor(exp.company)}</span>
                <div className="ml-auto flex items-center gap-2">
                  {exp.type && (
                    <span className="font-mono text-[9px] px-1.5 py-0.5 rounded border"
                      style={{ color: exp.color || "#00FF41", background: `${exp.color || "#00FF41"}12`, borderColor: `${exp.color || "#00FF41"}30` }}>
                      {exp.type}
                    </span>
                  )}
                  {(exp.startDate || exp.endDate) && (
                    <span className="flex items-center gap-1 font-mono text-[9px] text-white/25">
                      <Calendar size={9} /> {formatRange(exp.startDate, exp.endDate, exp.current)}
                    </span>
                  )}
                </div>
              </div>
              <div className="p-5">
                <h3 className="font-sans font-semibold text-white text-base mb-0.5">{exp.role}</h3>
                <p className="font-mono text-xs mb-3" style={{ color: exp.color || "#00FF41" }}>
                  @{exp.company}{exp.location ? ` · ${exp.location}` : ""}
                </p>
                {exp.description && <p className="font-mono text-xs text-white/40 leading-relaxed mb-3">{exp.description}</p>}
                {exp.points?.length > 0 && (
                  <ul className="space-y-1.5 mb-3">
                    {exp.points.map((p, j) => (
                      <li key={j} className="flex gap-2 font-mono text-xs text-white/45 leading-relaxed">
                        <span style={{ color: exp.color || "#00FF41" }}>▸</span> {p}
                      </li>
                    ))}
                  </ul>
                )}
                {exp.tech?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {exp.tech.map(t => (
                      <span key={t} className="font-mono text-[9px] text-white/40 border border-white/8 px-1.5 py-0.5 rounded">{t}</span>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </PortfolioSection>
  );
}
