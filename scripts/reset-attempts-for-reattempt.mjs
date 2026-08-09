// AUTHORISED RESET: clears REAL submissions so those students can sit the paper
// again after a postponement.
//
// This is deliberately a different script from
// clear-empty-contest-submissions.mjs, which only ever removes empty phantom
// docs and refuses to touch anything containing work. This one removes
// submissions that DO contain answers, which is destructive to real student
// work, so it is opt-in per contest, never runs on a wildcard, and backs
// everything up first - including the codingResults subcollection, which
// Firestore does not cascade and which holds the only record of a graded code
// run.
//
// Context: the 09 Aug papers were postponed mid-run. A handful of students had
// already submitted the MCQ half before it was pulled. Any existing submission
// doc blocks re-entry (fetchMySubmission), so leaving them in place would bar
// exactly those students from the real sitting while their classmates attempt.
//
//   node scripts/reset-attempts-for-reattempt.mjs                 # dry run
//   node scripts/reset-attempts-for-reattempt.mjs --apply

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
const INSTITUTION_ID = "mrcet";

// Explicit list. No wildcard over every contest - a mistake here is unrecoverable
// for the student, so the blast radius is named rather than discovered.
const CONTESTS = [
  "705UBMMcxDjL3SjguGSL", // MRCET III Year - Stacks & Queues
  "yVBx52sUzizUga2nKKGC", // MRCET IV Year - Placement Readiness
];

// Roll numbers, so the affected students can actually be told their attempt was
// reset rather than discovering it themselves.
const roster = new Map();
const students = await db.collection("institutions").doc(INSTITUTION_ID).collection("students").get();
students.docs.forEach(d => roster.set(d.id, {
  roll: d.data().rollNumber, name: d.data().displayName || d.data().name || "",
}));

const backup = [];
let removed = 0;

for (const contestId of CONTESTS) {
  const ref = db.collection("contests").doc(contestId);
  const c = await ref.get();
  if (!c.exists) continue;
  const subs = await ref.collection("submissions").get();

  console.log(`\n=== ${c.data().title}`);
  console.log(`    submissions: ${subs.size}`);

  for (const s of subs.docs) {
    const v = s.data();
    const answered = Object.values(v.answers || {})
      .filter(a => a !== undefined && a !== null && a !== "" && !(Array.isArray(a) && a.length === 0)).length;
    const who = roster.get(s.id) || {};

    // codingResults is a subcollection - it does NOT go with the parent delete,
    // so it is captured and removed explicitly or it orphans under a deleted id
    // and would be silently re-joined to a fresh attempt tomorrow.
    const cr = await s.ref.collection("codingResults").get();

    backup.push({
      contestId, uid: s.id, rollNumber: who.roll || null, name: who.name || null,
      submission: JSON.parse(JSON.stringify(v)),
      codingResults: cr.docs.map(d => ({ id: d.id, data: JSON.parse(JSON.stringify(d.data())) })),
    });

    console.log(`    reset  ${who.roll || s.id}  ${who.name || ""}  answered=${answered}  time=${v.timeTakenSeconds}s  codingResults=${cr.size}`);

    if (APPLY) {
      for (const d of cr.docs) await d.ref.delete();
      await s.ref.delete();
    }
    removed++;
  }
}

if (backup.length) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const f = join(__dirname, `reset-attempts-backup-${stamp}.json`);
  writeFileSync(f, JSON.stringify(backup, null, 2));
  console.log(`\nFULL BACKUP (answers + codingResults): ${f}`);
}

console.log(`\n${APPLY ? "RESET" : "would reset"}: ${removed} submission(s)`);
console.log("Registrations are untouched - every student stays registered and can re-enter.");
if (!APPLY) console.log("\ndry run - re-run with --apply");
process.exit(0);
