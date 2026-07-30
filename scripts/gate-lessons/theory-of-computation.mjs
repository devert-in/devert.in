// GATE Theory of Computation - authored lesson content. Follows the authoring
// rules documented at the top of general-aptitude.mjs.
//
// status is intentionally absent: scripts/write-gate-lessons.mjs excludes it from
// CONTENT_FIELDS, because publication state belongs to the syllabus seeder, not to
// a lesson body.

export const THEORY_OF_COMPUTATION = {
  "finite-automata-dfa-and-nfa": {
    difficulty: "Moderate",
    estimatedMinutes: 40,
    xpReward: 30, coinReward: 12,
    whatYoullLearn: [
      "What a finite automaton is, and what \"finite memory\" actually costs you",
      "DFA versus NFA - the difference in definition, and why it is not a difference in power",
      "The subset construction, and the 2^n state blow-up it can cause",
      "How to design a DFA by asking what the states must remember",
    ],
    prerequisites: [],
    concept: `## A Machine With No Notebook

::: story
Imagine a machine that reads a string one symbol at a time, left to right, and must answer yes or no at the end.

It has no counter. No stack. No tape to scribble on. The only thing it carries forward is which of a fixed, finite set of **states** it is currently in.

That constraint is the entire subject. Everything a finite automaton can and cannot do follows from it.
:::

::: remember
A state is a summary of everything the machine needs to remember about the input so far.

When you design a DFA, you are not really drawing circles and arrows - you are answering one question: **what are the finitely many situations I could be in?** Get that right and the transitions write themselves.
:::

## The Formal Object

A DFA is a five-tuple (Q, Sigma, delta, q0, F).

::: cards The five components
Q :: A finite set of states.
Sigma :: The input alphabet - the symbols that can appear in a string.
delta :: The transition function. For a DFA, delta maps (state, symbol) to exactly one state.
q0 :: The start state, a single element of Q.
F :: The set of accepting (final) states, a subset of Q.
:::

::: remember
The word **deterministic** lives entirely in delta.

For a DFA, delta(q, a) gives exactly one next state - no more, no fewer - for every state and every symbol. Exactly one. A diagram missing a transition is not a DFA until you add the dead state that catches it.
:::

## Where NFAs Differ

::: cards DFA against NFA
Transitions per (state, symbol) :: DFA has exactly one. NFA may have zero, one, or many.
Epsilon moves :: DFA has none. An NFA may change state without consuming any input.
Acceptance :: DFA follows one path and checks whether it ended in F. An NFA accepts if **at least one** path ends in F.
Ease of design :: NFAs are usually far easier to draw for a given language.
Power :: Identical. Every NFA has an equivalent DFA.
:::

::: mistake
"Nondeterministic" does not mean random, and it does not mean more powerful.

It is a convenience in the definition. Every NFA can be converted to a DFA accepting exactly the same language - so the two define the same class, the regular languages. What nondeterminism buys is a smaller, clearer description, never a larger set of solvable problems.
:::

::: checkpoint
An NFA has 5 states. What is the maximum number of states its equivalent DFA could need?
- ( ) 5
- ( ) 10
- (x) 32
- ( ) Unbounded
> 32. The subset construction makes each DFA state a SUBSET of the NFA's states, and a 5-element set has 2^5 = 32 subsets. The bound is 2^n, it is tight for some languages, and in practice most of those subsets are unreachable - but GATE asks for the worst case.
:::

## Designing One

::: flow
1. Ask what must be remembered :: Not "what does the language look like" but "what distinct situations exist". For "even number of a's", the situations are even-so-far and odd-so-far. Two states.
2. Make each situation a state :: Name them for what they mean, not q0/q1/q2 - it prevents most design errors.
3. Fill in every transition :: Every state, every symbol. A missing transition means a missing dead state.
4. Mark the accepting states :: The situations in which the string read so far is in the language.
:::

::: tip
For "contains substring w" the states count how much of w you have matched so far, and once matched you stay accepting forever.

For "ends with w" you cannot stay - the machine must be able to fall back when the match breaks. That difference between contains and ends-with is one of GATE's favourite small traps.
:::`,
    deepDive: `## The Subset Construction, Concretely

Converting an NFA to a DFA is mechanical. Each DFA state is a **set** of NFA states - "all the places the NFA could currently be".

::: flow
Start state :: The epsilon-closure of the NFA's start state. If there are no epsilon moves, just {q0}.
Transition :: From a set S on symbol a, the new set is the union of delta(q, a) over every q in S, then take the epsilon-closure of that union.
Accepting :: A DFA state is accepting if the set it represents contains ANY accepting NFA state.
Stop :: When no new sets appear. Only reachable subsets get built, which is why the 2^n bound is usually far from reached.
:::

::: behind
The language that genuinely forces the blow-up is "the nth symbol from the END is a 1".

An NFA guesses where that position is and needs about n+1 states. A DFA cannot guess - it must remember the last n symbols exactly, and there are 2^n possible windows. So the exponential is not an artefact of a clumsy construction; it is a real information requirement.
:::

## Epsilon-NFAs

Adding epsilon transitions changes nothing about the power either. Eliminating them is the same closure computation: wherever an epsilon path leads, the transitions available there become available at the origin, and a state becomes accepting if it can reach an accepting state on epsilon alone.

::: cards The equivalence chain worth memorising
Epsilon-NFA :: converts to NFA
NFA :: converts to DFA by subset construction
DFA :: converts to a regular expression by state elimination
Regular expression :: converts to an epsilon-NFA by Thompson's construction
:::

That cycle closes, and its closing is the theorem that all four formalisms define exactly the regular languages.

## Counting States Is A Question Type

GATE asks "the minimum number of states in a DFA accepting L" often enough that it is worth a habit: work out what the machine must distinguish, and each genuinely distinguishable situation is one state.

For "binary numbers divisible by k", the situations are the possible remainders - k states, and that is minimal. For "at least n a's", you need n+1. For "exactly n a's", n+2, because you also need a dead state for having seen too many.`,
    dryRun: `Design a DFA over {a, b} accepting strings with an **even number of a's**.

::: timeline Construction
Ask what must be remembered :: Only the parity of the a-count so far. The b's are irrelevant, and the actual count is irrelevant - only whether it is even or odd.
Name the states :: EVEN (an even number of a's read so far) and ODD. Two states, because there are exactly two situations.
Start state :: EVEN. Before reading anything, zero a's have been seen, and zero is even.
Transitions on a :: EVEN to ODD, and ODD to EVEN. Each a flips the parity.
Transitions on b :: EVEN to EVEN, and ODD to ODD. A b changes nothing that matters.
Accepting states :: {EVEN}. The empty string is accepted, which is correct - it has zero a's.
:::

  delta   |   a      b
  --------+----------------
  ->*EVEN |  ODD    EVEN
    ODD   |  EVEN   ODD

  -> start,  * accepting

Two states, and it is minimal: the strings "" and "a" must be distinguished, since appending nothing accepts one and rejects the other, so one state cannot suffice.

Now notice how little changed for "even a's AND odd b's": the situations are pairs (a-parity, b-parity), so there are 2 x 2 = 4 states. Counting situations scales the design directly.`,
    keyPoints: [
      "A finite automaton's only memory is its current state, and a state is a summary of everything about the input read so far that still matters.",
      "A DFA is (Q, Sigma, delta, q0, F) with delta giving EXACTLY one next state for every (state, symbol) pair - a missing transition means a missing dead state.",
      "An NFA may have zero, one, or many transitions per symbol plus epsilon moves, and accepts if at least one path ends in an accepting state.",
      "Nondeterminism adds no power. DFA, NFA, epsilon-NFA and regular expressions all define exactly the regular languages.",
      "The subset construction makes each DFA state a set of NFA states, giving a worst case of 2^n - tight for languages like \"the nth symbol from the end is a 1\".",
      "Design by asking what distinct situations exist, not by drawing first. For divisibility by k the situations are the k remainders, which is also the minimal state count.",
    ],
    commonMistakes: [
      "Reading \"nondeterministic\" as more powerful or as random. It is a definitional convenience, and DFA and NFA accept exactly the same class of languages.",
      "Drawing a DFA with a missing transition. Every state needs an outgoing edge for every symbol, which usually means adding an explicit dead state.",
      "Confusing \"contains substring w\" (once matched, stay accepting) with \"ends with w\" (the machine must be able to fall back out of acceptance).",
      "Forgetting the epsilon-closure when running the subset construction, which produces a DFA that rejects strings the NFA accepts.",
      "Assuming the DFA equivalent of an n-state NFA always needs 2^n states. That is the worst case; most of the subsets are usually unreachable.",
      "Forgetting that the start state may also be accepting, so the empty string is in the language.",
    ],
    analogies: [
      "A DFA is a person navigating a building with no map and no memory of the route - all they know is which room they are standing in. The room has to encode everything they need, which is exactly why 'what must a state remember' is the right design question.",
      "Nondeterminism is like exploring every branch of a maze simultaneously rather than guessing: you succeed if any one copy of you reaches the exit, which is precisely the 'at least one accepting path' rule.",
    ],
    memoryTricks: [
      "DFA = Definitely one transition. NFA = Numerous (or none) allowed.",
      "Design question: \"what are the distinct situations?\" Each situation is one state.",
      "Divisible by k -> k states, one per remainder. At least n a's -> n+1 states. Exactly n a's -> n+2, the extra one being the dead state.",
      "Subset construction: DFA states are SUBSETS, so the bound is 2^n.",
    ],
    formulas: [
      "DFA = (Q, Sigma, delta, q0, F) with delta: Q x Sigma -> Q (exactly one target).",
      "NFA transition: delta: Q x (Sigma union {epsilon}) -> 2^Q (a set of targets).",
      "Subset construction: an n-state NFA yields a DFA with at most 2^n states.",
      "Minimum DFA states for \"binary value divisible by k\" = k (one per remainder).",
      "Minimum DFA states for \"at least n occurrences of a\" = n + 1; for \"exactly n\" = n + 2.",
      "Minimum DFA states for \"nth symbol from the end is a given value\" = 2^n.",
    ],
    shortcuts: [
      "For a minimum-states question, count the distinct situations the machine must tell apart - that count is the answer, and you rarely need to draw the machine.",
      "To show two strings need different states, find a suffix that one can be completed with into the language and the other cannot.",
      "When asked for the worst-case DFA size of an n-state NFA, answer 2^n without constructing anything.",
    ],
    mcqs: [
      {
        question: "Which statement about DFAs and NFAs is correct?",
        options: [
          "NFAs can recognise strictly more languages than DFAs",
          "They recognise exactly the same class of languages, but an NFA may need exponentially fewer states",
          "DFAs can recognise strictly more languages than NFAs",
          "NFAs can recognise context-free languages",
        ],
        correctIndex: 1,
        explanation: "The subset construction converts any NFA to an equivalent DFA, so the classes are identical - both are the regular languages. The difference is descriptional size: the DFA may need up to 2^n states for an n-state NFA.",
      },
      {
        question: "What is the minimum number of states in a DFA over {0,1} accepting binary strings whose value is divisible by 5?",
        options: ["2", "5", "6", "10"],
        correctIndex: 1,
        explanation: "The only thing the machine must remember is the value read so far modulo 5, which has exactly 5 possible values. Each remainder is one state, and all five are distinguishable, so 5 is both sufficient and minimal.",
      },
      {
        question: "In the subset construction, a DFA state is accepting when the set of NFA states it represents:",
        options: [
          "Contains only accepting NFA states",
          "Contains at least one accepting NFA state",
          "Contains the NFA start state",
          "Is empty",
        ],
        correctIndex: 1,
        explanation: "An NFA accepts if ANY computation path ends in an accepting state, and a subset-construction state records every state the NFA could currently be in - so one accepting member is enough. The empty set is the dead state, and is never accepting.",
      },
    ],
    numericals: [
      {
        question: "An NFA has 6 states. In the worst case, how many states can its equivalent DFA require?",
        answerMin: 64,
        answerMax: 64,
        unit: "states",
        solution: `  Each DFA state is a subset of the NFA's state set.

    Number of subsets of a 6-element set = 2^6 = 64

That includes the empty set, which serves as the dead state. The
bound is tight - languages such as "the 6th symbol from the end is
a 1" genuinely require all of them.`,
      },
      {
        question: "What is the minimum number of states in a DFA over {a,b} accepting strings containing exactly three a's?",
        answerMin: 5,
        answerMax: 5,
        unit: "states",
        solution: `  Situations the machine must distinguish:

    0 a's seen
    1 a  seen
    2 a's seen
    3 a's seen        <- accepting
    4 or more a's     <- dead state, can never accept again

    Total = 5 states

The general rule: "exactly n a's" needs n + 2 states, the extra one
being the dead state. "At least n a's" needs only n + 1, because
there is nothing to reject once the target is reached.`,
      },
    ],
    pyqRelevance: `Finite automata are asked in essentially every GATE CS paper, most often as a minimum-number-of-states question at 1 or 2 marks.

The recurring shapes are: minimum DFA states for a divisibility or counting language, the worst-case DFA size for an n-state NFA (answer 2^n), and identifying which of four given languages a shown automaton accepts.

The counting questions are pure recall of the state-count rules - divisibility by k gives k, at least n gives n+1, exactly n gives n+2, nth-from-the-end gives 2^n. Knowing those four converts a two-minute construction into a ten-second answer, which matters because Theory of Computation is one of the heaviest sections and the time has to come from somewhere.`,
    interviewConnection: `Every regular expression engine, lexer and input validator you have used is a finite automaton underneath - which is why a lexer can scan in one linear pass with constant memory, and why matching balanced brackets with a regex does not work.

The state-design question also transfers directly to modelling: "what are the distinct situations this order/session/connection can be in" is exactly the state-machine reasoning that keeps workflow code from becoming a pile of booleans.`,
    revisionSummary: `A finite automaton's only memory is its current state. Design by asking what distinct situations must be told apart.

DFA = (Q, Sigma, delta, q0, F), delta gives EXACTLY one next state per (state, symbol) - add a dead state for anything missing.

NFA allows zero/one/many transitions plus epsilon moves, and accepts if ANY path ends accepting. Same power as a DFA, often far fewer states.

Subset construction: DFA states are subsets of NFA states, worst case 2^n. Tight for "nth symbol from the end".

State counts: divisible by k -> k. At least n a's -> n+1. Exactly n a's -> n+2. nth from the end -> 2^n.

Equivalence chain: epsilon-NFA -> NFA -> DFA -> regular expression -> epsilon-NFA. All four define the regular languages.`,
    shortNotes: {
      oneMinute: "State = summary of what still matters. DFA: exactly one transition per (state,symbol), add a dead state. NFA: 0/1/many + epsilon, accepts if ANY path accepts - same power, fewer states. Subset construction -> worst case 2^n. Counts: divisible by k -> k; at least n -> n+1; exactly n -> n+2; nth from end -> 2^n.",
    },
  },

  "regular-expressions": {
    difficulty: "Moderate",
    estimatedMinutes: 35,
    xpReward: 30, coinReward: 12,
    whatYoullLearn: [
      "The three operators that generate every regular expression",
      "Why regular expressions and finite automata describe exactly the same languages",
      "Reading an unfamiliar expression by decomposing it, and the identities that simplify one",
    ],
    prerequisites: ["Finite Automata (DFA and NFA)"],
    concept: `## Three Operations And Nothing Else

::: story
A finite automaton describes a language by machine. A regular expression describes the same language by algebra.

And the algebra is astonishingly small: concatenation, union, and star. Everything else you have seen in a programming language's regex library is either shorthand for these three, or a feature that is not regular at all.
:::

::: cards The operators, in precedence order
Star (highest) :: a* means zero or more a's, INCLUDING the empty string. This is the operator that produces infinite languages from finite descriptions.
Concatenation :: ab means an a followed by a b.
Union (lowest) :: a + b (also written a | b) means an a or a b.
:::

::: remember
Precedence is star, then concatenation, then union - which makes \`ab*\` mean "an a followed by zero or more b's", NOT "\\(ab\\) repeated".

For "ab repeated" you need \`(ab)*\`. GATE tests this parenthesisation directly, and the two languages have almost nothing in common.
:::

::: checkpoint
Which strings does \`ab*\` generate?
- ( ) "", "ab", "abab", "ababab"
- (x) "a", "ab", "abb", "abbb"
- ( ) "a", "b", "ab", "ba"
- ( ) Only "ab"
> The second. Star binds tighter than concatenation, so the star applies to b alone - one mandatory a, then any number of b's. The first option is \`(ab)*\`, which is a different language and does contain the empty string.
:::

## The Base Cases Matter

::: cards Three primitives that are easy to confuse
Empty set :: The language with NO strings at all. Nothing matches.
Epsilon :: The language containing exactly ONE string - the empty string. Length zero, but it exists.
A single symbol a :: The language containing exactly the one-character string "a".
:::

::: mistake
The empty set and epsilon are not the same thing, and the difference shows up in concatenation.

Concatenating with the empty set gives the empty set - there is nothing to concatenate with. Concatenating with epsilon changes nothing. It is the difference between multiplying by zero and multiplying by one, and that is exactly the right analogy.
:::

## Reading An Expression You Have Never Seen

::: flow
1. Find the top-level unions :: Split on the + signs that are not inside brackets. Each piece is an independent alternative, so you can read them separately.
2. Within a piece, read left to right :: Concatenation is just sequence.
3. Ask of each star what it can produce :: Including zero copies, which is the case most often forgotten.
4. Test the shortest and longest cases :: What is the shortest string this generates? Can it generate the empty string? Those two checks catch most misreadings.
:::

::: tip
The single most useful question about any regular expression is: **does it generate the empty string?**

It does exactly when every part of it can be skipped - which means all top-level concatenated pieces are starred or nullable. GATE distractor options frequently differ only on whether epsilon is included.
:::

::: interview
Know what is NOT expressible.

\`{a^n b^n}\` is not regular, so no regular expression describes it. Neither is "balanced brackets", nor "the same substring appears twice". If a question offers a regular expression for one of those, it is wrong by construction and you can eliminate it without reading it.

Note that the backreference feature in real programming languages goes beyond regular expressions precisely because it can express repetition of an arbitrary substring - a "regex" with backreferences is not a regular expression in this sense.
:::`,
    deepDive: `## Kleene's Theorem, Both Directions

The reason regular expressions and finite automata are interchangeable is a pair of constructions.

::: cards The two directions
Expression to automaton (Thompson's construction) :: Build a small epsilon-NFA for each primitive, then glue them - union adds a new start branching to both, concatenation links one's accept to the other's start by epsilon, star adds a loop back plus a bypass edge for the zero-copies case.
Automaton to expression (state elimination) :: Remove states one at a time, replacing each removed state by expressions that label the paths through it, until only a start and an accept state remain with a single expression between them.
:::

::: behind
Thompson's construction produces at most 2 states per operator, so the resulting NFA is linear in the size of the expression. Convert that to a DFA and you may get an exponential blow-up - which is exactly why some regular expression engines are fast and others fall over on pathological patterns.
:::

## Identities Worth Recognising

Simplification questions are common, and they are all applications of a handful of identities.

  r + r        = r
  (r*)*        = r*
  epsilon + rr* = r*          (this is r+, one or more)
  (r + s)*     = (r* s*)*
  r(sr)*       = (rs)*r
  empty-set + r = r
  epsilon . r  = r
  empty-set . r = empty-set

::: mistake
\`(r + s)*\` is NOT \`r* + s*\`.

The left side allows interleaving - r's and s's mixed in any order. The right side allows only all-r's or all-s's. Over {a, b}, \`(a+b)*\` is every string, while \`a* + b*\` is only the uniform ones. This is the most commonly asked identity trap in the topic.
:::

## Why Star Includes Zero

\`a*\` contains the empty string, and this is a definition rather than an accident. It makes star the closure operation it needs to be, and it is why \`a*\` and \`a+\` (one or more) are different languages.

Expressed in the three-operator algebra, \`a+\` is written \`aa*\`. Any question that says "one or more" and offers \`a*\` as an option is testing exactly this.`,
    dryRun: `Write a regular expression for: strings over {a, b} that **contain the substring "ab"**.

::: timeline Construction
State the shape :: Any string containing "ab" looks like: some prefix, then "ab", then some suffix.
Describe the prefix :: It can be anything at all, including empty. Over the alphabet {a,b}, "anything" is (a + b)*.
Pin the required part :: The literal substring ab.
Describe the suffix :: Also anything at all, including empty - (a + b)* again.
Combine by concatenation :: (a + b)* ab (a + b)*
:::

Check it against the cases that usually break an expression:

  "ab"      -> prefix empty, suffix empty          accepted
  "aab"     -> prefix "a", then "ab", suffix empty accepted
  "abb"     -> prefix empty, "ab", suffix "b"      accepted
  "ba"      -> no "ab" anywhere                    rejected, correct
  ""        -> no "ab"                             rejected, correct

Now contrast with **ends with "ab"**, which is (a + b)* ab - drop the trailing star. And **begins with "ab"**, which is ab (a + b)*.

Three closely related languages, three expressions differing only in which stars are present. Reading which one a question wants is most of the work.`,
    keyPoints: [
      "Regular expressions are built from exactly three operators - union, concatenation and star - plus the primitives empty-set, epsilon, and single symbols.",
      "Precedence is star, then concatenation, then union. So ab* is \"a followed by zero or more b's\", while (ab)* is \"ab repeated\".",
      "Star always includes ZERO copies, so a* contains the empty string. \"One or more\" must be written aa*.",
      "The empty set and epsilon are different: concatenating with the empty set gives the empty set, concatenating with epsilon changes nothing.",
      "Kleene's theorem: regular expressions and finite automata describe exactly the same languages, via Thompson's construction one way and state elimination the other.",
      "(r + s)* is NOT r* + s* - the left allows interleaving, the right does not. Over {a,b}, (a+b)* is every string while a* + b* is only the uniform ones.",
      "Languages needing unbounded counting or matching - a^n b^n, balanced brackets, a repeated arbitrary substring - have no regular expression at all.",
    ],
    commonMistakes: [
      "Misreading precedence: taking ab* as (ab)* rather than a(b*).",
      "Forgetting that star includes zero copies, and so offering a* where \"one or more\" (aa*) was required.",
      "Treating (r + s)* as equal to r* + s*, which loses every interleaved string.",
      "Confusing the empty set with epsilon - one has no strings, the other has exactly one string of length zero.",
      "Trying to write a regular expression for a^n b^n or for balanced brackets. Neither is regular, so no expression exists.",
      "Assuming programming-language regex features like backreferences are still regular expressions in this formal sense. They are strictly more powerful.",
    ],
    analogies: [
      "The three operators are an algebra in the ordinary sense: union behaves like addition, concatenation like multiplication, the empty set like 0 (absorbing) and epsilon like 1 (neutral). Every identity in the list follows that intuition.",
    ],
    memoryTricks: [
      "Precedence SCU: Star, Concatenation, Union - tightest to loosest, alphabetically descending as a coincidence that makes it stick.",
      "Star means \"zero or more\", and the zero is the half everyone forgets. a+ = aa*.",
      "Empty set is multiply-by-zero; epsilon is multiply-by-one.",
      "Contains w -> stars on BOTH sides. Ends with w -> star on the left only. Begins with w -> star on the right only.",
    ],
    formulas: [
      "Primitives: empty-set (no strings), epsilon (exactly the empty string), a (exactly the string \"a\").",
      "Precedence: star > concatenation > union.",
      "a+ (one or more) = aa*. a* = epsilon + aa*.",
      "Identities: r + r = r; (r*)* = r*; epsilon + rr* = r*; (r+s)* = (r*s*)*; r(sr)* = (rs)*r.",
      "Absorbing and neutral: empty-set + r = r; empty-set . r = empty-set; epsilon . r = r.",
      "Contains w: (a+b)* w (a+b)*. Ends with w: (a+b)* w. Begins with w: w (a+b)*.",
    ],
    shortcuts: [
      "To eliminate options fast, test the empty string and the shortest non-empty string against each expression. That alone usually kills two of four.",
      "If a question's language needs matched counts or arbitrary repetition of a substring, no option can be correct as a regular expression - check the question is really asking what you think.",
      "For \"contains / begins with / ends with\", place the stars by rule rather than deriving the expression each time.",
    ],
    mcqs: [
      {
        question: "Which language does the regular expression (a + b)* a describe over {a, b}?",
        options: [
          "All strings containing at least one a",
          "All strings ending in a",
          "All strings beginning with a",
          "All strings of a's only",
        ],
        correctIndex: 1,
        explanation: "The (a+b)* matches any prefix including the empty one, and the final a is mandatory and last - so the language is exactly the strings ending in a. For \"contains at least one a\" you would need a star on both sides.",
      },
      {
        question: "Which of the following is NOT equal to (a + b)*?",
        options: ["(a*b*)*", "(b + a)*", "a* + b*", "(a* + b*)*"],
        correctIndex: 2,
        explanation: "a* + b* generates only all-a strings or all-b strings, so it misses \"ab\" entirely. The other three all generate every string over {a,b} - union is commutative, and the two starred forms both permit interleaving.",
      },
      {
        question: "Which language has NO regular expression?",
        options: [
          "Strings over {a,b} of even length",
          "Strings of the form a^n b^n for n >= 0",
          "Strings containing the substring aba",
          "Strings whose third symbol is b",
        ],
        correctIndex: 1,
        explanation: "a^n b^n requires remembering an unbounded count to match the b's against the a's, which no finite-state device can do - and it is the standard pumping-lemma example. The other three each need only bounded, finite memory.",
      },
    ],
    pyqRelevance: `Regular expressions appear most years, usually as "which language does this expression describe" or "which of these expressions is equivalent to that one", at 1 or 2 marks.

The equivalence questions are almost always testing one identity, and (r + s)* versus r* + s* is by far the most frequent. The description questions turn on precedence and on whether epsilon is in the language.

A fast, reliable technique for both: test the empty string and one or two short strings against each option. Formal manipulation is rarely necessary and is slower under exam conditions than substituting three concrete strings.`,
    interviewConnection: `Knowing what regular expressions cannot do is the practically useful half. Parsing HTML, matching balanced brackets, or validating nested structures with a regex fails for a structural reason, not because you have not found the right pattern yet.

The other transferable fact is the exponential: Thompson's construction is linear, but the NFA-to-DFA step is not, which is why some engines exhibit catastrophic backtracking on innocent-looking patterns. Recognising a nested-quantifier pattern as a performance risk comes straight from this material.`,
    revisionSummary: `Three operators: union (+), concatenation, star. Precedence star > concatenation > union, so ab* is a(b*), not (ab)*.

Star ALWAYS includes zero copies. a* contains epsilon. One-or-more is aa*.

Empty set (no strings) is not epsilon (one string, of length zero). Empty set absorbs under concatenation; epsilon is neutral.

Kleene's theorem: expressions and automata are interchangeable - Thompson's construction one way, state elimination the other.

Key identity trap: (r + s)* is NOT r* + s*. The left interleaves, the right does not.

Patterns: contains w -> stars both sides; ends with w -> star left only; begins with w -> star right only.

Not expressible: a^n b^n, balanced brackets, a repeated arbitrary substring.`,
    shortNotes: {
      oneMinute: "Union, concatenation, star; precedence star > concat > union, so ab* = a(b*). Star includes ZERO copies; a+ = aa*. Empty set absorbs, epsilon is neutral. (r+s)* is NOT r*+s* (interleaving). Contains w -> stars both sides, ends with -> left star, begins with -> right star. a^n b^n has no regular expression. Test epsilon and short strings to eliminate options.",
    },
  },

  "minimization-of-finite-automata": {
    difficulty: "Moderate",
    estimatedMinutes: 35,
    xpReward: 30, coinReward: 12,
    whatYoullLearn: [
      "What makes two states equivalent, and why that makes the minimal DFA unique",
      "The table-filling (Myhill-Nerode) algorithm, run step by step",
      "Removing unreachable states as the step before minimisation, not part of it",
    ],
    prerequisites: ["Finite Automata (DFA and NFA)"],
    concept: `## Two States That Nothing Can Tell Apart

::: story
Suppose two states of a DFA have this property: starting from either one, exactly the same set of strings leads to acceptance.

Then no input can ever reveal which of the two you are in. The distinction is invisible from the outside, which means it is not a distinction at all - and the two states can be merged.

Minimisation is nothing more than doing that merge everywhere it applies.
:::

::: remember
Two states p and q are **distinguishable** if some string w takes one to an accepting state and the other to a non-accepting state.

If no such w exists, they are **equivalent** and merge. That is the entire criterion, and every minimisation algorithm is just a systematic way of finding which pairs satisfy it.
:::

::: cards Why the result is unique
Equivalence is an equivalence relation :: It partitions the states into classes, and a partition has no ambiguity about it.
Each class becomes one state :: The minimal DFA's states ARE the classes.
So the minimal DFA is unique :: Up to renaming states, there is exactly one. Two people minimising the same DFA correctly must get isomorphic machines.
:::

::: mistake
That uniqueness holds for DFAs only.

Minimal NFAs are not unique, and finding one is a much harder problem. If a question asks for "the minimal automaton", check whether it says DFA - the guarantee does not carry over.
:::

## The Order Of Operations

::: flow
1. Remove unreachable states first :: A state no input can ever reach contributes nothing. Delete it before you start - it is not part of minimisation proper, and leaving it in wastes work and can confuse the table.
2. Mark the obviously distinguishable pairs :: Any pair with one accepting and one non-accepting state is distinguishable, witnessed by the empty string.
3. Propagate :: For each unmarked pair, check where each symbol sends it. If some symbol sends the pair to an already-marked pair, mark it too.
4. Repeat until nothing changes :: The remaining unmarked pairs are equivalent.
5. Merge each class into one state :: Transitions carry over unambiguously, because equivalent states go to equivalent states.
:::

::: checkpoint
In the table-filling algorithm, which pairs are marked in the very first pass?
- ( ) All pairs that share a transition target
- (x) Every pair where exactly one of the two states is accepting
- ( ) Every pair of accepting states
- ( ) All pairs, which are then unmarked
> Pairs split across accepting and non-accepting. The empty string distinguishes them immediately: from one you are already accepting and from the other you are not. Everything marked later is marked because some symbol leads to a pair already marked.
:::

::: tip
The propagation step is where errors happen, and the fix is to be mechanical about it.

For an unmarked pair (p, q) and each symbol a, compute the pair (delta(p,a), delta(q,a)). If THAT pair is marked, mark (p,q). Check every symbol before moving on, and keep sweeping the whole table until a full pass marks nothing new.
:::`,
    deepDive: `## Myhill-Nerode, The Theory Underneath

The table-filling algorithm is an implementation of the **Myhill-Nerode theorem**, which is worth knowing in its own right because it answers questions the pumping lemma cannot.

::: cards What the theorem says
Define an equivalence on strings :: x and y are equivalent if, for every string z, xz is in L exactly when yz is in L. They have the same set of accepted continuations.
The theorem :: L is regular if and only if this relation has FINITELY many equivalence classes.
The count :: The number of classes equals the number of states in the minimal DFA.
:::

::: behind
This is strictly stronger than the pumping lemma, because it goes both ways.

To prove L is not regular, exhibit infinitely many strings that are pairwise distinguishable - for a^n b^n, the strings a^0, a^1, a^2, ... are all pairwise distinguishable, since a^i and a^j with i not equal to j are separated by the continuation b^i. Infinitely many classes, therefore not regular. No adversary game, no case analysis over splits.
:::

## Counting Classes To Get The State Count

Because the class count IS the minimal state count, Myhill-Nerode also answers "how many states does the minimal DFA have" without constructing anything.

For "binary strings divisible by 5", two strings are equivalent exactly when their values agree modulo 5. That gives 5 classes, hence 5 states, and it is a proof of minimality rather than an assertion.

::: mistake
Distinguishing two states requires a string that separates them, and the empty string counts.

A common error is looking only at non-empty continuations and concluding that an accepting and a non-accepting state might be equivalent. They never are - z = epsilon separates them by definition.
:::

## Unreachable Versus Dead

Two different things that both look like states you might want to remove.

::: cards They are not the same
Unreachable state :: No input string reaches it from the start state. Remove it - it cannot affect the language.
Dead state (trap) :: Reachable, but no path from it ever reaches an accepting state. It must STAY in a complete DFA, because delta must be total. Minimisation merges all dead states into one, and that one remains.
:::`,
    dryRun: `Minimise a DFA with states {A, B, C, D, E}, alphabet {0, 1}, start A, accepting {C, D}.

  delta |  0    1
  ------+---------
   ->A  |  B    C
     B  |  A    D
    *C  |  E    C
    *D  |  E    D
     E  |  E    E

::: timeline Table filling
Check reachability :: From A we reach B and C, then D and E. All five are reachable, so nothing is removed.
First pass - accepting versus not :: Mark every pair with exactly one accepting state: (A,C) (A,D) (B,C) (B,D) (C,E) (D,E). Unmarked so far: (A,B) (A,E) (B,E) (C,D).
Propagate on (C,D) :: On 0 both go to E - the pair (E,E) is not a distinguishable pair. On 1, C goes to C and D goes to D, giving (C,D) itself. Nothing marks it, so C and D stay equivalent.
Propagate on (A,B) :: On 0, A goes to B and B goes to A - the pair (A,B) again. On 1, A goes to C and B goes to D, giving (C,D), which is unmarked. Nothing marks (A,B).
Propagate on (A,E) :: On 1, A goes to C and E goes to E. The pair (C,E) is MARKED, so mark (A,E).
Propagate on (B,E) :: On 1, B goes to D and E goes to E. The pair (D,E) is MARKED, so mark (B,E).
Sweep again :: Recheck (A,B) and (C,D) now that (A,E) and (B,E) are marked. Neither pair's transitions land on a newly marked pair, so nothing changes. The algorithm stops.
:::

Equivalence classes: **{A, B}**, **{C, D}**, **{E}**.

  Minimal DFA (write AB for {A,B}, CD for {C,D}):

  delta  |   0     1
  -------+------------
   ->AB  |  AB    CD
    *CD  |   E    CD
     E   |   E     E

Five states became three. Note that E - the dead state - survives: it is reachable, and delta must remain total.`,
    keyPoints: [
      "Two states are equivalent when no string distinguishes them - that is, no input takes one to an accepting state and the other to a non-accepting one.",
      "Equivalence partitions the states into classes, and each class becomes one state of the minimal DFA, which is why the minimal DFA is UNIQUE up to renaming.",
      "That uniqueness is a DFA property. Minimal NFAs are neither unique nor easy to find.",
      "Remove unreachable states BEFORE minimising - it is a separate step, not part of the algorithm.",
      "Table filling: mark accepting/non-accepting pairs first, then repeatedly mark any pair some symbol sends to an already-marked pair, until a full pass changes nothing.",
      "Myhill-Nerode: L is regular iff it has finitely many classes under \"same set of accepted continuations\", and the class count equals the minimal DFA's state count.",
      "A dead state is reachable and must stay in a complete DFA; an unreachable state is deleted. They are different things.",
    ],
    commonMistakes: [
      "Minimising before removing unreachable states, which wastes work and clutters the table.",
      "Stopping the propagation after one pass. You must keep sweeping until a complete pass marks nothing new.",
      "Checking only some symbols when propagating a pair. Every symbol must be checked before the pair is left unmarked.",
      "Deleting the dead state. It is reachable and delta must be total, so it survives minimisation - only unreachable states are removed.",
      "Assuming an accepting and a non-accepting state might be equivalent. The empty string always distinguishes them.",
      "Applying the uniqueness guarantee to NFAs. It holds for DFAs only.",
    ],
    analogies: [
      "Equivalent states are like two API endpoints that return identical responses for every possible request - there is no observation that separates them, so keeping both is redundancy rather than capability.",
    ],
    memoryTricks: [
      "Distinguishable means some string tells them apart. Start with the empty string, which tells accepting apart from non-accepting.",
      "Order: Unreachable out, then Mark, then Propagate, then Merge.",
      "Minimal DFA is unique. Minimal NFA is not.",
      "Myhill-Nerode class count = minimal DFA state count. Counting classes proves minimality rather than asserting it.",
    ],
    formulas: [
      "p and q are distinguishable iff there exists w with exactly one of delta*(p,w) and delta*(q,w) in F.",
      "Table filling: mark (p,q) if exactly one is accepting; then mark (p,q) if (delta(p,a), delta(q,a)) is marked for some a; repeat to fixpoint.",
      "Myhill-Nerode: x ~ y iff for all z, (xz in L) <-> (yz in L). L is regular iff ~ has finitely many classes.",
      "Number of Myhill-Nerode classes = number of states in the minimal DFA.",
    ],
    shortcuts: [
      "For \"how many states in the minimal DFA\", count Myhill-Nerode classes directly instead of building and minimising a machine.",
      "To prove a language is not regular, exhibit an infinite family of pairwise-distinguishable strings - often less work than the pumping lemma and it needs no case analysis.",
      "Remove unreachable states first; on a GATE-sized diagram this frequently removes a state or two and shrinks the table noticeably.",
    ],
    mcqs: [
      {
        question: "Two states p and q of a DFA are equivalent if:",
        options: [
          "They have the same number of outgoing transitions",
          "No string distinguishes them - for every w, delta*(p,w) and delta*(q,w) are both accepting or both non-accepting",
          "They are both accepting states",
          "They have the same incoming transitions",
        ],
        correctIndex: 1,
        explanation: "Equivalence is defined by external observability: if no input can reveal which state you are in, the two are the same state as far as the language is concerned. Transition counts and incoming edges are irrelevant.",
      },
      {
        question: "Which statement about minimal automata is correct?",
        options: [
          "Both minimal DFAs and minimal NFAs are unique",
          "The minimal DFA is unique up to renaming; the minimal NFA is not unique",
          "Neither is unique",
          "The minimal NFA is unique but the minimal DFA is not",
        ],
        correctIndex: 1,
        explanation: "State equivalence partitions a DFA's states, and a partition is uniquely determined - so the minimal DFA is unique up to state names. No corresponding partition argument exists for NFAs, and minimal NFAs are genuinely non-unique.",
      },
      {
        question: "During minimisation, what happens to a reachable dead state (one from which no accepting state is reachable)?",
        options: [
          "It is deleted, like unreachable states",
          "It remains, since delta must be total - though all dead states merge into one",
          "It becomes an accepting state",
          "It causes the algorithm to fail",
        ],
        correctIndex: 1,
        explanation: "A complete DFA needs a transition for every (state, symbol), so something must catch the rejected strings. All dead states are equivalent to each other and merge into a single one, which stays. Only UNREACHABLE states are removed.",
      },
    ],
    numericals: [
      {
        question: "A DFA has 8 states. How many unordered pairs of distinct states does the table-filling algorithm need to consider?",
        answerMin: 28,
        answerMax: 28,
        unit: "pairs",
        solution: `  Unordered pairs of distinct states = 8C2

    8C2 = (8 x 7) / 2 = 28 pairs

This is why the table is drawn as a lower triangle rather than a
full grid - (p,q) and (q,p) are the same pair, and (p,p) is never
distinguishable from itself.`,
      },
      {
        question: "How many states does the minimal DFA accepting binary strings whose value is divisible by 7 have?",
        answerMin: 7,
        answerMax: 7,
        unit: "states",
        solution: `  By Myhill-Nerode, count the equivalence classes.

  Two binary strings are equivalent exactly when their values agree
  modulo 7 - appending the same suffix to both keeps them agreeing,
  and strings with different remainders are separated by some suffix.

    Remainders: 0, 1, 2, 3, 4, 5, 6   ->  7 classes

    Minimal DFA states = 7

Counting classes proves minimality; drawing a 7-state machine only
shows that 7 is achievable.`,
      },
    ],
    pyqRelevance: `Minimisation is asked most often as "how many states does the minimal DFA for this language have" at 1 or 2 marks, and occasionally as a full table-filling exercise on a small given DFA.

For the counting version, Myhill-Nerode is the fast route - count the equivalence classes and you have both the answer and a minimality argument. Constructing and then minimising a machine gets there far more slowly.

Two details GATE probes deliberately: that unreachable states must be removed first and are not the same as dead states, and that the minimal DFA is unique while the minimal NFA is not. Both are one-line facts that decide whole questions.`,
    interviewConnection: `State-machine minimisation is real engineering in hardware design, where each state costs flip-flops and power, and in protocol implementation, where redundant states are redundant code paths to test.

The Myhill-Nerode idea also has a practical shadow: "two situations are the same if nothing downstream can tell them apart" is exactly the argument for collapsing duplicated status enums or near-identical branches, and it is a sharper criterion than "these look similar".`,
    revisionSummary: `Two states are equivalent when NO string distinguishes them. Equivalence partitions the states, each class becomes one state, and so the minimal DFA is UNIQUE up to renaming. Minimal NFAs are not unique.

Procedure: remove unreachable states, mark all accepting/non-accepting pairs, then repeatedly mark any pair some symbol sends to a marked pair, sweeping until nothing changes. Merge the surviving classes.

Dead state (reachable, never accepts) STAYS - delta must be total. Unreachable state is deleted. Different things.

Myhill-Nerode: L is regular iff finitely many classes under "same accepted continuations", and the class count = minimal DFA state count. Use it to get state counts directly, and to prove non-regularity by exhibiting infinitely many pairwise-distinguishable strings.`,
    shortNotes: {
      oneMinute: "Equivalent = no string tells them apart. Remove UNREACHABLE states first (dead states stay - delta must be total). Table filling: mark accepting/non-accepting pairs, then propagate any pair whose successors under some symbol are marked, sweep to fixpoint. Minimal DFA unique, minimal NFA not. Myhill-Nerode class count = minimal state count.",
    },
  },

  "regular-language-properties-and-closure": {
    difficulty: "Moderate",
    estimatedMinutes: 30,
    xpReward: 30, coinReward: 12,
    whatYoullLearn: [
      "Which operations regular languages are closed under, and how each closure is proved",
      "Using closure properties to prove a language is NOT regular, without the pumping lemma",
      "The decision problems that are decidable for regular languages",
    ],
    prerequisites: ["Finite Automata (DFA and NFA)", "Regular Expressions"],
    concept: `## Closure Is A Construction, Not A Claim

::: story
"Regular languages are closed under union" sounds like a property you memorise.

It is actually a construction you could carry out. Given DFAs for L1 and L2, you can build a machine for their union - so the union has a machine, so it is regular. Every closure result in this topic is a machine you could build.
:::

::: cards The closures, and the construction behind each
Union :: Product construction - run both DFAs in parallel on the same input, accept if EITHER is accepting. States are pairs.
Intersection :: The same product construction, accepting only if BOTH are accepting. One word changes in the whole proof.
Complement :: Swap accepting and non-accepting states of a COMPLETE DFA. The machine is otherwise untouched.
Concatenation :: Link L1's accepting states to L2's start by epsilon transitions, giving an NFA.
Kleene star :: Loop the accepting states back to the start by epsilon, plus a new accepting start state for the zero-copies case.
Reversal :: Reverse every transition, swap start and accepting roles. Gives an NFA.
Difference :: L1 minus L2 = L1 intersect complement of L2, so it follows from two closures already established.
Homomorphism and inverse homomorphism :: Both preserve regularity.
:::

::: mistake
The complement construction requires the DFA to be **complete** and **deterministic**.

Swapping the accepting states of an NFA does NOT give the complement - because an NFA accepts when some path accepts, and negating that is not the same as negating each path. Determinise first, complete the transition function, then swap.
:::

::: checkpoint
You have an NFA for L. To build a machine for the complement of L, what must you do first?
- ( ) Swap its accepting and non-accepting states
- (x) Convert it to a complete DFA, then swap accepting and non-accepting states
- ( ) Reverse all its transitions
- ( ) Nothing - regular languages are not closed under complement
> Determinise first. Swapping on an NFA is wrong because NFA acceptance is "some path accepts", and the negation of that is "no path accepts" - which swapping does not compute. Regular languages ARE closed under complement; the construction just needs a DFA.
:::

## Closure As A Proof Technique

::: story
Suppose you want to show that some language L is not regular, and the pumping lemma proof looks painful.

There is often a shortcut. If you can combine L with a language you KNOW is regular, using an operation regular languages are closed under, and land on a language you know is NOT regular - then L cannot have been regular in the first place.
:::

::: flow
The argument shape
Assume L is regular :: For contradiction.
Combine with a known regular language :: Intersect with something simple like a*b*, which is regular.
Closure says the result is regular :: Because regular languages are closed under intersection.
But the result is a known non-regular language :: Such as a^n b^n.
Contradiction :: So L was not regular.
:::

::: tip
Intersecting with a*b* is the workhorse move.

It strips away the messy strings and leaves the clean counting core. If a language is "strings with equal numbers of a's and b's", intersecting with a*b* gives exactly a^n b^n - and one line of closure reasoning replaces an entire pumping-lemma proof.
:::

## What You Can Decide

::: cards Decision problems for regular languages - all decidable
Membership :: Is w in L? Run the DFA on w. Linear time.
Emptiness :: Is L empty? Check whether any accepting state is reachable from the start.
Finiteness :: Is L finite? Check for a cycle on a path between the start and an accepting state - a reachable, productive cycle means infinite.
Equivalence :: Is L1 = L2? Minimise both and check for isomorphism, or test whether the symmetric difference is empty.
:::

::: interview
This decidability is worth remembering as a contrast, because it is exactly what disappears one level up.

For context-free languages, membership and emptiness stay decidable but equivalence becomes undecidable. For Turing machines almost nothing is decidable. GATE asks comparison questions across the hierarchy constantly, and "regular languages decide everything" is the anchor you compare against.
:::`,
    deepDive: `## The Product Construction In Detail

Union and intersection share one machine.

Given DFAs M1 = (Q1, Sigma, delta1, s1, F1) and M2 = (Q2, Sigma, delta2, s2, F2), build M with:

  states       Q1 x Q2                    (pairs)
  start        (s1, s2)
  transition   delta((p,q), a) = (delta1(p,a), delta2(q,a))
  accepting    for union:        F1 x Q2  union  Q1 x F2
               for intersection: F1 x F2

::: behind
Only the accepting set differs. The machine literally runs both automata side by side on the same input, and the acceptance condition decides whether you want "either" or "both".

Which also gives the state count: if M1 has m states and M2 has n, the product has at most m x n. GATE asks for that bound directly.
:::

## Closure Under Reversal, And Why It Gives An NFA

Reversing every transition can create multiple transitions into the same state on the same symbol, and the original single start state becomes a set of accepting states. The result is naturally an NFA, which is fine - NFAs and DFAs have equal power, so the reversal is still regular.

## Homomorphisms

A homomorphism h maps each alphabet symbol to a string, extended to whole strings by concatenation. Regular languages are closed under both h and h-inverse.

::: cards Why both directions matter
Homomorphism :: Substitute in a regular expression - replace each symbol by its image and the result is still a regular expression.
Inverse homomorphism :: Given a DFA for L, build one for h-inverse of L by reading a symbol a and simulating the whole string h(a). Still finite state.
:::

## Closure Is Not Universal

Being closed under an operation is a specific fact, not a general licence. Regular languages happen to be closed under every operation in the standard list, which is unusual - context-free languages, by contrast, are NOT closed under intersection or complement, and that contrast is itself an exam question.`,
    dryRun: `Prove that **L = {w over {a,b} : w has an equal number of a's and b's}** is not regular, using closure rather than the pumping lemma.

::: timeline Proof by closure
Assume L is regular :: For contradiction.
Pick a known regular language :: a*b* - the strings that are some a's followed by some b's. It is regular; a regular expression for it is written down right there.
Intersect :: Regular languages are closed under intersection, so L intersect a*b* must also be regular.
Identify the intersection :: A string in a*b* has all its a's before all its b's. If it also has equal counts, it is exactly a^n b^n. So L intersect a*b* = {a^n b^n : n >= 0}.
Use the known result :: a^n b^n is not regular - the standard pumping-lemma result.
Contradiction :: We derived that a non-regular language is regular. So L is not regular.
:::

Compare the work. The pumping-lemma proof for equal counts requires choosing w carefully and reasoning about where y falls. This proof is five lines, needs no case analysis, and reuses a result you already have.

::: tip
The technique generalises: intersect with something simple enough to strip away the noise, and aim to land on a^n b^n. That target is the one non-regular language you can always cite without re-proving.
:::`,
    keyPoints: [
      "Every closure property is a construction you could actually carry out, not a fact to memorise - union and intersection are the product construction, complement is swapping accepting states of a complete DFA.",
      "Regular languages are closed under union, intersection, complement, concatenation, star, reversal, difference, homomorphism and inverse homomorphism.",
      "Complement requires a COMPLETE, DETERMINISTIC automaton. Swapping accepting states on an NFA does not give the complement.",
      "The product construction on an m-state and an n-state DFA gives at most m x n states, and only the accepting set differs between union and intersection.",
      "Closure is a proof technique: if L intersected with a known regular language yields a known non-regular language, L was not regular.",
      "Intersecting with a*b* to reach a^n b^n is the standard move, and often replaces an entire pumping-lemma proof.",
      "Membership, emptiness, finiteness and equivalence are ALL decidable for regular languages - which is exactly what stops being true higher in the hierarchy.",
    ],
    commonMistakes: [
      "Complementing an NFA by swapping its accepting states. You must determinise and complete the DFA first.",
      "Forgetting to complete the transition function before complementing, so strings that previously died on a missing transition are still rejected.",
      "Assuming closure properties transfer up the hierarchy. Context-free languages are NOT closed under intersection or complement.",
      "Reaching for the pumping lemma when a one-line closure argument would do.",
      "Believing that because L1 union L2 is regular, L1 and L2 must each be regular. The union of a non-regular language and its complement can be everything, which is regular.",
      "Confusing decidability of equivalence for regular languages with the context-free case, where it is undecidable.",
    ],
    analogies: [
      "The product construction is running two validators over the same stream simultaneously and combining their verdicts with AND or OR. Nothing about the input is re-read; the two just keep their own state side by side.",
    ],
    memoryTricks: [
      "Regular languages are closed under EVERYTHING in the standard list. It is the one level of the hierarchy where you do not need to remember exceptions.",
      "Union and intersection are the SAME machine - only the accepting set changes.",
      "Complement needs Complete and Deterministic. Two C's and a D.",
      "Non-regularity by closure: intersect with a*b*, aim at a^n b^n.",
    ],
    formulas: [
      "Product construction: states Q1 x Q2, delta((p,q),a) = (delta1(p,a), delta2(q,a)), start (s1,s2).",
      "Union accepting set: (F1 x Q2) union (Q1 x F2). Intersection accepting set: F1 x F2.",
      "Product state count bound: m x n for m-state and n-state DFAs.",
      "Complement: given a complete DFA, new accepting set = Q minus F.",
      "Difference: L1 - L2 = L1 intersect (complement of L2).",
      "Decidable for regular languages: membership, emptiness, finiteness, equivalence.",
    ],
    shortcuts: [
      "Before starting a pumping-lemma proof, check whether intersecting with a simple regular language lands you on a^n b^n. It usually does, and it is far shorter.",
      "For \"how many states does a DFA for L1 intersect L2 need\", answer with the product bound m x n unless the question asks for the minimum.",
      "In a true/false closure question about context-free languages, the two false ones are almost always intersection and complement.",
    ],
    mcqs: [
      {
        question: "Regular languages are closed under all of the following EXCEPT:",
        options: ["Complement", "Intersection", "None of these - they are closed under all listed operations", "Reversal"],
        correctIndex: 2,
        explanation: "Regular languages are closed under every operation in the standard list, including all three named here. This makes them the most well-behaved level of the Chomsky hierarchy, and the contrast is with context-free languages, which fail closure under intersection and complement.",
      },
      {
        question: "To construct a DFA for the complement of a language given a DFA M, you must:",
        options: [
          "Reverse all transitions in M",
          "Ensure M is complete, then swap accepting and non-accepting states",
          "Swap the start state with an accepting state",
          "Add epsilon transitions from accepting states to the start state",
        ],
        correctIndex: 1,
        explanation: "Completeness matters: if some (state, symbol) pair has no transition, those strings are rejected by falling off the machine, and they would still be rejected after swapping. Complete the DFA with a dead state first, then swap.",
      },
      {
        question: "L1 has a 4-state DFA and L2 has a 5-state DFA. The product construction for L1 intersect L2 gives at most how many states?",
        options: ["9", "20", "16", "25"],
        correctIndex: 1,
        explanation: "Product states are pairs, one component from each machine, so the bound is 4 x 5 = 20. The minimal DFA may of course be smaller, but 20 is what the construction produces.",
      },
    ],
    numericals: [
      {
        question: "L1 is accepted by a DFA with 6 states and L2 by a DFA with 7 states. What is the maximum number of states in the DFA produced by the product construction for L1 union L2?",
        answerMin: 42,
        answerMax: 42,
        unit: "states",
        solution: `  Product construction states = pairs (p, q) with p from M1 and
  q from M2.

    6 x 7 = 42 states

The same bound holds for intersection - the two constructions
differ only in which pairs are accepting, not in how many states
exist.`,
      },
    ],
    pyqRelevance: `Closure properties are a reliable GATE question, usually as "which of the following is regular / which closure fails", at 1 or 2 marks, and frequently as a comparison across the Chomsky hierarchy.

The product-construction state count (m x n) is asked directly. So is the requirement that complementation needs a complete DFA - typically as an option claiming you can complement an NFA by swapping its accepting states.

The most valuable exam habit here is reaching for closure before the pumping lemma. Intersect with a*b*, land on a^n b^n, done - it is shorter, has no case analysis, and is much harder to get wrong under time pressure.`,
    interviewConnection: `The product construction is a real implementation pattern: running two state machines over one input stream and combining their verdicts is how you compose validators, rate limiters or protocol checkers without re-parsing.

The decidability contrast is the more quietly useful part. "Can I automatically check whether these two configurations mean the same thing?" has a yes answer for regular-shaped things and a no answer surprisingly quickly beyond them, which is why tools that compare regex-based rules exist and tools that compare arbitrary program behaviour do not.`,
    revisionSummary: `Regular languages are closed under union, intersection, complement, concatenation, star, reversal, difference, homomorphism and inverse homomorphism - all of them.

Union and intersection use the SAME product construction (states Q1 x Q2, bound m x n); only the accepting set differs.

Complement = swap accepting states of a COMPLETE DETERMINISTIC automaton. Never swap on an NFA.

Proof technique: assume L regular, intersect with a known regular language (usually a*b*), land on a known non-regular language (usually a^n b^n), contradiction. Shorter than the pumping lemma.

All four decision problems - membership, emptiness, finiteness, equivalence - are DECIDABLE for regular languages. Equivalence becomes undecidable for context-free languages, which is the standard contrast.`,
    shortNotes: {
      oneMinute: "Closed under EVERYTHING standard: union, intersection, complement, concat, star, reversal, difference, homomorphism. Union/intersection = product construction, bound m x n, only the accepting set differs. Complement needs a COMPLETE DFA - never swap on an NFA. Non-regularity shortcut: intersect with a*b*, land on a^n b^n. Membership/emptiness/finiteness/equivalence all decidable.",
    },
  },

  "pumping-lemma-for-regular-languages": {
    "xpReward": 25,
    "coinReward": 10,
    "difficulty": "Hard",
    "estimatedMinutes": 40,
    "whatYoullLearn": [
      "The exact statement of the pumping lemma, including all three conditions",
      "Why the lemma can prove a language is NOT regular but can never prove one IS regular",
      "How to run the proof as an adversary game so you never lose track of who chooses what",
      "The standard proof for {a^n b^n} and how to adapt it",
      "Which choices of w make the proof easy versus impossible"
    ],
    "prerequisites": [
      "Finite Automata (DFA and NFA)",
      "Regular Expressions",
      "Regular Language Properties and Closure"
    ],
    "concept": "## The intuition first\n\nA DFA has finitely many states. If it accepts a string longer than its state count, then while reading that string it must have visited some state **twice** - there is nowhere else to go. The path between those two visits is a loop.\n\nAnd a loop can be taken any number of times. Zero times, once, fifty times - the automaton cannot tell the difference, because a DFA has no memory beyond its current state. So every sufficiently long accepted string contains a substring that can be repeated freely while staying in the language.\n\nThat is the pumping lemma. It is the pigeonhole principle applied to states.\n\n## The statement\n\nIf `L` is regular, then there exists a **pumping length** `p >= 1` such that every string `w` in `L` with `|w| >= p` can be written as `w = xyz` satisfying all three of:\n\n::: cards The three conditions\n|xy| <= p :: The split happens within the first p characters. This is the condition that does the real work in proofs.\n|y| >= 1 :: The pumped part is non-empty. Without this the lemma would be trivially true and useless.\nxy^i z is in L for every i >= 0 :: Repeating y any number of times - including deleting it, i = 0 - keeps the string in the language.\n:::\n\n::: remember\nMiss `|xy| <= p` and the proof falls apart. It is what forces `y` to sit inside the region you control, which is how you pin the adversary down.\n:::\n\n## The direction of the implication\n\nThe lemma says *regular implies pumpable*. Proofs use the contrapositive: *not pumpable implies not regular*.\n\n::: mistake\nThe converse is **false**. A non-regular language can still satisfy the pumping lemma. So \"L satisfies the pumping lemma\" proves nothing at all - it does not show L is regular. Every year candidates lose marks asserting the opposite.\n:::\n\nTo actually prove a language *is* regular, build a DFA, an NFA, or a regular expression for it. The pumping lemma is a one-way tool.\n\n## The proof as a game\n\nThinking of it as an adversary game keeps the quantifiers straight. You are trying to prove `L` is not regular; the adversary claims it is.\n\n::: timeline Who picks what\nThe adversary picks p :: You do not get to choose it. Your argument must work for **every** possible p, so treat p as an unknown symbol, never a specific number.\nYou pick w in L with |w| >= p :: Your only free choice, and the whole proof hinges on it. Choose w so that the first p characters are as uniform as possible.\nThe adversary picks the split xyz :: Subject to |xy| <= p and |y| >= 1. You must handle every split they could choose, which is why a uniform prefix helps - it collapses all splits into one case.\nYou pick i :: Choose the i that breaks membership. i = 2 works most often; i = 0 (deleting y) is sometimes cleaner.\n:::\n\nIf you can always win, no DFA exists and `L` is not regular.",
    "deepDive": "## Why a good choice of w collapses the case analysis\n\nTake `L = {a^n b^n | n >= 0}` and the choice `w = a^p b^p`.\n\nBecause `|xy| <= p` and the first `p` symbols of `w` are all `a`, the substring `y` is forced to be `a^k` for some `k >= 1`. There is no case where `y` contains a `b`, and no case where `y` straddles the boundary. One case, not three.\n\nNow pump with `i = 2`: the string becomes `a^(p+k) b^p`. Since `k >= 1`, the count of `a`s no longer equals the count of `b`s, so it is not in `L`. Contradiction.\n\nCompare a **bad** choice like `w = a^p b^p` where you instead tried `w = (ab)^p`. Now the first `p` characters alternate, `y` could be `a`, `b`, `ab`, `ba`, or longer, and you owe a separate argument for each. The proof still works but you have made it several times longer for no reason.\n\n::: tip\nPick w so the first p symbols are a single repeated character. That is the trick behind nearly every pumping-lemma proof in the syllabus.\n:::\n\n## When i = 0 is the better move\n\nFor `L = {a^i b^j | i > j}`, pumping up keeps `i > j` true and proves nothing. Pumping **down** with `i = 0` deletes `a`s and can force `i <= j`, breaking membership. Always ask which direction actually violates the constraint.\n\n## The Myhill-Nerode alternative\n\nWhere the pumping lemma is one-directional, the **Myhill-Nerode theorem** is an exact characterisation: `L` is regular if and only if it has finitely many equivalence classes under the relation \"same set of accepted continuations\". Exhibiting infinitely many pairwise-distinguishable prefixes proves non-regularity, and it often needs less case analysis. It also proves regularity, which the pumping lemma cannot.\n\n::: behind\nThe minimum pumping length is not the same as the minimum number of DFA states, though it is bounded by it. Questions asking for \"the minimum pumping length\" of a small concrete language are asking about the shortest string beyond which every accepted string has a loop, which you find by inspecting the DFA.\n:::",
    "dryRun": "Prove **L = {a^n b^n | n >= 0}** is not regular.\n\n::: timeline Proof\nAssume regular :: Suppose L is regular. Then the pumping lemma applies, so some pumping length p >= 1 exists.\nChoose w :: Let w = a^p b^p. This is in L (equal counts) and |w| = 2p >= p, so it qualifies.\nApply the constraint :: By the lemma, w = xyz with |xy| <= p and |y| >= 1. The first p symbols of w are all a, and xy lies entirely within them, so y consists only of a's: y = a^k with 1 <= k <= p.\nPump :: Take i = 2. Then xy^2 z = a^(p+k) b^p.\nContradict :: Since k >= 1, we have p + k > p, so the number of a's exceeds the number of b's. Therefore xy^2 z is not in L, contradicting condition 3.\nConclude :: No such p exists, so L is not regular. Intuitively: no finite-state machine can count arbitrarily high to match the a's against the b's.\n:::\n\nNotice what was never needed: any specific value of p, and any case analysis over where y sits. Choosing `w = a^p b^p` did both jobs at once.",
    "keyPoints": [
      "The lemma is the pigeonhole principle on DFA states: a long enough accepted string must revisit a state, creating a pumpable loop",
      "All three conditions matter, and |xy| <= p is the one that makes proofs work",
      "Regular implies pumpable. The converse is false - satisfying the lemma proves nothing",
      "The adversary chooses p and the split; you choose only w and i",
      "Choose w so its first p symbols are one repeated character, collapsing the case analysis to a single case",
      "i = 0 (pumping down) is the right move when pumping up preserves the constraint",
      "Myhill-Nerode is the two-directional alternative and can prove regularity as well as non-regularity"
    ],
    "commonMistakes": [
      "Claiming a language is regular because it satisfies the pumping lemma - the lemma cannot show this",
      "Fixing p to a concrete number such as 3. The argument must hold for every p, so p stays symbolic",
      "Choosing w whose first p characters are mixed, creating avoidable case analysis",
      "Forgetting that i = 0 is permitted, and so missing the only pumping direction that breaks the language",
      "Dropping the |xy| <= p condition and then allowing y to sit anywhere in the string",
      "Treating y as something you get to choose - the adversary picks the split, so you must beat all legal splits"
    ],
    "analogies": [
      "A DFA reading a long string is a commuter on a metro with finitely many stations: travel long enough and you must pass through some station twice, and the loop between those two visits can be ridden any number of times without anyone noticing"
    ],
    "memoryTricks": [
      "'They pick p, you pick w, they pick the split, you pick i' - alternating turns, and you get the last word",
      "The three conditions in order: Prefix bound (|xy| <= p), Non-empty (|y| >= 1), Pump (xy^i z in L)",
      "One-way street: pumping lemma disproves regularity only. To prove regularity, build a machine"
    ],
    "formulas": [
      "L regular implies there exists p >= 1 such that for all w in L with |w| >= p, w = xyz with |xy| <= p, |y| >= 1, and xy^i z in L for all i >= 0",
      "Contrapositive used in proofs: if no such p exists, L is not regular"
    ],
    "shortcuts": [
      "For languages built on a count comparison (a^n b^n, equal counts, palindromes), w = a^p b^p or w = a^p almost always works immediately",
      "If pumping up preserves the property, try i = 0 before rewriting the whole proof",
      "For 'is this language regular' multiple choice, first check whether it needs unbounded counting or arbitrary-depth matching - if so it is not regular and you can skip the formal proof"
    ],
    "pyqRelevance": "Theory of Computation is one of the heaviest sections at around 9 marks, and the pumping lemma sits behind most 'which of these languages is regular' questions even when it is never named. Two recurring shapes: identify the non-regular language from a list, and identify which statement about the lemma is true - where the answer is almost always the one noting that the lemma is necessary but not sufficient.",
    "interviewConnection": "Not asked directly, but the underlying instinct - recognising that a problem needs unbounded memory and so cannot be solved by a fixed-size state machine - is exactly the reasoning behind choosing a stack-based parser over a regex for nested structures. 'Why can't I parse HTML with a regular expression?' is the pumping lemma in interview clothing.",
    "revisionSummary": "Regular implies pumpable, never the reverse. The adversary picks p and the split xyz with |xy| <= p and |y| >= 1; you pick w and i. Choose w with a uniform first p characters so y is forced, then pump to break the language. To prove regularity instead, build a DFA or use Myhill-Nerode.",
    "shortNotes": {
      "fiveMinute": "**Why it is true.** A DFA has finitely many states, so any accepted string longer than the state count must revisit a state. The path between those visits is a loop that can be repeated freely.\n\n**Statement.** If L is regular, there is a pumping length p >= 1 such that every w in L with |w| >= p splits as w = xyz where (1) |xy| <= p, (2) |y| >= 1, (3) xy^i z is in L for all i >= 0.\n\n**Direction.** Regular implies pumpable. The converse is FALSE - satisfying the lemma does not make a language regular.\n\n**Method.** Adversary picks p, you pick w, adversary picks the split, you pick i. Choose w so its first p symbols are one repeated character; then |xy| <= p forces y into that block and the case analysis collapses. Pump with i = 2, or i = 0 when pumping up would preserve the constraint.\n\n**Canonical proof.** L = {a^n b^n}. Take w = a^p b^p. y must be a^k with k >= 1. Then xy^2 z = a^(p+k) b^p has unequal counts, so it is not in L. Contradiction.",
      "oneMinute": "Pigeonhole on DFA states. Regular implies pumpable, never the reverse. They pick p and the split (|xy| <= p, |y| >= 1); you pick w and i. Pick w with a uniform first p symbols to force y, then pump i = 2 (or i = 0) to break membership.",
      "nightBefore": "The lemma disproves regularity only - it never proves it. |xy| <= p is the condition that does the work. w = a^p b^p is the go-to string. i = 0 is legal and sometimes the only thing that works."
    },
    "mcqs": [
      {
        "question": "Which statement about the pumping lemma for regular languages is correct?",
        "options": [
          "If L satisfies the pumping lemma then L is regular",
          "If L is regular then L satisfies the pumping lemma",
          "L satisfies the pumping lemma if and only if L is regular",
          "The lemma applies only to finite languages"
        ],
        "correctIndex": 1,
        "explanation": "The lemma is a necessary condition, not a sufficient one. Regular implies pumpable; non-regular languages can also happen to be pumpable, so the converse and the biconditional are both false."
      },
      {
        "question": "In the decomposition w = xyz, which condition forces y to lie within the first p characters of w?",
        "options": [
          "|y| >= 1",
          "|xy| <= p",
          "|z| >= 0",
          "xy^i z is in L for all i >= 0"
        ],
        "correctIndex": 1,
        "explanation": "|xy| <= p bounds where the split can occur, so y must sit inside the first p symbols. This is what lets a well-chosen w force y's composition."
      },
      {
        "question": "While proving a language non-regular, who chooses the pumping length p?",
        "options": [
          "You do, and you may pick any convenient value",
          "The adversary does, so the proof must hold for every p",
          "It is always equal to the number of DFA states",
          "It is always 1"
        ],
        "correctIndex": 1,
        "explanation": "p is given, not chosen by you. Fixing it to a specific number invalidates the proof, since the lemma only claims that some p exists."
      },
      {
        "question": "Why is w = a^p b^p a better choice than w = (ab)^p when proving {a^n b^n} is not regular?",
        "options": [
          "It is shorter",
          "Its first p symbols are all a, so y is forced to be a block of a's and only one case need be handled",
          "It is the only string of length >= p in the language",
          "(ab)^p is not in the language"
        ],
        "correctIndex": 1,
        "explanation": "With a uniform prefix, |xy| <= p forces y = a^k and the case analysis collapses to a single case. A mixed prefix would require separate arguments for each possible y."
      },
      {
        "question": "For L = {a^i b^j | i > j}, which value of i in xy^i z is most useful?",
        "options": [
          "i = 2, since adding a's is always fruitful",
          "i = 0, since deleting a's can force i <= j",
          "Any i > 2",
          "The lemma cannot be applied to this language"
        ],
        "correctIndex": 1,
        "explanation": "Pumping up adds a's and keeps i > j true, proving nothing. Pumping down with i = 0 removes a's and can violate i > j, which is what produces the contradiction."
      }
    ],
    "numericals": [
      {
        "question": "A DFA has 5 states. According to the pigeonhole argument behind the pumping lemma, what is the smallest string length at which an accepted string is guaranteed to have revisited a state?",
        "answerMin": 5,
        "answerMax": 5,
        "unit": "symbols",
        "solution": "Reading a string of length n visits n + 1 states. With 5 states, a string of length **5** visits 6 states, so by pigeonhole at least one state repeats. Length 4 visits only 5 states, which can all be distinct."
      },
      {
        "question": "Given the pumping lemma conditions with p = 7 and a chosen string w = a^7 b^7, what is the maximum possible value of |y|?",
        "answerMin": 7,
        "answerMax": 7,
        "unit": "symbols",
        "solution": "The constraint is |xy| <= p = 7. The largest y occurs when x is empty, giving |y| = **7**. Combined with |y| >= 1, y = a^k for 1 <= k <= 7."
      }
    ]
  }
};
