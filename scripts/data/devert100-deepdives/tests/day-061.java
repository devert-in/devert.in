// Correctness assertions for day 61 - Kth Largest Element in an Array.
//
// The sort brute force, the size-k min heap and the three-way Quickselect are
// copied verbatim from day-061.md. All three must agree on the examples, every
// edge case in the writeup, the dry-run heap states, the wrong-heap trap's
// claimed output, and a few hundred random arrays.

import java.util.*;

class Day61Test {

    // ---- brute force ----
    static int findKthLargestSort(int[] nums, int k) {
        Arrays.sort(nums);
        return nums[nums.length - k];
    }

    // ---- optimal: min heap of size k ----
    static int findKthLargest(int[] nums, int k) {
        PriorityQueue<Integer> heap = new PriorityQueue<>();
        for (int num : nums) {
            heap.offer(num);
            if (heap.size() > k) {
                heap.poll();
            }
        }
        return heap.peek();
    }

    // ---- follow-up: Quickselect (verbatim, nested) ----
    static class QuickSelect {
        private final Random rand = new Random();

        public int findKthLargest(int[] nums, int k) {
            int target = nums.length - k;
            int lo = 0, hi = nums.length - 1;
            while (true) {
                int pivot = nums[lo + rand.nextInt(hi - lo + 1)];
                int lt = lo, i = lo, gt = hi;
                while (i <= gt) {
                    if (nums[i] < pivot) {
                        swap(nums, lt++, i++);
                    } else if (nums[i] > pivot) {
                        swap(nums, i, gt--);
                    } else {
                        i++;
                    }
                }
                if (target < lt) {
                    hi = lt - 1;
                } else if (target > gt) {
                    lo = gt + 1;
                } else {
                    return pivot;
                }
            }
        }

        private void swap(int[] a, int i, int j) {
            int t = a[i];
            a[i] = a[j];
            a[j] = t;
        }
    }

    // ---- the documented trap: max heap of size k ----
    static int wrongHeap(int[] nums, int k) {
        PriorityQueue<Integer> heap = new PriorityQueue<>(Collections.reverseOrder());
        for (int num : nums) { heap.offer(num); if (heap.size() > k) heap.poll(); }
        return heap.peek();
    }

    static int failures = 0;
    static final QuickSelect QS = new QuickSelect();

    static void check(String label, int[] in, int k, int want) {
        int a = findKthLargestSort(in.clone(), k);
        int b = findKthLargest(in.clone(), k);
        int c = QS.findKthLargest(in.clone(), k);
        boolean ok = a == want && b == want && c == want;
        if (!ok) failures++;
        System.out.println((ok ? "  ok   " : "  FAIL ") + label + "  " + Arrays.toString(in) + " k=" + k
            + " -> sort " + a + ", heap " + b + ", quickselect " + c + (ok ? "" : "  expected " + want));
    }

    static void claim(String label, boolean ok) {
        if (!ok) failures++;
        System.out.println((ok ? "  ok   " : "  FAIL ") + label);
    }

    public static void main(String[] args) {
        System.out.println("day 61 - Kth Largest Element in an Array");

        int[] ex1 = { 3, 2, 1, 5, 6, 4 };
        int[] ex2 = { 3, 2, 3, 1, 2, 4, 5, 5, 6 };
        check("example 1",            ex1, 2, 5);
        check("example 2 (dry run)",  ex2, 4, 4);
        check("k = 1 is the max",     ex1, 1, 6);
        check("k = n is the min",     ex1, 6, 1);
        check("duplicates count",     new int[] { 3, 3, 2 }, 2, 3);
        check("all equal",            new int[] { 7, 7, 7 }, 2, 7);
        check("negatives",            new int[] { -1, -5, -3 }, 2, -3);
        check("single element",       new int[] { 1 }, 1, 1);

        int trap = wrongHeap(ex1, 2);
        claim("max-heap trap returns 2 (got " + trap + ")", trap == 2);

        // Dry-run heap tops after each step: 3 2 2 1 2 2 3 3 4.
        int[] tops = { 3, 2, 2, 1, 2, 2, 3, 3, 4 };
        PriorityQueue<Integer> h = new PriorityQueue<>();
        boolean topsOk = true;
        for (int i = 0; i < ex2.length; i++) {
            h.offer(ex2[i]);
            if (h.size() > 4) h.poll();
            topsOk &= h.peek() == tops[i];
        }
        List<Integer> fin = new ArrayList<>(h);
        Collections.sort(fin);
        claim("dry-run tops match, final heap " + fin, topsOk && fin.equals(List.of(4, 5, 5, 6)));

        // Quickselect on 10^5 identical values (the two-way-partition killer).
        int[] same = new int[100000];
        Arrays.fill(same, 42);
        claim("quickselect on 100000 equal values", QS.findKthLargest(same, 50000) == 42);

        Random rnd = new Random(61);
        int agree = 0;
        for (int t = 0; t < 500; t++) {
            int n = 1 + rnd.nextInt(40);
            int[] in = new int[n];
            int range = rnd.nextBoolean() ? 5 : 20001;
            for (int i = 0; i < n; i++) in[i] = rnd.nextInt(range) - range / 2;
            int k = 1 + rnd.nextInt(n);
            int a = findKthLargestSort(in.clone(), k);
            int b = findKthLargest(in.clone(), k);
            int c = QS.findKthLargest(in.clone(), k);
            if (a == b && b == c) agree++;
            else {
                failures++;
                System.out.println("  FAIL random " + Arrays.toString(in) + " k=" + k + " -> " + a + "/" + b + "/" + c);
            }
        }
        System.out.println("  ok   " + agree + "/500 random cases, heap and quickselect agree with sort");

        System.out.println(failures == 0 ? "  day 61 PASSED" : "  day 61 had " + failures + " FAILURES");
    }
}
