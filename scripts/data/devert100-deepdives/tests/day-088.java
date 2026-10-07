// Correctness assertions for day 88 - Climbing Stairs (LC 70).
//
// All four published forms (plain recursion, memo, tabulation, two variables)
// are copied verbatim from day-088.md. They must agree with each other and with
// an independent oracle (direct enumeration of every 1/2-step sequence for
// small n, BigInteger Fibonacci for the rest), on the worked example and on
// every edge case the writeup lists - including the n = 46 overflow claim.

import java.math.BigInteger;
import java.util.*;

class Day88Test {

    // ---- brute force (plain recursion) ----
    static int brute(int n) {
        if (n <= 1) {
            return 1;
        }
        return brute(n - 1) + brute(n - 2);
    }

    // ---- implementation (two variables) ----
    static int climbStairs(int n) {
        int prev2 = 1;   // ways(0): one way to climb nothing
        int prev1 = 1;   // ways(1): a single 1-step
        for (int i = 2; i <= n; i++) {
            int cur = prev1 + prev2;   // last move was 1-step or 2-step
            prev2 = prev1;             // slide the window forward
            prev1 = cur;
        }
        return prev1;   // for n = 1 the loop never runs: ways(1) = 1
    }

    // ---- memoised version ----
    static int climbMemo(int n) {
        int[] memo = new int[n + 1];   // 0 means "not computed yet"
        return ways(n, memo);
    }

    static int ways(int i, int[] memo) {
        if (i <= 1) {
            return 1;
        }
        if (memo[i] != 0) {
            return memo[i];            // already answered - reuse it
        }
        memo[i] = ways(i - 1, memo) + ways(i - 2, memo);
        return memo[i];
    }

    // ---- tabulation version ----
    static int climbTab(int n) {
        int[] dp = new int[n + 1];
        dp[0] = 1;
        dp[1] = 1;
        for (int i = 2; i <= n; i++) {
            dp[i] = dp[i - 1] + dp[i - 2];
        }
        return dp[n];
    }

    // Oracle 1: literally enumerate every sequence of 1s and 2s summing to n.
    static int enumerate(int remaining) {
        if (remaining == 0) return 1;
        if (remaining < 0) return 0;
        return enumerate(remaining - 1) + enumerate(remaining - 2);
    }

    // Oracle 2: exact Fibonacci in BigInteger, ways(n) = F(n + 1).
    static BigInteger fib(int k) {
        BigInteger a = BigInteger.ZERO, b = BigInteger.ONE;
        for (int i = 0; i < k; i++) { BigInteger t = a.add(b); a = b; b = t; }
        return a;
    }

    static int failures = 0;

    static void check(String label, int n, long want) {
        int a = climbStairs(n), m = climbMemo(n), t = climbTab(n);
        boolean ok = a == want && m == want && t == want;
        String extra = "";
        if (n <= 30) {
            int b = brute(n);
            ok &= b == want;
            extra = ", brute " + b;
        }
        if (!ok) failures++;
        System.out.println((ok ? "  ok   " : "  FAIL ") + label + "  n=" + n
            + " -> two-var " + a + ", memo " + m + ", tab " + t + extra
            + (ok ? "" : "  expected " + want));
    }

    public static void main(String[] args) {
        System.out.println("day 88 - Climbing Stairs");

        check("example",       5, 8);
        check("one step",      1, 1);
        check("two steps",     2, 2);
        check("three steps",   3, 3);
        check("mid-sized",    10, 89);
        check("upper bound",  45, 1836311903L);

        // n = 1..10 sequence claimed in the edge-case section.
        int[] seq = { 1, 2, 3, 5, 8, 13, 21, 34, 55, 89 };
        boolean seqOk = true;
        for (int n = 1; n <= 10; n++) seqOk &= climbStairs(n) == seq[n - 1];
        if (!seqOk) failures++;
        System.out.println((seqOk ? "  ok   " : "  FAIL ") + "n=1..10 gives 1,2,3,5,8,13,21,34,55,89");

        // n = 46 claim: true answer 2971215073, int wraps to -1323752223.
        long true46 = fib(47).longValue();
        int wrapped = climbStairs(46);
        boolean ovOk = true46 == 2971215073L && wrapped == -1323752223;
        if (!ovOk) failures++;
        System.out.println((ovOk ? "  ok   " : "  FAIL ") + "n=46 true " + true46 + ", int gives " + wrapped);

        // Call-count claims: 15 calls for n=5 plain, 9 memoised; ~3.7e9 for n=45.
        long calls5 = 2 * fib(6).longValue() - 1;
        long calls45 = 2 * fib(46).longValue() - 1;
        boolean callsOk = calls5 == 15 && calls45 > 3_600_000_000L && calls45 < 3_700_000_000L;
        if (!callsOk) failures++;
        System.out.println((callsOk ? "  ok   " : "  FAIL ") + "plain-recursion calls: n=5 " + calls5 + ", n=45 " + calls45);

        // Exhaustive over the whole constraint range against BigInteger Fibonacci,
        // plus enumeration for small n.
        int agree = 0;
        for (int n = 1; n <= 45; n++) {
            long want = fib(n + 1).longValue();
            boolean ok = climbStairs(n) == want && climbMemo(n) == want && climbTab(n) == want;
            if (n <= 25) ok &= enumerate(n) == want && brute(n) == want;
            if (ok) agree++;
            else { failures++; System.out.println("  FAIL n=" + n); }
        }
        System.out.println("  ok   " + agree + "/45 values of n agree with Fibonacci oracle");

        // Randomised: 300 draws from the range, fixed seed.
        Random rnd = new Random(88);
        int r = 0;
        for (int t = 0; t < 300; t++) {
            int n = 1 + rnd.nextInt(45);
            long want = fib(n + 1).longValue();
            if (climbStairs(n) == want && climbMemo(n) == want && climbTab(n) == want) r++;
            else { failures++; System.out.println("  FAIL random n=" + n); }
        }
        System.out.println("  ok   " + r + "/300 random cases");

        System.out.println(failures == 0 ? "  day 88 PASSED" : "  day 88 had " + failures + " FAILURES");
    }
}
