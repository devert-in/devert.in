"use client";

// Recharts wrappers for /prep/analytics - neon-styled dark grid, cyan/green
// strokes. Kept in a dedicated module so the page can next/dynamic-import it
// (recharts is one of the heavier deps in the bundle - design §8).

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";

const GRID_STROKE = "rgba(255,255,255,0.07)";
const AXIS_TICK = { fill: "rgba(255,255,255,0.35)", fontSize: 10, fontFamily: "var(--font-jetbrains-mono), monospace" };
const TOOLTIP_STYLE = {
  background: "rgba(8,8,8,0.96)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 6,
  fontFamily: "var(--font-jetbrains-mono), monospace",
  fontSize: 11,
  color: "#e8e8e8",
};

/** data: [{ category, label, accuracy, color }] */
export function CategoryAccuracyChart({ data = [] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid stroke={GRID_STROKE} vertical={false} />
        <XAxis dataKey="label" tick={AXIS_TICK} axisLine={{ stroke: GRID_STROKE }} tickLine={false} />
        <YAxis domain={[0, 100]} tick={AXIS_TICK} axisLine={{ stroke: GRID_STROKE }} tickLine={false} width={34} />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          cursor={{ fill: "rgba(255,255,255,0.04)" }}
          formatter={(v) => [`${Math.round(v)}%`, "accuracy"]}
        />
        <Bar dataKey="accuracy" radius={[3, 3, 0, 0]} maxBarSize={40}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.color || "#00FFFF"} fillOpacity={0.75} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/** data: [{ date, attempts, correct }] */
export function AttemptsOverTimeChart({ data = [] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id="prepAttemptsFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00FFFF" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#00FFFF" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="prepCorrectFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00FF41" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#00FF41" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={GRID_STROKE} vertical={false} />
        <XAxis dataKey="date" tick={AXIS_TICK} axisLine={{ stroke: GRID_STROKE }} tickLine={false} />
        <YAxis allowDecimals={false} tick={AXIS_TICK} axisLine={{ stroke: GRID_STROKE }} tickLine={false} width={28} />
        <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ stroke: "rgba(255,255,255,0.15)" }} />
        <Area type="monotone" dataKey="attempts" stroke="#00FFFF" strokeWidth={1.5} fill="url(#prepAttemptsFill)" name="attempted" />
        <Area type="monotone" dataKey="correct" stroke="#00FF41" strokeWidth={1.5} fill="url(#prepCorrectFill)" name="correct" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
