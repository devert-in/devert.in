// Seed aptitude MCQs - every answer key recomputed and verified by hand.
// Shape matches prepQuestions (design §4); `id` is the deterministic doc id used at install time.

export const aptitudeQuestions = [
  {
    id: "seed-apt-001",
    type: "mcq",
    category: "aptitude",
    topic: "percentages",
    difficulty: "easy",
    prompt:
      "A number is first increased by 20% and the result is then decreased by 20%. What is the net change in the number?",
    options: ["No change", "4% decrease", "4% increase", "2% decrease"],
    correctIndex: 1,
    explanation:
      "Successive changes multiply: 1.20 × 0.80 = 0.96, i.e. a 4% net decrease. Shortcut: for +x% followed by −x%, the net change is always −x²/100, so here −(20²)/100 = −4%. Percentages never simply cancel because the second change acts on a different base.",
    tags: ["percentages", "successive-change", "tcs-nqt"],
  },
  {
    id: "seed-apt-002",
    type: "mcq",
    category: "aptitude",
    topic: "percentages",
    difficulty: "medium",
    prompt:
      "A student scores 35% of the maximum marks and fails by 40 marks. Another student scores 60% and gets 35 marks more than the pass mark. What is the maximum marks of the exam?",
    options: ["250", "280", "300", "360"],
    correctIndex: 2,
    explanation:
      "Let maximum marks be M and pass mark be P. Student 1: 0.35M + 40 = P. Student 2: 0.60M − 35 = P. Equating the two, 0.25M = 75, so M = 300 (and the pass mark is 145). Turning each sentence into one equation about the pass mark is the whole technique.",
    tags: ["percentages", "exams", "equations"],
  },
  {
    id: "seed-apt-003",
    type: "mcq",
    category: "aptitude",
    topic: "ratios",
    difficulty: "easy",
    prompt: "Two numbers are in the ratio 3 : 5 and their sum is 96. What is the larger number?",
    options: ["36", "48", "60", "72"],
    correctIndex: 2,
    explanation:
      "The ratio has 3 + 5 = 8 parts, so one part = 96 ÷ 8 = 12. The larger number is 5 parts = 5 × 12 = 60. Always find the value of one part first - everything else follows.",
    tags: ["ratios", "basics"],
  },
  {
    id: "seed-apt-004",
    type: "mcq",
    category: "aptitude",
    topic: "ratios",
    difficulty: "medium",
    prompt:
      "A bag contains ₹1, 50-paise and 25-paise coins in the ratio 5 : 6 : 8. If the total amount in the bag is ₹210, how many 50-paise coins are there?",
    options: ["108", "126", "144", "168"],
    correctIndex: 1,
    explanation:
      "Let the counts be 5x, 6x and 8x. Their value in rupees is 5x(1) + 6x(0.50) + 8x(0.25) = 5x + 3x + 2x = 10x = 210, so x = 21. The number of 50-paise coins = 6x = 126. The trap is mixing coin counts with coin values - convert everything to one money unit before adding.",
    tags: ["ratios", "coins", "cognizant"],
  },
  {
    id: "seed-apt-005",
    type: "mcq",
    category: "aptitude",
    topic: "time-speed-distance",
    difficulty: "easy",
    prompt: "A 240 m long train crosses an electric pole in 12 seconds. What is the speed of the train in km/h?",
    options: ["60 km/h", "66 km/h", "72 km/h", "80 km/h"],
    correctIndex: 2,
    explanation:
      "Crossing a pole means the train covers exactly its own length: speed = 240 m ÷ 12 s = 20 m/s. Convert m/s to km/h by multiplying by 18/5: 20 × 18/5 = 72 km/h. Memorise the 5/18 and 18/5 conversion factors - they appear in almost every train question.",
    tags: ["trains", "unit-conversion", "tcs-nqt"],
  },
  {
    id: "seed-apt-006",
    type: "mcq",
    category: "aptitude",
    topic: "time-speed-distance",
    difficulty: "medium",
    prompt:
      "A 150 m long train running at 54 km/h crosses a platform in 20 seconds. What is the length of the platform?",
    options: ["120 m", "150 m", "180 m", "200 m"],
    correctIndex: 1,
    explanation:
      "54 km/h × 5/18 = 15 m/s. In 20 s the train covers 15 × 20 = 300 m, and crossing a platform means covering train length + platform length. Platform = 300 − 150 = 150 m. Pole → own length; platform/bridge → own length plus the object's length.",
    tags: ["trains", "platforms"],
  },
  {
    id: "seed-apt-007",
    type: "mcq",
    category: "aptitude",
    topic: "time-speed-distance",
    difficulty: "medium",
    prompt:
      "A man drives from his home to his office at 40 km/h and returns along the same route at 60 km/h. What is his average speed for the whole journey?",
    options: ["45 km/h", "48 km/h", "50 km/h", "52 km/h"],
    correctIndex: 1,
    explanation:
      "When the two distances are equal, average speed is the harmonic mean 2ab/(a + b) = 2(40)(60)/100 = 48 km/h. It is NOT the arithmetic mean 50, because the driver spends more time at the slower speed, dragging the average below the midpoint.",
    tags: ["average-speed", "harmonic-mean"],
  },
  {
    id: "seed-apt-008",
    type: "mcq",
    category: "aptitude",
    topic: "profit-loss",
    difficulty: "easy",
    prompt: "A trader buys an article for ₹480 and sells it for ₹552. What is his profit percentage?",
    options: ["15%", "12%", "18%", "20%"],
    correctIndex: 0,
    explanation:
      "Profit = 552 − 480 = ₹72. Profit % = (72 ÷ 480) × 100 = 15%. Profit and loss percentages are always calculated on the cost price unless the question explicitly says otherwise.",
    tags: ["profit-loss", "basics"],
  },
  {
    id: "seed-apt-009",
    type: "mcq",
    category: "aptitude",
    topic: "profit-loss",
    difficulty: "medium",
    prompt:
      "A shopkeeper marks his goods 40% above the cost price and then offers a 20% discount on the marked price. What is his overall profit percentage?",
    options: ["8%", "10%", "12%", "20%"],
    correctIndex: 2,
    explanation:
      "Take CP = 100. Marked price = 140, and after a 20% discount the selling price = 140 × 0.80 = 112, i.e. a 12% profit. Markup and discount never simply subtract (40 − 20 ≠ 20) because they act on different bases - chain the multipliers instead: 1.40 × 0.80 = 1.12.",
    tags: ["profit-loss", "discount", "multipliers"],
  },
  {
    id: "seed-apt-010",
    type: "mcq",
    category: "aptitude",
    topic: "profit-loss",
    difficulty: "medium",
    prompt:
      "By selling an article for ₹840, a shopkeeper gains as much percent as he loses by selling it for ₹560. What is the cost price of the article?",
    options: ["₹650", "₹680", "₹700", "₹720"],
    correctIndex: 2,
    explanation:
      "Equal profit % and loss % on the same cost C means (840 − C)/C = (C − 560)/C, so 840 − C = C − 560 and C = ₹700. Shortcut worth memorising: when profit % equals loss %, the cost price is simply the average of the two selling prices - (840 + 560)/2 = 700.",
    tags: ["profit-loss", "shortcut"],
  },
  {
    id: "seed-apt-011",
    type: "mcq",
    category: "aptitude",
    topic: "averages",
    difficulty: "easy",
    prompt:
      "The average of 5 numbers is 27. If one number is excluded, the average of the remaining numbers becomes 25. What is the excluded number?",
    options: ["25", "30", "35", "40"],
    correctIndex: 2,
    explanation:
      "Work with totals, not averages: sum of all 5 = 5 × 27 = 135, sum of the remaining 4 = 4 × 25 = 100. The excluded number is the difference, 135 − 100 = 35. Converting averages to totals removes all the algebra from these questions.",
    tags: ["averages", "totals"],
  },
  {
    id: "seed-apt-012",
    type: "mcq",
    category: "aptitude",
    topic: "compound-interest",
    difficulty: "medium",
    prompt: "What is the compound interest on ₹10,000 at 10% per annum for 2 years, compounded annually?",
    options: ["₹2,000", "₹2,200", "₹2,100", "₹2,400"],
    correctIndex: 2,
    explanation:
      "Amount = 10000 × (1.10)² = ₹12,100, so CI = ₹2,100. Simple interest for the same setup would be ₹2,000; the extra ₹100 is interest-on-interest - 10% earned on the first year's ₹1,000 interest. For 2 years, CI − SI = P(R/100)².",
    tags: ["compound-interest", "ci-vs-si"],
  },
  {
    id: "seed-apt-013",
    type: "mcq",
    category: "aptitude",
    topic: "time-and-work",
    difficulty: "easy",
    prompt:
      "A can complete a piece of work in 12 days and B can complete the same work in 18 days. In how many days will they finish the work working together?",
    options: ["7.5 days", "6 days", "7.2 days", "8 days"],
    correctIndex: 2,
    explanation:
      "Rates add: 1/12 + 1/18 = 3/36 + 2/36 = 5/36 of the work per day, so together they need 36/5 = 7.2 days. LCM method: take the work as 36 units - A does 3 units/day, B does 2, together 5 units/day → 36 ÷ 5 = 7.2 days.",
    tags: ["time-and-work", "lcm-method"],
  },
  {
    id: "seed-apt-014",
    type: "mcq",
    category: "aptitude",
    topic: "time-and-work",
    difficulty: "hard",
    prompt:
      "A and B together can finish a work in 12 days, B and C in 15 days, and A and C in 20 days. In how many days can A, B and C finish the work together?",
    options: ["10 days", "8 days", "12 days", "15 days"],
    correctIndex: 0,
    explanation:
      "Adding all three pair-rates counts each person twice: 1/12 + 1/15 + 1/20 = (5 + 4 + 3)/60 = 12/60 = 1/5 = 2(A + B + C). So A + B + C = 1/10 of the work per day, i.e. 10 days together. Whenever pairs are given, add them all and halve.",
    tags: ["time-and-work", "pairs-trick"],
  },
  {
    id: "seed-apt-015",
    type: "mcq",
    category: "aptitude",
    topic: "probability",
    difficulty: "medium",
    prompt: "Two fair dice are thrown together. What is the probability that the sum of the numbers on the two dice is 9?",
    options: ["1/6", "1/12", "5/36", "1/9"],
    correctIndex: 3,
    explanation:
      "The favourable ordered pairs are (3,6), (4,5), (5,4) and (6,3) - 4 outcomes out of 36 equally likely pairs, giving 4/36 = 1/9. Count ordered pairs because the two dice are distinct objects; treating (4,5) and (5,4) as one outcome is the classic mistake.",
    tags: ["probability", "dice"],
  },
  {
    id: "seed-apt-016",
    type: "mcq",
    category: "aptitude",
    topic: "number-system",
    difficulty: "medium",
    prompt: "What is the largest 4-digit number that is exactly divisible by 88?",
    options: ["9988", "9944", "9900", "9966"],
    correctIndex: 1,
    explanation:
      "Divide 9999 by 88: quotient 113, remainder 55. Subtract the remainder: 9999 − 55 = 9944 = 88 × 113. General rule: the largest n-digit number divisible by k is (largest n-digit number) minus (that number mod k).",
    tags: ["number-system", "divisibility"],
  },
];
