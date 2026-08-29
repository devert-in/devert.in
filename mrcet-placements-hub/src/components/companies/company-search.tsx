"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { companies } from "@/lib/data/companies";
import { Input } from "@/components/ui/input";
import { CompanyCard } from "@/components/companies/company-card";

export function CompanySearch() {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return companies;
    return companies.filter((company) =>
      [company.name, company.sector, company.type].some((field) => field.toLowerCase().includes(q))
    );
  }, [query]);

  return (
    <div>
      <div className="relative mb-8 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" size={17} />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search companies by name, sector, or type..."
          aria-label="Search companies"
          className="pl-10"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="py-16 text-center text-sm text-foreground/60">
          No companies match &ldquo;{query}&rdquo;. Try a different search term.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((company) => (
            <CompanyCard key={company.slug} company={company} />
          ))}
        </div>
      )}
    </div>
  );
}
