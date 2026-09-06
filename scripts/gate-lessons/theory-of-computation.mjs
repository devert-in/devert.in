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
    // Verified real (title confirmed via direct fetch, 2026-08-13).
    resources: [{
      kind: "video",
      title: "Introduction to Finite Automata - Neso Academy",
      url: "https://www.youtube.com/watch?v=k3AP20v1yBw",
      description: "Whole video covers this topic from the start.",
    }],
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
    // Verified real (title confirmed via direct fetch, 2026-08-13).
    resources: [{
      kind: "video",
      title: "Theory of Computation 01 | Regular Expressions and Regular Languages | GATE 2024",
      url: "https://www.youtube.com/watch?v=tDZtcw3RA1E",
      description: "Whole video covers this topic from the start.",
    }],
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
    // Verified real (title confirmed via direct fetch, 2026-08-13).
    resources: [{
      kind: "video",
      title: "Minimization of Deterministic Finite Automata (DFA) - Neso Academy",
      url: "https://www.youtube.com/watch?v=hOzc4BUIXRk",
      description: "Whole video covers this topic from the start.",
    }],
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
    // Verified via YouTube oEmbed (2026-08-29) - real, publicly viewable.
    resources: [{
      kind: "video",
      title: "Lec-34: Closure properties of regular languages in TOC",
      url: "https://www.youtube.com/watch?v=2k8r4HGdxBw",
      description: "Gate Smashers lecture on closure properties (union, intersection, concatenation, star, complement) of regular languages.",
    }],
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
    // Verified real (title confirmed via direct fetch, 2026-08-13).
    "resources": [{
      "kind": "video",
      "title": "Pumping Lemma (For Regular Languages) - Neso Academy",
      "url": "https://www.youtube.com/watch?v=dikEDuepOtI",
      "description": "Whole video covers this topic from the start.",
    }],
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
  },

  // ---------------- Context-Free Languages ----------------

  "context-free-grammars": {
    difficulty: "Moderate",
    estimatedMinutes: 40,
    xpReward: 30, coinReward: 12,
    // Verified real (title confirmed via direct fetch, 2026-08-13).
    resources: [{
      kind: "video",
      title: "Context Free Grammar & Context Free Language",
      url: "https://www.youtube.com/watch?v=5_tfVe7ED3g",
      description: "Whole video covers this topic from the start.",
    }],
    whatYoullLearn: [
      "What a grammar generates, as opposed to what an automaton accepts",
      "Derivations, parse trees, and why leftmost/rightmost derivations matter",
      "Ambiguity - what it means, why it is a property of the GRAMMAR, and when it is inherent to the language",
      "Chomsky Normal Form, and the exact production count CNF forces",
    ],
    prerequisites: ["Pumping Lemma for Regular Languages"],
    concept: `## Generating Instead of Recognising

::: story
Every machine so far has been a **recogniser**: hand it a string, it says yes or no.

A grammar works the other way round. It **generates**. Start from one symbol and rewrite, over and over, until nothing is left but terminals. The language is everything you can possibly produce.

Two opposite directions, and for context-free languages they land in exactly the same place.
:::

::: cards The four parts of a CFG
V :: Variables (non-terminals). Symbols that must still be rewritten. Conventionally uppercase.
T :: Terminals. The alphabet of the actual strings. Nothing rewrites these.
P :: Productions, each of the form A -> alpha, where A is a SINGLE variable and alpha is any string of variables and terminals.
S :: The start variable.
:::

::: remember
"Context-free" is a statement about the left-hand side.

Every production has **exactly one variable** on the left. So A -> alpha applies wherever A appears, regardless of what surrounds it - no context is consulted. That single restriction is what separates Type 2 from Type 1 in the Chomsky hierarchy.
:::

## The Language Finite Automata Could Not Do

::: story
Recall the one that broke every DFA: L = { a^n b^n : n >= 0 }. Unbounded counting, finite memory, impossible.

Here it is as a grammar:

  S -> aSb | epsilon

Two productions. Each application of the first adds one \`a\` on the left and one \`b\` on the right **simultaneously**, so they cannot get out of step. The recursion is doing the counting.
:::

::: behind
This is the shape of nearly every context-free language worth knowing: recursion that grows two matched things at once, from the middle outward.

Balanced brackets, palindromes, nested if/else - all the same trick. It is also exactly why CFGs describe programming-language syntax and regular expressions do not.
:::

## Derivations And Parse Trees

::: cards Two derivation orders
Leftmost :: At each step, rewrite the leftmost variable. Written =>_lm.
Rightmost :: At each step, rewrite the rightmost variable. Written =>_rm.
:::

::: remember
A **parse tree** discards derivation ORDER and keeps only structure. That is the whole reason it exists.

One parse tree corresponds to exactly one leftmost derivation and exactly one rightmost derivation. So counting parse trees, counting leftmost derivations, and counting rightmost derivations all give the same answer - and GATE asks all three phrasings.
:::

## Ambiguity

::: story
A grammar is **ambiguous** if some string in its language has two or more distinct parse trees.

The classic: S -> S + S | S * S | id. The string id + id * id parses two ways - one grouping the addition first, one the multiplication. Same string, same grammar, two structures, two meanings.

That is not an academic curiosity. For a compiler it means the expression has no defined value.
:::

::: mistake
Saying "this language is ambiguous."

Ambiguity is a property of a **grammar**, not of a language. The arithmetic grammar above is ambiguous, but the same language has an unambiguous grammar - the standard one with separate levels for expression, term and factor, which builds precedence into the structure.

Only when **every** grammar for a language is ambiguous is the language **inherently ambiguous**. Those exist, and { a^i b^j c^k : i = j or j = k } is the standard example - but they are rare, and the word "inherently" is what GATE is checking you noticed.
:::

::: checkpoint
A grammar has an ambiguous production set, but you find an unambiguous grammar generating the same language. What follows?
- ( ) The language is inherently ambiguous
- (x) Nothing about the language - the first grammar was ambiguous, the language is not inherently so
- ( ) Both grammars must be ambiguous
- ( ) The language is not context-free
> Nothing about the language. Producing one unambiguous grammar is exactly the proof that the language is NOT inherently ambiguous. Inherent ambiguity is a claim about every possible grammar, which is far harder to establish.
:::

## Chomsky Normal Form

::: cards CNF allows exactly two production shapes
A -> BC :: Exactly two variables on the right. Neither may be the start symbol if epsilon is in the language.
A -> a :: Exactly one terminal.
:::

Plus S -> epsilon, only if the language contains the empty string.

::: remember
The payoff is a rigid tree shape, and one number worth memorising:

**A CNF derivation of a string of length n uses exactly 2n - 1 steps** - n productions of the form A -> a, and n - 1 of the form A -> BC.

That fixed count is what makes the CYK parsing algorithm's O(n^3) analysis work, and GATE asks for it directly.
:::

::: interview
Conversion order matters and is a standard multi-mark question: remove epsilon-productions, then unit productions, then useless symbols, then convert to CNF.

Doing it out of order - unit productions before epsilon-productions in particular - can reintroduce exactly what you just eliminated.
:::`,
    deepDive: `**Greibach Normal Form (GNF)** is the other standard form: every production is A -> a alpha, one terminal followed by zero or more variables. Its value is that each derivation step consumes exactly one input symbol, so a string of length n derives in exactly n steps and left-recursion is structurally impossible - which is what makes GNF the bridge to top-down parsing and to the direct CFG-to-PDA construction.

**Useless symbols** come in two flavours that are easy to conflate. A **non-generating** symbol derives no terminal string at all. A **non-reachable** symbol cannot be reached from S. Elimination order is fixed: remove non-generating symbols FIRST, then non-reachable ones. Reversed, removing non-reachable symbols can strand a symbol that only becomes unreachable after a non-generating one is deleted, and it survives into the "cleaned" grammar.`,
    dryRun: `Derive **aabb** from the grammar S -> aSb | epsilon.

::: timeline Derivation
S :: The start variable, and the only place to begin.
=> aSb :: Apply S -> aSb. One a and one b are added in the SAME step.
=> aaSbb :: Apply S -> aSb again, to the inner S.
=> aabb :: Apply S -> epsilon. The inner S vanishes, leaving a^2 b^2.
:::

::: remember
Three steps, and the a-count and b-count never diverged - because a single production adds one of each.

That simultaneity is the mechanism a finite automaton cannot reproduce. It is not that a DFA counts badly; it is that it has nowhere to keep a count that grows without bound.
:::`,
    keyPoints: [
      "A CFG is (V, T, P, S), and \"context-free\" means every production has exactly ONE variable on its left-hand side.",
      "A parse tree discards derivation order; one parse tree = one leftmost derivation = one rightmost derivation, so all three counts agree.",
      "Ambiguity is a property of a GRAMMAR. A language is inherently ambiguous only if EVERY grammar for it is ambiguous.",
      "CNF permits only A -> BC and A -> a (plus S -> epsilon if needed), and forces exactly 2n - 1 derivation steps for a string of length n.",
      "Cleanup order is fixed: epsilon-productions, then unit productions, then useless symbols. Out of order, you can reintroduce what you removed.",
    ],
    commonMistakes: [
      "Calling a LANGUAGE ambiguous when only the grammar is. Producing one unambiguous grammar disproves inherent ambiguity outright.",
      "Forgetting that CNF's 2n - 1 count applies to the derivation, not to the grammar's production count.",
      "Removing non-reachable symbols before non-generating ones, which can leave a useless symbol behind.",
      "Assuming every CFL has an unambiguous grammar - inherently ambiguous languages are rare but real, and GATE uses them as distractors.",
    ],
    analogies: [
      "A grammar is a recipe and an automaton is an inspector. The recipe tells you how to build a valid dish; the inspector tells you whether one you are handed is valid. For CFLs, everything buildable is exactly everything that passes.",
    ],
    memoryTricks: [
      "CNF = \"Couples aNd Firsts\": pairs of variables (BC) or a single terminal (a). Nothing else.",
      "2n - 1: n leaves need n terminal-productions, and a binary tree with n leaves has n - 1 internal nodes.",
    ],
    formulas: [
      { name: "CNF derivation length", expression: "exactly 2n - 1 steps for |w| = n", note: "n productions A -> a, plus n - 1 productions A -> BC." },
      { name: "CYK parsing time", expression: "O(n^3 * |G|)", note: "Requires the grammar in CNF; the cubic term is the substring table." },
    ],
    shortcuts: [
      "To test ambiguity fast, look for a string with two groupings - operator grammars with no precedence levels are almost always ambiguous.",
      "If a question gives a CNF grammar and asks for derivation length, do not derive anything. Compute 2n - 1.",
    ],
    mcqs: [
      {
        question: "A grammar G is ambiguous. What can be concluded about L(G)?",
        options: [
          "L(G) is inherently ambiguous",
          "Nothing - another grammar for L(G) may well be unambiguous",
          "L(G) is not context-free",
          "L(G) must be regular",
        ],
        correctIndex: 1,
        explanation: "Ambiguity is a property of the grammar. Inherent ambiguity requires EVERY grammar for the language to be ambiguous, which one ambiguous grammar does not establish.",
      },
      {
        question: "A CNF grammar derives a string of length 8. How many derivation steps are used?",
        options: ["8", "15", "16", "It depends on the grammar"],
        correctIndex: 1,
        explanation: "2n - 1 = 2(8) - 1 = 15. Eight A -> a productions and seven A -> BC productions, independent of the particular grammar.",
      },
    ],
    numericals: [
      {
        question: "A grammar in Chomsky Normal Form derives a terminal string of length 12. How many productions of the form A -> BC are applied?",
        answerMin: 11, answerMax: 11, unit: "productions",
        solution: "A CNF parse tree for n leaves is a binary tree with n leaves, which has exactly **n - 1 = 11** internal nodes. Each internal node is one A -> BC application. (Total steps would be 2n - 1 = 23, of which 12 are A -> a.)",
      },
    ],
    pyqRelevance: "Context-Free Grammars appear in nearly every GATE CS paper, typically for 1-2 marks. The recurring forms are: identify which grammar generates a given language, decide whether a grammar is ambiguous, count derivation steps or parse trees, and apply the CNF 2n - 1 result. Inherent ambiguity shows up as a distractor in definition questions far more often than as a proof exercise.",
    interviewConnection: "Compiler front-ends are built directly on this: parser generators reject ambiguous grammars, and the expression-grammar precedence levels in the ambiguity example above are exactly what a real language grammar encodes.",
    revisionSummary: "CFG = (V, T, P, S), one variable on every left-hand side. Parse tree = structure without order, so parse trees, leftmost and rightmost derivations all count the same. Ambiguity belongs to grammars; inherent ambiguity belongs to languages and is rare. CNF: A -> BC or A -> a, exactly 2n - 1 steps.",
    shortNotes: [
      "CFG: exactly one variable on the LHS of every production.",
      "#parse trees = #leftmost derivations = #rightmost derivations.",
      "Ambiguous grammar =/= inherently ambiguous language.",
      "CNF: A -> BC | a. Derivation of length-n string = 2n - 1 steps.",
      "Cleanup order: epsilon -> unit -> useless. Useless: non-generating BEFORE non-reachable.",
    ],
  },

  "push-down-automata": {
    difficulty: "Moderate",
    estimatedMinutes: 40,
    xpReward: 30, coinReward: 12,
    // Verified real (title confirmed via direct fetch, 2026-08-13).
    resources: [{
      kind: "video",
      title: "Pushdown Automata (Introduction) - Neso Academy",
      url: "https://www.youtube.com/watch?v=4ejIAmp_Atw",
      description: "Whole video covers this topic from the start.",
    }],
    whatYoullLearn: [
      "What adding one stack buys you over a finite automaton",
      "The PDA transition, and why the stack is the only unbounded memory",
      "Acceptance by final state versus by empty stack, and why they are equivalent",
      "The one place determinism genuinely matters: DPDA is strictly weaker than NPDA",
    ],
    prerequisites: ["Context-Free Grammars"],
    concept: `## One Stack, Everything Changes

::: story
Take a finite automaton and bolt one thing onto it: a stack. Unbounded, but you may only ever touch the top.

That single addition is the difference between not being able to count and being able to match a^n b^n for any n. Push an a for every a, pop one for every b, accept if the stack empties exactly when the input does.

The counting lives in the stack, not in the states - which is precisely what the finite-memory constraint forbade.
:::

::: cards A PDA is a seven-tuple
Q, Sigma, q0, F :: States, input alphabet, start state, accepting states - unchanged from a finite automaton.
Gamma :: The STACK alphabet. Often different from the input alphabet.
Z0 :: The initial stack symbol, sitting alone on the stack at the start.
delta :: The transition. Takes (state, input symbol or epsilon, stack TOP) and returns a set of (new state, string to push).
:::

::: remember
The transition reads and replaces the stack top on every move.

Pushing X onto a top of Z means writing "XZ". Popping means writing epsilon. Leaving it alone means writing Z back. There is no separate push and pop instruction - there is one replace, and the three behaviours are special cases of it.
:::

## Why The Stack Is Not Just More States

::: behind
A student's first instinct is that a stack is a shortcut for having more states. It is not, and the reason is worth being precise about.

A finite automaton has finitely many states, fixed before it sees any input. A stack has no bound on its height, so a PDA has infinitely many possible **configurations** even though it has finitely many states.

That is the whole gap. a^n b^n needs unboundedly many distinguishable situations, and only the stack can supply them.
:::

::: mistake
Assuming the stack can be inspected.

A PDA sees the **top symbol only**. It cannot look underneath, cannot count its own stack, and cannot search it. Every design has to arrange for the information it needs to arrive at the top exactly when it is needed - which is why a PDA can match a^n b^n but cannot match a^n b^n c^n.
:::

## Two Ways To Accept

::: cards Final state vs empty stack
By final state :: The input is consumed and the machine is in a state in F. The stack contents are irrelevant.
By empty stack :: The input is consumed and the stack is empty. F is irrelevant, and is usually written as the empty set.
:::

::: remember
The two are **equivalent in power** - every language accepted one way is accepted the other way by some PDA.

The conversions are short: to go from empty-stack to final-state, push a fresh bottom marker below everything and move to a new accepting state when you see it. To go the other way, add a state that pops everything once you reach a final state.

Equivalent for NPDAs. The distinction is not equivalent for DPDAs, which is the trap in the next section.
:::

## The One Place Determinism Costs You

::: story
For finite automata, DFA and NFA accept exactly the same languages. The subset construction converts one to the other, and determinism is free.

For pushdown automata it is not free. **DPDA is strictly weaker than NPDA.**
:::

::: cards The separating example
Even-length palindromes :: L = { w w^R : w in {a,b}* }. An NPDA guesses the midpoint nondeterministically, then matches. Deterministically there is no way to know where the middle is until it is too late.
Consequence :: This language is context-free but NOT deterministic context-free.
:::

::: remember
Two facts to keep straight, because GATE tests exactly this asymmetry:

**NFA = DFA in power. NPDA > DPDA in power.**

And: DCFLs are closed under complement; CFLs in general are not. That closure difference is a direct consequence of determinism.
:::

::: checkpoint
Which statement is correct?
- ( ) Every CFL is accepted by some DPDA
- (x) Some CFLs, such as { w w^R }, are accepted by no DPDA
- ( ) DPDAs and NPDAs accept exactly the same languages
- ( ) DPDAs are more powerful than NPDAs
> Some CFLs need nondeterminism. Even-length palindromes are the standard witness: the machine must guess the midpoint, and no deterministic strategy can identify it in time.
:::

::: interview
The equivalence to state clearly: a language is context-free **if and only if** some PDA accepts it. Grammar and machine descriptions of CFLs are interchangeable, exactly as regular expressions and finite automata are for regular languages.
:::`,
    deepDive: `The **CFG-to-PDA construction** is worth carrying because it is short and it explains why the equivalence holds. Build a one-state PDA. Put the start variable on the stack. Then: if the stack top is a variable A, pop it and push the right-hand side of some production A -> alpha (nondeterministically choosing which). If the stack top is a terminal, it must match the next input symbol - consume both. Accept by empty stack. The PDA's stack is literally holding the unexpanded remainder of a leftmost derivation, which is why the two formalisms coincide.

The **PDA-to-CFG** direction is far messier - variables of the form [q A p], meaning "from state q, pop A, and end in state p" - and GATE essentially never asks for it. Knowing it exists, and that it is what makes the equivalence an if-and-only-if, is enough.`,
    dryRun: `Trace a PDA accepting { a^n b^n } on the input **aabb**.

::: timeline Stack trace
Start :: Stack Z0, input aabb. Z0 is the bottom marker and is never popped.
Read a :: Push A. Stack AZ0. The push phase records one stack symbol per a.
Read a :: Push A. Stack AAZ0. Two a's seen, two A's stacked.
Read b :: Pop A. Stack AZ0. The first b switches the machine to the pop phase.
Read b :: Pop A. Stack Z0. Input exhausted, only the bottom marker left.
Accept :: The stack returned to Z0 exactly as the input ended, so the counts matched.
:::

::: behind
Notice what did NOT grow: the number of states. It is the same machine for n = 2 and n = 2000.

All the counting happened in stack HEIGHT - the one resource a finite automaton does not have, and the entire reason this language separates the two models.
:::`,
    keyPoints: [
      "A PDA is a finite automaton plus one unbounded stack, and only the TOP of that stack is ever visible.",
      "The transition replaces the stack top; push, pop and leave-alone are all special cases of one replace operation.",
      "Acceptance by final state and by empty stack are equivalent in power for NPDAs, with short conversions both ways.",
      "DPDA is STRICTLY weaker than NPDA - unlike DFA vs NFA. { w w^R } is the standard separating language.",
      "A language is context-free if and only if some PDA accepts it.",
    ],
    commonMistakes: [
      "Carrying over \"determinism is free\" from finite automata. It is free for NFA/DFA and false for PDAs.",
      "Believing a PDA can inspect or count its stack. It sees the top symbol and nothing else.",
      "Trying to build a PDA for a^n b^n c^n - one stack matches one pair of counts, and the c's have nothing left to pop.",
      "Assuming acceptance by empty stack is weaker because F is empty. It is equivalent for NPDAs.",
    ],
    analogies: [
      "The stack is a spike of receipts. You can add one on top, or take the top one off, but you cannot flip through the pile - so any information you will need later has to be arranged to surface at the right moment.",
    ],
    memoryTricks: [
      "\"NFA = DFA, NPDA > DPDA\" - the one asymmetry in the hierarchy, and the one GATE tests.",
      "One stack matches one pair. a^n b^n yes, a^n b^n c^n no.",
    ],
    formulas: [
      { name: "PDA transition", expression: "delta: Q x (Sigma U {epsilon}) x Gamma -> 2^(Q x Gamma*)", note: "The Gamma* output is the string replacing the popped top symbol." },
      { name: "PDA seven-tuple", expression: "(Q, Sigma, Gamma, delta, q0, Z0, F)", note: "Gamma and Z0 are the two additions over a finite automaton." },
    ],
    shortcuts: [
      "If a language needs two independent counts matched, one stack is not enough - it is not context-free.",
      "If a construction seems to need knowing the midpoint of the input, it needs nondeterminism, so no DPDA exists.",
    ],
    mcqs: [
      {
        question: "Which is true of deterministic versus nondeterministic pushdown automata?",
        options: [
          "They accept exactly the same class of languages, as with DFA and NFA",
          "NPDAs are strictly more powerful - some CFLs, such as { w w^R }, have no DPDA",
          "DPDAs are strictly more powerful",
          "Neither can accept { a^n b^n }",
        ],
        correctIndex: 1,
        explanation: "Determinism is free for finite automata but not for PDAs. Even-length palindromes require guessing the midpoint, which no deterministic strategy achieves.",
      },
      {
        question: "What can a PDA observe about its stack at any step?",
        options: [
          "The entire stack contents",
          "Only the topmost symbol",
          "The current stack height",
          "The bottom symbol only",
        ],
        correctIndex: 1,
        explanation: "The transition function takes the stack top as its only stack input. No height, no search, no access below the top.",
      },
    ],
    numericals: [
      {
        question: "A PDA accepting { a^n b^n : n >= 1 } by empty stack pushes one symbol per a and pops one per b, starting with only Z0 on the stack. For the input a^5 b^5, what is the maximum stack height reached, counting Z0?",
        answerMin: 6, answerMax: 6, unit: "symbols",
        solution: "Five pushes, one per a, on top of the initial Z0 gives **6** symbols at the peak, reached just before the first b. The pops then bring it back down.",
      },
    ],
    pyqRelevance: "PDAs appear most often for 1-2 marks as a definition or power question: what the transition function's signature is, whether DPDA equals NPDA (the highest-frequency trap in this topic), and which languages need a PDA rather than a finite automaton. Explicit PDA construction is asked less often than the CFG side, but the DPDA-vs-NPDA asymmetry and the DCFL-closed-under-complement fact recur reliably.",
    interviewConnection: "The CFG-to-PDA construction is what a recursive-descent parser does concretely - the call stack IS the PDA stack, holding the unexpanded remainder of the derivation.",
    revisionSummary: "PDA = finite automaton + one stack, top symbol only. Seven-tuple adds Gamma and Z0. Final-state and empty-stack acceptance are equivalent for NPDAs. DPDA < NPDA strictly, witnessed by { w w^R }. CFL iff some PDA accepts it.",
    shortNotes: [
      "PDA = (Q, Sigma, Gamma, delta, q0, Z0, F). Stack top only.",
      "delta: Q x (Sigma U {eps}) x Gamma -> 2^(Q x Gamma*).",
      "Final state == empty stack in power (for NPDAs).",
      "NPDA > DPDA. Witness: { w w^R }. (But NFA == DFA.)",
      "DCFL closed under complement; CFL is not.",
      "One stack = one matched pair. a^n b^n c^n is not a CFL.",
    ],
  },

  "context-free-language-properties-and-closure": {
    difficulty: "Moderate",
    estimatedMinutes: 35,
    xpReward: 30, coinReward: 12,
    // Verified via YouTube oEmbed (2026-08-29) - real, publicly viewable.
    resources: [{
      kind: "video",
      title: "Closure properties of Context Free Languages || CFG || TOC || FLAT || Theory of Computation",
      url: "https://www.youtube.com/watch?v=XEhUMkmVMGs",
      description: "Sudhakar Atchala lecture on closure properties of context-free languages in Theory of Computation.",
    }],
    whatYoullLearn: [
      "Which operations CFLs are closed under, and the two headline ones they are not",
      "Why intersection and complement fail, with the standard counter-example",
      "Closure with a REGULAR language, which does hold and is heavily used",
      "Which CFL decision problems are decidable, and which are not",
    ],
    prerequisites: ["Push-Down Automata"],
    concept: `## The Two That Fail

::: story
Regular languages are closed under essentially everything. Context-free languages are not, and the failures are the entire point of this topic.

**CFLs are not closed under intersection, and not closed under complement.**

Every other closure question in a GATE paper is testing whether you know those two.
:::

::: cards Closure summary
Closed :: Union, concatenation, Kleene star, reversal, homomorphism, inverse homomorphism, substitution.
NOT closed :: Intersection, complement, set difference.
Special case, closed :: Intersection with a REGULAR language. CFL and Regular gives a CFL.
:::

## Why Intersection Fails

::: story
The counter-example is short enough to reconstruct in the exam, which is better than memorising the result.

  L1 = { a^i b^i c^j : i, j >= 0 }   - match the a's and b's, ignore the c's
  L2 = { a^i b^j c^j : i, j >= 0 }   - ignore the a's, match the b's and c's

Both are context-free. Each needs exactly one matched pair, which one stack handles.

Their intersection is { a^n b^n c^n }, which is famously **not** context-free - the pumping lemma for CFLs kills it.

Two context-free languages, one non-context-free intersection. Closure fails.
:::

::: behind
The intuition is the stack again. Each language needs one counter; the intersection needs two simultaneously, and a PDA has one stack.
:::

## Why Complement Fails - And The Shortcut

::: remember
Complement failure follows from intersection failure by De Morgan, and this derivation is worth being able to produce:

  L1 intersect L2 = complement( complement(L1) union complement(L2) )

CFLs **are** closed under union. So if they were also closed under complement, the right-hand side would be context-free for any CFLs L1 and L2 - making intersection closed too. It is not. Therefore complement is not closed.
:::

::: mistake
Assuming complement fails for DCFLs too.

**Deterministic** CFLs ARE closed under complement - a DPDA can be complemented by swapping accepting and non-accepting states, with care around epsilon-moves and dead configurations. DCFLs are still not closed under intersection or union.

So: CFL not closed under complement, DCFL closed under complement. GATE uses that distinction directly.
:::

## Intersection With A Regular Language

::: story
The one closure result that survives, and the one you actually use.

If L is context-free and R is regular, then L intersect R is context-free.

The construction is a product: run the PDA for L and the DFA for R in lockstep, tracking a pair of states, with the single stack still belonging to the PDA. One stack, so it still works.
:::

::: remember
This is the standard tool for proving a language is NOT context-free without wrestling the pumping lemma directly.

Intersect the suspect language with a well-chosen regular language. If the result is something already known to be non-context-free, the original cannot have been context-free either - because closure with a regular language would have guaranteed it was.
:::

::: checkpoint
L is context-free, R is regular. Which is guaranteed context-free?
- ( ) L intersect R only if R is also context-free
- (x) L intersect R, always - CFLs are closed under intersection with a regular language
- ( ) Neither, since CFLs are not closed under intersection
- ( ) Only if L is deterministic
> Always. The general intersection failure does not apply here: the product construction pairs PDA states with DFA states and still uses exactly one stack, so the result is a PDA.
:::

## Decision Problems

::: cards Decidable for CFLs
Membership :: Is w in L? Yes - CYK, O(n^3).
Emptiness :: Is L empty? Yes.
Finiteness :: Is L finite? Yes.
:::

::: cards UNDECIDABLE for CFLs
Equivalence :: Is L1 = L2? No.
Intersection-emptiness :: Is L1 intersect L2 empty? No.
Ambiguity :: Is a given grammar ambiguous? No.
Is L1 a subset of L2? :: No.
Is L context-free's complement context-free? :: No.
:::

::: interview
The line to remember: for **regular** languages, equivalence IS decidable. For **context-free** languages it is not.

That single difference is one of the most-asked comparison points in the whole subject, and it is easy to state precisely.
:::`,
    deepDive: `**DCFL equivalence** is the surprising one. Whether two DPDAs accept the same language was open for decades and was finally proved DECIDABLE by Senizergues in 1997 - a genuinely deep result. GATE does not require the proof, but it occasionally offers "DCFL equivalence is undecidable" as a plausible-looking distractor, and it is false.

Note also that CFLs are closed under **substitution** and **homomorphism**, which are stronger than they look: replacing each terminal by an entire language, or by a string, preserves context-freeness. Inverse homomorphism is closed too. These appear less often than intersection/complement but round out the table.`,
    dryRun: `Use closure the other way round: show that **L = { a^i b^j c^k : i = j or j = k }** cannot be handled by intersection alone, and see how the regular-intersection tool is applied in practice.

::: timeline Applying the tool
Suspect a language :: Take M = { a^n b^n c^n }. We want to show it is not context-free.
Pick a regular partner :: R = a* b* c*, chosen so the intersection isolates the ordering constraint.
Apply the closure rule :: If M were context-free, then M intersect R would be too, since CFL intersect Regular = CFL.
Observe the intersection :: M intersect R = M, because every string of M already has the a*b*c* shape.
Reach the contradiction :: M is shown non-context-free by the CFL pumping lemma. So M was never context-free.
:::

::: remember
The closure property works in both directions, and that is what makes it useful.

Forwards it GUARANTEES context-freeness (CFL intersect Regular is a CFL). Backwards it becomes a proof technique: intersect a suspect language with a well-chosen regular language, and if the result is a known non-CFL, the original cannot have been one either.
:::`,
    keyPoints: [
      "CFLs are closed under union, concatenation, Kleene star, reversal and homomorphism - and NOT under intersection, complement or difference.",
      "L1 = { a^i b^i c^j } and L2 = { a^i b^j c^j } intersect to { a^n b^n c^n }, the standard proof that intersection fails.",
      "Complement failure follows from intersection failure by De Morgan, since union IS closed.",
      "CFL intersect REGULAR is context-free - the one surviving intersection result, and the standard tool for non-context-freeness proofs.",
      "Decidable for CFLs: membership, emptiness, finiteness. Undecidable: equivalence, ambiguity, intersection-emptiness, subset.",
    ],
    commonMistakes: [
      "Assuming CFLs behave like regular languages under intersection and complement. Those are exactly the two that break.",
      "Forgetting the regular-language exception, and so missing the easiest route to a non-context-freeness proof.",
      "Saying DCFLs are not closed under complement. They are - it is general CFLs that are not.",
      "Claiming CFL equivalence is decidable by analogy with regular languages. It is not; DFA equivalence is.",
    ],
    analogies: [
      "One stack is one budget. Union just asks which of two budgets to use, so it is fine. Intersection asks you to satisfy two budgets at once, and you only have the one.",
    ],
    memoryTricks: [
      "\"CFLs fail at IC\" - Intersection and Complement.",
      "Regular is the friendly partner: CFL and Regular is still a CFL.",
      "Decidable trio: Membership, Emptiness, Finiteness. Everything comparative (equal, subset, ambiguous) is undecidable.",
    ],
    formulas: [
      { name: "De Morgan derivation", expression: "L1 ∩ L2 = ~(~L1 ∪ ~L2)", note: "Union is closed, so if complement were closed, intersection would be. It is not." },
      { name: "Regular intersection", expression: "CFL ∩ Regular = CFL", note: "Product of PDA states and DFA states; still one stack." },
    ],
    shortcuts: [
      "To show a language is not context-free, first try intersecting with a regular language to reduce it to a^n b^n c^n.",
      "Any GATE option asserting CFL closure under intersection or complement is wrong - unless it says DCFL and complement, which is right.",
    ],
    mcqs: [
      {
        question: "Which pair of operations are context-free languages NOT closed under?",
        options: [
          "Union and concatenation",
          "Intersection and complement",
          "Kleene star and reversal",
          "Concatenation and homomorphism",
        ],
        correctIndex: 1,
        explanation: "Union, concatenation, star, reversal and homomorphism all preserve context-freeness. Intersection and complement are the two failures, witnessed by { a^i b^i c^j } ∩ { a^i b^j c^j } = { a^n b^n c^n }.",
      },
      {
        question: "L is a CFL and R is regular. Which is guaranteed?",
        options: [
          "L ∩ R is context-free",
          "L ∩ R may fail to be context-free",
          "L ∩ R is regular",
          "L ∪ R is not context-free",
        ],
        correctIndex: 0,
        explanation: "Intersection with a regular language preserves context-freeness - the product construction keeps a single stack. This is the exception to the general intersection failure.",
      },
    ],
    numericals: [
      {
        question: "Of these five problems for context-free languages - membership, emptiness, finiteness, equivalence, ambiguity - how many are decidable?",
        answerMin: 3, answerMax: 3, unit: "problems",
        solution: "**3** are decidable: membership (CYK, O(n^3)), emptiness, and finiteness. Equivalence and ambiguity are both undecidable.",
      },
    ],
    pyqRelevance: "Closure properties are among the highest-frequency GATE topics in Theory of Computation, usually 1-2 marks and often as a multi-statement \"which of the following are true\" question. Intersection and complement failure, and the regular-language exception, carry most of the marks. The decidable/undecidable table for CFLs is asked almost as often, with CFL equivalence as the most common distractor.",
    interviewConnection: "The regular-intersection construction is what lets a parser apply lexical constraints on top of a context-free grammar without leaving the context-free world.",
    revisionSummary: "Closed: union, concatenation, star, reversal, homomorphism. Not closed: intersection, complement, difference. Exception: CFL ∩ Regular = CFL. DCFLs ARE closed under complement. Decidable: membership, emptiness, finiteness. Undecidable: equivalence, ambiguity, subset, intersection-emptiness.",
    shortNotes: [
      "NOT closed: intersection, complement, difference. (\"CFLs fail at IC.\")",
      "Closed: union, concat, star, reversal, homomorphism, substitution.",
      "CFL ∩ Regular = CFL - the exception, and the proof tool.",
      "Witness: { a^i b^i c^j } ∩ { a^i b^j c^j } = { a^n b^n c^n }.",
      "DCFL: closed under complement, NOT under union/intersection.",
      "Decidable: membership, emptiness, finiteness. Undecidable: equivalence, ambiguity, subset.",
    ],
  },

  "pumping-lemma-for-context-free-languages": {
    difficulty: "Hard",
    estimatedMinutes: 40,
    xpReward: 35, coinReward: 15,
    // Verified real (title confirmed via direct fetch, 2026-08-13).
    resources: [{
      kind: "video",
      title: "Pumping Lemma for Context Free Languages (Intro)",
      url: "https://www.youtube.com/watch?v=HmSTXxMPQ_M",
      description: "Whole video covers this topic from the start.",
    }],
    whatYoullLearn: [
      "The CFL pumping lemma statement, and how its five-part split differs from the regular one",
      "Why the split is uvxyz and what |vxy| <= p actually constrains",
      "How to run the adversary game to prove a language is not context-free",
      "The limits of the lemma - it is necessary, not sufficient",
    ],
    prerequisites: ["Context-Free Language Properties and Closure"],
    concept: `## Two Pumps, Not One

::: story
The regular pumping lemma split a string into three parts, xyz, and pumped the middle one.

The context-free version splits into **five**, uvxyz, and pumps **two** of them - v and y - **together and by the same amount**.

That change is not cosmetic. It comes straight from parse trees: a long enough string forces some variable to repeat on a root-to-leaf path, and the subtree between the two occurrences can be duplicated. Duplicating it grows the material on BOTH sides of the middle, which is why two segments pump in lockstep.
:::

::: remember
**Statement.** For every context-free language L there is a pumping length p such that every string s in L with |s| >= p can be written s = uvxyz where:

1. |vy| >= 1 - v and y are not both empty
2. |vxy| <= p - the pumped parts and the middle sit inside a window of length p
3. u v^i x y^i z is in L for every i >= 0 - **the same i on both**
:::

::: cards Regular vs context-free lemma
Regular :: s = xyz, pump y alone. Constraint |xy| <= p pins the pumped part near the START.
Context-free :: s = uvxyz, pump v and y together. Constraint |vxy| <= p pins v, x, y inside a WINDOW of length p, which may sit anywhere.
:::

::: mistake
Pumping v and y by different amounts.

The condition is u v^i x y^i z - one index, used twice. There is no version where v is pumped twice and y three times. Half the wrong answers in this topic come from treating them independently.
:::

## The Window Is The Whole Argument

::: story
For the regular lemma, |xy| <= p forced the pumped part into the first p symbols. Convenient - you always knew where it was.

For CFLs, |vxy| <= p says only that v, x and y together occupy some window of length at most p. That window can sit **anywhere** in the string.

So the proof has to consider every position the window could occupy - and the skill is choosing a string where **every** placement leads to a contradiction.
:::

::: behind
Why a window of length p at all? Because p is chosen from the grammar's variable count and the maximum right-hand-side length. A path long enough to repeat a variable bounds the size of the subtree hanging below it, and that subtree spans exactly vxy.

You do not need the derivation for GATE, but knowing where the bound comes from stops |vxy| <= p feeling arbitrary.
:::

## The Adversary Game

::: flow
1. Assume L is context-free :: So a pumping length p exists. You do not get to choose p.
2. YOU choose s :: A string in L with |s| >= p. This is your only real freedom - choose well.
3. The adversary chooses the split :: Any uvxyz meeting |vy| >= 1 and |vxy| <= p. You must beat EVERY split.
4. YOU choose i :: Usually i = 0 or i = 2. Show u v^i x y^i z is not in L.
5. Contradiction :: L is not context-free.
:::

::: remember
Steps 2 and 4 are yours; step 3 is not. A proof that only handles a convenient split is not a proof.

For a^n b^n c^n the standard choice is s = a^p b^p c^p. Because |vxy| <= p, the window cannot touch both the a-block and the c-block - they are p symbols apart. So vy misses at least one of the three letters, and pumping unbalances the counts.
:::

::: checkpoint
For s = a^p b^p c^p, why can the window vxy not contain both an a and a c?
- ( ) Because |vy| >= 1
- (x) Because |vxy| <= p, and the a-block and c-block are separated by p b's
- ( ) Because v and y must be adjacent
- ( ) Because x must be empty
> The length bound. The last a and the first c are more than p positions apart, so no window of length at most p can reach both. That is precisely what forces vy to miss a letter and unbalance the counts.
:::

## What The Lemma Cannot Do

::: mistake
Using the lemma to prove a language IS context-free.

It is a **necessary** condition, not sufficient. There are non-context-free languages that satisfy the pumping condition, so passing the test proves nothing.

To prove a language IS context-free, exhibit a grammar or a PDA. The lemma only ever proves the negative.
:::

::: interview
If a language survives the pumping lemma but you still suspect it is not context-free, the usual next tool is closure: intersect with a regular language and reduce to something already known to be non-context-free. Ogden's lemma - a strengthening that lets you mark positions that must be pumped - exists for the residual cases, and is worth naming.
:::`,
    deepDive: `**Ogden's lemma** strengthens the pumping lemma by letting you designate at least p positions as "marked", and guaranteeing that vy contains at least one marked position (with |vxy| containing at most p marked positions). This matters for languages where the plain lemma fails because the adversary can always place the window in a boring region - { a^i b^j c^k d^l : i = 0 or j = k = l } is the standard example that plain pumping cannot kill but Ogden's can. GATE does not ask for Ogden's lemma proofs, but naming it as the strengthening is a genuine signal in an interview.

Note the asymmetry with the regular lemma once more: there, |xy| <= p located the pumped part absolutely, at the front. Here |vxy| <= p only bounds a window's WIDTH, not its position, which is why CFL pumping proofs need case analysis over where the window falls and regular ones usually do not.`,
    dryRun: `Prove **{ a^n b^n c^n }** is not context-free.

::: timeline The adversary game
Assume :: L is context-free, so a pumping length p exists. The adversary supplies p; we never choose it.
Choose s :: s = a^p b^p c^p. It is in L and |s| = 3p >= p. This is our one free choice, and it is what makes every case fail.
Note the window :: Any split satisfies |vxy| <= p, so the window spans at most TWO of the three letter-blocks - never all three.
Case, no c in vy :: Pump to i = 2. The a and/or b count rises while c stays at p. The counts are now unequal.
Case, no a in vy :: Symmetric. The a count stays at p while b and/or c grow.
Contradiction :: Since |vy| >= 1, something always gets pumped, so some count always breaks.
:::

::: remember
The window bound is doing all the work here.

|vxy| <= p guarantees vy misses at least one of the three letters, because the a-block and c-block are p symbols apart. And |vy| >= 1 guarantees something IS pumped. Together they make it impossible for the three counts to stay equal.
:::`,
    keyPoints: [
      "The CFL lemma splits into FIVE parts, s = uvxyz, and pumps v and y TOGETHER with the same exponent i.",
      "Conditions: |vy| >= 1, |vxy| <= p, and u v^i x y^i z in L for all i >= 0.",
      "|vxy| <= p bounds the WIDTH of a window, not its position - unlike the regular lemma's |xy| <= p, which pins the pumped part to the front.",
      "You choose the string and the exponent; the adversary chooses the split, so every split must be defeated.",
      "The lemma is necessary but NOT sufficient - it can prove a language is not context-free, never that it is.",
    ],
    commonMistakes: [
      "Pumping v and y by different amounts. The exponent i is shared.",
      "Treating |vxy| <= p as though it forced the window to the start of the string, by analogy with the regular lemma.",
      "Handling only one convenient split instead of all of them.",
      "Concluding a language IS context-free because pumping succeeds. The condition is necessary only.",
    ],
    analogies: [
      "The parse tree repeats a variable on a long path, and the repeated subtree is a copy-paste block. Pasting it again grows material on both sides of the middle at once - which is exactly why two segments must pump together rather than one.",
    ],
    memoryTricks: [
      "Regular pumps ONE part; context-free pumps TWO, in lockstep. Three-part split versus five-part split.",
      "u-v-x-y-z: the outer u and z are untouched, the inner x is the pivot, and v and y are the twins.",
      "For a^n b^n c^n pick a^p b^p c^p: the window is too narrow to reach both ends.",
    ],
    formulas: [
      { name: "CFL pumping lemma", expression: "s = uvxyz, |vy| >= 1, |vxy| <= p, u v^i x y^i z in L for all i >= 0", note: "Same i on both v and y." },
      { name: "Regular, for contrast", expression: "s = xyz, |y| >= 1, |xy| <= p, x y^i z in L", note: "One pumped part, pinned to the front." },
    ],
    shortcuts: [
      "For three equal blocks, choose all three at length p - the window then cannot span the outer two.",
      "i = 0 (pumping down) is often faster than i = 2, especially when it empties a block entirely.",
    ],
    mcqs: [
      {
        question: "In the CFL pumping lemma, s = uvxyz. Which strings are guaranteed to be in L?",
        options: [
          "u v^i x y^j z for all i, j >= 0",
          "u v^i x y^i z for all i >= 0",
          "u v^i x y z for all i >= 0",
          "u x z only",
        ],
        correctIndex: 1,
        explanation: "v and y are pumped together with the SAME exponent i. Independent exponents i and j are not guaranteed, and that is the most common misstatement of the lemma.",
      },
      {
        question: "What does the condition |vxy| <= p tell you?",
        options: [
          "The pumped parts must lie within the first p symbols of s",
          "v, x and y together occupy a window of at most p symbols, positioned anywhere in s",
          "v and y each have length at most p/2",
          "x must be empty",
        ],
        correctIndex: 1,
        explanation: "It bounds the window's WIDTH, not its location. The regular lemma's |xy| <= p pins the pumped part to the front; the CFL version does not, which is why proofs need case analysis over where the window sits.",
      },
    ],
    numericals: [
      {
        question: "A CFL has pumping length p = 6, and s = uvxyz with |s| >= 6. Given |vxy| <= p and |vy| >= 1, what is the maximum possible length of vy?",
        answerMin: 6, answerMax: 6, unit: "symbols",
        solution: "vy is largest when x is empty, so |vy| = |vxy| <= p = **6**. Combined with |vy| >= 1, the length of vy ranges from 1 to 6.",
      },
    ],
    pyqRelevance: "The CFL pumping lemma is asked most often as a statement question - which form of the pumped string is guaranteed, or what |vxy| <= p means - rather than as a full proof, since proofs are hard to mark in 2 marks. The single most common trap is the option offering independent exponents u v^i x y^j z. Expect it to appear alongside the regular pumping lemma so the two can be confused.",
    interviewConnection: "The parse-tree repetition argument behind the lemma is the same pigeonhole reasoning that bounds recursion depth in a grammar - useful when reasoning about why some syntax genuinely cannot be expressed context-freely and needs a semantic check instead.",
    revisionSummary: "s = uvxyz with |vy| >= 1, |vxy| <= p, and u v^i x y^i z in L for all i - same exponent on both. The window bound constrains width, not position. You pick s and i; the adversary picks the split. Necessary, not sufficient.",
    shortNotes: [
      "s = uvxyz. Pump v and y TOGETHER: u v^i x y^i z.",
      "|vy| >= 1, |vxy| <= p.",
      "|vxy| <= p bounds WIDTH, not position (unlike regular's |xy| <= p).",
      "You choose s and i; adversary chooses the split. Beat every split.",
      "Necessary, NOT sufficient. Cannot prove a language IS a CFL.",
      "a^n b^n c^n: take s = a^p b^p c^p; window cannot reach both a's and c's.",
    ],
  },

  // ---------------- Turing Machines and Undecidability ----------------

  "turing-machines": {
    difficulty: "Moderate",
    estimatedMinutes: 40,
    xpReward: 30, coinReward: 12,
    // Verified real (title confirmed via direct fetch, 2026-08-13).
    resources: [{
      kind: "video",
      title: "Turing Machine - Introduction (Part 1) - Neso Academy",
      url: "https://www.youtube.com/watch?v=PvLaPKPzq2I",
      description: "Whole video covers this topic from the start.",
    }],
    whatYoullLearn: [
      "What removing the stack restriction buys: an unbounded, rewritable, randomly-accessible tape",
      "The TM transition, and why halting is a genuinely new possibility",
      "Recursive versus recursively enumerable - the single most important distinction in the topic",
      "Why every reasonable variant (multi-tape, nondeterministic) has exactly the same power",
    ],
    prerequisites: ["Pumping Lemma for Context-Free Languages"],
    concept: `## Take Away The Restriction

::: story
A finite automaton had no memory beyond its state. A PDA had a stack - unbounded, but you could only touch the top.

A Turing machine has a tape: unbounded, **rewritable**, and readable at any position by moving a head left or right.

That is the last restriction to go. What is left is the most powerful model anyone has found - and, per the Church-Turing thesis, the definition of "computable".
:::

::: cards A TM is a seven-tuple
Q, Sigma, q0 :: States, input alphabet, start state.
Gamma :: Tape alphabet. Strictly contains Sigma, plus the blank symbol.
B :: The blank symbol. In Gamma, never in Sigma.
delta :: (state, tape symbol) -> (state, symbol to WRITE, direction L or R).
q_accept, q_reject :: Halting states. Entering either one stops the machine immediately.
:::

::: remember
Every move does three things at once: write a symbol, move the head one cell, change state.

There is no "read without writing" - writing the same symbol back is how you leave a cell alone. And there is no "stay put" in the standard model, though adding one changes nothing about the machine's power.
:::

## The New Possibility: Not Halting

::: story
A DFA always stops - it reads n symbols and it is done. A PDA on a finite input effectively does too.

A Turing machine need never stop. It can loop forever, rewriting the tape, head wandering, no answer ever produced.

That is not a defect. It is the source of everything interesting in the rest of this subject, including undecidability.
:::

::: cards The distinction everything else rests on
Recursive (decidable) :: A TM exists that halts on EVERY input - accept for strings in L, reject for strings not in L. It always answers.
Recursively enumerable (RE) :: A TM exists that halts and accepts every string in L, but on strings NOT in L it may reject OR may loop forever.
:::

::: mistake
Reading "recursively enumerable" as "we can list it, so we can decide it."

You can enumerate an RE language - that is what the name means - but enumeration gives no deadline. If a string has not appeared yet, you cannot tell whether it is absent or merely slow to arrive. That gap is exactly the difference between RE and recursive.
:::

::: remember
**Every recursive language is RE. Not every RE language is recursive.**

And the theorem that makes this usable:

**L is recursive if and only if both L and its complement are RE.**

If you can semi-decide membership and semi-decide non-membership, run both in parallel; one must eventually answer, so you have a decider.
:::

::: checkpoint
L is RE and its complement is also RE. What follows?
- ( ) L is undecidable
- (x) L is recursive - run both semi-deciders in parallel and one is guaranteed to halt
- ( ) L is context-free
- ( ) Nothing can be concluded
> L is recursive. This is the standard characterisation, and it is the workhorse for proving a language is NOT RE: if L is known undecidable but RE, its complement cannot be RE, or L would be recursive.
:::

## All The Variants Are The Same

::: cards Equivalent in power to the standard TM
Multi-tape :: k tapes with independent heads. Simulable on one tape; costs at most a quadratic slowdown, no power.
Nondeterministic :: A set of next moves. Simulated by breadth-first search over configurations - exponential time, same language class.
Two-way infinite tape :: Fold the tape in half and track two tracks.
Multi-head, multi-dimensional tape :: Same story.
:::

::: remember
**NTM = DTM in power.** Note how the pattern has now flipped twice:

NFA = DFA. NPDA **>** DPDA. NTM = DTM.

The pushdown level is the only one where nondeterminism adds power. GATE tests this asymmetry constantly, and the middle case is the one people get wrong.
:::

::: behind
Nondeterminism costing exponential TIME while adding no POWER is exactly where P versus NP lives.

Theory of Computation asks what is computable at all; complexity theory asks how fast. The same NTM/DTM equivalence that is unremarkable here becomes the open problem of the field once a time bound is imposed.
:::

::: interview
The Church-Turing thesis is not a theorem and cannot be proved - it is the claim that anything effectively computable by any means is computable by a Turing machine. Its evidence is that every model anyone has proposed (lambda calculus, recursive functions, register machines, real hardware) has turned out to be exactly equivalent.
:::`,
    deepDive: `A **linear bounded automaton (LBA)** is a TM restricted to the tape cells its input already occupies. LBAs accept exactly the **context-sensitive languages**, Type 1 in the Chomsky hierarchy, which sit strictly between CFLs and recursive languages. { a^n b^n c^n } - not context-free - IS context-sensitive, which is a neat way to see that the hierarchy levels are genuinely distinct.

Two LBA facts recur in GATE: membership for context-sensitive languages IS decidable (the tape is bounded, so configurations are finite and looping can be detected), but **emptiness for LBAs is undecidable**. Also worth knowing: whether deterministic and nondeterministic LBAs are equivalent is a genuinely open problem, the first LBA problem, unlike the settled NTM = DTM.`,
    dryRun: `Trace a TM that decides **{ 0^n 1^n }** on the input **0011**, by repeatedly crossing off one 0 and one 1.

::: timeline Tape trace
Start :: Tape 0011, head on the leftmost 0, state q0.
Cross a 0 :: Write X, move right. Tape X011. Now scan right for the first 1.
Scan right :: Pass over 0s and Xs without changing them, until a 1 is found.
Cross a 1 :: Write Y, move left. Tape X01Y. One pair is now matched.
Return left :: Scan back to the leftmost unmarked 0 and repeat.
Second pass :: Tape XXYY. No unmarked 0s and no unmarked 1s remain.
Accept :: Every 0 was paired with exactly one 1, so the counts were equal.
:::

::: remember
The reason this works and a PDA-style approach is not needed: the head can go BACK.

A stack loses what it pops. This machine rewrites marks in place and re-reads them as often as it likes, which is why a TM can also handle { a^n b^n c^n } - just run the crossing-off pass a third time.
:::`,
    keyPoints: [
      "A TM is a seven-tuple with an unbounded, rewritable tape; each move writes, moves the head, and changes state.",
      "Unlike a DFA or PDA, a TM may never halt - and that possibility is the source of undecidability.",
      "Recursive = a TM that halts on every input. Recursively enumerable = halts and accepts on members, may loop on non-members.",
      "L is recursive if and only if both L and its complement are RE - the standard tool for proving something is not RE.",
      "All variants (multi-tape, nondeterministic, two-way) are equivalent in POWER. NTM = DTM, unlike NPDA > DPDA.",
    ],
    commonMistakes: [
      "Treating recursively enumerable as decidable. Enumeration has no deadline, so absence is never confirmable.",
      "Carrying the NPDA > DPDA asymmetry up to Turing machines. Nondeterminism adds no power at this level.",
      "Assuming a multi-tape TM is more powerful than a single-tape one. It is faster, not stronger.",
      "Forgetting that Gamma strictly contains Sigma and includes the blank - the blank is never an input symbol.",
    ],
    analogies: [
      "A stack is a spike of receipts you can only add to or take from the top. A tape is a notebook: you can flip to any page, read it, cross something out, and come back later. Losing nothing is what makes the difference.",
    ],
    memoryTricks: [
      "The nondeterminism pattern: NFA = DFA, NPDA > DPDA, NTM = DTM. Only the middle one is strict.",
      "Recursive = Reliable (always halts). RE = Rather Eventually (halts on yes, maybe never on no).",
      "L recursive iff L and ~L both RE - \"both directions semi-decidable means fully decidable\".",
    ],
    formulas: [
      { name: "TM transition", expression: "delta: Q x Gamma -> Q x Gamma x {L, R}", note: "Write and move happen on every step; there is no read-only move." },
      { name: "Recursive characterisation", expression: "L recursive  <=>  L is RE and ~L is RE", note: "Run both semi-deciders in parallel; one must halt." },
      { name: "Multi-tape simulation cost", expression: "O(t(n)^2) on a single tape", note: "Quadratic slowdown, no change in the language class." },
    ],
    shortcuts: [
      "If an option claims a multi-tape or nondeterministic TM recognises MORE languages, it is wrong.",
      "To show a language is not RE, show it is the complement of something undecidable but RE.",
    ],
    mcqs: [
      {
        question: "Which is true of nondeterministic versus deterministic Turing machines?",
        options: [
          "NTMs recognise strictly more languages than DTMs",
          "They recognise exactly the same class of languages, though the simulation may cost exponential time",
          "DTMs are strictly more powerful",
          "NTMs cannot recognise recursive languages",
        ],
        correctIndex: 1,
        explanation: "Nondeterminism adds no power at the Turing level - a DTM simulates an NTM by searching the configuration tree. It adds time, not capability. Contrast NPDA > DPDA, where it genuinely does add power.",
      },
      {
        question: "L and its complement are both recursively enumerable. What can be concluded?",
        options: [
          "L is recursive",
          "L is undecidable",
          "L is context-sensitive but not recursive",
          "Nothing further",
        ],
        correctIndex: 0,
        explanation: "Running both semi-deciders in parallel guarantees one halts, giving a decider for L. This is the standard characterisation of recursive languages.",
      },
    ],
    numericals: [
      {
        question: "A single-tape TM's transition function is delta: Q x Gamma -> Q x Gamma x {L, R}. If |Q| = 5 and |Gamma| = 4, how many entries does a fully specified transition table have?",
        answerMin: 20, answerMax: 20, unit: "entries",
        solution: "The domain is Q x Gamma, so the table has |Q| x |Gamma| = 5 x 4 = **20** entries. (Each maps to one of |Q| x |Gamma| x 2 = 40 possible outputs, but the question asks for table size, which is the domain.)",
      },
    ],
    pyqRelevance: "Turing machines are asked mainly for definitions and power comparisons, 1-2 marks. The two highest-frequency items are the recursive-versus-RE distinction (especially the \"L and ~L both RE\" characterisation) and the claim that some TM variant is more powerful, which is always false. LBAs and context-sensitive languages appear in Chomsky-hierarchy questions.",
    interviewConnection: "The Church-Turing thesis is why \"can this be automated at all?\" has a precise answer, and why no programming language is more powerful than any other in the computability sense - only more convenient.",
    revisionSummary: "TM = unbounded rewritable tape with a movable head; every move writes, moves and changes state. May not halt, which is where undecidability comes from. Recursive = always halts; RE = halts on members only. L recursive iff L and ~L both RE. All variants equivalent: NTM = DTM.",
    shortNotes: [
      "delta: Q x Gamma -> Q x Gamma x {L, R}. Write + move + state, every step.",
      "Gamma strictly contains Sigma; blank B is in Gamma, never in Sigma.",
      "Recursive = halts on ALL inputs. RE = halts on members, may loop on non-members.",
      "L recursive <=> L and ~L both RE.",
      "NFA = DFA, NPDA > DPDA, NTM = DTM. Only the middle is strict.",
      "LBA = context-sensitive. CSL membership decidable; LBA emptiness undecidable.",
    ],
  },

  "decidability-and-undecidability": {
    difficulty: "Hard",
    estimatedMinutes: 40,
    xpReward: 35, coinReward: 15,
    // Verified real (title confirmed via direct fetch, 2026-08-13) - covers
    // undecidability via the halting problem specifically, not a general
    // decidability survey.
    resources: [{
      kind: "video",
      title: "Undecidability of the Halting Problem",
      url: "https://www.youtube.com/watch?v=_eM0-KfAmhQ",
      description: "Covers undecidability via the Halting Problem specifically.",
    }],
    whatYoullLearn: [
      "What it means for a problem to be undecidable, as opposed to merely hard",
      "The halting problem and the diagonalisation argument behind it",
      "Rice's theorem - the single most efficient undecidability tool in the syllabus",
      "The standard decidable/undecidable table GATE draws from",
    ],
    prerequisites: ["Turing Machines"],
    concept: `## Not Hard - Impossible

::: story
Undecidable does not mean slow, or unsolved, or needing a better algorithm.

It means **no algorithm exists**, and none ever will, no matter how much time or memory you are given. It is a proof of impossibility, not a statement about current technique.

There are exactly two ways to establish it: diagonalisation from first principles, or reduction from something already known undecidable. Almost all of GATE's questions live in the second category.
:::

::: cards Two levels of "cannot"
Undecidable :: No TM halts on every input with the right answer. The language may still be RE - you can confirm yes, never confirm no.
Not RE :: No TM even semi-decides it. Strictly worse. The complement of the halting problem is the standard example.
:::

## The Halting Problem

::: remember
**HALT = { (M, w) : Turing machine M halts on input w }** is undecidable.

The proof is diagonalisation, and the shape is worth carrying because it recurs.
:::

::: flow
1. Suppose a decider H exists :: H(M, w) returns "halts" or "loops", always, correctly.
2. Build D from H :: D takes a machine description M and runs H(M, M) - asking whether M halts on its own description.
3. Invert the answer :: If H says M halts on M, then D deliberately loops forever. If H says it loops, D halts.
4. Run D on itself :: Ask what D does on input D.
5. Contradiction :: If D halts on D, then by construction it loops. If it loops, it halts. Both impossible, so H cannot exist.
:::

::: behind
The self-reference is doing the work, and it is the same move as Cantor's diagonal argument and Russell's paradox.

Feeding a machine its own description is legal because a TM is just a finite string, and strings are exactly what TMs take as input. That "programs are data" observation is what makes the whole field possible.
:::

::: mistake
Concluding that halting cannot be determined for ANY program.

Plenty of specific programs are obviously analysable - a loop with a fixed bound clearly terminates. Undecidability says there is no SINGLE algorithm that works for **every** (M, w) pair. It is a statement about universality, not about every individual case.
:::

## Rice's Theorem

::: story
Proving each new problem undecidable by its own reduction is slow. Rice's theorem does most of them at once.

**Any non-trivial property of the LANGUAGE recognised by a Turing machine is undecidable.**

Non-trivial means: some TM has the property and some TM does not. That is the only condition.
:::

::: cards What Rice covers, and what it does not
Covered - undecidable :: Is L(M) empty? Regular? Finite? Does it contain a particular string? Is L(M1) = L(M2)? All are properties of the LANGUAGE.
NOT covered :: Does M have 7 states? Does M ever move left? Does M halt within 50 steps? These are properties of the MACHINE, not its language - and they are decidable.
:::

::: remember
The whole skill is telling those two apart.

Ask: **could two machines recognising the same language disagree about this property?** If yes, it is a machine property and Rice does not apply. If no - if the property depends only on the set of accepted strings - Rice applies and it is undecidable.
:::

::: checkpoint
Which of these is DECIDABLE?
- ( ) Does TM M accept a finite language?
- ( ) Is L(M) regular?
- (x) Does TM M have exactly 12 states?
- ( ) Does TM M accept the empty string?
> Counting states. It is a syntactic property of the machine description - just read it off. The other three are properties of the LANGUAGE recognised, so Rice's theorem makes them undecidable.
:::

## The Table GATE Draws From

::: cards Decidable
Regular :: Membership, emptiness, finiteness, equivalence, subset - everything.
CFL :: Membership, emptiness, finiteness.
CSL :: Membership.
TM :: Does M halt within k steps? Does M have n states? (Bounded and syntactic questions.)
:::

::: cards Undecidable
TM :: Halting, emptiness of L(M), finiteness, regularity, equivalence - everything Rice covers.
CFL :: Equivalence, ambiguity, intersection-emptiness, subset, "is L(G) = Sigma*?".
Other :: Post's Correspondence Problem, and LBA emptiness.
:::

::: interview
Notice the pattern down the hierarchy: as the model gets more powerful, fewer questions about it stay answerable.

Regular languages answer everything. CFLs lose equivalence. Turing machines lose essentially everything about their language. Power and analysability trade off directly, and that observation is worth stating out loud.
:::`,
    deepDive: `**Post's Correspondence Problem (PCP)** is the standard undecidable problem that has nothing to do with machines: given a set of domino pairs (top string, bottom string), is there a sequence - repeats allowed - whose top concatenation equals its bottom concatenation? Undecidable in general, though the **bounded** version (at most k dominoes) is decidable by brute force, and PCP over a **unary** alphabet is decidable too. PCP matters because it is the usual bridge for proving CFG problems undecidable - CFL ambiguity and CFL intersection-emptiness are both proved by reduction from PCP.

Worth keeping precise: the halting problem is **RE but not recursive** - you can semi-decide it by simulating and accepting when M halts. Its complement is **not even RE**, because if both were RE the language would be recursive. That is the "L recursive iff L and ~L both RE" theorem doing real work.`,
    dryRun: `Decide whether **"Does TM M accept at least one string of length 5?"** is decidable.

::: timeline Applying Rice's theorem
Identify the property :: "L(M) contains a string of length 5." Note it is stated purely in terms of accepted strings.
Language or machine property? :: Two machines with identical languages must agree on it. So it is a LANGUAGE property - Rice is in scope.
Check non-triviality, part 1 :: Some TM has it. A machine accepting all of Sigma* certainly accepts a length-5 string.
Check non-triviality, part 2 :: Some TM lacks it. A machine accepting nothing does not.
Conclude :: Non-trivial language property, therefore UNDECIDABLE.
:::

::: mistake
Now change one word: **"Does M accept some string within 5 steps?"**

That is bounded, so it is DECIDABLE - simulate every input of length at most 5 for 5 steps and look. Rice does not apply, because two machines with the same language can easily disagree about how fast they accept.

One word moved the question across the boundary. That is exactly the discrimination GATE is testing.
:::`,
    keyPoints: [
      "Undecidable means no algorithm exists for ALL inputs - not that the problem is merely hard or currently unsolved.",
      "The halting problem is undecidable, proved by diagonalisation: build D that inverts what a supposed decider predicts about D itself.",
      "Rice's theorem: EVERY non-trivial property of the LANGUAGE a TM recognises is undecidable.",
      "Rice does not apply to properties of the MACHINE (state count, steps taken) - those are typically decidable.",
      "HALT is RE but not recursive; its complement is not even RE.",
    ],
    commonMistakes: [
      "Reading undecidability as \"no program's halting can ever be determined\". It is about no single universal algorithm, not about every individual case.",
      "Applying Rice's theorem to machine properties like state count or step bounds. Those are decidable.",
      "Forgetting the non-triviality condition - a property held by ALL TMs or by NONE is trivially decidable.",
      "Assuming undecidable implies not RE. Many undecidable languages, HALT included, are RE.",
    ],
    analogies: [
      "Rice's theorem is a blanket verdict: once a question is about WHAT a machine computes rather than HOW it is written, the answer cannot be computed in general. Reading the source is allowed; predicting the behaviour is not.",
    ],
    memoryTricks: [
      "Rice = \"Recognised language In question? Certainly Excluded.\" If the property is about L(M), it is undecidable.",
      "Machine property (states, steps, moves) = decidable. Language property (empty, finite, regular, equal) = undecidable.",
      "Down the hierarchy, decidability drains away: Regular answers all, CFL loses equivalence, TM loses everything.",
    ],
    formulas: [
      { name: "Halting problem", expression: "HALT = { (M, w) : M halts on w }", note: "Undecidable. RE but not recursive." },
      { name: "Rice's theorem", expression: "Every non-trivial property of L(M) is undecidable", note: "Non-trivial = held by some TM and not by others." },
      { name: "Complement fact", expression: "~HALT is not RE", note: "If it were, HALT would be recursive." },
    ],
    shortcuts: [
      "Ask one question: is this about the LANGUAGE or the MACHINE? Language means undecidable, machine usually means decidable.",
      "Any bound - within k steps, on inputs up to length n - makes a question decidable by brute force.",
    ],
    mcqs: [
      {
        question: "Which of these problems about a Turing machine M is DECIDABLE?",
        options: [
          "Is L(M) empty?",
          "Is L(M) regular?",
          "Does M halt on input w within 100 steps?",
          "Is L(M) finite?",
        ],
        correctIndex: 2,
        explanation: "A step BOUND makes it decidable - simulate 100 steps and observe. The other three are non-trivial properties of the language recognised, so Rice's theorem makes them undecidable.",
      },
      {
        question: "The halting problem is:",
        options: [
          "Recursive",
          "Recursively enumerable but not recursive",
          "Not recursively enumerable",
          "Context-sensitive",
        ],
        correctIndex: 1,
        explanation: "Simulating M on w and accepting if it halts semi-decides HALT, so it is RE. Diagonalisation shows no decider exists, so it is not recursive. Its COMPLEMENT is the one that is not RE.",
      },
    ],
    numericals: [
      {
        question: "Of the following five problems, how many are undecidable? (1) DFA equivalence, (2) CFL equivalence, (3) TM halting, (4) whether L(M) is regular for a TM M, (5) whether a TM has 10 states.",
        answerMin: 3, answerMax: 3, unit: "problems",
        solution: "Undecidable: (2) CFL equivalence, (3) TM halting, (4) regularity of L(M) by Rice. Decidable: (1) DFA equivalence, and (5) state count, which is syntactic. So **3**.",
      },
    ],
    pyqRelevance: "Decidability is one of the highest-yield GATE topics in this subject, appearing nearly every year for 1-2 marks. The dominant form is a multi-statement question mixing decidable and undecidable problems, and Rice's theorem plus the machine-versus-language distinction resolves most of them. \"Does M halt within k steps\" is the most common decidable distractor placed among undecidable options.",
    interviewConnection: "This is why static analysers are necessarily conservative: perfect dead-code or infinite-loop detection would decide halting, so real tools accept false positives by design rather than by weakness.",
    revisionSummary: "Undecidable = no algorithm for all inputs. HALT is undecidable by diagonalisation, is RE, and its complement is not RE. Rice: every non-trivial property of L(M) is undecidable, but machine properties and step-bounded questions are decidable. Decidability drains away as models get more powerful.",
    shortNotes: [
      "Undecidable = no algorithm for ALL inputs (not merely hard).",
      "HALT undecidable (diagonalisation). HALT is RE; ~HALT is NOT RE.",
      "Rice: every non-trivial property of L(M) is undecidable.",
      "Rice does NOT cover machine properties (state count, k-step bounds) - those are decidable.",
      "Decidable: DFA everything; CFL membership/emptiness/finiteness; CSL membership.",
      "Undecidable: CFL equivalence/ambiguity; all Rice properties; PCP; LBA emptiness.",
    ],
  },

  "reductions-and-the-halting-problem": {
    difficulty: "Hard",
    estimatedMinutes: 35,
    xpReward: 35, coinReward: 15,
    // Verified real (title confirmed via direct fetch, 2026-08-13).
    resources: [{
      kind: "video",
      title: "Halting Problem Reduction - Theory of Computation",
      url: "https://www.youtube.com/watch?v=TBWEnz8euxo",
      description: "Whole video covers this topic from the start.",
    }],
    whatYoullLearn: [
      "What a mapping reduction is, and the direction that makes a proof valid",
      "How to prove a new problem undecidable by reducing FROM a known one",
      "The direction error that invalidates most attempted reduction proofs",
      "How reductions establish not-RE, not just undecidable",
    ],
    prerequisites: ["Decidability and Undecidability"],
    concept: `## Borrowing Impossibility

::: story
Diagonalisation is hard work, and you only need to do it once. After the halting problem, every other undecidability proof can borrow from it.

The tool is **reduction**: show that if you could solve your new problem B, you could use that solution to solve a problem A already known unsolvable. Since A is impossible, B must be too.

You are transferring impossibility, not discovering it fresh.
:::

::: remember
**A reduces to B**, written A <=_m B, means there is a COMPUTABLE function f such that:

  w is in A  if and only if  f(w) is in B

f must always halt, and the equivalence must hold in both directions. f is a translator of instances, not a solver of anything.
:::

## The Direction Is Everything

::: cards Get this backwards and the proof says nothing
To prove B UNDECIDABLE :: Reduce a KNOWN-undecidable A **to** B. A <=_m B. "If B were decidable, so would A be - contradiction."
To prove B DECIDABLE :: Reduce B **to** a known-decidable problem. B <=_m A.
:::

::: mistake
The single most common error in this topic: reducing **B to HALT** and concluding B is undecidable.

That shows only that B is no harder than HALT - which is true of a great many perfectly decidable problems. It proves nothing at all about B.

The correct direction is **HALT <=_m B**: use a hypothetical decider for B to build one for HALT.
:::

::: remember
A one-line sanity check that catches the error every time:

**Reduce FROM the hard problem TO the new one.** The known-impossible thing goes on the LEFT of <=_m.

If your proof never assumes a decider for B exists, you are reducing the wrong way.
:::

::: checkpoint
You want to prove problem X is undecidable. Which reduction works?
- ( ) Reduce X to HALT
- (x) Reduce HALT to X
- ( ) Reduce X to a decidable problem
- ( ) Either direction proves it
> Reduce HALT to X. That assumes a decider for X and uses it to decide HALT, which is impossible - so no decider for X exists. Reducing X to HALT only shows X is no harder than HALT, which is unremarkable.
:::

## The Shape Of A Proof

::: flow
1. State the assumption :: Suppose a decider R for B exists.
2. Build a decider for A :: Construct S, which on input w computes f(w) and runs R on it.
3. Verify the equivalence :: Argue that w is in A exactly when f(w) is in B, so S is correct.
4. Note that f is computable :: The construction must always halt - otherwise S is not a decider.
5. Contradiction :: S decides A, which is known undecidable. So R cannot exist.
:::

::: behind
Step 4 is the one people skip, and it matters. f must be a total computable function - it builds a new instance and returns it, and it must never itself loop.

Note that f is not required to RUN anything. It typically constructs a machine description and hands it over. Building a machine that would loop is fine; looping while building it is not.
:::

## Beyond Undecidable

::: story
Reductions also establish the stronger claim: not even recursively enumerable.

If A is not RE and A <=_m B, then B is not RE either. Since ~HALT is not RE, reducing ~HALT to something proves that something is not RE.
:::

::: cards The standard results this produces
HALT :: RE, not recursive. Reduce from it for ordinary undecidability.
~HALT :: Not RE. Reduce from it to prove a problem is not even semi-decidable.
EQ_TM :: Whether two TMs recognise the same language - neither it nor its complement is RE.
:::

::: interview
The relationship to Rice's theorem is worth stating: Rice IS a reduction argument, packaged.

Its proof reduces HALT to an arbitrary non-trivial language property. So when you invoke Rice, you are invoking a reduction someone already performed for you - which is exactly why it saves so much time in an exam.
:::`,
    deepDive: `The reduction defined here is **many-one** (mapping) reduction, A <=_m B, which transforms one instance into one instance. The more permissive **Turing reduction**, A <=_T B, lets you call an oracle for B any number of times and use the answers freely.

The distinction matters in one specific place GATE occasionally probes: many-one reductions preserve RE-ness, Turing reductions do not. A language and its complement are always Turing-equivalent (just invert the oracle's answer), so HALT <=_T ~HALT - yet HALT is RE and ~HALT is not. If Turing reductions preserved RE-ness, that would be a contradiction. For undecidability arguments either kind works, but only many-one reductions can establish the not-RE results above.`,
    dryRun: `Prove **E_TM = { M : L(M) is empty }** is undecidable, by reducing from HALT.

::: timeline The reduction
Assume :: A decider R for E_TM exists - it tells us whether a given machine accepts nothing.
Take a HALT instance :: An arbitrary pair (M, w). We want to decide whether M halts on w.
Construct a new machine M' :: On any input x, M' ignores x, runs M on w, and accepts if that run halts.
Note what L(M') is :: If M halts on w, M' accepts EVERY input, so L(M') = Sigma*, non-empty. If M never halts, M' accepts nothing, so L(M') is empty.
Run the decider :: R(M') answers "empty" exactly when M does NOT halt on w.
Contradiction :: Inverting R's answer decides HALT, which is impossible. So R does not exist.
:::

::: remember
Two details that make this a valid proof rather than a sketch.

The construction of M' always halts - we only WRITE a machine description, we never run it. And M' ignores its own input entirely, which is what forces L(M') to be all-or-nothing and makes the emptiness question line up exactly with halting.
:::`,
    keyPoints: [
      "A <=_m B means a total computable f exists with w in A iff f(w) in B - a translator of instances, not a solver.",
      "To prove B undecidable, reduce a KNOWN-undecidable problem TO B. The hard problem goes on the LEFT.",
      "Reducing B to HALT proves nothing about B - it only shows B is no harder than HALT.",
      "The reduction function must always halt; it typically constructs a machine description without running it.",
      "If A is not RE and A <=_m B, then B is not RE - which is how not-RE results are obtained.",
    ],
    commonMistakes: [
      "Reducing in the wrong direction. This is the dominant error, and it invalidates the proof entirely.",
      "Building a reduction function that may loop. f must be total, or the constructed decider is not a decider.",
      "Confusing many-one with Turing reductions. Only many-one preserves RE-ness.",
      "Forgetting to verify BOTH directions of \"w in A iff f(w) in B\". One direction is not enough.",
    ],
    analogies: [
      "A reduction is a translation service, not a solution. You show that anyone who could answer questions in language B could answer them in language A too - so if A's questions are known unanswerable, B's must be as well.",
    ],
    memoryTricks: [
      "\"Reduce FROM hard TO new.\" The known-impossible problem is on the left of <=_m.",
      "If your proof never says \"suppose a decider for the NEW problem exists\", you are going the wrong way.",
      "Many-one preserves RE. Turing does not - HALT <=_T ~HALT, yet only one of them is RE.",
    ],
    formulas: [
      { name: "Mapping reduction", expression: "A <=_m B  iff  exists total computable f with (w in A <=> f(w) in B)", note: "f must always halt." },
      { name: "Undecidability transfer", expression: "A undecidable and A <=_m B  =>  B undecidable", note: "Direction is essential: A is the known-hard one." },
      { name: "Not-RE transfer", expression: "A not RE and A <=_m B  =>  B not RE", note: "Reduce from ~HALT to prove not-RE." },
    ],
    shortcuts: [
      "The standard construction: build M' that ignores its input, runs M on w, and accepts if that halts. It converts almost any language property into a halting question.",
      "If a question asks which reduction proves undecidability, pick the one with the known-hard problem on the left.",
    ],
    mcqs: [
      {
        question: "To prove problem X undecidable using the halting problem, which reduction is correct?",
        options: [
          "Reduce X to HALT",
          "Reduce HALT to X",
          "Reduce X to a decidable problem",
          "Either direction is valid",
        ],
        correctIndex: 1,
        explanation: "HALT <=_m X assumes a decider for X and builds one for HALT - a contradiction, so no decider for X exists. Reducing X to HALT only shows X is no harder than HALT, which many decidable problems also satisfy.",
      },
      {
        question: "A is not recursively enumerable and A <=_m B. What follows about B?",
        options: [
          "B is recursive",
          "B is RE but not recursive",
          "B is not RE",
          "Nothing can be concluded",
        ],
        correctIndex: 2,
        explanation: "Many-one reductions preserve RE-ness downward: if B were RE, composing with the computable f would make A RE too. So B is not RE.",
      },
    ],
    numericals: [
      {
        question: "In the reduction proving E_TM undecidable, a machine M' is constructed that ignores its input and runs M on w. For a given (M, w), how many distinct possible values can L(M') take?",
        answerMin: 2, answerMax: 2, unit: "values",
        solution: "Because M' ignores its input, it either accepts everything or nothing: L(M') = Sigma* if M halts on w, or L(M') = {} if it does not. Exactly **2** possibilities, and that all-or-nothing behaviour is precisely what makes the emptiness test line up with halting.",
      },
    ],
    pyqRelevance: "Reductions appear both directly - which reduction direction proves undecidability - and implicitly, since most decidable/undecidable classification questions are settled by Rice's theorem, itself a packaged reduction. The direction question is the most common explicit form, and the wrong direction is always offered as a distractor. Expect 1-2 marks.",
    interviewConnection: "The same transfer-of-hardness argument is how NP-completeness is established; only the resource being conserved changes, from computability to polynomial time.",
    revisionSummary: "A <=_m B: total computable f with w in A iff f(w) in B. To prove B undecidable, reduce a known-undecidable A TO B - hard problem on the left. Reducing B to HALT proves nothing. Many-one reductions also transfer not-RE-ness; Turing reductions do not. Rice's theorem is a pre-packaged reduction from HALT.",
    shortNotes: [
      "A <=_m B: total computable f, w in A <=> f(w) in B.",
      "Prove B undecidable: reduce FROM known-hard A TO B (A on the LEFT).",
      "Reducing B to HALT proves NOTHING about B.",
      "f must always halt - it builds a machine description, it does not run it.",
      "A not RE and A <=_m B => B not RE. Reduce from ~HALT.",
      "Many-one preserves RE; Turing does not (HALT <=_T ~HALT).",
      "Rice's theorem = a packaged reduction from HALT.",
    ],
  }
};
