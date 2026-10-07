// Correctness assertions for day 21 - Minimum Window Substring (LC 76).
//
// The brute force and the sliding-window implementation are copied verbatim
// from day-021.md. Both must agree with each other and with an O(n^3) oracle
// (every substring, coverage counted from scratch) on the worked example,
// every edge case in the edge-cases section, and random inputs. The "set
// instead of counts" bug the writeup warns about is run on "ABBA"/"AA" to
// prove it really returns "A".

import java.util.*;

class Day21Test {

    // ---- brute force from the bruteForce section ----
    static String brute(String s, String t) {
        int[] need = new int[128];
        for (int k = 0; k < t.length(); k++) {
            need[t.charAt(k)]++;
        }

        int bestStart = 0, bestLen = Integer.MAX_VALUE;

        for (int i = 0; i < s.length(); i++) {

            int[] remaining = need.clone();
            int missing = t.length();

            for (int j = i; j < s.length(); j++) {
                char c = s.charAt(j);
                if (remaining[c] > 0) {
                    missing--;
                }
                remaining[c]--;

                if (missing == 0) {
                    if (j - i + 1 < bestLen) {
                        bestLen = j - i + 1;
                        bestStart = i;
                    }
                    break;
                }
            }
        }

        return bestLen == Integer.MAX_VALUE ? "" : s.substring(bestStart, bestStart + bestLen);
    }

    // ---- optimal from the implementation section ----
    static String minWindow(String s, String t) {
        if (t.length() > s.length()) return "";

        int[] need = new int[128];
        for (int i = 0; i < t.length(); i++) {
            need[t.charAt(i)]++;
        }

        int missing = t.length();
        int left = 0;
        int bestStart = 0, bestLen = Integer.MAX_VALUE;

        for (int right = 0; right < s.length(); right++) {

            char c = s.charAt(right);
            if (need[c] > 0) missing--;
            need[c]--;

            while (missing == 0) {
                if (right - left + 1 < bestLen) {
                    bestLen = right - left + 1;
                    bestStart = left;
                }

                char d = s.charAt(left);
                need[d]++;
                if (need[d] > 0) missing++;
                left++;
            }
        }

        return bestLen == Integer.MAX_VALUE ? "" : s.substring(bestStart, bestStart + bestLen);
    }

    // Oracle: shortest covering substring, leftmost on ties, counted from scratch.
    static String oracle(String s, String t) {
        int[] need = new int[128];
        for (char c : t.toCharArray()) need[c]++;
        String best = "";
        for (int len = 1; len <= s.length() && best.isEmpty(); len++)
            for (int i = 0; i + len <= s.length(); i++) {
                int[] have = new int[128];
                for (int k = i; k < i + len; k++) have[s.charAt(k)]++;
                boolean ok = true;
                for (int c = 0; c < 128 && ok; c++) if (have[c] < need[c]) ok = false;
                if (ok) { best = s.substring(i, i + len); break; }
            }
        return best;
    }

    // The bug: track WHICH characters appeared (a set), not how many.
    static String setBug(String s, String t) {
        Set<Character> want = new HashSet<>();
        for (char c : t.toCharArray()) want.add(c);
        String best = "";
        for (int i = 0; i < s.length(); i++) {
            Set<Character> got = new HashSet<>();
            for (int j = i; j < s.length(); j++) {
                if (want.contains(s.charAt(j))) got.add(s.charAt(j));
                if (got.size() == want.size()) {
                    if (best.isEmpty() || j - i + 1 < best.length()) best = s.substring(i, j + 1);
                    break;
                }
            }
        }
        return best;
    }

    static int failures = 0;

    static void check(String label, String s, String t, String want) {
        String a = minWindow(s, t), b = brute(s, t), c = oracle(s, t);
        boolean ok = a.equals(want) && b.equals(want) && c.equals(want);
        if (!ok) failures++;
        System.out.println((ok ? "  ok   " : "  FAIL ") + label + "  s=\"" + s + "\" t=\"" + t + "\" -> window \"" + a
            + "\", brute \"" + b + "\", oracle \"" + c + "\"" + (ok ? "" : "  expected \"" + want + "\""));
    }

    public static void main(String[] args) {
        System.out.println("day 21 - Minimum Window Substring");

        check("example",                  "ADOBECODEBANC", "ABC", "BANC");
        check("duplicates in t",          "ABBA", "AA", "ABBA");
        check("t longer than s",          "a", "aa", "");
        check("character never present",  "a", "b", "");
        check("s equals t",               "a", "a", "a");
        check("whole string only window", "abc", "cba", "abc");
        check("case sensitivity",         "aA", "A", "A");
        check("spare copies",             "AAAB", "AB", "AB");

        String bug = setBug("ABBA", "AA");
        boolean bugShown = bug.equals("A");
        if (!bugShown) failures++;
        System.out.println((bugShown ? "  ok   " : "  FAIL ") + "set-based variant on ABBA/AA returns \"" + bug + "\" (writeup says \"A\")");

        Random rnd = new Random(21);
        String alpha = "ABCab";
        int agree = 0;
        for (int t = 0; t < 500; t++) {
            int n = 1 + rnd.nextInt(20), m = 1 + rnd.nextInt(5);
            int k = 1 + rnd.nextInt(alpha.length());
            StringBuilder sb = new StringBuilder(), tb = new StringBuilder();
            for (int i = 0; i < n; i++) sb.append(alpha.charAt(rnd.nextInt(k)));
            for (int i = 0; i < m; i++) tb.append(alpha.charAt(rnd.nextInt(k)));
            String s = sb.toString(), tt = tb.toString();
            String a = minWindow(s, tt), b = brute(s, tt), c = oracle(s, tt);
            // Ties are possible on random input (LeetCode excludes them); compare lengths
            // and require each answer to be a genuine covering window.
            boolean ok = a.length() == c.length() && b.length() == c.length()
                && (c.isEmpty() || (covers(a, tt) && covers(b, tt) && s.contains(a) && s.contains(b)));
            if (ok) agree++;
            else {
                failures++;
                System.out.println("  FAIL random s=\"" + s + "\" t=\"" + tt + "\" -> \"" + a + "\" / \"" + b + "\" oracle \"" + c + "\"");
            }
        }
        System.out.println("  ok   " + agree + "/500 random cases, window == brute == oracle (length, and genuinely covering)");

        System.out.println(failures == 0 ? "  day 21 PASSED" : "  day 21 had " + failures + " FAILURES");
    }

    static boolean covers(String w, String t) {
        int[] cnt = new int[128];
        for (char c : w.toCharArray()) cnt[c]++;
        for (char c : t.toCharArray()) if (--cnt[c] < 0) return false;
        return true;
    }
}
