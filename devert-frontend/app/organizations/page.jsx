"use client";

import { Building2, Flame, Briefcase, Users } from "lucide-react";
import { ComingSoonShell } from "@/components/coming-soon-shell";

export default function OrganizationsPage() {
  return (
    <ComingSoonShell
      icon={Building2} color="#C77DFF" label="organizations.new"
      title="COMPANIES, ON THE DEVELOPER SIDE OF DEVERT."
      tagline="A profile for companies and developer organizations - not a job board, a real presence in the ecosystem."
      description="Once this ships: a company can host a hackathon, run a workshop, post an opportunity or sponsor an event, all under one organization profile developers can follow."
      previewItems={[
        { icon: Flame,      title: "Host Events",        body: "Hackathons and workshops run through the same Events engine, org-branded." },
        { icon: Briefcase,  title: "Post Opportunities",  body: "Internships and jobs surfaced directly to developers already on DeVert." },
        { icon: Users,      title: "Recruit Directly",   body: "See who registered for your event or applied to your opportunity." },
        { icon: Building2,  title: "Organization Profile", body: "A real presence - not a login page bolted onto someone else's product." },
      ]}
    />
  );
}
