import admin from "firebase-admin";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(join(__dirname, "service-account.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// DSA-450-sheet ingestion, HEAP topic, part 2. Fills in the sheet rows that
// seed-dsa-heap-problems.mjs's curated first pass left out. Every
// expectedOutput below was hand-verified against a reference implementation
// run outside this file before being hardcoded here.
//
// Sheet rows resolved as already-covered (skipped as true duplicates, not
// re-added here):
//   - "Implement a Maxheap/MinHeap using arrays and recursion" - no
//     distinguishing observable behavior (see part 1's note).
//   - "k largest elements in an array" -> "Find the K Largest Elements in an Array"
//   - "Kth smallest and largest element in an unsorted array" -> the existing
//     "Kth Largest Element in an Array" + "Kth Smallest Element in an Array"
//   - "Merge K sorted arrays" -> "Merge K Sorted Arrays"
//   - "Merge K Sorted Linked Lists" -> already seeded under Linked List category
//   - "Smallest range in K Lists" is NOT a duplicate of the above; added below.
//   - "Median in a stream of Integers" -> "Find the Running Median of a Stream of Integers"
//   - "Check if a Binary Tree is Heap" -> "Check if a Binary Tree Is a Valid Heap"
//   - "Connect n ropes with minimum cost" -> "Minimum Cost to Connect N Ropes"
//   - "Rearrange characters in a string such that no two adjacent are same" and
//     "Leetcode - reorganize strings" are the same underlying problem (GfG's
//     rearrange-characters problem IS LeetCode 767 Reorganize String); neither
//     existed yet, so they're covered by ONE new problem below, not two.

const REWARD = { Easy: [30, 10], Medium: [50, 20], Hard: [80, 30] };
function p(title, category, difficulty, tags, statement, constraints, examplesText, hints, sampleTests, hiddenTests) {
  const [xpReward, coinReward] = REWARD[difficulty];
  return { title, category, difficulty, tags, statement, constraints, examplesText, hints, xpReward, coinReward, sampleTests, hiddenTests };
}

const TREE_FORMAT = "The tree is given as space-separated level-order tokens, where 'N' means no node there: the first token is the root, then for each node dequeued in level order you read its left-child token then its right-child token (if input runs out early, remaining children are treated as N).";

const PROBLEMS = [

p("Sort an Array Using Heap Sort", "Heap", "Medium", ["Heap", "Sorting"],
  "Given an array of n integers, sort it in ascending order using the heap sort algorithm (build a max-heap from the array, then repeatedly swap the heap's root with the last unsorted element and sift down to restore the heap) and print the result.",
  "1 <= n <= 10^5",
  "Input:\n6\n12 11 13 5 6 7\nOutput:\n5 6 7 11 12 13",
  ["Build a max-heap in place from the whole array first (heapify from the last non-leaf node up to the root).", "Then repeatedly swap the root (the current maximum) with the last element of the unsorted region, shrink that region by one, and sift down the new root to restore the heap property."],
  [{ input: "6\n12 11 13 5 6 7", expectedOutput: "5 6 7 11 12 13", explanation: "" },
   { input: "5\n9 8 7 6 5", expectedOutput: "5 6 7 8 9", explanation: "" }],
  [{ input: "1\n1", expectedOutput: "1", points: 1 },
   { input: "3\n3 3 3", expectedOutput: "3 3 3", points: 1 },
   { input: "5\n-5 0 -1 2 -3", expectedOutput: "-5 -3 -1 0 2", points: 1 }]),

p("Maximum of All Subarrays of Size K", "Heap", "Medium", ["Heap", "Array"],
  "Given an array of n integers and a window size k, print the maximum element of every contiguous subarray (window) of size k, in order from left to right, space-separated.",
  "1 <= k <= n <= 10^5",
  "Input:\n8\n1 3 -1 -3 5 3 6 7\n3\nOutput:\n3 3 5 5 6 7",
  ["A max-heap storing (value, index) pairs lets you query the current window's maximum quickly, lazily discarding heap-top entries whose index has fallen out of the window instead of removing them eagerly.", "As the window slides one step right, push the newly-entered element, then keep popping the heap-top while its index is no longer inside the current window.", "A deque that only ever keeps indices in decreasing order of value also solves this in O(n) if you want the non-heap approach."],
  [{ input: "8\n1 3 -1 -3 5 3 6 7\n3", expectedOutput: "3 3 5 5 6 7", explanation: "" },
   { input: "4\n1 2 3 4\n2", expectedOutput: "2 3 4", explanation: "" }],
  [{ input: "1\n5\n1", expectedOutput: "5", points: 1 },
   { input: "5\n9 7 2 4 3\n4", expectedOutput: "9 7", points: 1 },
   { input: "4\n4 4 4 4\n2", expectedOutput: "4 4 4", points: 1 }]),

p("Merge Two Binary Max-Heaps", "Heap", "Medium", ["Heap", "Array"],
  "You are given two binary max-heaps, each as an array in the usual level-order representation (node i's children sit at 2i+1 and 2i+2), of sizes n and m respectively. Merge them into one array of size n+m by concatenating the first heap's array followed by the second heap's array, then convert that combined array into a valid max-heap using the standard bottom-up build-heap procedure: for each index from the last non-leaf node up to the root, sift it down by repeatedly swapping it with its larger child (preferring the left child when both children are equal) until the heap property holds there. Print the resulting array.",
  "1 <= n, m <= 10^5",
  "Input:\n4\n10 5 6 2\n3\n12 7 9\nOutput:\n12 10 9 2 5 7 6",
  ["The two input arrays already satisfy the max-heap property individually - concatenating them only breaks it where the second array's root landed, so you don't need a different algorithm, just the same bottom-up heapify you'd use to build a heap from any array.", "Process nodes in reverse order starting from index (n+m)/2 - 1 down to 0; every index below that is already a leaf, hence trivially a valid heap on its own.", "Sifting a node down means: find the larger of its two children, swap with it if that child is bigger than the node, and keep going from the child's position until no swap is needed or a leaf is reached."],
  [{ input: "4\n10 5 6 2\n3\n12 7 9", expectedOutput: "12 10 9 2 5 7 6", explanation: "" },
   { input: "1\n5\n1\n3", expectedOutput: "5 3", explanation: "" }],
  [{ input: "5\n9 5 6 2 3\n2\n8 7", expectedOutput: "9 5 8 2 3 6 7", points: 1 },
   { input: "5\n20 10 15 8 9\n4\n18 4 17 3", expectedOutput: "20 17 18 10 9 15 4 8 3", points: 1 },
   { input: "1\n7\n2\n9 3", expectedOutput: "9 7 3", points: 1 }]),

p("Kth Largest Sum Among All Contiguous Subarrays", "Heap", "Medium", ["Heap", "Array"],
  "Given an array of n integers, consider the sum of every contiguous subarray (there are n(n+1)/2 of them in total, and equal sums are counted separately, once per subarray). Find the kth largest such sum.",
  "1 <= n <= 1000, 1 <= k <= n*(n+1)/2",
  "Input:\n3\n20 -5 -1\n3\nOutput:\n14",
  ["You don't need to store all n(n+1)/2 sums at once - a min-heap capped at size k, holding only the k largest sums seen so far, gets you the answer once every subarray sum has been considered.", "For each starting index, extend the subarray one element at a time while tracking the running sum, pushing each running sum into the size-k min-heap (popping the smallest whenever the heap grows past size k).", "After every subarray sum has been processed, the kth largest sum is sitting at the top of that min-heap."],
  [{ input: "3\n20 -5 -1\n3", expectedOutput: "14", explanation: "" },
   { input: "3\n1 1 1\n2", expectedOutput: "2", explanation: "" }],
  [{ input: "1\n5\n1", expectedOutput: "5", points: 1 },
   { input: "4\n10 -10 20 -30\n4", expectedOutput: "10", points: 1 },
   { input: "2\n2 4\n3", expectedOutput: "2", points: 1 }]),

p("Reorganize a String So No Two Adjacent Characters Repeat", "Heap", "Medium", ["Heap", "Greedy", "String"],
  "Given a string s of lowercase English letters, rearrange its characters so that no two characters that end up adjacent are equal, and print the result. If it's impossible, print -1. Multiple valid rearrangements can exist, so build the answer with this exact rule to make it unique: at every step, among the characters that still have letters remaining and aren't equal to the character you placed immediately before, place the one with the highest remaining count, breaking ties by the alphabetically smaller character.",
  "1 <= |s| <= 10^5, s consists of lowercase English letters",
  "Input:\naabbcc\nOutput:\nabcabc",
  ["A max-heap keyed by (remaining count, then alphabetically smaller character breaking ties) lets you always find the best next candidate in O(log 26) time.", "If the heap's top character is the same as the one you just placed, temporarily set it aside and use the next-best character instead for this step, then put the first one back in for the following step.", "If any character's count exceeds ceil(n/2), no valid rearrangement can ever exist - check this upfront and print -1 immediately."],
  [{ input: "aabbcc", expectedOutput: "abcabc", explanation: "" },
   { input: "aab", expectedOutput: "aba", explanation: "" }],
  [{ input: "a", expectedOutput: "a", points: 1 },
   { input: "aa", expectedOutput: "-1", points: 1 },
   { input: "vvvlo", expectedOutput: "vlvov", points: 1 }]),

p("Smallest Range Covering Elements From K Lists", "Heap", "Hard", ["Heap"],
  "You are given k lists of integers, each already sorted in ascending order. Find the smallest range [start, end] (start <= end) such that it contains at least one number from every list. If several ranges tie for the smallest length, print the one with the smallest start. Print start and end, space-separated.",
  "1 <= k <= 100, 1 <= each list's length <= 1000",
  "Input:\n3\n5\n4 10 15 24 26\n4\n0 9 12 20\n3\n5 18 22 30\nOutput:\n20 24",
  ["A min-heap holding the current pointer's value from every list (plus which list and index it came from) lets you always find the smallest value across all lists in O(log k).", "Track the maximum value currently represented in the heap alongside it. The gap between the heap's minimum and that tracked maximum is a valid candidate range at every step - update your best answer as you go.", "Advance only the list that contributed the current minimum (push its next element into the heap and update the tracked maximum); stop as soon as any list runs out of elements to advance, since no smaller range could be found beyond that point."],
  [{ input: "3\n5\n4 10 15 24 26\n4\n0 9 12 20\n3\n5 18 22 30", expectedOutput: "20 24", explanation: "" },
   { input: "2\n4\n1 2 3 4\n4\n5 6 7 8", expectedOutput: "4 5", explanation: "" }],
  [{ input: "3\n3\n1 2 3\n3\n1 2 3\n3\n1 2 3", expectedOutput: "1 1", points: 1 },
   { input: "3\n1\n10\n1\n11\n1\n12", expectedOutput: "10 12", points: 1 },
   { input: "3\n3\n1 5 9\n3\n2 6 10\n3\n3 7 11", expectedOutput: "1 3", points: 1 }]),

p("Convert a BST to a Min-Heap", "Heap", "Medium", ["Heap", "Tree"],
  `Given a binary search tree, convert it into a min-heap while preserving the tree's exact shape (no node is added, removed, or relocated) - only the values are redistributed among the existing nodes. Because this can be done in more than one way, produce it with this exact construction so the answer is unique: read out every value via an in-order traversal of the BST (which comes out already sorted ascending, since it's a BST), then write those sorted values back into the tree one at a time following a preorder traversal (visit a node, then its whole left subtree, then its whole right subtree), assigning the next-smallest unused value to each node as you visit it. Print the resulting tree's level order (using the same convention as the input). ${TREE_FORMAT}`,
  "1 <= number of nodes <= 10^5",
  "Input:\n4 2 6 1 3 5 7\nOutput:\n1 2 5 3 4 6 7",
  ["An in-order traversal of a BST always visits values in ascending sorted order - that's exactly the multiset of values you need to redistribute.", "A preorder traversal visits a node strictly before any of its descendants, so if you hand out the sorted values in preorder order, every node necessarily gets a smaller value than everything below it - which is exactly the min-heap property.", "Do the in-order pass first to collect the sorted list, then do a second, preorder pass over the same tree structure, assigning the next value off the front of that sorted list to each node you visit."],
  [{ input: "4 2 6 1 3 5 7", expectedOutput: "1 2 5 3 4 6 7", explanation: "" },
   { input: "5 2 8 1 3 7 9", expectedOutput: "1 2 7 3 5 8 9", explanation: "" }],
  [{ input: "3", expectedOutput: "3", points: 1 },
   { input: "2 1 3", expectedOutput: "1 2 3", points: 1 },
   { input: "8 4 12 2 6 10 14 1 3 5 7", expectedOutput: "1 2 10 3 6 12 14 4 5 7 8", points: 1 }]),

p("Convert a Min-Heap to a Max-Heap", "Heap", "Medium", ["Heap", "Array"],
  "Given an array representing a valid min-heap (0-indexed, node i's children sit at 2i+1 and 2i+2), convert it into a valid max-heap using the standard bottom-up build-heap procedure: for each index from the last non-leaf node up to the root, sift it down by swapping it with its larger child (preferring the left child when both children are equal) until the max-heap property holds there. Print the resulting array.",
  "1 <= n <= 10^5",
  "Input:\n9\n3 5 9 6 8 20 10 12 18\nOutput:\n20 18 10 12 8 9 3 5 6",
  ["The values themselves don't change what to do - only their positions do; sift down from the last non-leaf index to the root, exactly like building a heap from any unsorted array.", "The last non-leaf index in a 0-indexed array of size n is n/2 - 1 (integer division).", "At each node, compare it against its children; if a child is larger, swap with the larger one (left child wins a tie) and keep sifting down from the child's new position."],
  [{ input: "9\n3 5 9 6 8 20 10 12 18", expectedOutput: "20 18 10 12 8 9 3 5 6", explanation: "" },
   { input: "3\n1 2 3", expectedOutput: "3 2 1", explanation: "" }],
  [{ input: "1\n1", expectedOutput: "1", points: 1 },
   { input: "6\n1 3 6 5 9 8", expectedOutput: "9 5 8 1 3 6", points: 1 },
   { input: "7\n2 4 3 8 5 7 6", expectedOutput: "8 5 7 4 2 3 6", points: 1 }]),

p("Minimum Sum of Two Numbers Formed From Digits of an Array", "Heap", "Medium", ["Heap", "Greedy"],
  "Given n single digits (each between 0 and 9), split them into two numbers using every digit exactly once - each number getting at least one digit - so that the sum of the two numbers is as small as possible. Print that minimum sum.",
  "2 <= n <= 10^5, 0 <= each digit <= 9",
  "Input:\n6\n6 8 4 5 2 3\nOutput:\n604",
  ["Pull digits out smallest-first (a min-heap makes this natural) and deal them alternately between the two numbers, appending each to the end of whichever number's turn it is.", "Giving the smallest digits the most significant positions, split evenly between the two numbers, is what minimizes the sum - the same idea behind minimizing a single number by putting its smallest digits leftmost.", "A number that ends up with a leading zero (e.g. digits 0 and 2 giving '02') is still just read as its numeric value (2), so leading zeros never cause a problem."],
  [{ input: "6\n6 8 4 5 2 3", expectedOutput: "604", explanation: "" },
   { input: "2\n5 3", expectedOutput: "8", explanation: "" }],
  [{ input: "4\n0 0 1 2", expectedOutput: "3", points: 1 },
   { input: "8\n1 2 9 5 5 7 3 3", expectedOutput: "3716", points: 1 },
   { input: "2\n7 7", expectedOutput: "14", points: 1 }]),

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
console.log(`HEAP topic (part 2): created ${created} problem(s), skipped ${skipped} already-existing.`);
