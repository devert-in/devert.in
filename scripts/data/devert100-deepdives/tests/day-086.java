// Correctness assertions for day 86 - Gas Station (LC 134).
//
// The try-every-start simulation and the one-pass greedy are copied verbatim
// from day-086.md. Checks: the worked example, the "where it hurts" input,
// every edge case with its claimed output, the `tank <= 0` bug claim, the
// "start never returned as n" note, and a randomized greedy-vs-brute
// comparison where any returned start is also re-simulated independently.

import java.util.*;

class Day86Test {

    // ---- brute force, from the bruteForce section ----
    static int brute(int[] gas, int[] cost) {
        int n = gas.length;
        for (int start = 0; start < n; start++) {
            int tank = 0;
            boolean ok = true;
            for (int step = 0; step < n; step++) {
                int i = (start + step) % n;
                tank += gas[i] - cost[i];
                if (tank < 0) {
                    ok = false;
                    break;
                }
            }
            if (ok) return start;
        }
        return -1;
    }

    // ---- optimal, from the implementation section ----
    static int canCompleteCircuit(int[] gas, int[] cost) {
        int total = 0;
        int tank = 0;
        int start = 0;
        for (int i = 0; i < gas.length; i++) {
            int gain = gas[i] - cost[i];
            total += gain;
            tank += gain;
            if (tank < 0) {
                start = i + 1;
                tank = 0;
            }
        }
        return total >= 0 ? start : -1;
    }

    // The bug the writeup warns about.
    static int withLessOrEqual(int[] gas, int[] cost) {
        int total = 0, tank = 0, start = 0;
        for (int i = 0; i < gas.length; i++) {
            int gain = gas[i] - cost[i];
            total += gain; tank += gain;
            if (tank <= 0) { start = i + 1; tank = 0; }
        }
        return total >= 0 ? start : -1;
    }

    static boolean lapWorks(int[] gas, int[] cost, int s) {
        int n = gas.length, tank = 0;
        for (int k = 0; k < n; k++) {
            int i = (s + k) % n;
            tank += gas[i] - cost[i];
            if (tank < 0) return false;
        }
        return true;
    }

    static int failures = 0;

    static void check(String label, int[] gas, int[] cost, int want) {
        int g = canCompleteCircuit(gas, cost), b = brute(gas, cost);
        boolean ok = g == want && b == want;
        if (!ok) failures++;
        System.out.println((ok ? "  ok   " : "  FAIL ") + label + "  gas=" + Arrays.toString(gas)
            + " cost=" + Arrays.toString(cost) + " -> " + g + (ok ? "" : "  brute " + b + "  expected " + want));
    }

    static void claim(String label, boolean holds) {
        if (!holds) failures++;
        System.out.println((holds ? "  ok   " : "  FAIL ") + label);
    }

    public static void main(String[] args) {
        System.out.println("day 86 - Gas Station");

        check("example",           new int[] { 1, 2, 3, 4, 5 }, new int[] { 3, 4, 5, 1, 2 }, 3);
        check("not enough fuel",   new int[] { 2, 3, 4 },       new int[] { 3, 4, 3 },       -1);
        check("single, enough",    new int[] { 5 },             new int[] { 4 },             0);
        check("single, short",     new int[] { 4 },             new int[] { 5 },             -1);
        check("tank exactly zero", new int[] { 1, 1 },          new int[] { 1, 1 },          0);
        check("answer is 0",       new int[] { 3, 1, 1 },       new int[] { 1, 2, 2 },       0);
        check("answer is last",    new int[] { 0, 0, 5 },       new int[] { 1, 1, 3 },       2);
        check("late failure",      new int[] { 2, 2, 2, 2, 0 }, new int[] { 1, 1, 1, 1, 5 }, -1);
        check("all zero",          new int[] { 0, 0, 0 },       new int[] { 0, 0, 0 },       0);

        claim("tank <= 0 on gas=[1,1] cost=[1,1] returns 2 (nonexistent index): got "
            + withLessOrEqual(new int[] { 1, 1 }, new int[] { 1, 1 }),
            withLessOrEqual(new int[] { 1, 1 }, new int[] { 1, 1 }) == 2);

        Random rnd = new Random(86);
        int agree = 0, solvable = 0;
        for (int t = 0; t < 800; t++) {
            int n = 1 + rnd.nextInt(10);
            int[] gas = new int[n], cost = new int[n];
            for (int i = 0; i < n; i++) { gas[i] = rnd.nextInt(8); cost[i] = rnd.nextInt(8); }
            int g = canCompleteCircuit(gas, cost), b = brute(gas, cost);
            boolean ok = g == b && g != n && (g == -1 || lapWorks(gas, cost, g));
            if (g != -1) solvable++;
            if (ok) agree++;
            else {
                failures++;
                System.out.println("  FAIL random gas=" + Arrays.toString(gas) + " cost=" + Arrays.toString(cost)
                    + " -> greedy " + g + ", brute " + b);
            }
        }
        System.out.println("  ok   " + agree + "/800 random cases (" + solvable + " solvable): greedy == brute, start valid, never n");

        System.out.println(failures == 0 ? "  day 86 PASSED" : "  day 86 had " + failures + " FAILURES");
    }
}
