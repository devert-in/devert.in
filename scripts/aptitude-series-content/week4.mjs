// DeVert Campus - Aptitude Series, Week 4: Logical Reasoning I
// (Mon 24 Aug - Sat 29 Aug 2026). Days 19-24 of the 30-day series.
//
// Placement-aptitude prep for engineering students sitting TCS / Infosys /
// Accenture / Cognizant / Capgemini / Wipro / Deloitte / Oracle / Amazon /
// Microsoft / Google campus rounds.
//
// AUTHORING RULES (same as week1.mjs - kept here so this file reads alone):
//
//  1. `concept` is ONE string parsed by devert-frontend/lib/lessonBlocks.js.
//     Fence syntax is `::: variant optional title` ... `:::`, each on its own
//     line. Inside a `flow` fence NEVER write "->" in a step body - the parser
//     splits flow lines on it. Inside a `table` fence never write "|" in a
//     cell - that is the column separator. Two-space-indented lines become
//     code blocks, so traced reasoning is indented on purpose.
//  2. Story or concrete puzzle FIRST, technical name SECOND. Never open a
//     lesson with a rule. Every worked example is traced with real names,
//     real letters, real coordinates - never "some person X".
//  3. Callouts are used sparingly and purposefully: one `mistake`, one
//     `remember`/`funfact`, exactly one `checkpoint`, and a closing
//     `revision` that works as a 30-second pre-exam re-read.
//  4. MCQ shape is `{ id, text, options, correctIndex, explanation }` -
//     `text`, NOT `question` (see campus-daily-learning-editor.jsx's
//     blankMcq()). `correctIndex` is 0-based into that question's own
//     `options`. Reasoning is exactly where a rushed answer feels right and
//     is wrong, so EVERY answer below was derived by hand - family tree
//     drawn, code rule checked on every letter, Venn counter-diagram
//     attempted, grid coordinates tracked, seat slots filled - and then
//     re-verified a second time. Every explanation shows the load-bearing
//     step so a student (or a future editor) can check it without redoing
//     the whole puzzle.
//  5. Wrong options are real reasoning slips a student would actually make
//     (reading a relation chain left to right, deriving a letter shift from
//     the first letter only, converting "All A are B" into "All B are A",
//     turning left while facing south and landing west), never filler.
//  6. `timedQuiz.mcqIds` are 5 ids drawn from that same day's `mcqs`.
//  7. ASCII hyphens only - scripts/normalize-dashes.mjs rewrites em/en dashes
//     across the database, so authoring them here just creates churn.

export const WEEK4_DAYS = [

  // ------------------------------------------------------------------
  // Day 19 - Monday 24 Aug 2026 - Blood Relations
  // ------------------------------------------------------------------
  {
    date: "2026-08-24", dow: "mon", weekId: "2026-08-24", type: "lesson",
    title: "Day 19: Blood Relations",
    difficulty: "Medium",
    estimatedMinutes: 18,
    concept: `## The Aunt At The Wedding

::: story
You are at a cousin's wedding. A woman in a green saree walks up, pinches your cheek, and says: **"You have grown so tall! I am your mother's brother's wife."**

You smile and nod. And in your head, in about two seconds, you have already worked it out: mother's brother is your maternal uncle, so his wife is your aunt.

Nobody taught you a rule for that. You did it by *walking the chain* - mother, then her brother, then his wife - one hop at a time, in order.

That is the entire subject. A blood-relations question is a woman in a green saree with a longer sentence.
:::

## Walk The Chain Backwards, Not Forwards

Here is the sentence a placement paper actually gives you:

**Introducing a man, a woman said, "His wife is the only daughter of my father."** How is the man related to the woman?

Most students read left to right, hit the word "father", and answer "father-in-law". Wrong - and it is wrong for a reason worth understanding.

In English, a chain of "of" phrases has to be resolved **from the right**, because each "of" means *belongs to the thing on my right*. The rightmost noun is the only one that stands on its own. So start there and walk left.

::: flow Resolving "his wife is the only daughter of my father"
my father :: the far-right anchor - the speaker's own father. This is the only person named without depending on anybody else
the only daughter of my father :: the speaker herself. She is female, and she is her father's only daughter
his wife is the speaker :: so the man in front of her is married to her
Answer: her husband :: the man is the woman's husband, and nothing in the sentence ever suggested a father-in-law
:::

Notice how the answer was never visible until the last hop. That is normal. Do not answer early.

## Draw It, Do Not Hold It

Two hops you can do in your head. Five you cannot, and papers know that. So the discipline is: **the moment a question has more than two relations, draw.**

::: cards How to draw a family tree in ten seconds
One row per generation :: Grandparents on top, parents below, children below that. Never let two generations share a row - that single habit prevents most wrong answers.
Marriage is an equals sign :: Write \`A = B\` on one row to mean A is married to B. Spouses are always the same generation.
Parent to child drops down :: A short vertical line down from the couple, with all their children side by side on the row beneath.
Mark gender the instant you learn it :: Put \`+\` for male and \`-\` for female next to a name as soon as a clue tells you. "Son", "brother", "husband", "father" are all male; "daughter", "sister", "wife", "mother" are all female.
Leave gender blank when it is not given :: A name is not a clue. A paper will happily hand you a Kiran or an Anu whose gender is never stated, then offer you "aunt" and "uncle" as two separate options.
:::

::: table Relation shorthand worth having memorised
Clue phrase | Resolves to | Its partner
Father's brother | Paternal uncle | his wife is your aunt
Mother's brother | Maternal uncle | his wife is your aunt
Father's sister | Paternal aunt | her husband is your uncle
Mother's sister | Maternal aunt | her husband is your uncle
Brother's son | Nephew | brother's daughter is your niece
Sister's son | Nephew | sister's daughter is your niece
Mother's father | Maternal grandfather | father's father is your paternal grandfather
Daughter's son | Grandson | daughter's daughter is your granddaughter
Wife's brother | Brother-in-law | wife's sister is your sister-in-law
Sister's husband | Brother-in-law | brother's wife is your sister-in-law
Uncle's son or daughter | Cousin | English gives you no gendered word here, which papers exploit
Father's only son | Yourself, if you are male | the single most common self-reference trap
:::

::: mistake
The number one error is reading the chain **forwards**.

Take **"A is the father of B's mother."** Read left to right and you get "A is B's father". Read it properly, from the right: B's mother is some woman M, and A is M's father, so A is B's **maternal grandfather** - a whole generation away from the answer you would have written.

The runner-up error is **inventing gender**. From "C is the child of D" you learn nothing about whether C is a son or a daughter, so you cannot choose between nephew and niece, or between aunt and uncle. When a question is built on this, "cannot be determined" is a real answer and not a cop-out.

Third: **"the only son of X" can be you.** In "Pointing to a photo, Ravi said, 'This is my father's only son'", the photo is Ravi himself.
:::

::: remember
**Start at the rightmost noun and walk left, one "of" at a time.** Say each hop out loud as a person: "my father" then "his only daughter" then "her husband". If you can name a real human at every hop, you cannot get lost.

Two facts that decide a surprising number of marks:
- "In-law" always means the relation arrives through a **marriage**, so somewhere in the chain there is an \`=\` sign.
- Maternal versus paternal is decided by which parent the chain passed **through**, never by whose side the answer feels like.
:::

::: checkpoint
Pointing to a woman, Ravi said, "She is the daughter of my grandfather's only son." How is the woman related to Ravi?
- ( ) His mother
- (x) His sister
- ( ) His aunt
- ( ) His cousin
> Walk it from the right. My grandfather is one person; his only son is Ravi's father (Ravi himself is the grandfather's grandson, not his son); and the daughter of Ravi's father is Ravi's sister. Answering "aunt" comes from treating the grandfather's only son as an uncle, which cannot be - if he were Ravi's uncle, Ravi's father would be a second son, and the clue says "only".
:::

::: revision
A blood-relations chain is resolved **right to left**, because every "of" points rightwards to the person it depends on: in "his wife is the only daughter of my father", you start at *my father*, get *the speaker herself*, and land on *her husband*. Draw the tree the moment there are more than two hops - one row per generation, \`=\` between spouses, a line dropping to children, and \`+\` or \`-\` marked beside every name whose gender a clue has actually given you. Know the shorthand cold: mother's brother is a maternal uncle, sister's son is a nephew, uncle's child is a cousin, and "father's only son" is very often the speaker himself. Three traps repeat forever: reading the chain forwards (which makes "father of B's mother" look like B's father instead of B's maternal grandfather), assuming a gender that was never stated (which makes "cannot be determined" a genuine answer), and forgetting that "in-law" always means the path went through a marriage.
:::`,
    mcqs: [
      {
        id: "q1",
        text: "Pointing at a photograph, Neha said, \"He is the only son of my mother's mother.\" How is the man related to Neha?",
        options: ["Her father", "Her brother", "Her maternal grandfather", "Her maternal uncle"],
        correctIndex: 3,
        explanation: "Start at the right: my mother's mother is Neha's maternal grandmother. Her only son is therefore Neha's mother's brother, which is Neha's maternal uncle. Answering grandfather comes from reading 'son of' as 'husband of'.",
      },
      {
        id: "q2",
        text: "A is B's brother. C is B's mother. D is C's father. How is A related to D?",
        options: ["Grandson", "Son", "Grandfather", "Nephew"],
        correctIndex: 0,
        explanation: "C is the mother of both B and A (A is B's brother, so they share parents). D is C's father, so D is one generation above C and two above A. A is male, so A is D's grandson.",
      },
      {
        id: "q3",
        text: "Rahul is the son of Meena's father's only son. How is Rahul related to Meena?",
        options: ["Her brother", "Her son", "Her nephew", "Her cousin"],
        correctIndex: 2,
        explanation: "Meena's father's only son is Meena's brother - it cannot be Meena, who is female. Rahul is that brother's son, so Rahul is Meena's nephew. Answering 'brother' comes from stopping one hop too early.",
      },
      {
        id: "q4",
        text: "Introducing a man, Seema said, \"He is the son of my father's mother's only son.\" How is the man related to Seema?",
        options: ["Her brother", "Her father", "Her cousin", "Her paternal uncle"],
        correctIndex: 0,
        explanation: "My father's mother is Seema's paternal grandmother; her only son is Seema's father (so Seema has no paternal uncle at all). The son of Seema's father is Seema's brother.",
      },
      {
        id: "q5",
        text: "P and Q are brothers. R and S are sisters. P's son is S's brother. How is Q related to R?",
        options: ["Her father", "Her brother", "Her grandfather", "Her uncle"],
        correctIndex: 3,
        explanation: "P's son is S's brother, so P's son and S are siblings, which makes P the father of S. R is S's sister, so P is R's father too. Q is P's brother, so Q is R's uncle.",
      },
      {
        id: "q6",
        text: "A woman introduces a man as the son of the brother of her mother. How is the man related to the woman?",
        options: ["Her nephew", "Her cousin", "Her brother", "Her maternal uncle"],
        correctIndex: 1,
        explanation: "The brother of her mother is her maternal uncle. That uncle's son is her cousin. Answering 'maternal uncle' means you stopped before the final 'son of' hop.",
      },
      {
        id: "q7",
        text: "Deepak said to Nitin, \"That boy playing football is the younger of the two brothers of the daughter of my father's wife.\" How is the boy related to Deepak?",
        options: ["His son", "His nephew", "His brother", "His cousin"],
        correctIndex: 2,
        explanation: "My father's wife is Deepak's mother; her daughter is Deepak's sister; the two brothers of that sister are Deepak and one other boy. Since Deepak is the one speaking and pointing at somebody else, the boy must be the other brother.",
      },
      {
        id: "q8",
        text: "Neha says, \"Anil's mother is the only daughter of my mother.\" How is Neha related to Anil?",
        options: ["His mother", "His sister", "His aunt", "His grandmother"],
        correctIndex: 0,
        explanation: "The only daughter of Neha's mother is Neha herself, since Neha is female and her mother has just one daughter. So Anil's mother is Neha, making Neha his mother. Answering 'aunt' assumes the only daughter is some other sister, which the word 'only' rules out.",
      },
      {
        id: "q9",
        text: "If 'A $ B' means A is the brother of B, 'A # B' means A is the mother of B, and 'A @ B' means A is the father of B, which expression shows that R is the maternal uncle of T?",
        options: ["R $ S # T", "R # S $ T", "R @ S $ T", "R $ S @ T"],
        correctIndex: 0,
        explanation: "A maternal uncle is the brother of the mother. So you need R to be the brother of S, and S to be the mother of T: R $ S # T. Note that R $ S @ T makes S the father of T, which would make R a paternal uncle instead - that is the trap option.",
      },
      {
        id: "q10",
        text: "Pointing to a lady, Ramesh said, \"The son of her only brother is the brother of my wife.\" How is the lady related to Ramesh?",
        options: ["His mother-in-law", "His wife's sister", "His grandmother", "The sister of his father-in-law"],
        correctIndex: 3,
        explanation: "Call the lady L and her only brother B. B's son is the brother of Ramesh's wife, so B's son and Ramesh's wife are siblings, which makes B the father of Ramesh's wife - that is, Ramesh's father-in-law. L is B's sister, so L is the sister of Ramesh's father-in-law.",
      },
      {
        id: "q11",
        text: "A family has exactly six members: A, B, C, D, E and F. A and B are a married couple, B being the female member. D is the only son of C, who is the brother of B. E is the sister of D. F is the brother of A. How many children does A have?",
        options: ["One", "Two", "Three", "None"],
        correctIndex: 3,
        explanation: "Account for all six: A (male) is married to B (female); C is B's brother; D is C's only son; E is D's sister, so also C's child; F is A's brother. Every member is placed, and both children in the family (D and E) belong to C, not to A. So A has no children.",
      },
      {
        id: "q12",
        text: "P is the father of Q. R is the son of S. T is the brother of P. Q is the sister of R. How is S related to T?",
        options: ["His wife", "His sister-in-law", "His sister", "His mother"],
        correctIndex: 1,
        explanation: "Q is R's sister and R is S's son, so S is a parent of both Q and R. P is already Q's father, so S must be Q's mother, that is P's wife. T is P's brother, so S is T's sister-in-law. Answering 'wife' forgets that S is married to P, not to T.",
      },
      {
        id: "q13",
        text: "Looking at a portrait of a man, Harsh said, \"His mother is the wife of my father's son. I have no brothers or sisters.\" Whose portrait was Harsh looking at?",
        options: ["His own", "His son's", "His father's", "His uncle's"],
        correctIndex: 1,
        explanation: "Harsh has no brothers, so 'my father's son' can only be Harsh himself. The portrait man's mother is therefore Harsh's wife, which makes the man Harsh's son. If it were Harsh's own portrait, his mother would have to be his father's wife, not his own wife.",
      },
      {
        id: "q14",
        text: "A is the mother of B and C. D is the husband of C. E is the daughter of C. How is B related to E?",
        options: ["E's aunt", "E's uncle", "It cannot be determined", "E's cousin"],
        correctIndex: 2,
        explanation: "B is C's sibling and E is C's daughter, so B is the sibling of E's mother. But nothing in the question ever states B's gender, and English needs it: a sister of the mother is an aunt, a brother is an uncle. With gender unstated the relation cannot be named.",
      },
      {
        id: "q15",
        text: "How is your mother's father's only daughter's husband related to you?",
        options: ["Your maternal uncle", "Your father", "Your grandfather", "Your brother-in-law"],
        correctIndex: 1,
        explanation: "Walk from the right: mother's father is your maternal grandfather; his only daughter is your own mother; her husband is your father. Answering 'maternal uncle' comes from reading 'only daughter' as 'son'.",
      },
    ],
    timedQuiz: { timeLimitSeconds: 300, mcqIds: ["q3", "q8", "q10", "q13", "q14"] },
    problemIds: [],
    xpReward: 50, coinReward: 20,
    status: "published",
  },

  // ------------------------------------------------------------------
  // Day 20 - Tuesday 25 Aug 2026 - Coding-Decoding
  // ------------------------------------------------------------------
  {
    date: "2026-08-25", dow: "tue", weekId: "2026-08-24", type: "lesson",
    title: "Day 20: Coding-Decoding",
    difficulty: "Medium",
    estimatedMinutes: 18,
    concept: `## The Note That Said IFMMP

::: story
In class 6, your friend slid a folded note across the desk. It said **IFMMP**.

You stared at it. Then you noticed something: I comes just after H. F comes just after E. M comes just after L. And suddenly the whole thing cracked open - every letter had been nudged one step forward, and the note actually said **HELLO**.

You did not know the word "cipher". You did not need it. You found the rule from the evidence in front of you, then ran the rule backwards.

That is the whole exam topic. The only difference is that a placement paper hands you the note *and* the translation, and then asks you to encode a brand new word.
:::

## The Rule Is Never In The First Letter

The single most reliable way to lose these marks is to check one letter, decide the rule, and charge ahead. So here is the discipline, on a real pair.

**If TEACHER is coded as VGCEJGT, how is STUDENT coded?**

Write the positions under both words. Every letter, no exceptions:

  T E A C H E R
  20 5 1 3 8 5 18

  V G C E J G T
  22 7 3 5 10 7 20

Now subtract, letter by letter: 22-20 = +2, 7-5 = +2, 3-1 = +2, 5-3 = +2, 10-8 = +2, 7-5 = +2, 20-18 = +2. Seven letters, one gap. **The rule is +2.** Only now is it safe to apply it.

  S T U D E N T
  19 20 21 4 5 14 20   plus 2 each
  21 22 23 6 7 16 22
  U V W F G P V

So STUDENT becomes **UVWFGPV**. Total work: two rows of subtraction and one row of addition, and zero guessing.

::: flow The four moves that crack almost any letter code
Number both words :: Write the position of every letter, A equals 1 through Z equals 26, under the word and under its code
Subtract letter by letter :: Code position minus word position, for EVERY letter. Six letters means six subtractions
Name what you see :: A constant gap is a shift. Gaps like plus 1, plus 2, plus 3 are a growing shift. Gaps that flip sign are two rules interleaved. Positions that add to 27 are the opposite letter
Apply it in the right direction :: Encoding uses the gap as found. Decoding uses the gap reversed. Wrap Z round to A and A back to Z
:::

::: table The alphabet, forwards and backwards
Letter | Position | Opposite letter | Why
A | 1 | Z | 1 plus 26 is 27
E | 5 | V | 5 plus 22 is 27
J | 10 | Q | 10 plus 17 is 27
M | 13 | N | 13 plus 14 is 27
N | 14 | M | 14 plus 13 is 27
O | 15 | L | 15 plus 12 is 27
T | 20 | G | 20 plus 7 is 27
Y | 25 | B | 25 plus 2 is 27
Z | 26 | A | 26 plus 1 is 27
:::

## The Five Codes That Cover A Paper

::: cards Recognise the family, and the work is already done
Fixed shift :: Every letter moves the same number of steps. \`TEACHER\` becomes \`VGCEJGT\` at plus 2. Watch the wrap: at plus 2, \`Y\` becomes \`A\` and \`Z\` becomes \`B\`.
Opposite letter :: Each letter is replaced by its mirror from the far end, so the two positions always add to 27. \`BAT\` becomes \`YZG\`, because 2 and 25, 1 and 26, 20 and 7 each add to 27.
Growing shift :: The gap itself climbs. \`FRIEND\` becomes \`GTLISJ\` at plus 1, plus 2, plus 3, plus 4, plus 5, plus 6. You cannot see this from one letter, only from the whole row.
Alternating shift :: Odd positions move one way, even positions the other. \`MASTER\` becomes \`NZTSFQ\` at plus 1, minus 1, plus 1, minus 1, plus 1, minus 1 - and the minus 1 on \`A\` wraps it round to \`Z\`.
Substitution with no letter logic :: Whole words or digits are swapped by decree. \`ROSE\` becoming \`6821\` just assigns a digit per letter, and "green means red" just assigns a word per word. The tool here is bookkeeping - a two-column list - not arithmetic.
:::

::: mistake
**Deriving the rule from the first letter alone.** Suppose you are told \`MAT\` is coded as \`OBW\`. You check M to O, see plus 2, and confidently encode the next word at plus 2. But look at the rest: A to B is plus 1 and T to W is plus 3. The rule was a growing shift and your answer is wrong from the second letter onwards. Check every letter. It costs four seconds.

**Shifting the wrong way when decoding.** If the code is plus 3 and the question hands you a *code* and asks for the *word*, you must go minus 3. Students who go plus 3 again produce a confident, symmetrical, entirely wrong answer - and papers plant that exact wrong answer among the options.

**Forgetting the wrap.** At minus 1, \`A\` does not become an error, it becomes \`Z\`. At plus 3, \`Y\` becomes \`B\`. The alphabet is a circle of 26.
:::

::: remember
**EJOTY** is the mnemonic that gets you any letter's position in under two seconds: **E = 5, J = 10, O = 15, T = 20, Y = 25.** Five landmarks, five apart. Need R? It is three past O, so 18. Need W? Two past T, so 22.

For the opposite letter, one subtraction: **opposite position = 27 minus the position.** So H is at 8, and 27 minus 8 is 19, which is S.
:::

::: checkpoint
In a certain code FLOWER is written as EKNVDQ. How is GARDEN written in the same code?
- (x) FZQCDM
- ( ) FBQCDM
- ( ) HBSEFO
- ( ) FZQCDN
> Check the gap on every letter first: F to E, L to K, O to N, W to V, E to D, R to Q is minus 1 six times over. Now apply minus 1 to GARDEN: G becomes F, and A wraps round to Z, then R becomes Q, D becomes C, E becomes D, N becomes M. That gives FZQCDM. FBQCDM is what you get if you panic at the wrap and step A forwards to B instead of backwards to Z, and HBSEFO is a plus 1 shift - the right size, the wrong direction.
:::

::: revision
A coding question always gives you the evidence you need: write the alphabet position under every letter of the word and its code, subtract **letter by letter**, and only then name the rule. A constant gap is a fixed shift; a gap climbing 1, 2, 3 is a growing shift; a gap that flips sign is two rules alternating; positions that sum to 27 mean the opposite letter. Encode with the gap as found, decode with it reversed, and remember the alphabet is a circle - minus 1 takes A to Z, plus 2 takes Y to A. When a code assigns digits or swaps whole words there is no arithmetic at all, only bookkeeping: build a two-column list and read it back, and for the "which word means what" language puzzles, find the word common to two coded phrases and the meaning common to their two translations. Keep **EJOTY** (E5, J10, O15, T20, Y25) loaded, and get any mirror letter from 27 minus the position.
:::`,
    mcqs: [
      {
        id: "q1",
        text: "In a certain code, TEACHER is written as VGCEJGT. How is STUDENT written in that code?",
        options: ["UVWFGPT", "TUVEFOU", "UVWFGPV", "UWVFGPV"],
        correctIndex: 2,
        explanation: "Every letter of TEACHER moves +2 (T to V, E to G, A to C, C to E, H to J, E to G, R to T). Applying +2 to STUDENT gives U, V, W, F, G, P, V. UVWFGPT leaves the final T unshifted, and TUVEFOU is a +1 shift.",
      },
      {
        id: "q2",
        text: "If DELHI is coded as CDKGH, how is BOMBAY coded?",
        options: ["ANLBZX", "ANLAZX", "CPNCBZ", "ANLAZY"],
        correctIndex: 1,
        explanation: "D to C, E to D, L to K, H to G, I to H is -1 on every letter. Applying -1 to BOMBAY: B to A, O to N, M to L, B to A, then A wraps round to Z, and Y to X. That is ANLAZX. CPNCBZ is the same size shift in the wrong direction.",
      },
      {
        id: "q3",
        text: "In a certain code, MANGO is written as OCPIQ. What does the code TGCF stand for?",
        options: ["VIEH", "DEAR", "RATE", "READ"],
        correctIndex: 3,
        explanation: "MANGO to OCPIQ is +2 on every letter, so decoding runs -2: T to R, G to E, C to A, F to D, giving READ. VIEH is what you get by shifting +2 again instead of reversing the direction.",
      },
      {
        id: "q4",
        text: "In a certain code, MOTHER is written as NLGSVI. How is SISTER written in the same code?",
        options: ["HRHGVI", "HRHGIV", "TJTUFS", "HRIGVI"],
        correctIndex: 0,
        explanation: "Check the positions: M is 13 and N is 14, O is 15 and L is 12, T is 20 and G is 7 - each pair adds to 27, so this is the opposite-letter code. For SISTER: S(19) to H(8), I(9) to R(18), S to H, T(20) to G(7), E(5) to V(22), R(18) to I(9), giving HRHGVI. TJTUFS is a +1 shift, not a mirror.",
      },
      {
        id: "q5",
        text: "If BEAR is coded as 26 and LION is coded as 50, what is the code for TIGER?",
        options: ["49", "54", "64", "59"],
        correctIndex: 3,
        explanation: "The code is the sum of the alphabet positions. BEAR gives 2 + 5 + 1 + 18 = 26 and LION gives 12 + 9 + 15 + 14 = 50, both matching. TIGER gives 20 + 9 + 7 + 5 + 18 = 59.",
      },
      {
        id: "q6",
        text: "In a certain language, 'pit na dar' means 'you are good', 'sim na tok' means 'good and bad', and 'na tim pit' means 'they are good'. Which word means 'good'?",
        options: ["pit", "dar", "tok", "na"],
        correctIndex: 3,
        explanation: "The first and second phrases share only the coded word 'na', and their English versions share only the word 'good', so na means good. Cross-check: 'na' appears in all three coded phrases and 'good' appears in all three sentences.",
      },
      {
        id: "q7",
        text: "In a certain language, 'ko mit tel' means 'flowers are beautiful', 'del sim ko' means 'beautiful red roses', and 'sim tel gor' means 'are red apples'. Which word means 'red'?",
        options: ["ko", "tel", "sim", "del"],
        correctIndex: 2,
        explanation: "Compare the second and third phrases: they share only 'sim', and their English versions share only 'red', so sim means red. The same method gives ko for beautiful (phrases one and two) and tel for are (phrases one and three).",
      },
      {
        id: "q8",
        text: "In a certain code, FRIEND is written as GTLISJ. How is CANDLE written in the same code?",
        options: ["DBOELF", "DCQHQK", "DCQHPK", "BZMCKD"],
        correctIndex: 1,
        explanation: "The gaps in FRIEND to GTLISJ are +1, +2, +3, +4, +5, +6 - a growing shift, which only shows up if you check every letter. Applying it to CANDLE: C+1 = D, A+2 = C, N+3 = Q, D+4 = H, L+5 = Q, E+6 = K, giving DCQHQK. DBOELF is a flat +1 shift, the answer of someone who checked only the first letter.",
      },
      {
        id: "q9",
        text: "If MASTER is coded as NZTSFQ, how is PLAYER coded?",
        options: ["QKBZFQ", "OMZZDS", "QKBXFS", "QKBXFQ"],
        correctIndex: 3,
        explanation: "The gaps alternate: M to N is +1, A to Z is -1 (wrapping), S to T is +1, T to S is -1, E to F is +1, R to Q is -1. Applying +1, -1, +1, -1, +1, -1 to PLAYER gives Q, K, B, X, F, Q. QKBZFQ moves Y forwards instead of backwards, and OMZZDS runs the pattern with the signs swapped.",
      },
      {
        id: "q10",
        text: "In a certain code, GARDEN is written as NEDRAG. How is MONKEY written in the same code?",
        options: ["YEKNOM", "YKENOM", "NOMYEK", "MONYEK"],
        correctIndex: 0,
        explanation: "GARDEN to NEDRAG is simply the word written backwards, with no letter shifted at all. MONKEY reversed is YEKNOM. NOMYEK swaps the two halves instead of reversing the whole word.",
      },
      {
        id: "q11",
        text: "In a certain code, LOGIC is written as DJHPM. How is BRAIN written in the same code?",
        options: ["CSBJO", "OJBSC", "NIARB", "OJBSD"],
        correctIndex: 1,
        explanation: "LOGIC reversed is CIGOL, and shifting each of those +1 gives D, J, H, P, M - so the rule is reverse, then shift +1. BRAIN reversed is NIARB, and +1 on each gives OJBSC. CSBJO is BRAIN shifted +1 without ever being reversed.",
      },
      {
        id: "q12",
        text: "In a certain code A = 26, B = 25, C = 24 and so on down to Z = 1. What is the code for the word CAT?",
        options: ["3-1-20", "24-26-7", "24-26-6", "23-25-7"],
        correctIndex: 1,
        explanation: "Each letter's value is 27 minus its normal position. C is at 3, so 27 - 3 = 24; A is at 1, so 26; T is at 20, so 7. That gives 24-26-7. The option 3-1-20 is the ordinary forward numbering, and 23-25-7 uses 26 minus the position instead of 27 minus it.",
      },
      {
        id: "q13",
        text: "If PAINT is written as 74128 and EXCEL is written as 93596, how is ACCEPT written in the same code?",
        options: ["455987", "545978", "455978", "455879"],
        correctIndex: 2,
        explanation: "Read off the letter-to-digit map: P=7, A=4, I=1, N=2, T=8 from the first word, and E=9, X=3, C=5, L=6 from the second (E is 9 in both its positions, confirming the map). ACCEPT is therefore 4, 5, 5, 9, 7, 8.",
      },
      {
        id: "q14",
        text: "In a certain code, FLOWER is written as CILTBO. Which word is written as ILSB in the same code?",
        options: ["LOVE", "FIPY", "LIVE", "LOSE"],
        correctIndex: 0,
        explanation: "FLOWER to CILTBO is -3 on every letter, so decoding runs +3: I to L, L to O, S to V, B to E, giving LOVE. FIPY is what -3 produces if you forget to reverse the direction while decoding.",
      },
      {
        id: "q15",
        text: "If 'green' means 'red', 'red' means 'blue', 'blue' means 'yellow' and 'yellow' means 'green', what would a clear sky be called in this language?",
        options: ["blue", "yellow", "red", "green"],
        correctIndex: 2,
        explanation: "A clear sky is really blue, so you need the word that means blue. The list says 'red' means 'blue', so the sky is called red. Answering 'yellow' follows the arrow the wrong way, using 'blue means yellow' when the question is asking for the name of the blue thing.",
      },
    ],
    timedQuiz: { timeLimitSeconds: 300, mcqIds: ["q2", "q4", "q8", "q13", "q15"] },
    problemIds: [],
    xpReward: 50, coinReward: 20,
    status: "published",
  },

  // ------------------------------------------------------------------
  // Day 21 - Wednesday 26 Aug 2026 - Syllogisms
  // ------------------------------------------------------------------
  {
    date: "2026-08-26", dow: "wed", weekId: "2026-08-24", type: "lesson",
    title: "Day 21: Syllogisms",
    difficulty: "Medium",
    estimatedMinutes: 18,
    concept: `## The Argument That Won The Class And Was Still Wrong

::: story
Your class is arguing about the cricket team. Someone stands up and says:

**"All cricketers are athletes. Some athletes are vegetarians. So some cricketers must be vegetarians."**

Half the room nods. It *sounds* airtight. But picture it: draw a big circle labelled athletes, put a smaller circle for cricketers entirely inside it, and now scatter the vegetarians. Nothing stops you from putting every single vegetarian athlete in the part of the big circle that is **outside** the cricketers.

One picture, and the argument collapses. Not because the conclusion is false in real life - some cricketers really are vegetarians - but because the two statements **do not force it**.

That gap between "could be true" and "must be true" is the entire subject.
:::

## Two Circles And A Pencil

A syllogism gives you statements you must treat as **absolutely true**, however silly they sound, and conclusions you must test. A conclusion "follows" only if it is true in **every single diagram** you can legally draw. So your job is not to prove it. Your job is to try to **break** it.

Here is a real pair, traced.

**Statements:** All engineers are graduates. Some graduates are painters.
**Conclusion I:** Some engineers are painters.
**Conclusion II:** Some graduates are engineers.

Now draw, deliberately trying to be awkward:

  Big circle: GRADUATES
  Inside it, entirely: ENGINEERS
  Overlapping GRADUATES on the far side, touching nothing else: PAINTERS

- **Conclusion I fails.** In the diagram above, the painters overlap graduates only in the region outside engineers. One legal counter-diagram is all it takes. Not proven, so it does not follow.
- **Conclusion II holds.** Engineers sit wholly inside graduates, and engineers exist, so there is definitely a part of graduates that is engineers. There is no way to draw it otherwise.

Answer: **only II follows.** Note how the conclusion that felt exciting failed and the boring one survived. That is typical.

::: table What each statement actually guarantees
Statement | Type | Valid conversion | What it does NOT give you
All A are B | Universal positive | Some B are A | All B are A
No A is B | Universal negative | No B is A | Some A are B
Some A are B | Particular positive | Some B are A | All A are B, or Some A are not B
Some A are not B | Particular negative | nothing at all | Some B are not A, or No A is B
:::

Two rows there are worth reading twice. **"All A are B" converts only to "Some B are A"**, never to "All B are A" - all doctors are graduates, but hardly all graduates are doctors. And **"Some A are not B" converts to nothing**, which is the row students never expect.

## The Four Combinations Worth Memorising

::: cards Chain two statements and this is all that can happen
All plus All :: All A are B and All B are C gives **All A are C**. The strongest chain there is, and the only one that hands you an "All".
All plus No :: All A are B and No B is C gives **No A is C**. One negative anywhere in the chain forces a negative conclusion.
Some plus All :: Some A are B and All B are C gives **Some A are C**. The order matters - the "Some" has to come first for the link to hold.
All plus Some :: All A are B and Some B are C gives **nothing between A and C**. This is the pair that catches everybody, because it reads exactly like it ought to work. It is the cricketers and the vegetarians.
:::

::: mistake
**Assuming "All A are B" means "All B are A".** All squares are rectangles; almost no rectangles are squares. Every paper contains at least one option built purely out of this reversal, and it is the single most common wrong answer in the topic.

**Confusing possible with certain.** "Some cricketers are vegetarians" *might* be true - and that is precisely why it does not follow. A conclusion needs to survive every legal diagram, not just the comfortable one you drew first. Always draw the awkward diagram on purpose.

**Reading "Some A are B" as also giving "Some A are not B".** "Some students are singers" leaves it wide open that *all* of them are, so it never licenses "some students are not singers".

**Missing a complementary pair.** If neither conclusion follows on its own, check whether the two are a "Some X are Y" / "No X is Y" pair, or an "All X are Y" / "Some X are not Y" pair. Those two cannot both be false, so the correct answer is **either I or II follows** - and if you have already ticked "neither", you have lost the mark.
:::

::: remember
**One counter-diagram kills a conclusion.** So do not ask "can I draw this?" - ask "can I draw the opposite?" If you can, the conclusion is dead. If after honestly trying you cannot, it follows.

Two one-line rules that decide most questions:
- Any conclusion that **reverses an "All"** is wrong. Reversing an "All" only ever gives you a "Some".
- A **negative statement anywhere** in the chain means no positive conclusion can link the two end terms.
:::

::: checkpoint
Statements: All poets are dreamers. Some dreamers are realists. Does the conclusion "Some poets are realists" follow?
- ( ) Yes - poets sit inside dreamers, so they inherit whatever dreamers have
- (x) No - the realist overlap can sit entirely in the part of dreamers outside poets
- ( ) Yes, and "Some realists are poets" follows as well
- ( ) No, and "No poet is a realist" follows instead
> This is All plus Some, which links nothing. Draw poets wholly inside dreamers, then park the realists so they overlap only the outer ring of dreamers: every statement is satisfied and the conclusion is false, so it does not follow. Careful with the last option though - "No poet is a realist" does not follow either, because you could equally draw the realists overlapping the poets. Those two conclusions are a complementary pair, so a paper offering both would want "either I or II follows".
:::

::: revision
Treat the statements as absolute truth and the conclusions as suspects: a conclusion **follows** only if it survives every diagram you can legally draw, so attack it by trying to draw a counter-example rather than trying to confirm it. Know the conversions cold - "All A are B" gives only "Some B are A" and never "All B are A"; "No A is B" gives "No B is A"; "Some A are B" gives "Some B are A"; and "Some A are not B" gives nothing whatsoever. For chains: All plus All gives All, All plus No gives No, Some plus All gives Some, and **All plus Some gives nothing at all** - that last one is the cricketers-and-vegetarians trap and it appears in almost every paper. Some plus Some also gives nothing. Finally, when neither conclusion stands alone, check for a complementary pair ("Some X are Y" against "No X is Y", or "All X are Y" against "Some X are not Y"): those cannot both be false, so the answer is "either I or II follows", not "neither".
:::`,
    mcqs: [
      {
        id: "q1",
        text: "Statements: All dogs are animals. All animals are living things. Conclusions: I. All dogs are living things. II. Some living things are dogs.",
        options: ["Only conclusion I follows", "Only conclusion II follows", "Both I and II follow", "Neither I nor II follows"],
        correctIndex: 2,
        explanation: "All plus All chains directly: dogs sit inside animals which sit inside living things, so I follows. And since dogs exist and are all living things, part of living things is dogs, so II follows as the valid conversion of I.",
      },
      {
        id: "q2",
        text: "Statements: All books are papers. Some papers are pens. Conclusions: I. Some books are pens. II. Some pens are papers.",
        options: ["Only conclusion I follows", "Only conclusion II follows", "Both I and II follow", "Neither I nor II follows"],
        correctIndex: 1,
        explanation: "This is All plus Some, which links nothing: draw books inside papers and put the pen overlap entirely in the part of papers outside books, and I is false. II is just the valid conversion of 'Some papers are pens', so it follows.",
      },
      {
        id: "q3",
        text: "Statements: Some pens are pencils. All pencils are erasers. Conclusions: I. Some pens are erasers. II. All erasers are pencils.",
        options: ["Only conclusion I follows", "Only conclusion II follows", "Both I and II follow", "Neither I nor II follows"],
        correctIndex: 0,
        explanation: "Some plus All does link: the pens that are pencils are also erasers, so I follows. II reverses an 'All', which is never valid - erasers could extend well beyond pencils.",
      },
      {
        id: "q4",
        text: "Statements: No teacher is a student. All students are children. Conclusions: I. No teacher is a child. II. Some children are not teachers.",
        options: ["Only conclusion I follows", "Only conclusion II follows", "Both I and II follow", "Neither I nor II follows"],
        correctIndex: 1,
        explanation: "I fails: teachers are excluded from students, but a teacher could still sit inside children in the region that is not students. II holds: the students are children and none of them is a teacher, so there is definitely a part of children that is teacher-free.",
      },
      {
        id: "q5",
        text: "Statements: Some cats are dogs. No dog is a cow. Conclusions: I. Some cats are not cows. II. All cats are cows.",
        options: ["Only conclusion I follows", "Only conclusion II follows", "Both I and II follow", "Neither I nor II follows"],
        correctIndex: 0,
        explanation: "The cats that are dogs cannot be cows, since no dog is a cow, so at least some cats are not cows and I follows. II is impossible for the same reason.",
      },
      {
        id: "q6",
        text: "Statements: All singers are dancers. Some dancers are actors. Conclusions: I. Some singers are actors. II. No singer is an actor.",
        options: ["Only conclusion I follows", "Only conclusion II follows", "Either I or II follows", "Neither I nor II follows"],
        correctIndex: 2,
        explanation: "Neither survives alone - the actor overlap can be drawn inside the singers or entirely outside them. But 'Some singers are actors' and 'No singer is an actor' are a complementary pair: they cannot both be false, so exactly one of them must be true. The answer is 'either I or II follows', not 'neither'.",
      },
      {
        id: "q7",
        text: "Statements: Some doctors are engineers. Some engineers are lawyers. Conclusions: I. Some lawyers are engineers. II. Some doctors are lawyers.",
        options: ["Only conclusion I follows", "Only conclusion II follows", "Both I and II follow", "Neither I nor II follows"],
        correctIndex: 0,
        explanation: "I is the valid conversion of the second statement ('Some engineers are lawyers'), so it follows. II fails because Some plus Some links nothing: the doctor-engineer overlap and the engineer-lawyer overlap can be two entirely separate slices of engineers.",
      },
      {
        id: "q8",
        text: "Statements: All pilots are brave. Some brave people are soldiers. All soldiers are strong. Conclusions: I. Some brave people are strong. II. Some pilots are strong.",
        options: ["Only conclusion I follows", "Only conclusion II follows", "Both I and II follow", "Neither I nor II follows"],
        correctIndex: 0,
        explanation: "Some brave people are soldiers and all soldiers are strong, so Some plus All gives 'some brave people are strong' and I follows. II fails because nothing forces any pilot to be one of those soldiers - draw the pilots inside brave but clear of the soldier region.",
      },
      {
        id: "q9",
        text: "Statements: Some tables are chairs. Some chairs are stools. Conclusions: I. Some tables are stools. II. All stools are chairs.",
        options: ["Only conclusion I follows", "Only conclusion II follows", "Both I and II follow", "Neither I nor II follows"],
        correctIndex: 3,
        explanation: "Some plus Some gives nothing, so I fails. II reverses a 'Some' into an 'All', which is never valid. The two conclusions are not a complementary pair either, so the answer really is 'neither'.",
      },
      {
        id: "q10",
        text: "Statements: All mangoes are fruits. All fruits are sweet. Which one of the following definitely follows?",
        options: ["All sweet things are mangoes", "Some sweet things are mangoes", "No mango is sweet", "Some mangoes are not sweet"],
        correctIndex: 1,
        explanation: "The chain gives 'All mangoes are sweet'. Converting that 'All' yields only a 'Some', so 'Some sweet things are mangoes' follows. 'All sweet things are mangoes' is the classic reversal error, and the last two options contradict the chain outright.",
      },
      {
        id: "q11",
        text: "Which of these is a valid conclusion from the single statement 'Some students are athletes'?",
        options: ["Some students are not athletes", "All athletes are students", "Some athletes are students", "All students are athletes"],
        correctIndex: 2,
        explanation: "A 'Some' statement converts to a 'Some' with the terms swapped, so 'Some athletes are students' is guaranteed. 'Some students are not athletes' does not follow, because it is entirely possible that all of them are.",
      },
      {
        id: "q12",
        text: "From the statement 'Some birds are not parrots', which of the following follows?",
        options: ["Some parrots are not birds", "No bird is a parrot", "Some birds are parrots", "None of these"],
        correctIndex: 3,
        explanation: "'Some A are not B' is the one statement type that converts to nothing at all, so it says nothing about parrots relative to birds. It also does not upgrade to 'No bird is a parrot', nor does it license the positive 'Some birds are parrots'. So none of the three follows.",
      },
      {
        id: "q13",
        text: "Statements: Some rivers are lakes. All lakes are ponds. Conclusions: I. Some ponds are rivers. II. All rivers are ponds.",
        options: ["Only conclusion I follows", "Only conclusion II follows", "Both I and II follow", "Neither I nor II follows"],
        correctIndex: 0,
        explanation: "Those rivers that are lakes are also ponds, so some ponds are rivers and I follows. II fails because only some rivers are lakes, so nothing forces every river into the ponds circle.",
      },
      {
        id: "q14",
        text: "Statements: All cars are vehicles. No vehicle is a building. Conclusions: I. No car is a building. II. Some vehicles are cars.",
        options: ["Only conclusion I follows", "Only conclusion II follows", "Both I and II follow", "Neither I nor II follows"],
        correctIndex: 2,
        explanation: "All plus No gives a negative: cars sit wholly inside vehicles and vehicles are entirely separate from buildings, so no car can be a building and I follows. II is the valid conversion of 'All cars are vehicles', so it follows too.",
      },
      {
        id: "q15",
        text: "Statements: All fans are switches. All switches are bulbs. Some bulbs are wires. Conclusions: I. Some fans are wires. II. All fans are bulbs.",
        options: ["Only conclusion I follows", "Only conclusion II follows", "Both I and II follow", "Neither I nor II follows"],
        correctIndex: 1,
        explanation: "Fans sit inside switches which sit inside bulbs, so II follows. I fails because the wire overlap can be drawn in the part of bulbs outside switches altogether - the last link in the chain is a 'Some', and All plus Some connects nothing.",
      },
    ],
    timedQuiz: { timeLimitSeconds: 300, mcqIds: ["q2", "q4", "q6", "q11", "q12"] },
    problemIds: [],
    xpReward: 50, coinReward: 20,
    status: "published",
  },

  // ------------------------------------------------------------------
  // Day 22 - Thursday 27 Aug 2026 - Number & Letter Series
  // ------------------------------------------------------------------
  {
    date: "2026-08-27", dow: "thu", weekId: "2026-08-24", type: "lesson",
    title: "Day 22: Number & Letter Series",
    difficulty: "Medium",
    estimatedMinutes: 18,
    concept: `## The Marble Rows

::: story
Your little cousin is building a triangle of marbles on the floor. She lines them up row by row and calls out the count each time:

**2, 6, 12, 20, 30.**

Then she looks up and asks how many go in the next row.

You do not know a formula for triangles of marbles. So you do the only sensible thing: you look at how much each row **grew**. From 2 to 6 is 4. From 6 to 12 is 6. Then 8. Then 10. The growth itself is marching up in twos, so the next growth is **12**, and the next row has 30 + 12 = **42** marbles.

You just solved a quadratic series with no algebra at all. You subtracted.
:::

## Always Subtract First

A series question looks like a guessing game and is not. There is a fixed order of things to try, and the first one solves about half of all questions.

**Worked example: 3, 7, 15, 31, 63, ?**

Subtract: 4, 8, 16, 32. The gaps are not constant, so it is not arithmetic. But the gaps are **doubling**, which is a strong hint the rule is multiplicative. Test the most common two-step rule, double and add one:

  3 x 2 + 1 = 7
  7 x 2 + 1 = 15
  15 x 2 + 1 = 31
  31 x 2 + 1 = 63
  63 x 2 + 1 = 127

Every term checks out, so the answer is **127**. Notice that you did not have to guess: the doubling gaps pointed at multiplication, and one candidate rule tested against all five known terms confirmed it.

::: flow The order to try things in, every single time
Differences :: Subtract each term from the next one. A constant gap is arithmetic and you are done in five seconds
Differences of the differences :: If the gaps themselves form a neat pattern like 4, 6, 8, 10 then the next gap is predictable and so is the next term
Ratios :: Divide each term by the previous. A constant ratio is geometric. Fast-growing terms mean divide, do not subtract
Squares and cubes nearby :: Compare each term to the closest perfect square or cube. 24, 63 and 124 are each one less than 25, 64 and 125
Two series interleaved :: Read only the odd positions, then only the even positions. Alternating series look like noise until you split them in half
:::

::: cards The families that cover a placement paper
Arithmetic :: A constant number is added. \`7, 12, 17, 22, 27\` adds 5 every time. One subtraction identifies it.
Geometric :: A constant number multiplies. \`4, 12, 36, 108\` multiplies by 3. Terms grow fast, which is your cue to divide.
Growing gap :: The gap climbs in its own pattern. \`2, 6, 12, 20, 30\` has gaps 4, 6, 8, 10, so the next gap is 12 and the next term is 42.
Multiply and add :: A two-step rule builds each term from the previous. \`3, 7, 15, 31, 63\` is double plus one, so the next is 127.
Square or cube offset :: Each term sits a fixed distance from a perfect square or cube. \`2, 5, 10, 17, 26\` is one more than 1, 4, 9, 16, 25, so the next is 36 plus 1, that is 37.
Alternating :: Two independent series shuffled together. \`3, 20, 6, 17, 9, 14, 12\` is 3, 6, 9, 12 rising by 3 interleaved with 20, 17, 14 falling by 3, so the next term is 11.
:::

## Letters Are Just Numbers In Disguise

You cannot see a pattern in letters. Nobody can. So the very first thing you do with a letter series is **write the position number under every letter** - and then it is an ordinary number series.

**Worked example: A, C, F, J, O, ?**

  A  C  F  J  O
  1  3  6  10 15

Gaps: 2, 3, 4, 5. So the next gap is **6**, landing on 15 + 6 = **21**, which is **U**.

Same trick handles two-letter series. In **AZ, BY, CX, DW, ?** the first letters run 1, 2, 3, 4 forwards and the second run 26, 25, 24, 23 backwards, so the next pair is 5 and 22, which is **EV**.

::: table Numbers you should recognise on sight
n | n squared | n cubed
11 | 121 | 1331
12 | 144 | 1728
13 | 169 | 2197
14 | 196 | 2744
15 | 225 | 3375
16 | 256 | 4096
17 | 289 | 4913
18 | 324 | 5832
19 | 361 | 6859
20 | 400 | 8000
:::

::: mistake
**Computing one gap and extrapolating.** Look at 4, 9, 16, 25. The first gap is 5, so a hurried student writes 30. But the gaps are 5, 7, 9 - climbing by 2 - so the next gap is 11 and the answer is **36**. (These are the perfect squares, which the gap pattern was quietly announcing.) Always compute *all* the gaps, especially the last one.

**Miscounting letter steps.** Moving 4 steps forward from D lands on **H**, not G. D is at 4, and 4 plus 4 is 8, which is H. The error comes from counting the letters you touch (E, F, G, H is "four letters" so people stop at G) instead of counting the moves. Write positions and add - never count on your fingers.

**Forgetting the alphabet is a circle.** In a plus 2 letter series, after Z comes B, not "nothing". V, X, Z, B, D is a perfectly ordinary plus 2 series.
:::

::: remember
**EJOTY** gives you any letter's position instantly: **E = 5, J = 10, O = 15, T = 20, Y = 25.** Five landmarks, five apart, and every other letter is a short hop from one of them.

And one habit that is worth more than any pattern list: after you pick an answer, **run the rule forwards through the whole series once**, including the term you just added. A rule that fits four of five terms is not the rule.
:::

::: checkpoint
Find the next term: 6, 11, 21, 36, 56, ?
- ( ) 76
- (x) 81
- ( ) 86
- ( ) 91
> The gaps are 5, 10, 15, 20 - climbing by 5 each time - so the next gap is 25 and the answer is 56 + 25 = 81. Answering 76 comes from reusing the last gap of 20 instead of noticing that the gaps themselves form a series, which is exactly the mistake this topic is built to punish.
:::

::: revision
Never stare at a series - **subtract**. A constant gap means arithmetic; gaps that form their own neat pattern (4, 6, 8, 10) mean you extend the gap pattern and add; fast growth means try **ratios** instead; and a term sitting a fixed distance from a perfect square or cube (2, 5, 10, 17, 26 as n squared plus 1) means compare against the squares table you have memorised. When the terms lurch up and down with no sense to them, read the **odd positions alone and the even positions alone** - alternating series are two tidy series shuffled. For letters, write the position number under every letter first (**EJOTY**: E5, J10, O15, T20, Y25), solve it as a number series, then convert back, remembering that the alphabet wraps from Z round to A. Two habits save the marks: compute every gap including the last one, and once you have an answer, run your rule through the entire series again to confirm it fits every single term.
:::`,
    mcqs: [
      {
        id: "q1",
        text: "Find the next number in the series: 2, 6, 12, 20, 30, ?",
        options: ["36", "40", "44", "42"],
        correctIndex: 3,
        explanation: "The gaps are 4, 6, 8, 10, rising by 2 each time, so the next gap is 12 and the answer is 30 + 12 = 42. Reusing the last gap of 10 gives the trap answer 40.",
      },
      {
        id: "q2",
        text: "Find the next number in the series: 3, 7, 15, 31, 63, ?",
        options: ["95", "127", "129", "124"],
        correctIndex: 1,
        explanation: "Each term is the previous one doubled plus 1: 3 to 7 to 15 to 31 to 63, and 63 x 2 + 1 = 127. Simply doubling gives 126 and adding the last gap of 32 gives 95, both of which fail on earlier terms.",
      },
      {
        id: "q3",
        text: "Find the next number in the series: 5, 11, 23, 47, ?",
        options: ["95", "71", "94", "99"],
        correctIndex: 0,
        explanation: "Double and add 1 each time: 5 to 11, 11 to 23, 23 to 47, so 47 x 2 + 1 = 95. The option 94 is what you get by doubling and forgetting the +1.",
      },
      {
        id: "q4",
        text: "Find the next number in the series: 4, 12, 36, 108, ?",
        options: ["216", "288", "324", "432"],
        correctIndex: 2,
        explanation: "Each term is 3 times the previous one, so 108 x 3 = 324. The terms grow too fast for a difference pattern, which is the signal to divide rather than subtract. Doubling instead of tripling gives 216.",
      },
      {
        id: "q5",
        text: "Find the next number in the series: 2, 5, 10, 17, 26, ?",
        options: ["35", "38", "41", "37"],
        correctIndex: 3,
        explanation: "Each term is a perfect square plus 1: 1+1, 4+1, 9+1, 16+1, 25+1, so the next is 36 + 1 = 37. Checking the gaps agrees: they are 3, 5, 7, 9, so the next gap is 11 and 26 + 11 = 37.",
      },
      {
        id: "q6",
        text: "Find the next term in the series: 3, 20, 6, 17, 9, 14, 12, ?",
        options: ["11", "15", "18", "21"],
        correctIndex: 0,
        explanation: "Two series are interleaved. The odd positions read 3, 6, 9, 12, rising by 3. The even positions read 20, 17, 14, falling by 3, so the next term is 14 - 3 = 11.",
      },
      {
        id: "q7",
        text: "Which number does not belong in this list: 8, 27, 64, 100, 125, 216, 343?",
        options: ["27", "100", "64", "343"],
        correctIndex: 1,
        explanation: "Every other number is a perfect cube: 2 cubed is 8, 3 cubed is 27, 4 cubed is 64, 5 cubed is 125, 6 cubed is 216 and 7 cubed is 343. 100 is a perfect square but not a cube, so it is the odd one out.",
      },
      {
        id: "q8",
        text: "Find the next number in the series: 11, 13, 17, 19, 23, 29, ?",
        options: ["30", "31", "33", "37"],
        correctIndex: 1,
        explanation: "These are consecutive prime numbers, and the next prime after 29 is 31. The gaps look irregular (2, 4, 2, 4, 6) precisely because the rule is not arithmetic at all - when differences make no sense, check for primes.",
      },
      {
        id: "q9",
        text: "Find the next letter in the series: C, F, I, L, ?",
        options: ["M", "N", "O", "P"],
        correctIndex: 2,
        explanation: "Write the positions: 3, 6, 9, 12, so the gap is a steady +3 and the next position is 15, which is O. Answering M comes from counting letters touched rather than adding 3 to the position.",
      },
      {
        id: "q10",
        text: "Find the next letter in the series: A, C, F, J, O, ?",
        options: ["S", "T", "U", "V"],
        correctIndex: 2,
        explanation: "Positions are 1, 3, 6, 10, 15, so the gaps are 2, 3, 4, 5 and the next gap is 6. That lands on position 15 + 6 = 21, which is U. Reusing the gap of 5 gives the trap answer T.",
      },
      {
        id: "q11",
        text: "Find the next letter in the series: V, X, Z, B, ?",
        options: ["C", "D", "E", "F"],
        correctIndex: 1,
        explanation: "Positions are 22, 24, 26, then the series wraps past Z to 2 (B), so the gap is a steady +2. Two more from B is D. Recognising the wrap is the whole question.",
      },
      {
        id: "q12",
        text: "Find the next term in the series: B2, D4, F6, H8, ?",
        options: ["I9", "J9", "K10", "J10"],
        correctIndex: 3,
        explanation: "The letters step forward by 2 (B, D, F, H, J) and the number attached to each is exactly that letter's alphabet position, so J must carry 10. I9 forgets the +2 step on the letter, and J9 breaks the letter-equals-number rule.",
      },
      {
        id: "q13",
        text: "Find the next term in the series: AZ, BY, CX, DW, ?",
        options: ["EV", "EU", "FV", "EW"],
        correctIndex: 0,
        explanation: "The first letters run 1, 2, 3, 4 forwards, so the next is 5, which is E. The second letters run 26, 25, 24, 23 backwards, so the next is 22, which is V. That gives EV. EU skips a step on the falling half.",
      },
      {
        id: "q14",
        text: "One term in this series is wrong: 6, 12, 21, 33, 47, 66. Which one?",
        options: ["12", "21", "47", "66"],
        correctIndex: 2,
        explanation: "The intended gaps rise by 3 each time: 6, 9, 12, 15, 18. That gives 6, 12, 21, 33, 48, 66, so the fifth term should be 48 and not 47. Confirm it from the far end too: 66 - 18 = 48, which fixes the same term.",
      },
      {
        id: "q15",
        text: "Find the missing term: 3, 8, 18, ?, 78, 158",
        options: ["38", "36", "40", "48"],
        correctIndex: 0,
        explanation: "Each term is the previous one doubled plus 2: 3 to 8, 8 to 18, and 18 x 2 + 2 = 38. Check forwards from there: 38 x 2 + 2 = 78 and 78 x 2 + 2 = 158, so the rule holds across the whole series.",
      },
    ],
    timedQuiz: { timeLimitSeconds: 300, mcqIds: ["q5", "q10", "q11", "q14", "q15"] },
    problemIds: [],
    xpReward: 50, coinReward: 20,
    status: "published",
  },

  // ------------------------------------------------------------------
  // Day 23 - Friday 28 Aug 2026 - Direction Sense
  // ------------------------------------------------------------------
  {
    date: "2026-08-28", dow: "fri", weekId: "2026-08-24", type: "lesson",
    title: "Day 23: Direction Sense",
    difficulty: "Medium",
    estimatedMinutes: 18,
    concept: `## Twenty Minutes Of Walking, Three Metres From Home

::: story
You are looking for a friend's flat in a new colony. Your phone is dead, so you follow the instructions he shouted over the call: go straight, take the second right, then a left, then another left.

Ten minutes later you are standing in front of a very familiar gate. It is **your own building**. You walked a rectangle.

Here is the thing: while you were walking, you could not tell. Each individual turn felt like progress. Only when you stopped and asked *how far am I from where I started, and in which direction* did the whole path collapse into one short arrow.

Direction-sense questions are exactly that question. They give you a long, busy path and ask for the **short arrow**. And the short arrow never cares about the route - only about the net movement.
:::

## Draw The Compass Once, Then Stop Guessing

There is exactly one setup, and it takes four seconds:

  N is up. S is down. E is right. W is left.
  Start at the point 0, 0 and write the facing direction beside it.

Then track only two running totals: how far **north minus south** you are, and how far **east minus west**. Every step updates one of them. Nothing else matters.

**Worked example.** Ravi starts facing North, walks 4 km, turns right and walks 3 km, then turns right again and walks 4 km. How far is he from his start, and in which direction?

::: flow Tracing Ravi's walk from the point 0 comma 0
Facing north, walk 4 km :: he is now 0 east and 4 north of the start
Turn right, so he faces east, walk 3 km :: he is now 3 east and 4 north
Turn right, so he faces south, walk 4 km :: the 4 north is cancelled exactly, leaving 3 east and 0 north
Read the short arrow :: net movement is 3 km east and nothing north or south, so he is exactly 3 km east of his start
:::

Eleven kilometres of walking, three kilometres of displacement. That is the point of the topic.

::: table Turns, settled once and for all
Currently facing | Turn left | Turn right | About turn
North | West | East | South
East | North | South | West
South | East | West | North
West | South | North | East
:::

That table is the whole difficulty of this chapter, and it is four rows long. Copy it onto the corner of your rough sheet in the exam and never argue with yourself again.

## When The Answer Is A Diagonal

Sometimes the two running totals do not cancel, and then the shortest distance is the **hypotenuse**.

**Worked example.** Meena walks 9 m South, then 4 m West, then 3 m North, then 4 m West. How far is she from her starting point?

  South 9, then North 3   gives   6 m south of the start
  West 4, then West 4     gives   8 m west of the start

  Shortest distance = square root of (6 squared plus 8 squared)
                    = square root of (36 plus 64)
                    = square root of 100
                    = 10 m

So she is 10 m away, in the **south-west** direction. Note that the four legs added up to 20 m of walking and produced 10 m of displacement, and that the numbers 6, 8, 10 were not an accident - papers pick them so the root comes out whole.

::: mistake
**Turning left while facing south and landing west.** This is the single biggest source of wrong answers in the topic, and it happens because your body is not in the diagram. When you face **south**, you are facing *down* the page, so your left hand points to the **east** side of the page - not the west, even though "left" and "west" feel like the same idea.

Trace the damage: a man walks 15 m south, turns left, walks 15 m, turns left again, walks 15 m. Done correctly he goes south, then **east**, then **north**, ending 15 m **east** of his start. Done with the reflex error he goes south, then west, then north, and answers 15 m west - the right magnitude, the exactly opposite direction, and an option the paper will have printed for you.

**Adding up the distance walked instead of the displacement.** "How far is he from the starting point" never means the length of the walk. Ravi walked 11 km and is 3 km away.

**Forgetting that clockwise and anticlockwise are just turns.** 90 degrees clockwise is a right turn, 90 degrees anticlockwise is a left turn, and 180 degrees either way is an about turn.
:::

::: remember
**Never Eat Soggy Waffles** - North, East, South, West, read clockwise round the compass. Once that order is in your head: a **right** turn moves you one step **forward** in that list (and W wraps round to N), and a **left** turn moves you one step **back**.

Two more things worth walking in with:
- The sun rises in the **east** and sets in the **west**, so a morning shadow points west and an evening shadow points east. "Facing the rising sun" means facing east.
- Memorise the whole-number right triangles so you recognise the answer instantly: **3-4-5, 6-8-10, 5-12-13, 9-12-15, 8-15-17**.
:::

::: checkpoint
A man facing South turns 90 degrees anticlockwise, and then turns 180 degrees clockwise. Which direction is he facing now?
- ( ) North
- ( ) East
- (x) West
- ( ) South
> Anticlockwise 90 degrees is a left turn, and facing south, a left turn takes him to the **east** - this is the exact step where most answers die. Then 180 degrees is an about turn from east, which is **west**. Answering east means you stopped after the first turn; answering north means you took the first turn as a right turn to the west and then reversed that.
:::

::: revision
Every direction question is asking for the **short arrow**: draw N up and E right, start at 0 comma 0, and keep just two running totals - net north minus south, and net east minus west. The route length is irrelevant; Ravi walking 4 km north, 3 km east and 4 km south covers 11 km and finishes 3 km east. If both totals survive, the shortest distance is the **hypotenuse**, so 6 south and 8 west means square root of 36 plus 64, that is 10 m to the south-west - and papers choose 3-4-5, 6-8-10 and 5-12-13 triples so the root is always whole. The one thing to get mechanically right is the turn: facing north, left is west and right is east, but facing **south** those flip, so a left turn while facing south takes you **east**. Clockwise is a right turn, anticlockwise a left turn, 180 degrees is an about turn, the sun rises east so morning shadows fall west, and **Never Eat Soggy Waffles** keeps N, E, S, W in clockwise order when your head stops working.
:::`,
    mcqs: [
      {
        id: "q1",
        text: "Ravi walks 4 km towards the north, turns right and walks 3 km, then turns right again and walks 4 km. How far and in which direction is he from his starting point?",
        options: ["3 km west", "5 km east", "3 km east", "7 km north"],
        correctIndex: 2,
        explanation: "Facing north he goes 4 north. A right turn faces him east for 3 km. A second right turn faces him south for 4 km, which exactly cancels the 4 north. Net movement is 3 km east and 0 north, so he is 3 km east of the start. The 11 km he walked is irrelevant.",
      },
      {
        id: "q2",
        text: "Meena walks 9 m towards the south, then 4 m towards the west, then 3 m towards the north, and finally 4 m towards the west. How far is she from her starting point?",
        options: ["8 m", "12 m", "14 m", "10 m"],
        correctIndex: 3,
        explanation: "North-south total: 9 south minus 3 north leaves 6 m south. East-west total: 4 plus 4 leaves 8 m west. The shortest distance is the hypotenuse of the 6 and 8 legs, which is the square root of 36 + 64 = 100, so 10 m. Answering 8 m uses only the westward leg.",
      },
      {
        id: "q3",
        text: "A person is facing west. He turns 45 degrees clockwise three times. Which direction is he facing now?",
        options: ["North", "North-east", "East", "South-east"],
        correctIndex: 1,
        explanation: "Going clockwise from west: 45 degrees reaches north-west, 90 degrees reaches north, and 135 degrees reaches north-east. Three 45-degree turns is 135 degrees in total, so he faces north-east. Stopping at 90 degrees gives the trap answer north.",
      },
      {
        id: "q4",
        text: "Sunil starts from his house, walks 5 km east, turns left and walks 3 km, then turns left again and walks 5 km. How far and in which direction is he from his house?",
        options: ["3 km south", "5 km north", "8 km east", "3 km north"],
        correctIndex: 3,
        explanation: "Facing east he goes 5 east. A left turn while facing east points him north, for 3 km. A second left turn points him west, for 5 km, cancelling the 5 east exactly. Net movement is 3 km north.",
      },
      {
        id: "q5",
        text: "A cyclist rides 10 km south, then 6 km west, then 10 km north, and finally 10 km east. Where is he now relative to his starting point?",
        options: ["4 km west", "16 km east", "4 km east", "6 km east"],
        correctIndex: 2,
        explanation: "The 10 south and 10 north cancel completely. East-west: 6 west then 10 east leaves 4 km east. Answering 4 km west subtracts the wrong way, and 16 km adds the two east-west legs instead of subtracting.",
      },
      {
        id: "q6",
        text: "Rohit is facing north-east. He turns 90 degrees clockwise, and then turns 135 degrees anticlockwise. Which direction is he facing now?",
        options: ["West", "North-west", "East", "North"],
        correctIndex: 3,
        explanation: "Clockwise from north-east, 90 degrees passes east and lands on south-east. Anticlockwise from south-east, 135 degrees is three 45-degree steps: east, north-east, north. So he faces north.",
      },
      {
        id: "q7",
        text: "Early in the morning, Ramesh stands facing the rising sun. He turns right and walks 5 km, then turns left and walks 3 km. In which direction is he from his starting point?",
        options: ["North-east", "South-east", "South-west", "North-west"],
        correctIndex: 1,
        explanation: "The rising sun means he faces east. A right turn while facing east points him south, so 5 km south. A left turn while facing south points him east, so 3 km east. Net movement is 5 south and 3 east, putting him in the south-east direction from his start.",
      },
      {
        id: "q8",
        text: "In the early morning a boy stands facing a pole, and his shadow falls exactly to his left. Which direction is he facing?",
        options: ["North", "South", "East", "West"],
        correctIndex: 0,
        explanation: "In the morning the sun is in the east, so every shadow points west. If west is to his left, then he must be facing north, because only a person facing north has west on the left. A person facing south would have west on the right.",
      },
      {
        id: "q9",
        text: "A man walks 6 km towards the north and then 8 km towards the east. What is the shortest distance from his starting point?",
        options: ["12 km", "14 km", "10 km", "2 km"],
        correctIndex: 2,
        explanation: "The two legs are at right angles, so the shortest distance is the hypotenuse: square root of 36 + 64 = square root of 100 = 10 km. Answering 14 km adds the distances walked instead of finding the displacement.",
      },
      {
        id: "q10",
        text: "Kiran walks 3 km north, then 4 km east, then 5 km south, then 4 km west, and finally 2 km north. How far is Kiran from the starting point?",
        options: ["0 km", "2 km", "4 km", "5 km"],
        correctIndex: 0,
        explanation: "North-south: 3 north plus 2 north is 5 north, against 5 south, which cancels to zero. East-west: 4 east against 4 west, also zero. Kiran is back exactly where she started, so the distance is 0 km.",
      },
      {
        id: "q11",
        text: "P is 5 km to the east of Q. R is 3 km to the north of P. S is 2 km to the west of R. In which direction is S from Q?",
        options: ["North-east", "North-west", "South-east", "South-west"],
        correctIndex: 0,
        explanation: "Put Q at 0, 0. Then P is at 5 east, R is at 5 east and 3 north, and S is at 3 east and 3 north. Since S is both east of and north of Q by the same amount, S lies exactly to the north-east of Q.",
      },
      {
        id: "q12",
        text: "A man walks 2 km east, turns right and walks 2 km, turns right again and walks 2 km, then turns left and walks 2 km. Which direction is he facing at the end?",
        options: ["North", "South", "East", "West"],
        correctIndex: 1,
        explanation: "Facing east, a right turn gives south. A second right turn gives west. A left turn while facing west gives south. So he ends up facing south. The trap is the last turn: facing west, left is south, not north.",
      },
      {
        id: "q13",
        text: "Two friends start from the same point. A walks 5 km north and then 5 km east. B walks 5 km south and then 5 km east. How far apart are they now?",
        options: ["5 km", "10 km", "0 km", "14 km"],
        correctIndex: 1,
        explanation: "A ends 5 north and 5 east of the start; B ends 5 south and 5 east. Their east-west positions are identical, so the whole gap is north-south: 5 north to 5 south is 10 km apart.",
      },
      {
        id: "q14",
        text: "Deepa is facing south. She turns left and walks 30 m, turns right and walks 15 m, turns right and walks 20 m, then turns right and walks 15 m. Where is she relative to her starting point?",
        options: ["10 m east", "10 m west", "20 m east", "15 m south"],
        correctIndex: 0,
        explanation: "Facing south, a left turn points her east, so 30 m east. A right turn while facing east points her south, so 15 m south. A right turn while facing south points her west, so 20 m west, leaving 10 m east. A final right turn while facing west points her north, so 15 m north, which cancels the 15 m south. Net movement is 10 m east.",
      },
      {
        id: "q15",
        text: "A man starts walking towards the south. After 15 m he turns to his left and walks 15 m, then turns to his left again and walks 15 m. How far and in which direction is he from his starting point?",
        options: ["15 m west", "15 m north", "30 m east", "15 m east"],
        correctIndex: 3,
        explanation: "Facing south, a left turn takes him east, not west - this is the whole question. So he goes 15 south, 15 east, and then a second left turn from east points him north for 15 m, which cancels the southward leg. He ends 15 m east of his start, and 15 m west is the answer of anyone who let 'left' mean 'west'.",
      },
    ],
    timedQuiz: { timeLimitSeconds: 300, mcqIds: ["q2", "q7", "q8", "q11", "q15"] },
    problemIds: [],
    xpReward: 50, coinReward: 20,
    status: "published",
  },

  // ------------------------------------------------------------------
  // Day 24 - Saturday 29 Aug 2026 - Linear Seating Arrangement
  // ------------------------------------------------------------------
  {
    date: "2026-08-29", dow: "sat", weekId: "2026-08-24", type: "lesson",
    title: "Day 24: Linear Seating Arrangement",
    difficulty: "Hard",
    estimatedMinutes: 20,
    concept: `## The Group Photo Nobody Could Line Up

::: story
Five cousins are being arranged for a photo and every one of them has a demand. One insists on standing at the end. One refuses to stand next to the one who insists on the end. One wants to be exactly beside the tallest. The photographer keeps shuffling people and undoing it, over and over, until somebody's father takes a pen and draws **five short lines on the back of an envelope**.

Then it takes twenty seconds. Not because he is cleverer - because he stopped holding five people in his head and gave each one a slot to sit in.

That is the whole method. The puzzle is not hard. Holding it in your memory is hard, and you never have to.
:::

## Blank Slots First, Names Later

Before reading a single clue, draw the row:

  1  2  3  4  5      left end at 1, right end at 5

Then decide the direction convention and write it down. When people **face north**, each person's right hand points east; so if seat 1 is the west end, "to the right of" always means a **higher** seat number. Write that above the row so you never re-derive it mid-question.

Now here is a real set of clues, solved in order.

**Five students P, Q, R, S, T sit in a row facing north.** Q is at the extreme left end. R is third to the right of Q. S is immediately to the left of R. T is not at an extreme end.

::: timeline Filling the row one forced move at a time
Q is at the extreme left end :: Q goes in seat 1. Start with the most rigid clue, always - this one has exactly one possibility
R is third to the right of Q :: Third to the right of seat 1 is seat 4, so R goes in seat 4. Had Q been at the right end instead, this clue would have run off the row, which is how end-position cases get eliminated
S is immediately to the left of R :: Immediately means no gap, so S goes in seat 3
T is not at an extreme end :: The free seats are 2 and 5. Seat 5 is an end, so T goes in seat 2
P takes what is left :: Only seat 5 remains, so P is at the extreme right end
:::

Final row: **Q, T, S, R, P.** Now re-read all four clues against it - all satisfied. Ten seconds, and you can answer any question they ask about this row: who is at the right end (P), who sits between T and R (S), how many people are between Q and R (two).

::: table What each clue phrase actually locks down
The clue says | It means | How strong it is
A sits at an extreme end | Seat 1 or the last seat, nothing between | Very strong - only two cases, so start here
A sits exactly between B and C | Three consecutive seats with A in the middle | Very strong - fixes a whole block
Only two people sit to the right of A | A is third from the right end, exactly | Very strong - fixes A absolutely
A is immediately to the right of B | The very next seat, nobody in between | Exact - a gap of one seat
A is second to the right of B | Exactly one person sits between B and A | Exact - a gap of two seats
A is third to the right of B | Exactly two people sit between B and A | Exact - a gap of three seats
A and B are neighbours | Adjacent, but either order | Exact gap, unknown direction - keep both cases
A sits somewhere to the right of B | A is anywhere after B, near or far | Weak - an ordering only, so use it last
:::

::: cards How to attack a row puzzle in the right order
Draw the slots before reading :: One numbered underscore per person, on paper, every time. You cannot hold six seats in your head and the attempt is what costs you the question.
Fix the direction convention :: Write which end is seat 1 and which way "right" runs. Facing north it runs one way, facing south the other, and a lot of marks live in that flip.
Take the most rigid clue first :: An "extreme end", an "exactly between" or a "only two people to the right" clue has one or two possibilities. A "somewhere to the left of" clue has many, so it waits.
Place, never choose :: Every name you write down must be forced by a clue. The moment you find yourself picking, you actually have two open cases - draw both rows side by side and let a later clue kill one.
Re-read every clue at the end :: Once the row is full, check all the clues against it. A correct arrangement satisfies every single one, and the check takes ten seconds.
:::

::: mistake
**Reading "somewhere to the left of" as "immediately to the left of".** In a row of five, "P sits somewhere to the left of Q" allows ten different position pairs; "P sits immediately to the left of Q" allows only four. If you quietly upgrade the weak clue into the strong one, you will build a row that satisfies everything you *think* you were told, look consistent, and be wrong - and there is no internal warning when this happens.

**Forgetting that facing south flips left and right.** Three people face north in the order Mohit, Sanjay, Rahul from west to east. Rahul is on Sanjay's right, because facing north your right hand points east. Turn all three around to face south and Sanjay's right hand now points **west**, so his right-hand neighbour is **Mohit**. Same seats, opposite answer.

**Off-by-one on positions.** In a row of 25, the 9th from the left is the **17th** from the right, because you must add 1 back: 25 minus 9 plus 1. Dropping the plus 1 and answering 16 is the most common single error in this topic.
:::

::: remember
**The ordinal gives you the gap, and the people between is always one less.** "Immediately to the right" means zero people between. "Second to the right" means one person between. "Third to the right" means two people between. Say it as a gap in seat numbers and you will never miscount.

Two conversions worth having automatic:
- Position from the right = **total minus position from the left, plus 1.**
- If two positions of the same person are given, total = **left position plus right position minus 1.** So somebody who is 7th from the left and 9th from the right sits in a row of 15.

And a boundary fact papers love: **compass words never flip.** Facing north or facing south changes what "left" and "right" mean, but the west end is the west end either way.
:::

::: checkpoint
Seven people sit in a row facing north. Only two people sit to the right of M. Counting from the left end, which position does M occupy?
- ( ) 3rd
- ( ) 4th
- (x) 5th
- ( ) 6th
> Two people to M's right means M is 3rd from the right end - M plus the two beyond him. Converting to the left: total minus position from the right plus 1, that is 7 minus 3 plus 1 = 5. So M is 5th from the left. Answering 3rd is the classic slip of quoting the position from the wrong end, and answering 4th comes from forgetting to add the 1 back.
:::

::: revision
Draw the numbered slots on paper **before** you read a clue, write down which end is seat 1 and which way "right" runs, then place people strictly in order of how rigid each clue is: extreme ends, "exactly between" and "only n people to the right of" first, plain gaps ("immediately", "second to the", "third to the") next, and vague orderings ("somewhere to the left of") last. Remember that the ordinal names the gap and the number of people between is one less, so "third to the right" means two people in between. Never write a name you were not forced to write - if you are choosing, you have two live cases, so draw both rows and let a later clue kill one, and accept "cannot be determined" when none does. Facing **south flips left and right** while leaving east and west alone, which is where papers hide half their marks. And keep the two conversions automatic: position from the right is total minus position from the left plus 1, and total is left position plus right position minus 1. Finish by re-reading every clue against the finished row.
:::`,
    mcqs: [
      {
        id: "q1",
        text: "Five students P, Q, R, S and T sit in a row facing north. Q is at the extreme left end. R is third to the right of Q. S is immediately to the left of R. T is not at an extreme end. Who sits at the extreme right end?",
        options: ["R", "S", "T", "P"],
        correctIndex: 3,
        explanation: "Q takes seat 1, so R (third to the right of Q) takes seat 4 and S takes seat 3. T cannot be at an end, so of the free seats 2 and 5 T takes seat 2. That leaves seat 5, the right end, for P. The row is Q, T, S, R, P.",
      },
      {
        id: "q2",
        text: "Five students P, Q, R, S and T sit in a row facing north. Q is at the extreme left end, R is third to the right of Q, S is immediately to the left of R, and T is not at an extreme end. Who sits between T and R?",
        options: ["P", "Q", "S", "Nobody"],
        correctIndex: 2,
        explanation: "The forced row is Q, T, S, R, P in seats 1 to 5. T is in seat 2 and R is in seat 4, so the single person between them is S in seat 3.",
      },
      {
        id: "q3",
        text: "Six friends A, B, C, D, E and F sit in a row facing north, with seat 1 at the left end. C sits second from the left. A sits immediately to the right of C. D sits at one of the extreme ends. B sits third to the left of F. Who sits immediately to the left of E?",
        options: ["A", "C", "F", "D"],
        correctIndex: 2,
        explanation: "C is in seat 2 and A in seat 3. For B third to the left of F, the only pair left among the free seats 1, 4, 5 and 6 is B in seat 1 and F in seat 4. D must be at an end, and seat 1 is taken, so D is in seat 6, leaving seat 5 for E. The row is B, C, A, F, E, D, so F sits immediately to E's left.",
      },
      {
        id: "q4",
        text: "Six friends A, B, C, D, E and F sit in a row facing north, with seat 1 at the left end. C sits second from the left, A sits immediately to the right of C, D sits at one of the extreme ends, and B sits third to the left of F. How many people sit between A and D?",
        options: ["One", "Two", "Three", "Four"],
        correctIndex: 1,
        explanation: "The forced row is B, C, A, F, E, D. A is in seat 3 and D in seat 6, so seats 4 and 5 lie between them: two people, F and E.",
      },
      {
        id: "q5",
        text: "Three boys stand in a row facing north. Rahul is immediately to the right of Sanjay, and Sanjay is immediately to the right of Mohit. All three now turn around so that they face south. Who is immediately to the right of Sanjay?",
        options: ["Mohit", "Rahul", "Nobody", "It cannot be determined"],
        correctIndex: 0,
        explanation: "Facing north, a person's right hand points east, so from west to east the order is Mohit, Sanjay, Rahul. After turning to face south, each person's right hand points west, so Sanjay's right-hand neighbour is now the person to his west, which is Mohit. The seats never moved - only the meaning of 'right' did.",
      },
      {
        id: "q6",
        text: "In a row of 40 students, Ankit is 11th from the left end and Bhavna is 31st from the right end. How many students sit between them?",
        options: ["None", "One", "Two", "Three"],
        correctIndex: 0,
        explanation: "Convert Bhavna to a left-end position: 40 minus 31 plus 1 = 10th from the left. Ankit is 11th from the left, so they occupy seats 10 and 11 - adjacent, with nobody between them.",
      },
      {
        id: "q7",
        text: "In a row of children, Rohan is 7th from the left end and Priya is 9th from the right end. If they exchange places, Rohan becomes 11th from the left end. How many children are in the row?",
        options: ["17", "18", "19", "20"],
        correctIndex: 2,
        explanation: "After the swap Rohan is sitting in Priya's old seat, which is 9th from the right, and that same seat is 11th from the left. So the total is 11 plus 9 minus 1 = 19. Forgetting to subtract the double-counted seat gives 20.",
      },
      {
        id: "q8",
        text: "Nine people sit in a row facing north. Only three people sit to the right of Vikram. What is Vikram's position from the left end?",
        options: ["5th", "6th", "7th", "8th"],
        correctIndex: 1,
        explanation: "Three people to his right makes Vikram 4th from the right end. Converting: 9 minus 4 plus 1 = 6th from the left. Answering 7th comes from treating 'three to the right' as 'third from the right'.",
      },
      {
        id: "q9",
        text: "Seven friends A, B, C, D, E, F and G sit in a row facing north, seat 1 at the left end. D sits exactly in the middle. A sits at the extreme right end. C sits second to the left of A. E is an immediate neighbour of C. G sits at the extreme left end. F sits immediately to the left of D. Who sits third to the right of B?",
        options: ["D", "E", "C", "F"],
        correctIndex: 2,
        explanation: "D takes the middle seat 4 and A takes seat 7, so C (second to the left of A) takes seat 5. E must neighbour C and seat 4 is taken, so E takes seat 6. G takes seat 1 and F takes seat 3, leaving seat 2 for B. The row is G, B, F, D, C, E, A, so third to the right of seat 2 is seat 5, which is C.",
      },
      {
        id: "q10",
        text: "Seven friends A, B, C, D, E, F and G sit in a row facing north, seat 1 at the left end. D sits exactly in the middle, A sits at the extreme right end, C sits second to the left of A, E is an immediate neighbour of C, G sits at the extreme left end, and F sits immediately to the left of D. Who sits exactly between D and E?",
        options: ["B", "F", "G", "C"],
        correctIndex: 3,
        explanation: "The forced row is G, B, F, D, C, E, A. D is in seat 4 and E in seat 6, so the person exactly between them is in seat 5, which is C.",
      },
      {
        id: "q11",
        text: "Four people W, X, Y and Z sit in a row of four seats. W sits somewhere to the left of X. Z sits immediately to the right of X. Y sits at an extreme end. Who sits at the extreme left end?",
        options: ["W", "Y", "X", "It cannot be determined"],
        correctIndex: 3,
        explanation: "Two arrangements satisfy every clue. If X is in seat 2 then Z is in seat 3, W must be in seat 1 (left of X) and Y is in seat 4, an end - giving W, X, Z, Y. But if X is in seat 3 then Z is in seat 4, and Y at an end must take seat 1 with W in seat 2 - giving Y, W, X, Z, which also satisfies W being left of X. The left end is W in one case and Y in the other, so it cannot be determined. 'Somewhere to the left of' is a weak clue and must not be read as 'immediately'.",
      },
      {
        id: "q12",
        text: "Five people sit in a row of five seats facing north. P is immediately to the left of Q, and Q is immediately to the left of R. S is at the extreme left end and T is at the extreme right end. Who sits in the middle seat?",
        options: ["Q", "P", "R", "S"],
        correctIndex: 0,
        explanation: "S occupies seat 1 and T occupies seat 5, so P, Q and R must fill seats 2, 3 and 4. Since they are consecutive in that order, P is in seat 2, Q in seat 3 and R in seat 4. The middle seat is 3, so Q sits there.",
      },
      {
        id: "q13",
        text: "In a row of 25 people all facing north, Meera is 9th from the left end. What is her position from the right end?",
        options: ["16th", "17th", "18th", "19th"],
        correctIndex: 1,
        explanation: "Position from the right is total minus position from the left, plus 1: 25 minus 9 plus 1 = 17th. Answering 16th is the off-by-one error of forgetting to add Meera's own seat back in.",
      },
      {
        id: "q14",
        text: "In a row of students, Arjun is 12th from the left end and 22nd from the right end. Two new students then join the row, one at each end. What is Arjun's new position from the left end?",
        options: ["12th", "13th", "14th", "23rd"],
        correctIndex: 1,
        explanation: "The original total is 12 plus 22 minus 1 = 33, though you do not even need it. Only the student added at the left end pushes Arjun along, by exactly one place, so he becomes 13th from the left. The one added at the right end changes his position from the right, not from the left.",
      },
      {
        id: "q15",
        text: "Six people sit in a row facing south. Rani is fourth from the west end of the row. What is her position from the east end?",
        options: ["2nd", "3rd", "4th", "It cannot be determined without knowing which way they face"],
        correctIndex: 1,
        explanation: "Compass directions do not depend on which way anybody faces: 6 minus 4 plus 1 = 3rd from the east end. Facing south only changes what the words 'left' and 'right' mean, which is why the last option is a trap - it would matter only if the question had used left or right.",
      },
    ],
    timedQuiz: { timeLimitSeconds: 300, mcqIds: ["q5", "q7", "q9", "q11", "q15"] },
    problemIds: [],
    xpReward: 50, coinReward: 20,
    status: "published",
  },

];

export default WEEK4_DAYS;
