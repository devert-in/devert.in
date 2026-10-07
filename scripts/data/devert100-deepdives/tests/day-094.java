// Correctness assertions for day 94 - Partition Equal Subset Sum (LC 416).
//
// The brute-force recursion and the 1D boolean DP are copied verbatim from
// day-094.md. Both must agree on the worked example, every edge case, and a
// few hundred random arrays, checked against an exhaustive bitmask oracle.
// The forward-loop variant is included only to prove the [1, 3] claim.

import java.util.*;

class Day94Test {

    // ---- brute force from the bruteForce section ----
    static class Brute {
        public boolean canPartition(int[] nums) {

            int total = 0;
            for (int num : nums) {
                total += num;
            }
            if (total % 2 != 0) {
                return false;
            }

            return canReach(nums, 0, total / 2);
        }

        private boolean canReach(int[] nums, int i, int remaining) {
            if (remaining == 0) {
                return true;
            }
            if (i == nums.length) {
                return false;
            }

            boolean take = nums[i] <= remaining
                    && canReach(nums, i + 1, remaining - nums[i]);

            return take || canReach(nums, i + 1, remaining);
        }
    }

    // ---- implementation ----
    static boolean canPartition(int[] nums) {

        int total = 0;
        for (int num : nums) {
            total += num;
        }

        if (total % 2 != 0) {
            return false;
        }
        int target = total / 2;

        boolean[] dp = new boolean[target + 1];
        dp[0] = true;

        for (int num : nums) {
            for (int s = target; s >= num; s--) {
                dp[s] = dp[s] || dp[s - num];
            }
        }

        return dp[target];
    }

    // ---- WRONG forward loop, to prove the [1, 3] claim ----
    static boolean forwardBug(int[] nums) {
        int total = 0;
        for (int num : nums) total += num;
        if (total % 2 != 0) return false;
        int target = total / 2;
        boolean[] dp = new boolean[target + 1];
        dp[0] = true;
        for (int num : nums)
            for (int s = num; s <= target; s++)
                dp[s] = dp[s] || dp[s - num];
        return dp[target];
    }

    // Oracle: every bitmask, does any subset sum to exactly half?
    static boolean oracle(int[] nums) {
        int n = nums.length, total = 0;
        for (int v : nums) total += v;
        for (int m = 0; m < (1 << n); m++) {
            int s = 0;
            for (int i = 0; i < n; i++) if ((m >> i & 1) == 1) s += nums[i];
            if (2 * s == total) return true;
        }
        return false;
    }

    static int failures = 0;

    static void check(String label, int[] nums, boolean want) {
        boolean a = canPartition(nums.clone());
        boolean b = new Brute().canPartition(nums.clone());
        boolean ok = a == want && b == want;
        if (!ok) failures++;
        String shown = nums.length > 12 ? "[n=" + nums.length + "]" : Arrays.toString(nums);
        System.out.println((ok ? "  ok   " : "  FAIL ") + label + "  " + shown
            + " -> dp " + a + ", brute " + b + (ok ? "" : "  expected " + want));
    }

    static void claim(String label, boolean holds) {
        if (!holds) failures++;
        System.out.println((holds ? "  ok   " : "  FAIL ") + label);
    }

    public static void main(String[] args) {
        System.out.println("day 94 - Partition Equal Subset Sum");

        check("example",                 new int[] { 1, 5, 11, 5 }, true);
        check("odd total",               new int[] { 1, 2, 3, 5 }, false);
        check("single [1]",              new int[] { 1 }, false);
        check("single [2]",              new int[] { 2 }, false);
        check("two equal",               new int[] { 3, 3 }, true);
        check("element bigger than half", new int[] { 1, 2, 5 }, false);
        check("even total, impossible",  new int[] { 2, 2, 3, 5 }, false);
        check("forward-loop trap input", new int[] { 1, 3 }, false);
        check("four ones",               new int[] { 1, 1, 1, 1 }, true);
        check("three ones",              new int[] { 1, 1, 1 }, false);
        int[] big = new int[200];
        Arrays.fill(big, 100);
        check("largest input",           big, true);

        claim("forward loop wrongly returns true on [1, 3]", forwardBug(new int[] { 1, 3 }));

        // Reachable-sum set after each number matches the dry run.
        int[] ex = { 1, 5, 11, 5 };
        boolean[] dp = new boolean[12];
        dp[0] = true;
        String[] want = { "[0, 1]", "[0, 1, 5, 6]", "[0, 1, 5, 6, 11]", "[0, 1, 5, 6, 10, 11]" };
        boolean rowsOk = true;
        for (int k = 0; k < 4; k++) {
            for (int s = 11; s >= ex[k]; s--) dp[s] = dp[s] || dp[s - ex[k]];
            List<Integer> r = new ArrayList<>();
            for (int s = 0; s <= 11; s++) if (dp[s]) r.add(s);
            if (!r.toString().equals(want[k])) rowsOk = false;
        }
        claim("reachable sets after each number match the dry run", rowsOk);

        // Reachable sums of [2, 2, 3, 5] claimed in "Where it hurts".
        Set<Integer> sums = new TreeSet<>();
        int[] h = { 2, 2, 3, 5 };
        for (int m = 0; m < 16; m++) { int s = 0; for (int i = 0; i < 4; i++) if ((m >> i & 1) == 1) s += h[i]; sums.add(s); }
        claim("[2, 2, 3, 5] reachable sums are 0,2,3,4,5,7,8,9,10,12",
            sums.toString().equals("[0, 2, 3, 4, 5, 7, 8, 9, 10, 12]"));

        Random rnd = new Random(94);
        int agree = 0;
        for (int t = 0; t < 500; t++) {
            int n = 1 + rnd.nextInt(14);
            int[] nums = new int[n];
            for (int i = 0; i < n; i++) nums[i] = 1 + rnd.nextInt(t % 2 == 0 ? 10 : 100);
            boolean w = oracle(nums);
            if (canPartition(nums.clone()) == w && new Brute().canPartition(nums.clone()) == w) agree++;
            else {
                failures++;
                System.out.println("  FAIL random " + Arrays.toString(nums));
            }
        }
        System.out.println("  ok   " + agree + "/500 random cases, dp and brute match bitmask oracle");

        System.out.println(failures == 0 ? "  day 94 PASSED" : "  day 94 had " + failures + " FAILURES");
    }
}
