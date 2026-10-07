// Correctness assertions for day 30 - Middle of the Linked List.
//
// The fast/slow implementation, the first-middle variant and the two-pass brute
// force are copied verbatim from day-030.md. Answers are checked by NODE
// IDENTITY against the index the writeup claims (n / 2 for the second middle,
// (n - 1) / 2 for the first), so an all-equal-values list cannot pass by luck.

import java.util.*;

class Day30Test {

    static class ListNode {
        int val;
        ListNode next;
        ListNode() {}
        ListNode(int val) { this.val = val; }
        ListNode(int val, ListNode next) { this.val = val; this.next = next; }
    }

    // ---- implementation section ----
    static ListNode middleNode(ListNode head) {

        ListNode slow = head;   // moves 1 node per round
        ListNode fast = head;   // moves 2 nodes per round

        // fast needs two nodes ahead of it to make a full jump.
        while (fast != null && fast.next != null) {
            slow = slow.next;
            fast = fast.next.next;
        }

        // index(slow) = n / 2 -> the second middle on even lengths.
        return slow;
    }

    // ---- first-middle variant ----
    static ListNode middleNodeFirst(ListNode head) {

        if (head == null) {
            return null;
        }

        ListNode slow = head;
        ListNode fast = head.next;   // one ahead -> first middle on even n

        while (fast != null && fast.next != null) {
            slow = slow.next;
            fast = fast.next.next;
        }

        return slow;   // index (n - 1) / 2
    }

    // ---- brute force section ----
    static ListNode middleNodeBrute(ListNode head) {

        // Pass 1: learn the length.
        int length = 0;
        for (ListNode node = head; node != null; node = node.next) {
            length++;
        }

        // Pass 2: walk to index length / 2.
        ListNode middle = head;
        for (int i = 0; i < length / 2; i++) {
            middle = middle.next;
        }

        return middle;
    }

    static ListNode[] buildNodes(int[] a) {
        ListNode[] nodes = new ListNode[a.length];
        for (int i = a.length - 1; i >= 0; i--) nodes[i] = new ListNode(a[i], i + 1 < a.length ? nodes[i + 1] : null);
        return nodes;
    }

    static int failures = 0;

    // Returns "" on success or a description of what went wrong.
    static String run(int[] a, int wantSecond, int wantFirst) {
        ListNode[] nodes = buildNodes(a);
        ListNode head = a.length == 0 ? null : nodes[0];
        ListNode expectSecond = wantSecond < 0 ? null : nodes[wantSecond];
        ListNode expectFirst = wantFirst < 0 ? null : nodes[wantFirst];
        StringBuilder why = new StringBuilder();
        if (middleNode(head) != expectSecond) why.append(" fast/slow wrong node");
        if (middleNodeBrute(head) != expectSecond) why.append(" brute wrong node");
        if (middleNodeFirst(head) != expectFirst) why.append(" first-middle wrong node");
        return why.toString();
    }

    static void check(String label, int[] a, int wantSecond, int wantFirst) {
        String why = run(a, wantSecond, wantFirst);
        boolean ok = why.isEmpty();
        if (!ok) failures++;
        System.out.println((ok ? "  ok   " : "  FAIL ") + label + "  n=" + a.length
            + " -> second middle index " + wantSecond + ", first middle index " + wantFirst + why);
    }

    public static void main(String[] args) {
        System.out.println("day 30 - Middle of the Linked List");

        check("example odd [1..5] -> node 3",   new int[] { 1, 2, 3, 4, 5 },    2, 2);
        check("example even [1..6] -> node 4",  new int[] { 1, 2, 3, 4, 5, 6 }, 3, 2);
        check("single -> node 1",               new int[] { 1 },                0, 0);
        check("two -> node 2 (first: node 1)",  new int[] { 1, 2 },             1, 0);
        check("three -> node 2",                new int[] { 1, 2, 3 },          1, 1);
        check("four -> node 3 (first: node 2)", new int[] { 1, 2, 3, 4 },       2, 1);
        check("all equal -> third node",        new int[] { 7, 7, 7, 7 },       2, 1);

        int[] hundred = new int[100];
        for (int i = 0; i < 100; i++) hundred[i] = i + 1;
        check("100 nodes -> node 51",           hundred,                        50, 49);
        boolean val51 = middleNode(buildNodes(hundred)[0]).val == 51;
        if (!val51) failures++;
        System.out.println((val51 ? "  ok   " : "  FAIL ") + "100 nodes: returned node holds 51");

        check("empty -> null",                  new int[] {},                   -1, -1);

        Random rnd = new Random(30);
        int agree = 0;
        for (int t = 0; t < 500; t++) {
            int n = 1 + rnd.nextInt(100);
            int[] a = new int[n];
            for (int i = 0; i < n; i++) a[i] = 1 + rnd.nextInt(5);   // many duplicates on purpose
            String why = run(a, n / 2, (n - 1) / 2);
            if (why.isEmpty()) agree++;
            else {
                failures++;
                System.out.println("  FAIL random n=" + n + why);
            }
        }
        System.out.println("  ok   " + agree + "/500 random lists, all versions pick the node at the claimed index");

        System.out.println(failures == 0 ? "  day 30 PASSED" : "  day 30 had " + failures + " FAILURES");
    }
}
