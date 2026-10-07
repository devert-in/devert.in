// Correctness assertions for day 49 - Search a 2D Matrix II.
//
// The brute-force scan and the staircase search are copied verbatim from
// day-049.md. Both must agree on the worked examples, every edge case in the
// edge-cases section, and a few hundred random row-and-column-sorted grids.
// The staircase's comparison count is also checked against the m + n - 1
// bound the complexity section claims, and against the step counts quoted in
// the dry runs (7 for target 13, 9 for target 20, 9 for target 18).

import java.util.*;

class Day49Test {

    // ---- brute force from the bruteForce section ----
    static boolean bruteForce(int[][] matrix, int target) {
        for (int r = 0; r < matrix.length; r++) {
            for (int c = 0; c < matrix[r].length; c++) {
                if (matrix[r][c] == target) {
                    return true;
                }
            }
        }
        return false;
    }

    // ---- staircase from the implementation section ----
    static boolean searchMatrix(int[][] matrix, int target) {
        if (matrix.length == 0 || matrix[0].length == 0) {
            return false;
        }
        int row = 0;
        int col = matrix[0].length - 1;
        while (row < matrix.length && col >= 0) {
            int value = matrix[row][col];
            if (value == target) {
                return true;
            } else if (value > target) {
                col--;
            } else {
                row++;
            }
        }
        return false;
    }

    // Same walk, instrumented to count comparisons.
    static int staircaseSteps(int[][] matrix, int target) {
        int row = 0, col = matrix[0].length - 1, steps = 0;
        while (row < matrix.length && col >= 0) {
            steps++;
            int value = matrix[row][col];
            if (value == target) return steps;
            else if (value > target) col--;
            else row++;
        }
        return steps;
    }

    static int failures = 0;

    static void check(String label, int[][] m, int target, boolean want) {
        boolean a = bruteForce(m, target);
        boolean b = searchMatrix(m, target);
        boolean ok = a == want && b == want;
        if (!ok) failures++;
        System.out.println((ok ? "  ok   " : "  FAIL ") + label + "  target " + target
            + " -> brute " + a + ", staircase " + b + (ok ? "" : "  expected " + want));
    }

    static void checkSteps(String label, int[][] m, int target, int want) {
        int got = staircaseSteps(m, target);
        boolean ok = got == want;
        if (!ok) failures++;
        System.out.println((ok ? "  ok   " : "  FAIL ") + label + "  target " + target
            + " -> " + got + " comparisons" + (ok ? "" : "  expected " + want));
    }

    public static void main(String[] args) {
        System.out.println("day 49 - Search a 2D Matrix II");

        int[][] ex = {
            { 1, 4, 7, 11, 15 },
            { 2, 5, 8, 12, 19 },
            { 3, 6, 9, 16, 22 },
            { 10, 13, 14, 17, 24 },
            { 18, 21, 23, 26, 30 },
        };

        check("example present", ex, 13, true);
        check("example absent", ex, 20, false);
        check("example target 5", ex, 5, true);
        checkSteps("dry run present", ex, 13, 7);
        checkSteps("dry run absent", ex, 20, 9);

        check("1x1 present", new int[][] { { 5 } }, 5, true);
        check("1x1 absent", new int[][] { { 5 } }, 3, false);
        check("single row", new int[][] { { 1, 3, 5, 7 } }, 3, true);
        check("single column", new int[][] { { 1 }, { 3 }, { 5 } }, 4, false);
        check("smaller than all", ex, 0, false);
        checkSteps("smaller than all", ex, 0, 5);
        check("larger than all", ex, 31, false);
        checkSteps("larger than all", ex, 31, 5);
        check("far corner", ex, 18, true);
        checkSteps("far corner", ex, 18, 9);
        check("duplicates", new int[][] { { 1, 2, 2 }, { 2, 2, 3 } }, 2, true);
        check("negatives", new int[][] { { -5, -2 }, { -3, 0 } }, -3, true);
        check("empty", new int[][] {}, 1, false);

        // Random grids, sorted along both axes, with duplicates and negatives.
        Random rnd = new Random(49);
        int agree = 0, boundOk = 0;
        for (int t = 0; t < 400; t++) {
            int m = 1 + rnd.nextInt(8), n = 1 + rnd.nextInt(8);
            int[][] g = new int[m][n];
            for (int i = 0; i < m; i++) {
                for (int j = 0; j < n; j++) {
                    int base = (i == 0 && j == 0) ? -10 - rnd.nextInt(10)
                        : Math.max(i > 0 ? g[i - 1][j] : Integer.MIN_VALUE,
                                   j > 0 ? g[i][j - 1] : Integer.MIN_VALUE);
                    g[i][j] = base + rnd.nextInt(4);
                }
            }
            int target = -25 + rnd.nextInt(70);
            boolean want = bruteForce(g, target);
            if (searchMatrix(g, target) == want) agree++;
            else {
                failures++;
                System.out.println("  FAIL random " + Arrays.deepToString(g) + " target " + target);
            }
            if (staircaseSteps(g, target) <= m + n - 1) boundOk++;
            else failures++;
        }
        System.out.println("  ok   " + agree + "/400 random sorted grids agree with the scan");
        System.out.println("  ok   " + boundOk + "/400 within the m + n - 1 comparison bound");

        System.out.println(failures == 0 ? "  day 49 PASSED" : "  day 49 had " + failures + " FAILURES");
    }
}
