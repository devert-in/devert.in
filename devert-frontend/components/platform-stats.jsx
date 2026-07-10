"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, Zap, Anchor, Target } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

export function PlatformStats() {
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [usersSnap, projectsSnap, missionsSnap] = await Promise.allSettled([
        getDocs(collection(db, "users")),
        getDocs(collection(db, "projects")),
        getDocs(collection(db, "missions")),
      ]);
      const users   = usersSnap.status === "fulfilled" ? usersSnap.value.docs.map(d => d.data()) : [];
      const totalXP = users.reduce((sum, u) => sum + (u.xp || 0), 0);
      setStats({
        builders: users.length,
        totalXP,
        shipped:  projectsSnap.status === "fulfilled" ? projectsSnap.value.size : 0,
        missions: missionsSnap.status === "fulfilled" ? missionsSnap.value.size : 0,
      });
      setLoading(false);
    };
    load().catch(() => setLoading(false));
  }, []);

  const cards = stats ? [
    { label: "BUILDERS ON PLATFORM", val: stats.builders.toLocaleString(),  icon: Users,  color: "#00FFFF" },
    { label: "TOTAL XP EARNED",      val: stats.totalXP.toLocaleString(),   icon: Zap,    color: "#00FF41" },
    { label: "PROJECTS SHIPPED",     val: stats.shipped.toLocaleString(),   icon: Anchor, color: "#FF9500" },
    { label: "MISSIONS POSTED",      val: stats.missions.toLocaleString(),  icon: Target, color: "#C77DFF" },
  ] : [];

  return (
    <section className="px-6 py-20">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-10"
        >
          <p className="font-mono text-xs text-neon-green/55 mb-2 tracking-wider">
            // platform.stats --live
          </p>
          <h2 className="font-sans font-bold text-white tracking-tighter" style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)" }}>
            NUMBERS <span className="text-neon-cyan">DON'T LIE</span>
          </h2>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="terminal-window animate-pulse">
                <div className="terminal-header" />
                <div className="p-5 space-y-2">
                  <div className="h-6 bg-white/5 rounded w-1/2" />
                  <div className="h-3 bg-white/5 rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            transition={{ staggerChildren: 0.08 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {cards.map(c => (
              <motion.div
                key={c.label}
                variants={{ hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 200, damping: 22 } } }}
                className="terminal-window p-5"
              >
                <c.icon size={16} style={{ color: c.color }} className="mb-3" />
                <p className="font-mono text-2xl font-bold leading-none" style={{ color: c.color }}>{c.val}</p>
                <p className="font-mono text-[9px] text-white/25 tracking-wider mt-2">{c.label}</p>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}
