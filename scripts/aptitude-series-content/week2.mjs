// DeVert Campus - Aptitude Series, Week 2: Arithmetic (Mon 10 Aug - Sat 15 Aug 2026).
//
// Days 7-12 of the 30-day placement-aptitude track. Week 1 built the
// foundations (number systems, LCM/HCF, percentages, ratio, averages,
// simplification) at difficulty "Easy"; this week is the commercial and
// rate-based arithmetic that TCS / Infosys / Accenture / Cognizant /
// Capgemini / Wipro / Deloitte / Oracle / Amazon / Microsoft / Google
// papers lean on hardest, so every day here is "Medium".
//
// AUTHORING RULES - identical to week1.mjs, restated so this file stands
// alone if someone edits it in isolation:
//
//  1. `concept` is ONE string parsed by devert-frontend/lib/lessonBlocks.js.
//     Fence syntax is `::: variant optional title` ... `:::`, each on its own
//     line. Inside a `flow` fence NEVER write "->" in a step body - the parser
//     splits flow lines on it. Inside a `table` fence never write "|" in a
//     cell - that is the column separator. Two-space-indented lines become
//     code blocks, so traced arithmetic is indented on purpose.
//  2. Story or concrete number FIRST, technical name SECOND. Never open a
//     lesson with a formula. Every worked example uses real digits that were
//     actually computed, never "some number x".
//  3. Callouts are used sparingly and purposefully: one `mistake`, one
//     `remember`/`funfact`, exactly one `checkpoint`, and a closing
//     `revision` that works as a 30-second pre-exam re-read.
//  4. MCQ shape is `{ id, text, options, correctIndex, explanation }` -
//     `text`, NOT `question` (see campus-daily-learning-editor.jsx's
//     blankMcq()). `correctIndex` is 0-based into that question's own
//     `options`. Every answer below was hand-derived step by step and
//     re-verified; every explanation shows the load-bearing step.
//  5. Wrong options are real miscalculations a student would actually make
//     (profit on SP instead of CP, SI where CI was asked, averaging two
//     speeds, adding days instead of rates, forgetting the train's own
//     length), never filler.
//  6. `timedQuiz.mcqIds` are 5 ids drawn from that same day's `mcqs`.
//  7. ASCII hyphens only - scripts/normalize-dashes.mjs rewrites em/en dashes
//     across the database, so authoring them here just creates churn.

export const WEEK2_DAYS = [

  // ------------------------------------------------------------------
  // Day 7 - Monday 10 Aug 2026 - Profit, Loss & Discount
  // ------------------------------------------------------------------
  {
    date: "2026-08-10", dow: "mon", weekId: "2026-08-10", type: "lesson",
    title: "Day 7: Profit, Loss & Discount",
    difficulty: "Medium",
    estimatedMinutes: 18,
    concept: `## The Bat That Cost 800

::: story
You buy a cricket bat for **800 rupees**. A season later you sell it to a junior for **920**.

You made 120 rupees. So - was that a 15% profit, or a 13% profit?

It depends entirely on what you divide the 120 by. Against the 800 you actually paid, it is 120/800 = **15%**. Against the 920 you received, it is 120/920 = 13.04%.

Both are real numbers. Only one of them is what the words "profit percent" mean. Profit is always measured against **what it cost you**, never against what you sold it for.

That one sentence carries more marks on a placement paper than every formula below it.
:::

## Shops Deal In Four Prices, Not Two

Every profit-and-loss question is built by hiding one of four numbers and handing you the other three.

::: cards The four prices, and which one each percentage is measured against
Cost Price (CP) :: What the seller paid. **Every profit or loss percentage is measured against CP.** If a question gives you a percentage and no base, the base is CP.
Marked Price (MP) :: The number printed on the tag, also called list price. Deliberately inflated so a discount can be advertised without actually losing money.
Discount :: A reduction taken off the **MP**, never off the CP. **Every discount percentage is measured against MP.**
Selling Price (SP) :: What the customer actually hands over. It is the meeting point of both chains: it is CP plus profit, and it is also MP minus discount.
:::

Notice that CP and MP are two *different* bases, and the exam knows you will mix them up. Profit lives on CP. Discount lives on MP. SP is the only number they share.

## One Multiplier In Each Direction

Forget the subtraction-then-division routine. Turn each percentage into a multiplier and the whole topic becomes two lines:

  SP = CP x (1 + profit% / 100)        a loss just makes profit% negative
  SP = MP x (1 - discount% / 100)

Trace a real shop. A shopkeeper buys a wall clock for **750**, marks it **1,200**, and puts up a "25% off" sign.

  SP  = 1200 x 0.75  = 900
  profit  = 900 - 750  = 150
  profit% = 150 / 750  = 0.20  =  20%

So he advertised a generous 25% discount and still walked away with a 20% profit. That is exactly what marking up is for.

Now run it backwards, which is how the harder questions are set. A radio is sold for **1,080** at a 20% profit. What did it cost?

  CP = 1080 / 1.20 = 900        NOT 1080 x 0.80 = 864

Dividing by 1.20 undoes a 20% markup; multiplying by 0.80 applies a *new* 20% cut to the bigger number. Those are different operations and the gap, 36 rupees, is precisely the trap option.

::: table The reference table for this whole topic
Quantity wanted | Formula | Checked on a real case
Profit% | (SP - CP) / CP x 100 | CP 800, SP 920: 120/800 = 15%
Loss% | (CP - SP) / CP x 100 | CP 450, SP 396: 54/450 = 12%
SP from CP | CP x (1 + profit%/100) | 450 x 0.88 = 396 at a 12% loss
CP from SP | SP / (1 + profit%/100) | 1080 / 1.20 = 900 at a 20% profit
SP from MP | MP x (1 - discount%/100) | 1200 x 0.75 = 900 at 25% off
Two successive discounts a% then b% | net multiplier is (1 - a/100)(1 - b/100) | 0.80 x 0.90 = 0.72, a single 28% discount
Markup needed for profit p% after discount d% | MP = CP x (1 + p/100) / (1 - d/100) | 100 x 1.20 / 0.90 = 133.33, so mark 33.33% up
:::

## Two Discounts Are Never Their Sum

::: story
A store window says "20% off, plus a further 10% off at the counter". A tag reads 2,000 rupees.

Your friend says 30% off, so 1,400.

The bill is **1,440**.

The second cut came off the already-reduced 1,600, not off the original 2,000. Ten percent of 1,600 is 160, not 200. So the two signs together are a single discount of 0.80 x 0.90 = 0.72, which is **28% off**, not 30%.

Successive discounts always total *less* than their sum. The shop knows this. Now so do you.
:::

## The False Weight Trick

::: story
A grocer announces, honestly enough, that he sells rice **at exactly cost price - no profit at all**. And he means it: he charges you the price of one kilogram and takes not a rupee more.

His "1 kg" weight is a 900 g block of iron.

Say rice costs him 1 rupee per gram. He hands over 900 g, so his cost is **900**. He charges the price of 1,000 g, so he collects **1,000**. He made 100 rupees on an outlay of 900:

  gain% = 100 / 900 x 100 = 11.11%

The formula people memorise is \`gain% = (true weight - false weight) / false weight x 100\`, and the only part worth remembering is the **denominator**: you divide by the *false* weight, because 900 g is what he actually gave up. Dividing by 1,000 gives 10%, which is the standard wrong answer and the reason this question survives on paper after paper.
:::

::: mistake
Dividing the profit by the **selling price**. Profit percent has exactly one legal denominator, and it is the cost price.

The bat from the opening: profit 120, CP 800, SP 920. The answer is 120/800 = **15%**. Writing 120/920 = 13.04% is not a rounding difference, it is a different question ("what fraction of my revenue was margin?"), and it is wrong here.

The same error wearing a different hat: taking a discount percent off the CP instead of the MP. Discount is defined on the marked price. A 25% discount on a clock marked 1,200 is 300 rupees off, not 25% of the 750 it cost the shop.

And the third form of it: adding successive discounts. 20% then 10% is 28%, never 30%.
:::

::: remember
Two bases, two homes, and one sentence that keeps them apart:

**Profit lives on CP. Discount lives on MP.**

From that, three one-liners fall out for free:
- Sell two items at the **same SP**, one at +x% and one at -x%: you always end with a **loss** of \`(x/10)^2\` percent. At x = 20 that is a 4% loss, every single time, no matter what the price was.
- If \`CP of m articles = SP of n articles\`, then profit% = \`(m - n) / n x 100\`. So CP of 15 = SP of 12 gives 3/12 = 25% profit.
- A dishonest weight of w grams sold as 1,000 g at "cost price" gains \`(1000 - w) / w\` - divide by the false weight, never by 1,000.
:::

::: checkpoint
A trader marks his goods 40% above cost and then offers a 25% discount on the marked price. What is his actual profit or loss?
- ( ) 15% profit
- (x) 5% profit
- ( ) No profit, no loss
- ( ) 5% loss
> Chain the multipliers on a CP of 100. Marking 40% up gives MP = 140. A 25% discount gives SP = 140 x 0.75 = **105**. So the profit is 5 on 100, a **5% profit**. The trap answer 15% comes from subtracting the percentages (40 - 25) as if both were measured against the same base, but the 40% sits on CP and the 25% sits on MP - the 25% cut is taken on 140, so it removes 35 rupees, not 25.
:::

::: revision
Four prices, two bases: **profit and loss percent are always on CP; discount percent is always on MP**, and SP is where the two chains meet. Work everything as multipliers: \`SP = CP x (1 + p/100)\` and \`SP = MP x (1 - d/100)\`, so going from SP back to CP means **dividing** by 1.20, not multiplying by 0.80 (1080 becomes 900, not 864). Successive discounts multiply rather than add: 20% then 10% is 0.80 x 0.90 = 0.72, a single 28% cut. To net p% profit while advertising d% off, mark up by \`(1 + p/100)/(1 - d/100)\` - a 10% discount with a 20% target profit needs a 33.33% markup. Selling two items at one common price, one at +x% and one at -x%, is always a loss of \`(x/10)^2\` percent, so plus-and-minus 20% is a 4% loss. \`CP of m = SP of n\` gives profit% = \`(m - n)/n x 100\`. And the false-weight gain divides by the **false** weight: a 900 g block sold as a kilo at cost price earns 100/900 = 11.11%, not 10%.
:::`,
    mcqs: [
      {
        id: "q1",
        text: "A bat is bought for 800 rupees and sold for 920 rupees. What is the profit percent?",
        options: ["12%", "15%", "13.04%", "20%"],
        correctIndex: 1,
        explanation: "Profit is 920 - 800 = 120, and profit percent is always measured against the cost price: 120/800 = 15%. Dividing by the selling price instead gives 120/920 = 13.04%, which is the standard trap option.",
      },
      {
        id: "q2",
        text: "An article costing 450 rupees is sold at a loss of 12%. What is the selling price?",
        options: ["396", "400", "404", "414"],
        correctIndex: 0,
        explanation: "A 12% loss means SP = CP x 0.88 = 450 x 0.88 = 396. Using 0.92 by mistake (as though the loss were 8%) gives 414.",
      },
      {
        id: "q3",
        text: "A wall clock is marked at 1,200 rupees and sold at a 25% discount. What is the selling price?",
        options: ["850", "875", "900", "960"],
        correctIndex: 2,
        explanation: "Discount is taken on the marked price: 1200 x 0.75 = 900. The option 960 is 1200 x 0.80, i.e. a 20% discount instead of 25%.",
      },
      {
        id: "q4",
        text: "Two successive discounts of 20% and 10% are equivalent to a single discount of:",
        options: ["26%", "28%", "30%", "32%"],
        correctIndex: 1,
        explanation: "Multiply the multipliers: 0.80 x 0.90 = 0.72, so 28% of the price is removed. Adding the discounts gives 30%, which is always too large because the second cut is taken on the already-reduced amount.",
      },
      {
        id: "q5",
        text: "A trader marks his goods 40% above cost price and then allows a discount of 25%. His gain or loss is:",
        options: ["5% gain", "10% gain", "15% gain", "5% loss"],
        correctIndex: 0,
        explanation: "Take CP = 100, so MP = 140 and SP = 140 x 0.75 = 105. That is a 5 rupee gain on 100, i.e. 5%. Subtracting 40 - 25 to get 15% ignores that the 40% sits on CP while the 25% sits on the larger MP.",
      },
      {
        id: "q6",
        text: "A radio is sold for 1,080 rupees at a profit of 20%. What was its cost price?",
        options: ["864", "880", "900", "920"],
        correctIndex: 2,
        explanation: "SP = CP x 1.20, so CP = 1080 / 1.20 = 900. Check: 900 + 20% of 900 = 1080. Multiplying by 0.80 instead of dividing by 1.20 gives the trap answer 864.",
      },
      {
        id: "q7",
        text: "A dishonest dealer claims to sell his goods at cost price, but uses a weight of 900 g in place of 1 kg. What is his gain percent?",
        options: ["9%", "10%", "11.11%", "12.5%"],
        correctIndex: 2,
        explanation: "He gives up 900 g of goods but collects the price of 1000 g, so his gain is 100 on an outlay of 900: 100/900 = 11.11%. Dividing by 1000 (the weight he claimed, not the one he gave) produces the common wrong answer 10%.",
      },
      {
        id: "q8",
        text: "By selling an article for 480 rupees a man loses 20%. At what price should he sell it to gain 20%?",
        options: ["576", "640", "720", "768"],
        correctIndex: 2,
        explanation: "First recover the cost price: 480 = CP x 0.80, so CP = 600. To gain 20%, SP = 600 x 1.20 = 720. Applying the 20% gain to the old selling price instead gives 480 x 1.20 = 576, which is the trap.",
      },
      {
        id: "q9",
        text: "A fruit seller buys 12 oranges for 100 rupees and sells 10 oranges for 100 rupees. What is his profit percent?",
        options: ["16.67%", "20%", "25%", "30%"],
        correctIndex: 1,
        explanation: "Cost per orange is 100/12 = 8.33 and selling price per orange is 100/10 = 10. Profit per orange is 1.67 on a cost of 8.33, i.e. 20%. Equivalently, CP of 12 = SP of 10 gives (12 - 10)/10 = 20%.",
      },
      {
        id: "q10",
        text: "A shopkeeper sells two articles at 1,200 rupees each, gaining 20% on one and losing 20% on the other. Overall he makes:",
        options: ["neither profit nor loss", "a 4% loss", "a 4% profit", "a 2% loss"],
        correctIndex: 1,
        explanation: "The cost prices differ: 1200/1.20 = 1000 and 1200/0.80 = 1500, so total CP is 2500 while total SP is 2400. That is a loss of 100 on 2500 = 4%. The shortcut is that equal selling prices at plus and minus x% always give a loss of (x/10)^2 = 4%.",
      },
      {
        id: "q11",
        text: "The marked price of a watch is 1,600 rupees. The shopkeeper allows two successive discounts of 10% and 5%. What does the customer pay?",
        options: ["1,360", "1,368", "1,370", "1,440"],
        correctIndex: 1,
        explanation: "1600 x 0.90 = 1440, then 1440 x 0.95 = 1368. Adding the discounts to 15% gives 1600 x 0.85 = 1360, which is 8 rupees too low.",
      },
      {
        id: "q12",
        text: "If the cost price of 15 articles equals the selling price of 12 articles, the profit percent is:",
        options: ["20%", "25%", "30%", "33.33%"],
        correctIndex: 1,
        explanation: "Take the cost of one article as 1, so 15 = SP of 12 and the selling price per article is 15/12 = 1.25. That is a 25% profit. Using (15 - 12)/15 = 20% divides by the wrong base - profit percent goes over cost price, and here the cost of the 12 sold articles is 12, not 15.",
      },
      {
        id: "q13",
        text: "A trader wants to earn a 20% profit on cost even after allowing a 10% discount on the marked price. By what percent above cost must he mark his goods?",
        options: ["30%", "32%", "33.33%", "35%"],
        correctIndex: 2,
        explanation: "Take CP = 100, so the required SP = 120. Since SP = MP x 0.90, MP = 120/0.90 = 133.33, which is 33.33% above cost. Simply adding 20 + 10 = 30% falls short: 130 x 0.90 = 117, only a 17% profit.",
      },
      {
        id: "q14",
        text: "An article was sold at a profit of 15%. Had it been sold for 60 rupees more, the profit would have been 20%. What is the cost price?",
        options: ["1,000", "1,200", "1,250", "1,500"],
        correctIndex: 1,
        explanation: "The extra 60 rupees represents the gap between 20% and 15% of the cost price, i.e. 5% of CP. So 0.05 x CP = 60 and CP = 1200. Check: 15% profit gives SP 1380, and 1380 + 60 = 1440 = 1.20 x 1200.",
      },
      {
        id: "q15",
        text: "A vendor sold a basket of fruit at a 10% loss. Had he sold it for 45 rupees more, he would have gained 5%. What was the cost price?",
        options: ["250", "300", "320", "350"],
        correctIndex: 1,
        explanation: "Moving from a 10% loss to a 5% gain is a swing of 15% of the cost price, so 0.15 x CP = 45 and CP = 300. Check: a 10% loss gives SP 270, and 270 + 45 = 315 = 1.05 x 300.",
      },
    ],
    timedQuiz: { timeLimitSeconds: 300, mcqIds: ["q5", "q7", "q10", "q13", "q14"] },
    problemIds: [],
    xpReward: 50, coinReward: 20,
    status: "published",
  },

  // ------------------------------------------------------------------
  // Day 8 - Tuesday 11 Aug 2026 - Simple Interest & Compound Interest
  // ------------------------------------------------------------------
  {
    date: "2026-08-11", dow: "tue", weekId: "2026-08-10", type: "lesson",
    title: "Day 8: Simple Interest & Compound Interest",
    difficulty: "Medium",
    estimatedMinutes: 18,
    concept: `## Two Brothers, One Lakh, Three Years

::: story
Two brothers each put **10,000 rupees** into a scheme paying **10% a year**, and leave it for **3 years**.

The elder brother withdraws his interest at the end of every year and spends it. He earns 1,000 in year one, 1,000 in year two, 1,000 in year three. Total interest: **3,000**.

The younger brother touches nothing. Year one he earns 1,000 - but now his balance is 11,000, so year two pays 10% of 11,000 = **1,100**. That takes him to 12,100, so year three pays 1,210. Total interest: **3,310**.

Same money. Same rate. Same three years. The younger brother is **310 rupees** ahead, and he did nothing except leave it alone.

The elder brother earned **simple interest**. The younger earned **compound interest**. That 310 is the entire difference between the two ideas, and almost every question on this topic is a question about it.
:::

## Simple Interest: The Rate Never Moves

Simple interest is paid on the **original** principal, every single year, forever. The base never changes.

  SI = P x R x T / 100

with P the principal, R the rate percent per year, T the time in years. Run the elder brother through it:

  SI = 10000 x 10 x 3 / 100 = 3000        matches the year-by-year count

Because the base is frozen, simple interest grows in a straight line. Doubling the time exactly doubles the interest. That property is what makes SI questions solvable in one step, and also what makes them the easy marks on the paper.

## Compound Interest: The Base Moves With You

Compound interest adds each year's interest **into** the principal, so next year's interest is charged on a bigger number. "Interest on interest" is not a slogan, it is literally what the formula does:

  A = P x (1 + R/100)^T          A is the final amount
  CI = A - P                     the interest is the amount MINUS the principal

The younger brother again, this time in one line:

  A  = 10000 x (1.10)^3 = 10000 x 1.331 = 13,310
  CI = 13310 - 10000 = 3,310

Note the shape of that 1.331. It is not 1.30. The extra 0.031 is the interest that the interest earned, and it is the only thing on this page that compounds.

::: table SI and CI on 10,000 at 10%, year by year
Year | SI interest that year | CI interest that year | SI total | CI total
1 | 1,000 | 1,000 | 1,000 | 1,000
2 | 1,000 | 1,100 | 2,000 | 2,100
3 | 1,000 | 1,210 | 3,000 | 3,310
4 | 1,000 | 1,331 | 4,000 | 4,641
5 | 1,000 | 1,464 | 5,000 | 6,105
:::

Read the last two columns again. After 2 years the gap is 100. After 3 years it is 310. After 5 years it is 1,105. The gap does not grow steadily, it accelerates - and that acceleration is the whole reason banks quote compound rates on loans and simple rates on nothing.

## The Two-Year Gap Has A Formula

Because the difference in year two is just "interest on the first year's interest", it can be written down exactly:

  CI - SI over 2 years = P x (R/100)^2

Check it on our numbers: 10000 x (0.10)^2 = 10000 x 0.01 = **100**. That is exactly the row-2 gap in the table.

For three years there is one extra term:

  CI - SI over 3 years = P x (R/100)^2 x (3 + R/100)

which gives 10000 x 0.01 x 3.10 = **310**. Also exact.

The two-year version is the one to actually memorise, because it runs both ways. If a paper tells you the two-year difference is 25 rupees at 5%, then \`P x 0.0025 = 25\` and the principal is **10,000** - a one-line answer to a question that looks like it needs two formulas.

## When The Compounding Is Faster Than Yearly

::: flow Half-yearly compounding, on 10,000 at 20% for 1 year
Halve the rate :: 20% per year becomes 10% per half-year
Double the periods :: 1 year becomes 2 compounding periods
Apply the CI formula to the new pair :: 10000 x (1.10)^2 = 12,100
Compare against annual compounding :: 10000 x 1.20 = 12,000, so the faster compounding is worth 100 rupees more
:::

The rule generalises: for **quarterly**, quarter the rate and quadruple the periods. Nothing else in the formula changes. More frequent compounding always earns more, because the interest starts earning sooner.

::: mistake
Two errors, and they are both about *reading* rather than arithmetic.

The first: reporting the **amount** when the question asked for the **interest**. \`P(1 + R/100)^T\` gives you 13,310, which is the balance. The compound interest is 3,310. Subtract the principal. Every year, a huge number of candidates lose this mark having done the hard part perfectly.

The second: leaving the rate alone for half-yearly compounding. On 10,000 at 20% per annum compounded half-yearly for one year, the answer is \`10000 x (1.10)^2 = 12,100\`. Writing \`10000 x (1.20)^2 = 14,400\` charges 20% twice in a single year, which is double the advertised rate. Halve the rate, double the periods - both, never one.

A quieter third: on the *first* year alone, SI and CI are always identical, because nothing has compounded yet. If a question gives you "the interest for one year" it has told you nothing about which kind it is.
:::

::: remember
**The rule of 72.** To find roughly how many years money takes to double under compound interest, divide 72 by the rate:

  doubling time  =  72 / R

At 9% that predicts 8 years, and the exact calculation gives \`1.09^8 = 1.9926\` - within three-quarters of a percent of doubling. At 12% it predicts 6 years, and \`1.12^6 = 1.9738\`. Close enough to pick an option under time pressure.

And the doubling fact that papers really test: if a sum doubles in **n** years under CI, it becomes 4 times in **2n** years and 8 times in **3n** years, because each doubling takes the same length of time. A sum that doubles in 6 years is 8 times itself in 18.

Careful - that stacking is a CI-only property. Under **simple** interest, doubling in 8 years means the interest equals the principal in 8 years, so tripling (interest = twice the principal) takes 16 years, not 24.
:::

::: checkpoint
A sum of money invested at compound interest doubles itself in 5 years. In how many years will it become 8 times itself?
- ( ) 10 years
- (x) 15 years
- ( ) 20 years
- ( ) 40 years
> Eight is 2 x 2 x 2, so the money has to double three times over, and under compound interest every doubling takes the same 5 years: 3 x 5 = **15 years**. The option 20 comes from thinking of 8 as four doublings, and 40 from multiplying 5 by 8 as though growth were linear. Sanity-check with the money itself: after 5 years it is 2x, after 10 years 4x, after 15 years 8x.
:::

::: revision
Simple interest is charged on the original principal forever, so it grows in a straight line: \`SI = P x R x T / 100\`. Compound interest folds each year's interest back into the principal, so the base grows too: \`A = P(1 + R/100)^T\`, and the **interest is A minus P**, never A itself. On 10,000 at 10%, three years of SI is 3,000 while three years of CI is 3,310, and that 310 is interest earned by interest. The two-year gap has an exact formula, \`CI - SI = P(R/100)^2\`, which also runs backwards to recover the principal from the gap (a 25 rupee gap at 5% means P = 10,000); the three-year gap is \`P(R/100)^2 x (3 + R/100)\`. For half-yearly compounding halve the rate and double the periods (20% for 1 year becomes 10% twice, giving 12,100 not 12,000); quarterly means quarter and quadruple. The **rule of 72** estimates doubling time as \`72/R\` years, so 9% doubles money in about 8 years. Under CI, doubling in n years means 4x in 2n and 8x in 3n - but under SI, doubling in 8 years means tripling in 16, because SI never compounds.
:::`,
    mcqs: [
      {
        id: "q1",
        text: "What is the simple interest on 5,000 rupees at 8% per annum for 3 years?",
        options: ["1,000", "1,200", "1,250", "1,400"],
        correctIndex: 1,
        explanation: "SI = P x R x T / 100 = 5000 x 8 x 3 / 100 = 1200. Equivalently, 8% of 5000 is 400 a year, and 400 x 3 = 1200.",
      },
      {
        id: "q2",
        text: "In how many years will 6,000 rupees amount to 7,500 rupees at 5% per annum simple interest?",
        options: ["4", "5", "6", "7.5"],
        correctIndex: 1,
        explanation: "The interest needed is 7500 - 6000 = 1500. Interest per year is 5% of 6000 = 300, so T = 1500/300 = 5 years.",
      },
      {
        id: "q3",
        text: "What is the compound interest on 8,000 rupees at 10% per annum for 2 years?",
        options: ["1,600", "1,680", "1,720", "1,800"],
        correctIndex: 1,
        explanation: "Amount = 8000 x (1.10)^2 = 8000 x 1.21 = 9680, so CI = 9680 - 8000 = 1680. The option 1600 is the simple interest, which ignores the 80 rupees of interest earned by the first year's interest.",
      },
      {
        id: "q4",
        text: "What is the difference between the compound interest and the simple interest on 10,000 rupees at 10% per annum for 2 years?",
        options: ["50", "100", "200", "310"],
        correctIndex: 1,
        explanation: "Use CI - SI = P x (R/100)^2 = 10000 x 0.01 = 100. Check directly: SI = 2000 and CI = 10000 x 1.21 - 10000 = 2100. The option 310 is the three-year difference, not the two-year one.",
      },
      {
        id: "q5",
        text: "Find the simple interest on 12,000 rupees at 15% per annum for 4 years.",
        options: ["5,400", "6,000", "7,200", "7,800"],
        correctIndex: 2,
        explanation: "SI = 12000 x 15 x 4 / 100 = 7200. Per year the interest is 15% of 12000 = 1800, and 1800 x 4 = 7200.",
      },
      {
        id: "q6",
        text: "At what rate of simple interest per annum will 1,200 rupees amount to 1,560 rupees in 5 years?",
        options: ["5%", "6%", "7%", "7.5%"],
        correctIndex: 1,
        explanation: "Interest = 1560 - 1200 = 360 over 5 years, so 72 rupees per year. As a rate, 72/1200 = 0.06 = 6%. Using R = 360 x 100 / (1200 x 5) gives the same 6%.",
      },
      {
        id: "q7",
        text: "A sum of money amounts to 2,420 rupees in 2 years at 10% per annum compound interest. What is the principal?",
        options: ["1,936", "2,000", "2,100", "2,200"],
        correctIndex: 1,
        explanation: "P x (1.10)^2 = 2420, so P = 2420 / 1.21 = 2000. Multiplying by 0.81 instead of dividing by 1.21 gives the trap answer 1936.",
      },
      {
        id: "q8",
        text: "What will 10,000 rupees amount to in 1 year at 20% per annum compounded half-yearly?",
        options: ["11,000", "12,000", "12,100", "14,400"],
        correctIndex: 2,
        explanation: "Halve the rate and double the periods: 10% per half-year for 2 periods, so 10000 x (1.10)^2 = 12100. Leaving the rate at 20% for two periods gives 14,400, which charges the full annual rate twice; 12,000 is plain annual compounding.",
      },
      {
        id: "q9",
        text: "A sum of money doubles itself in 8 years at simple interest. In how many years will it triple?",
        options: ["12", "16", "20", "24"],
        correctIndex: 1,
        explanation: "Doubling means the interest earned equals the principal, so 8 years produces interest of P. Tripling needs interest of 2P, which takes 16 years because simple interest is linear. Answering 24 wrongly treats it like compound interest.",
      },
      {
        id: "q10",
        text: "A sum invested at compound interest doubles in 6 years. In how many years will it become 8 times itself?",
        options: ["12", "18", "24", "36"],
        correctIndex: 1,
        explanation: "Eight is three doublings (2 x 2 x 2), and under compound interest each doubling takes the same 6 years, so 3 x 6 = 18 years. Progression: 2x at 6 years, 4x at 12, 8x at 18.",
      },
      {
        id: "q11",
        text: "Using the rule of 72, roughly how long does money take to double at 9% per annum compound interest?",
        options: ["6 years", "8 years", "9 years", "12 years"],
        correctIndex: 1,
        explanation: "The rule of 72 estimates the doubling time as 72/R = 72/9 = 8 years. The exact value confirms it: 1.09^8 = 1.9926, just under double.",
      },
      {
        id: "q12",
        text: "The simple interest on a sum for 2 years at 12% per annum is 1,440 rupees. What is the compound interest on the same sum at the same rate for 2 years?",
        options: ["1,526.40", "1,512", "1,440", "1,600"],
        correctIndex: 0,
        explanation: "First recover the principal: SI = P x 0.12 x 2 = 1440 gives P = 6000. Then CI = 6000 x (1.12^2 - 1) = 6000 x 0.2544 = 1526.40. Equivalently, add the known gap P(R/100)^2 = 6000 x 0.0144 = 86.40 to the 1440.",
      },
      {
        id: "q13",
        text: "The difference between the compound interest and the simple interest on a certain sum at 5% per annum for 2 years is 25 rupees. What is the sum?",
        options: ["5,000", "8,000", "10,000", "12,500"],
        correctIndex: 2,
        explanation: "For 2 years the difference is P x (R/100)^2, so P x (0.05)^2 = P x 0.0025 = 25 and P = 10,000. Check: SI = 1000, and CI = 10000 x 1.1025 - 10000 = 1025, a difference of exactly 25.",
      },
      {
        id: "q14",
        text: "What is the compound interest on 6,250 rupees at 8% per annum for 2 years?",
        options: ["1,000", "1,040", "1,080", "1,120"],
        correctIndex: 1,
        explanation: "Amount = 6250 x (1.08)^2 = 6250 x 1.1664 = 7290, so CI = 7290 - 6250 = 1040. The simple interest would be 6250 x 0.16 = 1000, and the extra 40 is the interest on the first year's 500.",
      },
      {
        id: "q15",
        text: "A sum of money at simple interest amounts to 1,300 rupees in 3 years and to 1,500 rupees in 5 years. What is the sum?",
        options: ["900", "1,000", "1,100", "1,200"],
        correctIndex: 1,
        explanation: "The 200 rupee gain between year 3 and year 5 is two years of interest, so the interest is 100 per year. Three years of interest is 300, and the principal is 1300 - 300 = 1000 (a rate of 10%).",
      },
    ],
    timedQuiz: { timeLimitSeconds: 300, mcqIds: ["q4", "q8", "q10", "q12", "q13"] },
    problemIds: [],
    xpReward: 50, coinReward: 20,
    status: "published",
  },

  // ------------------------------------------------------------------
  // Day 9 - Wednesday 12 Aug 2026 - Time & Work
  // ------------------------------------------------------------------
  {
    date: "2026-08-12", dow: "wed", weekId: "2026-08-10", type: "lesson",
    title: "Day 9: Time & Work",
    difficulty: "Medium",
    estimatedMinutes: 18,
    concept: `## Two Painters, One Room

::: story
Ravi can paint a room in **6 days**. Sunita, who is faster, can paint the same room in **3 days**. They work together. How long does the room take?

Ask ten people and most will average the days: (6 + 3)/2 = 4.5 days. A few will add them: 9 days.

Both are nonsense, and you can see why without any arithmetic. **Sunita alone finishes in 3 days.** Adding a second painter cannot possibly make the job take longer than that. Any answer above 3 is wrong before you check it.

Here is the honest count. In one day Ravi does one sixth of the room. Sunita does one third. Together that is 1/6 + 1/3 = 1/2 of the room in a day, so the room takes **2 days**.

Days do not add. **Work per day** adds. Everything else in this lesson is a consequence of that one sentence.
:::

## Make The Whole Job A Whole Number

Fractions like 1/6 and 1/18 are correct but slow, and under exam pressure slow means wrong. So stop calling the job "1" and call it something convenient instead: the **LCM of the given days**.

Take A, who finishes in **12 days**, and B, who finishes in **18 days**. LCM(12, 18) = 36, so declare the job to be **36 units** of work.

  A does 36 / 12  =  3 units a day
  B does 36 / 18  =  2 units a day
  together        =  5 units a day
  time            =  36 / 5  =  7.2 days

No fractions touched, and the answer is exact. This is the trick worth drilling until it is automatic.

::: flow The LCM method, in the order you should do it
Read off every worker's solo time :: A takes 12 days, B takes 18 days
Set total work equal to their LCM :: LCM of 12 and 18 is 36, so the job is 36 units
Divide to get each daily rate :: A is 36 over 12 which is 3 units a day, B is 36 over 18 which is 2 units a day
Add the rates of everyone actually working :: 3 plus 2 gives 5 units a day
Divide total work by the combined rate :: 36 over 5 gives 7.2 days
Sanity-check against the fastest worker :: 7.2 is less than A's solo 12, so the answer is plausible
:::

## Subtracting Works Too

The same units let you go *backwards*, which is where most exam questions live.

A and B together finish a job in **8 days**. A alone would take **12 days**. How long would B alone take?

  LCM(8, 12) = 24, so the job is 24 units
  A + B together do 24 / 8  = 3 units a day
  A alone does      24 / 12 = 2 units a day
  so B alone does   3 - 2   = 1 unit a day
  B alone needs     24 / 1  = 24 days

Notice that 12 - 8 = 4 is *not* the answer. You cannot subtract days from days, only rates from rates.

The same subtraction cracks the three-worker pair puzzles. If A+B, B+C and A+C are given, add all three: each person appears exactly twice, so the sum is \`2 x (A + B + C)\`. Halve it to get the combined rate of all three, then subtract any pair to isolate the person left out.

## Men, Days And Hours In One Equation

When the *number* of workers changes too, the quantity that stays constant is the total effort - man-days:

  M1 x D1 x H1 / W1  =  M2 x D2 x H2 / W2

where M is workers, D is days, H is hours per day, W is the amount of work. Most questions only need two of the letters. Fifteen men finishing in 20 days is 300 man-days of effort, so 25 men need 300/25 = **12 days**.

::: table The five patterns that cover almost every Time and Work question
The question gives you | What to do | Worked instance
Two solo times, asks for together | Add the rates | 10 and 15 days on a 30-unit job give 3 and 2 units a day, so 30/5 = 6 days
Together time and one solo time | Subtract the rates | Together 8, A alone 12, so B alone is 24 days
"A is twice as good as B" | Rates are in ratio 2 to 1, so days are in ratio 1 to 2 | Together 14 days means total work 42 units, A alone 21 days
Workers change, work is the same | Man-days are constant | 15 men x 20 days = 300, so 25 men need 12 days
Wages for shared work | Split in the ratio of the RATES, not the days | A 15 days and B 20 days give rates 4 to 3, so B gets three sevenths
:::

## Work And Wages

A day's pay should track a day's work, so when two people share a job the money splits in the ratio of their **rates** - which is the *inverse* of the ratio of their days.

A takes 15 days, B takes 20 days, and together they are paid **3,500 rupees**. LCM(15, 20) = 60, so A does 4 units a day and B does 3. The ratio is 4 : 3, and B's share is

  3 / 7 x 3500 = 1,500

Splitting 15 : 20 instead would hand the slower worker the bigger share, which is exactly the wrong way round.

::: mistake
Combining the **days** instead of the work done per day. Averaging them (6 and 3 days becoming 4.5) or adding them (becoming 9) are the two commonest forms, and both are caught instantly by one check: **the combined time must always be smaller than the fastest worker's solo time.** If your answer is not, you have added the wrong things.

The same error in reverse: subtracting days. Together 8 days and A alone 12 days does *not* make B 12 - 8 = 4 days. B alone is 24 days. Rates subtract; days never do.

And the wages version: splitting the money in the ratio of the days (15 : 20) rather than the ratio of the rates (4 : 3). That pays the slower worker more for doing less.
:::

::: remember
One sentence to carry in: **days are not additive, work per day is.**

The practical form of it is the LCM method - set total work to the LCM of the given days, convert everyone to whole units per day, then add or subtract those units freely. And keep two sanity checks loaded:
- The team's time is always **less than the fastest member's** solo time.
- If A is n times as fast as B, then A takes **1/n** of B's time, so "twice as fast" means "half as many days" - the ratio flips.
:::

::: checkpoint
A can complete a job in 10 days and B can complete the same job in 15 days. Working together, how long will they take?
- ( ) 5 days
- (x) 6 days
- ( ) 12.5 days
- ( ) 25 days
> Set the job to LCM(10, 15) = 30 units. A does 30/10 = 3 units a day, B does 30/15 = 2, together 5 units a day, so the job takes 30/5 = **6 days**. The option 12.5 is the average of the two times and 25 is their sum, both of which are larger than A's solo 10 days and so impossible the moment a second worker joins. The option 5 is below the theoretical floor too: if both worked at A's faster rate the job would still need 5 days, so 5 requires B to be as fast as A, which she is not.
:::

::: revision
The whole topic rests on one fact: **days do not add, work per day does.** Convert every solo time into a rate, and make those rates whole numbers by setting the total job equal to the **LCM of the given days** - A at 12 days and B at 18 days become 3 and 2 units of a 36-unit job, so together they do 5 units a day and finish in 7.2 days. The same units run backwards by subtraction: together 8 days with A alone at 12 makes B 24 days, never 12 - 8 = 4. For three workers given only as pairs, add all three pair rates to get \`2 x (A + B + C)\`, halve it, then subtract a pair to isolate one person. When the headcount changes, man-days are constant: \`M1 D1 H1 / W1 = M2 D2 H2 / W2\`, so 15 men x 20 days = 300 man-days means 25 men take 12 days. "Twice as good a workman" means half the days, so the ratio flips. Wages split in the ratio of **rates**, not days: 15 and 20 days give 4 : 3, so the faster worker takes four sevenths. And check every answer against the floor - a team can never be slower than its fastest member alone.
:::`,
    mcqs: [
      {
        id: "q1",
        text: "A can do a piece of work in 10 days and B can do it in 15 days. Working together, how many days will they take?",
        options: ["5", "6", "12.5", "25"],
        correctIndex: 1,
        explanation: "Take the job as LCM(10, 15) = 30 units. A does 3 units a day, B does 2, together 5 units a day, so 30/5 = 6 days. Averaging the days gives 12.5 and adding them gives 25, both impossible since A alone needs only 10.",
      },
      {
        id: "q2",
        text: "A completes a work in 12 days and B in 18 days. Working together they will finish it in:",
        options: ["7.2 days", "6 days", "15 days", "30 days"],
        correctIndex: 0,
        explanation: "With the job set to LCM(12, 18) = 36 units, A does 3 units a day and B does 2, so together 5 units a day and the time is 36/5 = 7.2 days.",
      },
      {
        id: "q3",
        text: "A and B together can finish a job in 8 days, and A alone can finish it in 12 days. How long would B alone take?",
        options: ["4 days", "16 days", "20 days", "24 days"],
        correctIndex: 3,
        explanation: "Set the job to 24 units. Together they do 24/8 = 3 units a day and A does 24/12 = 2, so B does 1 unit a day and needs 24 days. Subtracting days (12 - 8 = 4) is the classic error; rates subtract, days do not.",
      },
      {
        id: "q4",
        text: "A is twice as good a workman as B, and together they finish a piece of work in 14 days. In how many days can A alone finish it?",
        options: ["18", "21", "28", "42"],
        correctIndex: 1,
        explanation: "Rates are in the ratio 2 : 1, so let A do 2 units a day and B 1, giving 3 units a day together. Total work is 14 x 3 = 42 units, so A alone takes 42/2 = 21 days (and B alone 42 days).",
      },
      {
        id: "q5",
        text: "If 15 men can complete a work in 20 days, how many days will 25 men take to complete the same work?",
        options: ["10", "12", "15", "33"],
        correctIndex: 1,
        explanation: "The total effort is 15 x 20 = 300 man-days, and that is fixed. With 25 men, the time is 300/25 = 12 days. More men means fewer days, so any answer above 20 is wrong on sight.",
      },
      {
        id: "q6",
        text: "6 men can build a wall in 10 days. How many men are needed to build it in 4 days?",
        options: ["12", "15", "18", "24"],
        correctIndex: 1,
        explanation: "The wall is 6 x 10 = 60 man-days of work. To finish in 4 days you need 60/4 = 15 men.",
      },
      {
        id: "q7",
        text: "A can do a work in 20 days and B in 30 days. They begin together, but A leaves after 5 days. How many more days does B need to finish the work?",
        options: ["15", "17.5", "20", "22.5"],
        correctIndex: 1,
        explanation: "Set the job to LCM(20, 30) = 60 units, so A does 3 and B does 2 units a day. In 5 days together they complete 5 x 5 = 25 units, leaving 35. B alone clears those at 2 units a day, taking 35/2 = 17.5 days.",
      },
      {
        id: "q8",
        text: "A, B and C can do a piece of work in 10, 12 and 15 days respectively. Working together, they will finish it in:",
        options: ["4 days", "5 days", "6 days", "12.33 days"],
        correctIndex: 0,
        explanation: "Set the job to LCM(10, 12, 15) = 60 units. The rates are 6, 5 and 4 units a day, totalling 15, so the time is 60/15 = 4 days.",
      },
      {
        id: "q9",
        text: "A and B together can do a work in 12 days, B and C in 15 days, and A and C in 20 days. How long will all three take working together?",
        options: ["8 days", "10 days", "12 days", "15 days"],
        correctIndex: 1,
        explanation: "Set the job to 60 units, so the pair rates are 5, 4 and 3 units a day. Adding them counts every worker exactly twice: 12 = 2 x (A + B + C), so all three together do 6 units a day and finish in 60/6 = 10 days.",
      },
      {
        id: "q10",
        text: "With A and B together taking 12 days, B and C 15 days, and A and C 20 days, how long would A alone take?",
        options: ["20 days", "24 days", "30 days", "60 days"],
        correctIndex: 2,
        explanation: "All three together do 6 units a day of a 60-unit job (from adding the pair rates 5 + 4 + 3 = 12 and halving). B and C together do 4 units a day, so A alone does 6 - 4 = 2 units a day and needs 60/2 = 30 days.",
      },
      {
        id: "q11",
        text: "A can do a work in 15 days and B in 20 days. They complete it together and are paid 3,500 rupees. What is B's share?",
        options: ["1,400", "1,500", "1,750", "2,000"],
        correctIndex: 1,
        explanation: "Wages split in the ratio of work done, i.e. of the rates. With the job at 60 units, A does 4 units a day and B does 3, so the ratio is 4 : 3 and B receives 3/7 x 3500 = 1500. Splitting 15 : 20 would wrongly pay the slower worker more.",
      },
      {
        id: "q12",
        text: "8 women can complete a work in 12 days, and 12 children can complete the same work in 16 days. How long will 6 women and 8 children take working together?",
        options: ["9.6 days", "10 days", "12 days", "14 days"],
        correctIndex: 0,
        explanation: "One woman's rate is 1/(8 x 12) = 1/96 per day and one child's is 1/(12 x 16) = 1/192. So 6 women give 6/96 = 1/16 and 8 children give 8/192 = 1/24. Together 1/16 + 1/24 = 5/48, so the time is 48/5 = 9.6 days.",
      },
      {
        id: "q13",
        text: "A works twice as fast as B. Together they complete a job in 12 days. How long would B alone take?",
        options: ["18 days", "24 days", "36 days", "48 days"],
        correctIndex: 2,
        explanation: "Let B do 1 unit a day and A do 2, so together they do 3 units a day and the job is 12 x 3 = 36 units. B alone needs 36/1 = 36 days. (A alone would need 18.)",
      },
      {
        id: "q14",
        text: "A can complete a job in 9 days. He works for 3 days and then B finishes the remaining work in 8 days. How long would B alone take to do the whole job?",
        options: ["10 days", "12 days", "15 days", "18 days"],
        correctIndex: 1,
        explanation: "In 3 days A completes 3/9 = 1/3 of the job, so B does the remaining 2/3 in 8 days. If 2/3 takes 8 days, the whole job takes 8 x 3/2 = 12 days.",
      },
      {
        id: "q15",
        text: "4 men and 6 women can complete a work in 8 days, while 3 men and 7 women can complete it in 10 days. In how many days will 10 women complete the same work?",
        options: ["30", "35", "40", "50"],
        correctIndex: 2,
        explanation: "Let m and w be daily rates. From 8(4m + 6w) = 1 and 10(3m + 7w) = 1 we get 32m + 48w = 30m + 70w, so 2m = 22w and m = 11w. Substituting: 32(11w) + 48w = 400w = 1, so w = 1/400. Then 10 women do 10/400 = 1/40 per day and need 40 days.",
      },
    ],
    timedQuiz: { timeLimitSeconds: 300, mcqIds: ["q4", "q7", "q9", "q11", "q15"] },
    problemIds: [],
    xpReward: 50, coinReward: 20,
    status: "published",
  },

  // ------------------------------------------------------------------
  // Day 10 - Thursday 13 Aug 2026 - Pipes & Cisterns
  // ------------------------------------------------------------------
  {
    date: "2026-08-13", dow: "thu", weekId: "2026-08-10", type: "lesson",
    title: "Day 10: Pipes & Cisterns",
    difficulty: "Medium",
    estimatedMinutes: 18,
    concept: `## The Bathtub With The Plug Out

::: story
You start filling a bathtub. The tap alone would fill it in **20 minutes**. But the plug is out, and the open drain alone would empty a full tub in **30 minutes**.

Does the tub fill at all? And if so, when?

Give the tub a size you can count in. LCM(20, 30) = 60, so call it **60 litres**.

  the tap adds     60 / 20  =  +3 litres a minute
  the drain removes 60 / 30  =  -2 litres a minute
  net                        =  +1 litre a minute
  so the tub fills in 60 / 1  =  60 minutes

It fills - but it takes an hour instead of twenty minutes, because two of every three litres you pour in leave down the drain.

That minus sign is the entire topic. Pipes and cisterns is Time and Work with one new idea: **a pipe that empties does negative work.**
:::

## Same Machinery, One New Sign

Everything from yesterday transfers unchanged. A pipe that fills a tank in T hours does \`1/T\` of the tank per hour, exactly as a worker does \`1/T\` of a job per day. The LCM trick works identically: set the tank equal to the LCM of the given times so every rate is a whole number.

The only new rule is bookkeeping:

  an INLET pipe (fills)  counts as  +tank/T per hour
  an OUTLET pipe (empties) counts as  -tank/T per hour
  net rate = sum of everything currently open
  time to fill = tank / net rate

::: flow Working any pipes problem
List every pipe with its solo time :: fill in 12 hours, fill in 15 hours, empty in 20 hours
Set the tank to the LCM of those times :: LCM of 12, 15 and 20 is 60, so the tank is 60 units
Convert each pipe to units per hour :: 5 units, 4 units, 3 units
Attach the sign :: plus 5 and plus 4 for the two inlets, minus 3 for the outlet
Add only the pipes that are open :: 5 plus 4 minus 3 gives a net of 6 units per hour
Divide the tank by the net rate :: 60 over 6 gives 10 hours
:::

## The Classic: Two Fill, One Empties

That flow above *is* the standard question, so let us say it in words. Two pipes can fill a tank in **12 hours** and **15 hours**. A third pipe, at the bottom, can empty the full tank in **20 hours**. All three are opened together on an empty tank.

  tank = LCM(12, 15, 20) = 60 units
  inlet 1:  +5 units/hour
  inlet 2:  +4 units/hour
  outlet:   -3 units/hour
  net:      +6 units/hour
  time:     60 / 6 = 10 hours

Sanity-check it. Without the outlet, the two inlets would take 60/9 = 6.67 hours. The leak stretches that to 10 hours. Slower, but still finite - because the inlets out-muscle the outlet. Keep hold of that comparison; the next section is what happens when they do not.

## When The Tank Never Fills

Pipe A fills a tank in **5 hours**. Pipe B empties it in **4 hours**. Both are opened on an empty tank.

  tank = LCM(5, 4) = 20 units
  A:    +4 units/hour
  B:    -5 units/hour
  net:  -1 unit/hour

The net rate is **negative**. The tank does not fill slowly - it does not fill at all, ever. It just stays empty, with one unit's worth of water pouring in and straight back out.

An exam will happily offer you "20 hours" as an option here, because 20/1 = 20 is what you get if you take the absolute value and stop thinking. The correct response to a negative net rate on an empty tank is **it never fills**. (If the tank had started full, that same -1 would empty it in 20 hours - the arithmetic is fine, it is the question that changes.)

## Leak Problems Are Subtraction

::: story
A tank is normally filled by its pipe in **6 hours**. One day it takes **8 hours**, and someone spots a leak at the bottom.

How long would that leak take to drain a full tank on its own?

The tempting answer is 8 - 6 = 2 hours. It is wrong, and badly so - a leak that could empty the tank in 2 hours would overwhelm a pipe that needs 6 to fill it, and nothing would ever fill.

Do it with rates. LCM(6, 8) = 24 units.

  pipe alone:          24 / 6  =  4 units/hour
  pipe with leak:      24 / 8  =  3 units/hour
  so the leak removes  4 - 3   =  1 unit/hour
  leak alone empties   24 / 1  =  24 hours

Twenty-four hours, not two. The leak is *twelve times weaker* than the guess, which is exactly why the pipe still manages to fill the tank.
:::

::: table The four shapes this topic comes in
The situation | The setup | Worked instance
Inlets only | Add the positive rates | 6 h and 12 h on a 12-unit tank: 2 plus 1 gives 4 hours
Inlets and an outlet | Add, with the outlet negative | 12, 15 and 20 h on a 60-unit tank: 5 plus 4 minus 3 gives 10 hours
Leak found by comparing times | Leak rate equals normal rate minus observed rate | 6 h normally and 8 h actually gives a leak of 24 hours
A pipe closed partway | Charge the closing pipe only for the minutes it ran | See the worked closing-time example below
:::

## Closing A Pipe Early

Two pipes A and B fill a tank in **24 minutes** and **32 minutes**. Both are opened together, but B is shut off partway so that the tank is exactly full at **18 minutes**. When was B closed?

Set the tank to LCM(24, 32) = 96 units, so A does 4 units a minute and B does 3.

  A runs the whole 18 minutes:  18 x 4  =  72 units
  the tank needs                          96 units
  so B must supply              96 - 72  =  24 units
  B delivers 3 units a minute, so it ran  24 / 3  =  8 minutes

B was closed after **8 minutes**. The pattern is always the same: give the always-open pipe credit for the full duration, see what is missing, and divide that shortfall by the other pipe's rate.

::: mistake
Giving the outlet pipe a **positive** sign, or quietly dropping it. A tank with a 20-hour leak and two inlets that would manage 6.67 hours does not fill in 6.67 hours and it does not fill in 4.28 hours (which is what you get by adding all three rates as inlets). It fills in 10.

The second, and it is the one that costs most marks: answering a **leak** question by subtracting the times. Normal 6 hours, actual 8 hours, so the leak is 2 hours? No - subtract the rates, not the times, and the leak needs 24 hours. Any time you find yourself subtracting one duration from another in this topic, stop.

The third: reporting a number when the honest answer is "never". If the net rate on an empty tank comes out negative or zero, the tank does not fill, and the plausible-looking option built from the absolute value is a trap.
:::

::: remember
**Inlet plus, outlet minus, then add.** That is the whole extension over Time and Work.

Three checks that catch nearly every slip:
- Adding a leak must make the fill time **longer**. If your answer with the outlet open is faster than without it, you flipped a sign.
- If the net rate is negative or zero on an empty tank, the answer is **never fills** - not the reciprocal of the magnitude.
- For a leak found by comparing a normal time and an observed time, the leak's own time is always **longer than both**, because it is the weakest of the three rates involved. A leak "faster" than the filling pipe is arithmetically impossible if the tank still fills.
:::

::: checkpoint
Pipe A can fill a tank in 10 hours while pipe B can empty the full tank in 15 hours. Both are opened together on an empty tank. When will the tank be full?
- ( ) 6 hours
- ( ) 25 hours
- (x) 30 hours
- ( ) It will never fill
> Set the tank to LCM(10, 15) = 30 units. A adds 30/10 = +3 units an hour and B removes 30/15 = -2, so the net is +1 unit an hour and the tank fills in 30/1 = **30 hours**. The option 6 hours comes from adding both rates as inlets (3 + 2 = 5), which is what you would get if B also filled the tank. It never fills is wrong because the net rate is positive - A is the stronger pipe, so the water level does rise, just slowly.
:::

::: revision
Pipes and cisterns is Time and Work with a sign: an **inlet is positive, an outlet is negative**, and the net rate is the sum of whatever is currently open. Set the tank to the **LCM of the given times** so every rate is a whole number, then divide the tank by the net rate. Two pipes filling in 12 and 15 hours against an outlet emptying in 20 hours give 5 + 4 - 3 = 6 units of a 60-unit tank per hour, so the tank fills in **10 hours** - longer than the 6.67 hours the inlets alone would need, which is the check that your sign is right. If the net rate on an empty tank is negative or zero the tank **never fills**, and the reciprocal of its magnitude is a trap option. Leak questions are solved by subtracting **rates, never times**: filling normally in 6 hours but actually in 8 means the leak removes 4 - 3 = 1 unit of 24 per hour, so the leak alone would take 24 hours, not 8 - 6 = 2. When a pipe is closed early, credit the always-open pipe for the whole duration, find the shortfall, and divide it by the closing pipe's rate - A at 24 minutes and B at 32 minutes filling in 18 minutes means B ran for 8 of them.
:::`,
    mcqs: [
      {
        id: "q1",
        text: "One pipe fills a tank in 6 hours and another fills it in 12 hours. If both are opened together on an empty tank, how long will it take to fill?",
        options: ["4 hours", "6 hours", "9 hours", "18 hours"],
        correctIndex: 0,
        explanation: "Set the tank to LCM(6, 12) = 12 units. The pipes add 2 and 1 units an hour, so together 3 units an hour and the tank fills in 12/3 = 4 hours. Averaging the times gives 9, which is slower than one pipe alone and therefore impossible.",
      },
      {
        id: "q2",
        text: "Pipe A fills a tank in 20 minutes and pipe B can empty the full tank in 30 minutes. If both are opened on an empty tank, how long will the tank take to fill?",
        options: ["50 minutes", "60 minutes", "12 minutes", "25 minutes"],
        correctIndex: 1,
        explanation: "With the tank at 60 units, A adds 3 units a minute and B removes 2, a net of +1, so 60/1 = 60 minutes. The option 12 treats B as a second inlet (3 + 2 = 5 units a minute), and 50 comes from adding the times.",
      },
      {
        id: "q3",
        text: "Two pipes can fill a tank in 12 hours and 15 hours respectively, while a third pipe can empty the full tank in 20 hours. If all three are opened together, the tank will be filled in:",
        options: ["8 hours", "10 hours", "12 hours", "15 hours"],
        correctIndex: 1,
        explanation: "Take the tank as LCM(12, 15, 20) = 60 units, giving rates +5, +4 and -3. The net is 6 units an hour, so the tank fills in 60/6 = 10 hours. Ignoring the outlet gives 60/9 = 6.67 hours, so the leak really does cost about 3.3 hours.",
      },
      {
        id: "q4",
        text: "A tank is normally filled in 6 hours, but takes 8 hours because of a leak at the bottom. How long would the leak take to empty a full tank?",
        options: ["2 hours", "12 hours", "24 hours", "48 hours"],
        correctIndex: 2,
        explanation: "Subtract rates, not times. With the tank at 24 units, the pipe alone does 4 units an hour and the pipe-with-leak does 3, so the leak removes 1 unit an hour and would need 24 hours alone. Answering 8 - 6 = 2 hours would make the leak stronger than the pipe, in which case the tank could never fill at all.",
      },
      {
        id: "q5",
        text: "Pipe A can fill a tank in 10 minutes and pipe B in 15 minutes. Both are opened together, but A is closed after 4 minutes. How many more minutes will B need to fill the tank?",
        options: ["4", "5", "6", "7.5"],
        correctIndex: 1,
        explanation: "With the tank at 30 units, A does 3 units a minute and B does 2. In 4 minutes together they fill 4 x 5 = 20 units, leaving 10. B clears those at 2 units a minute, so 5 more minutes (9 minutes in total).",
      },
      {
        id: "q6",
        text: "Two pipes A and B can fill a tank in 20 and 30 minutes respectively. Both are opened together, but B must be closed so that the tank is exactly full in 18 minutes. After how many minutes should B be closed?",
        options: ["3", "6", "8", "9"],
        correctIndex: 0,
        explanation: "Take the tank as 60 units, so A does 3 units a minute and B does 2. A runs all 18 minutes and supplies 54 units, leaving 6 units for B. At 2 units a minute B must run for 3 minutes, so it is closed after 3 minutes.",
      },
      {
        id: "q7",
        text: "Three pipes can fill a tank in 4, 6 and 12 hours respectively. If all three are opened together, the tank will be filled in:",
        options: ["2 hours", "3 hours", "4 hours", "22 hours"],
        correctIndex: 0,
        explanation: "Set the tank to LCM(4, 6, 12) = 12 units, giving rates 3, 2 and 1 units an hour. The total is 6 units an hour, so the tank fills in 12/6 = 2 hours - faster than the quickest pipe alone, as it must be.",
      },
      {
        id: "q8",
        text: "A cistern has a leak which would empty it in 20 minutes. A tap admitting 4 litres per minute is turned on, and the cistern is now emptied in 24 minutes. What is the capacity of the cistern?",
        options: ["240 litres", "360 litres", "480 litres", "600 litres"],
        correctIndex: 2,
        explanation: "Let the capacity be C. The leak removes C/20 litres a minute, and with the tap the net outflow is C/20 - 4 = C/24. So C/20 - C/24 = 4, i.e. C(6 - 5)/120 = 4, giving C = 480 litres.",
      },
      {
        id: "q9",
        text: "A pipe can fill a tank in 15 hours, but because of a leak it takes 20 hours. If the tank is full, how long will the leak take to empty it?",
        options: ["5 hours", "30 hours", "45 hours", "60 hours"],
        correctIndex: 3,
        explanation: "The leak's rate is 1/15 - 1/20 = (4 - 3)/60 = 1/60 of the tank per hour, so it needs 60 hours alone. Subtracting the times to get 20 - 15 = 5 hours is the standard trap and would make the leak four times stronger than the filling pipe.",
      },
      {
        id: "q10",
        text: "Pipe A can fill a tank in 12 minutes and pipe B can empty the full tank in 18 minutes. If the tank is already half full and both pipes are opened, how long will it take to fill completely?",
        options: ["6 minutes", "18 minutes", "24 minutes", "36 minutes"],
        correctIndex: 1,
        explanation: "With the tank at LCM(12, 18) = 36 units, A adds 3 units a minute and B removes 2, a net of +1. Half the tank is 18 units still to fill, so it takes 18 minutes. The 36 minutes figure is the time from empty.",
      },
      {
        id: "q11",
        text: "Two pipes A and B can fill a tank in 24 minutes and 32 minutes respectively. If both are opened together, after how many minutes should B be closed so that the tank is full in 18 minutes?",
        options: ["6", "8", "10", "12"],
        correctIndex: 1,
        explanation: "Set the tank to LCM(24, 32) = 96 units, so A does 4 units a minute and B does 3. A runs the full 18 minutes and delivers 72 units, leaving 24 units for B, which at 3 units a minute takes 8 minutes.",
      },
      {
        id: "q12",
        text: "A tap can fill a tank in 8 hours and another tap can empty the full tank in 16 hours. If both are opened together on an empty tank, when will it be full?",
        options: ["8 hours", "12 hours", "16 hours", "24 hours"],
        correctIndex: 2,
        explanation: "With the tank at 16 units, the inlet adds 2 units an hour and the outlet removes 1, a net of +1, so the tank fills in 16 hours. In general, an outlet exactly twice as slow as the inlet doubles the fill time.",
      },
      {
        id: "q13",
        text: "Pipe A can fill a tank in 5 hours while pipe B can empty the full tank in 4 hours. If both are opened together on an empty tank, what happens?",
        options: ["It fills in 20 hours", "It fills in 9 hours", "It never fills", "It fills in 1 hour"],
        correctIndex: 2,
        explanation: "Take the tank as 20 units: A adds 4 units an hour and B removes 5, so the net rate is -1 unit an hour. Since the tank starts empty and the net flow is outward, it never fills. The 20 hours option comes from ignoring the minus sign - that figure is how long B would take to empty the tank if it had started full.",
      },
      {
        id: "q14",
        text: "Taps A, B and C can fill a tank in 12, 15 and 20 hours respectively. Tap A is kept open throughout, while B and C are opened for one hour each alternately, starting with B. How long will the tank take to fill?",
        options: ["6 hours", "7 hours", "8 hours", "9.33 hours"],
        correctIndex: 1,
        explanation: "With the tank at 60 units the rates are A = 5, B = 4 and C = 3 units an hour. Hour 1 (A and B) gives 9 units and hour 2 (A and C) gives 8, so every 2-hour block adds 17 units. After 6 hours 51 units are done, leaving 9, and the seventh hour is an A-and-B hour worth exactly 9 units. Total time is 7 hours.",
      },
      {
        id: "q15",
        text: "Two pipes can fill a tank in 20 and 24 minutes respectively, and a waste pipe empties 3 gallons per minute. All three together fill the tank in 15 minutes. What is the capacity of the tank?",
        options: ["60 gallons", "90 gallons", "120 gallons", "180 gallons"],
        correctIndex: 2,
        explanation: "Let the capacity be C gallons, so the waste pipe removes 3/C of the tank per minute. Then 1/20 + 1/24 - 3/C = 1/15. Since 1/20 + 1/24 = 11/120 and 1/15 = 8/120, we get 3/C = 3/120, so C = 120 gallons.",
      },
    ],
    timedQuiz: { timeLimitSeconds: 300, mcqIds: ["q3", "q4", "q8", "q11", "q15"] },
    problemIds: [],
    xpReward: 50, coinReward: 20,
    status: "published",
  },

  // ------------------------------------------------------------------
  // Day 11 - Friday 14 Aug 2026 - Time, Speed & Distance
  // ------------------------------------------------------------------
  {
    date: "2026-08-14", dow: "fri", weekId: "2026-08-10", type: "lesson",
    title: "Day 11: Time, Speed & Distance",
    difficulty: "Medium",
    estimatedMinutes: 18,
    concept: `## The Walk To School

::: story
You walk **1.2 km** to school and it takes you **15 minutes**. How fast do you walk?

Careful with the units before you divide anything. Fifteen minutes is a quarter of an hour, so

  speed = 1.2 / 0.25 = 4.8 km per hour

Now a second question, the one that actually shows up on papers. Tomorrow you are late and you have only **10 minutes**. How fast must you walk?

  speed = 1.2 / (10/60) = 1.2 x 6 = 7.2 km per hour

The distance did not change. You cut the time to two thirds, and the required speed went up by exactly one half - to 7.2, which is 4.8 x 3/2.

That inverse see-saw between speed and time, with the distance pinned in place, is the single most useful idea in this entire chapter. Once you see it, half the questions stop needing algebra.
:::

## Three Quantities, One Relationship

  distance = speed x time

and therefore \`speed = distance / time\` and \`time = distance / speed\`. Cover the one you want with your thumb and the arrangement of the other two is the formula.

Two consequences do most of the work:

- **Distance fixed?** Speed and time are **inversely** proportional. Multiply speed by 3/2 and time gets multiplied by 2/3.
- **Time fixed?** Distance and speed are **directly** proportional. Twice the speed covers twice the ground.

Here is the inverse rule earning its keep. Walking at **3/4** of his usual speed, a man reaches his office **20 minutes late**. What is his usual travel time?

  speed x 3/4  means  time x 4/3
  so the extra time is 1/3 of the usual time
  1/3 of usual = 20 minutes
  usual time   = 60 minutes

No distance, no speed, no equation. Just the see-saw.

## The 5/18 That Everything Depends On

Papers mix km/h and m/s in the same sentence deliberately, so the conversion has to be reflex. It comes from one substitution:

  1 km/h = 1000 metres / 3600 seconds = 5/18 m/s

So **km/h to m/s: multiply by 5/18. m/s to km/h: multiply by 18/5.**

Anchor it on one pair you will never doubt: **18 km/h = 5 m/s.** Eighteen is the bigger number and it belongs to the bigger unit, km/h. If your converted answer came out larger in m/s than it was in km/h, you have the fraction upside down.

::: table Conversions worth knowing on sight
km/h | m/s | How it lands
18 | 5 | the anchor pair, 18 x 5/18 = 5
36 | 10 | 36 x 5/18 = 10
54 | 15 | 54 x 5/18 = 15
72 | 20 | 72 x 5/18 = 20
90 | 25 | 90 x 5/18 = 25
108 | 30 | 108 x 5/18 = 30
:::

Every one of those left-hand numbers is a multiple of 18, which is why exam setters keep choosing them. Spot a speed of 54 or 72 km/h and you already know it is 15 or 20 m/s.

## Relative Speed: Sit On One Of Them

::: story
Two cars are on a straight road, one at **60 km/h** and one at **40 km/h**.

They start **200 km** apart and drive **towards** each other. Imagine sitting in the slower car and watching the other one: the gap shrinks by 60 + 40 = **100 km every hour**, so they meet after 200/100 = **2 hours**.

Now the same two cars, driving in the **same** direction, with the faster one **20 km behind**. From the slow car, the one behind is gaining at only 60 - 40 = **20 km an hour**, so it draws level after 20/20 = **1 hour**.

Same cars, same speeds. The number that matters is not either speed, it is how fast the *gap* changes.
:::

  opposite directions (approaching or crossing):  relative speed = sum
  same direction (chasing or overtaking):         relative speed = difference

  time = the gap to be closed / relative speed

The gap is whatever distance has to disappear: the head start, the initial separation, or - tomorrow, for trains - the combined length of two vehicles.

## Average Speed Is Not The Average Of The Speeds

Drive 20 km to a town at **40 km/h**, then drive the same 20 km home at **60 km/h**. Average speed for the round trip?

Not 50. Average speed is defined as **total distance over total time**, and the two legs take different times:

  out:   20 / 40  =  0.5 hour
  back:  20 / 60  =  0.333 hour
  total: 40 km in 0.8333 hour
  average = 40 / 0.8333 = 48 km/h

You spent *longer* at the slow speed, so the slow speed gets more weight. For two equal distances there is a one-line shortcut, the harmonic mean:

  average speed = 2xy / (x + y) = 2 x 40 x 60 / 100 = 48 km/h

If the two *times* are equal instead of the two distances, then and only then is the plain average correct.

::: mistake
Averaging the two speeds. A there-and-back trip at 40 and 60 km/h averages **48**, not 50, and the answer is always **below** the plain average, never above. The gap widens as the speeds diverge: 20 and 80 km/h average 32, a long way from 50.

The version that catches people who know the shortcut: applying \`2xy/(x + y)\` when the distances are *not* equal. Cover 100 km at 50 km/h and then 120 km at 40 km/h and you must go back to total-over-total: 220 km in 2 + 3 = 5 hours is **44 km/h**. The harmonic mean formula would give 44.4, and the plain average 45 - three different numbers, and only one of them answers the question.

And the mechanical one: inverting the conversion. Multiplying km/h by 18/5 instead of 5/18 turns 72 km/h into 259 m/s, which is faster than sound. Any m/s figure larger than its km/h figure is wrong on sight.
:::

::: remember
**Distance fixed means speed and time see-saw.** That one sentence solves the whole family of late-and-early questions without algebra: at 3/4 speed the time becomes 4/3, so the extra third of the journey time is the delay you were given.

Two more to keep loaded:
- **18 km/h = 5 m/s.** Multiply by 5/18 going down to m/s, by 18/5 coming back up. The bigger number always sits with km/h.
- Average speed is **total distance over total time**, full stop. For two equal distances that simplifies to \`2xy/(x + y)\`, which is always less than \`(x + y)/2\`.
:::

::: checkpoint
A man walking to the railway station at 5 km/h misses his train by 7 minutes. Walking at 6 km/h he would have arrived 5 minutes early. How far is the station?
- ( ) 4 km
- ( ) 5 km
- (x) 6 km
- ( ) 7.5 km
> The two walks differ by 7 + 5 = 12 minutes, which is 1/5 of an hour. So \`d/5 - d/6 = 1/5\`. The left side is \`d(6 - 5)/30 = d/30\`, so \`d/30 = 1/5\` and **d = 6 km**. Check both walks: 6/5 = 1.2 hours = 72 minutes, and 6/6 = 1 hour = 60 minutes, a gap of exactly 12 minutes. The trap is using only the 7 minutes (or only the 5) as the time difference instead of adding them, since one walk is late and the other early - the total swing spans both sides of the train's departure.
:::

::: revision
Everything comes from \`distance = speed x time\`, and the two proportionalities it implies: with **distance fixed**, speed and time are inversely proportional (at 3/4 of usual speed the journey takes 4/3 of usual time, so a 20-minute delay means a usual time of 60 minutes); with **time fixed**, distance is proportional to speed. Convert units by reflex: \`km/h x 5/18 = m/s\` and \`m/s x 18/5 = km/h\`, anchored on **18 km/h = 5 m/s**, so 54 km/h is 15 m/s and 72 km/h is 20 m/s. For two bodies, work with the **relative speed**: add the speeds when they move in opposite directions (approaching or crossing) and subtract them when they move in the same direction (chasing or overtaking), then divide the gap by that relative speed. On a 400 m circular track, runners at 5 and 3 m/s meet after 400/8 = 50 s going opposite ways, but after 400/2 = 200 s going the same way. Average speed is **total distance over total time** and nothing else; for two equal distances it is the harmonic mean \`2xy/(x + y)\`, so 40 and 60 km/h give **48**, not 50 - and when the distances are unequal, go straight back to total over total.
:::`,
    mcqs: [
      {
        id: "q1",
        text: "Convert 72 km/h into metres per second.",
        options: ["15 m/s", "20 m/s", "25 m/s", "259.2 m/s"],
        correctIndex: 1,
        explanation: "Multiply by 5/18: 72 x 5/18 = 20 m/s. The option 259.2 comes from multiplying by 18/5 instead, which is the conversion in the wrong direction and gives a speed faster than sound.",
      },
      {
        id: "q2",
        text: "Convert 25 metres per second into km/h.",
        options: ["6.94 km/h", "72 km/h", "90 km/h", "100 km/h"],
        correctIndex: 2,
        explanation: "Multiply by 18/5: 25 x 18/5 = 90 km/h. Using 5/18 by mistake gives 6.94 km/h, which is slower than a jog and clearly wrong for 25 m/s.",
      },
      {
        id: "q3",
        text: "A car covers 240 km in 4 hours. What is its speed?",
        options: ["50 km/h", "55 km/h", "60 km/h", "65 km/h"],
        correctIndex: 2,
        explanation: "Speed = distance / time = 240/4 = 60 km/h.",
      },
      {
        id: "q4",
        text: "A train is travelling at 54 km/h. How far does it travel in 40 seconds?",
        options: ["360 m", "540 m", "600 m", "2,160 m"],
        correctIndex: 2,
        explanation: "First convert: 54 x 5/18 = 15 m/s. Then distance = 15 x 40 = 600 m. The option 2160 comes from using 54 km/h directly with 40 seconds as though the units matched.",
      },
      {
        id: "q5",
        text: "A man covers a certain distance at 4 km/h in 45 minutes. At what speed must he travel to cover the same distance in 30 minutes?",
        options: ["5 km/h", "6 km/h", "6.5 km/h", "8 km/h"],
        correctIndex: 1,
        explanation: "The distance is 4 x 45/60 = 3 km. To cover 3 km in half an hour needs 3/0.5 = 6 km/h. Equivalently, the time falls to 2/3, so the speed rises by 3/2: 4 x 3/2 = 6.",
      },
      {
        id: "q6",
        text: "A person travels 20 km at 40 km/h and returns over the same 20 km at 60 km/h. What is the average speed for the whole journey?",
        options: ["48 km/h", "50 km/h", "52 km/h", "100 km/h"],
        correctIndex: 0,
        explanation: "Total time is 20/40 + 20/60 = 0.5 + 0.333 = 0.8333 hour for 40 km, so the average is 40/0.8333 = 48 km/h. The harmonic mean gives it in one step: 2 x 40 x 60 / 100 = 48. The plain average 50 is always too high because more time is spent at the slower speed.",
      },
      {
        id: "q7",
        text: "Two trains 300 km apart start at the same time and move towards each other at 60 km/h and 40 km/h. After how long do they meet?",
        options: ["2 hours", "3 hours", "4 hours", "5 hours"],
        correctIndex: 1,
        explanation: "Moving in opposite directions, the gap closes at the sum of the speeds: 60 + 40 = 100 km/h. So they meet after 300/100 = 3 hours.",
      },
      {
        id: "q8",
        text: "Two cars travel in the same direction at 60 km/h and 45 km/h. The faster car is 30 km behind the slower one. How long will it take to catch up?",
        options: ["1 hour", "1.5 hours", "2 hours", "3 hours"],
        correctIndex: 2,
        explanation: "In the same direction the relative speed is the difference: 60 - 45 = 15 km/h. Closing a 30 km gap at 15 km/h takes 30/15 = 2 hours. Using the sum, 105 km/h, would give the wrong 0.29 hours.",
      },
      {
        id: "q9",
        text: "Walking at three quarters of his usual speed, a man reaches his office 20 minutes late. What is his usual travel time?",
        options: ["40 minutes", "50 minutes", "60 minutes", "80 minutes"],
        correctIndex: 2,
        explanation: "With the distance fixed, speed and time are inversely proportional, so at 3/4 speed the time becomes 4/3 of usual. The extra 1/3 of the usual time is the 20-minute delay, so the usual time is 60 minutes.",
      },
      {
        id: "q10",
        text: "A car covers the first 100 km at 50 km/h and the next 120 km at 40 km/h. What is its average speed for the whole trip?",
        options: ["44 km/h", "45 km/h", "46 km/h", "48 km/h"],
        correctIndex: 0,
        explanation: "Total distance 220 km; total time 100/50 + 120/40 = 2 + 3 = 5 hours. Average = 220/5 = 44 km/h. Averaging the speeds gives 45, and the harmonic mean 2xy/(x+y) gives 44.4 - it does not apply here because the two distances are not equal.",
      },
      {
        id: "q11",
        text: "A man walking to the station at 5 km/h misses his train by 7 minutes. Walking at 6 km/h he would have arrived 5 minutes early. How far is the station?",
        options: ["4 km", "5 km", "6 km", "7.5 km"],
        correctIndex: 2,
        explanation: "The two walks differ by 7 + 5 = 12 minutes = 1/5 hour, so d/5 - d/6 = 1/5. That gives d/30 = 1/5 and d = 6 km. Check: 6/5 hour is 72 minutes and 6/6 hour is 60 minutes, exactly 12 apart.",
      },
      {
        id: "q12",
        text: "A boy runs 400 metres in 50 seconds. What is his speed in km/h?",
        options: ["24 km/h", "28.8 km/h", "30 km/h", "32 km/h"],
        correctIndex: 1,
        explanation: "His speed is 400/50 = 8 m/s. Converting, 8 x 18/5 = 28.8 km/h.",
      },
      {
        id: "q13",
        text: "Two runners start together from the same point on a circular track 400 m long and run in opposite directions at 5 m/s and 3 m/s. After how long do they first meet?",
        options: ["50 seconds", "100 seconds", "200 seconds", "400 seconds"],
        correctIndex: 0,
        explanation: "Running in opposite directions they close the 400 m loop at 5 + 3 = 8 m/s, so they first meet after 400/8 = 50 seconds.",
      },
      {
        id: "q14",
        text: "On the same 400 m circular track, the two runners at 5 m/s and 3 m/s now run in the same direction. After how long does the faster runner first overtake the slower one?",
        options: ["50 seconds", "100 seconds", "200 seconds", "400 seconds"],
        correctIndex: 2,
        explanation: "In the same direction the relative speed is 5 - 3 = 2 m/s, and the faster runner must gain a full lap of 400 m, so it takes 400/2 = 200 seconds. Using the sum of the speeds gives the meeting time for opposite directions, 50 seconds, which is the trap here.",
      },
      {
        id: "q15",
        text: "A cyclist covers a certain distance in 5 hours at 12 km/h. By how much must he increase his speed to cover the same distance in 4 hours?",
        options: ["2 km/h", "3 km/h", "4 km/h", "5 km/h"],
        correctIndex: 1,
        explanation: "The distance is 12 x 5 = 60 km. To cover it in 4 hours he needs 60/4 = 15 km/h, an increase of 15 - 12 = 3 km/h.",
      },
    ],
    timedQuiz: { timeLimitSeconds: 300, mcqIds: ["q1", "q6", "q9", "q11", "q14"] },
    problemIds: [],
    xpReward: 50, coinReward: 20,
    status: "published",
  },

  // ------------------------------------------------------------------
  // Day 12 - Saturday 15 Aug 2026 - Trains
  // ------------------------------------------------------------------
  {
    date: "2026-08-15", dow: "sat", weekId: "2026-08-10", type: "lesson",
    title: "Day 12: Trains",
    difficulty: "Medium",
    estimatedMinutes: 18,
    concept: `## Standing On The Platform

::: story
You are standing on a platform, right at the edge, as a train comes through without stopping. The train is **150 m long** and moving at **54 km/h**.

From the instant the engine reaches you to the instant the last coach leaves you - how long?

Convert first: 54 x 5/18 = **15 m/s**. Now ask what distance actually has to be covered. Not zero, even though you are not moving. The train has to move its **own entire length** past your one fixed point:

  time = 150 / 15 = 10 seconds

Now step back and watch it cross the whole **200 m platform** instead, from engine-reaches-the-near-end to last-coach-leaves-the-far-end:

  distance = 150 + 200 = 350 m
  time     = 350 / 15  = 23.33 seconds

The train's length did not vanish just because a platform showed up. It got **added** to it. That is the one idea in this lesson, and the rest is bookkeeping.
:::

## What Distance Does A Train Actually Cover?

A train has not "crossed" something until its **last coach is clear** of it. So the distance is always the length of the train plus the length of the thing it is crossing - and a pole, a person or a signal post has **no length**.

::: cards The distance to use, by what is being crossed
A pole, post, tree or standing man :: The train's own length only. A point has zero length, so 150 m at 15 m/s takes 10 s.
A platform, bridge or tunnel :: Train length PLUS platform length. 150 m over a 200 m platform is 350 m of travel.
A walking or running person :: The train's own length only, but use the **relative** speed, since the person is moving too.
Another train :: The SUM of both train lengths, at the relative speed of the two.
:::

Read the third and fourth rows together. A person has no length, so only the train's length counts - but the person's motion still changes the speed. A second train has both a length *and* a speed, so both get combined.

::: flow The three steps, in this order every time
Convert every speed to metres per second :: multiply each km/h figure by 5 over 18
Add up the lengths that must clear each other :: zero for a pole or a person, the platform length for a platform, the other train's length for a train
Divide that total distance by the relevant speed :: use the train's own speed for a fixed object, the relative speed when the other thing is moving
:::

## Two Trains, Two Very Different Answers

Train P is **150 m** long at **54 km/h**. Train Q is **200 m** long at **36 km/h**. They are on parallel tracks. In both cases the distance to cover is 150 + 200 = **350 m** - only the speed changes.

**Opposite directions.** Relative speed is the sum: 54 + 36 = 90 km/h = 25 m/s.

  time = 350 / 25 = 14 seconds

**Same direction.** Relative speed is the difference: 54 - 36 = 18 km/h = 5 m/s.

  time = 350 / 5 = 70 seconds

Fourteen seconds versus seventy. Same trains, same lengths, a **five-fold** difference purely from the direction - which is why every trains question tells you the direction, and why skimming past that word is expensive.

The person-on-the-track version behaves the same way. A 120 m train at 45 km/h passing a man walking at 9 km/h takes 120/10 = **12 seconds** if the man walks the same way (relative 36 km/h = 10 m/s), but only 120/15 = **8 seconds** if he walks towards it (relative 54 km/h = 15 m/s).

## Working Backwards To A Length

Most exam questions hide the train's length or speed and give you two crossing times instead. Two facts, two unknowns.

A train crosses a pole in **8 seconds** and a 264 m platform in **20 seconds**. Find its length and speed.

  pole:      L        = 8v          the pole contributes nothing
  platform:  L + 264  = 20v
  subtract:  264      = 12v   so   v = 22 m/s
  then       L        = 8 x 22 = 176 m

Check it: 176/22 = 8 seconds for the pole, and (176 + 264)/22 = 440/22 = 20 seconds for the platform. Both match.

The subtraction step is the whole method: the *extra* time is spent covering only the *extra* distance, so the train's own length cancels out and the speed drops into your lap.

::: mistake
Forgetting the train's own length when it crosses a platform. A 200 m train crossing a 300 m platform in 25 seconds has covered **500 m**, so its speed is 20 m/s = 72 km/h. Using only the 300 m gives 12 m/s = 43.2 km/h, and that figure is offered as an option on essentially every paper that asks this.

The mirror image is adding a length that does not exist. A **pole, a signal post or a standing man has zero length**, so a train crossing one covers exactly its own length and nothing more. There is no second number to add.

Third, and it is a pure reading error: using the sum of the speeds for two trains going the **same** way. Same direction means subtract. Opposite means add. Our two trains take 14 seconds one way and 70 the other, so getting this backwards is not a small error.
:::

::: remember
One line covers every case in this chapter:

**Pole means own length. Platform means own length plus platform. Train means both lengths.**

And for the speed to divide by: **same direction subtract, opposite direction add** - a fixed pole or platform is just the special case where the other speed is zero, so you divide by the train's own speed.

Keep the anchor from yesterday within reach, because trains questions are built on it: **18 km/h = 5 m/s**, so 36 is 10, 54 is 15, 72 is 20 and 90 is 25 m/s. Notice how often exam speeds are multiples of 18 - that is not a coincidence, it is the setter keeping the arithmetic clean.
:::

::: checkpoint
A train 120 m long crosses a pole in 6 seconds. How long will the same train take to cross a platform 180 m long?
- ( ) 9 seconds
- ( ) 12 seconds
- (x) 15 seconds
- ( ) 18 seconds
> Crossing a pole means covering only the train's own length, so the speed is 120/6 = **20 m/s**. Crossing the platform means covering 120 + 180 = 300 m, which takes 300/20 = **15 seconds**. The trap answer 9 uses only the 180 m of platform and forgets that the train's 120 m still has to clear the far end. The answer 18 comes from scaling the 6 seconds by 180/120 = 1.5 and then adding the original 6, double-counting the train's length.
:::

::: revision
A train has crossed something only when its **last coach is clear**, so the distance is the train's length plus the length of the object: a **pole, post or standing man has zero length** (own length only), a **platform, bridge or tunnel** contributes its own length, and **another train** contributes its full length. The speed to divide by is the **relative** speed whenever the other thing moves: **add** for opposite directions, **subtract** for the same direction. Trains of 150 m and 200 m at 54 and 36 km/h cover 350 m either way, but that takes 14 seconds head-on (90 km/h = 25 m/s) and 70 seconds in convoy (18 km/h = 5 m/s). Always convert first with **5/18**, remembering that 36, 54, 72 and 90 km/h are 10, 15, 20 and 25 m/s. When two crossing times are given, subtract the equations so the train's length cancels: a pole in 8 s and a 264 m platform in 20 s gives 264 = 12v, hence v = 22 m/s and length 176 m. The single most expensive error in this topic is dropping the train's own length on a platform question - 200 m of train over a 300 m platform is 500 m of travel, not 300.
:::`,
    mcqs: [
      {
        id: "q1",
        text: "A train 150 m long is running at 54 km/h. How long does it take to cross a pole?",
        options: ["10 seconds", "15 seconds", "20 seconds", "25 seconds"],
        correctIndex: 0,
        explanation: "First convert: 54 x 5/18 = 15 m/s. A pole has no length, so the train covers only its own 150 m: 150/15 = 10 seconds.",
      },
      {
        id: "q2",
        text: "A train 240 m long crosses a signal post in 12 seconds. What is its speed in km/h?",
        options: ["60", "66", "72", "80"],
        correctIndex: 2,
        explanation: "Crossing a post means covering the train's own length, so the speed is 240/12 = 20 m/s. Converting, 20 x 18/5 = 72 km/h.",
      },
      {
        id: "q3",
        text: "A train 150 m long running at 15 m/s crosses a platform 200 m long. How long does it take?",
        options: ["10 seconds", "13.33 seconds", "20 seconds", "23.33 seconds"],
        correctIndex: 3,
        explanation: "The distance is train plus platform = 150 + 200 = 350 m, so the time is 350/15 = 23.33 seconds. Using only the 200 m platform gives 13.33 seconds, and using only the train's length gives 10.",
      },
      {
        id: "q4",
        text: "A train 200 m long crosses a platform 300 m long in 25 seconds. What is its speed in km/h?",
        options: ["60", "72", "80", "43.2"],
        correctIndex: 1,
        explanation: "The train covers 200 + 300 = 500 m in 25 seconds, so its speed is 20 m/s = 72 km/h. Forgetting the train's own length gives 300/25 = 12 m/s = 43.2 km/h, the standard trap.",
      },
      {
        id: "q5",
        text: "A train crosses a pole in 8 seconds and a 264 m long platform in 20 seconds. What is the length of the train?",
        options: ["132 m", "176 m", "220 m", "264 m"],
        correctIndex: 1,
        explanation: "Let the length be L and the speed v. Then L = 8v and L + 264 = 20v. Subtracting, 264 = 12v so v = 22 m/s, and L = 8 x 22 = 176 m. Check: (176 + 264)/22 = 20 seconds.",
      },
      {
        id: "q6",
        text: "Two trains of lengths 150 m and 200 m run on parallel tracks in opposite directions at 54 km/h and 36 km/h. How long do they take to cross each other?",
        options: ["14 seconds", "20 seconds", "35 seconds", "70 seconds"],
        correctIndex: 0,
        explanation: "Opposite directions means the speeds add: 54 + 36 = 90 km/h = 25 m/s. Both lengths must clear each other, so the distance is 150 + 200 = 350 m and the time is 350/25 = 14 seconds.",
      },
      {
        id: "q7",
        text: "The same two trains, 150 m and 200 m long at 54 km/h and 36 km/h, now run in the same direction. How long does the faster take to cross the slower?",
        options: ["14 seconds", "35 seconds", "70 seconds", "140 seconds"],
        correctIndex: 2,
        explanation: "Same direction means the speeds subtract: 54 - 36 = 18 km/h = 5 m/s. The distance is still 150 + 200 = 350 m, so the time is 350/5 = 70 seconds - five times longer than the head-on case.",
      },
      {
        id: "q8",
        text: "A train 120 m long running at 45 km/h crosses a man walking in the same direction at 9 km/h. How long does it take?",
        options: ["8 seconds", "9.6 seconds", "12 seconds", "15 seconds"],
        correctIndex: 2,
        explanation: "Same direction, so the relative speed is 45 - 9 = 36 km/h = 10 m/s. A man has no length, so only the train's 120 m matters: 120/10 = 12 seconds. Adding the speeds instead gives the 8 seconds that belongs to the opposite-direction case.",
      },
      {
        id: "q9",
        text: "The same 120 m train at 45 km/h now crosses a man walking at 9 km/h in the opposite direction. How long does it take?",
        options: ["8 seconds", "9.6 seconds", "12 seconds", "15 seconds"],
        correctIndex: 0,
        explanation: "Opposite directions, so the relative speed is 45 + 9 = 54 km/h = 15 m/s. The distance is the train's own 120 m, so the time is 120/15 = 8 seconds. The 9.6 seconds option ignores the man's motion altogether (45 km/h = 12.5 m/s).",
      },
      {
        id: "q10",
        text: "A train 300 m long crosses a bridge in 45 seconds while travelling at 36 km/h. What is the length of the bridge?",
        options: ["100 m", "150 m", "200 m", "450 m"],
        correctIndex: 1,
        explanation: "At 36 km/h = 10 m/s, the train covers 10 x 45 = 450 m in total. Subtracting its own 300 m leaves a bridge length of 150 m. Reporting 450 forgets to remove the train's length.",
      },
      {
        id: "q11",
        text: "Two trains, each 120 m long, moving in opposite directions cross each other in 12 seconds. If one train is twice as fast as the other, what is the speed of the faster train?",
        options: ["24 km/h", "36 km/h", "48 km/h", "60 km/h"],
        correctIndex: 2,
        explanation: "They cover 120 + 120 = 240 m in 12 seconds, so the relative speed is 20 m/s. Since it is the sum, v + 2v = 3v = 20, giving v = 6.67 m/s and the faster train 13.33 m/s = 48 km/h. The slower train's 24 km/h is the trap option.",
      },
      {
        id: "q12",
        text: "Two trains 137 m and 163 m long run towards each other on parallel tracks at 42 km/h and 48 km/h. How long do they take to cross each other completely?",
        options: ["10 seconds", "12 seconds", "15 seconds", "20 seconds"],
        correctIndex: 1,
        explanation: "Towards each other, the relative speed is 42 + 48 = 90 km/h = 25 m/s. The combined length is 137 + 163 = 300 m, so the time is 300/25 = 12 seconds.",
      },
      {
        id: "q13",
        text: "A train travelling at 48 km/h completely crosses another train of half its length coming in the opposite direction at 42 km/h in 12 seconds. It then passes a railway platform in 45 seconds. What is the length of the platform?",
        options: ["200 m", "300 m", "400 m", "600 m"],
        correctIndex: 2,
        explanation: "Relative speed is 48 + 42 = 90 km/h = 25 m/s, so the combined length is 25 x 12 = 300 m. With the second train half the first, 1.5L = 300 gives L = 200 m. The train's own speed is 48 km/h = 13.33 m/s, so in 45 seconds it covers 600 m, and the platform is 600 - 200 = 400 m.",
      },
      {
        id: "q14",
        text: "A train 200 m long is running at 72 km/h. How long will it take to cross a tunnel 1 km long?",
        options: ["50 seconds", "55 seconds", "60 seconds", "70 seconds"],
        correctIndex: 2,
        explanation: "Convert: 72 x 5/18 = 20 m/s. The distance is 200 + 1000 = 1200 m, so the time is 1200/20 = 60 seconds. Using only the 1 km tunnel gives 50 seconds.",
      },
      {
        id: "q15",
        text: "Two trains start at the same time from stations A and B and travel towards each other at 20 km/h and 25 km/h. When they meet, one has travelled 30 km more than the other. What is the distance between A and B?",
        options: ["180 km", "225 km", "270 km", "300 km"],
        correctIndex: 2,
        explanation: "In time t the faster train covers 25t and the slower 20t, so 25t - 20t = 5t = 30 and t = 6 hours. Together they cover the whole distance: (20 + 25) x 6 = 270 km. Check: 150 km and 120 km, which differ by exactly 30.",
      },
    ],
    timedQuiz: { timeLimitSeconds: 300, mcqIds: ["q5", "q7", "q9", "q11", "q13"] },
    problemIds: [],
    xpReward: 50, coinReward: 20,
    status: "published",
  },

];

export default WEEK2_DAYS;
