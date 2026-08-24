// Post-seed, read-only verification for the Aptitude Series - re-reads what
// actually landed in Firestore (not just the local content files) and
// re-checks the same structural invariants seed-aptitude-series.mjs already
// validated pre-write, so a partial/corrupted write is caught rather than
// assumed. Also checks the parser can actually parse every day's `concept`
// without throwing, and that every ::: fence used is a real, known variant.
//
// Usage: node scripts/verify-aptitude-series-content.mjs [--slug=mrcet]

import admin from "firebase-admin";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const slugArg = args.find(a => a.startsWith("--slug="));
const SLUG = slugArg ? slugArg.split("=")[1] : "mrcet";

const serviceAccount = JSON.parse(readFileSync(join(__dirname, "service-account.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// lib/lessonBlocks.js can't be imported directly (it lives under the Next
// app, resolved as ESM there but this is a plain node script) - loaded as a
// data: URL instead, same technique test/lesson-blocks.test.mjs already uses.
const lessonBlocksSrc = readFileSync(
  join(__dirname, "..", "devert-frontend", "lib", "lessonBlocks.js"), "utf8",
);
const { parseLessonBlocks, STRUCTURED_VARIANTS, CALLOUT_VARIANTS } =
  await import(`data:text/javascript;base64,${Buffer.from(lessonBlocksSrc).toString("base64")}`);
const KNOWN_VARIANTS = new Set([...CALLOUT_VARIANTS, ...STRUCTURED_VARIANTS, "quote"]);

const snap = await db.collection(`institutions/${SLUG}/learningTracks/aptitude/items`).get();
const days = snap.docs.map(d => ({ id: d.id, ...d.data() }));

let problems = 0;
const fail = (label, msg) => { console.error(`FAIL  ${label}: ${msg}`); problems++; };

console.log(`Found ${days.length} day(s) under institutions/${SLUG}/learningTracks/aptitude/items.\n`);
if (days.length !== 30) fail("count", `expected 30 days, found ${days.length}`);

for (const day of days.sort((a, b) => a.date.localeCompare(b.date))) {
  const label = `${day.date} (${day.title || "untitled"})`;

  if (day.status !== "published") fail(label, `status is "${day.status}", expected "published"`);
  if (!day.weekId) fail(label, "missing weekId");

  const mcqs = day.mcqs || [];
  if (mcqs.length < 10 || mcqs.length > 15) fail(label, `${mcqs.length} mcqs (expected 10-15)`);
  const ids = new Set();
  mcqs.forEach(q => {
    if (ids.has(q.id)) fail(label, `duplicate mcq id ${q.id}`);
    ids.add(q.id);
    if (typeof q.correctIndex !== "number" || q.correctIndex < 0 || q.correctIndex >= (q.options || []).length) {
      fail(label, `mcq ${q.id} correctIndex out of range`);
    }
    if (!q.text?.trim()) fail(label, `mcq ${q.id} has empty text`);
    if (!q.explanation?.trim()) fail(label, `mcq ${q.id} has no explanation`);
  });

  const tq = day.timedQuiz;
  if (!tq || tq.mcqIds?.length !== 5) fail(label, "timedQuiz must reference exactly 5 mcqIds");
  else if (!tq.mcqIds.every(id => ids.has(id))) fail(label, "timedQuiz references an unknown mcq id");
  if (tq && (!tq.timeLimitSeconds || tq.timeLimitSeconds <= 0)) fail(label, "timedQuiz.timeLimitSeconds must be positive");

  // Parse the concept and confirm every fence variant used is one the
  // renderer actually knows how to draw - an unknown variant still parses
  // (falls back to a plain callout, per the parser's own design), so this
  // is a content-quality check, not a parser-safety one: a typo'd variant
  // name should be caught here, not shipped as a slightly-wrong-looking card.
  let blocks;
  try {
    blocks = parseLessonBlocks(day.concept || "");
  } catch (e) {
    fail(label, `concept failed to parse: ${e.message}`);
    continue;
  }
  const walk = (bs) => bs.forEach(b => {
    if (b.type === "callout" && !KNOWN_VARIANTS.has(b.variant)) fail(label, `unknown callout variant "${b.variant}"`);
    if (b.blocks) walk(b.blocks);
  });
  walk(blocks);

  const hasCheckpoint = blocks.some(b => b.type === "checkpoint");
  if (!hasCheckpoint) fail(label, "no ::: checkpoint block found");
  const hasRevision = blocks.some(b => b.type === "callout" && b.variant === "revision");
  if (!hasRevision) fail(label, "no ::: revision callout found");
}

console.log(problems === 0 ? "\nAll checks passed." : `\n${problems} problem(s) found.`);
process.exit(problems === 0 ? 0 : 1);
