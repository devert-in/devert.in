// Correctness assertions for day 22 - Trapping Rain Water (LC 42).
//
// The brute force, the two-pointer implementation, the prefix/suffix version
// and the monotonic stack version are copied verbatim from day-022.md. All
// four must agree on the worked example, every edge case in the edge-cases
// section, and random elevation maps. The implementation note says a
// `left < right` loop also returns the right total (the meeting bar holds no
// water); that is checked on every random map too.

import java.util.*;

class Day22Test {

    // ---- brute force from the bruteForce section ----
    static int brute(int[] height) {
        int n = height.length;
        int water = 0;

        for (int i = 0; i < n; i++) {

            int leftMax = 0;
            for (int j = 0; j <= i; j++) {
                leftMax = Math.max(leftMax, height[j]);
            }

            int rightMax = 0;
            for (int j = i; j < n; j++) {
                rightMax = Math.max(rightMax, height[j]);
            }

            water += Math.min(leftMax, rightMax) - height[i];
        }

        return water;
    }

    // ---- two pointers from the implementation section ----
    static int trap(int[] height) {
        int left = 0, right = height.length - 1;
        int leftMax = 0, rightMax = 0;
        int water = 0;

        while (left <= right) {

            leftMax = Math.max(leftMax, height[left]);
            rightMax = Math.max(rightMax, height[right]);

            if (leftMax < rightMax) {
                water += leftMax - height[left];
                left++;
            } else {
                water += rightMax - height[right];
                right--;
            }
        }

        return water;
    }

    // ---- prefix/suffix version from the implementation section ----
    static int prefixSuffix(int[] height) {
        int n = height.length;
        int[] maxLeft = new int[n];
        int[] maxRight = new int[n];

        maxLeft[0] = height[0];
        for (int i = 1; i < n; i++) {
            maxLeft[i] = Math.max(maxLeft[i - 1], height[i]);
        }

        maxRight[n - 1] = height[n - 1];
        for (int i = n - 2; i >= 0; i--) {
            maxRight[i] = Math.max(maxRight[i + 1], height[i]);
        }

        int water = 0;
        for (int i = 0; i < n; i++) {
            water += Math.min(maxLeft[i], maxRight[i]) - height[i];
        }
        return water;
    }

    // ---- monotonic stack version from the implementation section ----
    static int stack(int[] height) {
        Deque<Integer> stack = new ArrayDeque<>();
        int water = 0;

        for (int i = 0; i < height.length; i++) {
            while (!stack.isEmpty() && height[i] > height[stack.peek()]) {
                int floor = stack.pop();
                if (stack.isEmpty()) break;

                int leftWall = stack.peek();
                int width = i - leftWall - 1;
                int depth = Math.min(height[leftWall], height[i]) - height[floor];
                water += width * depth;
            }
            stack.push(i);
        }

        return water;
    }

    // The `left < right` variant the implementation notes mention.
    static int strictLoop(int[] height) {
        int left = 0, right = height.length - 1, leftMax = 0, rightMax = 0, water = 0;
        while (left < right) {
            leftMax = Math.max(leftMax, height[left]);
            rightMax = Math.max(rightMax, height[right]);
            if (leftMax < rightMax) { water += leftMax - height[left]; left++; }
            else { water += rightMax - height[right]; right--; }
        }
        return water;
    }

    static int failures = 0;

    static void check(String label, int[] h, int want) {
        int a = trap(h), b = brute(h), c = prefixSuffix(h), d = stack(h);
        boolean ok = a == want && b == want && c == want && d == want;
        if (!ok) failures++;
        System.out.println((ok ? "  ok   " : "  FAIL ") + label + "  " + Arrays.toString(h) + " -> two-pointer " + a
            + ", brute " + b + ", prefix/suffix " + c + ", stack " + d + (ok ? "" : "  expected " + want));
    }

    public static void main(String[] args) {
        System.out.println("day 22 - Trapping Rain Water");

        check("example",              new int[] { 0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1 }, 6);
        check("LeetCode example 2",   new int[] { 4, 2, 0, 3, 2, 5 }, 9);
        check("single bar",           new int[] { 5 }, 0);
        check("two bars",             new int[] { 1, 2 }, 0);
        check("strictly increasing",  new int[] { 1, 2, 3 }, 0);
        check("strictly decreasing",  new int[] { 3, 2, 1 }, 0);
        check("single valley",        new int[] { 2, 0, 2 }, 2);
        check("unequal walls",        new int[] { 5, 0, 3 }, 3);
        check("peak in the middle",   new int[] { 0, 3, 0 }, 0);
        check("flat",                 new int[] { 2, 2, 2 }, 0);
        check("wide basin",           new int[] { 5, 0, 0, 0, 5 }, 15);

        Random rnd = new Random(22);
        int agree = 0;
        int strictAgree = 0;
        for (int t = 0; t < 600; t++) {
            int n = 1 + rnd.nextInt(20);
            int[] h = new int[n];
            for (int i = 0; i < n; i++) h[i] = rnd.nextInt(8);
            int want = brute(h);
            int a = trap(h), c = prefixSuffix(h), d = stack(h);
            if (a == want && c == want && d == want) agree++;
            else {
                failures++;
                System.out.println("  FAIL random " + Arrays.toString(h) + " -> " + a + " / " + c + " / " + d + " brute " + want);
            }
            if (strictLoop(h) == want) strictAgree++;
            else {
                failures++;
                System.out.println("  FAIL strict-loop variant " + Arrays.toString(h) + " -> " + strictLoop(h) + " brute " + want);
            }
        }
        System.out.println("  ok   " + agree + "/600 random maps, two-pointer == prefix/suffix == stack == brute force");

        System.out.println("  ok   " + strictAgree + "/600 random maps, `left < right` variant also matches (meeting bar holds no water)");

        System.out.println(failures == 0 ? "  day 22 PASSED" : "  day 22 had " + failures + " FAILURES");
    }
}
