"use client";

import { useEffect, useState, useMemo } from "react";
import { fetchSubmissionDatesForUser } from "@/lib/codelab";
import { buildActivityWeeks } from "@/lib/activityDates";

// GitHub/LeetCode-style activity calendar - built entirely from real
// codelab_submissions timestamps (fetchSubmissionDatesForUser already
// existed for the Classroom Analytics "active" signal; this is the first
// place it feeds a full year, not just the last 7 days). No fabricated
// activity: a day with zero submissions is simply empty.
//
// The actual day-grid/streak math lives in lib/activityDates.js - shared
// with components/campus/campus-activity-heatmap.jsx (the Campus-styled
// reskin of this same widget) so there's exactly one implementation of it.

const CELL = 11;
const GAP = 3;

function levelColor(count) {
  if (count === 0) return "rgba(255,255,255,0.05)";
  if (count === 1) return "rgba(0,255,65,0.35)";
  if (count <= 3) return "rgba(0,255,65,0.6)";
  return "rgba(0,255,65,0.95)";
}

export default function CodingHeatmap({ uid }) {
  const [dates, setDates] = useState(null);
  const [error, setError] = useState(false);
  const [hover, setHover] = useState(null);

  useEffect(() => {
    if (!uid) return;
    let cancelled = false;
    const since = new Date();
    since.setDate(since.getDate() - 371); // a few extra days so the grid's first partial week is fully populated
    fetchSubmissionDatesForUser(uid, since).then(fetched => {
      if (!cancelled) setDates(fetched);
    }).catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, [uid]);

  const { weeks, monthMarkers, total: totalSubmissions, activeDays, maxStreak } = useMemo(
    () => (dates ? buildActivityWeeks(dates) : { weeks: [], monthMarkers: [], total: 0, activeDays: 0, maxStreak: 0 }),
    [dates],
  );

  if (error) return <p className="font-mono text-[11px] text-white/25">Couldn&apos;t load submission history.</p>;
  if (!dates) return <p className="font-mono text-[11px] text-white/25 animate-pulse">loading heatmap...</p>;

  return (
    <div>
      <div className="flex items-center gap-4 mb-3">
        <p className="font-mono text-[11px] text-white/50">{totalSubmissions} submissions in the last year</p>
        <p className="font-mono text-[11px] text-white/50">{activeDays} active days</p>
        <p className="font-mono text-[11px] text-white/50">longest run: {maxStreak}d</p>
      </div>
      <div className="overflow-x-auto">
        <div style={{ position: "relative", height: 14, marginLeft: 18, width: weeks.length * (CELL + GAP) }}>
          {monthMarkers.map(m => (
            <span key={m.wi} className="font-mono text-[9px] text-white/25" style={{ position: "absolute", left: m.wi * (CELL + GAP) }}>{m.label}</span>
          ))}
        </div>
        <div className="flex gap-[3px]">
          <div className="flex flex-col gap-[3px] mr-1.5" style={{ width: 14 }}>
            {["", "Mon", "", "Wed", "", "Fri", ""].map((l, i) => (
              <span key={i} className="font-mono text-[8px] text-white/25" style={{ height: CELL, lineHeight: `${CELL}px` }}>{l}</span>
            ))}
          </div>
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {week.map(day => (
                <div key={day.key}
                  onMouseEnter={() => setHover(day)} onMouseLeave={() => setHover(null)}
                  style={{ width: CELL, height: CELL, borderRadius: 2, background: levelColor(day.count), cursor: "default" }} />
              ))}
            </div>
          ))}
        </div>
      </div>
      <p className="font-mono text-[10px] text-white/30 mt-2 h-4">
        {hover ? `${hover.count} submission${hover.count === 1 ? "" : "s"} on ${hover.date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}` : ""}
      </p>
    </div>
  );
}
