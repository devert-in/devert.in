// Builds and verifies the DeVert 100 LeetCode-style harness specs.
//
// A spec (scripts/data/devert100-harness/day-NNN.json) declares the function
// signature and the visible test cases. This script:
//
//   1. EXPECTED ANSWERS - runs the deep dive's own Java implementation (the one
//      verify-devert100-java.mjs already compiles and asserts) through the
//      generated Java driver, and records what it returns as each case's
//      `expected`. An expected answer someone typed in by hand is NOT trusted:
//      if the reference disagrees with it, that is reported as a failure, never
//      silently overwritten.
//   2. EVERY LANGUAGE - for each language, renders the stub with type-correct
//      dummy returns, wraps it in that language's driver, compiles and runs it
//      on every case. The answers are wrong by design; what is checked is that
//      the stub + driver compile together and the driver reports a parseable
//      result for every case. That is what proves the generated signature, the
//      reader and the writer agree.
//   3. REFERENCE SOLUTIONS - if scripts/data/devert100-harness/refs/day-NNN.<ext>
//      exists for a language, it must PASS every case through that language's
//      driver. These are the end-to-end proof for each language.
//
// Usage:
//   node scripts/build-devert100-harness.mjs                 # all days, write expected
//   node scripts/build-devert100-harness.mjs --day 17
//   node scripts/build-devert100-harness.mjs --lang c        # only check that language (step 2/3)
//   node scripts/build-devert100-harness.mjs --check         # never write, fail on any drift
//
// Toolchains (prod runs gcc-15 / g++-15 / openjdk-25 / python-3.14 / deno):
//   javac + java on PATH; DV100_PYTHON (default "python");
//   DV100_ZIG = path to zig.exe (used as cc / c++); DV100_CXX_INCLUDE = dir with
//   a bits/stdc++.h shim (zig's libc++ has none; g++ in prod does);
//   DV100_DENO = path to deno.

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdtempSync, rmSync } from "fs";
import { execFileSync } from "child_process";
import { tmpdir } from "os";
import { join } from "path";

const H = "../devert-frontend/lib/devert100-harness/";
const { encodeStdin, parseRunOutput, parseCompilerStderr, checkCase, normalizeAnswer } = await import(new URL(H + "spec.mjs", import.meta.url));
const LANG_MODULES = {
  java: await import(new URL(H + "java.mjs", import.meta.url)),
  python: await import(new URL(H + "python.mjs", import.meta.url)),
  cpp: await import(new URL(H + "cpp.mjs", import.meta.url)),
  javascript: await import(new URL(H + "javascript.mjs", import.meta.url)),
  c: await import(new URL(H + "c.mjs", import.meta.url)),
};
const EXT = { java: "java", python: "py", cpp: "cpp", javascript: "js", c: "c" };

const SPEC_DIR = "scripts/data/devert100-harness";
const REF_DIR = join(SPEC_DIR, "refs");
const DD_DIR = "scripts/data/devert100-deepdives";

const argv = process.argv.slice(2);
const arg = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : null; };
const ONLY_DAY = arg("--day") ? Number(arg("--day")) : null;
const ONLY_LANG = arg("--lang");
const CHECK = argv.includes("--check");
// Error reporting is checked whenever every day is being built, or on demand.
const ERRORS = argv.includes("--errors") || ONLY_DAY === null;

const pad = (d) => String(d).padStart(3, "0");

// ---- running a program ----------------------------------------------------

function run(lang, code, stdin, work) {
  const opts = { input: stdin, stdio: "pipe", timeout: 60000, maxBuffer: 64 * 1024 * 1024 };
  const exe = join(work, "main.exe");
  try {
    if (lang === "java") {
      writeFileSync(join(work, "Main.java"), code);
      execFileSync("javac", ["-nowarn", "-encoding", "UTF-8", "-d", work, join(work, "Main.java")], { stdio: "pipe" });
      return { stdout: execFileSync("java", ["-Xss64m", "-cp", work, "Main"], opts).toString() };
    }
    if (lang === "python") {
      writeFileSync(join(work, "main.py"), code);
      return { stdout: execFileSync(process.env.DV100_PYTHON || "python", [join(work, "main.py")], opts).toString() };
    }
    if (lang === "cpp" || lang === "c") {
      const zig = process.env.DV100_ZIG;
      if (!zig) return { skipped: "DV100_ZIG not set" };
      const src = join(work, lang === "c" ? "main.c" : "main.cpp");
      writeFileSync(src, code);
      const args = lang === "c"
        ? ["cc", "-std=gnu11", "-w", "-O1", src, "-o", exe, "-lm"]
        : ["c++", "-std=c++17", "-w", "-O1", ...(process.env.DV100_CXX_INCLUDE ? ["-I", process.env.DV100_CXX_INCLUDE] : []), src, "-o", exe];
      execFileSync(zig, args, { stdio: "pipe", timeout: 180000 });
      return { stdout: execFileSync(exe, [], opts).toString() };
    }
    if (lang === "javascript") {
      const deno = process.env.DV100_DENO;
      if (!deno) return { skipped: "DV100_DENO not set" };
      writeFileSync(join(work, "main.ts"), code);
      return { stdout: execFileSync(deno, ["run", "-A", "--quiet", join(work, "main.ts")], opts).toString() };
    }
  } catch (e) {
    const msg = (e.stderr?.toString() || "") + (e.stdout ? "\n[stdout]\n" + e.stdout.toString().slice(0, 600) : "") || e.message;
    return { error: msg.trim().split("\n").slice(0, 14).join("\n"), stderr: e.stderr?.toString() || "", stdout: e.stdout?.toString() || "" };
  }
  throw new Error("unknown language " + lang);
}

// ---- reference Java from the deep dive -------------------------------------

function referenceJava(day) {
  const md = readFileSync(join(DD_DIR, `day-${pad(day)}.md`), "utf8").replace(/\r/g, "");
  const impl = md.split(/^=== implementation ===$/m)[1]?.split(/^=== /m)[0] || "";
  const block = [...impl.matchAll(/```java\n([\s\S]*?)```/g)].map(m => m[1]).find(b => /(^|\n)\s*(public\s+)?class\s+\w+/.test(b));
  if (!block) throw new Error(`day ${day}: no Java class block in the implementation section`);
  return block;
}

// ---- main -----------------------------------------------------------------

const files = existsSync(SPEC_DIR)
  ? readdirSync(SPEC_DIR).filter(f => /^day-\d{3}\.json$/.test(f)).sort()
  : [];
const work = mkdtempSync(join(tmpdir(), "dv100h-"));
let failures = 0, written = 0;
const fail = (msg) => { failures++; console.log("    FAIL  " + msg.split("\n").join("\n          ")); };

try {
  for (const f of files) {
    const day = Number(f.match(/\d+/)[0]);
    if (ONLY_DAY !== null && day !== ONLY_DAY) continue;
    const path = join(SPEC_DIR, f);
    const spec = JSON.parse(readFileSync(path, "utf8"));
    console.log(`\nday ${String(day).padStart(3)}  ${spec.className}.${spec.functions.map(x => x.name).join("/")}  ${spec.cases.length} case(s)`);

    // 1. expected answers from the Java reference.
    if (!ONLY_LANG || ONLY_LANG === "java") {
      const ref = referenceJava(day);
      const r = run("java", LANG_MODULES.java.program(spec, ref), encodeStdin(spec), work);
      if (r.error) { fail(`java reference did not run:\n${r.error}`); continue; }
      const { cases } = parseRunOutput(r.stdout, spec.cases.length);
      let changed = false, ok = true;
      spec.cases.forEach((tc, i) => {
        const g = cases[i];
        if (!g || !g.parsed) { ok = false; fail(`case ${i} "${tc.label}": reference produced no result`); return; }
        if ("expected" in tc) {
          if (!checkCase(spec, tc, g.value)) {
            ok = false;
            fail(`case ${i} "${tc.label}": hand-written expected ${JSON.stringify(tc.expected)} but the verified reference returns ${g.raw}`);
          }
        } else {
          tc.expected = normalizeAnswer(spec, tc, g.value); changed = true;
        }
      });
      if (ok) console.log(`    ok    java reference agrees on all ${spec.cases.length} case(s)${changed ? " (filled in missing expected)" : ""}`);
      if (changed) {
        if (CHECK) fail("expected answers missing (run without --check to fill them)");
        else { writeFileSync(path, JSON.stringify(spec, null, 2) + "\n"); written++; }
      }
    }

    // 2 + 3. every language: dummy stub through the driver, then reference if present.
    for (const lang of Object.keys(LANG_MODULES)) {
      if (ONLY_LANG && ONLY_LANG !== lang) continue;
      const mod = LANG_MODULES[lang];
      let code;
      try { code = mod.program(spec, mod.stub(spec, { defaultReturn: true })); }
      catch (e) { if (/not implemented/.test(e.message)) { console.log(`    --    ${lang}: generator not implemented`); continue; } fail(`${lang}: generator threw: ${e.message}`); continue; }
      const r = run(lang, code, encodeStdin(spec), work);
      if (r.skipped) { console.log(`    --    ${lang}: skipped (${r.skipped})`); continue; }
      if (r.error) { fail(`${lang}: stub + driver failed:\n${r.error}`); continue; }
      const { cases } = parseRunOutput(r.stdout, spec.cases.length);
      const missing = cases.map((c, i) => (!c || !c.parsed ? i : -1)).filter(i => i >= 0);
      if (missing.length) { fail(`${lang}: stub + driver gave no parseable result for case(s) ${missing.join(", ")}`); continue; }
      let line = `    ok    ${lang}: stub + driver compile and report every case`;

      const refPath = join(REF_DIR, `day-${pad(day)}.${EXT[lang]}`);
      if (existsSync(refPath)) {
        const rr = run(lang, mod.program(spec, readFileSync(refPath, "utf8")), encodeStdin(spec), work);
        if (rr.error) { fail(`${lang}: reference solution failed to run:\n${rr.error}`); continue; }
        const got = parseRunOutput(rr.stdout, spec.cases.length).cases;
        const bad = spec.cases.map((tc, i) => (got[i] && got[i].parsed && checkCase(spec, tc, got[i].value) ? -1 : i)).filter(i => i >= 0);
        if (bad.length) { fail(`${lang}: reference solution FAILS case(s) ${bad.map(i => `${i} (got ${got[i]?.raw ?? "nothing"}, want ${JSON.stringify(spec.cases[i].expected)})`).join("; ")}`); continue; }
        line += `; reference solution passes all ${spec.cases.length}`;
      }
      console.log(line);
    }
  }

  // 4. ERROR REPORTING - the reason the drivers compile and catch for themselves.
  // refs/errors/day-001-ce.<ext> fails to compile and refs/errors/day-001-re.<ext>
  // throws in case 0; each marks the line the learner must be pointed at with a
  // DV100-EXPECT comment. The run must name exactly that line, and a throw in
  // one case must not stop the others.
  if (ERRORS) {
    const spec = JSON.parse(readFileSync(join(SPEC_DIR, "day-001.json"), "utf8"));
    console.log("\nerror reporting (day 1 fixtures)");
    for (const lang of Object.keys(LANG_MODULES)) {
      if (ONLY_LANG && ONLY_LANG !== lang) continue;
      for (const kind of ["ce", "re"]) {
        const fx = join(REF_DIR, "errors", `day-001-${kind}.${EXT[lang]}`);
        if (!existsSync(fx)) { console.log(`    --    ${lang} ${kind}: no fixture`); continue; }
        const src = readFileSync(fx, "utf8").replace(/\r/g, "");
        const want = src.split("\n").findIndex(l => l.includes("DV100-EXPECT")) + 1;
        const r = run(lang, LANG_MODULES[lang].program(spec, src), encodeStdin(spec), work);
        if (r.skipped) { console.log(`    --    ${lang} ${kind}: skipped (${r.skipped})`); continue; }
        const out = parseRunOutput(r.stdout || "", spec.cases.length);
        if (kind === "ce") {
          const ces = out.compileErrors || parseCompilerStderr(r.stderr || "");
          const hit = ces && ces.find(e => e.line === want);
          if (hit) console.log(`    ok    ${lang} compile error reported at line ${want}: ${hit.message}`);
          else fail(`${lang} compile error: wanted line ${want}, got ${JSON.stringify(ces)}${r.error ? "\n" + r.error : ""}`);
        } else {
          const e = out.cases[0]?.error;
          // C++ exceptions carry no line; a fixture with no DV100-EXPECT (want 0)
          // only has to be reported as a runtime error in the right case.
          if (e && (want === 0 ? e.line == null : e.line === want)) console.log(`    ok    ${lang} runtime error in case 0 at line ${want}: ${e.type}: ${e.message}`);
          else fail(`${lang} runtime error: wanted case 0 at line ${want}, got ${JSON.stringify(out.cases[0])}${r.error ? "\n" + r.error : ""}`);
          if (!out.cases.slice(1).every(Boolean)) fail(`${lang} runtime error: later cases did not run after case 0 threw`);
        }
      }
    }
  }
} finally {
  rmSync(work, { recursive: true, force: true });
}

console.log(`\n${failures ? failures + " failure(s)" : "all good"}${written ? `, ${written} spec(s) updated` : ""}.`);
process.exit(failures ? 1 : 0);
