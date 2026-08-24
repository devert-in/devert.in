import admin from "firebase-admin";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(join(__dirname, "service-account.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// Replaces Week 1's content in place (same 6 dates) - the original version
// opened with named pattern techniques (two-pointer, sliding window,
// Kadane's, Dutch National Flag) on day one, which assumes prior DSA
// exposure. This cohort is genuinely new to DSA, so this version starts
// from "what is an array" and stays at brute-force/O(n)-traversal level
// all week - every problem is Easy, nothing here needs a named technique to
// solve. The named patterns (two-pointer etc.) still get taught, just
// later, once traversal/searching/counting are actually solid.

const SLUG = "mrcet";
const WEEK_ID = "2026-07-20";

const q = (id, text, options, correctIndex) => ({ id, text, options, correctIndex });

const DAYS = [
  {
    dow: "mon", date: "2026-07-20", type: "lesson",
    title: "Day 1: What Is an Array? Traversal Basics",
    concept: `An array is simply a list of values stored one after another, each with a position (index) starting from 0 - so the first element is at index 0, the second at index 1, and so on.

The most basic thing you do with an array is traversal - visiting every element, one at a time, usually with a for loop:
  for i from 0 to length-1:
    look at arr[i]

That single loop is the foundation of almost everything in DSA. Two of the simplest traversal problems:
- Reversing an array: swap the first and last elements, then the second and second-last, and so on, moving inward.
- Finding the max and min: walk through once, keeping track of the largest and smallest value seen so far.

Both take O(n) time - you look at every element exactly once - and that's perfectly fine. Not every problem needs a clever trick; a plain, correct loop is the right first tool to reach for.`,
    mcqs: [
      q("q1", "In a 0-indexed array of 5 elements, what is the index of the FIRST element?", ["0", "1", "5", "-1"], 0),
      q("q2", "What is the index of the LAST element in an array of 5 elements (0-indexed)?", ["4", "5", "3", "0"], 0),
      q("q3", "Visiting every element of an array exactly once (a simple traversal) takes:", ["O(n)", "O(n^2)", "O(log n)", "O(1)"], 0),
      q("q4", "To reverse an array in place, the simplest approach is to:", ["Swap elements from both ends, moving inward", "Sort the array", "Delete and re-add every element", "Only reverse the first half"], 0),
      q("q5", "To find both the maximum AND minimum of an array in a single pass, you:", ["Keep two running variables, updating both while traversing once", "Traverse the array twice", "Sort the array first", "Use recursion only"], 0),
    ],
    problemIds: ["x58QnW0iilJZJJhsdST6", "SnKMfH64azVGZSAQXNCr"],
    xpReward: 50, coinReward: 20,
  },
  {
    dow: "tue", date: "2026-07-21", type: "lesson",
    title: "Day 2: Searching - Checking Every Element",
    concept: `Before learning any clever search trick, the most basic (and always correct) way to search is: check every element, one at a time, until you find what you're looking for - or reach the end. This is called linear search, and it works on ANY array, sorted or not.

A very common beginner problem: "does any pair of numbers in this array add up to a target value?" The simplest solution is two nested loops - for every element, check every other element:
  for i from 0 to n-1:
    for j from i+1 to n-1:
      if arr[i] + arr[j] == target: found it

This works but takes O(n^2) time, since for every one of the n elements you may check up to n others. It's a perfectly good first solution - later you'll learn how a hash set can do the same job in a single O(n) pass, but there's no shame in starting with the straightforward nested-loop version.`,
    mcqs: [
      q("q1", "Linear search checks elements:", ["One at a time, in order, until found or the end is reached", "Only the first and last", "Only even-indexed positions", "In a random order"], 0),
      q("q2", "Does linear search require the array to be sorted first?", ["No - it works on any array", "Yes - always", "Only for arrays longer than 10", "Only for arrays of numbers"], 0),
      q("q3", "The simple nested-loop solution to \"find a pair summing to a target\" runs in:", ["O(n^2)", "O(n)", "O(log n)", "O(1)"], 0),
      q("q4", "In the nested-loop pair-sum approach, the inner loop starts from:", ["i+1 (so the same pair isn't checked twice)", "0 every time", "n-1, going backwards", "A random index"], 0),
      q("q5", "A smarter way to solve the same pair-sum problem in a single pass uses:", ["A hash set to remember numbers already seen", "Sorting only", "Recursion only", "A second array of the same size"], 0),
    ],
    problemIds: ["rMresXdByVqMcW2asqvM", "1nYRIJleVDY4Kl4ijA0A"],
    xpReward: 50, coinReward: 20,
  },
  {
    dow: "wed", date: "2026-07-22", type: "lesson",
    title: "Day 3: Rotating & Rearranging Arrays",
    concept: `Sometimes a problem asks you to rearrange elements rather than search for something. Two gentle examples:

Rotating an array by one position: every element shifts one spot over, and the element pushed off one end wraps around to the other end. Save the element that would be lost first, shift everything else, then place the saved value into the newly-opened spot.

Moving all negative numbers to one side: walk through the array once, and whenever you find a negative number, move it toward the front. Both of these are still simple, one-pass, O(n) ideas - just applied to REARRANGING elements instead of searching or computing a single answer.`,
    mcqs: [
      q("q1", "Rotating an array by one position moves each element:", ["One position over, with the edge element wrapping around", "Two positions over", "To a completely random position", "Only the first element moves"], 0),
      q("q2", "When rotating an array by one, which element needs to be saved FIRST, before shifting begins?", ["The element that would otherwise be lost/overwritten", "The last element", "The middle element", "None - no saving needed"], 0),
      q("q3", "Moving all negative numbers to one side of an array can be done in:", ["O(n) time, with a single pass", "O(n^2) time only", "O(n log n) time only", "It cannot be done in one pass"], 0),
      q("q4", "Rearranging elements (like moving negatives to one side) differs from searching because:", ["It changes the array's element order instead of just looking for something", "It doesn't use loops", "It only works on sorted arrays", "It always needs extra memory equal to the array size"], 0),
      q("q5", "What is the time complexity of a single traversal that rearranges elements as it goes?", ["O(n)", "O(n^2)", "O(2^n)", "O(n!)"], 0),
    ],
    problemIds: ["IlljauUQ0XKT9FZl6PpA", "39GCcFGEkFQPVlOeS7NV"],
    xpReward: 50, coinReward: 20,
  },
  {
    dow: "thu", date: "2026-07-23", type: "lesson",
    title: "Day 4: Sorting Basics & Categorizing Elements",
    concept: `A sorted array is simply one where elements are arranged from smallest to largest (or the reverse). You don't need to implement a full sorting algorithm to benefit from the IDEA of sorting - many problems become easier once you know what "sorted" buys you (for example, the smallest element is always right at the front).

A gentle first "sorting-flavored" problem: given an array of only three distinct values (like 0s, 1s, and 2s), group all the same values together. The simplest beginner approach: count how many 0s, 1s, and 2s there are, then rebuild the array by writing that many 0s, followed by that many 1s, followed by that many 2s.

Another common task is combining two ALREADY-sorted arrays into one sorted array - since both are already in order, you just repeatedly take whichever front element (from either array) is smaller, one at a time, until both are used up.`,
    mcqs: [
      q("q1", "A \"sorted\" array means elements are arranged:", ["From smallest to largest (or the reverse)", "In their original input order", "Randomly", "By index only"], 0),
      q("q2", "In a sorted (ascending) array, where is the smallest element?", ["At the very front", "At the very back", "In the middle", "It could be anywhere"], 0),
      q("q3", "The simplest beginner approach to grouping an array of only 0s, 1s, and 2s is to:", ["Count how many of each value there are, then rebuild the array in that order", "Use a complex three-pointer algorithm only", "Sort using any general sorting algorithm - there's no simpler way", "It cannot be done without extra tools"], 0),
      q("q4", "To merge two ALREADY-SORTED arrays into one sorted array, you:", ["Repeatedly take whichever front element is smaller, one at a time", "Concatenate them and sort from scratch", "Reverse both first", "Only keep the first array's elements"], 0),
      q("q5", "Merging two sorted arrays of size n and m this way takes:", ["O(n + m)", "O(n * m)", "O(n^2)", "O(log n)"], 0),
    ],
    problemIds: ["eXfbRDquKCp9HlMlwAwH", "mv3keamk4B96YVxgfAFD"],
    xpReward: 50, coinReward: 20,
  },
  {
    dow: "fri", date: "2026-07-24", type: "lesson",
    title: "Day 5: Counting & Simple One-Pass Problems",
    concept: `Counting is one of the simplest and most useful tools in DSA. To find how many times each value appears in an array, walk through once and keep a running count for each distinct value (using a simple map or count array).

A classic counting problem: find the "majority element" - the value that appears more than half the time. The simplest beginner approach is exactly this: count how often each value appears (one pass), then check which one has a count greater than n/2.

Another classic one-pass problem: given a list of daily stock prices, find the best profit from buying on one day and selling on a later day. Walk through once, keeping track of the lowest price seen SO FAR, and at each day check what profit you'd make by selling today at that lowest price - keep the best one seen.`,
    mcqs: [
      q("q1", "To count how many times each value appears in an array, you can use:", ["A simple count map, updated in a single pass", "Only sorting", "Only recursion", "You must always use two separate arrays"], 0),
      q("q2", "The \"majority element\" is defined as the value that appears:", ["More than n/2 times", "Exactly once", "The largest value in the array", "The value at index 0"], 0),
      q("q3", "In \"best time to buy and sell stock,\" what do you track as you scan the prices once?", ["The lowest price seen so far", "The highest price seen so far", "The average price", "Only yesterday's price"], 0),
      q("q4", "The single-pass \"buy low, sell high\" approach runs in:", ["O(n)", "O(n^2)", "O(n log n)", "O(1)"], 0),
      q("q5", "Counting occurrences of each value in an array of size n takes:", ["O(n) time", "O(n^2) time", "O(log n) time", "O(1) time"], 0),
    ],
    problemIds: ["cHv8ZHCU1rPT8rUozYjg", "wffj72WETPw87Z3PVdnL"],
    xpReward: 50, coinReward: 20,
  },
  {
    dow: "sat", date: "2026-07-25", type: "test",
    title: "Week 1 Recap Test - Array Fundamentals",
    concept: `This week covered the real fundamentals: traversal, simple searching, rearranging, basic sorting ideas, and counting. Today's recap is deliberately easy - it's here to confirm the basics are solid before next week builds on them, not to introduce anything new. All three problems are Easy, and two of them are variations you've already practiced this week.`,
    mcqs: [
      q("q1", "What is the time complexity of a simple array traversal?", ["O(n)", "O(n^2)", "O(log n)", "O(1)"], 0),
      q("q2", "In a 0-indexed array of size n, the index of the last element is:", ["n-1", "n", "n+1", "0"], 0),
      q("q3", "The simplest way to search for a value, with no clever trick, is:", ["Linear search - check each element in order", "Binary search, always", "Skip every other element", "Sort first, always"], 0),
      q("q4", "To reverse an array in place, you:", ["Swap elements from both ends, moving inward", "Only reverse the first half", "Delete and re-insert every element", "Sort it in reverse order"], 0),
      q("q5", "Grouping an array of only 0s, 1s, and 2s can be done simply by:", ["Counting each value, then rebuilding in that order", "Using recursion only", "It's impossible without a library sort function", "Reversing the array"], 0),
      q("q6", "Merging two already-sorted arrays of size n and m takes:", ["O(n+m)", "O(n*m)", "O(n^2)", "O(log(n+m))"], 0),
      q("q7", "The \"majority element\" appears:", ["More than n/2 times", "Exactly n times", "Only at the last index", "Less than n/4 times"], 0),
      q("q8", "In \"buy low, sell high,\" which value do you track as you scan once, left to right?", ["The lowest price seen so far", "The highest price seen so far", "Yesterday's price only", "The average of all prices"], 0),
    ],
    problemIds: ["eL0uOb5hpx7JsUpq8nog", "x58QnW0iilJZJJhsdST6", "eXfbRDquKCp9HlMlwAwH"],
    xpReward: 100, coinReward: 40,
  },
];

for (const day of DAYS) {
  await db.collection("institutions").doc(SLUG).collection("dailyLearning").doc(day.date).set({
    ...day,
    weekId: WEEK_ID,
    status: "published",
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
  console.log(`Revised ${day.date} (${day.dow}): ${day.title} [${day.type}]`);
}

console.log(`\nDone. Week ${WEEK_ID} revised to beginner pace for institution "${SLUG}".`);
process.exit(0);
