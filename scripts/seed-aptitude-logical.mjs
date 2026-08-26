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
    name: "Coding-Decoding", isNew: true,
    lesson: {
      difficulty: "Beginner", estimatedMinutes: 15,
      whatYoullLearn: ["How letter-shift coding works and how to reverse-engineer the shift rule", "How to decode word/number substitution patterns systematically", "Why testing your discovered rule against a SECOND example is essential before trusting it"],
      concept: "Coding-Decoding tests your ability to reverse-engineer a HIDDEN, CONSISTENT rule from one or more worked examples, then apply that exact same rule to a new case - the genuine skill is systematic PATTERN-FINDING, not any specialized knowledge.\n\nLETTER-SHIFT coding is the most common pattern: each letter in the original word is shifted by a FIXED number of positions in the alphabet to produce the coded word (if 'CAT' codes to 'DBU', each letter shifted forward by exactly 1: C→D, A→B, T→U) - to reverse-engineer the shift amount, pick ANY single letter pair from the example and count the alphabet distance between them, then verify that SAME shift amount consistently explains every other letter pair in the example too.\n\nWORD/NUMBER SUBSTITUTION coding assigns each word (or letter) in a hidden \"code language\" to a specific, fixed replacement word (or symbol/number) - solving these requires comparing MULTIPLE coded sentences that share a common word, to isolate exactly which code-word corresponds to which real word (a classic technique: if \"cat sits high\" codes to \"pit sar dom\" and \"cat runs fast\" codes to \"pit tuv kon\", the shared word \"cat\" must correspond to the shared code-word \"pit\").\n\nThe single most important discipline in this topic, worth stating explicitly: ALWAYS verify a discovered rule against a SECOND example (or a second letter/word within the same example) before trusting it and applying it to the actual question - a rule that happens to fit only the FIRST letter pair you checked might be coincidental, not the genuine underlying pattern.",
      keyPoints: ["Letter-shift coding shifts every letter by the same fixed alphabet distance - find the shift from one letter pair, then verify it against every other letter in the example before trusting it", "Word/number substitution coding assigns fixed replacements - compare multiple coded sentences sharing a common word to isolate which code-word matches which real word", "Always verify a discovered rule against a second data point before applying it - a rule based on just one letter pair might be coincidental, not the genuine pattern"],
      commonMistakes: ["Assuming a rule is correct after checking only ONE letter/word pair, without verifying it against the rest of the example - a genuinely common source of wrong answers in this topic", "Missing that a coding rule might involve alphabet POSITION arithmetic (not a simple shift) - like each letter's numeric position being reversed (A=1 becomes Z=26's position instead)"],
      interviewTips: ["Practice the discipline of verifying a discovered rule against a second letter/word pair EVERY time, even when the first pair's pattern seems obvious - this single habit prevents most careless errors in this topic"],
      realWorldApplications: ["The core skill here (reverse-engineering a consistent rule from examples, then applying it) directly mirrors real pattern-recognition and debugging skills used in programming and data analysis"],
      mcqs: [
        { question: "If CAT is coded as DBU, what is the coding rule?", options: ["Each letter shifted back by 1", "Each letter shifted forward by 1", "Letters reversed", "No consistent rule"], correctIndex: 1 },
        { question: "What is the single most important discipline when solving a coding-decoding problem?", options: ["Guessing based on the first letter alone", "Verifying a discovered rule against a second example/letter before trusting it", "Always assuming a shift of exactly 1", "Ignoring numbers entirely"], correctIndex: 1 },
      ],
      goingDeeper: "Some coding schemes use a genuinely different transformation entirely - like each letter being replaced by the letter a FIXED number of positions AWAY in the REVERSE alphabet direction (A pairs with Z, B with Y, and so on, a scheme sometimes called Atbash-style) - worth knowing this exists as a genuinely different pattern family from simple forward/backward shifts, so an unfamiliar-looking example shouldn't be assumed impossible.",
      assignment: "If DOG is coded as EPH, decode the word that would result from applying the identical rule to the word CAT.",
      xpReward: 15, coinReward: 5,
    },
    questions: [
      q("If BOOK is coded as CPPL, what is the coding rule?", ["Each letter shifted forward by 1", "Each letter shifted back by 1", "Letters reversed", "Vowels and consonants swapped"], 0, "Easy", "B->C, O->P, O->P, K->L - each letter shifted forward by exactly 1 position.", ["Coding-Decoding"]),
      q("If in a code language, 'RAIN' is written as 'SBJO', how is 'SNOW' written?", ["TOPX", "TOPY", "UPQX", "TPQX"], 0, "Medium", "Each letter shifts forward by 1: S->T, N->O, O->P, W->X, giving TOPX.", ["Coding-Decoding"]),
      q("In a code, 'cat sits high' is 'pit sar dom' and 'cat runs fast' is 'pit tuv kon'. What does 'pit' represent?", ["sits", "cat", "runs", "high"], 1, "Medium", "\"pit\" is the common code word appearing in both coded sentences, matching the common real word \"cat\" in both original sentences.", ["Coding-Decoding"]),
      q("If Z=1, Y=2, X=3, and so on, what number represents the letter C?", ["3", "23", "24", "26"], 2, "Medium", "This is a reverse-alphabet numbering: A=26, B=25, C=24.", ["Coding-Decoding"]),
      q("If 3+4=25, 5+6=61, what does 7+8=?", ["106", "113", "121", "98"], 1, "Hard", "The hidden rule is a^2+b^2: 3^2+4^2=9+16=25 checks out, and 5^2+6^2=25+36=61 checks out, so 7^2+8^2=49+64=113.", ["Coding-Decoding"]),
    ],
  },
  {
    name: "Blood Relations", isNew: true,
    lesson: {
      difficulty: "Intermediate", estimatedMinutes: 20,
      whatYoullLearn: ["How to build a family tree diagram systematically from a chain of relationship statements", "The precise gender-dependent meaning of relationship terms (like \"sibling's son\" versus \"sibling's daughter\")", "How to handle relationship chains involving \"in-law\" and step-relationships correctly"],
      concept: "Blood Relations problems test whether you can correctly build a MENTAL (or hand-drawn) FAMILY TREE from a sequence of relationship statements, then correctly read off a relationship between two specific people in that tree - the genuine skill is systematic diagramming, not memorizing relationship vocabulary (though precise vocabulary matters too).\n\nThe single most reliable technique: draw an ACTUAL family tree diagram as you read each statement, rather than trying to hold the whole chain in your head - use generation LEVELS (grandparents on top, parents in the middle, children at the bottom) and clearly mark GENDER (circles for female, squares for male, or simply \"M\"/\"F\" labels) for every person as you add them, updating the diagram incrementally with each new statement rather than re-reading the whole passage from scratch each time.\n\nRELATIONSHIP TERMS have genuinely precise, gender-dependent meanings worth knowing cold: your parent's sibling's child is your COUSIN (regardless of anyone's gender); your sibling's son is your NEPHEW, your sibling's daughter is your NIECE; your spouse's sibling is your BROTHER-IN-LAW or SISTER-IN-LAW; your sibling's spouse is ALSO your brother/sister-in-law - genuinely worth having memorized precisely, since these exact terms appear directly in the ANSWER OPTIONS of most problems.\n\nCODED/SYMBOLIC blood relation problems (where relationships are given as symbols, like \"A + B\" meaning \"A is B's mother\") require the exact same family-tree-building technique, just translating each symbol into its real relationship meaning FIRST, before drawing the diagram.",
      keyPoints: ["Draw an actual family tree diagram incrementally as you read each statement, using generation levels and gender markers - don't try to hold the whole chain in your head", "Nephew/niece (sibling's son/daughter), cousin (parent's sibling's child), and in-law terms (spouse's sibling, sibling's spouse) have precise, commonly-tested meanings worth memorizing exactly", "Symbolic/coded blood relation problems (using +, -, x for relationships) require translating each symbol to its real relationship meaning first, then building the family tree the same way"],
      commonMistakes: ["Trying to solve a multi-statement blood relation problem entirely in your head without drawing any diagram, leading to genuine confusion partway through a longer chain", "Confusing nephew/niece and cousin - a sibling's child is a nephew/niece; a parent's sibling's child is a cousin, a genuinely different generational relationship"],
      interviewTips: ["Practice quickly sketching a simple family-tree diagram (levels + gender markers) for a 3-4 statement chain until it's fully automatic - this single habit dramatically reduces errors under time pressure"],
      realWorldApplications: ["This topic's core skill (systematically tracking multi-step relationships from stated facts) directly mirrors reasoning about organizational hierarchies or genealogy research in genuinely practical contexts"],
      mcqs: [
        { question: "A's mother is B. B's brother is C. What is C to A?", options: ["Father", "Uncle", "Grandfather", "Brother"], correctIndex: 1 },
        { question: "What is a sibling's daughter called?", options: ["Cousin", "Niece", "Aunt", "Sister-in-law"], correctIndex: 1 },
      ],
      goingDeeper: "POINTING-AT problems (\"Pointing to a photograph, X says 'she is the daughter of my grandfather's only son'\") require carefully working out that \"my grandfather's only son\" is X's OWN father (assuming X is male and has no brothers) BEFORE determining the final relationship - these multi-layer indirect-reference problems are genuinely the hardest variant in this topic, precisely because they require correctly resolving an intermediate relationship before the final one can even be stated.",
      assignment: "A is B's father. B is C's sister. D is C's son. What is A to D? Draw out the family tree diagram explicitly and state the final relationship.",
      xpReward: 20, coinReward: 8,
    },
    questions: [
      q("Pointing to a photo, Ravi says, 'She is the daughter of my grandfather's only son.' Who is she to Ravi?", ["Mother", "Sister", "Cousin", "Aunt"], 1, "Medium", "Ravi's grandfather's only son is Ravi's own father (assuming Ravi has no paternal uncles), so the woman is his father's daughter - his sister.", ["Blood Relations"]),
      q("A is the son of B. C is B's mother. What is C to A?", ["Mother", "Aunt", "Grandmother", "Sister"], 2, "Easy", "C is A's father's/mother's (B's) mother, making C A's grandmother.", ["Blood Relations"]),
      q("A's father is B's brother, and C is B's daughter. What is the relationship between A and C?", ["Siblings", "Cousins", "Uncle and niece", "Aunt and nephew"], 1, "Medium", "A's father and B are siblings, making A and C (B's daughter) first cousins.", ["Blood Relations"]),
      q("Pointing to a man, a woman says, 'His mother is the only daughter of my mother.' How is the woman related to the man?", ["Mother", "Sister", "Aunt", "Grandmother"], 0, "Hard", "\"The only daughter of my mother\" is the woman herself, so the man's mother IS the woman - she is his mother.", ["Blood Relations"]),
      q("A + B means A is the father of B. A - B means A is the sister of B. If P + Q - R, what is P to R?", ["Father", "Mother", "Uncle", "Grandfather"], 0, "Medium", "P is Q's father, and Q is R's sister - since Q and R share the same father, P is also R's father.", ["Blood Relations", "Coded Relations"]),
    ],
  },
  {
    name: "Direction Sense", isNew: true,
    lesson: {
      difficulty: "Beginner", estimatedMinutes: 15,
      whatYoullLearn: ["How to track position and orientation through a sequence of movements and turns", "The precise meaning of \"left turn\" and \"right turn\" relative to your current facing direction", "How to compute final displacement using the Pythagorean theorem when needed"],
      concept: "Direction Sense problems test whether you can accurately track BOTH your current POSITION and your current FACING DIRECTION through a sequence of movements and turns - genuinely two separate things to track simultaneously, which is precisely where most errors in this topic actually happen.\n\nThe critical, easy-to-get-wrong rule: LEFT and RIGHT turns are always relative to your CURRENT facing direction, not the fixed compass (a \"right turn\" while facing North means you now face East; but the exact same \"right turn\" while facing East means you now face South) - this is precisely why you must update your facing direction with EVERY single turn instruction, in the correct sequential order, never assuming turns are relative to a fixed compass direction.\n\nThe standard, reliable technique: treat every problem as coordinate-plane movement - start at the origin (0,0), facing a stated (or assumed default \"North\") direction, and for each movement instruction, update your (x,y) position based on your CURRENT facing direction, then update your facing direction for any turn instruction, strictly in the order given - this converts the entire problem into simple coordinate tracking, removing any need to visualize turns purely in your head.\n\nFINAL DISPLACEMENT (the straight-line, \"as the crow flies\" distance from start to end point, as opposed to the total distance actually walked) is computed via the PYTHAGOREAN THEOREM once you know your final (x,y) coordinates relative to the start: `displacement = sqrt(x^2 + y^2)` - genuinely different from simply summing up every individual movement's distance.",
      keyPoints: ["Track both current position AND current facing direction through the sequence - left/right turns are always relative to your current facing direction, not a fixed compass", "The reliable technique: treat the problem as coordinate-plane movement, updating (x,y) position based on current facing direction, then updating facing direction for each turn, strictly in sequence", "Final displacement (straight-line distance from start to end) uses the Pythagorean theorem on final (x,y) coordinates - genuinely different from the total distance actually walked"],
      commonMistakes: ["Treating \"left\" and \"right\" turns as relative to a fixed compass direction rather than your current facing direction at that point in the sequence", "Confusing total distance walked with final displacement (straight-line distance from start to end) - these are genuinely different quantities unless the path is a single straight line"],
      interviewTips: ["Practice explicitly tracking (x,y) coordinates and a facing-direction variable through a 4-5 step movement sequence until the coordinate-based technique is fully automatic"],
      realWorldApplications: ["This topic's core skill (tracking position and orientation through sequential relative instructions) directly mirrors real navigation systems and robotics motion-planning logic"],
      mcqs: [
        { question: "Facing North, you take a right turn. Which direction do you now face?", options: ["North", "South", "East", "West"], correctIndex: 2 },
        { question: "What does 'final displacement' mean, as distinct from total distance walked?", options: ["The exact same thing as total distance walked", "The straight-line distance from the starting point to the ending point", "The number of turns made", "The total time taken"], correctIndex: 1 },
      ],
      goingDeeper: "Some direction-sense problems specify movements using CLOCK-FACE directions instead of compass directions (\"walks toward 3 o'clock\") - these translate directly to compass equivalents (3 o'clock = East, 6 o'clock = South, 9 o'clock = West, 12 o'clock = North, with intermediate clock positions mapping to the corresponding intermediate compass directions) - worth recognizing this is just a different notation for the same underlying direction-tracking skill.",
      assignment: "A person walks 5km North, turns right and walks 3km, turns right again and walks 5km. What is their final displacement from the starting point? Show the coordinate tracking explicitly.",
      xpReward: 15, coinReward: 5,
    },
    questions: [
      q("A man walks 5km North, then turns right and walks 3km. Which direction is he now from his starting point (approximately)?", ["North-East", "North-West", "South-East", "South-West"], 0, "Easy", "5km North then 3km East (right turn from North) places him to the North-East of the start.", ["Direction Sense"]),
      q("Facing South, if you turn left, which direction do you now face?", ["North", "East", "West", "South"], 1, "Easy", "A left turn from South faces you East.", ["Direction Sense"]),
      q("A person walks 4km North, 3km East, then 4km South. What is their final displacement from the start?", ["3 km", "4 km", "7 km", "11 km"], 0, "Medium", "The North and South legs cancel out (4km North then 4km South returns to the same North-South position), leaving only the 3km East displacement.", ["Direction Sense"]),
      q("A man walks 6km East, then 8km North. What is his straight-line distance from the starting point?", ["10 km", "14 km", "12 km", "8 km"], 0, "Medium", "Using the Pythagorean theorem: sqrt(6^2+8^2) = sqrt(36+64) = sqrt(100) = 10 km.", ["Direction Sense", "Pythagorean Theorem"]),
      q("Facing East, you make two consecutive right turns. Which direction do you now face?", ["East", "West", "North", "South"], 1, "Medium", "First right turn from East faces South; second right turn from South faces West.", ["Direction Sense"]),
    ],
  },
  {
    name: "Syllogisms", isNew: true,
    lesson: {
      difficulty: "Intermediate", estimatedMinutes: 20,
      whatYoullLearn: ["How to correctly evaluate whether a conclusion NECESSARILY follows from given statements", "Why Venn diagrams are the single most reliable technique for this entire topic", "The genuinely important distinction between \"all,\" \"some,\" and \"no\" statements"],
      concept: "Syllogism problems test PURE LOGICAL VALIDITY - whether a stated CONCLUSION necessarily, unavoidably follows from given PREMISES, regardless of whether the statements are actually true in the real world (a syllogism problem might use a deliberately absurd premise like \"all cats are birds,\" and your job is purely to reason about what logically follows FROM that premise, not to object that it's factually false).\n\nVENN DIAGRAMS are genuinely the single most reliable technique for this entire topic - draw circles representing each category, and for each premise, draw the circles in EVERY possible valid configuration consistent with that statement (an \"All A are B\" premise genuinely allows several different circle arrangements, not just the most obvious one - A could be entirely inside B, or A and B could be exactly identical circles) - a conclusion is only NECESSARILY true if it holds across EVERY single possible valid diagram, not just the first, most intuitive one you happen to draw.\n\nThe THREE core statement types have genuinely precise meanings worth knowing exactly: \"ALL A are B\" means every member of A is also in B (though B might contain additional members not in A). \"SOME A are B\" means there's at least ONE overlapping member between A and B (but doesn't rule out that ALL of A might be B too - \"some\" doesn't logically exclude \"all\"). \"NO A are B\" means A and B have zero overlap whatsoever - completely separate circles.\n\nThe single most common trap in this entire topic: a conclusion that seems INTUITIVELY plausible or \"probably true in the real world\" is NOT the same as being LOGICALLY NECESSARY from the given premises - correctly rejecting a plausible-sounding-but-not-strictly-necessary conclusion is precisely the hardest, most genuinely tested skill here.",
      keyPoints: ["Syllogisms test pure logical validity - whether a conclusion necessarily follows from given premises, regardless of real-world truth - never object to a premise's factual accuracy", "Venn diagrams are the most reliable technique - draw EVERY possible valid configuration for each premise; a conclusion is only necessarily true if it holds across ALL of them, not just one intuitive diagram", "\"All A are B\", \"Some A are B\", and \"No A are B\" have precise meanings - \"some\" doesn't logically exclude \"all\" being true too, a frequently misunderstood point"],
      commonMistakes: ["Rejecting a syllogism's premise because it seems factually false in the real world, rather than reasoning purely about logical validity as the question actually requires", "Drawing only ONE possible Venn diagram configuration for an \"All\" or \"Some\" premise and concluding a conclusion is necessarily true, when a DIFFERENT valid configuration would actually make it false"],
      interviewTips: ["Be ready to explicitly draw out multiple valid Venn diagram configurations for a premise like \"Some A are B\" and show that a given conclusion fails to hold in at least one of them, disproving its necessity"],
      realWorldApplications: ["This topic's core discipline (evaluating logical validity independent of real-world plausibility) is genuinely foundational to formal logic, legal reasoning, and rigorous argument analysis in general"],
      mcqs: [
        { question: "In a syllogism problem, what should you do if a premise seems factually false in the real world?", options: ["Reject the whole problem as invalid", "Reason purely about logical validity based on the premise as given, regardless of its real-world truth", "Assume the premise is a typo and correct it", "Skip the question entirely"], correctIndex: 1 },
      ],
      goingDeeper: "\"SOME A are NOT B\" is a fourth, genuinely distinct statement type worth knowing precisely: it means at least one member of A is definitely outside B - but critically, it does NOT mean \"no A are B\" (some other members of A could still overlap with B) - correctly distinguishing this from a plain \"No A are B\" statement is a genuinely more advanced, frequently-tested distinction in harder syllogism problems.",
      assignment: "Statements: \"All pens are books. Some books are pencils.\" Does the conclusion \"Some pens are pencils\" necessarily follow? Draw the relevant Venn diagram configurations to justify your answer.",
      xpReward: 20, coinReward: 8,
    },
    questions: [
      q("Statements: All cats are dogs. All dogs are birds. Conclusion: All cats are birds. Does the conclusion follow?", ["Yes, it necessarily follows", "No, it does not follow", "Cannot be determined", "The premises are contradictory"], 0, "Medium", "Even though the premises are factually absurd, they logically chain: all cats being in dogs, and all dogs being in birds, necessarily means all cats are in birds.", ["Syllogisms"]),
      q("Statements: Some pens are books. Some books are pencils. Conclusion: Some pens are pencils. Does the conclusion follow?", ["Yes, it necessarily follows", "No, it does not necessarily follow", "The statements are contradictory", "Cannot be evaluated"], 1, "Hard", "The 'books' that are pens and the 'books' that are pencils might be entirely different, non-overlapping books - the conclusion isn't logically guaranteed.", ["Syllogisms"]),
      q("What does the statement 'No A are B' mean in a syllogism?", ["A and B are identical", "A and B have zero overlap whatsoever", "Some A are B", "All A are B"], 1, "Easy", "'No A are B' means the two categories have completely zero overlap.", ["Syllogisms"]),
      q("Does 'Some A are B' logically exclude the possibility that 'All A are B' is also true?", ["Yes, they are mutually exclusive", "No - 'some' is consistent with 'all' also being true; it just doesn't guarantee it", "Only sometimes, depending on context", "The question is not well-formed"], 1, "Medium", "'Some A are B' only asserts at least one overlap exists - it doesn't rule out that the overlap is actually total (all of A).", ["Syllogisms"]),
      q("Statements: All roses are flowers. No flowers are weeds. Conclusion: No roses are weeds. Does the conclusion follow?", ["Yes, it necessarily follows", "No, it does not follow", "Cannot be determined", "Only some roses are weeds"], 0, "Medium", "If all roses are flowers, and no flowers are weeds at all, then roses (being entirely within flowers) can have no overlap with weeds either.", ["Syllogisms"]),
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
      ...t.lesson,
    });
    topicsAdded++;
    for (let qi = 0; qi < t.questions.length; qi++) {
      await topicRef.collection("questions").add({ ...t.questions[qi], order: qi, createdAt: admin.firestore.FieldValue.serverTimestamp() });
      questionsAdded++;
    }
  }

  console.log(`Logical: ${topicsAdded} topics added, ${questionsAdded} questions added.`);
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
