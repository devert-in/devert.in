// Correctness assertions for day 99 - Subsets.
//
// The three published solutions (any-order + HashSet brute force, backtracking
// with a start index, bitmask counting) are copied verbatim from day-099.md.
// Each must produce every subset exactly once; backtracking must produce them
// in the exact order the dry run shows; and the call / path counts quoted in
// the writeup are re-measured here.

import java.util.*;

class Day99Test {

    // ---- brute force: every ordered path, sorted and deduped ----
    static int bruteCalls = 0;
    static List<List<Integer>> bruteSubsets(int[] nums) {
        Set<List<Integer>> seen = new HashSet<>();
        List<List<Integer>> result = new ArrayList<>();
        explore(nums, new boolean[nums.length], new ArrayList<>(), seen, result);
        return result;
    }

    static void explore(int[] nums, boolean[] used, List<Integer> path,
                         Set<List<Integer>> seen, List<List<Integer>> result) {
        bruteCalls++;
        List<Integer> key = new ArrayList<>(path);
        Collections.sort(key);                     // [2,1] and [1,2] are one subset
        if (seen.add(key)) result.add(key);

        for (int i = 0; i < nums.length; i++) {
            if (used[i]) continue;
            used[i] = true;
            path.add(nums[i]);
            explore(nums, used, path, seen, result);
            path.remove(path.size() - 1);
            used[i] = false;
        }
    }

    // ---- implementation: backtracking with start ----
    static int btCalls = 0;
    static List<List<Integer>> subsets(int[] nums) {
        List<List<Integer>> result = new ArrayList<>();
        backtrack(nums, 0, new ArrayList<>(), result);
        return result;
    }

    static void backtrack(int[] nums, int start, List<Integer> path,
                           List<List<Integer>> result) {
        btCalls++;

        result.add(new ArrayList<>(path));      // every node is a subset - record a COPY

        for (int i = start; i < nums.length; i++) {
            path.add(nums[i]);                  // choose
            backtrack(nums, i + 1, path, result);   // explore: only later indices
            path.remove(path.size() - 1);       // un-choose
        }
    }

    // ---- bitmask version ----
    static List<List<Integer>> bitmask(int[] nums) {
        int n = nums.length;
        List<List<Integer>> result = new ArrayList<>();

        for (int mask = 0; mask < (1 << n); mask++) {
            List<Integer> subset = new ArrayList<>();
            for (int i = 0; i < n; i++) {
                if ((mask & (1 << i)) != 0) {    // bit i set -> nums[i] is in
                    subset.add(nums[i]);
                }
            }
            result.add(subset);
        }

        return result;
    }

    // The copy bug from the edge cases: adds the shared list itself.
    static List<List<Integer>> copyBug(int[] nums) {
        List<List<Integer>> result = new ArrayList<>();
        bug(nums, 0, new ArrayList<>(), result);
        return result;
    }
    static void bug(int[] nums, int start, List<Integer> path, List<List<Integer>> result) {
        result.add(path);
        for (int i = start; i < nums.length; i++) {
            path.add(nums[i]);
            bug(nums, i + 1, path, result);
            path.remove(path.size() - 1);
        }
    }

    // Canonical form: each subset sorted, then the list of subsets sorted.
    static List<List<Integer>> canon(List<List<Integer>> in) {
        List<List<Integer>> out = new ArrayList<>();
        for (List<Integer> s : in) { List<Integer> c = new ArrayList<>(s); Collections.sort(c); out.add(c); }
        out.sort((a, b) -> {
            if (a.size() != b.size()) return a.size() - b.size();
            for (int i = 0; i < a.size(); i++) if (!a.get(i).equals(b.get(i))) return a.get(i) - b.get(i);
            return 0;
        });
        return out;
    }

    static boolean isPowerSet(List<List<Integer>> got, int[] nums) {
        return got.size() == (1 << nums.length)
            && new HashSet<>(canon(got)).size() == got.size()
            && canon(got).equals(canon(bitmask(nums)));
    }

    static int failures = 0;

    static void report(boolean ok, String msg) {
        if (!ok) failures++;
        System.out.println((ok ? "  ok   " : "  FAIL ") + msg);
    }

    static void checkExact(String label, int[] nums, String want) {
        String got = subsets(nums).toString().replace(" ", "");
        boolean ok = got.equals(want.replace(" ", "")) && isPowerSet(subsets(nums), nums)
            && isPowerSet(bitmask(nums), nums) && isPowerSet(bruteSubsets(nums), nums);
        report(ok, label + "  " + Arrays.toString(nums) + " -> " + got + (ok ? "" : "  expected " + want));
    }

    public static void main(String[] args) {
        System.out.println("day 99 - Subsets");

        checkExact("example (dry-run order)", new int[] { 1, 2, 3 },
            "[[], [1], [1,2], [1,2,3], [1,3], [2], [2,3], [3]]");
        checkExact("single element",   new int[] { 0 },     "[[], [0]]");
        checkExact("negative numbers", new int[] { -1, 2 }, "[[], [-1], [-1,2], [2]]");
        checkExact("input not sorted", new int[] { 3, 1 },  "[[], [3], [3,1], [1]]");
        checkExact("empty input",      new int[] {},        "[[]]");

        // Brute-force dry run: 16 calls on [1,2,3], recording order as tabled.
        bruteCalls = 0;
        List<List<Integer>> br = bruteSubsets(new int[] { 1, 2, 3 });
        report(bruteCalls == 16, "brute force makes " + bruteCalls + " calls on [1,2,3] (claimed 16)");
        report(br.toString().replace(" ", "").equals("[[],[1],[1,2],[1,2,3],[1,3],[2],[2,3],[3]]"),
            "brute force records in table order " + br);

        btCalls = 0;
        subsets(new int[] { 1, 2, 3 });
        report(btCalls == 8, "backtracking makes " + btCalls + " calls on [1,2,3] (claimed 8)");

        // n = 10: 1024 subsets; brute force explores 9,864,101 paths.
        int[] ten = { -10, -7, -3, 0, 1, 2, 4, 6, 8, 10 };
        btCalls = 0;
        List<List<Integer>> all = subsets(ten);
        report(all.size() == 1024 && btCalls == 1024 && isPowerSet(all, ten),
            "n = 10 -> " + all.size() + " subsets, " + btCalls + " backtracking calls");
        bruteCalls = 0;
        bruteSubsets(ten);
        report(bruteCalls == 9864101, "n = 10 brute force explores " + bruteCalls + " paths (claimed 9,864,101)");

        // The copy bug: right count, all empty.
        List<List<Integer>> bugged = copyBug(new int[] { 1, 2 });
        report(bugged.toString().equals("[[], [], [], []]"), "copy bug on [1,2] gives " + bugged);

        // Duplicates (Subsets II note): 8 lists, [1,2] twice; 6 distinct.
        List<List<Integer>> dup = subsets(new int[] { 1, 2, 2 });
        int ones = 0;
        for (List<Integer> s : dup) if (s.equals(Arrays.asList(1, 2))) ones++;
        report(dup.size() == 8 && ones == 2 && new HashSet<>(dup).size() == 6,
            "[1,2,2] -> " + dup.size() + " lists, [1,2] appears " + ones + " times, " + new HashSet<>(dup).size() + " distinct");

        Random rnd = new Random(78);
        int agree = 0;
        for (int t = 0; t < 300; t++) {
            int n = rnd.nextInt(8);
            List<Integer> pool = new ArrayList<>();
            for (int v = -10; v <= 10; v++) pool.add(v);
            Collections.shuffle(pool, rnd);
            int[] nums = new int[n];
            for (int i = 0; i < n; i++) nums[i] = pool.get(i);
            List<List<Integer>> a = subsets(nums), b = bitmask(nums), c = bruteSubsets(nums);
            if (isPowerSet(a, nums) && isPowerSet(b, nums) && canon(c).equals(canon(a))) agree++;
            else report(false, "random " + Arrays.toString(nums));
        }
        report(agree == 300, agree + "/300 random distinct arrays, all three give the exact power set");

        System.out.println(failures == 0 ? "  day 99 PASSED" : "  day 99 had " + failures + " FAILURES");
    }
}
