"use client";

import { motion } from "framer-motion";
import { Clock } from "lucide-react";
import { PortfolioSection, SectionHeading, EmptyState } from "./terminal-section";

const TYPE_META = {
  project:     { color: "#00FFFF", label: "shipped a project" },
  certification: { color: "#00FF41", label: "earned a certification" },
  achievement: { color: "#FFD700", label: "unlocked an achievement" },
  experience:  { color: "#FF9500", label: "started a role" },
  education:   { color: "#C77DFF", label: "began a program" },
};

// Purely a derived view over data already fetched for the other sections -
// no new Firestore writes/instrumentation needed. Best-effort, not
// exhaustive: only surfaces events that already carry a usable date.
function buildTimeline({ projects, certifications, achievements, experience, education }) {
  const events = [];
  for (const p of projects || []) {
    const ts = p.createdAt?.seconds ? p.createdAt.seconds * 1000 : null;
    if (ts) events.push({ type: "project", date: ts, title: p.name });
  }
  for (const c of certifications || []) {
    if (c.issueDate) events.push({ type: "certification", date: Date.parse(c.issueDate) || 0, title: c.title });
  }
  for (const a of achievements || []) {
    if (a.date) events.push({ type: "achievement", date: Date.parse(a.date) || 0, title: a.title });
  }
  for (const e of experience || []) {
    if (e.startDate) events.push({ type: "experience", date: Date.parse(e.startDate) || 0, title: `${e.role} @ ${e.company}` });
  }
  for (const ed of education || []) {
    if (ed.startDate) events.push({ type: "education", date: Date.parse(ed.startDate) || 0, title: ed.degree });
  }
  return events.filter(e => e.date).sort((a, b) => b.date - a.date).slice(0, 8);
}

export default function TimelineSection(props) {
  const events = buildTimeline(props);

  return (
    <PortfolioSection id="timeline">
      <SectionHeading comment="activity.timeline" title="Activity Timeline" lastWordColor="#FF9500" />
      <div className="terminal-window">
        <div className="terminal-header">
          <div className="terminal-dot bg-red-500/70" /><div className="terminal-dot bg-yellow-500/70" /><div className="terminal-dot bg-green-500/70" />
          <Clock size={10} className="ml-2 text-white/25" />
          <span className="font-mono text-[10px] text-white/25 ml-1.5">timeline.log</span>
        </div>
        {events.length === 0 ? (
          <EmptyState line1="nothing to show yet" line2="milestones will appear here" />
        ) : (
          <div className="divide-y divide-white/4">
            {events.map((e, i) => {
              const meta = TYPE_META[e.type];
              return (
                <motion.div key={i} initial={{ opacity: 0, x: -8 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                  transition={{ delay: 0.04 * i }}
                  className="flex items-center gap-3 px-5 py-3">
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: meta.color, boxShadow: `0 0 4px ${meta.color}` }} />
                  <span className="font-mono text-xs text-white/55 flex-1">
                    <span style={{ color: meta.color }}>{meta.label}</span> — {e.title}
                  </span>
                  <span className="font-mono text-[10px] text-white/20 flex-shrink-0">
                    {new Date(e.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </PortfolioSection>
  );
}
