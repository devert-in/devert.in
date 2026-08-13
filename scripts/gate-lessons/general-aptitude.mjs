// GATE General Aptitude - authored lesson content.
//
// AUTHORING RULES for GATE lessons (this file is the reference; later subject
// files follow it):
//
//  1. `concept` uses the shared lesson-block syntax (devert-frontend/lib/
//     lessonBlocks.js) - the same engine CS Core renders with. Story first,
//     technical term after. At least two `##` sections.
//  2. Do NOT restate commonMistakes / formulas / shortcuts / memoryTricks /
//     analogies inside `concept`. Each renders as its own card directly beneath
//     it in gate-subjects.jsx's topic view, so repeating them is duplication a
//     student reads twice.
//  3. `pyqRelevance`, `interviewConnection` and `revisionSummary` render as
//     PLAIN TEXT (whitespace-pre-wrap), not through the block parser. No `:::`
//     fences in those three - they would show literally.
//  4. GATE-specific: every lesson says how the topic is actually asked and at
//     what mark value. A GATE lesson that reads like a textbook chapter has
//     failed at the one thing it exists for.
//  5. `numericals` are NAT-shaped (type a number, no options, no negative
//     marking in the real exam) with an inclusive accepted range. Use them
//     wherever the topic produces a number, because that is how GATE asks it.
//
// SUBJECT FRAME: General Aptitude is 15 of 100 marks on every GATE paper, and
// the marks are identical in value to the hardest Theory of Computation
// question. Most candidates under-prepare it out of a vague sense that studying
// "aptitude" is beneath a serious technical candidate. Every lesson here leans
// on that: this is the cheapest section on the paper, and it is cheap because
// your competition is skipping it.

export const GENERAL_APTITUDE = {

  // ---------------- Verbal Aptitude ----------------

  "basic-english-grammar-tenses": {
    difficulty: "Easy",
    estimatedMinutes: 25,
    xpReward: 20, coinReward: 8,
    whatYoullLearn: [
      "Why GATE tests tense at all, and the narrow set of forms it actually asks about",
      "The three tenses times four aspects grid that generates every English verb form",
      "Sequence of tenses - the rule that decides most GATE grammar questions",
    ],
    prerequisites: [],
    concept: `## Fifteen Marks Nobody Wants To Study

::: story
There is a section on your GATE paper worth 15 marks. It has no derivations, no numerical methods, nothing you need three months to build up to.

Most candidates skim it the week before the exam, decide they "know English", and lose four or five marks they could have had.

Those marks weigh exactly as much as marks from Theory of Computation.
:::

::: remember
General Aptitude is **15 of 100 marks** on every GATE paper - 10 questions, five worth 1 mark and five worth 2. It is the same section for CS, DA, ME, everything.

It is the cheapest section per hour invested on the entire paper, and it is cheap precisely because your competition is skipping it.
:::

## Tense Is A Grid, Not A List

::: story
People try to memorise twelve tense names. That is the hard way.

There are three times - past, present, future. And four aspects - simple, continuous, perfect, perfect continuous. Cross them and you get twelve forms, but you only ever memorise seven items instead of twelve labels.
:::

::: cards The four aspects, and what each one is for
Simple :: A complete fact, with no comment about duration. "She writes code."
Continuous :: In progress at the reference time. "She is writing code."
Perfect :: Completed *before* the reference time, and relevant to it. "She has written the code."
Perfect continuous :: Ongoing up to the reference time, with duration in view. "She has been writing code for three hours."
:::

  Past            Present          Future
  wrote           writes           will write
  was writing     is writing       will be writing
  had written     has written      will have written
  had been        has been         will have been
    writing         writing          writing

::: checkpoint
"By the time the results are announced, she ____ for six months." Which form fits?
- ( ) will prepare
- ( ) will be preparing
- (x) will have been preparing
- ( ) has been preparing
> Future perfect continuous. The reference point is in the future ("by the time..."), the action runs up to it, and "for six months" puts duration in view. That combination has exactly one form.
:::

## The Rule That Decides Most Questions

::: story
GATE rarely asks "name this tense." It asks you to pick the verb that fits a sentence which already has another verb in it.

Which makes **sequence of tenses** the actual thing being tested: when a sentence has a main clause and a subordinate clause, the subordinate clause's tense is constrained by the main clause's.
:::

::: cards Sequence of tenses
Main clause in the past :: The subordinate clause normally shifts back too. "He said he **was** tired", not "he **is** tired."
Main clause in the present :: The subordinate clause is free. "He says he is tired" / "he was tired" / "he will be tired" all work.
Universal truths are exempt :: "The teacher said that water **boils** at 100 degrees" - a permanent fact does not shift back.
:::

::: interview
When a GATE sentence gives you a time marker, it has told you the answer.

"Since" and "for" pull toward a perfect form. "Yesterday", "last year", "in 1998" force simple past and forbid present perfect. "By the time X happens" sets up a perfect form on the other side. Find the marker first, then look at the options - it eliminates two or three of them immediately.
:::`,
    keyPoints: [
      "General Aptitude is 15 of 100 marks on every GATE paper - 10 questions, five at 1 mark and five at 2 - and is the same section regardless of which paper you sit.",
      "English has twelve verb forms generated by three times (past/present/future) crossed with four aspects (simple/continuous/perfect/perfect continuous). Learn the two axes, not the twelve labels.",
      "Sequence of tenses: a past main clause backshifts its subordinate clause, with universal truths as the standing exception.",
      "GATE asks tense as a fill-in-the-blank built around a time marker, not as \"identify the tense\" - so locating the marker is the actual technique.",
    ],
    analogies: [
      "Think of aspect as camera work rather than vocabulary: simple is a snapshot, continuous is a video mid-shot, perfect is a photo of the aftermath, perfect continuous is a timelapse that runs right up to now.",
    ],
    commonMistakes: [
      "Using present perfect with a finished past time marker - \"I have seen him yesterday\" is wrong; a specific finished time demands simple past (\"I saw him yesterday\").",
      "Failing to shift the subordinate clause back after a past main verb (\"He told me he is coming\") - correct is \"he was coming\", unless the fact is permanently true.",
      "Treating \"since\" and \"for\" as interchangeable. \"Since\" takes a point in time (since 2019), \"for\" takes a duration (for six years).",
    ],
    memoryTricks: [
      "Three times x four aspects = twelve forms. Memorise the two axes, never the twelve names.",
      "SIMPLE PAST for a dead moment, PRESENT PERFECT for a live one. If the sentence names when it happened, the moment is dead - use simple past.",
    ],
    shortcuts: [
      "Scan for the time marker before reading the options. In most GATE tense questions the marker alone eliminates all but one choice.",
      "If the main verb is past and the option set mixes past and present forms, the present forms are almost always wrong - unless the clause states a permanent truth.",
    ],
    mcqs: [
      {
        question: "Select the grammatically correct sentence.",
        options: [
          "I have completed the assignment last night.",
          "I completed the assignment last night.",
          "I had completed the assignment last night.",
          "I am completing the assignment last night.",
        ],
        correctIndex: 1,
        explanation: "\"Last night\" is a specific, finished time, which forbids present perfect and requires simple past. Past perfect (\"had completed\") would need a second, later past event to sit before.",
      },
      {
        question: "The researcher explained that the algorithm ____ in linear time.",
        options: ["ran", "runs", "was running", "had run"],
        correctIndex: 1,
        explanation: "The algorithm's complexity is a permanent, general truth, so it is exempt from the backshift a past main verb would otherwise force. This universal-truth exception is a favourite GATE test of whether a candidate knows the rule or just applies backshift mechanically.",
      },
      {
        question: "By next December, the team ____ on the compiler for two years.",
        options: ["will work", "will be working", "will have been working", "has been working"],
        correctIndex: 2,
        explanation: "A future reference point (\"by next December\"), an action continuing up to it, and an explicit duration (\"for two years\") together select future perfect continuous.",
      },
    ],
    pyqRelevance: `GATE's verbal questions on tense are almost always 1-mark, and almost always fill-in-the-blank: one sentence, four verb forms, pick the fitting one. They are not asked as "identify the tense".

The sentences are built around a time marker (since / for / by the time / a named year), because that is what makes a single option defensibly correct. Train yourself to find the marker first - it is the fastest reliable route through this question type, and it takes about ten seconds per question once it becomes a habit.

Expect one or two of GA's ten questions to be pure grammar of this kind. That is 1-2 marks available for a topic you can finish in an evening.`,
    interviewConnection: `Nothing here appears in a technical interview directly, but written communication does. Every design document, commit message, incident report and PR description you write for the rest of your career is judged partly on whether it reads clearly.

Sequence of tenses in particular matters in incident write-ups, where you constantly describe one past event relative to another ("the alert fired after the deploy had already rolled back"). Getting that wrong makes a timeline genuinely ambiguous to the person reading it at 3am.`,
    revisionSummary: `Three times (past / present / future) x four aspects (simple / continuous / perfect / perfect continuous) = twelve forms. Learn the axes, not the labels.

Sequence of tenses: a past main clause backshifts the subordinate clause, EXCEPT for universal truths.

Specific finished time (yesterday, in 1998) forces simple past and rules out present perfect. "Since" takes a point, "for" takes a duration.

Exam habit: find the time marker, then look at the options.`,
    shortNotes: {
      oneMinute: "12 verb forms = 3 times x 4 aspects. Past main clause -> backshift the subordinate clause, unless it is a permanent truth. Finished time marker -> simple past, never present perfect. Since = point, for = duration. Always locate the time marker before reading the options.",
    },
  },

  "articles-adjectives-and-prepositions": {
    difficulty: "Easy",
    estimatedMinutes: 25,
    xpReward: 20, coinReward: 8,
    whatYoullLearn: [
      "The one question that decides every article choice",
      "Adjective order - why \"a big red wooden box\" is the only acceptable ordering",
      "Why prepositions are memorisation, and the narrow set GATE actually reuses",
    ],
    prerequisites: ["Basic English Grammar: Tenses"],
    concept: `## Three Words That Carry Most Of The Marks

::: story
Articles, adjectives and prepositions are the smallest words in English and the hardest to get right, because two of the three follow rules and the third mostly does not.

That split is the whole lesson. Learn the rules where rules exist, and stop trying to derive the part that is pure convention.
:::

## Articles: One Question, Then Another

::: flow
Ask first - specific or general? :: If the noun is a particular one the reader can identify, it takes **the**. If it is any member of a class, it takes **a/an** or no article at all.
Then ask - what does it SOUND like? :: **a** before a consonant sound, **an** before a vowel sound. Sound, not spelling.
:::

::: remember
The a/an rule is about pronunciation and nothing else.

**an** hour, **an** MTech, **an** SSD - all begin with vowel sounds despite consonant letters. **a** university, **a** one-way street, **a** European - all begin with consonant sounds despite vowel letters.

GATE has asked exactly this trap, using abbreviations, more than once.
:::

::: checkpoint
Which is correct?
- ( ) He completed a M.Tech in a hour.
- ( ) He completed an M.Tech in a hour.
- (x) He completed an M.Tech in an hour.
- ( ) He completed a M.Tech in an hour.
> "M.Tech" is pronounced "em-tech", starting with a vowel sound, so it takes **an**. "Hour" is pronounced "our", also a vowel sound, so it takes **an** too. Both are spelled with consonants and both are traps.
:::

## Adjectives Have A Fixed Order

::: story
"A big red wooden box" sounds right. "A wooden red big box" sounds unmistakably wrong, and no native speaker can tell you which rule was broken.

There is one, and it is rigid.
:::

::: cards Adjective order, in sequence
Opinion :: beautiful, ugly, useful
Size :: big, tiny, enormous
Age :: old, new, ancient
Shape :: round, square, flat
Colour :: red, blue, dark
Origin :: Indian, Japanese, lunar
Material :: wooden, steel, plastic
Purpose :: sleeping (bag), racing (car)
:::

::: tip
The comparative/superlative trap is worth more marks than the ordering one: **never double-mark** a comparison.

"More better" and "most easiest" are both wrong. One marker per comparison - either the -er/-est ending or the more/most word, never both.
:::

## Prepositions Are Not Derivable

::: story
Why do you agree *to* a proposal, agree *with* a person, and agree *on* a plan? Why are you good *at* maths but good *for* your health?

There is no rule. It is collocation - which preposition a particular word simply happens to take.
:::

::: remember
Stop trying to reason prepositions out. Learn them attached to their verb or adjective, as one unit.

Not "at" as an abstract word, but "good at", "arrive at", "aim at" as three things you know. This is vocabulary work, not grammar work, and treating it as grammar is why it stays hard.
:::

::: interview
GATE reuses a small set of preposition pairs, because they are the ones that reliably separate careless readers from careful ones.

Comprise (never "comprise of"), consist of, discuss (never "discuss about"), differ from a thing, differ with a person, superior to (never "superior than"), prefer X to Y (never "prefer than"). Six of those on one page is a genuinely good use of twenty minutes.
:::`,
    keyPoints: [
      "Articles follow a rule, adjective order follows a rule, prepositions largely do not - so learn the first two and memorise the third.",
      "a/an is decided by the first SOUND, not the first letter: an hour, an M.Tech, a university, a one-way street.",
      "Adjectives take a fixed order - OSASCOMP: Opinion, Size, Age, Shape, Colour, Origin, Material, Purpose.",
      "Prepositions are collocations, learned attached to their verb or adjective (\"good at\", \"differ from\") rather than derived.",
    ],
    analogies: [
      "Articles are pointing: `the` points at one thing you both already know about, `a/an` holds up any one example from a pile.",
      "Prepositions behave like irregular verbs - you do not derive `went` from `go` by rule, and you do not derive `good at` by rule either. Both are learned as attached pairs.",
    ],
    commonMistakes: [
      "Choosing a/an by first LETTER instead of first SOUND - \"a hour\", \"a MTech\" and \"an university\" are all wrong for exactly this reason.",
      "Double-marking a comparison: \"more better\", \"most easiest\", \"more superior\". One marker per comparison, always.",
      "Adding a preposition where the verb takes none: \"discuss about the plan\", \"comprise of five parts\", \"investigate into the matter\" are all wrong.",
      "Using \"superior/inferior/senior/junior than\" - all four take \"to\", never \"than\".",
    ],
    memoryTricks: [
      "Adjective order mnemonic OSASCOMP: Opinion, Size, Age, Shape, Colour, Origin, Material, Purpose.",
      "For a/an, say the word out loud. If your mouth opens on a vowel sound, it is `an` - regardless of how the word is spelled.",
    ],
    shortcuts: [
      "In a preposition question, read each option aloud in the full sentence. Collocation errors are far easier to hear than to reason about.",
      "Any option containing \"more better\", \"superior than\" or \"comprise of\" can be eliminated without further thought.",
    ],
    mcqs: [
      {
        question: "Select the correct sentence.",
        options: [
          "The committee comprises of eight members, all senior than me.",
          "The committee comprises eight members, all senior to me.",
          "The committee comprise of eight members, all senior than me.",
          "The committee is comprising eight members, all senior to me.",
        ],
        correctIndex: 1,
        explanation: "\"Comprise\" already means \"consist of\", so \"comprise of\" is redundant and wrong. \"Senior\" takes \"to\", never \"than\". Both errors appear together in GATE questions because each one alone is easy to miss.",
      },
      {
        question: "Which ordering of adjectives is correct?",
        options: [
          "a Japanese small old ceramic bowl",
          "a small old Japanese ceramic bowl",
          "a ceramic Japanese old small bowl",
          "an old small Japanese ceramic bowl",
        ],
        correctIndex: 1,
        explanation: "OSASCOMP order gives size (small), then age (old), then origin (Japanese), then material (ceramic). Option 4 has age before size, which is the near-miss GATE prefers as a distractor.",
      },
      {
        question: "She is not just good ____ mathematics; she is also good ____ explaining it.",
        options: ["in / at", "at / at", "at / in", "for / at"],
        correctIndex: 1,
        explanation: "\"Good at\" is the collocation for both a subject and an activity. \"Good in\" is a common regional variant but is not accepted in standard usage, and GATE marks by standard usage.",
      },
    ],
    pyqRelevance: `These come as 1-mark sentence-correction or fill-in-the-blank questions, and GATE has a strong preference for stacking two errors into one option so that a candidate who spots only one still gets it wrong.

The recurring set is small and worth learning as a list: comprise (no "of"), discuss (no "about"), superior/inferior/senior/junior + to, prefer X to Y, differ from/with, an + vowel-sound abbreviation.

The a/an-with-abbreviation trap ("an M.Tech", "an SSD", "an hour") is asked often enough to be worth ten seconds of deliberate attention.`,
    interviewConnection: `Preposition and article errors are the most visible markers of non-native writing, and they show up in code review comments, documentation and email far more than in speech.

The practical payoff is narrow but real: a design document with "comprises of" and "discuss about the approach" reads as less careful than the thinking behind it actually was.`,
    revisionSummary: `Articles: specific -> the, general -> a/an. Choose a/an by SOUND, not spelling (an hour, an M.Tech, a university).

Adjectives: OSASCOMP - Opinion, Size, Age, Shape, Colour, Origin, Material, Purpose. Never double-mark a comparison (no "more better").

Prepositions: not derivable. Learn them as attached pairs. High-frequency GATE set - comprise (no of), discuss (no about), superior/inferior/senior/junior to, prefer X to Y, differ from a thing / with a person, good at.`,
    shortNotes: {
      oneMinute: "a/an by SOUND (an hour, an M.Tech, a university). Adjective order = OSASCOMP. One comparison marker only - never \"more better\". Prepositions are collocations, learn as pairs: comprise (no of), discuss (no about), superior/senior/inferior/junior TO, prefer X TO Y, good AT.",
    },
  },

  "conjunctions-and-verb-noun-agreement": {
    difficulty: "Easy",
    estimatedMinutes: 25,
    xpReward: 20, coinReward: 8,
    whatYoullLearn: [
      "Subject-verb agreement, and the four sentence shapes that make it hard",
      "Correlative conjunction pairs, and why GATE loves breaking them",
      "How to find the real subject when the sentence is designed to hide it",
    ],
    prerequisites: ["Articles, Adjectives and Prepositions"],
    concept: `## The Verb Agrees With The Subject. Finding The Subject Is The Hard Part.

::: story
"The list of candidates who qualified for the interview ____ been published."

Has, or have? The word right before the blank is "interview". The nearest plural noun is "candidates". Both are decoys.

The subject is "the list". Singular. **Has**.
:::

::: remember
A verb agrees with its **subject**, never with whatever noun happens to sit closest to it.

GATE builds these sentences by inserting a long phrase between the subject and the verb, with a noun of the opposite number inside it. The whole question is whether you can still find the subject.
:::

::: cards The four shapes that hide a subject
Prepositional phrase between :: "The **box** of chocolates **is** on the table." Strip out "of chocolates" - the subject was never plural.
Each / every / either / neither :: Always singular. "**Each** of the students **has** submitted."
Either-or / neither-nor :: The verb agrees with the noun NEAREST to it. "Neither the manager nor the **engineers were** informed."
Collective nouns :: Singular when acting as one unit. "The **committee has** decided" - one decision, one body.
:::

::: checkpoint
"Neither the students nor the professor ____ aware of the change." Which verb?
- ( ) were
- (x) was
- ( ) have been
- ( ) are
> "was". With neither-nor, the verb agrees with the nearer subject - here "the professor", singular. Reverse the order to "neither the professor nor the students" and the correct verb becomes "were". Same facts, different verb, purely because of word order.
:::

## Correlative Pairs Come As Pairs

::: story
Some conjunctions travel in fixed couples. Use half of one and half of another and the sentence is broken, even though it often still sounds fine.
:::

::: cards The pairs, unbreakable
either :: ... or
neither :: ... nor
not only :: ... but also
both :: ... and
whether :: ... or
:::

::: mistake
The classic GATE break is "not only ... but **also** replaced by ... **and**", or "neither ... **or**".

"Not only did she design the schema and she wrote the migration" is wrong; it needs "but also". Read the sentence looking for the first half of a pair, then check that its partner is present and correct.
:::

## Where Meaning Actually Changes

::: story
Some agreement choices are not about correctness at all. Both versions are grammatical, and they mean different things.
:::

::: cards Number changes the meaning
"The number of applicants **is** rising" :: One number. Singular. This is a statement about a quantity.
"A number of applicants **are** waiting" :: "A number of" means "several". Plural. This is a statement about people.
"None of the code **is** tested" :: Treating the code as one mass.
"None of the tests **are** passing" :: Treating the tests as countable individuals.
:::

::: interview
Two more that GATE reuses because they look like errors and are not.

Words joined by "as well as", "along with", "in addition to" or "together with" do NOT make a singular subject plural: "The **manager**, along with two engineers, **is** attending." Only "and" genuinely joins subjects.

And a subject of the form "X and Y" that names one combined thing stays singular: "Bread and butter **is** a common breakfast."
:::`,
    keyPoints: [
      "A verb agrees with its SUBJECT, never with the nearest noun - and GATE builds these sentences by inserting a long phrase containing a noun of the opposite number.",
      "each / every / either / neither always take a singular verb, however many things they refer to.",
      "With either-or and neither-nor, the verb agrees with the NEARER subject - so reversing the order changes the correct verb.",
      "Only \"and\" joins subjects. \"As well as\", \"along with\", \"in addition to\" and \"together with\" leave a singular subject singular.",
      "Correlative conjunctions are fixed pairs: either-or, neither-nor, not only-but also, both-and, whether-or.",
    ],
    analogies: [
      "Finding the subject is like resolving a variable's scope: the nearest identifier is not necessarily the one that binds. You have to look at the structure, not the proximity.",
    ],
    commonMistakes: [
      "Matching the verb to the nearest noun instead of the subject - \"the list of candidates have been published\" is the single most-tested error in this topic.",
      "Treating \"each/every/either/neither\" as plural because they refer to several things. All four take a singular verb.",
      "Assuming \"as well as\" / \"along with\" / \"in addition to\" pluralize the subject. Only \"and\" does.",
      "Breaking a correlative pair: \"neither ... or\", \"not only ... and\", \"both ... as well as\".",
    ],
    memoryTricks: [
      "Cross out every prepositional phrase between the subject and the verb, then re-read. The right verb becomes obvious once the decoys are gone.",
      "For either-or / neither-nor, the verb listens to its NEAREST neighbour. Nearest wins.",
    ],
    shortcuts: [
      "In a sentence-correction question, locate the main verb first and work backwards to its subject. Faster than reading forward and being led by the decoy nouns.",
      "Spot a correlative first-half (either / neither / not only / both) and immediately check its partner - a broken pair is an instant elimination.",
    ],
    mcqs: [
      {
        question: "Select the grammatically correct sentence.",
        options: [
          "The set of instructions that controls the pipeline have been revised.",
          "The set of instructions that control the pipeline has been revised.",
          "The set of instructions that controls the pipeline has been revised.",
          "The sets of instructions that controls the pipeline have been revised.",
        ],
        correctIndex: 1,
        explanation: "The main subject is \"the set\" (singular), so the main verb is \"has been revised\". Inside the relative clause, \"that\" refers to \"instructions\" (plural), so it takes \"control\". Two agreements in one sentence, pointing in opposite directions - which is exactly why this shape is asked.",
      },
      {
        question: "Neither the compiler warnings nor the failing test ____ noticed before the release.",
        options: ["were", "was", "have been", "are"],
        correctIndex: 1,
        explanation: "With neither-nor the verb agrees with the nearer subject, which is \"the failing test\" - singular. Had the order been reversed, \"were\" would be correct.",
      },
      {
        question: "Which sentence is correct?",
        options: [
          "The professor, along with her students, are presenting the paper.",
          "The professor, along with her students, is presenting the paper.",
          "The professor along with her students were presenting the paper.",
          "Both the professor as well as her students is presenting the paper.",
        ],
        correctIndex: 1,
        explanation: "\"Along with\" does not join subjects - only \"and\" does - so the subject stays the singular \"the professor\". Option 4 additionally breaks the both/and pair by substituting \"as well as\".",
      },
    ],
    pyqRelevance: `Subject-verb agreement is one of the most reliably recurring GA verbal topics, asked as a 1-mark sentence-correction or fill-in-the-blank.

The construction is almost always the same: a singular subject, then a long intervening phrase containing a plural noun, then the blank. The intervening phrase exists solely to make the wrong verb feel natural.

Correlative conjunction breaks are the second recurring form, usually "neither ... or" or "not only ... and". Both question types are fast marks once the two habits (find the subject, check the pair) are automatic.`,
    interviewConnection: `Agreement errors in written technical work are minor individually and cumulative in effect - a specification full of them reads as rushed, which colours how carefully a reader treats its actual content.

The transferable habit is more useful than the grammar: tracing a verb back to its real subject past a long intervening phrase is the same attention that catches which variable a long expression actually mutates.`,
    revisionSummary: `The verb agrees with the SUBJECT, not the nearest noun. Cross out intervening prepositional phrases first.

Each / every / either / neither -> singular, always. Either-or and neither-nor -> the verb agrees with the NEARER subject. Collective nouns acting as one unit -> singular.

"As well as", "along with", "in addition to", "together with" do NOT pluralize a subject. Only "and" does.

Correlative pairs are fixed: either-or, neither-nor, not only-but also, both-and, whether-or.

"The number of X is" (a quantity) versus "a number of X are" (several things).`,
    shortNotes: {
      oneMinute: "Verb agrees with SUBJECT, not the nearest noun - delete the intervening phrase and re-read. each/every/either/neither = singular. neither-nor / either-or = nearest subject wins. \"along with\"/\"as well as\" do NOT pluralize; only \"and\" does. Pairs are fixed: either-or, neither-nor, not only-but also, both-and.",
    },
  },

  "basic-vocabulary-words-idioms-and-phrases-in-context": {
    difficulty: "Easy",
    estimatedMinutes: 25,
    xpReward: 20, coinReward: 8,
    whatYoullLearn: [
      "Why GATE tests vocabulary in context rather than as isolated definitions",
      "Reading word parts to decode a word you have genuinely never seen",
      "The confusable pairs and idioms GATE returns to",
    ],
    prerequisites: [],
    concept: `## Nobody Is Asking You To Have Memorised A Dictionary

::: story
A GATE vocabulary question never says "define obfuscate."

It gives you a sentence with a word in it and asks which option could replace it without changing the meaning. Which means the sentence itself is carrying half the answer, and your job is to read that half.
:::

::: remember
This is vocabulary **in context**, and the phrase matters.

Even a word you have never seen is constrained by the sentence around it: whether it is positive or negative, whether it describes a person or a process, whether it is doing or undergoing something. Those constraints usually eliminate two options before you have thought about meaning at all.
:::

## Decoding An Unfamiliar Word

::: flow
1. Read for tone :: Does the sentence approve or disapprove? Half of all distractors are the right meaning with the wrong polarity.
2. Break the word apart :: Prefix, root, suffix. Most academic English is assembled from a small stock of Latin and Greek parts.
3. Substitute each option :: Read the full sentence back with each candidate in place. The wrong ones usually sound wrong in a way the abstract comparison hides.
:::

::: cards Word parts that carry a lot of weight
Negation :: **a-/an-** (atypical), **dis-** (disparage), **in-/im-** (implausible), **mal-** (malign), **mis-** (misconstrue)
Direction :: **circum-** around, **trans-** across, **sub-** under, **super-** above, **ante-** before, **post-** after
Quantity :: **omni-** all, **poly-** many, **mono-** one, **paucity** few, **magn-** great
Common roots :: **loqu/loc** speak, **spec** look, **dict** say, **ject** throw, **vert** turn, **cred** believe
:::

::: checkpoint
"Her explanation was so **perspicuous** that even the newest member followed it." What does perspicuous mean?
- ( ) Suspicious
- (x) Clearly expressed and easy to understand
- ( ) Unnecessarily detailed
- ( ) Delivered with confidence
> Clear. The root **spec** means "look" and the sentence's own logic supplies the rest: the newest member followed it, so the word must be positive and must be about clarity. Note the trap - "perspicuous" (clear) is routinely confused with "perspicacious" (perceptive), and GATE has used exactly that pair.
:::

## Idioms Cannot Be Read Literally

::: story
An idiom's meaning is not assembled from its words. "Let the cat out of the bag" has nothing to do with cats.

Which makes them pure memorisation - but a bounded amount of it, because GATE draws from a fairly conventional set.
:::

::: cards Idioms that recur
Beat around the bush :: Avoid coming to the point
Let the cat out of the bag :: Reveal a secret, usually accidentally
Turn a blind eye :: Deliberately ignore something wrong
Bite the bullet :: Accept something unpleasant that cannot be avoided
Once in a blue moon :: Very rarely
At the eleventh hour :: At the last possible moment
A blessing in disguise :: Something that seems bad but proves beneficial
Cut corners :: Do something cheaply or hastily, sacrificing quality
:::

::: interview
Confusable pairs are where GATE gets its cleanest 1-mark questions, because both words are real, both are plausible, and only one fits.

Affect (verb, to influence) / effect (noun, the result). Principle (a rule) / principal (chief, or a head of institution). Complement (completes) / compliment (praise). Elicit (draw out) / illicit (illegal). Discrete (separate) / discreet (tactful) - a pair that turns up constantly in technical writing too, where "discrete values" is right and "discreet values" is not.
:::`,
    keyPoints: [
      "Vocabulary is tested IN CONTEXT - the sentence constrains the answer before meaning is even considered.",
      "Method: decide the required polarity from the sentence, break the word into prefix/root/suffix, then substitute each option into the full sentence.",
      "GATE's favourite distractor is a word from the right semantic field with the WRONG polarity (elucidate offered against obfuscate).",
      "Idioms cannot be read literally and are pure memorisation, but from a bounded, conventional set.",
      "Confusable pairs contain two real words, so no spell-checker catches the error - affect/effect, principle/principal, discrete/discreet, elicit/illicit, complement/compliment.",
    ],
    analogies: [
      "Reading word parts is the same skill as reading an unfamiliar API name: you have never seen `deserializeAsync` before either, but the parts tell you what it does before you open the docs.",
    ],
    commonMistakes: [
      "Picking an option whose meaning is right but whose polarity is wrong - the most common distractor design in this question type.",
      "Reading an idiom literally. If a phrase seems oddly concrete for the sentence it is in, it is probably idiomatic.",
      "Confusing discrete/discreet, affect/effect, principle/principal, elicit/illicit, complement/compliment - each pair contains two real words, so a spell-checker will never catch the error.",
    ],
    memoryTricks: [
      "affEct = influEnce (verb), effEct = the End result (noun). Both hooks are in the vowels.",
      "princiPLE = a ruLE. principAL = the main one, or a person (the principal is your pAL).",
      "discretE = separatE. discreEt = keeps a sEcrEt.",
    ],
    shortcuts: [
      "Decide positive or negative from the sentence before looking at any option. It typically halves the field immediately.",
      "Substitute each option into the full sentence and read it. Do not compare dictionary definitions in the abstract - the sentence is the test.",
    ],
    mcqs: [
      {
        question: "The minister's response was deliberately ambiguous, an attempt to ____ rather than to clarify.",
        options: ["elucidate", "obfuscate", "enumerate", "corroborate"],
        correctIndex: 1,
        explanation: "\"Rather than to clarify\" demands a word meaning the opposite of clarify. \"Obfuscate\" is to make deliberately unclear. \"Elucidate\" is the trap - it means to clarify, so it is the right topic with exactly the wrong polarity.",
      },
      {
        question: "Choose the sentence with correct word usage.",
        options: [
          "The new policy will effect discrete departments differently.",
          "The new policy will affect discrete departments differently.",
          "The new policy will affect discreet departments differently.",
          "The new policy will effect discreet departments differently.",
        ],
        correctIndex: 1,
        explanation: "\"Affect\" is the verb meaning to influence, and \"discrete\" means separate or distinct. \"Effect\" as a verb exists but means to bring about, which does not fit, and \"discreet\" means tactful.",
      },
      {
        question: "After weeks of avoiding the decision, she finally ____ and told the team the project was cancelled.",
        options: [
          "beat around the bush",
          "bit the bullet",
          "turned a blind eye",
          "let sleeping dogs lie",
        ],
        correctIndex: 1,
        explanation: "\"Bit the bullet\" means accepting something unpleasant that cannot be avoided, which matches \"after weeks of avoiding\". The other three all describe continuing to avoid it, which contradicts \"finally\".",
      },
    ],
    pyqRelevance: `Vocabulary appears at both 1 and 2 marks, always contextual: replace the underlined word, or fill the blank so the sentence coheres.

GATE's preferred distractor is a word from the right semantic field with the wrong polarity - clarify offered against obfuscate, praise against condemn. Deciding the required polarity before reading the options defeats this design directly.

Confusable pairs (affect/effect, discrete/discreet, principle/principal) and conventional idioms make up most of the rest. A list of thirty idioms and fifteen confusable pairs covers a large share of what has actually been asked.`,
    interviewConnection: `Precise word choice is what makes technical writing trustworthy. "This will affect throughput" and "this will effect throughput" describe genuinely different claims, and a reader who notices the difference will notice that you did not.

"Discrete versus discreet" is worth internalising for its own sake - "discrete" appears constantly in mathematics, signals, and data modelling, and getting it wrong in a design document is a small, visible error in exactly the place where precision is the point.`,
    revisionSummary: `Vocabulary is tested IN CONTEXT. The sentence constrains the answer - use it before considering meaning.

Method: (1) decide positive or negative from the sentence, (2) break the word into prefix/root/suffix, (3) substitute each option into the full sentence and read it back.

Highest-value distractor to watch for: right meaning, wrong polarity.

Learn confusable pairs as pairs - affect/effect, principle/principal, complement/compliment, elicit/illicit, discrete/discreet - and treat idioms as pure memorisation from a conventional list.`,
    shortNotes: {
      oneMinute: "Contextual vocabulary: decide POLARITY from the sentence first, then break the word into parts, then substitute options into the full sentence. Classic distractor = right field, wrong polarity (elucidate vs obfuscate). Pairs: affect(v)/effect(n), principle(rule)/principal(chief), discrete(separate)/discreet(tactful), elicit/illicit, complement/compliment.",
    },
  },

  "reading-and-comprehension": {
    difficulty: "Moderate",
    estimatedMinutes: 30,
    xpReward: 25, coinReward: 10,
    // Verified real (title confirmed via direct fetch, 2026-08-13).
    resources: [{
      kind: "video",
      title: "Verbal Aptitude For GATE | Part 06 | Reading Comprehension | GATE 2024 FastTrack Batch",
      url: "https://www.youtube.com/watch?v=uedYDVbeD1o",
      description: "Whole video covers this topic from the start.",
    }],
    whatYoullLearn: [
      "The four question types a GATE passage asks, and which are safe to attempt fast",
      "Stated versus inferred - the distinction that decides most wrong answers",
      "A question-first reading order that saves real time under exam pressure",
    ],
    prerequisites: ["Basic Vocabulary: Words, Idioms and Phrases in Context"],
    concept: `## The Passage Is The Only Evidence

::: story
Reading comprehension feels like the safest question on the paper. It is text, in your own language, with the answer physically present on the page.

It is also where strong candidates lose marks, and almost always for one reason: they answered from what they know instead of from what the passage said.
:::

::: remember
Everything you know about the topic is inadmissible.

A GATE comprehension question is decided **only** by the passage. If the correct answer requires one fact from outside it, it is not the correct answer - however true that fact is.
:::

## Four Question Types, Two Difficulty Levels

::: cards What gets asked
Direct / factual :: The answer is stated in the passage. Locate it and match. Fast and near-certain - always do these first.
Inference :: The answer is not stated but follows necessarily from what is. Requires care; this is where marks leak.
Main idea :: The passage's central point, not its most interesting detail. Distractors are usually true statements that are too narrow or too broad.
Tone / attitude :: Whether the author approves, criticises, or stays neutral. Look at adjectives and verbs, not subject matter.
:::

::: mistake
The single most expensive error in comprehension is confusing **stated** with **plausible**.

An inference must follow necessarily. "The author mentions rising costs" does not license "the author believes the project should be cancelled" - that is a reasonable guess, and a reasonable guess is a wrong answer here.
:::

::: checkpoint
A passage states: "Although the new algorithm reduced memory use, its running time on large inputs was not measured." Which is a valid inference?
- ( ) The algorithm is slower on large inputs
- ( ) The algorithm is faster on large inputs
- (x) The passage provides no basis for judging its speed on large inputs
- ( ) The algorithm is unsuitable for large inputs
> Only the third. "Not measured" means exactly that - unknown. Options 1, 2 and 4 all invent a conclusion the passage explicitly declines to support, and each is the kind of answer that feels like reasoning while actually being guessing.
:::

## Read In The Right Order

::: flow
1. Skim the questions first :: Twenty seconds. You are not answering yet - you are learning what to look for, so one pass through the passage does the work of two.
2. Read the passage once, properly :: Not skimming. Mark where each question's territory lives as you pass it.
3. Answer the direct questions :: They are decided by locating text. Bank them.
4. Then the inference and tone questions :: Slower, and now informed by having already located everything.
:::

::: tip
For tone, look at the author's word choices rather than the subject.

"The proposal was ambitious" and "the proposal was reckless" describe the same proposal with opposite attitudes. And be careful with "neutral" - academic passages describing something at length are often genuinely neutral, and candidates over-read criticism into plain description.
:::

::: interview
Two habits that pay for themselves immediately.

Extreme words in an option - "always", "never", "all", "impossible", "proves" - are usually wrong, because passages rarely make absolute claims. And an option that is entirely true but not discussed in the passage is a deliberate trap, not an accident: it is placed there for the candidate answering from general knowledge.
:::`,
    keyPoints: [
      "The passage is the ONLY admissible evidence. Prior knowledge of the topic is inadmissible, however true it is.",
      "Four question types: direct (fast and near-certain), inference (slow, where marks leak), main idea (not a detail), and tone (read the author's adjectives, not the subject matter).",
      "An inference must follow NECESSARILY. A plausible conclusion is a wrong answer.",
      "Reading order: skim the questions, read the passage once properly, answer the direct questions, then the inference and tone ones.",
      "Distractor patterns: true but unsupported, an extreme quantifier (always/never/all/proves), and a real detail passed off as the main idea.",
    ],
    analogies: [
      "Treat the passage as the only admissible evidence in a courtroom. Your own knowledge of the subject is hearsay - true or not, it cannot decide the verdict.",
    ],
    commonMistakes: [
      "Answering from prior knowledge of the topic rather than from the passage. The most common cause of lost marks in this section, and the hardest to notice while doing it.",
      "Treating a plausible conclusion as a valid inference. An inference must follow necessarily, not merely reasonably.",
      "Choosing a detail as the main idea. Main-idea distractors are usually true but too narrow.",
      "Over-reading criticism into a neutral academic passage.",
    ],
    memoryTricks: [
      "Ask of every option: \"could I point at the line that makes this true?\" If not, it is not the answer.",
      "Extreme quantifiers (always / never / all / none / proves) are almost always wrong in comprehension options.",
    ],
    shortcuts: [
      "Skim the questions before the passage. One informed read beats two uninformed ones, and this is the single biggest time saving available in GA.",
      "Do all direct/factual questions before any inference questions - bank the certain marks before spending time on the slow ones.",
    ],
    mcqs: [
      {
        question: "In a GATE comprehension question, an option that is factually true in the real world but not supported by the passage is:",
        options: [
          "Correct, since it is true",
          "Incorrect, because only the passage is admissible evidence",
          "Correct only if no other option is supported",
          "Correct if the passage does not contradict it",
        ],
        correctIndex: 1,
        explanation: "Only the passage decides. Such options are placed deliberately to catch candidates answering from subject knowledge, and \"the passage does not contradict it\" is not the standard - the passage must support it.",
      },
      {
        question: "Which reading order is most time-efficient for a GATE passage with four questions?",
        options: [
          "Read the passage twice, then read the questions",
          "Skim the questions, read the passage once, answer direct questions, then inference questions",
          "Read the questions and answer each by scanning the passage separately for each one",
          "Read only the first and last paragraphs, then answer",
        ],
        correctIndex: 1,
        explanation: "Skimming the questions first makes a single careful read do the work of two, and answering direct questions before inference ones banks the certain marks first. Scanning separately per question means re-reading the passage four times.",
      },
    ],
    numericals: [
      {
        question: "GATE's General Aptitude section has 10 questions: five worth 1 mark and five worth 2 marks. What is the total mark value of the GA section?",
        answerMin: 15,
        answerMax: 15,
        unit: "marks",
        solution: `  5 questions x 1 mark  = 5
  5 questions x 2 marks = 10
  Total                 = 15 marks out of 100

Worth knowing exactly, because it is 15% of the paper for a section
most candidates prepare for in a weekend - and the same 15 marks
whether you are sitting CS, DA or any other paper.`,
      },
    ],
    pyqRelevance: `Every GATE paper carries at least one comprehension passage, typically with a 2-mark question attached, and the passages are short - a paragraph or two, not a page.

The distractor design is consistent across years: one option that is true but unsupported, one that overstates a supported point with an extreme quantifier, and one that is a real detail from the passage offered as the main idea.

Because the passages are short, the question-first reading order costs very little and saves a lot. This is one of the few places in GA where a change in technique alone reliably converts to marks.`,
    interviewConnection: `This is the closest thing in GA to a directly transferable professional skill. Reading a specification, an RFC or a bug report and distinguishing what it actually guarantees from what it merely suggests is the same discipline, and it is exactly where requirements get misimplemented.

"The document does not specify this" is a genuinely valuable thing to be able to say with confidence, and it is the same move as recognising that a passage provides no basis for a judgement.`,
    revisionSummary: `Only the passage is evidence. Prior knowledge is inadmissible, however true.

Four question types: direct (fast, certain), inference (slow, careful), main idea (not a detail), tone (read the author's adjectives, not the subject).

Inference must follow NECESSARILY, not plausibly.

Order: skim questions -> read once properly -> answer direct questions -> then inference and tone.

Distractor patterns: true but unsupported; extreme quantifier (always/never/all/proves); a real detail passed off as the main idea.`,
    shortNotes: {
      oneMinute: "Passage is the ONLY evidence - prior knowledge inadmissible. Skim questions first, read once, do direct questions before inference ones. Inference must follow necessarily, not plausibly. Kill options with always/never/all/proves. Watch for true-but-unsupported options and details posing as the main idea.",
    },
  },

  "narrative-sequencing": {
    difficulty: "Easy",
    estimatedMinutes: 20,
    xpReward: 20, coinReward: 8,
    whatYoullLearn: [
      "How to identify the opening sentence of a scrambled paragraph",
      "The linking signals that fix the order of everything after it",
      "Why building pairs beats guessing a full sequence",
    ],
    prerequisites: ["Reading and Comprehension"],
    concept: `## Four Sentences, One Correct Order

::: story
You get four or five sentences out of order and four candidate sequences. It looks like a puzzle with 24 possibilities.

It is not. The sentences carry signals that pin them to each other, and you almost never have to consider a whole sequence - you find two sentences that must be adjacent, and most options die immediately.
:::

## Finding The Opener

::: cards What an opening sentence looks like
Introduces its subject in full :: "The Industrial Revolution began in Britain" - not "It began in Britain". Full names before pronouns.
Carries no back-reference :: No "this", "therefore", "however", "such", "as a result". Every one of those points at something before it.
Is general, not specific :: Openers set up; they rarely give a number, a date, or a consequence.
:::

::: remember
The fastest single move in this question type: **eliminate every sentence containing a back-reference from being the opener.**

A sentence starting "However", "This meant", "Therefore" or "Such systems" cannot be first, because there is nothing yet for it to refer back to. That usually leaves one or two candidates.
:::

::: checkpoint
Which sentence can be the opening one of a paragraph?
- ( ) However, this approach proved unreliable.
- ( ) It was later adopted across the industry.
- (x) Early telephone networks used human operators to connect calls.
- ( ) Such delays made the system impractical.
> The third. "However" and "Such" both point backwards, and "It" is a pronoun with no antecedent yet. Only the third introduces its subject in full with nothing preceding it.
:::

## Chain By Signals, Not By Story

::: cards The signals that fix an order
Pronoun to noun :: A sentence using "it", "they", "he" must follow the one naming the thing. This is the strongest link available.
Contrast :: "However", "but", "on the other hand" must follow the claim being contrasted.
Consequence :: "Therefore", "as a result", "consequently" must follow the cause.
Addition :: "Moreover", "in addition", "also" must follow the first item in the series.
Time :: "Later", "subsequently", "eventually", "then" - and explicit dates - fix relative order directly.
:::

::: flow
1. Find the opener :: Eliminate every back-referencing sentence.
2. Build forced pairs :: Look for a pronoun and the noun it must follow, or a "therefore" and its cause. Each pair is a constraint.
3. Test the options against your pairs :: Do not construct the full order yourself. Check which given option contains all your pairs in the right adjacency - usually only one does.
:::

::: tip
Work with the options rather than against them. You are not asked to produce the sequence, only to recognise it, and two confident pairs are normally enough to eliminate three of four choices.

This is also the cheapest 1-mark question in the verbal section once the habit is built - well under a minute.
:::`,
    keyPoints: [
      "An opening sentence introduces its subject in full, carries no back-reference, and is general rather than specific.",
      "Nothing beginning with However / Therefore / Moreover / This / Such, or a bare pronoun, can be the opener - there is nothing yet for it to refer back to.",
      "The strongest available link is pronoun-to-antecedent: a sentence using \"it\" or \"they\" must follow the one that names the thing.",
      "Do not construct the sequence yourself - build two forced pairs and test the GIVEN options against them.",
    ],
    analogies: [
      "It is topological sort with very few edges. You do not need a total order derived from scratch - you need enough precedence constraints to rule out every option but one.",
    ],
    commonMistakes: [
      "Choosing an opener that begins with a back-reference (However / Therefore / This / Such) - impossible by definition, and the most common single error here.",
      "Constructing your own full sequence and then hunting for it among the options, instead of testing the options against two or three confident pairs.",
      "Ordering by what makes a nicer story rather than by the explicit linking signals. The signals are the evidence; narrative taste is not.",
    ],
    memoryTricks: [
      "Full name before pronoun, always. If one sentence says \"Dijkstra's algorithm\" and another says \"it\", the named one comes first.",
      "However/Therefore/Moreover/Such/This all point BACKWARDS. None of them can start a paragraph.",
    ],
    shortcuts: [
      "Eliminate impossible openers first - it frequently kills half the options in ten seconds.",
      "Two confident adjacent pairs are usually enough. Stop as soon as only one option survives; do not verify the rest.",
    ],
    mcqs: [
      {
        question: "In a scrambled-paragraph question, which sentence can NEVER be the opening sentence?",
        options: [
          "One that introduces a subject by its full name",
          "One that begins with \"Therefore\"",
          "One that is longer than the others",
          "One that contains a date",
        ],
        correctIndex: 1,
        explanation: "\"Therefore\" signals a consequence, which requires a preceding cause. Length and dates say nothing about position, and introducing a subject in full is a marker of an opener rather than a disqualification.",
      },
      {
        question: "The most reliable single linking signal between two sentences is:",
        options: [
          "Both sentences being similar in length",
          "A pronoun in one sentence and its antecedent noun in the other",
          "Both sentences discussing the same broad topic",
          "One sentence being a question",
        ],
        correctIndex: 1,
        explanation: "A pronoun must have an antecedent, which forces the naming sentence to come first - a hard constraint. Shared topic is far weaker, since every sentence in the paragraph shares the topic.",
      },
    ],
    pyqRelevance: `Narrative sequencing appears as a 1-mark question, typically with four sentences labelled 1-4 and four candidate orderings.

The wrong options are usually near-misses that swap one adjacent pair, so the pair-building approach is precisely aimed at how the question is constructed. Guessing from overall plausibility is far less reliable than finding one forced pronoun-antecedent link.

Budget under a minute. If you have found the opener and one confident pair and more than one option still survives, look for a second pronoun link rather than re-reading the whole set.`,
    interviewConnection: `The underlying skill is ordering by dependency, which is what you do when sequencing a migration, a deployment runbook, or the steps in a postmortem timeline.

The specific habit that transfers is refusing to order by narrative feel when explicit dependencies are available - the same reason a runbook lists prerequisites rather than reading as a story.`,
    revisionSummary: `Find the opener: introduces its subject in full, carries no back-reference, and is general rather than specific.

Nothing beginning with However / Therefore / Moreover / This / Such / a bare pronoun can be first.

Chain by signals: pronoun-to-antecedent (strongest), contrast, consequence, addition, time.

Method: eliminate impossible openers, build two confident forced pairs, then test the GIVEN options against those pairs rather than constructing the sequence yourself.`,
    shortNotes: {
      oneMinute: "Opener = full subject name, no back-reference, general. Never However/Therefore/Moreover/This/Such/bare pronoun. Strongest link = pronoun must follow its antecedent noun. Method: kill impossible openers, build 2 forced pairs, test the given options against the pairs. Under a minute.",
    },
  },

  // ---------------- Quantitative Aptitude ----------------

  "data-interpretation-graphs-plots-maps-and-tables": {
    difficulty: "Moderate",
    estimatedMinutes: 30,
    xpReward: 25, coinReward: 10,
    // Verified real (title confirmed via direct fetch, 2026-08-13).
    resources: [{
      kind: "video",
      title: "#39 | Data Interpretation - Tables | General Aptitude | COMPLETE COURSE | GATE 2023 | Christy",
      url: "https://www.youtube.com/watch?v=YZhFFAMPiOQ",
      description: "Covers table-based data interpretation specifically.",
    }],
    whatYoullLearn: [
      "Why DI is a reading test with arithmetic attached, not a maths test",
      "The chart types GATE uses and what each one hides",
      "Reading the axes and units before the question - the habit that prevents most DI errors",
    ],
    prerequisites: [],
    concept: `## The Arithmetic Is Never The Hard Part

::: story
A data interpretation question gives you a chart and asks something like "by what percentage did revenue increase from 2019 to 2021?"

The arithmetic is one subtraction and one division. Candidates still get it wrong, and almost never because of the arithmetic.

They misread the axis. They used the wrong year. They answered percentage points when the question asked percentage. They missed that the y-axis was in lakhs.
:::

::: remember
DI is a **careful reading** test with arithmetic attached. Treat the chart as the question and the calculation as an afterthought, because that is the actual difficulty distribution.
:::

## Read The Frame Before The Question

::: flow
1. Read the title :: What is this actually measuring? Revenue, profit, growth rate, and share are four different things and charts of them look identical.
2. Read both axes :: Including the units. "Rs in crores", "thousands of units", "percentage" - and check whether the axis starts at zero.
3. Check for a second scale :: Combination charts often have a right-hand axis on a completely different scale. Which series belongs to which axis is not optional information.
4. Only now read the question :: You now know what the chart can and cannot answer.
:::

::: cards What each chart type is for, and what it hides
Bar chart :: Comparing quantities across categories. Hides proportion - you cannot see share of total without adding everything up.
Line graph :: Trend over time. A truncated y-axis makes a tiny change look dramatic; always check where the axis starts.
Pie chart :: Share of a whole. Hides absolute values entirely - a 40% slice of an unstated total is not a number.
Table :: Exact values, no distortion. Slowest to read, and the only form where you can trust a precise figure.
Stacked bar :: Both total and composition. Easy to misread a segment's value by reading its top edge instead of its height.
:::

::: mistake
The trap GATE returns to most: **percentage versus percentage points**.

If a share rises from 20% to 25%, that is an increase of 5 percentage points and an increase of 25 percent. Both numbers are correct answers to different questions, and both will be among the options.
:::

::: checkpoint
A pie chart shows Department A holding 30% of a budget and Department B holding 15%. What can you conclude?
- ( ) Department A's budget is 15 crore more than B's
- (x) Department A's budget is exactly twice Department B's
- ( ) Department A grew faster than Department B
- ( ) Nothing, without more information
> A is exactly twice B - 30% against 15% is a ratio, and ratios survive without knowing the total. The absolute difference needs the total, which the chart does not give, and growth needs a second time period, which it also does not give.
:::

## Estimate Before You Compute

::: tip
Most DI options are far apart. Rounding aggressively usually identifies the answer without exact arithmetic.

"Approximately what percentage" is an explicit invitation to round. 4,870 out of 19,340 is close enough to 5,000/20,000 = 25% to distinguish it from options of 20%, 30% and 35% - and that took five seconds rather than sixty.
:::

::: interview
Do the reading work once and reuse it. A GATE DI set attaches two or three questions to one chart, so the thirty seconds spent understanding the axes is amortised across all of them.

Which also means the reverse: skipping that thirty seconds risks all the questions in the set, not just one.
:::`,
    keyPoints: [
      "Data interpretation is a careful-reading test with arithmetic attached - the difficulty is almost never the calculation.",
      "Read Title, Axes, Units and Scales before reading the question. That work is reused across every question attached to the chart.",
      "Percentage change divides by the ORIGINAL value; percentage POINTS is a plain difference. 20% to 25% is 5 points and 25 percent, and both will be options.",
      "A pie chart carries proportions only - ratios survive, absolute values need a stated total or one stated absolute figure.",
      "\"Approximately\" in the stem is an instruction to round. DI options are usually far enough apart that estimation is both safe and much faster.",
    ],
    formulas: [
      "Percentage change = ((new - old) / old) x 100. The denominator is always the ORIGINAL value.",
      "Percentage points = simple difference between two percentages. Not the same as percentage change.",
      "Share of total = (part / total) x 100.",
      "Average of a set = sum / count. For a bar chart, add the bars and divide by how many there are.",
      "Ratio from a pie chart = ratio of the two percentages (the unknown total cancels out).",
    ],
    analogies: [
      "A pie chart is a recipe given in proportions: it tells you two parts flour to one part sugar, and nothing at all about whether you are baking one cake or fifty.",
    ],
    commonMistakes: [
      "Confusing percentage change with percentage points - 20% to 25% is 5 percentage points and 25 percent. Both appear among the options.",
      "Missing a truncated y-axis (one that does not start at zero), which visually exaggerates small changes.",
      "Trying to extract absolute values from a pie chart with no stated total. Only ratios and shares are available.",
      "Using the wrong base for percentage change - dividing by the new value instead of the original.",
      "Ignoring the units on the axis (lakhs vs crores vs thousands) and reporting an answer off by a factor of 100.",
    ],
    memoryTricks: [
      "Percentage change divides by the OLD value. Change is always measured against where you started.",
      "TAUS before the question: Title, Axes, Units, Scales. Thirty seconds, reused across the whole question set.",
    ],
    shortcuts: [
      "Round hard before computing. Options in DI are usually far enough apart that estimation identifies the answer.",
      "For \"which is largest/smallest\" questions, compare ratios rather than computing every value - you rarely need the actual numbers.",
      "For percentage-increase comparisons across items, remember that a small base makes a small absolute rise into a large percentage.",
    ],
    mcqs: [
      {
        question: "A company's market share rose from 15% to 18%. Which statement is correct?",
        options: [
          "The share rose by 3 percent",
          "The share rose by 3 percentage points, which is a 20 percent increase",
          "The share rose by 20 percentage points",
          "The share rose by 18 percent",
        ],
        correctIndex: 1,
        explanation: "The simple difference is 3 percentage points. As a percentage change it is 3/15 x 100 = 20 percent. Option 1 conflates the two units, which is precisely the distractor GATE relies on.",
      },
      {
        question: "A pie chart shows the distribution of a budget with no total stated. Which question can it answer?",
        options: [
          "How much money Department A received",
          "The ratio of Department A's budget to Department B's",
          "Whether the total budget grew since last year",
          "Department A's absolute increase in funding",
        ],
        correctIndex: 1,
        explanation: "A pie chart carries proportions only. Ratios survive because the unknown total cancels; absolute amounts and any change over time do not.",
      },
    ],
    numericals: [
      {
        question: "A company's revenue was Rs 480 crore in 2022 and Rs 612 crore in 2024. What is the percentage increase, to one decimal place?",
        answerMin: 27.4,
        answerMax: 27.6,
        unit: "%",
        solution: `  Increase      = 612 - 480 = 132
  Percentage    = (132 / 480) x 100
                = 27.5%

Note the denominator: 480, the ORIGINAL value. Dividing by 612
gives 21.6%, which is the error the distractor options are built
around.`,
      },
      {
        question: "In a pie chart of 100 students by stream, Science is 40%, Commerce 35% and Arts 25%. If Commerce has 210 students, how many students are there in total?",
        answerMin: 600,
        answerMax: 600,
        unit: "students",
        solution: `  35% of total = 210
  total        = 210 / 0.35
               = 600 students

One stated absolute value is enough to unlock the whole chart -
which is exactly why GATE gives you one. Without it, only ratios
are available.`,
      },
    ],
    pyqRelevance: `DI is one of the two most reliable 2-mark GA question types, and GATE usually attaches two questions to a single chart or table.

The questions are arithmetically easy and read-carefully hard. The recurring traps are percentage versus percentage points, a truncated y-axis, mismatched units, and asking for something a pie chart structurally cannot provide.

Because the same chart serves multiple questions, the reading time is amortised - which makes DI unusually good value for the minutes it takes. Do not skip it under time pressure; skip a hard technical numerical instead.`,
    interviewConnection: `Reading a dashboard correctly is a working skill, and the failure modes are identical: a latency graph with a truncated y-axis that makes a 2ms rise look like an outage, a percentage that turns out to be percentage points, an error-rate chart with no denominator.

"What is the base for that percentage?" is a genuinely useful question in a real incident review, and it is the same question this topic trains.`,
    revisionSummary: `DI is a careful-reading test with arithmetic attached. Read Title, Axes, Units, Scales BEFORE the question.

Percentage change = (new - old) / old x 100. Denominator is always the ORIGINAL.

Percentage points is a plain difference and is NOT percentage change. 20% -> 25% is 5 points and 25 percent.

Pie charts give proportions only - ratios yes, absolute values only if a total or one absolute figure is stated.

Watch for truncated y-axes and unit mismatches (lakhs vs crores). Round aggressively; options are usually far apart.`,
    shortNotes: {
      oneMinute: "Read Title/Axes/Units/Scales first. %change = (new-old)/old x 100, denominator = ORIGINAL. Percentage POINTS is a plain difference, not %change. Pie chart = proportions only (ratios fine, absolutes need a stated total). Check for truncated y-axis and lakh/crore mismatches. Round hard - options are far apart.",
    },
  },

  "numerical-computation-and-estimation": {
    difficulty: "Easy",
    estimatedMinutes: 25,
    xpReward: 20, coinReward: 8,
    whatYoullLearn: [
      "Estimation as a deliberate exam technique, not sloppiness",
      "Which direction your rounding error points, and how to keep track of it",
      "Unit conversion and order-of-magnitude discipline",
    ],
    prerequisites: [],
    concept: `## Precision You Do Not Need Is Time You Do

::: story
GATE gives you a virtual calculator. Which makes it tempting to compute everything exactly.

That is often the slow path. When the options are 12%, 24%, 36% and 48%, computing to two decimal places buys you nothing you did not already have after rounding.
:::

::: remember
Estimation is a technique with a rule attached: **round, then check whether your rounding could have crossed a boundary between two options.**

If the options are far apart, rounding is safe and fast. If two options are close, you have to be exact. Deciding which situation you are in takes about three seconds and is the whole skill.
:::

## Know Which Way Your Error Points

::: cards Tracking the direction of rounding
Rounded the numerator UP :: Your estimate is too HIGH.
Rounded the denominator UP :: Your estimate is too LOW.
Rounded both up :: The errors partly cancel - usually a good estimate.
Rounded numerator up, denominator down :: Errors compound in the same direction - the estimate can be well off.
:::

::: tip
Round in the direction that makes the arithmetic clean, then correct mentally.

4,870 / 19,340: call it 5,000 / 20,000 = 25%. You rounded the numerator up by about 2.7% and the denominator up by about 3.4%, so the errors nearly cancel and 25% is a good estimate. That reasoning takes longer to write down than to do.
:::

::: checkpoint
You estimate 7,850 / 1,980 as 8,000 / 2,000 = 4. Compared to the true value, your estimate is:
- ( ) Exactly correct
- ( ) Too high
- (x) Slightly too low
- ( ) Impossible to say
> Slightly too low. You raised the numerator by about 1.9% and the denominator by about 1.0%. Raising the numerator pushes the quotient up and raising the denominator pushes it down, but the numerator moved more - so the true value (3.966) is just below 4. Knowing the direction is what lets you pick between two close options.
:::

## Orders Of Magnitude

::: story
The most costly arithmetic errors in an exam are not small ones. They are factor-of-ten errors, and they happen at unit boundaries.

Lakhs and crores. Millions and billions. Metres and kilometres. Seconds and milliseconds.
:::

::: cards Indian numbering, worth knowing cold
1 lakh :: 100,000 = 10^5
1 crore :: 10,000,000 = 10^7 = 100 lakh
10 crore :: 10^8
1 billion :: 10^9 = 100 crore
:::

::: interview
Sanity-check every answer against magnitude before you enter it.

If a question asks the average speed of a train and you get 4,000 km/h, the arithmetic is irrelevant - the answer is wrong. NAT questions have no negative marking, so an unchecked wrong answer costs nothing extra, but a checked one is often recoverable in the ten seconds you have left.
:::`,
    keyPoints: [
      "Estimation is a deliberate technique, not sloppiness: round, then check whether the rounding could cross a boundary between two options.",
      "Rounding the numerator up raises the result; rounding the denominator up lowers it; rounding both up makes the errors partly cancel.",
      "Scaling numerator and denominator by the same proportion leaves the quotient unchanged - worth noticing rather than computing.",
      "The expensive arithmetic errors are factor-of-ten errors at unit boundaries: lakh/crore, million/billion, m/km, s/ms.",
      "Indian units: 1 lakh = 10^5, 1 crore = 10^7 = 100 lakh, 1 billion = 10^9 = 100 crore.",
    ],
    formulas: [
      "Percentage error = |estimate - true| / true x 100.",
      "1 lakh = 10^5, 1 crore = 10^7, 1 billion = 10^9 = 100 crore.",
      "For a / b, rounding a up raises the result; rounding b up lowers it.",
      "Fraction to percentage quick set: 1/8 = 12.5%, 1/6 = 16.67%, 1/5 = 20%, 1/4 = 25%, 1/3 = 33.33%, 3/8 = 37.5%, 2/5 = 40%, 5/8 = 62.5%, 2/3 = 66.67%, 3/4 = 75%.",
    ],
    analogies: [
      "Estimation is like choosing a data type: you pick the precision the problem actually needs. Computing to eight decimals when the options differ by 12 percentage points is the arithmetic equivalent of storing a boolean in a 64-bit float.",
    ],
    commonMistakes: [
      "Rounding without checking whether two options are close enough that the rounding could flip the answer.",
      "Losing track of which direction the rounding error points, so a value just below a round number gets reported as just above it.",
      "Factor-of-ten errors at unit boundaries - lakh/crore, million/billion, m/km, s/ms. These are the expensive ones.",
      "Computing exactly when the question says \"approximately\", which is an explicit invitation to estimate.",
    ],
    memoryTricks: [
      "Numerator up -> answer up. Denominator up -> answer down. Both up -> errors cancel.",
      "Crore = 10^7. Count the zeros once, properly, and stop re-deriving it under pressure.",
    ],
    shortcuts: [
      "Learn the common fraction-to-percentage values by heart. They convert a division into a lookup.",
      "\"Approximately\" in the question stem means round immediately.",
      "Multiplying by 25 is x100/4; by 125 is x1000/8; by 5 is x10/2. Halving and doubling beats long multiplication.",
    ],
    mcqs: [
      {
        question: "Approximately what percentage is 4,870 of 19,340?",
        options: ["20%", "25%", "30%", "35%"],
        correctIndex: 1,
        explanation: "Round to 5,000/20,000 = 25%. The options are 5 percentage points apart, so the rounding error (well under 1 point) cannot cross a boundary - estimation is safe and roughly ten times faster than exact division.",
      },
      {
        question: "You estimate 5,940 / 2,970 as 6,000 / 3,000 = 2. What can you say about the true value?",
        options: [
          "It is exactly 2",
          "It is slightly more than 2",
          "It is slightly less than 2",
          "It could be either side of 2",
        ],
        correctIndex: 0,
        explanation: "Both numbers were scaled by almost exactly the same factor (about 1.01), so the ratio is preserved: 5940/2970 is exactly 2. When numerator and denominator are rounded by the same proportion, the quotient is unchanged - a useful thing to notice rather than compute.",
      },
    ],
    numericals: [
      {
        question: "A project costs Rs 2.4 crore. Expressed in lakhs, what is the cost?",
        answerMin: 240,
        answerMax: 240,
        unit: "lakh",
        solution: `  1 crore = 100 lakh
  2.4 crore = 2.4 x 100 = 240 lakh

The whole question is the conversion factor. This is the shape a
factor-of-ten error takes in a real exam - answering 24 or 2400
costs the same mark as not knowing anything about the topic.`,
      },
      {
        question: "Estimate 38% of 1,250 without a calculator.",
        answerMin: 475,
        answerMax: 475,
        unit: "",
        solution: `  Split it into easy pieces:
    25% of 1250 = 312.5
    10% of 1250 = 125
     3% of 1250 = 37.5

    38% = 25% + 10% + 3%
        = 312.5 + 125 + 37.5
        = 475

Decomposing into 25% / 10% / 1% chunks is faster and far less
error-prone than multiplying by 0.38 by hand.`,
      },
    ],
    pyqRelevance: `Estimation is rarely the stated subject of a GATE question - it is the technique that makes the other quantitative questions fit in the time available.

Where it appears explicitly, the stem says "approximately", which is a direct instruction to round. Where it appears implicitly, it is in DI sets, ratio questions and speed problems whose options are far enough apart that exact arithmetic is wasted effort.

The one thing worth drilling specifically is the fraction-to-percentage table. It converts a division into recall, which is the difference between a fifteen-second question and a ninety-second one.`,
    interviewConnection: `Order-of-magnitude estimation is a genuine interview skill in systems and design rounds - "roughly how much storage does a billion rows of this need?" expects a fast approximate answer, not an exact one, and being unable to produce one reads badly.

The unit discipline transfers directly too: milliseconds versus seconds in a latency budget, and MB versus MiB in a capacity estimate, are the same class of error as lakh versus crore.`,
    revisionSummary: `Estimation is a technique with a rule: round, then check whether the rounding could cross a boundary between two options. Options far apart -> round. Options close -> be exact.

Direction of error: numerator up raises the result, denominator up lowers it, both up partly cancel.

Know the fraction-to-percentage table cold (1/8, 1/6, 1/5, 1/4, 1/3, 3/8, 2/5, 5/8, 2/3, 3/4).

Indian units: 1 lakh = 10^5, 1 crore = 10^7 = 100 lakh, 1 billion = 100 crore.

Decompose percentages into 25% / 10% / 1% chunks. Always sanity-check the magnitude of an answer before entering it.`,
    shortNotes: {
      oneMinute: "\"Approximately\" = round immediately. Numerator up -> up, denominator up -> down, both up -> cancel. Check whether rounding can cross an option boundary. 1 lakh = 10^5, 1 crore = 10^7 = 100 lakh, 1 billion = 100 crore. Decompose percentages as 25/10/1 chunks. Sanity-check magnitude before entering a NAT answer.",
    },
  },

  "ratios-percentages-powers-and-exponents": {
    difficulty: "Moderate",
    estimatedMinutes: 30,
    xpReward: 25, coinReward: 10,
    whatYoullLearn: [
      "Why successive percentage changes do not add, and what to do instead",
      "Ratios as a scaling tool, using the multiplier-k method",
      "Exponent and surd rules that show up in GA and in technical sections alike",
    ],
    prerequisites: ["Numerical Computation and Estimation"],
    concept: `## Percentages Do Not Add

::: story
A price rises 20%, then falls 20%. Back where it started?

  Start        100
  After +20%   120
  After -20%   120 - 24 = 96

Not 100. Ninety-six.

The rise was 20% of 100. The fall was 20% of 120. Different bases, so they cannot cancel.
:::

::: remember
Successive percentage changes **multiply**, they do not add.

Convert each change to a multiplier and multiply them: +20% is x1.2, -20% is x0.8, and 1.2 x 0.8 = 0.96, a 4% net fall. This single technique handles every successive-change question, including three or four changes in a row where adding becomes hopeless.
:::

::: checkpoint
A salary is increased 25%, then reduced 20%. What is the net change?
- ( ) 5% increase
- (x) No change
- ( ) 5% decrease
- ( ) 45% increase
> No change. 1.25 x 0.80 = 1.00 exactly. This pair is a favourite because adding gives +5% and the true answer is zero, so a candidate who adds gets a clean-looking wrong answer.
:::

## Ratios: Introduce k

::: story
"Two quantities are in the ratio 3:5 and their sum is 64."

The move that makes every ratio problem mechanical: stop treating 3 and 5 as numbers. They are 3k and 5k.
:::

::: flow
Write the parts with k :: 3k and 5k.
Apply the given condition :: 3k + 5k = 64, so 8k = 64 and k = 8.
Read off the answers :: 3k = 24 and 5k = 40.
:::

::: tip
The same method handles the harder version, where the ratio changes.

"The ratio is 3:5; after adding 4 to each, it becomes 5:8." Write 3k and 5k, then (3k+4)/(5k+4) = 5/8, cross-multiply, and solve for k. Nothing new is required - the k does all the work.
:::

## Exponents And Surds

::: cards The rules that get used
Product :: a^m x a^n = a^(m+n)
Quotient :: a^m / a^n = a^(m-n)
Power of a power :: (a^m)^n = a^(mn)
Zero and negative :: a^0 = 1 (a nonzero), a^(-n) = 1/a^n
Fractional :: a^(1/n) = the nth root of a, so a^(m/n) = the nth root of a^m
Rationalising :: multiply by the conjugate - 1/(sqrt(3) - 1) x (sqrt(3) + 1)/(sqrt(3) + 1) = (sqrt(3) + 1)/2
:::

::: mistake
Two errors that account for most lost marks here.

(a + b)^2 is NOT a^2 + b^2 - the cross term 2ab is real and is exactly what the question is testing. And a^m x b^m is (ab)^m, not a^(m) + b^(m); the product rule only combines exponents when the BASE is shared.
:::

::: interview
The multiplier habit generalises far beyond percentages.

Compound interest is the same idea: 8% for three years is x1.08^3. A 12% monthly attrition rate over six months is x0.88^6. Anything that changes by a proportion repeatedly is a product of multipliers, and recognising that turns a family of question types into one.
:::`,
    keyPoints: [
      "Successive percentage changes MULTIPLY, they never add. Convert each to a multiplier: +x% is (1 + x/100), -x% is (1 - x/100).",
      "A rise of x% followed by a fall of x% always loses, by exactly x^2/100 percent. 20/20 loses 4%, 30/30 loses 9%.",
      "Percentage change is always computed on the ORIGINAL value, and profit/loss percentages on COST price unless stated otherwise.",
      "Ratio problems become mechanical once every part is written as a multiple of k - the condition then gives one linear equation.",
      "Exponent rules only combine when the BASE is shared: a^m x a^n = a^(m+n), but a^m x b^m = (ab)^m.",
    ],
    formulas: [
      "Percentage change = (new - old) / old x 100.",
      "Successive changes: multiply the multipliers. +x% -> (1 + x/100), -x% -> (1 - x/100).",
      "Net effect of +x% then -x% = -(x^2)/100 percent. A 20% rise then 20% fall = -4%, always.",
      "Ratio a:b with sum S -> parts are aS/(a+b) and bS/(a+b).",
      "a^m x a^n = a^(m+n); a^m / a^n = a^(m-n); (a^m)^n = a^(mn); a^0 = 1; a^(-n) = 1/a^n.",
      "(a + b)^2 = a^2 + 2ab + b^2. (a - b)^2 = a^2 - 2ab + b^2. a^2 - b^2 = (a + b)(a - b).",
      "Profit% and loss% are both computed on COST price unless the question says otherwise.",
    ],
    analogies: [
      "A percentage multiplier is a scale factor, and applying two of them is the same as composing two transformations - order does not matter for the product, but you can never add scale factors.",
    ],
    commonMistakes: [
      "Adding successive percentage changes instead of multiplying the multipliers. +20% then -20% is -4%, never 0%.",
      "Using the new value as the base for percentage change instead of the original.",
      "Expanding (a + b)^2 as a^2 + b^2 and dropping the 2ab cross term.",
      "Applying the exponent product rule across different bases - a^m x b^m is (ab)^m, not a^(m+n).",
      "Computing profit percentage on the selling price when the convention is cost price.",
    ],
    memoryTricks: [
      "Every percentage change becomes a multiplier: +x% -> (1 + x/100), -x% -> (1 - x/100). Then just multiply.",
      "+x% then -x% always LOSES, by exactly x^2/100 percent. 10/10 loses 1%, 20/20 loses 4%, 50/50 loses 25%.",
      "Ratio problems: write every part as a multiple of k before doing anything else.",
    ],
    shortcuts: [
      "For a rise-then-equal-fall pair, skip the arithmetic: the net is -(x^2)/100 percent.",
      "x% of y always equals y% of x. 18% of 50 is easier read as 50% of 18 = 9.",
      "To increase by 25%, multiply by 5/4. To decrease by 20%, multiply by 4/5. Fractions beat decimals for mental work.",
    ],
    mcqs: [
      {
        question: "A quantity increases by 30% and then decreases by 30%. The net effect is:",
        options: ["No change", "A 9% decrease", "A 9% increase", "A 60% increase"],
        correctIndex: 1,
        explanation: "1.3 x 0.7 = 0.91, a 9% decrease - which matches the shortcut -(x^2)/100 = -900/100 = -9%. Adding the changes gives zero, which is the intended trap.",
      },
      {
        question: "If a^3 x a^5 = a^k, then k equals:",
        options: ["15", "8", "2", "a^8"],
        correctIndex: 1,
        explanation: "Same base, so exponents add: 3 + 5 = 8. Option 1 applies the power-of-a-power rule (multiplying) where the product rule (adding) belongs, which is the standard confusion between the two.",
      },
      {
        question: "Two numbers are in the ratio 4:7. If 15 is added to each, the ratio becomes 5:8. What method finds them fastest?",
        options: [
          "Trial and error over the multiples of 4 and 7",
          "Write them as 4k and 7k, set (4k+15)/(7k+15) = 5/8, and solve for k",
          "Assume the numbers are 4 and 7",
          "Add the ratios and divide by 15",
        ],
        correctIndex: 1,
        explanation: "The k-multiplier method turns the condition into one linear equation. Here 8(4k+15) = 5(7k+15) gives 32k + 120 = 35k + 75, so 3k = 45, k = 15, and the numbers are 60 and 105.",
      },
    ],
    numericals: [
      {
        question: "A shopkeeper marks up an item 40% above cost, then gives a 25% discount. What is the profit percentage?",
        answerMin: 5,
        answerMax: 5,
        unit: "%",
        solution: `  Take cost = 100.
    Marked price   = 100 x 1.40 = 140
    Selling price  = 140 x 0.75 = 105
    Profit         = 105 - 100  = 5
    Profit%        = 5 / 100 x 100 = 5%

Multipliers: 1.40 x 0.75 = 1.05, so 5% directly. Note the profit
percentage is on COST (100), not on the marked price.`,
      },
      {
        question: "The ratio of two numbers is 3:5 and their difference is 18. What is the larger number?",
        answerMin: 45,
        answerMax: 45,
        unit: "",
        solution: `  Write them as 3k and 5k.
    5k - 3k = 18
    2k      = 18
    k       = 9

    Larger = 5k = 45   (smaller = 3k = 27, difference 18)`,
      },
      {
        question: "A population of 10,000 grows 10% in the first year and 20% in the second. What is the population after two years?",
        answerMin: 13200,
        answerMax: 13200,
        unit: "people",
        solution: `  10000 x 1.10 x 1.20 = 13200

Adding the percentages gives 30% and 13,000, which is wrong -
the second year's 20% applies to 11,000, not to 10,000.`,
      },
    ],
    pyqRelevance: `This is the highest-frequency quantitative area in GA, appearing at both 1 and 2 marks, and the successive-percentage-change shape recurs most of all - usually as profit/loss with a markup and a discount, or as a population or salary changing twice.

The distractors are built for the candidate who adds percentages. In a +20%/-20% question, "no change" will be an option; in a markup-then-discount question, the "40 - 25 = 15%" answer will be there too.

Ratio questions almost always yield to the k-multiplier method in one linear equation. Exponent questions are usually single-rule applications, testing whether you can tell the product rule from the power-of-a-power rule under time pressure.`,
    interviewConnection: `The multiplier habit is directly useful in capacity and growth reasoning: 15% month-on-month growth for a year is x1.15^12, not x2.8, and the difference between those two answers is the difference between a correct forecast and a badly wrong one.

Percentage-on-what-base discipline matters in performance work too - "a 50% improvement" is meaningless until you know whether the base is the old latency or the new one, and reviewers who ask are the ones who catch inflated claims.`,
    revisionSummary: `Successive percentage changes MULTIPLY. Convert each to a multiplier: +x% -> (1 + x/100), -x% -> (1 - x/100).

+x% then -x% always loses, by exactly x^2/100 percent. 20/20 -> -4%. 30/30 -> -9%.

Percentage change divides by the ORIGINAL. Profit/loss percentages are on COST price.

Ratios: write every part as a multiple of k, apply the condition, solve one equation.

Exponents: same base -> add exponents for a product, subtract for a quotient, multiply for a power of a power. (a+b)^2 keeps the 2ab term.

x% of y = y% of x.`,
    shortNotes: {
      oneMinute: "Successive % changes MULTIPLY, never add. +x% = x(1+x/100), -x% = x(1-x/100). +x% then -x% loses x^2/100 percent exactly. %change divides by the ORIGINAL; profit% is on COST. Ratios -> write as 3k, 5k and solve. Exponents: same base -> add for product, multiply for power-of-power. x% of y = y% of x.",
    },
  },

  "logarithms-permutations-and-combinations": {
    difficulty: "Moderate",
    estimatedMinutes: 30,
    xpReward: 25, coinReward: 10,
    whatYoullLearn: [
      "Logarithms as the inverse of exponentiation, and the four rules that follow",
      "The one question that separates a permutation from a combination",
      "Standard counting patterns - restrictions, identical items, and circular arrangements",
    ],
    prerequisites: ["Ratios, Percentages, Powers and Exponents"],
    concept: `## A Logarithm Is A Question

::: story
"What power of 2 gives 8?" Three.

Written down, that is log base 2 of 8 = 3. The logarithm is not a new operation to memorise - it is exponentiation asked backwards.
:::

::: remember
log_b(x) = y means exactly b^y = x. Same statement, read from the other end.

Every logarithm rule falls out of an exponent rule you already know: exponents ADD when you multiply powers, so logs ADD when you multiply arguments.
:::

::: cards The rules, and their exponent parents
log(xy) = log x + log y :: because a^m x a^n = a^(m+n)
log(x/y) = log x - log y :: because a^m / a^n = a^(m-n)
log(x^n) = n log x :: because (a^m)^n = a^(mn)
log_b(b) = 1, log_b(1) = 0 :: because b^1 = b and b^0 = 1
Change of base :: log_b(x) = log_c(x) / log_c(b)
:::

::: checkpoint
If log_2(x) = 5, what is x?
- ( ) 10
- (x) 32
- ( ) 25
- ( ) 2.5
> 32. Read the definition backwards: log_2(x) = 5 means 2^5 = x, and 2^5 = 32. Option 3 comes from multiplying the base by the exponent, which is the most common misreading of the notation.
:::

## Permutation Or Combination: Does Order Matter?

::: story
Three people, and you must pick two.

For a photograph, is "Asha then Bipin" different from "Bipin then Asha"? Yes - it is a different photograph. Order matters, so it is a permutation.

For a committee, is "Asha and Bipin" different from "Bipin and Asha"? No - it is the same two people. Order does not matter, so it is a combination.
:::

::: remember
Ask one question before anything else: **would swapping two of the chosen items produce a different outcome?**

Yes -> permutation, nPr. No -> combination, nCr. Every counting question begins here, and getting it wrong makes the rest of the work irrelevant.
:::

::: cards Words that tell you which
Permutation :: arrange, order, rank, seat, form a number, password, podium finish, schedule
Combination :: select, choose, committee, team, handshake, subset, group
:::

::: tip
Restrictions get handled by absorbing them, not by working around them.

Two people must sit together? Glue them into one block, arrange the (n-1) items, then multiply by 2 for the two internal orders. Someone must be included? Include them, then choose the rest from what remains. Someone must be excluded? Remove them from n before you start.

And when a condition is awkward ("at least one"), count the complement: total minus the case with none. That converts most "at least" questions into a single subtraction.
:::

::: interview
Three standard results worth having ready, because they are asked directly.

Arrangements of n items with repeats - divide by the factorial of each repeat count. "MISSISSIPPI" has 11 letters with I x4, S x4, P x2, so it is 11!/(4! 4! 2!).

Circular arrangements of n distinct items - (n-1)!, because rotating an arrangement does not create a new one. If reflections also count as identical (a necklace), it is (n-1)!/2.

Handshakes among n people - nC2, the cleanest illustration that order does not matter.
:::`,
    keyPoints: [
      "log_b(x) = y is exactly b^y = x - a logarithm is exponentiation asked backwards, not a new operation.",
      "Every log rule mirrors an exponent rule, which is why logs turn multiplication into addition. There is NO rule for log(x + y).",
      "Before any counting, ask one question: would swapping two chosen items change the outcome? Yes means nPr, no means nCr.",
      "nCr = nC(n-r), so always compute with the smaller r - 50C48 is 50C2.",
      "Standard results worth having ready: arrangements with repeats divide by each repeat's factorial, circular arrangements are (n-1)!, and \"at least one\" is total minus none.",
    ],
    formulas: [
      "log_b(x) = y  <->  b^y = x.",
      "log(xy) = log x + log y; log(x/y) = log x - log y; log(x^n) = n log x.",
      "log_b(x) = log_c(x) / log_c(b)  (change of base).",
      "nPr = n! / (n - r)!   - order matters.",
      "nCr = n! / (r! (n - r)!)   - order does not matter.",
      "nCr = nC(n-r). Useful shortcut: 20C18 = 20C2 = 190.",
      "Arrangements of n items with repeats = n! / (p! q! ...) for repeat counts p, q, ...",
      "Circular arrangements of n distinct items = (n - 1)!; necklace (reflections identical) = (n - 1)!/2.",
      "Total subsets of an n-element set = 2^n.",
    ],
    analogies: [
      "A permutation is a tuple and a combination is a set. Swapping two elements of a tuple gives a different tuple; swapping two elements of a set gives the same set.",
    ],
    commonMistakes: [
      "Using nPr where nCr belongs (or the reverse) - the error is upstream of all the arithmetic, so no amount of careful computation recovers it.",
      "Forgetting to divide by the repeat factorials when arranging items with identical members.",
      "Using n! instead of (n-1)! for a circular arrangement.",
      "Reading log_b(x) = y as \"b times y = x\" instead of \"b to the power y = x\".",
      "Assuming log(x + y) simplifies. There is no rule for the log of a sum - only for products, quotients and powers.",
    ],
    memoryTricks: [
      "C for Committee (no order), P for Photograph or Podium (order matters).",
      "Logs turn multiplication into addition. That is the whole point, and every rule is a restatement of it.",
      "Circular arrangement = fix one person, arrange the rest -> (n-1)!.",
    ],
    shortcuts: [
      "nCr = nC(n-r). Always compute with the smaller r: 50C48 is 50C2 = 1225.",
      "For \"at least one\" questions, count the complement and subtract from the total.",
      "For \"must be together\", glue the group into one block and multiply by the internal arrangements at the end.",
    ],
    mcqs: [
      {
        question: "In how many ways can a committee of 3 be selected from 8 people?",
        options: ["336", "56", "24", "512"],
        correctIndex: 1,
        explanation: "A committee has no order, so it is 8C3 = 56. 336 is 8P3, the answer to the different question of arranging 3 of 8 in order - and it is there for exactly the candidate who does not stop to ask whether order matters.",
      },
      {
        question: "If log_10(2) = 0.301, then log_10(8) equals:",
        options: ["0.903", "2.408", "0.602", "3.010"],
        correctIndex: 0,
        explanation: "8 = 2^3, so log(8) = 3 log(2) = 3 x 0.301 = 0.903. Recognising the argument as a power of a known value is the move these questions test.",
      },
      {
        question: "How many distinct arrangements are there of the letters of the word LEVEL?",
        options: ["120", "60", "30", "20"],
        correctIndex: 2,
        explanation: "Five letters with L appearing twice and E appearing twice: 5!/(2! 2!) = 120/4 = 30. Answering 120 forgets the repeats, which is the standard error in this question type.",
      },
    ],
    numericals: [
      {
        question: "In how many ways can 6 people be seated around a circular table?",
        answerMin: 120,
        answerMax: 120,
        unit: "ways",
        solution: `  Circular arrangements of n distinct items = (n - 1)!

    (6 - 1)! = 5! = 120

Why not 6! = 720: rotating everyone one seat to the left produces
the same seating, so each distinct arrangement was counted 6 times.
Fixing one person's seat removes the rotation entirely.`,
      },
      {
        question: "A team of 4 must be chosen from 6 men and 4 women, and must include at least 1 woman. How many such teams are possible?",
        answerMin: 195,
        answerMax: 195,
        unit: "teams",
        solution: `  Count the complement - it is one term instead of four.

    Total teams of 4 from 10   = 10C4 = 210
    Teams with NO woman        =  6C4 = 15
    At least one woman         = 210 - 15 = 195

Counting directly would need the 1-woman, 2-woman, 3-woman and
4-woman cases summed. "At least one" almost always means subtract
the "none" case.`,
      },
      {
        question: "What is the value of log_2(64) + log_3(27)?",
        answerMin: 9,
        answerMax: 9,
        unit: "",
        solution: `  log_2(64): 2^6 = 64, so it is 6
  log_3(27): 3^3 = 27, so it is 3

  6 + 3 = 9

Read each one as "what power of the base gives this?" - no rules
needed when the argument is an exact power.`,
      },
    ],
    pyqRelevance: `Permutations and combinations appear regularly, usually as a 2-mark question, and the distractor set almost always contains both the nPr and the nCr value. The question is really whether you paused to ask if order matters.

The recurring shapes are: select a committee with a constraint ("at least one woman", "including a specific person"), arrange letters of a word with repeated letters, and seat people in a circle. All three have a standard treatment worth having automatic.

Logarithms appear less often and more simply - typically evaluating an expression using log(x^n) = n log x with a given value of log 2 or log 3, at 1 mark. Rarely worth more than a minute.`,
    interviewConnection: `Logarithms are the language of complexity analysis, and the intuition matters more than the algebra: log_2(n) is "how many times can I halve n", which is why binary search and balanced trees have the complexities they do.

Counting shows up in test design and in reasoning about state spaces - "how many distinct configurations does this feature flag combination produce" is nCr or 2^n reasoning, and getting it wrong is how combinatorial test gaps happen.`,
    revisionSummary: `log_b(x) = y means b^y = x. Every log rule mirrors an exponent rule: log(xy) = log x + log y, log(x/y) = log x - log y, log(x^n) = n log x. There is NO rule for log(x + y).

Before any counting: would swapping two chosen items change the outcome? Yes -> nPr. No -> nCr.

nPr = n!/(n-r)!, nCr = n!/(r!(n-r)!), and nCr = nC(n-r) so always use the smaller r.

Repeats -> divide by each repeat's factorial. Circle -> (n-1)!. Necklace -> (n-1)!/2. "At least one" -> total minus none. "Must be together" -> glue into a block, multiply by internal orders.`,
    shortNotes: {
      oneMinute: "log_b(x)=y <-> b^y=x. log(xy)=log x+log y, log(x^n)=n log x, no rule for log(x+y). Order matters -> nPr, order does not -> nCr. nCr = nC(n-r), use smaller r. Repeated letters -> divide by repeat factorials. Circle -> (n-1)!. \"At least one\" -> total minus none. \"Together\" -> glue and multiply.",
    },
  },

  "series-and-progressions": {
    difficulty: "Moderate",
    estimatedMinutes: 25,
    xpReward: 25, coinReward: 10,
    whatYoullLearn: [
      "Recognising an AP, a GP, and the patterns that are neither",
      "The nth-term and sum formulas, and when each applies",
      "The differences-of-differences technique for an unfamiliar series",
    ],
    prerequisites: ["Numerical Computation and Estimation"],
    concept: `## Two Patterns, Then Everything Else

::: story
Look at 3, 7, 11, 15. Each term is 4 more than the last - a constant **difference**.

Now 3, 6, 12, 24. Each term is 2 times the last - a constant **ratio**.

Those two account for most of what GATE asks. Everything else is found by looking one level down.
:::

::: cards The two standard progressions
Arithmetic (AP) :: Constant difference d. nth term = a + (n-1)d. Sum = n/2 x (first + last), or n/2 x (2a + (n-1)d).
Geometric (GP) :: Constant ratio r. nth term = a x r^(n-1). Sum = a(r^n - 1)/(r - 1) for r not 1.
:::

::: flow
How to identify a series
Subtract consecutive terms :: Constant? It is an AP, and you are done.
Divide consecutive terms :: Constant? It is a GP.
Neither? Look at the differences themselves :: If the differences form their own pattern, that is the structure. Repeat if needed.
:::

::: checkpoint
Find the next term: 2, 6, 12, 20, 30, ?
- ( ) 38
- ( ) 40
- (x) 42
- ( ) 44
> 42. The differences are 4, 6, 8, 10 - an AP with d = 2. The next difference is 12, so the next term is 30 + 12 = 42. Neither subtraction nor division of the original terms gives anything constant; the pattern lives one level down, which is where you should always look second.
:::

## Sums Worth Knowing Cold

::: cards Standard sums
First n natural numbers :: n(n+1)/2
First n squares :: n(n+1)(2n+1)/6
First n cubes :: [n(n+1)/2]^2 - the square of the first sum
First n odd numbers :: n^2 exactly
Infinite GP, |r| < 1 :: a/(1 - r)
:::

::: tip
The sum of an AP has a form worth internalising: **count x average**.

n/2 x (first + last) is just "how many terms, times the mean of the first and last". Because an AP is evenly spaced, that mean is the average of the whole series - which is why the formula is that simple, and why you can reconstruct it if you forget it.
:::

::: mistake
Off-by-one in the term count is the most common error here, not the formula.

The number of terms from a to l with common difference d is (l - a)/d + 1. That "+1" is inclusive counting: from 10 to 100 in steps of 10 there are 10 terms, not 9.
:::

::: interview
Two patterns beyond AP and GP that GATE reuses.

Alternating series, where two interleaved patterns are hiding in one list - 1, 10, 2, 20, 3, 30 is two series, not one. If the differences alternate in sign or swing wildly, split the terms into odd and even positions.

And letter series, which are number series in disguise: convert letters to positions (A=1 to Z=26) and the pattern usually becomes an AP immediately.
:::`,
    keyPoints: [
      "An AP has a constant difference and a GP a constant ratio - between them they account for most of what GATE asks.",
      "Identify a series in a fixed order: differences first, ratios second, differences-of-the-differences third.",
      "The AP sum is count x average of first and last, which is why n/2 x (first + last) is reconstructible if the formula slips.",
      "The number of terms from a to l with difference d is (l - a)/d + 1 - and that \"+1\" is where most marks in this topic are lost.",
      "An infinite GP only has a finite sum when |r| < 1, in which case it is a/(1 - r).",
      "Terms that swing up and down usually mean two interleaved series - split the odd and even positions.",
    ],
    formulas: [
      "AP nth term: a_n = a + (n - 1)d.",
      "AP sum: S_n = n/2 x (first + last) = n/2 x (2a + (n - 1)d).",
      "GP nth term: a_n = a x r^(n - 1).",
      "GP sum: S_n = a(r^n - 1)/(r - 1) for r not equal to 1.",
      "Infinite GP sum (|r| < 1): S = a/(1 - r).",
      "Sum of first n naturals = n(n+1)/2. Sum of first n squares = n(n+1)(2n+1)/6. Sum of first n cubes = [n(n+1)/2]^2.",
      "Sum of first n odd numbers = n^2. Sum of first n even numbers = n(n+1).",
      "Number of terms from a to l with difference d = (l - a)/d + 1.",
      "Arithmetic mean of a and b = (a+b)/2. Geometric mean = sqrt(ab).",
    ],
    analogies: [
      "An AP is a loop with a fixed increment; a GP is a loop with a fixed multiplier. Same distinction as adding a constant each iteration versus doubling each iteration - and it is why one grows linearly and the other explodes.",
    ],
    commonMistakes: [
      "Off-by-one in the term count. From a to l with difference d there are (l-a)/d + 1 terms, not (l-a)/d.",
      "Applying the infinite GP sum formula when |r| >= 1, where the series diverges and no finite sum exists.",
      "Testing only differences and giving up, instead of looking at the differences of the differences.",
      "Missing an alternating series - two interleaved patterns read as one chaotic sequence.",
      "Using the AP sum formula on a GP, or the reverse, without checking which one the series actually is.",
    ],
    memoryTricks: [
      "AP sum = count x average of first and last. Reconstructible even if the formula slips.",
      "Sum of the first n odd numbers is exactly n^2. 1+3+5+7 = 16 = 4^2.",
      "Sum of cubes is the square of the sum of naturals. One formula, not two.",
    ],
    shortcuts: [
      "Differences first, ratios second, differences-of-differences third. In that order, every time.",
      "If terms swing up and down, split into odd and even positions - it is almost certainly two interleaved series.",
      "Letter series: convert to A=1..Z=26 immediately. The pattern is nearly always an AP once you do.",
    ],
    mcqs: [
      {
        question: "What is the 20th term of the arithmetic progression 7, 11, 15, ...?",
        options: ["83", "79", "87", "80"],
        correctIndex: 0,
        explanation: "a = 7, d = 4, so a_20 = 7 + 19 x 4 = 83. Answering 87 uses 20d instead of 19d - the off-by-one that this formula invites.",
      },
      {
        question: "The sum of the infinite series 8 + 4 + 2 + 1 + ... is:",
        options: ["15", "16", "Infinite", "32"],
        correctIndex: 1,
        explanation: "A GP with a = 8 and r = 1/2. Since |r| < 1 the sum converges to a/(1-r) = 8/(1/2) = 16. The series has infinitely many terms but a finite sum, which is the point of the formula.",
      },
      {
        question: "Find the next term: 5, 11, 23, 47, ?",
        options: ["71", "94", "95", "83"],
        correctIndex: 2,
        explanation: "Each term is double the previous plus 1: 5x2+1 = 11, 11x2+1 = 23, 23x2+1 = 47, 47x2+1 = 95. The differences (6, 12, 24) are themselves a GP, which is the signal to look for a multiply-and-add rule rather than a pure AP or GP.",
      },
    ],
    numericals: [
      {
        question: "How many terms are there in the arithmetic progression 12, 18, 24, ..., 96?",
        answerMin: 15,
        answerMax: 15,
        unit: "terms",
        solution: `  Number of terms = (last - first)/d + 1

    = (96 - 12)/6 + 1
    = 84/6 + 1
    = 14 + 1
    = 15 terms

The "+1" is inclusive counting. Omitting it gives 14, which is the
standard wrong answer for this question type.`,
      },
      {
        question: "Find the sum of the first 25 odd natural numbers.",
        answerMin: 625,
        answerMax: 625,
        unit: "",
        solution: `  The sum of the first n odd numbers is exactly n^2.

    25^2 = 625

Confirming with the AP formula: a = 1, d = 2, last term
= 1 + 24x2 = 49, so S = 25/2 x (1 + 49) = 25/2 x 50 = 625.
Same answer, three times the work.`,
      },
      {
        question: "The 4th term of a GP is 24 and the 7th term is 192. What is the common ratio?",
        answerMin: 2,
        answerMax: 2,
        unit: "",
        solution: `  a_7 / a_4 = r^(7-4) = r^3

    192 / 24 = 8
    r^3      = 8
    r        = 2

Dividing two terms cancels the first term entirely - which is why
you never need 'a' to find 'r'.`,
      },
    ],
    pyqRelevance: `Series questions appear in GA at both 1 and 2 marks, most often as "find the next term" rather than as a formula application.

The 1-mark versions are usually an AP, a GP, or a differences-of-differences pattern. The 2-mark versions tend to be multiply-and-add rules (x2+1), alternating interleaved series, or letter series requiring conversion to positions.

Formula-based questions (nth term, sum, number of terms) show up too, and the off-by-one in the term count is by far the most common way they are lost. The standard sums - naturals, squares, odds - are worth having memorised rather than derived.`,
    interviewConnection: `Recognising growth type is the practical version of this. A loop that adds a constant per iteration and one that doubles per iteration are an AP and a GP, and confusing them is confusing O(n) with O(2^n).

The sum of the first n naturals appears constantly in complexity analysis - it is why a nested loop where the inner bound depends on the outer index is O(n^2), and being able to see n(n+1)/2 in that structure is genuinely useful.`,
    revisionSummary: `AP: constant difference. a_n = a + (n-1)d. Sum = n/2 x (first + last).
GP: constant ratio. a_n = a x r^(n-1). Sum = a(r^n - 1)/(r - 1). Infinite sum a/(1-r) only when |r| < 1.

Identify in order: differences, then ratios, then differences of the differences.

Number of terms = (last - first)/d + 1. The +1 is where marks are lost.

Standard sums: naturals n(n+1)/2, squares n(n+1)(2n+1)/6, cubes [n(n+1)/2]^2, first n odds = n^2.

If terms swing, split odd and even positions - two interleaved series. Letter series -> convert A=1..Z=26 first.`,
    shortNotes: {
      oneMinute: "AP: a+(n-1)d, sum = n/2 x (first+last). GP: a x r^(n-1), sum = a(r^n-1)/(r-1), infinite = a/(1-r) only if |r|<1. Identify: differences -> ratios -> differences of differences. #terms = (last-first)/d + 1 (the +1 matters). First n odds = n^2. Sum of cubes = (sum of naturals)^2. Swinging terms -> two interleaved series.",
    },
  },

  "mensuration-and-geometry": {
    difficulty: "Moderate",
    estimatedMinutes: 30,
    xpReward: 25, coinReward: 10,
    whatYoullLearn: [
      "The area and volume formulas GATE actually uses",
      "How scaling a linear dimension affects area and volume - the most-tested idea here",
      "Pythagoras and similar triangles as the two workhorses of GA geometry",
    ],
    prerequisites: ["Ratios, Percentages, Powers and Exponents"],
    concept: `## Double The Radius, Quadruple The Area

::: story
A circle's radius doubles. What happens to its area?

Not double. Area goes as r^2, so doubling r multiplies area by 4. Volume goes as r^3, so it multiplies by 8.

That single fact - how dimension interacts with scaling - is the most frequently tested idea in GA mensuration, and it is a source of confidently wrong answers.
:::

::: remember
Scale every linear dimension by k, and:
- lengths scale by **k**
- areas scale by **k^2**
- volumes scale by **k^3**

So a 10% increase in radius raises area by 21% (1.1^2 = 1.21) and volume by 33.1% (1.1^3 = 1.331) - not by 10%, and not by 20% and 30% either.
:::

::: checkpoint
All the edges of a cube are increased by 20%. By what percentage does its volume increase?
- ( ) 20%
- ( ) 60%
- (x) 72.8%
- ( ) 8%
> 72.8%. Volume scales by k^3, so 1.2^3 = 1.728, an increase of 72.8%. Answering 60% triples the percentage instead of cubing the multiplier - a distinction worth internalising, because 3 x 20% and 1.2^3 are genuinely different operations.
:::

## The Formulas You Need

::: cards 2D areas and perimeters
Rectangle :: area lb, perimeter 2(l + b)
Triangle :: area (1/2) x base x height; or Heron's sqrt(s(s-a)(s-b)(s-c)) with s = (a+b+c)/2
Equilateral triangle :: area (sqrt(3)/4)a^2
Circle :: area pi r^2, circumference 2 pi r
Trapezium :: area (1/2)(sum of parallel sides) x height
Parallelogram :: area base x height
:::

::: cards 3D volumes and surface areas
Cube :: volume a^3, total surface 6a^2
Cuboid :: volume lbh, total surface 2(lb + bh + hl)
Cylinder :: volume pi r^2 h, curved surface 2 pi r h, total 2 pi r(r + h)
Cone :: volume (1/3) pi r^2 h, curved surface pi r l where l = sqrt(r^2 + h^2)
Sphere :: volume (4/3) pi r^3, surface 4 pi r^2
Hemisphere :: volume (2/3) pi r^3, total surface 3 pi r^2
:::

::: tip
The cone and the sphere are where the factors get forgotten. Cone volume carries a 1/3, sphere volume carries a 4/3.

A useful anchor: a cone and a sphere and a cylinder of the same radius and height r stand in the ratio 1 : 2 : 3 by volume. Get one and you can reconstruct the others.
:::

## Two Tools Do Most Of The Work

::: cards Pythagoras and similarity
Pythagoras :: In a right triangle, a^2 + b^2 = c^2. Know the triples cold - (3,4,5), (5,12,13), (8,15,17), (7,24,25) - and their multiples, since GATE uses them to keep arithmetic clean.
Similar triangles :: Equal angles mean corresponding sides are in a constant ratio. Areas of similar figures go as the SQUARE of that ratio.
:::

::: interview
Watch the units, and watch whether a surface area is total or curved.

Volume in cubic centimetres against a capacity in litres is a factor of 1000 (1 litre = 1000 cm^3). And "surface area of a cylinder" is ambiguous until you know whether the ends are included - GATE states which, and candidates read past it.
:::`,
    keyPoints: [
      "Scaling is the most-tested idea here: scale every linear dimension by k and lengths go as k, areas as k^2, volumes as k^3.",
      "So a 20% edge increase raises area by 44% and volume by 72.8% - not by 20%, and not by 40% and 60%.",
      "Cone volume carries a 1/3 and sphere volume a 4/3. Anchor them with cone : sphere : cylinder = 1 : 2 : 3 at the same radius and height.",
      "Cone volume uses the vertical height; curved surface area uses the slant height l = sqrt(r^2 + h^2). Swapping them is a standard error.",
      "Pythagoras plus the triples (3,4,5), (5,12,13), (8,15,17), (7,24,25) covers nearly all GA right-triangle work - GATE uses them to keep arithmetic clean.",
      "For similar figures, areas go as the square of the side ratio and volumes as the cube.",
    ],
    formulas: [
      "Scaling: lengths x k, areas x k^2, volumes x k^3.",
      "Circle: area = pi r^2, circumference = 2 pi r.",
      "Triangle: area = (1/2) base x height. Equilateral: (sqrt(3)/4) a^2. Heron: sqrt(s(s-a)(s-b)(s-c)), s = (a+b+c)/2.",
      "Trapezium area = (1/2)(a + b) h.",
      "Cube: V = a^3, TSA = 6a^2. Cuboid: V = lbh, TSA = 2(lb + bh + hl).",
      "Cylinder: V = pi r^2 h, CSA = 2 pi r h, TSA = 2 pi r (r + h).",
      "Cone: V = (1/3) pi r^2 h, CSA = pi r l, slant l = sqrt(r^2 + h^2).",
      "Sphere: V = (4/3) pi r^3, SA = 4 pi r^2. Hemisphere: V = (2/3) pi r^3, TSA = 3 pi r^2.",
      "Pythagoras: a^2 + b^2 = c^2. Triples: (3,4,5), (5,12,13), (8,15,17), (7,24,25).",
      "Similar figures: sides in ratio k -> areas in ratio k^2, volumes in ratio k^3.",
      "1 litre = 1000 cm^3. 1 m^3 = 1000 litres.",
    ],
    analogies: [
      "Scaling is why a large animal cannot have the same proportions as a small one: double every length and weight (volume) goes up 8 times while bone cross-section (area) goes up only 4. The same k^2-versus-k^3 mismatch that GATE tests is why elephants have thick legs.",
    ],
    commonMistakes: [
      "Scaling area or volume linearly - a 20% edge increase raises volume by 72.8%, not 20% or 60%.",
      "Dropping the 1/3 in cone volume or the 4/3 in sphere volume.",
      "Confusing curved surface area with total surface area. Read whether the ends are included.",
      "Using the slant height where the vertical height belongs in cone volume, or the reverse in curved surface area.",
      "Mixing units - cm against m, or cm^3 against litres (a factor of 1000).",
    ],
    memoryTricks: [
      "Cone : sphere : cylinder = 1 : 2 : 3 in volume, for the same radius r and height r. One ratio recovers three formulas.",
      "Powers follow dimensions: 1D length k, 2D area k^2, 3D volume k^3. The exponent is the number of dimensions.",
      "Sphere surface 4 pi r^2 is exactly four times the area of its own great circle (pi r^2).",
    ],
    shortcuts: [
      "For percentage-change questions, work in multipliers and raise to the power of the dimension: +10% on radius -> area x1.1^2, volume x1.1^3.",
      "Recognise Pythagorean triples on sight - GATE uses them so the arithmetic stays clean, which means seeing one confirms you are on the intended path.",
      "For an equilateral triangle, (sqrt(3)/4)a^2 is faster than finding the height and using (1/2)bh.",
    ],
    mcqs: [
      {
        question: "If the radius of a sphere is increased by 50%, its surface area increases by:",
        options: ["50%", "100%", "125%", "225%"],
        correctIndex: 2,
        explanation: "Surface area scales by k^2, so 1.5^2 = 2.25 - an increase of 125%, not a new value of 125%. Option 4 reports the multiplier as a percentage increase, which is the more subtle of the two traps here.",
      },
      {
        question: "A cone and a cylinder have the same radius and the same height. The ratio of their volumes is:",
        options: ["1:1", "1:2", "1:3", "2:3"],
        correctIndex: 2,
        explanation: "Cone volume is (1/3) pi r^2 h and cylinder volume is pi r^2 h, so the ratio is 1:3. This is the fact that makes the 1/3 in the cone formula memorable rather than arbitrary.",
      },
      {
        question: "Two similar triangles have corresponding sides in the ratio 3:5. The ratio of their areas is:",
        options: ["3:5", "9:25", "6:10", "27:125"],
        correctIndex: 1,
        explanation: "Areas of similar figures go as the square of the side ratio: 3^2 : 5^2 = 9:25. Option 4 is the volume ratio, which would apply to similar solids, not triangles.",
      },
    ],
    numericals: [
      {
        question: "A cylindrical tank has radius 7 m and height 10 m. What is its volume in cubic metres? Use pi = 22/7.",
        answerMin: 1539,
        answerMax: 1541,
        unit: "m^3",
        solution: `  V = pi r^2 h
    = (22/7) x 7 x 7 x 10
    = 22 x 7 x 10
    = 1540 m^3

Note how the radius 7 cancels the 7 in 22/7 - GATE chooses radii
that are multiples of 7 precisely so this happens, which is a
useful signal that you have picked the right formula.`,
      },
      {
        question: "The edge of a cube is increased by 25%. By what percentage does its total surface area increase?",
        answerMin: 56.2,
        answerMax: 56.3,
        unit: "%",
        solution: `  Surface area scales by k^2, with k = 1.25.

    1.25^2 = 1.5625
    Increase = 56.25%

Answering 50% (2 x 25%) or 25% both come from scaling linearly,
which is the single most common error in this topic.`,
      },
      {
        question: "A right triangle has legs of 9 cm and 12 cm. What is the length of its hypotenuse in cm?",
        answerMin: 15,
        answerMax: 15,
        unit: "cm",
        solution: `  a^2 + b^2 = c^2
    81 + 144 = 225
    c = 15 cm

This is the (3,4,5) triple scaled by 3 - recognising it removes the
arithmetic entirely, which is why the triples are worth memorising.`,
      },
    ],
    pyqRelevance: `Mensuration appears at both mark values, and the single most-asked idea is scaling: increase a dimension by x% and report the effect on area or volume.

GATE chooses numbers so the arithmetic stays clean - radii that are multiples of 7 when pi = 22/7 is given, and Pythagorean triples rather than arbitrary right triangles. Seeing those is a signal you are on the intended solution path.

Geometry beyond mensuration is light in GA: mostly Pythagoras and similar triangles, occasionally a composite figure where you add or subtract two standard shapes. Coordinate geometry and trigonometric identities are effectively out of scope for GA.`,
    interviewConnection: `The k^2-versus-k^3 idea is exactly the intuition behind why some scaling arguments fail. Doubling the side of a grid quadruples the cells; doubling the resolution of a 3D volume renders eight times the voxels.

It also explains a class of performance surprise: an image processing step that seemed linear in "size" is quadratic in linear dimension, and the difference only becomes visible when someone uploads a photo twice as wide.`,
    revisionSummary: `Scaling is the most-tested idea: lengths x k, areas x k^2, volumes x k^3. A 20% edge increase raises volume by 1.2^3 - 1 = 72.8%.

Circle pi r^2 / 2 pi r. Cylinder pi r^2 h. Cone (1/3) pi r^2 h with slant sqrt(r^2 + h^2). Sphere (4/3) pi r^3 and 4 pi r^2.

Anchor: cone : sphere : cylinder = 1 : 2 : 3 in volume at the same r and h = r.

Pythagoras plus the triples (3,4,5), (5,12,13), (8,15,17), (7,24,25). Similar figures: areas as k^2, volumes as k^3.

Check curved versus total surface area, and check units (1 litre = 1000 cm^3).`,
    shortNotes: {
      oneMinute: "Lengths x k, areas x k^2, volumes x k^3 - the most-tested idea. Cone (1/3)pi r^2 h, sphere (4/3)pi r^3 and 4pi r^2, cylinder pi r^2 h. Cone:sphere:cylinder = 1:2:3 by volume. Pythagorean triples 3-4-5, 5-12-13, 8-15-17, 7-24-25. Similar figures -> areas as k^2. Check curved vs total SA, and litres vs cm^3 (x1000).",
    },
  },

  "elementary-statistics-and-probability": {
    difficulty: "Moderate",
    estimatedMinutes: 30,
    xpReward: 25, coinReward: 10,
    whatYoullLearn: [
      "Mean, median and mode - and when each one misrepresents the data",
      "The addition and multiplication rules, and the independence assumption they rest on",
      "Complement and conditional probability as the two techniques that shorten most problems",
    ],
    prerequisites: ["Logarithms, Permutations and Combinations"],
    concept: `## Three Averages, Three Different Claims

::: story
Ten people in a room. Nine earn 30,000 a month and one earns 3,000,000.

Mean income: about 327,000. Median income: 30,000.

Both are correct. Only one of them describes anyone in the room.
:::

::: cards The three measures, and what breaks each
Mean :: The arithmetic average. Uses every value, and is therefore dragged by outliers - which is exactly what happened above.
Median :: The middle value when sorted. Immune to outliers, which is why income and latency are reported this way.
Mode :: The most frequent value. The only one that works on categorical data, and it may not be unique.
:::

::: remember
For an even count, the median is the **average of the two middle values** after sorting.

And sorting is not optional. Taking the middle of an unsorted list is the most common mechanical error in this topic.
:::

::: checkpoint
A dataset is 4, 4, 5, 9, 100. Which measure best represents a typical value?
- ( ) The mean, 24.4
- (x) The median, 5
- ( ) The mode, 4
- ( ) All three are equally representative
> The median. 100 drags the mean to 24.4, a value larger than four of the five data points. The mode (4) is defensible but describes only the repeated value rather than the centre. This is precisely why service latencies are reported as medians and percentiles rather than means.
:::

## Probability Is Counting, Divided

::: story
Probability of an event = favourable outcomes / total outcomes, when all outcomes are equally likely.

Which means most probability questions are counting questions, and the counting tools from the previous lesson are what you actually use.
:::

::: cards The rules
Addition (either A or B) :: P(A or B) = P(A) + P(B) - P(A and B). Subtract the overlap, or you count it twice.
Mutually exclusive :: If A and B cannot both happen, P(A and B) = 0 and the rule simplifies to P(A) + P(B).
Multiplication (both A and B) :: P(A and B) = P(A) x P(B) only if A and B are INDEPENDENT.
Dependent events :: P(A and B) = P(A) x P(B given A). Drawing without replacement is always this case.
Complement :: P(not A) = 1 - P(A).
:::

::: mistake
Multiplying probabilities without checking independence is the error that produces the most confidently wrong answers.

Two cards drawn **with** replacement are independent - 4/52 each time. Drawn **without** replacement they are not: the second probability is 3/51, because the deck changed. GATE always states which, and the two answers are different.
:::

::: tip
"At least one" almost always means: compute the probability of **none**, and subtract from 1.

P(at least one six in four rolls) = 1 - (5/6)^4. Counting directly requires the one-six, two-six, three-six and four-six cases summed. One subtraction versus four terms.
:::

::: interview
Know standard sample space sizes so you are not deriving them under time pressure.

One die 6, two dice 36, one coin 2, n coins 2^n, a deck 52 with 13 of each suit and 4 of each rank, 12 face cards, 26 red. And for two dice specifically, a sum of 7 has 6 favourable outcomes - the most of any sum, which is why 7 turns up in so many questions.
:::`,
    keyPoints: [
      "Mean uses every value and is dragged by outliers; median is the middle after SORTING and resists them; mode is the only one that works on categorical data.",
      "For an even count the median is the average of the two middle values - and the data must be sorted first.",
      "P(A or B) = P(A) + P(B) - P(A and B). Skipping the overlap term double-counts outcomes in both events.",
      "P(A and B) = P(A) x P(B) ONLY if the events are independent. Drawing without replacement is never independent.",
      "\"At least one\" almost always means 1 - P(none) - one subtraction instead of several summed cases.",
      "Standard sample spaces: one die 6, two dice 36, n coins 2^n, a deck 52. Two dice summing to 7 has 6 favourable outcomes.",
    ],
    formulas: [
      "Mean = sum of values / count.",
      "Median = middle value after SORTING; for an even count, the average of the two middle values.",
      "Mode = most frequent value; may not be unique.",
      "Variance = average of (value - mean)^2. Standard deviation = sqrt(variance).",
      "P(event) = favourable outcomes / total outcomes (equally likely outcomes).",
      "P(A or B) = P(A) + P(B) - P(A and B).",
      "P(A and B) = P(A) x P(B) if independent; otherwise P(A) x P(B|A).",
      "P(not A) = 1 - P(A). P(at least one) = 1 - P(none).",
      "Bayes: P(A|B) = P(B|A) P(A) / P(B).",
      "Sample spaces: one die 6, two dice 36, n coins 2^n, deck 52 (13 per suit, 4 per rank, 12 face cards).",
    ],
    analogies: [
      "The mean-versus-median distinction is why nobody reports average response time for a service. One request that hung for 30 seconds moves the mean and leaves the median where it belongs - describing what a typical user actually experienced.",
    ],
    commonMistakes: [
      "Taking the median without sorting the data first.",
      "Multiplying probabilities for dependent events - without replacement, the second draw's denominator has changed.",
      "Forgetting to subtract the overlap in P(A or B) and so double-counting outcomes in both events.",
      "Computing an \"at least one\" probability by summing cases instead of using 1 - P(none).",
      "Confusing P(A|B) with P(B|A). They are different quantities and are only equal by coincidence.",
    ],
    memoryTricks: [
      "MEDian is the one in the MIDdle - but only after sorting.",
      "\"And\" -> multiply, \"or\" -> add (minus the overlap). Then check independence before you multiply.",
      "\"At least one\" -> 1 minus none. Almost always the short route.",
    ],
    shortcuts: [
      "For \"at least one\", always use the complement. It converts a sum of several terms into a single subtraction.",
      "For two dice, memorise that sum 7 has 6 outcomes, sums 6 and 8 have 5 each, 5 and 9 have 4 each. It removes the enumeration.",
      "If a question says \"without replacement\", write the second fraction's denominator as (n-1) before doing anything else.",
    ],
    mcqs: [
      {
        question: "Which measure of central tendency is least affected by an extreme outlier?",
        options: ["Mean", "Median", "Standard deviation", "Range"],
        correctIndex: 1,
        explanation: "The median depends only on position after sorting, so a single extreme value moves it by at most one place. The mean uses every value directly, and both range and standard deviation are defined in terms of spread, so extremes affect them strongly.",
      },
      {
        question: "Two cards are drawn from a standard deck WITHOUT replacement. The probability both are aces is:",
        options: [
          "(4/52) x (4/52)",
          "(4/52) x (3/51)",
          "(4/52) + (3/51)",
          "(4/52) x (4/51)",
        ],
        correctIndex: 1,
        explanation: "Without replacement, both the ace count and the deck size drop for the second draw: 4/52 x 3/51. Option 1 is the with-replacement answer, which is the intended trap when a candidate multiplies without checking dependence.",
      },
      {
        question: "A fair coin is tossed 3 times. What is the probability of getting at least one head?",
        options: ["1/8", "3/8", "7/8", "1/2"],
        correctIndex: 2,
        explanation: "P(no heads) = (1/2)^3 = 1/8, so P(at least one head) = 1 - 1/8 = 7/8. Enumerating the one-head, two-head and three-head cases gives the same answer with three times the work.",
      },
    ],
    numericals: [
      {
        question: "Find the median of the dataset 12, 7, 3, 15, 9, 20.",
        answerMin: 10.5,
        answerMax: 10.5,
        unit: "",
        solution: `  Sort first:  3, 7, 9, 12, 15, 20

  Six values (even count), so the median is the average of the
  two middle ones - the 3rd and 4th:

    (9 + 12) / 2 = 10.5

Taking 9 or 12 alone, or working from the unsorted list, are the
two standard errors here.`,
      },
      {
        question: "Two fair dice are rolled. What is the probability that the sum is 7? Give the answer as a decimal to three places.",
        answerMin: 0.166,
        answerMax: 0.167,
        unit: "",
        solution: `  Total outcomes = 6 x 6 = 36

  Favourable (sum 7): (1,6) (2,5) (3,4) (4,3) (5,2) (6,1) = 6

    P = 6/36 = 1/6 = 0.167

Sum 7 has more favourable outcomes than any other sum, which is
why it appears so often in dice questions.`,
      },
      {
        question: "A bag has 5 red and 3 blue balls. Two are drawn without replacement. What is the probability that both are red? Give the answer to three decimal places.",
        answerMin: 0.357,
        answerMax: 0.358,
        unit: "",
        solution: `  First draw:  5 red out of 8      = 5/8
  Second draw: 4 red out of 7 left  = 4/7

    P(both red) = (5/8) x (4/7) = 20/56 = 5/14 = 0.357

Equivalently by combinations: 5C2 / 8C2 = 10/28 = 5/14. Both routes
agree, and the combination form is often faster for three or more
draws.`,
      },
    ],
    pyqRelevance: `Probability and statistics are among the most reliably present GA topics, usually at 2 marks, and often as NAT questions - which means no options to work backwards from and no negative marking.

The recurring shapes are: dice or coins with an "at least one" condition, drawing balls or cards with and without replacement, and a mean/median comparison on a small dataset with one outlier planted in it.

Because these are frequently NAT, the answer has to be right rather than merely closest. The two techniques that most reduce error are the complement rule for "at least one", and writing the second denominator as (n-1) the moment you read "without replacement".`,
    interviewConnection: `The mean-versus-median point is directly professional: p50 and p99 latencies exist because a mean response time hides exactly the behaviour you care about. Being able to say why the average is the wrong statistic for a long-tailed distribution is a genuinely useful thing in a design discussion.

Conditional probability underlies the base-rate problem in monitoring and testing too - a test that is "99% accurate" for a condition affecting one in ten thousand produces mostly false positives, and that reasoning is Bayes' theorem applied to alert design.`,
    revisionSummary: `Mean uses every value and is dragged by outliers. Median is the middle after SORTING (average of the two middle values for an even count) and resists outliers. Mode is the most frequent, and is the only one that works on categories.

P = favourable / total. P(A or B) = P(A) + P(B) - P(A and B). P(A and B) = P(A) x P(B) ONLY if independent, otherwise P(A) x P(B|A).

Without replacement -> dependent -> the second denominator drops by one.

"At least one" -> 1 - P(none). Almost always the shortest route.

Sample spaces: die 6, two dice 36, n coins 2^n, deck 52. Two dice summing to 7 has 6 favourable outcomes.`,
    shortNotes: {
      oneMinute: "Mean is outlier-sensitive, median is not (SORT first; even count -> average the two middle). P(A or B) = P(A)+P(B)-P(A and B). Multiply only if INDEPENDENT; without replacement -> P(A) x P(B|A), denominator drops by 1. \"At least one\" -> 1 - P(none). Two dice: 36 outcomes, sum 7 has 6.",
    },
  },

  // ---------------- Analytical Aptitude ----------------

  "logic-deduction-and-induction": {
    difficulty: "Moderate",
    estimatedMinutes: 30,
    xpReward: 25, coinReward: 10,
    whatYoullLearn: [
      "Deduction versus induction, and why only one of them guarantees its conclusion",
      "Syllogisms, and the invalid patterns that feel true",
      "Venn diagrams as a mechanical way to settle a syllogism instead of arguing about it",
    ],
    prerequisites: [],
    concept: `## Two Kinds Of Reasoning, Two Kinds Of Certainty

::: story
"All men are mortal. Socrates is a man. Therefore Socrates is mortal."

If the premises are true, the conclusion **cannot** be false. That is deduction, and it is airtight.

"Every swan I have seen is white. Therefore all swans are white."

Reasonable. Also famously wrong - black swans exist in Australia. That is induction: the conclusion is probable, never guaranteed.
:::

::: cards The distinction, and where each is used
Deduction :: General to specific. A valid deduction with true premises has a conclusion that must be true. This is what mathematics and GATE's logic questions run on.
Induction :: Specific to general. Extends observed cases to a rule. Useful, and never certain - one counterexample destroys it.
:::

::: remember
GATE's logic questions are deductive. The instruction is almost always "which conclusion **necessarily** follows", and that word is the whole test.

Not "which is likely". Not "which a reasonable person would accept". Which cannot fail to be true given the statements.
:::

## The Some-Some Trap

::: story
"Some doctors are teachers. Some teachers are singers. Therefore some doctors are singers."

It sounds fine. It is invalid.

The teachers who are doctors and the teachers who are singers may be two completely separate groups of teachers. Nothing in the premises forces them to overlap.
:::

::: cards Valid and invalid patterns
All A are B, all B are C :: Valid - all A are C.
All A are B, some B are C :: INVALID - the C-ish B's might be entirely outside A.
Some A are B, some B are C :: INVALID - the classic trap. No overlap is guaranteed.
All A are B, no B are C :: Valid - no A are C.
Some A are B :: Valid conversion - some B are A. "Some" runs both ways.
All A are B :: Does NOT convert. "All dogs are animals" does not give "all animals are dogs".
:::

::: checkpoint
"All engineers are graduates. Some graduates are unemployed." Does it follow that some engineers are unemployed?
- ( ) Yes, since engineers are graduates
- (x) No - the unemployed graduates could all be non-engineers
- ( ) Yes, but only if most graduates are engineers
- ( ) The premises are contradictory
> No. Engineers sit inside the set of graduates, but "some graduates are unemployed" does not say WHICH graduates. Every unemployed graduate could be from outside the engineering subset, and nothing rules that out - so the conclusion is not guaranteed.
:::

## Draw It Instead Of Arguing About It

::: flow
1. Draw the definite relationships :: "All A are B" is a circle inside a circle. "No A are B" is two separate circles.
2. Handle "some" as a deliberate choice :: "Some B are C" only requires ONE point of overlap. Draw the overlap as far from A as the premises allow.
3. Test the conclusion against your drawing :: If you can draw ONE diagram satisfying all premises where the conclusion is false, the conclusion is invalid. One counterexample is enough.
:::

::: tip
That last step is the whole technique, and it inverts how most people approach these.

You are not trying to prove the conclusion. You are trying to **break** it - to find a legal diagram where the premises hold and the conclusion fails. If you can, it is invalid. If you genuinely cannot, it is valid.
:::

::: interview
Watch for "either-or" conclusion pairs, which GATE uses in its harder logic questions.

When neither conclusion follows alone, but the two together exhaust all the possibilities, the correct answer is "either I or II follows". These are rare and worth recognising, because a candidate checking each conclusion in isolation concludes that neither follows and misses the option.
:::`,
    keyPoints: [
      "Deduction guarantees its conclusion if the premises are true; induction only makes it probable. GATE tests deduction, and signals it with the word \"necessarily\".",
      "\"Some\" statements convert freely - some A are B means some B are A. \"All\" statements do NOT convert.",
      "Two \"some\" premises can never yield a valid conclusion. If both premises say \"some\", suspect \"does not follow\" immediately.",
      "The technique is to BREAK the conclusion, not prove it: one legal Venn diagram where the premises hold and the conclusion fails settles invalidity.",
      "Real-world knowledge is inadmissible. The premises may be absurd and must still be taken exactly as given.",
    ],
    analogies: [
      "Deduction is a type checker: if the inputs satisfy the signature, the output is guaranteed. Induction is a test suite: passing a thousand cases is strong evidence and still not a proof.",
    ],
    commonMistakes: [
      "Concluding \"some A are C\" from \"some A are B\" and \"some B are C\" - the single most-tested invalid pattern in this topic.",
      "Converting \"all\" statements. \"All A are B\" does not give \"all B are A\", though \"some A are B\" does give \"some B are A\".",
      "Using real-world knowledge to accept a conclusion the premises do not support. In these questions the premises may be absurd and must still be taken as given.",
      "Trying to prove the conclusion instead of trying to break it. Finding one counterexample diagram is faster and more reliable.",
    ],
    memoryTricks: [
      "\"Some\" is symmetric, \"all\" is not. Some A are B <-> some B are A. All A are B does NOT reverse.",
      "Two \"some\" premises can never produce a valid \"some\" conclusion. If both premises say \"some\", be suspicious immediately.",
      "To disprove, draw. One legal diagram where the conclusion fails settles it.",
    ],
    shortcuts: [
      "If both premises contain \"some\", the answer is almost always \"does not follow\".",
      "A conclusion containing a term that appears in neither premise cannot follow.",
      "Draw the \"some\" overlap as far from the conclusion's subject as the premises permit - it constructs the counterexample for you.",
    ],
    mcqs: [
      {
        question: "\"All roses are flowers. Some flowers fade quickly.\" Which conclusion necessarily follows?",
        options: [
          "Some roses fade quickly",
          "All flowers are roses",
          "No valid conclusion follows",
          "Roses never fade quickly",
        ],
        correctIndex: 2,
        explanation: "The flowers that fade quickly need not include any roses - they could all be non-rose flowers, and the premises permit that. Option 1 is the trap; option 2 illegally reverses an \"all\" statement; option 4 asserts more than the premises support.",
      },
      {
        question: "Which of these is an example of inductive reasoning?",
        options: [
          "All primes greater than 2 are odd; 17 is prime and greater than 2; so 17 is odd",
          "The first 100 terms of this sequence are increasing, so the sequence is increasing",
          "If x = 5 then x^2 = 25",
          "No squares are negative; -4 is negative; so -4 is not a square",
        ],
        correctIndex: 1,
        explanation: "Generalising from 100 observed terms to all terms is induction - probable but not guaranteed, since term 101 could break it. The other three are deductions whose conclusions follow necessarily from their premises.",
      },
      {
        question: "\"Some A are B\" is logically equivalent to:",
        options: ["All B are A", "Some B are A", "No B are A", "All A are B"],
        correctIndex: 1,
        explanation: "\"Some\" statements convert freely: if at least one thing is both A and B, then at least one B is an A. This symmetry is worth knowing because it is the only conversion that is always legal.",
      },
    ],
    pyqRelevance: `Syllogisms and "which conclusion follows" questions appear in GA at both mark values, and GATE's wording is precise: "necessarily follows" or "logically follows", never "is likely".

The invalid patterns are reused heavily because they are intuitively appealing - some-some being the most common by a wide margin, followed by illegally reversing an "all" statement.

The Venn approach is worth practising specifically, because it converts an argument you could talk yourself into either side of into a mechanical check. Aim to settle a two-premise syllogism in under 45 seconds by drawing rather than reasoning verbally.`,
    interviewConnection: `The deduction/induction distinction is the difference between "the type system guarantees this" and "we have never seen it fail in production". Both are useful; treating the second as the first is how outages happen.

The habit of trying to break a claim rather than confirm it is directly the reviewer's instinct - and it is the same move as looking for a counterexample input rather than re-reading the happy path.`,
    revisionSummary: `Deduction: general to specific, conclusion GUARANTEED if premises are true. Induction: specific to general, conclusion probable only. GATE tests deduction, and its wording is "necessarily follows".

Valid: all-all -> all. all A are B + no B are C -> no A are C. Some A are B <-> some B are A.

Invalid: some + some -> anything. all A are B + some B are C -> some A are C. Reversing an "all".

Technique: draw the definite relations, place each "some" overlap as far from the conclusion as the premises allow, and try to BREAK the conclusion. One legal counterexample diagram proves invalidity.

Heuristic: two "some" premises almost always mean no conclusion follows.`,
    shortNotes: {
      oneMinute: "Deduction = guaranteed, induction = probable. GATE asks what NECESSARILY follows. \"Some\" converts (some A are B <-> some B are A); \"all\" does not. some+some -> never a valid conclusion. Method: draw Venn, place overlaps as far away as allowed, try to BREAK the conclusion - one counterexample diagram settles it.",
    },
  },

  "analogy": {
    difficulty: "Easy",
    estimatedMinutes: 20,
    xpReward: 20, coinReward: 8,
    whatYoullLearn: [
      "Naming the relationship as the one technique that makes analogies fast",
      "The standard relationship types GATE draws from",
      "Why direction and precision of the relationship decide between two plausible options",
    ],
    prerequisites: [],
    concept: `## Name The Relationship, Then Test It

::: story
"Doctor : Hospital :: Teacher : ?"

The temptation is to jump straight to the options and see which one feels right. That is how you pick "student" - a real, strong association with "teacher" that is not the relationship in question.

The relationship in the first pair is **works in**. A doctor works in a hospital. A teacher works in a school.
:::

::: remember
Say the relationship out loud as a sentence before looking at any option.

"A doctor works in a hospital." Then substitute: "a teacher works in a ___." The sentence itself rejects "student" immediately, without any judgement call.
:::

::: cards The relationship types GATE reuses
Worker to workplace :: Doctor : Hospital, Chef : Kitchen
Worker to tool :: Carpenter : Saw, Surgeon : Scalpel
Part to whole :: Petal : Flower, Chapter : Book
Cause to effect :: Virus : Illness, Rain : Flood
Object to function :: Pen : Write, Knife : Cut
Degree or intensity :: Warm : Hot, Sad : Devastated
Synonym or antonym :: Brave : Courageous, Expand : Contract
Category to member :: Metal : Copper, Bird : Sparrow
Product to raw material :: Bread : Flour, Paper : Wood
:::

::: checkpoint
"Scalpel : Surgeon :: Chalk : ?" Which completes it best?
- ( ) Board
- (x) Teacher
- ( ) Classroom
- ( ) Lesson
> Teacher. The relationship is "tool used by", and the order matters - tool first, user second. "Board" is what chalk is used ON, and "classroom" is where it is used, both of which are different relationships. Preserving the direction is what picks between them.
:::

## Direction And Precision

::: cards Two ways a plausible option is wrong
Reversed direction :: If the first pair is tool-to-user, the answer must be tool-to-user too. "Surgeon : Scalpel" and "Scalpel : Surgeon" are different relationships and GATE offers both.
Too broad :: If the relationship is "specific tool of", then a general category is not precise enough. Sharpen the relationship until only one option survives.
:::

::: tip
When two options both fit, your stated relationship was not specific enough. Add a qualifier and re-test.

"Bird : Sparrow" - is it category-to-member? Then "Metal : Copper" fits and so does "Vehicle : Wheel". Sharpen it: category to a MEMBER of that category, not a PART of it. Now "Vehicle : Wheel" fails and only one option remains.
:::

::: interview
Letter and number analogies are the same technique with a different alphabet.

"AC : BD :: PR : ?" - convert to positions (A=1, C=3, B=2, D=4) and the relationship is "+1 to each letter". P=16, R=18 becomes Q=17, S=19, so QS. Always convert letters to numbers first; the pattern is usually an addition that is invisible in letter form.
:::`,
    keyPoints: [
      "State the relationship as a full sentence, with its direction, BEFORE looking at any option. That single habit defeats most distractors.",
      "The strongest distractor is the strongest association rather than the stated relationship - \"Teacher : Student\" where \"Teacher : School\" is wanted.",
      "Direction is part of the relationship. Tool-to-user and user-to-tool are different, and GATE offers both.",
      "If two options both fit, your relationship was under-specified. Sharpen it instead of guessing between them.",
      "Letter and number analogies are the same technique - convert to positions (A=1 to Z=26) first and the pattern is usually a simple addition.",
    ],
    analogies: [
      "An analogy question is asking you to infer a function from one input-output pair and then apply it. \"Doctor -> Hospital\" defines the mapping; your job is to apply the same mapping, not a different plausible one, to a new input.",
    ],
    commonMistakes: [
      "Picking the strongest association rather than the stated relationship - \"Teacher : Student\" instead of \"Teacher : School\".",
      "Reversing the direction of the relationship. Tool-to-user and user-to-tool are different, and both appear among the options.",
      "Stating the relationship too vaguely, so two options both fit and the choice becomes a guess.",
      "For letter analogies, trying to see the pattern in letters instead of converting to positions first.",
    ],
    memoryTricks: [
      "Say it as a full sentence: \"A ___ is the ___ of a ___.\" A vague relationship cannot be said as a sentence.",
      "Direction is part of the relationship. Note which side is which before reading the options.",
      "Letters -> numbers (A=1 to Z=26) before anything else.",
    ],
    shortcuts: [
      "If two options survive, your relationship was under-specified. Sharpen it rather than guessing between them.",
      "Eliminate options whose relationship runs the other way - it usually removes one distractor immediately.",
    ],
    mcqs: [
      {
        question: "\"Chapter : Book :: Movement : ?\"",
        options: ["Music", "Symphony", "Orchestra", "Composer"],
        correctIndex: 1,
        explanation: "The relationship is part-to-whole, and specifically a named division of a larger work. A movement is a division of a symphony exactly as a chapter is of a book. \"Music\" is too broad a category, and orchestra and composer are performer and creator rather than the whole work.",
      },
      {
        question: "\"Careless : Reckless :: Warm : ?\"",
        options: ["Cold", "Cool", "Hot", "Mild"],
        correctIndex: 2,
        explanation: "The relationship is increasing intensity of the same quality - reckless is a stronger form of careless. Hot is a stronger form of warm. Cold and cool are opposites rather than intensifications, and mild is weaker.",
      },
      {
        question: "\"BD : CE :: MO : ?\"",
        options: ["NP", "NQ", "LN", "OP"],
        correctIndex: 0,
        explanation: "Convert to positions: B=2, D=4 becomes C=3, E=5 - each letter advances by 1. M=13, O=15 therefore becomes N=14, P=16, which is NP. Converting to numbers makes the pattern immediate; trying to see it in letters is where errors come from.",
      },
    ],
    pyqRelevance: `Analogies are a 1-mark GA question, and GATE asks both verbal and letter/number forms.

The distractor design is consistent: one option with a strong but different association to the second term, and one with the relationship reversed. Both are defeated by stating the relationship as a sentence, with its direction, before looking at the choices.

Budget about thirty seconds. If two options still fit after that, the fix is to sharpen the relationship rather than to deliberate - deliberating between two options on a 1-mark analogy is a poor use of exam time.`,
    interviewConnection: `Reasoning by analogy is how experienced engineers navigate unfamiliar systems - "this is the same shape as a message queue, so the same failure modes probably apply."

The discipline this topic teaches is the useful half of that: naming precisely what the analogy claims, so you notice when it stops holding. An unnamed analogy quietly imports assumptions that do not transfer.`,
    revisionSummary: `Method: state the relationship as a full sentence, with direction, BEFORE reading the options. Then substitute.

Standard types: worker-workplace, worker-tool, part-whole, cause-effect, object-function, degree/intensity, synonym/antonym, category-member, product-raw material.

Two failure modes to check for: reversed direction, and a relationship stated too broadly so that two options fit.

Letter and number analogies: convert letters to positions (A=1..Z=26) first - the pattern is usually a simple addition.`,
    shortNotes: {
      oneMinute: "State the relationship as a SENTENCE with its direction before reading options. Types: worker-workplace, worker-tool, part-whole, cause-effect, function, intensity, synonym/antonym, category-member. Two options fit -> your relationship was too vague, sharpen it. Letter analogies -> convert A=1..Z=26 first.",
    },
  },

  "numerical-relations-and-reasoning": {
    difficulty: "Moderate",
    estimatedMinutes: 30,
    xpReward: 25, coinReward: 10,
    whatYoullLearn: [
      "Coding-decoding as a small set of underlying transformations",
      "Blood relations, and why a diagram beats mental tracking every time",
      "Grid puzzles and the clue-ordering strategy that solves them fastest",
    ],
    prerequisites: ["Logic: Deduction and Induction"],
    concept: `## Three Puzzle Families, One Habit

::: story
Coding-decoding. Blood relations. Seating arrangements.

Three question types that look unrelated and share one property: they are all easy on paper and error-prone in your head. Under time pressure, working memory is exactly the wrong tool.

The habit that fixes all three is the same. Write it down.
:::

## Coding-Decoding Is A Small Menu

::: cards The transformations GATE uses
Fixed shift :: Each letter moves a constant number of positions. CAT -> DBU is +1.
Reversal :: The word is spelled backwards, sometimes combined with a shift. CAT -> TAC.
Positional rearrangement :: Letters swap positions by a fixed pattern rather than changing identity.
Opposite-letter :: Each letter maps to its mirror in the alphabet (A<->Z, B<->Y, M<->N). Sum of positions is always 27.
Number substitution :: Letters map to their positions, or to positions with an operation applied.
:::

::: flow
How to crack an unknown code
1. Convert to positions :: A=1 through Z=26. Write both words as number rows.
2. Subtract row from row :: A constant difference is a fixed shift. A pattern in the differences is a positional rule.
3. Check reversal if that fails :: Compare the first letter of one with the last of the other.
4. Check the 27-sum :: If each pair of positions adds to 27, it is opposite-letter coding.
:::

::: checkpoint
If MOUSE is coded as NPVTF, how would TIGER be coded?
- ( ) UKHFS
- (x) UJHFS
- ( ) SHFDQ
- ( ) UJIFS
> UJHFS. Each letter advances one position: M->N, O->P, U->V, S->T, E->F. Applying +1 to TIGER gives T->U, I->J, G->H, E->F, R->S. Writing the positions out (20,9,7,5,18 -> 21,10,8,6,19) makes it mechanical and removes the miscounting that produces the near-miss options.
:::

## Blood Relations: Draw The Tree

::: story
"A is B's brother. B is C's mother. C is D's father. How is A related to D?"

Four short sentences. Try it in your head and you will probably get there - and you will be slower and less certain than if you had drawn six symbols.
:::

::: cards Notation worth standardising
Generations :: Each generation on its own horizontal line, older above younger.
Vertical line :: Parent to child.
Horizontal line :: Siblings or spouses.
Plus and minus :: Mark gender as you read it - and mark unknown gender explicitly, since GATE exploits names and roles that do not fix it.
:::

::: tip
For the example above: A and B are siblings, B is C's parent, C is D's parent. So A is the sibling of D's grandparent - A is D's great-uncle.

The answer is easy to read off a drawing and genuinely hard to hold in your head, which is the entire argument for drawing it.
:::

::: mistake
The gender trap is the most common one here.

"B is C's mother" fixes B as female. "A is B's brother" fixes A as male. But a statement like "P is the child of Q" fixes neither, and GATE will build a question whose answer is "cannot be determined" precisely around that gap. Mark unknown gender as unknown rather than assuming.
:::

## Grid Puzzles: Order The Clues

::: flow
1. Read every clue before writing anything :: The last clue often decides how to record the first.
2. Build the grid :: People against attributes, or seats in a row or circle.
3. Apply the most constraining clues first :: A clue fixing one person to one exact position beats a vague relative-position clue - regardless of the order they are listed in.
4. Use negative information :: "X is not in seat 3" eliminates a cell, and eliminations combine to force a placement.
:::

::: interview
For circular seating, settle the direction convention before you place anyone.

"To the immediate right of" means different things depending on whether people face the centre or face outward, and GATE states which. Reading past that sentence invalidates the entire arrangement, and it is the single most expensive mistake in this question type.
:::`,
    keyPoints: [
      "One habit covers all three families - coding, blood relations and grid puzzles: write it down rather than tracking it in your head.",
      "To crack an unknown code, convert both words to letter positions and subtract. A constant difference is a fixed shift; pairs summing to 27 mean opposite-letter coding.",
      "For blood relations, draw generations as horizontal levels and mark gender as you read - including marking it UNKNOWN, since \"cannot be determined\" is often the answer.",
      "In grid puzzles, apply the most constraining clue first rather than the first clue listed. Clue order in the question is arbitrary.",
      "Negative information (\"X is not in seat 3\") is as useful as a placement - eliminations combine to force positions.",
      "For circular seating, establish whether people face the centre or outward before placing anyone; it reverses every left and right.",
    ],
    formulas: [
      "Letter positions: A=1, B=2, ... M=13, N=14, ... Z=26.",
      "Opposite-letter pairs sum to 27: A<->Z, B<->Y, M<->N.",
      "For a fixed shift, difference = (target position - source position), consistent for every letter.",
      "Circular arrangements of n distinct people = (n-1)! - relevant when a puzzle asks how many arrangements are possible.",
    ],
    analogies: [
      "A grid puzzle is constraint propagation, the same as solving Sudoku: each definite placement eliminates cells, and eliminations cascade into further placements. Which is why the most constraining clue should always go first.",
    ],
    commonMistakes: [
      "Tracking a blood-relation chain mentally instead of drawing it. Reliable for two links, unreliable for four, and always slower.",
      "Assuming gender where the clue does not state it - the setup for many \"cannot be determined\" answers.",
      "Ignoring whether circular-seating participants face the centre or face outward, which reverses every left and right.",
      "Processing clues in the listed order rather than by how much each one constrains.",
      "Miscounting letter shifts by hand instead of converting to positions first.",
    ],
    memoryTricks: [
      "M and N are 13 and 14 - the middle of the alphabet. Counting from the nearest of A, M/N, or Z is faster than counting from A every time.",
      "Opposite letters sum to 27. A quick check for the mirror code.",
      "Draw generations as levels. Same level = siblings or spouses, different level = parent and child.",
    ],
    shortcuts: [
      "Write both words as position numbers and subtract. A constant difference identifies the code in seconds.",
      "In grid puzzles, record negative information (\"not seat 3\") as an explicit mark - eliminations are as useful as placements.",
      "In blood relations, work out the relationship in terms of generations first (\"sibling of a grandparent\"), then name it.",
    ],
    mcqs: [
      {
        question: "In a certain code, FLOWER is written as ULMDVI. What is the coding rule?",
        options: [
          "Each letter shifts forward by 15",
          "Each letter is replaced by its opposite in the alphabet",
          "The word is reversed",
          "Vowels are shifted and consonants are unchanged",
        ],
        correctIndex: 1,
        explanation: "F(6)->U(21), L(12)->O(15), O(15)->L(12), W(23)->D(4), E(5)->V(22), R(18)->I(9). Every pair sums to 27, which is the opposite-letter rule. Checking the 27-sum is faster than testing shift values one at a time.",
      },
      {
        question: "P is Q's sister. Q is R's father. R is S's mother. How is P related to S?",
        options: ["Grandmother", "Great-grandmother", "Great-aunt", "Aunt"],
        correctIndex: 2,
        explanation: "P and Q are siblings; Q is R's parent; R is S's parent. So P is the sibling of S's grandparent - a great-aunt. Reading it off a drawing takes seconds; tracking it mentally is where \"grandmother\" and \"aunt\" come from.",
      },
      {
        question: "When solving a seating-arrangement puzzle, which clue should be applied first?",
        options: [
          "The first clue listed",
          "The clue that fixes one person to one exact position",
          "The longest clue",
          "Any clue mentioning the person the question asks about",
        ],
        correctIndex: 1,
        explanation: "The most constraining clue removes the most uncertainty and makes every later clue easier to apply. Clue order in the question is arbitrary, and a well-designed puzzle often opens with the vaguest clue.",
      },
    ],
    numericals: [
      {
        question: "If A=1, B=2, ..., Z=26, what is the sum of the letter positions in the word CAB?",
        answerMin: 6,
        answerMax: 6,
        unit: "",
        solution: `  C = 3, A = 1, B = 2

    3 + 1 + 2 = 6`,
      },
      {
        question: "In a code, each letter is replaced by its opposite in the alphabet (A<->Z, B<->Y, and so on). What is the position of the letter that replaces M?",
        answerMin: 14,
        answerMax: 14,
        unit: "",
        solution: `  Opposite pairs sum to 27.

    M is position 13
    27 - 13 = 14, which is N

So M maps to N and N maps to M - the two middle letters swap with
each other, which is worth remembering as a fixed point of this code.`,
      },
    ],
    pyqRelevance: `These appear as 1-mark and 2-mark GA questions, with coding-decoding and blood relations the most frequent, and small seating or grid puzzles turning up as the 2-mark version.

GATE's coding questions stay inside the standard menu - fixed shift, reversal, opposite-letter, positional rearrangement. Converting to positions and subtracting identifies which one is in play almost immediately, and that habit is worth more than any individual pattern.

Blood-relation questions increasingly include a deliberate gender gap so that "cannot be determined" is the correct answer. Marking unknown gender explicitly on your diagram is what makes that visible instead of accidentally assumed.`,
    interviewConnection: `Grid puzzles are constraint satisfaction, which is the same reasoning as resolving a dependency graph or a scheduling conflict: apply the hardest constraints first and let the eliminations cascade.

The transferable discipline is externalising state. Anyone who has debugged a four-service request flow by drawing it on a whiteboard has used exactly the argument this topic makes for drawing the family tree.`,
    revisionSummary: `One habit for all three families: write it down, do not track it mentally.

Coding-decoding: convert both words to positions (A=1..Z=26) and subtract. Constant difference = fixed shift. Pairs summing to 27 = opposite-letter code. Otherwise check reversal or positional rearrangement.

Blood relations: draw generations as horizontal levels, vertical lines for parent-child, and mark gender - including marking it UNKNOWN where the clue does not say, since that is often the answer.

Grid puzzles: read all clues first, apply the most constraining first (not the listed order), and record negative information explicitly. For circular seating, check whether people face the centre before placing anyone.`,
    shortNotes: {
      oneMinute: "Write it down - never track mentally. Coding: convert to positions and subtract; constant diff = shift, pairs summing to 27 = opposite-letter. Blood relations: draw generations, mark gender, mark UNKNOWN gender explicitly (often the answer is \"cannot be determined\"). Grids: read all clues, apply the most constraining first, record eliminations, check facing direction for circles.",
    },
  },

  // ---------------- Spatial Aptitude ----------------

  "transformation-of-shapes-translation-rotation-scaling-and-mirroring": {
    difficulty: "Moderate",
    estimatedMinutes: 25,
    xpReward: 25, coinReward: 10,
    whatYoullLearn: [
      "The four transformations, and which properties each one preserves",
      "The one test that separates a rotation from a mirror image",
      "How to track a shape through a sequence of transformations reliably",
    ],
    prerequisites: [],
    concept: `## Four Operations, One Distinguishing Test

::: story
Spatial aptitude is the section candidates most often assume they either "have" or do not.

They mostly do not need to. Almost every question is one of four operations, and the hard cases come down to a single test you can apply deliberately rather than intuit.
:::

::: cards The four transformations
Translation :: Slide. Nothing changes but position - not size, not orientation, not handedness.
Rotation :: Turn about a point. Size and handedness are preserved; orientation changes.
Scaling :: Resize. Shape is preserved, dimensions are multiplied. Lengths x k, areas x k^2.
Mirroring (reflection) :: Flip across a line. Size and shape are preserved, and **handedness reverses**.
:::

::: remember
Only mirroring reverses **handedness** - sometimes called chirality.

That is the whole test. A rotated shape can always be brought back onto the original by turning it in the plane. A mirrored shape never can, no matter how much you rotate it.
:::

::: analogy
Your two hands. Same size, same shape, same proportions - and you cannot rotate your left hand into your right hand, in any orientation.

That is exactly the difference between a rotation and a reflection, and it is why "handedness" is the word for it.
:::

::: checkpoint
A shape shows the letter R with a small dot to the upper-left. In the answer option, the R appears backwards with the dot to the upper-right. What transformation was applied?
- ( ) Rotation by 180 degrees
- (x) A mirror reflection across a vertical axis
- ( ) Translation
- ( ) Scaling
> A vertical-axis reflection. A backwards R cannot be produced by any rotation - rotating R by 180 degrees gives an upside-down R, not a reversed one. The dot moving from left to right while staying up confirms a left-right flip specifically, rather than a top-bottom one.
:::

## Reading Rotations Correctly

::: cards Rotation conventions
Clockwise 90 :: Top edge moves to the right side.
Anticlockwise 90 :: Top edge moves to the left side.
180 degrees :: Top goes to bottom and left goes to right - direction is irrelevant, both ways give the same result.
270 clockwise :: Identical to 90 anticlockwise. Recognising this halves the cases you need to consider.
:::

::: tip
Track one asymmetric feature, not the whole shape.

Pick the single most distinctive part - a notch, a dot, a longer arm - and follow only that through the transformation. Trying to hold the whole figure in mind is what makes this feel like innate ability rather than technique.
:::

## Sequences Of Transformations

::: flow
1. Apply them strictly in order :: Transformations do not commute in general. Rotate-then-reflect and reflect-then-rotate give different results.
2. Count the reflections :: An EVEN number of reflections restores the original handedness; an ODD number reverses it.
3. Combine the rotations :: Add the angles, treating anticlockwise as negative, and reduce modulo 360.
:::

::: interview
The parity trick is the fastest route through a multi-step question.

You are shown four operations and asked which option results. Count the reflections first: if the count is odd, every option with the original handedness is wrong, and that usually eliminates half the choices before you consider any angle at all.
:::`,
    keyPoints: [
      "Four transformations: translation (slide), rotation (turn), scaling (resize), mirroring (flip).",
      "Only MIRRORING reverses handedness. A rotated shape can always be turned back onto the original; a reflected one never can - your two hands are the proof.",
      "That handedness test is what separates a rotation from a reflection, and it is what most distractor pairs turn on.",
      "An odd number of reflections leaves the figure mirrored; an even number restores it. Two perpendicular reflections equal a 180 degree rotation.",
      "Transformations do NOT commute - rotate-then-reflect differs from reflect-then-rotate, so apply them strictly in order.",
      "Track one asymmetric feature through the transformation rather than the whole figure.",
    ],
    formulas: [
      "Handedness reverses under reflection only. Translation, rotation and scaling all preserve it.",
      "Odd number of reflections -> handedness reversed. Even number -> handedness restored.",
      "270 degrees clockwise = 90 degrees anticlockwise. 180 degrees clockwise = 180 degrees anticlockwise.",
      "Scaling by k: lengths x k, areas x k^2, volumes x k^3. Angles are unchanged.",
      "Net rotation = sum of angles (anticlockwise negative), reduced modulo 360.",
    ],
    analogies: [
      "Reading text in a mirror is the clearest everyday case: the letters are the same size and shape and are unreadable, because reflection changed something no amount of turning the page can undo.",
    ],
    commonMistakes: [
      "Confusing a 180 degree rotation with a reflection. Rotation turns a shape upside down; reflection makes it backwards. Both are \"flipped\" in casual speech and they are not the same operation.",
      "Assuming transformations commute. Rotate-then-reflect is generally not reflect-then-rotate.",
      "Mixing up clockwise and anticlockwise. Fix a reference feature and check where it lands.",
      "Scaling area linearly - a 2x scale gives 4x the area, not 2x.",
    ],
    memoryTricks: [
      "Left hand and right hand. Same shape, not superimposable. That is reflection, and nothing else does it.",
      "Odd reflections -> mirrored. Even reflections -> back to normal. Just count them.",
      "270 clockwise = 90 anticlockwise. Convert to whichever is easier to picture.",
    ],
    shortcuts: [
      "Count reflections first in any multi-step question - handedness parity often eliminates half the options immediately.",
      "Track a single asymmetric feature rather than the whole figure.",
      "Convert every rotation to the anticlockwise convention (or clockwise, consistently) before combining them.",
    ],
    mcqs: [
      {
        question: "Which transformation is the only one that reverses a shape's handedness?",
        options: ["Translation", "Rotation", "Scaling", "Mirroring"],
        correctIndex: 3,
        explanation: "Reflection is the only one of the four that cannot be undone by rotating within the plane. Translation, rotation and scaling all preserve handedness, which is why a rotated figure can always be turned back onto the original and a reflected one cannot.",
      },
      {
        question: "A figure is reflected across a vertical axis, then reflected across a horizontal axis. The net effect is:",
        options: [
          "A mirror image of the original",
          "A 180 degree rotation of the original",
          "The original, unchanged",
          "A 90 degree rotation of the original",
        ],
        correctIndex: 1,
        explanation: "Two reflections restore the original handedness (even count), so the result is not a mirror image - and reflecting across two perpendicular axes turns the figure through 180 degrees. This composition is worth knowing directly, since it is asked often.",
      },
      {
        question: "Rotating a figure 270 degrees clockwise is equivalent to:",
        options: [
          "90 degrees clockwise",
          "90 degrees anticlockwise",
          "180 degrees clockwise",
          "A reflection across a vertical axis",
        ],
        correctIndex: 1,
        explanation: "270 clockwise and 90 anticlockwise land in the same place, since the two directions sum to 360. Converting to the smaller angle is easier to picture and reduces the cases you have to consider.",
      },
    ],
    pyqRelevance: `Spatial aptitude was added to GATE's General Aptitude syllabus and is now explicitly listed, so it should be prepared rather than hoped past.

Transformation questions come as figure-based multiple choice, typically 1 mark, and the decisive distinction in the distractors is rotation versus reflection - two options are frequently identical except for handedness.

Which makes the handedness test the highest-value thing to take from this lesson. Applying it deliberately converts a question that feels like innate visual ability into a mechanical check.`,
    interviewConnection: `The transformation vocabulary is directly the vocabulary of graphics and UI work: translate, rotate, scale, reflect, and the fact that composing them is order-dependent.

Anyone who has debugged a CSS transform or a canvas matrix has met non-commutativity in practice - rotate-then-translate and translate-then-rotate place an element in genuinely different positions, which is the same fact this lesson states abstractly.`,
    revisionSummary: `Four transformations: translation (slide), rotation (turn), scaling (resize), mirroring (flip).

Only MIRRORING reverses handedness. That single test separates a rotation from a reflection, and it is what most distractor pairs turn on.

Odd number of reflections -> handedness reversed. Even -> restored. Two perpendicular reflections = a 180 degree rotation.

270 clockwise = 90 anticlockwise. Transformations do NOT commute - apply them strictly in order.

Scaling by k: lengths x k, areas x k^2, angles unchanged. Track one asymmetric feature, not the whole shape.`,
    shortNotes: {
      oneMinute: "Translation/rotation/scaling preserve handedness; only MIRRORING reverses it (left hand vs right hand). Odd reflections -> mirrored, even -> normal. Two perpendicular reflections = 180 rotation. 270 CW = 90 ACW. Transformations do not commute. Track ONE asymmetric feature. Scaling: lengths xk, areas xk^2.",
    },
  },

  "assembling-and-grouping-shapes": {
    difficulty: "Moderate",
    estimatedMinutes: 25,
    xpReward: 25, coinReward: 10,
    whatYoullLearn: [
      "Area conservation as the first check on any assembly question",
      "Counting edges, vertices and angles to eliminate options fast",
      "How grouping questions ask you to find the classification rule",
    ],
    prerequisites: ["Transformation of Shapes: Translation, Rotation, Scaling and Mirroring"],
    concept: `## Total Area Cannot Change

::: story
You are given four pieces and asked which figure they assemble into. Four options, all plausible-looking.

Before examining a single shape, add up the pieces. Assembly conserves area - pieces do not stretch and do not overlap. Any option whose area differs from the total is out.

That check alone often leaves one answer.
:::

::: remember
**Area is conserved under assembly.** Always check it first.

It is arithmetic rather than visualisation, which makes it both faster and more reliable than trying to mentally fit pieces together - and it works even when you cannot see how the pieces go.
:::

## Countable Properties Are Your Friends

::: cards Things you can count instead of visualise
Total area :: The strongest check. Count grid squares if the figure is on a grid.
Number of edges :: Interior edges vanish when two pieces join; exterior edges survive. A target with more exterior edges than the pieces can supply is impossible.
Right angles :: Count them in the pieces and in the target. Assembly cannot create a right angle from pieces that have none in the right places.
Longest single straight edge :: The target cannot have a straight edge longer than the pieces can form end to end.
Curved edges :: A curve in the target must come from a curve in some piece. Straight-edged pieces can never produce one.
:::

::: checkpoint
Four pieces have areas of 3, 4, 5 and 6 grid squares. Which target figure can they assemble into?
- ( ) A 4x4 square
- (x) A figure covering 18 grid squares
- ( ) A 3x5 rectangle
- ( ) A figure covering 20 grid squares
> The 18-square figure. The pieces total 3+4+5+6 = 18, and assembly conserves area exactly. A 4x4 square is 16, a 3x5 rectangle is 15, and 20 is too large. This is the whole question, settled by addition rather than by visualisation.
:::

## Grouping Is A Classification Question

::: story
Five figures. Four belong together and one does not. Which is the odd one out?

The mistake is looking for what makes one figure unusual. The right move is finding the rule that four of them share - because the rule is the answer, and the odd one is whatever fails it.
:::

::: cards Rules GATE groups by
Number of sides or lines :: All quadrilaterals except one triangle.
Symmetry :: All figures with a line of symmetry except one without.
Open versus closed :: All closed shapes except one open path.
Curved versus straight :: All polygons except one with an arc.
Count of enclosed regions :: All figures enclosing two areas except one enclosing three.
Rotational relationship :: Four figures are rotations of one shape; the fifth is its mirror image.
:::

::: tip
That last rule is where the handedness test from the previous lesson pays off.

"Four of these are the same figure rotated, one is reflected" is a standard grouping question, and the reflected one is invisible unless you are checking handedness deliberately. Look for an asymmetric feature and see which way it points in each figure.
:::

::: interview
If no rule appears within twenty seconds, count something.

Sides, vertices, enclosed regions, lines of symmetry, right angles. Tabulating one countable property across all five figures usually exposes the outlier immediately, and it beats staring at them hoping for insight.
:::`,
    keyPoints: [
      "Assembly conserves AREA exactly - sum the pieces and eliminate every option with a different area before attempting any visualisation.",
      "That check is arithmetic rather than visual, which makes it faster and more reliable, and it works even when you cannot see how the pieces fit.",
      "Joining pieces always REDUCES total perimeter (the shared edge becomes interior) while leaving total area unchanged.",
      "A curve in the target must come from a curve in some piece. Straight-edged pieces can never produce one.",
      "In grouping questions, find the RULE that four figures share rather than what is odd about one - the odd one is whatever breaks the rule.",
      "A standard grouping trap is four rotations plus one mirror image, which is invisible unless handedness is checked deliberately.",
    ],
    formulas: [
      "Assembly conserves total area: sum of piece areas = target area, exactly.",
      "When two pieces join along an edge, that edge becomes interior and stops contributing to the perimeter.",
      "Scaling by k changes area by k^2 - so a target that is a scaled version of a piece has area k^2 times it, not k times.",
      "A closed figure with V vertices and E edges encloses regions per Euler's relation V - E + F = 2 (F includes the outer region).",
    ],
    analogies: [
      "It is a jigsaw with a checksum. Before trying to fit anything, verify the total - and a mismatched total means you can stop without touching a single piece.",
    ],
    commonMistakes: [
      "Attempting to visualise the fit before checking that the areas even match. The arithmetic check is faster and eliminates more options.",
      "Assuming pieces can overlap or be stretched. In assembly questions they cannot.",
      "Forgetting that pieces may be rotated - and, unless the question forbids it, flipped as well. Read whether flipping is allowed.",
      "In grouping questions, hunting for what is odd about one figure instead of finding the rule four of them share.",
      "Missing a mirror-image outlier because handedness was not checked.",
    ],
    memoryTricks: [
      "Area first, always. Add the pieces before you look at the shapes.",
      "Interior edges disappear; exterior edges survive. A join always reduces the total perimeter.",
      "Grouping: find the RULE, not the oddity. The odd one is whatever breaks the rule.",
    ],
    shortcuts: [
      "Sum the piece areas and eliminate every option with a different area. Frequently leaves one answer.",
      "A curve in the target requires a curve in a piece. Straight-edged pieces can never make one.",
      "In grouping questions, tabulate one countable property (sides, vertices, symmetry lines, enclosed regions) across all five figures.",
    ],
    mcqs: [
      {
        question: "In an assembly question, what should you check before attempting to visualise the fit?",
        options: [
          "The colour of the pieces",
          "That the total area of the pieces equals the target's area",
          "Which piece is largest",
          "The number of options given",
        ],
        correctIndex: 1,
        explanation: "Assembly conserves area exactly, so any option with a different total area is impossible. It is an arithmetic check rather than a visual one, which makes it both faster and more reliable than mentally fitting pieces.",
      },
      {
        question: "Four figures are rotations of the same shape and one is its mirror image. What is the most reliable way to identify the mirror image?",
        options: [
          "It will look larger than the others",
          "Track an asymmetric feature and check which way it points",
          "It will have a different number of sides",
          "It cannot be identified without measuring",
        ],
        correctIndex: 1,
        explanation: "A reflection preserves size and side count, so those tell you nothing. Handedness is the only difference, and following one asymmetric feature is how you detect it - rotations keep its sense, a reflection reverses it.",
      },
      {
        question: "Two triangular pieces are joined along one full edge. Compared to the sum of their separate perimeters, the perimeter of the combined figure is:",
        options: ["Larger", "The same", "Smaller", "Impossible to determine"],
        correctIndex: 2,
        explanation: "The shared edge becomes interior and stops contributing to the boundary - and it is removed twice, once from each triangle. Joining pieces always reduces total perimeter while leaving total area unchanged.",
      },
    ],
    numericals: [
      {
        question: "Pieces with areas 5, 7, 4 and 9 grid squares are assembled with no overlaps. What is the area of the resulting figure?",
        answerMin: 25,
        answerMax: 25,
        unit: "grid squares",
        solution: `  5 + 7 + 4 + 9 = 25 grid squares

Assembly conserves area exactly - no stretching, no overlap. The
resulting figure's shape is unknown from this information, but its
area is not, which is what makes the check so useful.`,
      },
      {
        question: "Two squares of side 4 units are joined along one complete edge. What is the perimeter of the resulting rectangle?",
        answerMin: 24,
        answerMax: 24,
        unit: "units",
        solution: `  Result is a 4 x 8 rectangle.

    Perimeter = 2(4 + 8) = 24 units

Check against the separate perimeters: 16 + 16 = 32. The shared
edge of length 4 was removed from each square, so 32 - 8 = 24.
Both routes agree.`,
      },
    ],
    pyqRelevance: `Assembling and grouping are figure-based multiple-choice questions, usually 1 mark, and both are listed explicitly in GATE's Spatial Aptitude syllabus.

Assembly questions are unusually vulnerable to a non-visual attack: the area check eliminates options arithmetically, and GATE's distractors are not always area-matched. Do that check first, every time.

Grouping questions increasingly use the rotation-versus-reflection outlier, which connects directly to the handedness test in the previous lesson. If four figures look like the same shape and one feels subtly wrong, check handedness rather than second-guessing your eyes.`,
    interviewConnection: `The habit that transfers is checking an invariant before attempting the hard work. Area conservation here is the same instinct as verifying that a refactor preserved row counts before reviewing its logic line by line.

Cheap invariant first, expensive reasoning second - and often the invariant makes the expensive reasoning unnecessary.`,
    revisionSummary: `Assembly conserves AREA exactly. Sum the pieces and eliminate every option with a different area - do this before any visualisation.

Countable checks: exterior edges (interior ones vanish on joining), right angles, longest straight edge, presence of curves. A curve in the target needs a curve in a piece.

Joining pieces always REDUCES total perimeter while leaving total area unchanged.

Grouping: find the RULE four figures share, not the oddity of one. Rules used - side count, symmetry, open/closed, curved/straight, enclosed regions, and rotation-versus-reflection.

If no rule appears quickly, tabulate one countable property across all five figures.`,
    shortNotes: {
      oneMinute: "Assembly conserves AREA - sum the pieces first and eliminate mismatched options before visualising. Joining removes interior edges, so perimeter drops while area holds. Curve in target needs a curve in a piece. Grouping: find the RULE four share, not the oddity of one; watch for the rotation-vs-reflection outlier (check handedness). Stuck -> count sides/vertices/symmetry lines/regions.",
    },
  },

  "paper-folding-cutting-and-2d-3d-patterns": {
    difficulty: "Moderate",
    estimatedMinutes: 30,
    xpReward: 25, coinReward: 10,
    whatYoullLearn: [
      "Unfolding as reflection applied in reverse order",
      "Why n folds produce 2^n copies of a single cut",
      "Reading a cube net, and the opposite-faces rule that solves most dice questions",
    ],
    prerequisites: ["Transformation of Shapes: Translation, Rotation, Scaling and Mirroring"],
    concept: `## Unfolding Is Reflecting Backwards

::: story
A square sheet is folded in half, then in half again. A single hole is punched. Where are the holes when it is unfolded?

The instinct is to try to picture the whole process at once. The reliable method is to run it backwards, one fold at a time, treating each unfold as a mirror.
:::

::: flow
1. Start from the final folded state :: With the cut or punch marked on it.
2. Undo the LAST fold first :: Reflect everything currently marked across that fold line. Marks double.
3. Undo the next fold :: Reflect again across the previous crease. Marks double again.
4. Continue to the flat sheet :: Each unfold is one reflection, and each reflection doubles the count.
:::

::: remember
Each fold doubles the number of copies of a single cut.

One fold -> 2 holes. Two folds -> 4. Three folds -> 8. In general **2^n holes for one punch through n folds**, provided the punch passes through every layer.
:::

::: checkpoint
A sheet is folded three times, then a single hole is punched through all layers. How many holes appear when unfolded?
- ( ) 3
- ( ) 6
- (x) 8
- ( ) 16
> 8. Each fold doubles the layers, so three folds give 2^3 = 8 layers and one punch pierces all of them. Answering 6 comes from multiplying (3 x 2) rather than doubling repeatedly, which is the standard error in this question type.
:::

::: mistake
The count is only 2^n if the punch actually passes through **every** layer.

A punch near an edge may miss some layers entirely, and GATE uses exactly that to make a question harder than the formula suggests. Check the punch's position relative to the folded region before applying 2^n.
:::

## Cube Nets And Opposite Faces

::: story
A flat net of six squares folds into a cube. Which faces end up opposite each other?

There is a rule that removes almost all of the visualisation.
:::

::: cards Reading a net
Two faces separated by exactly one face in a straight line :: These are OPPOSITE on the cube. In a row A-B-C, A and C are opposite.
Two faces sharing an edge :: These are ADJACENT, never opposite.
Each face has exactly one opposite and four adjacent :: If you have identified an opposite pair, the other four faces are all adjacent to both.
:::

::: tip
For dice questions, opposite faces are the whole game.

On a standard die, opposite faces sum to 7 - so 1 is opposite 6, 2 opposite 5, 3 opposite 4. When a question shows two views of a die and asks what is on the hidden face, find which faces are visible, work out which are opposite, and the answer usually falls out without any rotation.
:::

::: interview
For 2D-to-3D questions, count before you visualise.

A solid built from unit cubes: count the cubes in the given view, count what each option would require, and eliminate mismatches. And when a question asks how many faces of a stacked arrangement are painted, work face by face rather than trying to hold the whole solid in mind.

The pattern across all of spatial aptitude is the same as the rest of GA - convert a visualisation problem into a counting problem wherever you can.
:::`,
    keyPoints: [
      "Unfolding is reflecting across each crease, undoing the folds in REVERSE order - the last fold made is the first one undone.",
      "Each fold doubles the layers, so one punch through n folds gives 2^n holes. It is 2^n, never 2n.",
      "That formula only holds if the punch reaches every layer - a punch near an edge may miss some, and GATE uses exactly that.",
      "On a cube net, two faces separated by exactly one face in a straight line are OPPOSITE; faces sharing an edge are adjacent. Every face has one opposite and four adjacent.",
      "A standard die's opposite faces sum to 7 (1-6, 2-5, 3-4), which answers most hidden-face questions without any mental rotation.",
      "A cube has 6 faces, 12 edges, 8 vertices, and 11 distinct nets.",
    ],
    formulas: [
      "n folds -> 2^n layers -> 2^n copies of a single cut, IF the cut passes through every layer.",
      "Each unfold is one reflection across that fold's crease line. Undo folds in reverse order.",
      "Cube net: two faces separated by exactly one face in a straight line are OPPOSITE. Faces sharing an edge are ADJACENT.",
      "Every cube face has exactly 1 opposite face and 4 adjacent faces.",
      "Standard die: opposite faces sum to 7 (1-6, 2-5, 3-4).",
      "A cube has 6 faces, 12 edges and 8 vertices. There are 11 distinct nets of a cube.",
    ],
    analogies: [
      "Unfolding is an undo stack: you have to pop the operations in reverse order, and each pop is a mirror. Trying to reconstruct the whole sequence at once is why it feels hard.",
    ],
    commonMistakes: [
      "Undoing the folds in the original order instead of reverse order. The last fold made must be the first one undone.",
      "Multiplying instead of doubling - three folds give 2^3 = 8 layers, not 3 x 2 = 6.",
      "Applying 2^n when the punch misses some layers because of its position near an edge.",
      "Treating two faces that share an edge on a net as opposite. Sharing an edge means adjacent, always.",
      "Forgetting that a die's opposite faces sum to 7, and rotating mentally instead.",
    ],
    memoryTricks: [
      "Unfold = reflect, in reverse order. Last fold made, first fold undone.",
      "Folds double: 1, 2, 4, 8, 16. Powers of two, never multiples.",
      "On a net, skip one face in a straight line to find the opposite. Adjacent faces touch; opposite faces have a face between them.",
      "Die opposites sum to 7. 1-6, 2-5, 3-4.",
    ],
    shortcuts: [
      "For hole counts, apply 2^n first, then check whether the punch's position actually reaches every layer.",
      "For a hidden die face, identify the opposite pairs from the visible faces before attempting any rotation.",
      "For cube-counting solids, count cubes in the given view and eliminate options by count before visualising the shape.",
    ],
    mcqs: [
      {
        question: "A square sheet is folded in half twice, and one hole is punched through all layers. How many holes appear when unfolded?",
        options: ["2", "4", "6", "8"],
        correctIndex: 1,
        explanation: "Two folds produce 2^2 = 4 layers, so one punch through all of them gives 4 holes. Answering 2 counts only one fold; answering 6 or 8 over-counts by multiplying or assuming a third fold.",
      },
      {
        question: "On a cube net, two faces are separated by exactly one face in a straight line. On the folded cube these two faces are:",
        options: ["Adjacent", "Opposite", "The same face", "Impossible to determine"],
        correctIndex: 1,
        explanation: "Skipping exactly one face in a straight line on a net gives an opposite pair - the two faces fold away from each other. Faces that share an edge on the net are adjacent on the cube.",
      },
      {
        question: "When unfolding a folded, cut sheet, in what order should the folds be reversed?",
        options: [
          "The order they were made",
          "Reverse of the order they were made",
          "Any order - the result is the same",
          "Largest fold first",
        ],
        correctIndex: 1,
        explanation: "Folding is a sequence of operations and unfolding must undo them last-in-first-out, exactly like popping a stack. Reversing in the original order produces a different and wrong pattern.",
      },
    ],
    numericals: [
      {
        question: "A sheet is folded 4 times and a single hole is punched through every layer. How many holes appear when it is fully unfolded?",
        answerMin: 16,
        answerMax: 16,
        unit: "holes",
        solution: `  Each fold doubles the number of layers:

    0 folds -> 1 layer
    1 fold  -> 2
    2 folds -> 4
    3 folds -> 8
    4 folds -> 16

  One punch through 16 layers = 16 holes.

2^n, not 2n. Four folds give 16, not 8.`,
      },
      {
        question: "A standard die shows 2 on the top face. What number is on the bottom face?",
        answerMin: 5,
        answerMax: 5,
        unit: "",
        solution: `  Opposite faces of a standard die sum to 7.

    7 - 2 = 5

The full set of pairs: 1-6, 2-5, 3-4. Knowing these three removes
the need to rotate anything mentally.`,
      },
      {
        question: "How many edges does a cube have?",
        answerMin: 12,
        answerMax: 12,
        unit: "edges",
        solution: `  6 faces x 4 edges each = 24, but every edge is shared by
  exactly 2 faces:

    24 / 2 = 12 edges

Also worth knowing: 6 faces, 8 vertices, and 11 distinct nets.`,
      },
    ],
    pyqRelevance: `Paper folding and cube/dice questions are named explicitly in GATE's Spatial Aptitude syllabus and appear as figure-based 1-mark questions.

The paper-folding variant is nearly always a punch-and-unfold, and the 2^n rule plus reverse-order unfolding handles the standard version. The harder variant places the punch so that it misses some layers, which is why the position check matters as much as the formula.

Cube-net questions reduce almost entirely to the opposite-faces rule, and dice questions to opposite faces summing to 7. Both are recall rather than visualisation, which is what makes this topic much more tractable than it first appears.`,
    interviewConnection: `The reverse-order insight is stack discipline, which is worth recognising as the same structure you already know: undoing a sequence of operations correctly means popping them last-in-first-out, whether they are folds, transactions, or nested transforms.

The broader habit is the one this whole section teaches - convert a problem you would have to visualise into one you can count. That is the same move as replacing a hand-traced execution with an invariant you can check.`,
    revisionSummary: `Unfolding = reflecting across each crease, undoing folds in REVERSE order (last fold made, first undone).

n folds -> 2^n layers -> 2^n holes from one punch, but ONLY if the punch reaches every layer. Check its position.

Cube net: faces separated by exactly one face in a straight line are OPPOSITE; faces sharing an edge are ADJACENT. Every face has 1 opposite and 4 adjacent.

Standard die: opposite faces sum to 7 (1-6, 2-5, 3-4). Cube has 6 faces, 12 edges, 8 vertices, 11 distinct nets.

General principle: turn visualisation into counting wherever possible.`,
    shortNotes: {
      oneMinute: "Unfold = reflect across each crease, in REVERSE order (last fold undone first). n folds -> 2^n holes, but only if the punch reaches every layer. Cube net: skip one face in a line = OPPOSITE; share an edge = adjacent. Die opposites sum to 7 (1-6, 2-5, 3-4). Cube: 6 faces, 12 edges, 8 vertices, 11 nets.",
    },
  },
};
