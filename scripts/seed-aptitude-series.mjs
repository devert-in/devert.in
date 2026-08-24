// Seeds the 30-Day Aptitude Series into the new multi-track Daily Learning
// subtree: institutions/{slug}/learningTracks/aptitude/items/{date} (see
// devert-frontend/lib/dailyLearning.js's trackPaths()). Deliberately NOT
// institutions/{slug}/dailyLearning - that collection is DSA's own, and
// this track lives in its own namespaced subtree specifically so it can
// never collide with a DSA item on the same calendar date.
//
// Usage:
//   node scripts/seed-aptitude-series.mjs --dry-run [--slug=mrcet]
//   node scripts/seed-aptitude-series.mjs [--slug=mrcet]
//
// Content lives in scripts/aptitude-series-content/week{1..5}.mjs, one file
// per week, each exporting WEEK{N}_DAYS - an array of day objects already in
// the exact Firestore document shape (see any of those files' own header).

import admin from "firebase-admin";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

import { WEEK1_DAYS } from "./aptitude-series-content/week1.mjs";
import { WEEK2_DAYS } from "./aptitude-series-content/week2.mjs";
import { WEEK3_DAYS } from "./aptitude-series-content/week3.mjs";
import { WEEK4_DAYS } from "./aptitude-series-content/week4.mjs";
import { WEEK5_DAYS } from "./aptitude-series-content/week5.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const slugArg = args.find(a => a.startsWith("--slug="));
const SLUG = slugArg ? slugArg.split("=")[1] : "mrcet";

const serviceAccount = JSON.parse(readFileSync(join(__dirname, "service-account.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const ALL_DAYS = [...WEEK1_DAYS, ...WEEK2_DAYS, ...WEEK3_DAYS, ...WEEK4_DAYS, ...WEEK5_DAYS];

if (ALL_DAYS.length !== 30) {
  console.error(`Expected exactly 30 days across all 5 weeks, found ${ALL_DAYS.length}. Aborting.`);
  process.exit(1);
}

// Structural sanity before any write - the same class of check
// verify-aptitude-series-content.mjs re-runs read-only after seeding.
let problems = 0;
const seenDates = new Set();
for (const day of ALL_DAYS) {
  const label = `${day.date} (${day.title})`;
  if (seenDates.has(day.date)) { console.error(`DUPLICATE DATE: ${label}`); problems++; }
  seenDates.add(day.date);
  if (!Array.isArray(day.mcqs) || day.mcqs.length < 10 || day.mcqs.length > 15) {
    console.error(`${label}: expected 10-15 mcqs, found ${day.mcqs?.length ?? 0}`);
    problems++;
  }
  const mcqIds = new Set((day.mcqs || []).map(q => q.id));
  if (mcqIds.size !== (day.mcqs || []).length) { console.error(`${label}: duplicate mcq ids`); problems++; }
  (day.mcqs || []).forEach(q => {
    if (typeof q.correctIndex !== "number" || q.correctIndex < 0 || q.correctIndex >= (q.options || []).length) {
      console.error(`${label}: mcq ${q.id} has an out-of-range correctIndex`);
      problems++;
    }
  });
  if (!day.timedQuiz || !Array.isArray(day.timedQuiz.mcqIds) || day.timedQuiz.mcqIds.length !== 5) {
    console.error(`${label}: timedQuiz.mcqIds must have exactly 5 entries`);
    problems++;
  } else if (!day.timedQuiz.mcqIds.every(id => mcqIds.has(id))) {
    console.error(`${label}: timedQuiz.mcqIds references an id not present in this day's own mcqs`);
    problems++;
  }
  const opens = (day.concept.match(/^:::[ \t]*[a-zA-Z]/gm) || []).length;
  const closes = (day.concept.match(/^:::[ \t]*$/gm) || []).length;
  if (opens !== closes) { console.error(`${label}: unbalanced ::: fences (${opens} open, ${closes} close)`); problems++; }
}
if (problems > 0) {
  console.error(`\n${problems} problem(s) found - refusing to write anything. Fix the content files and rerun.`);
  process.exit(1);
}

console.log(`All 30 days pass structural checks. ${DRY_RUN ? "Dry run - no writes." : `Writing to institutions/${SLUG}/learningTracks/aptitude/items/...`}\n`);

for (const day of ALL_DAYS) {
  console.log(`${DRY_RUN ? "[dry-run] would write" : "writing"} ${day.date} - ${day.title}`);
  if (DRY_RUN) continue;
  await db.doc(`institutions/${SLUG}/learningTracks/aptitude/items/${day.date}`).set(day);
}

console.log(`\nDone. ${ALL_DAYS.length} days ${DRY_RUN ? "validated" : "seeded"}.`);
