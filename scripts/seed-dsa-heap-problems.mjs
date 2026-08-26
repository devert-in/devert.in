import admin from "firebase-admin";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(join(__dirname, "service-account.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// DSA-450-sheet ingestion, HEAP topic. Pure "implement a heap from scratch"
// rows have no distinguishing observable behavior beyond what the other heap
// problems here already exercise, so they're skipped in favor of applied
// problems with a single well-defined answer.

const REWARD = { Easy: [30, 10], Medium: [50, 20], Hard: [80, 30] };
function p(title, category, difficulty, tags, statement, constraints, examplesText, hints, sampleTests, hiddenTests) {
  const [xpReward, coinReward] = REWARD[difficulty];
  return { title, category, difficulty, tags, statement, constraints, examplesText, hints, xpReward, coinReward, sampleTests, hiddenTests };
}

const TREE_FORMAT = "The tree is given as space-separated level-order tokens, where 'N' means no node there: the first token is the root, then for each node dequeued in level order you read its left-child token then its right-child token (if input runs out early, remaining children are treated as N).";

const PROBLEMS = [

p("Kth Largest Element in an Array", "Heap", "Medium", ["Heap", "Array"],
  "Given an array of n integers and a value k, find the kth largest element (k=1 means the largest).",
  "1 <= k <= n <= 10^5",
  "Input:\n6\n3 2 1 5 6 4\n2\nOutput:\n5",
  ["A min-heap of size k, keeping only the k largest elements seen so far, has the kth largest sitting at its top once you've processed the whole array.", "Sorting the whole array descending and indexing also works, just less efficient for large n and small k."],
  [{ input: "6\n3 2 1 5 6 4\n2", expectedOutput: "5", explanation: "" },
   { input: "9\n3 2 3 1 2 4 5 5 6\n4", expectedOutput: "4", explanation: "" }],
  [{ input: "1\n1\n1", expectedOutput: "1", points: 1 },
   { input: "3\n5 5 5\n2", expectedOutput: "5", points: 1 },
   { input: "6\n7 10 4 3 20 15\n3", expectedOutput: "10", points: 1 }]),

p("Kth Smallest Element in an Array", "Heap", "Medium", ["Heap", "Array"],
  "Given an array of n integers and a value k, find the kth smallest element (k=1 means the smallest).",
  "1 <= k <= n <= 10^5",
  "Input:\n6\n7 10 4 3 20 15\n3\nOutput:\n7",
  ["A max-heap of size k, keeping only the k smallest elements seen so far, has the kth smallest sitting at its top once you've processed the whole array.", "Sorting the whole array ascending and indexing also works, just less efficient for large n and small k."],
  [{ input: "6\n7 10 4 3 20 15\n3", expectedOutput: "7", explanation: "" },
   { input: "6\n7 10 4 3 20 15\n4", expectedOutput: "10", explanation: "" }],
  [{ input: "1\n1\n1", expectedOutput: "1", points: 1 },
   { input: "3\n5 5 5\n2", expectedOutput: "5", points: 1 },
   { input: "5\n12 3 5 7 19\n2", expectedOutput: "5", points: 1 }]),

p("Sort a Nearly Sorted (K-Sorted) Array", "Heap", "Medium", ["Heap", "Array"],
  "An array of n integers is 'k-sorted': every element is at most k positions away from where it would be in the fully sorted array. Given such an array and k, produce the fully sorted array.",
  "0 <= k < n <= 10^5",
  "Input:\n7\n6 5 3 2 8 10 9\n3\nOutput:\n2 3 5 6 8 9 10",
  ["Keep a min-heap of the next k+1 elements; the true minimum of the whole remaining array is always guaranteed to be inside that window.", "Repeatedly extract the heap's minimum, output it, and insert the next unseen element from the array."],
  [{ input: "7\n6 5 3 2 8 10 9\n3", expectedOutput: "2 3 5 6 8 9 10", explanation: "" },
   { input: "5\n3 2 1 5 4\n2", expectedOutput: "1 2 3 4 5", explanation: "" }],
  [{ input: "1\n1\n0", expectedOutput: "1", points: 1 },
   { input: "2\n2 1\n1", expectedOutput: "1 2", points: 1 },
   { input: "8\n10 9 8 7 4 70 60 50\n4", expectedOutput: "4 7 8 9 10 50 60 70", points: 1 }]),

p("Merge K Sorted Arrays", "Heap", "Medium", ["Heap", "Array"],
  "Given k sorted arrays (each given as its length followed by its sorted values), merge all of them into a single fully sorted array and print it.",
  "1 <= k <= 100, 1 <= each array's length <= 1000",
  "Input:\n3\n3\n1 4 5\n3\n1 3 4\n2\n2 6\nOutput:\n1 1 2 3 4 4 5 6",
  ["A min-heap holding the current front element of each array (along with which array and index it came from) lets you always extract the next-smallest value in O(log k) per step.", "Repeatedly pop the smallest, output it, and push that array's next element (if any) back onto the heap."],
  [{ input: "3\n3\n1 4 5\n3\n1 3 4\n2\n2 6", expectedOutput: "1 1 2 3 4 4 5 6", explanation: "" },
   { input: "2\n1\n1\n1\n0", expectedOutput: "0 1", explanation: "" }],
  [{ input: "1\n3\n5 3 1", expectedOutput: "1 3 5", explanation: "Values are combined and fully sorted regardless of each array's own order.", points: 1 },
   { input: "2\n1\n2\n1\n1", expectedOutput: "1 2", points: 1 },
   { input: "3\n2\n1 2\n2\n3 4\n2\n5 6", expectedOutput: "1 2 3 4 5 6", points: 1 }]),

p("Find the Running Median of a Stream of Integers", "Heap", "Hard", ["Heap"],
  "Given n integers arriving one at a time, after each new integer arrives print the median of all integers seen so far, rounded to exactly one decimal place. Print all n medians space-separated on one line.",
  "1 <= n <= 10^5",
  "Input:\n4\n5 15 1 3\nOutput:\n5.0 10.0 5.0 4.0",
  ["Maintain a max-heap for the lower half of the numbers and a min-heap for the upper half, keeping their sizes balanced (differing by at most 1) after every insertion.", "The median is the top of the larger heap, or the average of both tops when they're equal in size."],
  [{ input: "4\n5 15 1 3", expectedOutput: "5.0 10.0 5.0 4.0", explanation: "" },
   { input: "4\n1 2 3 4", expectedOutput: "1.0 1.5 2.0 2.5", explanation: "" }],
  [{ input: "1\n10", expectedOutput: "10.0", points: 1 },
   { input: "2\n1 1", expectedOutput: "1.0 1.0", points: 1 },
   { input: "4\n5 2 8 1", expectedOutput: "5.0 3.5 5.0 3.5", points: 1 }]),

p("Check if a Binary Tree Is a Valid Heap", "Heap", "Medium", ["Heap", "Tree"],
  `Given a binary tree, print 'Yes' if it is a valid max-heap - meaning it is a complete binary tree (every level is fully filled left to right, except possibly the last, whose missing nodes are all at the end) and every node's value is greater than or equal to both its children's values - otherwise print 'No'. ${TREE_FORMAT}`,
  "1 <= number of nodes <= 10^5",
  "Input:\n10 5 3\nOutput:\nYes",
  ["Check completeness first: as you do a level-order traversal, once you encounter one missing child, every node after it must also be missing (no real node may appear after a gap).", "Then separately verify the heap-order property (parent >= both children) at every internal node."],
  [{ input: "10 5 3", expectedOutput: "Yes", explanation: "" },
   { input: "10 5 3 1 4 6 8", expectedOutput: "No", explanation: "3 < 6 violates heap order." }],
  [{ input: "5", expectedOutput: "Yes", points: 1 },
   { input: "10 5 3 1 4", expectedOutput: "Yes", points: 1 },
   { input: "10 5 3 N 4", expectedOutput: "No", points: 1 }]),

p("Minimum Cost to Connect N Ropes", "Heap", "Medium", ["Heap", "Greedy"],
  "Given the lengths of n ropes, you may connect any two ropes into one at a cost equal to the sum of their lengths, repeating until only one rope remains. Find the minimum total cost to connect all ropes into one.",
  "1 <= n <= 10^5",
  "Input:\n4\n4 3 2 6\nOutput:\n29",
  ["Always connect the two currently shortest ropes - a min-heap makes finding those two efficient at every step.", "Each connection's cost gets added to the running total, and the newly combined rope goes back into the heap."],
  [{ input: "4\n4 3 2 6", expectedOutput: "29", explanation: "" },
   { input: "5\n1 2 3 4 5", expectedOutput: "33", explanation: "" }],
  [{ input: "1\n5", expectedOutput: "0", points: 1 },
   { input: "2\n1 1", expectedOutput: "2", points: 1 },
   { input: "3\n1 2 3", expectedOutput: "9", points: 1 }]),

p("Find the K Largest Elements in an Array", "Heap", "Medium", ["Heap", "Array"],
  "Given an array of n integers and a value k, print the k largest elements, in descending order, space-separated.",
  "1 <= k <= n <= 10^5",
  "Input:\n6\n3 2 1 5 6 4\n2\nOutput:\n6 5",
  ["A min-heap of size k works well: for each element, push it in, and if the heap exceeds size k, pop the smallest.", "At the end, empty the heap and print its contents in descending order."],
  [{ input: "6\n3 2 1 5 6 4\n2", expectedOutput: "6 5", explanation: "" },
   { input: "6\n7 10 4 3 20 15\n3", expectedOutput: "20 15 10", explanation: "" }],
  [{ input: "1\n1\n1", expectedOutput: "1", points: 1 },
   { input: "3\n5 5 5\n2", expectedOutput: "5 5", points: 1 },
   { input: "5\n1 2 3 4 5\n5", expectedOutput: "5 4 3 2 1", points: 1 }]),

p("K Closest Points to the Origin", "Heap", "Medium", ["Heap", "Array"],
  "Given n points on a 2D plane (as x y pairs) and a value k, find the k points closest to the origin (0, 0) by Euclidean distance. Print them ordered by ascending distance; break ties by smaller x, then by smaller y. Print each point's x and y, space-separated, in that order, all on one line.",
  "1 <= k <= n <= 10^5",
  "Input:\n2\n1 3\n-2 2\n1\nOutput:\n-2 2",
  ["Compare squared distances (x^2 + y^2) to avoid floating-point square roots entirely - it gives the same ordering.", "A max-heap of size k (keeping the k currently-closest points, evicting the farthest when a closer one arrives) avoids sorting the whole input."],
  [{ input: "2\n1 3\n-2 2\n1", expectedOutput: "-2 2", explanation: "" },
   { input: "3\n3 3\n5 -1\n-2 4\n2", expectedOutput: "3 3 -2 4", explanation: "" }],
  [{ input: "1\n0 0\n1", expectedOutput: "0 0", points: 1 },
   { input: "2\n1 0\n0 1\n1", expectedOutput: "0 1", points: 1 },
   { input: "3\n1 1\n2 2\n3 3\n2", expectedOutput: "1 1 2 2", points: 1 }]),

p("Top K Frequent Elements", "Heap", "Medium", ["Heap", "Hashing"],
  "Given an array of n integers and a value k, print the k elements that occur most frequently, ordered by descending frequency; break ties between equally frequent elements by printing the smaller value first.",
  "1 <= k <= number of distinct elements <= 10^5",
  "Input:\n6\n1 1 1 2 2 3\n2\nOutput:\n1 2",
  ["Count each value's frequency with a hash map first.", "A heap of size k, ordered by (frequency, then value for tie-breaking), lets you extract the top k efficiently instead of sorting everything."],
  [{ input: "6\n1 1 1 2 2 3\n2", expectedOutput: "1 2", explanation: "" },
   { input: "1\n1\n1", expectedOutput: "1", explanation: "" }],
  [{ input: "2\n1 2\n2", expectedOutput: "1 2", points: 1 },
   { input: "7\n4 4 4 4 5 5 6\n1", expectedOutput: "4", points: 1 },
   { input: "6\n1 2 2 3 3 3\n3", expectedOutput: "3 2 1", points: 1 }]),

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
console.log(`HEAP topic: created ${created} problem(s), skipped ${skipped} already-existing.`);
