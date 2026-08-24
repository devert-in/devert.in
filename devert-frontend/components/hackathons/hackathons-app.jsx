"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Flame, Calendar, Users, Trophy, ChevronRight, Clock, MapPin, Globe } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { useIsWindowed } from "@/components/window/is-windowed";
import { HackathonDetailView } from "@/components/hackathons/hackathon-detail-view";
import { isHackathon, registrationPhase, teamSizeLabel, formatEventDate } from "@/lib/eventTypes";

const MODE_META = {
  in_person: { label: "In Person", Icon: MapPin },
  virtual: { label: "Virtual", Icon: Globe },
  hybrid: { label: "Hybrid", Icon: Users },
};

function Pill({ icon: Icon, children, color }) {
  return (
    <span className="font-mono text-[9px] px-2 py-0.5 rounded flex items-center gap-1"
      style={color
        ? { color, background: `${color}12`, border: `1px solid ${color}40` }
        : { color: "rgba(255,255,255,0.3)", border: "1px solid rgba(255,255,255,0.08)" }}>
      {Icon && <Icon size={9} />} {children}
    </span>
  );
}

/* ─── helpers ─── */
function statusMeta(status) {
  switch (status) {
    case "active":   return { label: "LIVE",     color: "#00FF41", pulse: true  };
    case "judging":  return { label: "JUDGING",  color: "#FF9500", pulse: false };
    case "ended":    return { label: "ENDED",    color: "#555555", pulse: false };
    default:         return { label: "UPCOMING", color: "#00FFFF", pulse: false };
  }
}

// Headline prize figure: prefers the event's own prizePool string (set for
// events like DeVert-A-thon'26 that lead with one total figure) and falls back to
// the existing 1st-place breakdown for hackathons that only fill in `prizes`.
function topPrizeLabel(h) {
  if (h.prizePool) return h.prizePool;
  return isHackathon(h) ? h.prizes?.[0]?.reward || null : null;
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
          <p className="font-mono text-xs text-neon-green/55 mb-3 tracking-wider">// events.log</p>
          <h1 className="font-sans font-bold tracking-tighter text-white leading-none"
            style={{ fontSize: "clamp(1.75rem,4vw,2.75rem)" }}>
            EV<span className="text-neon-cyan">ENTS</span>
          </h1>
          <p className="font-mono text-xs text-white/30 mt-3 max-w-lg">
            Hackathons, workshops, meetups, open mics and tech talks. Build something real,
            learn from other builders, or just show up.
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
            <p className="font-mono text-sm text-white/22">No events yet</p>
            <p className="font-mono text-[10px] text-white/12 mt-1">// first one is brewing - stay tuned</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2">
            {visible.map((h, i) => {
              const sm  = statusMeta(h.status);
              const tl  = timeLabel(h);
              return (
                <motion.div key={h.id}
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i }}
                >
                  <button
                    onClick={() => {
                      // Only the windowed (dock-launched) instance gets the
                      // in-place swap - see this file's own comment above
                      // selectedSlug. On the two standalone routes that
                      // mount this component (/events, /hackathons),
                      // windowed is always false, so this now does a real
                      // navigation to the same /h/{slug} URL the card's own
                      // "share" button already treats as canonical - fixes
                      // the address bar never updating, and gets back/
                      // forward/refresh for free as a side effect.
                      if (windowed) { setSelectedSlug(h.slug || h.id); return; }
                      window.location.href = `/h/${h.slug || h.id}`;
                    }}
                    className="block w-full text-left group">
                    <div className="terminal-window h-full flex flex-col transition-all duration-200 group-hover:border-white/15"
                      style={{ borderColor: "rgba(255,255,255,0.07)" }}>
                      {/* Banner image (optional - falls back to the plain accent bar every card has always had) */}
                      {h.bannerImage ? (
                        <div className="relative w-full aspect-[16/9] overflow-hidden flex-shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={h.bannerImage} alt="" className="w-full h-full object-cover" />
                          <div className="absolute inset-x-0 bottom-0 h-0.5"
                            style={{ background: `linear-gradient(90deg, ${h.accentColor || "#00FF41"}, transparent)` }} />
                        </div>
                      ) : (
                        <div className="h-0.5 w-full rounded-t flex-shrink-0"
                          style={{ background: `linear-gradient(90deg, ${h.accentColor || "#00FF41"}, transparent)` }} />
                      )}

                      <div className="p-5 flex flex-col flex-1">
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

                        {/* Mode / pricing / team-size pills */}
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {h.eventDateLabel && <Pill icon={Calendar} color={h.accentColor || "#00FF41"}>{h.eventDateLabel}</Pill>}
                          {h.mode && MODE_META[h.mode] && (
                            <Pill icon={MODE_META[h.mode].Icon}>{MODE_META[h.mode].label}</Pill>
                          )}
                          <Pill>{h.registrationFee || "Free"}</Pill>
                          {(h.minTeamSize || h.maxTeamSize) && (
                            <Pill icon={Users}>{teamSizeLabel(h)}</Pill>
                          )}
                        </div>

                        {/* Registration deadline (only when the event has actually set one) */}
                        {formatEventDate(h.registrationCloseAt) && (
                          <p className="flex items-center gap-1.5 mb-3 font-mono text-[10px] text-white/35">
                            <Calendar size={10} className="text-white/25 flex-shrink-0" />
                            Registrations end {formatEventDate(h.registrationCloseAt)}
                          </p>
                        )}

                        {/* Theme tag */}
                        {h.theme && (
                          <span className="inline-block font-mono text-[9px] text-white/25 border border-white/8 px-2 py-0.5 rounded mb-4 self-start">
                            # {h.theme}
                          </span>
                        )}

                        {/* Top prize (headline prizePool, falling back to 1st place) or host (non-hackathon events) */}
                        <div className="mt-auto pt-3 border-t border-white/5 mb-3">
                          {topPrizeLabel(h) ? (
                            <div className="flex items-center gap-1.5 min-w-0">
                              <Trophy size={10} className="flex-shrink-0" style={{ color: "#FFD700" }} />
                              <span className="font-mono text-[10px] text-white/45 truncate">{topPrizeLabel(h)}</span>
                            </div>
                          ) : h.host ? (
                            <div className="flex items-center gap-1.5 min-w-0">
                              <Users size={10} className="text-white/25 flex-shrink-0" />
                              <span className="font-mono text-[10px] text-white/45 truncate">{h.host}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <Users size={10} className="text-white/25" />
                              <span className="font-mono text-[10px] text-white/30">{h.registrationCount ?? 0} registered</span>
                            </div>
                          )}
                        </div>

                        {/* Primary CTA - full-width, always present. External form when configured and open; otherwise this card's own "view details" affordance, which is what every click already does. */}
                        {h.registrationFormUrl ? (
                          registrationPhase(h) === "open" ? (
                            <a href={h.registrationFormUrl} target="_blank" rel="noopener noreferrer"
                              onClick={e => e.stopPropagation()}
                              className="w-full font-mono text-xs font-semibold py-2.5 rounded flex items-center justify-center gap-1.5 transition-transform hover:scale-[1.02]"
                              style={{ color: "#000", background: h.accentColor || "#00FF41" }}
                            >
                              Register Now <ChevronRight size={12} />
                            </a>
                          ) : (
                            <div className="w-full font-mono text-xs py-2.5 rounded flex items-center justify-center gap-1.5 text-white/25 border border-white/10">
                              {registrationPhase(h) === "upcoming" ? "Registration Opens Soon" : "Registrations Closed"}
                            </div>
                          )
                        ) : (
                          <div className="w-full font-mono text-xs py-2.5 rounded flex items-center justify-center gap-1.5 text-white/40 border border-white/12 group-hover:border-neon-cyan/40 group-hover:text-neon-cyan transition-colors">
                            View Details <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-all" />
                          </div>
                        )}
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
