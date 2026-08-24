// Seeds the flagship "DeVert Interview Sheet" - the most frequently asked
// coding-interview questions, grouped by topic, Easy -> Medium -> Hard.
//
// Same model as seed-devert-dsa-sheet.mjs and the same central rule: a sheet
// owns NO problems and NO progress. Each subsection stores an ordered
// `problemIds` list referencing existing problems/{id}; progress is derived from
// the learner's existing user_codelab_progress. A problem may appear in this
// sheet AND the DSA Sheet AND a company sheet - it is still one document.
//
// CURATION -> REFERENCES
// ----------------------
// The curation is an authored list of interview questions (scripts/
// interview-sheet-data.mjs). DeVert's problems carry no LeetCode id, so each
// title is resolved by tiered similarity - see that file's header for why exact
// matching is insufficient and why the REVIEW tier is deliberately NOT seeded.
//
// Unresolvable entries are simply omitted and REPORTED. That is safe by design:
// lib/dsaSheets.js's buildSection() drops any problemId that no longer resolves
// AND excludes it from the section totals, so a shorter section is always
// coherent, never a broken row or an unreachable 100%.
//
// Usage:
//   node scripts/seed-devert-interview-sheet.mjs                (dry run)
//   node scripts/seed-devert-interview-sheet.mjs --apply
//   node scripts/seed-devert-interview-sheet.mjs --apply --reorder
import admin from "firebase-admin";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import {
  SHEET, SECTION_BLURBS, resolveTitle, indexByNormalizedTitle, REFERENCEABLE,
} from "./interview-sheet-data.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(join(__dirname, "service-account.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

const db = admin.firestore();
const apply = process.argv.includes("--apply");
const reorder = process.argv.includes("--reorder");

const SHEET_ID = "devert-interview";
const AUDIENCES = ["public", "legacy"];
const DIFFICULTY_ORDER = ["Easy", "Medium", "Hard"];

const problemsSnap = await db.collection("problems").where("status", "==", "published").get();
const problems = problemsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
const byNorm = indexByNormalizedTitle(problems);
console.log(`Loaded ${problems.length} published problems.\n`);

const skipped = [];       // { section, lc, title, tier, candidate }
const sectionDocs = [];
let totalPlaced = 0;
const allReferenced = new Set();

for (const [i, [sectionTitle, entries]] of Object.entries(SHEET).entries()) {
  // Resolve first, then bucket by the problem's OWN difficulty - the spec's
  // "Easy -> Medium -> Hard, never mixed randomly" progression. Author order is
  // preserved inside each bucket, so the editorial sequence survives.
  const buckets = { Easy: [], Medium: [], Hard: [] };
  const seenInSection = new Set();

  for (const [lc, title] of entries) {
    const { tier, score, problem } = resolveTitle(title, problems, byNorm);

    if (!REFERENCEABLE.has(tier)) {
      skipped.push({ section: sectionTitle, lc, title, tier, candidate: problem?.title || null, score });
      continue;
    }
    // Two different curated titles can resolve to the same problem doc. Within
    // one section that would render the same row twice, so keep the first.
    if (seenInSection.has(problem.id)) continue;
    seenInSection.add(problem.id);

    const bucket = buckets[problem.difficulty];
    if (!bucket) {
      skipped.push({ section: sectionTitle, lc, title, tier: "NO-DIFFICULTY", candidate: problem.title, score });
      continue;
    }
    bucket.push(problem);
    allReferenced.add(problem.id);
  }

  const subsections = DIFFICULTY_ORDER
    .filter(d => buckets[d].length > 0)
    .map(d => ({ id: d.toLowerCase(), title: d, problemIds: buckets[d].map(p => p.id) }));

  const count = subsections.reduce((n, s) => n + s.problemIds.length, 0);
  totalPlaced += count;

  sectionDocs.push({
    ref: db.collection("dsaSheets").doc(SHEET_ID).collection("sections").doc(slug(sectionTitle)),
    data: {
      title: sectionTitle,
      blurb: SECTION_BLURBS[sectionTitle] || "",
      order: (i + 1) * 10,
      status: "published",
      audiences: AUDIENCES,
      conceptIds: [],
      subsections,
    },
    count,
  });

  const breakdown = DIFFICULTY_ORDER.map(d => `${d[0]}${buckets[d].length}`).join("/");
  console.log(`${apply ? "SET " : "PLAN"} ${slug(sectionTitle).padEnd(28)} `
    + `${String(count).padStart(2)}/${String(entries.length).padStart(2)} referenced  [${breakdown}]`);
}

function slug(s) {
  return String(s).toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

// The authoring gap, stated explicitly rather than silently dropped - same
// philosophy as the DSA Sheet seeder's EMPTY-section report.
const byTier = {};
skipped.forEach(s => { byTier[s.tier] = (byTier[s.tier] || 0) + 1; });

console.log(`\n${sectionDocs.length} sections - ${totalPlaced} problem slots placed.`);
console.log(`Distinct problems referenced: ${allReferenced.size}`);
console.log(`Entries not referenced: ${skipped.length} ${JSON.stringify(byTier)}`);

const review = skipped.filter(s => s.tier === "REVIEW");
if (review.length) {
  console.log(`\nREVIEW - closest match found but NOT seeded (confirm or reject by hand):`);
  review.forEach(s => console.log(`   ${s.section.padEnd(30)} LC ${String(s.lc).padEnd(5)} "${s.title}"\n`
    + `   ${" ".repeat(30)}   -> closest: "${s.candidate}" [${s.score.toFixed(2)}]`));
}

const unresolved = skipped.filter(s => s.tier === "UNRESOLVED");
if (unresolved.length) {
  console.log(`\nUNRESOLVED - no such problem in DeVert; needs authoring (${unresolved.length}):`);
  const uniq = [...new Set(unresolved.map(s => s.title))];
  uniq.forEach(t => console.log(`   - ${t}`));
}

if (!apply) {
  console.log(`\nDRY RUN - nothing written. Re-run with --apply to seed.`);
  process.exit(0);
}

await db.collection("dsaSheets").doc(SHEET_ID).set({
  title: "DeVert Interview Sheet",
  description: "The most frequently asked coding interview questions, grouped by topic and ordered easy to hard.",
  // 20, so it sorts directly after the DeVert DSA Sheet (order 10).
  order: 20,
  status: "published",
  audiences: AUDIENCES,
  sectionCount: sectionDocs.length,
  problemCount: totalPlaced,
  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
}, { merge: true });

for (const s of sectionDocs) {
  // Without --reorder, never overwrite an existing section's problemIds: a
  // re-run is for picking up newly-authored problems and copy edits, not for
  // discarding a hand-curated order. Same contract as the DSA Sheet seeder.
  const existing = await s.ref.get();
  const keepOrder = existing.exists && !reorder && (existing.get("subsections") || []).length > 0;
  const data = keepOrder ? { ...s.data, subsections: existing.get("subsections") } : s.data;
  await s.ref.set({ ...data, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
  if (keepOrder) console.log(`   kept existing curated order for ${s.ref.id}`);
}

console.log(`\nSeeded dsaSheets/${SHEET_ID} with ${sectionDocs.length} sections, ${totalPlaced} slots.`);
process.exit(0);
