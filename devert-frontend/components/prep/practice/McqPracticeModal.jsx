"use client";

// MCQ practice flow: answer -> instant reveal (QuestionCard handles the
// correct/incorrect coloring + explanation) -> NEXT_RANDOM once revealed.
// Unauthenticated visitors can browse the question list but this modal shows
// a login gate instead of the interactive question (attempts are per-user).

import { LogIn, Shuffle } from "lucide-react";
import { PrepModal, BracketButton } from "@/components/prep/ui";
import QuestionCard from "@/components/prep/QuestionCard";

export default function McqPracticeModal({ open, question, user, chosen, revealed, onChoose, onNext, onClose }) {
  if (!question) return null;

  return (
    <PrepModal
      open={open}
      onClose={onClose}
      filename={`${question.id || "question"}.mcq`}
      maxWidth="max-w-2xl"
      footer={
        user ? (
          <>
            <BracketButton variant="ghost" onClick={onClose}>
              CLOSE
            </BracketButton>
            <BracketButton variant="green" onClick={onNext} disabled={!revealed} title={!revealed ? "Answer the question first" : "Load another question"}>
              <Shuffle size={11} /> NEXT_RANDOM
            </BracketButton>
          </>
        ) : (
          <BracketButton variant="cyan" href="/login">
            LOGIN_TO_PRACTICE
          </BracketButton>
        )
      }
    >
      {user ? (
        <QuestionCard question={question} chosen={chosen} onChoose={onChoose} revealed={revealed} showMeta />
      ) : (
        <div className="flex flex-col items-center text-center gap-3 py-10">
          <LogIn size={22} className="text-white/25" />
          <p className="font-mono text-xs text-white/40 tracking-wider">LOGIN REQUIRED</p>
          <p className="font-mono text-[11px] text-white/30 max-w-xs leading-relaxed">
            Sign in to answer questions, get instant explanations, and build your practice streak.
          </p>
        </div>
      )}
    </PrepModal>
  );
}
