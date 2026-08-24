// Verifies the 08-Aug MRCET contests actually landed correctly - question
// counts, answer keys, coding test subcollections, scope and proctoring
// settings. Read-only.
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

const SEED_KEY = "mrcet-yearwise-2026-08-08";

async function main() {
  const snap = await db.collection("contests").where("seedKey", ">=", `${SEED_KEY}:`)
    .where("seedKey", "<=", `${SEED_KEY}:`).get();

  console.log(`found ${snap.size} seeded contests\n`);
  let problems = 0;

  for (const d of snap.docs) {
    const c = d.data();
    const s = c.settings || {};
    console.log(`── ${c.title}`);
    console.log(`   id=${d.id}  status=${c.status}  maxMarks=${c.maxMarks}`);
    console.log(`   window: ${c.contestStart.toDate().toISOString()} -> ${c.contestEnd.toDate().toISOString()}  (${c.durationMinutes}m)`);
    console.log(`   regEnd: ${c.registrationEnd.toDate().toISOString()}`);
    console.log(`   scope : mode=${c.targetScope?.mode} years=${JSON.stringify(c.targetScope?.years)}`);
    console.log(`   proctor: enabled=${s.proctoringEnabled} every=${s.proctorSnapshotSeconds}s fullscreen=${s.proctorRequireFullscreen} retain=${s.proctorRetainFrames} maxViol=${s.proctorMaxViolations}`);

    if (c.targetScope?.mode !== "scoped") { console.log("   !! scope mode is not 'scoped' - would open to ALL years"); problems++; }
    if (s.proctoringEnabled !== true) { console.log("   !! proctoring not enabled"); problems++; }

    const qs = await d.ref.collection("questions").orderBy("order").get();
    const keys = await d.ref.collection("answerKeys").get();
    const keyIds = new Set(keys.docs.map(k => k.id));

    let mcq = 0, code = 0, missingKey = 0, marks = 0;
    for (const q of qs.docs) {
      const qd = q.data();
      marks += qd.marks || 0;
      if (qd.type === "coding") {
        code++;
        const [sm, hd] = await Promise.all([
          q.ref.collection("sampleTests").get(),
          q.ref.collection("hiddenTests").get(),
        ]);
        if (sm.empty || hd.empty) { console.log(`   !! coding q${qd.order} missing tests (sample=${sm.size} hidden=${hd.size})`); problems++; }
        else console.log(`   coding q${qd.order} "${qd.topic}": ${sm.size} sample / ${hd.size} hidden tests`);
        if (keyIds.has(q.id)) { console.log(`   !! coding q${qd.order} has an answerKeys doc - hidden tests must stay server-only`); problems++; }
      } else {
        mcq++;
        if (!keyIds.has(q.id)) { missingKey++; }
        else {
          const k = keys.docs.find(x => x.id === q.id).data();
          const validIds = new Set((qd.options || []).map(o => o.id));
          const bad = (k.correctOptionIds || []).filter(id => !validIds.has(id));
          if (bad.length) { console.log(`   !! q${qd.order} answer key ${JSON.stringify(bad)} is not among its options`); problems++; }
          if (!(k.correctOptionIds || []).length) { console.log(`   !! q${qd.order} has no correct option`); problems++; }
        }
      }
    }
    if (missingKey) { console.log(`   !! ${missingKey} MCQ(s) without an answer key`); problems++; }
    if (marks !== c.maxMarks) { console.log(`   !! marks sum ${marks} != maxMarks ${c.maxMarks}`); problems++; }
    console.log(`   questions: ${qs.size} (${mcq} mcq + ${code} coding), marks=${marks}\n`);
  }

  console.log(problems === 0 ? "ALL CHECKS PASSED" : `${problems} PROBLEM(S) FOUND`);
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
