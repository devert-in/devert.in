// Correctness assertions for day 76 - Bellman-Ford / Detect Negative Cycle (GFG),
// plus the Cheapest Flights Within K Stops (LC 787) follow-up.
//
// The published brute force (DFS over simple paths) and Bellman-Ford are copied
// verbatim from day-076.md and must agree with each other and with a
// Floyd-Warshall oracle on random graphs with negative weights. Every edge case
// is asserted with the exact output the writeup claims, and the path-count
// table and the in-place K-stops trap are re-measured.

import java.util.*;

class Day76Test {

    // ---- brute force, verbatim ----
    static class Brute {
        private List<List<int[]>> graph;
        private int[] best;
        private int[] costAt;          // cost of the current path when it stood on each vertex
        private boolean[] onPath;
        private boolean negativeCycle;

        public int[] bellmanFord(int V, int[][] edges, int src) {

            graph = new ArrayList<>();
            for (int i = 0; i < V; i++) graph.add(new ArrayList<>());
            for (int[] e : edges) graph.get(e[0]).add(new int[] {e[1], e[2]});

            best = new int[V];
            Arrays.fill(best, (int) 1e8);
            costAt = new int[V];
            onPath = new boolean[V];
            negativeCycle = false;

            onPath[src] = true;
            dfs(src, 0);

            return negativeCycle ? new int[] {-1} : best;
        }

        private void dfs(int u, int cost) {

            best[u] = Math.min(best[u], cost);
            costAt[u] = cost;

            for (int[] e : graph.get(u)) {
                int v = e[0], w = e[1];

                if (onPath[v]) {                                  // edge closes a cycle
                    if (cost + w - costAt[v] < 0) negativeCycle = true;
                    continue;
                }

                onPath[v] = true;
                dfs(v, cost + w);
                onPath[v] = false;
            }
        }
    }

    // ---- Bellman-Ford, verbatim ----
    static class BF {
        public int[] bellmanFord(int V, int[][] edges, int src) {

            final int INF = (int) 1e8;             // the problem's "unreachable" value
            int[] dist = new int[V];
            Arrays.fill(dist, INF);
            dist[src] = 0;

            // V - 1 rounds: enough for any simple path.
            for (int round = 1; round <= V - 1; round++) {
                boolean changed = false;
                for (int[] e : edges) {
                    int u = e[0], v = e[1], w = e[2];
                    if (dist[u] == INF) continue;  // cannot relax out of an unreached vertex
                    if (dist[u] + w < dist[v]) {
                        dist[v] = dist[u] + w;
                        changed = true;
                    }
                }
                if (!changed) break;               // fixed point reached early
            }

            // One more pass: anything that still relaxes sits on or behind a negative cycle.
            for (int[] e : edges) {
                int u = e[0], v = e[1], w = e[2];
                if (dist[u] != INF && dist[u] + w < dist[v]) return new int[] {-1};
            }

            return dist;
        }
    }

    // ---- LC 787 follow-up, verbatim ----
    static class Flights {
        public int findCheapestPrice(int n, int[][] flights, int src, int dst, int k) {

            final int INF = Integer.MAX_VALUE;
            int[] dist = new int[n];
            Arrays.fill(dist, INF);
            dist[src] = 0;

            for (int round = 0; round <= k; round++) {     // k stops = k + 1 edges
                int[] next = dist.clone();                 // read last round, write this one
                for (int[] f : flights) {
                    int u = f[0], v = f[1], w = f[2];
                    if (dist[u] == INF) continue;
                    if (dist[u] + w < next[v]) next[v] = dist[u] + w;
                }
                dist = next;
            }

            return dist[dst] == INF ? -1 : dist[dst];
        }
    }

    // Oracle: Floyd-Warshall in long; negative cycle reachable from src iff some
    // vertex x reachable from src has d[x][x] < 0.
    static int[] oracle(int V, int[][] edges, int src) {
        long INF = Long.MAX_VALUE / 4;
        long[][] d = new long[V][V];
        for (long[] r : d) Arrays.fill(r, INF);
        for (int i = 0; i < V; i++) d[i][i] = 0;
        for (int[] e : edges) d[e[0]][e[1]] = Math.min(d[e[0]][e[1]], e[2]);
        for (int m = 0; m < V; m++)
            for (int i = 0; i < V; i++)
                for (int j = 0; j < V; j++)
                    if (d[i][m] < INF && d[m][j] < INF && d[i][m] + d[m][j] < d[i][j]) d[i][j] = d[i][m] + d[m][j];
        for (int x = 0; x < V; x++) if (d[src][x] < INF && d[x][x] < 0) return new int[] {-1};
        int[] out = new int[V];
        for (int v = 0; v < V; v++) out[v] = d[src][v] >= INF ? (int) 1e8 : (int) d[src][v];
        return out;
    }

    // Oracle for K stops: exhaustive DFS over walks of at most k+1 edges.
    static long bestWalk;
    static void walk(List<List<int[]>> g, int u, int dst, int edgesLeft, long cost) {
        if (u == dst) bestWalk = Math.min(bestWalk, cost);
        if (edgesLeft == 0) return;
        for (int[] e : g.get(u)) walk(g, e[0], dst, edgesLeft - 1, cost + e[1]);
    }
    static int flightsOracle(int n, int[][] fl, int src, int dst, int k) {
        List<List<int[]>> g = new ArrayList<>();
        for (int i = 0; i < n; i++) g.add(new ArrayList<>());
        for (int[] f : fl) g.get(f[0]).add(new int[] {f[1], f[2]});
        bestWalk = Long.MAX_VALUE;
        walk(g, src, dst, k + 1, 0);
        return bestWalk == Long.MAX_VALUE ? -1 : (int) bestWalk;
    }

    static int failures = 0;

    static void check(String label, int V, int[][] edges, int src, int[] want) {
        int[] a = new Brute().bellmanFord(V, edges, src);
        int[] b = new BF().bellmanFord(V, edges, src);
        boolean ok = Arrays.equals(a, want) && Arrays.equals(b, want);
        if (!ok) failures++;
        System.out.println((ok ? "  ok   " : "  FAIL ") + label + "  -> bellman-ford " + Arrays.toString(b)
            + ", brute " + Arrays.toString(a) + (ok ? "" : "  expected " + Arrays.toString(want)));
    }

    static void claim(boolean ok, String text) {
        if (!ok) failures++;
        System.out.println((ok ? "  ok   " : "  FAIL ") + text);
    }

    static long calls;
    static void countPaths(int V, int u, boolean[] on) {
        calls++;
        for (int v = 0; v < V; v++) {
            if (v == u || on[v]) continue;
            on[v] = true; countPaths(V, v, on); on[v] = false;
        }
    }

    public static void main(String[] args) {
        System.out.println("day 76 - Bellman-Ford / Detect Negative Cycle");

        int U = (int) 1e8;
        check("worked example", 5, new int[][] {{1,3,2},{4,3,-1},{2,4,1},{1,2,1},{0,1,5}}, 0, new int[] {0,5,6,6,7});
        check("reachable negative cycle", 4, new int[][] {{0,1,4},{1,2,-6},{2,3,5},{3,1,-2}}, 0, new int[] {-1});
        check("unreachable vertex", 3, new int[][] {{0,1,2}}, 0, new int[] {0,2,U});
        check("unreachable negative cycle", 4, new int[][] {{0,1,1},{2,3,-5},{3,2,1}}, 0, new int[] {0,1,U,U});
        check("dijkstra-breaker", 3, new int[][] {{0,1,2},{0,2,5},{2,1,-4}}, 0, new int[] {0,1,5});
        check("negative self-loop", 2, new int[][] {{0,1,3},{1,1,-1}}, 0, new int[] {-1});
        check("zero-weight cycle", 3, new int[][] {{0,1,1},{1,2,0},{2,1,0}}, 0, new int[] {0,1,1});
        check("undirected negative edge", 2, new int[][] {{0,1,-1},{1,0,-1}}, 0, new int[] {-1});
        check("single vertex", 1, new int[][] {}, 0, new int[] {0});
        check("reversed edge order", 5, new int[][] {{0,1,5},{1,2,1},{2,4,1},{4,3,-1},{1,3,2}}, 0, new int[] {0,5,6,6,7});

        // Rounds actually used on the worked example (4) vs the reversed order (1 + early exit).
        int[][][] orders = {
            {{1,3,2},{4,3,-1},{2,4,1},{1,2,1},{0,1,5}},
            {{0,1,5},{1,2,1},{2,4,1},{4,3,-1},{1,3,2}} };
        int[] wantChanging = {4, 1};
        for (int o = 0; o < 2; o++) {
            int[] dist = new int[5];
            Arrays.fill(dist, U);
            dist[0] = 0;
            int changingRounds = 0;
            for (int r = 1; r <= 4; r++) {
                boolean ch = false;
                for (int[] e : orders[o]) {
                    if (dist[e[0]] == U) continue;
                    if (dist[e[0]] + e[2] < dist[e[1]]) { dist[e[1]] = dist[e[0]] + e[2]; ch = true; }
                }
                if (!ch) break;
                changingRounds++;
            }
            claim(changingRounds == wantChanging[o], (o == 0 ? "given order" : "reversed order")
                + ": " + changingRounds + " round(s) changed something");
        }

        // Negative-cycle dry run: after 3 rounds dist = [0,-5,-8,-3].
        {
            int[][] ed = {{0,1,4},{1,2,-6},{2,3,5},{3,1,-2}};
            int[] dist = {0, U, U, U};
            for (int r = 1; r <= 3; r++)
                for (int[] e : ed)
                    if (dist[e[0]] != U && dist[e[0]] + e[2] < dist[e[1]]) dist[e[1]] = dist[e[0]] + e[2];
            claim(Arrays.equals(dist, new int[] {0,-5,-8,-3}), "negative-cycle dry run ends at " + Arrays.toString(dist));
        }

        // Path-count table (complete digraph).
        long[][] table = { {5, 65}, {10, 986410} };
        for (long[] row : table) {
            int V = (int) row[0];
            calls = 0;
            boolean[] on = new boolean[V];
            on[0] = true;
            countPaths(V, 0, on);
            claim(calls == row[1], "complete digraph V=" + V + ": " + calls + " simple paths from the source");
        }

        // Randomised: brute vs Bellman-Ford vs Floyd-Warshall, negative weights allowed.
        Random rnd = new Random(76);
        int agree = 0, total = 600, cycles = 0;
        for (int t = 0; t < total; t++) {
            int V = 1 + rnd.nextInt(7);
            int m = rnd.nextInt(V * V + 1);
            int[][] edges = new int[m][];
            int lo = rnd.nextBoolean() ? -3 : -10;
            for (int i = 0; i < m; i++) edges[i] = new int[] {rnd.nextInt(V), rnd.nextInt(V), lo + rnd.nextInt(21)};
            int src = rnd.nextInt(V);
            int[] want = oracle(V, edges, src);
            if (want.length == 1 && want[0] == -1 && V > 1) cycles++;
            int[] a = new Brute().bellmanFord(V, edges, src);
            int[] b = new BF().bellmanFord(V, edges, src);
            if (Arrays.equals(a, want) && Arrays.equals(b, want)) agree++;
            else {
                failures++;
                System.out.println("  FAIL random V=" + V + " src=" + src + " " + Arrays.deepToString(edges)
                    + " brute " + Arrays.toString(a) + " bf " + Arrays.toString(b) + " oracle " + Arrays.toString(want));
            }
        }
        System.out.println("  ok   " + agree + "/" + total + " random graphs agree with Floyd-Warshall ("
            + cycles + " had a reachable negative cycle)");

        // ---- LC 787 follow-up ----
        int[][] ex1 = {{0,1,100},{1,2,100},{2,0,100},{1,3,600},{2,3,200}};
        int[][] ex2 = {{0,1,100},{1,2,100},{0,2,500}};
        int[][] fc = {
            { new Flights().findCheapestPrice(4, ex1, 0, 3, 1), 700 },
            { new Flights().findCheapestPrice(3, ex2, 0, 2, 1), 200 },
            { new Flights().findCheapestPrice(3, ex2, 0, 2, 0), 500 } };
        String[] fl = { "LC 787 example 1 (k=1)", "LC 787 example 2 (k=1)", "LC 787 example 3 (k=0)" };
        for (int i = 0; i < 3; i++) claim(fc[i][0] == fc[i][1], fl[i] + " -> " + fc[i][0]);

        // The in-place trap: k = 0 on ex2 answers 200 without the copy.
        {
            int[] dist = {0, Integer.MAX_VALUE, Integer.MAX_VALUE};
            for (int round = 0; round <= 0; round++)
                for (int[] f : ex2)
                    if (dist[f[0]] != Integer.MAX_VALUE && dist[f[0]] + f[2] < dist[f[1]]) dist[f[1]] = dist[f[0]] + f[2];
            claim(dist[2] == 200, "in-place K-stops relaxation answers " + dist[2] + " for k=0 (correct is 500)");
        }

        int fAgree = 0, fTotal = 400;
        for (int t = 0; t < fTotal; t++) {
            int n = 2 + rnd.nextInt(6);
            int m = rnd.nextInt(n * (n - 1) + 1);
            List<int[]> list = new ArrayList<>();
            boolean[][] seen = new boolean[n][n];
            for (int i = 0; i < m; i++) {
                int u = rnd.nextInt(n), v = rnd.nextInt(n);
                if (u == v || seen[u][v]) continue;
                seen[u][v] = true;
                list.add(new int[] {u, v, 1 + rnd.nextInt(50)});
            }
            int[][] flights = list.toArray(new int[0][]);
            int src = rnd.nextInt(n), dst = rnd.nextInt(n);
            if (src == dst) dst = (dst + 1) % n;
            int k = rnd.nextInt(4);
            int want = flightsOracle(n, flights, src, dst, k);
            int got = new Flights().findCheapestPrice(n, flights, src, dst, k);
            if (got == want) fAgree++;
            else {
                failures++;
                System.out.println("  FAIL K-stops n=" + n + " " + Arrays.deepToString(flights) + " src=" + src
                    + " dst=" + dst + " k=" + k + " got " + got + " want " + want);
            }
        }
        System.out.println("  ok   " + fAgree + "/" + fTotal + " random K-stops cases agree with exhaustive search");

        System.out.println(failures == 0 ? "  day 76 PASSED" : "  day 76 had " + failures + " FAILURES");
    }
}
