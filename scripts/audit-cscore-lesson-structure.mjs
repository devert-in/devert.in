// Read-only progress report for the CS Core lesson rewrite: for every subject,
// how many published lessons have actually been restructured into the block
// format (## sections / ::: blocks) versus how many are still one wall of
// plain prose. Writes nothing.
//
//   node scripts/audit-cscore-lesson-structure.mjs
//
// Sorted worst-first, so the top of the output is always the next batch of
// work. Use it to confirm a rewrite batch landed, and to see what's left.

import admin from "firebase-admin";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(path.join(__dirname, "service-account.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

function isRestructured(concept) {
  return /^##[ \t]/m.test(concept) || /^:::[ \t]*[a-z]/im.test(concept);
}

const subjects = await db.collection("csCoreSubjects").get();
const rows = [];
let totals = { topics: 0, authored: 0, plain: 0, words: 0 };

for (const subject of subjects.docs) {
  const topics = await db.collection("csCoreSubjects").doc(subject.id).collection("topics").get();
  const row = { id: subject.id, status: subject.data().status, topics: topics.size, authored: 0, plain: 0, words: 0 };

  topics.docs.forEach(d => {
    const concept = d.data().concept || "";
    if (!concept.trim()) return;
    row.authored++;
    row.words += concept.trim().split(/\s+/).length;
    if (!isRestructured(concept)) row.plain++;
  });

  totals.topics += row.topics;
  totals.authored += row.authored;
  totals.plain += row.plain;
  totals.words += row.words;
  rows.push(row);
}

rows.sort((a, b) => b.plain - a.plain || b.authored - a.authored);

console.log("subject".padEnd(30) + "topics  withBody  stillPlain  words");
rows.forEach(r => console.log(
  r.id.padEnd(30) +
  String(r.topics).padStart(6) +
  String(r.authored).padStart(10) +
  String(r.plain).padStart(12) +
  String(r.words).padStart(7) +
  (r.status === "published" ? "" : `  (${r.status})`)
));

const done = totals.authored - totals.plain;
const pct = totals.authored ? Math.round((done / totals.authored) * 100) : 0;
console.log(`\n${rows.length} subjects | ${totals.topics} topics | ${totals.authored} with a lesson body`);
console.log(`restructured: ${done}/${totals.authored} (${pct}%) | still plain prose: ${totals.plain} | ${totals.words} words total`);
