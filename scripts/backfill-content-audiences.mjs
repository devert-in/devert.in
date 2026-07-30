// Phase 0 of docs/CONTENT-ENGINE-ARCHITECTURE.md - adds `audiences: ["legacy"]`
// to every existing content document.
//
//   node scripts/backfill-content-audiences.mjs                     dry run (default)
//   node scripts/backfill-content-audiences.mjs --only=csCoreSubjects
//   node scripts/backfill-content-audiences.mjs --apply
//   node scripts/backfill-content-audiences.mjs --revert=scripts/audience-backfill-<stamp>.json
//
// WHY THIS EXISTS. The architecture doc originally claimed the absence of an
// `audiences` field could mean "legacy, still visible", needing no migration.
// Emulator testing disproved it: `array-contains-any` does not return documents
// where the field is missing, and Firestore has no query for field absence. So
// consumers cannot both filter on audiences AND still see legacy content unless
// the field exists everywhere. See Section 6a of the doc.
//
// ORDERING IS NOT NEGOTIABLE. This backfill must land and be verified BEFORE the
// Phase 1 rules deploy. Deploying rules that require `audiences` against
// un-backfilled documents makes every lesson in the product disappear at once.
// Conversely this script alone is inert: adding a field that no rule and no
// query reads yet changes nothing observable.
//
// WHAT MAKES IT SAFE
//   - Dry run is the DEFAULT. Writing requires --apply.
//   - Purely additive: writes exactly one field, touches nothing else.
//   - Idempotent: a document that already has `audiences` is skipped, never
//     overwritten - so re-running after a partial failure is safe.
//   - Every written path is recorded to a timestamped JSON file, and --revert
//     replays that file to delete the field again. Rollback is exact.
//
// DELIBERATELY NOT USING previousVersions. The other content scripts snapshot the
// whole prior document into `previousVersions` (lib/contentVersioning.js). That is
// right for a content edit and wrong here: this adds one field to ~900 documents,
// several of which carry multi-kilobyte lesson bodies, so snapshotting would
// roughly double storage to record "a field was added". The backup file plus
// --revert covers the same need for a fraction of the cost.

import admin from "firebase-admin";
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const onlyArg = args.find(a => a.startsWith("--only="));
const revertArg = args.find(a => a.startsWith("--revert="));
const ONLY = onlyArg ? onlyArg.split("=")[1] : null;
const REVERT_FILE = revertArg ? revertArg.split("=")[1] : null;
const INCLUDE_PROBLEMS = args.includes("--include-problems");

const serviceAccount = JSON.parse(readFileSync(path.join(__dirname, "service-account.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// The audience every existing document gets, and which every reader's claim will
// carry - so visibility is byte-for-byte unchanged from today. Revoking it later
// is a deliberate per-collection decision, never a side effect of this script.
const LEGACY_AUDIENCE = "legacy";

// The NAVIGABLE content units - the things a student actually navigates to and
// that Manage Access will publish. Sub-parts of a unit (a question inside an
// aptitude topic, a category inside a company round, a task inside a course
// module) are deliberately NOT tagged: they are unreachable without their
// parent's id, they are already status-gated, and tagging them would force a
// get() of the parent on every read - which blows Firestore's 10-read rule cap
// on any list of more than ten. Leaving them alone preserves exactly the current
// security posture rather than half-changing it.
//
// `depth` walks fixed subcollection names discovered from the live database on
// 2026-07-30; see the shape probe in the architecture work.
const TARGETS = [
  { root: "csCoreSubjects", sub: ["topics"] },
  { root: "programmingLanguages", sub: ["topics"] },
  { root: "gatePapers", sub: ["subjects", "topics"] },
  { root: "aptitude_topics", sub: [] },          // `questions` sub-parts excluded
  { root: "companies", sub: [] },                // `rounds/categories` excluded
  { root: "courses", sub: [] },                  // `modules/tasks` excluded
  { root: "intel_resources", sub: [] },
];

// Per-institution content. Daily Learning is the only genuinely
// institution-owned learning content in the system (13 docs at MRCET).
const INSTITUTION_TARGETS = [
  { sub: "dailyLearning" },
];

// `problems` (545 DSA) is excluded pending open question 4 in the architecture
// doc - it is already global and already works, it is the most-read collection
// in the app, and nobody has decided whether per-institution problem sets are
// wanted. Opt in explicitly with --include-problems once that is settled.
if (INCLUDE_PROBLEMS) TARGETS.push({ root: "problems", sub: [] });

// Config/marker documents that live alongside content but are not content.
function isConfigDoc(id) {
  return id.startsWith("_");
}

// Recursively collect every target document reference under one root.
async function collectFrom(colRef, subPath) {
  const out = [];
  const snap = await colRef.get();
  for (const d of snap.docs) {
    if (isConfigDoc(d.id)) continue;
    out.push({ ref: d.ref, path: d.ref.path, has: Object.prototype.hasOwnProperty.call(d.data(), "audiences") });
    if (subPath.length) {
      out.push(...await collectFrom(d.ref.collection(subPath[0]), subPath.slice(1)));
    }
  }
  return out;
}

async function collectAll() {
  const groups = [];
  for (const t of TARGETS) {
    if (ONLY && t.root !== ONLY) continue;
    const docs = await collectFrom(db.collection(t.root), t.sub);
    groups.push({ label: t.root, docs });
  }
  if (!ONLY || ONLY === "institutions") {
    const insts = await db.collection("institutions").get();
    for (const inst of insts.docs) {
      for (const t of INSTITUTION_TARGETS) {
        const docs = await collectFrom(inst.ref.collection(t.sub), []);
        if (docs.length) groups.push({ label: `institutions/${inst.id}/${t.sub}`, docs });
      }
    }
  }
  return groups;
}

async function commitInChunks(ops) {
  let done = 0;
  for (let i = 0; i < ops.length; i += 450) {
    const batch = db.batch();
    for (const op of ops.slice(i, i + 450)) {
      if (op.kind === "set") batch.set(op.ref, op.data, { merge: true });
      else batch.update(op.ref, op.data);
    }
    await batch.commit();
    done += Math.min(450, ops.length - i);
    process.stdout.write(`\r  written ${done}/${ops.length}`);
  }
  if (ops.length) process.stdout.write("\n");
  return done;
}

async function revert() {
  const record = JSON.parse(readFileSync(REVERT_FILE, "utf8"));
  const paths = record.written || [];
  console.log(`REVERT - removing the \`audiences\` field from ${paths.length} document(s)`);
  console.log(`  source: ${path.basename(REVERT_FILE)}   written at ${record.stamp}\n`);
  if (!APPLY) {
    paths.slice(0, 10).forEach(p => console.log(`  would clear  ${p}`));
    if (paths.length > 10) console.log(`  ... and ${paths.length - 10} more`);
    console.log("\nDry run. Re-run with --apply to actually revert.");
    return;
  }
  const ops = paths.map(p => ({
    kind: "update",
    ref: db.doc(p),
    data: { audiences: admin.firestore.FieldValue.delete() },
  }));
  const n = await commitInChunks(ops);
  console.log(`Reverted ${n} document(s). The field is gone; nothing else was touched.`);
}

async function run() {
  if (REVERT_FILE) return revert();

  console.log(APPLY ? "APPLYING - Firestore will be written.\n" : "DRY RUN - nothing will be written. Use --apply to write.\n");
  if (!INCLUDE_PROBLEMS) {
    console.log("NOTE: `problems` (DSA) excluded pending open question 4. Use --include-problems to add it.\n");
  }

  const groups = await collectAll();
  if (!groups.length) {
    console.error(ONLY ? `No target collection matched "${ONLY}".` : "No target collections found.");
    process.exit(1);
  }

  let totalNeed = 0, totalSkip = 0;
  const pending = [];

  for (const g of groups) {
    const need = g.docs.filter(d => !d.has);
    const skip = g.docs.length - need.length;
    totalNeed += need.length;
    totalSkip += skip;
    console.log(
      `${g.label.padEnd(38)} ${String(g.docs.length).padStart(4)} docs  ` +
      `${String(need.length).padStart(4)} to tag  ` +
      (skip ? `${skip} already tagged (skipped)` : "")
    );
    pending.push(...need.map(d => ({ kind: "set", ref: d.ref, path: d.path, data: { audiences: [LEGACY_AUDIENCE] } })));
  }

  console.log(`\n${totalNeed} document(s) to tag with audiences: ["${LEGACY_AUDIENCE}"]` +
    (totalSkip ? `, ${totalSkip} already tagged` : ""));

  if (!totalNeed) {
    console.log("Nothing to do - every target document already carries the field.");
    return;
  }

  if (!APPLY) {
    console.log("\nSample of what would change:");
    pending.slice(0, 5).forEach(p => console.log(`  ${p.path}`));
    if (pending.length > 5) console.log(`  ... and ${pending.length - 5} more`);
    console.log("\nDry run complete. Re-run with --apply to write.");
    console.log("REMINDER: verify this, THEN deploy the Phase 1 rules. Never the other way round.");
    return;
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = path.join(__dirname, `audience-backfill-${stamp}.json`);
  writeFileSync(backupPath, JSON.stringify({
    stamp,
    audience: LEGACY_AUDIENCE,
    note: "Paths that had `audiences` ADDED by backfill-content-audiences.mjs. Revert with --revert=<this file>.",
    written: pending.map(p => p.path),
  }, null, 2), "utf8");
  console.log(`\nPath manifest written to ${path.basename(backupPath)} (use --revert to undo)`);

  const n = await commitInChunks(pending);
  console.log(`Tagged ${n} document(s).`);
  console.log("\nNext: re-run this script (it should report 0 to tag) to confirm coverage,");
  console.log("then proceed to the Phase 1 rules change.");
}

run().catch(e => { console.error(e); process.exit(1); });
