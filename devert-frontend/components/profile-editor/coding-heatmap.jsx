"use client";

import { useEffect, useState, useMemo } from "react";
import { fetchSubmissionDatesForUser } from "@/lib/codelab";

// GitHub/LeetCode-style activity calendar - built entirely from real
// codelab_submissions timestamps (fetchSubmissionDatesForUser already
// existed for the Classroom Analytics "active" signal; this is the first
// place it feeds a full year, not just the last 7 days). No fabricated
// activity: a day with zero submissions is simply empty.

function toDateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const CELL = 11;
const GAP = 3;
const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function levelColor(count) {
  if (count === 0) return "rgba(255,255,255,0.05)";
  if (count === 1) return "rgba(0,255,65,0.35)";
  if (count <= 3) return "rgba(0,255,65,0.6)";
  return "rgba(0,255,65,0.95)";
}

export default function CodingHeatmap({ uid }) {
  const [countsByDate, setCountsByDate] = useState(null);
  const [error, setError] = useState(false);
  const [hover, setHover] = useState(null);

  useEffect(() => {
    if (!uid) return;
    let cancelled = false;
    const since = new Date();
    since.setDate(since.getDate() - 371); // a few extra days so the grid's first partial week is fully populated
    fetchSubmissionDatesForUser(uid, since).then(dates => {
      if (cancelled) return;
      const map = new Map();
      dates.forEach(d => { const k = toDateKey(d); map.set(k, (map.get(k) || 0) + 1); });
      setCountsByDate(map);
    }).catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, [uid]);

  const { weeks, monthMarkers, totalSubmissions, activeDays, maxStreak } = useMemo(() => {
    if (!countsByDate) return { weeks: [], monthMarkers: [], totalSubmissions: 0, activeDays: 0, maxStreak: 0 };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(today);
    start.setDate(start.getDate() - 364);
    // Roll back to the most recent Sunday so week columns align to real weeks.
    start.setDate(start.getDate() - start.getDay());

    const days = [];
    const cursor = new Date(start);
    while (cursor <= today) {
      const key = toDateKey(cursor);
      days.push({ date: new Date(cursor), key, count: countsByDate.get(key) || 0 });
      cursor.setDate(cursor.getDate() + 1);
    }

    const weeks = [];
    for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));

    const monthMarkers = [];
    let lastMonth = -1;
    weeks.forEach((week, wi) => {
      const firstOfWeek = week[0].date;
      if (firstOfWeek.getMonth() !== lastMonth) { monthMarkers.push({ wi, label: MONTH_LABELS[firstOfWeek.getMonth()] }); lastMonth = firstOfWeek.getMonth(); }
    });

    let totalSubmissions = 0, activeDays = 0, streak = 0, maxStreak = 0;
    days.forEach(d => {
      totalSubmissions += d.count;
      if (d.count > 0) { activeDays++; streak++; maxStreak = Math.max(maxStreak, streak); }
      else streak = 0;
    });

    return { weeks, monthMarkers, totalSubmissions, activeDays, maxStreak };
  }, [countsByDate]);

  if (error) return <p className="font-mono text-[11px] text-white/25">Couldn&apos;t load submission history.</p>;
  if (!countsByDate) return <p className="font-mono text-[11px] text-white/25 animate-pulse">loading heatmap...</p>;

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
