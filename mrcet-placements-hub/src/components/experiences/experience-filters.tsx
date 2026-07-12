"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ExperienceFiltersProps {
  query: string;
  onQueryChange: (value: string) => void;
  tags: string[];
  activeTags: string[];
  onToggleTag: (tag: string) => void;
}

export function ExperienceFilters({ query, onQueryChange, tags, activeTags, onToggleTag }: ExperienceFiltersProps) {
  return (
    <div className="mb-8 flex flex-col gap-4">
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" size={17} />
        <Input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search by company or student name..."
          aria-label="Search experiences"
          className="pl-10"
        />
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by tag">
        {tags.map((tag) => {
          const active = activeTags.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              onClick={() => onToggleTag(tag)}
              aria-pressed={active}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                active
                  ? "border-transparent bg-navy-gradient text-white"
                  : "border-border-subtle text-foreground/65 hover:bg-surface-muted"
              )}
            >
              {tag}
            </button>
          );
        })}
      </div>
    </div>
  );
}
