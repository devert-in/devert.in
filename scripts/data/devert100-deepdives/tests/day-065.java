// Correctness assertions for day 65 - Find Median from Data Stream.
//
// Both published designs are copied verbatim from day-065.md (the brute force
// renamed to BruteMedianFinder so the two can coexist). They are checked on the
// LeetCode example, the 5-15-1-3-8 stream both dry runs use (including the
// exact heap contents the optimisation table claims), every edge case in the
// edge-cases section, and random streams against a sort-every-time oracle.

import java.util.*;

class Day65Test {

    // ---- brute force: always-sorted list ----
    static class BruteMedianFinder {

        private final List<Integer> sorted;

        public BruteMedianFinder() {
            sorted = new ArrayList<>();
        }

        public void addNum(int num) {
            int i = 0;
            while (i < sorted.size() && sorted.get(i) <= num) {
                i++;
            }
            sorted.add(i, num);     // shifts everything after i one slot right
        }

        public double findMedian() {
            int n = sorted.size();
            if (n % 2 == 1) {
                return sorted.get(n / 2);
            }
            return ((double) sorted.get(n / 2 - 1) + sorted.get(n / 2)) / 2.0;
        }
    }

    // ---- implementation: two heaps ----
    static class MedianFinder {

        // Lower half: a MAX-heap, so its top is the largest small number.
        private final PriorityQueue<Integer> low;
        // Upper half: a MIN-heap, so its top is the smallest large number.
        private final PriorityQueue<Integer> high;

        public MedianFinder() {
            low = new PriorityQueue<>(Collections.reverseOrder());
            high = new PriorityQueue<>();
        }

        public void addNum(int num) {
            low.offer(num);                 // 1. enter through the lower half
            high.offer(low.poll());         // 2. its largest crosses to the upper half
            if (high.size() > low.size()) { // 3. keep low the same size or one bigger
                low.offer(high.poll());
            }
        }

        public double findMedian() {
            if (low.size() > high.size()) {
                return low.peek();          // odd count: the extra one is in low
            }
            return ((double) low.peek() + high.peek()) / 2.0;
        }
    }

    static double oracle(List<Integer> seen) {
        List<Integer> s = new ArrayList<>(seen);
        Collections.sort(s);
        int n = s.size();
        if (n % 2 == 1) return s.get(n / 2);
        return ((double) s.get(n / 2 - 1) + s.get(n / 2)) / 2.0;
    }

    static int failures = 0;

    // Feeds the stream, asks for the median after every add, compares both designs.
    static void stream(String label, int[] nums, double[] want) {
        MedianFinder h = new MedianFinder();
        BruteMedianFinder b = new BruteMedianFinder();
        double[] gotH = new double[nums.length], gotB = new double[nums.length];
        for (int i = 0; i < nums.length; i++) {
            h.addNum(nums[i]); b.addNum(nums[i]);
            gotH[i] = h.findMedian(); gotB[i] = b.findMedian();
        }
        boolean ok = Arrays.equals(gotH, want) && Arrays.equals(gotB, want);
        if (!ok) failures++;
        System.out.println((ok ? "  ok   " : "  FAIL ") + label + "  " + Arrays.toString(nums)
            + " -> heaps " + Arrays.toString(gotH) + ", brute " + Arrays.toString(gotB)
            + (ok ? "" : "  expected " + Arrays.toString(want)));
    }

    static List<Integer> sortedDesc(PriorityQueue<Integer> q) {
        List<Integer> l = new ArrayList<>(q); l.sort(Collections.reverseOrder()); return l;
    }
    static List<Integer> sortedAsc(PriorityQueue<Integer> q) {
        List<Integer> l = new ArrayList<>(q); Collections.sort(l); return l;
    }

    public static void main(String[] args) {
        System.out.println("day 65 - Find Median from Data Stream");

        // LeetCode example: add 1, add 2, median 1.5, add 3, median 2.0
        MedianFinder lc = new MedianFinder();
        lc.addNum(1); lc.addNum(2); double m1 = lc.findMedian(); lc.addNum(3); double m2 = lc.findMedian();
        boolean lcOk = m1 == 1.5 && m2 == 2.0;
        if (!lcOk) failures++;
        System.out.println((lcOk ? "  ok   " : "  FAIL ") + "leetcode example -> " + m1 + ", " + m2);

        stream("dry-run stream", new int[] { 5, 15, 1, 3, 8 }, new double[] { 5.0, 10.0, 5.0, 4.0, 5.0 });

        // The optimisation table's final low/high contents after each add.
        int[][] wantLow  = { { 5 }, { 5 }, { 5, 1 }, { 3, 1 }, { 5, 3, 1 } };
        int[][] wantHigh = { {},    { 15 }, { 15 }, { 5, 15 }, { 8, 15 } };
        MedianFinder t = new MedianFinder();
        int[] s = { 5, 15, 1, 3, 8 };
        for (int i = 0; i < s.length; i++) {
            t.addNum(s[i]);
            List<Integer> lo = sortedDesc(t.low), hi = sortedAsc(t.high);
            List<Integer> wl = new ArrayList<>(), wh = new ArrayList<>();
            for (int v : wantLow[i]) wl.add(v);
            for (int v : wantHigh[i]) wh.add(v);
            boolean ok = lo.equals(wl) && hi.equals(wh);
            if (!ok) failures++;
            System.out.println((ok ? "  ok   " : "  FAIL ") + "after add " + s[i] + ": low " + lo + ", high " + hi);
        }

        stream("single number",   new int[] { 7 },             new double[] { 7.0 });
        stream("two numbers",     new int[] { 1, 2 },          new double[] { 1.0, 1.5 });
        stream("duplicates x3",   new int[] { 2, 2, 2 },       new double[] { 2.0, 2.0, 2.0 });
        stream("duplicates x4",   new int[] { 2, 2, 2, 2 },    new double[] { 2.0, 2.0, 2.0, 2.0 });
        stream("negatives",       new int[] { -1, -2 },        new double[] { -1.0, -1.5 });
        stream("increasing",      new int[] { 1, 2, 3, 4, 5 }, new double[] { 1.0, 1.5, 2.0, 2.5, 3.0 });
        stream("decreasing",      new int[] { 5, 4, 3, 2, 1 }, new double[] { 5.0, 4.5, 4.0, 3.5, 3.0 });
        stream("int max twice",   new int[] { 2147483647, 2147483647 }, new double[] { 2147483647.0, 2147483647.0 });
        stream("int min and max", new int[] { -2147483648, 2147483647 }, new double[] { -2147483648.0, -0.5 });

        // The overflow claim: without the cast, MAX + MAX overflows to -2 -> -1.0.
        int a = 2147483647, b = 2147483647;
        double noCast = (a + b) / 2.0;
        boolean overflowClaim = noCast == -1.0;
        if (!overflowClaim) failures++;
        System.out.println((overflowClaim ? "  ok   " : "  FAIL ") + "uncast sum of two MAX_VALUEs gives " + noCast);

        // The "balance by size alone" trap from the takeaway: 1,2,3 -> low top 3 > high top 2.
        PriorityQueue<Integer> lo = new PriorityQueue<>(Collections.reverseOrder()), hi = new PriorityQueue<>();
        for (int v : new int[] { 1, 2, 3 }) { if (lo.size() <= hi.size()) lo.offer(v); else hi.offer(v); }
        boolean trap = lo.peek() == 3 && hi.peek() == 2;
        if (!trap) failures++;
        System.out.println((trap ? "  ok   " : "  FAIL ") + "size-only balancing breaks order: low top " + lo.peek() + ", high top " + hi.peek());

        // Random streams vs the oracle, median checked after every add.
        Random rnd = new Random(65);
        int agree = 0;
        for (int c = 0; c < 300; c++) {
            int n = 1 + rnd.nextInt(40);
            MedianFinder h = new MedianFinder();
            BruteMedianFinder br = new BruteMedianFinder();
            List<Integer> seen = new ArrayList<>();
            boolean ok = true;
            for (int i = 0; i < n; i++) {
                int v = rnd.nextInt(41) - 20;
                h.addNum(v); br.addNum(v); seen.add(v);
                double want = oracle(seen);
                if (h.findMedian() != want || br.findMedian() != want) ok = false;
            }
            if (ok) agree++;
            else { failures++; System.out.println("  FAIL random stream " + seen); }
        }
        System.out.println("  ok   " + agree + "/300 random streams, heaps = brute = oracle after every add");

        System.out.println(failures == 0 ? "  day 65 PASSED" : "  day 65 had " + failures + " FAILURES");
    }
}
