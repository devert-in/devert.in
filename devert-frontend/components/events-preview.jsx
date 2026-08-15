"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Flame, Calendar, Mic2, Users2, ArrowUpRight, Trophy } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, where, getCountFromServer } from "firebase/firestore";

// Real numbers only, same convention as campus-preview.jsx's useCampusStats -
// a single getCountFromServer read, no fabricated "1000+ events" line.
function useEventStats() {
  const [count, setCount] = useState(null);
  useEffect(() => {
    getCountFromServer(query(collection(db, "hackathons"), where("status", "in", ["active", "upcoming"])))
      .then(snap => setCount(snap.data().count))
      .catch(() => setCount(0));
  }, []);
  return count;
}

const FEATURES = [
  { icon: Trophy,  label: "Hackathons",       body: "Build fast, ship real, win prizes." },
  { icon: Calendar, label: "Workshops",       body: "Hands-on sessions with other builders." },
  { icon: Mic2,     label: "Open Mic",        body: "Demo what you built. Get real feedback." },
  { icon: Users2,   label: "Meetups & Talks", body: "Meet developers, in person and online." },
];

export function EventsPreview() {
  const upcoming = useEventStats();

  return (
    <section className="px-6 py-20">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Copy side */}
          <div>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-mono text-xs text-neon-green/55 mb-2 tracking-wider"
            >
              // events.calendar --hackathons + more
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.05 }}
              className="font-sans font-bold text-white tracking-tighter mb-5"
              style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)" }}
            >
              MORE THAN <span className="text-neon-green">HACKATHONS.</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="font-mono text-sm text-white/40 mb-8 leading-relaxed max-w-lg"
            >
              Hackathons, workshops, meetups and open mics - one calendar for every way
              developers show up and build together on DeVert.
            </motion.p>

            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              transition={{ staggerChildren: 0.07 }}
              className="grid sm:grid-cols-2 gap-3 mb-9"
            >
              {FEATURES.map(f => (
                <motion.div
                  key={f.label}
                  variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
                  className="flex items-start gap-2.5"
                >
                  <f.icon size={15} className="text-neon-green/70 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-sans text-[12.5px] font-semibold text-white/85">{f.label}</p>
                    <p className="font-mono text-[10.5px] text-white/30 leading-relaxed">{f.body}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <Link href="/events">
                <motion.span
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center gap-2 font-mono text-sm px-6 py-3 border transition-all duration-200 cursor-pointer"
                  style={{ borderColor: "#00FF41", color: "#00FF41" }}
                >
                  [ EXPLORE_EVENTS ] <ArrowUpRight size={14} />
                </motion.span>
              </Link>
            </motion.div>
          </div>

          {/* Preview side */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="terminal-window"
          >
            <div className="terminal-header">
              <div className="terminal-dot bg-red-500/70" /><div className="terminal-dot bg-yellow-500/70" /><div className="terminal-dot bg-green-500/70" />
              <span className="font-mono text-[10px] text-white/25 ml-2">devert.in/events</span>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(0,255,65,0.1)" }}>
                  <Flame size={19} className="text-neon-green" />
                </div>
                <div>
                  <p className="font-sans text-sm font-bold text-white">DeVert Events</p>
                  <p className="font-mono text-[10px] text-white/30">build, learn, and show up together</p>
                </div>
              </div>

              <div className="border border-white/8 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-1.5 mb-2 text-white/25">
                  <Calendar size={11} /> <span className="font-mono text-[9px] tracking-wider">LIVE + UPCOMING EVENTS</span>
                </div>
                <p className="font-mono text-2xl font-bold text-neon-green">
                  {upcoming === null ? "…" : upcoming.toLocaleString()}
                </p>
              </div>

              <p className="font-mono text-[10.5px] text-white/25 leading-relaxed">
                <span className="text-neon-green/60">$</span> Register in one click.<br />
                <span className="text-neon-green/60">$</span> Open to every developer, not just one campus.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
