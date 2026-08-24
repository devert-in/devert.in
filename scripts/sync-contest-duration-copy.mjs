// Makes a contest's student-facing COPY agree with its actual durationMinutes.
//
// Both 09 Aug papers were reduced to 60 minutes, but their description and rules
// still advertised the original 75 (III Year) and 90 (IV Year). A student reads
// the rules, plans a 90-minute paper, and is submitted at 60 - which is the kind
// of contradiction that turns into a complaint about the platform rather than a
// typo.
//
// Only DURATION phrasing is rewritten. The "A photo is captured every 5 minutes"
// line is a different number entirely (proctorSnapshotSeconds) and is left
// untouched - a blanket number swap would silently claim photos every 60 minutes.
//
//   node scripts/sync-contest-duration-copy.mjs            # dry run
//   node scripts/sync-contest-duration-copy.mjs --apply

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
const CONTESTS = ["705UBMMcxDjL3SjguGSL", "yVBx52sUzizUga2nKKGC"];

// Anchored on the word "minute(s)" preceded by a duration-bearing phrase, so the
// snapshot-cadence sentence ("every 5 minutes") can never match.
function retime(text, mins) {
  if (typeof text !== "string") return text;
  return text
    .replace(/\b\d+\s*-\s*minute\b/gi, `${mins}-minute`)
    .replace(/\bDuration:\s*\d+\s*minutes\b/gi, `Duration: ${mins} minutes`)
    .replace(/\b\d+\s*minutes\s+from the moment you (start|press start)\b/gi, `${mins} minutes from the moment you $1`);
}

const backup = [];

for (const id of CONTESTS) {
  const ref = db.collection("contests").doc(id);
  const snap = await ref.get();
  if (!snap.exists) continue;
  const c = snap.data();
  const mins = c.durationMinutes || 60;

  const newDesc = retime(c.description, mins);
  const newRules = Array.isArray(c.rules) ? c.rules.map(r => retime(r, mins)) : retime(c.rules, mins);

  const descChanged = newDesc !== c.description;
  const rulesChanged = JSON.stringify(newRules) !== JSON.stringify(c.rules);

  console.log(`\n=== ${c.title}`);
  console.log(`    durationMinutes = ${mins}`);
  if (!descChanged && !rulesChanged) { console.log("    copy already agrees - nothing to do"); continue; }

  if (descChanged) {
    console.log(`    description: ${(c.description.match(/\b\d+\s*-\s*minute\b/i) || ["?"])[0]} -> ${mins}-minute`);
  }
  if (rulesChanged) {
    const before = (Array.isArray(c.rules) ? c.rules : [c.rules]).find(r => /Duration:/i.test(r));
    const after = (Array.isArray(newRules) ? newRules : [newRules]).find(r => /Duration:/i.test(r));
    console.log(`    rules:  ${String(before).slice(0, 60)}...`);
    console.log(`      ->    ${String(after).slice(0, 60)}...`);
  }
  // Confirms the cadence sentence survived untouched.
  const cadence = (Array.isArray(newRules) ? newRules.join(" ") : String(newRules)).match(/every\s*\d+\s*minutes/i);
  console.log(`    photo cadence line preserved: ${cadence ? cadence[0] : "(none found)"}`);

  backup.push({ contestId: id, description: c.description, rules: c.rules });
  if (APPLY) await ref.update({ description: newDesc, rules: newRules });
}

if (backup.length) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const f = join(__dirname, `contest-copy-backup-${stamp}.json`);
  writeFileSync(f, JSON.stringify(backup, null, 2));
  console.log(`\nbackup: ${f}`);
}
console.log(`\n${APPLY ? "UPDATED" : "would update"}: ${backup.length} contest(s)`);
if (!APPLY) console.log("dry run - re-run with --apply");
process.exit(0);
