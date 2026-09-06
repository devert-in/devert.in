// Writes verified real GATE PYQs (scripts/gate-pyqs-content/*.mjs) into the
// flat gate_pyqs collection, fanning each question out to every paper whose
// syllabus tree actually contains its (subjectId, topicId) - same discovery
// approach as write-gate-tests.mjs, not an assumed paper list.
//
// Usage:
//   node scripts/write-gate-pyqs.mjs --dry-run
//   node scripts/write-gate-pyqs.mjs

import admin from "firebase-admin";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";
import { PYQS as BATCH_1 } from "./gate-pyqs-content/verified-batch-1.mjs";

const ALL_PYQS = [...BATCH_1];

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DRY_RUN = process.argv.includes("--dry-run");

const serviceAccount = JSON.parse(readFileSync(path.join(__dirname, "service-account.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function papersHavingTopic(subjectId, topicId) {
  const candidates = ["cs", "cs-da", "da"];
  const found = [];
  for (const paperId of candidates) {
    const snap = await db.doc(`gatePapers/${paperId}/subjects/${subjectId}/topics/${topicId}`).get();
    if (snap.exists) found.push(paperId);
  }
  return found;
}

async function run() {
  let order = 1;
  const toWrite = [];

  for (const pyq of ALL_PYQS) {
    const papers = await papersHavingTopic(pyq.subjectId, pyq.topicId);
    console.log(`${pyq.year} ${pyq.subjectId}/${pyq.topicId} -> papers: ${papers.join(", ") || "NONE FOUND - skipped"}`);
    for (const paperId of papers) {
      toWrite.push({ ...pyq, paperId, order: order++ });
    }
  }

  console.log(`\n${DRY_RUN ? "DRY RUN" : "APPLYING"} - ${toWrite.length} gate_pyqs document(s) to write (${ALL_PYQS.length} distinct question(s)).`);
  if (DRY_RUN) return;

  for (let i = 0; i < toWrite.length; i += 200) {
    const batch = db.batch();
    toWrite.slice(i, i + 200).forEach(row => {
      batch.set(db.collection("gate_pyqs").doc(), {
        ...row,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });
    await batch.commit();
  }
  console.log(`Wrote ${toWrite.length} document(s) to gate_pyqs.`);
}

run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
