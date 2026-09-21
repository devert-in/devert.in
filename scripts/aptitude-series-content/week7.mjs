// DeVert Campus - Aptitude Series, Week 7: Number Theory & the Algebra Toolkit
// (Mon 7 Sep - Sat 12 Sep 2026). Days 37-42.
//
// Continues straight on from week 6 (Days 31-36: Ages, Partnership, Quadratic
// Comparison, Height & Distance, Venn/Set Theory). Week 6 reached quadratics
// but the track has still never covered the number-theory layer that TCS,
// Infosys, Wipro and Capgemini papers lean on hardest - divisibility, factor
// counting, remainders, cyclicity - nor surds/indices/logarithms, nor
// progressions, nor plain linear equations and inequalities. This week is
// that whole missing toolkit, ordered so each day feeds the next: factors
// (37) make remainders (38) readable, indices (39) make GP (40) obvious, and
// equations (41) is the technique every earlier week silently assumed.
//
// Day 42 is the week-scoped Saturday recap, matching the shape Days 6/12/18/
// 24/36 used (NOT the full-series shape Day 30 used).
//
// NOTE ON THE GAP: the aptitude track's last live item is 2026-09-05 (Day 36).
// Nothing was seeded for the weeks of 09-07 or 09-14. This file and week8's
// backfill that hole, authored 2026-09-21 at the maintainer's request to fill
// from where the series left off through month end. A day completed after its
// own date still records completion and counts toward progress and streak
// history, but earns no XP/coins (lib/dailyLearning.js), so weeks 7-8 are
// archive/continuity content and weeks 9-10 are the earnable ones.
//
// Placement-aptitude prep for engineering students sitting TCS / Infosys /
// Accenture / Cognizant / Capgemini / Wipro / Deloitte / Oracle / Amazon /
// Microsoft / Google campus rounds.
//
// AUTHORING RULES (identical to week1.mjs/week5.mjs/week6.mjs - those files
// are the reference):
//
//  1. `concept` is ONE string parsed by devert-frontend/lib/lessonBlocks.js.
//     Fence syntax is `::: variant optional title` ... `:::`, each on its own
//     line. Inside a `flow` fence NEVER write "->" in a step body - the parser
//     splits flow lines on it. Inside a `table` fence NEVER write a literal
//     "|" in cell text - it is the column separator. Two-space-indented lines
//     become code blocks, so traced arithmetic is indented on purpose.
//  2. Story or concrete number FIRST, technical name SECOND. Never open a
//     lesson with a formula. Day 42 is the deliberate exception: it is a
//     recap day, so it opens on "look how far this week took you" instead.
//  3. Callouts are used sparingly: one `mistake`, one `remember`/`funfact`,
//     exactly one `checkpoint`, and a closing `revision` that works as a
//     30-second pre-exam re-read.
//  4. MCQ shape is `{ id, text, options, correctIndex, explanation }` -
//     `text`, NOT `question`. `correctIndex` is 0-based into that question's
//     own `options`. Every answer below was hand-derived step by step and
//     re-verified; every explanation shows the load-bearing step.
//  5. Wrong options are real miscalculations a student would actually make,
//     never filler.
//  6. `timedQuiz.mcqIds` are 5 ids drawn from that same day's `mcqs`.
//  7. ASCII hyphens only - scripts/normalize-dashes.mjs rewrites em/en dashes
//     across the database, so authoring them here just creates churn.

export const WEEK7_DAYS = [

  // ------------------------------------------------------------------
  // Day 37 - Monday 7 Sep 2026 - Divisibility Rules & Counting Factors
  // ------------------------------------------------------------------
  {
    date: "2026-09-07", dow: "mon", weekId: "2026-09-07", type: "lesson",
    title: "Day 37: Divisibility Rules & Counting Factors",
    difficulty: "Medium",
    estimatedMinutes: 18,
    concept: `## The Question Behind Half the Number Questions

::: story
An examiner asks: how many factors does 72 have? You could start listing - 1, 2, 3, 4, 6, 8, 9, 12 - lose your place around 18, and finish in ninety seconds with a count you do not trust.

Or you could write 72 as 2 x 2 x 2 x 3 x 3, notice that is 2 cubed times 3 squared, and say "twelve" in four seconds flat, with complete certainty.

The second student is not faster at arithmetic. They know that once a number is broken into primes, almost every question about it - how many factors, what they sum to, how many are even, is it a perfect square - has a formula waiting. Prime factorisation is the single highest-return habit in quantitative aptitude.
:::

## The Divisibility Rules Worth Memorising

::: table Test a number without dividing it
Divisor | Test | Example
2 | Last digit is even | 4736 ends in 6, divisible
3 | Digit sum divisible by 3 | 4251 gives 4+2+5+1 = 12, divisible
4 | Last TWO digits divisible by 4 | 7316 ends in 16, divisible
5 | Last digit is 0 or 5 | 8435 ends in 5, divisible
6 | Passes BOTH the 2 test and the 3 test | 4512 is even and digit sum 12, divisible
8 | Last THREE digits divisible by 8 | 51240 ends in 240, divisible
9 | Digit sum divisible by 9 | 6318 gives 6+3+1+8 = 18, divisible
10 | Last digit is 0 | 7890 ends in 0, divisible
11 | Alternating digit sum is 0 or a multiple of 11 | 4257 gives 4-2+5-7 = 0, divisible
:::

The rule for 11 is the one candidates skip and examiners love. Take the digits alternately plus and minus, left to right, and check whether the result is 0 or a multiple of 11.

  4257  ->  4 - 2 + 5 - 7 = 0        divisible by 11  (4257 = 11 x 387)
  9075  ->  9 - 0 + 7 - 5 = 11       divisible by 11  (9075 = 11 x 825)
  1234  ->  1 - 2 + 3 - 4 = -2       NOT divisible

## Prime Factorisation, Then Four Formulas

Write N as a product of prime powers:

  N = p1^a1 x p2^a2 x p3^a3 x ...

  72  = 2^3 x 3^2
  60  = 2^2 x 3^1 x 5^1
  360 = 2^3 x 3^2 x 5^1

::: flow What the exponents tell you
Number of factors :: Multiply each exponent after adding one. For 72 = 2^3 x 3^2 this is (3+1)(2+1) = 12. Every factor is built by choosing how many 2s (0, 1, 2 or 3) and how many 3s (0, 1 or 2), so the count is just the number of choices.
Sum of factors :: For each prime take 1 + p + p^2 up to p^a, then multiply those totals. For 60 this is (1+2+4)(1+3)(1+5) = 7 x 4 x 6 = 168.
Number of EVEN factors :: Force at least one 2. For 72 that leaves 3 choices for the power of 2 (namely 1, 2 or 3) times 3 choices for the 3s, giving 9 even factors.
Number of ODD factors :: Delete the 2s entirely and count the rest. For 72 that is just 3^2, giving (2+1) = 3 odd factors. Check: 9 even + 3 odd = 12 total.
:::

## Writing a Number as a Product of Two Factors

Factors pair up: for 36, the pair (2, 18) is the same split as (18, 2). So the number of ways is half the factor count - except when N is a perfect square, because then the middle factor pairs with itself and has no partner.

  36 = 2^2 x 3^2  ->  (2+1)(2+1) = 9 factors
  9 is odd, so 36 IS a perfect square (6 x 6 is the self-pair)
  number of ways = (9 + 1) / 2 = 5

  namely  1x36,  2x18,  3x12,  4x9,  6x6

  48 = 2^4 x 3  ->  (4+1)(1+1) = 10 factors, not a perfect square
  number of ways = 10 / 2 = 5

::: remember
A number has an ODD number of factors if and only if it is a perfect square. That single fact answers a surprising number of questions on its own - including the classic "100 lockers, 100 students" puzzle, where only the perfect-square lockers end up open.
:::

## Highest Power of a Prime in a Factorial

How many zeros does 50! end in? Every trailing zero is a factor of 10 = 2 x 5, and there are always more 2s than 5s, so just count the 5s:

  floor(50 / 5)   = 10      (multiples of 5 contribute one 5 each)
  floor(50 / 25)  = 2       (multiples of 25 contribute a SECOND 5)
  floor(50 / 125) = 0       (stop once the divisor exceeds 50)

  total = 10 + 2 = 12 trailing zeros

Keep dividing by increasing powers of the prime, take the floor each time, and add.

::: mistake
The commonest error here is counting only floor(50/5) = 10 and stopping. Numbers like 25 and 50 carry TWO factors of 5, and 125 would carry three. Always continue to the next power until the quotient is 0.
:::

## Remainder Problems Built on LCM

"What is the smallest number which, when divided by 12, 15 and 18, leaves remainder 5 each time?"

  A number leaving the SAME remainder r under several divisors is
  (a common multiple of those divisors) + r.

  LCM(12, 15, 18):  12 = 2^2 x 3,  15 = 3 x 5,  18 = 2 x 3^2
                    take the highest power of each prime: 2^2 x 3^2 x 5 = 180

  smallest such number = 180 + 5 = 185

  check: 185 = 12x15 + 5,  185 = 15x12 + 5,  185 = 18x10 + 5.  Confirmed.

::: checkpoint
How many factors of 180 are even?
- ( ) 9
- ( ) 10
- (x) 12
- ( ) 18
> 180 = 2^2 x 3^2 x 5. Total factors = (2+1)(2+1)(1+1) = 18. For an EVEN factor the power of 2 must be 1 or 2, so 2 choices, times (2+1) for the 3s, times (1+1) for the 5 = 2 x 3 x 2 = 12. Check: odd factors = 3^2 x 5 gives (2+1)(1+1) = 6, and 12 + 6 = 18. Confirmed.
:::

::: revision
- Rule for 11: alternate plus and minus across the digits; 0 or a multiple of 11 means divisible.
- Rule for 4 is the last two digits; for 8 it is the last three.
- Factorise into primes first. Number of factors = product of (exponent + 1).
- Sum of factors = product of (1 + p + ... + p^a) over each prime.
- Even factors: force one 2. Odd factors: drop the 2s.
- Ways to write N as a product of two factors = factor count / 2, or (count + 1)/2 if N is a perfect square.
- Odd factor count means perfect square.
- Trailing zeros of n!: add floor(n/5) + floor(n/25) + floor(n/125) + ...
- Same remainder r under several divisors: answer is LCM + r.
:::`,
    mcqs: [
      {
        id: "q1",
        text: "How many factors does 72 have?",
        options: ["10", "11", "12", "14"],
        correctIndex: 2,
        explanation: "72 = 2^3 x 3^2. Number of factors = (3+1)(2+1) = 4 x 3 = 12. Listing confirms: 1, 2, 3, 4, 6, 8, 9, 12, 18, 24, 36, 72 - twelve of them.",
      },
      {
        id: "q2",
        text: "What is the sum of all the factors of 60?",
        options: ["144", "168", "180", "196"],
        correctIndex: 1,
        explanation: "60 = 2^2 x 3 x 5. Sum = (1+2+4) x (1+3) x (1+5) = 7 x 4 x 6 = 168. Check by listing: 1+2+3+4+5+6+10+12+15+20+30+60 = 168. Confirmed.",
      },
      {
        id: "q3",
        text: "Which of these numbers is divisible by 11?",
        options: ["4257", "4258", "4259", "4256"],
        correctIndex: 0,
        explanation: "Alternating sum for 4257: 4 - 2 + 5 - 7 = 0, which is a multiple of 11, so it is divisible. Indeed 4257 = 11 x 387. The others give -1, -2 and -3 respectively.",
      },
      {
        id: "q4",
        text: "How many factors of 72 are even?",
        options: ["6", "8", "9", "12"],
        correctIndex: 2,
        explanation: "72 = 2^3 x 3^2. An even factor must contain at least one 2, so the power of 2 is 1, 2 or 3 (3 choices) and the power of 3 is 0, 1 or 2 (3 choices): 3 x 3 = 9. Check: odd factors = (2+1) = 3, and 9 + 3 = 12 total. Confirmed.",
      },
      {
        id: "q5",
        text: "What is the smallest positive integer by which 1008 must be multiplied to make it a perfect square?",
        options: ["2", "3", "7", "14"],
        correctIndex: 2,
        explanation: "1008 = 16 x 63 = 2^4 x 3^2 x 7. A perfect square needs every exponent even; 2^4 and 3^2 are fine but 7 appears once. Multiplying by 7 gives 2^4 x 3^2 x 7^2 = (2^2 x 3 x 7)^2 = 84^2 = 7056.",
      },
      {
        id: "q6",
        text: "How many numbers from 1 to 100 inclusive are divisible by 3 or by 5?",
        options: ["45", "47", "50", "53"],
        correctIndex: 1,
        explanation: "Divisible by 3: floor(100/3) = 33. By 5: floor(100/5) = 20. By both, i.e. by 15: floor(100/15) = 6. By inclusion-exclusion, 33 + 20 - 6 = 47.",
      },
      {
        id: "q7",
        text: "In how many ways can 36 be written as a product of two factors?",
        options: ["4", "5", "8", "9"],
        correctIndex: 1,
        explanation: "36 = 2^2 x 3^2, so it has (2+1)(2+1) = 9 factors. The count is odd, so 36 is a perfect square and the number of ways is (9+1)/2 = 5: namely 1x36, 2x18, 3x12, 4x9 and 6x6.",
      },
      {
        id: "q8",
        text: "What is the highest power of 5 that divides 100! exactly?",
        options: ["20", "22", "24", "25"],
        correctIndex: 2,
        explanation: "Add floor(100/5) = 20, floor(100/25) = 4, floor(100/125) = 0. Total = 24. The multiples of 25 each supply a second factor of 5, which is why 20 alone is wrong.",
      },
      {
        id: "q9",
        text: "A number is divisible by 8 if and only if:",
        options: ["Its digit sum is divisible by 8", "Its last three digits form a number divisible by 8", "Its last two digits form a number divisible by 8", "Its alternating digit sum is divisible by 8"],
        correctIndex: 1,
        explanation: "Because 1000 is divisible by 8, everything above the last three digits is automatically a multiple of 8, so only the last three digits decide it. The last-TWO-digits test is the rule for 4, not 8.",
      },
      {
        id: "q10",
        text: "What is the smallest number which, when divided by 12, 15 and 18, leaves a remainder of 5 in each case?",
        options: ["175", "180", "185", "190"],
        correctIndex: 2,
        explanation: "The number is LCM(12, 15, 18) + 5. LCM = 2^2 x 3^2 x 5 = 180, so the answer is 185. Check: 185 - 5 = 180 is divisible by all three.",
      },
      {
        id: "q11",
        text: "How many trailing zeros does 50! have?",
        options: ["10", "11", "12", "14"],
        correctIndex: 2,
        explanation: "Trailing zeros are governed by factors of 5. floor(50/5) = 10, floor(50/25) = 2, floor(50/125) = 0. Total = 12.",
      },
      {
        id: "q12",
        text: "Which of these numbers is divisible by 7?",
        options: ["1073", "1074", "1071", "1072"],
        correctIndex: 2,
        explanation: "7 x 153 = 1071 exactly. The neighbours leave remainders: 1072 gives 1, 1073 gives 2 and 1074 gives 3.",
      },
    ],
    timedQuiz: { timeLimitSeconds: 300, mcqIds: ["q1", "q3", "q5", "q8", "q10"] },
    problemIds: [],
    xpReward: 50, coinReward: 20,
    status: "published",
  },

  // ------------------------------------------------------------------
  // Day 38 - Tuesday 8 Sep 2026 - Remainders & Unit Digit Cyclicity
  // ------------------------------------------------------------------
  {
    date: "2026-09-08", dow: "tue", weekId: "2026-09-07", type: "lesson",
    title: "Day 38: Remainders & Unit Digit Cyclicity",
    difficulty: "Medium",
    estimatedMinutes: 18,
    concept: `## A Question You Cannot Possibly Compute

::: story
"What is the last digit of 7 raised to the power 95?"

That number has eighty-one digits. No calculator in the exam hall, no time, and nothing to multiply out. A question that looks impossible is almost always a question with a pattern hiding in it - and the moment you write down the first four powers of 7, the pattern is unmissable:

  7^1 = 7        last digit 7
  7^2 = 49       last digit 9
  7^3 = 343      last digit 3
  7^4 = 2401     last digit 1
  7^5 = 16807    last digit 7   <- back to where it started

The last digits repeat every four powers, forever. So the only thing that matters about 95 is its remainder when divided by 4.
:::

## Unit Digit Cyclicity

::: table The cycle of every last digit
Last digit of base | Cycle of unit digits | Cycle length
0, 1, 5, 6 | always itself | 1
4 | 4, 6 | 2
9 | 9, 1 | 2
2 | 2, 4, 8, 6 | 4
3 | 3, 9, 7, 1 | 4
7 | 7, 9, 3, 1 | 4
8 | 8, 4, 2, 6 | 4
:::

::: flow Finding the unit digit of a huge power
Keep only the base's last digit :: 1274^95 behaves exactly like 4^95. Everything above the units place is irrelevant to the units place.
Look up the cycle length :: For 7 it is 4. For 4 it is 2. For 5 or 6 it is 1, so the answer is immediate.
Divide the exponent by the cycle length and keep the REMAINDER :: 95 divided by 4 leaves 3.
Take that position in the cycle :: The cycle for 7 is (7, 9, 3, 1), and position 3 is 3. So 7^95 ends in 3.
If the remainder is 0, take the LAST entry :: A remainder of 0 means you have landed exactly on the end of a cycle, not the start. For 2^100, 100 divided by 4 leaves 0, so take the 4th entry of (2, 4, 8, 6), which is 6.
:::

::: mistake
A remainder of 0 is where most marks are lost. 2^100 does NOT end in 2. Since 100 is an exact multiple of the cycle length 4, the power sits on the final entry of the cycle, giving 6. Read remainder 0 as "the last one", never as "the first one".
:::

## Remainders of Huge Powers

The same trick works for any divisor once you use one idea: you may replace a number by its remainder before doing anything else.

  To find the remainder of 43^101 when divided by 7:

    43 = 7 x 6 + 1,  so 43 leaves remainder 1
    therefore 43^101 leaves the same remainder as 1^101 = 1

    answer: 1

Look for a base that reduces to 1, and the whole problem collapses. Next best is a base that reduces to -1:

  Remainder of 2^64 when divided by 3:

    2 leaves remainder 2 under division by 3, but 2 is also the same as -1
    (because 3 - 1 = 2), and negative remainders are legal and far easier

    2^64 behaves like (-1)^64 = +1        (even power, so the sign clears)

    answer: 1

::: remember
Using a NEGATIVE remainder is not a trick, it is just choosing the closer of the two representatives. Under division by 7, the number 6 and the number -1 are interchangeable. An even power of -1 gives 1 and an odd power gives -1, which then has to be converted back by adding the divisor.
:::

When neither 1 nor -1 appears, find the cycle exactly as with unit digits:

  Remainder of 5^99 when divided by 13:

    5^1 = 5                        remainder 5
    5^2 = 25 = 13 + 12             remainder 12
    5^3 = 5 x 12 = 60 = 52 + 8     remainder 8
    5^4 = 5 x 8  = 40 = 39 + 1     remainder 1     <- cycle closes, length 4

    99 divided by 4 leaves 3, so 5^99 matches 5^3

    answer: 8

Note the working multiplies the PREVIOUS REMAINDER by 5 each time rather than the full power. That is what keeps the arithmetic to two digits no matter how large the exponent.

## Successive Division

"A number divided by 342 leaves remainder 47. What is the remainder when the same number is divided by 19?"

  N = 342k + 47   for some whole number k

  342 = 19 x 18, so the term 342k is already a multiple of 19 and contributes
  nothing to the remainder. Only 47 matters:

  47 = 19 x 2 + 9

  answer: 9

This works only because 19 divides 342 exactly. If the second divisor is not a factor of the first, the remainder is not determined by the given information at all - a favourite trap.

::: checkpoint
What is the unit digit of 3^24 x 7^15?
- ( ) 1
- (x) 3
- ( ) 7
- ( ) 9
> For 3 the cycle is (3, 9, 7, 1) of length 4; 24 divided by 4 leaves 0, so take the last entry, 1. For 7 the cycle is (7, 9, 3, 1); 15 divided by 4 leaves 3, so take the third entry, 3. Multiply the unit digits: 1 x 3 = 3.
:::

::: revision
- Only the base's LAST digit affects the unit digit of a power.
- Cycle lengths: 1 for 0/1/5/6, 2 for 4 and 9, 4 for 2, 3, 7 and 8.
- Divide the exponent by the cycle length; remainder 0 means take the LAST entry.
- For remainders, reduce the base first, then look for a power giving 1 or -1.
- An even power of -1 is +1; an odd power is -1, which converts back by adding the divisor.
- Build cycles by multiplying the previous REMAINDER, never the full power.
- N divided by D leaves r, and d divides D exactly: the remainder under d is just r divided by d.
:::`,
    mcqs: [
      {
        id: "q1",
        text: "What is the unit digit of 7^95?",
        options: ["1", "3", "7", "9"],
        correctIndex: 1,
        explanation: "The cycle for 7 is (7, 9, 3, 1) with length 4. 95 divided by 4 leaves remainder 3, so take the third entry of the cycle, which is 3.",
      },
      {
        id: "q2",
        text: "What is the unit digit of 2^100?",
        options: ["2", "4", "6", "8"],
        correctIndex: 2,
        explanation: "The cycle for 2 is (2, 4, 8, 6) with length 4. 100 divided by 4 leaves remainder 0, which means the LAST entry of the cycle, namely 6 - not the first.",
      },
      {
        id: "q3",
        text: "What is the remainder when 17^23 is divided by 16?",
        options: ["0", "1", "7", "15"],
        correctIndex: 1,
        explanation: "17 leaves remainder 1 when divided by 16, so 17^23 leaves the same remainder as 1^23 = 1.",
      },
      {
        id: "q4",
        text: "What is the remainder when 2^51 is divided by 7?",
        options: ["1", "2", "4", "6"],
        correctIndex: 0,
        explanation: "2^3 = 8 leaves remainder 1 under division by 7. Since 51 = 3 x 17, we get 2^51 = (2^3)^17, which leaves remainder 1^17 = 1.",
      },
      {
        id: "q5",
        text: "What is the unit digit of 3^24 x 7^15?",
        options: ["1", "3", "7", "9"],
        correctIndex: 1,
        explanation: "3 has cycle (3, 9, 7, 1); 24 divided by 4 leaves 0, so the unit digit is the last entry, 1. 7 has cycle (7, 9, 3, 1); 15 divided by 4 leaves 3, giving 3. Then 1 x 3 = 3.",
      },
      {
        id: "q6",
        text: "What is the remainder when 43^101 is divided by 7?",
        options: ["0", "1", "2", "6"],
        correctIndex: 1,
        explanation: "43 = 7 x 6 + 1, so 43 leaves remainder 1. Any power of a number leaving remainder 1 also leaves remainder 1, so the answer is 1.",
      },
      {
        id: "q7",
        text: "A number when divided by 342 leaves a remainder of 47. What remainder does the same number leave when divided by 19?",
        options: ["5", "9", "11", "17"],
        correctIndex: 1,
        explanation: "N = 342k + 47, and 342 = 19 x 18 is a multiple of 19, so only 47 matters. 47 = 19 x 2 + 9, giving remainder 9.",
      },
      {
        id: "q8",
        text: "What is the unit digit of 1! + 2! + 3! + ... + 100!?",
        options: ["0", "1", "3", "5"],
        correctIndex: 2,
        explanation: "From 5! onwards every factorial ends in 0, contributing nothing. So only 1! + 2! + 3! + 4! = 1 + 2 + 6 + 24 = 33 matters, and its unit digit is 3.",
      },
      {
        id: "q9",
        text: "What is the remainder when 5^99 is divided by 13?",
        options: ["5", "8", "10", "12"],
        correctIndex: 1,
        explanation: "Remainders of powers of 5 under 13 run 5, 12, 8, 1 and then repeat, so the cycle length is 4. 99 divided by 4 leaves 3, so the answer matches 5^3, which is 8.",
      },
      {
        id: "q10",
        text: "What is the last digit of 13^13?",
        options: ["1", "3", "7", "9"],
        correctIndex: 1,
        explanation: "Only the base's last digit matters, so this behaves like 3^13. The cycle for 3 is (3, 9, 7, 1); 13 divided by 4 leaves remainder 1, giving the first entry, 3.",
      },
      {
        id: "q11",
        text: "What is the remainder when 3^45 is divided by 8?",
        options: ["1", "3", "5", "7"],
        correctIndex: 1,
        explanation: "3^2 = 9 leaves remainder 1 under division by 8. Write 3^45 = (3^2)^22 x 3, which leaves remainder 1 x 3 = 3.",
      },
      {
        id: "q12",
        text: "What is the remainder when 2^64 is divided by 3?",
        options: ["0", "1", "2", "3"],
        correctIndex: 1,
        explanation: "Under division by 3, the number 2 is the same as -1. So 2^64 behaves like (-1)^64, and because the power is even this is +1. The remainder is 1.",
      },
    ],
    timedQuiz: { timeLimitSeconds: 300, mcqIds: ["q1", "q2", "q4", "q9", "q12"] },
    problemIds: [],
    xpReward: 50, coinReward: 20,
    status: "published",
  },

  // ------------------------------------------------------------------
  // Day 39 - Wednesday 9 Sep 2026 - Surds, Indices & Logarithms
  // ------------------------------------------------------------------
  {
    date: "2026-09-09", dow: "wed", weekId: "2026-09-07", type: "lesson",
    title: "Day 39: Surds, Indices & Logarithms",
    difficulty: "Medium",
    estimatedMinutes: 17,
    concept: `## Three Notations for One Idea

::: story
A question asks how many digits are in 2^20. You have no calculator, and multiplying two by itself twenty times is a minute you cannot spare.

But if you are told that log 2 is about 0.3010, the whole thing takes ten seconds: twenty times 0.3010 is 6.02, and a number whose logarithm is 6-point-something has seven digits. Done.

Logarithms were invented for exactly this - to turn multiplication into addition and powers into multiplication. Indices, surds and logarithms are three ways of writing the same relationship, and fluency means moving between them without stopping to think.
:::

## The Laws of Indices

::: table The six that cover everything
Rule | Statement | Example
Product | a^m x a^n = a^(m+n) | 2^3 x 2^4 = 2^7 = 128
Quotient | a^m / a^n = a^(m-n) | 5^6 / 5^4 = 5^2 = 25
Power of a power | (a^m)^n = a^(mn) | (3^2)^3 = 3^6 = 729
Zero index | a^0 = 1 for any nonzero a | 17^0 = 1
Negative index | a^(-n) = 1 / a^n | 4^(-2) = 1/16
Fractional index | a^(m/n) is the n-th root of a, raised to m | 8^(2/3) = (cube root of 8) squared = 4
:::

The fractional index is the one worth slowing down for. The DENOMINATOR is the root and the NUMERATOR is the power, and taking the root first keeps the numbers small:

  8^(2/3)      = (8^(1/3))^2 = 2^2 = 4               easy
  same as      = (8^2)^(1/3) = 64^(1/3) = 4          correct but clumsier

  (0.25)^(-1/2) = (1/4)^(-1/2) = 4^(1/2) = 2

A negative index flips the fraction; it never makes the answer negative. That is the single most common misreading in this topic.

## Surds and Rationalising

A surd is a root that will not simplify to a whole number, such as the square root of 2. Two moves handle almost every surd question.

  SIMPLIFY by pulling out square factors:

    root of 72 = root of (36 x 2) = 6 x root of 2

  RATIONALISE by multiplying top and bottom by the conjugate - the same
  expression with the middle sign flipped:

    1 / (root3 - root2)
      multiply top and bottom by (root3 + root2):

      = (root3 + root2) / ((root3 - root2)(root3 + root2))
      = (root3 + root2) / (3 - 2)
      = root3 + root2

The denominator collapses because (a - b)(a + b) = a^2 - b^2, and squaring a square root removes it. That identity is the entire technique:

  (root5 + root3)(root5 - root3) = 5 - 3 = 2

## Logarithms

The statement "log of 64 to base 2 equals 6" says exactly one thing: 2 raised to the power 6 gives 64. A logarithm is a question - "what power do I raise the base to?" - and nothing more.

::: flow The log laws, and what each one replaces
Product becomes sum :: log(mn) = log m + log n. This is why log tables made multiplication tractable before calculators.
Quotient becomes difference :: log(m/n) = log m - log n. So log 5 = log(10/2) = log 10 - log 2 = 1 - 0.3010 = 0.6990.
Power becomes multiplication :: log(m^p) = p x log m. This is what makes the digit-counting trick work.
Log of the base is 1 :: log of a to base a = 1, because a^1 = a.
Log of 1 is 0 :: whatever the base, raising it to the power 0 gives 1.
Change of base :: log of m to base a = (log m) divided by (log a), in any base you like.
:::

COUNTING DIGITS. If the logarithm of a number to base 10 is between 6 and 7, the number is between 10^6 and 10^7, so it has 7 digits. The rule: take the whole-number part of the logarithm and add one.

  2^20:   log = 20 x 0.3010 = 6.020
          whole-number part 6, so 6 + 1 = 7 digits

  check: 2^20 = 1048576, which indeed has 7 digits.

::: mistake
log 5 is not half of log 10. Logarithms turn multiplication into addition, not division into halving. Get log 5 from log(10/2) = 1 - 0.3010 = 0.6990. Students who halve get 0.5 and every dependent answer goes wrong.
:::

::: checkpoint
If log 2 = 0.3010 (base 10), how many digits are in 2^20?
- ( ) 6
- (x) 7
- ( ) 8
- ( ) 11
> log of 2^20 = 20 x log 2 = 20 x 0.3010 = 6.020. The whole-number part is 6, and the number of digits is that plus one, giving 7. Confirmed directly: 2^20 = 1048576.
:::

::: revision
- Fractional index a^(m/n): denominator is the root, numerator is the power. Take the root first.
- A negative index means reciprocal, never a negative value.
- Simplify surds by extracting square factors; rationalise by multiplying by the conjugate.
- (a - b)(a + b) = a^2 - b^2 is what kills a surd denominator.
- log(mn) = log m + log n; log(m/n) = log m - log n; log(m^p) = p log m.
- log 2 = 0.3010 and log 3 = 0.4771 are worth memorising; log 5 = 1 - log 2 = 0.6990.
- Digit count = whole-number part of the base-10 logarithm, plus one.
:::`,
    mcqs: [
      {
        id: "q1",
        text: "What is the value of log 64 to the base 2?",
        options: ["4", "5", "6", "8"],
        correctIndex: 2,
        explanation: "We need the power of 2 that gives 64. Since 2^6 = 64, the logarithm is 6.",
      },
      {
        id: "q2",
        text: "If log 2 = 0.3010 to base 10, what is log 5?",
        options: ["0.6021", "0.6990", "0.7010", "0.3010"],
        correctIndex: 1,
        explanation: "log 5 = log(10/2) = log 10 - log 2 = 1 - 0.3010 = 0.6990. Halving log 10 is the common error and gives a wrong 0.5.",
      },
      {
        id: "q3",
        text: "What is the value of 8^(2/3)?",
        options: ["2", "4", "16", "64"],
        correctIndex: 1,
        explanation: "The denominator 3 is the root and the numerator 2 is the power. The cube root of 8 is 2, and 2 squared is 4.",
      },
      {
        id: "q4",
        text: "Rationalising 1/(root3 - root2) gives:",
        options: ["root3 + root2", "root3 - root2", "root5", "1/5"],
        correctIndex: 0,
        explanation: "Multiply top and bottom by the conjugate (root3 + root2). The denominator becomes 3 - 2 = 1, leaving root3 + root2.",
      },
      {
        id: "q5",
        text: "If 3^(x+1) = 81, what is x?",
        options: ["2", "3", "4", "5"],
        correctIndex: 1,
        explanation: "81 = 3^4, so x + 1 = 4 and therefore x = 3. Forgetting to subtract the 1 gives the wrong answer 4.",
      },
      {
        id: "q6",
        text: "What is the value of (log 8 to base 2) + (log 27 to base 3)?",
        options: ["5", "6", "9", "12"],
        correctIndex: 1,
        explanation: "2^3 = 8 gives 3, and 3^3 = 27 also gives 3. Their sum is 6.",
      },
      {
        id: "q7",
        text: "What is the value of (root5 + root3)(root5 - root3)?",
        options: ["2", "root2", "8", "15"],
        correctIndex: 0,
        explanation: "Using (a + b)(a - b) = a^2 - b^2 with a = root5 and b = root3 gives 5 - 3 = 2.",
      },
      {
        id: "q8",
        text: "If log x = 2 log 3 + 3 log 2 (all to base 10), what is x?",
        options: ["36", "48", "72", "96"],
        correctIndex: 2,
        explanation: "2 log 3 = log 9 and 3 log 2 = log 8. So log x = log 9 + log 8 = log 72, giving x = 72.",
      },
      {
        id: "q9",
        text: "What is the value of (0.25)^(-1/2)?",
        options: ["0.5", "2", "4", "16"],
        correctIndex: 1,
        explanation: "0.25 = 1/4. A negative index flips it to 4, and the index 1/2 takes the square root: 4^(1/2) = 2. A negative index never produces a negative answer.",
      },
      {
        id: "q10",
        text: "Given log 2 = 0.3010, how many digits does 2^20 contain?",
        options: ["6", "7", "8", "11"],
        correctIndex: 1,
        explanation: "log(2^20) = 20 x 0.3010 = 6.020. The digit count is the whole-number part plus one, so 6 + 1 = 7. Indeed 2^20 = 1048576.",
      },
      {
        id: "q11",
        text: "What is the value of log 125 to the base 5?",
        options: ["2", "3", "5", "25"],
        correctIndex: 1,
        explanation: "5^3 = 125, so the logarithm is 3.",
      },
      {
        id: "q12",
        text: "What is the square root of 0.0081?",
        options: ["0.009", "0.09", "0.9", "9"],
        correctIndex: 1,
        explanation: "0.09 x 0.09 = 0.0081. Counting decimal places is the check: the square has four, so the root has two.",
      },
    ],
    timedQuiz: { timeLimitSeconds: 300, mcqIds: ["q2", "q3", "q8", "q9", "q10"] },
    problemIds: [],
    xpReward: 50, coinReward: 20,
    status: "published",
  },

  // ------------------------------------------------------------------
  // Day 40 - Thursday 10 Sep 2026 - Progressions: AP & GP
  // ------------------------------------------------------------------
  {
    date: "2026-09-10", dow: "thu", weekId: "2026-09-07", type: "lesson",
    title: "Day 40: Progressions - Arithmetic & Geometric",
    difficulty: "Medium",
    estimatedMinutes: 18,
    concept: `## Adding a Hundred Numbers in Four Seconds

::: story
The story is told of a schoolteacher who set his class to add every number from 1 to 100, expecting a quiet hour. A boy named Gauss handed in the answer almost immediately: 5050.

He had noticed something. Pair the first with the last: 1 + 100 = 101. The second with the second-last: 2 + 99 = 101. Every pair gives 101, and there are fifty pairs. So the total is 50 x 101 = 5050.

That pairing IS the formula for the sum of an arithmetic progression. Every sum formula below is the same observation written in symbols.
:::

## Arithmetic Progression

An AP adds a constant to get the next term. That constant is the common difference d.

  3, 7, 11, 15, 19, ...        first term a = 3, common difference d = 4

::: table The two AP formulas
Quantity | Formula | Worked example
n-th term | a + (n-1)d | 15th term of 3, 7, 11: 3 + 14 x 4 = 59
Sum of n terms | (n/2) x (2a + (n-1)d) | Sum of 12 terms of 5, 9, 13: 6 x (10 + 44) = 324
Sum, when the last term L is known | (n/2) x (a + L) | Gauss: (100/2) x (1 + 100) = 5050
:::

Note the (n-1), not n. The first term needs no steps to reach, the second needs one, and the fifteenth needs fourteen. Using n instead is the most frequent single error in this topic.

::: flow Finding how many terms an AP has
Write the last term with the n-th term formula :: For 7, 13, 19, ..., 205 with a = 7 and d = 6, set 7 + (n-1)6 = 205.
Isolate the (n-1) part :: Subtract 7 from both sides to get (n-1)6 = 198.
Divide by the common difference :: n - 1 = 33.
Add one back :: n = 34 terms. Forgetting this last step is exactly the (n-1) trap again.
:::

TWO RESULTS WORTH KNOWING COLD:

  sum of the first n natural numbers      = n(n+1)/2
        1 + 2 + ... + 20 = 20 x 21 / 2 = 210

  sum of the first n ODD numbers          = n^2
        1 + 3 + 5 + ... (15 terms) = 15^2 = 225

The second is a pleasant surprise the first time you meet it, and it is quick to test: 1, 4, 9, 16 - the running totals of the odd numbers are exactly the squares.

## Geometric Progression

A GP MULTIPLIES by a constant, the common ratio r.

  2, 6, 18, 54, ...            a = 2, r = 3

::: table The three GP formulas
Quantity | Formula | Worked example
n-th term | a x r^(n-1) | 6th term of 2, 6, 18: 2 x 3^5 = 2 x 243 = 486
Sum of n terms | a(r^n - 1) / (r - 1) | Sum of 5 terms with a = 3, r = 2: 3(32-1)/1 = 93
Sum to infinity, only when r is between -1 and 1 | a / (1 - r) | 1 + 1/2 + 1/4 + ... = 1/(1 - 0.5) = 2
:::

The infinite sum has a strict condition. If the ratio is 1 or more the terms never shrink, the total grows without limit, and the formula is meaningless. Only a ratio strictly between -1 and 1 makes a GP converge.

::: remember
Arithmetic mean of two numbers is (a + b)/2. Geometric mean is the square root of their product. The GM of 4 and 9 is root36 = 6, not 6.5. Mixing the two up is a classic one-mark loss, and the AM is always at least the GM for positive numbers.
:::

## Using the Sum to Find a Term

If a question gives you a formula for the sum of the first n terms, any single term is the difference of two consecutive sums:

  n-th term = (sum of first n terms) - (sum of first n-1 terms)

  Given that the sum of the first n terms is n^2 + 3n, find the 10th term:

    sum of first 10 = 100 + 30 = 130
    sum of first  9 =  81 + 27 = 108
    10th term       = 130 - 108 = 22

## Three Terms in AP: the Symmetric Trick

When a question says three numbers are in AP and gives their sum, do not write a, a+d, a+2d. Write them symmetrically:

  a - d,   a,   a + d

  Their sum is 3a, so the middle term is immediately the sum divided by 3 -
  and one unknown has vanished before you have done any real work.

  "Three numbers in AP have sum 24 and product 440."

    middle term = 24 / 3 = 8
    so the numbers are (8 - d), 8, (8 + d)
    product: 8(64 - d^2) = 440   ->   64 - d^2 = 55   ->   d^2 = 9   ->   d = 3

    numbers: 5, 8, 11       check: 5 + 8 + 11 = 24 and 5 x 8 x 11 = 440. Confirmed.

::: mistake
In the n-th term formula the exponent for a GP is (n-1), exactly as the multiplier is (n-1) for an AP. The 6th term of 2, 6, 18 is 2 x 3^5, not 2 x 3^6. Count the STEPS between terms, not the terms themselves.
:::

::: checkpoint
How many terms are there in the AP 7, 13, 19, ..., 205?
- ( ) 32
- ( ) 33
- (x) 34
- ( ) 35
> Here a = 7 and d = 6. Set 7 + (n-1)6 = 205, so (n-1)6 = 198 and n - 1 = 33, giving n = 34. Stopping at 33 is the trap - that is (n-1), not n.
:::

::: revision
- AP n-th term: a + (n-1)d. Sum: (n/2)(2a + (n-1)d), or (n/2)(a + L) when the last term is known.
- GP n-th term: a x r^(n-1). Sum: a(r^n - 1)/(r - 1).
- Infinite GP sum a/(1-r) applies ONLY when r lies strictly between -1 and 1.
- Sum of first n naturals = n(n+1)/2; sum of first n odd numbers = n^2.
- n-th term = S(n) - S(n-1) whenever the sum formula is given.
- For three terms in AP use a-d, a, a+d so the middle term is the sum over 3.
- AM = (a+b)/2, GM = root(ab). They are not the same thing.
- Always use (n-1), never n, for the number of steps.
:::`,
    mcqs: [
      {
        id: "q1",
        text: "What is the 15th term of the arithmetic progression 3, 7, 11, ...?",
        options: ["55", "57", "59", "63"],
        correctIndex: 2,
        explanation: "Here a = 3 and d = 4. The 15th term is a + 14d = 3 + 14 x 4 = 3 + 56 = 59. Using 15d instead of 14d gives the wrong 63.",
      },
      {
        id: "q2",
        text: "What is the sum of the first 20 natural numbers?",
        options: ["190", "200", "210", "220"],
        correctIndex: 2,
        explanation: "Sum = n(n+1)/2 = 20 x 21 / 2 = 210.",
      },
      {
        id: "q3",
        text: "What is the sum of the first 12 terms of the AP 5, 9, 13, ...?",
        options: ["300", "312", "324", "336"],
        correctIndex: 2,
        explanation: "With a = 5, d = 4 and n = 12: sum = (12/2)(2x5 + 11x4) = 6 x (10 + 44) = 6 x 54 = 324.",
      },
      {
        id: "q4",
        text: "What is the 6th term of the geometric progression 2, 6, 18, ...?",
        options: ["162", "324", "486", "729"],
        correctIndex: 2,
        explanation: "Here a = 2 and r = 3. The 6th term is a x r^5 = 2 x 243 = 486. Using r^6 gives the wrong 1458.",
      },
      {
        id: "q5",
        text: "What is the sum of the infinite geometric series 1 + 1/2 + 1/4 + 1/8 + ...?",
        options: ["1.5", "2", "2.5", "It does not converge"],
        correctIndex: 1,
        explanation: "The ratio is 1/2, which lies strictly between -1 and 1, so the sum is a/(1-r) = 1/(1 - 1/2) = 2.",
      },
      {
        id: "q6",
        text: "How many terms are in the arithmetic progression 7, 13, 19, ..., 205?",
        options: ["32", "33", "34", "35"],
        correctIndex: 2,
        explanation: "7 + (n-1)6 = 205 gives (n-1)6 = 198, so n - 1 = 33 and n = 34. The answer 33 forgets to add the 1 back.",
      },
      {
        id: "q7",
        text: "What is the geometric mean of 4 and 9?",
        options: ["5", "6", "6.5", "13"],
        correctIndex: 1,
        explanation: "The geometric mean is the square root of the product: root(4 x 9) = root36 = 6. The value 6.5 is the ARITHMETIC mean, a classic mix-up.",
      },
      {
        id: "q8",
        text: "In an AP the 3rd term is 12 and the 7th term is 24. What is the common difference?",
        options: ["2", "3", "4", "6"],
        correctIndex: 1,
        explanation: "The 7th term minus the 3rd term spans 4 steps: 24 - 12 = 12 = 4d, so d = 3.",
      },
      {
        id: "q9",
        text: "What is the sum of the first 15 odd numbers?",
        options: ["210", "225", "240", "255"],
        correctIndex: 1,
        explanation: "The sum of the first n odd numbers is exactly n^2, so the answer is 15^2 = 225.",
      },
      {
        id: "q10",
        text: "In a GP with first term 3 and common ratio 2, what is the sum of the first 5 terms?",
        options: ["63", "93", "96", "105"],
        correctIndex: 1,
        explanation: "Sum = a(r^n - 1)/(r - 1) = 3(2^5 - 1)/(2 - 1) = 3 x 31 = 93. Check by listing: 3 + 6 + 12 + 24 + 48 = 93.",
      },
      {
        id: "q11",
        text: "The sum of the first n terms of a sequence is n^2 + 3n. What is the 10th term?",
        options: ["20", "21", "22", "24"],
        correctIndex: 2,
        explanation: "The 10th term is S(10) - S(9) = (100 + 30) - (81 + 27) = 130 - 108 = 22.",
      },
      {
        id: "q12",
        text: "Three numbers in AP have a sum of 24 and a product of 440. What is the smallest of them?",
        options: ["4", "5", "6", "8"],
        correctIndex: 1,
        explanation: "Write them as (8-d), 8, (8+d) since the middle term is 24/3 = 8. Then 8(64 - d^2) = 440, so 64 - d^2 = 55 and d = 3. The numbers are 5, 8, 11, and the smallest is 5.",
      },
    ],
    timedQuiz: { timeLimitSeconds: 300, mcqIds: ["q1", "q4", "q6", "q9", "q12"] },
    problemIds: [],
    xpReward: 50, coinReward: 20,
    status: "published",
  },

  // ------------------------------------------------------------------
  // Day 41 - Friday 11 Sep 2026 - Linear Equations & Inequalities
  // ------------------------------------------------------------------
  {
    date: "2026-09-11", dow: "fri", weekId: "2026-09-07", type: "lesson",
    title: "Day 41: Linear Equations & Inequalities",
    difficulty: "Medium",
    estimatedMinutes: 17,
    concept: `## The Skill Every Other Topic Borrowed

::: story
Look back at what this course has already asked you to do. Ages problems ended in an equation. Partnership ended in an equation. Mixtures, time and work, boats and streams - every one of them was a story that had to be translated into symbols and solved.

So today is not a new topic. It is the one technique all of those quietly depended on, now examined directly: turning a sentence into an equation, solving the equation efficiently, and knowing the one rule that makes inequalities behave differently from equations.
:::

## Translating Sentences

::: table English to algebra
Phrase | Symbols
A number | x
5 more than a number | x + 5
5 less than a number | x - 5
Thrice a number | 3x
The number exceeds 7 by 4 | x - 7 = 4
A is 3 times as old as B | A = 3B
The sum of two numbers is 40 | x + y = 40
Their difference is 8 | x - y = 8
Two consecutive integers | x and x + 1
A two-digit number with tens digit t and units digit u | 10t + u
:::

The two-digit row earns its place. A number is NOT its digits: 36 means 10 x 3 + 6. Writing "tu" instead of "10t + u" wrecks every digit-reversal problem, and those appear constantly.

## Solving a Pair of Equations

Two methods, and the right choice saves real time.

SUBSTITUTION, when one variable is already isolated or nearly so:

  2x + 3y = 12  and  x - y = 1

  from the second:  x = y + 1
  substitute:       2(y + 1) + 3y = 12
                    2y + 2 + 3y = 12
                    5y = 10
                    y = 2,  so x = 3

  check: 2(3) + 3(2) = 6 + 6 = 12 and 3 - 2 = 1. Confirmed.

ELIMINATION, when the coefficients are awkward and symmetric:

  3p + 2b = 86  and  2p + 3b = 89

  A question asking only for p + b does not need p and b separately.
  Add the two equations:

    5p + 5b = 175
    p + b = 35

  Done in one line. Solving for p and b individually would take four.

::: remember
Before solving fully, read what is actually being ASKED. Questions frequently want a sum, a difference or a ratio rather than the individual values, and adding or subtracting the given equations often delivers it immediately.
:::

## The Sum-and-Difference Shortcut

When you are given the sum S and difference D of two numbers, do not set up simultaneous equations:

  larger  = (S + D) / 2
  smaller = (S - D) / 2

  Sum 40, difference 8:   larger = 48/2 = 24,  smaller = 32/2 = 16.
  Check: 24 + 16 = 40 and 24 - 16 = 8. Confirmed.

## Inequalities, and the One Rule That Differs

An inequality is solved exactly like an equation - add, subtract, multiply, divide on both sides - with a single exception:

::: mistake
MULTIPLYING OR DIVIDING BY A NEGATIVE NUMBER REVERSES THE INEQUALITY SIGN. From -3x > 9, dividing both sides by -3 gives x < -3, not x > -3. Adding and subtracting never flip the sign; only multiplying or dividing by a negative does. Verify with a number: x = -4 gives -3(-4) = 12, which is indeed greater than 9, and -4 is indeed less than -3.
:::

  Solve 5x - 3 < 2x + 9:

    5x - 2x < 9 + 3
    3x < 12
    x < 4                  no negative division, so no flip

  Solve -2x + 6 >= 0:

    -2x >= -6
    x <= 3                 divided by -2, so the sign flipped

  Alternative that avoids the flip entirely: move the negative term across
  instead. From -2x + 6 >= 0, write 6 >= 2x, then 3 >= x, i.e. x <= 3.
  Same answer, and no rule to remember.

MAXIMISING AN EXPRESSION OVER RANGES. If 2 <= x <= 5 and 1 <= y <= 3, the largest value of x - y comes from the largest x and the SMALLEST y:

  maximum of (x - y) = 5 - 1 = 4
  minimum of (x - y) = 2 - 3 = -1

For a difference, push the two variables in opposite directions. For a sum, push them the same way.

::: checkpoint
The sum of the digits of a two-digit number is 9. When the digits are reversed, the number increases by 27. What is the number?
- ( ) 27
- (x) 36
- ( ) 45
- ( ) 54
> Let the tens digit be t and the units digit u, so the number is 10t + u and the reversed number is 10u + t. Given t + u = 9 and (10u + t) - (10t + u) = 27, the second simplifies to 9u - 9t = 27, so u - t = 3. Solving with t + u = 9 gives u = 6 and t = 3, so the number is 36. Check: 63 - 36 = 27 and 3 + 6 = 9. Confirmed.
:::

::: revision
- A two-digit number with digits t and u is 10t + u, never "tu".
- Substitution when a variable is isolated; elimination when the system is symmetric.
- Read the question: it may want p + b rather than p and b.
- Sum S and difference D: larger = (S+D)/2, smaller = (S-D)/2.
- Inequalities flip ONLY on multiplying or dividing by a negative.
- Avoid the flip by moving the negative term to the other side instead.
- To maximise x - y take x large and y small; for x + y take both large.
- Always substitute your answer back into the ORIGINAL sentence, not into your own rearrangement.
:::`,
    mcqs: [
      {
        id: "q1",
        text: "If 2x + 3y = 12 and x - y = 1, what is the value of x?",
        options: ["2", "3", "4", "5"],
        correctIndex: 1,
        explanation: "From x - y = 1 we get x = y + 1. Substituting: 2(y+1) + 3y = 12, so 5y + 2 = 12, giving y = 2 and x = 3. Check: 6 + 6 = 12. Confirmed.",
      },
      {
        id: "q2",
        text: "Solve the inequality -3x > 9.",
        options: ["x > -3", "x < -3", "x > 3", "x < 3"],
        correctIndex: 1,
        explanation: "Dividing both sides by -3 reverses the inequality, giving x < -3. Test x = -4: -3(-4) = 12 > 9, and -4 is less than -3. Confirmed.",
      },
      {
        id: "q3",
        text: "The sum of two numbers is 40 and their difference is 8. What is the larger number?",
        options: ["20", "22", "24", "26"],
        correctIndex: 2,
        explanation: "Larger = (sum + difference)/2 = (40 + 8)/2 = 24. The smaller is 16, and 24 + 16 = 40 with a difference of 8.",
      },
      {
        id: "q4",
        text: "A father is three times as old as his son. In 12 years he will be twice as old. What is the son's present age?",
        options: ["10", "12", "14", "16"],
        correctIndex: 1,
        explanation: "Let the son be s, so the father is 3s. In 12 years: 3s + 12 = 2(s + 12), giving 3s + 12 = 2s + 24 and s = 12. Check: father is 36 now, and in 12 years 48 = 2 x 24. Confirmed.",
      },
      {
        id: "q5",
        text: "Solve the inequality 5x - 3 < 2x + 9.",
        options: ["x < 3", "x < 4", "x > 4", "x < 6"],
        correctIndex: 1,
        explanation: "Collecting terms gives 3x < 12, so x < 4. No negative division occurred, so the sign does not flip.",
      },
      {
        id: "q6",
        text: "3 pens and 2 books cost 86 rupees; 2 pens and 3 books cost 89 rupees. What is the cost of one pen plus one book?",
        options: ["30", "33", "35", "40"],
        correctIndex: 2,
        explanation: "Adding the two equations gives 5p + 5b = 175, so p + b = 35. There is no need to find p and b separately.",
      },
      {
        id: "q7",
        text: "Two numbers have a sum of 10 and a product of 21. What is the larger number?",
        options: ["5", "6", "7", "8"],
        correctIndex: 2,
        explanation: "Two numbers summing to 10 with product 21 are 3 and 7, since 3 + 7 = 10 and 3 x 7 = 21. The larger is 7.",
      },
      {
        id: "q8",
        text: "When 15 is subtracted from 7 times a number, the result is 10 more than twice the number. What is the number?",
        options: ["4", "5", "6", "7"],
        correctIndex: 1,
        explanation: "7x - 15 = 2x + 10 gives 5x = 25, so x = 5. Check: 35 - 15 = 20, and twice 5 plus 10 is also 20. Confirmed.",
      },
      {
        id: "q9",
        text: "If 2 <= x <= 5 and 1 <= y <= 3, what is the maximum possible value of x - y?",
        options: ["2", "3", "4", "5"],
        correctIndex: 2,
        explanation: "To maximise a difference, take x as large as possible and y as small as possible: 5 - 1 = 4.",
      },
      {
        id: "q10",
        text: "Solve x/2 + x/3 = 10.",
        options: ["10", "12", "15", "20"],
        correctIndex: 1,
        explanation: "The left side is (3x + 2x)/6 = 5x/6. Setting 5x/6 = 10 gives x = 12. Check: 6 + 4 = 10. Confirmed.",
      },
      {
        id: "q11",
        text: "Solve the inequality -2x + 6 >= 0.",
        options: ["x >= 3", "x <= 3", "x >= -3", "x <= -3"],
        correctIndex: 1,
        explanation: "Rearranging gives 6 >= 2x, so 3 >= x, i.e. x <= 3. Dividing by -2 directly gives the same result provided the sign is flipped.",
      },
      {
        id: "q12",
        text: "The sum of the digits of a two-digit number is 9. Reversing the digits increases the number by 27. What is the number?",
        options: ["27", "36", "45", "54"],
        correctIndex: 1,
        explanation: "With tens digit t and units digit u: t + u = 9 and (10u + t) - (10t + u) = 27 gives 9(u - t) = 27, so u - t = 3. Then u = 6 and t = 3, making the number 36. Check: 63 - 36 = 27. Confirmed.",
      },
    ],
    timedQuiz: { timeLimitSeconds: 300, mcqIds: ["q2", "q4", "q6", "q9", "q12"] },
    problemIds: [],
    xpReward: 50, coinReward: 20,
    status: "published",
  },

  // ------------------------------------------------------------------
  // Day 42 - Saturday 12 Sep 2026 - Week 7 Recap
  // ------------------------------------------------------------------
  {
    date: "2026-09-12", dow: "sat", weekId: "2026-09-07", type: "lesson",
    title: "Day 42: Week 7 Recap - Divisibility, Remainders, Surds, Progressions & Equations",
    difficulty: "Medium",
    estimatedMinutes: 20,
    concept: `## Five Days That Fit Together

::: story
Monday you learned to break a number into primes and read its factors off the exponents. Tuesday that same factorisation let you find the last digit of a number eighty-one digits long. Wednesday indices turned into logarithms and let you count the digits of 2^20 without computing it. Thursday geometric progressions turned out to be the same index laws applied repeatedly. Friday tied it off with the equation-solving every earlier week had silently assumed.

That is not five topics. It is one toolkit, and today is about seeing which tool a question is asking for.
:::

## The Week on One Page

::: table What to reach for
If the question asks... | Use
How many factors, sum of factors, is it a square | Prime factorise, then (exponent + 1) products
Last digit of a huge power | Cyclicity: keep the base's last digit, divide the exponent by the cycle length
Remainder of a huge power | Reduce the base first, hunt for a power giving 1 or -1
Trailing zeros of a factorial | Add floor(n/5) + floor(n/25) + ...
Same remainder under several divisors | LCM plus that remainder
Number of digits in a big power | Whole-number part of the base-10 logarithm, plus one
A surd in a denominator | Multiply by the conjugate
A sequence adding a constant | AP: a + (n-1)d, sum (n/2)(2a + (n-1)d)
A sequence multiplying by a constant | GP: a x r^(n-1), sum a(r^n - 1)/(r - 1)
A story with an unknown | Translate to an equation; a two-digit number is 10t + u
:::

## The Four Traps That Cost the Most Marks

::: mistake
1. Remainder 0 in a cyclicity problem means the LAST entry of the cycle, not the first. 2^100 ends in 6.
2. In progressions the count of steps is (n-1), never n. The 15th AP term is a + 14d; the 6th GP term is a x r^5.
3. An inequality flips only when you multiply or divide by a negative. Adding never flips it.
4. Trailing-zero counts must continue past floor(n/5). For 50! the multiples of 25 add two more.
:::

::: remember
The single highest-value habit from this week: when a number appears in a question about factors, divisibility, squares or remainders, prime factorise it before doing anything else. Almost every formula this week reads straight off those exponents.
:::

::: checkpoint
What is the unit digit of 4^37?
- ( ) 2
- (x) 4
- ( ) 6
- ( ) 8
> The cycle for a base ending in 4 is (4, 6) with length 2. 37 divided by 2 leaves remainder 1, so take the first entry, which is 4. A remainder of 0 would have meant 6.
:::

::: revision
- Prime factorise first; factor count = product of (exponent + 1).
- Even factors force one 2; odd factors drop the 2s; odd total means perfect square.
- Cycle lengths: 1 for 0/1/5/6, 2 for 4 and 9, 4 for 2/3/7/8. Remainder 0 means the last entry.
- Reduce a base to 1 or -1 before powering; an even power of -1 is +1.
- log(mn) = log m + log n, log(m^p) = p log m, digits = whole part of the log plus 1.
- Conjugate multiplication clears a surd denominator via a^2 - b^2.
- AP: a + (n-1)d. GP: a x r^(n-1). Infinite GP only if r is strictly between -1 and 1.
- Sum of first n naturals = n(n+1)/2; of first n odds = n^2.
- Inequalities flip only on multiplying or dividing by a negative.
:::`,
    mcqs: [
      {
        id: "q1",
        text: "How many factors does 180 have?",
        options: ["12", "15", "18", "20"],
        correctIndex: 2,
        explanation: "180 = 2^2 x 3^2 x 5. Number of factors = (2+1)(2+1)(1+1) = 3 x 3 x 2 = 18.",
      },
      {
        id: "q2",
        text: "What is the unit digit of 8^33?",
        options: ["2", "4", "6", "8"],
        correctIndex: 3,
        explanation: "The cycle for 8 is (8, 4, 2, 6) with length 4. 33 divided by 4 leaves remainder 1, so the answer is the first entry, 8.",
      },
      {
        id: "q3",
        text: "What is the remainder when 7^40 is divided by 8?",
        options: ["0", "1", "5", "7"],
        correctIndex: 1,
        explanation: "Under division by 8, the number 7 is the same as -1. So 7^40 behaves like (-1)^40, which is +1 because the power is even.",
      },
      {
        id: "q4",
        text: "How many trailing zeros does 100! have?",
        options: ["20", "22", "24", "25"],
        correctIndex: 2,
        explanation: "Add floor(100/5) = 20 and floor(100/25) = 4, then floor(100/125) = 0. Total = 24.",
      },
      {
        id: "q5",
        text: "What is the value of 16^(3/4)?",
        options: ["4", "8", "12", "64"],
        correctIndex: 1,
        explanation: "The denominator 4 is the root: the fourth root of 16 is 2. The numerator 3 is the power: 2^3 = 8.",
      },
      {
        id: "q6",
        text: "If log 3 = 0.4771 to base 10, what is log 9?",
        options: ["0.6990", "0.9031", "0.9542", "1.4313"],
        correctIndex: 2,
        explanation: "log 9 = log(3^2) = 2 log 3 = 2 x 0.4771 = 0.9542.",
      },
      {
        id: "q7",
        text: "What is the 20th term of the AP 5, 8, 11, ...?",
        options: ["59", "62", "65", "68"],
        correctIndex: 1,
        explanation: "Here a = 5 and d = 3, so the 20th term is 5 + 19 x 3 = 5 + 57 = 62. Using 20d instead of 19d gives the wrong 65.",
      },
      {
        id: "q8",
        text: "What is the sum of the infinite geometric series 9 + 3 + 1 + 1/3 + ...?",
        options: ["12", "13.5", "15", "18"],
        correctIndex: 1,
        explanation: "Here a = 9 and r = 1/3, which lies strictly between -1 and 1, so the sum is 9/(1 - 1/3) = 9/(2/3) = 13.5.",
      },
      {
        id: "q9",
        text: "Solve the inequality -4x + 8 < 0.",
        options: ["x < 2", "x > 2", "x < -2", "x > -2"],
        correctIndex: 1,
        explanation: "Rearranging gives 8 < 4x, so 2 < x, i.e. x > 2. Dividing by -4 directly gives the same provided the sign flips.",
      },
      {
        id: "q10",
        text: "The sum of two numbers is 56 and their difference is 12. What is the smaller number?",
        options: ["18", "20", "22", "24"],
        correctIndex: 2,
        explanation: "Smaller = (sum - difference)/2 = (56 - 12)/2 = 22. The larger is 34, and 34 + 22 = 56 with a difference of 12.",
      },
      {
        id: "q11",
        text: "In how many ways can 100 be written as a product of two factors?",
        options: ["4", "5", "9", "10"],
        correctIndex: 1,
        explanation: "100 = 2^2 x 5^2 has (2+1)(2+1) = 9 factors. The odd count means 100 is a perfect square, so the number of ways is (9+1)/2 = 5: 1x100, 2x50, 4x25, 5x20, 10x10.",
      },
      {
        id: "q12",
        text: "What is the smallest number which, when divided by 8, 12 and 20, leaves a remainder of 3 in each case?",
        options: ["63", "123", "120", "243"],
        correctIndex: 1,
        explanation: "The number is LCM(8, 12, 20) + 3. Taking highest prime powers, 2^3 x 3 x 5 = 120, so the answer is 123.",
      },
    ],
    timedQuiz: { timeLimitSeconds: 300, mcqIds: ["q2", "q4", "q7", "q9", "q11"] },
    problemIds: [],
    xpReward: 80, coinReward: 30,
    status: "published",
  },

];
