import admin from "firebase-admin";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(join(__dirname, "service-account.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// Week 3 of MRCET's structured Mon-Sat Daily Learning program - continues from
// Week 1 (Arrays & Two Pointers) and Week 2 (Linked Lists) into Stacks &
// Queues, same institutions/mrcet/dailyLearning/{date} shape. Every coding pick
// below is a real, already-seeded, already-numbered CodeLab problem id, verified
// live against Firestore (category and hidden-test count checked) before this
// script was written - never a placeholder, and no problem is reused across the
// six days.
//
// Unlike Weeks 1 and 2, the correct option is NOT always index 0. The attempt
// view shuffles options per student (shuffleQuizForAttempt, seeded per uid) and
// grades against the original correctIndex, so a fixed position was never
// exploitable there - but the week-test renderer in campus-daily-learning.jsx
// presents options unshuffled, and "the answer is always A" is a pattern
// students notice. Varying it costs nothing and removes the question.

const SLUG = "mrcet";
const WEEK_ID = "2026-08-03"; // the Monday this week starts

const q = (id, text, options, correctIndex) => ({ id, text, options, correctIndex });

const DAYS = [
  {
    dow: "mon", date: "2026-08-03", type: "lesson",
    title: "Day 15: Stack Fundamentals & Balanced Brackets",
    concept: `A stack is Last-In-First-Out: the most recently pushed item is the first one you can take back. Only the top is reachable - push, pop and peek are all O(1), and there is no indexing into the middle.

That single restriction is exactly what makes bracket matching work. Scan the string left to right:
  for each character c:
    if c is an opening bracket:  push it
    if c is a closing bracket:
      if the stack is empty -> unbalanced (nothing to close)
      if the popped bracket doesn't match c -> unbalanced
  at the end: balanced only if the stack is EMPTY

The stack encodes "which bracket am I still waiting to close", and because nesting is strictly last-opened-first-closed, the top of the stack is always the one that must close next. "([)]" fails not because of length or ordering rules, but because ')' arrives while '[' is on top - a genuine mismatch.

Finishing with a non-empty stack means some bracket was opened and never closed, which is just as unbalanced as closing one that was never opened.`,
    mcqs: [
      q("q1", "Which principle does a stack follow?", ["First-In-First-Out (FIFO)", "Last-In-First-Out (LIFO)", "Priority by value", "Random access"], 1),
      q("q2", "What is the time complexity of push and pop on a stack?", ["O(n)", "O(log n)", "O(1)", "O(n log n)"], 2),
      q("q3", "Bracket matching uses a stack because:", ["The most recently opened bracket must always be the first one closed", "Brackets need to be sorted before checking", "A queue would give the same answer faster", "It requires random access to the middle of the string"], 0),
      q("q4", "Scanning \"([)]\", the checker must reject it. Why exactly?", ["It contains an odd number of characters", "It begins with a round bracket", "Square brackets may not appear inside round brackets", "')' arrives while '[' is on top of the stack - a mismatch"], 3),
      q("q5", "After scanning a fully valid bracket string, the stack must be:", ["Holding every opening bracket", "Empty", "Holding exactly one bracket", "In reverse order"], 1),
    ],
    problemIds: ["Afw72YelGJgizghliCG4", "jodzS08TbhFLUrgsBk6T"],
    xpReward: 50, coinReward: 20,
  },
  {
    dow: "tue", date: "2026-08-04", type: "lesson",
    title: "Day 16: Monotonic Stack - Next Greater Element",
    concept: `"For each element, find the next element to its right that is larger" looks like it needs a nested loop - O(n^2). A monotonic stack does it in O(n).

Keep a stack of elements still WAITING for their next greater element, held in decreasing order from bottom to top:
  for each element x, left to right:
    while stack is not empty and top < x:
      pop it - x IS its next greater element
    push x
  anything still on the stack at the end has no greater element to its right -> -1

The counting argument is the important part: the inner while-loop can run many times on one iteration, but every element is pushed exactly once and popped at most once across the ENTIRE scan. Total work is therefore bounded by 2n, not n^2. This is amortised analysis - you cannot judge the cost by looking at a single iteration in isolation.

Stock Span is the same skeleton pointing the other way: for each day, how many consecutive previous days (including today) had a price less than or equal to today's. Same stack, same O(n), different comparison.`,
    mcqs: [
      q("q1", "A monotonic stack for \"next greater element\" holds elements in what order, bottom to top?", ["Strictly increasing", "Decreasing", "Fully sorted after every push", "No particular order"], 1),
      q("q2", "Computing the next greater element for all n elements with a monotonic stack costs:", ["O(n^2)", "O(n log n)", "O(n)", "O(log n)"], 2),
      q("q3", "Why is it O(n) despite a while-loop nested inside the for-loop?", ["Each element is pushed at most once and popped at most once overall", "The while loop never iterates more than twice", "The array is sorted beforehand", "The stack is capped at a constant size"], 0),
      q("q4", "If an element has no greater element to its right, the conventional answer is:", ["0", "The element itself", "-1", "The length of the array"], 2),
      q("q5", "The Stock Span problem counts consecutive earlier days whose price was:", ["Strictly greater than today's", "Less than or equal to today's", "Exactly equal to today's", "Any value at all"], 1),
    ],
    problemIds: ["UY2rfS8SZpYTZOlhbKFF", "ZKTWywfNFEiBijUf7cV1"],
    xpReward: 50, coinReward: 20,
  },
  {
    dow: "wed", date: "2026-08-05", type: "lesson",
    title: "Day 17: Queues & Circular Queues",
    concept: `A queue is First-In-First-Out - the opposite discipline to a stack. Insert at the rear (enqueue), remove from the front (dequeue), both O(1).

The naive array implementation has a real flaw. Move the front index forward on every dequeue and the slots before it become permanently unusable: after N enqueues and N dequeues the queue is empty, yet front and rear both sit at the end of the array with no room left. The space is not reclaimed.

A circular queue fixes this by wrapping the indices with modulo:
  enqueue: rear  = (rear  + 1) % N
  dequeue: front = (front + 1) % N

The array is now treated as a ring, so freed slots at the beginning are reused. Because both a full and an empty ring can leave front == rear, implementations track a size counter (or deliberately leave one slot unused) to tell those two states apart.

A queue can also be built from two stacks. That works for a reason worth stating precisely: a stack reverses insertion order, so pouring elements from one stack into another reverses them a SECOND time - and reversing twice restores the original order, which is exactly FIFO.`,
    mcqs: [
      q("q1", "A queue follows which principle?", ["Last-In-First-Out", "First-In-First-Out", "Priority by value", "Random access"], 1),
      q("q2", "In a circular queue of capacity N, the rear index advances as:", ["rear = rear + 1, always", "rear = (rear + 1) % N", "rear = rear * 2", "rear = N - rear"], 1),
      q("q3", "The main problem a circular queue solves compared with a naive array queue is:", ["Space at the front is wasted and never reclaimed after dequeues", "Elements come out in the wrong order", "Duplicate values cannot be stored", "Enqueue degrades to O(n)"], 0),
      q("q4", "Enqueue and dequeue on a well-implemented queue are:", ["O(n)", "O(log n)", "O(1)", "O(n log n)"], 2),
      q("q5", "Implementing a queue with two stacks produces FIFO order because:", ["Reversing a LIFO order a second time restores the original order", "Stacks are themselves FIFO", "One of the two stacks is kept sorted", "It compares elements on every push"], 0),
    ],
    problemIds: ["KQFewd2X75kr2qi9ZmHa", "8v4Wy8ft04imaT06QW4D"],
    xpReward: 50, coinReward: 20,
  },
  {
    dow: "thu", date: "2026-08-06", type: "lesson",
    title: "Day 18: Deques & Sliding Window Maximum",
    concept: `A deque (double-ended queue) allows insertion and removal at BOTH ends in O(1). That extra freedom turns a quadratic sliding-window problem into a linear one.

"Maximum of every window of size k" is O(n*k) if each window is rescanned. With a monotonic deque holding INDICES it is O(n):
  for each index i:
    pop from the FRONT while the front index is outside the window (i - k)
    pop from the BACK while the element at the back <= the current element
    push i at the back
    once i >= k-1, the element at the FRONT index is this window's maximum

Two distinct reasons for popping, and it matters that you keep them straight. The front is popped because an index has aged out of the window - a position argument. The back is popped because a smaller element can never again be the maximum while the current, larger element is still in the window - a value argument, which is what keeps the deque decreasing.

Every index enters and leaves the deque at most once, so the total cost is O(n), the same amortised argument as yesterday's monotonic stack. "First negative integer in every window of size k" is the same skeleton with a simpler rule: the deque holds only the indices of negative numbers.`,
    mcqs: [
      q("q1", "A deque supports insertion and removal at:", ["Only the front", "Only the rear", "Both ends", "The middle only"], 2),
      q("q2", "Sliding Window Maximum implemented with a monotonic deque runs in:", ["O(n*k)", "O(n log n)", "O(n)", "O(k^2)"], 2),
      q("q3", "In that solution, the index at the FRONT of the deque is always:", ["The maximum of the current window", "The minimum of the current window", "The most recently added index", "The window size"], 0),
      q("q4", "Before pushing a new index, you pop from the BACK while the back element is:", ["Strictly larger than the new element", "The oldest index in the deque", "Smaller than or equal to the new element", "Outside the current window"], 2),
      q("q5", "You pop from the FRONT of the deque when:", ["The deque grows beyond k entries", "The front index has slid outside the current window", "A larger element arrives", "The first window is not yet complete"], 1),
    ],
    problemIds: ["bdrlDx5oBesONtlBhamb", "pOY6hCZJB6IETxtb377N"],
    xpReward: 50, coinReward: 20,
  },
  {
    dow: "fri", date: "2026-08-07", type: "lesson",
    title: "Day 19: Expression Evaluation with Stacks",
    concept: `Postfix (Reverse Polish) notation puts each operator after its operands: "5 1 2 + 4 * + 3 -". There are no brackets and no precedence rules to apply, which is precisely why machines prefer it.

Evaluation is a single stack pass:
  for each token:
    if it is a number -> push it
    if it is a binary operator -> pop TWO values, apply, push the result
  the final answer is the single value left on the stack

Operand order is the classic trap. The first value popped is the RIGHT operand, the second is the LEFT. For subtraction and division you must compute second_popped - first_popped; reversing them silently produces wrong answers on exactly the inputs where it matters. Tracing the example: 1 2 + gives 3; 3 4 * gives 12; 5 12 + gives 17; 17 3 - gives 14.

Converting infix to postfix uses a stack too, but of OPERATORS and brackets rather than operands - popping higher-or-equal precedence operators before pushing the current one.

Redundant-bracket detection is a neat variation: scan for a closing bracket whose matching opening bracket has no operator between them. "((a))" and "(a)+((b))" both contain a bracketed section enclosing no operator at all, which makes those brackets redundant.`,
    mcqs: [
      q("q1", "Evaluating a postfix expression with a stack works by:", ["Sorting the tokens first", "Pushing operators and popping operands", "Pushing operands and popping two of them on each operator", "Storing everything in a queue"], 2),
      q("q2", "Evaluate the postfix expression \"5 1 2 + 4 * + 3 -\".", ["13", "14", "10", "9"], 1),
      q("q3", "Popping two operands for a subtraction, the correct computation is:", ["first_popped - second_popped", "second_popped - first_popped", "Either order gives the same result", "Addition must be used instead"], 1),
      q("q4", "Converting infix to postfix, the stack holds:", ["Operands", "Operators and brackets", "The final result only", "Nothing - no stack is needed"], 1),
      q("q5", "An expression contains redundant brackets when:", ["It has more than two operands", "Its operators differ in precedence", "It contains nested brackets of any kind", "A bracketed section encloses no operator at all, as in ((a))"], 3),
    ],
    problemIds: ["l2KXryL1QO18kWAryn7M", "zkxEntclabLgeGx0bltx"],
    xpReward: 50, coinReward: 20,
  },
  {
    dow: "sat", date: "2026-08-08", type: "test",
    title: "Week 3 Master Test: Stacks & Queues",
    concept: `This week covered five ideas: the LIFO stack and bracket matching, the monotonic stack and its amortised O(n) argument, FIFO queues and the circular-buffer trick, the monotonic deque behind Sliding Window Maximum, and stack-based expression evaluation.

Today's master test combines all of it - five coding problems drawing on the week's patterns (none repeated from the weekday lessons), and ten MCQs checking whether the reasoning behind each technique actually stuck, not just its name.`,
    mcqs: [
      q("q1", "A stack is LIFO. A queue is:", ["LIFO as well", "FIFO", "Always sorted", "Random access"], 1),
      q("q2", "Next Greater Element for all n elements using a monotonic stack costs:", ["O(n)", "O(n^2)", "O(n log n)", "O(log n)"], 0),
      q("q3", "Largest Rectangular Area in a Histogram is solved in O(n) using:", ["A queue of bar heights", "A monotonic stack of indices", "Binary search over the width", "Sorting the bars by height"], 1),
      q("q4", "Min Stack supports getMin() in O(1) by:", ["Sorting the stack on every push", "Scanning all elements on each getMin call", "Maintaining an auxiliary stack of running minima", "Storing only the minimum and discarding the rest"], 2),
      q("q5", "A queue built from two stacks yields FIFO order because:", ["Stacks are inherently FIFO", "Reversing a LIFO order twice restores the original order", "The second stack is kept sorted", "Elements are compared on every push"], 1),
      q("q6", "A circular queue advances its indices using:", ["Modulo (% N)", "Doubling (* 2)", "Subtraction (- N)", "Division (/ N)"], 0),
      q("q7", "Sliding Window Maximum achieves O(n) using:", ["A max-heap containing every element", "A monotonic deque of indices", "A freshly sorted array per window", "Two pointers and nothing else"], 1),
      q("q8", "Evaluating a postfix expression, each binary operator pops how many operands?", ["One", "Two", "Three", "Every value on the stack"], 1),
      q("q9", "Sorting a stack using recursion works by:", ["Popping everything into an array, sorting it, and pushing back", "Repeatedly inserting the popped element into its correct place in the already-sorted remainder", "Converting the stack into a queue first", "Swapping adjacent elements in place"], 1),
      q("q10", "The cost of push and pop on a stack is:", ["O(log n)", "O(n)", "O(1)", "O(n log n)"], 2),
    ],
    problemIds: ["KDCI4s7mHarsNGfpx1qP", "xCpiCx3wiZpZFHCp643X", "svisG09ggQkFMybRujei", "r0ZyQ0BbHAm8mrTwytFC", "NnrfMiOPhZaVl7gSwMV8"],
    xpReward: 150, coinReward: 60,
  },
];

// ---- guards, before anything is written ----
const allProblemIds = DAYS.flatMap(d => d.problemIds);
if (new Set(allProblemIds).size !== allProblemIds.length) {
  throw new Error("a problem id is reused across Week 3 - each day must be distinct");
}
for (const day of DAYS) {
  for (const m of day.mcqs) {
    if (!Number.isInteger(m.correctIndex) || m.correctIndex < 0 || m.correctIndex >= m.options.length) {
      throw new Error(`${day.date} ${m.id}: correctIndex ${m.correctIndex} is out of range`);
    }
    if (new Set(m.options).size !== m.options.length) {
      throw new Error(`${day.date} ${m.id}: duplicate option text`);
    }
  }
}
// Every problem id must actually exist in the catalog - a typo here would show a
// student an empty practice slot with no error anywhere.
const missing = [];
for (const id of allProblemIds) {
  const snap = await db.doc(`problems/${id}`).get();
  if (!snap.exists) missing.push(id);
}
if (missing.length) throw new Error(`problem ids not found in the catalog: ${missing.join(", ")}`);
console.log(`verified ${allProblemIds.length} distinct problem ids exist\n`);

for (const day of DAYS) {
  await db.collection("institutions").doc(SLUG).collection("dailyLearning").doc(day.date).set({
    ...day,
    weekId: WEEK_ID,
    status: "published",
    // Matches Weeks 1 and 2 (set by the Phase 0 audience backfill). Without it
    // this week would not match the audience filter the other weeks do.
    audiences: ["legacy"],
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
  console.log(`Seeded ${day.date} (${day.dow}): ${day.title} [${day.type}] - ${day.mcqs.length} MCQs, ${day.problemIds.length} problems`);
}

console.log(`\nDone. Week ${WEEK_ID} seeded for institution "${SLUG}".`);
process.exit(0);
