// Correctness assertions for day 16 - Container With Most Water (LC 11).
//
// The all-pairs brute force and the opposite-ends two pointer are copied
// verbatim from day-016.md. Checks: the worked example, the full 36-cell area
// grid printed in the brute-force dry run, the eight-step two-pointer trace,
// every edge case, the "move the taller line returns 8" trap, and a seeded
// random comparison of the two solutions.

import java.util.*;

class Day16Test {

    // ---- brute force from the bruteForce section ----
    static int maxAreaBrute(int[] height) {
        int n = height.length;
        int best = 0;

        for (int i = 0; i < n; i++) {
            for (int j = i + 1; j < n; j++) {
                int area = Math.min(height[i], height[j]) * (j - i);
                best = Math.max(best, area);
            }
        }

        return best;
    }

    // ---- implementation section ----
    static int maxArea(int[] height) {
        int l = 0, r = height.length - 1;
        int best = 0;

        while (l < r) {
            int area = Math.min(height[l], height[r]) * (r - l);
            best = Math.max(best, area);

            // The shorter line is finished: every narrower partner
            // is capped at its height. Discard it.
            if (height[l] < height[r]) {
                l++;
            } else {
                r--;
            }
        }

        return best;
    }

    // The wrong-pointer trap: move the TALLER line.
    static int maxAreaWrong(int[] height) {
        int l = 0, r = height.length - 1, best = 0;
        while (l < r) {
            best = Math.max(best, Math.min(height[l], height[r]) * (r - l));
            if (height[l] < height[r]) r--; else l++;
        }
        return best;
    }

    static int failures = 0;

    static void check(String label, int[] h, int want) {
        int a = maxAreaBrute(h), b = maxArea(h);
        boolean ok = a == want && b == want;
        if (!ok) failures++;
        System.out.println((ok ? "  ok   " : "  FAIL ") + label + "  " + Arrays.toString(h) + " -> " + b
            + (ok ? "" : "  brute " + a + " expected " + want));
    }

    static void claim(String label, boolean holds) {
        if (!holds) failures++;
        System.out.println((holds ? "  ok   " : "  FAIL ") + label);
    }

    public static void main(String[] args) {
        System.out.println("day 16 - Container With Most Water");

        int[] ex = { 1, 8, 6, 2, 5, 4, 8, 3, 7 };
        check("example",                ex, 49);
        check("two lines equal",        new int[] { 1, 1 }, 1);
        check("two lines different",    new int[] { 1, 2 }, 1);
        check("all the same",           new int[] { 5, 5, 5, 5 }, 15);
        check("strictly increasing",    new int[] { 1, 2, 3, 4, 5 }, 6);
        check("strictly decreasing",    new int[] { 5, 4, 3, 2, 1 }, 6);
        check("all zeros",              new int[] { 0, 0, 0 }, 0);
        check("zero and two",           new int[] { 0, 2 }, 0);
        check("tall lines at the ends", new int[] { 4, 3, 2, 1, 4 }, 16);
        check("tall lines adjacent",    new int[] { 1, 100, 100, 1 }, 100);
        check("answer uses neither end",new int[] { 2, 3, 10, 5, 7, 8, 9 }, 36);

        // The brute-force grid exactly as printed (rows i = 0..7, columns j = 1..8, 0 = blank).
        int[][] grid = {
            { 1, 2, 3, 4, 5, 6, 7, 8 },
            { 0, 6, 4, 15, 16, 40, 18, 49 },
            { 0, 0, 2, 10, 12, 24, 15, 36 },
            { 0, 0, 0, 2, 4, 6, 8, 10 },
            { 0, 0, 0, 0, 4, 10, 9, 20 },
            { 0, 0, 0, 0, 0, 4, 6, 12 },
            { 0, 0, 0, 0, 0, 0, 3, 14 },
            { 0, 0, 0, 0, 0, 0, 0, 3 },
        };
        boolean gridOk = true;
        int pairs = 0, foundAt = -1;
        for (int i = 0; i < 8; i++)
            for (int j = i + 1; j <= 8; j++) {
                pairs++;
                int area = Math.min(ex[i], ex[j]) * (j - i);
                if (grid[i][j - 1] != area) gridOk = false;
                if (area == 49 && foundAt < 0) foundAt = pairs;
            }
        claim("brute-force grid matches all 36 cells", gridOk && pairs == 36);
        claim("49 is the 15th pair checked", foundAt == 15);

        // The two-pointer trace: (l, r, area) for each of the 8 steps.
        int[][] trace = { { 0, 8, 8 }, { 1, 8, 49 }, { 1, 7, 18 }, { 1, 6, 40 },
                          { 1, 5, 16 }, { 1, 4, 15 }, { 1, 3, 4 }, { 1, 2, 6 } };
        List<int[]> got = new ArrayList<>();
        int l = 0, r = ex.length - 1;
        while (l < r) {
            got.add(new int[] { l, r, Math.min(ex[l], ex[r]) * (r - l) });
            if (ex[l] < ex[r]) l++; else r--;
        }
        boolean traceOk = got.size() == trace.length;
        for (int k = 0; traceOk && k < trace.length; k++) traceOk = Arrays.equals(got.get(k), trace[k]);
        claim("two-pointer trace matches the 8-row dry run", traceOk);

        claim("moving the taller line returns 8 on the example", maxAreaWrong(ex) == 8);

        // Randomized: two pointers vs all pairs.
        Random rnd = new Random(16);
        int agree = 0, trials = 600;
        for (int t = 0; t < trials; t++) {
            int n = 2 + rnd.nextInt(40);
            int[] h = new int[n];
            int cap = rnd.nextBoolean() ? 6 : 10001;
            for (int i = 0; i < n; i++) h[i] = rnd.nextInt(cap);
            int a = maxAreaBrute(h), b = maxArea(h);
            if (a == b) agree++;
            else {
                failures++;
                System.out.println("  FAIL random " + Arrays.toString(h) + " brute " + a + " two-pointer " + b);
            }
        }
        System.out.println("  ok   " + agree + "/" + trials + " random cases, two pointers match all pairs");

        System.out.println(failures == 0 ? "  day 16 PASSED" : "  day 16 had " + failures + " FAILURES");
    }
}
