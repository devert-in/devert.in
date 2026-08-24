// Bulk import for GATE topic lesson content.
//
// WHY JSON AND NOT CSV. The previous-year-question and formula importers are
// CSV, and correctly so: those are flat records of short fields. A topic lesson
// is not. It has multi-paragraph prose with embedded newlines and `:::` fences,
// half a dozen string ARRAYS (keyPoints, commonMistakes, memoryTricks,
// formulas, shortcuts), a nested shortNotes object with three depths, an array
// of MCQ objects each with its own options array, and an array of numericals
// with numeric answer ranges. Encoding that in CSV means quoting newlines inside
// quoted fields inside a delimiter-separated row, which is exactly the shape
// that makes CSV importers silently corrupt content. JSON matches the document
// this writes to, one-to-one.
//
// The import is DIFF-FIRST by design. validateLessonImport() never writes; it
// returns per-topic verdicts (create / update / unknown-topic / invalid) so the
// admin sees precisely what is about to change, against real topic ids fetched
// from the paper, before committing anything. A bulk importer that writes first
// and reports afterwards is how a typo'd subjectId silently creates 40 orphan
// documents.
//
// Only fields PRESENT in the JSON are written (merge semantics). That makes a
// partial import a real workflow: shipping a file containing nothing but
// `shortNotes` for 60 topics updates only short notes and leaves every authored
// concept untouched.

import { db } from "@/lib/firebase";
import { doc, getDoc, serverTimestamp, writeBatch } from "firebase/firestore";
import { withVersionSnapshot } from "@/lib/contentVersioning";
import { fetchSyllabusTree } from "@/lib/gate";
import { GATE_DIFFICULTIES } from "@/lib/gate";

// The authorable surface of a topic document, and how each field is coerced.
// Anything not listed here is REJECTED rather than passed through - an importer
// that writes arbitrary keys lets a typo ("keypoints") land as a silent no-op
// field that renders nowhere and is invisible in the admin form.
const FIELD_SPEC = {
  // identity (required to locate the topic; never written as content)
  subjectId: { kind: "id", required: true, identity: true },
  topicId: { kind: "id", required: true, identity: true },

  // scalars
  title: { kind: "string" },
  module: { kind: "string" },
  difficulty: { kind: "enum", values: GATE_DIFFICULTIES },
  estimatedMinutes: { kind: "int", min: 1, max: 600 },
  order: { kind: "int", min: 0, max: 100000 },
  status: { kind: "enum", values: ["draft", "published", "archived"] },
  xpReward: { kind: "int", min: 0, max: 1000 },
  coinReward: { kind: "int", min: 0, max: 1000 },

  // prose (lesson-block syntax allowed - see lib/lessonBlocks.js)
  concept: { kind: "text" },
  deepDive: { kind: "text" },
  dryRun: { kind: "text" },
  pyqRelevance: { kind: "text" },
  interviewConnection: { kind: "text" },
  revisionSummary: { kind: "text" },
  assignment: { kind: "text" },

  // string arrays
  whatYoullLearn: { kind: "stringArray" },
  prerequisites: { kind: "stringArray" },
  keyPoints: { kind: "stringArray" },
  commonMistakes: { kind: "stringArray" },
  analogies: { kind: "stringArray" },
  memoryTricks: { kind: "stringArray" },
  formulas: { kind: "stringArray" },
  shortcuts: { kind: "stringArray" },

  // structured
  shortNotes: { kind: "shortNotes" },
  codeExample: { kind: "codeExample" },
  workedExamples: { kind: "workedExamples" },
  mcqs: { kind: "mcqs" },
  numericals: { kind: "numericals" },
  resources: { kind: "resources" },
};

// Allowed values for a resource's `kind` - mirrors RESOURCE_ICON in
// components/se/se-lesson.jsx, the one other place this exact shape is
// authored, so the two never drift into incompatible vocabularies.
const RESOURCE_KINDS = ["video", "link", "pdf", "cheatsheet", "notes"];

const IDENTITY_FIELDS = Object.entries(FIELD_SPEC)
  .filter(([, spec]) => spec.identity).map(([k]) => k);

export const LESSON_IMPORT_FIELDS = Object.keys(FIELD_SPEC);

// ---------------- coercion / validation of one field ----------------

function coerceField(key, spec, raw, errors, where) {
  const fail = (msg) => { errors.push(`${where}: ${key} ${msg}`); return undefined; };

  switch (spec.kind) {
    case "id":
    case "string":
    case "text": {
      if (typeof raw !== "string") return fail("must be a string.");
      const v = spec.kind === "text" ? raw : raw.trim();
      if (spec.required && !v.trim()) return fail("is required and cannot be empty.");
      return v;
    }
    case "int": {
      const n = Number(raw);
      if (!Number.isFinite(n)) return fail("must be a number.");
      const i = Math.round(n);
      if (i < spec.min || i > spec.max) return fail(`must be between ${spec.min} and ${spec.max}.`);
      return i;
    }
    case "enum": {
      if (!spec.values.includes(raw)) return fail(`must be one of: ${spec.values.join(", ")}.`);
      return raw;
    }
    case "stringArray": {
      if (!Array.isArray(raw)) return fail("must be an array of strings.");
      const out = raw.filter(v => typeof v === "string" && v.trim()).map(v => v.trim());
      if (out.length !== raw.length) errors.push(`${where}: ${key} had empty or non-string entries, which were dropped.`);
      return out;
    }
    case "shortNotes": {
      if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return fail("must be an object.");
      const allowed = ["oneMinute", "fiveMinute", "nightBefore"];
      const bad = Object.keys(raw).filter(k => !allowed.includes(k));
      if (bad.length) return fail(`has unknown depth(s): ${bad.join(", ")}. Allowed: ${allowed.join(", ")}.`);
      const out = {};
      for (const k of allowed) {
        if (raw[k] === undefined) continue;
        if (typeof raw[k] !== "string") return fail(`.${k} must be a string.`);
        out[k] = raw[k];
      }
      return out;
    }
    case "codeExample": {
      if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return fail("must be an object.");
      if (typeof raw.code !== "string" || !raw.code.trim()) return fail(".code is required.");
      return {
        language: typeof raw.language === "string" && raw.language.trim() ? raw.language.trim() : "c",
        code: raw.code,
        expectedOutput: typeof raw.expectedOutput === "string" ? raw.expectedOutput : "",
      };
    }
    case "workedExamples": {
      if (!Array.isArray(raw)) return fail("must be an array.");
      const out = [];
      raw.forEach((ex, i) => {
        if (typeof ex !== "object" || ex === null) { errors.push(`${where}: ${key}[${i}] must be an object.`); return; }
        if (!ex.problem && !ex.solution) { errors.push(`${where}: ${key}[${i}] needs at least a problem or a solution.`); return; }
        out.push({
          title: typeof ex.title === "string" ? ex.title.trim() : "",
          problem: typeof ex.problem === "string" ? ex.problem : "",
          solution: typeof ex.solution === "string" ? ex.solution : "",
        });
      });
      return out;
    }
    case "mcqs": {
      if (!Array.isArray(raw)) return fail("must be an array.");
      const out = [];
      raw.forEach((q, i) => {
        const at = `${where}: ${key}[${i}]`;
        if (typeof q !== "object" || q === null) { errors.push(`${at} must be an object.`); return; }
        if (typeof q.question !== "string" || !q.question.trim()) { errors.push(`${at}.question is required.`); return; }
        if (!Array.isArray(q.options) || q.options.length < 2) { errors.push(`${at}.options needs at least 2 entries.`); return; }
        if (!q.options.every(o => typeof o === "string" && o.trim())) { errors.push(`${at}.options must all be non-empty strings.`); return; }
        const ci = Number(q.correctIndex);
        // The single most damaging thing a bad import can do here is store an
        // out-of-range correctIndex: the quiz would then mark every answer
        // wrong, with no visible cause. Rejected outright.
        if (!Number.isInteger(ci) || ci < 0 || ci >= q.options.length) {
          errors.push(`${at}.correctIndex must be an integer index into options (0-${q.options.length - 1}).`);
          return;
        }
        out.push({
          question: q.question.trim(),
          options: q.options.map(o => o.trim()),
          correctIndex: ci,
          explanation: typeof q.explanation === "string" ? q.explanation.trim() : "",
        });
      });
      return out;
    }
    case "resources": {
      // The exact-timestamp requirement lives INSIDE url itself (a YouTube
      // link with ?t=123s / &t=123s), not a separate field - a timestamp
      // divorced from its video is meaningless the moment either changes.
      if (!Array.isArray(raw)) return fail("must be an array.");
      const out = [];
      raw.forEach((r, i) => {
        const at = `${where}: ${key}[${i}]`;
        if (typeof r !== "object" || r === null) { errors.push(`${at} must be an object.`); return; }
        if (!RESOURCE_KINDS.includes(r.kind)) { errors.push(`${at}.kind must be one of: ${RESOURCE_KINDS.join(", ")}.`); return; }
        if (typeof r.title !== "string" || !r.title.trim()) { errors.push(`${at}.title is required.`); return; }
        if (typeof r.url !== "string" || !/^https?:\/\//.test(r.url.trim())) { errors.push(`${at}.url must be a full http(s) URL.`); return; }
        out.push({
          kind: r.kind,
          title: r.title.trim(),
          url: r.url.trim(),
          description: typeof r.description === "string" ? r.description.trim() : "",
        });
      });
      return out;
    }
    case "numericals": {
      if (!Array.isArray(raw)) return fail("must be an array.");
      const out = [];
      raw.forEach((n, i) => {
        const at = `${where}: ${key}[${i}]`;
        if (typeof n !== "object" || n === null) { errors.push(`${at} must be an object.`); return; }
        if (typeof n.question !== "string" || !n.question.trim()) { errors.push(`${at}.question is required.`); return; }
        const min = Number(n.answerMin);
        const max = n.answerMax === undefined ? min : Number(n.answerMax);
        if (!Number.isFinite(min) || !Number.isFinite(max)) { errors.push(`${at} needs a numeric answerMin (answerMax optional).`); return; }
        if (min > max) { errors.push(`${at} has answerMin greater than answerMax.`); return; }
        out.push({
          question: n.question.trim(),
          answerMin: min, answerMax: max,
          unit: typeof n.unit === "string" ? n.unit.trim() : "",
          solution: typeof n.solution === "string" ? n.solution : "",
        });
      });
      return out;
    }
    default:
      return fail("has no known coercion (internal error).");
  }
}

// ---------------- whole-payload validation ----------------

// Accepts either a bare array of topic objects, or `{ paperId, topics: [...] }`.
// The wrapper form is preferred because it makes a file self-describing - an
// exported template round-trips without the admin having to remember which paper
// it came from.
export function parseLessonImport(text) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    return { ok: false, fatal: `Not valid JSON: ${e.message}` };
  }
  if (Array.isArray(parsed)) return { ok: true, paperId: null, topics: parsed };
  if (parsed && Array.isArray(parsed.topics)) {
    return { ok: true, paperId: typeof parsed.paperId === "string" ? parsed.paperId : null, topics: parsed.topics };
  }
  return { ok: false, fatal: 'Expected either a JSON array of topics, or an object shaped { "paperId": "cs", "topics": [ ... ] }.' };
}

// The diff. Fetches the paper's real syllabus tree (drafts included) and
// classifies every incoming row against it. Returns everything the admin needs
// to decide, and a `writable` list the importer consumes verbatim - so what is
// shown and what is written cannot diverge.
export async function validateLessonImport({ paperId, text }) {
  const parsed = parseLessonImport(text);
  if (!parsed.ok) return { fatal: parsed.fatal };

  if (parsed.paperId && parsed.paperId !== paperId) {
    return {
      fatal: `This file declares paperId "${parsed.paperId}" but the selected paper is "${paperId}". `
        + `Switch papers, or remove the paperId field to import into the selected one.`,
    };
  }
  if (parsed.topics.length === 0) return { fatal: "The file contains no topics." };

  const tree = await fetchSyllabusTree(paperId, { includeUnpublished: true });
  const known = new Map();
  for (const s of tree) {
    for (const t of s.topics || []) known.set(`${s.id}/${t.id}`, { subject: s, topic: t });
  }

  const rows = [];
  const seen = new Set();

  parsed.topics.forEach((raw, i) => {
    const errors = [];
    const where = `topic ${i + 1}`;
    if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
      rows.push({ index: i, verdict: "invalid", errors: [`${where}: must be an object.`] });
      return;
    }

    const unknownKeys = Object.keys(raw).filter(k => !FIELD_SPEC[k]);
    if (unknownKeys.length) {
      errors.push(`${where}: unknown field(s) ${unknownKeys.join(", ")}. Allowed: ${LESSON_IMPORT_FIELDS.join(", ")}.`);
    }

    const patch = {};
    for (const [key, spec] of Object.entries(FIELD_SPEC)) {
      if (raw[key] === undefined) {
        if (spec.required) errors.push(`${where}: ${key} is required.`);
        continue;
      }
      const v = coerceField(key, spec, raw[key], errors, where);
      if (v !== undefined && !spec.identity) patch[key] = v;
    }

    const subjectId = typeof raw.subjectId === "string" ? raw.subjectId.trim() : "";
    const topicId = typeof raw.topicId === "string" ? raw.topicId.trim() : "";
    const path = `${subjectId}/${topicId}`;

    if (seen.has(path) && path !== "/") {
      errors.push(`${where}: duplicate of an earlier row for ${path} - the later one would silently win.`);
    }
    seen.add(path);

    const match = known.get(path);
    const label = match ? `${match.subject.name} › ${match.topic.title}` : path;

    if (errors.length) {
      rows.push({ index: i, path, label, verdict: "invalid", errors });
      return;
    }
    if (!match) {
      // Deliberately NOT auto-created. A topic id that isn't in the syllabus is
      // far more often a typo than a genuine new topic, and inventing syllabus
      // entries from an import file is how a tree stops matching the official
      // document. Add the topic in the admin form first, then re-import.
      rows.push({
        index: i, path, label, verdict: "unknown",
        errors: [`No topic "${topicId}" under subject "${subjectId}" in this paper. Create it first, or fix the id.`],
      });
      return;
    }

    const hadContent = !!(match.topic.concept?.trim() || match.topic.keyPoints?.length);
    rows.push({
      index: i, path, label,
      verdict: hadContent ? "update" : "create",
      fields: Object.keys(patch),
      patch,
      subjectId, topicId,
    });
  });

  const writable = rows.filter(r => r.verdict === "create" || r.verdict === "update");
  return {
    rows,
    writable,
    counts: {
      create: rows.filter(r => r.verdict === "create").length,
      update: rows.filter(r => r.verdict === "update").length,
      unknown: rows.filter(r => r.verdict === "unknown").length,
      invalid: rows.filter(r => r.verdict === "invalid").length,
    },
  };
}

// Writes the already-validated rows. Takes `writable` straight from
// validateLessonImport so there is no second, divergent coercion pass.
//
// Version snapshots: saveTopic() in lib/gate.js snapshots the prior version on
// every write, and that matters more here than anywhere else in the app - a bulk
// import is the single easiest way to destroy a lot of authored content at once,
// and previousVersions is the only undo that exists. Because the snapshot needs
// the document's CURRENT data, each row is read before it is written, so this
// intentionally does one read per topic rather than a blind batch write.
export async function runLessonImport({ paperId, writable, onProgress }) {
  let written = 0;
  for (let i = 0; i < writable.length; i += 100) {
    const chunk = writable.slice(i, i + 100);
    const existing = await Promise.all(chunk.map(r =>
      getDoc(doc(db, "gatePapers", paperId, "subjects", r.subjectId, "topics", r.topicId))
        .then(s => s.data()).catch(() => undefined)
    ));
    const batch = writeBatch(db);
    chunk.forEach((r, j) => {
      batch.set(
        doc(db, "gatePapers", paperId, "subjects", r.subjectId, "topics", r.topicId),
        { updatedAt: serverTimestamp(), ...withVersionSnapshot(existing[j]), ...r.patch },
        { merge: true },
      );
    });
    await batch.commit();
    written += chunk.length;
    onProgress?.(written, writable.length);
  }
  return { written };
}

// ---------------- template export ----------------

// A template built from the paper's REAL topic ids, pre-filled with whatever is
// already authored. That makes the round trip the primary workflow: export a
// subject, edit the prose in a real editor, re-import. Handing someone a blank
// schema and asking them to type 40 topic ids by hand is how ids get typo'd.
export async function buildLessonTemplate({ paperId, subjectId = null, includeAuthored = true }) {
  const tree = await fetchSyllabusTree(paperId, { includeUnpublished: true });
  const subjects = subjectId ? tree.filter(s => s.id === subjectId) : tree;
  const topics = [];

  for (const s of subjects) {
    for (const t of s.topics || []) {
      const row = { subjectId: s.id, topicId: t.id, title: t.title, module: t.module || "" };
      if (includeAuthored) {
        for (const key of LESSON_IMPORT_FIELDS) {
          if (IDENTITY_FIELDS.includes(key) || key === "title" || key === "module") continue;
          if (t[key] !== undefined && t[key] !== null && t[key] !== "") row[key] = t[key];
        }
      }
      topics.push(row);
    }
  }

  return JSON.stringify({ paperId, topics }, null, 2);
}

// A single fully-populated example row, for the admin panel's "what does a
// complete topic look like" reference. Every field the format supports, so an
// author can delete what they don't need rather than guess what exists.
export const LESSON_IMPORT_EXAMPLE = JSON.stringify({
  paperId: "cs",
  topics: [{
    subjectId: "digital-logic",
    topicId: "karnaugh-map",
    title: "Karnaugh Map",
    module: "Boolean Algebra and Minimization",
    difficulty: "Moderate",
    estimatedMinutes: 35,
    status: "published",
    whatYoullLearn: ["Group minterms on a 3- and 4-variable K-map", "Read a minimal SOP expression off the map"],
    prerequisites: ["Boolean Algebra Fundamentals"],
    concept: "## What a K-map is for\n\nAlgebraic minimization works but is easy to get wrong...\n\n::: tip\nGroups must be powers of two: 1, 2, 4, 8.\n:::",
    deepDive: "## Don't-care conditions\n\nAn `X` may be included in a group when it helps...",
    dryRun: "Take **F(A,B,C) = Σ(1,3,5,7)**...",
    keyPoints: ["Adjacent cells differ in exactly one variable", "Bigger groups mean fewer literals"],
    commonMistakes: ["Grouping three cells - group sizes are powers of two only"],
    memoryTricks: ["Gray code order is 00, 01, 11, 10 - never 00, 01, 10, 11"],
    formulas: ["A group of 2^k cells on an n-variable map eliminates k variables"],
    shortcuts: ["Circle the largest groups first, then cover leftovers"],
    pyqRelevance: "Asked most years as a 1- or 2-mark minimization question.",
    interviewConnection: "Rare in interviews directly, but the underlying simplification shows up in condition refactoring.",
    revisionSummary: "Plot minterms, group in powers of two, read off the SOP.",
    shortNotes: {
      fiveMinute: "A K-map arranges minterms so adjacent cells differ by one variable...",
      oneMinute: "Group powers of two, largest first. A 2^k group kills k variables.",
      nightBefore: "Gray code order. Groups are 1/2/4/8 only. Wrap-around counts.",
    },
    mcqs: [{
      question: "How many variables does a group of 4 cells eliminate on a 4-variable K-map?",
      options: ["1", "2", "3", "4"],
      correctIndex: 1,
      explanation: "4 = 2^2, so k = 2 variables are eliminated.",
    }],
    numericals: [{
      question: "For F(A,B,C,D) = Σ(0,1,2,3,8,9,10,11), how many literals are in the minimal SOP?",
      answerMin: 1, answerMax: 1,
      unit: "literal",
      solution: "The eight minterms form one group of 8, leaving **B'**...",
    }],
    // url carries the exact timestamp itself (?t=123s) - there is no
    // separate timestamp field, since a number divorced from its video is
    // meaningless the moment either one changes. Only ever a video actually
    // verified to open at that point - never a guessed link or offset.
    resources: [{
      kind: "video",
      title: "Karnaugh Map (K-Map) Solved Examples - Gate Smashers",
      url: "https://www.youtube.com/watch?v=XXXXXXXXXXX&t=245s",
      description: "Starts at 4:05 - worked K-map grouping examples.",
    }],
  }],
}, null, 2);
