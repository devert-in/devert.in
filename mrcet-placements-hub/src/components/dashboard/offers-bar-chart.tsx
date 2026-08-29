"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useTheme } from "@/components/shared/theme-provider";
import { chartInk, brandSingle } from "@/lib/chart-colors";
import { offersByYear } from "@/lib/data/placements";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function OffersBarChart() {
  const { theme } = useTheme();
  const ink = theme === "dark" ? chartInk.dark : chartInk.light;
  const barColor = theme === "dark" ? brandSingle.goldDark : brandSingle.navyLight;
  const data = offersByYear();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Year-on-Year Placement Offers</CardTitle>
        <CardDescription>Total offers extended across the last five academic years.</CardDescription>
      </CardHeader>
      <CardContent className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
            <CartesianGrid stroke={ink.grid} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="year" tick={{ fill: ink.muted, fontSize: 12 }} axisLine={{ stroke: ink.grid }} tickLine={false} />
            <YAxis tick={{ fill: ink.muted, fontSize: 12 }} axisLine={{ stroke: ink.grid }} tickLine={false} width={40} />
            <Tooltip
              cursor={{ fill: theme === "dark" ? "rgba(255,255,255,0.06)" : "rgba(15,44,89,0.06)" }}
              contentStyle={{
                background: theme === "dark" ? "#101d38" : "#ffffff",
                border: `1px solid ${ink.grid}`,
                borderRadius: 10,
                fontSize: 13,
              }}
              labelStyle={{ color: ink.primary, fontWeight: 700 }}
            />
            <Bar dataKey="offers" name="Offers" fill={barColor} radius={[6, 6, 0, 0]} maxBarSize={48} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
