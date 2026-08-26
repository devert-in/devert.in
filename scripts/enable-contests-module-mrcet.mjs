// Enables the `contests` module for every MRCET classroom that explicitly
// disables it.
//
// isModuleEnabledForUser() in firestore.rules reads
// institutions/{id}/classrooms/{classroomId}.moduleAccess.contests and treats a
// MISSING key as enabled (`.get(moduleKey, true) != false`). So only an explicit
// `false` blocks anyone - and 11 of MRCET's 26 classrooms carry exactly that,
// which would have silently locked those cohorts out of registration with a
// "you're not registered" dead end and no visible reason.
//
// Writes `true` rather than deleting the key: an explicit true records that this
// was decided, so the next person reading the doc does not wonder whether the
// absence is intentional.
//
// Idempotent - re-running touches nothing.
import admin from "firebase-admin";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
admin.initializeApp({
  credential: admin.credential.cert(
    JSON.parse(readFileSync(join(__dirname, "service-account.json"), "utf8"))
  ),
});
const db = admin.firestore();

const INSTITUTION_ID = "mrcet";
const DRY_RUN = process.argv.includes("--dry-run");

async function main() {
  const rooms = await db.collection("institutions").doc(INSTITUTION_ID).collection("classrooms").get();

  const toFix = rooms.docs.filter(d => (d.data().moduleAccess || {}).contests === false);

  console.log(`classrooms: ${rooms.size}, explicitly blocking contests: ${toFix.length}`);
  if (toFix.length === 0) { console.log("nothing to do."); return; }

  for (const d of toFix) {
    console.log(`  ${DRY_RUN ? "[dry-run] would enable" : "enabling"}  ${d.id}`);
    if (!DRY_RUN) {
      // Dotted path so sibling module flags in the same map are untouched.
      await d.ref.update({ "moduleAccess.contests": true });
    }
  }

  if (DRY_RUN) { console.log("\ndry run - no writes made."); return; }

  // Re-read to prove it stuck, rather than trusting the write.
  const after = await db.collection("institutions").doc(INSTITUTION_ID).collection("classrooms").get();
  const stillBlocked = after.docs.filter(d => (d.data().moduleAccess || {}).contests === false);
  console.log(`\nverified: ${stillBlocked.length} classrooms still blocking contests`);
  if (stillBlocked.length) stillBlocked.forEach(d => console.log(`  STILL BLOCKED ${d.id}`));
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
