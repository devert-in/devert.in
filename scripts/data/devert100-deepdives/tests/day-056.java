// Correctness assertions for day 56 - Balanced Binary Tree.
//
// The top-down brute force, the bottom-up sentinel solution and the
// global-flag variant are copied verbatim from day-056.md. All three must
// agree with the worked examples, every edge case, and an independent oracle
// (heights memoised in a map, then every node checked) on random trees. The
// claims the writeup makes about work done are checked with an instrumented
// copy: the brute force's 11 height visits, and the sentinel version skipping
// the whole right half of the "broken below the root" tree.

import java.util.*;

class Day56Test {

    static class TreeNode {
        int val; TreeNode left; TreeNode right;
        TreeNode() {}
        TreeNode(int val) { this.val = val; }
        TreeNode(int val, TreeNode left, TreeNode right) { this.val = val; this.left = left; this.right = right; }
    }

    // ---- optimal, from the implementation section ----
    static boolean isBalanced(TreeNode root) {
        return check(root) != -1;
    }

    static int check(TreeNode node) {
        if (node == null) return 0;

        int left = check(node.left);
        if (left == -1) return -1;                 // left subtree already failed

        int right = check(node.right);
        if (right == -1) return -1;                // right subtree already failed

        if (Math.abs(left - right) > 1) return -1; // this node fails

        return 1 + Math.max(left, right);
    }

    // ---- brute force, from the bruteForce section ----
    static boolean bruteIsBalanced(TreeNode root) {

        if (root == null) return true;

        int diff = Math.abs(height(root.left) - height(root.right));
        if (diff > 1) return false;

        return bruteIsBalanced(root.left) && bruteIsBalanced(root.right);
    }

    static int heightVisits = 0;

    static int height(TreeNode node) {
        if (node == null) return 0;
        heightVisits++;   // instrumentation only
        return 1 + Math.max(height(node.left), height(node.right));
    }

    // ---- global-flag variant ----
    static boolean balanced;

    static boolean flagIsBalanced(TreeNode root) {
        balanced = true;
        flagHeight(root);
        return balanced;
    }

    static int flagHeight(TreeNode node) {
        if (node == null || !balanced) return 0;   // stop work once it has failed

        int left = flagHeight(node.left);
        int right = flagHeight(node.right);

        if (Math.abs(left - right) > 1) balanced = false;

        return 1 + Math.max(left, right);
    }

    // ---- instrumented copy of check(), to count real nodes visited ----
    static int checkVisits = 0;
    static int countedCheck(TreeNode node) {
        if (node == null) return 0;
        checkVisits++;
        int left = countedCheck(node.left);
        if (left == -1) return -1;
        int right = countedCheck(node.right);
        if (right == -1) return -1;
        if (Math.abs(left - right) > 1) return -1;
        return 1 + Math.max(left, right);
    }

    // ---- independent oracle ----
    static boolean oracle(TreeNode root) {
        Map<TreeNode, Integer> h = new HashMap<>();
        List<TreeNode> order = new ArrayList<>();
        Deque<TreeNode> st = new ArrayDeque<>();
        if (root != null) st.push(root);
        while (!st.isEmpty()) {
            TreeNode n = st.pop();
            order.add(n);
            if (n.left != null) st.push(n.left);
            if (n.right != null) st.push(n.right);
        }
        for (int i = order.size() - 1; i >= 0; i--) {   // children before parents
            TreeNode n = order.get(i);
            int l = n.left == null ? 0 : h.get(n.left);
            int r = n.right == null ? 0 : h.get(n.right);
            h.put(n, 1 + Math.max(l, r));
        }
        for (TreeNode n : order) {
            int l = n.left == null ? 0 : h.get(n.left);
            int r = n.right == null ? 0 : h.get(n.right);
            if (Math.abs(l - r) > 1) return false;
        }
        return true;
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

    // Random shapes biased toward balance, so both answers show up often.
    static TreeNode randomTree(Random rnd, int depth) {
        if (depth == 0 || rnd.nextInt(6) == 0) return null;
        TreeNode n = new TreeNode(rnd.nextInt(100));
        n.left = randomTree(rnd, depth - 1);
        n.right = randomTree(rnd, depth - 1);
        return n;
    }

    static int failures = 0;

    static void check(String label, TreeNode root, boolean want) {
        boolean a = isBalanced(root), b = bruteIsBalanced(root), c = flagIsBalanced(root), d = oracle(root);
        boolean ok = a == want && b == want && c == want && d == want;
        if (!ok) failures++;
        System.out.println((ok ? "  ok   " : "  FAIL ") + label + "  -> " + a
            + (ok ? "" : " (brute " + b + ", flag " + c + ", oracle " + d + ") expected " + want));
    }

    static void claim(String label, boolean holds) {
        if (!holds) failures++;
        System.out.println((holds ? "  ok   " : "  FAIL ") + label);
    }

    public static void main(String[] args) {
        System.out.println("day 56 - Balanced Binary Tree");

        TreeNode lopsided = build(1, 2, 3, 4, 5, null, 6, 7);
        TreeNode brokenBelow = build(1, 2, 3, 4, null, 6, 7, 5, null, 8);

        check("worked example (lopsided, balanced)", lopsided,                               true);
        check("empty",                               build(),                                true);
        check("single node",                         build(1),                               true);
        check("two nodes",                           build(1, 2),                            true);
        check("three-node chain",                    build(1, 2, null, 3),                   false);
        check("LeetCode example 1",                  build(3, 9, 20, null, null, 15, 7),     true);
        check("LeetCode example 2",                  build(1, 2, 2, 3, 3, null, null, 4, 4), false);
        check("balanced at root, broken below",      brokenBelow,                            false);

        heightVisits = 0;
        bruteIsBalanced(lopsided);
        claim("brute force makes 11 height visits on the worked example (got " + heightVisits + ")", heightVisits == 11);

        claim("worked example: check(root) returns height 4", check(lopsided) == 4);

        checkVisits = 0;
        int r = countedCheck(brokenBelow);
        claim("sentinel version visits only 4 of 8 nodes on the broken-below tree (got " + checkVisits + ")",
              r == -1 && checkVisits == 4);

        TreeNode rootOnly = brokenBelow;
        claim("root-only comparison wrongly says balanced on that tree",
              Math.abs(height(rootOnly.left) - height(rootOnly.right)) <= 1);

        Random rnd = new Random(56);
        int agree = 0, trues = 0;
        for (int t = 0; t < 500; t++) {
            TreeNode root = randomTree(rnd, 1 + rnd.nextInt(7));
            boolean a = isBalanced(root), b = bruteIsBalanced(root), c = flagIsBalanced(root), d = oracle(root);
            if (a == b && a == c && a == d) { agree++; if (a) trues++; }
            else {
                failures++;
                System.out.println("  FAIL random -> " + a + " / " + b + " / " + c + " / oracle " + d);
            }
        }
        System.out.println("  ok   " + agree + "/500 random trees agree (" + trues + " balanced, " + (agree - trues) + " not)");

        System.out.println(failures == 0 ? "  day 56 PASSED" : "  day 56 had " + failures + " FAILURES");
    }
}
