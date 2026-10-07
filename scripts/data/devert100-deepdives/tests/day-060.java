// Correctness assertions for day 60 - Last Stone Weight.
//
// The brute force (re-sort every round) and the max-heap solution are copied
// verbatim from day-060.md. They must agree on the example, every edge case in
// the writeup, the heap-array states the dry run prints, the min-heap trap's
// claimed output, and a few hundred random inputs.

import java.util.*;

class Day60Test {

    // ---- brute force ----
    static int lastStoneWeightSort(int[] stones) {
        List<Integer> list = new ArrayList<>();
        for (int s : stones) {
            list.add(s);
        }
        while (list.size() > 1) {
            Collections.sort(list);
            int y = list.remove(list.size() - 1);
            int x = list.remove(list.size() - 1);
            if (y != x) {
                list.add(y - x);
            }
        }
        return list.isEmpty() ? 0 : list.get(0);
    }

    // ---- optimal: max heap ----
    static int lastStoneWeight(int[] stones) {
        PriorityQueue<Integer> heap = new PriorityQueue<>(Collections.reverseOrder());
        for (int s : stones) {
            heap.offer(s);
        }
        while (heap.size() > 1) {
            int y = heap.poll();
            int x = heap.poll();
            if (y != x) {
                heap.offer(y - x);
            }
        }
        return heap.isEmpty() ? 0 : heap.peek();
    }

    // ---- the documented bug: default (min) heap ----
    static int lastStoneWeightMinHeap(int[] stones) {
        PriorityQueue<Integer> heap = new PriorityQueue<>();
        for (int s : stones) heap.offer(s);
        while (heap.size() > 1) {
            int y = heap.poll();
            int x = heap.poll();
            if (y != x) heap.offer(y - x);
        }
        return heap.isEmpty() ? 0 : heap.peek();
    }

    static int failures = 0;

    static void check(String label, int[] in, int want) {
        int a = lastStoneWeightSort(in.clone());
        int b = lastStoneWeight(in.clone());
        boolean ok = a == want && b == want;
        if (!ok) failures++;
        System.out.println((ok ? "  ok   " : "  FAIL ") + label + "  " + Arrays.toString(in)
            + " -> sort " + a + ", heap " + b + (ok ? "" : "  expected " + want));
    }

    static void claim(String label, boolean ok) {
        if (!ok) failures++;
        System.out.println((ok ? "  ok   " : "  FAIL ") + label);
    }

    public static void main(String[] args) {
        System.out.println("day 60 - Last Stone Weight");

        check("example",                 new int[] { 2, 7, 4, 1, 8, 1 }, 1);
        check("one stone",               new int[] { 1 }, 1);
        check("two equal",               new int[] { 3, 3 }, 0);
        check("two different",           new int[] { 3, 10 }, 7);
        check("all equal, even",         new int[] { 2, 2, 2, 2 }, 0);
        check("all equal, odd",          new int[] { 2, 2, 2 }, 2);
        check("tie at the top",          new int[] { 10, 4, 2, 10 }, 2);
        check("returned stone, pair",    new int[] { 1, 3 }, 2);
        check("returned stone reused",   new int[] { 9, 3, 2 }, 4);

        int bug = lastStoneWeightMinHeap(new int[] { 2, 7, 4, 1, 8, 1 });
        claim("min-heap trap returns -17 (got " + bug + ")", bug == -17);

        // Heap-array states the dry run prints (PriorityQueue.toString order).
        PriorityQueue<Integer> h = new PriorityQueue<>(Collections.reverseOrder());
        String[] buildWant = { "[2]", "[7, 2]", "[7, 2, 4]", "[7, 2, 4, 1]", "[8, 7, 4, 1, 2]", "[8, 7, 4, 1, 2, 1]" };
        int[] ex = { 2, 7, 4, 1, 8, 1 };
        boolean buildOk = true;
        for (int i = 0; i < ex.length; i++) { h.offer(ex[i]); buildOk &= h.toString().equals(buildWant[i]); }
        claim("dry-run build states match", buildOk);
        String[] roundWant = { "[4, 2, 1, 1, 1]", "[2, 1, 1, 1]", "[1, 1, 1]", "[1]" };
        boolean roundOk = true;
        int r = 0;
        while (h.size() > 1) {
            int y = h.poll(), x = h.poll();
            if (y != x) h.offer(y - x);
            roundOk &= r < roundWant.length && h.toString().equals(roundWant[r]);
            r++;
        }
        claim("dry-run smash states match", roundOk && r == 4);

        // Sift-down illustration: polling 8 leaves [7, 2, 4, 1, 1].
        PriorityQueue<Integer> h2 = new PriorityQueue<>(Collections.reverseOrder());
        for (int s : ex) h2.offer(s);
        h2.poll();
        claim("poll 8 leaves " + h2, h2.toString().equals("[7, 2, 4, 1, 1]"));

        Random rnd = new Random(60);
        int agree = 0;
        for (int t = 0; t < 500; t++) {
            int n = 1 + rnd.nextInt(30);
            int[] in = new int[n];
            for (int i = 0; i < n; i++) in[i] = 1 + rnd.nextInt(rnd.nextBoolean() ? 10 : 1000);
            int a = lastStoneWeightSort(in.clone()), b = lastStoneWeight(in.clone());
            if (a == b) agree++;
            else {
                failures++;
                System.out.println("  FAIL random " + Arrays.toString(in) + " sort " + a + " heap " + b);
            }
        }
        System.out.println("  ok   " + agree + "/500 random cases, heap agrees with re-sort");

        System.out.println(failures == 0 ? "  day 60 PASSED" : "  day 60 had " + failures + " FAILURES");
    }
}
