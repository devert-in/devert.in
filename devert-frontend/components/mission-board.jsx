"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Clock, Users, Trophy } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";

export function MissionBoard({ compact = false }) {
  const [missions, setMissions] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    getDocs(query(collection(db, "missions"), orderBy("createdAt", "desc"), limit(3)))
      .then(snap => setMissions(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className={compact ? "" : "px-6 py-20"}>
      <div className={compact ? "" : "max-w-6xl mx-auto"}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className={`flex items-end justify-between flex-wrap gap-4 ${compact ? "mb-4" : "mb-10"}`}
        >
          <div>
            <p className="font-mono text-xs text-neon-green/55 mb-2 tracking-wider">
              // /missions - classified.db
            </p>
            <h2 className="font-sans font-bold text-white tracking-tighter" style={{ fontSize: compact ? "1.25rem" : "clamp(1.8rem, 4vw, 3rem)" }}>
              MISSION <span className="text-neon-cyan">BOARD</span>
            </h2>
          </div>
          <Link href="/missions">
            <motion.div
              whileHover={{ x: 4 }}
              className="flex items-center gap-2 font-mono text-xs text-white/35 hover:text-neon-cyan transition-colors"
            >
              all missions <ArrowRight size={12} />
            </motion.div>
          </Link>
        </motion.div>

        {loading ? (
          <div className={`grid gap-5 ${compact ? "sm:grid-cols-2" : "md:grid-cols-3"}`}>
            {[1, 2, 3].map(i => (
              <div key={i} className="terminal-window animate-pulse">
                <div className="terminal-header" />
                <div className="p-5 space-y-3">
                  <div className="h-3 bg-white/5 rounded w-1/2" />
                  <div className="h-3 bg-white/5 rounded w-3/4" />
                  <div className="h-3 bg-white/5 rounded w-full" />
                  <div className="h-3 bg-white/5 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : missions.length === 0 ? (
          <div className="terminal-window max-w-md">
            <div className="terminal-header">
            </div>
            <div className="p-8 text-center">
              <p className="font-mono text-xs text-white/25 mb-1">no active missions</p>
              <p className="font-mono text-[10px] text-white/15">// mission briefings drop soon</p>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-5">
            {missions.map((m, i) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, type: "spring", stiffness: 200, damping: 22 }}
                whileHover={{ y: -5, borderColor: "rgba(0,255,255,0.2)" }}
                className="terminal-window group cursor-pointer transition-colors"
              >
                <div className="terminal-header relative overflow-hidden">
                  <span className="font-mono text-[9px] text-white/25 ml-2 truncate">mission_brief.pdf</span>
                  <motion.span
                    whileHover={{ rotate: -8 }}
                    className="ml-auto font-mono text-[9px] px-2 py-0.5 rounded border"
                    style={{
                      color: m.statusColor || "#00FF41",
                      borderColor: `${m.statusColor || "#00FF41"}40`,
                      background: `${m.statusColor || "#00FF41"}0D`,
                    }}
                  >
                    {m.status}
                  </motion.span>
                </div>

                <div className="p-5">
                  <p className="font-mono text-[10px] text-white/30 mb-1 tracking-wider">CODENAME</p>
                  <h3 className="font-sans text-sm font-bold text-white mb-3 leading-tight group-hover:text-neon-cyan transition-colors">
                    {m.codename}
                  </h3>
                  <p className="font-mono text-[11px] text-white/38 mb-5 leading-relaxed">{m.objective}</p>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-mono text-[11px] text-white/35">
                        <Trophy size={11} style={{ color: "#00FFFF" }} /> Prize
                      </div>
                      <span className="font-mono text-xs font-bold text-neon-cyan">{m.prize}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-mono text-[11px] text-white/35">
                        <Clock size={11} /> Deadline
                      </div>
                      <span className="font-mono text-xs text-white/60">{m.deadline}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-mono text-[11px] text-white/35">
                        <Users size={11} /> Team size
                      </div>
                      <span className="font-mono text-xs text-white/60">{m.team} devs</span>
                    </div>
                  </div>

                  <p className="font-mono text-[9px] text-white/20 mt-3 leading-relaxed">
                    // reward arranged directly with the poster - not processed by DeVert
                  </p>

                  <div className="mt-5 pt-4 border-t border-white/5">
                    <span className="font-mono text-[9px] px-2 py-0.5 rounded" style={{
                      color: m.diffColor || (m.difficulty === "EXTREME" ? "#FF3B3B" : m.difficulty === "HARD" ? "#FF9500" : "#00FF41"),
                      background: m.difficulty === "EXTREME" ? "rgba(255,59,59,0.1)" : m.difficulty === "HARD" ? "rgba(255,149,0,0.1)" : "rgba(0,255,65,0.08)",
                    }}>
                      {m.difficulty}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
