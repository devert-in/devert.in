"use client";

import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

function greeting() {
  const h = new Date().getHours();
  if (h < 5)  return "still up";
  if (h < 12) return "good morning";
  if (h < 17) return "good afternoon";
  if (h < 21) return "good evening";
  return "good night";
}

export function WelcomeBanner() {
  const { userData, getTier } = useAuth();
  if (!userData) return null;

  const tier = getTier(userData.xp || 0);
  const name = userData.displayName?.split(" ")[0] || userData.handle || "builder";

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="terminal-window p-5 mb-5"
    >
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="font-mono text-[10px] text-white/25 tracking-wider mb-1">// {greeting()}, @{userData.handle}</p>
          <h2 className="font-sans text-xl font-bold text-white">
            Welcome back, <span className="text-neon-green">{name}</span>
          </h2>
        </div>
        <div className="flex items-center gap-3">
          {userData.streak > 0 && (
            <span className="flex items-center gap-1.5 font-mono text-xs" style={{ color: "#FF9500" }}>
              <Flame size={13} /> {userData.streak} day streak
            </span>
          )}
          <span className="font-mono text-[10px] px-2.5 py-1 rounded"
            style={{ color: tier.color, background: `${tier.color}15`, border: `1px solid ${tier.color}35` }}>
            {tier.name}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
