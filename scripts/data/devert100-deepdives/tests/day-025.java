// Correctness assertions for day 25 - Top K Frequent Elements (LC 347).
//
// All three published solutions (count + sort, bucket sort, size-k min-heap)
// are copied verbatim from day-025.md. The answer may be in any order, so
// results are compared as sorted arrays. Random cases are checked against the
// definition itself: k distinct values, and every chosen value at least as
// frequent as every value left out.

import java.util.*;

class Day25Test {

    // ---- brute force from the bruteForce section ----
    static int[] brute(int[] nums, int k) {

        Map<Integer, Integer> count = new HashMap<>();
        for (int num : nums) {
            count.merge(num, 1, Integer::sum);
        }

        List<Integer> values = new ArrayList<>(count.keySet());
        values.sort((a, b) -> count.get(b) - count.get(a));   // most frequent first

        int[] result = new int[k];
        for (int i = 0; i < k; i++) {
            result[i] = values.get(i);
        }

        return result;
    }

    // ---- bucket sort from the implementation section ----
    static int[] bucket(int[] nums, int k) {

        // Step 1: value -> how many times it appears.
        Map<Integer, Integer> count = new HashMap<>();
        for (int num : nums) {
            count.merge(num, 1, Integer::sum);
        }

        // Step 2: buckets.get(f) = every value that appears exactly f times.
        // A frequency can be as large as n, so we need indices 0..n.
        List<List<Integer>> buckets = new ArrayList<>();
        for (int f = 0; f <= nums.length; f++) {
            buckets.add(new ArrayList<>());
        }
        for (Map.Entry<Integer, Integer> e : count.entrySet()) {
            buckets.get(e.getValue()).add(e.getKey());
        }

        // Step 3: read from the highest frequency down until k are taken.
        int[] result = new int[k];
        int filled = 0;
        for (int f = nums.length; f >= 1 && filled < k; f--) {
            for (int value : buckets.get(f)) {
                if (filled == k) {
                    break;
                }
                result[filled++] = value;
            }
        }

        return result;
    }

    // ---- heap version from the implementation section ----
    static int[] heap(int[] nums, int k) {

        Map<Integer, Integer> count = new HashMap<>();
        for (int num : nums) {
            count.merge(num, 1, Integer::sum);
        }

        // Min-heap by frequency: the root is the weakest candidate.
        PriorityQueue<Integer> heap =
            new PriorityQueue<>((a, b) -> count.get(a) - count.get(b));

        for (int value : count.keySet()) {
            heap.offer(value);
            if (heap.size() > k) {
                heap.poll();            // evict the least frequent
            }
        }

        int[] result = new int[k];
        for (int i = k - 1; i >= 0; i--) {
            result[i] = heap.poll();
        }

        return result;
    }

    static int[] sorted(int[] a) { int[] c = a.clone(); Arrays.sort(c); return c; }

    // The definition of a correct answer, independent of tie-breaking.
    static boolean valid(int[] nums, int k, int[] res) {
        if (res.length != k) return false;
        Map<Integer, Integer> count = new HashMap<>();
        for (int v : nums) count.merge(v, 1, Integer::sum);
        Set<Integer> chosen = new HashSet<>();
        for (int v : res) { if (!count.containsKey(v) || !chosen.add(v)) return false; }
        int minIn = Integer.MAX_VALUE, maxOut = 0;
        for (Map.Entry<Integer, Integer> e : count.entrySet()) {
            if (chosen.contains(e.getKey())) minIn = Math.min(minIn, e.getValue());
            else maxOut = Math.max(maxOut, e.getValue());
        }
        return minIn >= maxOut;
    }

    static int failures = 0;

    static void check(String label, int[] nums, int k, int[] want) {
        int[] w = sorted(want);
        int[] a = sorted(brute(nums, k)), b = sorted(bucket(nums, k)), c = sorted(heap(nums, k));
        boolean ok = Arrays.equals(a, w) && Arrays.equals(b, w) && Arrays.equals(c, w);
        if (!ok) failures++;
        System.out.println((ok ? "  ok   " : "  FAIL ") + label + "  " + Arrays.toString(nums) + ", k=" + k
            + " -> sort " + Arrays.toString(a) + ", bucket " + Arrays.toString(b) + ", heap " + Arrays.toString(c)
            + (ok ? "" : "  expected " + Arrays.toString(w)));
    }

    public static void main(String[] args) {
        System.out.println("day 25 - Top K Frequent Elements");

        check("example",               new int[] { 4, 4, 1, 2, 2, 2, 3, 4, 2 }, 2, new int[] { 2, 4 });
        check("single",                new int[] { 1 }, 1, new int[] { 1 });
        check("all same (bucket n)",   new int[] { 7, 7, 7 }, 1, new int[] { 7 });
        check("k = distinct count",    new int[] { 1, 2, 2, 3, 3, 3 }, 3, new int[] { 3, 2, 1 });
        check("all distinct, k = n",   new int[] { 5, 6 }, 2, new int[] { 5, 6 });
        check("negatives",             new int[] { -1, -1, 2 }, 1, new int[] { -1 });
        check("ties below the cut",    new int[] { 1, 1, 1, 2, 2, 3, 4 }, 2, new int[] { 1, 2 });
        check("LC example",            new int[] { 1, 1, 1, 2, 2, 3 }, 2, new int[] { 1, 2 });

        // The "<" instead of "<=" trap from the lines-that-matter section.
        boolean threw = false;
        try {
            int[] nums = { 7, 7, 7 };
            List<List<Integer>> buckets = new ArrayList<>();
            for (int f = 0; f < nums.length; f++) buckets.add(new ArrayList<>());
            buckets.get(3).add(7);
        } catch (IndexOutOfBoundsException e) { threw = true; }
        if (!threw) failures++;
        System.out.println((threw ? "  ok   " : "  FAIL ") + "n buckets instead of n + 1 throws on [7, 7, 7]");

        Random rnd = new Random(25);
        int agree = 0;
        for (int t = 0; t < 500; t++) {
            int n = 1 + rnd.nextInt(40);
            int[] in = new int[n];
            int range = 1 + rnd.nextInt(10);
            for (int i = 0; i < n; i++) in[i] = rnd.nextInt(range) - range / 2;
            int distinct = (int) Arrays.stream(in).distinct().count();
            int k = 1 + rnd.nextInt(distinct);
            boolean ok = valid(in, k, brute(in, k)) && valid(in, k, bucket(in, k)) && valid(in, k, heap(in, k));
            if (ok) agree++;
            else {
                failures++;
                System.out.println("  FAIL random " + Arrays.toString(in) + ", k=" + k);
            }
        }
        System.out.println("  ok   " + agree + "/500 random cases, all three versions return a valid top k");

        System.out.println(failures == 0 ? "  day 25 PASSED" : "  day 25 had " + failures + " FAILURES");
    }
}
