import admin from "firebase-admin";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(join(__dirname, "service-account.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// Stage 1 DSA-450-sheet ingestion, MATRIX topic (10 sheet rows, all distinct).

const REWARD = { Easy: [30, 10], Medium: [50, 20], Hard: [80, 30] };
function p(title, category, difficulty, tags, statement, constraints, examplesText, hints, sampleTests, hiddenTests) {
  const [xpReward, coinReward] = REWARD[difficulty];
  return { title, category, difficulty, tags, statement, constraints, examplesText, hints, xpReward, coinReward, sampleTests, hiddenTests };
}

const PROBLEMS = [

p("Spiral Traversal of a Matrix", "Arrays", "Medium", ["Matrix"],
  "Given an r x c matrix, print all its elements in clockwise spiral order starting from the top-left corner, as a single space-separated line.",
  "1 <= r, c <= 100",
  "Input:\n3 3\n1 2 3\n4 5 6\n7 8 9\nOutput:\n1 2 3 6 9 8 7 4 5",
  ["Track four boundaries: top, bottom, left, right - shrink them inward after traversing each side.", "Traverse top row left-to-right, right column top-to-bottom, bottom row right-to-left, left column bottom-to-top, then repeat."],
  [{ input: "3 3\n1 2 3\n4 5 6\n7 8 9", expectedOutput: "1 2 3 6 9 8 7 4 5", explanation: "" },
   { input: "2 2\n1 2\n3 4", expectedOutput: "1 2 4 3", explanation: "" }],
  [{ input: "1 4\n1 2 3 4", expectedOutput: "1 2 3 4", points: 1 },
   { input: "4 1\n1\n2\n3\n4", expectedOutput: "1 2 3 4", points: 1 },
   { input: "3 4\n1 2 3 4\n5 6 7 8\n9 10 11 12", expectedOutput: "1 2 3 4 8 12 11 10 9 5", points: 1 }]),

p("Search an Element in a Row-Wise and Column-Wise Sorted Matrix", "Arrays", "Medium", ["Matrix", "Binary Search"],
  "Given an r x c matrix where each row is sorted ascending and the first element of every row is greater than the last element of the previous row, and a target value, print 'Yes' if the target exists in the matrix, otherwise 'No'.",
  "1 <= r, c <= 1000",
  "Input:\n3 4\n1 3 5 7\n10 11 16 20\n23 30 34 60\n3\nOutput:\nYes",
  ["Since the whole matrix reads like one big sorted array, you can binary search over it directly.", "Map a single index 0..(r*c-1) to row = index/c, col = index%c."],
  [{ input: "3 4\n1 3 5 7\n10 11 16 20\n23 30 34 60\n3", expectedOutput: "Yes", explanation: "" },
   { input: "3 4\n1 3 5 7\n10 11 16 20\n23 30 34 60\n13", expectedOutput: "No", explanation: "" }],
  [{ input: "1 1\n5\n5", expectedOutput: "Yes", points: 1 },
   { input: "1 1\n5\n1", expectedOutput: "No", points: 1 },
   { input: "2 2\n1 2\n3 4\n4", expectedOutput: "Yes", points: 1 }]),

p("Find Median in a Row-Wise Sorted Matrix", "Arrays", "Medium", ["Matrix", "Binary Search"],
  "Given an r x c matrix where every row is individually sorted ascending, find the median of all r*c elements combined. Print the median rounded to exactly one decimal place.",
  "1 <= r, c <= 400",
  "Input:\n3 3\n1 3 5\n2 6 9\n3 6 9\nOutput:\n5.0",
  ["Flattening and sorting all elements always works and is simple to reason about.", "For large inputs a binary search over the value range with a row-wise count is the efficient approach, but any correct method is accepted."],
  [{ input: "3 3\n1 3 5\n2 6 9\n3 6 9", expectedOutput: "5.0", explanation: "" },
   { input: "3 1\n1\n2\n3", expectedOutput: "2.0", explanation: "" }],
  [{ input: "1 1\n7", expectedOutput: "7.0", points: 1 },
   { input: "3 3\n1 1 1\n1 1 1\n1 1 1", expectedOutput: "1.0", points: 1 },
   { input: "1 4\n1 2 3 4", expectedOutput: "2.5", points: 1 }]),

p("Find the Row With Maximum Number of 1s", "Arrays", "Medium", ["Matrix", "Binary Search"],
  "Given an r x c binary matrix where every row's 1s are sorted after its 0s (each row is non-decreasing), find the 0-indexed row that contains the most 1s. If there's a tie, print the smallest such row index. If every row has zero 1s, print -1.",
  "1 <= r, c <= 1000",
  "Input:\n4 4\n0 0 0 1\n0 1 1 1\n1 1 1 1\n0 0 0 0\nOutput:\n2",
  ["Since each row is sorted, the count of 1s in a row is (row length - index of the first 1).", "You can binary search for the first 1 in each row instead of scanning linearly."],
  [{ input: "4 4\n0 0 0 1\n0 1 1 1\n1 1 1 1\n0 0 0 0", expectedOutput: "2", explanation: "" },
   { input: "2 2\n0 0\n0 0", expectedOutput: "-1", explanation: "" }],
  [{ input: "2 2\n1 1\n1 1", expectedOutput: "0", points: 1 },
   { input: "1 2\n0 1", expectedOutput: "0", points: 1 },
   { input: "3 3\n0 0 1\n0 1 1\n1 1 1", expectedOutput: "2", points: 1 }]),

p("Print Elements in Sorted Order Using a Row-and-Column-Wise Sorted Matrix", "Arrays", "Easy", ["Matrix", "Sorting"],
  "Given an r x c matrix, print all its elements in ascending sorted order, space-separated on one line.",
  "1 <= r, c <= 500",
  "Input:\n3 3\n1 5 9\n2 6 10\n3 7 11\nOutput:\n1 2 3 5 6 7 9 10 11",
  ["Flatten the matrix into a single list and sort it.", "A more advanced merge-based approach exists if the matrix is known to be row-and-column sorted, but a plain sort is always correct."],
  [{ input: "3 3\n1 5 9\n2 6 10\n3 7 11", expectedOutput: "1 2 3 5 6 7 9 10 11", explanation: "" },
   { input: "2 2\n1 3\n2 4", expectedOutput: "1 2 3 4", explanation: "" }],
  [{ input: "1 1\n5", expectedOutput: "5", points: 1 },
   { input: "2 2\n4 3\n2 1", expectedOutput: "1 2 3 4", points: 1 },
   { input: "3 1\n3\n1\n2", expectedOutput: "1 2 3", points: 1 }]),

p("Maximum Size Rectangle of 1s in a Binary Matrix", "Arrays", "Hard", ["Matrix", "Stack", "Dynamic Programming"],
  "Given a binary matrix, find the area of the largest rectangle made entirely of 1s. Print that area.",
  "1 <= r, c <= 200",
  "Input:\n4 4\n0 1 1 0\n1 1 1 1\n1 1 1 1\n1 1 0 0\nOutput:\n8",
  ["For each row, compute a 'height histogram' - how many consecutive 1s are stacked above (and including) this cell in its column.", "Run the 'largest rectangle in a histogram' algorithm (using a stack) on each row's histogram and track the overall best."],
  [{ input: "4 4\n0 1 1 0\n1 1 1 1\n1 1 1 1\n1 1 0 0", expectedOutput: "8", explanation: "" },
   { input: "1 1\n1", expectedOutput: "1", explanation: "" }],
  [{ input: "1 1\n0", expectedOutput: "0", points: 1 },
   { input: "2 2\n1 1\n1 1", expectedOutput: "4", points: 1 },
   { input: "1 4\n1 0 1 1", expectedOutput: "2", points: 1 }]),

p("Find a Specific Pair in a Matrix", "Arrays", "Hard", ["Matrix", "Dynamic Programming"],
  "Given an r x c matrix, find the maximum value of mat[c2][d2] - mat[a][b] over all choices of two cells (a,b) and (c2,d2) such that c2 >= a and d2 >= b (the second cell is on or below-and-right of the first). Print that maximum value.",
  "1 <= r, c <= 100",
  "Input:\n4 5\n1 2 -1 -4 -20\n-8 -3 4 2 1\n3 8 6 1 3\n-4 -1 1 7 -6\nOutput:\n18",
  ["Precompute, for each cell, the maximum value anywhere at or below-and-right of it.", "Scan cells in reverse (bottom-right to top-left) and use that precomputed max to evaluate the best difference ending there."],
  [{ input: "4 5\n1 2 -1 -4 -20\n-8 -3 4 2 1\n3 8 6 1 3\n-4 -1 1 7 -6", expectedOutput: "18", explanation: "" },
   { input: "1 1\n5", expectedOutput: "0", explanation: "Only one cell exists, so both corners must be it." }],
  [{ input: "2 2\n1 2\n3 4", expectedOutput: "3", points: 1 },
   { input: "2 2\n5 1\n1 5", expectedOutput: "4", points: 1 },
   { input: "1 3\n1 5 2", expectedOutput: "4", points: 1 }]),

p("Rotate a Matrix by 90 Degrees", "Arrays", "Medium", ["Matrix"],
  "Given an n x n matrix, rotate it 90 degrees clockwise in place. Print the rotated matrix, one row per line, space-separated.",
  "1 <= n <= 500",
  "Input:\n3\n1 2 3\n4 5 6\n7 8 9\nOutput:\n7 4 1\n8 5 2\n9 6 3",
  ["Transpose the matrix first (swap mat[i][j] with mat[j][i]).", "Then reverse each row - the combination of both gives a clockwise 90-degree rotation."],
  [{ input: "3\n1 2 3\n4 5 6\n7 8 9", expectedOutput: "7 4 1\n8 5 2\n9 6 3", explanation: "" },
   { input: "2\n1 2\n3 4", expectedOutput: "3 1\n4 2", explanation: "" }],
  [{ input: "1\n5", expectedOutput: "5", points: 1 },
   { input: "2\n1 1\n1 1", expectedOutput: "1 1\n1 1", points: 1 },
   { input: "3\n1 0 0\n0 1 0\n0 0 1", expectedOutput: "0 0 1\n0 1 0\n1 0 0", points: 1 }]),

p("Kth Smallest Element in a Row-Wise and Column-Wise Sorted Matrix", "Arrays", "Hard", ["Matrix", "Binary Search", "Heap"],
  "Given an n x n matrix where every row and every column is sorted ascending, and a value k, find the kth smallest element in the matrix (1-indexed). Print that value.",
  "1 <= n <= 300, 1 <= k <= n*n",
  "Input:\n4 7\n10 20 30 40\n15 25 35 45\n24 29 37 48\n32 33 39 50\nOutput:\n30",
  ["A min-heap seeded with the first element of every row, repeatedly popping the smallest and pushing its row-neighbor, finds the kth smallest efficiently.", "A simpler (if less efficient) approach: flatten, sort, and index directly - both are accepted."],
  [{ input: "4 7\n10 20 30 40\n15 25 35 45\n24 29 37 48\n32 33 39 50", expectedOutput: "30", explanation: "" },
   { input: "1 1\n5\n1", expectedOutput: "5", explanation: "" }],
  [{ input: "2 1\n1 2\n3 4", expectedOutput: "1", points: 1 },
   { input: "2 4\n1 2\n3 4", expectedOutput: "4", points: 1 },
   { input: "3 8\n1 5 9\n10 11 13\n12 13 15", expectedOutput: "13", points: 1 }]),

p("Common Elements in All Rows of a Matrix", "Arrays", "Medium", ["Matrix", "Hashing"],
  "Given an r x c matrix, print the distinct values that appear in every single row (in any order, space-separated). If no value appears in all rows, print 'None'.",
  "1 <= r, c <= 1000",
  "Input:\n4 5\n1 2 1 4 8\n3 7 1 2 5\n8 7 7 3 1\n8 1 2 1 1\nOutput:\n1",
  ["Build a frequency map for the first row's distinct values.", "For each subsequent row, keep only the values that also appear in that row (a running set intersection)."],
  [{ input: "4 5\n1 2 1 4 8\n3 7 1 2 5\n8 7 7 3 1\n8 1 2 1 1", expectedOutput: "1", explanation: "" },
   { input: "2 3\n1 2 3\n1 2 3", expectedOutput: "1 2 3", explanation: "" }],
  [{ input: "2 1\n1\n2", expectedOutput: "None", points: 1 },
   { input: "1 3\n5 5 5", expectedOutput: "5", points: 1 },
   { input: "3 2\n1 2\n2 3\n2 4", expectedOutput: "2", points: 1 }]),

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
console.log(`MATRIX topic: created ${created} problem(s), skipped ${skipped} already-existing.`);
