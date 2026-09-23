// Python runner: Pyodide inside a Web Worker built from a Blob URL.
// Blob URL means no worker file has to exist in /public - safe under
// `output: 'export'`. One warm worker is reused across runs (Pyodide boot is
// expensive); on timeout we terminate and respawn because a synchronous
// Python exec cannot be interrupted any other way.

const PYODIDE_CDN = "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/";

// Defined once at boot inside the worker. Fresh globals + fresh StringIO
// per run so state never leaks between test cases.
const PY_HARNESS = `
import sys, io, traceback

def __devert_run(code, stdin_text):
    stdin_backup, stdout_backup, stderr_backup = sys.stdin, sys.stdout, sys.stderr
    sys.stdin = io.StringIO(stdin_text)
    out = sys.stdout = io.StringIO()
    err = sys.stderr = io.StringIO()
    try:
        exec(compile(code, '<solution>', 'exec'), {'__name__': '__main__'})
    except SystemExit:
        pass
    except BaseException:
        traceback.print_exc()
    finally:
        sys.stdin, sys.stdout, sys.stderr = stdin_backup, stdout_backup, stderr_backup
    return [out.getvalue(), err.getvalue()]
`;

const WORKER_SOURCE = `
importScripts('${PYODIDE_CDN}pyodide.js');
var HARNESS = ${JSON.stringify(PY_HARNESS)};
var pyodideReady = loadPyodide({ indexURL: '${PYODIDE_CDN}' })
  .then(function (py) {
    py.runPython(HARNESS);
    postMessage({ type: 'ready' });
    return py;
  })
  .catch(function (err) {
    postMessage({ type: 'boot-error', error: String(err) });
    throw err;
  });

self.onmessage = function (e) {
  var data = e.data || {};
  var id = data.id;
  pyodideReady.then(function (py) {
    try {
      var run = py.globals.get('__devert_run');
      var proxy = run(String(data.code || ''), String(data.stdin || ''));
      var pair = proxy.toJs();
      proxy.destroy();
      run.destroy();
      postMessage({ type: 'result', id: id, stdout: pair[0], stderr: pair[1], error: null });
    } catch (err) {
      var msg = String((err && err.message) || err);
      postMessage({ type: 'result', id: id, stdout: '', stderr: msg, error: msg });
    }
  }, function (err) {
    postMessage({ type: 'result', id: id, stdout: '', stderr: '', error: 'Python runtime failed to load: ' + String(err) });
  });
};
`;

let worker = null;
let workerUrl = null;
let ready = null;
let seq = 0;
const pending = new Map();
// Runs are serialized so a job's timeout timer never ticks while another
// job is still hogging the single worker.
let chain = Promise.resolve();

function killWorker() {
  if (worker) worker.terminate();
  if (workerUrl) URL.revokeObjectURL(workerUrl);
  worker = null;
  workerUrl = null;
  ready = null;
  for (const job of pending.values()) job.abort(new Error("Python runtime was restarted"));
  pending.clear();
}

function ensureWorker() {
  if (worker) return;
  if (typeof Worker === "undefined") {
    throw new Error("Code execution is only available in the browser");
  }
  const blob = new Blob([WORKER_SOURCE], { type: "text/javascript" });
  workerUrl = URL.createObjectURL(blob);
  worker = new Worker(workerUrl);
  ready = new Promise((resolve, reject) => {
    worker.onmessage = (e) => {
      const msg = e.data || {};
      if (msg.type === "ready") {
        resolve();
        return;
      }
      if (msg.type === "boot-error") {
        reject(new Error(msg.error));
        return;
      }
      if (msg.type === "result") {
        const job = pending.get(msg.id);
        if (job) {
          pending.delete(msg.id);
          job.settle(msg);
        }
      }
    };
    worker.onerror = (err) => {
      reject(new Error("Python worker error: " + ((err && err.message) || "unknown")));
      const jobs = [...pending.values()];
      pending.clear();
      jobs.forEach((job) => job.abort(new Error("Python worker crashed")));
    };
  });
  ready.catch(() => {}); // consumers re-await; avoid unhandled-rejection noise
}

/** Kick off the Pyodide download/boot early. Resolves when the runtime is ready. */
export function preloadPython() {
  ensureWorker();
  return ready;
}

export function isPythonReady() {
  return worker != null;
}

/**
 * Run python `code` with `stdin`. Never rejects - always resolves to
 * { stdout, stderr, timeMs, timedOut, error }.
 */
export function runPython(code, stdin = "", timeoutMs = 10000) {
  const job = chain.then(() => execute(code, stdin, timeoutMs));
  chain = job.then(
    () => {},
    () => {}
  );
  return job;
}

async function execute(code, stdin, timeoutMs) {
  try {
    ensureWorker();
    await ready; // boot time never eats into the per-test budget
  } catch (err) {
    killWorker(); // allow a later retry to respawn cleanly
    return {
      stdout: "",
      stderr: "",
      timeMs: 0,
      timedOut: false,
      error: "Python runtime failed to load: " + ((err && err.message) || err),
    };
  }
  const id = ++seq;
  const t0 = Date.now();
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      pending.delete(id);
      killWorker();
      resolve({
        stdout: "",
        stderr: "",
        timeMs: Date.now() - t0,
        timedOut: true,
        error: `Time limit exceeded (${Math.round(timeoutMs / 1000)}s)`,
      });
    }, timeoutMs);
    pending.set(id, {
      settle: (msg) => {
        clearTimeout(timer);
        resolve({
          stdout: msg.stdout || "",
          stderr: msg.stderr || "",
          timeMs: Date.now() - t0,
          timedOut: false,
          error: msg.error || null,
        });
      },
      abort: (err) => {
        clearTimeout(timer);
        resolve({
          stdout: "",
          stderr: "",
          timeMs: Date.now() - t0,
          timedOut: false,
          error: String((err && err.message) || err),
        });
      },
    });
    worker.postMessage({ id, code: String(code || ""), stdin: String(stdin || "") });
  });
}
