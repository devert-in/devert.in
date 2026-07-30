// GATE Programming and Data Structures - authored lesson content.
// Follows the authoring rules documented at the top of general-aptitude.mjs.
//
// NOTE ON LANGUAGE: the CS paper specifies programming in **C**, not C++ and not
// Python. The DA paper specifies Python. Both papers contain a subject with a
// similar name, but they are DIFFERENT subject ids, so a C lesson written here
// never leaks into the DA tree.

export const PROGRAMMING_AND_DATA_STRUCTURES = {

  "pointers-and-memory": {
    difficulty: "Hard",
    estimatedMinutes: 45,
    whatYoullLearn: [
      "Why pointer arithmetic advances by sizeof(pointee) rather than by one byte",
      "The exact equivalence between array subscripting and pointer dereferencing",
      "Why sizeof behaves differently on an array and on a pointer to its first element",
      "What array decay is and where it silently changes program behaviour",
      "How to trace an output-prediction question without guessing",
    ],
    prerequisites: ["C Basics: Data Types and Operators", "Arrays and Strings in C"],
    concept: `## A pointer is a typed address

Two pointers can hold the same numeric address and still behave completely differently, because a pointer carries a **type** as well as a value. The type is what tells the compiler how far to move for \`p + 1\` and how many bytes to read for \`*p\`.

That single fact explains almost every output-prediction question in this topic.

## Arithmetic scales by the pointed-to type

For a pointer \`T *p\`, the expression \`p + n\` does not add \`n\` bytes. It adds \`n * sizeof(T)\` bytes.

::: cards Same address, different step
char *c :: c + 1 advances 1 byte.
int *i :: i + 1 advances 4 bytes on a typical implementation.
double *d :: d + 1 advances 8 bytes.
struct Node *s :: s + 1 advances sizeof(struct Node) bytes, padding included.
:::

Subtraction inverts this. \`&a[3] - &a[0]\` is **3**, not 12 - the difference between two pointers into the same array is measured in *elements*, and its type is \`ptrdiff_t\`.

::: behind
This is why pointer arithmetic on \`void *\` is not valid standard C: with no pointee type there is no scale factor, so the compiler has nothing to multiply by. GCC permits it as an extension treating the size as 1, which is exactly the kind of thing a question can hinge on.
:::

## Subscripting is dereferencing

The subscript operator is defined by the standard as:

  a[i]  is exactly  *(a + i)

Addition commutes, so \`*(a + i)\` equals \`*(i + a)\`, which means \`i[a]\` is legal C and gives the same element as \`a[i]\`. That is a curiosity rather than something to write, but it is a favourite of examiners because it exposes whether you know subscripting is arithmetic rather than a special array feature.

A negative index is equally legal, provided the resulting address is inside the object: if \`p\` points at \`a[3]\`, then \`p[-1]\` is \`a[2]\`.

::: checkpoint
Given \`int a[5] = {10,20,30,40,50};\` and \`int *p = a;\`, what does \`*p + 2\` evaluate to?
- ( ) 30
- (x) 12
- ( ) 20
- ( ) The address of a[2]
> Unary \`*\` binds tighter than binary \`+\`, so this is \`(*p) + 2\` = a[0] + 2 = 12. Getting 30 requires \`*(p + 2)\`. Precedence, not pointers, is what this tests.
:::

## Arrays are not pointers

An array and a pointer are different types that behave similarly in most expressions, and the exceptions are where marks are won.

An array name **decays** to a pointer to its first element in nearly every context - but not under \`sizeof\`, not under unary \`&\`, and not when it is a string literal initialising an array.

::: mistake
\`sizeof(arr)\` inside the function that declared \`int arr[5]\` gives 20. Pass \`arr\` to a function taking \`int *p\` and \`sizeof(p)\` gives the pointer's own size - 8 on a 64-bit build. The array's length is genuinely gone; this is why every C function taking an array also takes its length.
:::

## Three ways a pointer goes wrong

::: cards
Uninitialised :: Declared but never assigned. Holds whatever was on the stack. Dereferencing is undefined behaviour, not a guaranteed crash.
Dangling :: Points at memory that has been freed, or at a local that has gone out of scope. Often appears to work, which is what makes it dangerous.
Null :: Explicitly points at nothing. Dereferencing is undefined, but at least it is reliably detectable with a check.
:::`,
    deepDive: `## Why returning a pointer to a local is fatal

    int *broken(void) {
        int x = 42;
        return &x;      /* x dies when this function returns */
    }

The address is still numerically valid, and reading it often still yields 42 because nothing has reused that stack slot yet. It will keep working until some unrelated call overwrites it. Questions describe this as "may print 42 or may print garbage" and the correct characterisation is **undefined behaviour**, not "prints garbage".

## Pointers to pointers, and why 2D arrays are not int**

\`int **pp\` is a pointer to a pointer, used for arrays of pointers and for letting a function modify a caller's pointer.

But a genuine 2D array \`int a[3][4]\` is **not** convertible to \`int **\`. It is a contiguous block of 12 ints, and \`a\` decays to \`int (*)[4]\` - a pointer to an array of 4 ints. Advancing that pointer by 1 moves 16 bytes, a whole row. An \`int **\` would instead require an array of three separate row pointers, which is a different memory layout entirely.

::: remember
a[i][j] on a true 2D array is *(*(a + i) + j), and the compiler computes it as base + (i x columns + j) x sizeof(int). Row-major order - and the reason iterating rows is faster than iterating columns.
:::

## const placement reads right to left

    const int *p;        /* pointer to const int - cannot change *p, can change p  */
    int * const p;       /* const pointer to int - can change *p, cannot change p  */
    const int * const p; /* neither can change                                    */

Read from the variable name outwards. Whichever side \`const\` sits relative to the \`*\` tells you whether the pointer or the pointee is fixed.`,
    dryRun: `Predict the output of the program in the runnable example above, line by line.

::: timeline Trace
int a[5] = {10,20,30,40,50}; int *p = a; :: The array name decays, so p holds the address of a[0]. p's type is int *, so its step is sizeof(int) = 4 bytes.
printf("%d", *(p + 2)); :: p + 2 advances 2 x 4 = 8 bytes, landing on a[2]. Dereferencing gives **30**.
printf("%d", *p + 2); :: Unary * binds tighter than +, so this is (*p) + 2 = a[0] + 2 = 10 + 2 = **12**. The parentheses are the whole difference from the line above.
printf("%d", (int)(&a[3] - &a[0])); :: Pointer difference is measured in elements, not bytes, so the answer is **3** - not 12.
p += 3; :: p now points at a[3].
printf("%d", p[-1]); :: p[-1] is *(p - 1), which is a[2], giving **30**. Negative indices are legal while the address stays inside the object.
printf("%zu %zu", sizeof(a), sizeof(p)); :: sizeof on the array gives 5 x 4 = **20**. sizeof on the pointer gives the pointer's own width - **8** on a 64-bit build.
:::

So the output is \`30\`, \`12\`, \`3\`, \`30\`, \`20 8\`.

::: tip
Every one of these lines is decided by exactly one rule: precedence, the scale factor, or decay. When a question looks like arithmetic soup, identify which of the three it is testing and the answer follows.
:::`,
    codeExample: {
      language: "c",
      code: `#include <stdio.h>

int main(void) {
    int a[5] = {10, 20, 30, 40, 50};
    int *p = a;                  /* array decays to &a[0] */

    printf("%d\\n", *(p + 2));    /* element at index 2      */
    printf("%d\\n", *p + 2);      /* element at 0, plus 2    */
    printf("%d\\n", (int)(&a[3] - &a[0]));  /* difference in ELEMENTS */

    p += 3;                      /* p now points at a[3]   */
    printf("%d\\n", p[-1]);       /* legal: this is a[2]     */

    /* sizeof sees the array here, but only a pointer inside a function */
    printf("%zu %zu\\n", sizeof(a), sizeof(p));
    return 0;
}`,
      expectedOutput: `30
12
3
30
20 8`,
    },
    keyPoints: [
      "A pointer carries a type as well as an address, and the type sets both the arithmetic step and the read width",
      "p + n advances n * sizeof(pointee) bytes, never n bytes unless the pointee is one byte wide",
      "Pointer subtraction yields a count of elements, not bytes",
      "a[i] is defined as *(a + i), which is why i[a] compiles and why negative indices are legal in range",
      "Unary * binds tighter than binary +, so *p + 2 and *(p + 2) are different expressions",
      "An array decays to a pointer everywhere except under sizeof and unary &, so length information is lost on a function call",
      "int a[3][4] decays to int (*)[4], not to int ** - the two layouts are incompatible",
      "Dereferencing an uninitialised, dangling or null pointer is undefined behaviour, not a guaranteed crash",
    ],
    commonMistakes: [
      "Reading *p + 2 as *(p + 2) - operator precedence, not pointer semantics, is what this tests",
      "Expecting &a[3] - &a[0] to be 12 because ints are 4 bytes; pointer difference counts elements",
      "Expecting sizeof to report the array length after the array has been passed to a function",
      "Passing a 2D array to a parameter declared int ** and expecting it to work",
      "Returning the address of a local variable and treating the result as merely 'garbage' rather than undefined behaviour",
      "Assuming sizeof(pointer) is always 4 - it is implementation-defined and 8 on typical 64-bit builds",
      "Doing arithmetic on void * and assuming a step of 1 is standard C rather than a compiler extension",
    ],
    analogies: [
      "A pointer is a street address written on a form that also states what kind of building it is. 'Next building along' means something different on a street of houses than on a street of warehouses - same instruction, different distance",
    ],
    memoryTricks: [
      "'Star binds tight' - unary * grabs its operand before any binary operator gets a turn",
      "Pointer difference answers 'how many elements apart', never 'how many bytes apart'",
      "Decay dies at sizeof and & - those are the only two places an array stays an array",
      "Read const declarations from the name outwards to decide whether the pointer or the pointee is frozen",
    ],
    formulas: [
      "For T *p: the address of p + n is (address of p) + n * sizeof(T)",
      "a[i] is exactly *(a + i), and therefore equals i[a]",
      "(&a[m] - &a[n]) equals m - n, in elements, of type ptrdiff_t",
      "For int a[R][C]: the address of a[i][j] is base + (i * C + j) * sizeof(int)",
    ],
    shortcuts: [
      "In an output-prediction question, first mark every dereference with its precedence - most wrong answers come from misreading *p + 1 rather than from the pointer logic",
      "Convert every subscript to its *(a + i) form before tracing; the arithmetic then becomes uniform and mistakes become visible",
      "For 2D array address questions, use base + (i * columns + j) * elementsize directly rather than reasoning about rows",
    ],
    pyqRelevance: "Programming and Data Structures is worth around 11 marks and pointer questions are the single most reliable source of them, almost always as 2-mark output-prediction code. Three shapes dominate: arithmetic and precedence on a 1D array, sizeof behaviour before and after a function call, and address computation on a 2D array. All three are mechanical once you convert subscripts to pointer form and check precedence first. Note the paper specifies C, so C++ references and Python semantics are out of scope.",
    interviewConnection: "Directly relevant to any systems or embedded interview, and the underlying model matters even in managed languages: understanding that an array is a contiguous block with computed offsets is what explains why row-major traversal is cache-friendly and why bounds checks cost what they cost.",
    revisionSummary: "A pointer is a typed address. p + n moves n * sizeof(pointee) bytes; p - q counts elements. a[i] is *(a + i), so i[a] works and negative indices are legal in range. Unary * outranks binary +. Arrays decay to pointers everywhere but sizeof and &, so length is lost on a call. int a[R][C] decays to int (*)[C], never int **.",
    shortNotes: {
      fiveMinute: `A pointer carries a **type**, and the type decides both how far \`p + 1\` moves and how many bytes \`*p\` reads. \`p + n\` advances \`n * sizeof(pointee)\` bytes. Pointer **subtraction** counts elements, so \`&a[3] - &a[0]\` is 3, not 12.

Subscripting is arithmetic: \`a[i]\` is defined as \`*(a + i)\`, which is why \`i[a]\` compiles and why \`p[-1]\` is legal when \`p\` points at \`a[1]\` or later.

Precedence trap: unary \`*\` binds tighter than binary \`+\`, so \`*p + 2\` is \`(*p) + 2\` while \`*(p + 2)\` is the third element.

Arrays **decay** to a pointer to their first element everywhere except under \`sizeof\` and unary \`&\`. So \`sizeof(arr)\` is the full array inside its declaring scope but the pointer width after a function call - the length is genuinely lost.

A true 2D array \`int a[R][C]\` decays to \`int (*)[C]\`, not \`int **\`. Address of \`a[i][j]\` = base + (i*C + j) * sizeof(int).

Uninitialised, dangling and null dereferences are all **undefined behaviour** - not a promised crash.`,
      oneMinute: "p + n moves n*sizeof(pointee) bytes; p - q counts ELEMENTS. a[i] is *(a+i). Unary * beats binary +, so *p+2 is not *(p+2). Arrays decay except under sizeof and &. int a[R][C] decays to int (*)[C], not int **. Bad dereference = undefined behaviour.",
      nightBefore: "Pointer difference is in elements. *p + 2 is not *(p + 2). sizeof loses the array after a function call. 2D arrays are not int**. a[i][j] = base + (i*C + j)*size.",
    },
    mcqs: [
      {
        question: "Given `int a[5] = {10,20,30,40,50};` and `int *p = a;`, what does `*p + 2` print?",
        options: ["30", "12", "20", "The address of a[2]"],
        correctIndex: 1,
        explanation: "Unary * binds tighter than binary +, so the expression is (*p) + 2 = a[0] + 2 = 12. Reaching 30 needs *(p + 2).",
      },
      {
        question: "For `int a[10];`, what is the value of `&a[7] - &a[2]`?",
        options: ["5", "20", "The byte distance, implementation-defined", "Undefined behaviour"],
        correctIndex: 0,
        explanation: "Pointer subtraction within one array yields the difference in elements, of type ptrdiff_t. 7 - 2 = 5, regardless of sizeof(int).",
      },
      {
        question: "A function is declared `void f(int *p)` and called as `f(arr)` where `int arr[20]`. Inside f, what does `sizeof(p)` give?",
        options: [
          "80, the array's size in bytes",
          "20, the element count",
          "The size of a pointer on that implementation",
          "A compile-time error",
        ],
        correctIndex: 2,
        explanation: "The array decayed to a pointer at the call, so p is an ordinary int * and sizeof reports the pointer's own width - commonly 8 on 64-bit. The length is not recoverable inside f.",
      },
      {
        question: "Which expression is NOT equivalent to `a[i]` for an array `a`?",
        options: ["*(a + i)", "*(i + a)", "i[a]", "*a + i"],
        correctIndex: 3,
        explanation: "*a + i dereferences first and then adds i to the value, giving a[0] + i. The other three are all the same address computation.",
      },
      {
        question: "Why can a 2D array `int a[3][4]` not be passed to a parameter of type `int **`?",
        options: [
          "Because 2D arrays cannot be passed to functions at all",
          "Because a decays to int (*)[4], a pointer to an array of 4 ints, which is a different type and layout from a pointer to a pointer",
          "Because int ** can only point to char data",
          "Because the array is const",
        ],
        correctIndex: 1,
        explanation: "A true 2D array is one contiguous block of 12 ints. int ** implies an array of separate row pointers - a genuinely different memory layout, so the conversion is not merely disallowed but meaningless.",
      },
    ],
    numericals: [
      {
        question: "For `int a[10];` on an implementation where sizeof(int) is 4, what is the value of `&a[8] - &a[3]`?",
        answerMin: 5, answerMax: 5,
        unit: "elements",
        solution: "Pointer subtraction is measured in elements, so the result is 8 - 3 = **5**. The size of int does not enter into it - that would only matter for a byte distance.",
      },
      {
        question: "An array is declared `int a[3][5];` with base address 2000 and sizeof(int) = 4, stored in row-major order. What is the address of a[2][3]?",
        answerMin: 2052, answerMax: 2052,
        unit: "",
        solution: "Address = base + (i * columns + j) * sizeof(int) = 2000 + (2*5 + 3) * 4 = 2000 + 13*4 = 2000 + 52 = **2052**.",
      },
      {
        question: "A pointer `double *d` holds the address 1000. On an implementation where sizeof(double) is 8, what address does `d + 6` hold?",
        answerMin: 1048, answerMax: 1048,
        unit: "",
        solution: "Pointer arithmetic scales by the pointee size: 1000 + 6 * 8 = 1000 + 48 = **1048**.",
      },
    ],
  },

};
