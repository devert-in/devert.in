// The strategy half of the GATE 2027 Plan - everything around the day cards.
//
// Hand-transcribed from GATE/GATE_2027_CS_DA_Preparation_Plan_v3_3.5h.pdf
// (sections 1-13). The day-by-day roadmap in that PDF (section 8) is NOT here:
// it is the same content as the workbook's Daily Plan sheet, which is the
// structured source and is imported into Firestore by
// scripts/import-gate-plan.mjs. Only what the workbook does not carry lives in
// this file - the week titles and Sunday goals, the rules, the routine, the
// priorities, the marks maths, the accuracy ladder, the cut list and the
// checklist.
//
// Two edits from the PDF, both deliberate:
//   - It was written for one student ("Prepared for ...", "your Java and DSA
//     background"). Those lines are dropped or generalised: this is a cohort
//     plan now.
//   - Its hours-by-subject chart is NOT transcribed. It is recomputed from the
//     imported day index (topic days x 2.5 h) in hoursBudget() below, because
//     the PDF's chart labels are ambiguous in its text layer and the index is
//     the thing the plan actually schedules.
//
// Static and public on purpose: this is the pitch and the method, which a
// student needs to read BEFORE deciding to request a seat. The daily material
// itself stays member-only in Firestore.

export const PLAN_NAME = "GATE 2027 Plan";
export const PLAN_TAGLINE = "96 days. CS + DA. 3.5 hours a day.";

export const HEADLINE_NUMBERS = [
  { value: "96", label: "days", sub: "Sun 27 Sep - Thu 31 Dec 2026" },
  { value: "~336", label: "hours", sub: "at 3.5 h a day" },
  { value: "24.5 h", label: "every week", sub: "6 x 3.5 h + a 3.5 h Sunday" },
  { value: "65-70+", label: "target", sub: "in each paper" },
];

export const GOAL =
  "By December 31, build strong command over the highest-yield topics worth roughly 85-90 marks in each paper, " +
  "so the real exam gives you a realistic path to 65-70+. Covering 90 marks does not mean those exact marks will " +
  "appear: weightage shifts every year. So the plan is broad enough to survive shifts and deep enough to score.";

export const PHASES = [
  { key: "p1", label: "Phase 1", dates: "Sep 28 - Oct 25", firstDay: 1, lastDay: 28,
    text: "Maths foundation: Probability, Linear Algebra, Calculus + Discrete. ML starts Oct 23." },
  { key: "p2", label: "Phase 2", dates: "Oct 26 - Dec 6", firstDay: 29, lastDay: 70,
    text: "Programming, Data Structures, Algorithms, DBMS + ML and AI finished." },
  { key: "p3", label: "Phase 3", dates: "Dec 7 - Dec 27", firstDay: 71, lastDay: 91,
    text: "CS-only: OS, CN, COA + TOC, Digital Logic; Compiler in the evenings." },
  { key: "lockin", label: "Lock-in", dates: "Dec 28 - 31", firstDay: 92, lastDay: 95,
    text: "Mixed tests, weak-topic repair, final revision. No new chapters." },
];

export const FOUR_RULES = [
  { title: "Study the overlap once.",
    text: "Probability, linear algebra, calculus, programming, data structures, algorithms, DBMS and General Aptitude count for both papers. About 98 topic hours, plus all revision and GA time, pay off twice." },
  { title: "Cap lectures, protect PYQs.",
    text: "Lectures get 60 minutes a day, maximum. PYQs get at least 95 minutes a day: 60 on today's topic + 35 of revision." },
  { title: "Done means ~70% on PYQs.",
    text: "A topic is finished when you get about 70% or more of its PYQs right, not when the playlist ends." },
  { title: "No zero days.",
    text: "3.5 hours, every day. Sunday is for the weekly test, revision and GA, never for new chapters." },
];

export const WHY_BUILT_THIS_WAY = [
  ["Common core first", "Shared subjects come first, so every early hour counts for both papers."],
  ["Two tracks a week", "ML runs beside the common core (Fri-Sat), so DA's biggest subject gets PYQ time."],
  ["Daily keep-warm", "Each weekday ends with 35 min of revision PYQs (1 or 3 weeks back) + 15 min of GA."],
  ["Nothing with real marks is dropped", "Discrete, Digital, COA are in; Compiler runs in December evenings."],
  ["Spaced revision", "Evening slots and Sunday tests keep October topics sharp in February."],
  ["Scope labels", "DA-only topics (projections, SVD, CLT, tests, warehousing) and CS-only ones (greedy, DP, MST, transactions) are marked, so you never spend one paper's time on the other paper's material."],
];

export const EXAM_FORMAT = [
  ["Format", "3 hours · 65 questions · 100 marks: General Aptitude 15 marks (10 Qs) + subject 85 marks (55 Qs)"],
  ["Question types", "MCQ (one correct), MSQ (one or more correct), NAT (numerical answer typed in)"],
  ["Negative marking", "MCQs only: -1/3 for a 1-mark question, -2/3 for a 2-mark question. No negative marking for MSQ or NAT."],
  ["The two papers", "CS (Paper 1) + DA (Paper 2). They are separate papers, each with its own GA section, so you need 65+ on each."],
  ["Exam window", "February 2027. Confirm your exact paper dates and sessions on the official GATE 2027 website."],
];

// Section 2: the CS + DA overlap, straight from the official 2027 syllabi.
export const OVERLAP = [
  { subject: "Probability & Statistics",
    cs: "Random variables; uniform, normal, exponential, Poisson, binomial; mean, median, mode, SD; conditional probability, Bayes",
    da: "Everything in CS + counting, joint/marginal, conditional expectation & variance, covariance & correlation, t & chi-squared distributions, CLT, confidence intervals, z / t / chi-square tests",
    how: "Study once at DA depth. CS scope is a subset." },
  { subject: "Linear Algebra",
    cs: "Matrices, determinants, linear systems, eigenvalues & eigenvectors, LU",
    da: "CS scope + vector spaces, subspaces, rank & nullity, projections, orthogonal / idempotent / partition matrices, quadratic forms, SVD",
    how: "CS core first, then the DA extras." },
  { subject: "Calculus",
    cs: "Limits, continuity, differentiability, maxima & minima, mean value theorem, integration",
    da: "Limits, continuity, differentiability, Taylor series, maxima & minima, single-variable optimization",
    how: "One pass. MVT & integration for CS; Taylor & optimization for DA." },
  { subject: "Programming", cs: "C", da: "Python", how: "C in depth; Python for code tracing." },
  { subject: "Data Structures",
    cs: "Recursion, arrays, stacks, queues, linked lists, trees, BST, binary heaps, graphs",
    da: "Stacks, queues, linked lists, trees, hash tables",
    how: "CS depth covers DA." },
  { subject: "Algorithms",
    cs: "Searching, sorting, hashing, asymptotic complexity, greedy, DP, divide & conquer, graph traversals, MST, shortest paths",
    da: "Linear & binary search; selection, bubble, insertion sort; merge & quick sort; graph basics, traversals, shortest path",
    how: "CS depth covers DA. Greedy, DP and MST are CS-only; don't skip the basic sorts." },
  { subject: "DBMS",
    cs: "ER, relational algebra, tuple calculus, SQL, integrity constraints, normal forms, file organization, indexing (B/B+ trees), transactions & concurrency",
    da: "Same relational core + data types, data transformation (normalization, discretization, sampling, compression), warehouse modelling",
    how: "Study once. Transactions are CS-only; warehousing is DA-only." },
  { subject: "General Aptitude", cs: "15 marks", da: "15 marks", how: "Identical in both papers." },
];
export const CS_ONLY = ["Discrete Maths", "Digital Logic", "COA", "Theory of Computation", "Operating Systems", "Computer Networks", "Compiler Design"];
export const DA_ONLY = ["Machine Learning (supervised + unsupervised)", "Artificial Intelligence (search, logic, reasoning under uncertainty)"];

// Section 3: priority tiers.
export const TIERS = [
  { tier: "Tier 1 · Must master", subjects: "Probability & Statistics, Linear Algebra, Programming + Data Structures, Algorithms, DBMS, General Aptitude",
    why: "Biggest shared marks. Study once, score in both papers.", tone: "good" },
  { tier: "Tier 2 · CS high priority", subjects: "Operating Systems, Computer Networks, Theory of Computation, Discrete Maths",
    why: "Large, predictable, numerical-heavy CS sections.", tone: "cyan" },
  { tier: "Tier 2 · DA high priority", subjects: "Machine Learning, AI, Calculus & Optimization",
    why: "DA's unique marks. ML is the largest single DA subject.", tone: "purple" },
  { tier: "Tier 3 · Lean but scheduled", subjects: "COA, Digital Logic",
    why: "Scored through a few high-yield patterns: cache, pipelining, K-maps, number representation.", tone: "warn" },
  { tier: "Evening slot · Dec 14-26", subjects: "Compiler Design",
    why: "Compact (about 4-6 marks). Twelve 35-minute evening sessions in Weeks 12-13.", tone: "muted" },
];

export const HIGH_YIELD = {
  CS: [
    ["Discrete Maths", "Propositional & first-order logic; counting relations & functions; graph theory (connectivity, matching, colouring); combinatorics, recurrences, generating functions", "Group theory beyond basics; lattice proofs"],
    ["Linear Algebra", "Rank; eigenvalues via trace/determinant shortcuts; consistency of linear systems; LU", "Long proofs"],
    ["Calculus", "Limits, continuity & differentiability; maxima/minima; MVT; definite integrals", "Lengthy integration techniques"],
    ["Probability", "Conditional probability, Bayes; uniform, normal, exponential, Poisson, binomial; mean, median, mode, SD", ""],
    ["Programming & DS", "C pointers, arrays, recursion tracing, scope & static; stacks, queues, linked lists; trees, BST, binary heaps; graphs", "Syntax trivia unrelated to execution"],
    ["Algorithms", "Asymptotics & recurrences; sorting & searching; hashing; greedy; DP; BFS/DFS; MST; shortest paths", "Algorithms outside the syllabus"],
    ["DBMS", "Relational algebra & SQL output questions; FDs, keys & normal forms; serializability; B/B+ tree numericals", "ER diagram drawing details"],
    ["Operating Systems", "CPU scheduling; semaphores & synchronization; deadlock & Banker's; paging, TLB, virtual memory, page replacement", "Case studies of specific OSes"],
    ["Computer Networks", "Delay & throughput numericals; CRC; MAC & Ethernet; DV & LS routing; subnetting, CIDR, fragmentation, NAT; TCP windows & congestion", "Header-field trivia beyond basics"],
    ["Theory of Computation", "Regex & DFA/NFA; regular vs non-regular (pumping lemma); CFG & PDA; CFL closure; decidability classification", "Formal Turing machine construction"],
    ["COA", "Addressing modes; cache mapping numericals; pipelining & hazards; memory hierarchy & average access time", "Microprogrammed control & DMA details"],
    ["Digital Logic", "Boolean algebra; K-maps; 2's complement & IEEE floating point; mux, decoder, adders; flip-flops & counters", "Tabular (Quine-McCluskey) method depth"],
    ["Compiler (Dec evenings)", "Parsing (LL/LR); syntax-directed translation; liveness & data-flow analysis; intermediate code", "Lexer implementation details"],
  ],
  DA: [
    ["Probability & Stats (extras)", "Joint/marginal/conditional; conditional expectation & variance; covariance & correlation; CLT; confidence intervals; z, t and chi-square tests", ""],
    ["Linear Algebra (extras)", "Vector spaces & subspaces; rank-nullity; projections; orthogonal & idempotent matrices; quadratic forms; SVD", ""],
    ["Calculus & Optimization", "Taylor series; maxima & minima; single-variable optimization", "Integration (not in DA)"],
    ["Programming, DS & Algorithms", "Python tracing; stacks, queues, linked lists, trees, hash tables; binary search; selection, bubble, insertion, merge, quick sort; BFS/DFS; shortest path", "Greedy, DP, MST (CS only)"],
    ["DBMS & Warehousing", "Relational core (same as CS) + normalization, discretization, sampling, compression; star/snowflake schemas; concept hierarchies; measures", "Transactions & concurrency (CS only)"],
    ["Machine Learning", "Simple, multiple & ridge regression; logistic regression; KNN; naive Bayes; LDA; SVM; decision trees; bias-variance; LOO & k-fold CV; MLP & feed-forward nets; k-means/k-medoids; hierarchical clustering; PCA", "Deep learning beyond feed-forward nets"],
    ["AI", "BFS, DFS, uniform-cost; A* & heuristics; minimax & alpha-beta; propositional & predicate logic; conditional independence; variable elimination; sampling", "Planning & RL (not in syllabus)"],
  ],
};

export const ML_RULE =
  "For every ML algorithm, be able to answer four questions: What problem does it solve? What is its objective? " +
  "What does the formula actually mean? How does GATE turn it into a numerical question?";

// Section 4. Rough planning ranges - they move every year.
export const MARKS = {
  CS: [
    ["General Aptitude", "15", "15"], ["Engineering Maths (incl. Discrete)", "11-13", "~12"],
    ["Programming & Data Structures", "8-12", null], ["Algorithms", "6-10", null],
    ["Programming + DS + Algorithms", null, "~16"],
    ["Operating Systems", "7-10", "~9"], ["Computer Networks", "7-10", "~9"],
    ["COA", "7-10", null], ["Digital Logic", "4-6", null], ["COA + Digital Logic", null, "~10"],
    ["DBMS", "6-9", "~7"], ["Theory of Computation", "6-9", "~7"], ["Compiler Design", "4-6", "~5"],
  ],
  DA: [
    ["General Aptitude", "15", "15"], ["Probability & Statistics", "11-18", "~13"],
    ["Programming, DS & Algorithms", "14-18", "~15"], ["Machine Learning", "14-18", "~15"],
    ["DBMS & Warehousing", "10-18", "~13"], ["Linear Algebra", "8-12", "~9"],
    ["Calculus & Optimization", "5-9", "~6"], ["AI", "6-9", "~7"],
  ],
  covered: { CS: "~90", DA: "~90+" },
};
export const MARKS_MATH =
  "To turn ~90 covered marks into 70, you need roughly 78% accuracy on what you cover (70 / 90 ≈ 0.78). That is " +
  "exactly why PYQ accuracy, not lecture hours, is the number you track every day. DA reaches higher coverage with " +
  "less extra effort because so much of it overlaps with CS.";
export const MARKS_CAVEAT =
  "These are rough planning ranges and move every year. DA has only three papers of history (2024-2026), so its ranges are especially loose.";

// Section 5: the weekly shape.
export const WEEK_SHAPE = [
  { days: "Mon - Thu", track: "Main track", hours: "10 h", text: "2.5-h topic block: common core first (Probability → DBMS), then CS-only subjects (OS, CN, COA)." },
  { days: "Fri - Sat", track: "Second track", hours: "5 h", text: "2.5-h topic block: Discrete Maths → Machine Learning → AI → Theory of Computation → Digital Logic." },
  { days: "Mon - Sat evenings", track: "Keep-warm", hours: "5 h", text: "35 min spaced-revision PYQs (Compiler Design in Weeks 12-13) + 15 min General Aptitude." },
  { days: "Mon - Sat", track: "Breaks", hours: "1 h", text: "10 minutes between the topic block and the keep-warm block." },
  { days: "Sunday", track: "Test & revision", hours: "3.5 h", text: "Recall + 75-min timed weekly test + analysis + 45 min GA + sign-off." },
];
export const TRACKS_NOTE =
  "By late November the DA-only material is finished (ML by Nov 22, AI by Dec 6). December then goes CS-heavy while " +
  "the evening revision slot and the Sunday tests keep DA warm. Compiler Design runs in the evening slot from Dec 14 to Dec 26.";

// Section 8 week headers - titles, Sunday goals. (GA themes come from the
// imported index, where every day carries its own.)
export const WEEKS = {
  "Start": { title: "Setup + head start", dates: "Sep 27", goal: "Notebooks set up, two daily slots fixed, a GA baseline score written down." },
  W1: { title: "Probability I · Logic", dates: "Sep 28 - Oct 4", goal: "Solve basic probability (conditional, Bayes) and logic PYQs without looking at a formula sheet." },
  W2: { title: "Probability II · Sets & Relations", dates: "Oct 5 - Oct 11", goal: "Recognise which distribution a question uses, compute expectation and variance fast, and know when a z, t or chi-square test applies." },
  W3: { title: "Linear Algebra · Graphs & Combinatorics", dates: "Oct 12 - Oct 18", goal: "Answer rank and eigenvalue questions in under 2 minutes using shortcuts, and solve linear recurrences." },
  W4: { title: "LA for DA · Calculus · ML begins", dates: "Oct 19 - Oct 25", goal: "Handle projection/SVD concept questions and maxima-minima numericals; write the least-squares and ridge objectives from memory." },
  W5: { title: "Programming · ML Classification", dates: "Oct 26 - Nov 1", goal: "Predict the output of pointer- and recursion-heavy C code; solve logistic regression and naive Bayes numericals." },
  W6: { title: "Data Structures · LDA, SVM, Trees", dates: "Nov 2 - Nov 8", goal: "Solve heap/BST operation questions and tree node-count problems; compute entropy and information gain by hand." },
  W7: { title: "Algorithms I · Model Evaluation & MLPs", dates: "Nov 9 - Nov 15", goal: "Solve recurrences with the master theorem, state best/worst cases of every sort, and count MLP parameters." },
  W8: { title: "Algorithms II · Clustering & PCA", dates: "Nov 16 - Nov 22", goal: "Tell greedy problems from DP problems, run Dijkstra/Prim/Kruskal by hand, and do one k-means iteration and a small PCA." },
  W9: { title: "DBMS I · AI Search", dates: "Nov 23 - Nov 29", goal: "Evaluate SQL and relational-algebra outputs, find candidate keys and the highest normal form, run A* and alpha-beta by hand." },
  W10: { title: "DBMS II · OS begins · AI Reasoning", dates: "Nov 30 - Dec 6", goal: "Test schedules for conflict serializability, solve B+ tree order/height numericals, and run variable elimination on a small network." },
  W11: { title: "Operating Systems · TOC I", dates: "Dec 7 - Dec 13", goal: "Scheduling and paging numericals (waiting time, access time, page faults); build a DFA or regex and show a language is non-regular." },
  W12: { title: "Computer Networks · TOC II", dates: "Dec 14 - Dec 20", goal: "Delay, throughput, CRC and subnetting numericals; decide whether a language is regular, context-free or undecidable." },
  W13: { title: "CN wrap-up · COA · Digital Logic", dates: "Dec 21 - Dec 27", goal: "TCP window and congestion numericals, cache and pipeline numericals, K-map minimization and floating-point representation." },
  "Lock-in": { title: "Lock-in week", dates: "Dec 28 - Dec 31", goal: "A formula sheet per subject, a mistake notebook, a list of your weak topics, and a completed topic checklist." },
};

// Section 7: the daily and Sunday routines. `from`/`to` are minutes into the
// session, so the day view can draw them as a timeline.
export const WEEKDAY_ROUTINE = [
  { block: "A", from: 0, to: 15, label: "Recall", how: "Write down what you remember from yesterday without opening notes." },
  { block: "A", from: 15, to: 75, label: "Lecture", how: "One focused lecture at 1.5x on \"What to cover today\". Hard cap of 60 minutes; stop even if the video continues." },
  { block: "A", from: 75, to: 90, label: "Short notes", how: "Only formulas, traps, shortcuts and your own mistakes. Copy the Must-know line. Never transcribe the lecture." },
  { block: "A", from: 90, to: 150, label: "Topic PYQs", how: "Today's topic. Attempt first, then check the solution. This is the most important block." },
  { block: "break", from: 150, to: 160, label: "Break", how: "Walk, water, stretch. No phone scrolling." },
  { block: "B", from: 160, to: 195, label: "Revision PYQs", how: "The evening item on the day card: 8 PYQs on the topic from 1 or 3 weeks ago (Compiler Design in Weeks 12-13)." },
  { block: "B", from: 195, to: 210, label: "GA + log", how: "5 GA questions on this week's theme (about 10 min), then fill the daily log." },
];
export const SUNDAY_ROUTINE = [
  { from: 0, to: 25, label: "Blank-page recall", how: "List every formula and idea from the week from memory, then fill the gaps." },
  { from: 25, to: 100, label: "Weekly timed test", how: "25 PYQs in 75 minutes: 15 from this week + 10 from the older weeks named on the day card." },
  { from: 100, to: 130, label: "Test analysis", how: "Every wrong or guessed answer goes into the mistake notebook with its cause." },
  { from: 130, to: 175, label: "General Aptitude", how: "15 GA questions, timed, on the topic listed for that Sunday." },
  { from: 175, to: 210, label: "Sign-off", how: "Update formula sheets, clean up the mistake notebook, fill the week sign-off." },
];
export const SPLIT_TIP =
  "Cannot sit for 3.5 hours at once? Split it into two fixed sittings: Block A (topic, 2.5 h) and Block B (revision + GA, 50 min). Both slots go into the daily contract.";
export const MISSED_DAY_RULE =
  "Missed a weekday? That Sunday runs the missed day's topic block (2.5 h) + a 40-min mini test + 10 min recall + 10 min GA instead. Mark the day \"Moved to Sunday\".";

export const NOTEBOOKS = [
  { title: "Mistake notebook", text: "Every wrong PYQ gets one line: the question source, what you did, what the right idea was, and whether it was a concept gap, a silly error or a time problem." },
  { title: "Formula sheet", text: "One running sheet per subject. By December these two notebooks are your whole revision material." },
];

export const HOW_TO_USE_A_DAY = [
  "Every day has a subject, a topic and the exact subtopics to cover. Watch only the lecture parts that match \"What to cover today\"; skip the rest.",
  "The Must-know line is your exit test: by the end of the day you should be able to write it from memory. Copy it into your formula sheet.",
  "The PYQ target is your minimum for the 60-minute topic block, plus 8 revision PYQs and 5 GA questions in the evening. Write your score (correct / attempted) and mark Done only when all three are attempted and the log is filled.",
  "The evening line is Block B: 35 minutes of revision PYQs on the named earlier day (Mon/Wed/Fri go back 1 week, Tue/Thu/Sat go back 3 weeks) or, in Weeks 12-13, a Compiler Design session. Then 5 GA questions on the week's theme.",
  "Shared-subject PYQs come from the CS papers on GATE Overflow. For DA-only topics (ML, AI, DA statistics, projections, warehousing) use the 2024 DA paper topic-wise plus the practice questions from your lecture source.",
];

export const DAILY_CONTRACT = [
  ["Fixed slots.", "Same times every day. Block A (2.5 h) and Block B (1 h) each get a fixed time."],
  ["Phone away.", "Phone in another room or on Do Not Disturb for both blocks. No exceptions."],
  ["PYQs are never skipped.", "If time runs short, cut the lecture, never the PYQ block."],
  ["Done means done.", "A day counts only when three things exist: topic + revision PYQs and GA attempted, scores written, log filled. Then mark it."],
  ["Missed a day? It moves to Sunday.", "That Sunday runs the missed topic block (2.5 h) + a 40-min mini test + 10 min recall + 10 min GA. Never double up on a weekday."],
  ["Never miss twice.", "Two missed days in one week means the plan shifts forward and you apply the cut list. Block B may be dropped at most once a week; Block A never."],
  ["Sunday sign-off is mandatory.", "Fill the week sign-off before you start the next week."],
];

// Section 9.
export const JANUARY = [
  { when: "Week 1 of January", focus: "Compiler Design consolidation (covered in the Dec 14-26 evening slot: parsing, syntax-directed translation, runtime environments, intermediate code, liveness & data-flow): a full topic-wise PYQ pass, plus any COA leftovers (control unit, I/O & DMA)." },
  { when: "Weeks 2 - 4", focus: "Full-length timed mocks, alternating CS and DA, including the 2025 and 2026 DA papers. Analyse every mock for at least as long as it took. Keep the 15-minute daily GA habit (20 minutes if GA is weak)." },
  { when: "Early February", focus: "Formula sheets, mistake notebook, 2-3 final mocks per paper, then rest before each paper." },
];
export const ADD_HOURS =
  "Keep the 3.5-hour habit through January: that is roughly 120 more hours between Jan 1 and the exam, enough for a mock every second day plus full analysis and repair. Mocks are where 65 becomes 70.";

// Section 10-11.
export const RESOURCE_RULE = "One lecture source → short notes → topic-wise PYQs → mistake notebook → revision. Never three teachers for one chapter.";
export const PYQ_STRATEGY = [
  "GATE Overflow (gateoverflow.in) has decades of CS PYQs sorted by topic. Work through a topic's questions right after learning it, newest papers first.",
  "DA has only three papers so far (2024, 2025, 2026). Use CS PYQs for the shared subjects, use the 2024 DA paper topic-wise for ML, AI and DA-only statistics (those questions are scarce), and keep 2025 and 2026 untouched for timed mocks in January.",
  "Official question papers and answer keys are on the GATE websites.",
  "Attempt every question before looking at the solution. Log every mistake with its cause: concept gap, silly error or time.",
];

export const ACCURACY_LADDER = [
  { from: 0, to: 40, meaning: "The concept isn't there yet", next: "Rewatch the core concept once, then redo the same PYQs", tone: "bad" },
  { from: 40, to: 60, meaning: "Basic understanding", next: "More PYQs; write every trap into your notes", tone: "bad" },
  { from: 60, to: 75, meaning: "Getting there", next: "Mixed and timed sets on the topic", tone: "warn" },
  { from: 75, to: 85, meaning: "Good", next: "Keep it warm through Sunday mixed PYQs", tone: "good" },
  { from: 85, to: 101, meaning: "Strong GATE topic", next: "Occasional PYQs only; spend time elsewhere", tone: "good" },
];
export function ladderStep(pct) {
  if (pct == null) return null;
  return ACCURACY_LADDER.find(s => pct >= s.from && pct < s.to) || ACCURACY_LADDER[ACCURACY_LADDER.length - 1];
}

// Section 12.
export const REALITY_CHECK =
  "336 hours is a solid budget. A 65-70 in CS is still a strong-rank score, so doing it in two papers from zero is ambitious: " +
  "doable if lectures stay capped, every topic ends with PYQs, the evening block actually happens, and January goes into mocks rather than new syllabus.";
export const CUT_LIST = [
  ["Group theory & lattice depth", "CS"],
  ["Turing machine & undecidability depth", "CS"],
  ["Warehousing details", "DA"],
  ["Sampling-based inference in AI", "DA"],
  ["COA control-unit design and DMA", "CS"],
  ["Compiler Design evening slot (push it back to January)", "CS"],
];
export const NEVER_CUT = ["General Aptitude", "Probability", "Data Structures & Algorithms", "DBMS", "Operating Systems", "Computer Networks", "Supervised ML"];
export const STRATEGY_NOTES = [
  ["Semester exams", "Drop to Block A only (2.5 h) on exam days; if even that is impossible, shift the whole plan by those days instead of squeezing weeks together."],
  ["Low-energy day?", "The minimum day is Block A (2.5 h). Block B may be dropped at most once a week; Block A never."],
  ["PSUs vs M.Tech", "Most PSUs that recruit through GATE use the CS paper, and DA acceptance is still limited (check each notification). DA matters most for AI and Data Science M.Tech programs. If a bad week forces a trade-off and PSUs matter to you, protect CS."],
  ["Missed a day?", "Never double up on a weekday: the missed topic block moves to that week's Sunday. Two misses in one week shift the whole plan forward; use the cut list to catch up."],
  ["Think like the paper", "Switch from \"How do I build this?\" to \"How does GATE ask this?\" GATE tests reasoning and tracing, not implementation."],
];

// Section 13.
export const SCORECARD_TARGETS = [
  ["Study days", "7 (minimum 6)"],
  ["Total hours", "~24.5"],
  ["Lecture time", "≤ 6 hours"],
  ["PYQ time", "≥ 9.5 hours on weekdays + the 75-minute Sunday test"],
  ["PYQs solved", "140 - 170 (topic + revision + Sunday test) + 45 GA questions"],
  ["Accuracy", "Starting around 50% is normal; climb to 70%+ by December"],
  ["Sunday test + sign-off", "Done"],
  ["Mistakes logged", "Every day"],
];

// The topic checklist, PDF section 13, verbatim item names. Ids are stable
// slugs - they are the keys of gate_plan_members.checklist, so renaming an
// item's label is safe but changing its id orphans every tick on it.
const slug = (s) => s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const group = (title, paper, items) => ({
  title, paper,
  items: items.map(label => ({ id: `${slug(title)}--${slug(label)}`, label })),
});
export const TOPIC_CHECKLIST = [
  group("Probability & Statistics", "BOTH", ["Counting", "Axioms & events", "Conditional prob. & Bayes", "Random variables, PMF/PDF/CDF", "Expectation & variance", "Discrete distributions", "Continuous distributions", "Covariance & correlation (DA)", "CLT, CIs & tests (DA)"]),
  group("Programming & DS", "BOTH", ["C expressions & control flow", "Pointers & arrays", "Functions, scope, recursion", "Python tracing", "Stacks & queues", "Linked lists", "Trees & BST", "Binary heaps", "Hashing"]),
  group("Algorithms", "BOTH", ["Asymptotics", "Recurrences", "Searching & basic sorts", "Merge, quick, heap sort", "Greedy (CS)", "Dynamic programming (CS)", "BFS / DFS", "MST (CS)", "Shortest paths"]),
  group("DBMS", "BOTH", ["ER & relational model", "Relational algebra & TRC", "SQL", "FDs & normal forms", "Transactions (CS)", "Concurrency control (CS)", "Indexing & B/B+ trees", "Warehousing & transformation (DA)"]),
  group("Linear Algebra", "BOTH", ["Matrices & determinants", "Rank & linear systems", "Gaussian elim. & LU", "Eigenvalues & vectors", "Vector spaces, rank-nullity (DA)", "Projections, quadratic forms (DA)", "SVD (DA)"]),
  group("Calculus", "BOTH", ["Limits, continuity, differentiability", "Mean value theorem (CS)", "Maxima/minima & optimization", "Taylor series (DA)", "Integration (CS)"]),
  group("Discrete Maths", "CS", ["Propositional logic", "First-order logic", "Sets, relations, functions", "Posets, lattices, groups", "Graph theory", "Combinatorics & recurrences"]),
  group("Operating Systems", "CS", ["Processes, threads, IPC", "CPU scheduling", "Synchronization", "Deadlock", "Paging & virtual memory", "File systems"]),
  group("Computer Networks", "CS", ["Layering & switching", "Error detection", "MAC & Ethernet", "Routing", "IPv4, CIDR, NAT", "TCP", "DNS & HTTP"]),
  group("Theory of Computation", "CS", ["Regex & finite automata", "Regular langs & pumping lemma", "CFG & PDA", "CFL properties", "TM & undecidability"]),
  group("COA", "CS", ["Addressing modes", "Memory hierarchy", "Cache mapping", "Pipelining & hazards", "I/O & DMA"]),
  group("Digital Logic", "CS", ["Boolean algebra & K-maps", "Number representation", "Combinational circuits", "Sequential circuits"]),
  group("Machine Learning", "DA", ["Linear, multiple, ridge regression", "Logistic regression", "KNN & naive Bayes", "LDA & SVM", "Decision trees", "Bias-variance & CV", "MLP / feed-forward nets", "k-means / k-medoids", "Hierarchical clustering", "PCA"]),
  group("Artificial Intelligence", "DA", ["Uninformed search", "Informed search & A*", "Minimax & alpha-beta", "Logic", "Cond. independence & var. elimination", "Sampling"]),
  group("General Aptitude", "BOTH", ["Quantitative aptitude", "Data interpretation", "Verbal ability", "Reading comprehension", "Logical & spatial reasoning"]),
  group("Compiler Design (Dec evenings)", "CS", ["Lexical analysis & parsing", "SDT & intermediate code", "Runtime environments", "Data-flow analysis"]),
];
export const CHECKLIST_ITEM_COUNT = TOPIC_CHECKLIST.reduce((n, g) => n + g.items.length, 0);

export const CLOSING_LINE = "3.5 hours. Every day. No zero days. Learn → Solve → Revise → Analyse.";

// Hours by subject, recomputed from the imported index: each topic day is a
// 2.5 h block, each compiler evening a 35-minute session. See the header for
// why this is derived rather than transcribed.
export function hoursBudget(index) {
  const by = {};
  let compiler = 0;
  for (const d of index || []) {
    if (d.type === "topic") by[d.subject] = (by[d.subject] || 0) + 2.5;
    if (d.compiler) compiler++;
  }
  const rows = Object.entries(by).map(([subject, hours]) => ({ subject, hours }));
  if (compiler) rows.push({ subject: "Compiler Design (evenings)", hours: Math.round((compiler * 35) / 6) / 10 });
  return rows.sort((a, b) => b.hours - a.hours);
}
