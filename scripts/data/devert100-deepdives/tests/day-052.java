// Correctness assertions for day 52 - Maximum Depth of Binary Tree.
//
// The path-collecting brute force, the bottom-up recursion and the BFS level
// count are copied verbatim from day-052.md; the top-down variant from the
// optimization section is written out as described. All four must agree on
// the worked example, every edge case in the edge-cases section, and a few
// hundred random trees. The Minimum Depth trap claimed in the takeaway (naive
// 1 + min returns 1 on [1, null, 2]) is checked too.

import java.util.*;

class Day52Test {

    static class TreeNode {
        int val; TreeNode left; TreeNode right;
        TreeNode() {}
        TreeNode(int val) { this.val = val; }
        TreeNode(int val, TreeNode left, TreeNode right) { this.val = val; this.left = left; this.right = right; }
    }

    // ---- brute force from the bruteForce section ----
    static int bruteForce(TreeNode root) {
        List<List<Integer>> paths = new ArrayList<>();
        collect(root, new ArrayList<>(), paths);
        int best = 0;
        for (List<Integer> p : paths) {
            best = Math.max(best, p.size());
        }
        return best;
    }

    static void collect(TreeNode node, List<Integer> path, List<List<Integer>> paths) {
        if (node == null) return;
        path.add(node.val);
        if (node.left == null && node.right == null) {
            paths.add(new ArrayList<>(path));
        } else {
            collect(node.left, path, paths);
            collect(node.right, path, paths);
        }
        path.remove(path.size() - 1);
    }

    // ---- top-down variant (optimization, step 1) ----
    static int best;
    static int topDown(TreeNode root) { best = 0; visit(root, 1); return best; }
    static void visit(TreeNode node, int depth) {
        if (node == null) return;
        best = Math.max(best, depth);
        visit(node.left, depth + 1);
        visit(node.right, depth + 1);
    }

    // ---- bottom-up from the implementation section ----
    static int maxDepth(TreeNode root) {
        if (root == null) {
            return 0;
        }
        int left = maxDepth(root.left);
        int right = maxDepth(root.right);
        return 1 + Math.max(left, right);
    }

    // ---- BFS from the implementation section ----
    static int maxDepthBfs(TreeNode root) {
        if (root == null) return 0;
        Queue<TreeNode> queue = new ArrayDeque<>();
        queue.offer(root);
        int depth = 0;
        while (!queue.isEmpty()) {
            int levelSize = queue.size();
            for (int i = 0; i < levelSize; i++) {
                TreeNode node = queue.poll();
                if (node.left != null) queue.offer(node.left);
                if (node.right != null) queue.offer(node.right);
            }
            depth++;
        }
        return depth;
    }

    static int naiveMinDepth(TreeNode node) {
        if (node == null) return 0;
        return 1 + Math.min(naiveMinDepth(node.left), naiveMinDepth(node.right));
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

    static int failures = 0;

    static void check(String label, TreeNode root, int want) {
        int a = bruteForce(root), b = topDown(root), c = maxDepth(root), d = maxDepthBfs(root);
        boolean ok = a == want && b == want && c == want && d == want;
        if (!ok) failures++;
        System.out.println((ok ? "  ok   " : "  FAIL ") + label + " -> brute " + a + ", top-down " + b
            + ", bottom-up " + c + ", bfs " + d + (ok ? "" : "  expected " + want));
    }

    static TreeNode randomTree(Random rnd, int size) {
        if (size == 0) return null;
        int leftSize = rnd.nextInt(size);
        TreeNode n = new TreeNode(rnd.nextInt(201) - 100);
        n.left = randomTree(rnd, leftSize);
        n.right = randomTree(rnd, size - 1 - leftSize);
        return n;
    }

    public static void main(String[] args) {
        System.out.println("day 52 - Maximum Depth of Binary Tree");

        check("example [3,9,20,null,null,15,7]", build(3, 9, 20, null, null, 15, 7), 3);
        {
            List<List<Integer>> paths = new ArrayList<>();
            collect(build(3, 9, 20, null, null, 15, 7), new ArrayList<>(), paths);
            boolean ok = paths.equals(List.of(List.of(3, 9), List.of(3, 20, 15), List.of(3, 20, 7)));
            if (!ok) failures++;
            System.out.println((ok ? "  ok   " : "  FAIL ") + "dry run saved paths " + paths);
        }
        check("empty", null, 0);
        check("single node", build(1), 1);
        check("one child [1,null,2]", build(1, null, 2), 2);
        TreeNode chain = null;
        for (int v = 5; v >= 1; v--) chain = new TreeNode(v, chain, null);
        check("chain of 5", chain, 5);
        check("perfect tree", build(1, 2, 3, 4, 5, 6, 7), 3);
        check("deep left side", build(1, 2, 3, 4, null, null, null, 5), 4);

        {
            TreeNode deep = null;
            for (int v = 100000; v >= 1; v--) deep = new TreeNode(v, deep, null);
            int got = maxDepthBfs(deep);
            boolean ok = got == 100000;
            if (!ok) failures++;
            System.out.println((ok ? "  ok   " : "  FAIL ") + "100,000-node chain, bfs -> " + got);
        }

        {
            int got = naiveMinDepth(build(1, null, 2));
            boolean ok = got == 1;
            if (!ok) failures++;
            System.out.println((ok ? "  ok   " : "  FAIL ") + "naive 1 + min on [1,null,2] returns " + got + " (true min depth is 2)");
        }

        Random rnd = new Random(52);
        int agree = 0;
        for (int t = 0; t < 400; t++) {
            TreeNode root = randomTree(rnd, rnd.nextInt(40));
            int a = bruteForce(root);
            if (a == topDown(root) && a == maxDepth(root) && a == maxDepthBfs(root)) agree++;
            else { failures++; System.out.println("  FAIL random tree, brute " + a); }
        }
        System.out.println("  ok   " + agree + "/400 random trees: all four versions agree");

        System.out.println(failures == 0 ? "  day 52 PASSED" : "  day 52 had " + failures + " FAILURES");
    }
}
