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
    name: "Series Completion", isNew: true,
    lesson: {
      difficulty: "Beginner", estimatedMinutes: 15,
      whatYoullLearn: ["How to systematically test common series patterns (arithmetic, geometric, alternating) against given terms", "How letter series map onto their numeric alphabet positions to reveal the pattern", "Why checking your discovered pattern against at least 3 consecutive terms prevents a false-positive rule"],
      concept: "SERIES COMPLETION asks you to find the next term(s) in a sequence following a HIDDEN, CONSISTENT rule - the genuine skill is systematically testing a small set of COMMON pattern types against the given terms, rather than guessing randomly.\n\nThe most common NUMBER series pattern types, worth testing in this rough order: ARITHMETIC (constant difference added each step: 3,7,11,15... +4 each time); GEOMETRIC (constant ratio multiplied each step: 3,6,12,24... x2 each time); SQUARES/CUBES (1,4,9,16... are consecutive squares); ALTERNATING/COMBINED (two interleaved patterns, like odd positions following one rule and even positions following another); and DIFFERENCES-OF-DIFFERENCES (where the differences THEMSELVES form a recognizable pattern, like 2,3,5,8,12... where the gaps are 1,2,3,4 - increasing by 1 each time).\n\nLETTER series work by converting each letter to its ALPHABET POSITION NUMBER (A=1, B=2, ... Z=26) FIRST, applying the exact same number-series pattern-testing technique to those position numbers, then converting the answer back to a letter - this reduces every letter series problem to the already-familiar number series skill.\n\nThe single most important discipline, worth repeating from Coding-Decoding: ALWAYS verify your discovered pattern against AT LEAST 3 consecutive terms (not just the first two) before trusting it and predicting the next term - many series have multiple patterns that fit just the first two terms, but only the genuine, correct pattern holds consistently across the entire given sequence.",
      keyPoints: ["Test common pattern types systematically: arithmetic (constant difference), geometric (constant ratio), squares/cubes, alternating/combined, and differences-of-differences", "Letter series convert each letter to its alphabet position number (A=1...Z=26) first, applying the same number-series technique, then converting back", "Always verify a discovered pattern against at least 3 consecutive terms before trusting it - many series fit multiple patterns for just the first two terms"],
      commonMistakes: ["Assuming a series is purely arithmetic (constant difference) without checking whether the DIFFERENCES themselves form their own pattern (differences-of-differences)", "Trusting a pattern that fits only the first two given terms without verifying it holds for the third and later terms too"],
      interviewTips: ["Practice the number-to-letter-position conversion (A=1...Z=26) until it's instant, since letter series problems are genuinely just number series problems wearing a different notation"],
      realWorldApplications: ["Pattern recognition in numeric sequences is genuinely foundational to recognizing trends in data analysis and is a core building block of algorithmic thinking"],
      mcqs: [
        { question: "What is the next number in the series: 3, 7, 11, 15, ?", options: ["17", "18", "19", "21"], correctIndex: 2 },
        { question: "What should you do before trusting a discovered series pattern?", options: ["Apply it immediately to the answer", "Verify it holds across at least 3 consecutive given terms, not just the first two", "Assume it's always arithmetic", "Nothing further is needed once one pair matches"], correctIndex: 1 },
      ],
      goingDeeper: "PRIME NUMBER series (2,3,5,7,11,13...) and FIBONACCI-STYLE series (each term is the sum of the two preceding terms: 1,1,2,3,5,8,13...) are two genuinely distinct, well-known pattern families worth recognizing on sight, since they don't fit the simpler arithmetic/geometric mold and are commonly used specifically to test whether you recognize these particular, famous sequences.",
      assignment: "Find the next two terms in the series: 2, 6, 12, 20, 30, ? and explain the differences-of-differences pattern you used to solve it.",
      xpReward: 15, coinReward: 5,
    },
    questions: [
      q("Find the next number: 2, 6, 12, 20, 30, ?", ["36", "40", "42", "44"], 2, "Medium", "Differences are 4,6,8,10 (increasing by 2), so next difference is 12: 30+12=42.", ["Series Completion"]),
      q("Find the next number: 5, 10, 20, 40, ?", ["60", "70", "80", "50"], 2, "Easy", "Each term doubles the previous one (geometric, ratio 2): 40x2=80.", ["Series Completion"]),
      q("Find the missing letter: B, D, F, H, ?", ["I", "J", "K", "L"], 1, "Easy", "Alphabet positions 2,4,6,8 (+2 each time); next is 10, which is J.", ["Series Completion", "Letter Series"]),
      q("Find the next number: 1, 4, 9, 16, 25, ?", ["30", "32", "36", "49"], 2, "Easy", "These are consecutive perfect squares (1^2,2^2,3^2,4^2,5^2); next is 6^2=36.", ["Series Completion"]),
      q("Find the next term: 1, 1, 2, 3, 5, 8, ?", ["11", "12", "13", "14"], 2, "Medium", "This is the Fibonacci sequence - each term is the sum of the two preceding terms: 5+8=13.", ["Series Completion", "Fibonacci"]),
    ],
  },
  {
    name: "Analogies", isNew: true,
    lesson: {
      difficulty: "Beginner", estimatedMinutes: 15,
      whatYoullLearn: ["How to precisely name the relationship between a given word pair before searching for the matching pair", "The most common analogy relationship categories tested in placement exams", "Why the SAME relationship, not just a similar topic, is what a correct analogy answer must share"],
      concept: "ANALOGY questions present a word pair with a specific RELATIONSHIP, then ask you to find a second pair sharing that EXACT SAME relationship - the genuine skill is precisely NAMING the relationship in the first pair (in words, explicitly) before scanning the answer options, rather than vaguely sensing \"these seem related somehow.\"\n\nCommon relationship CATEGORIES worth recognizing by name: PART-TO-WHOLE (\"Page : Book\" - a page is part of a book); FUNCTION/PURPOSE (\"Pen : Write\" - a pen's function is to write); CAUSE-EFFECT (\"Fire : Smoke\" - fire causes smoke); WORKER-TOOL (\"Carpenter : Hammer\"); CATEGORY-MEMBER (\"Fruit : Apple\" - apple is a specific type of fruit); DEGREE/INTENSITY (\"Warm : Hot\" - a difference of intensity along the same scale).\n\nThe single most important discipline: explicitly state the relationship as a SENTENCE first (\"A page is a physical component that makes up a book\") before evaluating any answer option - this precise verbalization step is exactly what prevents picking an option that's merely TOPICALLY similar (both words relate to books, say) rather than one sharing the identical STRUCTURAL relationship (part-to-whole specifically).",
      keyPoints: ["Explicitly name the relationship in the given pair as a full sentence before scanning answer options - vague topical similarity is not enough", "Common categories: part-to-whole, function/purpose, cause-effect, worker-tool, category-member, degree/intensity", "The correct answer must share the exact same STRUCTURAL relationship, not just a similar general topic"],
      commonMistakes: ["Picking an answer option that's topically related to the original pair (both about the same subject area) rather than one sharing the precise same structural relationship", "Failing to explicitly verbalize the relationship first, leading to a vague, unreliable \"gut feeling\" match instead of a precise, verifiable one"],
      interviewTips: ["Practice explicitly stating the relationship in a full sentence for 5-6 analogy pairs before ever looking at answer options, until this verbalization habit becomes automatic"],
      realWorldApplications: ["Precisely identifying structural relationships (not just surface similarity) is a genuinely transferable critical-thinking skill relevant to categorization and pattern-based reasoning broadly"],
      mcqs: [
        { question: "PEN is to WRITE as KNIFE is to:", options: ["Kitchen", "Cut", "Sharp", "Metal"], correctIndex: 1 },
        { question: "What should you do before evaluating analogy answer options?", options: ["Pick the most topically similar option immediately", "Explicitly state the relationship in the given pair as a full sentence first", "Guess based on which word sounds nicer", "Always pick the first option"], correctIndex: 1 },
      ],
      goingDeeper: "Some harder analogy questions use a DOUBLE relationship (two distinct, layered relationships must both hold simultaneously between the pairs) - genuinely worth checking a candidate answer against BOTH layers of relationship, not just the first, more obvious one you notice.",
      assignment: "For the pair 'Doctor : Hospital', explicitly write out the relationship as a full sentence, then find and justify a second word pair sharing that exact same relationship.",
      xpReward: 15, coinReward: 5,
    },
    questions: [
      q("BOOK is to PAGE as TREE is to:", ["Forest", "Leaf", "Root", "Branch"], 1, "Easy", "A page is a part that makes up a book; a leaf is a part that makes up a tree - part-to-whole relationship.", ["Analogies"]),
      q("DOCTOR is to HOSPITAL as TEACHER is to:", ["Student", "Book", "School", "Classroom"], 2, "Easy", "A doctor works at a hospital; a teacher works at a school - workplace relationship.", ["Analogies"]),
      q("FIRE is to SMOKE as RAIN is to:", ["Cloud", "Flood", "Water", "Storm"], 1, "Medium", "Fire causes smoke; rain (in excess) causes flood - cause-effect relationship.", ["Analogies"]),
      q("WARM is to HOT as COOL is to:", ["Cold", "Mild", "Freezing", "Ice"], 0, "Medium", "Warm and hot are a lower and higher degree of the same temperature scale; cool and cold follow the same intensity pattern.", ["Analogies"]),
      q("AUTHOR is to BOOK as SCULPTOR is to:", ["Chisel", "Statue", "Marble", "Museum"], 1, "Easy", "An author creates a book; a sculptor creates a statue - creator-to-creation relationship.", ["Analogies"]),
    ],
  },
  {
    name: "Classification (Odd One Out)", isNew: true,
    lesson: {
      difficulty: "Beginner", estimatedMinutes: 15,
      whatYoullLearn: ["How to find the shared, hidden category connecting most items before identifying which one doesn't fit", "Why a superficial similarity can mislead you away from the genuinely correct grouping rule", "How numeric/letter classification differs slightly from word classification"],
      concept: "CLASSIFICATION (\"odd one out\") questions present a group of items where MOST share a hidden common CATEGORY or property, and ask you to find the ONE that genuinely doesn't belong - the genuine skill is first identifying the shared category correctly (looking at the MAJORITY of items, not just a pair), then checking each item against it.\n\nThe classic trap: a superficial similarity between two items can mislead you into pairing them together when the ACTUAL shared category is defined by something else entirely - for a group like \"Apple, Banana, Carrot, Mango\", the surface pattern \"these are all fruit-sounding words\" might tempt grouping all four together, but the genuinely correct classification recognizes Carrot is a VEGETABLE, not a fruit, making it the true odd one out - the other three share the specific, correct category (\"fruit\"), which Carrot genuinely doesn't belong to despite superficial word-list similarity.\n\nNUMBER/LETTER classification uses the exact same \"find the shared property\" logic, just applied to numeric or alphabetic properties instead of semantic categories - a numeric group might share \"all are prime numbers\" or \"all are perfect squares,\" with the odd one out being whichever number lacks that specific shared property.\n\nThe reliable technique: examine THREE OR MORE items first to identify the likely shared category (never just a pair, since two items can coincidentally share many superficial traits) - only once you have a category hypothesis from the majority should you test the REMAINING item(s) against it to confirm which one genuinely fails to fit.",
      keyPoints: ["Identify the shared category by examining 3+ items first (not just a pair, which can coincidentally match on many superficial traits), then test the remaining item(s) against it", "A superficial similarity (word-list topic, sound, spelling) can mislead you away from the genuinely correct, more specific shared category", "Number/letter classification uses the identical logic, just applied to numeric or alphabetic properties instead of semantic word categories"],
      commonMistakes: ["Identifying a shared category from just two items rather than the majority, leading to a superficially plausible but genuinely incorrect grouping rule", "Focusing on a surface-level similarity (all words relate to food) rather than the more specific, correct distinguishing category (fruit versus vegetable)"],
      interviewTips: ["Practice explicitly stating the identified shared category in words before selecting the odd one out, to force genuine precision rather than a vague gut-feeling elimination"],
      realWorldApplications: ["This exact skill (correctly identifying the precise shared property across a group, rather than a superficial one) directly mirrors real data categorization and quality-control anomaly-detection reasoning"],
      mcqs: [
        { question: "Find the odd one out: Apple, Banana, Carrot, Mango", options: ["Apple", "Banana", "Carrot", "Mango"], correctIndex: 2 },
        { question: "What is the reliable technique for identifying the shared category in a classification question?", options: ["Look at just any two items and assume that's the pattern", "Examine 3 or more items first to identify the likely shared category, then test the remaining item(s) against it", "Always pick the shortest word as the odd one out", "Guess randomly since there's no reliable method"], correctIndex: 1 },
      ],
      goingDeeper: "Some classification questions test a shared MATHEMATICAL property across numbers that superficially look unrelated (like all being expressible as a sum of two squares, or all being one less than a perfect square) - these require genuinely testing a few different numeric properties systematically rather than relying on an obvious visual pattern alone.",
      assignment: "Find the odd one out in this group and explain your reasoning explicitly: Triangle, Square, Circle, Rectangle - identify the shared property connecting three of them.",
      xpReward: 15, coinReward: 5,
    },
    questions: [
      q("Find the odd one out: Dog, Cat, Lion, Snake", ["Dog", "Cat", "Lion", "Snake"], 3, "Easy", "Dog, Cat, and Lion are all mammals; Snake is a reptile.", ["Classification"]),
      q("Find the odd one out: Circle, Square, Triangle, Sphere", ["Circle", "Square", "Triangle", "Sphere"], 3, "Medium", "Circle, Square, and Triangle are 2D shapes; Sphere is a 3D shape.", ["Classification"]),
      q("Find the odd one out: 3, 5, 7, 9", ["3", "5", "7", "9"], 3, "Easy", "3, 5, and 7 are prime numbers; 9 is not (9=3x3).", ["Classification", "Numbers"]),
      q("Find the odd one out: Guitar, Violin, Flute, Drum", ["Guitar", "Violin", "Flute", "Drum"], 2, "Medium", "Guitar, Violin, and Drum can all be considered non-wind (string/percussion) instruments; Flute is a wind instrument.", ["Classification"]),
      q("Find the odd one out: 16, 25, 36, 40", ["16", "25", "36", "40"], 3, "Medium", "16, 25, and 36 are all perfect squares (4^2, 5^2, 6^2); 40 is not.", ["Classification", "Numbers"]),
    ],
  },
  {
    name: "Statement & Assumption", isNew: true,
    lesson: {
      difficulty: "Intermediate", estimatedMinutes: 20,
      whatYoullLearn: ["The precise definition of an \"assumption\" as something implicitly taken for granted, not stated", "How to test whether a candidate assumption is genuinely IMPLICIT in the statement", "The genuine difference between an assumption and a mere inference"],
      concept: "STATEMENT AND ASSUMPTION questions present a statement (typically an action, decision, or advertisement) and ask you to determine whether given ASSUMPTIONS are IMPLICIT in it - an assumption is something the speaker/writer took for granted as TRUE without explicitly stating it, and WITHOUT WHICH the statement genuinely wouldn't make sense.\n\nThe genuinely reliable test for a candidate assumption: ask \"if this assumption were FALSE, would the statement still make logical sense?\" - if the statement would become illogical or pointless with the assumption false, the assumption IS genuinely implicit; if the statement remains perfectly sensible even without that assumption being true, it is NOT implicit (it's irrelevant, or a separate, unstated fact the statement doesn't actually depend on).\n\nA classic, concrete example: the statement \"The manager says, 'Submit your reports by Friday.'\" implicitly assumes the audience CAN understand and comply with this instruction (they can read, they have access to a way to submit) - this genuinely underlies the statement's making sense at all. It does NOT assume everyone WILL submit on time (that's a hoped-for outcome, not a taken-for-granted precondition the statement depends on) - correctly distinguishing between a genuine precondition and a mere hoped-for consequence is precisely the hardest, most tested distinction in this topic.\n\nADVERTISEMENT statements (\"Buy Brand X, the best in the market!\") typically assume the audience will find this appealing/is a genuine potential customer, and that the claim itself will be believed to at least some degree - these implicit marketing assumptions are a genuinely common, recurring pattern worth recognizing.",
      keyPoints: ["An assumption is something implicitly taken for granted, without which the statement wouldn't logically make sense - not merely a related fact", "Reliable test: if the candidate assumption were FALSE, would the statement still make sense? If no, it's genuinely implicit; if yes, it's not", "Distinguish a genuine implicit precondition from a merely hoped-for consequence or outcome - the single hardest, most tested distinction in this topic"],
      commonMistakes: ["Treating a hoped-for outcome or desirable consequence of the statement as if it were a genuine implicit precondition the statement logically depends on", "Assuming something the statement explicitly states already (which is a given fact, not an unstated assumption) counts as an assumption"],
      interviewTips: ["Practice the \"if this were false, would the statement still make sense\" test explicitly on 4-5 statements until distinguishing genuine assumptions from irrelevant options becomes reliable"],
      realWorldApplications: ["Identifying genuinely unstated, taken-for-granted assumptions underlying a claim or decision is foundational to rigorous critical thinking and evaluating real-world arguments/policy proposals"],
      mcqs: [
        { question: "What is the reliable test for whether a candidate assumption is genuinely implicit in a statement?", options: ["Whether it sounds plausible in general", "Whether the statement would still make logical sense if the assumption were false", "Whether it's mentioned anywhere in the statement explicitly", "Whether most people would agree with it"], correctIndex: 1 },
        { question: "What genuinely distinguishes an assumption from a hoped-for outcome?", options: ["They are the same thing", "An assumption is a precondition the statement depends on to make sense; a hoped-for outcome is merely a desired future result, not a logical precondition", "Assumptions are always false", "Hoped-for outcomes are always explicitly stated"], correctIndex: 1 },
      ],
      goingDeeper: "Statement and COURSE OF ACTION questions (a genuinely related but distinct format) ask whether a proposed action is a genuinely SENSIBLE, PRACTICAL response to a stated problem - these require evaluating practical feasibility and genuine relevance to the actual problem, rather than testing implicit logical preconditions the way assumption questions do.",
      assignment: "For the statement \"The company launched an online-only sales channel to reach customers,\" identify one genuine implicit assumption and one plausible-but-not-actually-implicit option, explaining the distinction using the false-test explicitly.",
      xpReward: 20, coinReward: 8,
    },
    questions: [
      q("Statement: 'Please switch off the lights when leaving the room.' Assumption: The lights are currently capable of being switched off. Is this assumption implicit?", ["Yes, the instruction wouldn't make sense otherwise", "No, it's irrelevant to the statement", "Cannot be determined", "The statement contradicts the assumption"], 0, "Medium", "If the lights couldn't be switched off at all, the instruction would be nonsensical - so this is a genuine implicit assumption.", ["Statement & Assumption"]),
      q("Statement: 'Join our gym for a healthier lifestyle!' Assumption: Some people are interested in becoming healthier. Is this assumption implicit?", ["Yes, the advertisement wouldn't make sense without at least some interested audience", "No, it's entirely irrelevant", "The statement explicitly states this already", "Cannot be determined at all"], 0, "Medium", "An advertisement targeting people who want to be healthier assumes at least some audience members genuinely want that - otherwise the appeal makes no sense.", ["Statement & Assumption"]),
      q("In the 'if this assumption were false, would the statement still make sense' test, what does it mean if the statement STILL makes sense even without the assumption?", ["It confirms the assumption is genuinely implicit", "It shows the statement doesn't actually depend on that assumption - it is NOT implicit", "The statement itself is invalid", "The test cannot be applied in this case"], 1, "Medium", "If the statement stays sensible even without the candidate assumption being true, the statement doesn't genuinely depend on it, so it isn't a real implicit assumption.", ["Statement & Assumption"]),
    ],
  },
];

async function main() {
  let topicsAdded = 0, questionsAdded = 0;
  const existingSnap = await db.collection("aptitude_topics").where("category", "==", "Logical").get();
  const currentCount = existingSnap.size;

  for (const t of TOPICS) {
    const topicRef = await db.collection("aptitude_topics").add({
      category: "Logical", name: t.name, description: t.lesson.whatYoullLearn[0] || "",
      status: "published", order: currentCount + topicsAdded, createdAt: admin.firestore.FieldValue.serverTimestamp(),
      difficulty: t.lesson.difficulty, estimatedMinutes: t.lesson.estimatedMinutes,
      whatYoullLearn: t.lesson.whatYoullLearn, concept: t.lesson.concept, keyPoints: t.lesson.keyPoints,
      commonMistakes: t.lesson.commonMistakes, interviewTips: t.lesson.interviewTips, realWorldApplications: t.lesson.realWorldApplications,
      mcqs: t.lesson.mcqs, goingDeeper: t.lesson.goingDeeper, assignment: t.lesson.assignment,
      xpReward: t.lesson.xpReward, coinReward: t.lesson.coinReward,
    });
    topicsAdded++;
    for (let qi = 0; qi < t.questions.length; qi++) {
      await topicRef.collection("questions").add({ ...t.questions[qi], order: qi, createdAt: admin.firestore.FieldValue.serverTimestamp() });
      questionsAdded++;
    }
  }

  console.log(`Logical (batch 2): ${topicsAdded} topics added, ${questionsAdded} questions added.`);
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
