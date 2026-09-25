"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { GraduationCap, Building2, Trophy, Users, ArrowUpRight } from "lucide-react";
import { useCampusStats } from "@/components/campus-preview";
import { CAMPUS_URL } from "@/lib/campusUrl";

// The Campus counterpart to hackathon-spotlight.jsx's card - same terminal-window
// shape and one-glance density, placed alongside it wherever that card appears
// (Hero, /login, HQ dashboard) so a first-time visitor's first impression
// includes both "there's a hackathon" and "there's a whole Campus product",
// not just whichever one a scroll happens to reach.
export function CampusSpotlight() {
  const stats = useCampusStats();

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}
      className="mb-5 sm:flex-1 sm:min-w-0">   {/* no h-full - see devert100-spotlight */}
      <Link href={CAMPUS_URL} className="block group h-full">
        <div className="terminal-window overflow-hidden transition-colors duration-200 h-full flex flex-col"
          style={{ borderColor: "#00FFFF30" }}>
          <div className="terminal-header">
            <span className="font-mono text-[10px] text-white/25 ml-2">campus.devert.in</span>
          </div>
          <div className="p-5 sm:p-6 relative overflow-hidden flex-1 flex flex-col">
            <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full blur-3xl opacity-20 pointer-events-none" style={{ background: "#00FFFF" }} />
            <div className="relative flex-1 min-w-0">
                <span className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-widest px-2 py-1 rounded mb-2.5"
                  style={{ color: "#00FFFF", background: "#00FFFF15", border: "1px solid #00FFFF35" }}>
                  <GraduationCap size={11} /> FOR INSTITUTIONS
                </span>
                <h2 className="font-sans text-xl sm:text-2xl font-bold text-white mb-1 group-hover:text-white/90 transition-colors">
                  DeVert Campus
                </h2>
                <p className="font-mono text-xs text-white/40 mb-3">Your college&apos;s own LMS, contests &amp; leaderboard.</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                  <span className="flex items-center gap-1.5 font-mono text-[11px] text-white/55">
                    <Building2 size={12} className="text-white/30" /> {stats ? stats.institutions.toLocaleString() : "…"} institutions
                  </span>
                  <span className="flex items-center gap-1.5 font-mono text-[11px] text-white/55">
                    <Trophy size={12} style={{ color: "#FFD700" }} /> {stats ? stats.totalContests.toLocaleString() : "…"} contests conducted
                  </span>
                  <span className="flex items-center gap-1.5 font-mono text-[11px] text-white/55">
                    <Users size={12} className="text-white/30" /> {stats && stats.learners != null ? stats.learners.toLocaleString() : "…"} DeVert Campus learners
                  </span>
                </div>
              </div>
            {/* Pinned to the bottom with mt-auto so this button lands on the
                same line as the neighbouring card's, whatever length the copy
                above it happens to be. Inside the text block it floated to a
                different height per card. */}
            <div className="relative mt-auto pt-5">
              <motion.span whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold px-4 py-2.5 rounded"
                style={{ color: "#000", background: "#00FFFF" }}>
                Explore Campus <ArrowUpRight size={13} />
              </motion.span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
