// Correctness assertions for day 31 - Linked List Cycle (+ LC 142 follow-up).
//
// Floyd's hasCycle, the HashSet brute force and the detectCycle follow-up are
// copied verbatim from day-031.md. Lists are built from (values, pos) exactly
// the way LeetCode builds them; the truth is simply pos >= 0, and detectCycle
// must return the node at index pos BY IDENTITY.

import java.util.*;

class Day31Test {

    static class ListNode {
        int val;
        ListNode next;
        ListNode(int x) { val = x; next = null; }
    }

    // ---- implementation section ----
    static boolean hasCycle(ListNode head) {

        ListNode slow = head;
        ListNode fast = head;

        // If fast can't take two steps, the list has an end -> no cycle.
        while (fast != null && fast.next != null) {
            slow = slow.next;          // 1 step
            fast = fast.next.next;     // 2 steps

            if (slow == fast) {        // same NODE, not same value
                return true;
            }
        }

        return false;
    }

    // ---- brute force section ----
    static boolean hasCycleBrute(ListNode head) {

        Set<ListNode> seen = new HashSet<>();

        for (ListNode node = head; node != null; node = node.next) {
            if (!seen.add(node)) {      // add returns false if already present
                return true;
            }
        }

        return false;   // reached null: the list ends, so no cycle
    }

    // ---- LC 142 follow-up ----
    static ListNode detectCycle(ListNode head) {

        ListNode slow = head;
        ListNode fast = head;

        while (fast != null && fast.next != null) {
            slow = slow.next;
            fast = fast.next.next;

            if (slow == fast) {
                // Phase 2: equal speeds from head and from the meeting point.
                ListNode finder = head;
                while (finder != slow) {
                    finder = finder.next;
                    slow = slow.next;
                }
                return finder;   // the first node of the cycle
            }
        }

        return null;   // no cycle
    }

    static ListNode[] build(int[] vals, int pos) {
        ListNode[] nodes = new ListNode[vals.length];
        for (int i = 0; i < vals.length; i++) nodes[i] = new ListNode(vals[i]);
        for (int i = 0; i + 1 < vals.length; i++) nodes[i].next = nodes[i + 1];
        if (pos >= 0 && vals.length > 0) nodes[vals.length - 1].next = nodes[pos];
        return nodes;
    }

    static int failures = 0;

    static String run(int[] vals, int pos) {
        boolean want = pos >= 0 && vals.length > 0;
        StringBuilder why = new StringBuilder();

        ListNode[] n1 = build(vals, pos);
        if (hasCycle(vals.length == 0 ? null : n1[0]) != want) why.append(" floyd wrong");

        ListNode[] n2 = build(vals, pos);
        if (hasCycleBrute(vals.length == 0 ? null : n2[0]) != want) why.append(" brute wrong");

        ListNode[] n3 = build(vals, pos);
        ListNode start = detectCycle(vals.length == 0 ? null : n3[0]);
        ListNode wantStart = want ? n3[pos] : null;
        if (start != wantStart) why.append(" detectCycle wrong node");

        return why.toString();
    }

    static void check(String label, int[] vals, int pos, boolean want) {
        // The label's expected answer must match the truth the builder encodes.
        String why = run(vals, pos);
        if (want != (pos >= 0 && vals.length > 0)) why += " (expected answer in label disagrees with pos)";
        boolean ok = why.isEmpty();
        if (!ok) failures++;
        String shown = vals.length > 12 ? "[" + vals.length + " nodes]" : Arrays.toString(vals);
        System.out.println((ok ? "  ok   " : "  FAIL ") + label + "  " + shown
            + " pos=" + pos + " -> " + want + why);
    }

    public static void main(String[] args) {
        System.out.println("day 31 - Linked List Cycle");

        check("example",                   new int[] { 3, 2, 0, -4 }, 1, true);
        check("LC example 2",              new int[] { 1, 2 },        0, true);
        check("LC example 3",              new int[] { 1 },          -1, false);
        check("empty",                     new int[] {},             -1, false);
        check("single, no cycle",          new int[] { 1 },          -1, false);
        check("single self-loop",          new int[] { 1 },           0, true);
        check("two, tail to head",         new int[] { 1, 2 },        0, true);
        check("two, no cycle",             new int[] { 1, 2 },       -1, false);
        check("tail points to itself",     new int[] { 1, 2, 3, 4 },  3, true);
        check("repeated values, no cycle", new int[] { 1, 1, 1 },    -1, false);
        check("no-cycle dry run",          new int[] { 1, 2, 3 },    -1, false);

        // detectCycle on the worked example returns the node holding 2.
        ListNode[] ex = build(new int[] { 3, 2, 0, -4 }, 1);
        ListNode s = detectCycle(ex[0]);
        boolean startOk = s == ex[1] && s.val == 2;
        if (!startOk) failures++;
        System.out.println((startOk ? "  ok   " : "  FAIL ") + "example cycle starts at node 2");

        int[] big = new int[10000];
        for (int i = 0; i < big.length; i++) big[i] = i % 7;
        check("10^4 nodes, no cycle",      big, -1, false);
        check("10^4 nodes, cycle to head", big,  0, true);

        Random rnd = new Random(31);
        int agree = 0;
        for (int t = 0; t < 600; t++) {
            int n = rnd.nextInt(40);
            int[] vals = new int[n];
            for (int i = 0; i < n; i++) vals[i] = rnd.nextInt(4);   // duplicates on purpose
            int pos = (n == 0 || rnd.nextBoolean()) ? -1 : rnd.nextInt(n);
            String why = run(vals, pos);
            if (why.isEmpty()) agree++;
            else {
                failures++;
                System.out.println("  FAIL random " + Arrays.toString(vals) + " pos=" + pos + why);
            }
        }
        System.out.println("  ok   " + agree + "/600 random lists, floyd = set = truth, cycle start found by identity");

        System.out.println(failures == 0 ? "  day 31 PASSED" : "  day 31 had " + failures + " FAILURES");
    }
}
