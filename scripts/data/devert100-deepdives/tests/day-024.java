// Correctness assertions for day 24 - Longest Consecutive Sequence (LC 128).
//
// The sort-and-scan brute force and the hash-set solution are copied verbatim
// from day-024.md. Both must match the writeup on the worked example and every
// edge case (including the overflow case, where the writeup claims the set
// version returns 2), and must agree on random inputs. The lookup counts the
// optimization section quotes (10 for walk-from-everything on [1,2,3,4], 12
// for the run-start version on the example) are checked with counting copies.

import java.util.*;

class Day24Test {

    // ---- brute force from the bruteForce section ----
    static int brute(int[] nums) {

        if (nums.length == 0) {
            return 0;
        }

        int[] sorted = nums.clone();
        Arrays.sort(sorted);

        int best = 1;
        int current = 1;

        for (int i = 1; i < sorted.length; i++) {

            if (sorted[i] == sorted[i - 1]) {
                continue;                       // duplicate: neither extends nor breaks
            }

            if (sorted[i] == sorted[i - 1] + 1) {
                current++;
            } else {
                current = 1;
            }

            best = Math.max(best, current);
        }

        return best;
    }

    // ---- optimal from the implementation section ----
    static int longestConsecutive(int[] nums) {

        Set<Integer> set = new HashSet<>();
        for (int num : nums) {
            set.add(num);
        }

        int best = 0;

        for (int x : set) {

            if (set.contains(x - 1)) {
                continue;               // x is inside a run, not its start
            }

            int length = 1;
            int next = x + 1;
            while (set.contains(next)) {
                length++;
                next++;
            }

            best = Math.max(best, length);
        }

        return best;
    }

    // Counting copies for the lookup claims.
    static int lookupsWalkFromEvery(int[] nums) {
        Set<Integer> set = new HashSet<>();
        for (int n : nums) set.add(n);
        int lookups = 0;
        for (int x : set) {
            int next = x + 1;
            while (true) { lookups++; if (!set.contains(next)) break; next++; }
        }
        return lookups;
    }

    static int lookupsRunStart(int[] nums) {
        Set<Integer> set = new HashSet<>();
        for (int n : nums) set.add(n);
        int lookups = 0;
        for (int x : set) {
            lookups++;
            if (set.contains(x - 1)) continue;
            int next = x + 1;
            while (true) { lookups++; if (!set.contains(next)) break; next++; }
        }
        return lookups;
    }

    static int failures = 0;

    static void check(String label, int[] nums, int wantBrute, int wantOptimal) {
        int a = brute(nums), b = longestConsecutive(nums);
        boolean ok = a == wantBrute && b == wantOptimal;
        if (!ok) failures++;
        System.out.println((ok ? "  ok   " : "  FAIL ") + label + "  " + Arrays.toString(nums)
            + " -> brute " + a + ", optimal " + b
            + (ok ? "" : "  expected " + wantBrute + " / " + wantOptimal));
    }

    static void check(String label, int[] nums, int want) { check(label, nums, want, want); }

    static void claim(String label, boolean ok) {
        if (!ok) failures++;
        System.out.println((ok ? "  ok   " : "  FAIL ") + label);
    }

    public static void main(String[] args) {
        System.out.println("day 24 - Longest Consecutive Sequence");

        check("example",               new int[] { 100, 4, 200, 1, 3, 2 }, 4);
        check("empty",                 new int[] {}, 0);
        check("single",                new int[] { 7 }, 1);
        check("all duplicates",        new int[] { 5, 5, 5 }, 1);
        check("duplicates in run",     new int[] { 1, 2, 0, 1 }, 3);
        check("sorted dup table",      new int[] { 0, 1, 1, 2 }, 3);
        check("none consecutive",      new int[] { 10, 30, 20 }, 1);
        check("negatives",             new int[] { -1, -2, 0, 2 }, 3);
        check("LC long example",       new int[] { 0, 3, 7, 2, 5, 8, 4, 6, 0, 1 }, 9);
        check("many dup run starts",   new int[] { 1, 1, 1, 1, 2, 3 }, 3);
        // Outside LeetCode's bounds: the writeup says the set version wraps and returns 2.
        check("overflow extremes",     new int[] { Integer.MIN_VALUE, Integer.MAX_VALUE }, 1, 2);

        claim("walk-from-every on [1,2,3,4] does 10 lookups (got " + lookupsWalkFromEvery(new int[] { 1, 2, 3, 4 }) + ")",
            lookupsWalkFromEvery(new int[] { 1, 2, 3, 4 }) == 10);
        claim("run-start version on the example does 12 lookups (got " + lookupsRunStart(new int[] { 100, 4, 200, 1, 3, 2 }) + ")",
            lookupsRunStart(new int[] { 100, 4, 200, 1, 3, 2 }) == 12);

        // Linear bound: on a run of n values, run-start lookups stay <= 2n + 1.
        int n = 50000;
        int[] run = new int[n];
        for (int i = 0; i < n; i++) run[i] = n - i;
        int lk = lookupsRunStart(run);
        claim("run of " + n + ": " + lk + " lookups, within 2n + 1", lk <= 2 * n + 1);

        Random rnd = new Random(24);
        int agree = 0;
        for (int t = 0; t < 500; t++) {
            int len = rnd.nextInt(40);
            int[] in = new int[len];
            for (int i = 0; i < len; i++) in[i] = rnd.nextInt(41) - 20;
            int a = brute(in), b = longestConsecutive(in);
            if (a == b) agree++;
            else {
                failures++;
                System.out.println("  FAIL random " + Arrays.toString(in) + " -> brute " + a + ", optimal " + b);
            }
        }
        System.out.println("  ok   " + agree + "/500 random cases, brute and optimal agree");

        System.out.println(failures == 0 ? "  day 24 PASSED" : "  day 24 had " + failures + " FAILURES");
    }
}
