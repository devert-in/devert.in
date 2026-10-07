// Correctness assertions for day 75 - Network Delay Time (LC 743), Dijkstra.
//
// Both published solutions (relax-until-stable and heap Dijkstra) are copied
// verbatim from day-075.md. They must agree with each other, with a
// Floyd-Warshall oracle, and with every output the edge-cases section claims.
// The dry-run counts (20 edge checks / 4 passes for the brute force, 2 stale
// pops for Dijkstra) and the negative-edge claims are re-measured too.

import java.util.*;

class Day75Test {

    // ---- brute force, verbatim ----
    static class Brute {
        public int networkDelayTime(int[][] times, int n, int k) {

            int[] dist = new int[n + 1];
            Arrays.fill(dist, Integer.MAX_VALUE);
            dist[k] = 0;

            boolean changed = true;
            while (changed) {
                changed = false;
                for (int[] t : times) {
                    int u = t[0], v = t[1], w = t[2];
                    if (dist[u] == Integer.MAX_VALUE) continue;   // u not reached yet
                    if (dist[u] + w < dist[v]) {
                        dist[v] = dist[u] + w;
                        changed = true;
                    }
                }
            }

            int answer = 0;
            for (int i = 1; i <= n; i++) {
                if (dist[i] == Integer.MAX_VALUE) return -1;
                answer = Math.max(answer, dist[i]);
            }
            return answer;
        }
    }

    // ---- Dijkstra, verbatim ----
    static class Dijkstra {
        public int networkDelayTime(int[][] times, int n, int k) {

            // Adjacency list: graph.get(u) = list of {v, w} for edges u -> v.
            List<List<int[]>> graph = new ArrayList<>();
            for (int i = 0; i <= n; i++) graph.add(new ArrayList<>());
            for (int[] t : times) graph.get(t[0]).add(new int[] {t[1], t[2]});

            int[] dist = new int[n + 1];
            Arrays.fill(dist, Integer.MAX_VALUE);
            dist[k] = 0;

            // Min-heap of {distance, node}, smallest distance first.
            PriorityQueue<int[]> heap = new PriorityQueue<>((a, b) -> Integer.compare(a[0], b[0]));
            heap.offer(new int[] {0, k});

            while (!heap.isEmpty()) {

                int[] top = heap.poll();
                int d = top[0], u = top[1];

                if (d > dist[u]) continue;            // stale entry - u already finalised cheaper

                for (int[] edge : graph.get(u)) {
                    int v = edge[0], w = edge[1];
                    if (d + w < dist[v]) {
                        dist[v] = d + w;
                        heap.offer(new int[] {dist[v], v});
                    }
                }
            }

            int answer = 0;
            for (int i = 1; i <= n; i++) {
                if (dist[i] == Integer.MAX_VALUE) return -1;   // never received the signal
                answer = Math.max(answer, dist[i]);
            }
            return answer;
        }
    }

    // Oracle: Floyd-Warshall, then max over row k.
    static int oracle(int[][] times, int n, int k) {
        long INF = Long.MAX_VALUE / 4;
        long[][] d = new long[n + 1][n + 1];
        for (long[] r : d) Arrays.fill(r, INF);
        for (int i = 1; i <= n; i++) d[i][i] = 0;
        for (int[] t : times) d[t[0]][t[1]] = Math.min(d[t[0]][t[1]], t[2]);
        for (int m = 1; m <= n; m++)
            for (int i = 1; i <= n; i++)
                for (int j = 1; j <= n; j++)
                    if (d[i][m] + d[m][j] < d[i][j]) d[i][j] = d[i][m] + d[m][j];
        long ans = 0;
        for (int j = 1; j <= n; j++) {
            if (d[k][j] >= INF) return -1;
            ans = Math.max(ans, d[k][j]);
        }
        return (int) ans;
    }

    static int failures = 0;

    static void check(String label, int[][] times, int n, int k, int want) {
        int a = new Brute().networkDelayTime(times, n, k);
        int b = new Dijkstra().networkDelayTime(times, n, k);
        boolean ok = a == want && b == want;
        if (!ok) failures++;
        System.out.println((ok ? "  ok   " : "  FAIL ") + label + "  -> brute " + a + ", dijkstra " + b
            + (ok ? "" : "  expected " + want));
    }

    static void claim(boolean ok, String text) {
        if (!ok) failures++;
        System.out.println((ok ? "  ok   " : "  FAIL ") + text);
    }

    public static void main(String[] args) {
        System.out.println("day 75 - Network Delay Time");

        int[][] ex = {{2,4,2},{3,4,5},{3,2,2},{1,2,4},{1,3,1}};
        check("worked example", ex, 4, 1, 5);
        check("unreachable node", new int[][] {{1,2,1}}, 2, 2, -1);
        check("reachable direction", new int[][] {{1,2,1}}, 2, 1, 1);
        check("single node", new int[][] {}, 1, 1, 0);
        check("LeetCode example 1", new int[][] {{2,1,1},{2,3,1},{3,4,1}}, 4, 2, 2);
        check("parallel edges", new int[][] {{1,2,5},{1,2,1}}, 2, 1, 1);
        check("zero-weight edges", new int[][] {{1,2,0},{2,3,0}}, 3, 1, 0);
        check("cycle", new int[][] {{1,2,1},{2,3,1},{3,1,1}}, 3, 1, 2);
        check("cheap route has more edges", new int[][] {{1,3,10},{1,2,1},{2,3,1}}, 3, 1, 2);
        check("max not sum", new int[][] {{1,2,3},{1,3,3},{1,4,3}}, 4, 1, 3);

        // Brute-force dry run: 4 passes x 5 edges = 20 checks, 5 updates.
        {
            int n = 4, k = 1;
            int[] dist = new int[n + 1];
            Arrays.fill(dist, Integer.MAX_VALUE);
            dist[k] = 0;
            int passes = 0, checks = 0, updates = 0;
            boolean changed = true;
            while (changed) {
                changed = false; passes++;
                for (int[] t : ex) {
                    checks++;
                    if (dist[t[0]] == Integer.MAX_VALUE) continue;
                    if (dist[t[0]] + t[2] < dist[t[1]]) { dist[t[1]] = dist[t[0]] + t[2]; changed = true; updates++; }
                }
            }
            claim(passes == 4 && checks == 20 && updates == 5,
                "brute dry run: " + passes + " passes, " + checks + " edge checks, " + updates + " updates");
        }

        // Dijkstra dry run: pop order and 2 stale entries, 5 relaxations examined.
        {
            int n = 4, k = 1;
            List<List<int[]>> g = new ArrayList<>();
            for (int i = 0; i <= n; i++) g.add(new ArrayList<>());
            for (int[] t : ex) g.get(t[0]).add(new int[] {t[1], t[2]});
            int[] dist = new int[n + 1];
            Arrays.fill(dist, Integer.MAX_VALUE);
            dist[k] = 0;
            PriorityQueue<int[]> h = new PriorityQueue<>((a, b) -> Integer.compare(a[0], b[0]));
            h.offer(new int[] {0, k});
            StringBuilder pops = new StringBuilder();
            int stale = 0, relaxed = 0;
            while (!h.isEmpty()) {
                int[] top = h.poll();
                pops.append("(").append(top[0]).append(",").append(top[1]).append(")");
                if (top[0] > dist[top[1]]) { stale++; continue; }
                for (int[] e : g.get(top[1])) {
                    relaxed++;
                    if (top[0] + e[1] < dist[e[0]]) { dist[e[0]] = top[0] + e[1]; h.offer(new int[] {dist[e[0]], e[0]}); }
                }
            }
            String want = "(0,1)(1,3)(3,2)(4,2)(5,4)(6,4)";
            claim(pops.toString().equals(want) && stale == 2 && relaxed == 5,
                "dijkstra dry run pops " + pops + ", " + stale + " stale, " + relaxed + " edges relaxed");
        }

        // Negative-edge section: textbook (finalised set) is wrong, lazy self-corrects.
        {
            int[][] neg = {{1,2,2},{1,3,5},{3,2,-4}};
            int n = 3;
            // textbook
            int[] dist = new int[n + 1];
            Arrays.fill(dist, Integer.MAX_VALUE);
            dist[1] = 0;
            boolean[] fin = new boolean[n + 1];
            List<List<int[]>> g = new ArrayList<>();
            for (int i = 0; i <= n; i++) g.add(new ArrayList<>());
            for (int[] t : neg) g.get(t[0]).add(new int[] {t[1], t[2]});
            PriorityQueue<int[]> h = new PriorityQueue<>((a, b) -> Integer.compare(a[0], b[0]));
            h.offer(new int[] {0, 1});
            while (!h.isEmpty()) {
                int[] top = h.poll();
                if (fin[top[1]]) continue;
                fin[top[1]] = true;
                for (int[] e : g.get(top[1])) {
                    if (fin[e[0]]) continue;
                    if (top[0] + e[1] < dist[e[0]]) { dist[e[0]] = top[0] + e[1]; h.offer(new int[] {dist[e[0]], e[0]}); }
                }
            }
            claim(dist[2] == 2, "negative edge: textbook Dijkstra gives dist[2] = " + dist[2] + " (true answer 1)");
            // lazy published version: max over dist = max(0, 1, 5) = 5, so check via a variant returning dist[2]
            int[] d2 = new int[n + 1];
            Arrays.fill(d2, Integer.MAX_VALUE);
            d2[1] = 0;
            h.clear();
            h.offer(new int[] {0, 1});
            while (!h.isEmpty()) {
                int[] top = h.poll();
                if (top[0] > d2[top[1]]) continue;
                for (int[] e : g.get(top[1])) {
                    if (top[0] + e[1] < d2[e[0]]) { d2[e[0]] = top[0] + e[1]; h.offer(new int[] {d2[e[0]], e[0]}); }
                }
            }
            claim(d2[2] == 1, "negative edge: lazy Dijkstra self-corrects to dist[2] = " + d2[2]);
        }

        // Randomised: brute vs Dijkstra vs Floyd-Warshall.
        Random rnd = new Random(75);
        int agree = 0, total = 500;
        for (int t = 0; t < total; t++) {
            int n = 1 + rnd.nextInt(9);
            int m = rnd.nextInt(n * n + 1);
            List<int[]> es = new ArrayList<>();
            for (int i = 0; i < m; i++) {
                int u = 1 + rnd.nextInt(n), v = 1 + rnd.nextInt(n);
                if (u == v) continue;
                es.add(new int[] {u, v, rnd.nextInt(101)});
            }
            int[][] times = es.toArray(new int[0][]);
            int k = 1 + rnd.nextInt(n);
            int want = oracle(times, n, k);
            int a = new Brute().networkDelayTime(times, n, k);
            int b = new Dijkstra().networkDelayTime(times, n, k);
            if (a == want && b == want) agree++;
            else {
                failures++;
                System.out.println("  FAIL random n=" + n + " k=" + k + " " + Arrays.deepToString(times)
                    + " brute " + a + " dijkstra " + b + " oracle " + want);
            }
        }
        System.out.println("  ok   " + agree + "/" + total + " random graphs agree with Floyd-Warshall");

        System.out.println(failures == 0 ? "  day 75 PASSED" : "  day 75 had " + failures + " FAILURES");
    }
}
