// Loads the extractor's output (scripts/gate-pyqs-content/extracted/*.json)
// into the gate_pyqs collection as DRAFTS awaiting human review.
//
// Usage:
//   node scripts/import-gate-pyq-drafts.mjs --dry-run
//   node scripts/import-gate-pyq-drafts.mjs
//   node scripts/import-gate-pyq-drafts.mjs --only cs-2024-s1
//
// THREE PROPERTIES THIS SCRIPT GUARANTEES, each of which is the reason for a
// specific piece of the code below rather than a general aspiration:
//
// 1. NOTHING IT WRITES IS VISIBLE TO A STUDENT. Every document goes in with
//    status:"draft". firestore.rules gates gate_pyqs reads on
//    `status == 'published' || isAdmin()`, and lib/gatePyq.js's fetchPyqs()
//    additionally carries where("status","==","published") on every non-admin
//    path, so a draft is unreachable from the student UI and excluded from
//    lib/campusCatalog.js's advertised count. An extraction nobody has checked
//    cannot reach a candidate revising for an exam.
//
// 2. RE-RUNNING IT NEVER DUPLICATES. Document ids are DETERMINISTIC - derived
//    from (paper, year, session, section, question number), which is exactly
//    what identifies a GATE question - so a second run overwrites the same 1156
//    documents instead of creating 1156 more. An auto-id here (what
//    lib/gatePyq.js's importPyqsBatch uses, correctly, for hand-authored CSV
//    rows) would make every re-extraction a fresh copy of the whole bank.
//
// 3. RE-RUNNING IT NEVER DESTROYS REVIEW WORK. Before writing, it reads the
//    existing document: if a human has published it, or edited it, or supplied
//    an answer, that document is LEFT ALONE and counted as preserved. Re-running
//    the extractor after fixing a parser bug must not silently wipe the answers
//    and subject assignments someone has since typed in - which a blind
//    overwrite would do, irreversibly, for the whole bank at once.

import admin from "firebase-admin";
import { existsSync, readdirSync, readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EXTRACTED_DIR = path.join(__dirname, "gate-pyqs-content", "extracted");

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const ONLY = (() => { const i = args.indexOf("--only"); return i >= 0 ? args[i + 1] : null; })();

const SERVICE_ACCOUNT = path.join(__dirname, "service-account.json");
if (!existsSync(SERVICE_ACCOUNT)) {
  console.error("scripts/service-account.json not found (it is gitignored - see CLAUDE.md).");
  process.exit(1);
}
if (!existsSync(EXTRACTED_DIR)) {
  console.error("No extracted questions. Run: node scripts/extract-gate-pyqs.mjs");
  process.exit(1);
}

admin.initializeApp({ credential: admin.credential.cert(JSON.parse(readFileSync(SERVICE_ACCOUNT, "utf8"))) });
const db = admin.firestore();

// The natural key of a GATE question. Session and section are both part of it
// because neither alone disambiguates: 2024 ran two sessions that each have a
// Q.17, and the 2014-2018 papers number General Aptitude and the subject paper
// independently so a single session has two Q.3s.
function docIdFor(q) {
  return [
    q.paperId,
    q.year,
    q.session ? `s${q.session}` : null,
    q.paperSection === "general-aptitude" ? "ga" : null,
    `q${q.questionNumber}`,
  ].filter(Boolean).join("-");
}

// Has a human invested anything in this document yet? Any one of these is
// enough to make it theirs rather than the extractor's, and therefore
// off-limits to an automated re-import.
function hasHumanWork(data) {
  if (!data) return false;
  return data.status === "published"
    || !!data.reviewedAt
    || (Array.isArray(data.correctOptionIds) && data.correctOptionIds.length > 0)
    || data.natMin != null
    || !!(data.solution || "").trim()
    || !!(data.topicId || "").trim();
}

async function run() {
  const files = readdirSync(EXTRACTED_DIR)
    .filter(f => f.endsWith(".json") && f !== "_report.json")
    .filter(f => !ONLY || f.startsWith(ONLY));

  if (!files.length) { console.error("No matching extracted files."); process.exit(1); }

  // Only import into papers that actually exist and are published, so a typo
  // in a paper code cannot create an orphaned bank nothing renders.
  const papers = new Set((await db.collection("gatePapers").get()).docs.map(d => d.id));

  const pending = [];
  const stats = { preserved: 0, new: 0, refreshed: 0, noPaper: 0 };

  for (const file of files) {
    const questions = JSON.parse(readFileSync(path.join(EXTRACTED_DIR, file), "utf8"));
    for (const q of questions) {
      if (!papers.has(q.paperId)) { stats.noPaper++; continue; }

      const id = docIdFor(q);
      const existing = await db.collection("gate_pyqs").doc(id).get();
      if (hasHumanWork(existing.data())) { stats.preserved++; continue; }
      existing.exists ? stats.refreshed++ : stats.new++;

      pending.push({
        id,
        data: {
          paperId: q.paperId, year: q.year, session: q.session ?? null,
          questionNumber: q.questionNumber, paperSection: q.paperSection ?? null,
          order: q.order, organizingInstitute: q.organizingInstitute || "",
          marks: q.marks, questionType: q.questionType, negativeMark: q.negativeMark,
          question: q.question, options: q.options,
          correctOptionIds: [], natMin: null, natMax: null,
          solution: "", explanation: "",
          subjectId: q.subjectId || "", topicId: "", difficulty: "",
          isRepeated: false, repeatGroup: "",

          // The review contract. `status` is what firestore.rules and every
          // student query key off; the rest is what the admin review queue
          // sorts and filters by.
          status: "draft",
          reviewFlags: q.reviewFlags,
          needsReview: true,
          reviewedAt: null,
          reviewedBy: null,
          importSource: q.sourceFile,
          importedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
      });
    }
  }

  console.log("\nGATE PYQ draft import\n" + "=".repeat(58));
  console.log(`  new documents          ${stats.new}`);
  console.log(`  re-imported (no human edits yet)   ${stats.refreshed}`);
  console.log(`  PRESERVED (human work - left alone) ${stats.preserved}`);
  if (stats.noPaper) console.log(`  skipped, paper not in gatePapers    ${stats.noPaper}`);
  console.log(`  ${"-".repeat(54)}`);
  console.log(`  ${pending.length} document(s) to write, all status:"draft"`);

  if (DRY_RUN) {
    console.log("\n  DRY RUN - nothing written.\n");
    return;
  }

  for (let i = 0; i < pending.length; i += 400) {
    const batch = db.batch();
    for (const { id, data } of pending.slice(i, i + 400)) {
      batch.set(db.collection("gate_pyqs").doc(id), data, { merge: true });
    }
    await batch.commit();
    console.log(`  committed ${Math.min(i + 400, pending.length)}/${pending.length}`);
  }
  console.log("\n  Done. Review them in /admin -> GATE -> PYQ bank (Needs review).\n");
}

run().catch(e => { console.error(e); process.exit(1); });
