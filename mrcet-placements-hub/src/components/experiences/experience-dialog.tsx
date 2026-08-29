import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { Experience } from "@/lib/data/experiences";
import { StatusBadge } from "@/components/experiences/status-badge";
import { DifficultyStars } from "@/components/experiences/difficulty-stars";
import { Lightbulb } from "lucide-react";

const CODE_HINT = /coding|algorithm|program|dsa|whiteboard|leetcode|live-cod|pseudocode|complexity|implement|recursion/i;

export function ExperienceDialog({
  experience,
  open,
  onOpenChange,
}: {
  experience: Experience | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!experience) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {experience.studentName} · {experience.company}
          </DialogTitle>
          <DialogDescription>
            {experience.branch} · {experience.role}
          </DialogDescription>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <StatusBadge status={experience.status} />
            <DifficultyStars rating={experience.difficulty} />
          </div>
        </DialogHeader>

        <div className="flex flex-wrap gap-1.5">
          {experience.tags.map((tag) => (
            <Badge key={tag} variant="outline">
              {tag}
            </Badge>
          ))}
        </div>

        <div className="flex flex-col gap-4">
          {experience.rounds.map((round, index) => {
            const isCode = CODE_HINT.test(round.description);
            return (
              <div key={round.roundName}>
                <p className="text-xs font-bold uppercase tracking-wide text-gold-600">
                  Round {index + 1} · {round.roundName}
                </p>
                {isCode ? (
                  <pre className="mt-1.5 whitespace-pre-wrap rounded-lg bg-navy-950 p-3.5 font-mono text-xs leading-relaxed text-emerald-300">
                    {round.description}
                  </pre>
                ) : (
                  <p className="mt-1.5 text-sm leading-relaxed text-foreground/70">{round.description}</p>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex gap-2.5 rounded-xl bg-gold-100/60 p-4 dark:bg-gold-500/10">
          <Lightbulb size={18} className="mt-0.5 shrink-0 text-gold-600" />
          <p className="text-sm text-foreground/75">
            <span className="font-bold">Pro tip for juniors: </span>
            {experience.proTip}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
