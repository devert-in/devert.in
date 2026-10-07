// Correctness assertions for day 39 - Evaluate Reverse Polish Notation.
//
// Both published solutions (splice-and-rescan brute force, single-pass stack)
// are copied verbatim from day-039.md. They are checked on the worked example,
// every input the edge-cases section names, and against an expression-tree
// oracle on randomly generated valid RPN.

import java.util.*;

class Day39Test {

    // ---- copy of day-039.md's implementation section ----
    static class Optimal {
        public int evalRPN(String[] tokens) {

            Deque<Integer> stack = new ArrayDeque<>();

            for (String token : tokens) {
                if (isOperator(token)) {
                    int b = stack.pop();   // right operand - pushed last, popped FIRST
                    int a = stack.pop();   // left operand
                    stack.push(apply(a, b, token));
                } else {
                    stack.push(Integer.parseInt(token));
                }
            }

            return stack.pop();
        }

        // "-11" is a number: an operator is exactly one character long.
        private boolean isOperator(String t) {
            return t.length() == 1 && "+-*/".indexOf(t.charAt(0)) >= 0;
        }

        private int apply(int a, int b, String op) {
            return switch (op) {
                case "+" -> a + b;
                case "-" -> a - b;
                case "*" -> a * b;
                default  -> a / b;   // Java int division truncates toward zero
            };
        }
    }

    // ---- copy of the brute-force section ----
    static class Brute {
        public int evalRPN(String[] tokens) {

            List<String> list = new ArrayList<>(Arrays.asList(tokens));

            while (list.size() > 1) {

                int i = 0;
                while (!isOperator(list.get(i))) {
                    i++;
                }

                int a = Integer.parseInt(list.get(i - 2));
                int b = Integer.parseInt(list.get(i - 1));
                int result = apply(a, b, list.get(i));

                list.set(i - 2, String.valueOf(result));
                list.remove(i);
                list.remove(i - 1);
            }

            return Integer.parseInt(list.get(0));
        }

        private boolean isOperator(String t) {
            return t.length() == 1 && "+-*/".indexOf(t.charAt(0)) >= 0;
        }

        private int apply(int a, int b, String op) {
            return switch (op) {
                case "+" -> a + b;
                case "-" -> a - b;
                case "*" -> a * b;
                default  -> a / b;
            };
        }
    }

    static int failures = 0;

    static void check(String label, String[] tokens, int want) {
        int o = new Optimal().evalRPN(tokens.clone());
        int b = new Brute().evalRPN(tokens.clone());
        boolean ok = o == want && b == want;
        if (!ok) failures++;
        System.out.println((ok ? "  ok   " : "  FAIL ") + label + "  " + Arrays.toString(tokens)
            + " -> stack " + o + ", brute " + b + (ok ? "" : "  expected " + want));
    }

    // Oracle: random expression tree, evaluated directly, emitted as postfix.
    static Random rnd = new Random(39);

    static int gen(int depth, List<String> out) {
        if (depth == 0 || rnd.nextInt(3) == 0) {
            int v = rnd.nextInt(401) - 200;
            out.add(String.valueOf(v));
            return v;
        }
        List<String> left = new ArrayList<>(), right = new ArrayList<>();
        int a = gen(depth - 1, left);
        int b = gen(depth - 1, right);
        String op = "+-*/".charAt(rnd.nextInt(4)) + "";
        if (op.equals("/") && b == 0) op = "+";
        if (op.equals("*") && Math.abs((long) a * b) > 1_000_000) op = "-";
        out.addAll(left); out.addAll(right); out.add(op);
        return switch (op) {
            case "+" -> a + b;
            case "-" -> a - b;
            case "*" -> a * b;
            default  -> a / b;
        };
    }

    public static void main(String[] args) {
        System.out.println("day 39 - Evaluate Reverse Polish Notation");

        check("worked example", new String[] { "5", "1", "2", "+", "4", "*", "+", "3", "-" }, 14);
        check("LC example 1",   new String[] { "2", "1", "+", "3", "*" }, 9);
        check("LC example 2",   new String[] { "4", "13", "5", "/", "+" }, 6);
        check("single number",  new String[] { "18" }, 18);
        check("subtraction order", new String[] { "3", "5", "-" }, -2);
        check("division order 6/3", new String[] { "6", "3", "/" }, 2);
        check("division order 3/6", new String[] { "3", "6", "/" }, 0);
        check("neg div -7/2",   new String[] { "-7", "2", "/" }, -3);
        check("neg div 7/-2",   new String[] { "7", "-2", "/" }, -3);
        check("negative token", new String[] { "2", "-3", "*" }, -6);
        check("three minus signs", new String[] { "-3", "-3", "-" }, 0);
        check("zero on top",    new String[] { "0", "5", "/" }, 0);
        check("deep operand pile", new String[] { "1", "2", "3", "4", "5", "+", "+", "+", "+" }, 15);
        check("LC example 3",   new String[] { "10", "6", "9", "3", "+", "-11", "*", "/", "*", "17", "+", "5", "+" }, 22);

        int agree = 0;
        for (int t = 0; t < 500; t++) {
            List<String> toks = new ArrayList<>();
            int want = gen(1 + rnd.nextInt(6), toks);
            String[] in = toks.toArray(new String[0]);
            int o = new Optimal().evalRPN(in.clone());
            int b = new Brute().evalRPN(in.clone());
            if (o == want && b == want) agree++;
            else {
                failures++;
                System.out.println("  FAIL random " + toks + " -> " + o + " / " + b + " expected " + want);
            }
        }
        System.out.println("  ok   " + agree + "/500 random expressions match the tree oracle, both versions");

        System.out.println(failures == 0 ? "  day 39 PASSED" : "  day 39 had " + failures + " FAILURES");
    }
}
