import type { Metadata } from "next";
import { CompanySearch } from "@/components/companies/company-search";

export const metadata: Metadata = {
  title: "Companies | MRCET Placements Hub",
  description: "Directory of top recruiters visiting MRCET campus with eligibility and recruitment pattern details.",
};

export default function CompaniesPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Company Directory</h1>
        <p className="mt-2 max-w-2xl text-sm text-foreground/60 sm:text-base">
          Explore recruiters that visit MRCET — eligibility criteria, recruitment patterns, and historical hiring
          data, all in one place.
        </p>
      </div>
      <CompanySearch />
    </div>
  );
}
