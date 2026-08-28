// GATE Engineering Mathematics, part C - authored lesson content. Follows the
// authoring rules documented at the top of general-aptitude.mjs.
//
// Completes Engineering Mathematics (33/33) alongside -a.mjs (Discrete Math
// I/II) and -b.mjs (Calculus + random-variables). This file covers:
//   - Discrete Math III: combinatorics-counting, recurrence-relations, generating-functions
//   - Linear Algebra (all 5): matrices, determinants, system-of-linear-equations,
//     eigenvalues-and-eigenvectors, lu-decomposition
//   - Probability & Statistics (remaining 8): uniform-distribution,
//     normal-distribution, exponential-distribution, poisson-distribution,
//     binomial-distribution, mean-median-mode-and-standard-deviation,
//     conditional-probability, bayes-theorem
//
// "recurrence-relations" here is the DISCRETE MATH treatment (constant-
// coefficient linear recurrences, characteristic-root method) - deliberately
// distinct from Algorithms' "recurrence-solving-for-algorithms" (Master
// Theorem, T(n) = aT(n/b) + f(n)). Cross-referenced in pyqRelevance rather
// than merged, since GATE tests both as separate question shapes.
//
// resources are intentionally omitted in this file - see the project's
// video-sourcing rule (only ever a verified real link, never invented).
// These 16 topics are pending a dedicated verification pass before any video
// resource is attached; leaving the field absent is correct until then, not
// an oversight.

export const ENGINEERING_MATHEMATICS_C = {

  // ---------------- Discrete Mathematics III: Combinatorics ----------------

  "combinatorics-counting": {
    difficulty: "Moderate",
    estimatedMinutes: 30,
    xpReward: 25, coinReward: 9,
    whatYoullLearn: [
      "When to multiply and when to add while counting - the two rules everything else builds from",
      "Permutations vs combinations, and the one question that tells them apart",
      "Counting with repetition allowed, and counting arrangements with repeated items",
      "The inclusion-exclusion principle for counting the size of a union of overlapping sets",
    ],
    prerequisites: ["Sets"],
    concept: `## Two Rules Generate Every Counting Problem

::: story
Every counting problem GATE asks eventually reduces to one of two moves: doing task A AND THEN task B (multiply the counts), or doing task A OR task B where they can't both happen (add the counts). The entire subject is deciding which move applies, and how many times.
:::

::: remember
**Multiplication rule**: if step 1 has m ways and step 2 has n ways, independently, the whole process has m x n ways. **Addition rule**: if you're choosing EITHER from a set of size m OR from a disjoint set of size n, that's m + n ways.
:::

## Permutations vs Combinations: Does Order Matter?

::: cards The one question that decides which formula
Permutation (order matters) :: nPr = n! / (n-r)!. Arranging r out of n distinct items into a sequence - "first place, second place, third place" are different outcomes.
Combination (order doesn't matter) :: nCr = n! / (r! (n-r)!). Choosing r out of n items as a group - a committee of {A,B,C} is the same committee no matter which name is written first.
Relationship :: nPr = nCr x r!. Every combination can be arranged in r! different orders to produce a permutation, which is exactly why dividing by r! turns one into the other.
:::

::: mistake
Reaching for nPr when the question describes a selection with no ordering (a committee, a subset, a hand of cards), or reaching for nCr when the question implies an assigned order (a ranking, a seating arrangement, a password). Read for whether swapping two chosen items produces a DIFFERENT valid outcome - if yes, it's a permutation.
:::

## Repetition and Inclusion-Exclusion

::: flow
Permutations with repetition allowed :: Choosing r items from n, where each choice can repeat (e.g. a 4-digit PIN): n^r, not nPr.
Arrangements with repeated items :: Arranging n items where some are identical (e.g. the letters of "MISSISSIPPI"): n! / (n1! n2! ... nk!), dividing out the ways to permute each identical group without producing a new visible arrangement.
Inclusion-exclusion (2 sets) :: |A union B| = |A| + |B| - |A intersect B|. Adding both sets double-counts the overlap once, so it's subtracted back out exactly once.
Inclusion-exclusion (3 sets) :: |A union B union C| = |A|+|B|+|C| - |AnB|-|AnC|-|BnC| + |AnBnC|. Each pairwise overlap is subtracted, then the triple overlap - removed three times by the pairwise terms - is added back once.
:::

::: checkpoint
How many distinct arrangements does the word "LEVEL" have?
- ( ) 120
- ( ) 60
- (x) 30
- ( ) 20
> LEVEL has 5 letters with L repeated twice and E repeated twice. Total arrangements = 5! / (2! * 2!) = 120 / 4 = 30. Forgetting to divide by the repeated letters' factorials is the standard trap here.
:::`,
    keyPoints: [
      "Multiplication rule for sequential independent choices, addition rule for disjoint alternatives - identify which structure the problem has first.",
      "Permutation nPr = n!/(n-r)! when order matters; combination nCr = n!/(r!(n-r)!) when it doesn't. nPr = nCr * r!.",
      "n^r counts permutations WITH repetition allowed (e.g. PINs, strings over an alphabet).",
      "Arranging n items with repeated types: n!/(n1! n2! ... nk!), dividing out indistinguishable rearrangements of each repeated group.",
      "Inclusion-exclusion for |A u B u C| adds singles, subtracts pairwise overlaps, adds back the triple overlap - each term corrects for over/under-counting from the term before it.",
    ],
    analogies: [
      "nPr is filling numbered boxes with distinct items (order = which box), nCr is filling one unordered bag (the box numbers don't exist).",
      "Inclusion-exclusion is like painting overlapping circles: paint each circle fully, then wipe off the double-painted overlaps, then repaint the triple-overlap that got wiped off one time too many.",
    ],
    commonMistakes: [
      "Using nPr for a selection problem (committees, subsets) where order genuinely doesn't distinguish outcomes.",
      "Forgetting to divide by repeated-item factorials when counting arrangements of a word or multiset.",
      "In inclusion-exclusion, forgetting the final +|AnBnC| term and stopping after subtracting the pairwise overlaps.",
      "Confusing 'with repetition allowed' (n^r) with the no-repetition permutation formula (nPr) - these apply to genuinely different problem setups.",
    ],
    memoryTricks: [
      "\"Order matters -> Permutation -> nPr.\" \"Order doesn't -> Combination -> nCr.\" Read the r's: P comes with an extra r! in the denominator relationship.",
      "Inclusion-exclusion sign pattern for n sets: alternates + - + - ..., one more term added at each level of overlap.",
    ],
    formulas: [
      "nPr = n! / (n-r)!   and   nCr = n! / (r!(n-r)!),  with nPr = nCr * r!.",
      "Permutations with repetition (r choices from n, repeats allowed): n^r.",
      "Arrangements of n items with repeated groups of size n1, n2, ...: n! / (n1! n2! ... nk!).",
      "|A u B| = |A| + |B| - |A n B|.   |A u B u C| = |A|+|B|+|C| - |AnB| - |AnC| - |BnC| + |AnBnC|.",
    ],
    shortcuts: [
      "If the problem says \"arrange\", \"order\", \"rank\", or \"sequence\", default to permutation thinking. If it says \"choose\", \"select\", \"form a group/committee\", default to combination thinking.",
      "For inclusion-exclusion with only 2 sets, don't reach for the 3-set formula out of habit - it collapses to the same thing with the triple term dropped, but writing it from scratch each time avoids sign errors.",
    ],
    pyqRelevance: `Combinatorics is a reliable 1-2 mark GATE question almost every year, most often as a direct nCr/nPr computation, a word-arrangement-with-repeats problem, or a small inclusion-exclusion count (e.g. "how many integers from 1 to 500 are divisible by 3 or 5"). The failure mode is almost never the arithmetic - it's misidentifying whether order matters in the first ten seconds of reading the question.`,
    interviewConnection: `Combinatorial counting underlies Big-O estimation for brute-force algorithms (why checking all subsets is O(2^n), why checking all permutations is O(n!)) and shows up directly in interview questions about generating all combinations/permutations of a set recursively.`,
    revisionSummary: `Multiplication rule for sequential choices, addition rule for disjoint alternatives. nPr = n!/(n-r)! (order matters), nCr = n!/(r!(n-r)!) (order doesn't), and nPr = nCr * r!.

Repetition allowed: n^r. Arranging a multiset with repeated items: n! / (n1! n2! ... nk!).

Inclusion-exclusion: |AuB| = |A|+|B|-|AnB|; for 3 sets add the singles, subtract the pairwise overlaps, add back the triple overlap.`,
    shortNotes: {
      oneMinute: "Order matters -> nPr = n!/(n-r)!. Order doesn't -> nCr = n!/(r!(n-r)!). nPr = nCr * r!. Repetition allowed: n^r. Multiset arrangement: n!/(n1!n2!...). Inclusion-exclusion (3 sets): sum singles - sum pairwise + triple.",
    },
    mcqs: [
      {
        question: "In how many ways can a committee of 3 people be chosen from a group of 8, where order of selection does not matter?",
        options: ["56", "336", "24", "112"],
        correctIndex: 0,
        explanation: "This is a combination, not a permutation, since a committee has no internal order. 8C3 = 8!/(3!5!) = 56.",
      },
      {
        question: "How many 4-digit codes can be formed using digits 0-9 if repetition of digits is allowed?",
        options: ["5040", "10000", "210", "3024"],
        correctIndex: 1,
        explanation: "Each of the 4 positions independently has 10 choices (repetition allowed), so the count is 10^4 = 10000, not a permutation-without-repetition count.",
      },
      {
        question: "Of 100 students, 40 take Math, 35 take Physics, and 15 take both. How many take Math or Physics?",
        options: ["75", "60", "90", "50"],
        correctIndex: 1,
        explanation: "|Math u Physics| = |Math| + |Physics| - |Math n Physics| = 40 + 35 - 15 = 60.",
      },
    ],
    numericals: [
      {
        question: "How many distinct arrangements does the word \"BANANA\" have? (B:1, A:3, N:2)",
        answerMin: 60,
        answerMax: 60,
        unit: "",
        solution: `BANANA has 6 letters: A repeated 3 times, N repeated 2 times, B once.

Arrangements = 6! / (3! * 2! * 1!) = 720 / (6*2) = 720/12 = 60`,
      },
    ],
  },

  "recurrence-relations": {
    difficulty: "Moderate",
    estimatedMinutes: 30,
    xpReward: 25, coinReward: 9,
    whatYoullLearn: [
      "What a recurrence relation is, and how it differs from a closed-form formula",
      "Solving a linear homogeneous recurrence with constant coefficients via its characteristic equation",
      "Handling the repeated-root case, where the standard solution form needs an extra factor of n",
      "Where this discrete-math treatment differs from the Master-Theorem recurrences used for algorithm complexity",
    ],
    prerequisites: ["Combinatorics: Counting"],
    concept: `## Defining A Sequence By Its Own Past

::: story
A recurrence relation defines each term of a sequence using earlier terms, rather than giving a direct formula in n. The Fibonacci sequence is the classic example: F(n) = F(n-1) + F(n-2), with F(0)=0, F(1)=1. It tells you exactly how to compute any term - but only by working forward from the start, one term at a time, unless you solve it into a closed form.
:::

::: remember
Solving a recurrence means finding a formula for the nth term in terms of n directly - no earlier terms required. That closed form lets you jump straight to term 1000 without computing terms 1 through 999 first.
:::

## The Characteristic Equation Method

::: cards Solving a_n = c1 a_(n-1) + c2 a_(n-2) (linear, constant coefficients)
Step 1 - characteristic equation :: Replace a_n with x^n throughout: x^2 = c1 x + c2, i.e. x^2 - c1 x - c2 = 0.
Step 2 - solve for roots :: Find the roots r1, r2 of this quadratic (or higher-degree equation for a longer recurrence).
Step 3 (distinct roots) :: General solution: a_n = A r1^n + B r2^n. Solve for A, B using the given initial conditions.
Step 3 (repeated root r) :: General solution: a_n = (A + Bn) r^n. The extra factor of n is required whenever a root repeats - using A r^n + B r^n collapses to one constant and can't satisfy two initial conditions.
:::

::: mistake
Using a_n = A r^n + B r^n for a repeated root instead of a_n = (A + Bn) r^n. The first form only has one真 degree of freedom in disguise (A+B is a single constant), so it cannot be fit to two independent initial conditions - GATE questions with a repeated root specifically test whether this is caught.
:::

## Non-Homogeneous Recurrences

::: flow
General solution structure :: a_n = (homogeneous solution) + (one particular solution). The homogeneous part solves a_n = c1 a_(n-1) + c2 a_(n-2) = 0 exactly as above; the particular solution is any ONE sequence that satisfies the full equation including its non-zero forcing term.
Guessing the particular solution :: For a constant forcing term, try a constant. For a forcing term that is itself a solution of the homogeneous equation, multiply the usual guess by n (the same repeated-root idea, one level up).
Combine and fit :: Add homogeneous + particular, THEN apply the initial conditions - applying them to the homogeneous part alone is a common shortcut that gives the wrong answer.
:::

::: checkpoint
Solve a_n = 4a_(n-1) - 4a_(n-2), a_0 = 1, a_1 = 4. What is a_2?
- ( ) 8
- (x) 12
- ( ) 16
- ( ) 4
> Characteristic equation: x^2 - 4x + 4 = 0, i.e. (x-2)^2 = 0 - a REPEATED root r=2. So a_n = (A + Bn)2^n. From a_0=1: A=1. From a_1=4: (1+B)(2)=4, so B=1. a_n = (1+n)2^n. a_2 = (1+2)(4) = 12. (Direct recurrence check: a_2 = 4(4) - 4(1) = 12 - matches.)
:::`,
    keyPoints: [
      "A recurrence defines a_n using earlier terms; solving it means finding a closed-form formula in n alone.",
      "For a_n = c1 a_(n-1) + c2 a_(n-2), form the characteristic equation x^2 = c1 x + c2 and solve for its roots.",
      "Distinct roots r1, r2: general solution A r1^n + B r2^n. Repeated root r: general solution (A + Bn) r^n - the extra n is mandatory.",
      "A non-homogeneous recurrence's solution is (homogeneous solution) + (one particular solution), with initial conditions applied to the SUM, not the homogeneous part alone.",
      "This characteristic-equation method is distinct from Master Theorem recurrences (T(n) = aT(n/b) + f(n)) used for algorithm complexity - same word \"recurrence\", different tool.",
    ],
    analogies: [
      "A recurrence is a recipe that says 'take yesterday's and the day before's results, combine them this way' - solving it is finding a formula that skips straight to any day without cooking every day in between.",
    ],
    commonMistakes: [
      "Writing a_n = A r^n + B r^n for a repeated root instead of (A+Bn) r^n - this loses a genuine degree of freedom and cannot fit both initial conditions.",
      "Applying initial conditions to only the homogeneous part of a non-homogeneous recurrence's solution, instead of the full homogeneous-plus-particular sum.",
      "Confusing this discrete-math characteristic-root method with the algorithms-context Master Theorem - they solve differently-shaped recurrences and are not interchangeable.",
      "Sign errors when forming the characteristic equation from a_n = c1 a_(n-1) + c2 a_(n-2) - it is x^2 - c1 x - c2 = 0, not x^2 + c1 x + c2 = 0.",
    ],
    memoryTricks: [
      "\"Replace a_n with x^n\" turns any linear constant-coefficient recurrence into an ordinary polynomial equation - the whole method in one sentence.",
      "Repeated root -> multiply by n. This exact same fix (\"multiply by n when a root repeats\") reappears in non-homogeneous particular-solution guessing too.",
    ],
    formulas: [
      "Characteristic equation of a_n = c1 a_(n-1) + c2 a_(n-2): x^2 - c1 x - c2 = 0.",
      "Distinct roots r1 != r2: a_n = A r1^n + B r2^n.",
      "Repeated root r: a_n = (A + Bn) r^n.",
      "Non-homogeneous: a_n = a_n^(homogeneous) + a_n^(particular).",
    ],
    shortcuts: [
      "Before solving, check if the recurrence is Fibonacci-shaped (a_n = a_(n-1) + a_(n-2)) - its characteristic roots are the golden ratio and its conjugate, a pattern worth recognising on sight.",
      "Verify any closed-form answer by plugging n=0 and n=1 (or the given initial terms) back in - a two-second check that catches most algebra slips.",
    ],
    pyqRelevance: `Recurrence relations appear as a 1-2 mark question, most often "solve for a closed form" or "find a_n for a specific small n" given a linear recurrence with 2 initial conditions. The repeated-root case is specifically favoured because it's the sub-case most students get wrong. Keep this distinct in your head from the Algorithms subject's recurrence-solving-for-algorithms (Master Theorem) - GATE asks both, in different sections, and mixing up the method costs the question entirely.`,
    interviewConnection: `Recognising a recurrence relation is exactly how recursive function time complexities get analysed before applying Master Theorem - and closed-form solving of a recurrence is literally how a naive recursive Fibonacci implementation gets replaced with an O(1) formula in an optimisation discussion.`,
    revisionSummary: `A recurrence defines a_n from earlier terms; solving it produces a closed-form formula in n.

For a_n = c1 a_(n-1) + c2 a_(n-2): characteristic equation x^2 - c1 x - c2 = 0. Distinct roots -> A r1^n + B r2^n. Repeated root r -> (A + Bn) r^n.

Non-homogeneous: solution = homogeneous + one particular solution, fit initial conditions to the sum.

Distinct from Master Theorem recurrences (Algorithms subject) - same word, different tool.`,
    shortNotes: {
      oneMinute: "Recurrence -> closed form. Characteristic eqn of a_n=c1 a_(n-1)+c2 a_(n-2): x^2-c1 x-c2=0. Distinct roots: A r1^n+B r2^n. Repeated root r: (A+Bn)r^n - the n is mandatory. Non-homogeneous = homogeneous + particular, fit ICs to the sum. Not the same tool as Master Theorem.",
    },
    mcqs: [
      {
        question: "What is the characteristic equation of the recurrence a_n = 5a_(n-1) - 6a_(n-2)?",
        options: ["x^2 - 5x - 6 = 0", "x^2 - 5x + 6 = 0", "x^2 + 5x - 6 = 0", "x^2 - 6x + 5 = 0"],
        correctIndex: 1,
        explanation: "Replace a_n with x^n: x^2 = 5x - 6, i.e. x^2 - 5x + 6 = 0 (note the sign: -c2 becomes +6 when c2 = -6... more directly, moving everything to one side of a_n - 5a_(n-1) + 6a_(n-2) = 0 gives x^2 - 5x + 6 = 0 directly).",
      },
      {
        question: "A linear constant-coefficient recurrence has a repeated characteristic root r = 3. What form does its general solution take?",
        options: ["A(3)^n + B(3)^n", "(A + Bn)(3)^n", "A(3)^n + Bn", "A(3)^(2n)"],
        correctIndex: 1,
        explanation: "A repeated root r requires the form (A + Bn) r^n - the extra factor of n supplies the second independent degree of freedom that a plain sum of two identical terms cannot.",
      },
    ],
    numericals: [
      {
        question: "For a_n = 3a_(n-1) - 2a_(n-2) with a_0 = 2, a_1 = 3, find a_2.",
        answerMin: 5,
        answerMax: 5,
        unit: "",
        solution: `Directly from the recurrence: a_2 = 3a_1 - 2a_0 = 3(3) - 2(2) = 9 - 4 = 5

(No need to solve the closed form for a single next term - just apply the recurrence once.)`,
      },
    ],
  },

  "generating-functions": {
    difficulty: "Hard",
    estimatedMinutes: 30,
    xpReward: 30, coinReward: 10,
    whatYoullLearn: [
      "What a generating function is, and why encoding a sequence as a power series makes it easier to manipulate",
      "How to read off standard generating functions for simple sequences directly",
      "Converting a recurrence relation into a generating function equation and extracting a closed form",
      "Using generating functions to count solutions to a combinatorial equation with constraints",
    ],
    prerequisites: ["Recurrence Relations"],
    concept: `## Turning A Sequence Into A Single Object

::: story
A generating function packs an entire sequence a_0, a_1, a_2, ... into one algebraic object: G(x) = a_0 + a_1 x + a_2 x^2 + a_3 x^3 + ... . The sequence becomes the coefficients of a power series. This looks like it makes things harder - now you have an infinite series instead of a list of numbers - but it turns sequence problems into ALGEBRA problems: adding sequences becomes adding functions, and certain recurrences become simple equations you can solve for G(x) directly.
:::

::: remember
The generating function of a_n is just a clothesline you hang the sequence on, one term per power of x. You never actually "evaluate" G(x) at a real number in these problems - x is a placeholder, not a number to plug in.
:::

## Standard Generating Functions Worth Knowing

::: cards Read these off directly - don't re-derive them each time
Constant sequence 1,1,1,... :: G(x) = 1/(1-x) = 1 + x + x^2 + x^3 + ... (the geometric series).
a_n = r^n (geometric sequence) :: G(x) = 1/(1-rx).
a_n = C(n+k-1, k-1) (stars and bars count) :: G(x) = 1/(1-x)^k.
Finite sequence, k+1 terms of 1 :: G(x) = 1 + x + ... + x^k = (1-x^(k+1))/(1-x).
:::

::: mistake
Trying to extract a_n by literally substituting a value for x and evaluating. The coefficient of x^n in the SERIES EXPANSION is a_n - you extract it by algebraic manipulation (partial fractions, known series expansions), never by plugging in a number.
:::

## From Recurrence To Closed Form

::: flow
1. Write the recurrence :: e.g. a_n = 2a_(n-1) + 1, for n >= 1, a_0 = 0.
2. Multiply by x^n and sum over all valid n :: Sum(a_n x^n) = 2 Sum(a_(n-1) x^n) + Sum(x^n), each sum taken over the recurrence's valid range.
3. Rewrite each sum in terms of G(x) :: Sum(a_n x^n) for n>=1 is G(x) - a_0. Sum(a_(n-1) x^n) for n>=1 is x G(x). Sum(x^n) for n>=1 is x/(1-x).
4. Solve the resulting algebraic equation for G(x) :: G(x) - a_0 = 2x G(x) + x/(1-x), giving G(x) in closed algebraic form.
5. Expand G(x) back into a power series (partial fractions) :: The coefficient of x^n in that expansion is the closed-form formula for a_n.
:::

::: checkpoint
What is the generating function for the sequence a_n = 1 for every n = 0,1,2,...?
- (x) 1/(1-x)
- ( ) 1/(1+x)
- ( ) x/(1-x)
- ( ) 1-x
> This is the standard geometric series: 1 + x + x^2 + x^3 + ... = 1/(1-x), the generating function for the all-ones sequence - the single most-used building block for every other generating function on this topic.
:::`,
    keyPoints: [
      "A generating function G(x) = sum(a_n x^n) encodes an entire sequence as the coefficients of a power series - x is a formal placeholder, never evaluated numerically.",
      "Memorise the standard forms: 1/(1-x) for the all-ones sequence, 1/(1-rx) for a geometric sequence r^n, and 1/(1-x)^k for stars-and-bars counts.",
      "Converting a recurrence to a GF equation: multiply by x^n, sum over the valid range, rewrite each sum in terms of G(x) itself, then solve algebraically.",
      "Recovering a_n from G(x) means expanding G(x) back into a series (often via partial fractions) and reading off the coefficient of x^n - not evaluating G at a number.",
      "Generating functions are especially powerful for counting constrained combinations (e.g. \"number of ways to pick coins summing to n\") by multiplying together one factor's GF per constraint.",
    ],
    analogies: [
      "A generating function is like a vending machine's product list encoded into a single barcode - scanning (expanding) it back out reproduces every individual item (coefficient) in order.",
    ],
    commonMistakes: [
      "Trying to compute a_n by substituting a numeric value into G(x) instead of extracting a series coefficient.",
      "Losing track of the summation's starting index when rewriting Sum(a_(n-1) x^n) in terms of G(x) - an off-by-one here corrupts the whole derivation.",
      "Forgetting the standard form 1/(1-x)^k for repeated stars-and-bars-style counting and re-deriving it from scratch under time pressure.",
    ],
    memoryTricks: [
      "1/(1-x) = 1+x+x^2+... is the ONE series to memorise cold - almost every other standard GF is a small variation of it (substitute rx for x, raise to a power, multiply by x^k).",
      "\"GF turns sequences into algebra, and algebra back into sequences\" - the whole point of the technique in one line.",
    ],
    formulas: [
      "G(x) = sum from n=0 to infinity of a_n x^n.",
      "All-ones sequence: 1/(1-x). Geometric r^n: 1/(1-rx). Stars-and-bars (k identical bins): 1/(1-x)^k.",
      "Sum(a_(n-1) x^n) for n>=1  =  x * G(x).",
    ],
    shortcuts: [
      "When a problem asks to count the number of ways to select items under a sum constraint (e.g. coins summing to a value), write one GF factor per item type and multiply them - the coefficient of x^n in the product is the answer, without enumerating cases by hand.",
      "If a recurrence looks Fibonacci-like, its generating function's denominator factors using the same characteristic roots the recurrence-relations method finds - the two techniques are two views of the same underlying algebra.",
    ],
    pyqRelevance: `Generating functions are a lower-frequency but recurring GATE topic, usually a single conceptual or short-computation question - most often "what is the generating function for this sequence" or a small coefficient-extraction problem, rather than a full recurrence-to-closed-form derivation under exam time pressure. Knowing the standard forms cold is worth more than being able to derive from a recurrence for this exam.`,
    interviewConnection: `Generating functions are the formal machinery behind counting arguments used in algorithm analysis (e.g. counting the number of binary trees of a given size, which is exactly the Catalan-number generating function) and appear in probability as probability-generating functions for computing moments of a distribution efficiently.`,
    revisionSummary: `A generating function G(x) = sum(a_n x^n) encodes a sequence as power-series coefficients - x is never evaluated numerically.

Standard forms: 1/(1-x) (all ones), 1/(1-rx) (geometric r^n), 1/(1-x)^k (stars-and-bars).

To solve a recurrence: multiply by x^n, sum, rewrite in terms of G(x), solve algebraically, then expand back (partial fractions) to read off a_n as a coefficient.`,
    shortNotes: {
      oneMinute: "G(x) = sum(a_n x^n), x is a placeholder not a number to plug in. Standard forms: 1/(1-x) all-ones, 1/(1-rx) geometric, 1/(1-x)^k stars-and-bars. Recurrence -> GF: multiply by x^n, sum, rewrite via G(x), solve, expand back via partial fractions for a_n.",
    },
    mcqs: [
      {
        question: "What is the generating function for the geometric sequence a_n = 3^n (n = 0, 1, 2, ...)?",
        options: ["1/(1-3x)", "1/(1-x)^3", "3/(1-x)", "1/(1+3x)"],
        correctIndex: 0,
        explanation: "The standard geometric-sequence generating function is 1/(1-rx) for a_n = r^n; substituting r=3 gives 1/(1-3x).",
      },
      {
        question: "To recover the value of a_5 from a known generating function G(x), what must be done?",
        options: [
          "Evaluate G(5)",
          "Evaluate G(1/5)",
          "Extract the coefficient of x^5 in the series expansion of G(x)",
          "Differentiate G(x) five times and evaluate at x=0 directly without dividing by 5!",
        ],
        correctIndex: 2,
        explanation: "a_n is defined as the coefficient of x^n in G(x)'s series expansion - it is read off algebraically (e.g. via partial fractions), never by evaluating G at a number.",
      },
    ],
    numericals: [],
  },

  // ---------------- Linear Algebra ----------------

  "matrices": {
    difficulty: "Easy",
    estimatedMinutes: 25,
    xpReward: 20, coinReward: 8,
    whatYoullLearn: [
      "The core matrix operations - addition, multiplication, transpose - and which ones require compatible dimensions",
      "Special matrices (symmetric, skew-symmetric, orthogonal, idempotent) and the one defining property of each",
      "Why matrix multiplication is not commutative in general, and when it actually is",
      "Rank as the true 'size' of a matrix's information content",
    ],
    prerequisites: [],
    concept: `## A Grid That Represents A Linear Transformation

::: story
A matrix is a rectangular grid of numbers, but the reason it matters is that it represents a linear transformation - a rule for turning one vector into another using only scaling and addition. Every operation on matrices (addition, multiplication, transpose) has meaning in terms of combining or composing these transformations, not just moving numbers around a grid.
:::

::: remember
Matrix multiplication AB is defined only when the number of COLUMNS of A equals the number of ROWS of B. The result has A's row count and B's column count. This dimension rule is not a technicality - it reflects that AB means "first apply the transformation B, then apply A" to a vector, which only makes sense if B's output size matches A's input size.
:::

## Special Matrices, By Their One Defining Property

::: cards
Symmetric :: A = A^T (equal to its own transpose). Every off-diagonal pair a_ij, a_ji is equal.
Skew-symmetric :: A = -A^T. Forces every diagonal entry to be 0 (since a_ii = -a_ii only when a_ii = 0).
Orthogonal :: A A^T = A^T A = I. Its rows (and columns) are unit vectors, mutually perpendicular - orthogonal matrices represent pure rotations/reflections, no stretching.
Idempotent :: A^2 = A. Applying the transformation twice does nothing more than applying it once (a projection is the standard example).
:::

::: mistake
Assuming AB = BA. Matrix multiplication is NOT commutative in general - AB and BA can even have different dimensions if A and B aren't square. Only special cases (A and B are both diagonal, or B = A^-1, or specific commuting pairs) guarantee AB = BA.
:::

## Rank: The Matrix's True Information Content

::: remember
The rank of a matrix is the number of linearly independent rows (equivalently, columns - the two counts are always equal). It measures how much genuinely new information the matrix carries: a matrix where one row is just a multiple of another has redundant information, and its rank is lower than its row count.
:::

::: checkpoint
If A is a 3x4 matrix and B is a 4x2 matrix, what are the dimensions of AB?
- ( ) 4x4
- (x) 3x2
- ( ) 2x3
- ( ) Undefined
> AB is defined because A's column count (4) matches B's row count (4). The result takes A's row count and B's column count: 3x2.
:::`,
    keyPoints: [
      "AB is defined only when A's column count equals B's row count; the result has A's rows and B's columns.",
      "Matrix multiplication is NOT commutative in general - AB != BA except in special cases.",
      "Symmetric: A=A^T. Skew-symmetric: A=-A^T (forces zero diagonal). Orthogonal: AA^T=A^TA=I. Idempotent: A^2=A.",
      "Rank = number of linearly independent rows = number of linearly independent columns, always equal for any matrix.",
      "(AB)^T = B^T A^T - the transpose of a product reverses the order, a frequently tested identity.",
    ],
    analogies: [
      "A matrix is a machine that eats a vector and outputs a transformed vector - multiplying two matrices is running one machine's output through a second machine, which is why the sizes have to line up like pipes.",
    ],
    commonMistakes: [
      "Assuming AB = BA without checking - true only for special matrix pairs, false in general.",
      "Computing (AB)^T as A^T B^T instead of the correct B^T A^T (order reverses under transpose, just as under inverse).",
      "Forgetting that a skew-symmetric matrix's diagonal must be all zeros.",
      "Confusing rank (linear independence count) with the matrix's raw row or column count when the matrix has redundant rows.",
    ],
    memoryTricks: [
      "\"Symmetric mirrors across the diagonal, skew-symmetric mirrors AND flips sign.\"",
      "(AB)^-1 = B^-1 A^-1 and (AB)^T = B^T A^T - both reverse order the same way; learn one, get the other free.",
    ],
    formulas: [
      "AB defined iff A is m x n and B is n x p; result is m x p.",
      "(AB)^T = B^T A^T.   (AB)^-1 = B^-1 A^-1 (when both inverses exist).",
      "Symmetric: A = A^T.  Skew-symmetric: A = -A^T.  Orthogonal: A A^T = I.  Idempotent: A^2 = A.",
    ],
    shortcuts: [
      "Before multiplying two matrices, write down both dimensions and check compatibility first - catches a wasted computation before it starts.",
      "To check if a given matrix is symmetric, just compare a few off-diagonal mirror pairs (a_12 vs a_21, etc.) rather than fully transposing.",
    ],
    pyqRelevance: `Matrix basics rarely stand alone as a question but are the computational substrate for nearly every Linear Algebra question on determinants, systems of equations, and eigenvalues - a slow or error-prone matrix multiplication under time pressure costs marks on questions that are conceptually about something else entirely.`,
    interviewConnection: `Matrices are the core data structure behind graphics transformations, neural network layers (a layer's forward pass IS a matrix multiplication), and adjacency-matrix graph representations - the dimension-compatibility rule is exactly why a neural network layer's output size must match the next layer's input size.`,
    revisionSummary: `AB defined iff A's columns = B's rows; result is (A's rows) x (B's columns). Multiplication is NOT commutative in general.

Symmetric: A=A^T. Skew-symmetric: A=-A^T (zero diagonal). Orthogonal: AA^T=I. Idempotent: A^2=A.

Rank = number of linearly independent rows = number of linearly independent columns.

(AB)^T = B^T A^T, (AB)^-1 = B^-1 A^-1 - both reverse order.`,
    shortNotes: {
      oneMinute: "AB defined iff cols(A)=rows(B); result rows(A) x cols(B). NOT commutative in general. Symmetric A=A^T, skew A=-A^T (zero diagonal), orthogonal AA^T=I, idempotent A^2=A. Rank = independent rows = independent columns. (AB)^T=B^T A^T, (AB)^-1=B^-1 A^-1.",
    },
    mcqs: [
      {
        question: "If A is a 2x3 matrix and B is a 3x3 matrix, which product is defined?",
        options: ["BA only", "AB only", "Both AB and BA", "Neither"],
        correctIndex: 1,
        explanation: "AB is defined since A's columns (3) = B's rows (3), giving a 2x3 result. BA is NOT defined since B's columns (3) != A's rows (2).",
      },
      {
        question: "Which property must a skew-symmetric matrix's diagonal entries satisfy?",
        options: ["They must all equal 1", "They must all equal 0", "They must be negative", "No constraint applies"],
        correctIndex: 1,
        explanation: "Skew-symmetry requires a_ii = -a_ii for every diagonal entry, which forces a_ii = 0 for all i.",
      },
    ],
    numericals: [],
  },

  "determinants": {
    difficulty: "Moderate",
    estimatedMinutes: 25,
    xpReward: 22, coinReward: 8,
    whatYoullLearn: [
      "What the determinant measures geometrically, and why a zero determinant is special",
      "Computing a determinant via cofactor expansion and via row-reduction",
      "The key multiplicative and scaling properties: |AB|, |A^-1|, |kA|, |A^T|",
      "How elementary row operations change (or don't change) a determinant's value",
    ],
    prerequisites: ["Matrices"],
    concept: `## What A Determinant Actually Measures

::: story
The determinant of a square matrix is a single number that measures how much the matrix's transformation scales area (in 2D) or volume (in 3D and beyond). A determinant of 2 means the transformation doubles areas/volumes; a determinant of 0 means it COLLAPSES the space into a lower dimension - flattening a 2D area into a line, or a 3D volume into a plane - which is exactly why det(A)=0 signals that A is singular (non-invertible).
:::

::: remember
det(A) = 0 if and only if A is singular (not invertible), if and only if A's rows (or columns) are linearly dependent. These three statements are all the SAME fact viewed three ways, and GATE tests all three phrasings.
:::

## Computing It: Cofactor Expansion

::: flow
2x2 shortcut :: For [[a,b],[c,d]], det = ad - bc directly, no expansion needed.
3x3 and larger - cofactor expansion :: Pick any row or column. det(A) = sum over that row/column of (entry) x (-1)^(i+j) x (determinant of the minor formed by deleting that entry's row and column).
Best practice :: Expand along the row or column with the most zeros - each zero entry contributes nothing, skipping an entire minor computation.
Triangular matrix shortcut :: For an upper or lower triangular matrix, det = product of the diagonal entries directly - no expansion needed at all.
:::

::: mistake
Forgetting the alternating sign (-1)^(i+j) in cofactor expansion - the sign pattern is +,-,+,-,... in a checkerboard starting with + at position (1,1), and skipping it silently flips the sign of the whole answer.
:::

## Key Properties (Memorise, Don't Re-derive)

::: cards
Multiplicative :: det(AB) = det(A) x det(B). The determinant of a product is the product of determinants.
Inverse :: det(A^-1) = 1 / det(A) (requires det(A) != 0).
Scaling :: det(kA) = k^n x det(A) for an n x n matrix - EVERY row picks up a factor of k, not just one.
Transpose :: det(A^T) = det(A).
Row swap :: Swapping two rows flips the SIGN of the determinant (does not change its magnitude).
Row operation :: Adding a multiple of one row to another does NOT change the determinant at all.
:::

::: checkpoint
If det(A) = 5 for a 3x3 matrix A, what is det(2A)?
- ( ) 10
- ( ) 15
- (x) 40
- ( ) 5
> det(kA) = k^n det(A) for an n x n matrix. Here k=2, n=3: det(2A) = 2^3 x 5 = 8 x 5 = 40. A common mistake is answering 10 (treating it as k x det(A) instead of k^n x det(A)).
:::`,
    keyPoints: [
      "det(A) measures the scale factor by which A's transformation scales area/volume; det(A)=0 means A collapses space into a lower dimension, exactly when A is singular.",
      "2x2 shortcut: ad-bc. Larger matrices: cofactor expansion with alternating signs, or row-reduce to triangular form and multiply the diagonal.",
      "det(AB)=det(A)det(B); det(A^-1)=1/det(A); det(kA)=k^n det(A) for n x n A (every row scales); det(A^T)=det(A).",
      "Row swap flips the determinant's sign; adding a multiple of one row to another leaves it unchanged; scaling one row by k scales the whole determinant by k.",
      "det(A)=0, A singular, and A's rows/columns being linearly dependent are three equivalent statements about the same matrix.",
    ],
    analogies: [
      "The determinant is a transformation's 'volume dial' - turning it past 1 stretches space, between 0 and 1 shrinks it, negative flips orientation (like a mirror), and exactly 0 flattens it down to nothing.",
    ],
    commonMistakes: [
      "Computing det(2A) as 2 det(A) instead of 2^n det(A) for an n x n matrix - every one of the n rows contributes a factor of 2.",
      "Forgetting the alternating sign pattern in cofactor expansion.",
      "Believing a row swap changes the determinant's magnitude - it only flips the sign.",
      "Assuming det(A+B) = det(A) + det(B) - this is false in general; determinant is multiplicative, not additive.",
    ],
    memoryTricks: [
      "\"Row-add-multiple: no change. Row-swap: sign flip. Row-scale: determinant scales too.\" The three elementary row operations, three different determinant effects.",
      "det(kA) = k^n det(A) - remember the exponent by counting: k multiplies EVERY row, and there are n rows.",
    ],
    formulas: [
      "2x2: det([[a,b],[c,d]]) = ad - bc.",
      "det(AB) = det(A) det(B).   det(A^-1) = 1/det(A).   det(kA) = k^n det(A).   det(A^T) = det(A).",
      "Triangular matrix: det = product of diagonal entries.",
    ],
    shortcuts: [
      "Before doing a full cofactor expansion, check for a row or column of mostly zeros to expand along, or row-reduce toward triangular form - either can save most of the computation.",
      "If asked for det(A^-1) or det(AB) and det(A), det(B) are already known, use the property directly instead of computing the actual matrix product/inverse.",
    ],
    pyqRelevance: `Determinant properties (especially det(kA), det(AB), det(A^-1), and the row-operation effects) are a very frequent 1-mark GATE question precisely because they test whether a property is memorised correctly rather than requiring heavy computation - these are fast, high-value marks when the properties are known cold.`,
    interviewConnection: `A zero determinant signals a singular matrix, which is exactly the condition that breaks a system of linear equations from having a unique solution - directly relevant whenever solving Ax=b programmatically (e.g. checking invertibility before calling a matrix-inverse library function).`,
    revisionSummary: `det(A) measures the scale factor for area/volume; det(A)=0 iff A is singular iff its rows are linearly dependent.

2x2: ad-bc. Larger: cofactor expansion (alternating signs) or triangular-form diagonal product.

det(AB)=det(A)det(B), det(A^-1)=1/det(A), det(kA)=k^n det(A), det(A^T)=det(A).

Row swap flips sign; add-a-multiple-of-a-row leaves it unchanged; scaling a row scales the determinant by that factor.`,
    shortNotes: {
      oneMinute: "det=0 iff singular iff rows linearly dependent. 2x2: ad-bc. Cofactor expansion: alternating signs. Triangular: product of diagonal. det(AB)=det(A)det(B), det(A^-1)=1/det(A), det(kA)=k^n det(A) (n=size), det(A^T)=det(A). Row swap flips sign; row-add-multiple unchanged.",
    },
    mcqs: [
      {
        question: "For a 4x4 matrix A with det(A) = 3, what is det(3A)?",
        options: ["9", "27", "81", "243"],
        correctIndex: 3,
        explanation: "det(kA) = k^n det(A) for an n x n matrix. Here k=3, n=4: det(3A) = 3^4 x 3 = 81 x 3 = 243.",
      },
      {
        question: "If det(A) = 0 for a square matrix A, which statement is true?",
        options: [
          "A is invertible",
          "A's rows are linearly independent",
          "A is singular",
          "det(A^2) = -1",
        ],
        correctIndex: 2,
        explanation: "det(A)=0 is exactly the condition for A being singular (non-invertible), equivalent to its rows being linearly DEPENDENT, not independent.",
      },
    ],
    numericals: [
      {
        question: "Compute the determinant of [[2,3],[4,5]].",
        answerMin: -2,
        answerMax: -2,
        unit: "",
        solution: `det = ad - bc = (2)(5) - (3)(4) = 10 - 12 = -2`,
      },
    ],
  },

  "system-of-linear-equations": {
    difficulty: "Moderate",
    estimatedMinutes: 30,
    xpReward: 25, coinReward: 9,
    whatYoullLearn: [
      "Solving Ax = b via Gaussian elimination to row-echelon form",
      "The rank-based test for whether a system has no solution, a unique solution, or infinitely many",
      "Why a homogeneous system Ax = 0 always has at least the trivial solution, and when it has more",
      "Reading a solved augmented matrix back into the actual solution set",
    ],
    prerequisites: ["Matrices", "Determinants"],
    concept: `## Ax = b As A Single Object

::: story
A system of linear equations is usually written as a list of separate equations, but it is exactly one matrix equation: Ax = b, where A holds the coefficients, x is the vector of unknowns, and b is the vector of right-hand sides. Solving the system means finding every x that satisfies this one equation - and the RANK of A (and of the augmented matrix [A|b]) determines, before any solving is even done, how many solutions exist.
:::

::: remember
Gaussian elimination reduces the augmented matrix [A|b] to row-echelon form using the three elementary row operations (swap two rows, scale a row, add a multiple of one row to another) - operations that never change the solution set, only how easy it is to read off.
:::

## The Rank Test: How Many Solutions, Before Solving Anything

::: cards Compare rank(A) to rank([A|b]) and to n (number of unknowns)
rank(A) < rank([A|b]) :: NO solution. The augmented column adds genuinely new information the coefficient columns can't produce - a contradiction like "0 = 5" appears after elimination.
rank(A) = rank([A|b]) = n :: EXACTLY ONE solution. Every unknown is pinned down.
rank(A) = rank([A|b]) < n :: INFINITELY MANY solutions. There are (n - rank) free variables that can take any value, generating a whole family of solutions.
:::

::: mistake
Assuming a system with more equations than unknowns automatically has no solution, or a system with fewer equations than unknowns automatically has infinitely many. Neither is guaranteed - it always comes down to comparing rank(A), rank([A|b]), and n, not just counting equations.
:::

## Homogeneous Systems: Ax = 0

::: flow
Trivial solution always exists :: x = 0 (the zero vector) always satisfies Ax=0, so a homogeneous system is NEVER inconsistent - "no solution" cannot happen here.
Only question is uniqueness :: If rank(A) = n, x=0 is the ONLY solution. If rank(A) < n, there are infinitely many solutions (a whole subspace of them), including nonzero ones.
Square case shortcut :: For a square (n x n) A, rank(A) = n exactly when det(A) != 0. So: det(A) != 0 -> only the trivial solution; det(A) = 0 -> infinitely many solutions including nonzero ones.
:::

::: checkpoint
A homogeneous system Ax=0 has A as a 4x4 matrix with det(A) = 0. What can be said about its solutions?
- ( ) No solution exists
- ( ) Only x=0 is a solution
- (x) Infinitely many solutions exist, including nonzero ones
- ( ) Cannot be determined
> det(A)=0 for a square matrix means rank(A) < n (4), so the homogeneous system has infinitely many solutions - and a homogeneous system is never inconsistent, so "no solution" is never on the table.
:::`,
    keyPoints: [
      "Ax=b as one matrix equation; Gaussian elimination on [A|b] finds every solution using operations that preserve the solution set.",
      "Compare rank(A) vs rank([A|b]) vs n: unequal ranks means no solution; equal ranks equal to n means one solution; equal ranks less than n means infinitely many.",
      "A homogeneous system Ax=0 always has the trivial solution x=0 and is NEVER inconsistent - the only question is whether that's the only solution.",
      "For a square A: det(A) != 0 means only the trivial solution to Ax=0; det(A) = 0 means infinitely many solutions including nonzero ones.",
      "The number of free variables in an underdetermined consistent system equals n - rank(A).",
    ],
    analogies: [
      "Rank comparison for Ax=b is like checking whether a set of instructions is self-contradictory (no solution), exactly sufficient (one solution), or under-specified (many solutions) before ever trying to follow them.",
    ],
    commonMistakes: [
      "Judging solvability purely by comparing the number of equations to the number of unknowns instead of actually comparing ranks.",
      "Believing a homogeneous system can have no solution - it always has at least x=0.",
      "Forgetting that det(A)=0 for a SQUARE matrix is the shortcut test for rank(A)<n - and that this shortcut does not apply to non-square matrices, which have no determinant at all.",
      "Miscounting free variables as n minus the number of equations instead of n minus rank(A).",
    ],
    memoryTricks: [
      "\"Ranks disagree: no solution. Ranks agree with n: one solution. Ranks agree below n: infinite solutions.\" - three rank comparisons, three outcomes.",
      "Homogeneous systems can never say 'no solution' - x=0 is a permanent alibi.",
    ],
    formulas: [
      "rank(A) < rank([A|b])  =>  no solution.",
      "rank(A) = rank([A|b]) = n  =>  unique solution.",
      "rank(A) = rank([A|b]) < n  =>  infinitely many solutions, with (n - rank(A)) free variables.",
      "Homogeneous Ax=0, square A: det(A) != 0 => only x=0. det(A) = 0 => infinitely many solutions.",
    ],
    shortcuts: [
      "For a square coefficient matrix, compute det(A) first - a nonzero determinant immediately tells you Ax=b has exactly one solution for ANY b, without doing the elimination at all.",
      "When row-reducing, watch for a row that becomes all zeros on the coefficient side but nonzero on the augmented side ([0 0 0 | 5]) - that row alone proves no solution exists, and elimination can stop there.",
    ],
    pyqRelevance: `Solvability classification (no/one/infinite solutions via rank comparison) is a recurring 1-2 mark GATE question, often phrased as "for what value of k does this system have infinitely many solutions" - directly testing the rank-comparison logic rather than requiring a full elimination.`,
    interviewConnection: `Solving linear systems underlies least-squares fitting, computer graphics transformations, and network flow problems - and the rank-based existence/uniqueness test is exactly what a numerical library checks internally before it will report success solving Ax=b.`,
    revisionSummary: `Ax=b as one equation; Gaussian elimination on [A|b] finds all solutions using rank-preserving row operations.

rank(A) < rank([A|b]): no solution. Equal to n: unique solution. Equal but less than n: infinitely many, with n-rank free variables.

Homogeneous Ax=0 always has x=0; for square A, det(A)!=0 means only x=0, det(A)=0 means infinitely many including nonzero ones.`,
    shortNotes: {
      oneMinute: "Ax=b: compare rank(A) vs rank([A|b]) vs n. Unequal ranks -> no solution. Equal=n -> unique. Equal<n -> infinite, n-rank free variables. Homogeneous Ax=0 never inconsistent (x=0 always works); square A: det!=0 -> only x=0, det=0 -> infinite solutions.",
    },
    mcqs: [
      {
        question: "For a system Ax=b with A being 3x3, rank(A)=2, and rank([A|b])=3, how many solutions exist?",
        options: ["Exactly one", "No solution", "Infinitely many", "Exactly two"],
        correctIndex: 1,
        explanation: "rank(A)=2 is less than rank([A|b])=3 - the ranks disagree, which means the system is inconsistent and has no solution.",
      },
      {
        question: "A homogeneous system Ax=0 has A as a 3x3 matrix with det(A) != 0. What is the solution set?",
        options: ["No solution", "Only x=0", "Infinitely many solutions", "Exactly two solutions"],
        correctIndex: 1,
        explanation: "det(A)!=0 for square A means rank(A)=n=3, so the ONLY solution to the homogeneous system is the trivial one, x=0.",
      },
    ],
    numericals: [],
  },

  "eigenvalues-and-eigenvectors": {
    difficulty: "Moderate",
    estimatedMinutes: 30,
    xpReward: 25, coinReward: 9,
    whatYoullLearn: [
      "What an eigenvalue/eigenvector pair actually means geometrically",
      "Finding eigenvalues via the characteristic equation det(A - lambda I) = 0",
      "Fast properties: eigenvalues of a triangular matrix, sum/product of eigenvalues via trace/determinant",
      "The basic idea of diagonalization and why it requires enough independent eigenvectors",
    ],
    prerequisites: ["Determinants", "System of Linear Equations"],
    concept: `## The Directions A Matrix Doesn't Rotate

::: story
Most vectors, when transformed by a matrix A, change direction. An eigenvector is special: A only STRETCHES or SHRINKS it, never rotates it. The amount of stretching is the eigenvalue. Formally, Av = lambda v for some scalar lambda - applying A to v gives back a scalar multiple of v itself.
:::

::: remember
Eigenvectors are only defined up to scaling - if v is an eigenvector, so is 2v, -v, or any nonzero multiple, all with the SAME eigenvalue. GATE questions sometimes present a different-looking but proportional vector as "the" eigenvector; check for proportionality, not exact equality.
:::

## Finding Eigenvalues: The Characteristic Equation

::: flow
Start from the definition :: Av = lambda v, rewritten as (A - lambda I) v = 0.
This is a homogeneous system :: For a NONZERO v to solve it, (A - lambda I) must be singular (else only v=0 would solve it, which isn't a valid eigenvector).
Singular means zero determinant :: So det(A - lambda I) = 0. This is the CHARACTERISTIC EQUATION - a polynomial in lambda of degree n for an n x n matrix.
Solve for lambda, then for each eigenvector :: Each root lambda_i is an eigenvalue; substitute it back into (A - lambda_i I)v = 0 and solve for v to get the corresponding eigenvector(s).
:::

::: cards Fast properties - use these before computing anything from scratch
Triangular matrix :: Its eigenvalues ARE its diagonal entries directly - no characteristic-equation computation needed at all.
Sum of eigenvalues :: Equals trace(A) (the sum of A's diagonal entries), for ANY square matrix.
Product of eigenvalues :: Equals det(A), for ANY square matrix.
Eigenvalues of A^k :: If lambda is an eigenvalue of A, lambda^k is an eigenvalue of A^k (same eigenvector).
Eigenvalues of A^-1 :: If lambda is a nonzero eigenvalue of A, 1/lambda is an eigenvalue of A^-1.
:::

::: mistake
Computing the full characteristic polynomial for a triangular matrix instead of just reading the eigenvalues off the diagonal - a common time-waster under exam pressure when the matrix's structure already gives the answer for free.
:::

## Diagonalization, Briefly

::: remember
A is diagonalizable if it has n linearly independent eigenvectors (for an n x n matrix) - then A = P D P^-1, where D is diagonal (the eigenvalues) and P's columns are the corresponding eigenvectors. A matrix with n DISTINCT eigenvalues is always diagonalizable; repeated eigenvalues need to be checked for enough independent eigenvectors.
:::

::: checkpoint
A 3x3 upper triangular matrix has diagonal entries 2, 5, -1. What are its eigenvalues?
- (x) 2, 5, -1
- ( ) Cannot be determined without more information
- ( ) The roots of a degree-3 polynomial that must be computed separately
- ( ) 1/2, 1/5, -1
> For a triangular matrix, the eigenvalues are exactly its diagonal entries - here 2, 5, and -1, read off directly with zero computation.
:::`,
    keyPoints: [
      "Av = lambda v: an eigenvector's direction is unchanged by A, only scaled by its eigenvalue lambda.",
      "Eigenvalues solve the characteristic equation det(A - lambda I) = 0, a degree-n polynomial for an n x n matrix.",
      "Triangular matrix: eigenvalues are its diagonal entries directly. Sum of eigenvalues = trace(A). Product of eigenvalues = det(A).",
      "Eigenvectors are defined only up to nonzero scalar multiples - check proportionality, not exact equality.",
      "A is diagonalizable (A = PDP^-1) when it has n linearly independent eigenvectors; n distinct eigenvalues guarantees this automatically.",
    ],
    analogies: [
      "An eigenvector is a direction a transformation treats as a 'lane' - you can only speed up or slow down along it (the eigenvalue), never get steered off it.",
    ],
    commonMistakes: [
      "Computing a full characteristic polynomial for a triangular matrix instead of reading eigenvalues off the diagonal directly.",
      "Forgetting that eigenvectors are only defined up to scaling, and treating two proportional vectors as if they were different eigenvectors.",
      "Confusing trace (sum of eigenvalues) with determinant (product of eigenvalues) - both are fast checks but measure different things.",
      "Assuming every square matrix is diagonalizable - a matrix with a repeated eigenvalue but too few independent eigenvectors for it is NOT diagonalizable.",
    ],
    memoryTricks: [
      "\"Trace ADDS, determinant MULTIPLIES\" - sum of eigenvalues = trace, product of eigenvalues = det.",
      "Triangular matrix: eigenvalues just sit on the diagonal, waiting to be read - no algebra needed.",
    ],
    formulas: [
      "Characteristic equation: det(A - lambda I) = 0.",
      "Sum of eigenvalues = trace(A).   Product of eigenvalues = det(A).",
      "If lambda is an eigenvalue of A: lambda^k is an eigenvalue of A^k; 1/lambda is an eigenvalue of A^-1 (lambda != 0).",
      "Diagonalization: A = P D P^-1, D diagonal (eigenvalues), P's columns are the corresponding eigenvectors.",
    ],
    shortcuts: [
      "Always check first whether the matrix is triangular (or can be quickly seen to be) before setting up the characteristic polynomial - it can save the entire computation.",
      "Use trace and determinant as a quick SANITY CHECK after computing eigenvalues by hand: their sum should equal the trace, their product should equal the determinant.",
    ],
    pyqRelevance: `Eigenvalues/eigenvectors are a near-guaranteed 1-2 mark GATE question every year, most often "find the eigenvalues of this matrix" (frequently triangular or small enough for the characteristic polynomial by hand) or a property-based question using trace/determinant shortcuts. This is one of the highest value-per-minute topics in the whole Linear Algebra section.`,
    interviewConnection: `Eigenvalues/eigenvectors underlie PCA (principal component analysis) in machine learning, Google's PageRank algorithm (the dominant eigenvector of the web-link matrix), and stability analysis of dynamic systems - genuinely one of the most widely-applied ideas from this entire syllabus section.`,
    revisionSummary: `Av = lambda v: eigenvectors keep their direction under A, only scaled by eigenvalue lambda.

Characteristic equation: det(A - lambda I) = 0. Triangular matrix: eigenvalues are the diagonal entries directly.

Sum of eigenvalues = trace(A); product = det(A). Eigenvectors defined only up to scaling.

Diagonalizable (A=PDP^-1) when n independent eigenvectors exist; guaranteed by n distinct eigenvalues.`,
    shortNotes: {
      oneMinute: "Av=lambda v. Characteristic eqn: det(A-lambda I)=0. Triangular matrix -> eigenvalues = diagonal entries. Sum of eigenvalues = trace(A), product = det(A). Eigenvectors defined up to scaling only. Diagonalizable (A=PDP^-1) needs n independent eigenvectors; n distinct eigenvalues guarantees it.",
    },
    mcqs: [
      {
        question: "A 2x2 matrix has trace 7 and determinant 12. What are its eigenvalues?",
        options: ["3 and 4", "2 and 5", "6 and 1", "7 and 12"],
        correctIndex: 0,
        explanation: "Sum of eigenvalues = trace = 7, product = determinant = 12. Testing 3+4=7 and 3*4=12 - both match, so the eigenvalues are 3 and 4.",
      },
      {
        question: "If lambda=5 is an eigenvalue of matrix A, what is the corresponding eigenvalue of A^-1?",
        options: ["5", "-5", "1/5", "25"],
        correctIndex: 2,
        explanation: "If lambda is a nonzero eigenvalue of A, then 1/lambda is the corresponding eigenvalue of A^-1 - here, 1/5.",
      },
    ],
    numericals: [
      {
        question: "A lower triangular 3x3 matrix has diagonal entries 4, -2, 6. What is the sum of its eigenvalues?",
        answerMin: 8,
        answerMax: 8,
        unit: "",
        solution: `For a triangular matrix, the eigenvalues are exactly the diagonal entries: 4, -2, 6.

Sum = 4 + (-2) + 6 = 8  (this also equals the trace directly, as a cross-check).`,
      },
    ],
  },

  "lu-decomposition": {
    difficulty: "Moderate",
    estimatedMinutes: 25,
    xpReward: 22, coinReward: 8,
    whatYoullLearn: [
      "What LU decomposition is and why it's useful for solving Ax=b repeatedly with different b",
      "Constructing L and U from Gaussian elimination without row swaps",
      "Solving a system efficiently once A = LU is known, via forward then backward substitution",
      "When a matrix does NOT have an LU decomposition without pivoting, and what that means",
    ],
    prerequisites: ["Matrices", "System of Linear Equations"],
    concept: `## Splitting A Into Two Triangular Pieces

::: story
LU decomposition writes a matrix A as the product of a LOWER triangular matrix L (with 1s on the diagonal) and an UPPER triangular matrix U: A = LU. This looks like just another way to write A, but it's the single most useful factorization for actually SOLVING systems, because triangular systems are cheap to solve directly - no elimination needed, just substitution.
:::

::: remember
U is exactly the row-echelon form Gaussian elimination already produces. L records the multipliers used DURING that elimination - specifically, the negative of each multiplier used to zero out an entry, placed in the position that entry occupied.
:::

## Building L and U From Elimination

::: flow
1. Row-reduce A to upper triangular form :: Perform standard Gaussian elimination (no row swaps) - the result IS U.
2. Record each multiplier :: Each time you eliminate entry (i,j) using multiplier m (i.e. Row_i -> Row_i - m * Row_j), place m in position (i,j) of L.
3. Put 1s on L's diagonal :: L always has 1s down its diagonal by construction - it represents "no scaling, just combination" at each step.
4. Verify :: A = L U should hold exactly; multiplying them back out is a fast correctness check.
:::

::: mistake
Placing the multiplier itself (not its negative, and in the correct position) incorrectly into U instead of L, or forgetting L's diagonal must be all 1s. L's entries are exactly the elimination multipliers, positioned exactly where the eliminated zero appeared.
:::

## Why Bother: Solving Ax=b Efficiently

::: cards Once A = LU is known
Step 1 - solve Ly = b :: L is lower triangular, so this is solved top-to-bottom by FORWARD substitution - each equation has only one new unknown.
Step 2 - solve Ux = y :: U is upper triangular, solved bottom-to-top by BACKWARD substitution, same reasoning.
Why this is worth it :: Once L and U are computed ONCE, solving Ax=b for many DIFFERENT b vectors (same A) only costs two cheap triangular solves each time - re-doing full Gaussian elimination for every new b would be far more expensive.
:::

::: mistake
Not every matrix has an LU decomposition without row swaps - specifically, if elimination requires a row swap to avoid a zero pivot, plain LU decomposition fails and a permuted version (PA = LU, with a permutation matrix P) is needed instead. GATE questions sometimes construct exactly this failure case.
:::

::: checkpoint
Once A = LU is known, what is the correct order to solve Ax = b?
- ( ) Solve Ux=y first, then Ly=b
- (x) Solve Ly=b first (forward substitution), then Ux=y (backward substitution)
- ( ) Solve both simultaneously
- ( ) Multiply L and U back into A and solve directly
> The substitution order must be Ly=b first (L is lower triangular, solved top-down), THEN Ux=y (U is upper triangular, solved bottom-up) - reversing the order leaves y undefined when solving for x.
:::`,
    keyPoints: [
      "A = LU: L is lower triangular with 1s on the diagonal, U is upper triangular - U is exactly Gaussian elimination's row-echelon result.",
      "L's entries are the elimination multipliers, placed in the position of the zero they produced.",
      "Solve Ax=b via LU in two cheap triangular steps: forward-substitute Ly=b, then backward-substitute Ux=y.",
      "LU decomposition is most valuable when solving Ax=b for many different b with the same A - L and U are computed once, reused every time.",
      "Plain LU decomposition (no permutation) fails if elimination needs a row swap to avoid a zero pivot - PA=LU (with a permutation matrix) is the fix.",
    ],
    analogies: [
      "LU decomposition is like pre-computing a recipe's prep steps once (chopping, measuring) so that cooking the same dish again with different final ingredients (different b) only needs the fast final steps, not the whole prep from scratch.",
    ],
    commonMistakes: [
      "Solving Ux=y before Ly=b - the order must be forward (L) then backward (U), since y is only known after the first solve.",
      "Forgetting L must have 1s on its diagonal, or misplacing a multiplier's sign when constructing L.",
      "Assuming every square matrix has an LU decomposition without row swaps - a zero pivot during elimination breaks plain LU and requires permutation (PA=LU).",
      "Re-deriving LU from scratch for every new b instead of recognising that L and U, once found, are reused for solving with any b.",
    ],
    memoryTricks: [
      "\"L holds the LEFTOVER multipliers, U is the Upshot of elimination.\" L = elimination history, U = elimination result.",
      "Forward through L, backward through U - alphabetical order (L before U) matches solve order.",
    ],
    formulas: [
      "A = LU, L lower triangular with unit diagonal, U upper triangular.",
      "Solving Ax=b: forward-substitute Ly=b for y, then backward-substitute Ux=y for x.",
      "When plain LU fails (zero pivot requiring a row swap): PA = LU, P a permutation matrix.",
    ],
    shortcuts: [
      "If a problem gives L and U directly and only asks to solve for x given a specific b, skip re-deriving the decomposition entirely and go straight to the two substitution steps.",
      "A quick correctness check on any computed L, U pair: multiply them back together and confirm you recover the original A.",
    ],
    pyqRelevance: `LU decomposition appears as a moderate-frequency GATE question, typically either "find L and U for this small matrix" or a conceptual question about why LU decomposition is useful for repeated solves - less commonly a full solve-via-substitution numerical, but knowing that workflow end-to-end is worth having ready.`,
    interviewConnection: `LU decomposition is exactly what's happening under the hood in numerical linear algebra libraries (LAPACK, NumPy's linalg.solve) when solving Ax=b - understanding it explains why solving the same system for multiple right-hand sides is dramatically cheaper than solving from scratch each time.`,
    revisionSummary: `A = LU: L lower triangular (unit diagonal, holds elimination multipliers), U upper triangular (the row-echelon result of elimination).

Solve Ax=b via two triangular solves: forward-substitute Ly=b, then backward-substitute Ux=y.

Most valuable for solving with the same A against many different b vectors - L, U computed once, reused every time.

Zero pivot during elimination breaks plain LU; PA=LU (with a permutation) is the fix.`,
    shortNotes: {
      oneMinute: "A=LU: L lower triangular (1s on diagonal, holds multipliers), U upper triangular (elimination result). Solve Ax=b: forward-substitute Ly=b, then backward-substitute Ux=y. Reused cheaply across many different b for the same A. Zero pivot breaks plain LU -> needs PA=LU.",
    },
    mcqs: [
      {
        question: "In an LU decomposition A=LU, what values must appear on L's diagonal?",
        options: ["The eigenvalues of A", "All zeros", "All ones", "The same as U's diagonal"],
        correctIndex: 2,
        explanation: "By construction, the lower triangular factor L always has 1s on its diagonal - it represents combining rows, not scaling them.",
      },
      {
        question: "Given A=LU, what is the correct sequence to solve Ax=b?",
        options: [
          "Solve Ux=y, then Ly=b",
          "Solve Ly=b by forward substitution, then Ux=y by backward substitution",
          "Directly invert L and U and multiply",
          "Solve both equations simultaneously as one system",
        ],
        correctIndex: 1,
        explanation: "Forward-substitute through L first to find y from Ly=b, then backward-substitute through U to find x from Ux=y - this order is required since y is unknown until the first step completes.",
      },
    ],
    numericals: [],
  },

  // ---------------- Probability and Statistics (continued) ----------------

  "uniform-distribution": {
    difficulty: "Easy",
    estimatedMinutes: 20,
    xpReward: 18, coinReward: 7,
    whatYoullLearn: [
      "The discrete uniform distribution (equally likely outcomes) and its mean/variance",
      "The continuous uniform distribution on [a,b] and its constant-height PDF",
      "Computing probabilities as areas under a flat PDF - just base times height",
      "Why 'uniform' is the natural default model for 'equally likely, no reason to favour any value'",
    ],
    prerequisites: ["Random Variables"],
    concept: `## The 'No Preference' Distribution

::: story
A uniform distribution describes outcomes that are all equally likely - a fair die (discrete uniform over 1-6), or a random real number chosen anywhere in an interval [a,b] with no value favoured over any other (continuous uniform). It's the natural default whenever a problem says "chosen at random with no bias" and gives no other information.
:::

::: cards Discrete vs continuous uniform
Discrete uniform on {1,...,n} :: Every outcome has probability 1/n. Mean = (n+1)/2. Variance = (n^2-1)/12.
Continuous uniform on [a,b] :: PDF f(x) = 1/(b-a) for a<=x<=b, and 0 elsewhere - a flat rectangle. Mean = (a+b)/2. Variance = (b-a)^2/12.
:::

## Interval Probability Is Just A Width Ratio

::: remember
For a continuous uniform distribution, P(X in [c,d]) for any sub-interval [c,d] within [a,b] is just (d-c)/(b-a) - the width of the sub-interval divided by the width of the whole interval. It's literally reading area off a rectangle.
:::

::: mistake
Trying to compute P(X = exact value) as nonzero for a continuous uniform distribution - like every continuous distribution, a single point has probability exactly 0. Only interval probabilities are meaningful.
:::

::: checkpoint
X is uniformly distributed on [2, 10]. What is P(4 <= X <= 7)?
- ( ) 3/10
- (x) 3/8
- ( ) 1/2
- ( ) 5/8
> Total interval width = 10-2 = 8. Sub-interval width = 7-4 = 3. P = 3/8, the fraction of the total width the sub-interval occupies.
:::`,
    keyPoints: [
      "Discrete uniform on {1,...,n}: each outcome has probability 1/n, mean (n+1)/2, variance (n^2-1)/12.",
      "Continuous uniform on [a,b]: constant PDF 1/(b-a), mean (a+b)/2, variance (b-a)^2/12.",
      "For continuous uniform, P(X in a sub-interval) is simply that sub-interval's width divided by the total interval's width.",
      "Uniform is the default 'no bias, no extra information' model whenever a problem says outcomes are equally likely across a range.",
    ],
    analogies: [
      "A continuous uniform distribution is a flat rectangular 'probability lawn' - the probability of landing in any strip of it depends only on the strip's width, not where along the lawn it sits.",
    ],
    commonMistakes: [
      "Using the discrete uniform mean/variance formulas for a continuous uniform problem or vice versa - the two have different formulas despite the shared name.",
      "Trying to assign nonzero probability to a single exact point under continuous uniform.",
      "Forgetting the PDF height itself is 1/(b-a), not 1 - it must integrate to 1 over the interval, which is what forces that specific height.",
    ],
    memoryTricks: [
      "Continuous uniform mean is just the interval's midpoint: (a+b)/2 - the 'centre of the rectangle'.",
      "Variance formulas for both flavours have a /12 - a quick way to recognise a uniform-distribution question from its answer shape.",
    ],
    formulas: [
      "Discrete uniform {1,...,n}: P(X=k)=1/n. Mean=(n+1)/2. Variance=(n^2-1)/12.",
      "Continuous uniform [a,b]: f(x)=1/(b-a). Mean=(a+b)/2. Variance=(b-a)^2/12.",
      "P(c<=X<=d) for continuous uniform on [a,b], [c,d] subset of [a,b]: (d-c)/(b-a).",
    ],
    shortcuts: [
      "For any continuous uniform interval-probability question, skip the integral entirely and just compute (sub-interval width)/(total width) directly.",
    ],
    pyqRelevance: `Uniform distribution questions are usually a quick 1-mark interval-probability or mean/variance computation - one of the fastest possible marks in the Probability section once the two formula sets (discrete vs continuous) are memorised correctly.`,
    interviewConnection: `The continuous uniform distribution is the standard building block for random number generation - most software random() functions generate a Uniform(0,1) sample first, and every other distribution (normal, exponential, etc.) is typically constructed by transforming that uniform sample.`,
    revisionSummary: `Discrete uniform {1,...,n}: P=1/n each, mean (n+1)/2, variance (n^2-1)/12.

Continuous uniform [a,b]: flat PDF 1/(b-a), mean (a+b)/2, variance (b-a)^2/12. Interval probability = width ratio, no integration needed.`,
    shortNotes: {
      oneMinute: "Discrete uniform {1..n}: P=1/n, mean=(n+1)/2, var=(n^2-1)/12. Continuous uniform [a,b]: PDF=1/(b-a), mean=(a+b)/2, var=(b-a)^2/12. Interval probability = width ratio (no integral needed).",
    },
    mcqs: [
      {
        question: "X is uniform on [0, 20]. What is the mean of X?",
        options: ["10", "20", "5", "100"],
        correctIndex: 0,
        explanation: "Mean of a continuous uniform on [a,b] is (a+b)/2 = (0+20)/2 = 10.",
      },
    ],
    numericals: [
      {
        question: "A fair 6-sided die is rolled (discrete uniform on 1-6). What is the mean value shown?",
        answerMin: 3.5,
        answerMax: 3.5,
        unit: "",
        solution: `Discrete uniform mean = (n+1)/2 = (6+1)/2 = 3.5`,
      },
    ],
  },

  "normal-distribution": {
    difficulty: "Moderate",
    estimatedMinutes: 30,
    xpReward: 25, coinReward: 9,
    whatYoullLearn: [
      "The bell-curve shape of the normal distribution and its two parameters, mean and variance",
      "Standardizing any normal variable into the standard normal Z",
      "The empirical rule (68-95-99.7) for quick probability estimates",
      "Reading and using a standard normal (Z) table for exact probabilities",
    ],
    prerequisites: ["Random Variables", "Uniform Distribution"],
    concept: `## The Most Common Bell Curve In Nature

::: story
The normal (Gaussian) distribution is the symmetric bell-shaped curve that shows up whenever a quantity results from many small, independent random effects adding up - heights, measurement errors, exam scores. It is fully described by just two numbers: its mean mu (where the peak sits) and its variance sigma^2 (how wide the bell is).
:::

::: remember
Every normal distribution can be converted to the STANDARD normal (mean 0, variance 1) via Z = (X - mu) / sigma. This one transformation is why a single Z-table can answer probability questions for ANY normal distribution, not just one specific mean and variance.
:::

## The Empirical (68-95-99.7) Rule

::: cards Fast estimates without a table
Within 1 standard deviation :: About 68% of the distribution's probability lies within mu +/- 1*sigma.
Within 2 standard deviations :: About 95% lies within mu +/- 2*sigma.
Within 3 standard deviations :: About 99.7% lies within mu +/- 3*sigma - almost the entire distribution.
:::

::: mistake
Using the empirical rule's rough percentages when a question asks for an EXACT probability (e.g. "find P(X < 72) given mu=70, sigma=5") - the empirical rule is for quick estimation at exactly 1, 2, or 3 standard deviations; anything else requires standardizing to Z and using an actual Z-table value.
:::

## Standardizing And Using The Z-Table

::: flow
1. Identify mu and sigma :: Given directly, or computed from the problem's description.
2. Convert the boundary value(s) to Z :: Z = (X - mu) / sigma for each boundary of interest.
3. Look up (or recall) the Z-table probability :: The table gives P(Z <= z) for the standard normal - the AREA to the left of z under the standard bell curve.
4. Combine for the actual question asked :: P(X < value) directly, P(X > value) = 1 - P(X < value), or subtract two cumulative values for a range.
:::

::: checkpoint
X is normal with mu=50, sigma=10. What is the Z-score for X=65?
- ( ) 0.65
- (x) 1.5
- ( ) 15
- ( ) 6.5
> Z = (X - mu)/sigma = (65-50)/10 = 15/10 = 1.5. This says X=65 is 1.5 standard deviations above the mean.
:::`,
    keyPoints: [
      "Normal distribution: symmetric bell curve, fully described by mean mu and variance sigma^2.",
      "Standardize any normal variable via Z = (X - mu)/sigma to use the single standard normal (mean 0, variance 1) table for any mu, sigma.",
      "Empirical rule: ~68% within 1 sigma, ~95% within 2 sigma, ~99.7% within 3 sigma of the mean - fast estimates, not exact values for arbitrary boundaries.",
      "The Z-table gives P(Z <= z), the area to the left of z; use 1 minus that value for 'greater than', and subtraction for a range between two boundaries.",
      "The normal distribution is symmetric about its mean: P(Z <= -z) = 1 - P(Z <= z).",
    ],
    analogies: [
      "Standardizing to Z is like converting every currency to a single reference currency before comparing prices - once everything is in Z-units, one lookup table answers every question, regardless of the original mu and sigma.",
    ],
    commonMistakes: [
      "Using the empirical rule's rounded percentages (68/95/99.7) for a boundary that isn't exactly at 1, 2, or 3 standard deviations - these boundaries need an actual Z-table value.",
      "Forgetting to convert P(X > value) into 1 - P(X <= value) after standardizing, since the Z-table conventionally gives the LEFT-tail cumulative probability.",
      "Sign errors when the boundary is below the mean, giving a negative Z - forgetting that the curve's symmetry means P(Z <= -z) = 1 - P(Z <= z).",
    ],
    memoryTricks: [
      "\"Z tells you how many standard deviations away from the mean you are, with sign.\" Positive Z = above the mean, negative = below.",
      "68-95-99.7 in one breath: each step out one more standard deviation captures almost everything that's left.",
    ],
    formulas: [
      "Z = (X - mu) / sigma.",
      "Empirical rule: P(mu-sigma < X < mu+sigma) ~ 0.68; P(mu-2sigma < X < mu+2sigma) ~ 0.95; P(mu-3sigma < X < mu+3sigma) ~ 0.997.",
      "Symmetry: P(Z <= -z) = 1 - P(Z <= z).   P(X > value) = 1 - P(X <= value).",
    ],
    shortcuts: [
      "If a boundary falls exactly at mu +/- 1, 2, or 3 sigma, use the empirical rule directly and skip the Z-table lookup entirely for a fast estimate.",
      "For \"P(X between two values)\" questions, standardize both boundaries to Z first, then subtract the two cumulative probabilities - never try to compute a two-sided area directly.",
    ],
    pyqRelevance: `Normal distribution questions are a reliable 1-2 mark GATE question, most commonly requiring a Z-score standardization plus either an empirical-rule estimate or a small Z-table-style lookup value given directly in the question. Recognising when the empirical rule applies (exact multiples of sigma) versus when standardization plus a given table value is needed is the key skill being tested.`,
    interviewConnection: `The normal distribution underlies confidence intervals, A/B testing significance, and the Central Limit Theorem's guarantee that sums/averages of many independent variables tend toward normal - foundational for interpreting almost any statistical result reported with a "standard deviation" or "confidence interval."`,
    revisionSummary: `Normal: symmetric bell curve, parameters mu (mean) and sigma^2 (variance). Standardize via Z=(X-mu)/sigma to use one universal table.

Empirical rule: ~68%/95%/99.7% within 1/2/3 standard deviations of the mean - estimates only at those exact boundaries.

Z-table gives P(Z<=z); use 1-P for "greater than", subtraction for ranges, symmetry for negative Z.`,
    shortNotes: {
      oneMinute: "Normal: bell curve, params mu, sigma^2. Z=(X-mu)/sigma standardizes to the universal table. Empirical rule: ~68/95/99.7% within 1/2/3 sigma. Z-table gives P(Z<=z) (left tail); P(X>v)=1-P(X<=v); symmetry: P(Z<=-z)=1-P(Z<=z).",
    },
    mcqs: [
      {
        question: "X is normally distributed with mean 100 and standard deviation 15. Approximately what percentage of values lie between 85 and 115?",
        options: ["50%", "68%", "95%", "99.7%"],
        correctIndex: 1,
        explanation: "85 and 115 are exactly mu - sigma and mu + sigma (100-15 and 100+15). By the empirical rule, about 68% of the distribution lies within 1 standard deviation of the mean.",
      },
      {
        question: "For X normal with mu=40, sigma=8, what is the Z-score of X=24?",
        options: ["2", "-2", "0.5", "-0.5"],
        correctIndex: 1,
        explanation: "Z = (X-mu)/sigma = (24-40)/8 = -16/8 = -2, meaning 24 is 2 standard deviations BELOW the mean.",
      },
    ],
    numericals: [],
  },

  "exponential-distribution": {
    difficulty: "Moderate",
    estimatedMinutes: 25,
    xpReward: 22, coinReward: 8,
    whatYoullLearn: [
      "What the exponential distribution models: waiting time until the next random event",
      "Its PDF, mean, and variance in terms of the rate parameter lambda",
      "The memoryless property, and why it's the distribution's single most distinctive feature",
      "The relationship between the exponential distribution and the Poisson process",
    ],
    prerequisites: ["Random Variables"],
    concept: `## Waiting For The Next Random Event

::: story
The exponential distribution models the waiting time until the next event in a process where events happen continuously and independently at a constant average rate - time until the next bus, next customer arrival, next radioactive decay. Its single parameter, lambda, is that rate: how many events happen per unit time, on average.
:::

::: cards The exponential distribution's core facts
PDF :: f(x) = lambda * e^(-lambda x) for x >= 0, and 0 for x < 0. Rate lambda controls how quickly the density decays.
Mean :: E[X] = 1/lambda. A HIGHER rate means a SHORTER average wait - the mean is the reciprocal of the rate, not the rate itself.
Variance :: Var(X) = 1/lambda^2.
CDF :: P(X <= x) = 1 - e^(-lambda x), so P(X > x) = e^(-lambda x) directly - useful for "wait longer than" questions without integrating.
:::

::: remember
The MEMORYLESS property is what makes the exponential distribution unique among continuous distributions: P(X > s+t | X > s) = P(X > t). If you've already waited s minutes with no event, the probability of waiting AT LEAST t more minutes is exactly the same as if you'd just started waiting - the process has no memory of how long it's already been running.
:::

::: mistake
Assuming that having already waited a long time makes an event "due" (the gambler's fallacy). The memoryless property explicitly says the opposite for an exponential process - past waiting time gives zero information about future waiting time.
:::

## Exponential and Poisson: Two Views Of The Same Process

::: flow
Poisson counts events :: In a fixed time interval, the NUMBER of events following a Poisson process is Poisson-distributed.
Exponential measures gaps :: The TIME BETWEEN consecutive events (or until the first event) in that same process is exponentially distributed.
Shared rate parameter :: Both use the same lambda - the Poisson's average count per interval and the exponential's rate are the same underlying process, viewed as "how many" versus "how long until".
:::

::: checkpoint
Customers arrive at rate lambda = 4 per hour (exponential inter-arrival times). What is the mean time between arrivals?
- (x) 15 minutes
- ( ) 4 minutes
- ( ) 20 minutes
- ( ) 1 hour
> Mean = 1/lambda = 1/4 hour = 15 minutes. The rate (4 per hour) and the mean WAIT (1/4 hour) are reciprocals of each other, not the same number.
:::`,
    keyPoints: [
      "Exponential distribution models waiting time until the next event in a constant-rate random process, parameterized by rate lambda.",
      "PDF: lambda e^(-lambda x). Mean = 1/lambda. Variance = 1/lambda^2. P(X > x) = e^(-lambda x) directly, useful without integrating.",
      "Memoryless property: P(X > s+t | X > s) = P(X > t) - past waiting time gives no information about future waiting time.",
      "The exponential distribution (gaps between events) and the Poisson distribution (count of events) describe the same underlying process from two different angles, sharing the same rate lambda.",
    ],
    analogies: [
      "An exponential process has no memory the way a fair coin has no memory - just as ten heads in a row doesn't make tails 'due', a long wait so far doesn't make the next event 'due' any sooner.",
    ],
    commonMistakes: [
      "Confusing the rate lambda with the mean - the mean is 1/lambda, its reciprocal, not lambda itself.",
      "Falling for the gambler's-fallacy intuition that a long elapsed wait makes an event more imminent under the memoryless property.",
      "Using the exponential distribution's memorylessness for a distribution that isn't actually exponential - it is a defining, UNIQUE property of this distribution among continuous ones, not a general rule.",
      "Forgetting P(X > x) = e^(-lambda x) directly and unnecessarily integrating the PDF from scratch for a 'greater than' question.",
    ],
    memoryTricks: [
      "\"Rate up, wait down\" - mean = 1/lambda, so a bigger rate always means a shorter average wait.",
      "Memoryless = the process forgets everything before now - the future only depends on the current moment, never on history.",
    ],
    formulas: [
      "f(x) = lambda e^(-lambda x), x >= 0.   Mean = 1/lambda.   Variance = 1/lambda^2.",
      "P(X <= x) = 1 - e^(-lambda x).   P(X > x) = e^(-lambda x).",
      "Memoryless: P(X > s+t | X > s) = P(X > t).",
    ],
    shortcuts: [
      "For any \"probability of waiting more than x\" question, use P(X>x)=e^(-lambda x) directly - never set up an integral for this specific case, since the CDF's complement is already the closed form.",
      "If a question gives a mean wait time directly, invert it (lambda = 1/mean) before doing anything else - most exponential-distribution formulas are stated in terms of lambda, not the mean.",
    ],
    pyqRelevance: `Exponential distribution questions typically test either a direct mean/probability computation using P(X>x)=e^(-lambda x), or explicitly test recognition of the memoryless property via a conditional-probability-style question - both are common 1-2 mark questions once the rate-vs-mean reciprocal relationship is solid.`,
    interviewConnection: `The exponential distribution models server request inter-arrival times and time-to-failure in reliability engineering - the memoryless property is exactly why "time since last failure" gives zero predictive power for "time until next failure" in a well-modeled system, a common point of confusion in system-design and SRE discussions.`,
    revisionSummary: `Exponential models waiting time for a constant-rate process, rate lambda. PDF lambda e^(-lambda x). Mean=1/lambda, Variance=1/lambda^2. P(X>x)=e^(-lambda x) directly.

Memoryless: P(X>s+t | X>s)=P(X>t) - the sole continuous distribution with this property, and a common GATE conceptual trap.

Exponential (gaps) and Poisson (counts) describe the same process, sharing lambda.`,
    shortNotes: {
      oneMinute: "Exponential: waiting time, rate lambda. PDF=lambda e^(-lambda x). Mean=1/lambda, Var=1/lambda^2. P(X>x)=e^(-lambda x). Memoryless: P(X>s+t|X>s)=P(X>t) - unique among continuous distributions. Paired with Poisson (same lambda): exponential=gaps, Poisson=counts.",
    },
    mcqs: [
      {
        question: "A component's lifetime is exponential with mean 20 hours. What is the rate parameter lambda?",
        options: ["20", "0.05", "1/20 hours", "400"],
        correctIndex: 1,
        explanation: "Mean = 1/lambda, so lambda = 1/mean = 1/20 = 0.05 per hour.",
      },
      {
        question: "Which property uniquely characterises the exponential distribution among continuous distributions?",
        options: ["Symmetry about the mean", "Memorylessness", "Bounded support", "Constant variance regardless of parameters"],
        correctIndex: 1,
        explanation: "The memoryless property (P(X>s+t|X>s)=P(X>t)) is the exponential distribution's defining, unique feature among continuous distributions.",
      },
    ],
    numericals: [
      {
        question: "Bus arrivals follow an exponential distribution with rate lambda = 0.2 per minute. What is the mean waiting time in minutes?",
        answerMin: 5,
        answerMax: 5,
        unit: "minutes",
        solution: `Mean = 1/lambda = 1/0.2 = 5 minutes`,
      },
    ],
  },

  "poisson-distribution": {
    difficulty: "Moderate",
    estimatedMinutes: 25,
    xpReward: 22, coinReward: 8,
    whatYoullLearn: [
      "What the Poisson distribution models: the count of rare, independent events in a fixed interval",
      "Its PMF and the single parameter lambda that is simultaneously its mean AND variance",
      "The Poisson approximation to the binomial distribution, and when it's valid",
      "Recognising a Poisson-shaped word problem from its phrasing",
    ],
    prerequisites: ["Random Variables"],
    concept: `## Counting Rare Events In A Fixed Window

::: story
The Poisson distribution counts how many times a rare, independent event happens in a fixed interval of time or space - number of typos on a page, number of customers arriving in an hour, number of flaws in a metre of cable. It needs just one parameter, lambda, which is both the average RATE and the expected COUNT for that interval.
:::

::: remember
For a Poisson distribution, mean and variance are EQUAL - both are exactly lambda. This is the single fastest way to recognise Poisson-shaped data or verify a Poisson-model assumption: if a dataset's sample mean and sample variance are close, Poisson is a reasonable fit.
:::

## The PMF And Its Shape

::: cards
PMF :: P(X=k) = (e^(-lambda) * lambda^k) / k!, for k = 0, 1, 2, 3, ...
Mean :: E[X] = lambda.
Variance :: Var(X) = lambda (same as the mean - unique to Poisson among common discrete distributions).
:::

::: mistake
Forgetting the k! in the denominator, or mis-substituting lambda for the actual count k when computing a specific P(X=k) - these two symbols play very different roles and are easy to swap under time pressure.
:::

## Poisson As A Binomial Approximation

::: flow
When binomial gets awkward :: A binomial distribution with a very LARGE n and very SMALL p (many trials, rare success each time) becomes computationally awkward and numerically unstable to compute directly.
The approximation :: If n is large, p is small, and np stays moderate, Binomial(n,p) is well-approximated by Poisson(lambda = np).
Rule of thumb :: This approximation is considered good when n >= 20 (some texts say n >= 100) and p <= 0.05, roughly.
:::

::: checkpoint
A typist makes errors following a Poisson distribution with lambda = 3 errors per page. What is the mean number of errors per page?
- (x) 3
- ( ) 9
- ( ) sqrt(3)
- ( ) Cannot be determined from lambda alone
> For a Poisson distribution, the mean equals lambda directly - here, 3 errors per page, with variance also equal to 3.
:::`,
    keyPoints: [
      "Poisson distribution counts rare, independent events in a fixed interval, with a single rate parameter lambda.",
      "PMF: P(X=k) = e^(-lambda) lambda^k / k!.",
      "Mean = Variance = lambda - the one distinguishing numerical signature of a Poisson fit.",
      "Poisson(lambda=np) approximates Binomial(n,p) well when n is large and p is small with np moderate - a standard rule of thumb is n>=20, p<=0.05.",
      "Recognise Poisson word problems by their phrasing: 'number of X per unit time/area/length', with events assumed rare and independent.",
    ],
    analogies: [
      "Poisson counting is like scanning a long stretch of highway for potholes - potholes are rare, independent, and scattered, and the Poisson distribution predicts how many you'll find in any given stretch.",
    ],
    commonMistakes: [
      "Swapping lambda and k in the PMF formula - lambda is the fixed rate parameter, k is the specific count value being evaluated.",
      "Forgetting mean=variance=lambda is a distinguishing PROPERTY (useful for verifying a Poisson fit), not just an incidental fact to memorise.",
      "Applying the Poisson approximation to a binomial with p NOT small (e.g. p=0.4) - the approximation specifically requires p small and n large, not just n large alone.",
    ],
    memoryTricks: [
      "\"Poisson: mean equals variance equals lambda\" - the shortest possible summary of the distribution's defining numerical fact.",
      "Binomial with 'many trials, rare success' smells like Poisson - n large, p small, np moderate.",
    ],
    formulas: [
      "P(X=k) = e^(-lambda) lambda^k / k!,  k = 0,1,2,...",
      "Mean = Variance = lambda.",
      "Binomial-to-Poisson approximation: Poisson(lambda = np) approximates Binomial(n,p) for large n, small p.",
    ],
    shortcuts: [
      "If a word problem describes a rate 'per unit [time/area/length]' with rare, independent occurrences, default to Poisson before considering any other discrete distribution.",
      "A quick sanity check on a computed Poisson answer: mean and variance should come out equal - if they don't in a follow-up part of the same question, something was miscalculated.",
    ],
    pyqRelevance: `Poisson distribution questions are a common 1-2 mark GATE question, typically a direct PMF computation for a specific k given lambda, or a conceptual question about the mean=variance property or the binomial approximation conditions.`,
    interviewConnection: `The Poisson distribution models server request rates, network packet arrivals, and system failure counts - directly used in queueing theory and capacity planning, where "average requests per second" being Poisson-distributed is a standard modeling assumption.`,
    revisionSummary: `Poisson counts rare independent events in a fixed interval, parameter lambda. PMF: e^(-lambda) lambda^k / k!.

Mean = Variance = lambda - the distribution's signature property.

Approximates Binomial(n,p) when n large, p small, np moderate (lambda=np).`,
    shortNotes: {
      oneMinute: "Poisson: rare independent events per fixed interval, rate lambda. PMF=e^(-lambda)lambda^k/k!. Mean=Variance=lambda (signature property). Approximates Binomial(n,p) when n large, p small, np moderate (lambda=np).",
    },
    mcqs: [
      {
        question: "X follows a Poisson distribution with lambda=4. What is Var(X)?",
        options: ["2", "4", "16", "Cannot be determined"],
        correctIndex: 1,
        explanation: "For a Poisson distribution, variance always equals the mean, which equals lambda - here, 4.",
      },
    ],
    numericals: [
      {
        question: "Calls arrive at a call centre following a Poisson distribution with mean 6 calls per minute. What is P(X=0) (probability of zero calls in a minute), to 3 decimal places? (lambda=6, e^-6 ~ 0.00248)",
        answerMin: 0.002,
        answerMax: 0.003,
        unit: "",
        solution: `P(X=0) = e^(-lambda) * lambda^0 / 0! = e^(-6) * 1 / 1 = e^(-6) ~ 0.00248`,
      },
    ],
  },

  "binomial-distribution": {
    difficulty: "Easy",
    estimatedMinutes: 25,
    xpReward: 20, coinReward: 8,
    whatYoullLearn: [
      "The conditions that must hold for a scenario to be binomial: fixed trials, two outcomes, constant probability, independence",
      "The PMF and where each factor in it comes from combinatorially",
      "Mean and variance in terms of n and p, and why variance is maximised at p=0.5",
      "Recognising and setting up a binomial word problem quickly",
    ],
    prerequisites: ["Combinatorics: Counting", "Random Variables"],
    concept: `## Counting Successes In A Fixed Number Of Trials

::: story
The binomial distribution counts the number of successes in a fixed number n of independent trials, each with the same success probability p - number of heads in 10 coin flips, number of defective items in a batch of 50, number of correct guesses on a multiple-choice test. Four conditions define it exactly: FIXED n, TWO outcomes per trial, CONSTANT p, and INDEPENDENT trials.
:::

::: remember
If any of the four binomial conditions breaks - trials aren't independent, p changes between trials, there are more than two outcomes, or n isn't fixed in advance - the distribution is NOT binomial, and using the binomial formula anyway gives a wrong answer with no warning.
:::

## The PMF, Piece By Piece

::: cards P(X=k) = C(n,k) p^k (1-p)^(n-k)
C(n,k) :: How many DIFFERENT ORDERS the k successes could occur in among n trials - this is exactly a combinatorics count, connecting straight back to Combinatorics: Counting.
p^k :: The probability of getting successes on all k of those specific chosen trials.
(1-p)^(n-k) :: The probability of getting failures on the remaining n-k trials.
Multiply all three :: One specific arrangement's probability (p^k(1-p)^(n-k)), times the number of arrangements that achieve exactly k successes (C(n,k)).
:::

::: mistake
Forgetting the C(n,k) factor entirely and just computing p^k(1-p)^(n-k) - that expression alone is the probability of ONE specific ordered sequence of successes/failures, not the probability of getting exactly k successes in ANY order, which is what the question almost always actually asks.
:::

## Mean And Variance

::: flow
Mean :: E[X] = np. Makes intuitive sense: n trials, each contributing p to the expected count on average.
Variance :: Var(X) = np(1-p) = npq (writing q = 1-p). This is MAXIMISED when p=0.5 - the outcome is most "spread out" (least predictable) when success and failure are equally likely, and most concentrated (lowest variance) when p is close to 0 or 1.
:::

::: checkpoint
A fair coin is flipped 5 times. What is P(exactly 3 heads)?
- ( ) 1/32
- (x) 10/32
- ( ) 3/32
- ( ) 8/32
> P(X=3) = C(5,3) (0.5)^3 (0.5)^2 = 10 * (1/8) * (1/4) = 10/32. The C(5,3)=10 accounts for the 10 different orders 3 heads could appear among 5 flips.
:::`,
    keyPoints: [
      "Binomial requires four conditions: fixed n trials, exactly two outcomes per trial, constant success probability p, and independent trials.",
      "PMF: P(X=k) = C(n,k) p^k (1-p)^(n-k) - the C(n,k) counts the orderings, p^k(1-p)^(n-k) is one ordering's probability.",
      "Mean = np. Variance = np(1-p), maximised at p=0.5 (maximum unpredictability) and minimised as p approaches 0 or 1.",
      "For large n and small p with np moderate, binomial is well-approximated by Poisson(lambda=np) - see Poisson Distribution.",
    ],
    analogies: [
      "The binomial PMF is 'how many ways can this happen' (C(n,k), from combinatorics) times 'how likely is any one specific way' (p^k(1-p)^(n-k)) - the same multiplication-rule thinking from basic counting, applied to probability.",
    ],
    commonMistakes: [
      "Omitting the C(n,k) factor and reporting only the probability of one specific ordered outcome as if it were the answer to 'exactly k successes' (which allows any order).",
      "Using the binomial formula when trials are NOT actually independent (e.g. drawing without replacement from a small finite population, where each draw changes the remaining probabilities).",
      "Confusing n (fixed number of trials) with k (the specific success count being asked about) when substituting into the formula.",
    ],
    memoryTricks: [
      "\"Binomial = combinatorics count x one-arrangement probability.\" C(n,k) supplies the counting, p^k(1-p)^(n-k) supplies the probability.",
      "Variance np(1-p) peaks at p=0.5 - a coin flip (p=0.5) is the least predictable binomial scenario there is.",
    ],
    formulas: [
      "P(X=k) = C(n,k) p^k (1-p)^(n-k),  k=0,1,...,n.",
      "Mean = np.   Variance = np(1-p).",
    ],
    shortcuts: [
      "Check the four binomial conditions (fixed n, two outcomes, constant p, independence) explicitly before applying the formula - a 'without replacement' phrase in the question is the most common signal that binomial does NOT apply.",
      "For a quick mean/variance-only question, skip the full PMF and go straight to np and np(1-p) - no need to compute individual P(X=k) values.",
    ],
    pyqRelevance: `Binomial distribution is one of the most frequently tested discrete distributions on GATE, typically as a direct PMF computation for a specific k, or a mean/variance question given n and p. Also commonly tested indirectly, by asking whether a described scenario IS actually binomial (checking the four conditions) as a conceptual trap question.`,
    interviewConnection: `The binomial distribution models A/B test conversion counts, quality-control defect counts in a sample, and any 'count of successes out of n independent yes/no trials' scenario - foundational for interpreting basic statistical significance tests on proportions.`,
    revisionSummary: `Binomial: fixed n independent trials, two outcomes, constant p. PMF: C(n,k) p^k (1-p)^(n-k) - combinatorial count times one-ordering probability.

Mean = np. Variance = np(1-p), maximised at p=0.5.

Approximated by Poisson(lambda=np) when n large, p small.`,
    shortNotes: {
      oneMinute: "Binomial: fixed n, 2 outcomes, constant p, independent trials. PMF=C(n,k)p^k(1-p)^(n-k). Mean=np, Var=np(1-p) (max at p=0.5). Check the 4 conditions before applying - 'without replacement' usually breaks independence.",
    },
    mcqs: [
      {
        question: "A biased coin with P(heads)=0.3 is flipped 4 times. What is the mean number of heads?",
        options: ["1.2", "0.3", "4", "0.7"],
        correctIndex: 0,
        explanation: "Mean = np = 4 * 0.3 = 1.2.",
      },
    ],
    numericals: [
      {
        question: "For a binomial distribution with n=10, p=0.4, what is the variance?",
        answerMin: 2.4,
        answerMax: 2.4,
        unit: "",
        solution: `Variance = np(1-p) = 10 * 0.4 * 0.6 = 2.4`,
      },
    ],
  },

  "mean-median-mode-and-standard-deviation": {
    difficulty: "Easy",
    estimatedMinutes: 20,
    xpReward: 18, coinReward: 7,
    whatYoullLearn: [
      "The three measures of central tendency and when each is the right one to use",
      "Why the median is robust to outliers while the mean is not",
      "Computing standard deviation step by step, and what it actually measures",
      "Recognising skewed data from the relative positions of mean, median, and mode",
    ],
    prerequisites: [],
    concept: `## Three Different Answers To "What's Typical?"

::: story
Mean, median, and mode all try to answer "what's a typical value in this data?", but they answer it differently, and they can disagree sharply when data is skewed or has outliers. Knowing WHICH one a situation calls for is as important as being able to compute any of them.
:::

::: cards
Mean :: Sum of all values divided by count. Uses every data point, but is easily dragged by outliers (one billionaire in a room of 10 pushes the "mean income" far from what's typical).
Median :: The middle value when data is sorted (average of the two middle values if count is even). Ignores the actual size of extreme values, only their rank - robust to outliers.
Mode :: The most frequently occurring value. The only one of the three that makes sense for CATEGORICAL (non-numeric) data, and a dataset can have more than one mode.
:::

::: mistake
Using the mean to describe "typical" income, house price, or any other heavily right-skewed quantity - the mean gets pulled toward the extreme tail, while the median stays representative of where most of the data actually sits. This is exactly why "median household income" is reported, not "mean household income".
:::

## Standard Deviation: How Spread Out The Data Is

::: flow
1. Compute the mean :: mu = sum(x_i) / n.
2. Find each deviation from the mean :: (x_i - mu) for every data point.
3. Square each deviation :: (x_i - mu)^2 - squaring makes every term positive and penalises large deviations disproportionately more than small ones.
4. Average the squared deviations :: This average IS the variance, sigma^2.
5. Take the square root :: sigma = sqrt(variance) - this brings the units back to the ORIGINAL units of the data (variance's units are squared, which isn't directly interpretable).
:::

::: remember
Standard deviation is in the SAME units as the original data (variance is not - it's in squared units). This is exactly why standard deviation, not variance, is the number typically quoted alongside a mean.
:::

## Reading Skew From Mean vs Median

::: cards
Mean = Median = Mode :: Symmetric distribution (e.g. a perfect bell curve).
Mean > Median :: Right-skewed (a long tail of high values pulls the mean up above the median).
Mean < Median :: Left-skewed (a long tail of low values pulls the mean down below the median).
:::

::: checkpoint
A dataset is {2, 3, 3, 4, 100}. Which measure best represents the "typical" value here?
- ( ) Mean (= 22.4)
- (x) Median (= 3)
- ( ) They're equally representative
- ( ) Mode is undefined here
> The mean (22.4) is dragged far from the data by the single outlier 100. The median (3, the middle value when sorted) reflects where most of the data actually sits, and is the more representative "typical value" here.
:::`,
    keyPoints: [
      "Mean uses every value and is sensitive to outliers; median uses only rank and is robust to outliers; mode is the most frequent value, the only one usable for categorical data.",
      "Standard deviation: sqrt of the average squared deviation from the mean - variance is the same thing without the square root, in squared (less interpretable) units.",
      "Mean=Median=Mode indicates symmetry; mean>median indicates right skew (a high-value tail); mean<median indicates left skew (a low-value tail).",
      "For skewed data (income, prices), median is the more representative measure of 'typical' than mean.",
    ],
    analogies: [
      "The mean is like a seesaw's exact balance point (every value's weight matters) - the median is like lining everyone up by height and picking whoever's standing in the middle (only rank matters, not exact height).",
    ],
    commonMistakes: [
      "Reporting the mean as 'typical' for heavily skewed data without checking whether the median tells a different, more representative story.",
      "Computing variance and forgetting to take the square root to get standard deviation, or reporting variance's squared units as if they were the data's original units.",
      "Assuming a dataset only has one mode - a dataset can be bimodal or multimodal (more than one most-frequent value).",
    ],
    memoryTricks: [
      "\"Mean gets dragged, median doesn't budge.\" Outliers move the mean toward them; the median barely reacts.",
      "Standard deviation = sqrt(variance) - always take the square root to get back to real units.",
    ],
    formulas: [
      "Mean: mu = sum(x_i)/n.   Variance: sigma^2 = sum((x_i-mu)^2)/n.   Standard deviation: sigma = sqrt(sigma^2).",
      "Median: middle value (sorted), or average of the two middle values if n is even.",
    ],
    shortcuts: [
      "To quickly gauge skew without computing anything precisely, compare where the mean and median roughly sit relative to each other in the data - a big gap signals significant skew and an outlier-sensitive mean.",
      "When a question explicitly mentions outliers or a skewed real-world quantity (income, house prices), default to expecting median as the more meaningful measure.",
    ],
    pyqRelevance: `Mean/median/mode/standard-deviation questions are typically fast 1-mark direct computations from a small given dataset, or a conceptual question about which measure is most appropriate/robust for a described (often skewed) scenario - both are quick, reliable marks.`,
    interviewConnection: `Choosing median over mean for skewed data (like latency percentiles - "p50" IS the median) is a standard practice in performance monitoring and reporting, precisely because a few extreme outlier requests shouldn't dominate the reported "typical" latency the way a mean would let them.`,
    revisionSummary: `Mean (sensitive to outliers, uses every value), median (robust, uses only rank), mode (most frequent, only option for categorical data).

Standard deviation = sqrt(average squared deviation from the mean) = sqrt(variance), same units as the data.

Mean=median=mode: symmetric. Mean>median: right-skewed. Mean<median: left-skewed. Median is more representative than mean for skewed data.`,
    shortNotes: {
      oneMinute: "Mean: sensitive to outliers. Median: robust (rank only). Mode: most frequent, only categorical option. SD=sqrt(variance)=sqrt(avg squared deviation), same units as data. Mean=median=mode: symmetric. Mean>median: right-skew. Mean<median: left-skew.",
    },
    mcqs: [
      {
        question: "Which measure of central tendency is LEAST affected by an extreme outlier in the data?",
        options: ["Mean", "Median", "Both equally affected", "Standard deviation"],
        correctIndex: 1,
        explanation: "The median depends only on the rank/position of values, not their magnitude, so a single extreme outlier barely shifts it - the mean, which sums every value, is pulled directly toward the outlier.",
      },
    ],
    numericals: [
      {
        question: "Find the standard deviation of the dataset {2, 4, 4, 4, 5, 5, 7, 9} (population SD). Mean = 5.",
        answerMin: 2,
        answerMax: 2,
        unit: "",
        solution: `Deviations from mean(5): -3,-1,-1,-1,0,0,2,4
Squared: 9,1,1,1,0,0,4,16 -> sum = 32
Variance = 32/8 = 4
Standard deviation = sqrt(4) = 2`,
      },
    ],
  },

  "conditional-probability": {
    difficulty: "Moderate",
    estimatedMinutes: 25,
    xpReward: 22, coinReward: 8,
    whatYoullLearn: [
      "What P(A|B) actually means: probability of A once you already know B happened",
      "The conditional probability formula and how it re-scales the sample space",
      "Independence, defined precisely in terms of conditional probability",
      "The multiplication rule for computing P(A and B) from conditional probabilities",
    ],
    prerequisites: ["Random Variables"],
    concept: `## Shrinking The Sample Space

::: story
P(A|B), read "probability of A given B", is the probability of A once you already know B happened - it's exactly what you get by throwing away every outcome where B didn't happen, and asking what fraction of the REMAINING outcomes also have A. Knowing B has occurred shrinks your sample space down to just B's outcomes.
:::

::: remember
P(A|B) = P(A n B) / P(B), defined whenever P(B) > 0. The numerator is the probability of both happening; the denominator re-scales that against the now-restricted world where B is already known to be true.
:::

## Independence: The Precise Definition

::: cards
Definition :: A and B are independent exactly when P(A|B) = P(A) - knowing B happened tells you NOTHING new about A's probability.
Equivalent form :: A and B are independent exactly when P(A n B) = P(A) x P(B) - this is usually the more practically useful form for computation.
Independent != Mutually exclusive :: These are OPPOSITE ideas often confused. Mutually exclusive events (A and B can't both happen) are actually maximally DEPENDENT - if A happens, B definitely didn't, so P(B|A)=0 != P(B) (unless P(B)=0 already).
:::

::: mistake
Treating "independent" and "mutually exclusive" as similar or related concepts. They are nearly opposite: two mutually exclusive events with nonzero individual probabilities can NEVER be independent, because each one happening completely rules out the other.
:::

## The Multiplication Rule

::: flow
Rearranging the definition :: From P(A|B) = P(AnB)/P(B), multiply both sides by P(B): P(A n B) = P(B) x P(A|B).
Chaining for more events :: P(A n B n C) = P(A) x P(B|A) x P(C|A n B) - each successive probability is conditioned on everything already assumed to have happened.
When independent :: The rule simplifies to just P(A n B) = P(A) x P(B), since P(A|B) = P(A) removes the need to condition at all.
:::

::: checkpoint
In a deck of 52 cards, a card is drawn. What is P(King | card is a face card)? (Face cards: Jack, Queen, King - 12 total, 4 Kings)
- ( ) 4/52
- (x) 4/12
- ( ) 1/13
- ( ) 3/12
> P(King | Face) = P(King n Face)/P(Face). Since every King IS a face card, King n Face = King (4 cards). Face card count = 12. So P = 4/12 = 1/3 - restricting to the 12 face cards, 4 of them are Kings.
:::`,
    keyPoints: [
      "P(A|B) = P(AnB)/P(B): the probability of A within the restricted world where B is already known true.",
      "Independence, precisely: P(A|B)=P(A), equivalently P(AnB)=P(A)P(B) - knowing one tells you nothing about the other.",
      "Mutually exclusive is nearly the OPPOSITE of independent: if A and B can't co-occur, each occurring makes the other's probability drop to exactly 0.",
      "Multiplication rule: P(AnB) = P(B)P(A|B), which chains for more events by conditioning on everything assumed so far.",
    ],
    analogies: [
      "Conditioning on B is like a spotlight that only illuminates outcomes where B happened - P(A|B) asks what fraction of THAT lit-up region also satisfies A, ignoring everything outside the spotlight entirely.",
    ],
    commonMistakes: [
      "Confusing independence with mutual exclusivity - these describe nearly opposite relationships between two events.",
      "Computing P(A|B) as P(AnB)/P(A) instead of the correct P(AnB)/P(B) - the denominator must be the CONDITION, not the event being asked about.",
      "Assuming P(A|B) = P(B|A) - these are generally different (this is exactly the confusion Bayes' Theorem exists to resolve).",
    ],
    memoryTricks: [
      "\"Condition on the thing AFTER the bar, divide by ITS probability.\" P(A|B) = P(AnB)/P(B) - B is the denominator because B is the given/known event.",
      "Independent: knowing one tells you NOTHING about the other. Mutually exclusive: knowing one tells you EVERYTHING (the other definitely didn't happen).",
    ],
    formulas: [
      "P(A|B) = P(A n B) / P(B),  P(B) > 0.",
      "Independence: P(A|B) = P(A)  <=>  P(A n B) = P(A) P(B).",
      "Multiplication rule: P(A n B) = P(B) P(A|B).   Chain rule: P(AnBnC) = P(A) P(B|A) P(C|AnB).",
    ],
    shortcuts: [
      "Whenever a question gives 'given that...' phrasing, immediately identify which event is the CONDITION (goes in the denominator) before writing any formula.",
      "To quickly check if two given events are independent, verify P(AnB) = P(A)P(B) numerically rather than reasoning about it intuitively - intuition about independence is frequently wrong.",
    ],
    pyqRelevance: `Conditional probability is a frequent 1-2 mark GATE question, either a direct P(A|B) computation from a table/scenario, or a conceptual question distinguishing independence from mutual exclusivity - the latter is a favourite exact trap because the two concepts sound related but are nearly opposite.`,
    interviewConnection: `Conditional probability is the mathematical foundation of Naive Bayes classifiers and spam filters (P(spam | contains "free")), and precisely modeling "given that we already know X, what's the chance of Y" is core to reasoning about correlated failures in distributed systems.`,
    revisionSummary: `P(A|B) = P(AnB)/P(B): probability of A, restricted to the world where B is known true.

Independence: P(A|B)=P(A), equivalently P(AnB)=P(A)P(B). Mutually exclusive is nearly opposite - each event occurring forces the other's conditional probability to 0.

Multiplication rule: P(AnB)=P(B)P(A|B), chains for more events by conditioning on everything already assumed.`,
    shortNotes: {
      oneMinute: "P(A|B)=P(AnB)/P(B) - condition (B) is the denominator. Independent: P(A|B)=P(A) i.e. P(AnB)=P(A)P(B). Mutually exclusive != independent - nearly opposite (co-occurring is impossible, so each forces the other's conditional probability to 0). Multiplication rule: P(AnB)=P(B)P(A|B).",
    },
    mcqs: [
      {
        question: "If P(A)=0.4, P(B)=0.5, and A, B are independent, what is P(A n B)?",
        options: ["0.9", "0.2", "0.1", "0.45"],
        correctIndex: 1,
        explanation: "Independence gives P(AnB) = P(A)P(B) = 0.4 * 0.5 = 0.2.",
      },
      {
        question: "Two events A and B are mutually exclusive, with P(A)>0 and P(B)>0. Can they be independent?",
        options: ["Always", "Never (unless one has probability 0)", "Only if P(A)=P(B)", "Only if A=B"],
        correctIndex: 1,
        explanation: "Mutually exclusive events with positive individual probabilities can never be independent - if A occurs, B is guaranteed NOT to occur, so P(B|A)=0, which can only equal P(B) if P(B)=0, contradicting P(B)>0.",
      },
    ],
    numericals: [],
  },

  "bayes-theorem": {
    difficulty: "Hard",
    estimatedMinutes: 30,
    xpReward: 28, coinReward: 10,
    whatYoullLearn: [
      "Bayes' Theorem, derived directly from the conditional probability definition",
      "Using the law of total probability to compute the denominator when it isn't given directly",
      "The classic 'reversing a conditional' setup: given P(evidence|cause), find P(cause|evidence)",
      "Why base rates matter enormously in Bayes' Theorem problems (the false-positive paradox)",
    ],
    prerequisites: ["Conditional Probability"],
    concept: `## Reversing A Conditional Probability

::: story
Bayes' Theorem answers a very specific and very common question: you know P(evidence | cause), but what you actually want is P(cause | evidence) - the reverse direction. A medical test's known accuracy is P(positive test | actually sick); what a patient actually wants to know is P(actually sick | positive test). These are NOT the same number, and Bayes' Theorem is the formula that converts one into the other.
:::

::: remember
Bayes' Theorem is just the conditional probability definition applied twice and rearranged: since P(AnB) = P(A)P(B|A) = P(B)P(A|B), dividing gives P(A|B) = P(A)P(B|A) / P(B). Nothing new is assumed - it's the same P(AnB) computed two ways, set equal.
:::

## The Formula, With The Law Of Total Probability

::: cards
Bayes' Theorem :: P(A|B) = [P(A) P(B|A)] / P(B).
When P(B) isn't given directly :: Use the LAW OF TOTAL PROBABILITY: P(B) = P(A)P(B|A) + P(not A)P(B|not A), summing over every way B could have happened.
Full form (2-outcome case) :: P(A|B) = [P(A)P(B|A)] / [P(A)P(B|A) + P(not A)P(B|not A)].
:::

::: mistake
Confusing P(A|B) with P(B|A) - treating a test's known accuracy P(positive|sick) as if it directly answered P(sick|positive). These are different numbers and conflating them is exactly the error Bayes' Theorem exists to prevent.
:::

## The Base-Rate Trap

::: story
Suppose a disease affects 1% of a population, and a test is 99% accurate (both for true positives and true negatives). A patient tests positive - what's P(sick | positive)? Intuition says "99%", but the actual answer is closer to 50%, because the disease is RARE: among everyone who tests positive, most are healthy people who got a false positive, simply because there are so many more healthy people to begin with.
:::

::: flow
1. Set up the pieces :: P(sick)=0.01, P(healthy)=0.99, P(positive|sick)=0.99, P(positive|healthy)=0.01 (false positive rate).
2. Compute P(positive) via total probability :: P(positive) = P(sick)P(positive|sick) + P(healthy)P(positive|healthy) = 0.01(0.99) + 0.99(0.01) = 0.0099 + 0.0099 = 0.0198.
3. Apply Bayes :: P(sick|positive) = [0.01 x 0.99] / 0.0198 = 0.0099/0.0198 = 0.5.
4. Interpret :: Despite a "99% accurate" test, P(sick|positive) is only 50% - because the low base rate (1%) means healthy people vastly outnumber sick people, so even a small false-positive RATE produces a large ABSOLUTE number of false positives.
:::

::: checkpoint
A factory has two machines: Machine A makes 60% of products with a 2% defect rate; Machine B makes 40% with a 5% defect rate. A random product is defective. What's P(it came from Machine B)?
- ( ) 40%
- ( ) 5%
- (x) About 62.5%
- ( ) About 37.5%
> P(defective) = 0.6(0.02) + 0.4(0.05) = 0.012 + 0.02 = 0.032. P(B|defective) = P(B)P(defective|B)/P(defective) = 0.4(0.05)/0.032 = 0.02/0.032 = 0.625, i.e. about 62.5% - even though B makes fewer products overall, its higher defect rate makes it the more likely source given a defect was observed.
:::`,
    keyPoints: [
      "Bayes' Theorem: P(A|B) = P(A)P(B|A) / P(B) - derived directly from the conditional probability definition applied in both directions.",
      "When P(B) isn't given directly, compute it via the law of total probability: sum P(A_i)P(B|A_i) over every mutually exclusive way B could occur.",
      "Bayes' Theorem exists specifically to reverse a conditional: from a known P(evidence|cause) to the desired P(cause|evidence).",
      "The base-rate trap: a rare condition combined with an imperfect test can produce a surprisingly low P(condition|positive test), even when the test's individual accuracy sounds high - because false positives from the much larger healthy population can outnumber true positives.",
    ],
    analogies: [
      "Bayes' Theorem is like updating a weather forecast: you start with a base-rate belief (climate averages), then REVISE it once new evidence (today's barometric reading) comes in - the base rate never disappears, it just gets combined with the new evidence.",
    ],
    commonMistakes: [
      "Directly equating P(A|B) with P(B|A) - the single most common Bayes' Theorem error, and exactly what the theorem exists to correct.",
      "Forgetting to use the law of total probability to compute P(B) when it isn't given directly in the problem.",
      "Ignoring the base rate (P(A) itself) and reasoning only from the test's accuracy, leading straight into the base-rate-trap error.",
      "Mixing up which conditional probability (P(B|A) vs P(B|not A)) belongs in which term of the total-probability sum.",
    ],
    memoryTricks: [
      "\"Bayes reverses the arrow\": if the problem GIVES you P(evidence|cause) and ASKS for P(cause|evidence), that arrow-flip is the signal to reach for Bayes' Theorem.",
      "Denominator = law of total probability = 'every way the evidence could have happened, weighted by how likely each cause is'.",
    ],
    formulas: [
      "P(A|B) = P(A) P(B|A) / P(B).",
      "Law of total probability: P(B) = sum over i of P(A_i) P(B|A_i), for mutually exclusive, exhaustive A_i.",
      "Two-outcome form: P(A|B) = [P(A)P(B|A)] / [P(A)P(B|A) + P(not A)P(B|not A)].",
    ],
    shortcuts: [
      "Before applying Bayes' Theorem, explicitly write out what's GIVEN (usually P(evidence|cause)) versus what's ASKED (usually P(cause|evidence)) - this prevents accidentally substituting the wrong conditional into the formula.",
      "Compute the denominator (total probability) as a clearly separate step before assembling the full Bayes fraction - trying to do both in one line is where sign/term errors creep in.",
    ],
    pyqRelevance: `Bayes' Theorem is one of the more heavily-weighted Probability topics on GATE, almost always appearing as a full word-problem numerical (medical test, factory machines, spam filter) requiring both the law of total probability AND the Bayes formula - a 2-mark question that rewards a careful, step-by-step setup over a rushed shortcut.`,
    interviewConnection: `Bayes' Theorem is the mathematical foundation of spam filters, medical diagnostic reasoning, and Bayesian machine learning models - understanding the base-rate trap specifically explains why a "99% accurate" fraud-detection or medical-screening system can still produce mostly false alarms when the underlying condition is rare.`,
    revisionSummary: `Bayes' Theorem: P(A|B) = P(A)P(B|A)/P(B), reversing a known P(evidence|cause) into the desired P(cause|evidence).

When P(B) isn't given, compute it via total probability: sum P(A_i)P(B|A_i) over every possible cause.

Base-rate trap: a rare condition plus an imperfect test can give a surprisingly low P(condition|positive test) - always account for the base rate, not just the test's stated accuracy.`,
    shortNotes: {
      oneMinute: "Bayes: P(A|B)=P(A)P(B|A)/P(B) - reverses a known P(evidence|cause) into P(cause|evidence). P(B) via total probability: sum P(A_i)P(B|A_i). Base-rate trap: rare condition + imperfect test -> P(condition|positive) can be surprisingly low; never skip the base rate.",
    },
    mcqs: [
      {
        question: "Bayes' Theorem is used to compute which of the following, given the other conditional is known?",
        options: [
          "P(A) from P(B)",
          "P(A|B) from a known P(B|A)",
          "P(A n B) from P(A) and P(B) alone, assuming independence",
          "P(A) + P(B) from P(A n B)",
        ],
        correctIndex: 1,
        explanation: "Bayes' Theorem's entire purpose is converting a known P(B|A) into the desired P(A|B) - reversing the direction of conditioning.",
      },
    ],
    numericals: [
      {
        question: "A test is 95% accurate for both true positives and true negatives. The condition's base rate is 2%. Given a positive test, what is P(condition | positive)? Answer as a percentage, 1 decimal place. (P(cond)=0.02, P(healthy)=0.98, P(pos|cond)=0.95, P(pos|healthy)=0.05)",
        answerMin: 27.9,
        answerMax: 28.0,
        unit: "%",
        solution: `P(pos) = P(cond)P(pos|cond) + P(healthy)P(pos|healthy)
       = 0.02(0.95) + 0.98(0.05) = 0.019 + 0.049 = 0.068

P(cond|pos) = 0.02(0.95) / 0.068 = 0.019/0.068 ~ 0.2794 ~ 27.9%

(Despite 95% accuracy, a positive result is only ~28% likely to be a true condition, because the 2% base rate is low.)`,
      },
    ],
  },

};
