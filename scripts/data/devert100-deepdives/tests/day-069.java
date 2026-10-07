// Correctness assertions for day 69 - Detect Cycle in an Undirected Graph.
//
// All four published solutions (brute force, DFS with parent, BFS with parent
// array, Union-Find) are copied verbatim from day-069.md as static methods and
// must agree with each other, with every edge case the writeup lists, and with
// an independent oracle on random graphs: a simple graph has a cycle exactly
// when E > V - (number of connected components).

import java.util.*;

class Day69Test {

    // ---- brute force (bruteForce section) ----
    static boolean bruteIsCycle(int V, ArrayList<ArrayList<Integer>> adj) {

        for (int u = 0; u < V; u++) {
            for (int v : adj.get(u)) {
                if (v == u) return true;          // a self-loop is a cycle on its own
                if (u < v && reachableWithout(u, v, V, adj)) {
                    return true;
                }
            }
        }
        return false;
    }

    static boolean reachableWithout(int u, int v, int V, ArrayList<ArrayList<Integer>> adj) {

        boolean[] seen = new boolean[V];
        Deque<Integer> queue = new ArrayDeque<>();
        queue.offer(u);
        seen[u] = true;

        while (!queue.isEmpty()) {
            int x = queue.poll();
            for (int y : adj.get(x)) {
                if (x == u && y == v) continue;   // the deleted edge
                if (y == v) return true;          // reached v another way
                if (!seen[y]) {
                    seen[y] = true;
                    queue.offer(y);
                }
            }
        }
        return false;
    }

    // ---- DFS with parent (implementation section) ----
    static boolean isCycle(int V, ArrayList<ArrayList<Integer>> adj) {

        boolean[] visited = new boolean[V];

        for (int start = 0; start < V; start++) {
            if (!visited[start] && dfs(start, -1, adj, visited)) {
                return true;
            }
        }
        return false;
    }

    static boolean dfs(int node, int parent,
                       ArrayList<ArrayList<Integer>> adj, boolean[] visited) {

        visited[node] = true;

        for (int next : adj.get(node)) {
            if (!visited[next]) {
                if (dfs(next, node, adj, visited)) return true;
            } else if (next != parent) {
                return true;        // visited, and not the edge we arrived on
            }
        }
        return false;
    }

    // ---- BFS with parent array ----
    static boolean bfsIsCycle(int V, ArrayList<ArrayList<Integer>> adj) {

        boolean[] visited = new boolean[V];
        int[] parent = new int[V];

        for (int start = 0; start < V; start++) {
            if (visited[start]) continue;

            Deque<Integer> queue = new ArrayDeque<>();
            visited[start] = true;
            parent[start] = -1;
            queue.offer(start);

            while (!queue.isEmpty()) {
                int node = queue.poll();
                for (int next : adj.get(node)) {
                    if (!visited[next]) {
                        visited[next] = true;
                        parent[next] = node;
                        queue.offer(next);
                    } else if (next != parent[node]) {
                        return true;    // reached by two different routes
                    }
                }
            }
        }
        return false;
    }

    // ---- Union-Find ----
    static boolean dsuIsCycle(int V, ArrayList<ArrayList<Integer>> adj) {

        int[] root = new int[V];
        for (int i = 0; i < V; i++) root[i] = i;

        for (int u = 0; u < V; u++) {
            for (int v : adj.get(u)) {
                if (u > v) continue;                // each undirected edge once
                int ru = find(root, u), rv = find(root, v);
                if (ru == rv) return true;          // already connected: this edge closes a loop
                root[ru] = rv;
            }
        }
        return false;
    }

    static int find(int[] root, int x) {
        while (root[x] != x) {
            root[x] = root[root[x]];    // path halving
            x = root[x];
        }
        return x;
    }

    // ---- helpers ----
    static ArrayList<ArrayList<Integer>> build(int V, int[][] edges) {
        ArrayList<ArrayList<Integer>> adj = new ArrayList<>();
        for (int i = 0; i < V; i++) adj.add(new ArrayList<>());
        for (int[] e : edges) {
            adj.get(e[0]).add(e[1]);
            if (e[0] != e[1]) adj.get(e[1]).add(e[0]);
        }
        return adj;
    }

    // Oracle: count components with a tiny DSU, cycle iff E > V - C.
    static boolean oracle(int V, int[][] edges) {
        int[] p = new int[V];
        for (int i = 0; i < V; i++) p[i] = i;
        int comps = V;
        for (int[] e : edges) {
            int a = e[0], b = e[1];
            while (p[a] != a) a = p[a];
            while (p[b] != b) b = p[b];
            if (a != b) { p[a] = b; comps--; }
        }
        return edges.length > V - comps;
    }

    static int failures = 0;

    static void check(String label, int V, int[][] edges, boolean want, boolean includeBrute) {
        ArrayList<ArrayList<Integer>> adj = build(V, edges);
        boolean d = isCycle(V, adj), b = bfsIsCycle(V, adj), u = dsuIsCycle(V, adj);
        boolean br = includeBrute ? bruteIsCycle(V, adj) : want;
        boolean ok = d == want && b == want && u == want && br == want;
        if (!ok) failures++;
        System.out.println((ok ? "  ok   " : "  FAIL ") + label + " -> dfs " + d + ", bfs " + b
            + ", dsu " + u + (includeBrute ? ", brute " + br : "") + (ok ? "" : "  expected " + want));
    }

    public static void main(String[] args) {
        System.out.println("day 69 - Detect Cycle in an Undirected Graph");

        check("example (triangle 1-2-3)", 5, new int[][] { {0,1},{1,2},{1,3},{2,3},{3,4} }, true, true);
        check("example minus 2-3 (tree)", 5, new int[][] { {0,1},{1,2},{1,3},{3,4} }, false, true);
        check("two vertices one edge",    2, new int[][] { {0,1} }, false, true);
        check("triangle",                 3, new int[][] { {0,1},{1,2},{2,0} }, true, true);
        check("square",                   4, new int[][] { {0,1},{1,2},{2,3},{3,0} }, true, true);
        check("cycle in other component", 6, new int[][] { {0,1},{2,3},{3,4},{4,2} }, true, true);
        check("no edges",                 3, new int[][] {}, false, true);
        check("single vertex",            1, new int[][] {}, false, true);
        check("self-loop",                2, new int[][] { {0,1},{1,1} }, true, true);
        check("complete K4",              4, new int[][] { {0,1},{0,2},{0,3},{1,2},{1,3},{2,3} }, true, true);
        // Java notes claim: parallel edges are caught by the optimal versions.
        check("parallel edges (optimal only)", 2, new int[][] { {0,1},{0,1} }, true, false);

        // The brute-force dry run claims edge (0,1) is a bridge and (1,2) is not.
        ArrayList<ArrayList<Integer>> ex = build(5, new int[][] { {0,1},{1,2},{1,3},{2,3},{3,4} });
        boolean c1 = reachableWithout(0, 1, 5, ex), c2 = reachableWithout(1, 2, 5, ex);
        boolean dryOk = !c1 && c2;
        if (!dryOk) failures++;
        System.out.println((dryOk ? "  ok   " : "  FAIL ") + "dry run: check 1 (0-1) " + c1 + ", check 2 (1-2) " + c2);

        Random rnd = new Random(69);
        int agree = 0, withCycle = 0;
        for (int t = 0; t < 600; t++) {
            int V = 1 + rnd.nextInt(10);
            Set<Long> used = new HashSet<>();
            List<int[]> list = new ArrayList<>();
            int tries = rnd.nextInt(V + 3);
            for (int k = 0; k < tries; k++) {
                int a = rnd.nextInt(V), b = rnd.nextInt(V);
                if (a == b) continue;
                long key = (long) Math.min(a, b) * 100 + Math.max(a, b);
                if (used.add(key)) list.add(new int[] { a, b });
            }
            int[][] edges = list.toArray(new int[0][]);
            boolean want = oracle(V, edges);
            if (want) withCycle++;
            ArrayList<ArrayList<Integer>> adj = build(V, edges);
            boolean d = isCycle(V, adj), b = bfsIsCycle(V, adj), u = dsuIsCycle(V, adj), br = bruteIsCycle(V, adj);
            if (d == want && b == want && u == want && br == want) agree++;
            else {
                failures++;
                System.out.println("  FAIL random V=" + V + " edges=" + Arrays.deepToString(edges)
                    + " dfs " + d + " bfs " + b + " dsu " + u + " brute " + br + " expected " + want);
            }
        }
        System.out.println("  ok   " + agree + "/600 random simple graphs (" + withCycle
            + " cyclic), all four versions match the E > V - C oracle");

        System.out.println(failures == 0 ? "  day 69 PASSED" : "  day 69 had " + failures + " FAILURES");
    }
}
