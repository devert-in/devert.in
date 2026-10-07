// Correctness assertions for day 77 - Min Cost to Connect All Points (LC 1584).
//
// All three published solutions (every-set-of-(n-1)-edges brute force, array
// Prim, Kruskal + DSU) are copied verbatim from day-077.md. They must agree on
// every edge case the writeup lists and on random point sets; the brute-force
// table's counts (sets tried / spanning trees) are re-measured as well.

import java.util.*;

class Day77Test {

    // ---- brute force, verbatim ----
    static class Brute {
        private int[][] edges;          // {i, j, cost}
        private int n;
        private int best;

        public int minCostConnectPoints(int[][] points) {

            n = points.length;
            List<int[]> list = new ArrayList<>();
            for (int i = 0; i < n; i++) {
                for (int j = i + 1; j < n; j++) {
                    int cost = Math.abs(points[i][0] - points[j][0]) + Math.abs(points[i][1] - points[j][1]);
                    list.add(new int[] {i, j, cost});
                }
            }
            edges = list.toArray(new int[0][]);

            best = Integer.MAX_VALUE;
            choose(0, new ArrayList<>(), 0);
            return best;
        }

        // Try every combination of n - 1 edges, starting from index `start`.
        private void choose(int start, List<Integer> picked, int cost) {

            if (picked.size() == n - 1) {
                if (isSpanningTree(picked)) best = Math.min(best, cost);
                return;
            }

            for (int e = start; e < edges.length; e++) {
                picked.add(e);
                choose(e + 1, picked, cost + edges[e][2]);
                picked.remove(picked.size() - 1);
            }
        }

        // n - 1 edges with no cycle connect all n points.
        private boolean isSpanningTree(List<Integer> picked) {

            int[] group = new int[n];
            for (int i = 0; i < n; i++) group[i] = i;

            for (int e : picked) {
                int a = root(group, edges[e][0]);
                int b = root(group, edges[e][1]);
                if (a == b) return false;       // this edge closes a cycle
                group[a] = b;
            }
            return true;
        }

        private int root(int[] group, int x) {
            while (group[x] != x) x = group[x];
            return x;
        }
    }

    // ---- array Prim, verbatim ----
    static class Prim {
        public int minCostConnectPoints(int[][] points) {

            int n = points.length;

            // minDist[v] = cheapest edge from v to any point already in the tree.
            int[] minDist = new int[n];
            Arrays.fill(minDist, Integer.MAX_VALUE);
            boolean[] inTree = new boolean[n];

            minDist[0] = 0;                     // start the tree at point 0, for free
            int total = 0;

            for (int added = 0; added < n; added++) {

                // 1. Pick the outside point that is cheapest to attach.
                int u = -1;
                for (int v = 0; v < n; v++) {
                    if (!inTree[v] && (u == -1 || minDist[v] < minDist[u])) u = v;
                }

                // 2. Attach it.
                inTree[u] = true;
                total += minDist[u];

                // 3. Every outside point gets one new candidate edge: to u.
                for (int v = 0; v < n; v++) {
                    if (inTree[v]) continue;
                    int cost = Math.abs(points[u][0] - points[v][0]) + Math.abs(points[u][1] - points[v][1]);
                    if (cost < minDist[v]) minDist[v] = cost;
                }
            }

            return total;
        }
    }

    // ---- Kruskal, verbatim ----
    static class Kruskal {
        private static class DSU {
            private final int[] parent;
            private final int[] rank;

            DSU(int n) {
                parent = new int[n];
                rank = new int[n];
                for (int i = 0; i < n; i++) parent[i] = i;
            }

            int find(int x) {
                while (parent[x] != x) {
                    parent[x] = parent[parent[x]];   // path halving
                    x = parent[x];
                }
                return x;
            }

            boolean union(int a, int b) {
                int ra = find(a), rb = find(b);
                if (ra == rb) return false;          // already connected
                if (rank[ra] < rank[rb]) { int t = ra; ra = rb; rb = t; }
                parent[rb] = ra;
                if (rank[ra] == rank[rb]) rank[ra]++;
                return true;
            }
        }

        public int minCostConnectPoints(int[][] points) {

            int n = points.length;
            List<int[]> edges = new ArrayList<>();
            for (int i = 0; i < n; i++) {
                for (int j = i + 1; j < n; j++) {
                    int cost = Math.abs(points[i][0] - points[j][0]) + Math.abs(points[i][1] - points[j][1]);
                    edges.add(new int[] {cost, i, j});
                }
            }
            edges.sort((a, b) -> Integer.compare(a[0], b[0]));

            DSU dsu = new DSU(n);
            int total = 0, used = 0;
            for (int[] e : edges) {
                if (used == n - 1) break;            // a spanning tree has exactly n - 1 edges
                if (dsu.union(e[1], e[2])) {
                    total += e[0];
                    used++;
                }
            }
            return total;
        }
    }

    static int failures = 0;

    static void claim(boolean ok, String text) {
        if (!ok) failures++;
        System.out.println((ok ? "  ok   " : "  FAIL ") + text);
    }

    static void check(String label, int[][] pts, int want) {
        int b = new Brute().minCostConnectPoints(pts);
        int p = new Prim().minCostConnectPoints(pts);
        int k = new Kruskal().minCostConnectPoints(pts);
        boolean ok = b == want && p == want && k == want;
        if (!ok) failures++;
        System.out.println((ok ? "  ok   " : "  FAIL ") + label + "  -> prim " + p + ", kruskal " + k + ", brute " + b
            + (ok ? "" : "  expected " + want));
    }

    // Count sets tried and spanning trees among them, for the "where it hurts" table.
    static long sets, trees;
    static void countSets(int n, int[][] e, int start, int[] pick, int depth) {
        if (depth == n - 1) {
            sets++;
            int[] g = new int[n];
            for (int i = 0; i < n; i++) g[i] = i;
            for (int i = 0; i < depth; i++) {
                int a = e[pick[i]][0], b = e[pick[i]][1];
                while (g[a] != a) a = g[a];
                while (g[b] != b) b = g[b];
                if (a == b) return;
                g[a] = b;
            }
            trees++;
            return;
        }
        for (int i = start; i < e.length; i++) { pick[depth] = i; countSets(n, e, i + 1, pick, depth + 1); }
    }

    public static void main(String[] args) {
        System.out.println("day 77 - Min Cost to Connect All Points");

        check("worked example", new int[][] {{0,0},{2,2},{3,10},{5,2}}, 16);
        check("single point", new int[][] {{0,0}}, 0);
        check("two points", new int[][] {{0,0},{1,1}}, 2);
        check("LeetCode example 1", new int[][] {{0,0},{2,2},{3,10},{5,2},{7,0}}, 20);
        check("LeetCode example 2", new int[][] {{3,12},{-2,5},{-4,1}}, 18);
        check("points on a line", new int[][] {{0,0},{1,0},{2,0},{3,0}}, 3);
        check("ties (unit square)", new int[][] {{0,0},{0,1},{1,0},{1,1}}, 3);
        check("duplicate points", new int[][] {{1,1},{1,1},{4,5}}, 7);

        // The three cheapest edges of the worked example cost 14 and form a cycle.
        {
            int[][] e = {{0,1,4},{0,2,13},{0,3,7},{1,2,9},{1,3,3},{2,3,10}};
            Integer[] idx = {0,1,2,3,4,5};
            Arrays.sort(idx, (a, b) -> e[a][2] - e[b][2]);
            int sum = 0;
            int[] g = {0,1,2,3};
            boolean cycle = false;
            for (int i = 0; i < 3; i++) {
                int[] ed = e[idx[i]];
                sum += ed[2];
                int a = ed[0], b = ed[1];
                while (g[a] != a) a = g[a];
                while (g[b] != b) b = g[b];
                if (a == b) cycle = true; else g[a] = b;
            }
            claim(sum == 14 && cycle, "three cheapest edges cost " + sum + " and " + (cycle ? "form a cycle" : "do not form a cycle"));
        }

        // Sets tried / spanning trees.
        long[][] table = { {4, 20, 16}, {6, 3003, 1296}, {8, 1184040, 262144} };
        for (long[] row : table) {
            int n = (int) row[0];
            int[][] e = new int[n * (n - 1) / 2][];
            int c = 0;
            for (int i = 0; i < n; i++) for (int j = i + 1; j < n; j++) e[c++] = new int[] {i, j};
            sets = 0; trees = 0;
            countSets(n, e, 0, new int[n], 0);
            claim(sets == row[1] && trees == row[2], n + " points: " + sets + " sets tried, " + trees + " spanning trees");
        }

        // Randomised: all three on small n, Prim vs Kruskal on larger n.
        Random rnd = new Random(77);
        int agree = 0, total = 500;
        for (int t = 0; t < total; t++) {
            boolean small = t < 250;
            int n = small ? 1 + rnd.nextInt(6) : 1 + rnd.nextInt(80);
            int range = rnd.nextBoolean() ? 5 : 1000000;
            int[][] pts = new int[n][];
            for (int i = 0; i < n; i++) pts[i] = new int[] {rnd.nextInt(2 * range + 1) - range, rnd.nextInt(2 * range + 1) - range};
            int p = new Prim().minCostConnectPoints(pts);
            int k = new Kruskal().minCostConnectPoints(pts);
            int b = small ? new Brute().minCostConnectPoints(pts) : p;
            if (p == k && p == b) agree++;
            else {
                failures++;
                System.out.println("  FAIL random " + Arrays.deepToString(pts) + " prim " + p + " kruskal " + k + " brute " + b);
            }
        }
        System.out.println("  ok   " + agree + "/" + total + " random point sets agree (brute force on n <= 6)");

        System.out.println(failures == 0 ? "  day 77 PASSED" : "  day 77 had " + failures + " FAILURES");
    }
}
