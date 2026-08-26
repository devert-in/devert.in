import admin from "firebase-admin";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(join(__dirname, "service-account.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// Explicit +05:30 offsets so this is unambiguous regardless of what timezone this
// script actually executes in - matches the IST convention used elsewhere in the app
// (see todayIST() in components/aptitude-section.jsx / app/admin/page.jsx).
const registrationStart = new Date("2026-07-13T15:20:00+05:30");
const registrationEnd   = new Date("2026-07-13T15:40:00+05:30");
const contestStart      = new Date("2026-07-13T15:42:00+05:30");
const contestEnd        = new Date("2026-07-13T16:42:00+05:30");

const existing = await db.collection("contests").where("title", "==", "DeVert Aptitude & Reasoning Challenge #1").get();
if (!existing.empty) {
  console.log("Sample contest already exists, skipping creation.");
  process.exit(0);
}

const contestRef = await db.collection("contests").add({
  title: "DeVert Aptitude & Reasoning Challenge #1",
  category: "Aptitude & Reasoning",
  difficulty: "Easy",
  bannerUrl: "",
  description: "Test your quantitative aptitude, logical reasoning, analytical thinking, and verbal ability through a curated set of placement-focused questions. This contest is designed for students preparing for product-based company placements and competitive coding interviews.",
  rules: "- Duration: 60 minutes\n- One attempt per participant\n- No external help allowed\n- Negative marking: No\n- Results published immediately after submission ends.",
  eligibility: "Open to all registered DeVert users",
  organizer: "DeVert Learning Team",
  tags: ["Aptitude", "Reasoning", "Placement Prep", "Quantitative Aptitude", "Logical Reasoning", "Freshers", "Product Companies"],
  status: "published",
  registrationStart, registrationEnd, contestStart, contestEnd,
  durationMinutes: 60,
  prizeXp: 500,
  prizeCoins: 250,
  prizeText: "Winner Badge - 500 XP - 250 Coins - Featured on Weekly Leaderboard",
  participantCount: 0,
  questionCount: 0,
  createdAt: admin.firestore.FieldValue.serverTimestamp(),
  createdBy: "devert.contact@gmail.com",
});

const questions = [
  {
    question: "What is 15% of 200?",
    options: [{ id: "a", text: "20" }, { id: "b", text: "25" }, { id: "c", text: "30" }, { id: "d", text: "35" }],
    correctOptionIds: ["c"],
    explanation: "15% of 200 = (15/100) * 200 = 30.",
    marks: 4, negativeMarks: 0, topic: "Percentages", difficulty: "easy",
  },
  {
    question: "Find the next number in the series: 2, 6, 12, 20, 30, ?",
    options: [{ id: "a", text: "40" }, { id: "b", text: "42" }, { id: "c", text: "36" }, { id: "d", text: "44" }],
    correctOptionIds: ["b"],
    explanation: "Differences are 4, 6, 8, 10, 12 (each +2), so 30 + 12 = 42.",
    marks: 4, negativeMarks: 0, topic: "Number Series", difficulty: "easy",
  },
  {
    question: "If a train travels 60 km in 45 minutes, what is its speed in km/h?",
    options: [{ id: "a", text: "60" }, { id: "b", text: "75" }, { id: "c", text: "80" }, { id: "d", text: "90" }],
    correctOptionIds: ["c"],
    explanation: "Speed = distance / time = 60 km / 0.75 h = 80 km/h.",
    marks: 4, negativeMarks: 0, topic: "Time, Speed & Distance", difficulty: "medium",
  },
  {
    question: "Choose the word most similar in meaning to 'Ephemeral'.",
    options: [{ id: "a", text: "Permanent" }, { id: "b", text: "Transient" }, { id: "c", text: "Robust" }, { id: "d", text: "Ancient" }],
    correctOptionIds: ["b"],
    explanation: "'Ephemeral' means lasting a very short time - closest to 'Transient'.",
    marks: 4, negativeMarks: 0, topic: "Vocabulary", difficulty: "medium",
  },
  {
    question: "Pointing to a photograph, Ravi said, 'She is the daughter of my grandfather's only son.' How is the girl in the photograph related to Ravi?",
    options: [{ id: "a", text: "Sister" }, { id: "b", text: "Cousin" }, { id: "c", text: "Niece" }, { id: "d", text: "Aunt" }],
    correctOptionIds: ["a"],
    explanation: "My grandfather's only son is Ravi's father, so the daughter of Ravi's father is Ravi's sister.",
    marks: 4, negativeMarks: 0, topic: "Blood Relations", difficulty: "medium",
  },
];

for (let i = 0; i < questions.length; i++) {
  const { correctOptionIds, explanation, ...questionFields } = questions[i];
  const qRef = db.collection("contests").doc(contestRef.id).collection("questions").doc();
  await qRef.set({
    type: "mcq",
    ...questionFields,
    order: i,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  await db.collection("contests").doc(contestRef.id).collection("answerKeys").doc(qRef.id).set({
    correctOptionIds, correctText: "", explanation,
  });
}

await contestRef.update({ questionCount: questions.length });

console.log(`Seeded contest "DeVert Aptitude & Reasoning Challenge #1" (${contestRef.id}) with ${questions.length} question(s).`);
console.log(`Registration: ${registrationStart.toLocaleString()} - ${registrationEnd.toLocaleString()}`);
console.log(`Contest: ${contestStart.toLocaleString()} - ${contestEnd.toLocaleString()}`);
