// Extracts the GATE 2027 CS + DA cohort plan from the authored workbook in
// "GATE/GATE_2027_Daily_Resources_Planner.xlsx" into a reviewable JSON file.
// It writes to disk and touches no database; scripts/import-gate-plan.mjs is
// what loads the result into Firestore.
//
// Usage:
//   node scripts/extract-gate-plan.mjs
//   node scripts/extract-gate-plan.mjs --out scripts/data/gate-plan.json
//
// ============================ READ THIS FIRST ============================
//
// WHAT THE WORKBOOK ACTUALLY CONTAINS, established by inspecting it rather
// than assumed:
//
//   1. 96 DAYS, NOT 100. "Daily Plan" runs D0 (Sun 27 Sep 2026, a setup day)
//      to D95 (Thu 31 Dec 2026): 1 Setup + 78 Topic + 13 "Sunday test" + 4
//      "Lock-in" rows. The day number is the unit of progress. This script
//      asserts all 96 are present, contiguous, and that every "Sunday test"
//      row really falls on a Sunday - the plan's whole weekly shape (Mon-Thu
//      main track, Fri-Sat second track, Sunday test) hangs off that.
//
//   2. EVERY LINK IS A HYPERLINK, NOT TEXT. Cells read "▶ GO Classes:
//      permutations and combinations" and carry the URL in the hyperlink
//      target. Reading the value alone gives you labels with nowhere to go.
//
//   3. THE LECTURE LINKS ARE YOUTUBE SEARCHES, NOT VIDEOS. The workbook says
//      so itself ("Start Here" sheet): its author could not browse YouTube, so
//      every lecture link is a search pre-filled with the channel and topic.
//      The UI must label them "Search YouTube", never "Watch lecture" - calling
//      a search a lecture is a small lie that costs trust the first time the
//      top result is the wrong video. Same for PYQ links: GATE Overflow
//      SEARCHES, not a curated question list.
//
//   4. THE TRACKING COLUMNS ARE EMPTY BY DESIGN. Status / Topic PYQs correct /
//      attempted / accuracy / Evening / GA / Main mistake are the workbook
//      user's own log, blank in every row (accuracy is a formula over the
//      blanks). They are per-user state that gate_plan_members owns in
//      Firestore. This script drops them - but keeps the Status dropdown's
//      vocabulary, which lib/gatePlan.js mirrors as LOG_STATUS.
//
//   5. THE "Formulas & key facts" CELL IS GROUPED. It is a bullet list that
//      can carry a second titled block ("Evening · Compiler Design:" in weeks
//      12-13, "GA · <theme>:" on Sundays). Parsed into titled groups so the
//      workspace can show the evening block under its own heading rather than
//      mixed into the day's own topic formulas.
//
//   6. NO QUESTIONS, NO ANSWERS. This plan points at PYQs; it does not contain
//      any. Scores are self-reported by the student after solving on GATE
//      Overflow. Nothing here grades anything, and the UI must not imply it.
//
//   7. THE DATES ARE THE PLAN'S, AND THEY ARE RIGHT. D0 = 2026-09-27. Unlike
//      DeVert 100's sheet, this workbook's dates agree with its own PDF plan
//      and with every weekday label. GATE_PLAN_START in lib/gatePlan.js is
//      still the single source of truth; this script only CHECKS the sheet's
//      dates against it and emits no date field, so re-exporting the sheet can
//      never silently move the calendar.

import { writeFileSync, mkdirSync } from "fs";
import { dirname } from "path";
import { createRequire } from "module";

// xlsx ships CJS and is a devert-frontend dependency - same arrangement as
// scripts/extract-devert100.mjs.
const require = createRequire(import.meta.url);
const XLSX = require("../devert-frontend/node_modules/xlsx");

const SRC = "GATE/GATE_2027_Daily_Resources_Planner.xlsx";
const START = "2026-09-27"; // must equal GATE_PLAN_START in devert-frontend/lib/gatePlan.js
const TOTAL = 96;

const argv = process.argv.slice(2);
const outArg = argv.indexOf("--out");
const OUT = outArg !== -1 ? argv[outArg + 1] : "scripts/data/gate-plan.json";

const s = (v) => String(v ?? "").trim();
const dash = (v) => (s(v) === "—" || s(v) === "-" ? "" : s(v));

const wb = XLSX.readFile(SRC);
const failures = [];
const warnings = [];

// ── helpers ───────────────────────────────────────────────────────────────

function sheetRows(name) {
  const ws = wb.Sheets[name];
  if (!ws) throw new Error(`Sheet "${name}" not found in ${SRC}.`);
  const range = XLSX.utils.decode_range(ws["!ref"]);
  const header = [];
  for (let c = range.s.c; c <= range.e.c; c++) header.push(s(ws[XLSX.utils.encode_cell({ r: range.s.r, c })]?.v));
  const rows = [];
  for (let r = range.s.r + 1; r <= range.e.r; r++) {
    const row = {};
    let any = false;
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cell = ws[XLSX.utils.encode_cell({ r, c })];
      if (!cell) continue;
      any = true;
      row[header[c - range.s.c]] = { v: cell.v, link: cell.l?.Target || "" };
    }
    if (any) rows.push(row);
  }
  return { header, rows, ws, range };
}

// "▶ GO Classes: permutations and combinations" + URL -> a link object.
// `source` is the channel/site before the colon, `label` the rest - the UI
// renders them separately ("GO Classes" as the chip, the topic as the text).
function linkOf(cell) {
  if (!cell) return null;
  const text = s(cell.v).replace(/^▶\s*/, "");
  const url = s(cell.link);
  if (!text || !/^https?:\/\//.test(url)) return null;
  const m = text.match(/^([^:]+):\s*(.+)$/);
  return {
    source: m ? m[1].trim() : "",
    label: m ? m[2].trim() : text,
    url,
    // What KIND of link this is, decided from the URL rather than the label,
    // so the UI can name it honestly (see note 3 above).
    kind: /youtube\.com\/results/.test(url) ? "youtube-search"
      : /gateoverflow\.in\/search/.test(url) ? "gateoverflow-search"
      : /google\.com\/search/.test(url) ? "google-search"
      : "link",
  };
}

// Bullet cell -> [{ title, items: [...] }]. A line ending in ":" that is not a
// bullet opens a new titled group; bullets go into the current group.
function groupsOf(text) {
  const groups = [];
  let cur = { title: "", items: [] };
  for (const raw of s(text).split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith("•")) { cur.items.push(line.replace(/^•\s*/, "")); continue; }
    if (line.endsWith(":")) {
      if (cur.items.length || cur.title) groups.push(cur);
      cur = { title: line.slice(0, -1).trim(), items: [] };
      continue;
    }
    cur.items.push(line);
  }
  if (cur.items.length || cur.title) groups.push(cur);
  return groups.filter(g => g.items.length);
}

// Sunday/lock-in "What to cover" cells are timed blocks, one per line:
// "Recall (25 min): blank-page recall of ..." -> { label, minutes, text }.
function blocksOf(text) {
  const lines = s(text).split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];
  return lines.map(line => {
    const m = line.match(/^([^():]+?)\s*\((\d+)\s*min\)\s*:\s*(.+)$/);
    return m ? { label: m[1].trim(), minutes: Number(m[2]), text: m[3].trim() } : { label: "", minutes: null, text: line };
  });
}

// The evening task names what it points back at. Parsing it lets the day view
// link "Revise D1 · Counting" straight to day 1 instead of printing a string.
function eveningOf(text) {
  const t = dash(text);
  if (!t) return { text: "", kind: "none", reviseDay: null, compilerSession: null };
  let m = t.match(/^Revise D(\d+)\s*·\s*(.+)$/);
  if (m) return { text: t, kind: "revise", reviseDay: Number(m[1]), topic: m[2].trim(), compilerSession: null };
  m = t.match(/^Compiler (\d+)\/(\d+)\s*·\s*(.+)$/);
  if (m) return { text: t, kind: "compiler", reviseDay: null, compilerSession: { n: Number(m[1]), of: Number(m[2]) }, topic: m[3].trim() };
  if (/^Second set/i.test(t)) return { text: t, kind: "second-set", reviseDay: null, compilerSession: null };
  return { text: t, kind: "other", reviseDay: null, compilerSession: null };
}

const TYPE = { "Setup": "setup", "Topic": "topic", "Sunday test": "sunday", "Lock-in": "lockin" };
const PAPER = { Both: "BOTH", CS: "CS", DA: "DA" };

// Dates are read as the raw Excel serial and decoded with SSF, NOT through
// cellDates: xlsx builds those Date objects with a sub-minute timezone skew
// that lands them on the previous calendar day east of UTC (every one of the
// 96 rows read one day early in IST). The serial has no zone to get wrong.
function isoOf(v) {
  if (typeof v === "number") {
    const d = XLSX.SSF.parse_date_code(v);
    return `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`;
  }
  return s(v).slice(0, 10);
}

function planDate(day) {
  const [y, m, d] = START.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + day)).toISOString().slice(0, 10);
}

// ── Daily Plan ────────────────────────────────────────────────────────────

const plan = sheetRows("Daily Plan");
const days = [];

for (const row of plan.rows) {
  const dayLabel = s(row["Day"]?.v);
  const m = dayLabel.match(/^D(\d+)$/);
  if (!m) { warnings.push(`Daily Plan: skipped a row with Day="${dayLabel}"`); continue; }
  const day = Number(m[1]);

  const sheetDate = isoOf(row["Date"]?.v);
  if (sheetDate !== planDate(day)) failures.push(`D${day}: sheet date ${sheetDate} != plan date ${planDate(day)} (START=${START}).`);

  const type = TYPE[s(row["Type"]?.v)];
  if (!type) failures.push(`D${day}: unknown Type "${s(row["Type"]?.v)}".`);
  const weekday = new Date(`${planDate(day)}T00:00:00Z`).getUTCDay();
  if (type === "sunday" && weekday !== 0) failures.push(`D${day}: "Sunday test" on a non-Sunday (${planDate(day)}).`);
  if (type === "topic" && weekday === 0) failures.push(`D${day}: topic day on a Sunday (${planDate(day)}).`);

  const paper = PAPER[s(row["Paper"]?.v)];
  if (!paper) failures.push(`D${day}: unknown Paper "${s(row["Paper"]?.v)}".`);

  const cover = s(row["What to cover today"]?.v);
  const formulas = groupsOf(row["Formulas & key facts"]?.v);

  days.push({
    day,
    week: s(row["Week"]?.v),          // "Start" | "W1".."W13" | "Lock-in"
    subject: s(row["Subject"]?.v),
    topic: s(row["Topic"]?.v),
    paper,
    type,
    cover: blocksOf(cover).length ? "" : cover,
    blocks: blocksOf(cover),          // Sunday rows only; timed sub-blocks
    mustKnow: dash(row["Must-know"]?.v),
    formulas,
    lecture: { primary: linkOf(row["Lecture (primary)"]), backup: linkOf(row["Lecture (backup)"]) },
    pyqTarget: dash(row["PYQ target"]?.v),
    pyqs: { primary: linkOf(row["PYQs · GATE Overflow"]), backup: linkOf(row["PYQs · Google backup"]) },
    evening: {
      ...eveningOf(row["Evening task (Block B)"]?.v),
      lecture: linkOf(row["Evening lecture"]),
      pyqs: linkOf(row["Evening PYQs"]),
    },
    ga: {
      theme: dash(row["GA theme"]?.v),
      lecture: linkOf(row["GA lecture"]),
      pyqs: linkOf(row["GA PYQs"]),
    },
  });

  if (type === "topic" && !formulas.length) warnings.push(`D${day}: topic day with no formulas.`);
  if (type === "topic" && !linkOf(row["PYQs · GATE Overflow"])) failures.push(`D${day}: topic day with no GATE Overflow link.`);
}

days.sort((a, b) => a.day - b.day);
if (days.length !== TOTAL) failures.push(`Expected ${TOTAL} days, found ${days.length}.`);
days.forEach((d, i) => { if (d.day !== i) failures.push(`Days are not contiguous at index ${i} (found D${d.day}).`); });

const byType = days.reduce((m, d) => ({ ...m, [d.type]: (m[d.type] || 0) + 1 }), {});
if (byType.sunday !== 13) failures.push(`Expected 13 Sunday tests, found ${byType.sunday}.`);
if (byType.lockin !== 4) failures.push(`Expected 4 lock-in days, found ${byType.lockin}.`);

// Every "Revise D<n>" must point BACKWARDS at a real day - a forward or
// dangling reference would render as a link to a day the student has not had.
for (const d of days) {
  if (d.evening.reviseDay != null && !(d.evening.reviseDay < d.day && days[d.evening.reviseDay])) {
    failures.push(`D${d.day}: evening revises D${d.evening.reviseDay}, which is not an earlier day.`);
  }
}

// ── Formula Bank ──────────────────────────────────────────────────────────
// One row per formula, already tagged with day/week/subject/paper. Kept as its
// own flat list (rather than re-derived from the day cells) because it is what
// the workbook's author curated as the revision bank - 523 rows, filterable.

const bank = sheetRows("Formula Bank");
const formulas = [];
for (const row of bank.rows) {
  const dm = s(row["Day"]?.v).match(/^D(\d+)$/);
  const text = s(row["Formula / key fact"]?.v);
  if (!dm || !text) continue;
  formulas.push({
    day: Number(dm[1]),
    week: s(row["Week"]?.v),
    subject: s(row["Subject"]?.v),
    topic: s(row["Topic"]?.v),
    paper: PAPER[s(row["Paper"]?.v)] || "BOTH",
    n: Number(row["#"]?.v) || 0,
    text,
  });
}
if (formulas.length !== 523) failures.push(`Expected 523 formula rows (the workbook's own "Start Here" count), found ${formulas.length}.`);

// ── Resources ─────────────────────────────────────────────────────────────
// Two tables stacked in one sheet, each under its own title row, so this reads
// the grid by hand rather than through sheetRows()'s single-header assumption.

const rws = wb.Sheets["Resources"];
const rr = XLSX.utils.decode_range(rws["!ref"]);
const cellAt = (r, c) => {
  const x = rws[XLSX.utils.encode_cell({ r, c })];
  return x ? { v: x.v, link: x.l?.Target || "" } : null;
};
const channels = [];
const pyqSources = [];
let mode = null;
let language = "";
for (let r = rr.s.r; r <= rr.e.r; r++) {
  const a = s(cellAt(r, 0)?.v);
  if (!a) continue;
  if (a === "Subject") { mode = "channels"; continue; }
  if (a === "Source") { mode = "pyq"; continue; }
  if (a === "PYQ sources" || a.startsWith("Lecture channels")) { mode = null; continue; }
  if (a.startsWith("Language:")) { language = a.replace(/^Language:\s*/, ""); continue; }
  if (mode === "channels") {
    channels.push({
      subject: a,
      primary: { name: s(cellAt(r, 1)?.v), link: linkOf(cellAt(r, 2)) },
      backup: { name: s(cellAt(r, 3)?.v), link: linkOf(cellAt(r, 4)) },
      note: s(cellAt(r, 5)?.v),
    });
  } else if (mode === "pyq") {
    const l = cellAt(r, 1);
    pyqSources.push({ name: a, url: s(l?.link), use: s(cellAt(r, 2)?.v) });
  }
}
if (channels.length < 10) failures.push(`Expected the lecture-channel table, found ${channels.length} rows.`);
if (pyqSources.length < 4) failures.push(`Expected the PYQ-source table, found ${pyqSources.length} rows.`);

// ── write ─────────────────────────────────────────────────────────────────

if (warnings.length) console.warn(`${warnings.length} warning(s):\n  ${warnings.join("\n  ")}`);
if (failures.length) {
  console.error(`FAILED - ${failures.length} problem(s):\n  ${failures.join("\n  ")}`);
  process.exit(1);
}

const out = {
  source: SRC,
  start: START,
  extractedAt: new Date().toISOString(),
  counts: { days: days.length, ...byType, formulas: formulas.length, channels: channels.length, pyqSources: pyqSources.length },
  days,
  formulas,
  resources: { channels, pyqSources, language },
};

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(out, null, 2));
console.log(`Wrote ${OUT}`);
console.log(JSON.stringify(out.counts));
