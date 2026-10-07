// Correctness assertions for day 62 - K Closest Points to Origin.
//
// The sort brute force and the size-k max heap are copied verbatim from
// day-062.md. Answers may come back in any order, so results are compared as
// sorted lists of points. Checks: LeetCode's examples, the six-point dry run
// (including the exact drain order the writeup states), every edge case, the
// sqrt-cast trap, and a few hundred random inputs where ties at the boundary
// are judged by distance multiset (any tied point is a valid answer).

import java.util.*;

class Day62Test {

    // ---- brute force ----
    static int[][] kClosestSort(int[][] points, int k) {
        Arrays.sort(points, (a, b) -> Integer.compare(
                a[0] * a[0] + a[1] * a[1],
                b[0] * b[0] + b[1] * b[1]));
        return Arrays.copyOfRange(points, 0, k);
    }

    // ---- optimal: max heap of size k ----
    static int[][] kClosest(int[][] points, int k) {
        PriorityQueue<int[]> heap = new PriorityQueue<>(
                (a, b) -> Integer.compare(dist(b), dist(a)));
        for (int[] p : points) {
            heap.offer(p);
            if (heap.size() > k) {
                heap.poll();
            }
        }
        int[][] result = new int[k][];
        for (int i = 0; i < k; i++) {
            result[i] = heap.poll();
        }
        return result;
    }

    static int dist(int[] p) {
        return p[0] * p[0] + p[1] * p[1];
    }

    static String canon(int[][] pts) {
        List<String> s = new ArrayList<>();
        for (int[] p : pts) s.add(p[0] + "," + p[1]);
        Collections.sort(s);
        return s.toString();
    }

    static int[][] copy(int[][] pts) {
        int[][] c = new int[pts.length][];
        for (int i = 0; i < pts.length; i++) c[i] = pts[i].clone();
        return c;
    }

    static int failures = 0;

    static void check(String label, int[][] in, int k, int[][] want) {
        String a = canon(kClosestSort(copy(in), k));
        String b = canon(kClosest(copy(in), k));
        String w = canon(want);
        boolean ok = a.equals(w) && b.equals(w);
        if (!ok) failures++;
        System.out.println((ok ? "  ok   " : "  FAIL ") + label + " k=" + k + " -> sort " + a + ", heap " + b
            + (ok ? "" : "  expected " + w));
    }

    static void claim(String label, boolean ok) {
        if (!ok) failures++;
        System.out.println((ok ? "  ok   " : "  FAIL ") + label);
    }

    public static void main(String[] args) {
        System.out.println("day 62 - K Closest Points to Origin");

        check("LC example 1", new int[][] { { 1, 3 }, { -2, 2 } }, 1, new int[][] { { -2, 2 } });
        check("LC example 2", new int[][] { { 3, 3 }, { 5, -1 }, { -2, 4 } }, 2, new int[][] { { 3, 3 }, { -2, 4 } });

        int[][] six = { { 1, 3 }, { -2, 2 }, { 5, -1 }, { 3, 3 }, { 0, 1 }, { -2, 4 } };
        check("six-point dry run", six, 3, new int[][] { { 0, 1 }, { -2, 2 }, { 1, 3 } });

        // The writeup states the heap version drains as [[1,3],[-2,2],[0,1]].
        int[][] drained = kClosest(copy(six), 3);
        claim("drain order farthest first " + Arrays.deepToString(drained),
            Arrays.deepEquals(drained, new int[][] { { 1, 3 }, { -2, 2 }, { 0, 1 } }));

        // Dry-run tops after each step: 10 10 26 18 10 10.
        int[] tops = { 10, 10, 26, 18, 10, 10 };
        PriorityQueue<int[]> h = new PriorityQueue<>((a, b) -> Integer.compare(dist(b), dist(a)));
        boolean topsOk = true;
        for (int i = 0; i < six.length; i++) {
            h.offer(six[i]);
            if (h.size() > 3) h.poll();
            topsOk &= dist(h.peek()) == tops[i];
        }
        claim("dry-run heap tops match", topsOk);

        check("k equals n",           new int[][] { { 1, 1 }, { 2, 2 } }, 2, new int[][] { { 1, 1 }, { 2, 2 } });
        check("origin itself",        new int[][] { { 0, 0 }, { 1, 0 } }, 1, new int[][] { { 0, 0 } });
        check("duplicate points",     new int[][] { { 1, 1 }, { 1, 1 }, { 3, 3 } }, 2, new int[][] { { 1, 1 }, { 1, 1 } });
        check("equal distances",      new int[][] { { 1, 0 }, { 0, 1 }, { -1, 0 }, { 3, 3 } }, 3,
                                      new int[][] { { 1, 0 }, { 0, 1 }, { -1, 0 } });
        check("largest coordinates",  new int[][] { { 10000, 10000 }, { -10000, -10000 }, { 1, 1 } }, 1,
                                      new int[][] { { 1, 1 } });

        // The sqrt trap: distances 1.0 and 1.414 compare as equal after the int cast.
        Comparator<int[]> bad = (a, b) -> (int) (Math.sqrt(dist(b)) - Math.sqrt(dist(a)));
        claim("sqrt-cast comparator calls [1,0] and [1,1] equal",
            bad.compare(new int[] { 1, 0 }, new int[] { 1, 1 }) == 0);

        Random rnd = new Random(62);
        int agree = 0;
        for (int t = 0; t < 500; t++) {
            int n = 1 + rnd.nextInt(30);
            int range = rnd.nextBoolean() ? 3 : 10000;
            int[][] in = new int[n][];
            for (int i = 0; i < n; i++) in[i] = new int[] { rnd.nextInt(2 * range + 1) - range, rnd.nextInt(2 * range + 1) - range };
            int k = 1 + rnd.nextInt(n);

            int[] all = new int[n];
            for (int i = 0; i < n; i++) all[i] = dist(in[i]);
            Arrays.sort(all);
            int[] want = Arrays.copyOfRange(all, 0, k);

            boolean ok = true;
            for (int[][] got : new int[][][] { kClosestSort(copy(in), k), kClosest(copy(in), k) }) {
                int[] d = new int[got.length];
                for (int i = 0; i < got.length; i++) d[i] = dist(got[i]);
                Arrays.sort(d);
                ok &= Arrays.equals(d, want);
            }
            if (ok) agree++;
            else { failures++; System.out.println("  FAIL random " + Arrays.deepToString(in) + " k=" + k); }
        }
        System.out.println("  ok   " + agree + "/500 random cases, both return the k smallest distances");

        System.out.println(failures == 0 ? "  day 62 PASSED" : "  day 62 had " + failures + " FAILURES");
    }
}
