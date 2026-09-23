"use client";

// Coding practice flow: prompt (markdown) + CodeRunner wired to the
// question's starterCode/testCases. Public tests show full detail; hidden
// tests (CodeRunner already handles this) show pass/fail only. Same
// login-gate pattern as the MCQ modal - browsing the list needs no auth.

import { LogIn, Shuffle } from "lucide-react";
import { PrepModal, BracketButton, MarkdownBlock, NeonBadge, Tag } from "@/components/prep/ui";
import CodeRunner from "@/components/prep/CodeRunner";
import { CATEGORY_MAP, DIFFICULTY_MAP } from "@/lib/prep/constants";

export default function CodingPracticeModal({ open, question, user, onResult, onNext, onClose }) {
  if (!question) return null;

  const category = CATEGORY_MAP[question.category];
  const difficulty = DIFFICULTY_MAP[question.difficulty];

  return (
    <PrepModal
      open={open}
      onClose={onClose}
      filename={`${question.id || "question"}.coding`}
      maxWidth="max-w-4xl"
      footer={
        user ? (
          <>
            <BracketButton variant="ghost" onClick={onClose}>
              CLOSE
            </BracketButton>
            <BracketButton variant="green" onClick={onNext}>
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
      <div className="flex items-center gap-1.5 flex-wrap mb-3">
        {category && <NeonBadge color={category.color}>{category.label.toUpperCase()}</NeonBadge>}
        {difficulty && <NeonBadge color={difficulty.color}>{difficulty.label}</NeonBadge>}
        {question.topic && <Tag>{question.topic}</Tag>}
      </div>

      <MarkdownBlock className="mb-5">{question.prompt || ""}</MarkdownBlock>

      {user ? (
        <CodeRunner
          question={question}
          starterCode={question.starterCode}
          testCases={question.testCases}
          onResult={onResult}
          heightClass="h-72"
        />
      ) : (
        <div className="flex flex-col items-center text-center gap-3 py-10 border border-dashed border-white/10 rounded-lg">
          <LogIn size={22} className="text-white/25" />
          <p className="font-mono text-xs text-white/40 tracking-wider">LOGIN REQUIRED</p>
          <p className="font-mono text-[11px] text-white/30 max-w-xs leading-relaxed">
            Sign in to run code, execute test cases, and track your attempts.
          </p>
        </div>
      )}
    </PrepModal>
  );
}
