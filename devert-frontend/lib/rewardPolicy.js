// The single place every reward VALUE and every reward RULE lives.
//
// Before this file, each module hard-coded its own numbers at the call site
// (`topic.xpReward || 25` in campus-cscore.jsx, `|| 25` again in
// gate-subjects.jsx, `DAILY_LEARNING_PROBLEM_XP` in dailyLearning.js, ...), so
// "what does a topic pay?" had no answer that wasn't a grep. Changing a reward
// meant editing every module that grants one, and there was nowhere to express
// a cross-cutting rule like "a quiz must be passed before it pays".
//
// Loaded from system/rewardPolicy with the code defaults below as the
// fallback - identical pattern to lib/economy.js's ECONOMY/loadEconomy(), for
// the identical reason: an admin must be able to retune the economy without a
// redeploy, but a failed/absent read must never zero out every reward on the
// platform. POLICY is mutated in place once loaded so importers share live
// values without prop drilling.
//
// IMPORTANT - this file sets values and gating rules ONLY. It never writes.
// Granting goes through lib/rewards.js's grantRewards(), and whether a given
// (uid, activity) has already been paid is decided by the reward_grants ledger
// and each module's own completion flag, never here.
//
// Firestore is imported LAZILY, inside the two functions that actually touch it.
// Everything else here (policyFor, gradeQuiz, computeQuizReward) is pure
// arithmetic, and keeping the module free of a top-level firebase import is what
// lets test/quiz-scoring.test.mjs exercise that arithmetic directly under plain
// `node --test`, with no emulator and no bundler alias resolution.

// `xp`/`coins` are what an activity pays on success. `score` mirrors `xp`
// unless explicitly overridden - Score is the permanent, never-decreasing
// academic metric behind every leaderboard (see lib/rewards.js's header and
// firestore.rules' selfScoreWriteSane), so it is deliberately NOT independently
// tunable downward here: there is no configuration that can make Score fall.
//
// SCORING IS PER QUESTION, not per topic.
//
// A topic's `xp`/`coins` are what a PERFECT paper pays. Those are spread across
// however many questions the topic actually has, so each question is worth
// xp/N, and each WRONG answer costs `wrongPenaltyRatio` of that. The default
// ratio of 0.25 is exactly the shape asked for ("+20 correct / -5 wrong"): a
// wrong answer costs a quarter of what a right one earns.
//
// Before this, a wrong answer paid identically to a right one, so clicking any
// option and submitting banked the full topic reward in ~4 seconds - visible in
// the live 2026-08-04 grant timelines, where one student took seven CS Core
// topics in 23 seconds.
//
// What can and cannot go negative, and why:
//   - XP CAN go negative on a bad paper. firestore.rules' selfWriteDeltaSane
//     only caps the upper end of an xp delta (<= 2000), so a decrease needs no
//     rules change. A student's total is still floored at zero (see
//     computeQuizReward's caller) - XP converts to real INR through the Wallet,
//     and a negative balance there is not a thing that can mean anything.
//   - COINS are never deducted. They are the withdrawable currency; some are
//     already converted and paid out, so clawing them back is not a subtraction
//     that can be honoured. Coins are awarded per correct answer only.
//   - SCORE is never deducted. It is the permanent academic metric and the sort
//     key behind every leaderboard and rank, and firestore.rules'
//     selfScoreWriteSane rejects any owner write that lowers it. Score is
//     awarded per correct answer only.
//
// `passPct` governs COMPLETION, separately from payment: a paper below this bar
// scores its questions as normal but does not mark the topic complete and does
// not advance progress.
//
// `maxAttempts` is how many times a quiz may be submitted at all. 1 means the
// quiz locks permanently on first submit, pass or fail, and only an admin reset
// re-opens it. Raise it per module here rather than per call site.
export const DEFAULT_REWARD_POLICY = {
  version: 1,

  // Global defaults - a module entry below overrides only the keys it names.
  defaults: {
    xp: 25,
    coins: 10,
    passPct: 0.7,
    maxAttempts: 1,
    // Fraction of one question's XP that a wrong answer costs. 0.25 => a
    // 20-XP question deducts 5 XP when answered wrong. Set to 0 to award
    // nothing for wrong answers without deducting anything.
    wrongPenaltyRatio: 0.25,
    // Unanswered questions: penalised like a wrong answer, or ignored? Kept
    // true (penalised) so skipping the hard half of a paper is not a cheaper
    // strategy than guessing it.
    penaliseUnanswered: true,
    // Whether a FAILED attempt burns one of maxAttempts. False means a student
    // who fails may retry (still earning at most once, enforced by the ledger);
    // true means one wrong quiz locks the topic's reward forever. Kept false by
    // default deliberately: the reward is already un-farmable once correctness
    // gates it, and a permanent lockout on a single wrong answer turns every
    // failed quiz into a support ticket.
    lockOnFail: false,
    // Whether scoring >= passPct is required to mark the topic/day complete and
    // advance progress (see quizAttempts.js's submitQuizAttempt). True almost
    // everywhere - completion IS the pass. cscore below overrides this: a CS
    // Core topic is a content module, not a gatekept exam, so attempting it (any
    // score) is what advances the student - only the XP itself still depends on
    // correctness.
    completionRequiresPass: true,
  },

  modules: {
    // No pass gate: viewing the lesson and attempting its MCQs is what advances
    // a student through CS Core, right or wrong. wrongPenaltyRatio: 0 means a
    // wrong answer simply earns nothing - never a deduction (see this file's
    // header on that ratio for the general mechanism).
    cscore:              { activity: "cscore_topic",           xp: 25, coins: 10, wrongPenaltyRatio: 0, completionRequiresPass: false },
    gate:                { activity: "gate_topic",             xp: 25, coins: 10 },
    programming:         { activity: "programming_topic",      xp: 25, coins: 10 },
    softwareEngineering: { activity: "se_topic",               xp: 25, coins: 10 },
    dsaConcepts:         { activity: "dsa_concept",            xp: 25, coins: 10 },
    aptitude:            { activity: "aptitude_topic",         xp: 20, coins: 8  },
    // Daily Learning pays per DAY, and its day/problem values are authored per
    // item by the admin who writes the day - these are the fallbacks used when
    // an item carries none, not a cap on what an item may award.
    daily_learning:      { activity: "daily_learning_day",     xp: 50, coins: 20 },
    daily_learning_problem: { activity: "daily_learning_problem", xp: 25, coins: 5 },
    gate_day:            { activity: "gate_day",               xp: 20, coins: 8  },
    // Same no-pass-gate shape as cscore above, for the same reason: a
    // roadmap topic is a curated orientation/reading node, not a gatekept
    // exam, so completionRequiresPass MUST be false here - without it,
    // policyFor() falls through to the platform default (true), which would
    // make a roadmap topic's quiz silently refuse to mark completion below
    // 70%, contradicting the confirmed "advisory levels, never gated"
    // design. xp/coins deliberately the lowest per-item default on the
    // platform: 10-15 roadmaps x ~60 topics each is the largest self-
    // reported-completion surface in the app, and XP converts to real INR
    // through the Wallet - an admin raises a genuinely substantial topic's
    // reward via its own xpReward/coinReward, which policyFor() already
    // honours per-item.
    roadmaps:            { activity: "roadmap_topic",          xp: 10, coins: 4, wrongPenaltyRatio: 0, completionRequiresPass: false },
  },
};

export const REWARD_POLICY = JSON.parse(JSON.stringify(DEFAULT_REWARD_POLICY));

let loaded = false;
let inflight = null;

export async function loadRewardPolicy() {
  if (loaded) return REWARD_POLICY;
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const [{ db }, { doc, getDoc }] = await Promise.all([
        import("@/lib/firebase"),
        import("firebase/firestore"),
      ]);
      const snap = await getDoc(doc(db, "system", "rewardPolicy"));
      if (snap.exists()) {
        const remote = snap.data();
        // Shallow-merge per section rather than Object.assign over the root, so
        // a policy doc that only overrides `defaults` doesn't wipe `modules`.
        if (remote.defaults) Object.assign(REWARD_POLICY.defaults, remote.defaults);
        if (remote.modules) {
          for (const [k, v] of Object.entries(remote.modules)) {
            REWARD_POLICY.modules[k] = { ...(REWARD_POLICY.modules[k] || {}), ...v };
          }
        }
        if (typeof remote.version === "number") REWARD_POLICY.version = remote.version;
      }
    } catch {
      // Absent/denied policy doc = code defaults, never "no rewards". Silent by
      // design: this runs on every campus page load and a console error per
      // page for a doc that legitimately may not exist yet is noise.
    }
    loaded = true;
    inflight = null;
    return REWARD_POLICY;
  })();
  return inflight;
}

// Admin-console write path (see the Reward Audit panel). Bumps `version` so a
// reader can tell a retune happened without diffing every field.
export async function saveRewardPolicy(patch) {
  const [{ db }, { doc, setDoc, serverTimestamp }] = await Promise.all([
    import("@/lib/firebase"),
    import("firebase/firestore"),
  ]);
  await setDoc(doc(db, "system", "rewardPolicy"), {
    ...patch,
    version: (REWARD_POLICY.version || 0) + 1,
    updatedAt: serverTimestamp(),
  }, { merge: true });
  loaded = false;
}

// The effective rule set for one module, with per-item overrides layered on
// top. `item` is the authored topic/day doc - an admin who set xpReward on a
// specific topic still wins over the module default, which is what every
// existing call site already assumed (`topic.xpReward || 25`).
//
// Returns coins/xp/score together so no call site has to remember that Score
// tracks XP; getting that wrong is exactly how Score drifted from XP before
// lib/rewards.js centralized the split.
export function policyFor(moduleKey, item = null) {
  const mod = REWARD_POLICY.modules[moduleKey] || {};
  const base = { ...REWARD_POLICY.defaults, ...mod };
  const xp = numberOr(item?.xpReward, base.xp);
  const coins = numberOr(item?.coinReward, base.coins);
  return {
    activity: mod.activity || moduleKey,
    xp,
    coins,
    score: xp,
    passPct: clamp01(numberOr(item?.passPct, base.passPct)),
    maxAttempts: Math.max(1, Math.floor(numberOr(item?.maxAttempts, base.maxAttempts))),
    wrongPenaltyRatio: Math.max(0, numberOr(item?.wrongPenaltyRatio, base.wrongPenaltyRatio)),
    penaliseUnanswered: item?.penaliseUnanswered ?? base.penaliseUnanswered,
    lockOnFail: item?.lockOnFail ?? base.lockOnFail,
    completionRequiresPass: item?.completionRequiresPass ?? base.completionRequiresPass,
  };
}

function numberOr(v, fallback) {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

// Grades one MCQ set against the student's answers.
//
// `answers` is keyed by the question's ORIGINAL index in `mcqs` (never the
// shuffled render position) - the shape lib/quizRandom.js's shuffleQuizForAttempt
// contract already guarantees every caller uses. Unanswered questions count as
// wrong rather than being skipped, so leaving a question blank can never raise
// the percentage.
//
// A quiz with no questions passes trivially with 0/0 - that is the "topic has
// no authored quiz" case, where completion is a reading acknowledgement and
// there is nothing to grade.
export function gradeQuiz(mcqs, answers, passPct) {
  const list = Array.isArray(mcqs) ? mcqs : [];
  const total = list.length;
  if (total === 0) {
    return { total: 0, correct: 0, wrong: 0, unanswered: 0, pct: 1, passed: true, perQuestion: [] };
  }

  const perQuestion = list.map((q, i) => {
    const given = answers?.[i];
    const answered = given != null;
    const correct = answered && given === q.correctIndex;
    return { index: i, given: answered ? given : null, expected: q.correctIndex, answered, correct };
  });
  const correct = perQuestion.filter(r => r.correct).length;
  const unanswered = perQuestion.filter(r => !r.answered).length;
  const wrong = total - correct - unanswered;
  const pct = correct / total;
  return { total, correct, wrong, unanswered, pct, passed: pct >= passPct, perQuestion };
}

// Turns a graded paper into the actual XP/coins/score movement, per question.
//
// Every value is rounded ONCE at the end rather than per question, so a
// 25-XP/3-question topic pays 25 on a perfect paper instead of 8+8+8=24. The
// perfect-paper total is pinned exactly: when nothing is wrong or unanswered,
// xpEarned is policy.xp on the nose, whatever the question count.
//
// `xpNet` may be negative; coins and score never are (see this file's header for
// why those two are one-way).
export function computeQuizReward(policy, grade) {
  const total = grade.total;
  if (total === 0) {
    return { xpEarned: policy.xp, xpPenalty: 0, xpNet: policy.xp, coins: policy.coins, score: policy.score, perCorrectXp: policy.xp, perWrongXp: 0 };
  }

  const perCorrectXp = policy.xp / total;
  const perWrongXp = perCorrectXp * policy.wrongPenaltyRatio;
  const penalisedCount = grade.wrong + (policy.penaliseUnanswered ? grade.unanswered : 0);

  // Pin the perfect paper to the authored total rather than summing rounded
  // per-question values.
  const xpEarned = grade.correct === total ? policy.xp : Math.round(grade.correct * perCorrectXp);
  const xpPenalty = Math.round(penalisedCount * perWrongXp);
  const coins = grade.correct === total ? policy.coins : Math.round(grade.correct * (policy.coins / total));

  return {
    xpEarned,
    xpPenalty,
    xpNet: xpEarned - xpPenalty,
    coins,
    // Score tracks the POSITIVE half only - it can never be reduced.
    score: xpEarned,
    perCorrectXp: Math.round(perCorrectXp),
    perWrongXp: Math.round(perWrongXp),
  };
}
