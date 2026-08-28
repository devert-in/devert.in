// GATE Algorithms - authored lesson content. Follows the authoring rules
// documented at the top of general-aptitude.mjs, and the C-only language
// note in programming-and-data-structures.mjs (pseudocode/C-style here too).
//
// "recurrence-solving-for-algorithms" (Master Theorem, T(n)=aT(n/b)+f(n)) is
// deliberately distinct from Engineering Mathematics' discrete-math
// "recurrence-relations" (characteristic-root method for constant-coefficient
// linear recurrences) - same word, two different tools, cross-referenced
// rather than merged, matching that topic's own note.

export const ALGORITHMS = {

  // ---------------- Complexity Analysis ----------------

  "asymptotic-notation": {
    difficulty: "Easy",
    estimatedMinutes: 25,
    whatYoullLearn: [
      "What Big-O, Big-Omega, and Big-Theta each actually bound, precisely",
      "Why constants and lower-order terms are dropped, and when that's actually valid",
      "How to compare growth rates of common functions without plugging in numbers",
      "The difference between an algorithm's worst-case bound and its TIGHT bound",
    ],
    prerequisites: [],
    concept: `## Three Different Promises About Growth

::: story
Asymptotic notation describes how an algorithm's running time grows as input size n grows LARGE - not the exact time for any specific n, but the SHAPE of growth. Big-O, Big-Omega, and Big-Theta each make a different kind of promise about that shape.
:::

::: cards The three notations, precisely
Big-O (O) :: UPPER bound. f(n) = O(g(n)) means f grows NO FASTER than g (up to a constant factor), for large enough n. "At most this fast."
Big-Omega (Omega) :: LOWER bound. f(n) = Omega(g(n)) means f grows AT LEAST as fast as g. "At least this fast."
Big-Theta (Theta) :: TIGHT bound. f(n) = Theta(g(n)) means f grows EXACTLY at g's rate - both O(g(n)) AND Omega(g(n)) hold simultaneously. "Exactly this fast, no looser."
:::

::: mistake
Using Big-O when Big-Theta is what's actually meant. Saying "this algorithm is O(n^2)" is technically true even for an algorithm that's actually O(n) (since a smaller bound is also a valid, just looser, upper bound) - Big-O alone doesn't claim the bound is TIGHT. GATE questions often specifically test this distinction.
:::

## Why Constants And Lower-Order Terms Vanish

::: remember
3n^2 + 5n + 100 is Theta(n^2) - the LEADING term dominates for large n, and constant multipliers don't change the growth SHAPE, only the steepness. This dropping is valid precisely BECAUSE asymptotic notation only cares about behaviour as n approaches infinity, not any specific small n where the dropped terms might matter more.
:::

## Comparing Growth Rates Without Plugging In Numbers

::: flow
Standard ordering (slowest to fastest growing) :: O(1) < O(log n) < O(sqrt(n)) < O(n) < O(n log n) < O(n^2) < O(n^3) < O(2^n) < O(n!).
Using the ratio test :: To compare f(n) and g(n), examine what happens to f(n)/g(n) as n -> infinity: if it goes to 0, f grows slower; if it goes to infinity, f grows faster; if it settles to a nonzero constant, they're the SAME order (Theta of each other).
:::

::: checkpoint
An algorithm's running time is described only as O(n^2). Can you conclude its running time is definitely NOT O(n)?
- ( ) Yes, O(n^2) rules out O(n)
- (x) No - O(n^2) alone doesn't rule out the algorithm ALSO being O(n) (or even faster)
- ( ) Only if n is large enough
- ( ) Cannot be determined
> Big-O is an upper bound, not necessarily tight. An algorithm that is actually O(n) is technically ALSO O(n^2) (a looser, still-valid upper bound) - concluding it's NOT O(n) requires a Big-Omega(n^2) lower bound too, i.e. a Theta(n^2) claim, not just O(n^2) alone.
:::`,
    keyPoints: [
      "Big-O: upper bound (\"at most this fast\"). Big-Omega: lower bound (\"at least this fast\"). Big-Theta: tight bound (both O and Omega hold - \"exactly this fast\").",
      "Big-O alone does not claim tightness - an O(n) algorithm is technically also O(n^2), a valid but looser bound.",
      "Constants and lower-order terms are dropped because asymptotic notation describes growth SHAPE as n -> infinity, where the leading term dominates.",
      "Standard growth order: O(1) < O(log n) < O(sqrt n) < O(n) < O(n log n) < O(n^2) < O(n^3) < O(2^n) < O(n!).",
    ],
    analogies: [
      "Big-O is like saying 'I'll arrive within an hour' (an upper bound - could be sooner), Big-Omega is 'I'll take at least 10 minutes' (a lower bound), and Big-Theta is 'I'll arrive in exactly 30-40 minutes' (both bounds pinned down tightly).",
    ],
    commonMistakes: [
      "Treating a Big-O claim as if it were automatically tight (i.e. as Theta) - a valid O(n^2) claim says nothing about whether a faster bound also holds.",
      "Failing to drop constants/lower-order terms when simplifying, or conversely, dropping them somewhere they're NOT valid to drop (e.g. when comparing two algorithms at a SPECIFIC small n, not asymptotically).",
      "Misordering the standard growth-rate list, especially confusing O(n log n) with O(n) or O(2^n) with O(n!) for large n.",
    ],
    memoryTricks: [
      "\"O for 'at mOst', Omega for 'at least' - remember O comes first alphabetically and in the 'ceiling' sense.\"",
      "Theta = O AND Omega together - the intersection, the tight squeeze.",
    ],
    formulas: [
      "f(n) = O(g(n)) if there exist constants c>0, n0 such that f(n) <= c*g(n) for all n >= n0.",
      "f(n) = Omega(g(n)) if there exist c>0, n0 such that f(n) >= c*g(n) for all n >= n0.",
      "f(n) = Theta(g(n)) iff f(n) = O(g(n)) AND f(n) = Omega(g(n)).",
    ],
    shortcuts: [
      "To quickly find an expression's asymptotic order, just identify the single fastest-growing term and drop everything else, including its own constant coefficient.",
      "When a question gives multiple Big-O options and asks for the 'best'/'tightest' description, favour the smallest option that is still a VALID upper bound - the tightest correct answer, not just any correct one.",
    ],
    pyqRelevance: `Asymptotic notation is foundational and appears both as direct definition-based questions (which notation is correct for a given claim) and threaded through nearly every other Algorithms question via the complexity given in the problem statement - a reliable early, fast mark.`,
    interviewConnection: `Correctly distinguishing "O(n) means at most linear" from "Theta(n) means exactly linear" is exactly the vocabulary used when discussing an algorithm's efficiency in any technical interview - imprecise use of Big-O when Theta is meant is a common (and easily corrected) interview red flag.`,
    revisionSummary: `Big-O: upper bound. Big-Omega: lower bound. Big-Theta: tight bound (both). O(n) is technically also O(n^2) - O alone isn't tight.

Constants/lower-order terms drop because only growth SHAPE as n->infinity matters.

Standard order: O(1)<O(log n)<O(sqrt n)<O(n)<O(n log n)<O(n^2)<O(n^3)<O(2^n)<O(n!).`,
    shortNotes: {
      oneMinute: "O=upper bound, Omega=lower bound, Theta=tight (both). O(n) is also technically O(n^2) - O isn't automatically tight. Drop constants/lower terms (only shape as n->infinity matters). Order: O(1)<log n<sqrt n<n<n log n<n^2<n^3<2^n<n!.",
    },
    mcqs: [
      {
        question: "Which notation correctly claims BOTH an upper and lower bound on a function's growth simultaneously?",
        options: ["Big-O", "Big-Omega", "Big-Theta", "None of these"],
        correctIndex: 2,
        explanation: "Big-Theta requires both Big-O (upper bound) and Big-Omega (lower bound) to hold simultaneously - it's the only one of the three that pins growth down tightly in both directions.",
      },
    ],
    numericals: [],
  },

  "worst-case-time-and-space-complexity": {
    difficulty: "Easy",
    estimatedMinutes: 25,
    whatYoullLearn: [
      "The difference between best, average, and worst-case complexity, and which one Big-O typically describes",
      "Space complexity, and why it must include auxiliary space, not just the input's own size",
      "Why worst-case is the default GATE cares about unless a question explicitly asks otherwise",
      "In-place algorithms and what 'O(1) auxiliary space' actually requires",
    ],
    prerequisites: ["Asymptotic Notation"],
    concept: `## Best, Average, Worst: Three Different Questions

::: cards
Best case :: The MINIMUM time an algorithm could take, over all inputs of size n - often not representative (e.g. searching where the very first element happens to be the target).
Average case :: The EXPECTED time, averaged over some assumed distribution of inputs - useful but depends entirely on that distribution assumption being realistic.
Worst case :: The MAXIMUM time over all possible inputs of size n - a guaranteed upper limit, regardless of how "unlucky" the input is.
:::

::: remember
GATE (and competitive analysis generally) defaults to WORST CASE unless a question explicitly says otherwise - it's the only one of the three that gives a hard GUARANTEE, independent of any assumption about typical input.
:::

## Space Complexity: Auxiliary, Not Just Input

::: story
Space complexity measures the TOTAL extra memory an algorithm uses as a function of input size n - crucially, this means AUXILIARY space (extra space used beyond the input itself), not the space the input occupies to begin with (which every algorithm needs regardless of how clever it is).
:::

::: mistake
Counting the input array's own space as part of an algorithm's space complexity. An in-place sorting algorithm operating on an n-element array still has an O(n) INPUT, but is described as O(1) SPACE COMPLEXITY because it uses no significant EXTRA memory beyond that input - space complexity is specifically about the auxiliary usage.
:::

::: flow
In-place algorithm :: Uses O(1) (or sometimes O(log n), for recursive in-place algorithms counting stack space) auxiliary space - modifies the input directly rather than building a separate structure.
Not in-place :: Uses additional space proportional to input size or more - e.g. merge sort's O(n) auxiliary array for merging.
Recursive space cost :: Don't forget the CALL STACK itself counts as auxiliary space - a recursive algorithm with depth d uses at least O(d) space just for stack frames, even if it allocates nothing else explicitly.
:::

::: checkpoint
An in-place iterative sorting algorithm sorts an array of n elements using only a few extra variables. What is its space complexity?
- ( ) O(n)
- (x) O(1)
- ( ) O(log n)
- ( ) O(n^2)
> "In-place" with only a few extra variables (not scaling with n) means O(1) AUXILIARY space complexity - the input array itself (O(n)) is not counted as part of the algorithm's space complexity.
:::`,
    keyPoints: [
      "Best case: minimum time. Average case: expected time under an input distribution. Worst case: maximum time - the default GATE assumes unless stated otherwise, since it's a guaranteed bound.",
      "Space complexity measures AUXILIARY (extra) space, not the input's own space - an in-place algorithm can be O(1) space despite operating on an O(n) input.",
      "Recursive algorithms' call stack itself counts as auxiliary space - depth d of recursion contributes at least O(d) space.",
    ],
    analogies: [
      "Worst-case analysis is like a bridge's rated weight limit: it's not the AVERAGE load, it's the maximum load the bridge is GUARANTEED to handle safely, regardless of what actually crosses it on a typical day.",
    ],
    commonMistakes: [
      "Reporting average-case complexity when a question (without qualification) is actually asking for the standard worst-case default.",
      "Including the input's own O(n) storage as part of an algorithm's space complexity, inflating an actually-O(1)-auxiliary in-place algorithm's reported complexity.",
      "Forgetting that recursive call-stack depth contributes to space complexity - a recursive algorithm that looks like it uses no extra data structures can still have significant space cost from stack frames alone.",
    ],
    memoryTricks: [
      "\"No qualifier stated -> assume worst case.\" GATE's silent default.",
      "\"In-place = O(1) EXTRA, not O(1) total.\" The input's own size never disappears from the accounting, it's just not counted.",
    ],
    formulas: [],
    shortcuts: [
      "Unless a question explicitly says 'average case' or 'best case', default your answer to worst-case complexity without needing to be told.",
      "For any recursive algorithm's space complexity question, explicitly add the recursion depth's stack-space contribution rather than only counting explicitly-allocated data structures.",
    ],
    pyqRelevance: `Worst/average/best-case distinction and space-complexity questions (especially the "does this count as in-place?" and "does the call stack count?" traps) are frequent 1-mark conceptual questions, often embedded within a larger sorting or searching algorithm question rather than standalone.`,
    interviewConnection: `Correctly reasoning about auxiliary space (not conflating it with input size) and worst-case guarantees is exactly the vocabulary used when comparing algorithm trade-offs in a system-design or algorithm-choice interview discussion.`,
    revisionSummary: `Best/average/worst case measure different things; worst case is the default guarantee GATE assumes unless told otherwise.

Space complexity = auxiliary (extra) space, not input size. In-place algorithms are O(1) auxiliary space despite an O(n) input. Recursive call-stack depth counts as space too.`,
    shortNotes: {
      oneMinute: "Best=min, average=expected (distribution-dependent), worst=max (default guarantee). Space complexity = auxiliary/extra space, NOT input size. In-place = O(1) extra space. Recursion's call-stack depth counts as space complexity too.",
    },
    mcqs: [
      {
        question: "Without any other qualification, which case does a GATE question's stated complexity default to?",
        options: ["Best case", "Average case", "Worst case", "It varies randomly"],
        correctIndex: 2,
        explanation: "Worst case is the standard default when no qualifier is given - it's the only one of the three that provides a guarantee independent of any assumption about typical input.",
      },
    ],
    numericals: [],
  },

  "recurrence-solving-for-algorithms": {
    difficulty: "Moderate",
    estimatedMinutes: 30,
    whatYoullLearn: [
      "The Master Theorem, and the three cases that classify a divide-and-conquer recurrence's solution",
      "How to identify a, b, and f(n) from a recurrence and apply the theorem correctly",
      "Solving simple recurrences by the recursion tree / substitution method when the Master Theorem doesn't directly apply",
      "Why this method is distinct from Engineering Mathematics' recurrence-relations topic",
    ],
    prerequisites: ["Asymptotic Notation"],
    concept: `## A Different Kind Of Recurrence

::: story
A divide-and-conquer algorithm's running time is naturally described by a recurrence like T(n) = a*T(n/b) + f(n): the problem of size n is split into a subproblems of size n/b each, plus f(n) extra work to combine them. This is a DIFFERENT shape of recurrence from Engineering Mathematics' constant-coefficient linear recurrences (a_n = c1 a_(n-1) + ...) - here, the problem size itself SHRINKS BY DIVISION, not by subtracting a constant, and the tool for solving it is the Master Theorem, not the characteristic-equation method.
:::

::: remember
T(n) = a T(n/b) + f(n): a is the NUMBER of subproblems per call, n/b is EACH subproblem's size, f(n) is the extra work done OUTSIDE the recursive calls (splitting + combining). Getting a, b, f(n) correctly identified from a given recurrence is the first and most error-prone step.
:::

## The Master Theorem's Three Cases

::: cards Compare f(n) against n^(log_b(a))
Case 1 - f(n) grows SLOWER :: If f(n) = O(n^(log_b(a) - eps)) for some eps>0, then T(n) = Theta(n^(log_b(a))) - the RECURSIVE splitting dominates, the combine work barely matters.
Case 2 - f(n) grows at the SAME rate :: If f(n) = Theta(n^(log_b(a))), then T(n) = Theta(n^(log_b(a)) * log n) - an extra log factor appears exactly because the two contributions are balanced.
Case 3 - f(n) grows FASTER :: If f(n) = Omega(n^(log_b(a) + eps)) for some eps>0, AND a regularity condition holds, then T(n) = Theta(f(n)) - the COMBINE work dominates, the recursive splitting barely matters.
:::

::: mistake
Misidentifying a, b, or f(n) from the recurrence - especially confusing "a" (number of subproblems) with "b" (the size divisor), which are easy to swap when reading quickly. Also common: forgetting to actually compare f(n) against n^(log_b(a)) and instead just guessing which case applies.
:::

## Worked Example: Merge Sort's Recurrence

::: flow
1. Identify the recurrence :: Merge sort: T(n) = 2T(n/2) + O(n) - splits into 2 subproblems, each half the size, plus O(n) work to merge.
2. Identify a, b, f(n) :: a=2, b=2, f(n)=n (using Theta(n) for the O(n) merge step).
3. Compute n^(log_b(a)) :: log_2(2) = 1, so n^(log_b(a)) = n^1 = n.
4. Compare f(n)=n against n^(log_b(a))=n :: They're the SAME rate (Theta(n) = Theta(n)) - this is CASE 2.
5. Apply case 2 :: T(n) = Theta(n^(log_b(a)) * log n) = Theta(n * log n) - matching merge sort's well-known O(n log n) complexity.
:::

::: checkpoint
For T(n) = 4T(n/2) + n, which Master Theorem case applies?
- (x) Case 1 - the recursive splitting dominates
- ( ) Case 2 - balanced
- ( ) Case 3 - the combine work dominates
- ( ) The Master Theorem doesn't apply here
> a=4, b=2: n^(log_b(a)) = n^(log_2(4)) = n^2. Compare f(n)=n against n^2: n grows SLOWER than n^2 (n = O(n^(2-eps)) for eps=1), so this is Case 1. T(n) = Theta(n^2).
:::`,
    keyPoints: [
      "T(n) = a T(n/b) + f(n): a = number of subproblems, b = size-shrink factor, f(n) = work outside the recursive calls.",
      "Compare f(n) against n^(log_b(a)): slower (Case 1) gives Theta(n^(log_b(a))); same rate (Case 2) gives Theta(n^(log_b(a)) log n); faster (Case 3, with regularity) gives Theta(f(n)).",
      "This is a distinct tool from Engineering Mathematics' recurrence-relations (characteristic-root method) - Master Theorem applies specifically to DIVISION-shrinking recurrences from divide-and-conquer algorithms.",
      "Merge sort's T(n)=2T(n/2)+O(n) is the canonical Case 2 example, giving the well-known Theta(n log n).",
    ],
    analogies: [
      "The Master Theorem is a referee deciding which of two competing forces wins a recurrence's growth rate: the SPLITTING work (how the recursion branches) versus the COMBINING work (f(n)) - whichever grows faster determines the overall answer, and a tie produces the extra log-factor 'overtime'.",
    ],
    commonMistakes: [
      "Swapping a and b when reading the recurrence, especially under time pressure.",
      "Forgetting to actually compute and compare n^(log_b(a)) against f(n), guessing the case instead.",
      "Applying the Master Theorem to a recurrence that isn't actually in the T(n)=aT(n/b)+f(n) form (e.g. a recurrence with a subtractive shrink like T(n-1), which belongs to the discrete-math recurrence-relations toolkit instead).",
    ],
    memoryTricks: [
      "\"Compare f(n) to n^(log_b a): loses -> case 1, ties -> case 2 (add a log), wins -> case 3.\" The whole theorem in one line.",
      "a = how many pieces. b = how much smaller each piece is. f(n) = the glue holding the pieces back together.",
    ],
    formulas: [
      "T(n) = a T(n/b) + f(n), critical exponent n^(log_b(a)).",
      "Case 1: f(n)=O(n^(log_b(a)-eps)) => T(n)=Theta(n^(log_b(a))).",
      "Case 2: f(n)=Theta(n^(log_b(a))) => T(n)=Theta(n^(log_b(a)) log n).",
      "Case 3: f(n)=Omega(n^(log_b(a)+eps)), regularity holds => T(n)=Theta(f(n)).",
    ],
    shortcuts: [
      "Memorise merge sort's T(n)=2T(n/2)+O(n) -> Theta(n log n) as a reference point - many GATE recurrences are small variations of this exact shape, and recognising the pattern is faster than recomputing from scratch each time.",
      "Compute log_b(a) as a plain number first (e.g. log_2(4)=2) before comparing anything - working with n^(log_b a) symbolically invites avoidable errors.",
    ],
    pyqRelevance: `Master Theorem application is a near-guaranteed 1-2 mark GATE question most years, either as a direct "solve this recurrence" numerical or embedded in a divide-and-conquer algorithm's complexity analysis - correctly identifying a, b, f(n) and doing the comparison is the entire skill being tested.`,
    interviewConnection: `The Master Theorem is the standard tool for justifying why merge sort is O(n log n), why binary search is O(log n) (T(n)=T(n/2)+O(1)), and for analysing any new divide-and-conquer algorithm proposed in an algorithm-design interview.`,
    revisionSummary: `T(n)=aT(n/b)+f(n): compare f(n) to n^(log_b a). Slower: Theta(n^(log_b a)). Same: Theta(n^(log_b a) log n). Faster (+regularity): Theta(f(n)).

Distinct from discrete math's characteristic-root recurrence method - Master Theorem is for division-shrinking divide-and-conquer recurrences specifically.

Merge sort (T(n)=2T(n/2)+O(n)) is the canonical Case 2 example: Theta(n log n).`,
    shortNotes: {
      oneMinute: "T(n)=aT(n/b)+f(n). Compare f(n) vs n^(log_b a): slower->Theta(n^(log_b a)); same->Theta(n^(log_b a) log n); faster(+regularity)->Theta(f(n)). Merge sort: 2T(n/2)+O(n), case 2, Theta(n log n). Distinct tool from discrete-math recurrence-relations.",
    },
    mcqs: [
      {
        question: "For T(n) = T(n/2) + 1 (binary search's recurrence), what is T(n)?",
        options: ["Theta(n)", "Theta(log n)", "Theta(n log n)", "Theta(1)"],
        correctIndex: 1,
        explanation: "a=1, b=2, f(n)=1 (constant). n^(log_b a) = n^(log_2 1) = n^0 = 1. f(n)=1 is Theta(1) = Theta(n^0), matching the critical exponent exactly - Case 2 applies: T(n) = Theta(n^0 log n) = Theta(log n).",
      },
    ],
    numericals: [
      {
        question: "For T(n) = 8T(n/2) + n^2, using the Master Theorem, what is the exponent of n in T(n)'s Theta bound? (i.e. if T(n)=Theta(n^k), find k)",
        answerMin: 3,
        answerMax: 3,
        unit: "",
        solution: `a=8, b=2: n^(log_b a) = n^(log_2 8) = n^3.
Compare f(n)=n^2 against n^3: n^2 grows SLOWER than n^3, so Case 1 applies.
T(n) = Theta(n^(log_b a)) = Theta(n^3). So k=3.`,
      },
    ],
  },

  // ---------------- Searching, Sorting and Hashing ----------------

  "searching": {
    difficulty: "Easy",
    estimatedMinutes: 25,
    whatYoullLearn: [
      "Linear search vs binary search, and the ONE precondition binary search absolutely requires",
      "Why binary search is O(log n), derived from how fast it halves the search space",
      "Variants: finding the first/last occurrence of a duplicate value, and searching a rotated sorted array",
      "Interpolation search, and when it beats plain binary search",
    ],
    prerequisites: ["Asymptotic Notation", "Arrays"],
    concept: `## Linear Search: No Assumptions Needed, No Speed Gained

::: remember
Linear search checks every element in order until it finds the target (or exhausts the array) - O(n) worst case, but it works on ANY array, sorted or not. It's the fallback whenever binary search's one precondition isn't met.
:::

## Binary Search: Trading A Precondition For Speed

::: story
Binary search repeatedly checks the MIDDLE element and discards HALF the remaining search space based on whether the target is smaller or larger - but this only works because the array is SORTED. On an unsorted array, "the target is smaller than the middle" tells you nothing about which half it's in.
:::

::: mistake
Applying binary search to an unsorted array. This is the single most common binary-search error - the algorithm's entire correctness depends on the sortedness precondition, and it will silently produce a WRONG answer (not even necessarily crash) on unsorted input.
:::

::: flow
Each comparison halves the space :: Starting from n elements, one comparison discards half of them, leaving at most n/2 candidates.
After k halvings :: At most n/2^k candidates remain. Solving n/2^k = 1 gives k = log2(n) - so at most log2(n) comparisons are ever needed.
:::

## Common Variants

::: cards
First/last occurrence of a duplicate :: A modified binary search that, upon finding a match, keeps searching the LEFT (for first) or RIGHT (for last) half instead of stopping immediately - still O(log n).
Rotated sorted array search :: At each step, determine which HALF is still properly sorted (one half always is, even after rotation), check if the target lies in that sorted half's range, and recurse into the correct half - still O(log n) despite the rotation.
Interpolation search :: Instead of always checking the exact middle, ESTIMATE the target's likely position based on its value relative to the range's endpoints (like flipping to an estimated page in a phone book by name, not always the middle page) - O(log log n) average case on UNIFORMLY DISTRIBUTED sorted data, but O(n) worst case on badly-distributed data.
:::

::: checkpoint
Binary search is run on an array of 1024 sorted elements. What is the maximum number of comparisons needed in the worst case?
- ( ) 1024
- ( ) 512
- (x) 10
- ( ) 100
> Maximum comparisons = log2(n) = log2(1024) = 10 (since 2^10 = 1024).
:::`,
    codeExample: {
      language: "c",
      code: `#include <stdio.h>

int binarySearch(int arr[], int n, int target) {
    int lo = 0, hi = n - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;   /* avoids overflow vs (lo+hi)/2 */
        if (arr[mid] == target) return mid;
        else if (arr[mid] < target) lo = mid + 1;
        else hi = mid - 1;
    }
    return -1;   /* not found */
}

int main(void) {
    int arr[] = {2, 5, 8, 12, 16, 23, 38, 45};
    printf("%d\\n", binarySearch(arr, 8, 23));   /* index 5 */
    printf("%d\\n", binarySearch(arr, 8, 99));   /* -1: not found */
    return 0;
}`,
      expectedOutput: `5
-1`,
    },
    keyPoints: [
      "Linear search: O(n), works on any array, sorted or not. Binary search: O(log n), REQUIRES a sorted array.",
      "Binary search's O(log n) comes directly from halving the search space each comparison - log2(n) halvings reduce n elements to 1.",
      "Finding first/last occurrence of a duplicate: modify binary search to keep searching the appropriate half after a match, instead of stopping immediately.",
      "Rotated sorted array search: one half is always properly sorted at each step; check if the target's range falls in that half, recurse accordingly - still O(log n).",
      "Interpolation search: O(log log n) average on uniformly distributed data, but O(n) worst case - not a strict upgrade over binary search in all cases.",
    ],
    analogies: [
      "Binary search is looking up a name in a phone book: you don't start at page 1, you open to roughly the middle and immediately discard the half that can't contain your target - repeating that discards is exactly what makes it fast, but only WORKS because the book is alphabetically sorted.",
    ],
    commonMistakes: [
      "Applying binary search to unsorted data, producing a silently wrong (not crashing) result.",
      "Using (lo+hi)/2 instead of lo+(hi-lo)/2 for the midpoint, risking integer overflow on very large indices (a subtle but real correctness issue).",
      "Stopping immediately at the first match when the question actually asks for the FIRST or LAST occurrence among duplicates.",
      "Assuming interpolation search is unconditionally better than binary search - its O(log log n) average case depends on roughly uniform data distribution; badly skewed data degrades it to O(n).",
    ],
    memoryTricks: [
      "\"Binary search needs sorted data - no exceptions.\" The one precondition that decides whether it's even legal to use.",
      "Each comparison in binary search HALVES the remaining space - n, n/2, n/4, ... down to 1, in log2(n) steps.",
    ],
    formulas: [
      "Binary search worst case: ceil(log2(n+1)) comparisons, commonly stated as O(log n).",
      "Interpolation search: O(log log n) average (uniform data), O(n) worst case.",
    ],
    shortcuts: [
      "For a 'how many comparisons does binary search need for n elements' numerical, just find the smallest k such that 2^k >= n - no need to trace through the actual search.",
      "Before applying binary search to any array in a GATE question, explicitly verify (or note the assumption) that it's sorted - this single check prevents the most common binary-search trap question.",
    ],
    pyqRelevance: `Binary search complexity numericals (comparisons for a given n) and rotated/duplicate-array variant questions are frequent, reliable marks - along with occasional interpolation-search conceptual questions comparing it against plain binary search.`,
    interviewConnection: `Binary search and its variants (first/last occurrence, rotated array search, "search in infinite array") are among the most frequently asked coding interview questions, precisely because correctly handling the loop invariant and midpoint edge cases is a genuinely common source of real bugs.`,
    revisionSummary: `Linear search: O(n), any array. Binary search: O(log n), REQUIRES sorted data - halving the search space each comparison.

Variants: first/last occurrence (modified stopping condition), rotated array (identify the sorted half, recurse into it), interpolation search (O(log log n) average, O(n) worst case, data-distribution dependent).`,
    shortNotes: {
      oneMinute: "Linear: O(n), any array. Binary: O(log n), needs sorted data, halves search space each step. First/last occurrence: keep searching correct half after a match. Rotated array: one half is always sorted, recurse into the correct one. Interpolation: O(log log n) avg (uniform data), O(n) worst.",
    },
    mcqs: [
      {
        question: "What is the essential precondition for binary search to work correctly?",
        options: ["The array must have no duplicates", "The array must be sorted", "The array size must be a power of 2", "The array must contain only positive integers"],
        correctIndex: 1,
        explanation: "Binary search's correctness depends entirely on the array being sorted - without that, discarding half the search space based on a comparison to the middle is not a valid deduction.",
      },
    ],
    numericals: [
      {
        question: "For a sorted array of 500 elements, what is the maximum number of comparisons binary search needs (round up)?",
        answerMin: 9,
        answerMax: 9,
        unit: "",
        solution: `Find smallest k with 2^k >= 500. 2^8=256 (too small), 2^9=512 (>=500). So k=9 comparisons in the worst case.`,
      },
    ],
  },

  "sorting": {
    difficulty: "Moderate",
    estimatedMinutes: 35,
    whatYoullLearn: [
      "The time/space complexity and stability of every major comparison-based sort",
      "Why comparison-based sorting has an Omega(n log n) LOWER bound, and which sorts actually meet it",
      "Non-comparison sorts (counting, radix) and how they beat the n log n bound legally",
      "Choosing the right sort for a given scenario: stability, in-place, worst-case guarantees",
    ],
    prerequisites: ["Arrays", "Recurrence Solving for Algorithms"],
    concept: `## The Comparison-Based Sorting Landscape

::: cards Complexity and stability, memorise this table cold
Bubble / Insertion / Selection Sort :: O(n^2) worst and average case. Insertion sort is O(n) BEST case (already-sorted input) - the only one of these three with a better-than-quadratic best case. Bubble and Insertion are STABLE; Selection is NOT stable.
Merge Sort :: O(n log n) in ALL cases (worst, average, best) - guaranteed, no bad-input case exists. STABLE. Requires O(n) auxiliary space - NOT in-place.
Quick Sort :: O(n log n) AVERAGE case, but O(n^2) WORST case (already-sorted or adversarially-chosen pivot). NOT stable (in the standard in-place partitioning version). In-place: O(log n) auxiliary space (recursion stack only).
Heap Sort :: O(n log n) in ALL cases, guaranteed. NOT stable. In-place: O(1) auxiliary space - the only O(n log n)-guaranteed sort that's ALSO in-place.
:::

::: remember
STABLE means equal-valued elements keep their original relative order after sorting. This matters whenever sorting by one key needs to preserve an earlier sort's order for ties on that key (e.g. sorting by last name, then needing first-name order preserved among same-last-name entries from an earlier pass).
:::

## The Omega(n log n) Lower Bound - And How To Legally Beat It

::: story
Any COMPARISON-BASED sort (one that only learns information by comparing pairs of elements) cannot do better than Omega(n log n) in the worst case - this is a proven information-theoretic limit, not just "nobody's found a faster one yet." Merge sort and Heap sort actually ACHIEVE this bound.
:::

::: flow
Why the bound exists :: There are n! possible orderings of n elements. Each comparison gives at most 1 bit of information (which of two elements is larger), so distinguishing between n! possibilities needs at least log2(n!) comparisons, which is Theta(n log n) by Stirling's approximation.
Beating it legally :: Counting sort and Radix sort are NOT comparison-based - they use the actual VALUES of elements (as array indices, or digit-by-digit) instead of comparing pairs, so the n log n lower bound simply doesn't apply to them. Counting sort: O(n+k) for k = range of values. Radix sort: O(d(n+k)) for d digits, base-k representation.
:::

::: mistake
Assuming EVERY sorting algorithm is bound by Omega(n log n). That bound applies specifically to COMPARISON-based sorts - counting sort and radix sort sidestep it entirely by not comparing elements pairwise at all, achieving linear time under the right conditions (small value range for counting sort).
:::

::: checkpoint
Quick sort is chosen to sort an ALREADY-SORTED array, using the standard "always pick the last element as pivot" strategy. What is the resulting time complexity?
- ( ) O(n log n) - quick sort is always this fast
- (x) O(n^2) - the worst case, triggered by this specific input/pivot combination
- ( ) O(n) - sorted input is the best case
- ( ) O(log n)
> Picking the last element as pivot on ALREADY-SORTED input creates maximally unbalanced partitions every time (one side empty, one side n-1) - exactly quick sort's O(n^2) worst case, a classic GATE trap since "already sorted" sounds like it should be easy.
:::`,
    keyPoints: [
      "Bubble/Insertion/Selection: O(n^2) worst/average. Insertion is O(n) best case. Bubble and Insertion are stable; Selection is not.",
      "Merge sort: O(n log n) ALWAYS (all cases), stable, but O(n) auxiliary space (not in-place).",
      "Quick sort: O(n log n) average, O(n^2) worst case (bad pivot choice, e.g. sorted input with last-element pivot), not stable, O(log n) auxiliary space.",
      "Heap sort: O(n log n) ALWAYS, not stable, O(1) auxiliary space - the only sort here that's both guaranteed n log n AND in-place.",
      "Omega(n log n) is a proven lower bound for COMPARISON-based sorts only. Counting sort O(n+k) and Radix sort O(d(n+k)) beat it legally by not comparing elements.",
    ],
    analogies: [
      "Comparison sorting is like sorting a hand of cards by only ever asking 'which of these two is bigger?' - no matter how cleverly you ask, you need enough yes/no answers to distinguish all n! possible orderings, which is exactly where the n log n floor comes from.",
    ],
    commonMistakes: [
      "Assuming quick sort is always O(n log n) - its worst case is O(n^2), specifically triggered by consistently unbalanced pivot choices (like already-sorted input with a naive last-element pivot).",
      "Assuming all O(n log n) sorts are in-place, or that all in-place sorts are O(n log n) - heap sort is the one that's genuinely both; quick sort is in-place but not worst-case-guaranteed n log n; merge sort is guaranteed n log n but not in-place.",
      "Applying the Omega(n log n) lower bound to counting/radix sort, which aren't comparison-based and legitimately beat it under the right conditions.",
      "Forgetting selection sort is NOT stable, unlike bubble and insertion sort which both are.",
    ],
    memoryTricks: [
      "\"Merge is safe but needs space (O(n) aux). Heap is safe AND stingy (O(1) aux). Quick is stingy but risky (O(n^2) worst).\" Three trade-offs, one sentence each.",
      "Only comparison-based sorts are bound by n log n - counting/radix sort read VALUES, not just comparisons, so the bound doesn't apply.",
    ],
    formulas: [
      "Comparison sort lower bound: Omega(n log n) (from log2(n!) = Theta(n log n)).",
      "Counting sort: O(n + k), k = value range. Radix sort: O(d(n + k)), d = number of digits.",
    ],
    shortcuts: [
      "Memorise the complexity/stability/space table as a 4x3 grid (4 sorts x {time, stability, space}) rather than trying to re-derive any entry - this is pure recall under GATE's time pressure, not something to reason out fresh.",
      "If a question describes a specific 'bad' input for quick sort (sorted, reverse-sorted, all-equal with a naive pivot rule), immediately expect O(n^2), not the average-case O(n log n).",
    ],
    pyqRelevance: `Sorting complexity/stability recall and quick-sort-worst-case-input questions are extremely high-frequency on GATE - among the most reliable topics to have memorised cold, since the questions rarely require derivation, just correct recall of the table above.`,
    interviewConnection: `Choosing the right sort (stability requirements, in-place constraints, worst-case guarantees needed) is a standard system-design and algorithm-choice interview discussion - and quick sort's worst-case vulnerability to adversarial/sorted input is exactly why production sort implementations often use randomized or median-of-three pivot selection.`,
    revisionSummary: `Bubble/Insertion/Selection: O(n^2), Insertion O(n) best case, Bubble/Insertion stable.

Merge sort: O(n log n) always, stable, O(n) aux space. Quick sort: O(n log n) avg / O(n^2) worst (bad pivot), not stable, O(log n) aux. Heap sort: O(n log n) always, not stable, O(1) aux.

Omega(n log n) bounds comparison sorts only - counting sort O(n+k) and radix sort O(d(n+k)) beat it legally.`,
    shortNotes: {
      oneMinute: "Bubble/Insertion/Selection: O(n^2) (Insertion O(n) best), Bubble/Insertion stable. Merge: O(n log n) always, stable, O(n) aux. Quick: O(n log n) avg/O(n^2) worst, not stable, O(log n) aux. Heap: O(n log n) always, not stable, O(1) aux. Comparison-sort floor: Omega(n log n); counting/radix beat it (not comparison-based).",
    },
    mcqs: [
      {
        question: "Which sorting algorithm guarantees O(n log n) time in ALL cases AND is in-place (O(1) auxiliary space)?",
        options: ["Merge sort", "Quick sort", "Heap sort", "Insertion sort"],
        correctIndex: 2,
        explanation: "Heap sort is O(n log n) in every case (no bad-input worst case like quick sort) and uses only O(1) auxiliary space, unlike merge sort's O(n) auxiliary array requirement.",
      },
      {
        question: "Which of these sorting algorithms is NOT stable?",
        options: ["Bubble sort", "Insertion sort", "Merge sort", "Selection sort"],
        correctIndex: 3,
        explanation: "Selection sort's repeated swap-with-minimum approach can reorder equal-valued elements relative to each other - it is not stable, unlike bubble, insertion, and merge sort.",
      },
    ],
    numericals: [],
  },

  "hashing": {
    difficulty: "Moderate",
    estimatedMinutes: 30,
    whatYoullLearn: [
      "What a hash function does, and the properties a good one needs",
      "Collision resolution: chaining vs open addressing, and open addressing's three probing strategies",
      "Load factor and why it directly controls expected operation cost",
      "Why hashing gives O(1) AVERAGE case but not a worst-case guarantee",
    ],
    prerequisites: ["Arrays", "Linked Lists"],
    concept: `## Mapping Keys To Array Slots Directly

::: story
Hashing maps a key directly to an array index via a HASH FUNCTION h(key), aiming for average O(1) insert/search/delete - dramatically faster than a BST's O(log n) or a linked list's O(n), at the cost of losing any ordering information (no "give me the sorted sequence" operation is possible).
:::

::: remember
No hash function can be perfectly collision-free for an arbitrary key universe mapped into a finite table (by the pigeonhole principle, once there are more possible keys than table slots) - COLLISIONS (two different keys hashing to the same slot) are a certainty to plan for, not an implementation bug to eliminate.
:::

## Two Families Of Collision Resolution

::: cards
Chaining :: Each table slot holds a LINKED LIST of all keys that hashed there. Simple, handles any load factor gracefully, but has pointer-memory overhead per entry.
Open addressing :: All entries stored directly IN the table itself (no separate lists) - on a collision, PROBE for the next open slot using a defined sequence. Requires the table to always have empty slots (load factor < 1 always).
:::

::: flow Open addressing's three probing strategies
Linear probing :: Try slot (h(key)+i) mod tableSize for i=0,1,2,... Simple, but suffers from PRIMARY CLUSTERING - consecutive occupied slots grow into large blocks that are increasingly likely to be probed into.
Quadratic probing :: Try (h(key) + i^2) mod tableSize. Reduces clustering compared to linear, but can still fail to find an open slot even when one exists (depending on table size), and has its own milder SECONDARY clustering.
Double hashing :: Try (h1(key) + i*h2(key)) mod tableSize, using a SECOND hash function to determine the probe step size. Best collision-spreading of the three, since the probe sequence itself varies by key, not just by a fixed offset pattern.
:::

::: mistake
Letting a hash table's load factor grow too close to (or past) 1 for open addressing specifically - unlike chaining (which degrades gracefully), open addressing REQUIRES free slots to probe into, and performance craters as the table fills up, with insertion potentially failing entirely at load factor 1.
:::

## Load Factor: The Number That Predicts Everything

::: remember
Load factor alpha = (number of entries) / (table size). For chaining, expected search cost is Theta(1 + alpha) - directly proportional to how "full" the table is. This is exactly why hash tables are resized (rehashed to a larger table) once alpha crosses a threshold (commonly around 0.7-0.75), keeping operations close to O(1).
:::

::: checkpoint
A hash table using open addressing has 8 slots, currently holding 8 entries (load factor = 1). What happens on the next insertion attempt?
- (x) Insertion fails - there is no empty slot left to probe into
- ( ) It succeeds by overwriting an existing entry
- ( ) It automatically switches to chaining
- ( ) It succeeds in O(1) time as normal
> Open addressing requires an empty slot to place a new entry - at load factor 1 (table completely full), no empty slot exists anywhere for any probe sequence to find, so insertion fails until the table is resized/rehashed.
:::`,
    keyPoints: [
      "Hashing gives average O(1) insert/search/delete by mapping keys directly to table indices - at the cost of no ordering support.",
      "Collisions are mathematically guaranteed for a finite table (pigeonhole principle), not a bug - collision resolution is a required design piece, not optional.",
      "Chaining: each slot holds a linked list, degrades gracefully at high load factor. Open addressing: all entries in-table, probes on collision, requires load factor strictly less than 1.",
      "Linear probing suffers primary clustering; quadratic probing reduces but doesn't eliminate clustering; double hashing spreads best by varying the probe step per key.",
      "Load factor alpha = entries/table size directly predicts expected cost (Theta(1+alpha) for chaining) - hash tables are resized once alpha crosses a threshold to keep operations near O(1).",
    ],
    analogies: [
      "A hash table is a filing system that computes exactly which drawer a document belongs in from its label, instead of searching drawer by drawer - collisions are simply two documents whose labels compute to the same drawer, requiring an agreed-upon rule for where the second one actually goes.",
    ],
    commonMistakes: [
      "Believing a 'good enough' hash function can eliminate collisions entirely for an arbitrary key universe - impossible by the pigeonhole principle once more keys than slots exist.",
      "Letting an open-addressing table's load factor approach 1 without resizing, causing severe performance degradation or outright insertion failure.",
      "Assuming hashing gives a WORST-CASE O(1) guarantee - it's an AVERAGE-case bound; a poor hash function or adversarial input can still degrade any hash table to O(n) worst case (all keys colliding into one slot/chain).",
      "Confusing linear probing's fixed-offset clustering with double hashing's per-key-varying probe sequence - these have meaningfully different clustering behaviour.",
    ],
    memoryTricks: [
      "\"Chaining degrades gracefully; open addressing needs breathing room.\" The core operational difference between the two families.",
      "Load factor alpha directly sets expected cost: bigger alpha, slower average operations - resize before it gets too close to 1 (open addressing) or too large (chaining).",
    ],
    formulas: [
      "Load factor: alpha = n (entries) / m (table size).",
      "Chaining expected search cost: Theta(1 + alpha).",
      "Linear probing: (h(key) + i) mod m. Quadratic probing: (h(key) + i^2) mod m. Double hashing: (h1(key) + i*h2(key)) mod m.",
    ],
    shortcuts: [
      "If a question describes clustering behaviour without naming the strategy, 'consecutive block of occupied slots growing' is the signature of LINEAR probing specifically - a fast way to identify which probing method is being described.",
      "For a load-factor question, compute alpha first (entries/size) before reasoning about expected cost - it's the single number that determines the answer for chaining-based cost questions.",
    ],
    pyqRelevance: `Hashing questions cover collision-resolution mechanics (tracing where a sequence of keys actually land under a given probing strategy), load-factor-based cost estimation, and conceptual questions distinguishing average-case O(1) from a (nonexistent) worst-case guarantee - all recurring GATE question shapes.`,
    interviewConnection: `Hash tables underlie nearly every language's dictionary/map implementation, and understanding collision resolution trade-offs (and WHY resizing/rehashing happens at a load-factor threshold) is foundational to any discussion of hash table performance in a systems or data-structures interview.`,
    revisionSummary: `Hashing: average O(1) via direct key-to-index mapping; collisions are guaranteed (pigeonhole), not a bug.

Chaining (linked list per slot, graceful degradation) vs open addressing (in-table, requires empty slots, probes on collision: linear/quadratic/double hashing).

Load factor alpha = entries/size predicts cost directly; hash tables resize once alpha crosses a threshold. Hashing is average-case O(1), not worst-case guaranteed.`,
    shortNotes: {
      oneMinute: "Hashing: avg O(1), no ordering. Collisions guaranteed (pigeonhole). Chaining: linked list per slot, graceful. Open addressing: in-table, needs empty slots; linear probing (clusters), quadratic (less clustering), double hashing (best spread). Load factor alpha=n/m predicts cost; resize at a threshold. Average-case O(1), NOT worst-case guaranteed.",
    },
    mcqs: [
      {
        question: "Which collision resolution strategy is most prone to 'primary clustering' (large blocks of consecutively occupied slots)?",
        options: ["Chaining", "Linear probing", "Double hashing", "Quadratic probing"],
        correctIndex: 1,
        explanation: "Linear probing's fixed offset-by-1 sequence causes occupied slots to merge into larger and larger consecutive blocks, which become increasingly likely to be probed into again - primary clustering is its defining weakness.",
      },
    ],
    numericals: [
      {
        question: "A hash table using chaining has 200 entries in a table of size 250. What is the load factor (to 2 decimal places)?",
        answerMin: 0.8,
        answerMax: 0.8,
        unit: "",
        solution: `Load factor alpha = n/m = 200/250 = 0.8`,
      },
    ],
  },

  // ---------------- Algorithm Design Techniques ----------------

  "greedy-algorithms": {
    difficulty: "Moderate",
    estimatedMinutes: 30,
    whatYoullLearn: [
      "What makes a problem greedy-solvable: the greedy-choice property and optimal substructure",
      "Classic greedy algorithms and the specific choice rule each one makes at every step",
      "Why greedy fails on problems that LOOK similar to ones it solves correctly (0/1 knapsack vs fractional)",
      "How to argue (informally) that a greedy strategy is actually correct, not just plausible",
    ],
    prerequisites: ["Asymptotic Notation"],
    concept: `## Making The Locally Best Choice, Never Looking Back

::: story
A greedy algorithm builds a solution one step at a time, always picking whatever looks BEST RIGHT NOW, and never reconsidering that choice later. This works only when the problem has a specific structure - it is not a general-purpose optimization strategy, and using it on the wrong problem produces a confidently wrong answer, not a slower correct one.
:::

::: remember
Two properties must both hold for greedy to guarantee an optimal answer: the GREEDY-CHOICE PROPERTY (a locally optimal choice at each step leads to a globally optimal solution) and OPTIMAL SUBSTRUCTURE (an optimal solution to the whole problem contains optimal solutions to its subproblems). Optimal substructure alone is NOT enough - Dynamic Programming problems also have it, but often lack the greedy-choice property.
:::

## Classic Greedy Algorithms And Their Choice Rule

::: cards
Activity Selection :: Sort activities by FINISH time; greedily pick the next activity whose start time is >= the previously picked activity's finish time. Proven optimal - picking by finish time (not duration, not start time) is the specific insight that makes this work.
Fractional Knapsack :: Sort items by VALUE-PER-WEIGHT ratio (descending); fill the knapsack with as much of the highest-ratio item as fits, then move to the next. Works because items can be split fractionally.
Huffman Coding :: Repeatedly merge the two LOWEST-frequency nodes into a new combined node, until one tree remains. Produces a provably optimal prefix-free binary encoding.
Dijkstra's Shortest Path :: At each step, greedily pick the UNVISITED vertex with the smallest known distance so far, and finalize it - see Shortest Paths for full detail; this is greedy specifically because a vertex's finalized shortest distance is never revisited.
:::

::: mistake
Applying fractional knapsack's greedy strategy to the 0/1 KNAPSACK problem (where items CANNOT be split). 0/1 knapsack does NOT have the greedy-choice property - the highest value-per-weight item might not fit in a way that leaves room for a genuinely better overall combination, and this problem requires Dynamic Programming instead, not greedy.
:::

## Arguing Greedy Correctness (Informally)

::: flow
Assume an optimal solution differs :: Take some OPTIMAL solution that makes a different choice than greedy would, at the first point they disagree.
Exchange, then compare :: Swap in the greedy choice instead (an "exchange") and show the result is AT LEAST as good - proving greedy's choice was always safe, and extending by induction to every later step.
:::

::: checkpoint
Why does greedy correctly solve Fractional Knapsack but NOT 0/1 Knapsack?
- ( ) Fractional Knapsack has more items on average
- (x) 0/1 Knapsack lacks the greedy-choice property - the best-ratio item might not fit an overall optimal combination
- ( ) 0/1 Knapsack is always solved faster by brute force anyway
- ( ) There is no real difference; both are solved identically
> Fractional Knapsack allows splitting items, so always taking the best ratio first genuinely never costs anything (any leftover capacity gets the next-best ratio). 0/1 Knapsack forces all-or-nothing choices, so greedily taking the best-ratio item can BLOCK a better overall combination that a different choice would have allowed - it lacks the greedy-choice property, requiring DP instead.
:::`,
    keyPoints: [
      "Greedy: locally best choice at each step, never reconsidered. Requires BOTH the greedy-choice property AND optimal substructure to guarantee a globally optimal result.",
      "Activity Selection: sort by finish time, pick compatible activities greedily. Fractional Knapsack: sort by value/weight ratio. Huffman Coding: repeatedly merge the two lowest-frequency nodes.",
      "0/1 Knapsack lacks the greedy-choice property (unlike Fractional Knapsack) - it needs Dynamic Programming, not greedy, because all-or-nothing item choices can block a better overall combination.",
      "Exchange argument: the standard informal proof technique for greedy correctness - show swapping in the greedy choice never makes an optimal solution worse.",
    ],
    analogies: [
      "Greedy is like making change with the fewest coins by always grabbing the largest coin that still fits - this WORKS for typical currency denominations, but would fail for a hypothetical currency where that locally-best grab blocks a better overall combination, exactly the same failure mode as 0/1 Knapsack.",
    ],
    commonMistakes: [
      "Applying a greedy strategy to a problem without first checking whether it actually has the greedy-choice property - confusing 'has optimal substructure' (necessary but not sufficient) with 'greedy works here'.",
      "Using fractional-knapsack-style greedy reasoning on 0/1 knapsack, a very common specific trap since the two problems sound nearly identical.",
      "Forgetting activity selection's key insight is sorting by FINISH time specifically - sorting by duration or start time does not, in general, produce an optimal selection.",
    ],
    memoryTricks: [
      "\"Greedy: choose now, never look back - but only where that's provably safe.\" The whole technique and its danger, in one line.",
      "Fractional splits -> greedy usually safe. All-or-nothing (0/1) -> greedy usually unsafe, reach for DP instead.",
    ],
    formulas: [],
    shortcuts: [
      "When a problem allows PARTIAL/fractional choices, greedy is often (though not always) the right first guess; when choices are strictly all-or-nothing, be suspicious of greedy and consider whether DP is actually required.",
      "For activity selection specifically, always sort by FINISH time - this is the one sorting key that's proven to work, and defaulting to it saves re-deriving the correct approach under time pressure.",
    ],
    pyqRelevance: `Greedy algorithms are tested via direct application (trace activity selection or fractional knapsack on a given instance) and, very commonly, via a conceptual trap distinguishing when greedy DOES vs does NOT apply (fractional vs 0/1 knapsack being the classic pairing) - both are recurring, high-value GATE question types.`,
    interviewConnection: `Recognising whether a proposed problem has the greedy-choice property (and correctly identifying when it doesn't, defaulting to DP instead) is one of the most common algorithm-design judgment calls tested in coding interviews - the 0/1 vs fractional knapsack distinction is a standard teaching example for exactly this judgment.`,
    revisionSummary: `Greedy needs BOTH greedy-choice property and optimal substructure. Activity selection: sort by finish time. Fractional knapsack: sort by value/weight ratio. Huffman: merge two lowest-frequency nodes repeatedly.

0/1 Knapsack lacks the greedy-choice property (all-or-nothing choices can block a better combination) - needs DP instead.

Exchange argument: the standard informal correctness-proof technique for greedy strategies.`,
    shortNotes: {
      oneMinute: "Greedy: locally-best choice, never reconsidered. Needs greedy-choice property + optimal substructure. Activity selection: sort by finish time. Fractional knapsack: sort by value/weight ratio. Huffman: merge 2 lowest-frequency nodes. 0/1 knapsack lacks greedy-choice property -> needs DP. Exchange argument = standard correctness proof technique.",
    },
    mcqs: [
      {
        question: "In the Activity Selection problem, which sorting key does the standard optimal greedy strategy use?",
        options: ["Start time", "Duration (finish - start)", "Finish time", "Number of overlapping activities"],
        correctIndex: 2,
        explanation: "Sorting by finish time (ascending) and greedily picking each next compatible activity is the specific strategy proven optimal for Activity Selection - start time or duration alone does not guarantee an optimal selection in general.",
      },
    ],
    numericals: [],
  },

  "dynamic-programming": {
    difficulty: "Hard",
    estimatedMinutes: 35,
    whatYoullLearn: [
      "The two properties a problem needs for DP to apply: overlapping subproblems and optimal substructure",
      "Memoization (top-down) vs tabulation (bottom-up), and the trade-offs between them",
      "Working through a classic DP problem end to end, identifying the state and recurrence",
      "Recognising a DP-shaped problem from its phrasing, fast",
    ],
    prerequisites: ["Recursion", "Greedy Algorithms"],
    concept: `## Solving Each Subproblem Exactly Once

::: story
Dynamic Programming solves a problem by breaking it into overlapping subproblems - the SAME subproblem shows up multiple times across the naive recursive solution's call tree - and solving each one exactly ONCE, storing (caching) its answer for reuse instead of recomputing it every time it's needed again.
:::

::: remember
DP requires two properties: OVERLAPPING SUBPROBLEMS (the same smaller subproblem recurs many times - if every subproblem were distinct, caching would buy nothing) and OPTIMAL SUBSTRUCTURE (an optimal solution to the whole problem is built from optimal solutions to its subproblems - shared with Greedy, but DP doesn't additionally require the greedy-choice property).
:::

## Memoization vs Tabulation

::: cards
Memoization (top-down) :: Write the natural RECURSIVE solution, but cache each subproblem's result the first time it's computed (usually in an array or hash map) and return the cached value on every later call with the same arguments. Only computes subproblems that are ACTUALLY needed.
Tabulation (bottom-up) :: Build a table iteratively, starting from the smallest subproblems and working UP to the final answer, with no recursion at all. Computes EVERY subproblem in the table, even ones the final answer might not have actually needed - but avoids recursive call overhead and stack depth entirely.
:::

::: mistake
Writing a "DP-looking" recursive solution but forgetting the memoization cache entirely - without it, the solution is just the original exponential-time naive recursion with extra bookkeeping, providing none of DP's actual speedup.
:::

## Worked Example: Fibonacci, The Simplest Illustration

::: flow
1. Naive recursion :: fib(n) = fib(n-1) + fib(n-2) - this recomputes fib(n-2) from BOTH fib(n-1)'s call AND directly, and this overlap compounds exponentially, giving O(2^n) time.
2. Identify the state :: The subproblem is fully described by a single number, n - so a 1D array/cache indexed by n is enough.
3. Memoized version :: Same recursive structure, but check cache[n] first; if already computed, return it immediately instead of recursing further. Reduces to O(n) total (each of the n distinct subproblems computed exactly once).
4. Tabulated version :: Build dp[0]=0, dp[1]=1, then dp[i] = dp[i-1] + dp[i-2] for i=2 to n, iteratively - also O(n) time, and O(1) extra space is even possible here by only keeping the last two values.
:::

::: checkpoint
A problem has optimal substructure but its recursive solution's subproblems are ALL DISTINCT (no repeats at all). Does DP provide any speedup over plain recursion here?
- ( ) Yes, always - DP is strictly faster
- (x) No - without overlapping subproblems, there's nothing to cache/reuse, so DP provides no benefit
- ( ) Only if the problem also has the greedy-choice property
- ( ) Cannot be determined
> DP's speedup comes specifically from avoiding REDUNDANT recomputation of the same subproblem. If every subproblem is genuinely distinct (no overlap), there is nothing to cache and reuse - DP's memoization/tabulation machinery adds only overhead with no benefit in that case.
:::`,
    codeExample: {
      language: "c",
      code: `#include <stdio.h>

int cache[50];
int fibMemo(int n) {
    if (n <= 1) return n;
    if (cache[n] != -1) return cache[n];        /* already solved - reuse */
    return cache[n] = fibMemo(n - 1) + fibMemo(n - 2);
}

int fibTab(int n) {
    if (n <= 1) return n;
    int dp[50];
    dp[0] = 0; dp[1] = 1;
    for (int i = 2; i <= n; i++) dp[i] = dp[i - 1] + dp[i - 2];
    return dp[n];
}

int main(void) {
    for (int i = 0; i < 50; i++) cache[i] = -1;
    printf("%d\\n", fibMemo(10));   /* 55 */
    printf("%d\\n", fibTab(10));    /* 55 */
    return 0;
}`,
      expectedOutput: `55
55`,
    },
    keyPoints: [
      "DP requires overlapping subproblems (the same subproblem recurs) AND optimal substructure - without overlap, caching buys nothing.",
      "Memoization (top-down): natural recursion plus a cache, only computes subproblems actually needed. Tabulation (bottom-up): iterative table-building from the smallest subproblem up, computes every entry.",
      "Naive recursive Fibonacci is O(2^n) due to massive subproblem overlap; memoized or tabulated Fibonacci is O(n), since each of the n distinct subproblems is solved exactly once.",
      "The core DP design steps: identify the STATE (what fully describes a subproblem), write the RECURRENCE relating a state to smaller states, then choose memoization or tabulation to implement it.",
    ],
    analogies: [
      "DP is like keeping a running notebook of answers to questions you've already worked out, so that the next time the exact same question comes up, you just read the notebook instead of solving it again from scratch.",
    ],
    commonMistakes: [
      "Writing correct recursive structure but forgetting to actually check/populate the cache, silently reverting to the original exponential-time naive recursion.",
      "Applying DP to a problem whose subproblems don't actually overlap - no speedup results, and the extra bookkeeping is pure overhead.",
      "Getting the STATE definition wrong (using too few dimensions to fully describe a subproblem, causing incorrect cache hits between genuinely different subproblems).",
    ],
    memoryTricks: [
      "\"Overlapping subproblems -> cache pays off. No overlap -> caching is wasted effort.\" The single fact that decides whether DP even applies.",
      "Memoization: recursion PLUS a notebook. Tabulation: no recursion, just filling the notebook in order from the start.",
    ],
    formulas: [],
    shortcuts: [
      "To quickly recognise a DP-shaped problem, look for phrasing like 'maximum/minimum/number of ways to...' combined with a problem that naturally breaks into smaller versions of ITSELF - that combination is the strongest single signal for DP over greedy or plain recursion.",
      "When designing a DP solution, write the recurrence relation FIRST (in terms of smaller states) before writing any code - the code is almost mechanical once the recurrence and state are correctly identified.",
    ],
    pyqRelevance: `Dynamic Programming is one of the heaviest-weighted Algorithms topics on GATE - both direct DP-table-filling numericals (given a small instance, compute the final DP table/answer) and complexity/recognition questions (is this problem DP-shaped, and what's the correct state?) appear consistently.`,
    interviewConnection: `DP is one of the most commonly tested interview algorithm-design techniques, and the memoization-vs-tabulation trade-off (recursion depth/stack usage vs computing unneeded subproblems) is a standard interview follow-up once a candidate produces a working DP solution.`,
    revisionSummary: `DP needs overlapping subproblems (recurring subproblems, worth caching) AND optimal substructure.

Memoization: top-down recursion + cache, computes only needed subproblems. Tabulation: bottom-up iterative table-fill, computes every subproblem.

Design steps: identify the state, write the recurrence, implement via memoization or tabulation. No overlap -> DP provides no benefit over plain recursion.`,
    shortNotes: {
      oneMinute: "DP needs overlapping subproblems + optimal substructure. Memoization: top-down recursion + cache (only needed subproblems). Tabulation: bottom-up iterative (all subproblems). Design: identify state, write recurrence, implement. No overlap = no DP benefit.",
    },
    mcqs: [
      {
        question: "What is the primary reason naive recursive Fibonacci is O(2^n) while its memoized version is O(n)?",
        options: [
          "Memoization uses a different, faster recursion formula",
          "Memoization avoids recomputing the same overlapping subproblems repeatedly",
          "The memoized version doesn't use recursion at all",
          "Fibonacci numbers are only correct with memoization",
        ],
        correctIndex: 1,
        explanation: "Naive recursion recomputes the same fib(k) values many times due to massive subproblem overlap; memoization caches each distinct subproblem's result the first time it's computed, eliminating that redundant recomputation entirely.",
      },
    ],
    numericals: [
      {
        question: "Using the standard DP table for computing the nth Fibonacci number (dp[0]=0, dp[1]=1, dp[i]=dp[i-1]+dp[i-2]), what is dp[8]?",
        answerMin: 21,
        answerMax: 21,
        unit: "",
        solution: `dp[0..8]: 0, 1, 1, 2, 3, 5, 8, 13, 21. dp[8] = 21.`,
      },
    ],
  },

  "divide-and-conquer": {
    difficulty: "Moderate",
    estimatedMinutes: 25,
    whatYoullLearn: [
      "The three-step divide-and-conquer pattern, and how it differs from DP despite both being recursive",
      "Classic divide-and-conquer algorithms beyond sorting: binary search, and finding max/min",
      "Why divide-and-conquer does NOT require overlapping subproblems, unlike DP",
      "Analysing a divide-and-conquer algorithm's complexity via the Master Theorem",
    ],
    prerequisites: ["Recurrence Solving for Algorithms", "Dynamic Programming"],
    concept: `## Divide, Conquer, Combine - The Three-Step Pattern

::: cards
Divide :: Split the problem into smaller SUBPROBLEMS of the same type (often, though not always, roughly equal-sized halves).
Conquer :: Solve each subproblem recursively (directly, if it's small enough to be a base case).
Combine :: Merge the subproblems' solutions into a solution for the original problem.
:::

::: remember
This is the same three-step shape behind merge sort (divide into halves, recursively sort each, merge the sorted halves) and quick sort (partition around a pivot, recursively sort each side, and - since partitioning already places everything correctly - no explicit combine step is even needed).
:::

## Divide-And-Conquer vs Dynamic Programming: The Key Difference

::: mistake
Treating divide-and-conquer and DP as the same technique because both are recursive. The genuine difference: divide-and-conquer's subproblems are typically INDEPENDENT and DISTINCT (no overlap - merge sort's left half and right half share no sub-subproblems), while DP is specifically for OVERLAPPING subproblems that benefit from caching. Applying DP-style memoization to a genuinely non-overlapping divide-and-conquer algorithm provides no benefit at all.
:::

::: flow
When subproblems genuinely don't overlap :: Divide-and-conquer alone is the right tool - no caching needed, straightforward recursive solve-and-combine.
When subproblems DO overlap :: That overlap is precisely the signal to reach for DP's memoization/tabulation instead of (or in addition to) plain divide-and-conquer recursion.
:::

## Classic Divide-And-Conquer Beyond Sorting

::: cards
Binary Search :: Divide: compare against the middle. Conquer: recurse into the one relevant half. Combine: trivial (nothing to merge - the answer IS whichever half's result). T(n)=T(n/2)+O(1) -> Theta(log n).
Finding Max And Min Together :: Naive: 2n-2 comparisons (separate max and min scans). Divide-and-conquer: split in half, recursively find (max,min) of each half, combine with just 2 more comparisons - reduces total comparisons to about 3n/2, a genuine, provable improvement over the naive approach.
Merge Sort :: Divide into two halves, conquer (recursively sort each), combine via the O(n) merge step. T(n)=2T(n/2)+O(n) -> Theta(n log n) (Master Theorem Case 2).
:::

::: checkpoint
Why does merge sort's divide-and-conquer approach NOT benefit from DP-style memoization?
- ( ) Merge sort is already as fast as possible
- (x) Its subproblems (each half of the array) are genuinely distinct, non-overlapping - there's nothing to cache and reuse
- ( ) Memoization only works for sorting problems specifically
- ( ) Merge sort doesn't use recursion
> Each recursive call in merge sort operates on a DIFFERENT slice of the array - the left half and right half share no common sub-subproblem to redundantly recompute, so there is nothing for a memoization cache to usefully store and reuse.
:::`,
    keyPoints: [
      "Divide-and-conquer: divide into subproblems, conquer (solve recursively), combine into the final solution.",
      "Key distinction from DP: divide-and-conquer's subproblems are typically distinct/non-overlapping; DP specifically targets overlapping subproblems worth caching.",
      "Binary search, merge sort, and the max-and-min-together algorithm are classic divide-and-conquer examples beyond basic sorting.",
      "Finding max AND min together via divide-and-conquer takes about 3n/2 comparisons, provably better than the naive 2n-2 from two separate linear scans.",
      "Complexity analysis of divide-and-conquer recurrences uses the Master Theorem (see Recurrence Solving for Algorithms).",
    ],
    analogies: [
      "Divide-and-conquer is like organizing a large event by splitting it into independent sub-teams (catering, venue, guests) that work in parallel with zero overlap in their tasks, then combining each team's finished output at the end - unlike DP, where sub-teams would constantly rediscover they're solving the exact same shared problem.",
    ],
    commonMistakes: [
      "Assuming divide-and-conquer and DP are interchangeable because both recurse - the overlapping-vs-distinct subproblem distinction is the actual deciding factor for which technique (or combination) applies.",
      "Forgetting merge sort's combine step is where the real O(n) work happens (the merge itself), not the divide step, which is trivial (just computing a midpoint).",
      "Using the naive 2n-2 comparison count for simultaneous max/min instead of recognising the divide-and-conquer approach's provably better ~3n/2.",
    ],
    memoryTricks: [
      "\"Divide-and-conquer: independent pieces. DP: overlapping pieces worth remembering.\" The one-sentence distinction between the two recursive families.",
      "Divide, Conquer, Combine - three steps, in that exact order, every time.",
    ],
    formulas: [
      "Simultaneous max-min via divide-and-conquer: approximately 3n/2 comparisons, vs naive 2n-2.",
    ],
    shortcuts: [
      "When a problem's recursive subproblems are clearly disjoint (operate on non-overlapping input slices), classify it as plain divide-and-conquer and skip considering memoization entirely - it would add complexity with zero benefit.",
      "For any divide-and-conquer complexity question, write down T(n) in the a,b,f(n) form immediately and reach for the Master Theorem rather than trying to reason about the complexity informally.",
    ],
    pyqRelevance: `Divide-and-conquer is tested through its role in merge sort/binary search complexity analysis (via Master Theorem) and occasionally through the classic 'compare with naive' style question (like simultaneous max-min) - mostly integrated with other topics rather than tested as a fully standalone concept.`,
    interviewConnection: `Recognising when a problem's recursive structure is genuinely divide-and-conquer (independent subproblems) versus DP (overlapping subproblems) is a core algorithm-design judgment interviewers specifically probe for when a candidate proposes a recursive solution.`,
    revisionSummary: `Divide-and-conquer: divide into subproblems, conquer recursively, combine results. Key distinction from DP: subproblems are typically distinct/non-overlapping (nothing to cache).

Classic examples: binary search (T(n)=T(n/2)+O(1)), merge sort (T(n)=2T(n/2)+O(n)), simultaneous max-min (~3n/2 comparisons, better than naive 2n-2).

Complexity analysed via the Master Theorem.`,
    shortNotes: {
      oneMinute: "Divide-and-conquer: divide, conquer (recurse), combine. Subproblems typically DISTINCT/non-overlapping - unlike DP (overlapping, cache-worthy). Binary search T(n)=T(n/2)+O(1). Merge sort T(n)=2T(n/2)+O(n). Max-min together: ~3n/2 comparisons vs naive 2n-2. Analysed via Master Theorem.",
    },
    mcqs: [
      {
        question: "What is the essential difference between divide-and-conquer and dynamic programming?",
        options: [
          "Divide-and-conquer doesn't use recursion",
          "DP's subproblems overlap (worth caching); divide-and-conquer's subproblems are typically distinct",
          "Divide-and-conquer is always faster",
          "DP never has a combine step",
        ],
        correctIndex: 1,
        explanation: "The defining distinction is subproblem overlap - DP targets problems where the same subproblem recurs (worth caching), while divide-and-conquer's subproblems are typically independent and distinct, with nothing to usefully cache.",
      },
    ],
    numericals: [],
  },

  // ---------------- Graph Algorithms ----------------

  "graph-traversals": {
    difficulty: "Moderate",
    estimatedMinutes: 30,
    whatYoullLearn: [
      "BFS and DFS: the exact data structure each uses, and why that choice produces their different traversal orders",
      "Time and space complexity of both, for adjacency list and adjacency matrix representations",
      "Classifying edges during a DFS (tree, back, forward, cross edges) and what a back edge specifically reveals",
      "Applications: connected components, cycle detection, and topological sort",
    ],
    prerequisites: ["Graph Representations", "Queues", "Stacks"],
    concept: `## Two Traversals, Two Underlying Data Structures

::: story
BFS and DFS both visit every reachable vertex exactly once, but explore in fundamentally different orders - and that difference comes entirely from WHICH data structure each one uses to decide "what to visit next."
:::

::: cards
BFS (Breadth-First Search) :: Uses a QUEUE. Explores level by level - all vertices at distance 1 from the start, then all at distance 2, and so on. Directly connects to Queues: this is exactly why a queue (FIFO) is needed here.
DFS (Depth-First Search) :: Uses a STACK (explicitly, or implicitly via recursion). Explores as DEEP as possible down one path before backtracking - directly connects to Stacks and to Recursion's call-stack model.
:::

::: remember
BFS specifically finds the SHORTEST PATH (fewest edges) from the start vertex to every other reachable vertex in an UNWEIGHTED graph - a guarantee DFS does NOT provide, since DFS can wander down a long path before ever reaching a vertex that's actually close by edge count.
:::

## Complexity: Depends On The Representation

::: flow
Adjacency list :: O(V + E) for both BFS and DFS - every vertex is visited once (O(V)), and every edge is examined once across the whole traversal (O(E)).
Adjacency matrix :: O(V^2) for both - even though only some entries represent real edges, checking every possible neighbour of every vertex means scanning full rows, an O(V) cost per vertex.
:::

## DFS Edge Classification

::: cards
Tree edge :: Leads to a vertex being visited for the FIRST time - part of the DFS tree/forest itself.
Back edge :: Leads to an ANCESTOR already on the current recursion stack - this is the specific signature of a CYCLE in the graph. Detecting a back edge during DFS is exactly how cycle detection works.
Forward edge :: Leads to a DESCENDANT already fully visited (directed graphs only) - not part of the tree, but doesn't indicate a cycle.
Cross edge :: Leads to a vertex in a different branch/subtree entirely (no ancestor-descendant relationship) - also not a cycle indicator on its own.
:::

::: mistake
Treating ANY edge to an already-visited vertex as a cycle indicator. Only a BACK edge (to a vertex still on the CURRENT recursion stack, i.e. a genuine ancestor in the DFS tree) indicates a cycle - a forward or cross edge to an already-fully-processed vertex does not.
:::

## Applications

::: cards
Connected components (undirected graph) :: Run BFS or DFS from any unvisited vertex; everything reached forms one component. Repeat from the next unvisited vertex until all are covered. Number of times this restarts = number of components.
Cycle detection :: DFS, watching specifically for back edges (see above).
Topological sort (DAGs only) :: DFS-based: run DFS, and prepend each vertex to the output ONLY when its DFS call finishes (postorder) - this produces a valid topological order for a Directed Acyclic Graph. Only possible if the graph has NO cycles at all.
:::

::: checkpoint
In an UNWEIGHTED graph, which traversal is guaranteed to find the shortest path (fewest edges) from a start vertex to every other vertex?
- (x) BFS
- ( ) DFS
- ( ) Both equally
- ( ) Neither, without additional information
> BFS's level-by-level (queue-based) exploration guarantees that the first time a vertex is reached, it's reached via the fewest possible edges - DFS provides no such guarantee, since it can reach a "close" vertex only after a long detour down an unrelated path.
:::`,
    codeExample: {
      language: "c",
      code: `#include <stdio.h>
#define V 5

int adj[V][V];   /* adjacency matrix */
int visited[V];
int queue[V], front = 0, rear = -1, qsize = 0;

void enqueue(int x) { queue[++rear] = x; qsize++; }
int dequeue(void) { qsize--; return queue[front++]; }

void bfs(int start) {
    enqueue(start);
    visited[start] = 1;
    while (qsize > 0) {
        int u = dequeue();
        printf("%d ", u);
        for (int v = 0; v < V; v++) {
            if (adj[u][v] && !visited[v]) {
                visited[v] = 1;
                enqueue(v);
            }
        }
    }
}

int main(void) {
    /* edges: 0-1, 0-2, 1-3, 2-4 */
    adj[0][1]=adj[1][0]=1;
    adj[0][2]=adj[2][0]=1;
    adj[1][3]=adj[3][1]=1;
    adj[2][4]=adj[4][2]=1;

    bfs(0);   /* level order from 0: 0 1 2 3 4 */
    printf("\\n");
    return 0;
}`,
      expectedOutput: `0 1 2 3 4 `,
    },
    keyPoints: [
      "BFS uses a queue, explores level by level, and guarantees shortest path (fewest edges) in an unweighted graph. DFS uses a stack/recursion, explores as deep as possible before backtracking.",
      "Both are O(V+E) with an adjacency list, O(V^2) with an adjacency matrix.",
      "DFS edge types: tree (first visit), back (to a current-stack ancestor - the cycle signature), forward (to a finished descendant, directed graphs), cross (unrelated branch).",
      "Only a BACK edge indicates a cycle - any other edge to an already-visited vertex does not.",
      "Applications: connected components (repeat traversal from each unvisited vertex), cycle detection (watch for back edges), topological sort (DFS postorder, DAGs only).",
    ],
    analogies: [
      "BFS is exploring a building floor by floor before going up (guarantees you find the nearest exit first); DFS is picking one hallway and following it as far as it goes before ever backtracking to try another - same building, completely different exploration order.",
    ],
    commonMistakes: [
      "Assuming DFS also finds shortest paths in an unweighted graph - only BFS provides that guarantee.",
      "Treating every edge to an already-visited vertex as a cycle - only a BACK edge (to a vertex on the current recursion stack) indicates one.",
      "Forgetting that a single BFS/DFS run only covers ONE connected component - finding ALL components requires restarting from every remaining unvisited vertex.",
      "Attempting topological sort on a graph that isn't actually a DAG - if a cycle exists, no valid topological order can exist at all.",
    ],
    memoryTricks: [
      "\"BFS: queue, level by level, shortest path. DFS: stack, as deep as possible, then backtrack.\" The data structure explains the exploration order.",
      "Back edge = cycle. Forward/cross edge = NOT a cycle. Only 'back to a currently-active ancestor' counts.",
    ],
    formulas: [
      "BFS/DFS complexity: O(V+E) with adjacency list, O(V^2) with adjacency matrix.",
    ],
    shortcuts: [
      "If a question asks for shortest path/fewest edges specifically in an UNWEIGHTED graph, default to BFS immediately - it's the only one of the two with that guarantee.",
      "For a cycle-detection question, trace the DFS and explicitly track which vertices are STILL on the current recursion stack (not just 'visited ever') - this distinction is exactly what separates a back edge from a forward/cross edge.",
    ],
    pyqRelevance: `BFS/DFS traversal order tracing, complexity questions (list vs matrix representation), and cycle-detection-via-back-edge questions are all frequent GATE question types - often combined with graph representation questions from the prerequisite topic.`,
    interviewConnection: `BFS and DFS are foundational for nearly every graph interview question - shortest path in unweighted graphs (BFS), connected components, cycle detection, and topological sort (course scheduling problems) are all standard interview problems built directly on these two traversals.`,
    revisionSummary: `BFS: queue, level-by-level, guarantees shortest path in unweighted graphs. DFS: stack/recursion, explores deep first. Both O(V+E) (list) or O(V^2) (matrix).

DFS edges: tree (first visit), back (ancestor on current stack - cycle signature), forward/cross (not cycle indicators).

Applications: connected components (repeat from each unvisited vertex), cycle detection (back edges), topological sort (DFS postorder, DAGs only).`,
    shortNotes: {
      oneMinute: "BFS: queue, level-by-level, shortest path (unweighted). DFS: stack/recursion, depth-first. Both O(V+E) list / O(V^2) matrix. DFS edges: tree(new)/back(ancestor on stack=CYCLE)/forward/cross(neither cycle). Applications: components (repeat from unvisited), cycle detection (back edges), topo sort (DFS postorder, DAG only).",
    },
    mcqs: [
      {
        question: "Which data structure does DFS use to decide which vertex to explore next?",
        options: ["Queue", "Stack (explicit or via recursion)", "Priority queue", "Hash table"],
        correctIndex: 1,
        explanation: "DFS uses a stack - either explicitly, or implicitly through the recursive call stack - which is exactly why it goes as deep as possible before backtracking, unlike BFS's queue-based level-by-level exploration.",
      },
      {
        question: "During a DFS on a directed graph, which edge type specifically indicates the presence of a cycle?",
        options: ["Forward edge", "Cross edge", "Back edge", "Tree edge"],
        correctIndex: 2,
        explanation: "A back edge leads to an ancestor that is still on the current DFS recursion stack - that ancestor-descendant relationship closing back on itself is exactly what constitutes a cycle.",
      },
    ],
    numericals: [],
  },

  "minimum-spanning-trees": {
    difficulty: "Moderate",
    estimatedMinutes: 30,
    whatYoullLearn: [
      "What a spanning tree is, and what makes one MINIMUM (in a weighted graph)",
      "Kruskal's algorithm: the edge-sorting greedy approach, and why Union-Find is the right tool for it",
      "Prim's algorithm: the vertex-growing greedy approach, and when it beats Kruskal's",
      "The Cut Property, the actual reason both greedy algorithms are provably correct",
    ],
    prerequisites: ["Graph Traversals", "Greedy Algorithms"],
    concept: `## Connecting Every Vertex For The Least Total Weight

::: cards
Spanning tree :: A subgraph that CONNECTS all V vertices using exactly V-1 edges, with NO cycles - a tree, by definition (adding any one more edge would create a cycle).
Minimum Spanning Tree (MST) :: Among all possible spanning trees of a weighted graph, the one with the SMALLEST total edge weight. A graph can have MULTIPLE MSTs if edge weights aren't all distinct, but they all share the same total weight.
:::

::: remember
Both classic MST algorithms (Kruskal's and Prim's) are GREEDY - and both are provably correct because of the CUT PROPERTY: for ANY way of splitting the vertices into two groups, the minimum-weight edge crossing between the two groups is guaranteed to be part of SOME MST. This single fact is what justifies both algorithms' greedy choices.
:::

## Kruskal's: Sort Edges, Greedily Add If No Cycle

::: flow
1. Sort ALL edges by weight, ascending.
2. Process edges in that sorted order. For each edge, add it to the MST ONLY IF it does not create a cycle with edges already chosen.
3. Stop once V-1 edges have been added (the tree is complete).
:::

::: remember
"Does not create a cycle" is checked efficiently with a UNION-FIND (disjoint set) data structure: two vertices are in the same "set" exactly when they're already connected by chosen edges - adding an edge between two vertices ALREADY in the same set would create a cycle, so that edge is skipped.
:::

## Prim's: Grow One Tree, Vertex By Vertex

::: flow
1. Start with any single vertex as the (trivial) initial tree.
2. Repeatedly find the MINIMUM-weight edge connecting a vertex ALREADY in the tree to a vertex NOT yet in the tree, and add that edge (and vertex) to the tree.
3. Stop once all V vertices are included.
:::

::: cards Kruskal vs Prim - when each is preferred
Kruskal's :: Naturally suited to SPARSE graphs (few edges) - dominated by sorting E edges: O(E log E). Works directly on a plain edge list, doesn't need adjacency structure.
Prim's :: Naturally suited to DENSE graphs - with a binary heap and adjacency list: O(E log V). With a Fibonacci heap: O(E + V log V), better for very dense graphs.
:::

::: mistake
Forgetting Kruskal's needs an explicit cycle check (via Union-Find) on every candidate edge, while Prim's structurally CANNOT create a cycle at all - it only ever adds edges connecting the growing tree to a genuinely NEW vertex, so no cycle-detection step is needed in Prim's at all.
:::

::: checkpoint
A connected graph has 6 vertices. How many edges does its Minimum Spanning Tree contain?
- ( ) 6
- (x) 5
- ( ) 15
- ( ) Depends on the specific graph
> Any spanning tree (minimum or not) on V vertices has exactly V-1 edges, by the definition of a tree - here V=6, so the MST has 5 edges, regardless of how many total edges the original graph has.
:::`,
    keyPoints: [
      "Spanning tree: connects all V vertices with exactly V-1 edges, no cycles. MST: the spanning tree with minimum total edge weight (possibly non-unique, but the total weight is unique).",
      "Cut Property: the minimum-weight edge crossing any vertex-set split is guaranteed to be in SOME MST - this justifies both Kruskal's and Prim's greedy correctness.",
      "Kruskal's: sort all edges, greedily add if it doesn't create a cycle (checked via Union-Find), stop at V-1 edges. O(E log E), suited to sparse graphs.",
      "Prim's: grow one tree from a starting vertex, always adding the minimum-weight edge connecting the tree to a new vertex. O(E log V) with a binary heap, suited to dense graphs.",
      "Prim's structurally cannot create a cycle (it only connects to genuinely new vertices); Kruskal's requires an explicit cycle check on every candidate edge.",
    ],
    analogies: [
      "Kruskal's is like building a road network by picking the cheapest road anywhere on the map first, skipping any that would just create a redundant loop - Prim's is like building outward from one city, always extending to whichever unconnected city is cheapest to reach next.",
    ],
    commonMistakes: [
      "Trying to run Kruskal's without a cycle-detection mechanism (or using a naive O(V) check per edge instead of near-O(1) amortized Union-Find), which works but is far less efficient.",
      "Assuming a graph has a UNIQUE MST - it's unique only when all edge weights are distinct; with ties, multiple MSTs can exist, though they all share the same total weight.",
      "Confusing which algorithm suits sparse vs dense graphs, or assuming one is unconditionally 'better' than the other regardless of graph density.",
    ],
    memoryTricks: [
      "\"Kruskal's picks edges (sorted globally). Prim's grows a tree (locally, vertex by vertex).\" The core mechanical difference.",
      "Any spanning tree has exactly V-1 edges - memorise this as a standalone fact, independent of MST-specific reasoning.",
    ],
    formulas: [
      "Any spanning tree on V vertices: exactly V-1 edges.",
      "Kruskal's: O(E log E). Prim's (binary heap + adjacency list): O(E log V). Prim's (Fibonacci heap): O(E + V log V).",
    ],
    shortcuts: [
      "For a 'how many edges in the MST' question, skip any graph-specific reasoning entirely - it's always exactly V-1, directly from the definition of a spanning tree.",
      "If a GATE question gives a graph as an explicit edge list (not adjacency matrix/list), that's often a hint the intended approach is Kruskal's, which naturally works directly off a sorted edge list.",
    ],
    pyqRelevance: `MST construction (tracing Kruskal's or Prim's step by step on a small given graph, and computing the total MST weight) is one of the most reliable, high-frequency GATE numericals in the Algorithms section - both algorithms are tested, sometimes in the same question asking to compare their step order.`,
    interviewConnection: `MST algorithms directly model network design problems (minimum-cost cabling/wiring to connect all locations) and are a standard graph-algorithm interview topic - understanding the Cut Property is what actually explains WHY the greedy approach is correct here, beyond just memorising the steps.`,
    revisionSummary: `Spanning tree: V-1 edges, connects all vertices, no cycles. MST: minimum total weight among all spanning trees.

Cut Property justifies both greedy MST algorithms. Kruskal's: sort edges, add if no cycle (Union-Find), O(E log E), sparse-graph-friendly. Prim's: grow tree vertex by vertex via minimum crossing edge, O(E log V), dense-graph-friendly, no cycle check needed structurally.`,
    shortNotes: {
      oneMinute: "Spanning tree: V-1 edges, connects all, no cycle. MST: minimum total weight. Cut Property justifies greedy correctness. Kruskal's: sort edges, add if no cycle (Union-Find), O(E log E), good for sparse. Prim's: grow tree, add min crossing edge, O(E log V), good for dense, no cycle check needed.",
    },
    mcqs: [
      {
        question: "Which data structure is used to efficiently detect cycles while running Kruskal's algorithm?",
        options: ["Priority queue", "Union-Find (disjoint set)", "Hash table", "Binary search tree"],
        correctIndex: 1,
        explanation: "Union-Find efficiently tracks which vertices are already connected by chosen edges - an edge between two vertices already in the same set would create a cycle and is skipped, all in near-O(1) amortized time per operation.",
      },
    ],
    numericals: [
      {
        question: "A connected graph has 12 vertices. How many edges must its MST contain?",
        answerMin: 11,
        answerMax: 11,
        unit: "",
        solution: `Any spanning tree on V vertices has exactly V-1 edges. V=12, so the MST has 11 edges.`,
      },
    ],
  },

  "shortest-paths": {
    difficulty: "Hard",
    estimatedMinutes: 35,
    whatYoullLearn: [
      "Dijkstra's algorithm, and the ONE precondition it requires that both Bellman-Ford and Floyd-Warshall don't",
      "Bellman-Ford, and why it can handle negative weights (and even detect negative cycles)",
      "Floyd-Warshall for all-pairs shortest paths, and its distinctive triple-nested-loop structure",
      "Choosing the right shortest-path algorithm for a given graph's properties",
    ],
    prerequisites: ["Graph Traversals", "Greedy Algorithms", "Dynamic Programming"],
    concept: `## Three Algorithms, Three Different Guarantees

::: cards Pick based on what the graph actually allows
Dijkstra's :: Single-source shortest paths. REQUIRES all edge weights to be NON-NEGATIVE. Greedy: repeatedly finalize the closest unvisited vertex. O((V+E) log V) with a binary heap.
Bellman-Ford :: Single-source shortest paths. Works with NEGATIVE weights too (as long as there's no negative CYCLE reachable from the source) - and can explicitly DETECT a negative cycle's existence. Slower: O(V*E).
Floyd-Warshall :: ALL-PAIRS shortest paths (every vertex to every other vertex) in one run. Dynamic-programming based, works with negative weights (no negative cycles). O(V^3).
:::

::: mistake
Running Dijkstra's on a graph with a negative edge weight. Dijkstra's greedy correctness depends entirely on the assumption that once a vertex's shortest distance is finalized, no LATER discovery could ever improve it - a negative edge can violate exactly that assumption, producing a silently WRONG shortest-path answer, not a crash or warning.
:::

## Dijkstra's: Greedy, Finalize The Closest Vertex Each Step

::: flow
1. Initialize distance[source]=0, all others = infinity.
2. Repeatedly pick the UNVISITED vertex with the smallest known distance, and mark it VISITED (finalized) - its distance is now guaranteed correct and will never change again.
3. RELAX every edge from that vertex: if going through it offers a shorter path to a neighbour, update that neighbour's distance.
4. Repeat until every vertex is visited.
:::

## Bellman-Ford: Relax Every Edge, V-1 Times

::: remember
Bellman-Ford relaxes EVERY edge in the graph, repeated V-1 times total (not just once) - this guarantees convergence to correct shortest distances even with negative weights, because a shortest path can have at most V-1 edges, and each full pass propagates distance improvements at least one edge further along any path. A OPTIONAL Vth pass that STILL finds an improvement proves a negative cycle exists.
:::

## Floyd-Warshall: All Pairs, Via Every Possible Intermediate Vertex

::: flow
Core idea :: dist[i][j] = shortest path from i to j using ONLY vertices {1, ..., k} as allowed intermediates, updated incrementally as k grows from 1 to V.
Recurrence :: dist[i][j] = min(dist[i][j], dist[i][k] + dist[k][j]) - "is going through vertex k (as the newest allowed intermediate) an improvement over the best path found so far?"
Triple nested loop :: for k in 1..V: for i in 1..V: for j in 1..V: apply the recurrence - the ORDER matters, k must be the OUTERMOST loop, since dist[i][k] and dist[k][j] must already reflect intermediates up to k-1 when computing dist[i][j] for the current k.
:::

::: checkpoint
A graph has some negative edge weights but no negative cycle. Which algorithm correctly computes single-source shortest paths here?
- ( ) Dijkstra's - always safe to use
- (x) Bellman-Ford
- ( ) Neither works with negative weights at all
- ( ) BFS
> Dijkstra's greedy finalization breaks in the presence of negative weights. Bellman-Ford is specifically designed to handle negative weights correctly (as long as no negative cycle is reachable), making it the correct choice here.
:::`,
    keyPoints: [
      "Dijkstra's: single-source, REQUIRES non-negative weights, greedy finalize-closest-vertex approach, O((V+E) log V) with a binary heap.",
      "Bellman-Ford: single-source, handles negative weights (no negative cycle), relaxes every edge V-1 times, can detect a negative cycle via an extra Vth pass, O(V*E).",
      "Floyd-Warshall: all-pairs shortest paths in one run, DP-based (allowed intermediates grow from 1 to V), O(V^3), k must be the outermost loop.",
      "Using Dijkstra's on a graph with negative weights produces a silently WRONG answer, not an error - the greedy finalization assumption is specifically broken by negative edges.",
    ],
    analogies: [
      "Dijkstra's is a courier who commits to the fastest route to each stop the moment they're confident it's shortest, and never revisits that decision - which only works if a detour can never make things CHEAPER later (no negative weights). Bellman-Ford is more cautious, repeatedly re-checking every route V-1 times to be sure, which is exactly what lets it tolerate a shortcut with a 'negative cost'.",
    ],
    commonMistakes: [
      "Using Dijkstra's on a graph with any negative edge weight - it will run without error but produce an incorrect shortest-path answer.",
      "Running Bellman-Ford's relaxation loop fewer than V-1 times, understating how many passes are actually needed for guaranteed convergence.",
      "Getting Floyd-Warshall's loop order wrong (k not outermost), which breaks the DP recurrence's correctness since dist[i][k] and dist[k][j] wouldn't yet reflect the right set of allowed intermediates.",
      "Choosing Floyd-Warshall (O(V^3)) for a single-source query when a much faster single-source algorithm (Dijkstra's or Bellman-Ford) would suffice - Floyd-Warshall's cost is justified specifically when ALL-PAIRS results are actually needed.",
    ],
    memoryTricks: [
      "\"Dijkstra: fast but fragile (no negatives). Bellman-Ford: slower but tolerant (negatives OK, detects negative cycles). Floyd-Warshall: all pairs at once, O(V^3), k on the outside.\"",
      "Bellman-Ford's exact pass count: V-1, because a shortest path has at most V-1 edges - one extra pass finding further improvement proves a negative cycle.",
    ],
    formulas: [
      "Dijkstra's: O((V+E) log V) with a binary heap.",
      "Bellman-Ford: O(V * E), relaxes all edges V-1 times.",
      "Floyd-Warshall: O(V^3). Recurrence: dist[i][j] = min(dist[i][j], dist[i][k] + dist[k][j]), k outermost loop.",
    ],
    shortcuts: [
      "Before choosing a shortest-path algorithm in a GATE question, check for negative weights FIRST - their presence alone eliminates Dijkstra's as a valid choice, regardless of any other consideration.",
      "If the question asks for shortest paths between EVERY pair of vertices (not just from one source), default to Floyd-Warshall's O(V^3) rather than running a single-source algorithm V separate times (which could still work, but is a different, less standard approach to reach for first).",
    ],
    pyqRelevance: `Shortest-path algorithms are extremely high-frequency on GATE - Dijkstra's step-by-step trace (which vertex finalizes in what order, with what final distances) is a near-guaranteed numerical most years, and conceptual questions distinguishing when each of the three algorithms is valid/appropriate are equally common.`,
    interviewConnection: `Dijkstra's algorithm is one of the most frequently implemented graph algorithms in coding interviews (routing, network latency, game pathfinding), and correctly identifying WHY it fails with negative weights - and reaching for Bellman-Ford instead - is a standard follow-up discussion point.`,
    revisionSummary: `Dijkstra's: single-source, non-negative weights ONLY, greedy, O((V+E) log V).

Bellman-Ford: single-source, negative weights OK (no negative cycle), relax all edges V-1 times, detects negative cycles, O(V*E).

Floyd-Warshall: all-pairs, DP-based (dist[i][j]=min(dist[i][j], dist[i][k]+dist[k][j])), k outermost, O(V^3).

Dijkstra's on negative weights: silently wrong, not an error.`,
    shortNotes: {
      oneMinute: "Dijkstra's: single-source, non-negative weights ONLY, greedy finalize-closest, O((V+E) log V). Bellman-Ford: single-source, negative weights OK (no neg cycle), relax all edges V-1 times, detects neg cycles, O(VE). Floyd-Warshall: all-pairs, DP, dist[i][j]=min(dist[i][j],dist[i][k]+dist[k][j]), k outermost loop, O(V^3). Dijkstra's + negative weight = silently WRONG.",
    },
    mcqs: [
      {
        question: "Which shortest-path algorithm CANNOT be used correctly on a graph containing a negative edge weight (even without a negative cycle)?",
        options: ["Bellman-Ford", "Floyd-Warshall", "Dijkstra's", "All three fail with negative weights"],
        correctIndex: 2,
        explanation: "Dijkstra's greedy finalize-and-never-revisit approach specifically breaks with negative weights, silently producing a wrong answer - Bellman-Ford and Floyd-Warshall both correctly handle negative weights as long as no negative cycle exists.",
      },
      {
        question: "In Floyd-Warshall's triple nested loop, which loop variable must be the OUTERMOST?",
        options: ["i (source vertex)", "j (destination vertex)", "k (intermediate vertex)", "Order doesn't matter"],
        correctIndex: 2,
        explanation: "k (the allowed intermediate vertex) must be outermost so that dist[i][k] and dist[k][j] already reflect paths using only intermediates up to k-1 when dist[i][j] is updated for the current k - reordering the loops breaks the DP recurrence's correctness.",
      },
    ],
    numericals: [],
  },

};
