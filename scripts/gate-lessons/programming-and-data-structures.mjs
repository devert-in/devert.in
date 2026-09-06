// GATE Programming and Data Structures - authored lesson content.
// Follows the authoring rules documented at the top of general-aptitude.mjs.
//
// NOTE ON LANGUAGE: the CS paper specifies programming in **C**, not C++ and not
// Python. The DA paper specifies Python. Both papers contain a subject with a
// similar name, but they are DIFFERENT subject ids, so a C lesson written here
// never leaks into the DA tree.

export const PROGRAMMING_AND_DATA_STRUCTURES = {

  "c-basics-data-types-and-operators": {
    difficulty: "Easy",
    estimatedMinutes: 30,
    // Verified via YouTube oEmbed (2026-08-29) - real, publicly viewable.
    resources: [{
      kind: "video",
      title: "Introduction to Operators in C",
      url: "https://www.youtube.com/watch?v=50Pb27JoUrw",
      description: "Introduces the different types of operators supported in the C programming language.",
    }],
    whatYoullLearn: [
      "What char, int, float and double actually cost in memory, and why the sizes matter for tracing code",
      "Why integer division throws away the remainder, and how one double operand changes the whole answer",
      "The difference between = and ==, and why the compiler happily accepts the wrong one",
      "How C silently converts between types in a mixed expression, and where that conversion bites",
    ],
    prerequisites: [],
    concept: `## A variable is a labelled box of a fixed size

::: story
Think of every variable as a labelled jar on a shelf. A \`char\` jar is tiny - it holds one byte. An \`int\` jar is bigger - four bytes on almost every machine you will use. A \`double\` jar is the biggest of the basic ones - eight bytes. The jar's size never changes once you pick the type, and that size is exactly why the arithmetic behaves the way it does.
:::

::: cards The four basic types (typical sizes, 64-bit build)
char :: 1 byte - one character, or a small whole number, usually -128 to 127
int :: 4 bytes - the default whole number type
float :: 4 bytes - a decimal number, accurate to about 6-7 digits
double :: 8 bytes - a decimal number, accurate to about 15-16 digits, twice float's precision
:::

::: remember
"Typical" is doing real work in that table. The C standard only guarantees minimum sizes and an ordering (char <= short <= int <= long) - it does not promise int is exactly 4 bytes everywhere. GATE questions assume the common 32-bit int / 64-bit pointer setup unless told otherwise.
:::

## Integer division throws away the leftovers

::: story
Share 7 candies between 2 friends, whole candies only: each gets 3, and 1 is left over. \`7 / 2\` in C behaves exactly like that when both sides are int - the answer is 3, not 3.5. The leftover candy is what \`%\` gives you: \`7 % 2\` is 1.
:::

::: mistake
\`7 / 2\` gives 3 in C, never 3.5, because both operands are int and integer division truncates toward zero. To get 3.5 you need at least one operand to be a floating type: \`7 / 2.0\` or \`(double)7 / 2\`.
:::

## = assigns. == asks a question.

::: remember
\`=\` puts a value into a box. \`==\` asks whether two values are equal and answers yes or no. \`if (x = 5)\` is legal C - it assigns 5 to x and then tests the assigned value, which is non-zero, so the branch always runs. Missing one character turns a comparison into an always-true assignment, and the compiler will not stop you unless warnings are turned on.
:::

## Precedence decides the order, not the reading order

::: checkpoint
What does \`int x = 5 + 3 * 2;\` store in x?
- ( ) 16
- (x) 11
- ( ) 13
- ( ) 10
> \`*\` runs before \`+\`, so this is 5 + (3 * 2) = 5 + 6 = 11. Reading strictly left to right and adding first is the trap.
:::

## Mixed types convert before they compute

When an expression mixes an int and a double, C promotes the int to double first and does the arithmetic in double - the result is a double. Mix a char and an int, and the char is promoted to int first. These are the *usual arithmetic conversions*, and they run silently, before a single operation happens.`,
    deepDive: `## Short-circuiting, and a char that goes negative

\`&&\` and \`||\` are short-circuit operators: \`a && b\` never evaluates b if a is already false, and \`a || b\` never evaluates b if a is already true. This matters beyond speed - if b has a side effect (a function call, an increment), that side effect might never happen at all.

Plain \`char\` is signed on most common compilers, holding -128 to 127. Assigning a value outside that range, like \`char c = 130;\`, is implementation-defined - on a typical two's-complement signed 8-bit char it wraps to 130 - 256 = -126. GATE traces this exact kind of assignment to test whether you know char is not always the small positive number you expect.

One more trap in the same family: printing a double with \`%d\`, or an int with \`%f\`, is undefined behaviour - printf trusts the format string to match the actual argument types, and nothing checks that trust at compile time.`,
    codeExample: {
      language: "c",
      code: `#include <stdio.h>

int main(void) {
    int a = 7, b = 2;
    printf("%d\\n", a / b);              /* integer division: 3 */
    printf("%d\\n", a % b);              /* remainder: 1 */
    printf("%.1f\\n", (double)a / b);    /* true division: 3.5 */

    int x = 5 + 3 * 2;                  /* * before +: 11 */
    printf("%d\\n", x);

    char c = 130;                       /* outside signed char range */
    printf("%d\\n", c);                  /* wraps: -126 */

    int y = 0;
    if (y = 5) {                        /* assignment, not comparison */
        printf("assigned\\n");
    }
    return 0;
}`,
      expectedOutput: `3
1
3.5
11
-126
assigned`,
    },
    dryRun: `Trace the program above line by line.

::: timeline Trace
int a = 7, b = 2; :: Two int jars are filled: a = 7, b = 2.
printf a / b :: Both operands are int, so this truncates: 7 / 2 = 3.
printf a % b :: The remainder left over from that division: 7 - 3*2 = 1.
printf (double)a / b :: The cast promotes a to double BEFORE the division, so this is true division: 3.5.
int x = 5 + 3 * 2; :: * runs before +, so x = 5 + 6 = 11.
char c = 130; :: 130 is outside signed char's range (-128..127), so it wraps: 130 - 256 = -126.
if (y = 5) :: This ASSIGNS 5 to y and then tests the result (5, truthy) - the branch runs regardless of what == would have found.
:::

So the program prints 3, 1, 3.5, 11, -126, and "assigned".`,
    keyPoints: [
      "A type's size decides both its range and how far pointer arithmetic on it moves - char 1 byte, int 4, float 4, double 8 (typical, not guaranteed)",
      "Integer division truncates toward zero; introducing one double/float operand switches the whole expression to true division",
      "= assigns and always 'succeeds' as a truthy value; == compares - if (x = 5) is legal C and always runs its branch",
      "Mixed-type expressions convert the 'smaller' operand up before computing, silently, under the usual arithmetic conversions",
      "Plain char is typically signed; a value above 127 wraps into negative territory rather than raising an error",
    ],
    commonMistakes: [
      "Expecting 7 / 2 to give 3.5 in C - it gives 3, because integer division truncates when both operands are int",
      "Writing if (x = 5) instead of if (x == 5) - this assigns 5 and is always true",
      "Assuming char is always unsigned (or always signed) - plain char's signedness is implementation-defined, and it matters once a value exceeds 127",
      "Printing a double with %d or an int with %f - the format specifier must match the argument's real type, or the result is undefined",
      "Misreading precedence, e.g. treating 5 + 3 * 2 as (5 + 3) * 2 by evaluating strictly left to right",
    ],
    analogies: [
      "A variable is a labelled jar of fixed capacity - an int jar and a double jar hold different kinds of things even when the shelf label sounds similar.",
      "Short-circuit evaluation is a bouncer who stops checking IDs the moment the guest list already answers the question.",
    ],
    memoryTricks: [
      "One equals sign assigns, two equals signs ask. == is a question; = is a command.",
      "PEMDAS still governs C: * / % before + -, before comparisons, before && and ||, before =.",
      "If a char holds a number over 127, expect it to have gone negative, not to have raised an error.",
    ],
    formulas: [
      "Integer division (both int): a / b truncates toward zero; a % b = a - (a / b) * b, taking the sign of a in C.",
      "Usual arithmetic conversion: if either operand is double (or float), the other is promoted to that type before the operation runs.",
    ],
    shortcuts: [
      "When tracing a mixed int/float expression, first mark which sub-expressions are pure-int (they truncate) and which include a float/double (they do not), before computing anything.",
      "For a precedence puzzle, mentally insert parentheses around every * / % pair first, then the + - pairs, before evaluating left to right.",
    ],
    pyqRelevance: `This exact topic rarely earns a question of its own, but it is the mechanics under nearly every "predict the output" C program GATE asks elsewhere in this subject. Operator precedence, integer-versus-float division and implicit conversion decide the answer to most C-trace questions, even ones that look like they are testing something else - pointers, arrays, recursion.`,
    interviewConnection: `Every "off-by-something" bug reported in a real code review traces back to one of these basics - an integer division where a float result was needed, or an assignment where a comparison was intended. Modern compilers warn about if (x = 5) today, but only when warnings are enabled, which is itself a fact worth knowing in an interview about production C code.`,
    revisionSummary: `char/int/float/double are 1/4/4/8 bytes typically. Integer division truncates toward zero; one double operand switches the whole expression to true division. = assigns and is always truthy as a condition; == compares - if (x = 5) always runs. Mixed-type expressions silently promote the narrower operand before computing. Plain char is typically signed, so a value above 127 wraps negative rather than erroring.`,
    shortNotes: {
      fiveMinute: "char/int/float/double are typically 1/4/4/8 bytes - sizes are implementation-defined minimums, not guarantees. Integer division (int/int) truncates toward zero: 7/2 is 3, and % gives the remainder. One float or double operand in the expression switches it to true division. = assigns (and the assigned value is the truthy/falsy result used by if); == compares - if (x = 5) compiles, assigns, and always runs. Mixed int/double or char/int expressions silently promote the narrower type before computing (usual arithmetic conversions). Plain char is typically signed, so values above 127 wrap into negative numbers rather than erroring.",
      oneMinute: "Sizes: char 1, int 4, float 4, double 8 (typical). int/int division truncates; add a double to get true division. = assigns, == compares; if (x=5) always runs. Mixed types silently promote the narrower one. char above 127 wraps negative (typically signed).",
      nightBefore: "7/2 is 3, not 3.5. if (x=5) always runs. char above 127 goes negative. * before +. Mixed int+double promotes the int first.",
    },
    mcqs: [
      {
        question: "What is the output of: int a = 9, b = 2; printf(\"%d\", a / b * b);",
        options: ["9", "8", "4", "1"],
        correctIndex: 1,
        explanation: "* and / share precedence and go left to right: a / b first (integer division: 9/2 = 4), then 4 * b = 4 * 2 = 8. The leftover from the division is discarded before the multiplication even starts.",
      },
      {
        question: "signed char c = 200; is assigned on a typical 8-bit two's-complement signed char implementation. What value does c hold?",
        options: ["200", "-56", "56", "Undefined, always a compile error"],
        correctIndex: 1,
        explanation: "signed char's range is -128 to 127. 200 wraps: 200 - 256 = -56. It is implementation-defined behaviour, not a compile error, and GATE questions assume this typical wraparound.",
      },
      {
        question: "Which statement about if (x = 5) in C is correct?",
        options: [
          "It is a compile error because = cannot appear in a condition",
          "It compares x to 5 and is only true if x was already 5",
          "It assigns 5 to x, and the branch always executes because 5 is non-zero",
          "It is undefined behaviour",
        ],
        correctIndex: 2,
        explanation: "= is a valid expression that both assigns and evaluates to the assigned value. 5 is non-zero (truthy), so the if-branch always runs, regardless of x's prior value - this is legal, well-defined C, just very likely not what was intended.",
      },
    ],
    numericals: [
      {
        question: "What is the value of the expression (9 / 2) * 2 in C, where both operands throughout are int?",
        answerMin: 8, answerMax: 8,
        unit: "",
        solution: "9 / 2 truncates to 4 (integer division), and 4 * 2 = 8. The .5 that true division would have kept is discarded before the multiplication runs at all - this is why (9/2)*2 does not equal 9.",
      },
    ],
  },

  "control-flow-and-functions": {
    difficulty: "Easy",
    estimatedMinutes: 30,
    // Verified via YouTube oEmbed (2026-08-29) - real, publicly viewable.
    resources: [{
      kind: "video",
      title: "Introduction to Functions in C",
      url: "https://www.youtube.com/watch?v=3lqgdqoY83o",
      description: "Introduces functions in C, covering why they're needed and how they're defined and called.",
    }],
    whatYoullLearn: [
      "How if/else-if/else chains and switch actually pick a branch, and where each one traps a careless reader",
      "The three-part for loop as sugar over while, and what each part is allowed to skip",
      "Pass-by-value: why a function can never change the caller's variable unless given its address",
      "How the call stack allocates and frees each function call's local variables automatically",
    ],
    prerequisites: ["C Basics: Data Types and Operators"],
    concept: `## A branch is a fork with only one road taken

::: story
if/else is a fork in the road: the condition decides which single path is taken, and the other path is skipped entirely - not visited, not even evaluated.
:::

::: cards Control flow at a glance
if / else if / else :: Tests conditions top to bottom, takes the FIRST one that is true, skips the rest.
switch :: Tests one value against several constant cases; falls through into the next case unless you break.
for :: init ; condition ; update - runs init once, tests condition before every iteration, runs update after every iteration.
while :: Tests the condition before the body - may run zero times.
do-while :: Tests the condition after the body - always runs at least once.
:::

::: mistake
Forgetting \`break\` in a switch does not stop execution - it *falls through* into the next case's code and runs that too. This is legal C and occasionally intentional, but an accidental fall-through is one of the most common bugs in switch-heavy code.
:::

## for and while are the same loop, spelled differently

\`for (init; cond; update) { body }\` is exactly \`init; while (cond) { body; update; }\` - the only thing \`for\` adds is packaging the three parts together where none can be forgotten. Any part may be empty: \`for (;;)\` is a valid infinite loop with all three parts blank.

::: checkpoint
How many times does the body of \`for (int i = 0; i < 5; i++)\` execute?
- ( ) 4
- (x) 5
- ( ) 6
- ( ) Infinite
> i takes 0, 1, 2, 3, 4 - five values - and the loop stops as soon as i becomes 5, which fails the condition before a sixth iteration begins.
:::

## Functions pass copies, not the originals

::: remember
C is strictly pass-by-value. When you call \`f(x)\`, the function receives a **copy** of x's value in its own parameter, inside its own stack frame. Anything the function does to that parameter is invisible to the caller's x once the function returns.
:::

To let a function change the caller's variable, you must pass its **address** - a pointer - and have the function dereference that pointer to modify what it points at. This is exactly why \`scanf("%d", &x)\` needs the \`&\`: without it, scanf would only ever modify a copy that vanishes the instant the call returns.

## Every call gets its own frame

Each function call gets a fresh block of memory on the **call stack** for its parameters and local variables - a *stack frame*. When the function returns, that frame is popped and its variables cease to exist. This is why returning the address of a local variable is dangerous: the address still looks like a valid number, but the memory it names has already been handed back.`,
    deepDive: `## Recursion is just repeated function calls

Nothing about C's function-call mechanism forbids a function from calling itself - every recursive call simply gets its own new stack frame, exactly like calling any other function. The base case is what stops new frames from being created forever; without one, frames pile up until the stack runs out (a stack overflow). Recursion gets a full topic of its own - the point to take here is that it is not a special language feature, just an ordinary function call that happens to name the function it is already inside.

## Static locals remember between calls

A local variable declared \`static\` inside a function is allocated once, for the whole program's lifetime, not once per call - so it keeps its value from one call to the next, while staying invisible outside the function. A plain (automatic) local variable is re-created fresh on every call and holds garbage until initialised. Confusing the two is a frequent output-prediction trap: a function using \`static int count\` genuinely accumulates across repeated calls; one using a plain \`int count\` starts over every time.`,
    codeExample: {
      language: "c",
      code: `#include <stdio.h>

void swapWrong(int a, int b) {    /* receives COPIES */
    int t = a; a = b; b = t;
}

void swapRight(int *a, int *b) {  /* receives ADDRESSES */
    int t = *a; *a = *b; *b = t;
}

int main(void) {
    int x = 5, y = 9;

    swapWrong(x, y);
    printf("%d %d\\n", x, y);      /* unchanged: 5 9 */

    swapRight(&x, &y);
    printf("%d %d\\n", x, y);      /* swapped: 9 5 */

    return 0;
}`,
      expectedOutput: `5 9
9 5`,
    },
    dryRun: `Trace both function calls.

::: timeline Trace
swapWrong(x, y) called :: a and b inside swapWrong are fresh copies of 5 and 9, living in swapWrong's own stack frame.
Inside swapWrong :: t=a=5, a=b=9, b=t=5 - the COPIES are swapped. main's x and y are untouched.
swapWrong returns :: Its stack frame is popped. Nothing it did is visible outside. printf shows 5 9.
swapRight(&x, &y) called :: a and b inside swapRight are addresses - pointers AT x and y themselves.
Inside swapRight :: t = *a = 5, then *a = *b writes 9 into x, then *b = t writes 5 into y - reaching into main's actual variables.
swapRight returns :: The changes persist because they were made through pointers to the originals. printf shows 9 5.
:::

The only difference between the two functions is whether the parameter is a value or an address - and that one difference is the entire reason one swap works and the other silently does nothing.`,
    workedExamples: [
      {
        title: "Fall-through in a switch",
        problem: "What does this print?\n\n  int x = 2;\n  switch (x) {\n    case 1: printf(\"A\");\n    case 2: printf(\"B\");\n    case 3: printf(\"C\"); break;\n    case 4: printf(\"D\");\n  }",
        solution: "x matches case 2, so execution starts at printf(\"B\"). There is no break after case 2, so it falls through into case 3 and prints \"C\" as well, then hits break and stops. case 1 and case 4 are never reached, because execution starts at the matching case, not at the top. Output: BC.",
      },
      {
        title: "Static versus automatic local variables",
        problem: "A function is called three times in a row: void counter(void) { static int s = 0; int a = 0; s++; a++; printf(\"%d %d\\n\", s, a); } What does each of the three calls print?",
        solution: "s is static, so it is initialised to 0 only once, ever, and keeps its value across calls: it becomes 1, then 2, then 3. a is an ordinary local variable, re-created and re-initialised to 0 on every call, then incremented to 1 - always printing 1. Output over the three calls: '1 1', then '2 1', then '3 1'.",
      },
    ],
    keyPoints: [
      "if/else-if/else evaluates top to bottom and takes only the first true branch, skipping the rest entirely",
      "switch without break falls through into the next case - trace from the matching case, not from the top",
      "for(init;cond;update) is exactly while(cond) with init run once before the loop and update run after every iteration",
      "C is pass-by-value everywhere: a function modifies the caller's variable only if given a pointer to it",
      "Each function call has its own stack frame, freed on return; a static local persists across calls, an automatic local does not",
    ],
    commonMistakes: [
      "Forgetting break in a switch case and being surprised execution 'fell through' into the next case",
      "Expecting a function to change the caller's variable when it was passed by value instead of by pointer",
      "Reading for(;;) as a syntax error rather than recognising it as a valid infinite loop with all three parts omitted",
      "Assuming a plain local variable keeps its value between calls - only a static local does",
      "Mixing up while and do-while and getting the first-iteration count wrong, since do-while always runs its body at least once",
    ],
    analogies: [
      "Pass-by-value is handing someone a photocopy: they can scribble all over it, but your original stays untouched. Passing a pointer hands them the actual filing cabinet key.",
      "A switch without break is a hallway with no doors between rooms - once you enter at the matching case, you keep walking through every room after it until something stops you.",
    ],
    memoryTricks: [
      "for = while with its bookkeeping bolted on: init once, check-then-run, update after.",
      "No & on a scanf argument means no way for scanf to reach your variable - it is only ever handed a copy.",
      "static remembers, automatic forgets - every single call.",
    ],
    formulas: [
      "for(init; cond; update){body} is exactly: init; while(cond){body; update;}",
      "while may run zero times; do-while always runs at least once - the only structural difference between them.",
    ],
    shortcuts: [
      "In a fall-through switch question, find the FIRST matching case and read straight down from there, ignoring everything above it, until a break or the end.",
      "Any function question with & or * in the parameter list - check whether the function modifies the caller before assuming it does or does not.",
    ],
    pyqRelevance: `Control flow is rarely tested as a standalone question, but nearly every "predict the output" program GATE asks leans on it - loop bounds, switch fall-through and pass-by-value are the three traps threaded through larger C programs across this subject, more often than they appear as isolated questions.`,
    interviewConnection: `Pass-by-value versus pass-by-reference is asked in nearly every C or C++ interview, because getting it wrong produces a function that silently does nothing to its caller's data - a bug that compiles cleanly and typically needs a debugger to actually see.`,
    revisionSummary: `if/else takes the first true branch and skips the rest. switch falls through without break. for is while with init/update packaged in; while checks before running, do-while checks after (so do-while always runs once). C is pass-by-value always - to modify a caller's variable, pass its address and dereference inside the function. Every call gets its own stack frame, freed on return; a static local keeps its value across calls, an ordinary local does not.`,
    shortNotes: {
      fiveMinute: "if/else-if/else takes the FIRST true branch. switch falls through without break - trace from the matching case downward. for(init;cond;update) is while with the bookkeeping built in; while checks the condition before the body, do-while checks after (so it always runs once). C passes everything by value: a function only ever gets a copy, so modifying the caller's variable requires passing its address (a pointer) and writing through it. Every function call gets a fresh stack frame for its locals, freed automatically on return - which is why returning the address of a local is dangerous. A static local variable is initialised once and keeps its value across calls; an ordinary local is recreated fresh every time.",
      oneMinute: "First true branch wins in if/else. switch without break falls through. for = while with init/update packaged. do-while always runs once, while may run zero times. Pass-by-value always - need a pointer to modify the caller. Each call has its own stack frame; static locals persist across calls, automatic locals do not.",
      nightBefore: "switch needs break or it falls through. Pass-by-value - no pointer, no change to caller. static persists, automatic resets each call. do-while runs once minimum.",
    },
    mcqs: [
      {
        question: "What does the following print?\n\n  int x = 2;\n  switch (x) {\n    case 1: printf(\"A\");\n    case 2: printf(\"B\");\n    case 3: printf(\"C\"); break;\n    default: printf(\"D\");\n  }",
        options: ["B", "BC", "BCD", "ABC"],
        correctIndex: 1,
        explanation: "Execution starts at the matching case (2), prints B, then falls through (no break) into case 3 and prints C, then stops at break. default is never reached because a break exits the switch before it.",
      },
      {
        question: "A function is declared void f(int n) { n = n + 10; }. After calling int x = 5; f(x);, what is x?",
        options: ["15", "5", "10", "Undefined - depends on the compiler"],
        correctIndex: 1,
        explanation: "C passes n by value, so f receives a copy of x. Changing n inside f has no effect on x in the caller. x remains 5.",
      },
      {
        question: "How many times does the loop body run in for (int i = 10; i > 0; i -= 3)?",
        options: ["3", "4", "5", "10"],
        correctIndex: 1,
        explanation: "i takes 10, 7, 4, 1 - all greater than 0, so the body runs 4 times. The next value, -2, fails the condition and stops the loop.",
      },
    ],
    numericals: [
      {
        question: "How many times does the body of for (int i = 1; i <= 20; i += 4) execute?",
        answerMin: 5, answerMax: 5,
        unit: "times",
        solution: "i takes 1, 5, 9, 13, 17 - all satisfy i <= 20. The next value, 21, fails the test, so the loop stops. That is 5 iterations.",
      },
    ],
  },

  "arrays-and-strings-in-c": {
    difficulty: "Moderate",
    estimatedMinutes: 35,
    // Verified via YouTube oEmbed (2026-08-29) - real, publicly viewable.
    resources: [{
      kind: "video",
      title: "C_62 Strings in C - part 1 | C programming tutorials",
      url: "https://www.youtube.com/watch?v=x_3FKTDkGT8",
      description: "Introduces strings in C programming and how character arrays represent them.",
    }],
    whatYoullLearn: [
      "How a C string is really just a char array with a hidden '\\0' terminator, and what happens when that terminator goes missing",
      "The difference between an array's declared size and a string's actual length",
      "Why string literals are read-only, and why modifying one is undefined behaviour",
      "The standard string functions GATE actually asks about, and their off-by-one traps",
    ],
    prerequisites: ["Control Flow and Functions"],
    concept: `## An array is a row of same-sized boxes, back to back

::: story
An array is not a collection of separate variables - it is one contiguous block of memory, sliced into equal-sized pieces. \`int arr[5]\` is 5 boxes of 4 bytes each, sitting side by side, and \`arr[i]\` just walks i boxes past the start.
:::

::: remember
Indexing starts at 0. \`int arr[5]\` has valid indices 0 through 4 - \`arr[5]\` reads or writes one box past the end, into memory that belongs to something else. C never checks this for you; it compiles, runs, and corrupts silently.
:::

## A C string is an array with a rule bolted on

::: story
C has no built-in string type. A "string" is a convention: a char array where one specific byte, \`'\\0'\` (value 0), marks where the text ends. Everything after that byte in the array is not part of the string, no matter what garbage sits there.
:::

::: cards Declaring text
char s[6] = "Hello"; :: Reserves 6 bytes: H,e,l,l,o,\\0. The compiler adds the terminator for you.
char *s = "Hello"; :: s points at a STRING LITERAL - read-only memory. Writing to s[0] is undefined behaviour.
char s[6]; strcpy(s, "Hello"); :: A writable array, filled at runtime. This one you may modify.
:::

::: mistake
\`char s[5] = "Hello";\` looks reasonable but is wrong: "Hello" needs 6 bytes (5 letters + '\\0'), and this array has only 5. The terminator either gets dropped or the initializer overflows, depending on the compiler.
:::

## strlen counts letters. sizeof counts bytes reserved.

::: checkpoint
Given \`char s[20] = "GATE";\`, what does strlen(s) return, and what does sizeof(s) return?
- ( ) 20 and 20
- ( ) 4 and 4
- (x) 4 and 20
- ( ) 20 and 4
> strlen walks the array counting characters UNTIL it hits '\\0' - it sees only "GATE", 4 characters. sizeof reports the array's full declared size regardless of what is stored in it - 20 bytes. They answer completely different questions.
:::

## The standard toolbox, and where each one is dangerous

::: cards Common string functions
strlen(s) :: Length up to (not including) '\\0'.
strcpy(dst, src) :: Copies src into dst, INCLUDING the terminator. Never checks dst's size - a classic overflow source.
strcat(dst, src) :: Appends src onto the end of dst, after dst's existing '\\0'. Same no-bounds-checking risk.
strcmp(a, b) :: Returns 0 if equal, negative if a < b, positive if a > b - lexicographic, not true/false.
:::`,
    deepDive: `## 2D arrays are one block, laid out row by row

\`int a[3][4]\` is not an array of pointers - it is one contiguous block of 12 ints. Row-major order means the whole first row comes before the whole second row: a[i][j] sits at flat index i*4 + j in that block. This is why scanning a 2D array row by row (following memory order) is faster than column by column - row-major traversal reads consecutive memory, and column-major traversal jumps by a full row every step.

## Array names in expressions "decay" to a pointer

Almost everywhere an array name appears in an expression, it decays into a pointer to its first element - which is why passing an array to a function only ever passes an address, never the array's size. Two exceptions: under sizeof and under unary &, the array stays an array. The consequence here: a function receiving char s[] as a parameter is really receiving char *s, and cannot use sizeof(s) to recover the caller's array length.

## Comparing strings by == compares addresses, not text

\`if (s1 == s2)\` on two char* compares whether they point at the SAME memory, not whether the text is equal. Two different arrays holding identical text "GATE" and "GATE" are unequal by == and equal by strcmp(s1, s2) == 0. This is one of the most repeated GATE and interview traps in the entire subject.`,
    codeExample: {
      language: "c",
      code: `#include <stdio.h>
#include <string.h>

int main(void) {
    char a[6] = "Hello";      /* 5 letters + '\\0', exactly fits */
    char b[20];
    strcpy(b, a);
    strcat(b, ", GATE");

    printf("%s\\n", b);
    printf("%lu %lu\\n", strlen(a), sizeof(a));   /* 5 and 6 */
    printf("%d\\n", strcmp(a, "Hello"));          /* 0: equal text */
    printf("%d\\n", a == "Hello");                /* 0: different addresses */

    return 0;
}`,
      expectedOutput: `Hello, GATE
5 6
0
0`,
    },
    dryRun: `Trace the program above.

::: timeline Trace
char a[6] = "Hello"; :: Exactly 6 bytes: H,e,l,l,o,\\0 - the literal fits perfectly, with no room to spare.
strcpy(b, a); :: Copies a's bytes into b, including the terminator, so b now holds "Hello\\0".
strcat(b, ", GATE"); :: Finds b's terminator, overwrites it with the new text, then adds a fresh terminator: b becomes "Hello, GATE".
printf %s of b :: Prints Hello, GATE.
strlen(a) vs sizeof(a) :: strlen counts up to \\0: 5. sizeof reports the declared size: 6. Different questions, different answers.
strcmp(a, "Hello") :: Compares the TEXT, byte by byte - identical, so it returns 0.
a == "Hello" :: Compares ADDRESSES - a is a local array's address, "Hello" is a separate literal's address. Different addresses, so this is 0 (false), even though the text is identical.
:::

Same text, two different comparisons, two different answers - because == and strcmp are not asking the same question.`,
    workedExamples: [
      {
        title: "Tracing strlen and sizeof together",
        problem: "char buf[10] = \"Hi\"; What do strlen(buf) and sizeof(buf) each return, and why do they disagree?",
        solution: "buf holds 'H','i','\\0' followed by 7 further zero-initialised bytes (a partial array initializer zero-fills the rest). strlen(buf) walks from buf[0] until it finds the FIRST '\\0', at index 2 - so it returns 2. sizeof(buf) is a compile-time property of the array's type, unrelated to its contents - it returns 10, the number of bytes reserved. The two functions are answering unrelated questions: one is about the stored text, the other is about the declared size.",
      },
      {
        title: "Off-by-one in a manual copy loop",
        problem: "A student writes: char src[] = \"cat\"; char dst[3]; int i; for (i = 0; src[i] != '\\0'; i++) dst[i] = src[i]; What is wrong, and what does it corrupt?",
        solution: "src is \"cat\" plus a terminator, needing 4 bytes, so the loop runs for i = 0,1,2 copying 'c','a','t' - but dst has room for only 3 bytes total (indices 0-2). The loop never writes a terminator into dst, and even the third write (dst[2] = 't') already fills dst's last valid slot without leaving space for one. Reading dst afterward (strlen, printf %s) walks past the array into whatever memory follows, until it happens to find a stray zero byte. The fix needs dst sized for 4 (src's length + 1) and dst[i] = '\\0' added after the loop.",
      },
    ],
    keyPoints: [
      "An array is one contiguous, 0-indexed block with no automatic bounds checking - going past the last index silently corrupts adjacent memory",
      "A C string is a char array plus a rule: a '\\0' byte marks where the text ends; strlen stops there, sizeof does not care",
      "A string needs one MORE byte than its visible characters, for the terminator - forgetting it is the most common sizing mistake",
      "String literals are read-only; writing through a char * that points at one is undefined behaviour",
      "== on char* compares addresses, not text; strcmp compares the actual characters",
      "A 2D array is one row-major contiguous block: a[i][j] is at base + (i*C + j) * sizeof(element)",
    ],
    commonMistakes: [
      "Sizing a char array for the visible letters only and forgetting the extra byte '\\0' needs",
      "Assuming strlen and sizeof on the same array always agree - they measure different things and coincide only when the array is exactly full",
      "Writing to a string literal through a char * - char *s = \"hi\"; s[0] = 'H'; is undefined behaviour",
      "Comparing strings with == instead of strcmp - comparing addresses instead of text",
      "Calling strcpy/strcat into a destination too small for the result - neither function checks the destination's capacity",
    ],
    analogies: [
      "A C string is a sentence written on a strip of graph paper with no punctuation - the only way to know where it ends is a special blank cell ('\\0') marking the stop. Read past it and you are reading someone else's sentence.",
      "sizeof measures the shelf; strlen measures how many books are actually on it before the first gap.",
    ],
    memoryTricks: [
      "Every C string secretly costs one more byte than its visible letters - the '\\0' tax.",
      "== on char* asks 'same address?'. strcmp asks 'same text?'. Never confuse the two questions.",
      "sizeof is a compile-time fact about the box; strlen is a runtime fact about what is inside it.",
    ],
    formulas: [
      "A char array holding a string of n visible characters needs at least n + 1 bytes, for the terminator.",
      "For int a[R][C] in row-major order, a[i][j] is at flat index i*C + j, i.e. address base + (i*C + j) * sizeof(int).",
    ],
    shortcuts: [
      "When asked for a string's stored length versus its declared capacity, work out strlen (counts to '\\0') and sizeof (declared size) separately before answering - never assume they match.",
      "For 2D array traversal-order questions, remember row-major means the LAST index varies fastest - useful for eliminating wrong loop-nesting options quickly.",
    ],
    pyqRelevance: `Arrays and strings appear constantly as the vehicle for output-prediction questions in this subject - a strcpy/strcat trace, a strlen-versus-sizeof mismatch, or a 2D array index computation are the three recurring shapes, usually at 2 marks. The paper is C-specific, so the absence of a real string type, and the manual bookkeeping that forces, is the entire point of the topic.`,
    interviewConnection: `Buffer overflows - writing past an array's declared bounds via strcpy or a manual loop - are the single most consequential bug class C string handling produces. Understanding exactly why C strings need this much care is a prerequisite for reasoning about real security vulnerabilities, not just an exam topic.`,
    revisionSummary: `Arrays are contiguous same-sized boxes, 0-indexed, with no bounds checking. A C string is a char array plus a convention: a '\\0' marks the end. strlen counts up to '\\0'; sizeof reports the declared byte size - they answer different questions and usually disagree. String literals are read-only; a char* to one must never be written through. strcpy/strcat copy the terminator but never check the destination's capacity. == on char* compares addresses; strcmp compares text. A 2D array is one row-major block: a[i][j] is at base + (i*C+j)*sizeof(element).`,
    shortNotes: {
      fiveMinute: "An array is one contiguous block of same-sized elements, 0-indexed, with zero bounds checking - arr[5] on a 5-element array reads/writes past the end silently. A C string is just a char array with a convention: the byte '\\0' marks where the text stops; everything after it is irrelevant garbage. strlen(s) counts characters up to (not including) '\\0' - a RUNTIME fact about the contents. sizeof(s) on an actual array reports its declared byte size - a COMPILE-TIME fact about the type - and the two only agree when the array is exactly full. char s[N] = \"text\"; needs N >= strlen(\"text\") + 1, for the terminator. A string literal like \"Hello\" lives in read-only memory; char *p = \"Hello\"; p[0] = 'h'; is undefined behaviour, while char arr[] = \"Hello\"; arr[0] = 'h'; is fine because arr is a writable copy. strcpy/strcat never check the destination's capacity - overflowing it is undefined behaviour, not a caught error. == on two char* compares addresses; strcmp compares the actual text. A 2D array int a[R][C] is one row-major block: a[i][j] sits at base + (i*C + j) * sizeof(int).",
      oneMinute: "Arrays: contiguous, 0-indexed, no bounds check. Strings: char array + '\\0' terminator. strlen counts to '\\0' (runtime); sizeof is the declared size (compile-time) - they disagree unless the array is full. Need len+1 bytes for a string. String literals are read-only. strcpy/strcat don't check capacity. == compares addresses, strcmp compares text. 2D array: a[i][j] at base + (i*C+j)*size, row-major.",
      nightBefore: "strlen != sizeof, usually. Reserve len+1 for the '\\0'. Never write through a char* to a literal. == on strings compares addresses, not text - use strcmp. Row-major: a[i][j] = base + (i*C+j)*size.",
    },
    mcqs: [
      {
        question: "char s[5] = \"data\"; is this declaration valid, and if so what does it store?",
        options: [
          "Invalid - \"data\" needs 5 bytes and only 4 are given",
          "Valid - stores d,a,t,a,\\0 exactly filling all 5 bytes",
          "Valid but truncates to \"dat\"",
          "Invalid - char arrays cannot be initialised with a string literal",
        ],
        correctIndex: 1,
        explanation: "\"data\" has 4 visible characters plus a terminator - exactly 5 bytes, which exactly fits s[5]. This is a legal, fully-packed initialisation, unlike char s[5] = \"hello\"; which would be too small.",
      },
      {
        question: "What does the following print?\n\n  char a[] = \"cat\";\n  char b[] = \"cat\";\n  printf(\"%d %d\", a == b, strcmp(a, b) == 0);",
        options: ["1 1", "0 1", "1 0", "0 0"],
        correctIndex: 1,
        explanation: "a and b are two SEPARATE arrays with identical text, so they occupy different addresses - a == b (comparing addresses) is 0. strcmp compares the actual characters and finds them equal, so strcmp(a,b) == 0 is 1 (true).",
      },
      {
        question: "For int a[4][5] in row-major order, at what flat offset (in elements, not bytes) does a[2][3] sit?",
        options: ["8", "11", "13", "15"],
        correctIndex: 2,
        explanation: "Offset = i*C + j = 2*5 + 3 = 13, where C = 5 is the number of columns. Row-major order means every element of row 0 precedes every element of row 1, and so on.",
      },
    ],
    numericals: [
      {
        question: "char name[8] = \"GATECS\"; How many bytes of the 8 reserved does the string \"GATECS\" plus its terminator actually use?",
        answerMin: 7, answerMax: 7,
        unit: "bytes",
        solution: "\"GATECS\" has 6 visible characters, plus 1 terminator byte, = 7 bytes used out of the 8 reserved. The 8th byte is left over, zero-filled by the partial initializer but not part of what strlen or the meaningful text uses.",
      },
    ],
  },

  "structures-unions-and-storage-classes": {
    difficulty: "Moderate",
    estimatedMinutes: 35,
    // Verified via YouTube oEmbed (2026-08-29) - real, publicly viewable.
    resources: [{
      kind: "video",
      title: "Introduction to Structures in C",
      url: "https://www.youtube.com/watch?v=zmRxC7gYw-g",
      description: "Introduces structures in C, explaining why they're needed and how they're declared.",
    }],
    whatYoullLearn: [
      "Why a struct's size is usually more than the sum of its members' sizes - padding and alignment",
      "How a union lets several members share the same memory, and why writing one and reading another reinterprets the bits",
      "The four storage classes, and what each one controls: lifetime, default value and visibility",
      "How to compute a struct's size and a member's offset by hand for a GATE question",
    ],
    prerequisites: ["Arrays and Strings in C", "Pointers and Memory"],
    concept: `## A struct is a labelled folder holding fields of different sizes

::: story
An array holds many boxes of the SAME size and type. A struct holds a few boxes of DIFFERENT sizes and types, glued together under one name, with one folder tab. \`struct Point { int x; int y; };\` bundles two ints as one Point.
:::

::: remember
Struct members are accessed with \`.\` through a variable, and with \`->\` through a pointer: p.x and pp->x reach the same field - the arrow just dereferences first, automatically.
:::

## Padding: the compiler leaves gaps for alignment

::: story
Most processors read a 4-byte int fastest when it starts at an address that is a multiple of 4. So the compiler inserts invisible padding bytes between struct members to keep each one aligned - which means sizeof(struct) is frequently MORE than the sum of its members' sizes.
:::

::: cards A padding example
struct { char c; int i; } :: char is 1 byte, but the following int needs to start on a 4-byte boundary, so 3 padding bytes are inserted after c. Total: 1 + 3 + 4 = 8 bytes, not 5.
struct { int i; char c; } :: Reordered - i starts aligned immediately, and only trailing padding (rounding the WHOLE struct to a multiple of its largest member's alignment) may follow. Often still 8, but for a different reason.
:::

::: mistake
Assuming sizeof(struct S) equals the sum of sizeof of each member. Padding depends on member order and the target platform, and GATE routinely asks for the padded, not the naive, total.
:::

## A union shares one block among all its members

::: story
A struct gives every member its own space. A union gives every member the SAME space, sized to fit the largest one - only one member's value is meaningfully valid at any moment, because writing a new one overwrites the bytes the others were using.
:::

::: checkpoint
union U { int i; char c[4]; } u; u.i = 1; On a little-endian machine, what does u.c[0] read?
- (x) 1
- ( ) 0
- ( ) 256
- ( ) Undefined - unions cannot be read this way
> Little-endian stores the least-significant byte first, at the lowest address. u.i = 1 places the bytes 01 00 00 00 into u's shared memory, and u.c[0] reads that first byte: 1. This exact trick - using a union to inspect a machine's byte order - is a recurring GATE question.
:::

## Four storage classes control lifetime and visibility

::: cards Storage classes
auto :: The default for a local variable. Lives on the stack, exists only within its block, holds garbage until initialised.
static (local) :: Allocated once for the whole program; keeps its value across calls; still invisible outside the function.
static (global/file scope) :: Visible only within its own source file, not other .c files - restricts linkage.
extern :: Declares a variable defined elsewhere (another file), without allocating new storage.
register :: A hint asking the compiler to keep the variable in a CPU register for speed; the compiler may ignore it, and &register_var is illegal since a register has no address.
:::`,
    deepDive: `## Computing size and offset by hand

Work member by member: track the "current offset", and before placing a member of alignment A, round the current offset UP to the next multiple of A if it is not already one. After placing the last member, round the struct's total size up to a multiple of the LARGEST member's alignment (so an array of the struct also keeps every element aligned).

For struct { char a; int b; char c; } with int aligned to 4: a at offset 0 (1 byte, offset now 1); b needs 4-byte alignment, so 3 bytes of padding, placing b at offset 4 (4 bytes, offset now 8); c at offset 8 (1 byte, offset now 9); the struct's overall alignment is 4 (from the int), so the total size rounds up to 12 - three trailing padding bytes after c.

## typedef, and unions embedded inside a struct

typedef struct { int x, y; } Point; lets you write Point p; instead of struct Point p; - purely a naming convenience, creating no new type semantics beyond what the struct already had. A union embedded inside a struct is a common way to model "one of several possible payloads sharing a type tag" - a pattern that appears constantly in real systems code, and occasionally in a GATE question about how much memory a tagged variant actually costs.`,
    codeExample: {
      language: "c",
      code: `#include <stdio.h>

struct Padded {
    char a;
    int b;
};

union Endian {
    int i;
    char bytes[4];
};

void counter(void) {
    static int calls = 0;
    calls++;
    printf("call #%d\\n", calls);
}

int main(void) {
    printf("%lu\\n", sizeof(struct Padded));   /* 8, not 5, due to padding */

    union Endian e;
    e.i = 1;
    printf("%d\\n", e.bytes[0]);               /* 1 on little-endian, 0 on big-endian */

    counter();
    counter();
    counter();

    return 0;
}`,
      expectedOutput: `8
1
call #1
call #2
call #3`,
    },
    dryRun: `Trace the program above.

::: timeline Trace
sizeof(struct Padded) :: a is 1 byte at offset 0. b (an int) needs 4-byte alignment, so 3 padding bytes are inserted, placing b at offset 4. Total: 4 + 4 = 8, not 1 + 4 = 5.
e.i = 1; :: The union's shared 4 bytes now hold the bit pattern for the integer 1.
e.bytes[0] :: On a little-endian machine, the least-significant byte is stored FIRST (lowest address), so bytes[0] reads 1. On a big-endian machine it would read 0 instead - same code, different answer, because endianness is a hardware property, not a C-language guarantee.
counter() called three times :: calls is static, so it is created and initialised to 0 only once, ever. Each call increments the SAME variable: 1, then 2, then 3.
:::

Two entirely different mechanisms - padding and static storage - both hiding non-obvious state behind a single sizeof or a single repeated call.`,
    workedExamples: [
      {
        title: "Computing a padded struct's size",
        problem: "On a system with 1-byte char, 4-byte int and 8-byte double (each aligned to its own size), what is sizeof(struct S) for struct S { char a; double b; int c; };?",
        solution: "a is placed at offset 0 (1 byte used, offset now 1). b needs 8-byte alignment, so offset 1 rounds up to 8 - 7 padding bytes are inserted, and b occupies offset 8 to 15 (offset now 16). c needs only 4-byte alignment, and 16 is already a multiple of 4, so c sits at offset 16 to 19 (offset now 20). The struct's overall alignment is 8 (from the double, the largest requirement), so the total size rounds up from 20 to the next multiple of 8: 24. sizeof(struct S) is 24, even though a + b + c only add up to 1 + 8 + 4 = 13 bytes of actual data - 11 bytes are padding.",
      },
      {
        title: "Reading a union after writing a different member",
        problem: "union U { int i; float f; } u; u.i = 1065353216; printf(\"%f\", u.f); What does this print, and why is it not simply \"1065353216.000000\"?",
        solution: "A union stores only ONE set of bytes, shared by every member. Writing u.i = 1065353216 places that integer's bit pattern into the shared 4 bytes. Reading u.f does NOT convert the integer 1065353216 into a float value - it REINTERPRETS the same bits as an IEEE-754 float. 1065353216 happens to be the exact bit pattern of the float value 1.0, so the program prints 1.000000. This is exactly why unions are used to inspect raw bit patterns, and exactly why naively expecting 'the number I stored' back from the wrong member is a classic union mistake.",
      },
    ],
    keyPoints: [
      "A struct gives each member its own space; a union gives every member the SAME shared space, sized for the largest one",
      "sizeof(struct) usually exceeds the sum of member sizes because the compiler inserts padding to keep each member aligned to its own size, and rounds the total up to the largest member's alignment",
      "Reordering struct members changes the padding, and can change sizeof(struct) - member order is not free",
      "Writing one union member and reading another reinterprets the same underlying bits - it does not convert the value",
      "static means two different things depending on where it appears: persists a local across calls, or restricts a global's linkage to its own file; auto is the default for locals; extern declares without defining; register only hints and forbids taking the variable's address",
    ],
    commonMistakes: [
      "Assuming sizeof(struct) equals the sum of its members' sizes, ignoring padding inserted for alignment",
      "Reordering struct members and expecting sizeof to stay the same - padding depends heavily on member order",
      "Writing to one union member and reading a DIFFERENT one expecting the previous member's logical value, rather than a reinterpretation of the same bits",
      "Confusing static at file scope (restricts linkage to that file) with static inside a function (persists a local variable's value across calls) - the same keyword doing two different jobs",
      "Taking the address of a register variable - &x is illegal if x was declared register, since a register has no memory address",
    ],
    analogies: [
      "A struct is a labelled folder with different-sized documents inside, and the compiler adds blank pages between them so each one starts on a clean sheet (alignment). A union is one drawer that different documents take turns occupying - whichever was filed last is the only one still legible.",
      "static local storage is a whiteboard bolted to the wall of the function - it stays there between visits. An automatic local is a fresh sheet of paper handed out and thrown away every single call.",
    ],
    memoryTricks: [
      "Padding rounds a member's offset UP to its own alignment, and rounds the WHOLE struct UP to its largest member's alignment at the end.",
      "A struct is 'and' - every member coexists. A union is 'or' - only one member's bytes are meaningfully current.",
      "static: one copy for the whole program's life. auto: a fresh copy every call. extern: 'defined elsewhere, trust me'. register: a request, not a promise.",
    ],
    formulas: [
      "Round a member's offset UP to a multiple of its own alignment before placing it; round the struct's TOTAL size up to a multiple of its largest member's alignment at the end.",
      "sizeof(union) = sizeof(its largest member), rounded up to that member's alignment if needed - never the sum of the members.",
    ],
    shortcuts: [
      "For a struct-size question, place members one at a time, inserting padding only when the next member's alignment demands it, and round the final total to the largest alignment seen - do not just add member sizes.",
      "For a union-size question, skip the arithmetic entirely: the answer is the size of the single largest member (occasionally rounded up for alignment).",
    ],
    pyqRelevance: `Struct padding/size questions appear reliably, at 1 or 2 marks, almost always as "what is sizeof(struct S)" for a given member order - the padding calculation is the entire test. Union questions most often use the little-endian/big-endian byte-inspection trick shown above. Storage class questions (static's two different meanings, extern, register) are usually short conceptual MCQs rather than full traces.`,
    interviewConnection: `Struct padding is directly relevant to systems and embedded interviews - packing structs efficiently (or deliberately reordering members to reduce padding) is a real optimisation, and reading a struct's memory layout off a hex dump requires exactly this alignment reasoning. Unions for reinterpreting bits underlie real techniques like classic bit-hacks and general type-punning.`,
    revisionSummary: `A struct bundles differently-typed members, each with its own space; the compiler inserts padding so each member starts at an address that is a multiple of its own alignment, and rounds the whole struct up to its largest member's alignment - so sizeof(struct) is usually more than the sum of member sizes. A union gives all its members the SAME shared space, sized for the largest one; writing one member and reading another reinterprets the same bits rather than converting a value. Storage classes: auto (default, per-call, stack), static local (one copy, persists across calls), static global (file-scope linkage only), extern (declares, does not define), register (a hint, not a guarantee, and its variable has no address).`,
    shortNotes: {
      fiveMinute: "A struct holds differently-typed members, each in its own space; sizeof(struct) is usually MORE than the sum of member sizes because the compiler inserts padding so each member starts at an address that is a multiple of its own alignment, then rounds the whole struct up to a multiple of its LARGEST member's alignment. Reordering members changes the padding and can change sizeof. A union gives every member the SAME shared bytes, sized for the largest member - writing one member and reading a different one reinterprets the stored bits rather than converting a value; this is exactly how a union detects a machine's endianness. Four storage classes: auto (default local, stack-allocated, fresh garbage every call), static local (allocated once, keeps its value across calls, still invisible outside the function), static at file scope (restricts a global's linkage to its own .c file), extern (declares a variable defined elsewhere, allocates nothing new), register (a hint to keep a variable in a CPU register - the compiler may ignore it, and you cannot take its address).",
      oneMinute: "struct: each member own space, PADDED for alignment - sizeof usually > sum of members. union: all members share one space sized for the largest - writing one, reading another reinterprets bits. auto: default, per-call. static local: persists across calls. static global: file-scope only. extern: declared elsewhere. register: hint only, no address.",
      nightBefore: "sizeof(struct) includes padding, not just the sum of members. union size = largest member. static local persists across calls; auto does not. register has no address.",
    },
    mcqs: [
      {
        question: "On a system with char = 1 byte, int = 4 bytes (4-byte aligned), what is sizeof(struct S) for struct S { char a; char b; int c; };?",
        options: ["6", "8", "5", "9"],
        correctIndex: 1,
        explanation: "a at offset 0, b at offset 1 (both 1-byte, no alignment issue between them). c needs 4-byte alignment; offset 2 is not a multiple of 4, so 2 padding bytes are inserted, placing c at offset 4. Total: 4 (a, b, padding) + 4 (c) = 8.",
      },
      {
        question: "union U { int i; char c[4]; } u; u.i = 512; What does u.c[0] read on a little-endian machine?",
        options: ["512", "2", "0", "Undefined behaviour"],
        correctIndex: 2,
        explanation: "512 in binary is 0000001000000000, i.e. bytes (little-endian, least significant first) 0x00, 0x02, 0x00, 0x00. u.c[0] reads the first (least significant) byte, which is 0. The value 2 lives in u.c[1], not u.c[0].",
      },
      {
        question: "Which of these is illegal in standard C?",
        options: [
          "Declaring int x; static inside a function",
          "Taking the address of a register-declared variable with &x",
          "Declaring a global variable static to restrict it to its own file",
          "Assigning one union member and reading another",
        ],
        correctIndex: 1,
        explanation: "register is only a hint to keep a variable in a CPU register, which has no memory address - so &x on a register variable is illegal (a compile error), unlike the other three, which are all valid, if sometimes surprising, C.",
      },
    ],
    numericals: [
      {
        question: "On a system with char = 1 byte and int = 4 bytes (4-byte aligned), what is sizeof(struct S) for struct S { int a; char b; int c; };? (Assume the struct's own alignment rounds its total size to a multiple of 4.)",
        answerMin: 12, answerMax: 12,
        unit: "bytes",
        solution: "a at offset 0 (4 bytes, offset now 4). b at offset 4 (1 byte, offset now 5). c needs 4-byte alignment; offset 5 is not a multiple of 4, so 3 padding bytes are inserted, placing c at offset 8 (4 bytes, offset now 12). 12 is already a multiple of 4, so no further trailing padding is needed. sizeof(struct S) = 12.",
      },
    ],
  },

};
