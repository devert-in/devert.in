// Correctness assertions for day 28 - Contiguous Array (LC 525).
//
// The brute force, the first-index HashMap solution and the offset-array
// version are copied verbatim from day-028.md. All three must match every
// edge case and agree on random binary arrays. The "overwriting returns 2"
// and "no seed makes [0, 1] return 0" claims are checked with wrong variants.

import java.util.*;

class Day28Test {

    // ---- brute force from the bruteForce section ----
    static int brute(int[] nums) {

        int best = 0;

        for (int start = 0; start < nums.length; start++) {

            int balance = 0;                    // ones minus zeros in nums[start..end]

            for (int end = start; end < nums.length; end++) {
                balance += (nums[end] == 1) ? 1 : -1;
                if (balance == 0) {
                    best = Math.max(best, end - start + 1);
                }
            }
        }

        return best;
    }

    // ---- optimal from the implementation section ----
    static int findMaxLength(int[] nums) {

        // balance (ones minus zeros) -> the FIRST index it was reached
        Map<Integer, Integer> firstIndex = new HashMap<>();
        firstIndex.put(0, -1);      // balance 0 before any element

        int balance = 0;
        int best = 0;

        for (int j = 0; j < nums.length; j++) {
            balance += (nums[j] == 1) ? 1 : -1;     // the 0 -> -1 transform

            Integer i = firstIndex.get(balance);
            if (i != null) {
                // same balance as at index i: nums[i+1..j] is balanced
                best = Math.max(best, j - i);
            } else {
                // first time at this balance - remember where, never overwrite
                firstIndex.put(balance, j);
            }
        }

        return best;
    }

    // ---- array version from the implementation section ----
    static int arrayVersion(int[] nums) {

        int n = nums.length;

        // first[balance + n] = first index at that balance, or -2 if never seen
        int[] first = new int[2 * n + 1];
        Arrays.fill(first, -2);
        first[n] = -1;              // balance 0 at virtual index -1

        int balance = 0;
        int best = 0;

        for (int j = 0; j < n; j++) {
            balance += (nums[j] == 1) ? 1 : -1;

            if (first[balance + n] != -2) {
                best = Math.max(best, j - first[balance + n]);
            } else {
                first[balance + n] = j;
            }
        }

        return best;
    }

    // Wrong variants the writeup warns about.
    static int overwrite(int[] nums) {
        Map<Integer, Integer> firstIndex = new HashMap<>();
        firstIndex.put(0, -1);
        int balance = 0, best = 0;
        for (int j = 0; j < nums.length; j++) {
            balance += (nums[j] == 1) ? 1 : -1;
            Integer i = firstIndex.get(balance);
            if (i != null) best = Math.max(best, j - i);
            firstIndex.put(balance, j);
        }
        return best;
    }

    static int noSeed(int[] nums) {
        Map<Integer, Integer> firstIndex = new HashMap<>();
        int balance = 0, best = 0;
        for (int j = 0; j < nums.length; j++) {
            balance += (nums[j] == 1) ? 1 : -1;
            Integer i = firstIndex.get(balance);
            if (i != null) best = Math.max(best, j - i);
            else firstIndex.put(balance, j);
        }
        return best;
    }

    static int failures = 0;

    static void check(String label, int[] nums, int want) {
        int a = brute(nums), b = findMaxLength(nums), c = arrayVersion(nums);
        boolean ok = a == want && b == want && c == want;
        if (!ok) failures++;
        System.out.println((ok ? "  ok   " : "  FAIL ") + label + "  " + Arrays.toString(nums)
            + " -> brute " + a + ", map " + b + ", array " + c + (ok ? "" : "  expected " + want));
    }

    static void claim(String label, int got, int want) {
        boolean ok = got == want;
        if (!ok) failures++;
        System.out.println((ok ? "  ok   " : "  FAIL ") + label + " -> " + got + (ok ? "" : "  expected " + want));
    }

    public static void main(String[] args) {
        System.out.println("day 28 - Contiguous Array");

        int[] ex = { 1, 0, 1, 1, 0 };
        check("example",              ex, 4);
        check("smallest balanced",    new int[] { 0, 1 }, 2);
        check("odd length",           new int[] { 0, 1, 0 }, 2);
        check("all zeros",            new int[] { 0, 0, 0 }, 0);
        check("all ones",             new int[] { 1, 1 }, 0);
        check("single",               new int[] { 1 }, 0);
        check("whole array",          new int[] { 1, 1, 0, 0 }, 4);
        check("alternating",          new int[] { 0, 1, 0, 1, 0, 1 }, 6);
        check("LC long example",      new int[] { 0, 0, 1, 0, 0, 0, 1, 1 }, 6);

        claim("overwriting the stored index on the example", overwrite(ex), 2);
        claim("no seed on [0, 1]", noSeed(new int[] { 0, 1 }), 0);

        Random rnd = new Random(28);
        int agree = 0;
        for (int t = 0; t < 500; t++) {
            int n = 1 + rnd.nextInt(40);
            int[] in = new int[n];
            for (int i = 0; i < n; i++) in[i] = rnd.nextInt(2);
            int a = brute(in), b = findMaxLength(in), c = arrayVersion(in);
            if (a == b && b == c && a % 2 == 0) agree++;
            else {
                failures++;
                System.out.println("  FAIL random " + Arrays.toString(in) + " -> " + a + " / " + b + " / " + c);
            }
        }
        System.out.println("  ok   " + agree + "/500 random cases, all three versions agree and the answer is even");

        System.out.println(failures == 0 ? "  day 28 PASSED" : "  day 28 had " + failures + " FAILURES");
    }
}
