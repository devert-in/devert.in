// Correctness assertions for day 93 - 0/1 Knapsack (GFG).
//
// The brute-force recursion, the 1D backwards implementation and the 2D table
// are copied verbatim from day-093.md and must agree on the worked example,
// every edge case, and a few hundred random inputs. The forward-loop variant
// is included only to prove the writeup's claim that it returns 60 on the
// example (i.e. that it really does compute unbounded knapsack).

import java.util.*;

class Day93Test {

    // ---- brute force from the bruteForce section ----
    static int bruteKnapsack(int W, int val[], int wt[]) {
        return best(0, W, val, wt);
    }

    private static int best(int i, int cap, int[] val, int[] wt) {
        if (i == val.length) {
            return 0;
        }

        int skip = best(i + 1, cap, val, wt);

        int take = 0;
        if (wt[i] <= cap) {
            take = val[i] + best(i + 1, cap - wt[i], val, wt);
        }

        return Math.max(skip, take);
    }

    // ---- 1D implementation ----
    static int knapsack(int W, int val[], int wt[]) {

        int n = val.length;

        int[] dp = new int[W + 1];

        for (int i = 0; i < n; i++) {
            for (int w = W; w >= wt[i]; w--) {
                dp[w] = Math.max(dp[w], val[i] + dp[w - wt[i]]);
            }
        }

        return dp[W];
    }

    // ---- 2D version from the implementation section ----
    static int knapsack2D(int W, int val[], int wt[]) {

        int n = val.length;
        int[][] dp = new int[n + 1][W + 1];

        for (int i = 1; i <= n; i++) {
            for (int w = 0; w <= W; w++) {
                dp[i][w] = dp[i - 1][w];
                if (wt[i - 1] <= w) {
                    dp[i][w] = Math.max(dp[i][w],
                                        val[i - 1] + dp[i - 1][w - wt[i - 1]]);
                }
            }
        }

        return dp[n][W];
    }

    // ---- the WRONG forward loop, to prove the 60 claim ----
    static int forwardBug(int W, int val[], int wt[]) {
        int[] dp = new int[W + 1];
        for (int i = 0; i < val.length; i++) {
            for (int w = wt[i]; w <= W; w++) {
                dp[w] = Math.max(dp[w], val[i] + dp[w - wt[i]]);
            }
        }
        return dp[W];
    }

    static int failures = 0;

    static void check(String label, int W, int[] val, int[] wt, int want) {
        int a = knapsack(W, val, wt);
        int b = knapsack2D(W, val, wt);
        int c = bruteKnapsack(W, val, wt);
        boolean ok = a == want && b == want && c == want;
        if (!ok) failures++;
        System.out.println((ok ? "  ok   " : "  FAIL ") + label + "  W=" + W
            + " val=" + Arrays.toString(val) + " wt=" + Arrays.toString(wt)
            + " -> 1D " + a + ", 2D " + b + ", brute " + c
            + (ok ? "" : "  expected " + want));
    }

    static void claim(String label, boolean holds) {
        if (!holds) failures++;
        System.out.println((holds ? "  ok   " : "  FAIL ") + label);
    }

    public static void main(String[] args) {
        System.out.println("day 93 - 0/1 Knapsack");

        int[] val = { 10, 15, 40 }, wt = { 1, 2, 3 };
        check("example",              5, val, wt, 55);
        check("capacity zero",        0, new int[] { 10, 20 }, new int[] { 1, 2 }, 0);
        check("no item fits",         4, new int[] { 10, 20 }, new int[] { 5, 6 }, 0);
        check("everything fits",     10, val, wt, 65);
        check("single exact fit",     3, new int[] { 7 }, new int[] { 3 }, 7);
        check("identical items W=4",  4, new int[] { 5, 5 }, new int[] { 2, 2 }, 10);
        check("identical items W=3",  3, new int[] { 5, 5 }, new int[] { 2, 2 }, 5);

        claim("forward loop returns 60 on the example (unbounded answer)", forwardBug(5, val, wt) == 60);

        // Greedy by ratio gives 50 on the example - the counterexample claim.
        int greedy = 40 + 10; // item 2 then item 0; item 1 no longer fits
        claim("greedy-by-ratio total 50 is below the optimum 55", greedy == 50 && greedy < knapsack(5, val, wt));

        // 2D table rows match the dry run.
        int[][] dp = new int[4][6];
        for (int i = 1; i <= 3; i++)
            for (int w = 0; w <= 5; w++) {
                dp[i][w] = dp[i - 1][w];
                if (wt[i - 1] <= w) dp[i][w] = Math.max(dp[i][w], val[i - 1] + dp[i - 1][w - wt[i - 1]]);
            }
        claim("2D table rows match dry run",
            Arrays.equals(dp[1], new int[] { 0, 10, 10, 10, 10, 10 })
            && Arrays.equals(dp[2], new int[] { 0, 10, 15, 25, 25, 25 })
            && Arrays.equals(dp[3], new int[] { 0, 10, 15, 40, 50, 55 }));

        Random rnd = new Random(93);
        int agree = 0;
        for (int t = 0; t < 400; t++) {
            int n = rnd.nextInt(13);
            int[] v = new int[n], w = new int[n];
            for (int i = 0; i < n; i++) { v[i] = 1 + rnd.nextInt(50); w[i] = 1 + rnd.nextInt(12); }
            int W = rnd.nextInt(40);
            int want = bruteKnapsack(W, v, w);
            if (knapsack(W, v, w) == want && knapsack2D(W, v, w) == want) agree++;
            else {
                failures++;
                System.out.println("  FAIL random W=" + W + " val=" + Arrays.toString(v) + " wt=" + Arrays.toString(w));
            }
        }
        System.out.println("  ok   " + agree + "/400 random cases, 1D and 2D match brute force");

        System.out.println(failures == 0 ? "  day 93 PASSED" : "  day 93 had " + failures + " FAILURES");
    }
}
