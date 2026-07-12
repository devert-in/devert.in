"use client";

// Numbered question-jump grid used by the weekend-test runner. Pure
// presentational component — the parent owns which questions are answered /
// marked / current.

import { Flag } from "lucide-react";
import { cn } from "@/components/prep/ui";

export function QuestionPalette({ total, current, answeredSet, markedSet, onJump, className }) {
  return (
    <div className={cn("grid grid-cols-5 gap-1.5 sm:grid-cols-4", className)} role="group" aria-label="Question palette">
      {Array.from({ length: total }).map((_, idx) => {
        const isCurrent = idx === current;
        const isAnswered = answeredSet?.has(idx);
        const isMarked = markedSet?.has(idx);
        return (
          <button
            key={idx}
            type="button"
            onClick={() => onJump(idx)}
            aria-current={isCurrent ? "true" : undefined}
            aria-label={`Question ${idx + 1}${isAnswered ? ", answered" : ", blank"}${isMarked ? ", marked for review" : ""}`}
            className={cn(
              "relative aspect-square rounded font-mono text-[11px] flex items-center justify-center border transition-colors cursor-pointer",
              isCurrent
                ? "border-neon-cyan text-neon-cyan bg-neon-cyan/10"
                : isAnswered
                  ? "border-neon-green/50 text-neon-green/90 bg-neon-green/5 hover:bg-neon-green/10"
                  : "border-white/10 text-white/25 hover:border-white/25 hover:text-white/45"
            )}
          >
            {idx + 1}
            {isMarked && (
              <Flag
                size={9}
                className="absolute -top-1 -right-1 text-[#FFD700] fill-[#FFD700]"
                aria-hidden="true"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

export default QuestionPalette;
