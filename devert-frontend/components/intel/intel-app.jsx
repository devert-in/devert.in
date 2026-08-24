"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Radio, TrendingUp, Briefcase, Zap, Star } from "lucide-react";
import { db } from "@/lib/firebase";
import {
  collection, query, orderBy, limit, getDocs,
  doc, getDoc,
} from "firebase/firestore";
import { useIsWindowed } from "@/components/window/is-windowed";
// TEMPORARY: lib/roadmaps.js was rewritten into the new Firestore-backed
// Campus Roadmaps catalog (role/career-based, admin-authored, progress-
// tracked) - this old hardcoded array now lives at roadmaps.legacy-backup.js
// purely so this Intel tab keeps working until the migration lands (the new
// catalog is seeded from this same file via scripts/export-legacy-roadmaps.mjs)
// and this whole tab is retired in favor of /campus/roadmaps. Do not add new
// content here - see the project's Roadmaps build plan.
import { ROADMAPS, getRoadmap } from "@/lib/roadmaps.legacy-backup";
import { RoadmapGrid, RoadmapPath } from "@/components/intel/roadmap-path";
import { OpportunitiesTab } from "@/components/intel/opportunities";

const INTEL_TAB_META = {
  feed:          { breadcrumb: "dev_intelligence.feed", tagline: "Signal over noise. Curated by The Duo." },
  roadmaps:      { breadcrumb: "roadmaps.db",           tagline: "Original, DeVert-curated learning paths for the tracks builders actually ask about." },
  opportunities: { breadcrumb: "opportunities.db",      tagline: "Internships, certifications, hackathons and every other opportunity worth applying to." },
};

// ── Ticker ──────────────────────────────────────────────────────────────────────

function Ticker({ items }) {
  if (!items || items.length === 0) return null;
  const doubled = [...items, ...items];
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
        {doubled.map((item, i) => (
          <span key={i} className="flex items-center gap-2">
            <span style={{ color: "#00FFFF" }}>▶</span> {item}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

// ── app ──────────────────────────────────────────────────────────────────────────

export function IntelApp({ initialTab, initialOppId }) {
  const windowed = useIsWindowed();
  const [intelTab,  setIntelTab]  = useState(["feed", "roadmaps", "opportunities"].includes(initialTab) ? initialTab : "feed");
  const [activeRoadmapId, setActiveRoadmapId] = useState(null);
  const [ticker,    setTicker]    = useState([]);
  const [repos,     setRepos]     = useState([]);
  const [news,      setNews]      = useState([]);
  const [jobs,      setJobs]      = useState([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      getDoc(doc(db, "system", "intel")),
      getDocs(query(collection(db, "intel_news"), orderBy("createdAt", "desc"), limit(8))),
      getDocs(query(collection(db, "intel_jobs"), orderBy("createdAt", "desc"), limit(8))),
    ])
      .then(([sysSnap, newsSnap, jobsSnap]) => {
        if (sysSnap.exists()) {
          setTicker(sysSnap.data().ticker || []);
          setRepos(sysSnap.data().repos   || []);
        }
        setNews(newsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setJobs(jobsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className={`${windowed ? "min-h-full" : "min-h-screen"} pt-10 pb-32 relative`}>
      <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none" />

      <Ticker items={ticker} />

      <div className="relative max-w-6xl mx-auto px-6 pt-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <p className="font-mono text-xs text-neon-green/55 mb-3 tracking-wider">// /intel - {INTEL_TAB_META[intelTab].breadcrumb}</p>
          <h1 className="font-sans font-bold tracking-tighter text-white leading-none mb-3"
            style={{ fontSize: "clamp(2.5rem,7vw,5rem)" }}>
            INTEL <span className="text-neon-cyan">FEED</span>
          </h1>
          <p className="font-mono text-sm text-white/35">{INTEL_TAB_META[intelTab].tagline}</p>

          <div className="flex gap-2 mt-6">
            {[{ key: "feed", label: "Live Feed" }, { key: "roadmaps", label: "Roadmaps" }, { key: "opportunities", label: "Opportunities" }].map(t => (
              <button key={t.key} onClick={() => { setIntelTab(t.key); setActiveRoadmapId(null); }}
                className="font-mono text-xs px-4 py-2 rounded-lg transition-colors"
                style={{
                  color: intelTab === t.key ? "#00FFFF" : "rgba(255,255,255,0.35)",
                  background: intelTab === t.key ? "rgba(0,255,255,0.08)" : "rgba(255,255,255,0.03)",
                  border: intelTab === t.key ? "1px solid rgba(0,255,255,0.3)" : "1px solid rgba(255,255,255,0.06)",
                }}>
                {t.label}
              </button>
            ))}
          </div>
        </motion.div>

        {intelTab === "opportunities" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-14">
            <OpportunitiesTab initialOppId={initialOppId} />
          </motion.div>
        )}

        {intelTab === "roadmaps" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-14">
            {activeRoadmapId ? (
              <RoadmapPath roadmap={getRoadmap(activeRoadmapId)} onBack={() => setActiveRoadmapId(null)} />
            ) : (
              <RoadmapGrid roadmaps={ROADMAPS} onPick={setActiveRoadmapId} />
            )}
          </motion.div>
        )}

        {intelTab === "feed" && (
        <>
        {/* ── Live feed - 3 columns ── */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-14">

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
                {loading ? (
                  [1,2,3,4].map(i => (
                    <div key={i} className="flex items-start gap-3 py-2 border-b border-white/4 last:border-0 animate-pulse">
                      <div className="w-2.5 h-2.5 bg-white/5 rounded mt-0.5 flex-shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-2 bg-white/5 rounded w-3/4" />
                        <div className="h-2 bg-white/5 rounded w-1/2" />
                      </div>
                    </div>
                  ))
                ) : repos.length === 0 ? (
                  <p className="font-mono text-xs text-white/20 text-center py-4">no repos curated yet</p>
                ) : repos.map((r, i) => (
                  <motion.div key={r.name || i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 + i * 0.06 }}
                    onClick={() => r.url && window.open(r.url, "_blank", "noopener noreferrer")}
                    className="flex items-start gap-3 py-2 border-b border-white/4 last:border-0 group cursor-pointer">
                    <Star size={11} style={{ color: r.hot ? "#FF9500" : "rgba(255,255,255,0.2)", marginTop: 2 }} />
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-xs text-white/70 group-hover:text-neon-cyan transition-colors truncate">{r.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-[9px] text-white/28">{r.lang}</span>
                        <span className="font-mono text-[9px] text-white/25">·</span>
                        <span className="font-mono text-[9px]" style={{ color: "#00FF41" }}>{r.delta}</span>
                      </div>
                    </div>
                    <span className="font-mono text-[10px] text-white/35 flex items-center gap-1"><Star size={9} className="fill-current" /> {r.stars}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* News */}
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
                {loading ? (
                  [1,2,3].map(i => (
                    <div key={i} className="py-2 border-b border-white/4 last:border-0 animate-pulse space-y-2">
                      <div className="h-2 bg-white/5 rounded w-1/3" />
                      <div className="h-2 bg-white/5 rounded w-full" />
                      <div className="h-2 bg-white/5 rounded w-2/3" />
                    </div>
                  ))
                ) : news.length === 0 ? (
                  <p className="font-mono text-xs text-white/20 text-center py-4">no intel yet</p>
                ) : news.map((n, i) => (
                  <motion.div key={n.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 + i * 0.06 }}
                    onClick={() => n.url && window.open(n.url, "_blank", "noopener noreferrer")}
                    className="py-2 border-b border-white/4 last:border-0 cursor-pointer group">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="font-mono text-[9px] px-1.5 py-0.5 rounded"
                        style={{
                          color: n.signal === "HIGH" ? "#00FF41" : n.signal === "MED" ? "#FF9500" : "rgba(255,255,255,0.3)",
                          background: n.signal === "HIGH" ? "rgba(0,255,65,0.08)" : n.signal === "MED" ? "rgba(255,149,0,0.08)" : "rgba(255,255,255,0.04)",
                        }}>
                        {n.signal} SIGNAL
                      </span>
                      {n.tag && <span className="font-mono text-[9px] text-white/25 border border-white/8 px-1.5 py-0.5 rounded">{n.tag}</span>}
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
                {loading ? (
                  [1,2,3].map(i => (
                    <div key={i} className="py-2 border-b border-white/4 last:border-0 animate-pulse space-y-2">
                      <div className="h-3 bg-white/5 rounded w-1/2" />
                      <div className="h-2 bg-white/5 rounded w-2/3" />
                    </div>
                  ))
                ) : jobs.length === 0 ? (
                  <p className="font-mono text-xs text-white/20 text-center py-4">no openings yet</p>
                ) : jobs.map((j, i) => {
                  const stack = Array.isArray(j.stack) ? j.stack : (j.stack || "").split(",").map(s => s.trim()).filter(Boolean);
                  return (
                    <motion.div key={j.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 + i * 0.06 }}
                      onClick={() => j.url && window.open(j.url, "_blank", "noopener noreferrer")}
                      className="py-2 border-b border-white/4 last:border-0 group cursor-pointer">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="font-sans text-sm font-semibold text-white group-hover:text-neon-cyan transition-colors">{j.company}</span>
                        {j.hot && <Zap size={11} style={{ color: "#FF9500", flexShrink: 0, marginTop: 2 }} />}
                      </div>
                      <p className="font-mono text-xs text-white/45 mb-1.5">{j.role}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex gap-1 flex-wrap">
                          {stack.slice(0, 3).map(s => (
                            <span key={s} className="font-mono text-[9px] text-white/25 border border-white/8 px-1.5 py-0.5 rounded">{s}</span>
                          ))}
                        </div>
                        <span className="font-mono text-[10px]" style={{ color: "#00FF41" }}>{j.ctc}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>
        </>
        )}
      </div>
    </main>
  );
}
