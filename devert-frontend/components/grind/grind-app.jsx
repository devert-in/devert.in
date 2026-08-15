"use client";

import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { TodayTaskCard } from "@/components/today-task-card";
import { useIsWindowed } from "@/components/window/is-windowed";

export function GrindApp() {
  const windowed = useIsWindowed();
  const { userData } = useAuth();
  const streak = userData?.streak ?? 0;

  return (
    <main className={`${windowed ? "min-h-full" : "min-h-screen"} pt-10 pb-32 px-6 relative`}>
      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />

      <div className="relative max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <p className="font-mono text-xs text-neon-green/55 mb-3 tracking-wider">// /grind - practice.sh</p>
          <h1 className="font-sans font-bold tracking-tighter text-white leading-none mb-3" style={{ fontSize: "clamp(2.5rem,7vw,5rem)" }}>
            DAILY <span className="text-neon-cyan">GRIND</span>
          </h1>
          <p className="font-mono text-sm text-white/35">Your practice ritual. Keep the streak alive.</p>
        </motion.div>

        {/* Streak */}
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }}
          className="terminal-window p-5 mb-10 flex flex-wrap items-center gap-4"
        >
          <div className="flex items-center gap-2">
            <Flame size={24} style={{ color: streak > 0 ? "#FF6430" : "rgba(255,255,255,0.2)" }} />
            <span className="font-sans text-3xl font-bold text-white">{streak}</span>
          </div>
          <div>
            <p className="font-mono text-xs text-white/30 mb-0.5 tracking-wider">CURRENT_STREAK</p>
            <p className="font-mono text-sm text-white/55">
              {streak > 0 ? "Keep going. Don't break the chain." : "Start today. Build the habit."}
            </p>
          </div>
          {streak > 0 && (
            <div className="ml-auto flex gap-1">
              {Array.from({ length: Math.min(streak, 7) }).map((_, i) => (
                <div key={i} className="w-4 h-4 rounded-sm"
                  style={{ background: "#FF6430", boxShadow: "0 0 6px rgba(255,100,48,0.4)" }} />
              ))}
            </div>
          )}
        </motion.div>

        {/* Today's learning task */}
        <TodayTaskCard />
      </div>
    </main>
  );
}
