"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Terminal, Code, Cpu, Zap, Lock, Flame, Clock, CheckCircle } from "lucide-react";

const CHALLENGES = [
  {
    type: "DSA",
    typeColor: "#00FFFF",
    icon: Code,
    title: "Binary Tree Maximum Path Sum",
    description: "Find the maximum path sum in a binary tree where the path doesn't need to pass through the root.",
    difficulty: "HARD",
    diffColor: "#FF3B3B",
    diffBg: "rgba(255,59,59,0.08)",
    time: "30 min",
    tags: ["Trees","DFS","Dynamic Programming"],
    locked: false,
    xp: 150,
  },
  {
    type: "SYSTEM_DESIGN",
    typeColor: "#FF9500",
    icon: Cpu,
    title: "Design a Distributed Rate Limiter",
    description: "Design a rate limiter supporting 100k RPS across multiple data centers with <1ms overhead.",
    difficulty: "MEDIUM",
    diffColor: "#FF9500",
    diffBg: "rgba(255,149,0,0.08)",
    time: "45 min",
    tags: ["Architecture","Redis","Distributed"],
    locked: true,
    xp: 200,
  },
  {
    type: "BUILD",
    typeColor: "#00FF41",
    icon: Zap,
    title: "Ship a REST API in 2 Hours",
    description: "Build and deploy a fully documented REST API with auth, rate limiting, and 99% uptime.",
    difficulty: "OPEN",
    diffColor: "#00FF41",
    diffBg: "rgba(0,255,65,0.06)",
    time: "2 hrs",
    tags: ["Backend","Ship","Any Stack"],
    locked: true,
    xp: 250,
  },
];

function Countdown() {
  const [time, setTime] = useState({ h: 0, m: 0, s: 0 });

  useEffect(() => {
    const update = () => {
      const now = new Date();
      // IST = UTC+5:30
      const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
      // Shift now into IST coordinate space
      const nowIST = new Date(now.getTime() + IST_OFFSET_MS);
      // Next midnight in IST coordinate space
      const midnightIST = new Date(nowIST);
      midnightIST.setUTCHours(24, 0, 0, 0);
      // Shift back to real UTC moment
      const midnightUTC = new Date(midnightIST.getTime() - IST_OFFSET_MS);
      const diff = Math.max(0, Math.floor((midnightUTC - now) / 1000));
      setTime({
        h: Math.floor(diff / 3600),
        m: Math.floor((diff % 3600) / 60),
        s: diff % 60,
      });
    };
    update();
    const iv = setInterval(update, 1000);
    return () => clearInterval(iv);
  }, []);

  const pad = n => String(n).padStart(2, "0");

  return (
    <div className="flex items-center gap-1 font-mono text-sm">
      <Clock size={12} className="text-neon-cyan/60" />
      <span className="text-neon-cyan">{pad(time.h)}</span>
      <span className="text-white/30">:</span>
      <span className="text-neon-cyan">{pad(time.m)}</span>
      <span className="text-white/30">:</span>
      <span className="text-neon-cyan">{pad(time.s)}</span>
      <span className="text-white/30 text-[10px] ml-1">until reset IST</span>
    </div>
  );
}

export default function GrindPage() {
  const [streak] = useState(7);

  return (
    <main className="min-h-screen pt-10 pb-32 px-6 relative">
      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />

      <div className="relative max-w-6xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <p className="font-mono text-xs text-neon-green/55 mb-3 tracking-wider">// /grind — daily_challenges.sh</p>
          <h1 className="font-sans font-bold tracking-tighter text-white leading-none mb-3" style={{ fontSize: "clamp(2.5rem,7vw,5rem)" }}>
            DAILY <span className="text-neon-cyan">GRIND</span>
          </h1>
          <div className="flex items-center gap-6 flex-wrap">
            <p className="font-mono text-sm text-white/35">3 challenges. Resets at midnight IST.</p>
            <Countdown />
          </div>
        </motion.div>

        {/* Streak card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          className="terminal-window p-5 mb-10 flex items-center gap-4"
        >
          <div className="flex items-center gap-2">
            <Flame size={24} style={{ color: "#FF6430" }} />
            <span className="font-sans text-3xl font-bold text-white">{streak}</span>
          </div>
          <div>
            <p className="font-mono text-xs text-white/30 mb-0.5 tracking-wider">CURRENT_STREAK</p>
            <p className="font-mono text-sm text-white/55">Keep going. Don&apos;t break the chain.</p>
          </div>
          <div className="ml-auto flex gap-1">
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className="w-4 h-4 rounded-sm"
                style={{
                  background: i < streak ? "#FF6430" : "rgba(255,255,255,0.06)",
                  boxShadow: i < streak ? "0 0 6px rgba(255,100,48,0.4)" : "none",
                }}
              />
            ))}
          </div>
        </motion.div>

        {/* Challenge cards */}
        <div className="grid md:grid-cols-3 gap-5 mb-10">
          {CHALLENGES.map((ch, i) => {
            const Icon = ch.icon;
            return (
              <motion.div
                key={ch.type}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1, type: "spring", stiffness: 200, damping: 22 }}
                whileHover={!ch.locked ? { y: -4, borderColor: "rgba(0,255,255,0.22)" } : {}}
                className="terminal-window transition-colors"
              >
                <div className="terminal-header">
                  <div className="terminal-dot bg-red-500/70" />
                  <div className="terminal-dot bg-yellow-500/70" />
                  <div className="terminal-dot bg-green-500/70" />
                  <Terminal size={10} className="ml-2 text-white/25" />
                  <span className="font-mono text-[10px] text-white/25 ml-1">{ch.type.toLowerCase()}.sh</span>
                  {ch.locked && <Lock size={10} className="ml-auto text-white/20" />}
                </div>

                <div className="p-5 relative">
                  {ch.locked && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-b-lg backdrop-blur-[2px]"
                      style={{ background: "rgba(5,5,5,0.72)" }}
                    >
                      <Lock size={20} className="text-white/22" />
                      <p className="font-mono text-xs text-white/32 text-center px-4">
                        Login to unlock this challenge
                      </p>
                      <a href="/login" className="font-mono text-xs text-neon-cyan border border-neon-cyan/30 px-4 py-2 hover:bg-neon-cyan/8 transition-colors">
                        [ LOGIN ]
                      </a>
                    </div>
                  )}

                  <div className="flex items-center gap-2 mb-3">
                    <Icon size={13} style={{ color: ch.typeColor }} />
                    <span className="font-mono text-[10px] tracking-wider" style={{ color: ch.typeColor }}>{ch.type}</span>
                    <span className="ml-auto font-mono text-[9px] px-1.5 py-0.5 rounded"
                      style={{ color: ch.diffColor, background: ch.diffBg }}>
                      {ch.difficulty}
                    </span>
                  </div>

                  <h3 className="font-sans text-sm font-semibold text-white mb-2 leading-snug">{ch.title}</h3>
                  <p className="font-mono text-[10px] text-white/32 mb-4 leading-relaxed">{ch.description}</p>

                  <div className="flex flex-wrap gap-1 mb-4">
                    {ch.tags.map(t => (
                      <span key={t} className="font-mono text-[9px] text-white/25 border border-white/8 px-1.5 py-0.5 rounded">{t}</span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-white/28 flex items-center gap-1"><Clock size={9} /> {ch.time}</span>
                    <span className="font-mono text-[10px]" style={{ color: "#00FF41" }}>+{ch.xp} XP</span>
                  </div>

                  {!ch.locked && (
                    <motion.button
                      whileHover={{ scale: 1.01, background: "rgba(0,255,255,0.08)" }}
                      whileTap={{ scale: 0.99 }}
                      className="w-full font-mono text-sm text-neon-cyan border border-neon-cyan/30 py-2.5 mt-4 transition-all"
                    >
                      $ ./solve.sh
                    </motion.button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Past challenges log */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <p className="font-mono text-xs text-white/25 mb-4 tracking-wider">// yesterday&apos;s log</p>
          <div className="terminal-window overflow-hidden">
            <div className="terminal-header">
              <div className="terminal-dot bg-red-500/70" />
              <div className="terminal-dot bg-yellow-500/70" />
              <div className="terminal-dot bg-green-500/70" />
              <span className="font-mono text-[10px] text-white/25 ml-2">grind.history</span>
            </div>
            <div className="p-4 space-y-2">
              {[
                { day: "yesterday", ch: "Two Sum variants",       status: "solved", xp: 100 },
                { day: "2 days ago", ch: "Design URL Shortener",  status: "solved", xp: 200 },
                { day: "3 days ago", ch: "Ship a CLI tool",       status: "skipped", xp: 0 },
              ].map((h, i) => (
                <div key={i} className="flex items-center gap-3 font-mono text-xs py-2 border-b border-white/4 last:border-0">
                  <CheckCircle size={12} style={{ color: h.status === "solved" ? "#00FF41" : "rgba(255,255,255,0.2)" }} />
                  <span className="text-white/28 flex-shrink-0">{h.day}</span>
                  <span className="text-white/55 flex-1 truncate">{h.ch}</span>
                  <span style={{ color: h.status === "solved" ? "#00FF41" : "rgba(255,255,255,0.2)" }}>
                    {h.status === "solved" ? `+${h.xp} XP` : "skipped"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
