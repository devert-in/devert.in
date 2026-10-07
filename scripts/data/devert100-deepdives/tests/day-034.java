// Correctness assertions for day 34 - Intersection of Two Linked Lists.
//
// All three published solutions (HashSet brute force, switching heads, and
// the length-difference follow-up) are copied verbatim from day-034.md and
// must return the SAME NODE (reference equality) on every case, including
// every case in the edge-cases section. A randomized sweep builds "Y"-shaped
// lists with random a / b / c and checks against the known join node.

import java.util.*;

class Day34Test {

    static class ListNode {
        int val;
        ListNode next;
        ListNode(int x) { val = x; next = null; }
    }

    // ---- brute force (HashSet) ----
    static ListNode bruteForce(ListNode headA, ListNode headB) {
        Set<ListNode> seen = new HashSet<>();
        for (ListNode a = headA; a != null; a = a.next) {
            seen.add(a);
        }
        for (ListNode b = headB; b != null; b = b.next) {
            if (seen.contains(b)) {
                return b;
            }
        }
        return null;
    }

    // ---- implementation (switching heads) ----
    static ListNode getIntersectionNode(ListNode headA, ListNode headB) {
        ListNode pA = headA;
        ListNode pB = headB;
        while (pA != pB) {
            pA = (pA == null) ? headB : pA.next;
            pB = (pB == null) ? headA : pB.next;
        }
        return pA;
    }

    // ---- length-difference follow-up ----
    static ListNode lengthDiff(ListNode headA, ListNode headB) {
        int lenA = length(headA);
        int lenB = length(headB);
        ListNode pA = headA;
        ListNode pB = headB;
        while (lenA > lenB) { pA = pA.next; lenA--; }
        while (lenB > lenA) { pB = pB.next; lenB--; }
        while (pA != pB) {
            pA = pA.next;
            pB = pB.next;
        }
        return pA;
    }

    static int length(ListNode node) {
        int len = 0;
        while (node != null) {
            len++;
            node = node.next;
        }
        return len;
    }

    // ---- helpers ----
    static ListNode build(int... vals) {
        ListNode dummy = new ListNode(0), t = dummy;
        for (int v : vals) { t.next = new ListNode(v); t = t.next; }
        return dummy.next;
    }

    // Prefix list whose tail is joined onto `shared`.
    static ListNode join(ListNode shared, int... prefix) {
        ListNode head = build(prefix);
        if (head == null) return shared;
        ListNode t = head;
        while (t.next != null) t = t.next;
        t.next = shared;
        return head;
    }

    static String show(ListNode n) {
        return n == null ? "null" : "node(" + n.val + ")@" + Integer.toHexString(System.identityHashCode(n));
    }

    static int failures = 0;

    static void check(String label, ListNode headA, ListNode headB, ListNode want) {
        ListNode r1 = bruteForce(headA, headB);
        ListNode r2 = getIntersectionNode(headA, headB);
        ListNode r3 = lengthDiff(headA, headB);
        boolean ok = r1 == want && r2 == want && r3 == want;
        if (!ok) failures++;
        System.out.println((ok ? "  ok   " : "  FAIL ") + label + "  -> " + (want == null ? "null" : "node with value " + want.val)
            + (ok ? "" : "  got brute " + show(r1) + ", switch " + show(r2) + ", lendiff " + show(r3)));
    }

    public static void main(String[] args) {
        System.out.println("day 34 - Intersection of Two Linked Lists");

        // Worked example: A = 4,1,[8,4,5]  B = 5,6,1,[8,4,5]
        ListNode shared = build(8, 4, 5);
        check("example (meets at 8, not at the shared value 1)", join(shared, 4, 1), join(shared, 5, 6, 1), shared);

        check("no intersection, different lengths", build(2, 6, 4), build(1, 5), null);
        check("same values, no shared node", build(1, 2, 3), build(1, 2, 3), null);

        ListNode same = build(1, 2, 3);
        check("the lists are the same list", same, same, same);

        ListNode inner = build(3, 4);
        check("A entirely inside B (join at A's head)", inner, join(inner, 2), inner);

        ListNode last = build(7);
        check("shared part is only the last node", join(last, 1, 2), join(last, 5), last);

        ListNode eq = build(9, 8);
        check("equal lengths that intersect", join(eq, 1), join(eq, 4), eq);

        check("single nodes, different", build(1), build(1), null);
        ListNode one = build(1);
        check("single node, same", one, one, one);

        check("empty list A", null, build(1, 2), null);

        // The no-intersection dry run claims the loop ends after 6 steps.
        {
            ListNode a = build(2, 6, 4), b = build(1, 5);
            ListNode pA = a, pB = b;
            int steps = 0;
            while (pA != pB) {
                pA = (pA == null) ? b : pA.next;
                pB = (pB == null) ? a : pB.next;
                steps++;
            }
            boolean ok = steps == 6 && pA == null;
            if (!ok) failures++;
            System.out.println((ok ? "  ok   " : "  FAIL ") + "no-intersection dry run ends at step " + steps + " (claimed 6)");
        }
        // The worked-example dry run claims the meeting happens at step 9.
        {
            ListNode s = build(8, 4, 5);
            ListNode a = join(s, 4, 1), b = join(s, 5, 6, 1);
            ListNode pA = a, pB = b;
            int steps = 0;
            while (pA != pB) {
                pA = (pA == null) ? b : pA.next;
                pB = (pB == null) ? a : pB.next;
                steps++;
            }
            boolean ok = steps == 9 && pA == s;
            if (!ok) failures++;
            System.out.println((ok ? "  ok   " : "  FAIL ") + "example dry run meets at step " + steps + " (claimed 9)");
        }

        // Randomized "Y" shapes: random unique lengths a, b and shared length c.
        Random rnd = new Random(34);
        int agree = 0;
        for (int t = 0; t < 600; t++) {
            int aLen = rnd.nextInt(8), bLen = rnd.nextInt(8), cLen = rnd.nextInt(6);
            int[] pa = new int[aLen], pb = new int[bLen], pc = new int[cLen];
            // tiny value range so equal values in different nodes are common
            for (int i = 0; i < aLen; i++) pa[i] = rnd.nextInt(3);
            for (int i = 0; i < bLen; i++) pb[i] = rnd.nextInt(3);
            for (int i = 0; i < cLen; i++) pc[i] = rnd.nextInt(3);
            ListNode s = build(pc);
            ListNode a = join(s, pa), b = join(s, pb);
            ListNode want = s;   // null when cLen == 0
            ListNode r1 = bruteForce(a, b), r2 = getIntersectionNode(a, b), r3 = lengthDiff(a, b);
            if (r1 == want && r2 == want && r3 == want) agree++;
            else {
                failures++;
                System.out.println("  FAIL random a=" + aLen + " b=" + bLen + " c=" + cLen);
            }
        }
        System.out.println("  ok   " + agree + "/600 random Y-shaped cases, all three versions return the same node");

        System.out.println(failures == 0 ? "  day 34 PASSED" : "  day 34 had " + failures + " FAILURES");
    }
}
