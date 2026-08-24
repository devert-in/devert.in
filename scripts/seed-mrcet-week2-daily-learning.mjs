import admin from "firebase-admin";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(join(__dirname, "service-account.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// Week 2 of MRCET's structured Mon-Sat Daily Learning program - continues
// straight on from Week 1's Arrays & Two Pointers into Linked Lists, same
// institutions/mrcet/dailyLearning/{date} shape. Every coding pick below is
// a real, already-seeded, already-numbered CodeLab problem id (verified
// live against Firestore before writing this script).

const SLUG = "mrcet";
const WEEK_ID = "2026-07-27"; // the Monday this week starts

const q = (id, text, options, correctIndex) => ({ id, text, options, correctIndex });

const DAYS = [
  {
    dow: "mon", date: "2026-07-27", type: "lesson",
    title: "Day 8: Linked List Basics & Reversal",
    concept: `A singly linked list is a chain of nodes, each holding a value and a pointer to the next node - no random access, only sequential traversal from the head.

Reversing it in-place needs three pointers marching together:
  prev = null, curr = head
  while curr is not null:
    next = curr.next      # save before we overwrite it
    curr.next = prev      # flip this node's pointer backward
    prev = curr
    curr = next
  head = prev              # prev ends up at the old tail - the new head

One pass, O(n) time, O(1) extra space - no new nodes, no array copy, just rewiring existing pointers.

Reversing "in groups of size k" is the same idea applied block by block: reverse the first k nodes, reconnect that block's new tail to the reversed second block, and repeat - each block is reversed independently, one after another, not the whole list at once.`,
    mcqs: [
      q("q1", "To reverse a singly linked list iteratively, the standard technique uses which three pointers?", ["prev, curr, next", "left, right, mid", "slow, fast, mid", "low, mid, high"], 0),
      q("q2", "After fully reversing a linked list iteratively, which node becomes the new head?", ["What was previously the tail node", "The original head", "The middle node", "None - the list becomes circular"], 0),
      q("q3", "What is the time complexity of iterative linked list reversal?", ["O(n)", "O(n log n)", "O(n^2)", "O(1)"], 0),
      q("q4", "What is the extra space complexity of the standard iterative reversal (excluding the list itself)?", ["O(1)", "O(n)", "O(log n)", "O(n^2)"], 0),
      q("q5", "Reversing a linked list \"in groups of k\" means:", ["Reverse each consecutive block of k nodes independently, one block after another", "Reverse the entire list k times", "Only reverse the first k nodes and leave the rest untouched", "Reverse alternating nodes"], 0),
    ],
    problemIds: ["3aE1ULAwGb8fH2L6OJb8", "kc0mjPkvQsDdPekN4ltt"],
    xpReward: 50, coinReward: 20,
  },
  {
    dow: "tue", date: "2026-07-28", type: "lesson",
    title: "Day 9: Fast & Slow Pointers - Cycle Detection",
    concept: `Floyd's cycle detection ("tortoise and hare") uses two pointers moving at different speeds through the same list: slow advances one node at a time, fast advances two.

If the list has no cycle, fast simply reaches null first - no cycle exists. If the list DOES have a cycle, fast eventually laps slow from behind and they meet at some node inside the cycle - which is only possible if the list loops back on itself. One pass, O(n) time, O(1) extra space - no visited-set, no hashing.

The exact same slow/fast skeleton, with no cycle assumed, is also the standard way to find the MIDDLE of a linked list in a single pass: when fast reaches the end, slow is sitting exactly at the middle - because fast has covered twice the distance slow has.`,
    mcqs: [
      q("q1", "Floyd's cycle detection algorithm uses two pointers moving at:", ["Different speeds (one step vs two steps)", "The same speed but starting from different ends", "Random speeds", "Speeds proportional to node value"], 0),
      q("q2", "If a linked list has no cycle, the fast pointer (moving 2 steps at a time) will:", ["Reach the end (null)", "Loop forever", "Crash the program", "Meet the slow pointer anyway"], 0),
      q("q3", "To find the MIDDLE of a linked list in one pass, the standard technique is:", ["Slow pointer moves 1 step, fast pointer moves 2 steps - when fast reaches the end, slow is at the middle", "Count all nodes first, then traverse again to the n/2th node", "Use a stack to store every node", "Reverse the list and check the middle value"], 0),
      q("q4", "What is the time complexity of Floyd's cycle detection?", ["O(n)", "O(n^2)", "O(n log n)", "O(1)"], 0),
      q("q5", "If the slow and fast pointers meet inside a cycle, what does that tell you?", ["A cycle definitely exists", "The list is a palindrome", "The list is sorted", "The list has exactly one node"], 0),
    ],
    problemIds: ["56DzuUicMHUawtd1Hj6K", "2T9mZlOrel9OWlcLSYhW"],
    xpReward: 50, coinReward: 20,
  },
  {
    dow: "wed", date: "2026-07-29", type: "lesson",
    title: "Day 10: Merging & Sorting Linked Lists",
    concept: `Merging two already-sorted linked lists into one sorted list is a single O(n+m) pass: compare the current heads of both lists, attach the smaller one to the result, and advance that list's pointer - repeat until one list runs out, then attach whatever remains of the other.

Merge Sort is the natural sorting algorithm for a linked list, unlike Quicksort. Quicksort's partitioning leans on random access (jumping straight to an index); a linked list only offers sequential access, so partitioning around a pivot is awkward. Merge Sort's split-and-merge needs no random access at all - find the midpoint with slow/fast pointers (yesterday's technique), recursively sort each half, then merge them with the exact routine above. Overall: O(n log n) time.`,
    mcqs: [
      q("q1", "Merging two already-sorted linked lists into one sorted list takes:", ["O(n + m) time, where n and m are the two lengths", "O(n*m) time", "O(n log n) time", "O(1) time"], 0),
      q("q2", "Why is Merge Sort the natural choice for sorting a linked list rather than Quicksort?", ["Merge sort doesn't need random access to elements, which linked lists lack", "Quicksort is always slower on every input", "Linked lists can't be sorted at all", "Merge sort uses less memory than any other method"], 0),
      q("q3", "What is the overall time complexity of Merge Sort on a linked list?", ["O(n log n)", "O(n)", "O(n^2)", "O(log n)"], 0),
      q("q4", "To merge two sorted linked lists, at each step you:", ["Compare the current heads of both lists and attach the smaller one to the result", "Concatenate both lists and sort from scratch", "Reverse both lists first", "Always take from the first list until it's empty"], 0),
      q("q5", "Merge Sort on a linked list typically finds the midpoint using:", ["The slow/fast pointer technique", "Random access indexing", "Binary search", "A hash map"], 0),
    ],
    problemIds: ["6aBkS0l17l0x2q0nrdk7", "ORtghDqQG8XHsxD7V18F"],
    xpReward: 50, coinReward: 20,
  },
  {
    dow: "thu", date: "2026-07-30", type: "lesson",
    title: "Day 11: In-Place Rearrangement Techniques",
    concept: `Segregating a linked list's nodes by category - even/odd, or 0s/1s/2s - without extra arrays is a rearrange-pointers problem, not a values problem.

For even/odd: walk the list once maintaining two separate sub-lists (an "even" chain and an "odd" chain) built as you go, then splice the odd chain onto the end of the even chain. One pass, O(n) time, O(1) extra space - the original node objects are reused, just re-linked.

For 0s/1s/2s: the same three-way idea as Week 1's Dutch National Flag, translated from array indices to linked-list pointers - maintain three sub-list tails (zero/one/two) while walking the list once, then join zero→one→two at the end. Same O(n) single-pass shape, just expressed with pointers instead of swaps.`,
    mcqs: [
      q("q1", "Segregating even and odd nodes in a linked list (keeping relative order within each group) can be done in:", ["O(n) time, O(1) extra space (just rearranging pointers)", "O(n log n) time", "O(n) extra space, always required", "O(n^2) time"], 0),
      q("q2", "The technique for segregating 0s, 1s, and 2s in a linked list is conceptually similar to which array technique from Week 1?", ["The Dutch National Flag algorithm (three-way partitioning)", "Kadane's algorithm", "Binary search", "Sliding window"], 0),
      q("q3", "When segregating even/odd nodes, why maintain separate \"even\" and \"odd\" sub-list pointers?", ["To build both groups in a single pass, then join them at the end", "Because linked lists require two heads", "To count nodes only", "It's not actually necessary"], 0),
      q("q4", "After segregating 0s, 1s, 2s in a linked list, the resulting order is:", ["All 0s, then all 1s, then all 2s", "Sorted numerically ascending, 0s only", "Random order", "Reversed order"], 0),
      q("q5", "Rearranging nodes in a linked list (instead of their values) preserves:", ["The actual node objects/identity, just with changed next-pointers", "Nothing - values must always be copied", "The original list's cycle, if one exists", "Only the head pointer"], 0),
    ],
    problemIds: ["OTI10Qb2LZe4Ipgd7Mv1", "eBAP6Q2ukiLjZXxHtza9"],
    xpReward: 50, coinReward: 20,
  },
  {
    dow: "fri", date: "2026-07-31", type: "lesson",
    title: "Day 12: Combining Techniques - Palindrome Check & Nth From End",
    concept: `Checking if a linked list is a palindrome in O(n) time and O(1) extra space combines two techniques from this week: find the middle with slow/fast pointers, reverse the second half in-place, then walk both halves comparing values. If a caller needs the list left unmodified afterward, reverse the second half back before returning.

Finding the Nth node from the end in a single pass is a fixed-size two-pointer trick: advance one pointer N nodes ahead first, then move both pointers together one step at a time - when the lead pointer reaches the end, the trailing pointer is exactly N nodes from the end. It's the linked-list cousin of a fixed-size sliding window from Week 1: a constant gap of N nodes slides across the list until the front hits the boundary.`,
    mcqs: [
      q("q1", "To check if a linked list is a palindrome in O(n) time and O(1) extra space, the standard approach:", ["Finds the middle, reverses the second half, then compares both halves", "Copies all values into an array and checks the array", "Uses a stack for all nodes", "Sorts the list and compares"], 0),
      q("q2", "Finding the Nth node from the end of a linked list in one pass uses:", ["Two pointers, where one starts N nodes ahead of the other", "Reversing the list first", "Counting all nodes, then traversing again", "A hash map indexed by position"], 0),
      q("q3", "What combination of previously-learned techniques does the O(1)-space palindrome check use?", ["Fast/slow pointers (to find the middle) plus in-place reversal", "Merge sort plus hashing", "Dutch National Flag plus sliding window", "Cycle detection plus binary search"], 0),
      q("q4", "After checking a palindrome via the reverse-second-half technique, a careful implementation should:", ["Reverse the second half back, if the list must remain unmodified", "Always delete the second half afterward", "Leave the list changed - it doesn't matter", "Duplicate the entire list first"], 0),
      q("q5", "The \"two pointers, one N nodes ahead\" technique for the Nth-from-end node is most similar to which Week 1 pattern?", ["A fixed-size sliding window moving across the list", "Kadane's algorithm", "Hashing for O(1) lookups", "Three-way partitioning"], 0),
    ],
    problemIds: ["VZiC1YeWeaTacwYWW99f", "wJZXBjmCqwAeGDycxBsp"],
    xpReward: 50, coinReward: 20,
  },
  {
    dow: "sat", date: "2026-08-01", type: "test",
    title: "Week 2 Master Test: Linked Lists",
    concept: `This week covered five linked-list techniques: reversal, fast/slow pointers for cycle detection and finding the middle, merging and merge-sort, in-place segregation, and combining techniques for palindrome checks and fixed-offset traversal.

Today's master test combines all of it - five coding problems drawing on the week's patterns (none repeated from the weekday lessons), and ten MCQs checking whether the underlying ideas actually stuck.`,
    mcqs: [
      q("q1", "What two pointers does Floyd's cycle detection use, and at what relative speeds?", ["Slow (1 step) and fast (2 steps)", "Left and right, both the same speed", "Prev and next, both the same speed", "Low, mid, and high"], 0),
      q("q2", "Reversing a linked list iteratively runs in:", ["O(n) time, O(1) space", "O(n log n) time, O(n) space", "O(n^2) time, O(1) space", "O(log n) time, O(log n) space"], 0),
      q("q3", "Merging two sorted linked lists of length n and m takes:", ["O(n+m)", "O(n*m)", "O(n log m)", "O(1)"], 0),
      q("q4", "The technique for segregating 0s, 1s, 2s in a linked list is inspired by:", ["Dutch National Flag (three-way partitioning)", "Binary search", "Merge sort", "Kadane's algorithm"], 0),
      q("q5", "To find the middle of a linked list in a single pass, you use:", ["Slow/fast pointers", "A hash map", "Recursion only", "Binary search"], 0),
      q("q6", "Checking if a linked list is a palindrome in O(1) extra space requires combining:", ["Fast/slow pointers and in-place reversal", "Hashing and sorting", "Merge sort and binary search", "Dutch National Flag and sliding window"], 0),
      q("q7", "\"Rotate a Linked List by N nodes\" is most efficiently done by:", ["Finding the new head/tail via traversal and relinking pointers, without copying the list", "Copying every node into an array, rotating the array, then rebuilding the list", "Reversing the entire list twice", "Sorting the list first"], 0),
      q("q8", "Merge K Sorted Linked Lists can be solved efficiently using:", ["A min-heap holding the current head of each list", "Bubble sort across all nodes", "A single linear scan with no auxiliary structure", "Recursion with no merging step"], 0),
      q("q9", "Adding two numbers represented as linked lists (digit by digit) requires careful handling of:", ["Carry propagation between digits, similar to manual addition", "Only the first digit", "Sorting the digits first", "Removing duplicate digits"], 0),
      q("q10", "Removing duplicates from an ALREADY-SORTED linked list can be done in:", ["O(n) time, O(1) extra space, since duplicates are always adjacent", "O(n log n) time", "O(n) extra space, always required (a hash set)", "O(n^2) time only"], 0),
    ],
    problemIds: ["TRkEL1W4EbflKsSbDcdi", "5mNfgPJ212bQRtwKzCOI", "SmDwWsoMRx9NOr7iRgtN", "GFknMByYltbnyXmdOkvv", "JvhFjgzgTW0D5D6SMNSo"],
    xpReward: 150, coinReward: 60,
  },
];

for (const day of DAYS) {
  await db.collection("institutions").doc(SLUG).collection("dailyLearning").doc(day.date).set({
    ...day,
    weekId: WEEK_ID,
    status: "published",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
  console.log(`Seeded ${day.date} (${day.dow}): ${day.title} [${day.type}]`);
}

console.log(`\nDone. Week ${WEEK_ID} seeded for institution "${SLUG}".`);
process.exit(0);
