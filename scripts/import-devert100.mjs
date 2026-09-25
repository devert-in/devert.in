// Loads the DeVert 100 curriculum produced by scripts/extract-devert100.mjs
// into Firestore. Content only - it never touches a participant's progress.
//
// Usage:
//   node scripts/import-devert100.mjs              # dry run, writes nothing
//   node scripts/import-devert100.mjs --apply
//   node scripts/import-devert100.mjs --apply --only 1,2,3
//
// WHAT IT WRITES
//
//   devert100_days/{day}   one document per day (1..100), each carrying that
//                          day's topic, pattern guide and full problems array.
//
//   devert100_meta/index   ONE document holding a 100-entry summary array.
//                          The journey grid renders 100 cards; pulling 100 full
//                          day documents to draw them would move roughly half a
//                          megabyte for a screen that displays none of the
//                          problem statements. This is the read the grid makes.
//                          It is derived, never authored - re-running this
//                          script rebuilds it from the day documents.
//
// SAFE TO RE-RUN. Days are written with merge:false so a re-import is a clean
// replacement of content (an edited spreadsheet should be able to REMOVE a
// bonus problem, which merge would silently keep forever). Participant progress
// lives in a different collection entirely and is never read or written here,
// so re-importing cannot cost anyone their streak.

import { readFileSync, readdirSync, existsSync } from "fs";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const argv = process.argv.slice(2);
const APPLY = argv.includes("--apply");
const onlyArg = argv.indexOf("--only");
const ONLY = onlyArg !== -1
  ? new Set(argv[onlyArg + 1].split(",").map(s => Number(s.trim())).filter(Boolean))
  : null;

const IN = "scripts/data/devert100-days.json";
const payload = JSON.parse(readFileSync(IN, "utf8"));
const { days, cheatsheet, counts } = payload;

if (!Array.isArray(days) || days.length !== 100) {
  console.error(`FAILED: ${IN} holds ${days?.length} days, expected 100. Re-run scripts/extract-devert100.mjs.`);
  process.exit(1);
}

initializeApp({ credential: cert(JSON.parse(readFileSync("scripts/service-account.json", "utf8"))) });
const db = getFirestore();

// Exactly the fields a journey-grid card renders, and nothing else - adding a
// field here grows a document that is read on every dashboard load.
function indexEntry(d) {
  const main = d.problems.find(p => p.type === "Main") || d.problems[0];
  return {
    day: d.day,
    week: d.week,
    topic: d.topic,
    name: main?.name || "",
    difficulty: main?.difficulty || "",
    pattern: main?.pattern || "",
    // Carried so the grid and the dashboard's mission card can show "LC 283"
    // without fetching the full day document. problemLabel() in
    // lib/devert100.js turns these two into the badge.
    problemNumber: main?.problemNumber || "",
    platform: main?.platform || "",
    bonusCount: d.problems.filter(p => p.type !== "Main").length,
  };
}

// ── deep dives ────────────────────────────────────────────────────────────
// The spreadsheet's Brute Force / Optimal columns are ONE LINE each. The
// long-form teaching writeup - worked example, step-by-step optimisation, Java
// implementation, edge cases - does not exist in it and cannot be derived from
// it, so it is authored by hand, one markdown file per day, in
// scripts/data/devert100-deepdives/day-NNN.md.
//
// FORMAT: sections delimited by a line reading `=== key ===`. Keys must match
// DEEP_DIVE_SECTIONS in components/devert100/deep-dive.jsx; an unknown key is
// reported rather than silently dropped, because a typo'd heading would
// otherwise just make a section vanish from the page with no other symptom.
//
// A day with no file keeps the short spreadsheet fields and the UI renders
// those instead. Nothing is generated to fill the gap.
const DEEP_DIVE_DIR = "scripts/data/devert100-deepdives";
const DEEP_DIVE_KEYS = new Set([
  "intro", "problem", "pattern", "bruteForce", "optimization",
  "complexity", "implementation", "edgeCases", "takeaway",
]);

// LF and CR as character codes rather than escapes: these markdown files are
// authored on Windows and every line ending matters inside a fenced code
// block, so the one place that splits them should be impossible to misread.
const LF = String.fromCharCode(10);
const CR = String.fromCharCode(13);

function parseDeepDive(text, file) {
  const out = {};
  let key = null, buf = [];
  const flush = () => { if (key) out[key] = buf.join(LF).trim(); buf = []; };
  for (const rawLine of text.split(LF)) {
    const line = rawLine.endsWith(CR) ? rawLine.slice(0, -1) : rawLine;
    const m = line.match(/^===\s*([A-Za-z]+)\s*===\s*$/);
    if (m) {
      flush();
      key = m[1];
      if (!DEEP_DIVE_KEYS.has(key)) {
        console.error(`  ! ${file}: unknown section "${key}" - expected one of ${[...DEEP_DIVE_KEYS].join(", ")}`);
        process.exit(1);
      }
    } else if (key) {
      buf.push(line);
    }
  }
  flush();
  return out;
}

function loadDeepDives() {
  if (!existsSync(DEEP_DIVE_DIR)) return {};
  const byDay = {};
  for (const f of readdirSync(DEEP_DIVE_DIR).filter(f => f.endsWith(".md"))) {
    const m = f.match(/day-(\d+)\.md$/);
    if (!m) { console.error(`  ! ${f}: expected day-NNN.md`); process.exit(1); }
    byDay[Number(m[1])] = parseDeepDive(readFileSync(`${DEEP_DIVE_DIR}/${f}`, "utf8"), f);
  }
  return byDay;
}

const deepDives = loadDeepDives();
// Attached to the day's MAIN problem - the deep dive teaches that one problem,
// and a bonus has its own (usually absent) writeup.
for (const d of days) {
  const dd = deepDives[d.day];
  if (!dd) continue;
  const main = d.problems.find(p => p.type === "Main") || d.problems[0];
  if (main) main.deepDive = dd;
}

const targets = days.filter(d => !ONLY || ONLY.has(d.day));

console.log(`${IN}: ${counts.days} days, ${counts.problems} problems (${counts.main} main + ${counts.bonus} bonus)`);
console.log(`deep dives authored: ${Object.keys(deepDives).length}/100  ${Object.keys(deepDives).length ? "(days " + Object.keys(deepDives).sort((a,b)=>a-b).join(", ") + ")" : ""}`);
console.log(`${APPLY ? "APPLYING" : "DRY RUN"} - ${targets.length} day document(s)${ONLY ? ` (--only ${[...ONLY].join(",")})` : ""}\n`);

if (!APPLY) {
  for (const d of targets.slice(0, 3)) {
    const main = d.problems.find(p => p.type === "Main");
    console.log(`  day ${String(d.day).padStart(3)}  wk${d.week}  ${d.topic}`);
    console.log(`           ${main.name} (${main.difficulty}, ${main.pattern})  +${d.problems.length - 1} bonus`);
    console.log(`           guide: ${d.patternGuide ? "yes" : "NONE"}   statement ${main.statement.length}ch`);
  }
  if (targets.length > 3) console.log(`  ... and ${targets.length - 3} more`);
  console.log(`\n  index doc would carry ${days.length} entries, ~${Math.round(JSON.stringify(days.map(indexEntry)).length / 1024)}KB`);
  console.log(`  cheatsheet: ${cheatsheet.length} topics`);
  console.log("\nNothing written. Re-run with --apply.");
  process.exit(0);
}

// Batched in fifties. Firestore caps a batch at 500 writes, but the reason for
// fifty is the failure mode rather than the cap: a partial import should leave
// a small, obvious gap that re-running fixes, not an all-or-nothing 100-write
// commit that is hard to reason about halfway through.
let written = 0;
for (let i = 0; i < targets.length; i += 50) {
  const chunk = targets.slice(i, i + 50);
  const batch = db.batch();
  for (const d of chunk) {
    batch.set(db.doc(`devert100_days/${d.day}`), {
      day: d.day,
      week: d.week,
      topic: d.topic,
      patternGuide: d.patternGuide || null,
      problems: d.problems,
      updatedAt: new Date().toISOString(),
    });
  }
  await batch.commit();
  written += chunk.length;
  console.log(`  wrote days ${chunk[0].day}..${chunk[chunk.length - 1].day}  (${written}/${targets.length})`);
}

// The index is always rebuilt from ALL 100 days even under --only: a partial
// index would silently hide days from the grid, which is a far worse failure
// than doing one extra small write.
await db.doc("devert100_meta/index").set({
  days: days.map(indexEntry),
  cheatsheet,
  totalDays: days.length,
  totalProblems: counts.problems,
  updatedAt: new Date().toISOString(),
});
console.log(`  wrote devert100_meta/index (${days.length} entries, ${cheatsheet.length} cheatsheet topics)`);

console.log(`\nDone. ${written} day document(s) + index.`);
