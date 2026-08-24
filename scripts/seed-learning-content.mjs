// Seeds one real starter course for the Phase 1 learning ecosystem.
// Safe to re-run: skips creating the course if "dsa-fundamentals" already exists.
import admin from "firebase-admin";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(join(__dirname, "service-account.json"), "utf8"));

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const COURSE_ID = "dsa-fundamentals";

const existing = await db.doc(`courses/${COURSE_ID}`).get();
if (existing.exists) {
  console.log("Course already exists, skipping seed.");
  process.exit(0);
}

await db.doc(`courses/${COURSE_ID}`).set({
  title: "DSA Fundamentals",
  description: "Build a rock-solid foundation in data structures and algorithms, one focused task a day.",
  category: "DSA",
  color: "#00FF41",
  status: "published",
  order: 0,
  createdAt: admin.firestore.FieldValue.serverTimestamp(),
});

const moduleRef = db.collection(`courses/${COURSE_ID}/modules`).doc();
await moduleRef.set({
  title: "Arrays & Two Pointers",
  description: "The array patterns that show up in almost every coding interview.",
  order: 0,
  status: "published",
  createdAt: admin.firestore.FieldValue.serverTimestamp(),
});

const tasks = [
  {
    title: "Day 1: The Two-Pointer Technique",
    lessonBody:
      "Two pointers is a technique where you use two index variables that move through an array - " +
      "often from opposite ends, sometimes both from the start at different speeds.\n\n" +
      "Classic use case: finding a pair in a SORTED array that sums to a target.\n" +
      "  left = 0, right = length - 1\n" +
      "  while left < right:\n" +
      "    sum = arr[left] + arr[right]\n" +
      "    if sum == target: found it\n" +
      "    elif sum < target: left += 1\n" +
      "    else: right -= 1\n\n" +
      "This runs in O(n) instead of the O(n^2) brute-force nested loop, because each pointer only " +
      "moves forward - it never backtracks. Try it on: [2, 7, 11, 15], target 9 -> should find (2, 7).",
    xpReward: 50,
    coinReward: 20,
    quiz: [
      {
        id: "q1",
        text: "What is the time complexity of the two-pointer approach on a sorted array?",
        options: ["O(n^2)", "O(n log n)", "O(n)", "O(1)"],
        correctIndex: 2,
      },
      {
        id: "q2",
        text: "Why does the two-pointer technique require the array to be sorted (for the sum-target pattern)?",
        options: [
          "It doesn't - it works on unsorted arrays too",
          "So moving left/right predictably increases/decreases the sum",
          "Sorting is required by JavaScript arrays",
          "To make the array smaller",
        ],
        correctIndex: 1,
      },
      {
        id: "q3",
        text: "Given [2, 7, 11, 15] and target 9, which pair do the two pointers find?",
        options: ["(2, 15)", "(7, 11)", "(2, 7)", "(11, 15)"],
        correctIndex: 2,
      },
    ],
    order: 0,
    status: "published",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  },
];

for (const task of tasks) {
  await db.collection(`courses/${COURSE_ID}/modules/${moduleRef.id}/tasks`).add(task);
}

console.log(`Seeded course "${COURSE_ID}" with 1 module and ${tasks.length} task(s).`);
