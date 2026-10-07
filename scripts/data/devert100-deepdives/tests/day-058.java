// Correctness assertions for day 58 - Kth Smallest Element in a BST.
//
// The collect-and-sort brute force, the iterative early-exit inorder solution
// and the subtree-size follow-up (OrderStatisticBST) are copied verbatim from
// day-058.md. All must match the worked example and every edge case, and on
// random BSTs they must agree with each other for EVERY k from 1 to n. The
// work claim (4 pushes, 3 pops for k = 3 on the example) and the "cur = null"
// mistake from the takeaway are checked with instrumented copies.

import java.util.*;

class Day58Test {

    static class TreeNode {
        int val; TreeNode left; TreeNode right;
        TreeNode() {}
        TreeNode(int val) { this.val = val; }
        TreeNode(int val, TreeNode left, TreeNode right) { this.val = val; this.left = left; this.right = right; }
    }

    // ---- optimal, from the implementation section ----
    static int kthSmallest(TreeNode root, int k) {

        Deque<TreeNode> stack = new ArrayDeque<>();
        TreeNode cur = root;

        while (true) {
            while (cur != null) {          // slide to the smallest unvisited node
                stack.push(cur);
                cur = cur.left;
            }

            cur = stack.pop();             // next value in sorted order
            k--;
            if (k == 0) return cur.val;    // the k-th pop is the answer

            cur = cur.right;               // the values just above it live here
        }
    }

    // ---- brute force, from the bruteForce section ----
    static int bruteKthSmallest(TreeNode root, int k) {

        List<Integer> values = new ArrayList<>();
        collect(root, values);

        Collections.sort(values);

        return values.get(k - 1);
    }

    static void collect(TreeNode node, List<Integer> values) {
        if (node == null) return;
        values.add(node.val);
        collect(node.left, values);
        collect(node.right, values);
    }

    // ---- follow-up, from the implementation section ----
    static class OrderStatisticBST {

        private static class SizedNode {
            int val;
            int size = 1;                 // nodes in this subtree, including itself
            SizedNode left, right;
            SizedNode(int val) { this.val = val; }
        }

        private SizedNode root;

        public void insert(int val) {
            root = insert(root, val);
        }

        private SizedNode insert(SizedNode node, int val) {
            if (node == null) return new SizedNode(val);
            if (val < node.val) node.left = insert(node.left, val);
            else node.right = insert(node.right, val);
            node.size++;                  // one more node somewhere below
            return node;
        }

        private static int size(SizedNode node) {
            return node == null ? 0 : node.size;
        }

        public int kthSmallest(int k) {
            SizedNode node = root;
            while (true) {
                int leftSize = size(node.left);
                if (k <= leftSize) {
                    node = node.left;
                } else if (k == leftSize + 1) {
                    return node.val;
                } else {
                    k -= leftSize + 1;    // skip the left subtree and this node
                    node = node.right;
                }
            }
        }
    }

    // ---- instrumented copy: counts pushes and pops ----
    static int pushes, pops;
    static int countedKth(TreeNode root, int k) {
        Deque<TreeNode> stack = new ArrayDeque<>();
        TreeNode cur = root;
        while (true) {
            while (cur != null) { stack.push(cur); pushes++; cur = cur.left; }
            cur = stack.pop(); pops++;
            k--;
            if (k == 0) return cur.val;
            cur = cur.right;
        }
    }

    // ---- the takeaway's mistake: cur = null instead of cur = cur.right ----
    static int noRightMove(TreeNode root, int k) {
        Deque<TreeNode> stack = new ArrayDeque<>();
        TreeNode cur = root;
        while (!stack.isEmpty() || cur != null) {
            while (cur != null) { stack.push(cur); cur = cur.left; }
            cur = stack.pop();
            k--;
            if (k == 0) return cur.val;
            cur = null;
        }
        return Integer.MIN_VALUE;
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

    static TreeNode bstInsert(TreeNode node, int v) {
        if (node == null) return new TreeNode(v);
        if (v < node.val) node.left = bstInsert(node.left, v);
        else node.right = bstInsert(node.right, v);
        return node;
    }

    static int failures = 0;

    static void check(String label, TreeNode root, int k, int want) {
        int a = kthSmallest(root, k), b = bruteKthSmallest(root, k);
        boolean ok = a == want && b == want;
        if (!ok) failures++;
        System.out.println((ok ? "  ok   " : "  FAIL ") + label + "  k=" + k + " -> " + a
            + (ok ? "" : " (brute " + b + ") expected " + want));
    }

    static void claim(String label, boolean holds) {
        if (!holds) failures++;
        System.out.println((holds ? "  ok   " : "  FAIL ") + label);
    }

    public static void main(String[] args) {
        System.out.println("day 58 - Kth Smallest Element in a BST");

        Integer[] ex = { 5, 3, 6, 2, 4, null, null, 1 };

        check("worked example",     build(ex),                         3, 3);
        check("k = 1, minimum",     build(3, 1, 4, null, 2),           1, 1);
        check("k = n, maximum",     build(ex),                         6, 6);
        check("single node",        build(1),                          1, 1);
        check("right-skewed",       build(1, null, 2, null, 3),        3, 3);
        check("left-skewed",        build(3, 2, null, 1),              1, 1);
        check("negative values",    build(0, -5, 5),                   2, 0);
        check("middle, via right",  build(ex),                         4, 4);

        pushes = 0; pops = 0;
        int r = countedKth(build(ex), 3);
        claim("k = 3 on the example: 4 pushes, 3 pops (got " + pushes + ", " + pops + ")",
              r == 3 && pushes == 4 && pops == 3);
        claim("cur = null mistake returns 5 for k = 4 on the example", noRightMove(build(ex), 4) == 5);

        OrderStatisticBST os = new OrderStatisticBST();
        for (int v : new int[] { 5, 3, 6, 2, 4, 1 }) os.insert(v);
        boolean osOk = true;
        for (int k = 1; k <= 6; k++) if (os.kthSmallest(k) != k) osOk = false;
        claim("subtree-size tree returns 1..6 for k = 1..6 on the example values", osOk);

        Random rnd = new Random(58);
        int agree = 0, queries = 0;
        for (int t = 0; t < 300; t++) {
            int n = 1 + rnd.nextInt(30);
            Set<Integer> used = new LinkedHashSet<>();
            while (used.size() < n) used.add(rnd.nextInt(200) - 100);
            TreeNode root = null;
            OrderStatisticBST tree = new OrderStatisticBST();
            for (int v : used) { root = bstInsert(root, v); tree.insert(v); }
            boolean all = true;
            for (int k = 1; k <= n; k++) {
                queries++;
                int a = kthSmallest(root, k), b = bruteKthSmallest(root, k), c = tree.kthSmallest(k);
                if (a != b || a != c) {
                    all = false;
                    System.out.println("  FAIL random k=" + k + " -> " + a + " / " + b + " / " + c);
                }
            }
            if (all) agree++; else failures++;
        }
        System.out.println("  ok   " + agree + "/300 random BSTs, all " + queries + " (tree, k) queries agree across 3 versions");

        System.out.println(failures == 0 ? "  day 58 PASSED" : "  day 58 had " + failures + " FAILURES");
    }
}
