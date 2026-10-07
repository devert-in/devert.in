// Correctness assertions for day 78 - Redundant Connection (LC 684).
//
// The Union-Find solution and the remove-each-edge brute force are copied
// verbatim from day-078.md (as nested classes, since both keep helpers). They
// must agree on the worked example, every edge case in the writeup, and a few
// hundred random "tree plus one extra edge" graphs in shuffled order.

import java.util.*;

class Day78Test {

    // ---- brute force from the bruteForce section ----
    static class Brute {
        public int[] findRedundantConnection(int[][] edges) {

            int n = edges.length;
            int[] answer = null;

            for (int skip = 0; skip < n; skip++) {
                if (connectedWithout(edges, skip, n)) {
                    answer = edges[skip];
                }
            }

            return answer;
        }

        private boolean connectedWithout(int[][] edges, int skip, int n) {

            List<List<Integer>> adj = new ArrayList<>();
            for (int i = 0; i <= n; i++) {
                adj.add(new ArrayList<>());
            }
            for (int i = 0; i < edges.length; i++) {
                if (i == skip) continue;
                adj.get(edges[i][0]).add(edges[i][1]);
                adj.get(edges[i][1]).add(edges[i][0]);
            }

            boolean[] seen = new boolean[n + 1];
            Deque<Integer> stack = new ArrayDeque<>();
            stack.push(1);
            seen[1] = true;
            int count = 1;

            while (!stack.isEmpty()) {
                int u = stack.pop();
                for (int v : adj.get(u)) {
                    if (!seen[v]) {
                        seen[v] = true;
                        count++;
                        stack.push(v);
                    }
                }
            }

            return count == n;
        }
    }

    // ---- Union-Find from the implementation section ----
    static class Optimal {

        private int[] parent;
        private int[] rank;

        public int[] findRedundantConnection(int[][] edges) {

            int n = edges.length;
            parent = new int[n + 1];
            rank = new int[n + 1];
            for (int i = 1; i <= n; i++) {
                parent[i] = i;
            }

            for (int[] edge : edges) {
                if (!union(edge[0], edge[1])) {
                    return edge;
                }
            }

            return new int[0];
        }

        private int find(int x) {
            if (parent[x] != x) {
                parent[x] = find(parent[x]);
            }
            return parent[x];
        }

        private boolean union(int a, int b) {
            int rootA = find(a);
            int rootB = find(b);
            if (rootA == rootB) {
                return false;
            }
            if (rank[rootA] < rank[rootB]) {
                int temp = rootA;
                rootA = rootB;
                rootB = temp;
            }
            parent[rootB] = rootA;
            if (rank[rootA] == rank[rootB]) {
                rank[rootA]++;
            }
            return true;
        }
    }

    static int failures = 0;

    static void check(String label, int[][] edges, int[] want) {
        int[] a = new Optimal().findRedundantConnection(edges);
        int[] b = new Brute().findRedundantConnection(edges);
        boolean ok = Arrays.equals(a, want) && Arrays.equals(b, want);
        if (!ok) failures++;
        System.out.println((ok ? "  ok   " : "  FAIL ") + label + "  -> union-find "
            + Arrays.toString(a) + ", brute " + Arrays.toString(b)
            + (ok ? "" : "  expected " + Arrays.toString(want)));
    }

    public static void main(String[] args) {
        System.out.println("day 78 - Redundant Connection");

        check("example", new int[][] { {1,2}, {2,3}, {3,4}, {1,4}, {1,5} }, new int[] { 1, 4 });
        check("triangle", new int[][] { {1,2}, {1,3}, {2,3} }, new int[] { 2, 3 });
        check("whole graph is the cycle", new int[][] { {1,2}, {2,3}, {3,4}, {4,1} }, new int[] { 4, 1 });
        check("cycle avoids node 1", new int[][] { {1,2}, {2,3}, {3,4}, {4,2} }, new int[] { 4, 2 });
        check("shuffled candidates", new int[][] { {1,4}, {3,4}, {1,3}, {1,2}, {4,5} }, new int[] { 1, 3 });
        check("backwards edge", new int[][] { {2,1}, {3,1}, {2,3} }, new int[] { 2, 3 });
        check("redundant edge early", new int[][] { {1,2}, {2,3}, {1,3}, {3,4}, {4,5} }, new int[] { 1, 3 });

        int[][] chain = new int[1000][];
        for (int i = 1; i < 1000; i++) chain[i - 1] = new int[] { i, i + 1 };
        chain[999] = new int[] { 1, 1000 };
        check("1000-node path + closing edge", chain, new int[] { 1, 1000 });

        // Random trees with one extra edge, shuffled and randomly oriented.
        Random rnd = new Random(78);
        int agree = 0, trials = 400;
        for (int t = 0; t < trials; t++) {
            int n = 3 + rnd.nextInt(18);
            int[] label = new int[n + 1];
            List<Integer> perm = new ArrayList<>();
            for (int i = 1; i <= n; i++) perm.add(i);
            Collections.shuffle(perm, rnd);
            for (int i = 1; i <= n; i++) label[i] = perm.get(i - 1);

            Set<Long> present = new HashSet<>();
            List<int[]> list = new ArrayList<>();
            for (int v = 2; v <= n; v++) {
                int u = 1 + rnd.nextInt(v - 1);
                int a = label[u], b = label[v];
                list.add(new int[] { a, b });
                present.add((long) Math.min(a, b) * 10000 + Math.max(a, b));
            }
            while (true) {
                int a = 1 + rnd.nextInt(n), b = 1 + rnd.nextInt(n);
                if (a == b) continue;
                long key = (long) Math.min(a, b) * 10000 + Math.max(a, b);
                if (present.contains(key)) continue;
                list.add(new int[] { a, b });
                break;
            }
            Collections.shuffle(list, rnd);
            for (int[] e : list) if (rnd.nextBoolean()) { int x = e[0]; e[0] = e[1]; e[1] = x; }
            int[][] edges = list.toArray(new int[0][]);

            int[] a = new Optimal().findRedundantConnection(edges);
            int[] b = new Brute().findRedundantConnection(edges);
            if (Arrays.equals(a, b)) agree++;
            else {
                failures++;
                System.out.println("  FAIL random " + Arrays.deepToString(edges)
                    + " -> " + Arrays.toString(a) + " vs brute " + Arrays.toString(b));
            }
        }
        System.out.println("  ok   " + agree + "/" + trials + " random graphs, union-find matches brute force");

        System.out.println(failures == 0 ? "  day 78 PASSED" : "  day 78 had " + failures + " FAILURES");
    }
}
