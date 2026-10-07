// Correctness assertions for day 13 - String Compression (LC 443).
//
// All three published solutions (StringBuilder brute force, read/write with
// Integer.toString, read/write with the reversed-digit writer) are copied
// verbatim from day-013.md. Each must return the claimed length AND leave the
// claimed prefix in chars, on the worked example and every edge case.

import java.util.*;

class Day13Test {

    // ---- brute force from the bruteForce section ----
    static int compressBrute(char[] chars) {
        StringBuilder sb = new StringBuilder();
        int n = chars.length;
        int i = 0;

        while (i < n) {
            char ch = chars[i];
            int j = i;
            while (j < n && chars[j] == ch) {
                j++;
            }
            int count = j - i;

            sb.append(ch);
            if (count > 1) {
                sb.append(count);       // appends the digits, e.g. "12"
            }
            i = j;
        }

        for (int k = 0; k < sb.length(); k++) {
            chars[k] = sb.charAt(k);
        }
        return sb.length();
    }

    // ---- implementation section ----
    static int compress(char[] chars) {
        int n = chars.length;
        int read = 0;   // scans runs
        int write = 0;  // next free slot of the compressed output

        while (read < n) {
            char ch = chars[read];
            int start = read;

            // Consume the whole run before writing anything.
            while (read < n && chars[read] == ch) {
                read++;
            }
            int count = read - start;

            chars[write++] = ch;
            if (count > 1) {
                for (char d : Integer.toString(count).toCharArray()) {
                    chars[write++] = d;
                }
            }
        }

        return write;
    }

    // ---- zero-allocation variant from the Java notes ----
    static int compressNoAlloc(char[] chars) {
        int n = chars.length;
        int read = 0;
        int write = 0;

        while (read < n) {
            char ch = chars[read];
            int start = read;
            while (read < n && chars[read] == ch) {
                read++;
            }
            int count = read - start;

            chars[write++] = ch;
            if (count > 1) {
                int from = write;
                while (count > 0) {
                    chars[write++] = (char) ('0' + count % 10);
                    count /= 10;
                }
                // digits came out reversed - flip chars[from..write-1]
                for (int l = from, r = write - 1; l < r; l++, r--) {
                    char t = chars[l];
                    chars[l] = chars[r];
                    chars[r] = t;
                }
            }
        }

        return write;
    }

    static int failures = 0;

    static char[] rep(char c, int k) { char[] a = new char[k]; Arrays.fill(a, c); return a; }

    static char[] cat(char[]... parts) {
        StringBuilder sb = new StringBuilder();
        for (char[] p : parts) sb.append(p);
        return sb.toString().toCharArray();
    }

    static String prefix(char[] a, int k) { return new String(a, 0, k); }

    static void check(String label, char[] input, String want) {
        char[] a = input.clone(), b = input.clone(), c = input.clone();
        int ka = compressBrute(a), kb = compress(b), kc = compressNoAlloc(c);
        boolean ok = ka == want.length() && kb == want.length() && kc == want.length()
            && prefix(a, ka).equals(want) && prefix(b, kb).equals(want) && prefix(c, kc).equals(want);
        if (!ok) failures++;
        String in = input.length > 20 ? new String(input, 0, 20) + "...(" + input.length + ")" : new String(input);
        System.out.println((ok ? "  ok   " : "  FAIL ") + label + "  \"" + in + "\" -> \""
            + prefix(b, kb) + "\" return " + kb
            + (ok ? "" : "  brute=\"" + prefix(a, ka) + "\" noalloc=\"" + prefix(c, kc) + "\" expected \"" + want + "\""));
    }

    public static void main(String[] args) {
        System.out.println("day 13 - String Compression");

        check("example",                  "aabbccc".toCharArray(), "a2b2c3");
        check("single character",         "a".toCharArray(), "a");
        check("no repeats",               "abc".toCharArray(), "abc");
        check("run of exactly ten",       rep('a', 10), "a10");
        check("long run after a single",  cat("a".toCharArray(), rep('b', 12)), "ab12");
        check("three-digit count",        rep('a', 100), "a100");
        check("singles between runs",     "aabcc".toCharArray(), "a2bc2");
        check("same char separate runs",  "aabaa".toCharArray(), "a2ba2");
        check("digit characters",         "111".toCharArray(), "13");
        check("two of the same",          "aa".toCharArray(), "a2");
        check("max length 2000",          rep('z', 2000), "z2000");

        // Randomized: the two in-place versions vs the StringBuilder brute force.
        // Small alphabet and biased run lengths so multi-digit counts happen.
        Random rnd = new Random(13);
        int agree = 0, trials = 600;
        char[] alpha = { 'a', 'b', 'c', '1', '#' };
        for (int t = 0; t < trials; t++) {
            StringBuilder sb = new StringBuilder();
            int runs = 1 + rnd.nextInt(8);
            for (int r = 0; r < runs; r++) {
                char ch = alpha[rnd.nextInt(alpha.length)];
                int len = rnd.nextInt(4) == 0 ? 1 + rnd.nextInt(150) : 1 + rnd.nextInt(3);
                for (int k = 0; k < len; k++) sb.append(ch);
            }
            char[] in = sb.toString().toCharArray();
            char[] a = in.clone(), b = in.clone(), c = in.clone();
            int ka = compressBrute(a), kb = compress(b), kc = compressNoAlloc(c);
            if (ka == kb && kb == kc && prefix(a, ka).equals(prefix(b, kb)) && prefix(b, kb).equals(prefix(c, kc))
                && kb <= in.length) agree++;
            else {
                failures++;
                System.out.println("  FAIL random \"" + new String(in) + "\" -> " + prefix(a, ka) + " / "
                    + prefix(b, kb) + " / " + prefix(c, kc));
            }
        }
        System.out.println("  ok   " + agree + "/" + trials + " random cases, all three versions agree, k <= n");

        System.out.println(failures == 0 ? "  day 13 PASSED" : "  day 13 had " + failures + " FAILURES");
    }
}
