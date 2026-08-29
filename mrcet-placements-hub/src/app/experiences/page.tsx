import type { Metadata } from "next";
import { ExperiencesFeed } from "@/components/experiences/experiences-feed";

export const metadata: Metadata = {
  title: "Interview Experiences | MRCET Placements Hub",
  description: "Round-by-round interview experiences shared by MRCET students across top recruiters.",
};

export default function ExperiencesPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <ExperiencesFeed />
    </div>
  );
}
