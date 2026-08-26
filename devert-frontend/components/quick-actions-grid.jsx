"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Swords, Anchor, Radio, Target, Tv2, Trophy, Wallet, ScrollText } from "lucide-react";

const ACTIONS = [
  { icon: Swords,     label: "Arena",     href: "/arena",     color: "#FF9500" },
  { icon: Anchor,     label: "Shipyard",  href: "/shipyard",  color: "#00FFFF" },
  { icon: Target,     label: "Missions",  href: "/missions",  color: "#FF6430" },
  { icon: Radio,      label: "Intel",     href: "/intel",     color: "#C77DFF" },
  { icon: Tv2,        label: "Broadcast", href: "/broadcast", color: "#FFD700" },
  { icon: Trophy,     label: "Ranks",     href: "/ranks",     color: "#00FF41" },
  { icon: Wallet,     label: "Wallet",    href: "/wallet",    color: "#00FFFF" },
  { icon: ScrollText, label: "Logs",      href: "/logs",      color: "#C77DFF" },
];

export function QuickActionsGrid() {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
      className="mb-5"
    >
      <p className="font-mono text-[10px] text-white/25 tracking-wider mb-2.5">// quick_actions</p>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
        {ACTIONS.map(a => (
          <Link key={a.href} href={a.href}>
            <motion.div whileHover={{ y: -2, borderColor: `${a.color}40` }} whileTap={{ scale: 0.96 }}
              className="terminal-window flex flex-col items-center justify-center gap-1.5 py-3.5 transition-colors"
            >
              <a.icon size={16} style={{ color: a.color }} />
              <span className="font-mono text-[9px] text-white/40">{a.label}</span>
            </motion.div>
          </Link>
        ))}
      </div>
    </motion.div>
  );
}
