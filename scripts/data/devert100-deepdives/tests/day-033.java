// Correctness assertions for day 33 - Remove Nth Node From End of List.
//
// The dummy + fixed-gap implementation and the two-pass brute force are copied
// verbatim from day-033.md. Both must remove exactly the node at index L - n
// BY IDENTITY (so duplicate values cannot hide a wrong deletion) and leave the
// remaining original nodes in order.

import java.util.*;

class Day33Test {

    static class ListNode {
        int val;
        ListNode next;
        ListNode() {}
        ListNode(int val) { this.val = val; }
        ListNode(int val, ListNode next) { this.val = val; this.next = next; }
    }

    // ---- implementation section ----
    static ListNode removeNthFromEnd(ListNode head, int n) {

        ListNode dummy = new ListNode(0, head);   // gives the head a predecessor
        ListNode fast = dummy;
        ListNode slow = dummy;

        // Open a gap of n + 1 so slow stops BEFORE the target, not on it.
        for (int i = 0; i <= n; i++) {
            fast = fast.next;
        }

        // Slide the fixed-size window until fast falls off the end.
        while (fast != null) {
            fast = fast.next;
            slow = slow.next;
        }

        // slow.next is the n-th node from the end: skip over it.
        slow.next = slow.next.next;

        return dummy.next;   // not head - head itself may have been removed
    }

    // ---- brute force section ----
    static ListNode removeNthFromEndBrute(ListNode head, int n) {

        // Pass 1: count the nodes.
        int length = 0;
        for (ListNode node = head; node != null; node = node.next) {
            length++;
        }

        int target = length - n;    // 0-based index of the node to delete

        // Deleting the head: there is no node before it to re-point.
        if (target == 0) {
            return head.next;
        }

        // Pass 2: stop on the node just BEFORE the target.
        ListNode prev = head;
        for (int i = 0; i < target - 1; i++) {
            prev = prev.next;
        }

        prev.next = prev.next.next;
        return head;
    }

    static ListNode[] nodes(int[] a) {
        ListNode[] out = new ListNode[a.length];
        for (int i = a.length - 1; i >= 0; i--) out[i] = new ListNode(a[i], i + 1 < a.length ? out[i + 1] : null);
        return out;
    }

    static List<ListNode> walk(ListNode head, int limit) {
        List<ListNode> out = new ArrayList<>();
        for (ListNode x = head; x != null && out.size() <= limit; x = x.next) out.add(x);
        return out;
    }

    static int[] vals(List<ListNode> ns) {
        int[] r = new int[ns.size()];
        for (int i = 0; i < r.length; i++) r[i] = ns.get(i).val;
        return r;
    }

    static int failures = 0;

    static String run(int[] a, int n, int[] want) {
        StringBuilder why = new StringBuilder();
        for (int version = 0; version < 2; version++) {
            ListNode[] ns = nodes(a);
            List<ListNode> expect = new ArrayList<>(Arrays.asList(ns));
            expect.remove(a.length - n);   // the node at index L - n, by identity
            ListNode res = version == 0 ? removeNthFromEnd(ns[0], n) : removeNthFromEndBrute(ns[0], n);
            List<ListNode> got = walk(res, a.length);
            String name = version == 0 ? " gap" : " brute";
            if (!Arrays.equals(vals(got), want)) why.append(name + "=" + Arrays.toString(vals(got)));
            else if (!got.equals(expect)) why.append(name + " removed the wrong node object");
        }
        return why.toString();
    }

    static void check(String label, int[] a, int n, int[] want) {
        String why = run(a, n, want);
        boolean ok = why.isEmpty();
        if (!ok) failures++;
        String shown = a.length > 12 ? "[" + a.length + " nodes]" : Arrays.toString(a);
        String wantShown = want.length > 12 ? "[" + want.length + " nodes]" : Arrays.toString(want);
        System.out.println((ok ? "  ok   " : "  FAIL ") + label + "  " + shown + ", n=" + n + " -> " + wantShown + why);
    }

    public static void main(String[] args) {
        System.out.println("day 33 - Remove Nth Node From End of List");

        check("example",               new int[] { 1, 2, 3, 4, 5 }, 2, new int[] { 1, 2, 3, 5 });
        check("single node",           new int[] { 1 },             1, new int[] {});
        check("remove head of five",   new int[] { 1, 2, 3, 4, 5 }, 5, new int[] { 2, 3, 4, 5 });
        check("remove head of two",    new int[] { 1, 2 },          2, new int[] { 2 });
        check("remove tail of two",    new int[] { 1, 2 },          1, new int[] { 1 });
        check("remove tail of five",   new int[] { 1, 2, 3, 4, 5 }, 1, new int[] { 1, 2, 3, 4 });
        check("remove middle",         new int[] { 1, 2, 3, 4, 5 }, 3, new int[] { 1, 2, 4, 5 });
        check("duplicates, middle",    new int[] { 7, 7, 7 },       2, new int[] { 7, 7 });

        int[] thirty = new int[30];
        for (int i = 0; i < 30; i++) thirty[i] = i + 1;
        check("30 nodes, n = 30", thirty, 30, Arrays.copyOfRange(thirty, 1, 30));
        check("30 nodes, n = 1",  thirty, 1,  Arrays.copyOfRange(thirty, 0, 29));

        Random rnd = new Random(33);
        int agree = 0;
        for (int t = 0; t < 600; t++) {
            int len = 1 + rnd.nextInt(30);
            int[] a = new int[len];
            for (int i = 0; i < len; i++) a[i] = rnd.nextInt(4);   // duplicates on purpose
            int n = 1 + rnd.nextInt(len);
            List<Integer> w = new ArrayList<>();
            for (int i = 0; i < len; i++) if (i != len - n) w.add(a[i]);
            int[] want = new int[w.size()];
            for (int i = 0; i < want.length; i++) want[i] = w.get(i);
            String why = run(a, n, want);
            if (why.isEmpty()) agree++;
            else {
                failures++;
                System.out.println("  FAIL random " + Arrays.toString(a) + " n=" + n + why);
            }
        }
        System.out.println("  ok   " + agree + "/600 random lists, both versions remove the node at index L - n");

        System.out.println(failures == 0 ? "  day 33 PASSED" : "  day 33 had " + failures + " FAILURES");
    }
}
