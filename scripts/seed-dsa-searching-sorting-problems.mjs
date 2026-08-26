import admin from "firebase-admin";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(join(__dirname, "service-account.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// DSA-450-sheet ingestion, SEARCHING & SORTING topic. Rows already covered by
// the ARRAY/MATRIX batches (0/1/2 sort, max product subarray, row of a sorted
// matrix with the most 1s, kth smallest in a sorted matrix) are skipped here
// rather than re-seeded.

const REWARD = { Easy: [30, 10], Medium: [50, 20], Hard: [80, 30] };
function p(title, category, difficulty, tags, statement, constraints, examplesText, hints, sampleTests, hiddenTests) {
  const [xpReward, coinReward] = REWARD[difficulty];
  return { title, category, difficulty, tags, statement, constraints, examplesText, hints, xpReward, coinReward, sampleTests, hiddenTests };
}

const PROBLEMS = [

p("Find First and Last Position of an Element in a Sorted Array", "Binary Search", "Medium", ["Array", "Binary Search"],
  "Given a sorted array of n integers and a target value, find the first and last index at which the target occurs. Print them as 'first last', or '-1 -1' if the target isn't present.",
  "1 <= n <= 10^5",
  "Input:\n6\n5 7 7 8 8 10\n8\nOutput:\n3 4",
  ["Binary search for the leftmost occurrence and, separately, binary search for the rightmost occurrence.", "A plain linear scan also works but is not the intended O(log n) approach."],
  [{ input: "6\n5 7 7 8 8 10\n8", expectedOutput: "3 4", explanation: "" },
   { input: "6\n5 7 7 8 8 10\n6", expectedOutput: "-1 -1", explanation: "" }],
  [{ input: "1\n1\n1", expectedOutput: "0 0", points: 1 },
   { input: "3\n2 2 2\n2", expectedOutput: "0 2", points: 1 },
   { input: "3\n1 2 3\n4", expectedOutput: "-1 -1", points: 1 }]),

p("Search in a Rotated Sorted Array", "Binary Search", "Medium", ["Array", "Binary Search"],
  "An ascending array was rotated at some unknown pivot. Given the rotated array and a target, find the target's index, or print -1 if it isn't present.",
  "1 <= n <= 10^5, all elements distinct",
  "Input:\n7\n4 5 6 7 0 1 2\n0\nOutput:\n4",
  ["At each binary search step, one half of the array is guaranteed to be normally sorted - check which half that is, then decide which half the target could be in.", "Compare the target against the sorted half's endpoints to decide which side to search next."],
  [{ input: "7\n4 5 6 7 0 1 2\n0", expectedOutput: "4", explanation: "" },
   { input: "7\n4 5 6 7 0 1 2\n3", expectedOutput: "-1", explanation: "" }],
  [{ input: "1\n1\n0", expectedOutput: "-1", points: 1 },
   { input: "1\n1\n1", expectedOutput: "0", points: 1 },
   { input: "3\n5 1 3\n5", expectedOutput: "0", points: 1 }]),

p("Integer Square Root", "Binary Search", "Easy", ["Math", "Binary Search"],
  "Given a non-negative integer n, find floor(sqrt(n)) - the largest integer whose square is less than or equal to n - without using a built-in square root function.",
  "0 <= n <= 2*10^9",
  "Input:\n8\nOutput:\n2",
  ["Binary search on the answer between 0 and n: for a candidate mid, check if mid*mid <= n.", "Watch for overflow when squaring mid on very large n."],
  [{ input: "8", expectedOutput: "2", explanation: "" },
   { input: "16", expectedOutput: "4", explanation: "" }],
  [{ input: "0", expectedOutput: "0", points: 1 },
   { input: "1", expectedOutput: "1", points: 1 },
   { input: "99", expectedOutput: "9", points: 1 }]),

p("Find the Repeating and the Missing Number", "Arrays", "Medium", ["Array", "Math", "Hashing"],
  "An array contains n numbers that should be exactly the numbers 1 to n, each appearing once - except one number is missing and another appears twice (taking the missing one's place). Given the array, print 'repeating missing'.",
  "2 <= n <= 10^5",
  "Input:\n4\n1 3 3 4\nOutput:\n3 2",
  ["Count occurrences of each value 1..n (a frequency array works). The value with count 2 is the repeat; the value with count 0 is missing.", "A pure-math approach also exists using the sum and sum-of-squares formulas for 1..n, avoiding extra space."],
  [{ input: "4\n1 3 3 4", expectedOutput: "3 2", explanation: "" },
   { input: "5\n2 3 1 3 5", expectedOutput: "3 4", explanation: "" }],
  [{ input: "3\n1 2 2", expectedOutput: "2 3", points: 1 },
   { input: "3\n3 1 3", expectedOutput: "3 2", points: 1 },
   { input: "5\n1 2 3 4 4", expectedOutput: "4 5", points: 1 }]),

p("Find the Majority Element", "Arrays", "Easy", ["Array", "Hashing"],
  "Given an array of n integers, find the element that occurs strictly more than n/2 times. If no such element exists, print -1.",
  "1 <= n <= 10^5",
  "Input:\n8\n1 3 3 1 1 2 1 1\nOutput:\n1",
  ["Boyer-Moore voting: keep a running candidate and a counter; increment on a match, decrement otherwise, and swap candidates when the counter hits 0.", "After finding a candidate this way, verify its count actually exceeds n/2 before printing it."],
  [{ input: "8\n1 3 3 1 1 2 1 1", expectedOutput: "1", explanation: "" },
   { input: "3\n1 2 3", expectedOutput: "-1", explanation: "" }],
  [{ input: "1\n1", expectedOutput: "1", points: 1 },
   { input: "4\n1 1 2 2", expectedOutput: "-1", points: 1 },
   { input: "5\n5 5 5 5 1", expectedOutput: "5", points: 1 }]),

p("Find a Pair With a Given Difference", "Hashing", "Medium", ["Array", "Hashing"],
  "Given an unsorted array of n integers and a positive value d, print 'Yes' if there exist two elements in the array whose absolute difference is exactly d, otherwise print 'No'.",
  "1 <= n <= 10^5, 1 <= d <= 10^9",
  "Input:\n6\n5 20 3 2 50 80\n78\nOutput:\nYes",
  ["Put every element into a hash set, then for each element check whether (element + d) is also present.", "Sorting and using two pointers is an alternative approach with the same result."],
  [{ input: "6\n5 20 3 2 50 80\n78", expectedOutput: "Yes", explanation: "" },
   { input: "5\n90 70 20 80 50\n40", expectedOutput: "Yes", explanation: "" }],
  [{ input: "2\n1 2\n1", expectedOutput: "Yes", points: 1 },
   { input: "2\n1 2\n5", expectedOutput: "No", points: 1 },
   { input: "3\n3 8 3\n5", expectedOutput: "Yes", points: 1 }]),

p("Find Four Elements That Sum to a Given Value", "Hashing", "Hard", ["Array", "Hashing"],
  "Given an array of n integers and a target value, print 'Yes' if there exist four elements (at four distinct indices) whose sum equals the target, otherwise print 'No'.",
  "1 <= n <= 500",
  "Input:\n6\n10 20 30 40 1 2\n91\nOutput:\nYes",
  ["Precompute the sums of all pairs, then look for two pairs (with no overlapping indices) whose sums add up to the target - similar to the classic two-sum trick, one level up.", "A hash map from pair-sum to a list of index-pairs makes checking pair-sum complements efficient."],
  [{ input: "6\n10 20 30 40 1 2\n91", expectedOutput: "Yes", explanation: "10+20+40+... check 40+30+20+1=91." },
   { input: "5\n1 2 3 4 5\n100", expectedOutput: "No", explanation: "" }],
  [{ input: "4\n1 2 3 4\n10", expectedOutput: "Yes", points: 1 },
   { input: "4\n1 2 3 4\n100", expectedOutput: "No", points: 1 },
   { input: "8\n2 7 4 0 9 5 1 3\n20", expectedOutput: "Yes", points: 1 }]),

p("Maximum Sum Such That No Two Elements Are Adjacent", "Dynamic Programming", "Medium", ["Array", "Dynamic Programming"],
  "Given an array of n non-negative integers, find the maximum possible sum of a subset of elements such that no two chosen elements are adjacent in the array.",
  "1 <= n <= 10^5",
  "Input:\n6\n5 5 10 100 10 5\nOutput:\n110",
  ["dp[i] = max(dp[i-1], dp[i-2] + arr[i]) - either skip this element or take it and skip the previous one.", "Only two previous dp values need to be kept in memory."],
  [{ input: "6\n5 5 10 100 10 5", expectedOutput: "110", explanation: "" },
   { input: "4\n3 2 7 10", expectedOutput: "13", explanation: "" }],
  [{ input: "1\n5", expectedOutput: "5", points: 1 },
   { input: "2\n5 1", expectedOutput: "5", points: 1 },
   { input: "6\n1 2 3 4 5 6", expectedOutput: "12", points: 1 }]),

p("Count Triplets Such That One Element Is the Sum of the Other Two", "Arrays", "Medium", ["Array", "Sorting"],
  "Given an array of n integers, count the number of unordered triplets (three distinct elements, by index) where the largest of the three equals the sum of the other two.",
  "3 <= n <= 2000",
  "Input:\n4\n1 5 3 2\nOutput:\n2",
  ["Sort the array, then for the largest element of a candidate triplet, use two pointers on the elements before it to find pairs summing to it.", "This is structurally the same technique as counting two-sum pairs, applied once per candidate 'largest' element."],
  [{ input: "4\n1 5 3 2", expectedOutput: "2", explanation: "(1,2,3) and (2,3,5)." },
   { input: "3\n1 2 3", expectedOutput: "1", explanation: "" }],
  [{ input: "2\n5 10", expectedOutput: "0", points: 1 },
   { input: "3\n1 1 2", expectedOutput: "1", points: 1 },
   { input: "4\n10 20 30 40", expectedOutput: "2", points: 1 }]),

p("Count Subarrays With Sum Zero", "Hashing", "Medium", ["Array", "Hashing"],
  "Given an array of n integers (which may include negatives), count the number of contiguous subarrays whose elements sum to exactly zero.",
  "1 <= n <= 10^5",
  "Input:\n4\n1 2 -3 3\nOutput:\n2",
  ["Track running prefix sums. A subarray sums to zero exactly when two prefix sums (including the empty-prefix sum of 0) are equal.", "Use a hash map from prefix-sum value to how many times it has occurred so far, and accumulate combinations as you scan."],
  [{ input: "4\n1 2 -3 3", expectedOutput: "2", explanation: "" },
   { input: "2\n1 -1", expectedOutput: "1", explanation: "" }],
  [{ input: "3\n1 2 3", expectedOutput: "0", points: 1 },
   { input: "3\n0 0 0", expectedOutput: "6", points: 1 },
   { input: "11\n6 3 -1 -3 4 -2 2 4 6 -12 -7", expectedOutput: "4", points: 1 }]),

p("Merge Sort", "Sorting", "Medium", ["Array", "Sorting"],
  "Given an array of n integers, sort it in ascending order using the merge sort algorithm (divide the array in half, recursively sort each half, then merge the two sorted halves) and print the result.",
  "1 <= n <= 10^5",
  "Input:\n5\n5 2 4 1 3\nOutput:\n1 2 3 4 5",
  ["Recursively split the array into halves until each piece has one element, then merge sorted halves back together.", "The merge step walks two sorted lists with two pointers, picking the smaller front element each time."],
  [{ input: "5\n5 2 4 1 3", expectedOutput: "1 2 3 4 5", explanation: "" },
   { input: "1\n1", expectedOutput: "1", explanation: "" }],
  [{ input: "3\n3 3 1", expectedOutput: "1 3 3", points: 1 },
   { input: "3\n-1 -5 2", expectedOutput: "-5 -1 2", points: 1 },
   { input: "5\n9 8 7 6 5", expectedOutput: "5 6 7 8 9", points: 1 }]),

p("Quick Sort", "Sorting", "Medium", ["Array", "Sorting"],
  "Given an array of n integers, sort it in ascending order using the quicksort algorithm (pick a pivot, partition the array around it, then recursively sort each side) and print the result.",
  "1 <= n <= 10^5",
  "Input:\n6\n10 7 8 9 1 5\nOutput:\n1 5 7 8 9 10",
  ["Partitioning places all elements smaller than the pivot to its left and all larger elements to its right in a single pass.", "Recurse on the two partitions on either side of the pivot's final position."],
  [{ input: "6\n10 7 8 9 1 5", expectedOutput: "1 5 7 8 9 10", explanation: "" },
   { input: "1\n2", expectedOutput: "2", explanation: "" }],
  [{ input: "3\n4 4 4", expectedOutput: "4 4 4", points: 1 },
   { input: "3\n0 -2 5", expectedOutput: "-2 0 5", points: 1 },
   { input: "3\n100 50 75", expectedOutput: "50 75 100", points: 1 }]),

p("Find a Peak Element in an Array", "Binary Search", "Medium", ["Array", "Binary Search"],
  "Given an array of n integers, find the index of a peak element - one that is greater than or equal to both of its neighbors (array boundaries count as negative infinity). If multiple peaks exist, print the index of the first one found scanning left to right.",
  "1 <= n <= 10^5",
  "Input:\n6\n1 3 20 4 1 0\nOutput:\n2",
  ["A single-element array is always a peak.", "Binary search also solves this in O(log n): move toward the side with the larger neighbor, which is guaranteed to contain a peak."],
  [{ input: "6\n1 3 20 4 1 0", expectedOutput: "2", explanation: "" },
   { input: "3\n1 2 3", expectedOutput: "2", explanation: "" }],
  [{ input: "3\n3 2 1", expectedOutput: "0", points: 1 },
   { input: "1\n1", expectedOutput: "0", points: 1 },
   { input: "5\n1 2 1 3 1", expectedOutput: "1", points: 1 }]),

p("Book Allocation Problem", "Binary Search", "Hard", ["Array", "Binary Search", "Greedy"],
  "There are n books with given page counts and m students. Each student is allocated a contiguous, non-empty range of books, every book must be allocated to exactly one student, and each student's total pages should be minimized as evenly as possible. Find the minimum possible value of 'the maximum number of pages assigned to any student', given an optimal allocation.",
  "1 <= m <= n <= 10^4",
  "Input:\n4\n12 34 67 90\n2\nOutput:\n113",
  ["Binary search on the answer: for a candidate maximum M, greedily check if the books can be split among m or fewer students so no student exceeds M pages.", "The search range for M is from the largest single book to the sum of all pages."],
  [{ input: "4\n12 34 67 90\n2", expectedOutput: "113", explanation: "" },
   { input: "4\n10 20 30 40\n2", expectedOutput: "60", explanation: "" }],
  [{ input: "1\n10\n1", expectedOutput: "10", points: 1 },
   { input: "4\n5 5 5 5\n4", expectedOutput: "5", points: 1 },
   { input: "5\n1 2 3 4 5\n3", expectedOutput: "6", points: 1 }]),

p("Painter's Partition Problem", "Binary Search", "Hard", ["Array", "Binary Search", "Greedy"],
  "There are n boards with given lengths and k painters. Painting one unit of board length takes one unit of time, each painter paints a contiguous, non-empty range of boards, and painters work in parallel. Find the minimum time needed to paint all boards, given an optimal contiguous partition among the k painters.",
  "1 <= k <= n <= 10^4",
  "Input:\n4\n10 20 30 40\n2\nOutput:\n60",
  ["This is the same structure as the book allocation problem: binary search on the answer, and greedily check feasibility for a candidate time limit.", "A partition is feasible for limit T if you can group boards into at most k contiguous chunks, none exceeding T."],
  [{ input: "4\n10 20 30 40\n2", expectedOutput: "60", explanation: "" },
   { input: "4\n10 10 10 10\n2", expectedOutput: "20", explanation: "" }],
  [{ input: "1\n5\n1", expectedOutput: "5", points: 1 },
   { input: "5\n1 1 1 1 1\n5", expectedOutput: "1", points: 1 },
   { input: "5\n1 2 3 4 5\n3", expectedOutput: "6", points: 1 }]),

p("Aggressive Cows Problem", "Binary Search", "Hard", ["Array", "Binary Search", "Greedy"],
  "Given the positions of n stalls along a line and a number of cows c, place all c cows into stalls (at most one cow per stall) so as to maximize the minimum distance between any two cows. Print that maximum possible minimum distance.",
  "2 <= c <= n <= 10^5",
  "Input:\n5\n1 2 4 8 9\n3\nOutput:\n3",
  ["Sort the stall positions, then binary search on the candidate minimum distance.", "For a candidate distance D, greedily place cows left to right, only placing the next cow once you're at least D past the last placed cow, and check if all c cows fit."],
  [{ input: "5\n1 2 4 8 9\n3", expectedOutput: "3", explanation: "" },
   { input: "5\n1 2 3 4 5\n2", expectedOutput: "4", explanation: "" }],
  [{ input: "5\n10 1 2 7 5\n3", expectedOutput: "4", points: 1 },
   { input: "2\n1 2\n2", expectedOutput: "1", points: 1 },
   { input: "4\n1 5 10 15\n2", expectedOutput: "14", points: 1 }]),

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
console.log(`SEARCHING & SORTING topic: created ${created} problem(s), skipped ${skipped} already-existing.`);
