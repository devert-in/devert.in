// Correctness assertions for day 48 - Find Peak Element (LC 162).
//
// The first-step-down scan, the slope binary search, the mountain-array
// follow-up (LC 852) and the 2D follow-up (LC 1901) are copied verbatim from
// day-048.md. Every edge case is checked with the exact index the writeup
// claims, the dry-run iteration counts are re-measured, the `hi = mid - 1`
// bug is shown to return a non-peak, and seeded random arrays and grids are
// checked for validity (the answer must BE a peak, since any peak is accepted).

import java.util.*;

class Day48Test {

    // ---- brute force ----
    static int peakScan(int[] nums) {
        for (int i = 0; i < nums.length - 1; i++) {
            if (nums[i] > nums[i + 1]) {
                return i;
            }
        }
        return nums.length - 1;
    }

    // ---- implementation ----
    static int iterations = 0;   // instrumentation only

    static int findPeakElement(int[] nums) {
        int lo = 0;
        int hi = nums.length - 1;
        while (lo < hi) {
            iterations++;
            int mid = lo + (hi - lo) / 2;
            if (nums[mid] < nums[mid + 1]) {
                lo = mid + 1;
            } else {
                hi = mid;
            }
        }
        return lo;
    }

    // ---- follow-up: LC 852 ----
    static int peakIndexInMountainArray(int[] arr) {
        int lo = 0, hi = arr.length - 1;
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (arr[mid] < arr[mid + 1]) lo = mid + 1;
            else hi = mid;
        }
        return lo;
    }

    // ---- follow-up: LC 1901 ----
    static int[] findPeakGrid(int[][] mat) {
        int lo = 0, hi = mat.length - 1;
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            int c = maxCol(mat[mid]);
            if (mat[mid][c] < mat[mid + 1][c]) lo = mid + 1;
            else hi = mid;
        }
        return new int[] { lo, maxCol(mat[lo]) };
    }

    static int maxCol(int[] row) {
        int best = 0;
        for (int j = 1; j < row.length; j++) {
            if (row[j] > row[best]) best = j;
        }
        return best;
    }

    // ---- the bug the writeup warns about ----
    static int peakMinusOneBug(int[] nums) {
        int lo = 0, hi = nums.length - 1;
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (nums[mid] < nums[mid + 1]) lo = mid + 1; else hi = mid - 1;
        }
        return lo;
    }

    static boolean isPeak(int[] a, int i) {
        if (i < 0 || i >= a.length) return false;
        boolean left = i == 0 || a[i - 1] < a[i];
        boolean right = i == a.length - 1 || a[i + 1] < a[i];
        return left && right;
    }

    static boolean isGridPeak(int[][] m, int r, int c) {
        int v = m[r][c];
        int[][] d = { { 1, 0 }, { -1, 0 }, { 0, 1 }, { 0, -1 } };
        for (int[] x : d) {
            int rr = r + x[0], cc = c + x[1];
            if (rr >= 0 && rr < m.length && cc >= 0 && cc < m[0].length && m[rr][cc] >= v) return false;
        }
        return true;
    }

    static int failures = 0;

    static void report(boolean ok, String msg) {
        if (!ok) failures++;
        System.out.println((ok ? "  ok   " : "  FAIL ") + msg);
    }

    static void check(String label, int[] nums, int want) {
        int b = findPeakElement(nums);
        boolean ok = b == want && isPeak(nums, b) && isPeak(nums, peakScan(nums));
        report(ok, label + "  " + Arrays.toString(nums) + " -> " + b + (ok ? "" : "  expected " + want));
    }

    public static void main(String[] args) {
        System.out.println("day 48 - Find Peak Element");

        int[] ex1 = { 1, 2, 3, 1 };
        int[] ex2 = { 1, 2, 1, 3, 5, 6, 4 };
        check("example 1",          ex1, 2);
        check("example 2",          ex2, 5);
        report(peakScan(ex1) == 2 && peakScan(ex2) == 1, "scan returns 2 and 1 on the examples");
        check("single",             new int[] { 1 }, 0);
        check("two up",             new int[] { 1, 2 }, 1);
        check("two down",           new int[] { 2, 1 }, 0);
        check("increasing",         new int[] { 1, 2, 3, 4, 5 }, 4);
        check("decreasing",         new int[] { 5, 4, 3, 2, 1 }, 0);
        check("valley",             new int[] { 3, 1, 2 }, 2);
        check("keep mid",           new int[] { 1, 3, 2 }, 1);
        check("MIN only",           new int[] { Integer.MIN_VALUE }, 0);
        check("MIN, MAX",           new int[] { Integer.MIN_VALUE, Integer.MAX_VALUE }, 1);

        report(peakIndexInMountainArray(new int[] { 0, 1, 0 }) == 1
            && peakIndexInMountainArray(new int[] { 0, 10, 5, 2 }) == 1, "LC 852: [0,1,0] -> 1, [0,10,5,2] -> 1");

        int bad = peakMinusOneBug(new int[] { 1, 3, 2 });
        report(!isPeak(new int[] { 1, 3, 2 }, bad), "hi = mid - 1 on [1,3,2] returns " + bad + ", not a peak");

        // Dry-run iteration counts.
        iterations = 0; findPeakElement(ex1);
        report(iterations == 2, "example 1: 2 iterations (" + iterations + ")");
        iterations = 0; findPeakElement(ex2);
        report(iterations == 3, "example 2: 3 iterations (" + iterations + ")");
        int[] inc7 = { 1, 2, 3, 4, 5, 6, 7 };
        iterations = 0; int p = findPeakElement(inc7);
        report(iterations == 2 && p == 6 && peakScan(inc7) == 6, "increasing 7: 2 iterations, index 6 (scan agrees)");

        // n = 1000: never more than 10 iterations.
        Random rnd = new Random(48);
        int worst = 0, agree = 0;
        for (int t = 0; t < 600; t++) {
            int n = t < 100 ? 1000 : 1 + rnd.nextInt(40);
            int[] a = new int[n];
            a[0] = rnd.nextInt(2001) - 1000;
            for (int i = 1; i < n; i++) {
                int step = 1 + rnd.nextInt(5);
                a[i] = a[i - 1] + (rnd.nextBoolean() ? step : -step);   // no equal neighbours
            }
            iterations = 0;
            int r = findPeakElement(a);
            if (n == 1000) worst = Math.max(worst, iterations);
            if (isPeak(a, r) && isPeak(a, peakScan(a))) agree++;
            else { failures++; System.out.println("  FAIL random " + Arrays.toString(a)); }
        }
        System.out.println("  ok   " + agree + "/600 random arrays: both versions return a real peak");
        report(worst <= 10, "n = 1000: at most " + worst + " iterations (claim: 10)");

        // Mountains.
        int mAgree = 0;
        for (int t = 0; t < 300; t++) {
            int n = 3 + rnd.nextInt(30);
            int top = 1 + rnd.nextInt(n - 2);
            int[] a = new int[n];
            for (int i = 1; i <= top; i++) a[i] = a[i - 1] + 1 + rnd.nextInt(3);
            for (int i = top + 1; i < n; i++) a[i] = a[i - 1] - 1 - rnd.nextInt(3);
            if (peakIndexInMountainArray(a) == top) mAgree++;
            else { failures++; System.out.println("  FAIL mountain " + Arrays.toString(a)); }
        }
        System.out.println("  ok   " + mAgree + "/300 mountains: exact peak index");

        // Grids with distinct values (adjacent cells always differ).
        int gAgree = 0;
        for (int t = 0; t < 300; t++) {
            int m = 1 + rnd.nextInt(8), n = 1 + rnd.nextInt(8);
            List<Integer> vals = new ArrayList<>();
            for (int i = 0; i < m * n; i++) vals.add(i);
            Collections.shuffle(vals, rnd);
            int[][] g = new int[m][n];
            for (int i = 0; i < m * n; i++) g[i / n][i % n] = vals.get(i);
            int[] rc = findPeakGrid(g);
            if (isGridPeak(g, rc[0], rc[1])) gAgree++;
            else { failures++; System.out.println("  FAIL grid " + Arrays.deepToString(g)); }
        }
        System.out.println("  ok   " + gAgree + "/300 grids: LC 1901 returns a real 2D peak");

        System.out.println(failures == 0 ? "  day 48 PASSED" : "  day 48 had " + failures + " FAILURES");
    }
}
