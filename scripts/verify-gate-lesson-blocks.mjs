// Validates authored GATE lessons in scripts/gate-lessons/ against the REAL
// parser the app renders with (devert-frontend/lib/lessonBlocks.js), plus the
// field-shape rules gate-subjects.jsx's topic view relies on. Touches no network
// and needs no service account.
//
//   node scripts/verify-gate-lesson-blocks.mjs
//   node scripts/verify-gate-lesson-blocks.mjs general-aptitude
//
// Exits non-zero on any error, so it can gate write-gate-lessons.mjs.
//
// A GATE topic renders far more fields than a CS Core one, and several of them
// take the same block syntax (concept, deepDive, dryRun, workedExamples'
// problem/solution, numericals' solution) - so every one of those is parsed
// here, not just `concept`. The field-shape checks catch the mistakes that
// render as something silently wrong rather than as an error: an mcq whose
// correctIndex is out of range grades every answer wrong, and a numerical whose
// answerMin/answerMax are reversed or missing accepts nothing at all.

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";
import { GATE_LESSONS } from "./gate-lessons/index.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Loaded as an ESM data: URL because devert-frontend/package.json declares no
// "type": "module" - same technique as verify-cscore-lesson-blocks.mjs.
const parserSource = readFileSync(path.join(__dirname, "../devert-frontend/lib/lessonBlocks.js"), "utf8");
const { parseLessonBlocks, parseLesson } = await import(
  `data:text/javascript;base64,${Buffer.from(parserSource).toString("base64")}`
);

const ONLY = process.argv[2] || null;

function walk(blocks, visit) {
  blocks.forEach(b => { visit(b); if (b.blocks) walk(b.blocks, visit); });
}

// Parses one block-syntax field. `label` names it in any message, so an error in
// a worked example's solution doesn't read as an error in the main concept.
function checkBlockField(text, label, { requireSections = false } = {}) {
  const errors = [];
  const warnings = [];
  const counts = {};
  if (!text?.trim()) return { errors, warnings, counts, sections: 0, words: 0 };

  const lines = text.split("\n");
  const opens = lines.filter(l => /^:::[ \t]*[a-zA-Z]/.test(l)).length;
  const closes = lines.filter(l => /^:::[ \t]*$/.test(l)).length;
  if (opens !== closes) {
    errors.push(`${label}: ${opens} fence(s) opened, ${closes} closed - an unclosed fence swallows the rest into one block`);
  }

  const blocks = parseLessonBlocks(text);
  const sections = parseLesson(text).filter(s => s.title);

  walk(blocks, b => {
    const key = b.type === "callout" ? `callout:${b.variant}` : b.type;
    counts[key] = (counts[key] || 0) + 1;

    if (b.type === "checkpoint") {
      const correct = b.options.filter(o => o.correct).length;
      const q = (b.question || "").slice(0, 40);
      if (b.options.length < 2) errors.push(`${label}: checkpoint "${q}..." has ${b.options.length} option(s)`);
      if (correct !== 1) errors.push(`${label}: checkpoint "${q}..." has ${correct} correct option(s), expected exactly 1`);
      if (!b.question.trim()) errors.push(`${label}: checkpoint has no question text`);
      if (!b.explanation.trim()) warnings.push(`${label}: checkpoint has no \`>\` explanation`);
    }
    if (b.type === "cards") {
      if (b.items.length === 0) errors.push(`${label}: cards block has no rows`);
      b.items.filter(i => !i.body).forEach(i => warnings.push(`${label}: card "${i.term}" has no body - probably a missing " :: "`));
    }
    if (b.type === "timeline") {
      if (b.steps.length < 2) warnings.push(`${label}: timeline "${b.title}" has ${b.steps.length} step(s)`);
      b.steps.filter(s => !s.body).forEach(s => warnings.push(`${label}: timeline step "${s.term}" has no caption`));
    }
    if (b.type === "flow" && b.steps.length < 2) {
      warnings.push(`${label}: flow "${b.title}" has ${b.steps.length} step(s) - needs at least 2`);
    }
    if (b.type === "callout" && b.blocks.length === 0) errors.push(`${label}: empty ${b.variant} callout`);
    if (b.type === "reveal" && b.blocks.length === 0) errors.push(`${label}: empty reveal block`);
  });

  if (requireSections && sections.length < 2) {
    warnings.push(`${label}: only ${sections.length} section heading(s) - not really broken up yet`);
  }

  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return { errors, warnings, counts, sections: sections.length, words };
}

// The topic view treats an empty array/absent field as "this stage isn't
// authored" and dims it, so nothing here is mandatory. What IS checked is that
// a field which IS present is well-formed enough to render and grade correctly.
function checkTopic(lesson) {
  const errors = [];
  const warnings = [];
  const counts = {};
  let words = 0;
  let sections = 0;

  const merge = (r) => {
    errors.push(...r.errors);
    warnings.push(...r.warnings);
    Object.entries(r.counts).forEach(([k, n]) => { counts[k] = (counts[k] || 0) + n; });
    words += r.words;
  };

  const main = checkBlockField(lesson.concept, "concept", { requireSections: true });
  sections = main.sections;
  merge(main);
  merge(checkBlockField(lesson.deepDive, "deepDive"));
  merge(checkBlockField(lesson.dryRun, "dryRun"));

  (lesson.workedExamples || []).forEach((ex, i) => {
    if (!ex.title?.trim()) warnings.push(`workedExamples[${i}] has no title`);
    if (!ex.problem?.trim()) errors.push(`workedExamples[${i}] has no problem`);
    if (!ex.solution?.trim()) errors.push(`workedExamples[${i}] "${ex.title || i}" has no solution`);
    merge(checkBlockField(ex.problem, `workedExamples[${i}].problem`));
    merge(checkBlockField(ex.solution, `workedExamples[${i}].solution`));
  });

  (lesson.numericals || []).forEach((n, i) => {
    merge(checkBlockField(n.solution, `numericals[${i}].solution`));
    if (!n.question?.trim()) errors.push(`numericals[${i}] has no question`);
    // answerMax defaults to answerMin in the renderer, so only answerMin is
    // required - but a non-numeric bound accepts nothing and looks like a bug
    // in the student's arithmetic rather than in the content.
    const lo = Number(n.answerMin);
    if (!Number.isFinite(lo)) errors.push(`numericals[${i}] answerMin is not a finite number`);
    if (n.answerMax != null && !Number.isFinite(Number(n.answerMax))) {
      errors.push(`numericals[${i}] answerMax is not a finite number`);
    }
    if (!n.solution?.trim()) warnings.push(`numericals[${i}] has no worked solution`);
  });

  (lesson.mcqs || []).forEach((q, i) => {
    if (!q.question?.trim()) errors.push(`mcqs[${i}] has no question`);
    const opts = q.options || [];
    if (opts.length < 2) errors.push(`mcqs[${i}] has ${opts.length} option(s)`);
    if (!Number.isInteger(q.correctIndex) || q.correctIndex < 0 || q.correctIndex >= opts.length) {
      errors.push(`mcqs[${i}] correctIndex ${q.correctIndex} is out of range for ${opts.length} option(s) - every answer would grade wrong`);
    }
    if (!q.explanation?.trim()) warnings.push(`mcqs[${i}] has no explanation - shown after submit, so this is a wasted teaching moment`);
  });

  // Plain-text fields: rendered with whitespace-pre-wrap, NOT through the block
  // parser. Block syntax here renders as literal ":::" on screen.
  for (const field of ["pyqRelevance", "interviewConnection", "revisionSummary"]) {
    const v = lesson[field];
    if (v && /^:::/m.test(v)) {
      errors.push(`${field} contains a ::: fence, but it renders as plain text - the fence would show literally`);
    }
  }

  if (!lesson.concept?.trim()) errors.push("no concept - the topic would still render as \"This lesson is being written\"");
  // keyPoints leads the teaching-aid group in gate-subjects.jsx, so its absence
  // is visible as a missing first card rather than as nothing at all. It was
  // silently dropped on the first authoring run, which is why it is checked here.
  if (!(lesson.keyPoints?.length)) warnings.push("no keyPoints - it leads the teaching-aid card group, so its absence is visible");
  if (!(lesson.whatYoullLearn?.length)) warnings.push("no whatYoullLearn - the Intro journey stage stays dimmed");
  if (!(lesson.mcqs?.length)) warnings.push("no mcqs - the MCQ journey stage stays dimmed");
  if (!lesson.revisionSummary?.trim() && !lesson.shortNotes?.oneMinute?.trim()) {
    warnings.push("no revisionSummary - the Revision journey stage stays dimmed");
  }

  return { errors, warnings, counts, sections, words };
}

let totalErrors = 0;
let totalWarnings = 0;
let lessons = 0;

for (const [subjectId, topics] of Object.entries(GATE_LESSONS)) {
  if (ONLY && subjectId !== ONLY) continue;
  console.log(`\n=== ${subjectId} ===`);

  for (const [topicId, lesson] of Object.entries(topics)) {
    const { errors, warnings, counts, sections, words } = checkTopic(lesson);
    lessons++;
    totalErrors += errors.length;
    totalWarnings += warnings.length;

    const blockSummary = Object.entries(counts)
      .filter(([t]) => !["prose", "list", "heading"].includes(t))
      .sort((a, b) => b[1] - a[1])
      .map(([t, n]) => `${t.replace("callout:", "")}${n > 1 ? `x${n}` : ""}`)
      .join(" ");

    const stages = [
      lesson.whatYoullLearn?.length && "intro",
      lesson.concept?.trim() && "theory",
      (lesson.codeExample?.code?.trim() || lesson.workedExamples?.length) && "ex",
      lesson.dryRun?.trim() && "dry",
      lesson.mcqs?.length && "mcq",
      lesson.numericals?.length && "nat",
      (lesson.revisionSummary?.trim() || lesson.shortNotes?.oneMinute?.trim()) && "rev",
    ].filter(Boolean).join("/");

    const status = errors.length ? "FAIL" : warnings.length ? "warn" : "ok  ";
    console.log(`  ${status} ${topicId.padEnd(46)} ${String(words).padStart(4)}w  ${sections} sec  [${stages}]  ${blockSummary}`);
    errors.forEach(e => console.log(`       ERROR: ${e}`));
    warnings.forEach(w => console.log(`       warn:  ${w}`));
  }
}

console.log(`\n${lessons} lesson(s) checked - ${totalErrors} error(s), ${totalWarnings} warning(s).`);
process.exit(totalErrors > 0 ? 1 : 0);
