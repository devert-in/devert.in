// Correctness assertions for day 42 - Largest Rectangle in Histogram.
//
// The one-pass sentinel stack and the expand-from-each-bar brute force are
// copied verbatim from day-042.md. Checked on the worked example (including the
// claim that the stack produces the same per-bar areas as the brute force),
// every edge case listed, the "no sentinel returns 0" and "`<=` also works"
// claims, and random inputs against an all-pairs oracle.

import java.util.*;

class Day42Test {

    // ---- copy of day-042.md's implementation section ----
    static int largestRectangleArea(int[] heights) {

        int n = heights.length;
        Deque<Integer> stack = new ArrayDeque<>();   // indices; heights increase bottom to top
        int best = 0;

        for (int i = 0; i <= n; i++) {
            int h = (i == n) ? 0 : heights[i];       // sentinel 0 flushes the stack at the end

            while (!stack.isEmpty() && h < heights[stack.peek()]) {
                int height = heights[stack.pop()];
                int left = stack.isEmpty() ? -1 : stack.peek();   // first shorter bar on the left
                int width = i - left - 1;                         // i is the first shorter bar on the right
                best = Math.max(best, height * width);
            }

            stack.push(i);
        }

        return best;
    }

    // ---- copy of the brute-force section ----
    static int brute(int[] heights) {

        int n = heights.length;
        int best = 0;

        for (int i = 0; i < n; i++) {

            int left = i;
            while (left > 0 && heights[left - 1] >= heights[i]) {
                left--;
            }

            int right = i;
            while (right < n - 1 && heights[right + 1] >= heights[i]) {
                right++;
            }

            best = Math.max(best, heights[i] * (right - left + 1));
        }

        return best;
    }

    // Oracle: every (l, r) pair with a running minimum.
    static int allPairs(int[] h) {
        int best = 0;
        for (int l = 0; l < h.length; l++) {
            int min = Integer.MAX_VALUE;
            for (int r = l; r < h.length; r++) {
                min = Math.min(min, h[r]);
                best = Math.max(best, min * (r - l + 1));
            }
        }
        return best;
    }

    // Variants backing claims made in the prose.
    static int noSentinel(int[] heights) {
        int n = heights.length;
        Deque<Integer> stack = new ArrayDeque<>();
        int best = 0;
        for (int i = 0; i < n; i++) {
            int h = heights[i];
            while (!stack.isEmpty() && h < heights[stack.peek()]) {
                int height = heights[stack.pop()];
                int left = stack.isEmpty() ? -1 : stack.peek();
                best = Math.max(best, height * (i - left - 1));
            }
            stack.push(i);
        }
        return best;
    }

    static int popOnLe(int[] heights) {
        int n = heights.length;
        Deque<Integer> stack = new ArrayDeque<>();
        int best = 0;
        for (int i = 0; i <= n; i++) {
            int h = (i == n) ? 0 : heights[i];
            while (!stack.isEmpty() && h <= heights[stack.peek()]) {
                int height = heights[stack.pop()];
                int left = stack.isEmpty() ? -1 : stack.peek();
                best = Math.max(best, height * (i - left - 1));
            }
            stack.push(i);
        }
        return best;
    }

    // Per-bar areas as the stack computes them, indexed by the popped bar.
    static int[] stackAreas(int[] heights) {
        int n = heights.length;
        int[] area = new int[n];
        Deque<Integer> stack = new ArrayDeque<>();
        for (int i = 0; i <= n; i++) {
            int h = (i == n) ? 0 : heights[i];
            while (!stack.isEmpty() && h < heights[stack.peek()]) {
                int p = stack.pop();
                int left = stack.isEmpty() ? -1 : stack.peek();
                area[p] = heights[p] * (i - left - 1);
            }
            stack.push(i);
        }
        return area;
    }

    static int failures = 0;

    static void check(String label, int[] h, int want) {
        int o = largestRectangleArea(h);
        int b = brute(h);
        boolean ok = o == want && b == want;
        if (!ok) failures++;
        System.out.println((ok ? "  ok   " : "  FAIL ") + label + "  " + Arrays.toString(h)
            + " -> stack " + o + ", brute " + b + (ok ? "" : "  expected " + want));
    }

    static void claim(String label, boolean holds) {
        if (!holds) failures++;
        System.out.println((holds ? "  ok   " : "  FAIL ") + label);
    }

    public static void main(String[] args) {
        System.out.println("day 42 - Largest Rectangle in Histogram");

        check("worked example", new int[] { 2, 1, 5, 6, 2, 3 }, 10);
        check("single bar", new int[] { 5 }, 5);
        check("all equal", new int[] { 3, 3, 3, 3 }, 12);
        check("strictly increasing", new int[] { 1, 2, 3, 4, 5 }, 9);
        check("strictly decreasing", new int[] { 5, 4, 3, 2, 1 }, 9);
        check("zero splits", new int[] { 2, 0, 2 }, 2);
        check("all zeros", new int[] { 0, 0 }, 0);
        check("LC example 2", new int[] { 2, 4 }, 4);
        check("classic valley", new int[] { 6, 2, 5, 4, 5, 1, 6 }, 12);

        claim("stack per-bar areas equal brute-force table [2, 6, 10, 6, 8, 3]",
            Arrays.equals(stackAreas(new int[] { 2, 1, 5, 6, 2, 3 }), new int[] { 2, 6, 10, 6, 8, 3 }));
        claim("without the sentinel, [1, 2, 3, 4, 5] returns 0 (got " + noSentinel(new int[] { 1, 2, 3, 4, 5 }) + ")",
            noSentinel(new int[] { 1, 2, 3, 4, 5 }) == 0);
        claim("bar 4 alone: width 4, area 8 (problem section)", stackAreas(new int[] { 2, 1, 5, 6, 2, 3 })[4] == 8);

        Random rnd = new Random(42);
        int agree = 0;
        for (int t = 0; t < 600; t++) {
            int n = 1 + rnd.nextInt(30);
            int span = rnd.nextBoolean() ? 4 : 50;      // small span forces equal heights and zeros
            int[] h = new int[n];
            for (int i = 0; i < n; i++) h[i] = rnd.nextInt(span);
            int want = allPairs(h);
            int o = largestRectangleArea(h), b = brute(h), le = popOnLe(h);
            if (o == want && b == want && le == want) agree++;
            else {
                failures++;
                System.out.println("  FAIL random " + Arrays.toString(h) + " -> " + o + " / " + b + " / " + le
                    + " expected " + want);
            }
        }
        System.out.println("  ok   " + agree + "/600 random cases: stack, brute force and `<=` variant match all-pairs oracle");

        System.out.println(failures == 0 ? "  day 42 PASSED" : "  day 42 had " + failures + " FAILURES");
    }
}
