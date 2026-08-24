import admin from "firebase-admin";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(join(__dirname, "service-account.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

// system/arena - one Solo Challenge (schema per admin's ArenaPanel/BLANK_CHALLENGE)
const arenaDoc = await db.doc("system/arena").get();
if (!arenaDoc.exists) {
  await db.doc("system/arena").set({
    challenges: [{
      type: "DSA", typeColor: "#00FFFF",
      title: "Reverse a Linked List",
      description: "Given the head of a singly linked list, reverse it in place and return the new head. Self-reported - mark solved once you've actually done it.",
      difficulty: "MEDIUM", diffColor: "#FF9500", diffBg: "rgba(255,149,0,0.08)",
      time: "30 min", tags: ["Linked List", "Pointers"], xp: 150,
    }],
    updatedAt: FieldValue.serverTimestamp(),
  });
  console.log("Seeded system/arena with 1 Solo Challenge.");
} else {
  console.log("system/arena already exists, skipping.");
}

// missions - one real mission (schema per admin's MissionsPanel)
const missionsSnap = await db.collection("missions").limit(1).get();
if (missionsSnap.empty) {
  await db.collection("missions").add({
    codename: "OPERATION: FIRST SHIP",
    objective: "Ship a small, real, working feature end-to-end (frontend + Firestore) and post it in Shipyard. Any stack - the point is a complete, deployed slice, not a perfect one.",
    prize: "₹500 + Shipyard feature spot",
    deadline: "7 days",
    team: 1, slots: 25, filled: 0,
    status: "OPEN", statusColor: "#00FF41",
    classification: "OPEN RECRUITMENT",
    difficulty: "EASY", diffColor: "#00FF41",
    tags: ["Beginner Friendly", "Shipyard", "Solo"],
    createdAt: FieldValue.serverTimestamp(),
  });
  console.log("Seeded 1 mission.");
} else {
  console.log("missions already has content, skipping.");
}

// hackathons - one real hackathon (schema per admin's HackathonsPanel; slug is the doc id)
const hackathonRef = db.doc("hackathons/devert-launch-hack");
const hackathonDoc = await hackathonRef.get();
if (!hackathonDoc.exists) {
  await hackathonRef.set({
    title: "DeVert Launch Hackathon",
    tagline: "48 hours. Ship something real. Win real prizes.",
    prize: "₹10,000",
    deadline: "Aug 31, 2026",
    maxTeamSize: 4,
    registrations: 0,
    tags: ["Web", "AI", "Open Theme"],
    status: "upcoming",
    statusColor: "#00FFFF",
    createdAt: FieldValue.serverTimestamp(),
  });
  console.log("Seeded 1 hackathon.");
} else {
  console.log("hackathons already has content, skipping.");
}

// CodeLab - one real problem with sample + hidden tests
const problemsSnap = await db.collection("problems").limit(1).get();
if (problemsSnap.empty) {
  const problemRef = await db.collection("problems").add({
    title: "Two Sum",
    category: "Arrays",
    difficulty: "Easy",
    tags: ["Array", "Hash Map"],
    statement: "Given an array of integers and a target value, print the 0-indexed positions of the two numbers that add up to the target, space-separated. Assume exactly one valid answer exists, and read input as: first line is the array (space-separated integers), second line is the target.",
    constraints: "2 <= array length <= 10^4\n-10^9 <= values <= 10^9",
    examplesText: "Input:\n2 7 11 15\n9\nOutput:\n0 1\n\nExplanation: nums[0] + nums[1] == 9, so indices 0 and 1 are printed.",
    hints: ["A hash map from value -> index lets you find the complement in one pass.", "For each number, check if (target - number) has already been seen."],
    estimatedTime: 15,
    xpReward: 50,
    coinReward: 20,
    status: "published",
    totalSubmissions: 0,
    acceptedSubmissions: 0,
    createdAt: FieldValue.serverTimestamp(),
    createdBy: "devert.contact@gmail.com",
  });

  await problemRef.collection("sampleTests").add({
    input: "2 7 11 15\n9", expectedOutput: "0 1",
    explanation: "2 + 7 = 9, at indices 0 and 1.",
  });
  await problemRef.collection("hiddenTests").add({
    input: "3 2 4\n6", expectedOutput: "1 2", points: 1,
  });
  await problemRef.collection("hiddenTests").add({
    input: "3 3\n6", expectedOutput: "0 1", points: 1,
  });

  console.log(`Seeded 1 CodeLab problem "Two Sum" (${problemRef.id}) with 1 sample + 2 hidden tests.`);
} else {
  console.log("CodeLab problems already has content, skipping.");
}

process.exit(0);
