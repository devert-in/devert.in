"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useTheme } from "@/components/shared/theme-provider";
import { chartInk, brandSingle } from "@/lib/chart-colors";
import { ctcTierDistribution } from "@/lib/data/placements";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function CtcAreaChart() {
  const { theme } = useTheme();
  const ink = theme === "dark" ? chartInk.dark : chartInk.light;
  const strokeColor = theme === "dark" ? brandSingle.goldDark : brandSingle.navyLight;
  const data = ctcTierDistribution();

  return (
    <Card>
      <CardHeader>
        <CardTitle>CTC Distribution Across Tiers</CardTitle>
        <CardDescription>Number of students placed within each package tier.</CardDescription>
      </CardHeader>
      <CardContent className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
            <defs>
              <linearGradient id="ctcFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={strokeColor} stopOpacity={0.45} />
                <stop offset="100%" stopColor={strokeColor} stopOpacity={0.03} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={ink.grid} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="tier" tick={{ fill: ink.muted, fontSize: 12 }} axisLine={{ stroke: ink.grid }} tickLine={false} />
            <YAxis tick={{ fill: ink.muted, fontSize: 12 }} axisLine={{ stroke: ink.grid }} tickLine={false} width={36} />
            <Tooltip
              contentStyle={{
                background: theme === "dark" ? "#101d38" : "#ffffff",
                border: `1px solid ${ink.grid}`,
                borderRadius: 10,
                fontSize: 13,
              }}
              labelStyle={{ color: ink.primary, fontWeight: 700 }}
            />
            <Area
              type="monotone"
              dataKey="students"
              name="Students"
              stroke={strokeColor}
              strokeWidth={2.5}
              fill="url(#ctcFill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
