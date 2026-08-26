"use client";

// Campus-styled reskin of components/profile-editor/coding-heatmap.jsx - same
// underlying algorithm (lib/activityDates.js's buildActivityWeeks), same
// data (real codelab_submissions timestamps), different chrome: CAMPUS.*
// tokens/glass card instead of the neon-terminal dark palette, matching this
// codebase's existing pattern of re-skinning rather than importing a
// main-site component directly into Campus.
//
// Takes already-fetched `dates` as a prop rather than fetching them itself -
// lib/campusProfile.js's fetchProfileAnalytics already reads
// fetchSubmissionDatesForUser once (it also needs those dates for the
// best-streak calculation), so this stays purely presentational instead of
// firing a second, redundant read of the same data.

import { useMemo, useState } from "react";
import { CAMPUS, tint } from "@/lib/campus-theme";
import { buildActivityWeeks } from "@/lib/activityDates";
import { CampusCard, CampusSkeleton } from "@/components/campus/campus-ui";

const CELL = 11;
const GAP = 3;

function levelColor(count) {
  if (count === 0) return CAMPUS.line;
  if (count === 1) return tint(CAMPUS.good, 35);
  if (count <= 3) return tint(CAMPUS.good, 65);
  return CAMPUS.good;
}

export function CampusActivityHeatmap({ dates, loading = false }) {
  const [hover, setHover] = useState(null);
  const { weeks, monthMarkers, total, activeDays, maxStreak } = useMemo(
    () => (dates ? buildActivityWeeks(dates) : { weeks: [], monthMarkers: [], total: 0, activeDays: 0, maxStreak: 0 }),
    [dates],
  );

  if (loading) {
    return (
      <CampusCard glass className="p-5">
        <CampusSkeleton variant="rect" height={90} />
      </CampusCard>
    );
  }

  return (
    <CampusCard glass className="p-5">
      <div className="flex items-center gap-4 mb-3 flex-wrap">
        <p className="text-[12px]" style={{ color: CAMPUS.inkSoft }}>{total} submission{total === 1 ? "" : "s"} in the last year</p>
        <p className="text-[12px]" style={{ color: CAMPUS.inkSoft }}>{activeDays} active days</p>
        <p className="text-[12px]" style={{ color: CAMPUS.inkSoft }}>longest run: {maxStreak}d</p>
      </div>
      <div className="overflow-x-auto">
        <div style={{ position: "relative", height: 14, marginLeft: 18, width: weeks.length * (CELL + GAP) }}>
          {monthMarkers.map(m => (
            <span key={m.wi} className="text-[9px]" style={{ position: "absolute", left: m.wi * (CELL + GAP), color: CAMPUS.inkFaint }}>{m.label}</span>
          ))}
        </div>
        <div className="flex gap-[3px]">
          <div className="flex flex-col gap-[3px] mr-1.5" style={{ width: 14 }}>
            {["", "Mon", "", "Wed", "", "Fri", ""].map((l, i) => (
              <span key={i} className="text-[8px]" style={{ height: CELL, lineHeight: `${CELL}px`, color: CAMPUS.inkFaint }}>{l}</span>
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
      <p className="text-[11px] mt-2 h-4" style={{ color: CAMPUS.inkFaint }}>
        {hover ? `${hover.count} submission${hover.count === 1 ? "" : "s"} on ${hover.date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}` : ""}
      </p>
    </CampusCard>
  );
}
