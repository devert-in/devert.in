// Correctness assertions for day 11 - Longest Common Prefix.
//
// The every-length brute force and the vertical scan are copied verbatim from
// day-011.md. Both must return the expected prefix on the LeetCode examples
// and every edge case listed (including the empty array). The comparison
// counts the dry runs claim (12 for brute force, 6 for vertical scan on
// ["flower","flow","flight"]) are recomputed with instrumented copies, the
// sort-first alternative is checked on the example, and 1000 random arrays
// compare both versions against a simple pairwise oracle.

import java.util.*;

class Day11Test {

    // ---- brute force from the bruteForce section ----
    static String lcpBrute(String[] strs) {
        if (strs == null || strs.length == 0) {
            return "";
        }
        int best = 0;
        for (int len = 1; len <= strs[0].length(); len++) {
            String candidate = strs[0].substring(0, len);
            boolean allMatch = true;
            for (int j = 1; j < strs.length; j++) {
                if (!strs[j].startsWith(candidate)) {
                    allMatch = false;
                    break;
                }
            }
            if (!allMatch) {
                break;
            }
            best = len;
        }
        return strs[0].substring(0, best);
    }

    // ---- vertical scan from the implementation section ----
    static String longestCommonPrefix(String[] strs) {
        if (strs == null || strs.length == 0) {
            return "";
        }
        for (int i = 0; i < strs[0].length(); i++) {
            char c = strs[0].charAt(i);
            for (int j = 1; j < strs.length; j++) {
                if (i == strs[j].length() || strs[j].charAt(i) != c) {
                    return strs[0].substring(0, i);
                }
            }
        }
        return strs[0];
    }

    // Oracle: shrink a running prefix pairwise.
    static String oracle(String[] strs) {
        if (strs.length == 0) return "";
        String p = strs[0];
        for (String s : strs) {
            int k = 0;
            while (k < p.length() && k < s.length() && p.charAt(k) == s.charAt(k)) k++;
            p = p.substring(0, k);
        }
        return p;
    }

    // Instrumented copies: count character comparisons as the dry-run tables do.
    static int bruteComparisons(String[] strs) {
        int comps = 0;
        for (int len = 1; len <= strs[0].length(); len++) {
            String cand = strs[0].substring(0, len);
            boolean all = true;
            for (int j = 1; j < strs.length; j++) {
                int k = 0;
                boolean ok = true;
                while (k < cand.length()) {
                    if (k >= strs[j].length()) { ok = false; break; }
                    comps++;
                    if (strs[j].charAt(k) != cand.charAt(k)) { ok = false; break; }
                    k++;
                }
                if (!ok) { all = false; break; }
            }
            if (!all) break;
        }
        return comps;
    }

    static int verticalComparisons(String[] strs) {
        int comps = 0;
        for (int i = 0; i < strs[0].length(); i++) {
            char c = strs[0].charAt(i);
            for (int j = 1; j < strs.length; j++) {
                if (i == strs[j].length()) return comps;
                comps++;
                if (strs[j].charAt(i) != c) return comps;
            }
        }
        return comps;
    }

    static int failures = 0;

    static void check(String label, String[] strs, String want) {
        String a = lcpBrute(strs), b = longestCommonPrefix(strs);
        boolean ok = a.equals(want) && b.equals(want);
        if (!ok) failures++;
        System.out.println((ok ? "  ok   " : "  FAIL ") + label + "  " + Arrays.toString(strs)
            + " -> brute \"" + a + "\", vertical \"" + b + "\"" + (ok ? "" : "  expected \"" + want + "\""));
    }

    static void claim(String label, boolean holds) {
        if (!holds) failures++;
        System.out.println((holds ? "  ok   " : "  FAIL ") + label);
    }

    public static void main(String[] args) {
        System.out.println("day 11 - Longest Common Prefix");

        check("LC example 1",         new String[] { "flower", "flow", "flight" }, "fl");
        check("LC example 2",         new String[] { "dog", "racecar", "car" }, "");
        check("runs out",             new String[] { "flower", "flow" }, "flow");
        check("single string",        new String[] { "alone" }, "alone");
        check("empty first",          new String[] { "", "b" }, "");
        check("empty later",          new String[] { "abc", "" }, "");
        check("first longer",         new String[] { "ab", "a" }, "a");
        check("first shortest",       new String[] { "a", "ab" }, "a");
        check("all identical",        new String[] { "abc", "abc", "abc" }, "abc");
        check("shorter is prefix",    new String[] { "flow", "flower", "flowing" }, "flow");
        check("mismatch in last",     new String[] { "abcd", "abcd", "abxd" }, "ab");
        check("empty array",          new String[] {}, "");

        String[] ex = { "flower", "flow", "flight" };
        int bc = bruteComparisons(ex), vc = verticalComparisons(ex);
        claim("brute force does " + bc + " char comparisons on the example (claimed 12)", bc == 12);
        claim("vertical scan does " + vc + " char comparisons on the example (claimed 6)", vc == 6);

        String[] sorted = ex.clone();
        Arrays.sort(sorted);
        String sp = oracle(new String[] { sorted[0], sorted[sorted.length - 1] });
        claim("sort-first alternative: sorted " + Arrays.toString(sorted) + ", first/last prefix \"" + sp + "\"",
            sorted[0].equals("flight") && sorted[2].equals("flower") && sp.equals("fl"));

        Random rnd = new Random(11);
        int agree = 0;
        for (int t = 0; t < 1000; t++) {
            int n = 1 + rnd.nextInt(5);
            String base = randomWord(rnd, rnd.nextInt(6));
            String[] strs = new String[n];
            for (int i = 0; i < n; i++) {
                int keep = rnd.nextInt(base.length() + 1);
                strs[i] = base.substring(0, keep) + randomWord(rnd, rnd.nextInt(4));
            }
            String want = oracle(strs);
            String a = lcpBrute(strs), b = longestCommonPrefix(strs);
            String sortedP;
            String[] ss = strs.clone(); Arrays.sort(ss);
            sortedP = oracle(new String[] { ss[0], ss[ss.length - 1] });
            if (a.equals(want) && b.equals(want) && sortedP.equals(want)) agree++;
            else { failures++; System.out.println("  FAIL random " + Arrays.toString(strs) + " -> " + a + " / " + b + " / " + sortedP); }
        }
        System.out.println("  ok   " + agree + "/1000 random cases, brute, vertical and sort-first agree with oracle");

        System.out.println(failures == 0 ? "  day 11 PASSED" : "  day 11 had " + failures + " FAILURES");
    }

    static String randomWord(Random rnd, int len) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < len; i++) sb.append((char) ('a' + rnd.nextInt(3)));
        return sb.toString();
    }
}
