"use client";

// Category-wise accuracy bars — shared by /prep/exams/review and /prep/analytics.
// items: [{ category, attempted, correct }]

import { ProgressBar } from "@/components/prep/ui";
import { CATEGORY_MAP } from "@/lib/prep/constants";

export function CategoryBreakdown({ items = [], className }) {
  if (!items.length) return null;
  return (
    <div className={className}>
      <div className="space-y-4">
        {items.map((row) => {
          const meta = CATEGORY_MAP[row.category];
          const pct = row.attempted > 0 ? (row.correct / row.attempted) * 100 : 0;
          return (
            <ProgressBar
              key={row.category}
              value={pct}
              color={meta?.color || "#00FFFF"}
              label={`${(meta?.label || row.category).toUpperCase()} — ${row.correct}/${row.attempted}`}
            />
          );
        })}
      </div>
    </div>
  );
}

export default CategoryBreakdown;
