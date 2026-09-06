// Seeds gate_formulas from every authored GATE lesson's own memoryTricks array.
//
// WHY THIS DOESN'T DUPLICATE THE INLINE FORMULAS: lib/gateLibrary.js's
// mergeInlineFormulas() already surfaces every topic's `formulas` field
// directly in the Formula Book UI, live, with zero admin authoring needed -
// importing those same strings again here would just show every formula
// twice. memoryTricks is NOT auto-merged anywhere, so importing it here is
// the one thing that actually adds new value to the dedicated Formula Book
// beyond what's already automatic.
//
// Kind is always "trick" - these are mnemonics/shortcuts, not derivations
// (formula) or precise statements (definition/theorem). Nothing here is
// invented: every string written is copied verbatim from a lesson's own
// authored memoryTricks array, already reviewed as part of that lesson.
//
// Usage:
//   node scripts/seed-gate-formulas.mjs --dry-run
//   node scripts/seed-gate-formulas.mjs

import admin from "firebase-admin";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";
import { GATE_LESSONS } from "./gate-lessons/index.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DRY_RUN = process.argv.includes("--dry-run");

const serviceAccount = JSON.parse(readFileSync(path.join(__dirname, "service-account.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function run() {
  const rows = [];

  // Discovered live, same as write-gate-lessons.mjs's own papers query -
  // this used to be a hardcoded ["cs", "cs-da"], silently excluding "da" (and
  // any future paper) even though general-aptitude and every other
  // DA-shared subject is authored identically across all three. A DA-track
  // student got no Formula Book memory tricks at all for those shared
  // subjects, traceable to this one array not matching its own comment's
  // claim of following write-gate-lessons.mjs's fan-out.
  const papersSnap = await db.collection("gatePapers").get();
  const PAPERS = papersSnap.docs.map(d => d.id);

  for (const paperId of PAPERS) {
    const subjectsSnap = await db.collection(`gatePapers/${paperId}/subjects`).get();
    for (const subjectDoc of subjectsSnap.docs) {
      const subjectId = subjectDoc.id;
      const lessons = GATE_LESSONS[subjectId];
      if (!lessons) continue; // subject not authored (or authored under a different id) - skip, don't invent

      const topicsSnap = await db.collection(`gatePapers/${paperId}/subjects/${subjectId}/topics`).get();
      for (const topicDoc of topicsSnap.docs) {
        const topicId = topicDoc.id;
        const lesson = lessons[topicId];
        if (!lesson?.memoryTricks?.length) continue;
        const title = topicDoc.data().title || topicId;

        lesson.memoryTricks.forEach((trick, i) => {
          if (!trick?.trim()) return;
          rows.push({
            paperId, subjectId, topicId,
            kind: "trick",
            title: lesson.memoryTricks.length > 1 ? `${title} - Memory Trick ${i + 1}` : `${title} - Memory Trick`,
            statement: trick.trim(),
            status: "published",
          });
        });
      }
    }
  }

  console.log(`${DRY_RUN ? "DRY RUN" : "APPLYING"} - ${rows.length} formula-book entr${rows.length === 1 ? "y" : "ies"} to write.\n`);
  const bySubject = {};
  for (const r of rows) bySubject[`${r.paperId}/${r.subjectId}`] = (bySubject[`${r.paperId}/${r.subjectId}`] || 0) + 1;
  for (const [key, count] of Object.entries(bySubject)) console.log(`  ${key.padEnd(30)} ${count} entries`);

  if (!DRY_RUN) {
    for (let i = 0; i < rows.length; i += 200) {
      const batch = db.batch();
      rows.slice(i, i + 200).forEach((row, idx) => {
        batch.set(db.collection("gate_formulas").doc(), {
          ...row,
          order: i + idx + 1,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      });
      await batch.commit();
    }
    console.log(`\nWrote ${rows.length} document(s) to gate_formulas.`);
  }
}

run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
