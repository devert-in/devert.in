"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Github, Linkedin, MapPin, Copy, Check, Send, Share2 } from "lucide-react";
import { PortfolioSection, SectionHeading } from "./terminal-section";

function socialHref(v) {
  if (!v) return null;
  return v.startsWith("http") ? v : `https://${v}`;
}

export default function ContactSection({ profile, onShare }) {
  const { contactEmail, github, linkedin, location } = profile;
  const [copied, setCopied] = useState(false);

  const rows = [
    contactEmail && { icon: Mail, label: "Email", value: contactEmail, href: `mailto:${contactEmail}` },
    github && { icon: Github, label: "GitHub", value: github, href: socialHref(github) },
    linkedin && { icon: Linkedin, label: "LinkedIn", value: linkedin, href: socialHref(linkedin) },
    location && { icon: MapPin, label: "Location", value: location, href: null },
  ].filter(Boolean);

  if (rows.length === 0) return null;

  const copyEmail = () => {
    if (!contactEmail) return;
    navigator.clipboard.writeText(contactEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <PortfolioSection id="contact">
      <SectionHeading comment="get_in_touch.sh" title="Let's Connect" lastWordColor="#00FFFF" />
      <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        className="terminal-window">
        <div className="terminal-header">
          <span className="font-mono text-[10px] text-white/25 ml-2">contact.sh</span>
        </div>
        <div className="p-6 grid md:grid-cols-5 gap-6">
          <div className="md:col-span-2 space-y-3">
            {rows.map(r => (
              <div key={r.label} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(0,255,255,0.06)" }}>
                  <r.icon size={13} className="text-neon-cyan" />
                </div>
                <div className="min-w-0">
                  <p className="font-mono text-[9px] text-white/25">{r.label.toUpperCase()}</p>
                  {r.href ? (
                    <a href={r.href} target="_blank" rel="noopener noreferrer" className="font-mono text-xs text-white/65 hover:text-neon-cyan transition-colors truncate block">{r.value}</a>
                  ) : (
                    <p className="font-mono text-xs text-white/65 truncate">{r.value}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="md:col-span-3 flex flex-col justify-center">
            <p className="font-mono text-xs text-white/40 leading-relaxed mb-4">
              Open to opportunities, collaborations, and interesting conversations. Reach out any time.
            </p>
            <div className="flex flex-wrap gap-2.5">
              {contactEmail && (
                <a href={`mailto:${contactEmail}`}
                  className="flex items-center gap-2 font-mono text-xs py-2.5 px-4"
                  style={{ color: "#0a0a0a", background: "#00FF41" }}>
                  <Send size={12} /> send email
                </a>
              )}
              {contactEmail && (
                <button onClick={copyEmail}
                  className="flex items-center gap-2 font-mono text-xs py-2.5 px-4 border transition-all"
                  style={copied
                    ? { color: "#00FF41", borderColor: "rgba(0,255,65,0.3)" }
                    : { color: "rgba(255,255,255,0.4)", borderColor: "rgba(255,255,255,0.12)" }}>
                  <AnimatePresence mode="wait">
                    {copied
                      ? <motion.span key="y" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2"><Check size={12} /> copied!</motion.span>
                      : <motion.span key="n" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2"><Copy size={12} /> copy email</motion.span>}
                  </AnimatePresence>
                </button>
              )}
              <button onClick={onShare}
                className="flex items-center gap-2 font-mono text-xs py-2.5 px-4 border border-white/12 text-white/40 hover:text-white/70 transition-all">
                <Share2 size={12} /> share portfolio
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </PortfolioSection>
  );
}
