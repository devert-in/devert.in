// One-time content migration: creates 82 brand-new DSA problems (drafted by
// parallel content agents, every reference solution's test-case outputs
// verified via the REAL production run endpoint - see
// scripts/problem-structure-migration-applied-2026-07-29.json's sibling
// report for this batch). Every new problem is created as status:"draft" -
// NEVER "published" - so a human admin reviews and explicitly publishes each
// one via the existing CodingProblemsPanel before any real student sees it.
// xpReward/coinReward are set to 0: GradingService.java already hardcodes
// CodeLab/DSA rewards to 0 regardless of a problem's own authored fields
// (platform policy: only Daily Learning/Programming/CS Core/Aptitude
// reward), so setting a nonzero value here would just be a vestigial,
// never-honored number - see that file's own comment.
//
// Deliberately does NOT assign a `number` (LeetCode-style sequential index) -
// matches the existing, accepted convention that a problem created via the
// admin UI has no number until scripts/number-codelab-problems.mjs is
// re-run (see that script's own header comment); run it after reviewing/
// publishing these, not before.
//
// Usage:
//   node scripts/migrate-add-new-dsa-problems.mjs            (dry run)
//   node scripts/migrate-add-new-dsa-problems.mjs --execute   (apply)
import admin from "firebase-admin";
import { readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(join(__dirname, "service-account.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const EXECUTE = process.argv.includes("--execute");
const DATA_PATH = process.argv[2] && !process.argv[2].startsWith("--") ? process.argv[2] : null;
if (!DATA_PATH) {
  console.error("Usage: node scripts/migrate-add-new-dsa-problems.mjs <verify-progress.json> [--execute]");
  process.exit(1);
}

const { verified } = JSON.parse(readFileSync(DATA_PATH, "utf8"));
console.log(`Loaded ${verified.length} verified new problems.`);

const report = [];
for (const p of verified) {
  const problemDoc = {
    title: p.title, category: p.category, difficulty: p.difficulty,
    tags: [], companies: [],
    statement: p.statement, constraints: p.constraints, examplesText: p.examplesText,
    hints: p.hints, inputFormat: p.inputFormat, outputFormat: p.outputFormat, edgeCases: p.edgeCases,
    estimatedTime: 20, xpReward: 0, coinReward: 0,
    status: "draft", totalSubmissions: 0, acceptedSubmissions: 0,
    createdAt: admin.firestore.FieldValue.serverTimestamp(), createdBy: "migration-script (AI-drafted, execution-verified, pending admin review)",
  };
  console.log(`${EXECUTE ? "Creating" : "Would create"}: [${p.category}/${p.difficulty}] ${p.title} (${p.sampleTests.length} sample + ${p.hiddenTests.length} hidden tests)`);
  if (EXECUTE) {
    const ref = await db.collection("problems").add(problemDoc);
    const batch = db.batch();
    p.sampleTests.forEach(t => batch.set(ref.collection("sampleTests").doc(), { input: t.input, expectedOutput: t.expectedOutput, explanation: t.explanation || "" }));
    p.hiddenTests.forEach(t => batch.set(ref.collection("hiddenTests").doc(), { input: t.input, expectedOutput: t.expectedOutput, points: t.points || 1 }));
    await batch.commit();
    report.push({ id: ref.id, title: p.title, category: p.category, difficulty: p.difficulty });
  } else {
    report.push({ title: p.title, category: p.category, difficulty: p.difficulty });
  }
}

console.log(`\n${EXECUTE ? "CREATED" : "DRY RUN - would create"}: ${report.length} problems, all status:"draft"`);
const byCat = {};
report.forEach(p => { byCat[p.category] = (byCat[p.category] || 0) + 1; });
console.log(byCat);

const reportPath = join(__dirname, `new-dsa-problems-migration-${EXECUTE ? "applied" : "dryrun"}-2026-07-29.json`);
writeFileSync(reportPath, JSON.stringify({ count: report.length, byCategory: byCat, problems: report }, null, 2));
console.log(`Report written to ${reportPath}`);
process.exit(0);
