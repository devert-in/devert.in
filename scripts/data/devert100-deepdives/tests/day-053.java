// Correctness assertions for day 53 - Invert Binary Tree.
//
// The level-reversal brute force, the recursive swap and the BFS swap are
// copied verbatim from day-053.md. All three are checked on the worked
// example, every edge case in the edge-cases section, and a few hundred random
// trees against a mirror-copy oracle. The in-place claim (same root returned,
// no new nodes), the double-inversion identity, and the overwrite-trap claim
// (returns [4, 7, 7, 9, 9, 9, 9], one 7 node on both sides) are checked directly.

import java.util.*;

class Day53Test {

    static class TreeNode {
        int val; TreeNode left; TreeNode right;
        TreeNode() {}
        TreeNode(int val) { this.val = val; }
        TreeNode(int val, TreeNode left, TreeNode right) { this.val = val; this.left = left; this.right = right; }
    }

    // ---- brute force from the bruteForce section ----
    static TreeNode bruteForce(TreeNode root) {
        if (root == null) return null;
        List<List<TreeNode>> levels = new ArrayList<>();
        List<TreeNode> level = new ArrayList<>();
        level.add(root);
        while (!level.isEmpty()) {
            levels.add(level);
            List<TreeNode> next = new ArrayList<>();
            boolean anyReal = false;
            for (TreeNode node : level) {
                if (node == null) continue;
                next.add(node.left);
                next.add(node.right);
                if (node.left != null || node.right != null) anyReal = true;
            }
            level = anyReal ? next : new ArrayList<>();
        }
        List<List<TreeNode>> built = new ArrayList<>();
        for (List<TreeNode> lv : levels) {
            List<TreeNode> copy = new ArrayList<>();
            for (int i = lv.size() - 1; i >= 0; i--) {
                TreeNode old = lv.get(i);
                copy.add(old == null ? null : new TreeNode(old.val));
            }
            built.add(copy);
        }
        for (int k = 0; k + 1 < built.size(); k++) {
            int slot = 0;
            for (TreeNode parent : built.get(k)) {
                if (parent == null) continue;
                parent.left = built.get(k + 1).get(slot++);
                parent.right = built.get(k + 1).get(slot++);
            }
        }
        return built.get(0).get(0);
    }

    // ---- recursive swap from the implementation section ----
    static TreeNode invertTree(TreeNode root) {
        if (root == null) {
            return null;
        }
        TreeNode left = invertTree(root.left);
        TreeNode right = invertTree(root.right);
        root.left = right;
        root.right = left;
        return root;
    }

    // ---- BFS swap from the implementation section ----
    static TreeNode invertBfs(TreeNode root) {
        if (root == null) return null;
        Queue<TreeNode> queue = new ArrayDeque<>();
        queue.offer(root);
        while (!queue.isEmpty()) {
            TreeNode node = queue.poll();
            TreeNode temp = node.left;
            node.left = node.right;
            node.right = temp;
            if (node.left != null) queue.offer(node.left);
            if (node.right != null) queue.offer(node.right);
        }
        return root;
    }

    // The overwrite trap.
    static TreeNode buggy(TreeNode root) {
        if (root == null) return null;
        root.left = buggy(root.right);
        root.right = buggy(root.left);
        return root;
    }

    // Oracle: obviously-correct mirrored copy.
    static TreeNode mirror(TreeNode n) {
        return n == null ? null : new TreeNode(n.val, mirror(n.right), mirror(n.left));
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

    // LeetCode level-order serialisation, trailing nulls trimmed.
    static String ser(TreeNode root) {
        List<String> out = new ArrayList<>();
        Deque<TreeNode> q = new ArrayDeque<>();
        List<TreeNode> cur = new ArrayList<>();
        cur.add(root);
        while (!cur.isEmpty()) {
            List<TreeNode> next = new ArrayList<>();
            for (TreeNode n : cur) {
                if (n == null) { out.add("null"); continue; }
                out.add(String.valueOf(n.val));
                next.add(n.left);
                next.add(n.right);
            }
            cur = next;
        }
        int end = out.size();
        while (end > 0 && out.get(end - 1).equals("null")) end--;
        return "[" + String.join(", ", out.subList(0, end)) + "]";
    }

    static String shape(TreeNode n) {
        return n == null ? "#" : "(" + n.val + " " + shape(n.left) + " " + shape(n.right) + ")";
    }

    static int failures = 0;

    static void check(String label, Integer[] in, String want) {
        String a = ser(bruteForce(build(in)));
        TreeNode r = build(in);
        TreeNode rb = invertTree(r);
        String b = ser(rb);
        TreeNode r2 = build(in);
        String c = ser(invertBfs(r2));
        boolean same = rb == r;
        boolean ok = a.equals(want) && b.equals(want) && c.equals(want) && same;
        if (!ok) failures++;
        System.out.println((ok ? "  ok   " : "  FAIL ") + label + "  " + ser(build(in)) + " -> brute " + a
            + ", recursive " + b + ", bfs " + c + (ok ? "" : "  expected " + want));
    }

    static TreeNode randomTree(Random rnd, int size) {
        if (size == 0) return null;
        int leftSize = rnd.nextInt(size);
        TreeNode n = new TreeNode(rnd.nextInt(201) - 100);
        n.left = randomTree(rnd, leftSize);
        n.right = randomTree(rnd, size - 1 - leftSize);
        return n;
    }

    static TreeNode copy(TreeNode n) { return n == null ? null : new TreeNode(n.val, copy(n.left), copy(n.right)); }

    static int count(TreeNode n) { return n == null ? 0 : 1 + count(n.left) + count(n.right); }

    public static void main(String[] args) {
        System.out.println("day 53 - Invert Binary Tree");

        check("example", new Integer[] { 4, 2, 7, 1, 3, 6, 9 }, "[4, 7, 2, 9, 6, 3, 1]");
        {
            boolean ok = bruteForce(null) == null && invertTree(null) == null && invertBfs(null) == null;
            if (!ok) failures++;
            System.out.println((ok ? "  ok   " : "  FAIL ") + "empty -> null (all three)");
        }
        check("single node", new Integer[] { 1 }, "[1]");
        check("LC example 2", new Integer[] { 2, 1, 3 }, "[2, 3, 1]");
        check("one-sided chain", new Integer[] { 1, 2, null, 3 }, "[1, null, 2, null, 3]");
        check("symmetric", new Integer[] { 1, 2, 2, 3, 4, 4, 3 }, "[1, 2, 2, 3, 4, 4, 3]");

        // Swapping only the root leaves level 3 as 6, 9, 1, 3.
        {
            TreeNode t = build(4, 2, 7, 1, 3, 6, 9);
            TreeNode tmp = t.left; t.left = t.right; t.right = tmp;
            boolean ok = ser(t).equals("[4, 7, 2, 6, 9, 1, 3]");
            if (!ok) failures++;
            System.out.println((ok ? "  ok   " : "  FAIL ") + "root-only swap gives " + ser(t));
        }

        // The overwrite trap.
        {
            TreeNode t = build(4, 2, 7, 1, 3, 6, 9);
            TreeNode r = buggy(t);
            boolean ok = r.left == r.right && r.left.val == 7
                && r.left.left == r.left.right && r.left.left.val == 9
                && ser(r).equals("[4, 7, 7, 9, 9, 9, 9]");
            if (!ok) failures++;
            System.out.println((ok ? "  ok   " : "  FAIL ") + "overwrite trap: same 7 on both sides, same 9 under it, 2/1/3/6 lost -> " + ser(r));
        }

        // In place: no new nodes, same root object.
        {
            TreeNode t = build(4, 2, 7, 1, 3, 6, 9);
            TreeNode seven = t.right;
            TreeNode r = invertTree(t);
            boolean ok = r == t && r.left == seven && count(r) == 7;
            if (!ok) failures++;
            System.out.println((ok ? "  ok   " : "  FAIL ") + "in place: same root returned, same node objects rewired");
        }

        // Inverting twice restores the tree.
        {
            TreeNode t = build(4, 2, 7, 1, 3, 6, 9);
            String before = shape(t);
            boolean ok = shape(invertTree(invertTree(t))).equals(before)
                && shape(invertBfs(invertBfs(t))).equals(before);
            if (!ok) failures++;
            System.out.println((ok ? "  ok   " : "  FAIL ") + "invert(invert(t)) == t");
        }

        // 100,000-node chain, BFS.
        {
            TreeNode deep = null;
            for (int v = 100000; v >= 1; v--) deep = new TreeNode(v, deep, null);
            TreeNode r = invertBfs(deep);
            int len = 0;
            boolean allRight = true;
            for (TreeNode n = r; n != null; n = n.right) { len++; if (n.left != null) allRight = false; }
            boolean ok = len == 100000 && allRight;
            if (!ok) failures++;
            System.out.println((ok ? "  ok   " : "  FAIL ") + "100,000-node left chain becomes a right chain (bfs)");
        }

        Random rnd = new Random(53);
        int agree = 0;
        for (int t = 0; t < 400; t++) {
            TreeNode root = randomTree(rnd, rnd.nextInt(40));
            String want = shape(mirror(root));
            String a = shape(bruteForce(root));
            String b = shape(invertTree(copy(root)));
            String c = shape(invertBfs(copy(root)));
            if (a.equals(want) && b.equals(want) && c.equals(want)) agree++;
            else { failures++; System.out.println("  FAIL random " + want); }
        }
        System.out.println("  ok   " + agree + "/400 random trees: brute, recursive and bfs match the mirror oracle");

        System.out.println(failures == 0 ? "  day 53 PASSED" : "  day 53 had " + failures + " FAILURES");
    }
}
