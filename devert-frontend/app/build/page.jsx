"use client";

import { Hammer, Rocket, Users, Trophy } from "lucide-react";
import { ComingSoonShell } from "@/components/coming-soon-shell";

export default function BuildPage() {
  return (
    <ComingSoonShell
      icon={Hammer} color="#FF9500" label="build.new"
      title="STOP LEARNING. START BUILDING."
      tagline="Guided build challenges and sprints - turn what you've learned into something real."
      description="Once this ships: pick a challenge (URL shortener, chatbot, distributed cache, AI app), a difficulty, and a timebox - then dock the result straight to Shipyard."
      previewItems={[
        { icon: Rocket,  title: "Build Challenges",  body: "Beginner to advanced project briefs across web, backend, mobile and AI." },
        { icon: Trophy,  title: "Build Sprints",     body: "7/14/30-day timeboxed builds with a clear brief and a shipped deadline." },
        { icon: Users,   title: "Team Builds",       body: "Pair up and build something together, not solo every time." },
        { icon: Hammer,  title: "Straight to Shipyard", body: "A finished build docks directly to your Shipyard profile - no separate submission flow." },
      ]}
    />
  );
}
