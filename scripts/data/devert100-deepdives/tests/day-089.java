// Correctness assertions for day 89 - House Robber (LC 198).
//
// The published brute force (take / skip recursion), the two-variable
// implementation and the tabulated version are copied verbatim from
// day-089.md. All three are checked on the worked example and every edge case,
// then against an independent oracle - a bitmask over every subset that
// rejects any with two adjacent bits - on random inputs with a fixed seed.

import java.util.*;

class Day89Test {

    // ---- brute force ----
    static int bruteRob(int[] nums) {
        return best(nums, nums.length - 1);
    }

    static int best(int[] nums, int i) {
        if (i < 0) {
            return 0;               // no houses left
        }
        if (i == 0) {
            return nums[0];         // one house: take it
        }
        int skip = best(nums, i - 1);
        int take = nums[i] + best(nums, i - 2);
        return Math.max(skip, take);
    }

    // ---- implementation (two variables) ----
    static int rob(int[] nums) {
        int prev2 = 0;   // best from houses 0..i-2
        int prev1 = 0;   // best from houses 0..i-1
        for (int num : nums) {
            int cur = Math.max(prev1, prev2 + num);   // skip vs take
            prev2 = prev1;
            prev1 = cur;
        }
        return prev1;
    }

    // ---- tabulated version ----
    static int robTab(int[] nums) {
        int n = nums.length;
        if (n == 1) {
            return nums[0];
        }
        int[] dp = new int[n];
        dp[0] = nums[0];
        dp[1] = Math.max(nums[0], nums[1]);
        for (int i = 2; i < n; i++) {
            dp[i] = Math.max(dp[i - 1], dp[i - 2] + nums[i]);
        }
        return dp[n - 1];
    }

    // Oracle: every subset, skip any with adjacent houses.
    static int oracle(int[] nums) {
        int n = nums.length, bestSum = 0;
        for (int mask = 0; mask < (1 << n); mask++) {
            if ((mask & (mask >> 1)) != 0) continue;
            int s = 0;
            for (int i = 0; i < n; i++) if ((mask >> i & 1) == 1) s += nums[i];
            bestSum = Math.max(bestSum, s);
        }
        return bestSum;
    }

    static int failures = 0;

    static void check(String label, int[] in, int want) {
        int a = rob(in), t = robTab(in);
        boolean ok = a == want && t == want;
        String extra = "";
        if (in.length <= 20) {
            int b = bruteRob(in), o = oracle(in);
            ok &= b == want && o == want;
            extra = ", brute " + b + ", subsets " + o;
        }
        if (!ok) failures++;
        String shown = in.length <= 10 ? Arrays.toString(in) : "[" + in.length + " houses]";
        System.out.println((ok ? "  ok   " : "  FAIL ") + label + "  " + shown
            + " -> two-var " + a + ", tab " + t + extra + (ok ? "" : "  expected " + want));
    }

    public static void main(String[] args) {
        System.out.println("day 89 - House Robber");

        check("example",            new int[] { 2, 7, 9, 3, 1 }, 12);
        check("one house",          new int[] { 5 }, 5);
        check("two houses",         new int[] { 1, 2 }, 2);
        check("biggest-first trap", new int[] { 3, 4, 3 }, 6);
        check("alternate trap",     new int[] { 2, 1, 1, 2 }, 4);
        check("LeetCode example",   new int[] { 1, 2, 3, 1 }, 4);
        check("all zeros",          new int[] { 0, 0, 0 }, 0);
        check("all equal, odd",     new int[] { 5, 5, 5, 5, 5 }, 15);
        check("all equal, even",    new int[] { 5, 5, 5, 5 }, 10);
        int[] big = new int[100];
        Arrays.fill(big, 400);
        check("100 houses of 400",  big, 20000);

        // The 13-legal-subsets claim for 5 houses.
        int legal = 0;
        for (int mask = 0; mask < 32; mask++) if ((mask & (mask >> 1)) == 0) legal++;
        boolean legalOk = legal == 13;
        if (!legalOk) failures++;
        System.out.println((legalOk ? "  ok   " : "  FAIL ") + "5 houses: " + legal + " legal subsets of 32");

        // The dp row claimed for [2,1,1,2]: 2, 2, 3, 4.
        int[] in = { 2, 1, 1, 2 };
        int p2 = 0, p1 = 0;
        int[] rows = new int[4];
        for (int i = 0; i < 4; i++) { int c = Math.max(p1, p2 + in[i]); p2 = p1; p1 = c; rows[i] = c; }
        boolean rowsOk = Arrays.equals(rows, new int[] { 2, 2, 3, 4 });
        if (!rowsOk) failures++;
        System.out.println((rowsOk ? "  ok   " : "  FAIL ") + "dp rows for [2,1,1,2] = " + Arrays.toString(rows));

        Random rnd = new Random(89);
        int agree = 0;
        for (int t = 0; t < 500; t++) {
            int n = 1 + rnd.nextInt(16);
            int[] a = new int[n];
            for (int i = 0; i < n; i++) a[i] = rnd.nextInt(4) == 0 ? 0 : rnd.nextInt(401);
            int want = oracle(a);
            if (rob(a) == want && robTab(a) == want && bruteRob(a) == want) agree++;
            else {
                failures++;
                System.out.println("  FAIL random " + Arrays.toString(a) + " expected " + want);
            }
        }
        System.out.println("  ok   " + agree + "/500 random cases match the all-subsets oracle");

        System.out.println(failures == 0 ? "  day 89 PASSED" : "  day 89 had " + failures + " FAILURES");
    }
}
