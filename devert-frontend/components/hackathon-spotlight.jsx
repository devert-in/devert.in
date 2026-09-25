"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Flame, Trophy, MapPin, Users, ArrowUpRight } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { teamSizeLabel } from "@/lib/eventTypes";

// Same where+orderBy+limit shape live-on-devert.jsx already queries in
// production (no new composite index needed) - just a wider limit so an
// "active" event can be preferred client-side over a merely-newer
// "upcoming" one, since this banner spotlights exactly ONE event rather
// than that component's small list.
function useSpotlightHackathon() {
  const [hackathon, setHackathon] = useState(undefined); // undefined = loading, null = none to show
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDocs(query(
          collection(db, "hackathons"),
          where("status", "in", ["active", "upcoming"]),
          orderBy("createdAt", "desc"),
          limit(5),
        ));
        if (cancelled) return;
        const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setHackathon(docs.find(h => h.status === "active") || docs[0] || null);
      } catch {
        if (!cancelled) setHackathon(null);
      }
    })();
    return () => { cancelled = true; };
  }, []);
  return hackathon;
}

// The one prominent "don't miss this" banner on the HQ dashboard - deliberately
// singular (one event, full width) where live-on-devert.jsx's events list is
// deliberately plural and understated, so the platform always has exactly one
// loud spotlight and one quiet activity feed, never two competing loud ones.
export function HackathonSpotlight() {
  const hackathon = useSpotlightHackathon();
  if (!hackathon) return null;

  const isLive = hackathon.status === "active";
  const accent = hackathon.accentColor || "#00FF41";

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 }}
      className="mb-5 sm:flex-1 sm:min-w-0">   {/* no h-full - see devert100-spotlight */}
      <Link href={`/h/${hackathon.id}`} className="block group h-full">
        <div className="terminal-window overflow-hidden transition-colors duration-200 h-full flex flex-col"
          style={{ borderColor: `${accent}30` }}>
          <div className="terminal-header">
            <span className="font-mono text-[10px] text-white/25 ml-2">spotlight.event</span>
          </div>
          <div className="p-5 sm:p-6 relative overflow-hidden flex-1 flex flex-col">
            <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full blur-3xl opacity-20 pointer-events-none" style={{ background: accent }} />
            <div className="relative flex-1 min-w-0">
                <span className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-widest px-2 py-1 rounded mb-2.5"
                  style={{ color: accent, background: `${accent}15`, border: `1px solid ${accent}35` }}>
                  {isLive && <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: accent }} />}
                  <Flame size={11} /> {isLive ? "LIVE NOW" : "FEATURED EVENT"}
                </span>
                <h2 className="font-sans text-xl sm:text-2xl font-bold text-white mb-1 group-hover:text-white/90 transition-colors">
                  {hackathon.title}
                </h2>
                {hackathon.tagline && (
                  <p className="font-mono text-xs text-white/40 mb-3">{hackathon.tagline}</p>
                )}
                <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                  {hackathon.prizePool && (
                    <span className="flex items-center gap-1.5 font-mono text-[11px] text-white/55">
                      <Trophy size={12} style={{ color: "#FFD700" }} /> {hackathon.prizePool}
                    </span>
                  )}
                  {hackathon.venue && (
                    <span className="flex items-center gap-1.5 font-mono text-[11px] text-white/55">
                      <MapPin size={12} className="text-white/30" /> {hackathon.venue}
                    </span>
                  )}
                  {(hackathon.minTeamSize || hackathon.maxTeamSize) && (
                    <span className="flex items-center gap-1.5 font-mono text-[11px] text-white/55">
                      <Users size={12} className="text-white/30" /> {teamSizeLabel(hackathon)}
                    </span>
                  )}
                </div>
              </div>
            {/* Pinned to the bottom with mt-auto so this button lands on the
                same line as the neighbouring card's, whatever length the copy
                above it happens to be. Inside the text block it floated to a
                different height per card. */}
            <div className="relative mt-auto pt-5">
              <motion.span whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold px-4 py-2.5 rounded"
                style={{ color: "#000", background: accent }}>
                View Event <ArrowUpRight size={13} />
              </motion.span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
