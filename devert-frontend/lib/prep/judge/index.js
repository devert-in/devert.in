// Code judge — public API (design §6).
//
//   runOnce({ language, code, stdin })
//     → { stdout, stderr, timeMs, timedOut, error }
//
//   runTests({ language, code, testCases, stdinOnly, onProgress })
//     → { results: [{ pass, stdout, stderr, expected, timeMs, timedOut, error }], passed, total }
//
// python     → Pyodide in a Blob-URL Web Worker (client-side, zero server load)
// javascript → sandboxed Blob-URL Web Worker
// java/c/cpp → Piston (queued, concurrency 2, backoff on 429/5xx)
//
// onProgress is called twice per test:
//   { index, total, status: 'running', result: null }  before the test starts
//   { index, total, status: 'done',    result }        after it finishes
//
// Neither function rejects for run failures — errors surface in `error` /
// `timedOut` on the result so UIs can render them per test case.

import { runPython, preloadPython, isPythonReady } from "./pyodide-runner";
import { runJavascript } from "./js-runner";
import { runPiston, pistonQueueInfo } from "./piston-runner";
import { normalizeOutput, outputsMatch } from "./compare";

export { normalizeOutput, outputsMatch, preloadPython, isPythonReady, pistonQueueInfo };

export const DEFAULT_TEST_TIMEOUT_MS = 10000;
export const PISTON_TIMEOUT_MS = 20000;
export const JUDGE_LANGUAGES = ["python", "javascript", "java", "c", "cpp"];

/** Languages executed entirely in the browser (no shared infrastructure). */
export function isClientSideLanguage(language) {
  return language === "python" || language === "javascript";
}

export async function runOnce({ language, code, stdin = "", timeoutMs } = {}) {
  if (!code || !String(code).trim()) {
    return { stdout: "", stderr: "", timeMs: 0, timedOut: false, error: "No code to run" };
  }
  switch (language) {
    case "python":
      return runPython(code, stdin, timeoutMs || DEFAULT_TEST_TIMEOUT_MS);
    case "javascript":
      return runJavascript(code, stdin, timeoutMs || DEFAULT_TEST_TIMEOUT_MS);
    case "java":
    case "c":
    case "cpp":
      return runPiston(language, code, stdin, timeoutMs || PISTON_TIMEOUT_MS);
    default:
      return {
        stdout: "",
        stderr: "",
        timeMs: 0,
        timedOut: false,
        error: `Unsupported language: ${String(language)}`,
      };
  }
}

export async function runTests({
  language,
  code,
  testCases = [],
  stdinOnly = true, // reserved: all runners currently feed input via stdin
  onProgress,
  timeoutMs,
} = {}) {
  void stdinOnly;
  const cases = Array.isArray(testCases) ? testCases : [];
  const total = cases.length;
  const results = [];
  let passed = 0;

  for (let i = 0; i < total; i++) {
    const t = cases[i] || {};
    if (typeof onProgress === "function") {
      onProgress({ index: i, total, status: "running", result: null });
    }
    const run = await runOnce({
      language,
      code,
      stdin: t.input != null ? t.input : "",
      timeoutMs,
    });
    const expected = t.expectedOutput != null ? t.expectedOutput : "";
    const pass = !run.timedOut && !run.error && outputsMatch(run.stdout, expected);
    const result = {
      pass,
      stdout: run.stdout,
      stderr: run.stderr,
      expected,
      timeMs: run.timeMs,
      timedOut: run.timedOut,
      error: run.error,
    };
    results.push(result);
    if (pass) passed++;
    if (typeof onProgress === "function") {
      onProgress({ index: i, total, status: "done", result });
    }
  }

  return { results, passed, total };
}
