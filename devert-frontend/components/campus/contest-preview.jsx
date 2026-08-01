"use client";

import { useState } from "react";
import {
  AlertTriangle, Check, Eye, EyeOff, FileText, ListChecks, Lock, X as XIcon,
} from "lucide-react";
import { CAMPUS } from "@/lib/campus-theme";
import { CampusChip, CampusSkeleton } from "@/components/campus/campus-ui";
import { Inline } from "@/components/campus/lesson-blocks";
import { useKeyedFetch } from "@/lib/useKeyedFetch";
import {
  fetchContestQuestions, fetchContestAnswerKeys,
  fetchContestQuestionSampleTests, fetchContestQuestionHiddenTests,
} from "@/lib/contests";

// Admin-only read-only preview of a contest's full paper.
//
// WHY THIS IS READ-ONLY, and not "attempt it as an admin". Taking the real
// attempt would write a real registration and a real submission, which feed
// participantCount, the leaderboard, and every average on the dashboard. One
// staff dry-run would sit in the III Year rankings forever and drag the
// reported average score. Proving the paper is correct does not require
// generating a fake participant - reading the questions with their answer keys
// beside them does, and it is strictly more informative than attempting blind.
// A genuine "admin practice attempt" needs a separate, analytics-excluded
// submission path; that is a real feature, not a flag on this one.
//
// THE HIDDEN TESTS ARE SHOWN HERE ON PURPOSE. This component is only ever
// rendered behind the institution-admin check that already guards the whole
// Manage surface, and firestore.rules independently refuses the read to anyone
// else - a non-admin who somehow rendered this gets empty arrays, not secrets.
// Being able to see them is the entire point: a wrong expectedOutput silently
// fails every submission, and there is no other place in the product to catch
// that before the contest starts.

export function ContestPreviewButton({ contestId, questionCount }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-lg"
        style={{ border: `1px solid ${CAMPUS.line}`, color: CAMPUS.inkSoft }}>
        <Eye size={12} /> Preview paper{questionCount ? ` (${questionCount})` : ""}
      </button>
      {open && <ContestPreviewModal contestId={contestId} onClose={() => setOpen(false)} />}
    </>
  );
}

// Loaded on open rather than with the dashboard: the paper costs a query per
// coding question for its tests, which nobody should pay for just to look at
// registration numbers.
//
// Goes through useKeyedFetch rather than an effect that setStates directly -
// that pattern is an error under this project's React lint rules, and keying
// the result by the contest it was fetched for means a different contest's
// paper can never flash on screen while the new one loads.
async function loadPaper(contestId) {
  const [questions, keys] = await Promise.all([
    fetchContestQuestions(contestId),
    fetchContestAnswerKeys(contestId),
  ]);
  const testPairs = await Promise.all(
    questions.filter(q => q.type === "coding").map(async q => [q.id, {
      sample: await fetchContestQuestionSampleTests(contestId, q.id).catch(() => []),
      hidden: await fetchContestQuestionHiddenTests(contestId, q.id).catch(() => []),
    }]),
  );
  return { questions, keys, tests: Object.fromEntries(testPairs) };
}

function ContestPreviewModal({ contestId, onClose }) {
  // Default OFF: the first thing an admin wants is "does this read correctly
  // to a student", and answers visible by default is also what you least want
  // on a projector.
  const [showAnswers, setShowAnswers] = useState(false);
  // fallback {} distinguishes "failed" from "still loading" (null) without a
  // separate error flag - an unreadable paper renders as zero questions plus
  // the integrity warning, which is honest rather than a hanging skeleton.
  const [paper] = useKeyedFetch(contestId, () => loadPaper(contestId), { fallback: {} });
  const loading = paper === null;
  const questions = paper?.questions || [];
  const keys = paper?.keys || {};
  const tests = paper?.tests || {};

  const totalMarks = questions.reduce((n, q) => n + (q.marks || 0), 0);
  const coding = questions.filter(q => q.type === "coding").length;
  const mcq = questions.length - coding;

  // Catches the mistakes that silently mark every attempt wrong.
  const problems = [];
  for (const q of questions) {
    const k = keys[q.id];
    const n = (q.order ?? 0) + 1;
    if (!k) { problems.push(`Q${n}: no answer key at all.`); continue; }
    if (q.type === "coding") {
      const t = tests[q.id] || { sample: [], hidden: [] };
      if (!t.hidden.length) problems.push(`Q${n}: no hidden tests - nothing to grade against.`);
      if (!t.sample.length) problems.push(`Q${n}: no sample tests - students get no worked example.`);
    } else if (q.type === "fillblank") {
      if (!(k.correctText || "").trim()) problems.push(`Q${n}: no accepted answer text.`);
    } else {
      const ids = (q.options || []).map(o => o.id);
      const correct = k.correctOptionIds || [];
      if (!correct.length) problems.push(`Q${n}: no correct option marked.`);
      correct.forEach(cid => {
        if (!ids.includes(cid)) problems.push(`Q${n}: correct answer "${cid}" is not one of its options.`);
      });
      if (q.type === "mcq" && correct.length > 1) problems.push(`Q${n}: single-answer MCQ has ${correct.length} correct options.`);
    }
  }

  return (
    <div onClick={onClose} role="presentation"
      className="fixed inset-0 z-[200] flex items-start justify-center p-4 overflow-y-auto"
      style={{ background: "rgba(0,0,0,0.55)" }}>
      <div onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Contest paper preview"
        className="w-full max-w-3xl rounded-2xl my-8"
        style={{ background: CAMPUS.surface, border: `1px solid ${CAMPUS.line}`, boxShadow: CAMPUS.shadowLg }}>

        <div className="flex items-center gap-2 px-5 py-3.5 sticky top-0 rounded-t-2xl"
          style={{ background: CAMPUS.surface, borderBottom: `1px solid ${CAMPUS.line}` }}>
          <FileText size={14} style={{ color: CAMPUS.teal }} />
          <b className="text-[13.5px] flex-1" style={{ color: CAMPUS.ink }}>Paper preview</b>
          <button onClick={() => setShowAnswers(v => !v)}
            className="flex items-center gap-1.5 text-[11.5px] font-semibold px-2.5 py-1.5 rounded-lg"
            style={showAnswers
              ? { background: CAMPUS.goodTint, color: CAMPUS.good, border: `1px solid ${CAMPUS.good}50` }
              : { background: CAMPUS.paper, color: CAMPUS.inkSoft, border: `1px solid ${CAMPUS.line}` }}>
            {showAnswers ? <EyeOff size={12} /> : <Eye size={12} />}
            {showAnswers ? "Hide answers" : "Show answers"}
          </button>
          <button onClick={onClose} aria-label="Close" style={{ color: CAMPUS.inkFaint }}><XIcon size={16} /></button>
        </div>

        <div className="p-5">
          {loading ? (
            <div className="space-y-3">
              {[0, 1, 2].map(i => <CampusSkeleton key={i} variant="rect" height={70} />)}
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 flex-wrap mb-4">
                <CampusChip color={CAMPUS.teal}>{questions.length} QUESTIONS</CampusChip>
                <CampusChip color={CAMPUS.purple}>{totalMarks} MARKS</CampusChip>
                <CampusChip color={CAMPUS.gold}>{coding} CODING</CampusChip>
                <CampusChip color={CAMPUS.blue}>{mcq} MCQ</CampusChip>
              </div>

              {problems.length > 0 ? (
                <div className="p-3 rounded-xl mb-4" style={{ background: CAMPUS.badTint, border: `1px solid ${CAMPUS.bad}40` }}>
                  <p className="text-[12px] font-semibold flex items-center gap-1.5 mb-1" style={{ color: CAMPUS.bad }}>
                    <AlertTriangle size={13} /> {problems.length} problem{problems.length === 1 ? "" : "s"} would break grading
                  </p>
                  {problems.map((p, i) => (
                    <p key={i} className="text-[11.5px]" style={{ color: CAMPUS.bad }}>{p}</p>
                  ))}
                </div>
              ) : (
                <p className="text-[11.5px] flex items-center gap-1.5 mb-4" style={{ color: CAMPUS.good }}>
                  <Check size={13} /> Every question has a usable answer key.
                </p>
              )}

              <div className="space-y-3">
                {questions.map(q => (
                  <QuestionCard key={q.id} q={q} keyDoc={keys[q.id]} tests={tests[q.id]} showAnswers={showAnswers} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function QuestionCard({ q, keyDoc, tests, showAnswers }) {
  const isCoding = q.type === "coding";
  const correct = new Set(keyDoc?.correctOptionIds || []);
  return (
    <div className="rounded-xl p-4" style={{ background: CAMPUS.paper, border: `1px solid ${CAMPUS.line}` }}>
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span className="text-[11px] font-mono font-bold" style={{ color: CAMPUS.inkFaint }}>Q{(q.order ?? 0) + 1}</span>
        <CampusChip color={isCoding ? CAMPUS.gold : CAMPUS.blue}>
          {isCoding ? "CODING" : q.type.toUpperCase()}
        </CampusChip>
        <CampusChip color={CAMPUS.inkFaint}>{q.marks} MARK{q.marks === 1 ? "" : "S"}</CampusChip>
        {q.topic && <span className="text-[10.5px]" style={{ color: CAMPUS.inkFaint }}>{q.topic}</span>}
      </div>

      {/* Same Inline renderer the student attempt uses, so the preview shows
          exactly what they will see rather than a differently-formatted copy. */}
      <p className="text-[12.5px] whitespace-pre-wrap leading-relaxed mb-2" style={{ color: CAMPUS.ink }}>
        <Inline text={q.question} />
      </p>

      {!isCoding && (q.options || []).length > 0 && (
        <div className="space-y-1 mb-1">
          {q.options.map(o => {
            const isRight = showAnswers && correct.has(o.id);
            return (
              <div key={o.id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[12px]"
                style={isRight
                  ? { background: CAMPUS.goodTint, color: CAMPUS.good, border: `1px solid ${CAMPUS.good}40` }
                  : { color: CAMPUS.inkSoft, border: `1px solid ${CAMPUS.line}` }}>
                <span className="font-mono font-bold uppercase">{o.id}</span>
                <span className="flex-1">{o.text}</span>
                {isRight && <Check size={13} />}
              </div>
            );
          })}
        </div>
      )}

      {isCoding && tests && (
        <div className="mt-2 space-y-2">
          <TestList label="Sample tests (students see these)" icon={ListChecks} rows={tests.sample} color={CAMPUS.teal} show />
          <TestList label="Hidden tests (grading only)" icon={Lock} rows={tests.hidden} color={CAMPUS.warn} show={showAnswers} count={tests.hidden.length} />
        </div>
      )}

      {showAnswers && keyDoc?.correctText && (
        <p className="text-[11.5px] mt-1.5" style={{ color: CAMPUS.good }}>Accepted: {keyDoc.correctText}</p>
      )}
      {showAnswers && keyDoc?.explanation && (
        <p className="text-[11.5px] mt-1.5 leading-relaxed" style={{ color: CAMPUS.inkFaint }}>{keyDoc.explanation}</p>
      )}
    </div>
  );
}

function TestList({ label, icon: Icon, rows, color, show, count }) {
  if (!rows) return null;
  return (
    <div>
      <p className="text-[10px] font-mono tracking-wider mb-1 flex items-center gap-1.5" style={{ color }}>
        <Icon size={10} /> {label.toUpperCase()} ({count ?? rows.length})
      </p>
      {!show ? (
        <p className="text-[11px]" style={{ color: CAMPUS.inkFaint }}>Hidden - use Show answers to reveal.</p>
      ) : rows.length === 0 ? (
        <p className="text-[11px]" style={{ color: CAMPUS.bad }}>None.</p>
      ) : (
        <div className="space-y-1">
          {rows.map((t, i) => (
            <div key={t.id || i} className="grid grid-cols-2 gap-2 text-[11px] font-mono px-2.5 py-1.5 rounded-lg"
              style={{ background: CAMPUS.surface, border: `1px solid ${CAMPUS.line}` }}>
              <div className="min-w-0">
                <span className="block text-[9.5px]" style={{ color: CAMPUS.inkFaint }}>INPUT</span>
                <span className="block whitespace-pre-wrap break-all" style={{ color: CAMPUS.inkSoft }}>{t.input || "(empty)"}</span>
              </div>
              <div className="min-w-0">
                <span className="block text-[9.5px]" style={{ color: CAMPUS.inkFaint }}>EXPECTED</span>
                <span className="block whitespace-pre-wrap break-all" style={{ color: CAMPUS.ink }}>{t.expectedOutput || "(empty)"}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

