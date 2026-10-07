// DeVert 100 harness - C++. See spec.mjs for the spec shape and the
// stdin/stdout protocol every language implements, and java.mjs for the
// reference implementation whose semantics this file mirrors.
//
// Program layout (one file, compiled by g++ in prod):
//   #include <bits/stdc++.h>  (as LeetCode)  + #include <cxxabi.h>
//   using namespace std; + ListNode / TreeNode / Node exactly as LeetCode
//            defines them - and only the ones the spec uses, so a learner's
//            own `struct Node` (LRU cache) or `struct ListNode` never
//            collides with ours
//   #line 1 "solution.cpp"
//            the learner's code, untouched - g++ reports its errors as
//            `solution.cpp:LINE:COL: error:` in THEIR line numbers
//   #line 1 "driver.cpp"
//            namespace __dv: the token reader, builders, JSON writer
//            int main(): the cases
//   parseCompilerStderr() (spec.mjs) reads both file names; an error in
//   driver.cpp means a renamed or re-typed function.
//
// Runtime errors: before each case the driver prints a flushed `S <i>` marker
// (a segfault cannot be caught; the marker tells the page which case died),
// and each case runs inside try/catch, so a throw becomes
// `RE <i> {type, message, line: null, trace: ""}` - C++ exceptions carry no
// source line - and the next case still runs. Every stdin token a case owns is
// read before the learner's code runs (design cases keep reading after a
// throw and only stop calling), so a throw never desynchronises the input.
//
// Every read is its own statement: C++ leaves the evaluation order of
// function arguments unspecified, so reads are never nested in one call.

import { category, inputsOf, MARKER } from "./spec.mjs";

const IND = "    ";

// ---- types --------------------------------------------------------------

const CPP_TYPE = {
  "int": "int", "long": "long long", "double": "double", "boolean": "bool", "char": "char",
  "String": "string",
  "int[]": "vector<int>", "List<Integer>": "vector<int>", "ArrayList<Integer>": "vector<int>",
  "long[]": "vector<long long>",
  "int[][]": "vector<vector<int>>", "List<List<Integer>>": "vector<vector<int>>",
  "ArrayList<ArrayList<Integer>>": "vector<vector<int>>",
  "String[]": "vector<string>", "List<String>": "vector<string>",
  "List<List<String>>": "vector<vector<string>>",
  "char[]": "vector<char>", "char[][]": "vector<vector<char>>",
  "ListNode": "ListNode*", "ListNode[]": "vector<ListNode*>",
  "TreeNode": "TreeNode*", "Node": "Node*", "void": "void",
};

function cppType(type) {
  const t = CPP_TYPE[type];
  if (!t) throw new Error(`devert100 harness (cpp): unknown type ${type}`);
  return t;
}

// LeetCode's C++ signatures take containers by non-const reference and
// everything else (including string) by value.
function paramDecl(p) {
  const t = cppType(p.type);
  return t.startsWith("vector<") ? `${t}& ${p.name}` : `${t} ${p.name}`;
}

const paramList = params => params.map(paramDecl).join(", ");

// ---- stub ---------------------------------------------------------------

const DEF_COMMENTS = {
  ListNode: [
    "/**",
    " * Definition for singly-linked list.",
    " * struct ListNode {",
    " *     int val;",
    " *     ListNode *next;",
    " *     ListNode() : val(0), next(nullptr) {}",
    " *     ListNode(int x) : val(x), next(nullptr) {}",
    " *     ListNode(int x, ListNode *next) : val(x), next(next) {}",
    " * };",
    " */",
  ],
  // LC 141 / 160 still show the pre-2020 definition.
  ListNodeOld: [
    "/**",
    " * Definition for singly-linked list.",
    " * struct ListNode {",
    " *     int val;",
    " *     ListNode *next;",
    " *     ListNode(int x) : val(x), next(NULL) {}",
    " * };",
    " */",
  ],
  TreeNode: [
    "/**",
    " * Definition for a binary tree node.",
    " * struct TreeNode {",
    " *     int val;",
    " *     TreeNode *left;",
    " *     TreeNode *right;",
    " *     TreeNode() : val(0), left(nullptr), right(nullptr) {}",
    " *     TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}",
    " *     TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}",
    " * };",
    " */",
  ],
  // LC 235 / 236 still show the pre-2020 definition.
  TreeNodeOld: [
    "/**",
    " * Definition for a binary tree node.",
    " * struct TreeNode {",
    " *     int val;",
    " *     TreeNode *left;",
    " *     TreeNode *right;",
    " *     TreeNode(int x) : val(x), left(NULL), right(NULL) {}",
    " * };",
    " */",
  ],
  Node: [
    "/*",
    "// Definition for a Node.",
    "class Node {",
    "public:",
    "    int val;",
    "    vector<Node*> neighbors;",
    "    Node() {",
    "        val = 0;",
    "        neighbors = vector<Node*>();",
    "    }",
    "    Node(int _val) {",
    "        val = _val;",
    "        neighbors = vector<Node*>();",
    "    }",
    "    Node(int _val, vector<Node*> _neighbors) {",
    "        val = _val;",
    "        neighbors = _neighbors;",
    "    }",
    "};",
    "*/",
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
  const builds = spec.functions.flatMap(f => f.params.map(p => p.build || {}));
  return {
    list: cats.has("list") || cats.has("lists"),
    tree: cats.has("tree"),
    graph: cats.has("graph"),
    oldList: builds.some(b => b.cycle || b.intersection),
    oldTree: builds.some(b => b.ref),
  };
}

function defaultReturn(type) {
  switch (type) {
    case "void": return null;
    case "int": case "long": return "0";
    case "double": return "0.0";
    case "boolean": return "false";
    case "char": return "'a'";
    case "String": return "\"\"";
    case "ListNode": case "TreeNode": case "Node": return "nullptr";
    default: return "{}";
  }
}

// opts.defaultReturn: fill every body with a type-correct return so the stub
// compiles on its own - used only by the build-time verifier.
export function stub(spec, opts = {}) {
  const n = needs(spec);
  const out = [];
  if (n.list) out.push(...(n.oldList ? DEF_COMMENTS.ListNodeOld : DEF_COMMENTS.ListNode));
  if (n.tree) out.push(...(n.oldTree ? DEF_COMMENTS.TreeNodeOld : DEF_COMMENTS.TreeNode));
  if (n.graph) out.push(...DEF_COMMENTS.Node, "");
  const body = (ret) => {
    const r = opts.defaultReturn ? defaultReturn(ret) : null;
    return r === null ? [`${IND}${IND}`] : [`${IND}${IND}return ${r};`];
  };
  const C = spec.className;
  out.push(`class ${C} {`, "public:");
  if (spec.kind === "design") {
    const ctor = spec.constructor?.params || [];
    out.push(`${IND}${C}(${paramList(ctor)}) {`, `${IND}${IND}`, `${IND}}`);
    for (const f of spec.functions) {
      out.push(`${IND}`, `${IND}${cppType(f.returns)} ${f.name}(${paramList(f.params)}) {`, ...body(f.returns), `${IND}}`);
    }
    out.push("};");
    out.push("", "/**", ` * Your ${C} object will be instantiated and called as such:`,
      ` * ${C}* obj = new ${C}(${ctor.map(p => p.name).join(",")});`,
      ...spec.functions.map((f, i) => {
        const call = `obj->${f.name}(${f.params.map(p => p.name).join(",")});`;
        return f.returns === "void" ? ` * ${call}` : ` * ${cppType(f.returns)} param_${i + 1} = ${call}`;
      }),
      " */");
  } else {
    spec.functions.forEach((f, i) => {
      if (i > 0) out.push("");
      // LC 141 / 160 (the old-definition list problems) also keep LeetCode's
      // old `ListNode *head` spacing in the signature.
      const sig = `${cppType(f.returns)} ${f.name}(${paramList(f.params)})`;
      out.push(`${IND}${n.oldList ? sig.replace(/ListNode\* /g, "ListNode *") : sig} {`, ...body(f.returns), `${IND}}`);
    });
    out.push("};");
  }
  return out.join("\n") + "\n";
}

// ---- driver -------------------------------------------------------------

const READERS = {
  "int": "(int)__dv::rl()", "long": "__dv::rl()", "double": "__dv::rd()", "boolean": "(__dv::rl() != 0)",
  "char": "(char)__dv::rl()", "String": "__dv::rs()",
  "int[]": "__dv::ri1()", "List<Integer>": "__dv::ri1()", "ArrayList<Integer>": "__dv::ri1()", "long[]": "__dv::rl1()",
  "int[][]": "__dv::ri2()", "List<List<Integer>>": "__dv::ri2()", "ArrayList<ArrayList<Integer>>": "__dv::ri2()",
  "String[]": "__dv::rs1()", "List<String>": "__dv::rs1()", "List<List<String>>": "__dv::rs2()",
  "char[]": "__dv::rc1()", "char[][]": "__dv::rc2()",
  "ListNode": "__dv::rlist()", "ListNode[]": "__dv::rlists()", "TreeNode": "__dv::rtree()", "Node": "__dv::rgraph()",
};

function reader(type) {
  const r = READERS[type];
  if (!r) throw new Error(`devert100 harness (cpp): no reader for ${type}`);
  return r;
}

// LeetCode's own definitions, one per line (the `#line` directives keep the
// learner's line numbers exact regardless).
const STRUCTS = {
  list: "struct ListNode { int val; ListNode *next; ListNode() : val(0), next(nullptr) {} ListNode(int x) : val(x), next(nullptr) {} ListNode(int x, ListNode *next) : val(x), next(next) {} };",
  tree: "struct TreeNode { int val; TreeNode *left; TreeNode *right; TreeNode() : val(0), left(nullptr), right(nullptr) {} TreeNode(int x) : val(x), left(nullptr), right(nullptr) {} TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {} };",
  graph: "class Node { public: int val; vector<Node*> neighbors; Node() { val = 0; neighbors = vector<Node*>(); } Node(int _val) { val = _val; neighbors = vector<Node*>(); } Node(int _val, vector<Node*> _neighbors) { val = _val; neighbors = _neighbors; } };",
};

const RT_BASE = `
namespace __dv {
static string __in; static size_t __p = 0;
static void load() { char buf[65536]; size_t k; while ((k = fread(buf, 1, sizeof buf, stdin)) > 0) __in.append(buf, k); }
static string tok() {
    while (__p < __in.size() && isspace((unsigned char)__in[__p])) __p++;
    size_t s = __p; while (__p < __in.size() && !isspace((unsigned char)__in[__p])) __p++;
    return __in.substr(s, __p - s);
}
static long long rl() { return strtoll(tok().c_str(), nullptr, 10); }
static double rd() { return strtod(tok().c_str(), nullptr); }
static string rs() {
    int n = (int)rl(); string s;
    for (int i = 0; i < n; i++) {
        unsigned u = (unsigned)rl();
        if (u < 0x80) s += (char)u;
        else if (u < 0x800) { s += (char)(0xC0 | (u >> 6)); s += (char)(0x80 | (u & 0x3F)); }
        else { s += (char)(0xE0 | (u >> 12)); s += (char)(0x80 | ((u >> 6) & 0x3F)); s += (char)(0x80 | (u & 0x3F)); }
    }
    return s;
}
static vector<int> ri1() { int n = (int)rl(); vector<int> a(n); for (int i = 0; i < n; i++) a[i] = (int)rl(); return a; }
static vector<long long> rl1() { int n = (int)rl(); vector<long long> a(n); for (int i = 0; i < n; i++) a[i] = rl(); return a; }
static vector<vector<int>> ri2() { int r = (int)rl(); vector<vector<int>> a; for (int i = 0; i < r; i++) a.push_back(ri1()); return a; }
static vector<string> rs1() { int n = (int)rl(); vector<string> a; for (int i = 0; i < n; i++) a.push_back(rs()); return a; }
static vector<vector<string>> rs2() { int r = (int)rl(); vector<vector<string>> a; for (int i = 0; i < r; i++) a.push_back(rs1()); return a; }
static vector<char> rc1() { int n = (int)rl(); vector<char> a(n); for (int i = 0; i < n; i++) a[i] = (char)rl(); return a; }
static vector<vector<char>> rc2() { int r = (int)rl(); vector<vector<char>> a; for (int i = 0; i < r; i++) a.push_back(rc1()); return a; }

static string q(const string& s) {
    string b = "\\"";
    for (unsigned char c : s) {
        if (c == '"' || c == '\\\\') { b += '\\\\'; b += (char)c; }
        else if (c < 0x20) { char e[8]; snprintf(e, sizeof e, "\\\\u%04x", c); b += e; }
        else b += (char)c;
    }
    return b + "\\"";
}
static string j(int v) { return to_string(v); }
static string j(long v) { return to_string(v); }
static string j(long long v) { return to_string(v); }
static string j(unsigned v) { return to_string(v); }
static string j(unsigned long v) { return to_string(v); }
static string j(unsigned long long v) { return to_string(v); }
static string j(short v) { return to_string(v); }
static string j(double v) { char b[64]; snprintf(b, sizeof b, "%.5f", v); return b; }
static string j(float v) { return j((double)v); }
static string j(bool v) { return v ? "true" : "false"; }
static string j(char c) { return q(string(1, c)); }
static string j(const string& s) { return q(s); }
static string j(const char* s) { return s ? q(s) : "null"; }
`;

const RT_LIST = `
static ListNode* fromArr(const vector<int>& v) { ListNode d(0); ListNode* t = &d; for (int x : v) { t->next = new ListNode(x); t = t->next; } return d.next; }
static ListNode* rlist() { vector<int> v = ri1(); return fromArr(v); }
static vector<ListNode*> rlists() { int k = (int)rl(); vector<ListNode*> a; for (int i = 0; i < k; i++) a.push_back(rlist()); return a; }
static ListNode* cycle(const vector<int>& v, int pos) {
    ListNode* head = fromArr(v); if (pos < 0 || head == nullptr) return head;
    ListNode* tail = head; ListNode* at = nullptr; int i = 0;
    for (ListNode* c = head; c != nullptr; c = c->next, i++) { if (i == pos) at = c; tail = c; }
    tail->next = at; return head;
}
static pair<ListNode*, ListNode*> intersection(const vector<int>& a, const vector<int>& b, int skipA, int skipB) {
    ListNode* ha = fromArr(a);
    ListNode* shared = ha; for (int i = 0; i < skipA && shared != nullptr; i++) shared = shared->next;
    ListNode d(0); ListNode* t = &d;
    for (int i = 0; i < skipB; i++) { t->next = new ListNode(b[i]); t = t->next; }
    t->next = shared;
    return { ha, d.next };
}
static string j(ListNode* o) {
    if (o == nullptr) return "null";
    string b = "["; int i = 0;
    for (ListNode* c = o; c != nullptr; c = c->next) { if (i > 10000) return q("CYCLE_IN_RETURNED_LIST"); if (i++ > 0) b += ','; b += to_string(c->val); }
    return b + "]";
}
static string nodeVal(ListNode* o) { return o == nullptr ? "null" : to_string(o->val); }
`;

const RT_TREE = `
static TreeNode* rtree() {
    int n = (int)rl(); vector<int> v(n); vector<bool> has(n);
    for (int i = 0; i < n; i++) { has[i] = rl() != 0; if (has[i]) v[i] = (int)rl(); }
    if (n == 0 || !has[0]) return nullptr;
    TreeNode* root = new TreeNode(v[0]); deque<TreeNode*> qu; qu.push_back(root); int i = 1;
    while (!qu.empty() && i < n) {
        TreeNode* cur = qu.front(); qu.pop_front();
        if (i < n && has[i]) { cur->left = new TreeNode(v[i]); qu.push_back(cur->left); } i++;
        if (i < n && has[i]) { cur->right = new TreeNode(v[i]); qu.push_back(cur->right); } i++;
    }
    return root;
}
static TreeNode* ref(TreeNode* root, int val) {
    if (root == nullptr) return nullptr; if (root->val == val) return root;
    TreeNode* l = ref(root->left, val); return l != nullptr ? l : ref(root->right, val);
}
static string j(TreeNode* o) {
    if (o == nullptr) return "null";
    vector<string> out; vector<TreeNode*> lvl{ o };
    while (!lvl.empty()) {
        vector<TreeNode*> nx;
        for (TreeNode* t : lvl) { if (t == nullptr) { out.push_back("null"); continue; } out.push_back(to_string(t->val)); nx.push_back(t->left); nx.push_back(t->right); }
        lvl = nx;
    }
    size_t end = out.size(); while (end > 0 && out[end - 1] == "null") end--;
    string b = "["; for (size_t i = 0; i < end; i++) { if (i > 0) b += ','; b += out[i]; }
    return b + "]";
}
static string nodeVal(TreeNode* o) { return o == nullptr ? "null" : to_string(o->val); }
`;

const RT_GRAPH = `
static vector<Node*> __graphIn;
static Node* rgraph() {
    vector<vector<int>> adj = ri2(); int n = (int)adj.size(); if (n == 0) return nullptr;
    vector<Node*> nodes(n + 1, nullptr);
    for (int i = 1; i <= n; i++) { nodes[i] = new Node(i); __graphIn.push_back(nodes[i]); }
    for (int i = 1; i <= n; i++) for (int x : adj[i - 1]) nodes[i]->neighbors.push_back(nodes[x]);
    return nodes[1];
}
static string j(Node* start) {
    if (start == nullptr) return "null";
    unordered_map<int, Node*> seen; deque<Node*> qu;
    unordered_set<Node*> orig(__graphIn.begin(), __graphIn.end());
    qu.push_back(start); seen[start->val] = start;
    while (!qu.empty()) {
        Node* c = qu.front(); qu.pop_front();
        if (orig.count(c)) return q("NOT_A_DEEP_COPY");
        for (Node* x : c->neighbors) if (!seen.count(x->val)) { seen[x->val] = x; qu.push_back(x); }
    }
    string b = "[";
    for (int v = 1; v <= (int)seen.size(); v++) {
        if (v > 1) b += ','; b += '[';
        auto it = seen.find(v);
        if (it != seen.end()) { int i = 0; for (Node* x : it->second->neighbors) { if (i++ > 0) b += ','; b += to_string(x->val); } }
        b += ']';
    }
    return b + "]";
}
`;

const RT_TAIL = `
template <class T> static string j(const vector<T>& v) {
    string b = "[";
    for (size_t i = 0; i < v.size(); i++) { if (i > 0) b += ','; b += j((T)v[i]); }
    return b + "]";
}
template <class T> static vector<T> prefix(const vector<T>& v, long long k) {
    long long m = max(0LL, min(k, (long long)v.size()));
    return vector<T>(v.begin(), v.begin() + m);
}
static void emit(int i, const string& json) {
    fflush(stdout);
    cout << "\\n${MARKER} " << i << " " << json << "\\n" << flush;
}
static void start(int i) {
    fflush(stdout);
    cout << "\\n${MARKER} S " << i << "\\n" << flush;
    fflush(stdout);
}
// "std::__1::out_of_range" (libc++) / "std::__cxx11::..." (libstdc++) -> "std::out_of_range"
static string tn(const char* raw) {
    if (raw == nullptr) return "unknown exception";
    int st = 0; char* d = abi::__cxa_demangle(raw, nullptr, nullptr, &st);
    string s = (st == 0 && d != nullptr) ? string(d) : string(raw); free(d);
    for (const char* ns : { "__1::", "__cxx11::" }) { size_t k; while ((k = s.find(ns)) != string::npos) s.erase(k, strlen(ns)); }
    return s;
}
// Call ONLY inside a catch (...): names whatever exception is in flight.
static void caught(string& t, string& m) {
    try { throw; }
    catch (const std::exception& e) { t = tn(typeid(e).name()); m = e.what(); }
    catch (const char* s) { t = "const char*"; m = s ? s : ""; }
    catch (const string& s) { t = "std::string"; m = s; }
    catch (...) { const std::type_info* ti = abi::__cxa_current_exception_type(); t = ti ? tn(ti->name()) : "unknown exception"; m = ""; }
}
static void re(int i, const string& t, const string& m) {
    fflush(stdout);
    cout << "\\n${MARKER} RE " << i << " {\\"type\\":" << q(t) << ",\\"message\\":" << q(m) << ",\\"line\\":null,\\"trace\\":\\"\\"}\\n" << flush;
}
} // namespace __dv
`;

// Turn one function's params into C++ statements that read inputs and build
// arguments. Inputs are read in `inputs` order (the wire order); args that
// need a builder are constructed after every input is in hand.
function functionCase(spec, f, fi) {
  const lines = [];
  const inputs = inputsOf(spec);
  for (const inp of inputs) lines.push(`${cppType(inp.type)} in_${inp.name} = ${reader(inp.type)};`);
  const built = new Set();
  let haveAB = false;
  const buildArg = (p) => {
    if (built.has(p.name)) return;
    const t = cppType(p.type);
    const b = p.build;
    if (!b) {
      lines.push(`${t} a_${p.name} = in_${p.name};`);
    } else if (b.from) {
      lines.push(`${t} a_${p.name} = in_${b.from};`);
    } else if (b.cycle) {
      lines.push(`ListNode* a_${p.name} = __dv::cycle(in_${b.cycle.values}, (int)in_${b.cycle.pos});`);
    } else if (b.intersection) {
      const x = b.intersection;
      if (!haveAB) {
        lines.push(`pair<ListNode*, ListNode*> __ab = __dv::intersection(in_${x.listA}, in_${x.listB}, (int)in_${x.skipA}, (int)in_${x.skipB});`);
        haveAB = true;
      }
      lines.push(`ListNode* a_${p.name} = __ab.${x.side === "B" ? "second" : "first"};`);
    } else if (b.ref) {
      buildArg(f.params.find(q => q.name === b.ref.tree));
      lines.push(`TreeNode* a_${p.name} = __dv::ref(a_${b.ref.tree}, (int)in_${b.ref.value});`);
    } else {
      throw new Error(`devert100 harness (cpp): unknown builder on ${p.name}`);
    }
    built.add(p.name);
  };
  f.params.forEach(buildArg);
  lines.push(`${spec.className}* __sol = new ${spec.className}();`);
  const call = `__sol->${f.name}(${f.params.map(p => `a_${p.name}`).join(", ")})`;
  const out = spec.output || { mode: "return" };
  switch (out.mode) {
    case "return":
      if (f.returns === "void") throw new Error("devert100 harness: void function needs output.mode = param");
      lines.push(`auto __r = ${call};`, `__dv::emit(__case, __dv::j(__r));`); break;
    case "param":
      lines.push(`${call};`, `__dv::emit(__case, __dv::j(a_${out.name}));`); break;
    case "returnAndParamPrefix":
      lines.push(`long long __k = ${call};`, `__dv::emit(__case, "[" + to_string(__k) + "," + __dv::j(__dv::prefix(a_${out.name}, __k)) + "]");`); break;
    case "nodeVal":
      lines.push(`auto __r = ${call};`, `__dv::emit(__case, __dv::nodeVal(__r));`); break;
    case "graphCopy":
      lines.push(`Node* __r = ${call};`, `__dv::emit(__case, __r == nullptr ? string("[]") : __dv::j(__r));`, `__dv::__graphIn.clear();`); break;
    default:
      throw new Error(`devert100 harness: unknown output mode ${out.mode}`);
  }
  // Reads never throw, so by the time the learner's code can throw, this case's
  // stdin is fully consumed and the next case starts in sync.
  const onThrow = `string __t, __m; __dv::caught(__t, __m); __dv::re(__case, __t, __m);${out.mode === "graphCopy" ? " __dv::__graphIn.clear();" : ""}`;
  return [
    `case ${fi}: {`,
    `${IND}try {`,
    ...lines.map(l => `${IND}${IND}${l}`),
    `${IND}} catch (...) { ${onThrow} }`,
    `${IND}break;`,
    `}`,
  ];
}

function designCase(spec) {
  const C = spec.className;
  const lines = [];
  const ctor = spec.constructor?.params || [];
  ctor.forEach((p, i) => lines.push(`${cppType(p.type)} c${i} = ${reader(p.type)};`));
  // After a throw (constructor or any op) the remaining ops are still READ, so
  // the next case starts in sync, but no longer called.
  const onThrow = `catch (...) { __dv::caught(__et, __em); __dead = true; }`;
  lines.push(`bool __dead = false; string __et, __em;`);
  lines.push(`${C}* obj = nullptr;`);
  lines.push(`try { obj = new ${C}(${ctor.map((_, i) => `c${i}`).join(", ")}); } ${onThrow}`);
  lines.push(`string sb = "[null";`);
  lines.push(`for (int __k = 1; __k < __ops; __k++) {`);
  lines.push(`${IND}int __m = (int)__dv::rl();`);
  lines.push(`${IND}switch (__m) {`);
  spec.functions.forEach((f, mi) => {
    const reads = f.params.map((p, i) => `${cppType(p.type)} p${i} = ${reader(p.type)};`);
    const call = `obj->${f.name}(${f.params.map((_, i) => `p${i}`).join(", ")})`;
    const act = f.returns === "void" ? [`${call};`, `sb += ",null";`] : [`sb += ',';`, `sb += __dv::j(${call});`];
    lines.push(`${IND}${IND}case ${mi + 1}: { ${reads.join(" ")}${reads.length ? " " : ""}if (!__dead) try { ${act.join(" ")} } ${onThrow} break; }`);
  });
  lines.push(`${IND}${IND}default: fprintf(stderr, "bad op %d\\n", __m); return 1;`);
  lines.push(`${IND}}`, `}`, `sb += ']';`);
  lines.push(`if (__dead) __dv::re(__case, __et, __em); else __dv::emit(__case, sb);`);
  return lines;
}

export function program(spec, userCode) {
  const n = needs(spec);
  const line2 = ["using namespace std;"];
  if (n.list) line2.push(STRUCTS.list);
  if (n.tree) line2.push(STRUCTS.tree);
  if (n.graph) line2.push(STRUCTS.graph);
  const body = String(userCode || "").replace(/\r/g, "");

  let rt = RT_BASE;
  if (n.list) rt += RT_LIST;
  if (n.tree) rt += RT_TREE;
  if (n.graph) rt += RT_GRAPH;
  rt += RT_TAIL;

  const main = [];
  main.push("int main() {");
  main.push(`${IND}__dv::load();`);
  main.push(`${IND}int __T = (int)__dv::rl();`);
  main.push(`${IND}for (int __case = 0; __case < __T; __case++) {`);
  main.push(`${IND}${IND}__dv::start(__case);`);
  if (spec.kind === "design") {
    main.push(`${IND}${IND}int __ops = (int)__dv::rl();`);
    designCase(spec).forEach(l => main.push(`${IND}${IND}${l}`));
  } else {
    main.push(`${IND}${IND}int __fn = (int)__dv::rl();`);
    main.push(`${IND}${IND}switch (__fn) {`);
    spec.functions.forEach((f, fi) => functionCase(spec, f, fi).forEach(l => main.push(`${IND}${IND}${IND}${l}`)));
    main.push(`${IND}${IND}}`);
  }
  main.push(`${IND}}`, `${IND}return 0;`, "}");

  return [
    "#include <bits/stdc++.h>",
    "#include <cxxabi.h>",
    line2.join("\n"),
    `#line 1 "solution.cpp"`,
    body,
    `#line 1 "driver.cpp"`,
    // Production compiles with warnings on; the driver's helpers are generic and
    // most go unused on any one problem. Keep the learner's own warnings, drop
    // the driver's - they are noise the learner cannot act on.
    "#pragma GCC diagnostic ignored \"-Wunused-function\"",
    "#pragma GCC diagnostic ignored \"-Wunused-variable\"",
    "#pragma GCC diagnostic ignored \"-Wunused-but-set-variable\"",
    rt,
    main.join("\n"),
  ].join("\n") + "\n";
}
