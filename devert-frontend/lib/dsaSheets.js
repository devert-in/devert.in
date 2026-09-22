// DSA Sheets - curated, ordered curricula layered OVER the existing problem
// set (A2Z / Blind 75 / NeetCode 150 / company sheets all being the same shape,
// differing only in ordering and grouping).
//
// THE CENTRAL RULE: a sheet owns NO problems and NO progress.
//
// - Content: a section stores `problemIds` referencing problems/{id}. There is
//   exactly one copy of every problem, its statement, its tests and its
//   company tags. A problem can appear in ten sheets and is still one document.
// - Progress: derived live from the learner's EXISTING
//   user_codelab_progress.solvedProblems map. There is deliberately no
//   dsa_sheet_progress collection, which is not a shortcut but the correct
//   model: solving a problem from DSA Practice, from a contest, or from inside
//   any sheet is the same act, so it must count everywhere at once. A
//   per-sheet progress doc would immediately drift from the others and would
//   need backfilling every time a sheet was re-ordered.
// - Per-row annotations (bookmark / notes / needs-revision / confidence) come
//   from lib/problemNotes.js, which is already per-problem and therefore
//   already shared across every sheet.
//
// Consequence worth stating plainly: adding a new sheet is a DATA operation. No
// new collection, no new rules block, no new progress plumbing, no UI change.
//
// Authority: a GLOBAL admin-authored catalog, same shape as
// programmingLanguages/dsaConceptTracks. See firestore.rules' `dsaSheets` block.
import { db } from "@/lib/firebase";
import { currentAudiences } from "@/lib/audiences";
import { collection, doc, getDoc, getDocs, setDoc, query, where, serverTimestamp } from "firebase/firestore";

// Both filters are required on every non-admin list(), not just status:
// contentReadable() checks `audiences` too, so a status-only query is denied
// outright. This bit me on dsaConcepts - see fetchConcepts' comment there.
function publishedQuery(col) {
  return query(col, where("status", "==", "published"), where("audiences", "array-contains-any", currentAudiences()));
}

export async function fetchSheets({ includeUnpublished = false } = {}) {
  const col = collection(db, "dsaSheets");
  const snap = await getDocs(includeUnpublished ? col : publishedQuery(col));
  return snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (a.order || 0) - (b.order || 0));
}

export async function fetchSheet(sheetId) {
  const snap = await getDoc(doc(db, "dsaSheets", sheetId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// One read per sheet gets the WHOLE structure: a section doc embeds its
// subsections (each with its own ordered problemIds) rather than nesting a
// third collection level. ~30 docs for a flagship sheet, one query, and a
// section is the natural unit an admin edits as a whole. Firestore's 1MB
// per-document ceiling is nowhere near a concern for a list of ids.
export async function fetchSheetSections(sheetId, { includeUnpublished = false } = {}) {
  const col = collection(db, "dsaSheets", sheetId, "sections");
  const snap = await getDocs(includeUnpublished ? col : publishedQuery(col));
  return snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (a.order || 0) - (b.order || 0));
}

export async function saveSheet(sheetId, data) {
  await setDoc(doc(db, "dsaSheets", sheetId), { updatedAt: serverTimestamp(), ...data }, { merge: true });
}

export async function saveSheetSection(sheetId, sectionId, data) {
  await setDoc(doc(db, "dsaSheets", sheetId, "sections", sectionId),
    { updatedAt: serverTimestamp(), ...data }, { merge: true });
}

// ---- structure + progress derivation --------------------------------------

const DIFFICULTIES = ["Easy", "Medium", "Hard"];

function emptyBreakdown() {
  return { Easy: { total: 0, solved: 0 }, Medium: { total: 0, solved: 0 }, Hard: { total: 0, solved: 0 } };
}

function accumulate(into, problem, solved) {
  const bucket = into[problem.difficulty];
  if (!bucket) return; // unknown/missing difficulty never inflates a total
  bucket.total++;
  if (solved) bucket.solved++;
}

// Turns one section's stored ids into renderable rows, and computes its
// progress, in a single pass.
//
// A problemId that no longer resolves (unpublished, deleted, or hidden for this
// institution) is DROPPED rather than rendered as a broken row - and, crucially,
// is excluded from the section's totals too. Counting a problem the learner
// cannot open would make 100% unreachable, which is worse than a slightly
// shorter section.
function buildSection(section, problemsById, solvedIds, hiddenIds) {
  const subsections = (section.subsections || []).map(sub => {
    const breakdown = emptyBreakdown();
    let solved = 0;
    // Each row carries its own `solved` flag, resolved here once. Progress is
    // still never STORED on content - this is the derived view the renderer and
    // nextUnsolved() both read, computed in the same pass as the totals.
    const rows = (sub.problemIds || [])
      .map(id => problemsById.get(id))
      .filter(p => p && !hiddenIds?.has(p.id))
      .map(p => {
        const isSolved = solvedIds.has(p.id);
        if (isSolved) solved++;
        accumulate(breakdown, p, isSolved);
        return { ...p, solved: isSolved };
      });
    return { ...sub, rows, total: rows.length, solved, breakdown };
  }).filter(sub => sub.total > 0 || (sub.problemIds || []).length === 0);

  const total = subsections.reduce((n, s) => n + s.total, 0);
  const solved = subsections.reduce((n, s) => n + s.solved, 0);
  const breakdown = emptyBreakdown();
  for (const sub of subsections) {
    for (const d of DIFFICULTIES) {
      breakdown[d].total += sub.breakdown[d].total;
      breakdown[d].solved += sub.breakdown[d].solved;
    }
  }

  return {
    ...section, subsections, total, solved, breakdown,
    pct: total ? Math.round((solved / total) * 100) : 0,
    // Rough reading/solving estimate, deliberately derived rather than authored:
    // an authored per-section minute count goes stale the moment a problem is
    // added or removed, and nobody remembers to update it.
    estimatedMinutes: breakdown.Easy.total * 12 + breakdown.Medium.total * 25 + breakdown.Hard.total * 40,
  };
}

// The whole sheet, ready to render. `problems` is the published problem list
// the caller already holds (one fetch per screen, not per section), and
// `progress` is the existing user_codelab_progress doc.
export function buildSheet(sections, problems, progress, hiddenIds) {
  const problemsById = new Map((problems || []).map(p => [p.id, p]));
  const solvedIds = new Set(Object.keys(progress?.solvedProblems || {}));

  const built = (sections || []).map(s => buildSection(s, problemsById, solvedIds, hiddenIds));

  const total = built.reduce((n, s) => n + s.total, 0);
  const solved = built.reduce((n, s) => n + s.solved, 0);
  const breakdown = emptyBreakdown();
  for (const s of built) {
    for (const d of DIFFICULTIES) {
      breakdown[d].total += s.breakdown[d].total;
      breakdown[d].solved += s.breakdown[d].solved;
    }
  }

  return {
    sections: built, total, solved, breakdown,
    pct: total ? Math.round((solved / total) * 100) : 0,
    estimatedMinutes: built.reduce((n, s) => n + s.estimatedMinutes, 0),
  };
}

// "What should I solve next?" - the single question this module exists to
// answer. Returns the first unsolved row in sheet order, together with the
// section and subsection it sits in so the UI can say where it is and jump
// straight to it. Sheet order IS curriculum order, so walking it top-down is
// exactly the intended answer. Returns null only when the sheet is finished.
export function nextUnsolved(builtSheet) {
  for (const section of builtSheet.sections || []) {
    for (const sub of section.subsections || []) {
      const row = sub.rows.find(r => !r.solved);
      if (row) return { problem: row, section, subsection: sub };
    }
  }
  return null;
}

// The full flattened problem-id order for this sheet, same order the UI
// renders (section by section, subsection by subsection). Exposed whole
// (not just "the one next id") so CampusProblemView's "Next Problem" can
// keep following sheet order across repeated clicks - once a problem is
// open, this sheet's own component is unmounted, so passing only a single
// next id would correctly fix the FIRST hop and then silently lose context
// on the second. See campus-dsa-sheet.jsx's openProblemWithContext.
export function sheetProblemOrder(builtSheet) {
  return (builtSheet.sections || []).flatMap(s => (s.subsections || []).flatMap(sub => sub.rows.map(r => r.id)));
}
