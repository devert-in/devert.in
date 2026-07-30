// GATE Digital Logic - authored lesson content. Follows the authoring rules
// documented at the top of general-aptitude.mjs.
//
// status is intentionally absent: scripts/write-gate-lessons.mjs excludes it from
// CONTENT_FIELDS, because publication state belongs to the syllabus seeder, not to
// a lesson body.

export const DIGITAL_LOGIC = {
  "karnaugh-map": {
    "xpReward": 25,
    "coinReward": 10,
    "difficulty": "Moderate",
    "estimatedMinutes": 35,
    "whatYoullLearn": [
      "Why K-map cells are laid out in Gray code order rather than binary counting order",
      "How to group minterms on 3- and 4-variable maps, including wrap-around groups",
      "How to read a minimal SOP expression straight off the map",
      "How to use don't-care conditions to make a group bigger",
      "The difference between a prime implicant and an essential prime implicant"
    ],
    "prerequisites": [
      "Boolean Algebra Fundamentals",
      "Logic Gates and Universal Gates"
    ],
    "concept": "## The problem K-maps solve\n\nAlgebraic minimization works, but it needs you to *spot* which identity applies next. Miss one application of `A + A' = 1` and you ship a circuit with more gates than it needs. A Karnaugh map turns that search into something visual and mechanical: adjacency on the map **is** the algebraic simplification.\n\n## Why Gray code order matters\n\nThe whole method rests on one property: physically adjacent cells must differ in exactly one variable. That is why the columns run **00, 01, 11, 10** and never 00, 01, 10, 11.\n\n::: mistake\nLabelling a K-map in binary counting order (00, 01, 10, 11) is the single most common way to get a K-map question wrong. The map still *looks* right, but adjacency no longer means anything and every group you read off is invalid.\n:::\n\nWhen two adjacent cells both contain 1, exactly one variable changes between them, so that variable cancels:\n\n  A'B'C + A'BC          (B changes, A and C do not)\n  = A'C(B' + B)\n  = A'C\n\nGrouping two cells on the map performs that cancellation for you.\n\n## The procedure\n\n::: flow\nPlot every minterm as a 1 -> Circle the largest legal groups -> Cover every 1 at least once -> Read one product term per group -> OR the terms together\n:::\n\nA group is legal only when its size is a **power of two** - 1, 2, 4, 8, 16.\n\n::: cards Group size and what it buys you\n1 cell :: No variables eliminated. A full n-literal product term.\n2 cells :: 1 variable eliminated.\n4 cells :: 2 variables eliminated.\n8 cells :: 3 variables eliminated.\n:::\n\nThe map also **wraps around**: the leftmost column is adjacent to the rightmost, and the top row is adjacent to the bottom. The four corners of a 4-variable map form a single legal group of 4.\n\n::: checkpoint\nOn a 4-variable K-map, you have circled a group of 4 cells. How many literals are in the resulting product term?\n- ( ) 4\n- (x) 2\n- ( ) 1\n- ( ) 3\n> A group of 4 = 2^2 cells eliminates k = 2 variables. Starting from 4 variables, 4 - 2 = 2 literals remain.\n:::\n\n## Prime implicants\n\nA **prime implicant** is a group that cannot be made any larger. An **essential prime implicant** is a prime implicant that covers at least one 1 that *no other* prime implicant covers.\n\nEssential prime implicants must appear in every minimal expression - that is what makes them the right place to start. Non-essential ones are a choice, which is why a function can have more than one equally minimal SOP form.\n\n::: remember\n\"How many essential prime implicants does F have?\" is a far more common GATE question than \"minimize F\". Find the 1s that only one group can reach.\n:::\n\n## Don't-care conditions\n\nA don't-care (`X`) is an input combination that cannot occur, or whose output nobody cares about. You may treat each `X` as 1 or 0 independently - whichever makes your groups bigger.\n\n::: tip\nInclude an `X` when it enlarges a group. Never create a group made *only* of don't-cares - you would be paying gates for an output nobody asked for.\n:::",
    "deepDive": "## POS form from the same map\n\nEverything above produces a minimal **SOP** (sum of products). For minimal **POS** (product of sums), group the **0s** instead, read each group as a sum term, and complement each variable as you read it.\n\nGrouping the 0s of F gives you a minimal SOP for F'. Applying De Morgan to that gives minimal POS for F. The two forms are not always the same gate count - a question asking for \"minimum number of gates\" may need you to check both.\n\n## Where K-maps stop being the tool\n\nBeyond 5-6 variables a K-map becomes unreadable, which is exactly why the syllabus also lists the **tabular (Quine-McCluskey) method**. Quine-McCluskey is the same idea made systematic enough for a computer: combine terms differing in one bit, repeat until nothing combines, then solve a prime-implicant chart for a minimal cover.\n\n::: interview\nK-maps rarely come up in software interviews, but the underlying skill does: collapsing a tangle of boolean conditions in an `if` into the smallest correct predicate is the same operation.\n:::",
    "dryRun": "Minimize **F(A,B,C,D) = Σ(0, 1, 2, 3, 8, 9, 10, 11)**.\n\n::: timeline Working\nStep 1 :: Write each minterm in binary as ABCD. 0=0000, 1=0001, 2=0010, 3=0011, 8=1000, 9=1001, 10=1010, 11=1011.\nStep 2 :: Look at what is constant. In every one of the eight terms, **B = 0**. A takes both values, C takes both values, D takes both values.\nStep 3 :: Minterms 0-3 all have A=0, B=0, so they form a group of 4 giving **A'B'**. Minterms 8-11 all have A=1, B=0, giving **AB'**.\nStep 4 :: Those two groups of 4 are themselves adjacent (they differ only in A), so they merge into one group of **8**.\nStep 5 :: A group of 8 on a 4-variable map eliminates log2(8) = 3 variables, leaving 4 - 3 = 1 literal.\nStep 6 :: The surviving literal is the one that never changed: **F = B'**.\n:::\n\nSanity check algebraically: A'B' + AB' = B'(A' + A) = B'. One literal, one inverter, no other gates.",
    "keyPoints": [
      "Adjacent cells differ in exactly one variable - this is why Gray code order (00, 01, 11, 10) is mandatory",
      "Group sizes must be powers of two: 1, 2, 4, 8, 16",
      "A group of 2^k cells on an n-variable map yields a term with n - k literals",
      "The map wraps around: left edge touches right edge, top touches bottom, and all four corners are one group",
      "Essential prime implicants appear in every minimal solution - identify them first",
      "Group the 0s instead of the 1s to get minimal POS rather than minimal SOP"
    ],
    "commonMistakes": [
      "Labelling the map in binary counting order instead of Gray code - every group read off it is then wrong",
      "Making a group of 3, 5, 6 or 7 cells - group sizes are powers of two only",
      "Forgetting wrap-around adjacency, and so missing the corner group on a 4-variable map",
      "Building a group entirely out of don't-cares, which adds gates for no required output",
      "Stopping at the first valid cover instead of checking whether a larger group exists"
    ],
    "analogies": [
      "A K-map is seating people so that neighbours differ by exactly one trait - once seated that way, you can spot 'everyone in this block shares X, ignore the rest' at a glance"
    ],
    "memoryTricks": [
      "Gray code order is 00, 01, 11, 10 - the middle two are the 'odd' pair. If your columns read 10 third, you have made the classic mistake",
      "'Powers of two, largest first' is the whole grouping rule in four words",
      "A group of 2^k kills k variables - the exponent is the count of variables eliminated"
    ],
    "formulas": [
      "A group of 2^k cells on an n-variable map produces a product term with (n - k) literals",
      "An n-variable K-map has 2^n cells",
      "Number of cells in a legal group is always 2^k for integer k >= 0"
    ],
    "shortcuts": [
      "Count the 1s first: if the count is a power of two and they are all mutually adjacent, the answer is a single term",
      "Find cells with only one possible group - those groups are essential, so start there and cover the rest afterwards",
      "For 'how many essential prime implicants', scan for 1s reachable by exactly one maximal group rather than minimizing the whole function"
    ],
    "pyqRelevance": "Digital Logic reliably carries 5-7 marks, and minimization is the most predictable part of it. Questions split into two shapes: give a minimal expression for a stated Sigma-list, or count prime implicants / essential prime implicants for one. The second shape is more common in recent papers and is faster if you know to look for singly-covered 1s rather than minimizing everything.",
    "interviewConnection": "Not asked directly, but simplifying compound boolean conditions in code is the same skill, and interviewers do notice when a candidate collapses a four-clause conditional into one.",
    "revisionSummary": "Plot minterms in Gray code order. Circle the largest power-of-two groups, using wrap-around and helpful don't-cares. Each group of 2^k cells gives a term with (n - k) literals. OR the terms. Group the 0s instead for POS.",
    "shortNotes": {
      "fiveMinute": "A K-map lays minterms out so that adjacent cells differ in exactly one variable - hence Gray code column order **00, 01, 11, 10**. Circling adjacent 1s performs the cancellation `A + A' = 1` visually.\n\nRules: groups are powers of two (1/2/4/8/16); the map wraps around on both axes so the four corners form one group; a group of 2^k cells on an n-variable map leaves (n - k) literals.\n\nA **prime implicant** is a maximal group. An **essential** prime implicant covers a 1 no other group can reach, so it appears in every minimal answer - find those first. Don't-cares may be used as 1 or 0 to enlarge a group, but never form a group entirely from them.\n\nGroup the **0s** instead of the 1s to get minimal POS.",
      "oneMinute": "Gray code order 00/01/11/10. Groups are powers of two only. Wrap-around counts, corners are one group. A 2^k group kills k variables. Essential PIs cover a 1 nothing else can - start there. Don't-cares enlarge groups but never form one alone.",
      "nightBefore": "Gray code, not binary counting. Powers of two only. Wrap-around and corners are legal groups. 2^k cells removes k variables."
    },
    "mcqs": [
      {
        "question": "Why are K-map columns labelled 00, 01, 11, 10 rather than 00, 01, 10, 11?",
        "options": [
          "To make the map easier to draw",
          "So that physically adjacent cells differ in exactly one variable",
          "Because binary counting order is not a valid encoding",
          "To keep the number of columns a power of two"
        ],
        "correctIndex": 1,
        "explanation": "The entire method depends on adjacency meaning 'differs in one variable', which is what Gray code order guarantees. In binary counting order, 01 and 10 would be adjacent while differing in two variables."
      },
      {
        "question": "A group of 8 cells is circled on a 4-variable K-map. How many literals are in the resulting product term?",
        "options": [
          "0",
          "1",
          "2",
          "3"
        ],
        "correctIndex": 1,
        "explanation": "8 = 2^3, so k = 3 variables are eliminated, leaving 4 - 3 = 1 literal."
      },
      {
        "question": "Which of these is NOT a legal K-map group size?",
        "options": [
          "2",
          "4",
          "6",
          "8"
        ],
        "correctIndex": 2,
        "explanation": "Group sizes must be powers of two. 6 is not, so a 6-cell group is invalid - it must be split into legal groups."
      },
      {
        "question": "An essential prime implicant is best described as:",
        "options": [
          "The largest group on the map",
          "Any group that cannot be enlarged",
          "A maximal group that covers at least one 1 no other maximal group covers",
          "A group made only of don't-cares"
        ],
        "correctIndex": 2,
        "explanation": "A prime implicant is any maximal group. It is essential only if it uniquely covers some 1, which forces it into every minimal expression."
      },
      {
        "question": "How should a don't-care condition be treated when minimizing?",
        "options": [
          "Always as 1",
          "Always as 0",
          "As 1 or 0, whichever produces larger groups, but never as a group on its own",
          "It must be excluded from the map entirely"
        ],
        "correctIndex": 2,
        "explanation": "Each don't-care can independently be read as whichever value helps. A group made only of don't-cares adds hardware for an output that was never required."
      }
    ],
    "numericals": [
      {
        "question": "For F(A,B,C,D) = Sigma(0,1,2,3,8,9,10,11), how many literals appear in the minimal SOP expression?",
        "answerMin": 1,
        "answerMax": 1,
        "unit": "literal",
        "solution": "All eight minterms have B = 0 and cover every combination of A, C and D. They form a single group of 8, eliminating log2(8) = 3 variables and leaving 4 - 3 = **1** literal: F = B'."
      },
      {
        "question": "How many cells does a 5-variable K-map have?",
        "answerMin": 32,
        "answerMax": 32,
        "unit": "cells",
        "solution": "An n-variable map has 2^n cells, so 2^5 = **32**."
      },
      {
        "question": "A group of 4 cells is circled on a 5-variable K-map. How many literals does the resulting term contain?",
        "answerMin": 3,
        "answerMax": 3,
        "unit": "literals",
        "solution": "4 = 2^2 so k = 2 variables are eliminated. With n = 5, the term has 5 - 2 = **3** literals."
      }
    ]
  }
};
