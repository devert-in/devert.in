import admin from "firebase-admin";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(join(__dirname, "service-account.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const existing = await db.collection("aptitude_topics").where("name", "==", "Percentages").get();
if (!existing.empty) {
  console.log("Percentages topic already exists, skipping seed.");
  process.exit(0);
}

const topicRef = await db.collection("aptitude_topics").add({
  category: "Quantitative",
  name: "Percentages",
  description: "Core percentage calculations, increases/decreases, and percentage-of-percentage problems - a foundation topic for almost every other quant chapter.",
  status: "published",
  order: 0,
  createdAt: admin.firestore.FieldValue.serverTimestamp(),
});

const questions = [
  {
    question: "What is 25% of 480?",
    options: ["100", "120", "110", "140"],
    correctIndex: 1,
    explanation: "25% = 1/4. 480 / 4 = 120.",
    videoUrl: "",
    difficulty: "easy",
  },
  {
    question: "A shopkeeper marks up an item by 40% above cost price, then offers a 20% discount on the marked price. What is his overall profit percentage?",
    options: ["12%", "20%", "8%", "16%"],
    correctIndex: 0,
    explanation: "Let cost price = 100. Marked price = 100 + 40% = 140. Selling price after 20% discount on 140 = 140 - 28 = 112. Profit = 112 - 100 = 12, so profit % = 12%.",
    videoUrl: "",
    difficulty: "medium",
  },
  {
    question: "If the price of an item is first increased by 20% and then decreased by 20%, what is the net percentage change?",
    options: ["No change", "4% decrease", "4% increase", "2% decrease"],
    correctIndex: 1,
    explanation: "Let price = 100. After +20%: 120. After -20% on 120: 120 - 24 = 96. Net change = 96 - 100 = -4, i.e. a 4% decrease. A rule of thumb: successive changes of +x% and -x% always result in a net decrease of x^2/100 percent.",
    videoUrl: "",
    difficulty: "medium",
  },
  {
    question: "In an election between two candidates, the winner got 60% of the total valid votes and won by 4,800 votes. What was the total number of valid votes?",
    options: ["20,000", "24,000", "18,000", "22,000"],
    correctIndex: 1,
    explanation: "Winner = 60%, loser = 40%, so the margin is 20% of total valid votes. 20% of total = 4800, so total = 4800 / 0.20 = 24,000.",
    videoUrl: "",
    difficulty: "hard",
  },
  {
    question: "35% of a number is 105. What is 60% of the same number?",
    options: ["150", "160", "180", "170"],
    correctIndex: 2,
    explanation: "35% of N = 105, so N = 105 / 0.35 = 300. 60% of 300 = 180.",
    videoUrl: "",
    difficulty: "easy",
  },
];

for (let i = 0; i < questions.length; i++) {
  await db.collection("aptitude_topics").doc(topicRef.id).collection("questions").add({
    ...questions[i],
    order: i,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

console.log(`Seeded topic "Percentages" (${topicRef.id}) with ${questions.length} question(s).`);
