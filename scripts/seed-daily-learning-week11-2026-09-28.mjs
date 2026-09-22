// Daily Learning - DSA Series, WEEK 11 (Mon 28 Sep - Wed 30 Sep 2026).
//
//   Week 9  2026-09-14  DP Foundations (1D)    Days 45-49 + Week 9 Master Test
//   Week 10 2026-09-21  Knapsack & Subset DP   Days 50-54 + Week 10 Master Test
//   Week 11 2026-09-28  String & Grid DP       Days 55-57  <- this file, PARTIAL
//
// *** THIS WEEK IS DELIBERATELY INCOMPLETE - READ BEFORE EXTENDING IT ***
//
// It carries THREE days (Mon 28, Tue 29, Wed 30 Sep) and NO Saturday master
// test. That is not an oversight and not a truncated authoring session: the
// brief was to fill the series through the end of September, and this week's
// Thursday, Friday and Saturday fall on 1, 2 and 3 OCTOBER. Every other week
// in this track is exactly 6 docs (5 lessons + 1 Saturday test); this one is
// 3, and the week's master test does not exist anywhere.
//
// WHOEVER SEEDS OCTOBER: the immediate next task is Thu 2026-10-01,
// Fri 2026-10-02 and the "Week 11 Master Test" on Sat 2026-10-03, continuing
// from Day 57 (so Days 58-59 + the test). The three days below cover LCS,
// palindromic subsequences and grid DP; the obvious completion is edit
// distance (Day 58) and matrix chain multiplication or palindromic
// partitioning (Day 59), both of which sit directly on Day 54's interval-DP
// state and on Day 55's two-index state. Published, unused problems exist for
// all of these - bSjJdvZBpTTD9FIFApWb (Matrix Chain Multiplication),
// i2wRyTsmcynUkjRmlQFL (Maximum Size Square Sub-Matrix With All 1s),
// TBxHBnGGyhv3ecDOS46F (Maximum Sum Rectangle in a 2D Matrix) - so the
// follow-up does not need new problem authoring.
//
// WHY THIS TOPIC NEXT: Day 54 introduced interval DP - a state of two
// endpoints, filled by increasing length - and said explicitly that it was
// the state shape strings need. Day 55 delivers that: two strings, one index
// into each, and the same "what does this cell read" discipline deciding the
// fill order. Day 56 then shows the single most useful reduction in the topic
// (longest palindromic subsequence IS LCS of a string with its own reverse),
// which retires a whole class of interview questions for the price of one
// observation. Day 57 closes the month on grid DP, the gentlest 2-D state of
// all, chosen last on purpose: after knapsack's (item, capacity) and LCS's
// (i, j), a grid's (row, col) needs almost no explanation, so the month ends
// on consolidation rather than on a new idea.
//
// DAY NUMBERING continues the titles: week 10's last lesson was Day 54, so
// this week runs Days 55-57.
//
// SHAPE matches the live docs exactly:
//   lesson (Mon-Wed): 5 MCQs, xpReward 50, coinReward 20, 1-2 problemIds
//   (no test doc this week - see above)
//
// audiences: ["legacy"] - same reasoning weeks 5-10 documented.
//
// problemIds verified live against `problems` (status=="published") and
// re-checked by this script's tail.
//
// ASCII hyphens only - scripts/normalize-dashes.mjs rewrites em/en dashes.
//
// Idempotent: refuses to overwrite a date that already exists.
//
//   node scripts/seed-daily-learning-week11-2026-09-28.mjs            # dry run
//   node scripts/seed-daily-learning-week11-2026-09-28.mjs --apply

import admin from "firebase-admin";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
admin.initializeApp({
  credential: admin.credential.cert(
    JSON.parse(readFileSync(join(__dirname, "service-account.json"), "utf8"))
  ),
});
const db = admin.firestore();
const FV = admin.firestore.FieldValue;

const APPLY = process.argv.includes("--apply");
const INSTITUTION_ID = "mrcet";
const WEEK_ID = "2026-09-28";

const mcq = (id, text, options, correctIndex) => ({ id, text, options, correctIndex });

const DAYS = [
  {
    date: "2026-09-28", dow: "mon", type: "lesson",
    title: "Day 55: Longest Common Subsequence - DP on Two Strings",
    problemIds: [
      "fCRNdIv7HR8rZ1LrtuSx", // Longest Common Substring (Medium, DP)
      "UEXYlZtEtHnInOC30Dyb", // LCS of Three Strings (Medium, DP)
    ],
    concept:
`Knapsack's state was (items processed, capacity left). Today's is (characters consumed from string A, characters consumed from string B). Two strings, one index into each - and with that, a family of problems that looks nothing like a bag of items turns out to use the identical machinery.

THE PROBLEM - LONGEST COMMON SUBSEQUENCE (LCS): given two strings, find the length of the longest sequence of characters appearing in BOTH, in the same relative order, not necessarily contiguously.

  A = "AGGTAB"
  B = "GXTXAYB"
  LCS = "GTAB", length 4.

Check it against both strings: G, T, A, B appear in that order in AGGTAB (positions 2, 4, 5, 6) and in GXTXAYB (positions 1, 3, 5, 7). Neither occurrence is contiguous, which is exactly what makes it a SUBSEQUENCE rather than a substring.

THE STATE: dp[i][j] = the length of the LCS of the first i characters of A and the first j characters of B.

THE RECURRENCE. Look only at the LAST character of each prefix. There are two cases, and the whole algorithm is deciding which applies:

  IF A[i-1] == B[j-1]
      That shared character can always be appended to the best LCS of what
      came before it, and doing so is never worse. Consume BOTH:
          dp[i][j] = 1 + dp[i-1][j-1]

  ELSE
      The last characters differ, so at least one of them cannot be part of
      a common subsequence ending here. We do not know which, so try both
      and keep the better:
          dp[i][j] = max( dp[i-1][j],      # drop A's last character
                          dp[i][j-1] )     # drop B's last character

  dp[0][j] = 0 and dp[i][0] = 0     (an empty string shares nothing)

Why the equal case needs no max: if the characters match, there is always an optimal LCS that uses that match, so taking it costs nothing. That is a greedy choice INSIDE a DP, and it is safe here for a provable reason - the exchange argument from Day 40 applies to it directly.

TRACED. A = "AGGTAB" (rows), B = "GXTXAYB" (columns).

        ""  G  X  T  X  A  Y  B
    ""   0  0  0  0  0  0  0  0
    A    0  0  0  0  0  1  1  1
    G    0  1  1  1  1  1  1  1
    G    0  1  1  1  1  1  1  1
    T    0  1  1  2  2  2  2  2
    A    0  1  1  2  2  3  3  3
    B    0  1  1  2  2  3  3  4

  Reading a few cells to see the rules fire:
    row A, col A  : 'A' == 'A' -> 1 + dp(above-left = 0) = 1
    row G, col G  : 'G' == 'G' -> 1 + dp(above-left = 0) = 1
    row T, col T  : 'T' == 'T' -> 1 + dp(above-left = 1) = 2
    row B, col B  : 'B' == 'B' -> 1 + dp(above-left = 3) = 4
    row T, col X  : 'T' != 'X' -> max(above = 1, left = 1) = 1

  answer: dp[6][7] = 4.

  To recover the string itself, walk back from the bottom-right: on a match
  step diagonally and emit the character, otherwise move toward the larger
  of (above, left). That path spells "GTAB" in reverse.

THE FILL ORDER. dp[i][j] reads only cells above, to the left, and diagonally above-left - all of which have smaller i or smaller j. So a plain row-by-row, left-to-right double loop is a valid order, with no length-based ordering needed. Compare Day 54, where the reads went to both ends of a shrinking range and the loop HAD to be over length. The rule generalises: look at which cells the recurrence reads, then choose any loop order that writes them first.

COMPLEXITY: O(len(A) x len(B)) time and space. Since each row reads only the row above, the space rolls to O(min(len(A), len(B))) by keeping two rows - and, as with knapsack, rolling it destroys the ability to reconstruct the actual subsequence.

SUBSEQUENCE VERSUS SUBSTRING - ONE CHANGED LINE. Longest Common SUBSTRING requires contiguity. The mismatch case can therefore no longer inherit a partial answer, because any break resets the run to nothing:

  if A[i-1] == B[j-1]:  dp[i][j] = 1 + dp[i-1][j-1]
  else:                 dp[i][j] = 0                  # not a max - a reset
  answer = the MAXIMUM cell anywhere in the table, not dp[n][m]

  On A = "ABCDGH", B = "ACDGHR" the answer is 4, from "CDGH".

Both differences matter. The 0 encodes "a common run cannot skip", and the answer moves from the corner to the whole-table maximum because the best run need not end at the end of either string - exactly the point Day 48 made about LIS.

SCALING TO THREE STRINGS. LCS of three strings adds a third index, giving dp[i][j][k], and the two cases become: all three last characters equal, so 1 + dp[i-1][j-1][k-1]; otherwise the max over dropping the last character of each of the three. O(n^3) time and space. The pattern is worth seeing once, because it shows the state growing with the problem rather than the technique changing.`,
    mcqs: [
      mcq("q1", "In the LCS table, dp[i][j] stores:", [
        "The LCS length of the first i characters of A and the first j of B",
        "Whether A[i] equals B[j]",
        "The number of common substrings of length i and j",
        "The edit distance between the two prefixes",
      ], 0),
      mcq("q2", "When A[i-1] == B[j-1], the LCS recurrence takes 1 + dp[i-1][j-1] with no max because:", [
        "The strings must be equal in length", "There is always an optimal LCS that uses the matching pair",
        "dp[i-1][j] is always smaller", "The match resets the running count",
      ], 1),
      mcq("q3", "For A = \"AGGTAB\" and B = \"GXTXAYB\", the LCS length is:", [
        "3", "4", "5", "6",
      ], 1),
      mcq("q4", "Converting LCS into Longest Common SUBSTRING requires changing the mismatch case to:", [
        "max(dp[i-1][j], dp[i][j-1])", "0, because contiguity cannot survive a break",
        "1 + dp[i-1][j-1]", "dp[i-1][j-1]",
      ], 1),
      mcq("q5", "For Longest Common Substring, the answer is read from:", [
        "dp[n][m], the bottom-right cell", "The maximum cell anywhere in the table",
        "The first row", "The diagonal only",
      ], 1),
    ],
  },

  {
    date: "2026-09-29", dow: "tue", type: "lesson",
    title: "Day 56: Palindromic Subsequences & the Reverse Trick",
    problemIds: [
      "WqQFSUbennoH78bDaM9O", // Longest Palindromic Subsequence (Medium, DP)
    ],
    concept:
`Today has one idea, and it is worth more than the algorithm it solves: a problem about ONE string can sometimes be restated as a problem about TWO, at which point yesterday's table answers it unchanged.

THE PROBLEM - LONGEST PALINDROMIC SUBSEQUENCE (LPS): find the length of the longest subsequence of a string that reads the same forwards and backwards. Characters may be skipped freely; they may not be reordered.

  s = "BBABCBCAB"
  LPS = "BABCBAB", length 7.

Verify it is a subsequence: B(0) A(2) B(3) C(4) B(5) A(7) B(8) - indices strictly increasing, and the string is a palindrome. Length 7 out of 9.

SOLUTION 1 - THE REVERSE TRICK. A palindrome reads identically in both directions. So any palindromic subsequence of s is also a subsequence of reverse(s), and conversely, the longest sequence common to s and its own reverse is exactly the longest palindromic subsequence:

  LPS(s) = LCS( s, reverse(s) )

  s        = "BBABCBCAB"
  reverse  = "BACBCBABB"
  LCS of those two = 7, and it is the same "BABCBAB".

That is the whole solution: reverse the string, call yesterday's function, done. No new recurrence, no new table, no new fill order. When a problem is symmetric in this way, look for a second object to compare against before writing anything new.

  ONE CAUTION, because it is a genuine trap: the trick is exact for
  SUBSEQUENCES and WRONG for SUBSTRINGS. LCS(s, reverse(s)) does not give
  the longest palindromic SUBSTRING - on "ABACDFGDCABA" it returns a common
  run that is not itself a palindrome. Longest palindromic substring needs
  its own method (expand around each centre, or Manacher's). Know which of
  the two you are being asked for.

SOLUTION 2 - INTERVAL DP DIRECTLY. Worth building anyway, because it is the version that extends to the follow-up questions, and because it is Day 54's state applied to a string.

  dp[i][j] = the LPS length within s[i..j] inclusive

  if s[i] == s[j]:   dp[i][j] = 2 + dp[i+1][j-1]      # both ends join the palindrome
  else:              dp[i][j] = max( dp[i+1][j],      # drop the left character
                                     dp[i][j-1] )     # drop the right character

  dp[i][i] = 1                                        (a single character)
  dp[i][j] = 0 when i > j                             (empty range)

Read the matching case literally: if the two ends agree, wrap them around the best palindrome strictly inside, gaining 2. If they disagree, at least one end is unusable, and since we cannot tell which, try both.

FILL ORDER - the Day 54 rule applies again. dp[i][j] reads dp[i+1][j-1], dp[i+1][j] and dp[i][j-1], all of which describe SHORTER ranges. So the loops must run over increasing range length, exactly as interval DP demanded:

  for length in 1..n:
      for i in 0..n-length:
          j = i + length - 1
          ... compute dp[i][j] ...

TRACED on the short string "BBAB" (indices 0..3):

  length 1:  dp[0][0] = dp[1][1] = dp[2][2] = dp[3][3] = 1

  length 2:  dp[0][1]: s[0]='B', s[1]='B' equal -> 2 + dp[1][0] (empty = 0) = 2
             dp[1][2]: 'B' vs 'A' differ        -> max(dp[2][2], dp[1][1]) = 1
             dp[2][3]: 'A' vs 'B' differ        -> max(dp[3][3], dp[2][2]) = 1

  length 3:  dp[0][2]: 'B' vs 'A' differ        -> max(dp[1][2] = 1, dp[0][1] = 2) = 2
             dp[1][3]: 'B' vs 'B' equal         -> 2 + dp[2][2] = 2 + 1 = 3      ("BAB")

  length 4:  dp[0][3]: 'B' vs 'B' equal         -> 2 + dp[1][2] = 2 + 1 = 3      ("BBB" or "BAB")

  answer: dp[0][3] = 3.

A RELATED QUESTION THIS TABLE ANSWERS FREE. "What is the minimum number of characters to INSERT anywhere in s to make it a palindrome?" Every character not already part of the longest palindromic subsequence must be mirrored by one insertion, so:

  minimum insertions = length(s) - LPS(s)

  For "BBABCBCAB": 9 - 7 = 2.

The identical formula with deletions instead of insertions gives the minimum deletions to make a palindrome - the same characters are the problem either way. Two more interview questions retired by one table.

COMPLEXITY: O(n^2) time and O(n^2) space for either solution. The reverse trick is usually the one to write under time pressure, because it reuses code that already exists and is far harder to get wrong; the interval version is the one to reach for when the follow-up asks for counts, partitions, or the palindrome itself.`,
    mcqs: [
      mcq("q1", "Longest Palindromic Subsequence can be computed as:", [
        "LCS of the string with itself", "LCS of the string with its reverse",
        "The longest common substring of the string and its reverse", "Kadane's algorithm on character codes",
      ], 1),
      mcq("q2", "For s = \"BBABCBCAB\", the LPS length is:", [
        "5", "6", "7", "8",
      ], 2),
      mcq("q3", "In the interval formulation, s[i] == s[j] gives dp[i][j] = 2 + dp[i+1][j-1] because:", [
        "Both ends are discarded", "Both ends wrap around the best palindrome strictly inside",
        "Only one end can be used", "The range must be even in length",
      ], 1),
      mcq("q4", "The LPS interval table must be filled in increasing order of range length because dp[i][j] reads:", [
        "Longer ranges", "Strictly shorter ranges such as dp[i+1][j-1]", "Only the diagonal", "The whole first row",
      ], 1),
      mcq("q5", "The minimum number of insertions needed to make a string of length n a palindrome equals:", [
        "n - LPS(s)", "n / 2", "LPS(s)", "n - 1",
      ], 0),
    ],
  },

  {
    date: "2026-09-30", dow: "wed", type: "lesson",
    title: "Day 57: DP on a Grid - Paths, Costs & Collecting Gold",
    problemIds: [
      "xuuUzYTxaFyN65kcLX4w", // Minimum Cost Path in a Grid (Medium, DP)
      "X6lp2zjJ3FBOmio64zli", // Gold Mine Problem (Medium, DP)
    ],
    concept:
`The month closes on the friendliest 2-D state there is. In knapsack the two coordinates were an item index and a budget; in LCS they were positions in two different strings. Here they are simply a row and a column, and the table has the same shape as the problem itself - which makes grid DP the best place to consolidate everything from the last three weeks.

THE BASE PROBLEM - COUNTING PATHS. In an m x n grid, moving only RIGHT or DOWN, how many distinct paths lead from the top-left to the bottom-right?

  dp[r][c] = number of ways to reach cell (r, c)
           = dp[r-1][c] + dp[r][c-1]          (arrived from above, or from the left)

  dp[0][c] = 1 for every c        (only one way along the top edge: all rights)
  dp[r][0] = 1 for every r        (only one way down the left edge: all downs)

The entire first row and first column are 1, and every interior cell is the sum of its two neighbours - which makes the table Pascal's triangle wearing a rectangle, so the answer is also the binomial coefficient C(m+n-2, m-1). Seeing both derivations of the same number is a good check that the recurrence is right.

THE WEIGHTED VERSION - MINIMUM COST PATH. Each cell now carries a cost, and a path pays the cost of every cell it enters, including both endpoints. Minimise the total. Sum becomes min, and the cell's own cost is added on:

  dp[r][c] = cost[r][c] + min( dp[r-1][c], dp[r][c-1] )

  first row:    dp[0][c] = dp[0][c-1] + cost[0][c]     (no cell above)
  first column: dp[r][0] = dp[r-1][0] + cost[r][0]     (no cell to the left)

Initialising the edges properly is where implementations break. An interior cell has two predecessors; an edge cell has exactly one, and reading the missing one as 0 produces a path that never existed.

TRACED on

      1  3  1
      1  5  1
      4  2  1

  first row:     1,  1+3 = 4,  4+1 = 5
  first column:  1,  1+1 = 2,  2+4 = 6

  dp[1][1] = 5 + min(dp[0][1] = 4, dp[1][0] = 2) = 5 + 2 = 7
  dp[1][2] = 1 + min(dp[0][2] = 5, dp[1][1] = 7) = 1 + 5 = 6
  dp[2][1] = 2 + min(dp[1][1] = 7, dp[2][0] = 6) = 2 + 6 = 8
  dp[2][2] = 1 + min(dp[1][2] = 6, dp[2][1] = 8) = 1 + 6 = 7

  final table:   1  4  5
                 2  7  6
                 6  8  7

  answer: 7, via the path 1 -> 3 -> 1 -> 1 -> 1 (right, right, down, down).

THE VARIANT THAT CHANGES THE FILL ORDER - THE GOLD MINE. A miner starts in ANY row of the leftmost column and moves one column right at each step, going right, right-up, or right-down. Collect the maximum gold.

Two structural differences from every grid DP above, and both matter:

  - The start is not a single cell. Any cell in column 0 is a legal start, so
    the whole first column is seeded with its own value rather than with an
    accumulated one.
  - The answer is not a single cell either. The miner may exit from any row
    of the last column, so the answer is the MAXIMUM over that column.

  dp[r][c] = gold[r][c] + max( dp[r-1][c-1],     # arrived from up-left
                               dp[r][c-1],       # arrived from straight left
                               dp[r+1][c-1] )    # arrived from down-left

  processed COLUMN BY COLUMN, because every read is from column c-1.

TRACED on

      1  3  3
      2  1  4
      0  6  4

  column 0 (seed with the cell's own gold):   1, 2, 0

  column 1:
      dp[0][1] = 3 + max(dp[0][0] = 1, dp[1][0] = 2)            = 3 + 2 = 5
      dp[1][1] = 1 + max(dp[0][0] = 1, dp[1][0] = 2, dp[2][0] = 0) = 1 + 2 = 3
      dp[2][1] = 6 + max(dp[1][0] = 2, dp[2][0] = 0)            = 6 + 2 = 8

  column 2:
      dp[0][2] = 3 + max(dp[0][1] = 5, dp[1][1] = 3)            = 3 + 5 = 8
      dp[1][2] = 4 + max(dp[0][1] = 5, dp[1][1] = 3, dp[2][1] = 8) = 4 + 8 = 12
      dp[2][2] = 4 + max(dp[1][1] = 3, dp[2][1] = 8)            = 4 + 8 = 12

  answer: max(8, 12, 12) = 12.

  Note the row-by-row loop would be wrong here. Reads come from the previous
  COLUMN, so the outer loop must be over columns - the same "look at what the
  recurrence reads, then pick an order that writes it first" rule that decided
  Day 54's length ordering and Day 55's row ordering.

SPACE. Both grid DPs read only the previous row (or column), so both roll down to a single 1-D array, O(min(m, n)) space. And as always, rolling forfeits reconstruction of the path.

WHERE THE MONTH LEAVES YOU. Three weeks ago a greedy algorithm committed to one choice and could not be talked out of it. Since then: greedy with proof (week 8), 1-D tables (week 9), two-coordinate tables and interval DP (week 10), and two-string and grid DP (this week). Every one of them was built by the same four questions from Day 45 - state, recurrence, base case, fill order - and the only thing that ever really changed was the state. That is the actual takeaway of the month, and it is what makes an unseen DP problem tractable: do not look for a remembered algorithm, decide what a subproblem must know.`,
    mcqs: [
      mcq("q1", "For counting right/down paths through a grid, dp[r][c] = dp[r-1][c] + dp[r][c-1], and the entire first row and column are initialised to:", [
        "0", "1", "The cell's own cost", "The grid width",
      ], 1),
      mcq("q2", "For the grid [[1,3,1],[1,5,1],[4,2,1]] moving only right and down, the minimum path cost is:", [
        "6", "7", "8", "12",
      ], 1),
      mcq("q3", "Initialising the first row and column separately in Minimum Cost Path is necessary because those cells:", [
        "Always contain the smallest costs", "Have only one predecessor, not two",
        "Are visited twice", "Must be excluded from the total",
      ], 1),
      mcq("q4", "In the Gold Mine problem, the final answer is:", [
        "dp at the bottom-right cell", "The maximum over the last column",
        "The maximum over the first column", "The sum of the last column",
      ], 1),
      mcq("q5", "For the gold grid [[1,3,3],[2,1,4],[0,6,4]], the maximum gold collectable is:", [
        "10", "11", "12", "14",
      ], 2),
    ],
  },
];

async function main() {
  const col = db.collection("institutions").doc(INSTITUTION_ID).collection("dailyLearning");

  const mod = await col.doc("_module").get();
  console.log(`_module.enabled = ${mod.exists ? mod.data().enabled : "(missing)"}`);
  console.log(`NOTE: partial week by design - 3 lessons, no Saturday test (10-03 is October).\n`);

  let created = 0, skipped = 0;
  for (const d of DAYS) {
    const existing = await col.doc(d.date).get();
    if (existing.exists) {
      console.log(`  SKIP   ${d.date} - already exists: "${existing.data().title}"`);
      skipped++;
      continue;
    }

    const payload = {
      date: d.date,
      weekId: WEEK_ID,
      dow: d.dow,
      type: d.type,
      title: d.title,
      concept: d.concept,
      mcqs: d.mcqs,
      problemIds: d.problemIds,
      xpReward: d.xpReward ?? 50,
      coinReward: d.coinReward ?? 20,
      status: "published",
      audiences: ["legacy"],
      createdAt: FV.serverTimestamp(),
    };

    console.log(`  ${APPLY ? "CREATE" : "would create"} ${d.date} [${d.dow}/${d.type}] ${d.title}`);
    console.log(`         mcqs=${d.mcqs.length} problems=${d.problemIds.length} xp=${payload.xpReward} coins=${payload.coinReward} concept=${d.concept.length} chars`);

    if (APPLY) await col.doc(d.date).set(payload);
    created++;
  }

  const ids = [...new Set(DAYS.flatMap(d => d.problemIds))];
  let bad = 0;
  for (const id of ids) {
    const p = await db.collection("problems").doc(id).get();
    const ok = p.exists && p.data().status === "published";
    if (!ok) { console.log(`  *** BAD problemId ${id} - exists=${p.exists} status=${p.exists ? p.data().status : "-"}`); bad++; }
  }
  console.log(`\nproblemIds checked: ${ids.length}, unresolved: ${bad}`);
  console.log(`${APPLY ? "created" : "would create"}: ${created}   skipped (already present): ${skipped}`);
  if (!APPLY) console.log("\ndry run - re-run with --apply");
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
