// Aptitude Foundations - rewritten lesson bodies. See operating-systems.mjs for
// the authoring rules. The running frame across all four lessons: this round is
// a timed recognition test, not a maths test - so every lesson is built around
// spotting the type fast rather than deriving from first principles. The traps
// named in the source prose are kept as checkpoints, since a trap you have
// personally fallen for once is worth more than a trap you read about.

export const APTITUDE_FOUNDATIONS = {
  "basic-mathematics": {
    concept: `## You Are Not Being Tested On Maths

::: story
Give almost any student unlimited time and a quiet room, and they can work out a percentage problem. That is not in doubt, and the test writers know it.

So they take away the room and the time. Thirty questions. Under an hour. Under pressure.

Which changes what is actually being measured.
:::

::: remember
The aptitude round tests **pattern recognition under a clock**, not mathematical ability.

Reframe the preparation accordingly. You are not learning to do percentages - you already can. You are training to recognise which kind of question this is within two lines of reading it.
:::

::: analogy
A musician practising scales isn't learning what notes are. They're building recall so fast it doesn't consume attention during the performance.

Same thing here. The maths is the notes. Recognition speed is the practice.
:::

## The List Is Shorter Than You Think

::: cards What actually appears, drive after drive
Percentages :: Especially percentage *change*, which has a trap built into it.
Ratios and proportions :: Splitting quantities, scaling recipes, mixture problems.
Profit, loss and discount :: Cost price, selling price, marked price, and the relationships between them.
Simple and compound interest :: Two formulas, endlessly re-dressed.
Time, speed and distance :: Including two-trains and boats-and-streams problems.
:::

::: didyouknow
That list is close to identical across TCS, Infosys, Wipro, Cognizant and Accenture drives.

Which is unusually good news. A narrow, predictable syllabus is the easiest kind to prepare for - and it means time spent on exotic topics is time taken from the ones that will definitely appear.
:::

## The Trap Everyone Falls For Once

::: story
A shirt costs 100. The price goes up 20%. Then it comes back down 20%.

Back to 100, surely. Up then down by the same amount.
:::

  Original:        100
  After +20%:      120
  After -20%:      120 - 24 = 96      (20% of 120, not of 100)

  Final: 96, not 100.

::: remember
Percentage change is **not symmetric**, because the second percentage is calculated on a different base.

The increase was 20% of 100. The decrease was 20% of 120. Different bases, different amounts - so they cannot cancel.
:::

::: checkpoint
A stock falls 50%, then rises 50%. Where is it relative to where it started?
- ( ) Back to the original value
- (x) Still 25% below - the rise was 50% of the reduced value, not of the original
- ( ) 25% above the original
- ( ) Cannot be determined without the actual price
> Still down 25%. Start at 100, fall to 50, then rise by 50% *of 50* - which is 25, giving 75. The bigger the swing, the worse the asymmetry, which is why this appears constantly.
:::

::: mistake
Re-deriving a formula from first principles on every question.

It works, and it is far too slow. A student who has seen twenty profit-and-loss variations recognises the twenty-first in five seconds and applies the shortcut. A student solving each one fresh runs out of clock with correct working on half the paper.
:::

## How To Actually Practise

::: cards Two habits that move the needle
Time every set :: A large share of aptitude failures are correct approaches that ran out of time. If you never practise against a clock, you never find out which types are slow for you.
Keep a personal formula sheet :: One page of shortcuts for each recurring type - percentage change, compound interest, relative speed. Drill until recall is instant rather than reconstructed.
:::

::: behind
The two-trains and boats-and-streams families look like a dozen different problems. They are one idea in costumes.

Moving toward each other, speeds **add**. One catching up with the other, speeds **subtract**. A boat with the current adds, against it subtracts.

Recognising which of those two cases a word problem is - inside the first sentence - beats memorising twelve formulas that are all restatements of the same relative-speed idea.
:::`,
  },

  "logical-thinking": {
    concept: `## A Different Muscle

::: story
The previous lesson's questions were about speed with numbers. This family is about something else entirely: holding several stated facts in your head at once and deriving only what genuinely follows from all of them.

The hard part is not the reasoning. It is keeping your own knowledge out of it.
:::

::: remember
Everything you know about the real world is a liability here.

These questions ask what the *given statements* guarantee - not what is true, not what is likely, not what any sensible person would assume. Only what follows.
:::

## Syllogisms And The Trap Built Into Them

::: story
"All cats are animals. Some animals are pets. Therefore some cats are pets."

It sounds fine. It is not valid.
:::

::: cards The classic invalid pattern
Given :: Some A are B. Some B are C.
Tempting conclusion :: Some A are C.
Why it fails :: The B's that are A and the B's that are C might be entirely separate groups. Nothing in the statements forces any overlap.
:::

  Some doctors are teachers.
  Some teachers are singers.
  Therefore: some doctors are singers?  -- NOT valid.

  The teachers who are doctors and the teachers who are singers
  could be completely different people. Nothing guarantees an overlap.

::: checkpoint
"All engineers are graduates. Some graduates are unemployed." Does it follow that some engineers are unemployed?
- ( ) Yes - engineers are graduates, and some graduates are unemployed
- (x) No - the unemployed graduates might all be non-engineers, and nothing rules that out
- ( ) Yes, but only if there are more engineers than graduates
- ( ) The statements contradict each other
> No. Every engineer being a graduate doesn't mean engineers are among the *particular* graduates who are unemployed. This is the some-trap wearing a different set of nouns, which is exactly how it's always presented.
:::

::: mistake
Concluding what is plausible rather than what is guaranteed.

The test writers construct these options deliberately. The invalid conclusion is always the one that feels obviously true - if it felt wrong, the question would be pointless.
:::

## Draw It. Always.

::: story
"A is B's brother. B is C's mother. C is D's father."

Three sentences, and if you try to hold that in your head while a clock runs, you will get it wrong more often than you expect - not because it's hard, but because working memory under time pressure is unreliable in exactly this way.

Ten seconds of drawing removes the problem entirely.
:::

::: cards Draw what, for which type
Blood relations :: A small family tree. Arrows for parent-of, a line for siblings, and mark genders as you go.
Coding-decoding :: A letter-shift table. Write the alphabet with positions once, and reuse it for every question in the set.
:::

::: remember
Make drawing the **default**, including on questions that look simple enough to do mentally.

The habit has to already exist before you hit the hard one. Deciding case by case means deciding wrong under pressure, which is precisely when it matters.
:::

::: interview
For syllogisms specifically, drill the handful of classic invalid patterns until spotting them is automatic rather than reasoned.

The some-some trap is the most common by a distance. Recognising it on sight saves the fifteen seconds you'd otherwise spend convincing yourself.
:::

::: behind
Coding-decoding questions almost always rest on one of three underlying patterns: a fixed letter-shift, a reversal, or a position-based rearrangement.

Practising "find the shift" as its own isolated drill - not as part of full questions - builds the sub-skill that makes full questions fast. Same principle as scales before pieces.
:::`,
  },

  "problem-solving": {
    concept: `## The Work-It-Out Family

::: story
Number and letter series. Seating arrangements. Age problems. Calendar puzzles.

And one question type that reliably catches strong students out - not because the maths is hard, but because they answer a question nobody asked.
:::

## Data Sufficiency Is Not Asking For The Answer

::: story
You get a question and two separate statements. Then you're asked whether those statements - alone, or together - contain enough information to determine a unique answer.

Not what the answer is. Whether it can be known.

Almost everyone starts computing anyway.
:::

::: remember
Data sufficiency tests "is this enough to know for certain," not "what is the value."

Those are genuinely different skills, and the second one is a trap here - every second spent computing a number you were never asked for is a second gone.
:::

::: mistake
Fully solving a data sufficiency problem.

It's the single most common time-waster in this section, and it is committed almost entirely by students who are good at the underlying maths. Being able to compute the answer makes the pull toward computing it stronger.
:::

::: checkpoint
A data sufficiency question asks for a person's age. Statement 1 alone lets you determine it uniquely. What have you established?
- ( ) You need to compute the age to answer
- (x) Statement 1 is sufficient - and you can move on without ever calculating the actual number
- ( ) You must also check whether statement 2 gives the same age
- ( ) Nothing until both statements are combined
> Sufficient, and you're done. Once you know a unique answer is determinable, the answer itself is irrelevant to the question being asked. Computing it is work you volunteered for.
:::

::: interview
Practise at least ten dedicated data sufficiency questions before test day.

The format itself takes adjusting to, independent of the content. The first few feel strange no matter how strong your maths is - and you don't want that adjustment happening during the real thing.
:::

## Series: Look One Level Down

::: story
2, 6, 12, 20, 30, ?

Staring at those numbers rarely helps. Looking at the gaps between them almost always does.
:::

  Series:       2   6   12   20   30   ?
  Differences:    4    6    8   10

  The differences form their own clean pattern (+2 each time),
  so the next difference is 12, giving 30 + 12 = 42.

::: remember
Check the differences between consecutive terms first, before anything else.

A large share of series questions are a simple pattern hiding one level down. If the differences don't reveal it, try ratios next - but differences first, every time.
:::

## Unfamiliar Puzzles: The First Thirty Seconds

::: flow
Read every clue before writing anything :: You need the shape of the whole puzzle before committing ink. The last clue often determines how the first one should be recorded.
Rank the clues by how much they fix :: A clue pinning one person to one exact seat is worth more than a vague relative-position clue.
Apply the most constraining ones first :: Not the listed order. The listed order is arbitrary and sometimes deliberately unhelpful.
Fill in the rest :: With most of the uncertainty already gone, the vaguer clues usually resolve immediately.
:::

::: mistake
Processing clues strictly in the order given.

Clue order is a presentation choice, not a solution path - and a well-written puzzle often opens with the vaguest clue precisely to see whether you'll reorganise.
:::

::: behind
Calendar and clock-angle puzzles each reduce to one small memorisable fact.

Calendars come down to counting **odd days** across a span of years. Clock angles come down to the hour and minute hands each moving at a fixed, calculable degrees-per-minute rate.

Learn the one fact, apply it. That's the same recognise-the-type efficiency from the Basic Mathematics lesson, pointed at a different question family.
:::`,
  },

  "analytical-reasoning": {
    concept: `## Reading, Not Calculating

::: story
This is the most verbal of the four families. No numbers, no diagrams - just a short argument and questions about how it works.

And three words that get confused constantly, which the test writers exploit on purpose.
:::

::: cards Conclusion, assumption, inference
Conclusion :: What the author explicitly states as their final point. It's written down in the passage.
Assumption :: Something the argument silently relies on without stating. If it were false, the argument would collapse.
Inference :: Something validly derivable from the passage, though never stated directly.
:::

::: remember
The distinguishing test is where each one lives.

A conclusion is *in* the passage. An assumption is *underneath* it, holding it up. An inference is *downstream* of it, following from it. Three positions relative to the same argument.
:::

::: checkpoint
"Sales rose after we launched the ad campaign, so the campaign worked." Which is the unstated assumption?
- ( ) That sales rose
- ( ) That an ad campaign was launched
- (x) That nothing else changed which could explain the rise - no seasonal effect, no competitor exiting, no price cut
- ( ) That the campaign was expensive
> That nothing else explains it. The first two are stated facts, not assumptions. The argument only holds if the campaign is the *only* plausible cause - and the moment you name that, you know exactly where the question is going.
:::

## Strengthen And Weaken Start In The Same Place

::: story
These questions give you an argument and ask which additional statement would make it more, or less, convincing.

The instinct is to read each option and judge it. That's slow, and it's how the plausible-sounding wrong answer gets picked.

Find the hidden assumption first. The correct option almost always aims straight at it.
:::

  Argument:   "Sales increased after the new ad campaign,
               so the campaign was effective."

  Assumption: nothing else explains the increase.

  Weaken:     "A major competitor went out of business
               that same month."   -- attacks the assumption directly

::: flow
Read the argument :: Identify what's being concluded.
Name the assumption :: Out loud or on paper. What has to be true for this to hold?
Then read the options :: The right one will engage with that assumption. Most of the wrong ones won't touch it.
:::

::: mistake
Picking an option because it's true and sounds relevant.

A statement can be entirely accurate, clearly related to the topic, and do nothing whatsoever to the argument's logic. That is the standard wrong answer in this family - real-world truth is not the criterion. Engagement with the reasoning chain is.
:::

::: remember
The question is never "is this statement true?" It is "does this statement make *this specific argument* stronger or weaker?"

Those come apart more often than they feel like they should, which is precisely why the trap works.
:::

## Practising This One

::: interview
Take ten short arguments and write out the hidden assumption for each - before ever looking at answer choices.

That single drill improves strengthen/weaken accuracy more than any other, because the assumption is the answer's target. Find the target and the choosing becomes easy.
:::

::: behind
Formal frameworks - the ones GMAT and CAT use, which product-company aptitude rounds borrow from - split this family further.

**Flaw** questions ask you to name the logical gap without fixing it. **Paradox** questions ask how two seemingly contradictory facts could both be true.

Identifying which sub-type you're looking at *before* attempting an answer is itself a measurable accuracy gain, because each one has a different thing it wants from you.
:::

::: didyouknow
This is the family with the longest shelf life. Identifying an argument's unstated assumptions before evaluating it is a genuine working skill - for reading a business case, a research claim, or a news article without simply absorbing its conclusion.

The other three lessons train you for a test. This one keeps paying afterwards.
:::`,
  },
};
