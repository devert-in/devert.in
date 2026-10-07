// Correctness assertions for day 35 - Palindrome Linked List.
//
// The brute force (copy to array) and the optimal (middle + reverse half +
// restore) are copied verbatim from day-035.md. Both must agree on every
// edge case the writeup lists, and the optimal must leave the list exactly as
// it found it - same nodes, same order - on BOTH the true and false paths,
// which is the claim the implementation section makes about `break`.

import java.util.*;

class Day35Test {

    static class ListNode {
        int val;
        ListNode next;
        ListNode() {}
        ListNode(int val) { this.val = val; }
        ListNode(int val, ListNode next) { this.val = val; this.next = next; }
    }

    // ---- brute force ----
    static boolean bruteForce(ListNode head) {
        List<Integer> vals = new ArrayList<>();
        for (ListNode node = head; node != null; node = node.next) {
            vals.add(node.val);
        }
        int i = 0;
        int j = vals.size() - 1;
        while (i < j) {
            if (!vals.get(i).equals(vals.get(j))) {
                return false;
            }
            i++;
            j--;
        }
        return true;
    }

    // ---- implementation ----
    static boolean isPalindrome(ListNode head) {
        ListNode slow = head;
        ListNode fast = head;
        while (fast != null && fast.next != null) {
            slow = slow.next;
            fast = fast.next.next;
        }
        ListNode secondHead = reverse(slow);
        boolean result = true;
        ListNode p1 = head;
        ListNode p2 = secondHead;
        while (p2 != null) {
            if (p1.val != p2.val) {
                result = false;
                break;
            }
            p1 = p1.next;
            p2 = p2.next;
        }
        reverse(secondHead);
        return result;
    }

    static ListNode reverse(ListNode head) {
        ListNode prev = null;
        ListNode curr = head;
        while (curr != null) {
            ListNode next = curr.next;
            curr.next = prev;
            prev = curr;
            curr = next;
        }
        return prev;
    }

    // ---- helpers ----
    static ListNode build(int... vals) {
        ListNode dummy = new ListNode(), t = dummy;
        for (int v : vals) { t.next = new ListNode(v); t = t.next; }
        return dummy.next;
    }

    static List<ListNode> nodes(ListNode head) {
        List<ListNode> out = new ArrayList<>();
        for (ListNode n = head; n != null && out.size() < 1_000_000; n = n.next) out.add(n);
        return out;
    }

    static boolean oracle(int[] a) {
        for (int i = 0, j = a.length - 1; i < j; i++, j--) if (a[i] != a[j]) return false;
        return true;
    }

    static int failures = 0;

    static void check(String label, int[] vals, boolean want) {
        ListNode head = build(vals);
        List<ListNode> before = nodes(head);
        boolean opt = isPalindrome(head);
        List<ListNode> after = nodes(head);
        boolean restored = before.equals(after);   // identity of every node, in order
        for (int i = 0; restored && i < vals.length; i++) restored = after.get(i).val == vals[i];
        boolean brute = bruteForce(build(vals));

        boolean ok = opt == want && brute == want && restored;
        if (!ok) failures++;
        System.out.println((ok ? "  ok   " : "  FAIL ") + label + "  " + (vals.length > 12 ? "[" + vals.length + " values]" : Arrays.toString(vals)) + " -> " + opt
            + (ok ? ", list restored" : "  (brute " + brute + ", restored " + restored + ", expected " + want + ")"));
    }

    public static void main(String[] args) {
        System.out.println("day 35 - Palindrome Linked List");

        check("example even",                  new int[] { 1, 2, 2, 1 },       true);
        check("example false",                 new int[] { 1, 2 },             false);
        check("example odd",                   new int[] { 1, 2, 3, 2, 1 },    true);
        check("single node",                   new int[] { 7 },                true);
        check("two equal",                     new int[] { 1, 1 },             true);
        check("two different",                 new int[] { 1, 2 },             false);
        check("mismatch next to middle",       new int[] { 1, 2, 3, 1 },       false);
        check("all same",                      new int[] { 5, 5, 5, 5, 5 },    true);
        check("same values, different order",  new int[] { 1, 2, 1, 2 },       false);

        // The Java-notes claim: boxed Integer != breaks above 127, equals() does not.
        {
            List<Integer> big = new ArrayList<>(List.of(1000, 1000));
            boolean refEqual = big.get(0) == big.get(1);
            boolean valEqual = big.get(0).equals(big.get(1));
            boolean ok = !refEqual && valEqual;
            if (!ok) failures++;
            System.out.println((ok ? "  ok   " : "  FAIL ") + "Integer 1000 == 1000 by reference: " + refEqual + ", by equals: " + valEqual);
        }

        // Long list: iterative version handles 10^5 nodes.
        {
            int n = 100_000;
            int[] v = new int[n];
            for (int i = 0; i < n; i++) v[i] = Math.min(i, n - 1 - i) % 10;
            check("100000-node palindrome", v, true);
        }

        Random rnd = new Random(35);
        int agree = 0;
        for (int t = 0; t < 800; t++) {
            int n = 1 + rnd.nextInt(12);
            int[] v = new int[n];
            for (int i = 0; i < n; i++) v[i] = rnd.nextInt(3);
            if (rnd.nextBoolean()) for (int i = 0; i < n / 2; i++) v[n - 1 - i] = v[i];  // force many true cases
            boolean want = oracle(v);
            ListNode head = build(v);
            List<ListNode> before = nodes(head);
            boolean opt = isPalindrome(head);
            boolean restored = before.equals(nodes(head));
            boolean brute = bruteForce(build(v));
            if (opt == want && brute == want && restored) agree++;
            else {
                failures++;
                System.out.println("  FAIL random " + Arrays.toString(v) + " opt " + opt + " brute " + brute + " restored " + restored);
            }
        }
        System.out.println("  ok   " + agree + "/800 random lists, both versions agree with the oracle, list restored");

        System.out.println(failures == 0 ? "  day 35 PASSED" : "  day 35 had " + failures + " FAILURES");
    }
}
