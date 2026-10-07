// Correctness assertions for day 85 - Minimum Cost of Ropes (GFG) /
// Connect Sticks (LC 1167).
//
// The exhaustive search and the min-heap solution are copied verbatim from
// day-085.md (as nested classes, since the brute force has a helper method).
// Checks: the worked example, the 18-row table of every join order, the order
// count formula, every edge case with its claimed output, the "sort once and
// chain" trap, and a randomized heap-vs-exhaustive comparison.

import java.util.*;

class Day85Test {

    // ---- brute force, from the bruteForce section ----
    static class Brute {
        public long minCost(int[] arr) {
            List<Long> ropes = new ArrayList<>();
            for (int len : arr) ropes.add((long) len);
            return best(ropes);
        }

        private long best(List<Long> ropes) {
            if (ropes.size() <= 1) return 0;
            long answer = Long.MAX_VALUE;
            for (int i = 0; i < ropes.size(); i++) {
                for (int j = i + 1; j < ropes.size(); j++) {
                    long joined = ropes.get(i) + ropes.get(j);
                    List<Long> next = new ArrayList<>();
                    for (int k = 0; k < ropes.size(); k++) {
                        if (k != i && k != j) next.add(ropes.get(k));
                    }
                    next.add(joined);
                    answer = Math.min(answer, joined + best(next));
                }
            }
            return answer;
        }
    }

    // ---- optimal, from the implementation section ----
    static class Heap {
        public long minCost(int[] arr) {
            PriorityQueue<Long> heap = new PriorityQueue<>();
            for (int len : arr) {
                heap.add((long) len);
            }
            long cost = 0;
            while (heap.size() > 1) {
                long a = heap.poll();
                long b = heap.poll();
                cost += a + b;
                heap.add(a + b);
            }
            return cost;
        }
    }

    // The trap: sort once, keep adding the next rope onto the running one.
    static long sortAndChain(int[] arr) {
        int[] s = arr.clone();
        Arrays.sort(s);
        long cost = 0, run = s.length > 0 ? s[0] : 0;
        for (int i = 1; i < s.length; i++) { run += s[i]; cost += run; }
        return cost;
    }

    // Enumerate the total of every join order.
    static void allTotals(List<Long> ropes, long sofar, List<Long> out) {
        if (ropes.size() <= 1) { out.add(sofar); return; }
        for (int i = 0; i < ropes.size(); i++) {
            for (int j = i + 1; j < ropes.size(); j++) {
                long joined = ropes.get(i) + ropes.get(j);
                List<Long> next = new ArrayList<>();
                for (int k = 0; k < ropes.size(); k++) if (k != i && k != j) next.add(ropes.get(k));
                next.add(joined);
                allTotals(next, sofar + joined, out);
            }
        }
    }

    static int failures = 0;

    static void claim(String label, boolean holds) {
        if (!holds) failures++;
        System.out.println((holds ? "  ok   " : "  FAIL ") + label);
    }

    static void check(String label, int[] arr, long want) {
        long h = new Heap().minCost(arr.clone());
        long b = arr.length <= 7 ? new Brute().minCost(arr.clone()) : want;
        boolean ok = h == want && b == want;
        if (!ok) failures++;
        System.out.println((ok ? "  ok   " : "  FAIL ") + label + "  " + Arrays.toString(arr)
            + " -> " + h + (ok ? "" : "  brute " + b + "  expected " + want));
    }

    public static void main(String[] args) {
        System.out.println("day 85 - Minimum Cost of Ropes");

        check("example",           new int[] { 4, 3, 2, 6 },    29);
        check("single",            new int[] { 5 },             0);
        check("two ropes",         new int[] { 4, 7 },          11);
        check("all equal",         new int[] { 1, 1, 1, 1 },    8);
        check("already sorted",    new int[] { 1, 2, 3, 4, 5 }, 33);
        check("GFG example 2",     new int[] { 4, 2, 7, 6, 9 }, 62);
        check("LC 1167 example 1", new int[] { 2, 4, 3 },       14);
        check("LC 1167 example 2", new int[] { 1, 8, 3, 5 },    30);

        // The 18-row table: every total in order.
        List<Long> totals = new ArrayList<>();
        allTotals(new ArrayList<>(List.of(4L, 3L, 2L, 6L)), 0, totals);
        List<Long> claimed = List.of(31L, 35L, 30L, 30L, 33L, 30L, 38L, 37L, 30L, 29L, 30L, 31L, 30L, 37L, 35L, 30L, 35L, 34L);
        // The table lists orders grouped by first join; compare as multisets.
        List<Long> a = new ArrayList<>(totals), c = new ArrayList<>(claimed);
        Collections.sort(a); Collections.sort(c);
        claim("all 18 join-order totals match the table (min 29, max 38): " + a, a.equals(c)
            && Collections.min(totals) == 29 && Collections.max(totals) == 38);

        // Order count n!(n-1)!/2^(n-1) for n = 6.
        List<Long> six = new ArrayList<>();
        allTotals(new ArrayList<>(List.of(1L, 2L, 3L, 4L, 5L, 6L)), 0, six);
        claim("n = 6 has 2700 join orders: " + six.size(), six.size() == 2700);

        claim("sort-and-chain on [1,1,1,1] gives 9: got " + sortAndChain(new int[] { 1, 1, 1, 1 }),
            sortAndChain(new int[] { 1, 1, 1, 1 }) == 9);

        int[] big = new int[100000];
        Arrays.fill(big, 10000);
        long bigCost = new Heap().minCost(big);
        claim("100000 ropes of 10000 -> " + bigCost + " (writeup claims 16689280000, exceeds int)",
            bigCost == 16689280000L && bigCost > Integer.MAX_VALUE);

        Random rnd = new Random(85);
        int agree = 0;
        for (int t = 0; t < 400; t++) {
            int n = 1 + rnd.nextInt(6);
            int[] arr = new int[n];
            for (int i = 0; i < n; i++) arr[i] = 1 + rnd.nextInt(20);
            long h = new Heap().minCost(arr), b = new Brute().minCost(arr);
            if (h == b) agree++;
            else {
                failures++;
                System.out.println("  FAIL random " + Arrays.toString(arr) + " -> heap " + h + ", brute " + b);
            }
        }
        System.out.println("  ok   " + agree + "/400 random cases: heap == exhaustive search");

        System.out.println(failures == 0 ? "  day 85 PASSED" : "  day 85 had " + failures + " FAILURES");
    }
}
