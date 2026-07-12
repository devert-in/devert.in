"use client";

// Small recharts wrappers styled to match the Devert terminal aesthetic —
// dark tooltip card, faint grid, neon bars. Kept local to /prep/faculty
// since no other feature currently needs a bar chart like this.

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

function ChartTooltip({ active, payload, label, valueSuffix = "" }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div
      className="font-mono text-[11px] px-3 py-2 rounded"
      style={{ background: "rgba(5,5,5,0.96)", border: "1px solid rgba(255,255,255,0.12)" }}
    >
      <p className="text-white/50 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color || p.fill }}>
          {p.value}
          {valueSuffix}
        </p>
      ))}
    </div>
  );
}

/** Score-distribution histogram: data = [{ label, count }]. */
export function HistogramChart({ data, color = "#00FFFF", height = 220 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10, fontFamily: "var(--font-jetbrains-mono)" }}
          axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10, fontFamily: "var(--font-jetbrains-mono)" }}
          axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
          tickLine={false}
          width={28}
        />
        <Tooltip content={<ChartTooltip valueSuffix=" students" />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
        <Bar dataKey="count" radius={[3, 3, 0, 0]} fill={color} fillOpacity={0.75} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Cross-class comparison: data = [{ name, avg }]. Bars colored by pctColor. */
export function ClassComparisonChart({ data, colorOf, height = 220 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10, fontFamily: "var(--font-jetbrains-mono)" }}
          axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
          tickLine={false}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10, fontFamily: "var(--font-jetbrains-mono)" }}
          axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
          tickLine={false}
          width={28}
        />
        <Tooltip content={<ChartTooltip valueSuffix="% avg" />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
        <Bar dataKey="avg" radius={[3, 3, 0, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={colorOf ? colorOf(d.avg) : "#00FFFF"} fillOpacity={0.8} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Compact inline A/B/C/D option-distribution mini bars for a table cell. */
export function OptionMiniBars({ counts, correctIndex }) {
  if (!Array.isArray(counts)) return <span className="text-white/20">—</span>;
  const max = Math.max(1, ...counts);
  const labels = ["A", "B", "C", "D"];
  return (
    <div className="flex items-end gap-1.5 h-8">
      {counts.map((c, i) => (
        <div key={i} className="flex flex-col items-center gap-0.5" title={`${labels[i]}: ${c}`}>
          <div
            className="w-3 rounded-t"
            style={{
              height: `${Math.max(2, (c / max) * 20)}px`,
              background: i === correctIndex ? "#00FF41" : "rgba(255,255,255,0.2)",
              boxShadow: i === correctIndex && c > 0 ? "0 0 6px rgba(0,255,65,0.4)" : "none",
            }}
          />
          <span
            className="text-[8px] font-mono"
            style={{ color: i === correctIndex ? "#00FF41" : "rgba(255,255,255,0.25)" }}
          >
            {labels[i]}
          </span>
        </div>
      ))}
    </div>
  );
}
