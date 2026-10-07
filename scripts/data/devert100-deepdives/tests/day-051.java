// Correctness assertions for day 51 - Binary Tree Inorder / Preorder /
// Postorder Traversal (LC 94, 144, 145).
//
// Every published version is copied verbatim from day-051.md: the three
// recursive traversals, the three iterative ones, the one-stack postorder and
// Morris inorder. They are checked on the sample tree, every edge case in the
// edge-cases section, and a few hundred random trees (recursive is the
// oracle). Morris must also leave the tree exactly as it found it, and the
// iterative versions must survive a 100,000-node chain.

import java.util.*;

class Day51Test {

    static class TreeNode {
        int val; TreeNode left; TreeNode right;
        TreeNode() {}
        TreeNode(int val) { this.val = val; }
        TreeNode(int val, TreeNode left, TreeNode right) { this.val = val; this.left = left; this.right = right; }
    }

    // ---- recursive, from the bruteForce section ----
    static List<Integer> recInorder(TreeNode root) { List<Integer> r = new ArrayList<>(); inorder(root, r); return r; }
    static void inorder(TreeNode node, List<Integer> result) {
        if (node == null) return;
        inorder(node.left, result);
        result.add(node.val);
        inorder(node.right, result);
    }
    static List<Integer> recPreorder(TreeNode root) { List<Integer> r = new ArrayList<>(); preorder(root, r); return r; }
    static void preorder(TreeNode node, List<Integer> result) {
        if (node == null) return;
        result.add(node.val);
        preorder(node.left, result);
        preorder(node.right, result);
    }
    static List<Integer> recPostorder(TreeNode root) { List<Integer> r = new ArrayList<>(); postorder(root, r); return r; }
    static void postorder(TreeNode node, List<Integer> result) {
        if (node == null) return;
        postorder(node.left, result);
        postorder(node.right, result);
        result.add(node.val);
    }

    // ---- iterative, from the implementation section ----
    static List<Integer> inorderTraversal(TreeNode root) {
        List<Integer> result = new ArrayList<>();
        Deque<TreeNode> stack = new ArrayDeque<>();
        TreeNode curr = root;
        while (curr != null || !stack.isEmpty()) {
            while (curr != null) {
                stack.push(curr);
                curr = curr.left;
            }
            curr = stack.pop();
            result.add(curr.val);
            curr = curr.right;
        }
        return result;
    }

    static List<Integer> preorderTraversal(TreeNode root) {
        List<Integer> result = new ArrayList<>();
        if (root == null) return result;
        Deque<TreeNode> stack = new ArrayDeque<>();
        stack.push(root);
        while (!stack.isEmpty()) {
            TreeNode node = stack.pop();
            result.add(node.val);
            if (node.right != null) stack.push(node.right);
            if (node.left != null) stack.push(node.left);
        }
        return result;
    }

    static List<Integer> postorderTraversal(TreeNode root) {
        LinkedList<Integer> result = new LinkedList<>();
        if (root == null) return result;
        Deque<TreeNode> stack = new ArrayDeque<>();
        stack.push(root);
        while (!stack.isEmpty()) {
            TreeNode node = stack.pop();
            result.addFirst(node.val);
            if (node.left != null) stack.push(node.left);
            if (node.right != null) stack.push(node.right);
        }
        return result;
    }

    // ---- one-stack postorder ----
    static List<Integer> postorderOneStack(TreeNode root) {
        List<Integer> result = new ArrayList<>();
        Deque<TreeNode> stack = new ArrayDeque<>();
        TreeNode curr = root;
        TreeNode lastVisited = null;
        while (curr != null || !stack.isEmpty()) {
            while (curr != null) {
                stack.push(curr);
                curr = curr.left;
            }
            TreeNode top = stack.peek();
            if (top.right != null && top.right != lastVisited) {
                curr = top.right;
            } else {
                result.add(top.val);
                lastVisited = stack.pop();
            }
        }
        return result;
    }

    // ---- Morris inorder ----
    static List<Integer> morrisInorder(TreeNode root) {
        List<Integer> result = new ArrayList<>();
        TreeNode curr = root;
        while (curr != null) {
            if (curr.left == null) {
                result.add(curr.val);
                curr = curr.right;
            } else {
                TreeNode pred = curr.left;
                while (pred.right != null && pred.right != curr) {
                    pred = pred.right;
                }
                if (pred.right == null) {
                    pred.right = curr;
                    curr = curr.left;
                } else {
                    pred.right = null;
                    result.add(curr.val);
                    curr = curr.right;
                }
            }
        }
        return result;
    }

    // LeetCode level-order array -> tree.
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

    static String shape(TreeNode n) {
        return n == null ? "#" : "(" + n.val + " " + shape(n.left) + " " + shape(n.right) + ")";
    }

    static int failures = 0;

    static void check(String label, TreeNode root, List<Integer> in, List<Integer> pre, List<Integer> post) {
        String before = shape(root);
        boolean ok = recInorder(root).equals(in) && inorderTraversal(root).equals(in)
            && recPreorder(root).equals(pre) && preorderTraversal(root).equals(pre)
            && recPostorder(root).equals(post) && postorderTraversal(root).equals(post)
            && postorderOneStack(root).equals(post)
            && morrisInorder(root).equals(in) && shape(root).equals(before);
        if (!ok) failures++;
        System.out.println((ok ? "  ok   " : "  FAIL ") + label + "  in " + inorderTraversal(root)
            + " pre " + preorderTraversal(root) + " post " + postorderTraversal(root)
            + (ok ? "" : "  expected in " + in + " pre " + pre + " post " + post));
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
        System.out.println("day 51 - Binary Tree Traversals");

        check("sample tree", build(1, 2, 3, 4, 5, 6, 7),
            List.of(4, 2, 5, 1, 6, 3, 7), List.of(1, 2, 4, 5, 3, 6, 7), List.of(4, 5, 2, 6, 7, 3, 1));
        check("empty", null, List.of(), List.of(), List.of());
        check("single node", build(1), List.of(1), List.of(1), List.of(1));
        check("LC example [1,null,2,3]", build(1, null, 2, 3), List.of(1, 3, 2), List.of(1, 2, 3), List.of(3, 2, 1));
        check("left-skewed", new TreeNode(1, new TreeNode(2, new TreeNode(3), null), null),
            List.of(3, 2, 1), List.of(1, 2, 3), List.of(3, 2, 1));
        check("right-skewed", new TreeNode(1, null, new TreeNode(2, null, new TreeNode(3))),
            List.of(1, 2, 3), List.of(1, 2, 3), List.of(3, 2, 1));
        TreeNode bst = build(4, 2, 6, 1, 3, 5, 7);
        check("BST", bst, List.of(1, 2, 3, 4, 5, 6, 7), List.of(4, 2, 1, 3, 6, 5, 7), List.of(1, 3, 2, 5, 7, 6, 4));
        check("duplicates and negatives", build(0, -1, 0), List.of(-1, 0, 0), List.of(0, -1, 0), List.of(-1, 0, 0));

        // Root-Right-Left on the sample, which the postorder trick reverses.
        {
            TreeNode s = build(1, 2, 3, 4, 5, 6, 7);
            List<Integer> rrl = new ArrayList<>();
            Deque<TreeNode> st = new ArrayDeque<>();
            st.push(s);
            while (!st.isEmpty()) { TreeNode n = st.pop(); rrl.add(n.val); if (n.left != null) st.push(n.left); if (n.right != null) st.push(n.right); }
            boolean ok = rrl.equals(List.of(1, 3, 7, 6, 2, 5, 4));
            if (!ok) failures++;
            System.out.println((ok ? "  ok   " : "  FAIL ") + "Root-Right-Left order " + rrl);
        }

        // 100,000-node left chain, iterative versions only.
        {
            TreeNode root = null;
            for (int v = 100000; v >= 1; v--) root = new TreeNode(v, root, null);
            // root is 1, its left is 2, ... so inorder is 100000 down to 1
            List<Integer> in = inorderTraversal(root);
            List<Integer> pre = preorderTraversal(root);
            List<Integer> post = postorderTraversal(root);
            List<Integer> post1 = postorderOneStack(root);
            boolean ok = in.size() == 100000 && in.get(0) == 100000 && in.get(99999) == 1
                && pre.get(0) == 1 && post.equals(in) && post1.equals(in);
            if (!ok) failures++;
            System.out.println((ok ? "  ok   " : "  FAIL ") + "100,000-node chain traversed iteratively");
        }

        Random rnd = new Random(51);
        int agree = 0;
        for (int t = 0; t < 400; t++) {
            TreeNode root = randomTree(rnd, rnd.nextInt(30));
            String before = shape(root);
            boolean ok = inorderTraversal(root).equals(recInorder(root))
                && preorderTraversal(root).equals(recPreorder(root))
                && postorderTraversal(root).equals(recPostorder(root))
                && postorderOneStack(root).equals(recPostorder(root))
                && morrisInorder(root).equals(recInorder(root))
                && shape(root).equals(before);
            if (ok) agree++;
            else { failures++; System.out.println("  FAIL random " + before); }
        }
        System.out.println("  ok   " + agree + "/400 random trees: all iterative versions and Morris match recursion");

        System.out.println(failures == 0 ? "  day 51 PASSED" : "  day 51 had " + failures + " FAILURES");
    }
}
