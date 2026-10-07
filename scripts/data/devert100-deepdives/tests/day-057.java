// Correctness assertions for day 57 - Validate Binary Search Tree.
//
// The subtree-max/min brute force, the long-bounds solution and the iterative
// inorder variant are copied verbatim from day-057.md. All three must match
// the worked examples, every edge case (including the Integer.MIN/MAX ones),
// and an independent oracle - collect values in inorder, check strictly
// increasing - on random trees, a share of which are real BSTs. The two traps
// the writeup names (parent-child only, int sentinels) are run to prove they
// fail on the inputs it says they fail on.

import java.util.*;

class Day57Test {

    static class TreeNode {
        int val; TreeNode left; TreeNode right;
        TreeNode() {}
        TreeNode(int val) { this.val = val; }
        TreeNode(int val, TreeNode left, TreeNode right) { this.val = val; this.left = left; this.right = right; }
    }

    // ---- optimal, from the implementation section ----
    static boolean isValidBST(TreeNode root) {
        return valid(root, Long.MIN_VALUE, Long.MAX_VALUE);
    }

    static boolean valid(TreeNode node, long low, long high) {
        if (node == null) return true;

        if (node.val <= low || node.val >= high) return false;

        return valid(node.left, low, node.val)      // going left: node.val is the new ceiling
            && valid(node.right, node.val, high);   // going right: node.val is the new floor
    }

    // ---- brute force, from the bruteForce section ----
    static int scanVisits = 0;

    static boolean bruteIsValidBST(TreeNode root) {

        if (root == null) return true;

        if (root.left != null && maxOf(root.left) >= root.val) return false;
        if (root.right != null && minOf(root.right) <= root.val) return false;

        return bruteIsValidBST(root.left) && bruteIsValidBST(root.right);
    }

    static int maxOf(TreeNode node) {
        if (node == null) return Integer.MIN_VALUE;
        scanVisits++;   // instrumentation only
        return Math.max(node.val, Math.max(maxOf(node.left), maxOf(node.right)));
    }

    static int minOf(TreeNode node) {
        if (node == null) return Integer.MAX_VALUE;
        scanVisits++;   // instrumentation only
        return Math.min(node.val, Math.min(minOf(node.left), minOf(node.right)));
    }

    // ---- inorder variant ----
    static boolean inorderIsValidBST(TreeNode root) {

        Deque<TreeNode> stack = new ArrayDeque<>();
        TreeNode cur = root;
        Integer prev = null;                       // null = nothing visited yet

        while (cur != null || !stack.isEmpty()) {
            while (cur != null) {                  // slide to the leftmost unvisited node
                stack.push(cur);
                cur = cur.left;
            }
            cur = stack.pop();

            if (prev != null && cur.val <= prev) return false;
            prev = cur.val;

            cur = cur.right;
        }

        return true;
    }

    // ---- traps ----
    static boolean parentChildOnly(TreeNode node) {
        if (node == null) return true;
        if (node.left != null && node.left.val >= node.val) return false;
        if (node.right != null && node.right.val <= node.val) return false;
        return parentChildOnly(node.left) && parentChildOnly(node.right);
    }

    static boolean intBounds(TreeNode node, int low, int high) {
        if (node == null) return true;
        if (node.val <= low || node.val >= high) return false;
        return intBounds(node.left, low, node.val) && intBounds(node.right, node.val, high);
    }

    // ---- oracle ----
    static boolean oracle(TreeNode root) {
        List<Integer> vals = new ArrayList<>();
        collect(root, vals);
        for (int i = 1; i < vals.size(); i++) if (vals.get(i) <= vals.get(i - 1)) return false;
        return true;
    }

    static void collect(TreeNode n, List<Integer> out) {
        if (n == null) return;
        collect(n.left, out); out.add(n.val); collect(n.right, out);
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

    // Insert random values BST-style, then optionally corrupt one node, so
    // both valid and subtly invalid trees are common.
    static TreeNode randomTree(Random rnd, int n) {
        TreeNode root = null;
        List<TreeNode> all = new ArrayList<>();
        for (int k = 0; k < n; k++) {
            int v = rnd.nextInt(60) - 30;
            TreeNode fresh = new TreeNode(v);
            if (root == null) { root = fresh; all.add(fresh); continue; }
            TreeNode cur = root;
            boolean placed = false;
            while (!placed) {
                if (v == cur.val) break;                     // skip duplicates
                if (v < cur.val) { if (cur.left == null) { cur.left = fresh; placed = true; } else cur = cur.left; }
                else            { if (cur.right == null) { cur.right = fresh; placed = true; } else cur = cur.right; }
            }
            if (placed) all.add(fresh);
        }
        if (!all.isEmpty() && rnd.nextBoolean()) {
            TreeNode victim = all.get(rnd.nextInt(all.size()));
            int choice = rnd.nextInt(3);
            if (choice == 0) victim.val += rnd.nextInt(21) - 10;
            else if (choice == 1) victim.val = rnd.nextBoolean() ? Integer.MIN_VALUE : Integer.MAX_VALUE;
            else victim.val = all.get(rnd.nextInt(all.size())).val;   // possible duplicate
        }
        return root;
    }

    static int failures = 0;

    static void check(String label, TreeNode root, boolean want) {
        boolean a = isValidBST(root), b = bruteIsValidBST(root), c = inorderIsValidBST(root), d = oracle(root);
        boolean ok = a == want && b == want && c == want && d == want;
        if (!ok) failures++;
        System.out.println((ok ? "  ok   " : "  FAIL ") + label + "  -> " + a
            + (ok ? "" : " (brute " + b + ", inorder " + c + ", oracle " + d + ") expected " + want));
    }

    static void claim(String label, boolean holds) {
        if (!holds) failures++;
        System.out.println((holds ? "  ok   " : "  FAIL ") + label);
    }

    public static void main(String[] args) {
        System.out.println("day 57 - Validate Binary Search Tree");

        TreeNode worked = build(8, 4, 12, 2, 6, 10, 14);
        TreeNode trap = build(5, 4, 6, null, null, 3, 7);

        check("worked example",              worked,                                    true);
        check("single node",                 build(1),                                  true);
        check("simple valid",                build(2, 1, 3),                            true);
        check("LeetCode invalid example",    build(5, 1, 4, null, null, 3, 6),          false);
        check("grandparent violation",       trap,                                      false);
        check("duplicate left",              build(1, 1),                               false);
        check("duplicate right",             build(1, null, 1),                         false);
        check("all equal",                   build(2, 2, 2),                            false);
        check("MAX_VALUE alone",             build(Integer.MAX_VALUE),                  true);
        check("MIN_VALUE alone",             build(Integer.MIN_VALUE),                  true);
        check("MIN root, MAX right",         build(Integer.MIN_VALUE, null, Integer.MAX_VALUE), true);
        check("valid right chain",           build(1, null, 2, null, 3, null, 4),       true);
        check("empty",                       build(),                                   true);

        scanVisits = 0;
        bruteIsValidBST(worked);
        claim("brute force makes 10 scan visits on the worked example (got " + scanVisits + ")", scanVisits == 10);

        claim("parent-child-only check wrongly accepts the grandparent trap", parentChildOnly(trap));
        claim("int sentinels wrongly reject [2147483647]",
              !intBounds(build(Integer.MAX_VALUE), Integer.MIN_VALUE, Integer.MAX_VALUE));
        claim("int sentinels wrongly reject [-2147483648]",
              !intBounds(build(Integer.MIN_VALUE), Integer.MIN_VALUE, Integer.MAX_VALUE));

        List<Integer> seq = new ArrayList<>();
        collect(trap, seq);
        claim("inorder of the trap tree is [4, 5, 3, 6, 7] (got " + seq + ")", seq.equals(List.of(4, 5, 3, 6, 7)));

        Random rnd = new Random(57);
        int agree = 0, valids = 0;
        for (int t = 0; t < 600; t++) {
            TreeNode root = randomTree(rnd, 1 + rnd.nextInt(30));
            boolean a = isValidBST(root), b = bruteIsValidBST(root), c = inorderIsValidBST(root), d = oracle(root);
            if (a == b && a == c && a == d) { agree++; if (a) valids++; }
            else {
                failures++;
                System.out.println("  FAIL random -> " + a + " / " + b + " / " + c + " / oracle " + d);
            }
        }
        System.out.println("  ok   " + agree + "/600 random trees agree (" + valids + " valid, " + (agree - valids) + " invalid)");

        System.out.println(failures == 0 ? "  day 57 PASSED" : "  day 57 had " + failures + " FAILURES");
    }
}
