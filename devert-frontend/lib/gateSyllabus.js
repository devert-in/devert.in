// The official GATE syllabus, transcribed section-by-section, as seed data.
//
// Why this is a source file and not just admin data-entry: the syllabus is a
// published, externally-fixed document, not editorial content someone should be
// retyping into a form. Encoding it here means (a) a brand-new deployment can
// stand up a complete, correct syllabus tree in one click, (b) the tree an
// admin then authors lesson content against is provably the official one, and
// (c) when GATE revises a syllabus, the diff is a reviewable code change rather
// than an untracked series of edits in a production database.
//
// SOURCES
//   CS - "GATE 2027 / CS Computer Science and Information Technology", IIT
//        Madras (organizing institute), Sections 1-10. Transcribed verbatim
//        at module level; the topic lists below are that section's own prose
//        split into individually-teachable units, which is the only editorial
//        judgement applied here.
//   DA - the official GATE Data Science & Artificial Intelligence paper's
//        seven sections, same treatment.
//   General Aptitude - GATE's separate common GA syllabus. It is NOT in the
//        CS subject PDF (GA is published once for every paper), but it is 15
//        of the 100 marks on every GATE paper including CS and DA, so a module
//        promising end-to-end preparation cannot omit it.
//
// WEIGHTAGES are historical multi-year averages of marks per section, not
// values GATE publishes - they exist to drive the "what's worth studying
// first" ordering and are editable per-paper in /admin. They are labelled as
// approximate everywhere they surface in the UI.
//
// Seeding writes papers/subjects/topics with status "published" and NO lesson
// content. That's deliberate: the syllabus tree itself is real information a
// student should see on day one, and the per-topic screens already render an
// honest "this lesson is being written" state for a topic with no authored body
// (same behaviour CS Core has always had). Publishing the skeleton is not the
// same as pretending the lessons exist.

import { db } from "@/lib/firebase";
import { doc, serverTimestamp, writeBatch } from "firebase/firestore";

function slug(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// ---------------- General Aptitude (common to every GATE paper) ----------------

const GENERAL_APTITUDE = {
  id: "general-aptitude",
  name: "General Aptitude",
  weightageMarks: 15,
  estimatedHours: 40,
  description: "The 15-mark section common to every GATE paper. Cheap marks per hour invested - most candidates under-prepare it.",
  modules: [
    {
      module: "Verbal Aptitude",
      topics: [
        "Basic English Grammar: Tenses",
        "Articles, Adjectives and Prepositions",
        "Conjunctions and Verb-Noun Agreement",
        "Basic Vocabulary: Words, Idioms and Phrases in Context",
        "Reading and Comprehension",
        "Narrative Sequencing",
      ],
    },
    {
      module: "Quantitative Aptitude",
      topics: [
        "Data Interpretation: Graphs, Plots, Maps and Tables",
        "Numerical Computation and Estimation",
        "Ratios, Percentages, Powers and Exponents",
        "Logarithms, Permutations and Combinations",
        "Series and Progressions",
        "Mensuration and Geometry",
        "Elementary Statistics and Probability",
      ],
    },
    {
      module: "Analytical Aptitude",
      topics: [
        "Logic: Deduction and Induction",
        "Analogy",
        "Numerical Relations and Reasoning",
      ],
    },
    {
      module: "Spatial Aptitude",
      topics: [
        "Transformation of Shapes: Translation, Rotation, Scaling and Mirroring",
        "Assembling and Grouping Shapes",
        "Paper Folding, Cutting and 2D/3D Patterns",
      ],
    },
  ],
};

// ---------------- GATE CS: Computer Science and Information Technology ----------------

const CS_SUBJECTS = [
  GENERAL_APTITUDE,
  {
    id: "engineering-mathematics",
    name: "Engineering Mathematics",
    weightageMarks: 13,
    estimatedHours: 90,
    description: "Section 1. Discrete Mathematics alone is usually the single heaviest topic group on the paper.",
    modules: [
      {
        module: "Discrete Mathematics",
        topics: [
          "Propositional Logic",
          "First Order Logic",
          "Sets",
          "Relations",
          "Functions",
          "Partial Orders and Lattices",
          "Monoids",
          "Groups",
          "Graph Connectivity",
          "Graph Matching",
          "Graph Colouring",
          "Combinatorics: Counting",
          "Recurrence Relations",
          "Generating Functions",
        ],
      },
      {
        module: "Linear Algebra",
        topics: [
          "Matrices",
          "Determinants",
          "System of Linear Equations",
          "Eigenvalues and Eigenvectors",
          "LU Decomposition",
        ],
      },
      {
        module: "Calculus",
        topics: [
          "Limits",
          "Continuity and Differentiability",
          "Maxima and Minima",
          "Mean Value Theorem",
          "Integration",
        ],
      },
      {
        module: "Probability and Statistics",
        topics: [
          "Random Variables",
          "Uniform Distribution",
          "Normal Distribution",
          "Exponential Distribution",
          "Poisson Distribution",
          "Binomial Distribution",
          "Mean, Median, Mode and Standard Deviation",
          "Conditional Probability",
          "Bayes Theorem",
        ],
      },
    ],
  },
  {
    id: "digital-logic",
    name: "Digital Logic",
    weightageMarks: 6,
    estimatedHours: 45,
    description: "Section 2. Small, self-contained and highly scoring - almost every question is solvable by method rather than insight.",
    modules: [
      {
        module: "Boolean Algebra and Minimization",
        topics: [
          "Boolean Algebra Fundamentals",
          "Logic Gates and Universal Gates",
          "Algebraic Minimization Technique",
          "Karnaugh Map",
          "Tabular Method (Quine-McCluskey)",
        ],
      },
      {
        module: "Combinational and Sequential Circuits",
        topics: [
          "Combinational Circuit Design",
          "Multiplexers, Decoders and Encoders",
          "Latches and Flip-Flops",
          "Sequential Circuit Design",
          "Counters and Shift Registers",
          "Finite State Machine Design",
        ],
      },
      {
        module: "Number Representation and Arithmetic",
        topics: [
          "Number Systems and Base Conversion",
          "Fixed Point Representation",
          "Floating Point Representation (IEEE 754)",
          "Binary Arithmetic",
        ],
      },
    ],
  },
  {
    id: "computer-organization-and-architecture",
    name: "Computer Organization and Architecture",
    weightageMarks: 8,
    estimatedHours: 60,
    description: "Section 3. Numerical-heavy: cache and pipeline questions reward practised arithmetic over theory.",
    modules: [
      {
        module: "Instruction Set and Addressing",
        topics: [
          "Instruction Set Architecture",
          "Addressing Modes",
        ],
      },
      {
        module: "ALU and Control Unit",
        topics: [
          "Design of Arithmetic and Logic Unit (ALU)",
          "Hardwired Control Unit Design",
          "Microprogrammed Control Unit Design",
        ],
      },
      {
        module: "Memory Interfacing and Hierarchy",
        topics: [
          "Memory Hierarchy and Performance",
          "Cache Memory Mapping",
          "Cache Performance and Replacement Policies",
          "Memory Interfacing",
        ],
      },
      {
        module: "I/O Interface",
        topics: [
          "I/O Interface: Interrupts",
          "I/O Interface: DMA",
        ],
      },
      {
        module: "Pipelining",
        topics: [
          "Instruction Pipelining",
          "Pipeline Hazards",
        ],
      },
    ],
  },
  {
    id: "programming-and-data-structures",
    name: "Programming and Data Structures",
    weightageMarks: 11,
    estimatedHours: 80,
    description: "Section 4. Programming is in C specifically - pointer and recursion output questions are a recurring free-mark source.",
    modules: [
      {
        module: "Programming in C",
        topics: [
          "C Basics: Data Types and Operators",
          "Control Flow and Functions",
          "Pointers and Memory",
          "Arrays and Strings in C",
          "Structures, Unions and Storage Classes",
        ],
      },
      {
        module: "Recursion",
        topics: [
          "Recursion",
          "Recursion Tracing and Output Prediction",
        ],
      },
      {
        module: "Linear Data Structures",
        topics: [
          "Arrays",
          "Stacks",
          "Queues",
          "Linked Lists",
        ],
      },
      {
        module: "Trees and Heaps",
        topics: [
          "Trees and Tree Traversals",
          "Binary Search Trees",
          "Binary Heaps",
        ],
      },
      {
        module: "Graphs",
        topics: [
          "Graph Representations",
        ],
      },
    ],
  },
  {
    id: "algorithms",
    name: "Algorithms",
    weightageMarks: 8,
    estimatedHours: 65,
    description: "Section 5. Note the syllabus says asymptotic WORST CASE complexity - average-case analysis is out of scope.",
    modules: [
      {
        module: "Complexity Analysis",
        topics: [
          "Asymptotic Notation",
          "Worst Case Time and Space Complexity",
          "Recurrence Solving for Algorithms",
        ],
      },
      {
        module: "Searching, Sorting and Hashing",
        topics: [
          "Searching",
          "Sorting",
          "Hashing",
        ],
      },
      {
        module: "Algorithm Design Techniques",
        topics: [
          "Greedy Algorithms",
          "Dynamic Programming",
          "Divide and Conquer",
        ],
      },
      {
        module: "Graph Algorithms",
        topics: [
          "Graph Traversals",
          "Minimum Spanning Trees",
          "Shortest Paths",
        ],
      },
    ],
  },
  {
    id: "theory-of-computation",
    name: "Theory of Computation",
    weightageMarks: 9,
    estimatedHours: 60,
    description: "Section 6. Consistently one of the highest-weight sections and one of the most conceptually unforgiving.",
    modules: [
      {
        module: "Regular Languages",
        topics: [
          "Finite Automata (DFA and NFA)",
          "Regular Expressions",
          "Minimization of Finite Automata",
          "Regular Language Properties and Closure",
          "Pumping Lemma for Regular Languages",
        ],
      },
      {
        module: "Context-Free Languages",
        topics: [
          "Context-Free Grammars",
          "Push-Down Automata",
          "Context-Free Language Properties and Closure",
          "Pumping Lemma for Context-Free Languages",
        ],
      },
      {
        module: "Turing Machines and Undecidability",
        topics: [
          "Turing Machines",
          "Decidability and Undecidability",
          "Reductions and the Halting Problem",
        ],
      },
    ],
  },
  {
    id: "compiler-design",
    name: "Compiler Design",
    weightageMarks: 5,
    estimatedHours: 40,
    description: "Section 7. Narrow and predictable - parsing plus the four named data-flow analyses cover most of what is ever asked.",
    modules: [
      {
        module: "Front End",
        topics: [
          "Lexical Analysis",
          "Parsing: Top-Down",
          "Parsing: Bottom-Up",
          "Syntax-Directed Translation",
        ],
      },
      {
        module: "Runtime and Intermediate Code",
        topics: [
          "Runtime Environments",
          "Intermediate Code Generation",
        ],
      },
      {
        module: "Optimisation and Data Flow Analysis",
        topics: [
          "Local Optimisation",
          "Constant Propagation",
          "Liveness Analysis",
          "Common Subexpression Elimination",
        ],
      },
    ],
  },
  {
    id: "operating-system",
    name: "Operating System",
    weightageMarks: 8,
    estimatedHours: 60,
    description: "Section 8. Synchronization and virtual memory carry the numerical questions; the rest is high-yield theory.",
    modules: [
      {
        module: "Processes and Threads",
        topics: [
          "System Calls",
          "Processes",
          "Threads",
          "Inter-Process Communication",
        ],
      },
      {
        module: "Concurrency and Synchronization",
        topics: [
          "Concurrency and Synchronization",
          "Semaphores and Monitors",
        ],
      },
      {
        module: "Deadlock",
        topics: [
          "Deadlock",
        ],
      },
      {
        module: "Scheduling",
        topics: [
          "CPU Scheduling",
          "I/O Scheduling",
        ],
      },
      {
        module: "Memory Management",
        topics: [
          "Memory Management",
          "Virtual Memory and Paging",
        ],
      },
      {
        module: "File Systems",
        topics: [
          "File Systems",
        ],
      },
    ],
  },
  {
    id: "databases",
    name: "Databases",
    weightageMarks: 8,
    estimatedHours: 55,
    description: "Section 9. Normalization, SQL and B/B+ tree numericals are the reliable scorers.",
    modules: [
      {
        module: "Data Models",
        topics: [
          "ER Model",
          "Relational Model",
        ],
      },
      {
        module: "Relational Query Languages",
        topics: [
          "Relational Algebra",
          "Tuple Relational Calculus",
          "SQL",
        ],
      },
      {
        module: "Constraints and Design",
        topics: [
          "Integrity Constraints",
          "Functional Dependencies and Normal Forms",
        ],
      },
      {
        module: "File Organization and Indexing",
        topics: [
          "File Organization",
          "Indexing: B Trees",
          "Indexing: B+ Trees",
        ],
      },
      {
        module: "Transactions and Concurrency Control",
        topics: [
          "Transactions",
          "Concurrency Control",
        ],
      },
    ],
  },
  {
    id: "computer-networks",
    name: "Computer Networks",
    weightageMarks: 9,
    estimatedHours: 55,
    description: "Section 10. The 2027 syllabus is explicitly narrower than older ones - IPv4 only, and named protocols only.",
    modules: [
      {
        module: "Layering and Switching",
        topics: [
          "Principles of Layering",
          "Switching: Circuit, Packet and Virtual Circuit",
          "Network Performance Metrics",
        ],
      },
      {
        module: "Data Link Layer",
        topics: [
          "Error Detection",
          "Medium Access Control",
          "Ethernet",
        ],
      },
      {
        module: "Routing",
        topics: [
          "Distance Vector Routing",
          "Link State Routing",
        ],
      },
      {
        module: "Network Layer: IPv4",
        topics: [
          "IPv4 Addressing and Fragmentation",
          "CIDR Notation",
          "Network Address Translation",
        ],
      },
      {
        module: "Transport Layer",
        topics: [
          "TCP Flow Control",
          "TCP Congestion Control",
          "Socket API",
        ],
      },
      {
        module: "Application Layer",
        topics: [
          "DNS",
          "HTTP",
        ],
      },
    ],
  },
];

// ---------------- GATE DA: Data Science and Artificial Intelligence ----------------

const DA_SUBJECTS = [
  GENERAL_APTITUDE,
  {
    id: "probability-and-statistics",
    name: "Probability and Statistics",
    weightageMarks: 16,
    estimatedHours: 80,
    description: "The heaviest DA section. Goes well beyond GATE CS's probability - hypothesis testing and the CLT are in scope.",
    modules: [
      {
        module: "Counting and Probability Axioms",
        topics: [
          "Counting: Permutations and Combinations",
          "Probability Axioms",
          "Sample Space and Events",
          "Independent and Mutually Exclusive Events",
          "Marginal, Conditional and Joint Probability",
          "Bayes Theorem",
        ],
      },
      {
        module: "Descriptive Statistics",
        topics: [
          "Mean, Median, Mode and Standard Deviation",
          "Correlation and Covariance",
          "Conditional Expectation and Variance",
        ],
      },
      {
        module: "Random Variables and Distributions",
        topics: [
          "Random Variables",
          "Discrete Random Variables and Probability Mass Functions",
          "Uniform, Bernoulli and Binomial Distributions",
          "Continuous Random Variables and Probability Density Functions",
          "Exponential, Poisson and Normal Distributions",
          "Standard Normal, t and Chi-Squared Distributions",
          "Cumulative Distribution Function",
          "Conditional PDF",
        ],
      },
      {
        module: "Inference and Hypothesis Testing",
        topics: [
          "Central Limit Theorem",
          "Confidence Intervals",
          "z-Test",
          "t-Test",
          "Chi-Squared Test",
        ],
      },
    ],
  },
  {
    id: "linear-algebra",
    name: "Linear Algebra",
    weightageMarks: 12,
    estimatedHours: 60,
    description: "Broader than the CS paper's version - special matrix classes, SVD and projections are all explicitly listed.",
    modules: [
      {
        module: "Vector Spaces",
        topics: [
          "Vector Spaces and Subspaces",
          "Linear Dependence and Independence of Vectors",
          "Projections",
        ],
      },
      {
        module: "Matrices and Their Properties",
        topics: [
          "Matrices",
          "Projection Matrix",
          "Orthogonal Matrix",
          "Idempotent Matrix",
          "Partition Matrix and Properties",
          "Quadratic Forms",
        ],
      },
      {
        module: "Systems of Linear Equations",
        topics: [
          "Systems of Linear Equations and Solutions",
          "Gaussian Elimination",
          "Determinant",
          "Rank and Nullity",
        ],
      },
      {
        module: "Decompositions",
        topics: [
          "Eigenvalues and Eigenvectors",
          "LU Decomposition",
          "Singular Value Decomposition",
        ],
      },
    ],
  },
  {
    id: "calculus-and-optimization",
    name: "Calculus and Optimization",
    weightageMarks: 6,
    estimatedHours: 30,
    description: "The smallest DA section and the most tightly bounded - single-variable only.",
    modules: [
      {
        module: "Single Variable Calculus",
        topics: [
          "Functions of a Single Variable",
          "Limit, Continuity and Differentiability",
          "Taylor Series",
        ],
      },
      {
        module: "Optimization",
        topics: [
          "Maxima and Minima",
          "Optimization Involving a Single Variable",
        ],
      },
    ],
  },
  {
    id: "programming-data-structures-and-algorithms",
    name: "Programming, Data Structures and Algorithms",
    weightageMarks: 14,
    estimatedHours: 70,
    description: "Programming is in PYTHON for the DA paper, not C - a common and costly mix-up for candidates preparing both papers.",
    modules: [
      {
        module: "Programming in Python",
        topics: [
          "Python Basics: Types, Operators and Control Flow",
          "Functions, Comprehensions and Iterators",
          "Python Collections and Idioms",
        ],
      },
      {
        module: "Basic Data Structures",
        topics: [
          "Stacks",
          "Queues",
          "Linked Lists",
          "Trees",
          "Hash Tables",
        ],
      },
      {
        module: "Search and Sort",
        topics: [
          "Linear Search",
          "Binary Search",
          "Selection Sort",
          "Bubble Sort",
          "Insertion Sort",
        ],
      },
      {
        module: "Divide and Conquer",
        topics: [
          "Mergesort",
          "Quicksort",
        ],
      },
      {
        module: "Graph Algorithms",
        topics: [
          "Introduction to Graph Theory",
          "Graph Traversals",
          "Shortest Path",
        ],
      },
    ],
  },
  {
    id: "database-management-and-warehousing",
    name: "Database Management and Warehousing",
    weightageMarks: 10,
    estimatedHours: 50,
    description: "The relational half overlaps GATE CS almost exactly; the warehousing and data-preparation half does not.",
    modules: [
      {
        module: "Relational Databases",
        topics: [
          "ER Model",
          "Relational Model and Relational Algebra",
          "Tuple Calculus",
          "SQL",
          "Integrity Constraints",
          "Normal Forms",
        ],
      },
      {
        module: "Storage and Indexing",
        topics: [
          "File Organization",
          "Indexing",
          "Data Types",
        ],
      },
      {
        module: "Data Transformation",
        topics: [
          "Normalization and Discretization",
          "Sampling",
          "Compression",
        ],
      },
      {
        module: "Data Warehouse Modelling",
        topics: [
          "Schemas for Multidimensional Data Models",
          "Concept Hierarchies",
          "Measures: Categorization and Computations",
        ],
      },
    ],
  },
  {
    id: "machine-learning",
    name: "Machine Learning",
    weightageMarks: 19,
    estimatedHours: 100,
    description: "The defining DA section and the largest by weight. Split by the syllabus into supervised and unsupervised learning.",
    modules: [
      {
        module: "Supervised Learning: Regression",
        topics: [
          "Regression and Classification Problems",
          "Simple Linear Regression",
          "Multiple Linear Regression",
          "Ridge Regression",
          "Logistic Regression",
        ],
      },
      {
        module: "Supervised Learning: Classification",
        topics: [
          "k-Nearest Neighbour",
          "Naive Bayes Classifier",
          "Linear Discriminant Analysis",
          "Support Vector Machine",
          "Decision Trees",
        ],
      },
      {
        module: "Model Selection and Evaluation",
        topics: [
          "Bias-Variance Trade-off",
          "Leave-One-Out Cross-Validation",
          "k-Fold Cross-Validation",
        ],
      },
      {
        module: "Neural Networks",
        topics: [
          "Multi-Layer Perceptron",
          "Feed-Forward Neural Network",
        ],
      },
      {
        module: "Unsupervised Learning",
        topics: [
          "Clustering Algorithms",
          "k-Means and k-Medoid",
          "Hierarchical Clustering: Top-Down and Bottom-Up",
          "Single-Linkage and Multiple-Linkage Clustering",
          "Dimensionality Reduction",
          "Principal Component Analysis",
        ],
      },
    ],
  },
  {
    id: "artificial-intelligence",
    name: "Artificial Intelligence",
    weightageMarks: 8,
    estimatedHours: 45,
    description: "Search, logic and probabilistic reasoning. Note that only variable elimination and sampling are named for inference.",
    modules: [
      {
        module: "Search",
        topics: [
          "Uninformed Search",
          "Informed Search",
          "Adversarial Search",
        ],
      },
      {
        module: "Logic",
        topics: [
          "Propositional Logic",
          "Predicate Logic",
        ],
      },
      {
        module: "Reasoning Under Uncertainty",
        topics: [
          "Conditional Independence Representation",
          "Exact Inference Through Variable Elimination",
          "Approximate Inference Through Sampling",
        ],
      },
    ],
  },
];

// ---------------- paper definitions ----------------

// examDate is deliberately left null rather than guessed - GATE announces it
// per cycle, and a fabricated countdown is worse than no countdown. The
// Overview's countdown card renders "date not announced yet" until an admin
// fills it in.
export const GATE_SYLLABI = {
  cs: {
    id: "cs",
    code: "CS",
    name: "GATE CS",
    fullName: "Computer Science and Information Technology",
    order: 10,
    description: "The classic GATE CS paper: ten technical sections plus General Aptitude, 65 questions, 100 marks, 180 minutes.",
    subjects: CS_SUBJECTS,
  },
  da: {
    id: "da",
    code: "DA",
    name: "GATE DA",
    fullName: "Data Science and Artificial Intelligence",
    order: 20,
    description: "GATE's data science paper: probability, linear algebra, Python DSA, databases and warehousing, machine learning and AI.",
    subjects: DA_SUBJECTS,
  },
  // The combined track is a real preparation mode, not a real GATE paper - a
  // candidate may sit CS and DA in the same cycle, and the two share
  // substantial ground (General Aptitude entirely, plus databases, DSA and
  // parts of mathematics). Modelled as its own paper document carrying the
  // union of both subject trees, so progress, tests and analytics work for it
  // exactly as they do for a single paper with no special-casing anywhere.
  // Duplicate subject ids between the two trees are resolved by preferring the
  // CS version and tagging the DA-only extras, so a student never sees two
  // "General Aptitude" subjects.
  "cs-da": {
    id: "cs-da",
    code: "CS+DA",
    name: "GATE CS + DA",
    fullName: "Computer Science and Data Science Combined Preparation",
    order: 30,
    description: "A combined track for candidates sitting both papers in the same cycle - the union of the CS and DA syllabi, deduplicated.",
    subjects: (() => {
      const byId = new Map();
      for (const s of CS_SUBJECTS) byId.set(s.id, s);
      for (const s of DA_SUBJECTS) if (!byId.has(s.id)) byId.set(s.id, { ...s, daOnly: true });
      return [...byId.values()];
    })(),
  },
};

// A flat count for the admin panel's "seed" button, so it can say exactly how
// many documents the action is about to write before writing them.
export function countSyllabusDocs(syllabus) {
  const subjects = syllabus.subjects.length;
  const topics = syllabus.subjects.reduce(
    (n, s) => n + s.modules.reduce((m, mod) => m + mod.topics.length, 0), 0);
  return { subjects, topics, total: 1 + subjects + topics };
}

// Writes (or re-writes) one paper's entire tree. merge:true throughout, so
// re-seeding an already-authored paper is SAFE and additive: it restores any
// missing subject/topic shell and refreshes the syllabus-derived fields
// (name, module, order) without touching a single authored lesson field -
// concept, keyPoints, formulas, mcqs and the rest are simply absent from the
// payload below, so a merge leaves them exactly as they were. That property is
// what makes "re-seed after GATE revises the syllabus" a usable operation
// rather than a data-loss event.
//
// `order` is gapped by 10 at both levels, matching the convention in
// lib/campusNavConfig.js: inserting a topic between two existing ones later
// never requires renumbering its siblings.
export async function seedPaper(paperId, { onProgress } = {}) {
  const syllabus = GATE_SYLLABI[paperId];
  if (!syllabus) throw new Error(`No seed syllabus for paper "${paperId}".`);

  const ops = [];
  ops.push({
    ref: doc(db, "gatePapers", syllabus.id),
    data: {
      code: syllabus.code, name: syllabus.name, fullName: syllabus.fullName,
      description: syllabus.description, order: syllabus.order,
      status: "published",
      totalMarks: 100, durationMinutes: 180, questionCount: 65,
      syllabusVersion: "GATE 2027",
      seededAt: serverTimestamp(), updatedAt: serverTimestamp(),
    },
  });

  syllabus.subjects.forEach((subject, si) => {
    const topicCount = subject.modules.reduce((n, m) => n + m.topics.length, 0);
    ops.push({
      ref: doc(db, "gatePapers", syllabus.id, "subjects", subject.id),
      data: {
        name: subject.name, order: (si + 1) * 10, status: "published",
        weightageMarks: subject.weightageMarks, estimatedHours: subject.estimatedHours,
        description: subject.description, topicCount,
        daOnly: !!subject.daOnly,
        updatedAt: serverTimestamp(),
      },
    });

    let topicIndex = 0;
    subject.modules.forEach((mod) => {
      mod.topics.forEach((title) => {
        topicIndex++;
        ops.push({
          ref: doc(db, "gatePapers", syllabus.id, "subjects", subject.id, "topics", slug(title)),
          data: {
            title, module: mod.module, order: topicIndex * 10, status: "published",
            difficulty: "Moderate", estimatedMinutes: 30,
            xpReward: 25, coinReward: 10,
            updatedAt: serverTimestamp(),
          },
        });
      });
    });
  });

  // 450 writes per batch (Firestore's cap is 500) - the CS tree alone is over
  // 130 documents and the combined paper is well past a single batch.
  for (let i = 0; i < ops.length; i += 450) {
    const batch = writeBatch(db);
    ops.slice(i, i + 450).forEach(({ ref, data }) => batch.set(ref, data, { merge: true }));
    await batch.commit();
    onProgress?.(Math.min(i + 450, ops.length), ops.length);
  }

  return { written: ops.length };
}
