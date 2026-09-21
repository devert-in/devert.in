// Seeds Aptitude Series WEEKS 7-10 (Days 37-57, Mon 7 Sep - Wed 30 Sep 2026)
// into institutions/{slug}/learningTracks/aptitude/items/{date} - see
// devert-frontend/lib/dailyLearning.js's trackPaths().
//
// ONE SCRIPT FOR FOUR WEEKS, rather than the seed-aptitude-week6.mjs pattern
// of one script per week. Two concrete reasons, not just brevity:
//   1. week6's script hard-asserts WEEK6_DAYS.length === 6. Week 10 here is a
//      deliberate THREE-day week (Mon 28 - Wed 30 Sep; its Thu/Fri/Sat fall in
//      October and were out of scope), so that assert would have to be special-
//      cased anyway. This script validates each week against its own expected
//      length instead.
//   2. All four weeks were authored in one pass on 2026-09-21 and are seeded
//      together; four near-identical 90-line scripts would be four places to
//      fix the same bug.
// It keeps every safety property of the week6 script: full structural
// validation BEFORE any write, refusal to write anything if any day fails, and
// an explicit skip (never an overwrite) for a date that already exists.
//
// WEEKS 7 and 8 BACKFILL A GAP. The aptitude track's last live item was
// 2026-09-05 (Day 36); nothing was seeded for 09-07 or 09-14. Days completed
// after their own date still record completion and count toward progress and
// streak history but earn NO XP/coins (lib/dailyLearning.js's late-completion
// rule), so weeks 7-8 are continuity/archive content. Weeks 9-10 are the
// current, earnable ones.
//
// Usage:
//   node scripts/seed-aptitude-weeks7-10.mjs --dry-run [--slug=mrcet] [--week=9]
//   node scripts/seed-aptitude-weeks7-10.mjs [--slug=mrcet] [--week=9]
//
//   --dry-run   validate and report, write nothing
//   --week=N    seed only week N (7, 8, 9 or 10); omit for all four

import admin from "firebase-admin";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

import { WEEK7_DAYS } from "./aptitude-series-content/week7.mjs";
import { WEEK8_DAYS } from "./aptitude-series-content/week8.mjs";
import { WEEK9_DAYS } from "./aptitude-series-content/week9.mjs";
import { WEEK10_DAYS } from "./aptitude-series-content/week10.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const slugArg = args.find(a => a.startsWith("--slug="));
const SLUG = slugArg ? slugArg.split("=")[1] : "mrcet";
const weekArg = args.find(a => a.startsWith("--week="));
const ONLY_WEEK = weekArg ? Number(weekArg.split("=")[1]) : null;

// expectedLength is asserted per week - week 10 is intentionally 3, not 6.
const WEEKS = [
  { week: 7,  days: WEEK7_DAYS,  weekId: "2026-09-07", expectedLength: 6, topic: "Number Theory & the Algebra Toolkit" },
  { week: 8,  days: WEEK8_DAYS,  weekId: "2026-09-14", expectedLength: 6, topic: "Geometry & Mensuration" },
  { week: 9,  days: WEEK9_DAYS,  weekId: "2026-09-21", expectedLength: 6, topic: "Advanced Reasoning" },
  { week: 10, days: WEEK10_DAYS, weekId: "2026-09-28", expectedLength: 3, topic: "Verbal Ability (partial - month end)" },
].filter(w => ONLY_WEEK === null || w.week === ONLY_WEEK);

if (WEEKS.length === 0) {
  console.error(`--week=${ONLY_WEEK} matched no week. Valid values are 7, 8, 9, 10.`);
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(join(__dirname, "service-account.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// ---------------------------------------------------------------------------
// Structural validation - the same checks seed-aptitude-week6.mjs runs, plus a
// cross-week duplicate-date check, run over every selected week before any
// write happens anywhere.
// ---------------------------------------------------------------------------
let problems = 0;
const seenDates = new Set();

for (const { week, days, weekId, expectedLength } of WEEKS) {
  if (days.length !== expectedLength) {
    console.error(`Week ${week}: expected exactly ${expectedLength} days, found ${days.length}. Aborting.`);
    problems++;
  }
  for (const day of days) {
    const label = `w${week} ${day.date} (${day.title})`;
    if (seenDates.has(day.date)) { console.error(`DUPLICATE DATE across weeks: ${label}`); problems++; }
    seenDates.add(day.date);

    if (day.weekId !== weekId) {
      console.error(`${label}: weekId is "${day.weekId}", expected "${weekId}"`);
      problems++;
    }
    for (const f of ["date", "dow", "type", "title", "concept", "mcqs", "timedQuiz", "xpReward", "coinReward", "status"]) {
      if (day[f] === undefined) { console.error(`${label}: missing field ${f}`); problems++; }
    }
    if (day.status !== "published") { console.error(`${label}: status is "${day.status}", expected "published"`); problems++; }

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
      if (!q.text || !q.explanation) { console.error(`${label}: mcq ${q.id} missing text or explanation`); problems++; }
      if (new Set(q.options).size !== (q.options || []).length) { console.error(`${label}: mcq ${q.id} has duplicate options`); problems++; }
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
}

if (problems > 0) {
  console.error(`\n${problems} problem(s) found - refusing to write anything. Fix the content files and rerun.`);
  process.exit(1);
}

const totalDays = WEEKS.reduce((n, w) => n + w.days.length, 0);
console.log(`All ${totalDays} days across ${WEEKS.length} week(s) pass structural checks.`);
console.log(DRY_RUN ? "Dry run - no writes.\n" : `Writing to institutions/${SLUG}/learningTracks/aptitude/items/...\n`);

async function main() {
  const col = db.collection("institutions").doc(SLUG)
    .collection("learningTracks").doc("aptitude").collection("items");

  let created = 0, skipped = 0;
  for (const { week, days, topic } of WEEKS) {
    console.log(`--- Week ${week}: ${topic} (${days.length} days) ---`);
    for (const day of days) {
      const existing = await col.doc(day.date).get();
      if (existing.exists) {
        console.log(`  SKIP   ${day.date} - already exists: "${existing.data().title}"`);
        skipped++;
        continue;
      }
      console.log(`  ${DRY_RUN ? "would write" : "writing"} ${day.date} [${day.dow}] ${day.title}`);
      console.log(`         mcqs=${day.mcqs.length} xp=${day.xpReward} coins=${day.coinReward} concept=${day.concept.length} chars`);
      if (!DRY_RUN) await col.doc(day.date).set(day);
      created++;
    }
  }

  console.log(`\n${DRY_RUN ? "would create" : "created"}: ${created}   skipped (already present): ${skipped}`);
  if (DRY_RUN) console.log("\ndry run - re-run without --dry-run to apply");
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
