"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, PlusCircle } from "lucide-react";
import { experiences as initialExperiences, allExperienceTags, type Experience } from "@/lib/data/experiences";
import { ExperienceCard } from "@/components/experiences/experience-card";
import { ExperienceFilters } from "@/components/experiences/experience-filters";
import { ShareExperienceDialog } from "@/components/experiences/share-experience-dialog";
import { Button } from "@/components/ui/button";

export function ExperiencesFeed() {
  const [experiences, setExperiences] = useState<Experience[]>(initialExperiences);
  const [query, setQuery] = useState("");
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [shareOpen, setShareOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return experiences.filter((experience) => {
      const matchesQuery =
        !q || experience.company.toLowerCase().includes(q) || experience.studentName.toLowerCase().includes(q);
      const matchesTags = activeTags.length === 0 || activeTags.every((tag) => experience.tags.includes(tag));
      return matchesQuery && matchesTags;
    });
  }, [experiences, query, activeTags]);

  function toggleTag(tag: string) {
    setActiveTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }

  function handleSubmit(experience: Experience) {
    setExperiences((prev) => [experience, ...prev]);
    setShowSuccess(true);
    window.setTimeout(() => setShowSuccess(false), 5000);
  }

  return (
    <div>
      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Interview Experiences</h1>
          <p className="mt-2 max-w-2xl text-sm text-foreground/60 sm:text-base">
            Real, round-by-round interview breakdowns shared by MRCET seniors.
          </p>
        </div>
        <Button onClick={() => setShareOpen(true)} className="gap-2">
          <PlusCircle size={16} />
          Share Your Experience
        </Button>
      </div>

      {showSuccess && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300">
          <CheckCircle2 size={17} />
          Thanks for sharing! Your experience is now live at the top of the feed.
        </div>
      )}

      <ExperienceFilters
        query={query}
        onQueryChange={setQuery}
        tags={allExperienceTags}
        activeTags={activeTags}
        onToggleTag={toggleTag}
      />

      {filtered.length === 0 ? (
        <p className="py-16 text-center text-sm text-foreground/60">
          No experiences match your filters. Try clearing a tag or search term.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((experience) => (
            <ExperienceCard key={experience.id} experience={experience} />
          ))}
        </div>
      )}

      <ShareExperienceDialog open={shareOpen} onOpenChange={setShareOpen} onSubmit={handleSubmit} />
    </div>
  );
}
