// DeVert 100 harness - C. See spec.mjs for the spec shape and the
// stdin/stdout protocol every language implements, and java.mjs for the
// reference implementation whose semantics this file mirrors.
//
// LeetCode's C conventions, which the stub reproduces exactly:
//   - arrays are a pointer plus a length: `int* nums, int numsSize`
//   - 2-D params add a per-row length array: `int** grid, int gridSize, int* gridColSize`
//   - array returns add `int* returnSize`; 2-D returns also `int** returnColumnSizes`
//     (design methods spell them `retSize` / `retColSize`)
//   - String is `char*`, String[] is `char** strs, int strsSize`,
//     List<List<String>> returns `char***`, boolean is stdbool's `bool`,
//     long is `long long`, char[] (LC 344 / 443) is `char* s, int sSize`
//   - struct ListNode / struct TreeNode / LeetCode's C graph
//     `struct Node { int val; int numNeighbors; struct Node** neighbors; }`
//   - a design class is `typedef struct { } MinStack;` plus free functions
//     `minStackCreate`, `minStackPush(MinStack* obj, ...)`, ..., `minStackFree`
//     (the class name lower-camelled: LRUCache -> lRUCacheCreate)
//
// Program layout (one file, compiled by gcc in prod):
//   ...      every #include, then only the node structs the spec uses (so a
//            learner's own `struct Node` in an LRU cache never collides), then
//            the whole runtime: token reader, builders, JSON writer. All of it
//            sits ABOVE the learner's code so a learner's #define can only
//            ever reach main().
//   #line 1  the learner's code, under `#line 1 "solution.c"` so compiler
//            errors carry the learner's own line numbers
//   ...      int main(): the cases, under `#line 1 "driver.c"` (both file
//            names are what spec.mjs's parseCompilerStderr matches); each case
//            prints a flushed `S <i>` marker first. No RE marker: C has no
//            exceptions, and a crash is told apart by the last S printed.
//
// Memory: whatever the learner returns is theirs (malloc'd per LeetCode's
// note); the driver never frees it - the process exits after the last case.

import { category, inputsOf, MARKER } from "./spec.mjs";

const IND = "    ";

// ---- types --------------------------------------------------------------

// dims: 0 = a single C value, 1 = pointer + length, 2 = pointer + rows + column sizes.
const SCALAR = {
  "int": "int", "long": "long long", "double": "double", "boolean": "bool", "char": "char",
  "String": "char*", "ListNode": "struct ListNode*", "TreeNode": "struct TreeNode*", "Node": "struct Node*",
};
const ELEM_1D = {
  "int[]": "int", "List<Integer>": "int", "ArrayList<Integer>": "int", "long[]": "long long",
  "String[]": "char*", "List<String>": "char*", "char[]": "char", "ListNode[]": "struct ListNode*",
};
const ELEM_2D = {
  "int[][]": "int", "List<List<Integer>>": "int", "ArrayList<ArrayList<Integer>>": "int",
  "List<List<String>>": "char*", "char[][]": "char",
};

function dims(type) {
  if (type in SCALAR) return 0;
  if (type in ELEM_1D) return 1;
  if (type in ELEM_2D) return 2;
  if (type === "void") return -1;
  throw new Error(`devert100 harness (c): unknown type ${type}`);
}

// The C type of a value (holder / return), e.g. "int*", "char***".
function cType(type) {
  const d = dims(type);
  if (d === 0) return SCALAR[type];
  if (d === 1) return `${ELEM_1D[type]}*`;
  if (d === 2) return `${ELEM_2D[type]}**`;
  return "void";
}

// LeetCode writes `struct Node *s` for the graph (LC 133) and `struct ListNode *head`
// on the problems that predate its 2020 template refresh (LC 141 / 160).
function spaced(t, style) {
  if (t === "struct Node*") return "struct Node *";
  if (t === "struct ListNode*" && style.oldList) return "struct ListNode *";
  return t + " ";
}

function paramDecls(p, style) {
  const d = dims(p.type);
  if (d === 0) return [`${spaced(SCALAR[p.type], style)}${p.name}`];
  if (d === 1) return [`${ELEM_1D[p.type]}* ${p.name}`, `int ${p.name}Size`];
  return [`${ELEM_2D[p.type]}** ${p.name}`, `int ${p.name}Size`, `int* ${p.name}ColSize`];
}

function outParams(type, design) {
  const d = dims(type);
  const rs = design ? "retSize" : "returnSize";
  const rc = design ? "retColSize" : "returnColumnSizes";
  if (d === 1) return [`int* ${rs}`];
  if (d === 2) return [`int* ${rs}`, `int** ${rc}`];
  return [];
}

const lowerFirst = s => s.charAt(0).toLowerCase() + s.slice(1);
const upperFirst = s => s.charAt(0).toUpperCase() + s.slice(1);
const designFn = (C, m) => lowerFirst(C) + upperFirst(m);

// ---- stub ---------------------------------------------------------------

const DEF_COMMENTS = {
  ListNode: [
    "/**",
    " * Definition for singly-linked list.",
    " * struct ListNode {",
    " *     int val;",
    " *     struct ListNode *next;",
    " * };",
    " */",
  ],
  TreeNode: [
    "/**",
    " * Definition for a binary tree node.",
    " * struct TreeNode {",
    " *     int val;",
    " *     struct TreeNode *left;",
    " *     struct TreeNode *right;",
    " * };",
    " */",
  ],
  Node: [
    "/**",
    " * Definition for a Node.",
    " * struct Node {",
    " *     int val;",
    " *     int numNeighbors;",
    " *     struct Node** neighbors;",
    " * };",
    " */",
  ],
};

const NOTE_1D = [
  "/**",
  " * Note: The returned array must be malloced, assume caller calls free().",
  " */",
];
const NOTE_2D = [
  "/**",
  " * Return an array of arrays of size *returnSize.",
  " * The sizes of the arrays are returned as *returnColumnSizes array.",
  " * Note: Both returned array and *columnSizes array must be malloced, assume caller calls free().",
  " */",
];

function usedTypes(spec) {
  const all = [];
  for (const f of spec.functions) { all.push(f.returns); f.params.forEach(p => all.push(p.type)); }
  (spec.constructor?.params || []).forEach(p => all.push(p.type));
  inputsOf(spec).forEach(i => all.push(i.type));
  return all;
}

function needs(spec) {
  const cats = new Set(usedTypes(spec).map(category));
  const builds = spec.functions.flatMap(f => f.params.map(p => p.build || {}));
  return {
    list: cats.has("list") || cats.has("lists"),
    tree: cats.has("tree"),
    graph: cats.has("graph"),
    oldList: builds.some(b => b.cycle || b.intersection),
  };
}

function defaultBody(type, design) {
  const d = dims(type);
  const rs = design ? "retSize" : "returnSize";
  const rc = design ? "retColSize" : "returnColumnSizes";
  if (d === -1) return null;
  if (d === 1) return [`*${rs} = 0;`, "return NULL;"];
  if (d === 2) return [`*${rs} = 0;`, `*${rc} = NULL;`, "return NULL;"];
  switch (type) {
    case "int": case "long": return ["return 0;"];
    case "double": return ["return 0.0;"];
    case "boolean": return ["return false;"];
    case "char": return ["return 'a';"];
    case "String": return ["return \"\";"];
    default: return ["return NULL;"];
  }
}

// opts.defaultReturn: fill every body with a type-correct return so the stub
// compiles on its own - used only by the build-time verifier.
export function stub(spec, opts = {}) {
  const n = needs(spec);
  const out = [];
  if (n.list) out.push(...DEF_COMMENTS.ListNode);
  if (n.tree) out.push(...DEF_COMMENTS.TreeNode);
  if (n.graph) out.push(...DEF_COMMENTS.Node);
  const body = (ret, design) => {
    const r = opts.defaultReturn ? defaultBody(ret, design) : null;
    return r === null ? [IND] : r.map(l => IND + l);
  };
  if (spec.kind === "design") {
    const C = spec.className;
    const ctor = spec.constructor?.params || [];
    if (out.length) out.push("");
    out.push("typedef struct {", IND, `} ${C};`, "", "");
    out.push(`${C}* ${designFn(C, "Create")}(${ctor.flatMap(p => paramDecls(p, n)).join(", ")}) {`,
      ...(opts.defaultReturn ? [`${IND}return NULL;`] : [IND]), "}", "");
    for (const f of spec.functions) {
      const params = [`${C}* obj`, ...f.params.flatMap(p => paramDecls(p, n)), ...outParams(f.returns, true)];
      out.push(`${spaced(cType(f.returns), n)}${designFn(C, f.name)}(${params.join(", ")}) {`, ...body(f.returns, true), "}", "");
    }
    out.push(`void ${designFn(C, "Free")}(${C}* obj) {`, IND, "}", "");
    const usageArgs = ps => ps.flatMap(p => paramDecls(p, n).map(d => d.split(/[\s*]+/).pop()));
    const usage = ["/**", ` * Your ${C} struct will be instantiated and called as such:`,
      ` * ${C}* obj = ${designFn(C, "Create")}(${usageArgs(ctor).join(", ")});`];
    spec.functions.forEach((f, i) => {
      const args = ["obj", ...usageArgs(f.params), ...outParams(f.returns, true).map(d => d.split(/[\s*]+/).pop())];
      const call = `${designFn(C, f.name)}(${args.join(", ")});`;
      usage.push(f.returns === "void" ? ` * ${call}` : ` * ${cType(f.returns)} param_${i + 1} = ${call}`, " ");
    });
    usage.push(` * ${designFn(C, "Free")}(obj);`, "*/");
    out.push(...usage);
  } else {
    spec.functions.forEach((f) => {
      if (out.length) out.push("");
      const d = dims(f.returns);
      if (d === 1) out.push(...NOTE_1D);
      if (d === 2) out.push(...NOTE_2D);
      const params = [...f.params.flatMap(p => paramDecls(p, n)), ...outParams(f.returns, false)];
      out.push(`${spaced(cType(f.returns), n)}${f.name}(${params.join(", ")}) {`, ...body(f.returns, false), "}");
    });
  }
  return out.join("\n") + "\n";
}

// ---- driver: holders ----------------------------------------------------
// Every value the driver handles lives in a "holder": the C variable `name`,
// plus `name_n` (length) for 1-D and `name_n` + `name_c` (row lengths) for 2-D.

function holderDecl(type, name, src) {
  const d = dims(type);
  const t = cType(type);
  if (d === 0) return [`${t} ${name}${src ? ` = ${src}` : ""};`];
  if (d === 1) return [`${t} ${name} = ${src || "NULL"}; int ${name}_n = ${src ? `${src}_n` : "0"};`];
  return [`${t} ${name} = ${src || "NULL"}; int ${name}_n = ${src ? `${src}_n` : "0"}; int* ${name}_c = ${src ? `${src}_c` : "NULL"};`];
}

const READ_SCALAR = {
  "int": "(int)__dv_rl()", "long": "__dv_rl()", "double": "__dv_rd()", "boolean": "(__dv_rl() != 0)",
  "char": "(char)__dv_rl()", "String": "__dv_rs()", "ListNode": "__dv_rlist()", "TreeNode": "__dv_rtree()",
  "Node": "__dv_rgraph()",
};
const READ_1D = { "int": "__dv_ri1", "long long": "__dv_rL1", "char*": "__dv_rs1", "char": "__dv_rc1", "struct ListNode*": "__dv_rlists" };
const READ_2D = { "int": "__dv_ri2", "char*": "__dv_rs2", "char": "__dv_rc2" };

// Declare a holder and fill it from stdin.
function readHolder(type, name) {
  const d = dims(type);
  if (d === 0) return holderDecl(type, name, READ_SCALAR[type]);
  if (d === 1) return [...holderDecl(type, name), `${READ_1D[ELEM_1D[type]]}(&${name}, &${name}_n);`];
  return [...holderDecl(type, name), `${READ_2D[ELEM_2D[type]]}(&${name}, &${name}_n, &${name}_c);`];
}

function holderArgs(type, name) {
  const d = dims(type);
  if (d === 0) return [name];
  if (d === 1) return [name, `${name}_n`];
  return [name, `${name}_n`, `${name}_c`];
}

const WRITE_SCALAR = {
  "int": "__dv_wl", "long": "__dv_wl", "double": "__dv_wd", "boolean": "__dv_wb", "char": "__dv_wc",
  "String": "__dv_ws", "ListNode": "__dv_wlist", "TreeNode": "__dv_wtree", "Node": "__dv_wgraph",
};
const WRITE_1D = { "int": "__dv_wi1", "long long": "__dv_wL1", "char*": "__dv_ws1", "char": "__dv_wc1", "struct ListNode*": "__dv_wlists" };
const WRITE_2D = { "int": "__dv_wi2", "char*": "__dv_ws2", "char": "__dv_wc2" };

// Append the JSON of a value: `v` the value, `len` / `cols` its sizes.
function writeValue(type, v, len, cols) {
  const d = dims(type);
  if (d === 0) return `${WRITE_SCALAR[type]}(${v});`;
  if (d === 1) return `${WRITE_1D[ELEM_1D[type]]}(${v}, ${len});`;
  return `${WRITE_2D[ELEM_2D[type]]}(${v}, ${len}, ${cols});`;
}

// Call a function that returns `type` and append its JSON.
function callAndWrite(type, fn, args) {
  const d = dims(type);
  if (d === 0) return [`${cType(type)} __r = ${fn}(${args.join(", ")});`, writeValue(type, "__r")];
  if (d === 1) return [`int __rn = 0;`, `${cType(type)} __r = ${fn}(${[...args, "&__rn"].join(", ")});`, writeValue(type, "__r", "__rn")];
  return [`int __rn = 0; int* __rc = NULL;`, `${cType(type)} __r = ${fn}(${[...args, "&__rn", "&__rc"].join(", ")});`, writeValue(type, "__r", "__rn", "__rc")];
}

// ---- driver: runtime ----------------------------------------------------

const INCLUDES = [
  "#include <stdio.h>",
  "#include <stdlib.h>",
  "#include <string.h>",
  "#include <stdbool.h>",
  "#include <limits.h>",
  "#include <math.h>",
  "#include <ctype.h>",
  "#include <stdint.h>",
  "#include <stddef.h>",
  "#include <assert.h>",
  // LeetCode's C judge includes uthash by default; use it wherever the compiler has it.
  "#if defined(__has_include)",
  "#if __has_include(<uthash.h>)",
  "#include <uthash.h>",
  "#endif",
  "#endif",
];

const STRUCTS = {
  list: "struct ListNode { int val; struct ListNode *next; };",
  tree: "struct TreeNode { int val; struct TreeNode *left; struct TreeNode *right; };",
  graph: "struct Node { int val; int numNeighbors; struct Node** neighbors; };",
};

const RT_BASE = `
static char* __dv_in = NULL; static size_t __dv_inLen = 0, __dv_p = 0;
static void __dv_load(void) {
    size_t cap = 1 << 16; size_t k;
    __dv_in = (char*)malloc(cap + 1);
    while ((k = fread(__dv_in + __dv_inLen, 1, cap - __dv_inLen, stdin)) > 0) {
        __dv_inLen += k;
        if (__dv_inLen == cap) { cap *= 2; __dv_in = (char*)realloc(__dv_in, cap + 1); }
    }
    __dv_in[__dv_inLen] = 0;
}
static void __dv_skip(void) { while (__dv_p < __dv_inLen && isspace((unsigned char)__dv_in[__dv_p])) __dv_p++; }
static long long __dv_rl(void) {
    __dv_skip(); char* e; long long v = strtoll(__dv_in + __dv_p, &e, 10);
    __dv_p = (size_t)(e - __dv_in); return v;
}
static double __dv_rd(void) {
    __dv_skip(); char* e; double v = strtod(__dv_in + __dv_p, &e);
    __dv_p = (size_t)(e - __dv_in); return v;
}
static size_t __dv_cnt(int n) { return n > 0 ? (size_t)n : 1; }
/* UTF-16 code units in, UTF-8 out, NUL-terminated. */
static char* __dv_rs(void) {
    int n = (int)__dv_rl(); char* s = (char*)malloc(3 * __dv_cnt(n) + 1); size_t k = 0;
    for (int i = 0; i < n; i++) {
        unsigned u = (unsigned)__dv_rl();
        if (u < 0x80) s[k++] = (char)u;
        else if (u < 0x800) { s[k++] = (char)(0xC0 | (u >> 6)); s[k++] = (char)(0x80 | (u & 0x3F)); }
        else { s[k++] = (char)(0xE0 | (u >> 12)); s[k++] = (char)(0x80 | ((u >> 6) & 0x3F)); s[k++] = (char)(0x80 | (u & 0x3F)); }
    }
    s[k] = 0; return s;
}
static void __dv_ri1(int** a, int* n) { *n = (int)__dv_rl(); *a = (int*)malloc(__dv_cnt(*n) * sizeof(int)); for (int i = 0; i < *n; i++) (*a)[i] = (int)__dv_rl(); }
static void __dv_rL1(long long** a, int* n) { *n = (int)__dv_rl(); *a = (long long*)malloc(__dv_cnt(*n) * sizeof(long long)); for (int i = 0; i < *n; i++) (*a)[i] = __dv_rl(); }
static void __dv_rs1(char*** a, int* n) { *n = (int)__dv_rl(); *a = (char**)malloc(__dv_cnt(*n) * sizeof(char*)); for (int i = 0; i < *n; i++) (*a)[i] = __dv_rs(); }
/* char[] rows are NUL-terminated too, so strlen on them is safe. */
static void __dv_rc1(char** a, int* n) { *n = (int)__dv_rl(); *a = (char*)malloc(__dv_cnt(*n) + 1); for (int i = 0; i < *n; i++) (*a)[i] = (char)__dv_rl(); (*a)[*n > 0 ? *n : 0] = 0; }
static void __dv_ri2(int*** a, int* n, int** c) { *n = (int)__dv_rl(); *a = (int**)malloc(__dv_cnt(*n) * sizeof(int*)); *c = (int*)malloc(__dv_cnt(*n) * sizeof(int)); for (int i = 0; i < *n; i++) __dv_ri1(&(*a)[i], &(*c)[i]); }
static void __dv_rs2(char**** a, int* n, int** c) { *n = (int)__dv_rl(); *a = (char***)malloc(__dv_cnt(*n) * sizeof(char**)); *c = (int*)malloc(__dv_cnt(*n) * sizeof(int)); for (int i = 0; i < *n; i++) __dv_rs1(&(*a)[i], &(*c)[i]); }
static void __dv_rc2(char*** a, int* n, int** c) { *n = (int)__dv_rl(); *a = (char**)malloc(__dv_cnt(*n) * sizeof(char*)); *c = (int*)malloc(__dv_cnt(*n) * sizeof(int)); for (int i = 0; i < *n; i++) __dv_rc1(&(*a)[i], &(*c)[i]); }

static char* __dv_o = NULL; static size_t __dv_ol = 0, __dv_oc = 0;
static void __dv_put(const char* s, size_t k) {
    if (__dv_ol + k + 1 > __dv_oc) { while (__dv_ol + k + 1 > __dv_oc) __dv_oc = __dv_oc ? __dv_oc * 2 : 4096; __dv_o = (char*)realloc(__dv_o, __dv_oc); }
    memcpy(__dv_o + __dv_ol, s, k); __dv_ol += k; __dv_o[__dv_ol] = 0;
}
static void __dv_puts(const char* s) { __dv_put(s, strlen(s)); }
static void __dv_wl(long long v) { char b[32]; snprintf(b, sizeof b, "%lld", v); __dv_puts(b); }
static void __dv_wd(double v) { char b[400]; if (isnan(v) || isinf(v)) { __dv_puts("null"); return; } snprintf(b, sizeof b, "%.5f", v); __dv_puts(b); }
static void __dv_wb(bool v) { __dv_puts(v ? "true" : "false"); }
static void __dv_wq(const char* s, size_t k) {
    __dv_put("\\"", 1);
    for (size_t i = 0; i < k; i++) {
        unsigned char c = (unsigned char)s[i];
        if (c == '"' || c == '\\\\') { char e[2] = { '\\\\', (char)c }; __dv_put(e, 2); }
        else if (c < 0x20) { char e[8]; snprintf(e, sizeof e, "\\\\u%04x", c); __dv_puts(e); }
        else __dv_put((const char*)&c, 1);
    }
    __dv_put("\\"", 1);
}
static void __dv_ws(const char* s) { if (s == NULL) __dv_puts("null"); else __dv_wq(s, strlen(s)); }
static void __dv_wc(char c) { __dv_wq(&c, 1); }
#define __DV_W1(NAME, T, EACH) static __attribute__((unused)) void NAME(T* a, int n) { if (n <= 0) { __dv_puts("[]"); return; } if (a == NULL) { __dv_puts("null"); return; } __dv_put("[", 1); for (int i = 0; i < n; i++) { if (i > 0) __dv_put(",", 1); EACH(a[i]); } __dv_put("]", 1); }
#define __DV_W2(NAME, T, ROW) static __attribute__((unused)) void NAME(T** a, int n, int* c) { if (n <= 0) { __dv_puts("[]"); return; } if (a == NULL || c == NULL) { __dv_puts("null"); return; } __dv_put("[", 1); for (int i = 0; i < n; i++) { if (i > 0) __dv_put(",", 1); ROW(a[i], c[i]); } __dv_put("]", 1); }
__DV_W1(__dv_wi1, int, __dv_wl)
__DV_W1(__dv_wL1, long long, __dv_wl)
__DV_W1(__dv_ws1, char*, __dv_ws)
__DV_W1(__dv_wc1, char, __dv_wc)
__DV_W2(__dv_wi2, int, __dv_wi1)
__DV_W2(__dv_ws2, char*, __dv_ws1)
__DV_W2(__dv_wc2, char, __dv_wc1)
static void __dv_emit(int i) {
    fflush(stdout);
    printf("\\n${MARKER} %d ", i);
    fwrite(__dv_o ? __dv_o : "", 1, __dv_ol, stdout);
    printf("\\n");
    fflush(stdout);
    __dv_ol = 0;
}
// Case i is starting. Flushed before the case runs, so a segfault or a time
// limit inside it still leaves the page knowing which case died.
static void __dv_start(int i) {
    fflush(stdout);
    printf("\\n${MARKER} S %d\\n", i);
    fflush(stdout);
}
`;

const RT_LIST = `
static struct ListNode* __dv_ln(int v) { struct ListNode* t = (struct ListNode*)malloc(sizeof(struct ListNode)); t->val = v; t->next = NULL; return t; }
static struct ListNode* __dv_fromArr(const int* v, int n) { struct ListNode d; d.next = NULL; struct ListNode* t = &d; for (int i = 0; i < n; i++) { t->next = __dv_ln(v[i]); t = t->next; } return d.next; }
static struct ListNode* __dv_rlist(void) { int* v; int n; __dv_ri1(&v, &n); struct ListNode* h = __dv_fromArr(v, n); free(v); return h; }
static void __dv_rlists(struct ListNode*** a, int* n) { *n = (int)__dv_rl(); *a = (struct ListNode**)malloc(__dv_cnt(*n) * sizeof(struct ListNode*)); for (int i = 0; i < *n; i++) (*a)[i] = __dv_rlist(); }
static struct ListNode* __dv_cycle(const int* v, int n, int pos) {
    struct ListNode* head = __dv_fromArr(v, n); if (pos < 0 || head == NULL) return head;
    struct ListNode* tail = head; struct ListNode* at = NULL; int i = 0;
    for (struct ListNode* c = head; c != NULL; c = c->next, i++) { if (i == pos) at = c; tail = c; }
    tail->next = at; return head;
}
static void __dv_intersection(const int* a, int na, const int* b, int nb, int skipA, int skipB, struct ListNode** outA, struct ListNode** outB) {
    struct ListNode* ha = __dv_fromArr(a, na);
    struct ListNode* shared = ha; for (int i = 0; i < skipA && shared != NULL; i++) shared = shared->next;
    struct ListNode d; d.next = NULL; struct ListNode* t = &d;
    for (int i = 0; i < skipB && i < nb; i++) { t->next = __dv_ln(b[i]); t = t->next; }
    t->next = shared;
    *outA = ha; *outB = d.next;
}
static void __dv_wlist(struct ListNode* o) {
    if (o == NULL) { __dv_puts("null"); return; }
    size_t mark = __dv_ol; int i = 0;
    __dv_put("[", 1);
    for (struct ListNode* c = o; c != NULL; c = c->next) {
        if (i > 10000) { __dv_ol = mark; __dv_wq("CYCLE_IN_RETURNED_LIST", 22); return; }
        if (i++ > 0) __dv_put(",", 1);
        __dv_wl(c->val);
    }
    __dv_put("]", 1);
}
__DV_W1(__dv_wlists, struct ListNode*, __dv_wlist)
`;

const RT_TREE = `
static struct TreeNode* __dv_tn(int v) { struct TreeNode* t = (struct TreeNode*)malloc(sizeof(struct TreeNode)); t->val = v; t->left = NULL; t->right = NULL; return t; }
static struct TreeNode* __dv_rtree(void) {
    int n = (int)__dv_rl(); int* v = (int*)malloc(__dv_cnt(n) * sizeof(int)); char* has = (char*)malloc(__dv_cnt(n));
    for (int i = 0; i < n; i++) { has[i] = __dv_rl() != 0; if (has[i]) v[i] = (int)__dv_rl(); }
    struct TreeNode* root = NULL;
    if (n > 0 && has[0]) {
        struct TreeNode** q = (struct TreeNode**)malloc(__dv_cnt(n) * sizeof(struct TreeNode*)); int qh = 0, qt = 0, i = 1;
        root = __dv_tn(v[0]); q[qt++] = root;
        while (qh < qt && i < n) {
            struct TreeNode* cur = q[qh++];
            if (i < n && has[i]) { cur->left = __dv_tn(v[i]); q[qt++] = cur->left; } i++;
            if (i < n && has[i]) { cur->right = __dv_tn(v[i]); q[qt++] = cur->right; } i++;
        }
        free(q);
    }
    free(v); free(has); return root;
}
static struct TreeNode* __dv_ref(struct TreeNode* root, int val) {
    if (root == NULL) return NULL; if (root->val == val) return root;
    struct TreeNode* l = __dv_ref(root->left, val); return l != NULL ? l : __dv_ref(root->right, val);
}
/* Level order with nulls, trailing nulls trimmed - LeetCode's own format. */
static void __dv_wtree(struct TreeNode* o) {
    if (o == NULL) { __dv_puts("null"); return; }
    size_t cap = 64, len = 0; struct TreeNode** q = (struct TreeNode**)malloc(cap * sizeof(struct TreeNode*));
    q[len++] = o;
    for (size_t h = 0; h < len; h++) {
        struct TreeNode* t = q[h]; if (t == NULL) continue;
        if (len + 2 > cap) {
            if (cap >= ((size_t)1 << 24)) { free(q); __dv_wq("CYCLE_IN_RETURNED_TREE", 22); return; }
            cap *= 2; q = (struct TreeNode**)realloc(q, cap * sizeof(struct TreeNode*));
        }
        q[len++] = t->left; q[len++] = t->right;
    }
    size_t end = len; while (end > 0 && q[end - 1] == NULL) end--;
    __dv_put("[", 1);
    for (size_t i = 0; i < end; i++) { if (i > 0) __dv_put(",", 1); if (q[i]) __dv_wl(q[i]->val); else __dv_puts("null"); }
    __dv_put("]", 1);
    free(q);
}
`;

const RT_GRAPH = `
static struct Node** __dv_gIn = NULL; static int __dv_gInN = 0, __dv_gInCap = 0;
static struct Node* __dv_rgraph(void) {
    int** adj; int n; int* c; __dv_ri2(&adj, &n, &c); if (n == 0) return NULL;
    struct Node** nodes = (struct Node**)malloc((size_t)(n + 1) * sizeof(struct Node*));
    for (int i = 1; i <= n; i++) {
        nodes[i] = (struct Node*)malloc(sizeof(struct Node)); nodes[i]->val = i; nodes[i]->numNeighbors = c[i - 1];
        nodes[i]->neighbors = (struct Node**)malloc(__dv_cnt(c[i - 1]) * sizeof(struct Node*));
        if (__dv_gInN == __dv_gInCap) { __dv_gInCap = __dv_gInCap ? __dv_gInCap * 2 : 64; __dv_gIn = (struct Node**)realloc(__dv_gIn, (size_t)__dv_gInCap * sizeof(struct Node*)); }
        __dv_gIn[__dv_gInN++] = nodes[i];
    }
    for (int i = 1; i <= n; i++) for (int k = 0; k < c[i - 1]; k++) nodes[i]->neighbors[k] = nodes[adj[i - 1][k]];
    return nodes[1];
}
/* A returned graph as its adjacency list (vals 1..n), or NOT_A_DEEP_COPY if any input node leaks. */
static void __dv_wgraph(struct Node* start) {
    if (start == NULL) { __dv_puts("null"); return; }
    int cap = 64, ns = 0; struct Node** seen = (struct Node**)malloc((size_t)cap * sizeof(struct Node*));
    seen[ns++] = start;
    for (int h = 0; h < ns; h++) {
        struct Node* c = seen[h];
        for (int g = 0; g < __dv_gInN; g++) if (__dv_gIn[g] == c) { free(seen); __dv_wq("NOT_A_DEEP_COPY", 15); return; }
        if (c->neighbors == NULL) continue;
        for (int k = 0; k < c->numNeighbors; k++) {
            struct Node* x = c->neighbors[k]; if (x == NULL) continue;
            int dup = 0; for (int s = 0; s < ns; s++) if (seen[s]->val == x->val) { dup = 1; break; }
            if (dup) continue;
            if (ns == cap) { cap *= 2; seen = (struct Node**)realloc(seen, (size_t)cap * sizeof(struct Node*)); }
            seen[ns++] = x;
        }
    }
    __dv_put("[", 1);
    for (int v = 1; v <= ns; v++) {
        if (v > 1) __dv_put(",", 1);
        __dv_put("[", 1);
        struct Node* c = NULL; for (int s = 0; s < ns; s++) if (seen[s]->val == v) { c = seen[s]; break; }
        if (c != NULL && c->neighbors != NULL) {
            int i = 0;
            for (int k = 0; k < c->numNeighbors; k++) { if (c->neighbors[k] == NULL) continue; if (i++ > 0) __dv_put(",", 1); __dv_wl(c->neighbors[k]->val); }
        }
        __dv_put("]", 1);
    }
    __dv_put("]", 1);
    free(seen);
}
`;

// ---- driver: cases ------------------------------------------------------

// Read every input (wire order), then build each param's argument holder.
function functionCase(spec, f, fi) {
  const lines = [];
  for (const inp of inputsOf(spec)) lines.push(...readHolder(inp.type, `in_${inp.name}`));
  const built = new Set();
  let haveAB = false;
  const buildArg = (p) => {
    if (built.has(p.name)) return;
    const b = p.build;
    if (!b) {
      lines.push(...holderDecl(p.type, `a_${p.name}`, `in_${p.name}`));
    } else if (b.from) {
      lines.push(...holderDecl(p.type, `a_${p.name}`, `in_${b.from}`));
    } else if (b.cycle) {
      lines.push(`struct ListNode* a_${p.name} = __dv_cycle(in_${b.cycle.values}, in_${b.cycle.values}_n, (int)in_${b.cycle.pos});`);
    } else if (b.intersection) {
      const x = b.intersection;
      if (!haveAB) {
        lines.push(`struct ListNode* __abA; struct ListNode* __abB;`,
          `__dv_intersection(in_${x.listA}, in_${x.listA}_n, in_${x.listB}, in_${x.listB}_n, (int)in_${x.skipA}, (int)in_${x.skipB}, &__abA, &__abB);`);
        haveAB = true;
      }
      lines.push(`struct ListNode* a_${p.name} = ${x.side === "B" ? "__abB" : "__abA"};`);
    } else if (b.ref) {
      buildArg(f.params.find(q => q.name === b.ref.tree));
      lines.push(`struct TreeNode* a_${p.name} = __dv_ref(a_${b.ref.tree}, (int)in_${b.ref.value});`);
    } else {
      throw new Error(`devert100 harness (c): unknown builder on ${p.name}`);
    }
    built.add(p.name);
  };
  f.params.forEach(buildArg);
  const args = f.params.flatMap(p => holderArgs(p.type, `a_${p.name}`));
  const call = `${f.name}(${args.join(", ")})`;
  const out = spec.output || { mode: "return" };
  const outParam = () => {
    const p = f.params.find(q => q.name === out.name);
    if (!p) throw new Error(`devert100 harness (c): output names unknown param ${out.name}`);
    return p;
  };
  switch (out.mode) {
    case "return":
      if (f.returns === "void") throw new Error("devert100 harness: void function needs output.mode = param");
      lines.push(...callAndWrite(f.returns, f.name, args)); break;
    case "param": {
      const p = outParam();
      lines.push(`${call};`, writeValue(p.type, `a_${p.name}`, `a_${p.name}_n`, `a_${p.name}_c`)); break;
    }
    case "returnAndParamPrefix": {
      const p = outParam();
      lines.push(`long long __k = ${call};`, `__dv_puts("["); __dv_wl(__k); __dv_puts(",");`);
      if (dims(p.type) === 1) {
        lines.push(`int __m = __k < 0 ? 0 : (__k > a_${p.name}_n ? a_${p.name}_n : (int)__k);`,
          `if (__m == 0) __dv_puts("[]"); else ${writeValue(p.type, `a_${p.name}`, "__m")}`);
      } else {
        lines.push(writeValue(p.type, `a_${p.name}`, `a_${p.name}_n`, `a_${p.name}_c`));
      }
      lines.push(`__dv_puts("]");`); break;
    }
    case "nodeVal":
      lines.push(`${cType(f.returns)} __r = ${call};`, `if (__r == NULL) __dv_puts("null"); else __dv_wl(__r->val);`); break;
    case "graphCopy":
      lines.push(`struct Node* __r = ${call};`, `if (__r == NULL) __dv_puts("[]"); else __dv_wgraph(__r);`); break;
    default:
      throw new Error(`devert100 harness: unknown output mode ${out.mode}`);
  }
  lines.push("__dv_emit(__case);");
  if (out.mode === "graphCopy") lines.push("__dv_gInN = 0;");
  return [`case ${fi}: {`, ...lines.map(l => `${IND}${l}`), `${IND}break;`, `}`];
}

function designCase(spec) {
  const C = spec.className;
  const lines = [];
  const ctor = spec.constructor?.params || [];
  ctor.forEach((p, i) => lines.push(...readHolder(p.type, `c${i}`)));
  lines.push(`${C}* obj = ${designFn(C, "Create")}(${ctor.flatMap((p, i) => holderArgs(p.type, `c${i}`)).join(", ")});`);
  lines.push(`__dv_puts("[null");`);
  lines.push(`for (int __k = 1; __k < __ops; __k++) {`);
  lines.push(`${IND}int __m = (int)__dv_rl();`);
  lines.push(`${IND}switch (__m) {`);
  spec.functions.forEach((f, mi) => {
    const reads = f.params.flatMap((p, i) => readHolder(p.type, `p${i}`));
    const args = ["obj", ...f.params.flatMap((p, i) => holderArgs(p.type, `p${i}`))];
    const fn = designFn(C, f.name);
    const act = f.returns === "void"
      ? [`${fn}(${args.join(", ")});`, `__dv_puts(",null");`]
      : [`__dv_puts(",");`, ...callAndWrite(f.returns, fn, args)];
    lines.push(`${IND}${IND}case ${mi + 1}: { ${[...reads, ...act].join(" ")} break; }`);
  });
  lines.push(`${IND}${IND}default: fprintf(stderr, "bad op %d\\n", __m); return 1;`);
  lines.push(`${IND}}`, `}`, `__dv_puts("]");`, `__dv_emit(__case);`, `${designFn(C, "Free")}(obj);`);
  return lines;
}

export function program(spec, userCode) {
  const n = needs(spec);
  const pre = [...INCLUDES];
  if (n.list) pre.push(STRUCTS.list);
  if (n.tree) pre.push(STRUCTS.tree);
  if (n.graph) pre.push(STRUCTS.graph);
  let rt = RT_BASE;
  if (n.list) rt += RT_LIST;
  if (n.tree) rt += RT_TREE;
  if (n.graph) rt += RT_GRAPH;
  // Every runtime helper is static and most specs use only a few: keep the
  // unused ones out of the learner's compiler output.
  rt = rt.replace(/^static /gm, "static __attribute__((unused)) ");

  const body = String(userCode || "").replace(/\r/g, "");

  const main = [];
  main.push("int main(void) {");
  main.push(`${IND}__dv_load();`);
  main.push(`${IND}int __T = (int)__dv_rl();`);
  main.push(`${IND}for (int __case = 0; __case < __T; __case++) {`);
  main.push(`${IND}${IND}__dv_start(__case);`);
  main.push(`${IND}${IND}__dv_ol = 0;`);
  if (spec.kind === "design") {
    main.push(`${IND}${IND}int __ops = (int)__dv_rl();`);
    designCase(spec).forEach(l => main.push(`${IND}${IND}${l}`));
  } else {
    main.push(`${IND}${IND}int __fn = (int)__dv_rl();`);
    main.push(`${IND}${IND}switch (__fn) {`);
    spec.functions.forEach((f, fi) => functionCase(spec, f, fi).forEach(l => main.push(`${IND}${IND}${IND}${l}`)));
    main.push(`${IND}${IND}}`);
  }
  main.push(`${IND}}`, `${IND}return 0;`, "}");

  return [
    pre.join("\n"),
    rt,
    `#line 1 "solution.c"`,
    body,
    `#line 1 "driver.c"`,
    main.join("\n"),
  ].join("\n") + "\n";
}
