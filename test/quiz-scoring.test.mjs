// Per-question quiz scoring - the arithmetic that decides how much XP a paper
// moves.
//
// This is worth pinning down rather than eyeballing, because the reported bug
// was precisely that a wrong answer paid the same as a right one, and the fix
// is a formula with several edge cases: rounding, the perfect-paper total,
// unanswered questions, and the one-way-ness of coins and score.
//
// Pure functions, no emulator needed.
import test from "node:test";
import assert from "node:assert/strict";
import { gradeQuiz, computeQuizReward, policyFor, DEFAULT_REWARD_POLICY } from "../devert-frontend/lib/rewardPolicy.js";

const MCQS = [
  { question: "q1", options: ["a", "b", "c", "d"], correctIndex: 0 },
  { question: "q2", options: ["a", "b", "c", "d"], correctIndex: 1 },
  { question: "q3", options: ["a", "b", "c", "d"], correctIndex: 2 },
  { question: "q4", options: ["a", "b", "c", "d"], correctIndex: 3 },
];

// A 20-XP topic over 4 questions => 5 XP a question, 1.25 -> 1 XP deducted per
// wrong at the default 0.25 ratio. Uses "gate", not "cscore": cscore's module
// entry in DEFAULT_REWARD_POLICY deliberately overrides wrongPenaltyRatio to 0
// (a CS Core topic is a content module, not a gatekept exam - see that
// module's own comment), so it no longer exercises the penalty arithmetic
// this file is testing. "gate" carries no such override and inherits the
// platform default straight from `defaults`.
const POLICY = policyFor("gate", { xpReward: 20, coinReward: 8 });

test("grading counts correct, wrong and unanswered separately", () => {
  const g = gradeQuiz(MCQS, { 0: 0, 1: 1, 2: 99 }, POLICY.passPct);
  assert.equal(g.total, 4);
  assert.equal(g.correct, 2);
  assert.equal(g.wrong, 1);       // q3 answered wrong
  assert.equal(g.unanswered, 1);  // q4 never answered
  assert.equal(g.pct, 0.5);
});

test("an unanswered question can never raise the percentage", () => {
  const blank = gradeQuiz(MCQS, {}, POLICY.passPct);
  assert.equal(blank.correct, 0);
  assert.equal(blank.pct, 0);
  assert.equal(blank.passed, false);
});

test("a perfect paper pays exactly the authored reward, with no rounding drift", () => {
  // 25 XP over 3 questions is 8.33 each - summing rounded values would pay 24.
  const p = policyFor("cscore", { xpReward: 25, coinReward: 10 });
  const three = MCQS.slice(0, 3);
  const g = gradeQuiz(three, { 0: 0, 1: 1, 2: 2 }, p.passPct);
  const r = computeQuizReward(p, g);
  assert.equal(g.correct, 3);
  assert.equal(r.xpEarned, 25);
  assert.equal(r.xpPenalty, 0);
  assert.equal(r.xpNet, 25);
  assert.equal(r.coins, 10);
});

test("wrong answers deduct XP - the reported bug", () => {
  // 2 right, 2 wrong on a 20-XP/4-question topic. Each question is worth 5 XP,
  // each wrong one costs 5 * 0.25 = 1.25, and the penalty is rounded once at the
  // end: round(2 * 1.25) = 3. So +10 earned, -3 penalty, +7 net.
  const g = gradeQuiz(MCQS, { 0: 0, 1: 1, 2: 0, 3: 0 }, POLICY.passPct);
  const r = computeQuizReward(POLICY, g);
  assert.equal(g.correct, 2);
  assert.equal(g.wrong, 2);
  assert.equal(r.xpEarned, 10);
  assert.equal(r.xpPenalty, 3);
  assert.equal(r.xpNet, 7);
});

test("an all-wrong paper produces a NEGATIVE net, never the full reward", () => {
  const g = gradeQuiz(MCQS, { 0: 1, 1: 0, 2: 0, 3: 0 }, POLICY.passPct);
  const r = computeQuizReward(POLICY, g);
  assert.equal(g.correct, 0);
  assert.equal(r.xpEarned, 0);
  assert.ok(r.xpNet < 0, `expected a negative net, got ${r.xpNet}`);
  // Before the fix this paper paid the full topic reward.
  assert.notEqual(r.xpNet, POLICY.xp);
});

test("coins and score are one-way - never negative, whatever the paper scores", () => {
  const g = gradeQuiz(MCQS, { 0: 1, 1: 0, 2: 0, 3: 0 }, POLICY.passPct);
  const r = computeQuizReward(POLICY, g);
  assert.equal(r.coins, 0);
  assert.equal(r.score, 0);
  assert.ok(r.score >= 0);
  assert.ok(r.coins >= 0);
});

test("score tracks only the positive half, so it can never decrease", () => {
  const g = gradeQuiz(MCQS, { 0: 0, 1: 1, 2: 0, 3: 0 }, POLICY.passPct);
  const r = computeQuizReward(POLICY, g);
  // Net XP is reduced by the penalty; score is not.
  assert.equal(r.score, r.xpEarned);
  assert.ok(r.score > r.xpNet);
});

test("passing is governed by passPct, independently of what the paper pays", () => {
  const p = policyFor("cscore", { xpReward: 20, passPct: 0.75 });
  const threeOfFour = gradeQuiz(MCQS, { 0: 0, 1: 1, 2: 2, 3: 0 }, p.passPct);
  const twoOfFour = gradeQuiz(MCQS, { 0: 0, 1: 1, 2: 0, 3: 0 }, p.passPct);
  assert.equal(threeOfFour.passed, true);
  assert.equal(twoOfFour.passed, false);
  // The failing paper still moves XP for the questions it got right - payment
  // is per question, completion is per paper.
  assert.ok(computeQuizReward(p, twoOfFour).xpEarned > 0);
});

test("a topic with no authored quiz passes trivially and pays in full", () => {
  const g = gradeQuiz([], {}, POLICY.passPct);
  const r = computeQuizReward(POLICY, g);
  assert.equal(g.passed, true);
  assert.equal(r.xpNet, POLICY.xp);
  assert.equal(r.xpPenalty, 0);
});

test("penaliseUnanswered=false stops skipping being punished", () => {
  const lenient = policyFor("cscore", { xpReward: 20, penaliseUnanswered: false });
  const g = gradeQuiz(MCQS, { 0: 0 }, lenient.passPct);
  const r = computeQuizReward(lenient, g);
  assert.equal(g.unanswered, 3);
  assert.equal(r.xpPenalty, 0);
  assert.equal(r.xpNet, r.xpEarned);
});

test("wrongPenaltyRatio 0 gives no-reward-no-deduction", () => {
  const noDeduct = policyFor("cscore", { xpReward: 20, wrongPenaltyRatio: 0 });
  const g = gradeQuiz(MCQS, { 0: 1, 1: 0, 2: 0, 3: 0 }, noDeduct.passPct);
  const r = computeQuizReward(noDeduct, g);
  assert.equal(r.xpPenalty, 0);
  assert.equal(r.xpNet, 0);
});

test("per-item authored rewards still override the module default", () => {
  // The `topic.xpReward || 25` behaviour every call site already relied on.
  const p = policyFor("cscore", { xpReward: 45, coinReward: 20 });
  assert.equal(p.xp, 45);
  assert.equal(p.coins, 20);
  assert.equal(p.score, 45);
  const bare = policyFor("cscore", {});
  assert.equal(bare.xp, DEFAULT_REWARD_POLICY.modules.cscore.xp);
});

test("maxAttempts is at least 1 and passPct is clamped to 0..1", () => {
  const weird = policyFor("cscore", { maxAttempts: -5, passPct: 4 });
  assert.equal(weird.maxAttempts, 1);
  assert.equal(weird.passPct, 1);
});
