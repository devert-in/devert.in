// LIVE FIX: remove hidden tests whose input is too large for the code-execution
// provider to accept.
//
// THE FAILURE. api.onlinecompiler.io returns HTTP 400 for an oversized request
// body. One IV Year hidden test carries an input of "100000\n1 2 3 ... 100000" -
// roughly 600KB of stdin in a single call. CodeExecutionService.run() gets the
// 400, gives up after its retries and returns null; GradingService then throws
// JudgeUnavailableException and - correctly - records NO grade rather than
// marking a right answer wrong. So one impossible test case fails the entire
// question for every student, which is what "The grading server had a problem"
// on screen actually means.
//
// WHY NOT DELETE ALL HIDDEN TESTS. A coding question with no hidden tests cannot
// be scored meaningfully - the grade would be vacuous rather than correct. Only
// the tests that physically cannot be executed are removed; every test small
// enough to run is kept, so grading stays real, just without the case that was
// never gradeable in the first place.
//
// A question is left with a warning if stripping would empty it, rather than
// being silently reduced to zero tests.
//
//   node scripts/strip-oversized-hidden-tests.mjs                # dry run
//   node scripts/strip-oversized-hidden-tests.mjs --apply

import admin from "firebase-admin";
import { readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
admin.initializeApp({
  credential: admin.credential.cert(
    JSON.parse(readFileSync(join(__dirname, "service-account.json"), "utf8"))
  ),
});
const db = admin.firestore();

const APPLY = process.argv.includes("--apply");

// 8KB. Comfortably above any hand-written test case, far below the ~600KB that
// provably 400s. Chosen to strip only the pathological generated cases.
const MAX_INPUT_BYTES = 8 * 1024;

const CONTESTS = [
  "705UBMMcxDjL3SjguGSL", // III Year
  "yVBx52sUzizUga2nKKGC", // IV Year
];

const backup = [];
let stripped = 0, kept = 0;

for (const contestId of CONTESTS) {
  const ref = db.collection("contests").doc(contestId);
  const c = await ref.get();
  if (!c.exists) continue;
  console.log(`\n=== ${c.data().title}`);

  const qs = await ref.collection("questions").get();
  for (const q of qs.docs) {
    if (q.data().type !== "coding") continue;
    const tests = await q.ref.collection("hiddenTests").get();

    const sized = tests.docs.map(t => ({
      doc: t,
      bytes: Buffer.byteLength(String(t.data().input ?? ""), "utf8"),
    }));
    const big = sized.filter(s => s.bytes > MAX_INPUT_BYTES);
    const small = sized.filter(s => s.bytes <= MAX_INPUT_BYTES);

    console.log(`  q ${q.id}  hiddenTests=${tests.size}  oversized=${big.length}  ok=${small.length}`);
    big.forEach(s => console.log(`      strip: ${(s.bytes / 1024).toFixed(0)}KB input`));

    if (big.length === 0) { kept += small.length; continue; }
    if (small.length === 0) {
      console.log(`      *** SKIPPED - stripping would leave this question with zero tests ***`);
      continue;
    }

    for (const s of big) {
      backup.push({ contestId, questionId: q.id, testId: s.doc.id, data: s.doc.data() });
      if (APPLY) await s.doc.ref.delete();
      stripped++;
    }
    kept += small.length;
  }
}

if (backup.length) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const f = join(__dirname, `oversized-hidden-tests-backup-${stamp}.json`);
  writeFileSync(f, JSON.stringify(backup, null, 2));
  console.log(`\nbackup: ${f}`);
}
console.log(`\n${APPLY ? "STRIPPED" : "would strip"}: ${stripped} oversized test(s);  kept ${kept} runnable test(s)`);
if (!APPLY) console.log("dry run - re-run with --apply");
process.exit(0);
