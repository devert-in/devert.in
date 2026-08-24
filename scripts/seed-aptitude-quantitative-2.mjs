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
    name: "Number System", isNew: true,
    lesson: {
      difficulty: "Beginner", estimatedMinutes: 20,
      whatYoullLearn: ["How to find a number's unit digit for any power, using the cyclic pattern of digit powers", "Divisibility rules for common small numbers, without doing the actual division", "How to quickly find remainders using modular arithmetic"],
      concept: "UNIT DIGIT of a large power (like 7^85) genuinely never requires computing the full number - unit digits of powers of any digit follow a repeating CYCLE with a short, fixed period (2, 4 digits are cycled through) - for 7 specifically: 7^1=...7, 7^2=...9, 7^3=...3, 7^4=...1, then it repeats (period 4). To find 7^85's unit digit: `85 mod 4 = 1`, so it matches 7^1's unit digit, which is 7 - this exact cycle-then-modulo technique works for every digit's powers, with the period varying (2 for most digits, 4 for a few, 1 for digits like 0,1,5,6 which never change).\n\nDIVISIBILITY RULES let you determine whether a number is divisible by a small number WITHOUT actually performing division - worth having memorized cold: divisible by 3 if the DIGIT SUM is divisible by 3; by 9 if the digit sum is divisible by 9; by 4 if the LAST TWO digits form a number divisible by 4; by 11 if the alternating digit-sum difference (sum of digits in odd positions minus sum in even positions) is divisible by 11 - these rules turn a potentially large division into a simple digit-sum check.\n\nREMAINDER problems (\"what is the remainder when X is divided by Y\") are frequently solvable via MODULAR ARITHMETIC shortcuts rather than actual division - specifically, remainders of a PRODUCT or SUM can be computed by taking remainders of the individual pieces FIRST, then combining: `(a x b) mod n = ((a mod n) x (b mod n)) mod n` - this lets you avoid ever computing the full, large product before finding its remainder.",
      keyPoints: ["Unit digits of powers cycle with a short, fixed period (commonly 4) - find the power's remainder when divided by the cycle length, then match that position in the cycle", "Divisibility rules (digit sum for 3/9, last two digits for 4, alternating sum for 11) let you check divisibility without performing actual division", "Remainders of products/sums can be computed by taking remainders of the pieces first, then combining - avoiding ever computing the full large number"],
      commonMistakes: ["Forgetting that a power's exponent-mod-cycle-length calculation needs a special case when the remainder is 0 (it corresponds to the LAST position in the cycle, not position 0)", "Trying to actually perform long division on a genuinely huge number instead of applying the relevant divisibility rule or modular arithmetic shortcut"],
      interviewTips: ["Have the digit-cycle periods for unit digits of 2 through 9 memorized (or be able to derive them instantly), since unit-digit-of-a-large-power questions are extremely common in placement tests"],
      realWorldApplications: ["Modular arithmetic (the same idea underlying remainder shortcuts) is genuinely foundational to cryptography and computer science hashing algorithms, not just an aptitude-test trick"],
      mcqs: [
        { question: "What is the unit digit of 7^85?", options: ["1", "3", "7", "9"], correctIndex: 2 },
        { question: "A number is divisible by 9 if...", options: ["its last digit is 9", "the sum of its digits is divisible by 9", "it is an odd number", "it ends in 0"], correctIndex: 1 },
      ],
      goingDeeper: "For unit digits, the cyclic period genuinely varies by base digit: 0,1,5,6 have period 1 (unit digit never changes regardless of the power); 4 and 9 have period 2; 2,3,7,8 have period 4 - knowing these exact period groupings lets you skip re-deriving the cycle from scratch for every single problem.",
      assignment: "Find the unit digit of 3^58 and 8^123, showing the cycle-then-modulo calculation explicitly for each.",
      xpReward: 15, coinReward: 5,
    },
    questions: [
      q("What is the unit digit of 2^50?", ["2", "4", "6", "8"], 1, "Medium", "2's unit-digit cycle is 2,4,8,6 (period 4). 50 mod 4 = 2, matching the 2nd position: 4.", ["Number System"]),
      q("Which of these numbers is divisible by 11?", ["2531", "3542", "1234", "9076"], 1, "Medium", "The divisibility-by-11 rule: alternating digit sum (odd positions minus even positions) must be divisible by 11. For 3542: (3+4)-(5+2) = 7-7 = 0, which is divisible by 11.", ["Number System", "Divisibility"]),
      q("What is the remainder when 7^100 is divided by 4?", ["1", "2", "3", "0"], 0, "Hard", "7 mod 4 = 3; 3^100 mod 4: 3^2=9 mod4=1, so 3^100=(3^2)^50 mod4=1^50=1.", ["Number System", "Remainders"]),
      q("Is 4536 divisible by 4?", ["Yes, since its last two digits (36) are divisible by 4", "No", "Only divisible by 2, not 4", "Cannot be determined"], 0, "Easy", "36/4=9 exactly, so by the last-two-digits rule, 4536 is divisible by 4.", ["Number System", "Divisibility"]),
      q("What is the unit digit of 9^99?", ["1", "9", "3", "7"], 1, "Medium", "9's unit digit cycle is 9,1 (period 2). 99 is odd, matching position 1 (9).", ["Number System"]),
    ],
  },
  {
    name: "LCM & HCF", isNew: true,
    lesson: {
      difficulty: "Beginner", estimatedMinutes: 15,
      whatYoullLearn: ["What LCM and HCF genuinely represent, beyond the mechanical calculation", "The direct relationship between LCM, HCF, and the product of two numbers", "How to recognize LCM/HCF word problems by their characteristic phrasing"],
      concept: "HCF (Highest Common Factor, also called GCD) is the LARGEST number that divides ALL the given numbers exactly, with no remainder. LCM (Least Common Multiple) is the SMALLEST number that ALL the given numbers divide into exactly - these are genuinely complementary ideas (HCF looks for a shared FACTOR, LCM looks for a shared MULTIPLE), which is precisely why they satisfy a genuinely useful direct relationship for exactly two numbers: `HCF x LCM = Product of the two numbers` - letting you compute either one directly if you already know the other plus the two original numbers, without repeating the full factorization process.\n\nRECOGNIZING which one a word problem actually wants is the genuine skill being tested: LCM problems characteristically involve \"repeating events happening TOGETHER again\" (three bells ringing at different intervals - when do they next ring together? Answer: their LCM) or \"the smallest quantity that can be evenly divided into several different-sized groups.\" HCF problems characteristically involve \"the largest possible size/quantity that divides evenly into several different totals\" (the largest tile size that evenly tiles rooms of different dimensions; the maximum number of identical groups you can form from several different quantities with nothing left over).",
      keyPoints: ["HCF is the largest number dividing all given numbers exactly; LCM is the smallest number all given numbers divide into exactly - complementary concepts (shared factor versus shared multiple)", "For exactly two numbers: HCF x LCM = Product of the two numbers - a genuinely useful shortcut avoiding full re-factorization", "LCM problems characteristically involve repeating events syncing up together again; HCF problems characteristically involve finding the largest equal-sized division of several different quantities"],
      commonMistakes: ["Confusing which concept (LCM or HCF) a word problem is actually asking for, based on surface-level keyword matching rather than genuinely understanding the \"largest shared divisor\" versus \"smallest shared multiple\" distinction", "Forgetting the HCF x LCM = product shortcut only applies directly to exactly TWO numbers, not three or more"],
      interviewTips: ["Practice identifying LCM-versus-HCF from word problem PHRASING alone (\"when will they next coincide\" = LCM; \"largest possible equal size\" = HCF) until it's fully automatic"],
      realWorldApplications: ["Scheduling recurring events (buses arriving at different intervals), and dividing supplies into the largest possible equal-sized groups, are genuine real-world LCM and HCF applications respectively"],
      mcqs: [
        { question: "What is the HCF of 24 and 36?", options: ["6", "8", "12", "18"], correctIndex: 2 },
        { question: "For exactly two numbers, what is the relationship between their HCF, LCM, and product?", options: ["HCF + LCM = Product", "HCF x LCM = Product", "LCM / HCF = Product", "There is no direct relationship"], correctIndex: 1 },
      ],
      goingDeeper: "For THREE OR MORE numbers, the simple HCF x LCM = product shortcut genuinely does NOT apply directly - you must find HCF/LCM pairwise (HCF of the first two, then HCF of that result with the third, and so on) or use full prime factorization across all numbers simultaneously - a genuinely important limitation of the two-number shortcut worth remembering precisely.",
      assignment: "Three bells ring at intervals of 6, 8, and 12 minutes respectively. If they all ring together at 9:00 AM, when will they next ring together? Show the LCM calculation explicitly.",
      xpReward: 15, coinReward: 5,
    },
    questions: [
      q("What is the LCM of 12 and 18?", ["24", "36", "48", "72"], 1, "Easy", "12=2^2x3, 18=2x3^2; LCM=2^2x3^2=36.", ["LCM & HCF"]),
      q("What is the HCF of 48 and 60?", ["6", "8", "12", "16"], 2, "Easy", "48=2^4x3, 60=2^2x3x5; HCF=2^2x3=12.", ["LCM & HCF"]),
      q("The HCF of two numbers is 12 and their LCM is 144. If one number is 48, what is the other?", ["24", "36", "48", "72"], 1, "Medium", "HCFxLCM=product: 12x144=1728; other number=1728/48=36.", ["LCM & HCF"]),
      q("Three bells ring at intervals of 4, 6, and 8 minutes. If they ring together now, after how many minutes will they next ring together?", ["12 minutes", "24 minutes", "48 minutes", "16 minutes"], 1, "Medium", "LCM(4,6,8)=24 minutes.", ["LCM & HCF"]),
      q("What is the greatest number that divides 245 and 1029 leaving remainder 5 in each case?", ["12", "16", "24", "8"], 1, "Hard", "Subtract the remainder from each: 245-5=240 and 1029-5=1024. 240=2^4x3x5 and 1024=2^10, so their HCF is 2^4=16.", ["LCM & HCF"]),
    ],
  },
  {
    name: "Permutations & Combinations", isNew: true,
    lesson: {
      difficulty: "Intermediate", estimatedMinutes: 25,
      whatYoullLearn: ["The precise distinction between a permutation (order matters) and a combination (order doesn't)", "The formulas for nPr and nCr and when to use each", "How to handle common constraints like \"must include a specific person\" or \"specific people must sit together\""],
      concept: "The single most important distinction in this entire topic, worth internalizing precisely before anything else: a PERMUTATION counts ARRANGEMENTS where ORDER genuinely matters (who wins 1st vs 2nd place - swapping two people changes the outcome); a COMBINATION counts SELECTIONS where order does NOT matter (choosing a 3-person committee from 10 people - who's \"first\" chosen doesn't matter, only who ends up on the committee). Every single problem in this topic reduces to correctly identifying which of these two questions is genuinely being asked FIRST, before applying any formula.\n\nThe formulas: `nPr = n! / (n-r)!` (arrangements of r items chosen from n, order matters) and `nCr = n! / (r! x (n-r)!)` (selections of r items from n, order doesn't matter) - notice `nCr = nPr / r!`, since a combination is genuinely just a permutation with the r!  ways of ordering each selected group divided back out (since those orderings are all considered the SAME selection in a combination).\n\nCOMMON CONSTRAINTS require adjusting the base calculation, not a different formula entirely: \"must include a specific person\" - fix that person's spot, then arrange/select the remaining r-1 (or n-1) freely. \"specific people must sit/stand TOGETHER\" (a classic circular/linear arrangement constraint) - treat the group that must stay together as ONE single combined unit first, arrange that unit among the others, THEN multiply by the number of ways to arrange the people WITHIN that combined unit internally.",
      keyPoints: ["Permutation: order matters (arrangements, rankings); Combination: order doesn't matter (selections, groups) - correctly identifying which applies is the essential first step in every problem", "nPr = n!/(n-r)!; nCr = n!/(r!(n-r)!) = nPr/r! - a combination is a permutation with the internal orderings of each selected group divided back out", "\"Must sit/stand together\" constraints: treat the group as one combined unit, arrange that unit among the rest, then multiply by the ways to arrange people WITHIN that unit"],
      commonMistakes: ["Using nPr when a problem actually describes a selection (order doesn't matter), or nCr when it actually describes an arrangement (order does matter) - the single most common error in this entire topic", "Forgetting to multiply by the internal arrangement count when handling a \"must sit together\" constraint, only accounting for the combined-unit's own position among the others"],
      interviewTips: ["Before applying any formula, explicitly ask yourself out loud: \"does swapping the order of two selected items genuinely create a different outcome here?\" - if yes, permutation; if no, combination"],
      realWorldApplications: ["Password/PIN counting (permutations, since order matters), lottery number combinations (combinations, since order doesn't matter), and committee/team selection are all genuine real-world applications"],
      mcqs: [
        { question: "In how many ways can 3 people be selected from a group of 8, if order doesn't matter?", options: ["56", "112", "336", "24"], correctIndex: 0 },
        { question: "What genuinely distinguishes a permutation from a combination?", options: ["Permutations only apply to numbers, combinations to letters", "Permutations count arrangements where order matters; combinations count selections where order doesn't matter", "They are exactly the same concept with different names", "Combinations always produce a larger count than permutations"], correctIndex: 1 },
      ],
      goingDeeper: "CIRCULAR PERMUTATIONS (arranging people around a round table, where rotations of the same arrangement are considered identical) use a genuinely different formula: `(n-1)!` instead of the usual `n!` for n people - since fixing one person's seat as a reference point removes the redundant rotational duplicates that a linear arrangement wouldn't have.",
      assignment: "In how many ways can 5 people be arranged in a row if two specific people must always sit together? Show the combined-unit technique explicitly, including the internal arrangement multiplication.",
      xpReward: 20, coinReward: 8,
    },
    questions: [
      q("In how many ways can 4 people be arranged in a row?", ["4", "16", "24", "12"], 2, "Easy", "4! = 24 arrangements, since order matters for a row.", ["Permutations & Combinations"]),
      q("In how many ways can a committee of 3 be selected from 7 people?", ["21", "35", "210", "42"], 1, "Medium", "7C3 = 7!/(3!x4!) = 35 - order doesn't matter for a committee.", ["Permutations & Combinations"]),
      q("In how many ways can the letters of the word 'LEVEL' be arranged?", ["120", "60", "30", "20"], 2, "Hard", "LEVEL has 5 letters with L repeated twice and E repeated twice: 5!/(2!x2!) = 120/4 = 30.", ["Permutations & Combinations"]),
      q("In how many ways can 3 men and 2 women be arranged in a row so that the two women always sit together?", ["48", "24", "12", "60"], 0, "Hard", "Treat the 2 women as one unit: 4 units total arranged in 4!=24 ways, times 2! ways to arrange the women within their unit = 24x2=48.", ["Permutations & Combinations"]),
      q("How many different 3-digit numbers can be formed using digits 1-9 with no digit repeated?", ["504", "729", "84", "336"], 0, "Medium", "9P3 = 9x8x7 = 504.", ["Permutations & Combinations"]),
    ],
  },
  {
    name: "Probability", isNew: true,
    lesson: {
      difficulty: "Intermediate", estimatedMinutes: 20,
      whatYoullLearn: ["The core probability formula and how to correctly count favorable versus total outcomes", "How probability combines for independent events (AND) versus mutually exclusive events (OR)", "How to compute probability using combinations for card/selection problems"],
      concept: "PROBABILITY of an event is genuinely just `(Number of Favorable Outcomes) / (Total Number of Possible Outcomes)` - the entire skill in this topic is correctly, carefully COUNTING both the numerator and denominator, frequently using the Permutations & Combinations techniques from the previous topic directly.\n\nCOMBINING PROBABILITIES follows two genuinely distinct rules depending on the relationship between events: for INDEPENDENT events (one event's outcome doesn't affect the other) both happening together, MULTIPLY their individual probabilities (\"AND\" -> multiply) - the probability of getting heads on two separate coin flips is `1/2 x 1/2 = 1/4`. For MUTUALLY EXCLUSIVE events (they genuinely can't both happen at once) where EITHER ONE occurring is the question, ADD their individual probabilities (\"OR\" -> add, for mutually exclusive events specifically) - the probability of rolling a 1 OR a 6 on a single die is `1/6 + 1/6 = 1/3`.\n\nCARD/SELECTION probability problems frequently require combinations to correctly count outcomes: \"probability of drawing 2 red cards from a standard 52-card deck\" is `(26C2) / (52C2)` - the favorable outcomes (choosing 2 from the 26 red cards) divided by the total possible outcomes (choosing any 2 from all 52 cards) - this is precisely why fluency with combinations from the previous topic directly transfers into correctly solving probability problems.",
      keyPoints: ["Probability = Favorable Outcomes / Total Outcomes - the real skill is correctly counting both, frequently using combinations", "Independent events both happening: multiply their individual probabilities (AND -> multiply); mutually exclusive events, either happening: add their individual probabilities (OR -> add)", "Card/selection probability problems use combinations directly: favorable selections (nCr) over total possible selections (NCr)"],
      commonMistakes: ["Adding probabilities for independent events that must BOTH happen (should multiply), or multiplying for mutually exclusive OR-events (should add) - genuinely opposite rules for genuinely different situations", "Miscounting the total number of possible outcomes, especially in card/dice problems, leading to a correctly-structured but wrongly-valued fraction"],
      interviewTips: ["Be ready to correctly identify whether a compound-probability question is asking about independent events (multiply) or mutually exclusive alternatives (add) before setting up any calculation"],
      realWorldApplications: ["Risk assessment, quality control sampling (probability a random sample contains a defective item), and game/gambling odds calculations are all genuine, direct real-world applications of these exact rules"],
      mcqs: [
        { question: "What is the probability of getting heads on two consecutive independent coin flips?", options: ["1/2", "1/3", "1/4", "1"], correctIndex: 2 },
        { question: "For two mutually exclusive events, what is the probability that EITHER ONE occurs?", options: ["Multiply their individual probabilities", "Add their individual probabilities", "Subtract one from the other", "Divide one by the other"], correctIndex: 1 },
      ],
      goingDeeper: "CONDITIONAL PROBABILITY (the probability of an event GIVEN that another event has already happened, written P(A|B)) is a genuinely important extension for dependent events - e.g., drawing a second card without replacement, where the first draw genuinely changes the deck's remaining composition - computed as `P(A and B) / P(B)`, worth knowing exists even though most placement-aptitude tests stay at the simpler independent/mutually-exclusive level covered above.",
      assignment: "A bag contains 5 red and 7 blue balls. Two balls are drawn without replacement. Compute the probability both are red, showing the combinations-based calculation explicitly.",
      xpReward: 20, coinReward: 8,
    },
    questions: [
      q("A die is rolled once. What is the probability of getting an even number?", ["1/6", "1/3", "1/2", "2/3"], 2, "Easy", "Favorable outcomes {2,4,6} = 3 out of 6 total, giving 3/6 = 1/2.", ["Probability"]),
      q("What is the probability of drawing a king from a standard 52-card deck?", ["1/52", "1/13", "4/52", "1/4"], 1, "Easy", "4 kings out of 52 cards = 4/52 = 1/13.", ["Probability"]),
      q("Two coins are tossed together. What is the probability of getting exactly one head?", ["1/4", "1/2", "3/4", "1"], 1, "Medium", "Outcomes: HH,HT,TH,TT - exactly one head in 2 of 4 outcomes, giving 2/4=1/2.", ["Probability"]),
      q("A bag has 4 red and 6 blue balls. What is the probability of drawing a red ball?", ["2/5", "3/5", "1/2", "2/3"], 0, "Easy", "4 red out of 10 total = 4/10 = 2/5.", ["Probability"]),
      q("What is the probability of getting a sum of 7 when two dice are rolled?", ["1/6", "1/12", "1/9", "5/36"], 0, "Medium", "6 favorable combinations out of 36 total = 6/36 = 1/6.", ["Probability"]),
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

  console.log(`Quantitative (batch 2): ${topicsAdded} topics added, ${questionsAdded} questions added.`);
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
