// Correctness assertions for day 45 - Find First and Last Position (LC 34).
//
// The expand-outward brute force, the record-and-continue implementation and
// the lower-bound variant are copied verbatim from day-045.md. Every edge case
// is checked with the exact output the writeup claims, the step counts quoted
// in the dry runs and complexity section are re-measured, and a seeded random
// run compares all three against a linear-scan oracle.

import java.util.*;

class Day45Test {

    // ---- brute force: binary search + expand outward ----
    static int[] searchRangeExpand(int[] nums, int target) {
        int lo = 0, hi = nums.length - 1, k = -1;
        while (lo <= hi) {
            int mid = lo + (hi - lo) / 2;
            if (nums[mid] == target) { k = mid; break; }
            else if (nums[mid] < target) lo = mid + 1;
            else hi = mid - 1;
        }
        if (k == -1) return new int[] { -1, -1 };
        int first = k, last = k;
        while (first - 1 >= 0 && nums[first - 1] == target) first--;
        while (last + 1 < nums.length && nums[last + 1] == target) last++;
        return new int[] { first, last };
    }

    // ---- implementation ----
    static int[] searchRange(int[] nums, int target) {
        int first = findBound(nums, target, true);
        if (first == -1) {
            return new int[] { -1, -1 };
        }
        int last = findBound(nums, target, false);
        return new int[] { first, last };
    }

    static int iterations = 0;   // instrumentation only, not in the published code

    static int findBound(int[] nums, int target, boolean findFirst) {
        int lo = 0;
        int hi = nums.length - 1;
        int ans = -1;
        while (lo <= hi) {
            iterations++;
            int mid = lo + (hi - lo) / 2;
            if (nums[mid] == target) {
                ans = mid;
                if (findFirst) {
                    hi = mid - 1;
                } else {
                    lo = mid + 1;
                }
            } else if (nums[mid] < target) {
                lo = mid + 1;
            } else {
                hi = mid - 1;
            }
        }
        return ans;
    }

    // ---- lower-bound variant ----
    static int[] searchRangeLB(int[] nums, int target) {
        int first = lowerBound(nums, target);
        if (first == nums.length || nums[first] != target) {
            return new int[] { -1, -1 };
        }
        int last = lowerBound(nums, target + 1) - 1;
        return new int[] { first, last };
    }

    static int lowerBound(int[] nums, int x) {
        int lo = 0, hi = nums.length;
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (nums[mid] < x) lo = mid + 1;
            else hi = mid;
        }
        return lo;
    }

    static int[] oracle(int[] nums, int target) {
        int f = -1, l = -1;
        for (int i = 0; i < nums.length; i++) if (nums[i] == target) { if (f == -1) f = i; l = i; }
        return new int[] { f, l };
    }

    static int failures = 0;

    static void report(boolean ok, String msg) {
        if (!ok) failures++;
        System.out.println((ok ? "  ok   " : "  FAIL ") + msg);
    }

    static void check(String label, int[] nums, int target, int[] want) {
        int[] a = searchRangeExpand(nums, target);
        int[] b = searchRange(nums, target);
        int[] c = searchRangeLB(nums, target);
        boolean ok = Arrays.equals(a, want) && Arrays.equals(b, want) && Arrays.equals(c, want);
        report(ok, label + "  " + Arrays.toString(nums) + ", target " + target + " -> "
            + Arrays.toString(b) + (ok ? "" : "  expand " + Arrays.toString(a) + " lb "
            + Arrays.toString(c) + " expected " + Arrays.toString(want)));
    }

    static int count(int[] nums, int target) {
        int[] r = searchRange(nums, target);
        return r[0] == -1 ? 0 : r[1] - r[0] + 1;
    }

    public static void main(String[] args) {
        System.out.println("day 45 - Find First and Last Position");

        int[] ex = { 5, 7, 7, 8, 8, 10 };
        check("example",             ex, 8, new int[] { 3, 4 });
        check("example absent (6)",  ex, 6, new int[] { -1, -1 });
        check("empty",               new int[] {}, 0, new int[] { -1, -1 });
        check("single present",      new int[] { 1 }, 1, new int[] { 0, 0 });
        check("single absent",       new int[] { 1 }, 0, new int[] { -1, -1 });
        check("exactly once",        new int[] { 1, 2, 3 }, 2, new int[] { 1, 1 });
        check("all target",          new int[] { 2, 2, 2, 2 }, 2, new int[] { 0, 3 });
        check("run at start",        new int[] { 1, 1, 2, 3 }, 1, new int[] { 0, 1 });
        check("run at end",          new int[] { 1, 2, 3, 3 }, 3, new int[] { 2, 3 });
        check("below range",         ex, 4, new int[] { -1, -1 });
        check("above range",         ex, 11, new int[] { -1, -1 });
        check("negatives",           new int[] { -3, -3, -1, 0 }, -3, new int[] { 0, 1 });
        check("all sevens of 8",     new int[] { 8, 8, 8, 8, 8, 8, 8 }, 8, new int[] { 0, 6 });

        report(count(ex, 8) == 2, "count of 8 = 2");
        report(count(ex, 6) == 0, "count of 6 = 0");

        // Dry-run claims: first search 3 iterations, last search 3, absent 3.
        iterations = 0; int f = findBound(ex, 8, true);
        report(f == 3 && iterations == 3, "first-occurrence dry run: 3 iterations, ans 3");
        iterations = 0; int l = findBound(ex, 8, false);
        report(l == 4 && iterations == 3, "last-occurrence dry run: 3 iterations, ans 4");
        iterations = 0; int a = findBound(ex, 6, true);
        report(a == -1 && iterations == 3, "absent dry run: 3 iterations, ans -1");
        iterations = 0; findBound(new int[] { 8, 8, 8, 8, 8, 8, 8 }, 8, true);
        report(iterations == 3, "all-8s first search: 3 iterations (" + iterations + ")");

        // Complexity claims at n = 10^5: one search on all duplicates is 17
        // iterations, two searches never exceed 34.
        int n = 100_000;
        int[] same = new int[n];
        Arrays.fill(same, 8);
        iterations = 0; findBound(same, 8, true);
        report(iterations == 16, "n = 10^5 all duplicates, first search: " + iterations + " iterations");
        int[] mixed = new int[n];
        for (int i = 0; i < n; i++) mixed[i] = i / 3;
        int worst = 0;
        for (int t = -1; t <= n / 3 + 1; t += 7) {
            iterations = 0; searchRange(mixed, t);
            worst = Math.max(worst, iterations);
        }
        iterations = 0; searchRange(same, 8); worst = Math.max(worst, iterations);
        report(worst <= 34, "n = 10^5: worst two-search total " + worst + " <= 34");

        Random rnd = new Random(45);
        int agree = 0;
        for (int t = 0; t < 600; t++) {
            int len = rnd.nextInt(30);
            int[] nums = new int[len];
            for (int i = 0; i < len; i++) nums[i] = rnd.nextInt(12) - 6;
            Arrays.sort(nums);
            int target = rnd.nextInt(16) - 8;
            int[] want = oracle(nums, target);
            if (Arrays.equals(searchRange(nums, target), want)
                    && Arrays.equals(searchRangeExpand(nums, target), want)
                    && Arrays.equals(searchRangeLB(nums, target), want)) agree++;
            else {
                failures++;
                System.out.println("  FAIL random " + Arrays.toString(nums) + ", target " + target);
            }
        }
        System.out.println("  ok   " + agree + "/600 random cases agree with a linear scan");

        System.out.println(failures == 0 ? "  day 45 PASSED" : "  day 45 had " + failures + " FAILURES");
    }
}
