// Correctness assertions for day 79 - Critical Connections in a Network (LC 1192).
//
// The Tarjan disc/low solution and the remove-each-edge brute force are copied
// verbatim from day-079.md as nested classes. The optimal's output ORDER is
// checked exactly where the writeup prints one (bridges come out deepest
// first); the brute force is compared as a set. Random connected graphs check
// that both agree. The "parent-edge trap" edge case is checked by running the
// same code with the skip line removed and confirming it really does return [].

import java.util.*;

class Day79Test {

    // ---- brute force from the bruteForce section ----
    static class Brute {
        public List<List<Integer>> criticalConnections(int n, List<List<Integer>> connections) {

            List<List<Integer>> bridges = new ArrayList<>();

            for (int skip = 0; skip < connections.size(); skip++) {
                if (countReachable(n, connections, skip) < n) {
                    bridges.add(connections.get(skip));
                }
            }

            return bridges;
        }

        private int countReachable(int n, List<List<Integer>> connections, int skip) {

            List<List<Integer>> adj = new ArrayList<>();
            for (int i = 0; i < n; i++) {
                adj.add(new ArrayList<>());
            }
            for (int i = 0; i < connections.size(); i++) {
                if (i == skip) continue;
                int a = connections.get(i).get(0);
                int b = connections.get(i).get(1);
                adj.get(a).add(b);
                adj.get(b).add(a);
            }

            boolean[] seen = new boolean[n];
            Deque<Integer> stack = new ArrayDeque<>();
            stack.push(0);
            seen[0] = true;
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

            return count;
        }
    }

    // ---- Tarjan from the implementation section ----
    static class Optimal {

        private List<List<Integer>> adj;
        private int[] disc;
        private int[] low;
        private int timer = 0;
        private List<List<Integer>> bridges;

        public List<List<Integer>> criticalConnections(int n, List<List<Integer>> connections) {

            adj = new ArrayList<>();
            for (int i = 0; i < n; i++) {
                adj.add(new ArrayList<>());
            }
            for (List<Integer> c : connections) {
                adj.get(c.get(0)).add(c.get(1));
                adj.get(c.get(1)).add(c.get(0));
            }

            disc = new int[n];
            low = new int[n];
            Arrays.fill(disc, -1);
            bridges = new ArrayList<>();

            for (int i = 0; i < n; i++) {
                if (disc[i] == -1) {
                    dfs(i, -1);
                }
            }

            return bridges;
        }

        private void dfs(int u, int parent) {

            disc[u] = low[u] = timer++;

            for (int v : adj.get(u)) {
                if (v == parent) continue;

                if (disc[v] == -1) {
                    dfs(v, u);
                    low[u] = Math.min(low[u], low[v]);
                    if (low[v] > disc[u]) {
                        bridges.add(Arrays.asList(u, v));
                    }
                } else {
                    low[u] = Math.min(low[u], disc[v]);
                }
            }
        }
    }

    // ---- the parent-edge trap: identical, minus the skip line ----
    static class NoParentSkip {
        private List<List<Integer>> adj;
        private int[] disc, low;
        private int timer = 0;
        private List<List<Integer>> bridges;

        public List<List<Integer>> criticalConnections(int n, List<List<Integer>> connections) {
            adj = new ArrayList<>();
            for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
            for (List<Integer> c : connections) {
                adj.get(c.get(0)).add(c.get(1));
                adj.get(c.get(1)).add(c.get(0));
            }
            disc = new int[n];
            low = new int[n];
            Arrays.fill(disc, -1);
            bridges = new ArrayList<>();
            for (int i = 0; i < n; i++) if (disc[i] == -1) dfs(i, -1);
            return bridges;
        }

        private void dfs(int u, int parent) {
            disc[u] = low[u] = timer++;
            for (int v : adj.get(u)) {
                if (disc[v] == -1) {
                    dfs(v, u);
                    low[u] = Math.min(low[u], low[v]);
                    if (low[v] > disc[u]) bridges.add(Arrays.asList(u, v));
                } else {
                    low[u] = Math.min(low[u], disc[v]);
                }
            }
        }
    }

    static int failures = 0;

    static List<List<Integer>> edges(int[][] raw) {
        List<List<Integer>> out = new ArrayList<>();
        for (int[] e : raw) out.add(Arrays.asList(e[0], e[1]));
        return out;
    }

    static Set<String> norm(List<List<Integer>> list) {
        Set<String> s = new TreeSet<>();
        for (List<Integer> e : list) s.add(Math.min(e.get(0), e.get(1)) + "-" + Math.max(e.get(0), e.get(1)));
        return s;
    }

    static void check(String label, int n, int[][] raw, int[][] wantOrdered) {
        List<List<Integer>> in = edges(raw);
        List<List<Integer>> a = new Optimal().criticalConnections(n, in);
        List<List<Integer>> b = new Brute().criticalConnections(n, in);
        List<List<Integer>> want = edges(wantOrdered);
        boolean ok = a.equals(want) && norm(b).equals(norm(want));
        if (!ok) failures++;
        System.out.println((ok ? "  ok   " : "  FAIL ") + label + "  -> tarjan " + a + ", brute " + b
            + (ok ? "" : "  expected " + want));
    }

    public static void main(String[] args) throws Exception {
        System.out.println("day 79 - Critical Connections in a Network");

        check("example", 5, new int[][] { {0,1}, {1,2}, {2,0}, {1,3}, {3,4} }, new int[][] { {3,4}, {1,3} });
        check("LC example 1", 4, new int[][] { {0,1}, {1,2}, {2,0}, {1,3} }, new int[][] { {1,3} });
        check("two nodes", 2, new int[][] { {0,1} }, new int[][] { {0,1} });
        check("single cycle", 3, new int[][] { {0,1}, {1,2}, {2,0} }, new int[][] {});
        check("tree (path)", 4, new int[][] { {0,1}, {1,2}, {2,3} }, new int[][] { {2,3}, {1,2}, {0,1} });
        check("star", 4, new int[][] { {0,1}, {0,2}, {0,3} }, new int[][] { {0,1}, {0,2}, {0,3} });
        check("two cycles joined", 6, new int[][] { {0,1}, {1,2}, {2,0}, {2,3}, {3,4}, {4,5}, {5,3} }, new int[][] { {2,3} });

        // Parent-edge trap: the broken version must really return [] on two nodes.
        List<List<Integer>> trap = new NoParentSkip().criticalConnections(2, edges(new int[][] { {0,1} }));
        boolean trapOk = trap.isEmpty();
        if (!trapOk) failures++;
        System.out.println((trapOk ? "  ok   " : "  FAIL ") + "parent-edge trap: without the skip line, n=2 gives " + trap);

        // Very long path, on a big stack as the Java notes recommend.
        final int N = 100000;
        final List<List<Integer>> path = new ArrayList<>();
        for (int i = 0; i + 1 < N; i++) path.add(Arrays.asList(i, i + 1));
        final int[] got = { -1 };
        Thread t = new Thread(null, () -> got[0] = new Optimal().criticalConnections(N, path).size(), "dfs", 1 << 26);
        t.start();
        t.join();
        boolean pathOk = got[0] == N - 1;
        if (!pathOk) failures++;
        System.out.println((pathOk ? "  ok   " : "  FAIL ") + "100000-node path -> " + got[0] + " bridges");

        // Random connected graphs: a random spanning tree plus extra edges.
        Random rnd = new Random(79);
        int agree = 0, trials = 400;
        for (int k = 0; k < trials; k++) {
            int n = 2 + rnd.nextInt(14);
            Set<String> present = new HashSet<>();
            List<int[]> list = new ArrayList<>();
            for (int v = 1; v < n; v++) {
                int u = rnd.nextInt(v);
                list.add(new int[] { u, v });
                present.add(Math.min(u, v) + "-" + Math.max(u, v));
            }
            int extra = rnd.nextInt(n + 1);
            for (int e = 0; e < extra * 3 && extra > 0; e++) {
                int a = rnd.nextInt(n), b = rnd.nextInt(n);
                if (a == b) continue;
                String key = Math.min(a, b) + "-" + Math.max(a, b);
                if (present.add(key)) { list.add(new int[] { a, b }); if (--extra == 0) break; }
            }
            Collections.shuffle(list, rnd);
            List<List<Integer>> in = edges(list.toArray(new int[0][]));

            Set<String> a = norm(new Optimal().criticalConnections(n, in));
            Set<String> b = norm(new Brute().criticalConnections(n, in));
            if (a.equals(b)) agree++;
            else {
                failures++;
                System.out.println("  FAIL random n=" + n + " " + in + " -> " + a + " vs brute " + b);
            }
        }
        System.out.println("  ok   " + agree + "/" + trials + " random connected graphs, tarjan matches brute force");

        System.out.println(failures == 0 ? "  day 79 PASSED" : "  day 79 had " + failures + " FAILURES");
    }
}
