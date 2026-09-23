// Piston runner for compiled/JVM languages (java, c, cpp).
// pistonUrl comes from system/prepConfig (cached in-module) so the college
// can point at a self-hosted Piston instance without redeploying.
// A module-level promise queue caps concurrency at 2 and backs off
// exponentially on 429/5xx so the public emkc instance is never hammered.

import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const DEFAULT_PISTON_URL = "https://emkc.org/api/v2/piston";
const MAX_CONCURRENT = 2;
const MAX_RETRIES = 4;
const BACKOFF_BASE_MS = 350;

let pistonUrlPromise = null;

function getPistonUrl() {
  if (!pistonUrlPromise) {
    pistonUrlPromise = getDoc(doc(db, "system", "prepConfig"))
      .then((snap) => {
        const url = snap.exists() ? snap.data().pistonUrl : null;
        return (typeof url === "string" && url.trim()) || DEFAULT_PISTON_URL;
      })
      .catch(() => DEFAULT_PISTON_URL);
  }
  return pistonUrlPromise;
}

// ── tiny promise queue ──
const queue = [];
let active = 0;

function enqueue(task) {
  return new Promise((resolve, reject) => {
    queue.push({ task, resolve, reject });
    pump();
  });
}

function pump() {
  while (active < MAX_CONCURRENT && queue.length) {
    const { task, resolve, reject } = queue.shift();
    active++;
    task()
      .then(resolve, reject)
      .finally(() => {
        active--;
        pump();
      });
  }
}

/** Honest queue state for "queued/running" UI. */
export function pistonQueueInfo() {
  return { active, queued: queue.length };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function postExecute(url, body, timeoutMs) {
  let lastErr = null;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      await sleep(BACKOFF_BASE_MS * 2 ** (attempt - 1) + Math.floor(Math.random() * 100));
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      if (res.status === 429 || res.status >= 500) {
        lastErr = new Error(`Execution service responded ${res.status}`);
        continue; // retryable
      }
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Execution service error ${res.status}${text ? `: ${text.slice(0, 200)}` : ""}`);
      }
      return await res.json();
    } catch (err) {
      if (err && err.name === "AbortError") {
        // Retrying a 20s timeout would stall the UI for minutes - surface it.
        const timeoutErr = new Error("Execution timed out");
        timeoutErr.timedOut = true;
        throw timeoutErr;
      }
      if (err && err.retryFatal) throw err;
      lastErr = err; // network blips are retryable too
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastErr || new Error("Execution service request failed");
}

/**
 * Run `code` in `language` (java | c | cpp) via Piston. Never rejects - * always resolves to { stdout, stderr, timeMs, timedOut, error }.
 */
export async function runPiston(language, code, stdin = "", timeoutMs = 20000) {
  const url = await getPistonUrl();
  let t0 = Date.now();
  try {
    const data = await enqueue(() => {
      t0 = Date.now(); // measure run time, not queue wait
      return postExecute(
        `${url.replace(/\/+$/, "")}/execute`,
        {
          language,
          version: "*",
          files: [{ content: String(code || "") }],
          stdin: String(stdin || ""),
        },
        timeoutMs
      );
    });
    const timeMs = Date.now() - t0;
    const compile = data && data.compile;
    if (compile && compile.code != null && compile.code !== 0) {
      return {
        stdout: "",
        stderr: compile.stderr || compile.output || "Compilation failed",
        timeMs,
        timedOut: false,
        error: "Compilation failed",
      };
    }
    const run = (data && data.run) || {};
    const killed = run.signal === "SIGKILL"; // piston kills on its own limits
    return {
      stdout: run.stdout || "",
      stderr: run.stderr || "",
      timeMs,
      timedOut: killed,
      error: killed
        ? "Killed (time or memory limit)"
        : run.code != null && run.code !== 0
          ? `Exited with code ${run.code}`
          : null,
    };
  } catch (err) {
    const timeMs = Date.now() - t0;
    if (err && err.timedOut) {
      return {
        stdout: "",
        stderr: "",
        timeMs,
        timedOut: true,
        error: `Time limit exceeded (${Math.round(timeoutMs / 1000)}s)`,
      };
    }
    return {
      stdout: "",
      stderr: "",
      timeMs,
      timedOut: false,
      error: String((err && err.message) || err),
    };
  }
}
