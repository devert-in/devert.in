"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Flame, Calendar, Users, Trophy, ChevronRight, Clock, ExternalLink } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { useIsWindowed } from "@/components/window/is-windowed";
import { HackathonDetailView } from "@/components/hackathons/hackathon-detail-view";

/* ─── helpers ─── */
function statusMeta(status) {
  switch (status) {
    case "active":   return { label: "LIVE",     color: "#00FF41", pulse: true  };
    case "judging":  return { label: "JUDGING",  color: "#FF9500", pulse: false };
    case "ended":    return { label: "ENDED",    color: "#555555", pulse: false };
    default:         return { label: "UPCOMING", color: "#00FFFF", pulse: false };
  }
}

function timeLabel(hackathon) {
  const now = Date.now();
  if (!hackathon.submissionDeadline) return null;
  const deadline = hackathon.submissionDeadline?.toDate?.()?.getTime?.() ?? hackathon.submissionDeadline;
  const start    = hackathon.registrationOpen?.toDate?.()?.getTime?.()    ?? hackathon.registrationOpen;

  if (hackathon.status === "ended"   || hackathon.status === "judging") return null;
  if (hackathon.status === "active") {
    const diff = deadline - now;
    if (diff <= 0) return "Submissions closed";
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    return d > 0 ? `${d}d ${h}h left` : `${h}h left`;
  }
  if (start && start > now) {
    const diff = start - now;
    const d = Math.floor(diff / 86400000);
    return d > 0 ? `Starts in ${d}d` : "Starting soon";
  }
  return null;
}

const FILTERS = ["all", "active", "upcoming", "judging", "ended"];

export function HackathonsApp() {
  const windowed = useIsWindowed();
  const [hackathons, setHackathons] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [filter,     setFilter]     = useState("all");
  // Opening a hackathon is an in-place view, not a route change - clicking a
  // card while this app is an open window tab must never navigate the tab
  // out from under itself (the standalone /h/{slug} route stays real, for
  // public sharing - see hackathon-detail-view.jsx).
  const [selectedSlug, setSelectedSlug] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(query(collection(db, "hackathons"), orderBy("createdAt", "desc")));
        setHackathons(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch { setHackathons([]); }
      setLoading(false);
    })();
  }, []);

  const visible = filter === "all" ? hackathons : hackathons.filter(h => h.status === filter);

  if (selectedSlug) {
    return <HackathonDetailView slug={selectedSlug} onBack={() => setSelectedSlug(null)} />;
  }

  return (
    <main className={`${windowed ? "min-h-full" : "min-h-screen"} pt-10 pb-32 px-6 relative`}>
      <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none" />
      <div className="relative max-w-5xl mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <p className="font-mono text-xs text-neon-green/55 mb-3 tracking-wider">// hackathons.log</p>
          <h1 className="font-sans font-bold tracking-tighter text-white leading-none"
            style={{ fontSize: "clamp(2rem,5vw,4rem)" }}>
            HACK<span className="text-neon-cyan">ATHONS</span>
          </h1>
          <p className="font-mono text-xs text-white/30 mt-3 max-w-lg">
            Build something real. Ship under pressure. Win XP, credits, and bragging rights.
          </p>
        </motion.div>

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap mb-8">
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="font-mono text-[10px] tracking-widest px-3 py-1.5 rounded transition-all"
              style={filter === f
                ? { color: "#00FFFF", borderBottom: "1px solid #00FFFF", background: "rgba(0,255,255,0.06)" }
                : { color: "rgba(255,255,255,0.25)", border: "1px solid rgba(255,255,255,0.08)" }
              }
            >
              {f.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-6 h-6 border border-white/10 border-t-neon-cyan rounded-full animate-spin" />
          </div>
        ) : visible.length === 0 ? (
          <div className="text-center py-20">
            <Flame size={28} className="mx-auto mb-4 text-white/10" />
            <p className="font-mono text-sm text-white/22">No hackathons yet</p>
            <p className="font-mono text-[10px] text-white/12 mt-1">// first one is brewing - stay tuned</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2">
            {visible.map((h, i) => {
              const sm  = statusMeta(h.status);
              const tl  = timeLabel(h);
              const top = h.prizes?.[0];
              return (
                <motion.div key={h.id}
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i }}
                >
                  <button onClick={() => setSelectedSlug(h.slug || h.id)} className="block w-full text-left group">
                    <div className="terminal-window h-full transition-all duration-200 group-hover:border-white/15"
                      style={{ borderColor: "rgba(255,255,255,0.07)" }}>
                      {/* Color accent bar */}
                      <div className="h-0.5 w-full rounded-t"
                        style={{ background: `linear-gradient(90deg, ${h.accentColor || "#00FF41"}, transparent)` }} />

                      <div className="p-5 flex flex-col h-full">
                        {/* Status + time */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-1.5">
                            {sm.pulse && <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: sm.color }} />}
                            <span className="font-mono text-[10px] tracking-widest px-2 py-0.5 rounded"
                              style={{ color: sm.color, background: `${sm.color}15`, border: `1px solid ${sm.color}25` }}>
                              {sm.label}
                            </span>
                          </div>
                          {tl && (
                            <span className="flex items-center gap-1 font-mono text-[10px] text-white/28">
                              <Clock size={9} /> {tl}
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h2 className="font-sans text-lg font-bold text-white leading-tight mb-1 group-hover:text-neon-cyan transition-colors">
                          {h.title}
                        </h2>
                        <p className="font-mono text-[11px] text-white/35 mb-3 leading-relaxed line-clamp-2">
                          {h.tagline}
                        </p>

                        {/* Theme tag */}
                        {h.theme && (
                          <span className="inline-block font-mono text-[9px] text-white/25 border border-white/8 px-2 py-0.5 rounded mb-4 self-start">
                            # {h.theme}
                          </span>
                        )}

                        <div className="mt-auto pt-3 border-t border-white/5 flex items-center justify-between">
                          {/* Top prize */}
                          {top && (
                            <div className="flex items-center gap-1.5">
                              <Trophy size={10} style={{ color: "#FFD700" }} />
                              <span className="font-mono text-[10px] text-white/45">{top.reward}</span>
                            </div>
                          )}
                          {/* Reg count */}
                          <div className="flex items-center gap-1.5 ml-auto">
                            <Users size={10} className="text-white/25" />
                            <span className="font-mono text-[10px] text-white/30">{h.registrationCount ?? 0}</span>
                            <ChevronRight size={12} className="text-white/15 group-hover:text-neon-cyan group-hover:translate-x-0.5 transition-all" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
