// Correctness assertions for day 26 - Longest Subarray with Sum K (LC 325 / GFG).
//
// The brute force, the prefix + first-index map, and the non-negative sliding
// window are copied verbatim from day-026.md. Brute and map must match every
// edge case and agree on random arrays with negatives. The window must agree
// with them on random NON-NEGATIVE arrays, and must return 0 on the worked
// example, as the writeup claims. The "put instead of putIfAbsent gives 2"
// claim is checked with the wrong variant.

import java.util.*;

class Day26Test {

    // ---- brute force from the bruteForce section ----
    static int brute(int[] arr, int k) {

        int best = 0;

        for (int start = 0; start < arr.length; start++) {

            long sum = 0;

            for (int end = start; end < arr.length; end++) {
                sum += arr[end];
                if (sum == k) {
                    best = Math.max(best, end - start + 1);
                }
            }
        }

        return best;
    }

    // ---- optimal from the implementation section ----
    static int longestSubarray(int[] arr, int k) {

        // running total -> the FIRST index at which it occurred
        Map<Long, Integer> firstIndex = new HashMap<>();
        firstIndex.put(0L, -1);     // empty prefix, just before index 0

        long prefix = 0;
        int best = 0;

        for (int j = 0; j < arr.length; j++) {
            prefix += arr[j];

            // the earliest start that makes arr[start..j] sum to k
            Integer i = firstIndex.get(prefix - k);
            if (i != null) {
                best = Math.max(best, j - i);
            }

            // keep the first occurrence only - a later one is always shorter
            firstIndex.putIfAbsent(prefix, j);
        }

        return best;
    }

    // ---- sliding window from the implementation section ----
    static int window(int[] arr, int k) {

        int left = 0;
        long sum = 0;
        int best = 0;

        for (int right = 0; right < arr.length; right++) {
            sum += arr[right];

            while (sum > k && left <= right) {   // too big: shrink from the left
                sum -= arr[left];
                left++;
            }

            if (sum == k) {
                best = Math.max(best, right - left + 1);
            }
        }

        return best;
    }

    // The overwrite bug the writeup warns about.
    static int withPut(int[] arr, int k) {
        Map<Long, Integer> firstIndex = new HashMap<>();
        firstIndex.put(0L, -1);
        long prefix = 0;
        int best = 0;
        for (int j = 0; j < arr.length; j++) {
            prefix += arr[j];
            Integer i = firstIndex.get(prefix - k);
            if (i != null) best = Math.max(best, j - i);
            firstIndex.put(prefix, j);
        }
        return best;
    }

    static int failures = 0;

    static void check(String label, int[] arr, int k, int want) {
        int a = brute(arr, k), b = longestSubarray(arr, k);
        boolean ok = a == want && b == want;
        if (!ok) failures++;
        System.out.println((ok ? "  ok   " : "  FAIL ") + label + "  " + Arrays.toString(arr) + ", k=" + k
            + " -> brute " + a + ", map " + b + (ok ? "" : "  expected " + want));
    }

    static void claim(String label, int got, int want) {
        boolean ok = got == want;
        if (!ok) failures++;
        System.out.println((ok ? "  ok   " : "  FAIL ") + label + " -> " + got + (ok ? "" : "  expected " + want));
    }

    public static void main(String[] args) {
        System.out.println("day 26 - Longest Subarray with Sum K");

        int[] ex = { 1, -1, 5, -2, 3 };
        check("example",                ex, 3, 4);
        check("no match",               new int[] { 1, 2, 3 }, 7, 0);
        check("single equal",           new int[] { 5 }, 5, 1);
        check("GFG whole array",        new int[] { 10, 5, 2, 7, 1, -10 }, 15, 6);
        check("all zeros, k=0",         new int[] { 0, 0, 0 }, 0, 3);
        check("cancel to zero",         new int[] { 1, -1 }, 0, 2);
        check("negative k",             new int[] { -1, 2, -3 }, -2, 3);
        check("zeros, k=1",             new int[] { 0, 0, 1, 0 }, 1, 4);

        claim("put instead of putIfAbsent on the example", withPut(ex, 3), 2);
        claim("sliding window on the example (negatives)", window(ex, 3), 0);
        claim("sliding window on [0, 0, 1, 0], k=1", window(new int[] { 0, 0, 1, 0 }, 1), 4);

        Random rnd = new Random(26);
        int agree = 0;
        for (int t = 0; t < 500; t++) {
            int n = 1 + rnd.nextInt(30);
            int[] in = new int[n];
            for (int i = 0; i < n; i++) in[i] = rnd.nextInt(11) - 5;
            int k = rnd.nextInt(13) - 6;
            int a = brute(in, k), b = longestSubarray(in, k);
            if (a == b) agree++;
            else {
                failures++;
                System.out.println("  FAIL random " + Arrays.toString(in) + ", k=" + k + " -> brute " + a + ", map " + b);
            }
        }
        System.out.println("  ok   " + agree + "/500 random cases with negatives, brute and map agree");

        int agreeW = 0;
        for (int t = 0; t < 500; t++) {
            int n = 1 + rnd.nextInt(30);
            int[] in = new int[n];
            for (int i = 0; i < n; i++) in[i] = rnd.nextInt(5);   // 0..4, zeros included
            int k = rnd.nextInt(15);
            int a = brute(in, k), w = window(in, k);
            if (a == w) agreeW++;
            else {
                failures++;
                System.out.println("  FAIL random non-negative " + Arrays.toString(in) + ", k=" + k + " -> brute " + a + ", window " + w);
            }
        }
        System.out.println("  ok   " + agreeW + "/500 random non-negative cases, window agrees with brute");

        System.out.println(failures == 0 ? "  day 26 PASSED" : "  day 26 had " + failures + " FAILURES");
    }
}
