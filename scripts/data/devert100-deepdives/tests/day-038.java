// Correctness assertions for day 38 - Implement Queue using Stacks.
//
// The brute force (pour there and back) and the lazy-transfer implementation
// are copied verbatim from day-038.md as nested static classes, plus the bonus
// MyStack (LC 225). Every scripted sequence in the edge-cases section runs on
// both queues; the move counts claimed in the two dry runs (14 vs 4) and the
// 10^5-element claim (exactly 10^5 moves) are measured by instrumented copies;
// and random op sequences are checked against java.util.ArrayDeque as a FIFO
// oracle (and as a LIFO oracle for MyStack).

import java.util.*;

class Day38Test {

    interface Q { void push(int x); int pop(); int peek(); boolean empty(); }

    // ---- brute force ----
    static class BruteQueue implements Q {
        private final Deque<Integer> in = new ArrayDeque<>();
        private final Deque<Integer> out = new ArrayDeque<>();
        int moves = 0;
        public void push(int x) {
            in.push(x);
        }
        public int pop() {
            while (!in.isEmpty()) { out.push(in.pop()); moves++; }
            int front = out.pop();
            while (!out.isEmpty()) { in.push(out.pop()); moves++; }
            return front;
        }
        public int peek() {
            while (!in.isEmpty()) { out.push(in.pop()); moves++; }
            int front = out.peek();
            while (!out.isEmpty()) { in.push(out.pop()); moves++; }
            return front;
        }
        public boolean empty() {
            return in.isEmpty();
        }
    }

    // ---- implementation ----
    static class MyQueue implements Q {
        private final Deque<Integer> in = new ArrayDeque<>();
        private final Deque<Integer> out = new ArrayDeque<>();
        int moves = 0;
        public void push(int x) {
            in.push(x);
        }
        public int pop() {
            moveIfNeeded();
            return out.pop();
        }
        public int peek() {
            moveIfNeeded();
            return out.peek();
        }
        public boolean empty() {
            return in.isEmpty() && out.isEmpty();
        }
        private void moveIfNeeded() {
            if (out.isEmpty()) {
                while (!in.isEmpty()) {
                    out.push(in.pop());
                    moves++;
                }
            }
        }
    }

    // ---- bonus ----
    static class MyStack {
        private final Queue<Integer> q = new ArrayDeque<>();
        public void push(int x) {
            q.offer(x);
            for (int i = 0; i < q.size() - 1; i++) {
                q.offer(q.poll());
            }
        }
        public int pop() { return q.poll(); }
        public int top() { return q.peek(); }
        public boolean empty() { return q.isEmpty(); }
    }

    static int failures = 0;

    // Script: "push N", "pop", "peek", "empty". Outputs as strings.
    static List<String> run(Q q, String... script) {
        List<String> out = new ArrayList<>();
        for (String op : script) {
            if (op.startsWith("push ")) q.push(Integer.parseInt(op.substring(5)));
            else if (op.equals("pop")) out.add(String.valueOf(q.pop()));
            else if (op.equals("peek")) out.add(String.valueOf(q.peek()));
            else out.add(String.valueOf(q.empty()));
        }
        return out;
    }

    static void check(String label, List<String> want, String... script) {
        List<String> a = run(new BruteQueue(), script);
        List<String> b = run(new MyQueue(), script);
        boolean ok = a.equals(want) && b.equals(want);
        if (!ok) failures++;
        System.out.println((ok ? "  ok   " : "  FAIL ") + label + " -> " + want
            + (ok ? "" : "  brute " + a + ", lazy " + b));
    }

    public static void main(String[] args) {
        System.out.println("day 38 - Implement Queue using Stacks");

        check("LeetCode example", List.of("1", "1", "false"),
            "push 1", "push 2", "peek", "pop", "empty");
        check("interleaved (dry run)", List.of("1", "2", "3", "4", "true"),
            "push 1", "push 2", "push 3", "pop", "push 4", "pop", "pop", "pop", "empty");
        check("peek does not remove", List.of("1", "1", "1", "2"),
            "push 1", "push 2", "peek", "peek", "pop", "pop");
        check("push after a peek", List.of("1", "1", "2"),
            "push 1", "peek", "push 2", "pop", "pop");
        check("empty checks both stacks", List.of("1", "false"),
            "push 1", "push 2", "pop", "empty");
        check("one element", List.of("7", "true"),
            "push 7", "pop", "empty");
        check("reuse after emptying", List.of("1", "2"),
            "push 1", "pop", "push 2", "peek");

        // Move counts from the two dry runs: 14 (brute) vs 4 (lazy).
        {
            String[] script = { "push 1", "push 2", "push 3", "pop", "push 4", "pop", "pop", "pop", "empty" };
            BruteQueue bq = new BruteQueue(); run(bq, script);
            MyQueue mq = new MyQueue(); run(mq, script);
            boolean ok = bq.moves == 14 && mq.moves == 4;
            if (!ok) failures++;
            System.out.println((ok ? "  ok   " : "  FAIL ") + "dry-run moves: brute " + bq.moves + " (claimed 14), lazy " + mq.moves + " (claimed 4)");
        }

        // The "pour when out is not empty" bug really returns 4 at row 6.
        {
            Deque<Integer> in = new ArrayDeque<>(), out = new ArrayDeque<>();
            out.push(3); out.push(2); in.push(4);            // state before row 6
            while (!in.isEmpty()) out.push(in.pop());        // the wrong, unconditional pour
            int got = out.pop();
            boolean ok = got == 4;
            if (!ok) failures++;
            System.out.println((ok ? "  ok   " : "  FAIL ") + "unconditional pour returns " + got + " instead of 2, as claimed");
        }

        // 10^5 pushes then 10^5 pops: FIFO order and exactly 10^5 moves.
        {
            int n = 100_000;
            MyQueue mq = new MyQueue();
            for (int i = 1; i <= n; i++) mq.push(i);
            boolean order = true;
            for (int i = 1; i <= n; i++) if (mq.pop() != i) { order = false; break; }
            boolean ok = order && mq.moves == n && mq.empty();
            if (!ok) failures++;
            System.out.println((ok ? "  ok   " : "  FAIL ") + "100000 pushes then pops: FIFO order, " + mq.moves + " moves (claimed 100000)");
        }

        // Bonus MyStack: LeetCode 225 example and LIFO order.
        {
            MyStack st = new MyStack();
            st.push(1); st.push(2);
            int t = st.top(), p = st.pop();
            boolean e = st.empty();
            boolean ok = t == 2 && p == 2 && !e;
            if (!ok) failures++;
            System.out.println((ok ? "  ok   " : "  FAIL ") + "MyStack LeetCode example -> 2, 2, false");
        }

        Random rnd = new Random(38);
        int agree = 0;
        for (int t = 0; t < 500; t++) {
            BruteQueue bq = new BruteQueue();
            MyQueue mq = new MyQueue();
            MyStack ms = new MyStack();
            ArrayDeque<Integer> fifo = new ArrayDeque<>();
            ArrayDeque<Integer> lifo = new ArrayDeque<>();
            boolean ok = true;
            for (int k = 0; k < 80 && ok; k++) {
                int op = rnd.nextInt(4);
                if (fifo.isEmpty() || op == 0) {
                    int x = 1 + rnd.nextInt(9);
                    bq.push(x); mq.push(x); ms.push(x); fifo.addLast(x); lifo.push(x);
                } else if (op == 1) {
                    int want = fifo.pollFirst();
                    if (bq.pop() != want || mq.pop() != want) ok = false;
                    if (ms.pop() != lifo.pop()) ok = false;
                } else if (op == 2) {
                    int want = fifo.peekFirst();
                    if (bq.peek() != want || mq.peek() != want) ok = false;
                    if (ms.top() != lifo.peek()) ok = false;
                }
                boolean e = fifo.isEmpty();
                if (bq.empty() != e || mq.empty() != e || ms.empty() != lifo.isEmpty()) ok = false;
            }
            if (ok) agree++;
            else { failures++; System.out.println("  FAIL random sequence " + t); }
        }
        System.out.println("  ok   " + agree + "/500 random 80-op sequences, both queues FIFO-correct, MyStack LIFO-correct");

        System.out.println(failures == 0 ? "  day 38 PASSED" : "  day 38 had " + failures + " FAILURES");
    }
}
