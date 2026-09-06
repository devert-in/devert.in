// GATE Engineering Mathematics (Part B) - authored lesson content. Follows
// the authoring rules documented at the top of general-aptitude.mjs:
//
//  1. `concept` uses the shared lesson-block syntax (devert-frontend/lib/
//     lessonBlocks.js). Analogy first, formal definition after. At least two
//     `##` sections.
//  2. Do NOT restate commonMistakes / formulas / shortcuts / memoryTricks /
//     analogies inside `concept` verbatim - each renders as its own card
//     directly beneath it in gate-subjects.jsx's topic view.
//  3. `pyqRelevance`, `interviewConnection` and `revisionSummary` render as
//     PLAIN TEXT (whitespace-pre-wrap). No `:::` fences in those three.
//  4. `numericals` are NAT-shaped (type a number, no options) with an
//     inclusive accepted range - `unit: ""` for a plain dimensionless number.
//
// SUBJECT FRAME: this file covers the second half of Engineering Mathematics
// - Calculus (limits through integration) and Probability & Statistics
// (random variables through Bayes theorem). Both halves are the most
// formula-heavy material on the whole GATE CS paper, and also the material
// most candidates memorise as disconnected formulas instead of understanding
// as one connected story. Every lesson here leans on the plain-language,
// everyday-analogy version of the idea FIRST, because a formula that isn't
// anchored to a picture is the first thing forgotten under exam pressure.

export const ENGINEERING_MATHEMATICS_B = {

  // ---------------- Calculus ----------------

  "limits": {
    difficulty: "Moderate",
    estimatedMinutes: 30,
    // Verified via YouTube oEmbed (2026-08-29) - real, publicly viewable.
    resources: [{
      kind: "video",
      title: "Limits, Continuity & Differentiability-1 | Lec 18 | Engineering Mathematics | GATE (All Branches)",
      url: "https://www.youtube.com/watch?v=MRLiEl49xTY",
      description: "Introduces the concept of limits as part of a GATE calculus lecture.",
    }],
    xpReward: 30, coinReward: 12,
    whatYoullLearn: [
      "What a limit actually means, using a simple 'how close without touching' picture",
      "How to compute limits by direct substitution, factoring, and standard limit forms",
      "L'Hopital's rule - exactly when it applies, and the trap of using it when it doesn't",
      "Why a limit can exist even when the function itself is undefined at that point",
    ],
    prerequisites: [],
    concept: `## How Close Can You Get, Without Touching?

::: analogy
Imagine walking toward a wall and someone asks: "how close do you get, without ever touching it?" You take a step, then a smaller step, then an even smaller one. You never have to actually touch the wall for the question to have a clean answer - the answer is simply "the wall's position."

A limit asks exactly this about a function. As x gets closer and closer to some value a, what value does f(x) get closer and closer to? It is a question about the neighbourhood around a point, not about the point itself.
:::

::: remember
lim(x->a) f(x) = L means: f(x) can be made as close to L as you like, just by making x close enough to a. It says nothing about f(a) - the function might not even be defined there, and the limit can still exist.
:::

## Three Separate Questions, Often Merged Into One

::: cards Don't merge these
Is f(a) defined? :: A question about the single point a, and only that point.
Does the limit exist? :: A question about the neighbourhood around a, ignoring a itself completely.
Are they equal? :: Only when both of the above hold AND they match is f "continuous" at a - a different topic, coming next.
:::

::: checkpoint
f(x) = 5 for every x, except f(2) = 100. What is lim(x->2) f(x)?
- ( ) 100
- (x) 5
- ( ) Does not exist
- ( ) Undefined
> The limit only cares what happens NEAR x = 2, not at x = 2 itself. Every point close to 2 has f(x) = 5, so the limit is 5 - completely unaffected by the oddly defined value at the single point.
:::

## Approaching From Two Sides

::: cards The two roads must meet
Left-hand limit :: the value f(x) approaches as x creeps up to a from below (x < a)
Right-hand limit :: the value f(x) approaches as x creeps down to a from above (x > a)
Two-sided limit exists :: only when both of the above are equal, and finite
:::

## Actually Computing One

::: flow
1. Try direct substitution :: Plug x = a straight in. Get a real number? You're done.
2. Spot an indeterminate form :: 0/0 or infinity/infinity means substitution alone can't answer it - it needs more work, not an automatic "doesn't exist".
3. Factor and cancel, or rationalise :: Algebra removes the problem factor, then substitute again.
4. Reach for L'Hopital's rule, only now :: Differentiate the top and bottom SEPARATELY (never the whole fraction as one thing), then try the limit again.
:::

::: tip
L'Hopital's rule has a permit slip: the fraction must ALREADY be 0/0 or infinity/infinity at that point. If it isn't, differentiating top and bottom doesn't just waste time - it gives a wrong answer. Recheck the form fresh after every round, since one application can leave you at 0/0 again, needing a second round.
:::`,
    deepDive: `## Limits At Infinity, Without Any Derivatives

For a ratio of polynomials as x -> infinity, you almost never need L'Hopital's rule - just compare the highest power (the degree) on top and on the bottom.

::: cards Comparing degrees
Top degree < bottom degree :: limit is 0 - the bottom grows faster, so the fraction shrinks toward nothing.
Top degree = bottom degree :: limit is the ratio of the leading coefficients only.
Top degree > bottom degree :: limit is +infinity or -infinity, sign decided by the leading coefficients.
:::

This is exactly the information L'Hopital's rule would eventually produce, one degree at a time - reading the degrees directly is simply faster, and there is nothing to get wrong.`,
    workedExamples: [
      {
        title: "A 0/0 Form, Solved By Factoring",
        problem: "Evaluate lim(x->3) (x^2 - 9) / (x - 3).",
        solution: `  Direct substitution first: at x = 3, this is (9 - 9)/(3 - 3) = 0/0.
  That is indeterminate, not zero - substitution alone has failed,
  so factor instead.

  x^2 - 9 factors as (x - 3)(x + 3), so the fraction becomes:

    (x - 3)(x + 3) / (x - 3)

  For every x other than 3, the (x - 3) on top and bottom cancel -
  legal here, because the limit never actually looks at x = 3 itself.

  What remains is just x + 3. Substitute x = 3 now: 3 + 3 = 6.

  lim(x->3) (x^2 - 9)/(x - 3) = 6`,
      },
      {
        title: "L'Hopital's Rule, Applied Twice",
        problem: "Evaluate lim(x->0) (e^(2x) - 1 - 2x) / x^2.",
        solution: `  At x = 0: numerator = 1 - 1 - 0 = 0. Denominator = 0. That is a
  genuine 0/0 form, so L'Hopital's rule is allowed.

  Differentiate top and bottom SEPARATELY:
    top:    2e^(2x) - 2
    bottom: 2x

  At x = 0 this gives (2 - 2)/0 = 0/0 - still indeterminate, so
  apply L'Hopital a second time on this new fraction.

  Differentiate again:
    top:    4e^(2x)
    bottom: 2

  At x = 0: 4(1)/2 = 2

  lim(x->0) (e^(2x) - 1 - 2x)/x^2 = 2`,
      },
    ],
    dryRun: `Does lim(x->1) f(x) exist, for f(x) = x + 1 when x < 1; f(x) = 3 when x = 1; f(x) = x^2 + 1 when x > 1?

::: timeline Checking a piecewise limit
Ignore the value AT x = 1, for now :: f(1) = 3 is a red herring for this question - a limit only cares about the neighbourhood, not the single point.
Left-hand limit :: As x creeps up to 1 from below, use the x + 1 piece. Substituting x = 1 into it: 1 + 1 = 2.
Right-hand limit :: As x creeps down to 1 from above, use the x^2 + 1 piece. Substituting x = 1 into it: 1 + 1 = 2.
Compare :: Left-hand limit = 2. Right-hand limit = 2. They match.
Conclusion :: The two-sided limit exists and equals 2 - even though f(1) itself is 3, a completely different number.
:::

This is the three-separate-questions rule made concrete: f(1) = 3, the limit = 2, and the two were never required to agree.`,
    analogies: [
      "A limit is like a GPS 'you have arrived' ping that fires just before you actually park - it only cares about getting arbitrarily close, never about touching the exact spot.",
      "One-sided limits are like two people walking toward the same street corner from different streets - they only 'meet' if both arrive at the same corner.",
    ],
    commonMistakes: [
      "Assuming a limit doesn't exist just because the function isn't defined at that exact point - the limit only cares about points near it.",
      "Using L'Hopital's rule on a fraction that isn't actually 0/0 or infinity/infinity - check the form first, every single time.",
      "Stopping after one round of L'Hopital's rule when the result is STILL 0/0 or infinity/infinity - keep differentiating until it genuinely isn't.",
      "Treating a one-sided infinite blow-up (say +infinity from the right, -infinity from the left) as 'the limit is infinity' - when the two sides disagree even about direction, the correct answer is that the limit does not exist.",
      "Forgetting the standard limits (like sin(x)/x -> 1) and trying to brute-force every trig limit with raw algebra instead.",
    ],
    memoryTricks: [
      "Same corner, different streets: a two-sided limit needs the left road AND the right road to arrive at the exact same value.",
      "L'Hopital's permit slip: 0/0 or infinity/infinity ONLY. No permit, no L'Hopital.",
      "Standard limits crib, all equal to 1 as x->0: sin(x)/x, tan(x)/x, (e^x - 1)/x, ln(1+x)/x.",
    ],
    formulas: [
      "lim(x->0) sin(x)/x = 1, and lim(x->0) tan(x)/x = 1.",
      "lim(x->0) (1 - cos x)/x^2 = 1/2.",
      "lim(x->0) (e^x - 1)/x = 1, and lim(x->0) ln(1 + x)/x = 1.",
      "lim(x->infinity) (1 + 1/x)^x = e.",
      "L'Hopital's rule: if f(x)/g(x) is 0/0 or infinity/infinity at x = a, then lim f(x)/g(x) = lim f'(x)/g'(x), provided that second limit exists.",
    ],
    shortcuts: [
      "For a ratio of polynomials as x -> infinity, just compare the highest powers on top and bottom - no derivatives needed.",
      "For lim(x->0) sin(kx)/x style expressions, multiply and divide by k to turn it into k times sin(kx)/(kx), which is just k times 1.",
    ],
    pyqRelevance: `Limits are almost always asked as a direct 1 or 2 mark evaluation - substitute, factor, or apply L'Hopital's rule, then read off a number.

The recurring trap is testing whether you check the indeterminate form before reaching for L'Hopital's rule, and whether you keep re-checking after each round. A close second is a limit at infinity of a rational function, which is really a degree-comparison question wearing a calculus costume.

Standard limits (sin x/x, (e^x-1)/x, and the rest) are worth memorising outright - they turn a multi-step derivation into a ten-second lookup.`,
    interviewConnection: `Limits are the idea underneath the formal definition of a derivative, and underneath asymptotic (big-O) analysis - "what does this algorithm's running time approach as input size grows without bound" is a limit question in disguise.

The same instinct shows up in floating-point code: comparing two computed values for exact equality is fragile, so real code checks that they are within some small epsilon of each other - which is precisely the "arbitrarily close" idea a limit formalises.`,
    revisionSummary: `A limit describes what f(x) approaches as x approaches a, without requiring f(a) to be defined or to match. Three separate questions: is f(a) defined, does the limit exist, are they equal.

A two-sided limit exists only when the left-hand and right-hand limits agree.

Method: substitute directly first. If 0/0 or infinity/infinity appears, factor/rationalise, or apply L'Hopital's rule (differentiate top and bottom separately, recheck the form after every round).

For limits at infinity of a ratio of polynomials, compare degrees directly instead of differentiating.

Memorise the standard limits equal to 1 as x->0: sin(x)/x, tan(x)/x, (e^x-1)/x, ln(1+x)/x.`,
    shortNotes: {
      fiveMinute: "A limit is what f(x) approaches near x=a, independent of f(a) itself - three separate questions (is f(a) defined, does the limit exist, do they match) that GATE loves to test apart. Two-sided limit needs left-hand limit = right-hand limit. Compute by direct substitution first; if 0/0 or infinity/infinity appears, factor/rationalise or apply L'Hopital's rule (differentiate numerator and denominator separately, then recheck the form before applying again). For limits at infinity of a polynomial ratio, just compare degrees. Memorise sin(x)/x, tan(x)/x, (e^x-1)/x, ln(1+x)/x -> all 1 as x->0.",
      oneMinute: "Limit = value f(x) approaches near a, regardless of f(a). Two-sided exists iff LHL = RHL. Substitute first; 0/0 or inf/inf -> factor/rationalise or L'Hopital (separately differentiate top/bottom, recheck form each round). At infinity: compare degrees of numerator/denominator. Standard limits -> 1: sin x/x, tan x/x, (e^x-1)/x, ln(1+x)/x.",
      nightBefore: "LHL=RHL for limit to exist. Sub first, then factor/L'Hopital only if 0/0 or inf/inf. Recheck form each L'Hopital round. Degrees decide limits at infinity.",
    },
    keyPoints: [
      "A limit describes behaviour NEAR a point, and is entirely independent of whether f(a) is defined or what it equals.",
      "A two-sided limit exists only when the left-hand limit and the right-hand limit are equal (and finite).",
      "Compute by direct substitution first; reach for factoring, rationalising, or L'Hopital's rule only when an indeterminate 0/0 or infinity/infinity form appears.",
      "L'Hopital's rule requires re-checking the indeterminate form after every application - it can take more than one round.",
      "For a ratio of polynomials as x -> infinity, compare the degrees of numerator and denominator directly rather than differentiating.",
    ],
    mcqs: [
      {
        question: "What is lim(x->2) (x^2 - 4)/(x - 2)?",
        options: ["0", "2", "4", "Does not exist"],
        correctIndex: 2,
        explanation: "Direct substitution gives 0/0, so factor: (x-2)(x+2)/(x-2) = x+2 for x not equal to 2. Substituting x=2 into the simplified form gives 4.",
      },
      {
        question: "Which of these limits is a valid situation for applying L'Hopital's rule?",
        options: [
          "lim(x->0) (x + 1)/(x + 2)",
          "lim(x->0) sin(x)/(x + 5)",
          "lim(x->0) sin(x)/x",
          "lim(x->1) (x - 1)/(x + 3)",
        ],
        correctIndex: 2,
        explanation: "Only sin(x)/x is 0/0 at x=0. The other three substitute to a real, defined number directly, so applying L'Hopital's rule to them would be invalid (and would coincidentally give a wrong answer if tried).",
      },
      {
        question: "lim(x->infinity) (2x^3 + x)/(5x^3 - 7) equals:",
        options: ["0", "2/5", "5/2", "infinity"],
        correctIndex: 1,
        explanation: "The top and bottom have the same degree (3), so the limit is the ratio of the leading coefficients: 2/5. No derivative is needed.",
      },
    ],
    numericals: [
      {
        question: "Evaluate lim(x->0) sin(5x)/sin(3x). Give your answer as a decimal.",
        answerMin: 1.65,
        answerMax: 1.68,
        unit: "",
        solution: `  Rewrite by multiplying and dividing to expose the standard form:

    sin(5x)/sin(3x) = [sin(5x)/(5x)] x [(3x)/sin(3x)] x (5x)/(3x)

  As x -> 0, both bracketed ratios -> 1, leaving just 5/3.

    5/3 = 1.6667`,
      },
      {
        question: "Evaluate lim(x->infinity) (3x^2 + 5)/(6x^2 - x + 1). Give your answer as a decimal.",
        answerMin: 0.5,
        answerMax: 0.5,
        unit: "",
        solution: `  Numerator and denominator both have degree 2, so the limit is
  the ratio of the leading coefficients:

    3/6 = 0.5`,
      },
    ],
  },

  "continuity-and-differentiability": {
    difficulty: "Moderate",
    estimatedMinutes: 30,
    // Verified via YouTube oEmbed (2026-08-29) - real, publicly viewable.
    resources: [{
      kind: "video",
      title: "Continuity & Differentiability | GATE QUESTIONS | Engineering Mathematics | Mr. Kundan P. Kumar",
      url: "https://www.youtube.com/watch?v=BIc2WwlFjUg",
      description: "Covers continuity and differentiability concepts with worked GATE exam questions.",
    }],
    xpReward: 30, coinReward: 12,
    whatYoullLearn: [
      "What makes a function continuous at a point - three conditions, all required",
      "What differentiability adds on top of continuity, and why it's a stricter demand",
      "Why every differentiable function is continuous, but not the other way round",
      "Spotting corners, cusps and jumps - the visual signatures of a broken point",
    ],
    prerequisites: ["Limits"],
    concept: `## An Unbroken Road, Versus A Smooth One

::: analogy
Picture two roads. The first has no gaps or cliffs anywhere - you can drive along it without ever lifting off the surface. That is continuity: no holes, no jumps.

The second road is not just unbroken, it also has no sharp corners - the steering wheel never has to snap suddenly to a new angle. That extra property is differentiability. Every differentiable road is automatically unbroken, but an unbroken road can still have a sharp corner in it (think of a road that hits a hairpin turn instead of ending).
:::

## Continuity Needs All Three

::: cards Continuity at x = a requires
f(a) is defined :: There has to be an actual value sitting at that point.
lim(x->a) f(x) exists :: The left-hand and right-hand limits must agree (see the Limits lesson).
The limit equals f(a) :: The value the function approaches must be the exact value it actually takes.
:::

::: mistake
Missing any ONE of the three breaks continuity - it is not enough for two out of three to hold. A function can have a perfectly good limit at a point and still be discontinuous there, simply because f(a) was defined to be something else entirely (a "removable" discontinuity - a single-point hole you could patch by redefining f(a)).
:::

## Three Ways A Function Breaks

::: cards Discontinuity types
Removable :: The limit exists, but f(a) either doesn't exist or doesn't match it - a single-point "hole" that redefining f(a) would fix.
Jump :: The left-hand limit and right-hand limit both exist but disagree - the graph steps up or down.
Infinite / essential :: The function blows up toward infinity near that point - no patch can fix this one.
:::

## Differentiability Is The Stricter Ask

::: remember
f'(a) = lim(h->0) [f(a+h) - f(a)] / h. If this limit exists, f is differentiable at a, and f'(a) is the slope of the tangent line there.

Differentiable ALWAYS implies continuous. The converse is false - continuity does not guarantee differentiability. |x| is the standard counterexample: continuous everywhere, including at 0, but with a sharp corner at 0 where the left-hand slope (-1) and right-hand slope (+1) disagree.
:::

::: checkpoint
At how many points is f(x) = |x| NOT differentiable?
- ( ) 0
- (x) 1
- ( ) 2
- ( ) Infinitely many
> Exactly one point, x = 0. Everywhere else |x| is a straight line with a constant slope (+1 or -1), perfectly differentiable. Only at the corner itself do the left-hand and right-hand slopes disagree.
:::`,
    workedExamples: [
      {
        title: "Continuous, But Not Differentiable",
        problem: "Show that f(x) = |x - 2| is continuous at x = 2 but not differentiable there.",
        solution: `  Continuity: f(2) = |2-2| = 0. As x -> 2 from either side, |x-2| -> 0
  as well. Limit = f(2) = 0, so f is continuous at x = 2.

  Differentiability - compute the one-sided derivatives separately:

    Left-hand derivative  (x < 2, so |x-2| = 2-x): slope = -1
    Right-hand derivative (x > 2, so |x-2| = x-2): slope = +1

  -1 is not equal to +1, so f'(2) does not exist. f is continuous at
  x = 2 but has a corner there, so it is NOT differentiable at x = 2.`,
      },
      {
        title: "Choosing A Constant For Differentiability",
        problem: "For f(x) = x^2 + 1 when x <= 1, and f(x) = a x when x > 1, find the value of a that makes f differentiable at x = 1.",
        solution: `  Step 1 - continuity at x = 1 (a necessary first check, since
  differentiability requires it):

    Left piece at x=1:  1^2 + 1 = 2
    Right piece at x=1: a(1) = a

    For continuity: a = 2

  Step 2 - match the one-sided derivatives at x = 1:

    Left derivative:  d/dx(x^2+1) = 2x, at x=1 gives 2
    Right derivative: d/dx(ax) = a

    For differentiability: a = 2

  Both conditions agree on a = 2 - continuity and differentiability
  are satisfied together, at a = 2.`,
      },
    ],
    analogies: [
      "Continuity is an unbroken road; differentiability is that same road with no sharp corners - a car can drive it without ever yanking the steering wheel.",
      "A removable discontinuity is a pothole you could fix with a single patch of asphalt; a jump discontinuity is a cliff no single patch can fix.",
    ],
    commonMistakes: [
      "Assuming continuity and differentiability are the same requirement - differentiability is strictly stronger, and continuity never implies it.",
      "Forgetting to check ALL three conditions for continuity, and stopping after confirming the limit exists without also checking it equals f(a).",
      "Believing a function must be differentiable everywhere it looks smooth on a rough sketch - corners and cusps are easy to miss by eye.",
      "Trying to differentiate a piecewise function at the join point using only one of the two pieces, instead of computing both one-sided derivatives and checking they match.",
      "Assuming a removable discontinuity 'doesn't count' as a discontinuity - it is still a genuine discontinuity, just a fixable one.",
    ],
    memoryTricks: [
      "Continuity's three-part checklist: f(a) exists, the limit exists, and the two are equal - all three, every time.",
      "Differentiable implies continuous. Continuous does NOT imply differentiable. The arrow only goes one way.",
      "|x| at 0 is the standard picture for 'continuous but not differentiable' - keep that one example on instant recall.",
    ],
    formulas: [
      "Continuity at x = a: f(a) is defined, lim(x->a) f(x) exists, and lim(x->a) f(x) = f(a).",
      "f'(a) = lim(h->0) [f(a+h) - f(a)] / h - the derivative, when this limit exists.",
      "For a piecewise function to be differentiable at the join point, both continuity (matching values) and matching one-sided derivatives (matching slopes) must hold.",
    ],
    shortcuts: [
      "For a piecewise function, always check continuity BEFORE differentiability at the join - a function that isn't even continuous there can never be differentiable there.",
      "Spot non-differentiable points visually: corners (|x|-style), cusps, vertical tangents, and any point that's already discontinuous.",
    ],
    pyqRelevance: `Continuity and differentiability appear together constantly, most often as "find the constants a and b that make this piecewise function continuous / differentiable at a given point" - a 1 or 2 mark algebra exercise once you know the two-step method.

A second recurring shape: "at how many points is |g(x)| not differentiable", which reduces to counting how many times the expression inside the absolute value changes sign.

Knowing that differentiable implies continuous (never the reverse) resolves a good share of true/false and assertion-reasoning questions on this topic outright.`,
    interviewConnection: `Continuity and differentiability are the mathematical language behind "does this function behave predictably", which matters directly in optimisation: gradient-based methods (the backbone of training neural networks) need a differentiable loss function, because they literally walk downhill using the derivative as a compass.

A loss function with a sharp corner (like certain non-smooth regularisers) needs special handling precisely because ordinary gradient descent assumes a well-defined slope everywhere.`,
    revisionSummary: `Continuity at x=a needs three things together: f(a) defined, the limit existing, and the two being equal. Missing any one breaks it.

Three discontinuity types: removable (a fixable hole), jump (left and right limits disagree), infinite (blows up).

Differentiability is a stricter demand: f'(a) must exist as a limit. Differentiable always implies continuous; continuity never implies differentiable - |x| at 0 is the standard counterexample (a corner).

For piecewise functions: check continuity first (matching values at the join), then differentiability (matching one-sided derivatives/slopes at the join).`,
    shortNotes: {
      fiveMinute: "Continuity at a point needs three things: f(a) defined, the limit existing, and the limit equalling f(a) - missing any one breaks continuity. Three discontinuity types: removable (fixable hole), jump (LHL/RHL disagree), infinite. Differentiability is stricter: f'(a) = lim(h->0)[f(a+h)-f(a)]/h must exist. Differentiable ALWAYS implies continuous; the reverse is false (|x| at 0: continuous, corner, not differentiable). For piecewise functions at a join point, check continuity (matching values) first, then differentiability (matching one-sided slopes).",
      oneMinute: "Continuity: f(a) defined + limit exists + they match. Differentiability: f'(a) as a limit must exist - stricter than continuity. Differentiable -> continuous, not the reverse (|x| at 0 is the classic counterexample: continuous, corner, not differentiable). Piecewise join: match values first, then match one-sided derivatives.",
      nightBefore: "Continuity = 3 conditions (defined, limit exists, match). Differentiable implies continuous, never the reverse. |x| at 0: continuous, not differentiable. Piecewise: match values then slopes at the join.",
    },
    keyPoints: [
      "Continuity at a point requires three things together: the value is defined, the limit exists, and the limit equals the value.",
      "Differentiability is stricter: the derivative must exist as a limit, which additionally rules out corners, cusps, and vertical tangents.",
      "Differentiable always implies continuous; continuity never implies differentiable - |x| at x=0 is the standard counterexample.",
      "Three discontinuity types: removable (fixable hole), jump (one-sided limits disagree), infinite (the function blows up).",
      "For a piecewise function at its join point, check continuity (matching values) first, then differentiability (matching one-sided derivatives).",
    ],
    mcqs: [
      {
        question: "Which statement is correct?",
        options: [
          "Every continuous function is differentiable",
          "Every differentiable function is continuous",
          "Continuity and differentiability are unrelated properties",
          "A function can be differentiable without being defined at that point",
        ],
        correctIndex: 1,
        explanation: "Differentiability is the stronger property and always implies continuity. The reverse fails - |x| at x=0 is continuous but not differentiable. A function must be defined at a point to even ask about its derivative there.",
      },
      {
        question: "f(x) = 1/x for x not equal to 0, and f(0) = 0. What kind of discontinuity does f have at x = 0?",
        options: ["Removable", "Jump", "Infinite", "None - f is continuous at 0"],
        correctIndex: 2,
        explanation: "As x approaches 0, 1/x grows without bound (differently from each side), so this is an infinite (essential) discontinuity - no single redefinition of f(0) can repair it.",
      },
      {
        question: "For f(x) = x^3 sin(1/x) when x is not 0, and f(0) = 0, which is true at x = 0?",
        options: [
          "f is not continuous at 0",
          "f is continuous but the derivative fails to exist",
          "f is continuous and differentiable at 0",
          "f is not defined at 0",
        ],
        correctIndex: 2,
        explanation: "Since |x^3 sin(1/x)| <= |x^3|, which squeezes to 0, f is continuous at 0. And [f(0+h)-f(0)]/h = h^2 sin(1/h), which also squeezes to 0 as h->0, so f'(0) = 0 exists too.",
      },
    ],
    numericals: [
      {
        question: "For f(x) = x^2 + 1 when x <= 1, and f(x) = a x when x > 1, find the value of a that makes f differentiable at x = 1.",
        answerMin: 2,
        answerMax: 2,
        unit: "",
        solution: `  Continuity at x=1: left piece gives 1+1=2, right piece gives a.
  So a = 2 for the values to match.

  Differentiability at x=1: left derivative is 2x at x=1, giving 2.
  Right derivative is a. So a = 2 again - both checks agree.`,
      },
      {
        question: "At how many points is f(x) = |x^2 - 4| not differentiable?",
        answerMin: 2,
        answerMax: 2,
        unit: "",
        solution: `  x^2 - 4 changes sign at its roots, x = -2 and x = 2 - exactly
  where the absolute value creates a corner.

  Everywhere else, x^2-4 keeps one sign and |x^2-4| is just a smooth
  polynomial (either x^2-4 or its negative), differentiable there.

  So f fails to be differentiable at exactly 2 points: x = -2, x = 2.`,
      },
    ],
  },

  "maxima-and-minima": {
    difficulty: "Moderate",
    estimatedMinutes: 35,
    // Verified via YouTube oEmbed (2026-08-29) - real, publicly viewable.
    resources: [{
      kind: "video",
      title: "Engineering Mathematics 07 | Maxima Minima | GATE - For All Branches",
      url: "https://www.youtube.com/watch?v=2TWoL2ZCO8M",
      description: "Covers finding maxima and minima of functions for GATE engineering mathematics.",
    }],
    xpReward: 30, coinReward: 12,
    whatYoullLearn: [
      "What a critical point is, and why f'(x) = 0 alone doesn't guarantee a max or min",
      "The first derivative test and the second derivative test, and when to use each",
      "Finding the absolute max/min of a function on a closed interval, endpoints included",
      "Solving a real optimisation problem by turning it into a single-variable calculus question",
    ],
    prerequisites: ["Continuity and Differentiability"],
    concept: `## Flat Spots On A Hiking Trail

::: analogy
Imagine hiking along a trail and watching your altitude. Every so often the ground goes momentarily flat before continuing - sometimes that flat spot is a hilltop, sometimes it's the bottom of a valley, and sometimes it's just a landing where the trail pauses before climbing further in the same direction.

A critical point is exactly one of these flat spots - a place where the slope (the derivative) is zero. Finding maxima and minima is really just finding all the flat spots, then figuring out which kind each one is.
:::

::: remember
A critical point of f is a value x = c where f'(c) = 0, or where f'(c) does not exist. A local maximum or minimum can ONLY happen at a critical point - but not every critical point is a maximum or minimum. Some are just flat pauses (inflection points) on the way through.
:::

## Telling A Hilltop From A Valley From A Pause

::: cards Two tests, two flavours
First derivative test :: Watch the SIGN of f' just before and just after c. Plus-to-minus is a local max. Minus-to-plus is a local min. No sign change at all means neither - just a pause.
Second derivative test :: Compute f''(c). Negative means the curve bends downward there (local max). Positive means it bends upward (local min). Zero tells you nothing - the test is simply inconclusive, not "no extremum".
:::

::: mistake
f(x) = x^3 has f'(0) = 0, so x = 0 is a critical point - but it is neither a max nor a min. The slope is positive on both sides of 0 (the curve just flattens out for an instant before continuing to rise). This is exactly why "f'(c) = 0" is necessary but never sufficient on its own.
:::

::: checkpoint
f''(0) = 0 for f(x) = x^4 at its critical point x = 0. What can you conclude?
- ( ) x = 0 is definitely not an extremum
- ( ) x = 0 is definitely a local maximum
- (x) The second derivative test is inconclusive - check another way
- ( ) f is not differentiable at x = 0
> f''(c) = 0 only means the second derivative test gives no verdict - it does NOT mean there is no extremum. In fact x^4 >= 0 everywhere, with equality only at x=0, so x=0 IS a local (and global) minimum here - just provable by a different argument, not the second derivative test.
:::

## Don't Forget The Endpoints

::: flow
1. Find all critical points inside the interval :: Solve f'(x) = 0, and note any point where f' doesn't exist.
2. Evaluate f at every critical point :: Not just find where they are - compute the actual height there.
3. Evaluate f at both endpoints too :: The Extreme Value Theorem guarantees a continuous function on a closed interval [a,b] has an absolute max and min - but either could sit right at an endpoint, not at a critical point at all.
4. Compare all the values :: The largest is the absolute maximum, the smallest is the absolute minimum, over that interval.
:::`,
    workedExamples: [
      {
        title: "Local Max And Min By The Second Derivative Test",
        problem: "Find the local maximum and minimum values of f(x) = x^3 - 3x^2 - 9x + 5.",
        solution: `  Step 1 - critical points: f'(x) = 3x^2 - 6x - 9 = 3(x^2 - 2x - 3)
  = 3(x - 3)(x + 1). Setting f'(x) = 0 gives x = 3 and x = -1.

  Step 2 - second derivative: f''(x) = 6x - 6.

    At x = -1: f''(-1) = -6 - 6 = -12, negative -> local MAXIMUM
    At x = 3:  f''(3)  = 18 - 6  = 12,  positive -> local MINIMUM

  Step 3 - the actual values:

    f(-1) = -1 - 3 + 9 + 5 = 10   (local maximum value)
    f(3)  = 27 - 27 - 27 + 5 = -22 (local minimum value)

  Local maximum 10 at x = -1. Local minimum -22 at x = 3.`,
      },
      {
        title: "An Optimisation Problem, Turned Into One Variable",
        problem: "A farmer has 40 m of fencing and wants to enclose the largest possible rectangular field using an existing wall as one side (so only 3 sides need fencing). Find the maximum area.",
        solution: `  Let x = the width of each of the two sides perpendicular to the
  wall, and y = the length of the side parallel to the wall.

  Fencing used: 2x + y = 40, so y = 40 - 2x.

  Area: A(x) = x * y = x(40 - 2x) = 40x - 2x^2

  This is now a single-variable calculus problem. Differentiate and
  set to zero:

    A'(x) = 40 - 4x = 0   ->   x = 10

  Check it's a maximum: A''(x) = -4, negative everywhere, so every
  critical point of A is automatically a maximum - x=10 qualifies.

  y = 40 - 2(10) = 20

  Maximum area = x * y = 10 * 20 = 200 square metres.`,
      },
    ],
    analogies: [
      "A critical point is a spot on a hiking trail where the ground is momentarily flat - it might be a hilltop, a valley floor, or just a flat landing on the way up.",
      "The second derivative is like asking whether a bowl is right-side up (holds a minimum) or upside down (holds a maximum) at that point.",
    ],
    commonMistakes: [
      "Assuming f'(c) = 0 automatically means c is a maximum or minimum - it could be an inflection point where the slope merely pauses, like x^3 at x = 0.",
      "Forgetting to check the interval's ENDPOINTS when asked for an absolute (global) maximum or minimum - the true extreme can sit at an endpoint rather than at any critical point.",
      "Treating f''(c) = 0 as proof that c is NOT an extremum - it only means the second derivative test is inconclusive, not that there's no extremum there.",
      "Forgetting that critical points also include locations where f'(x) does not exist, not only where f'(x) = 0.",
      "Sign errors while reading the first derivative test - checking the sign of f on either side of c instead of the sign of f'.",
    ],
    memoryTricks: [
      "f'(c)=0 is a NECESSARY condition for an extremum, never a sufficient one on its own - always confirm with a second test.",
      "Second derivative test: negative curves down like a frown (max), positive curves up like a smile (min), zero says nothing.",
      "Global extrema on [a,b]: critical points AND both endpoints go into the comparison - never just the critical points.",
    ],
    formulas: [
      "Critical points: solve f'(x) = 0, plus any x where f'(x) is undefined.",
      "First derivative test: f' changes + to - at c -> local max. f' changes - to + at c -> local min. No sign change -> neither.",
      "Second derivative test: f''(c) < 0 -> local max. f''(c) > 0 -> local min. f''(c) = 0 -> inconclusive.",
      "Absolute max/min on [a,b] = the largest/smallest value among f at all interior critical points AND f(a), f(b).",
    ],
    shortcuts: [
      "For optimisation word problems, express everything in terms of ONE variable using the given constraint before differentiating - two variables means you haven't finished setting up the problem yet.",
      "If the second derivative test gives 0, don't panic - just fall back to the first derivative test (checking the sign change) instead.",
    ],
    pyqRelevance: `Maxima and minima appear most often as either a direct "find the local max/min of this polynomial" (2 marks, second derivative test is fastest) or an applied optimisation word problem (2 marks, the harder half being the algebraic setup rather than the calculus).

A frequent conceptual trap question tests whether f''(c)=0 means "no extremum" - it doesn't, and GATE has asked exactly this distinction as a standalone assertion-reasoning question.

Absolute (global) extrema on a closed interval, with the endpoint check, is the other recurring shape - candidates who forget the endpoints get a plausible-looking but wrong answer.`,
    interviewConnection: `Finding maxima and minima is optimisation, and optimisation is most of applied machine learning: training a model is nothing but finding the parameters that minimise a loss function, using derivatives to know which direction is "downhill".

Gradient descent is literally the first derivative test run in reverse - repeatedly stepping in the direction that makes the derivative point toward zero, because that's where the minimum lives.`,
    revisionSummary: `Critical points: where f'(x)=0 or f'(x) is undefined. A local max/min can only occur at a critical point, but not every critical point is one (x^3 at x=0 is neither).

First derivative test: sign of f' changes + to - (max), - to + (min), no change (neither).

Second derivative test: f''(c)<0 (max), f''(c)>0 (min), f''(c)=0 (inconclusive - fall back to the first derivative test).

For an absolute max/min on a closed interval [a,b]: evaluate f at every interior critical point AND at both endpoints a, b - compare all of them.

Optimisation word problems: reduce to one variable using the given constraint, then apply the same tests.`,
    shortNotes: {
      fiveMinute: "Critical points are where f'(x)=0 or f' is undefined - a local max/min can ONLY occur there, but not every critical point is one (x^3 at 0 is neither, since the slope stays positive on both sides). First derivative test: sign of f' changing + to - means max, - to + means min, no change means neither. Second derivative test: f''(c)<0 max, f''(c)>0 min, f''(c)=0 inconclusive (fall back to the first derivative test, don't conclude 'no extremum'). For absolute max/min on a closed interval, compare f at every interior critical point AND both endpoints. Optimisation problems: use the constraint to reduce to one variable first.",
      oneMinute: "Critical point: f'=0 or undefined - necessary, not sufficient for an extremum. First derivative test: sign change of f' decides max/min/neither. Second derivative test: f''<0 max, f''>0 min, f''=0 inconclusive. Absolute extrema on [a,b]: check endpoints too, not just critical points. Optimisation: reduce to one variable via the constraint first.",
      nightBefore: "f'=0 necessary not sufficient. f''<0 max, f''>0 min, f''=0 inconclusive - don't say 'no extremum'. Always check endpoints for global max/min.",
    },
    keyPoints: [
      "A local maximum or minimum can only occur at a critical point (f'(x)=0 or undefined) - but not every critical point is one.",
      "First derivative test reads the sign change of f' around a point; second derivative test reads the sign of f'' at the point directly.",
      "f''(c) = 0 means the second derivative test is inconclusive, NOT that there is no extremum there.",
      "Absolute (global) max/min on a closed interval requires checking both endpoints, in addition to all interior critical points.",
      "Optimisation word problems become ordinary single-variable calculus once the given constraint is used to eliminate one variable.",
    ],
    mcqs: [
      {
        question: "f(x) = x^3 has f'(0) = 0. What is x = 0?",
        options: ["A local maximum", "A local minimum", "Neither - just a critical point", "Not a critical point"],
        correctIndex: 2,
        explanation: "f'(x) = 3x^2 >= 0 everywhere, so the slope never actually changes sign around x=0 (it's positive on both sides, momentarily zero at 0). No sign change means no extremum - x=0 is a critical point but neither a max nor a min.",
      },
      {
        question: "For f(x) = x^2 on the closed interval [-1, 3], what is the absolute maximum value?",
        options: ["0, at x = 0", "1, at x = -1", "9, at x = 3", "It does not exist"],
        correctIndex: 2,
        explanation: "The only critical point is x=0 (a minimum, f(0)=0). Comparing the endpoints: f(-1)=1 and f(3)=9. The largest value among all candidates is 9 at the endpoint x=3 - illustrating exactly why endpoints must be checked.",
      },
      {
        question: "If f''(c) = 0 at a critical point c, what should you conclude?",
        options: [
          "c is definitely not a local extremum",
          "c is definitely a local extremum",
          "The second derivative test is inconclusive; use another method",
          "f is not differentiable at c",
        ],
        correctIndex: 2,
        explanation: "f''(c)=0 gives no information either way - c could be a max, a min, or neither. The correct response is to fall back to the first derivative test or examine higher derivatives, not to draw either conclusion directly.",
      },
    ],
    numericals: [
      {
        question: "Find the local minimum value of f(x) = x^3 - 3x^2 - 9x + 5.",
        answerMin: -22,
        answerMax: -22,
        unit: "",
        solution: `  f'(x) = 3x^2 - 6x - 9 = 3(x-3)(x+1) -> critical points x=3, x=-1.
  f''(x) = 6x - 6. At x=3: f''=12 > 0, so x=3 is a local minimum.

  f(3) = 27 - 27 - 27 + 5 = -22`,
      },
      {
        question: "A farmer has 40 m of fencing to enclose the largest rectangular field against an existing wall (only 3 sides need fencing). Find the maximum area in square metres.",
        answerMin: 200,
        answerMax: 200,
        unit: "m^2",
        solution: `  Let x = width (2 sides), y = length (1 side): 2x + y = 40.
  Area A(x) = x(40 - 2x) = 40x - 2x^2

  A'(x) = 40 - 4x = 0 -> x = 10. A''(x) = -4 < 0, confirms a maximum.
  y = 40 - 20 = 20

  Maximum area = 10 x 20 = 200 m^2`,
      },
    ],
  },

  "mean-value-theorem": {
    difficulty: "Moderate",
    estimatedMinutes: 30,
    // Verified via YouTube oEmbed (2026-08-29) - real, publicly viewable.
    resources: [{
      kind: "video",
      title: "Mean Value Theorem -1 | Lec 23 | Engineering Mathematics | GATE (All Branches)",
      url: "https://www.youtube.com/watch?v=S-s4HH9nfx0",
      description: "Explains the mean value theorem and its application to GATE-style problems.",
    }],
    xpReward: 30, coinReward: 12,
    whatYoullLearn: [
      "Rolle's theorem and Lagrange's Mean Value Theorem, and how the second is the general case of the first",
      "Why both theorems need continuity on a CLOSED interval and differentiability on the OPEN interval",
      "The average-speed-versus-speedometer picture that makes the theorem obvious",
      "How to spot when a hypothesis silently fails, and why that breaks the guarantee",
    ],
    prerequisites: ["Maxima and Minima"],
    concept: `## Your Speedometer Had To Touch Your Average Speed

::: analogy
Drive 120 km in 2 hours, and your average speed for the trip was 60 km/h. Even though you sped up, slowed down, and stopped at a signal along the way, there had to be at least one exact instant where your speedometer read exactly 60 km/h.

That is the Mean Value Theorem. It guarantees that somewhere in the interval, the instantaneous rate of change (the tangent slope) equals the average rate of change (the secant slope) over the whole interval.
:::

::: remember
Lagrange's Mean Value Theorem: if f is continuous on the closed interval [a,b] and differentiable on the open interval (a,b), then there exists at least one c in (a,b) such that f'(c) = [f(b) - f(a)] / (b - a).

The right-hand side is just the average slope from a to b - the slope of the straight line connecting the two endpoints. The theorem says the curve's actual tangent matches that average slope somewhere in between.
:::

## Rolle's Theorem Is The Special Case Where The Trip Ends Where It Started

::: cards Rolle's, as a special case
The extra condition :: f(a) = f(b) - the function returns to the same value at both ends.
What that does to the formula :: [f(b) - f(a)]/(b-a) becomes 0/(b-a) = 0.
The conclusion :: There exists c in (a,b) with f'(c) = 0 - somewhere the tangent is exactly flat, matching an average slope of zero.
:::

::: tip
Rolle's theorem is the reason every polynomial's roots interlace with its derivative's roots - between any two consecutive roots of f, there must be at least one root of f'. That single idea underlies a surprising number of GATE root-counting questions.
:::

## The Hypotheses Are Not Optional Decoration

::: mistake
Both theorems need continuity on the CLOSED interval [a,b] AND differentiability on the OPEN interval (a,b) - and dropping either one can break the guarantee entirely, not just weaken it.

f(x) = |x| on [-1, 1] has f(-1) = 1 = f(1), which looks exactly like a Rolle's theorem setup. But f is not differentiable at x = 0, the one interior point that matters. And indeed, no c exists with f'(c) = 0 anywhere in (-1,1) - the slope is always exactly -1 or +1, never zero. The theorem's conclusion genuinely fails here, precisely because its hypothesis failed.
:::

::: checkpoint
Rolle's theorem is applied to f(x) = |x| on [-1, 1]. What goes wrong?
- ( ) f(-1) is not equal to f(1)
- ( ) f is not continuous on [-1, 1]
- (x) f is not differentiable at x = 0, inside the interval
- ( ) Nothing goes wrong - the theorem applies normally
> f is perfectly continuous everywhere, and f(-1) = f(1) = 1. But f is not differentiable at the interior point x = 0 (a corner), which violates the open-interval differentiability requirement - so the theorem simply does not apply, and indeed no flat tangent exists anywhere in this case.
:::`,
    deepDive: `## Cauchy's Mean Value Theorem, Briefly

Cauchy's Mean Value Theorem generalises Lagrange's version to TWO functions at once: if f and g are both continuous on [a,b] and differentiable on (a,b), with g'(x) not equal to 0 anywhere in (a,b), then there exists c in (a,b) such that

  [f(b) - f(a)] / [g(b) - g(a)]  =  f'(c) / g'(c)

Setting g(x) = x recovers ordinary Lagrange MVT exactly, since g'(x) = 1 and g(b)-g(a) = b-a. Cauchy's version is the tool behind proving L'Hopital's rule itself - the two topics are more connected than they first appear.`,
    workedExamples: [
      {
        title: "Verifying Rolle's Theorem And Finding c",
        problem: "Verify Rolle's theorem for f(x) = x^2 - 4x + 3 on [1, 3], and find the value of c.",
        solution: `  Check the hypotheses: f is a polynomial, so continuous and
  differentiable everywhere - both conditions hold automatically.

  Check f(1) = f(3):
    f(1) = 1 - 4 + 3 = 0
    f(3) = 9 - 12 + 3 = 0
  Equal - Rolle's theorem applies.

  Find c: f'(x) = 2x - 4. Setting f'(c) = 0 gives c = 2.

  c = 2 lies inside (1, 3), confirming the theorem.`,
      },
      {
        title: "Verifying Lagrange's MVT And Finding c",
        problem: "Verify Lagrange's Mean Value Theorem for f(x) = x^2 on [1, 4], and find c.",
        solution: `  f is a polynomial - continuous and differentiable everywhere,
  so both hypotheses hold on [1,4].

  Average slope: [f(4) - f(1)] / (4 - 1) = (16 - 1) / 3 = 5

  Find c: f'(x) = 2x. Setting f'(c) = 5 gives c = 2.5

  c = 2.5 lies inside (1, 4), confirming the theorem: the tangent
  slope at x=2.5 exactly matches the average slope of 5 over [1,4].`,
      },
    ],
    analogies: [
      "If your average speed on a trip was 60 km/h, MVT guarantees your speedometer touched exactly 60 at some instant - even though you sped up and slowed down the entire way.",
      "Rolle's theorem is MVT for a round trip: if you end up back where you started, your speedometer had to read exactly zero at some point (you were momentarily still, or moving backward-then-forward).",
    ],
    commonMistakes: [
      "Mixing up which interval is closed and which is open - continuity is required on the CLOSED interval [a,b], differentiability only on the OPEN interval (a,b).",
      "Assuming Rolle's theorem needs f(a) = f(b) = 0 specifically - it only needs f(a) = f(b), any common value works.",
      "Believing MVT guarantees a UNIQUE c - there can be more than one point satisfying the condition.",
      "Applying Rolle's or Lagrange's theorem without checking differentiability holds at EVERY interior point, not just most of them - a single failure point (like a corner) breaks the guarantee.",
      "Confusing the theorem's conclusion (tangent slope = average slope SOMEWHERE) with a claim that it holds everywhere in the interval.",
    ],
    memoryTricks: [
      "Closed for continuity, open for differentiability - CO, in that order, matching the theorem's own interval order [a,b] then (a,b).",
      "Rolle's = MVT with f(a) = f(b), which makes the average slope zero - so the guaranteed tangent slope is also zero.",
      "The speedometer story: average speed over the trip must have been touched by the actual speedometer at least once.",
    ],
    formulas: [
      "Rolle's theorem: f continuous on [a,b], differentiable on (a,b), f(a)=f(b) -> there exists c in (a,b) with f'(c) = 0.",
      "Lagrange's MVT: f continuous on [a,b], differentiable on (a,b) -> there exists c in (a,b) with f'(c) = [f(b)-f(a)]/(b-a).",
      "Cauchy's MVT: f, g continuous on [a,b], differentiable on (a,b), g' not 0 on (a,b) -> [f(b)-f(a)]/[g(b)-g(a)] = f'(c)/g'(c) for some c.",
    ],
    shortcuts: [
      "Before applying either theorem, scan the function for corners, cusps, or breaks anywhere INSIDE the interval - that's where the hypothesis usually fails in a GATE trap question.",
      "For Rolle's theorem questions, check f(a)=f(b) first - if the question doesn't give you this, it's testing Lagrange's MVT instead, not Rolle's.",
    ],
    pyqRelevance: `Mean Value Theorem questions are usually either "verify Rolle's/Lagrange's theorem and find c" (a clean 2-mark computation) or an assertion-reasoning question about which hypothesis fails in a given example - |x| on a symmetric interval is the standard trap function GATE reuses for exactly this.

Root-interlacing arguments built on Rolle's theorem occasionally appear disguised as a "how many real roots does this equation have" question, which is a harder, less obviously-MVT-flavoured application worth recognising on sight.`,
    interviewConnection: `MVT formalises the everyday intuition that average and instantaneous rates must meet somewhere - the same reasoning that justifies numerical approximation methods (like using average rate of change to bound an error term).

It also underlies the proof of L'Hopital's rule itself (via Cauchy's version), which is a good reminder that these calculus topics aren't independent facts to memorise separately - they build on each other in a single connected argument.`,
    revisionSummary: `Lagrange's MVT: f continuous on [a,b], differentiable on (a,b) -> some c in (a,b) has f'(c) equal to the average slope [f(b)-f(a)]/(b-a).

Rolle's theorem is the special case where f(a)=f(b), making the guaranteed tangent slope exactly 0.

Both hypotheses matter separately: continuity on the CLOSED interval, differentiability on the OPEN interval. Breaking differentiability at even one interior point (like a corner) can break the conclusion entirely - |x| on [-1,1] is the standard counterexample.

Cauchy's MVT generalises Lagrange's to two functions at once, and is the tool used to prove L'Hopital's rule.`,
    shortNotes: {
      fiveMinute: "Lagrange's MVT: f continuous on closed [a,b], differentiable on open (a,b) -> some c in (a,b) has f'(c) = [f(b)-f(a)]/(b-a), the average slope. Rolle's theorem is the special case f(a)=f(b), giving f'(c)=0 somewhere. Both hypotheses are essential separately - continuity on the CLOSED interval, differentiability on the OPEN interval - and a single interior failure (like a corner, e.g. |x| on [-1,1]) genuinely breaks the guaranteed conclusion, not just weakens it. Cauchy's MVT generalises to two functions and underlies the proof of L'Hopital's rule.",
      oneMinute: "MVT: f'(c) = average slope [f(b)-f(a)]/(b-a) for some c in (a,b), given continuity on [a,b] and differentiability on (a,b). Rolle's = special case f(a)=f(b), giving f'(c)=0. Both hypotheses required separately; a corner inside the interval (|x| on [-1,1]) breaks the guarantee. Cauchy's MVT generalises to two functions.",
      nightBefore: "MVT: some c has f'(c) = average slope. Rolle's = f(a)=f(b) case, f'(c)=0. Need continuity on [a,b] AND differentiability on (a,b) - both, no exceptions.",
    },
    keyPoints: [
      "Lagrange's MVT guarantees some c in (a,b) where the instantaneous slope f'(c) equals the average slope over [a,b].",
      "Rolle's theorem is the special case f(a) = f(b), where the guaranteed slope is exactly 0.",
      "Continuity is required on the CLOSED interval [a,b]; differentiability is required on the OPEN interval (a,b) - both matter, separately.",
      "A single interior point where differentiability fails (a corner) can break the theorem's conclusion entirely, even if the endpoints look fine.",
      "Cauchy's MVT generalises Lagrange's to two functions simultaneously, and is the basis for proving L'Hopital's rule.",
    ],
    mcqs: [
      {
        question: "Which condition does Rolle's theorem require that Lagrange's MVT does not?",
        options: ["Continuity on [a,b]", "Differentiability on (a,b)", "f(a) = f(b)", "f must be a polynomial"],
        correctIndex: 2,
        explanation: "Rolle's theorem is Lagrange's MVT plus the extra condition f(a)=f(b), which is what forces the guaranteed tangent slope to be exactly 0 instead of some general average slope.",
      },
      {
        question: "For f(x) = |x| on [-1, 1], why does Rolle's theorem NOT apply?",
        options: [
          "f(-1) is not equal to f(1)",
          "f is not continuous at x = 0",
          "f is not differentiable at x = 0",
          "The interval is not closed",
        ],
        correctIndex: 2,
        explanation: "f(-1)=f(1)=1 and f is continuous everywhere, but f fails to be differentiable at the interior point x=0 (a corner) - violating the open-interval differentiability hypothesis, which is why the guaranteed flat tangent genuinely does not exist here.",
      },
      {
        question: "For f(x) = x^2 on [1, 4], what is the value of c guaranteed by Lagrange's MVT?",
        options: ["2", "2.5", "3", "3.5"],
        correctIndex: 1,
        explanation: "Average slope = (16-1)/(4-1) = 5. f'(x)=2x=5 gives x=2.5, which lies inside (1,4) as required.",
      },
    ],
    numericals: [
      {
        question: "Find the value of c guaranteed by Rolle's theorem for f(x) = sin(x) on [0, pi]. Give your answer in radians.",
        answerMin: 1.57,
        answerMax: 1.58,
        unit: "radians",
        solution: `  f(0) = 0, f(pi) = 0 - equal, so Rolle's theorem applies (sin(x)
  is continuous and differentiable everywhere).

  f'(x) = cos(x). Setting cos(c) = 0 in (0, pi) gives c = pi/2.

  pi/2 ~ 1.5708`,
      },
      {
        question: "Find the value of c guaranteed by Lagrange's MVT for f(x) = x^2 on [1, 4].",
        answerMin: 2.5,
        answerMax: 2.5,
        unit: "",
        solution: `  Average slope = [f(4) - f(1)] / (4 - 1) = (16 - 1)/3 = 5

  f'(x) = 2x. Setting 2c = 5 gives c = 2.5, which lies in (1, 4).`,
      },
    ],
  },

  "integration": {
    difficulty: "Hard",
    estimatedMinutes: 40,
    // Verified via YouTube oEmbed (2026-08-29) - real, publicly viewable.
    resources: [{
      kind: "video",
      title: "Engineering Mathematics 08 | Integration (Basics) | GATE 2025 Series | All Branches",
      url: "https://www.youtube.com/watch?v=4C-enEoDq4s",
      description: "Covers the basics of integration for GATE engineering mathematics.",
    }],
    xpReward: 35, coinReward: 15,
    whatYoullLearn: [
      "Integration as differentiation run backwards, and what the '+C' actually means",
      "The definite integral as signed area, and the Fundamental Theorem that connects it to derivatives",
      "Substitution and integration by parts - the two core techniques, and when to reach for each",
      "Quick tricks (odd/even symmetry) that skip the calculation entirely for certain definite integrals",
    ],
    prerequisites: ["Mean Value Theorem"],
    concept: `## Running The Movie Backwards

::: analogy
Differentiation takes a function and produces its slope function. Integration asks the reverse question: given a slope function, what was the original function that produced it?

It's like being shown a car's speed over time and being asked how far it travelled - you're reconstructing the "what" from the "rate of change of what". Because many different starting positions could produce the exact same speed pattern (just shifted up or down), the answer always comes with a "+C" - an unknown constant, since a vertical shift never changes the slope.
:::

::: remember
Indefinite integral: the integral of f(x) dx is F(x) + C, where F'(x) = f(x). The "+C" isn't decoration - it represents every function whose derivative gives you back f(x), which is genuinely a whole family, not one function.
:::

## Area, Not Just Anti-Derivative

::: cards Two ways to picture ∫f(x)dx from a to b
As area :: The signed area trapped between the curve and the x-axis, from x=a to x=b - area above the axis counts positive, below counts negative.
As accumulation :: Slice the region into thin rectangles of width dx and height f(x), then add up infinitely many of them - the integral IS that sum, taken to its limit.
:::

::: remember
The Fundamental Theorem of Calculus connects the two calculus questions: the integral of f(x) dx from a to b equals F(b) - F(a), where F is ANY antiderivative of f. Find one antiderivative, evaluate it at both ends, subtract - that's the whole computation.
:::

::: table Basic antiderivatives worth memorising
Function | Antiderivative
x^n (n not -1) | x^(n+1)/(n+1) + C
1/x | ln|x| + C
e^x | e^x + C
sin(x) | -cos(x) + C
cos(x) | sin(x) + C
sec^2(x) | tan(x) + C
:::

## Two Techniques Cover Almost Everything

::: flow
1. Recognise a standard form first :: If it matches the table above directly, you're done - no technique needed.
2. Try substitution :: Spot an inner function and its derivative sitting together inside the integral. Let u = the inner function, rewrite everything in terms of u, integrate, then substitute back.
3. Try integration by parts :: For a PRODUCT of two different kinds of function (like x times e^x). Use ∫u dv = uv - ∫v du, choosing u by the LIATE order - Logarithmic, Inverse trig, Algebraic, Trig, Exponential - whichever comes first in that list becomes u.
:::

::: tip
Before grinding through any technique, check symmetry on a definite integral over a symmetric interval [-a, a]. If the integrand is an ODD function, the answer is immediately 0 - the negative and positive halves cancel exactly. This single check saves real time on a surprising number of GATE integrals.
:::

::: checkpoint
What is the integral of x^3 dx from -2 to 2, without computing anything?
- ( ) 4
- ( ) 8
- (x) 0
- ( ) 16
> x^3 is an ODD function (replacing x with -x flips its sign). Over a symmetric interval like [-2,2], the area on the negative side exactly cancels the area on the positive side, giving 0 - no antiderivative needed at all.
:::`,
    deepDive: `## Substitution On A Definite Integral - Don't Forget The Limits

When u-substitution is used on a DEFINITE integral, the limits of integration must change too, because they were originally limits on x, not on u.

::: cards The substitution checklist
Pick u :: The inner function whose derivative also appears (up to a constant multiple) elsewhere in the integrand.
Compute du :: Differentiate u with respect to x, and rewrite the dx piece in terms of du.
Convert the limits :: Substitute the ORIGINAL x-limits into u = ... to get new u-limits - don't integrate in u and then plug x-values back in.
Integrate in u, using the u-limits directly :: No need to ever substitute back to x, since the limits are already in u.
:::

## Integration By Parts, Repeated

Some integrals (like x^2 * e^x) need integration by parts applied more than once, each time peeling off one power of x, until the algebraic part disappears entirely. A tabular shortcut (repeatedly differentiating one factor and integrating the other, then combining diagonally with alternating signs) handles these faster than reapplying the formula from scratch each round.`,
    codeExample: {
      language: "python",
      code: `# Approximate a definite integral numerically using the trapezoidal
# rule, and compare it against the exact calculus answer.

def f(x):
    return x ** 2

def trapezoidal(f, a, b, n):
    h = (b - a) / n
    total = 0.5 * (f(a) + f(b))
    for i in range(1, n):
        total += f(a + i * h)
    return total * h

approx = trapezoidal(f, 0, 1, 1000)
exact = 1 / 3   # integral of x^2 dx from 0 to 1 is [x^3/3], giving 1/3

print(f"Trapezoidal approximation: {approx:.5f}")
print(f"Exact value (1/3):         {exact:.5f}")`,
      expectedOutput: `Trapezoidal approximation: 0.33333
Exact value (1/3):         0.33333`,
    },
    workedExamples: [
      {
        title: "A Basic Definite Integral",
        problem: "Evaluate the integral of (3x^2 + 2x) dx from x=0 to x=1.",
        solution: `  Find an antiderivative first, term by term:

    integral of 3x^2 dx = x^3
    integral of 2x   dx = x^2

  So F(x) = x^3 + x^2.

  Apply the Fundamental Theorem: F(1) - F(0)

    F(1) = 1 + 1 = 2
    F(0) = 0 + 0 = 0

  Integral = 2 - 0 = 2`,
      },
      {
        title: "Integration By Parts",
        problem: "Evaluate the integral of x * e^x dx from x=0 to x=1.",
        solution: `  This is a product of an algebraic term (x) and an exponential
  term (e^x) - integration by parts, with u chosen by LIATE.

  LIATE order picks the algebraic term as u (exponential is last):
    u = x        -> du = dx
    dv = e^x dx  -> v = e^x

  Apply ∫u dv = uv - ∫v du:

    ∫x e^x dx = x e^x - ∫e^x dx = x e^x - e^x + C = e^x(x - 1) + C

  Evaluate from 0 to 1:

    At x=1: e^1(1-1) = e(0) = 0
    At x=0: e^0(0-1) = 1(-1) = -1

  Integral = 0 - (-1) = 1`,
      },
    ],
    dryRun: `Evaluate the integral of 2x * sqrt(x^2 + 1) dx using substitution.

::: timeline Substitution, step by step
Spot the inner function :: x^2 + 1 sits inside the square root, and its derivative (2x) is sitting right outside it, multiplied on.
Let u = the inner function :: u = x^2 + 1
Compute du :: du = 2x dx - which is EXACTLY what's sitting outside the square root in the original integral.
Rewrite the whole integral in terms of u :: 2x sqrt(x^2+1) dx becomes sqrt(u) du - the x's have completely disappeared.
Integrate in u :: integral of u^(1/2) du = (2/3) u^(3/2) + C
Substitute back to x :: (2/3)(x^2 + 1)^(3/2) + C
:::

Notice the entire difficulty was recognising that 2x is the derivative of x^2+1 - once spotted, the rest is a single power-rule integral in disguise.`,
    analogies: [
      "Integration is differentiation run backwards, the way multiplication undoes division - you're asking 'what function's slope produced this', not 'what is this function's slope'.",
      "A definite integral is a very fine-grained sum: slice the region under a curve into thin rectangles, and add them all up as the slices get infinitely thin.",
    ],
    commonMistakes: [
      "Forgetting the '+C' on an indefinite integral - it represents a genuine family of functions, not a single answer.",
      "Forgetting to change the limits of integration when doing u-substitution on a definite integral (or forgetting to substitute back to x if the limits were never changed).",
      "Sign errors between sin and cos - the integral of sin(x) is -cos(x), and the integral of cos(x) is +sin(x); it's easy to drop or add the minus sign in the wrong place.",
      "Choosing u and dv in integration by parts in a way that makes the new integral HARDER rather than easier - LIATE order exists to prevent exactly this.",
      "Missing the odd/even symmetry shortcut and grinding through a full computation for an integral that was 0 by inspection.",
    ],
    memoryTricks: [
      "LIATE, in order, decides which factor becomes u: Logarithmic, Inverse trig, Algebraic, Trig, Exponential.",
      "Odd function over a symmetric interval [-a,a] -> integral is 0. Even function -> integral is twice the integral from 0 to a.",
      "u-substitution on a DEFINITE integral: convert the limits too, using u = ... at each x-limit - don't skip this step.",
    ],
    formulas: [
      "Fundamental Theorem of Calculus: integral of f(x) dx from a to b = F(b) - F(a), where F'(x) = f(x).",
      "Integration by parts: integral of u dv = uv - integral of v du.",
      "integral of x^n dx = x^(n+1)/(n+1) + C (n not equal to -1); integral of 1/x dx = ln|x| + C.",
      "integral of e^x dx = e^x + C; integral of sin(x) dx = -cos(x) + C; integral of cos(x) dx = sin(x) + C.",
      "Symmetric interval shortcut: odd integrand over [-a,a] gives 0; even integrand over [-a,a] gives 2 times the integral over [0,a].",
    ],
    shortcuts: [
      "Check odd/even symmetry on any definite integral over a symmetric interval before doing any actual work - it frequently gives the answer for free.",
      "Recognise a standard form from the antiderivative table before reaching for substitution or by-parts - most GATE integrals are a standard form wearing light disguise.",
    ],
    pyqRelevance: `Integration is asked constantly, from direct definite-integral evaluation (1-2 marks) to identifying the right technique (substitution vs by parts vs partial fractions) for a given integrand.

The u-substitution limit-conversion trap and the odd/even symmetry shortcut are both reused often enough to be worth automatic habits rather than things to re-derive each time.

Numerical integration (trapezoidal/Simpson's rule) occasionally appears as its own short question, asking for an approximate value given a small table of function values - a different skill from symbolic integration, worth not confusing with it.`,
    interviewConnection: `Integration is the continuous version of "summing up small contributions", which is exactly what appears in computing areas, probabilities (as you'll see with continuous random variables), and accumulated cost or accumulated reward in reinforcement learning.

Numerical integration methods (trapezoidal, Simpson's) are the practical tool reached for whenever a closed-form antiderivative doesn't exist - which is the everyday reality for most functions encountered outside a textbook.`,
    revisionSummary: `Integration reverses differentiation; the indefinite integral is a whole family of functions, F(x)+C.

Definite integral = signed area = F(b)-F(a) by the Fundamental Theorem of Calculus.

Two core techniques: substitution (spot an inner function and its derivative together) and integration by parts (∫u dv = uv - ∫v du, choose u by LIATE order).

On a definite integral, u-substitution requires converting the limits too.

Shortcut worth checking first: odd integrand over a symmetric interval gives 0; even integrand doubles the half-interval integral.`,
    shortNotes: {
      fiveMinute: "Integration reverses differentiation - the indefinite integral is a family F(x)+C. Definite integral = signed area = F(b)-F(a) (Fundamental Theorem of Calculus). Memorise the basic antiderivative table (x^n, 1/x, e^x, sin, cos). Two core techniques: substitution (spot an inner function whose derivative sits alongside it, and on a DEFINITE integral remember to convert the limits too) and integration by parts (∫u dv = uv - ∫v du, pick u by LIATE order: Log, Inverse trig, Algebraic, Trig, Exponential). Before grinding through either technique, check odd/even symmetry on a symmetric interval [-a,a] - odd integrand gives 0 immediately, even integrand doubles the half-interval integral.",
      oneMinute: "Integral reverses derivative; definite integral = F(b)-F(a). Memorise standard antiderivatives. Substitution: inner function + its derivative present -> sub u, convert limits too on definite integrals. By parts: ∫u dv=uv-∫v du, pick u via LIATE. Odd integrand over [-a,a] -> 0; even -> double the [0,a] integral.",
      nightBefore: "F(b)-F(a) is the definite integral. Substitution: convert limits too. By parts: LIATE picks u. Odd function over symmetric interval = 0, instantly.",
    },
    keyPoints: [
      "The indefinite integral is a family of functions F(x)+C, where F'(x)=f(x); the '+C' matters, it's not decoration.",
      "The definite integral equals signed area and is computed as F(b)-F(a) via the Fundamental Theorem of Calculus.",
      "Substitution requires spotting an inner function and its derivative together, and converting the limits when the integral is definite.",
      "Integration by parts (∫u dv = uv - ∫v du) is for products of different function types; LIATE order picks which factor is u.",
      "An odd integrand over a symmetric interval [-a,a] integrates to 0 - always check this before starting any calculation.",
    ],
    mcqs: [
      {
        question: "What is the integral of x^3 dx from x=-2 to x=2?",
        options: ["0", "4", "8", "16"],
        correctIndex: 0,
        explanation: "x^3 is an odd function, and the interval [-2,2] is symmetric about 0 - the negative and positive halves of the area cancel exactly, giving 0 without any computation.",
      },
      {
        question: "When doing u-substitution on a definite integral, what must also be done?",
        options: [
          "Nothing extra - substitute back to x at the very end only",
          "The limits of integration must be converted to u-values, or you must substitute back to x before evaluating",
          "The integral must be split into two separate integrals",
          "The dx term should simply be dropped",
        ],
        correctIndex: 1,
        explanation: "The original limits are values of x, not u. Either convert them to the corresponding u-values by plugging the x-limits into u=..., or substitute the antiderivative back to x before plugging in the original x-limits - one of the two, but never skip both.",
      },
      {
        question: "For the integral of x * ln(x) dx using integration by parts, which choice of u follows LIATE order?",
        options: ["u = x, dv = ln(x) dx", "u = ln(x), dv = x dx", "u = 1, dv = x ln(x) dx", "Either choice works equally well"],
        correctIndex: 1,
        explanation: "LIATE ranks Logarithmic above Algebraic, so ln(x) becomes u and x dx becomes dv - this choice makes the resulting integral simpler, whereas the reverse choice makes it harder.",
      },
    ],
    numericals: [
      {
        question: "Evaluate the integral of (2x + 1) dx from x=1 to x=2.",
        answerMin: 4,
        answerMax: 4,
        unit: "",
        solution: `  Antiderivative: F(x) = x^2 + x

  F(2) = 4 + 2 = 6
  F(1) = 1 + 1 = 2

  Integral = 6 - 2 = 4`,
      },
      {
        question: "Evaluate the integral of sin(x) dx from x=0 to x=pi.",
        answerMin: 2,
        answerMax: 2,
        unit: "",
        solution: `  Antiderivative: F(x) = -cos(x)

  F(pi) = -cos(pi) = -(-1) = 1
  F(0)  = -cos(0)  = -(1)  = -1

  Integral = 1 - (-1) = 2`,
      },
    ],
  },

  // ---------------- Probability and Statistics ----------------

  "random-variables": {
    difficulty: "Easy",
    estimatedMinutes: 25,
    // Verified via YouTube oEmbed (2026-08-29) - real, publicly viewable.
    resources: [{
      kind: "video",
      title: "Probability Part-5 (Random Variable) || GATE Lectures for Engineering mathematics",
      url: "https://www.youtube.com/watch?v=6qBKiO_mMcA",
      description: "GATE engineering-mathematics lecture introducing random variables in probability.",
    }],
    xpReward: 20, coinReward: 8,
    whatYoullLearn: [
      "What a random variable actually is - a labelling machine for outcomes of a random experiment",
      "PMF versus PDF, and why the same intuition doesn't carry over between discrete and continuous",
      "Why P(X = exact value) = 0 for a continuous random variable, and why that isn't a contradiction",
      "Computing the mean (expectation) and variance of a random variable directly from its distribution",
    ],
    prerequisites: [],
    concept: `## A Labelling Machine For Chaos

::: analogy
Toss three coins. The actual outcome is something messy like (Heads, Tails, Heads). A random variable is a machine that looks at that mess and hands you back a single number - say, "count the heads", which turns (H,T,H) into the number 2.

Once every outcome has been converted to a number this way, you can finally do arithmetic on the result of a random experiment - averages, spreads, comparisons - instead of just listing possibilities.
:::

::: remember
A random variable X is a function that assigns a real number to every outcome of a random experiment. It comes in two flavours: discrete (countable values, like 0, 1, 2, 3 heads) and continuous (any value in a range, like a height or a waiting time).
:::

## Discrete Needs A PMF, Continuous Needs A PDF

::: cards Two different rulebooks
Discrete - PMF p(x) :: p(x) = P(X = x) directly IS a probability. Every p(x) must be between 0 and 1, and all of them must add up to exactly 1.
Continuous - PDF f(x) :: f(x) is NOT a probability by itself - it can even exceed 1. Only the AREA under f(x) over an interval is a probability: P(a <= X <= b) = the integral of f(x) dx from a to b. The total area under the whole curve must equal 1.
:::

::: mistake
For a continuous random variable, P(X = exactly some single value c) is always 0 - because the "area" of a single point (zero width) is zero, no matter how tall the curve is there. This does NOT mean it's impossible - it can still happen - it just means a single exact value carries zero probability, which is why continuous probability questions are always phrased as ranges (P(a <= X <= b)), never single points.
:::

::: checkpoint
X is a continuous random variable. What is P(X = 3.5) if 3.5 is inside X's range?
- ( ) It depends on f(3.5)
- (x) 0, regardless of f(3.5)
- ( ) 1
- ( ) Cannot be determined
> For any continuous random variable, the probability of hitting one exact value is always 0 - it's the area of a single point under the density curve, which has zero width. This holds no matter how large f(3.5) itself is.
:::

## Expectation And Variance, In Plain Terms

::: cards What they measure
Expectation E[X] :: The long-run average value X would settle to, if you repeated the experiment many, many times. Discrete: sum of x times p(x). Continuous: integral of x times f(x) dx.
Variance Var(X) :: How spread out the values typically are around that average. Var(X) = E[X^2] - (E[X])^2.
Standard deviation :: The square root of the variance, back in the SAME units as X (variance itself is in squared units).
:::`,
    workedExamples: [
      {
        title: "Mean And Variance Of A Fair Die",
        problem: "X is the number shown on a fair six-sided die. Find E[X] and Var(X).",
        solution: `  PMF: p(x) = 1/6 for x = 1,2,3,4,5,6 (each equally likely).

  E[X] = sum of x * p(x) = (1+2+3+4+5+6) * (1/6) = 21/6 = 3.5

  E[X^2] = sum of x^2 * p(x) = (1+4+9+16+25+36) * (1/6) = 91/6

  Var(X) = E[X^2] - (E[X])^2 = 91/6 - (3.5)^2 = 15.1667 - 12.25
         = 2.9167  (exactly 35/12)`,
      },
      {
        title: "Working With A Continuous PDF",
        problem: "A continuous random variable X has PDF f(x) = 2x for 0 <= x <= 1, and 0 elsewhere. Verify it's a valid PDF, then find P(0.25 <= X <= 0.75).",
        solution: `  Verify: total area must be 1.
    integral of 2x dx from 0 to 1 = [x^2] from 0 to 1 = 1 - 0 = 1. Valid.

  P(0.25 <= X <= 0.75) = integral of 2x dx from 0.25 to 0.75
    = [x^2] from 0.25 to 0.75
    = 0.5625 - 0.0625
    = 0.5`,
      },
    ],
    analogies: [
      "A random variable is a labelling machine: whatever chaotic thing happens in the real experiment, it hands you back a single number to work with.",
      "A PDF is like a heat map of likelihood along a number line - taller doesn't mean 'more probable at that exact spot', it means 'more probability packed into any small interval around that spot'.",
    ],
    commonMistakes: [
      "Treating P(X = c) = 0 for a continuous RV as meaning that value is impossible - it isn't impossible, it simply carries zero probability, a genuinely different statement.",
      "Confusing PMF and PDF - PMF values ARE probabilities directly (so must be <= 1); PDF values are a density, not a probability, and can exceed 1.",
      "Misremembering the variance formula as (E[X])^2 - E[X^2] (sign flipped) or as (E[X^2])^2.",
      "Forgetting to check that a given PMF sums to 1 (or a given PDF integrates to 1) before treating it as valid.",
      "Ignoring the stated domain of a PDF and integrating over the wrong range, picking up regions where f(x) is actually 0.",
    ],
    memoryTricks: [
      "PMF gives probability directly; PDF gives density - only its AREA over a range is a probability.",
      "Var(X) = E[X^2] - (E[X])^2: 'mean of the squares, minus the square of the mean' - in that order.",
      "Continuous + single point = zero probability, always - ranges are the only questions that make sense.",
    ],
    formulas: [
      "Discrete: sum of p(x) over all x = 1, with each p(x) between 0 and 1.",
      "Continuous: integral of f(x) dx over the whole real line = 1, with f(x) >= 0 everywhere.",
      "E[X] = sum x p(x) (discrete) or integral of x f(x) dx (continuous).",
      "Var(X) = E[X^2] - (E[X])^2. Standard deviation = square root of Var(X).",
      "E[aX + b] = a E[X] + b. Var(aX + b) = a^2 Var(X).",
    ],
    shortcuts: [
      "Before doing anything else with a given PMF or PDF, verify it actually sums/integrates to 1 - a broken PDF makes every downstream answer meaningless.",
      "Use E[aX+b] = aE[X]+b and Var(aX+b) = a^2 Var(X) to skip recomputing from scratch after a simple linear transformation.",
    ],
    pyqRelevance: `Random variables rarely appear as a standalone question, but the PMF/PDF distinction and the "P(X=c)=0 for continuous" trap show up constantly as a quick conceptual 1-mark question, and as the setup line for a longer distribution question elsewhere in this module.

Direct expectation/variance computation from a given PMF or PDF is a recurring 2-mark numerical question - the arithmetic is simple, the failure mode is almost always a wrong formula, not a wrong calculation.`,
    interviewConnection: `Random variables are the basic unit of every probabilistic model in machine learning - a model's prediction is usually itself treated as a random variable, and "uncertainty" in an ML system's output is expressed exactly through a PMF or PDF over possible outcomes.

The PMF-versus-PDF distinction resurfaces directly when reading a paper or library that reports a "density" (which can exceed 1 and isn't itself a probability) rather than a probability mass.`,
    revisionSummary: `A random variable assigns a number to every outcome of a random experiment. Discrete RVs use a PMF (p(x) = P(X=x) directly, sums to 1); continuous RVs use a PDF (f(x) is a density, not a probability itself - only its area over a range is one, and total area is 1).

For continuous RVs, P(X = any single exact value) = 0 - not impossible, just zero probability.

E[X] is the long-run average (weighted sum or integral). Var(X) = E[X^2] - (E[X])^2, and SD is its square root.

E[aX+b] = aE[X]+b; Var(aX+b) = a^2 Var(X).`,
    shortNotes: {
      fiveMinute: "A random variable assigns a number to each outcome of an experiment. Discrete RVs have a PMF p(x)=P(X=x), which IS a probability directly and sums to 1. Continuous RVs have a PDF f(x), which is a density (can exceed 1, not itself a probability) - only the area under it over a range is a probability, and total area is 1. For continuous RVs, P(X = any exact value) = 0, always - not impossible, just zero probability, which is why continuous questions are always ranges. E[X] = weighted average (sum or integral); Var(X) = E[X^2] - (E[X])^2; SD = sqrt(Var). Linear transform: E[aX+b]=aE[X]+b, Var(aX+b)=a^2 Var(X).",
      oneMinute: "RV = number assigned to each outcome. Discrete -> PMF (probability directly, sums to 1). Continuous -> PDF (density, only area = probability, total area 1). P(X=exact value)=0 for continuous. E[X]=weighted average. Var(X)=E[X^2]-(E[X])^2. Var(aX+b)=a^2Var(X).",
      nightBefore: "PMF sums to 1 = probability. PDF integrates to 1 = density, not probability itself. Continuous P(X=c)=0 always. Var=E[X^2]-(E[X])^2.",
    },
    keyPoints: [
      "A random variable assigns a real number to every outcome of a random experiment - discrete (PMF) or continuous (PDF).",
      "A PMF value IS a probability directly; a PDF value is a density and is not itself a probability - only its integral over a range is.",
      "For any continuous random variable, P(X = one exact value) = 0, though the value itself is not impossible.",
      "E[X] is the long-run average; Var(X) = E[X^2] - (E[X])^2; standard deviation is its square root, in the original units.",
      "Linear transformations follow E[aX+b]=aE[X]+b and Var(aX+b)=a^2Var(X), avoiding a full recomputation.",
    ],
    mcqs: [
      {
        question: "For a continuous random variable X, what is P(X = 5), assuming 5 is within X's range?",
        options: ["It equals f(5)", "0", "1", "Cannot be determined without more information"],
        correctIndex: 1,
        explanation: "A single exact value has zero width under a density curve, so its probability is always 0 for a continuous random variable - regardless of how large f(5) itself is.",
      },
      {
        question: "Which of the following can be true of a probability DENSITY function f(x), but never of a probability MASS function p(x)?",
        options: [
          "It sums or integrates to 1",
          "It is non-negative everywhere",
          "A single value of it can exceed 1",
          "It is defined for a random variable",
        ],
        correctIndex: 2,
        explanation: "A PMF value is a probability directly, so it can never exceed 1. A PDF value is a density, not a probability itself, and CAN exceed 1 at a point - only the area under it over a range is bounded by 1.",
      },
      {
        question: "If E[X] = 4 and E[X^2] = 20, what is Var(X)?",
        options: ["16", "20", "4", "24"],
        correctIndex: 2,
        explanation: "Var(X) = E[X^2] - (E[X])^2 = 20 - 16 = 4.",
      },
    ],
    numericals: [
      {
        question: "A continuous random variable has PDF f(x) = 2x for 0 <= x <= 1. Find P(0.25 <= X <= 0.75).",
        answerMin: 0.5,
        answerMax: 0.5,
        unit: "",
        solution: `  P(0.25 <= X <= 0.75) = integral of 2x dx from 0.25 to 0.75
    = [x^2] from 0.25 to 0.75 = 0.5625 - 0.0625 = 0.5`,
      },
      {
        question: "X is the outcome of a fair six-sided die roll. Find E[X].",
        answerMin: 3.5,
        answerMax: 3.5,
        unit: "",
        solution: `  E[X] = sum of x * (1/6) for x = 1 to 6
       = (1+2+3+4+5+6)/6 = 21/6 = 3.5`,
      },
    ],
  },
};

