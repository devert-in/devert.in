import admin from "firebase-admin";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(join(__dirname, "service-account.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

function q(question, options, correctIndex, difficulty, explanation, tags) {
  return { question, options, correctIndex, difficulty, marks: 1, explanation, tags: tags || [], attemptCount: 0, correctCount: 0, totalTimeSec: 0, estimatedTimeSec: 60, companies: [], examTags: [] };
}

const TOPICS = [
  {
    name: "Ages", isNew: true,
    lesson: {
      difficulty: "Beginner", estimatedMinutes: 15,
      whatYoullLearn: ["How to set up age problems using a single variable and translate word phrases into equations", "Why the AGE GAP between two people stays constant forever, and how that shortcut simplifies many problems", "How to handle ratio-based age problems using a common multiplier"],
      concept: "AGE problems genuinely test your ability to translate ENGLISH PHRASES into ALGEBRAIC equations precisely - \"5 years ago\" means SUBTRACT 5 from a person's current age; \"10 years hence/later\" means ADD 10 - the entire skill is careful, correct translation, since the arithmetic itself is genuinely simple once the equation is set up correctly.\n\nA genuinely useful shortcut worth internalizing: the AGE GAP (the difference between two people's ages) NEVER changes over time - if a father is 25 years older than his son today, he remains EXACTLY 25 years older in any year, past or future - this constant-gap fact frequently lets you skip setting up a full two-variable system, instead working with just one variable (the son's age) plus the known, fixed gap.\n\nRATIO-based age problems (\"the ages of A and B are in the ratio 3:5\") require introducing a common MULTIPLIER `x`: if the ratio is 3:5, the actual ages are `3x` and `5x` for some unknown x - additional information in the problem (their age gap, or their ages after some years) then lets you solve for x directly, after which the actual ages follow immediately by substitution.",
      keyPoints: ["Translate age phrases carefully into equations: \"X years ago\" subtracts, \"X years hence\" adds - the algebra itself is simple once the translation is correct", "The age GAP between two people never changes over time - this constant-difference fact often lets you use just one variable instead of two", "Ratio-based age problems use a common multiplier x (ages 3x and 5x for a 3:5 ratio) - solve for x using the additional given information, then substitute back"],
      commonMistakes: ["Incorrectly translating \"X years ago\" as addition or \"X years hence\" as subtraction - reversing these is a genuinely common, careless error", "Setting up two separate variables for two people's ages when the constant age-gap fact would let a single variable solve the problem more simply"],
      interviewTips: ["Practice translating 5-6 different age-phrase sentences into correct algebraic expressions rapidly, since correct translation - not the algebra itself - is genuinely where most errors in this topic occur"],
      realWorldApplications: ["The core algebraic-translation skill here (converting word relationships into equations) is broadly foundational to all quantitative word-problem solving, well beyond just age-specific questions"],
      mcqs: [
        { question: "A father is 25 years older than his son. In 10 years, how much older will the father be than the son?", options: ["15 years", "25 years", "35 years", "10 years"], correctIndex: 1 },
        { question: "What does \"5 years ago\" mean when translating an age problem into an equation?", options: ["Add 5 to the current age", "Subtract 5 from the current age", "Multiply the current age by 5", "Divide the current age by 5"], correctIndex: 1 },
      ],
      goingDeeper: "Some harder age problems give a relationship between ages at TWO different points in time simultaneously (\"5 years ago, A was twice as old as B; in 5 years, A will be 1.5 times as old as B\") - these genuinely require setting up and solving a proper system of two equations in two unknowns, rather than relying on the single-variable constant-gap shortcut, since two independent pieces of information about a changing ratio are given.",
      assignment: "The ratio of A's age to B's age is 4:5. Five years from now, the ratio will be 5:6. Find their current ages, setting up the equation using a common multiplier x explicitly.",
      xpReward: 15, coinReward: 5,
    },
    questions: [
      q("A father is 30 years older than his son. After 10 years, the father will be twice as old as the son. What is the son's current age?", ["15", "20", "25", "10"], 1, "Medium", "Let son's current age = s, father's = s+30. After 10 years: s+40 = 2(s+10) = 2s+20, so s = 20.", ["Ages"]),
      q("The ratio of A's age to B's age is 3:5. If the sum of their ages is 48, what is A's age?", ["16", "18", "20", "24"], 1, "Easy", "3x+5x=48, x=6, so A's age = 3x = 18.", ["Ages"]),
      q("5 years ago, a mother was 3 times as old as her daughter. Currently the mother is 38. What is the daughter's current age?", ["15", "16", "17", "18"], 1, "Medium", "5 years ago the mother was 33; since 33 = 3 x (daughter's age 5 years ago), the daughter was 11 then, meaning she is 16 now.", ["Ages"]),
      q("The sum of the present ages of a father and son is 60. Six years ago, the father's age was 5 times the son's age. What is the son's current age?", ["12", "14", "16", "18"], 1, "Medium", "Let father=f, son=s: f+s=60 and f-6=5(s-6). Substituting f=60-s: 60-s-6=5s-30, giving 84=6s, so s=14.", ["Ages"]),
    ],
  },
  {
    name: "Partnership", isNew: true,
    lesson: {
      difficulty: "Intermediate", estimatedMinutes: 15,
      whatYoullLearn: ["How to divide profit fairly when partners invest for the SAME duration versus DIFFERENT durations", "The concept of \"capital-months\" as the fair basis for splitting profit under unequal time periods", "How a working partner's extra compensation is typically handled before profit-splitting"],
      concept: "PARTNERSHIP problems split a business's PROFIT among partners fairly, based on their relative CONTRIBUTION - when all partners invest for the SAME time period, profit is split simply in the ratio of their INVESTMENT amounts (A investing Rs. 3000 and B investing Rs. 5000 for the same year split profit in the ratio 3:5).\n\nWhen partners invest for DIFFERENT DURATIONS, fair profit-splitting must account for BOTH investment amount AND time - using \"CAPITAL-MONTHS\" (investment amount multiplied by the number of months invested) as the fair basis: if A invests Rs. 4000 for 12 months and B invests Rs. 6000 for 8 months, their capital-months are `4000x12=48000` and `6000x8=48000` - EQUAL capital-months despite different raw investment amounts, meaning they'd split profit EQUALLY (1:1), genuinely counter-intuitive if you only looked at the raw investment amounts (4000 vs 6000) without accounting for the different durations.\n\nA WORKING PARTNER (one who also actively manages the business, versus a purely passive/\"sleeping\" investor) is frequently entitled to an additional, FIXED management fee/salary taken OUT of the total profit FIRST, BEFORE the remaining profit is split according to the normal capital-months ratio among all partners - forgetting this \"salary comes off the top first\" step is a genuinely common, specific error in working-partner problems.",
      keyPoints: ["Same-duration investments split profit simply by investment-amount ratio; different-duration investments require \"capital-months\" (amount x months) as the fair basis instead", "Capital-months can produce a genuinely counter-intuitive equal split even when raw investment amounts differ, if the durations compensate proportionally", "A working partner's fixed management fee/salary is deducted from total profit FIRST, before splitting the remainder by the normal capital-months ratio among all partners"],
      commonMistakes: ["Splitting profit purely by investment-amount ratio when partners actually invested for genuinely different durations, ignoring the time dimension entirely", "Forgetting to deduct a working partner's fixed salary/fee from total profit BEFORE splitting the remainder, applying the ratio to the full, undeducted profit instead"],
      interviewTips: ["Be ready to compute capital-months explicitly (amount x months) for each partner in a mixed-duration problem, rather than defaulting to a simple investment-ratio split"],
      realWorldApplications: ["This exact capital-months fairness principle directly applies to real-world business partnership and joint-venture profit-sharing agreements"],
      mcqs: [
        { question: "A invests Rs. 4000 for 12 months, B invests Rs. 6000 for 8 months. What is the ratio in which they should split profit?", options: ["2:3", "1:1", "3:2", "4:3"], correctIndex: 1 },
        { question: "How is a working partner's management fee typically handled in profit splitting?", options: ["It is ignored entirely", "It is deducted from total profit first, before splitting the remainder by the capital-months ratio", "It is added on top of the normal profit share", "It replaces the need for any ratio-based split"], correctIndex: 1 },
      ],
      goingDeeper: "Partnership problems occasionally involve a partner JOINING or LEAVING partway through the year - this requires computing that specific partner's capital-months using ONLY the actual number of months they were genuinely part of the business, while partners present the full year use the full 12 months - a direct extension of the same capital-months technique to a partial-year participation case.",
      assignment: "A invests Rs. 5000 for the full year. B invests Rs. 9000 but joins after 4 months (so invests for 8 months). If total profit is Rs. 6970, find each partner's share using the capital-months method explicitly.",
      xpReward: 20, coinReward: 8,
    },
    questions: [
      q("A and B invest Rs. 3000 and Rs. 5000 respectively for the same one-year period. If the total profit is Rs. 1600, what is A's share?", ["Rs. 500", "Rs. 600", "Rs. 700", "Rs. 800"], 1, "Easy", "Ratio 3000:5000 = 3:5; A's share = (3/8) x 1600 = 600.", ["Partnership"]),
      q("A invests Rs. 8000 for 12 months, B invests Rs. 4000 for 6 months. What is the ratio of their capital-months?", ["4:1", "2:1", "8:1", "1:1"], 0, "Medium", "A: 8000x12=96000; B: 4000x6=24000; ratio = 96000:24000 = 4:1.", ["Partnership"]),
      q("A, B invest Rs. 6000 and Rs. 4000. A works and manages the business, taking a fixed Rs. 500 salary from the total profit of Rs. 2500 before splitting the rest. What is B's final share?", ["Rs. 800", "Rs. 900", "Rs. 1000", "Rs. 1100"], 0, "Medium", "Remaining after A's salary = 2500-500 = 2000; investment ratio 6000:4000 = 3:2; B's share = (2/5) x 2000 = 800.", ["Partnership"]),
    ],
  },
  {
    name: "Mixtures & Allegations", isNew: true,
    lesson: {
      difficulty: "Intermediate", estimatedMinutes: 20,
      whatYoullLearn: ["The Rule of Alligation as a fast shortcut for mixture-ratio problems", "How to compute the resulting concentration when two different mixtures are combined", "How replacement/dilution problems work when a portion of a mixture is repeatedly removed and replaced"],
      concept: "MIXTURE problems combine two components with different \"values\" (price, concentration, purity) into a resulting mixture with some AVERAGE value - the RULE OF ALLIGATION is a genuinely fast shortcut avoiding full algebraic setup: for two components with values `a` and `b` mixed to produce an average value `m` (where a < m < b), the ratio in which they must be mixed is `(b-m) : (m-a)` - notice this ratio is genuinely CROSSED (the cheaper/lower-value component's proportion comes from the difference on the HIGHER-value side, and vice versa).\n\nConcretely: mixing tea worth Rs. 40/kg with tea worth Rs. 60/kg to get a blend worth Rs. 52/kg - using alligation: ratio = `(60-52):(52-40) = 8:12 = 2:3` - meaning the CHEAPER tea (Rs. 40) and pricier tea (Rs. 60) must be mixed in the ratio 2:3, i.e., 2 parts cheap to 3 parts pricier.\n\nREPLACEMENT/DILUTION problems (repeatedly removing a portion of a mixture and replacing it with pure water, or a different component) use a genuinely specific formula: after `n` such repeated removal-and-replacement operations, each removing a fraction of the CURRENT mixture and replacing with the diluting substance, the remaining original concentration is `Initial Amount x (1 - removed fraction)^n` - this compounds MULTIPLICATIVELY with each repetition, precisely analogous to the compound-interest depreciation idea from an earlier topic.",
      keyPoints: ["Rule of Alligation: for two components with values a and b mixed to get average m, the mixing ratio is (b-m):(m-a) - a genuinely fast shortcut avoiding full algebra", "The alligation ratio is deliberately CROSSED - the cheaper component's proportion comes from the difference on the higher-value side, and vice versa", "Repeated removal-and-replacement dilution compounds multiplicatively: remaining original amount = Initial x (1 - removed fraction)^n, directly analogous to compound depreciation"],
      commonMistakes: ["Setting up the alligation ratio in the wrong (uncrossed) order - using (m-a):(b-m) instead of the correct crossed (b-m):(m-a)", "Treating repeated dilution as simple, additive removal rather than recognizing it compounds multiplicatively with each repetition"],
      interviewTips: ["Practice the alligation shortcut on 3-4 different mixture problems until the crossed-ratio setup is fully automatic, since it's dramatically faster than full algebraic equation-solving"],
      realWorldApplications: ["Mixing chemical solutions to a target concentration, blending different-grade commodities to a target average price, and diluting concentrated solutions are all genuine real-world applications"],
      mcqs: [
        { question: "Using the Rule of Alligation, in what ratio should tea worth Rs. 40/kg be mixed with tea worth Rs. 60/kg to get a blend worth Rs. 52/kg?", options: ["3:2", "2:3", "1:1", "4:1"], correctIndex: 1 },
        { question: "What formula governs the remaining original concentration after n repeated remove-and-replace dilution operations?", options: ["Initial x n x (removed fraction)", "Initial x (1 - removed fraction)^n", "Initial / n", "Initial + (removed fraction) x n"], correctIndex: 1 },
      ],
      goingDeeper: "Alligation extends directly to problems involving MORE than two components, or blending an existing mixture with a THIRD pure component - the same crossed-ratio logic applies pairwise, working through the components systematically two at a time, rather than needing a genuinely different technique for more complex blends.",
      assignment: "A 40-liter mixture contains milk and water in the ratio 3:1. How much water must be added to make the ratio 3:2? Show the alligation or direct ratio-adjustment method explicitly.",
      xpReward: 20, coinReward: 8,
    },
    questions: [
      q("In what ratio must rice at Rs. 30/kg be mixed with rice at Rs. 45/kg to get a mixture worth Rs. 36/kg?", ["2:3", "3:2", "1:2", "2:1"], 1, "Medium", "Alligation: (45-36):(36-30) = 9:6 = 3:2.", ["Mixtures & Allegations"]),
      q("A vessel contains a mixture of milk and water in the ratio 5:1. How many liters of water must be added to 24 liters of this mixture to make the ratio 5:3?", ["6 liters", "8 liters", "10 liters", "12 liters"], 1, "Medium", "Milk = 20L, water = 4L in the 24L mixture. For ratio 5:3 with milk fixed at 20L: water needed = 20x3/5=12L, so additional water = 12-4=8L.", ["Mixtures & Allegations"]),
      q("A 20-liter mixture of milk and water contains 90% milk. How much water must be added to make it 75% milk?", ["2 liters", "4 liters", "6 liters", "8 liters"], 1, "Hard", "Milk = 18L (constant). For 75% milk: total = 18/0.75 = 24L, so water added = 24-20 = 4L.", ["Mixtures & Allegations"]),
    ],
  },
  {
    name: "Simplification & Approximation", isNew: true,
    lesson: {
      difficulty: "Beginner", estimatedMinutes: 15,
      whatYoullLearn: ["The BODMAS/PEMDAS order of operations and where careless errors most commonly happen", "How to quickly approximate a calculation to eliminate obviously-wrong answer options", "Common simplification shortcuts for fractions and percentages under time pressure"],
      concept: "SIMPLIFICATION problems test disciplined, careful application of BODMAS/PEMDAS (Brackets, Orders/Exponents, Division/Multiplication, Addition/Subtraction) - performed strictly LEFT TO RIGHT within each equal-precedence tier (division and multiplication share a tier and resolve left-to-right; the same applies to addition and subtraction) - the genuine skill is disciplined, error-free execution under time pressure, not any special conceptual insight.\n\nAPPROXIMATION is a genuinely valuable time-saving technique specifically for multi-choice questions: rather than computing an exact value, round each number to a convenient nearby value FIRST (rounding 48.7 to 50, or 6.98 to 7), compute the APPROXIMATE result, then select whichever answer OPTION is closest to that approximation - since MCQ answer options are typically spread far enough apart that a rough approximation reliably identifies the correct one without needing exact precision, dramatically saving time on lengthy expressions.\n\nCommon SIMPLIFICATION SHORTCUTS worth having memorized: `1/8 = 12.5%`, `1/6 ≈ 16.67%`, `1/3 ≈ 33.33%`, `3/4 = 75%` - instantly recognizing these common fraction-percentage equivalences (rather than manually dividing every time) saves genuine, meaningful time across an entire test section.",
      keyPoints: ["BODMAS/PEMDAS order of operations resolves strictly left-to-right within each equal-precedence tier - disciplined execution, not special insight, is the genuine skill being tested", "Approximation (rounding to convenient nearby values before calculating) is a valid, time-saving MCQ technique when answer options are spread far enough apart", "Memorizing common fraction-percentage equivalences (1/8=12.5%, 1/3≈33.33%) saves meaningful time versus manually dividing every time"],
      commonMistakes: ["Resolving addition/subtraction or multiplication/division out of their correct left-to-right order within the same precedence tier", "Attempting approximation when answer options are genuinely close together (where only exact calculation can reliably distinguish them) - approximation only safely applies when options are well-separated"],
      interviewTips: ["Practice recognizing when answer options are spread far enough apart to safely use approximation versus when they're close enough that exact calculation is genuinely required"],
      realWorldApplications: ["Quick mental estimation (rounding, approximation) is a genuinely practical everyday skill for budgeting, tip calculation, and sanity-checking any computed result at a glance"],
      mcqs: [
        { question: "What is the correct order of operations under BODMAS?", options: ["Addition, Subtraction, then everything else", "Brackets, Orders/Exponents, Division/Multiplication (left to right), Addition/Subtraction (left to right)", "Strictly left to right with no precedence at all", "Division always comes before Multiplication regardless of position"], correctIndex: 1 },
        { question: "When is approximation a safe, valid technique for an MCQ calculation question?", options: ["Always, regardless of the answer options", "When the answer options are spread far enough apart that a rough estimate reliably distinguishes the correct one", "Never - only exact calculation is ever valid", "Only for addition problems, never multiplication"], correctIndex: 1 },
      ],
      goingDeeper: "For genuinely complex nested expressions with multiple bracket levels, work from the INNERMOST bracket outward systematically, fully resolving each level completely before moving to the next enclosing level - attempting to simplify multiple bracket levels simultaneously is a common source of careless errors in longer expressions.",
      assignment: "Simplify 15 + 6 x (8 - 3) / 2 - 4 step by step, explicitly showing which operation is performed at each stage according to BODMAS.",
      xpReward: 15, coinReward: 5,
    },
    questions: [
      q("Simplify: 12 + 6 x 2 - 8 / 4", ["22", "24", "26", "20"], 0, "Easy", "BODMAS: 6x2=12, 8/4=2; 12+12-2=22.", ["Simplification"]),
      q("Simplify: (15 - 5) x 2 + 10 / 5", ["22", "24", "20", "18"], 0, "Easy", "Bracket first: 15-5=10; 10x2=20; 10/5=2; 20+2=22.", ["Simplification"]),
      q("What is approximately 48.8% of 250?", ["100", "120", "150", "80"], 1, "Medium", "Approximate 48.8% as 50%: 50% of 250 = 125, closest option is 120.", ["Simplification", "Approximation"]),
      q("Simplify: 3/4 + 1/8", ["7/8", "5/8", "1", "3/8"], 0, "Easy", "3/4=6/8; 6/8+1/8=7/8.", ["Simplification"]),
    ],
  },
];

async function main() {
  let topicsAdded = 0, questionsAdded = 0;
  const existingSnap = await db.collection("aptitude_topics").where("category", "==", "Quantitative").get();
  const currentCount = existingSnap.size;

  for (const t of TOPICS) {
    const topicRef = await db.collection("aptitude_topics").add({
      category: "Quantitative", name: t.name, description: t.lesson.whatYoullLearn[0] || "",
      status: "published", order: currentCount + topicsAdded, createdAt: admin.firestore.FieldValue.serverTimestamp(),
      ...t.lesson,
    });
    topicsAdded++;
    for (let qi = 0; qi < t.questions.length; qi++) {
      await topicRef.collection("questions").add({ ...t.questions[qi], order: qi, createdAt: admin.firestore.FieldValue.serverTimestamp() });
      questionsAdded++;
    }
  }

  console.log(`Quantitative (batch 3): ${topicsAdded} topics added, ${questionsAdded} questions added.`);
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
