// The lesson authoring format for every Campus learning module (CS Core,
// Programming, Aptitude, Company Prep, Daily Learning).
//
// A lesson body is still ONE freeform string in Firestore (`concept`) - this
// is deliberately a parser over that existing field, not a new schema. Every
// lesson already in the database keeps rendering exactly as it does today:
// the plain-prose / "- " list / two-space-indented pseudocode rules that
// campus-daily-learning.jsx's original parseConceptBlocks established are
// preserved verbatim below, and anything that doesn't match a new construct
// falls through to prose. That property is what makes this safe to ship
// ahead of the content rewrite - nothing has to be re-authored first, and a
// half-converted lesson is never broken, only partly plain.
//
// What the format adds, on top of that fallthrough:
//
//   ## Section heading            splits a wall of text into named sections
//                                 (drives the reading-progress rail)
//   ### Sub-heading
//
//   ::: story                     a fenced block. `story` is the variant;
//   Imagine a restaurant...       anything after it on the same line is an
//   :::                           optional title.
//
//   ::: analogy Restaurant manager
//   ...
//   :::
//
//   ::: cards                     tap-to-expand cards, one per `Title :: Body`
//   Process Management :: Decides which program gets the CPU
//   Memory Management :: Allocates and protects RAM
//   :::
//
//   ::: flow                      a directed diagram; `->` separates steps,
//   User -> Application -> OS -> Hardware      on one line or one per line
//   :::
//
//   ::: timeline Boot process     an ordered, captioned sequence
//   Power On :: The CPU starts executing from a fixed address
//   BIOS :: Runs POST, finds a bootable device
//   :::
//
//   ::: checkpoint                an inline formative question - instant
//   What decides which process runs next?      feedback, no grade, no reward
//   - ( ) The compiler
//   - (x) The OS scheduler
//   > The scheduler is the kernel component that picks the next process.
//   :::
//
//   ::: reveal Why not talk to hardware directly?    collapsed until clicked
//   Because...
//   :::
//
//   ::: table Powers of 2                 pipe-delimited rows, header row
//   Power | Value                         first - for formula/reference
//   2^10 | 1,024                          tables (shortcut cheat-sheets,
//   2^20 | 1,048,576                      unit conversions, etc.)
//   :::
//
// Callout/reveal bodies are parsed recursively, so prose, "- " lists and
// indented pseudocode all work inside a fence too.
//
// Inline, within any prose/list/card/callout text: **bold**, *italic*,
// `code`. Only matched pairs on the same line are formatting - a stray
// unmatched backtick or asterisk stays literal text, which matters because
// 73 of the 247 existing CS Core lessons already contain backticks that
// today render as raw punctuation.

const FENCE_OPEN = /^:::[ \t]*([a-zA-Z][a-zA-Z0-9-]*)[ \t]*(.*)$/;
const FENCE_CLOSE = /^:::[ \t]*$/;
const HEADING = /^(#{2,3})[ \t]+(.+?)[ \t]*#*$/;
const LIST_ITEM = /^\s*[-*]\s+/;
// Two-space-indent-means-pseudocode, exactly as the original parser had it.
const INDENTED = /^\s{2,}\S/;
const OPTION = /^\s*[-*]\s*\(([xX ]?)\)\s*(.+)$/;
const NOTE = /^\s*>\s?(.*)$/;
// `Term :: Body` rows (cards, timeline, captioned flow steps). Non-greedy on
// the term so `A :: B :: C` splits at the FIRST separator and the rest stays
// in the body, rather than silently dropping the tail.
const ROW = /^(.*?)[ \t]*::[ \t]*(.*)$/;

// Fenced variants that render as a titled, tinted callout card. The renderer
// owns the icon/color per variant (see components/campus/lesson-blocks.jsx);
// an unknown variant still parses as a callout and renders with the neutral
// fallback treatment, so a typo in the authoring format degrades to a plain
// card instead of vanishing.
export const CALLOUT_VARIANTS = [
  "story", "analogy", "funfact", "didyouknow", "mistake",
  "remember", "behind", "interview", "revision", "tip", "quote", "note",
];

// Fences whose body is structured rather than free prose - listed here so
// the admin editor's palette and the parser agree on one source of truth.
export const STRUCTURED_VARIANTS = ["cards", "flow", "timeline", "checkpoint", "reveal", "table"];

export function slugifyHeading(text) {
  return (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "section";
}

// Splits a line's text into formatting runs. Pure (no JSX) so it can be unit
// tested and so the renderer stays a thin map over the result. Longest-first
// alternation with backreference-free literal pairs: `code` wins over
// **bold** wins over *italic*, and an unmatched delimiter never starts a run.
const INLINE = /`([^`\n]+)`|\*\*([^*\n]+?)\*\*|\*([^*\n]+?)\*/g;

export function tokenizeInline(text) {
  if (!text) return [];
  const tokens = [];
  let last = 0;
  let m;
  INLINE.lastIndex = 0;
  while ((m = INLINE.exec(text)) !== null) {
    if (m.index > last) tokens.push({ type: "text", text: text.slice(last, m.index) });
    if (m[1] !== undefined) tokens.push({ type: "code", text: m[1] });
    else if (m[2] !== undefined) tokens.push({ type: "bold", text: m[2] });
    else tokens.push({ type: "italic", text: m[3] });
    last = m.index + m[0].length;
  }
  if (last < text.length) tokens.push({ type: "text", text: text.slice(last) });
  return tokens;
}

function parseRows(lines) {
  const rows = [];
  lines.forEach(line => {
    if (!line.trim()) return;
    const m = line.match(ROW);
    if (m && m[1].trim()) {
      rows.push({ term: m[1].trim(), body: m[2].trim() });
      return;
    }
    // A continuation line (no `::` of its own) belongs to the row above it,
    // so a long card body can be wrapped across lines in the editor.
    if (rows.length > 0) {
      rows[rows.length - 1].body = [rows[rows.length - 1].body, line.trim()].filter(Boolean).join(" ");
      return;
    }
    rows.push({ term: line.trim(), body: "" });
  });
  return rows;
}

// Pipe-delimited rows for the `table` fence - header row first, then one
// data row per line. Deliberately a separate helper from parseRows() above:
// that one splits on the FIRST `::` into exactly a term/body pair (cards,
// timeline), while a table has an arbitrary, author-chosen column count, so
// every cell on a row is split the same way instead of just the first two.
function parseTableRows(lines) {
  const rows = [];
  lines.forEach(line => {
    if (!line.trim()) return;
    rows.push(line.split("|").map(cell => cell.trim()));
  });
  return rows;
}

function parseFlowSteps(lines) {
  const steps = [];
  lines.forEach(line => {
    if (!line.trim()) return;
    line.split("->").forEach(part => {
      const chunk = part.trim();
      if (!chunk) return;
      const m = chunk.match(ROW);
      if (m && m[1].trim()) steps.push({ term: m[1].trim(), body: m[2].trim() });
      else steps.push({ term: chunk, body: "" });
    });
  });
  return steps;
}

function parseCheckpoint(lines, title) {
  const questionLines = [];
  const options = [];
  const noteLines = [];
  lines.forEach(line => {
    const opt = line.match(OPTION);
    if (opt) {
      options.push({ text: opt[2].trim(), correct: opt[1].toLowerCase() === "x" });
      return;
    }
    const note = line.match(NOTE);
    if (note) { noteLines.push(note[1]); return; }
    // Prompt text only counts before the first option - a stray prose line
    // after the options is treated as part of the explanation instead, which
    // is the likelier intent and never silently dropped.
    if (options.length === 0) questionLines.push(line);
    else if (line.trim()) noteLines.push(line.trim());
  });
  return {
    type: "checkpoint",
    title: title || "",
    question: questionLines.join("\n").trim(),
    options,
    explanation: noteLines.join("\n").trim(),
  };
}

function parseFence(variant, title, lines) {
  const v = variant.toLowerCase();
  if (v === "cards") return { type: "cards", title, items: parseRows(lines) };
  if (v === "flow") return { type: "flow", title, steps: parseFlowSteps(lines) };
  if (v === "timeline") return { type: "timeline", title, steps: parseRows(lines) };
  if (v === "checkpoint") return parseCheckpoint(lines, title);
  if (v === "reveal") return { type: "reveal", title, blocks: parseLessonBlocks(lines.join("\n")) };
  if (v === "table") {
    const [headers, ...rows] = parseTableRows(lines);
    return { type: "table", title, headers: headers || [], rows };
  }
  return { type: "callout", variant: v, title, blocks: parseLessonBlocks(lines.join("\n")) };
}

// The one parse entry point. Returns a flat block list, headings included as
// their own blocks - groupSections() below turns those into sections when a
// caller wants the sectioned reading experience.
export function parseLessonBlocks(text) {
  if (!text) return [];
  const lines = String(text).split("\n");
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === "") { i++; continue; }

    const fence = line.match(FENCE_OPEN);
    if (fence) {
      const body = [];
      i++;
      // An unterminated fence runs to the end of the lesson rather than
      // discarding the rest of it - authoring mistakes must never eat content.
      while (i < lines.length && !FENCE_CLOSE.test(lines[i])) { body.push(lines[i]); i++; }
      if (i < lines.length) i++; // consume the closing :::
      blocks.push(parseFence(fence[1], fence[2].trim(), body));
      continue;
    }

    const heading = line.match(HEADING);
    if (heading) {
      blocks.push({
        type: "heading",
        level: heading[1].length,
        text: heading[2].trim(),
        id: slugifyHeading(heading[2]),
      });
      i++;
      continue;
    }

    if (INDENTED.test(line)) {
      const codeLines = [];
      while (i < lines.length && INDENTED.test(lines[i])) {
        codeLines.push(lines[i].replace(/^ {2}/, ""));
        i++;
      }
      blocks.push({ type: "code", text: codeLines.join("\n") });
      continue;
    }

    if (LIST_ITEM.test(line)) {
      const items = [];
      while (i < lines.length && LIST_ITEM.test(lines[i])) {
        items.push(lines[i].replace(LIST_ITEM, ""));
        i++;
      }
      blocks.push({ type: "list", items });
      continue;
    }

    const proseLines = [];
    while (
      i < lines.length && lines[i].trim() !== "" &&
      !INDENTED.test(lines[i]) && !LIST_ITEM.test(lines[i]) &&
      !FENCE_OPEN.test(lines[i]) && !HEADING.test(lines[i])
    ) {
      proseLines.push(lines[i]);
      i++;
    }
    // Guard against a zero-length prose run (a line that matched none of the
    // constructs above but also fails the loop's own conditions) becoming an
    // infinite loop on malformed input.
    if (proseLines.length === 0) { i++; continue; }
    blocks.push({ type: "prose", text: proseLines.join("\n") });
  }

  return blocks;
}

// Groups a flat block list under its `## ` headings. Content before the
// first heading becomes an untitled lead-in section, so an unconverted
// lesson (no headings at all) yields exactly one section and renders
// identically to the flat list - the sectioned path is never a special case.
export function groupSections(blocks) {
  const sections = [];
  // Seeded with the lead-in section's own id so a lesson that also has a
  // literal "## Overview" heading doesn't end up with two elements sharing
  // one DOM id (which would break the jump rail's scrollIntoView).
  const usedIds = new Set(["overview"]);
  let current = { id: "overview", title: null, blocks: [] };

  const push = () => {
    if (current.blocks.length > 0 || current.title) sections.push(current);
  };

  blocks.forEach(b => {
    if (b.type === "heading" && b.level === 2) {
      push();
      let id = b.id;
      let n = 2;
      while (usedIds.has(id)) { id = `${b.id}-${n}`; n++; }
      usedIds.add(id);
      current = { id, title: b.text, blocks: [] };
      return;
    }
    current.blocks.push(b);
  });
  push();

  return sections;
}

// Convenience for callers that want both at once.
export function parseLesson(text) {
  return groupSections(parseLessonBlocks(text));
}

// True when a lesson body actually uses the rich format - lets a caller
// (e.g. the admin editor's preview badge, or a content audit script) tell a
// converted lesson from a legacy plain-text one without re-parsing by hand.
export function usesRichBlocks(text) {
  return parseLessonBlocks(text).some(b => b.type !== "prose" && b.type !== "list" && b.type !== "code");
}
