"use client";

import { motion } from "framer-motion";
import { Award, ExternalLink } from "lucide-react";
import { PortfolioSection, SectionHeading, EmptyState } from "./terminal-section";

export default function CertificationsSection({ certifications = [] }) {
  return (
    <PortfolioSection id="certifications">
      <SectionHeading comment="certs.json" title="Certifications" lastWordColor="#00FF41" />
      {certifications.length === 0 ? (
        <div className="terminal-window"><EmptyState line1="no certifications listed yet" line2="stay tuned" /></div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {certifications.map((c, i) => (
            <motion.div key={c.id || i} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: 0.06 * i }}
              className="border border-white/6 rounded-lg p-4 hover:border-white/12 transition-colors">
              <div className="flex items-start gap-3 mb-2">
                {c.logoUrl ? (
                  <img src={c.logoUrl} alt={c.issuer} className="w-9 h-9 rounded object-contain bg-white/5 flex-shrink-0" />
                ) : (
                  <div className="w-9 h-9 rounded flex items-center justify-center flex-shrink-0" style={{ background: "rgba(0,255,65,0.08)" }}>
                    <Award size={16} style={{ color: "#00FF41" }} />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-sans font-semibold text-sm text-white/85 leading-snug">{c.title}</p>
                  <p className="font-mono text-[10px] text-white/35 mt-0.5">{c.issuer}{c.issueDate ? ` · ${c.issueDate}` : ""}</p>
                </div>
              </div>
              {c.credentialUrl && (
                <a href={c.credentialUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-mono text-[10px] text-neon-cyan hover:underline">
                  view credential <ExternalLink size={10} />
                </a>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </PortfolioSection>
  );
}
