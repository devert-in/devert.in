import admin from "firebase-admin";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(join(__dirname, "service-account.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// DSA-450-sheet ingestion, BACKTRACKING topic, PART 2 - closing the real gap
// against the sheet's verbatim row list. Rows skipped as already genuinely
// covered by problems seeded in part 1 (seed-dsa-backtracking-problems.mjs):
// "Rat in a maze Problem", "Word Break Problem using Backtracking",
// "Sudoku Solver", "m Coloring Problem", "Subset Sum Problem",
// "Find Maximum number possible by doing at-most K swaps", and
// "Combinational Sum" (the existing count-variant already exercises the
// same backtracking technique on the same input shape; the sheet row for
// this one carries no "print all" qualifier, unlike the two below).
// "Print all permutations of a string" is skipped as a confirmed duplicate
// of "Print All Permutations of a String" already seeded under Strings.
// "The Knight's tour problem" is skipped: no variant of it has a single,
// unambiguous, easily hand-verifiable expected output (the natural
// board-of-move-numbers output isn't unique per input, and a rigorous
// existence check has enough edge-case subtlety that it can't be hand
// verified with confidence here) - same call the part-1 script already
// made and documented.
//
// Two rows ("Printing all solutions in N-Queen Problem" and "Print all
// palindromic partitions of a string") explicitly say "print(ing) all",
// which the existing count-only siblings do NOT satisfy - those get
// genuine new "print all" problems below.

const REWARD = { Easy: [30, 10], Medium: [50, 20], Hard: [80, 30] };
function p(title, category, difficulty, tags, statement, constraints, examplesText, hints, sampleTests, hiddenTests) {
  const [xpReward, coinReward] = REWARD[difficulty];
  return { title, category, difficulty, tags, statement, constraints, examplesText, hints, xpReward, coinReward, sampleTests, hiddenTests };
}

const PROBLEMS = [

p("Print All N-Queens Solutions", "Backtracking", "Hard", ["Backtracking"],
  "Given an integer n, find every distinct way to place n queens on an n x n chessboard such that no two queens attack each other (no two share a row, column, or diagonal). Represent each solution as the column positions (1-indexed) of the queen in row 1, row 2, ..., row n, in that order. Print every solution on its own line as space-separated column positions, with solutions ordered by that sequence (compare left to right, smaller first). If no solution exists, print 'NONE'.",
  "1 <= n <= 9",
  "Input:\n4\nOutput:\n2 4 1 3\n3 1 4 2",
  ["Place queens one row at a time, trying every column in ascending order and skipping any that's attacked by a previously placed queen - trying columns in order naturally produces solutions already sorted.", "Track attacked columns and both diagonal directions with simple sets so each placement check is O(1); backtrack (unplace the queen) after fully exploring a branch."],
  [{ input: "4", expectedOutput: "2 4 1 3\n3 1 4 2", explanation: "" },
   { input: "1", expectedOutput: "1", explanation: "" }],
  [{ input: "2", expectedOutput: "NONE", points: 1 },
   { input: "6", expectedOutput: "2 4 6 1 3 5\n3 6 2 5 1 4\n4 1 5 2 6 3\n5 3 1 6 4 2", points: 1 },
   { input: "5", expectedOutput: "1 3 5 2 4\n1 4 2 5 3\n2 4 1 3 5\n2 5 3 1 4\n3 1 4 2 5\n3 5 2 4 1\n4 1 3 5 2\n4 2 5 3 1\n5 2 4 1 3\n5 3 1 4 2", points: 1 }]),

p("Remove Invalid Parentheses", "Backtracking", "Hard", ["Backtracking", "Strings"],
  "Given a string s made of lowercase English letters and the characters '(' and ')', remove the minimum number of parentheses so the result is a valid (balanced) sequence of parentheses. Print every distinct string obtainable by such a minimum removal, sorted lexicographically and space-separated on one line. If the only such string is the empty string, print 'EMPTY'.",
  "1 <= |s| <= 20",
  "Input:\n()())()\nOutput:\n(())() ()()()",
  ["A string is valid if, scanning left to right, the running count of '(' minus ')' never goes negative and finishes at exactly zero.", "Search level by level: start from s itself, and if nothing at the current level is valid, build the next level by deleting one more parenthesis character (every way) from each string in the current level - the first level containing any valid string gives exactly the minimum-removal answers."],
  [{ input: "()())()", expectedOutput: "(())() ()()()", explanation: "" },
   { input: "()", expectedOutput: "()", explanation: "Already valid, so nothing needs removing." }],
  [{ input: ")(", expectedOutput: "EMPTY", points: 1 },
   { input: "(()", expectedOutput: "()", points: 1 },
   { input: "(a)())()", expectedOutput: "(a())() (a)()()", points: 1 }]),

p("Print All Palindromic Partitions of a String", "Backtracking", "Medium", ["Backtracking", "Strings"],
  "Given a string s, print every way to partition it into one or more contiguous substrings such that every substring is a palindrome. Print each partition on its own line, as its substrings in order separated by single spaces. Generate partitions by trying the shortest valid palindromic prefix first at every step (this also fixes the order the partitions are printed in, matching the example).",
  "1 <= |s| <= 15",
  "Input:\naab\nOutput:\na a b\naa b",
  ["Try every possible first cut, but only recurse into it if the piece before the cut is itself a palindrome; move on to the next candidate cut afterward.", "Keep a running list of the pieces chosen so far - push before recursing, pop after - that's what produces each full partition, one leaf of the recursion tree at a time."],
  [{ input: "aab", expectedOutput: "a a b\naa b", explanation: "" },
   { input: "a", expectedOutput: "a", explanation: "" }],
  [{ input: "aaa", expectedOutput: "a a a\na aa\naa a\naaa", points: 1 },
   { input: "ab", expectedOutput: "a b", points: 1 },
   { input: "abc", expectedOutput: "a b c", points: 1 }]),

p("Tug of War", "Backtracking", "Medium", ["Backtracking"],
  "Given an array of n integers, divide all of them into two subsets such that the subset sizes differ by at most 1 (if n is even, both subsets have n/2 elements; if n is odd, one has floor(n/2) and the other ceil(n/2)) and the absolute difference between the two subsets' sums is as small as possible. Print that minimum possible difference.",
  "1 <= n <= 20, -1000 <= arr[i] <= 1000",
  "Input:\n4\n4 9 2 7\nOutput:\n0",
  ["Fix the target size of one subset as floor(n/2), then try including or excluding each element for that subset in turn, tracking how many elements and what sum have been committed to it so far.", "Prune eagerly: stop growing a branch once that subset already has floor(n/2) elements, or once too few elements remain to ever reach that count."],
  [{ input: "4\n4 9 2 7", expectedOutput: "0", explanation: "{9,2} and {4,7} both sum to 11." },
   { input: "2\n5 5", expectedOutput: "0", explanation: "" }],
  [{ input: "11\n23 45 -34 12 0 98 -99 4 189 -1 4", expectedOutput: "1", points: 1 },
   { input: "3\n1 2 3", expectedOutput: "0", points: 1 },
   { input: "1\n10", expectedOutput: "10", points: 1 }]),

p("Find Shortest Safe Route in a Path With Landmines", "Backtracking", "Medium", ["Backtracking", "Matrix"],
  "Given an n x m grid where each cell is 1 (safe) or 0 (a landmine), find the length, in cells visited (including both endpoints), of the shortest route from any safe cell in the first column to any safe cell in the last column, moving only up, down, left, or right one cell at a time. A landmine cell and every cell adjacent to it (up, down, left, right) are unsafe and can never be stepped on, including cells in the first or last column. Print -1 if no safe route exists.",
  "1 <= n, m <= 50",
  "Input:\n4\n4\n1 1 1 1\n1 0 1 1\n1 1 1 1\n1 1 1 1\nOutput:\n4",
  ["First mark every landmine cell and its up/down/left/right neighbors as unsafe (a cell can end up unsafe for more than one reason).", "Run a multi-source BFS starting from every safe cell in column 0 at once, and stop at the first safe cell reached in the last column - BFS explores in order of distance, so that's automatically the shortest."],
  [{ input: "2\n2\n1 1\n1 1", expectedOutput: "2", explanation: "" },
   { input: "3\n3\n1 1 1\n1 1 1\n1 1 1", expectedOutput: "3", explanation: "" }],
  [{ input: "2\n2\n1 0\n0 1", expectedOutput: "-1", points: 1 },
   { input: "4\n4\n1 1 1 1\n1 0 1 1\n1 1 1 1\n1 1 1 1", expectedOutput: "4", points: 1 },
   { input: "3\n5\n1 1 1 1 1\n1 1 0 1 1\n1 1 1 1 1", expectedOutput: "-1", points: 1 }]),

p("Path of More Than K Length From a Source", "Backtracking", "Medium", ["Backtracking", "Graph"],
  "Given an undirected weighted graph with n vertices (0-indexed) and m edges, a source vertex, and an integer k, print 'Yes' if there exists a simple path (no vertex repeated) starting at the source whose total edge weight is strictly more than k, otherwise print 'No'.",
  "1 <= n <= 15, 0 <= m <= n*(n-1)/2, 1 <= edge weight <= 100, 0 <= k <= 10^4",
  "Input:\n4\n3\n0 1 1\n1 2 1\n2 3 1\n0\n2\nOutput:\nYes",
  ["DFS from the source, tracking the running weight sum and a visited set so no vertex is reused on the current path; the moment the running sum exceeds k, stop and print 'Yes'.", "Backtrack (unmark the vertex as visited) when a DFS call returns, so other branches can still use that vertex on a different path."],
  [{ input: "4\n3\n0 1 1\n1 2 1\n2 3 1\n0\n2", expectedOutput: "Yes", explanation: "Path 0-1-2-3 has weight 3 > 2." },
   { input: "4\n3\n0 1 1\n1 2 1\n2 3 1\n0\n3", expectedOutput: "No", explanation: "The longest simple path from 0 has weight exactly 3, not more than 3." }],
  [{ input: "2\n1\n0 1 5\n0\n5", expectedOutput: "No", points: 1 },
   { input: "6\n9\n0 1 4\n0 2 8\n1 2 2\n1 3 5\n2 3 5\n2 4 5\n3 4 2\n3 5 7\n4 5 3\n0\n20", expectedOutput: "Yes", points: 1 },
   { input: "6\n9\n0 1 4\n0 2 8\n1 2 2\n1 3 5\n2 3 5\n2 4 5\n3 4 2\n3 5 7\n4 5 3\n0\n28", expectedOutput: "No", points: 1 }]),

p("Longest Possible Route in a Matrix With Hurdles", "Backtracking", "Medium", ["Backtracking", "Matrix"],
  "Given an n x m grid where each cell is 1 (open) or 0 (a hurdle), and a source and destination cell (both guaranteed open), find the length, in moves, of the longest simple route from source to destination that moves only up, down, left, or right through open cells and never revisits a cell. Print -1 if the destination is unreachable.",
  "1 <= n, m <= 8",
  "Input:\n4\n4\n1 0 0 0\n1 1 1 1\n0 1 0 1\n1 1 1 1\n0 0\n3 3\nOutput:\n6",
  ["DFS/backtrack from the source: mark the current cell visited, try every open, unvisited neighbor, and record the maximum distance seen whenever a path reaches the destination.", "Unmark (backtrack) the current cell as unvisited before returning from the recursive call, so a different route can still pass through it."],
  [{ input: "2\n2\n1 1\n1 1\n0 0\n1 1", expectedOutput: "2", explanation: "" },
   { input: "4\n4\n1 0 0 0\n1 1 1 1\n0 1 0 1\n1 1 1 1\n0 0\n3 3", expectedOutput: "6", explanation: "" }],
  [{ input: "2\n2\n1 0\n0 1\n0 0\n1 1", expectedOutput: "-1", points: 1 },
   { input: "3\n3\n1 1 1\n1 1 1\n1 1 1\n0 0\n2 2", expectedOutput: "8", points: 1 },
   { input: "2\n2\n1 1\n0 1\n0 0\n1 1", expectedOutput: "2", points: 1 }]),

p("Print All Possible Paths From Top Left to Bottom Right of a Matrix", "Backtracking", "Medium", ["Backtracking", "Matrix"],
  "Given the dimensions n and m of a grid with every cell open (no obstacles), print every distinct path from the top-left cell to the bottom-right cell that moves only right or down, one cell at a time. Represent each path as a string of moves ('D' for down, 'R' for right), and print every path on its own line, sorted alphabetically. If n = m = 1 (start and end are the same cell), print 'EMPTY'.",
  "1 <= n, m <= 6",
  "Input:\n2\n3\nOutput:\nDRR\nRDR\nRRD",
  ["Recurse from the top-left cell: if you're not in the last row you may move down, and if you're not in the last column you may move right - trying down before right at each step is what makes the paths come out already in alphabetical order.", "Append the move, recurse, then pop it off before trying the sibling move - that backtracking step is what lets the same partial path be reused for the other continuation."],
  [{ input: "2\n3", expectedOutput: "DRR\nRDR\nRRD", explanation: "" },
   { input: "2\n2", expectedOutput: "DR\nRD", explanation: "" }],
  [{ input: "1\n1", expectedOutput: "EMPTY", points: 1 },
   { input: "1\n4", expectedOutput: "RRR", points: 1 },
   { input: "3\n3", expectedOutput: "DDRR\nDRDR\nDRRD\nRDDR\nRDRD\nRRDD", points: 1 }]),

p("Partition of a Set Into K Subsets With Equal Sum", "Backtracking", "Hard", ["Backtracking"],
  "Given an array of n positive integers and an integer k, print 'Yes' if the array can be partitioned into k non-empty subsets such that every subset has the same sum (every element must be used in exactly one subset), otherwise print 'No'.",
  "1 <= k <= n <= 16, 1 <= arr[i] <= 1000",
  "Input:\n7\n4 3 2 3 5 2 1\n4\nOutput:\nYes",
  ["The target sum per subset is (total sum) / k - if that isn't a whole number, or the largest element exceeds it, the answer is immediately 'No'.", "Fill one subset at a time up to the target sum before moving on to the next subset; skip elements already used, and skip any element that would push the current subset's running sum past the target."],
  [{ input: "7\n4 3 2 3 5 2 1\n4", expectedOutput: "Yes", explanation: "" },
   { input: "4\n1 2 3 4\n3", expectedOutput: "No", explanation: "Total sum 10 isn't divisible by 3." }],
  [{ input: "4\n1 1 1 1\n2", expectedOutput: "Yes", points: 1 },
   { input: "4\n1 1 1 1\n5", expectedOutput: "No", points: 1 },
   { input: "6\n2 1 4 5 3 3\n3", expectedOutput: "Yes", points: 1 }]),

p("Find the K-th Permutation Sequence", "Backtracking", "Medium", ["Backtracking", "Math"],
  "Given n and k, consider every permutation of the numbers 1 to n listed in ascending (lexicographic) order. Print the k-th permutation in that list, as a single string with no separators.",
  "1 <= n <= 9, 1 <= k <= n!",
  "Input:\n3\n3\nOutput:\n213",
  ["Exactly (n-1)! permutations share the same first digit, so (k-1) / (n-1)! tells you which remaining number to place first; the remainder carries forward the same way into every following digit.", "Keep the not-yet-placed numbers in a list and remove the chosen one by index at each step - the factorial arithmetic picks the correct branch directly, so no undo/backtrack step is actually needed."],
  [{ input: "3\n3", expectedOutput: "213", explanation: "" },
   { input: "3\n1", expectedOutput: "123", explanation: "" }],
  [{ input: "4\n9", expectedOutput: "2314", points: 1 },
   { input: "1\n1", expectedOutput: "1", points: 1 },
   { input: "3\n6", expectedOutput: "321", points: 1 }]),

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
console.log(`BACKTRACKING topic (part 2): created ${created} problem(s), skipped ${skipped} already-existing.`);
