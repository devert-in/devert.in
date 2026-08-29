// JavaScript runner: sandboxed Web Worker built from a Blob URL.
// The user code runs inside `new Function(...)` with a shadowed `console`
// capturing stdout, and readLine()/readline()/input() fed line-by-line from
// the stdin string. Timeout = terminate + lazy respawn (workers are cheap).

const WORKER_SOURCE = `
self.onmessage = function (e) {
  var data = e.data || {};
  var id = data.id;
  var lines = String(data.stdin == null ? '' : data.stdin).split('\\n');
  var cursor = 0;
  var out = [];
  var errs = [];
  var finished = false;

  function fmt(v) {
    if (typeof v === 'string') return v;
    if (v instanceof Error) return String((v && v.stack) || v);
    if (typeof v === 'object' && v !== null) {
      try { return JSON.stringify(v); } catch (err) { return String(v); }
    }
    return String(v);
  }
  function joinArgs(args) { return Array.prototype.map.call(args, fmt).join(' '); }

  var consoleShim = {
    log: function () { out.push(joinArgs(arguments)); },
    info: function () { out.push(joinArgs(arguments)); },
    warn: function () { errs.push(joinArgs(arguments)); },
    error: function () { errs.push(joinArgs(arguments)); },
    debug: function () {},
    trace: function () {},
  };
  function readLine() { return cursor < lines.length ? lines[cursor++] : ''; }
  function print() { out.push(joinArgs(arguments)); }

  function finish(errText) {
    if (finished) return;
    finished = true;
    postMessage({
      type: 'result',
      id: id,
      stdout: out.join('\\n'),
      stderr: errs.concat(errText ? [errText] : []).join('\\n'),
      error: errText || null,
    });
  }

  try {
    var fn = new Function('console', 'readLine', 'readline', 'input', 'print', String(data.code || ''));
    var ret = fn(consoleShim, readLine, readLine, readLine, print);
    Promise.resolve(ret).then(
      function () { finish(null); },
      function (err) { finish(String((err && err.stack) || err)); }
    );
  } catch (err) {
    finish(String((err && err.stack) || err));
  }
};
`;

let worker = null;
let workerUrl = null;
let seq = 0;
const pending = new Map();
let chain = Promise.resolve(); // serialize runs: one warm worker, honest timers

function killWorker() {
  if (worker) worker.terminate();
  if (workerUrl) URL.revokeObjectURL(workerUrl);
  worker = null;
  workerUrl = null;
  for (const settle of pending.values()) {
    settle({ stdout: "", stderr: "", error: "JavaScript runner was restarted" });
  }
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
  worker.onmessage = (e) => {
    const msg = e.data || {};
    if (msg.type !== "result") return;
    const settle = pending.get(msg.id);
    if (settle) {
      pending.delete(msg.id);
      settle(msg);
    }
  };
  worker.onerror = (err) => {
    const jobs = [...pending.values()];
    pending.clear();
    jobs.forEach((settle) =>
      settle({ stdout: "", stderr: "", error: "Worker error: " + ((err && err.message) || "unknown") })
    );
  };
}

/**
 * Run javascript `code` with `stdin`. Never rejects — always resolves to
 * { stdout, stderr, timeMs, timedOut, error }.
 */
export function runJavascript(code, stdin = "", timeoutMs = 10000) {
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
  } catch (err) {
    return { stdout: "", stderr: "", timeMs: 0, timedOut: false, error: String(err.message || err) };
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
    pending.set(id, (msg) => {
      clearTimeout(timer);
      resolve({
        stdout: msg.stdout || "",
        stderr: msg.stderr || "",
        timeMs: Date.now() - t0,
        timedOut: false,
        error: msg.error || null,
      });
    });
    worker.postMessage({ id, code: String(code || ""), stdin: String(stdin || "") });
  });
}
