import type { Metadata } from "next";
import { RecordsTable } from "@/components/dashboard/records-table";
import { OffersBarChart } from "@/components/dashboard/offers-bar-chart";
import { RecruiterPieChart } from "@/components/dashboard/recruiter-pie-chart";
import { CtcAreaChart } from "@/components/dashboard/ctc-area-chart";
import { WallOfFame } from "@/components/dashboard/wall-of-fame";

export const metadata: Metadata = {
  title: "Placements Dashboard | MRCET Placements Hub",
  description: "Filterable placement records and analytics for MRCET campus recruitment.",
};

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-10 px-4 py-10 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Placements Dashboard & Analytics</h1>
        <p className="mt-2 max-w-2xl text-sm text-foreground/60 sm:text-base">
          Explore historical placement records and recruitment trends across departments, years, and recruiter
          categories.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <OffersBarChart />
        <RecruiterPieChart />
        <div className="lg:col-span-2">
          <CtcAreaChart />
        </div>
      </div>

      <WallOfFame />

      <RecordsTable />
    </div>
  );
}
