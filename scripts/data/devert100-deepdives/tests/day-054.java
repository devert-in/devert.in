// Correctness assertions for day 54 - Binary Tree Level Order Traversal.
//
// All three published solutions (re-descend brute force, BFS with a size
// snapshot, DFS carrying depth) are copied verbatim from day-054.md and must
// agree on the worked example, every edge case in the edge-cases section, and
// a few hundred random trees. The buggy live-bound loop from the optimization
// section is also run, to prove the wrong output the writeup shows for it.

import java.util.*;

class Day54Test {

    static class TreeNode {
        int val; TreeNode left; TreeNode right;
        TreeNode() {}
        TreeNode(int val) { this.val = val; }
        TreeNode(int val, TreeNode left, TreeNode right) { this.val = val; this.left = left; this.right = right; }
    }

    // ---- BFS version from the implementation section ----
    static List<List<Integer>> levelOrder(TreeNode root) {

        List<List<Integer>> result = new ArrayList<>();
        if (root == null) return result;

        Queue<TreeNode> queue = new ArrayDeque<>();
        queue.offer(root);

        while (!queue.isEmpty()) {

            int size = queue.size();    // freeze this level's node count
            List<Integer> level = new ArrayList<>(size);

            for (int i = 0; i < size; i++) {
                TreeNode node = queue.poll();
                level.add(node.val);

                if (node.left != null) queue.offer(node.left);
                if (node.right != null) queue.offer(node.right);
            }

            result.add(level);
        }

        return result;
    }

    // ---- brute force from the bruteForce section ----
    static List<List<Integer>> bruteLevelOrder(TreeNode root) {

        List<List<Integer>> result = new ArrayList<>();
        int h = height(root);

        for (int d = 0; d < h; d++) {
            List<Integer> level = new ArrayList<>();
            collect(root, d, level);
            result.add(level);
        }

        return result;
    }

    static int height(TreeNode node) {
        if (node == null) return 0;
        return 1 + Math.max(height(node.left), height(node.right));
    }

    static void collect(TreeNode node, int depth, List<Integer> level) {
        if (node == null) return;
        if (depth == 0) {
            level.add(node.val);
            return;
        }
        collect(node.left, depth - 1, level);
        collect(node.right, depth - 1, level);
    }

    // ---- DFS follow-up version ----
    static List<List<Integer>> dfsLevelOrder(TreeNode root) {
        List<List<Integer>> result = new ArrayList<>();
        dfs(root, 0, result);
        return result;
    }

    static void dfs(TreeNode node, int depth, List<List<Integer>> result) {
        if (node == null) return;
        if (depth == result.size()) result.add(new ArrayList<>());   // first visit to this depth
        result.get(depth).add(node.val);
        dfs(node.left, depth + 1, result);
        dfs(node.right, depth + 1, result);
    }

    // ---- the buggy live-bound loop the writeup warns about ----
    static List<List<Integer>> buggy(TreeNode root) {
        List<List<Integer>> result = new ArrayList<>();
        if (root == null) return result;
        Queue<TreeNode> queue = new ArrayDeque<>();
        queue.offer(root);
        while (!queue.isEmpty()) {
            List<Integer> level = new ArrayList<>();
            for (int i = 0; i < queue.size(); i++) {
                TreeNode node = queue.poll();
                level.add(node.val);
                if (node.left != null) queue.offer(node.left);
                if (node.right != null) queue.offer(node.right);
            }
            result.add(level);
        }
        return result;
    }

    // LeetCode-style level-order deserialisation.
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

    static void check(String label, TreeNode root, String want) {
        String a = levelOrder(root).toString();
        String b = bruteLevelOrder(root).toString();
        String c = dfsLevelOrder(root).toString();
        boolean ok = a.equals(want) && b.equals(want) && c.equals(want);
        if (!ok) failures++;
        System.out.println((ok ? "  ok   " : "  FAIL ") + label + "  -> bfs " + a
            + (ok ? "" : ", brute " + b + ", dfs " + c + "  expected " + want));
    }

    public static void main(String[] args) {
        System.out.println("day 54 - Binary Tree Level Order Traversal");

        check("example",        build(3, 9, 20, null, null, 15, 7),  "[[3], [9, 20], [15, 7]]");
        check("empty",          build(),                             "[]");
        check("single",         build(1),                            "[[1]]");
        check("left-skewed",    build(1, 2, null, 3),                "[[1], [2], [3]]");
        check("right-skewed",   build(1, null, 2, null, 3),          "[[1], [2], [3]]");
        check("gaps",           build(1, 2, 3, 4, null, null, 5),    "[[1], [2, 3], [4, 5]]");
        check("perfect",        build(1, 2, 3, 4, 5, 6, 7),          "[[1], [2, 3], [4, 5, 6, 7]]");
        check("neg/dup",        build(0, -1, -1),                    "[[0], [-1, -1]]");
        check("preorder trap",  build(1, 2, 3, 4),                   "[[1], [2, 3], [4]]");

        String bug = buggy(build(3, 9, 20, null, null, 15, 7)).toString();
        boolean bugOk = bug.equals("[[3, 9], [20, 15], [7]]");
        if (!bugOk) failures++;
        System.out.println((bugOk ? "  ok   " : "  FAIL ") + "live-bound loop gives the wrong grouping shown: " + bug);

        Random rnd = new Random(54);
        int agree = 0;
        for (int t = 0; t < 400; t++) {
            TreeNode root = randomTree(rnd, rnd.nextInt(40));
            String a = levelOrder(root).toString();
            String b = bruteLevelOrder(root).toString();
            String c = dfsLevelOrder(root).toString();
            if (a.equals(b) && a.equals(c)) agree++;
            else {
                failures++;
                System.out.println("  FAIL random -> " + a + " / " + b + " / " + c);
            }
        }
        System.out.println("  ok   " + agree + "/400 random trees, bfs == brute == dfs");

        System.out.println(failures == 0 ? "  day 54 PASSED" : "  day 54 had " + failures + " FAILURES");
    }
}
