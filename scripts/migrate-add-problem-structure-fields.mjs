// One-time content migration: adds `inputFormat` / `outputFormat` /
// `edgeCases` to every `problems/{id}` doc. Purely additive - never touches
// `statement`, `constraints`, `examplesText`, `hints`, `solutions`, or any
// grading-relevant field (sampleTests/hiddenTests subcollections are never
// read or written by this script). A problem with none of these three
// fields renders exactly as it did before (see campus-practice.jsx's
// CampusProblemView - each section only renders when present).
//
// The content itself was drafted by 10 parallel content-drafting passes,
// each grounded strictly in that problem's own real statement/constraints/
// examplesText (never inventing new constraints, companies, or contradicting
// the given example) - spot-checked by hand against the source problems
// before this script was run. See docs/BACKLOG.md for what's deliberately
// NOT covered by this pass (learning progression, related problems,
// difficulty recalibration, library expansion).
//
// Usage:
//   node scripts/migrate-add-problem-structure-fields.mjs            (dry run)
//   node scripts/migrate-add-problem-structure-fields.mjs --execute  (apply)
import admin from "firebase-admin";
import { readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(join(__dirname, "service-account.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const EXECUTE = process.argv.includes("--execute");
const DATA_PATH = process.argv[2] && !process.argv[2].startsWith("--") ? process.argv[2] : null;
if (!DATA_PATH) {
  console.error("Usage: node scripts/migrate-add-problem-structure-fields.mjs <merged-structure.json> [--execute]");
  process.exit(1);
}

const drafted = JSON.parse(readFileSync(DATA_PATH, "utf8"));
console.log(`Loaded ${drafted.length} drafted entries from ${DATA_PATH}`);

const snap = await db.collection("problems").get();
const liveById = new Map(snap.docs.map(d => [d.id, d.data()]));
console.log(`Live problems collection has ${liveById.size} docs`);

let missing = 0, alreadySet = 0, applied = 0, skippedEmpty = 0;
const report = [];

for (const entry of drafted) {
  const live = liveById.get(entry.id);
  if (!live) { missing++; console.error(`MISSING doc for id ${entry.id} (title in draft data not available here)`); continue; }
  if (live.inputFormat || live.outputFormat || live.edgeCases) {
    // Already has at least one of these fields (e.g. an admin already filled
    // one in manually via the new editor) - never overwrite real admin work.
    alreadySet++;
    continue;
  }
  const inputFormat = (entry.inputFormat || "").trim();
  const outputFormat = (entry.outputFormat || "").trim();
  const edgeCases = (entry.edgeCases || "").trim();
  if (!inputFormat && !outputFormat && !edgeCases) { skippedEmpty++; continue; }

  report.push({ id: entry.id, title: live.title, inputFormat, outputFormat, edgeCases });
  if (EXECUTE) {
    await db.collection("problems").doc(entry.id).update({ inputFormat, outputFormat, edgeCases });
  }
  applied++;
}

console.log(`\n${EXECUTE ? "APPLIED" : "DRY RUN"}: ${applied} problems ${EXECUTE ? "updated" : "would be updated"}`);
console.log(`Skipped (already had a structure field, not overwritten): ${alreadySet}`);
console.log(`Skipped (empty drafted content): ${skippedEmpty}`);
console.log(`Missing live doc: ${missing}`);

const reportPath = join(__dirname, `problem-structure-migration-${EXECUTE ? "applied" : "dryrun"}-2026-07-29.json`);
writeFileSync(reportPath, JSON.stringify({ applied, alreadySet, skippedEmpty, missing, entries: report }, null, 2));
console.log(`Report written to ${reportPath}`);
process.exit(0);
