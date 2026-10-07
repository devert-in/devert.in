// Correctness assertions for day 41 - Daily Temperatures.
//
// The monotonic-stack solution, the O(1)-space jumping variant and the
// forward-scan brute force are copied verbatim from day-041.md. All three are
// checked on the worked example, every edge case listed (including the `>=`
// bug's claimed wrong output), and on random inputs in LeetCode's 30..100 range.

import java.util.*;

class Day41Test {

    // ---- copy of day-041.md's implementation section ----
    static int[] dailyTemperatures(int[] temperatures) {

        int n = temperatures.length;
        int[] answer = new int[n];                    // 0 already means "no warmer day"
        Deque<Integer> stack = new ArrayDeque<>();    // INDICES of days still waiting

        for (int i = 0; i < n; i++) {
            // Day i settles every waiting day that is strictly colder.
            while (!stack.isEmpty() && temperatures[i] > temperatures[stack.peek()]) {
                int prev = stack.pop();
                answer[prev] = i - prev;
            }
            stack.push(i);
        }

        return answer;
    }

    // ---- copy of the O(1)-space variant ----
    static int[] jumping(int[] temperatures) {

        int n = temperatures.length;
        int[] answer = new int[n];
        int hottest = 0;

        for (int i = n - 1; i >= 0; i--) {
            if (temperatures[i] >= hottest) {
                hottest = temperatures[i];   // nothing to the right is warmer: answer stays 0
                continue;
            }
            int j = i + 1;
            while (temperatures[j] <= temperatures[i]) {
                j += answer[j];              // skip straight to j's next warmer day
            }
            answer[i] = j - i;
        }

        return answer;
    }

    // ---- copy of the brute-force section ----
    static int[] brute(int[] temperatures) {

        int n = temperatures.length;
        int[] answer = new int[n];

        for (int i = 0; i < n; i++) {
            for (int j = i + 1; j < n; j++) {
                if (temperatures[j] > temperatures[i]) {
                    answer[i] = j - i;
                    break;
                }
            }
        }

        return answer;
    }

    // The `>=` bug the writeup warns about - used to confirm its claimed output.
    static int[] buggyGe(int[] temperatures) {
        int n = temperatures.length;
        int[] answer = new int[n];
        Deque<Integer> stack = new ArrayDeque<>();
        for (int i = 0; i < n; i++) {
            while (!stack.isEmpty() && temperatures[i] >= temperatures[stack.peek()]) {
                int prev = stack.pop();
                answer[prev] = i - prev;
            }
            stack.push(i);
        }
        return answer;
    }

    static int failures = 0;

    static void check(String label, int[] t, int[] want) {
        int[] o = dailyTemperatures(t);
        int[] j = jumping(t);
        int[] b = brute(t);
        boolean ok = Arrays.equals(o, want) && Arrays.equals(j, want) && Arrays.equals(b, want);
        if (!ok) failures++;
        System.out.println((ok ? "  ok   " : "  FAIL ") + label + "  " + Arrays.toString(t)
            + " -> stack " + Arrays.toString(o) + ", jump " + Arrays.toString(j) + ", brute " + Arrays.toString(b)
            + (ok ? "" : "  expected " + Arrays.toString(want)));
    }

    public static void main(String[] args) {
        System.out.println("day 41 - Daily Temperatures");

        check("worked example", new int[] { 73, 74, 75, 71, 69, 72, 76, 73 }, new int[] { 1, 1, 4, 2, 1, 1, 0, 0 });
        check("single day", new int[] { 50 }, new int[] { 0 });
        check("strictly increasing", new int[] { 30, 40, 50, 60 }, new int[] { 1, 1, 1, 0 });
        check("strictly decreasing", new int[] { 60, 50, 40, 30 }, new int[] { 0, 0, 0, 0 });
        check("all equal", new int[] { 70, 70, 70 }, new int[] { 0, 0, 0 });
        check("equal, then warmer", new int[] { 70, 70, 71 }, new int[] { 2, 1, 0 });
        check("warm day settles streak", new int[] { 50, 40, 30, 60 }, new int[] { 3, 2, 1, 0 });
        check("LC example 3", new int[] { 30, 60, 90 }, new int[] { 1, 1, 0 });
        check("equal run between", new int[] { 71, 70, 70, 70, 72 }, new int[] { 4, 3, 2, 1, 0 });

        // The `>=` bug claim from the implementation section.
        int[] bug = buggyGe(new int[] { 70, 70, 71 });
        boolean bugOk = Arrays.equals(bug, new int[] { 1, 1, 0 });
        if (!bugOk) failures++;
        System.out.println((bugOk ? "  ok   " : "  FAIL ") + ">= bug gives " + Arrays.toString(bug) + " on [70, 70, 71], as claimed");

        // Dry-run claim: 8 pushes, 6 pops on the worked example.
        {
            int[] t = { 73, 74, 75, 71, 69, 72, 76, 73 };
            Deque<Integer> stack = new ArrayDeque<>();
            int pushes = 0, pops = 0;
            for (int i = 0; i < t.length; i++) {
                while (!stack.isEmpty() && t[i] > t[stack.peek()]) { stack.pop(); pops++; }
                stack.push(i); pushes++;
            }
            boolean ok = pushes == 8 && pops == 6;
            if (!ok) failures++;
            System.out.println((ok ? "  ok   " : "  FAIL ") + "dry run counts: " + pushes + " pushes, " + pops + " pops");
        }

        Random rnd = new Random(41);
        int agree = 0;
        for (int t = 0; t < 500; t++) {
            int n = 1 + rnd.nextInt(40);
            int[] in = new int[n];
            int span = rnd.nextBoolean() ? 5 : 71;      // small span forces many duplicates
            for (int i = 0; i < n; i++) in[i] = 30 + rnd.nextInt(span);
            int[] want = brute(in);
            int[] o = dailyTemperatures(in);
            int[] j = jumping(in);
            if (Arrays.equals(o, want) && Arrays.equals(j, want)) agree++;
            else {
                failures++;
                System.out.println("  FAIL random " + Arrays.toString(in) + " -> " + Arrays.toString(o)
                    + " / " + Arrays.toString(j) + " expected " + Arrays.toString(want));
            }
        }
        System.out.println("  ok   " + agree + "/500 random cases, stack and jump variants agree with brute force");

        System.out.println(failures == 0 ? "  day 41 PASSED" : "  day 41 had " + failures + " FAILURES");
    }
}
