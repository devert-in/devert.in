import admin from "firebase-admin";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(join(__dirname, "service-account.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

function q(question, options, correctIndex, difficulty, explanation, tags) {
  return { question, options, correctIndex, difficulty, marks: 1, explanation, tags: tags || [], attemptCount: 0, correctCount: 0, totalTimeSec: 0, estimatedTimeSec: 45, companies: [], examTags: [] };
}

const TOPICS = [
  {
    name: "One-Word Substitution", isNew: true,
    lesson: {
      difficulty: "Beginner", estimatedMinutes: 15,
      whatYoullLearn: ["Why one-word substitution genuinely tests precise vocabulary depth, not just general knowledge", "How to build a mental category system (people-who, places-where, fear-of) to organize these words", "Why the exact precise word matters more than a roughly-similar phrase"],
      concept: "ONE-WORD SUBSTITUTION asks you to replace a descriptive PHRASE with the single, precise WORD that means exactly the same thing - the genuine skill is having a broad vocabulary of these specific \"compressed\" words, since there's frequently no way to derive the exact word purely from logic if you've never encountered it before.\n\nThe most reliable way to build genuine fluency here is organizing these words into recurring CATEGORY patterns, since exam questions repeatedly draw from the same few structural categories: \"A PERSON WHO...\" words (a person who loves books = BIBLIOPHILE; a person who can speak many languages = POLYGLOT); \"A PLACE WHERE...\" words (a place where animals are kept for public viewing = ZOO... or more precisely, a place where books are kept = LIBRARY); \"FEAR OF...\" words (fear of heights = ACROPHOBIA; fear of enclosed spaces = CLAUSTROPHOBIA); \"STUDY OF...\" words (study of ancient things = ARCHAEOLOGY; study of living organisms = BIOLOGY).\n\nGenuinely worth internalizing: the correct answer must be the SINGLE PRECISE WORD, not merely a roughly-similar phrase or a near-synonym that captures only PART of the original phrase's meaning - \"a person who studies ancient artifacts\" and \"a person who studies antiques as a hobby\" sound similar but map to genuinely different precise words (archaeologist versus antiquarian respectively) - the exact, complete meaning must match.",
      keyPoints: ["One-word substitution tests genuinely precise vocabulary depth - there's frequently no way to derive the correct word purely from logic if you haven't encountered it before", "Organize these words into recurring category patterns (person-who, place-where, fear-of, study-of) since exam questions repeatedly draw from these same structural categories", "The answer must be the single, PRECISE word matching the phrase's complete meaning - not a roughly similar phrase or a partial-meaning near-synonym"],
      commonMistakes: ["Selecting a word that captures only PART of the original phrase's meaning, rather than the single precise word matching it completely", "Confusing two similar-sounding precise words that actually belong to genuinely different, specific meanings (like archaeologist versus antiquarian)"],
      interviewTips: ["Actively build a personal list of one-word-substitution words organized by category (person-who, place-where, fear-of, study-of) as you encounter new ones, rather than trying to memorize them as one giant unordered list"],
      realWorldApplications: ["Precise vocabulary depth genuinely improves concise, clear professional writing - being able to replace a wordy phrase with one precise word is a genuinely practical writing skill"],
      mcqs: [
        { question: "What is the one word for 'a person who loves and collects books'?", options: ["Librarian", "Bibliophile", "Author", "Publisher"], correctIndex: 1 },
        { question: "What is the one word for 'fear of enclosed spaces'?", options: ["Acrophobia", "Claustrophobia", "Arachnophobia", "Xenophobia"], correctIndex: 1 },
      ],
      goingDeeper: "Some one-word-substitution questions test words for specific PROFESSIONS/ROLES with a genuinely precise scope (a person who repairs watches = HOROLOGIST specifically, not just \"repairman\") - these genuinely require the exact specialized term, since a general substitute word wouldn't capture the specific professional scope being tested.",
      assignment: "Look up and list 5 new one-word substitution words you didn't already know, organized by the person-who/place-where/fear-of/study-of category system.",
      xpReward: 15, coinReward: 5,
    },
    questions: [
      q("What is the one word for 'a person who can speak many languages'?", ["Linguist", "Polyglot", "Translator", "Interpreter"], 1, "Medium", "A polyglot specifically means a person who knows and can speak multiple languages.", ["One-Word Substitution"]),
      q("What is the one word for 'a person who studies ancient artifacts and civilizations'?", ["Historian", "Archaeologist", "Anthropologist", "Geologist"], 1, "Medium", "An archaeologist specifically studies ancient artifacts and past civilizations through excavation and physical remains.", ["One-Word Substitution"]),
      q("What is the one word for 'handwriting that cannot be read'?", ["Illiterate", "Illegible", "Incomprehensible", "Indecisive"], 1, "Easy", "Illegible specifically means writing that cannot be deciphered or read.", ["One-Word Substitution"]),
      q("What is the one word for 'a word that can be read the same forwards and backwards'?", ["Synonym", "Palindrome", "Acronym", "Homonym"], 1, "Medium", "A palindrome (like 'level' or 'madam') reads identically in both directions.", ["One-Word Substitution"]),
      q("What is the one word for 'a person who is new to a job or activity'?", ["Veteran", "Novice", "Expert", "Amateur"], 1, "Easy", "A novice is specifically someone new/inexperienced at a particular activity.", ["One-Word Substitution"]),
    ],
  },
  {
    name: "Active & Passive Voice", isNew: true,
    lesson: {
      difficulty: "Intermediate", estimatedMinutes: 20,
      whatYoullLearn: ["The precise mechanical rule for converting an active sentence to passive (and back)", "Why the verb tense must be preserved correctly through the conversion, not just the subject/object swap", "Which sentence types genuinely cannot be converted to passive voice at all"],
      concept: "ACTIVE VOICE has the SUBJECT performing the action directly (\"The chef cooked the meal\" - chef is the subject doing the cooking). PASSIVE VOICE flips this: the OBJECT of the active sentence becomes the new SUBJECT, and the original subject moves into a \"by [agent]\" phrase (often OMITTED entirely if not genuinely important): \"The meal was cooked by the chef.\"\n\nThe precise MECHANICAL conversion rule, worth internalizing exactly: (1) the active sentence's OBJECT becomes the passive sentence's SUBJECT; (2) the verb changes to a form of \"to be\" (is/was/were/has been, matching the ORIGINAL tense) PLUS the main verb's PAST PARTICIPLE form (cooked, written, taken); (3) the active sentence's original SUBJECT moves into an optional \"by + agent\" phrase at the end.\n\nTENSE PRESERVATION is a genuinely critical, frequently-tested detail: the passive version must use the SAME tense as the original active sentence - \"cooks\" (present) becomes \"is cooked\" (present passive); \"cooked\" (past) becomes \"was cooked\" (past passive); \"will cook\" (future) becomes \"will be cooked\" (future passive) - incorrectly shifting the tense during conversion is a genuinely common, specific error.\n\nSome sentence types genuinely CANNOT be converted to passive voice at all: sentences with INTRANSITIVE verbs (verbs with no direct object, like \"He sleeps\" - there's simply no object available to promote into a passive subject), and sentences already IN a state-of-being/existence construction (\"She is happy\") - recognizing these genuine exceptions prevents forcing an unnatural, incorrect passive conversion where none should exist.",
      keyPoints: ["Active-to-passive conversion: the object becomes the new subject, the verb becomes 'to be' (matching original tense) + past participle, the original subject becomes an optional 'by' phrase", "The passive version must preserve the EXACT same tense as the original active sentence - a common, specific error is shifting tense during conversion", "Intransitive-verb sentences (no direct object, like 'He sleeps') genuinely cannot be converted to passive voice at all - there's no object to promote"],
      commonMistakes: ["Shifting the verb tense during active-to-passive conversion instead of precisely preserving the original sentence's tense", "Attempting to force a passive conversion on an intransitive-verb sentence that genuinely has no object available to become the new subject"],
      interviewTips: ["Practice the exact mechanical 3-step conversion (object becomes subject, verb becomes be+past-participle matching tense, subject becomes optional by-phrase) on sentences across different tenses until it's fully automatic"],
      realWorldApplications: ["Choosing between active and passive voice deliberately (active for directness/clarity, passive when the agent is unknown or genuinely unimportant) is a genuinely practical professional and technical writing skill"],
      mcqs: [
        { question: "Convert to passive voice: 'The manager approved the proposal.'", options: ["The proposal approves the manager.", "The proposal was approved by the manager.", "The proposal is approving the manager.", "The manager was approved by the proposal."], correctIndex: 1 },
        { question: "Which sentence type genuinely cannot be converted to passive voice?", options: ["Sentences with a direct object", "Sentences with an intransitive verb (no direct object at all)", "Sentences in the past tense", "Sentences with a proper noun subject"], correctIndex: 1 },
      ],
      goingDeeper: "Sentences with an INDIRECT object as well as a direct object (\"The teacher gave the students homework\") can genuinely form TWO different valid passive versions, depending on which object is promoted to subject: \"The students were given homework by the teacher\" OR \"Homework was given to the students by the teacher\" - both are grammatically correct, just emphasizing a different element of the original sentence.",
      assignment: "Convert the following active sentence to passive voice, explicitly preserving its tense: 'The company will launch the new product next month.'",
      xpReward: 20, coinReward: 8,
    },
    questions: [
      q("Convert to passive voice: 'The cat chased the mouse.'", ["The mouse chases the cat.", "The mouse was chased by the cat.", "The mouse is chased by the cat.", "The cat was chased by the mouse."], 1, "Easy", "Past tense active becomes past tense passive: 'was chased', with the object (mouse) becoming the new subject.", ["Active & Passive Voice"]),
      q("Convert to passive voice: 'She is writing a letter.'", ["A letter is written by her.", "A letter was written by her.", "A letter is being written by her.", "A letter writes her."], 2, "Medium", "Present continuous ('is writing') becomes present continuous passive: 'is being written'.", ["Active & Passive Voice"]),
      q("Which of these sentences CANNOT be converted to passive voice?", ["The chef prepared the dish.", "He sleeps early every night.", "The teacher explained the lesson.", "They built the bridge."], 1, "Medium", "'Sleeps' is intransitive (no direct object), so there's nothing to promote into a passive subject.", ["Active & Passive Voice"]),
      q("Convert to passive voice: 'They will complete the project by Friday.'", ["The project completes them by Friday.", "The project will be completed by them by Friday.", "The project is completed by them by Friday.", "The project was completed by them by Friday."], 1, "Medium", "Future tense ('will complete') becomes future passive: 'will be completed', preserving the original tense.", ["Active & Passive Voice"]),
    ],
  },
  {
    name: "Idioms & Phrases", isNew: true,
    lesson: {
      difficulty: "Beginner", estimatedMinutes: 15,
      whatYoullLearn: ["Why an idiom's meaning genuinely cannot be derived from its literal, individual words", "How to correctly infer an unfamiliar idiom's meaning from surrounding context when possible", "A core set of the most frequently-tested idioms worth memorizing directly"],
      concept: "An IDIOM is a fixed phrase whose actual, genuine meaning is completely different from what its individual words would literally suggest - \"kick the bucket\" genuinely means \"to die,\" with absolutely no literal connection to kicking or buckets - this is precisely why idioms cannot be reliably decoded through logic or root-word analysis (unlike vocabulary words with genuine Latin/Greek roots); they must be directly LEARNED and recognized.\n\nWhen an idiom's meaning is genuinely unfamiliar, the best available strategy is examining the surrounding SENTENCE CONTEXT for clues about the general emotional tone or situation being described - even without knowing the precise idiom, context frequently narrows down whether it's describing something positive, negative, urgent, or relaxed, which can help eliminate obviously-wrong answer options even under genuine uncertainty.\n\nA core set of frequently-tested idioms worth having directly memorized: \"BREAK THE ICE\" (to initiate conversation in an awkward/tense social situation); \"BITE THE BULLET\" (to face a difficult situation with courage, enduring something unpleasant); \"HIT THE NAIL ON THE HEAD\" (to describe something with complete precision/accuracy); \"LET THE CAT OUT OF THE BAG\" (to accidentally reveal a secret); \"COST AN ARM AND A LEG\" (to be extremely expensive).",
      keyPoints: ["An idiom's genuine meaning is completely different from its literal, individual words - it cannot be derived through logic, only directly learned and recognized", "When an idiom is genuinely unfamiliar, use surrounding sentence context to narrow down the general emotional tone (positive/negative/urgent) to eliminate obviously wrong options", "Build direct familiarity with a core set of frequently-tested idioms (break the ice, bite the bullet, hit the nail on the head, let the cat out of the bag, cost an arm and a leg)"],
      commonMistakes: ["Attempting to derive an idiom's meaning from its literal individual words, which genuinely doesn't work for true idioms by definition", "Ignoring available sentence context that could help narrow down an unfamiliar idiom's general meaning/tone even without knowing it directly"],
      interviewTips: ["Actively build a personal list of idioms as you encounter new ones in reading, since there's genuinely no shortcut around direct memorization/exposure for this specific topic"],
      realWorldApplications: ["Idiomatic fluency genuinely matters for natural-sounding professional communication and for correctly understanding native-speaker colloquial speech in real workplace conversations"],
      mcqs: [
        { question: "What does the idiom 'break the ice' mean?", options: ["To literally break frozen water", "To initiate conversation in an awkward or tense social situation", "To end a friendship", "To cool down a heated argument"], correctIndex: 1 },
        { question: "Why can't an idiom's meaning generally be derived from its literal individual words?", options: ["Idioms always use made-up words", "An idiom's actual meaning is, by definition, completely different from what its literal words would suggest", "Idioms are always grammatically incorrect", "Idioms only exist in formal writing"], correctIndex: 1 },
      ],
      goingDeeper: "Some idioms have genuinely interesting, traceable historical origins (\"bite the bullet\" is said to originate from soldiers literally biting on a bullet to endure pain during battlefield surgery without anesthesia) - while not strictly necessary for test performance, knowing an idiom's origin story can genuinely make it dramatically easier to remember and correctly recall under pressure.",
      assignment: "List 5 common English idioms you already know, write their literal words versus their actual figurative meaning side by side, and use each correctly in an original sentence.",
      xpReward: 15, coinReward: 5,
    },
    questions: [
      q("What does 'bite the bullet' mean?", ["To eat something hard", "To face a difficult situation with courage, enduring something unpleasant", "To get injured", "To argue aggressively"], 1, "Medium", "The idiom means to bravely endure a painful or difficult situation.", ["Idioms & Phrases"]),
      q("What does 'let the cat out of the bag' mean?", ["To release a pet", "To accidentally reveal a secret", "To make a mistake in cooking", "To escape from a difficult situation"], 1, "Easy", "The idiom means to accidentally or prematurely reveal secret information.", ["Idioms & Phrases"]),
      q("What does 'cost an arm and a leg' mean?", ["To be physically injured", "To be extremely expensive", "To require hard physical labor", "To be completely free"], 1, "Easy", "The idiom means something is very costly or expensive.", ["Idioms & Phrases"]),
      q("What does 'hit the nail on the head' mean?", ["To make a construction error", "To describe something with complete precision or accuracy", "To hurt oneself accidentally", "To argue about something trivial"], 1, "Medium", "The idiom means to describe or identify something exactly correctly.", ["Idioms & Phrases"]),
    ],
  },
];

async function main() {
  let topicsAdded = 0, questionsAdded = 0;
  const existingSnap = await db.collection("aptitude_topics").where("category", "==", "Verbal").get();
  const currentCount = existingSnap.size;

  for (const t of TOPICS) {
    const topicRef = await db.collection("aptitude_topics").add({
      category: "Verbal", name: t.name, description: t.lesson.whatYoullLearn[0] || "",
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

  console.log(`Verbal (batch 2): ${topicsAdded} topics added, ${questionsAdded} questions added.`);
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
