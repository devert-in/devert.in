"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Trophy, ChevronRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { fetchPublishedContests, fetchMyRegistration, contestPhase } from "@/lib/contests";

export function UpcomingContestsCard() {
  const { user } = useAuth();
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    (async () => {
      const all = await fetchPublishedContests().catch(() => []);
      const relevant = all.filter(c => ["live", "upcoming"].includes(contestPhase(c)));
      const withReg = await Promise.all(
        relevant.map(async c => ({ c, reg: await fetchMyRegistration(c.id, user.uid).catch(() => null) }))
      );
      setContests(withReg.filter(x => x.reg).map(x => x.c).slice(0, 3));
      setLoading(false);
    })();
  }, [user]);

  if (!user || loading || contests.length === 0) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mb-5">
      <div className="terminal-window">
        <div className="terminal-header">
          <div className="terminal-dot bg-red-500/70" /><div className="terminal-dot bg-yellow-500/70" /><div className="terminal-dot bg-green-500/70" />
          <Trophy size={10} className="ml-2 text-white/25" />
          <span className="font-mono text-[10px] text-white/25 ml-1">your_contests.upcoming</span>
        </div>
        <div className="p-2">
          {contests.map(c => {
            const live = contestPhase(c) === "live";
            return (
              <Link key={c.id} href={`/arena/contests/details?id=${c.id}`}>
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-white/3 transition-colors">
                  <span className="font-mono text-[9px] px-1.5 py-0.5 rounded flex-shrink-0"
                    style={{ color: live ? "#00FF41" : "#00FFFF", background: live ? "rgba(0,255,65,0.1)" : "rgba(0,255,255,0.1)" }}>
                    {live ? "LIVE" : "SOON"}
                  </span>
                  <span className="font-mono text-xs text-white/70 flex-1 truncate">{c.title}</span>
                  <ChevronRight size={12} className="text-white/20 flex-shrink-0" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
