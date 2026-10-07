// Correctness assertions for day 72 - Rotting Oranges (LC 994).
//
// The minute-by-minute simulation and the multi-source BFS are copied verbatim
// from day-072.md. Both mutate the grid, so every call gets its own deep copy.
// Checked: the worked example, every edge case in the writeup, the two
// "without the fresh > 0 condition" claims (5 on the example, 2 on [[2,1]]),
// and a few hundred random grids against each other.

import java.util.*;

class Day72Test {

    // ---- brute force ----
    static int bruteOrangesRotting(int[][] grid) {

        int m = grid.length, n = grid[0].length;
        int[][] dirs = { {1, 0}, {-1, 0}, {0, 1}, {0, -1} };
        int minutes = 0;

        while (true) {
            List<int[]> toRot = new ArrayList<>();

            for (int r = 0; r < m; r++) {
                for (int c = 0; c < n; c++) {
                    if (grid[r][c] != 1) continue;
                    for (int[] d : dirs) {
                        int nr = r + d[0], nc = c + d[1];
                        if (nr >= 0 && nr < m && nc >= 0 && nc < n && grid[nr][nc] == 2) {
                            toRot.add(new int[] { r, c });
                            break;
                        }
                    }
                }
            }

            if (toRot.isEmpty()) break;
            for (int[] cell : toRot) grid[cell[0]][cell[1]] = 2;   // apply after the scan
            minutes++;
        }

        for (int[] row : grid) {
            for (int v : row) {
                if (v == 1) return -1;
            }
        }
        return minutes;
    }

    // ---- multi-source BFS (implementation section) ----
    static int orangesRotting(int[][] grid) {

        int m = grid.length, n = grid[0].length;
        Deque<int[]> queue = new ArrayDeque<>();
        int fresh = 0;

        for (int r = 0; r < m; r++) {
            for (int c = 0; c < n; c++) {
                if (grid[r][c] == 2) queue.offer(new int[] { r, c });
                else if (grid[r][c] == 1) fresh++;
            }
        }
        if (fresh == 0) return 0;

        int[][] dirs = { {1, 0}, {-1, 0}, {0, 1}, {0, -1} };
        int minutes = 0;

        while (!queue.isEmpty() && fresh > 0) {
            int size = queue.size();            // exactly the oranges that rotted last minute
            for (int i = 0; i < size; i++) {
                int[] cell = queue.poll();
                for (int[] d : dirs) {
                    int nr = cell[0] + d[0], nc = cell[1] + d[1];
                    if (nr < 0 || nr >= m || nc < 0 || nc >= n || grid[nr][nc] != 1) continue;
                    grid[nr][nc] = 2;           // rot it now, so nobody pushes it twice
                    fresh--;
                    queue.offer(new int[] { nr, nc });
                }
            }
            minutes++;
        }

        return fresh == 0 ? minutes : -1;
    }

    // The same BFS with the `fresh > 0` loop guard removed - the bug the writeup describes.
    static int withoutFreshGuard(int[][] grid) {
        int m = grid.length, n = grid[0].length;
        Deque<int[]> queue = new ArrayDeque<>();
        int fresh = 0;
        for (int r = 0; r < m; r++)
            for (int c = 0; c < n; c++) {
                if (grid[r][c] == 2) queue.offer(new int[] { r, c });
                else if (grid[r][c] == 1) fresh++;
            }
        if (fresh == 0) return 0;
        int[][] dirs = { {1, 0}, {-1, 0}, {0, 1}, {0, -1} };
        int minutes = 0;
        while (!queue.isEmpty()) {
            int size = queue.size();
            for (int i = 0; i < size; i++) {
                int[] cell = queue.poll();
                for (int[] d : dirs) {
                    int nr = cell[0] + d[0], nc = cell[1] + d[1];
                    if (nr < 0 || nr >= m || nc < 0 || nc >= n || grid[nr][nc] != 1) continue;
                    grid[nr][nc] = 2;
                    fresh--;
                    queue.offer(new int[] { nr, nc });
                }
            }
            minutes++;
        }
        return fresh == 0 ? minutes : -1;
    }

    static int[][] copy(int[][] g) {
        int[][] out = new int[g.length][];
        for (int i = 0; i < g.length; i++) out[i] = g[i].clone();
        return out;
    }

    static int failures = 0;

    static void check(String label, int[][] grid, int want) {
        int b = bruteOrangesRotting(copy(grid)), o = orangesRotting(copy(grid));
        boolean ok = b == want && o == want;
        if (!ok) failures++;
        System.out.println((ok ? "  ok   " : "  FAIL ") + label + " -> brute " + b + ", bfs " + o
            + (ok ? "" : "  expected " + want));
    }

    static void claim(String label, int got, int want) {
        boolean ok = got == want;
        if (!ok) failures++;
        System.out.println((ok ? "  ok   " : "  FAIL ") + label + " = " + got + (ok ? "" : "  expected " + want));
    }

    public static void main(String[] args) {
        System.out.println("day 72 - Rotting Oranges");

        int[][] ex = { {2,1,1},{1,1,0},{0,1,1} };
        check("example",                   ex, 4);
        check("unreachable fresh orange",  new int[][] { {2,1,1},{0,1,1},{1,0,1} }, -1);
        check("no fresh oranges",          new int[][] { {0,2} }, 0);
        check("only empty cells",          new int[][] { {0} }, 0);
        check("fresh, no rot",             new int[][] { {1} }, -1);
        check("single rotten",             new int[][] { {2} }, 0);
        check("one step",                  new int[][] { {2,1} }, 1);
        check("two sources meet",          new int[][] { {2,1,1,1,2} }, 2);
        check("diagonal does not count",   new int[][] { {2,0},{0,1} }, -1);
        check("everything rotten",         new int[][] { {2,2},{2,2} }, 0);

        claim("example without the fresh > 0 guard", withoutFreshGuard(copy(ex)), 5);
        claim("[[2,1]] without the fresh > 0 guard", withoutFreshGuard(copy(new int[][] { {2,1} })), 2);
        claim("[[2,1,1,1,2]] from the first source only", orangesRotting(new int[][] { {2,1,1,1,0} }), 3);

        Random rnd = new Random(72);
        int agree = 0, impossible = 0;
        for (int t = 0; t < 600; t++) {
            int m = 1 + rnd.nextInt(6), n = 1 + rnd.nextInt(6);
            int[][] g = new int[m][n];
            for (int r = 0; r < m; r++)
                for (int c = 0; c < n; c++) {
                    int x = rnd.nextInt(10);
                    g[r][c] = x < 2 ? 0 : x < 9 ? 1 : 2;
                }
            int b = bruteOrangesRotting(copy(g)), o = orangesRotting(copy(g));
            if (b == -1) impossible++;
            if (b == o) agree++;
            else {
                failures++;
                System.out.println("  FAIL random " + Arrays.deepToString(g) + " brute " + b + " bfs " + o);
            }
        }
        System.out.println("  ok   " + agree + "/600 random grids (" + impossible
            + " impossible); BFS matches the minute-by-minute simulation");

        System.out.println(failures == 0 ? "  day 72 PASSED" : "  day 72 had " + failures + " FAILURES");
    }
}
