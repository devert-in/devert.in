// Correctness assertions for day 74 - Shortest Path in Binary Matrix (LC 1091).
//
// Both published solutions (DFS over every path, and BFS) are copied verbatim
// from day-074.md as nested classes. They must agree with each other, with an
// independent relaxation oracle, and with every output the edge-cases section
// claims. The brute-force section's path/call counts table is re-measured with
// an instrumented copy of the same DFS.

import java.util.*;

class Day74Test {

    // ---- brute force, verbatim ----
    static class Brute {
        private static final int[][] DIRS = {
            {-1, -1}, {-1, 0}, {-1, 1},
            { 0, -1},          { 0, 1},
            { 1, -1}, { 1, 0}, { 1, 1}
        };

        private int n;
        private int best;

        public int shortestPathBinaryMatrix(int[][] grid) {

            n = grid.length;
            if (grid[0][0] != 0 || grid[n - 1][n - 1] != 0) return -1;

            best = Integer.MAX_VALUE;
            boolean[][] onPath = new boolean[n][n];
            onPath[0][0] = true;

            dfs(grid, 0, 0, 1, onPath);

            return best == Integer.MAX_VALUE ? -1 : best;
        }

        private void dfs(int[][] grid, int r, int c, int length, boolean[][] onPath) {

            if (r == n - 1 && c == n - 1) {
                best = Math.min(best, length);
                return;
            }

            for (int[] d : DIRS) {
                int nr = r + d[0];
                int nc = c + d[1];

                if (nr < 0 || nc < 0 || nr >= n || nc >= n) continue;
                if (grid[nr][nc] != 0 || onPath[nr][nc]) continue;

                onPath[nr][nc] = true;               // choose
                dfs(grid, nr, nc, length + 1, onPath);
                onPath[nr][nc] = false;              // un-choose (backtrack)
            }
        }
    }

    // ---- BFS implementation, verbatim ----
    static class Bfs {
        private static final int[][] DIRS = {
            {-1, -1}, {-1, 0}, {-1, 1},
            { 0, -1},          { 0, 1},
            { 1, -1}, { 1, 0}, { 1, 1}
        };

        public int shortestPathBinaryMatrix(int[][] grid) {

            int n = grid.length;
            if (grid[0][0] != 0 || grid[n - 1][n - 1] != 0) return -1;

            boolean[][] visited = new boolean[n][n];
            Deque<int[]> queue = new ArrayDeque<>();

            queue.offer(new int[] {0, 0});
            visited[0][0] = true;
            int dist = 1;                         // the start cell counts

            while (!queue.isEmpty()) {

                int size = queue.size();          // freeze the current ring
                for (int i = 0; i < size; i++) {

                    int[] cell = queue.poll();
                    int r = cell[0], c = cell[1];

                    if (r == n - 1 && c == n - 1) return dist;

                    for (int[] d : DIRS) {
                        int nr = r + d[0];
                        int nc = c + d[1];

                        if (nr < 0 || nc < 0 || nr >= n || nc >= n) continue;
                        if (grid[nr][nc] != 0 || visited[nr][nc]) continue;

                        visited[nr][nc] = true;   // mark on ENQUEUE
                        queue.offer(new int[] {nr, nc});
                    }
                }

                dist++;
            }

            return -1;
        }
    }

    // Oracle: relax dist[cell] = min(dist[nb] + 1) until nothing changes.
    // Shares no code shape with BFS or DFS.
    static int oracle(int[][] g) {
        int n = g.length;
        if (g[0][0] != 0 || g[n - 1][n - 1] != 0) return -1;
        int INF = Integer.MAX_VALUE / 2;
        int[][] d = new int[n][n];
        for (int[] row : d) Arrays.fill(row, INF);
        d[0][0] = 1;
        boolean changed = true;
        while (changed) {
            changed = false;
            for (int r = 0; r < n; r++) for (int c = 0; c < n; c++) {
                if (g[r][c] != 0 || d[r][c] == INF) continue;
                for (int dr = -1; dr <= 1; dr++) for (int dc = -1; dc <= 1; dc++) {
                    int a = r + dr, b = c + dc;
                    if (a < 0 || b < 0 || a >= n || b >= n || g[a][b] != 0) continue;
                    if (d[r][c] + 1 < d[a][b]) { d[a][b] = d[r][c] + 1; changed = true; }
                }
            }
        }
        return d[n - 1][n - 1] == INF ? -1 : d[n - 1][n - 1];
    }

    static int failures = 0;

    static int[][] copy(int[][] g) {
        int[][] c = new int[g.length][];
        for (int i = 0; i < g.length; i++) c[i] = g[i].clone();
        return c;
    }

    static void check(String label, int[][] grid, int want, boolean runBrute) {
        int b = new Bfs().shortestPathBinaryMatrix(copy(grid));
        int f = runBrute ? new Brute().shortestPathBinaryMatrix(copy(grid)) : want;
        boolean ok = b == want && f == want;
        if (!ok) failures++;
        System.out.println((ok ? "  ok   " : "  FAIL ") + label + "  -> bfs " + b
            + (runBrute ? ", brute " + f : "") + (ok ? "" : "  expected " + want));
    }

    // Instrumented copy of the brute force, counting calls and complete paths.
    static long calls, paths;
    static void countDfs(int n, int r, int c, boolean[][] on) {
        calls++;
        if (r == n - 1 && c == n - 1) { paths++; return; }
        int[][] D = {{-1,-1},{-1,0},{-1,1},{0,-1},{0,1},{1,-1},{1,0},{1,1}};
        for (int[] d : D) {
            int a = r + d[0], b = c + d[1];
            if (a < 0 || b < 0 || a >= n || b >= n || on[a][b]) continue;
            on[a][b] = true; countDfs(n, a, b, on); on[a][b] = false;
        }
    }

    public static void main(String[] args) {
        System.out.println("day 74 - Shortest Path in Binary Matrix");

        check("example", new int[][] {{0,0,0},{1,1,0},{1,1,0}}, 4, true);
        check("single open cell", new int[][] {{0}}, 1, true);
        check("single blocked cell", new int[][] {{1}}, -1, true);
        check("start blocked", new int[][] {{1,0},{0,0}}, -1, true);
        check("end blocked", new int[][] {{0,0},{0,1}}, -1, true);
        check("only diagonal open", new int[][] {{0,1},{1,0}}, 2, true);
        check("fully open 3x3", new int[][] {{0,0,0},{0,0,0},{0,0,0}}, 3, true);
        check("wall cuts grid", new int[][] {{0,0,0},{1,1,1},{0,0,0}}, -1, true);
        check("pure diagonal 4x4", new int[][] {{0,1,1,1},{1,0,1,1},{0,1,0,1},{1,1,1,0}}, 4, true);
        check("snake 5x5", new int[][] {
            {0,0,0,0,0},{1,1,1,1,0},{0,0,0,0,0},{0,1,1,1,1},{0,0,0,0,0}}, 13, true);

        // Open n x n grid answers n (main diagonal) - checked for a range of n.
        boolean openOk = true;
        for (int n = 1; n <= 30; n++) {
            if (new Bfs().shortestPathBinaryMatrix(new int[n][n]) != n) openOk = false;
        }
        if (!openOk) failures++;
        System.out.println((openOk ? "  ok   " : "  FAIL ") + "open n x n grid answers n for n = 1..30");

        // The "where it hurts" table.
        long[][] claims = { {2, 5, 10}, {3, 235, 827}, {4, 96371, 551576} };
        for (long[] cl : claims) {
            int n = (int) cl[0];
            calls = 0; paths = 0;
            boolean[][] on = new boolean[n][n];
            on[0][0] = true;
            countDfs(n, 0, 0, on);
            boolean ok = paths == cl[1] && calls == cl[2];
            if (!ok) failures++;
            System.out.println((ok ? "  ok   " : "  FAIL ") + n + "x" + n + " open grid: "
                + paths + " paths, " + calls + " DFS calls");
        }

        // Randomised: BFS vs oracle on n up to 8; brute force too on n up to 4.
        Random rnd = new Random(74);
        int agree = 0, total = 600;
        for (int t = 0; t < total; t++) {
            int n = 1 + rnd.nextInt(8);
            int[][] g = new int[n][n];
            int density = 2 + rnd.nextInt(4);
            for (int r = 0; r < n; r++) for (int c = 0; c < n; c++) g[r][c] = rnd.nextInt(density) == 0 ? 1 : 0;
            if (rnd.nextInt(3) > 0) { g[0][0] = 0; g[n - 1][n - 1] = 0; }

            int want = oracle(g);
            int b = new Bfs().shortestPathBinaryMatrix(copy(g));
            int f = n <= 4 ? new Brute().shortestPathBinaryMatrix(copy(g)) : want;
            if (b == want && f == want) agree++;
            else {
                failures++;
                System.out.println("  FAIL random " + Arrays.deepToString(g) + " bfs " + b + " brute " + f + " oracle " + want);
            }
        }
        System.out.println("  ok   " + agree + "/" + total + " random grids agree with the oracle");

        System.out.println(failures == 0 ? "  day 74 PASSED" : "  day 74 had " + failures + " FAILURES");
    }
}
