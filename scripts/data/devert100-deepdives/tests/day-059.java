// Correctness assertions for day 59 - Lowest Common Ancestor of a Binary Tree.
//
// The three published solutions (paths brute force, recursive postorder,
// iterative parent map) are copied verbatim from day-059.md. They must agree
// with each other and with a depth-climbing oracle on the worked examples,
// every edge case in the writeup, and a few hundred random trees.

import java.util.*;

class Day59Test {

    static class TreeNode {
        int val; TreeNode left; TreeNode right;
        TreeNode() {}
        TreeNode(int val) { this.val = val; }
        TreeNode(int val, TreeNode left, TreeNode right) { this.val = val; this.left = left; this.right = right; }
    }

    // ---- brute force: two root-to-node paths ----
    static TreeNode lcaPaths(TreeNode root, TreeNode p, TreeNode q) {
        List<TreeNode> pathP = new ArrayList<>();
        List<TreeNode> pathQ = new ArrayList<>();
        findPath(root, p, pathP);
        findPath(root, q, pathQ);
        TreeNode lca = null;
        for (int i = 0; i < pathP.size() && i < pathQ.size(); i++) {
            if (pathP.get(i) != pathQ.get(i)) {
                break;
            }
            lca = pathP.get(i);
        }
        return lca;
    }

    static boolean findPath(TreeNode node, TreeNode target, List<TreeNode> path) {
        if (node == null) {
            return false;
        }
        path.add(node);
        if (node == target) {
            return true;
        }
        if (findPath(node.left, target, path) || findPath(node.right, target, path)) {
            return true;
        }
        path.remove(path.size() - 1);
        return false;
    }

    // ---- optimal: postorder with a return value ----
    static TreeNode lowestCommonAncestor(TreeNode root, TreeNode p, TreeNode q) {
        if (root == null || root == p || root == q) {
            return root;
        }
        TreeNode left = lowestCommonAncestor(root.left, p, q);
        TreeNode right = lowestCommonAncestor(root.right, p, q);
        if (left != null && right != null) {
            return root;
        }
        return left != null ? left : right;
    }

    // ---- iterative parent-map version ----
    static TreeNode lcaIterative(TreeNode root, TreeNode p, TreeNode q) {
        Map<TreeNode, TreeNode> parent = new HashMap<>();
        Deque<TreeNode> stack = new ArrayDeque<>();
        parent.put(root, null);
        stack.push(root);
        while (!parent.containsKey(p) || !parent.containsKey(q)) {
            TreeNode node = stack.pop();
            if (node.left != null) {
                parent.put(node.left, node);
                stack.push(node.left);
            }
            if (node.right != null) {
                parent.put(node.right, node);
                stack.push(node.right);
            }
        }
        Set<TreeNode> ancestors = new HashSet<>();
        for (TreeNode a = p; a != null; a = parent.get(a)) {
            ancestors.add(a);
        }
        TreeNode b = q;
        while (!ancestors.contains(b)) {
            b = parent.get(b);
        }
        return b;
    }

    // ---- oracle: equalise depths, then climb together ----
    static TreeNode oracle(TreeNode root, TreeNode p, TreeNode q) {
        Map<TreeNode, TreeNode> par = new HashMap<>();
        Map<TreeNode, Integer> depth = new HashMap<>();
        Deque<TreeNode> st = new ArrayDeque<>();
        par.put(root, null); depth.put(root, 0); st.push(root);
        while (!st.isEmpty()) {
            TreeNode n = st.pop();
            for (TreeNode c : new TreeNode[] { n.left, n.right }) {
                if (c != null) { par.put(c, n); depth.put(c, depth.get(n) + 1); st.push(c); }
            }
        }
        TreeNode a = p, b = q;
        while (depth.get(a) > depth.get(b)) a = par.get(a);
        while (depth.get(b) > depth.get(a)) b = par.get(b);
        while (a != b) { a = par.get(a); b = par.get(b); }
        return a;
    }

    // LeetCode level-order format, null = missing child.
    static TreeNode build(Integer[] lv) {
        if (lv.length == 0 || lv[0] == null) return null;
        TreeNode root = new TreeNode(lv[0]);
        Deque<TreeNode> qu = new ArrayDeque<>();
        qu.add(root);
        int i = 1;
        while (!qu.isEmpty() && i < lv.length) {
            TreeNode n = qu.poll();
            if (i < lv.length && lv[i] != null) { n.left = new TreeNode(lv[i]); qu.add(n.left); }
            i++;
            if (i < lv.length && lv[i] != null) { n.right = new TreeNode(lv[i]); qu.add(n.right); }
            i++;
        }
        return root;
    }

    static TreeNode find(TreeNode r, int v) {
        if (r == null) return null;
        if (r.val == v) return r;
        TreeNode l = find(r.left, v);
        return l != null ? l : find(r.right, v);
    }

    static int failures = 0;

    static void check(String label, TreeNode root, int pv, int qv, int want) {
        TreeNode p = find(root, pv), q = find(root, qv);
        int a = lcaPaths(root, p, q).val;
        int b = lowestCommonAncestor(root, p, q).val;
        int c = lcaIterative(root, p, q).val;
        boolean ok = a == want && b == want && c == want;
        if (!ok) failures++;
        System.out.println((ok ? "  ok   " : "  FAIL ") + label + "  p=" + pv + " q=" + qv
            + " -> paths " + a + ", recursive " + b + ", iterative " + c
            + (ok ? "" : "  expected " + want));
    }

    public static void main(String[] args) {
        System.out.println("day 59 - Lowest Common Ancestor of a Binary Tree");

        Integer[] lv = { 3, 5, 1, 6, 2, 0, 8, null, null, 7, 4 };
        TreeNode t = build(lv);

        check("example 5,1",               t, 5, 1, 3);
        check("example 5,4 (ancestor)",    t, 5, 4, 5);
        check("dry-run example 6,4",       t, 6, 4, 5);
        check("example 7,8",               t, 7, 8, 3);
        check("root is a target 3,8",      t, 3, 8, 3);
        check("siblings 7,4",              t, 7, 4, 2);
        check("two-node 1,2",              build(new Integer[] { 1, 2 }), 1, 2, 1);
        check("two-node 2,1",              build(new Integer[] { 1, 2 }), 2, 1, 1);

        TreeNode chain = new TreeNode(1);
        TreeNode cur = chain;
        for (int v = 2; v <= 5; v++) { cur.right = new TreeNode(v); cur = cur.right; }
        check("skewed chain 3,5",          chain, 3, 5, 3);

        // The brute-force path dry run claims pathP = [3,5,6], pathQ = [3,5,2,4].
        List<TreeNode> pp = new ArrayList<>(), pq = new ArrayList<>();
        findPath(t, find(t, 6), pp);
        findPath(t, find(t, 4), pq);
        StringBuilder sp = new StringBuilder(), sq = new StringBuilder();
        for (TreeNode n : pp) sp.append(n.val).append(' ');
        for (TreeNode n : pq) sq.append(n.val).append(' ');
        boolean pathsOk = sp.toString().equals("3 5 6 ") && sq.toString().equals("3 5 2 4 ");
        if (!pathsOk) failures++;
        System.out.println((pathsOk ? "  ok   " : "  FAIL ") + "dry-run paths  [" + sp.toString().trim() + "] / [" + sq.toString().trim() + "]");

        // Deep chain: iterative version must handle n = 10^5 without recursion.
        TreeNode deep = new TreeNode(0);
        cur = deep;
        TreeNode mid = null;
        for (int v = 1; v < 100000; v++) { cur.right = new TreeNode(v); cur = cur.right; if (v == 50000) mid = cur; }
        boolean deepOk = lcaIterative(deep, mid, cur) == mid;
        if (!deepOk) failures++;
        System.out.println((deepOk ? "  ok   " : "  FAIL ") + "iterative on a 100000-node chain");

        // Random trees: attach node i under a random existing node's free slot.
        Random rnd = new Random(59);
        int agree = 0, total = 0;
        for (int trial = 0; trial < 400; trial++) {
            int n = 2 + rnd.nextInt(40);
            List<TreeNode> nodes = new ArrayList<>();
            TreeNode root = new TreeNode(0);
            nodes.add(root);
            for (int v = 1; v < n; v++) {
                TreeNode node = new TreeNode(v);
                while (true) {
                    TreeNode host = nodes.get(rnd.nextInt(nodes.size()));
                    if (rnd.nextBoolean()) { if (host.left == null) { host.left = node; break; } }
                    else { if (host.right == null) { host.right = node; break; } }
                }
                nodes.add(node);
            }
            TreeNode p = nodes.get(rnd.nextInt(n)), q;
            do { q = nodes.get(rnd.nextInt(n)); } while (q == p);
            TreeNode want = oracle(root, p, q);
            total++;
            if (lcaPaths(root, p, q) == want && lowestCommonAncestor(root, p, q) == want
                    && lcaIterative(root, p, q) == want) agree++;
            else {
                failures++;
                System.out.println("  FAIL random trial " + trial + " p=" + p.val + " q=" + q.val);
            }
        }
        System.out.println("  ok   " + agree + "/" + total + " random trees, all three agree with the oracle");

        System.out.println(failures == 0 ? "  day 59 PASSED" : "  day 59 had " + failures + " FAILURES");
    }
}
