// DeVert Campus - Aptitude Series, Week 10: Verbal Ability
// (Mon 28 Sep - Wed 30 Sep 2026). Days 55-57.
//
// *** THIS WEEK IS DELIBERATELY INCOMPLETE - READ BEFORE EXTENDING IT ***
//
// It carries THREE days (Mon 28, Tue 29, Wed 30 Sep) and NO Saturday recap.
// That is not a truncated authoring session: the brief was to fill the series
// through the end of September, and this week's Thursday, Friday and Saturday
// fall on 1, 2 and 3 OCTOBER. Every other week in this track is exactly 6 days
// (5 topics + a Saturday recap); this one is 3, and its recap does not exist.
//
// WHOEVER SEEDS OCTOBER: the immediate next task is Thu 2026-10-01,
// Fri 2026-10-02 and a "Week 10 Recap" on Sat 2026-10-03, continuing from
// Day 57 (so Days 58-60). The three days below cover error spotting, para
// jumbles and reading comprehension; the obvious completion is sentence
// completion / cloze test (Day 58) and synonyms, antonyms and vocabulary in
// context (Day 59), then the recap. That would close out verbal ability as a
// complete unit.
//
// WHY THIS TOPIC: weeks 1-54 of this track are entirely quantitative and
// logical. Verbal ability has never appeared once, despite being a separately
// timed and separately cut-off section in TCS NQT, Infosys, Cognizant,
// Accenture and Capgemini - a student can clear every quant section in this
// course and still be rejected on English alone. These three days cover the
// three highest-frequency verbal question types in that order: error spotting
// (the most mechanical, so it builds fastest), para jumbles (which needs the
// cohesion vocabulary error spotting introduces), and reading comprehension
// (the highest-mark, lowest-speed type, placed last because its strategy
// depends on recognising both of the previous two).
//
// AUTHORING RULES: identical to week1.mjs/week6.mjs through week9.mjs.
// `concept` is one string parsed by lib/lessonBlocks.js; fences are
// `::: variant optional title` ... `:::` each on its own line; never write
// "->" inside a flow step body or a literal "|" inside table cell text;
// two-space-indented lines render as code blocks; MCQ shape is
// { id, text, options, correctIndex, explanation } with a 0-based
// correctIndex; timedQuiz.mcqIds are 5 ids from that same day; ASCII hyphens
// only. Quotation marks inside MCQ text use single quotes, since the option
// strings themselves are double-quoted.

export const WEEK10_DAYS = [

  // ------------------------------------------------------------------
  // Day 55 - Monday 28 Sep 2026 - Error Spotting & Sentence Correction
  // ------------------------------------------------------------------
  {
    date: "2026-09-28", dow: "mon", weekId: "2026-09-28", type: "lesson",
    title: "Day 55: Error Spotting & Sentence Correction",
    difficulty: "Medium",
    estimatedMinutes: 18,
    concept: `## The Section Nobody Revises

::: story
A student clears every quantitative section of a placement test, scores well on reasoning, and is rejected anyway. The English section had its own cut-off, and it was missed by two marks.

This happens constantly, and it is avoidable. Error spotting is not a test of how well you write - it is a test of about eight recurring rules. Examiners reuse them relentlessly, because they are the same eight rules Indian English speakers most often bend in conversation. Learn the eight and the section becomes as mechanical as ranking problems.
:::

## The Eight Rules That Cover Most Errors

::: table What examiners actually test
Rule | Wrong | Right
Subject-verb agreement | The list of items are ready | The list of items IS ready
Each, every, either, neither take singular | Each of the boys have a bag | Each of the boys HAS a bag
One of the + plural + singular verb | One of my friend is coming | One of my FRIENDS is coming
Article before a vowel SOUND | An university, a hour | A university, AN hour
Since with a point, for with a duration | Since three years | FOR three years
No preposition after certain verbs | Discuss about, order for | Discuss, order
Comparative versus superlative | He is the tallest of the two | He is the TALLER of the two
Double comparative | More better, most easiest | Better, easiest
:::

## The Interrupting Phrase

By far the most productive trick in the whole section: the verb agrees with the SUBJECT, not with whatever noun happens to sit closest to it.

  The list of items are ready.          WRONG
  The list of items IS ready.           right - the subject is "the list"

  The quality of the mangoes were poor. WRONG
  The quality of the mangoes WAS poor.  right - the subject is "the quality"

::: flow How to find the subject in one pass
Delete every prepositional phrase :: Cross out anything starting with of, in, on, with, along with, as well as, including, together with. These never contain the subject.
Read what remains :: "The list ... are ready" becomes audibly wrong the moment the phrase "of items" is gone.
Match the verb to that subject :: Singular subject takes a singular verb. Plural takes plural.
Watch the joining words :: "along with", "as well as", "together with" and "including" do NOT make a singular subject plural. The teacher, along with her students, IS attending.
:::

::: mistake
"One of the" is always followed by a PLURAL noun but takes a SINGULAR verb, because the subject is "one". So: "One of my friends is coming", never "one of my friend is coming" and never "one of my friends are coming". Both halves of this rule are tested, often in the same question.
:::

## Articles Follow Sound, Not Spelling

Use "an" before a vowel SOUND, not before a vowel letter.

  a university, a European, a one-rupee coin    the sounds are "yu" and "wun"
  an hour, an honest man, an MBA                the h is silent; MBA starts "em"

## Since and For

  "Since" fixes a POINT in time.       since 2019, since Monday, since morning
  "For" measures a DURATION.           for three years, for two hours

  I have been working here since three years.   WRONG
  I have been working here FOR three years.     right

## Verbs That Refuse a Preposition

Several verbs take a direct object in standard English although Indian usage often adds a preposition:

  discuss about the matter     ->  discuss the matter
  order for a book             ->  order a book
  request for a leave          ->  request leave
  reach at the station         ->  reach the station
  emphasise on the point       ->  emphasise the point

::: remember
When a question offers "No error" as an option, it is correct roughly as often as any other choice. Do not manufacture an error to avoid picking it - but do run the eight-rule checklist first, because a genuine error is easy to skim past in a sentence that sounds natural in everyday speech.
:::

::: checkpoint
Which sentence is grammatically correct?
- ( ) One of my friend is coming to the party
- ( ) Each of the students have submitted their assignment
- (x) The quality of the mangoes was poor
- ( ) He has been living here since five years
> "The quality" is the singular subject, so the singular "was" is right - "of the mangoes" is an interrupting phrase. The first needs the plural "friends", the second needs the singular "has" after "each", and the fourth needs "for" with a duration.
:::

::: revision
- Delete prepositional phrases to expose the real subject, then match the verb.
- "Along with", "as well as" and "including" never pluralise a singular subject.
- Each, every, either and neither take singular verbs.
- "One of the" takes a plural noun and a singular verb.
- Articles follow SOUND: a university, an hour.
- "Since" for a point in time, "for" for a duration.
- No preposition after discuss, order, request, reach or emphasise.
- Use the comparative for two, the superlative for three or more; never double them.
- "No error" is a legitimate answer.
:::`,
    mcqs: [
      {
        id: "q1",
        text: "Which sentence is grammatically correct?",
        options: ["The list of items are ready", "The list of items is ready", "The list of item are ready", "The lists of items is ready"],
        correctIndex: 1,
        explanation: "The subject is 'the list', which is singular, so the verb must be 'is'. The phrase 'of items' is an interrupting prepositional phrase and does not control the verb.",
      },
      {
        id: "q2",
        text: "Choose the correct sentence.",
        options: ["Each of the boys have a bag", "Each of the boys has a bag", "Each of the boy have a bag", "Each of the boy has a bag"],
        correctIndex: 1,
        explanation: "'Each' is singular and takes 'has', while 'of the boys' requires the plural noun. Only the second option gets both halves right.",
      },
      {
        id: "q3",
        text: "Which is correct?",
        options: ["One of my friend is coming", "One of my friends are coming", "One of my friends is coming", "One of my friend are coming"],
        correctIndex: 2,
        explanation: "'One of the' takes a PLURAL noun ('friends') but a SINGULAR verb ('is'), because the grammatical subject is 'one'.",
      },
      {
        id: "q4",
        text: "Which article usage is correct?",
        options: ["An university and a hour", "A university and an hour", "An university and an hour", "A university and a hour"],
        correctIndex: 1,
        explanation: "Articles follow sound, not spelling. 'University' begins with a 'yu' sound so it takes 'a'; the h in 'hour' is silent so it begins with a vowel sound and takes 'an'.",
      },
      {
        id: "q5",
        text: "Choose the correct sentence.",
        options: ["I have been working here since three years", "I have been working here for three years", "I am working here since three years", "I work here since three years"],
        correctIndex: 1,
        explanation: "'Three years' is a duration, which requires 'for'. 'Since' is used only with a point in time, such as 'since 2023'.",
      },
      {
        id: "q6",
        text: "Which sentence is free of error?",
        options: ["Let us discuss about the matter", "Let us discuss the matter", "Let us discuss on the matter", "Let us discuss regarding the matter"],
        correctIndex: 1,
        explanation: "'Discuss' takes a direct object and needs no preposition. Adding 'about', 'on' or 'regarding' is redundant.",
      },
      {
        id: "q7",
        text: "Which comparison is correct?",
        options: ["He is the tallest of the two brothers", "He is the taller of the two brothers", "He is more taller of the two brothers", "He is most tall of the two brothers"],
        correctIndex: 1,
        explanation: "With exactly two items the comparative 'taller' is required; the superlative is reserved for three or more. 'More taller' is a double comparative and always wrong.",
      },
      {
        id: "q8",
        text: "Choose the grammatically correct sentence.",
        options: ["The teacher, along with her students, are attending", "The teacher, along with her students, is attending", "The teacher along with her students were attending", "The teachers along with her students is attending"],
        correctIndex: 1,
        explanation: "'Along with' does not make the singular subject plural. The subject remains 'the teacher', so the verb is 'is'.",
      },
      {
        id: "q9",
        text: "Which sentence is correct?",
        options: ["Neither of the answers are correct", "Neither of the answers is correct", "Neither of the answer are correct", "Neither of the answer is correct"],
        correctIndex: 1,
        explanation: "'Neither' is singular and takes 'is', while 'of the answers' needs the plural noun.",
      },
      {
        id: "q10",
        text: "Identify the correct sentence.",
        options: ["This is the most easiest question", "This is the easiest question", "This is the more easier question", "This is the most easy question"],
        correctIndex: 1,
        explanation: "'Easiest' is already superlative, so adding 'most' creates a double superlative. 'More easier' is likewise a double comparative.",
      },
      {
        id: "q11",
        text: "Which sentence uses the verb correctly?",
        options: ["We reached at the station on time", "We reached the station on time", "We reached to the station on time", "We reached in the station on time"],
        correctIndex: 1,
        explanation: "'Reach' takes a direct object with no preposition, so 'reached the station' is correct.",
      },
      {
        id: "q12",
        text: "Choose the correct sentence.",
        options: ["The quality of the mangoes were poor", "The quality of the mangoes was poor", "The qualities of the mango was poor", "The quality of the mango were poor"],
        correctIndex: 1,
        explanation: "The subject is the singular 'the quality', so the verb is 'was'. 'Of the mangoes' is an interrupting phrase and does not govern the verb.",
      },
    ],
    timedQuiz: { timeLimitSeconds: 300, mcqIds: ["q1", "q3", "q5", "q8", "q12"] },
    problemIds: [],
    xpReward: 50, coinReward: 20,
    status: "published",
  },

  // ------------------------------------------------------------------
  // Day 56 - Tuesday 29 Sep 2026 - Para Jumbles
  // ------------------------------------------------------------------
  {
    date: "2026-09-29", dow: "tue", weekId: "2026-09-28", type: "lesson",
    title: "Day 56: Para Jumbles & Sentence Rearrangement",
    difficulty: "Medium",
    estimatedMinutes: 17,
    concept: `## Do Not Read for Meaning First

::: story
Four sentences, scrambled, and you have ninety seconds to put them in order. The instinct is to read all four carefully and work out what the paragraph is about.

That is the slow way, and under time pressure it fails. The fast way ignores meaning at first and hunts for MECHANICAL signals instead: a pronoun with nothing to refer back to, a "however" that must follow a contrasting claim, a definite article pointing at something already introduced. Those signals fix the order without your ever needing to fully understand the passage.
:::

## Finding the Opening Sentence

::: flow What an opener looks like, and what it cannot be
It introduces a subject by FULL NAME :: "The Reserve Bank of India announced..." can open. "It announced..." cannot, because "it" has nothing yet to refer to.
It uses indefinite articles for new things :: "A new study suggests..." introduces; "The study found..." refers back to a study already mentioned, so it cannot be first.
It contains no linking word :: A sentence starting with however, therefore, moreover, but, also, this, these, such or instead is responding to something earlier and can never open a paragraph.
It is general rather than specific :: Openers usually state the broad situation; the details, examples and numbers come afterwards.
:::

## The Signals That Chain Sentences Together

::: table Read these before reading for meaning
Signal | What it tells you
A pronoun - it, they, this, these, he, she | The noun it replaces appeared in an EARLIER sentence
The definite article "the" before a new-sounding noun | That noun was already introduced
However, but, nevertheless, on the contrary | The previous sentence made a CONTRASTING claim
Therefore, thus, hence, as a result, so | The previous sentence gave the CAUSE
Moreover, furthermore, also, in addition | The previous sentence made a similar point being extended
For example, for instance, such as | The previous sentence made the general claim being illustrated
Finally, in conclusion, lastly | This sentence is at or near the END
:::

## Worked Example

  A. However, the results were disappointing.
  B. A team of scientists conducted an experiment last year.
  C. They had expected a significant improvement in yield.
  D. The experiment was therefore repeated with a larger sample.

  B must open: it names "a team of scientists" in full, uses the indefinite
       "a team" and "an experiment", and carries no linking word.
  C follows B: "They" refers to the team, which only B has introduced.
  A follows C: "However" signals a contrast, and C set up the expectation
       that A overturns.
  D is last: "therefore" gives the consequence, and "the experiment" refers
       back to the one B introduced.

  order: B, C, A, D

Notice that the meaning was never needed. Four mechanical signals - a full noun phrase, a pronoun, a contrast marker and a consequence marker - determined the whole sequence.

::: remember
The MANDATORY PAIR technique is the biggest time-saver in this topic. Rather than building the full order, find two sentences that must be adjacent - a pronoun and its noun, a contrast and the claim it contradicts. Then eliminate every answer option that does not keep them together, in that order. Two or three options usually disappear at once, and sometimes only one survives without any further work.
:::

::: mistake
Do not assume the sentences are in a chronological or alphabetical pattern, and do not pick the option that merely "sounds nicest". Every correct para-jumble answer can be justified by a specific textual link - a pronoun, an article or a connector. If you cannot name the link, you are guessing.
:::

::: checkpoint
Which sentence is most likely to be the OPENING sentence of a paragraph?
- (x) A new study on urban air quality was published last week
- ( ) However, its findings were disputed by several experts
- ( ) The study covered twelve cities across the country
- ( ) They argued that the sampling method was flawed
> The first introduces a subject with the indefinite article "a" and carries no linking word. The second begins with "However" and the pronoun "its"; the third uses "the study" as a back-reference; the fourth opens with "They", which has no antecedent yet.
:::

::: revision
- Find the opener first: full noun phrases, indefinite articles, no linking word, general rather than specific.
- A sentence starting with however, therefore, moreover, this, these or such can never open.
- A pronoun always points BACKWARD to a noun in an earlier sentence.
- "The" before a new-sounding noun means it was already introduced.
- Contrast markers follow the claim they contradict; consequence markers follow the cause.
- Use mandatory pairs to eliminate options rather than building the full order.
- Every correct answer has a nameable textual link; if you cannot name it, re-check.
:::`,
    mcqs: [
      {
        id: "q1",
        text: "Which sentence is most likely to OPEN a paragraph?",
        options: ["A new study on air quality was published last week", "However, its findings were disputed", "The study covered twelve cities", "They argued the method was flawed"],
        correctIndex: 0,
        explanation: "It introduces the subject with an indefinite article and carries no linking word. The others begin with a contrast marker, a back-referencing 'the', or a pronoun with no antecedent.",
      },
      {
        id: "q2",
        text: "A sentence beginning with 'However' must be placed:",
        options: ["First in the paragraph", "After a sentence making a contrasting claim", "Last in the paragraph", "Immediately before the opening sentence"],
        correctIndex: 1,
        explanation: "'However' signals contrast, so it can only follow the statement it contrasts with. It can therefore never open a paragraph.",
      },
      {
        id: "q3",
        text: "In a para jumble, a sentence starting with the pronoun 'They' tells you that:",
        options: ["It is the opening sentence", "The noun it refers to appeared in an earlier sentence", "It is the concluding sentence", "The paragraph is about people"],
        correctIndex: 1,
        explanation: "Pronouns point backwards. Whatever 'They' stands for must already have been named, so this sentence cannot be first.",
      },
      {
        id: "q4",
        text: "Arrange: (A) However, the results were disappointing. (B) A team of scientists conducted an experiment last year. (C) They had expected a significant improvement. (D) The experiment was therefore repeated with a larger sample.",
        options: ["B, C, A, D", "B, A, C, D", "C, B, A, D", "A, B, C, D"],
        correctIndex: 0,
        explanation: "B opens by naming the team with indefinite articles. C follows because 'They' refers to that team. A contrasts with C's expectation. D concludes with 'therefore' and refers back to 'the experiment'.",
      },
      {
        id: "q5",
        text: "The 'mandatory pair' technique means:",
        options: ["Always placing the two longest sentences together", "Finding two sentences that must be adjacent and eliminating options that separate them", "Pairing the first and last sentences", "Matching sentences of similar length"],
        correctIndex: 1,
        explanation: "Identifying a forced adjacency - such as a pronoun and its noun - lets you discard every answer option that breaks that pair, often without constructing the full order.",
      },
      {
        id: "q6",
        text: "A sentence containing 'The study covered twelve cities' cannot be the opening sentence because:",
        options: ["It is too short", "'The study' refers back to a study already introduced", "It contains a number", "It has no verb"],
        correctIndex: 1,
        explanation: "The definite article signals that the study is already known to the reader, so an earlier sentence must have introduced it.",
      },
      {
        id: "q7",
        text: "Which connector indicates that the PREVIOUS sentence stated a cause?",
        options: ["Moreover", "Therefore", "For example", "However"],
        correctIndex: 1,
        explanation: "'Therefore' introduces a consequence, so the sentence before it must have supplied the cause.",
      },
      {
        id: "q8",
        text: "Which connector indicates the previous sentence made a general claim now being illustrated?",
        options: ["For instance", "Nevertheless", "Therefore", "Finally"],
        correctIndex: 0,
        explanation: "'For instance' introduces an example, so the preceding sentence must have made the general point being exemplified.",
      },
      {
        id: "q9",
        text: "Which of these can NEVER begin a paragraph?",
        options: ["A recent report highlighted the issue", "Scientists have long debated the question", "Moreover, the cost has risen sharply", "Air pollution affects millions of people"],
        correctIndex: 2,
        explanation: "'Moreover' extends a point already made, so it requires a preceding sentence. The other three introduce their subjects independently.",
      },
      {
        id: "q10",
        text: "Arrange: (A) It quickly became the most downloaded app of the year. (B) A small startup launched a messaging application in 2019. (C) Users praised its simplicity and speed. (D) Within months, it had over ten million users.",
        options: ["B, D, A, C", "B, A, D, C", "A, B, C, D", "B, C, D, A"],
        correctIndex: 0,
        explanation: "B opens by introducing the startup and the app with indefinite articles. D follows with the first consequence in time ('within months'). A escalates to the year's ranking. C closes with user reaction to the now-established app.",
      },
      {
        id: "q11",
        text: "When solving para jumbles under time pressure, the recommended first step is to:",
        options: ["Read all sentences carefully for overall meaning", "Look for mechanical signals such as pronouns, articles and connectors", "Choose the option that sounds most natural", "Count the words in each sentence"],
        correctIndex: 1,
        explanation: "Mechanical signals fix the order faster and more reliably than reading for meaning, and they give a justification you can check.",
      },
      {
        id: "q12",
        text: "A sentence beginning 'Finally, the committee approved the proposal' is most likely to be:",
        options: ["The opening sentence", "The second sentence", "At or near the end", "Immediately after a contrast marker"],
        correctIndex: 2,
        explanation: "'Finally' marks the last item in a sequence, placing the sentence at or near the end of the paragraph.",
      },
    ],
    timedQuiz: { timeLimitSeconds: 300, mcqIds: ["q1", "q4", "q5", "q9", "q10"] },
    problemIds: [],
    xpReward: 50, coinReward: 20,
    status: "published",
  },

  // ------------------------------------------------------------------
  // Day 57 - Wednesday 30 Sep 2026 - Reading Comprehension
  // ------------------------------------------------------------------
  {
    date: "2026-09-30", dow: "wed", weekId: "2026-09-28", type: "lesson",
    title: "Day 57: Reading Comprehension Strategy",
    difficulty: "Medium",
    estimatedMinutes: 20,
    concept: `## The Highest-Value Questions, and the Slowest

::: story
A comprehension passage carries four or five marks - more than any single quantitative question - but it eats five minutes if you read it the way you read a textbook.

The students who do well are not faster readers. They read the QUESTIONS first, then read the passage once with a purpose, and they answer strictly from the text rather than from what they happen to know about the topic. That last discipline is what separates a score of two from a score of five, because the most attractive wrong option in a comprehension set is almost always something that is true in the real world but never actually stated.
:::

## The Method

::: flow How to work a passage under time pressure
Skim the questions first, not the options :: Twenty seconds. You are learning what to look for - a date, a reason, the author's attitude - so the single read that follows has a purpose.
Read the passage once, marking structure :: Note where the topic is introduced, where a contrast turns up (however, but, yet), and where the author's own view appears as distinct from views being reported.
Answer detail questions by locating the line :: For anything factual, find the exact sentence and re-read it. Never answer a detail question from memory of the passage.
Answer inference questions from the text only :: The answer must be supported by what is written, not by what is generally true about the subject.
Leave tone and main-idea questions until last :: They are easier once you have combed the passage for the detail questions, because you will have re-read much of it.
:::

## The Four Question Types

::: table What each type is really asking
Type | What it wants | Where the answer lives
Factual detail | Something stated outright | One specific line - go find it
Inference | Something that follows from the text but is not stated | Between the lines, but still anchored to them
Main idea | What the whole passage is about | The overall arc, not a single striking sentence
Tone or attitude | The author's stance | Adjectives and adverbs the author chooses
:::

## How Wrong Options Are Built

Examiners construct distractors in predictable ways, and recognising the construction is quicker than evaluating the content:

  TRUE BUT NOT STATED      Accurate in the real world, absent from the
                           passage. The commonest trap of all, and it
                           feels right precisely because it IS right.

  TOO EXTREME              Takes a measured claim and hardens it. If the
                           passage says a policy "may help in some cases",
                           an option saying it "solves the problem
                           completely" is wrong. Watch all, never, always,
                           only, entirely.

  RIGHT IDEA, WRONG SCOPE  Describes one paragraph accurately and offers
                           it as the main idea of the whole passage.

  REVERSED                 States the opposite of the passage, often by
                           dropping or adding a single negative.

::: mistake
The single most expensive habit is answering from prior knowledge. If a passage about renewable energy omits any mention of cost, then "renewable energy is expensive" is not the answer - however true you believe it to be. The only admissible evidence is the passage itself.
:::

## Reading for Tone

Tone questions are decided by the author's descriptive word choices, not by the subject matter:

  critical      faults are named, with words like flawed, inadequate, failed
  appreciative  merits are highlighted: remarkable, valuable, impressive
  analytical    balanced and explanatory, with little evaluative language
  neutral       reports without endorsing or condemning anything

A passage about a serious problem is not automatically "pessimistic". If the author describes the problem and then sets out solutions, the tone is analytical or even optimistic. Judge the author's language, not the topic's mood.

::: remember
For main-idea questions, test each option against the WHOLE passage. The classic trap restates one vivid paragraph faithfully while ignoring the rest. Ask of each candidate: does this cover the beginning, the middle AND the end? If it covers only part, it is a supporting detail, not the main idea.
:::

::: checkpoint
A passage states: "While solar power has become significantly cheaper over the last decade, its adoption in rural areas remains limited by the absence of reliable storage." Which statement is best supported?
- ( ) Solar power is now the cheapest source of energy available
- (x) Storage limitations restrict rural solar adoption despite falling costs
- ( ) Rural areas are uninterested in solar power
- ( ) Solar power will never be viable in rural areas
> The second option restates both halves of the sentence accurately. The first overstates "significantly cheaper" into "cheapest available". The third invents a lack of interest the passage never mentions. The fourth is far too extreme - "never" appears nowhere.
:::

::: revision
- Read the questions before the passage so your single read has a purpose.
- Answer detail questions by locating the exact line, never from memory.
- Inference answers must still be anchored to the text.
- Save main-idea and tone questions for last.
- Distractor types: true but not stated, too extreme, right idea wrong scope, reversed.
- Distrust absolute words in options - all, never, always, only, entirely.
- Never use outside knowledge, however correct it is.
- Tone comes from the author's word choices, not from the subject matter.
- A main idea must cover the whole passage, not one paragraph.
:::`,
    mcqs: [
      {
        id: "q1",
        text: "The recommended first step when tackling a reading comprehension set is to:",
        options: ["Read the passage twice in full", "Skim the questions before reading the passage", "Read only the first and last paragraphs", "Read all the answer options first"],
        correctIndex: 1,
        explanation: "Skimming the questions gives the single read a purpose, so you notice the relevant details the first time instead of re-reading.",
      },
      {
        id: "q2",
        text: "A passage states: 'While solar power has become significantly cheaper over the last decade, its adoption in rural areas remains limited by the absence of reliable storage.' Which is best supported?",
        options: ["Solar power is the cheapest energy source available", "Storage limitations restrict rural solar adoption despite falling costs", "Rural areas are uninterested in solar power", "Solar power will never be viable in rural areas"],
        correctIndex: 1,
        explanation: "It restates both halves of the sentence accurately. The first overstates the claim, the third invents a motive, and the fourth uses 'never', which the passage never supports.",
      },
      {
        id: "q3",
        text: "An answer option that is factually true in the real world but never mentioned in the passage should be:",
        options: ["Selected, because it is true", "Rejected, because comprehension answers must come from the passage", "Selected only for inference questions", "Selected only for main-idea questions"],
        correctIndex: 1,
        explanation: "The passage is the only admissible evidence. 'True but not stated' is the most common distractor precisely because it feels correct.",
      },
      {
        id: "q4",
        text: "If a passage says a policy 'may help in some cases', which option is a TOO EXTREME distractor?",
        options: ["The policy may be beneficial in certain situations", "The policy completely solves the problem", "The policy has some potential value", "The policy might assist occasionally"],
        correctIndex: 1,
        explanation: "'Completely solves' hardens a hedged claim into an absolute one. The other three preserve the original tentativeness.",
      },
      {
        id: "q5",
        text: "A main-idea question is best answered by choosing the option that:",
        options: ["Restates the most striking sentence", "Covers the whole passage from beginning to end", "Summarises the first paragraph", "Contains the most specific detail"],
        correctIndex: 1,
        explanation: "The main idea must span the entire passage. An option that faithfully restates one paragraph is a supporting detail and is the standard trap.",
      },
      {
        id: "q6",
        text: "Where should you look to determine an author's TONE?",
        options: ["The subject matter of the passage", "The adjectives and adverbs the author chooses", "The length of the passage", "The number of paragraphs"],
        correctIndex: 1,
        explanation: "Tone lives in evaluative word choices. A grim subject discussed in balanced, explanatory language is analytical, not pessimistic.",
      },
      {
        id: "q7",
        text: "A distractor that describes one paragraph accurately but is offered as the main idea of the entire passage is an example of:",
        options: ["A reversed option", "Right idea, wrong scope", "True but not stated", "Too extreme"],
        correctIndex: 1,
        explanation: "The content is accurate but the scope is too narrow to serve as the main idea of the whole passage.",
      },
      {
        id: "q8",
        text: "For a FACTUAL DETAIL question, the correct approach is to:",
        options: ["Answer from memory of the passage", "Locate and re-read the specific line", "Choose the longest option", "Infer from the overall argument"],
        correctIndex: 1,
        explanation: "Detail questions have a single supporting line. Locating and re-reading it eliminates the misremembering that costs easy marks.",
      },
      {
        id: "q9",
        text: "An author writes that a scheme was 'poorly designed and inadequately funded'. The tone is best described as:",
        options: ["Appreciative", "Critical", "Neutral", "Humorous"],
        correctIndex: 1,
        explanation: "'Poorly' and 'inadequately' are explicitly fault-finding, which makes the tone critical.",
      },
      {
        id: "q10",
        text: "Which words in an answer option should most raise suspicion during comprehension?",
        options: ["Some, often, may", "All, never, always, only", "Because, therefore", "However, although"],
        correctIndex: 1,
        explanation: "Absolute words usually overstate what a passage actually claims. Hedged language more often matches the text.",
      },
      {
        id: "q11",
        text: "An INFERENCE question differs from a factual-detail question in that its answer:",
        options: ["Is stated word for word in the passage", "Follows from the passage without being stated outright", "Comes from general knowledge", "Is always in the final paragraph"],
        correctIndex: 1,
        explanation: "An inference is derived from the text rather than quoted from it, but it must still be anchored to what the passage says.",
      },
      {
        id: "q12",
        text: "A distractor created by adding or removing a single negative, so that it states the opposite of the passage, is called:",
        options: ["Too extreme", "Reversed", "Right idea, wrong scope", "True but not stated"],
        correctIndex: 1,
        explanation: "A reversed option flips the passage's meaning, often by one small word, and is easy to miss when skimming.",
      },
    ],
    timedQuiz: { timeLimitSeconds: 300, mcqIds: ["q2", "q3", "q4", "q5", "q10"] },
    problemIds: [],
    xpReward: 50, coinReward: 20,
    status: "published",
  },

];
