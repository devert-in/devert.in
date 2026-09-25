// Compiles every ```java block in every DeVert 100 deep dive, and runs the
// per-day assertions in scripts/data/devert100-deepdives/tests/day-NNN.java
// when one exists.
//
// WHY THIS EXISTS. These writeups are read by people learning the material,
// who have no reason to doubt the code and every reason to copy it. Published
// Java that does not compile - or compiles and returns the wrong answer - is
// worse than publishing nothing, because it teaches the wrong thing
// confidently. "It looks right" is not a standard; compiling it is.
//
// Usage:
//   node scripts/verify-devert100-java.mjs            # every authored day
//   node scripts/verify-devert100-java.mjs --day 3
//
// Exit code is non-zero if anything fails, so this can gate an import.

import { readFileSync, readdirSync, existsSync, mkdtempSync, writeFileSync, rmSync } from "fs";
import { execFileSync } from "child_process";
import { tmpdir } from "os";
import { join } from "path";

const DIR = "scripts/data/devert100-deepdives";
const TESTS = join(DIR, "tests");

const argv = process.argv.slice(2);
const dayArg = argv.indexOf("--day");
const ONLY = dayArg !== -1 ? Number(argv[dayArg + 1]) : null;

const LF = String.fromCharCode(10);

// Pull fenced java blocks. A deep dive has at least two (brute force and the
// real implementation) and often a third for a follow-up variant.
function javaBlocks(md) {
  const out = [];
  const lines = md.split(LF);
  let inBlock = false, buf = [], section = "?";
  for (const raw of lines) {
    const line = raw.replace(/\r$/, "");
    const sec = line.match(/^===\s*([A-Za-z]+)\s*===\s*$/);
    if (sec) { section = sec[1]; continue; }
    if (!inBlock && /^```java\s*$/.test(line)) { inBlock = true; buf = []; continue; }
    if (inBlock && /^```\s*$/.test(line)) { inBlock = false; out.push({ section, code: buf.join(LF) }); continue; }
    if (inBlock) buf.push(line);
  }
  return out;
}

// Each block declares `class Solution`, so they cannot share a file. Every
// block is compiled on its own, renamed to keep them apart.
function compileBlock(code, name, work) {
  const renamed = code.replace(/\bclass\s+Solution\b/, `class ${name}`);
  const needsImports = /\bMap<|\bHashMap<|\bList<|\bArrayList<|\bSet<|\bHashSet<|Arrays\./.test(renamed)
    && !/^import /m.test(renamed);
  const src = (needsImports ? "import java.util.*;" + LF + LF : "") + renamed;
  const file = join(work, `${name}.java`);
  writeFileSync(file, src);
  execFileSync("javac", ["-nowarn", "-d", work, file], { stdio: "pipe" });
}

const files = readdirSync(DIR)
  .filter(f => /^day-\d+\.md$/.test(f))
  .filter(f => ONLY === null || Number(f.match(/\d+/)[0]) === ONLY)
  .sort();

if (!files.length) {
  console.log(ONLY !== null ? `No deep dive authored for day ${ONLY}.` : "No deep dives authored yet.");
  process.exit(0);
}

let blocksOk = 0, blocksFailed = 0, testsRun = 0, testsFailed = 0;
const work = mkdtempSync(join(tmpdir(), "d100-"));

try {
  for (const f of files) {
    const day = Number(f.match(/\d+/)[0]);
    const md = readFileSync(join(DIR, f), "utf8");
    const blocks = javaBlocks(md);
    console.log(`\nday ${String(day).padStart(3)}  ${blocks.length} java block(s)`);

    // Two kinds of block, checked two different ways.
    //
    // A FULL block declares a class and must compile standalone. A FRAGMENT is
    // one or two lines quoted out of a full block to explain them - it can
    // never compile on its own, because its variables are declared elsewhere.
    //
    // Skipping fragments would be the easy answer and the wrong one: the real
    // risk with a quoted line is that it DRIFTS from the code it claims to
    // quote, so the explanation describes something the implementation no
    // longer does. So every fragment is required to appear verbatim (modulo
    // whitespace) inside one of the full blocks in the same file.
    const isClassBlock = (code) => /(^|[^A-Za-z0-9_])class[ 	]+[A-Za-z_]/.test(code);
    const full = blocks.filter(b => isClassBlock(b.code));
    const fullNormalised = full.map(b => b.code.replace(/\s+/g, " "));

    blocks.forEach((b, i) => {
      const isFull = isClassBlock(b.code);
      if (isFull) {
        const name = `D${day}B${i}`;
        try {
          compileBlock(b.code, name, work);
          console.log(`    ok      [${b.section}] class block`);
          blocksOk++;
        } catch (e) {
          const msg = (e.stderr?.toString() || e.message).trim().split(LF).slice(0, 6).join(LF + "            ");
          console.log(`    FAILED  [${b.section}] class block`);
          console.log(`            ${msg}`);
          blocksFailed++;
        }
        return;
      }

      const needle = b.code.replace(/\s+/g, " ").trim();
      if (!needle) return;
      if (fullNormalised.some(f => f.includes(needle))) {
        console.log(`    ok      [${b.section}] quoted fragment matches the implementation`);
        blocksOk++;
      } else {
        console.log(`    DRIFT   [${b.section}] fragment is not present in any class block:`);
        console.log(`            ${needle.slice(0, 100)}`);
        blocksFailed++;
      }
    });

    // Hand-written assertions, if this day has them. Compilation proves the
    // code is valid Java; only these prove it returns the right answers.
    const testFile = join(TESTS, `day-${String(day).padStart(3, "0")}.java`);
    if (existsSync(testFile)) {
      const cls = `Day${day}Test`;
      try {
        const src = readFileSync(testFile, "utf8").replace(/\bclass\s+\w*Test\b/, `class ${cls}`);
        const p = join(work, `${cls}.java`);
        writeFileSync(p, src);
        execFileSync("javac", ["-nowarn", "-d", work, p], { stdio: "pipe" });
        const out = execFileSync("java", ["-cp", work, cls], { stdio: "pipe" }).toString().trim();
        console.log(out.split(LF).map(l => "    " + l).join(LF));
        if (/FAIL/.test(out)) { testsFailed++; } else { testsRun++; }
      } catch (e) {
        console.log(`    TEST FAILED  ${(e.stderr?.toString() || e.message).trim().split(LF).slice(0, 8).join(LF + "                 ")}`);
        testsFailed++;
      }
    } else {
      console.log(`    (no assertions file - compilation only)`);
    }
  }
} finally {
  rmSync(work, { recursive: true, force: true });
}

console.log(`\n${blocksOk} block(s) compiled, ${blocksFailed} failed. ${testsRun} day(s) asserted, ${testsFailed} failed.`);
process.exit(blocksFailed || testsFailed ? 1 : 0);
