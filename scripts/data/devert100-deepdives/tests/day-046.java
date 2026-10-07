// Correctness assertions for day 46 - Sqrt(x) (LC 69).
//
// The scan brute force, the long-cast binary search, the division variant,
// Newton's method and the Valid Perfect Square follow-up are copied verbatim
// from day-046.md. Every edge case is checked with the output the writeup
// claims; the iteration counts and the big products quoted in the dry runs
// are re-measured; and a seeded random run plus the overflow band compare all
// four sqrt versions against an exact oracle.

import java.util.*;

class Day46Test {

    // ---- brute force ----
    static int sqrtScan(int x) {
        long i = 1;
        while (i * i <= x) {
            i++;
        }
        return (int) (i - 1);
    }

    // ---- implementation ----
    static int mySqrt(int x) {
        int lo = 0;
        int hi = x;
        int ans = 0;
        while (lo <= hi) {
            int mid = lo + (hi - lo) / 2;
            if ((long) mid * mid <= x) {
                ans = mid;
                lo = mid + 1;
            } else {
                hi = mid - 1;
            }
        }
        return ans;
    }

    // ---- division version ----
    static int sqrtDiv(int x) {
        if (x < 2) {
            return x;
        }
        int lo = 1;
        int hi = x / 2;
        int ans = 1;
        while (lo <= hi) {
            int mid = lo + (hi - lo) / 2;
            if (mid <= x / mid) {
                ans = mid;
                lo = mid + 1;
            } else {
                hi = mid - 1;
            }
        }
        return ans;
    }

    // ---- Newton ----
    static int sqrtNewton(int x) {
        long r = x;
        while (r * r > x) {
            r = (r + x / r) / 2;
        }
        return (int) r;
    }

    // ---- follow-up: Valid Perfect Square ----
    static boolean isPerfectSquare(int num) {
        long lo = 1, hi = num;
        while (lo <= hi) {
            long mid = lo + (hi - lo) / 2;
            long sq = mid * mid;
            if (sq == num) return true;
            if (sq < num) lo = mid + 1;
            else hi = mid - 1;
        }
        return false;
    }

    // The int-only bug the writeup warns about (NOT published as a solution).
    static int sqrtIntOnly(int x) {
        int lo = 0, hi = x, ans = 0;
        while (lo <= hi) {
            int mid = lo + (hi - lo) / 2;
            if (mid * mid <= x) { ans = mid; lo = mid + 1; } else hi = mid - 1;
        }
        return ans;
    }

    // Exact oracle via BigInteger.
    static int oracle(int x) {
        return java.math.BigInteger.valueOf(x).sqrt().intValueExact();
    }

    static int failures = 0;

    static void report(boolean ok, String msg) {
        if (!ok) failures++;
        System.out.println((ok ? "  ok   " : "  FAIL ") + msg);
    }

    static void check(String label, int x, int want) {
        int a = sqrtScan(x), b = mySqrt(x), c = sqrtDiv(x), d = sqrtNewton(x);
        boolean ok = a == want && b == want && c == want && d == want;
        report(ok, label + "  x = " + x + " -> " + b
            + (ok ? "" : "  scan " + a + " div " + c + " newton " + d + " expected " + want));
    }

    static int bsIterations(int x) {
        int lo = 0, hi = x, n = 0;
        while (lo <= hi) {
            n++;
            int mid = lo + (hi - lo) / 2;
            if ((long) mid * mid <= x) lo = mid + 1; else hi = mid - 1;
        }
        return n;
    }

    static long scanChecks(int x) {
        long i = 1, n = 0;
        while (true) { n++; if (i * i <= x) i++; else break; }
        return n;
    }

    static int newtonIterations(int x) {
        long r = x; int n = 0;
        while (r * r > x) { n++; r = (r + x / r) / 2; }
        return n;
    }

    public static void main(String[] args) {
        System.out.println("day 46 - Sqrt(x)");

        check("example 4",          4, 2);
        check("example 8",          8, 2);
        check("worked example 30", 30, 5);
        check("zero",               0, 0);
        check("one",                1, 1);
        check("two",                2, 1);
        check("three",              3, 1);
        check("sixteen",           16, 4);
        check("fifteen",           15, 3);
        check("below 46340^2", 2_147_395_599, 46_339);
        check("46340^2",       2_147_395_600, 46_340);
        check("Integer.MAX",   Integer.MAX_VALUE, 46_340);

        report(isPerfectSquare(16) && !isPerfectSquare(14) && isPerfectSquare(1),
            "isPerfectSquare: 16 true, 14 false, 1 true");

        // Overflow claims.
        int i = 46_341;
        report(i * i == -2_147_479_015, "int 46341 * 46341 overflows to " + (i * i));
        report(46_341L * 46_341L == 2_147_488_281L, "46341^2 = 2,147,488,281 as long");
        int m1 = 1_073_741_823;
        report((long) m1 * m1 == 1_152_921_502_459_363_329L && (long) (m1 * m1) != (long) m1 * m1,
            "step 1 product 1,152,921,502,459,363,329; (long)(mid*mid) differs");
        report(536_870_911L * 536_870_911L == 288_230_375_077_969_921L, "step 2 product");
        report(268_435_455L * 268_435_455L == 72_057_593_501_057_025L, "step 3 product");

        boolean firstBad = sqrtIntOnly(92_682) == 65_536;
        for (int x = 0; x < 92_682 && firstBad; x++) if (sqrtIntOnly(x) != oracle(x)) firstBad = false;
        report(firstBad, "int-only mid*mid: correct below 92,682, returns 65,536 at 92,682");

        // Iteration counts quoted in the writeup.
        report(scanChecks(30) == 6 && scanChecks(10_000) == 101 && scanChecks(1_000_000) == 1_001
            && scanChecks(Integer.MAX_VALUE) == 46_341, "scan checks: 6 / 101 / 1,001 / 46,341");
        report(bsIterations(30) == 5, "binary search on 30: 5 iterations (" + bsIterations(30) + ")");
        report(bsIterations(Integer.MAX_VALUE) == 31,
            "binary search on MAX: " + bsIterations(Integer.MAX_VALUE) + " iterations");
        int worst = 0;
        Random rw = new Random(4646);
        for (int t = 0; t < 20000; t++) worst = Math.max(worst, bsIterations(rw.nextInt(Integer.MAX_VALUE)));
        report(worst <= 31, "binary search never exceeds 31 iterations (sampled worst " + worst + ")");
        report(newtonIterations(Integer.MAX_VALUE) == 19,
            "Newton on MAX: " + newtonIterations(Integer.MAX_VALUE) + " iterations");

        // Random + overflow band.
        Random rnd = new Random(46);
        int agree = 0, total = 0;
        for (int t = 0; t < 700; t++) {
            int x;
            if (t < 200) x = t;
            else if (t < 400) x = Integer.MAX_VALUE - rnd.nextInt(200_000);
            else x = rnd.nextInt(Integer.MAX_VALUE);
            total++;
            int want = oracle(x);
            boolean ok = mySqrt(x) == want && sqrtDiv(x) == want && sqrtNewton(x) == want
                && (x > 50_000_000 || sqrtScan(x) == want)
                && isPerfectSquare(Math.max(x, 1)) == ((long) oracle(Math.max(x, 1)) * oracle(Math.max(x, 1)) == Math.max(x, 1));
            if (ok) agree++;
            else { failures++; System.out.println("  FAIL random x = " + x); }
        }
        System.out.println("  ok   " + agree + "/" + total + " random and near-MAX cases match the exact root");

        System.out.println(failures == 0 ? "  day 46 PASSED" : "  day 46 had " + failures + " FAILURES");
    }
}
