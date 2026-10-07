// Correctness assertions for day 36 - Valid Parentheses.
//
// The brute force (repeated pair deletion), the stack implementation and the
// "push the expected closer" variant are copied verbatim from day-036.md. All
// three must agree on every edge case in the writeup and on random bracket
// strings, checked against an independent recursive-descent oracle. Also
// checks the complexity section's claim that a per-type counter wrongly
// accepts "([)]", and the brute force's pass count on "(((())))".

import java.util.*;

class Day36Test {

    // ---- brute force ----
    static boolean bruteForce(String s) {
        while (true) {
            String next = s.replace("()", "")
                           .replace("[]", "")
                           .replace("{}", "");
            if (next.length() == s.length()) {
                break;
            }
            s = next;
        }
        return s.isEmpty();
    }

    // ---- implementation ----
    static boolean isValid(String s) {
        if (s.length() % 2 == 1) {
            return false;
        }
        Deque<Character> stack = new ArrayDeque<>();
        for (char c : s.toCharArray()) {
            if (c == '(' || c == '[' || c == '{') {
                stack.push(c);
            } else {
                if (stack.isEmpty()) {
                    return false;
                }
                char open = stack.pop();
                if ((c == ')' && open != '(')
                        || (c == ']' && open != '[')
                        || (c == '}' && open != '{')) {
                    return false;
                }
            }
        }
        return stack.isEmpty();
    }

    // ---- push-the-expected-closer variant ----
    static boolean isValidVariant(String s) {
        Deque<Character> stack = new ArrayDeque<>();
        for (char c : s.toCharArray()) {
            if (c == '(') {
                stack.push(')');
            } else if (c == '[') {
                stack.push(']');
            } else if (c == '{') {
                stack.push('}');
            } else if (stack.isEmpty() || stack.pop() != c) {
                return false;
            }
        }
        return stack.isEmpty();
    }

    // ---- oracle: recursive descent over the grammar S -> "" | (S)S | [S]S | {S}S ----
    static int pos;
    static String src;
    static boolean oracle(String s) {
        src = s; pos = 0;
        return parse() && pos == s.length();
    }
    static boolean parse() {
        while (pos < src.length()) {
            char c = src.charAt(pos);
            char close = c == '(' ? ')' : c == '[' ? ']' : c == '{' ? '}' : 0;
            if (close == 0) return true;            // a closer: let the caller consume it
            pos++;
            if (!parse()) return false;
            if (pos >= src.length() || src.charAt(pos) != close) return false;
            pos++;
        }
        return true;
    }

    // The wrong "counter per type" idea from the complexity section.
    static boolean counters(String s) {
        int p = 0, b = 0, c = 0;
        for (char ch : s.toCharArray()) {
            if (ch == '(') p++; else if (ch == ')') p--;
            else if (ch == '[') b++; else if (ch == ']') b--;
            else if (ch == '{') c++; else c--;
            if (p < 0 || b < 0 || c < 0) return false;
        }
        return p == 0 && b == 0 && c == 0;
    }

    static int failures = 0;

    static void check(String label, String s, boolean want) {
        boolean a = bruteForce(s), b = isValid(s), c = isValidVariant(s), o = oracle(s);
        boolean ok = a == want && b == want && c == want && o == want;
        if (!ok) failures++;
        System.out.println((ok ? "  ok   " : "  FAIL ") + label + "  \"" + s + "\" -> " + b
            + (ok ? "" : "  (brute " + a + ", variant " + c + ", oracle " + o + ", expected " + want + ")"));
    }

    public static void main(String[] args) {
        System.out.println("day 36 - Valid Parentheses");

        check("example valid",        "([]{})",     true);
        check("example crossing",     "([)]",       false);
        check("odd length",           "(",          false);
        check("odd length 3",         "(()",        false);
        check("closer first",         ")(",         false);
        check("lone closer",          "]",          false);
        check("only openers",         "((",         false);
        check("only openers mixed",   "([{{",       false);
        check("wrong type",           "(]",         false);
        check("deep nesting",         "{[()]}",     true);
        check("deep nesting parens",  "((((()))))", true);
        check("side by side",         "()[]{}",     true);
        check("single pair",          "()",         true);
        check("empty",                "",           true);
        check("brute worst case",     "(((())))",   true);
        check("six openers",          "((((((",     false);

        // Complexity claim: counters accept "([)]".
        {
            boolean ok = counters("([)]") && !isValid("([)]");
            if (!ok) failures++;
            System.out.println((ok ? "  ok   " : "  FAIL ") + "per-type counters wrongly accept \"([)]\"; the stack rejects it");
        }

        // Brute-force claim: "(((())))" needs 4 shrinking passes plus 1 no-change pass.
        {
            String s = "(((())))";
            int passes = 0;
            while (true) {
                passes++;
                String next = s.replace("()", "").replace("[]", "").replace("{}", "");
                if (next.length() == s.length()) break;
                s = next;
            }
            boolean ok = passes == 5;
            if (!ok) failures++;
            System.out.println((ok ? "  ok   " : "  FAIL ") + "\"(((())))\" takes " + passes + " brute-force passes (claimed 5)");
        }

        // Random strings: half built valid, half random noise.
        Random rnd = new Random(36);
        String opens = "([{", closes = ")]}";
        int agree = 0, valids = 0;
        for (int t = 0; t < 1000; t++) {
            String s;
            if (t % 2 == 0) {
                StringBuilder sb = new StringBuilder();
                Deque<Integer> st = new ArrayDeque<>();
                int n = rnd.nextInt(10);
                for (int i = 0; i < n; i++) {
                    int k = rnd.nextInt(3); st.push(k); sb.append(opens.charAt(k));
                    while (!st.isEmpty() && rnd.nextBoolean()) sb.append(closes.charAt(st.pop()));
                }
                while (!st.isEmpty()) sb.append(closes.charAt(st.pop()));
                s = sb.toString();
                if (rnd.nextInt(4) == 0 && s.length() > 1) {    // corrupt one character
                    char[] cs = s.toCharArray();
                    int i = rnd.nextInt(cs.length);
                    cs[i] = "()[]{}".charAt(rnd.nextInt(6));
                    s = new String(cs);
                }
            } else {
                StringBuilder sb = new StringBuilder();
                int n = rnd.nextInt(9);
                for (int i = 0; i < n; i++) sb.append("()[]{}".charAt(rnd.nextInt(6)));
                s = sb.toString();
            }
            boolean want = oracle(s);
            if (want) valids++;
            if (bruteForce(s) == want && isValid(s) == want && isValidVariant(s) == want) agree++;
            else {
                failures++;
                System.out.println("  FAIL random \"" + s + "\" expected " + want);
            }
        }
        System.out.println("  ok   " + agree + "/1000 random strings (" + valids + " valid), all three versions agree with the oracle");

        System.out.println(failures == 0 ? "  day 36 PASSED" : "  day 36 had " + failures + " FAILURES");
    }
}
