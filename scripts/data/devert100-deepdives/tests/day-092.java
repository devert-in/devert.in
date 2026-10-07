// Correctness assertions for day 92 - Coin Change II (LC 518).
//
// The brute-force recursion, the 1D implementation, the 2D table and the
// contrasting Combination Sum IV loop are copied verbatim from day-092.md.
// Checked on the worked example, every edge case, the prose claims (dp rows,
// 36 calls / 23 distinct, swapped loops give 9), and 500 random cases against
// an independent oracle that enumerates multisets as count vectors.

import java.util.*;

class Day92Test {

    // ---- brute force ----
    static int bruteChange(int amount, int[] coins) {
        return ways(coins, 0, amount);
    }

    static int ways(int[] coins, int i, int a) {
        if (a == 0) {
            return 1;                                  // complete combination
        }
        if (i == coins.length) {
            return 0;                                  // amount left, no coins left
        }
        int take = 0;
        if (coins[i] <= a) {
            take = ways(coins, i, a - coins[i]);       // one more coins[i], stay on i
        }
        int skip = ways(coins, i + 1, a);              // done with coins[i] for good
        return take + skip;
    }

    // ---- implementation ----
    static int change(int amount, int[] coins) {
        int[] dp = new int[amount + 1];
        dp[0] = 1;                                // the empty combination
        for (int coin : coins) {                  // coins OUTER: each multiset counted once
            for (int a = coin; a <= amount; a++) {
                dp[a] += dp[a - coin];            // combinations using at least one more `coin`
            }
        }
        return dp[amount];
    }

    // ---- 2D version ----
    static int change2D(int amount, int[] coins) {
        int n = coins.length;
        int[][] dp = new int[n + 1][amount + 1];
        for (int i = 0; i <= n; i++) {
            dp[i][0] = 1;
        }
        for (int i = 1; i <= n; i++) {
            int coin = coins[i - 1];
            for (int a = 1; a <= amount; a++) {
                dp[i][a] = dp[i - 1][a];                 // without this coin
                if (coin <= a) {
                    dp[i][a] += dp[i][a - coin];         // with at least one more of it
                }
            }
        }
        return dp[n][amount];
    }

    // ---- LC 377 contrast ----
    static int combinationSum4(int[] nums, int target) {
        int[] dp = new int[target + 1];
        dp[0] = 1;
        for (int a = 1; a <= target; a++) {      // amounts OUTER: orderings counted
            for (int num : nums) {
                if (num <= a) {
                    dp[a] += dp[a - num];
                }
            }
        }
        return dp[target];
    }

    // Oracle: enumerate count vectors (how many of each coin), independent of
    // any take/skip or table logic.
    static long oracle(int[] coins, int idx, int remaining) {
        if (idx == coins.length) return remaining == 0 ? 1 : 0;
        long total = 0;
        for (int k = 0; k * coins[idx] <= remaining; k++) total += oracle(coins, idx + 1, remaining - k * coins[idx]);
        return total;
    }

    static int calls = 0;
    static Set<String> distinct = new HashSet<>();
    static int countWays(int[] coins, int i, int a) {
        calls++; distinct.add(i + "," + a);
        if (a == 0) return 1;
        if (i == coins.length) return 0;
        int take = coins[i] <= a ? countWays(coins, i, a - coins[i]) : 0;
        return take + countWays(coins, i + 1, a);
    }

    static int failures = 0;

    static void check(String label, int amount, int[] coins, int want) {
        int d = change(amount, coins), t = change2D(amount, coins);
        boolean ok = d == want && t == want;
        String extra = "";
        if (amount <= 60) {
            int b = bruteChange(amount, coins);
            long o = oracle(coins, 0, amount);
            ok &= b == want && o == want;
            extra = ", brute " + b + ", oracle " + o;
        }
        if (!ok) failures++;
        System.out.println((ok ? "  ok   " : "  FAIL ") + label + "  amount=" + amount + " coins="
            + Arrays.toString(coins) + " -> 1D " + d + ", 2D " + t + extra + (ok ? "" : "  expected " + want));
    }

    public static void main(String[] args) {
        System.out.println("day 92 - Coin Change II");

        check("example",          5, new int[] { 1, 2, 5 }, 4);
        check("amount zero",      0, new int[] { 7 }, 1);
        check("unreachable",      3, new int[] { 2 }, 0);
        check("exactly one coin", 10, new int[] { 10 }, 1);
        check("unsorted coins",   10, new int[] { 2, 5, 3, 6 }, 5);
        check("only coin 1",      5000, new int[] { 1 }, 1);
        check("large count",      500, new int[] { 3, 5, 7, 8, 9, 10, 11 }, 35502874);

        // Swapped loops give the ordered count, 9.
        int perm = combinationSum4(new int[] { 1, 2, 5 }, 5);
        boolean permOk = perm == 9;
        if (!permOk) failures++;
        System.out.println((permOk ? "  ok   " : "  FAIL ") + "amounts outer on [1,2,5], 5 -> " + perm + " (orderings)");

        // dp after each coin pass for the worked example.
        int[] dp = new int[6]; dp[0] = 1;
        List<String> passes = new ArrayList<>();
        for (int coin : new int[] { 1, 2, 5 }) {
            for (int a = coin; a <= 5; a++) dp[a] += dp[a - coin];
            passes.add(Arrays.toString(dp));
        }
        boolean passOk = passes.equals(List.of("[1, 1, 1, 1, 1, 1]", "[1, 1, 2, 2, 3, 3]", "[1, 1, 2, 2, 3, 4]"));
        if (!passOk) failures++;
        System.out.println((passOk ? "  ok   " : "  FAIL ") + "dp after each coin: " + passes);

        // Unreachable dp row claim: [1, 0, 1, 0].
        int[] dp2 = new int[4]; dp2[0] = 1;
        for (int a = 2; a <= 3; a++) dp2[a] += dp2[a - 2];
        boolean uOk = Arrays.equals(dp2, new int[] { 1, 0, 1, 0 });
        if (!uOk) failures++;
        System.out.println((uOk ? "  ok   " : "  FAIL ") + "coins [2], amount 3 dp = " + Arrays.toString(dp2));

        // Brute-force call counts from the dry run.
        countWays(new int[] { 1, 2, 5 }, 0, 5);
        boolean callsOk = calls == 36 && distinct.size() == 23;
        if (!callsOk) failures++;
        System.out.println((callsOk ? "  ok   " : "  FAIL ") + "brute force: " + calls + " calls, " + distinct.size() + " distinct (i, a)");

        // Random: 1D, 2D, brute force and count-vector oracle must agree.
        Random rnd = new Random(92);
        int agree = 0;
        for (int t = 0; t < 500; t++) {
            int k = 1 + rnd.nextInt(4);
            LinkedHashSet<Integer> set = new LinkedHashSet<>();
            while (set.size() < k) set.add(1 + rnd.nextInt(12));
            int[] coins = set.stream().mapToInt(Integer::intValue).toArray();
            int amount = rnd.nextInt(41);
            long want = oracle(coins, 0, amount);
            if (change(amount, coins) == want && change2D(amount, coins) == want && bruteChange(amount, coins) == want) agree++;
            else {
                failures++;
                System.out.println("  FAIL random amount=" + amount + " coins=" + Arrays.toString(coins) + " expected " + want);
            }
        }
        System.out.println("  ok   " + agree + "/500 random cases match the count-vector oracle");

        System.out.println(failures == 0 ? "  day 92 PASSED" : "  day 92 had " + failures + " FAILURES");
    }
}
