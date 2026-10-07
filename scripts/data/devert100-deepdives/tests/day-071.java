// Correctness assertions for day 71 - Course Schedule II (LC 210).
//
// The brute force, Kahn's and DFS reverse-post-order solutions are copied
// verbatim from day-071.md. "Any valid order" means outputs are judged by a
// checker (permutation + every pair respected), not by equality - except
// where the writeup claims a SPECIFIC array, which is asserted exactly.

import java.util.*;

class Day71Test {

    // ---- brute force ----
    static int[] bruteFindOrder(int numCourses, int[][] prerequisites) {

        boolean[] taken = new boolean[numCourses];
        int[] order = new int[numCourses];

        for (int slot = 0; slot < numCourses; slot++) {

            int pick = -1;
            for (int c = 0; c < numCourses && pick == -1; c++) {
                if (taken[c]) continue;

                boolean ready = true;
                for (int[] p : prerequisites) {
                    if (p[0] == c && !taken[p[1]]) {
                        ready = false;
                        break;
                    }
                }
                if (ready) pick = c;
            }

            if (pick == -1) return new int[0];   // everyone left is blocked: a cycle
            taken[pick] = true;
            order[slot] = pick;
        }

        return order;
    }

    // ---- Kahn's (implementation section) ----
    static int[] findOrder(int numCourses, int[][] prerequisites) {

        List<List<Integer>> graph = new ArrayList<>();
        for (int i = 0; i < numCourses; i++) graph.add(new ArrayList<>());

        int[] indegree = new int[numCourses];
        for (int[] p : prerequisites) {
            int course = p[0], pre = p[1];
            graph.get(pre).add(course);     // pre -> course
            indegree[course]++;
        }

        Deque<Integer> queue = new ArrayDeque<>();
        for (int c = 0; c < numCourses; c++) {
            if (indegree[c] == 0) queue.offer(c);
        }

        int[] order = new int[numCourses];
        int write = 0;
        while (!queue.isEmpty()) {
            int pre = queue.poll();
            order[write++] = pre;           // pop order IS a valid order
            for (int course : graph.get(pre)) {
                indegree[course]--;
                if (indegree[course] == 0) queue.offer(course);
            }
        }

        return write == numCourses ? order : new int[0];
    }

    // ---- DFS reverse post-order ----
    static class DfsSolution {
        private List<List<Integer>> graph;
        private int[] state;            // 0 = unvisited, 1 = on current path, 2 = finished
        private int[] order;
        private int write;

        public int[] findOrder(int numCourses, int[][] prerequisites) {

            graph = new ArrayList<>();
            for (int i = 0; i < numCourses; i++) graph.add(new ArrayList<>());
            for (int[] p : prerequisites) graph.get(p[1]).add(p[0]);

            state = new int[numCourses];
            order = new int[numCourses];
            write = numCourses - 1;         // fill from the back: reverse post-order

            for (int c = 0; c < numCourses; c++) {
                if (state[c] == 0 && hasCycle(c)) return new int[0];
            }
            return order;
        }

        private boolean hasCycle(int node) {
            state[node] = 1;
            for (int next : graph.get(node)) {
                if (state[next] == 1) return true;
                if (state[next] == 0 && hasCycle(next)) return true;
            }
            state[node] = 2;
            order[write--] = node;          // finished after everything it unlocks
            return false;
        }
    }

    // A valid answer: a permutation of 0..n-1 with every pair [a, b] having b before a.
    static boolean valid(int n, int[][] pre, int[] order) {
        if (order.length != n) return false;
        int[] pos = new int[n];
        Arrays.fill(pos, -1);
        for (int i = 0; i < n; i++) {
            if (order[i] < 0 || order[i] >= n || pos[order[i]] != -1) return false;
            pos[order[i]] = i;
        }
        for (int[] p : pre) if (pos[p[1]] >= pos[p[0]]) return false;
        return true;
    }

    static int failures = 0;

    // want == null: impossible, all three must return []. Otherwise all three
    // must be valid, and Kahn's must equal `want` exactly (the writeup prints it).
    static void check(String label, int n, int[][] pre, int[] want) {
        int[] b = bruteFindOrder(n, pre), k = findOrder(n, pre), d = new DfsSolution().findOrder(n, pre);
        boolean ok;
        if (want == null) ok = b.length == 0 && k.length == 0 && d.length == 0;
        else ok = valid(n, pre, b) && valid(n, pre, k) && valid(n, pre, d) && Arrays.equals(k, want);
        if (!ok) failures++;
        System.out.println((ok ? "  ok   " : "  FAIL ") + label + " -> brute " + Arrays.toString(b)
            + ", kahn " + Arrays.toString(k) + ", dfs " + Arrays.toString(d)
            + (ok ? "" : "  expected kahn " + (want == null ? "[]" : Arrays.toString(want))));
    }

    static void exact(String label, int[] got, int[] want) {
        boolean ok = Arrays.equals(got, want);
        if (!ok) failures++;
        System.out.println((ok ? "  ok   " : "  FAIL ") + label + " " + Arrays.toString(got)
            + (ok ? "" : "  expected " + Arrays.toString(want)));
    }

    public static void main(String[] args) {
        System.out.println("day 71 - Course Schedule II");

        int[][] ex = { {0,3},{1,0},{1,4},{2,1},{4,3} };
        check("example",                 5, ex, new int[] { 3, 0, 4, 1, 2 });
        exact("brute force dry run gives", bruteFindOrder(5, ex), new int[] { 3, 0, 4, 1, 2 });
        exact("DFS reverse post-order gives", new DfsSolution().findOrder(5, ex), new int[] { 3, 4, 0, 1, 2 });
        check("no prerequisites",        3, new int[][] {}, new int[] { 0, 1, 2 });
        check("one course",              1, new int[][] {}, new int[] { 0 });
        check("two-course cycle",        2, new int[][] { {1,0},{0,1} }, null);
        check("self-dependency",         2, new int[][] { {1,1} }, null);
        check("cycle behind free course",3, new int[][] { {1,0},{1,2},{2,1} }, null);
        check("disconnected",            3, new int[][] { {1,0} }, new int[] { 0, 2, 1 });
        check("diamond",                 4, new int[][] { {1,0},{2,0},{3,1},{3,2} }, new int[] { 0, 1, 2, 3 });
        check("chain",                   4, new int[][] { {1,0},{2,1},{3,2} }, new int[] { 0, 1, 2, 3 });

        // Reversed-edge claim: the order comes out backwards (every pair violated).
        int[][] rev = new int[ex.length][];
        for (int i = 0; i < ex.length; i++) rev[i] = new int[] { ex[i][1], ex[i][0] };
        int[] backwards = findOrder(5, rev);
        boolean allViolated = backwards.length == 5;
        int[] pos = new int[5];
        for (int i = 0; i < backwards.length; i++) pos[backwards[i]] = i;
        for (int[] p : ex) if (pos[p[1]] < pos[p[0]]) allViolated = false;
        if (!allViolated) failures++;
        System.out.println((allViolated ? "  ok   " : "  FAIL ") + "reversed edges give a backwards order "
            + Arrays.toString(backwards));

        Random rnd = new Random(71);
        int agree = 0, possible = 0;
        for (int t = 0; t < 600; t++) {
            int n = 1 + rnd.nextInt(8);
            boolean dag = rnd.nextBoolean();
            Set<Long> used = new HashSet<>();
            List<int[]> list = new ArrayList<>();
            int m = rnd.nextInt(n * 2 + 1);
            for (int k = 0; k < m; k++) {
                int a = rnd.nextInt(n), b = rnd.nextInt(n);
                if (dag && a <= b) continue;
                if (used.add((long) a * 100 + b)) list.add(new int[] { a, b });
            }
            int[][] pre = list.toArray(new int[0][]);
            int[] b = bruteFindOrder(n, pre), k = findOrder(n, pre), d = new DfsSolution().findOrder(n, pre);
            boolean can = b.length > 0;
            if (can) possible++;
            boolean ok = can
                ? valid(n, pre, b) && valid(n, pre, k) && valid(n, pre, d)
                : k.length == 0 && d.length == 0 && !dag;
            if (ok) agree++;
            else {
                failures++;
                System.out.println("  FAIL random n=" + n + " pre=" + Arrays.deepToString(pre)
                    + " brute " + Arrays.toString(b) + " kahn " + Arrays.toString(k) + " dfs " + Arrays.toString(d));
            }
        }
        System.out.println("  ok   " + agree + "/600 random cases (" + possible
            + " possible); every returned order passes the checker, empties agree");

        System.out.println(failures == 0 ? "  day 71 PASSED" : "  day 71 had " + failures + " FAILURES");
    }
}
