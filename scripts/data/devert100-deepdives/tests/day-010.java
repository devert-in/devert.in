// Correctness assertions for day 10 - Valid Anagram.
//
// The sort-and-compare brute force, the int[26] balance solution and the
// HashMap/code-point follow-up are copied verbatim from day-010.md. All three
// must agree on the LeetCode examples, every edge case listed, and 1000 random
// pairs (half built as real shuffles). The dry-run tables' final non-zero
// slots are recomputed, and the Unicode version is checked on a surrogate
// pair the int[26] version cannot handle.

import java.util.*;

class Day10Test {

    // ---- brute force from the bruteForce section ----
    static boolean isAnagramSort(String s, String t) {
        if (s.length() != t.length()) {
            return false;
        }
        char[] a = s.toCharArray();
        char[] b = t.toCharArray();
        Arrays.sort(a);
        Arrays.sort(b);
        return Arrays.equals(a, b);
    }

    // ---- optimal from the implementation section ----
    static boolean isAnagram(String s, String t) {
        if (s.length() != t.length()) {
            return false;
        }
        int[] count = new int[26];
        for (int i = 0; i < s.length(); i++) {
            count[s.charAt(i) - 'a']++;
            count[t.charAt(i) - 'a']--;
        }
        for (int c : count) {
            if (c != 0) {
                return false;
            }
        }
        return true;
    }

    // ---- Unicode follow-up from the implementation section ----
    static boolean isAnagramUnicode(String s, String t) {
        if (s.length() != t.length()) {
            return false;
        }
        Map<Integer, Integer> count = new HashMap<>();
        for (int cp : s.codePoints().toArray()) {
            count.merge(cp, 1, Integer::sum);
        }
        for (int cp : t.codePoints().toArray()) {
            count.merge(cp, -1, Integer::sum);
        }
        for (int v : count.values()) {
            if (v != 0) {
                return false;
            }
        }
        return true;
    }

    // Final non-zero slots of the balance table, as the dry-run tables print them.
    static String nonZero(String s, String t) {
        int[] count = new int[26];
        for (int i = 0; i < s.length(); i++) { count[s.charAt(i) - 'a']++; count[t.charAt(i) - 'a']--; }
        StringBuilder sb = new StringBuilder("{");
        for (int i = 0; i < 26; i++) if (count[i] != 0) {
            if (sb.length() > 1) sb.append(", ");
            sb.append((char) ('a' + i)).append(':').append(count[i]);
        }
        return sb.append('}').toString();
    }

    static int failures = 0;

    static void check(String label, String s, String t, boolean want) {
        boolean a = isAnagramSort(s, t), b = isAnagram(s, t), c = isAnagramUnicode(s, t);
        boolean ok = a == want && b == want && c == want;
        if (!ok) failures++;
        System.out.println((ok ? "  ok   " : "  FAIL ") + label + "  \"" + s + "\" / \"" + t + "\" -> sort " + a
            + ", int[26] " + b + ", map " + c + (ok ? "" : "  expected " + want));
    }

    static void claim(String label, boolean holds) {
        if (!holds) failures++;
        System.out.println((holds ? "  ok   " : "  FAIL ") + label);
    }

    public static void main(String[] args) {
        System.out.println("day 10 - Valid Anagram");

        check("LC example 1",          "anagram", "nagaram", true);
        check("LC example 2",          "rat", "car", false);
        check("different lengths",     "a", "ab", false);
        check("same set, diff counts", "aab", "abb", false);
        check("identical",             "abc", "abc", true);
        check("single same",           "a", "a", true);
        check("single different",      "a", "b", false);
        check("repeated letter",       "aaaa", "aaaa", true);
        check("repeated, one off",     "aaaa", "aaab", false);
        check("disjoint",              "abc", "xyz", false);
        check("listen / silent",       "listen", "silent", true);

        claim("dry run anagram/nagaram ends {}", nonZero("anagram", "nagaram").equals("{}"));
        claim("dry run rat/car ends {c:-1, t:1}", nonZero("rat", "car").equals("{c:-1, t:1}"));
        claim("aab/abb ends {a:1, b:-1}", nonZero("aab", "abb").equals("{a:1, b:-1}"));
        String r6 = nonZero("abc", "xyz");
        claim("abc/xyz has six non-zero slots " + r6, r6.split(",").length == 6);

        // Unicode follow-up: a surrogate-pair character (U+1F600) and accented letters.
        String smile = new String(Character.toChars(0x1F600));
        claim("unicode: accented letters rearranged are anagrams",isAnagramUnicode("ée", "eé"));
        claim("unicode: surrogate pair rearranged is an anagram", isAnagramUnicode("a" + smile, smile + "a"));
        claim("unicode: surrogate pair vs two letters is not", !isAnagramUnicode(smile, "ab"));

        Random rnd = new Random(10);
        int agree = 0;
        for (int iter = 0; iter < 1000; iter++) {
            int n = 1 + rnd.nextInt(10);
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < n; i++) sb.append((char) ('a' + rnd.nextInt(4)));
            String s = sb.toString();
            String t;
            if (iter % 2 == 0) {
                List<Character> cs = new ArrayList<>();
                for (char c : s.toCharArray()) cs.add(c);
                Collections.shuffle(cs, rnd);
                StringBuilder tb = new StringBuilder();
                for (char c : cs) tb.append(c);
                t = tb.toString();
            } else {
                int m = 1 + rnd.nextInt(10);
                StringBuilder tb = new StringBuilder();
                for (int i = 0; i < m; i++) tb.append((char) ('a' + rnd.nextInt(4)));
                t = tb.toString();
            }
            boolean a = isAnagramSort(s, t), b = isAnagram(s, t), c = isAnagramUnicode(s, t);
            if (a == b && b == c) agree++;
            else { failures++; System.out.println("  FAIL random \"" + s + "\" / \"" + t + "\""); }
        }
        System.out.println("  ok   " + agree + "/1000 random cases, all three versions agree");

        System.out.println(failures == 0 ? "  day 10 PASSED" : "  day 10 had " + failures + " FAILURES");
    }
}
