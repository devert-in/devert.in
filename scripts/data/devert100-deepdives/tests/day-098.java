// Correctness assertions for day 98 - LRU Cache.
//
// The three published designs (ArrayList brute force, HashMap + own doubly
// linked list, LinkedHashMap) are copied verbatim from day-098.md as nested
// static classes - only their names differ, since they cannot all be called
// LRUCache in one file. They are run against LeetCode's example, every edge
// case in the writeup, and long random operation sequences.

import java.util.*;

class Day98Test {

    // ---- brute force: ArrayList of [key, value], oldest first ----
    static class BruteLRU {

        private final int capacity;
        // Oldest entry at index 0, most recently used at the end.
        private final List<int[]> entries = new ArrayList<>();

        public BruteLRU(int capacity) {
            this.capacity = capacity;
        }

        public int get(int key) {
            for (int i = 0; i < entries.size(); i++) {
                if (entries.get(i)[0] == key) {
                    int[] entry = entries.remove(i);   // shifts everything after i
                    entries.add(entry);                // now the most recent
                    return entry[1];
                }
            }
            return -1;
        }

        public void put(int key, int value) {
            for (int i = 0; i < entries.size(); i++) {
                if (entries.get(i)[0] == key) {
                    entries.remove(i);
                    break;
                }
            }
            if (entries.size() == capacity) {
                entries.remove(0);                     // evict the oldest
            }
            entries.add(new int[] { key, value });
        }
    }

    // ---- implementation: HashMap + doubly linked list with sentinels ----
    static class LRUCache {

        private static class DNode {
            int key, value;
            DNode prev, next;

            DNode(int key, int value) {
                this.key = key;
                this.value = value;
            }
        }

        private final int capacity;
        private final Map<Integer, DNode> map = new HashMap<>();
        private final DNode head = new DNode(0, 0);   // sentinel: head.next = most recent
        private final DNode tail = new DNode(0, 0);   // sentinel: tail.prev = least recent

        public LRUCache(int capacity) {
            this.capacity = capacity;
            head.next = tail;
            tail.prev = head;
        }

        public int get(int key) {
            DNode node = map.get(key);
            if (node == null) return -1;
            remove(node);
            addFirst(node);              // touched -> most recent
            return node.value;
        }

        public void put(int key, int value) {
            DNode node = map.get(key);
            if (node != null) {          // update: new value, and it counts as a use
                node.value = value;
                remove(node);
                addFirst(node);
                return;
            }
            if (map.size() == capacity) {
                DNode lru = tail.prev;
                remove(lru);
                map.remove(lru.key);     // the reason each node stores its key
            }
            DNode fresh = new DNode(key, value);
            map.put(key, fresh);
            addFirst(fresh);
        }

        private void remove(DNode node) {
            node.prev.next = node.next;
            node.next.prev = node.prev;
        }

        private void addFirst(DNode node) {
            node.next = head.next;
            node.prev = head;
            head.next.prev = node;
            head.next = node;
        }

        // test-only: list order head -> tail, and map/list size agreement
        String order() {
            StringBuilder s = new StringBuilder("[");
            for (DNode x = head.next; x != tail; x = x.next) s.append(s.length() > 1 ? ", " : "").append(x.key).append(':').append(x.value);
            return s.append(']').toString();
        }
        boolean consistent() {
            int n = 0;
            for (DNode x = head.next; x != tail; x = x.next) { n++; if (map.get(x.key) != x || x.next.prev != x) return false; }
            return n == map.size() && n <= capacity;
        }
    }

    // ---- library version: LinkedHashMap in access order ----
    static class LinkedLRU {

        private final int capacity;
        private final LinkedHashMap<Integer, Integer> cache;

        public LinkedLRU(int capacity) {
            this.capacity = capacity;
            // true = order by access, not by insertion
            this.cache = new LinkedHashMap<>(16, 0.75f, true) {
                @Override
                protected boolean removeEldestEntry(Map.Entry<Integer, Integer> eldest) {
                    return size() > LinkedLRU.this.capacity;
                }
            };
        }

        public int get(int key) {
            return cache.getOrDefault(key, -1);
        }

        public void put(int key, int value) {
            cache.put(key, value);
        }
    }

    static int failures = 0;

    static void report(boolean ok, String msg) {
        if (!ok) failures++;
        System.out.println((ok ? "  ok   " : "  FAIL ") + msg);
    }

    // ops: {0, k} = get(k), {1, k, v} = put(k, v). Returns the get results.
    static List<Integer> runAll(int cap, int[][] ops, List<Integer> b, List<Integer> l, LRUCache[] keep) {
        BruteLRU br = new BruteLRU(cap);
        LRUCache lr = new LRUCache(cap);
        LinkedLRU lk = new LinkedLRU(cap);
        List<Integer> out = new ArrayList<>();
        for (int[] op : ops) {
            if (op[0] == 0) { out.add(lr.get(op[1])); b.add(br.get(op[1])); l.add(lk.get(op[1])); }
            else { lr.put(op[1], op[2]); br.put(op[1], op[2]); lk.put(op[1], op[2]); }
        }
        if (keep != null) keep[0] = lr;
        return out;
    }

    static void check(String label, int cap, int[][] ops, Integer... want) {
        List<Integer> b = new ArrayList<>(), l = new ArrayList<>();
        LRUCache[] keep = new LRUCache[1];
        List<Integer> got = runAll(cap, ops, b, l, keep);
        List<Integer> w = Arrays.asList(want);
        boolean ok = got.equals(w) && b.equals(w) && l.equals(w) && keep[0].consistent();
        report(ok, label + "  cap " + cap + " -> " + got + (ok ? "" : "  brute " + b + " linked " + l + " expected " + w));
    }

    static int[] g(int k) { return new int[] { 0, k }; }
    static int[] p(int k, int v) { return new int[] { 1, k, v }; }

    public static void main(String[] args) {
        System.out.println("day 98 - LRU Cache");

        check("leetcode example", 2,
            new int[][] { p(1,1), p(2,2), g(1), p(3,3), g(2), p(4,4), g(1), g(3), g(4) }, 1, -1, -1, 3, 4);

        // Final list order after the example, as the optimization dry run shows.
        LRUCache ex = new LRUCache(2);
        ex.put(1,1); ex.put(2,2); ex.get(1);
        report(ex.order().equals("[1:1, 2:2]"), "after row 3 list is " + ex.order());
        ex.put(3,3);
        report(ex.order().equals("[3:3, 1:1]"), "after row 4 list is " + ex.order());
        ex.get(2); ex.put(4,4); ex.get(1); ex.get(3); ex.get(4);
        report(ex.order().equals("[4:4, 3:3]"), "after row 9 list is " + ex.order());

        check("capacity 1", 1, new int[][] { p(1,1), p(2,2), g(1), g(2) }, -1, 2);
        check("update does not evict", 2, new int[][] { p(1,1), p(2,2), p(1,10), g(1), g(2) }, 10, 2);
        check("update counts as use", 2, new int[][] { p(1,1), p(2,2), p(1,10), p(3,3), g(1), g(2), g(3) }, 10, -1, 3);
        check("get counts as use", 2, new int[][] { p(1,1), p(2,2), g(1), p(3,3), g(2) }, 1, -1);
        check("missed get changes nothing", 2, new int[][] { p(1,1), p(2,2), g(9), p(3,3), g(1) }, -1, -1);
        check("get on empty", 2, new int[][] { g(1) }, -1);
        check("key and value 0", 2, new int[][] { p(0,0), g(0) }, 0);
        check("repeated puts same key", 2, new int[][] { p(1,1), p(2,2), p(2,5), p(2,6), g(1), g(2) }, 1, 6);

        Random rnd = new Random(146);
        int agree = 0;
        for (int t = 0; t < 400; t++) {
            int cap = 1 + rnd.nextInt(4);
            int n = 1 + rnd.nextInt(40);
            int[][] ops = new int[n][];
            for (int i = 0; i < n; i++) ops[i] = rnd.nextBoolean() ? g(rnd.nextInt(6)) : p(rnd.nextInt(6), rnd.nextInt(100));
            List<Integer> b = new ArrayList<>(), l = new ArrayList<>();
            LRUCache[] keep = new LRUCache[1];
            List<Integer> got = runAll(cap, ops, b, l, keep);
            if (got.equals(b) && got.equals(l) && keep[0].consistent()) agree++;
            else report(false, "random cap " + cap + " got " + got + " brute " + b + " linked " + l);
        }
        report(agree == 400, agree + "/400 random op sequences, all three designs agree, map and list in sync");

        // Scale: 2 * 10^5 calls at capacity 3000 finish quickly on the O(1) version.
        LRUCache big = new LRUCache(3000);
        long start = System.nanoTime();
        for (int i = 0; i < 200000; i++) {
            if ((i & 1) == 0) big.put(rnd.nextInt(10001), i);
            else big.get(rnd.nextInt(10001));
        }
        long ms = (System.nanoTime() - start) / 1_000_000;
        report(big.consistent() && ms < 2000, "200000 calls at capacity 3000 in " + ms + " ms, structure consistent");

        System.out.println(failures == 0 ? "  day 98 PASSED" : "  day 98 had " + failures + " FAILURES");
    }
}
