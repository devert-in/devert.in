import admin from "firebase-admin";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(join(__dirname, "service-account.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// DSA-450-sheet ingestion, STACKS & QUEUES topic, PART 2 - closing the real
// gap against the sheet's verbatim row list (see seed-dsa-stacks-queues-problems.mjs
// for the original, narrower pass and its 13 problems).
//
// Rows verified against live Firestore and skipped as genuine duplicates of
// problems that already exist elsewhere (same observable input/output
// contract, just a different DSA-sheet section):
//   - "Check the expression has valid or Balanced parenthesis or not" ->
//     duplicate of "Balanced Parenthesis Checker" (Strings).
//   - "Reverse a String using Stack" -> duplicate of "Reverse a String"
//     (Strings) - the algorithm used internally isn't observable from I/O.
//   - "Merge Overlapping Intervals" -> duplicate of "Merge Intervals" (Arrays).
//   - "Minimum time required to rot all oranges" -> duplicate of
//     "Rotten Oranges - Minimum Time for All to Rot" (Graphs).
//   - "Queue based approach for first non-repeating character in a stream" ->
//     checked the Linked List topic and Firestore broadly; NOT actually
//     present anywhere, so it's added below (not skipped).
// Rows skipped as having no unique observable input/output contract (the
// "using X" internal-implementation choice can't be black-box graded - the
// resulting behavior is identical to a problem that already exists):
//   - "Implement Stack using Queue" / "Implement Stack using Deque" ->
//     identical externally to "Simulate a Stack".
//   - "Implement Queue using Stack" -> identical externally to
//     "Simulate a Queue" (added below).
// Everything else genuinely missing and codeable is added below.

const REWARD = { Easy: [30, 10], Medium: [50, 20], Hard: [80, 30] };
function p(title, category, difficulty, tags, statement, constraints, examplesText, hints, sampleTests, hiddenTests) {
  const [xpReward, coinReward] = REWARD[difficulty];
  return { title, category, difficulty, tags, statement, constraints, examplesText, hints, xpReward, coinReward, sampleTests, hiddenTests };
}

const PROBLEMS = [

p("Simulate a Queue", "Queue", "Easy", ["Queue"],
  "Simulate a queue given n operations, each either 'ENQUEUE x', 'DEQUEUE', or 'FRONT'. On DEQUEUE, print the removed value (or 'EMPTY' if the queue was already empty); on FRONT, print the current front value without removing it (or 'EMPTY' if empty). ENQUEUE produces no output. Print one result per line, in the order the operations occurred.",
  "1 <= n <= 10^5",
  "Input:\n6\nENQUEUE 1\nENQUEUE 2\nFRONT\nDEQUEUE\nDEQUEUE\nDEQUEUE\nOutput:\n1\n1\n2\nEMPTY",
  ["A queue only ever adds at the back and removes from the front - use an array-backed list or a language's built-in deque and track just those two ends.", "Dequeuing or checking the front of an empty queue is a valid operation here, not an error - it just reports 'EMPTY'.", "Unlike a stack, the first element enqueued is the first one that comes back out - make sure you're removing from the front, not the back."],
  [{ input: "6\nENQUEUE 1\nENQUEUE 2\nFRONT\nDEQUEUE\nDEQUEUE\nDEQUEUE", expectedOutput: "1\n1\n2\nEMPTY", explanation: "" },
   { input: "3\nENQUEUE 5\nDEQUEUE\nDEQUEUE", expectedOutput: "5\nEMPTY", explanation: "" }],
  [{ input: "1\nDEQUEUE", expectedOutput: "EMPTY", points: 1 },
   { input: "2\nENQUEUE 10\nFRONT", expectedOutput: "10", points: 1 },
   { input: "4\nENQUEUE 1\nENQUEUE 2\nENQUEUE 3\nDEQUEUE", expectedOutput: "1", points: 1 }]),

p("Implement Two Stacks in One Array", "Stack", "Medium", ["Stack", "Array", "Design"],
  "You're given a single array of fixed capacity n that must hold two independent stacks (stack 1 growing from one end, stack 2 growing from the other, sharing the space between them). Simulate m operations, each 'PUSH1 x' (push x onto stack 1), 'PUSH2 x' (push x onto stack 2), 'POP1', or 'POP2'. On POP1/POP2, print the removed value, or 'EMPTY' if that stack has no elements. On PUSH1/PUSH2, if the two stacks have collectively filled the entire array (no space at all remains, regardless of how it's distributed between the two), print 'OVERFLOW' instead of pushing; otherwise push silently (no output). Print one result per line, in the order POP/overflowing-PUSH operations occurred.",
  "1 <= n <= 10^5, 1 <= m <= 10^5",
  "Input:\n5\n9\nPUSH1 1\nPUSH1 2\nPUSH2 3\nPOP1\nPOP2\nPUSH1 4\nPUSH1 5\nPUSH1 6\nPUSH1 7\nOutput:\n2\n3",
  ["Grow stack 1 from index 0 upward and stack 2 from index n-1 downward - they only collide when the array is genuinely full, not at some fixed midpoint.", "Overflow happens exactly when stack 1's next free slot would be the same slot stack 2 is currently occupying (or about to occupy) - track just the two 'top' pointers, no fixed split.", "Because the boundary between the two stacks moves freely, one stack popping frees up room for the other to grow even past where it 'started'."],
  [{ input: "5\n9\nPUSH1 1\nPUSH1 2\nPUSH2 3\nPOP1\nPOP2\nPUSH1 4\nPUSH1 5\nPUSH1 6\nPUSH1 7", expectedOutput: "2\n3", explanation: "" },
   { input: "3\n4\nPOP1\nPOP2\nPUSH1 1\nPOP1", expectedOutput: "EMPTY\nEMPTY\n1", explanation: "" }],
  [{ input: "2\n3\nPUSH1 1\nPUSH2 2\nPUSH1 3", expectedOutput: "OVERFLOW", points: 1 },
   { input: "1\n2\nPUSH1 5\nPUSH2 6", expectedOutput: "OVERFLOW", points: 1 },
   { input: "4\n6\nPUSH1 1\nPUSH1 2\nPUSH2 3\nPUSH2 4\nPOP1\nPOP2", expectedOutput: "2\n4", points: 1 }]),

p("Implement N Stacks in a Single Array", "Stack", "Hard", ["Stack", "Array", "Design"],
  "You're given a single array of fixed capacity n shared by k independent, numbered stacks (1 through k) - together they may never hold more than n elements in total, however that total is distributed among them. Simulate m operations, each 'PUSH id x' (push x onto stack id) or 'POP id' (pop from stack id). On POP id, print the removed value, or 'EMPTY' if that stack currently has no elements. On PUSH id x, if the stacks collectively already hold n elements, print 'OVERFLOW' instead of pushing; otherwise push silently (no output). Print one result per line, in the order POP/overflowing-PUSH operations occurred.",
  "1 <= n <= 10^5, 1 <= k <= n, 1 <= m <= 10^5, 1 <= id <= k",
  "Input:\n5\n3\n8\nPUSH 1 10\nPUSH 2 20\nPUSH 3 30\nPOP 1\nPUSH 1 40\nPUSH 1 50\nPUSH 2 60\nPUSH 3 70\nOutput:\n10\nOVERFLOW",
  ["A classic technique is an array of k linked lists sharing one free-slot pool, but for correctness all you actually need to track is each stack's own list of values and a single shared running total.", "Overflow is a global condition on the combined element count across every stack, not a per-stack capacity - a single stack can legitimately grow to fill the whole array if the others stay empty.", "Popping from any stack immediately frees a slot the array can hand to any other stack, not just the one you popped from."],
  [{ input: "5\n3\n8\nPUSH 1 10\nPUSH 2 20\nPUSH 3 30\nPOP 1\nPUSH 1 40\nPUSH 1 50\nPUSH 2 60\nPUSH 3 70", expectedOutput: "10\nOVERFLOW", explanation: "" },
   { input: "3\n2\n5\nPUSH 1 1\nPUSH 2 2\nPUSH 1 3\nPOP 2\nPOP 2", expectedOutput: "2\nEMPTY", explanation: "" }],
  [{ input: "2\n2\n3\nPUSH 1 5\nPUSH 2 6\nPUSH 1 7", expectedOutput: "OVERFLOW", points: 1 },
   { input: "4\n3\n4\nPOP 1\nPUSH 2 9\nPUSH 3 8\nPOP 3", expectedOutput: "EMPTY\n8", points: 1 },
   { input: "6\n2\n7\nPUSH 1 1\nPUSH 1 2\nPUSH 1 3\nPUSH 2 4\nPUSH 2 5\nPUSH 1 6\nPOP 1", expectedOutput: "6", points: 1 }]),

p("Arithmetic Expression Evaluation", "Stack", "Hard", ["Stack", "Math"],
  "Given a string containing a valid arithmetic expression made of non-negative integers, the operators + - * /, and parentheses (no spaces), evaluate it and print the result, respecting standard operator precedence (* and / before + and -) and parentheses. Division truncates toward zero, like integer division in C/Java.",
  "1 <= |expression| <= 10^5, all intermediate and final values fit in a 64-bit signed integer",
  "Input:\n3+(2*5)-4/2\nOutput:\n11",
  ["Use the classic two-stack approach: one stack of numbers, one of operators. Before pushing a new operator, resolve every operator already on the stack that has equal or higher precedence.", "An open parenthesis is a barrier on the operator stack - never resolve past it until its matching close parenthesis forces everything inside to collapse first.", "Multi-digit numbers need to be read as a whole token (keep scanning digits) before you push them onto the number stack."],
  [{ input: "3+(2*5)-4/2", expectedOutput: "11", explanation: "" },
   { input: "10+2*6", expectedOutput: "22", explanation: "" }],
  [{ input: "100*2+12", expectedOutput: "212", points: 1 },
   { input: "((2+3)*(4-1))", expectedOutput: "15", points: 1 },
   { input: "7/2+1", expectedOutput: "4", points: 1 }]),

p("Evaluation of a Postfix Expression", "Stack", "Medium", ["Stack", "Math"],
  "Given a postfix (Reverse Polish) expression as space-separated tokens - integers (possibly negative) and the operators + - * / - evaluate it and print the result. Division truncates toward zero, like integer division in C/Java.",
  "1 <= number of tokens <= 10^5",
  "Input:\n2 3 1 * + 9 -\nOutput:\n-4",
  ["Scan tokens left to right: push every number onto a stack; on an operator, pop the top two values (the second-popped is the left operand), apply the operator, and push the result back.", "Order matters for non-commutative operators - if you pop b then a, compute a - b or a / b, not b - a.", "After the last token, exactly one value should remain on the stack - that's the answer."],
  [{ input: "2 3 1 * + 9 -", expectedOutput: "-4", explanation: "" },
   { input: "4 13 5 / +", expectedOutput: "6", explanation: "" }],
  [{ input: "5 1 2 + 4 * + 3 -", expectedOutput: "14", points: 1 },
   { input: "10 2 /", expectedOutput: "5", points: 1 },
   { input: "6 2 3 + -", expectedOutput: "1", points: 1 }]),

p("Insert an Element at the Bottom of a Stack", "Stack", "Medium", ["Stack", "Recursion"],
  "Given a stack of n integers (given as space-separated values from bottom to top) and a value x, insert x at the very bottom of the stack - beneath every existing element - using only recursive stack operations (push/pop/peek/isEmpty, no other data structure). Print the resulting stack's values from top to bottom.",
  "1 <= n <= 10^4",
  "Input:\n1 2 3\n10\nOutput:\n3 2 1 10",
  ["Recursively pop every element off the stack first (down to empty), push x once the stack is empty, then push each popped element back on the way back up the call stack.", "This uses only the call stack itself for extra storage, not an explicit second stack or array.", "The relative order of the original elements must stay exactly the same - only x is new, and it always ends up at the bottom."],
  [{ input: "1 2 3\n10", expectedOutput: "3 2 1 10", explanation: "" },
   { input: "5\n7", expectedOutput: "5 7", explanation: "" }],
  [{ input: "1 2 3 4 5\n0", expectedOutput: "5 4 3 2 1 0", points: 1 },
   { input: "9 8\n1", expectedOutput: "8 9 1", points: 1 },
   { input: "1\n2", expectedOutput: "1 2", points: 1 }]),

p("Reverse a Stack Using Recursion", "Stack", "Medium", ["Stack", "Recursion"],
  "Given a stack of n integers (given as space-separated values from bottom to top), reverse the entire stack using only recursive stack operations (push/pop/peek/isEmpty, no other data structure - not even an explicit loop-based auxiliary stack). Print the resulting reversed stack's values from bottom to top.",
  "1 <= n <= 10^4",
  "Input:\n1 2 3 4 5\nOutput:\n5 4 3 2 1",
  ["First write a helper that recursively pops the whole stack to empty, then inserts a given value at the very bottom on the way back up (the same idea as the 'insert at bottom' problem).", "Reversing the stack itself is then: pop the top element, recursively reverse what's left, then insert the popped element at the bottom of that reversed result.", "This uses only the call stack for extra storage, not a second explicit stack or array."],
  [{ input: "1 2 3 4 5", expectedOutput: "5 4 3 2 1", explanation: "" },
   { input: "5 3 1", expectedOutput: "1 3 5", explanation: "" }],
  [{ input: "1", expectedOutput: "1", points: 1 },
   { input: "1 1 2 2", expectedOutput: "2 2 1 1", points: 1 },
   { input: "9 8 7 6 5", expectedOutput: "5 6 7 8 9", points: 1 }]),

p("Check if an Array Is a Stack Permutation of Another", "Stack", "Medium", ["Stack"],
  "Given two arrays of n integers, 'pushed' (the order elements are pushed onto an initially empty stack) and 'popped' (a candidate order of popping them all back off), determine whether 'popped' is achievable - i.e. whether there's some valid interleaving of pushes (always in the given order) and pops that produces exactly that popped sequence. Print 'Yes' if so, otherwise 'No'.",
  "1 <= n <= 10^5, all values in each array are distinct",
  "Input:\n5\n1 2 3 4 5\n5 4 3 2 1\nOutput:\nYes",
  ["Simulate it directly: push elements from 'pushed' one at a time onto an auxiliary stack, and after every push, pop from it as many times as its top matches the next unmatched element of 'popped'.", "If you can push everything and, along the way, match off every element of 'popped' in order, it's achievable.", "You never need to guess when to pop - greedily popping whenever the top matches the next expected popped value is always correct."],
  [{ input: "5\n1 2 3 4 5\n5 4 3 2 1", expectedOutput: "Yes", explanation: "" },
   { input: "3\n1 2 3\n2 1 3", expectedOutput: "Yes", explanation: "" }],
  [{ input: "3\n1 2 3\n3 1 2", expectedOutput: "No", points: 1 },
   { input: "1\n1\n1", expectedOutput: "Yes", points: 1 },
   { input: "4\n1 2 3 4\n4 3 1 2", expectedOutput: "No", points: 1 }]),

p("Implement n Queues in a Single Array", "Queue", "Hard", ["Queue", "Array", "Design"],
  "You're given a single array of fixed capacity n shared by k independent, numbered queues (1 through k) - together they may never hold more than n elements in total, however that total is distributed among them. Simulate m operations, each 'ENQUEUE id x' (enqueue x into queue id) or 'DEQUEUE id' (dequeue the front of queue id). On DEQUEUE id, print the removed value, or 'EMPTY' if that queue currently has no elements. On ENQUEUE id x, if the queues collectively already hold n elements, print 'OVERFLOW' instead of enqueuing; otherwise enqueue silently (no output). Print one result per line, in the order DEQUEUE/overflowing-ENQUEUE operations occurred.",
  "1 <= n <= 10^5, 1 <= k <= n, 1 <= m <= 10^5, 1 <= id <= k",
  "Input:\n5\n3\n8\nENQUEUE 1 10\nENQUEUE 2 20\nENQUEUE 3 30\nDEQUEUE 1\nENQUEUE 1 40\nENQUEUE 1 50\nENQUEUE 2 60\nENQUEUE 3 70\nOutput:\n10\nOVERFLOW",
  ["Each queue just needs its own FIFO order (an array-backed list or built-in deque per id) - the only shared resource is the total element count against the capacity n.", "Overflow is a global condition on the combined element count across every queue, not a per-queue capacity - a single queue can legitimately grow to fill the whole array if the others stay empty.", "Dequeuing from any queue immediately frees a slot the shared capacity can hand to any other queue, not just the one you dequeued from."],
  [{ input: "5\n3\n8\nENQUEUE 1 10\nENQUEUE 2 20\nENQUEUE 3 30\nDEQUEUE 1\nENQUEUE 1 40\nENQUEUE 1 50\nENQUEUE 2 60\nENQUEUE 3 70", expectedOutput: "10\nOVERFLOW", explanation: "" },
   { input: "3\n2\n5\nENQUEUE 1 1\nENQUEUE 2 2\nENQUEUE 1 3\nDEQUEUE 2\nDEQUEUE 2", expectedOutput: "2\nEMPTY", explanation: "" }],
  [{ input: "2\n2\n3\nENQUEUE 1 5\nENQUEUE 2 6\nENQUEUE 1 7", expectedOutput: "OVERFLOW", points: 1 },
   { input: "4\n3\n4\nDEQUEUE 1\nENQUEUE 2 9\nENQUEUE 3 8\nDEQUEUE 3", expectedOutput: "EMPTY\n8", points: 1 },
   { input: "6\n2\n6\nENQUEUE 1 1\nENQUEUE 1 2\nENQUEUE 1 3\nENQUEUE 2 4\nENQUEUE 2 5\nDEQUEUE 1", expectedOutput: "1", points: 1 }]),

p("Implement a Circular Queue", "Queue", "Easy", ["Queue", "Design"],
  "Implement a circular queue with a fixed capacity k. Simulate m operations, each 'ENQUEUE x', 'DEQUEUE', 'FRONT', or 'REAR'. On ENQUEUE, if the queue is already holding k elements, print 'OVERFLOW' instead of enqueuing; otherwise enqueue silently (no output). On DEQUEUE, print the removed value, or 'EMPTY' if the queue is empty. On FRONT/REAR, print the current front/rear value, or 'EMPTY' if the queue is empty. Print one result per line, in the order DEQUEUE/FRONT/REAR/overflowing-ENQUEUE operations occurred.",
  "1 <= k <= 10^5, 1 <= m <= 10^5",
  "Input:\n3\n7\nENQUEUE 1\nENQUEUE 2\nENQUEUE 3\nENQUEUE 4\nDEQUEUE\nENQUEUE 5\nREAR\nOutput:\nOVERFLOW\n1\n5",
  ["A circular queue reuses freed slots at the front by wrapping the rear pointer back to index 0 once it reaches the end of the backing array - track front/rear indices and a running count.", "It's full exactly when the count equals the fixed capacity k, regardless of where front and rear currently point.", "Dequeuing frees exactly one slot immediately, so a full queue can accept a new element right after a single dequeue, even though the array position being reused is physically at the 'start'."],
  [{ input: "3\n7\nENQUEUE 1\nENQUEUE 2\nENQUEUE 3\nENQUEUE 4\nDEQUEUE\nENQUEUE 5\nREAR", expectedOutput: "OVERFLOW\n1\n5", explanation: "" },
   { input: "2\n4\nENQUEUE 1\nENQUEUE 2\nDEQUEUE\nFRONT", expectedOutput: "1\n2", explanation: "" }],
  [{ input: "1\n3\nENQUEUE 9\nENQUEUE 8\nFRONT", expectedOutput: "OVERFLOW\n9", points: 1 },
   { input: "2\n2\nDEQUEUE\nFRONT", expectedOutput: "EMPTY\nEMPTY", points: 1 },
   { input: "4\n6\nENQUEUE 1\nENQUEUE 2\nENQUEUE 3\nDEQUEUE\nENQUEUE 4\nENQUEUE 5", expectedOutput: "1", points: 1 }]),

p("LRU Cache Implementation", "Queue", "Hard", ["Queue", "Design", "Hashing"],
  "Design a Least Recently Used (LRU) cache with a fixed capacity. Simulate m operations, each 'PUT k v' (insert/update key k with value v, evicting the least recently used entry first if the cache is already at capacity) or 'GET k' (return the value for key k, or -1 if not present). Both PUT and GET count as a 'use' of the key, making it the most recently used. GET prints its result; PUT produces no output. Print one result per line, in the order GET operations occurred.",
  "1 <= capacity <= 10^5, 1 <= m <= 10^5",
  "Input:\n2\n8\nPUT 1 100\nPUT 2 200\nGET 1\nPUT 3 300\nGET 2\nGET 3\nGET 1\nPUT 4 400\nOutput:\n100\n-1\n300\n100",
  ["Combine a hash map (key -> value, for O(1) lookup) with a doubly linked list (or an ordered structure) tracking usage order, so both 'find' and 'move to most-recently-used' are O(1).", "Every successful GET and every PUT must move that key to the most-recently-used end - not just PUT.", "Eviction only happens on a PUT that would add a brand-new key while the cache is already full - updating an existing key's value never evicts anything."],
  [{ input: "2\n8\nPUT 1 100\nPUT 2 200\nGET 1\nPUT 3 300\nGET 2\nGET 3\nGET 1\nPUT 4 400", expectedOutput: "100\n-1\n300\n100", explanation: "" },
   { input: "1\n4\nPUT 1 10\nPUT 2 20\nGET 1\nGET 2", expectedOutput: "-1\n20", explanation: "" }],
  [{ input: "2\n3\nGET 1\nPUT 1 5\nGET 1", expectedOutput: "-1\n5", points: 1 },
   { input: "3\n6\nPUT 1 1\nPUT 2 2\nPUT 3 3\nGET 1\nPUT 4 4\nGET 2", expectedOutput: "1\n-1", points: 1 },
   { input: "2\n5\nPUT 1 1\nPUT 2 2\nPUT 1 10\nGET 1\nGET 2", expectedOutput: "10\n2", points: 1 }]),

p("Reverse a Queue Using Recursion", "Queue", "Easy", ["Queue", "Recursion"],
  "Given a queue of n integers (front to back), reverse the entire queue using only recursive queue operations (enqueue/dequeue/front/isEmpty, no other data structure - not even an explicit loop-based auxiliary array). Print the resulting queue, front to back.",
  "1 <= n <= 10^4",
  "Input:\n5\n1 2 3 4 5\nOutput:\n5 4 3 2 1",
  ["Recursively dequeue the front element, recursively reverse what remains, and only then enqueue the element you set aside - so it ends up added back after everything that was behind it.", "This is the queue analogue of reversing a stack with recursion: the trick is delaying the re-insertion of each element until the recursive call beneath it has fully returned.", "This uses only the call stack for extra storage, not a second explicit queue or array."],
  [{ input: "5\n1 2 3 4 5", expectedOutput: "5 4 3 2 1", explanation: "" },
   { input: "1\n9", expectedOutput: "9", explanation: "" }],
  [{ input: "4\n10 20 30 40", expectedOutput: "40 30 20 10", points: 1 },
   { input: "3\n7 7 7", expectedOutput: "7 7 7", points: 1 },
   { input: "6\n1 2 3 4 5 6", expectedOutput: "6 5 4 3 2 1", points: 1 }]),

p("Find the First Circular Tour That Visits All Petrol Pumps", "Queue", "Medium", ["Queue", "Greedy"],
  "There are n petrol pumps arranged in a circle. Pump i has petrol[i] litres of fuel available, and dist[i] is the distance from pump i to the next pump (i+1, wrapping around to pump 0 after the last). Your truck starts with an empty tank and travels 1 litre per unit distance. Find the 0-indexed pump you should start at to complete the entire circular route without ever running out of fuel. It's guaranteed exactly one such starting pump exists (total petrol across all pumps is always >= total distance).",
  "1 <= n <= 10^5, 0 <= petrol[i], dist[i] <= 10^4",
  "Input:\n5\n4 6 7 4 6\n6 5 3 5 5\nOutput:\n1",
  ["Track a running fuel balance while scanning pumps left to right: add petrol[i], subtract dist[i]. The moment that balance goes negative, no pump from the current candidate start up through i can be the answer - restart your candidate at i+1 and reset the balance to 0.", "Because total petrol is guaranteed to be at least total distance, whichever candidate start you're still holding once you finish the single pass is the answer - no second pass needed.", "This is the same idea as a queue of 'candidates still in play' being trimmed from the front every time the running total goes negative."],
  [{ input: "5\n4 6 7 4 6\n6 5 3 5 5", expectedOutput: "1", explanation: "" },
   { input: "4\n1 1 1 1\n1 1 1 1", expectedOutput: "0", explanation: "" }],
  [{ input: "3\n1 2 3\n3 2 1", expectedOutput: "1", points: 1 },
   { input: "3\n50 10 10\n30 20 15", expectedOutput: "0", points: 1 },
   { input: "6\n4 6 7 4 6 5\n6 5 3 5 5 3", expectedOutput: "1", points: 1 }]),

p("First Negative Integer in Every Window of Size K", "Queue", "Medium", ["Queue", "Sliding Window"],
  "Given an array of n integers and a window size k, for every contiguous window of size k (sliding from left to right across the array) print the first negative integer in that window, or 0 if the window has none. Print the results space-separated, in order.",
  "1 <= k <= n <= 10^5",
  "Input:\n8\n-8 2 3 -6 6 4 -3 5\n2\nOutput:\n-8 0 -6 -6 0 -3 -3",
  ["Keep a queue of the indices of negative numbers seen so far that could still be inside the current window.", "Before reading off the answer for a window, drop indices from the front of the queue that have slid out of the window's left edge.", "The front of that queue, if non-empty, is always the first negative number in the current window - if it's empty, there are no negatives in this window."],
  [{ input: "8\n-8 2 3 -6 6 4 -3 5\n2", expectedOutput: "-8 0 -6 -6 0 -3 -3", explanation: "" },
   { input: "5\n12 -1 -7 8 -15\n3", expectedOutput: "-1 -1 -7", explanation: "" }],
  [{ input: "5\n1 2 3 4 5\n2", expectedOutput: "0 0 0 0", points: 1 },
   { input: "6\n-1 -1 -1 -1 -1 -1\n3", expectedOutput: "-1 -1 -1 -1", points: 1 },
   { input: "4\n5 -2 -3 4\n1", expectedOutput: "0 -2 -3 0", points: 1 }]),

p("Distance of Nearest Cell Having 1 in a Binary Matrix", "Queue", "Medium", ["Queue", "Matrix", "BFS"],
  "Given an R x C binary matrix containing at least one 1, for every cell find the Manhattan (grid-step, up/down/left/right only) distance to the nearest cell containing a 1. Print the resulting R x C matrix of distances, one row per line, space-separated.",
  "1 <= R, C <= 500",
  "Input:\n3 4\n0 0 0 1\n0 0 1 1\n0 1 1 0\nOutput:\n3 2 1 0\n2 1 0 0\n1 0 0 1",
  ["Do a multi-source BFS: start by enqueuing every cell that already contains a 1 with distance 0, then expand outward level by level.", "Because BFS explores in order of increasing distance, the first time you reach a cell is guaranteed to be via its shortest path - no cell needs to be revisited.", "A plain single-source BFS from every 0-cell separately would be far too slow - seeding the queue with all the 1s at once and growing outward together is what makes this efficient."],
  [{ input: "3 4\n0 0 0 1\n0 0 1 1\n0 1 1 0", expectedOutput: "3 2 1 0\n2 1 0 0\n1 0 0 1", explanation: "" },
   { input: "2 2\n0 0\n0 1", expectedOutput: "2 1\n1 0", explanation: "" }],
  [{ input: "1 3\n0 1 0", expectedOutput: "1 0 1", points: 1 },
   { input: "3 3\n1 0 0\n0 0 0\n0 0 1", expectedOutput: "0 1 2\n1 2 1\n2 1 0", points: 1 },
   { input: "1 1\n1", expectedOutput: "0", points: 1 }]),

p("Sum of Minimum and Maximum Elements of All Subarrays of Size K", "Queue", "Medium", ["Queue", "Sliding Window"],
  "Given an array of n integers and a window size k, consider every contiguous subarray of size k. For each such subarray add its minimum element and its maximum element; print the total of all these (min + max) sums across every window.",
  "1 <= k <= n <= 10^5",
  "Input:\n8\n2 5 -1 7 -3 -1 -2 6\n4\nOutput:\n21",
  ["Maintain two monotonic deques of indices as the window slides: one keeping candidates for the window's maximum (strictly decreasing values front to back), one for the minimum (strictly increasing values front to back).", "Before adding a new index, pop from the back of each deque any index whose value can never win against the new element; before reading an answer, pop from the front any index that has slid out of the window.", "The front of the max-deque and the front of the min-deque give you that window's max and min in O(1) - accumulate their sum across every window as you go."],
  [{ input: "8\n2 5 -1 7 -3 -1 -2 6\n4", expectedOutput: "21", explanation: "" },
   { input: "4\n1 1 1 1\n2", expectedOutput: "6", explanation: "" }],
  [{ input: "5\n1 2 3 4 5\n2", expectedOutput: "24", points: 1 },
   { input: "6\n5 4 3 2 1 0\n3", expectedOutput: "20", points: 1 },
   { input: "3\n10 20 30\n3", expectedOutput: "40", points: 1 }]),

p("Minimum Sum of Squares of Character Counts After Removing K Characters", "Queue", "Medium", ["Queue", "Greedy", "Heap"],
  "Given a string s and an integer k, you may remove exactly k characters from s, one at a time, choosing freely which character to remove at each step. After the removals, compute the sum of the squares of the remaining count of each distinct character that still appears at least once. Print the minimum possible value of this sum, choosing removals optimally.",
  "1 <= |s| <= 10^5, 0 <= k <= |s|, s consists of lowercase English letters",
  "Input:\nabccc\n1\nOutput:\n6",
  ["Removing one occurrence of whichever currently-most-frequent character always reduces the sum of squares by the largest possible amount - this greedy choice is always at least as good as removing from any other character.", "Use a max-priority-queue (max-heap) keyed on each character's current count: repeatedly pop the largest count, decrement it by one, and push it back (unless it hits zero), for k rounds.", "After k removals, sum the square of every remaining positive count - characters reduced to zero contribute nothing."],
  [{ input: "abccc\n1", expectedOutput: "6", explanation: "" },
   { input: "aabbcc\n2", expectedOutput: "6", explanation: "" }],
  [{ input: "aaaa\n0", expectedOutput: "16", points: 1 },
   { input: "aaaa\n4", expectedOutput: "0", points: 1 },
   { input: "abcabc\n3", expectedOutput: "3", points: 1 }]),

p("First Non-Repeating Character in a Stream", "Queue", "Medium", ["Queue", "Hashing"],
  "Characters arrive one at a time, appended to a stream. After each new character arrives, print the first character in the stream so far that has appeared exactly once (in the order it originally appeared), or -1 if every character seen so far has repeated. Print one result per character, space-separated, in the order they arrived.",
  "1 <= |stream| <= 10^5, stream consists of lowercase English letters",
  "Input:\naabc\nOutput:\na -1 b b",
  ["Keep a queue of candidate 'still non-repeating so far' characters (in first-seen order) alongside a frequency count for every character.", "Whenever a character arrives, bump its count and push it onto the candidate queue; then repeatedly pop from the front of the queue while its count is now more than 1 - it's disqualified.", "After that cleanup, the front of the queue (if any remains) is the answer for this step - print -1 only if the queue is empty."],
  [{ input: "aabc", expectedOutput: "a -1 b b", explanation: "" },
   { input: "aabbcc", expectedOutput: "a -1 b -1 c -1", explanation: "" }],
  [{ input: "zz", expectedOutput: "z -1", points: 1 },
   { input: "abcabc", expectedOutput: "a a a b c -1", points: 1 },
   { input: "x", expectedOutput: "x", points: 1 }]),

p("Next Smaller Element for Every Array Element", "Stack", "Medium", ["Stack", "Array"],
  "Given an array of n integers, for every element find the first element to its right that is strictly smaller than it. Print these values in order, space-separated, using -1 wherever no such element exists.",
  "1 <= n <= 10^5",
  "Input:\n4\n4 8 5 2\nOutput:\n2 5 2 -1",
  ["Scan from right to left, keeping a stack of candidates that could be a 'next smaller element' for something still to be processed - this mirrors the Next Greater Element technique with the comparison flipped.", "Before processing an element, pop everything from the stack that's greater than or equal to it - it can never be the answer for anything further left.", "Whatever remains on top of the stack after that cleanup (or -1 if the stack is empty) is this element's answer; then push the current element for elements further left to compare against."],
  [{ input: "4\n4 8 5 2", expectedOutput: "2 5 2 -1", explanation: "" },
   { input: "4\n13 7 6 12", expectedOutput: "7 6 -1 -1", explanation: "" }],
  [{ input: "1\n1", expectedOutput: "-1", points: 1 },
   { input: "3\n1 2 3", expectedOutput: "-1 -1 -1", points: 1 },
   { input: "3\n3 2 1", expectedOutput: "2 1 -1", points: 1 }]),

p("Check if All Levels of Two Binary Trees Are Anagrams", "Queue", "Medium", ["Queue", "Tree", "Hashing"],
  "Two binary trees are given, each described level by level (as you'd get from a queue-based level-order traversal): first the number of levels, then for each level a count followed by that many node values (children of null nodes are simply omitted, so a level's list is just the values of the nodes that actually exist at that depth). The trees are 'level-anagram equal' if they have the same number of levels and, for every depth, the multiset of node values at that depth in one tree is a permutation (anagram) of the multiset at that depth in the other tree - position within the level doesn't matter. Print 'Yes' if the two trees are level-anagram equal, otherwise 'No'.",
  "1 <= number of levels of either tree <= 1000, 0 <= nodes per level <= 10^5, node values fit in a 32-bit signed integer",
  "Input:\n3\n1 1\n2 2 3\n4 4 5 6 7\n3\n1 1\n2 3 2\n4 7 6 5 4\nOutput:\nYes",
  ["If you were building this from an actual tree, a queue-based level-order (BFS) traversal is exactly how you'd collect each depth's values into its own list in the first place.", "Once you have each tree's per-level value lists, 'anagram' just means: same length, same multiset of values - a frequency count (or a sorted comparison) per level settles it in one pass.", "The trees fail immediately if they don't even have the same number of levels - check that before comparing any level's contents."],
  [{ input: "3\n1 1\n2 2 3\n4 4 5 6 7\n3\n1 1\n2 3 2\n4 7 6 5 4", expectedOutput: "Yes", explanation: "" },
   { input: "3\n1 1\n2 2 3\n2 4 5\n3\n1 1\n2 3 2\n2 5 4", expectedOutput: "Yes", explanation: "" }],
  [{ input: "2\n1 1\n2 2 2\n2\n1 1\n2 2 3", expectedOutput: "No", points: 1 },
   { input: "2\n1 5\n2 2 3\n1\n1 5", expectedOutput: "No", points: 1 },
   { input: "1\n1 9\n1\n1 9", expectedOutput: "Yes", points: 1 }]),

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
console.log(`STACKS & QUEUES topic (part 2): created ${created} problem(s), skipped ${skipped} already-existing.`);
