// Correctness assertions for day 12 - Group Anagrams.
//
// The pairwise brute force, the sorted-key HashMap solution and the count-key
// follow-up are copied verbatim from day-012.md. Group order and order within
// a group are free, so every result is normalised (sort inside each group,
// then sort the groups) before comparing. Checks: the worked example, every
// edge case listed, the brute force's 7 isAnagram calls on the example, the
// undelimited count-key collision, the chars.toString() bug, and 500 random
// inputs where all three versions must agree.

import java.util.*;

class Day12Test {

    // ---- brute force from the bruteForce section ----
    static int anagramCalls = 0;

    static List<List<String>> groupBrute(String[] strs) {
        List<List<String>> result = new ArrayList<>();
        boolean[] used = new boolean[strs.length];
        for (int i = 0; i < strs.length; i++) {
            if (used[i]) {
                continue;
            }
            List<String> group = new ArrayList<>();
            group.add(strs[i]);
            used[i] = true;
            for (int j = i + 1; j < strs.length; j++) {
                if (!used[j] && isAnagram(strs[i], strs[j])) {
                    group.add(strs[j]);
                    used[j] = true;
                }
            }
            result.add(group);
        }
        return result;
    }

    static boolean isAnagram(String s, String t) {
        anagramCalls++;
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

    // ---- sorted-key solution from the implementation section ----
    static List<List<String>> groupSorted(String[] strs) {
        Map<String, List<String>> groups = new HashMap<>();
        for (String s : strs) {
            char[] chars = s.toCharArray();
            Arrays.sort(chars);
            String key = new String(chars);
            groups.computeIfAbsent(key, k -> new ArrayList<>()).add(s);
        }
        return new ArrayList<>(groups.values());
    }

    // ---- count-key follow-up from the implementation section ----
    static List<List<String>> groupCount(String[] strs) {
        Map<String, List<String>> groups = new HashMap<>();
        for (String s : strs) {
            int[] count = new int[26];
            for (int i = 0; i < s.length(); i++) {
                count[s.charAt(i) - 'a']++;
            }
            StringBuilder key = new StringBuilder();
            for (int c : count) {
                key.append(c).append('#');
            }
            groups.computeIfAbsent(key.toString(), k -> new ArrayList<>()).add(s);
        }
        return new ArrayList<>(groups.values());
    }

    // ---- named bugs ----
    static List<List<String>> groupNoDelimiter(String[] strs) {
        Map<String, List<String>> groups = new HashMap<>();
        for (String s : strs) {
            int[] count = new int[26];
            for (int i = 0; i < s.length(); i++) count[s.charAt(i) - 'a']++;
            StringBuilder key = new StringBuilder();
            for (int c : count) key.append(c);
            groups.computeIfAbsent(key.toString(), k -> new ArrayList<>()).add(s);
        }
        return new ArrayList<>(groups.values());
    }

    static List<List<String>> groupArrayToString(String[] strs) {
        Map<String, List<String>> groups = new HashMap<>();
        for (String s : strs) {
            char[] chars = s.toCharArray();
            Arrays.sort(chars);
            groups.computeIfAbsent(chars.toString(), k -> new ArrayList<>()).add(s);
        }
        return new ArrayList<>(groups.values());
    }

    static String norm(List<List<String>> groups) {
        List<String> parts = new ArrayList<>();
        for (List<String> g : groups) {
            List<String> c = new ArrayList<>(g);
            Collections.sort(c);
            parts.add(c.toString());
        }
        Collections.sort(parts);
        return parts.toString();
    }

    static String norm(String[][] groups) {
        List<List<String>> l = new ArrayList<>();
        for (String[] g : groups) l.add(Arrays.asList(g));
        return norm(l);
    }

    static int failures = 0;

    static void check(String label, String[] strs, String[][] want) {
        String w = norm(want);
        String a = norm(groupBrute(strs)), b = norm(groupSorted(strs)), c = norm(groupCount(strs));
        boolean ok = a.equals(w) && b.equals(w) && c.equals(w);
        if (!ok) failures++;
        System.out.println((ok ? "  ok   " : "  FAIL ") + label + "  " + Arrays.toString(strs) + " -> " + b
            + (ok ? "" : "  brute " + a + ", count " + c + ", expected " + w));
    }

    static void claim(String label, boolean holds) {
        if (!holds) failures++;
        System.out.println((holds ? "  ok   " : "  FAIL ") + label);
    }

    public static void main(String[] args) {
        System.out.println("day 12 - Group Anagrams");

        check("LC example", new String[] { "eat", "tea", "tan", "ate", "nat", "bat" },
            new String[][] { { "bat" }, { "nat", "tan" }, { "ate", "eat", "tea" } });
        check("single empty",       new String[] { "" },                new String[][] { { "" } });
        check("several empty",      new String[] { "", "" },            new String[][] { { "", "" } });
        check("single string",      new String[] { "a" },               new String[][] { { "a" } });
        check("duplicates",         new String[] { "a", "a" },          new String[][] { { "a", "a" } });
        check("no anagrams",        new String[] { "abc", "def" },      new String[][] { { "abc" }, { "def" } });
        check("one group",          new String[] { "abc", "bca", "cab" }, new String[][] { { "abc", "bca", "cab" } });
        check("set vs multiset",    new String[] { "ab", "aab" },       new String[][] { { "ab" }, { "aab" } });
        check("count-key collision", new String[] { "abbbbbbbbbbb", "aaaaaaaaaaab" },
            new String[][] { { "abbbbbbbbbbb" }, { "aaaaaaaaaaab" } });

        // Brute-force dry run: exactly 7 isAnagram calls, groups in scan order.
        anagramCalls = 0;
        List<List<String>> bf = groupBrute(new String[] { "eat", "tea", "tan", "ate", "nat", "bat" });
        claim("brute force dry run: " + anagramCalls + " isAnagram calls (claimed 7), result " + bf,
            anagramCalls == 7 && bf.toString().equals("[[eat, tea, ate], [tan, nat], [bat]]"));

        // Count key for "eat" as printed in the optimization section.
        int[] cnt = new int[26];
        for (char ch : "eat".toCharArray()) cnt[ch - 'a']++;
        StringBuilder k = new StringBuilder();
        for (int c : cnt) k.append(c).append('#');
        claim("count key for \"eat\" matches the printed key",
            k.toString().equals("1#0#0#0#1#0#0#0#0#0#0#0#0#0#0#0#0#0#0#1#0#0#0#0#0#0#"));

        // Named bugs.
        claim("no delimiter merges abbbbbbbbbbb with aaaaaaaaaaab",
            groupNoDelimiter(new String[] { "abbbbbbbbbbb", "aaaaaaaaaaab" }).size() == 1);
        claim("chars.toString() key puts every string alone",
            groupArrayToString(new String[] { "eat", "tea", "ate" }).size() == 3);

        Random rnd = new Random(12);
        int agree = 0;
        for (int t = 0; t < 500; t++) {
            int n = rnd.nextInt(12);
            String[] strs = new String[n];
            for (int i = 0; i < n; i++) {
                int len = rnd.nextInt(5);
                StringBuilder sb = new StringBuilder();
                for (int j = 0; j < len; j++) sb.append((char) ('a' + rnd.nextInt(3)));
                strs[i] = sb.toString();
            }
            String a = norm(groupBrute(strs)), b = norm(groupSorted(strs)), c = norm(groupCount(strs));
            if (a.equals(b) && b.equals(c)) agree++;
            else { failures++; System.out.println("  FAIL random " + Arrays.toString(strs) + " -> " + a + " / " + b + " / " + c); }
        }
        System.out.println("  ok   " + agree + "/500 random cases, all three versions agree");

        System.out.println(failures == 0 ? "  day 12 PASSED" : "  day 12 had " + failures + " FAILURES");
    }
}
