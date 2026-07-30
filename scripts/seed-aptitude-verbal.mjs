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
    name: "Synonyms & Antonyms", isNew: true,
    lesson: {
      difficulty: "Beginner", estimatedMinutes: 15,
      whatYoullLearn: ["Why context, not just dictionary memorization, is essential for choosing the right synonym", "How to use root-word and prefix/suffix patterns to guess an unfamiliar word's meaning", "The genuine difference between a strict synonym and merely a \"related\" word"],
      concept: "SYNONYM/ANTONYM questions genuinely test VOCABULARY DEPTH, but the single most common, avoidable error isn't ignorance of a word's meaning - it's picking a merely RELATED word instead of the actual CLOSEST, most precise synonym. Many words have several \"somewhat similar\" options among the choices, but genuinely only ONE captures the PRECISE shade of meaning (connotation, intensity, formality) the original word carries - \"frugal\" and \"stingy\" are related (both about spending little) but genuinely differ in CONNOTATION (frugal is neutral-to-positive, stingy is negative) - a strict synonym question expects you to catch this precise distinction, not just rough topical similarity.\n\nROOT WORDS, PREFIXES, and SUFFIXES are genuinely the most reliable technique for an UNFAMILIAR word: many English words build from Latin/Greek roots with consistent meanings - \"bene-\" (good, as in benevolent, benefit), \"mal-\" (bad, as in malicious, malfunction), \"-phobia\" (fear of), \"-philia\" (love of) - recognizing a FAMILIAR root/prefix inside an unfamiliar word frequently lets you correctly infer its general meaning even without ever having seen that exact word before.\n\nCONTEXT genuinely matters even for synonym-only questions (with no surrounding sentence given) because many words are POLYSEMOUS (have multiple, genuinely different meanings depending on context) - \"grave\" can mean \"a burial place\" OR \"serious/solemn\" - a synonym question testing \"grave\" specifically needs you to recognize WHICH sense is actually being tested from the other answer options offered, since the correct synonym differs completely between the two senses.",
      keyPoints: ["The most common error is picking a merely RELATED word instead of the precise closest synonym - watch for connotation/intensity differences between similar-seeming options", "Recognizing familiar Latin/Greek roots, prefixes, and suffixes (bene-, mal-, -phobia, -philia) lets you infer an unfamiliar word's general meaning reliably", "Many words are polysemous (multiple distinct meanings) - use the other answer options to determine which specific sense of the word is actually being tested"],
      commonMistakes: ["Selecting a word that's topically related but carries a genuinely different connotation/intensity than the original word, rather than the precise closest match", "Assuming a word has only one meaning when it's genuinely polysemous, leading to choosing a synonym for the wrong sense of the word"],
      interviewTips: ["Build genuine vocabulary depth by actively noting connotation differences between near-synonyms you encounter (frugal vs stingy, confident vs arrogant) rather than treating them as interchangeable"],
      realWorldApplications: ["Precise vocabulary and connotation awareness directly improve professional writing and communication clarity, genuinely beyond just test performance"],
      mcqs: [
        { question: "What is the most common error in synonym questions?", options: ["Not knowing any vocabulary at all", "Picking a merely related word instead of the precise closest synonym, missing connotation differences", "Choosing the longest word available", "Always picking the first option"], correctIndex: 1 },
        { question: "What does the prefix 'mal-' generally indicate?", options: ["Good", "Bad", "Large", "Small"], correctIndex: 1 },
      ],
      goingDeeper: "ANTONYM questions occasionally test GRADABLE versus NON-GRADABLE opposites, a genuinely important distinction - \"hot\" and \"cold\" are gradable (there's a spectrum between them, \"lukewarm\"), while \"alive\" and \"dead\" are non-gradable (no genuine middle ground exists) - this distinction can matter when an answer option offers a \"partial\" opposite versus a genuinely complete, absolute one.",
      assignment: "List 5 pairs of near-synonym words (like frugal/stingy) and explicitly state the connotation difference between each pair.",
      xpReward: 15, coinReward: 5,
    },
    questions: [
      q("Choose the synonym of 'BENEVOLENT':", ["Cruel", "Kind and generous", "Indifferent", "Wealthy"], 1, "Easy", "Benevolent means well-meaning and kindly - the 'bene-' root means 'good'.", ["Synonyms"]),
      q("Choose the antonym of 'FRUGAL':", ["Thrifty", "Economical", "Extravagant", "Careful"], 2, "Easy", "Frugal means careful with spending; its opposite is extravagant (spending lavishly).", ["Antonyms"]),
      q("Choose the synonym of 'MALICIOUS':", ["Kind", "Spiteful", "Generous", "Neutral"], 1, "Medium", "Malicious means intending harm - 'mal-' indicates 'bad/harmful'.", ["Synonyms"]),
      q("Choose the word closest in meaning to 'CANDID':", ["Deceptive", "Frank and honest", "Confused", "Arrogant"], 1, "Medium", "Candid means truthful and straightforward, without evasion.", ["Synonyms"]),
      q("Choose the antonym of 'METICULOUS':", ["Careful", "Precise", "Careless", "Thorough"], 2, "Medium", "Meticulous means extremely careful/precise; its opposite is careless.", ["Antonyms"]),
      q("Choose the synonym of 'AMBIGUOUS':", ["Clear", "Unclear or open to multiple interpretations", "Certain", "Simple"], 1, "Medium", "Ambiguous means having more than one possible meaning, genuinely unclear.", ["Synonyms"]),
    ],
  },
  {
    name: "Sentence Correction", isNew: true,
    lesson: {
      difficulty: "Intermediate", estimatedMinutes: 20,
      whatYoullLearn: ["Subject-verb agreement rules, including genuinely tricky cases", "Correct tense consistency within and across clauses", "Common preposition-pairing errors that native intuition alone often misses"],
      concept: "SENTENCE CORRECTION tests whether you can spot GRAMMATICAL errors precisely - the genuine skill is systematically checking a FIXED set of common error categories, not just relying on \"does this sound right\" intuition (which frequently fails for genuinely tricky cases).\n\nSUBJECT-VERB AGREEMENT'S tricky cases are exactly what's tested, not the obvious ones: when the subject and verb are separated by a long phrase (\"The list of items *is* [not are] on the table\" - \"list\" is the true subject, singular, despite \"items\" sitting right next to the verb); with collective nouns (\"the team *is* playing well\" - typically singular in standard usage, treating the team as one unit); with \"each,\" \"either,\" \"neither\" (always singular: \"each of the students *has* [not have] submitted\").\n\nTENSE CONSISTENCY requires the verb tenses across a sentence (or connected sentences) to genuinely make logical temporal sense together - a common error mixes past and present illogically (\"He *went* to the store and *buys* milk\" should be \"went... and bought\", keeping both actions consistently in the past).\n\nPREPOSITION PAIRING is a genuinely common, native-intuition-resistant error category: certain verbs/adjectives pair with ONE specific, fixed preposition by convention, not by any deducible logic - \"different FROM\" (not \"different THAN\" in strict formal usage), \"married TO\" (not \"married WITH\"), \"good AT\" (not \"good IN\") - these genuinely must be memorized as fixed pairs, since the \"correct\" preposition isn't derivable from general grammar rules.",
      keyPoints: ["Subject-verb agreement's genuinely tricky cases involve long separating phrases, collective nouns, and words like each/either/neither (always singular) - not the obvious, easy cases", "Tense consistency requires all verbs in a connected sentence to make logical temporal sense together - mixing past and present illogically is a common, testable error", "Certain verb/adjective-preposition pairings (different FROM, married TO, good AT) are fixed by convention and must be memorized, not deduced from general grammar logic"],
      commonMistakes: ["Matching a verb's number to the nearest noun physically before it, rather than to the TRUE grammatical subject of the sentence, especially when a long phrase separates them", "Relying purely on \"does this sound right\" intuition for preposition pairing, which frequently fails since correct pairings are conventional, not logically derivable"],
      interviewTips: ["Practice explicitly identifying the TRUE subject of a sentence before checking verb agreement, especially in sentences with long intervening phrases between subject and verb"],
      realWorldApplications: ["Precise grammar directly affects professional writing credibility (emails, reports, resumes) - this is genuinely one of the most practically transferable topics in the entire aptitude curriculum"],
      mcqs: [
        { question: "Which sentence is grammatically correct?", options: ["The list of items are on the table.", "The list of items is on the table.", "The list of items were on the table.", "The list of items be on the table."], correctIndex: 1 },
        { question: "Which preposition correctly completes: 'She is different ___ her sister.'", options: ["than", "from", "to", "with"], correctIndex: 1 },
      ],
      goingDeeper: "PARALLEL STRUCTURE errors (a genuinely more advanced sentence correction category) occur when a sentence lists multiple items/actions that should share the SAME grammatical form but don't - \"She likes reading, to write, and painting\" is broken parallel structure (mixing gerund and infinitive forms); the corrected version keeps all three items in the identical form: \"She likes reading, writing, and painting.\"",
      assignment: "Identify and correct the error in: 'Each of the students have submitted their assignment on time.' Explain precisely which rule was violated.",
      xpReward: 20, coinReward: 8,
    },
    questions: [
      q("Choose the grammatically correct sentence:", ["Each of the students have submitted their work.", "Each of the students has submitted their work.", "Each of the students has submitted its work.", "Each of the student have submitted their work."], 1, "Medium", "'Each' is always singular, requiring 'has', not 'have'.", ["Sentence Correction", "Subject-Verb Agreement"]),
      q("Choose the grammatically correct sentence:", ["He went to the market and buys vegetables.", "He goes to the market and bought vegetables.", "He went to the market and bought vegetables.", "He go to the market and buy vegetables."], 2, "Easy", "Both verbs must consistently stay in the past tense: went...and bought.", ["Sentence Correction", "Tense Consistency"]),
      q("Choose the grammatically correct sentence:", ["She is married with a doctor.", "She is married to a doctor.", "She is married at a doctor.", "She is married in a doctor."], 1, "Medium", "'Married to' is the conventionally correct, fixed preposition pairing.", ["Sentence Correction", "Prepositions"]),
      q("Choose the grammatically correct sentence:", ["The team of players are practicing hard.", "The team of players is practicing hard.", "The team of players were practicing hard.", "The team of players be practicing hard."], 1, "Medium", "'Team' (a collective noun treated as one unit) is the true singular subject, requiring 'is'.", ["Sentence Correction", "Subject-Verb Agreement"]),
      q("Choose the sentence with correct parallel structure:", ["She enjoys swimming, to read, and hiking.", "She enjoys swimming, reading, and hiking.", "She enjoys to swim, reading, and to hike.", "She enjoys swimming, reads, and hiking."], 1, "Medium", "All three listed activities must share the identical grammatical form (gerund: swimming, reading, hiking).", ["Sentence Correction", "Parallel Structure"]),
    ],
  },
  {
    name: "Error Detection", isNew: true,
    lesson: {
      difficulty: "Intermediate", estimatedMinutes: 15,
      whatYoullLearn: ["A systematic checklist approach to scanning a sentence for the most common error categories", "How article (a/an/the) errors are frequently overlooked despite being genuinely common", "Why \"no error\" is a genuinely valid, correct answer choice you shouldn't be afraid to select"],
      concept: "ERROR DETECTION questions present a sentence split into labeled segments and ask you to identify WHICH segment (if any) contains a grammatical error - the genuine skill is a SYSTEMATIC scanning checklist, since trying to \"just notice\" an error by general impression alone misses genuinely subtle cases.\n\nA reliable systematic checklist, worth running through explicitly for each segment: (1) SUBJECT-VERB agreement - does the verb's number match its true subject? (2) TENSE consistency - do all verbs in the sentence make logical temporal sense together? (3) ARTICLES (a/an/the) - is \"a\" used before a consonant SOUND and \"an\" before a vowel SOUND (not just vowel letter - \"an hour\" despite h being a consonant LETTER, since the H is silent, producing a vowel SOUND)? Is \"the\" correctly used/omitted for specific versus general reference? (4) PREPOSITIONS - are conventional verb/adjective-preposition pairings correct? (5) PARALLEL STRUCTURE - do listed items share the same grammatical form?\n\nARTICLE ERRORS are genuinely, frequently overlooked specifically because they're small, easy-to-skim-past words - but they're a real, commonly-tested error category: using \"a\" before a vowel SOUND (\"a apple\" instead of correctly \"an apple\"), or incorrectly omitting \"the\" before a genuinely specific, previously-mentioned noun.\n\n\"NO ERROR\" is a genuinely valid, correct answer choice in this format, worth explicitly trusting when your systematic checklist finds nothing wrong - a common, costly mistake is talking yourself into finding a \"forced\" error in an otherwise genuinely correct sentence, purely because you assume every question must have one.",
      keyPoints: ["Run a systematic checklist for each segment: subject-verb agreement, tense consistency, articles (a/an/the), prepositions, parallel structure - not just a general \"does it sound right\" impression", "Article errors (a vs an based on SOUND not letter, correct/incorrect 'the' usage) are genuinely common but frequently overlooked since they're small words", "\"No error\" is a genuinely valid answer choice - trust your systematic checklist rather than forcing a \"found\" error into a genuinely correct sentence"],
      commonMistakes: ["Skimming past small article words (a/an/the) without genuinely checking them, since they're easy to overlook compared to more \"obvious-looking\" errors", "Assuming every question must contain a genuine error, leading to forcing/inventing one in a sentence that's actually completely correct"],
      interviewTips: ["Practice running the full 5-point systematic checklist explicitly on unfamiliar sentences until it becomes fast and automatic, rather than relying purely on instinct"],
      realWorldApplications: ["This exact systematic error-scanning discipline directly improves real-world proofreading and editing skills for professional documents"],
      mcqs: [
        { question: "Which article correctly precedes 'hour'?", options: ["a hour", "an hour", "the hour (always, with no other option ever correct)", "no article is ever needed"], correctIndex: 1 },
        { question: "Is 'No error' a genuinely valid answer choice in error detection questions?", options: ["No, every sentence always contains an error", "Yes - trust your systematic checklist rather than forcing an error into a genuinely correct sentence", "Only in easy-difficulty questions", "Only if explicitly stated in the instructions"], correctIndex: 1 },
      ],
      goingDeeper: "REDUNDANCY errors (a more advanced error-detection category) occur when a sentence includes genuinely unnecessary repetition of meaning - \"return back\" (return already implies back), \"free gift\" (a gift is inherently free) - these aren't strictly ungrammatical, but are considered stylistically incorrect in formal writing contexts and do appear in harder error-detection questions.",
      assignment: "Write 3 sentences, each containing exactly one deliberately inserted error from a different category (subject-verb agreement, article, preposition) - then explain the correction for each.",
      xpReward: 15, coinReward: 5,
    },
    questions: [
      q("Identify the error: 'She go to school everyday.'", ["'She'", "'go' (should be 'goes')", "'to school'", "'everyday'"], 1, "Easy", "Third-person singular subject 'She' requires 'goes', not the base form 'go'.", ["Error Detection", "Subject-Verb Agreement"]),
      q("Identify the error: 'He bought a apple from the market.'", ["'He bought'", "'a apple' (should be 'an apple')", "'from the'", "'market'"], 1, "Easy", "'Apple' begins with a vowel sound, requiring 'an', not 'a'.", ["Error Detection", "Articles"]),
      q("Identify the error in: 'Neither of the boys have completed their homework.'", ["'Neither of the boys'", "'have' (should be 'has')", "'completed'", "'their homework'"], 1, "Medium", "'Neither' is always singular, requiring 'has', not 'have'.", ["Error Detection", "Subject-Verb Agreement"]),
      q("Identify the error: 'The news are very encouraging today.'", ["'The news'", "'are' (should be 'is')", "'very encouraging'", "'today'"], 1, "Medium", "'News' is treated as singular in standard English despite its plural-looking form, requiring 'is'.", ["Error Detection", "Subject-Verb Agreement"]),
      q("Identify the error: 'She is good in mathematics.'", ["'She is'", "'good in' (should be 'good at')", "'mathematics'", "No error"], 1, "Medium", "The conventional, correct pairing is 'good at', not 'good in'.", ["Error Detection", "Prepositions"]),
    ],
  },
  {
    name: "Para Jumbles", isNew: true,
    lesson: {
      difficulty: "Intermediate", estimatedMinutes: 15,
      whatYoullLearn: ["How to identify the genuine opening sentence of a jumbled paragraph", "How pronoun references and transition words reveal the correct sentence order", "Why building pairs/links between sentences is more reliable than guessing the full order at once"],
      concept: "PARA JUMBLES present several sentences in SCRAMBLED order and ask you to determine their correct, logical original sequence - the genuine skill is finding STRUCTURAL clues connecting sentences, not just guessing based on overall topic familiarity.\n\nIDENTIFYING THE OPENING SENTENCE is the most valuable first step: the genuine opening sentence introduces a general TOPIC or SUBJECT without relying on anything from a prior sentence - it typically contains NO pronoun referring back to something not-yet-introduced (a sentence starting with \"This showed that...\" or \"However, they...\" genuinely CANNOT be the opening sentence, since \"this\"/\"they\" must refer to something established earlier).\n\nPRONOUN REFERENCES and TRANSITION WORDS are the single most reliable technique for linking sentences together into PAIRS before attempting the full order: a sentence containing \"it,\" \"this,\" \"they,\" \"such\" genuinely must follow whichever sentence first introduces the noun that pronoun refers to. Similarly, transition words genuinely signal a specific relationship to the PRECEDING sentence: \"However\"/\"but\" signals a CONTRAST with what came before; \"Therefore\"/\"as a result\" signals a CONSEQUENCE; \"For example\" signals an ILLUSTRATION of a preceding general claim - correctly matching these transition words to what they logically connect to is precisely how you build reliable sentence PAIRS.\n\nThe genuinely reliable overall STRATEGY: don't try to determine the complete final order all at once - instead, find 2-3 confident sentence PAIRS first (using pronoun/transition clues), then assemble those already-confirmed pairs into the final sequence, which is a dramatically more reliable, error-resistant process than guessing the whole order in one single attempt.",
      keyPoints: ["The genuine opening sentence introduces a general topic without relying on any prior sentence - it contains no pronoun referring back to something not-yet-established", "Pronouns (it, this, they) and transition words (however, therefore, for example) are the most reliable technique for linking sentences into confident pairs before determining the full order", "Build 2-3 confident sentence pairs first using these clues, then assemble the pairs into a final sequence - far more reliable than guessing the complete order in one attempt"],
      commonMistakes: ["Trying to determine the complete sentence order in one single guess based on general topic familiarity, rather than systematically building confident pairs first via pronoun/transition clues", "Selecting a sentence with an unresolved pronoun reference (\"it\", \"they\") as the OPENING sentence, missing that a genuine opening sentence can't refer back to anything not yet introduced"],
      interviewTips: ["Practice explicitly scanning for pronoun references and transition words FIRST in any jumbled paragraph, building confident pairs before attempting the complete order"],
      realWorldApplications: ["This exact skill (recognizing logical/structural connections between ideas) directly transfers to real-world technical writing and editing, and to genuinely following complex written arguments"],
      mcqs: [
        { question: "What genuinely characterizes a valid opening sentence in a para jumble?", options: ["It contains many pronouns referring to earlier content", "It introduces a general topic without depending on any prior sentence, and contains no unresolved pronoun reference", "It must be the shortest sentence", "It must contain a transition word like 'however'"], correctIndex: 1 },
        { question: "What does the transition word 'however' typically signal about its relationship to the preceding sentence?", options: ["Agreement and continuation", "A contrast or contradiction", "An example", "A conclusion"], correctIndex: 1 },
      ],
      goingDeeper: "Some para jumble questions include ONE or TWO sentences already FIXED in position (given as the confirmed first/last sentence), genuinely simplifying the problem - use these fixed anchors as guaranteed starting/ending points to build pairs OUTWARD from, rather than treating the problem as fully open-ended.",
      assignment: "Take any 4-sentence paragraph from a news article, scramble the sentence order, then practice re-deriving the correct order using pronoun and transition-word clues explicitly.",
      xpReward: 20, coinReward: 8,
    },
    questions: [
      q("Which sentence is most likely the OPENING sentence of a jumbled paragraph about renewable energy?", ["However, this approach faces significant cost challenges.", "Renewable energy sources are becoming an increasingly important part of the global energy mix.", "As a result, many countries have adopted new policies.", "This has led to significant investment in solar technology."], 1, "Easy", "This sentence introduces the general topic (renewable energy) without depending on any prior sentence or unresolved pronoun - a genuine opening sentence.", ["Para Jumbles"]),
      q("A sentence beginning with 'Therefore, the company decided to expand its operations' most likely follows a sentence describing what?", ["An unrelated topic entirely", "A cause or reason that logically leads to this consequence/decision", "The company's founding history", "A contrasting viewpoint"], 1, "Medium", "'Therefore' signals a consequence, so it must follow a sentence establishing the reason/cause for this decision.", ["Para Jumbles", "Transition Words"]),
      q("A sentence containing the pronoun 'they' referring to 'researchers' must come:", ["Before the sentence introducing 'researchers'", "After the sentence that first introduces 'researchers'", "It can appear anywhere with no constraint", "Only as the very last sentence"], 1, "Medium", "A pronoun can only meaningfully refer to something already introduced in a prior sentence.", ["Para Jumbles", "Pronoun References"]),
      q("What is the recommended strategy for solving a para jumble, rather than guessing the full order at once?", ["Randomly try every possible ordering", "Build 2-3 confident sentence pairs first using pronoun/transition clues, then assemble them into the final sequence", "Always assume alphabetical order of first words", "Pick the order that uses the fewest words first"], 1, "Medium", "Building confident pairs first is dramatically more reliable than guessing the complete order in one attempt.", ["Para Jumbles"]),
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
      ...t.lesson,
    });
    topicsAdded++;
    for (let qi = 0; qi < t.questions.length; qi++) {
      await topicRef.collection("questions").add({ ...t.questions[qi], order: qi, createdAt: admin.firestore.FieldValue.serverTimestamp() });
      questionsAdded++;
    }
  }

  console.log(`Verbal: ${topicsAdded} topics added, ${questionsAdded} questions added.`);
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
