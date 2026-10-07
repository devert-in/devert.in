// Correctness assertions for day 20 - Longest Repeating Character
// Replacement (LC 424).
//
// The brute force, the stale-maxFreq implementation and the exact (rescan)
// version are copied verbatim from day-020.md. All three must agree with each
// other and with a from-scratch oracle (no early break) on the worked example,
// every edge case, and random strings. The writeup's two structural claims are
// checked too: with a stale maxFreq the while loop runs at most once per step,
// and the final window on the worked example ("ABBA") is genuinely invalid.

import java.util.*;

class Day20Test {

    // ---- brute force from the bruteForce section ----
    static int brute(String s, int k) {
        int n = s.length();
        int best = 0;

        for (int i = 0; i < n; i++) {

            int[] count = new int[26];
            int maxFreq = 0;

            for (int j = i; j < n; j++) {
                int c = s.charAt(j) - 'A';
                count[c]++;
                maxFreq = Math.max(maxFreq, count[c]);

                if ((j - i + 1) - maxFreq > k) {
                    break;
                }
                best = Math.max(best, j - i + 1);
            }
        }

        return best;
    }

    // ---- optimal from the implementation section ----
    static int characterReplacement(String s, int k) {
        int[] count = new int[26];
        int left = 0;
        int maxFreq = 0;
        int best = 0;

        for (int right = 0; right < s.length(); right++) {

            int c = s.charAt(right) - 'A';
            count[c]++;
            maxFreq = Math.max(maxFreq, count[c]);

            while ((right - left + 1) - maxFreq > k) {
                count[s.charAt(left) - 'A']--;
                left++;
            }

            best = Math.max(best, right - left + 1);
        }

        return best;
    }

    // ---- exact version from the implementation section ----
    static int exact(String s, int k) {
        int[] count = new int[26];
        int left = 0, maxFreq = 0, best = 0;

        for (int right = 0; right < s.length(); right++) {
            int c = s.charAt(right) - 'A';
            count[c]++;
            maxFreq = Math.max(maxFreq, count[c]);

            while ((right - left + 1) - maxFreq > k) {
                count[s.charAt(left) - 'A']--;
                left++;
                maxFreq = 0;
                for (int f : count) maxFreq = Math.max(maxFreq, f);
            }

            best = Math.max(best, right - left + 1);
        }

        return best;
    }

    // Oracle: every substring, counted from scratch, no early break.
    static int oracle(String s, int k) {
        int best = 0;
        for (int i = 0; i < s.length(); i++)
            for (int j = i; j < s.length(); j++) {
                int[] cnt = new int[26];
                int mx = 0;
                for (int t = i; t <= j; t++) mx = Math.max(mx, ++cnt[s.charAt(t) - 'A']);
                if ((j - i + 1) - mx <= k) best = Math.max(best, j - i + 1);
            }
        return best;
    }

    // Instrumented copy of the optimal: returns {max while-iterations in one step, left at end}.
    static int[] instrument(String s, int k) {
        int[] count = new int[26];
        int left = 0, maxFreq = 0, worst = 0;
        for (int right = 0; right < s.length(); right++) {
            int c = s.charAt(right) - 'A';
            count[c]++;
            maxFreq = Math.max(maxFreq, count[c]);
            int loops = 0;
            while ((right - left + 1) - maxFreq > k) {
                count[s.charAt(left) - 'A']--;
                left++;
                loops++;
            }
            worst = Math.max(worst, loops);
        }
        return new int[] { worst, left };
    }

    static int failures = 0;

    static void check(String label, String s, int k, int want) {
        int a = characterReplacement(s, k), b = brute(s, k), c = exact(s, k), d = oracle(s, k);
        boolean ok = a == want && b == want && c == want && d == want;
        if (!ok) failures++;
        System.out.println((ok ? "  ok   " : "  FAIL ") + label + "  \"" + s + "\", k=" + k + " -> stale " + a
            + ", brute " + b + ", exact " + c + ", oracle " + d + (ok ? "" : "  expected " + want));
    }

    static void claim(String label, boolean ok) {
        if (!ok) failures++;
        System.out.println((ok ? "  ok   " : "  FAIL ") + label);
    }

    public static void main(String[] args) {
        System.out.println("day 20 - Longest Repeating Character Replacement");

        check("example",                 "AABABBA", 1, 4);
        check("LeetCode example 1",      "ABAB", 2, 4);
        check("no changes allowed",      "AABBBA", 0, 3);
        check("all one letter",          "AAAA", 0, 4);
        check("all different, k=0",      "ABCD", 0, 1);
        check("budget equals n",         "ABC", 3, 3);
        check("single character",        "A", 0, 1);
        check("changes at both ends",    "BAAAB", 2, 5);

        // The stale window at the end of the worked example is "ABBA" and needs 2 changes.
        int[] ins = instrument("AABABBA", 1);
        String finalWindow = "AABABBA".substring(ins[1]);
        claim("final stale window is \"" + finalWindow + "\" (needs 2 changes, k = 1)", finalWindow.equals("ABBA"));

        Random rnd = new Random(20);
        int agree = 0, maxLoops = 0;
        for (int t = 0; t < 500; t++) {
            int n = 1 + rnd.nextInt(25);
            int letters = 1 + rnd.nextInt(4);
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < n; i++) sb.append((char) ('A' + rnd.nextInt(letters)));
            String s = sb.toString();
            int k = rnd.nextInt(n + 1);
            int a = characterReplacement(s, k), b = brute(s, k), c = exact(s, k), d = oracle(s, k);
            maxLoops = Math.max(maxLoops, instrument(s, k)[0]);
            if (a == d && b == d && c == d) agree++;
            else {
                failures++;
                System.out.println("  FAIL random \"" + s + "\" k=" + k + " -> " + a + " / " + b + " / " + c + " oracle " + d);
            }
        }
        System.out.println("  ok   " + agree + "/500 random cases, stale == exact == brute == oracle");
        claim("stale-maxFreq while loop ran at most " + maxLoops + " time(s) per step (claim: at most once)", maxLoops <= 1);

        System.out.println(failures == 0 ? "  day 20 PASSED" : "  day 20 had " + failures + " FAILURES");
    }
}
