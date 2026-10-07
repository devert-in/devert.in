// Correctness assertions for day 81 - Activity Selection / N Meetings in One Room (GFG).
//
// The greedy-by-end solution, the all-subsets brute force and the LC 435
// follow-up are copied verbatim from day-081.md. The greedy must match the
// brute force on the worked example, every edge case, and a few hundred random
// inputs. The two "wrong greedy" claims (sort by start, sort by duration) are
// reproduced and checked to really give the wrong counts the writeup states.

import java.util.*;

class Day81Test {

    // ---- brute force from the bruteForce section ----
    static int maxMeetingsBrute(int[] start, int[] end) {

        int n = start.length;
        int best = 0;

        for (int mask = 0; mask < (1 << n); mask++) {

            boolean valid = true;

            for (int i = 0; i < n && valid; i++) {
                if ((mask & (1 << i)) == 0) continue;
                for (int j = i + 1; j < n; j++) {
                    if ((mask & (1 << j)) == 0) continue;
                    boolean apart = end[i] < start[j] || end[j] < start[i];
                    if (!apart) {
                        valid = false;
                        break;
                    }
                }
            }

            if (valid) {
                best = Math.max(best, Integer.bitCount(mask));
            }
        }

        return best;
    }

    // ---- greedy from the implementation section ----
    static int maxMeetings(int[] start, int[] end) {

        int n = start.length;

        int[][] meetings = new int[n][2];
        for (int i = 0; i < n; i++) {
            meetings[i][0] = start[i];
            meetings[i][1] = end[i];
        }

        Arrays.sort(meetings, (a, b) -> Integer.compare(a[1], b[1]));

        int count = 0;
        int lastEnd = Integer.MIN_VALUE;

        for (int[] m : meetings) {
            if (m[0] > lastEnd) {
                count++;
                lastEnd = m[1];
            }
        }

        return count;
    }

    // ---- LC 435 follow-up from the implementation section ----
    static int eraseOverlapIntervals(int[][] intervals) {

        Arrays.sort(intervals, (a, b) -> Integer.compare(a[1], b[1]));

        int kept = 0;
        int lastEnd = Integer.MIN_VALUE;

        for (int[] in : intervals) {
            if (in[0] >= lastEnd) {
                kept++;
                lastEnd = in[1];
            }
        }

        return intervals.length - kept;
    }

    // The wrong greedies, to confirm the counterexamples. key 0 = start, 2 = duration.
    static int wrongGreedy(int[] start, int[] end, int key) {
        int n = start.length;
        int[][] m = new int[n][3];
        for (int i = 0; i < n; i++) { m[i][0] = start[i]; m[i][1] = end[i]; m[i][2] = end[i] - start[i]; }
        Arrays.sort(m, (a, b) -> Integer.compare(a[key], b[key]));
        // take in that order if compatible with everything taken so far
        List<int[]> taken = new ArrayList<>();
        for (int[] x : m) {
            boolean ok = true;
            for (int[] t : taken) if (!(t[1] < x[0] || x[1] < t[0])) { ok = false; break; }
            if (ok) taken.add(x);
        }
        return taken.size();
    }

    static int failures = 0;

    static void check(String label, int[] start, int[] end, int want) {
        int a = maxMeetings(start, end);
        int b = maxMeetingsBrute(start, end);
        boolean ok = a == want && b == want;
        if (!ok) failures++;
        System.out.println((ok ? "  ok   " : "  FAIL ") + label + "  start " + Arrays.toString(start)
            + " end " + Arrays.toString(end) + " -> greedy " + a + ", brute " + b
            + (ok ? "" : "  expected " + want));
    }

    static void checkInt(String label, int got, int want) {
        boolean ok = got == want;
        if (!ok) failures++;
        System.out.println((ok ? "  ok   " : "  FAIL ") + label + " -> " + got + (ok ? "" : "  expected " + want));
    }

    public static void main(String[] args) {
        System.out.println("day 81 - Activity Selection / N Meetings in One Room");

        check("example", new int[] { 0, 5, 1, 3 }, new int[] { 6, 7, 2, 4 }, 3);
        check("GFG example", new int[] { 1, 3, 0, 5, 8, 5 }, new int[] { 2, 4, 6, 7, 9, 9 }, 4);
        check("one meeting", new int[] { 5 }, new int[] { 9 }, 1);
        check("touching (strict)", new int[] { 1, 2 }, new int[] { 2, 3 }, 1);
        check("identical", new int[] { 1, 1, 1 }, new int[] { 2, 2, 2 }, 1);
        check("long contains short", new int[] { 1, 2, 4, 6 }, new int[] { 10, 3, 5, 7 }, 3);
        check("already disjoint", new int[] { 1, 4, 7 }, new int[] { 2, 5, 8 }, 3);
        check("same end time", new int[] { 1, 2, 3 }, new int[] { 4, 4, 4 }, 1);
        check("zero-length", new int[] { 2, 3 }, new int[] { 2, 3 }, 2);
        check("shortest-duration trap", new int[] { 1, 4, 6 }, new int[] { 5, 7, 10 }, 2);

        checkInt("touching under LC 435 rules: removals for [[1,2],[2,3]] (so 2 kept)",
            eraseOverlapIntervals(new int[][] { {1,2}, {2,3} }), 0);
        checkInt("LC 435 follow-up [[1,2],[2,3],[3,4],[1,3]]",
            eraseOverlapIntervals(new int[][] { {1,2}, {2,3}, {3,4}, {1,3} }), 1);

        checkInt("wrong greedy by start on (0,6)(1,2)(3,4)(5,7)",
            wrongGreedy(new int[] { 0, 1, 3, 5 }, new int[] { 6, 2, 4, 7 }, 0), 1);
        checkInt("wrong greedy by duration on (1,5)(4,7)(6,10)",
            wrongGreedy(new int[] { 1, 4, 6 }, new int[] { 5, 7, 10 }, 2), 1);
        checkInt("wrong greedy by start on long-contains-short",
            wrongGreedy(new int[] { 1, 2, 4, 6 }, new int[] { 10, 3, 5, 7 }, 0), 1);

        Random rnd = new Random(81);
        int agree = 0, trials = 500;
        for (int t = 0; t < trials; t++) {
            int n = 1 + rnd.nextInt(12);
            int[] s = new int[n], e = new int[n];
            for (int i = 0; i < n; i++) { s[i] = rnd.nextInt(20); e[i] = s[i] + rnd.nextInt(8); }
            int a = maxMeetings(s, e), b = maxMeetingsBrute(s, e);
            if (a == b) agree++;
            else {
                failures++;
                System.out.println("  FAIL random " + Arrays.toString(s) + " " + Arrays.toString(e) + " -> " + a + " vs " + b);
            }
        }
        System.out.println("  ok   " + agree + "/" + trials + " random inputs, greedy matches all-subsets brute force");

        System.out.println(failures == 0 ? "  day 81 PASSED" : "  day 81 had " + failures + " FAILURES");
    }
}
