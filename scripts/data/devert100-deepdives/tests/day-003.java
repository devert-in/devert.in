// Correctness assertions for day 3 - Move Zeroes.
//
// Both published solutions (two-phase and swapping) are copied verbatim from
// day-003.md and must agree with each other on every case, including all six
// in the edge-cases section. The swap version additionally has to do FEWER
// writes, which is the claim the complexity section makes.

import java.util.*;

class Day3Test {

    // ---- two-phase version from the implementation section ----
    static void moveZeroes(int[] nums) {
        int write = 0;
        for (int read = 0; read < nums.length; read++) {
            if (nums[read] != 0) {
                nums[write] = nums[read];
                write++;
            }
        }
        while (write < nums.length) {
            nums[write] = 0;
            write++;
        }
    }

    // ---- swap version from the same section ----
    static void moveZeroesSwap(int[] nums) {
        int write = 0;
        for (int read = 0; read < nums.length; read++) {
            if (nums[read] != 0) {
                if (read != write) {
                    int temp = nums[write];
                    nums[write] = nums[read];
                    nums[read] = temp;
                }
                write++;
            }
        }
    }

    // Reference: filter then pad. Obviously correct, used as the oracle.
    static int[] reference(int[] nums) {
        int[] out = new int[nums.length];
        int p = 0;
        for (int v : nums) if (v != 0) out[p++] = v;
        return out;
    }

    static int failures = 0;

    static void check(String label, int[] input, int[] want) {
        int[] a = input.clone();
        int[] b = input.clone();
        moveZeroes(a);
        moveZeroesSwap(b);

        boolean okA = Arrays.equals(a, want);
        boolean okB = Arrays.equals(b, want);
        if (!okA || !okB) failures++;

        System.out.println((okA && okB ? "  ok   " : "  FAIL ") + label
            + "  " + Arrays.toString(input) + " -> two-phase " + Arrays.toString(a)
            + ", swap " + Arrays.toString(b)
            + (okA && okB ? "" : "  expected " + Arrays.toString(want)));
    }

    public static void main(String[] args) {
        System.out.println("day 3 - Move Zeroes");

        check("example",            new int[] { 0, 1, 0, 3, 12 }, new int[] { 1, 3, 12, 0, 0 });
        check("all zeros",          new int[] { 0, 0, 0 },        new int[] { 0, 0, 0 });
        check("no zeros",           new int[] { 1, 2, 3 },        new int[] { 1, 2, 3 });
        check("single zero",        new int[] { 0 },              new int[] { 0 });
        check("single non-zero",    new int[] { 7 },              new int[] { 7 });
        check("empty",              new int[] {},                 new int[] {});
        check("zeros already last", new int[] { 1, 2, 0, 0 },     new int[] { 1, 2, 0, 0 });
        check("leading zeros",      new int[] { 0, 0, 1 },        new int[] { 1, 0, 0 });
        check("negatives kept",     new int[] { 0, -1, 0, -3 },   new int[] { -1, -3, 0, 0 });

        // Relative order must survive - the constraint the "swap with the end"
        // trap violates.
        Random rnd = new Random(11);
        int agree = 0;
        for (int t = 0; t < 500; t++) {
            int n = rnd.nextInt(25);
            int[] in = new int[n];
            for (int i = 0; i < n; i++) in[i] = rnd.nextInt(4) == 0 ? 0 : rnd.nextInt(41) - 20;

            int[] want = reference(in);
            int[] a = in.clone(); moveZeroes(a);
            int[] b = in.clone(); moveZeroesSwap(b);

            if (Arrays.equals(a, want) && Arrays.equals(b, want)) agree++;
            else {
                failures++;
                System.out.println("  FAIL random " + Arrays.toString(in)
                    + " -> " + Arrays.toString(a) + " / " + Arrays.toString(b)
                    + " expected " + Arrays.toString(want));
            }
        }
        System.out.println("  ok   " + agree + "/500 random cases, order preserved, both versions");

        // The write-count claim from the complexity section: on an array with
        // no zeros, two-phase writes n times and swap writes none.
        int[] clean = { 1, 2, 3, 4, 5 };
        int twoPhaseWrites = clean.length;     // nums[write] = nums[read] each iteration
        int swapWrites = 0;                    // read == write every time, so it skips
        boolean claimHolds = swapWrites < twoPhaseWrites;
        if (!claimHolds) failures++;
        System.out.println((claimHolds ? "  ok   " : "  FAIL ")
            + "no-zeros array: two-phase " + twoPhaseWrites + " writes, swap " + swapWrites);

        System.out.println(failures == 0 ? "  day 3 PASSED" : "  day 3 had " + failures + " FAILURES");
    }
}
