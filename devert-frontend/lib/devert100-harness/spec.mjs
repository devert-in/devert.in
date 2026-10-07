// DeVert 100 LeetCode-style harness: the language-independent half.
//
// A learner writes ONLY the function (or design class), exactly as on
// LeetCode. The workspace wraps it in a hidden driver program, feeds every
// visible test case through stdin in one run, and compares what comes back.
// This file owns everything that does not depend on the language:
//
//   - the type vocabulary (Java type strings are the canonical ids, because
//     every deep dive's reference solution is Java and the ids read naturally)
//   - encodeStdin(): turns a spec's cases into the token stream every
//     language's driver reads
//   - parseRunOutput(): splits the program's stdout back into per-case
//     results and the learner's own debug prints
//   - checkCase(): decides pass/fail, including order-insensitive answers and
//     problems with more than one valid answer
//   - formatInput(): the LeetCode-style "nums = [2,7], target = 9" display
//
// The per-language halves (java.mjs, python.mjs, ...) only render stubs and
// driver programs from the same spec.
//
// SPEC SHAPE (one per day, scripts/data/devert100-harness/day-NNN.json):
// {
//   "kind": "function" | "design",
//   "className": "Solution" | "MinStack" | ...,
//   "functions": [{ "name", "params": [{ "name", "type", "build"? }], "returns" }],
//   "constructor": { "params": [...] },          // design only
//   "inputs": [{ "name", "type" }],               // optional; defaults to params
//   "output": { "mode": "return" | "param" | "returnAndParamPrefix" | "nodeVal" | "graphCopy", "name"? },
//   "check": "exact" | "unordered" | "unorderedDeep" | "float" | "peak" | "topoOrder" | "longestPalindrome",
//   "cases": [{ "label", "fn"?, "input": {...}, "expected": ... }]
// }
// Design cases are { "label", "input": { "ops": [...], "args": [[...], ...] }, "expected": [...] }.
//
// INPUTS vs PARAMS. `inputs` is what LeetCode displays and what goes over stdin.
// By default it equals the (first) function's params. A param whose value is
// not simply "the input with my name" carries a `build`:
//   { "from": "adjList" }                                  - the input named adjList
//   { "cycle": { "values": "head", "pos": "pos" } }        - LC 141: list + tail->pos link
//   { "intersection": { "listA", "listB", "skipA", "skipB", "side": "A"|"B" } }
//                                                          - LC 160: two lists sharing a tail
//   { "ref": { "tree": "root", "value": "p" } }            - LC 236: the node in param `root`
//                                                            whose val is input `p`
//
// OUTPUT MODES (`output.mode`, default "return"):
//   "return"                  the return value
//   "param", name             a void in-place function: that param after the call
//   "returnAndParamPrefix", name
//                             [k, first k items of that param]  (LC 26, LC 443)
//   "nodeVal"                 a returned ListNode/TreeNode as its val, or null
//   "graphCopy"               a returned graph Node as an adjacency list ([] for
//                             null), or "NOT_A_DEEP_COPY" if any input node leaks
// Doubles are written with exactly 5 decimals ("%.5f"), like LeetCode.
//
// STDIN PROTOCOL (all whitespace-separated integers - trivially parseable in C):
//   T                         number of cases
//   per case (function):      fnIndex, then each input in `inputs` order
//   per case (design):        opCount, then the constructor args, then per op:
//                             methodIndex followed by that method's args
//   String / char             length then UTF-16 code units  /  one code unit
//   boolean                   0 or 1
//   1-D (int[], List, ...)    n then n values
//   2-D                       rows then, per row, n then n values
//   TreeNode                  n then n slots, each `0` (null) or `1 v` (level order)
//   Node (graph)              its adjacency list, as a 2-D int list (1-indexed vals)
//
// STDOUT PROTOCOL - every marker is on its own line (the driver prints a newline
// before it, so a learner's unterminated print cannot swallow it):
//   @@DV100@@ S <i>                 case i is starting
//   @@DV100@@ <i> <json>            case i's answer, as compact JSON
//   @@DV100@@ RE <i> <json>         case i threw. json = { "type", "message",
//                                   "line" (learner's line or null), "trace" (string,
//                                   learner frames only, learner line numbers) }
//   @@DV100@@ CE <json>             the learner's code does not compile. json = array of
//                                   { "line", "col", "message" } in LEARNER line numbers;
//                                   "line": null for a problem outside their code (e.g. a
//                                   renamed method the hidden driver calls). Nothing else
//                                   follows; the program exits normally.
// WHY THE DRIVER REPORTS ERRORS ITSELF: the runner (OnlineCompiler.io) turns every
// failing Java / Python / JavaScript program into one generic "Internal error",
// so a program that crashes tells the learner nothing. These drivers compile the
// learner's code from inside the program (javax.tools, compile(), new Function)
// and catch every exception per case, so the program itself always exits
// normally and the real message reaches the page. C / C++ compile errors already
// come back as gcc text on stderr and are parsed by parseCompilerStderr().
// Anything else on stdout is the learner's own printing, attributed to the case it
// was printed during. A case that started (S) and never finished means the run
// was killed there: time limit, or a crash nothing could catch (segfault).

export const MARKER = "@@DV100@@";

// ---- type vocabulary ----------------------------------------------------

const INT_1D = new Set(["int[]", "List<Integer>", "ArrayList<Integer>", "long[]"]);
const INT_2D = new Set(["int[][]", "List<List<Integer>>", "ArrayList<ArrayList<Integer>>"]);
const STR_1D = new Set(["String[]", "List<String>"]);
const STR_2D = new Set(["List<List<String>>"]);

export const TYPES = [
  "int", "long", "double", "boolean", "char", "String",
  ...INT_1D, ...INT_2D, ...STR_1D, ...STR_2D,
  "char[]", "char[][]", "ListNode", "ListNode[]", "TreeNode", "Node", "void",
];

// The shape a type's VALUE has, independent of how a language spells it.
export function category(type) {
  if (type === "int" || type === "long") return "int";
  if (type === "double") return "double";
  if (type === "boolean") return "bool";
  if (type === "char") return "char";
  if (type === "String") return "string";
  if (INT_1D.has(type)) return "int1";
  if (INT_2D.has(type)) return "int2";
  if (STR_1D.has(type)) return "str1";
  if (STR_2D.has(type)) return "str2";
  if (type === "char[]") return "char1";
  if (type === "char[][]") return "char2";
  if (type === "ListNode") return "list";
  if (type === "ListNode[]") return "lists";
  if (type === "TreeNode") return "tree";
  if (type === "Node") return "graph";
  if (type === "void") return "void";
  throw new Error(`devert100 harness: unknown type "${type}"`);
}

// ---- spec helpers shared by every language ------------------------------

export function inputsOf(spec) {
  if (spec.kind === "design") return [];
  return spec.inputs || spec.functions[0].params.map(p => ({ name: p.name, type: p.type }));
}

export function functionIndex(spec, testCase) {
  if (!testCase.fn) return 0;
  const i = spec.functions.findIndex(f => f.name === testCase.fn);
  if (i < 0) throw new Error(`devert100 harness: case names unknown function "${testCase.fn}"`);
  return i;
}

// The method list a design driver dispatches on. Index 0 is never a method -
// the first op is always the constructor - so methods are 1-based on the wire.
export function designMethods(spec) {
  return spec.functions;
}

// ---- stdin encoding -----------------------------------------------------

function encString(s) {
  const out = [s.length];
  for (let i = 0; i < s.length; i++) out.push(s.charCodeAt(i));
  return out.join(" ");
}

export function encodeValue(type, v) {
  const c = category(type);
  switch (c) {
    case "int": case "double": return String(v);
    case "bool": return v ? "1" : "0";
    case "char": return String(String(v).charCodeAt(0));
    case "string": return encString(v);
    case "int1": return [v.length, ...v].join(" ");
    case "int2": case "graph": return [v.length, ...v.map(r => [r.length, ...r].join(" "))].join("\n");
    case "str1": return [v.length, ...v.map(encString)].join("\n");
    case "str2": return [v.length, ...v.map(r => [r.length, ...r.map(encString)].join("\n"))].join("\n");
    case "char1": return [v.length, ...v.map(ch => String(ch).charCodeAt(0))].join(" ");
    case "char2": return [v.length, ...v.map(r => [r.length, ...r.map(ch => String(ch).charCodeAt(0))].join(" "))].join("\n");
    case "list": return [v.length, ...v].join(" ");
    case "lists": return [v.length, ...v.map(l => [l.length, ...l].join(" "))].join("\n");
    case "tree": return [v.length, ...v.map(x => (x === null ? "0" : `1 ${x}`))].join(" ");
    default: throw new Error(`devert100 harness: cannot encode ${type}`);
  }
}

export function encodeStdin(spec, cases = spec.cases) {
  const lines = [String(cases.length)];
  for (const tc of cases) {
    if (spec.kind === "design") {
      const { ops, args } = tc.input;
      lines.push(String(ops.length));
      const ctorParams = spec.constructor?.params || [];
      ctorParams.forEach((p, j) => lines.push(encodeValue(p.type, args[0][j])));
      for (let k = 1; k < ops.length; k++) {
        const mi = spec.functions.findIndex(f => f.name === ops[k]);
        if (mi < 0) throw new Error(`devert100 harness: unknown op "${ops[k]}"`);
        lines.push(String(mi + 1));
        spec.functions[mi].params.forEach((p, j) => lines.push(encodeValue(p.type, args[k][j])));
      }
    } else {
      lines.push(String(functionIndex(spec, tc)));
      for (const inp of inputsOf(spec)) {
        if (!(inp.name in tc.input)) throw new Error(`devert100 harness: case "${tc.label}" is missing input "${inp.name}"`);
        lines.push(encodeValue(inp.type, tc.input[inp.name]));
      }
    }
  }
  return lines.join("\n") + "\n";
}

// ---- stdout decoding ----------------------------------------------------

// Returns {
//   cases:         per case null | { stdout, raw, value, parsed } | { stdout, error }
//   trailing:      prints after the last marker (they belong to the case that died)
//   compileErrors: null | [{ line, col, message }]
//   lastStarted:   index of the last case that printed S, or -1
// }
// `parsed` is false when the driver's JSON could not be read (never expected,
// but a learner can print a stray marker-looking line).
export function parseRunOutput(stdout, caseCount) {
  const cases = Array.from({ length: caseCount }, () => null);
  let buf = [];
  let compileErrors = null;
  let lastStarted = -1;
  const inRange = (i) => Number.isInteger(i) && i >= 0 && i < caseCount;
  for (const line of String(stdout || "").replace(/\r/g, "").split("\n")) {
    const at = line.indexOf(MARKER);
    if (at < 0) { buf.push(line); continue; }
    const before = line.slice(0, at);
    if (before) buf.push(before);
    const rest = line.slice(at + MARKER.length).trim();
    const words = rest.split(" ");
    const json = (s) => { try { return { ok: true, v: JSON.parse(s) } } catch { return { ok: false } } };
    if (words[0] === "S") {
      const i = Number(words[1]);
      if (inRange(i)) lastStarted = i;
      buf = [];
    } else if (words[0] === "CE") {
      const j = json(rest.slice(3));
      compileErrors = j.ok && Array.isArray(j.v) ? j.v : [{ line: null, col: null, message: rest.slice(3) }];
      buf = [];
    } else if (words[0] === "RE") {
      const i = Number(words[1]);
      const j = json(rest.slice(3 + words[1].length + 1));
      if (inRange(i) && !cases[i]) {
        cases[i] = { stdout: trimDebug(buf), error: j.ok ? j.v : { type: "Error", message: rest, line: null, trace: "" } };
      }
      buf = [];
    } else {
      const i = Number(words[0]);
      const raw = rest.slice(words[0].length + 1);
      const j = json(raw);
      if (inRange(i) && !cases[i]) cases[i] = { stdout: trimDebug(buf), raw, value: j.v, parsed: j.ok };
      buf = [];
    }
  }
  return { cases, trailing: trimDebug(buf), compileErrors, lastStarted };
}

// gcc / g++ diagnostics, e.g. `solution.cpp:12:9: error: expected ';' before '}'`.
// The C and C++ drivers put `#line 1 "solution.c(pp)"` above the learner's code,
// so those numbers are already theirs; anything reported in driver.c(pp) is a
// mismatch with the hidden driver (usually a renamed or re-typed function).
//
// The live runner trims the start of the compiler output, so the FIRST
// diagnostic can arrive without its file name - verified against it:
//   "11:34: error: 'j' undeclared ...\nsolution.c:11:34: note: ..."
// A bare `LINE:COL: error:` is therefore read as the learner's file: the
// hidden driver comes after their code and almost never errors first.
export function parseCompilerStderr(stderr) {
  const out = [];
  const seen = new Set();
  const add = (e) => {
    const key = `${e.line}:${e.col}:${e.message}`;
    if (!seen.has(key)) { seen.add(key); out.push(e); }
  };
  for (const line of String(stderr || "").replace(/\r/g, "").split("\n")) {
    const m = line.match(/^(?:.*[\\/])?(solution|driver)\.(?:c|cpp):(\d+):(?:(\d+):)?\s*(?:fatal\s+)?error:\s*(.*)$/);
    if (m) {
      add(m[1] === "solution"
        ? { line: Number(m[2]), col: m[3] ? Number(m[3]) : null, message: m[4] }
        : { line: null, col: null, message: `${m[4]} (in the hidden test code - check that your function's name and parameters match the starter code)` });
      continue;
    }
    const bare = line.match(/^(\d+):(?:(\d+):)?\s*(?:fatal\s+)?error:\s*(.*)$/);
    if (bare) add({ line: Number(bare[1]), col: bare[2] ? Number(bare[2]) : null, message: bare[3] });
  }
  return out.length ? out : null;
}

function trimDebug(lines) {
  // The driver prints a newline before every marker so a learner's unterminated
  // print cannot swallow it; drop the blank lines that produces.
  return lines.join("\n").replace(/^\n+|\n+$/g, "");
}

// ---- checking -----------------------------------------------------------

const canon = v => JSON.stringify(v);

function sortDeep(v) {
  if (!Array.isArray(v)) return v;
  const inner = v.map(sortDeep);
  return inner.sort((a, b) => (canon(a) < canon(b) ? -1 : canon(a) > canon(b) ? 1 : 0));
}

function sortOuter(v) {
  if (!Array.isArray(v)) return v;
  return [...v].sort((a, b) => (canon(a) < canon(b) ? -1 : canon(a) > canon(b) ? 1 : 0));
}

function floatEq(a, b) {
  if (typeof a === "number" && typeof b === "number") {
    return Math.abs(a - b) <= 1e-5 * Math.max(1, Math.abs(b));
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((x, i) => floatEq(x, b[i]));
  }
  return canon(a) === canon(b);
}

// Problems with more than one correct answer are checked against the INPUT,
// not against one reference answer.
const VALIDATORS = {
  // LC 162: any index i with nums[i] > both neighbours (out of range = -inf).
  peak(tc, actual) {
    const a = tc.input.nums;
    if (!Number.isInteger(actual) || actual < 0 || actual >= a.length) return false;
    const left = actual === 0 ? -Infinity : a[actual - 1];
    const right = actual === a.length - 1 ? -Infinity : a[actual + 1];
    return a[actual] > left && a[actual] > right;
  },
  // LC 5: any palindromic substring of s as long as the reference's ("babad"
  // accepts both "bab" and "aba").
  longestPalindrome(tc, actual, expected) {
    if (typeof actual !== "string" || actual.length !== String(expected).length) return false;
    return tc.input.s.includes(actual) && actual === [...actual].reverse().join("");
  },
  // LC 210: any ordering that respects every prerequisite, or [] exactly when
  // the expected answer is [] (a cycle).
  topoOrder(tc, actual, expected) {
    if (!Array.isArray(actual)) return false;
    const n = tc.input.numCourses;
    if (Array.isArray(expected) && expected.length === 0) return actual.length === 0;
    if (actual.length !== n) return false;
    const pos = new Map();
    actual.forEach((c, i) => pos.set(c, i));
    if (pos.size !== n || [...pos.keys()].some(c => !Number.isInteger(c) || c < 0 || c >= n)) return false;
    return tc.input.prerequisites.every(([a, b]) => pos.get(b) < pos.get(a));
  },
};

// LeetCode prints an empty returned list or tree as [], never null. Drivers
// serialize a null reference as null in every language, so the one place that
// maps it is here - for answers that are a returned ListNode / TreeNode.
export function normalizeAnswer(spec, tc, v) {
  if (v !== null || spec.kind === "design") return v;
  const mode = (spec.output || { mode: "return" }).mode;
  if (mode !== "return") return v;
  const f = spec.functions[functionIndex(spec, tc)];
  const c = category(f.returns);
  return c === "list" || c === "tree" ? [] : v;
}

export function checkCase(spec, tc, rawActual) {
  const mode = spec.check || "exact";
  const actual = normalizeAnswer(spec, tc, rawActual);
  const expected = normalizeAnswer(spec, tc, tc.expected);
  if (VALIDATORS[mode]) return VALIDATORS[mode](tc, actual, expected);
  if (mode === "float") return floatEq(actual, expected);
  if (mode === "unordered") return canon(sortOuter(actual)) === canon(sortOuter(expected));
  if (mode === "unorderedDeep") return canon(sortDeep(actual)) === canon(sortDeep(expected));
  return canon(actual) === canon(expected);
}

// ---- display ------------------------------------------------------------

export function formatValue(v) {
  return JSON.stringify(v);
}

export function formatInput(spec, tc) {
  if (spec.kind === "design") {
    return `${JSON.stringify(tc.input.ops)}\n${JSON.stringify(tc.input.args)}`;
  }
  return inputsOf(spec).map(i => `${i.name} = ${formatValue(tc.input[i.name])}`).join(", ");
}
