// Correctness assertions for day 43 - Sliding Window Maximum.
//
// The monotonic deque, the lazy-deletion heap and the rescan brute force are
// copied verbatim from day-043.md. Checked on the worked example, every edge
// case listed, the running-max bug's claimed output, the dry-run join/removal
// counts, and random inputs where all three must agree.

import java.util.*;

class Day43Test {

    // ---- copy of day-043.md's implementation section ----
    static int[] maxSlidingWindow(int[] nums, int k) {

        int n = nums.length;
        int[] result = new int[n - k + 1];
        Deque<Integer> dq = new ArrayDeque<>();   // indices; values strictly decreasing front to back

        for (int i = 0; i < n; i++) {

            // 1. Expire: the front slid out of the window [i - k + 1, i].
            if (!dq.isEmpty() && dq.peekFirst() <= i - k) {
                dq.pollFirst();
            }

            // 2. Dismiss: anything not bigger than nums[i] can never be a max again.
            while (!dq.isEmpty() && nums[dq.peekLast()] <= nums[i]) {
                dq.pollLast();
            }

            // 3. Join.
            dq.offerLast(i);

            // 4. Answer, once the first full window exists.
            if (i >= k - 1) {
                result[i - k + 1] = nums[dq.peekFirst()];
            }
        }

        return result;
    }

    // ---- copy of the heap version from the complexity section ----
    static int[] heapVersion(int[] nums, int k) {

        int n = nums.length;
        int[] result = new int[n - k + 1];

        // max-heap of {value, index}
        PriorityQueue<int[]> heap = new PriorityQueue<>((a, b) -> Integer.compare(b[0], a[0]));

        for (int i = 0; i < n; i++) {
            heap.offer(new int[] { nums[i], i });
            if (i >= k - 1) {
                while (heap.peek()[1] <= i - k) {
                    heap.poll();               // lazy delete: the top has left the window
                }
                result[i - k + 1] = heap.peek()[0];
            }
        }

        return result;
    }

    // ---- copy of the brute-force section ----
    static int[] brute(int[] nums, int k) {

        int n = nums.length;
        int[] result = new int[n - k + 1];

        for (int i = 0; i + k <= n; i++) {
            int max = nums[i];                 // not 0 - values can be negative
            for (int j = i + 1; j < i + k; j++) {
                max = Math.max(max, nums[j]);
            }
            result[i] = max;
        }

        return result;
    }

    // The running-max shortcut the writeup says fails - used to confirm its output.
    static int[] runningMax(int[] nums, int k) {
        int[] result = new int[nums.length - k + 1];
        int max = Integer.MIN_VALUE;
        for (int i = 0; i < nums.length; i++) {
            max = Math.max(max, nums[i]);
            if (i >= k - 1) result[i - k + 1] = max;
        }
        return result;
    }

    static int failures = 0;

    static void check(String label, int[] nums, int k, int[] want) {
        int[] d = maxSlidingWindow(nums, k);
        int[] h = heapVersion(nums, k);
        int[] b = brute(nums, k);
        boolean ok = Arrays.equals(d, want) && Arrays.equals(h, want) && Arrays.equals(b, want);
        if (!ok) failures++;
        System.out.println((ok ? "  ok   " : "  FAIL ") + label + "  " + Arrays.toString(nums) + " k=" + k
            + " -> deque " + Arrays.toString(d) + ", heap " + Arrays.toString(h) + ", brute " + Arrays.toString(b)
            + (ok ? "" : "  expected " + Arrays.toString(want)));
    }

    static void claim(String label, boolean holds) {
        if (!holds) failures++;
        System.out.println((holds ? "  ok   " : "  FAIL ") + label);
    }

    public static void main(String[] args) {
        System.out.println("day 43 - Sliding Window Maximum");

        check("worked example", new int[] { 1, 3, -1, -3, 5, 3, 6, 7 }, 3, new int[] { 3, 3, 5, 5, 6, 7 });
        check("window of size 1", new int[] { 4, -2, 7 }, 1, new int[] { 4, -2, 7 });
        check("window is whole array", new int[] { 1, 3, 2 }, 3, new int[] { 3 });
        check("single element", new int[] { 1 }, 1, new int[] { 1 });
        check("strictly increasing", new int[] { 1, 2, 3, 4, 5 }, 2, new int[] { 2, 3, 4, 5 });
        check("strictly decreasing", new int[] { 5, 4, 3, 2, 1 }, 3, new int[] { 5, 4, 3 });
        check("max leaves the window", new int[] { 9, 1, 2, 3 }, 2, new int[] { 9, 2, 3 });
        check("duplicates", new int[] { 7, 7, 7, 7 }, 2, new int[] { 7, 7, 7 });
        check("all negative", new int[] { -4, -2, -9, -1 }, 2, new int[] { -2, -2, -1 });

        claim("running-max shortcut gives [9, 9, 9] on [9, 1, 2, 3] k=2",
            Arrays.equals(runningMax(new int[] { 9, 1, 2, 3 }, 2), new int[] { 9, 9, 9 }));

        // Dry-run claim: 8 joins, 1 expiry, 6 dismissals; deque never exceeds k.
        {
            int[] nums = { 1, 3, -1, -3, 5, 3, 6, 7 };
            int k = 3, joins = 0, expiries = 0, dismissals = 0, maxSize = 0;
            Deque<Integer> dq = new ArrayDeque<>();
            for (int i = 0; i < nums.length; i++) {
                if (!dq.isEmpty() && dq.peekFirst() <= i - k) { dq.pollFirst(); expiries++; }
                while (!dq.isEmpty() && nums[dq.peekLast()] <= nums[i]) { dq.pollLast(); dismissals++; }
                dq.offerLast(i); joins++;
                maxSize = Math.max(maxSize, dq.size());
            }
            claim("dry run counts: " + joins + " joins, " + expiries + " expiry, " + dismissals
                + " dismissals, max deque size " + maxSize,
                joins == 8 && expiries == 1 && dismissals == 6 && maxSize <= k);
        }

        Random rnd = new Random(43);
        int agree = 0;
        for (int t = 0; t < 600; t++) {
            int n = 1 + rnd.nextInt(40);
            int k = 1 + rnd.nextInt(n);
            int span = rnd.nextBoolean() ? 4 : 200;      // small span forces duplicates
            int[] nums = new int[n];
            for (int i = 0; i < n; i++) nums[i] = rnd.nextInt(span) - span / 2;
            int[] want = brute(nums, k);
            int[] d = maxSlidingWindow(nums, k);
            int[] h = heapVersion(nums, k);
            if (Arrays.equals(d, want) && Arrays.equals(h, want)) agree++;
            else {
                failures++;
                System.out.println("  FAIL random " + Arrays.toString(nums) + " k=" + k + " -> "
                    + Arrays.toString(d) + " / " + Arrays.toString(h) + " expected " + Arrays.toString(want));
            }
        }
        System.out.println("  ok   " + agree + "/600 random cases, deque and heap agree with brute force");

        System.out.println(failures == 0 ? "  day 43 PASSED" : "  day 43 had " + failures + " FAILURES");
    }
}
