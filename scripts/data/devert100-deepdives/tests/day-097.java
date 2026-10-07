// Correctness assertions for day 97 - Edit Distance.
//
// All four published versions (plain recursion, memoised recursion, 2D table,
// rolling row) are copied verbatim from day-097.md. They must agree with each
// other and with every output the edge-cases section claims, and the call
// counts quoted in "Where it hurts" are re-measured here.

import java.util.*;

class Day97Test {

    // ---- brute force (plain recursion) ----
    static int bruteCalls = 0;
    static int brute(String word1, String word2) {
        return solve(word1, word2, word1.length(), word2.length());
    }
    static int solve(String word1, String word2, int i, int j) {
        bruteCalls++;
        if (i == 0) return j;          // insert the j chars still missing
        if (j == 0) return i;          // delete the i chars still left over

        if (word1.charAt(i - 1) == word2.charAt(j - 1)) {
            return solve(word1, word2, i - 1, j - 1);   // last chars agree - free
        }

        int delete  = solve(word1, word2, i - 1, j);
        int insert  = solve(word1, word2, i, j - 1);
        int replace = solve(word1, word2, i - 1, j - 1);
        return 1 + Math.min(delete, Math.min(insert, replace));
    }

    // ---- memoised recursion from the optimization section ----
    static class Memo {
        private int[][] memo;

        public int minDistance(String word1, String word2) {
            memo = new int[word1.length() + 1][word2.length() + 1];
            for (int[] row : memo) Arrays.fill(row, -1);    // -1 = not computed yet
            return solve(word1, word2, word1.length(), word2.length());
        }

        private int solve(String word1, String word2, int i, int j) {
            if (i == 0) return j;
            if (j == 0) return i;
            if (memo[i][j] != -1) return memo[i][j];

            int result;
            if (word1.charAt(i - 1) == word2.charAt(j - 1)) {
                result = solve(word1, word2, i - 1, j - 1);
            } else {
                int delete  = solve(word1, word2, i - 1, j);
                int insert  = solve(word1, word2, i, j - 1);
                int replace = solve(word1, word2, i - 1, j - 1);
                result = 1 + Math.min(delete, Math.min(insert, replace));
            }
            memo[i][j] = result;
            return result;
        }
    }

    // ---- 2D table from the implementation section ----
    static int table(String word1, String word2) {
        int m = word1.length();
        int n = word2.length();
        int[][] dp = new int[m + 1][n + 1];
        for (int i = 0; i <= m; i++) dp[i][0] = i;   // delete everything
        for (int j = 0; j <= n; j++) dp[0][j] = j;   // insert everything
        for (int i = 1; i <= m; i++) {
            for (int j = 1; j <= n; j++) {
                if (word1.charAt(i - 1) == word2.charAt(j - 1)) {
                    dp[i][j] = dp[i - 1][j - 1];   // nothing to fix here
                } else {
                    int replace = dp[i - 1][j - 1];
                    int delete  = dp[i - 1][j];
                    int insert  = dp[i][j - 1];
                    dp[i][j] = 1 + Math.min(replace, Math.min(delete, insert));
                }
            }
        }
        return dp[m][n];
    }

    // ---- rolling row from the implementation section ----
    static int rolling(String word1, String word2) {
        int m = word1.length();
        int n = word2.length();
        int[] dp = new int[n + 1];
        for (int j = 0; j <= n; j++) dp[j] = j;        // row 0
        for (int i = 1; i <= m; i++) {
            int diag = dp[0];                         // old dp[i-1][0]
            dp[0] = i;                                // new dp[i][0]
            for (int j = 1; j <= n; j++) {
                int up = dp[j];                       // still row i-1
                if (word1.charAt(i - 1) == word2.charAt(j - 1)) {
                    dp[j] = diag;
                } else {
                    dp[j] = 1 + Math.min(diag, Math.min(up, dp[j - 1]));
                }
                diag = up;                            // becomes next cell's diagonal
            }
        }
        return dp[n];
    }

    static int failures = 0;

    static void report(boolean ok, String msg) {
        if (!ok) failures++;
        System.out.println((ok ? "  ok   " : "  FAIL ") + msg);
    }

    static void check(String label, String a, String b, int want, boolean withBrute) {
        int t = table(a, b);
        int r = rolling(a, b);
        int mm = new Memo().minDistance(a, b);
        int br = withBrute ? brute(a, b) : want;
        boolean ok = t == want && r == want && mm == want && br == want;
        report(ok, label + "  \"" + a + "\" -> \"" + b + "\" = table " + t + ", rolling " + r
            + ", memo " + mm + (withBrute ? ", brute " + br : "") + (ok ? "" : "  expected " + want));
    }

    public static void main(String[] args) {
        System.out.println("day 97 - Edit Distance");

        check("traced example",     "abd", "bcd", 2, true);
        check("leetcode example 1", "horse", "ros", 3, true);
        check("leetcode example 2", "intention", "execution", 5, true);
        check("both empty",         "", "", 0, true);
        check("first empty",        "", "abc", 3, true);
        check("second empty",       "abc", "", 3, true);
        check("identical",          "abc", "abc", 0, true);
        check("nothing in common",  "abc", "xyz", 3, true);
        check("prefix",             "ab", "abcd", 2, true);
        check("swapped order",      "ab", "ba", 2, true);
        check("single differ",      "a", "b", 1, true);
        check("single same",        "a", "a", 0, true);
        check("sea / eat",          "sea", "eat", 2, true);

        // Call counts quoted in "Where it hurts".
        String[][] counts = { { "abd", "bcd" }, { "horse", "ros" }, { "sea", "eat" } };
        int[] wantCalls = { 15, 77, 50 };
        for (int k = 0; k < counts.length; k++) {
            bruteCalls = 0;
            brute(counts[k][0], counts[k][1]);
            report(bruteCalls == wantCalls[k], counts[k][0] + "/" + counts[k][1] + " brute calls " + bruteCalls
                + " (claimed " + wantCalls[k] + ")");
        }

        // Maximum size: two 500-char strings, table and rolling must agree.
        Random big = new Random(97);
        StringBuilder sa = new StringBuilder(), sb = new StringBuilder();
        for (int i = 0; i < 500; i++) { sa.append((char) ('a' + big.nextInt(26))); sb.append((char) ('a' + big.nextInt(26))); }
        int bt = table(sa.toString(), sb.toString()), brr = rolling(sa.toString(), sb.toString());
        report(bt == brr && bt <= 500, "500 x 500 table " + bt + " = rolling " + brr);

        Random rnd = new Random(72);
        int agree = 0;
        for (int t = 0; t < 400; t++) {
            String a = randomWord(rnd), b = randomWord(rnd);
            int want = brute(a, b);
            if (table(a, b) == want && rolling(a, b) == want && new Memo().minDistance(a, b) == want) agree++;
            else report(false, "random \"" + a + "\" -> \"" + b + "\" expected " + want);
        }
        report(agree == 400, agree + "/400 random cases, all versions agree with brute force");

        System.out.println(failures == 0 ? "  day 97 PASSED" : "  day 97 had " + failures + " FAILURES");
    }

    static String randomWord(Random rnd) {
        int n = rnd.nextInt(7);
        StringBuilder s = new StringBuilder();
        for (int i = 0; i < n; i++) s.append((char) ('a' + rnd.nextInt(3)));
        return s.toString();
    }
}
