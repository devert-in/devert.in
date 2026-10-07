// Correctness assertions for day 95 - Longest Increasing Subsequence (LC 300).
//
// The brute-force recursion, the O(n^2) DP and the O(n log n) tails version
// are copied verbatim from day-095.md. All three must agree on the worked
// example, every edge case, and random arrays checked against an exhaustive
// bitmask oracle. The call-count claims from "Where it hurts" (41 total calls,
// 14 for i = 6, endAt(2) evaluated 18 times) and the tails traces are checked
// with an instrumented copy of the brute force.

import java.util.*;

class Day95Test {

    // ---- brute force ----
    static class Brute {
        public int lengthOfLIS(int[] nums) {

            int best = 0;
            for (int i = 0; i < nums.length; i++) {
                best = Math.max(best, endAt(nums, i));
            }
            return best;
        }

        private int endAt(int[] nums, int i) {
            int len = 1;
            for (int j = 0; j < i; j++) {
                if (nums[j] < nums[i]) {
                    len = Math.max(len, 1 + endAt(nums, j));
                }
            }
            return len;
        }
    }

    // ---- O(n^2) DP from the optimization section ----
    static class Quadratic {
        public int lengthOfLIS(int[] nums) {

            int n = nums.length;
            int[] dp = new int[n];
            int best = 0;

            for (int i = 0; i < n; i++) {
                dp[i] = 1;
                for (int j = 0; j < i; j++) {
                    if (nums[j] < nums[i]) {
                        dp[i] = Math.max(dp[i], dp[j] + 1);
                    }
                }
                best = Math.max(best, dp[i]);
            }

            return best;
        }
    }

    // ---- O(n log n) implementation ----
    static class Fast {
        public int lengthOfLIS(int[] nums) {

            int[] tails = new int[nums.length];
            int size = 0;

            for (int x : nums) {
                int lo = 0, hi = size;
                while (lo < hi) {
                    int mid = (lo + hi) >>> 1;
                    if (tails[mid] < x) {
                        lo = mid + 1;
                    } else {
                        hi = mid;
                    }
                }

                tails[lo] = x;
                if (lo == size) {
                    size++;
                }
            }

            return size;
        }
    }

    // Tails trace, for checking the dry-run tables.
    static List<String> tailsTrace(int[] nums) {
        int[] tails = new int[nums.length];
        int size = 0;
        List<String> out = new ArrayList<>();
        for (int x : nums) {
            int lo = 0, hi = size;
            while (lo < hi) { int mid = (lo + hi) >>> 1; if (tails[mid] < x) lo = mid + 1; else hi = mid; }
            tails[lo] = x;
            if (lo == size) size++;
            out.add(Arrays.toString(Arrays.copyOf(tails, size)));
        }
        return out;
    }

    // Instrumented brute force for the call-count claims.
    static int calls;
    static int[] callsOn;
    static int endAtCounted(int[] nums, int i) {
        calls++;
        callsOn[i]++;
        int len = 1;
        for (int j = 0; j < i; j++) if (nums[j] < nums[i]) len = Math.max(len, 1 + endAtCounted(nums, j));
        return len;
    }

    static int oracle(int[] nums) {
        int n = nums.length, best = 0;
        for (int m = 1; m < (1 << n); m++) {
            int prev = Integer.MIN_VALUE, len = 0;
            boolean inc = true;
            for (int i = 0; i < n && inc; i++) {
                if ((m >> i & 1) == 1) {
                    if (len > 0 && nums[i] <= prev) inc = false;
                    prev = nums[i];
                    len++;
                }
            }
            if (inc) best = Math.max(best, len);
        }
        return best;
    }

    static int failures = 0;

    static void check(String label, int[] nums, int want) {
        int a = new Fast().lengthOfLIS(nums.clone());
        int b = new Quadratic().lengthOfLIS(nums.clone());
        int c = new Brute().lengthOfLIS(nums.clone());
        boolean ok = a == want && b == want && c == want;
        if (!ok) failures++;
        System.out.println((ok ? "  ok   " : "  FAIL ") + label + "  " + Arrays.toString(nums)
            + " -> fast " + a + ", n^2 " + b + ", brute " + c + (ok ? "" : "  expected " + want));
    }

    static void claim(String label, boolean holds) {
        if (!holds) failures++;
        System.out.println((holds ? "  ok   " : "  FAIL ") + label);
    }

    public static void main(String[] args) {
        System.out.println("day 95 - Longest Increasing Subsequence");

        int[] ex = { 10, 9, 2, 5, 3, 7, 101, 18 };
        check("example",              ex, 4);
        check("single element",       new int[] { 5 }, 1);
        check("all equal",            new int[] { 7, 7, 7, 7 }, 1);
        check("strictly decreasing",  new int[] { 5, 4, 3, 2, 1 }, 1);
        check("strictly increasing",  new int[] { 1, 2, 3, 4 }, 4);
        check("repeat in the middle", new int[] { 1, 3, 3, 4 }, 3);
        check("LeetCode example 2",   new int[] { 0, 1, 0, 3, 2, 3 }, 4);
        check("negatives",            new int[] { -2, -1 }, 2);
        check("tails trap",           new int[] { 3, 4, 5, 1 }, 3);
        check("max(dp) not dp[n-1]",  new int[] { 1, 2, 0 }, 2);

        // Call counts in the brute-force dry run.
        int[] perI = new int[ex.length];
        int total = 0;
        callsOn = new int[ex.length];
        for (int i = 0; i < ex.length; i++) {
            calls = 0;
            endAtCounted(ex, i);
            perI[i] = calls;
            total += calls;
        }
        claim("calls per top-level i are [1, 1, 1, 2, 2, 6, 14, 14]: " + Arrays.toString(perI),
            Arrays.equals(perI, new int[] { 1, 1, 1, 2, 2, 6, 14, 14 }));
        claim("41 calls total: " + total, total == 41);
        claim("endAt(2) evaluated 18 times: " + callsOn[2], callsOn[2] == 18);

        claim("tails trace on the example matches the dry run",
            tailsTrace(ex).equals(List.of("[10]", "[9]", "[2]", "[2, 5]", "[2, 3]", "[2, 3, 7]", "[2, 3, 7, 101]", "[2, 3, 7, 18]")));
        claim("tails for [3, 4, 5, 1] ends as [1, 4, 5]",
            tailsTrace(new int[] { 3, 4, 5, 1 }).get(3).equals("[1, 4, 5]"));
        claim("tails trace on [0, 1, 0, 3, 2, 3] matches the edge-case section",
            tailsTrace(new int[] { 0, 1, 0, 3, 2, 3 }).equals(List.of("[0]", "[0, 1]", "[0, 1]", "[0, 1, 3]", "[0, 1, 2]", "[0, 1, 2, 3]")));

        Random rnd = new Random(95);
        int agree = 0;
        for (int t = 0; t < 500; t++) {
            int n = 1 + rnd.nextInt(14);
            int[] nums = new int[n];
            for (int i = 0; i < n; i++) nums[i] = rnd.nextInt(t % 2 == 0 ? 6 : 41) - (t % 2 == 0 ? 3 : 20);
            int w = oracle(nums);
            if (new Fast().lengthOfLIS(nums.clone()) == w
                && new Quadratic().lengthOfLIS(nums.clone()) == w
                && new Brute().lengthOfLIS(nums.clone()) == w) agree++;
            else {
                failures++;
                System.out.println("  FAIL random " + Arrays.toString(nums));
            }
        }
        System.out.println("  ok   " + agree + "/500 random cases, all three match bitmask oracle");

        // Larger arrays: fast vs quadratic only.
        int agreeBig = 0;
        for (int t = 0; t < 200; t++) {
            int n = 1 + rnd.nextInt(300);
            int[] nums = new int[n];
            for (int i = 0; i < n; i++) nums[i] = rnd.nextInt(20001) - 10000;
            if (new Fast().lengthOfLIS(nums) == new Quadratic().lengthOfLIS(nums)) agreeBig++;
            else { failures++; System.out.println("  FAIL big random n=" + n); }
        }
        System.out.println("  ok   " + agreeBig + "/200 larger random cases, fast matches O(n^2) DP");

        System.out.println(failures == 0 ? "  day 95 PASSED" : "  day 95 had " + failures + " FAILURES");
    }
}
