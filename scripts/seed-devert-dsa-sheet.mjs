// Seeds the flagship "DeVert DSA Sheet" - the ~29-section curated roadmap.
//
// A sheet owns NO problems: each section stores an ordered `problemIds` list
// referencing the existing problems/{id} docs, and progress is derived from the
// learner's existing user_codelab_progress. See lib/dsaSheets.js's header.
//
// HOW THE CURATION IS PRODUCED
// ----------------------------
// The data model stores EXPLICIT, ordered problem ids (so an admin can reorder
// any section freely, and the ordering is the editorial product). But nobody is
// going to hand-place 545 ids the first time, so this script derives a sane
// first-pass ordering from data that already exists:
//
//   section -> one or more CODELAB_CATEGORIES -> problems in that category,
//   split into Easy/Medium/Hard subsections, each ordered by the problem's own
//   `number` so it matches how DSA Practice already lists them.
//
// That Easy -> Medium -> Hard split within a topic is exactly the shape the
// reference sheets use ("Solve Problems on Arrays [Easy -> Medium -> Hard]").
// After this runs, the ids are concrete and editable - re-running does NOT
// clobber a hand-curated order unless --reorder is passed.
//
// Sections with no matching category are seeded EMPTY on purpose: they are real
// parts of the roadmap that need authored content (or concept lessons) rather
// than problems, and the script reports them explicitly so the authoring gap is
// visible instead of silently missing.
//
// Usage:
//   node scripts/seed-devert-dsa-sheet.mjs                (dry run)
//   node scripts/seed-devert-dsa-sheet.mjs --apply
//   node scripts/seed-devert-dsa-sheet.mjs --apply --reorder   (overwrite existing problemIds)
import admin from "firebase-admin";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(join(__dirname, "service-account.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

const db = admin.firestore();
const apply = process.argv.includes("--apply");
const reorder = process.argv.includes("--reorder");

const SHEET_ID = "devert-dsa";
const AUDIENCES = ["public", "legacy"];
const DIFFICULTY_ORDER = ["Easy", "Medium", "Hard"];

// The roadmap. `categories` maps a section to CODELAB_CATEGORIES values;
// `concepts` links it to dsaConceptTracks concept ids so "concept before
// problems" is honoured at the section level. An empty `categories` means the
// section is authored-content-only for now.
const SECTIONS = [
  { id: "basics", title: "Learn the Basics", categories: [], concepts: ["basics"], blurb: "Syntax, I/O, and the mental model you need before anything else." },
  { id: "logical-thinking", title: "Build Logical Thinking", categories: [], concepts: ["logical-thinking"], blurb: "Turning a problem statement into steps." },
  { id: "patterns", title: "Patterns", categories: [], concepts: ["patterns"], blurb: "Nested-loop pattern printing - cheap reps that build loop intuition." },
  { id: "collections", title: "Language Collections & STL", categories: [], concepts: ["collections"], blurb: "The built-in data structures you will lean on for everything after this." },
  { id: "math", title: "Math", categories: ["Math"], blurb: "Digits, GCD, primes, modular arithmetic." },
  { id: "recursion", title: "Recursion", categories: ["Recursion"], concepts: ["recursion"], blurb: "The idea every tree, graph and DP problem is built on." },
  { id: "hashing", title: "Hashing", categories: ["Hashing"], concepts: ["hashing"], blurb: "Trading memory for time - counting, frequency, lookup." },
  { id: "arrays", title: "Arrays", categories: ["Arrays"], concepts: ["arrays"], blurb: "Contiguous memory, and everything that follows from it." },
  { id: "strings", title: "Strings", categories: ["Strings"], concepts: ["strings"], blurb: "Arrays of characters, with their own traps." },
  { id: "binary-search", title: "Binary Search", categories: ["Binary Search", "Searching"], concepts: ["binary-search"], blurb: "1D, 2D, and searching an answer space rather than an array." },
  { id: "sorting", title: "Sorting", categories: ["Sorting"], concepts: ["sorting"], blurb: "The algorithms, and when sorting first is the whole solution." },
  { id: "linked-list", title: "Linked List", categories: ["Linked List"], concepts: ["linked-list"], blurb: "Pointers, and why insertion is suddenly cheap." },
  { id: "stacks", title: "Stacks", categories: ["Stack"], concepts: ["stacks"], blurb: "Last in, first out - and monotonic stacks." },
  { id: "queues", title: "Queues", categories: ["Queue"], concepts: ["queues"], blurb: "First in, first out - and deques." },
  { id: "trees", title: "Trees", categories: ["Trees"], blurb: "Traversals, depth, and recursive structure." },
  { id: "bst", title: "Binary Search Trees", categories: [], concepts: ["bst"], blurb: "Ordering invariants that make search logarithmic." },
  { id: "heaps", title: "Heaps & Priority Queues", categories: ["Heap"], blurb: "Always knowing the smallest or largest thing, cheaply." },
  { id: "greedy", title: "Greedy", categories: ["Greedy"], blurb: "When the locally best choice is provably globally best." },
  { id: "sliding-window", title: "Sliding Window", categories: ["Sliding Window"], concepts: ["sliding-window"], blurb: "Update the answer instead of recomputing it." },
  { id: "two-pointer", title: "Two Pointers", categories: ["Two Pointer"], concepts: ["two-pointers"], blurb: "Two indices doing the work of a nested loop." },
  { id: "backtracking", title: "Backtracking", categories: ["Backtracking"], blurb: "Systematic search with undo." },
  { id: "graphs", title: "Graphs", categories: ["Graphs"], blurb: "BFS, DFS, shortest paths, components." },
  { id: "dp", title: "Dynamic Programming", categories: ["Dynamic Programming"], blurb: "Stop recomputing what you already worked out." },
  { id: "advanced-dp", title: "Advanced DP", categories: [], concepts: ["advanced-dp"], blurb: "DP on trees, bitmasks, and digits." },
  { id: "bit-manipulation", title: "Bit Manipulation", categories: ["Bit Manipulation"], blurb: "Thinking in binary, and the tricks it unlocks." },
  { id: "trie", title: "Tries", categories: ["Trie"], blurb: "Prefix trees, for when strings share beginnings." },
  { id: "segment-tree", title: "Segment & Fenwick Trees", categories: [], concepts: ["segment-tree"], blurb: "Range queries with updates." },
  { id: "advanced", title: "Advanced Problems", categories: [], blurb: "Multi-concept problems that combine everything above." },
  { id: "mock-interviews", title: "Mock Interviews", categories: [], blurb: "Timed, mixed-topic sets that mimic the real thing." },
];

// ---------------------------------------------------------------------------

const problemsSnap = await db.collection("problems").where("status", "==", "published").get();
const problems = problemsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
console.log(`Loaded ${problems.length} published problems.\n`);

const byCategory = new Map();
for (const p of problems) {
  if (!p.category) continue;
  if (!byCategory.has(p.category)) byCategory.set(p.category, []);
  byCategory.get(p.category).push(p);
}

const usedIds = new Set();
let totalPlaced = 0, emptySections = 0;
const sectionDocs = [];

for (const [i, section] of SECTIONS.entries()) {
  // Pool the section's categories, then split by difficulty. `number` ordering
  // keeps a section consistent with how DSA Practice already lists problems;
  // problems without a number sort last but stay deterministic (by id).
  const pool = section.categories.flatMap(c => byCategory.get(c) || []);
  const subsections = [];

  for (const difficulty of DIFFICULTY_ORDER) {
    const matching = pool
      .filter(p => p.difficulty === difficulty)
      .sort((a, b) => (a.number ?? Number.MAX_SAFE_INTEGER) - (b.number ?? Number.MAX_SAFE_INTEGER)
        || String(a.id).localeCompare(String(b.id)));
    if (matching.length === 0) continue;
    matching.forEach(p => usedIds.add(p.id));
    subsections.push({
      id: difficulty.toLowerCase(),
      title: difficulty,
      problemIds: matching.map(p => p.id),
    });
  }

  const count = subsections.reduce((n, s) => n + s.problemIds.length, 0);
  totalPlaced += count;
  if (count === 0) emptySections++;

  sectionDocs.push({
    ref: db.collection("dsaSheets").doc(SHEET_ID).collection("sections").doc(section.id),
    data: {
      title: section.title,
      blurb: section.blurb,
      order: (i + 1) * 10,
      status: "published",
      audiences: AUDIENCES,
      conceptIds: section.concepts || [],
      subsections,
    },
    count,
    subCount: subsections.length,
  });

  const label = count === 0 ? "EMPTY - needs authored content" : `${count} problems in ${subsections.length} group(s)`;
  console.log(`${apply ? "SET " : "PLAN"} ${section.id.padEnd(18)} ${section.title.padEnd(30)} ${label}`);
}

// Coverage report: which published problems no sheet section claims. Printed
// because a silently-unreferenced problem is invisible to every learner
// following the sheet, which is exactly the kind of gap that goes unnoticed.
const unplaced = problems.filter(p => !usedIds.has(p.id));
const unplacedByCategory = {};
unplaced.forEach(p => {
  const k = p.category || "(no category)";
  unplacedByCategory[k] = (unplacedByCategory[k] || 0) + 1;
});

console.log(`\n${SECTIONS.length} sections - ${totalPlaced} problem slots placed, ${emptySections} section(s) empty.`);
console.log(`Coverage: ${usedIds.size}/${problems.length} published problems referenced.`);
if (unplaced.length) {
  console.log(`Unreferenced (${unplaced.length}): ${JSON.stringify(unplacedByCategory)}`);
}

if (apply) {
  await db.collection("dsaSheets").doc(SHEET_ID).set({
    title: "DeVert DSA Sheet",
    description: "Master DSA from the basics to advanced, concept-first, in a curated order.",
    order: 10,
    status: "published",
    audiences: AUDIENCES,
    sectionCount: SECTIONS.length,
    problemCount: totalPlaced,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });

  for (const s of sectionDocs) {
    // Without --reorder, never overwrite an existing section's problemIds: a
    // re-run is for picking up new problems and copy edits, not for silently
    // discarding a hand-curated order someone spent real effort on.
    const existing = await s.ref.get();
    const keepOrder = existing.exists && !reorder && (existing.get("subsections") || []).length > 0;
    const payload = keepOrder ? { ...s.data, subsections: existing.get("subsections") } : s.data;
    if (keepOrder) console.log(`  keep existing order for ${s.ref.id} (pass --reorder to replace)`);
    await s.ref.set({ ...payload, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
  }
  console.log("\nApplied.");
} else {
  console.log("\nDry run. Re-run with --apply to write.");
}
process.exit(0);
