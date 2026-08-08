// LIVE INCIDENT REMEDY: remove PHANTOM contest submissions so affected students
// can attempt again.
//
// A phantom submission is one that contains no student work at all. The attempt
// view refuses to open if ANY submission doc exists for that uid
// (fetchMySubmission -> "You've already submitted your attempt"), so an empty
// doc permanently locks a student out of a contest they never sat.
//
// THE FILTER IS DELIBERATELY PARANOID. Deleting a submission that holds real
// answers destroys a student's exam with no recovery, so all four must hold:
//   1. every value in `answers` is blank (or `answers` is absent entirely)
//   2. graded !== true                  - never touch something already scored
//   3. timeTakenSeconds is 0 or absent  - a real attempt takes non-zero time
//   4. score is absent                  - nothing has been credited
// Anything failing even one check is SKIPPED and reported, not deleted.
//
// Registrations are untouched: the student stays registered and can walk
// straight back into the paper.
//
//   node scripts/clear-empty-contest-submissions.mjs                 # dry run
//   node scripts/clear-empty-contest-submissions.mjs --apply
//   node scripts/clear-empty-contest-submissions.mjs --apply --contest <id>

import admin from "firebase-admin";
import { readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
admin.initializeApp({
  credential: admin.credential.cert(
    JSON.parse(readFileSync(join(__dirname, "service-account.json"), "utf8"))
  ),
});
const db = admin.firestore();

const APPLY = process.argv.includes("--apply");
const only = process.argv.includes("--contest") ? process.argv[process.argv.indexOf("--contest") + 1] : null;

const TARGETS = only ? [only] : [
  "705UBMMcxDjL3SjguGSL", // MRCET III Year - Stacks & Queues
  "yVBx52sUzizUga2nKKGC", // MRCET IV Year - Placement Readiness
];

function isPhantom(v) {
  const answers = v.answers || {};
  const hasWork = Object.values(answers).some(a =>
    a !== undefined && a !== null && a !== "" && !(Array.isArray(a) && a.length === 0));
  const t = v.timeTakenSeconds;
  return !hasWork
    && v.graded !== true
    && (t === 0 || t === undefined || t === null)
    && (v.score === undefined || v.score === null);
}

const backup = [];
let deleted = 0, skipped = 0;

for (const contestId of TARGETS) {
  const ref = db.collection("contests").doc(contestId);
  const c = await ref.get();
  if (!c.exists) { console.log(`contest ${contestId} not found`); continue; }
  const subs = await ref.collection("submissions").get();

  console.log(`\n=== ${c.data().title}`);
  console.log(`    submissions: ${subs.size}`);

  for (const s of subs.docs) {
    const v = s.data();
    if (!isPhantom(v)) {
      skipped++;
      const answered = Object.values(v.answers || {}).filter(a => a !== undefined && a !== null && a !== "").length;
      console.log(`    KEEP  ${s.id.slice(0, 12)}..  answered=${answered} time=${v.timeTakenSeconds}s graded=${v.graded} score=${v.score}`);
      continue;
    }
    // Full copy retained before any delete, so this is reversible.
    backup.push({ contestId, uid: s.id, data: JSON.parse(JSON.stringify(v)) });
    if (APPLY) await s.ref.delete();
    deleted++;
  }
}

if (backup.length) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const file = join(__dirname, `phantom-submissions-backup-${stamp}.json`);
  writeFileSync(file, JSON.stringify(backup, null, 2));
  console.log(`\nbackup written: ${file}`);
}

console.log(`\n${APPLY ? "DELETED" : "would delete"}: ${deleted} phantom submission(s)`);
console.log(`kept (had real work / graded / scored): ${skipped}`);
if (!APPLY) console.log("\ndry run - re-run with --apply to actually delete");
process.exit(0);
