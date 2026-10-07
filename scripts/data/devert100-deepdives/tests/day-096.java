// Correctness assertions for day 96 - Longest Common Subsequence (LC 1143).
//
// The brute-force recursion, the 2D table and the two-row rolling version are
// copied verbatim from day-096.md. All three must agree on the worked example,
// every edge case, and random string pairs checked against an exhaustive
// oracle. The call-count claims (15 calls on the example, 39 on "abc"/"xyz"),
// the finished grid, the reconstruction to "ace" and the greedy-trap value
// are each checked too.

import java.util.*;

class Day96Test {

    // ---- brute force ----
    static class Brute {
        public int longestCommonSubsequence(String text1, String text2) {
            return lcs(text1, text2, text1.length(), text2.length());
        }

        private int lcs(String a, String b, int i, int j) {
            if (i == 0 || j == 0) {
                return 0;
            }
            if (a.charAt(i - 1) == b.charAt(j - 1)) {
                return 1 + lcs(a, b, i - 1, j - 1);
            }
            return Math.max(lcs(a, b, i - 1, j), lcs(a, b, i, j - 1));
        }
    }

    // ---- 2D implementation ----
    static class Table {
        public int longestCommonSubsequence(String text1, String text2) {

            int m = text1.length(), n = text2.length();

            int[][] dp = new int[m + 1][n + 1];

            for (int i = 1; i <= m; i++) {
                for (int j = 1; j <= n; j++) {
                    if (text1.charAt(i - 1) == text2.charAt(j - 1)) {
                        dp[i][j] = 1 + dp[i - 1][j - 1];
                    } else {
                        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
                    }
                }
            }

            return dp[m][n];
        }
    }

    // ---- two rolling rows ----
    static class Rolling {
        public int longestCommonSubsequence(String text1, String text2) {

            int m = text1.length(), n = text2.length();
            int[] prev = new int[n + 1];
            int[] curr = new int[n + 1];

            for (int i = 1; i <= m; i++) {
                for (int j = 1; j <= n; j++) {
                    if (text1.charAt(i - 1) == text2.charAt(j - 1)) {
                        curr[j] = 1 + prev[j - 1];
                    } else {
                        curr[j] = Math.max(prev[j], curr[j - 1]);
                    }
                }
                int[] tmp = prev;
                prev = curr;
                curr = tmp;
            }

            return prev[n];
        }
    }

    static int calls;
    static int countedLcs(String a, String b, int i, int j) {
        calls++;
        if (i == 0 || j == 0) return 0;
        if (a.charAt(i - 1) == b.charAt(j - 1)) return 1 + countedLcs(a, b, i - 1, j - 1);
        return Math.max(countedLcs(a, b, i - 1, j), countedLcs(a, b, i, j - 1));
    }

    static int greedy(String a, String b) {
        int pos = 0, count = 0;
        for (char c : a.toCharArray()) {
            int k = b.indexOf(c, pos);
            if (k >= 0) { count++; pos = k + 1; }
        }
        return count;
    }

    // Oracle: every subsequence of a (short), check it is a subsequence of b.
    static int oracle(String a, String b) {
        int best = 0;
        for (int m = 0; m < (1 << a.length()); m++) {
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < a.length(); i++) if ((m >> i & 1) == 1) sb.append(a.charAt(i));
            String s = sb.toString();
            int p = 0;
            for (int i = 0; i < b.length() && p < s.length(); i++) if (b.charAt(i) == s.charAt(p)) p++;
            if (p == s.length()) best = Math.max(best, s.length());
        }
        return best;
    }

    static int failures = 0;

    static void check(String label, String a, String b, int want) {
        int x = new Table().longestCommonSubsequence(a, b);
        int y = new Rolling().longestCommonSubsequence(a, b);
        int z = new Brute().longestCommonSubsequence(a, b);
        boolean ok = x == want && y == want && z == want;
        if (!ok) failures++;
        System.out.println((ok ? "  ok   " : "  FAIL ") + label + "  \"" + a + "\", \"" + b
            + "\" -> table " + x + ", rolling " + y + ", brute " + z + (ok ? "" : "  expected " + want));
    }

    static void claim(String label, boolean holds) {
        if (!holds) failures++;
        System.out.println((holds ? "  ok   " : "  FAIL ") + label);
    }

    public static void main(String[] args) {
        System.out.println("day 96 - Longest Common Subsequence");

        check("example",               "abcde", "ace", 3);
        check("identical",             "abc", "abc", 3);
        check("nothing in common",     "abc", "def", 0);
        check("single match",          "a", "a", 1);
        check("single mismatch",       "a", "b", 0);
        check("opposite order",        "abc", "cba", 1);
        check("repeated chars",        "aaaa", "aa", 2);
        check("different lengths",     "bl", "yby", 1);
        check("greedy trap",           "cab", "abc", 2);
        check("no-overlap worst case", "abc", "xyz", 0);

        calls = 0; countedLcs("abcde", "ace", 5, 3);
        claim("brute force makes 15 calls on the example: " + calls, calls == 15);
        calls = 0; countedLcs("abc", "xyz", 3, 3);
        claim("brute force makes 39 calls on \"abc\"/\"xyz\": " + calls, calls == 39);
        claim("greedy first-match gives 1 on \"cab\"/\"abc\"", greedy("cab", "abc") == 1);

        // Finished grid and reconstruction.
        String a = "abcde", b = "ace";
        int[][] dp = new int[6][4];
        for (int i = 1; i <= 5; i++)
            for (int j = 1; j <= 3; j++)
                dp[i][j] = a.charAt(i - 1) == b.charAt(j - 1) ? 1 + dp[i - 1][j - 1] : Math.max(dp[i - 1][j], dp[i][j - 1]);
        int[][] grid = { {0,0,0,0}, {0,1,1,1}, {0,1,1,1}, {0,1,2,2}, {0,1,2,2}, {0,1,2,3} };
        claim("finished grid matches the dry run", Arrays.deepEquals(dp, grid));
        StringBuilder sb = new StringBuilder();
        int i = 5, j = 3;
        while (i > 0 && j > 0) {
            if (a.charAt(i - 1) == b.charAt(j - 1)) { sb.append(a.charAt(i - 1)); i--; j--; }
            else if (dp[i - 1][j] >= dp[i][j - 1]) i--;
            else j--;
        }
        claim("walk-back reconstructs \"ace\"", sb.reverse().toString().equals("ace"));

        Random rnd = new Random(96);
        int agree = 0;
        for (int t = 0; t < 500; t++) {
            int alpha = 2 + rnd.nextInt(4);
            String s1 = randomString(rnd, rnd.nextInt(11), alpha);
            String s2 = randomString(rnd, rnd.nextInt(11), alpha);
            int w = oracle(s1, s2);
            if (new Table().longestCommonSubsequence(s1, s2) == w
                && new Rolling().longestCommonSubsequence(s1, s2) == w
                && new Brute().longestCommonSubsequence(s1, s2) == w) agree++;
            else {
                failures++;
                System.out.println("  FAIL random \"" + s1 + "\", \"" + s2 + "\"");
            }
        }
        System.out.println("  ok   " + agree + "/500 random cases, all three match subsequence oracle");

        int agreeBig = 0;
        for (int t = 0; t < 100; t++) {
            String s1 = randomString(rnd, 1 + rnd.nextInt(300), 26);
            String s2 = randomString(rnd, 1 + rnd.nextInt(300), 26);
            if (new Table().longestCommonSubsequence(s1, s2) == new Rolling().longestCommonSubsequence(s1, s2)) agreeBig++;
            else { failures++; System.out.println("  FAIL big random"); }
        }
        System.out.println("  ok   " + agreeBig + "/100 larger random cases, rolling matches 2D table");

        System.out.println(failures == 0 ? "  day 96 PASSED" : "  day 96 had " + failures + " FAILURES");
    }

    static String randomString(Random rnd, int len, int alpha) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < len; i++) sb.append((char) ('a' + rnd.nextInt(alpha)));
        return sb.toString();
    }
}
