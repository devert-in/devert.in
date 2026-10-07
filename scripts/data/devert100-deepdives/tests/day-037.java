// Correctness assertions for day 37 - Min Stack.
//
// All four published classes (brute force scan, pairs, two stacks with <=,
// and the encoded long version) are copied verbatim from day-037.md as nested
// static classes. Every scripted sequence in the edge-cases section is run
// against all four, and a randomized op sequence (including the extremes of
// the int range) checks every top()/getMin() against a scan oracle. The
// duplicate-minimum claim is also checked the other way: a two-stack version
// using < instead of <= must actually break on push 0, 1, 0, pop, getMin.

import java.util.*;

class Day37Test {

    interface MS { void push(int v); void pop(); int top(); int getMin(); }

    // ---- brute force ----
    static class BruteMinStack implements MS {
        private final Deque<Integer> stack = new ArrayDeque<>();
        public void push(int val) { stack.push(val); }
        public void pop() { stack.pop(); }
        public int top() { return stack.peek(); }
        public int getMin() {
            int min = Integer.MAX_VALUE;
            for (int v : stack) {
                min = Math.min(min, v);
            }
            return min;
        }
    }

    // ---- implementation (pairs) ----
    static class PairMinStack implements MS {
        private final Deque<int[]> stack = new ArrayDeque<>();
        public void push(int val) {
            int minSoFar = stack.isEmpty() ? val : Math.min(val, stack.peek()[1]);
            stack.push(new int[] { val, minSoFar });
        }
        public void pop() { stack.pop(); }
        public int top() { return stack.peek()[0]; }
        public int getMin() { return stack.peek()[1]; }
    }

    // ---- two-stack version ----
    static class TwoStackMinStack implements MS {
        private final Deque<Integer> stack = new ArrayDeque<>();
        private final Deque<Integer> mins = new ArrayDeque<>();
        public void push(int val) {
            stack.push(val);
            if (mins.isEmpty() || val <= mins.peek()) {
                mins.push(val);
            }
        }
        public void pop() {
            int val = stack.pop();
            if (val == mins.peek()) {
                mins.pop();
            }
        }
        public int top() { return stack.peek(); }
        public int getMin() { return mins.peek(); }
    }

    // ---- encoded version ----
    static class EncodedMinStack implements MS {
        private final Deque<Long> stack = new ArrayDeque<>();
        private long min;
        public void push(int val) {
            if (stack.isEmpty()) {
                stack.push((long) val);
                min = val;
            } else if (val >= min) {
                stack.push((long) val);
            } else {
                stack.push(2L * val - min);
                min = val;
            }
        }
        public void pop() {
            long top = stack.pop();
            if (top < min) {
                min = 2 * min - top;
            }
        }
        public int top() {
            long top = stack.peek();
            return (int) (top < min ? min : top);
        }
        public int getMin() { return (int) min; }
    }

    // The buggy variant the writeup warns about: < instead of <=.
    static class StrictLessMinStack implements MS {
        private final Deque<Integer> stack = new ArrayDeque<>();
        private final Deque<Integer> mins = new ArrayDeque<>();
        public void push(int val) {
            stack.push(val);
            if (mins.isEmpty() || val < mins.peek()) mins.push(val);
        }
        public void pop() {
            int val = stack.pop();
            if (val == mins.peek()) mins.pop();
        }
        public int top() { return stack.peek(); }
        public int getMin() { return mins.peek(); }
    }

    static MS[] fresh() {
        return new MS[] { new BruteMinStack(), new PairMinStack(), new TwoStackMinStack(), new EncodedMinStack() };
    }
    static final String[] NAMES = { "brute", "pairs", "two-stack", "encoded" };

    static int failures = 0;

    // Script: "push N", "pop", "top", "min". Returns outputs of top/min calls.
    static List<Integer> run(MS s, String... script) {
        List<Integer> out = new ArrayList<>();
        for (String op : script) {
            if (op.startsWith("push ")) s.push(Integer.parseInt(op.substring(5)));
            else if (op.equals("pop")) s.pop();
            else if (op.equals("top")) out.add(s.top());
            else out.add(s.getMin());
        }
        return out;
    }

    static void check(String label, List<Integer> want, String... script) {
        boolean ok = true;
        StringBuilder detail = new StringBuilder();
        MS[] all = fresh();
        for (int i = 0; i < all.length; i++) {
            List<Integer> got;
            try { got = run(all[i], script); } catch (RuntimeException e) { got = null; }
            if (!want.equals(got)) { ok = false; detail.append("  ").append(NAMES[i]).append("=").append(got); }
        }
        if (!ok) failures++;
        System.out.println((ok ? "  ok   " : "  FAIL ") + label + " -> " + want + (ok ? "  (all four versions)" : detail.toString()));
    }

    public static void main(String[] args) {
        System.out.println("day 37 - Min Stack");

        check("LeetCode example", List.of(-3, 0, -2),
            "push -2", "push 0", "push -3", "min", "pop", "top", "min");
        check("duplicate minimums", List.of(0, 0),
            "push 0", "push 1", "push 0", "min", "pop", "min");
        check("popping the min restores the previous one", List.of(2, 3, 3, 5),
            "push 5", "push 3", "push 7", "push 2", "min", "pop", "min", "pop", "min", "pop", "min");
        check("increasing pushes", List.of(1, 3),
            "push 1", "push 2", "push 3", "min", "top");
        check("decreasing pushes", List.of(1, 2),
            "push 3", "push 2", "push 1", "min", "pop", "min");
        check("extreme values", List.of(Integer.MIN_VALUE, Integer.MAX_VALUE, Integer.MIN_VALUE),
            "push -2147483648", "push 2147483647", "min", "top", "pop", "push -2147483648", "min");
        check("single element", List.of(42, 42),
            "push 42", "top", "min");
        check("push after emptying", List.of(9),
            "push 1", "pop", "push 9", "min");
        check("large values (Integer cache trap)", List.of(512, 512, 1000),
            "push 1000", "push 512", "push 512", "min", "pop", "min", "pop", "min");

        // The < bug really breaks on the duplicate case.
        {
            boolean broke;
            try {
                List<Integer> got = run(new StrictLessMinStack(), "push 0", "push 1", "push 0", "min", "pop", "min");
                broke = !got.equals(List.of(0, 0));
            } catch (RuntimeException e) { broke = true; }
            if (!broke) failures++;
            System.out.println((broke ? "  ok   " : "  FAIL ") + "two-stack with < (not <=) breaks on duplicate minimums, as claimed");
        }

        // Encoded walkthrough numbers: push -2, 0, -3 stores -4 for -3; popping restores min -2.
        {
            EncodedMinStack e = new EncodedMinStack();
            e.push(-2); e.push(0); e.push(-3);
            long stored = e.stack.peek();
            boolean ok1 = stored == -4 && e.getMin() == -3 && e.top() == -3;
            e.pop();
            boolean ok = ok1 && e.getMin() == -2 && e.top() == 0;
            if (!ok) failures++;
            System.out.println((ok ? "  ok   " : "  FAIL ") + "encoded walkthrough: stores " + stored + " for -3, pop restores min -2");
        }

        // Randomized ops vs a list-scan oracle.
        Random rnd = new Random(37);
        int agree = 0;
        int[] extremes = { Integer.MIN_VALUE, Integer.MAX_VALUE, Integer.MIN_VALUE + 1, Integer.MAX_VALUE - 1, 0 };
        for (int t = 0; t < 400; t++) {
            MS[] all = fresh();
            List<Integer> oracle = new ArrayList<>();
            boolean ok = true;
            for (int k = 0; k < 60 && ok; k++) {
                int op = rnd.nextInt(4);
                if (oracle.isEmpty() || op == 0) {
                    int v = rnd.nextInt(5) == 0 ? extremes[rnd.nextInt(extremes.length)] : rnd.nextInt(2001) - 1000;
                    oracle.add(v);
                    for (MS s : all) s.push(v);
                } else if (op == 1) {
                    oracle.remove(oracle.size() - 1);
                    for (MS s : all) s.pop();
                } else {
                    int wantTop = oracle.get(oracle.size() - 1);
                    int wantMin = Collections.min(oracle);
                    for (MS s : all) if (s.top() != wantTop || s.getMin() != wantMin) ok = false;
                }
            }
            if (ok) agree++;
            else { failures++; System.out.println("  FAIL random sequence " + t); }
        }
        System.out.println("  ok   " + agree + "/400 random 60-op sequences, all four versions match the oracle");

        System.out.println(failures == 0 ? "  day 37 PASSED" : "  day 37 had " + failures + " FAILURES");
    }
}
