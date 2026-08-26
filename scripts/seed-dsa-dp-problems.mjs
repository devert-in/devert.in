import admin from "firebase-admin";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(join(__dirname, "service-account.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// DSA-450-sheet ingestion, DYNAMIC PROGRAMMING topic. Many classic DP rows
// from the sheet are already seeded under other topics (Kadane's/max product
// subarray under Arrays, LCS/edit-distance/palindromic-subsequence-count/
// word-break under Strings, house-robber-style "max sum no two adjacent"
// under Searching & Sorting) - not repeated here. This batch covers the
// remaining classic DP problems not yet covered anywhere else.

const REWARD = { Easy: [30, 10], Medium: [50, 20], Hard: [80, 30] };
function p(title, category, difficulty, tags, statement, constraints, examplesText, hints, sampleTests, hiddenTests) {
  const [xpReward, coinReward] = REWARD[difficulty];
  return { title, category, difficulty, tags, statement, constraints, examplesText, hints, xpReward, coinReward, sampleTests, hiddenTests };
}

const PROBLEMS = [

p("0/1 Knapsack Problem", "Dynamic Programming", "Medium", ["Dynamic Programming"],
  "Given n items, each with a weight and a value, and a knapsack of capacity W, find the maximum total value obtainable by choosing a subset of items (each item taken whole or not at all) whose total weight doesn't exceed W.",
  "1 <= n <= 1000, 1 <= W <= 10^4",
  "Input:\n3\n10 20 30\n60 100 120\n50\nOutput:\n220",
  ["dp[i][w] = best value using the first i items with capacity w.", "For each item, either skip it (dp[i-1][w]) or take it (dp[i-1][w-weight] + value, if it fits) - take the better of the two."],
  [{ input: "3\n10 20 30\n60 100 120\n50", expectedOutput: "220", explanation: "" },
   { input: "3\n1 2 3\n10 15 40\n6", expectedOutput: "65", explanation: "" }],
  [{ input: "1\n5\n10\n5", expectedOutput: "10", points: 1 },
   { input: "1\n5\n10\n4", expectedOutput: "0", points: 1 },
   { input: "4\n1 3 4 5\n1 4 5 7\n7", expectedOutput: "9", points: 1 }]),

p("Coin Change - Minimum Number of Coins", "Dynamic Programming", "Medium", ["Dynamic Programming"],
  "Given n coin denominations (unlimited supply of each) and a target amount, find the minimum number of coins needed to make exactly that amount, or print -1 if it can't be made.",
  "1 <= n <= 100, 0 <= amount <= 10^5",
  "Input:\n3\n1 2 5\n11\nOutput:\n3",
  ["dp[a] = minimum coins to make amount a; dp[0] = 0.", "For each amount a, try every coin c <= a: dp[a] = min(dp[a], dp[a-c] + 1)."],
  [{ input: "3\n1 2 5\n11", expectedOutput: "3", explanation: "" },
   { input: "1\n2\n3", expectedOutput: "-1", explanation: "" }],
  [{ input: "1\n1\n0", expectedOutput: "0", points: 1 },
   { input: "1\n1\n5", expectedOutput: "5", points: 1 },
   { input: "4\n1 5 10 25\n30", expectedOutput: "2", points: 1 }]),

p("Coin Change - Count Number of Ways", "Dynamic Programming", "Medium", ["Dynamic Programming"],
  "Given n coin denominations (unlimited supply of each) and a target amount, count the number of distinct ways (as multisets of coins - order doesn't create a new way) to make exactly that amount.",
  "1 <= n <= 100, 0 <= amount <= 10^5",
  "Input:\n3\n1 2 3\n4\nOutput:\n4",
  ["dp[a] = number of ways to make amount a; dp[0] = 1 (one way: use no coins).", "Process one coin denomination at a time, updating dp[a] += dp[a - coin] for every a >= coin, in increasing order of a - this ordering is what prevents counting the same combination multiple times in different orders."],
  [{ input: "3\n1 2 3\n4", expectedOutput: "4", explanation: "" },
   { input: "4\n2 3 5 6\n10", expectedOutput: "5", explanation: "" }],
  [{ input: "1\n1\n0", expectedOutput: "1", points: 1 },
   { input: "1\n2\n3", expectedOutput: "0", points: 1 },
   { input: "2\n1 2\n4", expectedOutput: "3", points: 1 }]),

p("Longest Increasing Subsequence", "Dynamic Programming", "Medium", ["Dynamic Programming", "Binary Search"],
  "Given an array of n integers, find the length of its longest strictly increasing subsequence.",
  "1 <= n <= 10^5",
  "Input:\n8\n10 9 2 5 3 7 101 18\nOutput:\n4",
  ["dp[i] = length of the longest increasing subsequence ending exactly at index i; dp[i] = 1 + max(dp[j]) over all j < i with arr[j] < arr[i].", "An O(n log n) approach maintains a list of 'smallest tail value for each achievable LIS length', updated with binary search per element."],
  [{ input: "8\n10 9 2 5 3 7 101 18", expectedOutput: "4", explanation: "" },
   { input: "6\n0 1 0 3 2 3", expectedOutput: "4", explanation: "" }],
  [{ input: "1\n5", expectedOutput: "1", points: 1 },
   { input: "5\n5 4 3 2 1", expectedOutput: "1", points: 1 },
   { input: "5\n1 2 3 4 5", expectedOutput: "5", points: 1 }]),

p("Longest Common Substring", "Dynamic Programming", "Medium", ["Dynamic Programming", "String"],
  "Given two strings, find the length of their longest common substring - a contiguous run of characters (not just any subsequence) that appears in both.",
  "1 <= |s1|, |s2| <= 2000",
  "Input:\nABABC\nBABCA\nOutput:\n4",
  ["dp[i][j] = length of the common substring ending exactly at s1[i-1] and s2[j-1].", "If s1[i-1] == s2[j-1], dp[i][j] = dp[i-1][j-1] + 1; otherwise dp[i][j] = 0 (unlike LCS, a mismatch resets the run to zero rather than carrying over the best-so-far)."],
  [{ input: "ABABC\nBABCA", expectedOutput: "4", explanation: "" },
   { input: "abc\ndef", expectedOutput: "0", explanation: "" }],
  [{ input: "abc\nabc", expectedOutput: "3", points: 1 },
   { input: "a\na", expectedOutput: "1", points: 1 },
   { input: "abcdxyz\nxyzabcd", expectedOutput: "4", points: 1 }]),

p("Matrix Chain Multiplication - Minimum Cost", "Dynamic Programming", "Hard", ["Dynamic Programming"],
  "Given n matrices to multiply together in a fixed order, described by n+1 dimensions (matrix i has size dims[i-1] x dims[i]), find the minimum total number of scalar multiplications needed, choosing the best order to parenthesize the multiplications.",
  "1 <= n <= 500",
  "Input:\n4\n40 20 30 10 30\nOutput:\n26000",
  ["dp[i][j] = minimum cost to multiply the chain of matrices from i to j.", "Try every split point k between i and j: dp[i][j] = min over k of dp[i][k] + dp[k+1][j] + dims[i-1]*dims[k]*dims[j]."],
  [{ input: "4\n40 20 30 10 30", expectedOutput: "26000", explanation: "" },
   { input: "2\n10 20 30", expectedOutput: "6000", explanation: "" }],
  [{ input: "1\n5 10", expectedOutput: "0", points: 1 },
   { input: "3\n1 2 3 4", expectedOutput: "18", points: 1 },
   { input: "4\n10 20 30 40 30", expectedOutput: "30000", points: 1 }]),

p("Minimum Cost Path in a Grid", "Dynamic Programming", "Medium", ["Dynamic Programming", "Matrix"],
  "Given a grid of costs, find the minimum total cost to travel from the top-left cell to the bottom-right cell, where a move can go right, down, or diagonally down-right, and the cost of a path is the sum of the costs of every cell visited, including the start and end.",
  "1 <= rows, cols <= 1000",
  "Input:\n3 3\n1 2 3\n4 8 2\n1 5 3\nOutput:\n8",
  ["dp[i][j] = minimum cost to reach cell (i,j) from (0,0).", "dp[i][j] = grid[i][j] + min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]), treating any position outside the grid as infinitely costly."],
  [{ input: "3 3\n1 2 3\n4 8 2\n1 5 3", expectedOutput: "8", explanation: "" },
   { input: "2 2\n1 1\n1 1", expectedOutput: "2", explanation: "" }],
  [{ input: "1 1\n5", expectedOutput: "5", points: 1 },
   { input: "2 2\n1 2\n3 4", expectedOutput: "5", points: 1 },
   { input: "2 2\n1 3\n2 1", expectedOutput: "2", points: 1 }]),

p("Egg Dropping Problem", "Dynamic Programming", "Hard", ["Dynamic Programming"],
  "Given a number of identical eggs and a number of floors in a building, find the minimum number of egg drops needed, in the worst case, to determine the exact floor below which eggs never break and at or above which they always do (assume such a threshold floor exists).",
  "1 <= eggs <= 30, 1 <= floors <= 200",
  "Input:\n2\n10\nOutput:\n4",
  ["dp[e][f] = minimum trials needed with e eggs and f floors.", "Trying a drop from floor x splits into two cases: the egg breaks (recurse with e-1 eggs, x-1 floors below) or it doesn't (recurse with e eggs, f-x floors above) - take the worse of the two plus 1, then pick x to minimize that."],
  [{ input: "2\n10", expectedOutput: "4", explanation: "" },
   { input: "1\n10", expectedOutput: "10", explanation: "With only 1 egg you can't risk breaking it early, so you must test floors one at a time." }],
  [{ input: "5\n1", expectedOutput: "1", points: 1 },
   { input: "1\n1", expectedOutput: "1", points: 1 },
   { input: "2\n36", expectedOutput: "8", points: 1 }]),

p("Partition a Set Into Two Subsets With Minimum Difference of Sums", "Dynamic Programming", "Medium", ["Dynamic Programming"],
  "Given an array of n non-negative integers, split it into two subsets (every element goes to exactly one subset) so as to minimize the absolute difference between the two subsets' sums. Print that minimum difference.",
  "1 <= n <= 1000",
  "Input:\n4\n1 6 11 5\nOutput:\n1",
  ["Compute every achievable subset sum up to half of the total (a 0/1 knapsack-style boolean DP works well here).", "The best split pairs the achievable subset sum closest to totalSum/2 with the rest - the answer is totalSum minus twice that closest sum."],
  [{ input: "4\n1 6 11 5", expectedOutput: "1", explanation: "" },
   { input: "5\n3 1 4 2 2", expectedOutput: "0", explanation: "" }],
  [{ input: "1\n5", expectedOutput: "5", points: 1 },
   { input: "2\n1 1", expectedOutput: "0", points: 1 },
   { input: "4\n1 2 3 9", expectedOutput: "3", points: 1 }]),

p("Rod Cutting Problem", "Dynamic Programming", "Medium", ["Dynamic Programming"],
  "Given a rod of length n and a price list where price[i] is the price of a piece of length i (1-indexed, i from 1 to n), find the maximum total profit obtainable by cutting the rod into pieces (any number of pieces, including zero cuts) and selling each piece.",
  "1 <= n <= 1000",
  "Input:\n8\n1 5 8 9 10 17 17 20\nOutput:\n22",
  ["dp[len] = maximum profit obtainable from a rod of length len.", "dp[len] = max over every piece length i from 1 to len of (price[i] + dp[len-i])."],
  [{ input: "8\n1 5 8 9 10 17 17 20", expectedOutput: "22", explanation: "" },
   { input: "4\n3 5 8 9", expectedOutput: "12", explanation: "Cutting into four length-1 pieces (3 each) beats keeping it whole." }],
  [{ input: "1\n5", expectedOutput: "5", points: 1 },
   { input: "2\n1 2", expectedOutput: "2", points: 1 },
   { input: "5\n2 5 7 8 10", expectedOutput: "12", points: 1 }]),

p("Maximum Size Square Sub-Matrix With All 1s", "Dynamic Programming", "Medium", ["Dynamic Programming", "Matrix"],
  "Given a binary matrix, find the area of the largest square sub-matrix consisting entirely of 1s.",
  "1 <= rows, cols <= 1000",
  "Input:\n6 5\n0 1 1 0 1\n1 1 0 1 0\n0 1 1 1 0\n1 1 1 1 0\n1 1 1 1 1\n0 0 0 0 0\nOutput:\n9",
  ["dp[i][j] = side length of the largest all-1s square whose bottom-right corner is at (i,j).", "If the current cell is 1, dp[i][j] = 1 + min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]); otherwise dp[i][j] = 0. The answer is the square of the maximum dp value found."],
  [{ input: "6 5\n0 1 1 0 1\n1 1 0 1 0\n0 1 1 1 0\n1 1 1 1 0\n1 1 1 1 1\n0 0 0 0 0", expectedOutput: "9", explanation: "" },
   { input: "2 2\n1 1\n1 1", expectedOutput: "4", explanation: "" }],
  [{ input: "1 1\n0", expectedOutput: "0", points: 1 },
   { input: "1 1\n1", expectedOutput: "1", points: 1 },
   { input: "2 2\n1 0\n0 1", expectedOutput: "1", points: 1 }]),

p("Climbing Stairs - Count Ways", "Dynamic Programming", "Easy", ["Dynamic Programming"],
  "Given a staircase with n steps, and being able to climb either 1 or 2 steps at a time, count the number of distinct ways to reach the top.",
  "1 <= n <= 45",
  "Input:\n3\nOutput:\n3",
  ["ways(n) = ways(n-1) + ways(n-2) - the last move is either a single step from n-1, or a double step from n-2.", "This is exactly the Fibonacci sequence, just shifted, with ways(1) = 1 and ways(2) = 2 as the base cases."],
  [{ input: "3", expectedOutput: "3", explanation: "" },
   { input: "2", expectedOutput: "2", explanation: "" }],
  [{ input: "1", expectedOutput: "1", points: 1 },
   { input: "4", expectedOutput: "5", points: 1 },
   { input: "5", expectedOutput: "8", points: 1 }]),

p("Longest Bitonic Subsequence", "Dynamic Programming", "Medium", ["Dynamic Programming"],
  "Given an array of n integers, find the length of its longest bitonic subsequence - one that strictly increases and then strictly decreases (either the increasing part or the decreasing part may be empty, so a purely increasing or purely decreasing subsequence also qualifies).",
  "1 <= n <= 10^4",
  "Input:\n8\n1 11 2 10 4 5 2 1\nOutput:\n6",
  ["Compute inc[i] = length of the longest increasing subsequence ending at i, and dec[i] = length of the longest decreasing subsequence starting at i.", "The best bitonic sequence peaking at index i has length inc[i] + dec[i] - 1; take the maximum over all i."],
  [{ input: "8\n1 11 2 10 4 5 2 1", expectedOutput: "6", explanation: "" },
   { input: "6\n80 60 30 40 20 10", expectedOutput: "5", explanation: "" }],
  [{ input: "1\n5", expectedOutput: "1", points: 1 },
   { input: "3\n1 2 3", expectedOutput: "3", points: 1 },
   { input: "3\n3 2 1", expectedOutput: "3", points: 1 }]),

p("Shortest Common Supersequence Length", "Dynamic Programming", "Medium", ["Dynamic Programming", "String"],
  "Given two strings, find the length of the shortest string that has both of them as subsequences.",
  "1 <= |s1|, |s2| <= 1000",
  "Input:\nabac\ncab\nOutput:\n5",
  ["The shortest common supersequence's length equals |s1| + |s2| - LCS(s1, s2) - every character in their longest common subsequence only needs to appear once in the merged result.", "Compute the LCS length with the standard DP, then apply that formula directly."],
  [{ input: "abac\ncab", expectedOutput: "5", explanation: "" },
   { input: "geek\neke", expectedOutput: "5", explanation: "" }],
  [{ input: "a\na", expectedOutput: "1", points: 1 },
   { input: "a\nb", expectedOutput: "2", points: 1 },
   { input: "abc\nabc", expectedOutput: "3", points: 1 }]),

p("Wildcard Pattern Matching", "Dynamic Programming", "Hard", ["Dynamic Programming", "String"],
  "Given a text string and a pattern containing lowercase letters, '?' (matches exactly one character), and '*' (matches any sequence of characters, including an empty one), print 'Yes' if the pattern matches the entire text, otherwise 'No'.",
  "0 <= |text|, |pattern| <= 1000",
  "Input:\naa\na*\nOutput:\nYes",
  ["dp[i][j] = does pattern[0..j) match text[0..i)?", "A '*' at pattern[j-1] means dp[i][j] is true if dp[i][j-1] is true (using zero characters of text for this '*') or dp[i-1][j] is true (using one more character of text for this same '*')."],
  [{ input: "aa\na*", expectedOutput: "Yes", explanation: "" },
   { input: "cb\n?a", expectedOutput: "No", explanation: "" }],
  [{ input: "adceb\n*a*b", expectedOutput: "Yes", points: 1 },
   { input: "\n*", expectedOutput: "Yes", points: 1 },
   { input: "\n?", expectedOutput: "No", points: 1 }]),

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
console.log(`DYNAMIC PROGRAMMING topic: created ${created} problem(s), skipped ${skipped} already-existing.`);
