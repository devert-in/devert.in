// Correctness assertions for day 27 - Count Number of Nice Subarrays (LC 1248).
//
// The brute force, the prefix odd-count array solution and the
// atMost(k) - atMost(k - 1) sliding window are copied verbatim from
// day-027.md. All three must match every edge case and agree on random
// inputs. The atMost totals quoted in the optimization table (13 and 9) and
// the "no seed drops 4 to 3" claim are checked directly.

import java.util.*;

class Day27Test {

    // ---- brute force from the bruteForce section ----
    static int brute(int[] nums, int k) {

        int count = 0;

        for (int start = 0; start < nums.length; start++) {

            int odds = 0;

            for (int end = start; end < nums.length; end++) {
                if (nums[end] % 2 == 1) {
                    odds++;
                }
                if (odds == k) {
                    count++;
                }
            }
        }

        return count;
    }

    // ---- optimal from the implementation section ----
    static int numberOfSubarrays(int[] nums, int k) {

        // seen[c] = how many prefixes so far contain exactly c odd numbers.
        // c is always between 0 and n, so an array replaces the HashMap.
        int[] seen = new int[nums.length + 1];
        seen[0] = 1;                // the empty prefix has zero odds

        int odds = 0;
        int count = 0;

        for (int num : nums) {
            odds += num & 1;        // 1 if odd, 0 if even

            if (odds >= k) {
                count += seen[odds - k];
            }

            seen[odds]++;           // record AFTER the lookup
        }

        return count;
    }

    // ---- atMost version from the implementation section ----
    static int viaAtMost(int[] nums, int k) {
        return atMost(nums, k) - atMost(nums, k - 1);
    }

    // number of subarrays with AT MOST `limit` odd numbers
    static int atMost(int[] nums, int limit) {

        int left = 0;
        int odds = 0;
        int total = 0;

        for (int right = 0; right < nums.length; right++) {
            odds += nums[right] & 1;

            while (odds > limit) {
                odds -= nums[left] & 1;
                left++;
            }

            total += right - left + 1;      // subarrays ending at right
        }

        return total;
    }

    // Seed omitted, as the lines-that-matter section warns.
    static int noSeed(int[] nums, int k) {
        int[] seen = new int[nums.length + 1];
        int odds = 0, count = 0;
        for (int num : nums) {
            odds += num & 1;
            if (odds >= k) count += seen[odds - k];
            seen[odds]++;
        }
        return count;
    }

    static int failures = 0;

    static void check(String label, int[] nums, int k, int want) {
        int a = brute(nums, k), b = numberOfSubarrays(nums, k), c = viaAtMost(nums, k);
        boolean ok = a == want && b == want && c == want;
        if (!ok) failures++;
        System.out.println((ok ? "  ok   " : "  FAIL ") + label + "  " + Arrays.toString(nums) + ", k=" + k
            + " -> brute " + a + ", prefix " + b + ", atMost " + c + (ok ? "" : "  expected " + want));
    }

    static void claim(String label, int got, int want) {
        boolean ok = got == want;
        if (!ok) failures++;
        System.out.println((ok ? "  ok   " : "  FAIL ") + label + " -> " + got + (ok ? "" : "  expected " + want));
    }

    public static void main(String[] args) {
        System.out.println("day 27 - Count Number of Nice Subarrays");

        int[] ex = { 2, 1, 2, 1, 1 };
        check("example",               ex, 2, 4);
        check("no odds",               new int[] { 2, 4, 6 }, 1, 0);
        check("k > odds",              new int[] { 1, 2, 1 }, 3, 0);
        check("all odd, k=1",          new int[] { 1, 1, 1 }, 1, 3);
        check("all odd, k=2",          new int[] { 1, 1, 1 }, 2, 2);
        check("single odd",            new int[] { 1 }, 1, 1);
        check("single even",           new int[] { 2 }, 1, 0);
        check("evens both sides",      new int[] { 2, 1, 2 }, 1, 4);
        check("LC padding example",    new int[] { 2, 2, 2, 1, 2, 2, 1, 2, 2, 2 }, 2, 16);
        check("LC first example",      new int[] { 1, 1, 2, 1, 1 }, 3, 2);

        claim("atMost(2) on the example", atMost(ex, 2), 13);
        claim("atMost(1) on the example", atMost(ex, 1), 9);
        claim("without seen[0] = 1 on the example", noSeed(ex, 2), 3);

        Random rnd = new Random(27);
        int agree = 0;
        for (int t = 0; t < 500; t++) {
            int n = 1 + rnd.nextInt(30);
            int[] in = new int[n];
            for (int i = 0; i < n; i++) in[i] = 1 + rnd.nextInt(10);
            int k = 1 + rnd.nextInt(n);
            int a = brute(in, k), b = numberOfSubarrays(in, k), c = viaAtMost(in, k);
            if (a == b && b == c) agree++;
            else {
                failures++;
                System.out.println("  FAIL random " + Arrays.toString(in) + ", k=" + k + " -> " + a + " / " + b + " / " + c);
            }
        }
        System.out.println("  ok   " + agree + "/500 random cases, all three versions agree");

        System.out.println(failures == 0 ? "  day 27 PASSED" : "  day 27 had " + failures + " FAILURES");
    }
}
