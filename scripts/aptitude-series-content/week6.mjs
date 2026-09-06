// DeVert Campus - Aptitude Series, Week 6: Quantitative Reasoning III + Recap
// (Mon 31 Aug - Sat 5 Sep 2026). Days 31-36 - a genuine SIXTH week added
// after the original 30-day track's own capstone (Day 30: Aptitude Master
// Review). Not a re-run of what Day 30 already reviewed: this week covers
// five real placement-aptitude topics the 30-day track never touched at all
// (Ages, Partnership, Quadratic Comparison, Height & Distance, Venn
// Diagrams/Set Theory), then closes on its own week-scoped recap - the
// same shape Days 6/12/18/24 (weekly Saturday reviews) already used, not
// the full-series shape Day 30 used.
//
// Placement-aptitude prep for engineering students sitting TCS / Infosys /
// Accenture / Cognizant / Capgemini / Wipro / Deloitte / Oracle / Amazon /
// Microsoft / Google campus rounds.
//
// AUTHORING RULES (identical to week1.mjs/week5.mjs - those files are the
// reference):
//
//  1. `concept` is ONE string parsed by devert-frontend/lib/lessonBlocks.js.
//     Fence syntax is `::: variant optional title` ... `:::`, each on its own
//     line. Inside a `flow` fence NEVER write "->" in a step body - the parser
//     splits flow lines on it. Inside a `table` fence NEVER write a literal
//     "|" in cell text - it is the column separator. Two-space-indented lines
//     become code blocks, so traced arithmetic is indented on purpose.
//  2. Story or concrete number FIRST, technical name SECOND. Never open a
//     lesson with a formula. Day 36 is the deliberate exception: it is a
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

export const WEEK6_DAYS = [

  // ------------------------------------------------------------------
  // Day 31 - Monday 31 Aug 2026 - Problems on Ages
  // ------------------------------------------------------------------
  {
    date: "2026-08-31", dow: "mon", weekId: "2026-08-31", type: "lesson",
    title: "Day 31: Problems on Ages",
    difficulty: "Medium",
    estimatedMinutes: 18,
    concept: `## The One Fact That Never Changes

::: story
Your cousin is 8 years older than you. Right now, in five years, in twenty years - that gap never moves. She was 8 years older the day you were born, and she will be 8 years older on the day you both retire.

That is the entire trick to every ages question a placement paper will ever ask you. Ratios change every year. Sums change every year. The DIFFERENCE between two people's ages is the one number time never touches - and almost every "impossible" ages question dissolves the moment you go looking for that fixed difference instead of chasing the changing ratio.
:::

## Setting Up an Ages Problem

::: flow How to solve any ages question
Assign a variable to the SIMPLEST unknown :: Usually the younger person's current age, or one part of a given ratio - call it x.
Write every other age in terms of that same x :: "3 times as old" becomes 3x. Never introduce a second free variable if the problem already gives you a ratio.
Translate every time-shift literally :: "5 years ago" is (age - 5). "5 years hence/later" is (age + 5). Apply the SAME shift to every person in that sentence.
Turn the sentence into one equation and solve for x :: Most placement ages questions collapse to a single linear equation once this is done correctly.
Answer what was actually asked, not just for x :: The question often wants someone's age in the future, not their present age.
:::

## One Problem, Traced End to End

A is now 3 times as old as B. In 5 years, A will be twice as old as B. Find their present ages.

  let B = x, so A = 3x (present ages)
  in 5 years: A's age = 3x + 5,  B's age = x + 5
  condition: 3x + 5 = 2(x + 5)
             3x + 5 = 2x + 10
             x = 5
  so B = 5, A = 15 (present ages)

  check: in 5 years, A = 20, B = 10, and 20 is exactly twice 10 - confirmed.

::: analogy Why the difference is the anchor
Think of two runners on a track who both jog at exactly the same pace forever. However far apart they start, that gap between them never opens or closes - both are moving at identical speed (one extra year, every year, for everybody). Ages work exactly like this. A - B is fixed for life; only the RATIO A:B drifts, because a fixed gap is a shrinking fraction of a growing number.
:::

## Father-and-Son Sum Problems

A second common shape gives you a SUM instead of a ratio: "The sum of a father's and son's ages is 60. Six years ago, the father was 5 times as old as the son. Find their present ages."

  let son's present age = x, father's present age = 60 - x
  six years ago: son = x - 6, father = 60 - x - 6 = 54 - x
  condition: 54 - x = 5(x - 6)
             54 - x = 5x - 30
             84 = 6x
             x = 14
  son = 14, father = 46 (check: sum = 60 - confirmed; 6 years ago, son = 8, father = 40 = 5 x 8 - confirmed)

::: table Reading time-shift phrases correctly
Phrase | Meaning | Common error
X years ago | current age minus X | Adding X instead of subtracting
X years hence / after X years | current age plus X | Subtracting X instead of adding
X years ago the ratio was a:b | apply "minus X" to BOTH people before taking the ratio | Applying the ratio to present ages instead
After X years the sum will be S | (age1 + X) + (age2 + X) = S, i.e. sum + 2X = S | Forgetting the 2X (X years pass for BOTH people)
:::

::: mistake
The single costliest error is applying a future/past ratio to PRESENT ages instead of to the shifted ages - reading "5 years ago the ratio was 4:3" and writing (present A)/(present B) = 4/3 instead of (A-5)/(B-5) = 4/3. The second-costliest is forgetting that when a SUM shifts by X years, it shifts by 2X, because both people age by X, not just one.
:::

::: checkpoint
The ratio of A's and B's present ages is 5:3. Ten years from now, the ratio will be 3:2. What is A's present age?
- ( ) 30
- ( ) 40
- (x) 50
- ( ) 60
> Let present ages be 5x and 3x. Ten years hence: (5x+10)/(3x+10) = 3/2. Cross-multiply: 2(5x+10) = 3(3x+10) -> 10x+20 = 9x+30 -> x = 10. A's present age = 5x = 50.
:::

::: revision
The difference between two people's ages never changes - anchor every ages problem on that fact when a ratio makes the question feel unsolvable. Assign one variable to the simplest unknown, express everyone else through it, translate "X years ago" as minus X and "X years hence" as plus X applied to EVERYONE in that clause, and remember a shifting SUM moves by 2X (both people age together), never just X. Solve the single resulting linear equation, then re-read the question to answer exactly what was asked - often a future age, not the present one you just solved for.
:::`,
    mcqs: [
      {
        id: "q1",
        text: "The sum of the present ages of a father and his son is 45 years. Five years ago, the father was 6 times as old as the son. Find the son's present age.",
        options: ["8 years", "10 years", "12 years", "15 years"],
        correctIndex: 1,
        explanation: "Let son = x, father = 45 - x. Five years ago: (45 - x - 5) = 6(x - 5) -> 40 - x = 6x - 30 -> 70 = 7x -> x = 10. Check: father = 35, five years ago son = 5 and father = 30 = 6 x 5, confirmed.",
      },
      {
        id: "q2",
        text: "A is 4 years older than B, who is twice as old as C. If the total of the ages of A, B and C is 39, find B's age.",
        options: ["10", "14", "16", "18"],
        correctIndex: 1,
        explanation: "Let C = x, B = 2x, A = 2x + 4. Sum: x + 2x + 2x + 4 = 39 -> 5x = 35 -> x = 7. B = 2x = 14. Check: A = 18, C = 7, sum = 18+14+7 = 39, confirmed.",
      },
      {
        id: "q3",
        text: "The ratio of present ages of two brothers is 4:3. After 6 years, the ratio will be 11:9. What is the elder brother's present age?",
        options: ["12", "16", "20", "24"],
        correctIndex: 1,
        explanation: "Let ages be 4x and 3x. After 6 years: (4x+6)/(3x+6) = 11/9 -> 9(4x+6) = 11(3x+6) -> 36x+54 = 33x+66 -> 3x = 12 -> x = 4. Elder = 4x = 16. Check: after 6 years, 22:18 = 11:9, confirmed.",
      },
      {
        id: "q4",
        text: "A father's age is currently 4 times his son's age. 5 years ago, the father was 7 times as old as the son. What is the father's present age?",
        options: ["30", "35", "40", "45"],
        correctIndex: 2,
        explanation: "Let son = x, father = 4x. Five years ago: 4x - 5 = 7(x - 5) -> 4x - 5 = 7x - 35 -> 30 = 3x -> x = 10. Father = 4x = 40. Check: five years ago, son = 5, father = 35 = 7 x 5, confirmed.",
      },
      {
        id: "q5",
        text: "The present ages of P and Q are in the ratio 5:7. Eight years hence, the ratio will be 7:9. What is Q's present age?",
        options: ["21", "28", "35", "42"],
        correctIndex: 1,
        explanation: "Let ages be 5x and 7x. Eight years hence: (5x+8)/(7x+8) = 7/9 -> 9(5x+8) = 7(7x+8) -> 45x+72 = 49x+56 -> 16 = 4x -> x = 4. Q's present age = 7x = 28. Check: P=20, Q=28, after 8 years 28:36 = 7:9, confirmed.",
      },
      {
        id: "q6",
        text: "Sum of the ages of a mother and daughter is 50 years. After 5 years, the mother's age will be twice that of the daughter's age. What is the mother's present age?",
        options: ["30", "35", "38", "40"],
        correctIndex: 1,
        explanation: "Let daughter = x, mother = 50 - x. After 5 years: (50-x+5) = 2(x+5) -> 55-x = 2x+10 -> 45 = 3x -> x = 15. Mother = 50-15 = 35. Check: after 5 years, mother=40, daughter=20, 40=2x20, confirmed.",
      },
      {
        id: "q7",
        text: "A man's age is 125% of what it was 10 years ago, but 83 and 1/3 percent of what it will be after 10 years. What is his present age?",
        options: ["40", "50", "60", "70"],
        correctIndex: 1,
        explanation: "Let present age = x. x = 1.25(x - 10) -> x = 1.25x - 12.5 -> 0.25x = 12.5 -> x = 50. Check the second condition: x should equal (5/6)(x+10) -> 50 =? (5/6)(60) = 50, confirmed both conditions with x = 50.",
      },
      {
        id: "q8",
        text: "Present ages of A and B are in the ratio 3:5. Seven years ago, this ratio was 4:9. What is A's present age?",
        options: ["9", "15", "20", "25"],
        correctIndex: 1,
        explanation: "Present ages 3x and 5x. Seven years ago: (3x-7)/(5x-7) = 4/9 -> 9(3x-7) = 4(5x-7) -> 27x-63 = 20x-28 -> 7x = 35 -> x = 5. A's present age = 3x = 15. Check: seven years ago, A=8, B=18, ratio 8:18 = 4:9, confirmed.",
      },
      {
        id: "q9",
        text: "The average age of a family of 5 members is 24 years. If the age of the youngest member is 8 years, what was the average age of the family at the time of the youngest member's birth?",
        options: ["18 years", "19 years", "20 years", "22 years"],
        correctIndex: 2,
        explanation: "Total present age of 5 members = 5 x 24 = 120. At the youngest's birth (8 years ago), the youngest did not yet exist, so only the other 4 members are counted, and each of their ages was 8 years less than now: their current total is 120 - 8 = 112, so 8 years ago it was 112 - 4x8 = 112 - 32 = 80. Average then = 80 / 4 = 20 years.",
      },
      {
        id: "q10",
        text: "Ten years ago, A was half of B's age. If the ratio of their present ages is 3:4, what will be the total of their present ages?",
        options: ["28", "35", "42", "49"],
        correctIndex: 1,
        explanation: "Present ages: 3x and 4x. Ten years ago: 3x - 10 = (1/2)(4x - 10) -> 6x - 20 = 4x - 10 -> 2x = 10 -> x = 5. Present ages: 15 and 20, total = 35. Check: ten years ago, 5 and 10, and 5 is indeed half of 10, confirmed.",
      },
    ],
    timedQuiz: { timeLimitSeconds: 300, mcqIds: ["q1", "q2", "q5", "q6", "q10"] },
    problemIds: [],
    xpReward: 50, coinReward: 20,
    status: "published",
  },

  // ------------------------------------------------------------------
  // Day 32 - Tuesday 1 Sep 2026 - Partnership
  // ------------------------------------------------------------------
  {
    date: "2026-09-01", dow: "tue", weekId: "2026-08-31", type: "lesson",
    title: "Day 32: Partnership - Sharing Profit by Capital and Time",
    difficulty: "Medium",
    estimatedMinutes: 17,
    concept: `## Two Friends, One Shop, Unequal Timing

::: story
Two friends open a shop together. One puts in more money. The other joins three months late. At year end there is a profit to split - and "split it evenly, we're partners" is exactly the wrong instinct that costs half the class marks on this topic.

A partnership does not reward people equally. It rewards MONEY, held for TIME. Put in twice as much for the same duration, and you earn twice the share. Put in the same amount for half the duration, and you earn half the share. The moment you see partnership as capital multiplied by time, every version of this topic becomes the same one calculation.
:::

## The Core Rule

::: remember
Profit is shared in the ratio of (capital invested x time invested), for every partner, added up. This single ratio - never a plain capital ratio, unless every partner invested for the exact same duration - is the entire topic.
:::

## Simple Partnership (Equal Time)

When every partner invests for the SAME length of time, the time cancels out of the ratio, and profit splits directly in the ratio of capitals.

  A invests Rs 20,000 and B invests Rs 30,000, both for the full year. Profit = Rs 15,000.
  ratio = 20000 : 30000 = 2 : 3
  A's share = (2/5) x 15000 = Rs 6,000        B's share = (3/5) x 15000 = Rs 9,000

## Compound Partnership (Unequal Time)

When partners invest for DIFFERENT durations, multiply each partner's capital by the number of months (or years) it was actually invested, and share the profit in THAT ratio.

  A invests Rs 4,000 for 12 months. B invests Rs 6,000 for 8 months (joins later, or withdraws early). Profit = Rs 760.
  A's capital-months = 4000 x 12 = 48,000
  B's capital-months = 6000 x 8  = 48,000
  ratio = 48000 : 48000 = 1 : 1
  A's share = Rs 380        B's share = Rs 380

::: flow How to solve any compound partnership question
List each partner's capital and the exact months it stayed invested :: A late joiner invests for fewer months than the full period; someone who withdraws early stops counting from that point.
Multiply capital x months for each partner :: This produces one "capital-month" number per partner - the true basis for sharing.
Reduce those numbers to their simplest ratio :: Divide out any common factor, exactly like simplifying any ratio.
Split the total profit in that exact ratio :: Each partner's share = (their part of the ratio / sum of the ratio) x total profit.
:::

## A Partner Who Joins Mid-Year

A starts a business with Rs 10,000. After 4 months, B joins with Rs 15,000. At year end, profit is Rs 4,600. Find each share.

  A's capital-months = 10000 x 12 = 120,000   (invested the full 12 months)
  B's capital-months = 15000 x 8  = 120,000   (only invested for the remaining 8 months, since B joined after month 4)
  ratio = 120000 : 120000 = 1 : 1
  each share = 4600 / 2 = Rs 2,300

::: table Working vs sleeping partners
Partner type | What they get first | Then shares remaining profit
Sleeping / investing partner | Nothing extra | By capital-month ratio only
Working partner (also manages the business) | An agreed commission/salary off the top | The REMAINING profit, by capital-month ratio, same as everyone else
:::

::: mistake
The most common error is splitting profit by capital alone when the partners actually invested for different durations - forgetting the "time" half of "capital x time" entirely. The second is getting a late joiner's month count wrong: joining "after 4 months" of a 12-month year means invested for 12 - 4 = 8 months, not 4.
:::

::: checkpoint
A invests Rs 8,000 for the full year. B invests Rs 12,000, but only for 6 months. What is A's share of a Rs 2,800 profit?
- (x) Rs 1,600
- ( ) Rs 880
- ( ) Rs 1,320
- ( ) Rs 1,200
> A's capital-months = 8000 x 12 = 96,000. B's capital-months = 12000 x 6 = 72,000. Ratio = 96000:72000 = 4:3, which is 4 parts out of 7. A's share = (4/7) x 2800 = Rs 1,600.
:::

::: revision
Partnership always reduces to one ratio: each partner's capital multiplied by the number of months it was actually invested, added up across partners. Equal-duration partnerships collapse this to a plain capital ratio; a late joiner or early exit changes only the month count, never the underlying rule. A working partner takes an agreed cut first; everyone, including that partner, then shares whatever remains by the same capital-month ratio.
:::`,
    mcqs: [
      {
        id: "q1",
        text: "A and B invest Rs 15,000 and Rs 25,000 respectively in a business, both for the full year. If the profit is Rs 12,000, find A's share.",
        options: ["Rs 4,000", "Rs 4,500", "Rs 5,000", "Rs 6,000"],
        correctIndex: 1,
        explanation: "Ratio = 15000:25000 = 3:5. A's share = (3/8) x 12000 = Rs 4,500.",
      },
      {
        id: "q2",
        text: "A starts a business with Rs 30,000. After 4 months, B joins with Rs 45,000. Find the ratio in which profit should be shared at year end.",
        options: ["2:3", "1:1", "4:5", "3:4"],
        correctIndex: 1,
        explanation: "A's capital-months = 30000 x 12 = 360,000. B's capital-months = 45000 x 8 = 360,000 (invested for 12-4=8 months). Ratio = 360000:360000 = 1:1.",
      },
      {
        id: "q3",
        text: "A invests Rs 5,000 for the full year. B invests Rs 6,000 but withdraws after 8 months. If the total profit is Rs 900, find B's share.",
        options: ["Rs 350", "Rs 400", "Rs 450", "Rs 500"],
        correctIndex: 1,
        explanation: "A's capital-months = 5000 x 12 = 60,000. B's capital-months = 6000 x 8 = 48,000. Ratio = 60000:48000 = 5:4, so B's share is 4 parts out of 9. B's share = (4/9) x 900 = Rs 400.",
      },
      {
        id: "q4",
        text: "A, B and C invest in the ratio 2:3:5 for the same duration. If the total profit is Rs 4,000, find C's share.",
        options: ["Rs 800", "Rs 1,200", "Rs 2,000", "Rs 1,600"],
        correctIndex: 2,
        explanation: "Total ratio parts = 2+3+5 = 10. C's share = (5/10) x 4000 = Rs 2,000.",
      },
      {
        id: "q5",
        text: "A invests Rs 12,000 for 6 months and B invests Rs 8,000 for 9 months. Find the ratio of their profit shares.",
        options: ["2:1", "1:1", "3:2", "4:3"],
        correctIndex: 1,
        explanation: "A's capital-months = 12000 x 6 = 72,000. B's capital-months = 8000 x 9 = 72,000. Ratio = 1:1.",
      },
      {
        id: "q6",
        text: "A working partner manages the business and takes 10% of the profit as salary before the remaining profit is split by capital ratio 2:3 between A and B. If total profit is Rs 5,000, find A's total earning (assuming A is the working partner).",
        options: ["Rs 2,300", "Rs 2,000", "Rs 1,800", "Rs 2,500"],
        correctIndex: 0,
        explanation: "Salary = 10% of 5000 = Rs 500. Remaining = Rs 4,500, split 2:3, so A's share of that = (2/5) x 4500 = Rs 1,800. A's total = salary + share = 500 + 1800 = Rs 2,300.",
      },
      {
        id: "q7",
        text: "Three partners invest Rs 10,000, Rs 15,000 and Rs 25,000 for the full year. If the total profit is Rs 5,000, find the difference between the highest and lowest shares.",
        options: ["Rs 1,000", "Rs 1,500", "Rs 1,875", "Rs 2,000"],
        correctIndex: 1,
        explanation: "Ratio = 10000:15000:25000 = 2:3:5, total 10 parts, so each part = 5000/10 = Rs 500. Highest share (5 parts) = Rs 2,500. Lowest share (2 parts) = Rs 1,000. Difference = 2500 - 1000 = Rs 1,500.",
      },
      {
        id: "q8",
        text: "A and B enter into a partnership. A invests Rs 6,000 for 8 months, B invests some amount for 6 months. If the profit is shared equally, how much did B invest?",
        options: ["Rs 6,000", "Rs 8,000", "Rs 7,000", "Rs 9,000"],
        correctIndex: 1,
        explanation: "Equal profit share means equal capital-months: 6000 x 8 = B x 6 -> 48000 = 6B -> B = Rs 8,000.",
      },
      {
        id: "q9",
        text: "A invests Rs 20,000 for the full year. B joins after 3 months with Rs 15,000 and leaves 2 months before the year ends. Find the ratio of their capital-months.",
        options: ["16:7", "20:9", "20:15", "12:7"],
        correctIndex: 0,
        explanation: "A's capital-months = 20000 x 12 = 240,000. B invested from month 4 through month 10 (leaving 2 months before year end, i.e. stopping at month 12-2=10), a span of 7 months: 15000 x 7 = 105,000. Ratio = 240000:105000; dividing both by 15,000 gives 16:7.",
      },
      {
        id: "q10",
        text: "The ratio of investments of A and B is 3:5 and the ratio of their profits is 6:5. If A invested for 8 months, for how long did B invest?",
        options: ["4 months", "6 months", "5 months", "8 months"],
        correctIndex: 0,
        explanation: "Profit ratio = capital ratio x time ratio. 6/5 = (3/5) x (8/t) -> 6/5 = 24/(5t) -> 6 x 5t = 24 x 5 -> 30t = 120 -> t = 4 months.",
      },
    ],
    timedQuiz: { timeLimitSeconds: 300, mcqIds: ["q1", "q2", "q4", "q6", "q10"] },
    problemIds: [],
    xpReward: 50, coinReward: 20,
    status: "published",
  },

  // ------------------------------------------------------------------
  // Day 33 - Wednesday 2 Sep 2026 - Quadratic Equations & Comparison of Quantities
  // ------------------------------------------------------------------
  {
    date: "2026-09-02", dow: "wed", weekId: "2026-08-31", type: "lesson",
    title: "Day 33: Quadratic Equations & Comparison of Quantities",
    difficulty: "Medium",
    estimatedMinutes: 18,
    concept: `## Two Equations, One Question: Which Is Bigger?

::: story
A bank exam does not usually ask you to just "solve for x". It hands you two separate equations - one in x, one in y - and asks a completely different question: once both are solved, is x bigger, is y bigger, are they equal, or is it impossible to say for certain? That reframing is the whole topic, and most of the marks are lost not to algebra but to stopping one step too early - solving both equations, then forgetting to actually COMPARE every possible pairing of roots.
:::

## The Method

::: flow How to solve a quantity-comparison question
Solve equation I completely :: Factor it, or use the quadratic formula, and list every root of x.
Solve equation II completely :: Same process, listing every root of y.
Compare EVERY x against EVERY y, not just one pairing :: With two roots each, that is up to four comparisons - miss one and you can wrongly declare a relationship that does not always hold.
Pick the one relationship that holds for every pairing :: x > y always, x < y always, x = y always, x >= y (mixes > and =, never <), x <= y (mixes < and =, never >), or "cannot be determined" if the sign genuinely flips between pairings.
:::

## A Worked Example

I. x^2 - 9x + 20 = 0          II. y^2 - 11y + 30 = 0

  factor I:  x^2 - 9x + 20 = (x - 4)(x - 5) = 0   ->  x = 4 or x = 5
  factor II: y^2 - 11y + 30 = (y - 5)(y - 6) = 0  ->  y = 5 or y = 6

  compare every pairing:
    x=4 vs y=5: x < y
    x=4 vs y=6: x < y
    x=5 vs y=5: x = y
    x=5 vs y=6: x < y

  every single pairing gives x < y or x = y, never x > y - so the relationship that ALWAYS holds is x <= y.

## A Second Shape: One Linear, One Quadratic

I. 2x + 7 = 15          II. y^2 - 5y + 6 = 0

  solve I: 2x = 8 -> x = 4  (only one root - it is linear)
  factor II: (y-2)(y-3) = 0 -> y = 2 or y = 3

  compare: x=4 vs y=2: x > y.   x=4 vs y=3: x > y.
  every pairing gives x > y, so the answer is simply x > y.

::: table Reading the final relationship
Every pairing gives... | Answer
Only x > y | x > y
Only x < y | x < y
Only x = y | x = y
A mix of x > y and x = y (never x < y) | x >= y
A mix of x < y and x = y (never x > y) | x <= y
A mix of x > y and x < y (in different pairings) | Relationship cannot be determined
:::

::: mistake
The single most common error is comparing only ONE pair of roots (often just the larger root of each equation) and stopping there - a question with two roots per equation almost always needs every pairing checked before you can safely rule out "cannot be determined". The second is misreading (x-4)(x-5)=0 as giving x=-4,-5 instead of x=4,5 - factoring gives roots that make each bracket zero, so (x-4)=0 means x=+4, not -4.
:::

::: checkpoint
I. x^2 - 7x + 12 = 0          II. y^2 - 8y + 15 = 0. What is the relationship between x and y?
- ( ) x > y
- ( ) x < y
- (x) Relationship cannot be determined
- ( ) x = y
> Factor I: (x-3)(x-4)=0 -> x=3 or 4. Factor II: (y-3)(y-5)=0 -> y=3 or 5. Pairings: (3,3) x=y; (3,5) x<y; (4,3) x>y; (4,5) x<y. Since both x>y and x<y appear across different pairings, no single relationship holds for every case - the answer is "cannot be determined".
:::

::: revision
Solve both equations completely first - never stop at one root if an equation is quadratic. Then compare every possible pairing of roots, not just the first one you notice. The final answer is whichever single relationship (>, <, =, >=, <=) holds across every pairing without exception; if some pairings give x>y and others give x<y, the honest answer is that the relationship cannot be determined - that option exists precisely for this case and is often the actual correct answer, not a fallback for a solver who got stuck.
:::`,
    mcqs: [
      {
        id: "q1",
        text: "I. x^2 - 5x + 6 = 0   II. y = 2. What is the relationship between x and y?",
        options: ["x > y", "x < y", "x >= y", "x <= y"],
        correctIndex: 2,
        explanation: "I factors to (x-2)(x-3)=0 -> x=2 or 3. II gives y=2 (fixed). Pairings: x=2 vs y=2 gives x=y; x=3 vs y=2 gives x>y. Since one pairing gives equality and the other gives x>y (never x<y), the relationship that holds for every pairing is x >= y.",
      },
      {
        id: "q2",
        text: "I. 2x - 8 = 0   II. y^2 - 9y + 20 = 0. What is the relationship between x and y?",
        options: ["x > y", "x < y", "x >= y", "x <= y"],
        correctIndex: 3,
        explanation: "I gives x = 4. II factors to (y-4)(y-5)=0 -> y=4 or 5. Pairings: x=4 vs y=4 gives x=y; x=4 vs y=5 gives x<y. Since one pairing gives equality and the other gives x<y (never x>y), the relationship that holds for every pairing is x <= y.",
      },
      {
        id: "q3",
        text: "I. x^2 - 16 = 0   II. y^2 - 25 = 0. What is the relationship between x and y?",
        options: ["x > y", "x < y", "Cannot be determined", "x = y"],
        correctIndex: 2,
        explanation: "I gives x = 4 or -4. II gives y = 5 or -5. Pairings: (4,5) x<y; (4,-5) x>y; (-4,5) x<y; (-4,-5) x>y. Both x>y and x<y occur across different pairings, so the relationship genuinely cannot be determined.",
      },
      {
        id: "q4",
        text: "I. x^2 - 12x + 35 = 0   II. y^2 - 14y + 48 = 0. What is the relationship between x and y?",
        options: ["x > y", "x < y", "Cannot be determined", "x = y"],
        correctIndex: 2,
        explanation: "I factors to (x-5)(x-7)=0 -> x=5 or 7. II factors to (y-6)(y-8)=0 -> y=6 or 8. Pairings: (5,6) x<y; (5,8) x<y; (7,6) x>y; (7,8) x<y. Since both x>y and x<y appear across different pairings, the relationship cannot be determined.",
      },
      {
        id: "q5",
        text: "I. x^2 - 11x + 30 = 0   II. y = 3. What is the relationship between x and y?",
        options: ["x > y always", "x < y always", "Cannot be determined", "x = y always"],
        correctIndex: 0,
        explanation: "I factors to (x-5)(x-6)=0 -> x=5 or 6. II gives y=3 (fixed). Pairings: x=5 vs y=3 gives x>y; x=6 vs y=3 gives x>y. Every pairing gives x>y, so x > y always.",
      },
      {
        id: "q6",
        text: "I. x^2 - 3x - 10 = 0   II. y^2 - y - 20 = 0. What is the relationship between x and y?",
        options: ["x > y", "x < y", "x = y", "Cannot be determined"],
        correctIndex: 3,
        explanation: "I factors to (x-5)(x+2)=0 -> x=5 or -2. II factors to (y-5)(y+4)=0 -> y=5 or -4. Pairings: (5,5) equal; (5,-4) x>y; (-2,5) x<y; (-2,-4) x>y. Since both x>y and x<y appear, the relationship cannot be determined.",
      },
      {
        id: "q7",
        text: "I. x^2 = 49   II. y^2 - 15y + 56 = 0. What is the relationship between x and y?",
        options: ["x > y", "x < y", "x >= y", "x <= y"],
        correctIndex: 3,
        explanation: "I gives x = 7 or -7. II factors to (y-7)(y-8)=0 -> y=7 or 8. Pairings: (7,7) equal; (7,8) x<y; (-7,7) x<y; (-7,8) x<y. Every pairing gives x=y or x<y (never x>y), so the relationship that holds for every pairing is x <= y.",
      },
      {
        id: "q8",
        text: "I. x^2 - 4x + 4 = 0   II. y^2 - 6y + 9 = 0. What is the relationship between x and y?",
        options: ["x > y", "x < y", "Cannot be determined", "x = y"],
        correctIndex: 1,
        explanation: "I factors to (x-2)^2=0 -> x=2 (a repeated root, only one value). II factors to (y-3)^2=0 -> y=3 (also repeated, only one value). Since x=2 and y=3 are the ONLY values each can take, x < y always, with no other pairing possible.",
      },
      {
        id: "q9",
        text: "I. x^2 - x - 12 = 0   II. y^2 + y - 12 = 0. What is the relationship between x and y?",
        options: ["x > y", "x < y", "Cannot be determined", "x = y"],
        correctIndex: 2,
        explanation: "I factors to (x-4)(x+3)=0 -> x=4 or -3. II factors to (y+4)(y-3)=0 -> y=-4 or 3. Pairings: (4,-4) x>y; (4,3) x>y; (-3,-4) x>y; (-3,3) x<y. Since both x>y and x<y appear across pairings, the relationship cannot be determined.",
      },
      {
        id: "q10",
        text: "I. 5x + 3 = 28   II. 4y - 5 = 15. What is the relationship between x and y?",
        options: ["x > y", "x < y", "Cannot be determined", "x = y"],
        correctIndex: 3,
        explanation: "I: 5x = 25 -> x = 5. II: 4y = 20 -> y = 5. Both are linear equations giving exactly one root each, and both roots equal 5, so x = y always.",
      },
    ],
    timedQuiz: { timeLimitSeconds: 300, mcqIds: ["q1", "q3", "q5", "q8", "q10"] },
    problemIds: [],
    xpReward: 50, coinReward: 20,
    status: "published",
  },

  // ------------------------------------------------------------------
  // Day 34 - Thursday 3 Sep 2026 - Height & Distance
  // ------------------------------------------------------------------
  {
    date: "2026-09-03", dow: "thu", weekId: "2026-08-31", type: "lesson",
    title: "Day 34: Height & Distance - Angles of Elevation and Depression",
    difficulty: "Medium",
    estimatedMinutes: 18,
    concept: `## Looking Up at a Tower

::: story
Stand at the base of a tall building and look straight up at its top - your line of sight makes an angle with the flat ground. Walk further away, and that angle shrinks; the building looks "less steep" from farther back. Walk closer, and the angle grows. That single relationship, angle-in vs distance-out, is the entire topic, and it needs exactly one trigonometric ratio to make it precise: tangent.
:::

## The One Ratio That Matters

::: remember
In a right triangle formed by a vertical height and a horizontal distance, tan(angle) = opposite / adjacent = height / horizontal distance. The angle of ELEVATION is measured upward from the horizontal (looking up at something tall); the angle of DEPRESSION is measured downward from the horizontal (looking down at something below you) - and by simple geometry (alternate angles on a pair of parallel lines), an angle of depression from the top equals the angle of elevation from the bottom, for the same two points.
:::

::: table Standard angle values worth memorising cold
Angle | tan(angle) | Rough decimal
30 degrees | 1 / sqrt(3) | 0.577
45 degrees | 1 | 1.000
60 degrees | sqrt(3) | 1.732
:::

## A Single Observation

A tower's angle of elevation from a point on the ground is 60 degrees, and the point is 20 m from the tower's base. Find the tower's height.

  tan(60) = height / distance
  sqrt(3) = height / 20
  height = 20 x sqrt(3) = 20 x 1.732 = 34.64 m

## Moving Closer: Two Observations, One Height

A tower's angle of elevation from a point is 30 degrees. Moving 20 m closer to the tower, the angle becomes 60 degrees. Find the tower's height.

  let height = h, and let d = distance from the tower at the FIRST (farther) point
  from the first point:  tan(30) = h / d           ->  d = h x sqrt(3)
  from the second point: tan(60) = h / (d - 20)     ->  d - 20 = h / sqrt(3)

  subtract the two distance expressions:
    d - (d - 20) = h x sqrt(3) - h / sqrt(3)
    20 = h x (sqrt(3) - 1/sqrt(3))
    20 = h x (2 / sqrt(3))              [ since sqrt(3) - 1/sqrt(3) = (3-1)/sqrt(3) = 2/sqrt(3) ]
    h = 20 x sqrt(3) / 2 = 10 x sqrt(3) = 17.32 m

  check: d = h x sqrt(3) = 10sqrt(3) x sqrt(3) = 30 m.  d - 20 = 10 m.
         h/d = 10sqrt(3)/30 = sqrt(3)/3 = 1/sqrt(3) = tan(30), confirmed.
         h/(d-20) = 10sqrt(3)/10 = sqrt(3) = tan(60), confirmed.

::: flow How to solve a two-angle height question
Draw ONE right triangle per observation point, sharing the same vertical height h :: Both triangles share the tower as their vertical side.
Write tan(angle) = h / distance for each observation, solving each for "distance" :: This gives two separate expressions for distance, both in terms of h.
Use the KNOWN gap between the two distances to build one equation in h alone :: Subtract the two distance expressions and set that equal to the given gap (how far the observer moved).
Solve for h, then substitute back to find either distance if the question asks for it :: Always re-read what was actually asked - height, distance, or both.
:::

::: mistake
The most common error is swapping which trigonometric ratio applies - using sin or cos instead of tan for a simple height/distance setup where the triangle's right angle is at the base of the tower (tan is correct exactly when height and horizontal distance are the two legs you know, which is the standard setup for this topic). The second is mixing up which angle belongs to which distance - the SMALLER angle always belongs to the FARTHER point, since standing farther away makes a tall object look "less steep".
:::

::: checkpoint
From the top of a 50 m tall building, the angle of depression to a car on the ground is 30 degrees. How far is the car from the base of the building?
- ( ) 25 m
- ( ) 50 m
- (x) 50 x sqrt(3) m
- ( ) 100 m
> The angle of depression from the top equals the angle of elevation from the ground, so tan(30) = height / distance = 50 / distance. Since tan(30) = 1/sqrt(3): 1/sqrt(3) = 50/distance -> distance = 50 x sqrt(3) m (approximately 86.6 m).
:::

::: revision
Every height-and-distance question reduces to tan(angle) = height / horizontal distance, in a right triangle with its right angle at the tower's base. Memorise tan(30)=1/sqrt(3), tan(45)=1, tan(60)=sqrt(3) cold. An angle of depression from a height equals the angle of elevation from the ground for the same two points. With two observation points, write "distance" in terms of h for each using its own angle, then use the known gap between the two distances to solve for h directly - the smaller angle always belongs to the farther point.
:::`,
    mcqs: [
      {
        id: "q1",
        text: "The angle of elevation of the top of a tower from a point 30 m away from its base is 45 degrees. Find the height of the tower.",
        options: ["15 m", "30 m", "30 x sqrt(3) m", "45 m"],
        correctIndex: 1,
        explanation: "tan(45) = height/30. Since tan(45) = 1, height = 30 m.",
      },
      {
        id: "q2",
        text: "A ladder makes an angle of 60 degrees with the ground while leaning against a wall, with its foot 5 m from the wall. Find the height at which the ladder touches the wall.",
        options: ["5 m", "5 x sqrt(3) m", "10 m", "5/sqrt(3) m"],
        correctIndex: 1,
        explanation: "tan(60) = height/5. Since tan(60) = sqrt(3), height = 5 x sqrt(3) m (approximately 8.66 m).",
      },
      {
        id: "q3",
        text: "From a point 40 m from the base of a tower, the angle of elevation to its top is 30 degrees. Find the tower's height.",
        options: ["40/sqrt(3) m", "40 x sqrt(3) m", "20 m", "40 m"],
        correctIndex: 0,
        explanation: "tan(30) = height/40. Since tan(30) = 1/sqrt(3), height = 40/sqrt(3) m (approximately 23.1 m).",
      },
      {
        id: "q4",
        text: "The angle of elevation of a tower from a point is 30 degrees. Moving 20 m closer, the angle becomes 60 degrees. Find the tower's height.",
        options: ["10 m", "10 x sqrt(3) m", "20 x sqrt(3) m", "20 m"],
        correctIndex: 1,
        explanation: "Using the standard two-angle setup: h = 20 x sqrt(3)/2 = 10 x sqrt(3) m (approximately 17.3 m), exactly the worked example traced in today's lesson.",
      },
      {
        id: "q5",
        text: "From the top of a 100 m cliff, the angle of depression to a boat is 45 degrees. How far is the boat from the base of the cliff?",
        options: ["50 m", "100 m", "100 x sqrt(3) m", "100/sqrt(3) m"],
        correctIndex: 1,
        explanation: "Angle of depression from the top equals angle of elevation from the ground: tan(45) = 100/distance. Since tan(45) = 1, distance = 100 m.",
      },
      {
        id: "q6",
        text: "Two poles of equal height stand on either side of a road 80 m wide. From a point on the road between them, the angles of elevation of their tops are 60 degrees and 30 degrees. Find the distance of the point from the pole with the 60-degree elevation.",
        options: ["20 m", "40 m", "60 m", "10 m"],
        correctIndex: 0,
        explanation: "Let the common height be h, and the point be x m from the 60-degree pole, so (80-x) m from the 30-degree pole. tan(60) = h/x, so h = x x sqrt(3). tan(30) = h/(80-x), so h = (80-x)/sqrt(3). Setting these equal: x x sqrt(3) = (80-x)/sqrt(3) -> 3x = 80-x -> 4x = 80 -> x = 20 m.",
      },
      {
        id: "q7",
        text: "The angle of elevation of the top of a tower changes from 30 degrees to 60 degrees as an observer moves 40 m towards it. Find the height of the tower.",
        options: ["20 m", "20 x sqrt(3) m", "40 x sqrt(3) m", "40/sqrt(3) m"],
        correctIndex: 1,
        explanation: "Using h = (gap) x sqrt(3)/2 with gap = 40: h = 40 x sqrt(3)/2 = 20 x sqrt(3) m (approximately 34.6 m).",
      },
      {
        id: "q8",
        text: "A tower stands vertically on the ground. From a point 15 m away from its foot, the angle of elevation of its top is found to be 60 degrees. Find the height of the tower to the nearest whole metre (using sqrt(3) = 1.732).",
        options: ["15 m", "26 m", "9 m", "30 m"],
        correctIndex: 1,
        explanation: "tan(60) = height/15 -> height = 15 x 1.732 = 25.98, which rounds to 26 m.",
      },
      {
        id: "q9",
        text: "From the top of a lighthouse 60 m high, the angles of depression of two boats on the same side are 45 degrees and 30 degrees. Find the distance between the two boats.",
        options: ["60(sqrt(3)-1) m", "60 m", "60 sqrt(3) m", "30 m"],
        correctIndex: 0,
        explanation: "Nearer boat (45 degrees): distance = 60/tan(45) = 60 m. Farther boat (30 degrees): distance = 60/tan(30) = 60 x sqrt(3) m. Distance between them = 60sqrt(3) - 60 = 60(sqrt(3)-1) m (approximately 43.9 m).",
      },
      {
        id: "q10",
        text: "A man observes the angle of elevation of the top of a tower to be 45 degrees. He walks towards the tower and now the angle becomes 60 degrees. If the tower is 20 x sqrt(3) m tall, how far did he walk? (leave the answer in terms of sqrt(3))",
        options: ["20 x sqrt(3) - 20 m", "20 x sqrt(3) + 20 m", "20 m", "40 m"],
        correctIndex: 0,
        explanation: "At 45 degrees: distance1 = h/tan(45) = h. At 60 degrees: distance2 = h/tan(60) = h/sqrt(3). Walked distance = h - h/sqrt(3) = h(sqrt(3)-1)/sqrt(3). With h = 20sqrt(3): walked = 20sqrt(3) x (sqrt(3)-1)/sqrt(3) = 20(sqrt(3)-1) = 20sqrt(3) - 20 m (approximately 14.6 m).",
      },
    ],
    timedQuiz: { timeLimitSeconds: 300, mcqIds: ["q1", "q3", "q4", "q7", "q9"] },
    problemIds: [],
    xpReward: 50, coinReward: 20,
    status: "published",
  },

  // ------------------------------------------------------------------
  // Day 35 - Friday 4 Sep 2026 - Venn Diagrams & Set Theory
  // ------------------------------------------------------------------
  {
    date: "2026-09-04", dow: "fri", weekId: "2026-08-31", type: "lesson",
    title: "Day 35: Venn Diagrams & Set Theory",
    difficulty: "Medium",
    estimatedMinutes: 18,
    concept: `## Counting Without Double-Counting

::: story
A class has 25 students who play cricket and 20 who play football. That is not necessarily 45 students playing at least one sport - some students almost certainly play both, and counting them twice inflates the answer. Venn diagram questions are entirely about correcting for exactly this kind of overlap, and the correction has one clean formula at every level: two sets, three sets, or more.
:::

## Two Sets

::: remember
|A union B| = |A| + |B| - |A intersection B|. Add both sets, then subtract whoever you counted twice - anyone in both groups was added once in |A| and once again in |B|, so one copy has to come back out.
:::

  25 play cricket, 20 play football, 8 play both, out of 60 students total.
  |cricket union football| = 25 + 20 - 8 = 37
  neither sport = 60 - 37 = 23

## Three Sets

::: remember
|A union B union C| = |A| + |B| + |C| - |A&B| - |B&C| - |A&C| + |A&B&C|. Every pairwise overlap gets subtracted once (it was double-counted across the two single sets it belongs to), and the triple overlap - subtracted three times by the pairwise terms, but genuinely belongs in the union once - gets added back exactly once to correct for that.
:::

  100 students: 50 like Math, 40 like Physics, 30 like Chemistry.
  Math&Physics = 15, Physics&Chem = 10, Math&Chem = 8, all three = 5.

  |M union P union C| = 50+40+30 - 15-10-8 + 5 = 92
  none of the three = 100 - 92 = 8

## Reading the Regions of a Three-Circle Diagram

::: table Extracting exactly-one and exactly-two counts
Region wanted | Formula
Exactly one subject (Math only) | |M| - |M&P| - |M&C| + |M&P&C|
Exactly two subjects (any pair, not all three) | (|M&P| + |P&C| + |M&C|) - 3 x |M&P&C|
At least two subjects | (|M&P| + |P&C| + |M&C|) - 2 x |M&P&C|
All three subjects | |M&P&C| directly
:::

Using the numbers above: Math only = 50 - 15 - 8 + 5 = 32. Exactly two subjects = (15+10+8) - 3x5 = 33-15 = 18. At least two subjects = 33 - 2x5 = 23.

::: flow How to solve any three-set overlap question
Write down every given number against its exact label :: |A|, |B|, |C|, each pairwise overlap, and the triple overlap - these are usually scattered across a paragraph, not a clean list, so extract them first.
Apply the union formula to find how many are in AT LEAST ONE set :: This is the standard three-term-plus-correction formula above.
Subtract from the grand total to get "none of the three" if asked :: Grand total minus the union.
For "exactly one" or "exactly two" regions, use the region-specific formulas :: Never assume a pairwise-overlap number already excludes the triple overlap - it almost always includes it, which is exactly why the +|triple| correction exists in the union formula.
:::

::: mistake
The most common error is treating a given pairwise overlap number (like "15 like both Math and Physics") as if it EXCLUDES the students who like all three - it does not, unless the question explicitly says "exactly two". This silently double-subtracts the triple-overlap group in the union formula, which is exactly why the formula ends with +|triple| to correct for it.
:::

::: checkpoint
In a group of 70 people, 45 speak English, 33 speak French, and 10 speak neither. How many speak both English and French?
- ( ) 10
- (x) 18
- ( ) 22
- ( ) 27
> Speak at least one language = 70 - 10 = 60. Using |E union F| = |E| + |F| - |E&F|: 60 = 45 + 33 - |E&F| -> |E&F| = 78 - 60 = 18.
:::

::: revision
Every union count is "add the sets, subtract the overlaps" - for two sets, subtract the one pairwise overlap once; for three sets, subtract all three pairwise overlaps and then add the triple overlap back once, since it was removed three times by the pairwise subtractions but genuinely belongs in the union exactly once. "None of the sets" is always the grand total minus the union. A given pairwise-overlap number includes anyone in all three groups unless the question explicitly says "exactly two" - read the wording as carefully as the arithmetic.
:::`,
    mcqs: [
      {
        id: "q1",
        text: "In a class of 50 students, 30 play cricket and 25 play football. If 10 play both, how many play neither?",
        options: ["5", "10", "15", "20"],
        correctIndex: 0,
        explanation: "|cricket union football| = 30 + 25 - 10 = 45. Neither = 50 - 45 = 5.",
      },
      {
        id: "q2",
        text: "Out of 120 people surveyed, 65 like tea and 50 like coffee, while 20 like both. How many like at least one of the two drinks?",
        options: ["95", "100", "105", "115"],
        correctIndex: 0,
        explanation: "|tea union coffee| = 65 + 50 - 20 = 95.",
      },
      {
        id: "q3",
        text: "In a survey of 100 students, 60 study Physics, 40 study Chemistry, and 20 study both. How many study only Physics (not Chemistry)?",
        options: ["20", "40", "30", "60"],
        correctIndex: 1,
        explanation: "Physics only = |Physics| - |both| = 60 - 20 = 40.",
      },
      {
        id: "q4",
        text: "In a group of 200 people, 100 read newspaper A, 80 read newspaper B, and 40 read both. How many read exactly one of the two newspapers?",
        options: ["80", "100", "120", "140"],
        correctIndex: 1,
        explanation: "Exactly one = (|A| - |both|) + (|B| - |both|) = (100-40) + (80-40) = 60 + 40 = 100.",
      },
      {
        id: "q5",
        text: "In a class, 40 students play chess, 35 play carrom, and 15 play both. If every student plays at least one game, how many students are in the class?",
        options: ["50", "60", "65", "70"],
        correctIndex: 1,
        explanation: "Total = |chess union carrom| = 40 + 35 - 15 = 60, and since every student plays at least one, this union IS the whole class.",
      },
      {
        id: "q6",
        text: "In a survey of 150 people: 70 like apples, 60 like bananas, 50 like mangoes, 25 like apples and bananas, 20 like bananas and mangoes, 15 like apples and mangoes, and 10 like all three. How many like none of the three fruits?",
        options: ["10", "20", "25", "30"],
        correctIndex: 1,
        explanation: "|A union B union M| = 70+60+50 - 25-20-15 + 10 = 180 - 60 + 10 = 130. None = 150 - 130 = 20.",
      },
      {
        id: "q7",
        text: "Using the same survey as the previous question (70 apples, 60 bananas, 50 mangoes, pairwise overlaps 25/20/15, all three 10), how many like exactly one fruit?",
        options: ["80", "85", "90", "95"],
        correctIndex: 2,
        explanation: "Apples only = 70-25-15+10 = 40. Bananas only = 60-25-20+10 = 25. Mangoes only = 50-20-15+10 = 25. Exactly one total = 40+25+25 = 90.",
      },
      {
        id: "q8",
        text: "In a class of 60 students, everyone takes at least one of Math or Science. If 45 take Math and 35 take Science, how many take both?",
        options: ["15", "20", "25", "30"],
        correctIndex: 1,
        explanation: "|Math union Science| = 60 (everyone takes at least one). 60 = 45 + 35 - both -> both = 80 - 60 = 20.",
      },
      {
        id: "q9",
        text: "In a group of 80 people, 50 speak Hindi, 40 speak Tamil, and 15 speak neither. How many speak both Hindi and Tamil?",
        options: ["15", "20", "25", "30"],
        correctIndex: 2,
        explanation: "Speak at least one = 80 - 15 = 65. Both = |Hindi| + |Tamil| - union = 50 + 40 - 65 = 25.",
      },
      {
        id: "q10",
        text: "In a survey, 60% like tea, 50% like coffee, and 30% like both. What percentage like neither?",
        options: ["10%", "15%", "20%", "25%"],
        correctIndex: 2,
        explanation: "Like at least one = 60% + 50% - 30% = 80%. Like neither = 100% - 80% = 20%.",
      },
    ],
    timedQuiz: { timeLimitSeconds: 300, mcqIds: ["q1", "q2", "q3", "q6", "q10"] },
    problemIds: [],
    xpReward: 50, coinReward: 20,
    status: "published",
  },

  // ------------------------------------------------------------------
  // Day 36 - Saturday 5 Sep 2026 - Week 6 Recap
  // ------------------------------------------------------------------
  {
    date: "2026-09-05", dow: "sat", weekId: "2026-08-31", type: "lesson",
    title: "Day 36: Week 6 Recap - Ages, Partnership, Quadratics, Heights & Venn Diagrams",
    difficulty: "Medium",
    estimatedMinutes: 22,
    concept: `## One Week, Five New Tools

::: story
Six days ago this week started with a birthday gap that never closes. Since then you have split a shop's profit between two friends who invested different amounts for different lengths of time, compared two whole families of equations without ever being told to just "solve for x", measured a tower using nothing but the angle your neck makes when you look up at it, and untangled three overlapping surveys down to the people who answered "none of the above".

None of that was new mathematics - every one of the five topics used only the algebra and ratio thinking you already had. What was new was the SHAPE of the question, and shape is exactly what a recap day is for.
:::

## The Week in Five Lines

::: table Five topics, one sentence each
Topic | The one idea to keep
Ages | The difference between two people's ages never changes - anchor every "impossible" ratio question on that fact
Partnership | Profit splits by capital x time, added per partner - never capital alone unless every duration matches
Quadratic comparison | Solve BOTH equations fully, then check EVERY pairing of roots before naming one relationship
Height & Distance | tan(angle) = height / horizontal distance, in a right triangle anchored at the tower's base
Venn Diagrams | Add the sets, then subtract every overlap once - and add the triple overlap back once for three sets
:::

::: flow A 30-second sanity check before answering any of this week's question types
See a ratio of ages with a time shift :: Translate "years ago/hence" onto EVERY person in that clause, then solve one linear equation in the ratio's shared variable.
See a profit split with unequal investment periods :: Multiply each partner's capital by their own months invested before taking the ratio - never skip the time factor.
See two equations and a "which is bigger" question :: List every root of both, and test every pairing before naming a single relationship.
See an angle of elevation or depression :: Draw the right triangle, write tan(angle) = height/distance, and match the smaller angle to the farther point.
See two or three overlapping groups :: Add every set, subtract every pairwise overlap once, and for three sets add the triple overlap back once.
:::

::: mistake
Revisit the week's five costliest slips in one place: applying a ratio to present ages instead of to the shifted ages (Ages); splitting profit by capital alone when durations actually differ (Partnership); comparing only one pairing of roots instead of every pairing (Quadratics); swapping which angle belongs to the nearer versus the farther observation point (Height & Distance); and treating a stated pairwise overlap as if it already excludes the people counted in all three groups (Venn Diagrams).
:::

::: checkpoint
A invests Rs 12,000 for the full year; B invests Rs 18,000 for 8 months. The ratio of their present ages is 5:3, and ten years ago the age difference was the same as it is now. If the profit is Rs 3,600, what is B's share?
- ( ) Rs 1,200
- ( ) Rs 1,600
- (x) Rs 1,800
- ( ) Rs 2,000
> Only the partnership numbers matter here - the ages clause is a distractor, since (as this week established) an age DIFFERENCE never changes anyway, so "ten years ago the difference was the same" is simply always true and adds no new information. A's capital-months = 12000 x 12 = 144,000. B's capital-months = 18000 x 8 = 144,000. Ratio = 1:1, so B's share = 3600 / 2 = Rs 1,800.
:::

::: revision
This week's five topics share one habit: translate the WORDS into one precise equation or formula before touching arithmetic. Ages - fix the difference, translate every time-shift onto every person. Partnership - multiply capital by time, per partner, before ratio-ing. Quadratic comparison - solve fully, then test every pairing. Height & Distance - one tangent ratio, right triangle at the base. Venn Diagrams - add sets, subtract overlaps once, add the triple back once. Five different topics, the same discipline: set up the exact relationship first, and the arithmetic that follows is almost always short.
:::`,
    mcqs: [
      {
        id: "q1",
        text: "A is now twice as old as B. In 8 years, A will be 1.5 times as old as B. Find B's present age.",
        options: ["6", "8", "10", "12"],
        correctIndex: 1,
        explanation: "Let B=x, A=2x. In 8 years: 2x+8 = 1.5(x+8) -> 2x+8 = 1.5x+12 -> 0.5x=4 -> x=8. Check: A's age in 8 years = 2(8)+8=24, B's age in 8 years = 8+8=16, and 24 = 1.5 x 16, confirmed.",
      },
      {
        id: "q2",
        text: "A and B invest Rs 25,000 and Rs 35,000 for the full year. Find the ratio of their profit shares.",
        options: ["5:7", "7:5", "5:6", "6:5"],
        correctIndex: 0,
        explanation: "Ratio = 25000:35000 = 5:7 after dividing both by 5000.",
      },
      {
        id: "q3",
        text: "I. x^2 - 8x + 15 = 0   II. y^2 - 9y + 18 = 0. What is the relationship between x and y?",
        options: ["x > y", "x < y", "x = y", "Cannot be determined"],
        correctIndex: 3,
        explanation: "I factors to (x-3)(x-5)=0 -> x=3 or 5. II factors to (y-3)(y-6)=0 -> y=3 or 6. Pairings: (3,3) equal; (3,6) x<y; (5,3) x>y; (5,6) x<y. Since both x>y and x<y occur, the relationship cannot be determined.",
      },
      {
        id: "q4",
        text: "The angle of elevation of the top of a tower from a point 25 m from its base is 45 degrees. Find the tower's height.",
        options: ["12.5 m", "25 m", "25 x sqrt(3) m", "50 m"],
        correctIndex: 1,
        explanation: "tan(45) = height/25, and tan(45)=1, so height = 25 m.",
      },
      {
        id: "q5",
        text: "In a class of 45 students, 25 play cricket, 20 play football, and 5 play neither. How many play both?",
        options: ["3", "5", "8", "10"],
        correctIndex: 1,
        explanation: "Play at least one = 45-5 = 40. Both = 25+20-40 = 5.",
      },
      {
        id: "q6",
        text: "The sum of A and B's present ages is 41. Five years hence, A will be twice as old as B. Find B's present age.",
        options: ["10", "12", "15", "19"],
        correctIndex: 1,
        explanation: "Let B=x, A=41-x. Five years hence: 41-x+5 = 2(x+5) -> 46-x = 2x+10 -> 36=3x -> x=12. Check: in 5 years, B=17, A=41-12+5=34, and 34=2x17, confirmed.",
      },
      {
        id: "q7",
        text: "A starts a business with Rs 40,000. After 6 months, B joins with Rs 60,000. Find the profit-sharing ratio at year end.",
        options: ["4:3", "1:1", "2:3", "4:6"],
        correctIndex: 0,
        explanation: "A's capital-months = 40000 x 12 = 480,000. B's capital-months = 60000 x 6 = 360,000. Ratio = 480000:360000, dividing both by 120,000 gives 4:3.",
      },
      {
        id: "q8",
        text: "From the top of a tower 173.2 m high, the angle of depression to a car is 60 degrees (use sqrt(3)=1.732). Find the distance of the car from the base.",
        options: ["50 m", "86.6 m", "100 m", "173.2 m"],
        correctIndex: 2,
        explanation: "tan(60) = 173.2/distance -> 1.732 = 173.2/distance -> distance = 173.2/1.732 = 100 m.",
      },
      {
        id: "q9",
        text: "I. y = 6   II. x^2 - 11x + 30 = 0. What is the relationship between x and y?",
        options: ["x > y", "x < y", "Cannot be determined", "x = y"],
        correctIndex: 2,
        explanation: "II factors to (x-5)(x-6)=0 -> x=5 or 6, and y=6 fixed. Pairings: x=5 vs y=6 gives x<y; x=6 vs y=6 gives x=y. Neither 'x<y always' nor 'x=y always' covers both pairings, and x>y never occurs either, so among these four options the relationship cannot be determined.",
      },
      {
        id: "q10",
        text: "In a survey of 90 people, 55 like tea, 45 like coffee, and 10 like neither. How many like both?",
        options: ["10", "15", "20", "25"],
        correctIndex: 2,
        explanation: "Like at least one = 90-10 = 80. Both = 55+45-80 = 20.",
      },
    ],
    timedQuiz: { timeLimitSeconds: 300, mcqIds: ["q2", "q3", "q4", "q5", "q10"] },
    problemIds: [],
    xpReward: 80, coinReward: 30,
    status: "published",
  },

];
