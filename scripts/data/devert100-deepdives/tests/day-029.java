// Correctness assertions for day 29 - Reverse Linked List.
//
// The iterative implementation, the recursive follow-up and the brute force
// are copied verbatim from day-029.md. All three must produce the reversed
// sequence on every edge case the writeup lists; the two link-moving versions
// must also return the ORIGINAL node objects (they reverse links, not values)
// and leave a properly null-terminated list.

import java.util.*;

class Day29Test {

    static class ListNode {
        int val;
        ListNode next;
        ListNode() {}
        ListNode(int val) { this.val = val; }
        ListNode(int val, ListNode next) { this.val = val; this.next = next; }
    }

    // ---- implementation section ----
    static ListNode reverseList(ListNode head) {

        ListNode prev = null;   // head of the reversed part (starts empty)
        ListNode curr = head;   // head of the part still to reverse

        while (curr != null) {
            ListNode next = curr.next;  // 1. save the way forward
            curr.next = prev;           // 2. flip this node's arrow
            prev = curr;                // 3. reversed part grows by one
            curr = next;                // 4. advance via the saved link
        }

        return prev;   // curr is null; prev is the old tail = new head
    }

    // ---- recursive follow-up ----
    static ListNode reverseListRecursive(ListNode head) {

        // Empty list or last node: already reversed.
        if (head == null || head.next == null) {
            return head;
        }

        ListNode newHead = reverseListRecursive(head.next);  // reverse the rest

        head.next.next = head;   // the node after head now points back to it
        head.next = null;        // head becomes the tail of what is built so far

        return newHead;          // the old tail, passed all the way up
    }

    // ---- brute force section ----
    static ListNode reverseListBrute(ListNode head) {

        // Pass 1: copy every value out, in order.
        List<Integer> values = new ArrayList<>();
        for (ListNode node = head; node != null; node = node.next) {
            values.add(node.val);
        }

        // Pass 2: walk again, writing the values back last-first.
        int i = values.size() - 1;
        for (ListNode node = head; node != null; node = node.next) {
            node.val = values.get(i);
            i--;
        }

        return head;
    }

    static ListNode build(int[] a) {
        ListNode head = null;
        for (int i = a.length - 1; i >= 0; i--) head = new ListNode(a[i], head);
        return head;
    }

    static List<ListNode> nodes(ListNode head) {
        List<ListNode> out = new ArrayList<>();
        for (ListNode n = head; n != null; n = n.next) out.add(n);
        return out;
    }

    // Reads at most limit nodes, so a cycle shows up as a too-long array
    // instead of hanging the test.
    static int[] toArray(ListNode head, int limit) {
        List<Integer> out = new ArrayList<>();
        for (ListNode n = head; n != null && out.size() <= limit; n = n.next) out.add(n.val);
        int[] r = new int[out.size()];
        for (int i = 0; i < r.length; i++) r[i] = out.get(i);
        return r;
    }

    static int[] reversed(int[] a) {
        int[] r = new int[a.length];
        for (int i = 0; i < a.length; i++) r[i] = a[a.length - 1 - i];
        return r;
    }

    static int failures = 0;

    // Runs all three versions; the link-moving ones must also hand back the
    // same node objects in reverse order.
    static boolean runAll(int[] input, int[] want, StringBuilder why) {
        boolean ok = true;

        ListNode h1 = build(input);
        List<ListNode> orig1 = nodes(h1);
        ListNode r1 = reverseList(h1);
        int[] got1 = toArray(r1, input.length);
        if (!Arrays.equals(got1, want)) { ok = false; why.append(" iterative=" + Arrays.toString(got1)); }
        List<ListNode> after1 = nodes(r1);
        Collections.reverse(after1);
        if (ok && !after1.equals(orig1)) { ok = false; why.append(" iterative moved values, not links"); }

        ListNode h2 = build(input);
        List<ListNode> orig2 = nodes(h2);
        ListNode r2 = reverseListRecursive(h2);
        int[] got2 = toArray(r2, input.length);
        if (!Arrays.equals(got2, want)) { ok = false; why.append(" recursive=" + Arrays.toString(got2)); }
        List<ListNode> after2 = nodes(r2);
        Collections.reverse(after2);
        if (ok && !after2.equals(orig2)) { ok = false; why.append(" recursive moved values, not links"); }

        int[] got3 = toArray(reverseListBrute(build(input)), input.length);
        if (!Arrays.equals(got3, want)) { ok = false; why.append(" brute=" + Arrays.toString(got3)); }

        return ok;
    }

    static void check(String label, int[] input, int[] want) {
        StringBuilder why = new StringBuilder();
        boolean ok = runAll(input, want, why);
        if (!ok) failures++;
        System.out.println((ok ? "  ok   " : "  FAIL ") + label + "  " + Arrays.toString(input)
            + " -> " + Arrays.toString(want) + why);
    }

    public static void main(String[] args) {
        System.out.println("day 29 - Reverse Linked List");

        check("example",          new int[] { 1, 2, 3, 4, 5 },  new int[] { 5, 4, 3, 2, 1 });
        check("empty",            new int[] {},                 new int[] {});
        check("single",           new int[] { 7 },              new int[] { 7 });
        check("two nodes",        new int[] { 1, 2 },           new int[] { 2, 1 });
        check("duplicates",       new int[] { 1, 1, 2 },        new int[] { 2, 1, 1 });
        check("negative and zero", new int[] { -1, 0, 3 },      new int[] { 3, 0, -1 });
        check("descending input", new int[] { 5, 4, 3, 2, 1 },  new int[] { 1, 2, 3, 4, 5 });

        // Reversing twice restores the original order and the original nodes.
        ListNode h = build(new int[] { 1, 2, 3 });
        List<ListNode> orig = nodes(h);
        ListNode twice = reverseList(reverseList(h));
        boolean twiceOk = Arrays.equals(toArray(twice, 3), new int[] { 1, 2, 3 }) && nodes(twice).equals(orig);
        if (!twiceOk) failures++;
        System.out.println((twiceOk ? "  ok   " : "  FAIL ") + "reverse twice restores 1 -> 2 -> 3 with the same nodes");

        // Maximum length, both link-moving versions.
        int[] big = new int[5000];
        for (int i = 0; i < big.length; i++) big[i] = i - 2500;
        StringBuilder bigWhy = new StringBuilder();
        boolean bigOk = runAll(big, reversed(big), bigWhy);
        if (!bigOk) failures++;
        System.out.println((bigOk ? "  ok   " : "  FAIL ") + "5000 nodes reversed by all three versions" + bigWhy);

        Random rnd = new Random(29);
        int agree = 0;
        for (int t = 0; t < 500; t++) {
            int n = rnd.nextInt(30);
            int[] in = new int[n];
            for (int i = 0; i < n; i++) in[i] = rnd.nextInt(21) - 10;
            StringBuilder why = new StringBuilder();
            if (runAll(in, reversed(in), why)) agree++;
            else {
                failures++;
                System.out.println("  FAIL random " + Arrays.toString(in) + why);
            }
        }
        System.out.println("  ok   " + agree + "/500 random lists, all three versions agree with the reversed array");

        System.out.println(failures == 0 ? "  day 29 PASSED" : "  day 29 had " + failures + " FAILURES");
    }
}
