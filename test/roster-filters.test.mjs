// Unit tests for the roster filter/sort logic (devert-frontend/lib/rosterFilters.js).
// Pure functions, no emulator.
//
// The fixture deliberately mirrors MRCET's REAL live distribution rather than
// tidy invented data, because the awkward parts of that data are exactly what
// this logic exists to handle:
//   - `year` holds a canonical string ("III Year"), so a plain string sort puts
//     "IV Year" before "II Year".
//   - roll numbers are alphanumeric AND mixed case in production ("24n31a66f1"
//     sits among 275 uppercase ones), so a plain localeCompare scatters that
//     student away from their cohort.
//   - one student in section "G" against 63 in "A", one in "ECE" against 274 in
//     "CSE(AI&ML)" - the long-tail values a facet list must still surface.
//
// Loaded via a base64 data: URL because devert-frontend/package.json declares no
// "type": "module" (same technique as test/audiences.test.mjs). rosterFilters.js
// imports DEPARTMENTS/YEARS across the "@/" alias, which a data: URL cannot
// resolve - so the real declarations are spliced in from institutions.js rather
// than duplicated here. If the canonical lists ever change, these tests follow
// them instead of silently testing a stale copy.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "fs";

const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8");

const institutions = read("../devert-frontend/lib/institutions.js");
const canonical = institutions
  .split("\n")
  .filter(l => /^export const (DEPARTMENTS|YEARS) =/.test(l))
  .join("\n")
  .replace(/^export /gm, "");
assert.match(canonical, /DEPARTMENTS/, "failed to lift DEPARTMENTS out of institutions.js");
assert.match(canonical, /YEARS/, "failed to lift YEARS out of institutions.js");

const source = read("../devert-frontend/lib/rosterFilters.js")
  .replace(/^import \{[^}]*\} from "@\/lib\/institutions";$/m, canonical);

const {
  DEFAULT_ROSTER_FILTERS, ROSTER_SORTS, PENDING_SORTS, UNSET,
  compareRollNumbers, compareYears, compareDepartments, compareNames,
  deriveRosterFacets, reconcileRosterFilters, applyRosterFilters, sortRoster,
  activeRosterChips, countActiveRosterFilters, sortNeedsStats, sortIsRanked,
  groupSortOptions,
} = await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);

// ---------------- fixture ----------------

const S = (uid, name, rollNumber, department, year, section, extra = {}) => ({
  uid, name, rollNumber, department, year, section, status: "approved",
  email: `${uid}@mrcet.ac.in`, classroomId: `${year}-${department}-${section}`, ...extra,
});

const ROSTER = [
  S("u1", "Nithisha Bobbala", "24N31A6635", "CSE(AI&ML)", "III Year", "A"),
  S("u2", "Arjun Reddy", "24N31A6689", "CSE(AI&ML)", "III Year", "A"),
  S("u3", "Kavya Sharma", "24N31A66U9", "CSE(AI&ML)", "III Year", "B"),
  // Lowercase roll number, exactly as it appears in production.
  S("u4", "Divya Rao", "24n31a66f1", "CSE(AI&ML)", "III Year", "B"),
  S("u5", "Sai Kumar", "24N31A6607", "CSE(AI&ML)", "II Year", "C"),
  S("u6", "Zara Khan", "24N31A6612", "CSE(AI&ML)", "IV Year", "A"),
  // The long-tail outliers.
  S("u7", "Rahul Verma", "33N31A6602", "ECE", "III Year", "G"),
  S("u8", "Meera Iyer", "24N31A66V1", "CSE", "II Year", "A", { status: "suspended" }),
  // Missing data: no section, no roll number, no name. Each is a real
  // possibility (a hand-created roster row, a half-finished CSV import).
  S("u9", "Priya Nair", "24N31A6698", "CSE(AI&ML)", "III Year", "", { classroomId: "" }),
  S("u10", "Ravi Teja", "", "CSE(AI&ML)", "IV Year", "D", { contestRestricted: true }),
  S("u11", "", "24N31A66Z9", "CSE(AI&ML)", "III Year", "D"),
];

const f = (patch = {}) => ({ ...DEFAULT_ROSTER_FILTERS, ...patch });
const uids = (rows) => rows.map(r => r.uid);
const rolls = (rows) => rows.map(r => r.rollNumber);

// ---------------- comparators ----------------

test("roll numbers sort naturally, not lexically", () => {
  // Lexically "24N31A66100" < "24N31A6620" because "1" < "2" at the 9th char.
  const rows = [
    { rollNumber: "24N31A6620" }, { rollNumber: "24N31A66100" }, { rollNumber: "24N31A669" },
  ];
  assert.deepEqual(
    rows.slice().sort((a, b) => compareRollNumbers(a.rollNumber, b.rollNumber)).map(r => r.rollNumber),
    ["24N31A669", "24N31A6620", "24N31A66100"],
  );
});

test("roll number sort is case-insensitive, so production's lowercase row keeps its place", () => {
  // "24n31a66f1" must land between 66E-something and 66U9, not after every
  // uppercase roll (which is where a raw string compare puts lowercase letters).
  const sorted = rolls(sortRoster(ROSTER.filter(s => s.section === "B"), "rollAsc"));
  assert.deepEqual(sorted, ["24n31a66f1", "24N31A66U9"]);
});

test("roll number comparison is a total order even for numerically equal forms", () => {
  assert.ok(compareRollNumbers("A07", "A7") !== 0, "'A07' and 'A7' must not compare equal");
  assert.equal(compareRollNumbers("A7", "A7"), 0);
  // Antisymmetry, or Array#sort produces order-dependent garbage.
  assert.equal(Math.sign(compareRollNumbers("A07", "A7")), -Math.sign(compareRollNumbers("A7", "A07")));
});

test("years sort by canonical order, which a string compare gets wrong", () => {
  const shuffled = ["IV Year", "II Year", "III Year", "I Year"];
  assert.deepEqual(shuffled.slice().sort(compareYears), ["I Year", "II Year", "III Year", "IV Year"]);
  // The bug being guarded against: alphabetically "IV" precedes "II".
  assert.deepEqual(shuffled.slice().sort(), ["I Year", "II Year", "III Year", "IV Year"].sort());
  assert.ok(compareYears("II Year", "IV Year") < 0);
});

test("unrecognised departments and years sort after the canonical ones", () => {
  assert.ok(compareDepartments("CSE", "Basket Weaving") < 0);
  assert.ok(compareYears("III Year", "V Year") < 0);
});

// ---------------- the cascade ----------------

test("year facet narrows to the selected department, with that department's counts", () => {
  const all = deriveRosterFacets(ROSTER, f());
  assert.deepEqual(all.years.map(y => y.value), ["II Year", "III Year", "IV Year"]);

  // ECE has exactly one student, in III Year - so picking ECE must leave the
  // Year dropdown offering III Year alone.
  const ece = deriveRosterFacets(ROSTER, f({ department: "ECE" }));
  assert.deepEqual(ece.years, [{ value: "III Year", count: 1, label: "III Year" }]);
});

test("section facet narrows to the selected department AND year", () => {
  const facets = deriveRosterFacets(ROSTER, f({ department: "CSE(AI&ML)", year: "IV Year" }));
  // CSE(AI&ML) IV Year is Zara (A) and Ravi (D) - not the five III Year sections.
  assert.deepEqual(facets.sections.map(s => s.value), ["A", "D"]);
});

test("department facet ignores the year selection, so departments stay switchable", () => {
  // If the department list were itself narrowed by year, picking a year could
  // strand you in a department you cannot navigate out of.
  const facets = deriveRosterFacets(ROSTER, f({ year: "III Year" }));
  assert.deepEqual(facets.departments.map(d => d.value), ["CSE(AI&ML)", "CSE", "ECE"]);
});

test("departments come back in canonical order, not discovery order", () => {
  // DEPARTMENTS lists CSE(AI&ML) before CSE, so that is the order regardless of
  // which appears first in the roster array.
  const facets = deriveRosterFacets(ROSTER, f());
  assert.deepEqual(facets.departments.map(d => d.value), ["CSE(AI&ML)", "CSE", "ECE"]);
});

test("facet counts respect the active search and status", () => {
  const facets = deriveRosterFacets(ROSTER, f({ status: "suspended" }));
  assert.deepEqual(facets.departments, [{ value: "CSE", count: 1, label: "CSE" }]);
});

test("blank values become a selectable '(not set)' facet, listed last", () => {
  const facets = deriveRosterFacets(ROSTER, f({ department: "CSE(AI&ML)", year: "III Year" }));
  const last = facets.sections[facets.sections.length - 1];
  assert.equal(last.value, UNSET);
  assert.equal(last.label, "(not set)");
  assert.equal(last.count, 1); // Priya
});

test("selecting the '(not set)' facet matches exactly the rows missing that field", () => {
  assert.deepEqual(uids(applyRosterFilters(ROSTER, f({ section: UNSET }))), ["u9"]);
});

// ---------------- reconciliation ----------------

test("a stranded downstream selection resets instead of showing an empty list", () => {
  // Sitting on CSE(AI&ML) + IV Year, then switching to ECE (which has no IV
  // Year students). Left alone this renders zero rows with no explanation.
  const stranded = f({ department: "ECE", year: "IV Year", section: "A" });
  const fixed = reconcileRosterFilters(ROSTER, stranded);
  assert.equal(fixed.year, "all");
  assert.equal(fixed.section, "all");
  assert.equal(fixed.department, "ECE", "the selection the admin just made must survive");
  assert.ok(applyRosterFilters(ROSTER, fixed).length > 0);
});

test("a still-valid downstream selection is preserved across a department change", () => {
  // Both CSE(AI&ML) and ECE have III Year students, so switching between them
  // must NOT throw away the year - resetting unconditionally would be annoying.
  const kept = reconcileRosterFilters(ROSTER, f({ department: "ECE", year: "III Year" }));
  assert.equal(kept.year, "III Year");
});

test("reconciliation drops a stranded section but keeps a valid year", () => {
  const r = reconcileRosterFilters(ROSTER, f({ department: "CSE(AI&ML)", year: "II Year", section: "A" }));
  assert.equal(r.year, "II Year");
  assert.equal(r.section, "all", "CSE(AI&ML) II Year is section C only");
});

// ---------------- filtering ----------------

test("search spans name, roll number and email", () => {
  assert.deepEqual(uids(applyRosterFilters(ROSTER, f({ search: "nithisha" }))), ["u1"]);
  assert.deepEqual(uids(applyRosterFilters(ROSTER, f({ search: "66U9" }))), ["u3"]);
  assert.deepEqual(uids(applyRosterFilters(ROSTER, f({ search: "u7@mrcet" }))), ["u7"]);
});

test("search is case-insensitive in both directions", () => {
  // The query is folded AND the data is folded - production has lowercase rolls.
  assert.deepEqual(uids(applyRosterFilters(ROSTER, f({ search: "24N31A66F1" }))), ["u4"]);
  assert.deepEqual(uids(applyRosterFilters(ROSTER, f({ search: "ZARA" }))), ["u6"]);
});

test("status filter separates active from suspended", () => {
  assert.deepEqual(uids(applyRosterFilters(ROSTER, f({ status: "suspended" }))), ["u8"]);
  assert.equal(applyRosterFilters(ROSTER, f({ status: "approved" })).length, ROSTER.length - 1);
});

test("flag filters find the rows an admin needs to fix", () => {
  assert.deepEqual(uids(applyRosterFilters(ROSTER, f({ flag: "contestRestricted" }))), ["u10"]);
  assert.deepEqual(uids(applyRosterFilters(ROSTER, f({ flag: "noClassroom" }))), ["u9"]);
  // Missing name, roll number or section all count as incomplete.
  assert.deepEqual(uids(applyRosterFilters(ROSTER, f({ flag: "incompleteDetails" }))), ["u9", "u10", "u11"]);
});

test("filters compose - department AND year AND section AND status", () => {
  const rows = applyRosterFilters(ROSTER, f({
    department: "CSE(AI&ML)", year: "III Year", section: "A", status: "approved",
  }));
  assert.deepEqual(uids(rows), ["u1", "u2"]);
});

test("no filters returns the roster untouched", () => {
  assert.equal(applyRosterFilters(ROSTER, DEFAULT_ROSTER_FILTERS).length, ROSTER.length);
});

// ---------------- sorting ----------------

test("missing values sink to the bottom in BOTH directions", () => {
  // The invariant a naive `-comparator` breaks: reversing a comparator that
  // sinks blanks floats them to the top instead. "No roll number on file" is
  // absent data, never the highest-ranking value.
  const asc = sortRoster(ROSTER, "rollAsc");
  const desc = sortRoster(ROSTER, "rollDesc");
  assert.equal(asc[asc.length - 1].uid, "u10", "blank roll last ascending");
  assert.equal(desc[desc.length - 1].uid, "u10", "blank roll last descending too");

  const nameAsc = sortRoster(ROSTER, "nameAsc");
  const nameDesc = sortRoster(ROSTER, "nameDesc");
  assert.equal(nameAsc[nameAsc.length - 1].uid, "u11", "blank name last ascending");
  assert.equal(nameDesc[nameDesc.length - 1].uid, "u11", "blank name last descending too");
});

test("name sort is alphabetical and case/accent-insensitive", () => {
  const names = sortRoster(ROSTER, "nameAsc").map(s => s.name).filter(Boolean);
  assert.deepEqual(names, names.slice().sort((a, b) => compareNames(a, b)));
  assert.equal(names[0], "Arjun Reddy");
  assert.equal(names[names.length - 1], "Zara Khan");
});

test("cohortAsc is register order: department, then year, then section, then roll", () => {
  const rows = sortRoster(ROSTER, "cohortAsc");
  const key = rows.map(s => `${s.department}|${s.year}|${s.section}`);
  assert.deepEqual(key.slice(0, 3), [
    "CSE(AI&ML)|II Year|C", "CSE(AI&ML)|III Year|A", "CSE(AI&ML)|III Year|A",
  ]);
  // Within III Year A, roll order decides: ...6635 before ...6689.
  assert.deepEqual(uids(rows).slice(1, 3), ["u1", "u2"]);
  // Canonical department order puts every CSE(AI&ML) row ahead of CSE and ECE.
  assert.equal(rows[rows.length - 1].department, "ECE");
});

test("year sorts use canonical order, junior and senior first", () => {
  assert.equal(sortRoster(ROSTER, "yearAsc")[0].year, "II Year");
  assert.equal(sortRoster(ROSTER, "yearDesc")[0].year, "IV Year");
});

test("ranking sorts order by the fetched stat, highest first", () => {
  const stats = new Map([
    ["u1", { xp: 500, score: 40, problemsSolvedCount: 3, streak: 2 }],
    ["u2", { xp: 9000, score: 10, problemsSolvedCount: 1, streak: 30 }],
    ["u3", { xp: 100, score: 90, problemsSolvedCount: 12, streak: 0 }],
  ]);
  const rows = ROSTER.filter(s => stats.has(s.uid));
  assert.deepEqual(uids(sortRoster(rows, "xpDesc", { statsByUid: stats })), ["u2", "u1", "u3"]);
  assert.deepEqual(uids(sortRoster(rows, "scoreDesc", { statsByUid: stats })), ["u3", "u1", "u2"]);
  assert.deepEqual(uids(sortRoster(rows, "solvedDesc", { statsByUid: stats })), ["u3", "u1", "u2"]);
  assert.deepEqual(uids(sortRoster(rows, "streakDesc", { statsByUid: stats })), ["u2", "u1", "u3"]);
  // Lowest XP leads the needs-attention sort, and 0 is real data, not missing.
  assert.deepEqual(uids(sortRoster(rows, "xpAsc", { statsByUid: stats })), ["u3", "u1", "u2"]);
});

test("a student absent from the stats map ranks as 0 rather than crashing", () => {
  const stats = new Map([["u2", { xp: 10 }]]);
  const rows = ROSTER.slice(0, 3);
  const ranked = sortRoster(rows, "xpDesc", { statsByUid: stats });
  assert.equal(ranked[0].uid, "u2");
  assert.equal(ranked.length, 3);
});

test("ranking sorts fall back to name order when stats never loaded", () => {
  // Ordering everyone as 0 would silently render an arbitrary list that LOOKS
  // like a real ranking - the single most misleading outcome available here.
  assert.deepEqual(
    uids(sortRoster(ROSTER, "xpDesc")),
    uids(sortRoster(ROSTER, "nameAsc")),
  );
});

test("date sorts read the caller's field and sink unknown timestamps both ways", () => {
  const rows = [
    { uid: "a", requestedAt: { toMillis: () => 3000 } },
    { uid: "b", requestedAt: { toMillis: () => 1000 } },
    { uid: "c" }, // never stamped
  ];
  const opts = { dateField: "requestedAt" };
  assert.deepEqual(uids(sortRoster(rows, "joinedAsc", opts)), ["b", "a", "c"]);
  assert.deepEqual(uids(sortRoster(rows, "joinedDesc", opts)), ["a", "b", "c"]);
});

test("sorting never mutates the array it was given", () => {
  const before = uids(ROSTER);
  sortRoster(ROSTER, "rollDesc");
  sortRoster(ROSTER, "cohortAsc");
  sortRoster(ROSTER, "nameAsc");
  assert.deepEqual(uids(ROSTER), before);
});

test("every advertised sort key is implemented and reorders without dropping rows", () => {
  const stats = new Map(ROSTER.map(s => [s.uid, { xp: 1, score: 1, problemsSolvedCount: 1, streak: 1 }]));
  for (const o of [...ROSTER_SORTS, ...PENDING_SORTS]) {
    const rows = sortRoster(ROSTER, o.key, { statsByUid: stats });
    assert.equal(rows.length, ROSTER.length, `${o.key} changed the row count`);
    assert.deepEqual(new Set(uids(rows)), new Set(uids(ROSTER)), `${o.key} lost or duplicated a row`);
  }
});

test("only the performance sorts declare needsStats, and ranked implies needsStats", () => {
  assert.ok(sortNeedsStats("xpDesc"));
  assert.ok(!sortNeedsStats("rollAsc"));
  for (const o of ROSTER_SORTS) {
    if (o.ranked) assert.ok(o.needsStats, `${o.key} is ranked but not marked needsStats`);
  }
  // PENDING_SORTS must never need stats - a pending request has no users doc yet.
  for (const o of PENDING_SORTS) assert.ok(!o.needsStats, `${o.key} cannot need stats`);
});

test("sort options group in declaration order for the optgroup rendering", () => {
  const groups = groupSortOptions(ROSTER_SORTS);
  assert.deepEqual(groups.map(g => g.group), ["Alphabetical", "Roll number", "Cohort", "Joined", "Performance"]);
  assert.equal(groups.reduce((n, g) => n + g.options.length, 0), ROSTER_SORTS.length);
});

// ---------------- chips ----------------

test("chips describe each active filter and carry the field to reset", () => {
  const chips = activeRosterChips(f({ department: "ECE", year: "III Year", search: " kavya " }));
  assert.deepEqual(chips.map(c => c.field), ["search", "department", "year"]);
  assert.equal(chips[0].label, '"kavya"');
  assert.equal(chips[0].reset, "");
  assert.equal(chips[1].reset, "all");
});

test("resetting via a chip's own field clears exactly that filter", () => {
  const filters = f({ department: "ECE", year: "III Year" });
  const chip = activeRosterChips(filters).find(c => c.field === "year");
  const cleared = { ...filters, [chip.field]: chip.reset };
  assert.equal(cleared.year, "all");
  assert.equal(cleared.department, "ECE");
});

test("an empty or whitespace-only search is not an active filter", () => {
  assert.equal(countActiveRosterFilters(DEFAULT_ROSTER_FILTERS), 0);
  assert.equal(countActiveRosterFilters(f({ search: "   " })), 0);
  assert.equal(countActiveRosterFilters(f({ status: "suspended", flag: "noClassroom" })), 2);
});

test("the '(not set)' selection reads as '(not set)' in its chip, not as a raw sentinel", () => {
  const chip = activeRosterChips(f({ section: UNSET })).find(c => c.field === "section");
  assert.equal(chip.label, "Section (not set)");
  assert.ok(!chip.label.includes("__"));
});
