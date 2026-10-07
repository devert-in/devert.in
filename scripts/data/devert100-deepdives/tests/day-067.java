// Correctness assertions for day 67 - Clone Graph.
//
// All three published solutions (three-phase lists brute force, DFS + map,
// BFS + map) are copied verbatim from day-067.md. For each input graph the
// clone must (a) share no node object with the original, (b) have the same
// values and the same neighbour ORDER at every node, and (c) keep sharing -
// one clone per original. Checked on the worked example, every edge case in
// the edge-cases section (including the self-loop), and random connected
// graphs. Also checks the dry run's call count (9) and the field-map leak.

import java.util.*;

class Day67Test {

    // LeetCode's definition - nested so it cannot clash with anything.
    static class Node {
        public int val;
        public List<Node> neighbors;
        public Node() { val = 0; neighbors = new ArrayList<Node>(); }
        public Node(int _val) { val = _val; neighbors = new ArrayList<Node>(); }
        public Node(int _val, ArrayList<Node> _neighbors) { val = _val; neighbors = _neighbors; }
    }

    // ---- brute force: three phases with lists ----
    static Node bruteCloneGraph(Node node) {
        if (node == null) {
            return null;
        }

        // Phase 1: collect every original node, using a list as the seen-set.
        List<Node> originals = new ArrayList<>();
        Deque<Node> stack = new ArrayDeque<>();
        originals.add(node);
        stack.push(node);
        while (!stack.isEmpty()) {
            Node cur = stack.pop();
            for (Node next : cur.neighbors) {
                if (!originals.contains(next)) {   // linear scan
                    originals.add(next);
                    stack.push(next);
                }
            }
        }

        // Phase 2: one clone per original, at the same index.
        List<Node> clones = new ArrayList<>();
        for (Node original : originals) {
            clones.add(new Node(original.val));
        }

        // Phase 3: wire edges, finding each neighbour's index by scanning.
        for (int i = 0; i < originals.size(); i++) {
            for (Node next : originals.get(i).neighbors) {
                int j = originals.indexOf(next);   // linear scan
                clones.get(i).neighbors.add(clones.get(j));
            }
        }
        return clones.get(0);
    }

    // ---- implementation: DFS + map ----
    static Node cloneGraph(Node node) {
        return clone(node, new HashMap<>());
    }

    static Node clone(Node node, Map<Node, Node> cloneOf) {
        if (node == null) {
            return null;
        }
        if (cloneOf.containsKey(node)) {
            return cloneOf.get(node);          // seen before: reuse the same clone
        }
        Node copy = new Node(node.val);
        cloneOf.put(node, copy);               // register BEFORE visiting neighbours
        for (Node next : node.neighbors) {
            copy.neighbors.add(clone(next, cloneOf));
        }
        return copy;
    }

    // ---- follow-up: BFS + map ----
    static Node bfsCloneGraph(Node node) {
        if (node == null) {
            return null;
        }
        Map<Node, Node> cloneOf = new HashMap<>();
        cloneOf.put(node, new Node(node.val));
        Deque<Node> queue = new ArrayDeque<>();
        queue.offer(node);
        while (!queue.isEmpty()) {
            Node cur = queue.poll();
            for (Node next : cur.neighbors) {
                if (!cloneOf.containsKey(next)) {
                    cloneOf.put(next, new Node(next.val));   // clone on discovery
                    queue.offer(next);
                }
                cloneOf.get(cur).neighbors.add(cloneOf.get(next));
            }
        }
        return cloneOf.get(node);
    }

    // ---- helpers ----
    static Node build(int[][] adj) {
        if (adj.length == 0) return null;
        Node[] nodes = new Node[adj.length];
        for (int i = 0; i < adj.length; i++) nodes[i] = new Node(i + 1);
        for (int i = 0; i < adj.length; i++) for (int v : adj[i]) nodes[i].neighbors.add(nodes[v - 1]);
        return nodes[0];
    }

    static Set<Node> reachable(Node start) {
        Set<Node> seen = Collections.newSetFromMap(new IdentityHashMap<>());
        if (start == null) return seen;
        Deque<Node> q = new ArrayDeque<>();
        q.add(start); seen.add(start);
        while (!q.isEmpty()) for (Node n : q.poll().neighbors) if (seen.add(n)) q.add(n);
        return seen;
    }

    // Serialises as adjacency lists keyed by value; also checks one node object per value.
    static String serialise(Node start) {
        if (start == null) return "[]";
        Set<Node> all = reachable(start);
        Map<Integer, Node> byVal = new TreeMap<>();
        for (Node n : all) if (byVal.put(n.val, n) != null) return "DUPLICATE OBJECTS FOR VALUE " + n.val;
        List<List<Integer>> out = new ArrayList<>();
        for (Node n : byVal.values()) {
            List<Integer> row = new ArrayList<>();
            for (Node m : n.neighbors) {
                if (byVal.get(m.val) != m) return "EDGE TO A NON-SHARED COPY";
                row.add(m.val);
            }
            out.add(row);
        }
        return out.toString();
    }

    static int failures = 0;

    static boolean deepCopyOk(Node original, Node copy) {
        if (original == null) return copy == null;
        if (copy == null) return false;
        Set<Node> a = reachable(original), b = reachable(copy);
        for (Node n : b) if (a.contains(n)) return false;
        return serialise(original).equals(serialise(copy)) && a.size() == b.size();
    }

    static void check(String label, int[][] adj) {
        Node g = build(adj);
        String before = serialise(g);
        boolean ok = deepCopyOk(g, bruteCloneGraph(g)) && deepCopyOk(g, cloneGraph(g)) && deepCopyOk(g, bfsCloneGraph(g))
                     && serialise(g).equals(before);   // original untouched
        if (!ok) failures++;
        System.out.println((ok ? "  ok   " : "  FAIL ") + label + "  " + Arrays.deepToString(adj)
            + " -> " + serialise(cloneGraph(g)));
    }

    // Instrumented DFS for the dry-run call count.
    static int calls = 0;
    static Node countedClone(Node node, Map<Node, Node> cloneOf) {
        calls++;
        if (node == null) return null;
        if (cloneOf.containsKey(node)) return cloneOf.get(node);
        Node copy = new Node(node.val);
        cloneOf.put(node, copy);
        for (Node next : node.neighbors) copy.neighbors.add(countedClone(next, cloneOf));
        return copy;
    }

    // The field-map variant the implementation notes warn about.
    static class FieldMapSolution {
        private final Map<Node, Node> cloneOf = new HashMap<>();
        Node cloneGraph(Node node) {
            if (node == null) return null;
            if (cloneOf.containsKey(node)) return cloneOf.get(node);
            Node copy = new Node(node.val);
            cloneOf.put(node, copy);
            for (Node next : node.neighbors) copy.neighbors.add(cloneGraph(next));
            return copy;
        }
    }

    public static void main(String[] args) {
        System.out.println("day 67 - Clone Graph");

        check("example square", new int[][] { { 2, 4 }, { 1, 3 }, { 2, 4 }, { 1, 3 } });
        check("empty graph",    new int[][] {});
        check("single node",    new int[][] { {} });
        check("two nodes",      new int[][] { { 2 }, { 1 } });
        check("path",           new int[][] { { 2 }, { 1, 3 }, { 2 } });
        check("triangle",       new int[][] { { 2, 3 }, { 1, 3 }, { 1, 2 } });
        check("self-loop",      new int[][] { { 1 } });

        boolean nullOk = cloneGraph(null) == null && bfsCloneGraph(null) == null && bruteCloneGraph(null) == null;
        if (!nullOk) failures++;
        System.out.println((nullOk ? "  ok   " : "  FAIL ") + "null input -> null, all three");

        // Self-loop resolves to the clone itself.
        Node self = build(new int[][] { { 1 } });
        Node selfCopy = cloneGraph(self);
        boolean selfOk = selfCopy != self && selfCopy.neighbors.get(0) == selfCopy;
        if (!selfOk) failures++;
        System.out.println((selfOk ? "  ok   " : "  FAIL ") + "self-loop: 1'.neighbors = [1'] (the clone itself)");

        // Dry-run call count on the square: 1 + 8 adjacency entries = 9.
        calls = 0;
        countedClone(build(new int[][] { { 2, 4 }, { 1, 3 }, { 2, 4 }, { 1, 3 } }), new HashMap<>());
        boolean callsOk = calls == 9;
        if (!callsOk) failures++;
        System.out.println((callsOk ? "  ok   " : "  FAIL ") + "DFS on the square makes " + calls + " calls");

        // Field map leaks across calls: second call returns the first call's clone.
        FieldMapSolution fs = new FieldMapSolution();
        Node sq = build(new int[][] { { 2, 4 }, { 1, 3 }, { 2, 4 }, { 1, 3 } });
        Node first = fs.cloneGraph(sq), second = fs.cloneGraph(sq);
        Node fresh1 = cloneGraph(sq), fresh2 = cloneGraph(sq);
        boolean leak = first == second && fresh1 != fresh2;
        if (!leak) failures++;
        System.out.println((leak ? "  ok   " : "  FAIL ") + "field-stored map returns the same clone twice; per-call map does not");

        Random rnd = new Random(67);
        int agree = 0;
        for (int t = 0; t < 300; t++) {
            int n = 1 + rnd.nextInt(12);
            List<Set<Integer>> adjSet = new ArrayList<>();
            for (int i = 0; i < n; i++) adjSet.add(new LinkedHashSet<>());
            for (int i = 1; i < n; i++) { int p = rnd.nextInt(i); adjSet.get(i).add(p + 1); adjSet.get(p).add(i + 1); }
            int extra = rnd.nextInt(n * 2 + 1);
            for (int e = 0; e < extra; e++) {
                int a = rnd.nextInt(n), b = rnd.nextInt(n);
                if (a == b) continue;
                adjSet.get(a).add(b + 1); adjSet.get(b).add(a + 1);
            }
            int[][] adj = new int[n][];
            for (int i = 0; i < n; i++) {
                List<Integer> row = new ArrayList<>(adjSet.get(i));
                Collections.shuffle(row, rnd);
                adj[i] = row.stream().mapToInt(Integer::intValue).toArray();
            }
            Node g = build(adj);
            if (deepCopyOk(g, bruteCloneGraph(g)) && deepCopyOk(g, cloneGraph(g)) && deepCopyOk(g, bfsCloneGraph(g))) agree++;
            else { failures++; System.out.println("  FAIL random " + Arrays.deepToString(adj)); }
        }
        System.out.println("  ok   " + agree + "/300 random connected graphs, all three produce a true deep copy");

        System.out.println(failures == 0 ? "  day 67 PASSED" : "  day 67 had " + failures + " FAILURES");
    }
}
