import admin from "firebase-admin";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(join(__dirname, "service-account.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// Week 1 no longer teaches named patterns (two-pointer/sliding-window/
// Dutch National Flag/Kadane's/hashing) by name - it's beginner traversal
// now. Week 2's Thursday/Friday lessons referenced those names as "recall
// from Week 1", which would confuse students who never saw them. Patched
// to introduce each idea inline, self-contained, instead of pointing back.

const q = (id, text, options, correctIndex) => ({ id, text, options, correctIndex });

await db.collection("institutions").doc("mrcet").collection("dailyLearning").doc("2026-07-30").set({
  concept: `Segregating a linked list's nodes by category - even/odd, or 0s/1s/2s - without extra arrays is a rearrange-pointers problem, not a values problem.

For even/odd: walk the list once maintaining two separate sub-lists (an "even" chain and an "odd" chain) built as you go, then splice the odd chain onto the end of the even chain. One pass, O(n) time, O(1) extra space - the original node objects are reused, just re-linked.

For 0s/1s/2s: maintain three separate sub-list tails (zero/one/two) while walking the list once, appending each node to the matching sub-list as you see it, then joining zero -> one -> two at the end. Keeping three separate "buckets" going at once during a single pass, instead of sorting, is common enough to have a name - the Dutch National Flag technique - usually taught on arrays first, but the core idea transfers directly to linked lists too.`,
  mcqs: [
    q("q1", "Segregating even and odd nodes in a linked list (keeping relative order within each group) can be done in:", ["O(n) time, O(1) extra space (just rearranging pointers)", "O(n log n) time", "O(n) extra space, always required", "O(n^2) time"], 0),
    q("q2", "Maintaining three separate \"bucket\" sub-lists while making a single pass through the data is known as which technique?", ["The Dutch National Flag algorithm (three-way partitioning)", "Kadane's algorithm", "Binary search", "Sliding window"], 0),
    q("q3", "When segregating even/odd nodes, why maintain separate \"even\" and \"odd\" sub-list pointers?", ["To build both groups in a single pass, then join them at the end", "Because linked lists require two heads", "To count nodes only", "It's not actually necessary"], 0),
    q("q4", "After segregating 0s, 1s, 2s in a linked list, the resulting order is:", ["All 0s, then all 1s, then all 2s", "Sorted numerically ascending, 0s only", "Random order", "Reversed order"], 0),
    q("q5", "Rearranging nodes in a linked list (instead of their values) preserves:", ["The actual node objects/identity, just with changed next-pointers", "Nothing - values must always be copied", "The original list's cycle, if one exists", "Only the head pointer"], 0),
  ],
}, { merge: true });
console.log("Patched 2026-07-30 (Thursday)");

await db.collection("institutions").doc("mrcet").collection("dailyLearning").doc("2026-07-31").set({
  concept: `Checking if a linked list is a palindrome in O(n) time and O(1) extra space combines two techniques from this week: find the middle with slow/fast pointers, reverse the second half in-place, then walk both halves comparing values. If a caller needs the list left unmodified afterward, reverse the second half back before returning.

Finding the Nth node from the end in a single pass is a fixed-size two-pointer trick: advance one pointer N nodes ahead first, then move both pointers together one step at a time - when the lead pointer reaches the end, the trailing pointer is exactly N nodes from the end. Keeping a constant gap of N nodes between two pointers as they both slide forward together is the same core idea as a fixed-size sliding window (usually taught on arrays first) - the window here just has width N and lives on a linked list instead.`,
  mcqs: [
    q("q1", "To check if a linked list is a palindrome in O(n) time and O(1) extra space, the standard approach:", ["Finds the middle, reverses the second half, then compares both halves", "Copies all values into an array and checks the array", "Uses a stack for all nodes", "Sorts the list and compares"], 0),
    q("q2", "Finding the Nth node from the end of a linked list in one pass uses:", ["Two pointers, where one starts N nodes ahead of the other", "Reversing the list first", "Counting all nodes, then traversing again", "A hash map indexed by position"], 0),
    q("q3", "What combination of previously-learned techniques does the O(1)-space palindrome check use?", ["Fast/slow pointers (to find the middle) plus in-place reversal", "Merge sort plus hashing", "Dutch National Flag plus sliding window", "Cycle detection plus binary search"], 0),
    q("q4", "After checking a palindrome via the reverse-second-half technique, a careful implementation should:", ["Reverse the second half back, if the list must remain unmodified", "Always delete the second half afterward", "Leave the list changed - it doesn't matter", "Duplicate the entire list first"], 0),
    q("q5", "The \"two pointers, one N nodes ahead\" technique for the Nth-from-end node is most similar to which array technique, usually taught first on arrays?", ["A fixed-size sliding window moving across the array/list", "Kadane's algorithm", "Hashing for O(1) lookups", "Three-way partitioning"], 0),
  ],
}, { merge: true });
console.log("Patched 2026-07-31 (Friday)");

process.exit(0);
