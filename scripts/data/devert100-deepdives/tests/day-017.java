// Correctness assertions for day 17 - 3Sum (LC 15).
//
// The three-loop brute force and the sort + two pointers solution are copied
// verbatim from day-017.md. Output order does not matter on LeetCode, so
// results are compared as sorted lists of triplets - but the two-pointer
// output must ALSO contain no duplicate triplet on its own (the skips are the
// uniqueness guarantee, no set to hide behind). The prose's claims about the
// "compare with nums[i + 1]" bug and the missing inner skip are checked too.

import java.util.*;

class Day17Test {

    // ---- brute force from the bruteForce section ----
    static List<List<Integer>> threeSumBrute(int[] nums) {
        int n = nums.length;
        Set<List<Integer>> found = new LinkedHashSet<>();

        for (int i = 0; i < n; i++) {
            for (int j = i + 1; j < n; j++) {
                for (int k = j + 1; k < n; k++) {
                    if (nums[i] + nums[j] + nums[k] == 0) {
                        List<Integer> t = Arrays.asList(nums[i], nums[j], nums[k]);
                        Collections.sort(t);    // canonical order, so the set can dedupe
                        found.add(t);
                    }
                }
            }
        }

        return new ArrayList<>(found);
    }

    // ---- implementation section ----
    static List<List<Integer>> threeSum(int[] nums) {
        Arrays.sort(nums);
        int n = nums.length;
        List<List<Integer>> result = new ArrayList<>();

        for (int i = 0; i < n - 2; i++) {
            if (nums[i] > 0) break;                          // smallest is positive: no more zeros
            if (i > 0 && nums[i] == nums[i - 1]) continue;   // same first value, same triplets

            int l = i + 1, r = n - 1;
            while (l < r) {
                int sum = nums[i] + nums[l] + nums[r];
                if (sum < 0) {
                    l++;
                } else if (sum > 0) {
                    r--;
                } else {
                    result.add(Arrays.asList(nums[i], nums[l], nums[r]));
                    l++;
                    r--;
                    while (l < r && nums[l] == nums[l - 1]) l++;   // skip repeated second values
                    while (l < r && nums[r] == nums[r + 1]) r--;   // skip repeated third values
                }
            }
        }

        return result;
    }

    // Bug variants named in the writeup.
    static List<List<Integer>> skipNext(int[] nums) {      // nums[i] == nums[i + 1]
        Arrays.sort(nums);
        int n = nums.length;
        List<List<Integer>> result = new ArrayList<>();
        for (int i = 0; i < n - 2; i++) {
            if (nums[i] > 0) break;
            if (nums[i] == nums[i + 1]) continue;
            int l = i + 1, r = n - 1;
            while (l < r) {
                int sum = nums[i] + nums[l] + nums[r];
                if (sum < 0) l++;
                else if (sum > 0) r--;
                else {
                    result.add(Arrays.asList(nums[i], nums[l], nums[r]));
                    l++; r--;
                    while (l < r && nums[l] == nums[l - 1]) l++;
                    while (l < r && nums[r] == nums[r + 1]) r--;
                }
            }
        }
        return result;
    }

    static List<List<Integer>> noInnerSkip(int[] nums) {
        Arrays.sort(nums);
        int n = nums.length;
        List<List<Integer>> result = new ArrayList<>();
        for (int i = 0; i < n - 2; i++) {
            if (nums[i] > 0) break;
            if (i > 0 && nums[i] == nums[i - 1]) continue;
            int l = i + 1, r = n - 1;
            while (l < r) {
                int sum = nums[i] + nums[l] + nums[r];
                if (sum < 0) l++;
                else if (sum > 0) r--;
                else { result.add(Arrays.asList(nums[i], nums[l], nums[r])); l++; r--; }
            }
        }
        return result;
    }

    // Canonical form: each triplet sorted, list of triplets sorted.
    static List<List<Integer>> canon(List<List<Integer>> in) {
        List<List<Integer>> out = new ArrayList<>();
        for (List<Integer> t : in) { List<Integer> c = new ArrayList<>(t); Collections.sort(c); out.add(c); }
        out.sort((a, b) -> {
            for (int k = 0; k < 3; k++) if (!a.get(k).equals(b.get(k))) return a.get(k) - b.get(k);
            return 0;
        });
        return out;
    }

    static boolean noDuplicates(List<List<Integer>> res) {
        return new HashSet<>(canon(res)).size() == res.size();
    }

    static int failures = 0;

    static List<List<Integer>> T(int[]... ts) {
        List<List<Integer>> out = new ArrayList<>();
        for (int[] t : ts) out.add(Arrays.asList(t[0], t[1], t[2]));
        return out;
    }

    static void check(String label, int[] input, List<List<Integer>> want) {
        List<List<Integer>> a = threeSumBrute(input.clone()), b = threeSum(input.clone());
        boolean ok = canon(a).equals(canon(want)) && canon(b).equals(canon(want)) && noDuplicates(b);
        if (!ok) failures++;
        System.out.println((ok ? "  ok   " : "  FAIL ") + label + "  " + Arrays.toString(input) + " -> " + b
            + (ok ? "" : "  brute " + a + " expected " + want));
    }

    static void claim(String label, boolean holds) {
        if (!holds) failures++;
        System.out.println((holds ? "  ok   " : "  FAIL ") + label);
    }

    public static void main(String[] args) {
        System.out.println("day 17 - 3Sum");

        check("example",                 new int[] { -1, 0, 1, 2, -1, -4 }, T(new int[] { -1, -1, 2 }, new int[] { -1, 0, 1 }));
        check("no triplet",              new int[] { 0, 1, 1 }, T());
        check("three zeros",             new int[] { 0, 0, 0 }, T(new int[] { 0, 0, 0 }));
        check("many zeros",              new int[] { 0, 0, 0, 0 }, T(new int[] { 0, 0, 0 }));
        check("all positive",            new int[] { 1, 2, 3 }, T());
        check("all negative",            new int[] { -3, -2, -1 }, T());
        check("dup second/third values", new int[] { -2, 0, 0, 2, 2 }, T(new int[] { -2, 0, 2 }));
        check("repeated value used twice", new int[] { -1, -1, 2 }, T(new int[] { -1, -1, 2 }));
        check("several share first value", new int[] { 3, 0, -2, -1, 1, 2 },
            T(new int[] { -2, -1, 3 }, new int[] { -2, 0, 2 }, new int[] { -1, 0, 1 }));

        // Exact output order of the dry run.
        claim("dry run output order is [[-1, -1, 2], [-1, 0, 1]]",
            threeSum(new int[] { -1, 0, 1, 2, -1, -4 }).equals(T(new int[] { -1, -1, 2 }, new int[] { -1, 0, 1 })));
        claim("brute force output order is [[-1, 0, 1], [-1, -1, 2]]",
            threeSumBrute(new int[] { -1, 0, 1, 2, -1, -4 }).equals(T(new int[] { -1, 0, 1 }, new int[] { -1, -1, 2 })));

        // Bug claims.
        claim("skip-with-nums[i+1] loses [-1, -1, 2]", skipNext(new int[] { -1, -1, 2 }).isEmpty());
        List<List<Integer>> dup = noInnerSkip(new int[] { -2, 0, 0, 2, 2 });
        claim("no inner skip returns [-2, 0, 2] twice: " + dup,
            dup.size() == 2 && dup.get(0).equals(dup.get(1)) && dup.get(0).equals(Arrays.asList(-2, 0, 2)));

        // Randomized: two pointers vs brute force, small value range for many duplicates.
        Random rnd = new Random(17);
        int agree = 0, trials = 500;
        for (int t = 0; t < trials; t++) {
            int n = 3 + rnd.nextInt(30);
            int range = rnd.nextBoolean() ? 3 : 10;
            int[] in = new int[n];
            for (int i = 0; i < n; i++) in[i] = rnd.nextInt(2 * range + 1) - range;
            List<List<Integer>> a = threeSumBrute(in.clone()), b = threeSum(in.clone());
            if (canon(a).equals(canon(b)) && noDuplicates(b)) agree++;
            else {
                failures++;
                System.out.println("  FAIL random " + Arrays.toString(in) + " brute " + canon(a) + " two-pointer " + canon(b));
            }
        }
        System.out.println("  ok   " + agree + "/" + trials + " random cases, same triplets, no duplicates");

        System.out.println(failures == 0 ? "  day 17 PASSED" : "  day 17 had " + failures + " FAILURES");
    }
}
