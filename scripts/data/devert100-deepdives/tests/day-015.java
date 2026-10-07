// Correctness assertions for day 15 - Remove Duplicates from Sorted Array (LC 26).
//
// The set-based brute force, the slow/fast implementation and the LC 80
// follow-up are copied verbatim from day-015.md. Every edge case checks both
// the returned k and the first k slots. The prose also claims that the LC 80
// skeleton with m = 1 solves LC 26, and that comparing with nums[fast - 1]
// happens to work for LC 26 - both are checked on random sorted inputs.

import java.util.*;

class Day15Test {

    // ---- brute force from the bruteForce section ----
    static int removeDuplicatesBrute(int[] nums) {
        Set<Integer> seen = new LinkedHashSet<>();
        for (int num : nums) {
            seen.add(num);              // duplicates are ignored by the set
        }

        int k = 0;
        for (int num : seen) {
            nums[k] = num;
            k++;
        }
        return k;
    }

    // ---- implementation section ----
    static int removeDuplicates(int[] nums) {
        if (nums.length == 0) {
            return 0;
        }

        int slow = 0;   // index of the last unique value kept

        for (int fast = 1; fast < nums.length; fast++) {
            if (nums[fast] != nums[slow]) {
                slow++;
                nums[slow] = nums[fast];
            }
        }

        return slow + 1;
    }

    // ---- LC 80 follow-up from the implementation section ----
    static int removeDuplicatesII(int[] nums) {
        int k = 0;   // number of elements kept so far

        for (int num : nums) {
            // keep it if fewer than 2 are kept, or it differs from
            // the element two slots back in the output
            if (k < 2 || num != nums[k - 2]) {
                nums[k] = num;
                k++;
            }
        }

        return k;
    }

    // The same skeleton with m copies allowed (prose claim: m = 1 solves LC 26).
    static int keepAtMost(int[] nums, int m) {
        int k = 0;
        for (int num : nums) {
            if (k < m || num != nums[k - m]) {
                nums[k] = num;
                k++;
            }
        }
        return k;
    }

    // The "compare with nums[fast - 1]" variant from the common mistakes.
    static int prevInputVariant(int[] nums) {
        if (nums.length == 0) return 0;
        int slow = 0;
        for (int fast = 1; fast < nums.length; fast++) {
            if (nums[fast] != nums[fast - 1]) {
                slow++;
                nums[slow] = nums[fast];
            }
        }
        return slow + 1;
    }

    // Oracle: distinct values in order, and at most m copies of each.
    static int[] oracle(int[] nums, int m) {
        List<Integer> out = new ArrayList<>();
        for (int i = 0; i < nums.length; i++) {
            int copies = 0;
            for (int x : out) if (x == nums[i]) copies++;
            if (copies < m) out.add(nums[i]);
        }
        int[] r = new int[out.size()];
        for (int i = 0; i < r.length; i++) r[i] = out.get(i);
        return r;
    }

    static int failures = 0;

    static void check(String label, int[] input, int[] want) {
        int[] a = input.clone(), b = input.clone();
        int ka = removeDuplicatesBrute(a), kb = removeDuplicates(b);
        int[] pa = Arrays.copyOf(a, ka), pb = Arrays.copyOf(b, kb);
        boolean ok = Arrays.equals(pa, want) && Arrays.equals(pb, want);
        if (!ok) failures++;
        System.out.println((ok ? "  ok   " : "  FAIL ") + label + "  " + Arrays.toString(input)
            + " -> return " + kb + ", " + Arrays.toString(pb)
            + (ok ? "" : "  brute " + Arrays.toString(pa) + " expected " + Arrays.toString(want)));
    }

    static void claim(String label, boolean holds) {
        if (!holds) failures++;
        System.out.println((holds ? "  ok   " : "  FAIL ") + label);
    }

    public static void main(String[] args) {
        System.out.println("day 15 - Remove Duplicates from Sorted Array");

        check("example",                new int[] { 0, 0, 1, 1, 1, 2, 2, 3, 3, 4 }, new int[] { 0, 1, 2, 3, 4 });
        check("single element",         new int[] { 1 },                 new int[] { 1 });
        check("empty",                  new int[] {},                    new int[] {});
        check("all the same",           new int[] { 2, 2, 2, 2 },        new int[] { 2 });
        check("all unique",             new int[] { 1, 2, 3 },           new int[] { 1, 2, 3 });
        check("smallest with duplicate",new int[] { 1, 1, 2 },           new int[] { 1, 2 });
        check("negative values",        new int[] { -3, -3, -1, 0, 0 },  new int[] { -3, -1, 0 });
        check("duplicates at the end",  new int[] { 1, 2, 3, 3, 3 },     new int[] { 1, 2, 3 });

        // Unsorted input: the writeup claims the neighbour check returns 3, [1, 2, 1].
        int[] uns = { 1, 2, 1 };
        int ku = removeDuplicates(uns);
        claim("unsorted [1, 2, 1] -> return " + ku + ", " + Arrays.toString(Arrays.copyOf(uns, ku)),
            ku == 3 && Arrays.equals(Arrays.copyOf(uns, ku), new int[] { 1, 2, 1 }));

        // Dry-run final array state claimed in the optimization table.
        int[] ex = { 0, 0, 1, 1, 1, 2, 2, 3, 3, 4 };
        removeDuplicates(ex);
        claim("final array after dry run is [0, 1, 2, 3, 4, 2, 2, 3, 3, 4]",
            Arrays.equals(ex, new int[] { 0, 1, 2, 3, 4, 2, 2, 3, 3, 4 }));

        // LC 80 on its own example.
        int[] l80 = { 1, 1, 1, 2, 2, 3 };
        int k80 = removeDuplicatesII(l80);
        claim("LC 80 [1, 1, 1, 2, 2, 3] -> return " + k80 + ", " + Arrays.toString(Arrays.copyOf(l80, k80)),
            k80 == 5 && Arrays.equals(Arrays.copyOf(l80, k80), new int[] { 1, 1, 2, 2, 3 }));

        // Randomized sorted inputs.
        Random rnd = new Random(15);
        int agree = 0, trials = 600;
        for (int t = 0; t < trials; t++) {
            int n = 1 + rnd.nextInt(30);
            int[] in = new int[n];
            for (int i = 0; i < n; i++) in[i] = rnd.nextInt(15) - 7;
            Arrays.sort(in);

            int[] w1 = oracle(in, 1), w2 = oracle(in, 2);
            int[] a = in.clone(), b = in.clone(), c = in.clone(), d = in.clone(), e = in.clone();
            int ka = removeDuplicatesBrute(a), kb = removeDuplicates(b), kc = removeDuplicatesII(c);
            int kd = keepAtMost(d, 1), ke = prevInputVariant(e);

            boolean ok = Arrays.equals(Arrays.copyOf(a, ka), w1)
                && Arrays.equals(Arrays.copyOf(b, kb), w1)
                && Arrays.equals(Arrays.copyOf(c, kc), w2)
                && Arrays.equals(Arrays.copyOf(d, kd), w1)
                && Arrays.equals(Arrays.copyOf(e, ke), w1);
            if (ok) agree++;
            else {
                failures++;
                System.out.println("  FAIL random " + Arrays.toString(in));
            }
        }
        System.out.println("  ok   " + agree + "/" + trials
            + " random sorted cases: brute, slow/fast, m=1 skeleton, nums[fast-1] variant all match; LC 80 matches");

        System.out.println(failures == 0 ? "  day 15 PASSED" : "  day 15 had " + failures + " FAILURES");
    }
}
