import admin from "firebase-admin";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(join(__dirname, "service-account.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// DSA-450-sheet ingestion, BINARY SEARCH TREES topic, PART 2 - closes the gap
// between the curated subset seeded in seed-dsa-bst-problems.mjs and the
// sheet's full verbatim row list. Reuses the same level-order/'N' tree
// convention as every other tree problem on the platform. Every
// expectedOutput below was hand-computed and cross-checked with a verified
// Python reference implementation before being written here.

const REWARD = { Easy: [30, 10], Medium: [50, 20], Hard: [80, 30] };
function p(title, category, difficulty, tags, statement, constraints, examplesText, hints, sampleTests, hiddenTests) {
  const [xpReward, coinReward] = REWARD[difficulty];
  return { title, category, difficulty, tags, statement, constraints, examplesText, hints, xpReward, coinReward, sampleTests, hiddenTests };
}

const TREE_FORMAT = "The tree is given as space-separated level-order tokens, where 'N' means no node there: the first token is the root, then for each node dequeued in level order you read its left-child token then its right-child token (if input runs out early, remaining children are treated as N).";
const TREE_OUTPUT = "Print the resulting tree the same way (level order, 'N' for absent children), but omit any trailing 'N' tokens at the very end of your output.";

const PROBLEMS = [

p("Find a Value in a BST", "Trees", "Easy", ["Tree", "BST"],
  `Given a binary search tree and a target value, print 'Yes' if the value exists in the tree, otherwise print 'No'. ${TREE_FORMAT} The target is given on the next line.`,
  "1 <= number of nodes <= 10^5",
  "Input:\n8 3 10 1 6 N 14 N N 4 7\n6\nOutput:\nYes",
  ["Starting from the root, move left if the target is smaller than the current node and right if it's larger - you never need to check both sides.", "Stop as soon as you land on a node equal to the target (found) or fall off the tree into a missing child (not found).", "This takes O(height) time, unlike searching an arbitrary binary tree which would need to check every node."],
  [{ input: "8 3 10 1 6 N 14 N N 4 7\n6", expectedOutput: "Yes", explanation: "" },
   { input: "8 3 10 1 6 N 14 N N 4 7\n9", expectedOutput: "No", explanation: "" }],
  [{ input: "5\n5", expectedOutput: "Yes", points: 1 },
   { input: "5 3 8\n3", expectedOutput: "Yes", points: 1 },
   { input: "8 3 10 1 6 N 14 N N 4 7\n14", expectedOutput: "Yes", points: 1 }]),

p("Find the Inorder Predecessor of a Node in a BST", "Trees", "Medium", ["Tree", "BST"],
  `Given a binary search tree and a value that is guaranteed to exist in it, find its inorder predecessor - the next smaller value in the tree. Print that value, or -1 if the given value is the minimum in the tree. ${TREE_FORMAT} The value is given on the next line.`,
  "1 <= number of nodes <= 10^5",
  "Input:\n8 3 10 1 6 N 14 N N 4 7\n6\nOutput:\n4",
  ["If the node has a left subtree, its predecessor is the maximum value in that left subtree.", "If it has no left subtree, its predecessor is the nearest ancestor for which this node lies in the right subtree - found by walking down from the root and remembering the last node you turned left at.", "This mirrors the inorder-successor problem exactly, just with left and right swapped."],
  [{ input: "8 3 10 1 6 N 14 N N 4 7\n6", expectedOutput: "4", explanation: "" },
   { input: "8 3 10 1 6 N 14 N N 4 7\n1", expectedOutput: "-1", explanation: "" }],
  [{ input: "5\n5", expectedOutput: "-1", points: 1 },
   { input: "5 3 8\n8", expectedOutput: "5", points: 1 },
   { input: "8 3 10 1 6 N 14 N N 4 7\n4", expectedOutput: "3", points: 1 }]),

p("Populate the Inorder Successor of Every Node in a BST", "Trees", "Medium", ["Tree", "BST"],
  "Given a binary search tree, find every node's inorder successor (the next larger value in the tree, or -1 for the node with the maximum value). Print one 'value:successor' pair per node, in inorder order, space-separated on a single line.",
  "1 <= number of nodes <= 10^5",
  "Input:\n5 3 8\nOutput:\n3:5 5:8 8:-1",
  ["An inorder traversal already visits every node in ascending order - so each node's successor in this list is simply the very next value in that same traversal.", "Do one inorder pass, and pair each visited value with the value visited right after it; the last value visited pairs with -1.", "This avoids any per-node pointer-chasing entirely - the whole answer falls out of a single traversal."],
  [{ input: "5 3 8", expectedOutput: "3:5 5:8 8:-1", explanation: "" },
   { input: "5", expectedOutput: "5:-1", explanation: "" }],
  [{ input: "8 3 10 1 6 N 14 N N 4 7", expectedOutput: "1:3 3:4 4:6 6:7 7:8 8:10 10:14 14:-1", points: 1 },
   { input: "5 3 8 1 4 N N", expectedOutput: "1:3 3:4 4:5 5:8 8:-1", points: 1 },
   { input: "3 1 5", expectedOutput: "1:3 3:5 5:-1", points: 1 }]),

p("Convert a Binary Tree Into a BST", "Trees", "Hard", ["Tree", "BST", "Sorting"],
  `Given an arbitrary binary tree with distinct values (not necessarily a valid BST), reassign its node values - keeping the exact same shape - so that it becomes a valid binary search tree. Print the resulting tree using level-order tokens. ${TREE_OUTPUT} ${TREE_FORMAT}`,
  "1 <= number of nodes <= 10^5, all values distinct",
  "Input:\n5 3 8 4 1 N N\nOutput:\n5 3 8 1 4",
  ["The tree's shape never changes - only the values move. Collect every value, sort them, then do an inorder traversal of the original shape, writing the sorted values back in ascending order as you visit each node.", "This works because a BST's defining property is exactly that its inorder traversal is ascending - assigning sorted values in inorder order guarantees that.", "Two passes suffice: one inorder pass to collect and sort the values (or just collect, then sort separately), and a second inorder pass to write them back."],
  [{ input: "5 3 8 4 1 N N", expectedOutput: "5 3 8 1 4", explanation: "" },
   { input: "5", expectedOutput: "5", explanation: "" }],
  [{ input: "1 2", expectedOutput: "2 1", points: 1 },
   { input: "3 2 1", expectedOutput: "2 1 3", points: 1 },
   { input: "10 5 15 2 7 12 20", expectedOutput: "10 5 15 2 7 12 20", points: 1 }]),

p("Convert a BST Into a Balanced BST", "Trees", "Medium", ["Tree", "BST", "Recursion"],
  `Given a binary search tree that may be unbalanced (even fully skewed), rebuild it into a height-balanced BST containing the same values and print it using level-order tokens. Build it with this exact rule on the tree's sorted values: for the current sub-range [lo, hi] (0-indexed, inclusive), the root is the element at index floor((lo+hi)/2), the left subtree is built the same way from [lo, mid-1], and the right subtree from [mid+1, hi]. ${TREE_OUTPUT} ${TREE_FORMAT}`,
  "1 <= number of nodes <= 10^5",
  "Input:\n1 N 2 N 3\nOutput:\n2 1 3",
  ["First get the input BST's inorder traversal - since it's already a BST, that traversal is already sorted, so no separate sorting step is needed.", "Then build the balanced tree from that sorted array using the same middle-element recursion as building a balanced BST directly from a sorted array.", "Follow the floor((lo+hi)/2) rule exactly for even-length ranges, since that's what determines the exact expected shape."],
  [{ input: "1 N 2 N 3", expectedOutput: "2 1 3", explanation: "A right-skewed chain 1->2->3 becomes the balanced tree rooted at 2." },
   { input: "5", expectedOutput: "5", explanation: "" }],
  [{ input: "3 2 N 1", expectedOutput: "2 1 3", points: 1 },
   { input: "1 N 2 N 3 N 4", expectedOutput: "2 1 3 N N N 4", points: 1 },
   { input: "8 3 10 1 6 N 14 N N 4 7", expectedOutput: "6 3 8 1 4 7 10 N N N N N N N 14", points: 1 }]),

p("Find the Kth Largest Element in a BST", "Trees", "Medium", ["Tree", "BST"],
  `Given a binary search tree and a value k, print the kth largest value in the tree (1-indexed). ${TREE_FORMAT} k is given on the next line.`,
  "1 <= k <= number of nodes <= 10^5",
  "Input:\n8 3 10 1 6 N 14 N N 4 7\n3\nOutput:\n8",
  ["A reverse-inorder traversal (right subtree, node, left subtree) visits values in descending order - the kth value visited is the answer.", "Equivalently, find the (n - k + 1)th smallest value with a normal inorder traversal, where n is the total number of nodes.", "You can stop early once you've visited k nodes in whichever direction you chose."],
  [{ input: "8 3 10 1 6 N 14 N N 4 7\n3", expectedOutput: "8", explanation: "" },
   { input: "8 3 10 1 6 N 14 N N 4 7\n1", expectedOutput: "14", explanation: "" }],
  [{ input: "5\n1", expectedOutput: "5", points: 1 },
   { input: "5 3 8\n2", expectedOutput: "5", points: 1 },
   { input: "8 3 10 1 6 N 14 N N 4 7\n8", expectedOutput: "1", points: 1 }]),

p("Count Pairs From Two BSTs Whose Sum Equals a Given Value", "Trees", "Medium", ["Tree", "BST", "Hashing"],
  "Given two binary search trees and a target value X, count how many pairs (one node from each tree) have values summing to exactly X, and print that count. Each tree is given as its own line of level-order tokens, followed by X on a third line.",
  "1 <= number of nodes in each tree <= 10^5",
  "Input:\n8 3 10 1 6 N 14 N N 4 7\n5 3 8\n11\nOutput:\n3",
  ["Get the inorder traversal (sorted values) of each tree separately.", "Put one tree's values into a hash set, then for every value v in the other tree, check whether (X - v) is in that set.", "Watch out for double-subtracting: a pair is only counted once, even though you could in principle check it from either tree's side."],
  [{ input: "8 3 10 1 6 N 14 N N 4 7\n5 3 8\n11", expectedOutput: "3", explanation: "(3,8), (6,5), and (8,3) all sum to 11." },
   { input: "5\n5\n10", expectedOutput: "1", explanation: "" }],
  [{ input: "5 3 8\n5 3 8\n100", expectedOutput: "0", points: 1 },
   { input: "5 3 8\n5 3 8\n11", expectedOutput: "2", points: 1 },
   { input: "8 3 10 1 6 N 14 N N 4 7\n5 3 8\n21", expectedOutput: "0", points: 1 }]),

p("Find the Median of a BST", "Trees", "Medium", ["Tree", "BST"],
  "Given a binary search tree with n nodes, print its median value: if n is odd, print the single middle value of the sorted values; if n is even, print the average of the two middle values (guaranteed to be a whole number in every test case here).",
  "1 <= number of nodes <= 10^5",
  "Input:\n5 3 8 1 4 N N\nOutput:\n4",
  ["An inorder traversal of a BST visits its values in ascending order - the median is just the middle of that sequence (or the average of the two middle entries for an even count).", "You don't need to build an explicit array first if you want O(1) extra space: a Morris inorder traversal lets you find the nth/2-th value without recursion or a stack.", "For an odd count n, the median sits at 0-indexed position n/2 (integer division) in the sorted sequence."],
  [{ input: "5 3 8 1 4 N N", expectedOutput: "4", explanation: "" },
   { input: "5 3 8 1", expectedOutput: "4", explanation: "Sorted values are 1, 3, 5, 8; the two middle values 3 and 5 average to 4." }],
  [{ input: "5", expectedOutput: "5", points: 1 },
   { input: "5 3 8", expectedOutput: "5", points: 1 },
   { input: "6 2 10 N 4 8 12", expectedOutput: "7", points: 1 }]),

p("Count BST Nodes in a Given Range", "Trees", "Easy", ["Tree", "BST"],
  `Given a binary search tree and two integers low and high, count how many nodes have a value between low and high, inclusive, and print that count. ${TREE_FORMAT} low and high are given on the next line.`,
  "1 <= number of nodes <= 10^5",
  "Input:\n8 3 10 1 6 N 14 N N 4 7\n3 8\nOutput:\n5",
  ["You don't need to visit every node - if a node's value is less than low, its entire left subtree is also out of range and can be skipped; if it's greater than high, its entire right subtree can be skipped.", "This lets the search prune large parts of the tree, running much faster than a plain traversal on a well-balanced tree.", "A node exactly equal to low or high still counts, since the range is inclusive on both ends."],
  [{ input: "8 3 10 1 6 N 14 N N 4 7\n3 8", expectedOutput: "5", explanation: "" },
   { input: "8 3 10 1 6 N 14 N N 4 7\n0 100", expectedOutput: "8", explanation: "" }],
  [{ input: "5\n1 4", expectedOutput: "0", points: 1 },
   { input: "5\n5 5", expectedOutput: "1", points: 1 },
   { input: "5 3 8 1 4 N N\n2 6", expectedOutput: "3", points: 1 }]),

p("Replace Every Element With the Least Greater Element on Its Right", "Trees", "Hard", ["Tree", "BST", "Set"],
  "Given an array of n integers, replace every element with the smallest element to its right that is strictly greater than it, or -1 if no such element exists. Print the resulting array, space-separated. The first line has n, the second line has the array.",
  "1 <= n <= 10^5",
  "Input:\n15\n8 58 71 18 31 32 63 92 43 3 91 93 25 80 28\nOutput:\n18 63 80 25 32 43 80 93 80 25 93 -1 28 -1 -1",
  ["Process the array from right to left, maintaining a sorted structure (a balanced BST or an ordered set) of everything seen so far to its right.", "For the current element, its answer is the smallest value greater than it in that structure - a 'find the successor' query - after which the current element itself gets inserted for elements further to the left.", "This is exactly why the technique is filed under BSTs: each query and insert takes O(log n) using a self-balancing BST (or an ordered-set structure with equivalent guarantees), instead of O(n) per element with a naive scan."],
  [{ input: "15\n8 58 71 18 31 32 63 92 43 3 91 93 25 80 28", expectedOutput: "18 63 80 25 32 43 80 93 80 25 93 -1 28 -1 -1", explanation: "" },
   { input: "3\n1 2 3", expectedOutput: "2 3 -1", explanation: "" }],
  [{ input: "1\n5", expectedOutput: "-1", points: 1 },
   { input: "3\n3 2 1", expectedOutput: "-1 -1 -1", points: 1 },
   { input: "7\n2 7 3 5 4 6 8", expectedOutput: "3 8 4 6 6 8 -1", points: 1 }]),

p("Find All Conflicting Appointments", "Trees", "Hard", ["Tree", "BST", "Intervals"],
  "Given n appointments, each with a start and end time, find every appointment that overlaps with at least one appointment that came before it in the input order (two appointments [s1,e1) and [s2,e2) overlap when s1 < e2 and s2 < e1). Print each conflicting appointment, in input order, as 'start end' on its own line; if none conflict, print 'None'. The first line has n; each of the next n lines has one appointment's start and end.",
  "1 <= n <= 10^4",
  "Input:\n6\n1 5\n3 7\n2 6\n10 15\n5 6\n4 100\nOutput:\n3 7\n2 6\n5 6\n4 100",
  ["Insert appointments one at a time into a BST ordered by start time; before inserting each new appointment, check it against the appointments already in the tree for an overlap.", "A new appointment [s, e) conflicts with an existing one [s2, e2) exactly when s < e2 and s2 < e - checking this only requires comparing against intervals whose start could plausibly overlap, which a BST search narrows down quickly.", "An appointment only needs to be reported once, as soon as any conflict with an earlier appointment is found - it doesn't need to be checked against every single earlier appointment if one conflict is already enough to report it."],
  [{ input: "6\n1 5\n3 7\n2 6\n10 15\n5 6\n4 100", expectedOutput: "3 7\n2 6\n5 6\n4 100", explanation: "" },
   { input: "2\n1 5\n6 10", expectedOutput: "None", explanation: "" }],
  [{ input: "1\n1 10", expectedOutput: "None", points: 1 },
   { input: "3\n1 4\n2 5\n7 9", expectedOutput: "2 5", points: 1 },
   { input: "4\n5 10\n1 3\n4 6\n11 20", expectedOutput: "4 6", points: 1 }]),

p("Check if a Given Sequence Could Be a Valid BST Preorder", "Trees", "Medium", ["Tree", "BST", "Stack"],
  "Given a sequence of n distinct integers, print 'Yes' if it could be the preorder traversal of some valid binary search tree, otherwise print 'No'.",
  "1 <= n <= 10^5, all values distinct",
  "Input:\n40 30 35 80 100\nOutput:\nYes",
  ["Use a stack while scanning left to right, along with a running lower bound (initially minus infinity): a value smaller than the current lower bound immediately disqualifies the sequence.", "Whenever the current value is greater than the stack's top, keep popping (each pop means that popped value's right subtree has been fully closed off) and raise the lower bound to the last popped value, since everything from now on must be greater than that node.", "Then push the current value. If you get through the whole sequence without a value ever violating the lower bound, it's a valid BST preorder."],
  [{ input: "40 30 35 80 100", expectedOutput: "Yes", explanation: "" },
   { input: "40 30 35 20 80", expectedOutput: "No", explanation: "20 would need to be greater than 30 (having closed off 30's subtree) yet also less than 35 - impossible." }],
  [{ input: "5", expectedOutput: "Yes", points: 1 },
   { input: "10 5 1 7 40 50", expectedOutput: "Yes", points: 1 },
   { input: "10 5 20 15 25", expectedOutput: "Yes", points: 1 }]),

p("Check Whether a BST Contains a Dead End", "Trees", "Medium", ["Tree", "BST"],
  `Given a binary search tree containing only positive integers, print 'Yes' if it has a 'dead end' - a leaf value L such that no new node could ever be inserted as its child without breaking the BST property (this happens exactly when L is sandwiched with no room to spare: the tightest lower bound allowed at L is L-1 and the tightest upper bound is L+1) - otherwise print 'No'. ${TREE_FORMAT}`,
  "1 <= number of nodes <= 10^5, all values are positive integers",
  "Input:\n8 3 10 1 6 N 14 N N 4 7\nOutput:\nYes",
  ["Track a valid (low, high) range for every node as you descend, exactly like validating a BST, starting from (0, infinity) at the root.", "A leaf is a dead end exactly when its value minus its range's low bound equals 1 AND its range's high bound minus its value equals 1 - meaning there's no integer left in either gap to insert.", "Only leaves can ever be dead ends, since any internal node already has at least one child using up part of its range."],
  [{ input: "8 3 10 1 6 N 14 N N 4 7", expectedOutput: "Yes", explanation: "The leaf valued 7 has range (6, 8) - no integer fits strictly between 6 and 7, or between 7 and 8." },
   { input: "8 5 N N N", expectedOutput: "No", explanation: "" }],
  [{ input: "5", expectedOutput: "No", points: 1 },
   { input: "1 N 2", expectedOutput: "No", points: 1 },
   { input: "3 2 N 1", expectedOutput: "Yes", points: 1 }]),

p("Find the Largest BST Subtree in a Binary Tree", "Trees", "Hard", ["Tree", "BST", "Recursion"],
  `Given an arbitrary binary tree, find the largest subtree (by node count) that is itself a valid binary search tree, and print its size. ${TREE_FORMAT}`,
  "1 <= number of nodes <= 10^5",
  "Input:\n4 2 6 1 3 5 7\nOutput:\n7",
  ["Process the tree bottom-up: for each node, determine whether its ENTIRE subtree is a valid BST, and if so, what its min and max values are (needed by its parent's own check).", "A node's subtree is a valid BST exactly when both children's subtrees are valid BSTs AND the node's value is greater than its left subtree's max and less than its right subtree's min.", "Even where a node's own subtree fails the BST check, its children's subtrees might still individually be valid BSTs - keep a running maximum size across every node checked, not just the root."],
  [{ input: "4 2 6 1 3 5 7", expectedOutput: "7", explanation: "The whole tree is already a valid BST." },
   { input: "4 2 6 1 3 7 5", expectedOutput: "3", explanation: "Node 6's subtree (6, left 7, right 5) breaks the BST property, so the largest valid BST left is the left subtree rooted at 2 (values 1, 2, 3)." }],
  [{ input: "5", expectedOutput: "1", points: 1 },
   { input: "8 3 10 1 6 N 14 N N 4 7", expectedOutput: "8", points: 1 },
   { input: "10 5 20 1 8 15 25 N N 6 9", expectedOutput: "9", points: 1 }]),

p("Flatten a BST to a Sorted (Right-Skewed) List", "Trees", "Medium", ["Tree", "BST"],
  `Given a binary search tree, rearrange it in place into a right-skewed chain - every node's left child is empty, and following right children visits every value in ascending order - and print the result using level-order tokens. ${TREE_OUTPUT} ${TREE_FORMAT}`,
  "1 <= number of nodes <= 10^5",
  "Input:\n5 3 8 1 4 N N\nOutput:\n1 N 3 N 4 N 5 N 8",
  ["An inorder traversal already visits a BST's values in ascending order - that traversal order is exactly the order the final right-skewed chain should follow.", "Build the chain by linking each value's node to the next value's node as its right child, with every left child left empty.", "Serializing a right-skewed chain naturally alternates value, N, value, N, ... in level order, since each node's left slot is always empty but isn't at the very end of the output until the very last node."],
  [{ input: "5 3 8 1 4 N N", expectedOutput: "1 N 3 N 4 N 5 N 8", explanation: "" },
   { input: "5", expectedOutput: "5", explanation: "" }],
  [{ input: "5 3 8", expectedOutput: "3 N 5 N 8", points: 1 },
   { input: "3 2 N 1", expectedOutput: "1 N 2 N 3", points: 1 },
   { input: "8 3 10 1 6 N 14 N N 4 7", expectedOutput: "1 N 3 N 4 N 6 N 7 N 8 N 10 N 14", points: 1 }]),

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
console.log(`BINARY SEARCH TREES topic (part 2): created ${created} problem(s), skipped ${skipped} already-existing.`);
