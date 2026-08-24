// Daily Learning - DSA Series, WEEK 4 (Mon 10 Aug - Sat 15 Aug 2026).
//
// Continues the existing sequence exactly:
//   Week 1  2026-07-20  Arrays              Days 1-5   + Week 1 Recap Test
//   Week 2  2026-07-27  Linked Lists        Days 8-12  + Week 2 Master Test
//   Week 3  2026-08-03  Stacks & Queues     Days 13-17 + Week 3 Master Test
//   Week 4  2026-08-10  Recursion & Trees   Days 18-22 + Week 4 Master Test  <- this file
//
// WHY THIS TOPIC NEXT. It is the one unit that pays off Week 3 directly rather
// than starting fresh: recursion IS the call stack the students just implemented
// by hand, and level-order traversal IS a queue. Day 18 opens by making that link
// explicit, so Week 3 reads in hindsight as the machinery Week 4 relies on.
// Trees also unlock everything after them (BSTs, heaps, graph traversal, tree DP),
// which is why every placement syllabus puts them here.
//
// SHAPE matches the live docs exactly (checked against 2026-08-06 and 2026-08-08):
//   lesson (Mon-Fri): 5 MCQs, xpReward 50,  coinReward 20, 2-3 problemIds
//   test   (Sat):    10 MCQs, xpReward 150, coinReward 60, 5 problemIds
//   date, weekId (the week's Monday), dow, type, title, concept, mcqs[],
//   problemIds[], status "published", audiences ["legacy"], createdAt.
//
// audiences: ["legacy"] is deliberate, not a placeholder - it is what every
// existing item carries, and it is the audience every reader already holds (see
// lib/audiences.js). Anything else would make the week invisible.
//
// problemIds are REAL ids verified against published problems in the `problems`
// collection. The Saturday test deliberately uses five problems the week's
// lessons did not, so it tests transfer rather than recall of the same five.
//
// Idempotent: refuses to overwrite a date that already exists.
//
//   node scripts/seed-daily-learning-week4-2026-08-10.mjs            # dry run
//   node scripts/seed-daily-learning-week4-2026-08-10.mjs --apply

import admin from "firebase-admin";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
admin.initializeApp({
  credential: admin.credential.cert(
    JSON.parse(readFileSync(join(__dirname, "service-account.json"), "utf8"))
  ),
});
const db = admin.firestore();
const FV = admin.firestore.FieldValue;

const APPLY = process.argv.includes("--apply");
const INSTITUTION_ID = "mrcet";
const WEEK_ID = "2026-08-10";

const mcq = (id, text, options, correctIndex) => ({ id, text, options, correctIndex });

const DAYS = [
  {
    date: "2026-08-10", dow: "mon", type: "lesson",
    title: "Day 18: Recursion & the Call Stack",
    problemIds: [
      "jqQ75JtvD4Lyyc45pe96", // Factorial of N (Easy, Recursion)
      "ITb4xoCHqKD2oiATF3m4", // Sum of Digits of a Number (Easy, Recursion)
      "7qyiqKyzzd2XT5NyyK1j", // Reverse a String Using Recursion (Easy, Recursion)
    ],
    concept:
`You spent last week implementing a stack by hand. Recursion is that same stack, provided for you by the language - every recursive call pushes a frame holding its own parameters and local variables, and every return pops one. Understanding recursion is therefore not a new idea so much as a new way to use an idea you already have.

Every correct recursive function has exactly two parts:
  BASE CASE   - an input small enough to answer without recursing
  RECURSIVE CASE - reduce the problem, call yourself, combine the result

Miss the base case and the stack grows until the runtime kills it: stack overflow. Fail to make the problem strictly smaller and you get the same crash for a subtler reason - the recursion never approaches the base case.

  factorial(n):
    if n <= 1: return 1          # base case
    return n * factorial(n - 1)  # strictly smaller, then combine

Read the call stack for factorial(4): frames for 4, 3, 2, 1 pile up, the frame for 1 returns immediately, and the answers multiply back out as each frame pops. That unwinding is where the work actually happens, which is why "what does this return on the way back up?" is the question to ask of any recursion you are trying to understand.

Cost: one frame per pending call, so the SPACE is O(depth) even when no array is allocated - a fact interviewers probe constantly. factorial(n) is O(n) time and O(n) space. Recursion depth is a real resource, and it is the reason an O(n) recursive solution can crash where an O(n) loop will not.`,
    mcqs: [
      mcq("q1", "Every correct recursive function must have:", [
        "A loop inside it", "A base case that returns without recursing",
        "At least two recursive calls", "A global variable",
      ], 1),
      mcq("q2", "A missing or unreachable base case causes:", [
        "A compile error", "A wrong answer but normal termination",
        "Stack overflow", "An infinite loop that uses no extra memory",
      ], 2),
      mcq("q3", "The space complexity of factorial(n) written recursively is:", [
        "O(1)", "O(log n)", "O(n) for the call stack", "O(n^2)",
      ], 2),
      mcq("q4", "Recursion is most directly supported by which data structure?", [
        "A queue", "A stack of call frames", "A hash table", "A heap",
      ], 1),
      mcq("q5", "For recursion to terminate, each call must:", [
        "Return the same value", "Make the problem strictly smaller",
        "Allocate less memory than its caller", "Have exactly one parameter",
      ], 1),
    ],
  },
  {
    date: "2026-08-11", dow: "tue", type: "lesson",
    title: "Day 19: Binary Trees & DFS Traversals",
    problemIds: [
      "8E6ZRzIwhKZci3QJtdNT", // Preorder Traversal (Easy)
      "Tqu3AHS4ryxzh06FmK9a", // Inorder Traversal (Easy)
      "kdpyDvFfvlXKkAR6lRIj", // Postorder Traversal (Easy)
    ],
    concept:
`A binary tree is a node holding a value and up to two children, left and right. A subtree is itself a binary tree, and that self-similarity is why almost every tree algorithm is recursive: solve the left subtree, solve the right subtree, combine.

The three depth-first traversals differ only in WHEN the node is visited relative to its children:
  PREORDER   node, left, right
  INORDER    left, node, right
  POSTORDER  left, right, node

  inorder(node):
    if node is null: return      # base case - the empty tree
    inorder(node.left)
    visit(node)
    inorder(node.right)

One line moves and you have a different traversal. Learn the shape once.

Each has a use that is not interchangeable. Inorder on a BST emits values in sorted order - tomorrow's BST work leans on this entirely. Preorder visits a parent before its children, which is what you want when copying a tree or serialising it. Postorder visits children before the parent, which is what you need when a node's answer depends on its subtrees - deleting a tree, or computing heights, as on Thursday.

Every node is visited once, so all three are O(n) time. Space is O(h) for the call stack, where h is the height: O(log n) for a balanced tree, but O(n) for a degenerate one that has become a linked list. That worst case is exactly what Friday's balanced-BST discussion exists to prevent.`,
    mcqs: [
      mcq("q1", "Inorder traversal of a binary search tree produces values in:", [
        "Insertion order", "Sorted ascending order", "Reverse sorted order", "Level order",
      ], 1),
      mcq("q2", "Which traversal visits a node BEFORE both of its subtrees?", [
        "Preorder", "Inorder", "Postorder", "Level order",
      ], 0),
      mcq("q3", "The base case of a recursive tree traversal is:", [
        "A leaf node", "A null node", "The root", "A node with one child",
      ], 1),
      mcq("q4", "Time complexity of any DFS traversal of a binary tree with n nodes:", [
        "O(log n)", "O(n)", "O(n log n)", "O(n^2)",
      ], 1),
      mcq("q5", "Auxiliary space for a recursive traversal is O(h). For a completely skewed tree that becomes:", [
        "O(1)", "O(log n)", "O(n)", "O(n log n)",
      ], 2),
    ],
  },
  {
    date: "2026-08-12", dow: "wed", type: "lesson",
    title: "Day 20: Level-Order Traversal (BFS with a Queue)",
    problemIds: [
      "xqXNaDAZ9opmuxXXtdzE", // Level Order Traversal (Easy)
      "bxcv7SKOhaMbGrGY4TYj", // Reverse Level Order Traversal (Easy)
      "SUcxCunIlg80Gnx2QPnd", // Zig-Zag Level Order Traversal (Medium)
    ],
    concept:
`Yesterday's traversals all went deep first, and each was naturally recursive. Reading a tree row by row needs the opposite discipline, and the tool is last week's queue.

  levelOrder(root):
    if root is null: return
    q = queue with root
    while q is not empty:
      node = q.dequeue()
      visit(node)
      if node.left:  q.enqueue(node.left)
      if node.right: q.enqueue(node.right)

FIFO is doing the real work: a node's children are enqueued behind everything already waiting, so depth d is fully drained before depth d+1 begins. Swap the queue for a stack and you get a depth-first walk instead - the container choice IS the algorithm.

The variant worth internalising is processing one level at a time. Record the queue's size BEFORE the inner loop and consume exactly that many nodes:

  while q is not empty:
    n = q.size()               # this level, captured before it grows
    for i in 1..n:
      node = q.dequeue(); visit(node); enqueue children

Capturing the size first is the whole trick. It gives you level boundaries, and with them: level maxima, the left or right view, average per level, and zig-zag order by reversing alternate levels.

O(n) time. Space is O(w), the maximum WIDTH - and for a complete tree the bottom row holds about half the nodes, so BFS is O(n) space where DFS on the same tree is O(log n). Neither traversal dominates; they trade stack depth against queue width.`,
    mcqs: [
      mcq("q1", "Level-order traversal is implemented with:", [
        "A stack", "A queue", "A priority queue", "Recursion only",
      ], 1),
      mcq("q2", "To process a tree strictly one level at a time you must:", [
        "Sort each level", "Record the queue size before consuming the level",
        "Use two stacks", "Visit only leaf nodes",
      ], 1),
      mcq("q3", "Replacing the queue in BFS with a stack produces:", [
        "The same order", "A depth-first order", "Sorted order", "Reverse level order",
      ], 1),
      mcq("q4", "Auxiliary space for level-order traversal is proportional to:", [
        "The height of the tree", "The maximum width of the tree",
        "The number of leaves only", "O(1)",
      ], 1),
      mcq("q5", "For a complete binary tree, BFS space compared with recursive DFS space is:", [
        "Smaller", "The same", "Larger, because the widest level holds about half the nodes", "Always O(1)",
      ], 2),
    ],
  },
  {
    date: "2026-08-13", dow: "thu", type: "lesson",
    title: "Day 21: Height, Diameter & Balance",
    problemIds: [
      "Mr7Q8bwr6paSq9i4ErrT", // Height of a Binary Tree (Easy)
      "lH9V0mIsQUgtTUkZw0EG", // Diameter of a Binary Tree (Medium)
      "p2KSKQd2O41szimeOxZQ", // Check if Height-Balanced (Medium)
    ],
    concept:
`These three problems share one pattern, and it is the most reusable idea in tree interviews: compute a value bottom-up in postorder, and let each node RETURN one thing to its parent while UPDATING an answer on the side.

Height is the plain case - a node's height is one more than its taller subtree:

  height(node):
    if node is null: return 0
    return 1 + max(height(node.left), height(node.right))

Diameter is where people go wrong. The longest path between any two nodes may not pass through the root at all, so it cannot be answered by looking at the root alone. At each node the longest path THROUGH that node is leftHeight + rightHeight. So compute heights bottom-up and, at every node, update a running best with that sum:

  best = 0
  height(node):
    if node is null: return 0
    l = height(node.left); r = height(node.right)
    best = max(best, l + r)        # path through this node
    return 1 + max(l, r)           # what the parent needs

One traversal, O(n). Calling height() separately inside a diameter recursion instead re-walks the same subtrees and collapses to O(n^2) - a classic avoidable blow-up.

Balance uses the same trick with an early exit: return the height, but return a sentinel (-1) the moment a subtree differs by more than 1, and propagate it. A tree is height-balanced when every node's subtree heights differ by at most one - the invariant that keeps a BST's operations at O(log n) instead of degrading to O(n).`,
    mcqs: [
      mcq("q1", "The height of a single-node tree, counting nodes on the longest root-to-leaf path, is:", [
        "0", "1", "2", "Undefined",
      ], 1),
      mcq("q2", "The diameter of a binary tree is:", [
        "Always through the root", "The longest path between any two nodes",
        "The number of leaves", "Twice the height",
      ], 1),
      mcq("q3", "At any node, the longest path passing THROUGH it equals:", [
        "leftHeight + rightHeight", "max(leftHeight, rightHeight)",
        "1 + leftHeight", "leftHeight * rightHeight",
      ], 0),
      mcq("q4", "Computing diameter by calling height() inside the recursion at every node costs:", [
        "O(n)", "O(n log n)", "O(n^2) in the worst case", "O(log n)",
      ], 2),
      mcq("q5", "A binary tree is height-balanced when, for every node, the subtree heights differ by at most:", [
        "0", "1", "2", "log n",
      ], 1),
    ],
  },
  {
    date: "2026-08-14", dow: "fri", type: "lesson",
    title: "Day 22: Binary Search Trees - Search, Insert, Validate",
    problemIds: [
      "maHHjyXwoDYgVzQO4nNU", // Find a Value in a BST (Easy)
      "g6bPB30meWSWlMiTlt5C", // Insert a Node Into a BST (Easy)
      "PhfQbm6XKmSuV3T8ovd2", // Check if a Binary Tree Is a Valid BST (Medium)
    ],
    concept:
`A binary search tree adds one rule to a binary tree: every value in the left subtree is smaller than the node, every value in the right subtree is larger. That single invariant turns the search from Tuesday into a decision at each step.

  search(node, target):
    if node is null: return false
    if node.value == target: return true
    return target < node.value ? search(node.left, target)
                               : search(node.right, target)

Each comparison discards an entire subtree, so search, insert and delete are O(h). On a balanced tree that is O(log n) - the reason BSTs exist. But h is the HEIGHT, not log n by right: insert 1,2,3,4,5 in order and every node has only a right child. The tree is a linked list, and every operation is O(n). Yesterday's balance condition is what stands between you and that outcome, and self-balancing trees (AVL, red-black) exist precisely to enforce it.

Validation is the classic trap. Checking only "left < node < right" locally is WRONG - it passes trees where a deep left-subtree node exceeds an ancestor. The invariant is about entire subtrees, not immediate children, so each node must be checked against a RANGE inherited from its ancestors:

  isBST(node, low, high):
    if node is null: return true
    if node.value <= low or node.value >= high: return false
    return isBST(node.left, low, node.value) and isBST(node.right, node.value, high)

Equivalently: an inorder traversal of a valid BST is strictly increasing, so walk it inorder and confirm each value exceeds the previous. Both are O(n) and both are worth being able to write.`,
    mcqs: [
      mcq("q1", "In a BST, every value in a node's right subtree is:", [
        "Smaller than the node", "Larger than the node",
        "Equal to the node", "In no particular relation",
      ], 1),
      mcq("q2", "Search in a BST of height h costs:", [
        "O(1)", "O(h)", "O(n) always", "O(n log n)",
      ], 1),
      mcq("q3", "Inserting 1, 2, 3, 4, 5 in that order into an empty BST gives a tree of height:", [
        "log2(5) rounded up", "3", "5 - it degenerates into a linked list", "1",
      ], 2),
      mcq("q4", "Validating a BST by comparing each node only with its immediate children is:", [
        "Correct and O(n)", "Incorrect - a deep node can violate an ancestor's range",
        "Correct only for balanced trees", "Correct only for full trees",
      ], 1),
      mcq("q5", "An inorder traversal of a valid BST is always:", [
        "Strictly increasing", "Strictly decreasing", "Unsorted", "Level by level",
      ], 0),
    ],
  },
  {
    date: "2026-08-15", dow: "sat", type: "test",
    title: "Week 4 Master Test: Recursion & Binary Trees",
    xpReward: 150, coinReward: 60,
    // Five problems the week's lessons did NOT set, so this tests transfer
    // rather than recall of the same exercises.
    problemIds: [
      "dnFXf3GAxWvKrFeQK7NY", // Check if Two Binary Trees Are Identical (Easy)
      "Sevje8MHwiXxRwKpzAyt", // Check if Two Binary Trees Are Mirrors (Easy)
      "aOLKPTe7t6QJnSbqkFcf", // Count Leaf Nodes in a Binary Tree (Easy)
      "0Iwq5sfiExGtB62k6fOd", // Lowest Common Ancestor in a Binary Tree (Medium)
      "CAoiLsYD601lUqJzBTEK", // Kth Smallest Element in a BST (Medium)
    ],
    concept:
`Everything from Days 18-22: recursion and the call stack, the three DFS traversals, level-order with a queue, bottom-up height/diameter/balance, and BST search, insert and validation.

Ten questions, then five problems. The problems are deliberately ones you have not been set this week - if you understood the patterns rather than memorising the exercises, they will feel familiar anyway. Two of them (identical trees, mirror trees) are the same recursion with one pair of arguments swapped, which is worth noticing before you start typing.`,
    mcqs: [
      mcq("q1", "A recursive function without a reachable base case fails with:", [
        "A compile error", "Stack overflow", "A wrong answer", "An infinite loop using O(1) space",
      ], 1),
      mcq("q2", "Which traversal of a BST yields sorted order?", [
        "Preorder", "Inorder", "Postorder", "Level order",
      ], 1),
      mcq("q3", "Level-order traversal requires:", [
        "A stack", "A queue", "A hash map", "Two pointers",
      ], 1),
      mcq("q4", "To iterate a tree level by level you capture, before each level:", [
        "The tree height", "The current queue size", "The number of leaves", "The root value",
      ], 1),
      mcq("q5", "At a node with subtree heights l and r, the longest path through it is:", [
        "max(l, r)", "l + r", "1 + max(l, r)", "l * r",
      ], 1),
      mcq("q6", "A height-balanced tree requires subtree heights at every node to differ by at most:", [
        "0", "1", "2", "log n",
      ], 1),
      mcq("q7", "BST operations degrade to O(n) when the tree:", [
        "Is perfectly balanced", "Becomes skewed, like a linked list",
        "Contains duplicates", "Has an even number of nodes",
      ], 1),
      mcq("q8", "Validating a BST correctly requires each node to satisfy:", [
        "A comparison with its children only", "A range inherited from its ancestors",
        "A comparison with the root only", "A level-order check",
      ], 1),
      mcq("q9", "Recursive DFS uses O(h) auxiliary space. BFS on the same tree uses space proportional to:", [
        "The height", "The maximum width", "The number of leaves", "O(1)",
      ], 1),
      mcq("q10", "Checking whether two trees are mirrors differs from checking they are identical by:", [
        "Using a queue instead of recursion", "Comparing left against right in the recursive calls",
        "Sorting both trees first", "Comparing heights only",
      ], 1),
    ],
  },
];

async function main() {
  const col = db.collection("institutions").doc(INSTITUTION_ID).collection("dailyLearning");

  // Confirms the module is switched on - a perfectly seeded week is invisible to
  // students if dailyLearning/_module has enabled false.
  const mod = await col.doc("_module").get();
  console.log(`_module.enabled = ${mod.exists ? mod.data().enabled : "(missing)"}`);

  let created = 0, skipped = 0;
  for (const d of DAYS) {
    const existing = await col.doc(d.date).get();
    if (existing.exists) {
      console.log(`  SKIP   ${d.date} - already exists: "${existing.data().title}"`);
      skipped++;
      continue;
    }

    const payload = {
      date: d.date,
      weekId: WEEK_ID,
      dow: d.dow,
      type: d.type,
      title: d.title,
      concept: d.concept,
      mcqs: d.mcqs,
      problemIds: d.problemIds,
      xpReward: d.xpReward ?? 50,
      coinReward: d.coinReward ?? 20,
      status: "published",
      audiences: ["legacy"],
      createdAt: FV.serverTimestamp(),
    };

    console.log(`  ${APPLY ? "CREATE" : "would create"} ${d.date} [${d.dow}/${d.type}] ${d.title}`);
    console.log(`         mcqs=${d.mcqs.length} problems=${d.problemIds.length} xp=${payload.xpReward} coins=${payload.coinReward} concept=${d.concept.length} chars`);

    if (APPLY) await col.doc(d.date).set(payload);
    created++;
  }

  // Every referenced problem must exist and be published, or the day renders a
  // broken practice list to a whole cohort.
  const ids = [...new Set(DAYS.flatMap(d => d.problemIds))];
  let bad = 0;
  for (const id of ids) {
    const p = await db.collection("problems").doc(id).get();
    const ok = p.exists && p.data().status === "published";
    if (!ok) { console.log(`  *** BAD problemId ${id} - exists=${p.exists} status=${p.exists ? p.data().status : "-"}`); bad++; }
  }
  console.log(`\nproblemIds checked: ${ids.length}, unresolved: ${bad}`);
  console.log(`${APPLY ? "created" : "would create"}: ${created}   skipped (already present): ${skipped}`);
  if (!APPLY) console.log("\ndry run - re-run with --apply");
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
