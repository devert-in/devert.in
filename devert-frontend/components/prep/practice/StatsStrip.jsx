"use client";

// Attempted / correct / accuracy for the active category filter, sourced from
// prepProgress. When category === 'all' the per-category counters are summed.

import { CheckCircle2, Target, Percent, Flame } from "lucide-react";
import { StatTile } from "@/components/prep/ui";
import { CATEGORY_MAP } from "@/lib/prep/constants";

export default function StatsStrip({ progress, category, loggedIn }) {
  if (!loggedIn) {
    return (
      <div className="rounded-lg border border-dashed border-white/10 px-5 py-4 flex items-center justify-between flex-wrap gap-3">
        <p className="font-mono text-xs text-white/35">
          <span className="text-neon-cyan">{"// "}</span>
          Log in to track attempts, accuracy, and your practice streak.
        </p>
        <a
          href="/login"
          className="font-mono text-xs text-neon-cyan border border-neon-cyan/30 px-4 py-2 hover:bg-neon-cyan/8 transition-colors"
        >
          [ LOGIN ]
        </a>
      </div>
    );
  }

  const stats =
    category === "all"
      ? Object.values(progress?.categoryStats || {}).reduce(
          (acc, c) => ({
            attempted: acc.attempted + (Number(c?.attempted) || 0),
            correct: acc.correct + (Number(c?.correct) || 0),
          }),
          { attempted: 0, correct: 0 }
        )
      : {
          attempted: Number(progress?.categoryStats?.[category]?.attempted) || 0,
          correct: Number(progress?.categoryStats?.[category]?.correct) || 0,
        };

  const accuracy = stats.attempted ? Math.round((stats.correct / stats.attempted) * 100) : 0;
  const label = category === "all" ? "ALL CATEGORIES" : (CATEGORY_MAP[category]?.label || category).toUpperCase();

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <StatTile label="ATTEMPTED" value={stats.attempted} sub={label} icon={Target} color="#00FFFF" />
      <StatTile label="CORRECT" value={stats.correct} sub={label} icon={CheckCircle2} color="#00FF41" />
      <StatTile label="ACCURACY" value={`${accuracy}%`} sub={label} icon={Percent} color="#FFD700" />
      <StatTile label="STREAK" value={progress?.streak || 0} sub="days active" icon={Flame} color="#FF6430" />
    </div>
  );
}
