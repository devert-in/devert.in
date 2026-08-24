import admin from "firebase-admin";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(join(__dirname, "service-account.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// DSA-450-sheet ingestion, BACKTRACKING topic. Rows that are literal
// duplicates of problems already seeded elsewhere (permutations of a string,
// word-break feasibility) are skipped; the Knight's Tour and Tug-of-War rows
// don't have a clean single-value output and are skipped too.

const REWARD = { Easy: [30, 10], Medium: [50, 20], Hard: [80, 30] };
function p(title, category, difficulty, tags, statement, constraints, examplesText, hints, sampleTests, hiddenTests) {
  const [xpReward, coinReward] = REWARD[difficulty];
  return { title, category, difficulty, tags, statement, constraints, examplesText, hints, xpReward, coinReward, sampleTests, hiddenTests };
}

const PROBLEMS = [

p("N-Queens - Count Solutions", "Backtracking", "Hard", ["Backtracking"],
  "Given an integer n, find the number of distinct ways to place n queens on an n x n chessboard such that no two queens attack each other (no two share a row, column, or diagonal). Print that count.",
  "1 <= n <= 12",
  "Input:\n4\nOutput:\n2",
  ["Place queens one row at a time; for each row, try every column and skip any that's attacked by a previously placed queen.", "Track attacked columns and both diagonal directions with simple sets so each placement check is O(1)."],
  [{ input: "4", expectedOutput: "2", explanation: "" },
   { input: "1", expectedOutput: "1", explanation: "" }],
  [{ input: "2", expectedOutput: "0", points: 1 },
   { input: "3", expectedOutput: "0", points: 1 },
   { input: "5", expectedOutput: "10", points: 1 }]),

p("Rat in a Maze - Count Distinct Paths", "Backtracking", "Medium", ["Backtracking", "Matrix"],
  "A rat starts at the top-left cell of an n x n maze and must reach the bottom-right cell, moving only right or down, and only through cells marked 1 (cells marked 0 are blocked). Count the number of distinct such paths.",
  "1 <= n <= 100",
  "Input:\n4\n1 0 0 0\n1 1 0 1\n0 1 0 0\n1 1 1 1\nOutput:\n1",
  ["dp[i][j] = number of ways to reach cell (i,j) from (0,0), moving only right or down through open cells.", "dp[i][j] = 0 immediately if the cell itself is blocked; otherwise it's the sum of the ways from above and from the left."],
  [{ input: "4\n1 0 0 0\n1 1 0 1\n0 1 0 0\n1 1 1 1", expectedOutput: "1", explanation: "" },
   { input: "2\n1 1\n1 1", expectedOutput: "2", explanation: "" }],
  [{ input: "1\n1", expectedOutput: "1", points: 1 },
   { input: "2\n1 1\n1 0", expectedOutput: "0", points: 1 },
   { input: "3\n1 1 1\n1 1 1\n1 1 1", expectedOutput: "6", points: 1 }]),

p("Solve a Sudoku Puzzle", "Backtracking", "Hard", ["Backtracking", "Matrix"],
  "Given a 9x9 Sudoku grid with some cells filled in and the rest marked 0, solve it (fill every cell 1-9 so each row, column, and 3x3 box contains every digit exactly once) and print the completed grid, one row per line, space-separated. Every puzzle given has exactly one solution.",
  "The grid is always 9x9 and always has exactly one valid solution.",
  "Input:\n3 0 6 5 0 8 4 0 0\n5 2 0 0 0 0 0 0 0\n0 8 7 0 0 0 0 3 1\n0 0 3 0 1 0 0 8 0\n9 0 0 8 6 3 0 0 5\n0 5 0 0 9 0 6 0 0\n1 3 0 0 0 0 2 5 0\n0 0 0 0 0 0 0 7 4\n0 0 5 2 0 6 3 0 0\nOutput:\n3 1 6 5 7 8 4 9 2\n5 2 9 1 3 4 7 6 8\n4 8 7 6 2 9 5 3 1\n2 6 3 4 1 5 9 8 7\n9 7 4 8 6 3 1 2 5\n8 5 1 7 9 2 6 4 3\n1 3 8 9 4 7 2 5 6\n6 9 2 3 5 1 8 7 4\n7 4 5 2 8 6 3 1 9",
  ["Find an empty cell, try digits 1-9, and recurse only into choices that don't immediately violate the row/column/box constraint.", "Backtrack (undo the digit and try the next one) whenever a choice leads to a dead end further in."],
  [{ input: "3 0 6 5 0 8 4 0 0\n5 2 0 0 0 0 0 0 0\n0 8 7 0 0 0 0 3 1\n0 0 3 0 1 0 0 8 0\n9 0 0 8 6 3 0 0 5\n0 5 0 0 9 0 6 0 0\n1 3 0 0 0 0 2 5 0\n0 0 0 0 0 0 0 7 4\n0 0 5 2 0 6 3 0 0", expectedOutput: "3 1 6 5 7 8 4 9 2\n5 2 9 1 3 4 7 6 8\n4 8 7 6 2 9 5 3 1\n2 6 3 4 1 5 9 8 7\n9 7 4 8 6 3 1 2 5\n8 5 1 7 9 2 6 4 3\n1 3 8 9 4 7 2 5 6\n6 9 2 3 5 1 8 7 4\n7 4 5 2 8 6 3 1 9", explanation: "" },
   { input: "1 2 3 4 5 6 7 8 9\n4 5 6 7 8 9 1 2 3\n7 8 9 1 2 3 4 5 6\n2 3 4 5 6 7 8 9 1\n5 6 7 8 9 1 2 3 4\n8 9 1 2 3 4 5 6 7\n3 4 5 6 7 8 9 1 2\n6 7 8 9 1 2 3 4 5\n9 1 2 3 4 5 6 7 8", expectedOutput: "1 2 3 4 5 6 7 8 9\n4 5 6 7 8 9 1 2 3\n7 8 9 1 2 3 4 5 6\n2 3 4 5 6 7 8 9 1\n5 6 7 8 9 1 2 3 4\n8 9 1 2 3 4 5 6 7\n3 4 5 6 7 8 9 1 2\n6 7 8 9 1 2 3 4 5\n9 1 2 3 4 5 6 7 8", explanation: "An already-complete grid should be returned unchanged." }],
  [{ input: "0 2 3 4 5 6 7 8 9\n4 5 6 7 8 9 1 2 3\n7 8 9 1 2 3 4 5 6\n2 3 4 5 6 7 8 9 1\n5 6 7 8 9 1 2 3 4\n8 9 1 2 3 4 5 6 7\n3 4 5 6 7 8 9 1 2\n6 7 8 9 1 2 3 4 5\n9 1 2 3 4 5 6 7 8", expectedOutput: "1 2 3 4 5 6 7 8 9\n4 5 6 7 8 9 1 2 3\n7 8 9 1 2 3 4 5 6\n2 3 4 5 6 7 8 9 1\n5 6 7 8 9 1 2 3 4\n8 9 1 2 3 4 5 6 7\n3 4 5 6 7 8 9 1 2\n6 7 8 9 1 2 3 4 5\n9 1 2 3 4 5 6 7 8", points: 1 }]),

p("M-Coloring Problem", "Backtracking", "Medium", ["Backtracking", "Graph"],
  "Given an undirected graph with n vertices (0-indexed) and m edges, and a number of available colors k, print 'Yes' if the graph's vertices can be colored using at most k colors such that no two vertices connected by an edge share a color, otherwise print 'No'.",
  "1 <= n <= 20, 0 <= m <= n*(n-1)/2",
  "Input:\n4\n5\n0 1\n0 2\n0 3\n1 2\n2 3\n3\nOutput:\nYes",
  ["Try coloring vertices one at a time (in order 0..n-1); for each vertex, try every color 1..k that isn't already used by an adjacent, already-colored vertex.", "Backtrack if a vertex has no valid color left to try, and stop as soon as any full valid coloring is found."],
  [{ input: "4\n5\n0 1\n0 2\n0 3\n1 2\n2 3\n3", expectedOutput: "Yes", explanation: "" },
   { input: "4\n6\n0 1\n0 2\n0 3\n1 2\n1 3\n2 3\n3", expectedOutput: "No", explanation: "K4 needs 4 colors." }],
  [{ input: "1\n0\n1", expectedOutput: "Yes", points: 1 },
   { input: "2\n1\n0 1\n1", expectedOutput: "No", points: 1 },
   { input: "3\n3\n0 1\n1 2\n2 0\n2", expectedOutput: "No", points: 1 }]),

p("Subset Sum Problem", "Backtracking", "Medium", ["Backtracking", "Dynamic Programming"],
  "Given an array of n non-negative integers and a target sum, print 'Yes' if some subset of the array's elements (possibly empty, possibly all of it) adds up to exactly the target, otherwise print 'No'.",
  "1 <= n <= 1000, 0 <= target <= 10^5",
  "Input:\n6\n3 34 4 12 5 2\n9\nOutput:\nYes",
  ["Try including or excluding each element in turn, pruning branches where the running sum already exceeds the target.", "dp[i][s] = 'can the first i elements form sum s' also solves this without recursion."],
  [{ input: "6\n3 34 4 12 5 2\n9", expectedOutput: "Yes", explanation: "4 + 5 = 9." },
   { input: "6\n3 34 4 12 5 2\n30", expectedOutput: "No", explanation: "" }],
  [{ input: "1\n1\n1", expectedOutput: "Yes", points: 1 },
   { input: "1\n1\n0", expectedOutput: "Yes", points: 1 },
   { input: "3\n5 10 15\n100", expectedOutput: "No", points: 1 }]),

p("Combination Sum - Count Combinations", "Backtracking", "Medium", ["Backtracking"],
  "Given n distinct positive integers (candidates, each usable an unlimited number of times) and a target, count the number of distinct combinations (as multisets - order doesn't create a new combination) of candidates that sum exactly to the target.",
  "1 <= n <= 20, 1 <= target <= 100",
  "Input:\n4\n2 3 6 7\n7\nOutput:\n2",
  ["To avoid counting the same multiset twice, only ever pick candidates in non-decreasing order relative to the last one chosen.", "Recurse by either using the current candidate again (reducing the remaining target) or moving on to the next candidate."],
  [{ input: "4\n2 3 6 7\n7", expectedOutput: "2", explanation: "[7] and [2,2,3]." },
   { input: "3\n2 3 5\n8", expectedOutput: "3", explanation: "" }],
  [{ input: "1\n2\n1", expectedOutput: "0", points: 1 },
   { input: "1\n1\n3", expectedOutput: "1", points: 1 },
   { input: "2\n2 4\n8", expectedOutput: "3", points: 1 }]),

p("Maximum Number Possible With At Most K Swaps", "Backtracking", "Medium", ["Backtracking"],
  "Given a number as a string of digits and an integer k, find the largest possible number obtainable by performing at most k swaps, where each swap exchanges the digits at any two positions.",
  "1 <= number of digits <= 8, 0 <= k <= 5",
  "Input:\n254\n1\nOutput:\n524",
  ["At each of the k swaps, try swapping the current best position with every digit to its right that's larger, and recurse - backtrack (undo the swap) after exploring it.", "Prune: if a position already holds the maximum remaining digit, no swap involving it can help."],
  [{ input: "254\n1", expectedOutput: "524", explanation: "" },
   { input: "1234\n1", expectedOutput: "4231", explanation: "" }],
  [{ input: "9973\n0", expectedOutput: "9973", points: 1 },
   { input: "1\n5", expectedOutput: "1", points: 1 },
   { input: "7899\n1", expectedOutput: "9897", points: 1 }]),

p("Count Palindromic Partitions of a String", "Backtracking", "Medium", ["Backtracking", "Dynamic Programming"],
  "Given a string s, count the number of distinct ways to partition it into one or more contiguous substrings such that every substring is a palindrome.",
  "1 <= |s| <= 200",
  "Input:\naab\nOutput:\n2",
  ["Try every possible first cut, but only recurse into it if the piece before the cut is itself a palindrome.", "Precomputing which substrings are palindromes with a DP table avoids re-checking the same range repeatedly."],
  [{ input: "aab", expectedOutput: "2", explanation: "[a,a,b] and [aa,b]." },
   { input: "aaa", expectedOutput: "4", explanation: "" }],
  [{ input: "a", expectedOutput: "1", points: 1 },
   { input: "ab", expectedOutput: "1", points: 1 },
   { input: "abc", expectedOutput: "1", points: 1 }]),

p("Generate All Valid Parentheses Combinations", "Backtracking", "Medium", ["Backtracking"],
  "Given n, generate every string of n pairs of balanced, well-formed parentheses. Print them sorted in ascending alphabetical order, space-separated on one line. If n is 0, print 'EMPTY' (the only valid string is the empty string).",
  "0 <= n <= 8",
  "Input:\n2\nOutput:\n(()) ()()",
  ["Build the string left to right, tracking how many '(' and ')' have been placed so far.", "You may place '(' whenever fewer than n have been used; you may place ')' only when fewer ')' than '(' have been placed so far."],
  [{ input: "2", expectedOutput: "(()) ()()", explanation: "" },
   { input: "1", expectedOutput: "()", explanation: "" }],
  [{ input: "0", expectedOutput: "EMPTY", points: 1 },
   { input: "3", expectedOutput: "((())) (()()) (())() ()(()) ()()()", points: 1 },
   { input: "2", expectedOutput: "(()) ()()", points: 1 }]),

p("Word Break - Count All Ways", "Backtracking", "Hard", ["Backtracking", "Dynamic Programming"],
  "Given a string s and a dictionary of words (space-separated on the second input line, each reusable any number of times), count the number of distinct ways to segment s into a sequence of dictionary words.",
  "1 <= |s| <= 200, 1 <= number of dictionary words <= 500",
  "Input:\ncatsanddog\ncat cats and sand dog\nOutput:\n2",
  ["Recursively try every dictionary word as a prefix of the remaining string, and recurse on what's left after removing it.", "Memoize on the starting index of the remaining substring to avoid exponential blow-up from overlapping subproblems."],
  [{ input: "catsanddog\ncat cats and sand dog", expectedOutput: "2", explanation: "" },
   { input: "aa\na aa", expectedOutput: "2", explanation: "[a,a] and [aa]." }],
  [{ input: "a\na", expectedOutput: "1", points: 1 },
   { input: "ab\na", expectedOutput: "0", points: 1 },
   { input: "aaa\na aa", expectedOutput: "3", points: 1 }]),

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
console.log(`BACKTRACKING topic: created ${created} problem(s), skipped ${skipped} already-existing.`);
