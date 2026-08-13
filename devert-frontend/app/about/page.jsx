"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Swords, Anchor, Zap, Activity, Radio, Flame, Target, Tv2,
  GraduationCap, ArrowUpRight, ArrowDown,
} from "lucide-react";
import { MissionVision } from "@/components/mission-vision";
import { PlatformStats } from "@/components/platform-stats";

const CORE_MODULES = [
  { icon: Swords,   label: "Arena",    body: "Coding battles & contests" },
  { icon: Anchor,   label: "Shipyard", body: "Ship projects, get judged by the community" },
  { icon: Zap,      label: "Grind",    body: "Daily coding challenges, streaks" },
  { icon: Activity, label: "Pulse",    body: "Dev social feed & communities" },
  { icon: Radio,    label: "Intel",    body: "Dev news, resources, opportunities" },
  { icon: Flame,    label: "Events",   body: "Hackathons, workshops, meetups, open mics" },
  { icon: Target,   label: "Missions", body: "Real, paid dev work" },
  { icon: Tv2,      label: "Broadcast", body: "Live dev streams" },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen pt-16 pb-32 px-6 relative">
      <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none" />

      <div className="relative max-w-4xl mx-auto">

        {/* Manifesto */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-20">
          <p className="font-mono text-xs text-neon-green/55 mb-4 tracking-wider">// about.devert</p>
          <h1 className="font-sans font-bold tracking-tighter text-white leading-none mb-6"
            style={{ fontSize: "clamp(2.4rem, 6vw, 4.5rem)" }}>
            DEVERT ISN&apos;T A<br /><span className="text-neon-cyan">CONTENT CHANNEL.</span>
          </h1>
          <div className="space-y-3 max-w-2xl">
            <p className="font-mono text-sm text-white/45 leading-relaxed">
              <span className="text-neon-green/60">$</span> It&apos;s an operating system for developers who ship.
            </p>
            <p className="font-mono text-sm text-white/45 leading-relaxed">
              <span className="text-neon-green/60">$</span> Not another course platform. Not another feed to scroll.
            </p>
            <p className="font-mono text-sm text-white/45 leading-relaxed">
              <span className="text-neon-green/60">$</span> Built by two friends who got tired of mediocre dev content.
            </p>
          </div>
        </motion.div>

        {/* The Ecosystem */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-20">
          <p className="font-mono text-xs text-neon-cyan/55 mb-2 tracking-wider">// the_ecosystem.md</p>
          <h2 className="font-sans font-bold text-white tracking-tighter mb-8" style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)" }}>
            TWO PRODUCTS. <span className="text-neon-cyan">ONE IDENTITY.</span>
          </h2>

          <div className="terminal-window mb-6">
            <div className="terminal-header">
              <div className="terminal-dot bg-red-500/70" /><div className="terminal-dot bg-yellow-500/70" /><div className="terminal-dot bg-green-500/70" />
              <span className="font-mono text-[10px] text-white/25 ml-2">devert.in</span>
            </div>
            <div className="p-6">
              <p className="font-mono text-[10px] text-neon-green/60 tracking-widest mb-1">THE DEVELOPER OS</p>
              <p className="font-mono text-xs text-white/35 mb-5 max-w-lg">
                Build, ship, compete, and connect with other developers. This is where DeVert lives day to day.
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                {CORE_MODULES.map(m => (
                  <div key={m.label} className="flex items-start gap-2.5">
                    <m.icon size={14} className="text-neon-green/70 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-sans text-[12.5px] font-semibold text-white/85">{m.label}</p>
                      <p className="font-mono text-[10.5px] text-white/30 leading-relaxed">{m.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-center mb-6">
            <ArrowDown size={16} className="text-white/15" />
          </div>

          <div className="terminal-window">
            <div className="terminal-header">
              <div className="terminal-dot bg-red-500/70" /><div className="terminal-dot bg-yellow-500/70" /><div className="terminal-dot bg-green-500/70" />
              <span className="font-mono text-[10px] text-white/25 ml-2">devert.in/campus</span>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(0,255,255,0.1)" }}>
                  <GraduationCap size={17} className="text-neon-cyan" />
                </div>
                <p className="font-mono text-[10px] text-neon-cyan tracking-widest">THE LEARNING &amp; PLACEMENT ARM</p>
              </div>
              <p className="font-mono text-xs text-white/35 leading-relaxed max-w-lg">
                DeVert Campus runs on the same identity, XP, and coin economy as core DeVert - it isn&apos;t a
                separate product bolted on, it&apos;s DeVert&apos;s education arm. Every college gets its own gated
                workspace: structured learning, DSA and CS Core practice, GATE prep, company-wise placement prep,
                contests and a live leaderboard, run by that college&apos;s own Training &amp; Placement Cell.
              </p>
            </div>
          </div>
        </motion.div>

        <MissionVision />
        <PlatformStats />

        {/* CTA */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="flex flex-wrap gap-3 justify-center mt-4">
          <Link href="/grind" className="inline-flex items-center gap-2 font-mono text-sm px-6 py-3 border transition-all duration-200"
            style={{ borderColor: "#00FF41", color: "#00FF41" }}>
            [ START_BUILDING ] <ArrowUpRight size={14} />
          </Link>
          <Link href="/campus" className="inline-flex items-center gap-2 font-mono text-sm px-6 py-3 border transition-all duration-200"
            style={{ borderColor: "#00FFFF", color: "#00FFFF" }}>
            [ ENTER_CAMPUS ] <ArrowUpRight size={14} />
          </Link>
        </motion.div>
      </div>
    </main>
  );
}
