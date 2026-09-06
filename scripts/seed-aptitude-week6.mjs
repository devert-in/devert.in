// Seeds Aptitude Series WEEK 6 (Days 31-36, Mon 31 Aug - Sat 5 Sep 2026) into
// institutions/{slug}/learningTracks/aptitude/items/{date} - see
// devert-frontend/lib/dailyLearning.js's trackPaths(). A standalone script,
// not folded into seed-aptitude-series.mjs: that script bundles weeks 1-5 as
// one fixed 30-day unit (it hard-asserts ALL_DAYS.length === 30) and unions
// them with `.set()` with no existence check, so blindly adding a 6th week's
// import to it would risk re-writing the already-live 30 days. This script
// only ever touches the 6 NEW dates below, and (unlike that one) explicitly
// skips a date that already exists rather than overwriting it.
//
// Usage:
//   node scripts/seed-aptitude-week6.mjs --dry-run [--slug=mrcet]
//   node scripts/seed-aptitude-week6.mjs [--slug=mrcet]

import admin from "firebase-admin";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

import { WEEK6_DAYS } from "./aptitude-series-content/week6.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const slugArg = args.find(a => a.startsWith("--slug="));
const SLUG = slugArg ? slugArg.split("=")[1] : "mrcet";

const serviceAccount = JSON.parse(readFileSync(join(__dirname, "service-account.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

if (WEEK6_DAYS.length !== 6) {
  console.error(`Expected exactly 6 days for week 6, found ${WEEK6_DAYS.length}. Aborting.`);
  process.exit(1);
}

// Same structural checks seed-aptitude-series.mjs runs before any write.
let problems = 0;
const seenDates = new Set();
for (const day of WEEK6_DAYS) {
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
  console.error(`\n${problems} problem(s) found - refusing to write anything. Fix the content file and rerun.`);
  process.exit(1);
}

console.log(`All 6 days pass structural checks. ${DRY_RUN ? "Dry run - no writes." : `Writing to institutions/${SLUG}/learningTracks/aptitude/items/...`}\n`);

async function main() {
  const col = db.collection("institutions").doc(SLUG).collection("learningTracks").doc("aptitude").collection("items");
  let created = 0, skipped = 0;
  for (const day of WEEK6_DAYS) {
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
  console.log(`\n${DRY_RUN ? "would create" : "created"}: ${created}   skipped (already present): ${skipped}`);
  if (DRY_RUN) console.log("\ndry run - re-run without --dry-run to apply");
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
