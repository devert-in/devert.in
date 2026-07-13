"use client";

import { motion } from "framer-motion";
import { Zap, Anchor, Swords, Coins, Trophy } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export function QuickStatsRow() {
  const { userData } = useAuth();
  if (!userData) return null;

  const stats = [
    { label: "XP",         val: (userData.xp || 0).toLocaleString(),     icon: Zap,    color: "#00FFFF" },
    { label: "SHIPS",      val: userData.ships || 0,                     icon: Anchor, color: "#00FF41" },
    { label: "ARENA WINS", val: userData.arenaWins || 0,                 icon: Swords, color: "#FF9500" },
    { label: "COINS",      val: (userData.coins || 0).toLocaleString(),  icon: Coins,  color: "#FFD700" },
    ...(userData.contestsParticipated ? [
      { label: "CONTEST XP",    val: (userData.contestXp || 0).toLocaleString(),    icon: Trophy, color: "#C77DFF" },
      { label: "CONTEST COINS", val: (userData.contestCoins || 0).toLocaleString(), icon: Trophy, color: "#FFD700" },
    ] : []),
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-5"
    >
      {stats.map(s => (
        <div key={s.label} className="terminal-window p-4">
          <s.icon size={14} style={{ color: s.color }} className="mb-2" />
          <p className="font-mono text-lg font-bold leading-none" style={{ color: s.color }}>{s.val}</p>
          <p className="font-mono text-[9px] text-white/25 tracking-wider mt-1.5">{s.label}</p>
        </div>
      ))}
    </motion.div>
  );
}
