"use client";

import { GitFork, GitPullRequest, Sparkles, UserCheck } from "lucide-react";
import { ComingSoonShell } from "@/components/coming-soon-shell";

export default function OpenSourcePage() {
  return (
    <ComingSoonShell
      icon={GitFork} color="#00FF41" label="open-source.new"
      title="BUILD IN PUBLIC. CONTRIBUTE TO SOMETHING BIGGER."
      tagline="Find your first open-source contribution, tracked - not just a links page."
      description="Once this ships: browse good-first-issues by language, fork, contribute, and have the PR actually tracked against your DeVert profile - not a fake contribution graph."
      previewItems={[
        { icon: GitPullRequest, title: "Good First Issues",   body: "Curated, beginner-friendly issues filtered by language and project." },
        { icon: Sparkles,       title: "Contribution Challenges", body: "Time-boxed programs, DeVert's own Hacktoberfest-style events." },
        { icon: UserCheck,      title: "Contributor Profiles", body: "Real tracked PRs/issues, not a self-reported count." },
        { icon: GitFork,        title: "DeVert Open Source",   body: "DeVert's own repos, open for contribution from day one." },
      ]}
    />
  );
}
