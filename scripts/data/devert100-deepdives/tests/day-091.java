// Correctness assertions for day 91 - Coin Change (LC 322).
//
// The brute-force recursion, the bottom-up implementation and the memoised
// version are copied verbatim from day-091.md. Checked on the worked example,
// every edge case, the prose claims (dp rows, greedy's wrong answer, call
// counts), and 500 random small cases where all three must agree. The brute
// force is an independent oracle: it shares no table or sentinel logic.

import java.util.*;

class Day91Test {

    // ---- brute force ----
    static int bruteCoinChange(int[] coins, int amount) {
        if (amount == 0) {
            return 0;                       // nothing left to pay
        }
        int best = -1;                      // -1 = no way found yet
        for (int coin : coins) {
            if (coin <= amount) {
                int sub = bruteCoinChange(coins, amount - coin);
                if (sub != -1 && (best == -1 || sub + 1 < best)) {
                    best = sub + 1;         // this coin last, plus the best for the rest
                }
            }
        }
        return best;
    }

    // ---- implementation ----
    static int coinChange(int[] coins, int amount) {
        int[] dp = new int[amount + 1];
        Arrays.fill(dp, amount + 1);   // "impossible": more coins than any real answer
        dp[0] = 0;                     // zero coins make zero
        for (int a = 1; a <= amount; a++) {
            for (int coin : coins) {
                if (coin <= a) {
                    dp[a] = Math.min(dp[a], dp[a - coin] + 1);   // coin as the last coin
                }
            }
        }
        return dp[amount] > amount ? -1 : dp[amount];
    }

    // ---- memoised version ----
    static int coinChangeMemo(int[] coins, int amount) {
        int[] memo = new int[amount + 1];
        Arrays.fill(memo, -2);              // -2 = not computed; -1 = impossible
        return best(coins, amount, memo);
    }

    static int best(int[] coins, int a, int[] memo) {
        if (a == 0) {
            return 0;
        }
        if (memo[a] != -2) {
            return memo[a];
        }
        int result = -1;
        for (int coin : coins) {
            if (coin <= a) {
                int sub = best(coins, a - coin, memo);
                if (sub != -1 && (result == -1 || sub + 1 < result)) {
                    result = sub + 1;
                }
            }
        }
        memo[a] = result;
        return result;
    }

    // Instrumented copy of the brute force, only to count calls for the prose.
    static long calls = 0;
    static int countCalls(int[] coins, int amount) {
        calls++;
        if (amount == 0) return 0;
        int b = -1;
        for (int coin : coins) if (coin <= amount) {
            int sub = countCalls(coins, amount - coin);
            if (sub != -1 && (b == -1 || sub + 1 < b)) b = sub + 1;
        }
        return b;
    }

    static int greedy(int[] coins, int amount) {
        int[] c = coins.clone();
        Arrays.sort(c);
        int used = 0;
        for (int i = c.length - 1; i >= 0; i--) while (amount >= c[i]) { amount -= c[i]; used++; }
        return amount == 0 ? used : -1;
    }

    static int failures = 0;

    static void check(String label, int[] coins, int amount, int want) {
        int d = coinChange(coins, amount);
        boolean ok = d == want;
        String extra = "";
        if (amount <= 2000) { int m = coinChangeMemo(coins, amount); ok &= m == want; extra += ", memo " + m; }
        if (amount <= 30)   { int b = bruteCoinChange(coins, amount); ok &= b == want; extra += ", brute " + b; }
        if (!ok) failures++;
        System.out.println((ok ? "  ok   " : "  FAIL ") + label + "  coins=" + Arrays.toString(coins)
            + " amount=" + amount + " -> dp " + d + extra + (ok ? "" : "  expected " + want));
    }

    public static void main(String[] args) {
        System.out.println("day 91 - Coin Change");

        check("example",               new int[] { 1, 3, 4 }, 6, 2);
        check("LC example 1",          new int[] { 1, 2, 5 }, 11, 3);
        check("unreachable",           new int[] { 2 }, 3, -1);
        check("amount zero",           new int[] { 1 }, 0, 0);
        check("single coin exact",     new int[] { 1 }, 1, 1);
        check("huge coin",             new int[] { 2147483647 }, 2, -1);
        check("all coins too big",     new int[] { 5, 10 }, 3, -1);
        check("only coin 1",           new int[] { 1 }, 10000, 10000);
        check("awkward denominations", new int[] { 186, 419, 83, 408 }, 6249, 20);

        // dp array for the worked example, and greedy's wrong answer.
        int[] dp = new int[7];
        Arrays.fill(dp, 7); dp[0] = 0;
        for (int a = 1; a <= 6; a++) for (int c : new int[] { 1, 3, 4 }) if (c <= a) dp[a] = Math.min(dp[a], dp[a - c] + 1);
        boolean dpOk = Arrays.equals(dp, new int[] { 0, 1, 2, 1, 1, 2, 2 });
        if (!dpOk) failures++;
        System.out.println((dpOk ? "  ok   " : "  FAIL ") + "dp for [1,3,4], 6 = " + Arrays.toString(dp));

        int g = greedy(new int[] { 1, 3, 4 }, 6);
        boolean gOk = g == 3;
        if (!gOk) failures++;
        System.out.println((gOk ? "  ok   " : "  FAIL ") + "greedy on [1,3,4], 6 uses " + g + " coins (DP: 2)");

        // Call counts: 24 for [1,3,4], 6; 527 for [1,2,5], 11.
        calls = 0; countCalls(new int[] { 1, 3, 4 }, 6); long c1 = calls;
        calls = 0; countCalls(new int[] { 1, 2, 5 }, 11); long c2 = calls;
        boolean callsOk = c1 == 24 && c2 == 527;
        if (!callsOk) failures++;
        System.out.println((callsOk ? "  ok   " : "  FAIL ") + "brute calls: [1,3,4],6 = " + c1 + "; [1,2,5],11 = " + c2);

        // Random small cases: dp, memo and brute force must all agree.
        Random rnd = new Random(91);
        int agree = 0;
        for (int t = 0; t < 500; t++) {
            int k = 1 + rnd.nextInt(3);
            int[] coins = new int[k];
            for (int i = 0; i < k; i++) coins[i] = 1 + rnd.nextInt(10);
            int amount = rnd.nextInt(19);
            int b = bruteCoinChange(coins, amount);
            if (coinChange(coins, amount) == b && coinChangeMemo(coins, amount) == b) agree++;
            else {
                failures++;
                System.out.println("  FAIL random " + Arrays.toString(coins) + " amount=" + amount + " brute " + b);
            }
        }
        System.out.println("  ok   " + agree + "/500 random cases: dp, memo and brute force agree");

        System.out.println(failures == 0 ? "  day 91 PASSED" : "  day 91 had " + failures + " FAILURES");
    }
}
