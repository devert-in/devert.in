"use client";

import { Newspaper, Rocket, Briefcase, Flame } from "lucide-react";
import { ComingSoonShell } from "@/components/coming-soon-shell";

export default function StoriesPage() {
  return (
    <ComingSoonShell
      icon={Newspaper} color="#FFD700" label="stories.new"
      title="NOT TUTORIALS. NOT COURSES. STORIES."
      tagline="Real developer journeys from the DeVert community - what actually happens, not a highlight reel."
      description="Once this ships: written by real DeVert builders about what they shipped, what failed, and what they'd do differently - not staff-authored content marketing."
      previewItems={[
        { icon: Rocket,    title: "Build Stories",   body: "\"How a 3rd-year student built his first SaaS.\"" },
        { icon: Briefcase, title: "Career Stories",  body: "\"I failed 5 interviews before getting my first internship.\"" },
        { icon: Flame,     title: "Hackathon Stories", body: "\"What actually happens inside a 24-hour hackathon?\"" },
        { icon: Newspaper, title: "From the Community", body: "Written by DeVert builders, not staff - real accounts, not marketing copy." },
      ]}
    />
  );
}
