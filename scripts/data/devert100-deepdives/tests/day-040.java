// Correctness assertions for day 40 - Next Greater Element I.
//
// The monotonic-stack solution and the find-and-scan brute force are copied
// verbatim from day-040.md. Checked on the worked example, every edge case
// listed, the "pushed once, popped at most once" count from the dry run, and
// random distinct-value inputs where the two must agree.

import java.util.*;

class Day40Test {

    // ---- copy of day-040.md's implementation section ----
    static int[] nextGreaterElement(int[] nums1, int[] nums2) {

        Map<Integer, Integer> nextGreater = new HashMap<>();
        Deque<Integer> stack = new ArrayDeque<>();   // values still waiting; decreasing bottom to top

        for (int x : nums2) {
            // x is the answer for every waiting value smaller than it.
            while (!stack.isEmpty() && x > stack.peek()) {
                nextGreater.put(stack.pop(), x);
            }
            stack.push(x);
        }
        // Whatever is still on the stack has no greater element: left out of the map.

        int[] ans = new int[nums1.length];
        for (int i = 0; i < nums1.length; i++) {
            ans[i] = nextGreater.getOrDefault(nums1[i], -1);
        }

        return ans;
    }

    // ---- copy of the brute-force section ----
    static int[] brute(int[] nums1, int[] nums2) {

        int[] ans = new int[nums1.length];

        for (int i = 0; i < nums1.length; i++) {

            // 1. find where nums1[i] sits in nums2
            int j = 0;
            while (nums2[j] != nums1[i]) {
                j++;
            }

            // 2. scan right for the first greater element
            int next = -1;
            for (int k = j + 1; k < nums2.length; k++) {
                if (nums2[k] > nums1[i]) {
                    next = nums2[k];
                    break;
                }
            }

            ans[i] = next;
        }

        return ans;
    }

    static int failures = 0;

    static void check(String label, int[] nums1, int[] nums2, int[] want) {
        int[] o = nextGreaterElement(nums1, nums2);
        int[] b = brute(nums1, nums2);
        boolean ok = Arrays.equals(o, want) && Arrays.equals(b, want);
        if (!ok) failures++;
        System.out.println((ok ? "  ok   " : "  FAIL ") + label + "  nums1=" + Arrays.toString(nums1)
            + " nums2=" + Arrays.toString(nums2) + " -> stack " + Arrays.toString(o)
            + ", brute " + Arrays.toString(b) + (ok ? "" : "  expected " + Arrays.toString(want)));
    }

    public static void main(String[] args) {
        System.out.println("day 40 - Next Greater Element I");

        check("worked example", new int[] { 3, 4, 7, 2 }, new int[] { 2, 7, 3, 5, 4, 6, 1 }, new int[] { 5, 6, -1, 7 });
        // full table from the problem section
        check("worked example, all values", new int[] { 2, 7, 3, 5, 4, 6, 1 }, new int[] { 2, 7, 3, 5, 4, 6, 1 },
            new int[] { 7, -1, 5, 6, 6, -1, -1 });
        check("LC example 1", new int[] { 4, 1, 2 }, new int[] { 1, 3, 4, 2 }, new int[] { -1, 3, -1 });
        check("LC example 2", new int[] { 2, 4 }, new int[] { 1, 2, 3, 4 }, new int[] { 3, -1 });
        check("single element", new int[] { 1 }, new int[] { 1 }, new int[] { -1 });
        check("strictly increasing", new int[] { 1, 2, 3, 4 }, new int[] { 1, 2, 3, 4 }, new int[] { 2, 3, 4, -1 });
        check("strictly decreasing", new int[] { 4, 3, 2, 1 }, new int[] { 4, 3, 2, 1 }, new int[] { -1, -1, -1, -1 });
        check("first, not largest", new int[] { 1 }, new int[] { 1, 5, 3, 10 }, new int[] { 5 });
        check("query order differs", new int[] { 2, 1 }, new int[] { 1, 2 }, new int[] { -1, 2 });
        check("one settles many", new int[] { 5, 4, 3, 9 }, new int[] { 5, 4, 3, 9 }, new int[] { 9, 9, 9, -1 });

        // Dry-run claim: 7 pushes, 4 pops on the worked example.
        {
            int[] nums2 = { 2, 7, 3, 5, 4, 6, 1 };
            Deque<Integer> stack = new ArrayDeque<>();
            int pushes = 0, pops = 0;
            for (int x : nums2) {
                while (!stack.isEmpty() && x > stack.peek()) { stack.pop(); pops++; }
                stack.push(x); pushes++;
            }
            boolean ok = pushes == 7 && pops == 4 && stack.size() == 3;
            if (!ok) failures++;
            System.out.println((ok ? "  ok   " : "  FAIL ") + "dry run counts: " + pushes + " pushes, " + pops
                + " pops, " + stack.size() + " left waiting");
        }

        Random rnd = new Random(40);
        int agree = 0;
        for (int t = 0; t < 500; t++) {
            int m = 1 + rnd.nextInt(30);
            List<Integer> pool = new ArrayList<>();
            for (int v = 0; v <= 60; v++) pool.add(v);
            Collections.shuffle(pool, rnd);
            int[] nums2 = new int[m];
            for (int i = 0; i < m; i++) nums2[i] = pool.get(i);
            List<Integer> sub = new ArrayList<>();
            for (int v : nums2) sub.add(v);
            Collections.shuffle(sub, rnd);
            int n = 1 + rnd.nextInt(m);
            int[] nums1 = new int[n];
            for (int i = 0; i < n; i++) nums1[i] = sub.get(i);

            int[] o = nextGreaterElement(nums1, nums2);
            int[] b = brute(nums1, nums2);
            if (Arrays.equals(o, b)) agree++;
            else {
                failures++;
                System.out.println("  FAIL random nums1=" + Arrays.toString(nums1) + " nums2=" + Arrays.toString(nums2)
                    + " -> " + Arrays.toString(o) + " / " + Arrays.toString(b));
            }
        }
        System.out.println("  ok   " + agree + "/500 random cases, stack agrees with brute force");

        System.out.println(failures == 0 ? "  day 40 PASSED" : "  day 40 had " + failures + " FAILURES");
    }
}
