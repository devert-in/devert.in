// Correctness assertions for day 32 - Merge Two Sorted Lists.
//
// The iterative merge, the recursive follow-up and the sort-and-rebuild brute
// force are copied verbatim from day-032.md. All three must produce the sorted
// values. The two merge versions must additionally SPLICE: the result is made
// of exactly the original nodes, in the stable order (ties from list1 first) -
// which is the claim the `<=` paragraph makes.

import java.util.*;

class Day32Test {

    static class ListNode {
        int val;
        ListNode next;
        ListNode() {}
        ListNode(int val) { this.val = val; }
        ListNode(int val, ListNode next) { this.val = val; this.next = next; }
    }

    // ---- implementation section ----
    static ListNode mergeTwoLists(ListNode list1, ListNode list2) {

        ListNode dummy = new ListNode(0);   // fake head: never returned
        ListNode tail = dummy;              // last node of the merged list

        while (list1 != null && list2 != null) {
            if (list1.val <= list2.val) {   // <= keeps equal nodes stable
                tail.next = list1;
                list1 = list1.next;
            } else {
                tail.next = list2;
                list2 = list2.next;
            }
            tail = tail.next;
        }

        // One list is exhausted; the other is already sorted - attach it whole.
        tail.next = (list1 != null) ? list1 : list2;

        return dummy.next;
    }

    // ---- recursive follow-up ----
    static ListNode mergeRecursive(ListNode list1, ListNode list2) {

        if (list1 == null) return list2;   // nothing left in list1
        if (list2 == null) return list1;   // nothing left in list2

        if (list1.val <= list2.val) {
            list1.next = mergeRecursive(list1.next, list2);
            return list1;
        } else {
            list2.next = mergeRecursive(list1, list2.next);
            return list2;
        }
    }

    // ---- brute force section ----
    static ListNode mergeBrute(ListNode list1, ListNode list2) {

        // Phase 1: pour both lists into one array.
        List<Integer> values = new ArrayList<>();
        for (ListNode node = list1; node != null; node = node.next) {
            values.add(node.val);
        }
        for (ListNode node = list2; node != null; node = node.next) {
            values.add(node.val);
        }

        // Phase 2: sort - throws away the order the inputs already had.
        Collections.sort(values);

        // Phase 3: build a NEW list, prepending from the back.
        ListNode head = null;
        for (int i = values.size() - 1; i >= 0; i--) {
            head = new ListNode(values.get(i), head);
        }

        return head;
    }

    static ListNode[] nodes(int[] a) {
        ListNode[] out = new ListNode[a.length];
        for (int i = a.length - 1; i >= 0; i--) out[i] = new ListNode(a[i], i + 1 < a.length ? out[i + 1] : null);
        return out;
    }

    static List<ListNode> walk(ListNode head, int limit) {
        List<ListNode> out = new ArrayList<>();
        for (ListNode n = head; n != null && out.size() <= limit; n = n.next) out.add(n);
        return out;
    }

    static int[] vals(List<ListNode> ns) {
        int[] r = new int[ns.size()];
        for (int i = 0; i < r.length; i++) r[i] = ns.get(i).val;
        return r;
    }

    // Stable merge oracle over node arrays: ties take from a first.
    static List<ListNode> stableOrder(ListNode[] a, ListNode[] b) {
        List<ListNode> out = new ArrayList<>();
        int i = 0, j = 0;
        while (i < a.length || j < b.length) {
            if (j == b.length || (i < a.length && a[i].val <= b[j].val)) out.add(a[i++]);
            else out.add(b[j++]);
        }
        return out;
    }

    static int failures = 0;

    static String run(int[] a, int[] b, int[] want) {
        StringBuilder why = new StringBuilder();
        int total = a.length + b.length;

        ListNode[] na = nodes(a), nb = nodes(b);
        List<ListNode> stable = stableOrder(na, nb);
        List<ListNode> got = walk(mergeTwoLists(a.length == 0 ? null : na[0], b.length == 0 ? null : nb[0]), total);
        if (!Arrays.equals(vals(got), want)) why.append(" iterative=" + Arrays.toString(vals(got)));
        else if (!got.equals(stable)) why.append(" iterative did not splice the original nodes stably");

        ListNode[] ra = nodes(a), rb = nodes(b);
        List<ListNode> stableR = stableOrder(ra, rb);
        List<ListNode> gotR = walk(mergeRecursive(a.length == 0 ? null : ra[0], b.length == 0 ? null : rb[0]), total);
        if (!Arrays.equals(vals(gotR), want)) why.append(" recursive=" + Arrays.toString(vals(gotR)));
        else if (!gotR.equals(stableR)) why.append(" recursive did not splice the original nodes stably");

        ListNode[] ba = nodes(a), bb = nodes(b);
        int[] gotB = vals(walk(mergeBrute(a.length == 0 ? null : ba[0], b.length == 0 ? null : bb[0]), total));
        if (!Arrays.equals(gotB, want)) why.append(" brute=" + Arrays.toString(gotB));

        return why.toString();
    }

    static void check(String label, int[] a, int[] b, int[] want) {
        String why = run(a, b, want);
        boolean ok = why.isEmpty();
        if (!ok) failures++;
        System.out.println((ok ? "  ok   " : "  FAIL ") + label + "  " + Arrays.toString(a) + " + "
            + Arrays.toString(b) + " -> " + Arrays.toString(want) + why);
    }

    public static void main(String[] args) {
        System.out.println("day 32 - Merge Two Sorted Lists");

        check("example",                 new int[] { 1, 2, 4 },   new int[] { 1, 3, 4 },        new int[] { 1, 1, 2, 3, 4, 4 });
        check("both empty",              new int[] {},            new int[] {},                 new int[] {});
        check("first empty",             new int[] {},            new int[] { 0 },              new int[] { 0 });
        check("second empty",            new int[] { 5, 6 },      new int[] {},                 new int[] { 5, 6 });
        check("first entirely smaller",  new int[] { 1, 2, 3 },   new int[] { 4, 5, 6 },        new int[] { 1, 2, 3, 4, 5, 6 });
        check("first entirely larger",   new int[] { 4, 5, 6 },   new int[] { 1, 2, 3 },        new int[] { 1, 2, 3, 4, 5, 6 });
        check("perfect interleave",      new int[] { 1, 3, 5 },   new int[] { 2, 4, 6 },        new int[] { 1, 2, 3, 4, 5, 6 });
        check("all equal",               new int[] { 2, 2 },      new int[] { 2, 2, 2 },        new int[] { 2, 2, 2, 2, 2 });
        check("negatives, uneven",       new int[] { -10, -3 },   new int[] { -5, 0, 7, 9 },    new int[] { -10, -5, -3, 0, 7, 9 });
        check("single vs four",          new int[] { 1 },         new int[] { 2, 3, 4, 5 },     new int[] { 1, 2, 3, 4, 5 });

        Random rnd = new Random(32);
        int agree = 0;
        for (int t = 0; t < 600; t++) {
            int[] a = new int[rnd.nextInt(51)];
            int[] b = new int[rnd.nextInt(51)];
            for (int i = 0; i < a.length; i++) a[i] = rnd.nextInt(21) - 10;
            for (int i = 0; i < b.length; i++) b[i] = rnd.nextInt(21) - 10;
            Arrays.sort(a);
            Arrays.sort(b);
            int[] want = new int[a.length + b.length];
            System.arraycopy(a, 0, want, 0, a.length);
            System.arraycopy(b, 0, want, a.length, b.length);
            Arrays.sort(want);
            String why = run(a, b, want);
            if (why.isEmpty()) agree++;
            else {
                failures++;
                System.out.println("  FAIL random " + Arrays.toString(a) + " + " + Arrays.toString(b) + why);
            }
        }
        System.out.println("  ok   " + agree + "/600 random pairs, all versions sorted, merges splice stably");

        System.out.println(failures == 0 ? "  day 32 PASSED" : "  day 32 had " + failures + " FAILURES");
    }
}
