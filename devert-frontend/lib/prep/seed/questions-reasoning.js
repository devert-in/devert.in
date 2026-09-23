// Seed logical reasoning MCQs - answer keys traced and verified by hand.

export const reasoningQuestions = [
  {
    id: "seed-rea-001",
    type: "mcq",
    category: "reasoning",
    topic: "number-series",
    difficulty: "easy",
    prompt: "Find the next term in the series: 2, 6, 12, 20, 30, ?",
    options: ["36", "40", "42", "44"],
    correctIndex: 2,
    explanation:
      "The differences are 4, 6, 8, 10 - increasing by 2 each time - so the next difference is 12 and the answer is 30 + 12 = 42. Equivalently, the series is n(n+1): 1×2, 2×3, 3×4, … 6×7 = 42. Always try differences first; if they aren't constant, difference them again.",
    tags: ["series", "patterns"],
  },
  {
    id: "seed-rea-002",
    type: "mcq",
    category: "reasoning",
    topic: "number-series",
    difficulty: "medium",
    prompt: "Find the next term in the series: 3, 7, 15, 31, 63, ?",
    options: ["95", "123", "127", "131"],
    correctIndex: 2,
    explanation:
      "Each term is double the previous plus one: 3→7→15→31→63→127. Equivalently every term is 2ⁿ − 1 (4−1, 8−1, 16−1, 32−1, 64−1, 128−1). When differences themselves double (4, 8, 16, 32…), suspect a ×2 pattern.",
    tags: ["series", "powers-of-two"],
  },
  {
    id: "seed-rea-003",
    type: "mcq",
    category: "reasoning",
    topic: "letter-series",
    difficulty: "easy",
    prompt: "Find the next term in the series: AZ, BY, CX, DW, ?",
    options: ["EW", "EV", "FU", "EU"],
    correctIndex: 1,
    explanation:
      "The first letters move forward (A, B, C, D, E) while the second letters move backward (Z, Y, X, W, V), so the next pair is EV. Each pair consists of opposite letters - their alphabet positions always sum to 27 (E = 5, V = 22).",
    tags: ["series", "alphabet"],
  },
  {
    id: "seed-rea-004",
    type: "mcq",
    category: "reasoning",
    topic: "coding-decoding",
    difficulty: "easy",
    prompt: "In a certain code, CAT = 24. Using the same code, what is the value of DOG?",
    options: ["25", "26", "27", "28"],
    correctIndex: 1,
    explanation:
      "The code adds the alphabet positions of the letters: C(3) + A(1) + T(20) = 24. Applying the same rule, DOG = D(4) + O(15) + G(7) = 26. Writing A=1 … Z=26 in the margin before the reasoning section saves time on every coding question.",
    tags: ["coding-decoding", "alphabet-values"],
  },
  {
    id: "seed-rea-005",
    type: "mcq",
    category: "reasoning",
    topic: "coding-decoding",
    difficulty: "medium",
    prompt: "In a certain code language, TEACHER is written as VGCEJGT. How is STUDENT written in that code?",
    options: ["UVWFGPV", "UWVFGPV", "VUWFGPV", "UVWFGVP"],
    correctIndex: 0,
    explanation:
      "Each letter of TEACHER is shifted two places forward: T→V, E→G, A→C, C→E, H→J, E→G, R→T gives VGCEJGT. Applying the same +2 shift to STUDENT: S→U, T→V, U→W, D→F, E→G, N→P, T→V = UVWFGPV. Verify the rule on the given pair before applying it - one letter is enough to reject wrong options.",
    tags: ["coding-decoding", "letter-shift"],
  },
  {
    id: "seed-rea-006",
    type: "mcq",
    category: "reasoning",
    topic: "blood-relations",
    difficulty: "medium",
    prompt:
      "Pointing to a photograph, a man says, \"She is the daughter of the only son of my grandfather.\" How is the woman in the photograph related to the man?",
    options: ["His mother", "His sister", "His aunt", "His cousin"],
    correctIndex: 1,
    explanation:
      "\"The only son of my grandfather\" is the speaker's own father (grandfather has exactly one son). The daughter of his father is his sister. Decode the sentence from the inside out - resolve the innermost relationship first, then walk outward.",
    tags: ["blood-relations", "family-tree"],
  },
  {
    id: "seed-rea-007",
    type: "mcq",
    category: "reasoning",
    topic: "blood-relations",
    difficulty: "hard",
    prompt: "A is B's brother, C is A's mother, D is C's father, and E is B's son. How is E related to D?",
    options: ["Grandson", "Nephew", "Great-grandson", "Son-in-law"],
    correctIndex: 2,
    explanation:
      "C is the mother of A and B, and D is C's father - so D is the grandfather of A and B. E is B's son, one generation below B, which puts E three generations below D: E is D's great-grandson. Drawing a quick vertical family tree (D → C → B → E) makes the generation gap obvious.",
    tags: ["blood-relations", "generations"],
  },
  {
    id: "seed-rea-008",
    type: "mcq",
    category: "reasoning",
    topic: "syllogisms",
    difficulty: "medium",
    prompt:
      "Statements: All pens are books. Some books are chairs.\n\nConclusions:\nI. Some pens are chairs.\nII. Some chairs are books.\n\nWhich conclusion(s) logically follow(s)?",
    options: [
      "Only conclusion I follows",
      "Only conclusion II follows",
      "Both I and II follow",
      "Neither I nor II follows",
    ],
    correctIndex: 1,
    explanation:
      "The books that are chairs may be entirely different books from the ones that are pens, so conclusion I does not follow - draw the Venn diagram where the pen-circle and chair-region don't overlap. Conclusion II is just the valid converse of \"Some books are chairs\" (some A are B always implies some B are A).",
    tags: ["syllogisms", "venn-diagrams"],
  },
  {
    id: "seed-rea-009",
    type: "mcq",
    category: "reasoning",
    topic: "syllogisms",
    difficulty: "medium",
    prompt:
      "Statements: All roses are flowers. No flower is black.\n\nConclusions:\nI. No rose is black.\nII. Some flowers are roses.\n\nWhich conclusion(s) logically follow(s)?",
    options: [
      "Only conclusion I follows",
      "Only conclusion II follows",
      "Both I and II follow",
      "Neither I nor II follows",
    ],
    correctIndex: 2,
    explanation:
      "Every rose sits inside the flower set, and the flower set has no overlap with black things - so no rose can be black; I follows. \"All roses are flowers\" validly converts to \"Some flowers are roses\" (the rose region is non-empty in classical syllogism convention), so II follows too.",
    tags: ["syllogisms", "conversion"],
  },
  {
    id: "seed-rea-010",
    type: "mcq",
    category: "reasoning",
    topic: "direction-sense",
    difficulty: "easy",
    prompt:
      "A man walks 5 km towards north, turns right and walks 3 km, then turns right again and walks 5 km. How far and in which direction is he from his starting point?",
    options: ["3 km East", "3 km West", "5 km North", "8 km East"],
    correctIndex: 0,
    explanation:
      "Plot the path: 5 km north, then a right turn from north means east for 3 km, then another right means south for 5 km. The north and south legs cancel exactly, leaving him 3 km due east of the start. Sketching axes and tracking the facing direction after each turn prevents all errors here.",
    tags: ["direction-sense", "displacement"],
  },
  {
    id: "seed-rea-011",
    type: "mcq",
    category: "reasoning",
    topic: "direction-sense",
    difficulty: "medium",
    prompt:
      "A person walks 10 m towards south, turns left and walks 20 m, turns left again and walks 10 m, and finally turns right and walks 5 m. How far is he from his starting point?",
    options: ["20 m", "25 m", "30 m", "35 m"],
    correctIndex: 1,
    explanation:
      "Track coordinates from (0, 0): south 10 → (0, −10); turning left while facing south means east, 20 m → (20, −10); left again means north, 10 m → (20, 0); right while facing north means east, 5 m → (25, 0). He ends 25 m due east of the start. Coordinates beat mental visualisation once there are three or more turns.",
    tags: ["direction-sense", "coordinates"],
  },
  {
    id: "seed-rea-012",
    type: "mcq",
    category: "reasoning",
    topic: "odd-one-out",
    difficulty: "easy",
    prompt: "Find the odd one out: 121, 169, 196, 215",
    options: ["121", "169", "196", "215"],
    correctIndex: 3,
    explanation:
      "121 = 11², 169 = 13² and 196 = 14² are all perfect squares, but 215 lies strictly between 14² = 196 and 15² = 225, so it is not. In odd-one-out numbers, test squares, cubes and primes first - they cover most patterns.",
    tags: ["odd-one-out", "perfect-squares"],
  },
  {
    id: "seed-rea-013",
    type: "mcq",
    category: "reasoning",
    topic: "seating-arrangement",
    difficulty: "hard",
    prompt:
      "Five friends A, B, C, D and E sit in a row facing north. A sits immediately to the right of B, C sits at the extreme left end, and D sits between A and E. Who sits exactly in the middle of the row?",
    options: ["A", "B", "D", "E"],
    correctIndex: 0,
    explanation:
      "C is pinned at the extreme left. \"A immediately to the right of B\" forces the block B-A, and \"D between A and E\" forces the block A-D-E. Chaining them gives the unique arrangement C, B, A, D, E - so A occupies the middle (3rd) seat. Fix the anchored person first, then attach the blocks around them.",
    tags: ["seating", "puzzles"],
  },
  {
    id: "seed-rea-014",
    type: "mcq",
    category: "reasoning",
    topic: "calendars",
    difficulty: "medium",
    prompt: "If 15 January 2026 is a Thursday, what day of the week is 15 February 2026?",
    options: ["Saturday", "Sunday", "Monday", "Tuesday"],
    correctIndex: 1,
    explanation:
      "From 15 January to 15 February is exactly 31 days because January has 31 days. 31 = 4 weeks + 3 odd days, so the weekday advances by 3: Thursday + 3 = Sunday. Calendar questions are always about odd days - the remainder after dividing the gap by 7.",
    tags: ["calendars", "odd-days"],
  },
];
