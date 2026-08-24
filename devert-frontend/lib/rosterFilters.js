// Filtering and sorting for institution student rosters - pure functions, no
// Firestore and no React, so the whole thing is unit-testable and shared by
// every roster surface (campus-manage's roster AND its pending-requests list).
//
// WHY CLIENT-SIDE. A roster is one small bounded collection already fetched in
// full by fetchRosterStudents (276 students at MRCET today, a few thousand at
// the largest institution imaginable). Firestore cannot do substring search,
// cannot sort case-insensitively, and cannot natural-sort an alphanumeric roll
// number - and every extra `where` combination would need its own composite
// index. Filtering in memory over an array we already hold costs nothing and
// supports combinations Firestore never could.
//
// THE CASCADE. Department -> Year -> Section is a real hierarchy, so each
// level's options are derived from the students that survive the levels ABOVE
// it: pick CSE(AI&ML) and the Year dropdown offers only the years that
// department actually has, with that department's counts. Options are derived
// from live data rather than from the canonical DEPARTMENTS/YEARS enums, so
// a value that only exists because of a bad CSV import still shows up and can
// be found - the counts are how an admin spots it (MRCET currently has one
// student in section "G" against 63 in "A", and one in department "ECE"
// against 274 in CSE(AI&ML); both are visible the moment you open the
// dropdown). Canonical order is applied on top, so the common case still
// reads I Year -> IV Year rather than in discovery order.

import { DEPARTMENTS, YEARS } from "@/lib/institutions";

export const DEFAULT_ROSTER_FILTERS = {
  search: "",
  department: "all",
  year: "all",
  section: "all",
  status: "all",
  flag: "any",
};

// Two deliberately separate axes rather than one merged dropdown: status and
// flag are independent, so "suspended AND contest-restricted" is expressible.
export const ROSTER_STATUSES = [
  { value: "all", label: "Any status" },
  { value: "approved", label: "Active" },
  { value: "suspended", label: "Suspended" },
];

export const ROSTER_FLAGS = [
  { value: "any", label: "No flag filter" },
  { value: "contestRestricted", label: "Contest-restricted" },
  { value: "notContestRestricted", label: "Not contest-restricted" },
  { value: "noClassroom", label: "Not in a classroom" },
  { value: "incompleteDetails", label: "Incomplete details" },
];

// `needsStats` marks a sort that reads users/{uid} (xp/score/streak/
// problemsSolvedCount), which the roster doc does NOT carry - the caller
// lazy-loads those only when one of these is picked. `ranked` marks the sorts
// where position in the list is itself the meaning, so the UI numbers the rows.
export const ROSTER_SORTS = [
  { key: "nameAsc", label: "Name (A - Z)", group: "Alphabetical" },
  { key: "nameDesc", label: "Name (Z - A)", group: "Alphabetical" },
  { key: "rollAsc", label: "Roll number (ascending)", group: "Roll number" },
  { key: "rollDesc", label: "Roll number (descending)", group: "Roll number" },
  { key: "cohortAsc", label: "Department, then year, then section", group: "Cohort" },
  { key: "yearAsc", label: "Year (junior first)", group: "Cohort" },
  { key: "yearDesc", label: "Year (senior first)", group: "Cohort" },
  { key: "sectionAsc", label: "Section (A - Z)", group: "Cohort" },
  { key: "joinedDesc", label: "Recently joined", group: "Joined" },
  { key: "joinedAsc", label: "Longest-standing", group: "Joined" },
  { key: "xpDesc", label: "Top rankers by XP", group: "Performance", needsStats: true, ranked: true },
  { key: "scoreDesc", label: "Top rankers by score", group: "Performance", needsStats: true, ranked: true },
  { key: "solvedDesc", label: "Most problems solved", group: "Performance", needsStats: true, ranked: true },
  { key: "streakDesc", label: "Longest streak", group: "Performance", needsStats: true, ranked: true },
  { key: "xpAsc", label: "Lowest XP (needs attention)", group: "Performance", needsStats: true },
];

// Pending join requests have no reviewedAt and no users/{uid} stats worth
// ranking - they aren't students yet. Waiting-longest leads, because that is
// the queue an admin is actually working through.
export const PENDING_SORTS = [
  { key: "joinedAsc", label: "Waiting longest", group: "Waiting" },
  { key: "joinedDesc", label: "Newest request", group: "Waiting" },
  { key: "nameAsc", label: "Name (A - Z)", group: "Alphabetical" },
  { key: "nameDesc", label: "Name (Z - A)", group: "Alphabetical" },
  { key: "rollAsc", label: "Roll number (ascending)", group: "Roll number" },
  { key: "rollDesc", label: "Roll number (descending)", group: "Roll number" },
  { key: "cohortAsc", label: "Department, then year, then section", group: "Cohort" },
];

export function sortNeedsStats(sortKey) {
  return !!ROSTER_SORTS.find(s => s.key === sortKey)?.needsStats;
}

export function sortIsRanked(sortKey) {
  return !!ROSTER_SORTS.find(s => s.key === sortKey)?.ranked;
}

export function groupSortOptions(options) {
  const groups = [];
  const byName = new Map();
  for (const o of options) {
    if (!byName.has(o.group)) {
      byName.set(o.group, { group: o.group, options: [] });
      groups.push(byName.get(o.group));
    }
    byName.get(o.group).options.push(o);
  }
  return groups;
}

// ---------------- comparators ----------------

// One definition of "absent", used by the facets (which value counts as
// "(not set)"), the hierarchy filter, and every sort. Whitespace counts as
// absent - a section of " " is a bad import, not a section named space.
function isBlank(v) {
  return v === undefined || v === null || String(v).trim() === "";
}

// Roll numbers are alphanumeric with embedded runs of digits
// ("24N31A6635", "24N31A66U9"), and the live roster is MIXED CASE - MRCET has
// "24n31a66f1" sitting among 275 uppercase ones. A plain localeCompare on the
// raw strings scatters that student away from its cohort, and a plain string
// compare also orders "...10" before "...9". So: case-fold, then compare
// digit-runs numerically and letter-runs lexically.
export function compareRollNumbers(a, b) {
  const ax = chunk(a);
  const bx = chunk(b);
  const n = Math.min(ax.length, bx.length);
  for (let i = 0; i < n; i++) {
    const x = ax[i], y = bx[i];
    const xNum = DIGITS.test(x), yNum = DIGITS.test(y);
    if (xNum && yNum) {
      const d = Number(x) - Number(y);
      if (d !== 0) return d < 0 ? -1 : 1;
      // Numerically equal but written differently ("07" vs "7"). Order by
      // the written form so the sort is total and stable rather than
      // leaving two distinct roll numbers arbitrarily interleaved.
      if (x.length !== y.length) return x.length - y.length;
    } else if (x !== y) {
      return x < y ? -1 : 1;
    }
  }
  return ax.length - bx.length;
}

const DIGITS = /^\d/;
function chunk(v) {
  return String(v ?? "").trim().toUpperCase().match(/\d+|\D+/g) || [];
}

export function compareNames(a, b) {
  return String(a ?? "").trim().localeCompare(String(b ?? "").trim(), undefined, {
    sensitivity: "base", numeric: true,
  });
}

// Canonical order first ("I Year" < "II Year" < ... - which a string compare
// gets wrong, since "IV" sorts before "II"), then anything unrecognised after
// it in stable alphabetical order rather than silently colliding at index -1.
export function compareYears(a, b) {
  const ia = YEARS.indexOf(a), ib = YEARS.indexOf(b);
  if (ia !== -1 && ib !== -1) return ia - ib;
  if (ia !== -1) return -1;
  if (ib !== -1) return 1;
  return compareNames(a, b);
}

export function compareDepartments(a, b) {
  const ia = DEPARTMENTS.indexOf(a), ib = DEPARTMENTS.indexOf(b);
  if (ia !== -1 && ib !== -1) return ia - ib;
  if (ia !== -1) return -1;
  if (ib !== -1) return 1;
  return compareNames(a, b);
}

export function millisOf(ts) {
  if (!ts) return 0;
  if (typeof ts.toMillis === "function") return ts.toMillis();
  if (typeof ts.toDate === "function") return ts.toDate().getTime();
  const t = new Date(ts).getTime();
  return Number.isFinite(t) ? t : 0;
}

// ---------------- facets (the cascade) ----------------

// Non-hierarchical filters apply at every level of the cascade, so the counts
// shown in the Year dropdown already reflect the active search and status.
function passesFlat(s, filters) {
  if (!matchesSearch(s, filters.search)) return false;
  if (!matchesStatus(s, filters.status)) return false;
  if (!matchesFlag(s, filters.flag)) return false;
  return true;
}

export function deriveRosterFacets(students, filters = DEFAULT_ROSTER_FILTERS) {
  const flat = (students || []).filter(s => passesFlat(s, filters));

  const inDept = filters.department === "all"
    ? flat : flat.filter(s => (s.department || "") === filters.department);
  const inYear = filters.year === "all"
    ? inDept : inDept.filter(s => (s.year || "") === filters.year);

  return {
    departments: tally(flat, "department", compareDepartments),
    years: tally(inDept, "year", compareYears),
    sections: tally(inYear, "section", compareNames),
  };
}

// Blank values are grouped under a real, selectable option rather than being
// dropped - "which of my 276 students has no section on file" is a question an
// admin needs to be able to ask, and silently hiding those rows from the facet
// is how they stay unfixed forever.
export const UNSET = "__unset__";

function tally(rows, field, cmp) {
  const counts = new Map();
  for (const r of rows) {
    const raw = r[field];
    const v = isBlank(raw) ? UNSET : raw;
    counts.set(v, (counts.get(v) || 0) + 1);
  }
  const out = [...counts.entries()]
    .filter(([v]) => v !== UNSET)
    .sort((a, b) => cmp(a[0], b[0]))
    .map(([value, count]) => ({ value, count, label: String(value) }));
  const unset = counts.get(UNSET);
  if (unset) out.push({ value: UNSET, count: unset, label: "(not set)" });
  return out;
}

// Changing an upstream level can strand a downstream selection on a value that
// no longer exists ("CSE(AI&ML) + IV Year", then switch to ECE which has no IV
// Year students). Left alone that renders an empty list with no explanation, so
// a stranded selection is dropped back to "all". Called from the change handler
// rather than an effect - it is a pure function of the new filters, and
// react-hooks/set-state-in-effect rightly forbids the effect version.
export function reconcileRosterFilters(students, filters) {
  let next = { ...filters };
  const facets = deriveRosterFacets(students, { ...next, year: "all", section: "all" });
  const hasYear = facets.years.some(y => y.value === next.year);
  if (next.year !== "all" && !hasYear) next = { ...next, year: "all", section: "all" };

  const withYear = deriveRosterFacets(students, { ...next, section: "all" });
  const hasSection = withYear.sections.some(s => s.value === next.section);
  if (next.section !== "all" && !hasSection) next = { ...next, section: "all" };

  return next;
}

// ---------------- filtering ----------------

function matchesSearch(s, search) {
  const q = String(search || "").trim().toLowerCase();
  if (!q) return true;
  // Email and phone are included because an admin chasing a support ticket has
  // the email, not the roll number. Every one of these is already on the
  // roster doc - no extra reads.
  return [s.name, s.rollNumber, s.email, s.phone, s.department, s.section]
    .some(v => String(v || "").toLowerCase().includes(q));
}

function matchesStatus(s, status) {
  if (!status || status === "all") return true;
  // A roster doc written before the status field existed reads as active,
  // matching how fetchRosterStudents' own where("status","in",[...]) treats it.
  return (s.status || "approved") === status;
}

function matchesFlag(s, flag) {
  switch (flag) {
    case "contestRestricted": return !!s.contestRestricted;
    case "notContestRestricted": return !s.contestRestricted;
    case "noClassroom": return !s.classroomId;
    case "incompleteDetails":
      return !s.name || !s.rollNumber || !s.department || !s.year || !s.section;
    default: return true;
  }
}

function matchesHierarchy(s, filters) {
  for (const field of ["department", "year", "section"]) {
    const want = filters[field];
    if (!want || want === "all") continue;
    const have = s[field];
    if (want === UNSET ? !isBlank(have) : have !== want) return false;
  }
  return true;
}

export function applyRosterFilters(students, filters = DEFAULT_ROSTER_FILTERS) {
  return (students || []).filter(s => passesFlat(s, filters) && matchesHierarchy(s, filters));
}

// ---------------- sorting ----------------

// Wraps a comparator so absent values always come last, whichever side they are
// on. Used by the multi-key cohort sort, where partitioning per level isn't an
// option - each level is only a tiebreaker for the one above it.
function blankLast(cmp) {
  return (a, b) => {
    const ea = isBlank(a), eb = isBlank(b);
    if (ea && eb) return 0;
    if (ea) return 1;
    if (eb) return -1;
    return cmp(a, b);
  };
}

function partitionBlank(rows, valueOf) {
  const present = [], blank = [];
  for (const r of rows) (isBlank(valueOf(r)) ? blank : present).push(r);
  return { present, blank };
}

function by(rows, valueOf, cmp, desc) {
  const { present, blank } = partitionBlank(rows, valueOf);
  present.sort((a, b) => {
    const d = cmp(valueOf(a), valueOf(b));
    return desc ? -d : d;
  });
  return [...present, ...blank];
}

// Stats default to 0 rather than counting as missing: a student genuinely on
// 0 XP belongs at the bottom of the ranking, which is exactly where they land
// - it is real data, not an absent field.
function numeric(rows, valueOf, desc) {
  return [...rows].sort((a, b) => {
    const d = (valueOf(a) || 0) - (valueOf(b) || 0);
    return desc ? -d : d;
  });
}

// Dates are the opposite case: millisOf returns 0 for a missing timestamp, and
// 0 is not "1970", it is "we don't know". Sorting ascending on that would put
// every unknown at the head of "longest-standing" and claim they joined first,
// so unknowns are partitioned to the bottom in both directions instead.
function byDate(rows, valueOf, desc) {
  const present = [], unknown = [];
  for (const r of rows) (valueOf(r) > 0 ? present : unknown).push(r);
  present.sort((a, b) => (desc ? valueOf(b) - valueOf(a) : valueOf(a) - valueOf(b)));
  return [...present, ...unknown];
}

/**
 * @param students  already-filtered rows
 * @param sortKey   a key from ROSTER_SORTS / PENDING_SORTS
 * @param opts.statsByUid  Map|object of uid -> users/{uid} data, for the
 *                         `needsStats` sorts. Absent -> those sorts fall back
 *                         to name order instead of silently ordering by 0.
 * @param opts.dateField   which timestamp the joined/waiting sorts read
 *                         ("reviewedAt" for the roster, "requestedAt" for
 *                         pending requests).
 */
export function sortRoster(students, sortKey, opts = {}) {
  const rows = students || [];
  const { statsByUid, dateField = "reviewedAt" } = opts;
  const stat = (field) => (s) => {
    const src = statsByUid instanceof Map ? statsByUid.get(s.uid) : statsByUid?.[s.uid];
    return src?.[field] || 0;
  };
  const when = (s) => millisOf(s[dateField]);

  if (sortNeedsStats(sortKey) && !statsByUid) return by(rows, s => s.name, compareNames, false);

  switch (sortKey) {
    case "nameAsc": return by(rows, s => s.name, compareNames, false);
    case "nameDesc": return by(rows, s => s.name, compareNames, true);
    case "rollAsc": return by(rows, s => s.rollNumber, compareRollNumbers, false);
    case "rollDesc": return by(rows, s => s.rollNumber, compareRollNumbers, true);
    case "yearAsc": return by(rows, s => s.year, compareYears, false);
    case "yearDesc": return by(rows, s => s.year, compareYears, true);
    case "sectionAsc": return by(rows, s => s.section, compareNames, false);
    // The register-order sort: cohort first, then roll number inside it, so a
    // printed/exported roster reads the way a department office expects.
    // Every level is blank-last, matching the single-key sorts - a student with
    // no section on file belongs at the END of their year, not ahead of section
    // A, which is where a raw compare puts an empty string.
    case "cohortAsc": return [...rows].sort((a, b) =>
      blankLast(compareDepartments)(a.department, b.department)
      || blankLast(compareYears)(a.year, b.year)
      || blankLast(compareNames)(a.section, b.section)
      || blankLast(compareRollNumbers)(a.rollNumber, b.rollNumber));
    case "joinedAsc": return byDate(rows, when, false);
    case "joinedDesc": return byDate(rows, when, true);
    case "xpDesc": return numeric(rows, stat("xp"), true);
    case "xpAsc": return numeric(rows, stat("xp"), false);
    case "scoreDesc": return numeric(rows, stat("score"), true);
    case "solvedDesc": return numeric(rows, stat("problemsSolvedCount"), true);
    case "streakDesc": return numeric(rows, stat("streak"), true);
    default: return rows;
  }
}

// ---------------- active-filter summary ----------------

// Drives the removable chip row. Each chip carries the single field to reset,
// so "clear just the year" needs no per-chip wiring in the component.
export function activeRosterChips(filters) {
  const chips = [];
  const label = (v) => (v === UNSET ? "(not set)" : v);
  if (filters.search?.trim()) chips.push({ field: "search", label: `"${filters.search.trim()}"`, reset: "" });
  if (filters.department !== "all") chips.push({ field: "department", label: label(filters.department), reset: "all" });
  if (filters.year !== "all") chips.push({ field: "year", label: label(filters.year), reset: "all" });
  if (filters.section !== "all") chips.push({ field: "section", label: `Section ${label(filters.section)}`, reset: "all" });
  if (filters.status !== "all") {
    chips.push({ field: "status", label: ROSTER_STATUSES.find(s => s.value === filters.status)?.label || filters.status, reset: "all" });
  }
  if (filters.flag !== "any") {
    chips.push({ field: "flag", label: ROSTER_FLAGS.find(f => f.value === filters.flag)?.label || filters.flag, reset: "any" });
  }
  return chips;
}

export function countActiveRosterFilters(filters) {
  return activeRosterChips(filters).length;
}
