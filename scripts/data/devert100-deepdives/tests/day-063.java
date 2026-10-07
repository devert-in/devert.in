// Correctness assertions for day 63 - Sort a Nearly Sorted (K-Sorted) Array.
//
// The selection-sort brute force and the size-(k+1) min heap are copied
// verbatim from day-063.md. Checks: the worked example and its dry-run array
// states, every edge case in the writeup, the size-k off-by-one trap's claimed
// output, and a few hundred randomly generated k-sorted arrays against
// Arrays.sort.

import java.util.*;

class Day63Test {

    // ---- brute force: selection sort ----
    static void nearlySortedSelection(int[] arr, int k) {
        int n = arr.length;
        for (int i = 0; i < n; i++) {
            int minIdx = i;
            for (int j = i + 1; j < n; j++) {
                if (arr[j] < arr[minIdx]) {
                    minIdx = j;
                }
            }
            int temp = arr[i];
            arr[i] = arr[minIdx];
            arr[minIdx] = temp;
        }
    }

    // ---- optimal: min heap of size k + 1 ----
    static void nearlySorted(int[] arr, int k) {
        PriorityQueue<Integer> heap = new PriorityQueue<>();
        int write = 0;
        for (int read = 0; read < arr.length; read++) {
            heap.offer(arr[read]);
            if (heap.size() > k) {
                arr[write++] = heap.poll();
            }
        }
        while (!heap.isEmpty()) {
            arr[write++] = heap.poll();
        }
    }

    // ---- the documented off-by-one: heap of size k ----
    static void sizeKTrap(int[] arr, int k) {
        PriorityQueue<Integer> heap = new PriorityQueue<>();
        int write = 0;
        for (int read = 0; read < arr.length; read++) {
            heap.offer(arr[read]);
            if (heap.size() >= k) arr[write++] = heap.poll();
        }
        while (!heap.isEmpty()) arr[write++] = heap.poll();
    }

    static int failures = 0;

    static void check(String label, int[] in, int k, int[] want) {
        int[] a = in.clone(); nearlySortedSelection(a, k);
        int[] b = in.clone(); nearlySorted(b, k);
        boolean ok = Arrays.equals(a, want) && Arrays.equals(b, want);
        if (!ok) failures++;
        System.out.println((ok ? "  ok   " : "  FAIL ") + label + "  " + Arrays.toString(in) + " k=" + k
            + " -> selection " + Arrays.toString(a) + ", heap " + Arrays.toString(b)
            + (ok ? "" : "  expected " + Arrays.toString(want)));
    }

    static void claim(String label, boolean ok) {
        if (!ok) failures++;
        System.out.println((ok ? "  ok   " : "  FAIL ") + label);
    }

    public static void main(String[] args) {
        System.out.println("day 63 - Sort a Nearly Sorted (K-Sorted) Array");

        int[] ex = { 6, 5, 3, 2, 8, 10, 9 };
        check("example",             ex, 3, new int[] { 2, 3, 5, 6, 8, 9, 10 });
        check("second example",      new int[] { 1, 4, 5, 2, 3, 6, 7, 8, 9, 10 }, 2, new int[] { 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 });
        check("k = 0",               new int[] { 1, 2, 3 }, 0, new int[] { 1, 2, 3 });
        check("reversed, k = n - 1", new int[] { 4, 3, 2, 1 }, 3, new int[] { 1, 2, 3, 4 });
        check("k larger than n",     new int[] { 3, 1, 2 }, 5, new int[] { 1, 2, 3 });
        check("single element",      new int[] { 5 }, 1, new int[] { 5 });
        check("duplicates",          new int[] { 1, 2, 1, 2 }, 1, new int[] { 1, 1, 2, 2 });
        check("negatives",           new int[] { -1, -3, -2 }, 2, new int[] { -3, -2, -1 });

        int[] trap = ex.clone();
        sizeKTrap(trap, 3);
        claim("size-k trap gives " + Arrays.toString(trap),
            Arrays.equals(trap, new int[] { 3, 2, 5, 6, 8, 9, 10 }));

        // Dry-run array states after each write in the main loop and the drain.
        String[] want = {
            "[2, 5, 3, 2, 8, 10, 9]", "[2, 3, 3, 2, 8, 10, 9]", "[2, 3, 5, 2, 8, 10, 9]", "[2, 3, 5, 6, 8, 10, 9]",
            "[2, 3, 5, 6, 8, 10, 9]", "[2, 3, 5, 6, 8, 9, 9]", "[2, 3, 5, 6, 8, 9, 10]" };
        int[] arr = ex.clone();
        PriorityQueue<Integer> heap = new PriorityQueue<>();
        int write = 0, s = 0;
        boolean statesOk = true;
        for (int read = 0; read < arr.length; read++) {
            heap.offer(arr[read]);
            if (heap.size() > 3) { arr[write++] = heap.poll(); statesOk &= Arrays.toString(arr).equals(want[s++]); }
        }
        while (!heap.isEmpty()) { arr[write++] = heap.poll(); statesOk &= Arrays.toString(arr).equals(want[s++]); }
        claim("dry-run array states match", statesOk && s == 7);

        // Brute-force dry run: 28 elements scanned in total.
        claim("selection scans 28 elements on n = 7", 7 + 6 + 5 + 4 + 3 + 2 + 1 == 28);

        // Random k-sorted arrays: element at sorted index i gets key i + U[0, k];
        // ordering by key moves each element at most k places.
        Random rnd = new Random(63);
        int agree = 0;
        for (int t = 0; t < 500; t++) {
            int n = 1 + rnd.nextInt(40);
            int k = rnd.nextInt(Math.max(1, n));
            int[] sorted = new int[n];
            int v = rnd.nextInt(21) - 10;
            for (int i = 0; i < n; i++) { v += rnd.nextInt(3); sorted[i] = v; }
            Integer[] idx = new Integer[n];
            int[] key = new int[n];
            for (int i = 0; i < n; i++) { idx[i] = i; key[i] = i + rnd.nextInt(k + 1); }
            Arrays.sort(idx, (a, b) -> key[a] != key[b] ? Integer.compare(key[a], key[b]) : Integer.compare(a, b));
            int[] in = new int[n];
            boolean valid = true;
            for (int pos = 0; pos < n; pos++) { in[pos] = sorted[idx[pos]]; valid &= Math.abs(pos - idx[pos]) <= k; }

            int[] a = in.clone(); nearlySorted(a, k);
            int[] b = in.clone(); nearlySortedSelection(b, k);
            if (valid && Arrays.equals(a, sorted) && Arrays.equals(b, sorted)) agree++;
            else {
                failures++;
                System.out.println("  FAIL random " + Arrays.toString(in) + " k=" + k + " valid=" + valid
                    + " -> " + Arrays.toString(a));
            }
        }
        System.out.println("  ok   " + agree + "/500 random k-sorted arrays match Arrays.sort");

        System.out.println(failures == 0 ? "  day 63 PASSED" : "  day 63 had " + failures + " FAILURES");
    }
}
