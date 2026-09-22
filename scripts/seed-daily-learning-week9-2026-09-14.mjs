// Daily Learning - DSA Series, WEEK 9 (Mon 14 Sep - Sat 19 Sep 2026).
//
//   Week 7  2026-08-31  Advanced Graphs        Days 35-39 + Week 7 Master Test
//   Week 8  2026-09-07  Greedy Algorithms      Days 40-44 + Week 8 Master Test
//   Week 9  2026-09-14  DP Foundations (1D)    Days 45-49 + Week 9 Master Test  <- this file
//   Week 10 2026-09-21  Knapsack & Subset DP   Days 50-54 + Week 10 Master Test
//   Week 11 2026-09-28  String & Grid DP       Days 55-57 (Mon-Wed, month end)
//
// NOTE ON THE GAP: like week 8, this week backfills a hole - the live track
// stopped at 2026-09-05 and nothing was seeded for 09-07 or 09-14. Authored
// 2026-09-21 at the maintainer's request to fill from where the series left
// off through month end. Days completed after their own date earn nothing
// (lib/dailyLearning.js's late-completion rule), so this week exists for
// sequence continuity and archive study, not as earnable days.
//
// WHY THIS TOPIC NEXT: Day 44 closed by breaking greedy twice, on purpose -
// coin change over {1, 3, 4} making 6 (greedy 3 coins, optimal 2) and
// ratio-greedy on 0/1 knapsack (160 vs 220) - and named the replacement
// without building it. Day 45 opens on that exact {1, 3, 4} instance and
// solves it, so DP arrives as the answer to a question the course already
// asked. The week deliberately stays ONE-DIMENSIONAL throughout (a single
// index or a single amount as the state) so that the jump to two indices
// lands in week 10 with knapsack, where it is genuinely needed, rather than
// being smuggled in early.
//
// Day 47's loop-order section (coins outer = combinations, amount outer =
// permutations) is the single most common silent wrong answer in this whole
// topic, so it gets its own traced counterexample rather than a footnote.
//
// DAY NUMBERING continues the titles: week 8's last lesson was Day 44, so
// this week runs Days 45-49. Saturday tests stay unnumbered.
//
// SHAPE matches the live docs exactly:
//   lesson (Mon-Fri): 5 MCQs, xpReward 50,  coinReward 20, 1-2 problemIds
//   test   (Sat):    10 MCQs, xpReward 150, coinReward 60, 2 problemIds
//
// audiences: ["legacy"] - same reasoning weeks 5-8 documented.
//
// problemIds verified live against `problems` (status=="published",
// category=="Dynamic Programming") and re-checked by this script's tail.
//
// ASCII hyphens only - scripts/normalize-dashes.mjs rewrites em/en dashes.
//
// Idempotent: refuses to overwrite a date that already exists.
//
//   node scripts/seed-daily-learning-week9-2026-09-14.mjs            # dry run
//   node scripts/seed-daily-learning-week9-2026-09-14.mjs --apply

import admin from "firebase-admin";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
admin.initializeApp({
  credential: admin.credential.cert(
    JSON.parse(readFileSync(join(__dirname, "service-account.json"), "utf8"))
  ),
});
const db = admin.firestore();
const FV = admin.firestore.FieldValue;

const APPLY = process.argv.includes("--apply");
const INSTITUTION_ID = "mrcet";
const WEEK_ID = "2026-09-14";

const mcq = (id, text, options, correctIndex) => ({ id, text, options, correctIndex });

const DAYS = [
  {
    date: "2026-09-14", dow: "mon", type: "lesson",
    title: "Day 45: Overlapping Subproblems - Memoization vs Tabulation",
    problemIds: [
      "tFHyOngtsz111lVw11lv", // Binomial Coefficient Problem (Easy, DP)
      "yICtrS8220XtoMoqfCPC", // Count Ways to Reach a Given Score in a Game (Easy, DP)
    ],
    concept:
`Friday left an unfinished problem on the board: coins {1, 3, 4}, target 6. Greedy answered 3 coins (4 + 1 + 1). The truth is 2 coins (3 + 3). Today we compute the truth, and the method generalises to an enormous class of problems.

THE FIX IN ONE SENTENCE: stop committing to one choice, try every choice, and remember the answers so you never compute the same thing twice.

STEP 1 - WRITE THE RECURRENCE. To make amount A with the fewest coins, you do not know which coin is in the optimal answer, so try them all. Whichever coin c you use first, you are left needing A - c:

  minCoins(0) = 0
  minCoins(A) = 1 + min over every coin c <= A of minCoins(A - c)

Applied to A = 6 with coins {1, 3, 4}:

  minCoins(6) = 1 + min( minCoins(5), minCoins(3), minCoins(2) )

That is already correct. It is also catastrophically slow if implemented literally, because minCoins(2) will be recomputed inside minCoins(5) and again inside minCoins(3), and each of those recomputes its own children, and so on.

STEP 2 - SEE THE OVERLAP. This is the property that makes DP applicable, and it is exactly the one greedy did not need. Expand Fibonacci to see it at its starkest:

  fib(5) calls fib(4) and fib(3)
  fib(4) calls fib(3) and fib(2)
  fib(3) calls fib(2) and fib(1)      <- fib(3) computed twice, fib(2) three times

Plain recursion on fib is O(2^n). But there are only n distinct subproblems - fib(0) through fib(n). All the cost is re-derivation. Store each result the first time and the work collapses to O(n).

  OPTIMAL SUBSTRUCTURE  : the optimal answer is built from optimal answers to subproblems. (Greedy needs this too.)
  OVERLAPPING SUBPROBLEMS: the same subproblem is reached many times. (This is what makes storing pay.)

Both must hold for DP to be the right tool.

STEP 3 - TWO WAYS TO STORE. They compute the same table; they differ in direction and in what they cost you.

MEMOIZATION (top-down). Keep the recursion, add a cache. Write the recurrence exactly as stated, and check the cache on entry:

  memo = {}
  def minCoins(A):
      if A == 0: return 0
      if A in memo: return memo[A]
      best = infinity
      for c in coins:
          if c <= A:
              best = min(best, 1 + minCoins(A - c))
      memo[A] = best
      return best

  Natural to write once you have the recurrence. Computes ONLY the states it
  actually reaches. Costs call-stack depth, which can overflow on large inputs.

TABULATION (bottom-up). Drop recursion; fill an array from the base case upward, ordering the loop so every value is ready before it is needed:

  dp[0] = 0
  for A in 1..target:
      dp[A] = infinity
      for c in coins:
          if c <= A:
              dp[A] = min(dp[A], 1 + dp[A - c])
  return dp[target]

  No stack risk, usually a smaller constant factor, and it exposes the
  space optimisation (often only the last row or two is needed). Costs you
  the need to work out a valid fill order yourself.

STEP 4 - TRACE IT. Coins {1, 3, 4}, target 6:

  dp[0] = 0
  dp[1] = 1 + dp[0] = 1                                  (coin 1)
  dp[2] = 1 + dp[1] = 2                                  (coin 1)
  dp[3] = min( 1 + dp[2], 1 + dp[0] ) = min(3, 1) = 1    (coin 3 wins)
  dp[4] = min( 1 + dp[3], 1 + dp[1], 1 + dp[0] ) = 1     (coin 4 wins)
  dp[5] = min( 1 + dp[4], 1 + dp[2], 1 + dp[1] ) = 2     (4 + 1)
  dp[6] = min( 1 + dp[5], 1 + dp[3], 1 + dp[2] ) = 2     (3 + 3)

  answer: 2 coins. Greedy said 3. The table considered using a 3 first -
  the choice greedy discarded immediately - and kept it because what
  remained (another 3) was cheap.

THE FOUR QUESTIONS. Every DP in this course and the next two weeks is built by answering these in order, and it is worth making the habit explicit now:

  1. STATE      What must I know to describe a subproblem? Here: the amount remaining. One number, so this is a 1-D DP.
  2. RECURRENCE How does one state's answer combine its sub-states' answers?
  3. BASE CASE  Which states are answerable with no recursion at all? Here: dp[0] = 0.
  4. ORDER      In what sequence can I fill the table so nothing is read before it is written? Here: increasing A.

COMPLEXITY of the coin DP: O(target x number_of_coins) time, O(target) space. Compare the 2^target of naive recursion. For target 6 that is the difference between a handful of operations and dozens; for target 10000 it is the difference between instant and never.`,
    mcqs: [
      mcq("q1", "Dynamic programming requires overlapping subproblems in addition to:", [
        "The greedy choice property", "Optimal substructure", "A sorted input array", "A tree-shaped recursion",
      ], 1),
      mcq("q2", "With coins {1, 3, 4} and target 6, the DP table gives the minimum coin count as:", [
        "1", "2", "3", "4",
      ], 1),
      mcq("q3", "The essential difference between memoization and tabulation is that memoization:", [
        "Produces a different answer", "Is top-down and computes only the states actually reached",
        "Cannot handle overlapping subproblems", "Requires the recurrence to be linear",
      ], 1),
      mcq("q4", "Naive recursive Fibonacci is exponential even though only n distinct subproblems exist because:", [
        "Each call allocates a new array", "The same subproblems are recomputed along many different branches",
        "Addition of large integers is slow", "The base case is wrong",
      ], 1),
      mcq("q5", "The time complexity of the bottom-up minimum-coins DP for target A with k denominations is:", [
        "O(A)", "O(k log A)", "O(A x k)", "O(2^A)",
      ], 2),
    ],
  },

  {
    date: "2026-09-15", dow: "tue", type: "lesson",
    title: "Day 46: DP on a Line - Kadane's Algorithm & Contiguous Subarrays",
    problemIds: [
      "wt3qpkFwLo6GVXr2BxNE", // Smallest Sum Contiguous Subarray (Easy, DP)
    ],
    concept:
`Yesterday's state was an amount. Today's state is a POSITION in an array, and the question every such DP asks is the same: "what is the best answer for the prefix ending exactly here?" Once that question is posed correctly the recurrence is usually one line.

THE PROBLEM - MAXIMUM SUBARRAY SUM: given an array that may contain negatives, find the largest sum obtainable from a contiguous block of at least one element.

THE WRONG STATE. The natural first attempt is "let dp[i] be the best subarray sum anywhere in the first i elements". It is a correct quantity, but it is useless as a state: knowing the best answer somewhere to the left tells you nothing about whether the block ending at i can be extended, because you do not know whether that best block even touches position i.

THE RIGHT STATE - ANCHOR IT. Let dp[i] be the maximum sum of a subarray that ENDS EXACTLY AT INDEX i. Now the recurrence writes itself, because a block ending at i either starts at i or extends the block ending at i-1:

  dp[i] = max( arr[i],  dp[i-1] + arr[i] )
  dp[0] = arr[0]
  answer = max over all i of dp[i]

Read the max literally: "start fresh here" versus "keep the running block going". You start fresh precisely when dp[i-1] is negative, because a negative prefix can only drag down whatever follows. That single observation IS Kadane's algorithm.

TRACED on arr = [-2, 1, -3, 4, -1, 2, 1, -5, 4]:

  i=0  dp = -2                          best = -2
  i=1  max(1, -2 + 1 = -1)     = 1      best = 1
  i=2  max(-3, 1 - 3 = -2)     = -2     best = 1
  i=3  max(4, -2 + 4 = 2)      = 4      best = 4     <- started fresh: -2 was negative
  i=4  max(-1, 4 - 1 = 3)      = 3      best = 4
  i=5  max(2, 3 + 2 = 5)       = 5      best = 5
  i=6  max(1, 5 + 1 = 6)       = 6      best = 6     <- the block [4,-1,2,1]
  i=7  max(-5, 6 - 5 = 1)      = 1      best = 6
  i=8  max(4, 1 + 4 = 5)       = 5      best = 6

  answer: 6, from the subarray [4, -1, 2, 1].

SPACE. dp[i] depends only on dp[i-1], so the array is unnecessary - keep one running variable. This is the first and simplest instance of a habit that matters more and more as the tables grow: if a row depends only on the previous row, you do not need the whole table.

  best = current = arr[0]
  for i in 1..n-1:
      current = max(arr[i], current + arr[i])
      best    = max(best, current)
  return best

  O(n) time, O(1) space.

THE ALL-NEGATIVE TRAP. Initialising best = 0 instead of arr[0] is the single most common bug here. On arr = [-3, -1, -7] the correct answer is -1 (the best single element, since at least one element must be taken). Starting from 0 returns 0, a sum no subarray achieves. Initialise from the first element, never from zero, unless the problem explicitly permits the empty subarray.

THE MINIMISING TWIN. Smallest-sum contiguous subarray is the identical algorithm with max replaced by min:

  dp[i] = min( arr[i], dp[i-1] + arr[i] )

  On arr = [3, -4, 2, -3, -1, 7, -5]:
      i=0  3
      i=1  min(-4, 3 - 4 = -1)   = -4     best = -4
      i=2  min(2, -4 + 2 = -2)   = -2     best = -4
      i=3  min(-3, -2 - 3 = -5)  = -5     best = -5
      i=4  min(-1, -5 - 1 = -6)  = -6     best = -6
      i=5  min(7, -6 + 7 = 1)    = 1      best = -6
      i=6  min(-5, 1 - 5 = -4)   = -5     best = -6

      answer: -6, from [2, -3, -1].

  A neat alternative: negate every element, run ordinary Kadane, negate the
  result. Same answer, and worth knowing because it is the general trick for
  turning a maximiser into a minimiser.

WHY THIS IS REALLY DP AND NOT JUST A CLEVER LOOP. It has a state (the index at which the block ends), a recurrence over that state, a base case, and a fill order. It happens to compress to two variables, which disguises it. Recognising the anchored-at-i state is the transferable skill: it reappears in Longest Increasing Subsequence on Thursday, where the compression is no longer available and the table has to be kept in full.`,
    mcqs: [
      mcq("q1", "In Kadane's algorithm, dp[i] is defined as the maximum sum of a subarray that:", [
        "Starts at index i", "Ends exactly at index i", "Lies anywhere within the first i elements", "Has length exactly i",
      ], 1),
      mcq("q2", "The Kadane recurrence is dp[i] = max(arr[i], dp[i-1] + arr[i]). Choosing arr[i] alone corresponds to:", [
        "Extending the previous block", "Starting a fresh block because the previous running sum was negative",
        "Skipping index i entirely", "Resetting the answer to zero",
      ], 1),
      mcq("q3", "For arr = [-2, 1, -3, 4, -1, 2, 1, -5, 4], the maximum subarray sum is:", [
        "4", "5", "6", "7",
      ], 2),
      mcq("q4", "Initialising the running best to 0 rather than arr[0] breaks Kadane on which input?", [
        "An array of all positives", "An array of all negatives", "An array containing a single zero", "A strictly increasing array",
      ], 1),
      mcq("q5", "Kadane's algorithm runs in O(n) time and O(1) space because:", [
        "It sorts the array first", "dp[i] depends only on dp[i-1], so a single variable suffices",
        "It only examines positive elements", "It uses a hash table to skip repeats",
      ], 1),
    ],
  },

  {
    date: "2026-09-16", dow: "wed", type: "lesson",
    title: "Day 47: Counting Every Way - Coin Change Combinations",
    problemIds: [
      "vl29uR0v2TpkxI9RHtsN", // Coin Change - Count Number of Ways (Medium, DP)
    ],
    concept:
`Monday minimised. Today counts. The switch from "how few coins" to "how many ways" changes almost nothing in the table and everything in the loop order - and getting that order wrong is the most common silent error in all of dynamic programming.

THE PROBLEM: given denominations and a target, count the number of DISTINCT COMBINATIONS that sum to the target. Unlimited coins of each type. 1 + 2 and 2 + 1 are the SAME combination and must be counted once.

THE STATE AND THE BASE CASE. Let dp[a] be the number of ways to make amount a. The base case is the one that trips people:

  dp[0] = 1

There is exactly ONE way to make 0 - take no coins. Setting dp[0] = 0 would make every answer 0, since every count is ultimately built out of this. Read it as "the empty selection is a valid way", not as "zero is impossible".

THE RECURRENCE, AND WHY THE LOOP ORDER DECIDES THE MEANING. Process ONE COIN AT A TIME, and for each coin sweep the amounts upward:

  dp[0] = 1
  for each coin c:                 # OUTER loop over coins
      for a in c..target:          # INNER loop over amounts
          dp[a] += dp[a - c]

Because the coin loop is outside, every combination is built in a fixed coin order - all the 1s decided before any 2s are considered, and so on. There is no way to produce 1-then-2 and 2-then-1 as separate paths, so each combination is counted exactly once.

Now swap the loops:

  for a in 1..target:              # amounts outer
      for each coin c <= a:
          dp[a] += dp[a - c]

This counts PERMUTATIONS. For target 3 with coins {1, 2} it yields 3 - namely 1+1+1, 1+2 and 2+1 - because reaching amount 3 via a 1 from amount 2 and via a 2 from amount 1 are treated as different paths. Both loop orders are correct code for different questions. The order is the specification.

TRACED - coins {1, 2, 3}, target 4, combinations:

  dp initial:            [1, 0, 0, 0, 0]        (index 0..4)

  coin 1:  a=1: dp[1] += dp[0] -> 1
           a=2: dp[2] += dp[1] -> 1
           a=3: dp[3] += dp[2] -> 1
           a=4: dp[4] += dp[3] -> 1
           dp:            [1, 1, 1, 1, 1]        (only all-1s so far)

  coin 2:  a=2: dp[2] += dp[0] -> 2
           a=3: dp[3] += dp[1] -> 2
           a=4: dp[4] += dp[2] -> 3
           dp:            [1, 1, 2, 2, 3]

  coin 3:  a=3: dp[3] += dp[0] -> 3
           a=4: dp[4] += dp[1] -> 4
           dp:            [1, 1, 2, 3, 4]

  answer: dp[4] = 4, namely 1+1+1+1, 1+1+2, 2+2, 1+3.

Check by hand: those are indeed the only four combinations. 1+3 and 3+1 counted once - correct.

WHY THE INNER SWEEP GOES UPWARD. Within one coin's pass, dp[a - c] has ALREADY been updated for the current coin when we read it. That is deliberate: it is what allows the same coin to be reused any number of times. Making 4 from coin 2 reads dp[2], which already includes the "one 2" way, so it produces the "two 2s" way. Next week's 0/1 knapsack faces the opposite requirement - each item usable at most once - and fixes it by sweeping the inner loop DOWNWARD so that dp[a - w] is still the previous item's value. Same table, reversed sweep, completely different problem. Remember the pairing:

  inner loop upward    -> unlimited reuse of each item   (unbounded / coin change)
  inner loop downward  -> each item usable at most once  (0/1 knapsack)

COMPLEXITY: O(target x number_of_coins) time, O(target) space - one array reused across coins, no 2-D table required. The 2-D formulation dp[i][a] ("ways to make a using the first i coins") is equally valid and easier to reason about the first time; the 1-D version above is that table with the i dimension rolled away, which is safe precisely because each coin's pass reads only values at strictly smaller amounts.

A USEFUL SANITY CHECK: with a single denomination {1}, every target has exactly one combination, so dp should be all 1s. If your implementation returns anything else on that input, the base case or the loop order is wrong.`,
    mcqs: [
      mcq("q1", "In the coin-change counting DP, dp[0] is initialised to 1 because:", [
        "Zero is always reachable with one coin", "There is exactly one way to make 0 - choose no coins",
        "It prevents division by zero", "The first coin is always 1",
      ], 1),
      mcq("q2", "To count COMBINATIONS (where 1+2 and 2+1 are the same), the loops must be ordered:", [
        "Amounts outer, coins inner", "Coins outer, amounts inner", "Either order gives the same count", "Both loops descending",
      ], 1),
      mcq("q3", "With coins {1, 2, 3} and target 4, the number of distinct combinations is:", [
        "3", "4", "6", "7",
      ], 1),
      mcq("q4", "Sweeping the inner amount loop UPWARD within a coin's pass allows:", [
        "Each coin to be used at most once", "The same coin to be reused unlimited times",
        "Negative amounts to be skipped", "The coins to stay sorted",
      ], 1),
      mcq("q5", "Using amounts as the outer loop and coins as the inner loop counts 3 ways to make target 3 from {1, 2}. Those 3 are:", [
        "1+1+1, 1+2, 3", "1+1+1, 1+2, 2+1", "1+2, 2+1, 3", "1+1+1, 2+1, 3",
      ], 1),
    ],
  },

  {
    date: "2026-09-17", dow: "thu", type: "lesson",
    title: "Day 48: Longest Increasing Subsequence",
    problemIds: [
      "yDITszRBNBCoHkSIcYQN", // Longest Increasing Subsequence (Medium, DP)
      "v3QBej7bGMm0RaiCAXv1", // Longest Bitonic Subsequence (Medium, DP)
    ],
    concept:
`SUBARRAY versus SUBSEQUENCE is the distinction this day rests on. A subarray is contiguous - Tuesday's Kadane worked on those. A SUBSEQUENCE keeps the original relative order but may skip freely: from [3, 1, 4, 1, 5], the sequence [3, 4, 5] is a valid subsequence and is not a subarray. That freedom is why the O(1)-space trick from Tuesday evaporates and the full table has to be kept.

THE PROBLEM - LONGEST INCREASING SUBSEQUENCE (LIS): find the length of the longest strictly increasing subsequence.

THE STATE. Anchor it exactly as Tuesday did: let dp[i] be the length of the longest increasing subsequence ENDING AT INDEX i. Anchoring is what makes the recurrence expressible - "the best anywhere so far" again tells you nothing about whether arr[i] may be appended.

  dp[i] = 1 + max( dp[j] )  over all j < i with arr[j] < arr[i]
  dp[i] = 1                 if no such j exists (arr[i] starts its own run)
  answer = max over all i of dp[i]

Note the answer is the MAXIMUM over the whole table, not dp[n-1]. The longest run need not end at the last element - a mistake that costs marks routinely.

TRACED on arr = [10, 9, 2, 5, 3, 7, 101, 18]:

  i=0  arr=10   no smaller element to the left             dp[0] = 1
  i=1  arr=9    nothing smaller before it                  dp[1] = 1
  i=2  arr=2    nothing smaller before it                  dp[2] = 1
  i=3  arr=5    smaller: 2 (dp=1)                          dp[3] = 2      [2,5]
  i=4  arr=3    smaller: 2 (dp=1)                          dp[4] = 2      [2,3]
  i=5  arr=7    smaller: 2(1), 5(2), 3(2) -> best 2        dp[5] = 3      [2,5,7]
  i=6  arr=101  smaller: everything -> best dp is 3        dp[6] = 4      [2,5,7,101]
  i=7  arr=18   smaller: 10(1), 9(1), 2(1), 5(2), 3(2), 7(3) -> best 3   dp[7] = 4   [2,5,7,18]

  dp = [1, 1, 1, 2, 2, 3, 4, 4]      answer = 4

  Two different subsequences achieve 4. The DP returns the LENGTH; if the
  actual sequence is wanted, store a parent index alongside each dp[i] and
  walk back from the position holding the maximum.

COMPLEXITY: two nested loops, O(n^2) time and O(n) space. This is the version to write in an interview unless asked for better, because it is short and obviously correct.

THE O(n log n) VERSION - PATIENCE SORTING. Maintain an array tails, where tails[k] is the SMALLEST possible value that can end an increasing subsequence of length k+1. tails is automatically sorted, so each element can be placed with a binary search:

  for x in arr:
      find the leftmost position p in tails with tails[p] >= x
      if no such position: append x            (x extends the longest run)
      else:                tails[p] = x        (x gives a better, smaller tail)
  answer = length of tails

  On [10, 9, 2, 5, 3, 7, 101, 18]:
      10        -> tails [10]
       9        -> replace 10          tails [9]
       2        -> replace 9           tails [2]
       5        -> append              tails [2, 5]
       3        -> replace 5           tails [2, 3]
       7        -> append              tails [2, 3, 7]
     101        -> append              tails [2, 3, 7, 101]
      18        -> replace 101         tails [2, 3, 7, 18]

      length 4 - the same answer.

  CAUTION: tails is NOT itself a valid subsequence of the input - here it
  ends as [2, 3, 7, 18], which is a real subsequence by coincidence, but in
  general the array is only a bookkeeping device for the LENGTH. Reconstructing
  the actual sequence needs parent pointers recorded during the replacements.

THE PATTERN GENERALISES - LONGEST BITONIC SUBSEQUENCE. A bitonic subsequence increases and then decreases. Run LIS left-to-right to get inc[i], run LIS right-to-left (on decreasing runs) to get dec[i], and the answer is:

  max over i of ( inc[i] + dec[i] - 1 )

The minus one is because element i is counted in both halves. This composition - run the same 1-D DP from both ends and combine at each pivot - is a standard move worth recognising; it turns a dozen "longest something-shaped subsequence" problems into two LIS passes.`,
    mcqs: [
      mcq("q1", "In the O(n^2) LIS solution, dp[i] represents the length of the longest increasing subsequence:", [
        "Anywhere in the first i elements", "Ending exactly at index i", "Starting at index i", "Of the sorted array's prefix",
      ], 1),
      mcq("q2", "For arr = [10, 9, 2, 5, 3, 7, 101, 18], the LIS length is:", [
        "3", "4", "5", "6",
      ], 1),
      mcq("q3", "The final LIS answer is the maximum over the whole dp array rather than dp[n-1] because:", [
        "dp[n-1] is always 1", "The longest increasing subsequence need not end at the last element",
        "The array may contain duplicates", "The table is filled right to left",
      ], 1),
      mcq("q4", "In the O(n log n) patience approach, tails[k] stores:", [
        "The k-th element of the LIS", "The smallest possible tail value of an increasing subsequence of length k+1",
        "The largest value seen so far", "The number of subsequences of length k",
      ], 1),
      mcq("q5", "Longest Bitonic Subsequence is computed as max(inc[i] + dec[i] - 1). The subtraction of 1 is needed because:", [
        "The peak element is counted in both inc[i] and dec[i]",
        "Bitonic sequences must have even length",
        "The first element is never included",
        "inc and dec are computed on different arrays",
      ], 0),
    ],
  },

  {
    date: "2026-09-18", dow: "fri", type: "lesson",
    title: "Day 49: Choosing Under Constraints - Skip-Pattern DP",
    problemIds: [
      "kkJqAJKG8jHTJwYPl1b2", // Maximum Subsequence Sum With No Three Consecutive Elements (Medium, DP)
      "ijx3abxeGm0wzWjW33hw", // Longest Subsequence With Adjacent Elements Differing by One (Medium, DP)
    ],
    concept:
`Every DP this week has had a state that was a single number. Today the state stays one-dimensional but the CHOICE at each step becomes a small menu rather than a yes/no, which is the last shape needed before knapsack arrives on Monday.

THE CANONICAL FORM - HOUSE ROBBER. Given an array of values, pick a subset with the maximum sum subject to NO TWO CHOSEN ELEMENTS BEING ADJACENT. (The usual framing: houses along a street, and robbing two neighbours triggers the alarm.)

At index i there are exactly two options, and each one dictates what may precede it:

  take arr[i]   -> then i-1 is forbidden, so the best prior state is dp[i-2]
  skip arr[i]   -> then the answer is whatever dp[i-1] already was

  dp[i] = max( dp[i-1],  dp[i-2] + arr[i] )
  dp[0] = arr[0]
  dp[1] = max(arr[0], arr[1])

TRACED on arr = [2, 7, 9, 3, 1]:

  dp[0] = 2
  dp[1] = max(2, 7)              = 7
  dp[2] = max(7, 2 + 9 = 11)     = 11        [2, 9]
  dp[3] = max(11, 7 + 3 = 10)    = 11
  dp[4] = max(11, 11 + 1 = 12)   = 12        [2, 9, 1]

  answer: 12.

Only the last two entries are ever read, so this compresses to two variables and O(1) space - the same compression Kadane allowed on Tuesday.

THE VARIANT - NO THREE CONSECUTIVE. Now adjacency is permitted, but you may not take three in a row. The menu at index i grows to three options, and enumerating them exhaustively is the whole technique:

  skip arr[i]                    -> dp[i-1]
  take arr[i], skip arr[i-1]     -> dp[i-2] + arr[i]
  take arr[i] AND arr[i-1],
       therefore skip arr[i-2]   -> dp[i-3] + arr[i-1] + arr[i]

  dp[i] = max of those three

The third case is the one people forget. The constraint forbids runs of three, so a run of exactly two is legal and often optimal - and it is only reachable by explicitly reaching back to dp[i-3].

TRACED on arr = [100, 1000, 100, 1000, 1]:

  dp[0] = 100
  dp[1] = 100 + 1000 = 1100                            (two in a row is allowed)
  dp[2] = max( dp[1] = 1100,
               dp[0] + 100 = 200,
               (dp[-1] = 0) + 1000 + 100 = 1100 )      = 1100
  dp[3] = max( dp[2] = 1100,
               dp[1] + 1000 = 2100,
               dp[0] + 100 + 1000 = 1200 )             = 2100      [100, 1000, 1000]
  dp[4] = max( dp[3] = 2100,
               dp[2] + 1 = 1101,
               dp[1] + 1000 + 1 = 2101 )               = 2101      [100, 1000, 1000, 1]

  answer: 2101.

  Sanity-check the winner: indices 0, 1, 3, 4 - values 100, 1000, 1000, 1.
  Index 2 is skipped, so no three consecutive indices are ever chosen. Valid.

A DIFFERENT CONSTRAINT SHAPE - LONGEST SUBSEQUENCE WITH ADJACENT ELEMENTS DIFFERING BY ONE. Find the longest subsequence in which every consecutive PAIR differs by exactly 1 in value. The state is the familiar anchored one, and the constraint moves from the indices to the values:

  dp[i] = 1 + max( dp[j] )  over all j < i with abs(arr[i] - arr[j]) == 1
  dp[i] = 1 if no such j

  On arr = [10, 9, 4, 5, 4, 8, 6]:
      i=0  10                                        dp = 1
      i=1  9   differs by 1 from 10 (dp 1)           dp = 2      [10, 9]
      i=2  4   nothing before it differs by 1        dp = 1
      i=3  5   differs by 1 from 4 (dp 1)            dp = 2      [4, 5]
      i=4  4   differs by 1 from 5 (dp 2)            dp = 3      [4, 5, 4]
      i=5  8   differs by 1 from 9 (dp 2)            dp = 3      [10, 9, 8]
      i=6  6   differs by 1 from 5 (dp 2)            dp = 3      [4, 5, 6]

      answer: 3.

  It is structurally Thursday's LIS with "arr[j] < arr[i]" swapped for
  "abs difference is 1". Recognising that the two problems share one skeleton
  is worth more than memorising either.

THE WEEK'S REAL LESSON. In all five days the recipe was identical: pick a state that ANCHORS the decision at the current index, enumerate every legal option at that index, take the best, and make sure the fill order has the needed sub-answers ready. Where the problems differ is only in the menu of options. Monday's knapsack adds a second dimension to the state because one number can no longer describe a subproblem - but the recipe does not change at all.`,
    mcqs: [
      mcq("q1", "The House Robber recurrence dp[i] = max(dp[i-1], dp[i-2] + arr[i]) encodes the fact that taking arr[i] forces:", [
        "arr[i+1] to also be taken", "arr[i-1] to be excluded", "the subsequence to end at i", "all earlier elements to be skipped",
      ], 1),
      mcq("q2", "For arr = [2, 7, 9, 3, 1] with no two adjacent allowed, the maximum sum is:", [
        "11", "12", "13", "16",
      ], 1),
      mcq("q3", "In the no-three-consecutive variant, the case students most often omit is:", [
        "Skipping arr[i]", "Taking arr[i] and skipping arr[i-1]",
        "Taking both arr[i] and arr[i-1] and reaching back to dp[i-3]", "The base case dp[0]",
      ], 2),
      mcq("q4", "For arr = [100, 1000, 100, 1000, 1] with no three consecutive elements allowed, the maximum sum is:", [
        "1100", "2100", "2101", "2200",
      ], 2),
      mcq("q5", "Longest Subsequence With Adjacent Elements Differing By One shares its skeleton with:", [
        "Kadane's algorithm", "Longest Increasing Subsequence", "Coin change counting", "Binary search",
      ], 1),
    ],
  },

  {
    date: "2026-09-19", dow: "sat", type: "test",
    title: "Week 9 Master Test: 1D Dynamic Programming",
    xpReward: 150, coinReward: 60,
    problemIds: [
      "ucma4XvKG4YayoQncfl8", // Longest Alternating Subsequence (Medium, DP)
      "gGeTExOt2of3Z49PfA2v", // Maximize The Cut Segments (Medium, DP)
    ],
    concept:
`Week 9 in one page, then ten questions across all five days.

THE FOUR QUESTIONS that built every table this week:

  1. STATE      what must I know to describe a subproblem?
  2. RECURRENCE how do sub-answers combine?
  3. BASE CASE  which states need no recursion?
  4. ORDER      what fill order has every dependency ready?

THE FIVE DAYS.

  Day 45  Foundations      DP = optimal substructure + OVERLAPPING SUBPROBLEMS. Memoization is top-down with a cache and computes only reached states; tabulation is bottom-up, has no stack risk, and exposes space savings. Coins {1,3,4} target 6 gives 2, beating greedy's 3.
  Day 46  Kadane           anchor the state: dp[i] = best subarray ENDING at i = max(arr[i], dp[i-1] + arr[i]). O(n) time, O(1) space. Initialise from arr[0], never 0, or all-negative inputs break.
  Day 47  Counting         dp[0] = 1 (the empty selection). COINS OUTER counts combinations; AMOUNTS OUTER counts permutations. Inner sweep UPWARD permits unlimited reuse; downward will mean use-at-most-once next week.
  Day 48  LIS              dp[i] = longest increasing subsequence ending at i; answer is the max over the table, not dp[n-1]. O(n^2) naive, O(n log n) with patience tails. Bitonic = LIS from both ends, minus 1 at the pivot.
  Day 49  Skip patterns    enumerate the legal menu at index i. No-two-adjacent: max(dp[i-1], dp[i-2] + arr[i]). No-three-consecutive adds the dp[i-3] + arr[i-1] + arr[i] case.

WHAT CARRIES INTO WEEK 10. Every state this week was one number. That stops working for knapsack, where a subproblem needs BOTH which items remain AND how much capacity is left - two numbers, so a 2-D table. The recipe is unchanged; only the state widens. The other thing to carry is Day 47's sweep direction, because reversing it is precisely what converts unlimited reuse into use-at-most-once, and that single line is the difference between unbounded and 0/1 knapsack.`,
    mcqs: [
      mcq("q1", "The property that distinguishes a DP problem from a greedy one is:", [
        "Optimal substructure", "Overlapping subproblems", "A sorted input", "A recursive formulation",
      ], 1),
      mcq("q2", "With coins {1, 3, 4}, the minimum number of coins summing to 6 is:", [
        "2", "3", "4", "6",
      ], 0),
      mcq("q3", "Kadane's dp[i] is the best subarray sum ending at i. For [-2, 1, -3, 4, -1, 2, 1, -5, 4] the answer is:", [
        "4", "5", "6", "9",
      ], 2),
      mcq("q4", "In coin-change counting, dp[0] = 1 because:", [
        "One coin is always needed", "The empty selection is the single way to make amount 0",
        "The smallest coin is 1", "It is an arbitrary sentinel",
      ], 1),
      mcq("q5", "Placing the COIN loop outside and the amount loop inside counts:", [
        "Permutations", "Combinations", "Neither, it double counts", "Only solutions using every coin",
      ], 1),
      mcq("q6", "For arr = [10, 9, 2, 5, 3, 7, 101, 18], the length of the longest increasing subsequence is:", [
        "3", "4", "5", "7",
      ], 1),
      mcq("q7", "Sweeping the inner amount loop upward within a coin's pass models:", [
        "Each coin used at most once", "Unlimited reuse of that coin", "Coins used in sorted order only", "Exactly two coins per amount",
      ], 1),
      mcq("q8", "For arr = [2, 7, 9, 3, 1] under the no-two-adjacent rule, the maximum sum is:", [
        "11", "12", "16", "22",
      ], 1),
      mcq("q9", "Memoization differs from tabulation chiefly in that memoization:", [
        "Computes a different answer", "Is top-down and evaluates only the states actually reached",
        "Cannot be applied to counting problems", "Always uses less memory",
      ], 1),
      mcq("q10", "Longest Bitonic Subsequence is obtained by combining an LIS computed left-to-right with one computed right-to-left, then subtracting 1 because:", [
        "Bitonic sequences exclude their first element", "The pivot element is counted in both halves",
        "The two passes use different arrays", "The decreasing half is always shorter",
      ], 1),
    ],
  },
];

async function main() {
  const col = db.collection("institutions").doc(INSTITUTION_ID).collection("dailyLearning");

  const mod = await col.doc("_module").get();
  console.log(`_module.enabled = ${mod.exists ? mod.data().enabled : "(missing)"}`);

  let created = 0, skipped = 0;
  for (const d of DAYS) {
    const existing = await col.doc(d.date).get();
    if (existing.exists) {
      console.log(`  SKIP   ${d.date} - already exists: "${existing.data().title}"`);
      skipped++;
      continue;
    }

    const payload = {
      date: d.date,
      weekId: WEEK_ID,
      dow: d.dow,
      type: d.type,
      title: d.title,
      concept: d.concept,
      mcqs: d.mcqs,
      problemIds: d.problemIds,
      xpReward: d.xpReward ?? 50,
      coinReward: d.coinReward ?? 20,
      status: "published",
      audiences: ["legacy"],
      createdAt: FV.serverTimestamp(),
    };

    console.log(`  ${APPLY ? "CREATE" : "would create"} ${d.date} [${d.dow}/${d.type}] ${d.title}`);
    console.log(`         mcqs=${d.mcqs.length} problems=${d.problemIds.length} xp=${payload.xpReward} coins=${payload.coinReward} concept=${d.concept.length} chars`);

    if (APPLY) await col.doc(d.date).set(payload);
    created++;
  }

  const ids = [...new Set(DAYS.flatMap(d => d.problemIds))];
  let bad = 0;
  for (const id of ids) {
    const p = await db.collection("problems").doc(id).get();
    const ok = p.exists && p.data().status === "published";
    if (!ok) { console.log(`  *** BAD problemId ${id} - exists=${p.exists} status=${p.exists ? p.data().status : "-"}`); bad++; }
  }
  console.log(`\nproblemIds checked: ${ids.length}, unresolved: ${bad}`);
  console.log(`${APPLY ? "created" : "would create"}: ${created}   skipped (already present): ${skipped}`);
  if (!APPLY) console.log("\ndry run - re-run with --apply");
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
