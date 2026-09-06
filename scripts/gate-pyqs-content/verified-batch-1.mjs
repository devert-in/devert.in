// Real, verified GATE CS previous-year questions - the FIRST small batch,
// not a comprehensive bank. Every question here was: (1) found via web
// search across multiple independent sources (GeeksforGeeks, GATE Overflow,
// ExamSIDE, EduRev, solutionsadda), (2) cross-checked for agreement across
// at least two of those sources on the exact question/options/answer, AND
// (3) independently re-derived by hand (the actual math/logic recomputed
// from scratch, not just trusted from a source) before being included here.
//
// Several other candidate questions were found but explicitly EXCLUDED
// during this same research pass because they could not be verified to
// this standard - e.g. a Banker's Algorithm question (GATE 2014 Set 1) whose
// resource-allocation matrices were only shown as an image, unreadable via
// text fetch, so its correctness could not be independently confirmed.
// Excluding an unverifiable "real" question is the correct call here, not
// a gap to silently paper over with a guess.
//
// organizingInstitute values confirmed via a dedicated year-wise-institute
// source, not assumed from memory: GATE 2005 = IIT Bombay, GATE 2014 = IIT
// Kharagpur, GATE 2022 = IIT Kharagpur.

export const PYQS = [
  {
    year: 2022,
    organizingInstitute: "IIT Kharagpur",
    subjectId: "programming-and-data-structures",
    topicId: "pointers-and-memory",
    questionType: "mcq",
    marks: 2,
    difficulty: "Moderate",
    question: `What is printed by the following ANSI C program?

#include<stdio.h>
int main(int argc, char *argv[])
{
   int x = 1, z[2] = {10, 11};
   int *p = NULL;
   p = &x;
   *p = 10;
   p = &z[1];
   *(&z[0] + 1) += 3;
   printf("%d, %d, %d\\n", x, z[0], z[1]);
   return 0;
}`,
    options: [
      { id: "a", text: "1, 10, 11" },
      { id: "b", text: "1, 10, 14" },
      { id: "c", text: "10, 14, 11" },
      { id: "d", text: "10, 10, 14" },
    ],
    correctOptionIds: ["d"],
    solution: `p = &x; *p = 10;  -> x becomes 10 (was 1).
p = &z[1];        -> p now points at z[1] (this line alone changes nothing yet - it only repoints p).
*(&z[0] + 1) += 3; -> &z[0]+1 is the same address as &z[1] (pointer arithmetic on an int array), so this adds 3 to z[1]: 11 + 3 = 14.
Final values: x=10, z[0]=10 (never touched), z[1]=14.
printf prints: 10, 10, 14 -> option (d).`,
    explanation: "The trap is assuming `p = &z[1];` itself changes z[1] - it only repoints the pointer p, it never dereferences or writes anything. The actual write to z[1] happens on the NEXT line, via `&z[0] + 1`, a completely separate pointer expression that happens to also reach z[1].",
    repeatGroup: "",
    isRepeated: false,
    status: "published",
  },
  {
    year: 2005,
    organizingInstitute: "IIT Bombay",
    subjectId: "computer-networks",
    topicId: "cidr-notation",
    questionType: "mcq",
    marks: 1,
    difficulty: "Easy",
    question: "An organization has a class B network and wishes to form subnets for 64 departments. The subnet mask would be:",
    options: [
      { id: "a", text: "255.255.0.0" },
      { id: "b", text: "255.255.64.0" },
      { id: "c", text: "255.255.128.0" },
      { id: "d", text: "255.255.252.0" },
    ],
    correctOptionIds: ["d"],
    solution: `A class B network's default mask is /16 (255.255.0.0).
To form 64 subnets, need at least ceil(log2(64)) = 6 extra bits borrowed from the host portion.
New prefix length = 16 + 6 = /22.
/22 in dotted decimal: the third octet's top 6 bits are network bits (11111100 = 252), so the mask is 255.255.252.0.`,
    explanation: "The question gives the department COUNT (64), not a prefix length directly - the first step is always converting a required subnet count into the number of extra bits needed (2^bits >= count), THEN adding those bits to the class's default prefix length.",
    repeatGroup: "",
    isRepeated: false,
    status: "published",
  },
  {
    year: 2005,
    organizingInstitute: "IIT Bombay",
    subjectId: "programming-and-data-structures",
    topicId: "binary-search-trees",
    questionType: "mcq",
    marks: 2,
    difficulty: "Moderate",
    question: "How many distinct binary search trees can be created out of 4 distinct keys?",
    options: [
      { id: "a", text: "5" },
      { id: "b", text: "14" },
      { id: "c", text: "24" },
      { id: "d", text: "42" },
    ],
    correctOptionIds: ["b"],
    solution: `The number of distinct BSTs on n distinct keys is the nth Catalan number: C(n) = (2n)! / ((n+1)! * n!).
For n=4: C(4) = 8! / (5! * 4!) = 40320 / (120 * 24) = 40320 / 2880 = 14.
Cross-check via the recurrence t(n) = sum over i=0..n-1 of t(i)*t(n-1-i), with t(0)=t(1)=1:
t(2)=2, t(3)=5, t(4) = t(0)t(3)+t(1)t(2)+t(2)t(1)+t(3)t(0) = 5+2+2+5 = 14. Matches.`,
    explanation: "This is the canonical Catalan-number question - recognising 'count distinct BST shapes on n distinct keys' as exactly the Catalan number sequence (1,1,2,5,14,42,...) is much faster than deriving the recurrence from scratch under exam time pressure.",
    repeatGroup: "",
    isRepeated: false,
    status: "published",
  },
  {
    year: 2014,
    organizingInstitute: "IIT Kharagpur",
    subjectId: "digital-logic",
    topicId: "algebraic-minimization-technique",
    questionType: "mcq",
    marks: 1,
    difficulty: "Moderate",
    question: "Consider the following Boolean expression for F: F(P, Q, R, S) = PQ + P'QR + P'QR'S. The minimal sum-of-products form of F is:",
    options: [
      { id: "a", text: "PQ + QR + QS" },
      { id: "b", text: "P + Q + R + S" },
      { id: "c", text: "P' + Q' + R' + S'" },
      { id: "d", text: "P'R + P'R'S + P" },
    ],
    correctOptionIds: ["a"],
    solution: `F = PQ + P'QR + P'QR'S
   = Q[P + P'R + P'R'S]                          (factor out Q)
   = Q[P + P'(R + R'S)]                          (factor out P' from the last two terms)
   = Q[P + P'(R + S)]                             (identity: X + X'Y = X + Y, applied with X=R, Y=S)
   = Q[P + (R + S)]                                (identity: X + X'Y = X + Y again, applied with X=P, Y=(R+S))
   = QP + QR + QS
   = PQ + QR + QS`,
    explanation: "This simplifies entirely with two applications of the same absorption-style identity (X + X'Y = X + Y) - recognising that pattern twice is much faster than building a 4-variable K-map for a question with only three product terms.",
    repeatGroup: "",
    isRepeated: false,
    status: "published",
  },
];
