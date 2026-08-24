// GATE Digital Logic - authored lesson content. Follows the authoring rules
// documented at the top of general-aptitude.mjs.
//
// "karnaugh-map" is authored elsewhere already and is deliberately absent from
// this file - write-gate-lessons.mjs only touches the topic keys present in a
// subject's exported object, so leaving a key out means "don't touch it",
// not "delete it".
//
// status is intentionally absent: scripts/write-gate-lessons.mjs excludes it from
// CONTENT_FIELDS, because publication state belongs to the syllabus seeder, not to
// a lesson body.

export const DIGITAL_LOGIC = {

  // ---------------- Boolean Algebra and Minimization ----------------

  "boolean-algebra-fundamentals": {
    difficulty: "Easy",
    estimatedMinutes: 25,
    xpReward: 20, coinReward: 8,
    // Verified real (title confirmed via direct fetch, 2026-08-13) - a
    // dedicated single-topic video, so 0:00 genuinely is the right start,
    // not a placeholder guess.
    resources: [{
      kind: "video",
      title: "Introduction to Boolean Algebra (Part 1) - Neso Academy",
      url: "https://www.youtube.com/watch?v=WW-NPtIzHwk",
      description: "Whole video covers this topic from the start.",
    }],
    whatYoullLearn: [
      "The handful of laws that every boolean simplification in this subject reduces to",
      "Duality - why every law has a mirror-image partner for free",
      "SOP and POS - the two standard ways to write any boolean function",
      "How to prove an identity algebraically instead of guessing",
    ],
    prerequisites: [],
    concept: `## An Algebra With Only Two Numbers

::: story
Ordinary algebra has infinitely many numbers to work with. Boolean algebra has exactly two: 0 and 1, true and false, off and on.

That sounds like it should make things simpler, and it does - but it also means the rules are not quite the ones you already know. \`1 + 1 = 1\` here, not 2. Once you accept that OR is not addition and AND is not multiplication, the rest of the subject is just learning a short, fixed list of laws and reusing them.
:::

::: remember
Every gate you will ever draw is one of three operations underneath: **AND** (both must be true), **OR** (at least one must be true), **NOT** (flip it). Everything else - XOR, NAND, a whole adder circuit - is built out of those three.
:::

## The Laws Worth Knowing Cold

::: cards The core identities
Identity :: A + 0 = A, and A . 1 = A. Combining with the "do nothing" element changes nothing.
Null :: A + 1 = 1, and A . 0 = 0. Combining with the "dominant" element always wins.
Idempotent :: A + A = A, and A . A = A. Repeating yourself changes nothing.
Complement :: A + A' = 1, and A . A' = 0. A variable and its opposite always resolve to the extreme.
Distributive :: A(B + C) = AB + AC, and A + BC = (A+B)(A+C). Both directions work, unlike ordinary algebra.
De Morgan :: (A + B)' = A'B', and (AB)' = A' + B'. Break the bar, flip the operator, flip each variable.
:::

::: mistake
The second De Morgan's law is the one candidates forget under pressure: **(AB)' = A' + B'**, not A'B'. Breaking a NAND's bar should always widen an AND into an OR - if your rewritten expression still has an AND in it, you have applied the law backwards.
:::

## Duality Is A Free Second Law

::: story
Look at the cards above again: every law has a twin, formed by swapping every AND for an OR, every OR for an AND, and every 0 for a 1 (and vice versa). That is not a coincidence - it is a theorem.
:::

The **principle of duality** says that any true boolean identity remains true after that swap. Prove one direction of a law and you get the other for free; there is no need to separately verify A + 1 = 1 once you already know A . 0 = 0.

::: checkpoint
Apply De Morgan's law to (A + B'C)'.
- ( ) A' + B'C
- (x) A'(B + C')
- ( ) A' . B'C
- ( ) A' + BC'
> Treat (A + B'C) as X + Y with X = A and Y = B'C. (X+Y)' = X'Y' = A' . (B'C)'. Then apply De Morgan again inside: (B'C)' = B + C'. So the full simplification is A'(B + C'). Two applications of the same law, one nested inside the other - that nesting is exactly what GATE tests.
:::

## Two Standard Forms

Any boolean function can be written as a **sum of products (SOP)** - an OR of AND terms, like AB' + A'C - or a **product of sums (POS)** - an AND of OR terms, like (A+B)(A'+C). A truth table converts directly to either: read the SOP off the rows where the output is 1, and the POS off the rows where it is 0 (complementing each variable as you go).

::: interview
SOP maps directly onto a two-level AND-then-OR circuit, and POS onto OR-then-AND. Neither form is "more correct" - GATE questions sometimes ask specifically for POS, and reaching for SOP out of habit is a wasted derivation.
:::`,
    keyPoints: [
      "Boolean algebra has exactly two values, and AND/OR/NOT are the only primitive operations - everything else is built from them.",
      "The core laws - identity, null, idempotent, complement, distributive, De Morgan - are a short fixed list, not something to re-derive each time.",
      "De Morgan's second law is (AB)' = A' + B', not A'B' - breaking a bar always flips AND to OR or OR to AND.",
      "Duality: swap every AND<->OR and 0<->1 in a true identity and it stays true, which halves the number of laws actually worth memorising.",
      "Every function has both an SOP form (read off the 1-rows of a truth table) and a POS form (read off the 0-rows, complemented).",
    ],
    analogies: [
      "Boolean AND/OR/NOT are like a light switch circuit: AND is two switches in series (both must close), OR is two switches in parallel (either closes the circuit), NOT is a switch wired to invert what it's given.",
    ],
    commonMistakes: [
      "Writing (AB)' as A'B' instead of A' + B' - the bar-break always flips the operator, not just the variables.",
      "Treating boolean + like arithmetic addition and getting confused by 1 + 1 = 1.",
      "Forgetting the distributive law works in both directions: A + BC = (A+B)(A+C) is true, and it looks unfamiliar because ordinary algebra has no equivalent.",
      "Applying a law to only part of a nested expression and stopping, instead of applying it again to the newly exposed sub-expression.",
    ],
    memoryTricks: [
      "De Morgan: \"break the bar, flip the sign, keep the letters\" - (AB)' = A' + B', (A+B)' = A'B'.",
      "Duality: swap + and ., swap 0 and 1, keep every variable exactly as it is.",
      "SOP reads the 1s of a truth table, POS reads the 0s (and complements as it reads).",
    ],
    formulas: [
      "De Morgan: (A + B)' = A'B'   and   (AB)' = A' + B'.",
      "Complement laws: A + A' = 1, A . A' = 0.",
      "Distributive (both directions): A(B+C) = AB + AC, and A + BC = (A+B)(A+C).",
    ],
    shortcuts: [
      "To apply De Morgan to a multi-term expression, work from the outermost bar inward, one operator at a time - never try to flip everything in one jump.",
      "If you know a law is true, get its dual for free by swapping AND/OR and 0/1 rather than re-deriving it.",
    ],
    pyqRelevance: `Pure Boolean algebra rarely gets its own question, but a wrong De Morgan or distributive step is the single most common way a GATE minimization question goes wrong before the student even reaches the K-map. Expect it folded into "simplify this expression" or "which of these expressions equals F" at 1 mark.`,
    interviewConnection: `Every short-circuit condition you write (\`if (a && b)\`, \`if (!(x || y))\`) is boolean algebra, and De Morgan's law is exactly the tool for rewriting \`!(a && b)\` as \`!a || !b\` - a rewrite that shows up constantly when simplifying guard clauses or negating a filter predicate.`,
    revisionSummary: `Two values, three primitive operations: AND, OR, NOT. Core laws: identity, null, idempotent, complement, distributive (both directions), De Morgan.

De Morgan breaks the bar and flips the operator: (AB)' = A' + B', (A+B)' = A'B'.

Duality: swap AND/OR and 0/1 in any true law to get another true law for free.

Every function has an SOP form (OR of ANDs, from the 1-rows) and a POS form (AND of ORs, from the 0-rows, complemented).`,
    shortNotes: {
      oneMinute: "AND/OR/NOT are the only primitives. De Morgan: break bar, flip operator, keep variables - (AB)'=A'+B', (A+B)'=A'B'. Duality swaps +/. and 0/1 for a free second law. SOP = OR of ANDs from the 1-rows; POS = AND of ORs from the 0-rows (complemented).",
    },
    mcqs: [
      {
        question: "Simplify (A + B)(A + B') using boolean algebra.",
        options: ["A", "B", "A + B", "AB"],
        correctIndex: 0,
        explanation: "(A+B)(A+B') = A + BB' (by the distributive law A + BC = (A+B)(A+C), read right to left) = A + 0 = A.",
      },
      {
        question: "What is the correct application of De Morgan's law to (A' + BC)'?",
        options: ["A + (BC)'", "A . (B' + C')", "A' . B'C'", "A + B'C'"],
        correctIndex: 1,
        explanation: "(A' + BC)' = (A')' . (BC)' = A . (B' + C'). Both the outer OR-to-AND flip and the inner AND-to-OR flip must happen.",
      },
      {
        question: "Which pair correctly illustrates the principle of duality?",
        options: [
          "A + 0 = A  and  A . 0 = A",
          "A + 1 = 1  and  A . 0 = 0",
          "A + A = A  and  A . A = 1",
          "A + A' = A  and  A . A' = A'",
        ],
        correctIndex: 1,
        explanation: "Duality swaps + with . and 0 with 1. A + 1 = 1 dualises to A . 0 = 0, and this pair is exactly the null law stated both ways. The other options break the swap rule somewhere.",
      },
    ],
  },

  "logic-gates-and-universal-gates": {
    difficulty: "Easy",
    estimatedMinutes: 25,
    xpReward: 20, coinReward: 8,
    // Verified real (title confirmed via direct fetch, 2026-08-13).
    resources: [{
      kind: "video",
      title: "NAND Gate as Universal Gate (Part 1) - Neso Academy",
      url: "https://www.youtube.com/watch?v=ChtmE09BSy0",
      description: "Focuses on universal gates specifically - watch after you already know the basic gate truth tables.",
    }],
    whatYoullLearn: [
      "The truth table and symbol for every standard gate, XOR and XNOR included",
      "Why NAND and NOR are called 'universal' and what that buys a chip designer",
      "Building AND, OR and NOT out of nothing but NAND (or nothing but NOR)",
      "Reading XOR as a 'difference detector' rather than memorising its table",
    ],
    prerequisites: ["Boolean Algebra Fundamentals"],
    concept: `## A Gate Is Just A Physical Boolean Operator

::: story
Boolean algebra gives you the operations. A logic gate is the actual physical device - a handful of transistors - that computes one of them on real electrical signals. A high voltage is read as 1, a low voltage as 0, and the gate does the rest.
:::

::: cards The standard gates
AND :: Output 1 only if every input is 1. The strictest gate.
OR :: Output 1 if at least one input is 1. The most permissive.
NOT :: Flips a single input. Also called an inverter.
NAND :: AND, then NOT. Output 0 only if every input is 1.
NOR :: OR, then NOT. Output 1 only if every input is 0.
XOR :: Output 1 if the inputs DIFFER. A "difference detector", not an "OR that excludes both".
XNOR :: Output 1 if the inputs are the SAME. The exact complement of XOR.
:::

::: remember
XOR is worth its own mental model rather than a memorised table: with two inputs, XOR is 1 exactly when they disagree. That single sentence generates the whole truth table faster than recalling four rows.
:::

## Why "Universal" Is Not Just A Name

::: story
A chip fab that manufactures only one kind of gate is cheaper to build and easier to test than one that stocks five different gate types. NAND and NOR make that possible, because either one alone can build every other gate.
:::

::: flow
NOT from NAND :: Tie both inputs of a NAND to the same signal A. NAND(A,A) = (AA)' = A'.
AND from NAND :: Feed A and B into a NAND, then invert the result with the NOT you just built. NAND then NOT is exactly AND.
OR from NAND :: Invert A and B first (using the NOT above), then NAND the two inverted signals. By De Morgan, NAND(A', B') = (A'B')' = A + B.
:::

The identical trick works starting from NOR instead: NOR(A,A) gives NOT, NOR-then-NOT gives OR, and NORing two inverted inputs gives AND. **NAND and NOR are each individually universal; AND, OR and NOT are not** - none of those three, alone, can produce a NOT-free... actually none of AND/OR/NOT alone can build the others, because you can never manufacture an inversion out of AND and OR alone, however many of them you chain (they are both monotonic - increasing an input never decreases the output).

::: mistake
The most common exam trap: claiming XOR or XNOR is universal. Neither is. XOR(A,A) = 0 always, and no combination of XOR gates alone can produce an AND. Universality belongs specifically to NAND and NOR.
:::

::: checkpoint
Which single gate, wired with both its inputs tied together, produces a NOT gate?
- ( ) AND
- ( ) OR
- (x) NAND (or NOR)
- ( ) XOR
> NAND(A,A) = (A.A)' = A' and NOR(A,A) = (A+A)' = A'. Tying an AND or OR's inputs together just reproduces A itself (A.A = A, A+A = A), which is why only NAND and NOR give an inverter this way.
:::

## Reading A Gate Diagram Under Time Pressure

::: tip
When a diagram mixes bubbles (inversions) and gate shapes, count bubbles along the path to each output rather than re-deriving the whole expression from scratch. An even number of bubbles between a signal and where it is used cancels out; an odd number inverts it. This single habit is faster than symbolic simplification for "what does this circuit compute" questions.
:::`,
    deepDive: `## NOR-Only Construction, Worked The Same Way

Building everything from NOR mirrors the NAND construction exactly, by duality: NOT is NOR(A,A) = (A+A)' = A'. OR is NOR-then-NOT: invert a NOR's output to undo the final complement. AND is NOR of two pre-inverted signals: NOR(A', B') = (A'+B')' = AB by De Morgan.

## Gate Counting As An Exam Skill

GATE sometimes asks "minimum number of NAND gates to implement F" rather than "draw the circuit". The fast approach is to write F in a form that is naturally NAND-shaped: SOP expressions map onto two levels of NAND directly, because NAND(NAND(A,B), NAND(C,D)) associated the right way reproduces an SOP's AND-then-OR structure without ever needing a separate inverter, courtesy of the same double-negation trick used above.`,
    keyPoints: [
      "AND, OR and NOT are the primitives; NAND, NOR, XOR and XNOR are all built from combinations of them.",
      "XOR outputs 1 exactly when its inputs differ; XNOR outputs 1 exactly when they match - treat these as difference/match detectors, not tables to memorise.",
      "NAND and NOR are each individually universal: every other gate can be built from repeated use of just one of them.",
      "AND, OR, XOR and XNOR are NOT universal - none of them can produce an inversion no matter how many are chained.",
      "The standard construction: tie a NAND's/NOR's inputs together for NOT, then use that NOT to build OR/AND from NAND, or AND/OR from NOR.",
    ],
    analogies: [
      "NAND and NOR are like a single Swiss Army knife blade that can be reshaped into any tool you need, while AND/OR/NOT alone are three separate single-purpose tools that can never be combined into a fourth.",
    ],
    commonMistakes: [
      "Claiming XOR or XNOR is a universal gate - neither is, since neither can produce an AND or an inversion-free building block on its own.",
      "Forgetting that tying an AND or OR gate's inputs together just reproduces the same signal, while doing it to NAND or NOR produces an inverter.",
      "Misreading XOR's truth table by treating it as 'OR but not both' without checking what happens when both inputs are 0 (XOR gives 0, matching OR there).",
      "Losing track of bubble (inversion) count when reading a mixed gate diagram, and getting the final polarity backwards.",
    ],
    memoryTricks: [
      "XOR = 'differ'. XNOR = 'same'. Say the word, not the table.",
      "Only N-gates are universal: NAND, NOR. Remember it by the shared letter N.",
      "Tie the inputs together: NAND/NOR becomes NOT. AND/OR just becomes itself.",
    ],
    formulas: [
      "XOR: A xor B = AB' + A'B. XNOR: A xnor B = AB + A'B' = (A xor B)'.",
      "NOT from NAND: NAND(A,A) = A'. NOT from NOR: NOR(A,A) = A'.",
      "OR from NAND: NAND(A', B') = A + B (De Morgan). AND from NOR: NOR(A', B') = AB (De Morgan).",
    ],
    shortcuts: [
      "For 'is this gate universal' questions, check one thing only: can it produce a NOT by itself? If not, it cannot be universal.",
      "Count inversion bubbles along a signal path instead of writing out the boolean expression - even count cancels, odd count inverts.",
    ],
    pyqRelevance: `Gate identification and NAND/NOR-only implementation are recurring 1-mark questions - "implement F using only NAND gates" or "identify the universal gate(s) from this list". The XOR-is-not-universal trap and the tie-inputs-together-for-NOT construction both come up often enough to be worth memorising outright rather than re-deriving.`,
    interviewConnection: `Hardware description languages and even software boolean masks reuse this exact vocabulary - a "NAND flash" chip is named for this gate for a reason connected to how it's built. More broadly, recognising that a chain of simple operations (however many ANDs and ORs) can never produce a negation without an explicit NOT is the same reasoning behind why certain small function sets in any logic system are or aren't 'complete'.`,
    revisionSummary: `AND/OR/NOT are the primitives. XOR = differ, XNOR = same. NAND and NOR are each universal - tie their inputs together for NOT, then build OR/AND (from NAND) or AND/OR (from NOR) using that NOT and De Morgan. AND, OR, XOR, XNOR are never universal alone, because none of them can create an inversion.`,
    shortNotes: {
      oneMinute: "XOR = differ, XNOR = same. NAND/NOR are universal (tie inputs together = NOT, then build the rest via De Morgan). AND/OR/XOR/XNOR are never universal alone - they can't create an inversion. Count bubbles on a diagram: even cancels, odd inverts.",
    },
    mcqs: [
      {
        question: "Which of the following gates is universal?",
        options: ["XOR", "XNOR", "NOR", "OR"],
        correctIndex: 2,
        explanation: "NOR can build NOT (tie its inputs together), and from NOT it can build AND and OR too, so every gate is reachable from NOR alone. None of XOR, XNOR, or OR can produce an inversion by themselves.",
      },
      {
        question: "A NAND gate has both its inputs tied to the same signal A. What is its output?",
        options: ["A", "A'", "0", "1"],
        correctIndex: 1,
        explanation: "NAND(A,A) = (A . A)' = A' by the idempotent law followed by NOT. This is the standard first step in building a NOT gate out of NAND.",
      },
      {
        question: "For two inputs A and B, XOR(A,B) equals 1 exactly when:",
        options: ["Both A and B are 1", "Both A and B are 0", "A and B are different", "At least one of A, B is 1"],
        correctIndex: 2,
        explanation: "XOR is a difference detector: it outputs 1 only when its two inputs disagree (one 0, one 1), and 0 when they agree, whether both are 0 or both are 1.",
      },
    ],
  },

  "algebraic-minimization-technique": {
    difficulty: "Moderate",
    estimatedMinutes: 30,
    xpReward: 25, coinReward: 10,
    // Verified real (title confirmed via direct fetch, 2026-08-13).
    resources: [{
      kind: "video",
      title: "Boolean Algebra Examples (Part 1) - Neso Academy",
      url: "https://www.youtube.com/watch?v=k04ksfLBuak",
      description: "Worked algebraic-minimization examples.",
    }],
    whatYoullLearn: [
      "Minimizing a boolean expression by repeated law application, without a map",
      "The consensus theorem and why it removes a term nobody notices is redundant",
      "Recognising when algebraic simplification has genuinely stalled",
      "Why the K-map exists even though algebra can, in principle, do the same job",
    ],
    prerequisites: ["Boolean Algebra Fundamentals", "Logic Gates and Universal Gates"],
    concept: `## Simplification By Hand, One Law At A Time

::: story
Before Karnaugh maps, this was the only tool available: stare at an expression, spot which law applies, apply it, and repeat until nothing more simplifies. It still matters, because K-maps stop being practical past five or six variables, and because GATE occasionally hands you an expression rather than a truth table - algebra is the only route in.
:::

The whole technique is really just **A + A'B = A + B** (absorption's cousin) and **AB + AB' = A** (combining) applied over and over, dressed up in different variable names each time.

::: cards The moves that do all the real work
Combining :: AB + AB' = A. Two terms differing in exactly one literal collapse into one, dropping that literal.
Absorption :: A + AB = A. If A is already guaranteed, ANDing it with anything adds nothing.
A different absorption :: A + A'B = A + B. This one is less obvious and is where most missed simplifications live.
Factoring :: AB + AC = A(B + C). Pull a common literal out before trying anything else.
:::

::: remember
**A + A'B = A + B** is worth memorising directly rather than re-deriving, because it does not look like an identity at first glance. Proof: A + A'B = (A + A')(A + B) [distributive] = 1 . (A+B) = A + B.
:::

## The Consensus Theorem

::: story
Sometimes an expression has a term that is provably redundant even though it does not obviously combine with anything else - it is implied by two OTHER terms working together.
:::

**AB + A'C + BC = AB + A'C.** The BC term is called the *consensus* of AB and A'C, and it can always be dropped - proof: whenever BC = 1, either B or C alone with the right partner already forces AB or A'C to be 1 too (case on A). GATE likes to hide a consensus term in a longer expression and ask which literal-count is minimal.

::: checkpoint
Simplify: AB + A'C + BC.
- ( ) AB + A'C + BC (already minimal)
- (x) AB + A'C
- ( ) A + B + C
- ( ) BC
> BC is the consensus term of AB and A'C and can be dropped without changing the function - this is the consensus theorem, not a coincidence specific to this expression.
:::

## Knowing When To Stop

::: mistake
The most common algebraic-minimization failure is not a wrong step - it is stopping too early, having applied one valid simplification and declared victory without checking whether ANOTHER law now applies to the new, shorter expression.
:::

::: flow
Look for a factoring opportunity :: Common literal across two or more terms?
Look for A + A'B shape :: Anywhere a variable and its complement both appear, ANDed with different partners?
Look for a consensus term :: A term that is implied by two others together?
Repeat on the result :: Every simplification can expose a NEW one. Stop only when a full pass changes nothing.
:::

::: interview
Algebraic minimization does not scale, and that is the actual lesson: a human can lose track of which law to try next once an expression passes about five terms. That is precisely the gap the Karnaugh map and the tabular (Quine-McCluskey) method exist to close - visually for small variable counts, mechanically (computably) for larger ones.
:::`,
    keyPoints: [
      "Two core moves do almost all the work: AB + AB' = A (combining) and A + A'B = A + B (the less obvious absorption).",
      "The consensus theorem: AB + A'C + BC = AB + A'C - the BC term is implied by the other two and can always be dropped.",
      "Algebraic minimization has no stopping rule of its own - keep re-scanning the simplified expression, because one simplification often exposes another.",
      "This method does not scale past a handful of terms, which is exactly the practical reason Karnaugh maps and Quine-McCluskey exist.",
    ],
    analogies: [
      "Algebraic minimization is like manually simplifying a fraction one common factor at a time - it always works, but past a certain size you want a mechanical procedure (long division, or here, a K-map) instead of eyeballing it.",
    ],
    commonMistakes: [
      "Stopping after one valid simplification instead of re-scanning the result for a newly-exposed one.",
      "Missing the A + A'B = A + B form because it looks unfamiliar compared to the more obvious AB + AB' = A.",
      "Failing to spot a consensus term and carrying an extra, genuinely redundant, product term all the way to the final answer.",
      "Trying to minimize a large expression (6+ variables) by hand instead of recognising it calls for the tabular method.",
    ],
    memoryTricks: [
      "Combining drops a variable: AB + AB' = A. Absorption drops a whole term: A + AB = A.",
      "A + A'B = A + B - read it as 'the complement doesn't gatekeep B once A is already available on its own'.",
      "Consensus: two terms that split on a variable (X and X') silently imply a third, BC-shaped term - and that third term can always go.",
    ],
    formulas: [
      "Combining: AB + AB' = A.",
      "Absorption: A + AB = A, and A + A'B = A + B.",
      "Consensus theorem: AB + A'C + BC = AB + A'C (BC is the consensus/redundant term).",
    ],
    shortcuts: [
      "Scan for a shared literal across terms first (factoring) - it is usually the fastest opening move.",
      "Whenever you see a variable and its complement heading two different terms, check immediately for a hidden consensus term you can delete.",
      "If an expression has more than about five terms, stop trying algebra and switch to a K-map or the tabular method - that decision itself is worth exam time saved.",
    ],
    pyqRelevance: `Algebraic minimization is asked directly as "simplify this expression to its minimal SOP" at 1-2 marks, and the consensus theorem specifically has appeared as its own question more than once - spotting a redundant BC-shaped term is a much faster route than grinding through combining and absorption on the full expression.`,
    interviewConnection: `Simplifying a nested boolean condition in code - collapsing \`if (a && b) return x; if (!a && c) return x; if (b && c) return x;\` down to the two cases that actually matter - is the consensus theorem wearing a software costume. Recognising a redundant guard clause is exactly this skill.`,
    revisionSummary: `Two workhorse identities: AB + AB' = A (combining) and A + A'B = A + B (absorption's less obvious form). Consensus theorem: AB + A'C + BC = AB + A'C, drop the consensus term. No fixed stopping point - keep re-scanning after every simplification. Past a handful of terms, switch to a K-map or the tabular method instead.`,
    shortNotes: {
      oneMinute: "Combining: AB+AB'=A. Absorption: A+A'B=A+B. Consensus: AB+A'C+BC = AB+A'C, drop BC. Re-scan after every step - one simplification often exposes another. Past ~5 terms, switch to K-map/tabular method.",
    },
    mcqs: [
      {
        question: "Simplify: A + A'B",
        options: ["A", "A'B", "A + B", "AB"],
        correctIndex: 2,
        explanation: "A + A'B = (A+A')(A+B) by the distributive law = 1.(A+B) = A+B. This is the less-obvious absorption form worth memorising directly.",
      },
      {
        question: "Which term is redundant in F = AC + A'B + BC?",
        options: ["AC", "A'B", "BC", "None are redundant"],
        correctIndex: 2,
        explanation: "BC is the consensus of AC and A'B (they split on the variable A), so by the consensus theorem BC can be dropped without changing F.",
      },
      {
        question: "What is the main practical limitation of algebraic minimization?",
        options: [
          "It cannot handle more than 2 variables",
          "It has no systematic stopping rule and does not scale to large expressions",
          "It only works for POS form, not SOP",
          "It cannot simplify expressions containing NOT",
        ],
        correctIndex: 1,
        explanation: "Algebraic minimization is correct at any size but relies on a human noticing which law to apply next, with no guaranteed procedure - which is exactly why K-maps and the tabular method exist for larger problems.",
      },
    ],
  },

  "tabular-method-quine-mccluskey": {
    difficulty: "Moderate",
    estimatedMinutes: 35,
    xpReward: 25, coinReward: 10,
    // Verified real (title confirmed via direct fetch, 2026-08-13) -
    // explicitly labeled for the updated GATE syllabus.
    resources: [{
      kind: "video",
      title: "GATE 2027 - Quine McCluskey Method (Tabular Method) | Updated Syllabus Digital Logic",
      url: "https://www.youtube.com/watch?v=7oKDON3FA7c",
      description: "Whole video covers this topic from the start.",
    }],
    whatYoullLearn: [
      "Why a K-map stops being usable and what replaces it",
      "Grouping minterms by number of 1s, and combining terms that differ in one bit",
      "Building and reading a prime implicant chart to find the minimal cover",
      "Recognising essential prime implicants in tabular form, not just on a map",
    ],
    prerequisites: ["Algebraic Minimization Technique", "Karnaugh Map"],
    concept: `## The Method A Computer Could Run

::: story
A K-map is a picture, and reading a picture is something a human is good at and a computer is not. Past five or six variables, the picture becomes too large to read reliably - so the tabular method (Quine-McCluskey) replaces "look for adjacent squares" with "compare bit strings numerically". It is slower by hand for small problems, and it is the one that scales, because it is really just a specification a program can follow exactly.
:::

::: remember
Two minterms combine exactly when their binary representations differ in **exactly one bit position** - this is the same adjacency rule a K-map encodes visually, just checked arithmetically instead of by eye.
:::

## Stage One: Group By Number Of 1s

::: flow
Write every minterm in binary :: One row per minterm, index and bit pattern side by side.
Bucket by number of 1-bits :: Group 0, group 1, group 2, ... A minterm with two 1s only ever combines with one having one or three 1s - never two 1s with two 1s.
Compare adjacent groups only :: Check every pair between consecutive-count groups for a single-bit difference.
Mark combined pairs, write the result :: A combined pair keeps the bits that agree and writes a dash (-) where they differed. Both original minterms are marked as "used".
Repeat on the new table :: Combine dash-containing terms the same way, requiring the dash to be in the same position to combine.
:::

::: mistake
Two terms can only combine if their dashes line up in identical positions. \`1-01\` and \`10-1\` do NOT combine just because both have one dash - the dash has to be in the same column for the comparison to make sense.
:::

Any minterm that never gets marked as "used" in this process is, by definition, a **prime implicant** - it cannot be combined any further.

## Stage Two: The Prime Implicant Chart

::: story
Stage one produces a list of prime implicants. It does not yet tell you which ones you actually need - some may be redundant given the others.
:::

Build a chart: prime implicants as rows, original minterms as columns, and a tick wherever a prime implicant covers that minterm.

::: cards Reading the chart
A column with exactly one tick :: That prime implicant is ESSENTIAL - it is the only one covering that minterm, so it must be in the final answer.
Select every essential prime implicant first :: This is non-negotiable; skipping one guarantees an incorrect (non-covering) answer.
Cover the remaining columns :: Pick the smallest set of non-essential prime implicants that ticks every column not already covered by an essential one.
:::

::: checkpoint
In a prime implicant chart, minterm 6 has exactly one tick, under prime implicant P3. What does that mean?
- ( ) P3 is redundant and can be dropped
- (x) P3 is essential and must appear in the minimal expression
- ( ) Minterm 6 is a don't-care
- ( ) The chart has an error - there must be at least two ticks
> Exactly one tick means no other prime implicant covers minterm 6, so P3 is the only way to cover it - which is precisely the definition of an essential prime implicant.
:::

::: interview
The tabular method is mechanical enough to hand to software, and it is in fact exactly what tools like Espresso and industrial logic synthesizers descend from. Knowing the procedure by hand is what lets you sanity-check that a tool's output (or a smaller hand-worked GATE example) is actually minimal.
:::`,
    deepDive: `## Cost Comparison With The K-Map

For up to about 4-5 variables, a K-map is faster because grouping is visual. Past that, the number of squares to scan grows as 2^n and the human error rate climbs with it, while the tabular method's bit-comparison work grows more gracefully and, crucially, does not depend on spatial layout at all - which is exactly why it is the version that generalises to software.

## Don't-Cares In The Tabular Method

Don't-cares are included in stage one (they can help form larger, prime groups) but are excluded as columns in the prime implicant chart - you must cover every real minterm, but you are never obligated to cover a don't-care. This mirrors the K-map rule (use a don't-care to enlarge a group, never build a group only out of them) in tabular form.`,
    dryRun: `Minimize F(A,B,C) = Sigma(1, 3, 5, 6, 7) using the tabular method.

::: timeline Stage 1 - combining
Write in binary, grouped by 1-count :: Group 1 (one 1-bit): m1=001, m6... wait 6=110 has two 1s. Correct grouping: Group 1: m1=001. Group 2: m3=011, m5=101, m6=110. Group 3: m7=111.
Compare Group 1 to Group 2 :: m1(001) vs m3(011) differ in bit 2 only -> combine to 0-1. m1(001) vs m5(101) differ in bit 1 only -> combine to -01.
Compare Group 2 to Group 3 :: m3(011) vs m7(111) differ in bit 1 -> -11. m5(101) vs m7(111) differ in bit 2 -> 1-1. m6(110) vs m7(111) differ in bit 3 -> 11-.
No further combining :: 0-1, -01, -11, 1-1, 11- have dashes in different positions from each other, so nothing combines further. All five are prime implicants.
:::

::: timeline Stage 2 - the chart
List prime implicants :: 0-1 (covers m1,m3), -01 (covers m1,m5), -11 (covers m3,m7), 1-1 (covers m5,m7), 11- (covers m6,m7).
Find essentials :: m6 is covered ONLY by 11- -> essential. Every other minterm (1,3,5,7) has at least two covering prime implicants, so none of those is forced yet by a single-tick column.
Cover what's left after taking 11- :: 11- covers m6 and m7. Remaining: m1, m3, m5. Pick 0-1 (covers m1, m3) and -01 (covers m1, m5) - together with 11- that covers m1,m3,m5,m6,m7, i.e. everything.
Translate dashes back to letters :: 11- means A=1,B=1,C=any -> AB. 0-1 means A=0,C=1,B=any -> A'C. -01 means B=0,C=1,A=any -> B'C.
:::

Minimal SOP: **F = AB + A'C + B'C**. (A second valid minimal cover exists using -11 and 1-1 instead of the last two terms - the tabular method, like the K-map, does not always give a unique minimal answer when a non-essential choice exists.)`,
    analogies: [
      "The tabular method is like sorting a stack of playing cards by rank before comparing them - grouping minterms by 1-count first means you only ever compare cards from neighbouring piles, never waste time comparing ones that could never match.",
    ],
    keyPoints: [
      "Two minterms combine only if their binary forms differ in exactly one bit - the same adjacency the K-map shows visually, checked arithmetically.",
      "Stage 1 groups minterms by number of 1-bits and repeatedly combines across adjacent groups, marking used terms; anything never marked used is a prime implicant.",
      "Dashes must align in the SAME position for two reduced terms to combine further.",
      "Stage 2 builds a prime implicant chart (implicants x minterms) - a column with exactly one tick names an essential prime implicant, which must be in every minimal answer.",
      "Don't-cares help form bigger groups in stage 1 but are never required to be covered as columns in stage 2.",
    ],
    commonMistakes: [
      "Trying to combine two dash-containing terms whose dashes are in different positions - they cannot combine even if the rest looks similar.",
      "Forgetting to select every essential prime implicant before choosing among the remaining non-essential ones.",
      "Comparing minterms across non-adjacent 1-count groups (e.g. one 1-bit directly against three 1-bits) - only adjacent counts can ever differ by exactly one bit.",
      "Treating a don't-care as a column that must be covered in the prime implicant chart.",
    ],
    memoryTricks: [
      "Group by 1-count, compare only neighbours - that's the whole of stage 1 in five words.",
      "One tick, essential pick - a column with a single tick names a must-have prime implicant.",
      "Dashes must match position to combine, not just match in number.",
    ],
    formulas: [
      "Two terms combine iff their bit patterns differ in exactly one position (Hamming distance 1).",
      "A prime implicant chart has one row per surviving prime implicant and one column per minterm actually required (excluding don't-cares).",
    ],
    shortcuts: [
      "Do the essential-prime-implicant scan (single-tick columns) before trying to reason about the whole cover - it usually resolves most of the answer immediately.",
      "If a GATE question only asks for the number of prime implicants (not the full minimal expression), stop after stage 1 - you don't need to build the chart at all.",
    ],
    pyqRelevance: `The tabular method appears less often than K-maps directly, but "how many prime implicants does F have" or "which of these is an essential prime implicant" for a Sigma-list with 5+ variables is a recurring shape, precisely because it's past comfortable K-map size. Expect 2 marks when the full procedure is required.`,
    interviewConnection: `This is literally how early logic-synthesis tools (and the algorithm behind tools like Espresso) worked before more advanced heuristics took over - knowing it demonstrates you understand minimization as an algorithm, not just a K-map trick you memorised visually.`,
    revisionSummary: `Group minterms by 1-count, combine terms differing in exactly one bit (same dash position required for further combining), repeat until nothing new combines - unused terms are prime implicants. Build a chart of implicants vs minterms; a single-tick column names an essential prime implicant, pick all of those first, then cover what remains with the fewest extra terms. Don't-cares help form groups but are never required columns.`,
    shortNotes: {
      oneMinute: "Group by 1-count, combine bit-strings differing in exactly one position (dashes must align to combine further). Unused terms = prime implicants. Chart: implicants x minterms, single-tick column = essential, pick those first, then cover the rest minimally. Don't-cares aid grouping but aren't required columns.",
    },
    mcqs: [
      {
        question: "In the tabular method, two terms 10-1 and 100- are compared. Can they combine?",
        options: [
          "Yes, they combine to 10--",
          "No, because their dashes are in different positions",
          "Yes, because both have exactly one dash",
          "No, because they have a different number of 1s",
        ],
        correctIndex: 1,
        explanation: "Combining requires the dash positions to match. Here one term has its dash in position 3 and the other in position 4, so they cannot be compared for combination even though each has exactly one dash.",
      },
      {
        question: "A prime implicant chart column for minterm 9 has exactly one tick. What follows?",
        options: [
          "Minterm 9 is a don't-care",
          "That prime implicant is essential and must be in the minimal expression",
          "The chart is drawn incorrectly",
          "Minterm 9 can be dropped from consideration",
        ],
        correctIndex: 1,
        explanation: "A single tick means only one prime implicant covers minterm 9, so that implicant must be selected - this is exactly the definition of essential.",
      },
      {
        question: "Why does the tabular (Quine-McCluskey) method scale better than a Karnaugh map for large numbers of variables?",
        options: [
          "It uses fewer minterms",
          "It works arithmetically on bit strings rather than relying on visual/spatial adjacency",
          "It does not require finding prime implicants",
          "It only works for functions with no don't-cares",
        ],
        correctIndex: 1,
        explanation: "The tabular method reduces adjacency to a simple bit-string comparison, which a program can run correctly for any number of variables - unlike a K-map, whose visual layout becomes unmanageable well before 6 variables.",
      },
    ],
    numericals: [
      {
        question: "F(A,B,C) = Sigma(1,3,5,6,7). Using the tabular method, how many prime implicants does F have in total?",
        answerMin: 5, answerMax: 5,
        unit: "prime implicants",
        solution: `Grouping by 1-count and combining across adjacent groups (see the worked
dry run) produces five terms with no further combination possible:
0-1, -01, -11, 1-1, 11-. None of their dash positions match each
other for a further merge, so all five are prime implicants.`,
      },
    ],
  },

  // ---------------- Combinational and Sequential Circuits ----------------

  "combinational-circuit-design": {
    difficulty: "Moderate",
    estimatedMinutes: 35,
    xpReward: 25, coinReward: 10,
    // Verified real (title confirmed via direct fetch, 2026-08-13).
    resources: [{
      kind: "video",
      title: "Introduction to Combinational Circuits - Neso Academy",
      url: "https://www.youtube.com/watch?v=_yHo2qq82P0",
      description: "Whole video covers this topic from the start.",
    }],
    whatYoullLearn: [
      "What makes a circuit combinational: output depends only on the current inputs",
      "Designing a half adder and full adder from a truth table, step by step",
      "Building a bigger adder by chaining full adders, and the ripple-carry delay that costs",
      "The general design recipe: truth table, minimize, then draw gates",
    ],
    prerequisites: ["Algebraic Minimization Technique", "Karnaugh Map"],
    concept: `## No Memory, Only The Present

::: story
A combinational circuit is a pure function: feed it inputs, and after a small propagation delay, it settles on an output that depends **only** on those inputs, right now - never on what happened before. There is no memory anywhere in the circuit. Change the inputs back to what they were a moment ago, and the output goes right back to what it was, with no trace of the detour.
:::

::: remember
The design recipe never changes, no matter how complex the circuit: **truth table, minimize, draw gates.** Every combinational circuit in this subject - adders, multiplexers, encoders, comparators - is built with exactly these three steps.
:::

## Designing A Half Adder

A half adder adds two single bits, A and B, producing a Sum and a Carry.

::: table Half adder truth table
A | B | Sum | Carry
0 | 0 | 0 | 0
0 | 1 | 1 | 0
1 | 0 | 1 | 0
1 | 1 | 0 | 1
:::

Reading the 1-rows: Sum is 1 exactly when A and B differ - that is XOR. Carry is 1 only when both are 1 - that is AND.

**Sum = A xor B, Carry = AB.** No K-map even needed here; the pattern is recognisable directly, and that recognition is itself worth building as a habit.

## A Half Adder Can't Add A Column

::: story
Adding two multi-bit numbers by hand, you add a column of bits AND whatever carried in from the column to its right. A half adder only handles two bits - it has nowhere to accept that incoming carry. So every column except the very first needs a circuit that accepts THREE inputs.
:::

That circuit is the **full adder**: inputs A, B, and Cin (carry-in), outputs Sum and Cout (carry-out).

::: cards Full adder, derived not memorised
Sum :: A xor B xor Cin - 1 exactly when an odd number of the three inputs are 1.
Cout :: AB + BCin + ACin - 1 when at least two of the three inputs are 1 (a "majority" function).
Built from two half adders :: Add A and B with a half adder, add Cin to that half adder's Sum with a second half adder, and OR the two Carry outputs together.
:::

::: checkpoint
A full adder receives A=1, B=1, Cin=1. What are Sum and Cout?
- ( ) Sum=1, Cout=0
- (x) Sum=1, Cout=1
- ( ) Sum=0, Cout=1
- ( ) Sum=0, Cout=0
> Three 1-bits sum to 3 in binary, which is 11. Sum is the low bit (1), Cout is the high bit (1). Checking the formula: A xor B xor Cin = 1 xor 1 xor 1 = 1. Cout = AB+BCin+ACin = 1+1+1 = 1 (at least two inputs are 1, in fact all three are).
:::

## Chaining Full Adders

To add two n-bit numbers, chain n full adders, feeding each stage's Cout into the next stage's Cin - this is a **ripple-carry adder**. It is simple to build and simple to reason about, and it has one real cost: the carry has to physically ripple through every stage before the final Sum is correct, so the worst-case delay grows with the number of bits.

::: interview
"Why is a ripple-carry adder slow for wide numbers" is a legitimate systems-design question, and the answer is exactly this propagation chain - which is also why real CPUs use carry-lookahead or carry-select adders instead, trading extra gates for a shorter critical path.
:::`,
    deepDive: `## Beyond Adders: The Same Recipe, Every Time

A comparator (is A > B, A = B, A < B), a code converter (binary to Gray, BCD to seven-segment), and a parity generator all follow the identical three-step recipe: write the truth table for every output bit, minimize each output bit's expression independently (a K-map per output), then draw the gates. The only thing that changes circuit to circuit is which truth table you start from.

## Ripple-Carry Delay, Quantified

If one full adder's carry takes time t to propagate from Cin to Cout, an n-bit ripple-carry adder's worst-case delay for the final carry is roughly n . t - the carries must resolve one stage at a time, left to right, because each stage genuinely needs its neighbour's answer before it can compute its own.`,
    codeExample: {
      language: "c",
      code: `#include <stdio.h>

/* Full adder for one bit: returns sum, writes carry-out via pointer */
int fullAdder(int a, int b, int cin, int *cout) {
    int sum = a ^ b ^ cin;             /* Sum = A xor B xor Cin */
    *cout = (a & b) | (b & cin) | (a & cin);  /* majority function */
    return sum;
}

int main(void) {
    int carry = 0;
    int a[4] = {1, 1, 0, 1};   /* bits of one 4-bit number, LSB first */
    int b[4] = {1, 0, 1, 1};   /* bits of another 4-bit number       */
    int sum[4];

    for (int i = 0; i < 4; i++) {
        sum[i] = fullAdder(a[i], b[i], carry, &carry);
    }

    printf("Sum bits (LSB first): %d %d %d %d\\n", sum[0], sum[1], sum[2], sum[3]);
    printf("Final carry-out: %d\\n", carry);
    return 0;
}`,
      expectedOutput: `Sum bits (LSB first): 0 0 1 1
Final carry-out: 1`,
    },
    keyPoints: [
      "A combinational circuit's output depends only on its current inputs - there is no memory anywhere in it.",
      "The design recipe is always the same three steps: truth table, minimize each output, draw the gates.",
      "Half adder: Sum = A xor B, Carry = AB. It cannot accept an incoming carry.",
      "Full adder: Sum = A xor B xor Cin (odd parity), Cout = AB+BCin+ACin (majority of the three inputs). Built from two half adders plus an OR.",
      "Chaining full adders gives a ripple-carry adder; its worst-case delay grows with the number of bits because each stage needs the previous stage's carry.",
    ],
    analogies: [
      "A combinational circuit is a vending machine with no memory of past purchases - press the same buttons twice and you get the exact same result both times, because nothing inside it remembers the first time.",
      "A ripple-carry adder is a bucket brigade passing water (the carry) down a line - the last person can't do their part until everyone before them has, which is exactly why the whole chain's speed is limited by its length.",
    ],
    commonMistakes: [
      "Trying to add multi-bit numbers using only half adders, forgetting that every column except the first needs to accept an incoming carry.",
      "Misremembering the full adder's Cout as a plain OR of the three inputs instead of the majority function AB+BCin+ACin.",
      "Assuming a wider ripple-carry adder has the same delay as a narrow one - delay scales with bit-width because the carry must propagate stage by stage.",
      "Skipping the truth table step and trying to guess the minimized expression directly for anything beyond XOR/AND-shaped outputs.",
    ],
    memoryTricks: [
      "Half adder: XOR gives Sum, AND gives Carry - and it can't accept a carry-in, hence 'half'.",
      "Full adder Sum = odd number of 1s among A, B, Cin (XOR is an odd-parity detector). Cout = majority of the three.",
      "Ripple-carry: the carry ripples like a line of falling dominoes - one at a time, left to right.",
    ],
    formulas: [
      "Half adder: Sum = A xor B, Carry = AB.",
      "Full adder: Sum = A xor B xor Cin, Cout = AB + BCin + ACin.",
      "Ripple-carry adder worst-case delay is approximately proportional to n (the number of bits), since each stage waits on the previous stage's carry.",
    ],
    shortcuts: [
      "Recognise XOR/AND-shaped truth tables (adders, parity checkers) directly instead of running a full K-map every time - they are common enough to memorise on sight.",
      "For 'how many gates in an n-bit ripple-carry adder', count per full adder (typically drawn as needing two XORs, two ANDs, one OR - or fewer if built from two half adders plus one OR) and multiply by n, minus the simplification the first stage gets from having no incoming carry.",
    ],
    pyqRelevance: `Adder design (half and full) is one of the most reliable Digital Logic questions, often asked as "how many gates" or "what is Cout in terms of A, B, Cin" or "why is ripple-carry slow" at 1-2 marks. Getting the majority-function form of Cout right, rather than a plain OR, is exactly where marks are lost.`,
    interviewConnection: `Ripple-carry delay is a genuinely transferable systems intuition: any pipeline where each stage depends on the previous stage's output has the same latency-scales-with-length property, whether it's an adder circuit or a chain of dependent microservice calls.`,
    revisionSummary: `Combinational output depends only on current inputs. Design recipe: truth table, minimize, draw gates. Half adder: Sum=A xor B, Carry=AB (no carry-in support). Full adder: Sum=A xor B xor Cin, Cout=AB+BCin+ACin (majority function), built from two half adders plus an OR. Chaining full adders gives a ripple-carry adder whose worst-case delay grows with bit-width because each stage needs the previous carry.`,
    shortNotes: {
      oneMinute: "Combinational = output depends only on current inputs. Recipe: truth table -> minimize -> gates. Half adder: Sum=XOR, Carry=AND. Full adder: Sum=A xor B xor Cin, Cout=majority(A,B,Cin)=AB+BCin+ACin. Ripple-carry chains full adders; delay grows with bit-width.",
    },
    mcqs: [
      {
        question: "What is the Boolean expression for the Carry output of a half adder with inputs A and B?",
        options: ["A xor B", "A + B", "AB", "A xnor B"],
        correctIndex: 2,
        explanation: "Carry is 1 only when BOTH A and B are 1, which is exactly the AND function. Sum, by contrast, is A xor B.",
      },
      {
        question: "A full adder has inputs A=0, B=1, Cin=1. What is Cout?",
        options: ["0", "1", "Undefined", "Equal to Sum"],
        correctIndex: 1,
        explanation: "Cout = AB + BCin + ACin = 0 + 1 + 0 = 1. Two of the three inputs (B and Cin) are 1, which is enough to trigger the majority function.",
      },
      {
        question: "Why does a ripple-carry adder's worst-case delay increase with the number of bits?",
        options: [
          "Each additional bit needs more transistors per gate",
          "Each full adder stage must wait for the carry from the previous stage before its own output is valid",
          "Wider adders require a different truth table",
          "It does not increase; delay is constant regardless of width",
        ],
        correctIndex: 1,
        explanation: "The carry genuinely has to propagate stage by stage - a later stage's correct output depends on receiving the correct carry-in from the stage before it, so the critical path length grows with the number of bits.",
      },
    ],
  },

  "multiplexers-decoders-and-encoders": {
    difficulty: "Moderate",
    estimatedMinutes: 30,
    xpReward: 25, coinReward: 10,
    // Verified real (title confirmed via direct fetch, 2026-08-13) - a
    // single GATE-focused lecture covering all four circuit types in the
    // topic name.
    resources: [{
      kind: "video",
      title: "Digital Electronics | Combinational Circuits - Multiplexer, DeMux, Decoder, Encoder | Lec 11 | GATE",
      url: "https://www.youtube.com/watch?v=WIzOkACh6U4",
      description: "Whole video covers this topic from the start.",
    }],
    whatYoullLearn: [
      "How a multiplexer's select lines act as an address that picks one input",
      "Implementing any boolean function with a multiplexer instead of gates",
      "Decoders as 'one-hot' address generators, and how encoders reverse the job",
      "Priority encoders, and why an ordinary encoder breaks with two active inputs",
    ],
    prerequisites: ["Combinational Circuit Design"],
    concept: `## A Multiplexer Is A Selector Switch

::: story
Imagine a row of 8 wires, and a single output that needs to carry the signal from exactly one of them at any given moment - chosen by a 3-bit "address". That is precisely what a multiplexer (MUX) is: it selects one of 2^n data inputs using n select lines and routes it, alone, to the output.
:::

::: remember
For an n-to-1 MUX (n select lines): **2^n data inputs**, n select lines, 1 output. A 4-to-1 MUX has 2 select lines; an 8-to-1 MUX has 3. The exponent relationship is the entire structural fact worth remembering.
:::

::: table 4-to-1 MUX select lines
S1 | S0 | Output
0 | 0 | I0
0 | 1 | I1
1 | 0 | I2
1 | 1 | I3
:::

## Implementing Any Function With A MUX

::: story
A surprising and frequently tested fact: an n-to-1 MUX can implement ANY boolean function of n+1 variables, without a single extra gate, just by wiring the right constants and variable (or its complement) to each data input.
:::

::: flow
Pick n of the function's variables as select lines :: These decide which data input gets chosen for each combination.
For each select-line combination, evaluate the function :: Holding the selected variables fixed, see what the remaining variable makes the function equal - 0, 1, the variable itself, or its complement.
Wire that result to the matching data input :: Whatever the function reduces to for that row becomes what you feed into that input.
:::

::: checkpoint
F(A,B,C) = Sigma(1,2,6,7). Using A and B as select lines on a 4-to-1 MUX, what should be wired to input I0 (A=0,B=0)?
- ( ) 0
- (x) C
- ( ) C'
- ( ) 1
> With A=0, B=0, F is 1 only at minterm 1 (A=0,B=0,C=1) among the rows where A=0,B=0 exist (minterms 0 and 1). So F = C in that case - wire the variable C itself to I0, not a constant.
:::

## Decoders Turn A Code Into A Single Active Line

A decoder takes an n-bit binary input and activates exactly **one** of its 2^n outputs - the one whose index matches the input. A 3-to-8 decoder, for instance, has 3 inputs and 8 outputs, and exactly one output line goes high for any given input pattern (this is called "one-hot").

::: interview
Decoders are the standard way memory chips select which address line to activate, and they are also how a 7-segment display driver lights the right segments for a given digit - both are "turn a small code into the one specific thing it names" problems.
:::

## Encoders Do The Opposite Job, With One Catch

An encoder takes 2^n input lines (only one of which is expected active at a time) and produces the n-bit binary code identifying which one it was - the reverse of a decoder.

::: mistake
A plain encoder assumes exactly one input is active. If two inputs go active simultaneously, a plain encoder produces garbage - the OR of their codes, which is meaningless. A **priority encoder** fixes this by defining a priority order and outputting the code for whichever active input has the highest priority, ignoring the rest.
:::`,
    deepDive: `## Decoders As Universal Building Blocks

A decoder with an enable input can implement any minterm-based SOP function directly: OR together the decoder outputs corresponding to the function's 1-minterms. An n-to-2^n decoder plus one OR gate reproduces any function of n variables - structurally similar to the MUX trick, but the decoder approach needs external OR gates while the MUX approach needs none.

## Priority Encoder Truth Table Shape

A priority encoder's truth table uses don't-cares heavily: if input 3 (highest priority) is active, the output is fixed regardless of inputs 0-2's state, so those columns are marked X. Reading a priority encoder's truth table means reading from the highest-priority row down and recognising that lower rows only apply when every higher-priority input is 0.`,
    codeExample: {
      language: "javascript",
      code: `// 4-to-1 MUX modeled directly: select lines act as an index.
function mux4to1(inputs, s1, s0) {
  const index = (s1 << 1) | s0;   // select lines form the address
  return inputs[index];
}

const I = [0, 1, 0, 1];  // I0, I1, I2, I3
console.log(mux4to1(I, 0, 0)); // S1S0=00 -> I0
console.log(mux4to1(I, 1, 0)); // S1S0=10 -> I2
console.log(mux4to1(I, 1, 1)); // S1S0=11 -> I3

// 2-to-4 decoder: exactly one output line goes high ("one-hot").
function decoder2to4(a1, a0) {
  const index = (a1 << 1) | a0;
  const out = [0, 0, 0, 0];
  out[index] = 1;
  return out;
}
console.log(decoder2to4(1, 0)); // -> [0, 0, 1, 0]`,
      expectedOutput: `0
0
1
[ 0, 0, 1, 0 ]`,
    },
    keyPoints: [
      "An n-to-1 MUX has 2^n data inputs and n select lines, which act as a binary address choosing which input reaches the output.",
      "An n-to-1 MUX can implement any function of n+1 variables by wiring each data input to 0, 1, the extra variable, or its complement.",
      "A decoder converts an n-bit code into one active output out of 2^n (one-hot); an encoder does the reverse.",
      "A plain encoder assumes exactly one active input at a time - two active inputs produce garbage.",
      "A priority encoder resolves multiple simultaneous active inputs by always reporting the highest-priority one active.",
    ],
    analogies: [
      "A multiplexer is a hotel switchboard operator: the select lines are the room number you dial, and only that one room's line gets connected to the caller - every other room stays silent regardless of what's happening there.",
      "A priority encoder is a hospital triage desk: several patients (inputs) may need attention at once, but the desk always reports the most urgent one, not some meaningless blend of all of them.",
    ],
    commonMistakes: [
      "Forgetting the 2^n relationship between select lines and data inputs - an 8-to-1 MUX needs 3 select lines, not 8.",
      "Wiring only 0s and 1s to a MUX's data inputs when implementing a function, missing that the extra variable (or its complement) is often the correct value for a given input.",
      "Assuming an ordinary encoder handles multiple simultaneous active inputs correctly - it does not, and that is precisely why priority encoders exist.",
      "Confusing a decoder's one-hot OUTPUT behaviour with an encoder's job of reading a one-hot INPUT back into a code - they are inverse operations, not the same thing under different names.",
    ],
    memoryTricks: [
      "MUX select lines are an address: n lines select among 2^n inputs - same 2^n relationship as memory addressing.",
      "Decoder: code IN, one-hot OUT. Encoder: one-hot IN, code OUT. Mirror images.",
      "Priority encoder = triage: highest priority active input wins, everything lower is ignored.",
    ],
    formulas: [
      "MUX: 2^n data inputs for n select lines (e.g. n=2 -> 4-to-1, n=3 -> 8-to-1).",
      "Decoder: n inputs produce 2^n one-hot outputs.",
      "An n-to-1 MUX can realize any function of (n+1) variables without extra gates.",
    ],
    shortcuts: [
      "For a 'realize this function using a MUX' question, pick the select lines as the variables that appear in EVERY minterm's addressing role, then read off each data input in one pass over the minterm list grouped by those select values.",
      "When asked for the number of select lines given a MUX/decoder size, take log base 2 of the input/output count directly rather than counting rows.",
    ],
    pyqRelevance: `MUX-based function implementation is one of the most reliable Digital Logic question types - "implement this 3-variable function using a 4-to-1 MUX" at 2 marks, testing exactly the select-line/data-input mapping shown above. Decoder and priority-encoder truth-table questions are the other recurring shape, usually 1 mark.`,
    interviewConnection: `A MUX is the hardware version of a ternary operator or a switch statement selecting between precomputed values - and 'implement this function using a smaller MUX' is structurally the same problem as picking the minimum set of conditions a lookup table needs to cover every case.`,
    revisionSummary: `MUX: n select lines choose among 2^n data inputs; any (n+1)-variable function fits on an n-select-line MUX by wiring 0/1/variable/complement to each input. Decoder: n-bit code -> one-hot output among 2^n lines. Encoder: reverse of a decoder, but breaks with two simultaneous active inputs; a priority encoder fixes that by always reporting the highest-priority active input.`,
    shortNotes: {
      oneMinute: "MUX: n select lines pick among 2^n inputs (an address). Any (n+1)-var function fits a MUX by wiring 0/1/var/var' to each input. Decoder: code -> one-hot output. Encoder: one-hot input -> code, but breaks with 2+ active inputs - priority encoder always reports the highest-priority one.",
    },
    mcqs: [
      {
        question: "How many select lines does an 8-to-1 multiplexer need?",
        options: ["2", "3", "4", "8"],
        correctIndex: 1,
        explanation: "2^n = 8 gives n = 3. Three select lines can address 8 distinct data inputs.",
      },
      {
        question: "Which statement correctly distinguishes an encoder from a decoder?",
        options: [
          "A decoder converts a code to one-hot output; an encoder converts a one-hot input back to a code",
          "They perform the identical operation under different names",
          "An encoder has more outputs than inputs; a decoder has fewer",
          "A decoder requires a priority scheme; an encoder does not",
        ],
        correctIndex: 0,
        explanation: "These are inverse operations. A decoder activates exactly one output line given a binary code; an encoder reads which single input line is active and reports its binary code - the priority issue belongs to the encoder side, not the decoder.",
      },
      {
        question: "Why is a plain (non-priority) encoder unreliable when two inputs are active simultaneously?",
        options: [
          "It simply outputs 0 in that case",
          "It produces a meaningless combination, typically the OR of the two corresponding codes",
          "It automatically selects the lower-numbered input",
          "It is not unreliable; plain encoders handle this correctly",
        ],
        correctIndex: 1,
        explanation: "A plain encoder's logic assumes exactly one active input and simply ORs the bit patterns of whichever inputs are active - with two active inputs that OR does not correspond to either input's actual code, which is exactly the gap a priority encoder closes.",
      },
    ],
  },

  "latches-and-flip-flops": {
    difficulty: "Moderate",
    estimatedMinutes: 35,
    xpReward: 25, coinReward: 10,
    // Verified real (title confirmed via direct fetch, 2026-08-13) - first
    // video of Neso Academy's own latches/flip-flops series.
    resources: [{
      kind: "video",
      title: "Latches and Flip-Flops 1 - The SR Latch - Neso Academy",
      url: "https://www.youtube.com/watch?v=-aQH0ybMd3U",
      description: "First video in Neso Academy's latches/flip-flops series.",
    }],
    whatYoullLearn: [
      "Why sequential circuits need a memory cell at all, and what a latch actually is",
      "SR, D, JK and T - the four standard flip-flops, and what each one is for",
      "The JK flip-flop's toggle case, and why it's the one everyone forgets",
      "Level-triggered latches versus edge-triggered flip-flops - the distinction GATE tests hardest",
    ],
    prerequisites: ["Multiplexers, Decoders and Encoders"],
    concept: `## The Circuit That Remembers

::: story
Every circuit up to this point forgets everything the instant its inputs change. A CPU register, a counter, a state machine - none of those can exist without something that holds onto a value once written, even after the inputs that wrote it are gone. That something is a **latch** or a **flip-flop**, and it is the single idea that separates combinational logic from everything sequential in this subject.
:::

::: remember
A **latch** is level-triggered - it stays transparent (following its input) for as long as an enable signal is high. A **flip-flop** is edge-triggered - it only samples its input at the instant a clock signal transitions, and holds that value rock-solid the rest of the time. This distinction is worth more exam marks than any individual flip-flop's truth table.
:::

## The Simplest Memory Cell: SR

An **SR latch**, built from two cross-coupled NOR (or NAND) gates, has Set and Reset inputs. Set forces the stored bit to 1, Reset forces it to 0, and with both inputs 0 it simply holds whatever it last held - genuine memory, from nothing but feedback.

::: cards SR flip-flop behaviour
S=0, R=0 :: Hold - no change, the whole point of having memory at all.
S=1, R=0 :: Set - output becomes 1.
S=0, R=1 :: Reset - output becomes 0.
S=1, R=1 :: FORBIDDEN for the basic SR latch - both gates try to force opposite results at once, an invalid/unpredictable state.
:::

## The Working Flip-Flops

::: cards D, JK and T, what each buys you
D (Data) flip-flop :: Output simply becomes whatever D was, at the clock edge. Q(next) = D. No forbidden state, no ambiguity - the simplest flip-flop to reason about, and the one used to build registers.
JK flip-flop :: Fixes SR's forbidden case. J=1,K=0 sets; J=0,K=1 resets; J=0,K=0 holds; and **J=1,K=1 TOGGLES** the output instead of being forbidden.
T (Toggle) flip-flop :: One input. T=0 holds, T=1 toggles. It is exactly a JK flip-flop with J and K tied together.
:::

::: mistake
The single most common flip-flop error on GATE: forgetting that JK's J=1,K=1 case **toggles**, and instead treating it as forbidden the way SR's S=1,R=1 is. The whole point of JK over SR is that this case is defined and useful, not an error condition.
:::

::: checkpoint
A JK flip-flop currently holds Q=1. J=1, K=1 is applied at the next clock edge. What is Q(next)?
- ( ) 1 (holds)
- (x) 0 (toggles from 1)
- ( ) Undefined/forbidden
- ( ) 1 (set, since J=1)
> J=1,K=1 is the toggle condition, not set-only and not forbidden. Toggling flips the current value: Q was 1, so Q(next) = 0.
:::

## Reading The Characteristic Equation

Each flip-flop has a **characteristic equation** describing Q(next) in terms of its inputs and current Q:

::: table Characteristic equations
Flip-flop | Q(next)
SR | S + R'Q  (with SR=0 required)
D | D
JK | JQ' + K'Q
T | T xor Q
:::

::: interview
Flip-flops are quite literally what a CPU register is built from - every bit of every register, and every bit of cache, is some flip-flop or latch holding a value between clock edges. "How does a CPU remember anything between instructions" has this as its actual, physical answer.
:::`,
    deepDive: `## Master-Slave: How Edge-Triggering Is Actually Built

A single level-triggered latch is not safely edge-triggered on its own - if the clock stays high too long, its output could keep changing and race through the circuit ("ripple-through"). The classic fix is a **master-slave** configuration: two latches in series, with the master transparent while the clock is high and the slave transparent while the clock is low (or vice versa). Data is captured into the master during one clock phase and only released to the slave (and hence to the rest of the circuit) on the other phase - so the visible output changes exactly once per clock cycle, at a clean edge, never mid-level.

## Converting Between Flip-Flop Types

GATE frequently asks "implement a JK flip-flop using a D flip-flop" or similar. The technique is always the same: write the target flip-flop's characteristic equation, substitute it for D's next-state requirement (D = Q(next) for a D flip-flop, since D flip-flops just copy their input), and simplify. For JK-from-D: D = JQ' + K'Q, which is now just combinational logic feeding an ordinary D flip-flop.`,
    codeExample: {
      language: "javascript",
      code: `// Simulating flip-flop next-state logic (characteristic equations),
// not real hardware timing - useful for tracing GATE-style Q(next) questions.

function dFlipFlop(D) {
  return D;                        // Q(next) = D
}

function jkFlipFlop(J, K, Q) {
  if (J === 0 && K === 0) return Q;      // hold
  if (J === 1 && K === 0) return 1;      // set
  if (J === 0 && K === 1) return 0;      // reset
  return Q === 1 ? 0 : 1;                // J=1,K=1 -> TOGGLE
}

function tFlipFlop(T, Q) {
  return T === 1 ? (Q === 1 ? 0 : 1) : Q; // T xor Q
}

let Q = 1;
console.log(jkFlipFlop(1, 1, Q)); // toggle: 1 -> 0
console.log(tFlipFlop(1, Q));     // toggle: 1 -> 0
console.log(dFlipFlop(0));        // becomes exactly D: 0`,
      expectedOutput: `0
0
0`,
    },
    keyPoints: [
      "A latch is level-triggered (transparent while enabled); a flip-flop is edge-triggered (samples only at a clock transition) - this distinction is heavily tested.",
      "The basic SR latch has a forbidden state (S=1,R=1); the JK flip-flop fixes exactly this by defining that combination as TOGGLE instead.",
      "D flip-flop: Q(next)=D, simplest to reason about, used to build registers. T flip-flop: Q(next)=T xor Q, a JK with J and K tied together.",
      "Master-slave construction (two latches, opposite-phase transparency) is how a clean single edge-trigger is actually built from level-triggered latches.",
      "Flip-flop conversion problems reduce to substituting the target's characteristic equation for the available flip-flop's input requirement, then simplifying.",
    ],
    analogies: [
      "An SR latch is a light switch with two separate buttons (on-button, off-button) that jam if you press both at once. A JK flip-flop replaces that with a smarter switch where pressing both simply flips whatever state it was already in - never a jam.",
      "A latch is a door that stays open (following you) the whole time someone holds it; a flip-flop is a door with a spring lock that only lets you through at the exact instant someone turns the key, then locks solid regardless of what you do afterward.",
    ],
    commonMistakes: [
      "Treating JK's J=1,K=1 as forbidden, copying the SR latch's rule instead of remembering it is defined as TOGGLE.",
      "Confusing 'level-triggered' (latch) with 'edge-triggered' (flip-flop), and answering a timing question with the wrong one's behaviour.",
      "Forgetting that a T flip-flop is just a JK with its two inputs tied together, and re-deriving its equation from scratch instead of reusing JK's.",
      "Missing that a single latch alone is not a reliable edge-triggered device - master-slave (two latches) is what actually achieves clean edge-triggering.",
    ],
    memoryTricks: [
      "SR forbidden, JK toggles: JK is 'SR that fixed its one bug'.",
      "D flip-flop: 'Q(next) = D' - the output just copies its input, delayed one clock tick.",
      "T flip-flop: T=1 flips, T=0 stays - Toggle is the whole name and the whole behaviour.",
      "Latch = Level. Flip-flop = Edge (Flip on the edge).",
    ],
    formulas: [
      "SR: Q(next) = S + R'Q, valid only when S and R are not both 1.",
      "D: Q(next) = D.",
      "JK: Q(next) = JQ' + K'Q (J=1,K=1 gives toggle: Q(next) = Q').",
      "T: Q(next) = T xor Q.",
    ],
    shortcuts: [
      "For any 'what is Q(next)' question, plug the given inputs and current Q straight into the characteristic equation rather than re-deriving behaviour from first principles.",
      "For flip-flop conversion questions, immediately write 'characteristic equation of the target = input expression of the flip-flop you have' - that one substitution is the entire technique.",
    ],
    pyqRelevance: `Flip-flops are asked constantly: tracing Q across several clock edges given an input sequence, converting one flip-flop type into another, and distinguishing latch from flip-flop behaviour in a timing diagram. The JK toggle case specifically is a favourite distractor at 1-2 marks.`,
    interviewConnection: `Flip-flops are literally what CPU registers, cache lines, and pipeline stage buffers are built from - "how does a register hold a value" has flip-flops as its literal answer, not an analogy. This also underlies why clock edges matter so much in hardware timing closure discussions.`,
    revisionSummary: `Latch = level-triggered (follows input while enabled). Flip-flop = edge-triggered (samples only at a clock edge). SR: S=1,R=1 is forbidden. D: Q(next)=D. JK: Q(next)=JQ'+K'Q, and J=1,K=1 TOGGLES (this is JK's whole advantage over SR). T: Q(next)=T xor Q, a JK with J=K tied together. Master-slave (two latches, opposite phases) is how real edge-triggering gets built. Flip-flop conversion = substitute the target's characteristic equation into the available flip-flop's input.`,
    shortNotes: {
      oneMinute: "Latch=level-triggered, flip-flop=edge-triggered. SR: 11 forbidden. D: Q(next)=D. JK: Q(next)=JQ'+K'Q, 11=TOGGLE (not forbidden). T: Q(next)=T xor Q (=JK with J=K). Master-slave = two latches, opposite phase, gives clean edge-triggering.",
    },
    mcqs: [
      {
        question: "A JK flip-flop has J=1, K=1, and current Q=0. What is Q(next)?",
        options: ["0", "1", "Forbidden/undefined", "Depends on the clock only, not J/K"],
        correctIndex: 1,
        explanation: "J=1,K=1 is the toggle condition. Q was 0, so it toggles to 1. This case is defined and useful in JK, unlike the analogous S=1,R=1 case in a basic SR latch.",
      },
      {
        question: "Which best distinguishes a latch from a flip-flop?",
        options: [
          "A latch has more inputs than a flip-flop",
          "A latch is level-triggered; a flip-flop is edge-triggered",
          "A latch can store multiple bits; a flip-flop stores only one",
          "There is no real difference; the terms are interchangeable",
        ],
        correctIndex: 1,
        explanation: "The defining difference is timing behaviour: a latch follows its input for as long as its enable is active (level-triggered), while a flip-flop samples its input only at a clock edge and holds it otherwise.",
      },
      {
        question: "A T flip-flop is functionally equivalent to a JK flip-flop with:",
        options: ["J and K both tied to 0", "J and K tied together (J=K=T)", "J tied to K's complement", "No equivalence exists"],
        correctIndex: 1,
        explanation: "Tying J and K together reproduces T's behaviour exactly: when T=0 (so J=K=0) it holds, and when T=1 (so J=K=1) it toggles - matching T flip-flop behaviour in both cases.",
      },
    ],
    numericals: [
      {
        question: "A JK flip-flop starts at Q=0. The sequence of (J,K) applied over four clock edges is (1,0), (1,1), (1,1), (0,1). What is Q after all four edges?",
        answerMin: 0, answerMax: 0,
        unit: "",
        solution: `Edge 1: J=1,K=0 -> SET -> Q=1.
Edge 2: J=1,K=1 -> TOGGLE -> Q=0.
Edge 3: J=1,K=1 -> TOGGLE -> Q=1.
Edge 4: J=0,K=1 -> RESET -> Q=0.
Final Q = 0.`,
      },
    ],
  },

  "sequential-circuit-design": {
    difficulty: "Moderate",
    estimatedMinutes: 40,
    xpReward: 30, coinReward: 12,
    // Verified real (title confirmed via direct fetch, 2026-08-13).
    resources: [{
      kind: "video",
      title: "Introduction to Sequential Circuits - Neso Academy",
      url: "https://www.youtube.com/watch?v=Mt3AToASuFo",
      description: "Whole video covers this topic from the start.",
    }],
    whatYoullLearn: [
      "The general model every sequential circuit shares: combinational logic plus feedback through flip-flops",
      "Mealy versus Moore machines, and the one structural difference that separates them",
      "The full synthesis procedure: state table, state assignment, excitation table, minimize, draw",
      "Excitation tables - reading a flip-flop's truth table backwards to find what input it needed",
    ],
    prerequisites: ["Latches and Flip-Flops"],
    concept: `## Feedback Is The Whole Idea

::: story
A combinational circuit's output depends only on its current input. A sequential circuit's output depends on the current input AND on some memory of the past - and that memory is exactly a set of flip-flops, fed by combinational logic that also looks at the flip-flops' own current output. The circuit's own state feeds back into its own next-state calculation. That loop is the entire mechanism.
:::

::: remember
Every sequential circuit is: **combinational logic + flip-flops, with the flip-flops' outputs feeding back as extra inputs to the combinational logic.** Design is entirely about designing that combinational logic correctly.
:::

## Mealy Versus Moore: One Structural Difference

::: cards Where the output comes from
Moore machine :: Output depends ONLY on the current state. Draw it: the output label sits inside the state circle itself.
Mealy machine :: Output depends on the current state AND the current input. Draw it: the output label sits on the transition ARROW, not inside the circle.
:::

::: mistake
Given a state diagram, the fastest way to tell Mealy from Moore is checking WHERE the output labels are written - inside states means Moore, on the arrows means Mealy. Trying to infer it from the circuit's behaviour first is slower and more error-prone than just looking at the diagram's labels.
:::

A Mealy machine typically needs fewer states for the same job, because it can react within the same clock cycle via the input on the current transition; a Moore machine's output only ever updates on the NEXT state, one cycle later.

## The Synthesis Procedure, Step By Step

::: flow
1. State table :: List every state, every possible input, the resulting next state, and the output (Mealy: on the transition; Moore: attached to each state).
2. State assignment :: Give each state a distinct binary code, using ceil(log2(number of states)) flip-flops.
3. Excitation table :: For each flip-flop, work out what INPUT it needs to move from its present-state bit to its required next-state bit.
4. Minimize each flip-flop's input expression :: Treat each flip-flop input as a separate boolean function of the present-state bits and the circuit input, and K-map it.
5. Draw the circuit :: Flip-flops plus the minimized combinational logic feeding their inputs.
:::

## Excitation Tables: Reading A Flip-Flop Backwards

::: story
A flip-flop's normal truth table answers "given these inputs, what's the next state?" Design needs the opposite question: "given this present state and this required next state, what input makes that transition happen?" An excitation table is exactly that truth table run in reverse.
:::

::: table JK excitation table
Q(present) | Q(next) | J | K
0 | 0 | 0 | X
0 | 1 | 1 | X
1 | 0 | X | 1
1 | 1 | X | 0
:::

::: checkpoint
Using the JK excitation table, what J and K values are needed for a transition from Q=1 to Q(next)=1?
- ( ) J=1, K=1
- (x) J=X, K=0
- ( ) J=0, K=0
- ( ) J=1, K=0
> Q stays at 1, which either HOLD (J=0,K=0) or SET (J=1,K=0) can achieve - J doesn't matter as long as K=0, since K=1 would force a reset away from 1. That's exactly why J is a don't-care here.
:::

::: interview
The don't-cares in an excitation table are not a technicality - they are extra minimization freedom, and using them well is often the difference between a design with 4 gates and one with 7. This is the same "use don't-cares to make groups bigger" idea from K-maps, applied one layer up.
:::`,
    deepDive: `## Why Excitation Tables Have More Don't-Cares Than You'd Expect

Both SR and JK excitation tables are unusually don't-care-heavy precisely because both flip-flops have more than one way to reach the same next state (hold vs set-to-1, hold vs reset-to-0). D and T flip-flops, by contrast, have almost no don't-cares in their excitation tables, because each has only one input value that produces any given transition - which is also why D and T circuits are often simpler to minimize but sometimes need more states or more combinational logic elsewhere to compensate.

## Mealy-to-Moore and Back

Any Mealy machine can be converted to an equivalent Moore machine (possibly needing more states, since a Moore machine may need to split one Mealy state into several states, one per distinct output that state could have produced on different incoming transitions) and vice versa. GATE occasionally asks for the minimum number of states a Moore-equivalent of a given small Mealy machine needs - the answer is never fewer, and is sometimes strictly more.`,
    keyPoints: [
      "A sequential circuit is combinational logic plus flip-flops, with the flip-flops' current outputs fed back as extra inputs to that same combinational logic.",
      "Moore: output depends only on the current state (labelled inside the state). Mealy: output depends on state AND input (labelled on the transition arrow).",
      "Synthesis procedure: state table, state assignment, excitation table, minimize each flip-flop input, draw the circuit.",
      "An excitation table answers 'what input does this flip-flop need' given a present state and a required next state - the reverse of its ordinary truth table.",
      "SR and JK excitation tables have heavy don't-care structure (multiple ways to reach the same next state); D and T have almost none.",
    ],
    analogies: [
      "A sequential circuit is a thermostat: its next action depends not just on the current temperature reading (input) but on its own current mode - heating or idle (state) - which is exactly why the same reading can produce different behaviour depending on what the thermostat was already doing.",
      "An excitation table is like working out which key to press on a remote to get a TV from its current channel to a target channel - you're not asking 'what happens if I press this key', you're asking 'which key gets me there', which is the reverse question.",
    ],
    commonMistakes: [
      "Mixing up Mealy and Moore by reasoning about behaviour instead of just checking where the output label sits in the state diagram (inside a state = Moore, on an arrow = Mealy).",
      "Building the state table correctly but then forgetting to run a SEPARATE minimization for each flip-flop's excitation input - each is its own boolean function of present state and input.",
      "Ignoring the don't-cares available in an SR or JK excitation table, producing a needlessly larger combinational circuit than required.",
      "Assuming a Moore-equivalent of a Mealy machine always has the same number of states - it can require more, never fewer.",
    ],
    memoryTricks: [
      "Moore: output lives in the circle (Moore = 'more static', tied to state alone). Mealy: output lives on the arrow (reacts to input right now).",
      "Design order: Table, Assign, Excite, Minimize, Draw - TAEMD, or just 'state table first, gates last'.",
      "Excitation table = the flip-flop's truth table read BACKWARDS: given present and desired next state, what input causes it?",
    ],
    formulas: [
      "Number of flip-flops needed for N states: ceil(log2(N)).",
      "SR excitation: (Q,Q(next))=(0,0)->S=0,R=X; (0,1)->S=1,R=0; (1,0)->S=0,R=1; (1,1)->S=X,R=0.",
      "JK excitation: (0,0)->J=0,K=X; (0,1)->J=1,K=X; (1,0)->J=X,K=1; (1,1)->J=X,K=0.",
      "D excitation: D = Q(next), always, no don't-cares. T excitation: T = Q xor Q(next), no don't-cares.",
    ],
    shortcuts: [
      "To tell Mealy from Moore fast, look only at label placement on the diagram - inside states or on arrows - rather than tracing behaviour through several transitions.",
      "When filling an excitation table for SR or JK, use the don't-cares aggressively during the later K-map step; they are exactly what keeps the resulting circuit small.",
    ],
    pyqRelevance: `Full sequential circuit synthesis (design a counter or simple sequence detector using JK/D flip-flops) is a heavyweight, high-value question type, often 2+ marks, and Mealy-versus-Moore identification from a given diagram is a fast, recurring 1-mark question on its own.`,
    interviewConnection: `Every state machine you implement in software - a parser, a connection's open/half-open/closed lifecycle, a UI component's loading/error/ready states - is this same model: current state plus current input determines next state and output. The Mealy/Moore distinction maps directly onto "does this event handler's output depend only on the stored state, or also on the specific event just received."`,
    revisionSummary: `Sequential circuit = combinational logic + flip-flops with feedback. Moore: output depends only on state (in the circle). Mealy: output depends on state and input (on the arrow). Synthesis: state table -> state assignment -> excitation table -> minimize each flip-flop's input -> draw. Excitation tables run a flip-flop's truth table backwards, and SR/JK versions carry heavy don't-care structure worth exploiting during minimization.`,
    shortNotes: {
      oneMinute: "Sequential = combinational logic + flip-flops + feedback. Moore: output in the state (state-only). Mealy: output on the arrow (state+input). Design: state table -> assign codes -> excitation table -> minimize each FF input -> draw. Excitation table = truth table read backwards; SR/JK have lots of don't-cares, D/T have none.",
    },
    mcqs: [
      {
        question: "In a state diagram, an output value is written next to a transition arrow rather than inside a state circle. This indicates:",
        options: ["A Moore machine", "A Mealy machine", "An invalid diagram", "A combinational circuit"],
        correctIndex: 1,
        explanation: "Output on the transition arrow means the output depends on both the current state and the current input at the moment of that transition - the defining property of a Mealy machine.",
      },
      {
        question: "How many flip-flops are needed at minimum to implement a sequential circuit with 6 distinct states?",
        options: ["2", "3", "6", "5"],
        correctIndex: 1,
        explanation: "ceil(log2(6)) = ceil(2.585) = 3. Two flip-flops can only encode 4 states, which is not enough for 6.",
      },
      {
        question: "In the JK excitation table, a transition from Q=0 to Q(next)=0 requires:",
        options: ["J=1, K=X", "J=0, K=X", "J=X, K=1", "J=X, K=0"],
        correctIndex: 1,
        explanation: "Staying at 0 can be reached by HOLD (J=0,K=0) or RESET (J=0,K=1) - J must be 0 in both, and K can be either, so K is the don't-care here.",
      },
    ],
  },

  "counters-and-shift-registers": {
    difficulty: "Moderate",
    estimatedMinutes: 30,
    xpReward: 25, coinReward: 10,
    // Verified real (title confirmed via direct fetch, 2026-08-13) - covers
    // counters specifically; no single video covering both counters AND
    // shift registers was found, so this is honestly the counters half only.
    resources: [{
      kind: "video",
      title: "Introduction to Counters - Neso Academy",
      url: "https://www.youtube.com/watch?v=iaIu5SYmWVM",
      description: "Covers counters specifically, not shift registers.",
    }],
    whatYoullLearn: [
      "Asynchronous (ripple) counters versus synchronous counters, and the delay trade-off between them",
      "Designing a mod-N counter for an N that isn't a clean power of two",
      "The four shift register modes: SISO, SIPO, PISO, PIPO",
      "Reading a ring counter and a Johnson counter as two different wiring choices for the same shift register",
    ],
    prerequisites: ["Sequential Circuit Design"],
    concept: `## A Counter Is Just A State Machine That Counts

::: story
A counter is nothing conceptually new - it's a sequential circuit whose states happen to be arranged so that each clock edge moves to "the next number" instead of some arbitrary state graph. What makes counters their own topic is the two different WIRING styles for building one, which trade circuit simplicity against speed.
:::

## Ripple (Asynchronous) Versus Synchronous

::: cards Two ways to wire a counter
Asynchronous / ripple counter :: Each flip-flop's clock input is driven by the PREVIOUS flip-flop's output, not by the master clock directly. Simple to wire (each stage is just a T flip-flop toggling), but each stage's change has to physically ripple through before the next stage even sees a clock edge - the same delay problem as a ripple-carry adder, one topic over.
Synchronous counter :: Every flip-flop shares the SAME clock signal directly. Extra combinational logic decides each flip-flop's next input so that all of them change together, in one clock period, with no rippling delay - at the cost of more gates.
:::

::: mistake
"Asynchronous" does not mean "unclocked" - every stage is still a clocked flip-flop. It means the flip-flops are not all clocked by the SAME signal at the SAME time; each one is triggered by the previous stage's output transition instead.
:::

## Designing A Mod-N Counter

A binary counter with n flip-flops naturally cycles through 2^n states. Plenty of real counters need to count to some other number - a mod-6 counter for a 6-position mechanism, say - which is not a power of two.

::: flow
Pick enough flip-flops :: ceil(log2(N)) flip-flops for a mod-N counter.
Let it count normally up to N-1 :: States 0 through N-1 behave like an ordinary binary counter.
Force a reset at state N :: Add logic that detects state N (or state N-1's clock edge) and forces the counter back to state 0 instead of continuing to 2^n - 1.
:::

::: checkpoint
A mod-6 counter is built from 3 flip-flops (which naturally cycle through 8 states, 0-7). What must the design do at state 5?
- ( ) Nothing special - let it continue to 6, 7, then wrap
- (x) Detect state 5 (or the transition out of it) and force the next state back to 0
- ( ) Stop the clock entirely
- ( ) Add a fourth flip-flop
> A mod-6 counter must only ever show states 0-5. With 3 flip-flops naturally offering 8 states, extra logic must intercept the count after state 5 and reset to 0, rather than letting it continue toward 6 and 7.
:::

## Shift Registers: The Same Flip-Flop Chain, Different Doors

A shift register is a chain of flip-flops where each one's output feeds the next one's input, shifting a bit pattern along the chain one position per clock edge.

::: cards The four modes, named by their doors
SISO :: Serial-In, Serial-Out. Data enters and leaves one bit at a time - useful as a fixed delay line.
SIPO :: Serial-In, Parallel-Out. Bits enter one at a time but every stage's value is readable simultaneously - the standard way to convert a serial data stream into a parallel word.
PISO :: Parallel-In, Serial-Out. Load an entire word at once, then shift it out one bit per clock - the reverse conversion.
PIPO :: Parallel-In, Parallel-Out. Load and read the whole word at once; the shift register acts as a plain buffer/register here.
:::

::: interview
SIPO and PISO are exactly how a UART (serial port) talks to a parallel data bus in both directions - this is not a toy example, it's the actual mechanism inside real serial communication hardware.
:::

## Two Special Shift-Register Wirings

A **ring counter** feeds the last flip-flop's output straight back to the first flip-flop's input, circulating a single 1 (or 0) around the ring forever - it needs n flip-flops to produce n distinct states. A **Johnson counter** feeds back the COMPLEMENT of the last stage instead, which doubles the number of distinct states to 2n for the same n flip-flops, at the cost of a less obviously "single moving light" pattern.`,
    deepDive: `## Why Ripple Counters Still Get Used

Ripple counters need only n flip-flops with no extra combinational logic at all, which makes them cheap and simple to build correctly - genuinely the right choice when the propagation delay (bounded by n stage-delays) is acceptable for the application's clock speed. Synchronous counters trade that simplicity for speed, which matters once a counter needs to run at the same clock rate as the rest of a fast synchronous system.

## Counting Down, And Counting Either Way

An up/down counter adds one more control input that decides whether each flip-flop's toggle condition follows the increment or decrement pattern - structurally it's the same mod-N counter idea, but with two different next-state rules selected by that extra control line rather than one fixed rule.`,
    codeExample: {
      language: "c",
      code: `#include <stdio.h>

/* Simulate a mod-6 synchronous counter using plain integer arithmetic -
   the "reset at N" logic a real mod-N counter's extra gates implement. */
int modCounter(int current, int N) {
    int next = current + 1;
    if (next == N) next = 0;   /* force reset instead of continuing to N */
    return next;
}

int main(void) {
    int state = 0;
    for (int clk = 0; clk < 8; clk++) {
        printf("%d ", state);
        state = modCounter(state, 6);
    }
    printf("\\n");
    return 0;
}`,
      expectedOutput: `0 1 2 3 4 5 0 1 `,
    },
    keyPoints: [
      "A ripple (asynchronous) counter chains each flip-flop's clock to the previous stage's output - simple, but delay grows with the number of stages, like a ripple-carry adder.",
      "A synchronous counter clocks every flip-flop from the same signal, using extra combinational logic so all stages change together in one clock period.",
      "A mod-N counter (N not a power of 2) needs ceil(log2 N) flip-flops plus reset logic that forces state N back to 0.",
      "Four shift register modes by input/output style: SISO, SIPO, PISO, PIPO - SIPO and PISO are the real mechanism behind serial-to-parallel conversion (e.g. UARTs).",
      "A ring counter recirculates the last stage's output directly (n states from n flip-flops); a Johnson counter recirculates its complement instead (2n states from n flip-flops).",
    ],
    analogies: [
      "A ripple counter is a line of people passing a whispered message one at a time - it works with the simplest possible setup, but the message takes longer to reach the far end as the line gets longer. A synchronous counter is the same message broadcast to everyone at once over a loudspeaker - faster, but you need the loudspeaker (extra gates) to make it happen.",
      "A Johnson counter is a ring counter that circulates a complemented signal instead of a plain one - like a relay race where each runner hands off the baton upside-down, which doubles how many distinct 'positions' the baton can be seen in before the pattern repeats.",
    ],
    commonMistakes: [
      "Thinking 'asynchronous counter' means unclocked - every flip-flop is still clocked, just not all by the same signal at the same time.",
      "Forgetting the reset logic in a mod-N counter design, letting the count continue past N-1 toward the flip-flops' full natural range.",
      "Mixing up SIPO and PISO - remember which end (serial or parallel) is the INPUT versus the OUTPUT for each.",
      "Assuming a ring counter and a Johnson counter give the same number of states for the same flip-flop count - a Johnson counter doubles it via the complemented feedback.",
    ],
    memoryTricks: [
      "Ripple = each stage waits for the one before it, like dominoes. Synchronous = one shared clock, all stages move together.",
      "SISO/SIPO/PISO/PIPO: read the four letters as (input style)(output style) - Serial or Parallel, In then Out.",
      "Ring counter: n flip-flops, n states, plain feedback. Johnson counter: n flip-flops, 2n states, COMPLEMENTED feedback.",
    ],
    formulas: [
      "Mod-N counter needs ceil(log2 N) flip-flops.",
      "Ring counter: n flip-flops give n distinct states.",
      "Johnson counter: n flip-flops give 2n distinct states.",
      "Ripple counter worst-case delay is roughly proportional to the number of stages (each stage waits on the previous one's transition).",
    ],
    shortcuts: [
      "For 'how many flip-flops for a mod-N counter', take ceil(log2 N) directly rather than listing states.",
      "For a ring-vs-Johnson state-count question, just double n for Johnson and don't for a plain ring - no need to trace the actual bit patterns unless the question asks for them.",
    ],
    pyqRelevance: `Mod-N counter design and state-count questions for ring/Johnson counters are recurring 1-2 mark questions. Ripple-versus-synchronous delay comparisons and identifying a shift register's mode (SISO/SIPO/PISO/PIPO) from a described wiring are the other common shapes.`,
    interviewConnection: `Shift registers doing SIPO/PISO conversion are the literal mechanism inside UART and SPI serial communication hardware; understanding ripple-versus-synchronous delay trade-offs also transfers directly to reasoning about any pipeline where stages can either wait on each other (ripple-like) or be coordinated by one shared clock/barrier (synchronous-like).`,
    revisionSummary: `Ripple counter: each stage clocked by the previous stage's output, simple but delay grows with stage count. Synchronous counter: one shared clock, extra logic, no rippling delay. Mod-N counter: ceil(log2 N) flip-flops plus reset-at-N logic. Shift register modes: SISO, SIPO, PISO, PIPO, named by serial/parallel in and out. Ring counter: n flip-flops, n states. Johnson counter: n flip-flops, 2n states, via complemented feedback.`,
    shortNotes: {
      oneMinute: "Ripple counter: chained clocking, delay grows with stages. Synchronous: shared clock, extra logic, no ripple delay. Mod-N counter: ceil(log2 N) flip-flops + reset-at-N logic. Shift reg modes: SISO/SIPO/PISO/PIPO. Ring counter: n FFs -> n states. Johnson counter: n FFs -> 2n states (complemented feedback).",
    },
    mcqs: [
      {
        question: "What is the defining characteristic of an asynchronous (ripple) counter?",
        options: [
          "It has no clock at all",
          "Each flip-flop is clocked by the output of the previous flip-flop, not by a shared clock signal",
          "It can only count up, never down",
          "It requires exactly 2 flip-flops",
        ],
        correctIndex: 1,
        explanation: "Every stage is still clocked - just not by the same signal simultaneously. Each flip-flop's clock input comes from the previous stage's output transition, which is what causes the ripple delay.",
      },
      {
        question: "A Johnson counter built from 4 flip-flops produces how many distinct states?",
        options: ["4", "8", "16", "2"],
        correctIndex: 1,
        explanation: "A Johnson counter gives 2n states for n flip-flops, so 4 flip-flops give 2 x 4 = 8 states - double what a plain ring counter with the same 4 flip-flops would give (4 states).",
      },
      {
        question: "Which shift register configuration is used to convert a serial data stream into a parallel word?",
        options: ["SISO", "SIPO", "PISO", "PIPO"],
        correctIndex: 1,
        explanation: "SIPO (Serial-In, Parallel-Out) takes data in one bit at a time but makes every stage's stored bit readable simultaneously, which is exactly a serial-to-parallel conversion.",
      },
    ],
    numericals: [
      {
        question: "What is the minimum number of flip-flops required to build a mod-10 (decade) counter?",
        answerMin: 4, answerMax: 4,
        unit: "flip-flops",
        solution: `ceil(log2(10)) = ceil(3.32) = 4. Three flip-flops only reach 8 states,
which is not enough to represent 10 distinct counter values, so a
fourth is required (with reset-at-10 logic to prevent it from
counting all the way to 15).`,
      },
    ],
  },

  "finite-state-machine-design": {
    difficulty: "Hard",
    estimatedMinutes: 40,
    xpReward: 30, coinReward: 12,
    // Verified real (title confirmed via direct fetch, 2026-08-13).
    resources: [{
      kind: "video",
      title: "Finite State Machine | Mealy Machine | Moore Machine",
      url: "https://www.youtube.com/watch?v=ublVFRXOdZo",
      description: "Whole video covers this topic from the start.",
    }],
    whatYoullLearn: [
      "Designing an FSM from a word problem: deciding what the states actually need to remember",
      "State minimization - merging states that behave identically from every input",
      "State assignment strategies and why the chosen encoding changes the resulting gate count",
      "Tracing a sequence detector through several inputs to confirm the design actually works",
    ],
    prerequisites: ["Sequential Circuit Design", "Counters and Shift Registers"],
    concept: `## A Vending Machine's Memory Is A State Machine

::: story
A vending machine that accepts coins in 5-rupee increments and dispenses at 15 rupees does not need to remember the exact sequence of coins it received - only the total so far, capped usefully at "0, 5, 10, or dispensed". That short list of "situations worth distinguishing" IS the FSM's state set, and that is true of every FSM design problem: you are never modelling the whole history, only the part of it that still matters for future decisions.
:::

::: remember
Designing an FSM is answering one question over and over: **"what do I need to remember to decide correctly from here on?"** Two situations that lead to identical future behaviour, no matter what happens next, are the SAME state - don't give them separate circles.
:::

## From Word Problem To State Diagram

::: flow
1. Identify what must be remembered :: Not the whole input history - only the part still relevant to future outputs.
2. Name each distinct situation as a state :: Descriptive names (S_0coins, S_5coins), not just q0/q1 - exactly like designing a DFA in Theory of Computation.
3. Draw every transition :: For every state and every possible input, where does it go?
4. Decide Mealy or Moore :: Does the output depend only on the state, or on the state and the current input together?
5. Assign binary codes to states, then design as an ordinary sequential circuit :: State table, excitation tables, minimize, draw - the sequential-circuit-design recipe, applied to this specific diagram.
:::

## Worked Shape: A "1101" Sequence Detector

A Mealy detector for the overlapping-allowed pattern "1101" needs one state per "how much of 1101 have I matched so far, right now": S0 (nothing matched), S1 ("1" matched), S2 ("11" matched), S3 ("110" matched), and output 1 on the transition that completes "1101" back to a state consistent with the tail just seen.

::: mistake
The most common FSM design bug: on a mismatch, jumping all the way back to S0 without checking whether the input that broke the pattern is itself the START of a new partial match. For "1101", if you're in S3 (matched "110") and see a 0 instead of the needed 1, you must go to S0 - but if you're in S2 (matched "11") and see something that breaks the run, check whether that same symbol could restart a match, rather than resetting blindly.
:::

## State Minimization

::: story
A first-draft FSM, especially one built by inspection, often has more states than it needs - two states that transition identically for every input, to equivalent states, and produce the same output are functionally the same state and can be merged.
:::

This is exactly the equivalence idea from finite automata minimization, run on a machine that also produces outputs: two states are equivalent if, for every input, they go to equivalent next states AND produce the same output (for Moore machines) or the same output on matching inputs (for Mealy).

::: checkpoint
Two states of an FSM transition to the same next states on every input and produce identical outputs in every case. What should be done?
- ( ) Nothing; they must stay separate because they have different names
- (x) Merge them into a single state
- ( ) Add an extra flip-flop to distinguish them
- ( ) This situation cannot occur in a valid FSM
> If nothing about their behaviour - transitions or outputs - ever differs, no input sequence can tell them apart, so they are redundant as separate states and should be merged, exactly as with DFA state minimization.
:::

::: interview
FSM design is directly how you'd model a network connection's lifecycle (closed, listening, established, closing) or a UI component's states (loading, ready, error) in software - the "what must I remember" design question is identical whether it ends up as flip-flops or as an enum in code.
:::`,
    deepDive: `## State Assignment Changes The Circuit, Not The Behaviour

Two different binary codes assigned to the same states produce logically equivalent FSMs (same input/output behaviour) but can require very different amounts of combinational logic to implement - a "one-hot" assignment (one flip-flop per state, only one ever 1 at a time) often gives simpler next-state logic per flip-flop at the cost of using more flip-flops overall, while a dense binary encoding uses the fewest flip-flops but can need more complex excitation logic. GATE occasionally asks to compare gate counts across two given assignments for the same state diagram - there usually isn't one universally best choice, only a trade-off.

## Overlapping Versus Non-Overlapping Detection

A "does 1101 occur" detector must decide whether overlapping occurrences count - e.g. does "1101101" contain two occurrences (overlapping in the shared "1") or only complete non-overlapping windows? This choice changes what state a mismatch transitions back to, and is exactly the kind of assumption a GATE question states explicitly and expects you to follow precisely.`,
    dryRun: `Trace a Mealy "1101" detector (overlap allowed) through the input **1 1 0 1 1 0 1**.

States: S0 (no match), S1 ("1"), S2 ("11"), S3 ("110"). Output 1 fires exactly on the transition that completes "1101"; that transition also decides where to land next based on what the just-seen suffix restarts.

::: timeline Trace
Start :: S0.
Input 1 (1st) :: "1" matches the start of 1101. Move to S1. Output 0.
Input 1 (2nd) :: Now have "11" - still building toward 1101. Move to S2. Output 0.
Input 0 (3rd) :: Now have "110". Move to S3. Output 0.
Input 1 (4th) :: Completes "1101"! Output 1. Since the pattern allows overlap, check what partial match the trailing symbols still form - the just-consumed "1" alone restarts a match, so land in S1, not S0.
Input 1 (5th) :: From S1 ("1"), see another 1: now "11". Move to S2. Output 0.
Input 0 (6th) :: From S2 ("11"), see a 0: now "110". Move to S3. Output 0.
Input 1 (7th) :: Completes "1101" again, using symbols 4 through 7! Output 1. Same overlap handling: land back in S1.
:::

Output sequence across the seven inputs: **0 0 0 1 0 0 1**. The pattern "1101101" genuinely contains two overlapping occurrences of "1101" - one ending at the 4th symbol, one ending at the 7th - and an overlap-aware detector catches both. A detector that reset to S0 on every match would have missed the second one entirely.`,
    keyPoints: [
      "FSM design starts by identifying exactly what needs to be remembered - two situations with identical future behaviour are the same state, not two.",
      "Design procedure: identify states, name them descriptively, draw every transition, choose Mealy or Moore, then run the ordinary sequential-circuit-design recipe.",
      "State minimization merges states with identical transitions and outputs for every input - the same equivalence idea as DFA minimization, extended to include outputs.",
      "A sequence detector's mismatch transition must check whether the breaking symbol itself restarts a partial match, not reset blindly to the start state.",
      "Different state assignments (dense binary vs one-hot) for the same FSM change the resulting gate count and complexity, not the FSM's behaviour.",
    ],
    analogies: [
      "An FSM is a vending machine's internal 'how much have I been paid so far' memory - it only tracks totals that matter for future decisions (0, 5, 10, dispensed), never the literal sequence of coins inserted.",
      "A sequence detector losing track of overlap is like a lifeguard who, after one rescue, forgets to keep watching the water that's still moving - the moment that broke one match might already be building the next one.",
    ],
    commonMistakes: [
      "Resetting to the start state on every mismatch without checking whether the mismatching symbol itself restarts a partial match (the overlap trap).",
      "Creating a separate state for every input history seen, instead of merging histories that lead to identical future behaviour.",
      "Confusing Mealy and Moore mid-design, mixing where the output logic depends on the input.",
      "Assuming a smaller state-code assignment (fewer flip-flops) is always the better design - it can require significantly more complex excitation logic.",
    ],
    memoryTricks: [
      "FSM design question: 'what do I need to remember from here on?' Not the whole past - only the part that still matters.",
      "On a mismatch, ask: 'does this same symbol start a NEW partial match?' before resetting to S0.",
      "Two states with identical transitions AND identical outputs, for every input: merge them. Same rule as DFA minimization, plus outputs.",
    ],
    formulas: [
      "Number of flip-flops for an FSM with N states: ceil(log2 N) for dense encoding, N for one-hot encoding.",
      "State equivalence (for merging): states p, q are equivalent iff for every input, their next states are equivalent AND their outputs match (Moore: same state output; Mealy: same output per input).",
    ],
    shortcuts: [
      "When drawing a sequence detector, write out the pattern's own prefixes (for '1101': '', '1', '11', '110') - those prefixes are almost always exactly your state list.",
      "For a mismatch transition, check the longest suffix of what you've seen so far (including the new symbol) that is still a prefix of the target pattern - that tells you which state to land in without restarting a full trace.",
    ],
    pyqRelevance: `Sequence detector design (Mealy, usually a 3-4 bit pattern) is one of the highest-value Digital Logic questions on GATE, regularly worth 2 marks, and the overlap-handling mismatch transition is exactly where most designs lose marks. State minimization questions ("what is the minimum number of states needed") are the other recurring shape.`,
    interviewConnection: `Every non-trivial UI component, network connection handler, or parser you write in software is a finite state machine in exactly this sense - and the 'what needs to be remembered' design question, plus recognising when two code paths are really the same state in disguise, is precisely the discipline that keeps a stateful piece of code from growing an unmanageable pile of booleans.`,
    revisionSummary: `FSM design: identify what must be remembered, name states descriptively, draw every transition, choose Mealy/Moore, then apply the sequential-circuit-design recipe (state table, assignment, excitation, minimize, draw). Sequence detectors must handle overlap correctly on a mismatch - check whether the breaking symbol restarts a partial match rather than resetting blindly. State minimization merges states with identical transitions and outputs for every input, exactly like DFA minimization plus outputs. State assignment choice changes gate count, not behaviour.`,
    shortNotes: {
      oneMinute: "FSM design: figure out what must be remembered, name states, draw transitions, pick Mealy/Moore, then run state table -> assign -> excitation -> minimize -> draw. Sequence detector mismatch: check if the breaking symbol restarts a match, don't reset blindly. Merge states with identical transitions+outputs (like DFA minimization, plus outputs). Assignment choice changes gate count, not behaviour.",
    },
    mcqs: [
      {
        question: "In FSM design, two states are found to transition identically and produce identical outputs for every possible input. What should be done?",
        options: [
          "Keep them separate since they were reached differently",
          "Merge them into one state",
          "Delete both states",
          "Add a new state to distinguish them",
        ],
        correctIndex: 1,
        explanation: "If no input sequence can ever produce different future behaviour from the two states, they are functionally identical and should be merged - this is state minimization, the same principle as DFA equivalence with outputs added.",
      },
      {
        question: "Designing a sequence detector for '1101' (overlap allowed), you are in the state representing '110' matched and the next input is 0 (breaking the match). What must the design check?",
        options: [
          "Nothing; always go back to the start state",
          "Whether the new symbol, or the new tail formed, itself restarts a partial match toward the target pattern",
          "Whether the detector should stop entirely",
          "Whether to switch from Mealy to Moore",
        ],
        correctIndex: 1,
        explanation: "A correct overlap-aware detector always checks whether the tail after a mismatch still constitutes a valid partial match of the pattern (possibly of length 0, i.e. back to the start state) - blindly resetting to the start state is the classic bug this topic tests.",
      },
      {
        question: "Which factor changes when a different binary state assignment is chosen for the same FSM, with the same number of flip-flops?",
        options: [
          "The FSM's input/output behaviour",
          "The number of states",
          "The complexity of the combinational excitation logic",
          "Whether it is a Mealy or Moore machine",
        ],
        correctIndex: 2,
        explanation: "Behaviour, state count, and Mealy/Moore classification are all properties of the FSM itself and do not change with encoding. What changes is how simple or complex the resulting next-state (excitation) logic turns out to be - a different assignment can need more or fewer gates for logically identical behaviour.",
      },
    ],
  },

  // ---------------- Number Representation and Arithmetic ----------------

  "number-systems-and-base-conversion": {
    difficulty: "Easy",
    estimatedMinutes: 25,
    xpReward: 20, coinReward: 8,
    // Verified real (title confirmed via direct fetch, 2026-08-13) - a
    // dedicated single-topic video, so 0:00 genuinely is the right start,
    // not a placeholder guess.
    resources: [{
      kind: "video",
      title: "Introduction to Number Systems - Neso Academy",
      url: "https://www.youtube.com/watch?v=crSGS1uBSNQ",
      description: "Whole video covers this topic from the start.",
    }],
    whatYoullLearn: [
      "Converting between binary, octal, decimal and hexadecimal in both directions",
      "Why grouping bits in 3s or 4s makes octal and hex conversion almost free",
      "Sign-magnitude, 1's complement and 2's complement as three different ways to represent negative numbers",
      "Why 2's complement won and the others are mostly historical at this point",
    ],
    prerequisites: [],
    concept: `## Four Bases, One Underlying Idea

::: story
Decimal uses 10 digits because humans have 10 fingers. A computer has no fingers - only wires that are either on or off - so it counts in base 2. Octal (base 8) and hexadecimal (base 16) are not separate number systems a computer actually uses; they exist purely as a compact, human-readable shorthand for binary, chosen specifically because 8 = 2^3 and 16 = 2^4.
:::

::: remember
Any positional number system works the same way: a digit's value is (digit) x (base)^(position), summed across all positions. Binary, octal, decimal and hex all follow this identical rule with only the base changing.
:::

## Binary To Octal/Hex, Almost For Free

::: flow
Binary to octal :: Group binary digits in 3s, starting from the RIGHT (the least significant bit). Convert each group to its single octal digit.
Binary to hex :: Group binary digits in 4s, starting from the RIGHT. Convert each group to its single hex digit.
Octal/hex to binary :: Reverse - expand each digit back to its fixed-width binary group (3 bits for octal, 4 for hex) and concatenate.
:::

::: remember
This grouping trick works ONLY because 8 and 16 are powers of 2. It has no equivalent for converting binary to decimal, which is exactly why decimal conversion needs actual arithmetic (repeated division) instead of simple grouping.
:::

::: checkpoint
Convert binary 101101 to hexadecimal.
- ( ) 5D
- (x) 2D
- ( ) 6B
- ( ) 45
> Group in 4s from the right: 10 1101 -> pad the left group to 4 bits: 0010 1101. 0010 = 2, 1101 = D. Result: 2D.
:::

## Decimal Conversion Needs Real Division

Decimal to binary: repeatedly divide by 2, recording remainders, and read them bottom-to-top. Decimal to any base b: the same process, dividing by b instead. Binary (or any base) to decimal: multiply each digit by its positional power of the base and sum.

## Representing Negative Numbers

::: cards Three schemes for the sign
Sign-magnitude :: The leftmost bit is purely a sign flag (0=positive, 1=negative); the rest is the plain magnitude. Simple to read, but has TWO representations of zero (+0 and -0), and arithmetic needs separate add/subtract logic depending on signs.
1's complement :: Negate a number by flipping every bit. Still has two zeros (all-0s and all-1s), and addition needs an "end-around carry" fix-up.
2's complement :: Negate a number by flipping every bit and adding 1. Exactly ONE representation of zero, and - critically - ordinary binary addition just works for both positive and negative numbers, no special-casing needed.
:::

::: mistake
The most common exam slip: forgetting that 1's and sign-magnitude both have two zeros, while 2's complement has only one. This single-zero property is precisely why 2's complement won as the standard, and it's a fast way to distinguish the schemes on sight.
:::

::: interview
2's complement being the universal choice is not a historical accident: the fact that a CPU's adder circuit can add signed numbers with the exact same hardware it uses for unsigned numbers - no separate subtract circuit, no sign-checking logic - is the actual engineering reason. This single design decision underlies every ALU you will ever touch.
:::`,
    deepDive: `## The Range Asymmetry Puzzle

For an n-bit 2's complement number, the range is -2^(n-1) to +2^(n-1) - 1 - one MORE negative number than positive. This looks like an inconsistency but follows directly from having exactly one zero: zero uses up one of the 2^n available bit patterns on the "non-negative" side conceptually, but the all-1-followed-by-0s pattern (the most negative value) has no positive counterpart to pair with, since negating it would need to produce +2^(n-1), which doesn't fit in n bits. This is also exactly why negating the most negative n-bit 2's complement number overflows silently back to itself.

## Fast Base Conversion Without Long Division

To convert decimal to hex quickly, first convert to binary bit-by-bit reasoning about powers of 2 near the target, or to octal/hex directly by repeated division by 8/16 - the remainders read bottom-to-top give the digits, exactly like decimal-to-binary but with a bigger divisor.`,
    codeExample: {
      language: "c",
      code: `#include <stdio.h>

int main(void) {
    int n = 45;

    /* Decimal to binary, via repeated division - remainders read bottom-up */
    printf("45 in binary: ");
    char bits[9] = {0};
    int i = 8;
    int temp = n;
    while (temp > 0) {
        bits[--i] = (temp % 2) ? '1' : '0';
        temp /= 2;
    }
    printf("%s\\n", bits + i);   /* 101101 */

    /* Binary-to-hex, via 4-bit grouping (using a fixed 8-bit pattern) */
    unsigned char byte = 0b00101101;   /* same value, 45 */
    printf("As hex: %X\\n", byte);      /* 2D */

    /* 2's complement of 45 in 8 bits: flip all bits, add 1 */
    unsigned char twos = (~byte) + 1;
    printf("2's complement of 45 (8-bit): %d\\n", (signed char)twos); /* -45 */

    return 0;
}`,
      expectedOutput: `45 in binary: 101101
As hex: 2D
2's complement of 45 (8-bit): -45`,
    },
    keyPoints: [
      "Every positional number system uses the same rule - digit x base^position, summed - only the base itself changes across binary, octal, decimal, hex.",
      "Binary-to-octal groups bits in 3s, binary-to-hex groups bits in 4s, both from the right - this only works because 8 and 16 are powers of 2.",
      "Decimal conversion needs real repeated-division arithmetic; there's no grouping shortcut for it.",
      "Sign-magnitude and 1's complement both have two representations of zero; 2's complement has exactly one, which is the core reason it became the universal standard.",
      "2's complement negation is 'flip every bit, add 1' - and it lets ordinary binary addition handle signed arithmetic with no special hardware.",
    ],
    analogies: [
      "Grouping binary digits into octal/hex is like reading a long barcode by clumping its bars into recognisable little chunks instead of counting every single bar - it works specifically because the chunk size (3 or 4 bits) evenly divides how binary counts in the first place.",
    ],
    commonMistakes: [
      "Forgetting to pad the leftmost group with zeros to a full 3 (octal) or 4 (hex) bits before converting, and misreading the resulting digit.",
      "Trying to use bit-grouping to convert binary directly to DECIMAL - grouping only works for octal/hex, because only they are powers of 2.",
      "Mixing up 1's complement (flip bits only) with 2's complement (flip bits, then add 1).",
      "Forgetting that sign-magnitude and 1's complement have two zeros while 2's complement has only one.",
    ],
    memoryTricks: [
      "Octal = groups of 3 (2^3=8). Hex = groups of 4 (2^4=16). Group from the RIGHT, pad the leftmost group.",
      "2's complement: flip, then add 1 - 'flip and bump'.",
      "Two zeros: sign-magnitude, 1's complement. One zero: 2's complement (the winner).",
    ],
    formulas: [
      "Positional value: sum over all digit positions of (digit) x (base)^(position), position counted from 0 at the rightmost digit.",
      "2's complement negation: flip every bit, then add 1.",
      "n-bit 2's complement range: -2^(n-1) to +2^(n-1) - 1.",
    ],
    shortcuts: [
      "Convert binary to hex/octal by grouping, never by going through decimal first - it's a mechanical lookup, not arithmetic.",
      "To sanity-check a 2's complement negation, add the original and its negation together - the sum must be exactly 0 (mod 2^n) if the flip-and-add-1 was done correctly.",
    ],
    pyqRelevance: `Base conversion and 2's complement range questions are extremely common 1-mark questions, often folded into a larger arithmetic question (compute this in 2's complement, then convert the result to hex). The two-zeros-versus-one-zero distinction across the three signed representations is a recurring direct question.`,
    interviewConnection: `Every time you read a hex memory address or a hex color code, you're using binary-to-hex grouping without thinking about it. 2's complement specifically underlies how every signed integer type in every programming language actually behaves in memory - overflow bugs, unexpected negative numbers after a bit shift, and the "most negative number has no positive counterpart" edge case all trace back to this topic directly.`,
    revisionSummary: `All positional systems follow digit x base^position. Binary-hex/octal conversion is grouping (4 bits/3 bits) from the right - a shortcut that only works because 8 and 16 are powers of 2; decimal needs actual repeated division. Three signed representations: sign-magnitude and 1's complement both have two zeros; 2's complement has exactly one and lets ordinary addition handle signed numbers directly, which is why it's the universal standard. 2's complement negation: flip every bit, add 1.`,
    shortNotes: {
      oneMinute: "Positional value = digit x base^position. Bin-to-hex: group in 4s from right. Bin-to-octal: group in 3s. Decimal needs real division, no grouping shortcut. Sign-magnitude & 1's complement: two zeros. 2's complement: one zero, flip-and-add-1 to negate, ordinary addition just works.",
    },
    mcqs: [
      {
        question: "Convert binary 11010110 to hexadecimal.",
        options: ["D6", "C6", "D5", "E6"],
        correctIndex: 0,
        explanation: "Group in 4s: 1101 0110. 1101 = D, 0110 = 6. Result: D6.",
      },
      {
        question: "Which signed representation has exactly one representation of zero?",
        options: ["Sign-magnitude", "1's complement", "2's complement", "All three have exactly one"],
        correctIndex: 2,
        explanation: "Sign-magnitude and 1's complement both have +0 and -0 as distinct bit patterns. 2's complement has only a single all-zero pattern for zero - this is the key structural reason it became the standard.",
      },
      {
        question: "What is the 2's complement of 00010100 (8-bit)?",
        options: ["11101011", "11101100", "11101101", "00101100"],
        correctIndex: 2,
        explanation: "Flip every bit: 11101011. Add 1: 11101100... recompute: 11101011 + 1 = 11101100. That is the 2's complement (representing -20).",
      },
    ],
    numericals: [
      {
        question: "Convert decimal 173 to hexadecimal. The result is a two-digit hex number 'XY'. What is the decimal value of its most significant hex digit X?",
        answerMin: 10, answerMax: 10,
        unit: "",
        solution: `173 / 16 = 10 remainder 13. So 173 in hex is AD (A=10, D=13).
The most significant hex digit is A, whose decimal value is 10.`,
      },
    ],
  },

  "fixed-point-representation": {
    difficulty: "Moderate",
    estimatedMinutes: 30,
    xpReward: 25, coinReward: 10,
    // Verified real (title confirmed via direct fetch, 2026-08-13).
    resources: [{
      kind: "video",
      title: "Fixed Point Representation - Concept with Examples || Real Uses || Computer Organization || GATE",
      url: "https://www.youtube.com/watch?v=N3uPbPGR2Yw",
      description: "Whole video covers this topic from the start.",
    }],
    whatYoullLearn: [
      "Representing a fraction in binary by extending place value to negative exponents",
      "Where the binary point sits in a fixed-point format, and why that choice is fixed at design time",
      "The range and precision trade-off a fixed-point format locks in",
      "Converting a fixed-point bit pattern back to its decimal value",
    ],
    prerequisites: ["Number Systems and Base Conversion"],
    concept: `## Extending Place Value Past The Point

::: story
Decimal place value doesn't stop at the ones digit - 0.25 means 2 x 10^-1 + 5 x 10^-2. Binary works exactly the same way past its own point: 0.01 in binary means 0 x 2^-1 + 1 x 2^-2 = 0.25 in decimal. Fixed-point representation is just this idea, made concrete with a specific, AGREED-IN-ADVANCE number of bits on each side of the point.
:::

::: remember
"Fixed-point" means the position of the binary point is FIXED at design time and never moves during any calculation - contrast this directly with floating point, where the point's position is itself encoded and can shift.
:::

## Reading A Fixed-Point Format

A format is described as, say, "8 bits: 4 integer bits, 4 fractional bits" (often written Q4.4). The bits to the left of the point contribute positive powers of 2 (8,4,2,1); the bits to the right contribute negative powers of 2 (1/2, 1/4, 1/8, 1/16).

::: table Fixed-point bit weights, 4 integer + 4 fractional
Bit position | 3 | 2 | 1 | 0 | . | -1 | -2 | -3 | -4
Weight | 8 | 4 | 2 | 1 | . | 0.5 | 0.25 | 0.125 | 0.0625
:::

::: checkpoint
In a Q4.4 fixed-point format, the bit pattern 0011.1010 represents what decimal value?
- ( ) 3.5
- (x) 3.625
- ( ) 3.1
- ( ) 4.625
> Integer part 0011 = 3. Fractional part 1010 = 0.5 + 0 + 0.125 + 0 = 0.625. Total: 3 + 0.625 = 3.625.
:::

## The Trade-Off Fixed-Point Locks In

::: mistake
A fixed-point format's range and precision are BOTH decided the instant you choose how many bits go on each side of the point, and that choice can't be revisited per-value. More integer bits buy a bigger range (larger whole numbers) at the direct cost of fewer fractional bits, hence coarser precision - and vice versa. There is no way to have both without adding more bits overall.
:::

::: cards Why fixed-point still gets chosen
Deterministic precision :: Every value in a given format has EXACTLY the same absolute precision (the weight of the last fractional bit), unlike floating point where precision varies with magnitude.
Simple, fast hardware :: Fixed-point addition and subtraction are just ordinary integer operations - no exponent alignment step needed, which is why embedded/DSP systems favour it when the value range is known in advance.
Predictable rounding :: Because precision never varies, rounding behaviour is uniform across the whole representable range.
:::

## Signed Fixed-Point

Signed fixed-point numbers use exactly the same 2's complement idea from integer representation, just applied with the point shifted - negate a fixed-point value the same way: flip every bit (integer and fractional bits alike) and add 1 at the least significant fractional bit position.

::: interview
Fixed-point is exactly what many embedded systems and DSP chips use instead of floating point, specifically because it's cheaper in silicon and faster in cycles when the expected value range is known ahead of time - audio processing pipelines and older game console graphics are classic real examples.
:::`,
    deepDive: `## Comparing Q-Formats Directly

A Q8.8 format (8 integer, 8 fractional bits in 16 bits total) has a much finer fractional precision (weight of the last bit: 2^-8 = 1/256) than a Q12.4 format (weight of the last bit: 2^-4 = 1/16), but Q12.4 can represent much larger whole numbers. Neither is "better" in general - the right choice depends entirely on the known range of values the application needs, which is exactly the kind of trade-off question GATE poses by giving two formats and asking which suits a stated range/precision requirement.

## Overflow In Fixed-Point Arithmetic

Because the integer bit count is fixed, adding two fixed-point numbers whose sum exceeds the format's maximum representable value overflows exactly like plain 2's complement integer overflow - the fractional part's arithmetic doesn't change this at all, since addition/subtraction of aligned fixed-point numbers is literally identical to integer addition/subtraction, just with the result's binary point already sitting in the agreed spot.`,
    codeExample: {
      language: "c",
      code: `#include <stdio.h>

/* Represent a Q4.4 fixed-point number as a plain 8-bit integer,
   where the "real" value is (raw / 16.0) - 4 fractional bits means
   the last bit's weight is 1/16. */
double fixedToDecimal(unsigned char raw) {
    return raw / 16.0;
}

unsigned char decimalToFixed(double value) {
    return (unsigned char)(value * 16.0 + 0.5); /* +0.5 for rounding */
}

int main(void) {
    unsigned char bits = 0x3A;             /* 0011 1010 */
    printf("0011.1010 = %.3f\\n", fixedToDecimal(bits));   /* 3.625 */

    unsigned char encoded = decimalToFixed(5.25);
    printf("5.25 encoded as Q4.4 raw byte: 0x%02X\\n", encoded); /* 0x54 */

    return 0;
}`,
      expectedOutput: `0011.1010 = 3.625
5.25 encoded as Q4.4 raw byte: 0x54`,
    },
    keyPoints: [
      "Binary place value extends past the point exactly like decimal: bits to the right contribute negative powers of 2 (1/2, 1/4, 1/8, ...).",
      "Fixed-point means the binary point's position is fixed at design time and never moves - unlike floating point, where the point's position is itself part of the encoding.",
      "Choosing the integer/fractional bit split fixes both range and precision simultaneously - more integer bits means bigger range but coarser precision, and vice versa.",
      "Fixed-point addition/subtraction is ordinary integer arithmetic, with the binary point simply understood to sit in its agreed place - this is exactly why it's cheap in hardware.",
      "Signed fixed-point uses 2's complement across the whole bit pattern (integer and fractional bits together), negated the same way: flip all bits, add 1 at the last position.",
    ],
    analogies: [
      "A fixed-point format is like a price tag printed with a fixed number of decimal places always shown - useful and predictable as long as you know in advance the range of prices you'll ever need to display, but unable to stretch to show either a much bigger number or much finer change without redesigning the tag.",
    ],
    commonMistakes: [
      "Forgetting that fractional bits carry NEGATIVE powers of 2 (1/2, 1/4, ...) rather than continuing the positive powers from the integer side.",
      "Assuming a fixed-point format's precision can vary by value - it is exactly uniform everywhere in the format, unlike floating point.",
      "Treating fixed-point addition as needing special alignment logic - it doesn't; it's identical to plain integer addition once the format's point position is agreed.",
      "Picking more integer bits than a problem needs, unknowingly sacrificing fractional precision that was actually required.",
    ],
    memoryTricks: [
      "Past the point: powers of 2 go NEGATIVE - 1/2, 1/4, 1/8, 1/16, just like decimal's 1/10, 1/100.",
      "Fixed-point: point never moves. Floating point: point (via the exponent) can move. The name literally says which one is which.",
      "More integer bits = bigger range, fewer fractional bits = coarser precision. You cannot gain both without adding total bits.",
    ],
    formulas: [
      "Fractional bit at position -k contributes 2^-k to the value.",
      "Value = (integer part, ordinary binary) + (fractional part, sum of 2^-k for each set bit at position -k).",
      "Q(m).(n) format: m integer bits, n fractional bits, smallest representable positive increment = 2^-n.",
    ],
    shortcuts: [
      "To decode a fixed-point bit pattern fast, split at the point, convert the integer half normally, and for the fractional half just sum the powers of 2 for each 1-bit directly - no long division needed.",
      "To compare two Q-formats' precision, just compare 2^-n (n = fractional bit count) directly - smaller value means finer precision.",
    ],
    pyqRelevance: `Fixed-point conversion (bit pattern to decimal and back) is a steady, if less frequent, 1-2 mark question, and comparing two Q-formats' range/precision trade-off is the other common shape. It's also foundational for the floating-point questions that follow, since IEEE 754's mantissa is itself a fixed-point fraction.`,
    interviewConnection: `Audio, graphics and embedded/DSP code still uses fixed-point deliberately for speed and determinism, and any time you see money represented as an integer count of cents rather than a float, that's the exact same "fixed, known scale factor" idea in a software-only disguise, chosen to dodge floating-point rounding surprises entirely.`,
    revisionSummary: `Binary place value extends past the point using negative powers of 2 (1/2, 1/4, 1/8, ...). Fixed-point means the point's position is agreed and fixed at design time; addition/subtraction is then plain integer arithmetic. Choosing the integer/fractional split fixes range and precision together - more of one bit type costs the other. Signed fixed-point uses 2's complement across the whole pattern.`,
    shortNotes: {
      oneMinute: "Fractional bits carry NEGATIVE powers of 2. Fixed-point: point position agreed and fixed at design time -> addition/subtraction is plain integer math. Integer bits vs fractional bits trade range against precision - more of one costs the other. Signed fixed-point: 2's complement across the whole bit pattern.",
    },
    mcqs: [
      {
        question: "In a Q4.4 fixed-point format, what decimal value does 0101.0100 represent?",
        options: ["5.4", "5.25", "5.5", "5.125"],
        correctIndex: 1,
        explanation: "Integer part 0101 = 5. Fractional part 0100 = 0.25 (the 2^-2 bit is set, others are 0). Total: 5.25.",
      },
      {
        question: "What happens to a fixed-point format's precision if you move one bit from the fractional side to the integer side, keeping total bit count fixed?",
        options: [
          "Precision improves and range shrinks",
          "Precision worsens (coarser) and range grows",
          "Both precision and range improve",
          "Neither changes",
        ],
        correctIndex: 1,
        explanation: "One fewer fractional bit doubles the weight of the smallest representable step (coarser precision), while one more integer bit doubles the largest representable whole number (bigger range) - the classic fixed-point trade-off.",
      },
      {
        question: "How is a fixed-point number negated in a 2's complement fixed-point format?",
        options: [
          "Only the integer bits are flipped and incremented",
          "Only the fractional bits are flipped and incremented",
          "Every bit (integer and fractional) is flipped, then 1 is added at the least significant fractional position",
          "The binary point is moved one position to the left",
        ],
        correctIndex: 2,
        explanation: "2's complement negation treats the whole bit pattern as one unit: flip every bit across both the integer and fractional parts, then add 1 at the least significant (rightmost fractional) bit position.",
      },
    ],
    numericals: [
      {
        question: "In a Q4.4 fixed-point format, what is the smallest positive value (in decimal) that can be represented?",
        answerMin: 0, answerMax: 1,
        unit: "(0.0625)",
        solution: `The smallest step is the weight of the last (rightmost) fractional bit.
With 4 fractional bits, that weight is 2^-4 = 1/16 = 0.0625.`,
      },
    ],
  },

  "floating-point-representation-ieee-754": {
    difficulty: "Hard",
    estimatedMinutes: 40,
    xpReward: 30, coinReward: 12,
    // Verified real (title confirmed via direct fetch, 2026-08-13) - a
    // dedicated single-topic video, so 0:00 genuinely is the right start,
    // not a placeholder guess.
    resources: [{
      kind: "video",
      title: "IEEE Standard for Floating-Point Arithmetic (IEEE 754) - Neso Academy",
      url: "https://www.youtube.com/watch?v=_NFaYk9R9jI",
      description: "Whole video covers this topic from the start.",
    }],
    whatYoullLearn: [
      "The sign/exponent/mantissa layout of IEEE 754 single precision, bit by bit",
      "Why the exponent is stored with a bias instead of as a signed number",
      "The implicit leading 1 - the free bit of precision every normalized number gets",
      "Special bit patterns: zero, infinity, NaN, and why they exist",
    ],
    prerequisites: ["Fixed Point Representation", "Binary Arithmetic"],
    concept: `## Scientific Notation, Built Into Hardware

::: story
"602,000,000,000,000,000,000,000" is unwieldy to write and unwieldy to store with consistent precision across wildly different magnitudes. Scientific notation fixes this for humans: 6.02 x 10^23. IEEE 754 floating point is exactly the same idea, in binary, with a fixed number of bits allocated to each of the three pieces - sign, exponent, mantissa - so hardware can do this uniformly for every number instead of writing it out by hand.
:::

::: remember
Every IEEE 754 single-precision (32-bit) number is: **1 sign bit, 8 exponent bits, 23 mantissa (fraction) bits.** In that exact order, most-significant bit first. Double precision (64-bit) is the same idea with 1 sign bit, 11 exponent bits, 52 mantissa bits.
:::

::: table IEEE 754 single precision layout
Field | Bits | Meaning
Sign (S) | 1 | 0 = positive, 1 = negative
Exponent (E) | 8 | Stored with a BIAS of 127
Mantissa (M) | 23 | Fractional part after an IMPLICIT leading 1
:::

## Why The Exponent Is Biased, Not Signed

::: story
The exponent needs to represent both very large and very small (very negative) powers of 2. Storing it as an ordinary 2's complement signed number would work arithmetically, but it makes COMPARING two floating-point numbers by their raw bit pattern much harder - you'd need to check the sign of the exponent separately.
:::

Instead, IEEE 754 stores **E = actual exponent + 127** (for single precision), so the stored value is always non-negative and ranges from 1 to 254 for normal numbers (0 and 255 are reserved). This means comparing two positive floats as if they were plain unsigned integers gives the correct ordering directly - a deliberate design choice, not an accident.

::: mistake
Forgetting the bias is the single most common IEEE 754 error: the STORED exponent bits are never the actual exponent. Always subtract 127 (single) or 1023 (double) from the stored value to recover the real exponent - or add it when encoding.
:::

## The Implicit Leading 1

::: remember
A normalized binary number always looks like 1.xxxxx x 2^E - the leading digit before the point is ALWAYS 1 (never 0), because you can always shift the point until that's true, the same way 6.02 x 10^23 keeps exactly one nonzero digit before the decimal point. Since that leading 1 is guaranteed, IEEE 754 doesn't bother storing it - only the 23 (or 52) bits AFTER it, the "mantissa" or "fraction" field. This is one free bit of precision every normalized number gets, at no storage cost.
:::

::: checkpoint
The mantissa field of a normalized IEEE 754 single-precision number stores 01000000000000000000000. What is the actual significand (with its implicit bit restored)?
- ( ) 0.01000000000000000000000
- (x) 1.01000000000000000000000
- ( ) 1.10000000000000000000000
- ( ) 0.10000000000000000000000
> The implicit leading 1 is always prepended for a normalized number - it's never stored, but it's always there. 1. followed by the 23 stored mantissa bits.
:::

## Special Bit Patterns

::: cards Reserved exponent values
E = 0, M = 0 :: Represents exactly zero (signed: +0 or -0 depending on S).
E = 0, M != 0 :: A DENORMALIZED (subnormal) number - no implicit leading 1, used to represent values even smaller than the smallest normalized number, at reduced precision.
E = 255 (all 1s), M = 0 :: Infinity (signed: +infinity or -infinity).
E = 255 (all 1s), M != 0 :: NaN (Not a Number) - the result of an undefined operation like 0/0.
:::

::: interview
Every "why did my float comparison break" or "why is 0.1 + 0.2 not exactly 0.3" bug a working developer eventually hits traces back to this exact bit layout - finite mantissa bits mean most decimal fractions simply cannot be represented exactly in binary, no matter how many bits you throw at it.
:::`,
    deepDive: `## Converting A Decimal Number To IEEE 754, Fully

To encode 13.25 as single precision: convert to binary (13 = 1101, 0.25 = .01, so 13.25 = 1101.01), normalize to 1.10101 x 2^3 (shift the point 3 places left), set S=0 (positive), store E = 3 + 127 = 130 = 10000010 in binary, and store the mantissa as the bits after the implicit 1: 10101000000000000000000 (padded to 23 bits). The full 32 bits: 0 10000010 10101000000000000000000.

## Rounding And Why It's Unavoidable

Because the mantissa has a fixed, finite number of bits, most fractions (like decimal 0.1, which is an infinitely repeating binary fraction) cannot be stored exactly - the hardware rounds to the nearest representable value. This is why floating-point equality comparisons (\`a == b\`) are considered fragile practice; a small accumulated rounding error from a sequence of operations can leave two "mathematically equal" results differing in their very last mantissa bit.

## Precision Is Not Uniform, Unlike Fixed-Point

Because the mantissa always represents a value between 1.0 and just-under-2.0 regardless of the exponent, LARGER numbers have proportionally coarser absolute precision (the gap between two adjacent representable floats grows with magnitude) while smaller numbers get finer absolute precision. This is the direct opposite of fixed-point's uniform-precision-everywhere property, and it's exactly why the two representations suit different problems.`,
    codeExample: {
      language: "c",
      code: `#include <stdio.h>
#include <string.h>

int main(void) {
    float f = 13.25f;
    unsigned int bits;
    memcpy(&bits, &f, sizeof(bits));   /* reinterpret the float's raw bits */

    unsigned int sign = (bits >> 31) & 0x1;
    unsigned int exponent = (bits >> 23) & 0xFF;
    unsigned int mantissa = bits & 0x7FFFFF;

    printf("Sign: %u\\n", sign);
    printf("Stored exponent: %u (actual exponent: %d)\\n",
           exponent, (int)exponent - 127);
    printf("Mantissa (hex): %06X\\n", mantissa);

    return 0;
}`,
      expectedOutput: `Sign: 0
Stored exponent: 130 (actual exponent: 3)
Mantissa (hex): 550000`,
    },
    keyPoints: [
      "IEEE 754 single precision: 1 sign bit, 8 exponent bits (bias 127), 23 mantissa bits, in that order - double precision uses 1/11/52 with bias 1023.",
      "The exponent is stored biased (actual exponent + bias) specifically so raw bit patterns of positive floats compare correctly as plain unsigned integers.",
      "A normalized number always has an implicit leading 1 that is never stored - the 23/52 mantissa bits are only what comes AFTER that 1.",
      "Special patterns: E=0,M=0 is zero; E=0,M!=0 is denormalized; E=all-1s,M=0 is infinity; E=all-1s,M!=0 is NaN.",
      "Precision is NOT uniform across the range, unlike fixed-point - larger magnitudes have proportionally coarser absolute precision because the mantissa always sits between 1.0 and 2.0 regardless of exponent.",
    ],
    analogies: [
      "IEEE 754 is scientific notation with a fixed budget of digits: the exponent says 'how far to shift the point', the mantissa is 'the digits after the leading one', and the sign is just whether the whole thing is negative - exactly like 6.02 x 10^23, just in binary with hard bit limits on each piece.",
      "The implicit leading 1 is like a store that always prints '$1.xx' on every receipt and simply never bothers printing the guaranteed '1.' part - it's always there, so why spend a digit recording it.",
    ],
    commonMistakes: [
      "Forgetting the exponent bias and treating the stored exponent bits as the actual exponent directly.",
      "Forgetting the implicit leading 1 when reconstructing a normalized number's actual value from its stored mantissa bits.",
      "Confusing denormalized numbers (E=0, M!=0, no implicit 1) with normalized ones (implicit 1 always present).",
      "Comparing floats with == and being surprised when a value like 0.1 + 0.2 doesn't exactly equal 0.3 - finite mantissa bits make most decimal fractions inexact in binary.",
      "Assuming floating-point precision is uniform across all magnitudes the way fixed-point is - it is not; larger numbers have coarser absolute precision.",
    ],
    memoryTricks: [
      "Single precision: 1-8-23 (sign-exponent-mantissa), bias 127. Double: 1-11-52, bias 1023.",
      "Stored exponent is never the real one - always subtract the bias to decode, always add it to encode.",
      "'1.' is always there but never written - restore it before reading the mantissa as a value.",
      "All-1s exponent: infinity if mantissa is 0, NaN if mantissa is anything else.",
    ],
    formulas: [
      "Single precision value = (-1)^S x 1.M x 2^(E - 127), for normalized numbers (0 < E < 255).",
      "Double precision value = (-1)^S x 1.M x 2^(E - 1023), for normalized numbers (0 < E < 2047).",
      "Denormalized (E=0): value = (-1)^S x 0.M x 2^(1 - bias) - no implicit leading 1, and the exponent is fixed at the minimum.",
    ],
    shortcuts: [
      "To decode a 32-bit pattern fast: split 1/8/23, subtract 127 from the exponent field, prepend '1.' to the mantissa bits, then apply the sign.",
      "To spot special values instantly: exponent field all 0s or all 1s is always special (zero/denormal, or infinity/NaN) - never treat those two exponent values as ordinary.",
    ],
    pyqRelevance: `IEEE 754 encoding/decoding (given a decimal number, produce the 32-bit pattern, or vice versa) is one of the most reliably asked Digital Logic numericals, usually 2 marks, and getting the bias and implicit-1 steps right is exactly where most attempts lose marks. Identifying special patterns (is this bit pattern infinity, NaN, or a denormal) is the other common shape.`,
    interviewConnection: `Nearly every "why is this float comparison wrong" or "why did this sum drift slightly" bug in production numerical code is this exact representation showing its limits - understanding that most decimals aren't exactly representable, and that precision degrades at larger magnitudes, is what separates a developer who reaches for an epsilon-based comparison from one who is baffled by 0.1 + 0.2 != 0.3.`,
    revisionSummary: `IEEE 754 single precision: 1 sign, 8 exponent (bias 127), 23 mantissa bits. Double: 1, 11 (bias 1023), 52. Exponent is stored biased so raw bit comparison of positive floats works as unsigned integer comparison. Normalized numbers have an implicit leading 1, never stored. Special patterns: E=0,M=0 -> zero; E=0,M!=0 -> denormal; E=all-1s,M=0 -> infinity; E=all-1s,M!=0 -> NaN. Precision is coarser at larger magnitudes, unlike fixed-point's uniform precision.`,
    shortNotes: {
      oneMinute: "Single: 1-8-23, bias 127. Double: 1-11-52, bias 1023. Stored exponent = actual + bias (always subtract to decode). Implicit leading 1 on normalized numbers, never stored. E=0,M=0: zero. E=0,M!=0: denormal. E=all1,M=0: infinity. E=all1,M!=0: NaN. Precision worsens at larger magnitudes.",
    },
    mcqs: [
      {
        question: "In IEEE 754 single precision, a stored exponent field value of 130 corresponds to what actual exponent?",
        options: ["130", "3", "257", "-3"],
        correctIndex: 1,
        explanation: "Actual exponent = stored value - bias = 130 - 127 = 3.",
      },
      {
        question: "What does the bit pattern with sign=0, exponent=11111111, mantissa=00000000000000000000000 represent?",
        options: ["Zero", "The largest finite number", "Positive infinity", "NaN"],
        correctIndex: 2,
        explanation: "An all-1s exponent with a zero mantissa is defined as infinity; the sign bit being 0 makes it positive infinity specifically.",
      },
      {
        question: "Why is the IEEE 754 exponent stored with a bias rather than as a 2's complement signed value?",
        options: [
          "Bias makes the arithmetic hardware simpler for addition of mantissas",
          "It allows raw bit-pattern comparison of two positive floats to give the correct numeric ordering, like comparing unsigned integers",
          "There is no real reason; it is purely historical convention",
          "It doubles the exponent's representable range",
        ],
        correctIndex: 1,
        explanation: "Storing the exponent as a non-negative biased value means a larger stored exponent always corresponds to a larger actual value (for positive numbers), so comparing the raw bits works exactly like comparing unsigned integers - a deliberate design choice for fast comparison.",
      },
    ],
    numericals: [
      {
        question: "What is the biased exponent field (in decimal) stored for the IEEE 754 single-precision representation of 13.25?",
        answerMin: 130, answerMax: 130,
        unit: "",
        solution: `13.25 in binary is 1101.01, which normalizes to 1.10101 x 2^3.
The actual exponent is 3. The stored (biased) exponent is 3 + 127 = 130.`,
      },
      {
        question: "How many mantissa (fraction) bits does IEEE 754 double precision use?",
        answerMin: 52, answerMax: 52,
        unit: "bits",
        solution: `IEEE 754 double precision uses 1 sign bit + 11 exponent bits + 52
mantissa bits = 64 bits total. The mantissa field itself is 52 bits.`,
      },
    ],
  },

  "binary-arithmetic": {
    difficulty: "Moderate",
    estimatedMinutes: 30,
    xpReward: 25, coinReward: 10,
    // Verified real (title confirmed via direct fetch, 2026-08-13).
    resources: [{
      kind: "video",
      title: "Binary Arithmetic (Addition and Subtraction of Signed Numbers) using 2's Complement Form",
      url: "https://www.youtube.com/watch?v=YUDfEiW5K-w",
      description: "Whole video covers this topic from the start.",
    }],
    whatYoullLearn: [
      "Binary addition and subtraction, including borrow and the standard trick for avoiding it",
      "Detecting signed overflow from the carry bits, not by inspecting the actual numbers",
      "Binary multiplication and division by the shift-and-add / shift-and-subtract methods",
      "Reading 2's complement overflow correctly - and why the most negative number is a special case",
    ],
    prerequisites: ["Number Systems and Base Conversion", "Fixed Point Representation"],
    concept: `## Addition Is The Same Column-By-Column Idea As Decimal

::: story
Binary addition works exactly like the addition you learned as a child, column by column, carrying into the next column when a column's sum exceeds the base. The only difference is the base is 2, so any column sum of 2 or more carries.
:::

::: cards Binary addition, one column at a time
0 + 0 = 0 :: no carry
0 + 1 = 1 :: no carry
1 + 1 = 0 :: carry 1
1 + 1 + 1 (incoming carry) = 1 :: carry 1
:::

## Subtraction Via 2's Complement, Not Borrowing

::: remember
Hardware never implements borrow-based subtraction directly. Instead, **A - B is computed as A + (2's complement of B)** - subtraction becomes addition, and the SAME adder circuit handles both operations. This is the entire reason 2's complement is the standard signed representation.
:::

::: flow
To compute A - B :: Take the 2's complement of B (flip every bit, add 1).
Add A + (2's complement of B) :: Using plain binary addition.
Discard any final carry-out beyond the register width :: It's not part of the answer - it simply falls off the end.
:::

::: checkpoint
Compute 0101 - 0011 (5 - 3) in 4-bit 2's complement.
- ( ) 1000
- (x) 0010
- ( ) 0001
- ( ) 1110
> 2's complement of 0011 is 1100 + 1 = 1101. Add: 0101 + 1101 = 10010. Discard the carry-out beyond 4 bits: 0010, which is 2 - correct, since 5 - 3 = 2.
:::

## Detecting Overflow From The Carries, Not The Numbers

::: mistake
The most reliable overflow test - and the one GATE actually wants - is NOT "does the answer look wrong" but a mechanical rule: **signed overflow occurred exactly when the carry INTO the sign bit differs from the carry OUT of the sign bit.** If those two carries match, there is no overflow, however large the numbers looked.
:::

Equivalently: overflow can only happen when adding two numbers of the SAME sign and getting a result of the OPPOSITE sign - two positives should never sum to a negative, and two negatives should never sum to a positive; if that happens, overflow occurred. Adding numbers of different signs can never overflow.

## Multiplication And Division: Shift-And-Combine

::: cards Two mechanical procedures
Binary multiplication :: Shift-and-add - for each 1-bit in the multiplier, add the (correspondingly shifted) multiplicand into a running total; for each 0-bit, add nothing. Identical in spirit to decimal long multiplication.
Binary division :: Shift-and-subtract (restoring or non-restoring) - repeatedly shift the divisor and subtract it from the current remainder whenever it fits, recording a 1 (it fit) or 0 (it didn't) per step, building the quotient bit by bit.
:::

::: interview
"Why can a CPU add and subtract with one circuit but multiplication needs its own, slower unit" has this shift-and-add mechanism as its literal answer - multiplication is fundamentally a sequence of additions, not a single-step operation, which is exactly why it costs more cycles.
:::`,
    deepDive: `## The One Number 2's Complement Can't Negate Cleanly

For an n-bit 2's complement system, the most negative representable value (e.g. 1000 in 4 bits, representing -8) has NO positive counterpart in the same n bits (+8 doesn't fit in a 4-bit 2's complement range of -8 to +7). Attempting to negate it (flip all bits, add 1) produces the exact same bit pattern back - a silent, self-referential overflow that GATE likes to test specifically because it's the one case where "negate and check" fails to look like an error at all.

## Booth's Algorithm, In One Sentence

Ordinary shift-and-add multiplication needs one add per 1-bit in the multiplier. Booth's algorithm speeds this up by recognising that a RUN of consecutive 1s (like 0111100) can be handled with just two operations (subtract at the start of the run, add at the end) instead of one addition per bit in the run - useful specifically when multiplying by numbers with long runs of 1s.`,
    codeExample: {
      language: "c",
      code: `#include <stdio.h>

int main(void) {
    /* 4-bit 2's complement subtraction: 5 - 3, computed as 5 + (-3) */
    unsigned char a = 0b0101;               /* 5 */
    unsigned char b = 0b0011;               /* 3 */
    unsigned char negB = (~b + 1) & 0x0F;   /* 2's complement of b, in 4 bits */
    unsigned char result = (a + negB) & 0x0F; /* discard carry beyond 4 bits */

    printf("5 - 3 = %d (binary: %d%d%d%d)\\n", result,
           (result >> 3) & 1, (result >> 2) & 1, (result >> 1) & 1, result & 1);

    /* Overflow check: carry into sign bit vs carry out of sign bit */
    int sum9 = a + negB;              /* 5-bit result, keeps the real carry-out */
    int carryOut = (sum9 >> 4) & 1;
    int carryIn  = ((a & 0x7) + (negB & 0x7)) >> 3;  /* carry into bit 3 */
    printf("Overflow occurred: %s\\n", (carryIn != carryOut) ? "yes" : "no");

    return 0;
}`,
      expectedOutput: `5 - 3 = 2 (binary: 0010)
Overflow occurred: no`,
    },
    workedExamples: [
      {
        title: "Detecting overflow the mechanical way",
        problem: "In 4-bit 2's complement, add 0110 (6) and 0101 (5). Did overflow occur?",
        solution: "0110 + 0101 = 1011 in binary. Track the carries: bit0: 0+1=1, no carry. bit1: 1+0=1, no carry. bit2: 1+1=10, write 0 carry 1 into bit3. bit3 (sign bit): 0+0+ incoming carry 1 = 1, carry OUT of bit3 is 0. Carry INTO the sign bit was 1; carry OUT of the sign bit was 0 - they differ, so overflow occurred. Sanity check: 6+5=11, which needs 5 bits and cannot fit in the range -8..+7 that 4-bit 2's complement allows - 1011 is actually -5, confirming the wraparound.",
      },
      {
        title: "Shift-and-add multiplication",
        problem: "Multiply 1011 (11) by 0101 (5) using shift-and-add.",
        solution: "Multiplier bits from the right: bit0=1 -> add 1011 shifted 0: 00001011. bit1=0 -> add nothing. bit2=1 -> add 1011 shifted left 2 places (00101100). bit3=0 -> add nothing. Sum: 00001011 + 00101100 = 00110111 = 55 in decimal. Check: 11 x 5 = 55. Correct.",
      },
    ],
    keyPoints: [
      "Binary addition carries exactly like decimal addition, just base 2: any column sum of 2 or more produces a carry into the next column.",
      "Subtraction is never implemented as borrowing in hardware - A - B is computed as A + (2's complement of B), letting one adder circuit handle both operations.",
      "Signed overflow is detected mechanically: it occurred exactly when the carry INTO the sign bit differs from the carry OUT of the sign bit.",
      "Overflow can only happen when adding two numbers of the SAME sign; adding numbers of different signs can never overflow.",
      "Multiplication is shift-and-add (one addition per 1-bit in the multiplier); division is shift-and-subtract, building the quotient bit by bit.",
    ],
    analogies: [
      "Computing subtraction as 'add the 2's complement' is like paying a debt by handing over exact change computed in advance, rather than the cashier working out change on the spot - one mechanism (addition) handles both giving and taking.",
      "Shift-and-add multiplication is exactly long multiplication on paper, just with only two digits (0 and 1) to worry about at each step - a 0 digit means 'skip this row entirely'.",
    ],
    commonMistakes: [
      "Trying to detect overflow by 'does the answer look negative when it shouldn't' instead of the reliable carry-in-vs-carry-out-of-the-sign-bit rule.",
      "Forgetting that adding two numbers of DIFFERENT signs can never overflow - only same-sign additions can.",
      "Discarding the final carry-out in unsigned addition when it should actually be reported as an overflow/carry flag, versus correctly discarding it in signed 2's complement addition where it's not part of the answer.",
      "Forgetting that the most negative n-bit 2's complement number cannot be cleanly negated - flipping its bits and adding 1 returns the same pattern.",
    ],
    memoryTricks: [
      "Subtraction = addition in disguise: A - B = A + (~B + 1).",
      "Overflow rule: carry IN to the sign bit != carry OUT of the sign bit -> overflow. Same-sign inputs only.",
      "Multiply = shift-and-add. Divide = shift-and-subtract. Same mechanism, opposite direction.",
    ],
    formulas: [
      "A - B = A + (2's complement of B) = A + (~B + 1), with any carry beyond the register width discarded.",
      "Overflow (2's complement addition) occurs iff carry-in to the sign bit != carry-out of the sign bit.",
      "Equivalent overflow rule: overflow can only occur when both operands share the same sign and the result's sign differs from theirs.",
    ],
    shortcuts: [
      "For an overflow question, trace only the sign-bit column's carry-in and carry-out - you don't need to verify the rest of the sum at all.",
      "To sanity-check a subtraction done via 2's complement, add the result back to B (the original, non-complemented value) - it must reproduce A.",
    ],
    pyqRelevance: `Signed overflow detection (given a 2's complement addition, does it overflow) is one of the most common Digital Logic numericals, precisely because the carry-in/carry-out rule is easy to state but easy to apply wrong under time pressure. Shift-and-add multiplication traces are the other frequent shape, usually at 2 marks.`,
    interviewConnection: `Every integer overflow bug in production code - a counter that silently wraps to a huge negative number, a size calculation that overflows and allocates far too little memory - is this exact mechanism happening in real hardware; understanding the carry-based overflow rule is what lets you reason about exactly when such a bug can and cannot occur.`,
    revisionSummary: `Binary addition carries like decimal, base 2. Subtraction is done as A + (2's complement of B), so one adder handles both operations. Overflow: carry into the sign bit differs from carry out of it - and it can only occur when both operands share a sign. Multiplication is shift-and-add; division is shift-and-subtract. The most negative n-bit 2's complement number cannot be cleanly negated.`,
    shortNotes: {
      oneMinute: "A-B = A + 2's complement(B). Overflow: carry-in to sign bit != carry-out of sign bit; only possible with same-sign operands. Multiply = shift-and-add (per 1-bit of multiplier). Divide = shift-and-subtract. Most negative n-bit number can't be cleanly negated.",
    },
    mcqs: [
      {
        question: "In 2's complement addition, overflow can occur when:",
        options: [
          "The two operands have different signs",
          "The two operands have the same sign and the result's sign differs from theirs",
          "The result is exactly zero",
          "Either operand is zero",
        ],
        correctIndex: 1,
        explanation: "Adding operands of different signs can never overflow - the true sum always fits. Overflow is only possible when both operands share a sign and the computed result comes out with the opposite sign, which is impossible unless something wrapped around.",
      },
      {
        question: "What is 4-bit 2's complement subtraction 0011 - 0111 (3 - 7)?",
        options: ["1100", "1011", "0100", "1101"],
        correctIndex: 0,
        explanation: "2's complement of 0111 is 1000 + 1 = 1001. Add: 0011 + 1001 = 1100, which is -4 in 4-bit 2's complement - matching 3 - 7 = -4.",
      },
      {
        question: "Binary multiplication by the shift-and-add method adds the (shifted) multiplicand into the running total:",
        options: [
          "For every bit of the multiplier, regardless of its value",
          "Only for each 1-bit of the multiplier, shifted to match that bit's position",
          "Only once, at the position of the multiplier's most significant bit",
          "Only for each 0-bit of the multiplier",
        ],
        correctIndex: 1,
        explanation: "Each 1-bit in the multiplier contributes the multiplicand shifted to that bit's position; each 0-bit contributes nothing - exactly mirroring how decimal long multiplication skips a row for a 0 digit.",
      },
    ],
    numericals: [
      {
        question: "Add 0111 and 0001 in 4-bit 2's complement (7 + 1). Does signed overflow occur? Answer 1 for yes, 0 for no.",
        answerMin: 1, answerMax: 1,
        unit: "",
        solution: `0111 + 0001 = 1000. Tracking the sign-bit column: carry INTO bit 3 is 1
(from 1+1 in bit 2... trace: bit0:1+1=0 carry1, bit1:1+0+1=0 carry1,
bit2:1+0+1=0 carry1, bit3:0+0+1=1 carry0). Carry into sign bit = 1,
carry out of sign bit = 0 - they differ, so overflow = 1 (yes).
Sanity check: 7+1=8, which is outside the 4-bit signed range of
-8..+7's positive side (max +7), confirming the overflow.`,
      },
    ],
  },

};
