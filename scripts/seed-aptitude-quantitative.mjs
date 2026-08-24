import admin from "firebase-admin";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(join(__dirname, "service-account.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// Aptitude Quantitative topics - the new lesson-content layer (concept/
// keyPoints/mcqs/etc, matching Programming/CS Core's schema exactly - see
// AptitudeTopicsPanel in app/admin/page.jsx) plus, for brand-new topics, the
// existing practice-question subcollection (same shape AptitudePanel's own
// question form writes). "Percentages" already exists in production with 5
// real questions - it gets ONLY the lesson-content layer added on top here,
// its existing questions are left completely untouched.

function q(question, options, correctIndex, difficulty, explanation, tags) {
  return { question, options, correctIndex, difficulty, marks: 1, explanation, tags: tags || [], attemptCount: 0, correctCount: 0, totalTimeSec: 0, estimatedTimeSec: 60, companies: [], examTags: [] };
}

const TOPICS = [
  {
    name: "Percentages", isNew: false,
    lesson: {
      difficulty: "Beginner", estimatedMinutes: 20,
      whatYoullLearn: ["What a percentage genuinely represents (a fraction out of 100, nothing more mysterious)", "How to convert fluently between percentages, fractions, and decimals", "Why successive percentage changes don't simply add together"],
      concept: "A PERCENTAGE is genuinely just a fraction with a denominator fixed at 100 - \"25%\" literally means 25/100, or equivalently 0.25 - every percentage problem, however it's dressed up, ultimately reduces to this one simple fact, which is precisely why fluently converting between percentage/fraction/decimal forms is the single highest-leverage skill in this entire topic.\n\nThe genuinely common trap this topic tests directly: SUCCESSIVE percentage changes do NOT simply add together. A price that increases by 10% and then DECREASES by 10% does NOT return to its original value - it ends up LOWER, since the second 10% decrease is calculated on the already-increased (larger) amount, not the original. Concretely: Rs. 100 increased by 10% becomes Rs. 110; decreased by 10% from Rs. 110 gives Rs. 99, not Rs. 100 - a genuinely important, frequently-tested realization.\n\nA genuinely useful shortcut for successive percentage changes: for two successive changes of a% and b%, the NET percentage change is `a + b + (ab/100)` - using the ORIGINAL Rs. 100/+10%/-10% example: `10 + (-10) + (10 x -10)/100 = 0 - 1 = -1%`, correctly matching the genuine 1% net decrease computed the long way above.",
      keyPoints: ["A percentage is simply a fraction out of 100 - fluent conversion between percentage/fraction/decimal forms underlies every problem in this topic", "Successive percentage changes don't cancel out even if they look like they should (+10% then -10% is a net decrease, not zero change), since the second change applies to the new, already-changed amount", "Net successive percentage change formula: a + b + (ab/100) - correctly captures this compounding effect in one step"],
      commonMistakes: ["Assuming a +x% change followed by a -x% change returns to the exact original value - it never does (except when x=0), since the second change is computed on a different base amount", "Converting a percentage to a decimal incorrectly (25% = 0.25, not 2.5 or 25) under time pressure"],
      interviewTips: ["Be ready to compute a successive percentage change using the a + b + ab/100 shortcut instantly - this exact pattern (price increase then discount, population growth then decline) appears constantly in placement tests"],
      realWorldApplications: ["Discount pricing, tax calculations, and interest rates are all genuinely percentage-based, making this the single most universally applicable topic in the entire quantitative aptitude curriculum"],
      mcqs: [
        { question: "A price increases by 20% and is then discounted by 20%. What is the net percentage change?", options: ["No change", "4% decrease", "4% increase", "40% decrease"], correctIndex: 1 },
        { question: "What is 0.075 expressed as a percentage?", options: ["0.75%", "7.5%", "75%", "750%"], correctIndex: 1 },
      ],
      goingDeeper: "For successive percentage changes across MORE than two steps (three or more consecutive changes), the same compounding logic extends multiplicatively: convert each change to a multiplying factor (a +10% increase is x1.10, a -5% decrease is x0.95) and multiply all factors together, then convert the final combined factor back to a net percentage change - this generalizes the two-step a+b+ab/100 shortcut to any number of successive changes.",
      assignment: "A shop increases prices by 25% for a sale announcement, then offers a 20% \"sale discount\" off that increased price. Compute the net percentage change from the ORIGINAL price, and explain why this is a common, genuinely deceptive pricing tactic.",
      xpReward: 15, coinReward: 5,
    },
    questions: [],
  },
  {
    name: "Profit & Loss", isNew: true,
    lesson: {
      difficulty: "Beginner", estimatedMinutes: 20,
      whatYoullLearn: ["The precise relationship between cost price, selling price, and profit/loss percentage", "How marked price and discount interact with actual profit", "Why profit/loss percentage is always calculated on cost price, never selling price"],
      concept: "PROFIT and LOSS problems are genuinely just percentage problems wearing business vocabulary: PROFIT = Selling Price (SP) - Cost Price (CP), and profit PERCENTAGE is always `(Profit / CP) x 100` - critically, always relative to COST PRICE, never selling price, a genuinely common and consequential point of confusion.\n\nMARKED PRICE (MP) is the price initially LISTED (often deliberately inflated above what the seller actually expects to receive), and DISCOUNT is calculated as a percentage OFF the marked price, not the cost price: `SP = MP x (1 - discount%)`. This is precisely why a shop can advertise a large \"discount\" off an inflated marked price while STILL making a genuine, healthy profit relative to their actual cost price - the discount percentage and the profit percentage are computed relative to two completely DIFFERENT base amounts (marked price versus cost price respectively), and conflating them is a frequent, costly mistake.\n\nA genuinely useful direct formula worth memorizing: `SP = CP x (1 + profit%/100)` for a profit, or `SP = CP x (1 - loss%/100)` for a loss - this lets you compute SP directly from CP and a target profit/loss percentage without working through the definition from scratch each time.",
      keyPoints: ["Profit/loss percentage is always calculated relative to Cost Price (CP), never Selling Price (SP) - a critical, frequently-tested distinction", "Marked Price (MP) is the listed price before discount; discount is calculated as a percentage OFF the marked price, not the cost price", "SP = CP x (1 + profit%/100) for a profit, or CP x (1 - loss%/100) for a loss - a direct formula avoiding re-deriving from scratch each time"],
      commonMistakes: ["Calculating profit percentage relative to selling price instead of cost price - this produces a genuinely different, incorrect number", "Assuming the discount percentage directly equals the profit percentage, missing that discount is off marked price while profit is relative to cost price - two different base amounts entirely"],
      interviewTips: ["Be ready to solve a two-step problem combining a marked-price discount with a resulting profit/loss percentage - this exact combination is one of the most commonly tested patterns in this topic"],
      realWorldApplications: ["Retail pricing strategy, negotiating purchase/sale prices, and understanding advertised \"discount\" claims all directly rely on correctly distinguishing marked price, cost price, and selling price"],
      mcqs: [
        { question: "A shopkeeper marks an item 50% above cost price, then offers a 20% discount. What is his actual profit percentage?", options: ["20%", "25%", "30%", "50%"], correctIndex: 1 },
        { question: "Profit percentage is always calculated relative to which value?", options: ["Selling Price", "Cost Price", "Marked Price", "Discount amount"], correctIndex: 1 },
      ],
      goingDeeper: "FALSE WEIGHT problems are a genuinely related variant worth knowing: a dishonest seller using a weight lighter than claimed (e.g., a \"1 kg\" weight that's actually only 900g) creates a profit percentage computable directly from the weight discrepancy: `profit% = (true weight - false weight) / false weight x 100` when selling at the marked (correct) price per genuine kg - a specific application of the exact same profit-percentage logic to a quantity-based deception instead of a price-based one.",
      assignment: "A trader marks goods 40% above cost price and allows a discount of 10%. Compute his profit percentage, showing the intermediate marked price and selling price for an assumed cost price of Rs. 100.",
      xpReward: 15, coinReward: 5,
    },
    questions: [
      q("A man buys an article for Rs. 600 and sells it for Rs. 750. What is his profit percentage?", ["20%", "25%", "30%", "15%"], 1, "Easy", "Profit = 150; profit% = (150/600) x 100 = 25%.", ["Profit & Loss"]),
      q("An item is sold at a loss of 15% for Rs. 850. What was the cost price?", ["Rs. 1000", "Rs. 977.5", "Rs. 1050", "Rs. 900"], 0, "Medium", "CP = SP / (1 - loss%) = 850 / 0.85 = 1000.", ["Profit & Loss"]),
      q("A shopkeeper marks an item 25% above cost price and gives a 12% discount. What is his profit percentage?", ["10%", "11%", "12%", "13%"], 0, "Medium", "SP = CP x 1.25 x 0.88 = CP x 1.10, a net 10% profit.", ["Profit & Loss", "Marked Price"]),
      q("If the cost price of 15 articles equals the selling price of 12 articles, what is the profit percentage?", ["20%", "25%", "15%", "30%"], 1, "Medium", "CP of 1 article corresponds to SP of 12/15 = 0.8 units of CP-per-article-basis; profit% = (15-12)/12 x 100 = 25%.", ["Profit & Loss"]),
      q("A man sells two items at Rs. 995 each. On one he gains 25%, on the other he loses 25%. What is his net result?", ["No profit no loss", "A net loss", "A net profit", "Cannot be determined"], 1, "Hard", "Selling two items at the same price with equal +/-x% profit/loss always results in a net LOSS (a classic aptitude result, since the CPs are unequal).", ["Profit & Loss"]),
      q("What is the selling price of an article bought for Rs. 480, to gain a profit of 20%?", ["Rs. 560", "Rs. 576", "Rs. 600", "Rs. 620"], 1, "Easy", "SP = CP x 1.20 = 480 x 1.20 = 576.", ["Profit & Loss"]),
      q("A trader allows a discount of 10% on the marked price and still makes a profit of 8%. If the cost price is Rs. 500, what is the marked price?", ["Rs. 580", "Rs. 600", "Rs. 540", "Rs. 620"], 1, "Medium", "SP = CP x 1.08 = 540; MP x 0.90 = 540, so MP = 540/0.9 = 600.", ["Profit & Loss", "Marked Price"]),
      q("Buying an item at Rs. 350 and selling it at Rs. 315 results in what?", ["10% profit", "10% loss", "12% loss", "5% loss"], 1, "Easy", "Loss = 35; loss% = 35/350 x 100 = 10%.", ["Profit & Loss"]),
    ],
  },
  {
    name: "Simple & Compound Interest", isNew: true,
    lesson: {
      difficulty: "Intermediate", estimatedMinutes: 25,
      whatYoullLearn: ["The precise formulas for simple and compound interest and why they diverge over time", "How to compute compound interest for non-annual compounding periods", "A fast shortcut for comparing SI and CI over exactly 2 years"],
      concept: "SIMPLE INTEREST (SI) is calculated ONLY on the original principal, every single period, never on previously-earned interest: `SI = (P x R x T) / 100`, where P is principal, R is the annual rate percentage, T is time in years - the interest earned is IDENTICAL every year, growing linearly.\n\nCOMPOUND INTEREST (CI) instead calculates interest on the ACCUMULATED amount (principal PLUS all previously-earned interest) each period - this is precisely why CI grows FASTER than SI over time (interest genuinely earns interest on itself, \"compounding\"): `Amount = P x (1 + R/100)^T`, and `CI = Amount - P`. For exactly ONE year with ANNUAL compounding, SI and CI are genuinely IDENTICAL (there's been no prior interest yet to compound on) - they only diverge starting from year 2 onward.\n\nA genuinely useful, frequently-tested shortcut specifically for the DIFFERENCE between CI and SI over exactly 2 years: `CI - SI = P x (R/100)^2` - this comes directly from expanding `(1+R/100)^2` and subtracting the linear 2-year SI term, leaving exactly this one squared term as the entire difference - genuinely useful for quickly solving \"the difference between CI and SI over 2 years is Rs. X, find P or R\" problems without computing full amounts.\n\nNON-ANNUAL COMPOUNDING (semi-annual, quarterly) requires adjusting BOTH the rate and the time period consistently: for semi-annual compounding, use HALF the annual rate and DOUBLE the number of periods (`Amount = P x (1 + (R/2)/100)^(2T)`) - the same adjustment logic applies symmetrically for quarterly (divide rate by 4, multiply periods by 4).",
      keyPoints: ["Simple Interest is calculated only on the original principal each period (linear growth); Compound Interest is calculated on principal plus all previously-earned interest (faster, compounding growth)", "SI and CI are identical for exactly 1 year of annual compounding - they only diverge from year 2 onward", "For exactly 2 years: CI - SI = P x (R/100)^2 - a fast shortcut avoiding full amount computation for this specific, commonly-tested case"],
      commonMistakes: ["Forgetting to adjust BOTH the rate and the number of periods together for non-annual compounding (halving only the rate but not doubling the periods for semi-annual compounding, for instance)", "Assuming SI and CI differ even in the very first year, missing that they're identical for exactly one year of annual compounding"],
      interviewTips: ["Memorize the CI-SI = P(R/100)^2 shortcut for exactly 2 years cold - it's one of the single most time-saving formulas in this entire topic when it applies"],
      realWorldApplications: ["Bank fixed deposits, loan EMIs, and investment growth calculations are all genuinely compound-interest-based in the real world - simple interest is comparatively rare outside of short-term or specifically-structured loans"],
      mcqs: [
        { question: "What is the key structural difference between SI and CI?", options: ["SI is always larger than CI", "SI is calculated only on the original principal each period; CI is calculated on principal plus previously-earned interest", "CI only applies to loans, SI only to deposits", "There is no real difference between them"], correctIndex: 1 },
        { question: "For exactly how many years of ANNUAL compounding are SI and CI identical?", options: ["They are never identical", "Exactly 1 year", "Exactly 2 years", "They are always identical"], correctIndex: 1 },
      ],
      goingDeeper: "CONTINUOUS COMPOUNDING (the theoretical limit as the compounding frequency approaches infinity) uses the formula `Amount = P x e^(RT/100)` where e is Euler's number (~2.71828) - genuinely more of a finance-theory/calculus topic than a typical placement-aptitude one, but worth knowing exists as the mathematical limit that quarterly/monthly/daily compounding all approach as the compounding periods get shorter and more frequent.",
      assignment: "Compute the compound interest on Rs. 8,000 for 2 years at 10% per annum, compounded annually. Then compute the simple interest for the same principal, rate, and time, and verify the difference matches the P(R/100)^2 shortcut.",
      xpReward: 20, coinReward: 8,
    },
    questions: [
      q("What is the simple interest on Rs. 5,000 at 8% per annum for 3 years?", ["Rs. 1000", "Rs. 1200", "Rs. 1100", "Rs. 1400"], 1, "Easy", "SI = (5000 x 8 x 3)/100 = 1200.", ["Simple Interest"]),
      q("What is the compound interest on Rs. 10,000 for 2 years at 10% per annum, compounded annually?", ["Rs. 2000", "Rs. 2100", "Rs. 2200", "Rs. 1900"], 1, "Medium", "Amount = 10000 x 1.1^2 = 12100; CI = 2100.", ["Compound Interest"]),
      q("The difference between CI and SI on a sum for 2 years at 10% per annum is Rs. 150. What is the principal?", ["Rs. 15,000", "Rs. 12,000", "Rs. 10,000", "Rs. 18,000"], 0, "Medium", "CI - SI = P(R/100)^2 = P x 0.01 = 150, so P = 15000.", ["Compound Interest", "Simple Interest"]),
      q("A sum doubles itself in 8 years at simple interest. What is the rate of interest per annum?", ["10%", "12.5%", "15%", "20%"], 1, "Medium", "Amount = 2P means SI = P; rate = (P x 100)/(P x 8) = 12.5%.", ["Simple Interest"]),
      q("What is the amount on Rs. 4,000 at 10% per annum for 1.5 years, compounded semi-annually?", ["Rs. 4630.50", "Rs. 4641.00", "Rs. 4630.00", "Rs. 4600.00"], 0, "Hard", "Semi-annual: rate 5% per period, 3 periods. Amount = 4000 x 1.05^3 = 4630.50.", ["Compound Interest", "Semi-Annual"]),
      q("At what rate percent per annum will Rs. 2,000 amount to Rs. 2,420 in 2 years at compound interest?", ["8%", "10%", "12%", "9%"], 1, "Medium", "2420/2000 = 1.21 = 1.1^2, so rate = 10%.", ["Compound Interest"]),
      q("What is the simple interest rate at which a sum becomes 3 times itself in 10 years?", ["15%", "20%", "25%", "30%"], 1, "Medium", "Amount = 3P means SI earned = 2P; rate = (2P x 100)/(P x 10) = 20%.", ["Simple Interest"]),
    ],
  },
  {
    name: "Ratio & Proportion", isNew: true,
    lesson: {
      difficulty: "Beginner", estimatedMinutes: 20,
      whatYoullLearn: ["What a ratio genuinely represents and why it must always be simplified before comparing", "How to solve proportion problems using cross-multiplication", "How to divide a total quantity according to a given ratio"],
      concept: "A RATIO compares two (or more) quantities of the SAME kind - `a:b` genuinely means \"for every a units of the first quantity, there are b units of the second\" - a ratio is fundamentally about RELATIVE proportion, not absolute size, which is precisely why `4:6` and `2:3` represent the exact SAME relationship (simplified to lowest terms) despite looking like different numbers.\n\nA PROPORTION is a statement that TWO ratios are EQUAL: `a:b :: c:d` (read \"a is to b as c is to d\") - solved via CROSS-MULTIPLICATION: `a x d = b x c`. This single technique underlies the vast majority of proportion word problems (\"if 5 workers do a job in 12 days, how many workers for 8 days\" - though this specific example is actually INVERSE proportion, covered below, not direct).\n\nDIRECT versus INVERSE proportion is a genuinely important distinction: two quantities are in DIRECT proportion when they increase/decrease TOGETHER (more workers doing the SAME work in parallel finishes faster - wait, that's actually inverse; more distance traveled at a constant speed takes proportionally more time - that IS direct). Two quantities are in INVERSE proportion when one increases as the OTHER decreases (more workers on a fixed job means FEWER days needed) - correctly identifying which type applies to a given word problem is precisely the genuinely important first step, since applying the wrong proportion type produces a confidently-wrong answer.\n\nDIVIDING a total quantity according to a given ratio: to split Rs. 600 in the ratio 2:3:5, first sum the ratio parts (2+3+5=10), then each part is worth `600/10 = 60`, so the three shares are `2x60=120`, `3x60=180`, `5x60=300` - this exact \"sum the parts, find the value of one part, multiply back\" technique is the standard, reliable method for every ratio-division problem.",
      keyPoints: ["A ratio compares relative proportion, not absolute size - always simplify to lowest terms before comparing two ratios", "A proportion states two ratios are equal, solved via cross-multiplication (a x d = b x c)", "To divide a total by a given ratio: sum the ratio's parts, divide the total by that sum to find one part's value, then multiply back for each share"],
      commonMistakes: ["Confusing direct and inverse proportion in a word problem - applying direct-proportion logic to a genuinely inverse relationship (like workers-versus-days) produces a confidently wrong answer", "Forgetting to simplify a ratio to lowest terms before comparing it against another ratio"],
      interviewTips: ["Be ready to correctly identify direct versus inverse proportion in an unfamiliar word problem BEFORE attempting to solve it - this identification step is where most genuine errors in this topic actually occur"],
      realWorldApplications: ["Mixing ingredients in a fixed ratio (recipes, concrete/cement mixes), splitting business profits by investment ratio, and map/scale-model proportions all directly rely on ratio and proportion reasoning"],
      mcqs: [
        { question: "Rs. 900 is divided among A, B, and C in the ratio 2:3:4. What is C's share?", options: ["Rs. 200", "Rs. 300", "Rs. 400", "Rs. 450"], correctIndex: 2 },
        { question: "If 6 workers can build a wall in 10 days, how many workers are needed to build it in 4 days (assuming inverse proportion)?", options: ["10", "12", "15", "20"], correctIndex: 2 },
      ],
      goingDeeper: "COMPOUND RATIOS combine multiple ratio relationships into one - if A:B = 2:3 and B:C = 4:5, finding A:C requires making B's value CONSISTENT across both ratios first (multiply A:B by 4 and B:C by 3, giving A:B=8:12 and B:C=12:15, so A:C = 8:15) - a genuinely useful technique whenever a problem chains together more than two related ratios through a shared middle quantity.",
      assignment: "Rs. 1,540 is divided among three people in the ratio 3:4:7. Compute each person's exact share, showing the sum-the-parts method step by step.",
      xpReward: 15, coinReward: 5,
    },
    questions: [
      q("Simplify the ratio 18:24 to its lowest terms.", ["9:12", "6:8", "3:4", "2:3"], 2, "Easy", "Dividing both terms by their GCD (6) gives 3:4.", ["Ratio & Proportion"]),
      q("If a:b = 3:5 and b:c = 5:7, what is a:c?", ["3:5", "5:7", "3:7", "15:35"], 2, "Medium", "Since b is already consistent (5) in both ratios, a:c = 3:7 directly.", ["Ratio & Proportion", "Compound Ratio"]),
      q("Divide Rs. 720 among A, B, and C in the ratio 2:3:4.", ["A=160, B=240, C=320", "A=120, B=240, C=360", "A=180, B=240, C=300", "A=200, B=220, C=300"], 0, "Easy", "Total parts = 9; one part = 80; shares = 160, 240, 320.", ["Ratio & Proportion"]),
      q("The ratio of two numbers is 5:7. If their sum is 144, what is the larger number?", ["60", "70", "84", "90"], 2, "Easy", "5x+7x=144, x=12; larger number = 7x = 84.", ["Ratio & Proportion"]),
      q("If 8 men can complete a task in 15 days, in how many days can 12 men complete the same task (inverse proportion)?", ["8 days", "10 days", "12 days", "20 days"], 1, "Medium", "8x15 = 12x days -> days = 120/12 = 10.", ["Ratio & Proportion", "Inverse Proportion"]),
      q("Two numbers are in the ratio 4:5. If 10 is added to each, the ratio becomes 6:7. What are the original numbers?", ["20 and 25", "16 and 20", "24 and 30", "12 and 15"], 0, "Hard", "(4x+10)/(5x+10) = 6/7 -> 28x+70=30x+60 -> 2x=10 -> x=5, so the numbers are 4x=20 and 5x=25.", ["Ratio & Proportion"]),
    ],
  },
  {
    name: "Time & Work", isNew: true,
    lesson: {
      difficulty: "Intermediate", estimatedMinutes: 20,
      whatYoullLearn: ["The core \"work as a rate\" framing that unlocks every problem in this topic", "How to combine multiple workers' rates when they work together", "How to handle a worker leaving partway through a job"],
      concept: "The single foundational idea underlying EVERY Time & Work problem: if a person completes a job in `n` days, they complete `1/n` of the job PER DAY - this \"work as a RATE\" framing (not \"work as a fixed duration\") is precisely what lets you COMBINE multiple workers' contributions by simply ADDING their individual per-day rates together.\n\nIf A completes a job in 12 days (rate = 1/12 per day) and B completes it in 18 days (rate = 1/18 per day), working TOGETHER their combined rate is `1/12 + 1/18 = 3/36 + 2/36 = 5/36` per day - meaning together they finish the ENTIRE job in `36/5 = 7.2` days (the reciprocal of the combined rate) - this add-the-rates-then-take-the-reciprocal technique is the single most important, reusable pattern in this entire topic.\n\nA WORKER LEAVING PARTWAY THROUGH a job requires tracking work COMPLETED (not just rates) explicitly: if A and B work together for some days, then A leaves and B finishes alone, compute exactly how much of the TOTAL work was completed during the together-phase (combined rate x number of days), subtract that from 1 (the whole job) to find the REMAINING fraction, then divide that remaining fraction by B's own individual rate to find how many additional days B alone needs.\n\nEFFICIENCY-based problems (\"A is twice as efficient as B\") translate DIRECTLY into a rate relationship: if A is twice as efficient as B, A's per-day rate is exactly TWICE B's per-day rate - equivalently, A takes HALF the time B would take alone to complete the identical job.",
      keyPoints: ["A worker completing a job in n days has a rate of 1/n of the job per day - this rate framing is what lets multiple workers' contributions be combined by simple addition", "Combined rate = sum of individual rates; total time together = reciprocal of the combined rate", "A worker leaving partway through requires explicitly tracking work COMPLETED (rate x time) during each phase, not just combining rates blindly across the whole problem"],
      commonMistakes: ["Trying to average two workers' TIMES directly (like averaging 12 and 18 days) instead of combining their RATES (1/12 and 1/18) - these produce genuinely different, incorrect results", "Forgetting to explicitly track work already completed when a worker leaves partway through a job, rather than treating the whole problem as one single combined-rate calculation"],
      interviewTips: ["Be ready to set up and solve a \"someone leaves partway through\" problem step by step, explicitly stating the work-completed fraction before computing the remaining worker's needed time - this exact multi-step pattern is genuinely common in placement tests"],
      realWorldApplications: ["Team-based project timeline estimation, construction/manufacturing throughput planning, and resource allocation all directly rely on this same combine-the-rates logic"],
      mcqs: [
        { question: "A can do a job in 10 days, B in 15 days. How long will they take working together?", options: ["5 days", "6 days", "8 days", "12 days"], correctIndex: 1 },
        { question: "What is the correct way to combine two workers' contributions to a shared job?", options: ["Average their individual completion times directly", "Add their individual per-day rates (1/time) together, then take the reciprocal of the sum", "Multiply their individual completion times together", "Subtract the faster worker's time from the slower one's"], correctIndex: 1 },
      ],
      goingDeeper: "PIPES AND CISTERNS problems are structurally IDENTICAL to Time & Work, just relabeled: an inlet pipe filling a tank plays the role of a \"worker\" (positive rate), while an OUTLET pipe draining the tank plays the role of a NEGATIVE rate (work being undone) - a problem with an inlet filling in 6 hours and an outlet draining in 12 hours, both open together, combines as `1/6 - 1/12 = 1/12` per hour, filling the tank in 12 hours - the exact same add-the-rates technique, just with the outlet's rate subtracted instead of added.",
      assignment: "A can complete a job in 20 days and B in 30 days. They work together for 5 days, then A leaves and B completes the rest alone. How many additional days does B need? Show the work-completed fraction explicitly at each step.",
      xpReward: 20, coinReward: 8,
    },
    questions: [
      q("A can complete a job in 12 days, B in 24 days. How long will they take working together?", ["6 days", "8 days", "9 days", "10 days"], 1, "Easy", "Combined rate = 1/12+1/24 = 3/24 = 1/8, so together they take 8 days.", ["Time & Work"]),
      q("A is twice as efficient as B. If B takes 24 days to complete a job alone, how long does A take alone?", ["8 days", "12 days", "16 days", "6 days"], 1, "Easy", "Twice as efficient means half the time: 24/2 = 12 days.", ["Time & Work", "Efficiency"]),
      q("A and B together can finish a job in 12 days. A alone can finish it in 20 days. How long would B alone take?", ["24 days", "30 days", "36 days", "40 days"], 1, "Medium", "B's rate = 1/12 - 1/20 = 5/60-3/60 = 2/60 = 1/30, so B alone takes 30 days.", ["Time & Work"]),
      q("A can do a job in 15 days and B in 10 days. They work together for 3 days, then A leaves. How many more days does B need to finish?", ["3 days", "4 days", "5 days", "6 days"], 2, "Hard", "Combined rate = 1/15+1/10 = 1/6; work done in 3 days = 3/6 = 1/2; the remaining 1/2 of the job at B's own rate of 1/10 per day needs (1/2)/(1/10) = 5 more days.", ["Time & Work"]),
      q("15 men can complete a job in 20 days. How many men are needed to complete it in 12 days?", ["20", "22", "25", "30"], 2, "Medium", "15x20 = men x 12, men = 300/12 = 25.", ["Time & Work"]),
      q("A pipe can fill a tank in 6 hours. A leak in the tank empties it in 12 hours. If both are open, how long to fill the tank?", ["8 hours", "10 hours", "12 hours", "9 hours"], 2, "Medium", "Combined rate = 1/6 - 1/12 = 1/12, so the tank fills in 12 hours.", ["Time & Work", "Pipes & Cisterns"]),
    ],
  },
  {
    name: "Time, Speed & Distance", isNew: true,
    lesson: {
      difficulty: "Intermediate", estimatedMinutes: 20,
      whatYoullLearn: ["The one core formula (Distance = Speed x Time) and its two rearrangements", "How to handle relative speed for objects moving toward or away from each other", "The specific adjustment trains-crossing problems require for their own length"],
      concept: "Every problem in this topic ultimately reduces to exactly one relationship: `Distance = Speed x Time` - rearranged as needed: `Speed = Distance/Time` or `Time = Distance/Speed`. The genuine skill tested here isn't the formula itself (trivially simple) but correctly identifying WHICH distance, speed, or time value a word problem is actually describing, especially once multiple moving objects are involved.\n\nRELATIVE SPEED handles multiple moving objects precisely: when two objects move TOWARD each other, their speeds ADD (a genuinely faster combined closing speed) - two trains approaching each other at 60 km/h and 40 km/h close the gap at a combined 100 km/h. When two objects move in the SAME direction, their relative speed is the DIFFERENCE (how much faster the leading one pulls ahead, or the trailing one catches up) - a train at 80 km/h chasing one at 50 km/h closes the gap at only 30 km/h.\n\nTRAINS CROSSING a stationary point (a pole, a person) versus crossing a PLATFORM/another train requires a genuinely important adjustment: crossing a pole, the train needs to cover a distance equal to its OWN length. Crossing a platform (or another train), it must cover its own length PLUS the platform's (or the other train's) length - forgetting to add this extra length is a classic, common error in these specific problems.\n\nUNIT CONVERSION between km/h and m/s is a small but frequently-needed step: multiply km/h by `5/18` to get m/s, or multiply m/s by `18/5` to get km/h - worth having genuinely memorized cold, since nearly every train-crossing problem's answer options are given in one unit while the natural calculation happens in the other.",
      keyPoints: ["Distance = Speed x Time is the one core relationship - the genuine skill is correctly identifying which value a word problem is actually asking about", "Relative speed adds when objects move toward each other (closing speed), and subtracts when moving in the same direction (catching-up speed)", "A train crossing a platform/another train must cover its own length PLUS the other length; crossing a stationary point (pole) only needs its own length - km/h to m/s conversion factor is 5/18"],
      commonMistakes: ["Forgetting to add the platform's/other train's length when computing a train-crossing-something-with-length problem, treating it the same as crossing a stationary pole", "Adding relative speeds when objects move in the SAME direction (should subtract) or subtracting when moving toward each other (should add) - genuinely opposite of the correct rule"],
      interviewTips: ["Have the km/h <-> m/s conversion factors (5/18 and 18/5) fully memorized and instantly available - these appear in nearly every train/speed problem and re-deriving them under time pressure wastes real time"],
      realWorldApplications: ["Relative speed reasoning directly applies to real-world scenarios like calculating overtaking distances while driving, or estimating meeting times for two people traveling toward each other"],
      mcqs: [
        { question: "Two trains move toward each other at 50 km/h and 70 km/h. What is their relative (closing) speed?", options: ["20 km/h", "60 km/h", "120 km/h", "3500 km/h"], correctIndex: 2 },
        { question: "What additional distance must a train cover when crossing a platform, compared to crossing a stationary pole?", options: ["Nothing - it's the same distance", "The platform's own length, added to the train's length", "Half the platform's length", "The train's length only, ignoring the platform entirely"], correctIndex: 1 },
      ],
      goingDeeper: "BOATS AND STREAMS problems apply this exact same relative-speed logic to water currents: a boat's DOWNSTREAM speed is its own still-water speed PLUS the current's speed (current helps); its UPSTREAM speed is its own still-water speed MINUS the current's speed (current hinders) - structurally identical to the same-direction/opposite-direction relative speed rules covered above, just relabeled for a boat-versus-current context.",
      assignment: "A train 150m long crosses a platform 250m long in 20 seconds. Compute the train's speed in km/h, showing the unit conversion step explicitly.",
      xpReward: 20, coinReward: 8,
    },
    questions: [
      q("A train 200m long crosses a platform 300m long in 25 seconds. What is the train's speed in km/h?", ["60 km/h", "64.8 km/h", "72 km/h", "80 km/h"], 2, "Medium", "Total distance 500m in 25s = 20 m/s = 20 x 18/5 = 72 km/h.", ["Time, Speed & Distance", "Trains"]),
      q("Two trains 120m and 180m long move in opposite directions at 54 km/h and 36 km/h. How long do they take to cross each other?", ["10 s", "12 s", "14 s", "15 s"], 1, "Medium", "Relative speed = 90 km/h = 25 m/s; total length 300m; time = 300/25 = 12s.", ["Time, Speed & Distance", "Trains"]),
      q("A car travels 240 km in 4 hours. What is its average speed?", ["50 km/h", "60 km/h", "70 km/h", "80 km/h"], 1, "Easy", "Speed = Distance/Time = 240/4 = 60 km/h.", ["Time, Speed & Distance"]),
      q("A boat's speed in still water is 15 km/h, and the current's speed is 3 km/h. How long does it take to travel 54 km downstream?", ["2 hours", "3 hours", "3.5 hours", "4 hours"], 1, "Easy", "Downstream speed = 15+3=18 km/h; time = 54/18 = 3 hours.", ["Time, Speed & Distance", "Boats & Streams"]),
      q("A man walking at 5 km/h reaches a point 15 minutes late. Walking at 6 km/h, he reaches 10 minutes early. What is the distance?", ["10 km", "12.5 km", "15 km", "20 km"], 1, "Hard", "Let distance=d, correct time=t. d/5-t=1/4, t-d/6=1/6. Solving: d=12.5 km.", ["Time, Speed & Distance"]),
      q("Two cars start from the same point and travel in the same direction at 40 km/h and 55 km/h. After how many hours will they be 45 km apart?", ["2 hours", "3 hours", "4 hours", "1.5 hours"], 1, "Medium", "Relative speed (same direction) = 15 km/h; time = 45/15 = 3 hours.", ["Time, Speed & Distance", "Relative Speed"]),
    ],
  },
  {
    name: "Averages", isNew: true,
    lesson: {
      difficulty: "Beginner", estimatedMinutes: 15,
      whatYoullLearn: ["The core average formula and how it behaves when one value changes", "How to find a missing value given an average and the rest of the data set", "The specific formula for the average of consecutive/evenly-spaced numbers"],
      concept: "An AVERAGE (arithmetic mean) is simply `Sum of all values / Number of values` - the genuinely useful, frequently-tested consequence worth internalizing: if the average of `n` values is `A`, the TOTAL sum is always exactly `n x A` - this reframing (average implies a known total) is precisely what unlocks most \"one value changes, find the new average\" or \"find the missing value\" problems.\n\nWhen ONE VALUE in a set changes (replaced, or a new member joins/leaves), the TOTAL sum changes by exactly that difference - a classic pattern: \"the average weight of 10 people increases by 2kg when one person weighing 60kg is replaced by a new person\" means the TOTAL increased by `10 x 2 = 20kg`, so the new person weighs `60 + 20 = 80kg` - this total-based reasoning is dramatically faster and more reliable than trying to track individual values.\n\nFor a set of CONSECUTIVE (or evenly-spaced, like all even numbers, or an arithmetic sequence) numbers specifically, the average always equals exactly the MIDDLE value (for an odd count) or the average of the two middle values (for an even count) - a genuinely useful shortcut: for 5 consecutive integers, the average is simply the 3rd (middle) one, with no summing required at all.",
      keyPoints: ["Average = Sum / Count, which means Sum = Average x Count - this total-based reframing unlocks most average word problems", "When one value in a set changes, the total sum changes by exactly that difference, times the count if the average itself shifts - track the total, not individual values", "For consecutive/evenly-spaced numbers, the average always equals the middle value (odd count) or the average of the two middle values (even count) - no summing needed"],
      commonMistakes: ["Trying to solve a \"someone is replaced\" average problem by tracking individual values instead of reasoning about the total sum's change directly", "Forgetting that Sum = Average x Count, and instead trying to guess at individual values to satisfy a stated average"],
      interviewTips: ["Be ready to solve a \"the average changes by X when one value is replaced\" problem purely through total-sum reasoning (total change = count x average change) rather than algebra with unknowns"],
      realWorldApplications: ["Computing class average marks, average monthly expenses, and sports statistics (batting/bowling averages) are all direct, everyday applications of this exact reasoning"],
      mcqs: [
        { question: "The average of 5 numbers is 20. What is their total sum?", options: ["25", "100", "4", "20"], correctIndex: 1 },
        { question: "What is the average of 5 consecutive integers starting from 10?", options: ["10", "11", "12", "13"], correctIndex: 2 },
      ],
      goingDeeper: "WEIGHTED AVERAGES generalize this idea when different values contribute unequally to the total - the average is `(sum of value x weight) / (sum of weights)`, not a simple unweighted average - genuinely necessary whenever a problem mixes groups of unequal size (e.g., \"the average marks of 30 boys is 60 and 20 girls is 50 - find the combined average\") since simply averaging 60 and 50 (getting 55) would incorrectly ignore that there are more boys than girls.",
      assignment: "The average weight of 8 people increases by 2.5kg when a new person replaces one weighing 65kg. Compute the new person's weight, using total-sum reasoning explicitly.",
      xpReward: 15, coinReward: 5,
    },
    questions: [
      q("The average of 5 consecutive even numbers is 24. What is the largest number?", ["26", "28", "30", "32"], 1, "Medium", "For 5 evenly-spaced numbers, average = middle value = 24; largest = 24+4 = 28.", ["Averages"]),
      q("The average weight of 8 people increases by 2.5 kg when a new person replaces one weighing 65 kg. What is the new person's weight?", ["75 kg", "80 kg", "85 kg", "90 kg"], 2, "Medium", "Total increases by 8x2.5=20kg, so new person weighs 65+20=85kg.", ["Averages"]),
      q("What is the average of the first 10 natural numbers?", ["5", "5.5", "6", "10"], 1, "Easy", "Sum = 55, count = 10, average = 5.5.", ["Averages"]),
      q("The average marks of 30 students is 60. If one student's marks (originally recorded as 40) are corrected to 70, what is the new average?", ["60", "61", "62", "63"], 1, "Medium", "Total increases by 30 (70-40); new total/30 = (1800+30)/30 = 61.", ["Averages"]),
      q("The average of 4 numbers is 15. If one number is removed, the average of the remaining 3 becomes 12. What was the removed number?", ["21", "24", "18", "27"], 1, "Medium", "Original total=60, remaining total=36, removed number=60-36=24.", ["Averages"]),
    ],
  },
];

async function main() {
  let topicsAdded = 0, topicsUpdated = 0, questionsAdded = 0;
  const existingSnap = await db.collection("aptitude_topics").where("category", "==", "Quantitative").get();
  const byName = Object.fromEntries(existingSnap.docs.map(d => [d.data().name, d]));

  for (const t of TOPICS) {
    let topicRef;
    if (byName[t.name]) {
      topicRef = byName[t.name].ref;
      await topicRef.set({ ...t.lesson, status: "published" }, { merge: true });
      topicsUpdated++;
    } else {
      topicRef = await db.collection("aptitude_topics").add({
        category: "Quantitative", name: t.name, description: t.lesson.whatYoullLearn[0] || "",
        status: "published", order: existingSnap.size + topicsAdded, createdAt: admin.firestore.FieldValue.serverTimestamp(),
        ...t.lesson,
      });
      topicsAdded++;
    }
    for (let qi = 0; qi < t.questions.length; qi++) {
      await topicRef.collection("questions").add({ ...t.questions[qi], order: qi, createdAt: admin.firestore.FieldValue.serverTimestamp() });
      questionsAdded++;
    }
  }

  console.log(`Quantitative: ${topicsAdded} topics added, ${topicsUpdated} topics updated with lesson content, ${questionsAdded} questions added.`);
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
