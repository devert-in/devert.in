// Correctness assertions for day 100 - Word Search.
//
// The three published solutions (build-full-paths brute force, pruned DFS with
// in-place marking, and the frequency/reverse pre-check variant) are copied
// verbatim from day-100.md. They must agree on every case in the writeup and
// on random boards; the path / call counts quoted in the writeup are
// re-measured; the board must be unchanged after every search; and the
// no-restore bug must give the wrong answer the edge-cases section claims.

import java.util.*;

class Day100Test {

    // ---- brute force: build every full-length path, compare at the end ----
    static int brutePaths = 0;
    static boolean bruteExist(char[][] board, String word) {
        boolean[][] visited = new boolean[board.length][board[0].length];
        for (int r = 0; r < board.length; r++) {
            for (int c = 0; c < board[0].length; c++) {
                if (walk(board, word, r, c, visited, new StringBuilder())) return true;
            }
        }
        return false;
    }

    // Extend the path through (r, c); compare only once it is word.length() long.
    static boolean walk(char[][] board, String word, int r, int c,
                         boolean[][] visited, StringBuilder path) {
        visited[r][c] = true;
        path.append(board[r][c]);

        boolean found = false;
        if (path.length() == word.length()) {
            brutePaths++;
            found = path.toString().equals(word);
        } else {
            int[][] dirs = { { 1, 0 }, { -1, 0 }, { 0, 1 }, { 0, -1 } };
            for (int[] d : dirs) {
                int nr = r + d[0], nc = c + d[1];
                if (nr < 0 || nc < 0 || nr >= board.length || nc >= board[0].length) continue;
                if (visited[nr][nc]) continue;
                if (walk(board, word, nr, nc, visited, path)) {
                    found = true;
                    break;
                }
            }
        }

        path.deleteCharAt(path.length() - 1);     // undo, so other paths can use this cell
        visited[r][c] = false;
        return found;
    }

    // ---- implementation: pruned DFS, '#' marking, restore ----
    static int dfsCalls = 0;
    static boolean exist(char[][] board, String word) {
        for (int r = 0; r < board.length; r++) {
            for (int c = 0; c < board[0].length; c++) {
                if (dfs(board, word, r, c, 0)) return true;
            }
        }
        return false;
    }

    // Can word[k..] be spelled starting at (r, c)?
    static boolean dfs(char[][] board, String word, int r, int c, int k) {
        dfsCalls++;
        if (k == word.length()) return true;                     // every letter matched
        if (r < 0 || c < 0 || r >= board.length || c >= board[0].length) return false;
        if (board[r][c] != word.charAt(k)) return false;         // prune - also rejects '#'

        char saved = board[r][c];
        board[r][c] = '#';                                       // on the path: no reuse

        boolean found = dfs(board, word, r + 1, c, k + 1)
                     || dfs(board, word, r - 1, c, k + 1)
                     || dfs(board, word, r, c + 1, k + 1)
                     || dfs(board, word, r, c - 1, k + 1);

        board[r][c] = saved;                                     // backtrack: restore
        return found;
    }

    // ---- follow-up: pruning before the search ----
    static class Pruned {
        public boolean exist(char[][] board, String word) {
            int cells = board.length * board[0].length;
            if (word.length() > cells) return false;             // cannot fit without reuse

            int[] have = new int[128];
            for (char[] row : board) for (char ch : row) have[ch]++;
            int[] need = new int[128];
            for (char ch : word.toCharArray()) {
                if (++need[ch] > have[ch]) return false;          // a letter the board lacks
            }

            // Start from the rarer end: fewer starting cells, earlier pruning.
            if (have[word.charAt(0)] > have[word.charAt(word.length() - 1)]) {
                word = new StringBuilder(word).reverse().toString();
            }

            for (int r = 0; r < board.length; r++) {
                for (int c = 0; c < board[0].length; c++) {
                    if (dfs(board, word, r, c, 0)) return true;
                }
            }
            return false;
        }

        private boolean dfs(char[][] board, String word, int r, int c, int k) {
            if (k == word.length()) return true;
            if (r < 0 || c < 0 || r >= board.length || c >= board[0].length) return false;
            if (board[r][c] != word.charAt(k)) return false;

            char saved = board[r][c];
            board[r][c] = '#';
            boolean found = dfs(board, word, r + 1, c, k + 1)
                         || dfs(board, word, r - 1, c, k + 1)
                         || dfs(board, word, r, c + 1, k + 1)
                         || dfs(board, word, r, c - 1, k + 1);
            board[r][c] = saved;
            return found;
        }
    }

    // ---- the bug from the edge cases: no restore ----
    static boolean noRestore(char[][] board, String word) {
        for (int r = 0; r < board.length; r++)
            for (int c = 0; c < board[0].length; c++)
                if (bad(board, word, r, c, 0)) return true;
        return false;
    }
    static boolean bad(char[][] board, String word, int r, int c, int k) {
        if (k == word.length()) return true;
        if (r < 0 || c < 0 || r >= board.length || c >= board[0].length) return false;
        if (board[r][c] != word.charAt(k)) return false;
        board[r][c] = '#';
        return bad(board, word, r + 1, c, k + 1) || bad(board, word, r - 1, c, k + 1)
            || bad(board, word, r, c + 1, k + 1) || bad(board, word, r, c - 1, k + 1);
    }

    static char[][] grid(String... rows) {
        char[][] g = new char[rows.length][];
        for (int i = 0; i < rows.length; i++) g[i] = rows[i].toCharArray();
        return g;
    }
    static char[][] copy(char[][] g) {
        char[][] o = new char[g.length][];
        for (int i = 0; i < g.length; i++) o[i] = g[i].clone();
        return o;
    }
    static String show(char[][] g) {
        StringBuilder s = new StringBuilder();
        for (char[] row : g) s.append(s.length() > 0 ? "/" : "").append(new String(row));
        return s.toString();
    }

    static int failures = 0;

    static void report(boolean ok, String msg) {
        if (!ok) failures++;
        System.out.println((ok ? "  ok   " : "  FAIL ") + msg);
    }

    static void check(String label, char[][] board, String word, boolean want) {
        char[][] a = copy(board), b = copy(board), c = copy(board);
        boolean x = exist(a, word), y = bruteExist(b, word), z = new Pruned().exist(c, word);
        boolean restored = Arrays.deepEquals(a, board) && Arrays.deepEquals(b, board) && Arrays.deepEquals(c, board);
        boolean ok = x == want && y == want && z == want && restored;
        report(ok, label + "  " + show(board) + " \"" + word + "\" -> " + x
            + (ok ? "" : "  brute " + y + " pruned " + z + " restored " + restored + " expected " + want));
    }

    public static void main(String[] args) {
        System.out.println("day 100 - Word Search");

        char[][] lc = grid("ABCE", "SFCS", "ADEE");
        char[][] small = grid("ACC", "TAC");

        check("traced example",      small, "CAT", true);
        check("leetcode example 1",  lc, "ABCCED", true);
        check("leetcode example 2",  lc, "SEE", true);
        check("leetcode example 3",  lc, "ABCB", false);
        check("single cell match",   grid("A"), "A", true);
        check("single cell miss",    grid("A"), "B", false);
        check("longer than board",   grid("AB"), "ABA", false);
        check("needs restore",       grid("BAA"), "AAB", true);
        check("case matters",        grid("a"), "A", false);
        check("all same, 4 fits",    grid("AA", "AA"), "AAAA", true);
        check("all same, 5 no",      grid("AA", "AA"), "AAAAA", false);
        check("letter missing",      lc, "ABZ", false);
        check("ends on an edge",     grid("CAT"), "CAT", true);

        // The bug: without restore, [[B,A,A]] "AAB" comes out false.
        report(!noRestore(grid("BAA"), "AAB"), "no-restore version wrongly returns false on BAA / AAB");

        // Counts quoted in the writeup: brute-force full paths, optimised calls.
        Object[][] counts = {
            { small, "CAT", 5, 8 }, { lc, "ABCCED", 25, 14 }, { lc, "SEE", 44, 18 }, { lc, "ABCB", 138, 28 } };
        for (Object[] row : counts) {
            char[][] g = (char[][]) row[0];
            String w = (String) row[1];
            brutePaths = 0; bruteExist(copy(g), w);
            dfsCalls = 0; exist(copy(g), w);
            boolean ok = brutePaths == (int) row[2] && dfsCalls == (int) row[3];
            report(ok, w + ": brute " + brutePaths + " full paths (claimed " + row[2] + "), dfs "
                + dfsCalls + " calls (claimed " + row[3] + ")");
        }

        Random rnd = new Random(79);
        int agree = 0;
        for (int t = 0; t < 400; t++) {
            int m = 1 + rnd.nextInt(4), n = 1 + rnd.nextInt(4);
            String[] rows = new String[m];
            for (int i = 0; i < m; i++) {
                StringBuilder s = new StringBuilder();
                for (int j = 0; j < n; j++) s.append((char) ('A' + rnd.nextInt(3)));
                rows[i] = s.toString();
            }
            char[][] g = grid(rows);
            StringBuilder w = new StringBuilder();
            int len = 1 + rnd.nextInt(6);
            for (int i = 0; i < len; i++) w.append((char) ('A' + rnd.nextInt(3)));
            char[][] a = copy(g), b = copy(g), c = copy(g);
            boolean want = bruteExist(b, w.toString());
            boolean x = exist(a, w.toString()), z = new Pruned().exist(c, w.toString());
            if (x == want && z == want && Arrays.deepEquals(a, g) && Arrays.deepEquals(c, g)) agree++;
            else report(false, "random " + show(g) + " \"" + w + "\" brute " + want + " dfs " + x + " pruned " + z);
        }
        report(agree == 400, agree + "/400 random boards, all three agree, board restored");

        System.out.println(failures == 0 ? "  day 100 PASSED" : "  day 100 had " + failures + " FAILURES");
    }
}
