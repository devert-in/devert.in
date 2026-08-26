import admin from "firebase-admin";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(join(__dirname, "service-account.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// DSA-450-sheet ingestion, DYNAMIC PROGRAMMING topic, PART 2 - closing the
// real gap against the sheet's verbatim DP row list. Cross-checked every row
// against Firestore across ALL categories (not just "Dynamic Programming")
// before adding anything. Rows skipped here as true cross-topic duplicates,
// with where they actually live:
//   Edit Distance                         -> Strings / "Edit Distance"
//   Subset Sum Problem                    -> Backtracking / "Subset Sum Problem"
//   Longest Common Subsequence             -> Strings / "Longest Common Subsequence"
//   Longest Repeated Subsequence           -> Strings / "Longest Repeating Subsequence"
//   Space Optimized Solution of LCS        -> same core problem as LCS above; a
//                                              space-optimization is an implementation
//                                              detail invisible to a stdin/stdout
//                                              grader, not a distinct problem
//   Maximum Length of Pair Chain           -> identical problem to this same batch's
//                                              "Maximum Length Chain of Pairs" (the
//                                              sheet lists it twice under different names)
//   Minimum number of jumps to reach end   -> Arrays / "Minimum Number of Jumps to
//                                              Reach End of Array"
//   Count all Palindromic Subsequence      -> Strings / "Count Palindromic
//                                              Subsequences in a String"
//   Longest Palindromic Substring          -> Strings / "Longest Palindromic Substring"
//   Largest Sum Contiguous Subarray        -> Arrays / "...(Kadane's Algorithm)"
//   Word Break Problem                     -> Strings / "Word Break Problem" (and
//                                              Backtracking / "Word Break - Count All Ways")
//   Partition problem                      -> same reachable-subset-sum DP as this
//                                              topic's existing "Partition a Set Into
//                                              Two Subsets With Minimum Difference of
//                                              Sums" (min-diff of 0 <=> exact partition)
//   Maximum profit ... at most twice       -> Arrays / "...at Most Twice"
//   Word Wrap Problem                      -> Strings / "Word Wrap Problem"
//   Mobile Numeric Keypad Problem          -> NOT actually duplicated anywhere -
//                                              added below (the sheet's own hint that
//                                              it's "likely under Strings" doesn't hold)
//   Find if a string is interleaved of two
//     other strings                        -> Strings / "Check if a String Is a Valid
//                                              Shuffle of Two Other Strings"
// Everything else below is a genuinely new problem for this batch.

const REWARD = { Easy: [30, 10], Medium: [50, 20], Hard: [80, 30] };
function p(title, category, difficulty, tags, statement, constraints, examplesText, hints, sampleTests, hiddenTests) {
  const [xpReward, coinReward] = REWARD[difficulty];
  return { title, category, difficulty, tags, statement, constraints, examplesText, hints, xpReward, coinReward, sampleTests, hiddenTests };
}

const TREE_FORMAT = "The tree is given as space-separated level-order tokens, where 'N' means no node there: the first token is the root, then for each node dequeued in level order you read its left-child token then its right-child token (if input runs out early, remaining children are treated as N).";

const PROBLEMS = [

p("Binomial Coefficient Problem", "Dynamic Programming", "Easy", ["Dynamic Programming", "Math"],
  "Given two integers n and k, compute the binomial coefficient C(n, k) - the number of ways to choose k items from n distinct items, without regard to order.",
  "0 <= k <= n <= 60",
  "Input:\n5\n2\nOutput:\n10",
  ["C(n,k) = C(n-1,k-1) + C(n-1,k), with C(n,0) = C(n,n) = 1 - build a 2D (Pascal's-triangle-style) DP table row by row.", "You only ever need the previous row to build the next one, so the table can be space-optimized to a single 1D array updated right to left.", "C(n,k) is symmetric: C(n,k) == C(n,n-k), which can shrink the k you actually need to compute."],
  [{ input: "5\n2", expectedOutput: "10", explanation: "" },
   { input: "4\n0", expectedOutput: "1", explanation: "" }],
  [{ input: "0\n0", expectedOutput: "1", points: 1 },
   { input: "10\n10", expectedOutput: "1", points: 1 },
   { input: "60\n30", expectedOutput: "118264581564861424", points: 1 }]),

p("Permutation Coefficient Problem", "Dynamic Programming", "Easy", ["Dynamic Programming", "Math"],
  "Given two integers n and k, compute the permutation coefficient P(n, k) = n! / (n-k)! - the number of ways to arrange k items chosen from n distinct items, where order matters.",
  "0 <= k <= n <= 20",
  "Input:\n10\n2\nOutput:\n90",
  ["P(n,k) = P(n-1,k) + k * P(n-1,k-1), with P(n,0) = 1 for every n - this mirrors Pascal's-triangle-style DP but with an extra factor of k on the diagonal term.", "Build a 2D table indexed by n and k using that recurrence rather than computing factorials directly, to avoid needing a base case for (n-k)! separately.", "P(n,k) equals C(n,k) multiplied by k! - a useful sanity check once you have both computed."],
  [{ input: "10\n2", expectedOutput: "90", explanation: "" },
   { input: "5\n0", expectedOutput: "1", explanation: "" }],
  [{ input: "5\n5", expectedOutput: "120", points: 1 },
   { input: "20\n20", expectedOutput: "2432902008176640000", points: 1 },
   { input: "20\n10", expectedOutput: "670442572800", points: 1 }]),

p("Program for nth Catalan Number", "Dynamic Programming", "Easy", ["Dynamic Programming", "Math"],
  "Given an integer n, print the nth Catalan number - the count of, for example, the number of distinct balanced parenthesizations of n pairs of brackets, or the number of distinct binary search trees with n nodes.",
  "0 <= n <= 30",
  "Input:\n3\nOutput:\n5",
  ["catalan(0) = 1; catalan(n) = sum over i from 0 to n-1 of catalan(i) * catalan(n-1-i) - it counts every way to split the outermost structure into a left part of size i and a right part of size n-1-i.", "Build a 1D DP array bottom-up from catalan(0) so every catalan(i) needed by the sum is already computed.", "Catalan numbers also equal C(2n, n) / (n+1), which gives an independent way to double-check your DP result."],
  [{ input: "3", expectedOutput: "5", explanation: "" },
   { input: "0", expectedOutput: "1", explanation: "" }],
  [{ input: "1", expectedOutput: "1", points: 1 },
   { input: "10", expectedOutput: "16796", points: 1 },
   { input: "30", expectedOutput: "3814986502092304", points: 1 }]),

p("Friends Pairing Problem", "Dynamic Programming", "Medium", ["Dynamic Programming"],
  "Given n friends, each of whom can either remain single or be paired up with exactly one other friend (a pairing is mutual and no one can be in more than one pair), count the total number of distinct ways to group them.",
  "0 <= n <= 30",
  "Input:\n3\nOutput:\n4",
  ["f(n) = f(n-1) + (n-1) * f(n-2), with f(0) = f(1) = 1 - the nth friend either stays single (f(n-1) ways for the rest) or pairs with any one of the other n-1 friends, after which those n-2 remain (f(n-2) ways).", "This is the same recurrence as counting involutions (permutations that are their own inverse) on n elements.", "Build the DP bottom-up in a 1D array; the numbers grow fast, so use a data type wide enough for large integers if your language needs one explicitly."],
  [{ input: "3", expectedOutput: "4", explanation: "" },
   { input: "0", expectedOutput: "1", explanation: "" }],
  [{ input: "1", expectedOutput: "1", points: 1 },
   { input: "4", expectedOutput: "10", points: 1 },
   { input: "30", expectedOutput: "606917269909048576", points: 1 }]),

p("Gold Mine Problem", "Dynamic Programming", "Medium", ["Dynamic Programming", "Matrix"],
  "Given a grid where each cell holds an amount of gold, a miner starts in any row of the leftmost column and repeatedly moves to the cell diagonally up-right, directly right, or diagonally down-right, until falling off the right edge. Find the maximum total gold collectible over any such path.",
  "1 <= rows, cols <= 500",
  "Input:\n4 4\n1 3 1 5\n2 2 4 1\n5 0 2 3\n0 6 1 2\nOutput:\n16",
  ["Work column by column from right to left: dp[i][j] = grid[i][j] + the best of dp[i-1][j+1], dp[i][j+1], dp[i+1][j+1] (treating any row outside the grid as contributing 0).", "The answer is the maximum value in the leftmost column of the dp table, since the miner may start in any row.", "Process the last column first (dp value there is just the grid value) so every column to its left can look one column ahead."],
  [{ input: "4 4\n1 3 1 5\n2 2 4 1\n5 0 2 3\n0 6 1 2", expectedOutput: "16", explanation: "" },
   { input: "3 3\n1 3 3\n2 1 4\n0 6 4", expectedOutput: "12", explanation: "" }],
  [{ input: "1 1\n7", expectedOutput: "7", points: 1 },
   { input: "4 4\n10 33 13 15\n22 21 4 1\n5 0 2 3\n0 6 14 2", expectedOutput: "83", points: 1 },
   { input: "2 2\n0 0\n0 0", expectedOutput: "0", points: 1 }]),

p("Assembly Line Scheduling Problem", "Dynamic Programming", "Hard", ["Dynamic Programming"],
  "A car chassis passes through n stations on each of two parallel assembly lines. Given the entry time onto each line, the exit time off each line, the time to process the chassis at station i on each line, and the cost to transfer the chassis from one line to the other right after station i (for i from 1 to n-1), find the minimum total time to build one chassis from entry to exit.",
  "1 <= n <= 1000",
  "Input:\n4\n2 4\n3 2\n7 9 3 4\n8 5 6 4\n2 3 1\n2 1 1\nOutput:\n28",
  ["Let T1[i] and T2[i] be the minimum time to reach the end of station i on line 1 and line 2 respectively. T1[0] = entry1 + a1[0]; T1[i] = min(T1[i-1] + a1[i], T2[i-1] + transferToLine1[i-1] + a1[i]), and symmetrically for T2.", "The final answer is min(T1[n-1] + exit1, T2[n-1] + exit2).", "Input order: n; entry times for line 1 and 2; exit times for line 1 and 2; the n station times for line 1; the n station times for line 2; the n-1 transfer costs into line 1 after stations 1..n-1; the n-1 transfer costs into line 2 after stations 1..n-1."],
  [{ input: "4\n2 4\n3 2\n7 9 3 4\n8 5 6 4\n2 3 1\n2 1 1", expectedOutput: "28", explanation: "" },
   { input: "4\n10 12\n18 7\n4 5 3 2\n4 5 2 3\n5 3 3\n6 2 2", expectedOutput: "33", explanation: "" }],
  [{ input: "1\n5 6\n2 3\n4\n5\n\n", expectedOutput: "11", points: 1 },
   { input: "2\n1 1\n1 1\n2 2\n2 2\n100\n100", expectedOutput: "6", points: 1 },
   { input: "2\n0 0\n0 0\n5 5\n5 5\n0\n0", expectedOutput: "10", points: 1 }]),

p("Painting the Fence Problem", "Dynamic Programming", "Medium", ["Dynamic Programming"],
  "Given a fence with n posts and k available colors, count the number of distinct ways to paint every post using one color per post such that no more than two adjacent posts share the same color.",
  "1 <= n <= 10^3, 1 <= k <= 10^3",
  "Input:\n3\n2\nOutput:\n6",
  ["Track two running totals: same[i] = ways to paint the first i posts where post i matches post i-1's color, and diff[i] = ways where it differs.", "same[i] = diff[i-1] (only valid if post i-1 differed from post i-2, otherwise three-in-a-row would repeat); diff[i] = (same[i-1] + diff[i-1]) * (k-1).", "Base case: for n == 1 the answer is simply k; for n == 2 it's k*k (same[2] = k, diff[2] = k*(k-1))."],
  [{ input: "3\n2", expectedOutput: "6", explanation: "" },
   { input: "2\n3", expectedOutput: "9", explanation: "" }],
  [{ input: "1\n5", expectedOutput: "5", points: 1 },
   { input: "4\n3", expectedOutput: "66", points: 1 },
   { input: "1\n1", expectedOutput: "1", points: 1 }]),

p("Maximize The Cut Segments", "Dynamic Programming", "Medium", ["Dynamic Programming"],
  "Given a rod of length n and three allowed cut lengths x, y, and z (each usable any number of times, in any order), find the maximum number of pieces the rod can be cut into using only cuts of those three lengths so that the pieces exactly account for the whole rod. Print 0 if it's not possible to cut the rod exactly using only those lengths.",
  "1 <= n <= 10^4, 1 <= x, y, z <= n",
  "Input:\n4\n2 1 1\nOutput:\n4",
  ["dp[i] = maximum number of segments achievable for a rod of length exactly i, or -infinity/unreachable if no combination of x, y, z sums to exactly i.", "dp[i] = 1 + max(dp[i-x], dp[i-y], dp[i-z]) over whichever of those are reachable and non-negative; dp[0] = 0.", "The final answer is dp[n] if it's reachable, otherwise 0 - don't confuse an unreachable length with a valid answer of 0 pieces."],
  [{ input: "4\n2 1 1", expectedOutput: "4", explanation: "" },
   { input: "5\n5 3 2", expectedOutput: "2", explanation: "" }],
  [{ input: "3\n5 3 2", expectedOutput: "1", points: 1 },
   { input: "1\n2 3 4", expectedOutput: "0", points: 1 },
   { input: "7\n2 3 5", expectedOutput: "3", points: 1 }]),

p("LCS of Three Strings", "Dynamic Programming", "Medium", ["Dynamic Programming", "String"],
  "Given three strings, find the length of their longest common subsequence - the longest sequence of characters (not necessarily contiguous) that appears, in the same relative order, in all three strings.",
  "1 <= |s1|, |s2|, |s3| <= 100",
  "Input:\nAGGT12\n12TXAYB\n12XBA\nOutput:\n2",
  ["dp[i][j][k] = LCS length of the first i characters of s1, first j of s2, and first k of s3.", "If s1[i-1] == s2[j-1] == s3[k-1], dp[i][j][k] = dp[i-1][j-1][k-1] + 1; otherwise it's the max of dropping the last character from any one of the three strings: dp[i-1][j][k], dp[i][j-1][k], dp[i][j][k-1].", "This is a direct 3D generalization of the standard two-string LCS DP - the base cases (any index 0) are all 0."],
  [{ input: "AGGT12\n12TXAYB\n12XBA", expectedOutput: "2", explanation: "" },
   { input: "abc\nabc\nabc", expectedOutput: "3", explanation: "" }],
  [{ input: "a\nb\nc", expectedOutput: "0", points: 1 },
   { input: "geeks\ngeeksfor\ngeeksforgeeks", expectedOutput: "5", points: 1 },
   { input: "abcde\nace\nade", expectedOutput: "2", points: 1 }]),

p("Maximum Sum Increasing Subsequence", "Dynamic Programming", "Medium", ["Dynamic Programming"],
  "Given an array of n integers, find the maximum possible sum of the elements of a strictly increasing subsequence.",
  "1 <= n <= 10^4",
  "Input:\n7\n1 101 2 3 100 4 5\nOutput:\n106",
  ["dp[i] = the maximum sum of an increasing subsequence that ends exactly at index i; initialize dp[i] = arr[i] for every i.", "For each i, look at every earlier index j with arr[j] < arr[i] and update dp[i] = max(dp[i], dp[j] + arr[i]).", "The answer is the maximum value anywhere in the dp array, not necessarily dp[n-1] - the best increasing run might not end at the last element."],
  [{ input: "7\n1 101 2 3 100 4 5", expectedOutput: "106", explanation: "" },
   { input: "4\n3 4 5 10", expectedOutput: "22", explanation: "" }],
  [{ input: "1\n7", expectedOutput: "7", points: 1 },
   { input: "4\n10 5 4 3", expectedOutput: "10", points: 1 },
   { input: "5\n1 2 3 4 5", expectedOutput: "15", points: 1 }]),

p("Count All Subsequences Having Product Less Than K", "Dynamic Programming", "Medium", ["Dynamic Programming"],
  "Given an array of n positive integers and an integer K, count the number of non-empty subsequences whose product of elements is strictly less than K.",
  "1 <= n <= 100, 1 <= K <= 200",
  "Input:\n4\n1 2 3 4\n10\nOutput:\n11",
  ["Track, as a map or array indexed by achievable product value p (1 <= p < K), how many subsequences seen so far (including the empty one, with product 1) achieve exactly that product.", "Process one array element a at a time: for every existing product p with p * a < K, add its count to the bucket for p * a - do this from a snapshot taken before processing a, so each element is used at most once per subsequence.", "Sum every bucket's count at the end and subtract 1 to remove the empty subsequence (product 1, trivially always less than K)."],
  [{ input: "4\n1 2 3 4\n10", expectedOutput: "11", explanation: "" },
   { input: "5\n4 2 3 5 7\n25", expectedOutput: "14", explanation: "" }],
  [{ input: "3\n1 1 1\n2", expectedOutput: "7", points: 1 },
   { input: "1\n5\n5", expectedOutput: "0", points: 1 },
   { input: "1\n1\n2", expectedOutput: "1", points: 1 }]),

p("Longest Subsequence With Adjacent Elements Differing by One", "Dynamic Programming", "Medium", ["Dynamic Programming"],
  "Given an array of n integers, find the length of the longest subsequence such that every pair of consecutive elements in the subsequence has an absolute difference of exactly 1.",
  "1 <= n <= 10^4",
  "Input:\n7\n10 9 4 5 4 8 6\nOutput:\n3",
  ["dp[i] = length of the longest valid subsequence ending exactly at index i; initialize every dp[i] = 1.", "For each i, check every earlier index j: if |arr[j] - arr[i]| == 1, dp[i] = max(dp[i], dp[j] + 1).", "The answer is the maximum value anywhere in the dp array."],
  [{ input: "7\n10 9 4 5 4 8 6", expectedOutput: "3", explanation: "" },
   { input: "5\n1 2 3 4 5", expectedOutput: "5", explanation: "" }],
  [{ input: "1\n5", expectedOutput: "1", points: 1 },
   { input: "4\n1 3 5 7", expectedOutput: "1", points: 1 },
   { input: "4\n5 4 3 2", expectedOutput: "4", points: 1 }]),

p("Maximum Subsequence Sum With No Three Consecutive Elements", "Dynamic Programming", "Medium", ["Dynamic Programming"],
  "Given an array of n non-negative integers, find the maximum possible sum of a subset of elements such that no three consecutive elements (by original array position) are all chosen.",
  "1 <= n <= 10^4",
  "Input:\n5\n3000 2000 1000 3 10\nOutput:\n5013",
  ["sum[i] = best achievable total considering only the first i+1 elements, obeying the no-three-consecutive rule and ending the considered range at index i.", "sum[i] = max(sum[i-1], sum[i-2] + arr[i], sum[i-3] + arr[i-1] + arr[i]) - either skip arr[i] entirely, include only arr[i] (skipping arr[i-1]), or include both arr[i-1] and arr[i] (skipping arr[i-2]).", "Handle the first three indices as base cases directly, since the recurrence above references indices that may be negative."],
  [{ input: "5\n3000 2000 1000 3 10", expectedOutput: "5013", explanation: "" },
   { input: "5\n100 1000 100 1000 1", expectedOutput: "2101", explanation: "" }],
  [{ input: "1\n5", expectedOutput: "5", points: 1 },
   { input: "3\n1 2 3", expectedOutput: "5", points: 1 },
   { input: "2\n7 8", expectedOutput: "15", points: 1 }]),

p("Maximum Length Chain of Pairs", "Dynamic Programming", "Medium", ["Dynamic Programming"],
  "Given n pairs of integers (a, b) with a < b, a pair (c, d) can follow a pair (a, b) in a chain if b < c. Find the length of the longest chain that can be formed by picking a subset of the given pairs and arranging them in a valid chain.",
  "1 <= n <= 10^4",
  "Input:\n4\n5 24\n15 25\n27 40\n50 60\nOutput:\n3",
  ["Sort the pairs by their first element so any valid chain appears in increasing order in the sorted list.", "dp[i] = length of the longest chain ending with pair i (after sorting); dp[i] = 1 + max(dp[j]) over every j < i whose second element is less than pair i's first element.", "The answer is the maximum value anywhere in the dp array - this is the same shape of problem as Longest Increasing Subsequence, just with a different 'compatible predecessor' test."],
  [{ input: "4\n5 24\n15 25\n27 40\n50 60", expectedOutput: "3", explanation: "" },
   { input: "1\n1 2", expectedOutput: "1", explanation: "" }],
  [{ input: "3\n1 2\n2 3\n3 4", expectedOutput: "2", explanation: "" },
   { input: "3\n1 5\n2 3\n6 8", expectedOutput: "2", points: 1 },
   { input: "2\n1 10\n2 3", expectedOutput: "1", points: 1 }]),

p("Maximum Sum of Pairs With Specific Difference", "Dynamic Programming", "Medium", ["Dynamic Programming"],
  "Given an array of n integers and an integer k, choose some number of disjoint pairs of elements (each array element used in at most one pair) such that within each pair the absolute difference is strictly less than k, so as to maximize the sum of all chosen (paired) elements.",
  "1 <= n <= 10^4",
  "Input:\n7\n3 5 10 15 17 12 9\n4\nOutput:\n62",
  ["Sort the array first - if any pair is worth taking, it's always at least as good to pair adjacent elements in the sorted order (pairing across a gap only increases the difference without helping the sum).", "dp[i] = best achievable sum using the first i elements of the sorted array; dp[i] = dp[i-1] (skip element i), or dp[i-2] + arr[i-1] + arr[i-2] if those two adjacent sorted elements differ by less than k.", "Take the better of the two options at every step; the final answer is dp[n]."],
  [{ input: "7\n3 5 10 15 17 12 9\n4", expectedOutput: "62", explanation: "" },
   { input: "4\n1 2 3 4\n1", expectedOutput: "0", explanation: "" }],
  [{ input: "4\n5 5 5 5\n1", expectedOutput: "20", points: 1 },
   { input: "1\n5\n10", expectedOutput: "0", points: 1 },
   { input: "2\n1 100\n5", expectedOutput: "0", points: 1 }]),

p("Maximum Difference of Zeros and Ones in a Binary String", "Dynamic Programming", "Medium", ["Dynamic Programming", "String"],
  "Given a binary string, find the maximum value of (count of 0s minus count of 1s) over every contiguous, non-empty substring. Print -1 if the string contains no 0s at all.",
  "1 <= |s| <= 10^5",
  "Input:\n11000010001\nOutput:\n6",
  ["If the string is all 1s, immediately print -1 - no substring can have a positive or zero count of 0s.", "Otherwise, map each '0' to +1 and each '1' to -1, then the answer is simply the maximum-sum contiguous subarray (Kadane's algorithm) over that mapped sequence.", "Kadane's here must allow a single-element subarray as the minimum window - track a running current-best that resets to the current element's value whenever continuing would make it smaller than starting fresh."],
  [{ input: "11000010001", expectedOutput: "6", explanation: "" },
   { input: "1111", expectedOutput: "-1", explanation: "" }],
  [{ input: "0000", expectedOutput: "4", points: 1 },
   { input: "1010101", expectedOutput: "1", points: 1 },
   { input: "0", expectedOutput: "1", points: 1 }]),

p("Minimum Cost to Fill a Bag With Given Weight", "Dynamic Programming", "Medium", ["Dynamic Programming"],
  "You're given the cost of packets of weight 1, 2, ..., n (a cost of -1 means a packet of that weight isn't available), with an unlimited supply of every available weight. Find the minimum total cost of packets needed to fill a bag with exactly weight W. Print -1 if it's impossible.",
  "1 <= n <= 1000, 1 <= W <= 1000",
  "Input:\n5\n20 10 4 50 100\n5\nOutput:\n14",
  ["dp[w] = minimum cost to make exactly weight w using unlimited copies of the available packet weights; dp[0] = 0.", "For each weight w from 1 to W, try every packet weight i from 1 to n: if i <= w and packet i is available and dp[w-i] is reachable, dp[w] = min(dp[w], dp[w-i] + cost[i]).", "If dp[W] is never updated from its initial 'unreachable' state, the answer is -1 - this is exactly unbounded knapsack with a minimization objective instead of a maximization one."],
  [{ input: "5\n20 10 4 50 100\n5", expectedOutput: "14", explanation: "" },
   { input: "5\n1 2 3 4 5\n5", expectedOutput: "5", explanation: "" }],
  [{ input: "2\n-1 -1\n3", expectedOutput: "-1", points: 1 },
   { input: "5\n-1 -1 4 5 -1\n11", expectedOutput: "14", points: 1 },
   { input: "1\n-1\n1", expectedOutput: "-1", points: 1 }]),

p("Minimum Removals From Array to Make Max Minus Min At Most K", "Dynamic Programming", "Medium", ["Dynamic Programming", "Two Pointer"],
  "Given an array of n integers and an integer K, find the minimum number of elements that must be removed so that, among the remaining elements, the difference between the maximum and the minimum is at most K.",
  "1 <= n <= 10^5",
  "Input:\n9\n1 3 4 9 10 11 12 17 20\n4\nOutput:\n5",
  ["Sort the array - once sorted, any subset kept without removal is optimal to keep as a contiguous run of the sorted array (skipping elements can only hurt, since any valid range stays valid if you don't shrink it from either side).", "Use two pointers over the sorted array: for each right endpoint i, advance the left pointer j while arr[i] - arr[j] > K, then the window [j, i] is a valid candidate to keep.", "Track the largest valid window length found; the answer is n minus that length."],
  [{ input: "9\n1 3 4 9 10 11 12 17 20\n4", expectedOutput: "5", explanation: "" },
   { input: "5\n4 7 9 1 2\n3", expectedOutput: "2", explanation: "" }],
  [{ input: "4\n1 1 1 1\n0", expectedOutput: "0", points: 1 },
   { input: "1\n5\n0", expectedOutput: "0", points: 1 },
   { input: "3\n1 5 9\n0", expectedOutput: "2", points: 1 }]),

p("Count Ways to Reach a Given Score in a Game", "Dynamic Programming", "Easy", ["Dynamic Programming"],
  "In a game, a move scores exactly 3, 5, or 10 points. Given a target total score, count the number of distinct ways (as unordered combinations of moves - the same multiset of move values counted once regardless of order) to reach exactly that score.",
  "0 <= score <= 10^4",
  "Input:\n20\nOutput:\n4",
  ["This is exactly coin-change 'count number of ways' with a fixed coin set of {3, 5, 10}: dp[s] = number of ways to reach score s; dp[0] = 1.", "Process one move value at a time (3, then 5, then 10), and for each, update dp[s] += dp[s - move] for every s >= move in increasing order of s - this is what avoids counting the same combination in multiple orders.", "A score of 0 counts as exactly one way (make no moves at all)."],
  [{ input: "20", expectedOutput: "4", explanation: "" },
   { input: "13", expectedOutput: "2", explanation: "" }],
  [{ input: "0", expectedOutput: "1", points: 1 },
   { input: "1", expectedOutput: "0", points: 1 },
   { input: "3", expectedOutput: "1", points: 1 }]),

p("Count Balanced Binary Trees of Height h", "Dynamic Programming", "Hard", ["Dynamic Programming"],
  "A binary tree is height-balanced if, for every node, the heights of its left and right subtrees differ by at most 1. Given h, count the number of distinct height-balanced binary trees (structurally, ignoring node values) whose height is exactly h. Since this count grows doubly-exponentially, print it modulo 10^9 + 7.",
  "0 <= h <= 1000",
  "Input:\n2\nOutput:\n3",
  ["dp[i] = number of height-balanced trees of height exactly i; dp[0] = 1 (a single node, or an empty tree, counts as height 0 here), dp[1] = 1.", "A tree of height i is formed by combining two balanced subtrees whose heights are (i-1, i-1), (i-1, i-2), or (i-2, i-1) - which works out to dp[i] = dp[i-1] * (2*dp[i-2] + dp[i-1]).", "Take every multiplication and addition modulo 10^9 + 7 as you go, since the true values overflow ordinary integer types almost immediately."],
  [{ input: "2", expectedOutput: "3", explanation: "" },
   { input: "0", expectedOutput: "1", explanation: "" }],
  [{ input: "1", expectedOutput: "1", points: 1 },
   { input: "3", expectedOutput: "15", points: 1 },
   { input: "10", expectedOutput: "658692454", points: 1 }]),

p("Smallest Sum Contiguous Subarray", "Dynamic Programming", "Easy", ["Dynamic Programming"],
  "Given an array of n integers (which may include negative numbers), find the minimum possible sum of any non-empty contiguous subarray.",
  "1 <= n <= 10^5",
  "Input:\n7\n3 -4 2 -3 -1 7 -5\nOutput:\n-6",
  ["This is Kadane's algorithm run for a minimum instead of a maximum: cur[i] = min(arr[i], cur[i-1] + arr[i]) - either start a new subarray at i, or extend the best subarray ending at i-1.", "Track the smallest cur value seen across all i as the running answer.", "Since the subarray must be non-empty, initialize both the running current sum and the answer to arr[0], not to 0."],
  [{ input: "7\n3 -4 2 -3 -1 7 -5", expectedOutput: "-6", explanation: "" },
   { input: "3\n1 2 3", expectedOutput: "1", explanation: "" }],
  [{ input: "1\n5", expectedOutput: "5", points: 1 },
   { input: "3\n-1 -2 -3", expectedOutput: "-6", points: 1 },
   { input: "4\n5 -3 5 -3", expectedOutput: "-3", points: 1 }]),

p("Unbounded Knapsack (Repetition of Items Allowed)", "Dynamic Programming", "Medium", ["Dynamic Programming"],
  "Given n item types, each with a weight and a value, and a knapsack of capacity W, find the maximum total value obtainable by picking items with unlimited repetition allowed for every type (any number of copies of any item, as long as total weight doesn't exceed W).",
  "1 <= n <= 1000, 1 <= W <= 10^4",
  "Input:\n3\n2 4 6\n5 11 13\n10\nOutput:\n27",
  ["dp[w] = best value achievable with capacity exactly up to w; dp[0] = 0.", "For each capacity w from 1 to W, try every item i: if weight[i] <= w, dp[w] = max(dp[w], dp[w - weight[i]] + value[i]) - note this reuses dp[w - weight[i]] from the *same* pass (not a previous item's row), which is exactly what allows unlimited repetition of any item.", "This differs from 0/1 knapsack only in that single-array update rule - 0/1 knapsack must look at a previous item's row to avoid reusing an item."],
  [{ input: "3\n2 4 6\n5 11 13\n10", expectedOutput: "27", explanation: "" },
   { input: "1\n3\n5\n10", expectedOutput: "15", explanation: "" }],
  [{ input: "2\n5 10\n10 15\n7", expectedOutput: "10", points: 1 },
   { input: "1\n5\n10\n4", expectedOutput: "0", points: 1 },
   { input: "1\n1\n5\n0", expectedOutput: "0", points: 1 }]),

p("Largest Independent Set in a Binary Tree", "Dynamic Programming", "Hard", ["Dynamic Programming", "Tree"],
  `Given a binary tree, find the size of its largest independent set - the largest possible subset of nodes such that no two nodes in the subset are directly connected by an edge (i.e., no subset node is the parent of another subset node). ${TREE_FORMAT}`,
  "1 <= number of nodes <= 10^4",
  "Input:\n20 8 22 4 12 N 25 N N 10 14\nOutput:\n5",
  ["For each node, define liset(node) as the answer for the subtree rooted there. There are two options for the node itself: include it, or exclude it.", "Excluding the node: liset(node) = liset(left child) + liset(right child). Including the node: since its direct children must then be excluded, you get 1 plus the liset values of its *grandchildren* (the children of its left and right child).", "liset(node) = max(these two options); a null node contributes 0. Memoize per node so each subtree's value is computed once, since a naive recursion recomputes grandchildren repeatedly."],
  [{ input: "20 8 22 4 12 N 25 N N 10 14", expectedOutput: "5", explanation: "" },
   { input: "1", expectedOutput: "1", explanation: "" }],
  [{ input: "1 2 3 4 5 6 7", expectedOutput: "5", points: 1 },
   { input: "1 2 N 3 N 4 N", expectedOutput: "2", points: 1 },
   { input: "N", expectedOutput: "0", points: 1 }]),

p("Longest Palindromic Subsequence", "Dynamic Programming", "Medium", ["Dynamic Programming", "String"],
  "Given a string, find the length of its longest palindromic subsequence - the longest sequence of characters (not necessarily contiguous) that reads the same forwards and backwards.",
  "1 <= |s| <= 2000",
  "Input:\nbbbab\nOutput:\n4",
  ["dp[i][j] = length of the longest palindromic subsequence within the substring s[i..j] (inclusive).", "Every single character is a palindrome of length 1: dp[i][i] = 1. If s[i] == s[j], dp[i][j] = dp[i+1][j-1] + 2 (or just 2 when j == i+1); otherwise dp[i][j] = max(dp[i+1][j], dp[i][j-1]).", "Fill the table by increasing substring length, since dp[i][j] depends on strictly shorter substrings."],
  [{ input: "bbbab", expectedOutput: "4", explanation: "" },
   { input: "cbbd", expectedOutput: "2", explanation: "" }],
  [{ input: "a", expectedOutput: "1", points: 1 },
   { input: "aa", expectedOutput: "2", points: 1 },
   { input: "character", expectedOutput: "5", points: 1 }]),

p("Longest Alternating Subsequence", "Dynamic Programming", "Medium", ["Dynamic Programming"],
  "Given an array of n integers, find the length of its longest alternating (zig-zag) subsequence - one where the elements strictly alternate between rising and falling at every consecutive step (either up-down-up-... or down-up-down-...).",
  "1 <= n <= 10^4",
  "Input:\n8\n10 22 9 33 49 50 31 60\nOutput:\n6",
  ["Track two arrays: inc[i] = length of the longest alternating subsequence ending at i where the last step (into i) was a rise, and dec[i] = the same but where the last step was a fall.", "For j < i: if arr[j] < arr[i], inc[i] can be updated from dec[j] + 1 (a fall into j, then a rise into i); if arr[j] > arr[i], dec[i] can be updated from inc[j] + 1 (symmetric case).", "A single element on its own has length 1 in both inc and dec; the final answer is the maximum value anywhere across both arrays."],
  [{ input: "8\n10 22 9 33 49 50 31 60", expectedOutput: "6", explanation: "" },
   { input: "4\n1 2 3 4", expectedOutput: "2", explanation: "" }],
  [{ input: "1\n5", expectedOutput: "1", points: 1 },
   { input: "3\n3 3 3", expectedOutput: "1", points: 1 },
   { input: "5\n1 5 2 8 3", expectedOutput: "5", points: 1 }]),

p("Weighted Job Scheduling", "Dynamic Programming", "Hard", ["Dynamic Programming", "Sorting"],
  "Given n jobs, each with a start time, a finish time, and a profit, find the maximum total profit obtainable by scheduling a subset of non-overlapping jobs (a job can start only at or after the finish time of the previous job in the chosen subset).",
  "1 <= n <= 10^4",
  "Input:\n4\n1 2 50\n3 5 20\n6 19 100\n2 100 200\nOutput:\n250",
  ["Sort all jobs by finish time. dp[i] = best profit achievable using only the first i jobs (in this sorted order); dp[0] = profit of job 0.", "For job i, either skip it (dp[i-1]) or take it: its profit plus dp[l], where l is the largest index before i whose finish time is at most job i's start time (or 0 profit if no such job exists). dp[i] = max of those two options.", "Finding l via a full backward scan works within these constraints, but a binary search over finish times (since jobs are sorted by finish time) is the standard way to make this scale."],
  [{ input: "4\n1 2 50\n3 5 20\n6 19 100\n2 100 200", expectedOutput: "250", explanation: "" },
   { input: "4\n1 3 5\n2 5 6\n4 6 5\n6 7 4", expectedOutput: "14", explanation: "" }],
  [{ input: "1\n1 2 5", expectedOutput: "5", points: 1 },
   { input: "2\n1 2 10\n2 3 5", expectedOutput: "15", points: 1 },
   { input: "2\n1 5 10\n2 3 5", expectedOutput: "10", points: 1 }]),

p("Coin Game Winner Where Every Player Has Three Choices", "Dynamic Programming", "Medium", ["Dynamic Programming", "Game Theory"],
  "Two players, A and B, alternately remove coins from a pile of n coins, with A moving first. On each turn a player must remove exactly 1, x, or y coins (a fixed x and y, valid only if the pile has at least that many coins). The player who cannot make a move (the pile is empty on their turn) loses. Assuming both play optimally, print 'A' if the first player wins, otherwise print 'B'.",
  "0 <= n <= 10^4, 1 <= x, y <= 10^4",
  "Input:\n5\n3\n4\nOutput:\nA",
  ["win[i] = true if the player about to move, when the pile has i coins, can force a win. win[0] = false (no move is possible, so the player to move loses).", "win[i] = true if any legal move leads to a state where the opponent loses: win[i-1] == false, or (i >= x and win[i-x] == false), or (i >= y and win[i-y] == false).", "The overall answer is 'A' if win[n] is true (the first player, facing the full pile, can force a win), otherwise 'B'."],
  [{ input: "5\n3\n4", expectedOutput: "A", explanation: "" },
   { input: "2\n3\n4", expectedOutput: "B", explanation: "" }],
  [{ input: "0\n3\n4", expectedOutput: "B", explanation: "" },
   { input: "1\n3\n4", expectedOutput: "A", explanation: "" },
   { input: "3\n3\n4", expectedOutput: "A", explanation: "" }]),

p("Count Derangements", "Dynamic Programming", "Medium", ["Dynamic Programming", "Math"],
  "A derangement of n distinct items is a permutation in which no item ends up in its original position. Given n, count the number of distinct derangements.",
  "0 <= n <= 20",
  "Input:\n4\nOutput:\n9",
  ["D(0) = 1 and D(1) = 0 as base cases.", "D(n) = (n-1) * (D(n-1) + D(n-2)) - fix where the first item goes (to one of n-1 possible other positions), then split into whether that displaced item's original slot gets item 1 back in a swap-like way (D(n-2)) or not (D(n-1)).", "Build the DP bottom-up in a 1D array from D(0) and D(1)."],
  [{ input: "4", expectedOutput: "9", explanation: "" },
   { input: "0", expectedOutput: "1", explanation: "" }],
  [{ input: "1", expectedOutput: "0", points: 1 },
   { input: "2", expectedOutput: "1", points: 1 },
   { input: "3", expectedOutput: "2", points: 1 }]),

p("Optimal Strategy for a Game", "Dynamic Programming", "Hard", ["Dynamic Programming", "Game Theory"],
  "n coins with given values are arranged in a row. Two players alternately pick a coin from either end of the remaining row (the first player moves first), each keeping the value of every coin they pick, and both play optimally to maximize their own total. Find the maximum total value the first player can guarantee for themself.",
  "1 <= n <= 1000",
  "Input:\n4\n8 15 3 7\nOutput:\n22",
  ["dp[i][j] = the maximum value the player to move can guarantee from the subarray arr[i..j], assuming both players play optimally from here on.", "Picking arr[i] leaves the opponent facing arr[i+1..j]; whichever end the opponent then picks, they leave you the worse of the two remaining sub-ranges for your own next turn - so picking i is worth arr[i] + min(dp[i+2][j], dp[i+1][j-1]). Picking arr[j] is symmetric: arr[j] + min(dp[i+1][j-1], dp[i][j-2]).", "dp[i][j] = max of those two picks; a single coin (i == j) is worth just its own value, and treat any dp range with i > j as worth 0."],
  [{ input: "4\n8 15 3 7", expectedOutput: "22", explanation: "" },
   { input: "4\n2 2 2 2", expectedOutput: "4", explanation: "" }],
  [{ input: "1\n10", expectedOutput: "10", points: 1 },
   { input: "2\n5 3", expectedOutput: "5", points: 1 },
   { input: "6\n20 30 2 2 2 10", expectedOutput: "42", points: 1 }]),

p("Optimal Binary Search Tree", "Dynamic Programming", "Hard", ["Dynamic Programming", "Tree"],
  "Given n distinct keys in sorted order and the search frequency of each key, build a binary search tree over exactly those keys that minimizes the total search cost, where the cost of searching for a key is its frequency multiplied by its depth in the tree (the root is at depth 1). Print that minimum total cost.",
  "1 <= n <= 500",
  "Input:\n3\n10 12 20\n34 8 50\nOutput:\n142",
  ["dp[i][j] = minimum search cost for a BST built over keys i..j alone (as if that sub-range were the whole key set).", "Try every key r in [i, j] as the root of that sub-range: cost = dp[i][r-1] + dp[r+1][j] + (sum of frequencies from i to j) - the sum-of-frequencies term accounts for every key in the range dropping one level deeper because of this root choice. dp[i][j] = the minimum of that cost over every choice of r.", "Precompute prefix sums of frequency so the range-sum term is O(1) per (i, j, r) triple instead of a fresh loop."],
  [{ input: "3\n10 12 20\n34 8 50", expectedOutput: "142", explanation: "" },
   { input: "2\n10 12\n34 50", expectedOutput: "118", explanation: "" }],
  [{ input: "1\n5\n100", expectedOutput: "100", points: 1 },
   { input: "4\n10 12 20 25\n4 2 6 3", expectedOutput: "26", points: 1 },
   { input: "2\n1 2\n1 1", expectedOutput: "3", points: 1 }]),

p("Palindrome Partitioning Problem (Minimum Cuts)", "Dynamic Programming", "Hard", ["Dynamic Programming", "String"],
  "Given a string, find the minimum number of cuts needed to partition it into pieces such that every piece is itself a palindrome. A string that's already a palindrome needs 0 cuts.",
  "1 <= |s| <= 1000",
  "Input:\nababbbabbababa\nOutput:\n3",
  ["First precompute isPal[i][j] = whether s[i..j] is a palindrome, filled by increasing substring length: s[i..j] is a palindrome if s[i] == s[j] and (the length is 2, or s[i+1..j-1] is a palindrome).", "dp[i] = minimum cuts needed for the prefix s[0..i]. If isPal[0][i] is true, dp[i] = 0.", "Otherwise dp[i] = min over every k < i where isPal[k+1][i] is true of dp[k] + 1 - cut right after position k, making s[k+1..i] the last (palindromic) piece."],
  [{ input: "ababbbabbababa", expectedOutput: "3", explanation: "" },
   { input: "aab", expectedOutput: "1", explanation: "" }],
  [{ input: "a", expectedOutput: "0", points: 1 },
   { input: "abc", expectedOutput: "2", points: 1 },
   { input: "aba", expectedOutput: "0", points: 1 }]),

p("Mobile Numeric Keypad Problem", "Dynamic Programming", "Medium", ["Dynamic Programming"],
  "A standard mobile numeric keypad (digits 1-9 in a 3x3 grid, with 0 below the 8) lets you move from the currently pressed digit to itself, or to any digit directly above, below, left, or right of it on the keypad (no diagonal moves; moves off the edge of the keypad aren't allowed). Given n, count the number of distinct sequences of exactly n key presses obtainable this way, starting from any digit.",
  "1 <= n <= 10^4",
  "Input:\n1\nOutput:\n10",
  ["dp[d][i] = number of length-i sequences that end on digit d; dp[d][1] = 1 for every digit d (a sequence of length 1 is just pressing that digit).", "dp[d][i] = sum of dp[d'][i-1] over every digit d' that can move to d (which, since the adjacency is symmetric, is the same set as the digits d can move to).", "The keypad's adjacency is fixed and small enough to hardcode directly: for example 5 connects to {2,4,6,8}, 0 connects only to {8}, and 1 connects to {2,4} (no diagonal to 5). The final answer is the sum of dp[d][n] over all ten digits."],
  [{ input: "1", expectedOutput: "10", explanation: "" },
   { input: "2", expectedOutput: "36", explanation: "" }],
  [{ input: "3", expectedOutput: "138", points: 1 },
   { input: "4", expectedOutput: "532", points: 1 },
   { input: "5", expectedOutput: "2062", points: 1 }]),

p("Boolean Parenthesization Problem", "Dynamic Programming", "Hard", ["Dynamic Programming"],
  "Given a sequence of n boolean symbols ('T' for true, 'F' for false) separated by n-1 boolean operators (each '&', '|', or '^'), count the number of ways to fully parenthesize the expression such that it evaluates to true.",
  "1 <= n <= 200",
  "Input:\nTTFT\n|&^\nOutput:\n4",
  ["For a range of symbols i..j, track T[i][j] = number of parenthesizations of that sub-expression evaluating to true, and F[i][j] = the number evaluating to false. A single symbol has T or F equal to 1 and the other 0.", "For every split point k between i and j (splitting on operator k), combine the left part's (T,F) counts with the right part's (T,F) counts according to that operator's truth table - e.g. for '&', a true result requires both sides true: add T[i][k]*T[k+1][j] to T[i][j], and everything else (the remaining three T/F combinations) to F[i][j].", "Sum the contribution from every possible split point k in the range, then the final answer is T[0][n-1]."],
  [{ input: "TTFT\n|&^", expectedOutput: "4", explanation: "" },
   { input: "TFT\n^&", expectedOutput: "2", explanation: "" }],
  [{ input: "T\n", expectedOutput: "1", points: 1 },
   { input: "F\n", expectedOutput: "0", points: 1 },
   { input: "TTFT\n^^^", expectedOutput: "5", points: 1 }]),

p("Largest Rectangular Sub-Matrix Whose Sum Is 0", "Dynamic Programming", "Hard", ["Dynamic Programming", "Matrix"],
  "Given a matrix of integers, find the area (rows x cols) of the largest rectangular sub-matrix whose elements sum to exactly 0. Print 0 if no such sub-matrix exists.",
  "1 <= rows, cols <= 200",
  "Input:\n4 4\n9 7 16 5\n1 -6 -7 3\n2 -1 15 7\n22 20 -27 17\nOutput:\n3",
  ["Fix a pair of top and bottom rows, and collapse every column between them into a single running column-sum array - this reduces the 2D problem to the classic 1D 'longest subarray summing to zero' problem on that collapsed array.", "For the 1D problem, track prefix sums and the first column index at which each prefix-sum value was seen (using a hash map, with prefix sum 0 mapped to index -1 before the array starts); a repeated prefix sum means the subarray between those two indices sums to 0.", "Try every pair of top and bottom rows (O(rows^2) pairs), and for each, the 1D scan is O(cols) - track the best area (height * width) seen across all of them."],
  [{ input: "4 4\n9 7 16 5\n1 -6 -7 3\n2 -1 15 7\n22 20 -27 17", expectedOutput: "3", explanation: "" },
   { input: "2 2\n1 2\n3 4", expectedOutput: "0", explanation: "" }],
  [{ input: "1 1\n0", expectedOutput: "1", points: 1 },
   { input: "1 1\n5", expectedOutput: "0", points: 1 },
   { input: "2 2\n1 -1\n1 -1", expectedOutput: "4", points: 1 }]),

p("Largest Area Rectangular Sub-Matrix With Equal Number of 1s and 0s", "Dynamic Programming", "Hard", ["Dynamic Programming", "Matrix"],
  "Given a binary matrix (every entry is 0 or 1), find the area of the largest rectangular sub-matrix that contains an equal number of 0s and 1s. Print 0 if no such non-empty sub-matrix exists.",
  "1 <= rows, cols <= 200",
  "Input:\n4 4\n0 1 1 0\n0 0 1 1\n1 1 1 0\n1 0 0 1\nOutput:\n8",
  ["Replace every 0 in the matrix with -1, leaving every 1 as +1 - a sub-matrix now has an equal count of original 0s and 1s exactly when its sum (under this relabeling) is 0.", "This turns the problem into 'largest rectangular sub-matrix whose sum is 0' on the relabeled matrix, solvable with the same row-collapsing plus prefix-sum-hashmap technique.", "A sub-matrix consisting of a single 0 or a single 1 alone is never a valid answer on its own (unequal counts, 1 vs 0) - the smallest valid non-empty answer requires at least one of each."],
  [{ input: "4 4\n0 1 1 0\n0 0 1 1\n1 1 1 0\n1 0 0 1", expectedOutput: "8", explanation: "" },
   { input: "2 2\n1 0\n0 1", expectedOutput: "4", explanation: "" }],
  [{ input: "2 2\n1 1\n1 1", expectedOutput: "0", points: 1 },
   { input: "1 2\n1 0", expectedOutput: "2", points: 1 },
   { input: "1 1\n1", expectedOutput: "0", points: 1 }]),

p("Maximum Sum Rectangle in a 2D Matrix", "Dynamic Programming", "Hard", ["Dynamic Programming", "Matrix"],
  "Given a matrix of integers (which may include negative numbers), find the maximum possible sum of the elements within any rectangular sub-matrix.",
  "1 <= rows, cols <= 200",
  "Input:\n4 5\n1 2 -1 -4 -20\n-8 -3 4 2 1\n3 8 10 1 3\n-4 -1 1 7 -6\nOutput:\n29",
  ["Fix a pair of top and bottom rows, and collapse every column between them into a single running column-sum array.", "The best rectangle using exactly those top/bottom rows is then just the maximum-sum contiguous subarray (Kadane's algorithm, allowing a single element) over that collapsed 1D array.", "Try every pair of top and bottom rows (O(rows^2) pairs total) and take the best Kadane's result over all of them - unlike the zero-sum variant, negative numbers mean the best 'rectangle' can legitimately be a single cell if everything else would only make the sum worse."],
  [{ input: "4 5\n1 2 -1 -4 -20\n-8 -3 4 2 1\n3 8 10 1 3\n-4 -1 1 7 -6", expectedOutput: "29", explanation: "" },
   { input: "2 2\n1 2\n3 4", expectedOutput: "10", explanation: "" }],
  [{ input: "2 2\n-1 -2\n-3 -4", expectedOutput: "-1", points: 1 },
   { input: "1 1\n7", expectedOutput: "7", points: 1 },
   { input: "1 3\n-5 3 -2", expectedOutput: "3", points: 1 }]),

p("Maximum Profit With At Most K Transactions", "Dynamic Programming", "Hard", ["Dynamic Programming"],
  "Given an array of n daily stock prices and an integer k, find the maximum total profit obtainable from at most k buy-sell transactions, where a new buy can only happen after the previous sell (no overlapping transactions, and at most one share held at a time).",
  "1 <= n <= 1000, 0 <= k <= 100",
  "Input:\n2\n3\n2 4 1\nOutput:\n2",
  ["dp[t][d] = maximum profit using at most t transactions, considering prices up to day d. dp[t][d] = max(dp[t][d-1], price[d] + best-net-value-of-buying-on-some-earlier-day-e-and-having-used-t-1-transactions-before-day-e).", "Track, while sweeping d left to right for a fixed t, a running 'maxdiff' = max over earlier days e of (dp[t-1][e] - price[e]) - this turns the naive O(n^2) inner search for the best buy day into an O(1) running update, giving O(n*k) overall.", "If k is large enough that at most k transactions is no real constraint (k >= n/2), the answer collapses to simply summing every positive day-to-day price increase (the unlimited-transactions case) - handle that case directly to avoid needing an oversized DP table."],
  [{ input: "2\n3\n2 4 1", expectedOutput: "2", explanation: "" },
   { input: "2\n6\n3 2 6 5 0 3", expectedOutput: "7", explanation: "" }],
  [{ input: "1\n6\n7 1 5 3 6 4", expectedOutput: "5", points: 1 },
   { input: "3\n5\n1 2 3 4 5", expectedOutput: "4", points: 1 },
   { input: "0\n3\n1 5 3", expectedOutput: "0", points: 1 }]),

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
console.log(`DYNAMIC PROGRAMMING topic (part 2): created ${created} problem(s), skipped ${skipped} already-existing.`);
