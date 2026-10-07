// DeVert 100 harness - JavaScript. See spec.mjs for the spec shape and the
// stdin/stdout protocol every language implements, and java.mjs for the
// reference generator whose semantics this mirrors.
//
// Production runs JavaScript on Deno ("typescript-deno" on OnlineCompiler.io),
// so the program is a .ts module: no `require`, no `process`, strict mode
// for the driver (the learner's code is not - see program()), stdin read with
// Deno.stdin.readSync (no top-level await).
//
// Program layout (one file):
//   line 1   // @ts-nocheck   (the file is parsed as TypeScript; this keeps a
//            type checker, if the runner ever enables one, off the driver)
//   ...      one IIFE holding the learner's code as a JSON string, the error
//            reporting, the reader, the JSON writer and the cases, so none of
//            the driver's names can collide with the learner's.
// The learner's code is compiled with `new Function` (sloppy mode, like
// LeetCode), followed in the same body by ListNode / TreeNode / _Node exactly
// as LeetCode defines them (only when the problem uses them, and only if the
// learner has not declared their own - a duplicate declaration is a
// SyntaxError) and a `return { name: ... }` of everything the driver calls.
// See program() for how compile and runtime errors are reported.
//
// JavaScript has one number type, so unlike Java the writer cannot tell a
// double from an int at run time: the "%.5f" formatting is driven by the
// spec's declared type instead.

import { category, inputsOf, MARKER } from "./spec.mjs";

const IND = "    ";

// ---- stub ---------------------------------------------------------------

const DEF_COMMENTS = {
  ListNode: [
    "/**",
    " * Definition for singly-linked list.",
    " * function ListNode(val, next) {",
    " *     this.val = (val===undefined ? 0 : val)",
    " *     this.next = (next===undefined ? null : next)",
    " * }",
    " */",
  ],
  TreeNode: [
    "/**",
    " * Definition for a binary tree node.",
    " * function TreeNode(val, left, right) {",
    " *     this.val = (val===undefined ? 0 : val)",
    " *     this.left = (left===undefined ? null : left)",
    " *     this.right = (right===undefined ? null : right)",
    " * }",
    " */",
  ],
  Node: [
    "/**",
    " * // Definition for a _Node.",
    " * function _Node(val, neighbors) {",
    " *    this.val = val === undefined ? 0 : val;",
    " *    this.neighbors = neighbors === undefined ? [] : neighbors;",
    " * };",
    " */",
  ],
};

function usedTypes(spec) {
  const all = [];
  for (const f of spec.functions) { all.push(f.returns); f.params.forEach(p => all.push(p.type)); }
  (spec.constructor?.params || []).forEach(p => all.push(p.type));
  inputsOf(spec).forEach(i => all.push(i.type));
  return all;
}

function needs(spec) {
  const cats = new Set(usedTypes(spec).map(category));
  return { list: cats.has("list") || cats.has("lists"), tree: cats.has("tree"), graph: cats.has("graph") };
}

// LeetCode's JSDoc spelling of each type.
function jsType(type) {
  switch (category(type)) {
    case "int": case "double": return "number";
    case "bool": return "boolean";
    case "char": return "character";
    case "string": return "string";
    case "int1": return "number[]";
    case "int2": return "number[][]";
    case "str1": return "string[]";
    case "str2": return "string[][]";
    case "char1": return "character[]";
    case "char2": return "character[][]";
    case "list": return "ListNode";
    case "lists": return "ListNode[]";
    case "tree": return "TreeNode";
    case "graph": return "_Node";
    case "void": return "void";
    default: throw new Error(`devert100 harness (javascript): no JSDoc type for ${type}`);
  }
}

function defaultReturn(type) {
  switch (category(type)) {
    case "void": return null;
    case "int": case "double": return "0";
    case "bool": return "false";
    case "char": return "\"a\"";
    case "string": return "\"\"";
    case "int1": case "int2": case "str1": case "str2": case "char1": case "char2": case "lists": return "[]";
    default: return "null";
  }
}

const names = params => params.map(p => p.name).join(", ");

// opts.defaultReturn: fill every body with a type-correct return so the stub
// runs on its own - used only by the build-time verifier.
export function stub(spec, opts = {}) {
  const n = needs(spec);
  const out = [];
  if (n.list) out.push(...DEF_COMMENTS.ListNode);
  if (n.tree) out.push(...DEF_COMMENTS.TreeNode);
  if (n.graph) out.push(...DEF_COMMENTS.Node, "");
  const body = (ret) => {
    const r = opts.defaultReturn ? defaultReturn(ret) : null;
    return r === null ? [IND] : [`${IND}return ${r};`];
  };
  const out0 = spec.output || { mode: "return" };
  const C = spec.className;
  if (spec.kind === "design") {
    const ctor = spec.constructor?.params || [];
    if (ctor.length) out.push("/**", ...ctor.map(p => ` * @param {${jsType(p.type)}} ${p.name}`), " */");
    out.push(`var ${C} = function(${names(ctor)}) {`, IND, "};");
    for (const f of spec.functions) {
      out.push("", f.params.length ? "/** " : "/**",
        ...f.params.map(p => ` * @param {${jsType(p.type)}} ${p.name}`),
        ` * @return {${jsType(f.returns)}}`, " */",
        `${C}.prototype.${f.name} = function(${names(f.params)}) {`, ...body(f.returns), "};");
    }
    out.push("", "/** ", ` * Your ${C} object will be instantiated and called as such:`,
      ` * var obj = new ${C}(${ctor.map(p => p.name).join(",")})`,
      ...spec.functions.map((f, i) => {
        const call = `obj.${f.name}(${f.params.map(p => p.name).join(",")})`;
        return f.returns === "void" ? ` * ${call}` : ` * var param_${i + 1} = ${call}`;
      }),
      " */");
  } else {
    spec.functions.forEach((f, i) => {
      if (i > 0) out.push("");
      const ret = f.returns === "void"
        ? ` * @return {void} Do not return anything, modify ${out0.name || f.params[0]?.name || "it"} in-place instead.`
        : ` * @return {${jsType(f.returns)}}`;
      out.push("/**", ...f.params.map(p => ` * @param {${jsType(p.type)}} ${p.name}`), ret, " */",
        `var ${f.name} = function(${names(f.params)}) {`, ...body(f.returns), "};");
    });
  }
  return out.join("\n") + "\n";
}

// ---- driver -------------------------------------------------------------

const READERS = {
  int: "ni()", double: "nd()", bool: "(ni() !== 0)", char: "String.fromCharCode(ni())", string: "ns()",
  int1: "ni1()", int2: "ni2()", str1: "ns1()", str2: "ns2()", char1: "nc1()", char2: "nc2()",
  list: "nlist()", lists: "nlists()", tree: "ntree()", graph: "ngraph()",
};

function reader(type) {
  const r = READERS[category(type)];
  if (!r) throw new Error(`devert100 harness (javascript): no reader for ${type}`);
  return r;
}

// Whether the writer formats numbers as doubles ("%.5f") for this type.
const dbl = type => (category(type) === "double" ? "true" : "false");

const SUPPORT = {
  list: `function ListNode(val, next) {
    this.val = (val===undefined ? 0 : val)
    this.next = (next===undefined ? null : next)
}`,
  tree: `function TreeNode(val, left, right) {
    this.val = (val===undefined ? 0 : val)
    this.left = (left===undefined ? null : left)
    this.right = (right===undefined ? null : right)
}`,
  graph: `function _Node(val, neighbors) {
    this.val = val === undefined ? 0 : val;
    this.neighbors = neighbors === undefined ? [] : neighbors;
}`,
};

// The reader, builders and JSON writer. Lives inside the driver IIFE.
const RUNTIME = `
    const __chunks = []; let __len = 0;
    { const buf = new Uint8Array(1 << 16); for (;;) { const n = Deno.stdin.readSync(buf); if (n === null || n === 0) break; __chunks.push(buf.slice(0, n)); __len += n; } }
    const __bytes = new Uint8Array(__len); { let o = 0; for (const c of __chunks) { __bytes.set(c, o); o += c.length; } }
    const __all = new TextDecoder().decode(__bytes).trim();
    const __tok = __all === "" ? [] : __all.split(/\\s+/);
    let __p = 0;
    const ni = () => Number(__tok[__p++]);
    const nd = () => Number(__tok[__p++]);
    const ns = () => { const n = ni(); let s = ""; for (let i = 0; i < n; i += 4096) { const part = []; for (let k = i; k < Math.min(n, i + 4096); k++) part.push(ni()); s += String.fromCharCode(...part); } return s; };
    const ni1 = () => { const n = ni(); const a = new Array(n); for (let i = 0; i < n; i++) a[i] = ni(); return a; };
    const ni2 = () => { const r = ni(); const a = new Array(r); for (let i = 0; i < r; i++) a[i] = ni1(); return a; };
    const ns1 = () => { const n = ni(); const a = new Array(n); for (let i = 0; i < n; i++) a[i] = ns(); return a; };
    const ns2 = () => { const r = ni(); const a = new Array(r); for (let i = 0; i < r; i++) a[i] = ns1(); return a; };
    const nc1 = () => { const n = ni(); const a = new Array(n); for (let i = 0; i < n; i++) a[i] = String.fromCharCode(ni()); return a; };
    const nc2 = () => { const r = ni(); const a = new Array(r); for (let i = 0; i < r; i++) a[i] = nc1(); return a; };
    // Fields are set explicitly so a learner's own ListNode/TreeNode/_Node
    // (whatever its constructor does) still builds correctly.
    const mkList = (v) => { const n = new ListNode(v); n.val = v; n.next = null; return n; };
    const mkTree = (v) => { const n = new TreeNode(v); n.val = v; n.left = null; n.right = null; return n; };
    const fromArr = (v) => { let head = null, t = null; for (const x of v) { const n = mkList(x); if (t === null) head = n; else t.next = n; t = n; } return head; };
    const nlist = () => fromArr(ni1());
    const nlists = () => { const k = ni(); const a = new Array(k); for (let i = 0; i < k; i++) a[i] = nlist(); return a; };
    const ntree = () => {
        const n = ni(); const v = new Array(n);
        for (let i = 0; i < n; i++) v[i] = ni() === 0 ? null : ni();
        if (n === 0 || v[0] === null) return null;
        const root = mkTree(v[0]); const q = [root]; let qh = 0, i = 1;
        while (qh < q.length && i < n) {
            const cur = q[qh++];
            if (i < n && v[i] !== null) { cur.left = mkTree(v[i]); q.push(cur.left); } i++;
            if (i < n && v[i] !== null) { cur.right = mkTree(v[i]); q.push(cur.right); } i++;
        }
        return root;
    };
    let __graphIn = new Set();
    const ngraph = () => {
        const adj = ni2(); const n = adj.length; if (n === 0) return null;
        const nodes = new Array(n + 1);
        for (let i = 1; i <= n; i++) { const x = new _Node(i); x.val = i; x.neighbors = []; nodes[i] = x; __graphIn.add(x); }
        for (let i = 1; i <= n; i++) for (const x of adj[i - 1]) nodes[i].neighbors.push(nodes[x]);
        return nodes[1];
    };
    const cycle = (v, pos) => {
        const head = fromArr(v); if (pos < 0 || head === null) return head;
        let tail = head, at = null, i = 0;
        for (let c = head; c !== null; c = c.next, i++) { if (i === pos) at = c; tail = c; }
        tail.next = at; return head;
    };
    const intersection = (a, b, skipA, skipB) => {
        const ha = fromArr(a);
        let shared = ha; for (let i = 0; i < skipA && shared !== null; i++) shared = shared.next;
        let hb = null, t = null;
        for (let i = 0; i < skipB; i++) { const n = mkList(b[i]); if (t === null) hb = n; else t.next = n; t = n; }
        if (t === null) hb = shared; else t.next = shared;
        return [ha, hb];
    };
    const ref = (root, val) => {
        if (root === null || root === undefined) return null; if (root.val === val) return root;
        const l = ref(root.left, val); return l !== null ? l : ref(root.right, val);
    };

    const q = (s) => {
        let b = "\\"";
        for (let i = 0; i < s.length; i++) {
            const c = s[i], code = s.charCodeAt(i);
            if (c === "\\"" || c === "\\\\") b += "\\\\" + c;
            else if (code < 0x20) b += "\\\\u" + code.toString(16).padStart(4, "0");
            else b += c;
        }
        return b + "\\"";
    };
    const isObj = (o) => o !== null && typeof o === "object";
    const j = (o, d) => {
        if (o === null || o === undefined) return "null";
        if (typeof o === "number") {
            if (d) return Number.isFinite(o) ? o.toFixed(5) : String(o);
            return Number.isFinite(o) ? String(o) : "null";
        }
        if (typeof o === "bigint" || typeof o === "boolean") return String(o);
        if (typeof o === "string") return q(o);
        if (Array.isArray(o) || ArrayBuffer.isView(o) || o instanceof Set) {
            const parts = []; for (const x of o) parts.push(j(x, d)); return "[" + parts.join(",") + "]";
        }
        if (isObj(o) && "neighbors" in o) {
            const seen = new Map(); const qu = [o]; let qh = 0; seen.set(o.val, o);
            while (qh < qu.length) {
                const c = qu[qh++]; if (__graphIn.has(c)) return q("NOT_A_DEEP_COPY");
                for (const x of c.neighbors || []) if (!seen.has(x.val)) { seen.set(x.val, x); qu.push(x); }
            }
            const rows = [];
            for (let v = 1; v <= seen.size; v++) {
                const c = seen.get(v);
                rows.push("[" + (c ? (c.neighbors || []).map(x => String(x.val)).join(",") : "") + "]");
            }
            return "[" + rows.join(",") + "]";
        }
        if (isObj(o) && ("left" in o || "right" in o)) {
            const out = []; let lvl = [o];
            while (lvl.length) {
                const nx = [];
                for (const t of lvl) { if (t === null || t === undefined) { out.push("null"); continue; } out.push(j(t.val, d)); nx.push(t.left, t.right); }
                lvl = nx;
            }
            let end = out.length; while (end > 0 && out[end - 1] === "null") end--;
            return "[" + out.slice(0, end).join(",") + "]";
        }
        if (isObj(o) && "next" in o) {
            const parts = []; let i = 0;
            for (let c = o; c !== null && c !== undefined; c = c.next) { if (i > 10000) return q("CYCLE_IN_RETURNED_LIST"); i++; parts.push(j(c.val, d)); }
            return "[" + parts.join(",") + "]";
        }
        return q(String(o));
    };
    const prefix = (arr, k) => {
        if (Array.isArray(arr) || ArrayBuffer.isView(arr)) return Array.from(arr).slice(0, Math.max(0, Math.min(Number(k) || 0, arr.length)));
        return arr;
    };
    const nodeVal = (o) => (isObj(o) && "val" in o ? o.val : o);
    const need = (name, f) => {
        if (typeof f !== "function") throw new Error(name + " is not defined - keep the starter code's \`var " + name + " = function(...)\` declaration");
        return f;
    };
    const emit = (i, json) => { console.log("\\n${MARKER} " + i + " " + json); };
`;

// Turn one function's params into JS statements that read inputs and build
// arguments. Inputs are read in `inputs` order (that is the wire order); args
// that need a builder are constructed after every input is in hand.
function functionCase(spec, f, fi) {
  const lines = [];
  const inputs = inputsOf(spec);
  for (const inp of inputs) lines.push(`const in_${inp.name} = ${reader(inp.type)};`);
  const built = new Set();
  let haveAB = false;
  const buildArg = (p) => {
    if (built.has(p.name)) return;
    const b = p.build;
    if (!b) {
      lines.push(`const a_${p.name} = in_${p.name};`);
    } else if (b.from) {
      lines.push(`const a_${p.name} = in_${b.from};`);
    } else if (b.cycle) {
      lines.push(`const a_${p.name} = cycle(in_${b.cycle.values}, in_${b.cycle.pos});`);
    } else if (b.intersection) {
      const x = b.intersection;
      if (!haveAB) {
        lines.push(`const __ab = intersection(in_${x.listA}, in_${x.listB}, in_${x.skipA}, in_${x.skipB});`);
        haveAB = true;
      }
      lines.push(`const a_${p.name} = __ab[${x.side === "B" ? 1 : 0}];`);
    } else if (b.ref) {
      const treeParam = f.params.find(q => q.name === b.ref.tree);
      buildArg(treeParam);
      lines.push(`const a_${p.name} = ref(a_${b.ref.tree}, in_${b.ref.value});`);
    } else {
      throw new Error(`devert100 harness (javascript): unknown builder on ${p.name}`);
    }
    built.add(p.name);
  };
  f.params.forEach(buildArg);
  const call = `need(${JSON.stringify(f.name)}, __env[${JSON.stringify(f.name)}])(${f.params.map(p => `a_${p.name}`).join(", ")})`;
  const out = spec.output || { mode: "return" };
  const paramType = (name) => {
    const p = f.params.find(x => x.name === name);
    if (!p) throw new Error(`devert100 harness (javascript): output names unknown param ${name}`);
    return p.type;
  };
  switch (out.mode) {
    case "return":
      if (f.returns === "void") throw new Error("devert100 harness: void function needs output.mode = param");
      lines.push(`const __r = ${call};`, `emit(__case, j(__r, ${dbl(f.returns)}));`); break;
    case "param":
      lines.push(`${call};`, `emit(__case, j(a_${out.name}, ${dbl(paramType(out.name))}));`); break;
    case "returnAndParamPrefix":
      lines.push(`const __k = ${call};`, `emit(__case, "[" + j(__k, false) + "," + j(prefix(a_${out.name}, __k), ${dbl(paramType(out.name))}) + "]");`); break;
    case "nodeVal":
      lines.push(`const __r = ${call};`, `emit(__case, j(nodeVal(__r), false));`); break;
    case "graphCopy":
      lines.push(`const __r = ${call};`, `emit(__case, __r === null || __r === undefined ? "[]" : j(__r, false));`); break;
    default:
      throw new Error(`devert100 harness: unknown output mode ${out.mode}`);
  }
  return [`case ${fi}: {`, ...lines.map(l => `${IND}${l}`), `${IND}break;`, `}`];
}

function designCase(spec) {
  const C = spec.className;
  const lines = [];
  const ctor = spec.constructor?.params || [];
  // Every op and its args are read BEFORE the object is built: if the
  // learner's code throws mid-sequence, the rest of this case's tokens are
  // already consumed and the next case still reads from the right place.
  ctor.forEach((p, i) => lines.push(`const c${i} = ${reader(p.type)};`));
  lines.push(`const __plan = [];`);
  lines.push(`for (let __k = 1; __k < __ops; __k++) {`);
  lines.push(`${IND}const __m = ni();`);
  lines.push(`${IND}switch (__m) {`);
  spec.functions.forEach((f, mi) => {
    lines.push(`${IND}${IND}case ${mi + 1}: __plan.push([${mi + 1}, [${f.params.map(p => reader(p.type)).join(", ")}]]); break;`);
  });
  lines.push(`${IND}${IND}default: throw new Error("bad op " + __m);`);
  lines.push(`${IND}}`, `}`);
  lines.push(`const __C = need(${JSON.stringify(C)}, __env[${JSON.stringify(C)}]);`);
  lines.push(`const obj = new __C(${ctor.map((_, i) => `c${i}`).join(", ")});`);
  lines.push(`const sb = ["null"];`);
  lines.push(`for (const [__m, __a] of __plan) {`);
  lines.push(`${IND}switch (__m) {`);
  spec.functions.forEach((f, mi) => {
    const call = `obj.${f.name}(${f.params.map((_, i) => `__a[${i}]`).join(", ")})`;
    const act = f.returns === "void" ? `${call}; sb.push("null");` : `sb.push(j(${call}, ${dbl(f.returns)}));`;
    lines.push(`${IND}${IND}case ${mi + 1}: ${act} break;`);
  });
  lines.push(`${IND}}`, `}`, `emit(__case, "[" + sb.join(",") + "]");`);
  return lines;
}

// Does the learner's code already declare `name` at (roughly) top level?
function declares(code, name) {
  return new RegExp(`(^|[;\\n])\\s*(class\\s+${name}\\b|function\\s*\\*?\\s*${name}\\s*\\(|(var|let|const)\\s+${name}\\s*=)`).test(code);
}

// Error reporting. Lives inside the driver IIFE, before the learner's code is
// compiled; `__src` is the learner's code. Written with String.raw and no
// template literals, so the regexes below read exactly as they run.
const ERRORS = String.raw`
    const __say = (s) => { console.log("\n@@MARK@@ " + s); };
    const __lines = __src.split("\n");
    let __last = __lines.length; while (__last > 1 && __lines[__last - 1].trim() === "") __last--;
    // new Function puts a header above the body; measure how many lines it
    // adds on THIS runtime instead of assuming (it is 2 on Deno 2.x).
    const __off = (() => {
        try { new Function("throw new Error()\n//# sourceURL=dv100probe.js")(); }
        catch (e) { const m = /dv100probe\.js(?:, <anonymous>)?:(\d+):/.exec(String(e && e.stack)); if (m) return Number(m[1]) - 1; }
        return 2;
    })();
    // Stack frames inside the learner's code, in their own line numbers.
    const __frames = (e) => {
        const out = [];
        let st = ""; try { st = String(e && e.stack || ""); } catch (x) {}
        for (const s of st.split("\n")) {
            const m = /^\s*at (?:(.*?) \()?solution\.js(?:, <anonymous>)?:(\d+):(\d+)\)?\s*$/.exec(s);
            if (!m) continue;
            const line = Number(m[2]) - __off;
            if (line < 1 || line > __lines.length) continue;
            let name = m[1] || "<anonymous>";
            if (name === "eval" || name === "anonymous") name = "<top level>";
            out.push({ name, line, col: Number(m[3]) });
        }
        return out;
    };
    const __err = (e) => {
        let type = "Error", message = "";
        try {
            if (e instanceof Error) { type = e.name || "Error"; message = String(e.message); }
            else if (e !== null && typeof e === "object") { type = (e.constructor && e.constructor.name) || "Object"; message = JSON.stringify(e); }
            else { type = "Uncaught " + typeof e; message = String(e); }
        } catch (x) {}
        const fr = __frames(e), tr = [];
        // A stack overflow's trace is cut at Error.stackTraceLimit frames.
        const cut = fr.length >= Error.stackTraceLimit;
        for (let i = 0; i < fr.length && tr.length < 12; i++) {
            let k = i; while (k + 1 < fr.length && fr[k + 1].name === fr[i].name && fr[k + 1].line === fr[i].line) k++;
            tr.push("at " + fr[i].name + " (solution.js:" + fr[i].line + ":" + fr[i].col + ")" + (k > i ? " [repeated " + (k - i + 1) + (cut && k === fr.length - 1 ? "+" : "") + " times]" : ""));
            i = k;
        }
        return { type, message, line: fr.length ? fr[0].line : null, trace: tr.join("\n") };
    };
    const __ceOut = (line, col, message) => { __say("CE " + JSON.stringify([{ line, col, message }])); };
    // V8's SyntaxError from new Function carries no position. Deno's module
    // loader does report one, so the same code is parsed again as a data:
    // module - wrapped in a function after a throw, so nothing in it can ever
    // run. Modules are strict, so a strict-mode-only complaint is not trusted.
    const __ce = (e) => {
        const v8 = String(e && e.message || e);
        let p;
        try { p = import("data:application/javascript," + encodeURIComponent("throw 0; function __dv100() {\n" + __src + "\n}")); }
        catch (x) { __ceOut(null, null, v8); return; }
        p.then(() => __ceOut(null, null, v8), (x) => {
            const s = String(x && x.message || x);
            // Where the position sits depends on the Deno version: 2.7 (the
            // live runner) puts it at the end of the FIRST line and follows it
            // with a code excerpt; 2.9 ends the whole message with it. Try the
            // first line, then any "at data:...:L:C" anywhere.
            const first = s.split("\n")[0];
            const m = /:(\d+):(\d+)\s*$/.exec(first) || /at data:[^\s]*:(\d+):(\d+)/.exec(s);
            if (!m || /strict mode/i.test(s)) { __ceOut(null, null, v8); return; }
            let line = Number(m[1]) - 1, col = Number(m[2]);
            if (line < 1) { line = 1; col = null; }
            if (line > __last) { line = __last; col = null; }
            const msg = first.replace(/^SyntaxError:\s*/, "").replace(/^The module's source code could not be parsed:\s*/, "").replace(/\s+at data:.*$/, "").trim();
            __ceOut(line, col, msg || v8);
        });
    };
`.replace("@@MARK@@", MARKER);

// The program runs the learner's code through `new Function`, not as part of
// the module: a module is strict mode (LeetCode's JavaScript is not - `x = 5`
// with no declaration must work), a syntax error in a module kills the whole
// program before it can report anything, and the runner turns every failing
// program into one generic "Internal error". So the program always exits
// normally and reports for itself, per spec.mjs's protocol:
//   SyntaxError                 CE, with the line found by the data: re-parse
//   learner's top level throws  every case gets that RE
//   a required name missing     CE, line null (the hidden driver calls it)
//   a case throws               RE for that case, then the next case runs
export function program(spec, userCode) {
  const code = String(userCode || "").replace(/\r/g, "");
  const n = needs(spec);
  const support = [];
  if (n.list && !declares(code, "ListNode")) support.push(SUPPORT.list);
  if (n.tree && !declares(code, "TreeNode")) support.push(SUPPORT.tree);
  if (n.graph && !declares(code, "_Node")) support.push(SUPPORT.graph);
  const required = spec.kind === "design" ? [spec.className] : spec.functions.map(f => f.name);
  const nodeTypes = [n.list && "ListNode", n.tree && "TreeNode", n.graph && "_Node"].filter(Boolean);
  const exported = [...required, ...nodeTypes];
  // Appended after the learner's code, inside the same function body, so their
  // line N is body line N. Function declarations hoist, so their code can use
  // ListNode etc. at top level.
  const tail = "\n;\n" + support.join("\n") + "\nreturn {"
    + exported.map(x => `${JSON.stringify(x)}: typeof ${x} !== "undefined" ? ${x} : undefined`).join(", ")
    + "};\n//# sourceURL=solution.js";
  const main = [];
  main.push("(function __dv100Main() {");
  main.push(`${IND}const __src = ${JSON.stringify(code)};`);
  main.push(ERRORS);
  main.push(`${IND}let __mk;`);
  main.push(`${IND}try { __mk = new Function(__src + ${JSON.stringify(tail)}); } catch (e) { __ce(e); return; }`);
  main.push(RUNTIME);
  main.push(`${IND}const __T = ni();`);
  main.push(`${IND}Error.stackTraceLimit = 64;`);
  main.push(`${IND}let __env;`);
  main.push(`${IND}try { __env = __mk(); } catch (e) {`);
  main.push(`${IND}${IND}const r = JSON.stringify(__err(e));`);
  main.push(`${IND}${IND}for (let i = 0; i < __T; i++) { __say("S " + i); __say("RE " + i + " " + r); }`);
  main.push(`${IND}${IND}return;`);
  main.push(`${IND}}`);
  nodeTypes.forEach(t => main.push(`${IND}const ${t} = __env[${JSON.stringify(t)}];`));
  main.push(`${IND}for (const __name of ${JSON.stringify(required)}) {`);
  main.push(`${IND}${IND}if (typeof __env[__name] !== "function") { __ceOut(null, null, __name + " is not defined - keep the starter code's \\"var " + __name + " = function(...)\\" declaration (the hidden test code calls it by that name)"); return; }`);
  main.push(`${IND}}`);
  main.push(`${IND}for (let __case = 0; __case < __T; __case++) {`);
  main.push(`${IND}${IND}__graphIn = new Set();`);
  main.push(`${IND}${IND}__say("S " + __case);`);
  main.push(`${IND}${IND}try {`);
  const I3 = IND + IND + IND;
  if (spec.kind === "design") {
    main.push(`${I3}const __ops = ni();`);
    designCase(spec).forEach(l => main.push(`${I3}${l}`));
  } else {
    main.push(`${I3}const __fn = ni();`);
    main.push(`${I3}switch (__fn) {`);
    spec.functions.forEach((f, fi) => functionCase(spec, f, fi).forEach(l => main.push(`${I3}${IND}${l}`)));
    main.push(`${I3}${IND}default: throw new Error("bad function index " + __fn);`);
    main.push(`${I3}}`);
  }
  main.push(`${IND}${IND}} catch (e) { __say("RE " + __case + " " + JSON.stringify(__err(e))); }`);
  main.push(`${IND}}`, "})();");
  // @ts-nocheck stays only so a type checker, if the runner ever enables one,
  // leaves the untyped driver alone; the learner's code is a string now.
  return ["// @ts-nocheck", main.join("\n"), ""].join("\n");
}
