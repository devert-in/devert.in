"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, ExternalLink, Flame, Anchor, Wrench } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";

const TAG_META = {
  Fire:         { Icon: Flame,  color: "#FF6430", bg: "rgba(255,100,0,0.15)" },
  Shipped:      { Icon: Anchor, color: "#00FFFF", bg: "rgba(0,255,255,0.08)" },
  "Needs Work": { Icon: Wrench, color: "#FF5050", bg: "rgba(255,50,50,0.1)"  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 200, damping: 22 } },
};

export function ShipyardPreview() {
  const [projects, setProjects] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    getDocs(query(collection(db, "projects"), orderBy("createdAt", "desc"), limit(4)))
      .then(snap => setProjects(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="px-6 py-20">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-end justify-between mb-10 flex-wrap gap-4"
        >
          <div>
            <p className="font-mono text-xs text-neon-green/55 mb-2 tracking-wider">
              // /shipyard - this_week.log
            </p>
            <h2 className="font-sans font-bold text-white tracking-tighter" style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)" }}>
              THIS WEEK IN THE <span className="text-neon-cyan">SHIPYARD</span>
            </h2>
          </div>
          <Link href="/shipyard">
            <motion.div
              whileHover={{ x: 4 }}
              className="flex items-center gap-2 font-mono text-xs text-white/35 hover:text-neon-cyan transition-colors"
            >
              view all ships <ArrowRight size={12} />
            </motion.div>
          </Link>
        </motion.div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="terminal-window animate-pulse">
                <div className="terminal-header" />
                <div className="p-4 space-y-2">
                  <div className="h-3 bg-white/5 rounded w-3/4" />
                  <div className="h-3 bg-white/5 rounded w-full" />
                  <div className="h-3 bg-white/5 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="terminal-window max-w-sm">
            <div className="terminal-header">
              <div className="terminal-dot bg-red-500/70" />
              <div className="terminal-dot bg-yellow-500/70" />
              <div className="terminal-dot bg-green-500/70" />
            </div>
            <div className="p-8 text-center">
              <p className="font-mono text-xs text-white/25 mb-1">no ships docked yet</p>
              <p className="font-mono text-[10px] text-white/15">// be the first to ship</p>
            </div>
          </div>
        ) : (
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            transition={{ staggerChildren: 0.1 }}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {projects.map(p => {
              const m = TAG_META[p.reaction] || TAG_META["Shipped"];
              return (
                <motion.div
                  key={p.id}
                  variants={cardVariants}
                  whileHover={{ y: -4, borderColor: "rgba(0,255,255,0.2)" }}
                  className="terminal-window p-5 cursor-pointer group transition-colors"
                >
                  <div className="terminal-header -mx-5 -mt-5 mb-4">
                    <div className="terminal-dot bg-red-500/70" />
                    <div className="terminal-dot bg-yellow-500/70" />
                    <div className="terminal-dot bg-green-500/70" />
                    {p.url ? (
                      <a href={p.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                        className="ml-auto text-white/20 group-hover:text-neon-cyan/60 transition-colors"
                      >
                        <ExternalLink size={10} />
                      </a>
                    ) : (
                      <ExternalLink size={10} className="ml-auto text-white/10" />
                    )}
                  </div>

                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-sans text-sm font-semibold text-white leading-tight">{p.name}</h3>
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded flex-shrink-0 flex items-center gap-1"
                      style={{ background: m.bg, color: m.color }}>
                      <m.Icon size={9} /> {p.reaction}
                    </span>
                  </div>

                  <p className="font-mono text-[11px] text-white/35 mb-4 leading-relaxed">{p.description}</p>

                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-neon-green/60">@{p.ownerHandle}</span>
                    <div className="flex gap-1 flex-wrap justify-end">
                      {(p.stack || []).slice(0, 2).map(t => (
                        <span key={t} className="font-mono text-[9px] text-white/30 border border-white/8 px-1.5 py-0.5 rounded">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </section>
  );
}
