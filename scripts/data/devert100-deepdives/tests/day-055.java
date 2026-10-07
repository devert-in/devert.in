// Correctness assertions for day 55 - Diameter of Binary Tree.
//
// The brute force (height helper at every node) and the post-order solution
// are copied verbatim from day-055.md. Both must match the worked example and
// every edge case, and on random trees both must match an independent oracle:
// turn the tree into an undirected graph and BFS from every node, taking the
// largest distance seen. The two off-by-one / root-only traps the takeaway
// names are run too, to prove they really give the wrong numbers it quotes.

import java.util.*;

class Day55Test {

    static class TreeNode {
        int val; TreeNode left; TreeNode right;
        TreeNode() {}
        TreeNode(int val) { this.val = val; }
        TreeNode(int val, TreeNode left, TreeNode right) { this.val = val; this.left = left; this.right = right; }
    }

    // ---- optimal, from the implementation section ----
    static int best;

    static int diameterOfBinaryTree(TreeNode root) {
        best = 0;
        height(root);
        return best;
    }

    static int height(TreeNode node) {
        if (node == null) return 0;

        int left = height(node.left);
        int right = height(node.right);

        best = Math.max(best, left + right);   // path bending here, in edges

        return 1 + Math.max(left, right);       // what the parent needs
    }

    // ---- brute force, from the bruteForce section ----
    static int bruteDiameter(TreeNode root) {

        if (root == null) return 0;

        int through = bruteHeight(root.left) + bruteHeight(root.right);

        int left = bruteDiameter(root.left);
        int right = bruteDiameter(root.right);

        return Math.max(through, Math.max(left, right));
    }

    static int bruteHeight(TreeNode node) {
        if (node == null) return 0;
        return 1 + Math.max(bruteHeight(node.left), bruteHeight(node.right));
    }

    // ---- traps ----
    static int rootOnly(TreeNode root) {
        return root == null ? 0 : bruteHeight(root.left) + bruteHeight(root.right);
    }

    static int countsNodes(TreeNode root) {
        return diameterOfBinaryTree(root) + 1;   // L + R + 1 at the best bend
    }

    // ---- independent oracle: all-pairs BFS on the undirected tree ----
    static int oracle(TreeNode root) {
        if (root == null) return 0;
        Map<TreeNode, List<TreeNode>> adj = new HashMap<>();
        Deque<TreeNode> st = new ArrayDeque<>();
        st.push(root);
        adj.put(root, new ArrayList<>());
        while (!st.isEmpty()) {
            TreeNode n = st.pop();
            for (TreeNode c : new TreeNode[] { n.left, n.right }) {
                if (c == null) continue;
                adj.put(c, new ArrayList<>());
                adj.get(c).add(n);
                adj.get(n).add(c);
                st.push(c);
            }
        }
        int ans = 0;
        for (TreeNode s : adj.keySet()) {
            Map<TreeNode, Integer> dist = new HashMap<>();
            Deque<TreeNode> q = new ArrayDeque<>();
            q.add(s); dist.put(s, 0);
            while (!q.isEmpty()) {
                TreeNode n = q.poll();
                ans = Math.max(ans, dist.get(n));
                for (TreeNode m : adj.get(n)) if (!dist.containsKey(m)) { dist.put(m, dist.get(n) + 1); q.add(m); }
            }
        }
        return ans;
    }

    static TreeNode build(Integer... vals) {
        if (vals.length == 0 || vals[0] == null) return null;
        TreeNode root = new TreeNode(vals[0]);
        Deque<TreeNode> q = new ArrayDeque<>();
        q.add(root);
        int i = 1;
        while (!q.isEmpty() && i < vals.length) {
            TreeNode n = q.poll();
            if (i < vals.length && vals[i] != null) { n.left = new TreeNode(vals[i]); q.add(n.left); }
            i++;
            if (i < vals.length && vals[i] != null) { n.right = new TreeNode(vals[i]); q.add(n.right); }
            i++;
        }
        return root;
    }

    static TreeNode randomTree(Random rnd, int n) {
        TreeNode root = null;
        for (int k = 0; k < n; k++) {
            TreeNode fresh = new TreeNode(rnd.nextInt(101) - 50);
            if (root == null) { root = fresh; continue; }
            TreeNode cur = root;
            while (true) {
                if (rnd.nextBoolean()) {
                    if (cur.left == null) { cur.left = fresh; break; }
                    cur = cur.left;
                } else {
                    if (cur.right == null) { cur.right = fresh; break; }
                    cur = cur.right;
                }
            }
        }
        return root;
    }

    static int failures = 0;

    static void check(String label, TreeNode root, int want) {
        int a = diameterOfBinaryTree(root);
        int b = bruteDiameter(root);
        int c = oracle(root);
        boolean ok = a == want && b == want && c == want;
        if (!ok) failures++;
        System.out.println((ok ? "  ok   " : "  FAIL ") + label + "  -> " + a
            + (ok ? "" : " (brute " + b + ", oracle " + c + ") expected " + want));
    }

    static void claim(String label, boolean holds) {
        if (!holds) failures++;
        System.out.println((holds ? "  ok   " : "  FAIL ") + label);
    }

    public static void main(String[] args) {
        System.out.println("day 55 - Diameter of Binary Tree");

        TreeNode example = build(1, 2, 3, 4, 5);
        TreeNode offRoot = build(1, 2, null, 3, 4, 5, null, null, 6);

        check("example",           example,                                   3);
        check("single node",       build(1),                                  0);
        check("two nodes",         build(1, 2),                               1);
        check("skewed chain",      build(1, 2, null, 3, null, 4),             3);
        check("bend below root",   offRoot,                                   4);
        check("perfect",           build(1, 2, 3, 4, 5, 6, 7),                4);
        check("empty",             build(),                                   0);
        check("right chain n=4",   build(1, null, 2, null, 3, null, 4),       3);

        claim("root-only trap gives 3 on the bend-below-root tree", rootOnly(offRoot) == 3);
        claim("root-only trap is right on the example (why it is tempting)", rootOnly(example) == 3);
        claim("L + R + 1 trap gives 4 on the example", countsNodes(example) == 4);

        Random rnd = new Random(55);
        int agree = 0;
        for (int t = 0; t < 400; t++) {
            TreeNode root = randomTree(rnd, 1 + rnd.nextInt(40));
            int a = diameterOfBinaryTree(root), b = bruteDiameter(root), c = oracle(root);
            if (a == b && a == c) agree++;
            else {
                failures++;
                System.out.println("  FAIL random -> " + a + " / " + b + " / oracle " + c);
            }
        }
        System.out.println("  ok   " + agree + "/400 random trees, optimal == brute == all-pairs BFS");

        System.out.println(failures == 0 ? "  day 55 PASSED" : "  day 55 had " + failures + " FAILURES");
    }
}
