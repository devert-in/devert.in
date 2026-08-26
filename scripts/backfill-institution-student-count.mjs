// One-off corrective sync: institutions/{id}.studentCount was written once
// at creation (always 0) and never incremented since - lib/institutions.js's
// approveStudent/suspendStudent/removeStudentFromInstitution/
// bulkAssignByRollNumber now keep it live going forward, but every existing
// institution's count needs a one-time real recompute first. Read-only
// count + a single corrective write per institution - no student roster
// data is read out of Firestore by this script beyond a status field.
import admin from "firebase-admin";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(join(__dirname, "service-account.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const institutionsSnap = await db.collection("institutions").get();
console.log(`${institutionsSnap.size} institution(s) found.\n`);

for (const inst of institutionsSnap.docs) {
  const countSnap = await inst.ref.collection("students").where("status", "==", "approved").count().get();
  const realCount = countSnap.data().count;
  const staleCount = inst.data().studentCount || 0;
  await inst.ref.update({ studentCount: realCount });
  console.log(`${inst.id}: studentCount ${staleCount} -> ${realCount}`);
}

console.log("\nDone.");
