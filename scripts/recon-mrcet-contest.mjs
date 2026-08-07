// One-shot recon before seeding the 08-Aug MRCET year-wise contests.
// Read-only: answers "who exists, what year strings do they carry, is the
// contests module blocked anywhere, and is registration reachable".
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

async function main() {
  console.log("=== institutions ===");
  const insts = await db.collection("institutions").get();
  for (const d of insts.docs) {
    const x = d.data();
    console.log(`  id=${d.id}  name=${x.name || "?"}  slug=${x.slug || "-"}`);
  }

  // The seed script targets institutionId === the slug, matching
  // seed-mrcet-weekend-contest.mjs's SLUG = "mrcet".
  const target = insts.docs.find(d => d.id === "mrcet")
    || insts.docs.find(d => (d.data().slug || "").toLowerCase().includes("mrcet"));
  if (!target) { console.log("!! no MRCET institution found"); return; }
  const instId = target.id;
  console.log(`\n=== using institutionId = ${instId} ===`);

  const students = await db.collection("institutions").doc(instId).collection("students").get();
  const byYear = {}, byStatus = {}, classroomIds = new Set();
  students.forEach(d => {
    const s = d.data();
    const y = s.year || "(blank)";
    byYear[y] = (byYear[y] || 0) + 1;
    byStatus[s.status || "(blank)"] = (byStatus[s.status || "(blank)"] || 0) + 1;
    if (s.classroomId) classroomIds.add(s.classroomId);
  });
  console.log(`students total: ${students.size}`);
  console.log("by year   :", JSON.stringify(byYear, null, 0));
  console.log("by status :", JSON.stringify(byStatus, null, 0));

  // Approved students per year - the only ones who can register.
  const approvedByYear = {};
  students.forEach(d => {
    const s = d.data();
    if (s.status === "approved") {
      const y = s.year || "(blank)";
      approvedByYear[y] = (approvedByYear[y] || 0) + 1;
    }
  });
  console.log("APPROVED by year:", JSON.stringify(approvedByYear, null, 0));

  console.log(`\n=== classrooms (moduleAccess.contests must not be false) ===`);
  const rooms = await db.collection("institutions").doc(instId).collection("classrooms").get();
  let blocked = 0;
  rooms.forEach(d => {
    const ma = d.data().moduleAccess || {};
    const v = ma.contests;
    if (v === false) { blocked++; console.log(`  BLOCKED  ${d.id}`); }
  });
  console.log(`classrooms: ${rooms.size}, explicitly blocking contests: ${blocked}`);
  console.log(`classroomIds referenced by students: ${classroomIds.size}`);

  console.log(`\n=== contestRestricted students (cannot register) ===`);
  let restricted = 0;
  students.forEach(d => { if (d.data().contestRestricted === true) restricted++; });
  console.log(`contestRestricted: ${restricted}`);

  console.log(`\n=== existing contests for ${instId} ===`);
  const cs = await db.collection("contests").where("institutionId", "==", instId).get();
  cs.forEach(d => {
    const c = d.data();
    const st = c.contestStart?.toDate?.();
    console.log(`  ${d.id}  "${c.title}"  status=${c.status}  start=${st ? st.toISOString() : "?"}  scope=${JSON.stringify(c.targetScope || {})}`);
  });
  console.log(`total: ${cs.size}`);
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
