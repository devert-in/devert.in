import admin from "firebase-admin";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(join(__dirname, "service-account.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// DSA-450-sheet ingestion, BINARY TREES topic, PART 2 - closes the gap between
// the curated subset seeded in seed-dsa-binary-trees-problems.mjs and the
// sheet's full verbatim row list. Reuses the exact same level-order/'N' tree
// convention as part 1 (and the whole platform). Every expectedOutput below
// was hand-computed and cross-checked with a verified Python reference
// implementation before being written here - see the task notes for the
// verification methodology.

const REWARD = { Easy: [30, 10], Medium: [50, 20], Hard: [80, 30] };
function p(title, category, difficulty, tags, statement, constraints, examplesText, hints, sampleTests, hiddenTests) {
  const [xpReward, coinReward] = REWARD[difficulty];
  return { title, category, difficulty, tags, statement, constraints, examplesText, hints, xpReward, coinReward, sampleTests, hiddenTests };
}

const TREE_FORMAT = "The tree is given as space-separated level-order tokens, where 'N' means no node there: the first token is the root, then for each node dequeued in level order you read its left-child token then its right-child token (if input runs out early, remaining children are treated as N).";
const TREE_OUTPUT = "Print the resulting tree the same way (level order, 'N' for absent children), but omit any trailing 'N' tokens at the very end of your output.";

const PROBLEMS = [

p("Reverse Level Order Traversal", "Trees", "Easy", ["Tree", "Queue"],
  `Given a binary tree, print its nodes level by level from the deepest level up to the root level (the reverse of normal level order); within each level, print nodes left to right. Print all values in this order, space-separated on one line. ${TREE_FORMAT}`,
  "1 <= number of nodes <= 10^5",
  "Input:\n1 2 3 4 N 5 6\nOutput:\n4 5 6 2 3 1",
  ["Do a normal level-order traversal, collecting each level's values into its own list.", "Once you have every level's list, print them starting from the last (deepest) level and ending with the root's level.", "You never need to reverse the order of values within a single level - only the order in which levels appear."],
  [{ input: "1 2 3 4 N 5 6", expectedOutput: "4 5 6 2 3 1", explanation: "" },
   { input: "5", expectedOutput: "5", explanation: "" }],
  [{ input: "1 N 2", expectedOutput: "2 1", points: 1 },
   { input: "1 2 3", expectedOutput: "2 3 1", points: 1 },
   { input: "1 2 3 4 5 6 7", expectedOutput: "4 5 6 7 2 3 1", points: 1 }]),

p("Diagonal Traversal of a Binary Tree", "Trees", "Medium", ["Tree"],
  `A binary tree's diagonals are formed like this: the root starts the first diagonal; from any node, following a right child stays on the same diagonal, while following a left child starts a new diagonal one step later. Print every diagonal's values, one diagonal after another starting with the root's diagonal, space-separated on one line - within a diagonal, print nodes in the order a top-to-bottom, left-to-right traversal would discover them. ${TREE_FORMAT}`,
  "1 <= number of nodes <= 10^5",
  "Input:\n1 2 3 4 N 5 6\nOutput:\n1 3 6 2 5 4",
  ["Use a queue of 'diagonal starting points'. For each one, walk it and all its right descendants (that's the whole diagonal), printing them, and push every left child you pass along the way as the start of a future diagonal.", "Process starting points in the order they were queued, so earlier diagonals are always printed before later ones.", "A node with no left child never starts a new diagonal of its own; it just extends whichever diagonal it's already on."],
  [{ input: "1 2 3 4 N 5 6", expectedOutput: "1 3 6 2 5 4", explanation: "" },
   { input: "5", expectedOutput: "5", explanation: "" }],
  [{ input: "1 N 2", expectedOutput: "1 2", points: 1 },
   { input: "1 2 3", expectedOutput: "1 3 2", points: 1 },
   { input: "1 2 3 4 5 6 7", expectedOutput: "1 3 7 2 5 6 4", points: 1 }]),

p("Boundary Traversal of a Binary Tree", "Trees", "Medium", ["Tree"],
  "Given a binary tree, print its boundary values in this order: the root; then the left boundary top-to-bottom (every node on the path from the root's left child downward, always preferring the left child and falling back to the right child, but skipping any node that is itself a leaf); then every leaf left to right; then the right boundary bottom-to-top (the mirror of the left boundary, again skipping leaves), all space-separated on one line, with no value repeated. If the root has no children at all, print just the root. " + TREE_FORMAT,
  "1 <= number of nodes <= 10^5",
  "Input:\n1 2 3 4 5 6 7\nOutput:\n1 2 4 5 6 7 3",
  ["Handle the left boundary and right boundary as two separate downward walks that deliberately skip leaves (leaves are collected separately, once, so they're never double-counted).", "Collect all leaves with a normal left-to-right traversal of the whole tree.", "The right boundary is built bottom-to-top, so collect it top-to-bottom like the left boundary and then reverse that list before printing."],
  [{ input: "1 2 3 4 5 6 7", expectedOutput: "1 2 4 5 6 7 3", explanation: "" },
   { input: "5", expectedOutput: "5", explanation: "" }],
  [{ input: "1 N 2", expectedOutput: "1 2", points: 1 },
   { input: "1 2 3 4 N 5 6", expectedOutput: "1 2 4 5 6 3", points: 1 },
   { input: "1 2 3", expectedOutput: "1 2 3", points: 1 }]),

p("Construct a Binary Tree From a Bracket-Representation String", "Trees", "Medium", ["Tree", "Recursion", "Stack"],
  "Given a binary tree written as a bracket-representation string - a node's value, optionally followed by (left-subtree) and then (right-subtree), each written the same way recursively, with an entirely absent child's parentheses omitted altogether (a node with only a left child has just one parenthesized group; a leaf has none) - reconstruct the tree and print it using level-order tokens. " + TREE_OUTPUT,
  "1 <= number of nodes <= 10^5, all values are non-negative integers",
  "Input:\n4(2(3)(1))(6(5))\nOutput:\n4 2 6 3 1 5",
  ["Parse recursively: read digits for the current node's value, then if the next character is '(', recurse to parse the left child (consuming its closing ')'); if another '(' follows immediately after, recurse for the right child the same way.", "A node can have zero, one (always the left), or two parenthesized groups - there's no placeholder for 'left is missing but right exists'.", "Once the tree is built, serialize it with the platform's usual level-order/'N' convention - the bracket format is only how the input arrives, not how you print the answer."],
  [{ input: "4(2(3)(1))(6(5))", expectedOutput: "4 2 6 3 1 5", explanation: "" },
   { input: "5", expectedOutput: "5", explanation: "" }],
  [{ input: "1(2)", expectedOutput: "1 2", points: 1 },
   { input: "1(2)(3)", expectedOutput: "1 2 3", points: 1 },
   { input: "1(2(4)(5))(3(6)(7))", expectedOutput: "1 2 3 4 5 6 7", points: 1 }]),

p("Convert a Binary Tree Into a Doubly Linked List", "Trees", "Medium", ["Tree", "Linked List"],
  `Given a binary tree, thread it into a doubly linked list following inorder order: the leftmost node's inorder becomes the head, each node's 'next' pointer leads to its inorder successor, and each node's 'prev' pointer leads to its inorder predecessor. Print the list twice to prove both directions were wired correctly: first head-to-tail (following 'next'), then tail-to-head (following 'prev'), each traversal space-separated on its own line. ${TREE_FORMAT}`,
  "1 <= number of nodes <= 10^5",
  "Input:\n1 2 3 4 N 5 6\nOutput:\n4 2 1 5 3 6\n6 3 5 1 2 4",
  ["Do an inorder traversal while keeping track of the previously-visited node; link previous.next = current and current.prev = previous as you go.", "The head-to-tail sequence is exactly the inorder traversal; the tail-to-head sequence is that same sequence reversed, which is exactly what following every 'prev' pointer from the last node back to the first would produce.", "The very first node visited has no 'prev', and the very last has no 'next' - those are the two ends of the list."],
  [{ input: "1 2 3 4 N 5 6", expectedOutput: "4 2 1 5 3 6\n6 3 5 1 2 4", explanation: "" },
   { input: "5", expectedOutput: "5\n5", explanation: "" }],
  [{ input: "1 N 2", expectedOutput: "1 2\n2 1", points: 1 },
   { input: "1 2 3", expectedOutput: "2 1 3\n3 1 2", points: 1 },
   { input: "1 2 3 4 5 6 7", expectedOutput: "4 2 5 1 6 3 7\n7 3 6 1 5 2 4", points: 1 }]),

p("Convert a Binary Tree Into a Sum Tree", "Trees", "Medium", ["Tree", "Recursion"],
  `Given a binary tree, replace every node's value with the sum of the values in its left and right subtrees (not counting the node's own original value); every leaf becomes 0. Print the resulting tree using level-order tokens. ${TREE_OUTPUT} Node values may be negative.`,
  "1 <= number of nodes <= 10^5",
  "Input:\n10 -2 6 8 -4 7 5\nOutput:\n20 4 12 0 0 0 0",
  ["Do a post-order traversal: fully convert both children first, then set the current node's new value to (left subtree's total, including its new values) plus (right subtree's total).", "A helper function that returns 'the sum of everything in this subtree using the *original* values' while also overwriting each node's value along the way handles both jobs in a single pass.", "A leaf's subtree sum of 'children' is 0 by definition, since it has no children - that's exactly why every leaf becomes 0."],
  [{ input: "10 -2 6 8 -4 7 5", expectedOutput: "20 4 12 0 0 0 0", explanation: "" },
   { input: "5", expectedOutput: "0", explanation: "" }],
  [{ input: "1 N 2", expectedOutput: "2 N 0", points: 1 },
   { input: "1 2 3", expectedOutput: "5 0 0", points: 1 },
   { input: "1 2 3 4 5 6 7", expectedOutput: "27 9 13 0 0 0 0", points: 1 }]),

p("Minimum Swaps to Convert a Binary Tree Into a BST", "Trees", "Hard", ["Tree", "BST", "Sorting"],
  `Given a binary tree with distinct values, find the minimum number of node-value swaps needed so that the tree becomes a valid binary search tree, and print that count. Swapping two nodes means swapping their values; the tree's shape never changes. ${TREE_FORMAT}`,
  "1 <= number of nodes <= 10^5, all values distinct",
  "Input:\n5 6 7 8 9 10 11\nOutput:\n3",
  ["A tree's shape stays fixed the whole time, so the only thing that ever needs to become 'sorted' is its inorder traversal - a tree is a valid BST exactly when its inorder sequence is ascending.", "This reduces to the classic 'minimum swaps to sort an array' problem, applied to the tree's inorder traversal.", "Solve that with cycle detection: map each value to its target sorted position, then for every permutation cycle of length L you need L-1 swaps; sum that over all cycles."],
  [{ input: "5 6 7 8 9 10 11", expectedOutput: "3", explanation: "" },
   { input: "5 3 8", expectedOutput: "0", explanation: "" }],
  [{ input: "5", expectedOutput: "0", points: 1 },
   { input: "1 2 3", expectedOutput: "1", points: 1 },
   { input: "1 2 3 4 N 5 6", expectedOutput: "3", points: 1 }]),

p("Check if a Binary Tree Is a Sum Tree", "Trees", "Medium", ["Tree", "Recursion"],
  `Given a binary tree, print 'Yes' if it is a sum tree - meaning every node's value equals the sum of all values in its left subtree plus all values in its right subtree (a leaf is always trivially a sum tree) - otherwise print 'No'. ${TREE_FORMAT}`,
  "1 <= number of nodes <= 10^5",
  "Input:\n26 10 3 4 6 N N\nOutput:\nNo",
  ["Write a recursive helper that returns the total sum of an entire subtree (node value included) while also checking, on the way back up, whether the current node's value matches its children's combined subtree sums.", "A single leaf node satisfies the property automatically, since it has no children to sum.", "Once any node fails the check, the whole tree is not a sum tree - you can short-circuit, but you don't have to for these input sizes."],
  [{ input: "26 10 3 4 6 N N", expectedOutput: "No", explanation: "" },
   { input: "1 2 3", expectedOutput: "No", explanation: "" }],
  [{ input: "5", expectedOutput: "Yes", points: 1 },
   { input: "1 N 2", expectedOutput: "No", points: 1 },
   { input: "3 1 2", expectedOutput: "Yes", points: 1 }]),

p("Check if All Leaf Nodes Are at the Same Level", "Trees", "Easy", ["Tree"],
  `Given a binary tree, print 'Yes' if every leaf node is at the same depth (the root is depth 0), otherwise print 'No'. ${TREE_FORMAT}`,
  "1 <= number of nodes <= 10^5",
  "Input:\n1 2 3 4 5 6 7\nOutput:\nYes",
  ["Do any traversal that tracks depth, and record the depth of every node that has no children.", "Compare all recorded leaf depths - if they're not all equal, the answer is 'No'.", "A tree with only one leaf overall trivially satisfies the property."],
  [{ input: "1 2 3 4 5 6 7", expectedOutput: "Yes", explanation: "" },
   { input: "1 2 N 3 N", expectedOutput: "Yes", explanation: "" }],
  [{ input: "5", expectedOutput: "Yes", points: 1 },
   { input: "1 2 3 4 N N N", expectedOutput: "No", points: 1 },
   { input: "1 2 3 4 5 N N", expectedOutput: "No", points: 1 }]),

p("Check for Duplicate Subtrees of Size 2 or More", "Trees", "Medium", ["Tree", "Hashing"],
  `Given a binary tree, print 'Yes' if it contains at least two subtrees (each with 2 or more nodes) that are structurally identical - same shape and same values at every corresponding position - otherwise print 'No'. A single repeated leaf value does not count, since a lone leaf is a subtree of size 1. ${TREE_FORMAT}`,
  "1 <= number of nodes <= 10^5",
  "Input:\n1 2 2 4 5 4 5\nOutput:\nYes",
  ["Serialize every subtree into a canonical string (its structure plus its values, using a sentinel for missing children so shapes can't be confused with each other) in a single post-order pass, and count how many times each string occurs.", "Only count a serialization as a potential duplicate if the subtree it represents has at least 2 nodes.", "If any canonical string with size >= 2 occurs more than once, the answer is 'Yes'."],
  [{ input: "1 2 2 4 5 4 5", expectedOutput: "Yes", explanation: "Both children of the root are the subtree '2 with leaves 4 and 5'." },
   { input: "1 2 3 4 N 5 6", expectedOutput: "No", explanation: "" }],
  [{ input: "5", expectedOutput: "No", points: 1 },
   { input: "1 2 3 5 N N 5", expectedOutput: "No", points: 1 },
   { input: "1 2 3 4 5 4 5", expectedOutput: "No", points: 1 }]),

p("Check if Two Binary Trees Are Mirrors of Each Other", "Trees", "Easy", ["Tree"],
  "Given two binary trees (each in level-order token format, one per line), print 'Yes' if the second is the mirror image of the first - meaning swapping every node's left and right child in one tree would produce the other - otherwise print 'No'. " + TREE_FORMAT,
  "1 <= number of nodes in each tree <= 10^5",
  "Input:\n1 2 3\n1 3 2\nOutput:\nYes",
  ["Recursively compare the two trees: the current pair of nodes must have equal values, the first tree's left subtree must mirror-match the second tree's right subtree, and the first tree's right subtree must mirror-match the second tree's left subtree.", "This is the same shape of check as verifying a single tree is symmetric, just applied across two separate trees instead of one tree's two sides.", "Two nodes that are both absent are considered a match; one absent and one present is not."],
  [{ input: "1 2 3\n1 3 2", expectedOutput: "Yes", explanation: "" },
   { input: "5\n5", expectedOutput: "Yes", explanation: "" }],
  [{ input: "1 2 3\n1 2 3", expectedOutput: "No", points: 1 },
   { input: "1 2 N\n1 N 2", expectedOutput: "Yes", points: 1 },
   { input: "1 2 3 4 5 6 7\n1 3 2 7 6 5 4", expectedOutput: "Yes", points: 1 }]),

p("Sum of Nodes on the Longest Root-to-Leaf Path", "Trees", "Medium", ["Tree"],
  "Given a binary tree, consider every root-to-leaf path and find the ones with the most nodes (the longest paths); among those tied-for-longest paths, print the largest sum of node values.",
  "1 <= number of nodes <= 10^5",
  "Input:\n1 2 3 4 N 5 6\nOutput:\n10",
  ["Track two things together as you recurse to each leaf: the number of nodes on the current path, and the sum of their values.", "When you reach a leaf, compare its path's node count against the best node count seen so far - a strictly longer path always replaces the current best (regardless of sum), while a tied-length path only replaces it if its sum is larger.", "A single-node tree's only path is the root itself."],
  [{ input: "1 2 3 4 N 5 6", expectedOutput: "10", explanation: "The longest paths are 1-2-4 (length 3, sum 7), 1-3-5 (length 3, sum 9), and 1-3-6 (length 3, sum 10); the largest sum among them is 10." },
   { input: "5", expectedOutput: "5", explanation: "" }],
  [{ input: "1 2 3", expectedOutput: "4", points: 1 },
   { input: "1 N 2 N 3", expectedOutput: "6", points: 1 },
   { input: "1 2 3 4 5 6 7", expectedOutput: "11", points: 1 }]),

p("Check if a Given Graph Is a Tree", "Trees", "Medium", ["Graph", "DFS", "BFS"],
  "Given an undirected graph with n nodes labeled 0 to n-1 and m edges, print 'Yes' if the graph is a tree (connected, with no cycles) and 'No' otherwise. The first line has n and m; each of the next m lines has an edge as two space-separated node labels.",
  "1 <= n <= 10^5, 0 <= m <= 10^5",
  "Input:\n4 3\n0 1\n1 2\n2 3\nOutput:\nYes",
  ["A simple undirected graph with n nodes is a tree exactly when it is connected AND has exactly n-1 edges - if either condition fails, it isn't a tree.", "Check the edge count first (an O(1) check); only if it's exactly n-1 do you need to also verify connectivity with a DFS or BFS from any node.", "If m isn't exactly n-1, you can print 'No' immediately without even building the adjacency list."],
  [{ input: "4 3\n0 1\n1 2\n2 3", expectedOutput: "Yes", explanation: "" },
   { input: "4 4\n0 1\n1 2\n2 3\n3 0", expectedOutput: "No", explanation: "One cycle, one edge too many." }],
  [{ input: "1 0", expectedOutput: "Yes", points: 1 },
   { input: "4 2\n0 1\n2 3", expectedOutput: "No", points: 1 },
   { input: "5 4\n0 1\n0 2\n1 3\n1 4", expectedOutput: "Yes", points: 1 }]),

p("Find the Largest Subtree Sum in a Binary Tree", "Trees", "Medium", ["Tree", "Recursion"],
  `Given a binary tree, find the maximum sum of node values among all of its subtrees (every node roots exactly one subtree, including the whole tree itself and every single leaf), and print it. Node values may be negative. ${TREE_FORMAT}`,
  "1 <= number of nodes <= 10^5",
  "Input:\n1 -2 3 4 5\nOutput:\n11",
  ["Compute each subtree's total sum bottom-up with a single post-order pass, and track the maximum total seen at any node along the way.", "A node's subtree sum is its own value plus its left subtree's sum plus its right subtree's sum - which you already need to return upward anyway.", "When all values are negative, the answer is whichever single value is least negative, since a smaller (less negative) subtree beats a larger one."],
  [{ input: "1 -2 3 4 5", expectedOutput: "11", explanation: "" },
   { input: "5", expectedOutput: "5", explanation: "" }],
  [{ input: "1 N 2", expectedOutput: "3", points: 1 },
   { input: "-1 -2 -3", expectedOutput: "-2", points: 1 },
   { input: "1 2 3 4 N 5 6", expectedOutput: "21", points: 1 }]),

p("Maximum Sum of Non-Adjacent Nodes in a Binary Tree", "Trees", "Hard", ["Tree", "Dynamic Programming"],
  `Given a binary tree with positive node values, choose a subset of its nodes with no two chosen nodes directly connected by an edge (no chosen node may be the parent of another chosen node), maximizing the sum of chosen values, and print that maximum sum. ${TREE_FORMAT}`,
  "1 <= number of nodes <= 10^5",
  "Input:\n1 2 3 4 N 5 6\nOutput:\n16",
  ["For every node, compute two values: the best sum if this node IS included, and the best sum if it is NOT included.", "Including a node forces both children to be excluded, so 'included' = node's value + (best-excluded of left) + (best-excluded of right); excluding a node lets each child be either included or excluded, so 'excluded' = max(included, excluded) of left + max(included, excluded) of right.", "The final answer is the larger of the root's two values."],
  [{ input: "1 2 3 4 N 5 6", expectedOutput: "16", explanation: "Selecting nodes 1, 4, 5, and 6 (none directly connected) gives 1+4+5+6 = 16." },
   { input: "5", expectedOutput: "5", explanation: "" }],
  [{ input: "1 2 3", expectedOutput: "5", points: 1 },
   { input: "1 2 N 3", expectedOutput: "4", points: 1 },
   { input: "1 2 3 4 5 6 7", expectedOutput: "23", points: 1 }]),

p("Print All K-Sum Paths in a Binary Tree", "Trees", "Hard", ["Tree", "Recursion"],
  "Given a binary tree and a target sum k, find every downward path (a path does not need to start at the root or end at a leaf, but it must move strictly from a node to a descendant) whose node values sum to exactly k. Print each such path on its own line, values space-separated; if no such path exists, print 'None'. Consider every node as a possible starting point in preorder (root, then left subtree, then right subtree); for each starting point, extend the path downward exploring the left subtree before the right subtree, and print a path as soon as its running sum equals k - this fixes the order paths appear in. The tree's input is given first, then k on the next line.",
  "1 <= number of nodes <= 10^3",
  "Input:\n1 2 3 4 N 5 6\n7\nOutput:\n1 2 4",
  ["For each node in preorder, run a small DFS rooted at that node (not the whole tree) that extends the current path downward, checking the running sum against k at every step.", "A path is reported the moment its sum hits k, but the DFS should still continue past it to also find any longer paths starting at the same node.", "Since the starting points are visited in preorder and each one's own downward search explores left before right, the output order is fully determined - no separate sorting is needed."],
  [{ input: "1 2 3 4 N 5 6\n7", expectedOutput: "1 2 4", explanation: "" },
   { input: "1 2 3 4 N 5 6\n3", expectedOutput: "1 2\n3", explanation: "" }],
  [{ input: "5\n5", expectedOutput: "5", points: 1 },
   { input: "5\n100", expectedOutput: "None", points: 1 },
   { input: "1 2 3 4 5 6 7\n6", expectedOutput: "2 4\n6", points: 1 }]),

p("Distance Between Two Nodes in a Binary Tree", "Trees", "Medium", ["Tree"],
  "Given a binary tree and two values p and q that both exist in it, print the number of edges on the path between them.",
  "1 <= number of nodes <= 10^5",
  "Input:\n1 2 3 4 N 5 6\n4 5\nOutput:\n4",
  ["The path between any two nodes always passes through their lowest common ancestor (LCA) - find it first.", "The distance is then depth(p) + depth(q), where both depths are measured from the LCA rather than from the root.", "A node's distance to itself is 0."],
  [{ input: "1 2 3 4 N 5 6\n4 5", expectedOutput: "4", explanation: "" },
   { input: "1 2 3 4 N 5 6\n4 6", expectedOutput: "4", explanation: "" }],
  [{ input: "5\n5 5", expectedOutput: "0", points: 1 },
   { input: "1 2 3\n2 3", expectedOutput: "2", points: 1 },
   { input: "1 2 3 4 5 6 7\n4 7", expectedOutput: "4", points: 1 }]),

p("Kth Ancestor of a Node in a Binary Tree", "Trees", "Medium", ["Tree"],
  "Given a binary tree, a node value, and an integer k, print the value of that node's kth ancestor (k=1 means its immediate parent), or -1 if no such ancestor exists (including when the node is the root). The node value and k are given on the next line after the tree.",
  "1 <= number of nodes <= 10^5, 1 <= k <= number of nodes",
  "Input:\n1 2 3 4 N 5 6\n4 2\nOutput:\n1",
  ["Find the root-to-node path first (a simple recursive search that records the path so far and backtracks when a branch doesn't lead to the target).", "Once you have the path as a list ending in the target node, its kth ancestor is simply the entry k steps before the end.", "If k is at least as large as the path's length, there's no such ancestor - print -1."],
  [{ input: "1 2 3 4 N 5 6\n4 2", expectedOutput: "1", explanation: "" },
   { input: "1 2 3 4 N 5 6\n4 1", expectedOutput: "2", explanation: "" }],
  [{ input: "5\n5 1", expectedOutput: "-1", points: 1 },
   { input: "1 2 3 4 N 5 6\n6 5", expectedOutput: "-1", points: 1 },
   { input: "1 2 3 4 5 6 7\n7 2", expectedOutput: "1", points: 1 }]),

p("Find All Duplicate Subtrees in a Binary Tree", "Trees", "Hard", ["Tree", "Hashing"],
  "Given a binary tree, find every subtree pattern (of 2 or more nodes) that occurs more than once anywhere in the tree. Print each distinct duplicated pattern exactly once, as its own level-order token line (using the platform's usual convention, trailing 'N's omitted), sorted alphabetically by that printed line; if there are no duplicates, print 'None'.",
  "1 <= number of nodes <= 10^3",
  "Input:\n1 2 2 4 5 4 5\nOutput:\n2 4 5",
  ["Serialize every subtree canonically (structure plus values) in a single post-order pass and count occurrences per canonical form, exactly like the yes/no duplicate-subtree check - the only difference is you now need to report the patterns themselves, not just whether any exist.", "Ignore any canonical form belonging to a subtree of size 1 - a lone repeated leaf value doesn't count as a duplicate subtree.", "For each canonical form that occurs 2 or more times, print that subtree's own level-order serialization once (any one of its occurrences serializes identically); sort the resulting lines alphabetically for a deterministic order."],
  [{ input: "1 2 2 4 5 4 5", expectedOutput: "2 4 5", explanation: "Both children of the root are the identical subtree '2 with leaves 4 and 5'." },
   { input: "1 2 3 4 N 5 6", expectedOutput: "None", explanation: "" }],
  [{ input: "5", expectedOutput: "None", points: 1 },
   { input: "1 2 3 5 N N 5", expectedOutput: "None", points: 1 },
   { input: "2 3 3 4 N 4 N", expectedOutput: "3 4", points: 1 }]),

p("Tree Isomorphism Problem", "Trees", "Medium", ["Tree", "Recursion"],
  "Given two binary trees (each in level-order token format, one per line), print 'Yes' if they are isomorphic - meaning one can be transformed into the other by swapping the left and right children of any number of nodes (zero or more, at any positions) - otherwise print 'No'.",
  "1 <= number of nodes in each tree <= 10^5",
  "Input:\n1 2 3 4 5\n1 3 2 N N 5 4\nOutput:\nYes",
  ["Compare the two trees recursively: their root values must match, and then EITHER (both left subtrees match each other and both right subtrees match each other) OR (the first tree's left matches the second's right, and the first tree's right matches the second's left).", "Unlike a plain identical-tree check, isomorphism allows each node's children to be swapped independently - some nodes might need a swap and others might not.", "Two identical trees are trivially isomorphic (no swaps needed anywhere), and a mirror image is also isomorphic (every node happens to need a swap)."],
  [{ input: "1 2 3 4 5\n1 3 2 N N 5 4", expectedOutput: "Yes", explanation: "" },
   { input: "5\n5", expectedOutput: "Yes", explanation: "" }],
  [{ input: "1 2 3\n1 2 4", expectedOutput: "No", points: 1 },
   { input: "1 2 N\n1 2 N", expectedOutput: "Yes", points: 1 },
   { input: "1 2 3 4 5 6 7\n1 3 2 7 6 5 4", expectedOutput: "Yes", points: 1 }]),

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
console.log(`BINARY TREES topic (part 2): created ${created} problem(s), skipped ${skipped} already-existing.`);
