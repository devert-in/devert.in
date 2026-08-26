// Theory of Computation - rewritten lesson bodies. See operating-systems.mjs
// for the authoring rules. This subject is the one most likely to be dismissed
// as academic, so every lesson names the real tool it explains - regex engines,
// compiler parsers, linters, why we accept approximate answers. That bridge is
// the point rather than a nicety.

export const THEORY_OF_COMPUTATION = {
  "introduction": {
    concept: `## A Different Kind Of Question

::: story
Every other subject here teaches you to build something. Write the algorithm, design the schema, configure the server.

This one asks what is *possible* to build at all - and it turns out some things provably aren't, no matter how good you get or how fast hardware becomes.
:::

::: cards Three questions, three lessons ahead
What can be computed? :: Some problems have no algorithm and never will. Decidability.
How efficiently? :: Some problems have algorithms that would outlast the universe. Complexity classes.
With what machine? :: Simpler machines recognise simpler patterns. The automata hierarchy.
:::

## Why This Isn't Academic

::: story
Three things you have already used are this subject in disguise.

Every regular expression you have written was compiled into a finite automaton. Every compiler that told you about a missing brace was running a pushdown automaton. Every linter that couldn't promise your loop terminates was bumping into the Halting Problem.
:::

::: remember
And there's a fourth, more valuable use: knowing when to stop.

If a problem is provably undecidable, no amount of effort produces a general solution. Recognising that saves weeks of searching for something that cannot exist - which is a practical skill, not a philosophical one.
:::

::: checkpoint
Why would knowing a problem is undecidable be useful on the job?
- ( ) It proves the requirement is badly written
- (x) It tells you to stop looking for a general algorithm and pursue heuristics or a narrower scope instead
- ( ) It means the problem is unimportant
- ( ) It doesn't have practical use
> Redirecting effort. "Perfect general solution" becomes "good heuristic for the common cases", which is a different project with a real chance of shipping.
:::

::: behind
The subject's structure mirrors the field's own history. Turing and Church asked what was computable at all in the 1930s; the P versus NP question about efficiency arrived in the 1970s.

Possible first, practical second - a sequence that recurs across computing, and one worth noticing when a new capability appears and everyone immediately asks whether it can be made cheap.
:::`,
  },

  "finite-automata": {
    concept: `## The Simplest Machine That Computes

::: story
A turnstile has two states: locked and unlocked. A coin unlocks it; passing through locks it again.

That's a complete computational model - fixed states, transitions on input, nothing else. Formalise it and you have a **finite automaton**.
:::

It reads input one symbol at a time, moves between a finite set of states, and accepts or rejects depending on where it ends up.

::: cards Two flavours
DFA - deterministic :: Exactly one transition per state-symbol pair. No ambiguity, ever.
NFA - non-deterministic :: A symbol may lead to several possible states, or none. Accepts if *any* path leads to acceptance.
:::

::: mistake
Non-deterministic doesn't mean random. An NFA doesn't roll dice.

Think of it as exploring all possible paths simultaneously and accepting if any one succeeds. Unpredictability is not part of the model - the behaviour is fully determined, just branching.
:::

## They're Equally Powerful

::: story
NFAs look strictly more capable, and they aren't. Every NFA can be converted mechanically into a DFA accepting exactly the same language.

The construction is direct: each DFA state represents a *set* of NFA states the machine might currently be in. Track the set, and the branching disappears.
:::

::: remember
So non-determinism buys convenience, not capability.

An NFA is frequently far easier to design by hand. A machine can convert it to a DFA for efficient execution. Same expressive power, different ergonomics - which is why both are taught.
:::

::: checkpoint
An NFA with 10 states is converted to a DFA. How many states might the DFA need, worst case?
- ( ) 10
- ( ) 20
- (x) Up to 2^10 = 1024
- ( ) Unbounded
> Each DFA state is one possible *subset* of NFA states, so 2^n in the worst case. Rare for real patterns, and it's exactly why some regex engines simulate the NFA directly rather than converting up front.
:::

::: behind
That exponential blow-up has a practical consequence you may have hit.

Certain regex patterns - nested quantifiers like \`(a+)+b\` - cause catastrophic backtracking, taking exponential time on short input. It's the same state explosion, arriving as a performance bug rather than a theorem.

Which is why the class of vulnerability called ReDoS exists: a regex on user input becoming a denial-of-service.
:::`,
  },

  "regular-expressions-languages": {
    concept: `## Two Notations, One Class

::: story
A **regular expression** in the formal sense uses exactly three operations: concatenation, alternation, and Kleene star - zero or more repetitions.

That's it. And a foundational theorem says regular expressions and finite automata are provably equivalent: each converts mechanically into the other.
:::

They're two notations for the same class of languages, called the **regular languages**. One is convenient to write; the other is convenient to execute.

## What They Cannot Do

::: story
Consider strings of the form 0ⁿ1ⁿ - some number of zeros, then *exactly* the same number of ones.

No finite automaton can recognise this. To verify the counts match it would need to remember how many zeros it saw, and that number is unbounded, while its states are finite.

You cannot store an unbounded count in a fixed number of states. That's the whole limitation, and it's absolute.
:::

::: remember
Which is the practical reason regex cannot match balanced parentheses.

Nesting requires counting depth, without bound. Every attempt to write a regex for balanced brackets fails on sufficiently deep nesting - and this is a theorem about the model rather than a gap in anyone's cleverness.
:::

::: checkpoint
Why can't a finite automaton recognise 0ⁿ1ⁿ?
- ( ) The strings are too long
- (x) It would need to store an unbounded count using a finite number of states
- ( ) Zeros and ones are indistinguishable to it
- ( ) It can, with enough states
> Finite memory versus unbounded counting. And "with enough states" fails for the same reason: any *specific* number of states is beaten by a longer input.
:::

::: remember
The **Pumping Lemma** is the formal tool for proving a language isn't regular.

Its logic: in any regular language, a sufficiently long string can be split into three parts where the middle can be repeated any number of times and stay in the language. Show no such split is possible, and the language cannot be regular.

Which converts an intuition - "it can't count" - into a proof.
:::

::: behind
That equivalence is not decoration; it's how regex engines are built.

Your pattern is compiled - via Thompson's construction - into an NFA, which is then simulated or converted to a DFA and run against the text.

Every regex feature in every language ships on top of this theorem.
:::`,
  },

  "pushdown-automata-context-free-grammars": {
    concept: `## Add One Stack

::: story
A finite automaton can't count. Give it a stack and it can.

Push a marker for every 0. Pop one for every 1. Accept if the stack is empty at the end. The stack holds the unbounded count that finite states couldn't.

One addition, and 0ⁿ1ⁿ becomes recognisable.
:::

A **pushdown automaton** is a finite automaton plus an unbounded stack - and that single extension moves it to a strictly larger class of languages.

## Grammars, Same Class

::: story
A **context-free grammar** describes a language by production rules rather than a machine:

  S -> 0 S 1 | ε

Read it as: S becomes either "0, then another S, then 1", or nothing. Applying it repeatedly generates exactly 0ⁿ1ⁿ.

  S -> 0S1 -> 00S11 -> 0011
:::

::: remember
And mirroring the previous lesson exactly: CFGs and pushdown automata are provably equivalent, describing the **context-free languages** - strictly larger than the regular languages.

Grammar to write, machine to execute. The same pairing as regex and finite automata, one level up.
:::

::: checkpoint
Why does a compiler need a parser distinct from its tokeniser?
- ( ) Tokenising is too slow for whole files
- (x) Nested syntax - brackets, blocks - is context-free rather than regular, so it needs a stack
- ( ) Parsers handle error messages
- ( ) They're the same phase in practice
> Tokenising splits text into words, which is a regular-language job. Recognising that braces balance and blocks nest requires the stack a PDA has - which is exactly why the two phases are separate.
:::

::: remember
This is the theoretical justification for a compiler's structure.

Lexical analysis is regular - identifiers, numbers, operators. Parsing is context-free - nesting and matching. Two phases because they sit at two levels of this hierarchy, not because of engineering convention.
:::

::: behind
Some grammars are **ambiguous** - one string derivable by two structurally different parse trees.

The classic case is the dangling else: \`if A if B X else Y\` can attach the else to either if. Both parses are valid, and they mean different things.

Which is why real language grammars are deliberately restricted - to LL or LR subclasses - so that every valid program has exactly one parse.
:::`,
  },

  "turing-machines": {
    concept: `## An Infinite Tape

::: story
A stack is unbounded and can only be touched at the top. Replace it with an infinite tape and a head that moves freely in both directions, reading and writing.

That's a **Turing machine**, and it's the most powerful model in this subject.
:::

::: remember
The power comes from the memory, not the instructions.

A Turing machine's instruction set is deliberately trivial: read, write, move left, move right, change state. Nothing clever. What it has is unbounded memory it can navigate freely - which is strictly more than a stack, where you can only reach the top.
:::

## The Church-Turing Thesis

::: story
The claim: anything computable by any mechanical procedure at all can be computed by some Turing machine.

Not a theorem - it can't be proved, because it's a claim about the informal notion of "computable" rather than a mathematical statement. It's held up for ninety years against every alternative model anyone has proposed, all of which turned out to be equivalent or weaker.
:::

::: remember
Which is why "Turing-computable" became the *definition* of computable in computer science. The informal idea was replaced by a formal one that matches it.

And it's why every general-purpose language is **Turing-complete**: Python, Java, C and Haskell compute exactly the same class of things. Their differences are ergonomics, performance and ecosystem - not capability.
:::

::: checkpoint
If all general-purpose languages are equally powerful, why do they differ?
- ( ) They don't - the differences are marketing
- (x) Equal computational power says nothing about how easy, fast or safe expressing a program is
- ( ) Some are Turing-complete and others aren't
- ( ) Only compiled languages are Turing-complete
> Equivalent capability, wildly different experience. "Can express it in principle" and "can express it clearly in an afternoon" are unrelated properties - which is the whole reason language design continues.
:::

::: didyouknow
Turing-completeness turns up in places nobody intended. Conway's Game of Life is Turing-complete. So are Magic: The Gathering, PowerPoint animations, and the x86 MMU.

Which suggests the threshold is low: unbounded memory plus conditional branching is close to sufficient, and systems cross it by accident.
:::

::: behind
A **Universal Turing Machine** is one machine that simulates any other, given a description of it on its own tape.

That's the stored-program computer, described in 1936 - a single machine running programs supplied as data, rather than hardware rebuilt per task.

Every computer you have used is this idea, and it was a theorem before it was a device.
:::`,
  },

  "decidability-the-halting-problem": {
    concept: `## Some Things Have No Algorithm

::: story
A problem is **decidable** if some algorithm always halts with the correct yes-or-no answer, for every input.

**Undecidable** means no such algorithm exists. Not undiscovered - proven impossible, permanently, for any algorithm anyone could ever write.
:::

## The Halting Problem

Given a program and its input, will it eventually halt, or run forever?

::: story
Suppose \`HALTS(program, input)\` existed and always answered correctly.

Build this:

  P(x):
    if HALTS(x, x) says "halts":  loop forever
    else:                          halt

Now ask: does \`P(P)\` halt?

If HALTS says it halts, P loops - so HALTS was wrong. If HALTS says it loops, P halts - so HALTS was wrong.

Either answer is false. So \`HALTS\` cannot exist.
:::

::: remember
That's **diagonalisation**, and it's the same technique Cantor used to prove the reals are uncountable and Gödel used for incompleteness.

Construct something that asks the oracle about itself and then contradicts the answer. The oracle's existence is what makes the contradiction possible - so it doesn't exist.
:::

::: checkpoint
A linter warns about some infinite loops. Does that contradict the Halting Problem?
- ( ) Yes - it solves the problem in practice
- (x) No - it catches specific recognisable patterns, and cannot be correct for every possible program
- ( ) Yes, for simple programs
- ( ) Linters don't detect loops
> Partial detection is fine. Undecidability rules out a *complete and always-correct* detector - which is why static analysers are honest about false negatives, and why they must be.
:::

::: remember
The practical payoff: recognising that a problem reduces to the Halting Problem tells you to stop.

Perfect dead-code elimination, deciding whether two programs are equivalent, proving arbitrary code terminates - all undecidable. Which means the goal changes from "solve it" to "handle the common cases and be clear about what you miss".
:::

::: behind
**Reduction** is how other problems are proven undecidable without a fresh diagonalisation each time.

Show that solving problem X would let you solve the Halting Problem, and X must be undecidable too - since the Halting Problem isn't solvable.

Most of the undecidable results in computing were established this way, borrowing one impossibility to establish another.
:::`,
  },

  "complexity-classes-p-vs-np": {
    concept: `## Possible, But Not Practical

::: story
The last lesson asked whether a problem can be solved at all. This one assumes it can, and asks whether you'll live to see the answer.

An algorithm that takes 2ⁿ steps is a real algorithm. At n = 100 it will not finish before the sun goes out.
:::

::: cards Two classes
P :: Solvable in polynomial time - O(n), O(n²), O(n³). Practically tractable.
NP :: A proposed solution can be *verified* in polynomial time, even if finding one might take far longer.
:::

::: story
A jigsaw is the intuition. Checking whether an assembled puzzle is correct takes a glance. Assembling it takes considerably longer.

Verification and discovery are different tasks, and they can have wildly different costs.
:::

::: remember
Every problem in P is in NP - if you can solve it quickly you can verify quickly, by solving it.

Whether NP is *strictly larger* is the open question: are there problems easy to check and genuinely hard to solve?
:::

## P Versus NP

::: story
Most computer scientists believe P ≠ NP. Nobody has proved it either way, and there's a million-dollar Clay prize outstanding.

If P = NP, an enormous amount would collapse: most modern cryptography assumes certain problems are hard to solve and easy to verify. That assumption is what secures the internet.
:::

::: cards NP-Complete
The hardest problems in NP :: A polynomial-time algorithm for any single one would give you one for every problem in NP.
Established by reduction :: Every NP problem can be transformed into any NP-Complete problem, so they all stand or fall together.
Examples :: Travelling Salesman, graph colouring, boolean satisfiability, knapsack.
:::

::: checkpoint
Your routing problem turns out to be NP-Complete. What follows?
- ( ) It's unsolvable
- (x) No efficient exact algorithm is likely to exist, so use approximation or heuristics
- ( ) It needs faster hardware
- ( ) The problem is badly specified
> Redirect the effort. Exact solutions remain fine for small inputs; production wants a good-enough answer quickly - and NP-Completeness is the justification for choosing that, rather than a concession.
:::

::: remember
Which is the same lesson as undecidability, one level down.

Undecidable: stop looking for any algorithm. NP-Complete: stop looking for an *efficient exact* algorithm. Both convert an open-ended search into a decision about what to build instead.
:::

::: behind
The hierarchy continues: P ⊆ NP ⊆ PSPACE ⊆ EXPTIME, where PSPACE is polynomial *memory* regardless of time.

P is proven strictly smaller than EXPTIME, so at least one of those inclusions is strict. Which one, nobody knows - including the famous one.
:::`,
  },

  "interview-questions": {
    concept: `## Theory, With The Consequence Attached

::: story
This subject has a reputation problem in interviews. Answered as pure theory it sounds memorised; answered with its consequence it sounds like understanding.

The difference is one extra sentence, and it's the sentence that matters.
:::

## The Answer Shape

::: timeline
State it precisely :: The definition, the theorem, the condition.
Give the standard example :: 0ⁿ1ⁿ. The self-referential program. Travelling Salesman.
Name the real consequence :: The regex engine, the compiler phase, the linter's limits, the approximation algorithm.
:::

::: reveal What the consequence sentence adds
Asked why regex can't match balanced parentheses, an adequate answer says regular languages can't count.

A strong one finishes the thought:

"Which is why a compiler has a separate parsing phase rather than tokenising everything with regex. Nesting needs a stack, so the parser is a pushdown automaton - and it's also why every 'regex for balanced brackets' answer online fails at sufficient depth.

It's a limit of the model, not of the pattern you wrote."

The theory was identical. The second answer demonstrates it's load-bearing.
:::

::: cards The four to have cold
DFA vs NFA :: The difference, and that they're provably equivalent - non-determinism is convenience, not power.
A non-regular language :: 0ⁿ1ⁿ, and why finite states can't hold an unbounded count.
The Halting Problem :: The statement, the diagonalisation sketch, and that partial detectors don't contradict it.
P vs NP :: Solvable versus verifiable, one named NP-Complete problem, and what the classification tells you to do.
:::

::: checkpoint
Asked what undecidability means practically, which answer is stronger?
- ( ) "It means the problem cannot be solved"
- (x) "No algorithm is correct for every input - so tools handle common cases and are explicit about what they miss, like a linter that can't guarantee termination"
- ( ) "It means the problem is theoretical"
- ( ) "It means we need better algorithms"
> The second names a tool you've used and the limitation you've experienced. Which is what makes it memorable rather than recited.
:::

::: mistake
The other stumble is not having 0ⁿ1ⁿ ready.

"Some languages aren't regular" is a claim. 0ⁿ1ⁿ with the finite-states-can't-count reason is an argument, and it takes fifteen seconds - so there's no reason to arrive without it.
:::

::: behind
At a deeper level, the **Chomsky Hierarchy** lines up exactly with this subject's machines.

Regular grammars to finite automata. Context-free to pushdown automata. Unrestricted to Turing machines. Each grammar class corresponds precisely to one machine class.

Which is a satisfying way to close the subject: the notations and the machines were never separate topics, and each level up buys exactly one new capability.
:::`,
  },
};
