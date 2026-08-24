// DeVert Campus - Aptitude Series, Week 5: Logical Reasoning II + Capstone
// (Mon 31 Aug - Sat 5 Sep 2026). Days 25-30, the FINAL week of the 30-day
// placement-aptitude track.
//
// Placement-aptitude prep for engineering students sitting TCS / Infosys /
// Accenture / Cognizant / Capgemini / Wipro / Deloitte / Oracle / Amazon /
// Microsoft / Google campus rounds.
//
// AUTHORING RULES (identical to week1.mjs - that file is the reference):
//
//  1. `concept` is ONE string parsed by devert-frontend/lib/lessonBlocks.js.
//     Fence syntax is `::: variant optional title` ... `:::`, each on its own
//     line. Inside a `flow` fence NEVER write "->" in a step body - the parser
//     splits flow lines on it. Inside a `table` fence NEVER write a literal
//     "|" in cell text - it is the column separator. Two-space-indented lines
//     become code blocks, so traced arithmetic is indented on purpose.
//  2. Story or concrete number FIRST, technical name SECOND. Never open a
//     lesson with a formula. Day 30 is the deliberate exception: it is a
//     revision day, so it opens on "look how far you have come" instead.
//  3. Callouts are used sparingly: one `mistake`, one `remember`/`funfact`,
//     exactly one `checkpoint`, and a closing `revision` that works as a
//     30-second pre-exam re-read.
//  4. MCQ shape is `{ id, text, options, correctIndex, explanation }` -
//     `text`, NOT `question` (see campus-daily-learning-editor.jsx's
//     blankMcq()). `correctIndex` is 0-based into that question's own
//     `options`. Every answer below was hand-derived step by step and
//     re-verified; every explanation shows the load-bearing step.
//  5. Wrong options are real miscalculations a student would actually make
//     (reading a "left" off the diagram instead of off the person, using
//     30 degrees per hour for the hour hand, swapping the alligation ratio),
//     never filler.
//  6. `timedQuiz.mcqIds` are 5 ids drawn from that same day's `mcqs`.
//  7. ASCII hyphens only - scripts/normalize-dashes.mjs rewrites em/en dashes
//     across the database, so authoring them here just creates churn.

export const WEEK5_DAYS = [

  // ------------------------------------------------------------------
  // Day 25 - Monday 31 Aug 2026 - Circular Seating Arrangement & Puzzles
  // ------------------------------------------------------------------
  {
    date: "2026-08-31", dow: "mon", weekId: "2026-08-31", type: "lesson",
    title: "Day 25: Circular Seating Arrangement & Puzzles",
    difficulty: "Hard",
    estimatedMinutes: 20,
    concept: `## Eight Cousins, One Round Table

::: story
It is your cousin's birthday and eight of you are about to sit down around a round dining table. Someone announces she wants to sit next to the cake. Someone else refuses to sit next to his brother. A third wants to face the window. Within ten seconds nobody can sit anywhere and the cake is melting.

So you do the only sensible thing. You put **one** person down first - the one everybody else has an opinion about - and then place the others relative to her.

That single move, fix one person and work outward, is the entire method. A round table has no first chair and no last chair, so until you nail somebody to an actual seat there is nothing to measure from. Every circular arrangement question on a placement paper is built on that fact, and every student who tries to solve one in their head instead of on paper loses to it.
:::

## Left and Right Belong to the Person, Not to Your Page

::: analogy Point left, then turn around and point left again
Face a wall and point left. Now turn around, face the room, and point left again. Your left hand is now aimed at the opposite side of the room - and nothing about the room changed. Only you did.

That is the whole difficulty in circular seating. When someone at the table says "the person on my left", they mean **their** left, not the left-hand side of your diagram.

Draw a circle, put one person at the very top of it, and settle this once:
- If she **faces the centre**, she is looking down your page. Her left hand points to the right-hand side of the page, which is the **clockwise** direction.
- If she **faces outward**, she is looking up your page. Her left hand now points to the left-hand side of the page, which is **anticlockwise**.

Two seconds of checking, done once at the top of the question, and every clue on the paper reads correctly for the rest of the set.
:::

## One Puzzle, Traced End to End

Six friends - A, B, C, D, E and F - sit around a circular table **facing the centre**. Number the seats 1 to 6 clockwise on your page. Because everybody faces the centre, moving to somebody's *left* means moving to a *higher* seat number.

- A sits third to the left of D.
- B sits second to the right of A.
- C is not a neighbour of A.
- F sits immediately to the right of A.

D appears in the very first clue, so D goes down first, at seat 1.

  clue 1: from D at seat 1, three steps to D's LEFT (clockwise) = seats 2, 3, 4
          so A is at seat 4
  clue 2: from A at seat 4, two steps to A's RIGHT (anticlockwise) = seats 3, 2
          so B is at seat 2
  clue 4: immediately to A's right is seat 3
          so F is at seat 3
  clue 3: A at seat 4 has neighbours at seats 3 and 5, and C may be at neither
          seat 3 is already F, so C takes seat 6, leaving seat 5 for E

Read the finished circle clockwise: **D, B, F, A, E, C**.

Now read answers off it instead of re-deriving them. Who sits opposite A? Opposite means three seats away at a table of six, so seat 4 plus 3 is seat 1, which is **D**.

::: reveal Hold on - was that a coincidence?
No, and noticing it is worth a full mark on exam day. At a table of n people, moving n/2 seats in **either** direction lands you on the same person. So at a table of 6, "third to the left of D", "third to the right of D" and "opposite D" are three different names for one seat. At a table of 8 it is the fourth seat; at a table of 10, the fifth.

The moment a clue gives you a count that is exactly half the table, stop worrying about direction and just draw the diameter.
:::

::: flow How to crack any circular arrangement
Draw the circle first :: Mark n empty seats and number them 1 to n clockwise. Never attempt this in your head.
Settle the facing rule :: Facing the centre, a person's left is clockwise on your page. Facing outward, it is anticlockwise.
Fix the most-mentioned person :: Whoever appears in the largest number of clues goes down first, at seat 1.
Place the absolute clues :: Anything saying "opposite", "immediately", or giving a fixed count from an already-placed person.
Save the negative clues for last :: "X is not a neighbour of Y" almost never places anybody, but it usually kills the final ambiguity.
Reread every clue against the finished diagram :: One violated clue means the whole circle is wrong, not just that one seat.
:::

## Counting the Arrangements

Some questions do not want a diagram at all - they want a count. These five cover essentially all of them.

::: table Counting seats around a circle
Situation | Count | Why
n distinct people, plain round table | (n - 1)! | Fixing one person kills the n identical rotations
n people, but the seats are NUMBERED | n! | Numbered seats make rotations distinguishable again
n beads on a necklace or garland | (n - 1)! / 2 | Flipping the necklace over produces no new arrangement
n people, two of whom must sit together | 2 x (n - 2)! | Glue the pair into one unit, then 2 ways to order the pair
n people, two of whom must NOT sit together | (n - 1)! - 2 x (n - 2)! | Every arrangement, minus the together ones
:::

Test the last row on a real number. Eight people, two of whom refuse to sit together: total is 7! = 5040, together is 2 x 6! = 1440, so apart is 5040 - 1440 = **3600**.

::: mistake
The most expensive error on this topic is reading every "left" off your own diagram instead of off the person sitting there. A paper that deliberately mixes facing-the-centre and facing-outward people is engineered around exactly this: get one facing direction wrong and every clue after it lands on the wrong seat, so you do not drop one mark, you drop the whole set of four or five.

The second most expensive is the off-by-one. "Third to the left of D" means take **three steps** away from D. It does not mean "D is the first, then two more".

  wrong: count D at seat 1, then 2, then 3   -> lands on seat 3
  right: count 2, then 3, then 4             -> lands on seat 4

The third is assuming that "P is second to the left of Q" fixes the circle. It fixes a *relative* gap only. Until one person is pinned to an actual seat you are silently rotating the whole diagram, and a rotating diagram gives a different answer every time you look at it.
:::

::: remember
Three lines that make circular arrangement mechanical:
- **Facing the centre**: left is clockwise, right is anticlockwise. **Facing outward**: exactly the reverse.
- **Opposite** means n/2 seats away, and at that distance direction stops mattering.
- The two arcs between any two people always account for the other **n - 2** people. So if four people sit between P and Q going one way round a table of nine, then 9 - 2 - 4 = **3** sit between them going the other way.
:::

::: checkpoint
Eight people sit around a circular table **facing outward**. R sits second to the left of S. Looking at your diagram from above, how do you count from S to reach R?
- ( ) Clockwise, 2 seats
- (x) Anticlockwise, 2 seats
- ( ) Clockwise, 3 seats
- ( ) Anticlockwise, 6 seats
> Facing outward flips left and right relative to your page, so S's left is now the **anticlockwise** direction. Start at S, count two seats anticlockwise, and that is R. Counting clockwise instead is the single commonest slip on outward-facing sets - it puts R four seats away from where she actually is. And the count is 2, not 3: you never count S's own seat.
:::

::: revision
A round table has no starting seat, so nothing can be measured until you **fix the most-mentioned person** at seat 1 and work outward. Number the seats 1 to n clockwise, then settle the facing rule once: facing the centre, a person's left is clockwise on your page; facing outward, it is anticlockwise. Place absolute clues first ("opposite", "immediately", fixed counts from someone already seated), and use negative clues ("not a neighbour of") only at the end, to break the last tie. Counting always starts at the seat *after* the reference person - "third to the left" is three steps, never two. **Opposite** is n/2 seats away and direction is irrelevant there, so at a table of 6 "third to the left of D" and "opposite D" are the same seat. The two arcs between two people always hold the other n - 2 people. For pure counting: (n - 1)! at a plain round table, n! when seats are numbered, (n - 1)!/2 for a necklace, 2 x (n - 2)! when two must sit together, and (n - 1)! - 2 x (n - 2)! when they must not.
:::`,
    mcqs: [
      {
        id: "q1",
        text: "In how many ways can 7 people be seated around a circular table?",
        options: ["720", "5040", "120", "4320"],
        correctIndex: 0,
        explanation: "A plain round table has no fixed first seat, so one person is held still to kill the identical rotations: (n - 1)! = (7 - 1)! = 6! = 720. Answering 5040 is 7!, which is the count only if the seats were numbered.",
      },
      {
        id: "q2",
        text: "In how many ways can 6 people be seated around a circular table if two particular people must always sit next to each other?",
        options: ["48", "24", "120", "240"],
        correctIndex: 0,
        explanation: "Glue the pair into one unit, leaving 5 units around the circle: (5 - 1)! = 24 arrangements. The pair can be ordered internally 2 ways, so 24 x 2 = 48. Forgetting the internal 2 gives the trap answer 24.",
      },
      {
        id: "q3",
        text: "In how many distinct ways can 5 differently coloured beads be strung into a circular necklace?",
        options: ["12", "24", "60", "120"],
        correctIndex: 0,
        explanation: "Around a circle it would be (5 - 1)! = 24, but a necklace can be flipped over, and a flipped necklace is the same necklace. So divide by 2: 24 / 2 = 12. Answering 24 forgets the flip; 120 forgets both the rotation and the flip.",
      },
      {
        id: "q4",
        text: "Eight friends sit around a circular table facing the centre. M sits third to the right of N. Which of the following must be true?",
        options: ["N sits third to the left of M", "N sits third to the right of M", "N sits fifth to the left of M", "M and N are immediate neighbours"],
        correctIndex: 0,
        explanation: "Number the seats 1 to 8 clockwise and put N at seat 1. Facing the centre, right is anticlockwise, so three steps right of N is seats 8, 7, 6 - M sits at seat 6. Going back from M at seat 6 to N at seat 1 means seats 7, 8, 1, which is three steps clockwise, and clockwise is M's left. So N is third to M's left. Three to the right of M would be seat 3, and five to the left of M would also be seat 3, so both of those are wrong.",
      },
      {
        id: "q5",
        text: "Twelve people sit at equal distances around a circular table facing the centre. A sits fifth to the left of B. How many people sit between A and B when counted from A in the clockwise direction?",
        options: ["4", "5", "6", "7"],
        correctIndex: 2,
        explanation: "Put B at seat 1 of 12 numbered clockwise. Left is clockwise, so five steps left of B is seat 6, where A sits. Counting clockwise from A at seat 6 back to B at seat 1 passes seats 7, 8, 9, 10, 11 and 12 - six people. Cross-check with the arc rule: the two gaps must hold 12 - 2 = 10 people, and 4 + 6 = 10.",
      },
      {
        id: "q6",
        text: "Eight people P, Q, R, S, T, U, V and W sit around a circular table facing the centre. P is third to the left of Q. R is second to the right of P. S sits exactly opposite Q. T is Q's immediate neighbour on Q's right. U is second to the left of S. V is not a neighbour of P. Who sits immediately to the left of P?",
        options: ["S", "W", "R", "V"],
        correctIndex: 0,
        explanation: "Number seats 1 to 8 clockwise, Q at 1. Left is clockwise, so P is at 4. R is two steps right (anticlockwise) of P, so R is at 2. S is opposite Q, so S is at 5. T is Q's right-hand neighbour, so T is at 8. U is two steps left of S, so U is at 7. That leaves V and W for seats 3 and 6, and since V may not neighbour P at seat 4, V takes 6 and W takes 3. The seat immediately to P's left is the next one clockwise, seat 5, which is S.",
      },
      {
        id: "q7",
        text: "Eight people P, Q, R, S, T, U, V and W sit around a circular table facing the centre. P is third to the left of Q. R is second to the right of P. S sits exactly opposite Q. T is Q's immediate neighbour on Q's right. U is second to the left of S. V is not a neighbour of P. Who sits exactly opposite W?",
        options: ["U", "V", "T", "P"],
        correctIndex: 0,
        explanation: "The arrangement, read clockwise from seat 1, is Q, R, W, P, S, V, U, T. W is at seat 3, and at a table of 8 the opposite seat is four away: 3 + 4 = seat 7, which is U.",
      },
      {
        id: "q8",
        text: "Eight people P, Q, R, S, T, U, V and W sit around a circular table facing the centre. P is third to the left of Q. R is second to the right of P. S sits exactly opposite Q. T is Q's immediate neighbour on Q's right. U is second to the left of S. V is not a neighbour of P. How many people sit between R and U when counted clockwise from R?",
        options: ["3", "4", "5", "6"],
        correctIndex: 1,
        explanation: "Clockwise from seat 1 the order is Q, R, W, P, S, V, U, T. R is at seat 2 and U at seat 7, so going clockwise from R you pass W, P, S and V - four people. Counting anticlockwise instead gives 8 - 2 - 4 = 2, which is the other arc and not what was asked.",
      },
      {
        id: "q9",
        text: "Eight people P, Q, R, S, T, U, V and W sit around a circular table facing the centre. P is third to the left of Q. R is second to the right of P. S sits exactly opposite Q. T is Q's immediate neighbour on Q's right. U is second to the left of S. V is not a neighbour of P. Which of the following pairs sits next to each other?",
        options: ["P and V", "S and V", "R and P", "Q and W"],
        correctIndex: 1,
        explanation: "The clockwise order is Q, R, W, P, S, V, U, T, so the neighbouring pairs are Q-R, R-W, W-P, P-S, S-V, V-U, U-T and T-Q. Only S and V appear in that list. P and V are two seats apart, as are R and P, and Q and W.",
      },
      {
        id: "q10",
        text: "Five people A, B, C, D and E sit around a circular table facing OUTWARD, away from the centre. B sits immediately to A's left and C sits immediately to A's right. Seen from above, who sits immediately clockwise from A?",
        options: ["B", "C", "D", "E"],
        correctIndex: 1,
        explanation: "Facing outward reverses the usual mapping: a person's right is now the clockwise direction on your diagram and their left is anticlockwise. C is on A's right, so C is the seat immediately clockwise from A. Reading the diagram as though everyone faced the centre gives B, which is the intended trap.",
      },
      {
        id: "q11",
        text: "In how many ways can 8 people be seated around a circular table if two particular people must NEVER sit next to each other?",
        options: ["3600", "4320", "3360", "2880"],
        correctIndex: 0,
        explanation: "Total arrangements are (8 - 1)! = 5040. Those with the pair together are 2 x (8 - 2)! = 2 x 720 = 1440. So 5040 - 1440 = 3600. Forgetting to double for the pair's internal order leaves 5040 - 720 = 4320, the commonest wrong answer.",
      },
      {
        id: "q12",
        text: "Six people are to be seated around a circular table whose six chairs are individually numbered 1 to 6. In how many ways can this be done?",
        options: ["120", "720", "60", "360"],
        correctIndex: 1,
        explanation: "Numbering the chairs makes the rotations distinguishable - seat 1 is a different place from seat 2 - so the usual (n - 1)! correction does not apply and the count is simply 6! = 720. Reflexively answering 5! = 120 is exactly the trap this question is built on.",
      },
      {
        id: "q13",
        text: "Seven people sit around a circular table facing the centre. Counting clockwise from X, exactly three people sit between X and Y. How many people sit between X and Y when counted anticlockwise from X?",
        options: ["2", "3", "4", "5"],
        correctIndex: 0,
        explanation: "Apart from X and Y there are 7 - 2 = 5 people, and they are split between the two arcs. If one arc holds 3, the other holds 5 - 3 = 2. Checking on a diagram: X at seat 1, three between means Y at seat 5, and going anticlockwise from seat 1 you pass seats 7 and 6 before reaching Y.",
      },
      {
        id: "q14",
        text: "In a circular arrangement, P is the 4th person to the left of Q and also the 6th person to the right of Q. How many people are seated in the circle?",
        options: ["8", "9", "10", "11"],
        correctIndex: 2,
        explanation: "Walking left from Q to P takes 4 steps and walking right from Q to P takes 6 steps. Between them the two walks trace the full circle exactly once, so the table seats 4 + 6 = 10 people.",
      },
      {
        id: "q15",
        text: "Eight people sit around a circular table facing the centre. G sits fourth to the right of H. Which of the following is definitely true?",
        options: ["G sits exactly opposite H", "G and H are immediate neighbours", "Exactly two people sit between G and H on each side", "H sits fifth to the left of G"],
        correctIndex: 0,
        explanation: "At a table of 8, four seats away in either direction is the diametrically opposite seat, so G is opposite H. Put H at seat 1 and G lands at seat 5. That makes three people between them on each side, not two, and H is fourth (not fifth) to G's left, so the other three options all fail.",
      },
    ],
    timedQuiz: { timeLimitSeconds: 300, mcqIds: ["q1", "q4", "q6", "q11", "q14"] },
    problemIds: [],
    xpReward: 50, coinReward: 20,
    status: "published",
  },

  // ------------------------------------------------------------------
  // Day 26 - Tuesday 1 Sep 2026 - Data Sufficiency
  // ------------------------------------------------------------------
  {
    date: "2026-09-01", dow: "tue", weekId: "2026-08-31", type: "lesson",
    title: "Day 26: Data Sufficiency",
    difficulty: "Hard",
    estimatedMinutes: 20,
    concept: `## Two Slips of Paper

::: story
Your friend writes a number on a card, hides it, and says "guess it". You tell her that is impossible.

So she offers you two hints on two slips of paper, and adds a strange extra rule: **you do not have to tell me the number. You only have to tell me whether the hints are enough.**

Slip I says: it is a two-digit number whose digits add up to 9.
Slip II says: it is 27 more than the number you get by reversing its digits.

Take Slip I on its own. Candidates: 18, 27, 36, 45, 54, 63, 72, 81, 90. Nine of them. Not enough.

Take Slip II on its own. If the number is 10a + b, then 10a + b - (10b + a) = 9(a - b) = 27, so a - b = 3. Candidates: 30, 41, 52, 63, 74, 85, 96. Seven of them. Not enough.

Now hold both slips. a + b = 9 and a - b = 3 give a = 6, b = 3, and exactly one number survives: **63**.

That game - that exact game - is a whole question type on placement papers. You are never asked for the answer. You are asked whether the answer is *findable*.
:::

## Sufficient Does Not Mean Solved

Here is the shift that trips people up. "Sufficient" is a statement about the *question*, not about you. It means: given this information, exactly one answer is possible. Whether you actually bothered to compute it is nobody's business.

Watch what that buys you.

  Question: Is x greater than 5?
  Statement I:  x squared is greater than 25
  Statement II: x is greater than 7

Statement I gives x greater than 5 **or** x less than -5. Try x = 6, the answer is yes; try x = -6, the answer is no. Two different answers survive, so Statement I is **not** sufficient - even though it looks like it says a lot.

Statement II never tells you what x is. It could be 7.1 or 700. And yet every single one of those values is greater than 5, so the answer is always yes. Statement II **is** sufficient, while pinning down nothing at all.

The same trick runs the other way for values:

  Question: What is the area of a rectangle?
  Statement I:  its perimeter is 40 cm
  Statement II: its diagonal is 15 cm

Neither alone says anything. Together, l + w = 20 and l squared + w squared = 225. Square the first: (l + w) squared = 400, and that expands to l squared + w squared + 2lw = 400, so 225 + 2lw = 400, giving lw = **87.5**. The area is fixed in one line, and you never had to find l and w at all.

::: flow The only order that works
Read Statement I alone :: Physically cover Statement II. Does I on its own leave exactly one possible answer?
Read Statement II alone :: Now wipe Statement I from your mind completely. Does II on its own leave exactly one possible answer?
Combine, but only if both failed :: If either worked alone, combining is irrelevant and you must not go there.
Map your results onto the label :: Two yes-or-no verdicts decide the answer choice mechanically.
:::

::: table Decoding your two verdicts
Did I alone work? | Did II alone work? | What you mark
Yes | No | Statement I alone is sufficient
No | Yes | Statement II alone is sufficient
Yes | Yes | Each statement alone is sufficient
No | No, but together they do | Both together are sufficient, neither alone
No | No, and together they still do not | Neither is sufficient
:::

### The two traps that decide most of these

**Trap one: two surviving values.** A statement that yields x = 6 or x = -6 is insufficient for "what is x", but perfectly sufficient for "what is x squared" or "what is the absolute value of x". Always reread what was actually asked before you rule a statement out.

**Trap two: the statement that is not new.** Suppose Statement I is 2x + 3y = 12 and Statement II is 4x + 6y = 24. It looks like two equations, so it feels like two unknowns are pinned. But the second is just the first multiplied by 2 - the same line, the same infinitely many solutions. "Together" adds nothing, and the correct answer is that neither is sufficient.

::: mistake
This is the error that costs more marks than any other on this question type, and nearly everybody makes it at least once.

You read both statements, put them together, solve the problem, get the answer - and then mark "both together are sufficient", because that is how you found it. But finding it that way proves nothing whatsoever about whether one statement alone would have been enough.

  What is the value of n?
  Statement I:  n is the only even prime number
  Statement II: n is an integer greater than 1 and less than 3

Together, obviously n = 2. But Statement I alone already forces n = 2, and so does Statement II alone. The correct mark is "each statement alone is sufficient", and anybody who reasoned from both at once will get it wrong.

The fix is physical, not mental: put a finger over Statement II while you judge Statement I, and over Statement I while you judge Statement II. Do not trust yourself to "just ignore" it - information you have already read does not un-read itself.

The mirror-image error is carrying a verdict backwards. If Statement II turns out to be sufficient, that tells you nothing at all about Statement I. Every statement is judged from a blank slate.
:::

::: remember
Four lines to carry into the hall:
- **Sufficient means exactly one answer survives.** Two surviving values is insufficient, no matter how close it feels.
- For a **yes or no** question, sufficient means the answer is always yes, or always no. A statement can settle that without naming a single number.
- You often do not need each unknown individually. Perimeter 40 and diagonal 15 hand you the area in one line, without ever solving for length and breadth.
- **Never** check whether the two statements agree with each other. On a properly set paper they always do, and "they contradict each other" is not one of the choices.
:::

::: checkpoint
Question: what is the value of x? Statement I: x is a prime number less than 10. Statement II: x is even.
- ( ) Statement I alone is sufficient
- ( ) Statement II alone is sufficient
- (x) Both together are sufficient, but neither alone is
- ( ) Neither is sufficient, even together
> Statement I alone leaves 2, 3, 5 and 7 - four survivors, so no. Statement II alone leaves every even number there is, so no. Together, x must be prime, below 10, and even, and 2 is the only even prime, so exactly one value survives. Note how little arithmetic that took: sufficiency questions are decided by counting survivors, not by solving.
:::

::: revision
Data sufficiency asks whether an answer is **findable**, never what the answer is. Sufficient means exactly one answer survives the information given - so two surviving values is insufficient, while a statement that names no numbers at all can still be sufficient for a yes-or-no question. The order of work is non-negotiable: judge Statement I with Statement II physically covered, then judge Statement II with Statement I wiped from your mind, and only combine them if **both** failed alone. Solving with both first and then reasoning backwards is the classic way to mark "both together" on a question whose real answer was "each alone". Watch for the two traps: a statement that leaves a plus-or-minus pair (insufficient for x, sufficient for x squared), and a second statement that is only the first one rescaled, which adds no information at all. And never test whether the statements agree with each other - on a well-set paper they always do.
:::`,
    mcqs: [
      {
        id: "q1",
        text: "What is the value of x?  I. x + y = 10.  II. y = 4.",
        options: ["Statement I alone is sufficient, but Statement II alone is not sufficient.", "Statement II alone is sufficient, but Statement I alone is not sufficient.", "Both statements together are sufficient, but neither statement alone is sufficient.", "Neither Statement I nor Statement II, nor both together, is sufficient."],
        correctIndex: 2,
        explanation: "Statement I alone leaves infinitely many pairs (x could be 1 with y = 9, or 6 with y = 4). Statement II alone says nothing about x at all. Together, x = 10 - 4 = 6, a single value. So both are needed and neither works alone.",
      },
      {
        id: "q2",
        text: "Is x greater than 5?  I. x squared is greater than 25.  II. x is greater than 7.",
        options: ["Statement I alone is sufficient, but Statement II alone is not sufficient.", "Statement II alone is sufficient, but Statement I alone is not sufficient.", "Both statements together are sufficient, but neither statement alone is sufficient.", "Each statement alone is sufficient."],
        correctIndex: 1,
        explanation: "Statement I means x is greater than 5 or less than -5, so x = 6 gives yes but x = -6 gives no - insufficient. Statement II never reveals x, yet every value greater than 7 is also greater than 5, so the answer is always yes. II alone is sufficient.",
      },
      {
        id: "q3",
        text: "How old is Ravi now?  I. Five years ago, Ravi was half as old as he will be eight years from now.  II. Ravi's father is 24 years older than Ravi.",
        options: ["Statement I alone is sufficient, but Statement II alone is not sufficient.", "Statement II alone is sufficient, but Statement I alone is not sufficient.", "Both statements together are sufficient, but neither statement alone is sufficient.", "Neither Statement I nor Statement II, nor both together, is sufficient."],
        correctIndex: 0,
        explanation: "Statement I is a complete equation: R - 5 = (R + 8)/2, so 2R - 10 = R + 8 and R = 18. (Check: five years ago he was 13, and in eight years he will be 26.) Statement II introduces the father's age but leaves Ravi's completely open, so it is useless on its own.",
      },
      {
        id: "q4",
        text: "n is a positive integer. Is n even?  I. n is divisible by 6.  II. n squared is divisible by 4.",
        options: ["Statement I alone is sufficient, but Statement II alone is not sufficient.", "Statement II alone is sufficient, but Statement I alone is not sufficient.", "Both statements together are sufficient, but neither statement alone is sufficient.", "Each statement alone is sufficient."],
        correctIndex: 3,
        explanation: "Statement I: anything divisible by 6 is divisible by 2, so n is even - sufficient. Statement II: if n were odd then n = 2k + 1 and n squared = 4k squared + 4k + 1, which leaves remainder 1 on division by 4. So n squared divisible by 4 forces n even - also sufficient. Each works alone.",
      },
      {
        id: "q5",
        text: "What is the area of a rectangle?  I. Its perimeter is 40 cm.  II. Its diagonal is 15 cm.",
        options: ["Statement I alone is sufficient, but Statement II alone is not sufficient.", "Statement II alone is sufficient, but Statement I alone is not sufficient.", "Both statements together are sufficient, but neither statement alone is sufficient.", "Each statement alone is sufficient."],
        correctIndex: 2,
        explanation: "Alone, each statement allows many rectangles. Together: l + w = 20 and l squared + w squared = 225. Squaring the first gives l squared + w squared + 2lw = 400, so 225 + 2lw = 400 and the area lw = 87.5 sq cm - a single value. You never need l and w separately.",
      },
      {
        id: "q6",
        text: "What is the value of x?  I. x is a factor of 12.  II. x is even.",
        options: ["Statement I alone is sufficient, but Statement II alone is not sufficient.", "Statement II alone is sufficient, but Statement I alone is not sufficient.", "Both statements together are sufficient, but neither statement alone is sufficient.", "Neither Statement I nor Statement II, nor both together, is sufficient."],
        correctIndex: 3,
        explanation: "Statement I leaves 1, 2, 3, 4, 6 and 12. Statement II leaves every even number. Together the survivors are 2, 4, 6 and 12 - still four of them, so even combined the statements do not pin down a unique value.",
      },
      {
        id: "q7",
        text: "Is the positive integer n divisible by 12?  I. n is divisible by 4.  II. n is divisible by 6.",
        options: ["Statement I alone is sufficient, but Statement II alone is not sufficient.", "Statement II alone is sufficient, but Statement I alone is not sufficient.", "Both statements together are sufficient, but neither statement alone is sufficient.", "Neither Statement I nor Statement II, nor both together, is sufficient."],
        correctIndex: 2,
        explanation: "Statement I alone fails: n = 4 is divisible by 4 but not by 12. Statement II alone fails: n = 6 is divisible by 6 but not by 12. Together, n is a common multiple of 4 and 6, hence a multiple of their LCM, which is 12 - so the answer is always yes.",
      },
      {
        id: "q8",
        text: "What is the two-digit number N?  I. N is 6 times the sum of its digits.  II. N is a multiple of 9.",
        options: ["Statement I alone is sufficient, but Statement II alone is not sufficient.", "Statement II alone is sufficient, but Statement I alone is not sufficient.", "Both statements together are sufficient, but neither statement alone is sufficient.", "Each statement alone is sufficient."],
        correctIndex: 0,
        explanation: "Write N = 10a + b. Statement I gives 10a + b = 6(a + b), so 4a = 5b, and the only digits that fit are a = 5, b = 4 - a unique N = 54. Statement II alone leaves 18, 27, 36, ..., 99, which is nine candidates. So I alone is sufficient and II alone is not.",
      },
      {
        id: "q9",
        text: "What is the speed of a train?  I. The train crosses a 240 m long bridge in 20 seconds.  II. The train is 160 m long and passes a telegraph post in 8 seconds.",
        options: ["Statement I alone is sufficient, but Statement II alone is not sufficient.", "Statement II alone is sufficient, but Statement I alone is not sufficient.", "Both statements together are sufficient, but neither statement alone is sufficient.", "Neither Statement I nor Statement II, nor both together, is sufficient."],
        correctIndex: 1,
        explanation: "Statement I gives (L + 240)/20 = speed with the train's own length L unknown, so it cannot be solved. Statement II gives everything at once: passing a post means covering exactly the train's own length, so speed = 160/8 = 20 m/s. II alone is sufficient.",
      },
      {
        id: "q10",
        text: "How many girls are there in a class?  I. There are 40 students in the class.  II. The ratio of boys to girls in the class is 3 : 5.",
        options: ["Statement I alone is sufficient, but Statement II alone is not sufficient.", "Statement II alone is sufficient, but Statement I alone is not sufficient.", "Both statements together are sufficient, but neither statement alone is sufficient.", "Each statement alone is sufficient."],
        correctIndex: 2,
        explanation: "The total alone cannot split into boys and girls; the ratio alone fixes proportions but not counts. Together, girls are 5 of every 8 students, so 40 x 5/8 = 25. Unique, so both together and neither alone.",
      },
      {
        id: "q11",
        text: "What is the perimeter of a square?  I. Its area is 64 sq cm.  II. Its diagonal is 8√2 cm.",
        options: ["Statement I alone is sufficient, but Statement II alone is not sufficient.", "Statement II alone is sufficient, but Statement I alone is not sufficient.", "Both statements together are sufficient, but neither statement alone is sufficient.", "Each statement alone is sufficient."],
        correctIndex: 3,
        explanation: "Statement I: side = √64 = 8, so perimeter = 32 cm. Statement II: for a square the diagonal is side x √2, so side = 8 and perimeter = 32 cm again. Both routes reach the same unique value independently, so each statement alone is sufficient.",
      },
      {
        id: "q12",
        text: "Who is the tallest among P, Q and R?  I. P is taller than Q.  II. R is taller than Q.",
        options: ["Statement I alone is sufficient, but Statement II alone is not sufficient.", "Statement II alone is sufficient, but Statement I alone is not sufficient.", "Both statements together are sufficient, but neither statement alone is sufficient.", "Neither Statement I nor Statement II, nor both together, is sufficient."],
        correctIndex: 3,
        explanation: "Each statement alone ranks only two of the three. Together they establish that Q is the shortest, but P and R are never compared with each other, so the tallest could be either. Not sufficient even combined.",
      },
      {
        id: "q13",
        text: "Is the average of five consecutive integers equal to 20?  I. The smallest of the five integers is 18.  II. The largest of the five integers is greater than 20.",
        options: ["Statement I alone is sufficient, but Statement II alone is not sufficient.", "Statement II alone is sufficient, but Statement I alone is not sufficient.", "Both statements together are sufficient, but neither statement alone is sufficient.", "Each statement alone is sufficient."],
        correctIndex: 0,
        explanation: "Statement I fixes the set as 18, 19, 20, 21, 22, whose average is the middle term, 20 - the answer is definitely yes. Statement II allows a largest of 21 (giving 17 to 21, average 19, so no) or 22 (giving 18 to 22, average 20, so yes), which is two different answers and therefore insufficient.",
      },
      {
        id: "q14",
        text: "What is the two-digit number N?  I. The sum of the digits of N is 10.  II. N is both a perfect square and a perfect cube.",
        options: ["Statement I alone is sufficient, but Statement II alone is not sufficient.", "Statement II alone is sufficient, but Statement I alone is not sufficient.", "Both statements together are sufficient, but neither statement alone is sufficient.", "Neither Statement I nor Statement II, nor both together, is sufficient."],
        correctIndex: 1,
        explanation: "Statement I leaves 19, 28, 37, 46, 55, 64, 73, 82 and 91 - nine candidates. Statement II forces N to be a perfect sixth power, and the only two-digit sixth power is 64 (which is 2 to the power 6, equal to 8 squared and 4 cubed). One survivor, so II alone is sufficient.",
      },
      {
        id: "q15",
        text: "What is the value of x + y?  I. 2x + 3y = 12.  II. 4x + 6y = 24.",
        options: ["Statement I alone is sufficient, but Statement II alone is not sufficient.", "Statement II alone is sufficient, but Statement I alone is not sufficient.", "Both statements together are sufficient, but neither statement alone is sufficient.", "Neither Statement I nor Statement II, nor both together, is sufficient."],
        correctIndex: 3,
        explanation: "Statement I alone allows x = 0, y = 4 (sum 4) or x = 6, y = 0 (sum 6), so it fails. Statement II is exactly Statement I multiplied by 2 - the same line, so it fails identically and adds no new information when combined. Two equations that are not independent are really only one.",
      },
    ],
    timedQuiz: { timeLimitSeconds: 300, mcqIds: ["q2", "q5", "q7", "q12", "q15"] },
    problemIds: [],
    xpReward: 50, coinReward: 20,
    status: "published",
  },

  // ------------------------------------------------------------------
  // Day 27 - Wednesday 2 Sep 2026 - Clocks & Calendars
  // ------------------------------------------------------------------
  {
    date: "2026-09-02", dow: "wed", weekId: "2026-08-31", type: "lesson",
    title: "Day 27: Clocks & Calendars",
    difficulty: "Hard",
    estimatedMinutes: 20,
    concept: `## The Samosa You Just Lost

::: story
It is **3:40** and you are staring at the classroom clock, willing it to move faster. Your friend bets you a samosa that you cannot say what angle the two hands make right now.

Easy, you think. The hour hand is on the 3, and each number is 30 degrees apart, so it is at 90 degrees. The minute hand is on the 8, so it is at 8 x 30 = 240 degrees. Difference: 150 degrees. Samosa, please.

Except look at the clock again. **The hour hand is not on the 3 any more.** Forty minutes of the hour have gone, so it has drifted two-thirds of the way toward the 4. Two-thirds of 30 degrees is 20 degrees, so it is really at 110 degrees, and the true gap is 240 - 110 = **130 degrees**.

You lost the samosa by exactly 20 degrees. That drift is the entire subject.
:::

## Two Hands, Two Speeds

Stop thinking about numbers on a dial and think about two runners on a circular track, one much faster than the other.

::: table What each hand actually does
Hand | Full circle in | Degrees per hour | Degrees per minute
Minute hand | 60 minutes | 360 | 6
Hour hand | 12 hours | 30 | 0.5
:::

At H hours and M minutes past 12, measuring clockwise from the 12:

  minute hand position = 6M degrees
  hour hand position   = 30H + 0.5M degrees
  angle between them   = the absolute value of (30H - 5.5M)

That 5.5 is just 6 minus 0.5 - the **relative** speed of the hands, in degrees per minute. If the result exceeds 180, subtract it from 360, because the angle between two hands is never more than a straight line.

Try it on the clock that cost you a samosa: at 3:40 the value is 30(3) - 5.5(40) = 90 - 220 = -130, and the absolute value is **130 degrees**. Correct in one line.

### When do the hands meet?

They coincide when the angle is 0. Between 4 and 5 o'clock:

  30(4) - 5.5M = 0
  120 = 5.5M
  M = 120 / 5.5 = 240 / 11 = 21 and 9/11 minutes

So the hands meet at 4:21 and 9/11 minutes. The same equation set to 180 instead of 0 gives the instant they point in opposite directions.

::: funfact
The hands of a clock coincide **11 times in 12 hours**, not 12 - so 22 times a day, not 24.

The reason is that the minute hand is chasing a target that keeps moving. It gains 360 degrees on the hour hand every 360 / 5.5 = 65 and 5/11 minutes, which is slightly longer than an hour. Squeeze those into 12 hours and you fit 11 meetings, not 12. The lost one is why there is no coincidence at all in the whole hour between 11 and 12 - the meeting that "should" be there happens exactly at 12:00, and gets counted once for both hours.
:::

## Calendars Only Remember Sevens

::: analogy A week is a wheel with seven notches
If today is Wednesday, what day is it 700 days from now? You do not need to count 700 days. 700 divided by 7 is exactly 100 with nothing left over, so the wheel comes back to the same notch: Wednesday.

And 703 days from now? 703 = 7 x 100 + 3, so the wheel turns three extra notches: Saturday.

Only the leftover matters. Those leftovers are called **odd days**, and calendar questions are nothing more than adding up odd days.
:::

An ordinary year is 365 days = 52 weeks + 1, so it contributes **1 odd day**. A leap year is 366 days, so it contributes **2**. And a year is a leap year if it is divisible by 4 - except century years, which must be divisible by 400. So 2000 was a leap year and 1900 was not.

::: table Odd days worth knowing cold
Period | Total days | Odd days
Ordinary year | 365 | 1
Leap year | 366 | 2
100 years | 36,524 | 5
200 years | 73,048 | 3
300 years | 109,572 | 1
400 years | 146,097 | 0
:::

Once you have a total, read the day straight off the code: **0 = Sunday, 1 = Monday, 2 = Tuesday, 3 = Wednesday, 4 = Thursday, 5 = Friday, 6 = Saturday.**

::: table Odd days contributed by each month
Month | Days | Odd days
January | 31 | 3
February | 28 or 29 | 0 or 1
March | 31 | 3
April | 30 | 2
May | 31 | 3
June | 30 | 2
July | 31 | 3
August | 31 | 3
September | 30 | 2
October | 31 | 3
November | 30 | 2
December | 31 | 3
:::

### What day was 15 August 1947?

  Step 1: split the 1946 COMPLETED years as 1600 + 300 + 46
  Step 2: 1600 years -> 0 odd days   (any multiple of 400 gives 0)
          300 years  -> 1 odd day
  Step 3: the 46 years 1901 to 1946
          leap years: 1904, 1908, ... 1944  ->  11 of them
          ordinary years: 46 - 11 = 35
          odd days: 35 x 1 + 11 x 2 = 57, and 57 mod 7 = 1
  Step 4: years total = 0 + 1 + 1 = 2 odd days
  Step 5: days elapsed in 1947 up to 15 August
          31 + 28 + 31 + 30 + 31 + 30 + 31 + 15 = 227
          227 mod 7 = 3, since 7 x 32 = 224
  Step 6: grand total = 2 + 3 = 5 odd days, and 5 = Friday

India became independent on a **Friday**, and you just proved it with two divisions.

::: mistake
The clock error that wrecks the most answers is treating the hour hand as though it only moves once an hour. Students use 30 degrees per hour and forget that it *also* creeps **0.5 degrees every minute**. At 3:40 that gap is 20 degrees, so the "obvious" 150 becomes the correct 130. If your answer to an angle question is a clean multiple of 30, be suspicious - the real answers are usually untidy, like 22.5 or 130 or 7.5 degrees.

The calendar version of the same error is the century leap year. 1900, 1800 and 2100 are **not** leap years, because a century year needs to be divisible by 400, not just by 100. One wrongly counted leap year shifts your final answer by exactly one day, which is enough to make a plausible-looking wrong option look right.

The third one is subtle: when finding the day for a date, you count **completed** years plus the days elapsed in the current year. For 15 August 1947 that is 1946 complete years, not 1947. Using 1947 adds a whole extra odd day.
:::

::: checkpoint
How many times between 12 noon and 12 midnight are the two hands of a clock at right angles to each other?
- ( ) 11
- (x) 22
- ( ) 24
- ( ) 44
> A first instinct says twice an hour, so 24 in 12 hours. But the hands only gain 360 degrees on each other 11 times in 12 hours, and each of those gains produces exactly two right angles, so the honest count is 11 x 2 = 22. (The "missing" pair is why there is no second right angle inside the hour from 2 to 3, nor inside the hour from 8 to 9.) Over a full day it is 44 - which is also the number of times the hands lie in a straight line, since 22 coincidences plus 22 oppositions is 44 as well.
:::

::: revision
A clock is two runners on a circular track: the minute hand at **6 degrees a minute**, the hour hand at **0.5 degrees a minute**, so they close on each other at 5.5 degrees a minute. The angle at H hours M minutes is the absolute value of **30H - 5.5M**, subtracted from 360 if it exceeds 180. Setting that expression to 0 finds a coincidence, to 180 an opposition, to 90 a right angle. The hands coincide 11 times in 12 hours (22 a day), form right angles 22 times in 12 hours (44 a day), and lie in a straight line 44 times a day. Never freeze the hour hand on its number - that single omission is the classic loss. Calendars reduce to **odd days**, the remainder after dividing by 7: 1 for an ordinary year, 2 for a leap year, 5 per century, 3 for 200 years, 1 for 300 and 0 for 400. A century year is a leap year only when divisible by 400, so 2000 was and 1900 was not. To date any day, add the odd days of the **completed** years to the days elapsed in the current year, take the remainder mod 7, and read it off 0 = Sunday through 6 = Saturday.
:::`,
    mcqs: [
      {
        id: "q1",
        text: "What is the angle between the hour hand and the minute hand of a clock at 3:40?",
        options: ["120 degrees", "130 degrees", "140 degrees", "150 degrees"],
        correctIndex: 1,
        explanation: "Use the absolute value of 30H - 5.5M: 30(3) - 5.5(40) = 90 - 220 = -130, so the angle is 130 degrees. Freezing the hour hand on the 3 gives 240 - 90 = 150, which is the standard trap - the hour hand has already crept 20 degrees past the 3.",
      },
      {
        id: "q2",
        text: "What is the angle between the hands of a clock at 5:30?",
        options: ["0 degrees", "15 degrees", "30 degrees", "45 degrees"],
        correctIndex: 1,
        explanation: "30(5) - 5.5(30) = 150 - 165 = -15, so the angle is 15 degrees. At 5:30 the minute hand is exactly on the 6 at 180 degrees while the hour hand sits halfway between 5 and 6, at 165 degrees.",
      },
      {
        id: "q3",
        text: "What is the angle between the hands of a clock at 2:15?",
        options: ["7.5 degrees", "15 degrees", "22.5 degrees", "30 degrees"],
        correctIndex: 2,
        explanation: "30(2) - 5.5(15) = 60 - 82.5 = -22.5, so 22.5 degrees. The minute hand is exactly on the 3 at 90 degrees and the hour hand is a quarter of the way from 2 to 3, at 67.5 degrees. Answering 30 assumes the hour hand is still on the 2.",
      },
      {
        id: "q4",
        text: "At what time between 4 and 5 o'clock will the hands of a clock coincide?",
        options: ["4:20", "4:21 and 9/11 minutes", "4:22", "4:23 and 1/11 minutes"],
        correctIndex: 1,
        explanation: "Coinciding means the angle is zero: 30(4) - 5.5M = 0, so M = 120/5.5 = 240/11 = 21 and 9/11 minutes. The hands never meet at a whole number of minutes except at 12 o'clock, which is why every option but one is a round-looking decoy.",
      },
      {
        id: "q5",
        text: "How many times in a 24-hour day do the two hands of a clock coincide?",
        options: ["20", "22", "23", "24"],
        correctIndex: 1,
        explanation: "The minute hand must gain a full 360 degrees on the hour hand for one coincidence, and at a relative speed of 5.5 degrees per minute that takes 65 and 5/11 minutes - slightly more than an hour. So only 11 coincidences fit into 12 hours, giving 22 in a day. The intuitive 24 is the trap.",
      },
      {
        id: "q6",
        text: "At what time between 2 and 3 o'clock will the hands of a clock point in exactly opposite directions?",
        options: ["2:40", "2:43 and 7/11 minutes", "2:44", "2:45 and 5/11 minutes"],
        correctIndex: 1,
        explanation: "Opposite means the gap is 180 degrees: 30(2) - 5.5M = -180, so 5.5M = 240 and M = 480/11 = 43 and 7/11 minutes. Check: the hour hand is then at 60 + 0.5(43.64) = 81.8 degrees and the minute hand at 6(43.64) = 261.8 degrees, exactly 180 apart.",
      },
      {
        id: "q7",
        text: "A clock is set right at 8 a.m. It gains 10 minutes in 24 hours. What will be the true time when this clock shows 1 p.m. on the following day?",
        options: ["12:45 p.m.", "12:48 p.m.", "12:50 p.m.", "1:00 p.m."],
        correctIndex: 1,
        explanation: "From 8 a.m. to 1 p.m. the next day is 29 hours on the faulty clock. That clock covers 24 hours 10 minutes, i.e. 145/6 hours, for every 24 true hours. True time = 29 x 24 / (145/6) = 28.8 hours = 28 hours 48 minutes. Adding that to 8 a.m. gives 12:48 p.m. Answering 1 p.m. ignores the gain entirely.",
      },
      {
        id: "q8",
        text: "What was the day of the week on 26 January 1950?",
        options: ["Wednesday", "Thursday", "Friday", "Saturday"],
        correctIndex: 1,
        explanation: "Split 1949 completed years as 1600 + 300 + 49. That gives 0 + 1 odd days so far. In 1901 to 1949 there are 12 leap years (1904 to 1948) and 37 ordinary ones, so 37 + 24 = 61 odd days, and 61 mod 7 = 5. Years total 0 + 1 + 5 = 6. Add the 26 days of January: 26 mod 7 = 5. Grand total 11, and 11 mod 7 = 4, which is Thursday.",
      },
      {
        id: "q9",
        text: "How many odd days are there in 100 years?",
        options: ["3", "5", "1", "0"],
        correctIndex: 1,
        explanation: "A century holds 76 ordinary years and 24 leap years, giving 76 + 48 = 124 days beyond whole weeks, and 124 mod 7 = 5. Equivalently 36,524 total days, and 36,524 mod 7 = 5. The values 3, 1 and 0 belong to 200, 300 and 400 years respectively.",
      },
      {
        id: "q10",
        text: "Which of the following is NOT a leap year?",
        options: ["1996", "2000", "1900", "2024"],
        correctIndex: 2,
        explanation: "A century year is a leap year only if it is divisible by 400. 1900 is divisible by 100 but not by 400, so it had only 365 days. 2000 divided by 400 is exactly 5, so it was a leap year, and 1996 and 2024 are ordinary multiples of 4.",
      },
      {
        id: "q11",
        text: "1 January 2024 was a Monday. What day of the week was 1 January 2025?",
        options: ["Tuesday", "Wednesday", "Thursday", "Friday"],
        correctIndex: 1,
        explanation: "The year that elapses between those two dates is 2024 itself, which is a leap year with 366 days, so it contributes 2 odd days. Monday plus 2 is Wednesday. Adding only 1 odd day gives the trap answer Tuesday.",
      },
      {
        id: "q12",
        text: "The last day of a century cannot be which of the following?",
        options: ["Monday", "Wednesday", "Tuesday", "Friday"],
        correctIndex: 2,
        explanation: "Centuries carry 5, 3, 1 and 0 odd days in a repeating four-century cycle, so the last day of a century is always Friday, Wednesday, Monday or Sunday. Tuesday, Thursday and Saturday are impossible.",
      },
      {
        id: "q13",
        text: "How many times in a 24-hour day do the two hands of a clock lie in a straight line, either coinciding or pointing in opposite directions?",
        options: ["22", "24", "44", "48"],
        correctIndex: 2,
        explanation: "The hands coincide 22 times a day and point in opposite directions another 22 times a day. A straight line covers both cases, so 22 + 22 = 44. Answering 22 counts only one of the two cases.",
      },
      {
        id: "q14",
        text: "At what time between 4 and 5 o'clock are the hands of a clock at right angles for the FIRST time?",
        options: ["4:05 and 5/11 minutes", "4:06", "4:38 and 2/11 minutes", "4:10 and 10/11 minutes"],
        correctIndex: 0,
        explanation: "Set the gap to 90: 30(4) - 5.5M = 90 gives M = 30/5.5 = 60/11 = 5 and 5/11 minutes. The other root, 120 - 5.5M = -90, gives M = 420/11 = 38 and 2/11 minutes, which is the second right angle in that hour, not the first.",
      },
      {
        id: "q15",
        text: "1 March 2020 was a Sunday. What day of the week was 1 March 2021?",
        options: ["Sunday", "Monday", "Tuesday", "Wednesday"],
        correctIndex: 1,
        explanation: "2020 is a leap year, but its extra day (29 February 2020) falls BEFORE 1 March 2020, so the stretch from 1 March 2020 to 1 March 2021 contains only 365 days - 1 odd day. Sunday plus 1 is Monday. Adding 2 because '2020 is a leap year' gives the trap answer Tuesday.",
      },
    ],
    timedQuiz: { timeLimitSeconds: 300, mcqIds: ["q1", "q6", "q8", "q12", "q15"] },
    problemIds: [],
    xpReward: 50, coinReward: 20,
    status: "published",
  },

  // ------------------------------------------------------------------
  // Day 28 - Thursday 3 Sep 2026 - Mixtures & Alligations
  // ------------------------------------------------------------------
  {
    date: "2026-09-03", dow: "thu", weekId: "2026-08-31", type: "lesson",
    title: "Day 28: Mixtures & Alligations",
    difficulty: "Hard",
    estimatedMinutes: 20,
    concept: `## Two Jugs of Nimbu Paani

::: story
Your mother keeps two jugs of nimbu paani on the counter. The first is far too sweet - **8 spoons of sugar per glass**. The second is barely sweet at all - **3 spoons per glass**. You want a glass with exactly **5 spoons**, and you are allowed to pour from both.

No algebra needed. Look at where 5 sits: it is **2 away from 3** and **3 away from 8**. It leans toward the weak jug, so you obviously need more weak than sweet.

And here is the part that feels like a card trick the first time you see it. The amounts you need are those two distances, **swapped**:

  weak jug : sweet jug = 3 : 2

Check it. Three glasses of weak carry 3 x 3 = 9 spoons. Two glasses of sweet carry 2 x 8 = 16 spoons. That is 25 spoons spread over 5 glasses, and 25 / 5 = **5 spoons per glass**. Exactly the target.
:::

## The Rule, and Why the Numbers Swap

The distances swap because the *far* ingredient has to be used *sparingly*. Every spoon of the 8-spoon jug drags the average a long way up, so you can only afford a little of it. Every spoon of the 3-spoon jug nudges gently, so you need plenty.

Written as a rule - this is called **alligation** - for a cheaper quantity, a dearer quantity, and a target mean:

  cheaper : dearer = (dearer - mean) : (mean - cheaper)

::: table The cross, laid out flat, on rice at Rs 40 and Rs 60 for a Rs 46 mixture
Ingredient | Its value | Its distance from the mean of 46 | Parts it gets in the ratio
Cheaper rice | Rs 40 | 46 - 40 = 6 | 14 parts
Dearer rice | Rs 60 | 60 - 46 = 14 | 6 parts
:::

Read the last column carefully: each ingredient receives the **other** one's distance. So cheap : dear = 14 : 6 = **7 : 3**.

Verify with real money. Seven kg at Rs 40 is Rs 280; three kg at Rs 60 is Rs 180. Total Rs 460 for 10 kg, which is Rs 46 per kg. Correct.

And the free sanity check, worth using every single time: 46 is nearer to 40 than to 60, so there must be **more** cheap rice. The ratio 7 : 3 has more cheap rice. If you had written 3 : 7 you would have caught yourself in two seconds.

::: remember
Alligation is nothing more than a weighted average read backwards, so it works on **anything that can be averaged**, not just prices:
- litres of milk and water, using water's "price" as 0 and its "concentration" as 0%
- percentage concentrations of two solutions
- two profit percentages a shopkeeper earns on two parts of one stock
- speeds over two stretches of a journey, when the *time* on each is what you are mixing
- marks scored by two groups of students

Whenever a question hands you two values and one average, reach for the cross before you reach for algebra.
:::

## When You Keep Replacing the Same Mixture

::: analogy Scooping out of a bucket that keeps getting weaker
A bucket holds 40 litres of pure milk. You scoop out 8 litres and top it up with water. Now scoop out 8 litres **again** - but this time the scoop is not pure milk, it is the mixture, so it carries some water back out with it. That is why the second scoop removes less milk than the first, and why repeated replacement is multiplicative rather than subtractive.
:::

Trace it honestly, one round at a time:

  round 1: remove 8 L of pure milk, leaving 32 L of milk in 40 L
           milk fraction is now 32/40 = 4/5
  round 2: remove 8 L of MIXTURE, which carries 8 x 4/5 = 6.4 L of milk
           milk left = 32 - 6.4 = 25.6 L

The shortcut collapses all of that into one line. If a vessel holds x units of pure liquid and you remove y units and replace them with water, n times over:

  liquid left = x (1 - y/x) to the power n

Check: 40 x (1 - 8/40) squared = 40 x (4/5) squared = 40 x 16/25 = **25.6 L**. Same answer, no rounds. Milk to water is then 25.6 : 14.4 = **16 : 9**.

::: mistake
The number one error is writing the alligation ratio the wrong way round - assigning each ingredient **its own** distance from the mean instead of the other one's. For rice at Rs 40 and Rs 60 mixed to Rs 46, students write cheap : dear = 6 : 14 instead of 14 : 6, and every number after that is wrong.

The cure is the sanity check, and it takes two seconds: **the mixture always leans toward whichever ingredient there is more of.** Since 46 is much nearer 40 than 60, cheap rice must dominate, so the cheap side of the ratio must be the bigger number. Any answer that fails this test is wrong before you finish reading it.

The replacement version of the same carelessness is putting the **total** removed into the formula instead of the amount removed **per round**. Three rounds of 5 litres out of 50 is 50 x (1 - 5/50) cubed = 36.45 litres, not 50 x (1 - 15/50) = 35. Those two answers are close enough that both will be sitting in the options.

Third: in a milk-and-water question, water is free - its price is 0 and its concentration is 0%. Leaving water out of the cross entirely, rather than entering it as a zero, is a quiet way to lose the whole question.
:::

::: checkpoint
Two kinds of tea, costing Rs 200 and Rs 300 per kg, are blended to sell at Rs 275 per kg. Before doing any cross at all, which of these must be true?
- ( ) There is more Rs 200 tea than Rs 300 tea in the blend
- (x) There is more Rs 300 tea than Rs 200 tea in the blend
- ( ) The two teas are present in equal quantities
- ( ) It cannot be decided without working out the cross
> The mean of 275 sits only 25 away from 300 but a full 75 away from 200, so the blend has to be mostly the dearer tea. The cross confirms it: cheap : dear = (300 - 275) : (275 - 200) = 25 : 75 = 1 : 3. Check with money - 1 kg at 200 plus 3 kg at 300 is Rs 1100 over 4 kg, which is Rs 275 per kg. Reading the lean of the average first is the fastest way to catch a flipped ratio.
:::

::: revision
Alligation is a weighted average solved backwards: **cheaper : dearer = (dearer - mean) : (mean - cheaper)**, which means each ingredient receives the *other* one's distance from the mean. It applies to anything averageable - prices, concentrations, profit percentages, marks - and for milk-and-water questions water enters as a value of 0. Always run the free sanity check: the mixture leans toward whichever ingredient is present in greater quantity, so if the mean sits nearer the cheaper value, the cheaper side of the ratio must be the larger number. When part of a mixture is repeatedly removed and replaced, the loss is multiplicative, not subtractive, because every scoop after the first carries water back out: **liquid left = x times (1 - y/x) to the power n**, where y is the amount removed **per round**, never the total. For questions that pair alligation with profit, first strip the selling price back to the cost price of the mixture (divide by 1 plus the profit rate), and only then run the cross on cost figures.
:::`,
    mcqs: [
      {
        id: "q1",
        text: "In what ratio must water be mixed with milk costing Rs 60 per litre in order to get a mixture worth Rs 48 per litre?",
        options: ["1 : 4", "1 : 5", "4 : 1", "1 : 3"],
        correctIndex: 0,
        explanation: "Water is free, so treat its value as 0. Alligation gives water : milk = (60 - 48) : (48 - 0) = 12 : 48 = 1 : 4. Check: 1 litre of water plus 4 litres of milk costs Rs 240 for 5 litres, which is Rs 48 per litre.",
      },
      {
        id: "q2",
        text: "In what ratio must rice costing Rs 7.20 per kg be mixed with rice costing Rs 5.70 per kg to produce a mixture worth Rs 6.30 per kg?",
        options: ["1 : 3", "2 : 3", "3 : 2", "3 : 4"],
        correctIndex: 1,
        explanation: "Distances from the mean: the dearer rice is 7.20 - 6.30 = 0.90 away, the cheaper is 6.30 - 5.70 = 0.60 away. Swap them, so cheaper : dearer = 0.90 : 0.60 = 3 : 2, which means dearer : cheaper = 2 : 3. Check: 2 kg at 7.20 is 14.40 and 3 kg at 5.70 is 17.10, total 31.50 over 5 kg = Rs 6.30.",
      },
      {
        id: "q3",
        text: "A 60-litre mixture of milk and water contains milk and water in the ratio 7 : 3. How much water must be added so that the ratio becomes 3 : 2?",
        options: ["5 litres", "8 litres", "10 litres", "12 litres"],
        correctIndex: 2,
        explanation: "Milk is 60 x 7/10 = 42 litres and water is 18 litres. The milk never changes, so 42/(18 + x) = 3/2 gives 84 = 54 + 3x and x = 10. Check: 42 : 28 does reduce to 3 : 2.",
      },
      {
        id: "q4",
        text: "A 50-litre vessel is full of pure milk. 5 litres are drawn out and replaced by water, and this operation is performed three times in all. How much milk remains in the vessel?",
        options: ["36.45 litres", "35 litres", "40.5 litres", "34.2 litres"],
        correctIndex: 0,
        explanation: "Repeated replacement is multiplicative: 50 x (1 - 5/50) cubed = 50 x (0.9) cubed = 50 x 0.729 = 36.45 litres. Subtracting the total 15 litres removed instead gives 35, which is the standard trap answer.",
      },
      {
        id: "q5",
        text: "A vessel contains 20 litres of pure milk. 4 litres are drawn out and replaced with water; then 4 litres of the resulting mixture are drawn out and again replaced with water. What is the ratio of milk to water now?",
        options: ["16 : 9", "4 : 1", "9 : 16", "3 : 2"],
        correctIndex: 0,
        explanation: "Milk left = 20 x (1 - 4/20) squared = 20 x (4/5) squared = 20 x 16/25 = 12.8 litres, so water is 20 - 12.8 = 7.2 litres. The ratio 12.8 : 7.2 scales to 128 : 72 = 16 : 9. Note that 16 : 9 is exactly (4/5) squared expressed against the remainder.",
      },
      {
        id: "q6",
        text: "In what ratio must a grocer mix two varieties of pulses worth Rs 15 and Rs 20 per kg so that by selling the mixture at Rs 20.70 per kg he gains 15%?",
        options: ["2 : 3", "3 : 2", "1 : 2", "5 : 3"],
        correctIndex: 0,
        explanation: "First strip the profit out of the selling price: cost of the mixture = 20.70 / 1.15 = Rs 18 per kg. Now run the cross on costs: cheaper : dearer = (20 - 18) : (18 - 15) = 2 : 3. Check: 2 kg at 15 plus 3 kg at 20 is Rs 90 over 5 kg = Rs 18 per kg, and Rs 20.70 on a cost of Rs 18 is a 15% gain.",
      },
      {
        id: "q7",
        text: "A can contains a mixture of liquids A and B in the ratio 7 : 5. When 9 litres of the mixture are drawn off and the can is filled with B, the ratio of A to B becomes 7 : 9. How many litres of liquid A did the can contain initially?",
        options: ["10", "20", "21", "25"],
        correctIndex: 2,
        explanation: "Let the can hold 12k litres, so A is 7k and B is 5k. The 9 litres drawn off remove A and B in the ratio 7 : 5, i.e. 21/4 of A and 15/4 of B. So A becomes 7k - 21/4 and B becomes 5k - 15/4 + 9 = 5k + 21/4. Setting the new ratio to 7/9: 9(7k - 21/4) = 7(5k + 21/4), which gives 28k = 84 and k = 3. So A was 7 x 3 = 21 litres. Check with a 36-litre can: A goes 21 to 15.75 and B goes 15 to 20.25, and 15.75 : 20.25 = 7 : 9.",
      },
      {
        id: "q8",
        text: "How many kg of sugar costing Rs 9 per kg must be mixed with 27 kg of sugar costing Rs 7 per kg so that there is a gain of 10% on selling the mixture at Rs 9.24 per kg?",
        options: ["36 kg", "42 kg", "54 kg", "63 kg"],
        correctIndex: 3,
        explanation: "Cost of the mixture = 9.24 / 1.1 = Rs 8.40 per kg. Cross on costs: cheaper : dearer = (9 - 8.40) : (8.40 - 7) = 0.60 : 1.40 = 3 : 7. The cheaper sugar is 27 kg, so one part is 9 kg and the dearer sugar is 7 x 9 = 63 kg. Check: 189 + 567 = Rs 756 over 90 kg = Rs 8.40 per kg.",
      },
      {
        id: "q9",
        text: "A dishonest milkman claims to sell milk at his cost price, but he mixes water into it and still gains 25%. What is the ratio of water to milk in his mixture?",
        options: ["1 : 3", "1 : 4", "1 : 5", "4 : 1"],
        correctIndex: 1,
        explanation: "His entire profit comes from the free water. Take 4 litres of milk costing Rs x per litre, so his cost is 4x. Adding 1 litre of water lets him sell 5 litres at Rs x each, i.e. 5x, so his profit is x on a cost of 4x, which is exactly 25%. Water : milk = 1 : 4. In general the ratio is (gain percent) : 100.",
      },
      {
        id: "q10",
        text: "Two vessels A and B contain milk and water in the ratios 4 : 3 and 2 : 3 respectively. In what ratio must the contents of A and B be mixed to obtain a new mixture that is half milk and half water?",
        options: ["7 : 5", "5 : 7", "4 : 3", "3 : 4"],
        correctIndex: 0,
        explanation: "Work with milk fractions: vessel A is 4/7 milk, vessel B is 2/5 milk, and the target is 1/2. Alligation gives A : B = (1/2 - 2/5) : (4/7 - 1/2) = 1/10 : 1/14 = 14 : 10 = 7 : 5. Check with 7 parts of A and 5 parts of B: milk = 7(4/7) + 5(2/5) = 4 + 2 = 6, water = 3 + 3 = 6, so the new mixture is exactly half and half.",
      },
      {
        id: "q11",
        text: "A vessel is full of pure spirit. Each time, 20% of the contents are drawn off and replaced with water. After how many such operations does the spirit first fall below 50% of the vessel's volume?",
        options: ["2", "3", "4", "5"],
        correctIndex: 2,
        explanation: "Each operation leaves 80% of the spirit, so after n operations the fraction remaining is (0.8) to the power n: 0.8, then 0.64, then 0.512, then 0.4096. The first value below 0.5 arrives at n = 4. After 3 operations the spirit is still 51.2%, just above half - which is exactly why 3 is the tempting wrong answer.",
      },
      {
        id: "q12",
        text: "8 litres are drawn from a cask full of wine and replaced with water. This operation is performed four times in all, after which the ratio of the wine left to the water is 16 : 65. How much wine did the cask originally hold?",
        options: ["18 litres", "24 litres", "32 litres", "42 litres"],
        correctIndex: 1,
        explanation: "Wine now forms 16/(16 + 65) = 16/81 of the cask, so (1 - 8/x) to the power 4 = 16/81. Taking square roots twice, (1 - 8/x) squared = 4/9 and 1 - 8/x = 2/3, so 8/x = 1/3 and x = 24 litres. Check: (2/3) to the power 4 = 16/81, and 24 x 16/81 is about 4.74 litres of wine against 19.26 litres of water, which is 16 : 65.",
      },
      {
        id: "q13",
        text: "A 70-litre mixture of milk and water contains 10% water. How much water must be added so that water becomes 12.5% of the new mixture?",
        options: ["2 litres", "5 litres", "7 litres", "8 litres"],
        correctIndex: 0,
        explanation: "Water is 7 litres and milk is 63 litres. Adding x litres of water: (7 + x)/(70 + x) = 0.125, so 7 + x = 8.75 + 0.125x, giving 0.875x = 1.75 and x = 2. Check: 9 litres of water in 72 litres total is exactly 12.5%. Applying the 12.5% to the ORIGINAL 70 litres instead gives 8.75 - 7 = 1.75, which is why the base matters.",
      },
      {
        id: "q14",
        text: "In what ratio should a 20% alcohol solution be mixed with a 50% alcohol solution to obtain a 30% alcohol solution?",
        options: ["1 : 2", "2 : 1", "3 : 1", "1 : 3"],
        correctIndex: 1,
        explanation: "Alligation on concentrations: 20% solution : 50% solution = (50 - 30) : (30 - 20) = 20 : 10 = 2 : 1. Check: 2 litres at 20% carry 0.4 litres of alcohol and 1 litre at 50% carries 0.5, so 0.9 litres of alcohol in 3 litres, which is 30%. The mean of 30 is nearer 20, so the weaker solution must dominate - the sanity check agrees.",
      },
      {
        id: "q15",
        text: "A shopkeeper has 100 kg of sugar. He sells part of it at a 10% profit and the rest at a 20% profit, gaining 12% on the whole lot. How much did he sell at a 20% profit?",
        options: ["20 kg", "25 kg", "30 kg", "80 kg"],
        correctIndex: 0,
        explanation: "Alligation works on profit percentages too: the 10% part and the 20% part are in the ratio (20 - 12) : (12 - 10) = 8 : 2 = 4 : 1. So the 20% portion is one fifth of 100 kg, i.e. 20 kg. Check with a cost of Rs 1 per kg: profit = 80(0.10) + 20(0.20) = 8 + 4 = Rs 12 on a cost of Rs 100, exactly 12%. Answering 80 kg reads the ratio the wrong way round.",
      },
    ],
    timedQuiz: { timeLimitSeconds: 300, mcqIds: ["q2", "q5", "q7", "q10", "q15"] },
    problemIds: [],
    xpReward: 50, coinReward: 20,
    status: "published",
  },

  // ------------------------------------------------------------------
  // Day 29 - Friday 4 Sep 2026 - Statement-Conclusion & Logical Deduction
  // ------------------------------------------------------------------
  {
    date: "2026-09-04", dow: "fri", weekId: "2026-08-31", type: "lesson",
    title: "Day 29: Statement-Conclusion & Logical Deduction",
    difficulty: "Hard",
    estimatedMinutes: 20,
    concept: `## "I Did Not Say That"

::: story
Your little brother looks out of the window and says, "It is raining."

You say, "So the match is off."

He frowns. "I did not say that."

And he is right, annoyingly. He gave you exactly one fact. You supplied a second fact out of your own head - that rain cancels matches - and then presented the pair as though both had come from him. But maybe the match is indoors. Maybe it is a drizzle. Maybe they have covers, or the match is in another city.

A whole section of every placement paper is built on that single move. They hand you a statement, they offer you some conclusions, and your only job is to spot which conclusions were smuggled in from outside.
:::

## The One Test That Decides Everything

Treat the statement as the **entire universe of facts**. Nothing you know about the real world is admissible. Then, for each conclusion, try to break it:

Can you invent a world where the statement is completely true and the conclusion is still false?

If you can invent even one such world, the conclusion **does not follow**. If you genuinely cannot, it follows.

Run it on a real pair.

  Statement: All the books in this library are new.
  Conclusion I:  The library was set up recently.
  Conclusion II: No book in this library is old.

Conclusion I sounds so reasonable that most students tick it. But invent a world: a fifty-year-old library that replaced its entire damaged collection last month. The statement is true there and the conclusion is false. **Does not follow.**

Conclusion II looks too obvious to be worth a mark, so most students reject it. But try to break it - you cannot. If every book is new, then no book is old; it is the same sentence wearing a different shirt. **It follows.**

That pairing is the whole lesson in miniature: the interesting-sounding conclusion is usually the trap, and the boring restatement is usually the answer.

::: table Three words papers use as though they were interchangeable
Word | What it is | Where it sits | How to test it
Assumption | Something unstated that the statement takes for granted | BEHIND the statement | Negate it. If the statement now makes no sense, it was an assumption.
Inference | Something unstated but very likely, given the facts | BEYOND the statement | Would a careful reader accept it as probable, not certain?
Conclusion | Something that MUST be true if the statement is true | INSIDE the statement | Can you invent a world where the statement holds and this fails?
:::

The negation test is worth practising, because it turns assumption questions from guesswork into a check.

  Statement: To reduce traffic jams in the city, the metro fare has been cut by 30%.
  Candidate: Some car users will switch to the metro because of the lower fare.

Negate it: *no* car user will switch. Now the fare cut cannot possibly reduce traffic jams, and the statement's own logic collapses. So it is an assumption - the statement leans on it without ever saying it.

::: flow Testing any one conclusion
Read only the statement :: This is the whole universe of facts. Real-world knowledge is not admissible evidence.
Try to break the conclusion :: Invent a world where the statement is true and the conclusion is false.
You found such a world :: It does not follow. Move on without arguing with yourself.
You genuinely cannot :: It follows, even if it sounds too obvious to be worth marking.
:::

## Strong Argument or Weak Argument

A different question type gives you a policy question and two arguments, and asks which are **strong**. Strong has a technical meaning here, and it is not "which side do I agree with".

A **strong** argument is directly relevant to the question asked, and gives a substantial reason tied to the actual outcome. A **weak** argument is vague, emotional, an appeal to tradition, a single anecdote, a superficial comparison with somewhere else, or a restatement of the question with "yes" or "no" attached.

  Question: Should mobile phones be banned inside school classrooms?
  Argument I:  Yes, because a phone is the single largest source of
               distraction, and a classroom exists precisely to hold
               undivided attention.
  Argument II: No, because students in developed countries are allowed
               to carry phones.

Argument I is strong: it names a mechanism (distraction) and connects it to the classroom's purpose. Argument II is weak: what other countries permit is a comparison, not a reason, and it says nothing about what would actually happen in a classroom.

## Course of Action

Here you get a problem and some proposed steps, and you decide which ones "follow". A course of action follows only if all three hold: the problem is real, the step is **practical**, and it is within the **authority** of whoever would carry it out. Extreme, disproportionate or ban-everything responses never follow.

  Statement: A large number of night-time accidents on a particular highway
             are caused by over-speeding trucks.
  Action I:  Speed cameras should be installed on that stretch and
             violators fined.
  Action II: Trucks should be permanently banned from that highway.

Action I follows - it is practical, it belongs to the highway authority, and it attacks the stated cause. Action II does not - trucks have a legitimate need for the highway, and the problem was over-speeding, not trucks.

::: mistake
The number one mistake is importing real-world knowledge. You are not being asked what is true; you are being asked what **follows from these words**. "All the books are new, therefore the library is new" fails not because it is implausible but because the statement never mentioned when the library was built. Every time you catch yourself thinking "well, obviously in practice...", you are about to lose a mark.

The number two mistake is accepting absolute words. Scan every option for **all, only, never, every, must, immediately, cannot**. A moderate statement almost never supports an absolute conclusion. "Most students who took coaching scored above 80" does not support "coaching guarantees above 80" - one word, "guarantees", broke it.

The number three mistake is the opposite reflex: rejecting a conclusion for being too obvious. If a conclusion merely restates the statement in different words, it **follows**, and it is often the intended answer. Papers put it there precisely because students distrust easy marks.

And a fourth, specific to strong-versus-weak: do not mark an argument strong because you agree with its side. Judge the *reason*, not the position. "No, because our parents' generation managed without it" is weak no matter how sound the conclusion happens to be.
:::

::: remember
- A conclusion follows only if it survives the break-it test: no world exists where the statement is true and the conclusion is false.
- An **assumption** hides behind the statement (negate it and the statement collapses). An **inference** goes beyond it (probable, not certain). A **conclusion** is already inside it (certain).
- Absolute words in an option are usually a trap; hedged words like *some*, *may* or *at least one* usually survive.
- "Some A are B" always gives back "Some B are A". "All A are B" never gives back "All B are A".
- For a course of action, ask three things: is the problem real, is the step practical, and does the actor actually have the authority?
:::

::: checkpoint
Statement: Most of the students who took extra coaching scored above 80%. Which conclusion definitely follows?
- ( ) Extra coaching guarantees a score above 80%
- (x) At least some students who took extra coaching scored above 80%
- ( ) Students who did not take coaching scored below 80%
- ( ) All the high scorers had taken extra coaching
> "Most" definitely covers "at least some", so the second option cannot be broken. The first swaps "most" for "guarantees", which is an absolute the statement never earned. The third and fourth both make claims about students the statement never mentioned - those who skipped coaching, and high scorers in general. Notice again that the dullest-looking option is the only survivor.
:::

::: revision
Treat the statement as the **whole universe of facts** and admit nothing from the real world. A conclusion follows only if you cannot invent a single world where the statement is true and the conclusion is false - which makes a plain restatement of the statement a valid conclusion, however obvious it looks, and makes any plausible-but-unstated addition invalid, however sensible it sounds. Keep the three words apart: an **assumption** sits behind the statement and is confirmed by the negation test (deny it and the statement stops making sense); an **inference** goes beyond the statement and needs only to be probable; a **conclusion** is already contained in the statement and must be certain. Hunt for absolutes - all, only, never, every, guarantees, immediately - because a moderate statement will not support them, while hedged wording like *some* or *at least one* usually survives. An argument is **strong** when it names a mechanism tied to the actual question, and **weak** when it is vague, emotional, an appeal to tradition or a comparison with elsewhere - judge the reason, never the side. A **course of action** follows only when the problem is real, the step is practical, and the actor has the authority; bans and evacuations almost never qualify.
:::`,
    mcqs: [
      {
        id: "q1",
        text: "Statement: All the trees in the park have been marked for cutting. Conclusions: I. The park will be cleared of trees. II. Some trees in the park have been marked. Which conclusion follows?",
        options: ["Only conclusion I follows", "Only conclusion II follows", "Both conclusions follow", "Neither conclusion follows"],
        correctIndex: 1,
        explanation: "Being marked for cutting is not the same as being cut - a court order or a change of plan breaks conclusion I, so it does not follow. Conclusion II is weaker than the statement itself: if all the trees are marked then certainly some are, and no world can make that false. Only II follows.",
      },
      {
        id: "q2",
        text: "A notice in an office building reads: 'Please use the staircase; the lift is out of order.' Which of the following is an assumption implicit in this notice?",
        options: ["The building has a staircase that people are able to use.", "The lift will never be repaired.", "All the employees prefer the lift to the staircase.", "The staircase is safer than the lift."],
        correctIndex: 0,
        explanation: "Apply the negation test. If the building has no usable staircase, the instruction is meaningless, so the notice depends on that fact without stating it - a textbook assumption. The other three are not needed for the notice to make sense: 'out of order' says nothing about repair prospects or preferences, and safety is never at issue.",
      },
      {
        id: "q3",
        text: "Statement: In order to reduce traffic congestion in the city, the metro fare has been cut by 30%. Which of the following is an assumption implicit in this decision?",
        options: ["Some car users will shift to the metro because of the lower fare.", "The metro currently runs almost empty.", "A 30% cut is the largest reduction the metro can afford.", "Traffic congestion cannot be reduced by any other measure."],
        correctIndex: 0,
        explanation: "Negate each candidate. If no car user shifts, the fare cut cannot reduce congestion at all and the decision loses its logic - so that one is assumed. The decision works perfectly well whether or not the metro runs empty, whether or not 30% is the maximum, and whether or not other measures exist, so none of those is assumed.",
      },
      {
        id: "q4",
        text: "Statement: A sharp rise in dengue cases has been reported from the eastern part of the city this month. Courses of action: I. The civic body should immediately begin fogging and clear stagnant water in that area. II. All residents of the eastern part of the city should be relocated. Which course of action follows?",
        options: ["Only course of action I follows", "Only course of action II follows", "Both follow", "Neither follows"],
        correctIndex: 0,
        explanation: "Action I is practical, sits squarely within the civic body's authority, and attacks the stated cause (mosquito breeding). Action II is wildly disproportionate and not implementable - relocating a whole zone of a city over one month's case rise fails both the practicality and the proportionality test.",
      },
      {
        id: "q5",
        text: "Question: Should mobile phones be banned inside school classrooms? Arguments: I. Yes, a phone is the single largest source of distraction, and a classroom exists precisely to hold undivided attention. II. No, because students in developed countries are allowed to carry phones. Which argument is strong?",
        options: ["Only argument I is strong", "Only argument II is strong", "Both arguments are strong", "Neither argument is strong"],
        correctIndex: 0,
        explanation: "Argument I names a mechanism (distraction) and ties it to the classroom's actual purpose, which is what makes an argument strong. Argument II is a superficial comparison with elsewhere: what other countries permit is neither a reason nor evidence about outcomes in an Indian classroom, so it is weak.",
      },
      {
        id: "q6",
        text: "Statement: Over the last five years, the number of students opting for computer science at this university has doubled. Which conclusion follows?",
        options: ["Interest in computer science at this university has grown over the last five years.", "Computer science is now the most popular subject at this university.", "Other departments at the university have lost students.", "The university has doubled its total intake."],
        correctIndex: 0,
        explanation: "A doubling of the count is growth in interest by definition, and no world makes that false. But doubling from a small base need not make it the largest department, other departments may have grown too, and total intake could have risen, fallen or stayed flat - each of the other three can be broken with one counter-example.",
      },
      {
        id: "q7",
        text: "Statement: The state has recorded its lowest rainfall in 40 years, and its reservoirs stand at 22% of capacity. Which of the following is the most reasonable inference?",
        options: ["The state is likely to face water shortages in the coming months.", "It will not rain in the state again.", "The reservoirs were badly designed.", "Rainfall in the state has fallen every year for the last 40 years."],
        correctIndex: 0,
        explanation: "An inference needs to be probable, not certain, and record-low rainfall with reservoirs at under a quarter of capacity makes shortages a well-supported expectation. The second option is absurd, the third invents a cause the statement never touches, and the fourth confuses 'lowest in 40 years' with a 40-year monotonic decline.",
      },
      {
        id: "q8",
        text: "Statement: Every player in the team can bowl, and some of them can bat. Which conclusion definitely follows?",
        options: ["At least one player can both bat and bowl.", "Most players in the team can bat.", "The team's batting is weaker than its bowling.", "Some players in the team cannot bowl."],
        correctIndex: 0,
        explanation: "The players who can bat are members of the team, and every member can bowl, so those players do both - at least one such player exists. 'Some' never upgrades to 'most', the statement makes no comparison of strength, and the last option directly contradicts 'every player can bowl'.",
      },
      {
        id: "q9",
        text: "An advertisement reads: 'Buy our water purifier - it removes 99.9% of bacteria.' Which of the following is an assumption implicit in the advertisement?",
        options: ["Buyers consider bacteria-free water desirable.", "No other purifier on the market removes bacteria.", "Tap water in every city is unsafe to drink.", "The remaining 0.1% of bacteria is harmless."],
        correctIndex: 0,
        explanation: "Negate it: if buyers did not care about bacteria, the entire pitch would be pointless, so the ad leans on that preference without stating it. The ad never claims uniqueness, never generalises about tap water everywhere, and certainly never asserts that the surviving bacteria are harmless - that last one would undercut its own selling point.",
      },
      {
        id: "q10",
        text: "Statement: Several passengers were injured when people riding the footboard of an overcrowded local train fell off during peak hours. Courses of action: I. The railway should increase train frequency during peak hours. II. Footboard travelling should be strictly penalised with on-the-spot fines. III. The local train service should be shut down until the problem is solved. Which follow?",
        options: ["Only I follows", "Only I and II follow", "Only III follows", "All three follow"],
        correctIndex: 1,
        explanation: "Action I attacks the root cause, overcrowding, and is within the railway's authority. Action II attacks the immediate dangerous behaviour and is enforceable. Action III fails on practicality and proportionality alike - shutting down a city's local trains would harm far more people than the problem does, so only I and II follow.",
      },
      {
        id: "q11",
        text: "Statement: In an office, 60% of the employees are women, and 40% of the women are engineers. Which conclusion definitely follows?",
        options: ["24% of all the employees are women engineers.", "40% of all the employees are engineers.", "Most of the engineers in the office are women.", "There are more women engineers than men in the office."],
        correctIndex: 0,
        explanation: "Women engineers are 40% of 60%, which is 0.4 x 0.6 = 24% of all employees - forced by the statement. The 40% figure applies only to the women, not to everyone; nothing at all is said about male engineers, so neither the third nor the fourth option can be established.",
      },
      {
        id: "q12",
        text: "Statement: The new bridge has cut the travel time between the two towns from 90 minutes to 35 minutes. Which of the following is a CONCLUSION that must be true, rather than an assumption or a guess?",
        options: ["Travel between the two towns is now faster than it was before the bridge.", "People wanted a faster route between the two towns.", "The bridge was expensive to build.", "The old road between the towns will now be abandoned."],
        correctIndex: 0,
        explanation: "35 minutes being less than 90 minutes IS the statement, restated, so it cannot be broken - that is what makes it a conclusion. Wanting a faster route sits behind the decision to build, making it an assumption, not a conclusion. Cost and the fate of the old road are never mentioned at all.",
      },
      {
        id: "q13",
        text: "Question: Should engineering colleges in India make an internship compulsory for graduation? Arguments: I. Yes, because students should not waste their final year. II. No, because our parents' generation graduated without internships. Which argument is strong?",
        options: ["Only argument I is strong", "Only argument II is strong", "Both arguments are strong", "Neither argument is strong"],
        correctIndex: 3,
        explanation: "Argument I is vague: 'waste' is asserted rather than shown, and it never says what an internship would actually achieve. Argument II is a pure appeal to tradition - what an earlier generation did is not a reason about present outcomes. Neither names a mechanism tied to the question, so both are weak.",
      },
      {
        id: "q14",
        text: "Statement: All the doctors at the camp were vaccinated, and Rahul was one of the doctors at the camp. Which conclusion definitely follows?",
        options: ["Rahul was vaccinated.", "Rahul is now immune to the disease.", "Only doctors were vaccinated at the camp.", "Rahul was vaccinated at the camp."],
        correctIndex: 0,
        explanation: "This is a clean syllogism: all members of a set have a property, Rahul is a member, so Rahul has it. Immunity is real-world knowledge the statement never supplies. 'Only doctors' adds an exclusivity that was never claimed. And the last option quietly adds a location - the statement says the camp's doctors were vaccinated, not that the vaccination happened at the camp.",
      },
      {
        id: "q15",
        text: "Statement: The price of onions has risen sharply because the crop failed in two major onion-growing states. Conclusions: I. Onion prices will fall as soon as the next crop arrives. II. Onions are grown only in those two states. Which conclusion follows?",
        options: ["Only conclusion I follows", "Only conclusion II follows", "Both conclusions follow", "Neither conclusion follows"],
        correctIndex: 3,
        explanation: "Conclusion I asserts a future certainty the statement cannot support - demand, hoarding, imports or another failure could all keep prices high. Conclusion II is contradicted by the statement's own wording: calling them two MAJOR growing states implies there are others. Neither follows.",
      },
    ],
    timedQuiz: { timeLimitSeconds: 300, mcqIds: ["q3", "q5", "q10", "q11", "q15"] },
    problemIds: [],
    xpReward: 50, coinReward: 20,
    status: "published",
  },

  // ------------------------------------------------------------------
  // Day 30 - Saturday 5 Sep 2026 - Aptitude Master Review (CAPSTONE)
  // ------------------------------------------------------------------
  {
    date: "2026-09-05", dow: "sat", weekId: "2026-08-31", type: "lesson",
    title: "Day 30: Aptitude Master Review",
    difficulty: "Hard",
    estimatedMinutes: 20,
    concept: `## Thirty Days Ago

::: remember
Thirty days ago, a question like "what is the remainder when 15 x 17 x 19 is divided by 7" would have made you reach for a calculator, then multiply 4845 by hand, then divide.

Today you reduce each factor first, multiply the leftovers, and answer in about eight seconds.

Nothing about your intelligence changed in a month. What changed is that you now own a **toolkit** - roughly forty specific shortcuts, each one attached to a recognisable question shape. That is the whole secret of aptitude tests, and it is why they are beatable: they are not measuring cleverness, they are measuring whether you have seen the shape before.

Today is not a new technique. Today is the inventory - one page for all thirty days - and then a mixed test that draws from every single week, exactly the way a real placement paper does.
:::

## Thirty Days On One Page

Do not read this table like prose. Read one row, look away, and try to state the shortcut back before you check. Anything you cannot state from memory is what tonight's revision is for.

::: table The whole series, one thing per topic
Week | Topic | The one thing to carry into the exam hall
1 | Number Systems | List last digits until they repeat (the cycle is always 1, 2 or 4 long), divide the exponent by the cycle length, read the position - and remember a remainder of 0 means the LAST entry.
1 | LCM and HCF | HCF x LCM = the product of the two numbers. LCM answers "when do they coincide again", HCF answers "largest equal groups".
1 | Percentages | A rise of x% followed by a fall of x% is never a wash: it is always a net LOSS of x squared over 100 percent.
1 | Ratio and Proportion | Turn a : b into ak and bk on sight. One more sentence in the question then fixes k, and every fraction disappears.
1 | Averages | Total = average x count, and that identity solves almost everything. Two averages may be averaged directly only when the two counts are equal.
2 | Profit and Loss | Profit percent is always on COST price; discount percent is always on MARKED price. Two different bases, never interchangeable.
2 | Simple and Compound Interest | SI = PRT/100. CI amount = P(1 + R/100) to the power n. For exactly 2 years, CI - SI = P times (R/100) squared.
2 | Time and Work | Take total work as the LCM of the given days. Each person's rate becomes a whole number of units per day and the fractions vanish.
2 | Pipes and Cisterns | Identical to time and work with one sign change: an outlet pipe's rate is negative.
2 | Time, Speed and Distance | Same distance means speed is inversely proportional to time. Convert km/h to m/s by multiplying by 5/18.
2 | Trains | Past a pole a train covers its own length; past a platform, its length plus the platform. Relative speed adds for opposite directions, subtracts for the same direction.
3 | Boats and Streams | boat = (downstream + upstream)/2 and stream = (downstream - upstream)/2. Two arithmetic steps and the question is over.
3 | Races | "A beats B by x metres" means that when A crosses the line, B still has x metres to run. Convert any head start given in seconds into metres using B's own speed.
3 | Permutations and Combinations | Order matters, use nPr; order does not, use nCr. Repeated letters divide, so LEADER is 6!/2! = 360.
3 | Probability | P = favourable/total, and "at least one" is almost always faster computed as 1 - P(none).
3 | Data Interpretation | Read the axis unit and identify the BASE the question wants before touching a single number. Percentage change = (new - old)/old x 100.
4 | Blood Relations | Draw generations as horizontal levels and always start from the speaker. In a "pointing to a photograph" question the speaker is never in the photograph unless stated.
4 | Coding-Decoding | Test letter-position shifts first (A = 1 up to Z = 26), then whole-word reversal, then a combination of the two. Most codes are one of those three.
4 | Syllogisms | A conclusion follows only if it holds in EVERY valid Venn diagram. "Some A are B" always gives back "Some B are A"; "All A are B" never gives back "All B are A".
4 | Number and Letter Series | First differences, then second differences. If neither settles, test ratios, squares, cubes, and two interleaved series.
4 | Direction Sense | Sketch every turn. The net displacement closes a right triangle, so Pythagoras finishes it. On your sketch a left turn is anticlockwise.
4 | Seating Arrangement | Fix the most-mentioned person first, then work outward. Facing the centre, a person's left is clockwise on your page.
5 | Circular Seating and Puzzles | (n - 1)! at a plain round table, n! if the seats are numbered, (n - 1)!/2 for a necklace. Opposite means n/2 seats away, in either direction.
5 | Data Sufficiency | Judge Statement I with II covered, then II with I wiped, and only then combine. Sufficient means a unique answer EXISTS, not that you found it.
5 | Clocks | The angle is the absolute value of 30H - 5.5M. The hour hand also creeps 0.5 degrees every minute, and forgetting that is the classic loss.
5 | Calendars | Odd days are days mod 7: ordinary year 1, leap year 2, 100 years 5, 200 years 3, 300 years 1, 400 years 0. A century year is a leap year only if divisible by 400.
5 | Mixtures and Alligation | cheaper : dearer = (dearer - mean) : (mean - cheaper), so the distances SWAP sides. The mixture always leans toward whichever ingredient there is more of.
5 | Statement-Conclusion | A conclusion follows only if you cannot invent a world where the statement is true and it is false. Never import real-world knowledge.
:::

## Final Diagnostic

The fifteen questions below are deliberately shuffled - number systems next to compound interest next to coding-decoding - because that is exactly what a placement paper does to you. A real TCS or Infosys aptitude section does not label its sections, and the first skill it tests is **recognising which tool a question wants** before you start computing.

::: tip How to attempt a genuinely mixed paper
Do one pass, and on that pass answer only what you recognise immediately. Anything that needs more than a few seconds of "hmm, which topic is this" gets a mark in the margin and nothing else. Then come back.

Two reasons this works. First, mixed papers are usually tight on time, and the easy marks are scattered rather than front-loaded - a question you can do in twenty seconds may be sitting at number 27. Second, sitting on one hard question drains the confidence you need for the next twelve.

And when you do come back, name the topic out loud before you touch the numbers. "This is alligation." "This is odd days." Naming it correctly is most of the work, because the shortcut comes attached to the name.
:::

::: checkpoint
A shopkeeper marks a product 25% above its cost price and then offers a 25% discount on the marked price. What happens?
- ( ) He makes a 6.25% profit
- ( ) He breaks even, neither profit nor loss
- (x) He makes a 6.25% loss
- ( ) He makes a 25% loss
> Take the cost as 100. The marked price is 125, and 25% off 125 removes 31.25, leaving a selling price of 93.75 - a loss of 6.25%. The two percentages do not cancel because they are taken on **different bases**: the markup on cost, the discount on marked price. This is precisely the x% up then x% down rule from Week 1, where the net effect is always a loss of x squared over 100, which is 625/100 = 6.25%. Two topics, one identity, thirty days apart.
:::

::: revision
Thirty days. You started with divisibility rules and remainders, and you are finishing with data sufficiency, odd days and alligation - and along the way you built something that is genuinely yours: a toolkit of about forty shortcuts, each one wired to a question shape you can now recognise on sight.

Here is what actually happened. In Week 1 you stopped fearing arithmetic, because percentages, ratios and averages turned out to be three views of one idea. In Week 2 you learned that almost every word problem is a rate problem, whether the thing flowing is money, work or distance. In Week 3 you learned to count without listing, and to read a chart before computing from it. In Week 4 you learned that reasoning is drawing - a family tree, a Venn diagram, a sketch of turns - and that the person who draws beats the person who thinks harder. And this week you learned the two hardest habits of all: judging whether information is *sufficient* before solving, and refusing to import what you know about the world into what the words actually said.

What is left is not learning. It is **reps**. Aptitude sections are won on recognition speed, and recognition speed comes from volume: full mock papers under a clock, one topic revised each evening off the table above, and an honest log of every question you got wrong so the same shape never catches you twice. Keep a single notebook page per topic with only the shortcut on it, and reread all thirty in the twenty minutes before you walk into the test.

You are not walking into that room hoping to be clever on the day. You are walking in with a toolkit, and the questions have already told you which tool they want. Go and use it.
:::`,
    mcqs: [
      {
        id: "q1",
        text: "What is the remainder when 3^40 is divided by 5?",
        options: ["1", "2", "3", "4"],
        correctIndex: 0,
        explanation: "Powers of 3 leave remainders 3, 4, 2, 1 on division by 5, repeating with period 4. Since 40 = 4 x 10 exactly, the remainder is 0 for the cycle position, which points at the LAST entry, 1. Equivalently 3^4 = 81 leaves 1, so 3^40 = (3^4)^10 also leaves 1.",
      },
      {
        id: "q2",
        text: "The HCF of two numbers is 12 and their LCM is 336. If one of the numbers is 84, what is the other?",
        options: ["36", "42", "48", "56"],
        correctIndex: 2,
        explanation: "For exactly two numbers, HCF x LCM = their product, so the product is 12 x 336 = 4032 and the other number is 4032 / 84 = 48. Check: HCF(84, 48) = 12 and LCM = 84 x 48 / 12 = 336.",
      },
      {
        id: "q3",
        text: "The price of a laptop is first increased by 20% and then decreased by 20%. What is the net change in its price?",
        options: ["No change", "A 4% increase", "A 4% decrease", "A 2% decrease"],
        correctIndex: 2,
        explanation: "An x% rise followed by an x% fall is always a net loss of x squared over 100 percent, so here it is 400/100 = 4% down. Trace it on 100: up 20% gives 120, and 20% off 120 removes 24, leaving 96. The two percentages act on different bases, which is why they never cancel.",
      },
      {
        id: "q4",
        text: "The average of 11 numbers is 50. The average of the first six is 49 and the average of the last six is 52. What is the sixth number?",
        options: ["50", "52", "56", "60"],
        correctIndex: 2,
        explanation: "Total of all eleven = 11 x 50 = 550. First six total 6 x 49 = 294 and last six total 6 x 52 = 312, summing to 606 - but that sum counts the sixth number twice, since it belongs to both groups. So the sixth number is 606 - 550 = 56.",
      },
      {
        id: "q5",
        text: "A shopkeeper marks his goods 40% above cost price and then allows a discount of 25% on the marked price. What is his profit percentage?",
        options: ["5%", "10%", "15%", "105%"],
        correctIndex: 0,
        explanation: "Take cost as 100. Marked price is 140, and a 25% discount leaves 140 x 0.75 = 105, so the profit is 5%. Subtracting the percentages (40 - 25 = 15) is the classic error - the markup is on cost while the discount is on the marked price.",
      },
      {
        id: "q6",
        text: "The difference between the compound interest and the simple interest on a certain sum for 2 years at 10% per annum is Rs 40. What is the sum?",
        options: ["Rs 2,000", "Rs 3,000", "Rs 4,000", "Rs 5,000"],
        correctIndex: 2,
        explanation: "For exactly two years the gap is P times (R/100) squared, so 40 = P x (0.1) squared = P/100, giving P = Rs 4,000. Check: SI = 4000 x 10 x 2 / 100 = 800, while CI = 4000(1.21 - 1) = 840, and the difference is 40.",
      },
      {
        id: "q7",
        text: "A can complete a piece of work in 12 days and B can complete the same work in 18 days. Working together, how long will they take?",
        options: ["6 days", "7 and 1/5 days", "8 days", "9 days"],
        correctIndex: 1,
        explanation: "Take the total work as LCM(12, 18) = 36 units. A does 3 units a day and B does 2, so together 5 units a day, taking 36/5 = 7.2 days = 7 and 1/5 days. Averaging the two durations to 15 is the standard trap - rates add, times do not.",
      },
      {
        id: "q8",
        text: "A 150 m long train running at 72 km/h crosses a platform in 15 seconds. What is the length of the platform?",
        options: ["100 m", "120 m", "150 m", "180 m"],
        correctIndex: 2,
        explanation: "Convert the speed: 72 x 5/18 = 20 m/s. In 15 seconds the train covers 300 m, and crossing a platform means covering the train's own length plus the platform, so the platform is 300 - 150 = 150 m. Forgetting to subtract the train's length gives 300.",
      },
      {
        id: "q9",
        text: "A boat covers 24 km downstream in 3 hours and the same 24 km upstream in 4 hours. What is the speed of the stream?",
        options: ["0.5 km/h", "1 km/h", "2 km/h", "7 km/h"],
        correctIndex: 1,
        explanation: "Downstream speed is 24/3 = 8 km/h and upstream is 24/4 = 6 km/h. The stream is half their difference: (8 - 6)/2 = 1 km/h. (The boat's own speed is half their sum, 7 km/h - which is the option placed there to catch a misread.)",
      },
      {
        id: "q10",
        text: "In how many distinct ways can the letters of the word LEADER be arranged?",
        options: ["72", "144", "360", "720"],
        correctIndex: 2,
        explanation: "LEADER has 6 letters with E appearing twice, so the count is 6!/2! = 720/2 = 360. Answering 720 forgets that swapping the two identical Es produces no new arrangement.",
      },
      {
        id: "q11",
        text: "Two dice are thrown together. What is the probability that the sum of the numbers shown is 9?",
        options: ["1/6", "1/9", "1/12", "5/36"],
        correctIndex: 1,
        explanation: "Total outcomes are 6 x 6 = 36. Sums of 9 come from (3,6), (4,5), (5,4) and (6,3) - four ordered outcomes - so the probability is 4/36 = 1/9. Counting (3,6) and (6,3) as one outcome gives 2/36 = 1/18 and misses the answer.",
      },
      {
        id: "q12",
        text: "Pointing to a photograph, Meera said, 'He is the son of the only son of my grandfather.' How is the man in the photograph related to Meera?",
        options: ["Her cousin", "Her brother", "Her uncle", "Her nephew"],
        correctIndex: 1,
        explanation: "Work outward from the speaker. The only son of Meera's grandfather is Meera's father. The son of Meera's father is therefore Meera's brother. 'Cousin' would require a second son of the grandfather, which 'only son' explicitly rules out.",
      },
      {
        id: "q13",
        text: "In a certain code, MONKEY is written as XDJMNL. How is TIGER written in that same code?",
        options: ["QDFHS", "SHFDQ", "UJHFS", "SDFHQ"],
        correctIndex: 0,
        explanation: "Two steps. Shift each letter of MONKEY back by one to get LNMJDX, then reverse the whole string to get XDJMNL - which matches. Apply the same rule to TIGER: back one gives SHFDQ, and reversing that gives QDFHS. Option SHFDQ is the answer with the reversal step forgotten, and UJHFS shifts forward instead of back.",
      },
      {
        id: "q14",
        text: "Statements: All roses are flowers. Some flowers fade quickly. Conclusions: I. Some roses fade quickly. II. All flowers are roses. Which conclusion follows?",
        options: ["Only conclusion I follows", "Only conclusion II follows", "Both conclusions follow", "Neither conclusion follows"],
        correctIndex: 3,
        explanation: "Draw the Venn diagram. The 'flowers that fade quickly' region can be placed entirely outside the roses circle, so conclusion I fails in at least one valid diagram and therefore does not follow. Conclusion II reverses a universal - 'all roses are flowers' never yields 'all flowers are roses'. Neither follows.",
      },
      {
        id: "q15",
        text: "What is the angle between the hour hand and the minute hand of a clock at 4:20?",
        options: ["0 degrees", "10 degrees", "20 degrees", "30 degrees"],
        correctIndex: 1,
        explanation: "Apply the absolute value of 30H - 5.5M: 30(4) - 5.5(20) = 120 - 110 = 10 degrees. At 4:20 the minute hand sits exactly on the 4 at 120 degrees, but the hour hand has already crept a third of the way past it, to 130 degrees. Assuming both hands are on the 4 gives the trap answer of 0.",
      },
    ],
    timedQuiz: { timeLimitSeconds: 300, mcqIds: ["q3", "q6", "q10", "q13", "q15"] },
    problemIds: [],
    xpReward: 80, coinReward: 30,
    status: "published",
  },

];

export default WEEK5_DAYS;
