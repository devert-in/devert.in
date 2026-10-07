// Correctness assertions for day 66 - Number of Islands.
//
// All three published solutions (explore-from-every-cell brute force, the
// recursive DFS sink, and the BFS follow-up) are copied verbatim from
// day-066.md. Each gets its own copy of the grid, because the sink versions
// mutate it. They are checked on the worked example, every edge case in the
// edge-cases section, and random grids against a union-find oracle. An
// instrumented copy of sink() also checks the dry run's numbers: 17 calls to
// sink island A, and a recursion depth of 17 on the snake.

import java.util.*;

class Day66Test {

    // ---- brute force ----
    static int bruteNumIslands(char[][] grid) {
        int count = 0;
        for (int r = 0; r < grid.length; r++) {
            for (int c = 0; c < grid[0].length; c++) {
                if (grid[r][c] == '1' && ownsIsland(grid, r, c)) {
                    count++;
                }
            }
        }
        return count;
    }

    // Explores the whole island containing (r, c) from scratch and reports
    // whether (r, c) is its first cell in row-major order.
    static boolean ownsIsland(char[][] grid, int r, int c) {
        int rows = grid.length, cols = grid[0].length;
        boolean[][] seen = new boolean[rows][cols];
        Deque<int[]> queue = new ArrayDeque<>();
        queue.offer(new int[] { r, c });
        seen[r][c] = true;
        int smallest = r * cols + c;
        int[][] dirs = { { 1, 0 }, { -1, 0 }, { 0, 1 }, { 0, -1 } };
        while (!queue.isEmpty()) {
            int[] cell = queue.poll();
            smallest = Math.min(smallest, cell[0] * cols + cell[1]);
            for (int[] d : dirs) {
                int nr = cell[0] + d[0], nc = cell[1] + d[1];
                if (nr >= 0 && nr < rows && nc >= 0 && nc < cols
                        && grid[nr][nc] == '1' && !seen[nr][nc]) {
                    seen[nr][nc] = true;
                    queue.offer(new int[] { nr, nc });
                }
            }
        }
        return smallest == r * cols + c;
    }

    // ---- implementation: DFS sink ----
    static int numIslands(char[][] grid) {
        int count = 0;
        for (int r = 0; r < grid.length; r++) {
            for (int c = 0; c < grid[0].length; c++) {
                if (grid[r][c] == '1') {
                    count++;              // first cell of a new island
                    sink(grid, r, c);     // erase the whole island so it is never counted again
                }
            }
        }
        return count;
    }

    static void sink(char[][] grid, int r, int c) {
        if (r < 0 || r >= grid.length || c < 0 || c >= grid[0].length
                || grid[r][c] != '1') {
            return;                       // off the grid, water, or already sunk
        }
        grid[r][c] = '0';                 // mark BEFORE recursing
        sink(grid, r + 1, c);
        sink(grid, r - 1, c);
        sink(grid, r, c + 1);
        sink(grid, r, c - 1);
    }

    // ---- follow-up: BFS ----
    static int bfsNumIslands(char[][] grid) {
        int rows = grid.length, cols = grid[0].length;
        int[][] dirs = { { 1, 0 }, { -1, 0 }, { 0, 1 }, { 0, -1 } };
        int count = 0;
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (grid[r][c] != '1') {
                    continue;
                }
                count++;
                grid[r][c] = '0';                       // mark when ENQUEUED
                Deque<int[]> queue = new ArrayDeque<>();
                queue.offer(new int[] { r, c });
                while (!queue.isEmpty()) {
                    int[] cell = queue.poll();
                    for (int[] d : dirs) {
                        int nr = cell[0] + d[0], nc = cell[1] + d[1];
                        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols
                                && grid[nr][nc] == '1') {
                            grid[nr][nc] = '0';
                            queue.offer(new int[] { nr, nc });
                        }
                    }
                }
            }
        }
        return count;
    }

    // ---- instrumented sink for the dry-run numbers ----
    static int calls = 0, depthNow = 0, maxDepth = 0;
    static void countedSink(char[][] grid, int r, int c) {
        calls++; depthNow++; maxDepth = Math.max(maxDepth, depthNow);
        if (!(r < 0 || r >= grid.length || c < 0 || c >= grid[0].length || grid[r][c] != '1')) {
            grid[r][c] = '0';
            countedSink(grid, r + 1, c);
            countedSink(grid, r - 1, c);
            countedSink(grid, r, c + 1);
            countedSink(grid, r, c - 1);
        }
        depthNow--;
    }

    // ---- union-find oracle ----
    static int[] parent;
    static int find(int x) { while (parent[x] != x) x = parent[x] = parent[parent[x]]; return x; }
    static int oracle(char[][] g) {
        int R = g.length, C = g[0].length;
        parent = new int[R * C];
        int land = 0;
        for (int i = 0; i < R * C; i++) parent[i] = i;
        for (int r = 0; r < R; r++) for (int c = 0; c < C; c++) {
            if (g[r][c] != '1') continue;
            land++;
            if (r + 1 < R && g[r + 1][c] == '1') { int a = find(r * C + c), b = find((r + 1) * C + c); if (a != b) { parent[a] = b; land--; } }
            if (c + 1 < C && g[r][c + 1] == '1') { int a = find(r * C + c), b = find(r * C + c + 1); if (a != b) { parent[a] = b; land--; } }
        }
        return land;
    }

    static char[][] grid(String... rows) {
        char[][] g = new char[rows.length][];
        for (int i = 0; i < rows.length; i++) g[i] = rows[i].replace(" ", "").toCharArray();
        return g;
    }
    static char[][] copy(char[][] g) {
        char[][] o = new char[g.length][];
        for (int i = 0; i < g.length; i++) o[i] = g[i].clone();
        return o;
    }

    static int failures = 0;

    static void check(String label, char[][] g, int want) {
        int a = bruteNumIslands(copy(g));
        int b = numIslands(copy(g));
        int c = bfsNumIslands(copy(g));
        int o = oracle(g);
        boolean ok = a == want && b == want && c == want && o == want;
        if (!ok) failures++;
        System.out.println((ok ? "  ok   " : "  FAIL ") + label + "  -> brute " + a + ", dfs " + b
            + ", bfs " + c + ", oracle " + o + (ok ? "" : "  expected " + want));
    }

    public static void main(String[] args) {
        System.out.println("day 66 - Number of Islands");

        char[][] example = grid("11000", "11000", "00100", "00011");
        check("example", example, 3);
        check("all water",   grid("00", "00"), 0);
        check("all land",    grid("111", "111"), 1);
        check("single land", grid("1"), 1);
        check("single water", grid("0"), 0);
        check("diagonal",    grid("10", "01"), 2);
        check("single row",  grid("101101"), 3);
        check("ring",        grid("111", "101", "111"), 1);
        char[][] snake = grid("11111", "00001", "11111", "10000", "11111");
        check("snake",       snake, 1);

        // Dry-run numbers: sinking island A from (0,0) takes 17 calls and sinks 4 cells.
        char[][] g = copy(example);
        calls = 0; depthNow = 0; maxDepth = 0;
        countedSink(g, 0, 0);
        int sunk = 0;
        for (int r = 0; r < 2; r++) for (int c = 0; c < 2; c++) if (g[r][c] == '0') sunk++;
        boolean dryOk = calls == 17 && sunk == 4 && g[2][2] == '1';
        if (!dryOk) failures++;
        System.out.println((dryOk ? "  ok   " : "  FAIL ") + "sink(0,0) on the example: " + calls + " calls, " + sunk + " cells sunk");

        // Snake: recursion goes all 17 land cells deep (17 land frames + 1 failing leaf call).
        int land = 0;
        for (char[] row : snake) for (char ch : row) if (ch == '1') land++;
        g = copy(snake);
        calls = 0; depthNow = 0; maxDepth = 0;
        countedSink(g, 0, 0);
        boolean deep = land == 17 && maxDepth == 18;
        if (!deep) failures++;
        System.out.println((deep ? "  ok   " : "  FAIL ") + "snake: " + land + " land cells, " + (maxDepth - 1) + " land frames deep");

        // Brute force must not modify the grid.
        char[][] untouched = copy(example);
        bruteNumIslands(untouched);
        boolean same = Arrays.deepEquals(untouched, example);
        if (!same) failures++;
        System.out.println((same ? "  ok   " : "  FAIL ") + "brute force leaves the grid unchanged");

        // char vs int trap.
        boolean trap = '1' != 1;
        if (!trap) failures++;
        System.out.println((trap ? "  ok   " : "  FAIL ") + "'1' == 1 is false in Java ('1' is " + (int) '1' + ")");

        Random rnd = new Random(66);
        int agree = 0;
        for (int t = 0; t < 400; t++) {
            int R = 1 + rnd.nextInt(8), C = 1 + rnd.nextInt(8);
            char[][] rg = new char[R][C];
            int density = 2 + rnd.nextInt(5);
            for (int r = 0; r < R; r++) for (int c = 0; c < C; c++) rg[r][c] = rnd.nextInt(density) < 2 ? '1' : '0';
            int o = oracle(rg);
            int a = bruteNumIslands(copy(rg)), b = numIslands(copy(rg)), c = bfsNumIslands(copy(rg));
            if (a == o && b == o && c == o) agree++;
            else { failures++; System.out.println("  FAIL random " + Arrays.deepToString(rg) + " -> " + a + "/" + b + "/" + c + " oracle " + o); }
        }
        System.out.println("  ok   " + agree + "/400 random grids, brute = dfs = bfs = union-find oracle");

        System.out.println(failures == 0 ? "  day 66 PASSED" : "  day 66 had " + failures + " FAILURES");
    }
}
