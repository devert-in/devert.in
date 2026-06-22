"use client";

import { motion } from "framer-motion";
import { Radio, TrendingUp, Briefcase, Zap, ExternalLink, Star } from "lucide-react";

const TICKER_ITEMS = [
  "RUST SURPASSES GO IN BACKEND ADOPTION — 2026 Survey",
  "OPENAI DROPS GPT-5 API — 10x cheaper inference",
  "REACT 20 RELEASED — zero-bundle by default",
  "GOOGLE ACQUIRES VERCEL — next.js future uncertain",
  "INDIA OVERTAKES US IN OSS CONTRIBUTIONS — GitHub Report",
  "DOCKER DESKTOP FREE TIER REMOVED — community outrage",
  "DENO 3.0 SHIPS — full Node.js compat finally",
];

const TRENDING_REPOS = [
  { name: "devert-in/devos",       stars: "2.1k", lang: "TypeScript", delta: "+340 today", hot: true  },
  { name: "rust-lang/cargo",       stars: "12.4k",lang: "Rust",       delta: "+180 today", hot: false },
  { name: "vercel/ai",             stars: "8.9k", lang: "TypeScript", delta: "+290 today", hot: true  },
  { name: "supabase/supabase",     stars: "67k",  lang: "TypeScript", delta: "+120 today", hot: false },
  { name: "trpc/trpc",             stars: "34k",  lang: "TypeScript", delta: "+95 today",  hot: false },
  { name: "hono/hono",             stars: "18k",  lang: "TypeScript", delta: "+210 today", hot: true  },
];

const JOBS = [
  { company: "Razorpay",   role: "SDE-2 Backend",     stack: ["Go","Kafka"],      type: "Full-time", ctc: "40-60 LPA", hot: true  },
  { company: "CRED",       role: "Senior SWE",         stack: ["Kotlin","K8s"],    type: "Full-time", ctc: "35-55 LPA", hot: true  },
  { company: "Zerodha",    role: "Platform Engineer",  stack: ["Python","Redis"],  type: "Full-time", ctc: "25-40 LPA", hot: false },
  { company: "Meesho",     role: "SDE-1 Fullstack",    stack: ["React","Node.js"], type: "Full-time", ctc: "18-28 LPA", hot: false },
  { company: "Groww",      role: "Backend Intern",     stack: ["Java","Spring"],   type: "Internship",ctc: "₹80k/mo",   hot: true  },
];

const NEWS = [
  { title: "Why Your Microservices Are Actually Making Things Worse",        signal: "HIGH", source: "martinfowler.com",  tag: "Architecture" },
  { title: "The State of WebAssembly 2026 — It's Finally Mainstream",        signal: "HIGH", source: "webassembly.org",   tag: "WASM"          },
  { title: "10 VS Code Extensions That Actually Matter",                      signal: "LOW",  source: "medium.com",        tag: "Tooling"       },
  { title: "How Zerodha Handles 1M Concurrent Users on ₹0 Cloud Spend",     signal: "HIGH", source: "zerodha.tech",      tag: "Scale"         },
  { title: "AI Pair Programming After 1 Year — An Honest Review",            signal: "MED",  source: "vercel.com/blog",   tag: "AI"            },
];

function Ticker() {
  return (
    <div className="overflow-hidden border-b border-white/5 bg-white/2 relative" style={{ height: 36 }}>
      <div className="absolute left-0 top-0 bottom-0 w-20 z-10 pointer-events-none"
        style={{ background: "linear-gradient(to right, #050505, transparent)" }} />
      <div className="absolute right-0 top-0 bottom-0 w-20 z-10 pointer-events-none"
        style={{ background: "linear-gradient(to left, #050505, transparent)" }} />
      <motion.div
        animate={{ x: [0, -2400] }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        className="flex items-center gap-8 h-full whitespace-nowrap font-mono text-[11px] text-white/45 px-4"
      >
        {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
          <span key={i} className="flex items-center gap-2">
            <span style={{ color: "#00FFFF" }}>▶</span> {item}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

export default function IntelPage() {
  return (
    <main className="min-h-screen pt-10 pb-32 relative">
      <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none" />

      {/* Bloomberg ticker */}
      <Ticker />

      <div className="relative max-w-6xl mx-auto px-6 pt-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <p className="font-mono text-xs text-neon-green/55 mb-3 tracking-wider">// /intel — dev_intelligence.feed</p>
          <h1 className="font-sans font-bold tracking-tighter text-white leading-none mb-3" style={{ fontSize: "clamp(2.5rem,7vw,5rem)" }}>
            INTEL <span className="text-neon-cyan">FEED</span>
          </h1>
          <p className="font-mono text-sm text-white/35">Signal over noise. Curated by The Duo.</p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Trending repos */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="terminal-window h-full">
              <div className="terminal-header">
                <div className="terminal-dot bg-red-500/70" />
                <div className="terminal-dot bg-yellow-500/70" />
                <div className="terminal-dot bg-green-500/70" />
                <TrendingUp size={10} className="ml-2 text-white/25" />
                <span className="font-mono text-[10px] text-white/25 ml-1">trending.repos</span>
              </div>
              <div className="p-4 space-y-3">
                {TRENDING_REPOS.map((r, i) => (
                  <motion.div key={r.name} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 + i * 0.06 }}
                    className="flex items-start gap-3 py-2 border-b border-white/4 last:border-0 group cursor-pointer"
                  >
                    <Star size={11} style={{ color: r.hot ? "#FF9500" : "rgba(255,255,255,0.2)", marginTop: 2 }} />
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-xs text-white/70 group-hover:text-neon-cyan transition-colors truncate">{r.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-[9px] text-white/28">{r.lang}</span>
                        <span className="font-mono text-[9px] text-white/25">·</span>
                        <span className="font-mono text-[9px]" style={{ color: "#00FF41" }}>{r.delta}</span>
                      </div>
                    </div>
                    <span className="font-mono text-[10px] text-white/35 flex items-center gap-0.5">★ {r.stars}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* News feed */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="terminal-window h-full">
              <div className="terminal-header">
                <div className="terminal-dot bg-red-500/70" />
                <div className="terminal-dot bg-yellow-500/70" />
                <div className="terminal-dot bg-green-500/70" />
                <Radio size={10} className="ml-2 text-white/25" />
                <span className="font-mono text-[10px] text-white/25 ml-1">signal_vs_noise.db</span>
              </div>
              <div className="p-4 space-y-3">
                {NEWS.map((n, i) => (
                  <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 + i * 0.06 }}
                    className="py-2 border-b border-white/4 last:border-0 cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="font-mono text-[9px] px-1.5 py-0.5 rounded"
                        style={{
                          color: n.signal === "HIGH" ? "#00FF41" : n.signal === "MED" ? "#FF9500" : "rgba(255,255,255,0.3)",
                          background: n.signal === "HIGH" ? "rgba(0,255,65,0.08)" : n.signal === "MED" ? "rgba(255,149,0,0.08)" : "rgba(255,255,255,0.04)",
                        }}>
                        {n.signal} SIGNAL
                      </span>
                      <span className="font-mono text-[9px] text-white/25 border border-white/8 px-1.5 py-0.5 rounded">{n.tag}</span>
                    </div>
                    <p className="font-mono text-xs text-white/60 group-hover:text-white/85 transition-colors leading-snug mb-1">{n.title}</p>
                    <p className="font-mono text-[9px] text-white/22">{n.source}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Jobs */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <div className="terminal-window h-full">
              <div className="terminal-header">
                <div className="terminal-dot bg-red-500/70" />
                <div className="terminal-dot bg-yellow-500/70" />
                <div className="terminal-dot bg-green-500/70" />
                <Briefcase size={10} className="ml-2 text-white/25" />
                <span className="font-mono text-[10px] text-white/25 ml-1">opportunities.json</span>
              </div>
              <div className="p-4 space-y-3">
                {JOBS.map((j, i) => (
                  <motion.div key={j.company + j.role} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 + i * 0.06 }}
                    className="py-2 border-b border-white/4 last:border-0 group cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="font-sans text-sm font-semibold text-white group-hover:text-neon-cyan transition-colors">{j.company}</span>
                      {j.hot && <Zap size={11} style={{ color: "#FF9500", flexShrink: 0, marginTop: 2 }} />}
                    </div>
                    <p className="font-mono text-xs text-white/45 mb-1.5">{j.role}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1">
                        {j.stack.map(s => (
                          <span key={s} className="font-mono text-[9px] text-white/25 border border-white/8 px-1.5 py-0.5 rounded">{s}</span>
                        ))}
                      </div>
                      <span className="font-mono text-[10px]" style={{ color: "#00FF41" }}>{j.ctc}</span>
                    </div>
                  </motion.div>
                ))}
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  className="w-full font-mono text-xs text-white/30 border border-white/8 py-2 mt-1 hover:border-neon-cyan/25 hover:text-neon-cyan transition-all"
                >
                  view all openings <ExternalLink size={10} className="inline ml-1" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </main>
  );
}
