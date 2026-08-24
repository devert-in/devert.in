import admin from "firebase-admin";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(join(__dirname, "service-account.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// DSA-450-sheet ingestion, BINARY TREES topic. Every problem shares the same
// tree input convention (stated in each problem too, since students see only
// one problem at a time): the tree is given as a level-order list of tokens
// where 'N' means "no node here"; the first token is the root, then for each
// node dequeued in level order you read its left-child token and right-child
// token (unless the input runs out first, in which case remaining children
// are implicitly N). Rows needing real node-identity or highly
// implementation-specific output shapes (convert-tree-in-place, vertical
// order with tie-break ambiguity) are skipped in favor of well-defined ones.

const REWARD = { Easy: [30, 10], Medium: [50, 20], Hard: [80, 30] };
function p(title, category, difficulty, tags, statement, constraints, examplesText, hints, sampleTests, hiddenTests) {
  const [xpReward, coinReward] = REWARD[difficulty];
  return { title, category, difficulty, tags, statement, constraints, examplesText, hints, xpReward, coinReward, sampleTests, hiddenTests };
}

const TREE_FORMAT = "The tree is given as space-separated level-order tokens, where 'N' means no node there: the first token is the root, then for each node dequeued in level order you read its left-child token then its right-child token (if input runs out early, remaining children are treated as N).";

const PROBLEMS = [

p("Height of a Binary Tree", "Trees", "Easy", ["Tree"],
  `Given a binary tree, print its height, counted as the number of nodes on the longest path from the root to any leaf (a single-node tree has height 1). ${TREE_FORMAT}`,
  "1 <= number of nodes <= 10^5",
  "Input:\n1 2 3 4 N 5 6\nOutput:\n3",
  ["height(node) = 1 + max(height(left), height(right)); an empty subtree contributes height 0.", "This is a straightforward post-order recursion."],
  [{ input: "1 2 3 4 N 5 6", expectedOutput: "3", explanation: "" },
   { input: "5", expectedOutput: "1", explanation: "" }],
  [{ input: "1 N 2", expectedOutput: "2", points: 1 },
   { input: "1 2 3", expectedOutput: "2", points: 1 },
   { input: "1 2 3 4 5 6 7", expectedOutput: "3", points: 1 }]),

p("Level Order Traversal of a Binary Tree", "Trees", "Easy", ["Tree", "Queue"],
  `Given a binary tree, print the values of its nodes in level order (breadth-first, top to bottom, left to right within a level), space-separated. ${TREE_FORMAT}`,
  "1 <= number of nodes <= 10^5",
  "Input:\n1 2 3 4 N 5 6\nOutput:\n1 2 3 4 5 6",
  ["Use a queue: dequeue a node, print it, enqueue its non-null children.", "'N' tokens represent absent nodes and should never themselves be printed or enqueued."],
  [{ input: "1 2 3 4 N 5 6", expectedOutput: "1 2 3 4 5 6", explanation: "" },
   { input: "5", expectedOutput: "5", explanation: "" }],
  [{ input: "1 N 2", expectedOutput: "1 2", points: 1 },
   { input: "1 2 3", expectedOutput: "1 2 3", points: 1 },
   { input: "1 2 3 4 5 6 7", expectedOutput: "1 2 3 4 5 6 7", points: 1 }]),

p("Diameter of a Binary Tree", "Trees", "Medium", ["Tree"],
  `Given a binary tree, find its diameter - the number of nodes on the longest path between any two nodes in the tree (the path may or may not pass through the root). ${TREE_FORMAT}`,
  "1 <= number of nodes <= 10^5",
  "Input:\n1 2 3 4 N 5 6\nOutput:\n5",
  ["For every node, the longest path through it equals height(left subtree) + height(right subtree) + 1.", "Compute heights bottom-up in a single pass, tracking the best combined value seen at any node."],
  [{ input: "1 2 3 4 N 5 6", expectedOutput: "5", explanation: "4-2-1-3-5 (or 4-2-1-3-6)." },
   { input: "5", expectedOutput: "1", explanation: "" }],
  [{ input: "1 N 2", expectedOutput: "2", points: 1 },
   { input: "1 2 3", expectedOutput: "3", points: 1 },
   { input: "1 2 3 4 5 6 7", expectedOutput: "5", points: 1 }]),

p("Mirror a Binary Tree", "Trees", "Medium", ["Tree"],
  `Given a binary tree, swap the left and right child of every node (mirror it), then print the resulting tree using the same level-order token format as the input. ${TREE_FORMAT} Print the mirrored tree the same way: level order, 'N' for absent nodes, omitting trailing children once no printed node in the queue has any children left to show.`,
  "1 <= number of nodes <= 10^5",
  "Input:\n1 2 3 4 N 5 6\nOutput:\n1 3 2 6 5 N 4",
  ["Recursively swap every node's left and right subtree.", "Serialize the result with the exact same level-order/'N' convention used for the input."],
  [{ input: "1 2 3 4 N 5 6", expectedOutput: "1 3 2 6 5 N 4", explanation: "" },
   { input: "5", expectedOutput: "5", explanation: "" }],
  [{ input: "1 N 2", expectedOutput: "1 2", points: 1 },
   { input: "1 2 3", expectedOutput: "1 3 2", points: 1 },
   { input: "1 2 3 4 5 6 7", expectedOutput: "1 3 2 7 6 5 4", points: 1 }]),

p("Inorder Traversal of a Binary Tree", "Trees", "Easy", ["Tree"],
  `Given a binary tree, print its inorder traversal (left subtree, then the node, then right subtree), space-separated. ${TREE_FORMAT}`,
  "1 <= number of nodes <= 10^5",
  "Input:\n1 2 3 4 N 5 6\nOutput:\n4 2 1 5 3 6",
  ["Recursively visit the left subtree, then the current node, then the right subtree.", "An iterative version uses an explicit stack, pushing left children until null, then visiting and moving right."],
  [{ input: "1 2 3 4 N 5 6", expectedOutput: "4 2 1 5 3 6", explanation: "" },
   { input: "5", expectedOutput: "5", explanation: "" }],
  [{ input: "1 N 2", expectedOutput: "1 2", points: 1 },
   { input: "1 2 3", expectedOutput: "2 1 3", points: 1 },
   { input: "1 2 3 4 5 6 7", expectedOutput: "4 2 5 1 6 3 7", points: 1 }]),

p("Preorder Traversal of a Binary Tree", "Trees", "Easy", ["Tree"],
  `Given a binary tree, print its preorder traversal (the node, then its left subtree, then its right subtree), space-separated. ${TREE_FORMAT}`,
  "1 <= number of nodes <= 10^5",
  "Input:\n1 2 3 4 N 5 6\nOutput:\n1 2 4 3 5 6",
  ["Recursively visit the current node first, then the left subtree, then the right subtree.", "An iterative version uses an explicit stack, pushing right child then left child so left is processed first."],
  [{ input: "1 2 3 4 N 5 6", expectedOutput: "1 2 4 3 5 6", explanation: "" },
   { input: "5", expectedOutput: "5", explanation: "" }],
  [{ input: "1 N 2", expectedOutput: "1 2", points: 1 },
   { input: "1 2 3", expectedOutput: "1 2 3", points: 1 },
   { input: "1 2 3 4 5 6 7", expectedOutput: "1 2 4 5 3 6 7", points: 1 }]),

p("Postorder Traversal of a Binary Tree", "Trees", "Easy", ["Tree"],
  `Given a binary tree, print its postorder traversal (left subtree, then right subtree, then the node), space-separated. ${TREE_FORMAT}`,
  "1 <= number of nodes <= 10^5",
  "Input:\n1 2 3 4 N 5 6\nOutput:\n4 2 5 6 3 1",
  ["Recursively visit the left subtree, then the right subtree, then the current node.", "The node itself is always the last thing printed for its own subtree."],
  [{ input: "1 2 3 4 N 5 6", expectedOutput: "4 2 5 6 3 1", explanation: "" },
   { input: "5", expectedOutput: "5", explanation: "" }],
  [{ input: "1 N 2", expectedOutput: "2 1", points: 1 },
   { input: "1 2 3", expectedOutput: "2 3 1", points: 1 },
   { input: "1 2 3 4 5 6 7", expectedOutput: "4 5 2 6 7 3 1", points: 1 }]),

p("Check if Two Binary Trees Are Identical", "Trees", "Easy", ["Tree"],
  `Given two binary trees (each in level-order token format), print 'Yes' if they have the exact same structure and the exact same value at every corresponding node, otherwise print 'No'. ${TREE_FORMAT} Both trees are given, one per line.`,
  "1 <= number of nodes in each tree <= 10^5",
  "Input:\n1 2 3\n1 2 3\nOutput:\nYes",
  ["Recursively compare both trees node by node: values must match, and both left subtrees must match, and both right subtrees must match.", "Two null nodes are 'identical'; a null compared against a real node is not."],
  [{ input: "1 2 3\n1 2 3", expectedOutput: "Yes", explanation: "" },
   { input: "1 2 3\n1 3 2", expectedOutput: "No", explanation: "" }],
  [{ input: "5\n5", expectedOutput: "Yes", points: 1 },
   { input: "1 2 N\n1 N 2", expectedOutput: "No", points: 1 },
   { input: "1 2 3 4 N 5 6\n1 2 3 4 N 5 6", expectedOutput: "Yes", points: 1 }]),

p("Left View of a Binary Tree", "Trees", "Medium", ["Tree", "Queue"],
  `Given a binary tree, print its left view - the leftmost node visible at every level, from top to bottom, space-separated. ${TREE_FORMAT}`,
  "1 <= number of nodes <= 10^5",
  "Input:\n1 2 3 4 N 5 6\nOutput:\n1 2 4",
  ["Do a level-order traversal and, for each level, take the first node processed in that level.", "A recursive approach also works: track the maximum depth visited so far, and print a node the first time its depth is reached while doing a left-first preorder walk."],
  [{ input: "1 2 3 4 N 5 6", expectedOutput: "1 2 4", explanation: "" },
   { input: "5", expectedOutput: "5", explanation: "" }],
  [{ input: "1 N 2", expectedOutput: "1 2", points: 1 },
   { input: "1 2 3", expectedOutput: "1 2", points: 1 },
   { input: "1 2 3 4 5 6 7", expectedOutput: "1 2 4", points: 1 }]),

p("Right View of a Binary Tree", "Trees", "Medium", ["Tree", "Queue"],
  `Given a binary tree, print its right view - the rightmost node visible at every level, from top to bottom, space-separated. ${TREE_FORMAT}`,
  "1 <= number of nodes <= 10^5",
  "Input:\n1 2 3 4 N 5 6\nOutput:\n1 3 6",
  ["Do a level-order traversal and, for each level, take the last node processed in that level.", "A recursive approach also works: walk right-first, and print a node the first time its depth is reached."],
  [{ input: "1 2 3 4 N 5 6", expectedOutput: "1 3 6", explanation: "" },
   { input: "5", expectedOutput: "5", explanation: "" }],
  [{ input: "1 N 2", expectedOutput: "1 2", points: 1 },
   { input: "1 2 3", expectedOutput: "1 3", points: 1 },
   { input: "1 2 3 4 5 6 7", expectedOutput: "1 3 7", points: 1 }]),

p("Top View of a Binary Tree", "Trees", "Medium", ["Tree", "Hashing"],
  `Assign every node a horizontal distance (hd): the root has hd 0, a left child has hd = parent's hd - 1, a right child has hd = parent's hd + 1. Given a binary tree, for every distinct horizontal distance that occurs, print the value of the topmost (smallest-depth) node at that distance; if several nodes share both the smallest depth and the same hd, use whichever is encountered first in level order. Print the values ordered by ascending horizontal distance, space-separated. ${TREE_FORMAT}`,
  "1 <= number of nodes <= 10^5",
  "Input:\n1 2 3 4 N 5 6\nOutput:\n4 2 1 3 6",
  ["Do a level-order traversal, tracking each node's horizontal distance alongside it.", "For each hd, only ever record the first node reached at that hd (level order guarantees the first one seen is topmost - shallowest depth first, ties broken by encounter order)."],
  [{ input: "1 2 3 4 N 5 6", expectedOutput: "4 2 1 3 6", explanation: "" },
   { input: "5", expectedOutput: "5", explanation: "" }],
  [{ input: "1 N 2", expectedOutput: "1 2", points: 1 },
   { input: "1 2 3", expectedOutput: "2 1 3", points: 1 },
   { input: "1 2 3 4 5 6 7", expectedOutput: "4 2 1 3 7", points: 1 }]),

p("Bottom View of a Binary Tree", "Trees", "Medium", ["Tree", "Hashing"],
  `Assign every node a horizontal distance (hd): the root has hd 0, a left child has hd = parent's hd - 1, a right child has hd = parent's hd + 1. Given a binary tree, for every distinct horizontal distance that occurs, print the value of the node that would be seen from directly below - among all nodes at that hd, prefer the greatest depth, and break ties between equally-deep nodes by taking whichever comes later in level order. Print the values ordered by ascending horizontal distance, space-separated. ${TREE_FORMAT}`,
  "1 <= number of nodes <= 10^5",
  "Input:\n1 2 3 4 N 5 6\nOutput:\n4 2 5 3 6",
  ["Do a level-order traversal, tracking each node's horizontal distance alongside it.", "For each hd, keep overwriting your recorded answer with every node you see at that hd as you traverse - since level order visits shallower nodes first, the last write for each hd is automatically the deepest (with later-in-level-order breaking ties)."],
  [{ input: "1 2 3 4 N 5 6", expectedOutput: "4 2 5 3 6", explanation: "" },
   { input: "5", expectedOutput: "5", explanation: "" }],
  [{ input: "1 N 2", expectedOutput: "1 2", points: 1 },
   { input: "1 2 3", expectedOutput: "2 1 3", points: 1 },
   { input: "1 2 3 4 5 6 7", expectedOutput: "4 2 6 3 7", points: 1 }]),

p("Zig-Zag Level Order Traversal", "Trees", "Medium", ["Tree", "Queue"],
  `Given a binary tree, print its nodes level by level, alternating direction each level: the root's level left-to-right, the next level right-to-left, the next left-to-right again, and so on. Print all values in this order, space-separated on one line. ${TREE_FORMAT}`,
  "1 <= number of nodes <= 10^5",
  "Input:\n1 2 3 4 N 5 6\nOutput:\n1 3 2 4 5 6",
  ["Do a normal level-order traversal, collecting each level's values into its own list.", "Reverse every other level's list (based on its depth's parity) before concatenating them all together."],
  [{ input: "1 2 3 4 N 5 6", expectedOutput: "1 3 2 4 5 6", explanation: "" },
   { input: "5", expectedOutput: "5", explanation: "" }],
  [{ input: "1 N 2", expectedOutput: "1 2", points: 1 },
   { input: "1 2 3", expectedOutput: "1 3 2", points: 1 },
   { input: "1 2 3 4 5 6 7", expectedOutput: "1 3 2 4 5 6 7", points: 1 }]),

p("Check if a Binary Tree Is Height-Balanced", "Trees", "Medium", ["Tree"],
  `Given a binary tree, print 'Yes' if it is height-balanced - meaning for every node, the heights of its left and right subtrees differ by at most 1 - otherwise print 'No'. ${TREE_FORMAT}`,
  "1 <= number of nodes <= 10^5",
  "Input:\n1 2 3 4 N 5 6\nOutput:\nYes",
  ["Compute height bottom-up while checking balance at every node in the same pass, so you don't redundantly recompute heights.", "As soon as any subtree is found unbalanced, you can short-circuit and report unbalanced for the whole tree."],
  [{ input: "1 2 3 4 N 5 6", expectedOutput: "Yes", explanation: "" },
   { input: "1 2 N 3 N N N", expectedOutput: "No", explanation: "A left-skewed chain of depth 3 - the root's left subtree has height 2, right has height 0." }],
  [{ input: "5", expectedOutput: "Yes", points: 1 },
   { input: "1 2 3", expectedOutput: "Yes", points: 1 },
   { input: "1 2 3 4 5 6 7", expectedOutput: "Yes", points: 1 }]),

p("Lowest Common Ancestor in a Binary Tree", "Trees", "Medium", ["Tree"],
  `Given a binary tree and two values p and q that are both guaranteed to exist in it, find their lowest common ancestor - the deepest node that has both p and q in its subtree (a node can be its own ancestor). Print that node's value. ${TREE_FORMAT} p and q are given as two more integers after the tree's tokens.`,
  "1 <= number of nodes <= 10^5",
  "Input:\n1 2 3 4 N 5 6\n4 5\nOutput:\n1",
  ["Recursively search each subtree for p and q. If a node's left and right subtree searches each find one of the targets, that node is the LCA.", "If only one subtree contains both targets, the LCA lies within that subtree - recurse into it."],
  [{ input: "1 2 3 4 N 5 6\n4 5", expectedOutput: "1", explanation: "" },
   { input: "1 2 3 4 N 5 6\n4 2", expectedOutput: "2", explanation: "" }],
  [{ input: "1 2 3 4 N 5 6\n5 6", expectedOutput: "3", points: 1 },
   { input: "5\n5 5", expectedOutput: "5", points: 1 },
   { input: "1 2 3 4 5 6 7\n6 7", expectedOutput: "3", points: 1 }]),

p("Maximum Root-to-Leaf Path Sum", "Trees", "Medium", ["Tree"],
  `Given a binary tree, find the maximum sum along any path from the root to a leaf. ${TREE_FORMAT}`,
  "1 <= number of nodes <= 10^5",
  "Input:\n1 2 3 4 N 5 6\nOutput:\n10",
  ["Recursively compute the best root-to-leaf sum for each subtree: a leaf's best sum is its own value, and an internal node's best sum is its value plus the larger of its children's best sums.", "A node with only one child must use that child's path (there's no leaf directly at the missing side)."],
  [{ input: "1 2 3 4 N 5 6", expectedOutput: "10", explanation: "1-3-6 = 10." },
   { input: "5", expectedOutput: "5", explanation: "" }],
  [{ input: "1 N 2", expectedOutput: "3", points: 1 },
   { input: "1 2 3", expectedOutput: "4", points: 1 },
   { input: "1 2 3 4 5 6 7", expectedOutput: "11", points: 1 }]),

p("Construct a Binary Tree From Inorder and Preorder Traversals, Print Its Postorder", "Trees", "Medium", ["Tree", "Recursion"],
  "Given the inorder traversal and the preorder traversal of a binary tree with n distinct values (each on its own input line, space-separated), reconstruct the tree and print its postorder traversal, space-separated.",
  "1 <= n <= 10^5, all n values are distinct",
  "Input:\n4 2 1 5 3 6\n1 2 4 3 5 6\nOutput:\n4 2 5 6 3 1",
  ["The first value of preorder is always the tree's root; find that value's position in inorder to know how many nodes fall in the left subtree versus the right subtree.", "Recurse on the corresponding inorder/preorder slices for the left and right subtrees, then emit the current root last (postorder)."],
  [{ input: "4 2 1 5 3 6\n1 2 4 3 5 6", expectedOutput: "4 2 5 6 3 1", explanation: "" },
   { input: "5\n5", expectedOutput: "5", explanation: "" }],
  [{ input: "2 1 3\n1 2 3", expectedOutput: "2 3 1", points: 1 },
   { input: "1 2\n2 1", expectedOutput: "1 2", points: 1 },
   { input: "4 2 5 1 6 3 7\n1 2 4 5 3 6 7", expectedOutput: "4 5 2 6 7 3 1", points: 1 }]),

p("Check if a Binary Tree Is Symmetric", "Trees", "Medium", ["Tree"],
  `Given a binary tree, print 'Yes' if it is a mirror of itself around its center (symmetric), otherwise print 'No'. ${TREE_FORMAT}`,
  "1 <= number of nodes <= 10^5",
  "Input:\n1 2 2 3 4 4 3\nOutput:\nYes",
  ["Compare the left subtree and the right subtree as mirror images: their root values must match, the left subtree's left must mirror the right subtree's right, and the left subtree's right must mirror the right subtree's left.", "A single node (with no children) is trivially symmetric."],
  [{ input: "1 2 2 3 4 4 3", expectedOutput: "Yes", explanation: "" },
   { input: "1 2 2 N 3 N 3", expectedOutput: "No", explanation: "" }],
  [{ input: "5", expectedOutput: "Yes", points: 1 },
   { input: "1 2 3", expectedOutput: "No", points: 1 },
   { input: "1 2 2", expectedOutput: "Yes", points: 1 }]),

p("Maximum Width of a Binary Tree", "Trees", "Medium", ["Tree", "Queue"],
  `Given a binary tree, find the maximum number of nodes present at any single level, and print that count. ${TREE_FORMAT}`,
  "1 <= number of nodes <= 10^5",
  "Input:\n1 2 3 4 N 5 6\nOutput:\n3",
  ["Do a level-order traversal, counting how many real nodes are dequeued at each level.", "Track and print the largest such count seen across all levels."],
  [{ input: "1 2 3 4 N 5 6", expectedOutput: "3", explanation: "" },
   { input: "5", expectedOutput: "1", explanation: "" }],
  [{ input: "1 N 2", expectedOutput: "1", points: 1 },
   { input: "1 2 3", expectedOutput: "2", points: 1 },
   { input: "1 2 3 4 5 6 7", expectedOutput: "4", points: 1 }]),

p("Count Leaf Nodes in a Binary Tree", "Trees", "Easy", ["Tree"],
  `Given a binary tree, count and print the number of leaf nodes (nodes with no children). ${TREE_FORMAT}`,
  "1 <= number of nodes <= 10^5",
  "Input:\n1 2 3 4 N 5 6\nOutput:\n3",
  ["A node is a leaf exactly when both its left and right children are absent.", "A simple recursive traversal that increments a counter on every leaf found works in one pass."],
  [{ input: "1 2 3 4 N 5 6", expectedOutput: "3", explanation: "" },
   { input: "5", expectedOutput: "1", explanation: "" }],
  [{ input: "1 N 2", expectedOutput: "1", points: 1 },
   { input: "1 2 3", expectedOutput: "2", points: 1 },
   { input: "1 2 3 4 5 6 7", expectedOutput: "4", points: 1 }]),

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
console.log(`BINARY TREES topic: created ${created} problem(s), skipped ${skipped} already-existing.`);
