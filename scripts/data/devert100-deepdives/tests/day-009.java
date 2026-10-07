// Correctness assertions for day 9 - Valid Palindrome.
//
// The clean-and-reverse brute force and the two-pointer solution are copied
// verbatim from day-009.md. Both must agree with the expected answer on the
// LeetCode examples, the page's worked example, and every edge case listed.
// The two named bugs (no l < r guard in the skip loop; isLetter instead of
// isLetterOrDigit; calling toString after reverse) are reproduced and must
// misbehave exactly as the writeup says. 1000 random strings over a small
// alphabet of letters, digits and junk compare the two versions.

import java.util.*;

class Day9Test {

    // ---- brute force from the bruteForce section ----
    static boolean isPalindromeBrute(String s) {
        StringBuilder cleaned = new StringBuilder();
        for (char c : s.toCharArray()) {
            if (Character.isLetterOrDigit(c)) {
                cleaned.append(Character.toLowerCase(c));
            }
        }
        String forward = cleaned.toString();
        String backward = cleaned.reverse().toString();
        return forward.equals(backward);
    }

    // ---- optimal from the implementation section ----
    static boolean isPalindrome(String s) {
        int l = 0;
        int r = s.length() - 1;
        while (l < r) {
            while (l < r && !Character.isLetterOrDigit(s.charAt(l))) {
                l++;
            }
            while (l < r && !Character.isLetterOrDigit(s.charAt(r))) {
                r--;
            }
            if (Character.toLowerCase(s.charAt(l)) != Character.toLowerCase(s.charAt(r))) {
                return false;
            }
            l++;
            r--;
        }
        return true;
    }

    // ---- named bugs ----
    static boolean noGuard(String s) {
        int l = 0, r = s.length() - 1;
        while (l < r) {
            while (!Character.isLetterOrDigit(s.charAt(l))) l++;
            while (!Character.isLetterOrDigit(s.charAt(r))) r--;
            if (Character.toLowerCase(s.charAt(l)) != Character.toLowerCase(s.charAt(r))) return false;
            l++; r--;
        }
        return true;
    }

    static boolean lettersOnly(String s) {
        int l = 0, r = s.length() - 1;
        while (l < r) {
            while (l < r && !Character.isLetter(s.charAt(l))) l++;
            while (l < r && !Character.isLetter(s.charAt(r))) r--;
            if (Character.toLowerCase(s.charAt(l)) != Character.toLowerCase(s.charAt(r))) return false;
            l++; r--;
        }
        return true;
    }

    static boolean reverseThenToString(String s) {
        StringBuilder cleaned = new StringBuilder();
        for (char c : s.toCharArray()) if (Character.isLetterOrDigit(c)) cleaned.append(Character.toLowerCase(c));
        String backward = cleaned.reverse().toString();
        String forward = cleaned.toString();
        return forward.equals(backward);
    }

    static int failures = 0;

    static void check(String label, String s, boolean want) {
        boolean a = isPalindromeBrute(s);
        boolean b = isPalindrome(s);
        boolean ok = a == want && b == want;
        if (!ok) failures++;
        System.out.println((ok ? "  ok   " : "  FAIL ") + label + "  \"" + s + "\" -> brute " + a + ", two-pointer " + b
            + (ok ? "" : "  expected " + want));
    }

    static void claim(String label, boolean holds) {
        if (!holds) failures++;
        System.out.println((holds ? "  ok   " : "  FAIL ") + label);
    }

    public static void main(String[] args) {
        System.out.println("day 9 - Valid Palindrome");

        check("LC example 1",      "A man, a plan, a canal: Panama", true);
        check("LC example 2",      "race a car", false);
        check("LC example 3",      " ", true);
        check("worked example",    "Race, car!", true);
        check("only junk",         ".,", true);
        check("digit vs letter",   "0P", false);
        check("digits palindrome", "1a1", true);
        check("case only",         "Aa", true);
        check("single letter",     "a", true);
        check("single junk",       "!", true);
        check("two different",     "ab", false);
        check("junk one side",     "a.", true);
        check("junk both sides",   ".a.", true);
        check("mismatch at ends",  "ab, c, d, e, f, g, h, i, x", false);

        // Bugs named in the writeup.
        boolean threw = false;
        try { noGuard(".,"); } catch (StringIndexOutOfBoundsException e) { threw = true; }
        claim("no l < r guard throws on \".,\"", threw);
        claim("isLetter instead of isLetterOrDigit returns true on \"0P\"", lettersOnly("0P"));
        claim("raw char compare returns false on \"Aa\"", 'A' != 'a');
        claim("toString after reverse calls \"ab\" a palindrome", reverseThenToString("ab"));

        Random rnd = new Random(9);
        String alphabet = "aAbB01 ,.!:";
        int agree = 0;
        for (int t = 0; t < 1000; t++) {
            int n = rnd.nextInt(12);
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < n; i++) sb.append(alphabet.charAt(rnd.nextInt(alphabet.length())));
            // Bias half the cases toward real palindromes so both outcomes are covered.
            String s = sb.toString();
            if (t % 2 == 0) s = s + new StringBuilder(s).reverse();
            if (isPalindrome(s) == isPalindromeBrute(s)) agree++;
            else { failures++; System.out.println("  FAIL random \"" + s + "\""); }
        }
        System.out.println("  ok   " + agree + "/1000 random cases, two-pointer agrees with clean-and-reverse");

        System.out.println(failures == 0 ? "  day 9 PASSED" : "  day 9 had " + failures + " FAILURES");
    }
}
