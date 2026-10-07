// Correctness assertions for day 84 - Jump Game II (LC 45), plus the bonus
// Jump Game (LC 55).
//
// The DP brute force, the greedy-levels solution and canJump are copied
// verbatim from day-084.md. Checks: the worked example, every edge case with
// the exact output the writeup claims, the two "wrong version" claims (loop to
// n-1, longest-jump-first), and a randomized comparison of greedy vs DP vs an
// explicit BFS oracle on reachable inputs.

import java.util.*;

class Day84Test {

    // ---- brute force, from the bruteForce section ----
    static int jumpDp(int[] nums) {
        int n = nums.length;
        int[] dp = new int[n];
        Arrays.fill(dp, Integer.MAX_VALUE);
        dp[0] = 0;
        for (int i = 0; i < n; i++) {
            if (dp[i] == Integer.MAX_VALUE) continue;
            for (int j = 1; j <= nums[i] && i + j < n; j++) {
                dp[i + j] = Math.min(dp[i + j], dp[i] + 1);
            }
        }
        return dp[n - 1];
    }

    // ---- optimal, from the implementation section ----
    static int jump(int[] nums) {
        int jumps = 0;
        int currentEnd = 0;
        int farthest = 0;
        for (int i = 0; i < nums.length - 1; i++) {
            farthest = Math.max(farthest, i + nums[i]);
            if (i == currentEnd) {
                jumps++;
                currentEnd = farthest;
            }
        }
        return jumps;
    }

    // ---- bonus LC 55, from the implementation section ----
    static boolean canJump(int[] nums) {
        int farthest = 0;
        for (int i = 0; i < nums.length; i++) {
            if (i > farthest) return false;
            farthest = Math.max(farthest, i + nums[i]);
        }
        return true;
    }

    // The off-by-one the writeup warns about: loop to n - 1.
    static int jumpTooFar(int[] nums) {
        int jumps = 0, currentEnd = 0, farthest = 0;
        for (int i = 0; i < nums.length; i++) {
            farthest = Math.max(farthest, i + nums[i]);
            if (i == currentEnd) { jumps++; currentEnd = farthest; }
        }
        return jumps;
    }

    // The naive greedy: always jump as far as possible from where you stand.
    static int longestFirst(int[] nums) {
        int i = 0, jumps = 0;
        while (i < nums.length - 1) { i += nums[i]; jumps++; }
        return jumps;
    }

    // Oracle: plain BFS over indices.
    static int bfs(int[] nums) {
        int n = nums.length;
        int[] dist = new int[n];
        Arrays.fill(dist, -1);
        dist[0] = 0;
        ArrayDeque<Integer> q = new ArrayDeque<>();
        q.add(0);
        while (!q.isEmpty()) {
            int u = q.poll();
            for (int v = u + 1; v <= u + nums[u] && v < n; v++) {
                if (dist[v] == -1) { dist[v] = dist[u] + 1; q.add(v); }
            }
        }
        return dist[n - 1];
    }

    static int failures = 0;

    static void check(String label, int[] nums, int want) {
        int g = jump(nums.clone());
        int d = jumpDp(nums.clone());
        boolean ok = g == want && d == want;
        if (!ok) failures++;
        System.out.println((ok ? "  ok   " : "  FAIL ") + label + "  " + Arrays.toString(nums)
            + " -> " + g + (ok ? "" : "  dp " + d + "  expected " + want));
    }

    static void claim(String label, boolean holds) {
        if (!holds) failures++;
        System.out.println((holds ? "  ok   " : "  FAIL ") + label);
    }

    public static void main(String[] args) {
        System.out.println("day 84 - Jump Game II");

        check("example",              new int[] { 2, 3, 1, 1, 4 }, 2);
        check("single",               new int[] { 0 },             0);
        check("two elements",         new int[] { 1, 2 },          1);
        check("first jump reaches",   new int[] { 4, 1, 1, 1, 1 }, 1);
        check("all ones",             new int[] { 1, 1, 1, 1 },    3);
        check("zero jumped over",     new int[] { 2, 3, 0, 1, 4 }, 2);
        check("large last value",     new int[] { 1, 1, 1, 1000 }, 3);

        claim("longest-jump-first on example gives 3: got " + longestFirst(new int[] { 2, 3, 1, 1, 4 }),
            longestFirst(new int[] { 2, 3, 1, 1, 4 }) == 3);
        claim("loop to n-1 on example gives 3: got " + jumpTooFar(new int[] { 2, 3, 1, 1, 4 }),
            jumpTooFar(new int[] { 2, 3, 1, 1, 4 }) == 3);
        claim("loop to n-1 on [1, 2] gives 2: got " + jumpTooFar(new int[] { 1, 2 }),
            jumpTooFar(new int[] { 1, 2 }) == 2);

        claim("canJump [2,3,1,1,4] = true", canJump(new int[] { 2, 3, 1, 1, 4 }));
        claim("canJump [3,2,1,0,4] = false", !canJump(new int[] { 3, 2, 1, 0, 4 }));
        claim("canJump [0] = true", canJump(new int[] { 0 }));

        Random rnd = new Random(84);
        int agree = 0, tried = 0, canAgree = 0;
        while (tried < 600) {
            int n = 1 + rnd.nextInt(20);
            int[] nums = new int[n];
            for (int i = 0; i < n; i++) nums[i] = rnd.nextInt(5);
            int want = bfs(nums);

            // canJump vs BFS reachability, on every generated array
            if (canJump(nums) == (want != -1)) canAgree++;
            else { failures++; System.out.println("  FAIL canJump " + Arrays.toString(nums)); }

            if (want == -1) continue;      // LC 45 guarantees reachability
            tried++;
            int g = jump(nums), d = jumpDp(nums);
            if (g == want && d == want) agree++;
            else {
                failures++;
                System.out.println("  FAIL random " + Arrays.toString(nums) + " -> greedy " + g + ", dp " + d + ", bfs " + want);
            }
        }
        System.out.println("  ok   " + agree + "/600 reachable random cases: greedy == dp == bfs");
        System.out.println("  ok   " + canAgree + " random cases: canJump matches bfs reachability");

        System.out.println(failures == 0 ? "  day 84 PASSED" : "  day 84 had " + failures + " FAILURES");
    }
}
