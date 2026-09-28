// Loads the GATE 2027 cohort plan produced by scripts/extract-gate-plan.mjs
// into Firestore. Content only - it never touches a request or a member's
// progress.
//
// Usage:
//   node scripts/import-gate-plan.mjs              # dry run, writes nothing
//   node scripts/import-gate-plan.mjs --apply
//
// WHAT IT WRITES
//
//   gate_plan_days/{day}         one document per day (0..95): the full day
//                                card - cover, must-know, formula groups,
//                                lecture/PYQ/evening/GA links. MEMBERS ONLY
//                                (firestore.rules: isGatePlanMember()).
//
//   gate_plan_content/formulas   the workbook's 523-row Formula Bank, one doc.
//   gate_plan_content/resources  lecture channels + PYQ sources.
//                                Both MEMBERS ONLY, same rule as the days.
//
//   gate_plan_meta/index         ONE public document: a 96-entry outline
//                                (subject, topic, paper, type, GA theme) that
//                                the landing page and the journey grid draw.
//                                Public on purpose - a student deciding whether
//                                to request a seat should see WHAT the plan
//                                covers; what they are requesting is the daily
//                                material and the tracker. Derived, never
//                                authored: re-running this rebuilds it.
//
// It does NOT write gate_plan_meta/settings (requestsOpen, the cohort notice) -
// that is the admin console's, and a re-import must never reopen requests the
// admin closed.
//
// SAFE TO RE-RUN. Content documents are written with merge:false so a re-import
// is a clean replacement. Requests and members live in other collections and
// are never read or written here, so re-importing cannot cost anyone a log.

import { readFileSync } from "fs";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const APPLY = process.argv.slice(2).includes("--apply");
const IN = "scripts/data/gate-plan.json";
const payload = JSON.parse(readFileSync(IN, "utf8"));
const { days, formulas, resources, counts, start } = payload;

if (!Array.isArray(days) || days.length !== 96) {
  console.error(`FAILED: ${IN} holds ${days?.length} days, expected 96. Re-run scripts/extract-gate-plan.mjs.`);
  process.exit(1);
}
// Guard against importing a sheet re-extracted against a moved calendar.
if (start !== "2026-09-27") {
  console.error(`FAILED: ${IN} was extracted with start=${start}; lib/gatePlan.js's GATE_PLAN_START is 2026-09-27.`);
  process.exit(1);
}

// Exactly what a journey-grid card and the landing outline render - adding a
// field here grows a document read on every landing-page load.
function indexEntry(d) {
  return {
    day: d.day, week: d.week, subject: d.subject, topic: d.topic,
    paper: d.paper, type: d.type, ga: d.ga?.theme || "",
    compiler: d.evening?.kind === "compiler",
  };
}

const index = days.map(indexEntry);
const size = (o) => Buffer.byteLength(JSON.stringify(o));

console.log(`${APPLY ? "APPLY" : "DRY RUN"} - ${IN}`);
console.log(`  counts: ${JSON.stringify(counts)}`);
console.log(`  gate_plan_meta/index       ${(size(index) / 1024).toFixed(1)} KB`);
console.log(`  gate_plan_content/formulas ${(size(formulas) / 1024).toFixed(1)} KB (${formulas.length} rows)`);
console.log(`  gate_plan_content/resources ${(size(resources) / 1024).toFixed(1)} KB`);
const biggest = days.reduce((m, d) => (size(d) > size(m) ? d : m), days[0]);
console.log(`  largest day doc: D${biggest.day} ${(size(biggest) / 1024).toFixed(1)} KB`);

// Firestore's hard cap is 1 MiB per document; stop well short of it.
for (const [name, obj] of [["formulas", formulas], ["resources", resources], ["index", index]]) {
  if (size(obj) > 900 * 1024) { console.error(`FAILED: ${name} is too close to Firestore's 1 MiB document limit.`); process.exit(1); }
}

if (!APPLY) {
  console.log("\nNothing written. Re-run with --apply to load it.");
  process.exit(0);
}

initializeApp({ credential: cert(JSON.parse(readFileSync("scripts/service-account.json", "utf8"))) });
const db = getFirestore();

// 96 + 3 writes fits in one batch (limit 500).
const batch = db.batch();
for (const d of days) batch.set(db.collection("gate_plan_days").doc(String(d.day)), { ...d, importedAt: FieldValue.serverTimestamp() });
batch.set(db.collection("gate_plan_content").doc("formulas"), { rows: formulas, count: formulas.length, importedAt: FieldValue.serverTimestamp() });
batch.set(db.collection("gate_plan_content").doc("resources"), { ...resources, importedAt: FieldValue.serverTimestamp() });
batch.set(db.collection("gate_plan_meta").doc("index"), { days: index, counts, importedAt: FieldValue.serverTimestamp() });
await batch.commit();

console.log(`\nWrote ${days.length} day documents, the formula bank, resources and the public index.`);
