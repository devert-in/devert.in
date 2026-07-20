import admin from "firebase-admin";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(join(__dirname, "service-account.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// DSA-450-sheet ingestion, BIT MANIPULATION topic - part 2. The original
// seed-dsa-bit-manipulation-problems.mjs covered 9 of the sheet's 10 rows
// (skipping "Power Set" as a duplicate of the already-seeded "Print All
// Distinct Subsequences of a String") but missed "Copy set bits in a
// range" entirely. This script fills that one remaining gap.

const REWARD = { Easy: [30, 10], Medium: [50, 20], Hard: [80, 30] };
function p(title, category, difficulty, tags, statement, constraints, examplesText, hints, sampleTests, hiddenTests) {
  const [xpReward, coinReward] = REWARD[difficulty];
  return { title, category, difficulty, tags, statement, constraints, examplesText, hints, xpReward, coinReward, sampleTests, hiddenTests };
}

const PROBLEMS = [

p("Copy Set Bits in a Range", "Bit Manipulation", "Easy", ["Bit Manipulation"],
  "Given two non-negative integers m and n, and a range [l, r] (1-indexed, counting bit positions from the least significant bit as position 1), copy every set bit of n that falls within positions l to r (inclusive) into m at those same positions. Bits of m outside the range are left untouched, and bits inside the range where n's corresponding bit is 0 are also left untouched (only 1s are ever copied in, never cleared). Print the resulting value of m.",
  "0 <= m, n <= 10^9\n1 <= l <= r <= 30",
  "Input:\n10\n13\n2\n3\nOutput:\n14",
  ["Build a mask that has 1s exactly at bit positions l through r (inclusive) and 0s everywhere else: mask = ((1 << (r - l + 1)) - 1) << (l - 1).",
   "AND that mask with n to isolate only n's set bits inside the range - every bit outside [l, r] becomes 0 in the result, regardless of what n had there.",
   "OR the isolated bits into m. OR-ing never clears a bit, so anything already set in m (inside or outside the range) stays set, and only the new 1s pulled from n's masked bits get added on top."],
  [{ input: "10\n13\n2\n3", expectedOutput: "14", explanation: "10 = 1010, 13 = 1101. Copying bits 2-3 of 13 (which are 0 and 1) into 10 gives 1110 = 14." },
   { input: "0\n255\n1\n4", expectedOutput: "15", explanation: "255 has all of bits 1-4 set, so copying them into 0 gives 1111 = 15." }],
  [{ input: "5\n0\n1\n3", expectedOutput: "5", points: 1 },
   { input: "0\n0\n1\n1", expectedOutput: "0", points: 1 },
   { input: "1000000000\n536870911\n25\n30", expectedOutput: "1067108864", points: 1 }]),

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
console.log(`BIT MANIPULATION topic (part 2): created ${created} problem(s), skipped ${skipped} already-existing.`);
