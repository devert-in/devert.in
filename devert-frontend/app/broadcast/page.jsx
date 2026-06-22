"use client";

import { motion } from "framer-motion";
import { Tv2, Play, Clock, Calendar, Users, Radio } from "lucide-react";

const EPISODES = [
  { ep: "E12", title: "Building a Rate Limiter from Scratch",        duration: "1h 24m", views: "2.4k", date: "Jun 18", live: false, tag: "Backend"     },
  { ep: "E11", title: "System Design: Design Twitter at Scale",       duration: "58m",    views: "3.1k", date: "Jun 11", live: false, tag: "System Design"},
  { ep: "E10", title: "Live Hackathon Prep — NULLCLASS 2026",        duration: "2h 10m", views: "5.8k", date: "Jun 4",  live: false, tag: "Hackathon"    },
  { ep: "E09", title: "Rust for Java Devs — Zero to WebAssembly",    duration: "1h 45m", views: "1.9k", date: "May 28",live: false, tag: "Rust"         },
  { ep: "E08", title: "From 0 to Deployed: Full Stack in 4 Hours",   duration: "4h 02m", views: "7.2k", date: "May 21",live: false, tag: "Build"        },
  { ep: "E07", title: "DSA Patterns That Actually Matter (2026)",    duration: "1h 18m", views: "4.5k", date: "May 14",live: false, tag: "DSA"          },
];

const UPCOMING = [
  { title: "Live Grind: 3-Hour DSA Sprint",                           date: "Jun 25, 8PM IST", registered: 142 },
  { title: "Firebase → Supabase Migration Live",                      date: "Jun 28, 6PM IST", registered: 89  },
  { title: "Mock System Design Interview — Live Review",              date: "Jul 2, 7PM IST",  registered: 210 },
];

export default function BroadcastPage() {
  return (
    <main className="min-h-screen pt-10 pb-32 px-6 relative">
      <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none" />

      <div className="relative max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <p className="font-mono text-xs text-neon-green/55 mb-3 tracking-wider">// /broadcast — devcast.live</p>
          <h1 className="font-sans font-bold tracking-tighter text-white leading-none mb-3" style={{ fontSize: "clamp(2.5rem,7vw,5rem)" }}>
            BROADCAST <span className="text-neon-cyan">CENTER</span>
          </h1>
          <p className="font-mono text-sm text-white/35">Live code. Raw takes. No tutorials.</p>
        </motion.div>

        {/* Featured / Live Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="terminal-window mb-8 overflow-hidden"
        >
          <div className="terminal-header">
            <div className="terminal-dot bg-red-500/70" />
            <div className="terminal-dot bg-yellow-500/70" />
            <div className="terminal-dot bg-green-500/70" />
            <span className="font-mono text-[10px] text-white/25 ml-2">CHANNEL 01 — DEVERT_LIVE</span>
            <div className="ml-auto flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
              </span>
              <span className="font-mono text-[10px] text-red-400">OFFLINE</span>
            </div>
          </div>
          <div className="aspect-video relative flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, rgba(0,255,255,0.03) 0%, rgba(0,255,65,0.02) 100%)" }}
          >
            <div className="absolute inset-0 grid-bg opacity-20" />
            <div className="text-center z-10">
              <Tv2 size={48} className="text-white/10 mx-auto mb-4" />
              <p className="font-mono text-sm text-white/28 mb-2">Next broadcast in</p>
              <p className="font-mono text-2xl font-bold text-white/50">Jun 25 @ 8PM IST</p>
              <motion.button
                whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(0,255,65,0.2)" }}
                whileTap={{ scale: 0.98 }}
                className="mt-6 font-mono text-sm text-black bg-neon-green px-8 py-3 transition-all"
              >
                [ SET_REMINDER ]
              </motion.button>
            </div>
            {/* Scanline overlay */}
            <div className="absolute inset-0 scanlines opacity-40 pointer-events-none" />
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Past episodes */}
          <div className="lg:col-span-2">
            <p className="font-mono text-xs text-white/25 mb-4 tracking-wider">// past_broadcasts</p>
            <div className="terminal-window">
              <div className="terminal-header">
                <div className="terminal-dot bg-red-500/70" />
                <div className="terminal-dot bg-yellow-500/70" />
                <div className="terminal-dot bg-green-500/70" />
                <span className="font-mono text-[10px] text-white/25 ml-2">episodes.archive</span>
              </div>
              <div className="divide-y divide-white/4">
                {EPISODES.map((ep, i) => (
                  <motion.div
                    key={ep.ep}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.07 }}
                    whileHover={{ background: "rgba(255,255,255,0.015)" }}
                    className="flex items-center gap-4 p-4 cursor-pointer group transition-colors"
                  >
                    <div className="w-10 h-10 flex items-center justify-center rounded-lg flex-shrink-0 transition-colors group-hover:border-neon-cyan/30"
                      style={{ background: "rgba(0,255,255,0.05)", border: "1px solid rgba(0,255,255,0.1)" }}
                    >
                      <Play size={14} style={{ color: "#00FFFF" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-sans text-sm font-medium text-white/75 group-hover:text-white transition-colors truncate">{ep.title}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="font-mono text-[9px] text-white/25">{ep.ep}</span>
                        <span className="font-mono text-[9px] text-white/25">{ep.date}</span>
                        <span className="font-mono text-[9px] text-white/25 flex items-center gap-0.5"><Clock size={8} /> {ep.duration}</span>
                        <span className="font-mono text-[9px] text-neon-green/50">{ep.views} views</span>
                      </div>
                    </div>
                    <span className="font-mono text-[9px] px-1.5 py-0.5 rounded border border-white/8 text-white/28 flex-shrink-0">{ep.tag}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Upcoming */}
          <div>
            <p className="font-mono text-xs text-white/25 mb-4 tracking-wider">// upcoming_streams</p>
            <div className="terminal-window">
              <div className="terminal-header">
                <div className="terminal-dot bg-red-500/70" />
                <div className="terminal-dot bg-yellow-500/70" />
                <div className="terminal-dot bg-green-500/70" />
                <Calendar size={10} className="ml-2 text-white/25" />
                <span className="font-mono text-[10px] text-white/25 ml-1">schedule.json</span>
              </div>
              <div className="p-4 space-y-4">
                {UPCOMING.map((u, i) => (
                  <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 + i * 0.08 }}
                    className="border border-white/6 rounded-lg p-4"
                  >
                    <p className="font-sans text-sm font-medium text-white/75 mb-2 leading-snug">{u.title}</p>
                    <div className="flex items-center gap-1.5 font-mono text-[10px] text-neon-cyan/70 mb-1">
                      <Radio size={9} /> {u.date}
                    </div>
                    <div className="flex items-center gap-1.5 font-mono text-[10px] text-white/28">
                      <Users size={9} /> {u.registered} registered
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      className="w-full mt-3 font-mono text-[11px] text-neon-green border border-neon-green/25 py-2 hover:bg-neon-green/5 transition-all"
                    >
                      [ REGISTER ]
                    </motion.button>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
