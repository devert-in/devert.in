// GATE Programming and Data Structures, part B - authored lesson content.
// Follows the authoring rules documented at the top of general-aptitude.mjs,
// and the C-only language note at the top of programming-and-data-structures.mjs
// (the CS paper is C, not C++/Python - the DA paper's similarly-named subject
// is Python, a different subject id, so no leakage between the two).
//
// Completes Programming & Data Structures (15/15) alongside the original
// file's 5 (C Basics through Structures/Unions/Storage Classes). This file
// covers: recursion, recursion-tracing-and-output-prediction, arrays, stacks,
// queues, linked-lists, trees-and-tree-traversals, binary-search-trees,
// binary-heaps, graph-representations.

export const PROGRAMMING_AND_DATA_STRUCTURES_B = {

  // ---------------- Recursion ----------------

  "recursion": {
    difficulty: "Moderate",
    estimatedMinutes: 30,
    // Verified via YouTube oEmbed (2026-08-29) - real, publicly viewable.
    resources: [{
      kind: "video",
      title: "Recursion in C",
      url: "https://www.youtube.com/watch?v=kepBmgvWNDw",
      description: "Introduces recursion in C programming with worked examples of recursive functions.",
    }],
    whatYoullLearn: [
      "What makes a recursive function actually terminate - the base case, and why it must be reached",
      "How the call stack models recursion: each call gets its own stack frame with its own local variables",
      "Direct vs indirect recursion, and how to compute the maximum stack depth a call will use",
      "Converting simple recursion into an iterative loop, and recognising when that trade-off matters",
    ],
    prerequisites: ["Control Flow and Functions"],
    concept: `## A Function That Calls Itself, On A Smaller Problem

::: story
Recursion solves a problem by breaking it into a smaller version of the SAME problem, plus a small amount of extra work. factorial(5) is 5 * factorial(4); factorial(4) is 4 * factorial(3); and so on, shrinking by one each call, until factorial(0) - the BASE CASE - which is answered directly, with no further recursive call.
:::

::: remember
Every correct recursive function needs exactly two things: a BASE CASE that stops the recursion (answered directly, no further calls), and a RECURSIVE CASE that makes real progress toward that base case on every call. Miss either one and the function either never terminates (infinite recursion, crashing with a stack overflow) or never actually solves anything.
:::

## The Call Stack: Recursion's Real Mechanism

::: story
Each call to a recursive function - even a call to itself - gets its OWN fresh stack frame: its own copy of every local variable and parameter, completely separate from every other call's copy. factorial(5)'s "n" and factorial(4)'s "n" are different memory locations that happen to share a variable name in the source code.
:::

::: flow
Calling down :: factorial(5) calls factorial(4), which calls factorial(3), ... down to factorial(0). Each call pushes a new stack frame; nothing returns yet.
Base case hits :: factorial(0) returns 1 directly - no further calls, the recursion "bottoms out" here.
Unwinding back up :: factorial(1) = 1 * factorial(0) = 1*1 = 1. factorial(2) = 2 * factorial(1) = 2*1 = 2. Each return pops its stack frame and multiplies by the answer just received - the multiplications actually happen on the way BACK UP, not on the way down.
:::

::: mistake
Assuming the work happens "on the way down" (during the calls) rather than tracing exactly WHERE in the code the recursive call sits relative to other statements. A statement placed BEFORE the recursive call runs on the way down (in call order); a statement placed AFTER it runs on the way back up (in REVERSE call order) - this exact distinction is what recursion-tracing questions test.
:::

## Direct, Indirect, And Stack Depth

::: cards
Direct recursion :: A function calls itself directly - f() calls f().
Indirect (mutual) recursion :: f() calls g(), which calls f() again - the cycle goes through another function first, but is still recursion.
Maximum stack depth :: For a recursion that shrinks the problem by 1 each call (like factorial(n)), the maximum depth is n+1 stack frames (n recursive calls plus the base case) - each frame consumes real stack memory, which is exactly why very deep recursion can overflow the stack.
:::

::: checkpoint
What happens if a recursive function is written WITHOUT a base case (or the base case is never reached)?
- ( ) It runs once and returns 0
- ( ) The compiler rejects it
- (x) It recurses indefinitely until the call stack overflows
- ( ) It automatically converts to a loop
> With no reachable base case, each call keeps pushing a new stack frame with no call ever returning - this consumes stack memory until it runs out, crashing with a stack overflow, not an infinite loop in the usual CPU-spinning sense.
:::`,
    codeExample: {
      language: "c",
      code: `#include <stdio.h>

int factorial(int n) {
    if (n == 0) return 1;              /* base case */
    return n * factorial(n - 1);       /* recursive case */
}

int fibonacci(int n) {
    if (n <= 1) return n;              /* base case (two of them, n=0 and n=1) */
    return fibonacci(n - 1) + fibonacci(n - 2);  /* two recursive calls */
}

int main(void) {
    printf("%d\\n", factorial(5));     /* 120 */
    printf("%d\\n", fibonacci(6));     /* 8 */
    return 0;
}`,
      expectedOutput: `120
8`,
    },
    dryRun: `Trace factorial(3), watching exactly when the multiplication happens.

::: timeline Call stack, down then up
factorial(3) called :: n=3 != 0, so it calls factorial(2) and WAITS for the result before it can multiply.
factorial(2) called :: n=2 != 0, calls factorial(1) and waits.
factorial(1) called :: n=1 != 0, calls factorial(0) and waits.
factorial(0) called :: n=0 - BASE CASE. Returns 1 immediately, no further calls.
factorial(1) resumes :: Receives 1 from factorial(0). Returns 1 * 1 = 1.
factorial(2) resumes :: Receives 1 from factorial(1). Returns 2 * 1 = 2.
factorial(3) resumes :: Receives 2 from factorial(2). Returns 3 * 2 = 6.
:::

Final answer: factorial(3) = 6. Notice the multiplications happen entirely during the UNWIND (bottom to top), not during the initial calls (top to bottom) - this is the core insight recursion-tracing questions test.`,
    keyPoints: [
      "Every correct recursion needs a base case (stops it) and a recursive case that makes real progress toward that base case.",
      "Each recursive call gets its own independent stack frame - same variable names, different memory for each call.",
      "Code placed BEFORE the recursive call executes in call order (top-down); code placed AFTER it executes in reverse call order (bottom-up, during unwinding).",
      "Direct recursion: a function calls itself. Indirect/mutual recursion: two or more functions call each other in a cycle.",
      "Missing or unreachable base case causes unbounded stack growth - crashing with a stack overflow, not a silently-spinning infinite loop.",
    ],
    analogies: [
      "Recursion is like a set of Russian nesting dolls: you can't get to the smallest doll's answer until you've opened every larger one first, and you can't close the larger ones back up until the smallest one is answered - opening = calling down, closing = returning/unwinding.",
    ],
    commonMistakes: [
      "Forgetting the base case entirely, or writing one that's never actually reached (e.g. shrinking n by 2 each time but only checking n==0, missing odd starting values).",
      "Assuming a statement runs 'during the call' regardless of where it's textually placed relative to the recursive call - placement before/after the recursive call changes the actual execution order.",
      "Treating recursive calls as though they share variables across calls - each call's locals are entirely separate, even though they share a name in the source.",
      "Underestimating stack depth for recursion on large inputs, causing an unexpected stack overflow that a loop-based version would have avoided entirely.",
    ],
    memoryTricks: [
      "\"Before the call: top-down order. After the call: bottom-up order.\" The single fact that answers almost every recursion-tracing question.",
      "Base case = the exit door. Recursive case = the hallway that always leads a little closer to that door.",
    ],
    formulas: [
      "Maximum stack depth for a recursion shrinking by 1 each call, starting at n, base case at 0: n+1 stack frames.",
    ],
    shortcuts: [
      "To predict a recursive function's printed output fast, split its body into 'before the recursive call' and 'after it' - list the before-statements in call order, then the after-statements in REVERSE call order, and you have the full output without drawing the whole call tree.",
      "Before tracing a recursive function by hand, identify the base case and confirm every recursive call genuinely shrinks toward it - this catches an infinite-recursion trick question before wasting time tracing something that never terminates.",
    ],
    pyqRelevance: `Recursion appears constantly on GATE, both as direct code-tracing questions ("what does this function print for n=5?") and as a foundation for later topics (trees, graphs, divide-and-conquer algorithms are all recursively defined). The single highest-value skill is correctly separating before-the-call code from after-the-call code when predicting output.`,
    interviewConnection: `Recursion is the default approach for tree/graph traversal, divide-and-conquer algorithms, and backtracking - and understanding the call stack model directly explains why naive recursive solutions (like plain recursive Fibonacci) can be exponentially slow without memoization, a near-universal interview follow-up question.`,
    revisionSummary: `Recursion needs a base case (stops it) and a recursive case (shrinks toward the base case). Each call gets its own stack frame.

Code before the recursive call runs top-down (call order); code after it runs bottom-up (reverse call order, during unwinding) - the key to output-prediction questions.

No reachable base case -> stack overflow, not a silent infinite loop.`,
    shortNotes: {
      oneMinute: "Recursion needs base case + recursive case (shrinks toward it). Each call has its own stack frame. Code BEFORE recursive call = top-down order; code AFTER = bottom-up/reverse order (this is the trace-question key). No base case -> stack overflow.",
    },
    mcqs: [
      {
        question: "In `void f(int n) { if (n==0) return; printf(\"%d \", n); f(n-1); }`, what does f(3) print?",
        options: ["3 2 1", "1 2 3", "3 2 1 0", "0 1 2 3"],
        correctIndex: 0,
        explanation: "The printf is BEFORE the recursive call, so it executes in call order (top-down): prints 3, then calls f(2) which prints 2, then f(1) prints 1, then f(0) hits the base case and returns without printing. Output: 3 2 1.",
      },
      {
        question: "In `void f(int n) { if (n==0) return; f(n-1); printf(\"%d \", n); }`, what does f(3) print?",
        options: ["3 2 1", "1 2 3", "0 1 2 3", "3 2 1 0"],
        correctIndex: 1,
        explanation: "The printf is AFTER the recursive call, so it executes during unwinding, in REVERSE call order: the deepest call (f(1), printing 1) finishes first, then f(2) prints 2, then f(3) prints 3. Output: 1 2 3.",
      },
    ],
    numericals: [
      {
        question: "For a recursive function that reduces n by 1 each call down to a base case at n=0, starting at n=8, how many total stack frames (including the base case call) exist at the deepest point?",
        answerMin: 9,
        answerMax: 9,
        unit: "frames",
        solution: `Calls occur for n = 8,7,6,5,4,3,2,1,0 - that is 9 values, so 9 stack frames exist simultaneously at the deepest point (n=0's frame, with all 8 earlier calls still waiting above it on the stack).`,
      },
    ],
  },

  "recursion-tracing-and-output-prediction": {
    difficulty: "Moderate",
    estimatedMinutes: 30,
    // Verified via YouTube oEmbed (2026-08-29) - real, publicly viewable.
    resources: [{
      kind: "video",
      title: "Recursion (Solved Problem 1)",
      url: "https://www.youtube.com/watch?v=IVLUGb_gDDE",
      description: "Traces a recursive C function step by step to predict its output for a solved GATE-style problem.",
    }],
    whatYoullLearn: [
      "A systematic method for predicting a recursive function's exact printed output by hand",
      "Tracing recursion that has multiple recursive calls per invocation (like a tree, not a single chain)",
      "Tracking a value that's modified and then passed by reference vs by value across recursive calls",
      "Common GATE trace-question shapes and the fastest correct way to work through each",
    ],
    prerequisites: ["Recursion"],
    concept: `## A Repeatable Method, Not Guesswork

::: story
Tracing recursion by hand is a skill GATE tests directly, and it rewards a REPEATABLE method over trying to "just picture it" - the method: draw the call tree (or chain, for single-recursive-call functions), mark every statement's position relative to the recursive call(s), then read off output in the correct order for each position.
:::

::: remember
The core rule from Recursion still applies: statements BEFORE a recursive call run in call (top-down) order; statements AFTER a recursive call run in reverse call (bottom-up) order. When a function makes recursive call, when there are TWO OR MORE recursive calls, this rule applies separately around EACH call.
:::

## Tracing Multiple Recursive Calls (A Tree, Not A Chain)

::: story
A function like fibonacci(n) that makes two recursive calls doesn't unwind in a simple straight line - it branches into a full binary call TREE. To trace its output correctly, you must fully finish (call AND return from) the entire left branch before the right branch even starts, exactly matching how a program actually executes statements one at a time.
:::

::: flow
1. Draw the call tree :: Each node is one function call; its children are the recursive calls it makes, in the ORDER they appear in the code.
2. Traverse depth-first, left to right :: Fully explore (and return from) the first recursive call's entire subtree before touching the second recursive call - this matches real execution order exactly.
3. Mark statement positions per call :: For each node in the tree, note which of its statements run before its first recursive call, between its two recursive calls (if any), and after its last recursive call.
4. Assemble output in traversal order :: Walk the tree in the depth-first order from step 2, emitting each call's before/between/after statements exactly when the traversal visits that position.
:::

::: mistake
Trying to trace a two-recursive-call function "level by level" (like a breadth-first traversal) instead of depth-first. Real program execution is always depth-first: the ENTIRE first recursive call - including everything it calls - fully completes before the second recursive call even begins.
:::

## Value Changes: Pass-By-Value vs Pass-By-Reference

::: cards
Pass by value (plain int parameter) :: Each call gets its OWN COPY. Changing the parameter inside a call has zero effect on the caller's variable.
Pass by pointer/reference :: The call receives the ADDRESS of the caller's variable. Changing *ptr inside the call DOES change the caller's actual variable - this is how a recursive function can accumulate a running result across calls.
Global/static variable :: Shared across every call, unlike a local parameter - changes made by one call are visible to every other call, including ones that haven't happened yet.
:::

::: checkpoint
A recursive function f(n) prints "enter n", then (if n>1) calls f(n-1) then f(n-2) in that order, then prints "exit n". For f(2), in what order do the two recursive calls' "enter" messages appear?
- (x) enter 1 (from f(n-1)), then enter 0 (from f(n-2))
- ( ) enter 0, then enter 1
- ( ) Both print simultaneously
- ( ) Cannot be determined
> Execution is depth-first, left to right: f(n-1) (f(1)) is called FIRST and fully completes (enters, and since n=1 isn't >1, exits immediately) BEFORE f(n-2) (f(0)) is even called. So "enter 1" (and its matching exit) happens entirely before "enter 0".
:::`,
    codeExample: {
      language: "c",
      code: `#include <stdio.h>

void trace(int n) {
    if (n == 0) return;
    printf("enter %d\\n", n);
    if (n > 1) {
        trace(n - 1);
        trace(n - 2);
    }
    printf("exit %d\\n", n);
}

int main(void) {
    trace(3);
    return 0;
}`,
      expectedOutput: `enter 3
enter 2
enter 1
exit 1
exit 2
enter 1
exit 1
exit 3`,
    },
    dryRun: `Trace trace(3) using the depth-first call-tree method.

::: timeline Depth-first order, left branch fully before right branch
trace(3) :: n=3, prints "enter 3". n>1, so calls trace(2) FIRST (must fully finish before trace(1) even starts).
trace(2) (from trace(3)'s first call) :: n=2, prints "enter 2". n>1, calls trace(1) first.
trace(1) (from trace(2)) :: n=1, prints "enter 1". n is NOT >1, so no further recursive calls. Prints "exit 1" and returns.
trace(2) resumes :: Its trace(1) call is done; now calls trace(0). trace(0): n=0, returns immediately (base case, no prints at all). trace(2) then prints "exit 2" and returns.
trace(3) resumes :: Its trace(2) call is fully done (with everything above). NOW trace(3) calls trace(1) (its SECOND call, n-2=1). trace(1): prints "enter 1", not >1, prints "exit 1", returns.
trace(3) finishes :: Both its recursive calls are done. Prints "exit 3" and returns.
:::

Full output, in order: enter 3, enter 2, enter 1, exit 1, exit 2, enter 1, exit 1, exit 3 - exactly matching the code example's expected output. Notice trace(1) is entered TWICE (once from trace(2), once directly from trace(3)) - each is a completely separate call.`,
    keyPoints: [
      "Trace recursion with a repeatable method: draw the call tree, mark statement positions relative to each recursive call, then read output in execution order.",
      "Real execution is always depth-first, left to right - the entire first recursive call (and everything IT calls) fully completes before the second recursive call even begins.",
      "Pass-by-value parameters are independent copies per call; pass-by-pointer/reference and global/static variables are shared and can carry state across calls.",
      "A function value like trace(1) can be called multiple times from different points in the tree - each is a fully separate call with its own stack frame, even though the argument value is identical.",
    ],
    analogies: [
      "Tracing a multi-call recursion is like reading a book with footnotes that themselves have footnotes: you must finish reading an ENTIRE footnote (and all of its own nested footnotes) before returning to read the next line of the original text.",
    ],
    commonMistakes: [
      "Tracing a two-recursive-call function level-by-level (breadth-first) instead of depth-first, which produces output in the wrong order.",
      "Assuming a parameter change inside a recursive call affects the caller's variable when the parameter is passed by value (a plain int, not a pointer).",
      "Losing track of which specific call (among several calls with the same argument value) is currently executing, especially when a function is called with the same n from two different points in the tree.",
      "Forgetting to check the base case's own print statements (or lack of them) - a base case that returns silently contributes nothing to the output, which is easy to overlook while focused on the recursive branches.",
    ],
    memoryTricks: [
      "\"Depth first, left to right, every time\" - real recursion execution never skips ahead to a later call before an earlier one (and everything it calls) is fully done.",
      "Before the call = top-down. After the call = bottom-up. Between two calls = right after the first call's ENTIRE subtree finishes.",
    ],
    formulas: [],
    shortcuts: [
      "For a function with two recursive calls, draw the call tree first and number the nodes in the exact depth-first visiting order BEFORE trying to write out any actual output - this separates 'figuring out the order' from 'writing the printed values', which is where most tracing errors happen.",
      "If a parameter is passed by pointer, explicitly track its VALUE at each point in the trace as if it were a shared global - this avoids the value-by-value trap for that one variable specifically.",
    ],
    pyqRelevance: `Recursion tracing/output-prediction is one of the single most common GATE question types in this entire subject - typically a short C function with 1-2 recursive calls, asking for exact printed output. The depth-first, left-to-right execution rule is the one fact that resolves nearly every such question correctly and quickly.`,
    interviewConnection: `The ability to trace recursive execution by hand is exactly the skill used when debugging a stack overflow or an unexpectedly-ordered output in real recursive code, and is a near-universal component of technical interview "trace this code" questions.`,
    revisionSummary: `Trace recursion with a repeatable method: draw the call tree, note statement positions relative to each recursive call, read output in execution order.

Execution is always depth-first, left to right - the first recursive call's ENTIRE subtree finishes before the second call even starts.

Pass-by-value parameters are independent per call; pointers/globals are shared and can carry state across calls.`,
    shortNotes: {
      oneMinute: "Trace by drawing the call tree, depth-first, left-to-right (first call's whole subtree finishes before second call starts). Before-call code = top-down order; after-call code = bottom-up/reverse order. Pass-by-value = independent copies; pointers/globals = shared across calls.",
    },
    mcqs: [
      {
        question: "A function makes two recursive calls, f(n-1) then f(n-2). For f(4), which call completes LAST?",
        options: ["f(n-1)'s entire subtree", "f(n-2)'s entire subtree", "They complete simultaneously", "Cannot be determined"],
        correctIndex: 1,
        explanation: "Depth-first execution means f(n-1)'s ENTIRE subtree runs and fully completes first; f(n-2) only starts after that, so f(n-2)'s subtree is the one still finishing last, right before the outer call itself returns.",
      },
    ],
    numericals: [],
  },

  // ---------------- Linear Data Structures ----------------

  "arrays": {
    difficulty: "Easy",
    estimatedMinutes: 25,
    // Verified via YouTube oEmbed (2026-08-29) - real, publicly viewable.
    resources: [{
      kind: "video",
      title: "Lec-3: Arrays in Data Structure by #Naina Mam | Initialization, Declaration, Memory Representation",
      url: "https://www.youtube.com/watch?v=6e6yKtr2VGI",
      description: "Introduces arrays as a data structure, covering declaration, initialization, and memory representation.",
    }],
    whatYoullLearn: [
      "Why array access is O(1) - the actual address arithmetic behind arr[i]",
      "Why insertion/deletion in the middle of an array is O(n), not O(1)",
      "Row-major address calculation for a 2D array, the classic GATE numerical",
      "Static vs dynamic arrays, and the real cost of 'growing' an array",
    ],
    prerequisites: ["Structures, Unions and Storage Classes"],
    concept: `## Why arr[i] Is O(1): It's Just Arithmetic

::: story
An array stores its elements in one CONTIGUOUS block of memory - element 0 right next to element 1, right next to element 2, and so on. Because of this, the address of arr[i] is computable directly from arr's base address, with no searching required at all: base_address + i * size_of_one_element.
:::

::: remember
Address(arr[i]) = Base + i * ElementSize. This single formula is why array indexing is O(1) regardless of array size or which index is accessed - it's pure arithmetic, not a search.
:::

## Insertion And Deletion: Where The O(n) Comes From

::: cards
Access arr[i] :: O(1) - direct address arithmetic, no traversal.
Insert/delete at the END :: O(1) (if there's spare capacity) - no other elements need to move.
Insert/delete at the BEGINNING or MIDDLE :: O(n) - every element after the insertion/deletion point must physically SHIFT to keep the array contiguous, which is the whole reason arrays are fast to access but slow to modify in the middle.
Search for a value (unsorted) :: O(n) - must check elements one by one, since position doesn't relate to value.
:::

::: mistake
Assuming array insertion is always O(1) because "arrays are fast." Access is O(1); insertion/deletion in the middle is O(n) because of the mandatory shifting - conflating these two different operations' complexities is a very common GATE trap.
:::

## Row-Major 2D Array Addressing

::: story
A 2D array is really just a 1D array in disguise - the compiler lays every row out one after another in memory (row-major order, C's default), then computes a single flat address from the row and column index together.
:::

::: flow
Formula :: Address(arr[i][j]) = Base + (i * NumberOfColumns + j) * ElementSize.
Why "i * NumberOfColumns" :: To reach row i, you must skip over ALL i complete rows before it, each of width NumberOfColumns elements.
Then "+ j" :: Once at the start of row i, move j more elements across to reach column j within that row.
:::

::: checkpoint
For a 2D array arr[5][10] of int (4 bytes each), base address 1000, what is the address of arr[2][3]?
- ( ) 1012
- (x) 1092
- ( ) 1023
- ( ) 1200
> Address = Base + (i * cols + j) * size = 1000 + (2*10 + 3)*4 = 1000 + (23)*4 = 1000 + 92 = 1092.
:::`,
    codeExample: {
      language: "c",
      code: `#include <stdio.h>

int main(void) {
    int arr[5] = {10, 20, 30, 40, 50};

    printf("%d\\n", arr[2]);              /* O(1) direct access: 30 */

    /* delete arr[1] by shifting everything after it left by one - O(n) */
    for (int k = 1; k < 4; k++) {
        arr[k] = arr[k + 1];
    }
    /* arr is now {10, 30, 40, 50, 50} (logical size shrinks to 4, last slot stale) */
    for (int k = 0; k < 4; k++) printf("%d ", arr[k]);
    printf("\\n");

    return 0;
}`,
      expectedOutput: `30
10 30 40 50`,
    },
    keyPoints: [
      "Address(arr[i]) = Base + i * ElementSize - array access is O(1) because it's direct arithmetic, not a search.",
      "Insertion/deletion at the end is O(1) (with spare capacity); at the beginning or middle it's O(n) due to mandatory shifting of every following element.",
      "2D row-major addressing: Address(arr[i][j]) = Base + (i * cols + j) * ElementSize - skip i full rows, then j more elements within the target row.",
      "Unsorted-array search is O(n); there's no shortcut without additional structure (like sorting, or a hash table).",
    ],
    analogies: [
      "An array is a row of numbered parking spots - jumping straight to spot #7 is instant (just walk to that exact spot), but inserting a new car in the middle means physically pushing every car after it one spot down.",
    ],
    commonMistakes: [
      "Treating array insertion/deletion as O(1) in general, ignoring that only END operations (with spare capacity) are O(1) - middle/beginning operations require shifting.",
      "Getting the row-major formula's order wrong - it's (i * NumCols + j), not (j * NumRows + i) (that would be column-major, which C does NOT use by default).",
      "Forgetting to multiply by ElementSize at the end of an address calculation, giving an answer in 'element units' instead of actual bytes.",
    ],
    memoryTricks: [
      "\"Access is instant math, modification in the middle is a physical shove.\" O(1) access vs O(n) middle-insertion, in one sentence.",
      "Row-major: \"rows first, THEN columns\" - skip whole rows (i * cols), then step across the target row (+ j).",
    ],
    formulas: [
      "1D: Address(arr[i]) = Base + i * ElementSize.",
      "2D row-major: Address(arr[i][j]) = Base + (i * NumberOfColumns + j) * ElementSize.",
    ],
    shortcuts: [
      "For a row-major address question, compute (i * cols + j) FIRST as a single 'flattened index', then multiply by element size and add the base - splitting the computation into these two steps avoids arithmetic slips.",
      "When asked about array operation complexity, immediately ask 'where in the array does this happen - end, or middle/beginning?' before answering O(1) or O(n).",
    ],
    pyqRelevance: `Row-major (and occasionally column-major) address computation is an extremely reliable 1-2 mark GATE numerical every year - pure formula application, fast marks once the formula is memorised correctly. Array complexity classification (access vs insertion/deletion) is also a frequent conceptual question.`,
    interviewConnection: `Understanding why array access is O(1) but middle-insertion is O(n) directly motivates why linked lists exist (O(1) insertion at a known position, at the cost of O(n) access) - this exact trade-off comparison is one of the most common data-structure interview questions.`,
    revisionSummary: `Address(arr[i]) = Base + i*ElementSize - O(1) access via direct arithmetic.

End insertion/deletion: O(1). Middle/beginning: O(n) due to shifting. Unsorted search: O(n).

2D row-major: Address(arr[i][j]) = Base + (i*cols + j)*ElementSize.`,
    shortNotes: {
      oneMinute: "Address(arr[i])=Base+i*size, O(1) access. End insert/delete O(1); middle/beginning O(n) (shifting). 2D row-major: Base+(i*cols+j)*size. Unsorted search O(n).",
    },
    mcqs: [
      {
        question: "What is the time complexity of deleting the FIRST element of an unsorted array of n elements (keeping it contiguous)?",
        options: ["O(1)", "O(log n)", "O(n)", "O(n^2)"],
        correctIndex: 2,
        explanation: "Deleting the first element requires shifting all n-1 remaining elements one position left to keep the array contiguous - O(n).",
      },
    ],
    numericals: [
      {
        question: "A 2D array arr[10][20] of double (8 bytes each) has base address 2000. What is the address of arr[3][5]? (row-major)",
        answerMin: 2520,
        answerMax: 2520,
        unit: "",
        solution: `Address = Base + (i*cols + j)*size = 2000 + (3*20 + 5)*8 = 2000 + (65)*8 = 2000 + 520 = 2520`,
      },
    ],
  },

  "stacks": {
    difficulty: "Easy",
    estimatedMinutes: 25,
    // Verified via YouTube oEmbed (2026-08-29) - real, publicly viewable.
    resources: [{
      kind: "video",
      title: "Introduction to Stacks",
      url: "https://www.youtube.com/watch?v=I37kGX-nZEI",
      description: "Introduces the stack data structure, the stack ADT, and its primary operations.",
    }],
    whatYoullLearn: [
      "The LIFO discipline and the three core operations: push, pop, peek",
      "Array-based vs linked-list-based stack implementation, and the trade-off between them",
      "How the function call stack itself is literally a stack, connecting straight back to Recursion",
      "Using a stack to check balanced parentheses and to evaluate postfix expressions",
    ],
    prerequisites: ["Arrays", "Recursion"],
    concept: `## Last In, First Out

::: story
A stack allows access only at ONE end - the "top." The last item pushed onto it is always the first one popped off - Last In, First Out (LIFO), exactly like a physical stack of plates: you can only add or remove from the top, never the middle or bottom.
:::

::: cards Core operations, all O(1)
push(x) :: Add x to the top.
pop() :: Remove and return the top element.
peek() / top() :: Look at the top element without removing it.
isEmpty() :: Check whether the stack has any elements at all - checking this before pop/peek avoids reading from an empty stack.
:::

::: remember
Every one of a stack's core operations is O(1) REGARDLESS of implementation (array-based or linked-list-based), because they only ever touch the top - no traversal or shifting is ever required, unlike an array's middle-insertion.
:::

## Array-Based vs Linked-List-Based

::: flow
Array-based stack :: A fixed (or dynamically resized) array plus a "top" index. push increments top and writes; pop reads and decrements top. Simple and cache-friendly, but a fixed-size array can overflow.
Linked-list-based stack :: push/pop operate on the HEAD of a linked list (O(1) at the head - see Linked Lists). No fixed capacity limit (bounded only by available memory), at the cost of one pointer's extra memory per element.
:::

## The Stack Is Not Just A Data Structure - It's How Function Calls Work

::: remember
This connects directly back to Recursion: every function call pushes a stack frame onto the program's actual call stack, and returning pops it. Recursion depth IS stack depth, using exactly the LIFO discipline this topic describes - the most recently called (and not yet returned) function is always the one currently executing, exactly like the top of a stack.
:::

## Classic Applications

::: cards
Balanced parentheses check :: Push every opening bracket; on a closing bracket, pop and check it matches. Unmatched leftover at the end (or a mismatch/pop-on-empty during the scan) means unbalanced.
Postfix expression evaluation :: Scan left to right; push every operand; on an operator, POP the top TWO operands, apply the operator, PUSH the result back. The final remaining stack value is the answer.
Undo functionality, backtracking, DFS (iterative) :: All naturally LIFO - the most recent action/state is the first one undone or explored next.
:::

::: checkpoint
Evaluate the postfix expression "5 3 + 2 *" using a stack. What is the result?
- ( ) 13
- (x) 16
- ( ) 11
- ( ) 10
> Push 5, push 3. See '+': pop 3, pop 5, compute 5+3=8, push 8. Push 2. See '*': pop 2, pop 8, compute 8*2=16, push 16. Final (and only) stack value: 16.
:::`,
    codeExample: {
      language: "c",
      code: `#include <stdio.h>
#define MAX 100

int stack[MAX], top = -1;

void push(int x) { stack[++top] = x; }
int pop(void) { return stack[top--]; }
int isEmpty(void) { return top == -1; }

int main(void) {
    push(5);
    push(3);
    int b = pop(), a = pop();
    push(a + b);          /* postfix "5 3 +" -> pushes 8 */
    push(2);
    b = pop(); a = pop();
    push(a * b);          /* postfix "... 2 *" -> pushes 16 */

    printf("%d\\n", pop());   /* 16 */
    printf("%d\\n", isEmpty()); /* 1 (true) */
    return 0;
}`,
      expectedOutput: `16
1`,
    },
    keyPoints: [
      "Stack: LIFO - last pushed is first popped. Core operations (push, pop, peek, isEmpty) are all O(1) in both array-based and linked-list-based implementations.",
      "Array-based stacks are simple and cache-friendly but can overflow a fixed size; linked-list-based stacks have no fixed capacity but use extra memory per element for pointers.",
      "The program's actual function call stack IS a stack in exactly this sense - recursion depth is stack depth, directly connecting to the Recursion topic.",
      "Balanced-parentheses checking and postfix expression evaluation are the two classic stack applications GATE tests most often.",
    ],
    analogies: [
      "A stack is a stack of plates in a cafeteria: you can only take the top plate or add a new one on top - reaching into the middle isn't an option the structure allows.",
    ],
    commonMistakes: [
      "Popping from an empty stack without checking isEmpty() first, causing undefined behaviour (in an array-based stack, this typically means reading garbage or an out-of-bounds index).",
      "In postfix evaluation, popping the operands in the wrong order for non-commutative operators (subtraction, division) - the FIRST pop is the RIGHT operand, the SECOND pop is the LEFT operand, since it was pushed earlier.",
      "Assuming a stack-based operation is O(n) 'because it might need to search' - every core stack operation only ever touches the top, so it's O(1) regardless of stack size.",
    ],
    memoryTricks: [
      "LIFO: \"Last In, First Out\" - the plate you just put down is the plate you pick up next.",
      "Postfix evaluation: operand, operand, operator - pop twice, apply, push once, repeat.",
    ],
    formulas: [],
    shortcuts: [
      "For postfix evaluation with a subtraction or division operator, explicitly label which pop is 'first' (right operand) and which is 'second' (left operand) before computing - this single labelling step prevents the most common postfix-evaluation error.",
      "For a balanced-parentheses question, a quick pre-check is comparing the total count of opening vs closing brackets - if they don't match, it's unbalanced with zero need to actually trace the stack.",
    ],
    pyqRelevance: `Stacks are heavily tested via postfix/prefix expression evaluation and infix-to-postfix conversion numericals (near-guaranteed most years), plus conceptual questions on time complexity of stack operations and the balanced-parentheses application.`,
    interviewConnection: `Stacks directly implement undo/redo functionality, browser back-button history, and are the standard tool for converting recursive algorithms into iterative ones (an explicit stack replacing the implicit call stack) - one of the most frequently reused data structures across real software.`,
    revisionSummary: `Stack: LIFO, all core operations (push/pop/peek/isEmpty) are O(1) regardless of array-based or linked-list-based implementation.

The function call stack IS a stack in this exact sense - recursion depth is stack depth.

Classic applications: balanced-parentheses checking, postfix expression evaluation (pop two, apply, push one).`,
    shortNotes: {
      oneMinute: "Stack: LIFO. push/pop/peek/isEmpty all O(1). Array-based: can overflow. Linked-list-based: no fixed limit. Call stack = a real stack (recursion depth = stack depth). Postfix eval: pop two (2nd pop=left operand), apply, push result. Balanced parens: push opens, pop-check on closes.",
    },
    mcqs: [
      {
        question: "What is the time complexity of the push operation on a stack (array or linked-list based)?",
        options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
        correctIndex: 0,
        explanation: "push only ever touches the top of the stack, with no traversal or shifting required in either implementation - O(1).",
      },
    ],
    numericals: [
      {
        question: "Evaluate the postfix expression \"6 2 3 + *\" using a stack.",
        answerMin: 30,
        answerMax: 30,
        unit: "",
        solution: `Push 6, push 2, push 3. See '+': pop 3, pop 2, compute 2+3=5, push 5. Stack: [6, 5].
See '*': pop 5, pop 6, compute 6*5=30, push 30. Final value: 30.`,
      },
    ],
  },

  "queues": {
    difficulty: "Easy",
    estimatedMinutes: 25,
    // Verified via YouTube oEmbed (2026-08-29) - real, publicly viewable.
    resources: [{
      kind: "video",
      title: "Queues | Chapter-7 | Data Structures | nesoacademy.org",
      url: "https://www.youtube.com/watch?v=D80AB1WkzRk",
      description: "Covers the queue data structure, its properties, and its operations.",
    }],
    whatYoullLearn: [
      "The FIFO discipline and the two ends a queue operates at",
      "Why a naive array-based queue wastes space, and how a CIRCULAR array queue fixes it",
      "Queue variants: circular queue, priority queue, and double-ended queue (deque)",
      "Where queues show up elsewhere in the syllabus - BFS traversal and CPU/process scheduling",
    ],
    prerequisites: ["Arrays"],
    concept: `## First In, First Out

::: story
A queue models a real waiting line: whoever arrived FIRST is served FIRST. Insertion happens at the REAR (enqueue), removal happens at the FRONT (dequeue) - two different ends, unlike a stack's single end.
:::

::: cards Core operations, all O(1) with the right implementation
enqueue(x) :: Add x at the rear.
dequeue() :: Remove and return the element at the front.
front() / peek() :: Look at the front element without removing it.
isEmpty() :: Check whether the queue has any elements.
:::

## The Naive Array Queue's Wasted-Space Problem

::: story
A naive array-based queue just moves a "front" index forward on every dequeue - simple, but the slots BEHIND the new front are now wasted: they can never be reused, even though they're empty, because the array's raw index keeps climbing. After enough enqueue/dequeue cycles, a fixed-size array queue can report "full" while most of its actual slots sit empty.
:::

::: remember
The fix is a CIRCULAR QUEUE: front and rear indices WRAP AROUND using modulo arithmetic (index = (index + 1) % capacity), so the freed slots behind the front get reused instead of wasted. This is the standard, GATE-tested queue implementation - "queue" without qualification on GATE usually means circular queue behaviour is assumed for capacity questions.
:::

## Queue Variants

::: cards
Circular queue :: Front/rear wrap using modulo arithmetic - fixes the naive array queue's wasted space.
Priority queue :: Dequeue always removes the HIGHEST (or lowest) priority element, not necessarily the one that arrived first - typically implemented with a heap (see Binary Heaps), giving O(log n) insert/extract instead of a plain queue's O(1).
Deque (double-ended queue) :: Insertion and removal are both allowed at EITHER end (front or rear) - a strict generalisation of both stack and queue behaviour.
:::

::: mistake
Confusing a priority queue's dequeue order with a plain queue's - a priority queue does NOT guarantee FIFO order; it guarantees priority order, which can be completely different from arrival order.
:::

## Where Queues Reappear Later In The Syllabus

::: remember
Breadth-first search (BFS) on a graph or tree uses a queue to track which node to visit next - explore all of the current level before moving to the next, exactly the FIFO order a queue enforces. CPU scheduling algorithms like Round-Robin are also literally queue-based, cycling processes through in arrival order.
:::

::: checkpoint
A circular queue has capacity 5, with front=2 and rear=4 (0-indexed, currently holding 3 elements). After one more enqueue, what does rear become?
- ( ) 5
- (x) 0
- ( ) 4
- ( ) 1
> rear = (rear + 1) % capacity = (4 + 1) % 5 = 5 % 5 = 0 - the index wraps back around to 0 instead of running off the end of the array, which is exactly the circular queue's fix for the naive array queue's wasted space.
:::`,
    codeExample: {
      language: "c",
      code: `#include <stdio.h>
#define CAP 5

int q[CAP], front = 0, rear = -1, count = 0;

void enqueue(int x) {
    rear = (rear + 1) % CAP;
    q[rear] = x;
    count++;
}
int dequeue(void) {
    int x = q[front];
    front = (front + 1) % CAP;
    count--;
    return x;
}

int main(void) {
    enqueue(10); enqueue(20); enqueue(30);
    printf("%d\\n", dequeue());   /* 10 - first in, first out */
    enqueue(40);
    printf("%d\\n", dequeue());   /* 20 */
    printf("%d\\n", count);       /* 2 remaining: 30, 40 */
    return 0;
}`,
      expectedOutput: `10
20
2`,
    },
    keyPoints: [
      "Queue: FIFO - enqueue at the rear, dequeue from the front. Core operations are O(1) with a proper (circular) implementation.",
      "A naive array queue wastes slots behind the advancing front index; a CIRCULAR queue fixes this with modulo-wrapped front/rear indices.",
      "Priority queue dequeues by priority, not arrival order - typically heap-implemented, O(log n) not O(1). Deque allows insert/remove at both ends.",
      "BFS uses a queue to enforce level-by-level (FIFO) traversal order; CPU scheduling algorithms like Round-Robin are directly queue-based.",
    ],
    analogies: [
      "A queue is a checkout line: the first person to join is the first person served - and a circular queue is that same line wrapped into a loop, so freed-up spots at the front get reused as new people join at the back.",
    ],
    commonMistakes: [
      "Implementing a queue with a naive advancing-front-index array and being surprised the queue reports 'full' with empty slots behind the front.",
      "Assuming a priority queue dequeues in arrival (FIFO) order - it dequeues in PRIORITY order, which can differ completely from arrival order.",
      "Forgetting the modulo wrap when computing front/rear for a circular queue, causing an out-of-bounds index once the queue wraps past the array's end.",
    ],
    memoryTricks: [
      "FIFO: \"First In, First Out\" - whoever joined the line first leaves it first, unlike a stack's LIFO.",
      "Circular queue index update: \"(index + 1) % capacity\" - the one formula that prevents wasted space and out-of-bounds indices both at once.",
    ],
    formulas: [
      "Circular queue index update: newIndex = (index + 1) % capacity.",
    ],
    shortcuts: [
      "When a GATE question describes a fixed-size array queue implementation, check whether it explicitly uses modulo wrapping - if not stated, assume the naive version and watch for the 'reports full while slots are empty' trap in the answer choices.",
      "If a question mentions 'process the highest-priority item next' rather than 'process items in arrival order', it's a priority queue question, not a plain queue - reach for heap-based reasoning (O(log n)), not O(1) plain-queue reasoning.",
    ],
    pyqRelevance: `Queues appear via circular-queue index computation numericals (a reliable 1-mark question) and conceptually through their role in BFS and CPU scheduling - both frequently cross-referenced from Algorithms and Operating System questions rather than tested as pure standalone queue theory.`,
    interviewConnection: `Queues are the standard structure for task scheduling, message brokers/buffering, and any 'process requests in arrival order' system design - and BFS's queue-based level-order traversal is one of the most frequently asked graph-algorithm interview questions.`,
    revisionSummary: `Queue: FIFO, enqueue at rear, dequeue at front, O(1) operations with a proper implementation.

Naive array queue wastes space behind the front; circular queue fixes this via modulo-wrapped indices: (index+1) % capacity.

Priority queue: dequeues by priority (usually heap-based, O(log n)), not arrival order. Deque: insert/remove at both ends. BFS and Round-Robin scheduling are directly queue-based.`,
    shortNotes: {
      oneMinute: "Queue: FIFO, enqueue rear/dequeue front, O(1). Naive array queue wastes space; circular queue fixes via (index+1)%capacity. Priority queue: dequeues by priority not arrival (heap-based, O(log n)). Deque: both ends. BFS and Round-Robin scheduling are queue-based.",
    },
    mcqs: [
      {
        question: "What is the defining difference between a queue and a stack?",
        options: [
          "Queue is FIFO, stack is LIFO",
          "Queue is LIFO, stack is FIFO",
          "Both are FIFO but with different time complexity",
          "There is no functional difference",
        ],
        correctIndex: 0,
        explanation: "A queue is First In, First Out (insertion at rear, removal at front); a stack is Last In, First Out (insertion and removal both at the same end, the top).",
      },
    ],
    numericals: [
      {
        question: "A circular queue has capacity 6. Currently front=4. After one dequeue, what does front become?",
        answerMin: 5,
        answerMax: 5,
        unit: "",
        solution: `front = (front + 1) % capacity = (4 + 1) % 6 = 5 % 6 = 5`,
      },
    ],
  },

  "linked-lists": {
    difficulty: "Moderate",
    estimatedMinutes: 30,
    // Verified via YouTube oEmbed (2026-08-29) - real, publicly viewable.
    resources: [{
      kind: "video",
      title: "Introduction to Linked List",
      url: "https://www.youtube.com/watch?v=R9PTBwOzceo",
      description: "Introduces the linked list data structure and the motivation behind it.",
    }],
    whatYoullLearn: [
      "Why linked-list insertion/deletion at a KNOWN position is O(1), unlike an array's O(n)",
      "Singly, doubly, and circular linked lists, and what each buys over a plain singly-linked list",
      "The specific pointer-manipulation order that avoids losing the rest of the list",
      "Why linked lists have no O(1) random access, and what that costs elsewhere",
    ],
    prerequisites: ["Arrays", "Structures, Unions and Storage Classes"],
    concept: `## Nodes Connected By Pointers, Not By Contiguous Memory

::: story
A linked list stores each element in its own separately-allocated NODE, containing the data plus a pointer to the next node. Unlike an array, nodes are NOT contiguous in memory - the only thing connecting them is the chain of pointers, which is exactly what makes insertion cheap (no shifting) but random access expensive (no direct address arithmetic).
:::

::: cards The core trade-off vs arrays
Insertion/deletion at a KNOWN node :: O(1) - just re-point a couple of pointers, no shifting of other elements at all.
Access by index (arr[i]-style) :: O(n) - must walk the chain from the head, one pointer at a time; there is no address-arithmetic shortcut like an array has.
Search for a value :: O(n) either way (array or list) if unsorted - but a list's O(n) search additionally can't binary-search even if sorted, since there's no O(1) middle-jump.
:::

::: mistake
Assuming linked-list insertion is ALWAYS O(1) - it's O(1) only once you already HAVE a pointer to the insertion point. If you first have to SEARCH for that position (e.g. "insert after the node with value 7"), that search itself is O(n), making the whole operation O(n) end to end.
:::

## Pointer Surgery: The Order That Doesn't Lose The List

::: flow
Inserting a new node AFTER a given node p :: 1) newNode->next = p->next (save the rest of the list FIRST). 2) p->next = newNode (now link p to the new node). Doing this in the OPPOSITE order overwrites p->next before the rest of the list is saved, permanently losing everything after p.
Deleting the node AFTER a given node p :: 1) Save temp = p->next. 2) p->next = temp->next (skip over temp). 3) free(temp) (release the now-unreachable node's memory) - freeing BEFORE step 2 would use a dangling pointer.
:::

::: remember
The single rule behind both operations: NEVER overwrite the only pointer to a piece of the list before you've saved a copy of it somewhere else. This ordering is the single most common source of linked-list bugs (and GATE trace-question traps).
:::

## Singly, Doubly, Circular

::: cards
Singly linked :: Each node points only to the NEXT node. Traversal is one-directional; O(n) to reach the previous node from any given node.
Doubly linked :: Each node has both a next AND a prev pointer. O(1) to move backward, at the cost of one extra pointer's memory per node.
Circular linked list :: The last node's next points back to the FIRST node instead of NULL - useful for round-robin-style repeated cycling (e.g. CPU scheduling's ready queue), and has no true "end" to detect via a NULL check.
:::

::: checkpoint
Given a pointer p to a node, and you want to insert a new node right after it, what is the FIRST pointer assignment that must happen?
- (x) newNode->next = p->next
- ( ) p->next = newNode
- ( ) newNode->next = NULL
- ( ) p->next = NULL
> The rest of the list (p->next) must be saved into newNode->next BEFORE p->next is overwritten to point at newNode - doing it in the other order would permanently lose every node after p.
:::`,
    codeExample: {
      language: "c",
      code: `#include <stdio.h>
#include <stdlib.h>

struct Node { int data; struct Node *next; };

void insertAfter(struct Node *p, int val) {
    struct Node *newNode = malloc(sizeof(struct Node));
    newNode->data = val;
    newNode->next = p->next;   /* save the rest of the list FIRST */
    p->next = newNode;         /* THEN link p to the new node */
}

int main(void) {
    struct Node a = {1, NULL}, b = {2, NULL};
    a.next = &b;                /* list: 1 -> 2 */

    insertAfter(&a, 99);        /* list: 1 -> 99 -> 2 */

    for (struct Node *cur = &a; cur != NULL; cur = cur->next)
        printf("%d ", cur->data);
    printf("\\n");
    return 0;
}`,
      expectedOutput: `1 99 2 `,
    },
    keyPoints: [
      "Linked list: nodes connected by pointers, not contiguous memory. Insertion/deletion at a KNOWN node is O(1); access by index is O(n) (no address-arithmetic shortcut).",
      "Insertion is O(1) only after already having a pointer to the position - a search to FIND that position first is a separate O(n) cost.",
      "Pointer surgery order matters: always save the rest of the list (newNode->next = p->next) BEFORE overwriting p->next, or the remainder of the list is lost.",
      "Singly linked: one-directional. Doubly linked: O(1) backward movement, extra pointer memory. Circular: last node points back to the first, no NULL-terminated end.",
    ],
    analogies: [
      "A linked list is a treasure hunt: each clue (node) only tells you where the NEXT clue is - you can't jump straight to clue #7 the way you could flip straight to page 7 of a book (an array); you must follow every clue in order to get there.",
    ],
    commonMistakes: [
      "Overwriting p->next before saving it into newNode->next, permanently losing the rest of the list during insertion.",
      "Freeing a deleted node's memory before re-linking around it, leaving a dangling reference or breaking the chain.",
      "Assuming linked-list insertion is unconditionally O(1), forgetting that finding the insertion point (if not already known) costs O(n) first.",
      "Trying to binary-search a sorted linked list - binary search needs O(1) random access to the middle element, which a linked list cannot provide.",
    ],
    memoryTricks: [
      "\"Save before you overwrite.\" The one rule behind every correct linked-list pointer operation.",
      "Array: fast to READ (index math), slow to INSERT in the middle (shifting). Linked list: the exact opposite trade-off.",
    ],
    formulas: [],
    shortcuts: [
      "Before writing any linked-list insertion/deletion code, write down the exact pointer-assignment ORDER as a numbered list first - catching an out-of-order overwrite on paper is far cheaper than debugging a corrupted list afterward.",
      "For a GATE trace question showing pointer reassignment code, redraw the list's actual pointer diagram after each individual line, not just at the end - order-sensitive bugs are easy to miss if you only check the final state.",
    ],
    pyqRelevance: `Linked lists are tested via pointer-manipulation code tracing (predicting the resulting list after a sequence of pointer reassignments) and complexity classification (access vs insertion at a known vs unknown position) - both are recurring, high-frequency GATE question types.`,
    interviewConnection: `Linked lists are the canonical data structure for teaching pointer manipulation, and reversing a linked list (in-place, O(1) extra space) is one of the most frequently asked coding-interview questions precisely because it tests exactly this "save before overwrite" pointer discipline.`,
    revisionSummary: `Linked list: pointer-connected nodes, not contiguous memory. Insertion/deletion at a KNOWN node: O(1). Access by index: O(n) - no address-arithmetic shortcut.

Pointer surgery: always save the rest of the list before overwriting the link to it, or it's lost.

Singly (one direction), doubly (bidirectional, extra memory), circular (last node links back to first, no NULL end).`,
    shortNotes: {
      oneMinute: "Linked list: pointer-connected, not contiguous. Insert/delete at known node: O(1). Access by index: O(n). Insertion at an unknown position: O(n) total (search + O(1) insert). Pointer rule: save rest-of-list before overwriting the link. Singly/doubly (bidirectional)/circular (wraps, no NULL end).",
    },
    mcqs: [
      {
        question: "What is the time complexity of inserting a new node at the HEAD of a singly linked list, given a pointer to the head?",
        options: ["O(1)", "O(log n)", "O(n)", "O(n^2)"],
        correctIndex: 0,
        explanation: "Inserting at the head only requires setting the new node's next to the current head and updating the head pointer - no traversal needed, O(1).",
      },
      {
        question: "Why can't a sorted linked list be binary-searched in O(log n) time the way a sorted array can?",
        options: [
          "Linked lists cannot be sorted",
          "Binary search requires O(1) random access to the middle element, which a linked list doesn't provide",
          "Linked lists have no concept of order",
          "Binary search only works on arrays by definition, with no underlying reason",
        ],
        correctIndex: 1,
        explanation: "Binary search repeatedly jumps to a middle element in O(1) - an array supports this via address arithmetic, but a linked list would need O(n) traversal just to REACH the middle each time, destroying the log(n) benefit entirely.",
      },
    ],
    numericals: [],
  },

  // ---------------- Trees and Heaps ----------------

  "trees-and-tree-traversals": {
    difficulty: "Moderate",
    estimatedMinutes: 30,
    // Verified via YouTube oEmbed (2026-08-29) - real, publicly viewable.
    resources: [{
      kind: "video",
      title: "5.6 Binary Tree traversal | Preorder, Inorder, Postorder | Data Structures Tutorials",
      url: "https://www.youtube.com/watch?v=e_Wv_pH4Se8",
      description: "Explains preorder, inorder, and postorder binary tree traversal methods.",
    }],
    whatYoullLearn: [
      "Core tree terminology: root, leaf, height, depth, and how they're computed",
      "The three depth-first traversals (inorder, preorder, postorder) and how their output order differs",
      "Level-order (breadth-first) traversal and why it needs a queue, not recursion",
      "Reconstructing a unique tree from two given traversals",
    ],
    prerequisites: ["Recursion", "Linked Lists", "Queues"],
    concept: `## Tree Terminology, Precisely

::: cards
Root :: The single topmost node, with no parent.
Leaf :: A node with NO children.
Height of a node :: The number of edges on the LONGEST path from that node DOWN to a leaf. A leaf itself has height 0.
Depth of a node :: The number of edges from the ROOT down TO that node. The root itself has depth 0.
Height of the tree :: The height of the root - the longest root-to-leaf path in the whole tree.
:::

::: mistake
Confusing height and depth - they're measured in OPPOSITE directions (height looks down from a node to its deepest leaf; depth looks up from a node to the root) and this exact confusion is a frequent GATE trap in tree-property questions.
:::

## The Three Depth-First Traversals

::: story
All three depth-first traversals visit a node's LEFT subtree, then the node itself, then the RIGHT subtree - in some order. The only thing that changes between inorder, preorder, and postorder is WHERE the node itself gets visited relative to its two subtrees.
:::

::: cards Same recursive shape, different visit position
Inorder (Left, Node, Right) :: Visit left subtree, THEN the node, THEN right subtree. For a Binary Search Tree specifically, this produces values in SORTED order - see Binary Search Trees.
Preorder (Node, Left, Right) :: Visit the node FIRST, then left subtree, then right subtree. Useful for copying/serializing a tree, since the root is written before its children.
Postorder (Left, Right, Node) :: Visit both subtrees fully, THEN the node LAST. Useful for deleting a tree safely (children are freed before their parent).
:::

::: remember
All three are the SAME recursive structure as Recursion's before/after-the-call rule: "visit node before recursing" = preorder; "visit node between the two recursive calls" = inorder; "visit node after both recursive calls" = postorder.
:::

## Level-Order Traversal Needs A Queue, Not Recursion

::: story
Level-order traversal visits every node level by level, left to right within each level - exactly the order breadth-first search explores. This can't be done with simple recursion the way the other three can; it requires an explicit QUEUE: enqueue the root, then repeatedly dequeue a node, visit it, and enqueue its children.
:::

::: checkpoint
For the tree with root A, left child B, right child C (a leaf), what is the PREORDER traversal?
- (x) A, B, C
- ( ) B, A, C
- ( ) B, C, A
- ( ) C, B, A
> Preorder visits the node FIRST, then left, then right: A (the node) first, then B (left subtree), then C (right subtree) - A, B, C.
:::`,
    codeExample: {
      language: "c",
      code: `#include <stdio.h>
#include <stdlib.h>

struct Node { int data; struct Node *left, *right; };

void inorder(struct Node *n) {
    if (n == NULL) return;
    inorder(n->left);
    printf("%d ", n->data);   /* visit BETWEEN the two recursive calls */
    inorder(n->right);
}
void preorder(struct Node *n) {
    if (n == NULL) return;
    printf("%d ", n->data);   /* visit BEFORE both recursive calls */
    preorder(n->left);
    preorder(n->right);
}
void postorder(struct Node *n) {
    if (n == NULL) return;
    postorder(n->left);
    postorder(n->right);
    printf("%d ", n->data);   /* visit AFTER both recursive calls */
}

int main(void) {
    struct Node c = {30, NULL, NULL};
    struct Node b = {20, NULL, NULL};
    struct Node a = {10, &b, &c};   /* root 10, left 20, right 30 */

    inorder(&a);   printf("\\n");   /* 20 10 30 */
    preorder(&a);  printf("\\n");   /* 10 20 30 */
    postorder(&a); printf("\\n");   /* 20 30 10 */
    return 0;
}`,
      expectedOutput: `20 10 30
10 20 30
20 30 10 `,
    },
    keyPoints: [
      "Height looks DOWN from a node to its deepest leaf; depth looks UP from a node to the root - opposite directions, a frequent confusion point.",
      "Inorder (left, node, right), preorder (node, left, right), postorder (left, right, node) - all the same recursive shape, differing only in when the node itself is visited.",
      "Inorder traversal of a BST specifically produces sorted order - the direct bridge to Binary Search Trees.",
      "Level-order (breadth-first) traversal requires an explicit queue, not plain recursion - visit level by level, left to right.",
      "A tree can be UNIQUELY reconstructed from its inorder traversal plus either its preorder or postorder traversal (given no duplicate values).",
    ],
    analogies: [
      "The three depth-first traversals are like three ways to write a company's org chart: preorder announces the manager before their team (node first), postorder announces the team before naming the manager (node last), inorder is specific to binary trees, splitting the announcement between the two sides.",
    ],
    commonMistakes: [
      "Swapping height and depth's directions, or their base cases (a leaf has height 0, the root has depth 0).",
      "Trying to do level-order traversal recursively without a queue - recursion naturally follows depth-first order, not breadth-first.",
      "Mixing up which traversal pair (inorder+preorder or inorder+postorder) is needed to reconstruct a tree, and forgetting that preorder+postorder ALONE (without inorder) does NOT uniquely determine a general binary tree.",
    ],
    memoryTricks: [
      "\"IN the middle, PRE before, POST after\" - the traversal name literally tells you when the node is visited relative to its two subtrees.",
      "Level-order = BFS = needs a queue. Depth-first (in/pre/post-order) = needs recursion (or an explicit stack).",
    ],
    formulas: [
      "Height of the tree = height of the root = length (in edges) of the longest root-to-leaf path.",
    ],
    shortcuts: [
      "To quickly write any depth-first traversal's output by hand, just recurse left, note the node's position (before/between/after), recurse right - the shape never changes, only where you write the node down.",
      "If a question describes visiting 'level by level', immediately think queue, not recursion - this single word is the tell for level-order traversal.",
    ],
    pyqRelevance: `Tree traversal is one of the highest-frequency GATE topics in this subject - both direct traversal-output questions and the classic 'given inorder + preorder, reconstruct the tree (or find a specific traversal of it)' numerical, which appears almost every year.`,
    interviewConnection: `All three depth-first traversals and level-order (BFS) traversal are foundational, near-universally asked interview questions - and understanding WHY inorder gives sorted order for a BST directly explains a huge number of BST-based interview problems.`,
    revisionSummary: `Height: node down to deepest leaf. Depth: root down to that node. Tree height = root's height.

Inorder (L,Node,R), preorder (Node,L,R), postorder (L,R,Node) - same recursive shape, different node-visit position. Inorder of a BST is sorted.

Level-order needs a queue (BFS), not recursion. Inorder+preorder (or +postorder) uniquely reconstructs a tree.`,
    shortNotes: {
      oneMinute: "Height: down to deepest leaf. Depth: up to root. Inorder(L,N,R)/Preorder(N,L,R)/Postorder(L,R,N) - node position differs. Inorder of BST = sorted. Level-order needs a queue (BFS), not recursion. Inorder+pre(or post)order uniquely reconstructs a tree.",
    },
    mcqs: [
      {
        question: "Which traversal is required alongside preorder to uniquely reconstruct a general binary tree (no duplicate values)?",
        options: ["Postorder", "Inorder", "Level-order", "No second traversal is needed"],
        correctIndex: 1,
        explanation: "Inorder traversal, combined with either preorder or postorder, uniquely determines a general binary tree - preorder and postorder together, WITHOUT inorder, do not uniquely determine it in general.",
      },
    ],
    numericals: [
      {
        question: "A tree has a single root with two children (both leaves). What is the height of the tree, in edges?",
        answerMin: 1,
        answerMax: 1,
        unit: "",
        solution: `The longest root-to-leaf path passes through exactly one edge (root to either child leaf), so the tree's height is 1.`,
      },
    ],
  },

  "binary-search-trees": {
    difficulty: "Moderate",
    estimatedMinutes: 30,
    // Verified via YouTube oEmbed (2026-08-29) - real, publicly viewable.
    resources: [{
      kind: "video",
      title: "Lec-53: Binary Search Tree in Data Structure | Insertion and Traversal in BST",
      url: "https://www.youtube.com/watch?v=sXABdGalFNg",
      description: "Explains binary search trees, covering insertion and traversal operations.",
    }],
    whatYoullLearn: [
      "The BST property and why it makes inorder traversal produce sorted output",
      "Search, insert, and delete, and why their complexity is O(height), not O(log n) in general",
      "The three deletion cases, and specifically why deleting a two-child node needs special handling",
      "Why a BST can degrade to O(n) operations, and what that has to do with insertion order",
    ],
    prerequisites: ["Trees and Tree Traversals"],
    concept: `## The Ordering Property That Defines A BST

::: remember
Binary Search Tree property: for EVERY node, every value in its LEFT subtree is smaller, and every value in its RIGHT subtree is larger (assuming no duplicates). This must hold for every single node, not just the root - a common trap is checking only the root's immediate children instead of the property recursively.
:::

::: story
Because of this property, inorder traversal (left, node, right) visits every node in strictly increasing order automatically - it's a direct, guaranteed consequence of the BST property, not a coincidence, connecting straight back to Trees and Tree Traversals.
:::

## Search, Insert: Both O(height)

::: flow
Search for value v :: Start at root. If v equals the current node, found. If v is smaller, go left; if larger, go right. Repeat until found, or a NULL is reached (not present).
Insert value v :: Search for v exactly as above until hitting a NULL - insert the new node exactly at that NULL position. The new node is always inserted as a NEW LEAF.
Complexity :: O(h), where h is the tree's height - NOT O(log n) in general. O(log n) only holds when the tree happens to be balanced (h = O(log n)); a skewed tree has h = O(n), making search/insert O(n) too.
:::

::: mistake
Stating BST operations are "O(log n)" unconditionally. They are O(HEIGHT), and height is only O(log n) for a BALANCED tree. A BST built by inserting already-sorted data degenerates into essentially a linked list (height = n-1), making every operation O(n).
:::

## Deletion: Three Cases

::: cards
Case 1 - deleting a LEAF :: Simply remove it; no other node needs adjustment.
Case 2 - deleting a node with ONE child :: Replace the deleted node with its single child directly - the BST property is preserved automatically.
Case 3 - deleting a node with TWO children :: Replace its value with either its INORDER SUCCESSOR (the smallest value in its right subtree) or INORDER PREDECESSOR (the largest value in its left subtree), then delete THAT successor/predecessor node instead (which is guaranteed to have at most one child, reducing back to case 1 or 2).
:::

::: mistake
For a two-child deletion, forgetting that after copying the inorder successor's value up, the ORIGINAL successor node still needs to be deleted from its own position (it now exists twice) - simply overwriting the value is only half the operation.
:::

::: checkpoint
In a BST, what is guaranteed to be true about a node's inorder SUCCESSOR (used when deleting a two-child node)?
- ( ) It always has two children
- (x) It has at most one child (specifically, no left child)
- ( ) It is always a leaf
- ( ) It is always the root's direct child
> The inorder successor is the SMALLEST value in the right subtree, found by going right once then left as far as possible - by definition it can have no LEFT child (or it wouldn't be smallest), so it has at most one (right) child, reducing its own deletion to the easy case 1 or 2.
:::`,
    codeExample: {
      language: "c",
      code: `#include <stdio.h>
#include <stdlib.h>

struct Node { int data; struct Node *left, *right; };

struct Node* insert(struct Node *root, int val) {
    if (root == NULL) {
        struct Node *n = malloc(sizeof(struct Node));
        n->data = val; n->left = n->right = NULL;
        return n;
    }
    if (val < root->data) root->left = insert(root->left, val);
    else if (val > root->data) root->right = insert(root->right, val);
    return root;   /* val == root->data: no duplicate inserted */
}

void inorder(struct Node *n) {
    if (n == NULL) return;
    inorder(n->left);
    printf("%d ", n->data);
    inorder(n->right);
}

int main(void) {
    struct Node *root = NULL;
    int vals[] = {50, 30, 70, 20, 40};
    for (int i = 0; i < 5; i++) root = insert(root, vals[i]);

    inorder(root);   /* sorted, guaranteed by the BST property */
    printf("\\n");
    return 0;
}`,
      expectedOutput: `20 30 40 50 70 `,
    },
    keyPoints: [
      "BST property: every node's left subtree is entirely smaller, right subtree entirely larger - holds recursively at EVERY node, not just the root.",
      "Inorder traversal of a BST always produces sorted order, a direct consequence of the BST property.",
      "Search and insert are O(height), NOT unconditionally O(log n) - height is O(log n) only for a balanced tree; a skewed tree (e.g. from sorted-order insertion) has height O(n).",
      "Deletion: leaf (remove directly), one child (replace with that child), two children (replace value with inorder successor/predecessor, then delete THAT node too).",
      "The inorder successor of a two-child node always has at most one (right) child, so deleting it is guaranteed to be an easy case.",
    ],
    analogies: [
      "A BST is a decision tree for 'guess the number, but smarter': at every node you're told 'go left if smaller, right if larger', and following that consistently rule at every step is exactly what keeps the whole structure searchable.",
    ],
    commonMistakes: [
      "Checking the BST property only against the immediate parent instead of the FULL subtree - a node can be locally correct relative to its parent while still violating the property against a grandparent or further ancestor.",
      "Stating BST search/insert complexity as O(log n) unconditionally, ignoring that a skewed (unbalanced) tree makes it O(n).",
      "During two-child deletion, copying the successor's value up but forgetting to actually remove the original successor node from its old position.",
    ],
    memoryTricks: [
      "\"Left is less, right is more - at every node, not just the top.\" The BST property, one line.",
      "Two-child deletion: \"borrow a value from the edge, then clean up after it\" - successor/predecessor replace, then delete the now-duplicate node.",
    ],
    formulas: [
      "BST search/insert/delete: O(h), h = tree height. Balanced: h = O(log n). Skewed (worst case): h = O(n).",
    ],
    shortcuts: [
      "To quickly find a two-child node's inorder successor by hand: go right ONCE, then left as far as possible - that single rule locates it without needing a full traversal.",
      "If a GATE question inserts already-sorted (or reverse-sorted) values into an empty BST one at a time, immediately expect a skewed, linked-list-shaped tree with O(n) height, not a balanced one.",
    ],
    pyqRelevance: `BSTs are extremely high-frequency on GATE - construction-by-insertion-order tracing, height/complexity classification (balanced vs skewed), and the deletion-cases logic (especially the two-child case) are all recurring question types, often combined with traversal output prediction.`,
    interviewConnection: `BST search/insert/delete, along with correctly handling the two-child deletion case, is one of the most classic data-structure coding interview questions - and recognising when a BST degrades to O(n) directly motivates self-balancing trees (AVL, red-black), a common interview follow-up.`,
    revisionSummary: `BST: left subtree smaller, right subtree larger, recursively at every node. Inorder traversal is always sorted.

Search/insert/delete: O(height), not unconditionally O(log n) - balanced gives O(log n), skewed gives O(n).

Deletion: leaf (remove), one child (replace with it), two children (replace with inorder successor/predecessor, then delete that node too - guaranteed at most one child).`,
    shortNotes: {
      oneMinute: "BST: left<node<right, recursively everywhere. Inorder = sorted. Search/insert/delete: O(height) - O(log n) only if balanced, O(n) if skewed (e.g. sorted-order insertion). Delete: leaf-remove; one-child-replace; two-child-replace with inorder successor/predecessor then delete that node (guaranteed <=1 child).",
    },
    mcqs: [
      {
        question: "Values 10, 20, 30, 40, 50 are inserted into an empty BST in that exact order. What is the resulting tree's height (in edges)?",
        options: ["2", "4", "log2(5) rounded", "0"],
        correctIndex: 1,
        explanation: "Inserting already-sorted values into a BST produces a completely right-skewed tree (each new value is larger than everything before it, always going right) - a chain of 5 nodes, height 4 (5 nodes, 4 edges from root to the deepest leaf).",
      },
      {
        question: "When deleting a BST node with two children, what is done?",
        options: [
          "The node is simply removed, reconnecting its children directly to its parent",
          "Its value is replaced with its inorder successor (or predecessor), then that successor/predecessor node is deleted",
          "Both children are deleted along with the node",
          "The entire subtree is deleted",
        ],
        correctIndex: 1,
        explanation: "The standard two-child deletion replaces the node's value with its inorder successor (or predecessor) and then removes that successor/predecessor from its original position - which is guaranteed to be an easy (leaf or one-child) deletion.",
      },
    ],
    numericals: [],
  },

  "binary-heaps": {
    difficulty: "Moderate",
    estimatedMinutes: 30,
    // Verified via YouTube oEmbed (2026-08-29) - real, publicly viewable.
    resources: [{
      kind: "video",
      title: "6.15 हीप की मूल बातें | न्यूनतम हीप | अधिकतम हीप",
      url: "https://www.youtube.com/watch?v=wj9IODIsNoI",
      description: "Explains the basics of the heap data structure, including min-heap and max-heap properties.",
    }],
    whatYoullLearn: [
      "The heap property (min-heap and max-heap) and how it differs from the BST property",
      "The array representation of a complete binary tree, and the parent/child index formulas",
      "Insert (bubble up) and extract-min/max (bubble down), and why both are O(log n)",
      "Build-heap in O(n), and why that's faster than n individual O(log n) insertions",
    ],
    prerequisites: ["Trees and Tree Traversals", "Arrays"],
    concept: `## Heap Property: Weaker Than BST, But Still Useful

::: story
A binary heap is a COMPLETE binary tree (every level full except possibly the last, which fills left to right with no gaps) satisfying the heap property: in a MIN-heap, every parent is <= both its children; in a MAX-heap, every parent is >= both its children.
:::

::: mistake
Assuming a heap is sorted, or confusing it with a BST. A heap only constrains parent-vs-child - it says NOTHING about the relationship between two SIBLINGS, or between a node and nodes elsewhere in the tree. A min-heap's root is guaranteed smallest, but the second-smallest element is NOT necessarily the root's direct child.
:::

## Array Representation: No Pointers Needed

::: remember
Because a heap is always a COMPLETE tree (no gaps), it can be stored directly in an array with no explicit child/parent pointers at all - the tree's shape is implicit in the array positions themselves. For a 0-indexed array: parent(i) = (i-1)/2 (integer division), leftChild(i) = 2i+1, rightChild(i) = 2i+2.
:::

::: cards
Why this works :: Completeness guarantees every array slot up to the last used index is filled with no gaps - there's no missing node to account for, so the formula-based indices always point at real tree positions.
Space saved :: No pointer memory at all (unlike a general binary tree using struct Node* left, *right) - just the data values themselves in a plain array.
:::

## Insert (Bubble Up) And Extract (Bubble Down)

::: flow
Insert x :: 1) Place x at the very next free array slot (end of the array) - this keeps the tree complete. 2) BUBBLE UP: compare x with its parent; if x violates the heap property (smaller than parent in a min-heap), SWAP them, and repeat with the new parent, until the property holds or x reaches the root.
Extract min (min-heap) :: 1) The root is always the answer (it's the minimum by the heap property) - save it. 2) Move the LAST element into the root position, shrink the array by one. 3) BUBBLE DOWN: repeatedly swap the new root with its SMALLER child until the heap property holds again.
Both are O(log n) :: Because the tree is complete, its height is always O(log n) - and both bubble-up and bubble-down do at most one swap per level, so at most O(log n) swaps total.
:::

::: mistake
During bubble-down, comparing against only ONE child instead of BOTH, and picking the wrong one to swap with. The correct move is always swapping with the SMALLER of the two children (min-heap) - swapping with the wrong (larger) child can leave the heap property violated.
:::

## Build-Heap In O(n), Not O(n log n)

::: remember
Building a heap from n raw elements by inserting them ONE AT A TIME costs O(n log n) (n insertions, each O(log n)). But the standard BUILD-HEAP algorithm - starting from the LAST non-leaf node and bubbling each one down, working backward to the root - achieves this in O(n) total, because most nodes are near the bottom of the tree and only need a tiny bubble-down distance; the cost doesn't simply multiply out to n * log(n).
:::

::: checkpoint
In a 0-indexed array representing a heap, what is the index of the parent of the node at index 7?
- (x) 3
- ( ) 4
- ( ) 2
- ( ) 15
> parent(i) = (i-1)/2 (integer division) = (7-1)/2 = 6/2 = 3.
:::`,
    codeExample: {
      language: "c",
      code: `#include <stdio.h>

int heap[100], size = 0;

void swap(int *a, int *b) { int t = *a; *a = *b; *b = t; }

void bubbleUp(int i) {
    while (i > 0 && heap[(i - 1) / 2] > heap[i]) {   /* min-heap */
        swap(&heap[(i - 1) / 2], &heap[i]);
        i = (i - 1) / 2;
    }
}
void insert(int x) {
    heap[size] = x;
    bubbleUp(size);
    size++;
}

int main(void) {
    int vals[] = {5, 3, 8, 1, 4};
    for (int i = 0; i < 5; i++) insert(vals[i]);

    printf("%d\\n", heap[0]);   /* root is always the minimum: 1 */
    return 0;
}`,
      expectedOutput: `1`,
    },
    keyPoints: [
      "Heap property: min-heap has every parent <= both children; max-heap has every parent >= both children - says nothing about sibling order or non-parent-child relationships.",
      "Complete tree + array representation: parent(i)=(i-1)/2, leftChild(i)=2i+1, rightChild(i)=2i+2 (0-indexed) - no pointers needed.",
      "Insert: place at the end, bubble up (swap with parent while violating the property). Extract-min: replace root with the last element, bubble down (swap with the smaller child). Both O(log n) since tree height is O(log n).",
      "Build-heap from n raw elements: O(n) via bottom-up bubble-down from the last non-leaf node, NOT O(n log n) as naive one-at-a-time insertion would give.",
    ],
    analogies: [
      "A heap is like a company org chart where every manager earns less than both direct reports (min-heap) - the CEO (root) is guaranteed the overall lowest earner, but nothing at all is implied about how two coworkers on the same team compare to each other.",
    ],
    commonMistakes: [
      "Confusing heap property with BST property - a heap makes no left-vs-right or sibling-order guarantee, only parent-vs-child.",
      "During bubble-down, swapping with the wrong (larger, in a min-heap) child instead of the smaller one.",
      "Assuming build-heap is O(n log n) like n separate insertions - the actual bottom-up algorithm achieves O(n).",
      "Using 1-indexed parent/child formulas (parent(i)=i/2, children 2i/2i+1) against a 0-indexed array, or vice versa - the two indexing schemes use different formulas and mixing them silently produces wrong indices.",
    ],
    memoryTricks: [
      "\"Heap: parent beats child (min or max), nothing about siblings.\" The one-line distinction from BST's full left/right ordering.",
      "0-indexed heap formulas: parent halves (minus one first), children double (plus one, plus two).",
    ],
    formulas: [
      "0-indexed array: parent(i) = (i-1)/2.   leftChild(i) = 2i+1.   rightChild(i) = 2i+2.",
      "Insert/extract-min/max: O(log n) (bounded by tree height). Build-heap from n elements: O(n).",
    ],
    shortcuts: [
      "For a parent/child index question, always confirm whether the array is 0-indexed or 1-indexed FIRST - the formulas genuinely differ, and this is the single most common source of an otherwise-correct-method wrong answer.",
      "If a question asks for the complexity of building a heap from n raw elements (not one at a time), default to O(n) - the O(n log n) answer is the naive-insertion trap, not the standard build-heap algorithm's actual complexity.",
    ],
    pyqRelevance: `Binary heaps are tested via parent/child index numericals, heap-property verification (given an array, is it a valid heap?), and complexity questions distinguishing O(n) build-heap from O(log n) individual insert/extract - all recurring, high-value GATE question types.`,
    interviewConnection: `Heaps directly implement priority queues (see Queues) and are the core of Heap Sort and Dijkstra's/Prim's algorithms' efficient implementations (see Algorithms) - understanding array-based heap indexing is assumed background for any of these follow-on topics.`,
    revisionSummary: `Heap property: min-heap parent<=children, max-heap parent>=children - no sibling-order guarantee, unlike a BST.

Array representation (0-indexed): parent(i)=(i-1)/2, children 2i+1 and 2i+2. Insert (bubble up) and extract (bubble down): O(log n) each.

Build-heap from n elements: O(n) via bottom-up bubble-down, not O(n log n).`,
    shortNotes: {
      oneMinute: "Heap: min-heap parent<=children, max-heap parent>=children (no sibling guarantee, unlike BST). 0-indexed array: parent(i)=(i-1)/2, children 2i+1,2i+2. Insert=bubble up O(log n). Extract=replace root with last, bubble down, O(log n). Build-heap from n elements: O(n), not O(n log n).",
    },
    mcqs: [
      {
        question: "In a 0-indexed array-based min-heap, what is the index of the left child of the node at index 4?",
        options: ["8", "9", "5", "2"],
        correctIndex: 1,
        explanation: "leftChild(i) = 2i+1 = 2(4)+1 = 9.",
      },
      {
        question: "What is the time complexity of building a heap from n raw (unordered) elements using the standard bottom-up build-heap algorithm?",
        options: ["O(n)", "O(n log n)", "O(log n)", "O(n^2)"],
        correctIndex: 0,
        explanation: "The standard bottom-up build-heap algorithm achieves O(n) total, faster than the O(n log n) that n separate one-at-a-time insertions would cost.",
      },
    ],
    numericals: [
      {
        question: "In a 0-indexed array-based heap, what is the index of the parent of the node at index 11?",
        answerMin: 5,
        answerMax: 5,
        unit: "",
        solution: `parent(i) = (i-1)/2 (integer division) = (11-1)/2 = 10/2 = 5`,
      },
    ],
  },

  // ---------------- Graphs ----------------

  "graph-representations": {
    difficulty: "Moderate",
    estimatedMinutes: 25,
    // Verified via YouTube oEmbed (2026-08-29) - real, publicly viewable.
    resources: [{
      kind: "video",
      title: "6.1 Graph Representation in Data Structure (Graph Theory) | Adjacency Matrix and Adjacency List",
      url: "https://www.youtube.com/watch?v=5hPfm_uqXmw",
      description: "Covers representing graphs in memory using adjacency matrix and adjacency list.",
    }],
    whatYoullLearn: [
      "Adjacency matrix vs adjacency list, and the space/time trade-off between them",
      "When a graph is 'sparse' vs 'dense', and why that decides which representation is better",
      "How each representation handles a directed vs undirected, and weighted vs unweighted, graph",
      "The exact complexity of 'is there an edge between u and v' and 'list all neighbours of v' under each representation",
    ],
    prerequisites: ["Arrays", "Linked Lists"],
    concept: `## Two Ways To Store The Same Graph

::: story
A graph is just vertices (nodes) and edges (connections) - but HOW that connection information is stored in memory changes the cost of nearly every operation done on the graph. The two standard representations, adjacency matrix and adjacency list, make opposite trade-offs between space and specific operation speeds.
:::

::: cards
Adjacency matrix :: A V x V 2D array. matrix[u][v] = 1 (or the edge weight) if an edge exists from u to v, else 0. Space: O(V^2), REGARDLESS of how many edges actually exist.
Adjacency list :: An array of V lists (or linked lists), where list[u] contains every vertex v that u has an edge to. Space: O(V + E) - proportional to how many edges actually exist, not V^2.
:::

::: remember
The space trade-off is the whole story: a SPARSE graph (E much smaller than V^2, few edges relative to vertex count) wastes enormous space with an adjacency matrix - mostly storing zeros - so an adjacency list is far more space-efficient there. A DENSE graph (E close to V^2, most possible edges exist) has the two representations use comparable space, and the matrix's simplicity/speed advantages start to dominate.
:::

## Operation Complexity: The Direct Trade-off

::: cards
"Is there an edge (u,v)?" - matrix :: O(1) - direct array lookup, matrix[u][v].
"Is there an edge (u,v)?" - list :: O(degree of u) - must scan u's adjacency list looking for v; no direct-index shortcut.
"List all neighbours of v" - matrix :: O(V) - must scan an ENTIRE row, even though most entries might be 0 for a sparse graph.
"List all neighbours of v" - list :: O(degree of v) - only touches v's actual neighbours, nothing wasted.
:::

::: mistake
Defaulting to adjacency matrix "because it's simpler" without checking whether the graph is sparse. For a sparse graph with many vertices, an adjacency matrix can waste an enormous amount of memory storing mostly zeros, and adjacency LIST is both more space-efficient AND faster for the "list all neighbours" operation that most graph algorithms (BFS, DFS) actually perform repeatedly.
:::

## Directed, Undirected, Weighted

::: flow
Undirected graph, matrix :: Symmetric: matrix[u][v] always equals matrix[v][u].
Directed graph, matrix :: NOT necessarily symmetric - an edge u to v does not imply an edge v to u.
Weighted graph, matrix :: Store the actual weight instead of just 1, using a sentinel (like infinity or -1) for "no edge" instead of 0 (which could be confused with an actual zero-weight edge).
Weighted graph, list :: Each list entry stores a (neighbour, weight) pair instead of just the neighbour.
:::

::: checkpoint
For a graph with V=1000 vertices and only E=2000 edges (very sparse), which representation uses less memory?
- ( ) Adjacency matrix - always simpler
- (x) Adjacency list - space is O(V+E), not O(V^2)
- ( ) Both use exactly the same memory
- ( ) Cannot be determined without knowing if it's directed
> Adjacency matrix space is O(V^2) = O(1,000,000) regardless of actual edge count. Adjacency list space is O(V+E) = O(3,000) here - dramatically smaller for this sparse graph.
:::`,
    codeExample: {
      language: "c",
      code: `#include <stdio.h>
#define V 4

int main(void) {
    /* Adjacency matrix for an undirected graph: 0-1, 0-2, 1-2, 2-3 */
    int matrix[V][V] = {
        {0, 1, 1, 0},
        {1, 0, 1, 0},
        {1, 1, 0, 1},
        {0, 0, 1, 0},
    };

    printf("Edge (0,2)? %d\\n", matrix[0][2]);   /* O(1) lookup: 1 (yes) */
    printf("Edge (0,3)? %d\\n", matrix[0][3]);   /* O(1) lookup: 0 (no) */

    /* Degree of vertex 2 - must scan its whole row (O(V)) */
    int degree = 0;
    for (int j = 0; j < V; j++) degree += matrix[2][j];
    printf("Degree of vertex 2: %d\\n", degree);   /* 3 */

    return 0;
}`,
      expectedOutput: `Edge (0,2)? 1
Edge (0,3)? 0
Degree of vertex 2: 3`,
    },
    keyPoints: [
      "Adjacency matrix: O(V^2) space always, O(1) edge check, O(V) to list one vertex's neighbours.",
      "Adjacency list: O(V+E) space (proportional to actual edges), O(degree) edge check, O(degree) to list neighbours.",
      "Sparse graphs (E << V^2) favour adjacency list for space; dense graphs (E close to V^2) make the two representations comparable in space, with matrix's O(1) edge check becoming more attractive.",
      "Directed graphs give a non-symmetric adjacency matrix; undirected graphs give a symmetric one. Weighted graphs store weights instead of 1s (matrix) or as (neighbour, weight) pairs (list).",
    ],
    analogies: [
      "An adjacency matrix is a full seating chart marking every possible pair of people as 'know each other' or not, even pairs who will never actually interact - an adjacency list is instead each person's own personal contact list, only recording the connections that actually exist.",
    ],
    commonMistakes: [
      "Choosing adjacency matrix by default without checking sparsity - wasting massive memory on a sparse graph's mostly-zero entries.",
      "Using 0 as the 'no edge' sentinel in a WEIGHTED matrix where 0 could also be a legitimate real edge weight, creating ambiguity - a separate sentinel (like -1 or infinity) is needed instead.",
      "Assuming an adjacency matrix is symmetric for a DIRECTED graph - only undirected graphs guarantee that symmetry.",
    ],
    memoryTricks: [
      "\"Matrix: O(1) to CHECK an edge, but O(V) to LIST neighbours. List: the exact opposite balance.\" Which one wins depends entirely on which operation the algorithm actually needs more of.",
      "Sparse graph -> adjacency list (save space). Dense graph -> adjacency matrix becomes reasonable (comparable space, faster edge checks).",
    ],
    formulas: [
      "Adjacency matrix space: O(V^2).   Adjacency list space: O(V + E).",
      "Edge check: O(1) matrix, O(degree) list.   List all neighbours: O(V) matrix, O(degree) list.",
    ],
    shortcuts: [
      "Before choosing a representation for a GATE algorithm-design question, quickly compare E to V^2 - if E is much smaller (sparse), default to adjacency list reasoning for both space and typical BFS/DFS complexity questions.",
      "For a weighted-graph question, immediately check whether the matrix uses 0 or a distinct sentinel for 'no edge' - this changes how a 0-weight edge would be interpreted.",
    ],
    pyqRelevance: `Graph representation trade-offs (space complexity, edge-check/neighbour-list complexity) are a recurring conceptual GATE question, and the choice of representation directly affects the stated complexity of BFS/DFS/Dijkstra's questions elsewhere in the Algorithms section - this topic is foundational rather than standalone.`,
    interviewConnection: `Choosing adjacency list vs matrix is one of the first real design decisions in any graph-algorithm interview question - real-world graphs (social networks, road networks, web links) are almost always extremely sparse, which is exactly why adjacency lists (or hash-map-based variants) dominate in practice over adjacency matrices.`,
    revisionSummary: `Adjacency matrix: O(V^2) space always, O(1) edge check, O(V) neighbour listing.

Adjacency list: O(V+E) space, O(degree) edge check, O(degree) neighbour listing.

Sparse graphs favour lists (space); dense graphs make matrices comparable. Directed matrices aren't symmetric; undirected ones are. Weighted graphs need a distinct 'no edge' sentinel, not 0.`,
    shortNotes: {
      oneMinute: "Matrix: O(V^2) space, O(1) edge check, O(V) neighbour list. List: O(V+E) space, O(degree) edge check, O(degree) neighbour list. Sparse->list (space), dense->matrix reasonable. Directed matrix: not symmetric. Weighted: distinct 'no edge' sentinel, not 0.",
    },
    mcqs: [
      {
        question: "For a very dense graph where E is close to V^2, which statement is most accurate?",
        options: [
          "Adjacency list always uses far less space than the matrix",
          "The two representations use comparable space, and the matrix's O(1) edge check becomes attractive",
          "Adjacency matrix cannot represent a dense graph",
          "Adjacency list becomes O(1) for edge checks in this case",
        ],
        correctIndex: 1,
        explanation: "When E approaches V^2, adjacency list's O(V+E) space approaches the matrix's O(V^2) anyway, so the space advantage of the list shrinks - and the matrix's O(1) edge-check advantage (versus the list's O(degree)) becomes the more relevant factor.",
      },
    ],
    numericals: [
      {
        question: "A graph has V=100 vertices. What is the exact number of entries in its adjacency matrix?",
        answerMin: 10000,
        answerMax: 10000,
        unit: "",
        solution: `Adjacency matrix size = V * V = 100 * 100 = 10000 entries, regardless of how many actual edges exist.`,
      },
    ],
  },

};
