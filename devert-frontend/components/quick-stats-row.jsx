"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Zap, Anchor, Swords, Coins, Trophy, Code2, Flame, Radio, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";

// The DevCard is now a public portfolio, not a stats dashboard - every
// platform/engagement counter that used to live there lives here instead.
// This is the user's operational control center.
//
// Previously a flat grid of 12 identically-weighted tiles, half of them thin
// social vanity numbers (Following, Profile Views) sitting at the same
// visual weight as Ships or Arena Wins - the metrics that actually say
// something about what a builder has DONE here. Those two are dropped
// outright (neither is an achievement, just a passive count). What's left is
// grouped into labelled sections by what kind of progress each one
// represents, rather than one undifferentiated grid - same "// section_name"
// convention the Quick Actions block right below already uses.
function StatCard({ s }) {
  return (
    <div className="terminal-window p-4 flex items-start gap-3">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: `${s.color}15`, border: `1px solid ${s.color}30` }}>
        <s.icon size={16} style={{ color: s.color }} />
      </div>
      <div className="min-w-0">
        <p className="font-mono text-xl font-bold leading-none" style={{ color: s.color }}>{s.val}</p>
        <p className="font-mono text-[9.5px] text-white/35 tracking-wider mt-1.5">{s.label.toUpperCase()}</p>
        <p className="font-mono text-[9.5px] text-white/22 leading-relaxed mt-1">{s.desc}</p>
      </div>
    </div>
  );
}

function StatSection({ title, stats, delay }) {
  if (stats.length === 0) return null;
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }} className="mb-5">
      <p className="font-mono text-xs text-white/30 mb-2.5">// {title}</p>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {stats.map(s => <StatCard key={s.key} s={s} />)}
      </div>
    </motion.div>
  );
}

export function QuickStatsRow() {
  const { user, userData } = useAuth();

  // `users.credits` is only ever incremented by contest rewards (see
  // lib/contests.js) - every other coin-earning path (Daily Learning,
  // Programming, CS Core, Pulse like/comment/save credits) writes to
  // user_earnings/{uid}.totalCoins instead, the same field Wallet and
  // Classroom Analytics already correctly read. Using `credits` here showed
  // 0 for any student who'd never entered a contest, even with a real
  // nonzero balance visible on their own Wallet page for the same account.
  // Live subscription (not a one-time fetch) so this repaints the instant
  // any reward-granting action credits the user, without a refresh.
  const [totalCoins, setTotalCoins] = useState(null);
  useEffect(() => {
    if (!user?.uid) { setTotalCoins(null); return; }
    return onSnapshot(doc(db, "user_earnings", user.uid), snap => {
      setTotalCoins(snap.exists() ? (snap.data().totalCoins || 0) : 0);
    }, () => setTotalCoins(0));
  }, [user?.uid]);

  // Renders for any signed-in user, including one whose profile doc has not
  // loaded yet or carries no counters at all. It used to bail to null, which
  // is how a brand-new account got a dashboard with no stats block at all -
  // a zero is information ("you have not started"), an absent widget is not.
  if (!user) return null;
  const d = userData || {};

  const streak = d.streak || 0;

  // progression: the always-on gamification currencies, earned everywhere.
  const progressionStats = [
    { key: "xp", label: "Experience", val: (d.xp || 0).toLocaleString(), icon: Zap, color: "#00FFFF",
      desc: "Earned across Campus, Grind, and Contests." },
    { key: "coins", label: "Coins", val: (totalCoins || 0).toLocaleString(), icon: Coins, color: "#FFD700",
      desc: "Convertible to real payouts from your Wallet." },
    { key: "streak", label: "Grind Streak", val: `${streak}d`, icon: Flame, color: "#FF6430",
      desc: streak > 0 ? "Keep going - don't break the chain." : "Start today - build the habit." },
  ];

  // build: what this builder has actually shipped or solved.
  const buildStats = [
    { key: "ships", label: "Ships Docked", val: d.ships || 0, icon: Anchor, color: "#00FF41",
      desc: "Projects docked to your Shipyard." },
    ...(d.problemsSolvedCount ? [
      { key: "problems", label: "Problems Solved", val: d.problemsSolvedCount, icon: Code2, color: "#C77DFF",
        desc: "Across CodeLab and Daily Learning." },
    ] : []),
  ];

  // compete: only shown once a student has actually entered something -
  // an unearned "0 wins" section is noise, not a stat worth its own header.
  const competeStats = [
    ...(d.arenaWins ? [
      { key: "arenaWins", label: "Arena Wins", val: d.arenaWins, icon: Swords, color: "#FF9500",
        desc: "Timed coding battles won in the Arena." },
    ] : []),
    ...(d.contestsParticipated ? [
      { key: "contestXp", label: "Contest XP", val: (d.contestXp || 0).toLocaleString(), icon: Trophy, color: "#C77DFF",
        desc: "Earned from hackathon & contest results." },
      { key: "contestCoins", label: "Contest Coins", val: (d.contestCoins || 0).toLocaleString(), icon: Trophy, color: "#FFD700",
        desc: "Coin payouts from contest placements." },
    ] : []),
  ];

  const pulseStats = [
    { label: "posts",    val: d.pulsePostsCount || 0 },
    { label: "followers", val: d.followersCount || 0 },
    { label: "likes",    val: d.totalLikesReceived || 0 },
    { label: "comments", val: d.totalCommentsReceived || 0 },
  ];

  return (
    <div>
      <StatSection title="progression" stats={progressionStats} delay={0.05} />
      <StatSection title="build" stats={buildStats} delay={0.08} />
      <StatSection title="compete" stats={competeStats} delay={0.11} />

      {/* One compact strip for Pulse, not four big tiles - real numbers, but
          Pulse is one pillar among several, not the headline of this page. */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }} className="mb-5">
        <p className="font-mono text-xs text-white/30 mb-2.5">// community</p>
        <a href="/pulse" className="terminal-window p-4 flex items-center gap-4 flex-wrap hover:border-white/15 transition-colors">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(0,255,65,0.1)", border: "1px solid rgba(0,255,65,0.3)" }}>
            <Radio size={16} style={{ color: "#00FF41" }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-mono text-[9.5px] text-white/35 tracking-wider">YOUR ACTIVITY ON PULSE</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
              {pulseStats.map(p => (
                <span key={p.label} className="font-mono text-[11px] text-white/50">
                  <span className="text-white font-bold">{p.val.toLocaleString?.() ?? p.val}</span> {p.label}
                </span>
              ))}
            </div>
          </div>
          <span className="font-mono text-[10px] text-neon-green flex items-center gap-1 flex-shrink-0">
            view pulse <ArrowRight size={11} />
          </span>
        </a>
      </motion.div>
    </div>
  );
}
