// Creates one real, ready-to-run institution contest and opens registration.
//
// Written as a script rather than clicked through the Contest Studio because
// the Studio has no bulk path for coding questions with hidden tests - each one
// is a multi-step form, and 13 questions is a long way to click without a typo.
// Everything here goes through the SAME document shapes lib/contests.js reads
// (createContest / addContestQuestion / saveContestCodingTests), so the result
// is indistinguishable from a Studio-authored contest and every admin control
// (pause, extend, force-end, lifecycle transitions) works on it normally.
//
// SECURITY: hiddenTests go to contests/{id}/questions/{qid}/hiddenTests, which
// firestore.rules blocks every client from reading - same boundary as
// problems/{id}/hiddenTests. Only the Spring backend (firebase-admin) ever
// reads them, at grading time. Sample tests are deliberately client-readable so
// the attempt view can run them locally, exactly like CampusProblemView does.
//
// Usage:  node scripts/create-todays-contest.mjs [--dry-run]
//         node scripts/create-todays-contest.mjs --start "17:00" --duration 60

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { readFileSync } from "fs";

const SLUG = "mrcet";
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

const argv = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i !== -1 && argv[i + 1] ? argv[i + 1] : fallback;
};
const DRY = argv.includes("--dry-run");
const START_HHMM = flag("start", "17:00");
const DURATION_MIN = parseInt(flag("duration", "60"), 10);

// Times are authored in IST because that is what the institution runs on, then
// stored as real Date objects (Firestore Timestamps) - never as strings, or
// contestPhase()'s comparisons would silently compare text.
function istToday(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  const nowIstMidnight = new Date(Math.floor((Date.now() + IST_OFFSET_MS) / 86400000) * 86400000);
  return new Date(nowIstMidnight.getTime() + h * 3600000 + m * 60000 - IST_OFFSET_MS);
}
const fmtIst = (d) => new Date(d.getTime() + IST_OFFSET_MS).toISOString().replace("T", " ").slice(0, 16) + " IST";

const contestStart = istToday(START_HHMM);
const contestEnd = new Date(contestStart.getTime() + DURATION_MIN * 60000);
const registrationStart = new Date();
// Registration shuts 15 min before the gun so the roster is settled at start.
const registrationEnd = new Date(contestStart.getTime() - 15 * 60000);

// ---------------- questions ----------------
// 10 MCQ x 1 mark = 10, plus 3 coding x 5 marks = 15. Total 25.
// options[].id is the lowercase letter, and answerKeys.correctOptionIds
// references those same ids - that is the contract isAnswerCorrect() grades on.
const opts = (...texts) => ["a", "b", "c", "d"].slice(0, texts.length).map((id, i) => ({ id, text: texts[i] }));

const MCQS = [
  {
    question: "What is the worst-case time complexity of binary search on a sorted array of n elements?",
    options: opts("O(n)", "O(log n)", "O(n log n)", "O(1)"),
    correct: ["b"], topic: "Algorithms", difficulty: "easy",
    explanation: "Each comparison halves the remaining search space, so it takes log2(n) steps.",
  },
  {
    question: "Which data structure does a recursive function use internally to remember where to return?",
    options: opts("Queue", "Call stack", "Heap", "Linked list"),
    correct: ["b"], topic: "Data Structures", difficulty: "easy",
    explanation: "Each call pushes a stack frame holding its locals and return address; returning pops it.",
  },
  {
    question: "In a max-heap of n elements, what is the time complexity of extracting the maximum?",
    options: opts("O(1)", "O(log n)", "O(n)", "O(n log n)"),
    correct: ["b"], topic: "Data Structures", difficulty: "medium",
    explanation: "Reading the root is O(1), but re-heapifying after removing it sifts down the tree height, O(log n).",
  },
  {
    question: "What does the SQL HAVING clause do that WHERE cannot?",
    options: opts("Filter rows before grouping", "Filter groups after aggregation", "Sort the result set", "Join two tables"),
    correct: ["b"], topic: "DBMS", difficulty: "medium",
    explanation: "WHERE filters individual rows before GROUP BY; HAVING filters the grouped results, so it can test aggregates like COUNT(*) > 5.",
  },
  {
    question: "A process is in the 'ready' state. What does that mean?",
    options: opts("It is waiting for I/O to finish", "It has everything it needs and is waiting only for CPU time", "It has finished executing", "It is blocked on a semaphore"),
    correct: ["b"], topic: "Operating Systems", difficulty: "easy",
    explanation: "Ready means runnable - the only thing missing is a turn on the CPU. Waiting on I/O or a semaphore is the 'blocked' state.",
  },
  {
    question: "Which of the following is NOT a property of a primary key?",
    options: opts("It uniquely identifies a row", "It cannot contain NULL", "A table can have several of them", "It can be composed of multiple columns"),
    correct: ["c"], topic: "DBMS", difficulty: "easy",
    explanation: "A table has exactly one primary key, though that key may span multiple columns (a composite key).",
  },
  {
    question: "What is the space complexity of the merge sort algorithm on an array of n elements?",
    options: opts("O(1)", "O(log n)", "O(n)", "O(n log n)"),
    correct: ["c"], topic: "Algorithms", difficulty: "medium",
    explanation: "Merge sort needs an auxiliary array of size n to merge into. The O(log n) recursion depth is dominated by that O(n).",
  },
  {
    question: "In OOP, what does method overriding require?",
    options: opts("Same method name, different parameters, same class", "Same method signature in a subclass", "A static method in a parent class", "A final method in a subclass"),
    correct: ["b"], topic: "OOP", difficulty: "easy",
    explanation: "Overriding replaces a superclass method with a subclass one of identical signature. Same name with different parameters is overloading.",
  },
  {
    question: "Which layer of the TCP/IP model is responsible for end-to-end reliable delivery?",
    options: opts("Application layer", "Transport layer", "Internet layer", "Link layer"),
    correct: ["b"], topic: "Computer Networks", difficulty: "medium",
    explanation: "TCP lives at the transport layer and provides ordering, retransmission and flow control. The internet layer (IP) is best-effort only.",
  },
  {
    question: "What is the average-case time complexity of a lookup in a hash table with a good hash function?",
    options: opts("O(1)", "O(log n)", "O(n)", "O(n log n)"),
    correct: ["a"], topic: "Data Structures", difficulty: "easy",
    explanation: "Constant on average. It degrades to O(n) in the worst case when every key collides into one bucket.",
  },
].map(q => ({
  type: "mcq", marks: 1, negativeMarks: 0,
  question: q.question, options: q.options, correctOptionIds: q.correct,
  topic: q.topic, difficulty: q.difficulty, explanation: q.explanation,
}));

// Coding questions read stdin and write stdout - the same contract CodeLab's
// Judge0 pipeline already uses, so no new execution path is introduced.
const CODING = [
  {
    question: [
      "**Second Largest Element**",
      "",
      "Given an array of N integers, print the second largest **distinct** element.",
      "If no such element exists (every value is identical, or N < 2), print `-1`.",
      "",
      "**Input**",
      "Line 1: integer N",
      "Line 2: N space-separated integers",
      "",
      "**Output**",
      "A single integer - the second largest distinct value, or -1.",
      "",
      "**Constraints**",
      "1 <= N <= 10^5, -10^9 <= arr[i] <= 10^9",
    ].join("\n"),
    marks: 5, difficulty: "easy", topic: "Arrays",
    explanation: "Track the largest and second largest in one pass, skipping duplicates of the largest. O(N) time, O(1) space - sorting also passes but is O(N log N).",
    sampleTests: [
      { input: "5\n10 5 8 20 12", expectedOutput: "12", explanation: "Largest is 20, second largest distinct is 12." },
      { input: "4\n7 7 7 7", expectedOutput: "-1", explanation: "Every element is identical, so there is no second distinct value." },
    ],
    hiddenTests: [
      { input: "2\n1 2", expectedOutput: "1" },
      { input: "1\n42", expectedOutput: "-1" },
      { input: "6\n-5 -2 -9 -2 -1 -1", expectedOutput: "-2" },
      { input: "5\n1000000000 999999999 1000000000 1 2", expectedOutput: "999999999" },
      { input: "3\n5 5 3", expectedOutput: "3" },
    ],
  },
  {
    question: [
      "**Valid Palindrome**",
      "",
      "Given a string S, determine whether it is a palindrome considering **only alphanumeric characters** and ignoring case.",
      "Print `YES` if it is, otherwise `NO`.",
      "",
      "**Input**",
      "A single line containing S (it may contain spaces and punctuation).",
      "",
      "**Output**",
      "`YES` or `NO`.",
      "",
      "**Constraints**",
      "1 <= |S| <= 10^5",
    ].join("\n"),
    marks: 5, difficulty: "easy", topic: "Strings",
    explanation: "Two pointers from both ends, skipping non-alphanumeric characters and comparing lowercased. O(|S|) time, O(1) extra space.",
    sampleTests: [
      { input: "A man, a plan, a canal: Panama", expectedOutput: "YES", explanation: "Stripped and lowercased this is 'amanaplanacanalpanama', which reads the same backwards." },
      { input: "race a car", expectedOutput: "NO", explanation: "'raceacar' is not a palindrome." },
    ],
    hiddenTests: [
      { input: "a", expectedOutput: "YES" },
      { input: ".,", expectedOutput: "YES" },
      { input: "0P", expectedOutput: "NO" },
      { input: "Was it a car or a cat I saw?", expectedOutput: "YES" },
      { input: "ab@ba", expectedOutput: "YES" },
      { input: "abcdef", expectedOutput: "NO" },
    ],
  },
  {
    question: [
      "**Longest Substring Without Repeating Characters**",
      "",
      "Given a string S, print the length of the longest substring that contains no repeated character.",
      "",
      "**Input**",
      "A single line containing S. S may be empty.",
      "",
      "**Output**",
      "A single integer - the length of the longest such substring.",
      "",
      "**Constraints**",
      "0 <= |S| <= 10^5. S consists of printable ASCII characters.",
    ].join("\n"),
    marks: 5, difficulty: "medium", topic: "Sliding Window",
    explanation: "Sliding window with a map from character to its last index. When a repeat is found inside the window, jump the left edge past the previous occurrence. O(|S|) time.",
    sampleTests: [
      { input: "abcabcbb", expectedOutput: "3", explanation: "'abc' has length 3." },
      { input: "bbbbb", expectedOutput: "1", explanation: "Only 'b', so the answer is 1." },
    ],
    hiddenTests: [
      { input: "pwwkew", expectedOutput: "3" },
      { input: "", expectedOutput: "0" },
      { input: "au", expectedOutput: "2" },
      { input: "dvdf", expectedOutput: "3" },
      { input: "abba", expectedOutput: "2" },
      { input: "tmmzuxt", expectedOutput: "5" },
    ],
  },
].map(q => ({
  type: "coding", negativeMarks: 0, options: [], correctOptionIds: [], correctText: "",
  ...q,
}));

const ALL = [...CODING, ...MCQS]; // coding first - harder work while the clock is fresh
const totalMarks = ALL.reduce((n, q) => n + q.marks, 0);

// ---------------- main ----------------
const sa = JSON.parse(readFileSync("scripts/service-account.json", "utf8"));
initializeApp({ credential: cert(sa) });
const db = getFirestore();

console.log(`Contest window : ${fmtIst(contestStart)}  ->  ${fmtIst(contestEnd)}  (${DURATION_MIN} min)`);
console.log(`Registration   : now -> ${fmtIst(registrationEnd)}`);
console.log(`Questions      : ${CODING.length} coding x 5 + ${MCQS.length} MCQ x 1 = ${totalMarks} marks`);

const roster = await db.collection("institutions").doc(SLUG).collection("students")
  .where("status", "==", "approved").get();
const eligible = roster.docs.map(d => d.data()).filter(s => s.year === "III Year");
console.log(`Eligible       : ${eligible.length} III Year students (of ${roster.size} approved)`);

if (DRY) { console.log("\n--dry-run: nothing written."); process.exit(0); }

const contest = {
  title: "MRCET Placement Sprint - Coding + Aptitude (III Year)",
  category: "Placement", difficulty: "Medium", bannerUrl: "",
  description: "A one-hour placement-pattern contest for third year students: 3 coding problems and 10 MCQs covering DSA, DBMS, OS, CN and OOP. Solve in any supported language.",
  rules: [
    "Duration is 60 minutes from the moment the contest starts.",
    "3 coding questions (5 marks each) and 10 MCQs (1 mark each). Total 25 marks.",
    "There is no negative marking.",
    "Coding questions are graded against hidden test cases after submission.",
    "Your work is saved as you go; submit before the timer ends.",
  ].join("\n"),
  eligibility: "All III Year students of MRCET.",
  organizer: "MRCET Training & Placement Cell",
  tags: ["placement", "coding", "aptitude", "III Year"],
  contestType: "mixed",
  // The whole point of the run: III Year only. matchesTargetScope ANDs the
  // hierarchy levels, so leaving departments/sections empty means "every
  // department and section, third year only".
  targetScope: { mode: "scoped", departments: [], years: ["III Year"], sections: [], classroomIds: [], uids: [] },
  registrationStart, registrationEnd, contestStart, contestEnd,
  graceMinutes: 0, resultPublishAt: null, leaderboardPublishAt: null,
  durationMinutes: DURATION_MIN,
  prizeXp: 0, prizeCoins: 0, prizeText: "",
  status: "published",
  lifecycleState: "registrationOpen",
  // A concrete Date, not serverTimestamp() - Firestore rejects a sentinel
  // inside an array ("cannot be used inside of an array"). This is the same
  // bug lib/contests.js has in createContest/transitionContestLifecycle, which
  // is why every existing lifecycleHistory entry was written by "_migration"
  // and none by the app itself. Fixed there too.
  lifecycleHistory: [{ state: "registrationOpen", at: new Date(), byUid: "script:create-todays-contest" }],
  institutionId: SLUG,
  participantCount: 0, questionCount: ALL.length,
  createdAt: FieldValue.serverTimestamp(), createdBy: "script:create-todays-contest",
};

const ref = await db.collection("contests").add(contest);
console.log(`\nCreated contest ${ref.id}`);

for (let i = 0; i < ALL.length; i++) {
  const q = ALL[i];
  const qRef = ref.collection("questions").doc();
  await qRef.set({
    type: q.type, question: q.question, options: q.options || [],
    marks: q.marks, negativeMarks: q.negativeMarks || 0,
    topic: q.topic || "", category: "", tags: [], difficulty: q.difficulty || "medium",
    order: i, estimatedTimeSec: null, hintText: "", imageUrl: "", codeSnippet: "",
    createdAt: FieldValue.serverTimestamp(),
  });
  await ref.collection("answerKeys").doc(qRef.id).set({
    correctOptionIds: q.correctOptionIds || [],
    correctText: q.correctText || "",
    explanation: q.explanation || "",
  });
  if (q.type === "coding") {
    for (const t of q.sampleTests) {
      await qRef.collection("sampleTests").add({ input: t.input, expectedOutput: t.expectedOutput, explanation: t.explanation || "" });
    }
    for (const t of q.hiddenTests) {
      await qRef.collection("hiddenTests").add({ input: t.input, expectedOutput: t.expectedOutput });
    }
    console.log(`  [${i}] coding  ${q.marks}m  ${q.topic.padEnd(16)} ${q.sampleTests.length} sample / ${q.hiddenTests.length} hidden`);
  } else {
    console.log(`  [${i}] mcq     ${q.marks}m  ${q.topic}`);
  }
}

// Without this the contest exists but the Contests tab stays hidden for every
// student - moduleAccess.contests is explicitly false on most classrooms.
const rooms = await db.collection("institutions").doc(SLUG).collection("classrooms").get();
const batch = db.batch();
let flipped = 0;
rooms.docs.forEach(d => {
  if (d.data().moduleAccess?.contests !== true) { batch.update(d.ref, { "moduleAccess.contests": true }); flipped++; }
});
if (flipped) await batch.commit();
console.log(`\nEnabled the Contests module on ${flipped} of ${rooms.size} classrooms.`);
console.log(`Live at: /campus/${SLUG}?tab=contests&open=${ref.id}`);
process.exit(0);
