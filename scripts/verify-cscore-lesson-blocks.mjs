// Validates authored lesson bodies in scripts/cscore-lessons/ against the REAL
// parser the app renders with (devert-frontend/lib/lessonBlocks.js), before any
// of it reaches Firestore. Touches no network and needs no service account.
//
//   node scripts/verify-cscore-lesson-blocks.mjs
//   node scripts/verify-cscore-lesson-blocks.mjs operating-systems
//
// Exits non-zero if any lesson has an error, so it can gate the rewrite script.
// The point is catching the specific mistakes this format makes easy: a fence
// left unclosed, a checkpoint with no correct option marked, a cards block
// where a `::` was forgotten and the row silently became title-only.

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";
import { LESSONS } from "./cscore-lessons/index.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The parser is dependency-free by design, so its source can be loaded as an
// ESM data: URL - which sidesteps devert-frontend/package.json declaring no
// "type": "module" (Node would otherwise resolve that .js file as CommonJS and
// choke on its `export` keywords). Same technique as test/lesson-blocks.test.mjs.
const parserSource = readFileSync(path.join(__dirname, "../devert-frontend/lib/lessonBlocks.js"), "utf8");
const { parseLessonBlocks, parseLesson } = await import(
  `data:text/javascript;base64,${Buffer.from(parserSource).toString("base64")}`
);

const ONLY = process.argv[2] || null;

function walk(blocks, visit) {
  blocks.forEach(b => {
    visit(b);
    if (b.blocks) walk(b.blocks, visit);
  });
}

function checkLesson(text) {
  const errors = [];
  const warnings = [];
  const counts = {};

  const lines = (text || "").split("\n");
  const opens = lines.filter(l => /^:::[ \t]*[a-zA-Z]/.test(l)).length;
  const closes = lines.filter(l => /^:::[ \t]*$/.test(l)).length;
  if (opens !== closes) {
    errors.push(`${opens} fence(s) opened, ${closes} closed - an unclosed fence swallows the rest of the lesson into one block`);
  }

  const blocks = parseLessonBlocks(text);
  const sections = parseLesson(text).filter(s => s.title);

  walk(blocks, b => {
    counts[b.type === "callout" ? `callout:${b.variant}` : b.type] = (counts[b.type === "callout" ? `callout:${b.variant}` : b.type] || 0) + 1;

    if (b.type === "checkpoint") {
      const correct = b.options.filter(o => o.correct).length;
      if (b.options.length < 2) errors.push(`checkpoint "${(b.question || "").slice(0, 40)}..." has ${b.options.length} option(s)`);
      if (correct !== 1) errors.push(`checkpoint "${(b.question || "").slice(0, 40)}..." has ${correct} correct option(s), expected exactly 1`);
      if (!b.question.trim()) errors.push("checkpoint has no question text");
      if (!b.explanation.trim()) warnings.push("checkpoint has no `>` explanation - students get feedback with no reason");
    }
    if (b.type === "cards") {
      if (b.items.length === 0) errors.push("cards block has no rows");
      b.items.filter(i => !i.body).forEach(i => warnings.push(`card "${i.term}" has no body - probably a missing " :: "`));
    }
    if (b.type === "timeline") {
      if (b.steps.length < 2) warnings.push(`timeline "${b.title}" has ${b.steps.length} step(s)`);
      b.steps.filter(s => !s.body).forEach(s => warnings.push(`timeline step "${s.term}" has no caption`));
    }
    if (b.type === "flow" && b.steps.length < 2) {
      warnings.push(`flow "${b.title}" has ${b.steps.length} step(s) - needs at least 2 to read as a flow`);
    }
    if (b.type === "callout" && b.blocks.length === 0) {
      errors.push(`empty ${b.variant} callout`);
    }
    if (b.type === "reveal" && b.blocks.length === 0) {
      errors.push("empty reveal block");
    }
  });

  // A lesson with no headings still renders correctly, but it hasn't actually
  // been restructured - flag it so a half-done conversion is visible.
  if (sections.length < 2) warnings.push(`only ${sections.length} section heading(s) - lesson is not really broken up yet`);

  const words = (text || "").trim().split(/\s+/).filter(Boolean).length;
  return { errors, warnings, counts, sections: sections.length, words };
}

let totalErrors = 0;
let totalWarnings = 0;
let lessons = 0;

for (const [subjectId, topics] of Object.entries(LESSONS)) {
  if (ONLY && subjectId !== ONLY) continue;
  console.log(`\n=== ${subjectId} ===`);

  for (const [topicId, lesson] of Object.entries(topics)) {
    const { errors, warnings, counts, sections, words } = checkLesson(lesson.concept);
    lessons++;
    totalErrors += errors.length;
    totalWarnings += warnings.length;

    const blockSummary = Object.entries(counts)
      .filter(([t]) => !["prose", "list", "heading"].includes(t))
      .sort((a, b) => b[1] - a[1])
      .map(([t, n]) => `${t.replace("callout:", "")}${n > 1 ? `x${n}` : ""}`)
      .join(" ");

    const status = errors.length ? "FAIL" : warnings.length ? "warn" : "ok  ";
    console.log(`  ${status} ${topicId.padEnd(26)} ${String(words).padStart(4)}w  ${sections} sections  ${blockSummary}`);
    errors.forEach(e => console.log(`       ERROR: ${e}`));
    warnings.forEach(w => console.log(`       warn:  ${w}`));
  }
}

console.log(`\n${lessons} lesson(s) checked - ${totalErrors} error(s), ${totalWarnings} warning(s).`);
process.exit(totalErrors > 0 ? 1 : 0);
