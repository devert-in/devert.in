import { useState } from "react";
import { MessageSquareQuote } from "lucide-react";
import type { Experience } from "@/lib/data/experiences";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/experiences/status-badge";
import { DifficultyStars } from "@/components/experiences/difficulty-stars";
import { ExperienceDialog } from "@/components/experiences/experience-dialog";

export function ExperienceCard({ experience }: { experience: Experience }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Card className="card-hover flex h-full flex-col">
        <CardContent className="flex h-full flex-col gap-3 p-6">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-bold">{experience.studentName}</h3>
              <p className="text-xs text-foreground/60">
                {experience.branch} · {experience.company} · {experience.role}
              </p>
            </div>
            <StatusBadge status={experience.status} />
          </div>

          <DifficultyStars rating={experience.difficulty} />

          <div className="flex flex-wrap gap-1.5">
            {experience.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-[10px]">
                {tag}
              </Badge>
            ))}
          </div>

          <p className="flex gap-2 text-sm text-foreground/65">
            <MessageSquareQuote size={16} className="mt-0.5 shrink-0 text-gold-600" />
            <span className="line-clamp-2">{experience.proTip}</span>
          </p>

          <Button variant="outline" size="sm" className="mt-auto" onClick={() => setOpen(true)}>
            Read Full Breakdown
          </Button>
        </CardContent>
      </Card>
      <ExperienceDialog experience={experience} open={open} onOpenChange={setOpen} />
    </>
  );
}
