// Correctness assertions for day 18 - Maximum Average Subarray I (LC 643).
//
// The brute force, the sliding-window implementation and the LC 209 follow-up
// are copied verbatim from day-018.md. Brute force and window must agree on
// the worked example, every edge case in the edge-cases section, and a few
// hundred random inputs. The follow-up is checked against an O(n^2) oracle.

import java.util.*;

class Day18Test {

    // ---- brute force from the bruteForce section ----
    static double brute(int[] nums, int k) {
        int n = nums.length;
        int best = Integer.MIN_VALUE;

        for (int i = 0; i + k <= n; i++) {

            int sum = 0;
            for (int j = i; j < i + k; j++) {
                sum += nums[j];
            }

            best = Math.max(best, sum);
        }

        return (double) best / k;
    }

    // ---- optimal from the implementation section ----
    static double findMaxAverage(int[] nums, int k) {
        int sum = 0;
        for (int i = 0; i < k; i++) {
            sum += nums[i];
        }

        int best = sum;

        for (int r = k; r < nums.length; r++) {
            sum += nums[r] - nums[r - k];
            best = Math.max(best, sum);
        }

        return (double) best / k;
    }

    // ---- LC 209 follow-up from the implementation section ----
    static int minSubArrayLen(int target, int[] nums) {
        int left = 0, sum = 0, best = Integer.MAX_VALUE;

        for (int right = 0; right < nums.length; right++) {
            sum += nums[right];

            while (sum >= target) {
                best = Math.min(best, right - left + 1);
                sum -= nums[left];
                left++;
            }
        }

        return best == Integer.MAX_VALUE ? 0 : best;
    }

    static int minSubArrayLenOracle(int target, int[] nums) {
        int best = 0;
        for (int i = 0; i < nums.length; i++) {
            long s = 0;
            for (int j = i; j < nums.length; j++) {
                s += nums[j];
                if (s >= target) {
                    int len = j - i + 1;
                    if (best == 0 || len < best) best = len;
                    break;
                }
            }
        }
        return best;
    }

    static int failures = 0;

    static void check(String label, int[] nums, int k, double want) {
        double a = findMaxAverage(nums, k);
        double b = brute(nums, k);
        boolean ok = Math.abs(a - want) < 1e-9 && Math.abs(b - want) < 1e-9;
        if (!ok) failures++;
        String shown = nums.length > 12 ? "[n=" + nums.length + "]" : Arrays.toString(nums);
        System.out.println((ok ? "  ok   " : "  FAIL ") + label + "  " + shown + ", k=" + k
            + " -> window " + a + ", brute " + b + (ok ? "" : "  expected " + want));
    }

    public static void main(String[] args) {
        System.out.println("day 18 - Maximum Average Subarray I");

        check("example",             new int[] { 1, 12, -5, -6, 50, 3 }, 4, 12.75);
        check("all negative",        new int[] { -1, -2, -3 }, 2, -1.5);
        check("k equals n",          new int[] { 1, 2, 3, 4 }, 4, 2.5);
        check("single element",      new int[] { 5 }, 1, 5.0);
        check("k = 1 is max element",new int[] { 3, -1, 7, 2 }, 1, 7.0);
        check("best window last",    new int[] { 1, 1, 1, 9 }, 2, 5.0);
        check("all equal",           new int[] { 2, 2, 2 }, 2, 2.0);
        check("integer division",    new int[] { 1, 2 }, 2, 1.5);

        int[] big = new int[100000];
        Arrays.fill(big, 10000);
        check("largest sum",         big, 100000, 10000.0);

        // The claim that seeding best with 0 is wrong on all-negative input.
        int[] neg = { -1, -2, -3 };
        int sum = neg[0] + neg[1], bestZero = 0;
        bestZero = Math.max(bestZero, sum);
        sum += neg[2] - neg[0];
        bestZero = Math.max(bestZero, sum);
        boolean trapShown = bestZero == 0 && findMaxAverage(neg, 2) == -1.5;
        if (!trapShown) failures++;
        System.out.println((trapShown ? "  ok   " : "  FAIL ") + "seeding best=0 gives " + (double) bestZero / 2 + " instead of -1.5");

        // The mis-parenthesised cast really truncates.
        int best = 3, k = 2;
        boolean truncates = (double) (best / k) == 1.0 && (double) best / k == 1.5;
        if (!truncates) failures++;
        System.out.println((truncates ? "  ok   " : "  FAIL ") + "(double)(3/2) = 1.0, (double)3/2 = 1.5");

        Random rnd = new Random(18);
        int agree = 0;
        for (int t = 0; t < 500; t++) {
            int n = 1 + rnd.nextInt(30);
            int kk = 1 + rnd.nextInt(n);
            int[] in = new int[n];
            for (int i = 0; i < n; i++) in[i] = rnd.nextInt(20001) - 10000;
            double a = findMaxAverage(in, kk), b = brute(in, kk);
            if (Math.abs(a - b) < 1e-9) agree++;
            else {
                failures++;
                System.out.println("  FAIL random " + Arrays.toString(in) + " k=" + kk + " -> " + a + " vs " + b);
            }
        }
        System.out.println("  ok   " + agree + "/500 random cases, window == brute force");

        int agree209 = 0;
        for (int t = 0; t < 500; t++) {
            int n = 1 + rnd.nextInt(25);
            int[] in = new int[n];
            for (int i = 0; i < n; i++) in[i] = 1 + rnd.nextInt(10);
            int target = 1 + rnd.nextInt(80);
            int a = minSubArrayLen(target, in), b = minSubArrayLenOracle(target, in);
            if (a == b) agree209++;
            else {
                failures++;
                System.out.println("  FAIL LC209 " + Arrays.toString(in) + " target=" + target + " -> " + a + " vs " + b);
            }
        }
        System.out.println("  ok   " + agree209 + "/500 random LC 209 cases match the O(n^2) oracle");

        System.out.println(failures == 0 ? "  day 18 PASSED" : "  day 18 had " + failures + " FAILURES");
    }
}
