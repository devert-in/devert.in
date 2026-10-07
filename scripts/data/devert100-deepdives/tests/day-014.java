// Correctness assertions for day 14 - Longest Palindromic Substring (LC 5).
//
// The brute force and the expand-around-center solution are copied verbatim
// from day-014.md. Every edge case checks the exact string the writeup claims.
// The randomized run checks both return a palindrome of the same (maximal)
// length that really is a substring of s - any longest answer is accepted by
// LeetCode, but both versions are in fact expected to return the same one.

import java.util.*;

class Day14Test {

    // ---- brute force from the bruteForce section ----
    static String longestPalindromeBrute(String s) {
        int n = s.length();
        int bestStart = 0, bestLen = 0;

        for (int i = 0; i < n; i++) {
            for (int j = i; j < n; j++) {
                if (isPalindrome(s, i, j) && j - i + 1 > bestLen) {
                    bestStart = i;
                    bestLen = j - i + 1;
                }
            }
        }

        return s.substring(bestStart, bestStart + bestLen);
    }

    static boolean isPalindrome(String s, int l, int r) {
        while (l < r) {
            if (s.charAt(l) != s.charAt(r)) {
                return false;
            }
            l++;
            r--;
        }
        return true;
    }

    // ---- implementation section ----
    static String longestPalindrome(String s) {
        int start = 0, maxLen = 0;

        for (int i = 0; i < s.length(); i++) {
            int odd = expand(s, i, i);        // center on a character
            int even = expand(s, i, i + 1);   // center on the gap after it
            int len = Math.max(odd, even);

            if (len > maxLen) {
                maxLen = len;
                start = i - (len - 1) / 2;
            }
        }

        return s.substring(start, start + maxLen);
    }

    // Grow outward while both ends match; return the palindrome's length.
    static int expand(String s, int l, int r) {
        while (l >= 0 && r < s.length() && s.charAt(l) == s.charAt(r)) {
            l--;
            r++;
        }
        return r - l - 1;
    }

    // Longest common substring of a and b - used only to confirm the
    // "reverse and compare" trap really produces a non-palindrome.
    static String lcs(String a, String b) {
        int[][] dp = new int[a.length() + 1][b.length() + 1];
        int best = 0, end = 0;
        for (int i = 1; i <= a.length(); i++)
            for (int j = 1; j <= b.length(); j++)
                if (a.charAt(i - 1) == b.charAt(j - 1)) {
                    dp[i][j] = dp[i - 1][j - 1] + 1;
                    if (dp[i][j] > best) { best = dp[i][j]; end = i; }
                }
        return a.substring(end - best, end);
    }

    static int failures = 0;

    static void check(String label, String s, String want) {
        String a = longestPalindromeBrute(s), b = longestPalindrome(s);
        boolean ok = a.equals(want) && b.equals(want);
        if (!ok) failures++;
        System.out.println((ok ? "  ok   " : "  FAIL ") + label + "  \"" + s + "\" -> \"" + b + "\""
            + (ok ? "" : "  brute \"" + a + "\" expected \"" + want + "\""));
    }

    static void claim(String label, boolean holds) {
        if (!holds) failures++;
        System.out.println((holds ? "  ok   " : "  FAIL ") + label);
    }

    public static void main(String[] args) {
        System.out.println("day 14 - Longest Palindromic Substring");

        check("example babad",          "babad", "bab");
        check("example cbbd",           "cbbd", "bb");
        check("single character",       "a", "a");
        check("two different",          "ac", "a");
        check("two equal",              "bb", "bb");
        check("all the same",           "aaaa", "aaaa");
        check("whole string",           "racecar", "racecar");
        check("no repeats",             "abcde", "a");
        check("palindrome in middle",   "forgeeksskeegfor", "geeksskeeg");
        check("reverse-compare trap",   "abacdfgdcaba", "aba");

        // Claims made in the prose.
        String trap = lcs("abacdfgdcaba", new StringBuilder("abacdfgdcaba").reverse().toString());
        claim("LCS(s, reverse(s)) on the trap is \"" + trap + "\", not a palindrome",
            trap.equals("abacd") && !isPalindrome(trap, 0, trap.length() - 1));
        claim("expand on \"babad\" even center (4,5) returns 0", expand("babad", 4, 5) == 0);
        claim("expand on \"babad\" odd center (1,1) returns 3", expand("babad", 1, 1) == 3);

        // Randomized: brute force vs expand around center. Small alphabets so
        // long palindromes are common.
        Random rnd = new Random(14);
        int agree = 0, trials = 600;
        for (int t = 0; t < trials; t++) {
            int n = 1 + rnd.nextInt(40);
            int k = 1 + rnd.nextInt(3);
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < n; i++) sb.append((char) ('a' + rnd.nextInt(k)));
            String s = sb.toString();
            String a = longestPalindromeBrute(s), b = longestPalindrome(s);
            boolean ok = a.length() == b.length() && isPalindrome(b, 0, b.length() - 1)
                && s.contains(b) && a.equals(b);
            if (ok) agree++;
            else {
                failures++;
                System.out.println("  FAIL random \"" + s + "\" -> brute \"" + a + "\" expand \"" + b + "\"");
            }
        }
        System.out.println("  ok   " + agree + "/" + trials + " random cases, same palindrome from both versions");

        System.out.println(failures == 0 ? "  day 14 PASSED" : "  day 14 had " + failures + " FAILURES");
    }
}
