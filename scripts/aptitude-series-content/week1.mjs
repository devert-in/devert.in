// DeVert Campus - Aptitude Series, Week 1: Foundations (Mon 3 Aug - Sat 8 Aug 2026).
//
// Placement-aptitude prep for engineering students sitting TCS / Infosys /
// Accenture / Cognizant / Capgemini / Wipro / Deloitte / Oracle / Amazon /
// Microsoft / Google campus rounds.
//
// AUTHORING RULES (this file is the reference for weeks 2-5):
//
//  1. `concept` is ONE string parsed by devert-frontend/lib/lessonBlocks.js.
//     Fence syntax is `::: variant optional title` ... `:::`, each on its own
//     line. Inside a `flow` fence NEVER write "->" in a step body - the parser
//     splits flow lines on it. Two-space-indented lines become code blocks, so
//     traced arithmetic is indented on purpose.
//  2. Story or concrete number FIRST, technical name SECOND. Never open a
//     lesson with a formula. Every worked example uses real digits that were
//     actually computed, never "some number x".
//  3. Callouts are used sparingly and purposefully: one `mistake`, one
//     `remember`/`funfact`, exactly one `checkpoint`, and a closing
//     `revision` that works as a 30-second pre-exam re-read. Do not cram one
//     of every available variant into a lesson.
//  4. MCQ shape is `{ id, text, options, correctIndex, explanation }` -
//     `text`, NOT `question` (see campus-daily-learning-editor.jsx's
//     blankMcq()). `correctIndex` is 0-based into that question's own
//     `options`. Every answer below was hand-derived step by step and
//     re-verified; every explanation shows the load-bearing step so a student
//     (or a future editor) can check it without redoing the algebra.
//  5. Wrong options are real miscalculations a student would actually make
//     (wrong base for a percentage, multiplying before dividing, averaging
//     averages), never filler.
//  6. `timedQuiz.mcqIds` are 5 ids drawn from that same day's `mcqs`.
//  7. ASCII hyphens only - scripts/normalize-dashes.mjs rewrites em/en dashes
//     across the database, so authoring them here just creates churn.

export const WEEK1_DAYS = [

  // ------------------------------------------------------------------
  // Day 1 - Monday 3 Aug 2026 - Number Systems
  // ------------------------------------------------------------------
  {
    date: "2026-08-03", dow: "mon", weekId: "2026-08-03", type: "lesson",
    title: "Day 1: Number Systems",
    difficulty: "Easy",
    estimatedMinutes: 15,
    concept: `## 47 Laddus, 5 Friends

::: story
Your grandmother hands you a box of **47 laddus** and says: share them equally with your four friends. Five of you, 47 laddus.

You deal them out one at a time. Everyone ends up with 9. And there are **2 left in the box**.

You have just done the single most useful operation in all of aptitude. You split 47 into "9 each" plus "2 left over". The 9 is the quotient. The 2 is the **remainder**. Almost every number-systems question on a placement paper is secretly a question about that 2.
:::

## The Number Family, Named

Before we chase remainders, one quick round of vocabulary - because papers use these words as though you were born knowing them.

::: cards Who's who in the number family
Natural numbers :: The counting numbers: 1, 2, 3, ... The ones you would use to count laddus.
Whole numbers :: Naturals plus zero: 0, 1, 2, 3, ...
Integers :: Wholes plus the negatives: ... -3, -2, -1, 0, 1, 2, 3 ...
Rational numbers :: Anything writable as one integer over another: 3/4, -7, 0.25, 0.3333... Every terminating decimal and every repeating decimal lives here.
Irrational numbers :: Decimals that never end and never settle into a repeat, so no fraction can capture them: √2 = 1.41421356..., pi = 3.14159265...
Prime numbers :: Exactly two divisors, 1 and itself: 2, 3, 5, 7, 11, 13, ... **1 is not prime** (it has only one divisor) and **2 is the only even prime**.
Composite numbers :: More than two divisors: 4, 6, 8, 9, 10, ... And 1 is neither prime nor composite - it sits outside both boxes.
:::

## Divisibility Without Dividing

::: story
Is 3,71,952 divisible by 8?

You could set up a long division and spend forty seconds on it. Or you could look at the last three digits - 952 - notice that 952 / 8 = 119, and be done in four.

Divisibility rules are not trivia. They are how you dodge arithmetic you do not have time for.
:::

::: table Divisibility rules worth memorising, tested on 3,71,952
Divisor | The rule | Applied to 3,71,952
2 | Last digit is even | 2 is even, so yes
3 | Digit sum is divisible by 3 | 3+7+1+9+5+2 = 27, so yes
4 | Last TWO digits divisible by 4 | 52 / 4 = 13, so yes
5 | Last digit is 0 or 5 | last digit is 2, so no
6 | Divisible by 2 AND by 3 | both hold, so yes
8 | Last THREE digits divisible by 8 | 952 / 8 = 119, so yes
9 | Digit sum is divisible by 9 | 27 / 9 = 3, so yes
11 | Alternating sum of digits from the right is 0 or a multiple of 11 | 2-5+9-1+7-3 = 9, so no
:::

## Remainders Are Just Clock Arithmetic

::: analogy A clock has been doing this your whole life
A clock face has 12 hours. It is 10 o'clock now - what time is it 7 hours later?

Not 17. Clocks reset: 17 - 12 = **5 o'clock**.

That reset *is* a remainder. Working "mod 12" means you only ever care about what is left after throwing away whole 12s, which is exactly what your wall clock does. Mathematicians write it \`17 mod 12 = 5\`, and you have been computing it since you were six.
:::

### The trick that unlocks every big-power question

What is the last digit of \`7^95\`?

You cannot compute \`7^95\`, and you do not have to. Watch only the last digits:

  7^1 = 7        ends in 7
  7^2 = 49       ends in 9
  7^3 = 343      ends in 3
  7^4 = 2401     ends in 1
  7^5 = 16807    ends in 7   <- the pattern has restarted

The last digits **cycle with length 4**: 7, 9, 3, 1, 7, 9, 3, 1, ...

So the only thing you need is where 95 lands inside a cycle of 4. Since \`95 = 4 x 23 + 3\`, the exponent 95 sits at the **3rd** position, and the 3rd entry is **3**. Last digit of \`7^95\` is 3.

::: mistake
The cycle trick gets reversed by almost everyone at the same spot: when the position works out to **0**, it means the LAST entry of the cycle, not the first.

Last digit of \`7^96\`? Here \`96 mod 4 = 0\`, and students confidently write 7 because 7 is first in the cycle. Wrong. A remainder of 0 means 96 is an exact multiple of 4, so you have landed precisely on the 4th entry: \`7^4\` ends in 1, so \`7^96\` ends in **1**.

The runner-up error is treating **1 as prime**. It is not prime, and it is not composite either. Every "how many primes are less than n" question is built to punish someone who forgot that, or who forgot that 2 is itself prime.
:::

::: remember
For the last digit of any power you only ever need a **cycle of at most 4**, because every digit's last-digit pattern repeats with length 1, 2 or 4 - never longer.

Divide the exponent by the cycle length and read the remainder:
- remainder 1, 2 or 3 means that position in the cycle
- remainder 0 means the LAST position in the cycle
:::

::: checkpoint
A number leaves a remainder of 4 when divided by 6. What remainder does it leave when divided by 3?
- ( ) 4
- (x) 1
- ( ) 0
- ( ) It cannot be determined
> Write the number as \`6k + 4\`. Since 6k is already a multiple of 3, and 4 = 3 + 1, the whole thing is \`3(2k + 1) + 1\`, so the remainder is **1**. Sanity-check with a real number: 16 leaves 4 on division by 6, and 16 leaves 1 on division by 3. Answering 4 assumes a remainder survives a change of divisor, which it does not - a remainder is only ever meaningful next to the divisor it came from.
:::

::: revision
Every division splits a number into a quotient and a **remainder**, and it is the remainder that placement papers actually test. Know the family: naturals inside wholes inside integers inside rationals, with the irrationals (√2, pi) sitting outside as non-terminating non-repeating decimals; 1 is neither prime nor composite, and 2 is the only even prime. Memorise the divisibility rules for 3 and 9 (digit sum), 4 (last two digits), 8 (last three digits) and 11 (alternating sum from the right) - each turns a forty-second long division into a four-second glance. Remainders behave like a clock face: \`mod n\` means throwing away whole n's. For the last digit of a large power, list last digits until they repeat (the cycle is always 1, 2 or 4 long), divide the exponent by that cycle length, and read off the position - remembering that a remainder of 0 points at the LAST entry of the cycle, never the first.
:::`,
    mcqs: [
      {
        id: "q1",
        text: "Which of the following is a prime number?",
        options: ["91", "93", "97", "87"],
        correctIndex: 2,
        explanation: "91 = 7 x 13, 93 = 3 x 31 and 87 = 3 x 29, so all three are composite. For 97 you only need to test primes up to its square root (about 9.8): it is not divisible by 2, 3, 5 or 7, so 97 is prime.",
      },
      {
        id: "q2",
        text: "What is the last digit of 7^95?",
        options: ["1", "3", "7", "9"],
        correctIndex: 1,
        explanation: "Last digits of powers of 7 cycle 7, 9, 3, 1 with period 4. Since 95 = 4 x 23 + 3, the exponent sits at the 3rd position of the cycle, so the last digit is 3.",
      },
      {
        id: "q3",
        text: "What is the remainder when 2^31 is divided by 5?",
        options: ["1", "2", "3", "4"],
        correctIndex: 2,
        explanation: "Powers of 2 leave remainders 2, 4, 3, 1 on division by 5, repeating with period 4. Since 31 = 4 x 7 + 3, 2^31 matches the 3rd entry, so the remainder is 3 (same position as 2^3 = 8, which leaves 3).",
      },
      {
        id: "q4",
        text: "A number leaves a remainder of 4 when divided by 6. What remainder does it leave when divided by 3?",
        options: ["0", "1", "2", "4"],
        correctIndex: 1,
        explanation: "The number is 6k + 4 = 3(2k + 1) + 1, so the remainder is 1. Check with 16: it leaves 4 on division by 6, and 1 on division by 3. A remainder does not carry over unchanged to a new divisor.",
      },
      {
        id: "q5",
        text: "Which of these numbers is divisible by 11?",
        options: ["54321", "47289", "91825", "30214"],
        correctIndex: 1,
        explanation: "Alternately add and subtract the digits from the right. For 47289: 9 - 8 + 2 - 7 + 4 = 0, a multiple of 11, so it passes (47289 = 11 x 4299). The others give 3, 19 and 8 respectively, none of which is a multiple of 11.",
      },
      {
        id: "q6",
        text: "What is the smallest number that must be added to 5321 to make it divisible by 9?",
        options: ["4", "5", "7", "8"],
        correctIndex: 2,
        explanation: "Digit sum of 5321 is 5 + 3 + 2 + 1 = 11. The next multiple of 9 is 18, so add 18 - 11 = 7. Check: 5328 has digit sum 18 and 5328 / 9 = 592.",
      },
      {
        id: "q7",
        text: "How many numbers from 1 to 100 (both inclusive) are divisible by 3 or by 5?",
        options: ["45", "47", "53", "60"],
        correctIndex: 1,
        explanation: "Multiples of 3: 33. Multiples of 5: 20. Multiples of 15 have been counted in both: 6. So 33 + 20 - 6 = 47. Forgetting to subtract the 6 overlaps gives the trap answer 53.",
      },
      {
        id: "q8",
        text: "Which of the following numbers is divisible by 8?",
        options: ["74536", "62314", "51140", "83462"],
        correctIndex: 0,
        explanation: "A number is divisible by 8 exactly when its last three digits are. 536 / 8 = 67, so 74536 passes (74536 / 8 = 9317). For the others, 314, 140 and 462 all leave a remainder on division by 8 - note that 51140 ends in 0 but 140 / 8 = 17.5.",
      },
      {
        id: "q9",
        text: "What is the remainder when 15 x 17 x 19 is divided by 7?",
        options: ["1", "3", "5", "6"],
        correctIndex: 0,
        explanation: "Reduce each factor before multiplying: 15 leaves 1, 17 leaves 3 and 19 leaves 5. So the product leaves 1 x 3 x 5 = 15, and 15 itself leaves 1 on division by 7. Verified against the full product: 4845 = 7 x 692 + 1.",
      },
      {
        id: "q10",
        text: "How many prime numbers are there below 20?",
        options: ["7", "8", "9", "10"],
        correctIndex: 1,
        explanation: "2, 3, 5, 7, 11, 13, 17, 19 - eight of them. Counting 1 as prime gives the trap answer 9; forgetting that 2 is prime gives 7.",
      },
      {
        id: "q11",
        text: "Which of the following is NOT a rational number?",
        options: ["0.75", "22/7", "√2", "-5"],
        correctIndex: 2,
        explanation: "A rational number is one integer over another. 0.75 = 3/4, 22/7 already is such a fraction, and -5 = -5/1. But √2 = 1.41421356... never terminates and never repeats, so no such fraction exists - it is irrational. Note 22/7 is only an approximation of pi, and unlike pi it is perfectly rational.",
      },
      {
        id: "q12",
        text: "If a number is divisible by both 4 and 6, it must also be divisible by:",
        options: ["8", "10", "12", "24"],
        correctIndex: 2,
        explanation: "It must be divisible by the LCM of 4 and 6, which is 12 - not by their product 24. Counter-example: 12 is divisible by 4 and by 6, but not by 8 or 24.",
      },
      {
        id: "q13",
        text: "What is the last digit of 2^58?",
        options: ["2", "4", "6", "8"],
        correctIndex: 1,
        explanation: "Last digits of powers of 2 cycle 2, 4, 8, 6 with period 4. Since 58 = 4 x 14 + 2, the exponent sits at the 2nd position, so the last digit is 4.",
      },
      {
        id: "q14",
        text: "What is the sum of the first 30 natural numbers?",
        options: ["435", "450", "465", "496"],
        correctIndex: 2,
        explanation: "Use n(n + 1)/2 with n = 30: 30 x 31 / 2 = 465. Using n(n - 1)/2 by mistake gives 435, and 31 x 32 / 2 = 496 is the sum of the first 31 instead.",
      },
    ],
    timedQuiz: { timeLimitSeconds: 300, mcqIds: ["q2", "q4", "q5", "q7", "q9"] },
    problemIds: [],
    xpReward: 50, coinReward: 20,
    status: "published",
  },

  // ------------------------------------------------------------------
  // Day 2 - Tuesday 4 Aug 2026 - LCM & HCF
  // ------------------------------------------------------------------
  {
    date: "2026-08-04", dow: "tue", weekId: "2026-08-03", type: "lesson",
    title: "Day 2: LCM & HCF",
    difficulty: "Easy",
    estimatedMinutes: 15,
    concept: `## Two Temple Bells

::: story
Two temple bells start ringing together at exactly 6:00 am. One rings every **4 minutes**, the other every **6 minutes**.

When do you next hear them ring together?

The first bell strikes at 6:04, 6:08, 6:12, 6:16, 6:20, 6:24... The second at 6:06, 6:12, 6:18, 6:24... The earliest shared moment is **6:12** - twelve minutes in.

Note what it is *not*. It is not 24 minutes, which is 4 x 6 and the number most people say out loud first. They really do ring together at 6:24 as well, but that is *a* shared moment, not the *first* one.

"The first moment two repeating things line up again" is the **LCM**. Its partner, the **HCF**, answers the opposite question: what is the biggest identical group I can break everything into?
:::

## Euclid's Algorithm: HCF Without Factorising

Find the HCF of 1071 and 462. Factorising both is slow and easy to get wrong. Euclid's method, written down around 300 BCE, is faster than anything you will invent under exam pressure: keep replacing the bigger number with the remainder.

::: flow Euclid on 1071 and 462
1071 / 462 :: quotient 2, remainder 147. Carry forward 462 and 147.
462 / 147 :: quotient 3, remainder 21. Carry forward 147 and 21.
147 / 21 :: quotient 7, remainder 0. Stop here.
HCF = 21 :: the last non-zero remainder is your answer
:::

### The relation that saves you every single time

For **exactly two** numbers:

  HCF x LCM = the product of the two numbers

Test it on the same pair. HCF(1071, 462) = 21, so

  LCM = (1071 x 462) / 21 = 1071 x 22 = 23,562

Now sanity-check it both ways: 23,562 / 1071 = 22 and 23,562 / 462 = 51. Both whole numbers, so 23,562 really is a common multiple. This is the whole reason the relation matters - it gets you an LCM from an HCF in one multiplication, with no factorising at all.

## Reading The Word Problem

Placement papers do not say "find the LCM". They say something in English that means it. This mapping is most of the marks:

::: table Which one is the question actually asking for?
The question says | You need | Why
"ring / meet / flash together again" | LCM | the first common multiple of the cycles
"largest tile, biggest equal groups, maximum size" | HCF | the biggest common divisor
"least number divisible by all of these" | LCM | smallest common multiple, by definition
"greatest number that divides all of these" | HCF | largest common divisor, by definition
"leaves the same remainder in each case" | HCF of the differences | the equal remainder cancels when you subtract
"leaves remainder r with every divisor" | LCM of the divisors, then add r | the LCM is divisible by all of them, so +r preserves the remainder
:::

::: mistake
\`HCF x LCM = product\` is a **two-numbers-only** law, and papers deliberately test whether you know that.

Take 2, 3 and 4. HCF = 1 and LCM = 12, so HCF x LCM = 12. But the product 2 x 3 x 4 = **24**. Not equal, not off by a constant, just false. If a question hands you three numbers and their HCF, there is no shortcut to the LCM.

The other reliable slip is the two-bells one from the story: answering 4 x 6 = 24 instead of LCM = 12. The product of the intervals is always *a* common multiple and almost never the *least* one.
:::

::: remember
**H**CF is **H**ighest common factor, so it is always less than or equal to your smallest number. **L**CM is **L**owest common multiple, so it is always greater than or equal to your largest number. If your HCF comes out bigger than the smallest number, or your LCM smaller than the largest, you have made an arithmetic error - there are no exceptions to check for.

Two one-liners worth having loaded before you walk in:
- For **co-prime** numbers (no shared factor), HCF = 1 and LCM = their product. So 8 and 9 give HCF 1, LCM 72.
- For **fractions**: HCF = HCF of numerators / LCM of denominators, and LCM = LCM of numerators / HCF of denominators. So HCF of 2/3 and 4/9 = HCF(2, 4) / LCM(3, 9) = 2/9.
:::

::: checkpoint
Three traffic lights change every 24, 36 and 60 seconds. All three turn green together at 8:00:00 am. When do they next all turn green together?
- ( ) After 120 seconds
- ( ) After 180 seconds
- (x) After 360 seconds
- ( ) After 51,840 seconds
> You want the LCM. Factorise: 24 = 2^3 x 3, 36 = 2^2 x 3^2, 60 = 2^2 x 3 x 5. Take the highest power of each prime that appears anywhere: 2^3 x 3^2 x 5 = 8 x 9 x 5 = **360** seconds, i.e. 8:06:00 am. Why the others fail: 120 is not divisible by 36, and 180 is not divisible by 24. The last option is 24 x 36 x 60, which is a genuine common multiple but 144 times larger than it needs to be.
:::

::: revision
HCF is the biggest number that divides all of them; LCM is the smallest number all of them divide. Get an HCF fast with **Euclid**: divide, keep the remainder, repeat, and the last non-zero remainder is the answer (1071 and 462 give 147, then 21). For exactly two numbers \`HCF x LCM = their product\`, which converts one into the other in a single step - and it is flatly false for three or more, so never reach for it there. Word-problem mapping: coincide-again and least-number-divisible mean LCM; largest-tile and greatest-number-that-divides mean HCF; same-remainder-in-each-case means HCF of the differences; remainder r with every divisor means LCM plus r. Co-primes have HCF 1 and LCM equal to their product. And the check that catches nearly every slip: an HCF can never exceed your smallest number, and an LCM can never be smaller than your largest.
:::`,
    mcqs: [
      {
        id: "q1",
        text: "What is the HCF of 24 and 36?",
        options: ["6", "8", "12", "18"],
        correctIndex: 2,
        explanation: "24 = 2^3 x 3 and 36 = 2^2 x 3^2. For the HCF take the LOWEST power of each shared prime: 2^2 x 3 = 12. (18 divides 36 but not 24, so it cannot be a common factor.)",
      },
      {
        id: "q2",
        text: "What is the LCM of 12 and 18?",
        options: ["36", "54", "72", "108"],
        correctIndex: 0,
        explanation: "12 = 2^2 x 3 and 18 = 2 x 3^2. For the LCM take the HIGHEST power of each prime: 2^2 x 3^2 = 36. The product 216 is a common multiple but not the least one.",
      },
      {
        id: "q3",
        text: "The HCF of two numbers is 8 and their LCM is 96. If one number is 24, what is the other?",
        options: ["28", "32", "36", "48"],
        correctIndex: 1,
        explanation: "For two numbers, HCF x LCM = their product, so the product is 8 x 96 = 768 and the other number is 768 / 24 = 32. Verify: HCF(24, 32) = 8 and LCM(24, 32) = 96.",
      },
      {
        id: "q4",
        text: "Using Euclid's algorithm, what is the HCF of 1071 and 462?",
        options: ["3", "7", "21", "42"],
        correctIndex: 2,
        explanation: "1071 = 2 x 462 + 147; then 462 = 3 x 147 + 21; then 147 = 7 x 21 + 0. The last non-zero remainder, 21, is the HCF. (42 fails because 1071 is odd, so no even number can divide it.)",
      },
      {
        id: "q5",
        text: "Two bells ring at intervals of 6 seconds and 8 seconds, and they ring together at the start. How many times do they ring together during the next 4 minutes?",
        options: ["8", "10", "12", "30"],
        correctIndex: 1,
        explanation: "They coincide every LCM(6, 8) = 24 seconds. Four minutes is 240 seconds, so they coincide 240 / 24 = 10 times after the start. Using 6 x 8 = 48 seconds instead of the LCM gives the wrong answer 5.",
      },
      {
        id: "q6",
        text: "What is the greatest number that divides 43, 91 and 183, leaving the same remainder in each case?",
        options: ["4", "7", "9", "13"],
        correctIndex: 0,
        explanation: "When the remainder is identical it cancels on subtraction, so take the HCF of the differences: 91 - 43 = 48, 183 - 91 = 92, 183 - 43 = 140. HCF(48, 92) = 4 and HCF(4, 140) = 4. Check: 43, 91 and 183 each leave remainder 3 on division by 4.",
      },
      {
        id: "q7",
        text: "What is the smallest number which, when divided by 12, 15 and 20, leaves a remainder of 5 in each case?",
        options: ["60", "62", "65", "125"],
        correctIndex: 2,
        explanation: "The smallest number divisible by all three is LCM(12, 15, 20) = 60, so the answer is 60 + 5 = 65. Check: 65 = 12x5 + 5 = 15x4 + 5 = 20x3 + 5.",
      },
      {
        id: "q8",
        text: "What is the HCF of the fractions 2/3 and 4/9?",
        options: ["2/9", "2/3", "4/3", "4/9"],
        correctIndex: 0,
        explanation: "For fractions, HCF = (HCF of the numerators) / (LCM of the denominators) = HCF(2, 4) / LCM(3, 9) = 2/9. Verify it divides both exactly: (2/3) / (2/9) = 3 and (4/9) / (2/9) = 2, both whole numbers.",
      },
      {
        id: "q9",
        text: "The HCF of two co-prime numbers is:",
        options: ["0", "1", "their product", "impossible to determine"],
        correctIndex: 1,
        explanation: "Co-prime means they share no factor except 1, so the HCF is 1 by definition. It follows from HCF x LCM = product that the LCM is then the product itself - 8 and 9 are co-prime, with HCF 1 and LCM 72.",
      },
      {
        id: "q10",
        text: "What is the LCM of 24, 36 and 60?",
        options: ["180", "240", "360", "720"],
        correctIndex: 2,
        explanation: "24 = 2^3 x 3, 36 = 2^2 x 3^2, 60 = 2^2 x 3 x 5. Highest power of each prime: 2^3 x 3^2 x 5 = 8 x 9 x 5 = 360. 180 fails (not divisible by 24) and 240 fails (not divisible by 36).",
      },
      {
        id: "q11",
        text: "What is the greatest number that divides 285 and 1249, leaving remainders 9 and 7 respectively?",
        options: ["23", "46", "69", "138"],
        correctIndex: 3,
        explanation: "Strip the remainders first: the number must divide 285 - 9 = 276 and 1249 - 7 = 1242 exactly. Euclid: 1242 = 4 x 276 + 138, then 276 = 2 x 138 + 0, so the HCF is 138. Check: 285 = 138 x 2 + 9 and 1249 = 138 x 9 + 7.",
      },
      {
        id: "q12",
        text: "Two numbers are in the ratio 3 : 4 and their HCF is 5. What is their LCM?",
        options: ["20", "40", "60", "80"],
        correctIndex: 2,
        explanation: "With HCF 5 and ratio 3 : 4 the numbers are 15 and 20. Their product is 300, so LCM = 300 / 5 = 60. Equivalently LCM = HCF x 3 x 4 = 5 x 12 = 60.",
      },
      {
        id: "q13",
        text: "Which of these statements is always true?",
        options: [
          "The HCF of two numbers can be greater than the smaller of them",
          "The LCM of two numbers is always a multiple of their HCF",
          "The LCM of two numbers is always equal to their product",
          "HCF x LCM = product works for any count of numbers",
        ],
        correctIndex: 1,
        explanation: "The HCF divides both numbers and both numbers divide the LCM, so the HCF must divide the LCM - the LCM is always a multiple of it. The HCF can never exceed the smaller number; the LCM equals the product only for co-primes; and HCF x LCM = product holds for exactly two numbers (for 2, 3, 4 the HCF is 1 and the LCM is 12, but the product is 24).",
      },
      {
        id: "q14",
        text: "What is the smallest number that leaves a remainder of 3 when divided by 5, 6 and 8, and is exactly divisible by 9?",
        options: ["123", "243", "483", "723"],
        correctIndex: 1,
        explanation: "Numbers leaving remainder 3 for all of 5, 6 and 8 have the form LCM(5, 6, 8) x k + 3 = 120k + 3. For k = 1, 123 has digit sum 6 and is not divisible by 9. For k = 2, 243 has digit sum 9 and 243 / 9 = 27, so 243 is the answer. Confirm: 243 = 240 + 3, and 240 is divisible by 5, 6 and 8.",
      },
    ],
    timedQuiz: { timeLimitSeconds: 300, mcqIds: ["q3", "q5", "q7", "q11", "q14"] },
    problemIds: [],
    xpReward: 50, coinReward: 20,
    status: "published",
  },

  // ------------------------------------------------------------------
  // Day 3 - Wednesday 5 Aug 2026 - Percentages
  // ------------------------------------------------------------------
  {
    date: "2026-08-05", dow: "wed", weekId: "2026-08-03", type: "lesson",
    title: "Day 3: Percentages",
    difficulty: "Easy",
    estimatedMinutes: 15,
    concept: `## The Discount That Wasn't

::: story
A shop marks a pair of headphones at **1,200 rupees**, then puts up a sign: "20% off, and an extra 10% off at the counter!"

Your friend does the mental maths on the way in: 20 + 10 = 30% off, so 840 rupees.

At the counter it comes to **864**.

Nobody cheated anyone. The second discount came off the *already reduced* price, not the original. 20% off 1,200 is 960. Then 10% off **960** is 96, not 120. And 960 - 96 = 864.

Those missing 24 rupees are the entire reason successive percentage change has its own formula.
:::

## Percent Means Per Hundred - Use That

"Per cent" is Latin for "per hundred", so \`15%\` is literally the fraction 15/100. Once you actually believe that, you stop needing a calculator for the small ones: you build the answer out of 10%, 5% and 1%.

What is 15% of 240?

  10% of 240 = 24          just shift the decimal one place
   5% of 240 = 12          half of the 10%
  15% of 240 = 24 + 12 = 36

And one flip that feels like cheating: **x% of y is always equal to y% of x**, because both are \`x times y / 100\`. So 32% of 150 looks unpleasant, but 150% of 32 is just 32 + 16 = **48**. Same answer, a tenth of the effort.

::: table Fraction to percent - know this cold, it appears constantly
Fraction | Percent | Fraction | Percent
1/2 | 50% | 1/6 | 16.67%
1/3 | 33.33% | 1/7 | 14.29%
2/3 | 66.67% | 1/8 | 12.5%
1/4 | 25% | 1/9 | 11.11%
3/4 | 75% | 1/11 | 9.09%
1/5 | 20% | 1/12 | 8.33%
:::

## Successive Change, Traced Properly

Two changes of a% then b% collapse into a single net change of:

  net % = a + b + (a x b) / 100

Signs matter - a decrease goes in negative. Run the headphones through it with a = -20 and b = -10:

  net = -20 + (-10) + ((-20) x (-10)) / 100
      = -30 + 200 / 100
      = -30 + 2
      = -28%

So the two signs together were a single **28% discount**, and 1,200 x 0.72 = **864**. Exactly what the till said.

## Percentage Points Are Not Percent

::: story
A bank raises its interest rate from **8% to 10%**. One newspaper reports "rates up 2%". Another reports "rates up 25%". Both go to print; only one of them is careless.

The gap 10 - 8 = 2 is **2 percentage points** - a difference between two percentages. But as a *relative* change, measured against where it started, it is 2/8 = **25%**.

The first paper meant percentage points and wrote percent. In a placement paper, that confusion is not a detail - it is the whole question.
:::

::: mistake
Averaging percentages that sit on different bases. If you score 80% on a 10-mark quiz and 40% on a 90-mark exam, your overall percentage is **not** (80 + 40)/2 = 60%.

Go back to marks: 8 out of 10, plus 36 out of 90, is 44 out of 100 = **44%**. The 90-mark paper carries nine times the weight, and averaging the two percentages silently pretends both papers were the same size.

The other guaranteed trap: an a% rise followed by an a% fall never returns you to where you started. Up 20% then down 20% leaves you at 1.2 x 0.8 = 0.96, a **4% loss**, every time - because the fall is taken on the bigger number.
:::

::: remember
Turn every percentage change into a **multiplier** and this whole topic collapses into multiplication:
- up 20% means x 1.2
- down 20% means x 0.8
- up 5% means x 1.05
- down 100% means x 0

Then chain as many as you like by multiplying them. Up 10%, then up 20%, then down 25% is \`1.1 x 1.2 x 0.75 = 0.99\` - a **1% net loss**. No formula to recall, no sign errors, and it handles four changes as easily as two.
:::

::: checkpoint
The price of rice rises by 25%. By what percent must a family cut its consumption to keep its rice bill exactly unchanged?
- ( ) 25%
- (x) 20%
- ( ) 22.5%
- ( ) 30%
> Put real numbers on it: 100 kg at 10 rupees is a bill of 1,000. The new price is 12.50, so to still spend 1,000 they can buy 1000 / 12.5 = **80 kg** - down 20 kg from 100, a cut of **20%**. In general the answer is \`increase / (100 + increase)\` = 25/125 = 20%. Cutting by the same 25% would spend only 75 x 12.5 = 937.50, which is less than before, not equal to it.
:::

::: revision
Percent means per hundred, so \`x% of y\` is \`x times y / 100\` - and because that expression is symmetric, x% of y equals y% of x whenever the flip is easier (32% of 150 = 150% of 32 = 48). Build small percentages from 10%, 5% and 1% rather than reaching for a calculator. Convert every change into a **multiplier** (up 20% is x1.2, down 20% is x0.8) and chain them by multiplying: that one habit covers successive change, replaces the \`a + b + ab/100\` formula, and immediately explains why up-20-then-down-20 is a 4% loss instead of a wash. Keep percentage points separate from percent: 8% to 10% is 2 percentage points but a 25% rise, measured against the old value. Never average percentages taken on different bases - go back to the raw counts. And have the standard conversions memorised, especially 1/3 = 33.33%, 1/6 = 16.67%, 1/8 = 12.5% and 1/12 = 8.33%.
:::`,
    mcqs: [
      {
        id: "q1",
        text: "What is 15% of 240?",
        options: ["32", "34", "36", "40"],
        correctIndex: 2,
        explanation: "10% of 240 is 24, and 5% is half of that, 12. So 15% = 24 + 12 = 36.",
      },
      {
        id: "q2",
        text: "A number is increased by 20%, and the result is then decreased by 20%. The net effect is:",
        options: ["no change", "a 4% increase", "a 4% decrease", "a 2% decrease"],
        correctIndex: 2,
        explanation: "Chain the multipliers: 1.2 x 0.8 = 0.96, so you end at 96% of the start, a 4% decrease. The two moves cannot cancel because the 20% cut is taken on the larger, already-increased amount.",
      },
      {
        id: "q3",
        text: "A shirt marked at 800 rupees is sold at a 25% discount. What is the selling price?",
        options: ["575", "600", "620", "650"],
        correctIndex: 1,
        explanation: "25% of 800 is 200, so the price is 800 - 200 = 600. As a multiplier, 800 x 0.75 = 600.",
      },
      {
        id: "q4",
        text: "40 is what percent of 250?",
        options: ["10%", "16%", "20%", "25%"],
        correctIndex: 1,
        explanation: "40/250 = 4/25 = 16/100 = 16%. Each distractor corresponds to a different wrong base: 40 is 10% of 400, 20% of 200 and 25% of 160.",
      },
      {
        id: "q5",
        text: "A student scored 45 marks out of 60. What is the percentage?",
        options: ["70%", "72%", "75%", "80%"],
        correctIndex: 2,
        explanation: "Simplify the fraction first: 45/60 = 3/4, and 3/4 = 75%.",
      },
      {
        id: "q6",
        text: "If A is 25% more than B, then B is how much less than A?",
        options: ["20%", "25%", "30%", "33.33%"],
        correctIndex: 0,
        explanation: "Let B = 100, so A = 125. B is 25 below A, and 25/125 = 20%. Flipping the comparison changes the base you divide by, which is exactly why the answer is not 25%.",
      },
      {
        id: "q7",
        text: "A town's population rises by 10% in one year and by 20% the next. What is the total percentage increase over the two years?",
        options: ["30%", "32%", "33%", "35%"],
        correctIndex: 1,
        explanation: "1.10 x 1.20 = 1.32, a 32% increase. The extra 2 points beyond the naive 30% are 10% of the 20% - precisely the ab/100 term in the successive-change formula.",
      },
      {
        id: "q8",
        text: "A bank's interest rate moves from 8% to 10%. Which description is correct?",
        options: [
          "The rate rose by 2%",
          "The rate rose by 2 percentage points, which is a 25% rise",
          "The rate rose by 20%",
          "The rate rose by 2 percentage points, which is a 20% rise",
        ],
        correctIndex: 1,
        explanation: "The gap 10 - 8 = 2 is 2 percentage points. Expressed as a relative change it is measured against the old rate: 2/8 = 25%. Dividing by the new rate instead (2/10 = 20%) is the standard error, and calling it simply 'a 2% rise' confuses points with percent.",
      },
      {
        id: "q9",
        text: "In an examination 35% of the candidates failed. If 260 candidates passed, how many sat the exam?",
        options: ["340", "360", "400", "420"],
        correctIndex: 2,
        explanation: "Those who passed are 100 - 35 = 65% of the total, so 0.65 x total = 260 and total = 260 / 0.65 = 400. Check: 35% of 400 = 140 failed, and 400 - 140 = 260.",
      },
      {
        id: "q10",
        text: "The price of sugar rises by 25%. By what percent must a household cut its consumption so that its sugar bill is unchanged?",
        options: ["16.67%", "20%", "25%", "30%"],
        correctIndex: 1,
        explanation: "Use increase / (100 + increase) = 25/125 = 20%. Concretely: 100 kg at 10 rupees costs 1,000; at 12.50 rupees the same 1,000 buys 1000 / 12.5 = 80 kg, which is a 20% cut.",
      },
      {
        id: "q11",
        text: "What is 0.5% of 4000?",
        options: ["0.2", "2", "20", "200"],
        correctIndex: 2,
        explanation: "0.5% = 0.005, and 0.005 x 4000 = 20. Faster: 1% of 4000 is 40, so 0.5% is half of that, 20. Misreading 0.5% as 5% gives the trap answer 200.",
      },
      {
        id: "q12",
        text: "A quantity is increased by 50%, and the result is then decreased by 30%. The net change is:",
        options: ["a 5% increase", "a 20% increase", "a 15% decrease", "a 5% decrease"],
        correctIndex: 0,
        explanation: "1.5 x 0.7 = 1.05, so the net effect is a 5% increase. Simply adding the changes (50 - 30 = 20%) ignores that the 30% cut applies to the enlarged amount, not the original.",
      },
      {
        id: "q13",
        text: "If 30% of a number is 54, what is 45% of the same number?",
        options: ["72", "81", "90", "108"],
        correctIndex: 1,
        explanation: "The number is 54 / 0.30 = 180, so 45% of it is 0.45 x 180 = 81. Shortcut: 45% is 1.5 times 30%, so the answer is 1.5 x 54 = 81. Doubling to 108 would answer 60%, not 45%.",
      },
      {
        id: "q14",
        text: "An employee's salary is first cut by 20% and later raised by 25%. Compared with the original salary, the employee is now:",
        options: ["5% worse off", "exactly level", "5% better off", "2.5% worse off"],
        correctIndex: 1,
        explanation: "0.80 x 1.25 = 1.00 exactly, so the salary is back to its original value. In general a cut of x% is undone by a rise of 100x/(100 - x) percent, and for x = 20 that is 2000/80 = 25%.",
      },
      {
        id: "q15",
        text: "Two successive discounts of 10% and 20% are equivalent to a single discount of:",
        options: ["26%", "28%", "30%", "32%"],
        correctIndex: 1,
        explanation: "0.90 x 0.80 = 0.72, so you pay 72% of the marked price and the single equivalent discount is 28%. Adding the discounts gives 30%, which overstates the saving because the second discount applies to the already-reduced price.",
      },
    ],
    timedQuiz: { timeLimitSeconds: 300, mcqIds: ["q2", "q6", "q8", "q10", "q15"] },
    problemIds: [],
    xpReward: 50, coinReward: 20,
    status: "published",
  },

  // ------------------------------------------------------------------
  // Day 4 - Thursday 6 Aug 2026 - Ratio & Proportion
  // ------------------------------------------------------------------
  {
    date: "2026-08-06", dow: "thu", weekId: "2026-08-03", type: "lesson",
    title: "Day 4: Ratio & Proportion",
    difficulty: "Easy",
    estimatedMinutes: 15,
    concept: `## Sharing The Hackathon Prize

::: story
Three friends win **6,300 rupees** at a college hackathon. They agree to split it "4 to 5 to 6" - Ananya wrote the least code, Ravi the most.

Nobody has any idea how to hand out 6,300 rupees in a 4 : 5 : 6 split. But everybody knows how to cut a cake into equal slices.

So count the slices: 4 + 5 + 6 = **15 slices**. One slice is 6,300 / 15 = **420 rupees**. Now it is just handing out slices - 4 x 420 = 1,680, 5 x 420 = 2,100, 6 x 420 = 2,520. And they add back: 1,680 + 2,100 + 2,520 = 6,300, exactly.

A ratio is nothing more mysterious than a slice count.
:::

## From Ratio To Actual Numbers

::: flow Dividing a quantity in a given ratio
Add the parts :: 4 + 5 + 6 = 15 total parts
Find one part :: 6,300 / 15 = 420 rupees per part
Multiply back :: 4 x 420 = 1,680, then 5 x 420 = 2,100, then 6 x 420 = 2,520
Check the sum :: 1,680 + 2,100 + 2,520 = 6,300. If it does not add up, one of the parts is wrong.
:::

### Chaining two ratios together

Suppose \`a : b = 2 : 3\` and \`b : c = 4 : 5\`. What is \`a : c\`?

You cannot just read off the 2 and the 5, because the two ratios describe **b** with different numbers - 3 in one, 4 in the other. Scale each ratio until b matches:

  a : b = 2 : 3    times 4    gives    8 : 12
  b : c = 4 : 5    times 3    gives   12 : 15

Now b is 12 in both, so \`a : b : c = 8 : 12 : 15\`, and therefore \`a : c = 8 : 15\`.

## Direct Or Inverse? Ask One Question

::: story
Twelve workers build a wall in 10 days. How long would 15 workers take?

If you multiply - more workers, more days - you get nonsense. So ask the only question that matters: **when this goes up, does that go up or down?**

More workers, fewer days. That is **inverse** proportion, and inverse means the *product* is what stays fixed. There are 12 x 10 = 120 worker-days of work in that wall, no matter who does it. So 15 workers need 120 / 15 = **8 days**.
:::

::: table Direct or inverse, and how to set each one up
Kind | What stays constant | Set up as | Worked example
Direct | the ratio a / b | a1 / b1 = a2 / b2 | 16 litres covers 240 km, so 375 km needs 25 litres
Inverse | the product a x b | a1 x b1 = a2 x b2 | 12 workers x 10 days = 15 workers x 8 days
:::

::: mistake
Treating a ratio as if it were an amount. "The ratio of boys to girls is 3 : 2" does **not** mean three boys and two girls, and it does not mean boys are 3/2 of the class. Boys are **3/5** of the class - 60%. Ratio to fraction always means part over *total*, and the total is the sum of the parts, never one of them.

The mixture version of this error catches almost everyone. A 40-litre mixture has milk : water = 3 : 1, so 30 L milk and 10 L water. Now add 10 L of water. Students update the water and quietly forget that the *total* moved too. Milk is still 30 L, water is now 20 L, so the new ratio is 3 : 2 and the new total is 50 L, not 40.

In every "how much must be added" mixture question, the quantity you did **not** touch is your anchor: it never changes, so build the new ratio around it.
:::

::: remember
Partnership profit splits in the ratio of **money x time**, not money alone.

A puts in 8,000 for 6 months; B puts in 6,000 for 8 months. A looks like the bigger investor and gets nothing extra: 8,000 x 6 = 48,000 and 6,000 x 8 = 48,000, so the ratio is **1 : 1** and they split the profit equally. Any partnership question that bothers to give you two different durations is testing exactly this, and the answer is almost never the ratio of the investments.
:::

::: checkpoint
The present ages of A and B are in the ratio 4 : 5. In six years the ratio will be 5 : 6. How old is A now?
- ( ) 20 years
- (x) 24 years
- ( ) 30 years
- ( ) It cannot be found without knowing B's age
> Write the ages as 4x and 5x, so you carry one unknown instead of two. Then (4x + 6)/(5x + 6) = 5/6, giving 6(4x + 6) = 5(5x + 6), so 24x + 36 = 25x + 30 and x = 6. A is 4 x 6 = **24** and B is 30; in six years they are 30 and 36, which is indeed 5 : 6. The classic trap is adding the 6 years to only one side of the ratio.
:::

::: revision
A ratio is a slice count, so the first move is always to **add the parts**: split 6,300 in 4 : 5 : 6 by cutting it into 15 parts of 420 each, then check that the shares sum back. A ratio converts to a fraction of the *total* - 3 : 2 means 3/5 and 2/5, i.e. 60% and 40% - never a fraction of the other part. To chain \`a : b\` with \`b : c\`, scale both until b matches, then read the ends off. Pick your proportion by asking "up or down": **direct** holds the ratio fixed (more petrol, more kilometres - 16 L for 240 km means 25 L for 375 km), **inverse** holds the product fixed (more workers, fewer days - 12 x 10 = 15 x 8). In mixtures, anchor on whatever you did not add, because it is unchanged while the total moves. In partnerships, profit follows **investment x time**, so 8,000 for 6 months and 6,000 for 8 months share equally at 1 : 1. And in age problems, write the ages as 4x and 5x so one unknown does all the work.
:::`,
    mcqs: [
      {
        id: "q1",
        text: "The ratio 36 : 48 in its simplest form is:",
        options: ["3 : 4", "4 : 3", "6 : 8", "9 : 16"],
        correctIndex: 0,
        explanation: "Divide both terms by their HCF, 12: 36/12 = 3 and 48/12 = 4, giving 3 : 4. 6 : 8 is a valid equal ratio but is not in simplest form, and 9 : 16 comes from squaring 3 : 4 instead of dividing.",
      },
      {
        id: "q2",
        text: "6300 rupees is divided among three people in the ratio 4 : 5 : 6. What is the largest share?",
        options: ["1680", "2100", "2520", "2800"],
        correctIndex: 2,
        explanation: "Total parts 4 + 5 + 6 = 15, so one part is 6300 / 15 = 420. The largest share is 6 x 420 = 2520, and the three shares 1680 + 2100 + 2520 do sum to 6300.",
      },
      {
        id: "q3",
        text: "If a : b = 2 : 3 and b : c = 4 : 5, then a : c is:",
        options: ["2 : 5", "3 : 5", "8 : 15", "8 : 12"],
        correctIndex: 2,
        explanation: "Make b agree in both ratios: scale 2 : 3 by 4 to get 8 : 12, and scale 4 : 5 by 3 to get 12 : 15. So a : b : c = 8 : 12 : 15 and a : c = 8 : 15. Reading off the 2 and the 5 directly gives the wrong 2 : 5, and 8 : 12 is a : b.",
      },
      {
        id: "q4",
        text: "In a ratio of 2 : 3, what percentage of the total is the smaller part?",
        options: ["20%", "33.33%", "40%", "66.67%"],
        correctIndex: 2,
        explanation: "The total is 2 + 3 = 5 parts, so the smaller part is 2/5 = 40%. The distractors use the wrong denominator: 2/6 gives 33.33% and 2/3 gives 66.67%.",
      },
      {
        id: "q5",
        text: "Two numbers are in the ratio 5 : 7 and their sum is 96. What is the larger number?",
        options: ["40", "48", "56", "64"],
        correctIndex: 2,
        explanation: "There are 5 + 7 = 12 parts, so one part is 96 / 12 = 8. The numbers are 40 and 56, so the larger is 56. 48 is half the sum, which the 5 : 7 split explicitly rules out.",
      },
      {
        id: "q6",
        text: "If 12 workers can build a wall in 10 days, how many days will 15 workers take at the same rate?",
        options: ["8", "8.5", "12", "12.5"],
        correctIndex: 0,
        explanation: "This is inverse proportion, so the product is constant: 12 x 10 = 120 worker-days. With 15 workers, 120 / 15 = 8 days. Setting it up as a direct proportion (15 x 10 / 12) gives the wrong answer 12.5.",
      },
      {
        id: "q7",
        text: "A and B invest 5000 and 7000 rupees for the same period. A profit of 4800 is shared in proportion to investment. What is B's share?",
        options: ["2000", "2400", "2800", "3000"],
        correctIndex: 2,
        explanation: "The ratio is 5000 : 7000 = 5 : 7, so there are 12 parts of 4800 / 12 = 400 each. B gets 7 x 400 = 2800 and A gets 5 x 400 = 2000. Splitting the profit equally would give 2400.",
      },
      {
        id: "q8",
        text: "A 40-litre mixture has milk and water in the ratio 3 : 1. How much water must be added to make the ratio 3 : 2?",
        options: ["5 litres", "8 litres", "10 litres", "20 litres"],
        correctIndex: 2,
        explanation: "The 40 litres split as 30 L milk and 10 L water. Milk is untouched, so for a 3 : 2 ratio the water must reach 20 L, meaning 10 L is added. The new total is 50 L, not 40 - answering 20 confuses the final water quantity with the amount added.",
      },
      {
        id: "q9",
        text: "If x : y = 3 : 4, what is (3x + 2y) : (2x + y)?",
        options: ["5 : 7", "10 : 17", "13 : 10", "17 : 10"],
        correctIndex: 3,
        explanation: "Substitute the simplest representatives x = 3 and y = 4: 3(3) + 2(4) = 9 + 8 = 17, and 2(3) + 4 = 6 + 4 = 10. So the answer is 17 : 10. Any other multiple of 3 : 4 (say 6 and 8) gives 34 : 20, the same ratio.",
      },
      {
        id: "q10",
        text: "The mean proportional between 4 and 25 is:",
        options: ["8", "10", "12.5", "14.5"],
        correctIndex: 1,
        explanation: "The mean proportional between a and b is √(ab): √(4 x 25) = √100 = 10. Check that it forms a proportion: 4 : 10 = 10 : 25, since both equal 0.4. The distractor 14.5 is the arithmetic mean (4 + 25)/2, a different quantity.",
      },
      {
        id: "q11",
        text: "What is the fourth proportional to 4, 6 and 14?",
        options: ["16", "18", "21", "24"],
        correctIndex: 2,
        explanation: "4 : 6 :: 14 : x means 4x = 6 x 14 = 84, so x = 21. Verify the ratios match: 4/6 = 2/3 and 14/21 = 2/3.",
      },
      {
        id: "q12",
        text: "A car travels 240 km on 16 litres of petrol. How much petrol is needed for 375 km?",
        options: ["22 litres", "24 litres", "25 litres", "27 litres"],
        correctIndex: 2,
        explanation: "Direct proportion, so the ratio stays fixed: 240 / 16 = 15 km per litre, and 375 / 15 = 25 litres.",
      },
      {
        id: "q13",
        text: "The present ages of A and B are in the ratio 4 : 5. Six years from now the ratio will be 5 : 6. How old is A now?",
        options: ["20", "24", "30", "36"],
        correctIndex: 1,
        explanation: "Take the ages as 4x and 5x. Then (4x + 6)/(5x + 6) = 5/6, so 24x + 36 = 25x + 30 and x = 6. A is 4 x 6 = 24 (B is 30, and in six years they are 30 and 36, which is 5 : 6). The answer 30 is B's present age, not A's.",
      },
      {
        id: "q14",
        text: "A invests 8000 rupees for 6 months and B invests 6000 rupees for 8 months. In what ratio should they share the profit?",
        options: ["1 : 1", "3 : 4", "4 : 3", "2 : 3"],
        correctIndex: 0,
        explanation: "Profit follows investment x time: 8000 x 6 = 48000 and 6000 x 8 = 48000, so the ratio is 48000 : 48000 = 1 : 1. Using the investments alone would wrongly give 4 : 3, and using the durations alone would give 3 : 4.",
      },
      {
        id: "q15",
        text: "If 3A = 4B = 6C, then A : B : C is:",
        options: ["2 : 3 : 4", "3 : 4 : 6", "4 : 3 : 2", "6 : 4 : 3"],
        correctIndex: 2,
        explanation: "Set the common value to the LCM of 3, 4 and 6, which is 12. Then A = 12/3 = 4, B = 12/4 = 3 and C = 12/6 = 2, giving 4 : 3 : 2. Check: 3(4) = 4(3) = 6(2) = 12. Copying the coefficients as 3 : 4 : 6 is the reflex error - a larger coefficient means a smaller value.",
      },
    ],
    timedQuiz: { timeLimitSeconds: 300, mcqIds: ["q3", "q6", "q8", "q13", "q14"] },
    problemIds: [],
    xpReward: 50, coinReward: 20,
    status: "published",
  },

  // ------------------------------------------------------------------
  // Day 5 - Friday 7 Aug 2026 - Averages
  // ------------------------------------------------------------------
  {
    date: "2026-08-07", dow: "fri", weekId: "2026-08-03", type: "lesson",
    title: "Day 5: Averages",
    difficulty: "Easy",
    estimatedMinutes: 15,
    concept: `## The Batsman Who Scored 70

::: story
A batsman has **576 runs from 16 innings** - an average of exactly 36. The commentators say he needs a big score to "push his average up".

He scores **70**. New total 646, new count 17, new average 646 / 17 = **38**.

Look carefully at what just happened. One innings moved a sixteen-innings average by two whole runs. Why? Because 70 was **34 above** his average, and that surplus of 34 got shared out across all 17 innings: 34 / 17 = exactly 2.

*The surplus gets shared out.* That sentence is the entire topic. Everything below is a special case of it.
:::

## Average Speed Is Never The Average Of Two Speeds

::: story
You drive 60 km to the next city at **30 km/h**, then the same 60 km home at **60 km/h**. What was your average speed for the trip?

"45" is wrong, and it is wrong for a reason worth understanding: you spent **twice as long** crawling at 30 as you did cruising at 60, so the slow speed deserves twice the weight in the answer.

Do it the only way that is always safe - total distance over total time:

  out:    60 km at 30 km/h  =  2 hours
  back:   60 km at 60 km/h  =  1 hour
  total:  120 km in 3 hours  =  40 km/h
:::

### Weighted average: when the groups are different sizes

A class has **20 boys averaging 60 marks** and **30 girls averaging 70**. The class average is not 65, because there are more girls.

  boys:   20 x 60 = 1,200 marks
  girls:  30 x 70 = 2,100 marks
  class:  3,300 marks over 50 students = 66

The answer sits at 66, nearer the girls' 70, exactly as it should - they are the bigger group.

::: table The four forms that cover almost every averages question
Situation | What to do | Worked instance
Simple average | total / count | 12+18+24+30+36 = 120, over 5, gives 24
Weighted average | sum of (size x average), over total size | (20x60 + 30x70) / 50 = 66
Average speed, equal distances | 2ab/(a+b), never (a+b)/2 | 2 x 30 x 60 / 90 = 40 km/h
One value added, removed or replaced | change in total = count x change in average | 30 + (11 x 1) = 41
:::

::: mistake
Averaging the averages. It is valid only when the groups are the **same size**, and questions are built so that they never are.

20 boys at 60 and 30 girls at 70 gives 66, not 65 - the girls outnumber the boys, so the class average leans towards their 70. Same disease in different clothes: 60 km at 30 km/h and 60 km at 60 km/h gives 40 km/h, not 45, because the slow leg eats twice the clock.

So whenever you see two averages and feel the urge to average them, stop and ask what the **weights** are. If the weights differ at all, go back to totals.
:::

::: remember
One line handles every added / removed / replaced / misread-value question:

  change in total = count x change in average

Eleven numbers average 25, and swapping a 30 for something else pushes the average to 26? The average rose by 1 across 11 numbers, so the total rose by 11, so the new value is 30 + 11 = **41**.

Thirty students average 14, and adding the teacher makes it 15? The average rose by 1 across the **new** count of 31, so the total rose by 31, and the teacher is 14 + 31 = **45**.

The only subtlety is which count to use - the old one when you replace a value, the new one when you add a member.
:::

::: checkpoint
A class of 40 students has an average of 72. It then emerges that two students' marks were entered as 48 and 62 when they should have been 84 and 26. What is the corrected average?
- ( ) 71.5
- (x) 72
- ( ) 72.5
- ( ) 73.6
> Only a change in the **total** can move an average, so check the total before doing anything else. The wrong entries summed to 48 + 62 = 110; the correct ones sum to 84 + 26 = 110. Identical. The total never moved, so the average is still **72**. Papers love this shape because it looks like a two-error correction and is actually a no-op.
:::

::: revision
An average is total / count, so the reflex for every question is to **convert averages back into totals**. One value's distance from the mean gets shared across every member, which is why a 70 in the 17th innings lifts a 36 average to 38 (a surplus of 34, spread over 17). Formalise that as \`change in total = count x change in average\` and it answers every added-member, removed-member, replaced-value and misread-value question in a single line - just be careful whether the count is the old one or the new one. Weighted average is sum of (size x average) over total size, so 20 boys at 60 with 30 girls at 70 gives **66**, not 65; you may only average two averages directly when the groups are equal in size. Average speed is always total distance over total time, so equal distances at a and b give \`2ab/(a+b)\`: 30 and 60 km/h give **40**, never 45. And if a correction leaves the total unchanged, the average does not move at all.
:::`,
    mcqs: [
      {
        id: "q1",
        text: "What is the average of 12, 18, 24, 30 and 36?",
        options: ["22", "24", "25", "26"],
        correctIndex: 1,
        explanation: "The five numbers sum to 120, and 120 / 5 = 24. They are evenly spaced, so the average also equals the middle term, 24 - a useful cross-check.",
      },
      {
        id: "q2",
        text: "What is the average of the first 10 natural numbers?",
        options: ["5", "5.5", "6", "10"],
        correctIndex: 1,
        explanation: "Their sum is 10 x 11 / 2 = 55, and 55 / 10 = 5.5. For the first n natural numbers the average is always (n + 1)/2, here 11/2.",
      },
      {
        id: "q3",
        text: "A car covers 60 km at 30 km/h and the next 60 km at 60 km/h. What is its average speed for the whole journey?",
        options: ["40 km/h", "45 km/h", "48 km/h", "50 km/h"],
        correctIndex: 0,
        explanation: "Time out = 60/30 = 2 h, time back = 60/60 = 1 h, so 120 km in 3 h = 40 km/h. Averaging the two speeds gives 45, which over-credits the fast leg because it took only half as long.",
      },
      {
        id: "q4",
        text: "The average of 5 numbers is 20. If the number 18 is removed, what is the average of the remaining four?",
        options: ["20", "20.5", "21", "22"],
        correctIndex: 1,
        explanation: "The total is 5 x 20 = 100. Removing 18 leaves 82 across 4 numbers, so 82 / 4 = 20.5. Removing a below-average value must push the average up, which rules out anything at or under 20.",
      },
      {
        id: "q5",
        text: "The average age of 30 students is 14 years. Including the class teacher, the average becomes 15. How old is the teacher?",
        options: ["35", "40", "45", "50"],
        correctIndex: 2,
        explanation: "Students total 30 x 14 = 420; with the teacher the total is 31 x 15 = 465, so the teacher is 465 - 420 = 45. Shortcut: the average rose by 1 across the new count of 31, so the teacher is 14 + 31 = 45.",
      },
      {
        id: "q6",
        text: "In a class, 20 boys average 60 marks and 30 girls average 70 marks. What is the class average?",
        options: ["65", "66", "67", "68"],
        correctIndex: 1,
        explanation: "Totals first: 20 x 60 = 1200 and 30 x 70 = 2100, giving 3300 marks across 50 students, so 3300 / 50 = 66. The plain average of 60 and 70 (65) is wrong because the two groups are different sizes.",
      },
      {
        id: "q7",
        text: "The average of 11 numbers is 25. One of them, 30, is replaced by a new number and the average becomes 26. What is the new number?",
        options: ["36", "39", "41", "45"],
        correctIndex: 2,
        explanation: "The average rose by 1 across 11 numbers, so the total rose by 11 and the new number is 30 + 11 = 41. Check with totals: old total 11 x 25 = 275, new total 11 x 26 = 286, and 275 - 30 + 41 = 286.",
      },
      {
        id: "q8",
        text: "A batsman's average after 16 innings is 36. He scores 70 in his 17th innings. What is his new average?",
        options: ["37", "38", "39", "40"],
        correctIndex: 1,
        explanation: "The total was 16 x 36 = 576; adding 70 gives 646, and 646 / 17 = 38. Shortcut: the innings was 70 - 36 = 34 above his average, and 34 spread over 17 innings lifts it by exactly 2.",
      },
      {
        id: "q9",
        text: "The average of 6 numbers is 8. What must a 7th number be so that the average of all seven is 9?",
        options: ["9", "12", "14", "15"],
        correctIndex: 3,
        explanation: "Current total is 6 x 8 = 48 and the required total is 7 x 9 = 63, so the new number is 63 - 48 = 15. Answering 9 forgets that the new value must also drag the other six up to the higher average.",
      },
      {
        id: "q10",
        text: "What is the average of the first five multiples of 7?",
        options: ["17.5", "21", "24.5", "28"],
        correctIndex: 1,
        explanation: "7, 14, 21, 28 and 35 sum to 105, and 105 / 5 = 21. Being evenly spaced, their average is also the middle term, 21.",
      },
      {
        id: "q11",
        text: "A man covers three equal distances at 20, 30 and 60 km/h. What is his average speed?",
        options: ["30 km/h", "33.33 km/h", "36.67 km/h", "40 km/h"],
        correctIndex: 0,
        explanation: "Take 60 km per leg: the times are 3 h, 2 h and 1 h, so 180 km in 6 h = 30 km/h. The arithmetic mean of the speeds is 110/3 = 36.67, which is wrong because the slow legs occupy far more of the clock.",
      },
      {
        id: "q12",
        text: "The average weight of 4 people is 65 kg. A fifth person joins and the average drops to 63 kg. What does the fifth person weigh?",
        options: ["53 kg", "55 kg", "57 kg", "61 kg"],
        correctIndex: 1,
        explanation: "Old total 4 x 65 = 260 and new total 5 x 63 = 315, so the fifth person weighs 315 - 260 = 55 kg. Shortcut: the average fell by 2 across the new count of 5, so the newcomer is 65 - (2 x 5) = 55.",
      },
      {
        id: "q13",
        text: "The average of 9 observations is 40. The average of the first five is 38 and the average of the last five is 43. What is the fifth observation?",
        options: ["40", "42", "45", "48"],
        correctIndex: 2,
        explanation: "All nine sum to 9 x 40 = 360. The first five sum to 190 and the last five to 215, a total of 405 - but the 5th observation belongs to both groups and has been counted twice. So it is 405 - 360 = 45.",
      },
      {
        id: "q14",
        text: "If the average of n numbers is A and every one of the numbers is increased by 5, the new average is:",
        options: ["A", "A + 5", "5A", "A + 5/n"],
        correctIndex: 1,
        explanation: "The total rises by 5n, so the average rises by 5n/n = 5, giving A + 5. Adding 5 to only one of the numbers would raise the average by 5/n instead, which is the distractor.",
      },
      {
        id: "q15",
        text: "The average marks of a class of 40 students is 72. It is then found that two students' marks were recorded as 48 and 62 instead of 84 and 26. What is the corrected average?",
        options: ["71.5", "72", "72.5", "73.6"],
        correctIndex: 1,
        explanation: "The wrong entries sum to 48 + 62 = 110 and the correct ones sum to 84 + 26 = 110. The total is unchanged, so the average stays exactly 72. Only a change in the total can move an average.",
      },
    ],
    timedQuiz: { timeLimitSeconds: 300, mcqIds: ["q3", "q7", "q11", "q13", "q15"] },
    problemIds: [],
    xpReward: 50, coinReward: 20,
    status: "published",
  },

  // ------------------------------------------------------------------
  // Day 6 - Saturday 8 Aug 2026 - Simplification & Approximation
  // ------------------------------------------------------------------
  {
    date: "2026-08-08", dow: "sat", weekId: "2026-08-03", type: "lesson",
    title: "Day 6: Simplification & Approximation",
    difficulty: "Easy",
    estimatedMinutes: 15,
    concept: `## The Expression Ten People Disagree About

::: story
Write this on a whiteboard in front of ten people and you will get three different answers:

  36 / 6 x 2 + 4

One group says 16. Another says 7. Someone says 3.

Only one of them is right, and it is not a matter of taste. Division and multiplication have **equal rank**, so \`36 / 6 x 2\` is read strictly left to right: 36 / 6 = 6, then 6 x 2 = 12, then 12 + 4 = **16**.

The people who said 7 did the multiplication first, getting 36 / 12 = 3 and then 3 + 4 = 7. That single habit - doing M before D because M comes later in the word "BODMAS" - loses more marks on placement papers than any other arithmetic error.
:::

## VBODMAS, Including The Part People Forget

::: timeline VBODMAS in strict order of operation
V for Vinculum :: The bar or overline that groups terms. Rare on a screen, but when it appears it outranks even brackets.
B for Brackets :: Innermost first, then outward: ( ) then { } then [ ].
O for Of :: "Of" means multiply, but it binds tighter than ordinary division. So 12 / 3 of 4 = 12 / 12 = 1, not 4 x 4 = 16.
D and M for Division and Multiplication :: Equal rank, resolved strictly LEFT TO RIGHT. This is where the marks are lost.
A and S for Addition and Subtraction :: Also equal rank, also strictly left to right. So 10 - 4 + 3 = 9, never 3.
:::

Work one nested expression all the way through: \`18 - [6 - {4 - (8 - 6 + 2)}]\`

  innermost:  (8 - 6 + 2)  =  2 + 2  =  4      left to right, NOT 8 - 8 = 0
  next:       {4 - 4}      =  0
  next:       [6 - 0]      =  6
  finally:    18 - 6       =  12

Drop the brackets carelessly and you get 18 - 6 - 4 - 8 + 6 + 2 = 8, which is one of the standard wrong answers.

## Surds And Indices: Six Rules, No More

::: table The index laws you actually need
Rule | Worked example
a^m x a^n = a^(m+n) | 2^5 x 2^3 = 2^8 = 256
a^m / a^n = a^(m-n) | 2^5 / 2^3 = 2^2 = 4
(a^m)^n = a^(mn) | (2^3)^2 = 2^6 = 64
a^0 = 1 for every a other than 0 | 3^0 + 4^0 = 1 + 1 = 2
a^(-n) = 1 / a^n | 2^(-3) = 1/8 = 0.125
a^(m/n) = the n-th root of a, then raised to m | 8^(2/3) = (cube root of 8)^2 = 2^2 = 4
:::

::: reveal Why is a^0 equal to 1 rather than 0?
Because of the division rule. \`a^3 / a^3\` is obviously 1 - anything divided by itself is 1. But by the subtraction rule it is also \`a^(3-3) = a^0\`. Both expressions name the same quantity, so \`a^0\` has to be 1. It is forced by the other rules, not decreed by a textbook.
:::

### Surds: the two moves that carry the marks

Roots multiply and divide freely, but they do **not** add:

  √a x √b  =  √(ab)        so √8 x √2 = √16 = 4
  √a + √b  is NOT  √(a+b)

That second line is worth more marks than the first. \`√1600 + √900\` is 40 + 30 = **70**. It is not \`√2500\` = 50.

And **rationalising** - clearing a root out of a denominator - always uses the conjugate:

  1 / (√5 - 2)  =  (√5 + 2) / ((√5 - 2)(√5 + 2))  =  (√5 + 2) / (5 - 4)  =  √5 + 2

Check it numerically: 1 / (2.236 - 2) = 1 / 0.236 = 4.24, and √5 + 2 = 4.236. Agrees.

## Approximation: Being Wrong On Purpose

::: story
A paper asks for the *approximate* value of \`19.98 x 15.02\`, with options 280, 300, 320 and 360.

Anyone multiplying 19.98 by 15.02 by hand has misread the question. For this purpose 19.98 is 20 and 15.02 is 15, so the answer is 20 x 15 = **300** - and no other option is within 20 of it. (The exact product is 300.10, if you are curious.)

That is a five-second question, and candidates routinely spend ninety on it.
:::

::: mistake
Doing multiplication before division because "M comes after D" in the word BODMAS. It does not work that way: division and multiplication share one rank and are resolved **left to right**, and the same is true of addition and subtraction.

\`36 / 6 x 2\` is 12, not 3. \`100 / 5 x 2\` is 40, not 10. \`10 - 4 + 3\` is 9, not 3.

The runner-up mistake is adding under a root sign. \`√16 + √9\` is 4 + 3 = 7, and it is not \`√25\` = 5. Roots distribute over multiplication and division only - never over addition or subtraction.
:::

::: remember
Round every number to the nearest easy one **before** you compute, then check whether the options are spaced far enough apart to tolerate the rounding. They almost always are, because approximation questions are deliberately set with widely separated options.

\`4998 / 24.97\` becomes 5000 / 25 = **200**. \`15% of 1998 + 25% of 803\` becomes 300 + 200 = **500**.

Keep these to three decimals, because they turn up constantly:
- √2 = 1.414, √3 = 1.732, √5 = 2.236, √7 = 2.646
- pi = 3.142, and 22/7 = 3.143
- 1/√2 = 0.707
:::

::: checkpoint
What is the value of \`8 + 12 / 4 x 3 - 5\`?
- ( ) 4
- ( ) 10
- (x) 12
- ( ) 15
> Division and multiplication first, left to right: 12 / 4 = 3, then 3 x 3 = 9. Now addition and subtraction, left to right: 8 + 9 - 5 = **12**. The trap answer 4 comes from doing 4 x 3 = 12 first and getting 8 + 1 - 5. The answer 10 comes from working the whole line left to right including the leading 8, and 15 from doing that and then forgetting the - 5.
:::

::: revision
VBODMAS is Vinculum, Brackets, Of, Division/Multiplication, Addition/Subtraction - and the load-bearing detail is that **D and M share one rank, as do A and S**, so each pair is settled strictly left to right: \`36 / 6 x 2 = 12\` and \`10 - 4 + 3 = 9\`. Brackets resolve innermost outwards, ( ) then { } then [ ], which is how \`18 - [6 - {4 - (8 - 6 + 2)}]\` comes out as 12. Indices reduce to six rules: add exponents when multiplying, subtract when dividing, multiply when raising a power to a power, \`a^0 = 1\`, \`a^(-n) = 1/a^n\`, and \`a^(m/n)\` is the n-th root raised to m, so \`8^(2/3) = 4\`. Surds multiply and divide freely (\`√8 x √2 = 4\`) but never add: \`√1600 + √900 = 70\`, not 50. Clear a root out of a denominator with its conjugate. And when a question says "approximate", round first and compute second - \`4998 / 24.97\` is just 5000/25 = 200, and the options will be far enough apart to make that completely safe.
:::`,
    mcqs: [
      {
        id: "q1",
        text: "What is the value of 36 / 6 x 2 + 4?",
        options: ["3", "7", "16", "36"],
        correctIndex: 2,
        explanation: "Division and multiplication have equal precedence and are done left to right: 36 / 6 = 6, then 6 x 2 = 12, then 12 + 4 = 16. Doing the multiplication first gives 36 / 12 = 3, and 3 + 4 = 7, which are the two trap answers.",
      },
      {
        id: "q2",
        text: "What is the value of 12 + 6 x (10 - 4) / 3?",
        options: ["16", "24", "36", "48"],
        correctIndex: 1,
        explanation: "Bracket first: 10 - 4 = 6. Then left to right among x and /: 6 x 6 = 36, then 36 / 3 = 12. Finally 12 + 12 = 24. Adding first would give (12 + 6) x 6 / 3 = 36.",
      },
      {
        id: "q3",
        text: "Simplify: 2^5 x 2^3 / 2^4.",
        options: ["8", "16", "32", "64"],
        correctIndex: 1,
        explanation: "Add exponents when multiplying and subtract when dividing: 2^(5 + 3 - 4) = 2^4 = 16. Verify longhand: 32 x 8 = 256, and 256 / 16 = 16.",
      },
      {
        id: "q4",
        text: "What is the value of (3^0 + 4^0) x 5?",
        options: ["0", "5", "10", "35"],
        correctIndex: 2,
        explanation: "Any non-zero number raised to the power 0 is 1, so 3^0 + 4^0 = 1 + 1 = 2, and 2 x 5 = 10. Reading the exponents as if they were absent gives (3 + 4) x 5 = 35; treating a^0 as 0 gives 0.",
      },
      {
        id: "q5",
        text: "What is the value of √144 + √25 x 2?",
        options: ["17", "22", "34", "44"],
        correctIndex: 1,
        explanation: "√144 = 12 and √25 = 5. Multiplication before addition: 5 x 2 = 10, then 12 + 10 = 22. Adding first gives (12 + 5) x 2 = 34, and forgetting the x 2 gives 17.",
      },
      {
        id: "q6",
        text: "What is the value of 2^(-3)?",
        options: ["-8", "-6", "1/8", "1/6"],
        correctIndex: 2,
        explanation: "A negative exponent means a reciprocal, not a negative number: 2^(-3) = 1 / 2^3 = 1/8 = 0.125. Answering -8 treats the minus sign as belonging to the result, and 1/6 multiplies the base by the exponent instead of raising it.",
      },
      {
        id: "q7",
        text: "Simplify: (√7 + √3)(√7 - √3).",
        options: ["4", "10", "√21", "2√21"],
        correctIndex: 0,
        explanation: "This is a difference of squares: (√7)^2 - (√3)^2 = 7 - 3 = 4. The cross terms cancel exactly. Adding the two numbers under one root gives 10, the standard slip.",
      },
      {
        id: "q8",
        text: "Rationalise the denominator of 1/(√5 - 2).",
        options: ["√5 - 2", "√5 + 2", "(√5 + 2)/3", "(√5 + 2)/9"],
        correctIndex: 1,
        explanation: "Multiply numerator and denominator by the conjugate √5 + 2. The denominator becomes (√5)^2 - 2^2 = 5 - 4 = 1, leaving √5 + 2. Numerical check: 1/(2.236 - 2) = 1/0.236 = 4.24, and √5 + 2 = 4.236.",
      },
      {
        id: "q9",
        text: "The approximate value of 19.98 x 15.02 is closest to:",
        options: ["280", "300", "320", "360"],
        correctIndex: 1,
        explanation: "Round to 20 x 15 = 300. The exact product is 300.10, and no other option is within 20 of it - which is why rounding is safe here.",
      },
      {
        id: "q10",
        text: "What is the value of √1600 + √900?",
        options: ["50", "60", "70", "2500"],
        correctIndex: 2,
        explanation: "√1600 = 40 and √900 = 30, so the sum is 70. Roots do not distribute over addition: √1600 + √900 is not √2500 = 50, which is the trap answer.",
      },
      {
        id: "q11",
        text: "What is the value of 8^(2/3)?",
        options: ["2", "4", "5.33", "16"],
        correctIndex: 1,
        explanation: "In a^(m/n) the denominator is the root and the numerator is the power: the cube root of 8 is 2, and 2^2 = 4. Stopping at the cube root gives 2, and multiplying 8 by 2/3 gives 5.33 - a completely different operation.",
      },
      {
        id: "q12",
        text: "The value of 4998 / 24.97 is closest to:",
        options: ["150", "180", "200", "250"],
        correctIndex: 2,
        explanation: "Round to 5000 / 25 = 200. The exact value is about 200.2, comfortably nearest to 200 among the options given.",
      },
      {
        id: "q13",
        text: "Approximately, what is 15% of 1998 plus 25% of 803?",
        options: ["450", "480", "500", "550"],
        correctIndex: 2,
        explanation: "Round the bases: 15% of 2000 = 300 and 25% of 800 = 200, giving 500. The exact value is 299.70 + 200.75 = 500.45, so the rounding costs nothing.",
      },
      {
        id: "q14",
        text: "What is the value of 18 - [6 - {4 - (8 - 6 + 2)}]?",
        options: ["8", "12", "14", "16"],
        correctIndex: 1,
        explanation: "Innermost bracket left to right: 8 - 6 + 2 = 4, not 8 - 8 = 0. Then {4 - 4} = 0, then [6 - 0] = 6, and finally 18 - 6 = 12. Dropping the brackets entirely gives 18 - 6 - 4 - 8 + 6 + 2 = 8, and treating the innermost bracket as 0 gives 16.",
      },
      {
        id: "q15",
        text: "If 3^x = 81, what is the value of 2^(x + 1)?",
        options: ["16", "24", "32", "64"],
        correctIndex: 2,
        explanation: "81 = 3^4, so x = 4. Then 2^(4 + 1) = 2^5 = 32. Stopping at 2^x = 2^4 = 16 is the common slip, and 2^6 = 64 adds one too many.",
      },
    ],
    timedQuiz: { timeLimitSeconds: 300, mcqIds: ["q1", "q7", "q10", "q11", "q14"] },
    problemIds: [],
    xpReward: 50, coinReward: 20,
    status: "published",
  },

];

export default WEEK1_DAYS;
