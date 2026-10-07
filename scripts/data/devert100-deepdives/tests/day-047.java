// Correctness assertions for day 47 - Search in Rotated Sorted Array (LC 33).
//
// The scan, the sorted-half search, Find Minimum (LC 153) and the duplicates
// follow-up (LC 81) are copied verbatim from day-047.md. Every edge case is
// checked with the output the writeup claims; the dry-run step counts and the
// two failure demonstrations (plain binary search, and `<` instead of `<=`)
// are re-run; and every rotation of seeded random arrays is compared against
// the scan.

import java.util.*;

class Day47Test {

    // ---- brute force ----
    static int searchScan(int[] nums, int target) {
        for (int i = 0; i < nums.length; i++) {
            if (nums[i] == target) {
                return i;
            }
        }
        return -1;
    }

    // ---- implementation ----
    static int iterations = 0;   // instrumentation only

    static int search(int[] nums, int target) {
        int lo = 0;
        int hi = nums.length - 1;
        while (lo <= hi) {
            iterations++;
            int mid = lo + (hi - lo) / 2;
            if (nums[mid] == target) {
                return mid;
            }
            if (nums[lo] <= nums[mid]) {
                if (nums[lo] <= target && target < nums[mid]) {
                    hi = mid - 1;
                } else {
                    lo = mid + 1;
                }
            } else {
                if (nums[mid] < target && target <= nums[hi]) {
                    lo = mid + 1;
                } else {
                    hi = mid - 1;
                }
            }
        }
        return -1;
    }

    // ---- bonus: Find Minimum (LC 153) ----
    static int findMin(int[] nums) {
        int lo = 0;
        int hi = nums.length - 1;
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (nums[mid] > nums[hi]) {
                lo = mid + 1;
            } else {
                hi = mid;
            }
        }
        return nums[lo];
    }

    // ---- follow-up: duplicates (LC 81) ----
    static boolean searchDup(int[] nums, int target) {
        int lo = 0, hi = nums.length - 1;
        while (lo <= hi) {
            int mid = lo + (hi - lo) / 2;
            if (nums[mid] == target) return true;
            if (nums[lo] == nums[mid] && nums[mid] == nums[hi]) {
                lo++;
                hi--;
            } else if (nums[lo] <= nums[mid]) {
                if (nums[lo] <= target && target < nums[mid]) hi = mid - 1;
                else lo = mid + 1;
            } else {
                if (nums[mid] < target && target <= nums[hi]) lo = mid + 1;
                else hi = mid - 1;
            }
        }
        return false;
    }

    // ---- the two wrong versions the writeup demonstrates ----
    static int plainBinarySearch(int[] nums, int target) {
        int lo = 0, hi = nums.length - 1;
        while (lo <= hi) {
            int mid = lo + (hi - lo) / 2;
            if (nums[mid] == target) return mid;
            else if (nums[mid] < target) lo = mid + 1;
            else hi = mid - 1;
        }
        return -1;
    }

    static int strictLessBug(int[] nums, int target) {
        int lo = 0, hi = nums.length - 1;
        while (lo <= hi) {
            int mid = lo + (hi - lo) / 2;
            if (nums[mid] == target) return mid;
            if (nums[lo] < nums[mid]) {
                if (nums[lo] <= target && target < nums[mid]) hi = mid - 1; else lo = mid + 1;
            } else {
                if (nums[mid] < target && target <= nums[hi]) lo = mid + 1; else hi = mid - 1;
            }
        }
        return -1;
    }

    static int failures = 0;

    static void report(boolean ok, String msg) {
        if (!ok) failures++;
        System.out.println((ok ? "  ok   " : "  FAIL ") + msg);
    }

    static void check(String label, int[] nums, int target, int want) {
        int a = searchScan(nums, target), b = search(nums, target);
        boolean ok = a == want && b == want;
        report(ok, label + "  " + Arrays.toString(nums) + ", target " + target + " -> " + b
            + (ok ? "" : "  scan " + a + " expected " + want));
    }

    public static void main(String[] args) {
        System.out.println("day 47 - Search in Rotated Sorted Array");

        int[] ex = { 4, 5, 6, 7, 0, 1, 2 };
        check("example present",   ex, 0, 4);
        check("example absent",    ex, 3, -1);
        check("right-sorted run",  new int[] { 6, 7, 0, 1, 2, 4, 5 }, 5, 6);
        check("not rotated",       new int[] { 1, 2, 3, 4, 5 }, 4, 3);
        check("single present",    new int[] { 1 }, 1, 0);
        check("single absent",     new int[] { 1 }, 0, -1);
        check("two, target 1",     new int[] { 3, 1 }, 1, 1);
        check("two, target 3",     new int[] { 3, 1 }, 3, 0);
        check("first index",       ex, 4, 0);
        check("last index",        ex, 2, 6);
        check("rotated by one a",  new int[] { 2, 3, 4, 5, 1 }, 1, 4);
        check("rotated by one b",  new int[] { 5, 1, 2, 3, 4 }, 5, 0);
        check("above all",         ex, 8, -1);
        check("below all",         ex, -1, -1);

        // Dry-run step counts.
        iterations = 0; search(ex, 0);
        report(iterations == 3, "dry run target 0: 3 iterations (" + iterations + ")");
        iterations = 0; search(ex, 3);
        report(iterations == 3, "dry run target 3: 3 iterations (" + iterations + ")");
        iterations = 0; search(new int[] { 6, 7, 0, 1, 2, 4, 5 }, 5);
        report(iterations == 3, "right-sorted dry run: 3 iterations (" + iterations + ")");

        // The failures the writeup demonstrates.
        report(plainBinarySearch(ex, 0) == -1, "plain binary search misses 0 in the example");
        report(strictLessBug(new int[] { 3, 1 }, 1) == -1, "`<` instead of `<=` returns -1 on [3, 1], 1");

        report(findMin(new int[] { 3, 4, 5, 1, 2 }) == 1, "findMin [3,4,5,1,2] = 1");
        report(findMin(ex) == 0, "findMin example = 0");
        report(findMin(new int[] { 11, 13, 15, 17 }) == 11, "findMin unrotated = 11");

        int[] dup = { 2, 5, 6, 0, 0, 1, 2 };
        report(searchDup(dup, 0) && !searchDup(dup, 3), "LC 81: [2,5,6,0,0,1,2] 0 true, 3 false");
        report(searchDup(new int[] { 1, 0, 1, 1, 1 }, 0), "LC 81: [1,0,1,1,1] 0 true");

        // Random: every rotation of random distinct sorted arrays.
        Random rnd = new Random(47);
        int agree = 0, total = 0;
        for (int t = 0; t < 120; t++) {
            int n = 1 + rnd.nextInt(14);
            TreeSet<Integer> set = new TreeSet<>();
            while (set.size() < n) set.add(rnd.nextInt(61) - 30);
            int[] sorted = new int[n];
            int k = 0;
            for (int v : set) sorted[k++] = v;
            for (int r = 0; r < n; r++) {
                int[] rot = new int[n];
                for (int i = 0; i < n; i++) rot[i] = sorted[(i + r) % n];
                for (int q = 0; q < 3; q++) {
                    int target = q == 0 ? rot[rnd.nextInt(n)] : rnd.nextInt(71) - 35;
                    total++;
                    boolean ok = search(rot, target) == searchScan(rot, target)
                        && findMin(rot) == sorted[0];
                    if (ok) agree++;
                    else { failures++; System.out.println("  FAIL random " + Arrays.toString(rot) + ", target " + target); }
                }
            }
        }
        System.out.println("  ok   " + agree + "/" + total + " rotations agree with the scan (search + findMin)");

        // Random with duplicates for LC 81.
        int dupAgree = 0;
        for (int t = 0; t < 500; t++) {
            int n = 1 + rnd.nextInt(12);
            int[] sorted = new int[n];
            for (int i = 0; i < n; i++) sorted[i] = rnd.nextInt(5);
            Arrays.sort(sorted);
            int r = rnd.nextInt(n);
            int[] rot = new int[n];
            for (int i = 0; i < n; i++) rot[i] = sorted[(i + r) % n];
            int target = rnd.nextInt(6);
            if (searchDup(rot, target) == (searchScan(rot, target) != -1)) dupAgree++;
            else { failures++; System.out.println("  FAIL dup " + Arrays.toString(rot) + ", target " + target); }
        }
        System.out.println("  ok   " + dupAgree + "/500 duplicate cases agree (LC 81)");

        System.out.println(failures == 0 ? "  day 47 PASSED" : "  day 47 had " + failures + " FAILURES");
    }
}
