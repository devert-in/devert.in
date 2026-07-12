import type { Metadata } from "next";
import { CompanyRepository } from "@/components/practice/company-repository";
import { CategoryExplorer } from "@/components/practice/category-explorer";

export const metadata: Metadata = {
  title: "Practice & Sample Papers | MRCET Placements Hub",
  description: "Company-wise sample papers, coding questions, and category-wise practice resources for MRCET students.",
};

export default function PracticePage() {
  return (
    <div className="mx-auto max-w-7xl space-y-14 px-4 py-10 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Practice & Sample Papers</h1>
        <p className="mt-2 max-w-2xl text-sm text-foreground/60 sm:text-base">
          Company-specific preparation kits and category-wise curated topics to help you prepare with focus.
        </p>
      </div>

      <section>
        <h2 className="mb-6 text-xl font-extrabold tracking-tight sm:text-2xl">Company-Wise Repository</h2>
        <CompanyRepository />
      </section>

      <section>
        <h2 className="mb-6 text-xl font-extrabold tracking-tight sm:text-2xl">Category-Wise Practice Bank</h2>
        <CategoryExplorer />
      </section>
    </div>
  );
}
