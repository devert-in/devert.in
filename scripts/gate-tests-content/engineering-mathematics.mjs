// Original GATE-style subject test for Engineering Mathematics. Every
// question is newly authored (not a real past-year question - see gate_pyqs
// for that, sourced separately with verification), following GATE's actual
// format (MCQ/MSQ/NAT, 1 or 2 marks) and difficulty level.

export const TEST = {
  subjectId: "engineering-mathematics",
  title: "Engineering Mathematics - Subject Test",
  description: "8 questions covering Discrete Mathematics, Linear Algebra, Calculus, and Probability & Statistics - the full Engineering Mathematics section.",
  testType: "subject",
  durationMinutes: 45,
  instructions: "Standard GATE marking applies: MCQ negative marking (-1/3 for 1-mark, -2/3 for 2-mark), no negative marking for MSQ or NAT.",
  questions: [
    {
      questionType: "mcq", marks: 1, difficulty: "Easy",
      question: "Which of the following is the correct De Morgan's law form for (A + B)'?",
      options: [
        { id: "a", text: "A' + B'" },
        { id: "b", text: "A' . B'" },
        { id: "c", text: "A . B" },
        { id: "d", text: "A + B" },
      ],
      correctOptionIds: ["b"],
      solution: "(A + B)' = A' . B' by De Morgan's law - breaking the bar flips OR to AND and complements each variable.",
      explanation: "A very common trap is answering A' + B' (keeping the operator the same) - De Morgan's law specifically flips the operator when the bar is distributed.",
    },
    {
      questionType: "mcq", marks: 1, difficulty: "Easy",
      question: "A relation R on a set is reflexive, symmetric, and transitive. What is R called?",
      options: [
        { id: "a", text: "A partial order" },
        { id: "b", text: "An equivalence relation" },
        { id: "c", text: "A function" },
        { id: "d", text: "A total order" },
      ],
      correctOptionIds: ["b"],
      solution: "Reflexive + symmetric + transitive defines an equivalence relation, which partitions the set into equivalence classes.",
      explanation: "A partial order requires antisymmetry instead of symmetry - swapping this one property changes the entire structure being described.",
    },
    {
      questionType: "mcq", marks: 2, difficulty: "Moderate",
      question: "How many ways can the letters of the word 'ENGINEERING' be arranged? (E:3, N:3, G:2, I:2, R:1)",
      options: [
        { id: "a", text: "11! / (3! 3! 2! 2!)" },
        { id: "b", text: "11!" },
        { id: "c", text: "11! / (3! + 3! + 2! + 2!)" },
        { id: "d", text: "11! / 4!" },
      ],
      correctOptionIds: ["a"],
      solution: "ENGINEERING has 11 letters with E repeated 3 times, N repeated 3 times, G repeated 2 times, I repeated 2 times, R once. Arrangements = 11!/(3!3!2!2!1!).",
      explanation: "The repeated-letter arrangement formula divides by the factorial of EACH repeated group's count, multiplied together in the denominator - not summed, which option (c) incorrectly does.",
    },
    {
      questionType: "mcq", marks: 1, difficulty: "Moderate",
      question: "A matrix A is 4x4 with det(A) = 3. What is det(2A)?",
      options: [
        { id: "a", text: "6" },
        { id: "b", text: "24" },
        { id: "c", text: "48" },
        { id: "d", text: "12" },
      ],
      correctOptionIds: ["c"],
      solution: "det(kA) = k^n det(A) for an n x n matrix. Here k=2, n=4: det(2A) = 2^4 * 3 = 16*3 = 48.",
      explanation: "The most common error is computing 2*det(A)=6, forgetting that EVERY row scales by k, giving k^n overall, not just k.",
    },
    {
      questionType: "nat", marks: 2, difficulty: "Moderate",
      question: "A 3x3 upper triangular matrix has diagonal entries 2, -3, and 5. What is the sum of its eigenvalues?",
      natMin: 4, natMax: 4,
      solution: "For a triangular matrix, the eigenvalues are exactly the diagonal entries: 2, -3, 5. Sum = 2 + (-3) + 5 = 4.",
      explanation: "This also equals the trace of the matrix directly, a useful cross-check.",
    },
    {
      questionType: "mcq", marks: 1, difficulty: "Easy",
      question: "What is the value of lim(x->0) sin(x)/x?",
      options: [
        { id: "a", text: "0" },
        { id: "b", text: "1" },
        { id: "c", text: "Undefined" },
        { id: "d", text: "Infinity" },
      ],
      correctOptionIds: ["b"],
      solution: "This is a standard, well-known limit: lim(x->0) sin(x)/x = 1 (derivable via L'Hopital's rule or the Taylor series of sin(x)).",
      explanation: "Directly substituting x=0 gives the indeterminate form 0/0, which is exactly why this limit requires a specific technique rather than direct substitution.",
    },
    {
      questionType: "mcq", marks: 2, difficulty: "Moderate",
      question: "X is a continuous random variable with PDF f(x) = 3x^2 for 0 <= x <= 1, and 0 elsewhere. What is P(X <= 0.5)?",
      options: [
        { id: "a", text: "0.125" },
        { id: "b", text: "0.5" },
        { id: "c", text: "0.25" },
        { id: "d", text: "0.375" },
      ],
      correctOptionIds: ["a"],
      solution: "P(X<=0.5) = integral of 3x^2 dx from 0 to 0.5 = [x^3] from 0 to 0.5 = 0.125 - 0 = 0.125.",
      explanation: "A quick sanity check: the PDF integrates to 1 over [0,1] (integral of 3x^2 from 0 to 1 = 1), confirming it's a valid PDF before computing the sub-range probability.",
    },
    {
      questionType: "msq", marks: 2, difficulty: "Hard",
      question: "Which of the following statements about a Binary Search Tree's related discrete structure, a partial order, are TRUE?",
      options: [
        { id: "a", text: "A partial order is reflexive, antisymmetric, and transitive" },
        { id: "b", text: "Every partial order is also a total order" },
        { id: "c", text: "In a partial order, some pairs of elements may be incomparable" },
        { id: "d", text: "A partial order cannot have a maximum element" },
      ],
      correctOptionIds: ["a", "c"],
      solution: "A partial order requires reflexivity, antisymmetry, and transitivity (a is TRUE). Unlike a total order, not every pair needs to be comparable (c is TRUE) - this is exactly what distinguishes it from a total order (making b FALSE). A partial order can absolutely have a maximum element (making d FALSE).",
      explanation: "The defining feature of a PARTIAL (vs total) order is precisely that some elements can be incomparable - this is the single most tested conceptual point on this topic.",
    },
  ],
};
