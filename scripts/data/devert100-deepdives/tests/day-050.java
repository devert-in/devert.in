// Correctness assertions for day 50 - Koko Eating Bananas.
//
// The brute force (try every speed upward) and the binary search on the answer
// are copied verbatim from day-050.md. Both are checked on the worked example,
// every edge case in the edge-cases section, and a few hundred random inputs.
// The dry run's probe sequence (6, 3, 5, 4) and the overflow-trap claim (an
// int accumulator steers the search to a wrong answer) are checked directly.

import java.util.*;

class Day50Test {

    // ---- brute force from the bruteForce section ----
    static int bruteForce(int[] piles, int h) {
        int max = 0;
        for (int p : piles) {
            max = Math.max(max, p);
        }
        for (int k = 1; k <= max; k++) {
            long hours = 0;
            for (int p : piles) {
                hours += (p + k - 1) / k;
            }
            if (hours <= h) {
                return k;
            }
        }
        return max;
    }

    // ---- binary search from the implementation section ----
    static int minEatingSpeed(int[] piles, int h) {
        int lo = 1;
        int hi = 0;
        for (int p : piles) {
            hi = Math.max(hi, p);
        }
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (hoursNeeded(piles, mid) <= h) {
                hi = mid;
            } else {
                lo = mid + 1;
            }
        }
        return lo;
    }

    static long hoursNeeded(int[] piles, int speed) {
        long hours = 0;
        for (int p : piles) {
            hours += (p + speed - 1) / speed;
        }
        return hours;
    }

    // The broken variant the overflow edge case warns about: the brute force
    // with an int accumulator.
    static int bruteWithIntTotal(int[] piles, int h) {
        int max = 0;
        for (int p : piles) max = Math.max(max, p);
        for (int k = 1; k <= max; k++) {
            int hours = 0;
            for (int p : piles) hours += (p + k - 1) / k;
            if (hours <= h) return k;
        }
        return max;
    }

    // Largest true total the binary search ever computes on an input.
    static long maxProbeTotal(int[] piles, int h) {
        int lo = 1, hi = 0;
        for (int p : piles) hi = Math.max(hi, p);
        long worst = 0;
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            long t = hoursNeeded(piles, mid);
            worst = Math.max(worst, t);
            if (t <= h) hi = mid; else lo = mid + 1;
        }
        return worst;
    }

    static int failures = 0;

    static void check(String label, int[] piles, int h, int want, boolean runBrute) {
        int b = minEatingSpeed(piles, h);
        int a = runBrute ? bruteForce(piles, h) : want;
        boolean ok = a == want && b == want;
        if (!ok) failures++;
        String shown = piles.length > 6 ? piles.length + " piles" : Arrays.toString(piles);
        System.out.println((ok ? "  ok   " : "  FAIL ") + label + "  " + shown + ", h " + h
            + " -> binary " + b + (runBrute ? ", brute " + a : "") + (ok ? "" : "  expected " + want));
    }

    public static void main(String[] args) {
        System.out.println("day 50 - Koko Eating Bananas");

        check("example", new int[] { 3, 6, 7, 11 }, 8, 4, true);

        // Dry run probes: 6, 3, 5, 4.
        {
            int[] piles = { 3, 6, 7, 11 };
            List<Integer> probes = new ArrayList<>();
            int lo = 1, hi = 11;
            while (lo < hi) {
                int mid = lo + (hi - lo) / 2;
                probes.add(mid);
                if (hoursNeeded(piles, mid) <= 8) hi = mid; else lo = mid + 1;
            }
            boolean ok = probes.equals(List.of(6, 3, 5, 4));
            if (!ok) failures++;
            System.out.println((ok ? "  ok   " : "  FAIL ") + "dry run probes " + probes);
        }

        // The hours table in the pattern section.
        {
            long[] want = { 27, 15, 10, 8, 8, 6, 5, 5, 5, 5, 4 };
            boolean ok = true;
            for (int k = 1; k <= 11; k++) ok &= hoursNeeded(new int[] { 3, 6, 7, 11 }, k) == want[k - 1];
            if (!ok) failures++;
            System.out.println((ok ? "  ok   " : "  FAIL ") + "hours table for k = 1..11");
        }

        check("h == n", new int[] { 30, 11, 23, 4, 20 }, 5, 30, true);
        check("h == n + 1", new int[] { 30, 11, 23, 4, 20 }, 6, 23, true);
        check("plenty of time", new int[] { 3, 6, 7, 11 }, 100, 1, true);
        check("single pile", new int[] { 10 }, 3, 4, true);
        check("single huge pile", new int[] { 1000000000 }, 2, 500000000, false);
        check("equal piles", new int[] { 5, 5, 5 }, 6, 3, true);

        int[] big = new int[10000];
        Arrays.fill(big, 1000000000);
        check("overflow trap", big, 1000000000, 10000, false);
        int broken = bruteWithIntTotal(big, 1000000000);
        boolean brokenWrong = broken == 2;
        if (!brokenWrong) failures++;
        System.out.println((brokenWrong ? "  ok   " : "  FAIL ")
            + "brute force with an int total returns " + broken + " on the overflow trap");
        boolean wraps = (int) 10000000000000L == 1316134912 && (int) 5000000000000L == 658067456;
        if (!wraps) failures++;
        System.out.println((wraps ? "  ok   " : "  FAIL ") + "wrapped totals 1,316,134,912 and 658,067,456");
        long worst = maxProbeTotal(big, 1000000000);
        boolean fits = worst <= Integer.MAX_VALUE;
        if (!fits) failures++;
        System.out.println((fits ? "  ok   " : "  FAIL ") + "binary search's largest total " + worst + " stays under int's ceiling");

        Random rnd = new Random(50);
        int agree = 0;
        for (int t = 0; t < 400; t++) {
            int n = 1 + rnd.nextInt(8);
            int[] piles = new int[n];
            for (int i = 0; i < n; i++) piles[i] = 1 + rnd.nextInt(60);
            int h = n + rnd.nextInt(80);
            int a = bruteForce(piles, h), b = minEatingSpeed(piles, h);
            if (a == b) agree++;
            else {
                failures++;
                System.out.println("  FAIL random " + Arrays.toString(piles) + " h " + h + " -> " + b + " expected " + a);
            }
        }
        System.out.println("  ok   " + agree + "/400 random inputs agree with the brute force");

        System.out.println(failures == 0 ? "  day 50 PASSED" : "  day 50 had " + failures + " FAILURES");
    }
}
