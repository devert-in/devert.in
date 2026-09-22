// DeVert Campus - Aptitude Series, Week 9: Advanced Reasoning
// (Mon 21 Sep - Sat 26 Sep 2026). Days 49-54.
//
// Continues week 8 (Days 43-48: Triangles, Circles/Polygons, Mensuration 2D,
// Mensuration 3D, Coordinate Geometry). The reasoning half of this track
// stopped at Day 29 (Statement-Conclusion) and never returned - so cubes and
// dice, ranking/order puzzles, input-output machines and the whole critical-
// reasoning family (assumptions, inferences, cause and effect, course of
// action, strong and weak arguments) are still uncovered despite being a
// standing section in Infosys, Wipro, Capgemini, Accenture and every bank
// or PSU paper a student might also sit.
//
// This is the first of the two CURRENT, earnable aptitude weeks - it opens on
// 2026-09-21, the day this content was authored. Weeks 7 and 8 backfill the
// 09-07/09-14 hole and are archive-only, since a day completed after its own
// date earns no XP/coins.
//
// Ordering: the two mechanical topics first (49 cubes/dice, 50 ranking) because
// they are formula-driven and build confidence, then 51 input-output as the
// bridge from "apply a formula" to "infer a rule", then the two judgement
// topics (52, 53) which have no formulas at all and are marked on consistency
// of reasoning instead. Day 53 deliberately follows Day 52 because course-of-
// action and argument-strength questions are assumption questions with an
// extra practicality test layered on.
//
// Day 54 is the week-scoped Saturday recap, matching Days 6/12/18/24/36/42/48.
//
// AUTHORING RULES: identical to week1.mjs/week6.mjs/week7.mjs/week8.mjs.
// `concept` is one string parsed by lib/lessonBlocks.js; fences are
// `::: variant optional title` ... `:::` each on its own line; never write
// "->" inside a flow step body or a literal "|" inside table cell text;
// two-space-indented lines render as code blocks; MCQ shape is
// { id, text, options, correctIndex, explanation } with a 0-based
// correctIndex; timedQuiz.mcqIds are 5 ids from that same day; ASCII hyphens
// only.

export const WEEK9_DAYS = [

  // ------------------------------------------------------------------
  // Day 49 - Monday 21 Sep 2026 - Cubes & Dice
  // ------------------------------------------------------------------
  {
    date: "2026-09-21", dow: "mon", weekId: "2026-09-21", type: "lesson",
    title: "Day 49: Cubes & Dice",
    difficulty: "Medium",
    estimatedMinutes: 17,
    concept: `## Paint It, Then Cut It

::: story
Take a wooden cube, paint every outside face red, and saw it into 64 identical little cubes. Now: how many of those little cubes have exactly two red faces?

You could try to picture all 64. Or you could notice that a small cube gets painted once for every ORIGINAL surface it touches - so a corner piece touches three surfaces, an edge piece touches two, a face piece touches one, and anything buried inside touches none. Count the corners, edges, faces and interior of a cube and you are finished, with no visualisation at all.
:::

## The Four Counts

Cut a painted cube into n slices along each edge, giving n cubed small cubes.

::: table Where each count comes from
Painted faces | Where those cubes sit | Formula | n = 4
3 faces | The 8 corners of the big cube | always 8 | 8
2 faces | Along the 12 edges, excluding the two corner cubes on each | 12(n - 2) | 24
1 face | In the middle of the 6 faces | 6(n - 2) squared | 24
0 faces | Entirely inside, never touching the surface | (n - 2) cubed | 8
:::

Always check your four numbers add to n cubed. For n = 4: 8 + 24 + 24 + 8 = 64. That single check catches almost every arithmetic slip, and it takes two seconds.

::: remember
The count of three-face cubes is ALWAYS 8, whatever n is, because a cube always has exactly 8 corners. If a question asks for three-painted-faces and offers 8 as an option, you are done before reading the value of n.
:::

  n = 3 (27 small cubes):   8  +  12(1)  +  6(1)   +  1     = 8 + 12 + 6 + 1 = 27
  n = 5 (125 small cubes):  8  +  12(3)  +  6(9)   +  27    = 8 + 36 + 54 + 27 = 125

Note that (n - 2) appears in three of the four formulas. It is the length of the "inner" run once the two end cubes of any edge have been removed, and if n is 2 it becomes zero - a cube cut into 8 pieces is all corners, and indeed 8 + 0 + 0 + 0 = 8.

## Dice

A dice is a cube with faces numbered 1 to 6. On a STANDARD dice, opposite faces total 7, so the pairs are 1-6, 2-5 and 3-4. If 3 is on top, 4 is underneath.

::: flow Reading two views of the same dice
Find a number that appears in BOTH views :: That face is the hinge. Everything is deduced relative to it.
List what is adjacent to it :: Any face shown next to it in either view cannot be its opposite.
Eliminate :: A face has exactly four neighbours and one opposite. Once four different faces are known to be adjacent to it, the single remaining number must be the opposite one.
Apply the sum rule only if told the dice is standard :: Many questions use a NON-standard dice, where opposite faces need not total 7. In that case the elimination above is the only valid method.
:::

::: mistake
Do not assume opposite faces total 7 unless the question says the dice is standard or ordinary. Plenty of questions supply two or three views precisely because the dice is not standard, and applying the 7 rule there produces a confidently wrong answer.
:::

::: checkpoint
A cube painted on all faces is cut into 125 identical smaller cubes. How many have exactly two faces painted?
- ( ) 27
- (x) 36
- ( ) 54
- ( ) 64
> Here n = 5, so the two-face count is 12(n - 2) = 12 x 3 = 36. Check the full set: 8 + 36 + 6 x 9 + 27 = 8 + 36 + 54 + 27 = 125. Confirmed. The value 54 is the one-face count and 27 is the unpainted count.
:::

::: revision
- Cut into n cubed pieces: 3 faces = 8 always; 2 faces = 12(n-2); 1 face = 6(n-2) squared; 0 faces = (n-2) cubed.
- Verify by adding all four to n cubed.
- On a standard dice opposite faces total 7, pairing 1-6, 2-5 and 3-4.
- With two views, find the common face and eliminate its neighbours.
- Never apply the 7 rule to a dice not stated to be standard.
:::`,
    mcqs: [
      {
        id: "q1",
        text: "A cube painted on all faces is cut into 64 identical smaller cubes. How many have exactly three faces painted?",
        options: ["4", "8", "12", "24"],
        correctIndex: 1,
        explanation: "Only the corner cubes carry three painted faces, and a cube has exactly 8 corners - regardless of how many pieces it is cut into.",
      },
      {
        id: "q2",
        text: "In that same cube cut into 64 pieces, how many smaller cubes have exactly two faces painted?",
        options: ["12", "24", "32", "36"],
        correctIndex: 1,
        explanation: "Here n = 4, so the count is 12(n-2) = 12 x 2 = 24 - the edge cubes, excluding the corners.",
      },
      {
        id: "q3",
        text: "In that same cube cut into 64 pieces, how many have exactly one face painted?",
        options: ["16", "24", "36", "48"],
        correctIndex: 1,
        explanation: "The count is 6(n-2) squared = 6 x 4 = 24 - the cubes in the middle of each of the six faces.",
      },
      {
        id: "q4",
        text: "In that same cube cut into 64 pieces, how many have no face painted at all?",
        options: ["0", "4", "8", "16"],
        correctIndex: 2,
        explanation: "The interior count is (n-2) cubed = 2 cubed = 8. Check: 8 + 24 + 24 + 8 = 64.",
      },
      {
        id: "q5",
        text: "A painted cube is cut into 125 identical smaller cubes. How many have exactly two faces painted?",
        options: ["27", "36", "54", "64"],
        correctIndex: 1,
        explanation: "With n = 5, the two-face count is 12(n-2) = 12 x 3 = 36.",
      },
      {
        id: "q6",
        text: "In that cube cut into 125 pieces, how many smaller cubes remain completely unpainted?",
        options: ["8", "27", "36", "64"],
        correctIndex: 1,
        explanation: "The interior count is (n-2) cubed = 3 cubed = 27.",
      },
      {
        id: "q7",
        text: "On a standard dice, if 3 is on the top face, what number is on the bottom face?",
        options: ["2", "4", "5", "6"],
        correctIndex: 1,
        explanation: "Opposite faces of a standard dice total 7, so the face opposite 3 is 4.",
      },
      {
        id: "q8",
        text: "A cube painted on all faces is cut into 27 identical smaller cubes. How many have exactly one face painted?",
        options: ["6", "8", "12", "1"],
        correctIndex: 0,
        explanation: "With n = 3, the one-face count is 6(n-2) squared = 6 x 1 = 6.",
      },
      {
        id: "q9",
        text: "In that cube cut into 27 pieces, how many have no painted face?",
        options: ["0", "1", "3", "8"],
        correctIndex: 1,
        explanation: "The interior count is (n-2) cubed = 1 cubed = 1 - the single cube at the very centre. Check: 8 + 12 + 6 + 1 = 27.",
      },
      {
        id: "q10",
        text: "For a painted cube cut into n cubed smaller cubes, the number with exactly two painted faces is:",
        options: ["8", "12(n - 2)", "6(n - 2) squared", "(n - 2) cubed"],
        correctIndex: 1,
        explanation: "Two-face cubes lie along the 12 edges, with the two corner cubes of each edge excluded, giving 12(n-2).",
      },
      {
        id: "q11",
        text: "On a standard dice, which pair of numbers can NEVER appear on opposite faces?",
        options: ["1 and 6", "2 and 5", "3 and 4", "2 and 6"],
        correctIndex: 3,
        explanation: "Opposite faces must total 7, giving only the pairs 1-6, 2-5 and 3-4. The pair 2 and 6 sums to 8, so they must be adjacent.",
      },
      {
        id: "q12",
        text: "A cube of side 4 cm is painted and then cut into cubes of side 1 cm. How many smaller cubes are produced in total?",
        options: ["16", "48", "64", "96"],
        correctIndex: 2,
        explanation: "Four pieces fit along each edge, so the total is 4 cubed = 64.",
      },
    ],
    timedQuiz: { timeLimitSeconds: 300, mcqIds: ["q2", "q5", "q6", "q10", "q11"] },
    problemIds: [],
    xpReward: 50, coinReward: 20,
    status: "published",
  },

  // ------------------------------------------------------------------
  // Day 50 - Tuesday 22 Sep 2026 - Ranking, Order & Floor Puzzles
  // ------------------------------------------------------------------
  {
    date: "2026-09-22", dow: "tue", weekId: "2026-09-21", type: "lesson",
    title: "Day 50: Ranking, Order & Floor-Based Puzzles",
    difficulty: "Medium",
    estimatedMinutes: 17,
    concept: `## The Plus One That Decides the Mark

::: story
A student is 12th from the top of the class and 18th from the bottom. How many students are there?

The instinctive answer is 30. It is wrong, and it is wrong for a reason worth internalising: adding the two ranks counts that one student TWICE - once while counting down from the top and once while counting up from the bottom. Subtract the duplicate and the total is 29.

Almost every ranking question in a placement paper is testing whether you remember to add or subtract that single 1. Get the direction right and the topic is free marks.
:::

## The Two Formulas

::: table Which way the 1 goes
You know | You want | Formula | Example
Rank from top and rank from bottom | The TOTAL | top + bottom - 1 | 12th and 18th gives 29
The total and rank from one end | Rank from the OTHER end | total - rank + 1 | 15th from left in a row of 40 gives 26th from right
:::

The two are the same equation rearranged, so a single check keeps them straight: in a row of 10, the person 1st from the left must be 10th from the right. Test the formula - 10 - 1 + 1 = 10. Correct. Any version that gives 9 or 11 is the wrong rearrangement.

::: mistake
Adding the two ranks and stopping is the single most common error in this topic. "12th from top and 18th from bottom" does NOT give 30 students, because the person in question is counted from both directions. Subtract 1. Equally, when converting a rank from one end to the other, you ADD 1 after subtracting - never subtract twice.
:::

## Counting the Gap Between Two People

To count how many people sit BETWEEN two positions, put both on the same scale first, then subtract and take away one more.

  A row of 30. A is 10th from the left. B is 12th from the right.

    convert B to the left scale:  30 - 12 + 1 = 19th from the left
    people strictly between positions 10 and 19:  19 - 10 - 1 = 8

  The final minus one excludes A and B themselves. Answering 9 forgets it.

::: flow Shifting positions
Start from the known end :: "R is 7th from the left" fixes R at position 7 on the left scale.
Apply the shift on the same scale :: Moving 3 places to the RIGHT makes R 7 + 3 = 10th from the left. Moving left would subtract.
Now combine with the other given rank :: If R is then 15th from the right, the total is 10 + 15 - 1 = 24.
Sanity-check the total :: It must be at least as large as either individual rank. A total smaller than a stated rank means a sign went the wrong way.
:::

## Floor and Arrangement Puzzles

These give a handful of constraints and one unique arrangement. The method is always the same: place the ABSOLUTE facts first, then the relative ones.

  Five people A to E live on floors 1 to 5, floor 1 being the lowest.
  C is on the top floor. B is on floor 1. E is on floor 2.
  D lives immediately below A. Who is on floor 3?

    absolute facts first:    C = 5,  B = 1,  E = 2
    floors left:             3 and 4, for A and D
    relative fact:           D is immediately below A, so D = 3 and A = 4

    floor 3 is D.

Statements like "C is on the top floor" pin a person outright and cost nothing to place. Statements like "D is immediately below A" only constrain a relationship, so they are worth more once the grid is already narrow. Working in that order turns most five-person puzzles into two lines.

::: checkpoint
In a row of children, R is 7th from the left end. After moving 3 places to the right, R is 15th from the right end. How many children are in the row?
- ( ) 22
- ( ) 23
- (x) 24
- ( ) 25
> After the shift R stands 7 + 3 = 10th from the left, and is also 15th from the right. Total = 10 + 15 - 1 = 24. Using the pre-shift position 7 instead gives the wrong 21.
:::

::: revision
- Total = rank from top + rank from bottom - 1.
- Rank from the other end = total - rank + 1.
- Verify the direction with the trivial case: in a row of 10, 1st from left is 10th from right.
- People strictly between two positions = difference of positions - 1, after putting both on the same scale.
- Shifting right adds to the left-scale position; shifting left subtracts.
- In arrangement puzzles place absolute facts before relative ones.
:::`,
    mcqs: [
      {
        id: "q1",
        text: "In a class, A is 12th from the top and 18th from the bottom. How many students are in the class?",
        options: ["28", "29", "30", "31"],
        correctIndex: 1,
        explanation: "Total = 12 + 18 - 1 = 29. The subtraction removes A, who was counted from both directions. Answering 30 is the classic slip.",
      },
      {
        id: "q2",
        text: "In a row of 40 people, a person is 15th from the left. What is their position from the right?",
        options: ["25th", "26th", "27th", "28th"],
        correctIndex: 1,
        explanation: "Position from the other end = 40 - 15 + 1 = 26th.",
      },
      {
        id: "q3",
        text: "A student ranks 7th from the top in a class of 45. What is the rank from the bottom?",
        options: ["38th", "39th", "40th", "41st"],
        correctIndex: 1,
        explanation: "Rank from bottom = 45 - 7 + 1 = 39th.",
      },
      {
        id: "q4",
        text: "In a row of 30 people, A is 10th from the left and B is 12th from the right. How many people are strictly between them?",
        options: ["7", "8", "9", "10"],
        correctIndex: 1,
        explanation: "B is 30 - 12 + 1 = 19th from the left. People between positions 10 and 19 number 19 - 10 - 1 = 8, excluding A and B themselves.",
      },
      {
        id: "q5",
        text: "In a queue, P is 8th from the front and Q stands 5 places behind P. What is Q's position from the front?",
        options: ["12th", "13th", "14th", "15th"],
        correctIndex: 1,
        explanation: "Five places behind position 8 is position 8 + 5 = 13.",
      },
      {
        id: "q6",
        text: "There are 29 students in a class and a boy is 12th from the top. What is his rank from the bottom?",
        options: ["17th", "18th", "19th", "20th"],
        correctIndex: 1,
        explanation: "Rank from bottom = 29 - 12 + 1 = 18th.",
      },
      {
        id: "q7",
        text: "For a single person in a line, rank from the top plus rank from the bottom equals:",
        options: ["The total", "The total plus 1", "The total minus 1", "Twice the total"],
        correctIndex: 1,
        explanation: "The person is counted from both ends, so the two ranks sum to one more than the total. Rearranged, total = top + bottom - 1.",
      },
      {
        id: "q8",
        text: "Five people A to E live on floors 1 to 5, with floor 1 lowest. C is on the top floor, B is on floor 1, E is on floor 2, and D lives immediately below A. Who lives on floor 3?",
        options: ["A", "B", "D", "E"],
        correctIndex: 2,
        explanation: "C is on 5, B on 1 and E on 2, leaving floors 3 and 4 for A and D. Since D is immediately below A, D is on 3 and A is on 4.",
      },
      {
        id: "q9",
        text: "A is 5th from the left end and 9th from the right end of a row. How many people are in the row?",
        options: ["12", "13", "14", "15"],
        correctIndex: 1,
        explanation: "Total = 5 + 9 - 1 = 13.",
      },
      {
        id: "q10",
        text: "In a class of 60, a boy's rank is 25th from the top. What is his rank from the bottom?",
        options: ["35th", "36th", "37th", "38th"],
        correctIndex: 1,
        explanation: "Rank from bottom = 60 - 25 + 1 = 36th.",
      },
      {
        id: "q11",
        text: "In a row of children facing north, R is 7th from the left. After shifting 3 places to the right, R becomes 15th from the right end. How many children are in the row?",
        options: ["22", "23", "24", "25"],
        correctIndex: 2,
        explanation: "After the shift R is 7 + 3 = 10th from the left, and 15th from the right, so the total is 10 + 15 - 1 = 24.",
      },
      {
        id: "q12",
        text: "In a row of 25 students, X is 11th when counted from the left. What is X's position from the right?",
        options: ["14th", "15th", "16th", "17th"],
        correctIndex: 1,
        explanation: "Position from the right = 25 - 11 + 1 = 15th.",
      },
    ],
    timedQuiz: { timeLimitSeconds: 300, mcqIds: ["q1", "q4", "q8", "q11", "q12"] },
    problemIds: [],
    xpReward: 50, coinReward: 20,
    status: "published",
  },

  // ------------------------------------------------------------------
  // Day 51 - Wednesday 23 Sep 2026 - Input-Output Machine Reasoning
  // ------------------------------------------------------------------
  {
    date: "2026-09-23", dow: "wed", weekId: "2026-09-21", type: "lesson",
    title: "Day 51: Input-Output Machine Reasoning",
    difficulty: "Medium",
    estimatedMinutes: 18,
    concept: `## A Machine With a Hidden Rule

::: story
You are shown a machine that takes a line of words and numbers and rearranges it one step at a time:

  Input:     25  13  47  8  32
  Step I:     8  25  13  47  32
  Step II:    8  13  25  47  32

Nobody tells you the rule. You have to find it - and once you have, you can produce every remaining step, or answer questions about a completely different input.

Look at Step I: the 8 has jumped to the front and everything else has shifted right, keeping its order. Step II: the 13, the smallest of what remains unsorted, has jumped to second place. The rule is "move the smallest not-yet-placed number to the front". That is the whole puzzle. The rest is bookkeeping.
:::

## Finding the Rule

::: flow How to crack any input-output machine
Compare the input with Step I only :: Ignore later steps at first. Exactly one element usually moves, and identifying WHICH one and WHERE it went is the rule.
Ask what is special about the element that moved :: Is it the smallest number, the largest, the alphabetically first word, the longest word? That property is the selection rule.
Ask where it went :: To the front, to the end, or swapped with a neighbour? That is the placement rule.
Confirm against Step II :: Apply your rule to Step I and check it reproduces Step II exactly. If it does not, the rule is wrong - do not proceed on a rule that only fits one step.
Count how many steps remain :: The machine stops once the line is fully arranged. With n items, a "one item placed per step" machine finishes in at most n - 1 steps, because the last item is forced into place by the others.
:::

## Worked Example - Numbers

  Input:     25  13  47  8  32          the smallest is 8
  Step I:     8  25  13  47  32         8 moved to the front
  Step II:    8  13  25  47  32         13, next smallest, moved to second
  Step III:   8  13  25  32  47         32 moved to fourth; 47 is forced last

  Step III is the final arrangement, so the machine takes 3 steps.

Note there is no Step IV. Once 8, 13, 25 and 32 are placed, 47 has nowhere else to be - it is already correct. With five items the answer is three steps, not four, and that off-by-one is exactly what the "how many steps" question tests.

## Worked Example - Words

The same machine logic runs on words, with alphabetical order replacing numeric order:

  Input:     run  bat  cat  apple
  Step I:    apple  run  bat  cat
  Step II:   apple  bat  run  cat
  Step III:  apple  bat  cat  run

  three steps again.

::: remember
A machine question set usually gives one worked input and then asks about a DIFFERENT input. Do not try to match the new input against the old one's steps - extract the rule from the worked example, then apply it from scratch. The two inputs are related only by the rule.
:::

::: mistake
Do not assume the machine sorts everything in one step. These machines place exactly one element per step and leave the relative order of the others untouched. Writing the fully sorted line as Step I is the fastest way to get every subsequent question wrong.
:::

::: checkpoint
A machine moves the smallest not-yet-placed number to the front at each step. For the input 45 12 78 3 56, what is Step II?
- ( ) 3 12 45 56 78
- (x) 3 12 45 78 56
- ( ) 12 3 45 78 56
- ( ) 3 45 12 78 56
> Step I moves the smallest, 3, to the front: 3 45 12 78 56. Step II moves the next smallest, 12, to second place, keeping the rest in their existing relative order: 3 12 45 78 56. The option 3 12 45 56 78 is the FINAL arrangement, reached only at Step III.
:::

::: revision
- Compare the input with Step I alone to find the rule; confirm it against Step II.
- The rule has two halves: WHICH element is selected, and WHERE it is placed.
- Common selection rules: smallest number, largest number, alphabetically first or last word, longest word.
- Elements not selected keep their relative order.
- With n items and one placement per step, the machine finishes in at most n - 1 steps.
- Apply the extracted rule to a new input from scratch; do not match it against the old steps.
:::`,
    mcqs: [
      {
        id: "q1",
        text: "A machine moves the smallest not-yet-placed number to the front at each step. For input 25 13 47 8 32, what is Step I?",
        options: ["8 25 13 47 32", "8 13 25 32 47", "13 25 47 8 32", "25 13 47 32 8"],
        correctIndex: 0,
        explanation: "The smallest number is 8, which moves to the front while every other number keeps its relative order: 8 25 13 47 32.",
      },
      {
        id: "q2",
        text: "For that same machine and input, what is Step II?",
        options: ["8 13 25 32 47", "8 13 25 47 32", "8 25 13 32 47", "13 8 25 47 32"],
        correctIndex: 1,
        explanation: "After Step I the line is 8 25 13 47 32. The next smallest unplaced number is 13, which moves to second position: 8 13 25 47 32.",
      },
      {
        id: "q3",
        text: "How many steps does that machine need to fully arrange the input 25 13 47 8 32?",
        options: ["2", "3", "4", "5"],
        correctIndex: 1,
        explanation: "Steps place 8, then 13, then 32. After three steps the line reads 8 13 25 32 47 and 47 is already in place, so no fourth step is needed.",
      },
      {
        id: "q4",
        text: "What is the final arrangement produced by that machine for input 25 13 47 8 32?",
        options: ["47 32 25 13 8", "8 13 25 32 47", "8 25 13 32 47", "13 8 25 32 47"],
        correctIndex: 1,
        explanation: "The machine sorts ascending one element at a time, ending at 8 13 25 32 47.",
      },
      {
        id: "q5",
        text: "In Step II of that machine (8 13 25 47 32), which number is third from the left?",
        options: ["13", "25", "47", "32"],
        correctIndex: 1,
        explanation: "The line is 8, 13, 25, 47, 32, so the third element is 25.",
      },
      {
        id: "q6",
        text: "The same machine logic runs alphabetically on words. For input 'run bat cat apple', what is Step II?",
        options: ["apple bat cat run", "apple bat run cat", "apple run bat cat", "bat apple run cat"],
        correctIndex: 1,
        explanation: "Step I moves 'apple' to the front, giving apple run bat cat. Step II moves 'bat', the next alphabetically, to second place: apple bat run cat.",
      },
      {
        id: "q7",
        text: "How many steps does the word machine need for input 'run bat cat apple'?",
        options: ["2", "3", "4", "5"],
        correctIndex: 1,
        explanation: "It places apple, then bat, then cat; after three steps 'run' is already last. So three steps.",
      },
      {
        id: "q8",
        text: "When solving an input-output question, the first thing to establish is:",
        options: ["The rule relating the input to Step I", "The final arrangement", "The number of elements", "Whether the items are words or numbers"],
        correctIndex: 0,
        explanation: "Comparing the input with Step I alone reveals which element was selected and where it was placed. Everything else follows from that rule.",
      },
      {
        id: "q9",
        text: "For the smallest-to-front machine and input 45 12 78 3 56, what is Step I?",
        options: ["3 45 12 78 56", "3 12 45 56 78", "12 45 78 3 56", "45 12 78 56 3"],
        correctIndex: 0,
        explanation: "The smallest number 3 moves to the front, with the others keeping their order: 3 45 12 78 56.",
      },
      {
        id: "q10",
        text: "How many steps does that machine need to arrange 45 12 78 3 56 completely?",
        options: ["2", "3", "4", "5"],
        correctIndex: 1,
        explanation: "It places 3, then 12, then 45, reaching 3 12 45 56 78. At that point 56 and 78 are already correct, so three steps suffice.",
      },
      {
        id: "q11",
        text: "For input 45 12 78 3 56, what is the output of Step III?",
        options: ["3 12 45 78 56", "3 12 45 56 78", "3 45 12 78 56", "12 3 45 56 78"],
        correctIndex: 1,
        explanation: "Step I gives 3 45 12 78 56, Step II gives 3 12 45 78 56, and Step III places 45 correctly, yielding 3 12 45 56 78.",
      },
      {
        id: "q12",
        text: "In Step II for input 45 12 78 3 56, which number stands last?",
        options: ["45", "56", "78", "12"],
        correctIndex: 1,
        explanation: "Step II reads 3 12 45 78 56, so the last number is 56.",
      },
    ],
    timedQuiz: { timeLimitSeconds: 300, mcqIds: ["q2", "q3", "q6", "q10", "q11"] },
    problemIds: [],
    xpReward: 50, coinReward: 20,
    status: "published",
  },

  // ------------------------------------------------------------------
  // Day 52 - Thursday 24 Sep 2026 - Assumptions, Inferences & Conclusions
  // ------------------------------------------------------------------
  {
    date: "2026-09-24", dow: "thu", weekId: "2026-09-21", type: "lesson",
    title: "Day 52: Critical Reasoning - Assumptions, Inferences & Conclusions",
    difficulty: "Medium",
    estimatedMinutes: 18,
    concept: `## Three Words Examiners Refuse to Use Loosely

::: story
"Submit the form before 5 pm to avoid a penalty."

What is the writer taking for granted? That a penalty exists, and that people would rather not pay it. Neither is written down, yet the sentence collapses without them.

What follows FROM the sentence? That forms submitted after 5 pm attract a penalty.

The first is an ASSUMPTION - unstated, and required BEFORE the statement makes sense. The second is an INFERENCE - derived, and available AFTER. Examiners mark these two as different question types, and the single most expensive mistake in this topic is answering one when asked the other.
:::

## The Three Definitions

::: table Before, after and certainly
Term | Where it sits | Test to apply
Assumption | Unstated, required BEFORE the statement can hold | Negate it. If the statement now falls apart, it was an assumption.
Inference | Derived AFTER, from the given facts | Could a reasonable person conclude this from the passage alone?
Conclusion | Follows with certainty, no gaps allowed | Is there ANY way the premises are true and this is false? If yes, it does not follow.
:::

::: flow The negation test, step by step
Take the candidate assumption :: For "Submit before 5 pm to avoid a penalty", consider "A penalty exists for late submission".
Negate it :: Suppose no penalty exists for late submission.
Re-read the original statement :: It now advises avoiding something that cannot happen, which is incoherent.
Conclude :: Because negating it broke the statement, it IS an implicit assumption. If negating it had left the statement perfectly sensible, it was not.
:::

## What Disqualifies a Candidate

An option fails as an assumption when it is any of these:

  ALREADY STATED       An assumption is by definition unstated. If the
                       passage says it outright, it is a fact, not an
                       assumption.

  TOO STRONG           "All students always submit late" goes far beyond
                       what the statement needs. Watch the absolute words -
                       all, never, always, only, every - because they almost
                       always over-claim.

  IRRELEVANT           True, perhaps, but not required for the statement to
                       function.

::: mistake
Beware conclusions that are merely PLAUSIBLE. "All roses are flowers. Some flowers fade quickly. Therefore some roses fade quickly." This feels right and does not follow - the fast-fading flowers might all be tulips. Nothing in the premises connects the roses to the fading subset. For a conclusion question, the standard is certainty, not likelihood.
:::

## Testing a Conclusion

  "No student is lazy. Ram is a student."
  Conclusion: Ram is not lazy.

    If the premises are true, can Ram be lazy? No - he is a student, and no
    student is lazy. There is no escape route, so the conclusion FOLLOWS.

  "Some pens are books. All books are papers."
  Conclusion: Some pens are papers.

    The pens that are books are papers too, since every book is a paper. At
    least one such pen exists because "some pens are books" guarantees it.
    So the conclusion FOLLOWS.

  "All roses are flowers. Some flowers fade quickly."
  Conclusion: Some roses fade quickly.

    The fading flowers need not include any rose. The premises can be true
    while the conclusion is false, so it DOES NOT FOLLOW.

::: remember
Answer strictly from the passage. Outside knowledge, however correct, is not evidence in these questions - and an option that is true in real life but unsupported by the text is the most common trap of all.
:::

::: checkpoint
Statement: "Please submit the form before 5 pm to avoid a penalty." Which of the following is an implicit assumption?
- ( ) Everyone submits their forms late
- (x) A penalty applies to forms submitted after 5 pm
- ( ) The office closes at 5 pm
- ( ) The form is difficult to complete
> Negate the second option: if no penalty applied after 5 pm, the advice would be meaningless, so it is required for the statement to make sense. The first is far too strong, and the third and fourth may be true but the statement works perfectly without them.
:::

::: revision
- Assumption: unstated and required BEFORE. Test by negating it.
- Inference: derived AFTER, from the passage alone.
- Conclusion: must follow with certainty; a single counterexample kills it.
- Reject options that are already stated, too strong, or irrelevant.
- Distrust absolute words - all, never, always, only.
- Plausible is not the same as certain.
- Use only the passage, never outside knowledge.
:::`,
    mcqs: [
      {
        id: "q1",
        text: "Statement: 'Use our shampoo for silky hair.' Which is an implicit assumption?",
        options: ["People want silky hair", "All other shampoos are useless", "The shampoo is inexpensive", "Silky hair is unhealthy"],
        correctIndex: 0,
        explanation: "The advertisement only works if silky hair is something people desire. Negate that and the appeal collapses. The second option is far too strong to be required.",
      },
      {
        id: "q2",
        text: "An assumption differs from an inference in that an assumption is:",
        options: ["Derived after the statement", "Unstated and required before the statement can hold", "Always false", "Explicitly written in the passage"],
        correctIndex: 1,
        explanation: "An assumption is taken for granted beforehand and is never stated; an inference is drawn afterwards from what was stated.",
      },
      {
        id: "q3",
        text: "Statement: 'All roses are flowers. Some flowers fade quickly.' Conclusion: 'Some roses fade quickly.' Does the conclusion follow?",
        options: ["Yes, it follows", "No, it does not follow", "Only if all flowers are roses", "Cannot be determined from any premises"],
        correctIndex: 1,
        explanation: "The quickly-fading flowers need not include a single rose - they could all be tulips. The premises can be true while the conclusion is false, so it does not follow.",
      },
      {
        id: "q4",
        text: "Statement: 'No student is lazy. Ram is a student.' Conclusion: 'Ram is not lazy.' Does the conclusion follow?",
        options: ["Yes, it follows", "No, it does not follow", "Only if Ram works hard", "Only if some students are lazy"],
        correctIndex: 0,
        explanation: "Ram belongs to a category in which no member is lazy, so he cannot be lazy. The conclusion follows with certainty.",
      },
      {
        id: "q5",
        text: "The negation test for an assumption works by:",
        options: ["Assuming the statement is false", "Negating the candidate and checking whether the statement still makes sense", "Finding a real-world counterexample", "Rewriting the statement in the passive voice"],
        correctIndex: 1,
        explanation: "If negating the candidate destroys the statement's coherence, the candidate was genuinely assumed. If the statement survives, it was not an assumption.",
      },
      {
        id: "q6",
        text: "Statement: 'Buy one, get one free - offer valid while stocks last.' Which is an implicit assumption?",
        options: ["The product is of poor quality", "Stocks are limited", "Customers dislike the product", "The offer will be extended"],
        correctIndex: 1,
        explanation: "The phrase 'while stocks last' is meaningless unless stocks could run out, so limited stock is assumed. The other options are neither stated nor required.",
      },
      {
        id: "q7",
        text: "Statement: 'Some pens are books. All books are papers.' Conclusion: 'Some pens are papers.' Does the conclusion follow?",
        options: ["Yes, it follows", "No, it does not follow", "Only if all pens are books", "Only if some papers are pens"],
        correctIndex: 0,
        explanation: "At least one pen is a book, and every book is a paper, so that pen is also a paper. The conclusion follows.",
      },
      {
        id: "q8",
        text: "Which of these would DISQUALIFY an option from being an implicit assumption?",
        options: ["It is unstated in the passage", "It is explicitly stated in the passage", "It is necessary for the statement to hold", "Negating it breaks the statement"],
        correctIndex: 1,
        explanation: "An assumption is by definition unstated. Anything written out explicitly is a given fact, not an assumption.",
      },
      {
        id: "q9",
        text: "Statement: 'The government has closed all schools for a week due to heavy rain.' Which is an implicit assumption?",
        options: ["The rain will stop within a week", "Heavy rain makes it unsafe or impractical for students to attend", "All students live far from their schools", "Schools are never closed otherwise"],
        correctIndex: 1,
        explanation: "The closure only makes sense if the rain poses a genuine problem for attendance. The other options are either too strong or unnecessary to the decision.",
      },
      {
        id: "q10",
        text: "In critical reasoning questions, an option that is true in the real world but unsupported by the passage should be:",
        options: ["Accepted, since it is true", "Rejected, because these questions are answered from the passage alone", "Accepted only for inference questions", "Accepted only for assumption questions"],
        correctIndex: 1,
        explanation: "These questions test reasoning from the given text. Outside knowledge, however accurate, is not evidence and is the most common trap in the topic.",
      },
      {
        id: "q11",
        text: "Which word in an answer option should most raise your suspicion in an assumption question?",
        options: ["Some", "Often", "All", "May"],
        correctIndex: 2,
        explanation: "Absolute words like all, never, always and only usually over-claim well beyond what a statement actually needs. Hedged words are far more often correct.",
      },
      {
        id: "q12",
        text: "A conclusion is said to follow only when:",
        options: ["It is probably true given the premises", "There is no way for the premises to be true and the conclusion false", "It matches common experience", "It is stated in the passage"],
        correctIndex: 1,
        explanation: "Conclusions are judged by certainty. If even one scenario makes the premises true and the conclusion false, it does not follow.",
      },
    ],
    timedQuiz: { timeLimitSeconds: 300, mcqIds: ["q1", "q3", "q5", "q9", "q12"] },
    problemIds: [],
    xpReward: 50, coinReward: 20,
    status: "published",
  },

  // ------------------------------------------------------------------
  // Day 53 - Friday 25 Sep 2026 - Cause & Effect, Course of Action, Arguments
  // ------------------------------------------------------------------
  {
    date: "2026-09-25", dow: "fri", weekId: "2026-09-21", type: "lesson",
    title: "Day 53: Cause & Effect, Course of Action & Argument Strength",
    difficulty: "Medium",
    estimatedMinutes: 18,
    concept: `## Judgement Questions, and Why They Are Not Opinion Questions

::: story
"The city has seen a sharp rise in dengue cases. Course of action: the municipal body should launch a fogging and awareness drive."

Is that a proper course of action? Yes - it addresses the stated problem directly, it is within the authority of the body named, and it is practical.

"Course of action: the city should be evacuated." Also a response to the same problem, and plainly improper - disproportionate and unimplementable.

Nobody is asking your opinion about dengue. These questions have consistent marking criteria, and the whole skill is knowing them.
:::

## Cause and Effect

Given two statements, decide how they relate. Four verdicts are possible:

::: table The four relationships
Verdict | When to choose it
I is the cause, II is the effect | I happened first and plausibly produced II
II is the cause, I is the effect | The reverse ordering
Both are effects of a common cause | Neither produced the other, but one shared factor explains both
Both are independent causes | Two unrelated events with no shared explanation
:::

TIME ORDER IS THE FIRST FILTER. An effect cannot precede its cause. If statement II describes something that happened LAST week and statement I describes something that happened YESTERDAY, then II cannot be the effect of I, no matter how well the two fit together thematically.

  I: Heavy rainfall lashed the city yesterday.
  II: Several roads were waterlogged this morning.

    I came first and plausibly produced II, so I is the cause and II the effect.

  I: The price of onions rose sharply.
  II: The price of petrol rose sharply.

    Neither causes the other and no single stated factor explains both, so
    these are independent causes.

## Course of Action

A suggested action is PROPER when it passes all three of these:

::: flow The three tests for a course of action
Relevance :: Does it address the problem actually stated, rather than a different one? A drive against mosquito breeding is relevant to dengue; a drive against littering is not.
Practicality :: Can it actually be carried out with ordinary resources and authority? Evacuating a city fails here, however sincerely meant.
Proportionality :: Is it in scale with the problem? Extreme responses to moderate problems are marked improper, as are token responses to severe ones.
:::

Actions that merely EXPRESS AN ATTITUDE - "the government should take this seriously" - are not courses of action at all. A course of action is a concrete, doable step.

## Strong and Weak Arguments

An argument is STRONG when it is directly related to the question AND addresses a substantial, real aspect of it. It is WEAK when it is any of the following:

  trivial or minor relative to the question
  based on an unwarranted assumption or a personal preference
  merely comparative - "other countries do it too"
  a restatement of the question rather than a reason
  an appeal to how things have always been done

  "Should smoking be banned in public places?"

    Yes, because passive smoking demonstrably harms non-smokers.
        STRONG - directly relevant, and a substantial public-health point.

    No, because people enjoy smoking.
        WEAK - personal preference, and it does not engage with the harm
        to others that the question is really about.

    No, because other countries have not banned it either.
        WEAK - a comparison is not a reason. What others do says nothing
        about whether the ban is justified here.

::: mistake
Do not confuse "I agree with this" with "this is a strong argument". Strength is about logical relevance and substance, not about whether the conclusion matches your own view. An argument you personally disagree with can be strong, and one you agree with can be weak.
:::

::: remember
For course-of-action questions, more than one suggested action may be proper, and the answer options frequently take the form "only I follows", "only II follows", "both follow" or "neither follows". Evaluate each action independently against all three tests before looking at the combinations.
:::

::: checkpoint
Statement: "Many students in the district fail mathematics every year." Which is a proper course of action?
- ( ) Mathematics should be removed from the syllabus
- (x) Remedial mathematics classes should be organised for weak students
- ( ) Students who fail should be expelled
- ( ) The results should not be published
> Remedial classes are relevant to the stated problem, practical to arrange, and proportionate. Removing the subject and expelling students are disproportionate and do not solve the underlying difficulty, and suppressing results addresses only the reporting, not the failure.
:::

::: revision
- Cause and effect: check TIME ORDER first; an effect cannot precede its cause.
- The four verdicts include both a common-cause option and an independent-causes option.
- A course of action must be relevant, practical and proportionate.
- Attitude statements are not courses of action; only concrete steps are.
- A strong argument is directly relevant and substantial.
- Weak markers: trivial, personal preference, mere comparison, restatement, appeal to tradition.
- Judge argument strength by logic, never by whether you agree with the conclusion.
:::`,
    mcqs: [
      {
        id: "q1",
        text: "An argument is considered STRONG when it is:",
        options: ["Directly relevant to the question and addresses a substantial aspect of it", "Emotionally persuasive", "Consistent with your own opinion", "Longer and more detailed than the alternatives"],
        correctIndex: 0,
        explanation: "Strength is assessed on logical relevance and substance. Persuasiveness, length and personal agreement are all irrelevant to the marking criteria.",
      },
      {
        id: "q2",
        text: "Statement: 'The city has seen a sharp rise in dengue cases.' Is 'the municipal body should launch a fogging and awareness drive' a proper course of action?",
        options: ["Yes, it is relevant, practical and proportionate", "No, it is too expensive", "No, dengue cannot be controlled", "Yes, but only if cases keep rising"],
        correctIndex: 0,
        explanation: "The action addresses the stated problem directly, lies within the named body's authority, and is proportionate to the situation - so it passes all three tests.",
      },
      {
        id: "q3",
        text: "Which of these is NOT a proper course of action for a rise in dengue cases?",
        options: ["Launching an awareness campaign", "Fogging affected localities", "Evacuating the entire city", "Increasing hospital bed capacity"],
        correctIndex: 2,
        explanation: "Evacuating a city fails both the practicality and proportionality tests. The other three are relevant, doable and in scale with the problem.",
      },
      {
        id: "q4",
        text: "Statement I: Heavy rainfall lashed the city yesterday. Statement II: Several roads were waterlogged this morning. What is the relationship?",
        options: ["I is the cause and II is the effect", "II is the cause and I is the effect", "Both are effects of a common cause", "Both are independent causes"],
        correctIndex: 0,
        explanation: "The rainfall came first and plausibly produced the waterlogging, so I is the cause and II is the effect.",
      },
      {
        id: "q5",
        text: "Question: 'Should smoking be banned in public places?' Argument: 'Yes, because passive smoking harms non-smokers.' This argument is:",
        options: ["Strong", "Weak", "Irrelevant", "A restatement of the question"],
        correctIndex: 0,
        explanation: "It is directly relevant to the question of a PUBLIC ban and raises a substantial harm to third parties, which is precisely what the question turns on.",
      },
      {
        id: "q6",
        text: "Question: 'Should smoking be banned in public places?' Argument: 'No, because people enjoy smoking.' This argument is:",
        options: ["Strong", "Weak", "Strong if most people smoke", "Neither strong nor weak"],
        correctIndex: 1,
        explanation: "It rests on personal preference and does not engage with the harm to others that a public ban is designed to address, so it is weak.",
      },
      {
        id: "q7",
        text: "When two statements describe events with no causal link between them but which share one underlying explanation, the correct verdict is:",
        options: ["I is the cause of II", "II is the cause of I", "Both are effects of a common cause", "Both are independent causes"],
        correctIndex: 2,
        explanation: "A shared underlying factor producing both events is exactly the common-cause verdict.",
      },
      {
        id: "q8",
        text: "Statement: 'Many students fail mathematics every year in the district.' Which is a proper course of action?",
        options: ["Mathematics should be dropped from the syllabus", "Remedial classes should be organised for weak students", "Failing students should be expelled", "Results should no longer be published"],
        correctIndex: 1,
        explanation: "Remedial classes are relevant, practical and proportionate. The others are disproportionate or address only the symptom rather than the difficulty.",
      },
      {
        id: "q9",
        text: "Question: 'Should India invest more in space research?' Argument: 'No, because other countries also invest in it.' This argument is:",
        options: ["Strong", "Weak, because a comparison is not a reason", "Strong, because it cites international practice", "Irrelevant to any question"],
        correctIndex: 1,
        explanation: "What other countries do says nothing about whether the investment is justified here. Mere comparison is a standard marker of a weak argument.",
      },
      {
        id: "q10",
        text: "In a cause-and-effect question, why does the time order of the two events matter?",
        options: ["It does not matter at all", "An effect cannot occur before its cause", "The later event is always the cause", "Both events must occur simultaneously"],
        correctIndex: 1,
        explanation: "Causation runs forward in time, so an event that happened earlier cannot be the effect of one that happened later. Checking the order is the first filter.",
      },
      {
        id: "q11",
        text: "Which of these fails to qualify as a course of action at all?",
        options: ["Organising additional training sessions", "Issuing a public notice about the deadline", "The authorities should take the matter seriously", "Deploying extra staff at the counters"],
        correctIndex: 2,
        explanation: "Taking a matter seriously expresses an attitude rather than specifying a concrete, doable step, so it is not a course of action.",
      },
      {
        id: "q12",
        text: "Statement I: The price of onions rose sharply. Statement II: The price of petrol rose sharply. The most reasonable verdict is:",
        options: ["I is the cause and II is the effect", "II is the cause and I is the effect", "Both are effects of a common cause", "Both are independent causes"],
        correctIndex: 3,
        explanation: "Neither price rise produces the other, and no single stated factor links them, so they are best treated as independent causes.",
      },
    ],
    timedQuiz: { timeLimitSeconds: 300, mcqIds: ["q3", "q4", "q6", "q9", "q11"] },
    problemIds: [],
    xpReward: 50, coinReward: 20,
    status: "published",
  },

  // ------------------------------------------------------------------
  // Day 54 - Saturday 26 Sep 2026 - Week 9 Recap
  // ------------------------------------------------------------------
  {
    date: "2026-09-26", dow: "sat", weekId: "2026-09-21", type: "lesson",
    title: "Day 54: Week 9 Recap - Advanced Reasoning",
    difficulty: "Medium",
    estimatedMinutes: 20,
    concept: `## Two Halves of One Week

::: story
Monday through Wednesday had exact answers. A cube cut into 125 pieces has exactly 36 two-face cubes; a person 12th from the top and 18th from the bottom sits in a class of exactly 29; a machine given 25 13 47 8 32 produces exactly 8 25 13 47 32 at Step I.

Thursday and Friday had no formulas at all - and yet they are not opinion questions. They have published criteria, and applying those criteria consistently is what earns the marks. Knowing which half of the week a question belongs to is the first decision to make.
:::

## The Week on One Page

::: table What to reach for
If the question involves... | Use
A painted cube cut into pieces | 8 corners; 12(n-2) edges; 6(n-2) squared faces; (n-2) cubed interior - and they must total n cubed
A dice | Standard means opposite faces total 7; otherwise eliminate using adjacency from two views
Ranks from both ends | Total = top + bottom - 1
A rank and the total | Other end = total - rank + 1
People between two positions | Put both on one scale, subtract, then subtract 1 more
A floor or seating puzzle | Place absolute facts first, relative facts second
An input-output machine | Compare input with Step I to get the rule, confirm on Step II, then apply from scratch
An implicit assumption | Negate it and see whether the statement still makes sense
A conclusion | Demand certainty; one counterexample is enough to reject it
A course of action | Test relevance, practicality and proportionality
Argument strength | Directly relevant and substantial means strong; preference, comparison or triviality means weak
:::

## The Traps That Cost the Most Marks

::: mistake
1. Ranking: total = top + bottom MINUS 1. Forgetting the subtraction is the single most common error in the whole reasoning section.
2. Cubes: three-painted-faces is always 8, and the four counts must sum to n cubed. Check it every time.
3. Dice: never apply the "opposites total 7" rule unless the dice is stated to be standard.
4. Machines: only ONE element moves per step; writing the fully sorted line as Step I loses every follow-up question.
5. Assumptions: an option already stated in the passage cannot be an assumption.
6. Arguments: judge on logic, not on whether you agree with the conclusion.
:::

::: remember
For judgement questions, read the answer options before deciding. Assumption and course-of-action sets often ask "only I", "only II", "both" or "neither", so each item has to be evaluated on its own merits before the combination is chosen. Deciding the combination first and then justifying it is how careless marks are lost.
:::

::: checkpoint
A cube painted on all faces is cut into 216 identical smaller cubes. How many have exactly one face painted?
- ( ) 24
- ( ) 48
- (x) 96
- ( ) 150
> Since 216 = 6 cubed, n = 6. The one-face count is 6(n-2) squared = 6 x 16 = 96. Full check: 8 + 12 x 4 + 96 + 4 cubed = 8 + 48 + 96 + 64 = 216. Confirmed.
:::

::: revision
- Cube counts: 8 corners, 12(n-2) edges, 6(n-2) squared faces, (n-2) cubed interior; they sum to n cubed.
- Standard dice: opposite faces total 7, pairing 1-6, 2-5, 3-4.
- Total = top rank + bottom rank - 1; other end = total - rank + 1.
- Between two positions: same scale, subtract, minus 1.
- Machines move one element per step and preserve the others' relative order.
- Assumption: unstated and necessary; test by negation.
- Conclusion: must hold with certainty.
- Course of action: relevant, practical, proportionate.
- Strong argument: directly relevant and substantial, regardless of your own view.
:::`,
    mcqs: [
      {
        id: "q1",
        text: "A cube painted on all faces is cut into 216 identical smaller cubes. How many have exactly one face painted?",
        options: ["24", "48", "96", "150"],
        correctIndex: 2,
        explanation: "216 = 6 cubed, so n = 6 and the one-face count is 6(n-2) squared = 6 x 16 = 96.",
      },
      {
        id: "q2",
        text: "In that same cube cut into 216 pieces, how many have exactly two faces painted?",
        options: ["24", "48", "64", "96"],
        correctIndex: 1,
        explanation: "The count is 12(n-2) = 12 x 4 = 48.",
      },
      {
        id: "q3",
        text: "In a row, B is 9th from the left and 14th from the right. How many people are in the row?",
        options: ["21", "22", "23", "24"],
        correctIndex: 1,
        explanation: "Total = 9 + 14 - 1 = 22.",
      },
      {
        id: "q4",
        text: "In a class of 50, a student ranks 18th from the bottom. What is the rank from the top?",
        options: ["32nd", "33rd", "34th", "35th"],
        correctIndex: 1,
        explanation: "Rank from the top = 50 - 18 + 1 = 33rd.",
      },
      {
        id: "q5",
        text: "On a standard dice, if 2 is on the top face, what is on the bottom?",
        options: ["3", "4", "5", "6"],
        correctIndex: 2,
        explanation: "Opposite faces of a standard dice total 7, so the face opposite 2 is 5.",
      },
      {
        id: "q6",
        text: "A machine moves the smallest not-yet-placed number to the front at each step. For input 30 9 21 4, what is Step I?",
        options: ["4 30 9 21", "4 9 21 30", "9 30 21 4", "30 9 4 21"],
        correctIndex: 0,
        explanation: "The smallest number, 4, moves to the front while the rest keep their relative order: 4 30 9 21.",
      },
      {
        id: "q7",
        text: "For that machine and input 30 9 21 4, how many steps are needed to fully arrange it?",
        options: ["1", "2", "3", "4"],
        correctIndex: 2,
        explanation: "Step I gives 4 30 9 21, Step II places 9 to give 4 9 30 21, and Step III places 21 to give 4 9 21 30. Three steps. Stopping at two is the trap - after Step II the last pair 30 and 21 is still out of order.",
      },
      {
        id: "q8",
        text: "Statement: 'Carry an umbrella; it may rain today.' Which is an implicit assumption?",
        options: ["It always rains at this time of year", "An umbrella offers protection from rain", "The listener dislikes rain intensely", "It will definitely rain"],
        correctIndex: 1,
        explanation: "The advice only makes sense if an umbrella helps against rain. Negating that makes the suggestion pointless. The other options are too strong or unnecessary.",
      },
      {
        id: "q9",
        text: "Statement: 'All engineers are graduates. Some graduates are unemployed.' Conclusion: 'Some engineers are unemployed.' Does it follow?",
        options: ["Yes, it follows", "No, it does not follow", "Only if all graduates are engineers", "Only if no engineer is employed"],
        correctIndex: 1,
        explanation: "The unemployed graduates need not include any engineer. The premises can be true while the conclusion is false, so it does not follow.",
      },
      {
        id: "q10",
        text: "Statement: 'Road accidents have increased sharply on the highway.' Which is a proper course of action?",
        options: ["The highway should be permanently closed", "Speed limits should be enforced and signage improved", "Driving should be banned nationwide", "Accident reports should be withheld"],
        correctIndex: 1,
        explanation: "Enforcement and signage are relevant, practical and proportionate. Closing the highway or banning driving fail proportionality, and withholding reports addresses only the reporting.",
      },
      {
        id: "q11",
        text: "Statement I: The school declared a holiday today. Statement II: A cyclone warning was issued for the region yesterday. The most reasonable verdict is:",
        options: ["I is the cause and II is the effect", "II is the cause and I is the effect", "Both are effects of a common cause", "Both are independent causes"],
        correctIndex: 1,
        explanation: "The warning came first and plausibly prompted the holiday, so II is the cause and I is the effect. Time order rules out the reverse.",
      },
      {
        id: "q12",
        text: "Which marker most reliably identifies a WEAK argument?",
        options: ["It cites verifiable data", "It rests on personal preference or mere comparison with others", "It disagrees with the questioner", "It is stated briefly"],
        correctIndex: 1,
        explanation: "Preference and comparison are classic weak markers because neither engages with the substance of the question. Brevity and disagreement say nothing about strength.",
      },
    ],
    timedQuiz: { timeLimitSeconds: 300, mcqIds: ["q1", "q3", "q5", "q9", "q10"] },
    problemIds: [],
    xpReward: 80, coinReward: 30,
    status: "published",
  },

];
