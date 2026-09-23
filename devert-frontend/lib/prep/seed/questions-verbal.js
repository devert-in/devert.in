// Seed verbal ability MCQs - standard placement English: vocabulary, grammar, usage.

export const verbalQuestions = [
  {
    id: "seed-ver-001",
    type: "mcq",
    category: "verbal",
    topic: "synonyms",
    difficulty: "easy",
    prompt: "Choose the word closest in meaning to CANDID:",
    options: ["Secretive", "Frank", "Devious", "Timid"],
    correctIndex: 1,
    explanation:
      "Candid means honest and direct - frank is the closest synonym. Think of \"candid feedback\": open and truthful, holding nothing back. Secretive and devious are near-opposites, which is why they appear as traps.",
    tags: ["vocabulary", "synonyms"],
  },
  {
    id: "seed-ver-002",
    type: "mcq",
    category: "verbal",
    topic: "antonyms",
    difficulty: "easy",
    prompt: "Choose the word most nearly OPPOSITE in meaning to FRUGAL:",
    options: ["Thrifty", "Miserly", "Extravagant", "Economical"],
    correctIndex: 2,
    explanation:
      "Frugal means careful and sparing with money; its opposite is extravagant - spending freely and wastefully. Thrifty, economical and miserly are all near-synonyms of frugal, which is exactly why antonym questions pack the options with synonyms of the given word.",
    tags: ["vocabulary", "antonyms"],
  },
  {
    id: "seed-ver-003",
    type: "mcq",
    category: "verbal",
    topic: "subject-verb-agreement",
    difficulty: "medium",
    prompt: "Fill in the blank: Neither of the two candidates ___ suitable for the post.",
    options: ["are", "is", "were", "have been"],
    correctIndex: 1,
    explanation:
      "\"Neither\" is grammatically singular even when followed by \"of the two candidates\", so it takes the singular verb \"is\". The plural noun sitting right before the blank is the classic trap - the true subject is \"neither\", not \"candidates\". The same rule applies to \"either\", \"each\" and \"every one\".",
    tags: ["grammar", "agreement"],
  },
  {
    id: "seed-ver-004",
    type: "mcq",
    category: "verbal",
    topic: "sentence-correction",
    difficulty: "medium",
    prompt: "Choose the grammatically correct sentence:",
    options: [
      "Each of the students have submitted the assignment.",
      "Each of the students has submitted the assignment.",
      "Each of the student has submitted the assignment.",
      "Each students has submitted the assignment.",
    ],
    correctIndex: 1,
    explanation:
      "\"Each\" is always singular, so the verb must be \"has\", and the correct structure is \"each of the + plural noun\". Option A fails on the verb, option C fails on the noun (\"student\" should be plural after \"of the\"), and option D is structurally broken.",
    tags: ["grammar", "sentence-correction"],
  },
  {
    id: "seed-ver-005",
    type: "mcq",
    category: "verbal",
    topic: "idioms",
    difficulty: "medium",
    prompt: "What does the idiom \"to bite the bullet\" mean?",
    options: [
      "To act aggressively without thinking",
      "To face a painful situation with courage",
      "To make a hasty decision",
      "To refuse to cooperate",
    ],
    correctIndex: 1,
    explanation:
      "To bite the bullet means to force yourself to endure something painful or unpleasant that cannot be avoided. The phrase comes from the era before anaesthesia, when soldiers bit on a bullet during battlefield surgery. Idiom meanings are rarely literal - learn them as whole units.",
    tags: ["idioms", "usage"],
  },
  {
    id: "seed-ver-006",
    type: "mcq",
    category: "verbal",
    topic: "one-word-substitution",
    difficulty: "medium",
    prompt: "One word for \"a person who knows and can use several languages\":",
    options: ["Linguist", "Bilingual", "Polyglot", "Orator"],
    correctIndex: 2,
    explanation:
      "A polyglot speaks several languages. A linguist studies language scientifically (and may speak only one), bilingual means exactly two languages, and an orator is a skilled public speaker. One-word-substitution questions reward precision - eliminate options that are close but not exact.",
    tags: ["vocabulary", "one-word-substitution"],
  },
  {
    id: "seed-ver-007",
    type: "mcq",
    category: "verbal",
    topic: "para-jumbles",
    difficulty: "hard",
    prompt:
      "Arrange the sentences P, Q, R and S to form a coherent paragraph:\n\nP: It was launched in 1969 as ARPANET, a research project funded by the US Department of Defense.\nQ: The internet has fundamentally transformed how humans communicate and share information.\nR: Over the following decades, it grew from linking four university computers to connecting billions of devices.\nS: Today, nearly two-thirds of the world's population is online.",
    options: ["PQRS", "QPRS", "QRPS", "PRQS"],
    correctIndex: 1,
    explanation:
      "Q is the natural opener - a general statement introducing the topic. P then gives the origin (1969, ARPANET), R traces the growth over the following decades, and S lands in the present day. The reliable pattern is: general introduction → origin → development → current state; time markers like \"1969\", \"over the following decades\" and \"today\" fix the order.",
    tags: ["para-jumbles", "reading"],
  },
  {
    id: "seed-ver-008",
    type: "mcq",
    category: "verbal",
    topic: "prepositions",
    difficulty: "easy",
    prompt: "Fill in the blank: She has been working in this company ___ 2019.",
    options: ["for", "from", "since", "before"],
    correctIndex: 2,
    explanation:
      "Use \"since\" with a point in time (since 2019, since Monday) and \"for\" with a duration (for five years). 2019 is a fixed point, and the present perfect continuous \"has been working\" pairs naturally with \"since\". \"From\" would need a paired \"to/until\" or a simple tense.",
    tags: ["grammar", "prepositions"],
  },
];
