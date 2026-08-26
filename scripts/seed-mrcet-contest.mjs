import admin from "firebase-admin";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(join(__dirname, "service-account.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// A small, institution-scoped contest for MRCET - mirrors seed-sample-contest.mjs
// exactly, with the one addition (institutionId) that scopes it to that college
// only (see firestore.rules' isApprovedForContest()). Registration is open now,
// contest starts in 10 minutes and runs for 20 - short enough to actually attempt
// and see graded results today, not something that sits "upcoming" for a week.
const registrationStart = new Date();
const registrationEnd   = new Date(registrationStart.getTime() + 24 * 60 * 60 * 1000); // +1 day
const contestStart      = new Date(registrationStart.getTime() + 10 * 60 * 1000);       // +10 min
const contestEnd        = new Date(contestStart.getTime() + 20 * 60 * 1000);            // +20 min after start

const TITLE = "MRCET Weekly Aptitude Sprint";

const existing = await db.collection("contests").where("title", "==", TITLE).where("institutionId", "==", "mrcet").get();
if (!existing.empty) {
  console.log(`"${TITLE}" already exists for mrcet (${existing.docs[0].id}) - skipping creation.`);
  process.exit(0);
}

const contestRef = await db.collection("contests").add({
  title: TITLE,
  category: "Aptitude & Reasoning",
  difficulty: "Easy",
  bannerUrl: "",
  description: "A short 5-question aptitude sprint, open only to MRCET's own approved students. Quick warm-up for placement prep.",
  rules: "- Duration: 20 minutes\n- One attempt per participant\n- No external help allowed\n- Negative marking: No\n- Results published immediately after the contest ends.",
  eligibility: "Open to all approved MRCET students",
  organizer: "MRCET Training & Placement Cell",
  tags: ["Aptitude", "Placement Prep", "MRCET"],
  status: "published",
  institutionId: "mrcet",
  registrationStart, registrationEnd, contestStart, contestEnd,
  durationMinutes: 20,
  prizeXp: 100,
  prizeCoins: 50,
  prizeText: "Top scorer badge - 100 XP - 50 Coins",
  participantCount: 0,
  questionCount: 0,
  createdAt: admin.firestore.FieldValue.serverTimestamp(),
  createdBy: "devert.contact@gmail.com",
});

const questions = [
  {
    question: "What is 25% of 160?",
    options: [{ id: "a", text: "35" }, { id: "b", text: "40" }, { id: "c", text: "45" }, { id: "d", text: "50" }],
    correctOptionIds: ["b"],
    explanation: "25% of 160 = (25/100) * 160 = 40.",
    marks: 4, negativeMarks: 0, topic: "Percentages", difficulty: "easy",
  },
  {
    question: "Find the next number in the series: 3, 6, 11, 18, 27, ?",
    options: [{ id: "a", text: "36" }, { id: "b", text: "38" }, { id: "c", text: "40" }, { id: "d", text: "42" }],
    correctOptionIds: ["b"],
    explanation: "Differences are 3, 5, 7, 9, 11 (odd numbers), so 27 + 11 = 38.",
    marks: 4, negativeMarks: 0, topic: "Number Series", difficulty: "easy",
  },
  {
    question: "A car covers 120 km in 2 hours. What is its speed in km/h?",
    options: [{ id: "a", text: "50" }, { id: "b", text: "55" }, { id: "c", text: "60" }, { id: "d", text: "65" }],
    correctOptionIds: ["c"],
    explanation: "Speed = distance / time = 120 km / 2 h = 60 km/h.",
    marks: 4, negativeMarks: 0, topic: "Time, Speed & Distance", difficulty: "easy",
  },
  {
    question: "Choose the word most similar in meaning to 'Candid'.",
    options: [{ id: "a", text: "Secretive" }, { id: "b", text: "Frank" }, { id: "c", text: "Hostile" }, { id: "d", text: "Timid" }],
    correctOptionIds: ["b"],
    explanation: "'Candid' means truthful and straightforward - closest to 'Frank'.",
    marks: 4, negativeMarks: 0, topic: "Vocabulary", difficulty: "easy",
  },
  {
    question: "Pointing to a man, Sonia said, 'His mother is the only daughter of my mother.' How is Sonia related to the man?",
    options: [{ id: "a", text: "Mother" }, { id: "b", text: "Sister" }, { id: "c", text: "Aunt" }, { id: "d", text: "Grandmother" }],
    correctOptionIds: ["a"],
    explanation: "The only daughter of Sonia's mother is Sonia herself, so the man's mother is Sonia - Sonia is the man's mother.",
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

console.log(`Seeded contest "${TITLE}" (${contestRef.id}) for institution "mrcet" with ${questions.length} question(s).`);
console.log(`Registration: ${registrationStart.toLocaleString()} - ${registrationEnd.toLocaleString()}`);
console.log(`Contest: ${contestStart.toLocaleString()} - ${contestEnd.toLocaleString()}`);
