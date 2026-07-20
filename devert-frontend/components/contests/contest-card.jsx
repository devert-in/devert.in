"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Users, Trophy, Coins, Zap, Clock, CheckCircle2, MoreVertical } from "lucide-react";
import { contestPhase } from "@/lib/contests";

const DIFF_COLOR = { Easy: "#00FF41", Medium: "#FF9500", Hard: "#FF5050" };
const PHASE_LABEL = { live: "LIVE NOW", upcoming: "UPCOMING", closed: "REG CLOSED", past: "ENDED" };
const PHASE_COLOR = { live: "#00FF41", upcoming: "#00FFFF", closed: "#FF9500", past: "rgba(255,255,255,0.3)" };

function formatDate(v) {
  if (!v) return "TBA";
  const d = v?.toDate ? v.toDate() : new Date(v);
  return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function ContestCard({ contest, registered, registering, onRegister, onViewDetails, onViewResults }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const phase = contestPhase(contest);

  return (
    <motion.div whileHover={{ borderColor: "rgba(0,255,255,0.25)" }} className="terminal-window relative">
      <div className="terminal-header">
        <div className="terminal-dot bg-red-500/70" /><div className="terminal-dot bg-yellow-500/70" /><div className="terminal-dot bg-green-500/70" />
        <Trophy size={10} className="ml-2 text-white/25" />
        <span className="font-mono text-[9px] px-1.5 py-0.5 rounded ml-auto" style={{ color: PHASE_COLOR[phase], background: `${PHASE_COLOR[phase]}15` }}>
          {PHASE_LABEL[phase]}
        </span>
        <div className="relative">
          <button onClick={() => setMenuOpen(o => !o)} className="ml-1 text-white/25 hover:text-white/60 transition-colors">
            <MoreVertical size={12} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 z-20 rounded-lg overflow-hidden"
              style={{ background: "rgba(5,5,5,0.97)", border: "1px solid rgba(255,255,255,0.08)", minWidth: 140 }}
              onMouseLeave={() => setMenuOpen(false)}>
              <button onClick={() => { setMenuOpen(false); onViewDetails(contest.id); }} className="block w-full text-left px-3 py-2 font-mono text-[10px] text-white/55 hover:text-neon-cyan hover:bg-white/3 transition-colors">
                view rules
              </button>
              <button onClick={() => { setMenuOpen(false); onViewResults(contest.id); }} className="block w-full text-left px-3 py-2 font-mono text-[10px] text-white/55 hover:text-neon-cyan hover:bg-white/3 transition-colors">
                leaderboard
              </button>
              <button onClick={() => {
                if (typeof window !== "undefined") navigator.clipboard?.writeText(`${window.location.origin}/arena/contests/details?id=${contest.id}`);
                setMenuOpen(false);
              }} className="w-full text-left px-3 py-2 font-mono text-[10px] text-white/55 hover:text-neon-cyan hover:bg-white/3 transition-colors">
                share link
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="p-4">
        {contest.bannerUrl && (
          <div className="w-full h-24 rounded-lg mb-3 bg-cover bg-center border border-white/6" style={{ backgroundImage: `url(${contest.bannerUrl})` }} />
        )}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="font-mono text-[9px] text-white/25 border border-white/8 px-1.5 py-0.5 rounded">{contest.category}</span>
          <span className="font-mono text-[9px] px-1.5 py-0.5 rounded"
            style={{ color: DIFF_COLOR[contest.difficulty] || "#00FF41", background: `${DIFF_COLOR[contest.difficulty] || "#00FF41"}15` }}>
            {contest.difficulty}
          </span>
        </div>
        <h3 className="font-sans text-base font-semibold text-white mb-2 leading-snug">{contest.title}</h3>
        <div className="flex items-center gap-3 flex-wrap font-mono text-[10px] text-white/35 mb-3">
          <span className="flex items-center gap-1"><Clock size={10} /> {formatDate(contest.contestStart)}</span>
          <span className="flex items-center gap-1"><Users size={10} /> {contest.participantCount || 0}</span>
        </div>
        <div className="flex items-center gap-3 font-mono text-[10px] mb-4">
          {contest.prizeXp > 0 && <span className="flex items-center gap-1" style={{ color: "#00FF41" }}><Zap size={10} /> {contest.prizeXp} XP</span>}
          {contest.prizeCoins > 0 && <span className="flex items-center gap-1" style={{ color: "#FFD700" }}><Coins size={10} /> {contest.prizeCoins}</span>}
        </div>
        <div className="flex gap-2">
          <button onClick={() => onViewDetails(contest.id)}
            className="flex-1 text-center font-mono text-xs py-2 rounded-lg border border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/8 transition-colors">
            view details
          </button>
          {phase !== "past" && (
            registered ? (
              <span className="flex items-center gap-1 font-mono text-xs px-3 py-2 rounded-lg text-neon-green border border-neon-green/30">
                <CheckCircle2 size={12} /> registered
              </span>
            ) : phase !== "closed" && onRegister ? (
              <button onClick={() => onRegister(contest.id)} disabled={registering}
                className="font-mono text-xs px-4 py-2 rounded-lg text-neon-green border border-neon-green/30 hover:bg-neon-green/8 transition-colors disabled:opacity-50">
                {registering ? "..." : "register"}
              </button>
            ) : null
          )}
        </div>
      </div>
    </motion.div>
  );
}
