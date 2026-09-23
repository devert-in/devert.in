"use client";

// MCQ renderer shared by learn / practice / exams.
// Two modes: interactive (pick an option) and revealed (correct/incorrect
// coloring + explanation). The parent owns `chosen` and `revealed` state.

import { Check, X, Lightbulb } from "lucide-react";
import { cn, MarkdownBlock, NeonBadge, Tag } from "@/components/prep/ui";
import { CATEGORY_MAP, DIFFICULTY_MAP } from "@/lib/prep/constants";

const LETTERS = ["A", "B", "C", "D"];

function optionClasses({ revealed, isChosen, isCorrect }) {
  if (revealed) {
    if (isCorrect) {
      return {
        row: "border-neon-green/60 bg-neon-green/10 text-white",
        letter: "border-neon-green/60 text-neon-green",
      };
    }
    if (isChosen) {
      return {
        row: "border-[#FF3B3B]/60 bg-[#FF3B3B]/10 text-white",
        letter: "border-[#FF3B3B]/60 text-[#FF3B3B]",
      };
    }
    return {
      row: "border-white/8 bg-transparent text-white/35",
      letter: "border-white/10 text-white/30",
    };
  }
  if (isChosen) {
    return {
      row: "border-neon-cyan/50 bg-neon-cyan/10 text-white",
      letter: "border-neon-cyan/60 text-neon-cyan",
    };
  }
  return {
    row: "border-white/10 bg-white/[0.02] text-white/70 hover:border-neon-cyan/30 hover:bg-neon-cyan/5",
    letter: "border-white/15 text-white/40",
  };
}

function QuestionCard({ question, chosen, onChoose, revealed = false, index, showMeta = false, className }) {
  if (!question) return null;

  const options = Array.isArray(question.options) ? question.options : [];
  const correctIndex = question.correctIndex;
  const answered = typeof chosen === "number";
  const wasCorrect = answered && chosen === correctIndex;
  const category = CATEGORY_MAP[question.category];
  const difficulty = DIFFICULTY_MAP[question.difficulty];
  const qLabel = typeof index === "number" ? `Q${String(index + 1).padStart(2, "0")}` : null;

  return (
    <div className={cn("min-w-0", className)}>
      {showMeta && (
        <div className="flex items-center gap-1.5 flex-wrap mb-3">
          {category && <NeonBadge color={category.color}>{category.label.toUpperCase()}</NeonBadge>}
          {difficulty && <NeonBadge color={difficulty.color}>{difficulty.label}</NeonBadge>}
          {question.topic && <Tag>{question.topic}</Tag>}
        </div>
      )}

      <div className="flex items-start gap-3 mb-4">
        {qLabel && (
          <span className="font-mono text-xs text-neon-cyan/70 pt-0.5 flex-shrink-0">{qLabel}</span>
        )}
        <MarkdownBlock className="flex-1">{question.prompt || ""}</MarkdownBlock>
      </div>

      <div
        role="radiogroup"
        aria-label={qLabel ? `Options for question ${index + 1}` : "Answer options"}
        className="space-y-2"
      >
        {options.map((opt, i) => {
          const isChosen = chosen === i;
          const isCorrect = i === correctIndex;
          const cls = optionClasses({ revealed, isChosen, isCorrect });
          return (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={isChosen}
              disabled={revealed}
              onClick={() => {
                if (!revealed) onChoose?.(i);
              }}
              className={cn(
                "w-full flex items-start gap-3 text-left rounded-lg border px-4 py-3 transition-colors",
                revealed ? "cursor-default" : "cursor-pointer",
                cls.row
              )}
            >
              <span
                className={cn(
                  "w-6 h-6 rounded border flex items-center justify-center font-mono text-[11px] flex-shrink-0 mt-0.5",
                  cls.letter
                )}
              >
                {LETTERS[i] || i + 1}
              </span>
              <MarkdownBlock inheritColor className="flex-1 pt-0.5">
                {typeof opt === "string" ? opt : String(opt ?? "")}
              </MarkdownBlock>
              {revealed && isCorrect && (
                <Check size={15} className="text-neon-green flex-shrink-0 mt-1" aria-label="Correct answer" />
              )}
              {revealed && isChosen && !isCorrect && (
                <X size={15} className="text-[#FF3B3B] flex-shrink-0 mt-1" aria-label="Your incorrect answer" />
              )}
            </button>
          );
        })}
      </div>

      {revealed && (
        <div className="mt-4 space-y-3">
          {answered && (
            <p
              className="font-mono text-[11px] tracking-wider"
              style={{ color: wasCorrect ? "#00FF41" : "#FF3B3B" }}
            >
              {wasCorrect
                ? "✓ CORRECT"
                : `✗ INCORRECT - correct answer: ${LETTERS[correctIndex] ?? "?"}`}
            </p>
          )}
          {question.explanation && (
            <div className="rounded-lg border border-[#FFD700]/25 bg-[#FFD700]/[0.04] p-4">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb size={13} className="text-[#FFD700]" />
                <span className="font-mono text-[10px] tracking-wider text-[#FFD700]/80">
                  EXPLANATION
                </span>
              </div>
              <MarkdownBlock>{question.explanation}</MarkdownBlock>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default QuestionCard;
export { QuestionCard };
