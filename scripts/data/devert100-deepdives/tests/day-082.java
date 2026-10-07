// Correctness assertions for day 82 - Fractional Knapsack (GFG).
//
// The density greedy and the all-orders brute force are copied verbatim from
// day-082.md as nested classes. They must agree (to 1e-9) on the worked
// example, every edge case, and a few hundred random inputs. The writeup's
// two "wrong approach" claims - sort by value gives 220, and ratio-greedy on
// whole items gives 160 where 0/1 optimum is 220 - are also checked.

import java.util.*;

class Day82Test {

    // ---- brute force from the bruteForce section ----
    static class Brute {

        private double best;

        public double fractionalKnapsack(int[] val, int[] wt, int capacity) {
            best = 0;
            int n = val.length;
            permute(val, wt, capacity, new int[n], new boolean[n], 0);
            return best;
        }

        private void permute(int[] val, int[] wt, int capacity,
                             int[] order, boolean[] used, int depth) {
            int n = val.length;
            if (depth == n) {
                best = Math.max(best, fillInOrder(val, wt, capacity, order));
                return;
            }
            for (int i = 0; i < n; i++) {
                if (used[i]) continue;
                used[i] = true;
                order[depth] = i;
                permute(val, wt, capacity, order, used, depth + 1);
                used[i] = false;
            }
        }

        private double fillInOrder(int[] val, int[] wt, int capacity, int[] order) {
            double total = 0;
            int remaining = capacity;
            for (int i : order) {
                if (remaining == 0) break;
                if (wt[i] <= remaining) {
                    total += val[i];
                    remaining -= wt[i];
                } else {
                    total += (double) val[i] * remaining / wt[i];
                    remaining = 0;
                }
            }
            return total;
        }
    }

    // ---- greedy from the implementation section ----
    static double fractionalKnapsack(int[] val, int[] wt, int capacity) {

        int n = val.length;

        Integer[] order = new Integer[n];
        for (int i = 0; i < n; i++) {
            order[i] = i;
        }

        Arrays.sort(order, (a, b) -> Long.compare((long) val[b] * wt[a], (long) val[a] * wt[b]));

        double total = 0;
        int remaining = capacity;

        for (int i : order) {
            if (remaining == 0) break;

            if (wt[i] <= remaining) {
                total += val[i];
                remaining -= wt[i];
            } else {
                total += (double) val[i] * remaining / wt[i];
                remaining = 0;
            }
        }

        return total;
    }

    static int failures = 0;

    static void check(String label, int[] val, int[] wt, int cap, double want) {
        double a = fractionalKnapsack(val, wt, cap);
        double b = new Brute().fractionalKnapsack(val, wt, cap);
        boolean ok = Math.abs(a - want) < 1e-6 && Math.abs(b - want) < 1e-6;
        if (!ok) failures++;
        System.out.println((ok ? "  ok   " : "  FAIL ") + label + "  -> greedy " + a + ", brute " + b
            + (ok ? "" : "  expected " + want));
    }

    static void checkNum(String label, double got, double want) {
        boolean ok = Math.abs(got - want) < 1e-9;
        if (!ok) failures++;
        System.out.println((ok ? "  ok   " : "  FAIL ") + label + " -> " + got + (ok ? "" : "  expected " + want));
    }

    // Whole-items fill in a given index order (for the wrong-approach claims).
    static double fillOrder(int[] val, int[] wt, int cap, Integer[] order, boolean wholeOnly) {
        double total = 0;
        int rem = cap;
        for (int i : order) {
            if (wt[i] <= rem) { total += val[i]; rem -= wt[i]; }
            else if (!wholeOnly && rem > 0) { total += (double) val[i] * rem / wt[i]; rem = 0; }
        }
        return total;
    }

    static int zeroOneBest(int[] val, int[] wt, int cap) {
        int n = val.length, best = 0;
        for (int mask = 0; mask < (1 << n); mask++) {
            int w = 0, v = 0;
            for (int i = 0; i < n; i++) if ((mask & (1 << i)) != 0) { w += wt[i]; v += val[i]; }
            if (w <= cap) best = Math.max(best, v);
        }
        return best;
    }

    public static void main(String[] args) {
        System.out.println("day 82 - Fractional Knapsack");

        int[] v = { 60, 100, 120 }, w = { 10, 20, 30 };
        check("example W=50", v, w, 50, 240.0);
        check("everything fits", new int[] { 10, 20 }, new int[] { 1, 2 }, 100, 30.0);
        check("capacity below every item", new int[] { 60 }, new int[] { 10 }, 5, 30.0);
        check("exact fill W=30", v, w, 30, 160.0);
        check("equal densities", new int[] { 10, 20, 30 }, new int[] { 1, 2, 3 }, 3, 30.0);
        check("non-terminating decimal", new int[] { 100 }, new int[] { 3 }, 1, 100.0 / 3);
        check("capacity zero", new int[] { 60, 100 }, new int[] { 10, 20 }, 0, 0.0);

        checkNum("sort by value instead of density", fillOrder(v, w, 50, new Integer[] { 2, 1, 0 }, false), 220.0);
        checkNum("sort by lightest weight on this example", fillOrder(v, w, 50, new Integer[] { 0, 1, 2 }, false), 240.0);
        checkNum("0/1 trap: ratio-greedy, whole items only", fillOrder(v, w, 50, new Integer[] { 0, 1, 2 }, true), 160.0);
        checkNum("0/1 trap: true 0/1 optimum", zeroOneBest(v, w, 50), 220.0);

        // Large values: the comparator must use long cross-products.
        int[] bigV = { 100000, 99999 }, bigW = { 99999, 99998 };
        double greedyBig = fractionalKnapsack(bigV, bigW, 99998);
        double bruteBig = new Brute().fractionalKnapsack(bigV, bigW, 99998);
        checkNum("10^5-scale values, greedy vs brute", greedyBig, bruteBig);

        Random rnd = new Random(82);
        int agree = 0, trials = 400;
        for (int t = 0; t < trials; t++) {
            int n = 1 + rnd.nextInt(6);
            int[] val = new int[n], wt = new int[n];
            for (int i = 0; i < n; i++) { val[i] = 1 + rnd.nextInt(100); wt[i] = 1 + rnd.nextInt(30); }
            int cap = rnd.nextInt(80);
            double a = fractionalKnapsack(val, wt, cap), b = new Brute().fractionalKnapsack(val, wt, cap);
            if (Math.abs(a - b) < 1e-9) agree++;
            else {
                failures++;
                System.out.println("  FAIL random " + Arrays.toString(val) + " " + Arrays.toString(wt)
                    + " cap " + cap + " -> " + a + " vs " + b);
            }
        }
        System.out.println("  ok   " + agree + "/" + trials + " random inputs, greedy matches all-orders brute force");

        System.out.println(failures == 0 ? "  day 82 PASSED" : "  day 82 had " + failures + " FAILURES");
    }
}
