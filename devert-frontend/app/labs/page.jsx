"use client";

import { FlaskConical, Cpu, Database, Cloud } from "lucide-react";
import { ComingSoonShell } from "@/components/coming-soon-shell";

export default function LabsPage() {
  return (
    <ComingSoonShell
      icon={FlaskConical} color="#00FFFF" label="labs.new"
      title="LEARN SOMETHING. IMMEDIATELY EXPERIMENT WITH IT."
      tagline="A developer playground - AI, APIs, databases, cloud, system design - no setup required."
      description="Once this ships: sandboxed environments to try an idea in minutes, not a course - the thing you'd otherwise spin up a local project just to test."
      previewItems={[
        { icon: Cpu,      title: "AI Lab",           body: "Experiment with models and prompts directly in the browser." },
        { icon: Database, title: "Database Lab",     body: "Run real SQL against a sandboxed dataset." },
        { icon: Cloud,    title: "Cloud & System Design Lab", body: "Try infrastructure and architecture concepts hands-on." },
        { icon: FlaskConical, title: "API Lab",      body: "Hit real endpoints and inspect responses without Postman." },
      ]}
    />
  );
}
