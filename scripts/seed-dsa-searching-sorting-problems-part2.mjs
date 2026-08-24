import admin from "firebase-admin";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(join(__dirname, "service-account.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// DSA-450-sheet ingestion, SEARCHING & SORTING topic, PART 2. Fills the
// remaining genuine gaps against the sheet's verbatim row list that
// seed-dsa-searching-sorting-problems.mjs (part 1, ~16 problems) didn't
// cover. Rows confirmed as duplicates of problems already seeded elsewhere
// (and therefore skipped, not re-seeded here) - verified against live
// Firestore titles before writing this file:
//   - "Maximum and minimum of an array using minimum number of comparisons"
//     -> Arrays / "Find the Maximum and Minimum Element in an Array"
//   - "merge 2 sorted arrays"
//     -> Arrays / "Merge Two Sorted Arrays (Combined Sorted Output)"
//   - "print all subarrays with 0 sum"
//     -> Arrays / "Find if There Is a Subarray With Sum Equal to 0", and
//        already-seeded Hashing / "Count Subarrays With Sum Zero" (part 1)
//   - "Find the inversion count" -> Arrays / "Count Inversions in an Array"
//   - "Job Scheduling Algo" -> Greedy / "Job Sequencing Problem"
//   - "Partitioning and Sorting Arrays with Many Repeated Entries" -> this
//     GfG article is the Dutch-National-Flag "0/1/2 sort", already skipped
//     in part 1's header note as covered by the Arrays batch.
// "Subset Sums" (enumerate/sort all 2^n subset sums) is NOT a duplicate of
// the existing Backtracking / "Subset Sum Problem" (a yes/no target-exists
// check) - different problem, added below.
//
// The sheet's obscure SPOJ/CodeChef/HackerEarth-named rows were researched
// individually (not skipped on sight) and, except one, turned out to be
// well-defined, unambiguous problems:
//   - EKOSPOJ = SPOJ EKO ("Eko"): binary search for the max sawblade height
//     that still yields >= M metres of wood. Added.
//   - ROTI-Prata SPOJ = SPOJ PRATA: binary search on time; a rank-R cook
//     finishes its n-th prata at cumulative time R*n*(n+1)/2. Added.
//   - DoubleHelix SPOJ = SPOJ/ANARC05B "The Double HeLiX": max-sum path
//     across two increasing sequences, switching only at shared values.
//     Added (greedy two-pointer solution cross-checked against a brute-force
//     memoized DP on several cases before trusting it).
//   - Bishu and Soldiers (HackerEarth): per query M, count + sum of all
//     soldiers with power <= M, via sorted array + prefix sums. Added.
//   - Rasta and Kheshtak (HackerEarth "Biggest Common Subsquare"): largest
//     s such that some contiguous s x s block of grid A matches some
//     contiguous s x s block of grid B (verified against the problem's own
//     published sample, answer 2, via a brute-force block-hash check).
//     Added, with grid bounds kept small (<=50) so a direct block comparison
//     - not just the intended binary-search-plus-rolling-hash approach -
//     can pass within the grader's time limit.
//   - "Kth smallest number again" is genuinely the classic "k-th smallest
//     element in a given range [l,r] of the array, over q queries" (GfG:
//     "Queries for k-th smallest in given ranges" / merge-sort-tree or
//     persistent-segment-tree problem) - confirmed via multiple independent
//     sources once the unrelated same-named SPOJ problems (KSMALL, a random-
//     number-generator problem; MKTHNUM/ILKQUERY, different order-statistics
//     variants) were ruled out. Added as "Kth Smallest Element in a Range".

const REWARD = { Easy: [30, 10], Medium: [50, 20], Hard: [80, 30] };
function p(title, category, difficulty, tags, statement, constraints, examplesText, hints, sampleTests, hiddenTests) {
  const [xpReward, coinReward] = REWARD[difficulty];
  return { title, category, difficulty, tags, statement, constraints, examplesText, hints, xpReward, coinReward, sampleTests, hiddenTests };
}

const PROBLEMS = [

p("Find a Fixed Point in an Array", "Binary Search", "Medium", ["Array", "Binary Search"],
  "Given a sorted array of n distinct integers (which may include negative numbers), find an index i such that arr[i] == i - a 'fixed point'. If more than one such index exists, print the smallest one. If none exists, print -1.",
  "1 <= n <= 10^5",
  "Input:\n5\n-10 -1 0 3 10\nOutput:\n3",
  ["Because the array is sorted and strictly increasing with integer values, arr[i] - i is non-decreasing as i increases - binary search applies.", "At a candidate mid: if arr[mid] < mid, any fixed point must be to the right; if arr[mid] > mid, it must be to the left; if arr[mid] == mid, it's a candidate answer but keep searching left for a smaller index.", "A plain linear scan also works but is not the intended O(log n) approach."],
  [{ input: "5\n-10 -1 0 3 10", expectedOutput: "3", explanation: "" },
   { input: "3\n0 2 5", expectedOutput: "0", explanation: "" }],
  [{ input: "1\n0", expectedOutput: "0", points: 1 },
   { input: "1\n5", expectedOutput: "-1", points: 1 },
   { input: "4\n-5 -3 2 5", expectedOutput: "2", points: 1 }]),

p("Optimum Location of a Point to Minimize Total Distance", "Binary Search", "Hard", ["Math", "Binary Search", "Geometry"],
  "A line is given by the equation a*x + b*y + c = 0 (with a and b not both zero), and n points are given. Find a point P on the line that minimizes the sum of Euclidean distances from P to all n given points, and print that minimum possible total distance rounded to exactly 4 decimal places.",
  "1 <= n <= 1000, -1000 <= a, b, c, point coordinates <= 1000, a and b not both 0",
  "Input:\n1 1 -2\n2\n3 4\n-1 -1\nOutput:\n6.4031",
  ["The total-distance function, as you move a single parameter along the line, is a sum of convex (Euclidean-distance) functions - so it is itself convex with one minimum, which ternary search can locate directly.", "Parametrize the line by x (solving y = (-c - a*x)/b) when b != 0, or by y when the line is vertical (b == 0); narrow the search interval with enough ternary-search iterations (a few hundred) to converge well past 4 decimal places.", "Use double-precision floating point throughout, and only round to 4 decimals at the very end."],
  [{ input: "1 1 -2\n2\n3 4\n-1 -1", expectedOutput: "6.4031", explanation: "" },
   { input: "0 1 0\n2\n1 5\n3 -5", expectedOutput: "10.1980", explanation: "" }],
  [{ input: "1 0 0\n1\n0 5", expectedOutput: "0.0000", points: 1 },
   { input: "1 -1 0\n2\n2 0\n0 2", expectedOutput: "2.8284", points: 1 },
   { input: "0 1 -3\n3\n0 0\n5 10\n-5 -2", expectedOutput: "18.6569", points: 1 }]),

p("Searching in an Array Where Adjacent Differ by at Most K", "Arrays", "Medium", ["Array", "Searching"],
  "Given an array of n integers where every pair of adjacent elements differs by at most k in absolute value (the array itself need not be sorted), and a target value x, find the index of the first occurrence of x, or print -1 if it doesn't occur.",
  "1 <= n <= 10^5, 1 <= k <= 10^4, |arr[i+1] - arr[i]| <= k for every i",
  "Input:\n8\n4 5 7 7 6 8 10 11\n2\n10\nOutput:\n6",
  ["A plain binary search doesn't apply since the array isn't sorted - but because adjacent elements are close together, you can safely skip ahead by max(1, |arr[i] - x| / k) positions from index i without ever stepping over the target.", "In the worst case (k = 1) this degrades to a full linear scan, but it can be much faster when k is large and the target is far from the current value."],
  [{ input: "8\n4 5 7 7 6 8 10 11\n2\n10", expectedOutput: "6", explanation: "" },
   { input: "5\n1 3 5 7 9\n2\n4", expectedOutput: "-1", explanation: "" }],
  [{ input: "1\n5\n3\n5", expectedOutput: "0", points: 1 },
   { input: "1\n5\n3\n7", expectedOutput: "-1", points: 1 },
   { input: "6\n10 8 6 4 2 0\n2\n4", expectedOutput: "3", points: 1 }]),

p("Count Triplets With Sum Smaller Than a Given Value", "Arrays", "Medium", ["Array", "Sorting", "Two Pointer"],
  "Given an array of n integers and a target value, count the number of triplets (i, j, k with i < j < k) such that arr[i] + arr[j] + arr[k] is strictly less than the target.",
  "3 <= n <= 2000",
  "Input:\n5\n5 1 3 4 7\n12\nOutput:\n4",
  ["Sort the array, then fix the smallest index i and use two pointers (left just after i, right at the end) on the rest of the array to count triplets with i.", "When arr[i] + arr[left] + arr[right] < target, every index between left and right also pairs validly with arr[i] and arr[left] - add all of them at once instead of moving one at a time."],
  [{ input: "5\n5 1 3 4 7\n12", expectedOutput: "4", explanation: "" },
   { input: "4\n1 2 3 4\n6", expectedOutput: "0", explanation: "" }],
  [{ input: "3\n1 2 3\n100", expectedOutput: "1", points: 1 },
   { input: "3\n1 2 3\n5", expectedOutput: "0", points: 1 },
   { input: "6\n-1 0 1 2 -1 -4\n2", expectedOutput: "17", points: 1 }]),

p("Product Array Puzzle", "Arrays", "Medium", ["Array"],
  "Given an array of n integers, construct and print an array where each element at index i equals the product of every element of the original array except arr[i] - without using division anywhere.",
  "1 <= n <= 12, -50 <= arr[i] <= 50",
  "Input:\n5\n10 3 5 6 2\nOutput:\n180 600 360 300 900",
  ["Build a prefix-product array (product of everything before index i) and a suffix-product array (product of everything after index i); the answer at i is prefix[i] * suffix[i].", "This naturally handles zeros correctly without any special-casing, since no division is ever performed."],
  [{ input: "5\n10 3 5 6 2", expectedOutput: "180 600 360 300 900", explanation: "" },
   { input: "3\n1 2 3", expectedOutput: "6 3 2", explanation: "" }],
  [{ input: "1\n5", expectedOutput: "1", points: 1 },
   { input: "4\n0 1 2 3", expectedOutput: "6 0 0 0", points: 1 },
   { input: "3\n-1 2 -3", expectedOutput: "-6 3 -2", points: 1 }]),

p("Sort an Array According to Count of Set Bits", "Sorting", "Easy", ["Array", "Sorting", "Bit Manipulation"],
  "Given an array of n non-negative integers, sort it so that elements with a higher count of set bits (1s in binary) come first. Elements with an equal set-bit count must keep their original relative order (i.e. the sort must be stable).",
  "1 <= n <= 10^5, 0 <= arr[i] <= 10^9",
  "Input:\n5\n5 7 1 3 2\nOutput:\n7 5 3 1 2",
  ["Compute the popcount (number of set bits) of each element, then perform a stable sort keyed on that popcount in decreasing order.", "Most languages' built-in stable sort (e.g. a stable mergesort, or sorting a list of (popcount, original-index) pairs) preserves relative order among equal keys automatically."],
  [{ input: "5\n5 7 1 3 2", expectedOutput: "7 5 3 1 2", explanation: "" },
   { input: "3\n4 8 16", expectedOutput: "4 8 16", explanation: "" }],
  [{ input: "1\n0", expectedOutput: "0", points: 1 },
   { input: "4\n0 1 2 3", expectedOutput: "3 1 2 0", points: 1 },
   { input: "6\n1 2 3 4 5 6", expectedOutput: "3 5 6 1 2 4", points: 1 }]),

p("Minimum Number of Swaps Required to Sort an Array", "Sorting", "Medium", ["Array", "Sorting", "Graph"],
  "Given an array of n distinct integers, find the minimum number of swaps needed to sort it into ascending order.",
  "1 <= n <= 10^5, all elements distinct",
  "Input:\n4\n4 3 2 1\nOutput:\n2",
  ["Pair each element with the index it should end up at in the sorted array - this defines a permutation. Decompose that permutation into disjoint cycles.", "The minimum number of swaps equals the sum, over every cycle, of (cycle length - 1); a cycle of length 1 (an element already in place) needs no swaps."],
  [{ input: "4\n4 3 2 1", expectedOutput: "2", explanation: "" },
   { input: "5\n1 5 4 3 2", expectedOutput: "2", explanation: "" }],
  [{ input: "1\n1", expectedOutput: "0", points: 1 },
   { input: "3\n1 2 3", expectedOutput: "0", points: 1 },
   { input: "5\n2 4 5 1 3", expectedOutput: "3", points: 1 }]),

p("Find the Pivot Element in a Sorted Rotated Array", "Binary Search", "Medium", ["Array", "Binary Search"],
  "An ascending array of n distinct integers was rotated at some unknown pivot. Find the index of the pivot element - the smallest element in the array (equivalently, the point where the ascending order 'breaks'). If the array wasn't rotated at all, the pivot index is 0.",
  "1 <= n <= 10^5, all elements distinct",
  "Input:\n7\n3 4 5 6 7 1 2\nOutput:\n5",
  ["If the array's first element is already <= its last element, the whole array is sorted and the pivot index is 0.", "Otherwise binary search: if arr[mid] > arr[hi], the pivot lies strictly to the right of mid; otherwise it's at mid or to its left."],
  [{ input: "7\n3 4 5 6 7 1 2", expectedOutput: "5", explanation: "" },
   { input: "5\n1 2 3 4 5", expectedOutput: "0", explanation: "" }],
  [{ input: "1\n1", expectedOutput: "0", points: 1 },
   { input: "2\n2 1", expectedOutput: "1", points: 1 },
   { input: "6\n11 13 15 17 2 5", expectedOutput: "4", points: 1 }]),

p("K-th Element of Two Sorted Arrays", "Binary Search", "Hard", ["Array", "Binary Search"],
  "Given two sorted arrays and an integer k, find the k-th smallest element (1-indexed) if the two arrays were merged into one sorted array.",
  "1 <= n1, n2 <= 10^5, 1 <= k <= n1 + n2",
  "Input:\n5\n2 3 6 7 9\n4\n1 4 8 10\n5\nOutput:\n6",
  ["Fully merging both arrays and indexing directly always works and is simple to reason about.", "For an O(log(min(n1, n2))) solution, binary search on how many elements to take from the smaller array, keeping exactly k total taken from both, and compare the relevant boundary elements."],
  [{ input: "5\n2 3 6 7 9\n4\n1 4 8 10\n5", expectedOutput: "6", explanation: "" },
   { input: "3\n100 112 250\n3\n108 118 120\n3", expectedOutput: "112", explanation: "" }],
  [{ input: "1\n5\n1\n10\n1", expectedOutput: "5", points: 1 },
   { input: "1\n5\n1\n10\n2", expectedOutput: "10", points: 1 },
   { input: "4\n1 3 5 7\n4\n2 4 6 8\n8", expectedOutput: "8", points: 1 }]),

p("Missing Number in an Arithmetic Progression", "Binary Search", "Easy", ["Array", "Binary Search", "Math"],
  "An arithmetic progression of n+1 terms has exactly one term missing. Given the remaining n terms in their original AP order, find the missing term.",
  "3 <= n <= 10^5",
  "Input:\n6\n2 4 8 10 12 14\nOutput:\n6",
  ["The common difference of the full AP equals (last - first) / n, where n is the number of given terms (since one term is missing from what would otherwise be n+1 terms).", "Binary search for the first index where arr[i] no longer equals first + i * diff - the missing value sits exactly at that expected position, just before the mismatch."],
  [{ input: "6\n2 4 8 10 12 14", expectedOutput: "6", explanation: "" },
   { input: "4\n5 10 15 25", expectedOutput: "20", explanation: "" }],
  [{ input: "3\n1 2 4", expectedOutput: "3", points: 1 },
   { input: "3\n10 20 40", expectedOutput: "30", points: 1 },
   { input: "5\n1 3 5 7 11", expectedOutput: "9", points: 1 }]),

p("Smallest Number With at Least N Trailing Zeroes in Factorial", "Binary Search", "Medium", ["Math", "Binary Search"],
  "Given n, find the smallest positive integer x such that x! (x factorial) has at least n trailing zeroes in decimal.",
  "1 <= n <= 10^9",
  "Input:\n1\nOutput:\n5",
  ["The number of trailing zeroes in x! is given by Legendre's formula: floor(x/5) + floor(x/25) + floor(x/125) + ... - and this count is non-decreasing as x increases, so binary search on x applies.", "The search range for x can safely be bounded between 0 and 5*(n+1)."],
  [{ input: "1", expectedOutput: "5", explanation: "" },
   { input: "2", expectedOutput: "10", explanation: "" }],
  [{ input: "5", expectedOutput: "25", points: 1 },
   { input: "10", expectedOutput: "45", points: 1 },
   { input: "24", expectedOutput: "100", points: 1 }]),

p("Subset Sums", "Backtracking", "Medium", ["Array", "Recursion", "Backtracking"],
  "Given an array of n integers, print the sums of all 2^n possible subsets (including the empty subset, which sums to 0), sorted in non-decreasing order. If two different subsets happen to have the same sum, print that sum once for each of them.",
  "1 <= n <= 15",
  "Input:\n3\n5 4 3\nOutput:\n0 3 4 5 7 8 9 12",
  ["Recurse on each element, branching into 'include it in the running sum' and 'don't include it' - this generates all 2^n subset sums.", "Sort the final list of 2^n sums before printing; do not deduplicate repeated sums."],
  [{ input: "3\n5 4 3", expectedOutput: "0 3 4 5 7 8 9 12", explanation: "" },
   { input: "2\n1 1", expectedOutput: "0 1 1 2", explanation: "" }],
  [{ input: "1\n5", expectedOutput: "0 5", points: 1 },
   { input: "4\n1 2 2 3", expectedOutput: "0 1 2 2 3 3 3 4 4 5 5 5 6 6 7 8", points: 1 },
   { input: "3\n0 0 1", expectedOutput: "0 0 0 0 1 1 1 1", points: 1 }]),

p("Merge Sort - In-Place Merge", "Sorting", "Hard", ["Array", "Sorting"],
  "Given an array of n integers, sort it in ascending order using merge sort, but implement the merge step without allocating a second array - merge the two sorted halves using only O(1) extra space (for example via block rotations or the gap method), and print the final sorted array.",
  "1 <= n <= 10^5",
  "Input:\n5\n5 2 4 1 3\nOutput:\n1 2 3 4 5",
  ["A rotation-based merge repeatedly finds the boundary between the two already-sorted halves and rotates just enough elements across it to restore order, all without a helper array.", "The 'gap method' (inspired by Shell sort) compares elements a shrinking gap apart across the whole range being merged, and is a common way to implement O(1)-extra-space merging."],
  [{ input: "5\n5 2 4 1 3", expectedOutput: "1 2 3 4 5", explanation: "" },
   { input: "1\n7", expectedOutput: "7", explanation: "" }],
  [{ input: "3\n3 2 1", expectedOutput: "1 2 3", points: 1 },
   { input: "4\n4 3 2 1", expectedOutput: "1 2 3 4", points: 1 },
   { input: "6\n-3 -1 -5 2 0 4", expectedOutput: "-5 -3 -1 0 2 4", points: 1 }]),

p("Eko - Cutting Wood to Get at Least M Metres", "Binary Search", "Medium", ["Array", "Binary Search"],
  "A row of n trees with given heights is available, and a sawblade can be set to any non-negative integer height H: every tree taller than H is cut down to exactly H (shorter trees are left untouched), yielding wood equal to the sum of (height[i] - H) over trees taller than H. Given a required amount of wood M, find the maximum integer H for which at least M metres of wood are collected.",
  "1 <= n <= 10^5, 1 <= M <= 2*10^9, 1 <= height[i] <= 10^9",
  "Input:\n4\n20 15 10 17\n7\nOutput:\n15",
  ["As the sawblade height H decreases, the total wood collected only increases (or stays the same) - this monotonic relationship is exactly what binary search on H needs.", "For a candidate H, computing the total wood collected is one O(n) pass: sum max(height[i] - H, 0) over all trees."],
  [{ input: "4\n20 15 10 17\n7", expectedOutput: "15", explanation: "" },
   { input: "5\n4 42 40 26 46\n20", expectedOutput: "36", explanation: "" }],
  [{ input: "4\n1 1 1 1\n1", expectedOutput: "0", points: 1 },
   { input: "1\n5\n5", expectedOutput: "0", points: 1 },
   { input: "3\n10 10 10\n5", expectedOutput: "8", points: 1 }]),

p("Roti Prata - Minimum Time to Cook P Pratas", "Binary Search", "Hard", ["Array", "Binary Search"],
  "There are L cooks, each with a rank R (a positive integer); all cooks work in parallel starting at time 0. A cook of rank R takes exactly R minutes to cook a 1st prata, another 2R minutes to cook a 2nd, another 3R minutes for a 3rd, and so on (the k-th prata that cook makes finishes at cumulative time R*(1+2+...+k) = R*k*(k+1)/2 minutes). Given the L cooks' ranks and the total number of pratas P that must be made, find the minimum time by which all P pratas can be ready.",
  "1 <= L <= 50, 1 <= P <= 1000, 1 <= R <= 8",
  "Input:\n3\n1 2 3\n8\nOutput:\n10",
  ["Binary search on the answer time T: a cook of rank R can finish n pratas by time T for the largest n with R*n*(n+1)/2 <= T - summing that n across all L cooks tells you the total pratas ready by time T.", "The total pratas ready by time T is non-decreasing as T increases, so binary search on T applies directly; the range of T can safely go up to a few million."],
  [{ input: "3\n1 2 3\n8", expectedOutput: "10", explanation: "" },
   { input: "1\n2\n3", expectedOutput: "12", explanation: "" }],
  [{ input: "2\n1 1\n4", expectedOutput: "3", points: 1 },
   { input: "4\n4 4 4 4\n10", expectedOutput: "24", points: 1 },
   { input: "1\n8\n1", expectedOutput: "8", points: 1 }]),

p("The Double Helix - Maximum Sum Path Between Two Sequences", "Dynamic Programming", "Hard", ["Array", "Dynamic Programming", "Two Pointer"],
  "Two finite, strictly increasing sequences of integers are given. You may start at the very beginning of either sequence and walk forward through it. Whenever the value you're currently on also appears in the other sequence (a shared value), you may switch onto the other sequence from that point onward, or simply keep going on the one you're on. Find the maximum possible sum of every value visited along any such path, walking until you reach the end of whichever sequence you finish on.",
  "1 <= n1, n2 <= 10^5, both sequences strictly increasing",
  "Input:\n6\n1 3 4 7 9 10\n6\n1 2 4 6 9 11\nOutput:\n35",
  ["Walk both sequences with two pointers at once: always add the smaller of the two current values to that value's own running sum and advance past it.", "At a shared value, add it to both running sums, then reset both running sums to the larger of the two (either path could have reached this shared point) before continuing.", "Once one sequence runs out, add every remaining element of the other sequence to its running sum (no further switches are possible) - the final answer is the larger of the two running sums."],
  [{ input: "6\n1 3 4 7 9 10\n6\n1 2 4 6 9 11", expectedOutput: "35", explanation: "" },
   { input: "4\n1 2 3 10\n4\n1 5 6 10", expectedOutput: "22", explanation: "" }],
  [{ input: "3\n1 5 10\n4\n2 5 8 10", expectedOutput: "25", points: 1 },
   { input: "3\n1 2 3\n3\n4 5 6", expectedOutput: "15", points: 1 },
   { input: "4\n2 4 6 8\n5\n1 4 5 8 9", expectedOutput: "29", points: 1 }]),

p("Bishu and Soldiers", "Binary Search", "Medium", ["Array", "Binary Search", "Sorting"],
  "Bishu has an army of n soldiers, each with a certain power, and fights q rounds. In round i his power is M(i); with it he defeats every soldier whose power is at most M(i) (all defeated soldiers respawn before the next round, so every round starts with the same n soldiers). For every round, in order, print how many soldiers Bishu defeats and the sum of their powers; print all of these numbers for all q rounds, space-separated, on a single line.",
  "1 <= n, q <= 10^5, 1 <= soldier power, M(i) <= 10^9",
  "Input:\n7\n1 2 3 4 5 6 7\n3\n3 10 2\nOutput:\n3 6 7 28 2 3",
  ["Sort the soldiers' powers once and build a prefix-sum array over the sorted powers.", "For each query M, binary search for how many sorted powers are <= M; the sum of those soldiers' powers is exactly the matching prefix sum."],
  [{ input: "7\n1 2 3 4 5 6 7\n3\n3 10 2", expectedOutput: "3 6 7 28 2 3", explanation: "" },
   { input: "5\n5 5 5 10 20\n4\n5 20 4 100", expectedOutput: "3 15 5 45 0 0 5 45", explanation: "" }],
  [{ input: "1\n5\n2\n5 4", expectedOutput: "1 5 0 0", points: 1 },
   { input: "3\n10 20 30\n1\n25", expectedOutput: "2 30", points: 1 },
   { input: "4\n1 1 1 1\n2\n1 0", expectedOutput: "4 4 0 0", points: 1 }]),

p("Rasta and Kheshtak - Biggest Common Subsquare", "Arrays", "Hard", ["Array", "Binary Search", "Hashing"],
  "Two grids of integers, A (n rows by m columns) and B (x rows by y columns), are given. Find the largest integer s such that some contiguous s x s block of A is identical (matching values in matching positions) to some contiguous s x s block of B. Print 0 if not even a single value (a 1x1 block) is shared.",
  "1 <= n, m, x, y <= 50, 1 <= grid values <= 1000",
  "Input:\n3 3\n1 2 0\n1 2 1\n1 2 3\n3 3\n0 1 2\n1 1 2\n3 1 2\nOutput:\n2",
  ["Binary search on the answer size s: for a candidate s, hash every contiguous s x s block of both grids (row-by-row rolling hashes work well) and check whether any hash is shared - feasibility only improves as s shrinks.", "For grids this small, directly comparing every contiguous s x s block of A against every one of B (checked from the largest plausible size downward) is simpler and still correct, just slower than hashing."],
  [{ input: "3 3\n1 2 0\n1 2 1\n1 2 3\n3 3\n0 1 2\n1 1 2\n3 1 2", expectedOutput: "2", explanation: "" },
   { input: "2 2\n1 2\n3 4\n2 2\n5 6\n7 8", expectedOutput: "0", explanation: "" }],
  [{ input: "1 1\n1\n1 1\n1", expectedOutput: "1", points: 1 },
   { input: "3 3\n1 2 3\n4 5 6\n7 8 9\n3 3\n5 6 0\n8 9 0\n0 0 0", expectedOutput: "2", points: 1 },
   { input: "2 3\n1 2 3\n4 5 6\n3 2\n9 9\n9 9\n9 9", expectedOutput: "0", points: 1 }]),

p("Kth Smallest Element in a Range", "Binary Search", "Medium", ["Array", "Sorting", "Binary Search"],
  "Given an array of n integers and q queries, each giving a range [l, r] (1-indexed, inclusive) and an integer k, find the k-th smallest element within arr[l..r] for every query. Print all q answers, in order, space-separated, on a single line.",
  "1 <= n <= 10^5, 1 <= q <= 10^4, 1 <= l <= r <= n, 1 <= k <= r - l + 1",
  "Input:\n5\n1 5 4 2 3\n2\n1 4 3\n2 5 1\nOutput:\n4 2",
  ["Sorting the relevant slice arr[l..r] fresh for each query answers it correctly, though it isn't the fastest approach when there are many queries on a large array.", "A merge-sort tree (a segment tree whose every node stores its range's elements pre-sorted) answers each query in O(log^2 n) once built, and a persistent segment tree can do even better."],
  [{ input: "5\n1 5 4 2 3\n2\n1 4 3\n2 5 1", expectedOutput: "4 2", explanation: "" },
   { input: "4\n7 7 7 7\n1\n1 4 2", expectedOutput: "7", explanation: "" }],
  [{ input: "6\n9 1 8 2 7 3\n1\n3 6 2", expectedOutput: "3", points: 1 },
   { input: "5\n1 5 4 2 3\n1\n1 5 5", expectedOutput: "5", points: 1 },
   { input: "3\n3 1 2\n2\n1 3 1\n1 3 3", expectedOutput: "1 3", points: 1 }]),

];

let created = 0, skipped = 0;
for (const prob of PROBLEMS) {
  const existing = await db.collection("problems").where("title", "==", prob.title).get();
  if (!existing.empty) { skipped++; continue; }
  const { sampleTests, hiddenTests, ...problemFields } = prob;
  const problemRef = await db.collection("problems").add({
    ...problemFields, estimatedTime: 20, status: "published",
    totalSubmissions: 0, acceptedSubmissions: 0,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    createdBy: "devert.contact@gmail.com",
  });
  for (const t of sampleTests) await problemRef.collection("sampleTests").add(t);
  for (const t of hiddenTests) await problemRef.collection("hiddenTests").add(t);
  created++;
}
console.log(`SEARCHING & SORTING topic (part 2): created ${created} problem(s), skipped ${skipped} already-existing.`);
