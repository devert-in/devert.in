// Correctness assertions for day 23 - Subarray Sum Equals K (LC 560).
//
// The brute force and the prefix-sum + HashMap solution are copied verbatim
// from day-023.md. Both must return the counts the writeup claims for the
// worked example and every edge case, and must agree on random arrays that
// include negatives and zeros. The "record before lookup" claim (9 instead
// of 6 on [0,0,0], k = 0) is checked with the wrong-order variant.

import java.util.*;

class Day23Test {

    // ---- brute force from the bruteForce section ----
    static int brute(int[] nums, int k) {

        int count = 0;

        for (int start = 0; start < nums.length; start++) {

            int sum = 0;

            for (int end = start; end < nums.length; end++) {
                sum += nums[end];
                if (sum == k) {
                    count++;
                }
            }
        }

        return count;
    }

    // ---- optimal from the implementation section ----
    static int subarraySum(int[] nums, int k) {

        // running total -> how many times it has appeared so far
        Map<Integer, Integer> seen = new HashMap<>();
        seen.put(0, 1);     // the empty prefix, before any element

        int prefix = 0;
        int count = 0;

        for (int num : nums) {
            prefix += num;

            // every earlier total equal to prefix - k starts a subarray
            // that ends here and sums to k
            count += seen.getOrDefault(prefix - k, 0);

            // record AFTER the lookup, so a subarray is never empty
            seen.merge(prefix, 1, Integer::sum);
        }

        return count;
    }

    // The wrong order the writeup warns about.
    static int recordFirst(int[] nums, int k) {
        Map<Integer, Integer> seen = new HashMap<>();
        seen.put(0, 1);
        int prefix = 0, count = 0;
        for (int num : nums) {
            prefix += num;
            seen.merge(prefix, 1, Integer::sum);
            count += seen.getOrDefault(prefix - k, 0);
        }
        return count;
    }

    static int failures = 0;

    static void check(String label, int[] nums, int k, int want) {
        int a = brute(nums, k);
        int b = subarraySum(nums, k);
        boolean ok = a == want && b == want;
        if (!ok) failures++;
        System.out.println((ok ? "  ok   " : "  FAIL ") + label + "  " + Arrays.toString(nums)
            + ", k=" + k + " -> brute " + a + ", optimal " + b + (ok ? "" : "  expected " + want));
    }

    public static void main(String[] args) {
        System.out.println("day 23 - Subarray Sum Equals K");

        check("example",              new int[] { 1, 2, 3, -3, 3 }, 3, 5);
        check("single equal",         new int[] { 3 },              3, 1);
        check("single not equal",     new int[] { 5 },              3, 0);
        check("duplicates (LC ex 1)", new int[] { 1, 1, 1 },        2, 2);
        check("LC ex 2",              new int[] { 1, 2, 3 },        3, 2);
        check("k=0 with zeros",       new int[] { 0, 0, 0 },        0, 6);
        check("negatives cancel",     new int[] { 1, -1, 0 },       0, 3);
        check("negative k",           new int[] { -1, -1, 1 },     -1, 3);
        check("no match",             new int[] { 1, 2, 3 },        7, 0);
        check("whole array only",     new int[] { 2, -1, 2 },       3, 1);
        check("window-breaking",      new int[] { 3, -3, 3 },       3, 3);

        int wrong = recordFirst(new int[] { 0, 0, 0 }, 0);
        boolean wrongOk = wrong == 9;
        if (!wrongOk) failures++;
        System.out.println((wrongOk ? "  ok   " : "  FAIL ") + "record-before-lookup on [0,0,0], k=0 gives " + wrong + " (writeup claims 9)");

        Random rnd = new Random(23);
        int agree = 0;
        for (int t = 0; t < 500; t++) {
            int n = 1 + rnd.nextInt(30);
            int[] in = new int[n];
            for (int i = 0; i < n; i++) in[i] = rnd.nextInt(11) - 5;
            int k = rnd.nextInt(13) - 6;
            int a = brute(in, k), b = subarraySum(in, k);
            if (a == b) agree++;
            else {
                failures++;
                System.out.println("  FAIL random " + Arrays.toString(in) + ", k=" + k + " -> brute " + a + ", optimal " + b);
            }
        }
        System.out.println("  ok   " + agree + "/500 random cases, brute and optimal agree");

        System.out.println(failures == 0 ? "  day 23 PASSED" : "  day 23 had " + failures + " FAILURES");
    }
}
