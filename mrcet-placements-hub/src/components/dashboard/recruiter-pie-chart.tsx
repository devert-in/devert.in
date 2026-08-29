"use client";

import { useMemo } from "react";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useTheme } from "@/components/shared/theme-provider";
import { categoricalDark, categoricalLight, chartInk, otherSliceColor } from "@/lib/chart-colors";
import { recruiterShare } from "@/lib/data/placements";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const TOP_SLOT_COUNT = 7;

export function RecruiterPieChart() {
  const { theme } = useTheme();
  const ink = theme === "dark" ? chartInk.dark : chartInk.light;
  const palette = theme === "dark" ? categoricalDark : categoricalLight;
  const otherColor = theme === "dark" ? otherSliceColor.dark : otherSliceColor.light;

  const data = useMemo(() => {
    const sorted = [...recruiterShare()].sort((a, b) => b.count - a.count);
    const top = sorted.slice(0, TOP_SLOT_COUNT);
    const rest = sorted.slice(TOP_SLOT_COUNT);
    const otherTotal = rest.reduce((sum, entry) => sum + entry.count, 0);
    const entries = top.map((entry, index) => ({
      name: entry.company,
      value: entry.count,
      color: palette[index % palette.length],
    }));
    if (otherTotal > 0) {
      entries.push({
        name: `Other (${rest.map((r) => r.company).join(", ")})`,
        value: otherTotal,
        color: otherColor,
      });
    }
    return entries;
  }, [palette, otherColor]);

  const total = data.reduce((sum, entry) => sum + entry.value, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recruiter Hiring Share</CardTitle>
        <CardDescription>Proportion of total offers contributed by each recruiter.</CardDescription>
      </CardHeader>
      <CardContent className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="45%"
              outerRadius="80%"
              paddingAngle={2}
              stroke={theme === "dark" ? "#101d38" : "#ffffff"}
              strokeWidth={2}
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => {
                const numeric = typeof value === "number" ? value : Number(value);
                return [`${numeric} hires (${((numeric / total) * 100).toFixed(0)}%)`, name];
              }}
              contentStyle={{
                background: theme === "dark" ? "#101d38" : "#ffffff",
                border: `1px solid ${ink.grid}`,
                borderRadius: 10,
                fontSize: 12,
              }}
            />
            <Legend
              layout="vertical"
              verticalAlign="middle"
              align="right"
              wrapperStyle={{ fontSize: 12, color: ink.secondary, lineHeight: "20px" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
