"use client";

// Q1..Qn tab strip for the live contest runner, with an attempted checkmark
// per question (design §2: "question tabs ... with attempted state").

import { Check } from "lucide-react";
import { cn } from "@/components/prep/ui";

export default function QuestionTabs({ questions = [], activeIdx, onSelect, attempted = {} }) {
  if (!questions.length) return null;
  return (
    <div className="flex items-center gap-1.5 flex-wrap mb-5" role="tablist" aria-label="Questions">
      {questions.map((q, i) => {
        const isActive = i === activeIdx;
        const isDone = !!attempted[q.idx];
        return (
          <button
            key={q.idx}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelect(i)}
            className={cn(
              "font-mono text-[11px] px-3 py-1.5 rounded border transition-colors cursor-pointer inline-flex items-center gap-1.5",
              isActive
                ? "border-neon-cyan/60 bg-neon-cyan/10 text-neon-cyan"
                : "border-white/10 text-white/40 hover:border-white/25 hover:text-white/65"
            )}
          >
            Q{i + 1}
            {isDone && <Check size={10} className="text-neon-green" aria-label="attempted" />}
          </button>
        );
      })}
    </div>
  );
}
