// Correctness assertions for day 68 - Number of Provinces.
//
// All three published solutions (transitive-closure brute force, DFS, and the
// Union-Find version with path compression + union by rank) are copied
// verbatim from day-068.md. They are checked on the worked example, every
// edge case in the edge-cases section, the DSU dry run's exact parent/rank
// arrays, the "matrix is not a grid" trap, and random symmetric matrices
// against a BFS oracle.

import java.util.*;

class Day68Test {

    // ---- brute force: transitive closure + leaders ----
    static int bruteFindCircleNum(int[][] isConnected) {
        int n = isConnected.length;
        boolean[][] reach = new boolean[n][n];
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < n; j++) {
                reach[i][j] = isConnected[i][j] == 1;
            }
        }

        // Transitive closure: if i reaches k and k reaches j, then i reaches j.
        for (int k = 0; k < n; k++) {
            for (int i = 0; i < n; i++) {
                for (int j = 0; j < n; j++) {
                    if (reach[i][k] && reach[k][j]) {
                        reach[i][j] = true;
                    }
                }
            }
        }

        // A city leads its province if it reaches no lower-numbered city.
        int provinces = 0;
        for (int i = 0; i < n; i++) {
            boolean leader = true;
            for (int j = 0; j < i; j++) {
                if (reach[i][j]) {
                    leader = false;
                    break;
                }
            }
            if (leader) {
                provinces++;
            }
        }
        return provinces;
    }

    // ---- implementation: DFS ----
    static int findCircleNum(int[][] isConnected) {
        int n = isConnected.length;
        boolean[] visited = new boolean[n];
        int provinces = 0;
        for (int city = 0; city < n; city++) {
            if (!visited[city]) {
                provinces++;                          // a city no earlier DFS reached
                visit(isConnected, visited, city);    // mark its whole province
            }
        }
        return provinces;
    }

    static void visit(int[][] isConnected, boolean[] visited, int city) {
        visited[city] = true;
        for (int other = 0; other < isConnected.length; other++) {
            if (isConnected[city][other] == 1 && !visited[other]) {
                visit(isConnected, visited, other);
            }
        }
    }

    // ---- Union-Find version ----
    static int dsuFindCircleNum(int[][] isConnected) {
        int n = isConnected.length;
        DSU dsu = new DSU(n);
        for (int i = 0; i < n; i++) {
            for (int j = i + 1; j < n; j++) {         // upper triangle: matrix is symmetric
                if (isConnected[i][j] == 1) {
                    dsu.union(i, j);
                }
            }
        }
        return dsu.components;
    }

    private static class DSU {
        private final int[] parent;
        private final int[] rank;
        int components;

        DSU(int n) {
            parent = new int[n];
            rank = new int[n];
            components = n;
            for (int i = 0; i < n; i++) {
                parent[i] = i;                        // every city starts as its own province
            }
        }

        int find(int x) {
            if (parent[x] != x) {
                parent[x] = find(parent[x]);          // path compression
            }
            return parent[x];
        }

        void union(int a, int b) {
            int ra = find(a), rb = find(b);
            if (ra == rb) {
                return;                               // already in the same province
            }
            if (rank[ra] < rank[rb]) {
                int t = ra; ra = rb; rb = t;          // make ra the taller tree
            }
            parent[rb] = ra;
            if (rank[ra] == rank[rb]) {
                rank[ra]++;
            }
            components--;                             // two provinces became one
        }
    }

    // ---- oracle: BFS over the matrix ----
    static int oracle(int[][] m) {
        int n = m.length, count = 0;
        boolean[] seen = new boolean[n];
        for (int s = 0; s < n; s++) {
            if (seen[s]) continue;
            count++;
            Deque<Integer> q = new ArrayDeque<>();
            q.add(s); seen[s] = true;
            while (!q.isEmpty()) { int c = q.poll(); for (int o = 0; o < n; o++) if (m[c][o] == 1 && !seen[o]) { seen[o] = true; q.add(o); } }
        }
        return count;
    }

    // Day 66's island counter, to demonstrate the grid trap.
    static int islandsOnMatrix(int[][] m) {
        int R = m.length, C = m[0].length, count = 0;
        boolean[][] seen = new boolean[R][C];
        for (int r = 0; r < R; r++) for (int c = 0; c < C; c++) {
            if (m[r][c] != 1 || seen[r][c]) continue;
            count++;
            Deque<int[]> q = new ArrayDeque<>();
            q.add(new int[] { r, c }); seen[r][c] = true;
            while (!q.isEmpty()) {
                int[] p = q.poll();
                int[][] d = { { 1, 0 }, { -1, 0 }, { 0, 1 }, { 0, -1 } };
                for (int[] dd : d) {
                    int nr = p[0] + dd[0], nc = p[1] + dd[1];
                    if (nr >= 0 && nr < R && nc >= 0 && nc < C && m[nr][nc] == 1 && !seen[nr][nc]) { seen[nr][nc] = true; q.add(new int[] { nr, nc }); }
                }
            }
        }
        return count;
    }

    static int failures = 0;

    static void check(String label, int[][] m, int want) {
        int a = bruteFindCircleNum(m), b = findCircleNum(m), c = dsuFindCircleNum(m), o = oracle(m);
        boolean ok = a == want && b == want && c == want && o == want;
        if (!ok) failures++;
        System.out.println((ok ? "  ok   " : "  FAIL ") + label + "  -> closure " + a + ", dfs " + b
            + ", dsu " + c + (ok ? "" : "  expected " + want));
    }

    static int[][] fromEdges(int n, int[][] edges) {
        int[][] m = new int[n][n];
        for (int i = 0; i < n; i++) m[i][i] = 1;
        for (int[] e : edges) { m[e[0]][e[1]] = 1; m[e[1]][e[0]] = 1; }
        return m;
    }

    public static void main(String[] args) {
        System.out.println("day 68 - Number of Provinces");

        int[][] example = {
            { 1, 0, 1, 0, 0 },
            { 0, 1, 1, 0, 0 },
            { 1, 1, 1, 0, 0 },
            { 0, 0, 0, 1, 1 },
            { 0, 0, 0, 1, 1 } };
        check("dry-run example", example, 2);
        check("leetcode example", new int[][] { { 1, 1, 0 }, { 1, 1, 0 }, { 0, 0, 1 } }, 2);
        check("single city",      new int[][] { { 1 } }, 1);
        check("no roads",         new int[][] { { 1, 0, 0 }, { 0, 1, 0 }, { 0, 0, 1 } }, 3);
        check("everyone",         new int[][] { { 1, 1, 1 }, { 1, 1, 1 }, { 1, 1, 1 } }, 1);
        check("indirect only",    new int[][] { { 1, 0, 1 }, { 0, 1, 1 }, { 1, 1, 1 } }, 1);
        check("chain of 5",       fromEdges(5, new int[][] { { 0, 1 }, { 1, 2 }, { 2, 3 }, { 3, 4 } }), 1);
        int[][] trap = { { 1, 0, 1 }, { 0, 1, 0 }, { 1, 0, 1 } };
        check("grid trap",        trap, 2);

        int islands = islandsOnMatrix(trap);
        boolean trapOk = islands == 5;
        if (!trapOk) failures++;
        System.out.println((trapOk ? "  ok   " : "  FAIL ") + "grid trap: island-counting the matrix gives " + islands);

        // Direct-only leader check gets the example wrong (3, not 2).
        int directOnly = 0;
        for (int i = 0; i < example.length; i++) {
            boolean leader = true;
            for (int j = 0; j < i; j++) if (example[i][j] == 1) leader = false;
            if (leader) directOnly++;
        }
        boolean directOk = directOnly == 3;
        if (!directOk) failures++;
        System.out.println((directOk ? "  ok   " : "  FAIL ") + "direct-roads-only leader count on the example gives " + directOnly);

        // DSU dry run: parent/rank/components after each road.
        DSU d = new DSU(5);
        int[][] roads = { { 0, 2 }, { 1, 2 }, { 3, 4 } };
        int[][] wantParent = { { 0, 1, 0, 3, 4 }, { 0, 0, 0, 3, 4 }, { 0, 0, 0, 3, 3 } };
        int[][] wantRank   = { { 1, 0, 0, 0, 0 }, { 1, 0, 0, 0, 0 }, { 1, 0, 0, 1, 0 } };
        int[] wantComp = { 4, 3, 2 };
        for (int s = 0; s < roads.length; s++) {
            d.union(roads[s][0], roads[s][1]);
            boolean ok = Arrays.equals(d.parent, wantParent[s]) && Arrays.equals(d.rank, wantRank[s]) && d.components == wantComp[s];
            if (!ok) failures++;
            System.out.println((ok ? "  ok   " : "  FAIL ") + "dsu after road " + roads[s][0] + "-" + roads[s][1]
                + ": parent " + Arrays.toString(d.parent) + ", rank " + Arrays.toString(d.rank) + ", components " + d.components);
        }

        // Everyone-connected: unions 0-1, 0-2 decrement; 1-2 does not.
        DSU e = new DSU(3);
        e.union(0, 1); int c1 = e.components;
        e.union(0, 2); int c2 = e.components;
        e.union(1, 2); int c3 = e.components;
        boolean guardOk = c1 == 2 && c2 == 1 && c3 == 1;
        if (!guardOk) failures++;
        System.out.println((guardOk ? "  ok   " : "  FAIL ") + "all-connected unions: 3 -> " + c1 + " -> " + c2 + " -> " + c3 + " (same-root road ignored)");

        Random rnd = new Random(68);
        int agree = 0;
        for (int t = 0; t < 400; t++) {
            int n = 1 + rnd.nextInt(12);
            int[][] m = new int[n][n];
            double p = rnd.nextDouble() * 0.4;
            for (int i = 0; i < n; i++) { m[i][i] = 1; for (int j = i + 1; j < n; j++) if (rnd.nextDouble() < p) { m[i][j] = 1; m[j][i] = 1; } }
            int o = oracle(m);
            int a = bruteFindCircleNum(m), b = findCircleNum(m), c = dsuFindCircleNum(m);
            if (a == o && b == o && c == o) agree++;
            else { failures++; System.out.println("  FAIL random " + Arrays.deepToString(m) + " -> " + a + "/" + b + "/" + c + " oracle " + o); }
        }
        System.out.println("  ok   " + agree + "/400 random matrices, closure = dfs = dsu = bfs oracle");

        System.out.println(failures == 0 ? "  day 68 PASSED" : "  day 68 had " + failures + " FAILURES");
    }
}
