// Correctness assertions for day 44 - Binary Search (LC 704).
//
// The brute force, the inclusive template, the half-open template and the
// Search Insert follow-up are copied verbatim from day-044.md. Every edge case
// in the writeup is checked with the exact output it claims, plus a seeded
// random comparison against the linear scan and the overflow arithmetic the
// optimization section quotes.

import java.util.*;

class Day44Test {

    // ---- brute force ----
    static int searchLinear(int[] nums, int target) {
        for (int i = 0; i < nums.length; i++) {
            if (nums[i] == target) {
                return i;
            }
        }
        return -1;
    }

    // ---- implementation: inclusive template ----
    static int search(int[] nums, int target) {
        int lo = 0;
        int hi = nums.length - 1;
        while (lo <= hi) {
            int mid = lo + (hi - lo) / 2;
            if (nums[mid] == target) {
                return mid;
            } else if (nums[mid] < target) {
                lo = mid + 1;
            } else {
                hi = mid - 1;
            }
        }
        return -1;
    }

    // ---- half-open template ----
    static int searchHalfOpen(int[] nums, int target) {
        int lo = 0;
        int hi = nums.length;
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (nums[mid] < target) {
                lo = mid + 1;
            } else {
                hi = mid;
            }
        }
        return (lo < nums.length && nums[lo] == target) ? lo : -1;
    }

    // ---- follow-up: Search Insert Position ----
    static int searchInsert(int[] nums, int target) {
        int lo = 0;
        int hi = nums.length;
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (nums[mid] < target) {
                lo = mid + 1;
            } else {
                hi = mid;
            }
        }
        return lo;
    }

    static int failures = 0;

    static void report(boolean ok, String msg) {
        if (!ok) failures++;
        System.out.println((ok ? "  ok   " : "  FAIL ") + msg);
    }

    static void check(String label, int[] nums, int target, int want) {
        int a = searchLinear(nums, target);
        int b = search(nums, target);
        int c = searchHalfOpen(nums, target);
        boolean ok = a == want && b == want && c == want;
        report(ok, label + "  " + Arrays.toString(nums) + ", target " + target
            + " -> linear " + a + ", inclusive " + b + ", half-open " + c
            + (ok ? "" : "  expected " + want));
    }

    // Counts loop iterations of the inclusive template, for the dry-run claims.
    static int steps(int[] nums, int target) {
        int lo = 0, hi = nums.length - 1, s = 0;
        while (lo <= hi) {
            s++;
            int mid = lo + (hi - lo) / 2;
            if (nums[mid] == target) return s;
            else if (nums[mid] < target) lo = mid + 1;
            else hi = mid - 1;
        }
        return s;
    }

    public static void main(String[] args) {
        System.out.println("day 44 - Binary Search");

        int[] ex = { -1, 0, 3, 5, 9, 12 };
        check("example present",        ex, 9, 4);
        check("example absent",         ex, 2, -1);
        check("single present",         new int[] { 5 }, 5, 0);
        check("single absent",          new int[] { 5 }, -5, -1);
        check("first element",          ex, -1, 0);
        check("last element",           ex, 12, 5);
        check("smaller than all",       ex, -5, -1);
        check("larger than all",        ex, 13, -1);
        check("gap",                    ex, 4, -1);
        check("two elements, right",    new int[] { 2, 5 }, 5, 1);
        check("two elements, left",     new int[] { 2, 5 }, 2, 0);
        check("empty",                  new int[] {}, 3, -1);

        report(steps(ex, 9) == 2, "dry run: target 9 found in 2 iterations (" + steps(ex, 9) + ")");
        report(steps(ex, 2) == 3, "dry run: target 2 rejected after 3 iterations (" + steps(ex, 2) + ")");
        report(steps(ex, 12) == 3, "edge: target 12 found in 3 iterations (" + steps(ex, 12) + ")");
        report(searchInsert(ex, 2) == 2, "failed search for 2 leaves lo = 2 (insert point)");
        report(searchInsert(ex, 4) == 3, "gap: 4 would be inserted at 3");

        int[] si = { 1, 3, 5, 6 };
        report(searchInsert(si, 5) == 2, "searchInsert [1,3,5,6], 5 -> 2");
        report(searchInsert(si, 2) == 1, "searchInsert [1,3,5,6], 2 -> 1");
        report(searchInsert(si, 7) == 4, "searchInsert [1,3,5,6], 7 -> 4");
        report(searchInsert(si, 0) == 0, "searchInsert [1,3,5,6], 0 -> 0");

        // Overflow arithmetic quoted in the optimization and edge-case sections.
        int lo = 1_500_000_000, hi = 2_000_000_000;
        int bad = (lo + hi) / 2, good = lo + (hi - lo) / 2;
        report(lo + hi == -794_967_296 && bad == -397_483_648 && good == 1_750_000_000,
            "overflow: (lo+hi)/2 = " + bad + ", lo+(hi-lo)/2 = " + good);

        // Worst-case iteration counts in the complexity table.
        int[] sizes = { 6, 1000, 10000, 1000000 };
        int[] wantSteps = { 3, 10, 14, 20 };
        for (int k = 0; k < sizes.length; k++) {
            int n = sizes[k];
            int[] arr = new int[n];
            for (int i = 0; i < n; i++) arr[i] = 2 * i;
            int worst = 0;
            for (int t = -1; t <= 2 * n; t++) worst = Math.max(worst, steps(arr, t));
            report(worst == wantSteps[k], "n = " + n + ": worst case " + worst + " iterations");
        }

        Random rnd = new Random(44);
        int agree = 0;
        for (int t = 0; t < 600; t++) {
            int n = rnd.nextInt(30);
            TreeSet<Integer> set = new TreeSet<>();
            while (set.size() < n) set.add(rnd.nextInt(201) - 100);
            int[] nums = new int[n];
            int i = 0;
            for (int v : set) nums[i++] = v;
            int target = rnd.nextInt(221) - 110;

            int want = searchLinear(nums, target);
            int ins = 0;
            while (ins < n && nums[ins] < target) ins++;
            if (search(nums, target) == want && searchHalfOpen(nums, target) == want
                    && searchInsert(nums, target) == ins) agree++;
            else {
                failures++;
                System.out.println("  FAIL random " + Arrays.toString(nums) + ", target " + target);
            }
        }
        System.out.println("  ok   " + agree + "/600 random cases agree with the linear scan");

        System.out.println(failures == 0 ? "  day 44 PASSED" : "  day 44 had " + failures + " FAILURES");
    }
}
