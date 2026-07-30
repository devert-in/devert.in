// Compiler Design - rewritten lesson bodies. See operating-systems.mjs for the
// authoring rules. The running analogy is translation between human languages:
// letters into words (lexer), words into grammatical sentences (parser), does
// the sentence mean anything (semantic analysis), and then the pivot-language
// trick real translation bureaus use - which is exactly why LLVM exists. Each
// lesson names its phase's position in the pipeline, and the final lesson walks
// the whole six-phase chain end to end.

export const COMPILER_DESIGN = {
  "lexical-analysis": {
    concept: `## Nobody Translates A Book In One Pass

::: story
You write \`total = price + 5;\`. The machine executes electrical signals. Something has to get from one to the other, and it is not a single leap.

A compiler works the way a careful translator works: in passes. Recognise the words. Check the sentence is grammatical. Work out what it means. Only then start producing the other language.
:::

::: cards The six phases
Lexical analysis :: Raw characters become tokens.
Parsing :: Tokens are checked against the language's grammar.
Semantic analysis :: The structure is checked for meaning - declared variables, compatible types.
Intermediate code generation :: A simpler, machine-independent form is produced.
Optimization :: That form is rewritten to be faster or smaller.
Code generation :: Actual target-machine instructions come out.
:::

::: remember
This subject's two modules split that list in half. The Front End covers roughly the first three; the Back End covers the rest.

Learn the order now. It is the single most reliably asked question in any compiler discussion.
:::

## Letters Are Not Words

::: story
Read this: \`totalprice\`. Two words or one? A human hesitates for a moment; a compiler cannot hesitate at all.

The first phase, **lexical analysis**, is the part that decides. It reads source code one character at a time and groups those characters into **tokens** - the smallest units that carry meaning.
:::

The component doing this is the **lexer**, sometimes called the scanner.

  Source:  total = price + 5;

  Tokens:  IDENTIFIER("total")  ASSIGN("=")  IDENTIFIER("price")
           PLUS("+")  NUMBER("5")  SEMICOLON(";")

::: cards What the tokens are
Keywords :: Words the language reserves - \`if\`, \`while\`, \`return\`.
Identifiers :: Names the programmer chose - \`total\`, \`price\`, \`calculateTax\`.
Operators :: \`+\`, \`==\`, \`&&\`.
Literals :: Values written directly in the source - \`42\`, \`"hello"\`.
:::

::: remember
Whitespace and comments are **discarded entirely** at this phase. They carry no meaning for anything downstream, so nothing downstream ever sees them.

Which is why indentation is free in most languages, and why a comment can never change what a program does.
:::

::: mistake
Expecting the lexer to notice a missing closing bracket.

It won't. The lexer has no idea what structure is - it hands over an unpunctuated stream of tokens with no opinion about whether they form anything sensible. Matching brackets is parsing's job, and parsing is the next phase.
:::

::: checkpoint
The lexer processes \`if (x > 5 {\`. What happens?
- ( ) It reports a syntax error about the missing closing parenthesis
- (x) It produces tokens successfully - IF, LPAREN, IDENTIFIER, GT, NUMBER, LBRACE - because every individual piece is a recognisable token
- ( ) It discards the line entirely
- ( ) It stops at the first parenthesis
> Tokens come out fine. Every character in that line belongs to a valid token; nothing about the *arrangement* is the lexer's concern. The error will be caught, but one phase later.
:::

## The Machine Underneath

::: behind
A lexer is not hand-written character-by-character logic. It is built from **regular expressions** - one pattern per token type, like "one or more digits" for NUMBER - compiled down into a **finite automaton**: a state machine that reads a character, changes state, and repeats until it has recognised a complete token.

Which is the practical payoff of understanding regular expressions. They aren't just a text-processing convenience; they are literally the specification language a real compiler's scanner is generated from.
:::

::: interview
Two things to have ready cold: the six phases in order, and the ability to tokenize a short line of code out loud on the spot.

Both come up constantly, and both are pure recall - which means there is no excuse for fumbling either.
:::`,
  },

  "parsing": {
    concept: `## Grammatical Before Meaningful

::: story
"Colourless green ideas sleep furiously" is a perfectly grammatical English sentence that means nothing at all.

That gap - between structurally correct and actually meaningful - is exactly the boundary between this phase and the next. **Parsing**, also called syntax analysis, only asks the first question.
:::

The parser takes the lexer's token stream and checks whether it forms a structurally valid sentence in the language's grammar.

  Valid:   if (x > 5) print(x);     -- matches the grammar's structure
  Invalid: if (x > 5 print(x);      -- missing closing paren, fails parsing

::: remember
A human can guess what the second line was meant to say. The parser cannot accept it anyway.

Grammar rules are not suggestions the compiler weighs against intent; they are the definition of what the language *is*.
:::

## Grammar, Written Down Formally

A language's valid syntax is defined by a **context-free grammar** - a set of rules saying which token sequences are legal.

  statement  -> IF ( expression ) statement
  expression -> expression + term | term

::: flow
The parser's actual job :: Determine whether the token stream can be **derived** from the grammar's start symbol by repeatedly applying these rules.
If it can :: The parse succeeds, and a **parse tree** - or the more compact **abstract syntax tree** - is built, representing the code's structure.
If it can't :: A syntax error is reported, naming where the derivation broke down.
:::

::: cards Parse tree vs AST
Parse tree :: Every grammar rule applied, every token, including punctuation and rules that exist purely to make the grammar unambiguous.
Abstract syntax tree :: The same structure with the bookkeeping stripped out - only the semantically meaningful parts survive. This is what later phases actually use, and it gets its own lesson next.
:::

::: mistake
Reading "syntax error" as "my logic is wrong."

It means only that the structure doesn't match the grammar. Your logic hasn't been evaluated yet - the compiler never got far enough to have an opinion about it. Perfectly logical code with one missing brace fails here; utterly nonsensical code with correct punctuation sails through.
:::

## Two Directions Through The Same Grammar

::: cards Top-down vs bottom-up
Top-down :: Start at the grammar's start symbol and work downward, predicting which rule applies next and trying to match the input against it. **Recursive-descent** parsers work this way, and are common in hand-written parsers because the code reads like the grammar.
Bottom-up :: Start from the actual input tokens and work upward, recognising small pieces and combining them into larger structures until the whole input reduces to the start symbol. **LR** parsers work this way, and dominate parser-generator tools.
:::

::: analogy
Two ways to solve a jigsaw. Top-down: look at the picture on the box and work out where each region must be. Bottom-up: find pieces that fit each other and grow the assembled area until it's the whole picture.

Same finished puzzle. Genuinely different strategies for getting there.
:::

::: checkpoint
Which parsing approach is a hand-written recursive-descent parser?
- (x) Top-down - it starts from the start symbol and predicts downward, with one function per grammar rule
- ( ) Bottom-up
- ( ) Neither - recursive descent isn't a parsing technique
- ( ) Both simultaneously
> Top-down. Each grammar rule becomes a function that calls the functions for the rules it references, so the parser's structure mirrors the grammar's. That readability is exactly why it's the usual choice when someone writes a parser by hand.
:::

::: interview
Have a concrete example of a syntax error and a semantic error ready, and be clear about which phase catches each.

A missing parenthesis is syntax, caught here. Adding a string to a boolean is semantic, caught in the next phase. Mixing the two up is the most common way this topic gets fumbled.
:::

::: behind
An **ambiguous** grammar lets one input be derived in two structurally different ways - and the classic case is the dangling else:

  if (a) if (b) x(); else y();

Which \`if\` does that \`else\` belong to? The grammar alone doesn't say. Real language specifications settle it with an explicit rule - typically that an \`else\` binds to the nearest unmatched \`if\` - so that every compiler for the language parses it identically rather than each one guessing.
:::`,
  },

  "syntax-trees": {
    concept: `## The Shape Of The Meaning

::: story
\`total = price + 5\`.

Strip away the punctuation, the spacing, and the grammar rules that only existed to make the parse unambiguous. What survives is an assignment, whose right-hand side is an addition, whose operands are a variable and a number.

Draw that as a tree and you have the **abstract syntax tree**.
:::

  Source: total = price + 5

          ASSIGN
         /      \\
      total     PLUS
               /    \\
            price     5

::: remember
The AST captures structure and precedence, not text. No semicolons, no parentheses - because once the tree is built, precedence is expressed by the tree's *shape* rather than by punctuation.

\`(a + b) * c\` and \`a + b * c\` produce different trees. That difference is the whole point.
:::

::: mistake
Expecting the AST to preserve every token from the source.

It deliberately doesn't. Parentheses existed to tell the parser how to group things; once the grouping is baked into the tree's structure, the parentheses have no further job. Keeping them would be keeping the scaffolding after the building is up.
:::

::: checkpoint
Why does the AST for \`(a + b) * c\` have MULTIPLY at the root rather than PLUS?
- (x) The root is the operation performed last - the addition must be evaluated first, so it sits below as a child of the multiplication
- ( ) The root is always the first operator in the source text
- ( ) Multiplication always outranks addition in every tree, regardless of parentheses
- ( ) Because parentheses are stored as a special node type
> The root is the last operation performed. Children must be evaluated before their parent, so the parenthesised addition sits underneath - which is exactly how the tree encodes evaluation order without needing the parentheses themselves.
:::

## Where Meaning Gets Checked

::: story
\`undeclaredVariable = 5;\` is grammatically perfect. An identifier, an assignment operator, a number, a semicolon. The parser has no complaint whatsoever.

It still won't compile.
:::

**Semantic analysis** walks the AST asking questions grammar cannot answer.

::: cards What semantic analysis checks
Declaration :: Do \`total\` and \`price\` actually exist? Were they declared, and is this scope allowed to see them?
Type compatibility :: Do their types make \`+\` a legal operation between them?
Assignability :: Is \`total\` something that can be assigned to, or is it a constant?
:::

::: remember
Syntax errors are structural. Semantic errors are meaning-level. Two different phases, catching two genuinely different classes of problem.

"Missing semicolon" and "cannot add string to boolean" are not the same kind of complaint, and knowing which phase produces which is a standard interview probe.
:::

::: behind
Semantic analysis leans on a second data structure alongside the AST: the **symbol table**, mapping each identifier to what's known about it - type, scope, eventual memory location.

It's built up as the tree is walked and consulted constantly, because every "is this declared?" and "what type is this?" question is a lookup into it. The AST and the symbol table are the two structures this phase runs on.
:::

## The Structure Everything Else Uses

::: flow
Semantic analysis :: Walks the AST, checking meaning.
Intermediate code generation :: Walks the AST, lowering it toward a simpler form.
Optimization and code generation :: Work on what that produced, progressively closer to machine instructions.
:::

::: remember
Every phase after parsing operates on the AST or on something derived from it. It is the central shared structure the entire rest of the compiler is built around - which is why it's worth being able to sketch one by hand.
:::

::: didyouknow
"Go to definition" in your editor, automated refactoring, and every linter you've used all work by building an AST of your code and analysing it.

It's the same core structure a compiler builds internally. Your IDE is quietly running the front half of a compiler while you type.
:::`,
  },

  "intermediate-code": {
    concept: `## The Pivot Language Trick

::: story
A translation bureau handles 20 source languages and 20 target languages. Translating every pair directly means 400 translators.

Or: everyone translates into one shared middle language, and out of it. Now it's 40.

Compilers made exactly this decision.
:::

Rather than translating the AST straight into one specific CPU's machine code, most real compilers first produce an **intermediate representation** - lower-level than the source, still independent of any particular target machine.

::: cards What the split buys
Front end :: Lexer, parser, semantic analysis - everything specific to the *source language*. Produces IR.
Back end :: Optimization and code generation - everything specific to the *target machine*. Consumes IR.
The payoff :: A new language needs only a new front end. A new CPU architecture needs only a new back end. Neither needs the other rewritten.
:::

::: remember
This is deliberate architecture, not an extra step someone forgot to remove.

Without it, supporting L languages on M machines needs L×M compilers. With it, L front ends plus M back ends.
:::

::: mistake
Picturing compilation as source going directly to machine code in one translation.

It's a plausible mental model and it's wrong for essentially every production compiler. Missing the IR means missing the reason the whole industry is organised the way it is.
:::

## Three Addresses, No Nesting

**Three-address code** is a common concrete IR: every instruction has at most three operands - typically one result and two inputs.

  Source: total = price + 5 * quantity

  t1 = 5 * quantity
  t2 = price + t1
  total = t2

::: remember
Every operation is broken into the smallest possible individual step, with temporaries holding the in-between values.

That uniformity is the point. A nested expression tree is awkward to analyse systematically; a flat list of identical-shaped instructions is straightforward - which matters enormously for the optimization phase coming next.
:::

::: checkpoint
Why is three-address code easier to optimise than the original AST?
- ( ) It's shorter than the source code
- (x) Every operation is already decomposed into uniform, single-step instructions, so patterns like "this exact computation happens twice" are systematically detectable
- ( ) It's already machine code
- ( ) Optimisation actually runs on the AST, not the IR
> The uniformity. Spotting a repeated computation inside two differently-nested expression trees is hard; spotting two identical three-address instructions is easy. The IR is shaped for the analysis that follows it.
:::

## This Is What LLVM Is

::: story
**LLVM** is the pivot-language idea, built as production infrastructure and used everywhere.

Clang compiles C and C++ into LLVM IR. The Rust compiler produces LLVM IR. So does Swift's. All three then hand off to the same back end, which knows how to optimise that IR and turn it into x86, ARM, or RISC-V.

Three language teams, one shared optimiser and code generator. None of them had to build one.
:::

::: behind
LLVM IR is designed to be readable as text, which makes it unusually easy to look at rather than just read about.

Compiling a small C file with \`clang -S -emit-llvm\` prints it. Seeing three-address-style IR produced by a real production compiler makes the concept concrete in a way a textbook example doesn't.
:::

::: interview
Naming the phase is worth little. Explaining *why* it exists - front-end and back-end reuse, avoiding the L×M explosion - is the answer that lands.

Have LLVM ready as the concrete example if the conversation goes toward real infrastructure.
:::`,
  },

  "optimization": {
    concept: `## Faster, With One Absolute Rule

::: story
The optimizer rewrites the intermediate representation into something equivalent but better - faster to execute, or smaller.

There is exactly one constraint, and it does not bend: the optimised program must produce identical observable results to the original, for every possible input.
:::

::: remember
An "optimisation" that changes behaviour is not an aggressive optimisation. It is a **bug**.

Speed is the goal; correctness is the definition. A transformation that fails the correctness test doesn't qualify as an optimisation at all, no matter how much faster it runs.
:::

::: mistake
Treating the correctness constraint as a strong preference that can be traded against performance.

It cannot. A compiler that occasionally produces a faster program with different output is not a fast compiler - it is an unusable one, because nothing built with it can be trusted.
:::

## Three You Should Be Able To Name

::: cards The classic techniques
Constant folding :: Compute purely constant expressions at compile time instead of at runtime. \`x = 2 + 3;\` becomes \`x = 5;\` - the addition never depended on anything the program does.
Dead code elimination :: Remove code whose result is never used. An assignment to a variable never read afterwards, or a branch that can never be reached.
Common subexpression elimination :: Spot the same computation done twice with unchanged inputs, compute it once, reuse the result.
:::

  Before:
    x = 2 + 3;
    y = a * b + 1;
    z = a * b + 2;     // a*b computed identically, twice
    unused = 99;       // never read afterwards

  After:
    x = 5;             // constant folding
    temp = a * b;      // computed once...
    y = temp + 1;
    z = temp + 2;      // ...common subexpression elimination
                       // 'unused = 99;' gone - dead code elimination

::: checkpoint
The optimizer sees \`result = 60 * 60 * 24;\` in your source. What does the compiled program do at runtime?
- ( ) Performs two multiplications, as written
- (x) Nothing - the value 86400 was computed at compile time and is simply stored
- ( ) Skips the line entirely, since the result is constant
- ( ) Performs one multiplication and stores the rest
> Nothing at runtime. Constant folding evaluates it during compilation. Which is genuinely useful to know as a programmer: writing \`60 * 60 * 24\` instead of \`86400\` costs nothing at runtime and is far clearer to read.
:::

::: mistake
Confusing dead code elimination with deleting code that merely looks unnecessary.

The compiler removes code only after proving the result is never used. "Looks pointless" and "provably unused" are different standards, and the compiler is held to the second one.
:::

## Why It Runs On The IR

::: remember
Optimization operates on the intermediate representation, not the original source text.

Detecting "this exact computation appears twice" inside two arbitrarily-nested source expressions is genuinely hard. Detecting two identical three-address instructions is easy. The previous lesson's uniform, decomposed form is what makes this phase practical.
:::

::: behind
Not every optimisation is pattern-matching. **Loop-invariant code motion** moves a computation that doesn't change across iterations out of the loop body, so it runs once instead of a thousand times.

But the compiler has to first *prove* that computation depends on nothing that changes inside the loop. That's real program analysis, not a lookup table of rewrites - and it's why serious optimisers are serious pieces of engineering.
:::

::: interview
Have one concrete example of each of the three named techniques, and state the correctness constraint as the definition rather than as a caveat.

Candidates who list optimisations sound like they read a chapter. Candidates who lead with "it must not change observable behaviour for any input" sound like they understand what a compiler is for.
:::`,
  },

  "code-generation": {
    concept: `## Committing To A Machine

::: story
Everything so far has been deliberately machine-independent. The IR could become x86, ARM, or RISC-V; nothing has decided yet.

**Code generation** is where the compiler finally commits. Which register holds which value. Which exact instruction encodes this operation on this architecture.
:::

  Three-address code:    t1 = price + 5
                         total = t1

  Generated x86-style assembly:
    MOV  EAX, [price]
    ADD  EAX, 5
    MOV  [total], EAX

::: mistake
Assuming code generation always means native machine code.

It often doesn't. \`javac\` generates JVM bytecode; Kotlin and C# compilers target their own virtual machines. That's still code generation - the target is simply a virtual machine rather than physical silicon, and every phase before it was identical.
:::

## The Hard Part

::: story
A CPU has a small, fixed number of registers - the fastest storage in the machine, and there are maybe sixteen of them.

Your program has hundreds of variables and temporaries alive at various moments.

Something has to decide who gets one.
:::

::: remember
**Register allocation** is code generation's central problem. Values that get a register are fast; values that don't get **spilled** to RAM, which is dramatically slower.

Bad allocation decisions cost real, measurable runtime performance on every execution of the program - which is why this is one of the most heavily researched problems in the entire field.
:::

::: analogy
A small desk and a large filing cabinet down the hall. Everything you're working with right now wants to be on the desk. Most of it can't be, so you're constantly deciding what stays within reach and what gets filed.

Choose badly and you spend the day walking.
:::

::: checkpoint
A compiler runs out of registers while generating code for a hot inner loop. What happens?
- ( ) Compilation fails with an error
- (x) Some values are spilled to RAM - correct, but slower, and in a hot loop that cost is paid on every iteration
- ( ) The loop is silently removed
- ( ) The CPU allocates extra registers at runtime
> Spilling. Correctness is never at risk; performance is. And spilling inside a hot loop is exactly where a poor allocation decision hurts most, which is why allocators work hardest there.
:::

::: behind
The classic technique is **graph colouring**. Variables that are live at the same time become nodes joined by an edge in an **interference graph** - they interfere, because they can't share a register.

Allocating registers is then colouring that graph with as many colours as there are registers, so no two connected nodes share one. A hardware-specific engineering problem reduced to a well-studied graph problem - the same graph colouring covered from a pure algorithms angle in this platform's DSA content.
:::

## The Whole Pipeline, End To End

::: flow
Lexical analysis :: Characters become tokens.
Parsing :: Tokens are checked against the grammar and become a tree.
Semantic analysis :: The tree is checked for meaning - declarations, types, assignability.
Intermediate code generation :: The tree is lowered into a simple, uniform, machine-independent IR.
Optimization :: The IR is rewritten into an equivalent, more efficient IR.
Code generation :: The IR becomes actual target instructions - native or bytecode.
:::

::: remember
Six phases, each transforming its input into exactly the form the next one is designed to consume.

Every program you have ever run went through this, from the source someone typed to something a machine could execute.
:::

::: interview
Being able to recite those six phases in order, fluently, is the single most foundational thing to take from this subject. It opens most compiler conversations, and hesitating on it colours everything after.

Then know why register allocation is hard - far more live values than registers - for when the discussion goes deeper.
:::`,
  },
};
