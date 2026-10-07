// Correctness assertions for day 19 - Longest Substring Without Repeating
// Characters (LC 3).
//
// The brute force, the last-index implementation and the set-shrink template
// are copied verbatim from day-019.md. All three must agree on the worked
// examples, every edge case in the edge-cases section, and random strings.
// The two wrong variants the writeup warns about (no max(), restart on repeat)
// are also run, to prove they really fail where the prose says they do.

import java.util.*;

class Day19Test {

    // ---- brute force from the bruteForce section ----
    static int brute(String s) {
        int n = s.length();
        int best = 0;

        for (int i = 0; i < n; i++) {

            Set<Character> seen = new HashSet<>();

            for (int j = i; j < n; j++) {
                char c = s.charAt(j);
                if (seen.contains(c)) {
                    break;
                }
                seen.add(c);
                best = Math.max(best, j - i + 1);
            }
        }

        return best;
    }

    // ---- optimal from the implementation section ----
    static int lengthOfLongestSubstring(String s) {
        int[] last = new int[128];
        Arrays.fill(last, -1);

        int left = 0;
        int best = 0;

        for (int right = 0; right < s.length(); right++) {
            char c = s.charAt(right);

            left = Math.max(left, last[c] + 1);

            last[c] = right;
            best = Math.max(best, right - left + 1);
        }

        return best;
    }

    // ---- set-shrink template from the implementation section ----
    static int setVersion(String s) {
        Set<Character> window = new HashSet<>();
        int left = 0;
        int best = 0;

        for (int right = 0; right < s.length(); right++) {
            char c = s.charAt(right);

            while (window.contains(c)) {
                window.remove(s.charAt(left));
                left++;
            }

            window.add(c);
            best = Math.max(best, right - left + 1);
        }

        return best;
    }

    // Wrong variant 1: no max(), left can move backwards.
    static int noMax(String s) {
        int[] last = new int[128];
        Arrays.fill(last, -1);
        int left = 0, best = 0;
        for (int right = 0; right < s.length(); right++) {
            char c = s.charAt(right);
            if (last[c] >= 0) left = last[c] + 1;
            last[c] = right;
            best = Math.max(best, right - left + 1);
        }
        return best;
    }

    // Wrong variant 2: on a repeat, throw the window away and restart at right.
    static int restart(String s) {
        Set<Character> window = new HashSet<>();
        int left = 0, best = 0;
        for (int right = 0; right < s.length(); right++) {
            char c = s.charAt(right);
            if (window.contains(c)) { window.clear(); left = right; }
            window.add(c);
            best = Math.max(best, right - left + 1);
        }
        return best;
    }

    static int failures = 0;

    static void check(String label, String s, int want) {
        int a = lengthOfLongestSubstring(s), b = brute(s), c = setVersion(s);
        boolean ok = a == want && b == want && c == want;
        if (!ok) failures++;
        System.out.println((ok ? "  ok   " : "  FAIL ") + label + "  \"" + s + "\" -> jump " + a
            + ", brute " + b + ", set " + c + (ok ? "" : "  expected " + want));
    }

    static void wrong(String label, int got, int claimed) {
        boolean ok = got == claimed;
        if (!ok) failures++;
        System.out.println((ok ? "  ok   " : "  FAIL ") + label + " gives " + got + (ok ? " as the writeup says" : ", writeup claims " + claimed));
    }

    public static void main(String[] args) {
        System.out.println("day 19 - Longest Substring Without Repeating Characters");

        check("example abcabcbb", "abcabcbb", 3);
        check("example bbbbb",    "bbbbb", 1);
        check("example pwwkew",   "pwwkew", 3);
        check("empty",            "", 0);
        check("single space",     " ", 1);
        check("all distinct",     "abcdef", 6);
        check("abba",             "abba", 2);
        check("tmmzuxt",          "tmmzuxt", 5);
        check("dvdf",             "dvdf", 3);
        check("digits and symbols", "a1!a", 3);

        wrong("no-max variant on \"abcabcbb\"", noMax("abcabcbb"), 3);
        wrong("no-max variant on \"abba\"", noMax("abba"), 3);
        wrong("no-max variant on \"tmmzuxt\"", noMax("tmmzuxt"), 6);
        wrong("restart variant on \"dvdf\"", restart("dvdf"), 2);

        Random rnd = new Random(19);
        String alpha = "abcde 1!";
        int agree = 0;
        for (int t = 0; t < 600; t++) {
            int n = rnd.nextInt(30);
            StringBuilder sb = new StringBuilder();
            int k = 1 + rnd.nextInt(alpha.length());
            for (int i = 0; i < n; i++) sb.append(alpha.charAt(rnd.nextInt(k)));
            String s = sb.toString();
            int a = lengthOfLongestSubstring(s), b = brute(s), c = setVersion(s);
            if (a == b && b == c) agree++;
            else {
                failures++;
                System.out.println("  FAIL random \"" + s + "\" -> " + a + " / " + b + " / " + c);
            }
        }
        System.out.println("  ok   " + agree + "/600 random strings, jump == set == brute force");

        System.out.println(failures == 0 ? "  day 19 PASSED" : "  day 19 had " + failures + " FAILURES");
    }
}
