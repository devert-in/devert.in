// Correctness assertions for day 90 - Unique Paths (LC 62).
//
// Four published versions copied verbatim from day-090.md: the plain recursion,
// the 1D row (implementation), the 2D table and the binomial. All are checked
// on the worked example and every edge case, then against an exact BigInteger
// binomial oracle on random grids drawn from the constraint range (rejecting
// any whose answer exceeds LeetCode's 2 * 10^9 guarantee), fixed seed.

import java.math.BigInteger;
import java.util.*;

class Day90Test {

    // ---- brute force ----
    static int brutePaths(int i, int j) {
        if (i == 0 || j == 0) {
            return 1;   // top row or left column: one straight line
        }
        return brutePaths(i - 1, j) + brutePaths(i, j - 1);   // from above + from left
    }

    static int brute(int m, int n) {
        return brutePaths(m - 1, n - 1);
    }

    // ---- implementation (one row) ----
    static int uniquePaths(int m, int n) {
        int[] row = new int[n];
        Arrays.fill(row, 1);            // top row: one straight path to each cell
        for (int i = 1; i < m; i++) {
            for (int j = 1; j < n; j++) {
                row[j] += row[j - 1];   // from above (old row[j]) + from left
            }
        }
        return row[n - 1];
    }

    // ---- 2D table ----
    static int uniquePaths2D(int m, int n) {
        int[][] dp = new int[m][n];
        for (int i = 0; i < m; i++) {
            dp[i][0] = 1;               // left column
        }
        for (int j = 0; j < n; j++) {
            dp[0][j] = 1;               // top row
        }
        for (int i = 1; i < m; i++) {
            for (int j = 1; j < n; j++) {
                dp[i][j] = dp[i - 1][j] + dp[i][j - 1];
            }
        }
        return dp[m - 1][n - 1];
    }

    // ---- combinatorics ----
    static int uniquePathsMath(int m, int n) {
        long result = 1;
        for (int k = 1; k < m; k++) {
            result = result * (n - 1 + k) / k;   // stays an exact integer each step
        }
        return (int) result;
    }

    // Oracle: exact C(m + n - 2, m - 1).
    static BigInteger binom(int m, int n) {
        int top = m + n - 2, k = m - 1;
        BigInteger r = BigInteger.ONE;
        for (int i = 1; i <= k; i++) r = r.multiply(BigInteger.valueOf(top - k + i)).divide(BigInteger.valueOf(i));
        return r;
    }

    static int failures = 0;

    static void check(String label, int m, int n, long want) {
        int a = uniquePaths(m, n), b = uniquePaths2D(m, n), c = uniquePathsMath(m, n);
        long o = binom(m, n).longValueExact();
        boolean ok = a == want && b == want && c == want && o == want;
        String extra = "";
        if (want <= 1_000_000) {
            int r = brute(m, n);
            ok &= r == want;
            extra = ", brute " + r;
        }
        if (!ok) failures++;
        System.out.println((ok ? "  ok   " : "  FAIL ") + label + "  " + m + "x" + n
            + " -> row " + a + ", 2D " + b + ", binom " + c + extra + (ok ? "" : "  expected " + want));
    }

    public static void main(String[] args) {
        System.out.println("day 90 - Unique Paths");

        check("example",        3, 3, 6);
        check("single cell",    1, 1, 1);
        check("single row",     1, 7, 1);
        check("single column",  7, 1, 1);
        check("2x2",            2, 2, 2);
        check("LC 3x2",         3, 2, 3);
        check("LC 3x7",         3, 7, 28);
        check("symmetry 7x3",   7, 3, 28);
        check("10x10",         10, 10, 48620);
        check("17x17",         17, 17, 601080390);
        check("long and thin", 100, 3, 5050);

        // Prose claims: 100x100 has a 59-digit answer; recursion makes 2*answer-1
        // calls (55 for 3x7, ~1.2 billion for 17x17).
        int digits = binom(100, 100).toString().length();
        long calls37 = 2L * 28 - 1, calls17 = 2L * 601080390 - 1;
        boolean claims = digits == 59 && calls37 == 55 && calls17 > 1_150_000_000L && calls17 < 1_250_000_000L;
        if (!claims) failures++;
        System.out.println((claims ? "  ok   " : "  FAIL ") + "100x100 has " + digits + " digits; calls 3x7 = "
            + calls37 + ", 17x17 = " + calls17);

        // The 3x7 table's bottom row claimed in the optimisation section.
        int[] row = new int[7];
        Arrays.fill(row, 1);
        for (int i = 1; i < 3; i++) for (int j = 1; j < 7; j++) row[j] += row[j - 1];
        boolean rowOk = Arrays.equals(row, new int[] { 1, 3, 6, 10, 15, 21, 28 });
        if (!rowOk) failures++;
        System.out.println((rowOk ? "  ok   " : "  FAIL ") + "3x7 last row " + Arrays.toString(row));

        // Random grids within the constraints whose answer fits the guarantee.
        Random rnd = new Random(90);
        BigInteger limit = BigInteger.valueOf(2_000_000_000L);
        int agree = 0, tried = 0;
        while (tried < 400) {
            int m = 1 + rnd.nextInt(100), n = 1 + rnd.nextInt(100);
            BigInteger want = binom(m, n);
            if (want.compareTo(limit) > 0) continue;
            tried++;
            long w = want.longValue();
            boolean ok = uniquePaths(m, n) == w && uniquePaths2D(m, n) == w && uniquePathsMath(m, n) == w;
            if (w <= 200_000) ok &= brute(m, n) == w;
            if (ok) agree++;
            else { failures++; System.out.println("  FAIL random " + m + "x" + n + " expected " + w); }
        }
        System.out.println("  ok   " + agree + "/400 random in-range grids match C(m+n-2, m-1)");

        System.out.println(failures == 0 ? "  day 90 PASSED" : "  day 90 had " + failures + " FAILURES");
    }
}
