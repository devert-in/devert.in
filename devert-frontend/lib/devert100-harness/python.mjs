// DeVert 100 harness - Python 3. See spec.mjs for the spec shape and the
// stdin/stdout protocol every language implements, and java.mjs for the
// reference generator whose semantics this mirrors.
//
// Program layout (one file, run as python-3.14):
//   1. every import LeetCode's Python3 environment pre-loads (List, Optional,
//      deque, defaultdict, Counter, heapq, bisect, math, inf, ...) plus
//      ListNode / TreeNode / Node exactly as LeetCode defines them
//   2. the driver: the reader, the JSON writer, the error reporters. Every
//      driver name is `_dv_`-prefixed so it cannot collide with theirs;
//      ListNode / TreeNode / Node are looked up by global name at call time,
//      so a learner who uncomments LeetCode's definition gets theirs used
//      consistently by the reader and the writer.
//   3. the learner's code as ONE string literal, compiled in-program with
//      compile(src, "solution.py") and registered in linecache. A SyntaxError
//      becomes a CE marker in the learner's own line numbers (line 1 = their
//      line 1), and the program still exits 0 - the runner would otherwise
//      replace any failing Python program's output with a generic "Internal
//      error". The compiled code is exec'd into the module globals, so the
//      driver finds Solution / the design class exactly as before. An
//      exception while their top level runs, or a missing class / method the
//      driver calls, is reported as CE too (nothing could run).
//   4. the cases. Each case prints an S marker first, reads ALL of its input
//      before any learner code runs (so a throw cannot desync stdin), and runs
//      inside try/except BaseException: RecursionError, SystemExit (an exit()
//      in their code) and the rest all become an RE marker with the type,
//      message, last solution.py line, and the solution.py frames as trace -
//      then the next case runs.

import { category, inputsOf, MARKER } from "./spec.mjs";

const IND = "    ";

// ---- stub ---------------------------------------------------------------

const DEF_COMMENTS = {
  ListNode: [
    "# Definition for singly-linked list.",
    "# class ListNode:",
    "#     def __init__(self, val=0, next=None):",
    "#         self.val = val",
    "#         self.next = next",
  ],
  TreeNode: [
    "# Definition for a binary tree node.",
    "# class TreeNode:",
    "#     def __init__(self, val=0, left=None, right=None):",
    "#         self.val = val",
    "#         self.left = left",
    "#         self.right = right",
  ],
  Node: [
    '"""',
    "# Definition for a Node.",
    "class Node:",
    "    def __init__(self, val = 0, neighbors = None):",
    "        self.val = val",
    "        self.neighbors = neighbors if neighbors is not None else []",
    '"""',
    "",
    "from typing import Optional",
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

// LeetCode's Python3 annotations for each type in the vocabulary.
function pyType(type) {
  switch (category(type)) {
    case "int": return "int";
    case "double": return "float";
    case "bool": return "bool";
    case "char": case "string": return "str";
    case "int1": return "List[int]";
    case "int2": return "List[List[int]]";
    case "str1": case "char1": return "List[str]";
    case "str2": case "char2": return "List[List[str]]";
    case "list": return "Optional[ListNode]";
    case "lists": return "List[Optional[ListNode]]";
    case "tree": return "Optional[TreeNode]";
    case "graph": return "Optional['Node']";
    case "void": return "None";
  }
  throw new Error(`devert100 harness (python): no annotation for ${type}`);
}

function defaultReturn(type) {
  switch (category(type)) {
    case "void": return null;
    case "int": return "0";
    case "double": return "0.0";
    case "bool": return "False";
    case "char": return "'a'";
    case "string": return "\"\"";
    case "list": case "tree": case "graph": return "None";
    default: return "[]";
  }
}

// Java param names are Java-legal; a few of them are Python keywords.
const PY_KEYWORDS = new Set(["False", "None", "True", "and", "as", "assert", "async", "await", "break", "class",
  "continue", "def", "del", "elif", "else", "except", "finally", "for", "from", "global", "if", "import", "in",
  "is", "lambda", "nonlocal", "not", "or", "pass", "raise", "return", "try", "while", "with", "yield", "self"]);
const pyName = (n) => (PY_KEYWORDS.has(n) ? `${n}_` : n);

function paramList(params) {
  return ["self", ...params.map(p => `${pyName(p.name)}: ${pyType(p.type)}`)].join(", ");
}

// opts.defaultReturn: fill every body with a type-correct return so the stub
// runs on its own - used only by the build-time verifier. Otherwise the body
// is `pass`: LeetCode leaves it empty, which Python rejects outright.
export function stub(spec, opts = {}) {
  const n = needs(spec);
  const out = [];
  if (n.list) out.push(...DEF_COMMENTS.ListNode);
  if (n.tree) out.push(...DEF_COMMENTS.TreeNode);
  if (n.graph) out.push(...DEF_COMMENTS.Node);
  const body = (ret) => {
    const r = opts.defaultReturn ? defaultReturn(ret) : null;
    return r === null ? `${IND}${IND}pass` : `${IND}${IND}return ${r}`;
  };
  out.push(`class ${spec.className}:`);
  if (spec.kind === "design") {
    const ctor = spec.constructor?.params || [];
    out.push("", `${IND}def __init__(${paramList(ctor)}):`, `${IND}${IND}pass`, "");
    for (const f of spec.functions) {
      out.push(`${IND}def ${f.name}(${paramList(f.params)}) -> ${pyType(f.returns)}:`, body(f.returns), "");
    }
    out.push("", "# Your " + spec.className + " object will be instantiated and called as such:",
      `# obj = ${spec.className}(${ctor.map(p => pyName(p.name)).join(",")})`,
      ...spec.functions.map((f, i) => {
        const call = `obj.${f.name}(${f.params.map(p => pyName(p.name)).join(",")})`;
        return f.returns === "void" ? `# ${call}` : `# param_${i + 1} = ${call}`;
      }));
  } else {
    spec.functions.forEach((f, i) => {
      if (i > 0) out.push("");
      out.push(`${IND}def ${f.name}(${paramList(f.params)}) -> ${pyType(f.returns)}:`, body(f.returns));
    });
  }
  return out.join("\n") + "\n";
}

// ---- driver -------------------------------------------------------------

// What LeetCode's Python3 runtime makes available without an import. The
// star imports shadow the builtin pow (math.pow is float-only and has no
// modulus), so it is restored afterwards.
const IMPORTS = [
  "import sys, os, io, math, string, re, random, heapq, bisect, itertools, functools, collections, operator, copy, json, array, statistics, decimal, fractions",
  "from typing import *",
  "from collections import *",
  "from heapq import *",
  "from bisect import *",
  "from itertools import *",
  "from functools import *",
  "from math import *",
  "import builtins as _dv_builtins",
  "pow = _dv_builtins.pow",
];

const CLASSES = `class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

class Node:
    def __init__(self, val = 0, neighbors = None):
        self.val = val
        self.neighbors = neighbors if neighbors is not None else []

# 20,000 frames covers every legitimate depth in these problems (a 10^4-node
# skewed tree), while runaway recursion fails fast as a RecursionError the
# learner can read - at 10^6 it ran for seconds and looked like a time limit.
sys.setrecursionlimit(20000)
try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass
`;

const READERS = {
  int: "_dv_ni()", double: "_dv_nd()", bool: "(_dv_ni() != 0)", char: "chr(_dv_ni())",
  string: "_dv_ns()", int1: "_dv_ni1()", int2: "_dv_ni2()", str1: "_dv_ns1()", str2: "_dv_ns2()",
  char1: "_dv_nc1()", char2: "_dv_nc2()", list: "_dv_nlist()", lists: "_dv_nlists()",
  tree: "_dv_ntree()", graph: "_dv_ngraph()",
};

function reader(type) {
  const r = READERS[category(type)];
  if (!r) throw new Error(`devert100 harness (python): no reader for ${type}`);
  return r;
}

const RUNTIME = `
# ---- DeVert 100 driver (not part of your solution) ----
import sys as _dv_sys, json as _dv_json

_dv_it = iter(_dv_sys.stdin.buffer.read().split())

def _dv_ni():
    return int(next(_dv_it))

def _dv_nd():
    return float(next(_dv_it))

def _dv_ns():
    n = _dv_ni()
    units = [_dv_ni() for _ in range(n)]
    s = "".join(map(chr, units))
    if any(0xD800 <= u <= 0xDFFF for u in units):
        s = s.encode("utf-16-le", "surrogatepass").decode("utf-16-le", "surrogatepass")
    return s

def _dv_ni1():
    return [_dv_ni() for _ in range(_dv_ni())]

def _dv_ni2():
    return [_dv_ni1() for _ in range(_dv_ni())]

def _dv_ns1():
    return [_dv_ns() for _ in range(_dv_ni())]

def _dv_ns2():
    return [_dv_ns1() for _ in range(_dv_ni())]

def _dv_nc1():
    return [chr(_dv_ni()) for _ in range(_dv_ni())]

def _dv_nc2():
    return [_dv_nc1() for _ in range(_dv_ni())]

def _dv_from_arr(v):
    d = ListNode(0)
    t = d
    for x in v:
        t.next = ListNode(x)
        t = t.next
    return d.next

def _dv_nlist():
    return _dv_from_arr(_dv_ni1())

def _dv_nlists():
    return [_dv_nlist() for _ in range(_dv_ni())]

def _dv_ntree():
    n = _dv_ni()
    v = []
    for _ in range(n):
        v.append(None if _dv_ni() == 0 else _dv_ni())
    if n == 0 or v[0] is None:
        return None
    root = TreeNode(v[0])
    q = [root]
    qi = 0
    i = 1
    while qi < len(q) and i < n:
        cur = q[qi]
        qi += 1
        if i < n and v[i] is not None:
            cur.left = TreeNode(v[i])
            q.append(cur.left)
        i += 1
        if i < n and v[i] is not None:
            cur.right = TreeNode(v[i])
            q.append(cur.right)
        i += 1
    return root

_dv_graph_in = []

def _dv_ngraph():
    adj = _dv_ni2()
    n = len(adj)
    if n == 0:
        return None
    nodes = [None] + [Node(i) for i in range(1, n + 1)]
    _dv_graph_in.extend(nodes[1:])
    for i in range(1, n + 1):
        for x in adj[i - 1]:
            nodes[i].neighbors.append(nodes[x])
    return nodes[1]

def _dv_cycle(v, pos):
    head = _dv_from_arr(v)
    if pos < 0 or head is None:
        return head
    tail = head
    at = None
    c = head
    i = 0
    while c is not None:
        if i == pos:
            at = c
        tail = c
        c = c.next
        i += 1
    tail.next = at
    return head

def _dv_intersection(a, b, skip_a, skip_b):
    ha = _dv_from_arr(a)
    shared = ha
    i = 0
    while i < skip_a and shared is not None:
        shared = shared.next
        i += 1
    d = ListNode(0)
    t = d
    for i in range(skip_b):
        t.next = ListNode(b[i])
        t = t.next
    t.next = shared
    return [ha, d.next]

def _dv_ref(root, val):
    stack = [root]
    while stack:
        t = stack.pop()
        if t is None:
            continue
        if t.val == val:
            return t
        stack.append(t.right)
        stack.append(t.left)
    return None

def _dv_q(s):
    return _dv_json.dumps(s)

def _dv_j(o):
    if o is None:
        return "null"
    if o is True:
        return "true"
    if o is False:
        return "false"
    if isinstance(o, float):
        return "%.5f" % o
    if isinstance(o, int):
        return str(o)
    if isinstance(o, str):
        return _dv_q(o)
    if isinstance(o, ListNode):
        parts = []
        c = o
        while c is not None:
            if len(parts) > 10000:
                return _dv_q("CYCLE_IN_RETURNED_LIST")
            parts.append(_dv_j(c.val))
            c = c.next
        return "[" + ",".join(parts) + "]"
    if isinstance(o, TreeNode):
        out = []
        lvl = [o]
        while lvl:
            nx = []
            for t in lvl:
                if t is None:
                    out.append("null")
                    continue
                out.append(_dv_j(t.val))
                nx.append(t.left)
                nx.append(t.right)
            lvl = nx
        while out and out[-1] == "null":
            out.pop()
        return "[" + ",".join(out) + "]"
    if isinstance(o, Node):
        orig = set(id(x) for x in _dv_graph_in)
        seen = {o.val: o}
        q = [o]
        qi = 0
        while qi < len(q):
            c = q[qi]
            qi += 1
            if id(c) in orig:
                return _dv_q("NOT_A_DEEP_COPY")
            for x in c.neighbors:
                if x.val not in seen:
                    seen[x.val] = x
                    q.append(x)
        rows = []
        for v in range(1, len(seen) + 1):
            c = seen.get(v)
            rows.append("[" + (",".join(_dv_j(x.val) for x in c.neighbors) if c is not None else "") + "]")
        return "[" + ",".join(rows) + "]"
    if isinstance(o, dict):
        return "[" + ",".join(_dv_j(x) for x in o.values()) + "]"
    try:
        items = list(o)
    except TypeError:
        return _dv_q(str(o))
    return "[" + ",".join(_dv_j(x) for x in items) + "]"

def _dv_float(o):
    # A declared double: an int return (e.g. \`return 2\`) still prints as 2.00000.
    if isinstance(o, int) and not isinstance(o, bool):
        return float(o)
    return o

def _dv_prefix(arr, k):
    if not isinstance(k, int) or isinstance(k, bool):
        return arr
    try:
        return arr[:max(0, min(k, len(arr)))]
    except TypeError:
        return arr

def _dv_node_val(o):
    if o is None:
        return None
    return getattr(o, "val", o)

def _dv_out_line(s):
    _dv_sys.stdout.write("\\n${MARKER} " + s + "\\n")
    _dv_sys.stdout.flush()

def _dv_emit(i, s):
    _dv_out_line(str(i) + " " + s)

def _dv_start(i):
    _dv_out_line("S " + str(i))

def _dv_ce(errs):
    _dv_out_line("CE " + _dv_json.dumps(errs))

# The learner's frames only ("solution.py"), innermost last. A RecursionError
# carries up to a million of them: keep the outermost 3 and innermost 7.
def _dv_frames(tb):
    fr = []
    while tb is not None:
        co = tb.tb_frame.f_code
        if co.co_filename == "solution.py":
            fr.append((tb.tb_lineno, co.co_name))
        tb = tb.tb_next
    return fr

def _dv_trace(fr):
    import linecache as _dv_lc
    def one(f):
        src = _dv_lc.getline("solution.py", f[0]).strip() if f[0] else ""
        return '  File "solution.py", line %s, in %s' % (f[0], f[1]) + ("\\n    " + src if src else "")
    if len(fr) > 10:
        return "\\n".join([one(f) for f in fr[:3]] + ["  ... %d more frames ..." % (len(fr) - 10)] + [one(f) for f in fr[-7:]])
    return "\\n".join(one(f) for f in fr)

def _dv_msg(e):
    try:
        return str(e)
    except BaseException:
        return ""

def _dv_fail(i, e):
    fr = _dv_frames(e.__traceback__)
    _dv_out_line("RE " + str(i) + " " + _dv_json.dumps({
        "type": type(e).__name__, "message": _dv_msg(e),
        "line": fr[-1][0] if fr else None, "trace": _dv_trace(fr)}))

# Compile and run the learner's code. False = a CE was printed; run nothing.
def _dv_load(src, cls, methods):
    import linecache as _dv_lc
    n = max(1, len(src.splitlines()))
    _dv_lc.cache["solution.py"] = (len(src), None, src.splitlines(True), "solution.py")
    try:
        code = compile(src, "solution.py", "exec", dont_inherit=True)
    except SyntaxError as e:
        ln = e.lineno
        if isinstance(ln, int):
            ln = max(1, min(ln, n))
        name = type(e).__name__
        _dv_ce([{"line": ln, "col": e.offset if isinstance(e.offset, int) else None,
                 "message": (e.msg or _dv_msg(e)) if name == "SyntaxError" else name + ": " + (e.msg or _dv_msg(e))}])
        return False
    except BaseException as e:
        _dv_ce([{"line": None, "col": None, "message": type(e).__name__ + ": " + _dv_msg(e)}])
        return False
    try:
        exec(code, globals())
    except BaseException as e:
        fr = _dv_frames(e.__traceback__)
        _dv_ce([{"line": fr[-1][0] if fr else None, "col": None,
                 "message": type(e).__name__ + ": " + _dv_msg(e)}])
        return False
    hint = " - the hidden test code calls it; check that your class and method names match the starter code"
    c = globals().get(cls)
    if not isinstance(c, type):
        _dv_ce([{"line": None, "col": None, "message": "class " + cls + " is not defined" + hint}])
        return False
    missing = [m for m in methods if not callable(getattr(c, m, None))]
    if missing:
        _dv_ce([{"line": None, "col": None, "message": cls + " has no method " + ", ".join(missing) + hint}])
        return False
    return True
`;

// Wrap a returned value for the writer: doubles get coerced to float.
const ret = (type, expr) => (category(type) === "double" ? `_dv_float(${expr})` : expr);

// Turn one function's params into Python statements that read inputs and
// build arguments. Inputs are read in `inputs` order (the wire order); args
// that need a builder are constructed after every input is in hand.
// Returns { reads, run }: `reads` consume the case's stdin and never touch
// learner code; `run` goes inside the per-case try.
function functionCase(spec, f) {
  const reads = [];
  const lines = [];
  for (const inp of inputsOf(spec)) reads.push(`in_${inp.name} = ${reader(inp.type)}`);
  const built = new Set();
  let haveAb = false;
  const buildArg = (p) => {
    if (built.has(p.name)) return;
    const b = p.build;
    if (!b) {
      lines.push(`a_${p.name} = in_${p.name}`);
    } else if (b.from) {
      lines.push(`a_${p.name} = in_${b.from}`);
    } else if (b.cycle) {
      lines.push(`a_${p.name} = _dv_cycle(in_${b.cycle.values}, in_${b.cycle.pos})`);
    } else if (b.intersection) {
      const x = b.intersection;
      if (!haveAb) {
        lines.push(`_dv_ab = _dv_intersection(in_${x.listA}, in_${x.listB}, in_${x.skipA}, in_${x.skipB})`);
        haveAb = true;
      }
      lines.push(`a_${p.name} = _dv_ab[${x.side === "B" ? 1 : 0}]`);
    } else if (b.ref) {
      const treeParam = f.params.find(q => q.name === b.ref.tree);
      if (!treeParam) throw new Error(`devert100 harness (python): ref builder names unknown param ${b.ref.tree}`);
      buildArg(treeParam);
      lines.push(`a_${p.name} = _dv_ref(a_${b.ref.tree}, in_${b.ref.value})`);
    } else {
      throw new Error(`devert100 harness (python): unknown builder on ${p.name}`);
    }
    built.add(p.name);
  };
  f.params.forEach(buildArg);
  const call = `${spec.className}().${f.name}(${f.params.map(p => `a_${p.name}`).join(", ")})`;
  const out = spec.output || { mode: "return" };
  switch (out.mode) {
    case "return":
      if (f.returns === "void") throw new Error("devert100 harness: void function needs output.mode = param");
      lines.push(`_dv_r = ${call}`, `_dv_emit(_dv_case, _dv_j(${ret(f.returns, "_dv_r")}))`); break;
    case "param":
      lines.push(call, `_dv_emit(_dv_case, _dv_j(a_${out.name}))`); break;
    case "returnAndParamPrefix":
      lines.push(`_dv_k = ${call}`, `_dv_emit(_dv_case, "[" + _dv_j(_dv_k) + "," + _dv_j(_dv_prefix(a_${out.name}, _dv_k)) + "]")`); break;
    case "nodeVal":
      lines.push(`_dv_r = ${call}`, `_dv_emit(_dv_case, _dv_j(_dv_node_val(_dv_r)))`); break;
    case "graphCopy":
      lines.push(`_dv_r = ${call}`, `_dv_emit(_dv_case, "[]" if _dv_r is None else _dv_j(_dv_r))`); break;
    default:
      throw new Error(`devert100 harness: unknown output mode ${out.mode}`);
  }
  return { reads, run: lines };
}

// Every op and its args are read up front (into _dv_calls) so a throw midway
// through the ops cannot leave the rest of this case's tokens on stdin.
function designCase(spec) {
  const C = spec.className;
  const reads = [];
  const lines = [];
  const ctor = spec.constructor?.params || [];
  ctor.forEach((p, i) => reads.push(`c${i} = ${reader(p.type)}`));
  reads.push(`_dv_calls = []`);
  reads.push(`for _dv_op in range(1, _dv_ops):`);
  reads.push(`${IND}_dv_m = _dv_ni()`);
  spec.functions.forEach((f, mi) => {
    reads.push(`${IND}${mi === 0 ? "if" : "elif"} _dv_m == ${mi + 1}:`);
    reads.push(`${IND}${IND}_dv_calls.append((${mi + 1}, [${f.params.map(p => reader(p.type)).join(", ")}]))`);
  });
  if (spec.functions.length) reads.push(`${IND}else:`);
  reads.push(`${IND}${spec.functions.length ? IND : ""}raise RuntimeError("bad op " + str(_dv_m))`);

  lines.push(`obj = ${C}(${ctor.map((_, i) => `c${i}`).join(", ")})`);
  lines.push(`_dv_out = ["null"]`);
  lines.push(`for _dv_m, _dv_p in _dv_calls:`);
  spec.functions.forEach((f, mi) => {
    lines.push(`${IND}${mi === 0 ? "if" : "elif"} _dv_m == ${mi + 1}:`);
    const call = `obj.${f.name}(${f.params.map((_, i) => `_dv_p[${i}]`).join(", ")})`;
    if (f.returns === "void") lines.push(`${IND}${IND}${call}`, `${IND}${IND}_dv_out.append("null")`);
    else lines.push(`${IND}${IND}_dv_out.append(_dv_j(${ret(f.returns, call)}))`);
  });
  lines.push(`_dv_emit(_dv_case, "[" + ",".join(_dv_out) + "]")`);
  return { reads, run: lines };
}

// try/except around one case's learner-facing statements, at indent `ind`.
function guarded(ind, run) {
  return [
    `${ind}try:`,
    ...run.map(l => `${ind}${IND}${l}`),
    `${ind}except BaseException as _dv_e:`,
    `${ind}${IND}_dv_fail(_dv_case, _dv_e)`,
  ];
}

export function program(spec, userCode) {
  const header = [...IMPORTS, CLASSES].join("\n");
  const body = String(userCode || "").replace(/\r/g, "").replace(/^﻿/, "");
  // JSON's string escapes (\" \\ \n \t \uXXXX, lone surrogates escaped) are
  // all valid in a Python string literal.
  const methods = JSON.stringify(spec.functions.map(f => f.name));
  const main = [
    RUNTIME,
    `_dv_src = ${JSON.stringify(body)}`,
    "",
    "def _dv_main():",
    `${IND}_dv_T = _dv_ni()`,
    `${IND}for _dv_case in range(_dv_T):`,
  ];
  const I2 = IND + IND;
  const I3 = I2 + IND;
  main.push(`${I2}_dv_graph_in.clear()`, `${I2}_dv_start(_dv_case)`);
  if (spec.kind === "design") {
    main.push(`${I2}_dv_ops = _dv_ni()`);
    const { reads, run } = designCase(spec);
    reads.forEach(l => main.push(`${I2}${l}`));
    main.push(...guarded(I2, run));
  } else {
    main.push(`${I2}_dv_fn = _dv_ni()`);
    spec.functions.forEach((f, fi) => {
      main.push(`${I2}${fi === 0 ? "if" : "elif"} _dv_fn == ${fi}:`);
      const { reads, run } = functionCase(spec, f);
      reads.forEach(l => main.push(`${I3}${l}`));
      main.push(...guarded(I3, run));
    });
    main.push(`${I2}else:`, `${I3}raise RuntimeError("bad function index " + str(_dv_fn))`);
  }
  main.push("", `if _dv_load(_dv_src, ${JSON.stringify(spec.className)}, ${methods}):`, `${IND}_dv_main()`);
  return [header, main.join("\n"), ""].join("\n");
}
