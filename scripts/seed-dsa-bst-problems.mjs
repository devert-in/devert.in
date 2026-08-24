import admin from "firebase-admin";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(join(__dirname, "service-account.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// DSA-450-sheet ingestion, BINARY SEARCH TREES topic. Reuses the same
// level-order/'N' tree convention as the Binary Trees batch. Rows needing an
// exact structural output additionally state that trailing 'N' tokens (at
// the very end of the printed sequence) should be omitted, matching how the
// *input* is allowed to run out early. Rows with no clean, unambiguous
// output (largest-BST-in-a-binary-tree, in-place BST balancing) are skipped.

const REWARD = { Easy: [30, 10], Medium: [50, 20], Hard: [80, 30] };
function p(title, category, difficulty, tags, statement, constraints, examplesText, hints, sampleTests, hiddenTests) {
  const [xpReward, coinReward] = REWARD[difficulty];
  return { title, category, difficulty, tags, statement, constraints, examplesText, hints, xpReward, coinReward, sampleTests, hiddenTests };
}

const TREE_FORMAT = "The tree is given as space-separated level-order tokens, where 'N' means no node there: the first token is the root, then for each node dequeued in level order you read its left-child token then its right-child token (if input runs out early, remaining children are treated as N).";
const TREE_OUTPUT = "Print the resulting tree the same way (level order, 'N' for absent children), but omit any trailing 'N' tokens at the very end of your output.";

const PROBLEMS = [

p("Insert a Node Into a Binary Search Tree", "Trees", "Easy", ["Tree", "BST"],
  `Given a binary search tree and a value to insert, insert it (as a new leaf, following BST ordering) and print the inorder traversal of the resulting tree, space-separated. ${TREE_FORMAT} The value to insert is given on the next line.`,
  "1 <= number of nodes <= 10^5",
  "Input:\n5 3 8\n1\nOutput:\n1 3 5 8",
  ["Walk down from the root: go left if the new value is smaller than the current node, right if larger, until you reach a missing child - that's where the new node attaches.", "Since a BST's inorder traversal is always its values in sorted order, the correct final answer is simply all original values plus the new one, sorted."],
  [{ input: "5 3 8\n1", expectedOutput: "1 3 5 8", explanation: "" },
   { input: "5\n3", expectedOutput: "3 5", explanation: "" }],
  [{ input: "5\n8", expectedOutput: "5 8", points: 1 },
   { input: "5 3 8 1 4 N N\n6", expectedOutput: "1 3 4 5 6 8", points: 1 },
   { input: "8 3 10 1 6 N 14 4 7\n5", expectedOutput: "1 3 4 5 6 7 8 10 14", points: 1 }]),

p("Delete a Node From a Binary Search Tree", "Trees", "Medium", ["Tree", "BST"],
  `Given a binary search tree and a value to delete, delete the node with that value (it is guaranteed to exist) and print the inorder traversal of the resulting tree, space-separated. If the tree becomes empty, print 'EMPTY'. ${TREE_FORMAT} The value to delete is given on the next line.`,
  "1 <= number of nodes <= 10^5",
  "Input:\n5 3 8 1 4 N N\n3\nOutput:\n1 4 5 8",
  ["Deleting a leaf is trivial - just remove it.", "Deleting a node with two children: replace its value with its inorder successor (the smallest value in its right subtree), then delete that successor node instead (which has at most one child)."],
  [{ input: "5 3 8 1 4 N N\n3", expectedOutput: "1 4 5 8", explanation: "" },
   { input: "5 3 8\n8", expectedOutput: "3 5", explanation: "" }],
  [{ input: "5\n5", expectedOutput: "EMPTY", points: 1 },
   { input: "5 3 8\n3", expectedOutput: "5 8", points: 1 },
   { input: "8 3 10 1 6 N 14 4 7\n6", expectedOutput: "1 3 4 7 8 10 14", points: 1 }]),

p("Find the Minimum and Maximum Value in a BST", "Trees", "Easy", ["Tree", "BST"],
  `Given a binary search tree, print its minimum value and its maximum value as 'min max'. ${TREE_FORMAT}`,
  "1 <= number of nodes <= 10^5",
  "Input:\n8 3 10 1 6 N 14 4 7\nOutput:\n1 14",
  ["The minimum value is found by walking left from the root until there's no left child left.", "The maximum value is found the same way, walking right instead."],
  [{ input: "8 3 10 1 6 N 14 4 7", expectedOutput: "1 14", explanation: "" },
   { input: "5 3 8", expectedOutput: "3 8", explanation: "" }],
  [{ input: "5", expectedOutput: "5 5", points: 1 },
   { input: "5 3 8 1 4 N N", expectedOutput: "1 8", points: 1 },
   { input: "10 5 15 2 7 12 20", expectedOutput: "2 20", points: 1 }]),

p("Find the Inorder Successor of a Node in a BST", "Trees", "Medium", ["Tree", "BST"],
  `Given a binary search tree and a value that is guaranteed to exist in it, find its inorder successor - the next larger value in the tree. Print that value, or -1 if the given value is the maximum in the tree. ${TREE_FORMAT} The value is given on the next line.`,
  "1 <= number of nodes <= 10^5",
  "Input:\n8 3 10 1 6 N 14 4 7\n6\nOutput:\n7",
  ["If the node has a right subtree, its successor is the minimum value in that right subtree.", "If it has no right subtree, its successor is the nearest ancestor for which this node lies in the left subtree - found by walking down from the root and remembering the last node you turned right at."],
  [{ input: "8 3 10 1 6 N 14 4 7\n6", expectedOutput: "7", explanation: "" },
   { input: "8 3 10 1 6 N 14 4 7\n14", expectedOutput: "-1", explanation: "" }],
  [{ input: "8 3 10 1 6 N 14 4 7\n1", expectedOutput: "3", points: 1 },
   { input: "5 3 8\n3", expectedOutput: "5", points: 1 },
   { input: "5 3 8\n8", expectedOutput: "-1", points: 1 }]),

p("Check if a Binary Tree Is a Valid BST", "Trees", "Medium", ["Tree", "BST"],
  `Given a binary tree, print 'Yes' if it satisfies the binary search tree property (every node's value is strictly greater than every value in its left subtree and strictly less than every value in its right subtree), otherwise print 'No'. ${TREE_FORMAT}`,
  "1 <= number of nodes <= 10^5",
  "Input:\n8 3 10 1 6 N 14 4 7\nOutput:\nYes",
  ["Checking that a node's immediate children are smaller/larger isn't enough - a node deep in the left subtree could still violate the root's bound.", "Recurse with a valid (low, high) range for each node, tightening the range as you descend."],
  [{ input: "8 3 10 1 6 N 14 4 7", expectedOutput: "Yes", explanation: "" },
   { input: "5 8 3", expectedOutput: "No", explanation: "" }],
  [{ input: "5", expectedOutput: "Yes", points: 1 },
   { input: "5 3 8 1 4 N N", expectedOutput: "Yes", points: 1 },
   { input: "10 5 15 2 7 6 20", expectedOutput: "No", points: 1 }]),

p("Find the Lowest Common Ancestor of Two Nodes in a BST", "Trees", "Medium", ["Tree", "BST"],
  `Given a binary search tree and two values p and q that both exist in it, find their lowest common ancestor and print its value. ${TREE_FORMAT} p and q are given on the next line.`,
  "1 <= number of nodes <= 10^5",
  "Input:\n8 3 10 1 6 N 14 4 7\n4 7\nOutput:\n6",
  ["Starting from the root, if both p and q are smaller than the current node, move left; if both are larger, move right.", "The first node where p and q fall on different sides (or the node equals one of them) is the LCA - no need to search both subtrees like in a general binary tree."],
  [{ input: "8 3 10 1 6 N 14 4 7\n4 7", expectedOutput: "6", explanation: "" },
   { input: "8 3 10 1 6 N 14 4 7\n1 14", expectedOutput: "8", explanation: "" }],
  [{ input: "8 3 10 1 6 N 14 4 7\n4 6", expectedOutput: "6", points: 1 },
   { input: "5 3 8\n3 8", expectedOutput: "5", points: 1 },
   { input: "5 3 8 1 4 N N\n1 4", expectedOutput: "3", points: 1 }]),

p("Construct a BST From a Preorder Traversal", "Trees", "Medium", ["Tree", "BST", "Recursion"],
  `Given the preorder traversal of a binary search tree (n distinct values, space-separated), reconstruct the tree and print it using level-order tokens. ${TREE_OUTPUT}`,
  "1 <= n <= 10^5, all values distinct",
  "Input:\n8 3 1 6 4 7 10 14\nOutput:\n8 3 10 1 6 N 14 4 7",
  ["The first value is always the root. Every following value less than the root belongs to the left subtree; every value greater belongs to the right subtree - and within each side, the relative order is already a valid preorder for that subtree.", "Recurse on the left group and the right group the same way."],
  [{ input: "8 3 1 6 4 7 10 14", expectedOutput: "8 3 10 1 6 N 14 4 7", explanation: "" },
   { input: "5", expectedOutput: "5", explanation: "" }],
  [{ input: "5 3 8", expectedOutput: "5 3 8", points: 1 },
   { input: "3 1 2", expectedOutput: "3 1 N N 2", points: 1 },
   { input: "10 5 15 2 7 12 20", expectedOutput: "10 5 15 2 7 12 20", points: 1 }]),

p("Convert a Sorted Array Into a Height-Balanced BST", "Trees", "Medium", ["Tree", "BST", "Recursion"],
  `Given a sorted array of n distinct integers, build a height-balanced BST from it and print it using level-order tokens. Build it with this exact rule: for the current sub-range [lo, hi] (0-indexed, inclusive), the root is the element at index floor((lo+hi)/2), the left subtree is built the same way from [lo, mid-1], and the right subtree from [mid+1, hi]. ${TREE_OUTPUT}`,
  "1 <= n <= 10^5",
  "Input:\n7\n1 2 3 4 5 6 7\nOutput:\n4 2 6 1 3 5 7",
  ["Recursively pick the middle element of the current range as the root, then recurse on the left half and the right half.", "Follow the floor((lo+hi)/2) rule exactly - for even-length ranges this consistently picks the lower-middle element, which matters for getting an exact match."],
  [{ input: "7\n1 2 3 4 5 6 7", expectedOutput: "4 2 6 1 3 5 7", explanation: "" },
   { input: "3\n1 2 3", expectedOutput: "2 1 3", explanation: "" }],
  [{ input: "1\n5", expectedOutput: "5", points: 1 },
   { input: "2\n1 2", expectedOutput: "1 N 2", points: 1 },
   { input: "4\n1 2 3 4", expectedOutput: "2 1 3 N 4", points: 1 }]),

p("Merge Two BSTs Into One", "Trees", "Medium", ["Tree", "BST"],
  "Given two binary search trees, combine all of their values into a single sorted sequence and print it, space-separated (duplicate values across the two trees are both kept). Each tree is given as its own line of level-order tokens (the shared level-order/'N' convention from other BST problems applies to both).",
  "1 <= number of nodes in each tree <= 10^5",
  "Input:\n5 3 8\n2 1 4\nOutput:\n1 2 3 4 5 8",
  ["Get the inorder traversal of each tree individually (each is already sorted).", "Merge the two sorted sequences the same way you'd merge two sorted arrays or linked lists."],
  [{ input: "5 3 8\n2 1 4", expectedOutput: "1 2 3 4 5 8", explanation: "" },
   { input: "5\n3", expectedOutput: "3 5", explanation: "" }],
  [{ input: "5\n5", expectedOutput: "5 5", points: 1 },
   { input: "3 1 5\n10", expectedOutput: "1 3 5 10", points: 1 },
   { input: "8 3 10 1 6 N 14 4 7\n5 3 8", expectedOutput: "1 3 3 4 6 7 8 8 10 14", points: 1 }]),

p("Find the Kth Smallest Element in a BST", "Trees", "Medium", ["Tree", "BST"],
  `Given a binary search tree and a value k, print the kth smallest value in the tree (1-indexed). ${TREE_FORMAT} k is given on the next line.`,
  "1 <= k <= number of nodes <= 10^5",
  "Input:\n8 3 10 1 6 N 14 4 7\n3\nOutput:\n4",
  ["An inorder traversal of a BST visits values in ascending order - the kth value visited is the answer.", "You can stop the traversal early as soon as you've visited k nodes, without needing to complete it."],
  [{ input: "8 3 10 1 6 N 14 4 7\n3", expectedOutput: "4", explanation: "" },
   { input: "8 3 10 1 6 N 14 4 7\n1", expectedOutput: "1", explanation: "" }],
  [{ input: "5\n1", expectedOutput: "5", points: 1 },
   { input: "5 3 8\n2", expectedOutput: "5", points: 1 },
   { input: "8 3 10 1 6 N 14 4 7\n8", expectedOutput: "14", points: 1 }]),

p("Find the Closest Value to a Target in a BST", "Trees", "Medium", ["Tree", "BST"],
  `Given a binary search tree and a target value, find the value in the tree closest to the target. If two values are equally close, print the smaller one. ${TREE_FORMAT} The target is given on the next line.`,
  "1 <= number of nodes <= 10^5",
  "Input:\n8 3 10 1 6 N 14 4 7\n5\nOutput:\n4",
  ["Walk from the root, tracking the best (closest) value seen so far, moving left or right based on the standard BST comparison with the target.", "You never need to explore both children of a node - the BST property guarantees the closer value is always on one specific side."],
  [{ input: "8 3 10 1 6 N 14 4 7\n5", expectedOutput: "4", explanation: "4 and 6 are equally close (distance 1); 4 is smaller." },
   { input: "8 3 10 1 6 N 14 4 7\n9", expectedOutput: "8", explanation: "" }],
  [{ input: "5\n100", expectedOutput: "5", points: 1 },
   { input: "5 3 8\n4", expectedOutput: "3", points: 1 },
   { input: "8 3 10 1 6 N 14 4 7\n14", expectedOutput: "14", points: 1 }]),

p("Find a Pair With a Given Sum in a BST", "Trees", "Medium", ["Tree", "BST"],
  `Given a binary search tree and a target sum, print 'Yes' if two distinct nodes exist whose values add up to the target, otherwise print 'No'. ${TREE_FORMAT} The target is given on the next line.`,
  "1 <= number of nodes <= 10^5",
  "Input:\n8 3 10 1 6 N 14 4 7\n11\nOutput:\nYes",
  ["An inorder traversal gives you the values in sorted order - from there this is the classic two-pointer 'pair with given sum in a sorted array' problem.", "A hash set also works: walk the tree once, and for each value check whether (target - value) has already been seen."],
  [{ input: "8 3 10 1 6 N 14 4 7\n11", expectedOutput: "Yes", explanation: "1 + 10 = 11." },
   { input: "8 3 10 1 6 N 14 4 7\n100", expectedOutput: "No", explanation: "" }],
  [{ input: "5\n10", expectedOutput: "No", points: 1 },
   { input: "5 3 8\n8", expectedOutput: "Yes", points: 1 },
   { input: "5 3 8\n20", expectedOutput: "No", points: 1 }]),

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
console.log(`BINARY SEARCH TREES topic: created ${created} problem(s), skipped ${skipped} already-existing.`);
