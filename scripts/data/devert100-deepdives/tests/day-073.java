// Correctness assertions for day 73 - Is Graph Bipartite? (LC 785).
//
// The brute force (every 2^n split), BFS two-colouring and DFS two-colouring
// are copied verbatim from day-073.md. Checked: both worked examples, every
// edge case in the writeup, the 16-row brute-force table (which edge rejects
// each mask), the final colour array of the square dry run, and random
// graphs where all three must agree.

import java.util.*;

class Day73Test {

    // ---- brute force ----
    static boolean bruteIsBipartite(int[][] graph) {

        int n = graph.length;

        for (long mask = 0; mask < (1L << n); mask++) {
            if (valid(graph, mask)) return true;
        }
        return false;
    }

    static boolean valid(int[][] graph, long mask) {
        for (int u = 0; u < graph.length; u++) {
            for (int v : graph[u]) {
                long cu = (mask >> u) & 1, cv = (mask >> v) & 1;
                if (u < v && cu == cv) return false;    // both ends on the same side
            }
        }
        return true;
    }

    // ---- BFS two-colouring (implementation section) ----
    static int[] lastColor;   // test hook: the colour array the BFS ended with

    static boolean isBipartite(int[][] graph) {

        int n = graph.length;
        int[] color = new int[n];
        Arrays.fill(color, -1);                     // -1 = not coloured yet
        lastColor = color;

        for (int start = 0; start < n; start++) {
            if (color[start] != -1) continue;

            color[start] = 0;
            Deque<Integer> queue = new ArrayDeque<>();
            queue.offer(start);

            while (!queue.isEmpty()) {
                int node = queue.poll();
                for (int next : graph[node]) {
                    if (color[next] == -1) {
                        color[next] = 1 - color[node];  // forced: the opposite side
                        queue.offer(next);
                    } else if (color[next] == color[node]) {
                        return false;                   // an edge inside one side
                    }
                }
            }
        }
        return true;
    }

    // ---- DFS two-colouring ----
    static boolean dfsIsBipartite(int[][] graph) {

        int[] color = new int[graph.length];       // 0 = uncoloured, 1 / -1 = the two sides
        for (int start = 0; start < graph.length; start++) {
            if (color[start] == 0 && !paint(graph, start, 1, color)) return false;
        }
        return true;
    }

    static boolean paint(int[][] graph, int node, int c, int[] color) {
        color[node] = c;
        for (int next : graph[node]) {
            if (color[next] == c) return false;
            if (color[next] == 0 && !paint(graph, next, -c, color)) return false;
        }
        return true;
    }

    // First edge (u < v, adjacency order) that rejects a mask, as "u-v", or "none".
    static String firstBadEdge(int[][] graph, long mask) {
        for (int u = 0; u < graph.length; u++)
            for (int v : graph[u])
                if (u < v && ((mask >> u) & 1) == ((mask >> v) & 1)) return u + "-" + v;
        return "none";
    }

    static int failures = 0;

    static void check(String label, int[][] g, boolean want) {
        boolean b = bruteIsBipartite(g), q = isBipartite(g), d = dfsIsBipartite(g);
        boolean ok = b == want && q == want && d == want;
        if (!ok) failures++;
        System.out.println((ok ? "  ok   " : "  FAIL ") + label + " -> brute " + b + ", bfs " + q
            + ", dfs " + d + (ok ? "" : "  expected " + want));
    }

    public static void main(String[] args) {
        System.out.println("day 73 - Is Graph Bipartite?");

        int[][] ex = { {1,2,3},{0,2},{0,1,3},{0,2} };
        int[][] square = { {1,3},{0,2},{1,3},{0,2} };
        check("example (triangle inside)", ex, false);
        check("square",                    square, true);
        isBipartite(square);
        boolean colOk = Arrays.equals(lastColor, new int[] { 0, 1, 0, 1 });
        if (!colOk) failures++;
        System.out.println((colOk ? "  ok   " : "  FAIL ") + "square dry run ends with color " + Arrays.toString(lastColor));

        String[] table = { "0-1","1-2","0-2","0-1","0-1","0-2","0-3","0-1",
                           "0-1","0-3","0-2","0-1","0-1","0-2","1-2","0-1" };
        boolean tableOk = true;
        for (int mask = 0; mask < 16; mask++) {
            String got = firstBadEdge(ex, mask);
            if (!got.equals(table[mask])) {
                tableOk = false;
                System.out.println("  FAIL table mask " + mask + " rejected at " + got + ", writeup says " + table[mask]);
            }
        }
        if (!tableOk) failures++;
        else System.out.println("  ok   brute-force table: all 16 masks rejected at the edges the writeup lists");

        check("single node",            new int[][] { {} }, true);
        check("isolated nodes",         new int[][] { {}, {}, {} }, true);
        check("one edge",               new int[][] { {1},{0} }, true);
        check("pentagon",               new int[][] { {1,4},{0,2},{1,3},{2,4},{3,0} }, false);
        check("tree",                   new int[][] { {1,2},{0,3},{0},{1} }, true);
        check("odd cycle in 2nd piece", new int[][] { {1},{0},{3,4},{2,4},{2,3} }, false);
        check("complete bipartite K2,2",new int[][] { {2,3},{2,3},{0,1},{0,1} }, true);

        Random rnd = new Random(73);
        int agree = 0, bip = 0;
        for (int t = 0; t < 500; t++) {
            int n = 1 + rnd.nextInt(10);
            boolean[][] adj = new boolean[n][n];
            int m = rnd.nextInt(n + 4);
            boolean forceBip = rnd.nextBoolean();
            int[] side = new int[n];
            for (int i = 0; i < n; i++) side[i] = rnd.nextInt(2);
            for (int k = 0; k < m; k++) {
                int a = rnd.nextInt(n), b = rnd.nextInt(n);
                if (a == b) continue;
                if (forceBip && side[a] == side[b]) continue;
                adj[a][b] = adj[b][a] = true;
            }
            int[][] g = new int[n][];
            for (int i = 0; i < n; i++) {
                List<Integer> l = new ArrayList<>();
                for (int j = 0; j < n; j++) if (adj[i][j]) l.add(j);
                g[i] = l.stream().mapToInt(Integer::intValue).toArray();
            }
            boolean b = bruteIsBipartite(g), q = isBipartite(g), d = dfsIsBipartite(g);
            if (b) bip++;
            if (b == q && b == d && (!forceBip || b)) agree++;
            else {
                failures++;
                System.out.println("  FAIL random " + Arrays.deepToString(g) + " brute " + b + " bfs " + q + " dfs " + d);
            }
        }
        System.out.println("  ok   " + agree + "/500 random graphs (" + bip
            + " bipartite); BFS and DFS match the 2^n brute force");

        System.out.println(failures == 0 ? "  day 73 PASSED" : "  day 73 had " + failures + " FAILURES");
    }
}
