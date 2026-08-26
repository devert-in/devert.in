"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

// Shared shell for a DeVert product that has UI-worthy identity but no real
// backend/data model yet (Build, Open Source, Labs, Stories, Organizations).
// Deliberately does NOT fake activity/counts/submissions to look populated -
// every "example" below is static, clearly-labeled preview copy, never a
// number or a fabricated leaderboard. Real functionality replaces this shell
// wholesale once it exists; this is not meant to be built on top of piecemeal.
export function ComingSoonShell({ icon: Icon, color, label, title, tagline, description, previewItems = [] }) {
  return (
    <main className="min-h-screen pt-10 pb-32 px-6 relative">
      <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(ellipse 60% 40% at 50% 0%, ${color}0c 0%, transparent 70%)` }} />

      <div className="relative max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-1.5 font-mono text-[11px] text-white/25 hover:text-white/50 transition-colors mb-8">
          <ArrowLeft size={11} /> devert.in
        </Link>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6" style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
            <Icon size={24} style={{ color }} />
          </div>
          <p className="font-mono text-xs mb-3 tracking-widest" style={{ color: `${color}90` }}>// {label}</p>
          <h1 className="font-sans font-bold tracking-tighter text-white leading-none mb-4"
            style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}>
            {title}
          </h1>
          <p className="font-mono text-sm text-white/40 mb-2 max-w-xl leading-relaxed">{tagline}</p>
          <p className="font-mono text-xs text-white/25 mb-10 max-w-xl leading-relaxed">{description}</p>
        </motion.div>

        {previewItems.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="grid sm:grid-cols-2 gap-3 mb-10">
            {previewItems.map(item => (
              <div key={item.title} className="terminal-window p-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <item.icon size={13} style={{ color }} />
                  <p className="font-sans text-[13px] font-semibold text-white/85">{item.title}</p>
                </div>
                <p className="font-mono text-[10.5px] text-white/30 leading-relaxed">{item.body}</p>
              </div>
            ))}
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="terminal-window p-5 inline-flex items-center gap-3">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
          <p className="font-mono text-xs text-white/40">Coming soon - this is a preview, not a working product yet.</p>
        </motion.div>
      </div>
    </main>
  );
}
