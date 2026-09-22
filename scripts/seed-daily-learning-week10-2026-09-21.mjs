// Daily Learning - DSA Series, WEEK 10 (Mon 21 Sep - Sat 26 Sep 2026).
//
//   Week 8  2026-09-07  Greedy Algorithms      Days 40-44 + Week 8 Master Test
//   Week 9  2026-09-14  DP Foundations (1D)    Days 45-49 + Week 9 Master Test
//   Week 10 2026-09-21  Knapsack & Subset DP   Days 50-54 + Week 10 Master Test  <- this file
//   Week 11 2026-09-28  String & Grid DP       Days 55-57 (Mon-Wed, month end)
//
// This is the first of the two CURRENT, earnable weeks (it opens on today's
// date, 2026-09-21). Weeks 8 and 9 backfill the 09-07/09-14 hole and are
// archive-only, since a day completed after its own date earns nothing.
//
// WHY THIS TOPIC NEXT: week 9 ended with an explicit promise - "every state
// this week was one number; that stops working for knapsack, where a
// subproblem needs BOTH which items remain AND how much capacity is left".
// Day 50 is that widening, and it also settles the debt from Day 44, which
// broke ratio-greedy on exactly this problem (160 vs 220) and left it
// unsolved. Day 47's sweep-direction rule (upward = unlimited reuse) is
// paid off twice this week, deliberately: Day 50 sweeps DOWNWARD for 0/1,
// Day 52 sweeps UPWARD for unbounded, and the two lessons are otherwise
// near-identical so the single reversed line is impossible to miss.
// Day 53 then removes the knapsack framing entirely and asks students to
// recognise the same table under three different cover stories, which is
// the actual placement-round skill. Day 54 introduces INTERVAL DP (a state
// of two endpoints rather than index-plus-capacity), which is the exact
// state shape week 11's string DP needs.
//
// DAY NUMBERING continues the titles: week 9's last lesson was Day 49, so
// this week runs Days 50-54. Saturday tests stay unnumbered.
//
// SHAPE matches the live docs exactly:
//   lesson (Mon-Fri): 5 MCQs, xpReward 50,  coinReward 20, 1-2 problemIds
//   test   (Sat):    10 MCQs, xpReward 150, coinReward 60, 2 problemIds
//
// audiences: ["legacy"] - same reasoning weeks 5-9 documented.
//
// problemIds verified live against `problems` (status=="published") and
// re-checked by this script's tail. The Saturday test's two problems are
// deliberately Backtracking-category partition problems the week's lessons
// did NOT set, so the test measures transfer rather than recall.
//
// ASCII hyphens only - scripts/normalize-dashes.mjs rewrites em/en dashes.
//
// Idempotent: refuses to overwrite a date that already exists.
//
//   node scripts/seed-daily-learning-week10-2026-09-21.mjs            # dry run
//   node scripts/seed-daily-learning-week10-2026-09-21.mjs --apply

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
const WEEK_ID = "2026-09-21";

const mcq = (id, text, options, correctIndex) => ({ id, text, options, correctIndex });

const DAYS = [
  {
    date: "2026-09-21", dow: "mon", type: "lesson",
    title: "Day 50: 0/1 Knapsack - The Take-It-or-Leave-It Table",
    problemIds: [
      "WAXGzoqakAhqJKA4MU3d", // 0/1 Knapsack Problem (Medium, DP)
    ],
    concept:
`Day 44 showed ratio-greedy failing on this exact problem: capacity 50, items (60,10), (100,20), (120,30), greedy 160, true optimum 220. Week 9 built the machinery. Today the debt gets paid.

THE PROBLEM: n items, each with a value and a weight. A bag of capacity W. Each item may be taken WHOLE or left behind - no fractions. Maximise total value without exceeding W.

WHY ONE NUMBER IS NOT ENOUGH. Every state last week was a single number, because a single number described the subproblem completely. Here it does not. Knowing only "20 capacity remains" does not determine the answer, because it matters enormously WHICH items are still available to fill it. Two numbers are needed:

  dp[i][w] = the best value obtainable using only the first i items,
             with a bag of capacity w

That is the whole conceptual step of this lesson. Everything below is bookkeeping.

THE RECURRENCE. Consider item i (weight wt, value val). Exactly two things can happen:

  LEAVE IT   the bag is unchanged, and the answer is whatever the first
             i-1 items could do with capacity w:          dp[i-1][w]

  TAKE IT    only legal if wt <= w. Pay wt of capacity, collect val, and
             the rest comes from the first i-1 items with what is left:
                                                          val + dp[i-1][w - wt]

  dp[i][w] = max( dp[i-1][w],  val + dp[i-1][w - wt] )     if wt <= w
  dp[i][w] = dp[i-1][w]                                     if wt > w

  dp[0][w] = 0 for all w      (no items, no value)
  dp[i][0] = 0 for all i      (no capacity, no value)

Note what the second term reads: dp[i-1][...], the row for the PREVIOUS items. That is what enforces "at most once" - once item i is taken, the recursion never looks at item i again.

ROLLING IT TO ONE DIMENSION, AND THE SWEEP DIRECTION. Each row depends only on the row above, so a single array of length W+1 suffices, overwritten item by item. But the sweep direction now carries the entire meaning:

  for each item (val, wt):
      for w from W down to wt:            # DOWNWARD - this is the whole trick
          dp[w] = max(dp[w], dp[w - wt] + val)

Sweeping DOWNWARD guarantees that dp[w - wt] has not yet been touched during this item's pass, so it still holds the previous row's value - the value BEFORE this item existed. The item therefore cannot be taken twice. Sweep upward instead and dp[w - wt] would already include this item, letting it be reused freely - which is Wednesday's unbounded knapsack, a different problem. One loop direction separates them.

TRACED. Capacity 7, items (value, weight): (1,1), (4,3), (5,4), (7,5).

  start                      dp = [0, 0, 0, 0, 0, 0, 0, 0]     (index 0..7)

  item (1,1), w: 7 down to 1
                             dp = [0, 1, 1, 1, 1, 1, 1, 1]

  item (4,3), w: 7 down to 3
      dp[7] = max(1, dp[4] + 4 = 1 + 4) = 5
      dp[6] = max(1, dp[3] + 4 = 1 + 4) = 5
      dp[5] = max(1, dp[2] + 4 = 1 + 4) = 5
      dp[4] = max(1, dp[1] + 4 = 1 + 4) = 5
      dp[3] = max(1, dp[0] + 4 = 0 + 4) = 4
                             dp = [0, 1, 1, 4, 5, 5, 5, 5]

  item (5,4), w: 7 down to 4
      dp[7] = max(5, dp[3] + 5 = 4 + 5) = 9
      dp[6] = max(5, dp[2] + 5 = 1 + 5) = 6
      dp[5] = max(5, dp[1] + 5 = 1 + 5) = 6
      dp[4] = max(5, dp[0] + 5 = 0 + 5) = 5
                             dp = [0, 1, 1, 4, 5, 6, 6, 9]

  item (7,5), w: 7 down to 5
      dp[7] = max(9, dp[2] + 7 = 1 + 7) = 9
      dp[6] = max(6, dp[1] + 7 = 1 + 7) = 8
      dp[5] = max(6, dp[0] + 7 = 0 + 7) = 7
                             dp = [0, 1, 1, 4, 5, 7, 8, 9]

  answer: dp[7] = 9, from items (4,3) and (5,4) - weight 3 + 4 = 7 exactly.

  Sanity check by hand: (7,5) + (1,1) = value 8 at weight 6; (7,5) + (4,3)
  weighs 8 and does not fit. 9 is right.

COMPLEXITY: O(n x W) time, O(W) space after the rolling. Both matter.

A WARNING ABOUT THAT COMPLEXITY. O(n x W) looks polynomial and is not - W is a VALUE in the input, not a count of items, and writing it down takes only log W digits. An instance with n = 20 and W = 1,000,000,000 is tiny to state and hopeless for this table. Such an algorithm is called PSEUDO-POLYNOMIAL. 0/1 knapsack is NP-hard, and this DP does not contradict that; it is simply fast whenever W is small, which in placement constraints it always is. Knowing the term, and why it applies, is a genuine interview differentiator.

THE RECONSTRUCTION. The table gives the best VALUE. To recover WHICH items were taken, keep the full 2-D table and walk backwards from dp[n][W]: if dp[i][w] equals dp[i-1][w] then item i was left behind, so move to (i-1, w); otherwise item i was taken, so record it and move to (i-1, w - wt). The rolled 1-D array cannot do this - it has overwritten the history. That is the standing trade: rolling saves memory and destroys the ability to reconstruct.`,
    mcqs: [
      mcq("q1", "The state dp[i][w] in 0/1 knapsack represents the best value using:", [
        "Exactly i items with total weight exactly w", "The first i items with capacity at most w",
        "Any i items with capacity exactly w", "The i heaviest items with capacity w",
      ], 1),
      mcq("q2", "In the rolled 1-D version, the inner capacity loop must run DOWNWARD because:", [
        "It is faster on modern CPUs", "It keeps dp[w - wt] at its previous-row value, so each item is used at most once",
        "Upward sweeps skip the base case", "The weights are sorted descending",
      ], 1),
      mcq("q3", "For capacity 7 and items (value, weight) = (1,1), (4,3), (5,4), (7,5), the maximum value is:", [
        "8", "9", "11", "12",
      ], 1),
      mcq("q4", "0/1 knapsack's O(n x W) DP is called pseudo-polynomial because:", [
        "It uses two nested loops", "W is a numeric value in the input, not a count, so the table can be astronomically large",
        "It only works for integer weights", "The recursion depth is exponential",
      ], 1),
      mcq("q5", "Recovering WHICH items were chosen requires the full 2-D table because:", [
        "The 1-D array stores values as floats", "The rolled 1-D array has overwritten the per-item history",
        "The items must be re-sorted", "The 1-D version computes a different optimum",
      ], 1),
    ],
  },

  {
    date: "2026-09-22", dow: "tue", type: "lesson",
    title: "Day 51: Subset Sum & Equal Partition",
    problemIds: [
      "urTe5v9K4UHx4nIJAms3", // Subset Sum Problem (Medium, Backtracking)
      "qY0QpJXD6C7kPFFp8CHH", // Subset Sums (Medium, Backtracking)
    ],
    concept:
`Yesterday's table maximised a value. Today the same table answers a yes/no question, and once you see that subset sum IS knapsack with the values deleted, an entire family of interview problems collapses into one recurrence.

THE PROBLEM - SUBSET SUM: given an array of positive integers and a target, does ANY subset sum to exactly that target?

THE REDUCTION. Take 0/1 knapsack and set every item's value equal to its weight, with the bag capacity equal to the target. Then "can I hit exactly the target" becomes "can I fill the bag completely". Rather than carry values at all, store booleans:

  dp[i][t] = true if some subset of the first i elements sums to exactly t

  dp[i][t] = dp[i-1][t]                        # skip element i
             OR dp[i-1][t - arr[i]]            # take it, if arr[i] <= t

  dp[0][0] = true       (the empty subset sums to 0)
  dp[0][t] = false for t > 0

Same skeleton as yesterday, with max replaced by OR and the base case dp[0][0] = true playing the role Day 47's dp[0] = 1 played for counting. All three are the same statement: the empty selection is legal and achieves nothing.

ROLLED TO 1-D, sweeping downward for exactly the reason established yesterday:

  dp = [false] * (target + 1)
  dp[0] = true
  for x in arr:
      for t from target down to x:
          dp[t] = dp[t] or dp[t - x]
  return dp[target]

TRACED. arr = [3, 34, 4, 12, 5, 2], target 9. Writing T for true:

  start              dp[0]=T, everything else false

  x = 3              dp[3] = T                      reachable: {0, 3}
  x = 34             34 > 9, contributes nothing    reachable: {0, 3}
  x = 4              dp[7] |= dp[3] -> T
                     dp[4] |= dp[0] -> T            reachable: {0, 3, 4, 7}
  x = 12             12 > 9, nothing                reachable: {0, 3, 4, 7}
  x = 5              dp[9] |= dp[4] -> T            <- target hit
                     dp[8] |= dp[3] -> T
                     dp[5] |= dp[0] -> T            reachable: {0, 3, 4, 5, 7, 8, 9}
  x = 2              dp[9] already T; dp[6] |= dp[4] -> T; dp[2] |= dp[0] -> T

  answer: TRUE - the subset {4, 5} sums to 9.

  Notice the downward sweep at work on x = 5: dp[9] read dp[4], which was
  set by the earlier element 4, NOT by 5 itself. Sweeping upward would have
  let dp[5] become true and then dp[10] read it, using the single 5 twice.

THE HEADLINE APPLICATION - EQUAL SUM PARTITION: can the array be split into two subsets with equal sums?

Two observations reduce it entirely to subset sum:

  1. If the total sum S is ODD, the answer is immediately false - two equal
     integers cannot sum to an odd number. Check this first; it is free and
     it is the single most common omission.
  2. Otherwise, the two halves must each total S/2. Finding one such subset
     automatically leaves the other, so the question is exactly:
     "is there a subset summing to S/2?"

  arr = [1, 5, 11, 5]:  S = 22, even, so look for a subset summing to 11.
                        {11} works, leaving {1, 5, 5} which also sums to 11.
                        TRUE.

  arr = [1, 5, 3]:      S = 9, odd. FALSE, with no table needed at all.

THE SAME TABLE, MORE QUESTIONS. Once dp holds "which totals are reachable", several standard problems are one extra line:

  COUNT of subsets hitting a target     store integers and use += instead of OR
                                        (that is precisely Day 47, with a
                                        DOWNWARD sweep for use-at-most-once)
  MINIMUM SUBSET-SUM DIFFERENCE         find the reachable total t nearest to
                                        S/2 and answer S - 2t
  ALL achievable subset sums            return every index where dp is true

That last one is the "Subset Sums" problem set today: for small n it is often done by plain recursion over take/skip, generating 2^n sums - and for n <= 20 or so that is entirely reasonable, and simpler to write than the table. Knowing when the exponential enumeration is ACCEPTABLE is as valuable as knowing the DP; the table wins when n is large and the target is small, the enumeration wins when n is small and the sums are huge.

COMPLEXITY: O(n x target) time, O(target) space - pseudo-polynomial again, for the same reason as yesterday.`,
    mcqs: [
      mcq("q1", "Subset Sum is 0/1 knapsack with:", [
        "Values doubled", "Each item's value set equal to its weight, asking whether the bag fills exactly",
        "Fractional items permitted", "The capacity set to the number of items",
      ], 1),
      mcq("q2", "The base case dp[0] = true in the rolled subset-sum array states that:", [
        "The first element is always usable", "The empty subset sums to 0",
        "Zero is present in the array", "The target must be positive",
      ], 1),
      mcq("q3", "For arr = [3, 34, 4, 12, 5, 2] and target 9, subset sum returns:", [
        "False", "True, via {4, 5}", "True, via {3, 4, 2}", "True, via {3, 5}",
      ], 1),
      mcq("q4", "The first check in Equal Sum Partition, before building any table, is:", [
        "Whether the array is sorted", "Whether the total sum is odd, in which case the answer is immediately false",
        "Whether the array length is even", "Whether the maximum element exceeds half the sum",
      ], 1),
      mcq("q5", "Minimum subset-sum difference is read off the same boolean table by finding the reachable total t closest to S/2 and answering:", [
        "S/2 - t", "S - 2t", "2t - S/2", "t - S",
      ], 1),
    ],
  },

  {
    date: "2026-09-23", dow: "wed", type: "lesson",
    title: "Day 52: Unbounded Knapsack - Rod Cutting & Unlimited Supply",
    problemIds: [
      "lemd3AYgmxjLZSluG5GE", // Unbounded Knapsack (Repetition of Items Allowed) (Medium, DP)
      "z8yI8dGSS9FX9V4ZyQE4", // Rod Cutting Problem (Medium, DP)
    ],
    concept:
`Today's lesson differs from Monday's by one character: the direction of the inner loop. Everything else - the state, the recurrence, the base case, the complexity - is unchanged. That is the entire point of placing them two days apart.

THE PROBLEM - UNBOUNDED KNAPSACK: the same items and the same bag, except each item may now be taken ANY NUMBER OF TIMES.

THE RECURRENCE, AND THE ONE CHANGED INDEX:

  0/1:        dp[i][w] = max( dp[i-1][w],  val + dp[i-1][w - wt] )
  unbounded:  dp[i][w] = max( dp[i-1][w],  val + dp[i]  [w - wt] )
                                                     ^^^
After taking item i we stay on row i instead of dropping to row i-1, so item i is immediately available again. Rolled to one dimension, staying on the current row is exactly what an UPWARD sweep achieves:

  for each item (val, wt):
      for w from wt up to W:              # UPWARD
          dp[w] = max(dp[w], dp[w - wt] + val)

Sweeping upward, dp[w - wt] has ALREADY been updated for this item during this same pass, so it may already contain one copy of the item - and reading it adds another. That is precisely the unlimited reuse we want, and it is precisely the bug that would break Monday's problem. Day 47 promised this pairing; here it is, in full:

  inner loop DOWNWARD -> each item at most once   (0/1 knapsack, subset sum)
  inner loop UPWARD   -> unlimited copies         (unbounded knapsack, coin change)

Write both loops out once by hand. Nearly every knapsack-family bug in an interview is this line reversed.

ROD CUTTING is unbounded knapsack in disguise, and it is the version placement papers prefer. A rod of length n can be cut into integer pieces; a piece of length i sells for price[i]. Maximise the total. The mapping: piece length is weight, price is value, rod length is capacity, and you may cut as many pieces of a given length as you like - unlimited supply.

  dp[len] = max over every piece length i <= len of ( price[i] + dp[len - i] )
  dp[0]   = 0

TRACED. n = 8, with prices for lengths 1..8 of [1, 5, 8, 9, 10, 17, 17, 20]:

  dp[0] = 0
  dp[1] = price[1] + dp[0] = 1                                        = 1
  dp[2] = max( 1 + dp[1] = 2,  5 + dp[0] = 5 )                        = 5
  dp[3] = max( 1 + dp[2] = 6,  5 + dp[1] = 6,  8 + dp[0] = 8 )        = 8
  dp[4] = max( 1 + dp[3] = 9,  5 + dp[2] = 10, 8 + dp[1] = 9,
               9 + dp[0] = 9 )                                        = 10
  dp[5] = max( 1 + dp[4] = 11, 5 + dp[3] = 13, 8 + dp[2] = 13,
               9 + dp[1] = 10, 10 + dp[0] = 10 )                      = 13
  dp[6] = max( 1 + dp[5] = 14, 5 + dp[4] = 15, 8 + dp[3] = 16,
               9 + dp[2] = 14, 10 + dp[1] = 11, 17 + dp[0] = 17 )     = 17
  dp[7] = max( 1 + dp[6] = 18, 5 + dp[5] = 18, 8 + dp[4] = 18,
               9 + dp[3] = 17, 10 + dp[2] = 15, 17 + dp[1] = 18,
               17 + dp[0] = 17 )                                      = 18
  dp[8] = max( 1 + dp[7] = 19, 5 + dp[6] = 22, 8 + dp[5] = 21,
               9 + dp[4] = 19, 10 + dp[3] = 18, 17 + dp[2] = 22,
               17 + dp[1] = 18, 20 + dp[0] = 20 )                     = 22

  answer: 22 - cut into lengths 2 and 6, selling for 5 + 17.

  Worth noticing: selling the rod whole fetches only 20, and the greedy
  "best price per unit length" rule picks length 6 first (17/6 = 2.83),
  leaving length 2 for 5 - which happens to give 22 here, but on a
  different price list that same rule fails exactly the way Day 44's coin
  greedy did. The table is not optional.

WHICH KNAPSACK AM I LOOKING AT? The three-question triage, worth memorising:

  Can each item be used at most once?      -> 0/1        downward sweep
  Can items be reused without limit?       -> unbounded  upward sweep
  Can items be cut into fractions?         -> greedy by value/weight ratio,
                                              no table at all (Day 44)

The third is the one that catches people, because fractional knapsack is the only member of the family that is NOT dynamic programming. If the problem lets you take half an item, stop building a table and sort by ratio.

COMPLEXITY: O(n x W) time, O(W) space - identical to 0/1. The reuse does not cost anything extra, because the table still has exactly the same number of cells.`,
    mcqs: [
      mcq("q1", "Unbounded knapsack differs from 0/1 in the rolled 1-D implementation by:", [
        "Using a different base case", "Sweeping the inner capacity loop upward instead of downward",
        "Sorting items by value first", "Requiring a 2-D table",
      ], 1),
      mcq("q2", "In the 2-D unbounded recurrence, the take branch reads dp[i][w - wt] rather than dp[i-1][w - wt] because:", [
        "Row i-1 is not yet computed", "Item i must remain available for reuse after being taken",
        "It saves memory", "The items are processed in reverse",
      ], 1),
      mcq("q3", "For a rod of length 8 with prices [1, 5, 8, 9, 10, 17, 17, 20] for lengths 1 to 8, the maximum obtainable value is:", [
        "20", "21", "22", "24",
      ], 2),
      mcq("q4", "That optimum is achieved by cutting the rod into pieces of length:", [
        "8 (uncut)", "2 and 6", "1 and 7", "4 and 4",
      ], 1),
      mcq("q5", "Which member of the knapsack family is NOT solved with a DP table?", [
        "0/1 knapsack", "Unbounded knapsack", "Fractional knapsack", "Subset sum",
      ], 2),
    ],
  },

  {
    date: "2026-09-24", dow: "thu", type: "lesson",
    title: "Day 53: Knapsack in Disguise - Recognising the Pattern",
    problemIds: [
      "eZaybzYl45XZo8pXJaT3", // Minimum Cost to Fill a Bag With Given Weight (Medium, DP)
      "xKl42fOUcLooz0TQJHdo", // Maximum Sum of Pairs With Specific Difference (Medium, DP)
    ],
    concept:
`Three days of knapsack. No placement paper will ever use the word. Today is about the actual skill: reading a problem that mentions oranges, or CPU jobs, or pairs of numbers, and recognising the table underneath it.

THE FOUR SIGNALS. A problem is in the knapsack family when all of these hold:

  1. There is a collection of discrete items.
  2. Each item is either IN or OUT (or in-k-times for the unbounded case) -
     no partial inclusion.
  3. There is a running total that must respect a budget or hit a target
     exactly - weight, cost, time, capacity, sum.
  4. Something else is being maximised, minimised, or counted.

If all four are present, write dp over (items processed, budget consumed) and move on. The story is decoration.

DISGUISE 1 - MINIMUM COST TO FILL A BAG. You are given cost[i], the price of a packet weighing exactly i kilograms, where cost[i] = -1 means that size is not sold. Buy exactly W kilograms at minimum total cost, with unlimited packets of each available size.

Strip the story: packets are items, kilograms are capacity, unlimited supply means UNBOUNDED, and we MINIMISE instead of maximising. So it is Wednesday's rod cutting with min for max, plus two details that decide correctness:

  - Filter out every i where cost[i] == -1 BEFORE building the table.
    Treating -1 as a real price makes it look like a wonderfully cheap
    packet and produces a negative "optimum". This is the single most
    common wrong submission on this problem.
  - Initialise unreachable states to infinity, not to 0. With min, a stray
    0 is an unbeatable false answer, so dp[0] = 0 and dp[t > 0] = infinity.
    If dp[W] is still infinity at the end, W is genuinely unreachable and
    the answer is -1.

  dp[0] = 0;  dp[t] = infinity for t > 0
  for each available packet size i:
      for t from i up to W:                    # upward - unlimited supply
          if dp[t - i] is not infinity:
              dp[t] = min(dp[t], dp[t - i] + cost[i])
  answer = dp[W] if finite else -1

DISGUISE 2 - MAXIMUM SUM OF PAIRS WITH A SPECIFIC DIFFERENCE. Given an array and a number K, pick disjoint pairs of elements such that the two members of each pair differ by strictly less than K, and maximise the sum of all the chosen pairs' elements. Each element may belong to at most one pair.

There is no bag here at all, and yet the same reasoning applies once you make one move: SORT the array. After sorting, any pair worth taking must be ADJACENT - if a and c are pairable with b sitting between them, then a and b differ by less, and b is at least as large as a, so pairing the larger neighbours is never worse. That single observation reduces the problem to Day 49's house-robber shape over adjacent pairs:

  dp[i] = best using the first i sorted elements
  dp[i] = max( dp[i-1],                                        # leave element i-1 unpaired
               dp[i-2] + a[i-2] + a[i-1] )                     # pair the last two, if they differ by < K

TRACED. arr = [3, 5, 10, 15, 17, 12, 9], K = 4.

  sorted: [3, 5, 9, 10, 12, 15, 17]

  dp[0] = 0
  dp[1] = 0                                              (one element cannot pair)
  dp[2]: 5 - 3 = 2 < 4   -> max(0, 0 + 3 + 5 = 8)        = 8
  dp[3]: 9 - 5 = 4, NOT < 4 -> cannot pair               = 8
  dp[4]: 10 - 9 = 1 < 4  -> max(8, dp[2] + 9 + 10 = 27)  = 27
  dp[5]: 12 - 10 = 2 < 4 -> max(27, dp[3] + 10 + 12 = 30) = 30
  dp[6]: 15 - 12 = 3 < 4 -> max(30, dp[4] + 12 + 15 = 54) = 54
  dp[7]: 17 - 15 = 2 < 4 -> max(54, dp[5] + 15 + 17 = 62) = 62

  answer: 62, from the pairs (9,10), (12,15) ... check: 9+10+12+15 = 46.
  Recompute the winner from dp[7]'s branch: dp[5] + 15 + 17 = 30 + 32,
  and dp[5] came from dp[3] + 10 + 12 = 8 + 22, and dp[3] = dp[2] = 8
  which came from 3 + 5. So the pairs are (3,5), (10,12), (15,17):
  8 + 22 + 32 = 62. Element 9 is left unpaired.

  The strict inequality on K is deliberate - at dp[3] the difference was
  exactly 4 and the pair was rejected. Misreading "less than K" as "at most
  K" changes the answer, and problem statements in this family are
  consistently precise about it.

THE HABIT TO BUILD. When a problem resists, ask the four signals. If they fit, the next question is only which sweep direction (Day 50 versus Day 52) and whether you are maximising, minimising, or counting - and those three differ solely in the operator (max, min, +) and the initial fill (0, infinity, or 0-with-dp[0]=1). The table never changes.`,
    mcqs: [
      mcq("q1", "The four signals that identify a knapsack-family problem include all EXCEPT:", [
        "Discrete items that are in or out", "A running total constrained by a budget or exact target",
        "A quantity being maximised, minimised or counted", "The items must be sortable by value/weight ratio",
      ], 3),
      mcq("q2", "In Minimum Cost to Fill a Bag, entries with cost[i] == -1 must be filtered out because:", [
        "They make the array unsorted", "A -1 read as a real price looks cheapest and produces a negative optimum",
        "Negative indices are illegal", "They break the upward sweep",
      ], 1),
      mcq("q3", "For a MINIMISING knapsack, unreachable states must be initialised to:", [
        "0", "-1", "Infinity", "The target value",
      ], 2),
      mcq("q4", "In Maximum Sum of Pairs With Specific Difference, sorting first is justified because after sorting:", [
        "Every element becomes pairable", "Any pair worth taking is adjacent",
        "The differences all become equal", "The array can be processed greedily with no DP",
      ], 1),
      mcq("q5", "For arr = [3, 5, 10, 15, 17, 12, 9] with K = 4, the maximum pair sum is:", [
        "54", "58", "62", "66",
      ], 2),
    ],
  },

  {
    date: "2026-09-25", dow: "fri", type: "lesson",
    title: "Day 54: Interval DP - Optimal Play From Both Ends",
    problemIds: [
      "wGQFxvRbfp4WH2qN26Ny", // Optimal Strategy for a Game (Hard, DP)
    ],
    concept:
`Every state so far has been a prefix - "the first i items" - plus perhaps a budget. Today the state becomes a RANGE, described by its two endpoints, and the table is filled by increasing range length rather than by increasing index. This is INTERVAL DP, and it is the state shape week 11 needs for strings.

THE PROBLEM - OPTIMAL STRATEGY FOR A GAME: a row of n coins with known values. Two players alternate; on your turn you take either the leftmost or the rightmost coin. Both play optimally. You move first. What is the maximum total you can guarantee?

THE TRAP THAT CATCHES EVERYONE. The obvious greedy - always take the larger end - is wrong, and Day 44 already taught why to distrust it. On [5, 3, 7, 10] greedy takes 10, then the opponent faces [5, 3, 7] and takes 7, and you end with 10 + 5 = 15. That happens to be optimal here, but on [8, 15, 3, 7] greedy takes 15, the opponent takes 8, and you finish with 15 + 7 = 22 while a different first move does better. The reason is structural: the value of a move is not the coin you take, it is the coin you take MINUS what your choice hands the opponent.

THE STATE: dp[i][j] = the maximum value the player to move can guarantee from the coins in positions i through j inclusive.

THE RECURRENCE, AND THE min THAT MATTERS. If you take coin i, the opponent then plays optimally on the range (i+1, j). Whatever they do, YOU are left with either (i+2, j) - if they take from the left - or (i+1, j-1) - if they take from the right. You do not get to choose which; they do, and they will choose the one that is worse for you. So you must assume the MINIMUM:

  dp[i][j] = max(
        a[i] + min( dp[i+2][j],  dp[i+1][j-1] ),     # you take the left coin
        a[j] + min( dp[i+1][j-1], dp[i][j-2]  )      # you take the right coin
  )

  dp[i][i]   = a[i]                       (one coin: take it)
  dp[i][i+1] = max(a[i], a[i+1])          (two coins: take the bigger)

The inner min is the whole lesson. A maximising recurrence that forgets the adversary and writes max inside as well produces a number that no actual play can achieve. Any two-player optimal-play problem has this alternating max/min shape.

TRACED on a = [5, 3, 7, 10], indices 0..3.

  length 1:   dp[0][0] = 5    dp[1][1] = 3    dp[2][2] = 7    dp[3][3] = 10

  length 2:   dp[0][1] = max(5, 3)  = 5
              dp[1][2] = max(3, 7)  = 7
              dp[2][3] = max(7, 10) = 10

  length 3:   dp[0][2] = max( a[0] + min(dp[2][2], dp[1][1]),
                              a[2] + min(dp[1][1], dp[0][0]) )
                       = max( 5 + min(7, 3),  7 + min(3, 5) )
                       = max( 5 + 3,          7 + 3 )
                       = max( 8, 10 )                          = 10

              dp[1][3] = max( a[1] + min(dp[3][3], dp[2][2]),
                              a[3] + min(dp[2][2], dp[1][1]) )
                       = max( 3 + min(10, 7), 10 + min(7, 3) )
                       = max( 3 + 7,          10 + 3 )
                       = max( 10, 13 )                         = 13

  length 4:   dp[0][3] = max( a[0] + min(dp[2][3], dp[1][2]),
                              a[3] + min(dp[1][2], dp[0][1]) )
                       = max( 5 + min(10, 7),  10 + min(7, 5) )
                       = max( 5 + 7,           10 + 5 )
                       = max( 12, 15 )                         = 15

  answer: 15. Total of all coins is 25, so the opponent gets 10.

  Reading the winning line: take the right coin (10); the opponent then
  plays dp[0][2] optimally and secures 10; you collect the remaining 5.

THE FILL ORDER IS THE NEW IDEA. dp[i][j] depends on ranges that are SHORTER than (i, j), never on longer ones. So the loops cannot run over i and j directly - they must run over LENGTH:

  for length in 1..n:
      for i in 0..n-length:
          j = i + length - 1
          ... compute dp[i][j] ...

Every prior DP this month filled left to right because "shorter prefix" meant "smaller index". Here "smaller subproblem" means "shorter range", and the loop structure has to say so. Getting this wrong reads uninitialised cells and silently returns garbage - there is no error, just a wrong number.

GUARDING THE INDICES. dp[i+2][j] and dp[i][j-2] can run off the end of the range when the interval is short. Treat any range with i > j as worth 0 (no coins left to take). Handling that case explicitly, rather than relying on array defaults, is what makes the implementation correct on n = 1 and n = 2.

COMPLEXITY: O(n^2) states, O(1) work each, so O(n^2) time and O(n^2) space. The space cannot be rolled away here the way a prefix DP's can, because a range depends on two shorter ranges at both ends rather than on a single previous row.

WHAT THIS UNLOCKS. Interval DP with a length-ordered fill is the engine behind matrix chain multiplication, optimal binary search trees, burst balloons, palindromic partitioning, and - starting Monday - the two-string DPs. The state is different from everything before it, and the four questions from Day 45 still built it.`,
    mcqs: [
      mcq("q1", "In interval DP, dp[i][j] describes a subproblem defined by:", [
        "The first i items with budget j", "The contiguous range from index i to index j",
        "The i-th item at capacity j", "The longest subsequence between i and j",
      ], 1),
      mcq("q2", "The Optimal Strategy recurrence contains an inner min because:", [
        "The coin values may be negative", "The opponent plays optimally and will leave you the worse of the two options",
        "It guarantees the loop terminates", "Minimum values are easier to compute",
      ], 1),
      mcq("q3", "For coins [5, 3, 7, 10], the first player can guarantee at most:", [
        "13", "15", "17", "18",
      ], 1),
      mcq("q4", "Interval DP tables must be filled in order of increasing:", [
        "Left endpoint i", "Right endpoint j", "Range length", "Coin value",
      ], 2),
      mcq("q5", "Interval DP cannot usually be rolled down to O(n) space because:", [
        "The values are too large", "A range depends on shorter ranges at both ends, not on one previous row",
        "The recursion is not tail-recursive", "The table is triangular",
      ], 1),
    ],
  },

  {
    date: "2026-09-26", dow: "sat", type: "test",
    title: "Week 10 Master Test: Knapsack & Subset DP",
    xpReward: 150, coinReward: 60,
    problemIds: [
      "YNH6LbW7KVOixFzjaI1Z", // Partition of a Set Into K Subsets With Equal Sum (Hard, Backtracking)
      "Y9cLvdvT5es3y7C1ir4o", // Tug of War (Medium, Backtracking)
    ],
    concept:
`Week 10 in one page, then ten questions across all five days.

THE STATE WIDENED. Week 9's states were single numbers. This week a subproblem needed two coordinates: which items remain AND how much budget is left. The four questions from Day 45 (state, recurrence, base case, fill order) built every table here unchanged - only the state got wider.

THE FIVE DAYS.

  Day 50  0/1 knapsack       dp[i][w] = max(dp[i-1][w], val + dp[i-1][w-wt]). Rolled to 1-D with a DOWNWARD sweep so each item is used at most once. O(n x W), pseudo-polynomial. Reconstruction needs the full 2-D table.
  Day 51  Subset sum         the same table with values deleted and OR for max; dp[0] = true. Equal partition = subset sum for S/2, and is false outright when S is odd.
  Day 52  Unbounded          one character changes: dp[i][w-wt] instead of dp[i-1][w-wt], i.e. an UPWARD sweep. Rod cutting is this problem. Fractional knapsack is the family member that is greedy, not DP.
  Day 53  Disguises          four signals identify the family. Minimum-cost variants need infinity-initialisation and must filter unavailable items. Sorting can convert a pairing problem into the house-robber shape.
  Day 54  Interval DP        state is a RANGE (i, j); fill by increasing LENGTH. Two-player optimal play needs max outside and min inside, because the opponent chooses what you are left with.

THE SWEEP-DIRECTION TABLE - the one thing to have memorised walking into an interview:

  downward inner loop  ->  each item at most once   ->  0/1 knapsack, subset sum, equal partition
  upward inner loop    ->  unlimited copies         ->  unbounded knapsack, rod cutting, coin change
  no table at all      ->  fractions allowed        ->  fractional knapsack, sort by value/weight

WHAT CARRIES INTO WEEK 11. Day 54's interval state - two endpoints, filled by length - is the bridge. Next week runs DP over two strings at once, where the state is a position in each string, and the fill order is again dictated by which cells the recurrence reads rather than by the order the input happens to be in.`,
    mcqs: [
      mcq("q1", "In the rolled 1-D 0/1 knapsack, the inner capacity loop runs downward in order to:", [
        "Visit heavier items first", "Ensure dp[w - wt] still holds the value from before this item",
        "Avoid integer overflow", "Allow the item to be reused",
      ], 1),
      mcq("q2", "For capacity 7 and items (value, weight) = (1,1), (4,3), (5,4), (7,5), the optimum is:", [
        "8", "9", "10", "12",
      ], 1),
      mcq("q3", "Equal Sum Partition is immediately false, with no table required, when:", [
        "The array contains a zero", "The total sum is odd", "The array length is odd", "The largest element is even",
      ], 1),
      mcq("q4", "Unbounded knapsack's 2-D recurrence differs from 0/1's by reading:", [
        "dp[i-1][w] instead of dp[i][w]", "dp[i][w - wt] instead of dp[i-1][w - wt]",
        "dp[i-1][w + wt] instead of dp[i-1][w - wt]", "dp[i][0] instead of dp[0][w]",
      ], 1),
      mcq("q5", "For a rod of length 8 with prices [1, 5, 8, 9, 10, 17, 17, 20], the best value is:", [
        "20", "21", "22", "25",
      ], 2),
      mcq("q6", "In a MINIMISING knapsack variant, unreachable states are initialised to infinity rather than 0 because:", [
        "0 is not a valid cost", "A stray 0 would win every min comparison and report an unachievable answer",
        "Infinity is faster to compare", "The base case requires it",
      ], 1),
      mcq("q7", "Which knapsack variant is correctly solved greedily, with no DP table?", [
        "0/1 knapsack", "Unbounded knapsack", "Fractional knapsack", "Subset sum",
      ], 2),
      mcq("q8", "The Optimal Strategy for a Game recurrence takes a min over the opponent's two replies because:", [
        "Coin values can be zero", "The opponent will leave you whichever option is worse for you",
        "Both replies are equally likely", "It bounds the recursion depth",
      ], 1),
      mcq("q9", "An interval DP table must be filled in increasing order of range length because dp[i][j] depends on:", [
        "Longer ranges containing it", "Strictly shorter ranges", "Only dp[i-1][j-1]", "The sorted order of the values",
      ], 1),
      mcq("q10", "Calling the O(n x W) knapsack DP pseudo-polynomial means that:", [
        "It is only approximately correct", "W is a value in the input, so the running time is exponential in the input's bit length",
        "It runs in O(n log W)", "It works only when all weights are distinct",
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
