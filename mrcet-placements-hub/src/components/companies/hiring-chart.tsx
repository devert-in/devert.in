"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useTheme } from "@/components/shared/theme-provider";
import { chartInk, brandSingle } from "@/lib/chart-colors";
import type { CompanyHireRecord } from "@/lib/data/companies";

export function HiringChart({ data }: { data: CompanyHireRecord[] }) {
  const { theme } = useTheme();
  const ink = theme === "dark" ? chartInk.dark : chartInk.light;
  const barColor = theme === "dark" ? brandSingle.goldDark : brandSingle.navyLight;

  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid stroke={ink.grid} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="year" tick={{ fill: ink.muted, fontSize: 11 }} axisLine={{ stroke: ink.grid }} tickLine={false} />
          <YAxis tick={{ fill: ink.muted, fontSize: 11 }} axisLine={{ stroke: ink.grid }} tickLine={false} width={30} />
          <Tooltip
            contentStyle={{
              background: theme === "dark" ? "#101d38" : "#ffffff",
              border: `1px solid ${ink.grid}`,
              borderRadius: 10,
              fontSize: 12,
            }}
          />
          <Bar dataKey="hires" name="Hires" fill={barColor} radius={[5, 5, 0, 0]} maxBarSize={36} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
