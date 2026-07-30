import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// devert-frontend/package.json has no "type": "module", so Node resolves
// everything under it as CommonJS and a plain `import` of the parser would
// fail on its `export` keywords. The parser is deliberately dependency-free
// (see its own header comment), which means its source can be loaded as an
// ESM data: URL - always module-typed regardless of any package.json - and
// tested as-is, with no build step and no duplicated copy of the logic.
const source = readFileSync(new URL("../devert-frontend/lib/lessonBlocks.js", import.meta.url), "utf8");
const {
  parseLessonBlocks, groupSections, parseLesson, tokenizeInline, slugifyHeading, usesRichBlocks,
} = await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);

// ---------------- backward compatibility ----------------
// These four cases are the entire behaviour of the original
// parseConceptBlocks. Every lesson in Firestore today is plain text, so if
// any of these regress, 247 published lessons regress with them.

test("plain prose stays one prose block", () => {
  const blocks = parseLessonBlocks("An Operating System is a layer.\nIt manages hardware.");
  assert.deepEqual(blocks, [{ type: "prose", text: "An Operating System is a layer.\nIt manages hardware." }]);
});

test("blank lines split prose into paragraphs", () => {
  const blocks = parseLessonBlocks("First para.\n\nSecond para.");
  assert.equal(blocks.length, 2);
  assert.deepEqual(blocks.map(b => b.type), ["prose", "prose"]);
});

test("leading dashes become a list", () => {
  const blocks = parseLessonBlocks("Roles:\n- Process management\n- Memory management");
  assert.deepEqual(blocks, [
    { type: "prose", text: "Roles:" },
    { type: "list", items: ["Process management", "Memory management"] },
  ]);
});

test("two-space indentation becomes pseudocode with one indent level stripped", () => {
  const blocks = parseLessonBlocks("Example:\n  int fd = open();\n    nested();");
  assert.deepEqual(blocks[1], { type: "code", text: "int fd = open();\n  nested();" });
});

// ---------------- headings and sections ----------------

test("## splits sections, content before the first heading is the lead-in", () => {
  const sections = parseLesson("Intro line.\n\n## What It Does\nBody.\n\n## Why It Matters\nMore.");
  assert.deepEqual(sections.map(s => s.title), [null, "What It Does", "Why It Matters"]);
  assert.deepEqual(sections.map(s => s.id), ["overview", "what-it-does", "why-it-matters"]);
});

test("a lesson with no headings is exactly one untitled section", () => {
  const sections = parseLesson("Just some legacy prose.");
  assert.equal(sections.length, 1);
  assert.equal(sections[0].title, null);
});

test("### stays inline as a sub-heading rather than starting a section", () => {
  const sections = parseLesson("## Top\n### Sub\nBody.");
  assert.equal(sections.length, 1);
  assert.deepEqual(sections[0].blocks.map(b => b.type), ["heading", "prose"]);
  assert.equal(sections[0].blocks[0].level, 3);
});

test("duplicate heading text yields unique section ids", () => {
  const sections = parseLesson("## Recap\nA.\n\n## Recap\nB.");
  assert.deepEqual(sections.map(s => s.id), ["recap", "recap-2"]);
});

test("a literal Overview heading never collides with the lead-in id", () => {
  const sections = parseLesson("Lead in.\n\n## Overview\nBody.");
  assert.deepEqual(sections.map(s => s.id), ["overview", "overview-2"]);
});

test("slugifyHeading survives punctuation and never returns empty", () => {
  assert.equal(slugifyHeading("What *is* an OS, really?"), "what-is-an-os-really");
  assert.equal(slugifyHeading("???"), "section");
});

// ---------------- callouts ----------------

test("a fenced callout parses its variant, title and nested blocks", () => {
  const [block] = parseLessonBlocks("::: analogy Restaurant manager\nA manager decides who does what.\n- and when\n:::");
  assert.equal(block.type, "callout");
  assert.equal(block.variant, "analogy");
  assert.equal(block.title, "Restaurant manager");
  assert.deepEqual(block.blocks.map(b => b.type), ["prose", "list"]);
});

test("callout variants are case-insensitive and titles optional", () => {
  const [block] = parseLessonBlocks("::: STORY\nOnce upon a time.\n:::");
  assert.equal(block.variant, "story");
  assert.equal(block.title, "");
});

test("an unknown variant still parses as a callout instead of vanishing", () => {
  const [block] = parseLessonBlocks("::: wharrgarbl\nStill visible.\n:::");
  assert.equal(block.type, "callout");
  assert.equal(block.variant, "wharrgarbl");
  assert.equal(block.blocks[0].text, "Still visible.");
});

test("an unterminated fence keeps the rest of the lesson instead of dropping it", () => {
  const [block] = parseLessonBlocks("::: remember\nKernel runs privileged.\nMore text nobody closed.");
  assert.equal(block.type, "callout");
  assert.match(block.blocks[0].text, /nobody closed/);
});

// ---------------- cards ----------------

test("cards split on the first :: and keep the tail in the body", () => {
  const [block] = parseLessonBlocks("::: cards\nProcess Management :: Decides which program gets the CPU :: and for how long\nFile Management :: Organizes data\n:::");
  assert.equal(block.type, "cards");
  assert.deepEqual(block.items, [
    { term: "Process Management", body: "Decides which program gets the CPU :: and for how long" },
    { term: "File Management", body: "Organizes data" },
  ]);
});

test("a card line with no separator becomes a title-only card", () => {
  const [block] = parseLessonBlocks("::: cards\nJust A Title\n:::");
  assert.deepEqual(block.items, [{ term: "Just A Title", body: "" }]);
});

test("a wrapped card body continues onto the row above", () => {
  const [block] = parseLessonBlocks("::: cards\nPaging :: Splits memory into fixed pages\nso allocation never fragments.\n:::");
  assert.equal(block.items.length, 1);
  assert.equal(block.items[0].body, "Splits memory into fixed pages so allocation never fragments.");
});

// ---------------- flow ----------------

test("a one-line arrow chain becomes ordered flow steps", () => {
  const [block] = parseLessonBlocks("::: flow\nUser -> Application -> OS -> Hardware\n:::");
  assert.equal(block.type, "flow");
  assert.deepEqual(block.steps.map(s => s.term), ["User", "Application", "OS", "Hardware"]);
});

test("flow steps may be one per line and may carry captions", () => {
  const [block] = parseLessonBlocks("::: flow Layers\nUser :: clicks something\nKernel :: does the privileged work\n:::");
  assert.equal(block.title, "Layers");
  assert.deepEqual(block.steps, [
    { term: "User", body: "clicks something" },
    { term: "Kernel", body: "does the privileged work" },
  ]);
});

// ---------------- timeline ----------------

test("timeline rows keep author order", () => {
  const [block] = parseLessonBlocks("::: timeline Boot\nPower On :: CPU starts\nBIOS :: Runs POST\nKernel :: Mounts root\n:::");
  assert.equal(block.type, "timeline");
  assert.equal(block.title, "Boot");
  assert.deepEqual(block.steps.map(s => s.term), ["Power On", "BIOS", "Kernel"]);
});

// ---------------- checkpoint ----------------

test("checkpoint parses prompt, options, the correct flag and the explanation", () => {
  const [block] = parseLessonBlocks([
    "::: checkpoint",
    "Your laptop runs 200 processes on 8 cores. What picks the next one?",
    "- ( ) The compiler",
    "- (x) The OS scheduler",
    "- ( ) The BIOS",
    "> The scheduler is the kernel component that chooses.",
    ":::",
  ].join("\n"));
  assert.equal(block.type, "checkpoint");
  assert.match(block.question, /200 processes/);
  assert.equal(block.options.length, 3);
  assert.deepEqual(block.options.map(o => o.correct), [false, true, false]);
  assert.match(block.explanation, /kernel component/);
});

test("checkpoint accepts an uppercase X and prose after the options as explanation", () => {
  const [block] = parseLessonBlocks("::: checkpoint\nQ?\n- (X) Right\n- ( ) Wrong\nBecause reasons.\n:::");
  assert.equal(block.options[0].correct, true);
  assert.equal(block.explanation, "Because reasons.");
});

// ---------------- reveal ----------------

test("reveal keeps its title and parses nested blocks", () => {
  const [block] = parseLessonBlocks("::: reveal Why can't apps touch hardware?\nBecause user mode forbids it.\n:::");
  assert.equal(block.type, "reveal");
  assert.equal(block.title, "Why can't apps touch hardware?");
  assert.equal(block.blocks[0].type, "prose");
});

// ---------------- inline formatting ----------------

test("inline tokenizer handles code, bold and italic", () => {
  assert.deepEqual(tokenizeInline("Call `open()` in **user mode**, *not* the kernel."), [
    { type: "text", text: "Call " },
    { type: "code", text: "open()" },
    { type: "text", text: " in " },
    { type: "bold", text: "user mode" },
    { type: "text", text: ", " },
    { type: "italic", text: "not" },
    { type: "text", text: " the kernel." },
  ]);
});

test("an unmatched delimiter stays literal text", () => {
  // 73 of the 247 existing CS Core lessons contain backticks; a stray one
  // must never swallow the rest of the paragraph.
  assert.deepEqual(tokenizeInline("a * b and a ` tick"), [{ type: "text", text: "a * b and a ` tick" }]);
});

test("tokenizer is not left stateful between calls by the shared regex", () => {
  const first = tokenizeInline("`a` and `b`");
  const second = tokenizeInline("`a` and `b`");
  assert.deepEqual(first, second);
});

test("empty and nullish text tokenize to nothing", () => {
  assert.deepEqual(tokenizeInline(""), []);
  assert.deepEqual(tokenizeInline(undefined), []);
});

// ---------------- robustness ----------------

test("parser tolerates empty, nullish and whitespace-only input", () => {
  assert.deepEqual(parseLessonBlocks(""), []);
  assert.deepEqual(parseLessonBlocks(null), []);
  assert.deepEqual(parseLessonBlocks("\n\n   \n"), []);
  assert.deepEqual(groupSections([]), []);
});

test("usesRichBlocks distinguishes a converted lesson from a legacy one", () => {
  assert.equal(usesRichBlocks("Plain prose.\n- a list"), false);
  assert.equal(usesRichBlocks("Plain prose.\n\n::: remember\nThis.\n:::"), true);
  assert.equal(usesRichBlocks("## A heading\nBody."), true);
});

test("a realistic converted lesson parses into the expected block sequence", () => {
  const lesson = [
    "## What Is An Operating System?",
    "",
    "::: story",
    "Imagine a huge restaurant at full capacity.",
    ":::",
    "",
    "The OS is that manager.",
    "",
    "::: cards Its four jobs",
    "Process Management :: Who gets the CPU, and for how long",
    "Memory Management :: Who gets which RAM, and who may not touch it",
    ":::",
    "",
    "::: flow",
    "You -> App -> OS -> Hardware",
    ":::",
    "",
    "::: checkpoint",
    "Which one runs in privileged mode?",
    "- (x) The kernel",
    "- ( ) Your text editor",
    "> Only the kernel runs privileged.",
    ":::",
    "",
    "## Kernel vs Operating System",
    "",
    "::: remember",
    "The kernel is the core; the OS is the kernel plus everything shipped around it.",
    ":::",
  ].join("\n");

  const sections = parseLesson(lesson);
  assert.deepEqual(sections.map(s => s.title), ["What Is An Operating System?", "Kernel vs Operating System"]);
  assert.deepEqual(sections[0].blocks.map(b => b.type), ["callout", "prose", "cards", "flow", "checkpoint"]);
  assert.deepEqual(sections[1].blocks.map(b => b.type), ["callout"]);
});
