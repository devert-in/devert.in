// Correctness assertions for day 70 - Course Schedule (LC 207).
//
// The three published solutions (repeated-rounds brute force, Kahn's, DFS
// three-colour) are copied verbatim from day-070.md. They must agree on the
// worked examples, every edge case in the writeup, and a few hundred random
// prerequisite sets, half of them built as guaranteed DAGs.

import java.util.*;

class Day70Test {

    // ---- brute force ----
    static boolean bruteCanFinish(int numCourses, int[][] prerequisites) {

        boolean[] taken = new boolean[numCourses];
        int count = 0;
        boolean progress = true;

        while (progress) {
            progress = false;

            for (int c = 0; c < numCourses; c++) {
                if (taken[c]) continue;

                boolean ready = true;
                for (int[] p : prerequisites) {
                    if (p[0] == c && !taken[p[1]]) {
                        ready = false;
                        break;
                    }
                }

                if (ready) {
                    taken[c] = true;
                    count++;
                    progress = true;
                }
            }
        }

        return count == numCourses;
    }

    // ---- Kahn's (implementation section) ----
    static boolean canFinish(int numCourses, int[][] prerequisites) {

        List<List<Integer>> graph = new ArrayList<>();
        for (int i = 0; i < numCourses; i++) graph.add(new ArrayList<>());

        int[] indegree = new int[numCourses];
        for (int[] p : prerequisites) {
            int course = p[0], pre = p[1];
            graph.get(pre).add(course);     // edge pre -> course: taking pre unlocks course
            indegree[course]++;
        }

        Deque<Integer> queue = new ArrayDeque<>();
        for (int c = 0; c < numCourses; c++) {
            if (indegree[c] == 0) queue.offer(c);
        }

        int taken = 0;
        while (!queue.isEmpty()) {
            int pre = queue.poll();
            taken++;
            for (int course : graph.get(pre)) {
                indegree[course]--;
                if (indegree[course] == 0) queue.offer(course);
            }
        }

        return taken == numCourses;
    }

    // ---- DFS three-colour ----
    static boolean dfsCanFinish(int numCourses, int[][] prerequisites) {

        List<List<Integer>> graph = new ArrayList<>();
        for (int i = 0; i < numCourses; i++) graph.add(new ArrayList<>());
        for (int[] p : prerequisites) graph.get(p[1]).add(p[0]);

        int[] state = new int[numCourses];  // 0 = unvisited, 1 = on current path, 2 = finished
        for (int c = 0; c < numCourses; c++) {
            if (state[c] == 0 && hasCycle(c, graph, state)) return false;
        }
        return true;
    }

    static boolean hasCycle(int node, List<List<Integer>> graph, int[] state) {
        state[node] = 1;
        for (int next : graph.get(node)) {
            if (state[next] == 1) return true;      // back onto the current path: cycle
            if (state[next] == 0 && hasCycle(next, graph, state)) return true;
        }
        state[node] = 2;                            // fully explored, safe forever
        return false;
    }

    static int failures = 0;

    static void check(String label, int n, int[][] pre, boolean want) {
        boolean b = bruteCanFinish(n, pre), k = canFinish(n, pre), d = dfsCanFinish(n, pre);
        boolean ok = b == want && k == want && d == want;
        if (!ok) failures++;
        System.out.println((ok ? "  ok   " : "  FAIL ") + label + " -> brute " + b + ", kahn " + k
            + ", dfs " + d + (ok ? "" : "  expected " + want));
    }

    public static void main(String[] args) {
        System.out.println("day 70 - Course Schedule");

        check("example (diamond)",          4, new int[][] { {0,1},{0,2},{1,3},{2,3} }, true);
        check("impossible example",         3, new int[][] { {1,0},{1,2},{2,1} }, false);
        check("no prerequisites",           3, new int[][] {}, true);
        check("one course",                 1, new int[][] {}, true);
        check("two-course cycle",           2, new int[][] { {1,0},{0,1} }, false);
        check("self-dependency",            2, new int[][] { {1,1} }, false);
        check("cycle in a separate group",  5, new int[][] { {1,0},{3,2},{4,3},{2,4} }, false);
        check("long chain",                 4, new int[][] { {1,0},{2,1},{3,2} }, true);
        check("chain listed backwards",     4, new int[][] { {0,1},{1,2},{2,3} }, true);
        check("course depending on many",   4, new int[][] { {3,0},{3,1},{3,2} }, true);

        // Kahn dry-run claim: the impossible example starts at indegree [0, 2, 1].
        int[] indeg = new int[3];
        for (int[] p : new int[][] { {1,0},{1,2},{2,1} }) indeg[p[0]]++;
        boolean dry = Arrays.equals(indeg, new int[] { 0, 2, 1 });
        if (!dry) failures++;
        System.out.println((dry ? "  ok   " : "  FAIL ") + "impossible example starting indegree " + Arrays.toString(indeg));

        // The "reversed arrows still answer canFinish" claim.
        Random rnd = new Random(70);
        int agree = 0, possible = 0;
        for (int t = 0; t < 600; t++) {
            int n = 1 + rnd.nextInt(8);
            boolean dag = rnd.nextBoolean();
            Set<Long> used = new HashSet<>();
            List<int[]> list = new ArrayList<>();
            int m = rnd.nextInt(n * 2 + 1);
            for (int k = 0; k < m; k++) {
                int a = rnd.nextInt(n), b = rnd.nextInt(n);
                if (dag && a <= b) continue;          // a needs b only when b < a: acyclic
                long key = (long) a * 100 + b;
                if (used.add(key)) list.add(new int[] { a, b });
            }
            int[][] pre = list.toArray(new int[0][]);
            int[][] rev = new int[pre.length][];
            for (int i = 0; i < pre.length; i++) rev[i] = new int[] { pre[i][1], pre[i][0] };

            boolean want = bruteCanFinish(n, pre);
            if (want) possible++;
            boolean k = canFinish(n, pre), d = dfsCanFinish(n, pre), r = canFinish(n, rev);
            boolean ok = k == want && d == want && r == want && (!dag || want);
            if (ok) agree++;
            else {
                failures++;
                System.out.println("  FAIL random n=" + n + " pre=" + Arrays.deepToString(pre)
                    + " brute " + want + " kahn " + k + " dfs " + d + " reversed " + r);
            }
        }
        System.out.println("  ok   " + agree + "/600 random cases (" + possible
            + " possible); Kahn, DFS and reversed-arrow Kahn all match brute force");

        System.out.println(failures == 0 ? "  day 70 PASSED" : "  day 70 had " + failures + " FAILURES");
    }
}
