// Correctness assertions for day 87 - Minimum Number of Coins (Greedy, GFG).
//
// The DP baseline, the greedy and the parameterised greedyCount are copied
// verbatim from day-087.md. Checks: the N = 18 DP table (dp and pick columns,
// row by row), the worked examples, every edge case with its claimed output,
// the `if`-instead-of-`while` claim, the {1,3,4} counterexample, and an
// exhaustive greedy-vs-DP comparison over every N from 1 to 5000 (which also
// confirms the greedy's output is in descending order).

import java.util.*;

class Day87Test {

    static final int[] COINS = { 2000, 500, 200, 100, 50, 20, 10, 5, 2, 1 };

    // ---- brute force (DP), from the bruteForce section ----
    static List<Integer> minPartitionDp(int N) {
        int[] coins = { 2000, 500, 200, 100, 50, 20, 10, 5, 2, 1 };
        int[] dp = new int[N + 1];
        int[] pick = new int[N + 1];
        for (int a = 1; a <= N; a++) {
            dp[a] = Integer.MAX_VALUE;
            for (int coin : coins) {
                if (coin <= a && dp[a - coin] + 1 < dp[a]) {
                    dp[a] = dp[a - coin] + 1;
                    pick[a] = coin;
                }
            }
        }
        List<Integer> result = new ArrayList<>();
        for (int a = N; a > 0; a -= pick[a]) {
            result.add(pick[a]);
        }
        return result;
    }

    // ---- optimal, from the implementation section ----
    static List<Integer> minPartition(int N) {
        int[] coins = { 2000, 500, 200, 100, 50, 20, 10, 5, 2, 1 };
        List<Integer> result = new ArrayList<>();
        int remaining = N;
        for (int coin : coins) {
            while (remaining >= coin) {
                result.add(coin);
                remaining -= coin;
            }
        }
        return result;
    }

    // ---- counterexample helper, from the implementation section ----
    static int greedyCount(int[] coinsDescending, int amount) {
        int count = 0;
        for (int coin : coinsDescending) {
            while (amount >= coin) {
                amount -= coin;
                count++;
            }
        }
        return amount == 0 ? count : -1;
    }

    // The `if` bug from the takeaway.
    static List<Integer> withIf(int N) {
        List<Integer> result = new ArrayList<>();
        int remaining = N;
        for (int coin : COINS) if (remaining >= coin) { result.add(coin); remaining -= coin; }
        return result;
    }

    // General min-coin DP (any coin set) for the counterexample.
    static int dpCount(int[] coins, int amount) {
        int[] dp = new int[amount + 1];
        Arrays.fill(dp, Integer.MAX_VALUE);
        dp[0] = 0;
        for (int a = 1; a <= amount; a++)
            for (int c : coins)
                if (c <= a && dp[a - c] != Integer.MAX_VALUE) dp[a] = Math.min(dp[a], dp[a - c] + 1);
        return dp[amount];
    }

    static int failures = 0;

    static void claim(String label, boolean holds) {
        if (!holds) failures++;
        System.out.println((holds ? "  ok   " : "  FAIL ") + label);
    }

    static void check(String label, int N, List<Integer> want) {
        List<Integer> g = minPartition(N), d = minPartitionDp(N);
        boolean ok = g.equals(want) && d.equals(want);
        if (!ok) failures++;
        System.out.println((ok ? "  ok   " : "  FAIL ") + label + "  N=" + N + " -> " + g
            + (ok ? "" : "  dp " + d + "  expected " + want));
    }

    public static void main(String[] args) {
        System.out.println("day 87 - Minimum Number of Coins (Greedy)");

        check("example 18",   18,   List.of(10, 5, 2, 1));
        check("GFG 43",       43,   List.of(20, 20, 2, 1));
        check("GFG 1000",     1000, List.of(500, 500));
        check("smallest",     1,    List.of(1));
        check("one note",     2000, List.of(2000));
        check("small 3",      3,    List.of(2, 1));
        check("small 4",      4,    List.of(2, 2));
        check("small 9",      9,    List.of(5, 2, 2));
        check("densest 1999", 1999, List.of(500, 500, 500, 200, 200, 50, 20, 20, 5, 2, 2));

        List<Integer> million = minPartition(1000000);
        claim("N = 10^6 -> 500 notes of 2000: size " + million.size(),
            million.size() == 500 && million.stream().allMatch(x -> x == 2000));

        // The N = 18 DP table, row by row.
        int[] wantDp   = { 0, 1, 1, 2, 2, 1, 2, 2, 3, 3, 1, 2, 2, 3, 3, 2, 3, 3, 4 };
        int[] wantPick = { 0, 1, 2, 2, 2, 5, 5, 5, 5, 5, 10, 10, 10, 10, 10, 10, 10, 10, 10 };
        int[] dp = new int[19], pick = new int[19];
        for (int a = 1; a <= 18; a++) {
            dp[a] = Integer.MAX_VALUE;
            for (int coin : COINS) if (coin <= a && dp[a - coin] + 1 < dp[a]) { dp[a] = dp[a - coin] + 1; pick[a] = coin; }
        }
        claim("DP table dp[0..18] matches the writeup: " + Arrays.toString(dp), Arrays.equals(dp, wantDp));
        claim("DP table pick[0..18] matches the writeup: " + Arrays.toString(pick), Arrays.equals(pick, wantPick));
        // Candidate columns dp[a-c]+1 for c in {10,5,2,1}; "-" encoded as 0.
        int[][] cand = {
            {0,0,0,0},{0,0,0,1},{0,0,1,2},{0,0,2,2},{0,0,2,3},{0,1,3,3},{0,2,3,2},{0,2,2,3},{0,3,3,3},{0,3,3,4},
            {1,2,4,4},{2,3,4,2},{2,3,2,3},{3,4,3,3},{3,4,3,4},{2,2,4,4},{3,3,4,3},{3,3,3,4},{4,4,4,4} };
        int[] cs = { 10, 5, 2, 1 };
        boolean candOk = true;
        for (int a = 1; a <= 18; a++)
            for (int k = 0; k < 4; k++) {
                int v = cs[k] <= a ? dp[a - cs[k]] + 1 : 0;
                if (v != cand[a][k]) { candOk = false; System.out.println("  FAIL candidate a=" + a + " c=" + cs[k] + " is " + v); }
            }
        claim("DP candidate columns for a = 1..18 match the writeup", candOk);

        claim("`if` instead of `while` on 43 gives [20, 10, 5, 2, 1] (sum 38): " + withIf(43),
            withIf(43).equals(List.of(20, 10, 5, 2, 1)));
        claim("{4,3,1}, 6: greedy " + greedyCount(new int[] { 4, 3, 1 }, 6) + ", optimal " + dpCount(new int[] { 4, 3, 1 }, 6),
            greedyCount(new int[] { 4, 3, 1 }, 6) == 3 && dpCount(new int[] { 4, 3, 1 }, 6) == 2);
        claim("greedyCount on Indian coins, 43 -> 4", greedyCount(COINS, 43) == 4);

        int agree = 0;
        for (int N = 1; N <= 5000; N++) {
            List<Integer> g = minPartition(N), d = minPartitionDp(N);
            int sum = 0; boolean desc = true;
            for (int i = 0; i < g.size(); i++) { sum += g.get(i); if (i > 0 && g.get(i) > g.get(i - 1)) desc = false; }
            if (g.size() == d.size() && sum == N && desc) agree++;
            else { failures++; System.out.println("  FAIL N=" + N + " greedy " + g + " dp " + d); }
        }
        System.out.println("  ok   " + agree + "/5000 amounts: greedy count == DP count, sums to N, descending");

        System.out.println(failures == 0 ? "  day 87 PASSED" : "  day 87 had " + failures + " FAILURES");
    }
}
