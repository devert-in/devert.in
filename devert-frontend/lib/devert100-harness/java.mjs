// DeVert 100 harness - Java. See spec.mjs for the spec shape and the
// stdin/stdout protocol every language implements.
//
// Program layout: the runner compiles a small bootstrap `public class Main`
// that compiles the real program (learner code + ListNode / TreeNode / Node +
// the driver class DvMain) in memory with javax.tools, reports compile errors
// as a CE marker in the learner's line numbers, and otherwise runs DvMain on a
// big-stack thread. DvMain catches every throw per case and reports it as an
// RE marker. See BOOT / program() below for the exact layout.

import { category, inputsOf, MARKER } from "./spec.mjs";

const IND = "    ";

// ---- stub ---------------------------------------------------------------

const DEF_COMMENTS = {
  ListNode: [
    "/**",
    " * Definition for singly-linked list.",
    " * public class ListNode {",
    " *     int val;",
    " *     ListNode next;",
    " *     ListNode() {}",
    " *     ListNode(int val) { this.val = val; }",
    " *     ListNode(int val, ListNode next) { this.val = val; this.next = next; }",
    " * }",
    " */",
  ],
  TreeNode: [
    "/**",
    " * Definition for a binary tree node.",
    " * public class TreeNode {",
    " *     int val;",
    " *     TreeNode left;",
    " *     TreeNode right;",
    " *     TreeNode() {}",
    " *     TreeNode(int val) { this.val = val; }",
    " *     TreeNode(int val, TreeNode left, TreeNode right) {",
    " *         this.val = val;",
    " *         this.left = left;",
    " *         this.right = right;",
    " *     }",
    " * }",
    " */",
  ],
  Node: [
    "/*",
    "// Definition for a Node.",
    "class Node {",
    "    public int val;",
    "    public List<Node> neighbors;",
    "    public Node() {",
    "        val = 0;",
    "        neighbors = new ArrayList<Node>();",
    "    }",
    "    public Node(int _val) {",
    "        val = _val;",
    "        neighbors = new ArrayList<Node>();",
    "    }",
    "    public Node(int _val, ArrayList<Node> _neighbors) {",
    "        val = _val;",
    "        neighbors = _neighbors;",
    "    }",
    "}",
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
  return { list: cats.has("list") || cats.has("lists"), tree: cats.has("tree"), graph: cats.has("graph") };
}

function defaultReturn(type) {
  switch (type) {
    case "void": return null;
    case "int": return "0";
    case "long": return "0L";
    case "double": return "0.0";
    case "boolean": return "false";
    case "char": return "'a'";
    case "String": return "\"\"";
    default: return "null";
  }
}

function paramList(params) {
  return params.map(p => `${p.type} ${p.name}`).join(", ");
}

// opts.defaultReturn: fill every body with a type-correct return so the stub
// compiles on its own - used only by the build-time verifier.
export function stub(spec, opts = {}) {
  const n = needs(spec);
  const out = [];
  if (n.list) out.push(...DEF_COMMENTS.ListNode);
  if (n.tree) out.push(...DEF_COMMENTS.TreeNode);
  if (n.graph) out.push(...DEF_COMMENTS.Node, "");
  const body = (ret) => {
    const r = opts.defaultReturn ? defaultReturn(ret) : null;
    return r === null ? [`${IND}${IND}`] : [`${IND}${IND}return ${r};`];
  };
  out.push(`class ${spec.className} {`);
  if (spec.kind === "design") {
    out.push("", `${IND}public ${spec.className}(${paramList(spec.constructor?.params || [])}) {`, `${IND}${IND}`, `${IND}}`);
    for (const f of spec.functions) {
      out.push(`${IND}`, `${IND}public ${f.returns} ${f.name}(${paramList(f.params)}) {`, ...body(f.returns), `${IND}}`);
    }
    out.push("}");
    out.push("", "/**", ` * Your ${spec.className} object will be instantiated and called as such:`,
      ` * ${spec.className} obj = new ${spec.className}(${(spec.constructor?.params || []).map(p => p.name).join(",")});`,
      ...spec.functions.map(f => f.returns === "void"
        ? ` * obj.${f.name}(${f.params.map(p => p.name).join(",")});`
        : ` * ${f.returns} param_${f.name} = obj.${f.name}(${f.params.map(p => p.name).join(",")});`),
      " */");
  } else {
    spec.functions.forEach((f, i) => {
      if (i > 0) out.push("");
      out.push(`${IND}public ${f.returns} ${f.name}(${paramList(f.params)}) {`, ...body(f.returns), `${IND}}`);
    });
    out.push("}");
  }
  return out.join("\n") + "\n";
}

// ---- driver -------------------------------------------------------------

const READERS = {
  "int": "ni()", "long": "nl()", "double": "nd()", "boolean": "(ni() != 0)", "char": "(char) ni()",
  "String": "ns()", "int[]": "ni1()", "long[]": "nl1()", "List<Integer>": "nlI()", "ArrayList<Integer>": "nlI()",
  "int[][]": "ni2()", "List<List<Integer>>": "nlI2()", "ArrayList<ArrayList<Integer>>": "nalI2()",
  "String[]": "ns1()", "List<String>": "nlS()", "List<List<String>>": "nlS2()",
  "char[]": "nc1()", "char[][]": "nc2()", "ListNode": "nlist()", "ListNode[]": "nlists()",
  "TreeNode": "ntree()", "Node": "ngraph()",
};

function reader(type) {
  const r = READERS[type];
  if (!r) throw new Error(`devert100 harness (java): no reader for ${type}`);
  return r;
}

const SUPPORT = `
class ListNode {
    int val;
    ListNode next;
    ListNode() {}
    ListNode(int val) { this.val = val; }
    ListNode(int val, ListNode next) { this.val = val; this.next = next; }
}

class TreeNode {
    int val;
    TreeNode left;
    TreeNode right;
    TreeNode() {}
    TreeNode(int val) { this.val = val; }
    TreeNode(int val, TreeNode left, TreeNode right) { this.val = val; this.left = left; this.right = right; }
}

class Node {
    public int val;
    public List<Node> neighbors;
    public Node() { val = 0; neighbors = new ArrayList<Node>(); }
    public Node(int _val) { val = _val; neighbors = new ArrayList<Node>(); }
    public Node(int _val, ArrayList<Node> _neighbors) { val = _val; neighbors = _neighbors; }
}
`;

const RUNTIME = `
    static String[] __tok;
    static int __p = 0;
    static String nt() { return __tok[__p++]; }
    static int ni() { return Integer.parseInt(nt()); }
    static long nl() { return Long.parseLong(nt()); }
    static double nd() { return Double.parseDouble(nt()); }
    static String ns() { int n = ni(); char[] c = new char[n]; for (int i = 0; i < n; i++) c[i] = (char) ni(); return new String(c); }
    static int[] ni1() { int n = ni(); int[] a = new int[n]; for (int i = 0; i < n; i++) a[i] = ni(); return a; }
    static long[] nl1() { int n = ni(); long[] a = new long[n]; for (int i = 0; i < n; i++) a[i] = nl(); return a; }
    static ArrayList<Integer> nlI() { int n = ni(); ArrayList<Integer> a = new ArrayList<>(); for (int i = 0; i < n; i++) a.add(ni()); return a; }
    static int[][] ni2() { int r = ni(); int[][] a = new int[r][]; for (int i = 0; i < r; i++) a[i] = ni1(); return a; }
    static List<List<Integer>> nlI2() { int r = ni(); List<List<Integer>> a = new ArrayList<>(); for (int i = 0; i < r; i++) a.add(nlI()); return a; }
    static ArrayList<ArrayList<Integer>> nalI2() { int r = ni(); ArrayList<ArrayList<Integer>> a = new ArrayList<>(); for (int i = 0; i < r; i++) a.add(nlI()); return a; }
    static String[] ns1() { int n = ni(); String[] a = new String[n]; for (int i = 0; i < n; i++) a[i] = ns(); return a; }
    static List<String> nlS() { int n = ni(); List<String> a = new ArrayList<>(); for (int i = 0; i < n; i++) a.add(ns()); return a; }
    static List<List<String>> nlS2() { int r = ni(); List<List<String>> a = new ArrayList<>(); for (int i = 0; i < r; i++) a.add(nlS()); return a; }
    static char[] nc1() { int n = ni(); char[] a = new char[n]; for (int i = 0; i < n; i++) a[i] = (char) ni(); return a; }
    static char[][] nc2() { int r = ni(); char[][] a = new char[r][]; for (int i = 0; i < r; i++) a[i] = nc1(); return a; }
    static ListNode fromArr(int[] v) { ListNode d = new ListNode(0), t = d; for (int x : v) { t.next = new ListNode(x); t = t.next; } return d.next; }
    static ListNode nlist() { return fromArr(ni1()); }
    static ListNode[] nlists() { int k = ni(); ListNode[] a = new ListNode[k]; for (int i = 0; i < k; i++) a[i] = nlist(); return a; }
    static TreeNode ntree() {
        int n = ni(); Integer[] v = new Integer[n];
        for (int i = 0; i < n; i++) v[i] = ni() == 0 ? null : ni();
        if (n == 0 || v[0] == null) return null;
        TreeNode root = new TreeNode(v[0]); ArrayDeque<TreeNode> q = new ArrayDeque<>(); q.add(root); int i = 1;
        while (!q.isEmpty() && i < n) {
            TreeNode cur = q.poll();
            if (i < n && v[i] != null) { cur.left = new TreeNode(v[i]); q.add(cur.left); } i++;
            if (i < n && v[i] != null) { cur.right = new TreeNode(v[i]); q.add(cur.right); } i++;
        }
        return root;
    }
    static ArrayList<Node> __graphIn = new ArrayList<>();
    static Node ngraph() {
        int[][] adj = ni2(); int n = adj.length; if (n == 0) return null;
        Node[] nodes = new Node[n + 1];
        for (int i = 1; i <= n; i++) { nodes[i] = new Node(i); __graphIn.add(nodes[i]); }
        for (int i = 1; i <= n; i++) for (int x : adj[i - 1]) nodes[i].neighbors.add(nodes[x]);
        return nodes[1];
    }
    static ListNode cycle(int[] v, int pos) {
        ListNode head = fromArr(v); if (pos < 0 || head == null) return head;
        ListNode tail = head, at = null; int i = 0;
        for (ListNode c = head; c != null; c = c.next, i++) { if (i == pos) at = c; tail = c; }
        tail.next = at; return head;
    }
    static ListNode[] intersection(int[] a, int[] b, int skipA, int skipB) {
        ListNode ha = fromArr(a);
        ListNode shared = ha; for (int i = 0; i < skipA && shared != null; i++) shared = shared.next;
        ListNode d = new ListNode(0), t = d;
        for (int i = 0; i < skipB; i++) { t.next = new ListNode(b[i]); t = t.next; }
        t.next = shared;
        return new ListNode[] { ha, d.next };
    }
    static TreeNode ref(TreeNode root, int val) {
        if (root == null) return null; if (root.val == val) return root;
        TreeNode l = ref(root.left, val); return l != null ? l : ref(root.right, val);
    }

    static String q(String s) {
        StringBuilder b = new StringBuilder("\\"");
        for (char c : s.toCharArray()) {
            if (c == '"' || c == '\\\\') b.append('\\\\').append(c);
            else if (c < 0x20) b.append(String.format("\\\\u%04x", (int) c));
            else b.append(c);
        }
        return b.append('"').toString();
    }
    static String j(Object o) {
        if (o == null) return "null";
        if (o instanceof Double) return String.format(Locale.ROOT, "%.5f", (Double) o);
        if (o instanceof Float) return String.format(Locale.ROOT, "%.5f", (Float) o);
        if (o instanceof Integer || o instanceof Long || o instanceof Short) return o.toString();
        if (o instanceof Boolean) return o.toString();
        if (o instanceof Character) return q(o.toString());
        if (o instanceof String) return q((String) o);
        StringBuilder b = new StringBuilder("[");
        if (o instanceof int[]) { int[] a = (int[]) o; for (int i = 0; i < a.length; i++) { if (i > 0) b.append(','); b.append(a[i]); } }
        else if (o instanceof long[]) { long[] a = (long[]) o; for (int i = 0; i < a.length; i++) { if (i > 0) b.append(','); b.append(a[i]); } }
        else if (o instanceof double[]) { double[] a = (double[]) o; for (int i = 0; i < a.length; i++) { if (i > 0) b.append(','); b.append(j(a[i])); } }
        else if (o instanceof boolean[]) { boolean[] a = (boolean[]) o; for (int i = 0; i < a.length; i++) { if (i > 0) b.append(','); b.append(a[i]); } }
        else if (o instanceof char[]) { char[] a = (char[]) o; for (int i = 0; i < a.length; i++) { if (i > 0) b.append(','); b.append(q(String.valueOf(a[i]))); } }
        else if (o instanceof Object[]) { Object[] a = (Object[]) o; for (int i = 0; i < a.length; i++) { if (i > 0) b.append(','); b.append(j(a[i])); } }
        else if (o instanceof Collection) { int i = 0; for (Object x : (Collection<?>) o) { if (i++ > 0) b.append(','); b.append(j(x)); } }
        else if (o instanceof ListNode) {
            int i = 0; for (ListNode c = (ListNode) o; c != null; c = c.next) { if (i > 10000) return q("CYCLE_IN_RETURNED_LIST"); if (i++ > 0) b.append(','); b.append(c.val); }
        }
        else if (o instanceof TreeNode) {
            ArrayList<String> out = new ArrayList<>(); ArrayDeque<TreeNode> qu = new ArrayDeque<>(); ArrayList<TreeNode> lvl = new ArrayList<>();
            lvl.add((TreeNode) o);
            while (!lvl.isEmpty()) {
                ArrayList<TreeNode> nx = new ArrayList<>();
                for (TreeNode t : lvl) { if (t == null) { out.add("null"); continue; } out.add(String.valueOf(t.val)); nx.add(t.left); nx.add(t.right); }
                lvl = nx;
            }
            int end = out.size(); while (end > 0 && out.get(end - 1).equals("null")) end--;
            for (int i = 0; i < end; i++) { if (i > 0) b.append(','); b.append(out.get(i)); }
        }
        else if (o instanceof Node) {
            Node start = (Node) o; HashMap<Integer, Node> seen = new HashMap<>(); ArrayDeque<Node> qu = new ArrayDeque<>();
            Set<Node> orig = Collections.newSetFromMap(new IdentityHashMap<>()); orig.addAll(__graphIn);
            qu.add(start); seen.put(start.val, start);
            while (!qu.isEmpty()) { Node c = qu.poll(); if (orig.contains(c)) return q("NOT_A_DEEP_COPY"); for (Node x : c.neighbors) if (!seen.containsKey(x.val)) { seen.put(x.val, x); qu.add(x); } }
            for (int v = 1; v <= seen.size(); v++) {
                if (v > 1) b.append(','); b.append('['); Node c = seen.get(v);
                if (c != null) { int i = 0; for (Node x : c.neighbors) { if (i++ > 0) b.append(','); b.append(x.val); } }
                b.append(']');
            }
        }
        else return q(String.valueOf(o));
        return b.append(']').toString();
    }
    static Object prefix(Object arr, int k) {
        if (arr instanceof int[]) return Arrays.copyOf((int[]) arr, Math.max(0, Math.min(k, ((int[]) arr).length)));
        if (arr instanceof char[]) return Arrays.copyOf((char[]) arr, Math.max(0, Math.min(k, ((char[]) arr).length)));
        return arr;
    }
    static Object nodeVal(Object o) {
        if (o == null) return null;
        if (o instanceof ListNode) return ((ListNode) o).val;
        if (o instanceof TreeNode) return ((TreeNode) o).val;
        return o;
    }
    static void emit(int i, String json) {
        System.out.print("\\n${MARKER} " + i + " " + json + "\\n");
        System.out.flush();
    }
    static void start(int i) {
        System.out.print("\\n${MARKER} S " + i + "\\n");
        System.out.flush();
    }
    static void re(int i, Throwable t) {
        ArrayList<String> fr = new ArrayList<>(); ArrayList<Integer> cnt = new ArrayList<>(); Integer ln = null;
        for (StackTraceElement f : t.getStackTrace()) {
            int L = f.getLineNumber();
            if (!"Solution.java".equals(f.getFileName()) || L < 2 || L > __N + 1) continue;
            if (ln == null) ln = L - 1;
            String s = "at " + f.getClassName() + "." + f.getMethodName() + " (line " + (L - 1) + ")";
            int z = fr.size() - 1;
            if (z >= 0 && fr.get(z).equals(s)) cnt.set(z, cnt.get(z) + 1); else { fr.add(s); cnt.add(1); }
        }
        StringBuilder r = new StringBuilder();
        for (int k = 0; k < fr.size() && k < 8; k++) { if (k > 0) r.append('\\n'); r.append(fr.get(k)); if (cnt.get(k) > 1) r.append(" (repeated ").append(cnt.get(k)).append(" times)"); }
        if (fr.size() > 8) r.append("\\n... ").append(fr.size() - 8).append(" more");
        String m = t.getMessage();
        System.out.print("\\n${MARKER} RE " + i + " {\\"type\\":" + q(t.getClass().getSimpleName()) + ",\\"message\\":" + q(m == null ? "" : m) + ",\\"line\\":" + ln + ",\\"trace\\":" + q(r.toString()) + "}\\n");
        System.out.flush();
    }
`;

// Turn one function's params into Java statements that read inputs and build
// arguments. Inputs are read in `inputs` order (that is the wire order); args
// that need a builder are constructed after every input is in hand.
function functionCase(spec, f, fi) {
  const reads = [];
  const lines = [];
  const inputs = inputsOf(spec);
  for (const inp of inputs) reads.push(`${inp.type} in_${inp.name} = ${reader(inp.type)};`);
  const argNames = [];
  const built = new Set();
  const buildArg = (p) => {
    if (built.has(p.name)) return;
    const b = p.build;
    if (!b) {
      lines.push(`${p.type} a_${p.name} = in_${p.name};`);
    } else if (b.from) {
      lines.push(`${p.type} a_${p.name} = in_${b.from};`);
    } else if (b.cycle) {
      lines.push(`ListNode a_${p.name} = cycle(in_${b.cycle.values}, in_${b.cycle.pos});`);
    } else if (b.intersection) {
      const x = b.intersection;
      if (!lines.some(l => l.startsWith("ListNode[] __ab"))) {
        lines.push(`ListNode[] __ab = intersection(in_${x.listA}, in_${x.listB}, in_${x.skipA}, in_${x.skipB});`);
      }
      lines.push(`ListNode a_${p.name} = __ab[${x.side === "B" ? 1 : 0}];`);
    } else if (b.ref) {
      const treeParam = f.params.find(q => q.name === b.ref.tree);
      buildArg(treeParam);
      lines.push(`TreeNode a_${p.name} = ref(a_${b.ref.tree}, in_${b.ref.value});`);
    } else {
      throw new Error(`devert100 harness (java): unknown builder on ${p.name}`);
    }
    built.add(p.name);
  };
  f.params.forEach(buildArg);
  f.params.forEach(p => argNames.push(`a_${p.name}`));
  const call = `new ${spec.className}().${f.name}(${argNames.join(", ")})`;
  const out = spec.output || { mode: "return" };
  switch (out.mode) {
    case "return":
      if (f.returns === "void") throw new Error("devert100 harness: void function needs output.mode = param");
      lines.push(`Object __r = ${call};`, `emit(__case, j(__r));`); break;
    case "param":
      lines.push(`${call};`, `emit(__case, j(a_${out.name}));`); break;
    case "returnAndParamPrefix":
      lines.push(`int __k = ${call};`, `emit(__case, "[" + __k + "," + j(prefix(a_${out.name}, __k)) + "]");`); break;
    case "nodeVal":
      lines.push(`Object __r = ${call};`, `emit(__case, j(nodeVal(__r)));`); break;
    case "graphCopy":
      reads.unshift(`__graphIn.clear();`);
      lines.push(`Object __r = ${call};`, `emit(__case, __r == null ? "[]" : j(__r));`); break;
    default:
      throw new Error(`devert100 harness: unknown output mode ${out.mode}`);
  }
  // Every input is read before the try, so a throw in the learner's code
  // leaves the token stream at the next case and the run carries on.
  return [`case ${fi}: {`, ...reads, "try {", ...lines, "} catch (Throwable __t) { re(__case, __t); }", "break;", "}"];
}

function designCase(spec) {
  const C = spec.className;
  const lines = [];
  const ctor = spec.constructor?.params || [];
  ctor.forEach((p, i) => lines.push(`${p.type} c${i} = ${reader(p.type)};`));
  // After a throw the remaining ops are still READ (so the next case starts at
  // the right token) but no longer called.
  lines.push(`Throwable __e = null; ${C} obj = null;`);
  lines.push(`try { obj = new ${C}(${ctor.map((_, i) => `c${i}`).join(", ")}); } catch (Throwable __t) { __e = __t; }`);
  lines.push(`StringBuilder sb = new StringBuilder("[null");`);
  lines.push(`for (int __k = 1; __k < __ops; __k++) {`);
  lines.push(`int __m = ni();`);
  lines.push(`switch (__m) {`);
  spec.functions.forEach((f, mi) => {
    const reads = f.params.map((p, i) => `${p.type} p${i} = ${reader(p.type)};`);
    const call = `obj.${f.name}(${f.params.map((_, i) => `p${i}`).join(", ")})`;
    const act = f.returns === "void" ? [`${call};`, `sb.append(",null");`] : [`sb.append(',').append(j(${call}));`];
    lines.push(`case ${mi + 1}: { ${reads.join(" ")} if (__e == null) try { ${act.join(" ")} } catch (Throwable __t) { __e = __t; } break; }`);
  });
  lines.push(`default: throw new IllegalStateException("bad op " + __m);`);
  lines.push(`}`, `}`, `if (__e != null) re(__case, __e); else { sb.append(']'); emit(__case, sb.toString()); }`);
  return lines;
}

function splitUserCode(code) {
  const imports = [];
  const body = String(code || "").replace(/\r/g, "").split("\n").map((line, i) => {
    if (/^\s*import\s+[\w.*]+\s*;\s*$/.test(line)) { imports.push({ text: line.trim(), line: i + 1 }); return ""; }
    return line.replace(/^(\s*)public\s+(final\s+|abstract\s+)?class\s+/, "$1$2class ");
  });
  return { imports, body: body.join("\n") };
}

// A Java string literal holding `s`. Unicode escapes are processed before
// lexing, so line breaks / quotes / backslashes must use their ordinary escapes
// (a \u000a would end the literal); everything else outside printable ASCII
// becomes a \uXXXX escape so the file is pure ASCII.
function javaString(s) {
  let out = '"';
  for (const ch of s) {
    const c = ch.charCodeAt(0);
    if (ch === "\n") out += "\\n";
    else if (ch === '"') out += '\\"';
    else if (ch === "\\") out += "\\\\";
    else if (c >= 0x20 && c < 0x7f) out += ch;
    else for (let k = 0; k < ch.length; k++) out += "\\u" + ch.charCodeAt(k).toString(16).padStart(4, "0");
  }
  return out + '"';
}

// The program the runner compiles is a tiny bootstrap `Main` that carries the
// real program (Solution.java below) as a string, compiles it in memory with
// javax.tools and runs it. That is the only way the learner sees a compile
// error: the runner reports every failing Java program as one generic
// "Internal error". Solution.java's layout:
//   line 1   every import, on ONE line, so the learner's code starts on line 2
//   ...      the learner's code (their own import lines blanked, `public class`
//            demoted - nothing in it may be public-class-per-file bound)
//   last     ListNode / TreeNode / Node, the reader, the JSON writer and the
//            cases (class DvMain), minified onto ONE line - the learner never
//            sees it, and the backend caps a program at 20,000 chars
// Learner line L is Solution.java line L + 1. A diagnostic on line 1 is mapped
// to the learner's own import line by its column (IMP below).
const BOOT = [
  "import javax.tools.*;import java.util.*;import java.io.*;import java.net.URI;",
  "public class Main{",
  "static String q(String s){StringBuilder b=new StringBuilder(\"\\\"\");for(char c:s.toCharArray()){if(c=='\"'||c=='\\\\')b.append('\\\\').append(c);else if(c<32)b.append(String.format(\"\\\\u%04x\",(int)c));else b.append(c);}return b.append('\"').toString();}",
  "static void out(String s){System.out.print(\"\\n" + MARKER + " CE \"+s+\"\\n\");System.out.flush();}",
  "public static void main(String[] a)throws Exception{",
  "JavaCompiler c=ToolProvider.getSystemJavaCompiler();",
  "if(c==null){out(\"[{\\\"line\\\":null,\\\"col\\\":null,\\\"message\\\":\\\"Java compiler unavailable on the runner\\\"}]\");return;}",
  "DiagnosticCollector<JavaFileObject> d=new DiagnosticCollector<>();Map<String,ByteArrayOutputStream> o=new HashMap<>();",
  "JavaFileManager f=new ForwardingJavaFileManager<JavaFileManager>(c.getStandardFileManager(d,null,null)){public JavaFileObject getJavaFileForOutput(JavaFileManager.Location l,String n,JavaFileObject.Kind k,FileObject s){return new SimpleJavaFileObject(URI.create(\"m:///\"+n.replace('.','/')+k.extension),k){public OutputStream openOutputStream(){ByteArrayOutputStream b=new ByteArrayOutputStream();o.put(n,b);return b;}};}};",
  "JavaFileObject s=new SimpleJavaFileObject(URI.create(\"string:///Solution.java\"),JavaFileObject.Kind.SOURCE){public CharSequence getCharContent(boolean b){return P;}};",
  "if(!c.getTask(null,f,d,List.of(\"-proc:none\",\"-nowarn\",\"-Xlint:none\",\"-g\"),null,List.of(s)).call()){",
  "StringBuilder b=new StringBuilder();int k=0;",
  "for(Diagnostic<? extends JavaFileObject> x:d.getDiagnostics()){if(x.getKind()!=Diagnostic.Kind.ERROR||k>=20)continue;",
  "long L=x.getLineNumber(),C=x.getColumnNumber();String m=x.getMessage(Locale.ENGLISH),ln=\"null\",cn=\"null\";",
  "if(L>=2&&L<=N+1){ln=\"\"+(L-1);cn=\"\"+C;}",
  "else if(L==1){for(int i=0;i<IMP.length;i+=2)if(C>=IMP[i]){ln=\"\"+IMP[i+1];cn=\"\"+(C-IMP[i]+1);}}",
  "if(ln.equals(\"null\"))m+=m.contains(\"duplicate class\")?\" (ListNode, TreeNode and Node are already defined for you - remove your own definition)\":\" (in the hidden test code - check that your class, method names and parameters match the starter code)\";",
  "b.append(k++>0?\",\":\"\").append(\"{\\\"line\\\":\"+ln+\",\\\"col\\\":\"+cn+\",\\\"message\\\":\"+q(m)+\"}\");}",
  "if(k==0)b.append(\"{\\\"line\\\":null,\\\"col\\\":null,\\\"message\\\":\\\"compilation failed\\\"}\");",
  "out(\"[\"+b+\"]\");return;}",
  "ClassLoader l=new ClassLoader(ClassLoader.getPlatformClassLoader()){protected Class<?> findClass(String n)throws ClassNotFoundException{ByteArrayOutputStream b=o.get(n);if(b==null)throw new ClassNotFoundException(n);byte[] y=b.toByteArray();return defineClass(n,y,0,y.length);}};",
  "java.lang.reflect.Method m=l.loadClass(\"DvMain\").getMethod(\"main\",String[].class);m.setAccessible(true);",
  // A 256 MB stack: deep recursion behaves as on LeetCode, and a real
  // StackOverflowError is still caught per case inside DvMain.
  "Throwable[] e={null};Thread t=new Thread(null,()->{try{m.invoke(null,(Object)a);}catch(Throwable x){e[0]=x;}},\"main\",256L<<20);t.start();t.join();",
  "if(e[0]!=null){System.out.println();(e[0].getCause()!=null?e[0].getCause():e[0]).printStackTrace(System.out);}",
  "}}",
];

// RUNTIME split into its top-level members, so a program carries only the
// readers / builders it calls (the backend's 20,000-char cap).
const MEMBERS = RUNTIME.split("\n").reduce((acc, line) => {
  if (/^ {4}static\b/.test(line)) {
    const m = line.match(/^ {4}static\s+[^=(]*?(\w+)\s*\(/) || line.match(/(\w+)\s*[=;]/);
    acc.push({ name: m[1], src: line });
  } else if (acc.length && line.trim()) {
    acc[acc.length - 1].src += "\n" + line;
  }
  return acc;
}, []);

function runtimeFor(driver) {
  const used = new Set();
  let text = driver, grew = true;
  while (grew) {
    grew = false;
    for (const m of MEMBERS) {
      if (!used.has(m.name) && new RegExp(`\\b${m.name}\\b`).test(text)) { used.add(m.name); text += "\n" + m.src; grew = true; }
    }
  }
  return MEMBERS.filter(m => used.has(m.name)).map(m => m.src).join("\n");
}

function minify(src) {
  return src.split("\n").map(l => l.trim()).filter(Boolean).join(" ");
}

export function program(spec, userCode) {
  const { imports, body } = splitUserCode(userCode);
  const fixed = ["import java.util.*;", "import java.util.stream.*;", "import java.io.*;"];
  const imp = [];
  let col = fixed.join(" ").length + 2;
  for (const im of imports) { imp.push(col, im.line); col += im.text.length + 1; }
  const header = [...fixed, ...imports.map(im => im.text)].join(" ");
  const n = body.split("\n").length;
  const main = [];
  main.push("public static void main(String[] args) throws Exception {");
  main.push(`String __all = new String(System.in.readAllBytes()).trim();`);
  main.push(`__tok = __all.isEmpty() ? new String[0] : __all.split("\\\\s+");`);
  main.push(`int __T = ni();`);
  main.push(`for (int __case = 0; __case < __T; __case++) {`, `start(__case);`);
  if (spec.kind === "design") {
    main.push(`int __ops = ni();`, ...designCase(spec));
  } else {
    main.push(`int __fn = ni();`, `switch (__fn) {`);
    spec.functions.forEach((f, fi) => main.push(...functionCase(spec, f, fi)));
    main.push(`}`);
  }
  main.push(`}`, `}`, "}");
  main.unshift("class DvMain {", `static final int __N = ${n};`, runtimeFor(main.join("\n") + "\nre start emit"));
  const inner = [header, body, minify(SUPPORT + "\n" + main.join("\n"))].join("\n");
  return [
    BOOT[0], BOOT[1],
    `static final String P=${javaString(inner)};`,
    `static final int N=${n};static final int[] IMP={${imp.join(",")}};`,
    ...BOOT.slice(2),
  ].join("\n") + "\n";
}
