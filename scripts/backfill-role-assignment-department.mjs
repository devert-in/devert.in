// Backfills scope.department onto facultyClassTeacher roleAssignments created
// before AdminAccountService started persisting it.
//
// Why: firestore.rules' roleAssignments read rule clears a doc for an HOD only
// when resource.data.scope.department == that HOD's own department. Faculty
// docs were written with scope.department == null (only scope.classroomId was
// set), so isHodOfDepartment() could never match one and an HOD's Faculty tab
// was permanently empty - and because Firestore list queries fail
// all-or-nothing, it also meant the HOD dashboard's whole roleAssignments read
// was denied, which is what made it report its own HOD as "Unassigned".
//
// The department is re-derived here from each assignment's OWN classroom doc,
// exactly the way AdminAccountService derives it server-side at create time -
// never from anything client-supplied. A faculty doc whose classroom is
// missing or has no department is reported and skipped, not guessed at.
//
// This grants no new authority: isHodOfDepartment() requires roleKey == 'hod'
// as a separate conjunct, so a Faculty doc carrying a department is still only
// ever a Faculty doc.
//
// Usage:
//   node scripts/backfill-role-assignment-department.mjs            (dry run)
//   node scripts/backfill-role-assignment-department.mjs --apply
import admin from "firebase-admin";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(join(__dirname, "service-account.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

const db = admin.firestore();
const apply = process.argv.includes("--apply");

const institutions = await db.collection("institutions").get();
let scanned = 0, planned = 0, skipped = 0;

for (const inst of institutions.docs) {
  const assignments = await inst.ref.collection("roleAssignments")
    .where("roleKey", "==", "facultyClassTeacher").get();

  for (const a of assignments.docs) {
    scanned++;
    const data = a.data();
    const existing = data.scope?.department ?? null;
    const classroomId = data.scope?.classroomId ?? null;

    if (existing) continue; // already backfilled, or created post-fix

    if (!classroomId) {
      console.warn(`  SKIP ${inst.id}/${a.id} - no scope.classroomId to derive a department from`);
      skipped++;
      continue;
    }
    const classroom = await inst.ref.collection("classrooms").doc(classroomId).get();
    const department = classroom.exists ? classroom.get("department") : null;
    if (!department) {
      console.warn(`  SKIP ${inst.id}/${a.id} - classroom ${classroomId} ${classroom.exists ? "has no department" : "does not exist"}`);
      skipped++;
      continue;
    }

    planned++;
    console.log(`  ${apply ? "SET " : "PLAN"} ${inst.id}/${a.id} (${data.displayName || data.email || "?"}) -> scope.department = ${department}`);
    if (apply) {
      // Field-path update, not a whole-scope rewrite - leaves classroomId and
      // any future scope key untouched.
      await a.ref.update({ "scope.department": department, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    }
  }
}

console.log(`\n${apply ? "Applied" : "Dry run"}: ${scanned} facultyClassTeacher assignment(s) scanned, ${planned} to update, ${skipped} skipped.`);
if (!apply && planned > 0) console.log("Re-run with --apply to write.");
