// Daily Learning - DSA Series, WEEK 5 (Mon 17 Aug - Sat 22 Aug 2026).
//
// Continues the existing sequence exactly:
//   Week 1  2026-07-20  Arrays              Days 1-5   + Week 1 Recap Test
//   Week 2  2026-07-27  Linked Lists        Days 8-12  + Week 2 Master Test
//   Week 3  2026-08-03  Stacks & Queues     Days 13-17 + Week 3 Master Test
//   Week 4  2026-08-10  Recursion & Trees   Days 18-22 + Week 4 Master Test
//   Week 5  2026-08-17  Heaps & Hashing     Days 25-29 + Week 5 Master Test  <- this file
//   (Week 6 should therefore open at "Day 30")
//
// NOTE ON THE "Day N" NUMBER: titles here are numbered 25-29, not 23-27,
// to match currentDayIndex (lib/dailyLearning.js's fetchTrackProgress) -
// a live COUNT of every published item to date, which has no gaps. The
// title-numbering scheme has one from early on (Week 1 titles end at "Day
// 5", Week 2 starts at "Day 8", skipping 6-7 even though only Week 1's
// Saturday test - one chronological item - separates them), so titles were
// permanently 2 behind the count. Originally seeded as 23-27 and patched to
// 25-29 (scripts/patch-week5-day-numbers.mjs) once that mismatch surfaced
// live, next to the sidebar's own count, as a visible "Day 25"/"Day 23"
// contradiction on the same screen.
// WHY THIS TOPIC NEXT. Both pay off Week 4 directly: a heap is a complete
// binary tree (same shape students just finished with BSTs), just with a
// weaker, cheaper-to-maintain ordering rule - a natural "what if we relax
// the BST invariant" follow-up. Hashing is introduced as the O(1)-average
// alternative to the O(log n) a balanced BST offers, so students see the
// same "search/lookup" problem solved three different ways across two
// weeks (BST, heap-for-min/max, hash table-for-membership) and can compare
// their trade-offs directly. Both topics are also direct prerequisites for
// graph algorithms (Dijkstra needs a heap; visited-tracking needs a hash
// set), which is why they sit here rather than later.
//
// SHAPE matches the live docs exactly (checked against 2026-08-10 through
// 2026-08-15, i.e. week 4):
//   lesson (Mon-Fri): 5 MCQs, xpReward 50,  coinReward 20, 2-3 problemIds
//   test   (Sat):    10 MCQs, xpReward 150, coinReward 60, 5 problemIds
//   date, weekId (the week's Monday), dow, type, title, concept, mcqs[],
//   problemIds[], status "published", audiences ["legacy"], createdAt.
//
// audiences: ["legacy"] is deliberate, not a placeholder - it is what every
// existing item carries, and it is the audience every reader already holds
// (see lib/audiences.js). Anything else would make the week invisible.
//
// problemIds are REAL ids verified against published problems in the
// `problems` collection (queried live - see scripts/tmp-find-heap-hash-
// problems.mjs, since deleted). The platform has no "Easy"-difficulty heap
// problems at all (checked exhaustively), so Days 25-27's embedded problems
// are Medium - the concept text is written at an introductory level
// regardless. The Saturday test deliberately uses five problems the week's
// lessons did not, so it tests transfer rather than recall of the same
// five; "Top K Frequent Elements" is a deliberate capstone since it is
// hashing (count frequencies) AND a heap (keep the top K) in one problem.
//
// Idempotent: refuses to overwrite a date that already exists.
//
//   node scripts/seed-daily-learning-week5-2026-08-17.mjs            # dry run
//   node scripts/seed-daily-learning-week5-2026-08-17.mjs --apply

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
const WEEK_ID = "2026-08-17";

const mcq = (id, text, options, correctIndex) => ({ id, text, options, correctIndex });

const DAYS = [
  {
    date: "2026-08-17", dow: "mon", type: "lesson",
    title: "Day 25: Binary Heaps - The Heap Property",
    problemIds: [
      "gZ0gxlWNOQBlsLSiYgjl", // Check if a Binary Tree Is a Valid Heap (Medium, Heap/Tree)
      "H8V16OywghsmHTc5fC21", // Convert a Min-Heap to a Max-Heap (Medium, Heap/Array)
    ],
    concept:
`Last week's BST kept left < node < right everywhere - a strong rule that buys fast search. A heap relaxes that rule to something much weaker, and gets something different in return: O(1) access to just the minimum (or maximum) element.

A binary heap is a COMPLETE binary tree - every level is fully filled except possibly the last, which fills left to right, with no gaps - satisfying the heap property:
  MIN-HEAP   every parent <= both of its children  (root is the smallest value)
  MAX-HEAP   every parent >= both of its children  (root is the largest value)

That is the entire rule. There is no left/right ordering between siblings, and no relationship at all between nodes that aren't parent and child - a heap answers "what's the min?" instantly but cannot answer "is 47 in here?" any faster than checking every node, O(n). Different invariant, different job.

Because a heap is always COMPLETE, it never needs pointers at all - it lives in a plain array, indexed from 0:
  parent(i) = (i - 1) / 2      (integer division)
  left(i)   = 2*i + 1
  right(i)  = 2*i + 2

Compare that to a BST, which can degenerate into a linked list if you insert sorted data (Day 22). A heap CANNOT degenerate that way - completeness is enforced by construction, so its height is always O(log n), guaranteed, not just on average.`,
    mcqs: [
      mcq("q1", "In a min-heap, every parent node's value must be:", [
        "Greater than both children", "Less than or equal to both children",
        "Equal to the average of its children", "Unrelated to its children",
      ], 1),
      mcq("q2", "A heap being a \"complete\" binary tree means:", [
        "Every node has exactly two children", "Every level is full except possibly the last, filled left to right",
        "It is also a valid BST", "It has the maximum possible number of nodes",
      ], 1),
      mcq("q3", "In a 0-indexed array-based heap, the left child of the node at index i is at index:", [
        "i + 1", "2*i + 1", "2*i", "i / 2",
      ], 1),
      mcq("q4", "Compared to a BST, a heap's ordering rule lets it answer quickly:", [
        "\"Is value X present?\"", "\"What is the minimum (or maximum) element?\"",
        "\"What is the median element?\"", "\"Are all elements distinct?\"",
      ], 1),
      mcq("q5", "Because a heap is always a complete binary tree, its height is:", [
        "O(1)", "O(log n), always - it cannot degenerate like a BST",
        "O(n) in the worst case, same as a BST", "O(n log n)",
      ], 1),
    ],
  },
  {
    date: "2026-08-18", dow: "tue", type: "lesson",
    title: "Day 26: Heap Operations - Insert, Extract, Build-Heap",
    problemIds: [
      "prAU2Qj32Q4BzeDgMsgU", // Kth Smallest Element in an Array (Medium, Heap/Array)
      "32elFIoHgR5BRYVbnMSv", // Kth Largest Element in an Array (Medium, Heap/Array)
      "S5MpUuLge20W3vtzneBw", // Merge Two Binary Max-Heaps (Medium, Heap/Array)
    ],
    concept:
`Every heap operation is one of two moves: fix a violation by walking UP toward the root, or fix one by walking DOWN toward the leaves. Learn those two moves and every operation below is just "which one, starting where."

INSERT: append the new element at the next open array slot (the next leaf), then SIFT UP - compare it with its parent, swap if the heap property is violated, and repeat until it isn't (or you reach the root).

  siftUp(i):
    while i > 0 and heap[parent(i)] > heap[i]:   # min-heap
      swap(heap[parent(i)], heap[i])
      i = parent(i)

EXTRACT-MIN (or max): the answer is always the root. Remove it by moving the LAST element in the array into the root position, shrinking the array by one, then SIFT DOWN - compare with children, swap with the smaller one if the property is violated, repeat until it isn't (or you hit a leaf). Both operations touch at most one path from root to leaf, so both are O(log n).

BUILD-HEAP from n unsorted elements: inserting one at a time costs O(n log n) total. The faster way - heapify - starts from the last NON-LEAF node and sifts down, working backward to the root. That single pass is O(n), not O(n log n): most nodes live near the bottom of the tree where a sift-down does almost no work, and summing the (small) work per level across all levels telescopes down to a linear total. Worth knowing this result even without re-deriving it in an interview.

KTH LARGEST/SMALLEST: maintain a heap of size k while scanning n elements, giving O(n log k) - better than fully sorting (O(n log n)) whenever k is much smaller than n.`,
    mcqs: [
      mcq("q1", "Inserting into a heap appends the element, then:", [
        "Sifts it down toward the leaves", "Sifts it up toward the root, swapping with its parent while the property is violated",
        "Sorts the whole array", "Rebuilds the heap from scratch",
      ], 1),
      mcq("q2", "Extracting the minimum from a min-heap replaces the root with:", [
        "The second-smallest element directly", "The last element in the array, then sifts it down",
        "A newly inserted element", "Nothing - the tree just shrinks",
      ], 1),
      mcq("q3", "A single heap insert or extract operation costs:", [
        "O(1)", "O(log n)", "O(n)", "O(n log n)",
      ], 1),
      mcq("q4", "Building a heap from n unsorted elements via bottom-up heapify (not one-at-a-time insertion) costs:", [
        "O(n log n)", "O(n^2)", "O(n)", "O(log n)",
      ], 2),
      mcq("q5", "Finding the Kth largest of n elements by maintaining a heap of size k costs:", [
        "O(n)", "O(n log k)", "O(n log n) always, no better than sorting", "O(k log n)",
      ], 1),
    ],
  },
  {
    date: "2026-08-19", dow: "wed", type: "lesson",
    title: "Day 27: Priority Queues, Heap Sort & Top-K Patterns",
    problemIds: [
      "hXXHn6MuUEnBzMDkK7jD", // Sort an Array Using Heap Sort (Medium, Heap/Sorting)
      "6YknJ7I18Ohi9KJni4BG", // Find the K Largest Elements in an Array (Medium, Heap/Array)
      "qO7yX6ngT1EZj6JqtfXF", // K Closest Points to the Origin (Medium, Heap/Array)
    ],
    concept:
`A PRIORITY QUEUE is the abstract idea "give me the highest (or lowest) priority item next" - a heap is simply the efficient, concrete way most languages implement one. Every operation you learned yesterday is a priority queue operation wearing a heap's clothes.

HEAP SORT uses that idea to sort in place: build a max-heap from the array (O(n), from yesterday), then repeatedly extract the max and place it at the newly-freed end of the array, shrinking the heap by one each time. That's n extractions at O(log n) each, so O(n log n) overall - matching merge sort's time, but in O(1) extra space, since everything happens inside the original array. Merge sort needs O(n) extra space for merging; heap sort does not.

The other recurring shape is the SIZE-K HEAP for "best K of N" problems (K closest points, K largest elements, top-K anything): scan the n candidates once, keeping a heap that only ever holds your current best K. For each new candidate, compare it against the heap's worst element (sitting at the root) and swap it in only if the new one is better, then re-heapify that one change.

The counterintuitive part: to track the K LARGEST elements efficiently, you keep a MIN-heap of size K - not a max-heap. The root of that min-heap is the smallest of your current top-K, which is exactly the element you want to evict the instant something bigger shows up. (Symmetrically, tracking the K smallest uses a MAX-heap of size K.) This one pass costs O(n log k), strictly better than sorting everything at O(n log n) whenever k << n.`,
    mcqs: [
      mcq("q1", "A priority queue is best described as:", [
        "A queue that only allows FIFO order", "An abstract \"give me the highest/lowest priority item next\" interface, usually implemented with a heap",
        "A synonym for a hash table", "A stack with extra bookkeeping",
      ], 1),
      mcq("q2", "Heap sort's time complexity and extra space usage are:", [
        "O(n log n) time, O(n) extra space", "O(n log n) time, O(1) extra space",
        "O(n^2) time, O(1) extra space", "O(n) time, O(log n) extra space",
      ], 1),
      mcq("q3", "Compared to merge sort, heap sort's key practical advantage is:", [
        "It is always faster asymptotically", "It sorts in-place with O(1) extra space, unlike merge sort's O(n)",
        "It is stable while merge sort is not", "It never needs comparisons",
      ], 1),
      mcq("q4", "To efficiently track the K LARGEST elements seen so far while scanning a stream, the standard technique keeps:", [
        "A max-heap of size K", "A min-heap of size K, evicting the smallest when a bigger element arrives",
        "A sorted array of all elements", "A hash set of size K",
      ], 1),
      mcq("q5", "Maintaining a size-K heap while scanning n elements to find the K largest costs:", [
        "O(n log n), same as sorting everything", "O(n log k), better than sorting when k << n",
        "O(n)", "O(k log n) total, independent of n",
      ], 1),
    ],
  },
  {
    date: "2026-08-20", dow: "thu", type: "lesson",
    title: "Day 28: Hashing Fundamentals - Hash Tables & Collisions",
    problemIds: [
      "rMresXdByVqMcW2asqvM", // Two Sum (Easy, Array/Hash Map)
      "eL0uOb5hpx7JsUpq8nog", // Find All Pairs With a Given Sum (Easy, Hashing)
      "cHv8ZHCU1rPT8rUozYjg", // Find the Majority Element (Easy, Hashing)
    ],
    concept:
`A hash table maps a KEY to a VALUE by running the key through a hash function that produces an array index directly - so lookup, insert and delete are O(1) ON AVERAGE. That is the payoff for giving up every ordering guarantee a BST or heap gives you: a hash table cannot tell you the minimum, the maximum, or anything in sorted order, only "is this key here, and if so what's its value."

COLLISIONS are unavoidable - by the pigeonhole principle, once you have more possible keys than array slots, two different keys will eventually hash to the same index. Every real hash table needs a strategy for this:
  CHAINING         each array slot holds a small list of every key that hashed there
  OPEN ADDRESSING  on a collision, probe forward for the next free slot in the array itself

LOAD FACTOR = (elements stored) / (table size). Keeping this below a threshold (commonly ~0.7) and RESIZING - allocating a bigger array and rehashing every existing key into it - once it's exceeded is what keeps operations O(1) on average instead of degrading as the table fills up.

"O(1) average, O(n) worst case" is not a throwaway line - the worst case is real. If every key happened to hash to the same slot, chaining degenerates into one long linked list and every operation becomes O(n). A good hash function spreads keys uniformly across slots, which is why hash function quality matters even though you will rarely write one yourself.

TWO SUM is the canonical example of the win hashing provides: the nested-loop approach checks every pair, O(n^2). A single pass that, for each element, checks "have I already seen (target - this element)?" using a hash set/map turns it into O(n) time - at the cost of O(n) extra space. Trading space for time this way is the single most common hashing pattern you will use.`,
    mcqs: [
      mcq("q1", "The average-case time complexity for lookup, insert and delete in a well-implemented hash table is:", [
        "O(log n)", "O(1)", "O(n)", "O(n log n)",
      ], 1),
      mcq("q2", "Two different keys hashing to the same array index is called a:", [
        "Load factor violation", "Collision", "Rehash", "Heapify",
      ], 1),
      mcq("q3", "The two standard strategies for resolving collisions are:", [
        "Sorting and binary search", "Chaining and open addressing",
        "Sifting up and sifting down", "Recursion and memoization",
      ], 1),
      mcq("q4", "Load factor is defined as:", [
        "The number of collisions divided by table size", "The number of stored elements divided by table size",
        "The height of the tallest chain", "The hash function's output range",
      ], 1),
      mcq("q5", "Solving Two Sum in O(n) time instead of O(n^2) works by:", [
        "Sorting the array first", "Storing seen values in a hash set/map instead of checking every pair with a nested loop",
        "Using a heap to track the smallest value", "Using recursion to check every pair",
      ], 1),
    ],
  },
  {
    date: "2026-08-21", dow: "fri", type: "lesson",
    title: "Day 29: Hash Table Applications - Sets, Frequency Counting & Anagrams",
    problemIds: [
      "2zQgK836sYSJt2HvPJS8", // Anagram Check (Easy)
      "XWSPCTUReW9ZeimRTw0e", // First Non-Repeating Character (Easy)
      "2a4KzFpiZlG4InbnXIMe", // Find Duplicate Characters in a String (Easy, Hashing)
    ],
    concept:
`HASHSET vs HASHMAP: a set only tracks "have I seen this key?" - pure membership, no associated value. A map additionally stores a value per key. Reach for the simpler set whenever a problem only needs presence, not a value.

FREQUENCY COUNTING is the single most common hashing pattern in practice: one pass through the input, incrementing count[element] in a hash map for each item. After that one pass you have exact counts for everything - O(n) time, O(k) space where k is the number of distinct elements.

ANAGRAM CHECK falls straight out of frequency counting: two strings are anagrams of each other exactly when their character-frequency maps are identical. Build a frequency map from string A, then walk string B decrementing the same map - the strings are anagrams if and only if every count returns to exactly zero. That's O(n) time, against O(n log n) if you instead sorted both strings and compared them.

FIRST NON-REPEATING CHARACTER needs two passes, and it's worth noticing why one pass cannot do it: count every character's frequency first (pass one), then walk the string again IN ITS ORIGINAL ORDER and return the first character whose count is exactly 1 (pass two). At any single position during a single forward pass, you cannot yet know whether that character repeats LATER in the string - the information genuinely isn't available until you've seen the whole thing.

The pattern to internalize for the rest of DSA: whenever a problem asks "have I seen this before," "how many times does X occur," or "group these by a shared property," reach for a hash map before reaching for nested loops or a sort.`,
    mcqs: [
      mcq("q1", "A HashSet differs from a HashMap in that a set:", [
        "Stores keys in sorted order", "Only tracks membership (has this key been seen), with no associated value",
        "Cannot have collisions", "Is always faster than a HashMap",
      ], 1),
      mcq("q2", "Counting the frequency of every element in an array of n elements using a hash map takes:", [
        "O(1)", "O(n)", "O(n log n)", "O(n^2)",
      ], 1),
      mcq("q3", "Two strings are anagrams of each other exactly when:", [
        "They are the same length", "Their character-frequency maps are identical",
        "They start with the same letter", "They contain no repeated characters",
      ], 1),
      mcq("q4", "Finding the first non-repeating character in a string requires:", [
        "A single forward pass only", "Two passes: one to count frequencies, one to find the first count-1 character in order",
        "Sorting the string first", "A recursive solution only",
      ], 1),
      mcq("q5", "A hashing approach is the right first instinct when a problem asks:", [
        "\"What is the shortest path?\"", "\"Has this value been seen before, or how many times does it occur?\"",
        "\"What is the median value?\"", "\"Is this tree balanced?\"",
      ], 1),
    ],
  },
  {
    date: "2026-08-22", dow: "sat", type: "test",
    title: "Week 5 Master Test: Heaps & Hashing",
    xpReward: 150, coinReward: 60,
    // Five problems the week's lessons did NOT set, so this tests transfer
    // rather than recall of the same five. Top K Frequent Elements is a
    // deliberate capstone - it IS this week's synthesis, hashing to count
    // frequencies and a heap to keep the top K, in one problem.
    problemIds: [
      "dGW5xqsShCKIKxlUcdOc", // Top K Frequent Elements (Medium, Heap + Hashing)
      "wR3uJ5dJ7tgYWXi3uCJd", // Merge K Sorted Arrays (Medium, Heap)
      "qVNb69Q0CjjzRt7KWAWD", // Minimum Cost of Ropes (Medium, Heap/Greedy)
      "jpzyThJ4eXWXhvp52dra", // Two Sum - Return Indices (Easy, Hashing)
      "C6okbl1ZgstU6BPvzsy0", // Sort Characters By Frequency (Easy, Hashing)
    ],
    concept:
`Everything from Days 23-27: the heap property and array-based representation, insert/extract/build-heap, priority queues and heap sort, hash table fundamentals and collision handling, and hash table applications (sets, frequency counting, anagrams).

Ten questions, then five problems - deliberately ones you have not been set this week, so they test whether you understood the patterns rather than memorised the exercises. Watch for "Top K Frequent Elements" in particular: it is not a new idea, it is this entire week in one problem - hash map to count frequencies, heap to keep the top K.`,
    mcqs: [
      mcq("q1", "A min-heap's root always holds:", [
        "The maximum element", "The minimum element", "The median element", "An arbitrary element",
      ], 1),
      mcq("q2", "In a 0-indexed array-based heap, the right child of index i is at:", [
        "2*i", "2*i + 1", "2*i + 2", "i + 2",
      ], 2),
      mcq("q3", "Moving a newly inserted heap element toward the root to restore the heap property is called:", [
        "Sifting down", "Sifting up", "Heapifying", "Rehashing",
      ], 1),
      mcq("q4", "Building a heap from n elements via bottom-up heapify costs:", [
        "O(n log n)", "O(n^2)", "O(n)", "O(log n)",
      ], 2),
      mcq("q5", "Heap sort's extra space complexity, beyond the input array itself, is:", [
        "O(n)", "O(log n)", "O(1)", "O(n log n)",
      ], 2),
      mcq("q6", "Tracking the K largest elements in a stream efficiently uses:", [
        "A max-heap of size K", "A min-heap of size K", "A sorted array of all elements", "A stack of size K",
      ], 1),
      mcq("q7", "The average-case lookup time in a well-implemented hash table is:", [
        "O(n)", "O(log n)", "O(1)", "O(n log n)",
      ], 2),
      mcq("q8", "The two standard collision-resolution strategies for hash tables are:", [
        "Sifting up and sifting down", "Chaining and open addressing",
        "Preorder and postorder", "Load balancing and rehashing only",
      ], 1),
      mcq("q9", "Two strings are anagrams of each other exactly when:", [
        "They are the same length", "Their character-frequency maps are identical",
        "Both are already sorted", "They share a common prefix",
      ], 1),
      mcq("q10", "\"Top K Frequent Elements\" combines which two ideas from this week?", [
        "Recursion and BSTs", "A hash map to count frequencies, and a heap to keep the top K",
        "Chaining and open addressing only", "Heap sort and merge sort",
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
