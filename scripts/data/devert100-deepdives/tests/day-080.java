// Correctness assertions for day 80 - Articulation Points (GFG).
//
// The Tarjan solution and the remove-each-vertex brute force are copied
// verbatim from day-080.md as nested classes. Both must produce the exact
// outputs the edge-cases section claims (ascending order, [-1] for none) and
// agree on a few hundred random graphs, connected or not.
//
// The writeup also makes three claims about WRONG versions - no root rule,
// '>' instead of '>=', and low[v] instead of disc[v] on a back edge. Each is
// reproduced here as a one-line mutation and checked to really give the wrong
// answer the prose says it gives.

import java.util.*;

class Day80Test {

    // ---- brute force from the bruteForce section ----
    static class Brute {
        public ArrayList<Integer> articulationPoints(int V, ArrayList<ArrayList<Integer>> adj) {

            ArrayList<Integer> result = new ArrayList<>();
            int base = countComponents(V, adj, -1);

            for (int removed = 0; removed < V; removed++) {
                if (countComponents(V, adj, removed) > base) {
                    result.add(removed);
                }
            }

            if (result.isEmpty()) {
                result.add(-1);
            }
            return result;
        }

        private int countComponents(int V, ArrayList<ArrayList<Integer>> adj, int removed) {

            boolean[] seen = new boolean[V];
            int components = 0;

            for (int start = 0; start < V; start++) {
                if (start == removed || seen[start]) continue;

                components++;
                Deque<Integer> stack = new ArrayDeque<>();
                stack.push(start);
                seen[start] = true;

                while (!stack.isEmpty()) {
                    int u = stack.pop();
                    for (int v : adj.get(u)) {
                        if (v != removed && !seen[v]) {
                            seen[v] = true;
                            stack.push(v);
                        }
                    }
                }
            }

            return components;
        }
    }

    // ---- Tarjan from the implementation section (verbatim) ----
    static class Optimal {

        private int[] disc;
        private int[] low;
        private boolean[] isAP;
        private int timer;

        public ArrayList<Integer> articulationPoints(int V, ArrayList<ArrayList<Integer>> adj) {

            disc = new int[V];
            low = new int[V];
            isAP = new boolean[V];
            timer = 0;
            Arrays.fill(disc, -1);

            for (int i = 0; i < V; i++) {
                if (disc[i] == -1) {
                    dfs(i, -1, adj);
                }
            }

            ArrayList<Integer> result = new ArrayList<>();
            for (int i = 0; i < V; i++) {
                if (isAP[i]) {
                    result.add(i);
                }
            }
            if (result.isEmpty()) {
                result.add(-1);
            }
            return result;
        }

        private void dfs(int u, int parent, ArrayList<ArrayList<Integer>> adj) {

            disc[u] = low[u] = timer++;
            int children = 0;

            for (int v : adj.get(u)) {
                if (v == parent) continue;

                if (disc[v] == -1) {
                    children++;
                    dfs(v, u, adj);
                    low[u] = Math.min(low[u], low[v]);
                    if (parent != -1 && low[v] >= disc[u]) {
                        isAP[u] = true;
                    }
                } else {
                    low[u] = Math.min(low[u], disc[v]);
                }
            }

            if (parent == -1 && children > 1) {
                isAP[u] = true;
            }
        }
    }

    // ---- the same code with one deliberate mutation, for the "wrong version" claims ----
    // mode 0 = as published; 1 = no root rule; 2 = '>' instead of '>='; 3 = low[v] on back edge
    static class Mutant {

        final int mode;
        Mutant(int mode) { this.mode = mode; }

        private int[] disc;
        private int[] low;
        private boolean[] isAP;
        private int timer;

        public ArrayList<Integer> articulationPoints(int V, ArrayList<ArrayList<Integer>> adj) {

            disc = new int[V];
            low = new int[V];
            isAP = new boolean[V];
            timer = 0;
            Arrays.fill(disc, -1);

            for (int i = 0; i < V; i++) {
                if (disc[i] == -1) {
                    dfs(i, -1, adj);
                }
            }

            ArrayList<Integer> result = new ArrayList<>();
            for (int i = 0; i < V; i++) {
                if (isAP[i]) {
                    result.add(i);
                }
            }
            if (result.isEmpty()) {
                result.add(-1);
            }
            return result;
        }

        private void dfs(int u, int parent, ArrayList<ArrayList<Integer>> adj) {

            disc[u] = low[u] = timer++;
            int children = 0;

            for (int v : adj.get(u)) {
                if (v == parent) continue;

                if (disc[v] == -1) {
                    children++;
                    dfs(v, u, adj);
                    low[u] = Math.min(low[u], low[v]);
                    if (mode == 0 || mode == 3) {
                        if (parent != -1 && low[v] >= disc[u]) {
                            isAP[u] = true;
                        }
                    } else if (mode == 1) {
                        if (low[v] >= disc[u]) isAP[u] = true;
                    } else {
                        if (parent != -1 && low[v] > disc[u]) isAP[u] = true;
                    }
                } else {
                    low[u] = Math.min(low[u], mode == 3 ? low[v] : disc[v]);
                }
            }

            if (mode != 1 && parent == -1 && children > 1) {
                isAP[u] = true;
            }
        }
    }

    static int failures = 0;

    static ArrayList<ArrayList<Integer>> adj(int V, int[][] edges) {
        ArrayList<ArrayList<Integer>> a = new ArrayList<>();
        for (int i = 0; i < V; i++) a.add(new ArrayList<>());
        for (int[] e : edges) { a.get(e[0]).add(e[1]); a.get(e[1]).add(e[0]); }
        return a;
    }

    static void check(String label, int V, int[][] edges, Integer... want) {
        ArrayList<ArrayList<Integer>> g = adj(V, edges);
        List<Integer> a = new Optimal().articulationPoints(V, g);
        List<Integer> b = new Brute().articulationPoints(V, g);
        List<Integer> w = Arrays.asList(want);
        boolean ok = a.equals(w) && b.equals(w);
        if (!ok) failures++;
        System.out.println((ok ? "  ok   " : "  FAIL ") + label + "  -> tarjan " + a + ", brute " + b
            + (ok ? "" : "  expected " + w));
    }

    static void checkMutant(String label, int mode, int V, int[][] edges, Integer... wrongWant) {
        List<Integer> got = new Mutant(mode).articulationPoints(V, adj(V, edges));
        boolean ok = got.equals(Arrays.asList(wrongWant));
        if (!ok) failures++;
        System.out.println((ok ? "  ok   " : "  FAIL ") + label + " really gives " + got
            + (ok ? "" : "  writeup claims " + Arrays.asList(wrongWant)));
    }

    public static void main(String[] args) {
        System.out.println("day 80 - Articulation Points");

        int[][] bowtie = { {0,1}, {1,2}, {2,0}, {1,3}, {3,4}, {4,1} };
        int[][] triangle = { {0,1}, {1,2}, {2,0} };
        int[][] lowTrap = { {0,1}, {1,2}, {2,0}, {2,3}, {3,4}, {4,2} };

        check("example (bowtie)", 5, bowtie, 1);
        check("cycle", 3, triangle, -1);
        check("path", 4, new int[][] { {0,1}, {1,2}, {2,3} }, 1, 2);
        check("star rooted at centre", 4, new int[][] { {0,1}, {0,2}, {0,3} }, 0);
        check("star not rooted at centre", 4, new int[][] { {0,2}, {1,2}, {2,3} }, 2);
        check("two vertices", 2, new int[][] { {0,1} }, -1);
        check("single vertex", 1, new int[][] {}, -1);
        check("low vs disc trap graph", 5, lowTrap, 2);
        check("disconnected", 4, new int[][] { {0,1}, {2,3} }, -1);

        checkMutant("root mistake: no root rule on triangle", 1, 3, triangle, 0);
        checkMutant("'>' instead of '>=' on bowtie", 2, 5, bowtie, -1);
        checkMutant("low[v] on back edge, low-vs-disc graph", 3, 5, lowTrap, -1);

        // Random graphs, sometimes disconnected, against the brute force.
        Random rnd = new Random(80);
        int agree = 0, trials = 500;
        for (int t = 0; t < trials; t++) {
            int V = 1 + rnd.nextInt(14);
            Set<String> present = new HashSet<>();
            List<int[]> list = new ArrayList<>();
            int target = rnd.nextInt(V * 2 + 1);
            for (int k = 0; k < target * 4 && list.size() < target; k++) {
                int a = rnd.nextInt(V), b = rnd.nextInt(V);
                if (a == b) continue;
                if (present.add(Math.min(a, b) + "-" + Math.max(a, b))) list.add(new int[] { a, b });
            }
            ArrayList<ArrayList<Integer>> g = adj(V, list.toArray(new int[0][]));
            List<Integer> a = new Optimal().articulationPoints(V, g);
            List<Integer> b = new Brute().articulationPoints(V, g);
            if (a.equals(b)) agree++;
            else {
                failures++;
                System.out.println("  FAIL random V=" + V + " " + g + " -> " + a + " vs brute " + b);
            }
        }
        System.out.println("  ok   " + agree + "/" + trials + " random graphs, tarjan matches brute force");

        System.out.println(failures == 0 ? "  day 80 PASSED" : "  day 80 had " + failures + " FAILURES");
    }
}
