// DeVert 100 LeetCode-style harness - public entry point.
//
// The workspace imports only this file. A learner's code plus a day's spec go
// in; a complete program and its stdin come out, ready for /api/coding/run.
// See spec.mjs for the spec shape and the wire protocol.

import * as java from "./java.mjs";
import * as python from "./python.mjs";
import * as cpp from "./cpp.mjs";
import * as javascript from "./javascript.mjs";
import * as c from "./c.mjs";
import {
  encodeStdin, parseRunOutput, parseCompilerStderr, checkCase, formatInput, formatValue, normalizeAnswer,
} from "./spec.mjs";

const LANGS = { java, python, cpp, javascript, c };

export const HARNESS_LANGUAGES = Object.keys(LANGS);

export function starterCode(spec, language) {
  return LANGS[language].stub(spec);
}

export function buildRun(spec, language, userCode, cases = spec.cases) {
  return { code: LANGS[language].program(spec, userCode), stdin: encodeStdin(spec, cases) };
}

// Pair each case with what came back.
//
// Per-case `status`:
//   "pass" | "fail"   the function returned; right or wrong answer
//   "runtime"         it threw - `error` = { type, message, line, trace }
//   "timeout"         it started and never finished: time limit, or a crash
//                     nothing inside the program could catch (e.g. segfault)
//   "notRun"          an earlier case killed the run before this one began
//
// Run-level `compileErrors`: [{ line, col, message }] in the learner's own line
// numbers - from the driver's CE marker (Java / Python / JS compile the
// learner's code in-process) or from gcc's stderr (C / C++). When present, no
// case ran.
export function gradeRun(spec, stdout, cases = spec.cases, stderr = "") {
  const { cases: got, trailing, compileErrors: ce, lastStarted } = parseRunOutput(stdout, cases.length);
  const compileErrors = ce || (!got.some(Boolean) ? parseCompilerStderr(stderr) : null);
  const results = cases.map((tc, i) => {
    const g = got[i];
    const base = { label: tc.label, input: formatInput(spec, tc), expected: formatValue(normalizeAnswer(spec, tc, tc.expected)) };
    if (compileErrors) return { ...base, status: "notRun", stdout: "" };
    if (g?.error) return { ...base, status: "runtime", error: g.error, stdout: g.stdout };
    if (!g || !g.parsed) {
      const died = i === lastStarted || (lastStarted < 0 && i === 0);
      return { ...base, status: died ? "timeout" : "notRun", stdout: died ? trailing : "" };
    }
    return {
      ...base,
      output: formatValue(normalizeAnswer(spec, tc, g.value)),
      status: checkCase(spec, tc, g.value) ? "pass" : "fail",
      stdout: g.stdout,
    };
  });
  return { results, trailing, compileErrors };
}

export { formatInput, formatValue };
