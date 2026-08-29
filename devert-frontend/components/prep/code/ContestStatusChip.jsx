"use client";

// Status derivation + chip shared by the contest list and (implicitly) the
// run page's own window checks — pure function of startsAt/endsAt vs now.

import { NeonBadge } from "@/components/prep/ui";

export function contestStatus(startMs, endMs, now = Date.now()) {
  if (!startMs || now < startMs) return "upcoming";
  if (!endMs || now <= endMs) return "live";
  return "ended";
}

const META = {
  upcoming: { label: "UPCOMING", color: "#FF9500" },
  live: { label: "LIVE", color: "#00FF41" },
  ended: { label: "ENDED", color: "rgba(255,255,255,0.4)" },
};

export default function ContestStatusChip({ status, className }) {
  const m = META[status] || META.ended;
  return (
    <NeonBadge color={m.color} className={className}>
      {status === "live" && (
        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: m.color }} />
      )}
      {m.label}
    </NeonBadge>
  );
}
