import admin from "firebase-admin";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(join(__dirname, "service-account.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// DSA-450-sheet ingestion, STACKS & QUEUES topic. Rows that are literal
// duplicates of problems seeded elsewhere (balanced-parenthesis checking,
// reversing a string/array via a stack, merge-overlapping-intervals) are
// skipped; pure "implement X from scratch with no distinguishing behavior"
// rows (implement stack using array/queue, n queues in one array) are
// skipped too since they have no unique observable input/output contract.

const REWARD = { Easy: [30, 10], Medium: [50, 20], Hard: [80, 30] };
function p(title, category, difficulty, tags, statement, constraints, examplesText, hints, sampleTests, hiddenTests) {
  const [xpReward, coinReward] = REWARD[difficulty];
  return { title, category, difficulty, tags, statement, constraints, examplesText, hints, xpReward, coinReward, sampleTests, hiddenTests };
}

const PROBLEMS = [

p("Simulate a Stack", "Stack", "Easy", ["Stack"],
  "Simulate a stack given n operations, each either 'PUSH x', 'POP', or 'PEEK'. On POP, print the removed value (or 'EMPTY' if the stack was already empty); on PEEK, print the current top value without removing it (or 'EMPTY' if empty). PUSH produces no output. Print one result per line, in the order the operations occurred.",
  "1 <= n <= 10^5",
  "Input:\n6\nPUSH 1\nPUSH 2\nPEEK\nPOP\nPOP\nPOP\nOutput:\n2\n2\n1\nEMPTY",
  ["A stack only ever adds or removes from one end - use an array (or a language's built-in stack/list) and track just that end.", "Popping or peeking an empty stack is a valid operation here, not an error - it just reports 'EMPTY'."],
  [{ input: "6\nPUSH 1\nPUSH 2\nPEEK\nPOP\nPOP\nPOP", expectedOutput: "2\n2\n1\nEMPTY", explanation: "" },
   { input: "3\nPUSH 5\nPOP\nPOP", expectedOutput: "5\nEMPTY", explanation: "" }],
  [{ input: "1\nPOP", expectedOutput: "EMPTY", points: 1 },
   { input: "2\nPUSH 10\nPEEK", expectedOutput: "10", points: 1 },
   { input: "4\nPUSH 1\nPUSH 2\nPUSH 3\nPOP", expectedOutput: "3", points: 1 }]),

p("Min Stack - Support getMin in O(1)", "Stack", "Medium", ["Stack", "Design"],
  "Simulate a stack given n operations, each 'PUSH x', 'POP', or 'GETMIN'. POP silently removes the top element (no output). On GETMIN, print the current minimum value in the stack (or 'EMPTY' if the stack is empty), in O(1) time. Print one result per line, in the order GETMIN operations occurred.",
  "1 <= n <= 10^5",
  "Input:\n7\nPUSH 3\nPUSH 5\nGETMIN\nPUSH 2\nGETMIN\nPOP\nGETMIN\nOutput:\n3\n2\n3",
  ["Keep a second stack (or store a pair alongside each element) tracking the running minimum at the time each element was pushed.", "When you pop, the previous minimum naturally becomes current again if you tracked it this way - no rescanning needed."],
  [{ input: "7\nPUSH 3\nPUSH 5\nGETMIN\nPUSH 2\nGETMIN\nPOP\nGETMIN", expectedOutput: "3\n2\n3", explanation: "" },
   { input: "2\nPUSH 1\nGETMIN", expectedOutput: "1", explanation: "" }],
  [{ input: "1\nGETMIN", expectedOutput: "EMPTY", points: 1 },
   { input: "4\nPUSH 5\nPUSH 1\nPOP\nGETMIN", expectedOutput: "5", points: 1 },
   { input: "5\nPUSH -1\nPUSH -5\nGETMIN\nPOP\nGETMIN", expectedOutput: "-5\n-1", points: 1 }]),

p("Next Greater Element for Every Array Element", "Stack", "Medium", ["Stack", "Array"],
  "Given an array of n integers, for every element find the first element to its right that is strictly greater than it. Print these values in order, space-separated, using -1 wherever no such element exists.",
  "1 <= n <= 10^5",
  "Input:\n4\n4 5 2 25\nOutput:\n5 25 25 -1",
  ["Scan from right to left, keeping a stack of candidates that could be a 'next greater element' for something still to be processed.", "Before processing an element, pop everything from the stack that's smaller than or equal to it - it can never be the answer for anything further left."],
  [{ input: "4\n4 5 2 25", expectedOutput: "5 25 25 -1", explanation: "" },
   { input: "4\n13 7 6 12", expectedOutput: "-1 12 12 -1", explanation: "" }],
  [{ input: "1\n1", expectedOutput: "-1", points: 1 },
   { input: "3\n1 2 3", expectedOutput: "2 3 -1", points: 1 },
   { input: "3\n3 2 1", expectedOutput: "-1 -1 -1", points: 1 }]),

p("Sort a Stack Using Recursion", "Stack", "Medium", ["Stack", "Recursion"],
  "Given a stack of n integers (given as space-separated values from bottom to top - the order they were pushed in), sort it using only recursive stack operations (push/pop/peek/isEmpty - no other data structure) so that popping the sorted stack yields values in ascending order (the smallest value ends up on top). Print the sorted stack's values from top to bottom.",
  "1 <= n <= 10^4",
  "Input:\n3 1 4 1 5\nOutput:\n1 1 3 4 5",
  ["Recursively pop everything off the stack down to empty, then insert each popped value back in on the way up using a helper that keeps the stack sorted as it inserts (recursively popping bigger elements out of the way, inserting, then pushing them back).", "This uses only the call stack itself for extra storage, not an explicit second stack or array."],
  [{ input: "3 1 4 1 5", expectedOutput: "1 1 3 4 5", explanation: "" },
   { input: "5 3 1", expectedOutput: "1 3 5", explanation: "" }],
  [{ input: "1", expectedOutput: "1", points: 1 },
   { input: "1 1 1", expectedOutput: "1 1 1", points: 1 },
   { input: "9 8 7 6", expectedOutput: "6 7 8 9", points: 1 }]),

p("Largest Rectangular Area in a Histogram", "Stack", "Hard", ["Stack", "Array"],
  "Given n bars of a histogram with given heights (each of width 1, standing side by side), find the area of the largest rectangle that can be formed within the histogram's outline.",
  "1 <= n <= 10^5",
  "Input:\n6\n2 1 5 6 2 3\nOutput:\n10",
  ["Use a stack of indices with increasing bar heights. When a shorter bar appears, pop taller bars off and compute the rectangle each one could have formed, using the current index and the new stack top as the right and left boundaries.", "Push a virtual bar of height 0 at the end to flush out any bars still left on the stack."],
  [{ input: "6\n2 1 5 6 2 3", expectedOutput: "10", explanation: "" },
   { input: "2\n2 4", expectedOutput: "4", explanation: "" }],
  [{ input: "1\n5", expectedOutput: "5", points: 1 },
   { input: "4\n1 1 1 1", expectedOutput: "4", points: 1 },
   { input: "7\n6 2 5 4 5 1 6", expectedOutput: "12", points: 1 }]),

p("Longest Valid Parentheses Substring", "Stack", "Hard", ["Stack", "String"],
  "Given a string containing only '(' and ')', find the length of its longest contiguous substring that is a valid (balanced) sequence of parentheses.",
  "0 <= |s| <= 10^5",
  "Input:\n(()\nOutput:\n2",
  ["Use a stack of indices: push the index of every '(' , and on ')' pop the top (matching it) - the current length is (current index - the new stack top's index), or (current index + 1) if the stack becomes empty.", "Push a sentinel index of -1 onto the stack initially to simplify the length calculation when everything matches."],
  [{ input: "(()", expectedOutput: "2", explanation: "" },
   { input: ")()())", expectedOutput: "4", explanation: "" }],
  [{ input: "", expectedOutput: "0", points: 1 },
   { input: "()(()", expectedOutput: "2", points: 1 },
   { input: "()(())", expectedOutput: "6", points: 1 }]),

p("Check for Redundant Brackets in an Expression", "Stack", "Medium", ["Stack"],
  "Given a string expression containing single-letter operands, the operators + - * /, and parentheses, print 'Yes' if it contains any redundant bracket pair (one that encloses a sub-expression with no operator directly at its top level, other than a lone operand or an already-bracketed group), otherwise print 'No'.",
  "1 <= |expression| <= 10^5",
  "Input:\n((a+b))\nOutput:\nYes",
  ["Use a stack: push every '(' and every operator you see. On a ')', pop until you pop the matching '(' - if you never popped an operator in between (meaning the very next thing on the stack after popping some operands was immediately the '(' itself), that pair of brackets was redundant.", "A bracket pair wrapping a single variable, like '(a)', or wrapping an already fully-bracketed expression, is always redundant."],
  [{ input: "((a+b))", expectedOutput: "Yes", explanation: "" },
   { input: "(a+(b)/c)", expectedOutput: "Yes", explanation: "'(b)' wraps a lone variable." }],
  [{ input: "(a+b*(c-d))", expectedOutput: "No", points: 1 },
   { input: "((a))", expectedOutput: "Yes", points: 1 },
   { input: "(a+b)", expectedOutput: "No", points: 1 }]),

p("Stock Span Problem", "Stack", "Medium", ["Stack", "Array"],
  "Given n days of stock prices, find the 'span' of each day - the number of consecutive days ending at (and including) that day for which the price was less than or equal to that day's price. Print the spans, space-separated.",
  "1 <= n <= 10^5",
  "Input:\n7\n100 80 60 70 60 75 85\nOutput:\n1 1 1 2 1 4 6",
  ["Use a stack of indices of days with a strictly greater price than everything after them so far.", "For each new day, pop every index with a price less than or equal to today's - the span is today's index minus the new stack top's index (or today's index + 1 if the stack empties)."],
  [{ input: "7\n100 80 60 70 60 75 85", expectedOutput: "1 1 1 2 1 4 6", explanation: "" },
   { input: "6\n10 4 5 90 120 80", expectedOutput: "1 1 2 4 5 1", explanation: "" }],
  [{ input: "1\n5", expectedOutput: "1", points: 1 },
   { input: "3\n1 2 3", expectedOutput: "1 2 3", points: 1 },
   { input: "3\n3 2 1", expectedOutput: "1 1 1", points: 1 }]),

p("The Celebrity Problem", "Stack", "Medium", ["Stack", "Graph"],
  "There are n people at a party. A celebrity is someone everyone else knows, but who knows no one else. Given an n x n matrix where knows[i][j] = 1 means person i knows person j, find the celebrity's index (0-indexed), or print -1 if there is none. It's guaranteed at most one celebrity can exist.",
  "1 <= n <= 1000",
  "Input:\n4\n0 0 1 0\n0 0 1 0\n0 0 0 0\n0 0 1 0\nOutput:\n2",
  ["Use a stack of all n candidates. Repeatedly pop two candidates a and b: whichever one knows the other can't be the celebrity, so discard them and keep the other.", "After narrowing down to one final candidate, verify it directly against everyone: it must be known by all and know none."],
  [{ input: "4\n0 0 1 0\n0 0 1 0\n0 0 0 0\n0 0 1 0", expectedOutput: "2", explanation: "" },
   { input: "3\n0 1 0\n0 0 1\n1 0 0", expectedOutput: "-1", explanation: "" }],
  [{ input: "1\n0", expectedOutput: "0", points: 1 },
   { input: "2\n0 1\n0 0", expectedOutput: "1", points: 1 },
   { input: "2\n0 1\n1 0", expectedOutput: "-1", points: 1 }]),

p("Iterative Tower of Hanoi - Minimum Number of Moves", "Stack", "Easy", ["Stack", "Math"],
  "Given n disks stacked on the first of three pegs, find the minimum number of single-disk moves needed to move the entire stack to the third peg, following the standard Tower of Hanoi rules (move one disk at a time, never place a larger disk on a smaller one).",
  "0 <= n <= 60",
  "Input:\n3\nOutput:\n7",
  ["The minimum number of moves for n disks is exactly 2^n - 1.", "This can be computed directly with a formula, or by simulating the moves iteratively with an explicit stack instead of recursion."],
  [{ input: "3", expectedOutput: "7", explanation: "" },
   { input: "1", expectedOutput: "1", explanation: "" }],
  [{ input: "0", expectedOutput: "0", points: 1 },
   { input: "2", expectedOutput: "3", points: 1 },
   { input: "10", expectedOutput: "1023", points: 1 }]),

p("Reverse the First K Elements of a Queue", "Queue", "Medium", ["Queue", "Stack"],
  "Given a queue of n integers (front to back) and a number k, reverse the order of just the first k elements, leaving the rest of the queue unchanged. Print the resulting queue, front to back.",
  "1 <= k <= n <= 10^5",
  "Input:\n5\n1 2 3 4 5\n3\nOutput:\n3 2 1 4 5",
  ["Push the first k elements onto a stack (which reverses their order), then pop them back into the queue.", "The remaining n-k elements never need to move."],
  [{ input: "5\n1 2 3 4 5\n3", expectedOutput: "3 2 1 4 5", explanation: "" },
   { input: "5\n1 2 3 4 5\n5", expectedOutput: "5 4 3 2 1", explanation: "" }],
  [{ input: "1\n1\n1", expectedOutput: "1", points: 1 },
   { input: "3\n1 2 3\n1", expectedOutput: "1 2 3", points: 1 },
   { input: "4\n1 2 3 4\n2", expectedOutput: "2 1 3 4", points: 1 }]),

p("Interleave the First Half of a Queue With the Second Half", "Queue", "Medium", ["Queue"],
  "Given a queue of n integers (n even), rearrange it by interleaving the first half with the second half: first element of the first half, first element of the second half, second element of the first half, second element of the second half, and so on. Print the result, front to back.",
  "2 <= n <= 10^5, n is even",
  "Input:\n6\n1 2 3 4 5 6\nOutput:\n1 4 2 5 3 6",
  ["Split the queue into two halves of equal size.", "Alternate dequeuing one element from the first half and one from the second half, enqueuing each into the result as you go."],
  [{ input: "6\n1 2 3 4 5 6", expectedOutput: "1 4 2 5 3 6", explanation: "" },
   { input: "4\n1 2 3 4", expectedOutput: "1 3 2 4", explanation: "" }],
  [{ input: "2\n1 2", expectedOutput: "1 2", points: 1 },
   { input: "8\n1 2 3 4 5 6 7 8", expectedOutput: "1 5 2 6 3 7 4 8", points: 1 },
   { input: "4\n9 9 9 9", expectedOutput: "9 9 9 9", points: 1 }]),

p("Find the Middle Element of a Stack", "Stack", "Easy", ["Stack"],
  "Given a stack of n integers (given as space-separated values from bottom to top), print the value at its physical middle position. If n is even, print the one closer to the top of the two middle elements.",
  "1 <= n <= 10^5",
  "Input:\n10 20 30 40 50\nOutput:\n30",
  ["The 'middle' here is about position within the stack, not about value - it's simply the element at index n/2 counting from the bottom (0-indexed), using integer division.", "For an even-sized stack, that same 0-indexed formula naturally lands on the one closer to the top."],
  [{ input: "10 20 30 40 50", expectedOutput: "30", explanation: "" },
   { input: "10 20 30 40", expectedOutput: "30", explanation: "" }],
  [{ input: "5", expectedOutput: "5", points: 1 },
   { input: "1 2", expectedOutput: "2", points: 1 },
   { input: "1 2 3", expectedOutput: "2", points: 1 }]),

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
console.log(`STACKS & QUEUES topic: created ${created} problem(s), skipped ${skipped} already-existing.`);
