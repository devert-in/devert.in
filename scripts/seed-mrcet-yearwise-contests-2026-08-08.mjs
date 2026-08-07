// MRCET year-wise proctored contests for Saturday 08 Aug 2026.
//
// Three separate contests rather than one paper with mixed sections, because
// targetScope is what firestore.rules enforces per year - a single contest
// cannot show different questions to different cohorts, and scoping three
// contests is the only way each year sees only its own paper.
//
// Recon before writing this (scripts/recon-mrcet-contest.mjs):
//   institutionId "mrcet", 599 approved students
//   II Year 132   III Year 304   IV Year 163
//   contestRestricted: 0
//   11 classrooms had moduleAccess.contests === false - fixed separately by
//   scripts/enable-contests-module-mrcet.mjs, without which those cohorts hit a
//   "you're not registered" dead end at registration time.
//
// Staggered start times so 599 students do not all hit proctoring uploads in the
// same minute, and so invigilators can actually watch one cohort at a time.
//
// Seeded as status "draft" on purpose. Publishing is a separate, deliberate step
// (--publish) because the proctoring Firestore/Storage rules and the
// getProctorFrame function have to be deployed FIRST - a published proctored
// contest whose rules are not live fails at the camera-upload step, mid-exam,
// for every student at once.
//
// Re-running is safe: it looks for its own marker field (seedKey) and refuses to
// create a duplicate.

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
const TS = (iso) => admin.firestore.Timestamp.fromDate(new Date(iso));

const INSTITUTION_ID = "mrcet";
const SEED_KEY = "mrcet-yearwise-2026-08-08";
const PUBLISH = process.argv.includes("--publish");
const DRY_RUN = process.argv.includes("--dry-run");

// Proctoring, applied identically to all three papers.
const PROCTOR_SETTINGS = {
  proctoringEnabled: true,
  proctorSnapshotSeconds: 300,      // a photo every 5 minutes
  proctorRequireFullscreen: true,
  // true, not the default false: these are placement-grade contests, so a
  // challenged result needs a timeline. One surviving photo from the last
  // minute says nothing about the first forty. ~35KB/frame.
  proctorRetainFrames: true,
  proctorMaxViolations: 0,          // warn + record only; never auto-submit
};

const BASE_SETTINGS = {
  leaderboardEnabled: true,
  rankingVisibility: "campus_only",
  answerKeyRelease: "after_end",
  explanationsRelease: "after_end",
  analysisRelease: "after_end",
  scoreRelease: "after_end",
  allowQuestionReview: true,
  showCorrectAnswers: true,
  highlightIncorrect: true,
  ...PROCTOR_SETTINGS,
};

const RULES_TEXT = (mins) => [
  `- Duration: ${mins} minutes from the moment you start. The contest window closes at the scheduled end time regardless.`,
  "- One attempt only. Your answers are submitted once and cannot be reopened.",
  "- INVIGILATED: your camera must stay on for the whole attempt. You will see your own video the entire time.",
  "- A photo is captured every 5 minutes and filed against your roll number.",
  "- The paper runs in fullscreen. Leaving fullscreen hides the questions and is recorded.",
  "- Switching tabs or applications is detected, timestamped and reported to your invigilator.",
  "- Your timer keeps running during any violation. Nothing is paused for you.",
  "- No calculators, notes, phones or external help.",
].join("\n");

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------
const opt = (id, text) => ({ id, text });
const O4 = (a, b, c, d) => [opt("a", a), opt("b", b), opt("c", c), opt("d", d)];

// correct is the option id ("a".."d"). Kept explicit rather than "always index
// 0" - the attempt view shuffles options per student so position is not
// exploitable, but the answer-key review screen shows them unshuffled and
// "it's always A" is a pattern students notice.
const mcq = (question, options, correct, explanation, topic, difficulty = "medium", marks = 2, negativeMarks = 0.5) => ({
  kind: "mcq", type: "mcq", question, options, correctOptionIds: [correct],
  explanation, topic, difficulty, marks, negativeMarks,
});

const coding = ({ question, topic, difficulty, marks, samples, hidden }) => ({
  kind: "coding", type: "coding", question, topic, difficulty, marks, negativeMarks: 0,
  samples, hidden,
});

// ---------------------------------------------------------------------------
// II YEAR - 20 MCQs, CS basics + DS basics
// ---------------------------------------------------------------------------
const YEAR2_QUESTIONS = [
  // --- CS basics ---
  mcq("A process and a thread differ mainly in that:",
    O4("Threads of one process share its address space; separate processes do not",
       "A thread cannot run concurrently with another thread",
       "A process is always faster than a thread",
       "Threads have no program counter of their own"),
    "a",
    "Threads within a process share code, data and open files, which is why inter-thread communication is cheap and why one bad thread can corrupt the whole process. Each thread still has its own stack, registers and program counter.",
    "Operating Systems", "easy"),

  mcq("Thrashing in an operating system means:",
    O4("The CPU spends more time swapping pages in and out than executing instructions",
       "Two processes deadlock on the same file",
       "The disk is physically failing",
       "A process runs at the highest possible priority"),
    "a",
    "Too little physical memory for the working sets in play means almost every access page-faults, so the system does I/O instead of work. Throughput collapses even though the CPU looks busy.",
    "Operating Systems"),

  mcq("A PRIMARY KEY differs from a UNIQUE constraint because a primary key:",
    O4("Cannot contain NULL, and there can be only one per table",
       "Allows duplicate values",
       "Must always be an integer",
       "Is only a comment with no enforcement"),
    "a",
    "UNIQUE permits NULLs (often several, depending on the DBMS) and a table can carry many UNIQUE constraints. A primary key is NOT NULL, unique, and singular per table.",
    "DBMS", "easy"),

  mcq("A table is in 1NF when:",
    O4("Every column holds a single atomic value - no repeating groups or lists in one cell",
       "It has no foreign keys",
       "Every non-key column depends on the whole key",
       "It has fewer than ten columns"),
    "a",
    "1NF is purely about atomicity. \"Depends on the whole key\" is 2NF; removing transitive dependencies is 3NF.",
    "DBMS"),

  mcq("Routing between different networks happens at which OSI layer?",
    O4("Network layer (Layer 3)", "Data link layer (Layer 2)", "Transport layer (Layer 4)", "Application layer (Layer 7)"),
    "a",
    "Layer 3 owns logical addressing (IP) and path selection. Layer 2 switches within a single link using MAC addresses; Layer 4 handles end-to-end delivery.",
    "Computer Networks", "easy"),

  mcq("Which is TRUE of UDP compared with TCP?",
    O4("UDP does not guarantee delivery, ordering, or duplicate protection",
       "UDP retransmits lost packets automatically",
       "UDP performs a three-way handshake first",
       "UDP is always slower than TCP"),
    "a",
    "UDP is connectionless and fire-and-forget, which is exactly why live video, DNS and games use it - a late packet is worse than a lost one.",
    "Computer Networks"),

  mcq("Encapsulation and abstraction differ in that encapsulation is about:",
    O4("Bundling data with the methods that operate on it and restricting direct access",
       "Choosing which method runs at runtime",
       "Creating many objects from one class",
       "Inheriting behaviour from a parent class"),
    "a",
    "Encapsulation hides the internal STATE behind an interface. Abstraction hides implementation COMPLEXITY, exposing only what a caller needs to know.",
    "OOP"),

  mcq("Method overloading is resolved at compile time; overriding is resolved:",
    O4("At runtime, by the actual type of the object", "At compile time as well",
       "By the order methods appear in the file", "Never - overriding is not allowed"),
    "a",
    "Overloading picks among same-named methods by signature, decided statically. Overriding is dynamic dispatch: the runtime object's own type decides which implementation executes.",
    "OOP"),

  mcq("The binary number 1101 equals which decimal value?",
    O4("13", "11", "14", "12"),
    "a",
    "8 + 4 + 0 + 1 = 13.",
    "Number Systems", "easy"),

  mcq("A compiler differs from an interpreter because a compiler:",
    O4("Translates the whole program before execution and reports errors up front",
       "Executes each line as it reads it",
       "Cannot report syntax errors",
       "Produces no output file ever"),
    "a",
    "Compilers translate ahead of time, so you see the full error list before anything runs and execution is typically faster. Interpreters translate and execute statement by statement.",
    "Compilers", "easy"),

  // --- DS basics ---
  mcq("Accessing the k-th element is O(1) in an array but O(k) in a singly linked list because:",
    O4("Array elements sit in contiguous memory, so the address is computed arithmetically",
       "Arrays are always sorted",
       "Linked lists store elements in reverse",
       "Arrays cache their last accessed index"),
    "a",
    "base + k * elementSize gives the address in one step. A linked list has no such formula - you must follow k next-pointers from the head.",
    "Arrays", "easy"),

  mcq("The undo feature in a text editor is naturally modelled by a:",
    O4("Stack", "Queue", "Binary search tree", "Hash table"),
    "a",
    "The action you undo first is the one you performed most recently - textbook LIFO.",
    "Stacks", "easy"),

  mcq("A printer serving jobs in the order they were submitted is a:",
    O4("Queue", "Stack", "Priority queue by file size", "Deque used at both ends"),
    "a",
    "First submitted, first printed - FIFO.",
    "Queues", "easy"),

  mcq("Binary search requires that the input array is:",
    O4("Sorted", "Of even length", "Free of duplicates", "Stored as a linked list"),
    "a",
    "Discarding half the range each step is only valid if order tells you which half can contain the target. On unsorted data the result is meaningless, not merely slow.",
    "Searching", "easy"),

  mcq("Binary search on n sorted elements runs in:",
    O4("O(log n)", "O(n)", "O(n log n)", "O(1)"),
    "a",
    "The search space halves each comparison, so it takes about log2(n) steps.",
    "Searching", "easy"),

  mcq("Inserting a new node at the HEAD of a singly linked list costs:",
    O4("O(1)", "O(n)", "O(log n)", "O(n^2)"),
    "a",
    "Point the new node at the old head and move head - no traversal. Inserting at the TAIL is O(n) without a tail pointer.",
    "Linked Lists"),

  mcq("An inorder traversal of a binary SEARCH tree visits the keys:",
    O4("In ascending sorted order", "In descending order", "Level by level", "In random order"),
    "a",
    "Left subtree, node, right subtree - and the BST property puts every smaller key on the left. This is why an inorder walk is the standard sortedness check.",
    "Trees"),

  mcq("A hash collision happens when:",
    O4("Two different keys hash to the same bucket index",
       "The hash table is completely full",
       "A key is deleted twice",
       "The hash function returns a negative number"),
    "a",
    "Unavoidable in general - there are more possible keys than buckets. Chaining and open addressing are the two standard resolutions.",
    "Hashing"),

  mcq("A binary tree of height h (root at height 0) holds at most how many nodes?",
    O4("2^(h+1) - 1", "2^h", "h^2", "2h + 1"),
    "a",
    "Level i holds at most 2^i nodes, and 1 + 2 + 4 + ... + 2^h = 2^(h+1) - 1.",
    "Trees", "hard"),

  mcq("Bubble sort's worst-case time complexity is:",
    O4("O(n^2)", "O(n log n)", "O(n)", "O(log n)"),
    "a",
    "Nested passes comparing adjacent pairs. It is O(n) only in the best case, on already-sorted input with an early-exit check.",
    "Sorting", "easy"),
];

// ---------------------------------------------------------------------------
// III YEAR - 10 MCQs drawn from Week 3 Daily Learning (Stacks & Queues,
// Days 13-18, WEEK_ID 2026-08-03) + 3 coding questions on the same material.
// Freshly worded rather than copy-pasted from the Daily Learning MCQs - the
// cohort has already answered those verbatim, so reusing them tests recall of
// the option text instead of the idea. Same precedent as
// seed-mrcet-weekend-contest.mjs.
// ---------------------------------------------------------------------------
const YEAR3_QUESTIONS = [
  mcq("Bracket matching uses a stack rather than a counter because a stack:",
    O4("Remembers WHICH bracket is still open, so a type mismatch like \"([)]\" is caught",
       "Counts opening and closing brackets faster",
       "Sorts the brackets before comparing them",
       "Allows random access to the middle of the string"),
    "a",
    "A plain counter accepts \"([)]\" - the totals balance. The stack's top is always the bracket that must close next, which is what turns a mismatch into a detectable error.",
    "Stacks"),

  mcq("Scanning \"([)]\", exactly which condition rejects it?",
    O4("')' arrives while '[' is on top of the stack",
       "The string length is even",
       "A square bracket appears inside a round bracket",
       "The stack is empty when ')' arrives"),
    "a",
    "Nesting must be last-opened-first-closed. When ')' arrives the top is '[', so the pop does not match.",
    "Stacks"),

  mcq("A valid bracket string always leaves the stack:",
    O4("Empty", "Holding every opening bracket", "Holding exactly one bracket", "In reverse order"),
    "a",
    "A non-empty stack at the end means something was opened and never closed - just as unbalanced as an unmatched closer.",
    "Stacks", "easy"),

  mcq("For \"next greater element\", the monotonic stack holds values in what order from bottom to top?",
    O4("Decreasing", "Increasing", "Fully sorted after every push", "No particular order"),
    "a",
    "It holds elements still WAITING for a greater element. Anything smaller than an incoming value is resolved and popped, so what remains is decreasing.",
    "Monotonic Stack"),

  mcq("A while-loop sits inside the for-loop, yet the algorithm is O(n). Why?",
    O4("Each element is pushed at most once and popped at most once across the entire scan",
       "The while loop never runs more than twice",
       "The array is sorted first",
       "The stack size is capped at a constant"),
    "a",
    "Amortised analysis: total work is bounded by 2n pushes-plus-pops, not by the worst single iteration. You cannot judge this one by looking at one iteration alone.",
    "Monotonic Stack", "hard"),

  mcq("In a circular queue of capacity N, the rear index advances as:",
    O4("rear = (rear + 1) % N", "rear = rear + 1 always", "rear = N - rear", "rear = rear * 2"),
    "a",
    "Modulo wraps the index so slots freed at the front are reused. Without it, a naive array queue permanently loses the space before `front`.",
    "Queues", "easy"),

  mcq("In a circular queue, front == rear is ambiguous because it can mean:",
    O4("Either completely empty or completely full",
       "Only that the queue is empty",
       "The capacity was chosen badly",
       "Two elements share one slot"),
    "a",
    "Both states collide, which is why implementations keep a size counter or deliberately leave one slot unused.",
    "Queues", "hard"),

  mcq("A queue built from two stacks yields FIFO order because:",
    O4("Reversing a LIFO order a second time restores the original order",
       "Stacks are themselves FIFO",
       "One stack is kept sorted",
       "Elements are compared on every push"),
    "a",
    "A stack reverses insertion order; pouring one stack into another reverses it again, and two reversals cancel out.",
    "Queues"),

  mcq("In Sliding Window Maximum with a monotonic deque of indices, the FRONT index is always:",
    O4("The maximum of the current window", "The minimum of the current window",
       "The most recently pushed index", "The oldest index ever pushed"),
    "a",
    "The deque is kept decreasing by value, so its front is the largest element still inside the window.",
    "Deque"),

  mcq("That algorithm pops from the front and from the back for different reasons. Which pairing is right?",
    O4("Front: the index aged out of the window. Back: a smaller element can never be the max again",
       "Front: a larger element arrived. Back: the deque exceeded k entries",
       "Front: the value is too small. Back: the index is too old",
       "Both ends are popped for the same reason"),
    "a",
    "The front is a POSITION argument, the back is a VALUE argument. Confusing the two is the usual source of an off-by-one here.",
    "Deque", "hard"),

  coding({
    question: `Valid Parentheses

Given a string containing only the characters '(', ')', '{', '}', '[' and ']', decide whether it is balanced.

A string is balanced when every bracket closes in the correct order and every opening bracket has a matching closing bracket of the same type.

INPUT
A single line: the string s. (1 <= |s| <= 10000)

OUTPUT
Print exactly "true" if s is balanced, otherwise "false".

EXAMPLES
Input:  ()[]{}
Output: true

Input:  ([)]
Output: false`,
    topic: "Stacks", difficulty: "easy", marks: 10,
    samples: [
      { input: "()[]{}", expectedOutput: "true", explanation: "Each bracket closes immediately with its own matching type." },
      { input: "([)]", expectedOutput: "false", explanation: "')' arrives while '[' is on top of the stack - a type mismatch." },
    ],
    hidden: [
      { input: "(", expectedOutput: "false" },
      { input: ")", expectedOutput: "false" },
      { input: "{[]}", expectedOutput: "true" },
      { input: "(((((((((())))))))))", expectedOutput: "true" },
      { input: "([]{})([])", expectedOutput: "true" },
      { input: "]", expectedOutput: "false" },
      { input: "{[(])}", expectedOutput: "false" },
      { input: "{{{{", expectedOutput: "false" },
    ],
  }),

  coding({
    question: `Next Greater Element

For every element of an array, find the first element to its RIGHT that is strictly greater than it. If no such element exists, the answer for that position is -1.

INPUT
Line 1: n, the number of elements (1 <= n <= 100000)
Line 2: n space-separated integers

OUTPUT
Print n space-separated integers on one line - the next greater element for each position, in order.

EXAMPLE
Input:
4
4 5 2 25
Output:
5 25 25 -1

Aim for O(n). A nested loop will time out on the larger hidden tests.`,
    topic: "Monotonic Stack", difficulty: "medium", marks: 10,
    samples: [
      { input: "4\n4 5 2 25", expectedOutput: "5 25 25 -1", explanation: "5 > 4; 25 > 5; 25 > 2; nothing is greater than 25." },
      { input: "4\n13 7 6 12", expectedOutput: "-1 12 12 -1", explanation: "Nothing right of 13 exceeds it; 12 resolves both 7 and 6." },
    ],
    hidden: [
      { input: "1\n5", expectedOutput: "-1" },
      { input: "5\n1 2 3 4 5", expectedOutput: "2 3 4 5 -1" },
      { input: "5\n5 4 3 2 1", expectedOutput: "-1 -1 -1 -1 -1" },
      { input: "6\n2 2 2 3 1 1", expectedOutput: "3 3 3 -1 -1 -1" },
      { input: "3\n-5 -2 -9", expectedOutput: "-2 -1 -1" },
      { input: "7\n11 13 21 3 5 7 9", expectedOutput: "13 21 -1 5 7 9 -1" },
    ],
  }),

  coding({
    question: `Sliding Window Maximum

Given an array and a window size k, report the maximum of every contiguous window of size k as the window slides from left to right.

INPUT
Line 1: n and k, space separated (1 <= k <= n <= 100000)
Line 2: n space-separated integers

OUTPUT
Print the (n - k + 1) window maxima, space separated, on one line.

EXAMPLE
Input:
8 3
1 3 -1 -3 5 3 6 7
Output:
3 3 5 5 6 7

Rescanning each window is O(n*k) and will time out. A monotonic deque of INDICES gives O(n).`,
    topic: "Deque", difficulty: "medium", marks: 10,
    samples: [
      { input: "8 3\n1 3 -1 -3 5 3 6 7", expectedOutput: "3 3 5 5 6 7", explanation: "Windows [1,3,-1]=3, [3,-1,-3]=3, [-1,-3,5]=5, [-3,5,3]=5, [5,3,6]=6, [3,6,7]=7." },
      { input: "5 1\n4 2 12 3 8", expectedOutput: "4 2 12 3 8", explanation: "With k=1 every element is its own window maximum." },
    ],
    hidden: [
      { input: "1 1\n7", expectedOutput: "7" },
      { input: "4 4\n9 1 8 2", expectedOutput: "9" },
      { input: "5 2\n1 2 3 4 5", expectedOutput: "2 3 4 5" },
      { input: "5 2\n5 4 3 2 1", expectedOutput: "5 4 3 2" },
      { input: "6 3\n-1 -3 -5 -2 -8 -4", expectedOutput: "-1 -2 -2 -2" },
      { input: "6 2\n2 2 2 2 2 2", expectedOutput: "2 2 2 2 2" },
    ],
  }),
];

// ---------------------------------------------------------------------------
// IV YEAR - 10 hard aptitude + 3 coding (obfuscated statement, simple solution)
// + 5 CS MCQs + 5 DSA MCQs written to be funny but genuinely informative.
// ---------------------------------------------------------------------------
const YEAR4_QUESTIONS = [
  // --- 10 hard aptitude, 3 marks each ---
  mcq("A alone finishes a job in 12 days, B in 18 days. They work on alternate days starting with A. How many days does the job take?",
    O4("14 1/3 days", "14 days", "15 days", "13 1/2 days"),
    "a",
    "A 2-day cycle completes 1/12 + 1/18 = 5/36 of the job. Seven cycles (14 days) leave 35/36 done, so 1/36 remains. Day 15 is A's turn at 3/36 per day, needing (1/36) / (3/36) = 1/3 of a day. Total = 14 1/3 days.",
    "Time & Work", "hard", 3, 1),

  mcq("Two fair dice are rolled. What is the probability that the product of the faces is even?",
    O4("3/4", "1/2", "2/3", "5/6"),
    "a",
    "The product is odd only when BOTH dice are odd: (3/6)(3/6) = 1/4. So even = 1 - 1/4 = 3/4. Attacking the complement is far quicker than enumerating even products.",
    "Probability", "hard", 3, 1),

  mcq("In how many ways can the letters of ENGINEERING be arranged?",
    O4("277200", "554400", "138600", "39916800"),
    "a",
    "ENGINEERING has 11 letters: E appears 3 times, N 3 times, G 2, I 2, R 1. Arrangements = 11! / (3! * 3! * 2! * 2!) = 39916800 / 144 = 277200.",
    "Permutations", "hard", 3, 1),

  mcq("A boat covers 24 km downstream in 3 hours and returns in 4 hours. What is the speed of the stream?",
    O4("1 km/h", "2 km/h", "3 km/h", "0.5 km/h"),
    "a",
    "Downstream 8 km/h, upstream 6 km/h. Stream = (8 - 6)/2 = 1 km/h, boat = 7 km/h.",
    "Boats & Streams", "hard", 3, 1),

  mcq("In what ratio must a 20%-milk solution be mixed with a 50%-milk solution to obtain a 30%-milk solution?",
    O4("2 : 1", "1 : 2", "3 : 2", "1 : 1"),
    "a",
    "Alligation: distance from the mean is |50 - 30| = 20 for the first and |30 - 20| = 10 for the second, giving 20 : 10 = 2 : 1.",
    "Mixtures & Alligation", "hard", 3, 1),

  mcq("What is the angle between the hands of a clock at 3:40?",
    O4("130 degrees", "120 degrees", "140 degrees", "125 degrees"),
    "a",
    "Minute hand: 40 * 6 = 240. Hour hand: 3*30 + 40*0.5 = 110. Difference = 130 degrees.",
    "Clocks", "hard", 3, 1),

  mcq("A father is three times as old as his son. In 12 years he will be twice as old. What is the father's present age?",
    O4("36", "30", "42", "48"),
    "a",
    "3s + 12 = 2(s + 12) gives s = 12, so the father is 36.",
    "Ages", "hard", 3, 1),

  mcq("Two pipes fill a tank in 20 and 30 minutes; a leak empties the full tank in 40 minutes. All three open together, how long to fill it?",
    O4("120/7 minutes", "20 minutes", "17 minutes", "24 minutes"),
    "a",
    "Net rate = 1/20 + 1/30 - 1/40 = (6 + 4 - 3)/120 = 7/120, so 120/7 ~= 17.14 minutes.",
    "Pipes & Cisterns", "hard", 3, 1),

  mcq("What is the unit digit of 7^105?",
    O4("7", "1", "9", "3"),
    "a",
    "Unit digits of powers of 7 cycle 7, 9, 3, 1 with period 4. 105 mod 4 = 1, so the unit digit matches 7^1 = 7.",
    "Number Theory", "hard", 3, 1),

  mcq("If in a certain code MONKEY is written as XDJMLN, how is TIGER written using the same rule?",
    O4("QDFHS", "SDFHQ", "QDHFS", "SHFDQ"),
    "a",
    "The code reverses the word and shifts each letter by -1: MONKEY -> YEKNOM -> XDJMLN. TIGER -> REGIT -> QDFHS.",
    "Coding-Decoding", "hard", 3, 1),

  // --- 5 CS MCQs, funny yet informative ---
  mcq("Your program works perfectly until you add one printf, then the bug vanishes. The most likely culprit is:",
    O4("A race condition - the printf changed the timing",
       "The compiler personally dislikes you",
       "printf repairs memory corruption",
       "A syntax error that only appears sometimes"),
    "a",
    "The classic \"heisenbug\". I/O is slow, so it perturbs thread interleaving and hides the race. Timing is not synchronisation - if a printf fixes it, you have a concurrency bug, not a fixed bug.",
    "Concurrency", "medium", 2, 0.5),

  mcq("A colleague \"optimises\" a database by deleting all indexes because \"indexes take up space\". Reads now:",
    O4("Fall off a cliff - queries degrade to full table scans",
       "Get faster, since there is less to maintain",
       "Stay identical",
       "Become more accurate"),
    "a",
    "Indexes trade disk and write speed for read speed. Dropping them turns an O(log n) lookup into an O(n) scan. Writes do get marginally cheaper - which is the only grain of truth in the story.",
    "DBMS", "medium", 2, 0.5),

  mcq("\"It works on my machine\" is most often explained by:",
    O4("Environment differences - versions, env vars, locale, paths, timezone",
       "Your machine having superior hardware",
       "The other machine being cursed",
       "Nothing; the code is simply wrong on the other machine"),
    "a",
    "This exact sentence is why containers exist. Pin your dependencies and never let an absolute path from your home directory ship.",
    "Software Engineering", "easy", 2, 0.5),

  mcq("A recursive function with no reachable base case produces:",
    O4("A stack overflow, because every call frame is pushed and never popped",
       "An infinite loop that uses no memory",
       "A compile error, always",
       "A heap overflow"),
    "a",
    "Each call consumes a stack frame. The stack is small and fixed, so it exhausts in milliseconds - which is why the crash is a stack overflow and not a hang.",
    "Recursion", "easy", 2, 0.5),

  mcq("You store passwords with MD5 \"because it's a hash, so it's secure\". The real problem is:",
    O4("MD5 is fast and broken - it is built for speed, which is exactly wrong for passwords",
       "MD5 output is too short to store",
       "MD5 cannot hash letters",
       "Nothing; MD5 is fine with a salt"),
    "a",
    "Password hashing must be deliberately SLOW. bcrypt, scrypt and Argon2 exist to make brute force expensive; MD5 lets an attacker try billions per second, and it has practical collisions besides.",
    "Security", "medium", 2, 0.5),

  // --- 5 DSA MCQs, funny yet informative ---
  mcq("Someone sorts an array to find its maximum element. Their solution is:",
    O4("Correct but wasteful - O(n log n) where a single O(n) pass suffices",
       "Wrong; sorting does not reveal the maximum",
       "Optimal, since sorted data is always better",
       "O(n), the same as a linear scan"),
    "a",
    "It works, and it will pass small tests, which is why this habit survives. But you paid a sort to answer a question one comparison-per-element already answers.",
    "Complexity", "easy", 2, 0.5),

  mcq("Bogosort shuffles the array randomly until it happens to be sorted. Its average complexity is:",
    O4("O(n * n!)", "O(n^2)", "O(n log n)", "O(2^n)"),
    "a",
    "There are n! permutations and each check costs O(n). It is a genuine teaching tool: it shows that \"terminates eventually\" and \"is an algorithm you may use\" are different claims.",
    "Sorting", "hard", 2, 0.5),

  mcq("You need the k-th smallest element of a huge unsorted array, k is tiny. The best approach:",
    O4("A max-heap of size k, giving O(n log k)",
       "Sort the whole array, O(n log n)",
       "A min-heap of every element, O(n log n)",
       "Linear search k times, O(nk)"),
    "a",
    "Keep only the k best seen so far and evict the worst. Memory drops from n to k, and log k beats log n whenever k is small - which was the premise.",
    "Heaps", "hard", 2, 0.5),

  mcq("A hash table with a hash function that returns 42 for every key degrades to:",
    O4("A linked list - every key collides into one bucket, so lookup becomes O(n)",
       "A binary search tree with O(log n) lookup",
       "An array with O(1) lookup regardless",
       "A perfectly valid O(1) table"),
    "a",
    "It is still CORRECT - just uniformly terrible. This is precisely why hash-flooding is a denial-of-service vector, and why languages randomise their hash seeds.",
    "Hashing", "medium", 2, 0.5),

  mcq("Reversing a linked list is famously a whiteboard favourite. The reason it is genuinely hard the first time:",
    O4("You must hold three pointers at once - previous, current and next - or you lose the rest of the list",
       "It cannot be done without extra O(n) memory",
       "Linked lists cannot be traversed backwards, so it is impossible",
       "It requires recursion by definition"),
    "a",
    "Reassign current.next before saving next and the remainder of the list is unreachable. That one missing temporary is the entire difficulty, and it is why the iterative version is O(1) space.",
    "Linked Lists", "medium", 2, 0.5),

  // --- 3 coding: deliberately dense statements, small solutions ---
  coding({
    question: `The Archivist's Lament

The Grand Archive of Malla Reddy stores every manuscript in exact duplicate: for every scroll there exists precisely one identical twin, catalogued under the same numeric sigil. This redundancy is sacred and has never been violated - save once.

A single manuscript, the Codex Singularis, was bound without a twin. Its sigil therefore appears exactly once in the catalogue, while every other sigil appears exactly twice. The Archivist has lost the index and refuses to sort the catalogue (the scrolls are heavy) or to write anything down (the ink is expensive).

Recover the sigil of the Codex Singularis.

INPUT
Line 1: n, the number of catalogue entries (n is odd, 1 <= n <= 200000)
Line 2: n space-separated integers - the sigils

OUTPUT
The single sigil that appears exactly once.

EXAMPLE
Input:
5
4 1 2 1 2
Output:
4

The Archivist's twin constraints - no sorting, no extra bookkeeping - are a hint, not decoration. O(n) time and O(1) extra space is achievable.`,
    topic: "Bit Manipulation", difficulty: "medium", marks: 10,
    samples: [
      { input: "5\n4 1 2 1 2", expectedOutput: "4", explanation: "1 and 2 each appear twice; 4 stands alone." },
      { input: "1\n99", expectedOutput: "99", explanation: "A single entry is trivially the unpaired one." },
    ],
    hidden: [
      { input: "3\n7 7 3", expectedOutput: "3" },
      { input: "7\n10 20 30 20 10 30 40", expectedOutput: "40" },
      { input: "5\n0 5 5 9 9", expectedOutput: "0" },
      { input: "3\n-4 -4 -9", expectedOutput: "-9" },
      { input: "9\n1 1 2 2 3 3 4 4 5", expectedOutput: "5" },
      { input: "5\n1000000 1 1 2 2", expectedOutput: "1000000" },
    ],
  }),

  coding({
    question: `The Verdict of the Overwhelming Faction

The Student Council convenes with n delegates. Each delegate belongs to exactly one faction, identified by an integer badge. Council bylaws state that a motion carries only if one faction holds a STRICT majority - that is, more than n/2 of all delegates.

The Speaker guarantees that such a faction exists for today's session. However, the Speaker also insists that delegates must not be re-counted faction by faction (it wastes the session) and that no tally sheet may be kept (the Registrar is on leave).

Name the badge of the faction holding the majority.

INPUT
Line 1: n, the number of delegates (1 <= n <= 200000)
Line 2: n space-separated integers - each delegate's faction badge

OUTPUT
The badge of the majority faction.

EXAMPLE
Input:
7
2 2 1 2 3 2 2
Output:
2

"No tally sheet" rules out a frequency map. There is a single-pass method that keeps one candidate and one counter.`,
    topic: "Arrays", difficulty: "medium", marks: 10,
    samples: [
      { input: "7\n2 2 1 2 3 2 2", expectedOutput: "2", explanation: "Faction 2 holds 5 of 7 seats, which is more than 3.5." },
      { input: "3\n1 1 2", expectedOutput: "1", explanation: "Faction 1 holds 2 of 3." },
    ],
    hidden: [
      { input: "1\n8", expectedOutput: "8" },
      { input: "5\n3 3 4 3 3", expectedOutput: "3" },
      { input: "4\n6 6 6 1", expectedOutput: "6" },
      { input: "9\n5 1 5 2 5 3 5 4 5", expectedOutput: "5" },
      { input: "6\n-2 -2 -2 -2 7 8", expectedOutput: "-2" },
      { input: "11\n1 1 1 1 1 1 2 3 4 5 6", expectedOutput: "1" },
    ],
  }),

  coding({
    question: `The Quartermaster's Incomplete Ledger

Before the monsoon drill, the Quartermaster issued numbered tokens to cadets - one token each, numbered consecutively from 1 to n with no gaps and no repeats. At dusk, n - 1 tokens were returned. Exactly one token is missing.

The Quartermaster has a ledger listing the returned token numbers in no particular order, and a strict standing order: the ledger may be read once, front to back, and must not be reordered, annotated, or copied.

Determine the number on the missing token.

INPUT
Line 1: n, the highest token number originally issued (1 <= n <= 1000000)
Line 2: n - 1 space-separated integers - the returned token numbers, in arbitrary order
        (when n = 1 this line is empty)

OUTPUT
The missing token number.

EXAMPLE
Input:
5
1 2 4 5
Output:
3

"Read once, do not reorder" forbids sorting and forbids a seen-array. Consider what you already know about the complete set before you read a single entry.`,
    topic: "Mathematics", difficulty: "easy", marks: 10,
    samples: [
      { input: "5\n1 2 4 5", expectedOutput: "3", explanation: "1+2+3+4+5 = 15; the returned tokens sum to 12; the difference is the missing token." },
      { input: "1\n", expectedOutput: "1", explanation: "One token was issued and none returned, so token 1 is missing." },
    ],
    hidden: [
      { input: "2\n2", expectedOutput: "1" },
      { input: "2\n1", expectedOutput: "2" },
      { input: "10\n1 2 3 4 5 6 7 8 9", expectedOutput: "10" },
      { input: "10\n2 3 4 5 6 7 8 9 10", expectedOutput: "1" },
      { input: "6\n6 1 5 2 4", expectedOutput: "3" },
      { input: "100000\n" + Array.from({ length: 99999 }, (_, i) => (i + 1 === 54321 ? 100000 : i + 1)).join(" "), expectedOutput: "54321" },
    ],
  }),
];

// ---------------------------------------------------------------------------
// contest definitions
// ---------------------------------------------------------------------------
const CONTESTS = [
  {
    key: "ii-year",
    year: "II Year",
    title: "MRCET II Year - CS & Data Structures Fundamentals (Proctored)",
    difficulty: "Easy",
    contestType: "mcq",
    description: "A 40-minute invigilated test on core CS fundamentals (OS, DBMS, Networks, OOP) and data-structure basics (arrays, linked lists, stacks, queues, trees, hashing, complexity). 20 MCQs, 2 marks each, -0.5 for a wrong answer. Camera proctoring and fullscreen are required.",
    durationMinutes: 40,
    start: "2026-08-08T10:00:00+05:30",
    end: "2026-08-08T10:45:00+05:30",
    tags: ["MRCET", "II Year", "CS Fundamentals", "DSA", "Proctored"],
    questions: YEAR2_QUESTIONS,
  },
  {
    key: "iii-year",
    year: "III Year",
    title: "MRCET III Year - Stacks & Queues Contest, Week 3 (Proctored)",
    difficulty: "Medium",
    contestType: "mixed",
    description: "A 75-minute invigilated contest on Week 3 of Daily Learning - Stacks, Monotonic Stacks, Queues, Circular Queues, Deques and Expression Evaluation. 10 MCQs (2 marks each, -0.5 wrong) plus 3 coding questions (10 marks each). Camera proctoring and fullscreen are required.",
    durationMinutes: 75,
    start: "2026-08-08T11:15:00+05:30",
    end: "2026-08-08T12:45:00+05:30",
    tags: ["MRCET", "III Year", "Stacks", "Queues", "Week 3", "Proctored"],
    questions: YEAR3_QUESTIONS,
  },
  {
    key: "iv-year",
    year: "IV Year",
    title: "MRCET IV Year - Placement Readiness Round (Proctored)",
    difficulty: "Hard",
    contestType: "placement",
    description: "A 90-minute invigilated placement-style round: 10 hard aptitude questions (3 marks each, -1 wrong), 5 CS and 5 DSA MCQs (2 marks each, -0.5 wrong), and 3 coding questions (10 marks each) whose statements are deliberately dense but whose solutions are short. Camera proctoring and fullscreen are required.",
    durationMinutes: 90,
    start: "2026-08-08T14:00:00+05:30",
    end: "2026-08-08T15:45:00+05:30",
    tags: ["MRCET", "IV Year", "Aptitude", "Coding", "Placement", "Proctored"],
    questions: YEAR4_QUESTIONS,
  },
];

// ---------------------------------------------------------------------------
async function seedContest(def) {
  const existing = await db.collection("contests")
    .where("seedKey", "==", `${SEED_KEY}:${def.key}`).limit(1).get();
  if (!existing.empty) {
    console.log(`  SKIP ${def.key} - already seeded as ${existing.docs[0].id}`);
    return existing.docs[0].id;
  }

  const mcqCount = def.questions.filter(q => q.kind === "mcq").length;
  const codingCount = def.questions.filter(q => q.kind === "coding").length;
  const maxMarks = def.questions.reduce((s, q) => s + q.marks, 0);

  if (DRY_RUN) {
    console.log(`  [dry-run] ${def.key}: ${mcqCount} MCQ + ${codingCount} coding = ${maxMarks} marks, ${def.start}`);
    return null;
  }

  const ref = db.collection("contests").doc();
  await ref.set({
    title: def.title,
    category: "Placement Preparation",
    difficulty: def.difficulty,
    contestType: def.contestType,
    bannerUrl: "",
    description: def.description,
    rules: RULES_TEXT(def.durationMinutes),
    eligibility: `Open to approved MRCET ${def.year} students only.`,
    organizer: "MRCET Training & Placement Cell",
    tags: def.tags,

    // Registration opens immediately and closes when the contest starts, so a
    // student can still register on the morning of the contest. The attempt is
    // gated on an existing registration by design.
    registrationStart: TS("2026-08-06T09:00:00+05:30"),
    registrationEnd: TS(def.start),
    contestStart: TS(def.start),
    contestEnd: TS(def.end),
    durationMinutes: def.durationMinutes,

    // Scoped to one year. `mode: "scoped"` is required - firestore.rules'
    // matchesContestScope() ignores the year list entirely for any other mode,
    // which would silently open the paper to all 599 students.
    targetScope: { mode: "scoped", departments: [], years: [def.year], sections: [], classroomIds: [], uids: [] },

    prizeXp: 0,
    prizeCoins: 0,
    prizeText: "",
    status: PUBLISH ? "published" : "draft",
    settings: BASE_SETTINGS,

    institutionId: INSTITUTION_ID,
    participantCount: 0,
    questionCount: def.questions.length,
    maxMarks,
    seedKey: `${SEED_KEY}:${def.key}`,
    createdAt: FV.serverTimestamp(),
    createdBy: "devert.contact@gmail.com",
  });

  let order = 0;
  for (const q of def.questions) {
    const qRef = ref.collection("questions").doc();
    await qRef.set({
      type: q.type,
      question: q.question,
      options: q.kind === "mcq" ? q.options : [],
      marks: q.marks,
      negativeMarks: q.negativeMarks,
      topic: q.topic,
      category: "",
      tags: [],
      difficulty: q.difficulty,
      order,
      estimatedTimeSec: null,
      hintText: "",
      imageUrl: "",
      codeSnippet: "",
      createdAt: FV.serverTimestamp(),
    });

    if (q.kind === "mcq") {
      await ref.collection("answerKeys").doc(qRef.id).set({
        correctOptionIds: q.correctOptionIds,
        correctText: "",
        explanation: q.explanation,
      });
    } else {
      // Coding questions deliberately get NO answerKeys doc - there is nothing
      // client-gradable, and hidden tests must never be client-readable.
      for (const t of q.samples) {
        await qRef.collection("sampleTests").doc().set({
          input: t.input, expectedOutput: t.expectedOutput, explanation: t.explanation || "",
        });
      }
      for (const t of q.hidden) {
        await qRef.collection("hiddenTests").doc().set({
          input: t.input, expectedOutput: t.expectedOutput,
        });
      }
    }
    order++;
  }

  console.log(`  ${def.key}: ${ref.id}  (${mcqCount} MCQ + ${codingCount} coding, ${maxMarks} marks, status=${PUBLISH ? "published" : "draft"})`);
  return ref.id;
}

async function main() {
  console.log(`seeding ${CONTESTS.length} contests for ${INSTITUTION_ID}${DRY_RUN ? " [DRY RUN]" : ""}`);
  console.log(`status: ${PUBLISH ? "PUBLISHED (live)" : "draft (use --publish to go live)"}\n`);
  for (const def of CONTESTS) await seedContest(def);
  console.log("\ndone.");
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
