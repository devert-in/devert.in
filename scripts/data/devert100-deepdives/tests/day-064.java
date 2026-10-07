// Correctness assertions for day 64 - Merge k Sorted Lists.
//
// All three published solutions (sequential brute force, min-heap, and the
// divide-and-conquer follow-up) are copied verbatim from day-064.md. Each must
// match a sort-the-values oracle on the worked example, every edge case in the
// edge-cases section, and a few hundred random inputs. The heap version is
// also checked to RELINK the input nodes rather than allocate new ones.

import java.util.*;

class Day64Test {

    // LeetCode's definition - nested so it cannot clash with anything.
    static class ListNode {
        int val; ListNode next;
        ListNode() {}
        ListNode(int val) { this.val = val; }
        ListNode(int val, ListNode next) { this.val = val; this.next = next; }
    }

    // ---- brute force: merge one list at a time ----
    static ListNode bruteMergeKLists(ListNode[] lists) {
        ListNode merged = null;
        for (ListNode list : lists) {
            merged = mergeTwo(merged, list);
        }
        return merged;
    }

    static ListNode mergeTwo(ListNode a, ListNode b) {
        ListNode dummy = new ListNode(0);
        ListNode tail = dummy;
        while (a != null && b != null) {
            if (a.val <= b.val) {
                tail.next = a;
                a = a.next;
            } else {
                tail.next = b;
                b = b.next;
            }
            tail = tail.next;
        }
        tail.next = (a != null) ? a : b;
        return dummy.next;
    }

    // ---- implementation: min-heap of heads ----
    static ListNode mergeKLists(ListNode[] lists) {

        // Min-heap ordered by node value. Holds at most one node per list.
        PriorityQueue<ListNode> heap =
            new PriorityQueue<>((a, b) -> Integer.compare(a.val, b.val));

        for (ListNode head : lists) {
            if (head != null) {          // empty lists contribute nothing
                heap.offer(head);
            }
        }

        ListNode dummy = new ListNode(0);
        ListNode tail = dummy;

        while (!heap.isEmpty()) {
            ListNode smallest = heap.poll();
            tail.next = smallest;        // relink, do not copy
            tail = smallest;
            if (smallest.next != null) {
                heap.offer(smallest.next);   // its list's new head
            }
        }

        return dummy.next;
    }

    // ---- follow-up: divide and conquer ----
    static ListNode dcMergeKLists(ListNode[] lists) {
        if (lists.length == 0) {
            return null;
        }
        // gap = distance between the two lists merged in this round.
        for (int gap = 1; gap < lists.length; gap *= 2) {
            for (int i = 0; i + gap < lists.length; i += gap * 2) {
                lists[i] = mergeTwo(lists[i], lists[i + gap]);
            }
        }
        return lists[0];
    }

    // ---- helpers ----
    static ListNode build(int[] vals) {
        ListNode dummy = new ListNode(0), t = dummy;
        for (int v : vals) { t.next = new ListNode(v); t = t.next; }
        return dummy.next;
    }

    static ListNode[] buildAll(int[][] lists) {
        ListNode[] out = new ListNode[lists.length];
        for (int i = 0; i < lists.length; i++) out[i] = build(lists[i]);
        return out;
    }

    static List<Integer> toList(ListNode h) {
        List<Integer> out = new ArrayList<>();
        int guard = 0;
        while (h != null && guard++ < 100000) { out.add(h.val); h = h.next; }
        return out;
    }

    static List<Integer> oracle(int[][] lists) {
        List<Integer> all = new ArrayList<>();
        for (int[] l : lists) for (int v : l) all.add(v);
        Collections.sort(all);
        return all;
    }

    static int failures = 0;

    static void check(String label, int[][] input, int[] wantArr) {
        List<Integer> want = new ArrayList<>();
        for (int v : wantArr) want.add(v);

        List<Integer> h = toList(mergeKLists(buildAll(input)));
        List<Integer> b = toList(bruteMergeKLists(buildAll(input)));
        List<Integer> d = toList(dcMergeKLists(buildAll(input)));
        boolean ok = h.equals(want) && b.equals(want) && d.equals(want) && oracle(input).equals(want);
        if (!ok) failures++;
        System.out.println((ok ? "  ok   " : "  FAIL ") + label + "  -> heap " + h
            + ", brute " + b + ", d&c " + d + (ok ? "" : "  expected " + want));
    }

    public static void main(String[] args) {
        System.out.println("day 64 - Merge k Sorted Lists");

        check("example", new int[][] { { 1, 4, 5 }, { 1, 3, 4 }, { 2, 6 } },
              new int[] { 1, 1, 2, 3, 4, 4, 5, 6 });
        check("no lists",            new int[][] {},                                new int[] {});
        check("one empty list",      new int[][] { {} },                            new int[] {});
        check("all empty",           new int[][] { {}, {}, {} },                    new int[] {});
        check("some empty",          new int[][] { {}, { 1 }, {} },                 new int[] { 1 });
        check("single list",         new int[][] { { 1, 2, 3 } },                   new int[] { 1, 2, 3 });
        check("duplicates",          new int[][] { { 1, 1 }, { 1 }, { 1, 1 } },     new int[] { 1, 1, 1, 1, 1 });
        check("negatives",           new int[][] { { -3, 0 }, { -5, 2 } },          new int[] { -5, -3, 0, 2 });
        check("many tiny lists",     new int[][] { { 5 }, { 4 }, { 3 }, { 2 }, { 1 } }, new int[] { 1, 2, 3, 4, 5 });
        check("uneven lengths",      new int[][] { { 1, 2, 3, 4, 5, 6 }, { 0 } },   new int[] { 0, 1, 2, 3, 4, 5, 6 });

        // Relinking: the heap version must return the very nodes it was given.
        ListNode[] in = buildAll(new int[][] { { 1, 4, 5 }, { 1, 3, 4 }, { 2, 6 } });
        Set<ListNode> original = Collections.newSetFromMap(new IdentityHashMap<>());
        for (ListNode h : in) for (ListNode p = h; p != null; p = p.next) original.add(p);
        boolean reused = true; int count = 0;
        for (ListNode p = mergeKLists(in); p != null; p = p.next) { count++; if (!original.contains(p)) reused = false; }
        reused = reused && count == original.size();
        if (!reused) failures++;
        System.out.println((reused ? "  ok   " : "  FAIL ") + "heap version relinks all " + original.size() + " input nodes, allocates none");

        // Random comparison against the sort oracle.
        Random rnd = new Random(64);
        int agree = 0;
        for (int t = 0; t < 400; t++) {
            int k = rnd.nextInt(9);
            int[][] lists = new int[k][];
            for (int i = 0; i < k; i++) {
                int n = rnd.nextInt(7);
                int[] l = new int[n];
                for (int j = 0; j < n; j++) l[j] = rnd.nextInt(21) - 10;
                Arrays.sort(l);
                lists[i] = l;
            }
            List<Integer> want = oracle(lists);
            List<Integer> h = toList(mergeKLists(buildAll(lists)));
            List<Integer> b = toList(bruteMergeKLists(buildAll(lists)));
            List<Integer> d = toList(dcMergeKLists(buildAll(lists)));
            if (h.equals(want) && b.equals(want) && d.equals(want)) agree++;
            else {
                failures++;
                System.out.println("  FAIL random " + Arrays.deepToString(lists) + " -> " + h + " / " + b + " / " + d);
            }
        }
        System.out.println("  ok   " + agree + "/400 random cases, heap = brute = d&c = sorted oracle");

        System.out.println(failures == 0 ? "  day 64 PASSED" : "  day 64 had " + failures + " FAILURES");
    }
}
