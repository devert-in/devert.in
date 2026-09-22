// Daily Learning - DSA Series, WEEK 8 (Mon 7 Sep - Sat 12 Sep 2026).
//
// Continues the existing sequence exactly:
//   Week 1  2026-07-20  Arrays              Days 1-5   + Week 1 Recap Test
//   Week 2  2026-07-27  Linked Lists        Days 8-12  + Week 2 Master Test
//   Week 3  2026-08-03  Stacks & Queues     Days 13-17 + Week 3 Master Test
//   Week 4  2026-08-10  Recursion & Trees   Days 18-22 + Week 4 Master Test
//   Week 5  2026-08-17  Heaps & Hashing     Days 25-29 + Week 5 Master Test
//   Week 6  2026-08-24  Graphs              Days 30-34 + Week 6 Master Test
//   Week 7  2026-08-31  Advanced Graphs     Days 35-39 + Week 7 Master Test
//   Week 8  2026-09-07  Greedy Algorithms   Days 40-44 + Week 8 Master Test  <- this file
//
// NOTE ON THE GAP: the live track's last item is 2026-09-05 (week 7's
// Saturday test). Weeks of 09-07 and 09-14 were never seeded, so this file
// and week9's backfill that hole; both were authored on 2026-09-21 at the
// maintainer's explicit request to "fill from where we left" through month
// end. Days completed after their own date earn nothing (see
// lib/dailyLearning.js's late-completion rule) - these two weeks exist for
// sequence continuity and for students working the archive, not as earnable
// days. Weeks 10 (09-21) and 11 (09-28) are the live, earnable ones.
//
// WHY THIS TOPIC NEXT: week 7 spent two days (36: Kruskal's, 37: Prim's)
// building minimum spanning trees by repeatedly grabbing the cheapest
// available edge and never reconsidering it - and never once named that
// strategy or justified why it is allowed to work. This week names it.
// Day 40 states the two properties a problem must have before greedy is
// even legal (greedy choice property + optimal substructure) and proves
// one with an exchange argument; Days 41-43 apply it to the three shapes
// placement papers actually ask (sort-then-sweep, schedule-into-slots,
// rearrange-for-an-objective); Day 42 reuses week 7's own Union-Find
// (Day 35) as the slot-finding structure, closing that loop. Day 44
// deliberately breaks greedy on coin change {1,3,4} and on 0/1 knapsack -
// the exact two counterexamples week 9 opens on, so DP arrives as the
// answer to a question this week actually asked rather than as a new
// topic dropped in cold.
//
// DAY NUMBERING continues the titles: week 7's last lesson was "Day 39"
// (2026-09-04), so this week opens on Day 40. (Saturday tests are titled
// "Week N Master Test", never numbered - same as every week before.)
// currentDayIndex in lib/dailyLearning.js is computed from DATES, not from
// these titles, so the historical title jumps (5->8, 22->25) are cosmetic
// and are deliberately not "fixed" here.
//
// SHAPE matches the live docs exactly (checked against weeks 6 and 7):
//   lesson (Mon-Fri): 5 MCQs, xpReward 50,  coinReward 20, 1-2 problemIds
//   test   (Sat):    10 MCQs, xpReward 150, coinReward 60, 2 problemIds
//   date, weekId (the week's Monday), dow, type, title, concept, mcqs[],
//   problemIds[], status "published", audiences ["legacy"], createdAt.
//
// audiences: ["legacy"] is deliberate, not a placeholder - same reasoning
// weeks 5/6/7 all documented; anything else would make the week invisible
// to every existing reader (no account carries an `auds` claim yet).
//
// problemIds are REAL ids, verified live against the `problems` collection
// (status=="published", category=="Greedy") and re-checked by this script's
// own tail before it reports success. Days 40-44 each carry only the
// problem(s) that match THAT day's exact technique - Day 41 and Day 44's
// second slot deliberately carry one problem each rather than padding with
// a Greedy problem that tests a different idea.
//
// ASCII hyphens only - scripts/normalize-dashes.mjs rewrites em/en dashes
// across the database, so authoring them here just creates churn.
//
// Idempotent: refuses to overwrite a date that already exists.
//
//   node scripts/seed-daily-learning-week8-2026-09-07.mjs            # dry run
//   node scripts/seed-daily-learning-week8-2026-09-07.mjs --apply

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
const WEEK_ID = "2026-09-07";

const mcq = (id, text, options, correctIndex) => ({ id, text, options, correctIndex });

const DAYS = [
  {
    date: "2026-09-07", dow: "mon", type: "lesson",
    title: "Day 40: The Greedy Choice - Activity Selection & the Exchange Argument",
    problemIds: [
      "zXGkd51Xlc6qmVVy0dAo", // Activity Selection Problem (Medium, Greedy)
    ],
    concept:
`You have already written two greedy algorithms without being told that is what they were. Kruskal's (Day 36) sorted every edge by weight and swallowed each one that did not close a cycle. Prim's (Day 37) repeatedly pulled the cheapest edge leaving the tree. Neither ever went back and undid a choice. Both were provably optimal. This week is about why that is allowed - and, on Friday, about when it is emphatically not.

WHAT "GREEDY" ACTUALLY MEANS: build the answer one irrevocable decision at a time. At each step take whatever looks best by some simple local rule, commit to it, and never reconsider. There is no search tree, no backtracking, no table of partial results. That is what makes greedy algorithms fast - usually just a sort plus one linear sweep - and it is also exactly what makes them fragile.

A greedy algorithm is only correct when the problem has BOTH of these:

1. GREEDY CHOICE PROPERTY. Some globally optimal solution contains the locally best choice. Not "the greedy choice is obviously fine" - there must exist an optimal answer that agrees with it.
2. OPTIMAL SUBSTRUCTURE. Once you commit to that choice, what remains is a smaller instance of the same problem, and solving that smaller instance optimally completes an optimal whole.

Miss either one and the algorithm still runs, still produces an answer, and the answer is silently wrong on some inputs. There is no crash to warn you.

THE MODEL PROBLEM - ACTIVITY SELECTION: you are given n activities, each with a start time and a finish time, and one room. Two activities conflict if their intervals overlap. Select the largest possible number of non-conflicting activities.

Three plausible greedy rules, two of which are wrong:

  Shortest duration first  -> WRONG.
      Activities (1,10), (9,11), (10,20).
      Shortest is (9,11); taking it blocks BOTH of the others.
      Greedy gets 1. Optimal is (1,10) + (10,20) = 2.

  Earliest start first     -> WRONG.
      Activities (1,20), (2,3), (4,5).
      Earliest start is (1,20), which blocks everything else.
      Greedy gets 1. Optimal is (2,3) + (4,5) = 2.

  Earliest FINISH first    -> CORRECT.

The right rule is the one that frees the room again as early as possible. Finishing early is the only thing that helps you; starting early does not, and being short does not, because a short activity can still sit right across the middle of the timeline.

THE ALGORITHM:

  sort activities by finish time, ascending
  lastFinish = -infinity
  count = 0
  for each activity (s, f) in that order:
      if s >= lastFinish:          # does not overlap what we already took
          take it
          count += 1
          lastFinish = f
  return count

TRACED: activities (5,9), (1,2), (3,4), (0,6), (5,7), (8,9).

  sorted by finish: (1,2) (3,4) (0,6) (5,7) (5,9) (8,9)

  (1,2): 1 >= -inf   take. lastFinish = 2   count = 1
  (3,4): 3 >= 2      take. lastFinish = 4   count = 2
  (0,6): 0 >= 4 ?    no - skip
  (5,7): 5 >= 4      take. lastFinish = 7   count = 3
  (5,9): 5 >= 7 ?    no - skip
  (8,9): 8 >= 7      take. lastFinish = 9   count = 4

  answer: 4 activities - (1,2), (3,4), (5,7), (8,9)

WHY IT IS OPTIMAL - THE EXCHANGE ARGUMENT. This is the standard proof technique for greedy, and it is worth learning as a pattern rather than as one proof:

Let g be the activity with the earliest finish time, and let OPT be any optimal selection. If OPT already contains g, there is nothing to show. Otherwise, let a be the first activity in OPT by finish time. Because g finishes earliest of everything, finish(g) <= finish(a). So swap a for g. The result still has no overlaps - g finishes no later than a did, so it cannot collide with whatever OPT scheduled after a - and it has exactly the same number of activities. We have produced an optimal solution containing the greedy choice. That is precisely the greedy choice property. Now delete g and every activity overlapping it, and repeat the argument on what remains (optimal substructure).

The shape to remember: take any optimal solution, exchange its first choice for the greedy one, show nothing got worse.

COMPLEXITY: O(n log n) for the sort, then a single O(n) pass. The sort dominates. If the activities arrive already sorted by finish time, the whole thing is O(n).`,
    mcqs: [
      mcq("q1", "The two properties a problem must have for a greedy algorithm to be provably correct are:", [
        "Optimal substructure and overlapping subproblems",
        "Greedy choice property and optimal substructure",
        "Sorted input and distinct elements",
        "Optimal substructure and a polynomial time bound",
      ], 1),
      mcq("q2", "For Activity Selection, the rule that is actually correct is to repeatedly pick the activity with the:", [
        "Shortest duration", "Earliest start time", "Earliest finish time", "Latest start time",
      ], 2),
      mcq("q3", "On activities (1,10), (9,11), (10,20), picking the SHORTEST duration first yields 1 activity while the optimum is 2. This demonstrates that:", [
        "Activity Selection has no optimal substructure",
        "A locally reasonable-sounding rule can still lack the greedy choice property",
        "The activities must first be sorted by start time",
        "Greedy algorithms are never correct on intervals",
      ], 1),
      mcq("q4", "In an exchange argument for Activity Selection, we swap the first activity of an optimal solution for the greedy one and then show that:", [
        "The new solution is strictly better",
        "The new solution is still conflict-free and has the same number of activities",
        "The greedy choice must have already been in every optimal solution",
        "The remaining subproblem becomes empty",
      ], 1),
      mcq("q5", "The time complexity of Activity Selection on unsorted input is dominated by:", [
        "The linear scan, so O(n)", "The sort, so O(n log n)", "Comparing every pair, so O(n^2)", "The recursion depth, so O(log n)",
      ], 1),
    ],
  },

  {
    date: "2026-09-08", dow: "tue", type: "lesson",
    title: "Day 41: Sorting-Driven Greedy - Connecting Ropes & Huffman's Idea",
    problemIds: [
      "qVNb69Q0CjjzRt7KWAWD", // Minimum Cost of Ropes (Medium, Greedy)
    ],
    concept:
`Yesterday's greedy sorted once, then swept once. Today's shape is different and it is the one placement papers reuse most: the greedy choice has to be re-made after every step, because the data changes as you go. That means you do not want a sorted array - you want a structure that can hand you the current minimum again and again. You built exactly that in week 5: the min-heap (Days 25-27).

THE PROBLEM - CONNECTING ROPES: you have n ropes of given lengths. Joining two ropes costs the sum of their two lengths, and produces one rope of that combined length. Keep joining until a single rope remains. Minimise the TOTAL cost of all the joins.

The naive instinct is to join them in the order given, or to join the two longest. Both are wrong. The correct rule: always join the two SHORTEST ropes currently available.

TRACED on [4, 3, 2, 6]:

  min-heap: {2, 3, 4, 6}         total = 0

  pop 2, pop 3   -> join cost 5   push 5
  heap: {4, 5, 6}                 total = 5

  pop 4, pop 5   -> join cost 9   push 9
  heap: {6, 9}                    total = 14

  pop 6, pop 9   -> join cost 15  push 15
  heap: {15}                      total = 29

  one rope left - answer 29.

Compare the greedy-in-reverse (always join the two LONGEST): 6+4=10, then 10+3=13, then 13+2=15, total 38. Same final rope, far worse total. Compare joining left to right as given: 4+3=7, 7+2=9, 9+6=15, total 31. Also worse.

WHY SHORTEST-FIRST IS RIGHT. Here is the insight that makes it obvious rather than magical. Trace any single original rope through the process. Every time it takes part in a join, its length is added to the cost again. So a rope that is joined early - and therefore carried along through every later join - gets counted once for each of those joins. If you draw the merge history as a binary tree, with the original ropes as leaves, then:

  total cost = sum over all leaves of (length of leaf) x (depth of leaf)

You are choosing which leaves sit deep and which sit shallow. To minimise a sum of length x depth, the LONG ropes must be shallow and the SHORT ropes deep. Merging the two smallest available at every step is exactly what pushes the small ones deepest.

THAT IS HUFFMAN CODING. Replace "rope length" with "character frequency" and "join cost" with nothing at all, and the identical algorithm produces the optimal prefix-free binary code: repeatedly merge the two least frequent symbols, and the depth of each leaf becomes the number of bits assigned to that character. Frequent characters land near the root and get short codes; rare characters land deep and get long ones. The quantity being minimised, sum of frequency x depth, is precisely the expected encoded length. Connecting ropes is Huffman coding with the output thrown away.

IMPLEMENTATION:

  build a min-heap from all n lengths          O(n) with build-heap
  total = 0
  while heap has more than one element:
      a = extractMin()
      b = extractMin()
      total += a + b
      insert(a + b)
  return total

COMPLEXITY: O(n) to build the heap, then n-1 iterations each doing two extracts and one insert, each O(log n) - so O(n log n) overall. Note that sorting once at the start does NOT suffice: the rope you create by joining 2 and 3 has length 5, which may need to slot into the middle of the remaining order. A sorted array would need an O(n) insertion each time, giving O(n^2). The heap is what keeps this log-time, and this is the clearest example in the course of picking the data structure because of the ACCESS PATTERN rather than the data.`,
    mcqs: [
      mcq("q1", "To minimise the total cost of connecting ropes, at each step you should join the:", [
        "Two longest ropes", "Two shortest ropes", "Longest and the shortest rope", "First two ropes in input order",
      ], 1),
      mcq("q2", "Connecting ropes [4, 3, 2, 6] optimally costs:", [
        "15", "29", "31", "38",
      ], 1),
      mcq("q3", "Writing the total cost as a sum of (rope length x depth in the merge tree) explains the greedy rule because it shows we must place:", [
        "Long ropes deep and short ropes shallow",
        "Short ropes deep and long ropes shallow",
        "All ropes at equal depth",
        "The first rope at the root",
      ], 1),
      mcq("q4", "The classic algorithm that is structurally identical to optimal rope connecting is:", [
        "Dijkstra's algorithm", "Huffman coding", "Kruskal's algorithm", "Binary search",
      ], 1),
      mcq("q5", "A min-heap is used rather than one initial sort because:", [
        "Heaps sort faster than comparison sorts",
        "Each join creates a NEW length that must re-enter the ordering, which a heap absorbs in O(log n)",
        "Sorting cannot handle duplicate lengths",
        "The heap reduces the number of joins required",
      ], 1),
    ],
  },

  {
    date: "2026-09-09", dow: "wed", type: "lesson",
    title: "Day 42: Scheduling with Deadlines - Job Sequencing & SJF",
    problemIds: [
      "SPi7csQXCF3gQlrXkvNX", // Job Sequencing Problem (Medium, Greedy)
      "q9ME4DSWc4amHDuubFAM", // Shortest Job First (SJF) CPU Scheduling (Medium, Greedy)
    ],
    concept:
`Monday's greedy maximised a COUNT of activities, where every activity was worth the same. Today each task carries a different payoff and a different deadline, so the sort key and the placement rule come apart: you sort by one thing and place by another. This is the single most common greedy shape in placement papers.

JOB SEQUENCING WITH DEADLINES: n jobs. Job i pays profit[i] and must finish by deadline[i]. Every job takes exactly one unit of time, and you have one machine, so you can run at most one job in each time slot 1, 2, 3, ... Maximise total profit. Jobs you cannot fit are simply skipped.

THE RULE: sort jobs by profit DESCENDING. For each job in that order, place it in the LATEST still-free slot that is <= its deadline. If every slot up to its deadline is already taken, discard the job.

Two decisions are doing work here, and students routinely get the second one wrong:

  - Sorting by profit descending is what makes it greedy: the most valuable job gets first refusal on the timetable.
  - Placing it as LATE as its deadline allows is what keeps the schedule flexible. An early slot is a scarce resource, because a job with deadline 1 can ONLY use slot 1. Burning slot 1 on a job whose deadline is 5 - when slots 2 through 5 were free - can cost you a job later. Placing late never does.

TRACED. Jobs (id, deadline, profit): (a,2,100) (b,1,19) (c,2,27) (d,1,25) (e,3,15).

  sorted by profit desc: a(2,100)  c(2,27)  d(1,25)  b(1,19)  e(3,15)
  slots: [ _ , _ , _ ]      (slot 1, slot 2, slot 3)

  a: deadline 2 - latest free slot <= 2 is slot 2.   slots: [ _ , a , _ ]   profit 100
  c: deadline 2 - slot 2 taken, try slot 1: free.    slots: [ c , a , _ ]   profit 127
  d: deadline 1 - slot 1 taken. No slot <= 1 free.   discarded.
  b: deadline 1 - same. discarded.
  e: deadline 3 - latest free slot <= 3 is slot 3.   slots: [ c , a , e ]   profit 142

  answer: jobs c, a, e in slots 1, 2, 3 - total profit 142.

Notice what the late-placement rule bought us. Had job a taken slot 1 (the earliest free slot <= its deadline), then c - also deadline 2 - would have landed in slot 2, and the schedule would be identical here by luck. But make a's deadline 3 instead and place early: a takes slot 1, c takes slot 2, d and b are still stuck, and e takes slot 3. Place late and a takes slot 3, c takes slot 2, d takes slot 1, and you additionally collect d's 25. Placing early loses real profit.

FINDING THE LATEST FREE SLOT. The direct implementation walks backwards from the deadline looking for a free slot, which is O(n) per job and O(n^2) overall - perfectly acceptable for placement constraints. The better version is a genuine callback to Day 35: use UNION-FIND over the slots, where find(t) returns the latest free slot at or before t. When you fill slot s, union it with s-1, so every future find that lands on s is forwarded to the next free slot below. That turns each placement into near-O(1) and the whole algorithm into O(n log n), dominated once again by the sort. Union-Find is not only for graphs - it is for "which group is this in, given the merges so far", and here the groups are runs of occupied slots.

SHORTEST JOB FIRST (SJF): a different objective on the same machine. Given n jobs with known burst times and all available at time 0, minimise the AVERAGE WAITING TIME. The rule is to run them in increasing order of burst time.

  bursts 6, 8, 7, 3 run in the given order:
      waits are 0, 6, 14, 21  -> average (0+6+14+21)/4 = 10.25

  bursts sorted 3, 6, 7, 8:
      waits are 0, 3, 9, 16   -> average (0+3+9+16)/4 = 7.0

WHY: the first job's burst time is added to the waiting time of every one of the n-1 jobs behind it; the second job's burst is added to n-2 of them, and so on. Each job's burst is multiplied by the number of jobs that follow it, so the job with the largest multiplier must be the shortest. It is the same "weight times depth" bookkeeping as yesterday's ropes, wearing different clothes. The exchange argument closes it: if any adjacent pair is out of order, swapping them lowers the total wait, so the fully sorted order is optimal.`,
    mcqs: [
      mcq("q1", "In Job Sequencing with deadlines, jobs are first sorted by:", [
        "Deadline ascending", "Profit descending", "Profit per unit deadline", "Deadline descending",
      ], 1),
      mcq("q2", "Each selected job is placed in the latest free slot at or before its deadline because:", [
        "Later slots are cheaper to use",
        "It preserves the scarce early slots for jobs with tighter deadlines",
        "It reduces the number of slots needed overall",
        "Jobs cannot legally run before their deadline",
      ], 1),
      mcq("q3", "For jobs (a,2,100) (b,1,19) (c,2,27) (d,1,25) (e,3,15), the maximum achievable profit is:", [
        "127", "142", "152", "161",
      ], 1),
      mcq("q4", "The data structure that reduces latest-free-slot lookup from O(n) to near-O(1) per job is:", [
        "A min-heap", "Union-Find (DSU) over the slots", "A queue of free slots", "A balanced BST keyed by profit",
      ], 1),
      mcq("q5", "Shortest Job First minimises average waiting time because each job's burst time:", [
        "Is counted once in the total", "Is added to the wait of every job scheduled after it",
        "Determines its own waiting time only", "Is proportional to its deadline",
      ], 1),
    ],
  },

  {
    date: "2026-09-10", dow: "thu", type: "lesson",
    title: "Day 43: Greedy on Arrays - Rearrangement & Sign Flipping",
    problemIds: [
      "fOFLyPVMhX3gyJCUDDc5", // Maximize Sum of arr[i]*i After Rearranging (Medium, Greedy)
      "YpCMEX159rVCdY7EoLGY", // Maximize Array Sum After K Negations (Medium, Greedy)
    ],
    concept:
`The last two days scheduled things. Today the greedy choice is about ORDER and SIGN - no timeline, no slots, just "arrange this array to maximise something". These look like they need cleverness and almost always need only a sort plus one observation.

PROBLEM 1 - MAXIMISE THE SUM OF arr[i] * i. You may permute the array however you like. Maximise the sum of each element multiplied by its final index.

The rule: sort ascending and leave it there. The largest element lands on the largest index.

  arr = [5, 3, 2, 4, 1], indices 0..4

  as given:  5*0 + 3*1 + 2*2 + 4*3 + 1*4 = 0 + 3 + 4 + 12 + 4  = 23
  sorted:    1*0 + 2*1 + 3*2 + 4*3 + 5*4 = 0 + 2 + 6 + 12 + 20 = 40

WHY - THE REARRANGEMENT INEQUALITY. The index vector (0, 1, 2, ..., n-1) is fixed and already sorted ascending. When you pair two sequences term by term and add up the products, the total is largest when both sequences are sorted the same way, and smallest when they are sorted oppositely. The two-element case is the whole proof, and it is worth doing once: given values x <= y and indices i < j, pairing them in order gives x*i + y*j, and swapped gives x*j + y*i. Subtract:

  (x*i + y*j) - (x*j + y*i) = x*i - x*j + y*j - y*i
                            = x(i - j) + y(j - i)
                            = (y - x)(j - i)

Both factors are non-negative, so the in-order pairing is always at least as large. Any arrangement that is not fully sorted contains some out-of-order adjacent pair; swapping it never decreases the total; repeat until sorted. That is an exchange argument again - the same tool as Monday, now on an array instead of a timeline.

PROBLEM 2 - MAXIMISE THE ARRAY SUM AFTER EXACTLY K NEGATIONS. You must flip the sign of exactly K elements. The same element may be flipped more than once, and each flip counts against K. Maximise the final sum.

The rule: repeatedly negate the current SMALLEST element.

  arr = [-2, 0, 5, -1], K = 4

  flip -2  -> [2, 0, 5, -1]   K = 3   (smallest was -2)
  flip -1  -> [2, 0, 5, 1]    K = 2   (smallest was -1)
  flip 0   -> [2, 0, 5, 1]    K = 1   (smallest is 0; flipping it changes nothing)
  flip 0   -> [2, 0, 5, 1]    K = 0
  sum = 8

Two details decide whether an implementation is correct:

  - Negating the most-negative element gains the most: turning -7 into 7 improves the sum by 14, while turning -1 into 1 improves it by 2. So handle the negatives in increasing order, most negative first.
  - What to do with LEFTOVER K after every negative is gone. If a zero is present, dump all remaining flips on it - they are free. If there is no zero, the remaining flips must land on positives, and flipping the same element twice restores it. So only the PARITY of the leftover matters: an even leftover costs nothing (flip the smallest positive back and forth), an odd leftover costs exactly 2 x (smallest remaining absolute value). Subtract that once.

That parity rule is the part candidates miss. A common wrong answer flips K distinct elements, which needlessly damages the sum when K exceeds the count of negatives.

IMPLEMENTATION SHAPE. Both problems are a sort plus a linear pass, O(n log n). The K-negations version can also be done with a min-heap in O(n + K log n) - extract the minimum, negate it, push it back, K times - which is better when K is small and worse when K is large. Either is acceptable; the heap version reuses Day 27's priority-queue pattern directly.

THE TRANSFERABLE HABIT: when a problem says "rearrange to maximise/minimise", try sorting one or both sequences and pairing them, then justify it with the two-element exchange above. When a problem says "apply exactly K operations", separate the useful operations from the leftover ones and ask what parity does to the leftovers.`,
    mcqs: [
      mcq("q1", "To maximise the sum of arr[i] * i by permuting the array, you should sort the array:", [
        "Descending", "Ascending", "By absolute value", "It does not matter",
      ], 1),
      mcq("q2", "For arr = [5, 3, 2, 4, 1], the maximum achievable value of the sum of arr[i] * i is:", [
        "23", "33", "40", "45",
      ], 2),
      mcq("q3", "The rearrangement inequality's two-element case reduces to showing that (y - x)(j - i) is non-negative, which establishes that:", [
        "Swapping any two elements always increases the sum",
        "Pairing both sequences in the same sorted order is at least as good as swapping them",
        "The sum is independent of the arrangement",
        "Only the largest element's position matters",
      ], 1),
      mcq("q4", "In Maximise Array Sum After K Negations, once all negatives have been flipped and K flips remain with NO zero in the array, the correct handling is:", [
        "Flip the K largest positives", "Stop early and ignore the remaining flips",
        "If the leftover K is odd, subtract twice the smallest absolute value; if even, do nothing",
        "Flip K distinct positives, smallest first",
      ], 2),
      mcq("q5", "For arr = [-2, 0, 5, -1] with K = 4, the maximum achievable sum is:", [
        "4", "6", "8", "10",
      ], 2),
    ],
  },

  {
    date: "2026-09-11", dow: "fri", type: "lesson",
    title: "Day 44: When Greedy Fails - Coin Change & the Road to DP",
    problemIds: [
      "z20ZmQmfAdkfJRGNEm0F", // Greedy Algorithm to Find Minimum Number of Coins (Easy, Greedy)
      "qDKf9j3riYudHoU4OGpn", // Smallest Subset With Sum Greater Than All Other Elements (Easy, Greedy)
    ],
    concept:
`Four days of greedy algorithms that worked. Today is the one that does not, because knowing where a technique breaks is what tells you which technique to reach for next - and the break in this lesson is exactly the door into next week.

THE PROBLEM - MINIMUM COINS: given coin denominations and a target amount, use the fewest coins to make that amount exactly. Unlimited coins of each denomination.

THE GREEDY ATTEMPT: repeatedly take the largest coin that does not overshoot.

On Indian currency it is flawless. Make 87 from {1, 2, 5, 10, 20, 50}:

  50 -> remaining 37   (1 coin)
  20 -> remaining 17   (2 coins)
  10 -> remaining 7    (3 coins)
   5 -> remaining 2    (4 coins)
   2 -> remaining 0    (5 coins)

  5 coins, and no arrangement does better.

Now change the denominations to {1, 3, 4} and make 6:

  greedy: 4 -> remaining 2, then 1 -> 1, then 1 -> 0.   Three coins: 4 + 1 + 1.
  optimal: 3 + 3.                                        Two coins.

The algorithm did not crash, did not warn, and returned a plausible answer that is simply wrong. This is the characteristic failure mode of greedy and the reason Monday insisted on proving the greedy choice property rather than assuming it.

WHY IT FAILS HERE, PRECISELY: taking the 4 destroys the optimal solution. There is NO optimal answer for target 6 that contains a 4 - the only optimum is 3 + 3. So the greedy choice property does not hold for this denomination set. It does hold for {1, 2, 5, 10, 20, 50}, which is why the same code is correct on rupees. Correctness is a property of the COIN SYSTEM, not of the algorithm. A system where greedy always works is called canonical, and real currencies are deliberately designed to be canonical so that cashiers can make change greedily. There is no quick eyeball test for canonicality - deciding it requires real work - so on an arbitrary denomination set you must assume greedy is wrong.

THE SECOND COUNTEREXAMPLE - KNAPSACK, BOTH WAYS. This contrast is the sharpest one in the course.

FRACTIONAL knapsack: capacity W, items with value and weight, and you may take any fraction of an item. GREEDY IS OPTIMAL: sort by value/weight ratio descending, take whole items while they fit, then fill the last sliver with a fraction of the next one. Every unit of capacity is filled with the best value-per-unit still available, and because items are divisible there is never a wasted gap.

0/1 knapsack: identical, except each item must be taken whole or not at all. GREEDY IS NOT OPTIMAL. Capacity 50, items (value, weight): (60, 10), (100, 20), (120, 30).

  ratios: 6.0, 5.0, 4.0  ->  greedy takes item 1 (60, w=10) and item 2 (100, w=20),
                             using 30 of 50 capacity for value 160. Item 3 needs 30
                             and only 20 remains, so greedy stops at 160.
  optimal: items 2 and 3 - weight 20 + 30 = 50 exactly, value 100 + 120 = 220.

Removing the ability to take a fraction removed the greedy choice property. The best-ratio item is simply not in the optimal set. Nothing about the sort was wrong; the problem changed underneath it.

WHAT REPLACES GREEDY. Greedy failed because one irrevocable choice was made on local evidence. The fix is not to choose more cleverly - it is to stop choosing irrevocably. Consider BOTH options at every item ("take it" and "leave it"), and take the better result. Done naively that is exponential: 2^n subsets. But the subproblems repeat enormously - the same "remaining capacity, remaining items" state is reached by many different choice paths - so you solve each distinct state once and store the answer.

That is DYNAMIC PROGRAMMING, and it is next week. Notice the exact relationship, because it is the thing to carry out of today:

  greedy    = optimal substructure + greedy choice property   (one choice, no table)
  DP        = optimal substructure + overlapping subproblems  (all choices, with a table)

Both need optimal substructure. Greedy additionally needs the greedy choice property, and buys speed with it. When that property is absent, you pay a table for correctness. Monday's Day 45 opens on {1, 3, 4} making 6, and solves it properly.

ONE MORE WORKING GREEDY, so today does not end on failure. SMALLEST SUBSET WITH SUM GREATER THAN THE REST: find the fewest elements whose sum strictly exceeds the sum of all the others. Sort descending and keep taking until your running total passes half the array total. Here greedy is obviously right - each step buys the largest available increase toward a fixed finish line, so no other choice can reach it in fewer steps. Optimal substructure and greedy choice both hold, and the proof is a one-line exchange argument. The technique is not discredited; it just has preconditions.`,
    mcqs: [
      mcq("q1", "With denominations {1, 3, 4}, the greedy largest-coin-first rule makes 6 using 3 coins while the optimum is 2 (3 + 3). This proves that for this coin system:", [
        "Optimal substructure fails", "The greedy choice property fails",
        "The problem has no optimal solution", "Greedy needs the coins sorted differently",
      ], 1),
      mcq("q2", "Greedy coin change IS correct on {1, 2, 5, 10, 20, 50} because:", [
        "The coins are all even", "That denomination set is canonical, so a greedy choice is always extendable to an optimum",
        "There are exactly six denominations", "The largest coin divides every other coin",
      ], 1),
      mcq("q3", "Greedy by value/weight ratio is optimal for FRACTIONAL knapsack but not for 0/1 knapsack because:", [
        "0/1 knapsack has no optimal substructure",
        "Indivisibility means the best-ratio item need not appear in any optimal set",
        "Fractional knapsack has fewer items",
        "The ratios are computed differently in the two problems",
      ], 1),
      mcq("q4", "For capacity 50 with items (60,10), (100,20), (120,30), ratio-greedy 0/1 returns 160 while the true optimum is:", [
        "180", "200", "220", "240",
      ], 2),
      mcq("q5", "The property dynamic programming requires that greedy does NOT is:", [
        "Optimal substructure", "Overlapping subproblems", "A sorted input", "A polynomial number of items",
      ], 1),
    ],
  },

  {
    date: "2026-09-12", dow: "sat", type: "test",
    title: "Week 8 Master Test: Greedy Algorithms",
    xpReward: 150, coinReward: 60,
    problemIds: [
      "tiJnInKcwDxuBgxFF3d4", // Maximum Product Subset of an Array (Medium, Greedy)
      "WmdotmjrpoBlxeix7fyX", // Minimum and Maximum Amount to Buy All N Candies (Medium, Greedy)
    ],
    concept:
`Week 8 in one page, then ten questions spanning all five days.

THE PARADIGM. A greedy algorithm commits to the locally best choice at every step and never reconsiders. It is correct only when the problem has the GREEDY CHOICE PROPERTY (some optimal solution agrees with that local choice) and OPTIMAL SUBSTRUCTURE (the rest of the problem is a smaller copy of itself). The standard proof is the EXCHANGE ARGUMENT: take any optimal solution, swap its first choice for the greedy one, show nothing got worse.

THE FIVE DAYS.

  Day 40  Activity Selection      sort by FINISH time, take any activity that starts after the last one taken. Shortest-first and earliest-start-first are both wrong. O(n log n).
  Day 41  Connecting Ropes        repeatedly merge the two SHORTEST via a min-heap. Total cost = sum of length x merge-depth, so short ropes go deep. Identical to Huffman coding. O(n log n).
  Day 42  Job Sequencing          sort by PROFIT descending, place each job in the LATEST free slot <= its deadline. Union-Find finds that slot in near-O(1). SJF minimises average wait because each burst is charged to every job behind it.
  Day 43  Rearrangement           to maximise the sum of arr[i] * i, sort ascending (rearrangement inequality). For K negations, always flip the current smallest, then handle leftover K by PARITY.
  Day 44  Where it breaks         greedy coin change fails on {1,3,4} making 6; ratio-greedy fails on 0/1 knapsack (160 vs 220). Both lack the greedy choice property. DP is next week's answer.

THE TWO THINGS TO CARRY FORWARD. First, "sort by X, then sweep" is the skeleton of nearly every greedy solution - the entire difficulty is identifying X, and X is frequently not the quantity being maximised (Day 42 sorts by profit but places by deadline). Second, a greedy algorithm that is wrong still returns an answer. Always ask whether a locally best choice can be exchanged into an optimal solution, and if you cannot argue that it can, expect a counterexample to exist.`,
    mcqs: [
      mcq("q1", "Activity Selection is solved by repeatedly choosing the activity with the earliest:", [
        "Start time", "Finish time", "Duration", "Profit",
      ], 1),
      mcq("q2", "A greedy algorithm requires the greedy choice property, which states that:", [
        "Every greedy choice leads to a unique solution",
        "Some optimal solution contains the locally optimal choice",
        "The problem can be divided into independent subproblems",
        "The input must be sorted before processing",
      ], 1),
      mcq("q3", "Connecting ropes of lengths [1, 2, 3, 4, 5] optimally costs:", [
        "15", "29", "33", "48",
      ], 2),
      mcq("q4", "In Job Sequencing, placing each job in the latest permissible free slot rather than the earliest one:", [
        "Reduces the total number of jobs scheduled",
        "Keeps early slots available for jobs with tighter deadlines",
        "Is required for the profit sort to be stable",
        "Makes no difference to the achieved profit",
      ], 1),
      mcq("q5", "The greedy strategy for Connecting Ropes is structurally the same algorithm as:", [
        "Kruskal's MST", "Huffman coding", "Dijkstra's shortest path", "Topological sort",
      ], 1),
      mcq("q6", "To maximise the sum of arr[i] * i by rearranging, sort the array ascending. The underlying result is the:", [
        "Pigeonhole principle", "Rearrangement inequality", "Triangle inequality", "Master theorem",
      ], 1),
      mcq("q7", "Greedy coin change returns 3 coins for target 6 under denominations {1, 3, 4}, but the optimum is 2. This is because:", [
        "The coins were not sorted", "No optimal solution for 6 contains a 4, so the greedy choice is not extendable",
        "The target is even", "Coin change has no optimal substructure",
      ], 1),
      mcq("q8", "Greedy by value/weight ratio is provably optimal for:", [
        "0/1 knapsack", "Fractional knapsack", "Both equally", "Neither",
      ], 1),
      mcq("q9", "Shortest Job First minimises average waiting time. The exchange argument for it shows that:", [
        "Swapping any adjacent out-of-order pair reduces the total waiting time",
        "The longest job must run first", "All orderings give the same total waiting time",
        "The average wait is independent of the burst times",
      ], 0),
      mcq("q10", "The precise distinction between greedy and dynamic programming is that DP:", [
        "Requires sorted input, greedy does not",
        "Explores all choices and reuses stored subproblem results instead of committing to one local choice",
        "Always runs faster than greedy",
        "Does not require optimal substructure",
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
