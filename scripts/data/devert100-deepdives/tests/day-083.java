// Correctness assertions for day 83 - Merge Intervals (LC 56).
//
// Both published solutions (repeated pairwise scan, sort + sweep) are copied
// verbatim from day-083.md. The brute force may return groups in any order, so
// its output is sorted before comparing. Every edge case in the writeup is
// checked with the exact output it claims, plus the "missing max" bug the
// writeup describes, plus a randomized comparison against an independent
// coverage oracle.

import java.util.*;

class Day83Test {

    // ---- optimal, from the implementation section ----
    static int[][] merge(int[][] intervals) {
        Arrays.sort(intervals, (a, b) -> Integer.compare(a[0], b[0]));
        List<int[]> merged = new ArrayList<>();
        for (int[] current : intervals) {
            if (merged.isEmpty() || merged.get(merged.size() - 1)[1] < current[0]) {
                merged.add(new int[] { current[0], current[1] });
            } else {
                int[] last = merged.get(merged.size() - 1);
                last[1] = Math.max(last[1], current[1]);
            }
        }
        return merged.toArray(new int[merged.size()][]);
    }

    // ---- brute force, from the bruteForce section ----
    static int[][] mergeBrute(int[][] intervals) {
        List<int[]> list = new ArrayList<>();
        for (int[] in : intervals) {
            list.add(new int[] { in[0], in[1] });
        }
        boolean changed = true;
        while (changed) {
            changed = false;
            search:
            for (int i = 0; i < list.size(); i++) {
                for (int j = i + 1; j < list.size(); j++) {
                    int[] a = list.get(i);
                    int[] b = list.get(j);
                    if (a[0] <= b[1] && b[0] <= a[1]) {
                        a[0] = Math.min(a[0], b[0]);
                        a[1] = Math.max(a[1], b[1]);
                        list.remove(j);
                        changed = true;
                        break search;
                    }
                }
            }
        }
        return list.toArray(new int[list.size()][]);
    }

    // The bug the writeup warns about: last[1] = current[1] without max.
    static int[][] mergeNoMax(int[][] intervals) {
        Arrays.sort(intervals, (a, b) -> Integer.compare(a[0], b[0]));
        List<int[]> merged = new ArrayList<>();
        for (int[] current : intervals) {
            if (merged.isEmpty() || merged.get(merged.size() - 1)[1] < current[0]) {
                merged.add(new int[] { current[0], current[1] });
            } else {
                merged.get(merged.size() - 1)[1] = current[1];
            }
        }
        return merged.toArray(new int[merged.size()][]);
    }

    // The other bug: the same sweep with the sort removed.
    static int[][] sweepNoSort(int[][] intervals) {
        List<int[]> merged = new ArrayList<>();
        for (int[] current : intervals) {
            if (merged.isEmpty() || merged.get(merged.size() - 1)[1] < current[0]) {
                merged.add(new int[] { current[0], current[1] });
            } else {
                int[] last = merged.get(merged.size() - 1);
                last[1] = Math.max(last[1], current[1]);
            }
        }
        return merged.toArray(new int[merged.size()][]);
    }

    // Oracle: closed intervals on integers, coordinates doubled so that
    // [1,2] and [3,4] leave a gap at 5 while [1,4] and [4,5] stay joined.
    static int[][] oracle(int[][] intervals) {
        int max = 0;
        for (int[] in : intervals) max = Math.max(max, in[1]);
        boolean[] cov = new boolean[2 * max + 2];
        for (int[] in : intervals) for (int x = 2 * in[0]; x <= 2 * in[1]; x++) cov[x] = true;
        List<int[]> out = new ArrayList<>();
        int x = 0;
        while (x < cov.length) {
            if (!cov[x]) { x++; continue; }
            int s = x;
            while (x < cov.length && cov[x]) x++;
            out.add(new int[] { s / 2, (x - 1) / 2 });
        }
        return out.toArray(new int[0][]);
    }

    static int[][] deep(int[][] a) {
        int[][] c = new int[a.length][];
        for (int i = 0; i < a.length; i++) c[i] = a[i].clone();
        return c;
    }

    static int[][] sorted(int[][] a) {
        int[][] c = deep(a);
        Arrays.sort(c, (p, q) -> p[0] != q[0] ? Integer.compare(p[0], q[0]) : Integer.compare(p[1], q[1]));
        return c;
    }

    static String str(int[][] a) { return Arrays.deepToString(a); }

    static int failures = 0;

    static void check(String label, int[][] input, int[][] want) {
        int[][] opt = merge(deep(input));
        int[][] bf = sorted(mergeBrute(deep(input)));
        boolean ok = Arrays.deepEquals(opt, want) && Arrays.deepEquals(bf, want);
        if (!ok) failures++;
        System.out.println((ok ? "  ok   " : "  FAIL ") + label + "  " + str(input)
            + " -> " + str(opt) + (ok ? "" : "  brute " + str(bf) + "  expected " + str(want)));
    }

    public static void main(String[] args) {
        System.out.println("day 83 - Merge Intervals");

        check("example", new int[][] { {1,3}, {2,6}, {8,10}, {15,18} }, new int[][] { {1,6}, {8,10}, {15,18} });
        check("unsorted example", new int[][] { {8,10}, {1,3}, {15,18}, {2,6} }, new int[][] { {1,6}, {8,10}, {15,18} });
        check("sort+max dry run", new int[][] { {8,10}, {1,10}, {2,3}, {9,12} }, new int[][] { {1,12} });
        check("single", new int[][] { {1,4} }, new int[][] { {1,4} });
        check("touching", new int[][] { {1,4}, {4,5} }, new int[][] { {1,5} });
        check("contained", new int[][] { {1,10}, {2,3} }, new int[][] { {1,10} });
        check("contained then overlap", new int[][] { {1,10}, {2,3}, {4,12} }, new int[][] { {1,12} });
        check("unsorted overlap", new int[][] { {1,4}, {0,4} }, new int[][] { {0,4} });
        check("unsorted disjoint", new int[][] { {1,4}, {0,0} }, new int[][] { {0,0}, {1,4} });
        check("chain", new int[][] { {1,3}, {3,5}, {5,7} }, new int[][] { {1,7} });
        check("none overlap", new int[][] { {1,2}, {3,4}, {5,6} }, new int[][] { {1,2}, {3,4}, {5,6} });
        check("duplicates", new int[][] { {1,3}, {1,3} }, new int[][] { {1,3} });
        check("equal points", new int[][] { {5,5}, {5,5} }, new int[][] { {5,5} });
        check("separate points", new int[][] { {0,0}, {1,1} }, new int[][] { {0,0}, {1,1} });
        check("where-it-hurts input", new int[][] { {1,1}, {3,3}, {5,5}, {7,7}, {9,10}, {10,11}, {11,12} },
            new int[][] { {1,1}, {3,3}, {5,5}, {7,7}, {9,12} });

        // The writeup's claim about the missing-max bug.
        int[][] bug = mergeNoMax(new int[][] { {1,10}, {2,3}, {4,12} });
        boolean bugAsClaimed = Arrays.deepEquals(bug, new int[][] { {1,3}, {4,12} });
        int[][] bug2 = mergeNoMax(new int[][] { {8,10}, {1,10}, {2,3}, {9,12} });
        boolean bug2AsClaimed = Arrays.deepEquals(bug2, new int[][] { {1,3}, {8,12} });
        if (!bugAsClaimed || !bug2AsClaimed) failures++;
        System.out.println((bugAsClaimed && bug2AsClaimed ? "  ok   " : "  FAIL ")
            + "without max: " + str(bug) + " and " + str(bug2) + " (wrong, as the writeup says)");

        // The writeup's claim about skipping the sort: both unsorted edge
        // cases collapse to [[1,4]].
        int[][] u1 = sweepNoSort(new int[][] { {1,4}, {0,4} });
        int[][] u2 = sweepNoSort(new int[][] { {1,4}, {0,0} });
        boolean noSortAsClaimed = Arrays.deepEquals(u1, new int[][] { {1,4} }) && Arrays.deepEquals(u2, new int[][] { {1,4} });
        if (!noSortAsClaimed) failures++;
        System.out.println((noSortAsClaimed ? "  ok   " : "  FAIL ")
            + "without sort: " + str(u1) + " and " + str(u2) + " (wrong, as the writeup says)");

        Random rnd = new Random(83);
        int agree = 0;
        for (int t = 0; t < 600; t++) {
            int n = 1 + rnd.nextInt(12);
            int[][] in = new int[n][];
            for (int i = 0; i < n; i++) {
                int s = rnd.nextInt(30);
                in[i] = new int[] { s, s + rnd.nextInt(6) };
            }
            int[][] want = oracle(in);
            int[][] opt = merge(deep(in));
            int[][] bf = sorted(mergeBrute(deep(in)));
            if (Arrays.deepEquals(opt, want) && Arrays.deepEquals(bf, want)) agree++;
            else {
                failures++;
                System.out.println("  FAIL random " + str(in) + " -> " + str(opt) + " / " + str(bf) + " expected " + str(want));
            }
        }
        System.out.println("  ok   " + agree + "/600 random cases match the coverage oracle, both versions");

        System.out.println(failures == 0 ? "  day 83 PASSED" : "  day 83 had " + failures + " FAILURES");
    }
}
