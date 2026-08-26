import admin from "firebase-admin";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(join(__dirname, "service-account.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// MRCET's first real weekend contest - scheduled for Sunday (not Saturday,
// which Daily Learning's own Week 1 master test already occupies) so it
// doesn't compete with that for the same day. Same schema
// lib/contests.js's createContest/addContestQuestion write from the
// Contest Studio UI - this script just writes it directly via admin SDK.
// Themed on Week 1's Arrays & Two Pointers material but every question is
// freshly worded (not copy-pasted from the Daily Learning MCQs) and hand-
// verified, not guessed.

const SLUG = "mrcet";

const opt = (id, text) => ({ id, text });
const q = (question, options, correctOptionIds, explanation, topic, difficulty = "medium") => ({
  type: "mcq", question, options, correctOptionIds, correctText: "", marks: 2, negativeMarks: 0.5,
  explanation, topic, difficulty,
});

const QUESTIONS = [
  q(
    "What is the time complexity of the two-pointer technique for finding a target-sum pair in a SORTED array?",
    [opt("a", "O(n)"), opt("b", "O(n log n)"), opt("c", "O(n^2)"), opt("d", "O(log n)")],
    ["a"],
    "Each pointer only ever moves forward, so the whole array is scanned at most once total across both pointers.",
    "Two Pointers",
  ),
  q(
    "In Kadane's algorithm, when the running sum would drop below the current element's own value, it resets to:",
    [opt("a", "The current element itself"), opt("b", "Zero"), opt("c", "The previous maximum"), opt("d", "Negative infinity")],
    ["a"],
    "max(x, runningSum + x) naturally restarts the subarray at x whenever carrying the old sum forward would be worse.",
    "Kadane's Algorithm",
  ),
  q(
    "Which algorithm sorts an array of only 0s, 1s, and 2s in a single O(n) pass using three pointers?",
    [opt("a", "Dutch National Flag"), opt("b", "Merge Sort"), opt("c", "Binary Search"), opt("d", "Kadane's Algorithm")],
    ["a"],
    "low/mid/high partition the array into three regions in one pass - no comparison-based sort needed.",
    "Partitioning",
  ),
  q(
    "A hash set turns \"has this value been seen before\" into what average-case time complexity?",
    [opt("a", "O(1)"), opt("b", "O(log n)"), opt("c", "O(n)"), opt("d", "O(n log n)")],
    ["a"],
    "Average-case hash set lookup/insert is O(1), which is what makes single-pass pair-sum and prefix-sum tricks O(n) overall.",
    "Hashing",
  ),
  q(
    "For arr = [2, 7, 11, 15], target = 9, using two pointers starting at both ends, which pair is found?",
    [opt("a", "(2, 7)"), opt("b", "(7, 11)"), opt("c", "(2, 11)"), opt("d", "(11, 15)")],
    ["a"],
    "left=0(2) + right=3(15) = 17 > 9, so right moves to 11: 2+11=13 > 9, right moves to 7: 2+7=9 - found.",
    "Two Pointers",
  ),
  q(
    "What's the key difference between a fixed-size and a variable-size sliding window?",
    [opt("a", "A fixed window always has width k; a variable window grows/shrinks based on a condition"), opt("b", "A fixed window can shrink; a variable window can't"), opt("c", "There is no difference"), opt("d", "A variable window always processes the array twice")],
    ["a"],
    "Fixed windows (e.g. max sum of k consecutive elements) keep width k; variable windows expand/contract to satisfy a running condition (e.g. sum >= target).",
    "Sliding Window",
  ),
  q(
    "Two pointers moving in the SAME direction at different speeds (one step vs two steps) is the basis of which classic problem?",
    [opt("a", "Detecting a cycle in a linked list"), opt("b", "Sorting an array"), opt("c", "Binary search"), opt("d", "Computing a hash")],
    ["a"],
    "Floyd's tortoise-and-hare: if a cycle exists, the faster pointer eventually laps the slower one from behind.",
    "Two Pointers",
  ),
  q(
    "In Trapping Rain Water, the water trapped above index i is bounded above by:",
    [opt("a", "min(maxLeft[i], maxRight[i]) - height[i]"), opt("b", "max(maxLeft[i], maxRight[i])"), opt("c", "height[i] itself"), opt("d", "maxLeft[i] + maxRight[i]")],
    ["a"],
    "Water can only be held up to the shorter of the two bounding walls on either side, minus the ground level at i.",
    "Two Pointers",
  ),
  q(
    "To detect if any subarray sums to exactly 0 using prefix sums and hashing, you look for:",
    [opt("a", "Two equal prefix sums at different indices"), opt("b", "A prefix sum equal to 0 only at the first index"), opt("c", "The maximum prefix sum"), opt("d", "A negative prefix sum")],
    ["a"],
    "If prefixSum[i] == prefixSum[j] for i < j, the elements strictly between them sum to exactly 0.",
    "Hashing",
  ),
  q(
    "Which of these is NOT O(n) as a single technique applied to an array of size n?",
    [opt("a", "Sorting the array first"), opt("b", "A two-pointer scan on an already-sorted array"), opt("c", "Kadane's algorithm"), opt("d", "A single hashing pass")],
    ["a"],
    "Comparison-based sorting is O(n log n); the other three are genuine single O(n) passes.",
    "Complexity",
  ),
];

async function main() {
  const contestRef = db.collection("contests").doc();
  await contestRef.set({
    title: "MRCET Weekend Contest - Arrays & Two Pointers Sprint",
    category: "Placement Preparation",
    difficulty: "Medium",
    bannerUrl: "",
    description: "A 30-minute timed sprint testing everything from Week 1's Daily Learning - two pointers, sliding window, Kadane's algorithm, Dutch National Flag partitioning, and hashing. Open only to MRCET's own approved students.",
    rules: "- Duration: 30 minutes\n- One attempt per participant\n- No external help allowed\n- Negative marking: -0.5 per wrong answer\n- Results and leaderboard published immediately after the contest ends.",
    eligibility: "Open to all approved MRCET students",
    organizer: "MRCET Training & Placement Cell",
    tags: ["Arrays", "Two Pointers", "DSA", "MRCET", "Weekend Contest"],
    registrationStart: admin.firestore.Timestamp.fromDate(new Date("2026-07-20T00:00:00+05:30")),
    registrationEnd: admin.firestore.Timestamp.fromDate(new Date("2026-07-26T10:00:00+05:30")),
    contestStart: admin.firestore.Timestamp.fromDate(new Date("2026-07-26T10:00:00+05:30")),
    contestEnd: admin.firestore.Timestamp.fromDate(new Date("2026-07-26T10:30:00+05:30")),
    durationMinutes: 30,
    prizeXp: 150,
    prizeCoins: 60,
    prizeText: "Top 3 get a leaderboard badge",
    status: "published",
    institutionId: SLUG,
    participantCount: 0,
    questionCount: QUESTIONS.length,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    createdBy: "devert.contact@gmail.com",
  });

  let order = 0;
  for (const question of QUESTIONS) {
    const qRef = contestRef.collection("questions").doc();
    await qRef.set({
      type: question.type, question: question.question, options: question.options,
      marks: question.marks, negativeMarks: question.negativeMarks,
      topic: question.topic, category: "", tags: [], difficulty: question.difficulty, order,
      estimatedTimeSec: null, hintText: "", imageUrl: "", codeSnippet: "",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    await contestRef.collection("answerKeys").doc(qRef.id).set({
      correctOptionIds: question.correctOptionIds, correctText: "", explanation: question.explanation,
    });
    order++;
  }

  console.log(`Created contest ${contestRef.id} with ${QUESTIONS.length} questions.`);
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
