// Extracts the DeVert 100 curriculum from the authored spreadsheet in
// "DeVert100 DSA Series/100_Days_DSA_Series.xlsx" into a reviewable JSON
// file. It writes to disk and touches no database;
// scripts/import-devert100.mjs is what loads the result into Firestore.
//
// Usage:
//   node scripts/extract-devert100.mjs
//   node scripts/extract-devert100.mjs --out scripts/data/devert100-days.json
//
// ============================ READ THIS FIRST ============================
//
// WHAT THE SPREADSHEET ACTUALLY CONTAINS, established by inspecting it rather
// than assumed. Unlike the GATE PDFs (see extract-gate-pyqs.mjs), this source
// is clean - the notes below are about SHAPE, not damage:
//
//   1. 112 PROBLEM ROWS, NOT 100. Exactly 100 are Type="Main" (one per day,
//      days 1..100 with no gaps) and 12 are Type="Bonus" - extra problems
//      hung off a day that already has its Main. The day is the unit of
//      progress; bonuses are optional and never gate completion. That is why
//      this script emits 100 DAY documents each carrying a `problems` array,
//      not 112 problem documents.
//
//   2. THE `Link` COLUMN IS A HYPERLINK, NOT TEXT. Every cell reads the word
//      "Open" and carries the real URL in the cell's hyperlink target. Reading
//      the cell VALUE gives you 112 rows of the string "Open". This script
//      reads cell.l.Target instead, and asserts all 112 resolved.
//
//   3. NO TEST CASES ANYWHERE. The sheet has Problem Statement, Brute Force,
//      Optimal Approach, Time, Space, Key Points and Interview Follow-ups -
//      but not one input/output example. So DeVert 100's workspace can offer
//      a scratch Run (lib/codelab.js's runCode, free-form stdin) but CANNOT
//      auto-grade: grading needs problems/{id}/hiddenTests, which exists only
//      for DeVert's own authored CodeLab problems. Day completion is therefore
//      self-reported and deliberately intentional. Do not invent test cases to
//      paper over this - the information is not in the input.
//
//   4. THE PROGRESS COLUMNS ARE EMPTY BY DESIGN. Status / Date Solved / Time
//      Taken / Confidence / Revise On / My Notes are the *spreadsheet user's*
//      tracking columns, blank in all 112 rows. They are not content; they are
//      the per-user state that devert100_participants owns in Firestore. This
//      script drops them.
//
//   5. `Planned Date` IS EMPTY, AND THE START DATE IS NOT THE SHEET'S. The
//      Dashboard sheet derives dates from an editable start cell holding
//      2026-09-24, but DeVert 100 runs from 2026-09-23 (set by the product,
//      not the spreadsheet - and the reason it is the right one: Day 100 then
//      lands exactly on 2026-12-31). DEVERT100_START in
//      devert-frontend/lib/devert100.js is the single source of truth for
//      that; this file deliberately emits NO dates at all, so re-exporting the
//      sheet can never silently move the calendar.
//
//      The run is a COHORT, not a per-user clock: day N is the same calendar
//      day for everyone, so a user who joins on day 30 joins on day 30 rather
//      than starting their own day 1.
//
//   6. TOPICS JOIN THE CHEATSHEET. Every one of the 14 distinct
//      `Topic / Concept` values also appears as a row in the "Pattern
//      Cheatsheet" sheet, which carries "When to Use / Recognise It" and a
//      "Template / Must-Remember" snippet. This script joins them onto each
//      day so the workspace can explain the pattern, and warns on any miss.

import { writeFileSync, mkdirSync } from "fs";
import { dirname } from "path";
import { createRequire } from "module";

// xlsx ships CJS; its .mjs wrapper has no default export. It is a
// devert-frontend dependency (already used by the admin bulk-import UI)
// rather than a root one, so resolve it from there.
const require = createRequire(import.meta.url);
const XLSX = require("../devert-frontend/node_modules/xlsx");

const SRC = "DeVert100 DSA Series/100_Days_DSA_Series.xlsx";
const PLAN = "100 Days Plan";
const CHEAT = "Pattern Cheatsheet";

const argv = process.argv.slice(2);
const outArg = argv.indexOf("--out");
const OUT = outArg !== -1 ? argv[outArg + 1] : "scripts/data/devert100-days.json";

const s = (v) => String(v ?? "").trim();

// Column headers, spelled exactly as the sheet spells them. Kept in one place
// because two of them are long enough to be easy to mistype into a silent
// empty string.
const COL = {
  day: "Day",
  week: "Week",
  topic: "Topic / Concept",
  type: "Type",
  name: "Problem Name",
  platform: "Platform",
  lc: "LC #",
  link: "Link",
  difficulty: "Difficulty",
  source: "Source (from your sheet)",
  pattern: "Pattern",
  statement: "Problem Statement",
  brute: "Brute Force",
  optimal: "Optimal Approach / Key Idea",
  time: "Time",
  space: "Space",
  keyPoints: "Key Points to Remember (edge cases & gotchas)",
  followUps: "Interview Follow-ups",
};

function fail(msg) {
  console.error("FAILED: " + msg);
  process.exit(1);
}

const wb = XLSX.readFile(SRC);
for (const needed of [PLAN, CHEAT]) {
  if (!wb.SheetNames.includes(needed)) fail(`sheet "${needed}" missing. Found: ${wb.SheetNames.join(", ")}`);
}

// ── pattern cheatsheet, keyed by topic ──
const cheatRows = XLSX.utils.sheet_to_json(wb.Sheets[CHEAT], { defval: "" });
const cheatKeys = Object.keys(cheatRows[0] || {});
const cheatsheet = {};
for (const row of cheatRows) {
  const topic = s(row[cheatKeys[0]]);
  if (!topic) continue;
  cheatsheet[topic] = {
    topic,
    whenToUse: s(row[cheatKeys[1]]),
    template: s(row[cheatKeys[2]]),
  };
}

// A few plan topics are COMPOSITES of two cheatsheet rows ("Two Pointers &
// Sliding Window" covers 8 days and the cheatsheet lists those two patterns
// separately). Splitting and merging is a real join, not invented content -
// but only when BOTH halves resolve, which is what keeps "Capstone (Design &
// Backtracking)" from being torn into two meaningless fragments. A topic that
// still does not resolve gets null and the UI hides the section.
function guideFor(topic) {
  if (cheatsheet[topic]) return cheatsheet[topic];
  const parts = topic.split(" & ").map(s);
  if (parts.length === 2 && parts.every(p => cheatsheet[p])) {
    const [a, b] = parts.map(p => cheatsheet[p]);
    return {
      topic,
      merged: [a.topic, b.topic],
      whenToUse: `${a.topic} - ${a.whenToUse}
${b.topic} - ${b.whenToUse}`,
      template: `${a.topic} - ${a.template}
${b.topic} - ${b.template}`,
    };
  }
  return null;
}

// ── the plan, with real hyperlink targets ──
const ws = wb.Sheets[PLAN];
const range = XLSX.utils.decode_range(ws["!ref"]);
let linkCol = null;
for (let c = range.s.c; c <= range.e.c; c++) {
  const h = ws[XLSX.utils.encode_cell({ r: 0, c })];
  if (h && s(h.v) === COL.link) linkCol = c;
}
if (linkCol === null) fail(`no "${COL.link}" column in "${PLAN}"`);

const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });
// sheet_to_json skips the header row, so data row i is spreadsheet row i+1.
const urls = rows.map((_, i) => {
  const cell = ws[XLSX.utils.encode_cell({ r: i + 1, c: linkCol })];
  return cell && cell.l && cell.l.Target ? s(cell.l.Target) : "";
});

const missingUrl = urls.filter(u => !u).length;
if (missingUrl) fail(`${missingUrl} of ${rows.length} rows have no hyperlink target - the Link column is hyperlink-only, so a missing one means the row has no problem URL at all.`);

// ── group into days ──
const byDay = new Map();
const warnings = [];

rows.forEach((row, i) => {
  const day = Number(s(row[COL.day]));
  if (!Number.isInteger(day) || day < 1 || day > 100) {
    warnings.push(`row ${i + 2}: unusable Day value "${s(row[COL.day])}" - skipped`);
    return;
  }
  const topic = s(row[COL.topic]);
  const guide = guideFor(topic);
  if (!guide) warnings.push(`row ${i + 2}: topic "${topic}" has no Pattern Cheatsheet entry (day will show no pattern guide)`);

  if (!byDay.has(day)) {
    byDay.set(day, {
      day,
      week: Number(s(row[COL.week])) || Math.ceil(day / 7),
      topic,
      patternGuide: guide,
      problems: [],
    });
  }

  const type = s(row[COL.type]) || "Main";
  byDay.get(day).problems.push({
    type,
    name: s(row[COL.name]),
    platform: s(row[COL.platform]),
    problemNumber: s(row[COL.lc]),
    url: urls[i],
    difficulty: s(row[COL.difficulty]),
    pattern: s(row[COL.pattern]),
    source: s(row[COL.source]),
    statement: s(row[COL.statement]),
    bruteForce: s(row[COL.brute]),
    optimal: s(row[COL.optimal]),
    timeComplexity: s(row[COL.time]),
    spaceComplexity: s(row[COL.space]),
    // Two rows have no key points and fourteen have no follow-ups. Emitted as
    // "" so the UI can hide the section rather than print an empty heading -
    // never filled in with invented content.
    keyPoints: s(row[COL.keyPoints]),
    followUps: s(row[COL.followUps]),
  });
});

const days = [...byDay.values()].sort((a, b) => a.day - b.day);

// Each day keeps its Main problem first, whatever order the sheet listed them
// in - the workspace leads with it and treats the rest as optional bonuses.
for (const d of days) {
  d.problems.sort((a, b) => (a.type === "Main" ? 0 : 1) - (b.type === "Main" ? 0 : 1));
}

// ── invariants. These are what catch a re-export of the sheet going wrong. ──
const problems = days.flatMap(d => d.problems);
const mains = problems.filter(p => p.type === "Main");
const errors = [];

if (days.length !== 100) errors.push(`expected 100 days, got ${days.length}`);
for (let n = 1; n <= 100; n++) if (!byDay.has(n)) errors.push(`day ${n} missing`);

// Exactly one Main per day is the core invariant: the Main problem IS the day,
// and the dashboard's "Day N / 100" is meaningless if a day has none or two.
for (const d of days) {
  const c = d.problems.filter(p => p.type === "Main").length;
  if (c !== 1) errors.push(`day ${d.day} has ${c} Main problems (expected exactly 1)`);
}
for (const p of problems) {
  if (!p.name) errors.push(`a problem has no name`);
  if (!/^https?:\/\//.test(p.url)) errors.push(`"${p.name}" has a non-http link: ${p.url}`);
}

if (errors.length) {
  console.error("\nINVARIANTS FAILED:");
  errors.slice(0, 25).forEach(e => console.error("  - " + e));
  if (errors.length > 25) console.error(`  ... and ${errors.length - 25} more`);
  process.exit(1);
}

const payload = {
  generatedAt: new Date().toISOString(),
  source: SRC,
  counts: {
    days: days.length,
    problems: problems.length,
    main: mains.length,
    bonus: problems.length - mains.length,
  },
  cheatsheet: Object.values(cheatsheet),
  days,
};

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(payload, null, 2) + "\n");

const tally = (arr, key) => arr.reduce((m, x) => ((m[x[key] || "-"] = (m[x[key] || "-"] || 0) + 1), m), {});
console.log(`wrote ${OUT}`);
console.log(`  days:     ${days.length}`);
console.log(`  problems: ${problems.length}  (${mains.length} main + ${problems.length - mains.length} bonus)`);
console.log(`  difficulty: ${JSON.stringify(tally(problems, "difficulty"))}`);
console.log(`  platform:   ${JSON.stringify(tally(problems, "platform"))}`);
console.log(`  topics:     ${new Set(days.map(d => d.topic)).size}, cheatsheet entries: ${Object.keys(cheatsheet).length}`);
console.log(`  no key points: ${problems.filter(p => !p.keyPoints).length}   no follow-ups: ${problems.filter(p => !p.followUps).length}`);
if (warnings.length) {
  console.log(`\n  ${warnings.length} warning(s):`);
  warnings.slice(0, 10).forEach(w => console.log("    - " + w));
}
