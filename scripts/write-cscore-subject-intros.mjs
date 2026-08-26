// Writes the SUBJECT-level introduction fields onto csCoreSubjects/{id} - the
// content behind the Overview tab on every CS Core subject screen. See
// scripts/cscore-subject-intros/index.mjs for the field contract and why this
// exists at all.
//
// Additive only. Nothing here touches name / difficulty / order / status /
// audiences / topicCount / estimatedDuration, and nothing touches the topics
// subcollection - so this can be re-run safely and cannot disturb what is
// already published. `placementRelevance` and `industryUsage` are also left
// alone: the Overview renders placementRelevance directly, so the two must not
// drift apart.
//
// Usage:
//   node scripts/write-cscore-subject-intros.mjs --dry-run
//   node scripts/write-cscore-subject-intros.mjs --dry-run --subject=dbms
//   node scripts/write-cscore-subject-intros.mjs --subject=dbms
//   node scripts/write-cscore-subject-intros.mjs                    apply everything
//
// A real write dumps the prior value of every field it is about to set to
// scripts/cscore-intro-backup-<timestamp>.json first. That file is the whole
// rollback: `null` for a field means it did not exist before this ran, so
// restoring means deleting it again.

import admin from "firebase-admin";
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";
import { SUBJECT_INTROS } from "./cscore-subject-intros/index.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const subjectArg = args.find(a => a.startsWith("--subject="));
const ONLY_SUBJECT = subjectArg ? subjectArg.split("=")[1] : null;

const serviceAccount = JSON.parse(readFileSync(path.join(__dirname, "service-account.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// Exactly the fields this script owns. Anything on the document outside this
// list is never read, written or backed up here.
const FIELDS = [
  "overview", "whyLearn", "whereUsed", "skillsGained",
  "prerequisites", "interviewImportance", "topCompanies", "interviewQuestions",
];

const ARRAY_FIELDS = new Set(["whyLearn", "whereUsed", "skillsGained", "prerequisites", "topCompanies", "interviewQuestions"]);

// interviewImportance is a 1-5 star rating, and it is a claim about the real
// world - so it is calibrated against the placementRelevance prose that was
// already authored per subject, not invented independently:
//   5  "nearly every technical interview" / "almost every company"
//   4  "most technical interviews" / a named strong differentiator
//   3  "frequently" / role-dependent but common
//   2  "mainly at companies building X" / primarily a GATE subject
//   1  reserved - no subject in this catalogue is genuinely never asked
// If that prose is ever rewritten, re-check the number with it.
function validate(subjectId, intro) {
  const errors = [];

  for (const key of Object.keys(intro)) {
    if (!FIELDS.includes(key)) errors.push(`${subjectId}: unknown field "${key}"`);
  }

  for (const f of ARRAY_FIELDS) {
    if (intro[f] === undefined) continue;
    if (!Array.isArray(intro[f])) { errors.push(`${subjectId}: ${f} must be an array`); continue; }
    if (intro[f].some(x => typeof x !== "string" || !x.trim())) errors.push(`${subjectId}: ${f} has an empty or non-string entry`);
  }

  if (intro.interviewImportance !== undefined) {
    const n = intro.interviewImportance;
    if (!Number.isInteger(n) || n < 1 || n > 5) errors.push(`${subjectId}: interviewImportance must be an integer 1-5, got ${n}`);
  }

  if (intro.overview !== undefined) {
    if (typeof intro.overview !== "string" || !intro.overview.trim()) {
      errors.push(`${subjectId}: overview must be a non-empty string`);
    } else {
      // Same refusal as rewrite-cscore-lessons.mjs: an unterminated fence still
      // renders, but swallows everything after it into one block. Always an
      // authoring bug, never intent.
      const lines = intro.overview.split("\n");
      const opens = lines.filter(l => /^:::[ \t]*[a-zA-Z]/.test(l)).length;
      const closes = lines.filter(l => /^:::[ \t]*$/.test(l)).length;
      if (opens !== closes) errors.push(`${subjectId}: overview has ${opens} fence open(s) and ${closes} close(s)`);
      // The renderer is fine with these, but the rest of the catalogue is
      // normalised to ASCII (see scripts/normalize-dashes.mjs) and drifting
      // back is how it stops being normalised.
      if (/[–—]/.test(intro.overview)) errors.push(`${subjectId}: overview contains an en/em dash - use " - "`);
    }
  }

  return errors;
}

function summarise(intro) {
  const words = (intro.overview || "").trim().split(/\s+/).filter(Boolean).length;
  const counts = [...ARRAY_FIELDS]
    .filter(f => intro[f]?.length)
    .map(f => `${f}:${intro[f].length}`)
    .join(" ");
  return `${String(words).padStart(4)}w overview | stars:${intro.interviewImportance ?? "-"} | ${counts}`;
}

async function run() {
  const subjectIds = Object.keys(SUBJECT_INTROS).filter(id => !ONLY_SUBJECT || id === ONLY_SUBJECT);

  if (subjectIds.length === 0) {
    console.error(ONLY_SUBJECT
      ? `No authored intro for subject "${ONLY_SUBJECT}". Authored: ${Object.keys(SUBJECT_INTROS).join(", ")}`
      : "No authored intros found in scripts/cscore-subject-intros/.");
    process.exit(1);
  }

  console.log(DRY_RUN ? "DRY RUN - nothing will be written.\n" : "APPLYING - Firestore will be written.\n");

  const errors = [];
  const backup = {};
  const pending = [];
  const missing = [];

  for (const subjectId of subjectIds) {
    const intro = SUBJECT_INTROS[subjectId];
    errors.push(...validate(subjectId, intro));

    const ref = db.collection("csCoreSubjects").doc(subjectId);
    const snap = await ref.get();
    if (!snap.exists) {
      // Never create a subject here - a typo'd id is reported rather than
      // silently seeding an orphaned document with no topics behind it.
      missing.push(subjectId);
      continue;
    }

    const existing = snap.data();
    const prior = {};
    for (const f of FIELDS) prior[f] = existing[f] ?? null;
    backup[subjectId] = prior;

    const overwriting = FIELDS.filter(f => intro[f] !== undefined && existing[f] !== undefined);
    console.log(`  ${subjectId.padEnd(26)} ${summarise(intro)}${overwriting.length ? `  (overwrites ${overwriting.join(",")})` : ""}`);

    pending.push({ ref, subjectId, intro });
  }

  console.log("");

  if (missing.length > 0) {
    console.log("NO SUCH SUBJECT IN FIRESTORE:");
    missing.forEach(s => console.log("  " + s));
    console.log("");
  }

  if (errors.length > 0) {
    console.error("REFUSING TO WRITE - authoring errors:");
    errors.forEach(e => console.error("  " + e));
    process.exit(1);
  }

  console.log(`${pending.length} subject intro(s) ready.`);

  if (DRY_RUN) {
    console.log("Dry run complete - no writes performed.");
    return;
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = path.join(__dirname, `cscore-intro-backup-${stamp}.json`);
  writeFileSync(backupPath, JSON.stringify(backup, null, 2), "utf8");
  console.log(`Previous field values saved to ${path.basename(backupPath)}`);

  let written = 0;
  for (const { ref, intro } of pending) {
    await ref.set({ ...intro, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
    written++;
  }

  console.log(`Wrote ${written} subject intro(s).`);
}

run().catch(e => { console.error(e); process.exit(1); });
