// DeVert Campus - Aptitude Series, Week 3: Speed/Work continuation +
// Combinatorics & Data Interpretation (Mon 17 Aug - Sat 22 Aug 2026).
//
// Days 13-18 of the 30-day series. Same authoring rules as week1.mjs - read
// that file's header before editing this one. The load-bearing ones:
//
//  1. `concept` is ONE string parsed by devert-frontend/lib/lessonBlocks.js.
//     Fences are `::: variant optional title` ... `:::`, each on its own line.
//     Never write "->" inside a `flow` step body (the parser splits on it).
//     Two-space-indented lines become code blocks, so traced arithmetic is
//     indented on purpose. Never put a "|" inside a `table` cell.
//  2. Story or concrete number FIRST, technical name SECOND.
//  3. One `mistake`, one `remember`/`funfact`, exactly one `checkpoint`, and a
//     closing `revision` that works as a 30-second pre-exam re-read.
//  4. MCQ shape is `{ id, text, options, correctIndex, explanation }` - `text`,
//     NOT `question` (see campus-daily-learning-editor.jsx's blankMcq()).
//  5. `timedQuiz.mcqIds` are 5 ids drawn from that same day's own `mcqs`.
//  6. ASCII hyphens only - scripts/normalize-dashes.mjs rewrites em/en dashes
//     across the database, so authoring them here just creates churn.
//
// Days 17 and 18 each carry ONE dataset (a revenue table, and a pie + line
// pair) declared in the `concept`. Every MCQ on those days reads off that same
// dataset - if you edit a number in the table you must re-derive every answer
// on that day, not just the questions that mention it directly.

export const WEEK3_DAYS = [

  // ------------------------------------------------------------------
  // Day 13 - Monday 17 Aug 2026 - Boats & Streams
  // ------------------------------------------------------------------
  {
    date: "2026-08-17", dow: "mon", weekId: "2026-08-17", type: "lesson",
    title: "Day 13: Boats & Streams",
    difficulty: "Medium",
    estimatedMinutes: 18,
    concept: `## The River That Pushes Back

::: story
On a school trip you get a rowboat for half an hour. On the still lake beside the jetty you settle into a steady **10 km per hour**.

Then you row out into the river that feeds the lake. The river itself is moving at **2 km per hour**.

Row *with* the river and something lovely happens: the water carries you along and your speed past the bank becomes 10 + 2 = **12 km/h**. Turn around and row *against* it and the river quietly steals from you: 10 - 2 = **8 km/h**.

Notice you did not get stronger going one way or weaker going the other. Your rowing is 10 km/h in both directions. The river added itself once and subtracted itself once. That is the whole topic, and every question on it is a disguise over those two lines.
:::

## Two Directions, Two Names

Going along with the current is **downstream**. Fighting it is **upstream**. Call the boat's own speed in still water \`b\` and the current's speed \`s\`, and you have the only two formulas you need:

  downstream speed = b + s
  upstream speed   = b - s

Trace it on our boat over a fixed 24 km stretch of river:

  Downstream: 24 / 12 = 2 hours
  Upstream:   24 / 8  = 3 hours
  Round trip: 48 km covered in 5 hours

Look at how lopsided that is. Same river, same distance, same arms - and the return leg costs you a full extra hour. A current of just 2 km/h against a 10 km/h boat stretches a 2-hour leg into 3.

## Working Backwards: The Half-Sum and the Half-Difference

Real papers almost never hand you \`b\` and \`s\`. They hand you the two *journey* speeds and ask for the boat and the stream. So run the arithmetic in reverse.

  b = (downstream + upstream) / 2 = (12 + 8) / 2 = 10 km/h
  s = (downstream - upstream) / 2 = (12 - 8) / 2 = 2 km/h

Half the sum, half the difference. If that pattern feels familiar it is because it is the same move as "two numbers add to 20 and differ by 4" - the boat is the average of the two speeds and the stream is half the gap between them.

::: table Everything the topic asks for, checked against b = 10, s = 2
Quantity | Formula | On our numbers
Downstream speed | b + s | 10 + 2 = 12 km/h
Upstream speed | b - s | 10 - 2 = 8 km/h
Still-water speed, from the two speeds | (down + up) / 2 | (12 + 8) / 2 = 10 km/h
Stream speed, from the two speeds | (down - up) / 2 | (12 - 8) / 2 = 2 km/h
Boat-to-stream ratio when upstream takes n times as long | (n + 1) : (n - 1) | n = 3 gives 4 : 2, i.e. b = 2s
:::

That last row earns its place. "The boat takes three times as long to come back" sounds like it needs algebra; it collapses to a ratio you can read off in two seconds. It is worth seeing why once: if upstream takes n times as long over the same distance, then upstream speed is 1/n of downstream speed, so \`n(b - s) = b + s\`, which rearranges to \`b(n - 1) = s(n + 1)\`.

::: flow How to unpack any boats-and-streams question
Name the two journey speeds :: work out downstream and upstream in km/h before touching anything else
Convert times into speeds :: distance over time, per leg, never an average of the two legs
Half-sum for the boat :: (down + up) / 2 gives still-water speed
Half-difference for the stream :: (down - up) / 2 gives the current
Sanity-check the direction :: upstream must be the smaller number, always
:::

::: mistake
The number one error is computing the **average speed of the round trip** as the average of the two speeds.

Our boat went downstream at 12 and upstream at 8. The average of those is 10, and 10 is wrong. The trip was 48 km in 5 hours, so the true average speed is 48 / 5 = **9.6 km/h**.

Here is the part that trips people twice: averaging the two speeds *is* legal when you are asked for still-water speed - that really is (12 + 8)/2 = 10. It is not legal for average speed over the journey, because you spend more time on the slow leg, so the slow leg deserves more weight. For equal distances the correct figure is \`2 x down x up / (down + up)\` = 2 x 12 x 8 / 20 = 9.6.

The runner-up mistake: reading "the boat takes 3 hours upstream and 2 hours downstream" and averaging the *times* to get a still-water time. Times never average. Convert to speeds first, every single time.
:::

::: remember
**Down**stream you go **d**own easy, so **a**dd. Upstream you fight, so subtract.

Then two lines that solve most of the set:
- Boat = **half the sum** of the two speeds. Stream = **half the difference**.
- If the upstream trip takes **n** times as long, then boat : stream = **(n + 1) : (n - 1)**. Twice as long gives 3 : 1, three times as long gives 2 : 1.

And one free sanity check: if your stream speed ever comes out bigger than your boat speed, you have made a sign error - a boat slower than the current can never move upstream at all.
:::

::: checkpoint
A boat takes three times as long to travel a stretch of river upstream as it takes to travel the same stretch downstream. What is the ratio of the boat's speed in still water to the speed of the stream?
- ( ) 3 : 1
- (x) 2 : 1
- ( ) 4 : 1
- ( ) 3 : 2
> Same distance, so three times the time means one third the speed: upstream = downstream / 3, i.e. \`3(b - s) = b + s\`. That gives \`2b = 4s\`, so b = 2s and the ratio is **2 : 1**. Check with real numbers: a 6 km/h boat on a 3 km/h stream does 9 km/h down and 3 km/h up, and 3 km/h is exactly one third of 9. The trap answer 3 : 1 comes from copying the "3" straight out of the question, which is the correct answer to a *different* question - "twice as long" is the one that gives 3 : 1.
:::

::: revision
A current adds itself downstream and subtracts itself upstream: \`down = b + s\` and \`up = b - s\`, where b is the boat's still-water speed and s is the stream's. Papers give you the journeys and want the boat, so reverse it: the boat is the **half-sum** (down + up)/2 and the stream is the **half-difference** (down - up)/2. A 10 km/h boat on a 2 km/h stream does 12 down and 8 up, which turns a 24 km leg into 2 hours one way and 3 hours the other. Never average the two speeds to get a round-trip average speed - that trip is 48 km in 5 hours, so 9.6 km/h, and the general formula for equal distances is \`2 x down x up / (down + up)\`. Never average times at all; convert each leg to a speed first. When a question says the upstream leg takes n times as long, skip the algebra and use boat : stream = **(n + 1) : (n - 1)**. Last check before you move on: upstream is always the smaller speed, and the stream can never be faster than the boat.
:::`,
    mcqs: [
      {
        id: "q1",
        text: "A boat's speed in still water is 12 km/h and the stream flows at 3 km/h. What is the boat's downstream speed?",
        options: ["9 km/h", "12 km/h", "15 km/h", "36 km/h"],
        correctIndex: 2,
        explanation: "Downstream the current helps, so add: 12 + 3 = 15 km/h. Subtracting gives 9 km/h, which is the upstream speed, and 36 comes from multiplying the two speeds, which has no meaning here.",
      },
      {
        id: "q2",
        text: "A boat can row at 15 km/h in still water. If the stream flows at 5 km/h, how long does the boat take to cover 40 km upstream?",
        options: ["2 hours", "2 hours 40 minutes", "4 hours", "8 hours"],
        correctIndex: 2,
        explanation: "Upstream speed is 15 - 5 = 10 km/h, so the time is 40 / 10 = 4 hours. Using the downstream speed of 20 km/h gives the trap answer 2 hours, and using the still-water speed of 15 gives 2 hours 40 minutes.",
      },
      {
        id: "q3",
        text: "A man rows downstream at 18 km/h and upstream at 12 km/h. What is his speed in still water?",
        options: ["3 km/h", "6 km/h", "15 km/h", "30 km/h"],
        correctIndex: 2,
        explanation: "Still-water speed is the half-sum: (18 + 12) / 2 = 15 km/h. The half-difference (18 - 12) / 2 = 3 km/h is the stream's speed, and 30 is the un-halved sum.",
      },
      {
        id: "q4",
        text: "A man rows downstream at 18 km/h and upstream at 12 km/h. What is the speed of the stream?",
        options: ["3 km/h", "6 km/h", "12 km/h", "15 km/h"],
        correctIndex: 0,
        explanation: "The stream is the half-difference: (18 - 12) / 2 = 3 km/h. Forgetting to halve the gap gives 6 km/h, which is the single most common slip on this question type. Check it: 15 + 3 = 18 and 15 - 3 = 12.",
      },
      {
        id: "q5",
        text: "A boat covers 24 km downstream in 2 hours and returns over the same 24 km in 3 hours. What is the boat's speed in still water?",
        options: ["2 km/h", "8 km/h", "10 km/h", "12 km/h"],
        correctIndex: 2,
        explanation: "Downstream speed is 24 / 2 = 12 km/h and upstream is 24 / 3 = 8 km/h. Still water is the half-sum: (12 + 8) / 2 = 10 km/h. The options 12 and 8 are the two journey speeds themselves.",
      },
      {
        id: "q6",
        text: "A boat covers 24 km downstream in 2 hours and returns over the same 24 km in 3 hours. What is its average speed for the whole round trip?",
        options: ["9.6 km/h", "10 km/h", "10.4 km/h", "12 km/h"],
        correctIndex: 0,
        explanation: "Average speed is total distance over total time: 48 km in 5 hours = 9.6 km/h. Averaging the two speeds gives 10 km/h, which is the still-water speed and NOT the average speed - more time is spent on the slower leg. The equal-distance formula confirms it: 2 x 12 x 8 / 20 = 9.6.",
      },
      {
        id: "q7",
        text: "A boat goes 30 km upstream and 44 km downstream in 10 hours. It also goes 40 km upstream and 55 km downstream in 13 hours. What is the boat's speed in still water?",
        options: ["6 km/h", "8 km/h", "10 km/h", "11 km/h"],
        correctIndex: 1,
        explanation: "With x = 1/upstream and y = 1/downstream: 30x + 44y = 10 and 40x + 55y = 13. Scaling to 120x + 176y = 40 and 120x + 165y = 39 and subtracting gives 11y = 1, so downstream = 11 km/h; back-substituting gives upstream = 5 km/h. Still water = (11 + 5) / 2 = 8 km/h. (11 is the downstream speed, a tempting mis-read.)",
      },
      {
        id: "q8",
        text: "A man can row at 9 km/h in still water and finds that it takes him twice as long to row up the river as to row down it. What is the speed of the stream?",
        options: ["2 km/h", "2.5 km/h", "3 km/h", "4.5 km/h"],
        correctIndex: 2,
        explanation: "Twice the time over the same distance means half the speed, so 2(b - s) = b + s, giving b = 3s. With b = 9, s = 3 km/h. Check: 12 km/h down and 6 km/h up, and 6 is exactly half of 12. Halving the boat's speed instead gives the trap answer 4.5.",
      },
      {
        id: "q9",
        text: "A boat whose speed in still water is 10 km/h goes 12 km downstream and returns, taking 2 hours 30 minutes in all. What is the speed of the stream?",
        options: ["1 km/h", "2 km/h", "3 km/h", "4 km/h"],
        correctIndex: 1,
        explanation: "12/(10 + s) + 12/(10 - s) = 2.5. Combining the fractions gives 240 / (100 - s^2) = 2.5, so 100 - s^2 = 96 and s = 2 km/h. Verify: 12/12 = 1 hour down and 12/8 = 1.5 hours back, which is 2.5 hours exactly.",
      },
      {
        id: "q10",
        text: "A swimmer can swim at 5 km/h in still water. The river he is in also flows at 5 km/h. How long will he take to swim 10 km upstream?",
        options: ["1 hour", "2 hours", "10 hours", "He can never cover it"],
        correctIndex: 3,
        explanation: "Upstream speed is 5 - 5 = 0 km/h, so he makes no progress against the current at all and never arrives. Any numeric answer here comes from quietly using the downstream speed (10 km/h, giving 1 hour) or the still-water speed (5 km/h, giving 2 hours).",
      },
      {
        id: "q11",
        text: "A boat's speed in still water is 15 km/h and the current is 3 km/h. The boat goes 24 km downstream and comes back. What is the total time taken?",
        options: ["3 hours", "3 hours 20 minutes", "3 hours 40 minutes", "4 hours"],
        correctIndex: 1,
        explanation: "Downstream 18 km/h gives 24/18 = 1 hour 20 minutes; upstream 12 km/h gives 24/12 = 2 hours. Total 3 hours 20 minutes. Using the still-water speed for both legs gives 48/15 = 3 hours 12 minutes, which is why that near-miss is not on the list.",
      },
      {
        id: "q12",
        text: "A boat travels 20 km downstream in the same time it takes to travel 12 km upstream. If the stream flows at 4 km/h, what is the boat's speed in still water?",
        options: ["12 km/h", "14 km/h", "16 km/h", "20 km/h"],
        correctIndex: 2,
        explanation: "Equal times mean the speeds are in the ratio of the distances: (b + 4)/(b - 4) = 20/12 = 5/3. Cross-multiplying, 3b + 12 = 5b - 20, so 2b = 32 and b = 16 km/h. Check: 20 km at 20 km/h is 1 hour, and 12 km at 12 km/h is 1 hour.",
      },
      {
        id: "q13",
        text: "The ratio of a boat's downstream speed to its upstream speed is 7 : 3. If the stream flows at 6 km/h, what is the boat's speed in still water?",
        options: ["12 km/h", "15 km/h", "18 km/h", "21 km/h"],
        correctIndex: 1,
        explanation: "Write the speeds as 7k and 3k. The stream is the half-difference, so (7k - 3k)/2 = 2k = 6, giving k = 3. The boat is the half-sum: (7k + 3k)/2 = 5k = 15 km/h. Forgetting to halve gives k = 1.5 and the wrong answer 7.5; taking 7k directly with k = 3 gives 21, which is the downstream speed.",
      },
      {
        id: "q14",
        text: "A boat takes 8 hours 48 minutes to cover a certain distance upstream, and 4 hours to cover the same distance downstream. What is the ratio of the boat's speed in still water to the speed of the stream?",
        options: ["8 : 3", "11 : 5", "5 : 2", "3 : 1"],
        correctIndex: 0,
        explanation: "8 hours 48 minutes is 8.8 hours, so the times are in the ratio 8.8 : 4 = 11 : 5 and therefore the speeds are in the inverse ratio 5 : 11 (upstream : downstream). Taking upstream 5k and downstream 11k, boat = (11k + 5k)/2 = 8k and stream = (11k - 5k)/2 = 3k, so the ratio is 8 : 3. The trap answer 11 : 5 is the ratio of the times, not of boat to stream.",
      },
      {
        id: "q15",
        text: "A man rows to a place 48 km away and comes back. The whole trip takes 14 hours. He notices that he can row 4 km with the stream in the same time as 3 km against it. What is the speed of the stream?",
        options: ["1 km/h", "1.5 km/h", "2 km/h", "2.5 km/h"],
        correctIndex: 0,
        explanation: "Equal times over 4 km and 3 km mean downstream : upstream = 4 : 3, so write them as 4k and 3k. Then 48/(4k) + 48/(3k) = 14 gives 12/k + 16/k = 28/k = 14, so k = 2. Downstream is 8 km/h and upstream is 6 km/h, so the stream is (8 - 6)/2 = 1 km/h (and the boat is 7 km/h). Verify: 48/8 = 6 hours plus 48/6 = 8 hours is 14 hours.",
      },
    ],
    timedQuiz: { timeLimitSeconds: 300, mcqIds: ["q5", "q7", "q9", "q12", "q14"] },
    problemIds: [],
    xpReward: 50, coinReward: 20,
    status: "published",
  },

  // ------------------------------------------------------------------
  // Day 14 - Tuesday 18 Aug 2026 - Races & Circular Track Motion
  // ------------------------------------------------------------------
  {
    date: "2026-08-18", dow: "tue", weekId: "2026-08-17", type: "lesson",
    title: "Day 14: Races & Circular Track Motion",
    difficulty: "Medium",
    estimatedMinutes: 18,
    concept: `## "I Beat You By Ten Metres"

::: story
Sports day. A 100 m race. You cross the line and turn around, and your friend is still running - she is **10 metres short** of the finish when you get there.

That sentence, "A beats B by 10 metres", is doing something sneaky that almost nobody notices: it is a statement about **one instant in time**. At the exact moment you had covered 100 m, she had covered 90 m. Same clock, two different distances.

And that is all you need. Suppose you ran the 100 m in 20 seconds. Then in those same 20 seconds she covered 90 m, so her speed is 90/20 = **4.5 m/s** against your 5 m/s. She will finish her 100 m in 100/4.5 = **22.2 seconds**.

So "beats by 10 metres" and "beats by 2.2 seconds" describe the identical race. Races questions are just this translation, done carefully.
:::

## The Sentence-To-Number Dictionary

Race problems are almost entirely a vocabulary test. Get these four phrases right and the arithmetic afterwards is trivial.

::: table What the paper says, and what it means in numbers
The phrase | What actually happens | On a 100 m race
"A beats B by 10 m" | When A finishes, B is 10 m from the line | A runs 100 while B runs 90, so speeds are 100 : 90 = 10 : 9
"A gives B a start of 10 m" | B begins 10 m ahead of the line, so B only has to run 90 | A runs 100, B runs 90, and they finish together only if speeds are 10 : 9
"A beats B by 4 seconds" | B crosses the line 4 seconds after A | If A takes 20 s, B takes 24 s
"The race ends in a dead heat" | Both cross at the same instant | Their times are equal, so distances are in the same ratio as speeds
:::

Notice the first two rows produce the same ratio from opposite situations. "Beats by 10 m" is a result; "gives a start of 10 m" is a handicap arranged in advance to make the result a tie. Papers mix them in the same question on purpose.

## Chaining Three Runners

The classic exam shape: in a 1000 m race A beats B by 50 m, and B beats C by 40 m. By how much does A beat C?

The tempting answer is 50 + 40 = 90. It is wrong, and here is exactly why.

  When A runs 1000, B runs 950
  When B runs 1000, C runs 960, so C runs 96% of whatever B runs
  So when B runs 950, C runs 950 x 0.96 = 912

A finishes at 1000 with C on 912, so A beats C by **88 m**, not 90. The 40 m gap was measured over B's full 1000 m, but in this race B only ever ran 950, so the second gap shrinks proportionally.

## The Same Idea, Bent Into A Circle

::: analogy A circular track is a straight race with no finish line
Two runners set off from the same point on a **400 m** circular track, one at 8 m/s and the other at 5 m/s, both anticlockwise.

Forget the circle for a second and watch only the *gap* between them. It opens at 8 - 5 = 3 metres every second. The moment that gap reaches 400 m, the faster runner has gained an entire lap - which on a circle means he is standing exactly on top of the slower one. First meeting: 400 / 3 = **133 1/3 seconds**.

Send them in opposite directions and the gap closes at 8 + 5 = 13 m/s instead, so they meet after 400 / 13 = **30 10/13 seconds**. Much sooner, which matches the intuition that running at each other beats chasing.
:::

But "when do they meet *anywhere*" and "when do they meet *at the starting point*" are different questions with different machinery. For the starting point, each runner must have completed a whole number of laps, so you need lap times: 400/8 = 50 s and 400/5 = 80 s, and the first shared moment is LCM(50, 80) = **400 seconds**.

::: cards Circular track, three questions worth memorising
Meet anywhere, same direction :: time = track length / (difference of speeds). Our runners: 400 / 3 = 133 1/3 s.
Meet anywhere, opposite directions :: time = track length / (sum of speeds). Our runners: 400 / 13 = 30 10/13 s.
Meet at the starting point :: LCM of the individual lap times, regardless of direction. Our runners: LCM(50, 80) = 400 s.
:::

## A Clock Is A Two-Runner Race

Here is the reframe that makes clock questions stop being their own topic. A clock face is a circular track 360 degrees around, with two runners on it.

  Minute hand: 360 degrees in 60 minutes = 6 degrees per minute
  Hour hand:   360 degrees in 720 minutes = 0.5 degrees per minute
  Relative speed = 6 - 0.5 = 5.5 degrees per minute

That single number, **5.5 degrees per minute**, answers every clock question. When do the hands coincide between 3 and 4 o'clock? At 3:00 the hour hand is at 90 degrees and the minute hand at 0, so the minute hand must make up 90 degrees at 5.5 degrees per minute:

  90 / 5.5 = 180/11 = 16 4/11 minutes

The hands overlap at 3:16 and 4/11 of a minute, not at 3:15. And since the minute hand needs 360/5.5 = 65 5/11 minutes between successive overlaps, the hands coincide only **11 times in 12 hours**, so 22 times a day.

::: mistake
The number one error is using LCM for the wrong circular-track question.

"When do two runners first meet?" is track length divided by relative speed - for our 8 and 5 m/s pair on a 400 m track, 133 1/3 seconds. "When do they first meet **at the starting point**?" is the LCM of the lap times, 400 seconds. Students who learned LCM first apply it to both and are wrong by a factor of three on the first one.

Second in line, and just as costly: adding the gaps in a chained race. A beats B by 50 and B beats C by 40 does NOT make A beat C by 90 - the answer is 88, because the second gap was measured over a distance B never actually ran in this race. If a chained-race option list contains the plain sum of the two gaps, that option is bait.
:::

::: remember
For any two things moving on a loop, only the **relative speed** matters: subtract if they run the same way, add if they run at each other.

Then three numbers worth holding in memory:
- \`5.5 degrees per minute\` is the relative speed of a clock's hands. Every coincide/right-angle/straight-line question is "how many degrees of gap, divided by 5.5".
- The hands coincide every \`65 5/11\` minutes, so **11 times in 12 hours** and **22 times a day**.
- "Beats by a distance" fixes a ratio of speeds; "beats by a time" fixes a difference of times. Write down which one the question gave you before you start.
:::

::: checkpoint
Two runners start together from the same point on a 300 m circular track and run in opposite directions at 5 m/s and 7 m/s. After how long do they meet for the first time?
- (x) 25 seconds
- ( ) 30 seconds
- ( ) 60 seconds
- ( ) 150 seconds
> Running towards each other, they close the loop at 5 + 7 = 12 m/s, so the first meeting is at 300 / 12 = **25 seconds**. The trap answer 150 seconds uses the difference 7 - 5 = 2 m/s, which is the same-direction formula, and 60 seconds is the slower runner's own lap time - a meeting point that only matters for "meet at the starting line" questions.
:::

::: revision
"A beats B by 10 m in a 100 m race" is a snapshot: when A had done 100, B had done 90, so speeds are 10 : 9 - and if A took 20 s then B takes 100/4.5 = 22.2 s, so the same race can be quoted as "beats by 2.2 seconds". "Gives a start of 10 m" produces the same ratio from the opposite direction: B runs only 90. Never add the gaps in a chained race: A beats B by 50 and B beats C by 40 in 1000 m gives **88**, not 90, because C runs 96% of the 950 that B actually ran. On a circular track only relative speed matters - **subtract** speeds for the same direction, **add** for opposite - so a 400 m track with 8 and 5 m/s gives a first meeting at 400/3 = 133 1/3 s the same way and 400/13 = 30 10/13 s in opposite directions; but meeting **at the starting point** is the LCM of the lap times, LCM(50, 80) = 400 s. A clock is that same race: minute hand 6 degrees per minute, hour hand 0.5, relative **5.5 degrees per minute**, so the hands coincide 11 times in 12 hours, and between 3 and 4 they meet at 90/5.5 = 16 4/11 minutes past three.
:::`,
    mcqs: [
      {
        id: "q1",
        text: "In a 100 m race, A beats B by 20 m. What is the ratio of A's speed to B's speed?",
        options: ["4 : 5", "5 : 4", "5 : 1", "1 : 5"],
        correctIndex: 1,
        explanation: "When A has run 100 m, B has run 80 m, and both took the same time - so speeds are in the ratio of distances: 100 : 80 = 5 : 4. Writing 4 : 5 inverts the ratio and makes the loser faster.",
      },
      {
        id: "q2",
        text: "In a 200 m race, A beats B by 20 m. If A runs at 10 m/s, what is B's speed?",
        options: ["8 m/s", "9 m/s", "9.5 m/s", "10 m/s"],
        correctIndex: 1,
        explanation: "A takes 200/10 = 20 seconds. In those same 20 seconds B covers 200 - 20 = 180 m, so B's speed is 180/20 = 9 m/s. Using 20 m over 20 s as a speed loss of 1 m/s happens to agree here, but dividing 180 by B's own finishing time instead gives the wrong 8.1 m/s.",
      },
      {
        id: "q3",
        text: "In a 100 m race, A can give B a start of 10 m and C a start of 28 m. In a 100 m race between B and C, how much of a start can B give C?",
        options: ["18 m", "20 m", "22 m", "25 m"],
        correctIndex: 1,
        explanation: "When A runs 100, B runs 90 and C runs 72. So B : C = 90 : 72, and when B runs 100 m, C covers 100 x 72/90 = 80 m. B can therefore give C a 20 m start. Subtracting the two starts directly gives the trap answer 18 m.",
      },
      {
        id: "q4",
        text: "A runs 1.5 times as fast as B. If A gives B a start of 60 m, how far from the start must the winning post be for the race to end in a dead heat?",
        options: ["120 m", "150 m", "180 m", "200 m"],
        correctIndex: 2,
        explanation: "Let the post be at distance D. A runs D while B runs D - 60, and for a dead heat their times match: D/1.5 = D - 60. So D = 1.5D - 90, giving D = 180 m. Check: A covers 180 while B covers 120, and 180/120 = 1.5.",
      },
      {
        id: "q5",
        text: "In a 500 m race the speeds of A and B are in the ratio 3 : 4, and A is given a start of 140 m. What is the result?",
        options: ["A wins by 20 m", "B wins by 20 m", "The race is a dead heat", "A wins by 60 m"],
        correctIndex: 0,
        explanation: "A only has to run 500 - 140 = 360 m. In the time A covers 360 m, B covers 360 x 4/3 = 480 m - which is 20 m short of the 500 m B must run. So A wins by 20 m. Ignoring the start and comparing 500 with 500 x 4/3 is the usual route to a wrong answer.",
      },
      {
        id: "q6",
        text: "In a 1000 m race, A beats B by 50 m and B beats C by 40 m. By how much does A beat C in the same race?",
        options: ["85 m", "88 m", "90 m", "92 m"],
        correctIndex: 1,
        explanation: "When A runs 1000, B runs 950. C covers 960 for every 1000 of B's, i.e. 96%, so when B has run 950, C has run 950 x 0.96 = 912. A beats C by 1000 - 912 = 88 m. Adding the gaps to get 90 m is the standard trap: the 40 m gap was measured over a 1000 m run that B never made in this race.",
      },
      {
        id: "q7",
        text: "Two runners start from the same point on a 400 m circular track and run in the SAME direction at 8 m/s and 5 m/s. After how long do they meet for the first time?",
        options: ["30 10/13 seconds", "50 seconds", "133 1/3 seconds", "400 seconds"],
        correctIndex: 2,
        explanation: "The gap between them grows at 8 - 5 = 3 m/s, and they meet when it reaches one full lap: 400/3 = 133 1/3 seconds. The 400 s option is the LCM of the lap times, which answers the different question of meeting at the starting point; 30 10/13 s is the opposite-direction answer.",
      },
      {
        id: "q8",
        text: "Two runners start from the same point on a 400 m circular track and run in OPPOSITE directions at 8 m/s and 5 m/s. After how long do they meet for the first time?",
        options: ["30 10/13 seconds", "50 seconds", "80 seconds", "133 1/3 seconds"],
        correctIndex: 0,
        explanation: "Running towards each other they close the 400 m loop at 8 + 5 = 13 m/s, so they meet after 400/13 = 30 10/13 seconds. Using the difference of speeds instead gives 133 1/3 s, and 50 s and 80 s are the two runners' own lap times.",
      },
      {
        id: "q9",
        text: "Two runners start together from the same point on a 400 m circular track, running in the same direction at 8 m/s and 5 m/s. After how long do they first meet again AT THE STARTING POINT?",
        options: ["133 1/3 seconds", "200 seconds", "400 seconds", "4000 seconds"],
        correctIndex: 2,
        explanation: "Both must have completed whole laps. Lap times are 400/8 = 50 s and 400/5 = 80 s, and the first shared instant is LCM(50, 80) = 400 seconds (8 laps and 5 laps respectively). The 133 1/3 s answer is when they meet somewhere on the track, which is not the starting point.",
      },
      {
        id: "q10",
        text: "Three runners start together from the same point on a 600 m circular track, running in the same direction at 3 m/s, 4 m/s and 5 m/s. After how long will all three be together at the starting point again?",
        options: ["300 seconds", "600 seconds", "1200 seconds", "3000 seconds"],
        correctIndex: 1,
        explanation: "Lap times are 600/3 = 200 s, 600/4 = 150 s and 600/5 = 120 s. LCM(200, 150, 120): 200 = 2^3 x 5^2, 150 = 2 x 3 x 5^2, 120 = 2^3 x 3 x 5, so the LCM is 2^3 x 3 x 5^2 = 600 seconds. The product-based answers 1200 and 3000 are common multiples but not the least ones.",
      },
      {
        id: "q11",
        text: "At what time between 3 and 4 o'clock do the hands of a clock coincide?",
        options: ["Exactly 3:15", "3:16 and 4/11 minutes", "3:17 and 1/11 minutes", "Exactly 3:20"],
        correctIndex: 1,
        explanation: "At 3:00 the hour hand leads by 90 degrees, and the minute hand gains at 5.5 degrees per minute, so it closes the gap in 90/5.5 = 180/11 = 16 4/11 minutes. Exactly 3:15 is the trap: by the time the minute hand reaches the 3, the hour hand has already crept forward.",
      },
      {
        id: "q12",
        text: "How many times do the two hands of a clock coincide in a period of 24 hours?",
        options: ["20", "22", "24", "44"],
        correctIndex: 1,
        explanation: "Successive coincidences are 360/5.5 = 65 5/11 minutes apart, so in 720 minutes (12 hours) there are 720 / (720/11) = 11 of them, giving 22 in a day. The answer 24 assumes one per hour, which fails because there is no separate coincidence between 11 and 12 - it happens exactly at 12.",
      },
      {
        id: "q13",
        text: "At what time between 4 and 5 o'clock are the hands of a clock at right angles for the FIRST time?",
        options: ["4:05 and 5/11 minutes", "Exactly 4:10", "4:20 and 5/11 minutes", "4:38 and 2/11 minutes"],
        correctIndex: 0,
        explanation: "At 4:00 the hour hand is at 120 degrees and the minute hand at 0, so the gap is 120 degrees. The minute hand closes it at 5.5 degrees per minute, and the gap first becomes 90 degrees after 30/5.5 = 60/11 = 5 5/11 minutes. The other right angle in this hour comes when the minute hand goes 90 degrees past, needing 210/5.5 = 38 2/11 minutes - the second occurrence, not the first.",
      },
      {
        id: "q14",
        text: "In a 100 m race, A beats B by 4 seconds. If A completes the race in 20 seconds, what is B's speed?",
        options: ["4 m/s", "4 1/6 m/s", "4.5 m/s", "5 m/s"],
        correctIndex: 1,
        explanation: "B takes 20 + 4 = 24 seconds for the full 100 m, so B's speed is 100/24 = 25/6 = 4 1/6 m/s. The 5 m/s option is A's speed, and 4.5 m/s would be right only if the question had said 'beats B by 10 metres' instead.",
      },
      {
        id: "q15",
        text: "Two cyclists start from the same point on a 1200 m circular track and ride in opposite directions at 15 m/s and 25 m/s. How many times will they meet in 10 minutes?",
        options: ["15", "18", "20", "24"],
        correctIndex: 2,
        explanation: "In opposite directions they close the loop at 15 + 25 = 40 m/s, so they meet every 1200/40 = 30 seconds. Ten minutes is 600 seconds, giving 600/30 = 20 meetings. Using the difference 10 m/s gives a meeting every 120 s and the wrong answer 5.",
      },
    ],
    timedQuiz: { timeLimitSeconds: 300, mcqIds: ["q3", "q6", "q7", "q9", "q11"] },
    problemIds: [],
    xpReward: 50, coinReward: 20,
    status: "published",
  },

  // ------------------------------------------------------------------
  // Day 15 - Wednesday 19 Aug 2026 - Permutations & Combinations
  // ------------------------------------------------------------------
  {
    date: "2026-08-19", dow: "wed", weekId: "2026-08-17", type: "lesson",
    title: "Day 15: Permutations & Combinations",
    difficulty: "Hard",
    estimatedMinutes: 20,
    concept: `## Three Shirts, Two Jeans

::: story
You have **3 shirts** and **2 pairs of jeans**. How many different outfits can you wear?

Pick a shirt: 3 ways. For each of those, pick jeans: 2 ways. So 3 x 2 = **6 outfits**. You could list them if you wanted, and you would get exactly six. Nothing clever happened - you multiplied.

Now a harder-sounding question about the same five friends: from a group of **5 friends**, in how many ways can you pick **3** to form a quiz team? And separately, in how many ways can you pick a captain, a vice-captain and a scorer from those same 5?

Those two questions have different answers, and the entire subject exists to explain why. The team is a *bag* of three people - swapping who you named first changes nothing. The three posts are *labelled* - Ravi as captain and Meera as scorer is a genuinely different outcome from the reverse.

Whenever the labels matter, there are more possibilities. That is it. That is the whole idea.
:::

## Counting Both Ways, With Real Numbers

Take those 5 friends and fill three labelled posts. Captain: 5 choices. Vice-captain: 4 left. Scorer: 3 left.

  5 x 4 x 3 = 60 labelled outcomes

Now the unlabelled team of three. Every single team of three people got counted several times in that 60 - once for each way of shuffling those same three people between the three posts, which is 3 x 2 x 1 = 6 ways. So

  60 / 6 = 10 distinct teams

Ten. You can verify that by hand with friends A, B, C, D, E: ABC, ABD, ABE, ACD, ACE, ADE, BCD, BCE, BDE, CDE. Exactly ten.

That division by 6 is the only real content in this topic. **Count as though the labels mattered, then divide out the shuffles you did not want.**

## Now The Names And The Notation

The 60 is a **permutation** - an arrangement, where order counts. The 10 is a **combination** - a selection, where it does not.

\`n!\` ("n factorial") is just n x (n-1) x ... x 1, and it counts the arrangements of n distinct things in a row. 5! = 120, and 0! is defined as 1 (there is exactly one way to arrange nothing).

  nPr = n! / (n - r)!          arrangements of r things out of n
  nCr = n! / (r! (n - r)!)     selections of r things out of n
  nPr = nCr x r!

Check them against what you already computed: 5P3 = 5!/2! = 120/2 = 60, and 5C3 = 5!/(3! 2!) = 120/12 = 10, and indeed 60 = 10 x 3!.

In practice never expand the factorials. Just write the top row and cancel: \`6C2 = (6 x 5)/(2 x 1) = 15\`, and \`10C3 = (10 x 9 x 8)/(3 x 2 x 1) = 120\`.

::: table The five patterns that cover almost every question
Situation | What to use | Worked example
Pick r out of n, order does not matter | nCr | Choose 3 of 5 friends for a team: 5C3 = 10
Fill r labelled posts from n people | nPr | Captain, vice-captain, scorer from 5: 5P3 = 60
Arrange all n letters, some repeated | n! divided by the factorial of each repeat count | BANANA has 3 A's and 2 N's: 6!/(3! 2!) = 720/12 = 60
Some items must stay together | Glue them into one block, arrange, then arrange inside the block | 5 people with 2 insisting on adjacency: 4! x 2! = 24 x 2 = 48
Seat n people around a circle | (n - 1)! | 6 at a round table: 5! = 120
:::

The circular case is worth a second. Around a round table there is no "first chair", so rotating everyone one seat to the left produces the same seating. Fixing one person in place kills exactly those n rotations, leaving (n - 1)!.

::: flow Deciding which tool to reach for, in order
Ask what one outcome physically looks like :: a team, a word, a number, a seating plan
Ask whether swapping two chosen items changes that outcome :: if yes it is a permutation, if no it is a combination
Ask whether any items are identical :: identical items mean you must divide by their repeat factorials
Ask whether any restriction applies :: together means glue into a block, never-together means total minus together
Multiply independent stages, add mutually exclusive cases :: AND multiplies, OR adds
:::

::: mistake
The number one error is reaching for **nPr when the problem does not care about order** - and it is a silent error, because the answer looks perfectly reasonable.

"Twelve people at a meeting, everyone shakes hands with everyone else once. How many handshakes?" The answer is 12C2 = (12 x 11)/2 = **66**. Using 12P2 = 132 counts each handshake twice, once from each person's side, and 132 will be sitting right there in the options.

The test is always the same: swap the two chosen items and ask whether anything about the world changed. Ravi shaking Meera's hand is the same handshake as Meera shaking Ravi's, so order does not matter and it is a combination. Ravi as captain with Meera as scorer is not the same as the reverse, so order matters and it is a permutation.

Second most common: forgetting to divide by repeats. The letters of LEADER arrange in 6!/2! = 360 ways, not 720, because the two E's are indistinguishable and every arrangement was counted twice.
:::

::: remember
**P** for **P**osition, **C** for **C**ommittee. If the outcome is a set of positions, use nPr; if it is a committee where everyone is equal, use nCr.

Three shortcuts that save real seconds:
- \`nCr = nC(n-r)\`, so 10C7 is just 10C3 = 120. Always compute with the smaller r.
- \`nC0 = nCn = 1\` and \`nC1 = n\`. There is exactly one way to choose nobody, and one way to choose everybody.
- **AND means multiply, OR means add.** "3 men AND 2 women" is 6C3 x 5C2. "At least 3 men" is the 3-men case OR the 4-men case OR the 5-men case, so you add three products.
:::

::: checkpoint
A team of 3 players must be picked from 7, and then one of those 3 named captain. In how many ways can this be done?
- ( ) 35
- (x) 105
- ( ) 210
- ( ) 343
> Two stages, so multiply: choose the team in 7C3 = 35 ways, then pick the captain from the 3 chosen in 3 ways, giving 35 x 3 = **105**. The 35 option stops after the first stage and forgets the captain. The 210 option is 7P3, which treats all three slots as distinct labels - that would be right for "captain, vice-captain and scorer", but here the two non-captains are interchangeable. And 343 is 7^3, which wrongly allows the same player to fill more than one slot.
:::

::: revision
Multiplication principle first: independent stages multiply, so 3 shirts and 2 jeans give 6 outfits. \`n!\` counts arrangements of n distinct things, with 0! = 1. When order matters use \`nPr = n!/(n-r)!\`; when it does not use \`nCr = n!/(r!(n-r)!)\`; they are linked by \`nPr = nCr x r!\`. Verify on 5 friends and 3 slots: 5P3 = 60 labelled outcomes, 5C3 = 10 teams, and 60 = 10 x 6. Compute by cancelling, never by expanding: 6C2 = 30/2 = 15. Repeated letters divide out - BANANA gives 6!/(3!2!) = 60 and LEADER gives 6!/2! = 360. Items that must sit together get glued into one block and the block's own internal arrangements multiplied back in: 5 people with 2 adjacent is 4! x 2! = 48. Circular seating loses the rotations, so it is (n-1)!, giving 120 for 6 people. The decision test never changes: swap two chosen items and ask whether the outcome changed - handshakes among 12 people are 12C2 = 66, not 132. And in the language of the question, **AND multiplies, OR adds**, which is why "at least 3 men from 7 men and 6 women, picking 5" is 7C3 x 6C2 + 7C4 x 6C1 + 7C5 = 525 + 210 + 21 = 756.
:::`,
    mcqs: [
      {
        id: "q1",
        text: "What is the value of 5! ?",
        options: ["24", "60", "120", "720"],
        correctIndex: 2,
        explanation: "5! = 5 x 4 x 3 x 2 x 1 = 120. The option 24 is 4!, and 720 is 6!.",
      },
      {
        id: "q2",
        text: "What is the value of 6C2 ?",
        options: ["12", "15", "30", "36"],
        correctIndex: 1,
        explanation: "6C2 = (6 x 5)/(2 x 1) = 15. Forgetting to divide by 2! gives 30, which is 6P2 - the count when order matters.",
      },
      {
        id: "q3",
        text: "In how many ways can the letters of the word LEADER be arranged?",
        options: ["72", "144", "360", "720"],
        correctIndex: 2,
        explanation: "LEADER has 6 letters with E appearing twice, so the count is 6!/2! = 720/2 = 360. Treating all six letters as distinct gives 720 and double-counts every arrangement, since swapping the two E's changes nothing.",
      },
      {
        id: "q4",
        text: "How many distinct arrangements can be made from the letters of the word BANANA?",
        options: ["60", "120", "360", "720"],
        correctIndex: 0,
        explanation: "Six letters with A three times and N twice: 6!/(3! x 2!) = 720/(6 x 2) = 60. Dividing by only one of the repeat counts gives 120 or 360, and 720 ignores repeats entirely.",
      },
      {
        id: "q5",
        text: "How many 3-digit numbers can be formed using the digits 1, 2, 3, 4 and 5 if no digit may be repeated?",
        options: ["10", "60", "125", "243"],
        correctIndex: 1,
        explanation: "Three ordered slots from five digits: 5 x 4 x 3 = 60, which is 5P3. The option 10 is 5C3 and ignores that 123 and 321 are different numbers; 125 is 5^3, the count when repetition is allowed.",
      },
      {
        id: "q6",
        text: "How many 3-digit numbers can be formed using the digits 1, 2, 3, 4 and 5 if digits MAY be repeated?",
        options: ["60", "100", "125", "243"],
        correctIndex: 2,
        explanation: "Each of the three positions independently has all 5 digits available: 5 x 5 x 5 = 125. The option 60 is the no-repetition count 5P3, and 243 is 3^5, which reverses the roles of the digit count and the position count.",
      },
      {
        id: "q7",
        text: "Twelve people are in a room and each shakes hands with every other person exactly once. How many handshakes take place?",
        options: ["66", "78", "132", "144"],
        correctIndex: 0,
        explanation: "A handshake is an unordered pair, so 12C2 = (12 x 11)/2 = 66. The option 132 is 12P2 and counts each handshake twice, once from each participant's point of view; 144 is 12^2 and even lets people shake their own hands.",
      },
      {
        id: "q8",
        text: "A committee of 3 men and 2 women is to be formed from 6 men and 5 women. In how many ways can this be done?",
        options: ["150", "200", "240", "1200"],
        correctIndex: 1,
        explanation: "The two selections are independent, so multiply: 6C3 x 5C2 = 20 x 10 = 200. The option 1200 comes from using 6P3 = 120 instead of 6C3, which wrongly ranks the three men.",
      },
      {
        id: "q9",
        text: "In how many ways can 5 boys and 3 girls be seated in a row so that all three girls sit together?",
        options: ["720", "2880", "4320", "40320"],
        correctIndex: 2,
        explanation: "Glue the three girls into a single block. That leaves 6 units to arrange in 6! = 720 ways, and the girls can be ordered inside the block in 3! = 6 ways: 720 x 6 = 4320. Forgetting the internal 3! gives 720, and 40320 = 8! is the unrestricted total.",
      },
      {
        id: "q10",
        text: "In how many ways can 6 people be seated around a circular table?",
        options: ["120", "720", "60", "24"],
        correctIndex: 0,
        explanation: "Circular arrangements are (n - 1)! because rotating everyone one seat gives the same seating: 5! = 120. The option 720 is 6! and counts each seating six times, once per rotation.",
      },
      {
        id: "q11",
        text: "From a group of 7 men and 6 women, 5 people are to be selected so that at least 3 are men. In how many ways can this be done?",
        options: ["525", "735", "756", "1050"],
        correctIndex: 2,
        explanation: "Split into mutually exclusive cases and add. 3 men and 2 women: 7C3 x 6C2 = 35 x 15 = 525. 4 men and 1 woman: 7C4 x 6C1 = 35 x 6 = 210. 5 men: 7C5 = 21. Total 525 + 210 + 21 = 756. Stopping at the first case gives the trap answer 525.",
      },
      {
        id: "q12",
        text: "How many arrangements of the letters of the word MATHS begin with the letter M?",
        options: ["24", "60", "96", "120"],
        correctIndex: 0,
        explanation: "Fix M in the first position; the remaining 4 distinct letters arrange in 4! = 24 ways. The option 120 is 5!, the total number of arrangements with no restriction - and exactly one fifth of those, 24, start with M.",
      },
      {
        id: "q13",
        text: "How many 4-letter sequences with no repeated letter can be formed from the 10 distinct letters of the word LOGARITHMS?",
        options: ["210", "720", "5040", "10000"],
        correctIndex: 2,
        explanation: "Order matters in a letter sequence, so 10P4 = 10 x 9 x 8 x 7 = 5040. The option 210 is 10C4 and counts each set of four letters only once instead of in all 4! = 24 orders; 10000 is 10^4, which would allow repeats.",
      },
      {
        id: "q14",
        text: "How many diagonals does a regular decagon (10 sides) have?",
        options: ["30", "35", "40", "45"],
        correctIndex: 1,
        explanation: "Every pair of vertices makes a line: 10C2 = 45. Ten of those pairs are adjacent and form the sides, not diagonals, so 45 - 10 = 35. The option 45 forgets to remove the sides.",
      },
      {
        id: "q15",
        text: "How many even 3-digit numbers can be formed from the digits 1, 2, 3, 4 and 5 without repeating any digit?",
        options: ["12", "24", "36", "48"],
        correctIndex: 1,
        explanation: "Fix the constrained position first. The units digit must be 2 or 4, giving 2 choices; the remaining two positions are filled from the other 4 digits in 4 x 3 = 12 ways. Total 2 x 12 = 24. Halving the unrestricted 60 gives 30, which is wrong because only 2 of the 5 digits are even, not half of them.",
      },
    ],
    timedQuiz: { timeLimitSeconds: 300, mcqIds: ["q4", "q7", "q9", "q11", "q15"] },
    problemIds: [],
    xpReward: 50, coinReward: 20,
    status: "published",
  },

  // ------------------------------------------------------------------
  // Day 16 - Thursday 20 Aug 2026 - Probability
  // ------------------------------------------------------------------
  {
    date: "2026-08-20", dow: "thu", weekId: "2026-08-17", type: "lesson",
    title: "Day 16: Probability",
    difficulty: "Medium",
    estimatedMinutes: 20,
    concept: `## The Bet Nobody Should Take

::: story
Two dice, one bet. Your friend says: "You win if the total is **7**. I win if the total is **2**. Fair?"

It sounds fair. There is one way to make each total, surely - and both are just numbers on the dice.

Write out what can actually happen. Each die shows 1 to 6 independently, so there are 6 x 6 = **36 equally likely outcomes**. Now count.

  Total of 7: (1,6) (2,5) (3,4) (4,3) (5,2) (6,1)  =  6 ways
  Total of 2: (1,1)                                =  1 way

You win in 6 of the 36 cases, she wins in 1. You are six times more likely to win than she is. Do take the bet.

Everything in probability comes from that one habit: **list what can happen, count what you want, divide**. The formulas later are shortcuts for the counting, never replacements for it.
:::

## The Definition, And Its Two Boundaries

For outcomes that are all equally likely,

  P(event) = number of favourable outcomes / total number of outcomes

So P(total is 7) = 6/36 = **1/6**, and P(total is 2) = **1/36**.

Two boundaries are worth stating because they are free marks and free error-checks. A probability is never below 0 and never above 1. If your working produces 7/6 or a negative number, you have double-counted or mis-set the denominator, and you know it before you look at the options.

::: table The two sample spaces every paper reuses
Setup | Total outcomes | Useful counts
One die | 6 | 3 even, 3 odd, 2 multiples of 3, 3 primes (2, 3, 5)
Two dice | 36 | 6 ways to total 7, 6 doublets, 4 ways to total 9, 2 ways to total 11
Three coins | 8 | 1 all-heads, 3 exactly-one-head, 3 exactly-two-heads, 1 all-tails
A pack of cards | 52 | 4 suits of 13, 26 red and 26 black, 12 face cards (J Q K), 4 aces, 6 red face cards
:::

Memorise the card row in particular. Half the card questions ever asked are answered by knowing that there are 12 face cards, 6 of them red.

## AND Multiplies, OR Adds

Two rules generate the rest of the topic.

For **OR**, add the probabilities and then subtract the overlap, because anything counted in both got counted twice:

  P(A or B) = P(A) + P(B) - P(A and B)

Two dice, total 7 or total 11: those cannot happen together, so the overlap is 0 and the answer is 6/36 + 2/36 = 8/36 = **2/9**.

For **AND** with independent events, multiply:

  P(A and B) = P(A) x P(B)

But independence is a real condition, not a formality. Draw two balls from a bag of 4 red and 6 blue *without replacement* and the second draw is not independent of the first: P(both red) = (4/10) x (3/9) = 12/90 = **2/15**, not (4/10) x (4/10) = 4/25. The 3/9 is the whole point - one red is gone and the bag is smaller.

## "At Least One" Is A Trap With A Known Escape

::: analogy Count the way out, not the ways in
Toss three coins. What is the probability of **at least one head**?

The slow route is to add up exactly-one-head, exactly-two-heads and exactly-three-heads: 3/8 + 3/8 + 1/8 = 7/8. Three counts, three chances to slip.

The fast route: the only way to fail is **all three tails**, and that is 1 outcome out of 8. So

  P(at least one head) = 1 - P(no heads) = 1 - 1/8 = 7/8

Same answer, one count instead of three. Whenever a question says "at least one", the event you should actually compute is its opposite - the **complementary event** - and then subtract from 1.
:::

::: mistake
The number one error is treating a draw **without replacement** as if it were independent.

A bag holds 5 red and 3 green balls and you draw two. P(both red) is (5/8) x (4/7) = 20/56 = **5/14**, because after the first red there are only 4 reds among 7 remaining balls. Writing (5/8) x (5/8) = 25/64 is the classic slip, and 25/64 will be in the options because it is so close to 5/14 that nobody notices.

The equivalent counting route is a good cross-check: 5C2 / 8C2 = 10/28 = 5/14. Same number, so both methods agree.

The other reliable error is adding probabilities that overlap. Tickets numbered 1 to 25, P(multiple of 3 or of 5): the multiples of 3 give 8 and the multiples of 5 give 5, but 15 is in both lists, so the count is 8 + 5 - 1 = 12, giving 12/25 and not 13/25.
:::

::: remember
**AND multiplies, OR adds** - and OR always subtracts the overlap unless the events genuinely cannot co-occur.

Then the two habits that save the most marks:
- "**At least one**" means \`1 - P(none)\`. Almost always fewer cases to count.
- Before multiplying, ask "with replacement or without?" Without replacement, the second fraction's numerator AND denominator both drop.

And one sanity rail: every answer must land between 0 and 1. A probability of 7/6 is not a hard question, it is an arithmetic error you can catch yourself.
:::

::: checkpoint
A bag contains 4 red and 6 blue balls. Two balls are drawn at random, one after the other, without replacement. What is the probability that both are red?
- (x) 2/15
- ( ) 4/25
- ( ) 1/5
- ( ) 6/25
> First draw: 4 reds out of 10 balls. Second draw: only 3 reds left among 9 balls. So P = (4/10) x (3/9) = 12/90 = **2/15**. The counting route agrees: 4C2 / 10C2 = 6/45 = 2/15. The trap answer 4/25 is (4/10) x (4/10), which silently puts the first ball back in the bag - and it is deliberately close enough to 2/15 (0.16 against 0.133) to look right.
:::

::: revision
Probability is counting with a division at the end: \`P = favourable / total\`, valid whenever the listed outcomes are equally likely, and always between 0 and 1. Know the standard sample spaces cold: one die has 6 outcomes, two dice have 36 (6 ways to make 7, 2 ways to make 11, 6 doublets), three coins have 8, and a pack has 52 cards with 26 red, 12 face cards of which 6 are red, and 4 aces. For **OR** add and subtract the overlap: \`P(A or B) = P(A) + P(B) - P(A and B)\`, so tickets 1 to 25 give 8 + 5 - 1 = 12 favourable for "multiple of 3 or 5", i.e. 12/25. For **AND** multiply, but only after checking independence - drawing two balls from 4 red and 6 blue without replacement gives (4/10) x (3/9) = 2/15, not (4/10)^2 = 4/25, and the combination form 4C2/10C2 = 6/45 confirms it. Whenever you read "**at least one**", compute the complement instead: three coins give P(at least one head) = 1 - 1/8 = 7/8 in one step rather than three. And never average or add probabilities of overlapping events without removing the double count.
:::`,
    mcqs: [
      {
        id: "q1",
        text: "A single fair die is rolled once. What is the probability of getting an even number?",
        options: ["1/6", "1/3", "1/2", "2/3"],
        correctIndex: 2,
        explanation: "The favourable outcomes are 2, 4 and 6, so P = 3/6 = 1/2. The option 1/3 counts only the two multiples of 3, and 1/6 counts a single face.",
      },
      {
        id: "q2",
        text: "Two fair coins are tossed together. What is the probability of getting at least one head?",
        options: ["1/4", "1/2", "3/4", "1"],
        correctIndex: 2,
        explanation: "The sample space is HH, HT, TH, TT - four outcomes, of which three contain a head, so P = 3/4. Faster: 1 - P(no head) = 1 - 1/4 = 3/4. The option 1/2 counts only 'exactly one head' (HT and TH).",
      },
      {
        id: "q3",
        text: "Two fair dice are thrown together. What is the probability that the sum of the numbers shown is 7?",
        options: ["1/12", "1/9", "1/6", "5/36"],
        correctIndex: 2,
        explanation: "There are 36 equally likely outcomes. The sum is 7 for (1,6), (2,5), (3,4), (4,3), (5,2) and (6,1) - six ways - so P = 6/36 = 1/6. Counting only the three unordered pairs gives the trap answer 1/12.",
      },
      {
        id: "q4",
        text: "Two fair dice are thrown together. What is the probability that the sum of the numbers shown is 9?",
        options: ["1/12", "1/9", "1/6", "5/36"],
        correctIndex: 1,
        explanation: "The sum is 9 for (3,6), (4,5), (5,4) and (6,3) - four of the 36 outcomes - so P = 4/36 = 1/9. Forgetting that (3,6) and (6,3) are different outcomes gives 2/36 = 1/18.",
      },
      {
        id: "q5",
        text: "One card is drawn at random from a well-shuffled pack of 52 cards. What is the probability that it is a king or a queen?",
        options: ["1/13", "2/13", "4/13", "1/26"],
        correctIndex: 1,
        explanation: "There are 4 kings and 4 queens, and no card is both, so the two events are mutually exclusive: P = 4/52 + 4/52 = 8/52 = 2/13. The option 1/13 is the probability of a king alone.",
      },
      {
        id: "q6",
        text: "One card is drawn at random from a pack of 52. What is the probability that it is a red face card?",
        options: ["3/26", "3/13", "1/13", "6/13"],
        correctIndex: 0,
        explanation: "The face cards are jack, queen and king in each suit, so 12 in all, and half of them are red: 6 favourable cards out of 52, giving 6/52 = 3/26. Using all 12 face cards gives 12/52 = 3/13, which forgets the word 'red'.",
      },
      {
        id: "q7",
        text: "Three fair coins are tossed together. What is the probability of getting exactly two heads?",
        options: ["1/8", "1/4", "3/8", "1/2"],
        correctIndex: 2,
        explanation: "Eight equally likely outcomes; exactly two heads happens as HHT, HTH and THH, so P = 3/8. The option 1/8 is the probability of all three heads.",
      },
      {
        id: "q8",
        text: "Three fair coins are tossed together. What is the probability of getting at least one tail?",
        options: ["1/8", "1/2", "3/4", "7/8"],
        correctIndex: 3,
        explanation: "Use the complement: the only way to fail is HHH, which is 1 of the 8 outcomes, so P = 1 - 1/8 = 7/8. Adding the exactly-one, exactly-two and exactly-three cases gives 3/8 + 3/8 + 1/8 = 7/8 as well, just with three chances to slip.",
      },
      {
        id: "q9",
        text: "A bag contains 5 red and 3 green balls. Two balls are drawn at random without replacement. What is the probability that both are red?",
        options: ["5/14", "25/64", "15/56", "3/28"],
        correctIndex: 0,
        explanation: "P = (5/8) x (4/7) = 20/56 = 5/14, because after one red is taken only 4 reds remain among 7 balls. The counting route agrees: 5C2/8C2 = 10/28 = 5/14. The option 25/64 treats the draws as independent (with replacement), and 3/28 = 3C2/8C2 is the probability that both are green.",
      },
      {
        id: "q10",
        text: "A bag contains 4 white and 6 black balls. Two balls are drawn at random. What is the probability that one is white and the other black?",
        options: ["8/15", "12/25", "2/5", "4/15"],
        correctIndex: 0,
        explanation: "Favourable selections: 4C1 x 6C1 = 24. Total selections: 10C2 = 45. So P = 24/45 = 8/15. The option 12/25 comes from (4/10) x (6/10) x 2, which assumes replacement, and 4/15 forgets that white-then-black and black-then-white are both acceptable.",
      },
      {
        id: "q11",
        text: "The probability of rain tomorrow is 0.3 and the probability that it will be windy is 0.4. The two events are independent. What is the probability that it both rains and is windy?",
        options: ["0.07", "0.12", "0.58", "0.70"],
        correctIndex: 1,
        explanation: "For independent events AND means multiply: 0.3 x 0.4 = 0.12. The option 0.70 adds them, which answers 'rain or wind' only if the events were mutually exclusive - and 0.58 is the correct 'rain or wind' figure, 0.3 + 0.4 - 0.12.",
      },
      {
        id: "q12",
        text: "If P(A) = 1/3 and P(B) = 1/4 and the events A and B are mutually exclusive, what is P(A or B)?",
        options: ["1/12", "7/12", "1/2", "2/3"],
        correctIndex: 1,
        explanation: "Mutually exclusive means P(A and B) = 0, so P(A or B) = 1/3 + 1/4 = 7/12. The option 1/12 multiplies instead of adding, which would be the answer for 'A and B' if the events were independent - and they cannot be both mutually exclusive and independent here.",
      },
      {
        id: "q13",
        text: "In a class of 40 students, 25 play cricket, 20 play football and 10 play both. If a student is picked at random, what is the probability that the student plays neither game?",
        options: ["1/8", "1/4", "3/8", "7/8"],
        correctIndex: 0,
        explanation: "Students playing at least one game: 25 + 20 - 10 = 35, so 5 play neither and P = 5/40 = 1/8. Adding 25 + 20 = 45 without removing the 10 double-counted students exceeds the class size, which is the built-in signal that the overlap must be subtracted.",
      },
      {
        id: "q14",
        text: "A number is chosen at random from the first 20 natural numbers. What is the probability that it is a prime number?",
        options: ["2/5", "9/20", "1/2", "7/20"],
        correctIndex: 0,
        explanation: "The primes up to 20 are 2, 3, 5, 7, 11, 13, 17 and 19 - eight of them - so P = 8/20 = 2/5. Counting 1 as prime gives 9/20, and forgetting that 2 is prime gives 7/20.",
      },
      {
        id: "q15",
        text: "Tickets numbered 1 to 25 are mixed up and one is drawn at random. What is the probability that the number on it is a multiple of 3 or of 5?",
        options: ["12/25", "13/25", "2/5", "9/25"],
        correctIndex: 0,
        explanation: "Multiples of 3 up to 25: 8 of them. Multiples of 5: 5 of them. The number 15 is in both lists, so the favourable count is 8 + 5 - 1 = 12 and P = 12/25. Forgetting to remove the overlap gives the trap answer 13/25.",
      },
    ],
    timedQuiz: { timeLimitSeconds: 300, mcqIds: ["q4", "q8", "q9", "q13", "q15"] },
    problemIds: [],
    xpReward: 50, coinReward: 20,
    status: "published",
  },

  // ------------------------------------------------------------------
  // Day 17 - Friday 21 Aug 2026 - DI: Tables & Bar Graphs
  // ------------------------------------------------------------------
  {
    date: "2026-08-21", dow: "fri", weekId: "2026-08-17", type: "lesson",
    title: "Day 17: Data Interpretation - Tables & Bar Graphs",
    difficulty: "Medium",
    estimatedMinutes: 20,
    concept: `## Two Students, One Table

::: story
Two students get the same page: a table of a software company's quarterly revenue, five questions under it, four minutes on the clock.

One answers all five. The other answers two and guesses three.

They are equally good at arithmetic. The difference is that the first one spent her opening twenty seconds *not answering anything*. She read the title, checked the units (crore, not lakh), and pencilled the four column totals into the margin. Three of the five questions then needed exactly those totals, and she already had them.

Data Interpretation is not a maths topic. It is a **reading topic with arithmetic attached**, and the marks go to whoever sets the table up before racing at it.
:::

## The Table We Will Use All Day

::: table ZenithSoft quarterly revenue, FY 2025-26, in Rs crore
Business unit | Q1 | Q2 | Q3 | Q4 | Year
Cloud | 120 | 150 | 180 | 210 | 660
Devices | 80 | 100 | 90 | 130 | 400
Services | 200 | 220 | 260 | 240 | 920
Training | 30 | 40 | 50 | 60 | 180
All units | 430 | 510 | 580 | 640 | 2160
:::

Everything today reads off this one table - the checkpoint below and all fifteen practice questions. In a real paper the same numbers usually arrive as four grouped bars per quarter instead of rows, with a y-axis ruled every 50 crore. The picture changes; nothing you do with the numbers does.

Two things to notice before any question arrives. Services is the biggest unit but it is the only one that *fell* in Q4. And Training is the smallest unit in every single quarter, which does not stop it being the fastest-growing one - hold that thought.

## Percentage Change: The Word "From" Names Your Denominator

Cloud went from 120 in Q1 to 150 in Q2. What is the percentage increase?

  change     = 150 - 120 = 30
  percentage = 30 / 120 x 100 = 25%

The base is the value you moved **from**. Run it the other way to feel the difference: Services fell from 260 in Q3 to 240 in Q4, so the decline is 20/260 = **7.7%**. Divide by 240 instead and you get 8.3%, which is the answer to "what percentage of the new figure was lost" - a question nobody asked.

## Share Of Total: But Which Total?

Services earned 260 crore in Q3. What share is that? There are three honest answers, and the question chooses between them with a single phrase.

  Of that quarter's revenue:   260 / 580  = 44.8%
  Of Services' own year:       260 / 920  = 28.3%
  Of the company's whole year: 260 / 2160 = 12.0%

All three numbers are real and all three will appear in options lists. Find the words "of the quarter's total" or "of the annual total" before you divide, not after.

::: flow The twenty-second setup, before you answer anything
Read the title and the units :: crore or lakh, counts or percentages, thousands or absolutes
Read the row and column labels :: know which axis is time and which is category
Write down the totals you will reuse :: here that is 430, 510, 580 and 640, plus the 2160 grand total
Scan for the one odd movement :: Services dipping in Q4 is what a question will be built on
Only now read question one :: with the totals already on paper, most questions become a single division
:::

::: mistake
The number one DI mistake is dividing by the **new** value instead of the old one.

Services fell from 260 to 240. That is a decline of 20/260 = **7.7%**, not 20/240 = 8.3%. Both look entirely reasonable in a list of four options, and papers include both on purpose.

Close behind it: answering "which unit grew the most" with the wrong kind of "most". From Q1 to Q4, Cloud grew by 90 crore while Training grew by only 30 - so Cloud wins on size. But in percentage terms Cloud grew 90/120 = 75% while Training grew 30/30 = **100%** - so Training wins on rate. Largest absolute growth and largest percentage growth are two different questions, and this table is built so they disagree. Read which one you were asked.
:::

::: remember
\`change / ORIGINAL x 100\` - and the word "**from**" in the question names your original.

Three habits that pay for themselves in every DI set:
- A **percentage point** is not a **percent**. A share going from 40% to 43% has risen by 3 percentage points, but by 7.5% of itself.
- On a bar chart, read to the nearest half-gridline and no finer. If two options differ by 0.2%, you have misread the question, not the bar.
- Approximate first, then check. 210/640 is "a bit under a third", which already eliminates any option below 30% or above 35% before you divide properly.
:::

::: checkpoint
Services earned 260 crore in Q3. Roughly what share of that quarter's total revenue is that?
- ( ) About 12%
- ( ) About 28%
- (x) About 45%
- ( ) About 55%
> Q3's total across all units is 580, so 260/580 = 0.448, which is about **45%**. The other options are not random: 12% divides by the annual grand total 2160, and 28% divides by Services' own annual 920. Both are genuine numbers from this table, and both answer a question that was not asked. Identify the denominator the question named before you divide.
:::

::: revision
DI is reading speed with arithmetic attached, so spend the first twenty seconds on the title, the units, the labels and the totals you will reuse - here the quarter totals 430, 510, 580, 640 and the grand total 2160. Percentage change is always \`change / ORIGINAL x 100\`, and the word "from" names the original: Cloud rising 120 to 150 is 30/120 = **25%**, while Services falling 260 to 240 is 20/260 = **7.7%** and never 20/240. Before computing any share, find which total the question named - Services' 260 in Q3 is 44.8% of that quarter, 28.3% of Services' year and 12.0% of the company's year, and all three will be in the options. Keep absolute growth and percentage growth strictly apart: from Q1 to Q4 Cloud gains the most crore (90, i.e. 75%) but Training gains the most rate (30, i.e. **100%**). A percentage point is not a percent. And approximate before you divide - reading 210 out of 640 as "a bit under a third" gets you to the right option faster than long division does.
:::`,
    mcqs: [
      {
        id: "q1",
        text: "What was Cloud's total revenue for the full financial year, in Rs crore?",
        options: ["620", "640", "660", "680"],
        correctIndex: 2,
        explanation: "Add across Cloud's row: 120 + 150 + 180 + 210 = 660 crore. The option 640 is the company's Q4 total, sitting in the bottom row - an easy row-versus-column mix-up.",
      },
      {
        id: "q2",
        text: "Which business unit earned the most revenue in Q3?",
        options: ["Cloud", "Devices", "Services", "Training"],
        correctIndex: 2,
        explanation: "The Q3 column reads Cloud 180, Devices 90, Services 260 and Training 50, so Services is highest. Cloud is the fastest-rising unit across the year, which is why it is the tempting wrong pick.",
      },
      {
        id: "q3",
        text: "By what percentage did Cloud's revenue increase from Q1 to Q2?",
        options: ["20%", "25%", "30%", "33.3%"],
        correctIndex: 1,
        explanation: "The change is 150 - 120 = 30 and the base is the Q1 figure of 120, so 30/120 x 100 = 25%. Dividing by the new value 150 gives the trap answer 20%.",
      },
      {
        id: "q4",
        text: "Cloud's Q4 revenue is approximately what percentage of the company's total Q4 revenue?",
        options: ["31.8%", "32.8%", "33.9%", "35.0%"],
        correctIndex: 1,
        explanation: "Q4's all-units total is 640, so 210/640 = 0.328, i.e. 32.8%. The trap answer 31.8% divides by Cloud's own annual total of 660 instead of the quarter's total.",
      },
      {
        id: "q5",
        text: "Which unit recorded the largest PERCENTAGE growth from Q1 to Q4?",
        options: ["Cloud", "Devices", "Services", "Training"],
        correctIndex: 3,
        explanation: "Compute each rate: Cloud 90/120 = 75%, Devices 50/80 = 62.5%, Services 40/200 = 20%, Training 30/30 = 100%. Training wins. Cloud is the trap because it has by far the largest absolute increase (90 crore against Training's 30), but that is a different question.",
      },
      {
        id: "q6",
        text: "By what percentage did the company's total revenue grow from Q1 to Q4?",
        options: ["32.8%", "48.8%", "51.2%", "67.7%"],
        correctIndex: 1,
        explanation: "Totals go from 430 to 640, a change of 210, so 210/430 x 100 = 48.8%. Dividing by the Q4 total instead gives 210/640 = 32.8%, and 51.2% is its complement - both are there to catch a reversed base.",
      },
      {
        id: "q7",
        text: "What was Services' average quarterly revenue for the year, in Rs crore?",
        options: ["220", "230", "240", "245"],
        correctIndex: 1,
        explanation: "Services totalled 920 across four quarters, so the average is 920/4 = 230 crore. The options 220 and 240 are two of the four individual quarterly figures, not the average.",
      },
      {
        id: "q8",
        text: "Counting all four units, in how many of the twelve quarter-on-quarter changes did revenue actually DECLINE?",
        options: ["1", "2", "3", "4"],
        correctIndex: 1,
        explanation: "Each unit has three consecutive-quarter changes, so twelve in all. Cloud and Training rise every time. Devices falls once (100 in Q2 to 90 in Q3) and Services falls once (260 in Q3 to 240 in Q4). That is 2 declines. Answering 1 usually means spotting the Services dip and stopping there.",
      },
      {
        id: "q9",
        text: "Services' Q3 revenue is approximately what percentage of the company's total revenue for the whole year?",
        options: ["10.4%", "12.0%", "13.5%", "28.3%"],
        correctIndex: 1,
        explanation: "The annual grand total is 2160, so 260/2160 = 0.120, i.e. 12.0%. The trap answer 28.3% divides by Services' own annual total of 920, which answers a different question about the same two rows.",
      },
      {
        id: "q10",
        text: "Cloud's annual revenue exceeds Devices' annual revenue by what percentage?",
        options: ["39.4%", "60%", "65%", "165%"],
        correctIndex: 2,
        explanation: "The excess is 660 - 400 = 260, and 'exceeds Devices' makes Devices the base: 260/400 x 100 = 65%. The option 39.4% uses 660 as the base, and 165% is the ratio 660/400 rather than the excess.",
      },
      {
        id: "q11",
        text: "If Cloud's revenue grows in the next quarter by the same percentage as it did from Q3 to Q4, what will that revenue be, in Rs crore?",
        options: ["235", "240", "245", "250"],
        correctIndex: 2,
        explanation: "From Q3 to Q4, Cloud went 180 to 210, a rise of 30/180 = 16.67%, i.e. a factor of 7/6. Applying it again: 210 x 7/6 = 245 crore. Adding the same absolute 30 instead of the same percentage gives the trap answer 240.",
      },
      {
        id: "q12",
        text: "What is the ratio of Services' annual revenue to Training's annual revenue?",
        options: ["23 : 9", "46 : 9", "5 : 1", "92 : 9"],
        correctIndex: 1,
        explanation: "920 : 180, and dividing both by their HCF of 20 gives 46 : 9 (which is 5.11, matching 920/180). The option 5 : 1 is the rounded-off version and is not exact.",
      },
      {
        id: "q13",
        text: "In which quarter was the gap between the highest-earning and the lowest-earning unit the largest?",
        options: ["Q1", "Q2", "Q3", "Q4"],
        correctIndex: 2,
        explanation: "Gaps are Q1: 200 - 30 = 170, Q2: 220 - 40 = 180, Q3: 260 - 50 = 210, Q4: 240 - 60 = 180. Q3's 210 is the largest. Q4 is the tempting answer because its total revenue is the highest, but its spread is not.",
      },
      {
        id: "q14",
        text: "Devices' annual revenue is approximately what percentage of the company's annual revenue?",
        options: ["16.7%", "18.5%", "20.0%", "22.2%"],
        correctIndex: 1,
        explanation: "400/2160 = 0.1852, i.e. about 18.5%. The option 20.0% comes from rounding 2160 down to 2000, which is exactly the kind of shortcut that costs a mark when two options sit this close together.",
      },
      {
        id: "q15",
        text: "Services' revenue fell from Q3 to Q4. What was the percentage decline?",
        options: ["7.7%", "8.3%", "9.1%", "20%"],
        correctIndex: 0,
        explanation: "The fall is 260 - 240 = 20 and the base is the earlier figure 260, so 20/260 x 100 = 7.7%. Dividing by 240 gives the trap answer 8.3%, and 20% mistakes the absolute drop of 20 crore for a percentage.",
      },
    ],
    timedQuiz: { timeLimitSeconds: 300, mcqIds: ["q4", "q5", "q8", "q11", "q15"] },
    problemIds: [],
    xpReward: 50, coinReward: 20,
    status: "published",
  },

  // ------------------------------------------------------------------
  // Day 18 - Saturday 22 Aug 2026 - DI: Pie Charts & Line Graphs
  // ------------------------------------------------------------------
  {
    date: "2026-08-22", dow: "sat", weekId: "2026-08-17", type: "lesson",
    title: "Day 18: Data Interpretation - Pie Charts & Line Graphs",
    difficulty: "Medium",
    estimatedMinutes: 20,
    concept: `## A Circle Instead Of A Column

::: story
Your class runs a favourite-subject survey, and instead of writing out the counts someone draws a circle and slices it into wedges. Maths gets a clean quarter of the circle. Nobody has written a single number anywhere.

You still know exactly what happened. A quarter of the circle is a quarter of the class, and if there are 40 students in the class then Maths got **10 votes**.

That is the one thing to internalise about a pie chart: it never tells you an amount. It tells you a **share**, and it quietly hands you the job of finding the total - which is always printed somewhere in the question stem, never on the chart. Miss the total and the chart is unreadable. Find it and every slice turns into a headcount.
:::

## Degrees, Percent, People

A full circle is 360 degrees and stands for 100% of something, so the conversion is fixed forever:

  100% = 360 degrees
  1%   = 3.6 degrees
  1 degree = 1/3.6 % = 0.2778%

Trace it once on real data. The CSE slice of our chart measures **108 degrees**, and the college has **3,600 students**.

  108 / 360   = 0.30, so CSE is 30% of the college
  0.30 x 3600 = 1,080 students in CSE

Or in one step, skipping percentages entirely: (108/360) x 3600 = 1,080. Both routes, same answer - and the one-step version is the one to use under time pressure.

::: table Pie chart: how Sunrise Institute's 3,600 students split across six branches
Branch | Slice | Share | Students
CSE | 108 degrees | 30% | 1080
ECE | 72 degrees | 20% | 720
Mechanical | 54 degrees | 15% | 540
Civil | 45 degrees | 12.5% | 450
EEE | 45 degrees | 12.5% | 450
IT | 36 degrees | 10% | 360
:::

Always check that the chart closes: 108 + 72 + 54 + 45 + 45 + 36 = 360 degrees, and 1080 + 720 + 540 + 450 + 450 + 360 = 3,600 students. Ten seconds spent here catches a mis-read slice before it poisons four answers.

## The Line Graph On The Same Page

Placement papers rarely give you one chart. They give you two that only work together. Alongside that pie sits a line graph plotting, for each branch, the **percentage of its students who got placed**.

::: table Line graph: placement rate per branch, and the headcount it implies
Branch | Placement rate | Students placed
CSE | 90% | 972
ECE | 75% | 540
Mechanical | 60% | 324
Civil | 40% | 180
EEE | 50% | 225
IT | 80% | 288
:::

Every number in the third column came from multiplying the pie by the line: 1080 x 0.90 = 972, 720 x 0.75 = 540, 540 x 0.60 = 324, 450 x 0.40 = 180, 450 x 0.50 = 225, 360 x 0.80 = 288. Total placed: **2,529 of 3,600**.

Now the thing a line graph is actually good for, and the thing it is dangerous for. Between Civil (40%) and IT (80%) the line climbs steeply, and steepness genuinely tells you the rate doubled. But steepness says nothing about people: those two branches differ by 40 percentage points of *rate* and only 108 students of *outcome* (288 against 180), because IT is a small branch. A line graph shows you shape; only the pie can turn shape into size.

::: cards Three moves that answer most pie-plus-line questions
Slice to headcount :: divide the degrees by 360 (or read the percent) and multiply by the total. A 45 degree slice of 3,600 is 450 students.
Headcount to outcome :: multiply the branch's headcount by its rate off the line graph. Civil: 450 x 40% = 180 placed.
Outcome back to an overall rate :: add the outcomes, then divide by the grand total. 2,529 / 3,600 = 70.25% placed overall.
:::

::: mistake
The number one error on a pie-plus-line set is **averaging the percentages**.

Asked for the college's overall placement rate, it is desperately tempting to average the six line-graph values: (90 + 75 + 60 + 40 + 50 + 80)/6 = 395/6 = **65.83%**. That number is wrong, and it will be in the options.

It is wrong because the branches are not the same size. CSE's 90% is carrying 1,080 students of weight while IT's 80% carries only 360. The correct route is to convert every rate into a headcount first, then divide once at the end: 972 + 540 + 324 + 180 + 225 + 288 = 2,529, and 2,529/3,600 = **70.25%**.

The rule generalises well beyond DI: **percentages can only be averaged when the groups behind them are equal in size**, and in a pie chart they essentially never are.
:::

::: remember
\`1% = 3.6 degrees\`. Divide degrees by 3.6 to get percent, multiply percent by 3.6 to get degrees.

Four slice sizes worth recognising instantly, because papers reuse them:
- 90 degrees = 25%, 72 degrees = 20%, 45 degrees = 12.5%, 36 degrees = 10%
- And 18 degrees = 5%, which is the smallest slice most charts bother to draw

Then the discipline that stops most errors: a pie chart alone can never answer a "how many" question. Find the total in the question stem first, and write it at the top of your rough work.
:::

::: checkpoint
The Civil slice measures 45 degrees, and the line graph puts Civil's placement rate at 40%. How many Civil students were placed?
- ( ) 144
- (x) 180
- ( ) 200
- ( ) 450
> Two steps. First the slice to a headcount: (45/360) x 3600 = 450 Civil students. Then the rate: 40% of 450 = **180 placed**. The 450 option stops after step one and reports the whole branch as placed. The 144 option applies 40% to 360, which is IT's headcount rather than Civil's - a very easy slip when two rows of a table look alike.
:::

::: revision
A pie chart gives shares, never amounts, so the first move is always to find the total in the question stem. The conversion is fixed: 360 degrees is 100%, so \`1% = 3.6 degrees\`, and a slice becomes a headcount in one step as \`(degrees/360) x total\` - CSE's 108 degrees of 3,600 students is 1,080. Verify the chart closes (degrees to 360, headcounts to the total) before answering anything. When a line graph shares the page, it usually supplies a **rate** per category, and the pie supplies the **size**: multiply them to get outcomes, as Civil's 450 students at 40% gives 180 placed. Steepness on a line only describes a change in rate, never a change in headcount - Civil to IT doubles the rate but moves only 108 students. And the one error that decides these sets: **never average the percentages**. Averaging the six placement rates gives 65.83%, while the true overall rate is 2,529/3,600 = **70.25%**, because CSE's 90% carries 1,080 students of weight and IT's 80% carries only 360. Percentages average only when the groups behind them are equal in size.
:::`,
    mcqs: [
      {
        id: "q1",
        text: "How many students of Sunrise Institute are enrolled in CSE?",
        options: ["900", "1080", "1200", "1260"],
        correctIndex: 1,
        explanation: "CSE's slice is 108 degrees, so its share is 108/360 = 30%, and 30% of 3,600 is 1,080 students. The option 1,200 comes from rounding the share to one third.",
      },
      {
        id: "q2",
        text: "What is the central angle of the slice representing Mechanical?",
        options: ["45 degrees", "54 degrees", "60 degrees", "72 degrees"],
        correctIndex: 1,
        explanation: "Mechanical is 15% of the students, and 1% is 3.6 degrees, so the slice is 15 x 3.6 = 54 degrees. The option 45 degrees is the Civil and EEE slice size (12.5%), and 72 degrees is ECE's (20%).",
      },
      {
        id: "q3",
        text: "One branch's slice measures 45 degrees. How many students does that slice represent?",
        options: ["360", "400", "450", "500"],
        correctIndex: 2,
        explanation: "45/360 = 12.5% of the college, and 12.5% of 3,600 is 450 students. The option 360 is IT's headcount (a 36 degree slice), which is easy to grab by mistake since 45 and 36 look similar on a chart.",
      },
      {
        id: "q4",
        text: "Which two branches together account for exactly half of all the students?",
        options: ["CSE and ECE", "CSE and Mechanical", "ECE and Mechanical", "Mechanical and Civil"],
        correctIndex: 0,
        explanation: "CSE is 30% and ECE is 20%, together exactly 50% (1,080 + 720 = 1,800, which is half of 3,600). The other pairs give 45%, 35% and 27.5% respectively.",
      },
      {
        id: "q5",
        text: "How many ECE students were placed?",
        options: ["480", "504", "540", "576"],
        correctIndex: 2,
        explanation: "ECE has 20% of 3,600 = 720 students, and the line graph puts its placement rate at 75%: 720 x 0.75 = 540 placed. Applying 75% to CSE's 1,080 instead would give 810, and applying ECE's rate to Mechanical's 540 gives 405 - both are the standard row-slip errors here.",
      },
      {
        id: "q6",
        text: "Which branch placed the highest NUMBER of students?",
        options: ["CSE", "ECE", "IT", "Mechanical"],
        correctIndex: 0,
        explanation: "Placed counts are CSE 972, ECE 540, Mechanical 324 and IT 288, so CSE is highest on both count and rate. IT is the trap for anyone who confuses 'highest number' with 'second-highest rate' - IT's 80% rate applies to only 360 students.",
      },
      {
        id: "q7",
        text: "Which branch has the lowest placement rate?",
        options: ["Civil", "EEE", "Mechanical", "IT"],
        correctIndex: 0,
        explanation: "The line graph reads CSE 90%, ECE 75%, Mechanical 60%, Civil 40%, EEE 50% and IT 80%. Civil's 40% is the lowest. Civil and EEE have identical slice sizes (450 students each), so a reader who confuses the pie with the line can easily pick EEE.",
      },
      {
        id: "q8",
        text: "How many Mechanical students were NOT placed?",
        options: ["180", "216", "240", "324"],
        correctIndex: 1,
        explanation: "Mechanical has 15% of 3,600 = 540 students at a 60% placement rate, so 40% went unplaced: 540 x 0.40 = 216. The option 324 is the number who WERE placed, and 180 is Civil's placed count.",
      },
      {
        id: "q9",
        text: "What is the total number of students placed across all six branches?",
        options: ["2430", "2529", "2610", "2700"],
        correctIndex: 1,
        explanation: "Multiply each branch's headcount by its rate and add: 972 + 540 + 324 + 180 + 225 + 288 = 2,529. The option 2,370 would come from averaging rates; 2,700 is 75% of 3,600, a plausible-looking round guess.",
      },
      {
        id: "q10",
        text: "What is the overall placement percentage of the institute?",
        options: ["65.83%", "68.40%", "70.25%", "73.00%"],
        correctIndex: 2,
        explanation: "Total placed is 2,529 out of 3,600, giving 2529/3600 = 70.25%. The trap answer 65.83% averages the six branch rates, (90 + 75 + 60 + 40 + 50 + 80)/6 = 395/6, which is invalid because the branches differ in size - CSE's 90% carries 1,080 students of weight while IT's 80% carries only 360.",
      },
      {
        id: "q11",
        text: "How many more students were placed from IT than from EEE?",
        options: ["45", "63", "72", "108"],
        correctIndex: 1,
        explanation: "IT: 360 students at 80% = 288 placed. EEE: 450 students at 50% = 225 placed. The difference is 288 - 225 = 63. Comparing the rates instead (80% against 50%) gives 30 percentage points, which is not a number of students at all.",
      },
      {
        id: "q12",
        text: "The number of students placed from Civil is approximately what percentage of the number placed from CSE?",
        options: ["15.6%", "18.5%", "20.0%", "44.4%"],
        correctIndex: 1,
        explanation: "Civil placed 180 and CSE placed 972, so 180/972 = 0.1852, about 18.5%. The trap answer 44.4% divides the rates (40/90) instead of the headcounts, which ignores that CSE has more than twice as many students as Civil.",
      },
      {
        id: "q13",
        text: "If CSE's placement rate had been 100% instead of 90%, by how much would the institute's overall placement percentage have risen?",
        options: ["1.67 percentage points", "3 percentage points", "4.27 percentage points", "10 percentage points"],
        correctIndex: 1,
        explanation: "The extra placements would be the remaining 10% of CSE's 1,080 students, i.e. 108, taking the total from 2,529 to 2,637. Since 108/3600 = 3% exactly, the overall rate rises from 70.25% to 73.25%, a gain of 3 percentage points. The option 10 percentage points wrongly applies CSE's own 10 point rise to the whole college.",
      },
      {
        id: "q14",
        text: "Civil and EEE are represented by equal slices. What is their combined central angle?",
        options: ["45 degrees", "72 degrees", "90 degrees", "100 degrees"],
        correctIndex: 2,
        explanation: "Each is 12.5% of the college, so each slice is 12.5 x 3.6 = 45 degrees and together they span 90 degrees - exactly a quarter of the chart, matching their combined 25% share (450 + 450 = 900 of 3,600 students). The option 45 degrees is just one of the two slices.",
      },
      {
        id: "q15",
        text: "Which branch's number of placed students is exactly one third of CSE's number of placed students?",
        options: ["Mechanical", "Civil", "EEE", "IT"],
        correctIndex: 0,
        explanation: "CSE placed 972, and one third of that is 324, which is exactly Mechanical's placed count (540 students at 60%). Civil placed 180, EEE 225 and IT 288, none of which is 324. Comparing rates instead (60% is two thirds of 90%, not one third) is what makes this question worth reading twice.",
      },
    ],
    timedQuiz: { timeLimitSeconds: 300, mcqIds: ["q3", "q8", "q10", "q12", "q13"] },
    problemIds: [],
    xpReward: 50, coinReward: 20,
    status: "published",
  },

];

export default WEEK3_DAYS;
