"use client";

import { useMemo } from "react";
import { Users, Target, Award, BarChart3 } from "lucide-react";
import { StatTile, TerminalCard, DataTable, EmptyState } from "@/components/prep/ui";
import { HistogramChart, ClassComparisonChart } from "./ChartBits";
import { average, median, buildHistogram, pctColor, round1 } from "./facultyUtils";

const RANK_COLORS = ["#FFD700", "#C0C0C0", "#CD7F32"];

/**
 * records: recomputed submissions already scoped to the selected exam+group
 * (every record carries { uid, sub, score, pct }).
 * totalStudents: roster size for the same scope (attendance denominator).
 */
export function CohortSummaryTab({ exam, records, totalStudents, group }) {
  const submitted = useMemo(() => records.filter((r) => r.sub.status === "submitted"), [records]);
  const pcts = useMemo(() => submitted.map((r) => r.pct), [submitted]);

  const attendance = totalStudents > 0 ? round1((records.length / totalStudents) * 100) : 0;
  const avgPct = round1(average(pcts));
  const medianPct = round1(median(pcts));
  const maxPct = pcts.length ? round1(Math.max(...pcts)) : 0;

  const histogram = useMemo(() => buildHistogram(pcts), [pcts]);

  const top10 = useMemo(
    () =>
      [...submitted]
        .sort((a, b) => b.score.total - a.score.total || a.sub.rollNumber?.localeCompare(b.sub.rollNumber || "") || 0)
        .slice(0, 10),
    [submitted]
  );

  const crossClass = useMemo(() => {
    if (group !== "ALL") return null;
    const byGroup = new Map();
    submitted.forEach((r) => {
      const g = r.sub.classGroup || "UNASSIGNED";
      if (!byGroup.has(g)) byGroup.set(g, []);
      byGroup.get(g).push(r.pct);
    });
    return [...byGroup.entries()]
      .map(([name, list]) => ({ name, avg: round1(average(list)), count: list.length }))
      .sort((a, b) => b.avg - a.avg);
  }, [submitted, group]);

  if (!exam) {
    return <EmptyState title="pick an exam" message="Select an exam above to see the cohort summary." />;
  }

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile
          label="Attendance"
          value={`${records.length}/${totalStudents}`}
          sub={`${attendance}% attempted`}
          icon={Users}
          color="#00FFFF"
          delay={0}
        />
        <StatTile label="Average Score" value={`${avgPct}%`} sub={`${submitted.length} submitted`} icon={Target} color={pctColor(avgPct)} delay={0.05} />
        <StatTile label="Median Score" value={`${medianPct}%`} icon={BarChart3} color={pctColor(medianPct)} delay={0.1} />
        <StatTile label="Top Score" value={`${maxPct}%`} icon={Award} color="#FFD700" delay={0.15} />
      </div>

      <TerminalCard filename="score-distribution.chart" delay={0.15}>
        <p className="font-mono text-[10px] text-white/30 tracking-wider mb-3">SCORE_DISTRIBUTION (% buckets)</p>
        {submitted.length === 0 ? (
          <EmptyState title="no submissions" message="No one has submitted this exam yet." />
        ) : (
          <HistogramChart data={histogram} />
        )}
      </TerminalCard>

      {crossClass && (
        <TerminalCard filename="cross-class-comparison.chart" delay={0.2}>
          <p className="font-mono text-[10px] text-white/30 tracking-wider mb-3">AVG_SCORE_BY_CLASS_GROUP</p>
          {crossClass.length === 0 ? (
            <EmptyState title="no data" message="No submissions to compare across groups." />
          ) : (
            <ClassComparisonChart data={crossClass} colorOf={pctColor} />
          )}
        </TerminalCard>
      )}

      <TerminalCard filename="top-10.log" delay={0.25}>
        <p className="font-mono text-[10px] text-white/30 tracking-wider mb-3">TOP_10</p>
        <DataTable
          rows={top10}
          rowKey={(r) => r.uid}
          empty={<EmptyState title="no submissions" message="Top scorers appear once students submit." />}
          columns={[
            {
              key: "rank",
              label: "Rank",
              sortable: false,
              width: 60,
              render: (r) => {
                const i = top10.indexOf(r);
                return i < 3 ? (
                  <span className="font-sans font-bold" style={{ color: RANK_COLORS[i] }}>
                    #{i + 1}
                  </span>
                ) : (
                  <span className="text-white/40">#{i + 1}</span>
                );
              },
            },
            {
              key: "rollNumber",
              label: "Roll Number",
              sortValue: (r) => r.sub.rollNumber || "",
              render: (r) => <span className="text-neon-cyan font-semibold">{r.sub.rollNumber || "-"}</span>,
            },
            { key: "name", label: "Name", sortValue: (r) => r.sub.displayName || "", render: (r) => r.sub.displayName || "-" },
            {
              key: "score",
              label: "Score",
              align: "right",
              sortValue: (r) => r.score.total,
              render: (r) => (
                <span>
                  {r.score.total}/{r.score.max}{" "}
                  <span style={{ color: pctColor(r.pct) }}>({r.pct}%)</span>
                </span>
              ),
            },
          ]}
        />
      </TerminalCard>
    </div>
  );
}
