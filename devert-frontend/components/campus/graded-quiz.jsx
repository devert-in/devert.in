"use client";

// The one topic-quiz component. CS Core, GATE, Programming and Aptitude each
// used to carry their own near-identical copy of this, which is how the same
// three bugs shipped four times: a localStorage-only submit gate, no
// correctness check, and options that stayed clickable after submission.
//
// Everything about whether this quiz may be answered comes from `state`, which
// lib/quizAttempts.js derives from a Firestore document - never from component
// memory and never from localStorage. That is what makes the lock hold across a
// refresh, a second browser and a cleared store.
//
// Grading and payment happen server-side in submitQuizAttempt; this component
// only renders what came back.
import { useMemo } from "react";
import { ListChecks, Check, AlertTriangle } from "lucide-react";
import { CAMPUS } from "@/lib/campus-theme";
import { CampusCard, CampusButton, CampusSkeleton } from "@/components/campus/campus-ui";
import { shuffleQuizForAttempt } from "@/lib/quizRandom";

export function GradedQuiz({
  mcqs,
  seedKey,
  answers,
  onAnswer,
  state,
  policy,
  result,
  // Set by the caller's catch. Rendered next to the Submit button so a failed
  // write is visible where the student is already looking.
  error,
  loading,
  submitting,
  onSubmit,
  label = "QUIZ",
  submitLabel = "Submit Quiz",
  showExplanations = false,
}) {
  // Shuffled purely for display, keyed by seedKey (student + topic). Grading
  // always compares against the ORIGINAL array index's correctIndex, never the
  // shuffled render position, so `answers` keeps its "keyed by original index"
  // shape - the contract lib/quizRandom.js documents.
  const shuffled = useMemo(() => shuffleQuizForAttempt(mcqs, seedKey), [mcqs, seedKey]);

  const locked = state.locked;
  // Never colour an option before the paper is in - doing so hands over the
  // answer key.
  const reveal = locked || state.submitted;
  const answered = Object.keys(answers || {}).filter(k => answers[k] != null).length;
  const remaining = mcqs.length - answered;
  const perCorrect = Math.round(policy.xp / Math.max(1, mcqs.length));
  const perWrong = Math.round(perCorrect * policy.wrongPenaltyRatio);

  return (
    <CampusCard className="p-4">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
        <p className="text-[11px] font-mono tracking-widest flex items-center gap-1.5" style={{ color: CAMPUS.blue }}>
          <ListChecks size={12} /> {label}
        </p>
        {/* The scoring rules stated up front, rather than discovered after
            submitting. */}
        <p className="text-[10.5px] font-mono flex items-center gap-2 flex-wrap" style={{ color: CAMPUS.inkFaint }}>
          <span style={{ color: CAMPUS.good }}>+{perCorrect} XP correct</span>
          {perWrong > 0 && <span style={{ color: CAMPUS.bad }}>-{perWrong} XP wrong</span>}
          {policy.completionRequiresPass && <span>{Math.round(policy.passPct * 100)}% to pass</span>}
        </p>
      </div>

      {loading ? (
        <CampusSkeleton height={140} />
      ) : (
        <>
          <div className="space-y-4">
            {shuffled.map((q, i) => (
              <div key={q._origIndex}>
                <p className="text-[13px] font-medium mb-2" style={{ color: CAMPUS.ink }}>{i + 1}. {q.question}</p>
                <div className="space-y-1.5">
                  {q.options.map(opt => {
                    const isSelected = answers?.[q._origIndex] === opt.originalIndex;
                    const isCorrect = reveal && opt.originalIndex === q.correctIndex;
                    const isWrong = reveal && isSelected && opt.originalIndex !== q.correctIndex;
                    return (
                      <button key={opt.originalIndex} disabled={locked || submitting}
                        onClick={() => onAnswer(q._origIndex, opt.originalIndex)}
                        className="w-full text-left text-[12.5px] px-3 py-2 rounded-lg"
                        style={{
                          background: isCorrect ? CAMPUS.goodTint : isWrong ? CAMPUS.badTint : isSelected ? CAMPUS.tealTint : CAMPUS.paper,
                          border: `1px solid ${isCorrect ? CAMPUS.good : isWrong ? CAMPUS.bad : isSelected ? CAMPUS.teal : CAMPUS.line}`,
                          color: CAMPUS.ink,
                          cursor: locked ? "default" : "pointer",
                        }}>
                        {opt.text}
                      </button>
                    );
                  })}
                </div>
                {showExplanations && reveal && mcqs[q._origIndex]?.explanation && (
                  <p className="text-[12px] leading-relaxed mt-2 px-3 py-2 rounded-lg"
                    style={{ background: CAMPUS.paper, color: CAMPUS.inkSoft }}>
                    {mcqs[q._origIndex].explanation}
                  </p>
                )}
              </div>
            ))}
          </div>

          {!locked ? (
            <div className="mt-4">
              <CampusButton size="sm" onClick={onSubmit} disabled={submitting || remaining > 0}>
                {submitting ? "Grading..." : submitLabel}
              </CampusButton>
              <p className="text-[11px] mt-1.5" style={{ color: CAMPUS.inkFaint }}>
                {remaining > 0
                  ? `${remaining} question${remaining === 1 ? "" : "s"} left.`
                  : state.attemptsLeft <= 1
                    ? "You get one submission. It locks after this."
                    : `${state.attemptsLeft} attempts left.`}
              </p>

              {/* THE FAILURE THAT WAS INVISIBLE. Every module's submit handler
                  wrapped submitQuizAttempt in try/finally with NO catch, so a
                  rejected write (a rules denial, a failed transaction, a dropped
                  connection) only re-enabled the button. The student pressed
                  Submit, nothing happened, and no reason was ever shown - the
                  reported "CS Core quiz isn't submitting". The write itself is
                  fine in the general case; what was broken was that a failure
                  said nothing.
                  Surfacing the real message also makes the next report
                  diagnosable instead of a guess. */}
              {error && (
                <p className="text-[11.5px] mt-2 leading-relaxed" style={{ color: CAMPUS.bad }}>
                  {error} Your answers are still selected - press Submit again.
                </p>
              )}

              {/* A "locked" or "not-signed-in" result is not an error, but it is
                  also not graded - and with only the graded branch handled, it
                  used to render as silence too. */}
              {!error && result && result.status !== "graded" && (
                <p className="text-[11.5px] mt-2 leading-relaxed" style={{ color: CAMPUS.warn }}>
                  {result.reason === "not-signed-in"
                    ? "You are signed out. Sign in again and resubmit."
                    : result.reason === "already-passed"
                      ? "You have already passed this quiz."
                      : result.reason === "attempts-exhausted"
                        ? "No attempts left on this quiz - ask your admin to reopen it."
                        : "This quiz could not be graded. Nothing was recorded."}
                </p>
              )}
            </div>
          ) : (
            <QuizResult state={state} result={result} policy={policy} />
          )}
        </>
      )}
    </CampusCard>
  );
}

// What was earned, itemised. Rendered from the server record as well as the
// just-returned result, so reopening the topic weeks later still explains the
// number sitting on the student's profile.
function QuizResult({ state, result, policy }) {
  const correct = result?.correct ?? state.lastCorrect ?? 0;
  const total = result?.total ?? state.lastTotal ?? 0;
  const passed = result ? result.passed : state.passed;

  return (
    <div className="mt-4 rounded-lg p-3" style={{ background: passed ? CAMPUS.goodTint : CAMPUS.badTint }}>
      <p className="text-[12.5px] font-semibold flex items-center gap-1.5" style={{ color: passed ? CAMPUS.good : CAMPUS.bad }}>
        {passed ? <Check size={13} /> : <AlertTriangle size={13} />}
        Score: {correct}/{total} — {passed ? "Passed" : `Not passed (${Math.round(policy.passPct * 100)}% needed)`}
      </p>

      {result?.status === "graded" && result.rewarded && (
        <p className="text-[11.5px] font-mono mt-1.5 flex items-center gap-2 flex-wrap" style={{ color: CAMPUS.inkSoft }}>
          <span style={{ color: CAMPUS.good }}>+{result.xpEarned} XP earned</span>
          {result.xpPenalty > 0 && <span style={{ color: CAMPUS.bad }}>-{result.xpPenalty} XP for wrong answers</span>}
          <span style={{ color: CAMPUS.ink }}>= {result.xp >= 0 ? "+" : ""}{result.xp} XP</span>
          {result.coins > 0 && <span style={{ color: CAMPUS.gold }}>+{result.coins} coins</span>}
        </p>
      )}

      {result?.status === "graded" && !result.rewarded && result.alreadyPaid && (
        <p className="text-[11.5px] mt-1.5" style={{ color: CAMPUS.inkSoft }}>
          This topic was already rewarded earlier — no XP was added again.
        </p>
      )}

      {/* The cross-device case. A stale tab on a second machine now says this
          instead of offering a submit button that the server would refuse. */}
      {result?.status === "locked" && (
        <p className="text-[11.5px] mt-1.5" style={{ color: CAMPUS.inkSoft }}>
          {result.reason === "already-passed"
            ? "You already submitted this quiz — possibly on another device. It can't be taken again."
            : "No attempts left on this quiz."}
        </p>
      )}

      {!result && (
        <p className="text-[11.5px] mt-1.5" style={{ color: CAMPUS.inkSoft }}>
          Submitted {state.attemptsUsed} time{state.attemptsUsed === 1 ? "" : "s"}. This quiz is locked — ask your admin if you need it reopened.
        </p>
      )}

      {!passed && (
        <p className="text-[11.5px] mt-1.5" style={{ color: CAMPUS.inkSoft }}>
          The topic isn&apos;t marked complete. Re-read the lesson above — the correct answers are highlighted.
        </p>
      )}
    </div>
  );
}
