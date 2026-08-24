import admin from "firebase-admin";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(join(__dirname, "service-account.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// Week 1 of MRCET's structured Mon-Sat Daily Learning program - continues
// the theme already seeded on the generic global course ("Arrays & Two
// Pointers" / Day 1: Two-Pointer Technique), now as institution-scoped,
// day-dated content under institutions/mrcet/dailyLearning/{date}. Every
// coding pick below is a real, already-seeded, already-numbered CodeLab
// problem id (verified live against Firestore before writing this script) -
// never a placeholder. Every MCQ answer was hand-derived/traced, not
// guessed (Kadane's/sliding-window/DNF traces shown in the authoring notes,
// not repeated here).

const SLUG = "mrcet";
const WEEK_ID = "2026-07-20"; // the Monday this week starts

const q = (id, text, options, correctIndex) => ({ id, text, options, correctIndex });

const DAYS = [
  {
    dow: "mon", date: "2026-07-20", type: "lesson",
    title: "Day 1: The Two-Pointer Technique",
    concept: `Two pointers is a technique where you use two index variables that move through an array - often from opposite ends, sometimes both from the start at different speeds.

Classic use case: finding a pair in a SORTED array that sums to a target.
  left = 0, right = length - 1
  while left < right:
    sum = arr[left] + arr[right]
    if sum == target: found it
    elif sum < target: left += 1
    else: right -= 1

This runs in O(n) instead of the O(n^2) brute-force nested loop, because each pointer only moves forward - it never backtracks. Try it on: [2, 7, 11, 15], target 9 -> should find (2, 7).

The "opposite ends" pattern above is the most common two-pointer shape, but pointers moving in the SAME direction at different speeds (slow/fast) is its own important variant - that's exactly how Floyd's cycle detection finds a loop in a linked list.`,
    mcqs: [
      q("q1", "What is the time complexity of the two-pointer approach on a sorted array?", ["O(n^2)", "O(n log n)", "O(n)", "O(log n)"], 2),
      q("q2", "The two-pointer technique for finding a pair with a given sum requires the array to be:", ["Sorted", "Unsorted", "All positive numbers", "Of even length"], 0),
      q("q3", "In the opposite-ends two-pointer pattern, when sum < target, you should:", ["Move left pointer right (increase sum)", "Move right pointer left (decrease sum)", "Move both pointers inward", "Stop - no solution exists"], 0),
      q("q4", "For array [2, 7, 11, 15] with target 9, which pair do the two pointers find?", ["(2, 7)", "(7, 11)", "(2, 11)", "(11, 15)"], 0),
      q("q5", "Two pointers moving in the SAME direction at different speeds (slow/fast) is the basis of which classic problem?", ["Detecting a cycle in a linked list", "Sorting an array", "Finding the median of two arrays", "Computing a hash"], 0),
    ],
    problemIds: ["39GCcFGEkFQPVlOeS7NV", "mv3keamk4B96YVxgfAFD"],
    xpReward: 50, coinReward: 20,
  },
  {
    dow: "tue", date: "2026-07-21", type: "lesson",
    title: "Day 2: The Sliding Window Technique",
    concept: `A sliding window is a contiguous range [left, right] over an array or string that you grow and shrink instead of recomputing from scratch on every step.

Fixed-size window (size k): slide by adding arr[right], removing arr[left], moving both forward by one - e.g. the maximum sum of any k consecutive elements.

Variable-size window: grow right while some condition holds (e.g. window sum < target); shrink from left the moment it's satisfied, to see if a smaller window still works. This is how "smallest subarray with sum greater than a given value" runs in O(n) instead of checking every subarray in O(n^2).

Worked example: arr = [1, 4, 45, 6, 0, 19], target x = 51. Expanding right until the sum exceeds 51, then shrinking left as far as possible while staying above 51, the smallest such window is [4, 45, 6] (sum 55, length 3) - shorter than the naive [1, 4, 45, 6] (length 4).

Rule of thumb: if you catch yourself writing a nested loop where the inner loop's start only ever moves forward as the outer index grows, that's a sliding window in disguise - and it can almost always be flattened into one O(n) pass with two pointers.`,
    mcqs: [
      q("q1", "A variable-size sliding window's right pointer typically:", ["Only ever moves forward", "Moves back and forth freely", "Jumps in binary-search steps", "Never moves"], 0),
      q("q2", "For 'smallest subarray with sum >= target', once the current window's sum meets the target, you should:", ["Try shrinking from the left to see if a smaller window still works", "Immediately stop and return this window's size", "Grow the window further right", "Restart from index 0"], 0),
      q("q3", "The main advantage of sliding window over checking every subarray is:", ["O(n) instead of O(n^2) time", "It uses no extra memory ever", "It only works on sorted arrays", "It guarantees the maximum subarray"], 0),
      q("q4", "A FIXED-size sliding window of size k, moving from index i to i+1, updates the running sum by:", ["Adding arr[i+k] and subtracting arr[i]", "Recomputing the full sum from scratch", "Adding arr[i] and subtracting arr[i+k]", "Multiplying the sum by k"], 0),
      q("q5", "For arr = [1, 4, 45, 6, 0, 19], x = 51, the length of the smallest subarray with sum greater than x is:", ["3", "2", "4", "1"], 0),
    ],
    problemIds: ["rl0cUisJ30Sk8K7BBlR9", "5qHUCLMQe6RDIMojqJuS"],
    xpReward: 50, coinReward: 20,
  },
  {
    dow: "wed", date: "2026-07-22", type: "lesson",
    title: "Day 3: Kadane's Algorithm & Maximum Subarray",
    concept: `Kadane's Algorithm finds the maximum sum of any contiguous subarray in O(n), using one pass and one running variable.

  maxEndingHere = 0
  maxSoFar = -infinity
  for x in arr:
    maxEndingHere = max(x, maxEndingHere + x)
    maxSoFar = max(maxSoFar, maxEndingHere)

The key insight: if carrying the running sum forward would make it smaller than just starting fresh at the current element, restart there - a negative running sum can only hurt every future sum, so there's never a reason to keep it.

Traced on [-2, 1, -3, 4, -1, 2, 1, -5, 4]: the running max grows to 4, then 4, then 5, then 6, and never exceeds 6 again - so the maximum subarray is [4, -1, 2, 1] with sum 6.

The same running-max idea generalizes to maximum PRODUCT subarray - except now you must track both a running MAX and a running MIN, because multiplying by a negative number can flip the most negative running product into the new largest one.`,
    mcqs: [
      q("q1", "In Kadane's algorithm, when the running sum would drop below the current element's own value, what happens?", ["It restarts at just the current element instead", "It is force-set to 0", "It keeps accumulating regardless", "The algorithm terminates"], 0),
      q("q2", "For [-2, 1, -3, 4, -1, 2, 1, -5, 4], the maximum subarray sum is:", ["6", "4", "7", "5"], 0),
      q("q3", "Kadane's algorithm runs in:", ["O(n)", "O(n log n)", "O(n^2)", "O(1)"], 0),
      q("q4", "For 'Maximum Product Subarray', why must you also track a running MINIMUM alongside the running maximum?", ["Multiplying by a negative number can turn the smallest running product into the largest", "To detect zeros in the array", "To handle empty arrays", "Because products overflow faster than sums"], 0),
      q("q5", "If every element of the array is negative, the maximum-sum contiguous subarray is:", ["The single largest (least negative) element", "Always 0", "Undefined", "The sum of the whole array"], 0),
    ],
    problemIds: ["dfx1bUYaSXIyrqleuJjG", "sGHNowaPaF9c4FfrU5n0"],
    xpReward: 50, coinReward: 20,
  },
  {
    dow: "thu", date: "2026-07-23", type: "lesson",
    title: "Day 4: Partitioning Arrays - the Dutch National Flag",
    concept: `Sorting an array of only 0s, 1s and 2s doesn't need a real sort - it needs three pointers: low, mid, high.
- Everything before low is 0.
- Everything from low to mid-1 is 1.
- Everything after high is 2.
- arr[mid] is the unexamined element currently being classified.

  low = 0, mid = 0, high = n - 1
  while mid <= high:
    if arr[mid] == 0: swap(low, mid); low += 1; mid += 1
    elif arr[mid] == 1: mid += 1
    else: swap(mid, high); high -= 1   # mid does NOT advance here

This is the Dutch National Flag algorithm (Dijkstra), one pass, O(n) time. Notice mid stays put after the arr[mid]==2 swap - the element just swapped in from the high end hasn't been classified yet, so it needs to be checked again next iteration.

It generalizes directly to Three-Way Partitioning: instead of hardcoded 0/1/2, partition around a chosen pivot value into "less than pivot", "equal to pivot", "greater than pivot" - the exact same three-pointer skeleton. This is also the trick that makes QuickSort efficient on arrays with many duplicate keys, where a plain two-way partition degrades badly.`,
    mcqs: [
      q("q1", "In the Dutch National Flag algorithm, when arr[mid] == 2, what happens to mid?", ["It stays the same - the swapped-in element must still be classified", "It increments", "It resets to 0", "It swaps with low"], 0),
      q("q2", "The Dutch National Flag algorithm sorts an array of 0s, 1s, 2s in:", ["O(n), single pass", "O(n log n)", "O(n^2)", "O(n), but two passes"], 0),
      q("q3", "Three-way partitioning around a pivot value generalizes which classic problem?", ["Dutch National Flag (sort 0s, 1s, 2s)", "Binary search", "Merge sort", "Quickselect"], 0),
      q("q4", "Why does mid advance when arr[mid] == 1 but NOT when arr[mid] == 2?", ["The element just swapped in from the high end hasn't been classified yet", "Because 1 is treated as the pivot value", "Because everything past high is always already sorted", "It's inconsistent - mid should always advance"], 0),
      q("q5", "Three-way partitioning is especially useful for QuickSort when the array has:", ["Many duplicate keys", "Already-sorted data", "Only unique keys", "Negative numbers"], 0),
    ],
    problemIds: ["eXfbRDquKCp9HlMlwAwH", "gKckTFRd1yw1BDiq6ed2"],
    xpReward: 50, coinReward: 20,
  },
  {
    dow: "fri", date: "2026-07-24", type: "lesson",
    title: "Day 5: Hashing for O(1) Lookups on Arrays",
    concept: `A hash map turns "have I seen this value before?" from an O(n) linear scan into an O(1) average-case lookup - which is what makes a huge class of array problems solvable in a single O(n) pass instead of nested O(n^2) loops.

Two recurring patterns:
1. Complement lookup: to check if any pair sums to a target, for each x check whether (target - x) is already in a set you've been building as you go - one pass, no nested loop.
2. Running prefix-sum lookup: to check if any subarray sums to exactly 0, keep a running prefix sum and store every prefix sum you've seen in a hash set. If the current prefix sum has been seen before, everything between those two occurrences sums to exactly 0 - because the difference of two equal prefix sums is 0.

The same idea powers majority-element counting (frequency map), duplicate detection, and "longest consecutive sequence" (put every number in a set, then only start counting a streak from a number whose predecessor is NOT in the set - that guarantees every streak gets counted exactly once, from its true start).`,
    mcqs: [
      q("q1", "Using a hash set to find a pair summing to a target reduces the time complexity from:", ["O(n^2) to O(n)", "O(n) to O(1)", "O(n log n) to O(n)", "O(n^2) to O(log n)"], 0),
      q("q2", "If a running prefix sum repeats at two different indices, what can you conclude about the subarray strictly between them?", ["It sums to exactly 0", "It sums to the target value", "It is sorted", "It contains a duplicate"], 0),
      q("q3", "To find the majority element (appears more than n/2 times) in O(n) time using extra memory, the simplest approach is:", ["Count frequencies with a hash map", "Sort the array first", "Binary search", "Two-pointer scan"], 0),
      q("q4", "For 'longest consecutive sequence', why only start counting a streak from numbers whose predecessor (num-1) is NOT in the set?", ["So every streak gets counted exactly once, from its true start", "To save memory", "Because predecessors are always duplicates", "It's required for hashing to work at all"], 0),
      q("q5", "A hash-set lookup has average time complexity of:", ["O(1)", "O(log n)", "O(n)", "O(n log n)"], 0),
    ],
    problemIds: ["eL0uOb5hpx7JsUpq8nog", "9vwpbe27DfkR7yBGdUkC"],
    xpReward: 50, coinReward: 20,
  },
  {
    dow: "sat", date: "2026-07-25", type: "test",
    title: "Week 1 Master Test: Arrays & Two Pointers",
    concept: `This week covered five core array techniques: two pointers, sliding window, Kadane's algorithm, Dutch National Flag partitioning, and hashing for O(1) lookups.

Today's master test combines all five - five coding problems drawing on the week's patterns, and ten MCQs checking whether the underlying ideas (not just the code) actually stuck. There's no new concept to read today; this is where the week gets scored.`,
    mcqs: [
      q("q1", "Which technique finds a pair with a given sum in a SORTED array in O(n) time and O(1) extra space?", ["Two pointers from both ends", "Hashing", "Binary search on every element", "Sorting again"], 0),
      q("q2", "What is the overall time complexity of Kadane's algorithm on an array of size n?", ["O(n)", "O(n log n)", "O(n^2)", "O(2^n)"], 0),
      q("q3", "In the Trapping Rain Water problem, the water trapped above index i is bounded above by:", ["min(maxLeft[i], maxRight[i]) - height[i]", "max(maxLeft[i], maxRight[i])", "height[i] itself", "maxLeft[i] + maxRight[i]"], 0),
      q("q4", "The Dutch National Flag algorithm uses how many pointers?", ["3", "2", "1", "4"], 0),
      q("q5", "A sliding window's size is called 'variable' when:", ["It grows or shrinks based on whether a condition holds", "It is always exactly k", "It never changes", "It is chosen randomly"], 0),
      q("q6", "To detect a subarray summing to 0 using prefix sums and hashing, you look for:", ["Two equal prefix sums at different indices", "A prefix sum equal to 0 only at the very first index", "The maximum prefix sum", "A negative prefix sum"], 0),
      q("q7", "For the Chocolate Distribution Problem (minimize the gap between the max and min packet given to m students), the correct first step is:", ["Sort the array, then slide a window of size m", "Use a hash map", "Apply Kadane's algorithm", "Use two pointers from both ends"], 0),
      q("q8", "Moore's Voting Algorithm finds the majority element in:", ["O(n) time, O(1) extra space", "O(n) time, O(n) extra space", "O(n log n) time, O(1) space", "O(n^2) time, O(1) space"], 0),
      q("q9", "For 'Count Triplets Such That One Element Is the Sum of the Other Two', after sorting, the standard approach fixes the largest element and then:", ["Uses two pointers on the remaining elements to check pair sums", "Uses a nested loop with hashing only", "Uses binary search on every pair", "Uses Kadane's algorithm"], 0),
      q("q10", "Which technique generally works in a single left-to-right pass using O(1) extra pointers - no hashing, no sorting needed?", ["Two pointers on an already-sorted array", "Hashing for pair sums", "Sorting-based partitioning", "Prefix-sum plus hash set"], 0),
    ],
    problemIds: ["a6XAEuiN2hO46DrXbBeZ", "4jN8wbcnn3ejnhMrjw0R", "qul8osC0ssCn6lYlsEIh", "cHv8ZHCU1rPT8rUozYjg", "2184MZTw1dzZWJnpgwuj"],
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
