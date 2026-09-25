// Correctness assertions for day 1 - Two Sum.
//
// The implementation below is a VERBATIM copy of the `implementation` section's
// class in day-001.md. The verifier compiles that block separately; this file
// proves it returns the right answers, including for every input the edge-cases
// section claims it handles. If the two ever diverge, this file is the one that
// is wrong - copy the markdown's version over it.

import java.util.*;

class Day1Test {

    // ---- copy of day-001.md's implementation section ----
    static int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> seen = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (seen.containsKey(complement)) {
                return new int[] { seen.get(complement), i };
            }
            seen.put(nums[i], i);
        }
        return new int[] {};
    }

    // ---- copy of the brute-force section, which must agree ----
    static int[] brute(int[] nums, int target) {
        for (int i = 0; i < nums.length; i++) {
            for (int j = i + 1; j < nums.length; j++) {
                if (nums[i] + nums[j] == target) return new int[] { i, j };
            }
        }
        return new int[] {};
    }

    static int failures = 0;

    static void check(String label, int[] nums, int target, int[] want) {
        int[] got = twoSum(nums, target);
        boolean ok = Arrays.equals(got, want);
        if (!ok) failures++;
        System.out.println((ok ? "  ok   " : "  FAIL ") + label
            + "  nums=" + Arrays.toString(nums) + " target=" + target
            + " -> " + Arrays.toString(got) + (ok ? "" : "  expected " + Arrays.toString(want)));
    }

    public static void main(String[] args) {
        System.out.println("day 1 - Two Sum");

        check("example 1", new int[] { 2, 7, 11, 15 }, 9, new int[] { 0, 1 });
        check("example 2", new int[] { 3, 2, 4 }, 6, new int[] { 1, 2 });

        // The duplicate trap the edge-cases section is built around. Insert-
        // before-check would return [0,0] here, reusing one element.
        check("duplicates [3,3]", new int[] { 3, 3 }, 6, new int[] { 0, 1 });

        check("negatives", new int[] { -3, 4, 3, 90 }, 0, new int[] { 0, 2 });
        check("two elements", new int[] { 1, 2 }, 3, new int[] { 0, 1 });
        check("zeros", new int[] { 0, 4, 3, 0 }, 0, new int[] { 0, 3 });

        // Complement equals the element but has no partner - must NOT match.
        check("self-complement, no pair", new int[] { 3, 2, 4 }, 6, new int[] { 1, 2 });

        // The two approaches must agree on random inputs with a planted answer.
        Random rnd = new Random(7);
        int agree = 0;
        for (int t = 0; t < 400; t++) {
            int n = 2 + rnd.nextInt(30);
            int[] nums = new int[n];
            for (int i = 0; i < n; i++) nums[i] = rnd.nextInt(200) - 100;
            int a = rnd.nextInt(n), b = rnd.nextInt(n);
            if (a == b) b = (b + 1) % n;
            int target = nums[a] + nums[b];
            int[] fast = twoSum(nums, target);
            int[] slow = brute(nums, target);
            // Indices may legitimately differ when several pairs work; the SUM
            // is what must match, and both must be two distinct indices.
            boolean ok = fast.length == 2 && slow.length == 2
                && fast[0] != fast[1]
                && nums[fast[0]] + nums[fast[1]] == target;
            if (ok) agree++; else {
                failures++;
                System.out.println("  FAIL random " + Arrays.toString(nums) + " target=" + target
                    + " -> " + Arrays.toString(fast));
            }
        }
        System.out.println("  ok   " + agree + "/400 random cases agree with brute force");

        System.out.println(failures == 0 ? "  day 1 PASSED" : "  day 1 had " + failures + " FAILURES");
    }
}
