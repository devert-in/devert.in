import admin from "firebase-admin";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(join(__dirname, "service-account.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// DSA-450-sheet ingestion, LINKEDLIST topic, PART 2 - closing the gap against
// the sheet's full verbatim row list after seed-dsa-linkedlist-problems.mjs's
// curated first pass. Every expectedOutput below was generated and verified
// by running an independent Python reference implementation against the
// exact input (see PR/task notes) - none were hand-guessed.
//
// Rows intentionally NOT added here (legitimate skips, same reasoning as
// part 1's header comment):
//   - "Intersection Point of two Linked Lists" - needs real node identity
//     (two lists physically sharing a tail node), no clean stdin/stdout
//     serialization without a real pointer structure.
//   - "Clone a linked list with next and random pointer" - same reason,
//     cloning is only meaningful with real node identity to point at.
//   - "Can we reverse a linked list in less than O(n)?" - conceptual,
//     no coded answer.
//   - "Why Quicksort is preferred for Arrays and Merge Sort for LinkedLists?"
//     - conceptual, no coded answer.
//
// Convention (matching part 1 exactly): a linked list is serialized as
// "n" then "n space-separated values" (plus extra parameters like pos/k/X
// where the row needs them). Doubly/circular-linked-list rows reuse this
// identical value-sequence convention - only the algorithmic framing in the
// statement changes, per the task's instruction to stay consistent with the
// existing 15 problems' stdin/stdout convention.

const REWARD = { Easy: [30, 10], Medium: [50, 20], Hard: [80, 30] };
function p(title, category, difficulty, tags, statement, constraints, examplesText, hints, sampleTests, hiddenTests) {
  const [xpReward, coinReward] = REWARD[difficulty];
  return { title, category, difficulty, tags, statement, constraints, examplesText, hints, xpReward, coinReward, sampleTests, hiddenTests };
}

const PROBLEMS = [

p("Delete Loop in a Linked List", "Linked List", "Medium", ["Linked List", "Two Pointer"],
  "A singly linked list has n node values. Its last node's next pointer is connected back to the node at 0-indexed position pos (or there is no loop if pos is -1). Remove the loop, if any, by breaking that back-link, and print the resulting list's values in their original order.",
  "1 <= n <= 10^5, -1 <= pos < n",
  "Input:\n4\n1 2 3 4\n1\nOutput:\n1 2 3 4",
  ["First locate the loop with Floyd's cycle detection (slow/fast pointers), then find the exact node whose next pointer needs to be set to null.", "Removing the loop never changes the forward sequence of node values you'd print by walking from the head - it only stops the traversal from going on forever.", "If pos is -1 there's nothing to remove; the list already prints the same way it was given."],
  [{ input: "4\n1 2 3 4\n1", expectedOutput: "1 2 3 4", explanation: "" },
   { input: "3\n1 2 3\n-1", expectedOutput: "1 2 3", explanation: "" }],
  [{ input: "1\n1\n0", expectedOutput: "1", points: 1 },
   { input: "5\n1 2 3 4 5\n4", expectedOutput: "1 2 3 4 5", points: 1 },
   { input: "6\n1 2 3 4 5 6\n-1", expectedOutput: "1 2 3 4 5 6", points: 1 }]),

p("Find the Starting Point of the Loop in a Linked List", "Linked List", "Medium", ["Linked List", "Two Pointer"],
  "A singly linked list has n node values. Its last node's next pointer is connected back to the node at 0-indexed position pos (or there is no loop if pos is -1). Print the 0-indexed position where the loop begins, or -1 if there is no loop.",
  "1 <= n <= 10^5, -1 <= pos < n",
  "Input:\n4\n1 2 3 4\n1\nOutput:\n1",
  ["Use Floyd's algorithm to find the meeting point of a slow and fast pointer inside the loop.", "Once slow and fast meet, reset one pointer to the head and advance both one step at a time - they meet again exactly at the loop's starting node.", "If the two pointers never meet, there is no loop at all."],
  [{ input: "4\n1 2 3 4\n1", expectedOutput: "1", explanation: "" },
   { input: "3\n1 2 3\n-1", expectedOutput: "-1", explanation: "" }],
  [{ input: "1\n1\n0", expectedOutput: "0", points: 1 },
   { input: "5\n1 2 3 4 5\n0", expectedOutput: "0", points: 1 },
   { input: "6\n1 2 3 4 5 6\n3", expectedOutput: "3", points: 1 }]),

p("Remove Duplicates From an Unsorted Linked List", "Linked List", "Medium", ["Linked List", "Hashing"],
  "A singly linked list contains n integer values, not necessarily sorted, possibly with duplicates anywhere in the list. Remove every node whose value already appeared earlier in the list, keeping only the first occurrence of each value in its original position. Print the result.",
  "1 <= n <= 10^5",
  "Input:\n6\n1 2 1 3 2 4\nOutput:\n1 2 3 4",
  ["Since the list isn't sorted, duplicates can be anywhere - a hash set that remembers values already seen lets you decide in O(1) whether to keep or delete each node.", "Walk the list once; for each node, skip and unlink it if its value is already in the seen set, otherwise record it and move on.", "Without extra memory you'd need an O(n^2) pass comparing every node to every later node - the hash-set approach is the intended O(n) improvement."],
  [{ input: "6\n1 2 1 3 2 4", expectedOutput: "1 2 3 4", explanation: "" },
   { input: "4\n1 1 1 1", expectedOutput: "1", explanation: "" }],
  [{ input: "1\n5", expectedOutput: "5", points: 1 },
   { input: "5\n5 4 3 2 1", expectedOutput: "5 4 3 2 1", points: 1 },
   { input: "7\n3 1 3 2 1 4 2", expectedOutput: "3 1 2 4", points: 1 }]),

p("Move the Last Element to the Front of a Linked List", "Linked List", "Easy", ["Linked List"],
  "A singly linked list has n node values. Move its last node to become the new first node (front), shifting every other node one position later while keeping their relative order, and print the resulting sequence.",
  "1 <= n <= 10^5",
  "Input:\n5\n1 2 3 4 5\nOutput:\n5 1 2 3 4",
  ["Walk to the second-to-last node, since you'll need to detach the last node from it.", "Point the last node's next to the old head, then make the last node the new head, and set the second-to-last node's next to null.", "A list with a single node is unchanged by this operation."],
  [{ input: "5\n1 2 3 4 5", expectedOutput: "5 1 2 3 4", explanation: "" },
   { input: "1\n9", expectedOutput: "9", explanation: "" }],
  [{ input: "2\n1 2", expectedOutput: "2 1", points: 1 },
   { input: "4\n10 20 30 40", expectedOutput: "40 10 20 30", points: 1 },
   { input: "3\n-1 -2 -3", expectedOutput: "-3 -1 -2", points: 1 }]),

p("Add 1 to a Number Represented as a Linked List", "Linked List", "Medium", ["Linked List", "Math"],
  "A non-negative integer is represented as a linked list of its n digits, most-significant digit first. Print the digits of that number plus 1, most-significant digit first, with no leading zeros.",
  "1 <= n <= 10^4",
  "Input:\n3\n1 2 9\nOutput:\n1 3 0",
  ["Reverse the digit list (or use a stack) so you can add 1 starting from the least-significant digit and propagate any carry, just like adding 1 by hand.", "A carry that survives past the most-significant digit (e.g. 999 + 1) adds one extra leading digit to the result.", "Reverse the result back to most-significant-digit-first order before printing."],
  [{ input: "3\n1 2 9", expectedOutput: "1 3 0", explanation: "" },
   { input: "3\n9 9 9", expectedOutput: "1 0 0 0", explanation: "" }],
  [{ input: "1\n0", expectedOutput: "1", points: 1 },
   { input: "1\n9", expectedOutput: "1 0", points: 1 },
   { input: "4\n1 0 0 0", expectedOutput: "1 0 0 1", points: 1 }]),

p("Intersection of Two Sorted Linked Lists", "Linked List", "Easy", ["Linked List", "Two Pointer"],
  "Given two sorted singly linked lists (as n1 values, then n2 values), print the values that appear in both lists, in sorted order. If a value repeats in both lists, include it as many times as it validly pairs up between the two lists. If there is no common value, print -1.",
  "1 <= n1, n2 <= 10^5",
  "Input:\n4\n1 2 3 4\n3\n2 4 6\nOutput:\n2 4",
  ["Since both lists are already sorted, walk them together with two pointers instead of checking every pair.", "Advance whichever pointer is behind (points to the smaller value); when both point to equal values, that's a match - record it and advance both.", "If the pointers never find a common value, the answer is -1, not an empty line."],
  [{ input: "4\n1 2 3 4\n3\n2 4 6", expectedOutput: "2 4", explanation: "" },
   { input: "3\n1 3 5\n3\n2 4 6", expectedOutput: "-1", explanation: "" }],
  [{ input: "2\n1 1\n1\n1", expectedOutput: "1", points: 1 },
   { input: "3\n1 2 3\n3\n4 5 6", expectedOutput: "-1", points: 1 },
   { input: "5\n1 1 2 2 3\n3\n1 2 2", expectedOutput: "1 2 2", points: 1 }]),

p("Merge Sort on a Linked List", "Linked List", "Medium", ["Linked List", "Sorting", "Divide and Conquer"],
  "A singly linked list contains n integer values in no particular order. Sort it using the merge sort algorithm (repeatedly split the list in half, sort each half, then merge the two sorted halves) and print the sorted values.",
  "1 <= n <= 10^5",
  "Input:\n5\n5 3 4 1 2\nOutput:\n1 2 3 4 5",
  ["Find the middle of the list (slow/fast pointers) to split it into two halves, then recursively sort each half.", "Merge the two now-sorted halves the same way you'd merge two sorted linked lists.", "Merge sort is well-suited to linked lists because splitting and merging only relinks pointers - it needs no random access and no extra array."],
  [{ input: "5\n5 3 4 1 2", expectedOutput: "1 2 3 4 5", explanation: "" },
   { input: "4\n4 3 2 1", expectedOutput: "1 2 3 4", explanation: "" }],
  [{ input: "1\n7", expectedOutput: "7", points: 1 },
   { input: "3\n1 1 1", expectedOutput: "1 1 1", points: 1 },
   { input: "6\n-1 3 -5 2 0 4", expectedOutput: "-5 -1 0 2 3 4", points: 1 }]),

p("Quicksort on a Linked List", "Linked List", "Medium", ["Linked List", "Sorting"],
  "A singly linked list contains n integer values in no particular order. Sort it using the quicksort algorithm (pick a pivot, partition the list around it, then recursively sort the partitions) and print the sorted values.",
  "1 <= n <= 10^5",
  "Input:\n5\n5 3 4 1 2\nOutput:\n1 2 3 4 5",
  ["Instead of swapping array elements, quicksort on a linked list partitions by building two sub-lists - one for values less than the pivot, one for values greater or equal - and relinking them around the pivot node.", "Picking the last (or first) node of each sub-list as the pivot avoids needing random access to the middle.", "Quicksort's usual advantage - fast in-place swaps by index - doesn't apply to linked lists, which is exactly why merge sort is generally preferred for them."],
  [{ input: "5\n5 3 4 1 2", expectedOutput: "1 2 3 4 5", explanation: "" },
   { input: "4\n4 3 2 1", expectedOutput: "1 2 3 4", explanation: "" }],
  [{ input: "1\n7", expectedOutput: "7", points: 1 },
   { input: "3\n1 1 1", expectedOutput: "1 1 1", points: 1 },
   { input: "6\n-1 3 -5 2 0 4", expectedOutput: "-5 -1 0 2 3 4", points: 1 }]),

p("Check if a Linked List Is Circular", "Linked List", "Easy", ["Linked List"],
  "A singly linked list has n node values. Its last node's next pointer is connected back to the node at 0-indexed position pos (or there is no connection at all if pos is -1). The list is a proper circular linked list only if the last node connects all the way back to the very first node (pos = 0), so that every node lies on a single cycle. Print 'Yes' if it is a circular linked list this way, otherwise print 'No'.",
  "1 <= n <= 10^5, -1 <= pos < n",
  "Input:\n4\n1 2 3 4\n0\nOutput:\nYes",
  ["A circular linked list is stricter than 'has a loop' - the cycle must include every node, which only happens when the last node points back to the head.", "If pos is anything other than 0 (including -1), some node(s) near the head are left outside any cycle, so it isn't a circular list.", "You can check this in O(1) extra space just by reading where the last node's next pointer leads, without walking the whole list."],
  [{ input: "4\n1 2 3 4\n0", expectedOutput: "Yes", explanation: "" },
   { input: "4\n1 2 3 4\n-1", expectedOutput: "No", explanation: "" }],
  [{ input: "3\n1 2 3\n1", expectedOutput: "No", points: 1 },
   { input: "1\n1\n0", expectedOutput: "Yes", points: 1 },
   { input: "5\n1 2 3 4 5\n2", expectedOutput: "No", points: 1 }]),

p("Split a Circular Linked List Into Two Halves", "Linked List", "Medium", ["Linked List", "Two Pointer"],
  "A circular singly linked list has n node values (its last node's next pointer points back to the first node). Split it into two circular linked lists of roughly equal size: the first half gets ceil(n/2) nodes and the second half gets the rest, both taken from the front in original order. Print the first half's values on one line and the second half's values on the next line.",
  "2 <= n <= 10^5",
  "Input:\n6\n1 2 3 4 5 6\nOutput:\n1 2 3\n4 5 6",
  ["Use the slow/fast pointer technique to find the split point in one pass, since the list's length isn't given directly as a count you can halve.", "After locating the split point, make each half's last node point back to its own first node to keep both halves properly circular.", "When n is odd, the extra node goes to the first half."],
  [{ input: "6\n1 2 3 4 5 6", expectedOutput: "1 2 3\n4 5 6", explanation: "" },
   { input: "5\n1 2 3 4 5", expectedOutput: "1 2 3\n4 5", explanation: "" }],
  [{ input: "3\n1 2 3", expectedOutput: "1 2\n3", points: 1 },
   { input: "2\n1 2", expectedOutput: "1\n2", points: 1 },
   { input: "7\n1 2 3 4 5 6 7", expectedOutput: "1 2 3 4\n5 6 7", points: 1 }]),

p("Deletion From a Circular Linked List", "Linked List", "Medium", ["Linked List"],
  "A circular singly linked list has n node values (its last node's next pointer points back to the first node). Delete the node at 0-indexed position k and print the remaining n-1 values, starting from the list's head (the original head, unless it was the node deleted, in which case the following node becomes the new head).",
  "2 <= n <= 10^5, 0 <= k < n",
  "Input:\n4\n10 20 30 40\n0\nOutput:\n20 30 40",
  ["Find the node just before position k (remembering the list wraps around, so position 0's predecessor is the last node) and relink its next pointer to skip over the deleted node.", "If you're deleting the head itself, update the head pointer to the following node before relinking.", "The remaining nodes keep their original relative order - only the one node at position k disappears."],
  [{ input: "4\n10 20 30 40\n0", expectedOutput: "20 30 40", explanation: "" },
   { input: "4\n10 20 30 40\n2", expectedOutput: "10 20 40", explanation: "" }],
  [{ input: "2\n7 8\n1", expectedOutput: "7", points: 1 },
   { input: "3\n1 2 3\n2", expectedOutput: "1 2", points: 1 },
   { input: "5\n1 2 3 4 5\n1", expectedOutput: "1 3 4 5", points: 1 }]),

p("Reverse a Doubly Linked List", "Linked List", "Easy", ["Linked List", "Doubly Linked List"],
  "A doubly linked list is given as its n node values in order. Print the values in reverse order.",
  "1 <= n <= 10^5",
  "Input:\n5\n1 2 3 4 5\nOutput:\n5 4 3 2 1",
  ["A doubly linked list already has backward links, so reversing it is a matter of swapping each node's next and prev pointers, then swapping the head and tail.", "Walk the list once, swap next/prev at each node, then set the new head to what used to be the tail.", "This is O(n) time and needs no extra list or array, unlike building a singly linked list's reverse from scratch."],
  [{ input: "5\n1 2 3 4 5", expectedOutput: "5 4 3 2 1", explanation: "" },
   { input: "1\n7", expectedOutput: "7", explanation: "" }],
  [{ input: "2\n1 2", expectedOutput: "2 1", points: 1 },
   { input: "3\n5 5 5", expectedOutput: "5 5 5", points: 1 },
   { input: "4\n-1 -2 -3 -4", expectedOutput: "-4 -3 -2 -1", points: 1 }]),

p("Find Pairs With a Given Sum in a Doubly Linked List", "Linked List", "Medium", ["Linked List", "Doubly Linked List", "Two Pointer"],
  "A doubly linked list contains n values sorted in ascending order. Given a target sum X, find pairs of values that add up to X using the two-pointer technique: start one pointer at the front and one at the back, and move them toward each other. Print each pair found as 'a b' (a from the front pointer, b from the back pointer) on its own line, in the order the two pointers find them. If no pair sums to X, print -1.",
  "2 <= n <= 10^5",
  "Input:\n6\n1 2 3 4 5 6\n7\nOutput:\n1 6\n2 5\n3 4",
  ["A doubly linked list lets you walk from both ends at once in O(1) per step, which is exactly what the two-pointer technique needs.", "If the pair's sum is too small, advance the front pointer forward; if it's too large, move the back pointer backward; if it matches, record the pair and move both pointers inward.", "Stop as soon as the two pointers meet or cross - continuing further would only repeat or invalidate pairs."],
  [{ input: "6\n1 2 3 4 5 6\n7", expectedOutput: "1 6\n2 5\n3 4", explanation: "" },
   { input: "5\n1 2 3 4 5\n9", expectedOutput: "4 5", explanation: "" }],
  [{ input: "4\n1 2 3 4\n100", expectedOutput: "-1", points: 1 },
   { input: "4\n1 1 1 1\n2", expectedOutput: "1 1\n1 1", points: 1 },
   { input: "7\n1 2 3 4 5 6 7\n8", expectedOutput: "1 7\n2 6\n3 5", points: 1 }]),

p("Count Triplets in a Sorted Doubly Linked List With a Given Sum", "Linked List", "Hard", ["Linked List", "Doubly Linked List", "Two Pointer"],
  "A doubly linked list contains n values sorted in ascending order. Given a target sum X, count how many triplets of positions i < j < k have values summing to exactly X. Print that count.",
  "1 <= n <= 10^5",
  "Input:\n5\n1 2 3 4 5\n9\nOutput:\n2",
  ["Fix the first element of the triplet, then use the two-pointer technique on the remaining values (front and back pointers) to count pairs that complete the sum, just like the two-sum-pairs version.", "Be careful with repeated values - when several consecutive nodes share the same value, a naive 'move by one' two-pointer step can undercount how many equal-value pairs actually complete a valid triplet, so count matching runs explicitly rather than assuming each is distinct.", "This runs in O(n^2) overall: one pass to fix the first element, and an O(n) two-pointer sweep for each fixed element."],
  [{ input: "5\n1 2 3 4 5\n9", expectedOutput: "2", explanation: "" },
   { input: "4\n1 2 3 4\n100", expectedOutput: "0", explanation: "" }],
  [{ input: "3\n1 2 3\n6", expectedOutput: "1", points: 1 },
   { input: "6\n1 1 1 2 2 3\n5", expectedOutput: "6", points: 1 },
   { input: "5\n-1 0 1 2 3\n2", expectedOutput: "2", points: 1 }]),

p("Sort a K-Sorted Doubly Linked List", "Linked List", "Medium", ["Linked List", "Doubly Linked List", "Heap"],
  "A doubly linked list contains n values where each value is guaranteed to be at most k positions away from where it would sit in the fully sorted list. Sort the list and print the sorted values.",
  "1 <= n <= 10^5, 0 <= k < n",
  "Input:\n6\n3 1 2 6 4 5\n2\nOutput:\n1 2 3 4 5 6",
  ["Because no value is more than k positions from its sorted position, a min-heap of size k+1 is enough to always know the next smallest value early.", "Insert the first k+1 values into the min-heap, then repeatedly pop the minimum (that's the next output value) and push in the next unread value from the list, if any.", "This runs in O(n log k), much better than a general O(n log n) sort when k is small."],
  [{ input: "6\n3 1 2 6 4 5\n2", expectedOutput: "1 2 3 4 5 6", explanation: "" },
   { input: "5\n2 1 4 3 5\n1", expectedOutput: "1 2 3 4 5", explanation: "" }],
  [{ input: "1\n9\n0", expectedOutput: "9", points: 1 },
   { input: "4\n1 2 3 4\n1", expectedOutput: "1 2 3 4", points: 1 },
   { input: "7\n6 5 7 1 2 3 4\n3", expectedOutput: "1 2 3 4 5 6 7", points: 1 }]),

p("Rotate a Doubly Linked List by N Nodes", "Linked List", "Medium", ["Linked List", "Doubly Linked List"],
  "A doubly linked list has values given in order. Rotate it left by n nodes (the first n nodes move, in order, to the end of the list) and print the result.",
  "1 <= list length <= 10^5, 0 <= n <= list length",
  "Input:\n7\n1 2 3 4 5 6 7\n3\nOutput:\n4 5 6 7 1 2 3",
  ["Find what will become the new head (the (n+1)th node) and the new tail (the old nth node).", "Connect the old tail's next/prev to the old head's prev/next to close the loop, then break the link between the old nth and (n+1)th nodes.", "Having both next and prev pointers doesn't change the algorithm's shape versus a singly linked list - it just means you must keep both directions consistent when relinking."],
  [{ input: "7\n1 2 3 4 5 6 7\n3", expectedOutput: "4 5 6 7 1 2 3", explanation: "" },
   { input: "5\n1 2 3 4 5\n2", expectedOutput: "3 4 5 1 2", explanation: "" }],
  [{ input: "1\n1\n0", expectedOutput: "1", points: 1 },
   { input: "2\n1 2\n1", expectedOutput: "2 1", points: 1 },
   { input: "3\n1 2 3\n3", expectedOutput: "1 2 3", points: 1 }]),

p("Rotate a Doubly Linked List in Groups of Given Size", "Linked List", "Hard", ["Linked List", "Doubly Linked List"],
  "A doubly linked list has n values. For every consecutive group of k nodes, left-rotate that group by one position (its first node moves to the end of that same group, and the rest shift earlier), independently for each group - including a final group with fewer than k nodes. Print the resulting sequence.",
  "1 <= k <= n <= 10^5",
  "Input:\n8\n1 2 3 4 5 6 7 8\n3\nOutput:\n2 3 1 5 6 4 8 7",
  ["Process the list k nodes at a time, exactly like reversing in groups, except within each group you only move the first node to that group's end rather than reversing the whole group.", "A group of size 1 (which can happen in the final, possibly-shorter group) is unaffected by a left-rotation-by-1.", "Keep both next and prev pointers correctly updated at the group boundaries, since this is a doubly linked list."],
  [{ input: "8\n1 2 3 4 5 6 7 8\n3", expectedOutput: "2 3 1 5 6 4 8 7", explanation: "" },
   { input: "5\n1 2 3 4 5\n2", expectedOutput: "2 1 4 3 5", explanation: "" }],
  [{ input: "1\n9\n1", expectedOutput: "9", points: 1 },
   { input: "4\n1 2 3 4\n4", expectedOutput: "2 3 4 1", points: 1 },
   { input: "6\n1 2 3 4 5 6\n1", expectedOutput: "1 2 3 4 5 6", points: 1 }]),

p("Flatten a Linked List", "Linked List", "Hard", ["Linked List", "Heap"],
  "You are given m separate sorted linked lists (each list's length followed by its sorted values), representing a top-level list whose nodes each have a 'child' pointer to one of these sorted sub-lists. Flatten all of them into a single fully sorted linked list by merging every value together, and print the result.",
  "1 <= m <= 100, 0 <= each sub-list's length <= 1000",
  "Input:\n3\n3\n1 4 5\n2\n2 6\n2\n3 7\nOutput:\n1 2 3 4 5 6 7",
  ["This is the same idea as merging k sorted linked lists: repeatedly merge pairs of sorted lists (or use a min-heap across all of them) until only one sorted list remains.", "A common approach merges the child lists two at a time, from the last pair forward, reusing the standard two-sorted-lists merge each time.", "The final result must contain every value from every child list, fully sorted, regardless of which order you merge them in."],
  [{ input: "3\n3\n1 4 5\n2\n2 6\n2\n3 7", expectedOutput: "1 2 3 4 5 6 7", explanation: "" },
   { input: "2\n2\n1 3\n1\n2", expectedOutput: "1 2 3", explanation: "" }],
  [{ input: "1\n4\n1 2 3 4", expectedOutput: "1 2 3 4", points: 1 },
   { input: "2\n1\n5\n1\n5", expectedOutput: "5 5", points: 1 },
   { input: "3\n2\n1 2\n2\n3 4\n2\n5 6", expectedOutput: "1 2 3 4 5 6", points: 1 }]),

p("Multiply Two Numbers Represented by Linked Lists", "Linked List", "Hard", ["Linked List", "Math"],
  "Two non-negative integers are each represented as a linked list of digits, most-significant digit first. Given both lists, print the digits of their product, most-significant digit first (no leading zeros, unless the product itself is 0).",
  "1 <= number of digits in each list <= 500",
  "Input:\n2\n1 2\n1\n3\nOutput:\n3 6",
  ["Convert each linked list of digits into the number it represents (most-significant digit first) by walking it once and accumulating value = value*10 + digit.", "Multiply the two resulting numbers using long multiplication (digit by digit, tracking carries), the same technique used for the 'Add Two Numbers' problem's digit-by-digit addition.", "Strip any leading zero digits from the product before printing, unless the product is exactly 0."],
  [{ input: "2\n1 2\n1\n3", expectedOutput: "3 6", explanation: "" },
   { input: "2\n9 9\n1\n9", expectedOutput: "8 9 1", explanation: "" }],
  [{ input: "1\n0\n2\n9 9", expectedOutput: "0", points: 1 },
   { input: "1\n5\n1\n5", expectedOutput: "2 5", points: 1 },
   { input: "3\n1 0 0\n1\n2", expectedOutput: "2 0 0", points: 1 }]),

p("Find the First Non-Repeating Character From a Stream of Characters", "Linked List", "Medium", ["Linked List", "Queue", "Hashing"],
  "A stream of n lowercase letters arrives one character at a time. After each character is appended to the stream, print the first character (reading the stream so far from the beginning) that has appeared exactly once so far, or -1 if every character seen so far has a duplicate. Print all n answers on a single line, separated by spaces.",
  "1 <= n <= 10^5",
  "Input:\n7\naabcbcd\nOutput:\na -1 b b c -1 d",
  ["A doubly linked list of 'currently non-repeating' characters, alongside a count for every letter, lets you answer each step in O(1) amortized: append a new character to the DLL, and if it now repeats, unlink it from the DLL.", "The front of that doubly linked list is always the current answer - the first character that hasn't repeated yet - or -1 if the list is empty.", "This is why the problem is grouped with linked-list techniques: an array alone can't delete from the middle of the 'still unique' sequence in O(1), but a DLL can."],
  [{ input: "7\naabcbcd", expectedOutput: "a -1 b b c -1 d", explanation: "" },
   { input: "4\naaaa", expectedOutput: "a -1 -1 -1", explanation: "" }],
  [{ input: "1\nz", expectedOutput: "z", points: 1 },
   { input: "5\nabcab", expectedOutput: "a a a b c", points: 1 },
   { input: "6\nxxyyzz", expectedOutput: "x -1 y -1 z -1", points: 1 }]),

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
console.log(`LINKEDLIST topic (part 2): created ${created} problem(s), skipped ${skipped} already-existing.`);
