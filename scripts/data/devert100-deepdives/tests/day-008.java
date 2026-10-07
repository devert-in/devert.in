// Correctness assertions for day 8 - Sort Colors (Dutch National Flag).
//
// The counting brute force and the three-pointer solution are copied verbatim
// from day-008.md. Both must produce the sorted array on the worked example,
// every edge case in the edge-cases section, and 500 random inputs (oracle:
// Arrays.sort). The two bugs the writeup names - advancing mid after the high
// swap, and looping while mid < high - are reproduced and must FAIL on exactly
// the inputs the writeup says they fail on.

import java.util.*;

class Day8Test {

    // ---- brute force from the bruteForce section ----
    static void sortColorsCount(int[] nums) {
        int[] count = new int[3];
        for (int num : nums) {
            count[num]++;
        }
        int idx = 0;
        for (int color = 0; color < 3; color++) {
            for (int c = 0; c < count[color]; c++) {
                nums[idx] = color;
                idx++;
            }
        }
    }

    // ---- optimal from the implementation section ----
    static void sortColors(int[] nums) {
        int low = 0;
        int mid = 0;
        int high = nums.length - 1;
        while (mid <= high) {
            if (nums[mid] == 0) {
                swap(nums, low, mid);
                low++;
                mid++;
            } else if (nums[mid] == 1) {
                mid++;
            } else {
                swap(nums, mid, high);
                high--;
            }
        }
    }

    static void swap(int[] nums, int i, int j) {
        int temp = nums[i];
        nums[i] = nums[j];
        nums[j] = temp;
    }

    // ---- the two named bugs ----
    static void buggyMidAfterHigh(int[] nums) {
        int low = 0, mid = 0, high = nums.length - 1;
        while (mid <= high) {
            if (nums[mid] == 0) { swap(nums, low, mid); low++; mid++; }
            else if (nums[mid] == 1) { mid++; }
            else { swap(nums, mid, high); high--; mid++; }
        }
    }

    static void buggyStrictLess(int[] nums) {
        int low = 0, mid = 0, high = nums.length - 1;
        while (mid < high) {
            if (nums[mid] == 0) { swap(nums, low, mid); low++; mid++; }
            else if (nums[mid] == 1) { mid++; }
            else { swap(nums, mid, high); high--; }
        }
    }

    static int failures = 0;

    static void check(String label, int[] input, int[] want) {
        int[] a = input.clone(); sortColorsCount(a);
        int[] b = input.clone(); sortColors(b);
        boolean ok = Arrays.equals(a, want) && Arrays.equals(b, want);
        if (!ok) failures++;
        System.out.println((ok ? "  ok   " : "  FAIL ") + label + "  " + Arrays.toString(input)
            + " -> count " + Arrays.toString(a) + ", dnf " + Arrays.toString(b)
            + (ok ? "" : "  expected " + Arrays.toString(want)));
    }

    static void checkBug(String label, int[] input, int[] wantWrong, java.util.function.Consumer<int[]> bug) {
        int[] a = input.clone();
        bug.accept(a);
        boolean ok = Arrays.equals(a, wantWrong);
        if (!ok) failures++;
        System.out.println((ok ? "  ok   " : "  FAIL ") + "bug reproduced: " + label + "  "
            + Arrays.toString(input) + " -> " + Arrays.toString(a));
    }

    public static void main(String[] args) {
        System.out.println("day 8 - Sort Colors");

        check("example",          new int[] { 2, 0, 2, 1, 1, 0 }, new int[] { 0, 0, 1, 1, 2, 2 });
        check("second example",   new int[] { 2, 0, 1 },          new int[] { 0, 1, 2 });
        check("unchecked swap-in", new int[] { 1, 2, 0 },         new int[] { 0, 1, 2 });
        check("single 0",         new int[] { 0 },                new int[] { 0 });
        check("single 2",         new int[] { 2 },                new int[] { 2 });
        check("two, 2 0",         new int[] { 2, 0 },             new int[] { 0, 2 });
        check("two, 1 0",         new int[] { 1, 0 },             new int[] { 0, 1 });
        check("all ones",         new int[] { 1, 1, 1 },          new int[] { 1, 1, 1 });
        check("all zeros",        new int[] { 0, 0, 0 },          new int[] { 0, 0, 0 });
        check("all twos",         new int[] { 2, 2, 2 },          new int[] { 2, 2, 2 });
        check("already sorted",   new int[] { 0, 0, 1, 1, 2, 2 }, new int[] { 0, 0, 1, 1, 2, 2 });
        check("reverse sorted",   new int[] { 2, 2, 1, 1, 0, 0 }, new int[] { 0, 0, 1, 1, 2, 2 });
        check("no ones",          new int[] { 2, 0, 2, 0 },       new int[] { 0, 0, 2, 2 });
        check("empty",            new int[] {},                   new int[] {});

        checkBug("mid++ after high swap", new int[] { 1, 2, 0 }, new int[] { 1, 0, 2 }, Day8Test::buggyMidAfterHigh);
        checkBug("while (mid < high)",    new int[] { 1, 0 },    new int[] { 1, 0 },    Day8Test::buggyStrictLess);

        // Dry-run claim: exactly n iterations (unknown zone shrinks by one per step).
        int[] ex = { 2, 0, 2, 1, 1, 0 };
        int low = 0, mid = 0, high = ex.length - 1, steps = 0;
        while (mid <= high) {
            steps++;
            if (ex[mid] == 0) { swap(ex, low, mid); low++; mid++; }
            else if (ex[mid] == 1) { mid++; }
            else { swap(ex, mid, high); high--; }
        }
        boolean stepsOk = steps == 6 && low == 2 && mid == 4 && high == 3;
        if (!stepsOk) failures++;
        System.out.println((stepsOk ? "  ok   " : "  FAIL ") + "dry run: " + steps
            + " iterations, final low=" + low + " mid=" + mid + " high=" + high);

        Random rnd = new Random(8);
        int agree = 0;
        for (int t = 0; t < 500; t++) {
            int n = rnd.nextInt(30);
            int[] in = new int[n];
            for (int i = 0; i < n; i++) in[i] = rnd.nextInt(3);
            int[] want = in.clone(); Arrays.sort(want);
            int[] a = in.clone(); sortColorsCount(a);
            int[] b = in.clone(); sortColors(b);
            if (Arrays.equals(a, want) && Arrays.equals(b, want)) agree++;
            else {
                failures++;
                System.out.println("  FAIL random " + Arrays.toString(in) + " -> "
                    + Arrays.toString(a) + " / " + Arrays.toString(b));
            }
        }
        System.out.println("  ok   " + agree + "/500 random cases match Arrays.sort, both versions");

        System.out.println(failures == 0 ? "  day 8 PASSED" : "  day 8 had " + failures + " FAILURES");
    }
}
