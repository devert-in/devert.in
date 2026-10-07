// Live syntax checking for the DeVert 100 editor - red squiggles while typing.
//
// Free and server-less by design: nothing here calls the backend or spends run
// quota. What is possible client-side differs by language:
//
//   JavaScript  Monaco's own JS worker already reports syntax errors; the
//               workspace just keeps its syntax validation switched on.
//   Python      Pyodide (CPython compiled to WebAssembly, the same CDN build the
//               prep judge uses) in a Web Worker. We only call compile() - the
//               learner's code is never executed here - so a check costs a few
//               milliseconds once the runtime is warm. The ~10 MB runtime is
//               fetched lazily, the first time Python is selected, and cached.
//   Java/C/C++  A real checker needs a language server running on a server
//               (jdtls / clangd). Not free, so these get their squiggles from
//               the Run instead: the drivers report compile errors with the
//               learner's line numbers and the workspace marks them.

const PYODIDE_CDN = "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/";

const WORKER_SOURCE = `
importScripts('${PYODIDE_CDN}pyodide.js');
var ready = loadPyodide({ indexURL: '${PYODIDE_CDN}' }).then(function (py) {
  // A full compile(), not just a parse: errors such as "'return' outside
  // function" come from the compiler stage, after parsing succeeds.
  py.runPython([
    'def __dv_check(src):',
    '    try:',
    '        compile(src, "solution.py", "exec")',
    '        return []',
    '    except SyntaxError as e:',
    '        msg = e.msg or "invalid syntax"',
    '        return [[e.lineno or 1, e.offset or 1, e.end_lineno or e.lineno or 1, e.end_offset or 0, type(e).__name__ + ": " + msg]]',
  ].join('\\n'));
  return py;
});
self.onmessage = function (e) {
  var id = e.data.id;
  ready.then(function (py) {
    var fn = py.globals.get('__dv_check');
    var res = fn(String(e.data.code || ''));
    var list = res.toJs();
    res.destroy(); fn.destroy();
    postMessage({ id: id, errors: list });
  }, function (err) {
    postMessage({ id: id, unavailable: String(err) });
  });
};
`;

let worker = null;
let seq = 0;
const pending = new Map();

function pythonWorker() {
  if (worker) return worker;
  if (typeof window === "undefined" || typeof Worker === "undefined") return null;
  const url = URL.createObjectURL(new Blob([WORKER_SOURCE], { type: "text/javascript" }));
  worker = new Worker(url);
  worker.onmessage = (e) => {
    const p = pending.get(e.data.id);
    if (!p) return;
    pending.delete(e.data.id);
    p(e.data);
  };
  worker.onerror = () => {
    // Offline, CDN blocked, or an old browser: live checking simply stays off.
    // Run still reports every error, so nothing is lost but the squiggles.
    for (const p of pending.values()) p({ unavailable: "worker error" });
    pending.clear();
    worker = null;
  };
  return worker;
}

// Resolves to [{ startLine, startCol, endLine, endCol, message }] - empty when
// the code parses - or null when the checker is unavailable.
export function checkPythonSyntax(code) {
  const w = pythonWorker();
  if (!w) return Promise.resolve(null);
  const id = ++seq;
  return new Promise((resolve) => {
    pending.set(id, (data) => {
      if (data.unavailable) return resolve(null);
      resolve((data.errors || []).map(([startLine, startCol, endLine, endCol, message]) => ({
        startLine, startCol, endLine: Math.max(endLine, startLine),
        endCol: endLine > startLine || endCol > startCol ? endCol : startCol + 1, message,
      })));
    });
    w.postMessage({ id, code });
  });
}
