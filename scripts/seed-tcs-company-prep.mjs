import admin from "firebase-admin";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(join(__dirname, "service-account.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// Company Prep - TCS. Source: the two TCS placement PDFs the user shared
// ("Placements and all in TCS.pdf" and "TCS prev years questions.pdf") -
// every question here reuses one of those PDFs' own verified answer, ported
// into the companies/{id}/rounds/{id}/categories/{id}/questions/{id} MCQ
// schema (see lib/companyPrep.js). Two adjustments were needed since that
// schema is single-answer-MCQ only:
//   - FUB (Fill-Up-the-Box) numeric-entry questions got plausible wrong
//     numeric distractors added (the correct value is the PDF's own answer).
//   - Open-ended technical/HR questions (e.g. "DELETE vs TRUNCATE vs DROP",
//     "why TCS?") were reframed as "which of these is correct/best" MCQs,
//     keeping the PDF's own explanation as the correctness reasoning.
// The real coding round (2 written problems, 90 min) isn't MCQ-shaped at
// all, so it's represented here as "predict the output / pick the right
// approach" questions instead of a coding round - CodeLab is where actual
// write-and-run problems belong, not Company Prep.

function q(question, options, correctIndex, difficulty, explanation, tags) {
  return { question, options, correctIndex, difficulty, marks: 1, explanation, tags, attemptCount: 0, correctCount: 0, totalTimeSec: 0 };
}

const ROUNDS = [
  {
    name: "Foundation - Numerical Ability", duration: "25 minutes",
    description: "Part A1 of the Integrated Test Pattern - 20 questions in 25 minutes, no negative marking. Percentages, profit-loss and time-speed-distance are the most repeated clusters.",
    categories: [
      {
        name: "Percentages & Profit-Loss",
        questions: [
          q("40% of a number is 144. What is 25% of the same number?", ["80", "85", "90", "96"], 2, "Easy", "Number = 144/0.40 = 360; 25% of 360 = 90.", ["Percentages"]),
          q("A student scoring 33% fails by 40 marks; another scoring 45% gets 20 marks more than the pass marks. What are the maximum marks?", ["400", "450", "500", "600"], 2, "Medium", "The 12% gap equals 40 + 20 = 60 marks, so 1% = 5 and the total is 500.", ["Percentages"]),
          q("An article costing Rs. 480 is sold for Rs. 552. What is the profit percent?", ["12%", "15%", "18%", "20%"], 1, "Easy", "Profit of 72 on a cost of 480 is 15%.", ["Profit & Loss"]),
          q("A trader marks goods 25% above cost and then allows a 12% discount. What is his profit percent?", ["8%", "10%", "12%", "13%"], 1, "Medium", "1.25 x 0.88 = 1.10, i.e. a 10% profit.", ["Profit & Loss"]),
          q("The single discount equivalent to two successive discounts of 20% and 10% is:", ["25%", "27%", "28%", "30%"], 2, "Medium", "0.8 x 0.9 = 0.72, which is a 28% discount overall.", ["Profit & Loss", "Discounts"]),
          q("The price of sugar rises by 25%. By what percent must a family cut its consumption to keep expenditure unchanged?", ["12.5%", "20%", "25%", "30%"], 1, "Easy", "Required reduction = 25/125 = 20%.", ["Percentages"]),
        ],
      },
      {
        name: "Time, Work & Speed",
        questions: [
          q("A can do a job in 10 days, B in 15 days. Working together, how long will they take?", ["5 days", "6 days", "7.5 days", "8 days"], 1, "Easy", "Combined rate 1/10 + 1/15 = 1/6, so 6 days.", ["Time & Work"]),
          q("12 men can finish a job in 18 days. After 6 days, 4 more men join. In how many more days is the remaining work finished?", ["8 days", "9 days", "10 days", "12 days"], 1, "Medium", "216 man-days total; 72 are done in the first 6 days, leaving 144 for 16 men, which is 9 days.", ["Time & Work"]),
          q("A 150 m train running at 54 km/h crosses a 300 m platform in:", ["25 s", "28 s", "30 s", "32 s"], 2, "Easy", "450 m at 15 m/s (54 km/h) takes 30 s.", ["Time, Speed & Distance"]),
          q("A car travels to a town at 60 km/h and returns at 40 km/h. What is the average speed for the whole round trip?", ["45 km/h", "48 km/h", "50 km/h", "Cannot be determined"], 1, "Medium", "For equal distances, average speed is the harmonic mean: 2x60x40/100 = 48 km/h.", ["Time, Speed & Distance"]),
          q("Pipes A and B can fill a tank in 6 h and 8 h respectively; pipe C alone empties it in 12 h. With all three open together, the tank fills in:", ["4 h", "4.8 h", "5 h", "5.5 h"], 1, "Medium", "1/6 + 1/8 - 1/12 = 5/24, so the tank fills in 24/5 = 4.8 hours.", ["Time & Work"]),
          q("A policeman running at 10 km/h chases a thief running at 8 km/h who has a 200 m head start. How long does it take the policeman to catch the thief?", ["5 min", "6 min", "8 min", "10 min"], 1, "Medium", "The gap closes at 2 km/h; 0.2 km takes 0.1 h, which is 6 minutes.", ["Time, Speed & Distance"]),
        ],
      },
      {
        name: "Number System & Averages",
        questions: [
          q("What is the least number that must be added to 1000 so the sum is exactly divisible by 45?", ["10", "30", "35", "40"], 2, "Easy", "1000 mod 45 = 10, so 45 - 10 = 35 must be added.", ["Number System"]),
          q("What is the unit digit of 3^47?", ["1", "3", "7", "9"], 2, "Medium", "Powers of 3 cycle 3,9,7,1; 47 mod 4 = 3, and the 3rd term of the cycle is 7.", ["Number System"]),
          q("A batsman averages 38 runs over 9 innings. How many runs must he score in the 10th innings to raise his average to 40?", ["48", "54", "58", "62"], 2, "Medium", "Needed total is 400; he already has 342, so he needs 58 more.", ["Averages"]),
          q("How many trailing zeros does 100! have?", ["20", "22", "24", "25"], 2, "Medium", "floor(100/5) + floor(100/25) = 20 + 4 = 24.", ["Number System"]),
          q("In how many years will Rs. 8,000 amount to Rs. 9,261 at 5% per annum compound interest?", ["2", "3", "4", "5"], 1, "Medium", "9261/8000 = (1.05)^3, so it takes 3 years.", ["Compound Interest"]),
          q("In how many distinct ways can the 8 letters of the word COMPUTER be arranged?", ["5040", "20160", "40320", "362880"], 2, "Easy", "All 8 letters are distinct, so the answer is 8! = 40320.", ["Permutations & Combinations"]),
        ],
      },
    ],
  },
  {
    name: "Foundation - Verbal Ability", duration: "25 minutes",
    description: "Part A2 of the Integrated Test Pattern - 25 questions in 25 minutes covering reading comprehension, sentence completion, error spotting, grammar and para-jumbles.",
    categories: [
      {
        name: "Error Spotting & Grammar",
        questions: [
          q("Spot the error in: \"Everyday life have become more complicated with the advancement in mobile technology.\"", ["\"Everyday\" is wrong", "\"have\" should be \"has\"", "\"advancement\" is wrong", "No error"], 1, "Medium", "\"Life\" is singular, so it needs the singular auxiliary \"has\", not \"have\".", ["Error Spotting"]),
          q("Fill in the blank: \"She has been working in this organisation ______ 2018.\"", ["for", "since", "from", "before"], 1, "Easy", "\"Since\" marks a fixed point in time and pairs with the present-perfect-continuous tense used here.", ["Grammar"]),
        ],
      },
      {
        name: "Vocabulary, Completion & Para-jumbles",
        questions: [
          q("Sentence completion: \"The committee's report was so ______ that it left no aspect of the incident unexamined.\"", ["cursory", "exhaustive", "ambiguous", "tentative"], 1, "Medium", "\"Left no aspect unexamined\" signals thoroughness, matching \"exhaustive\".", ["Sentence Completion"]),
          q("Which of these sentences uses formal, business-appropriate language?", ["We'll get back to you soon-ish.", "We shall endeavour to inform you of the position in two weeks' time.", "Hang on while we figure it out.", "We'll sort it out, no worries."], 1, "Easy", "Formal register calls for complete constructions and no colloquialisms.", ["Formal Usage"]),
          q("Combine into the best single sentence: (i) I was at the fair. (ii) I got lost. (iii) I got scared.", ["Because I was at the fair, I got lost and scared.", "When I got lost at the fair, I was scared.", "I was at the fair, I got lost, I got scared.", "Getting lost, the fair scared me."], 1, "Medium", "This option preserves the sequence and causality without a comma splice or a dangling modifier.", ["Sentence Combination"]),
          q("Choose the word nearest in meaning to OBSOLETE:", ["Outdated", "Modern", "Rare", "Essential"], 0, "Easy", "OBSOLETE means no longer in use, closest to \"Outdated\".", ["Vocabulary", "Synonyms"]),
          q("Arrange logically: P. It reduced paperwork drastically. Q. The bank introduced a digital onboarding system. R. As a result, account opening now takes minutes. S. Customers earlier waited days for verification.", ["Q-P-S-R", "S-Q-P-R", "Q-S-P-R", "S-P-Q-R"], 1, "Medium", "The old situation (S) is followed by the intervention (Q), then its effect (P), then the outcome (R).", ["Para-jumbles"]),
        ],
      },
    ],
  },
  {
    name: "Foundation - Reasoning Ability", duration: "25 minutes",
    description: "Part A3 of the Integrated Test Pattern - 20 questions in 25 minutes. Seating arrangements, series and syllogisms are the most repeated clusters.",
    categories: [
      {
        name: "Series, Coding & Logic",
        questions: [
          q("Find the next term: 3, 7, 16, 35, 74, ?", ["143", "149", "153", "156"], 2, "Medium", "The pattern is x2+1, x2+2, x2+3, x2+4, so 74x2+5 = 153.", ["Number Series"]),
          q("If PAPER is coded as SDSHU, how is MOTHER coded?", ["PRWKHU", "PRWKHV", "PSWKHU", "PRXKHU"], 0, "Medium", "Every letter shifts forward by 3 positions: M-P, O-R, T-W, H-K, E-H, R-U.", ["Coding-Decoding"]),
          q("Statements: All pens are books. Some books are pencils. Conclusions: I. Some pens are pencils. II. Some pencils are books.", ["Only I follows", "Only II follows", "Both follow", "Neither follows"], 1, "Medium", "Conclusion II is the direct converse of \"some books are pencils\"; conclusion I isn't forced by the premises.", ["Syllogisms"]),
          q("Statement: \"All employees must complete the security training by Friday.\" Conclusion I: Some employees have not yet completed it. Conclusion II: The training is mandatory.", ["Only I follows", "Only II follows", "Both follow", "Neither follows"], 1, "Medium", "\"Must\" implies the training is mandatory; whether anyone is actually still pending is unknown.", ["Statement-Conclusion"]),
        ],
      },
      {
        name: "Blood Relations, Direction & Puzzles",
        questions: [
          q("Pointing to a photograph, Ravi said, \"She is the daughter of my grandfather's only son.\" How is the woman related to Ravi?", ["Mother", "Sister", "Aunt", "Cousin"], 1, "Medium", "Ravi's grandfather's only son is Ravi's own father, so his daughter is Ravi's sister.", ["Blood Relations"]),
          q("A man walks 5 km north, turns right and walks 3 km, then turns right again and walks 5 km. How far and in which direction is he from the start?", ["3 km East", "3 km West", "5 km North", "8 km East"], 0, "Medium", "The two 5 km legs cancel each other out, leaving only the 3 km eastward leg as the net displacement.", ["Direction Sense"]),
          q("Eight friends A-H sit in a row facing north. C is 4th from the left. Only two people sit between C and G. E is an immediate neighbour of G but not of C. A sits at an extreme end and is 3rd to the left of C. Who sits exactly 5th from the left?", ["E", "G", "Cannot be determined", "H"], 2, "Hard", "Several valid seatings satisfy every clue without pinning down seat 5, so TCS reasoning sets do include \"cannot be determined\" as the correct option.", ["Seating Arrangement"]),
          q("A cube is painted red on all faces and then cut into 27 equal small cubes. How many of the small cubes have exactly two painted faces?", ["6", "8", "12", "24"], 2, "Medium", "The two-painted-face cubes are exactly the edge cubes (excluding corners): 12 edges, one each.", ["Cube Cutting"]),
        ],
      },
    ],
  },
  {
    name: "Advanced Quantitative & Reasoning", duration: "25 minutes",
    description: "Part B1 of the Integrated Test Pattern - 15 questions in 25 minutes, decides the upgrade to the Digital and Prime bands. A large share are FUB (Fill-Up-the-Box) items with no options in the real exam - precision beats speed here.",
    categories: [
      {
        name: "FUB - Fill in the Blank",
        questions: [
          q("Find the smallest number which leaves a remainder of 2 when divided by 3, 4, 5 and 6.", ["32", "50", "62", "122"], 2, "Medium", "LCM(3,4,5,6) = 60, and 60 + 2 = 62.", ["FUB", "Number System"]),
          q("How many three-digit numbers are divisible by both 6 and 8?", ["24", "31", "37", "42"], 2, "Medium", "LCM(6,8) = 24; the multiples run 120 to 984, giving (984-120)/24 + 1 = 37.", ["FUB", "Number System"]),
          q("What is the unit digit of 7^2026?", ["1", "3", "7", "9"], 3, "Medium", "Powers of 7 cycle 7,9,3,1 (length 4); 2026 mod 4 = 2, so the answer is the 2nd term, 9.", ["FUB", "Number System"]),
        ],
      },
      {
        name: "Advanced Problems",
        questions: [
          q("A, B and C can finish a job in 10, 12 and 15 days respectively. All three start together; A leaves after 2 days and B leaves 3 days before the work is completed. In how many days is the work finished?", ["6", "7", "8", "9"], 1, "Hard", "With the work as 60 units (rates 6, 5, 4), solving 12 + 4T + 5(T-3) = 60 gives T = 7 days.", ["Time & Work"]),
          q("From a group of 6 men and 4 women, a committee of 5 must include at least 3 women. In how many ways can this be done?", ["66", "81", "121", "186"], 0, "Hard", "3 women + 2 men: C(4,3)C(6,2) = 60; 4 women + 1 man: C(4,4)C(6,1) = 6; total 66.", ["Permutations & Combinations"]),
          q("Two dice are rolled. Given that the sum is even, what is the probability that both dice show the same number?", ["1/6", "1/3", "1/2", "5/18"], 1, "Hard", "There are 18 outcomes with an even sum, of which 6 are doubles, giving 6/18 = 1/3.", ["Probability"]),
          q("Eight people P-W live on eight floors (1 = bottom ... 8 = top). P lives on an even floor above floor 4. Exactly two people live between P and Q. R lives immediately below Q. S lives on floor 1. Only three people live between R and T. If P lives on floor 6, on which floor does T live?", ["2", "4", "7", "8"], 2, "Hard", "P = 6 forces Q = 3 and R = 2; fitting exactly three floors strictly between R and T places T on floor 7.", ["Floor Puzzle"]),
        ],
      },
    ],
  },
  {
    name: "Coding Aptitude (MCQ)", duration: "N/A - concept check",
    description: "TCS's real coding round is two written problems solved and submitted as actual code, not multiple choice - this round instead checks whether you can predict a correct program's output and reason about the right algorithmic approach, which is exactly what you should be able to do before you sit the real thing.",
    categories: [
      {
        name: "Predict the Output",
        questions: [
          q("A program moves all zeroes in an array to the end while keeping the relative order of the non-zero elements. For the input [4, 0, 5, 3, 0, 9, 1], what is the output?", ["4 5 3 9 1 0 0", "0 0 4 5 3 9 1", "4 5 0 3 9 1 0", "1 9 3 5 4 0 0"], 0, "Easy", "The non-zero elements 4,5,3,9,1 keep their original order and the two zeroes move to the end.", ["Arrays", "Move Zeroes"]),
          q("A program prints the first character of a lowercase string that appears exactly once, or -1 if none exists. For the input \"swiss\", what is printed?", ["s", "w", "i", "-1"], 1, "Easy", "s and s repeat, i appears once but comes after w; w is the first character with a count of exactly 1.", ["Strings", "Frequency Counting"]),
          q("A program counts how many prime numbers are strictly less than N using a sieve. For N = 10, what is the output?", ["2", "3", "4", "5"], 2, "Easy", "The primes strictly less than 10 are 2, 3, 5, 7 - a count of 4.", ["Sieve of Eratosthenes"]),
          q("A child can climb 1 or 2 steps at a time. How many distinct ways are there to climb a 4-step staircase?", ["4", "5", "6", "8"], 1, "Medium", "Ways follow ways(4) = ways(3) + ways(2); enumerating gives exactly 5 (1111, 112, 121, 211, 22).", ["Dynamic Programming", "Staircase"]),
          q("Given the daily prices [7, 1, 5, 3, 6, 4], a program picks one buy day and one later sell day to maximise profit. What is the maximum profit?", ["4", "5", "6", "7"], 1, "Medium", "Buying at 1 and selling at 6 gives a profit of 5, which is the best achievable here.", ["Arrays", "Best Time to Buy and Sell Stock"]),
          q("A string of only ( and ) characters is checked for whether it's balanced using a stack. For the input \"{[()]}\", what does the program report?", ["BALANCED", "NOT BALANCED", "Compile error", "Depends on the language"], 0, "Easy", "Every opening bracket is matched by the correct closing bracket in the correct order, so the stack empties out cleanly.", ["Stack", "Balanced Parentheses"]),
        ],
      },
      {
        name: "Algorithm & Complexity",
        questions: [
          q("What is the time complexity of binary search on a sorted array of n elements?", ["O(1)", "O(log n)", "O(n)", "O(n log n)"], 1, "Easy", "The search space is halved at every step, giving O(log n).", ["Binary Search", "Complexity"]),
          q("What are the average-case time complexities of Quick sort, Merge sort and Bubble sort respectively?", ["O(n log n), O(n log n), O(n^2)", "O(n^2), O(n log n), O(n)", "O(n log n), O(n^2), O(n^2)", "O(n), O(n log n), O(n^2)"], 0, "Medium", "Quick sort and merge sort both average O(n log n); bubble sort is O(n^2) even on average.", ["Sorting", "Complexity"]),
          q("In a binary search tree, which of these is true?", ["Left subtree keys are larger than the root", "Left subtree keys are smaller, right subtree keys are larger than the root", "A BST is always perfectly balanced", "Duplicate keys are required"], 1, "Easy", "This ordering is the BST property; it's also why an inorder traversal of a BST always yields sorted order.", ["Binary Search Tree"]),
          q("Which data structure follows First-In-First-Out (FIFO) order?", ["Stack", "Queue", "Binary Tree", "Graph"], 1, "Easy", "A stack is Last-In-First-Out; a queue is First-In-First-Out.", ["Stack", "Queue"]),
          q("What is the time complexity of extract-min (or extract-max) on a binary heap of n elements?", ["O(1)", "O(log n)", "O(n)", "O(n log n)"], 1, "Medium", "Peeking the min/max is O(1), but removing it and re-heapifying takes O(log n).", ["Heap", "Priority Queue"]),
          q("What distinguishes dynamic programming from plain divide-and-conquer?", ["It always uses recursion", "It stores and reuses results of overlapping subproblems", "It is always solved bottom-up", "It avoids using arrays"], 1, "Medium", "DP needs both optimal substructure and overlapping subproblems, memoising results that plain divide-and-conquer would recompute.", ["Dynamic Programming"]),
        ],
      },
    ],
  },
  {
    name: "Technical & HR Interview Prep", duration: "N/A - interview round",
    description: "Clearing the NQT leads to a combined Technical + Managerial + HR interview - often one video call for Ninja, with deeper technical grilling for Digital/Prime candidates. These questions cover what candidate reports (2019-2026) say actually comes up.",
    categories: [
      {
        name: "OOPs & Programming Concepts",
        questions: [
          q("Which four concepts together make up the pillars of Object-Oriented Programming?", ["Encapsulation, Abstraction, Inheritance, Polymorphism", "Compilation, Linking, Loading, Execution", "Stack, Heap, Queue, Tree", "Class, Object, Method, Variable"], 0, "Easy", "Encapsulation bundles data with behaviour and restricts access; abstraction hides implementation detail; inheritance enables reuse; polymorphism lets one interface take many forms.", ["OOPs"]),
          q("Which statement best describes method overriding (as opposed to overloading)?", ["Same method name, different parameter lists, within the same class", "A subclass redefines a method with the exact same signature as its parent, resolved at runtime", "Any two methods with the same name", "A feature only available in C"], 1, "Medium", "Overloading is compile-time (same class, different parameters); overriding is runtime, resolved via dynamic dispatch in a subclass.", ["OOPs", "Overloading vs Overriding"]),
          q("What is the key difference between malloc and calloc in C?", ["calloc is always faster", "calloc zero-initialises the allocated memory, and also takes count and size as separate arguments", "malloc cannot allocate arrays", "There is no real difference"], 1, "Easy", "malloc leaves memory uninitialised; calloc(n, size) zero-fills it.", ["C Programming", "Memory Management"]),
          q("What happens to a static local variable in C across multiple calls to the function it's declared in?", ["It resets to its initial value every call", "It retains its value between calls", "It is stored on the stack like other locals", "It cannot be initialised"], 1, "Medium", "Static storage duration means it's initialised once and persists for the life of the program, not just one function call.", ["C Programming", "Storage Classes"]),
          q("Ordering JDK, JRE and JVM from broadest to narrowest in scope, which is correct?", ["JDK contains JRE, which contains JVM", "JVM contains JRE, which contains JDK", "All three are identical", "JRE contains both JDK and JVM"], 0, "Easy", "JVM executes bytecode; JRE bundles the JVM with core libraries to run apps; JDK bundles the JRE with a compiler and dev tools to build apps.", ["Java", "JDK vs JRE vs JVM"]),
          q("How is the C++ \"diamond problem\" (ambiguity from multiple inheritance sharing a common ancestor) typically resolved?", ["Using friend classes", "Using virtual inheritance", "Using templates", "Using operator overloading"], 1, "Hard", "Declaring the shared base as a virtual base class ensures only one shared subobject exists, removing the ambiguity.", ["C++", "Inheritance"]),
        ],
      },
      {
        name: "DBMS & CS Core",
        questions: [
          q("How does a primary key differ from a unique key?", ["There is no difference", "A primary key allows exactly one NULL", "A primary key allows no NULLs and there is only one per table", "Unique keys cannot be indexed"], 2, "Easy", "A table can have several unique constraints (which typically allow a NULL), but only one primary key, which never allows NULL.", ["DBMS", "Keys"]),
          q("Which of DELETE, TRUNCATE and DROP removes the table structure itself, not just its rows?", ["DELETE", "TRUNCATE", "DROP", "None of them"], 2, "Easy", "DELETE removes selected rows (and can be rolled back); TRUNCATE quickly clears all rows; DROP removes the table itself entirely.", ["SQL", "DELETE vs TRUNCATE vs DROP"]),
          q("What does the acronym ACID stand for in database transactions?", ["Atomicity, Consistency, Isolation, Durability", "Access, Control, Integrity, Data", "Aggregation, Composition, Inheritance, Delegation", "Authentication, Caching, Indexing, Deletion"], 0, "Medium", "Atomicity (all-or-nothing), Consistency (valid state transitions), Isolation (concurrent transactions don't interfere), Durability (committed data survives crashes).", ["DBMS", "Transactions"]),
          q("Which statement best distinguishes a thread from a process?", ["A thread has its own separate address space, just like a process", "Threads share their parent process's memory but have their own stack and registers, making them cheaper to context-switch", "A process cannot have more than one thread", "There is no meaningful difference"], 1, "Medium", "This shared-memory, separate-execution-state design is exactly why threads are called \"lightweight\" processes.", ["Operating Systems", "Process vs Thread"]),
          q("Which transport-layer protocol is connection-oriented and guarantees reliable, ordered delivery?", ["TCP", "UDP", "IP", "ARP"], 0, "Easy", "TCP adds handshaking, acknowledgement and retransmission for reliability; UDP is connectionless and makes no such guarantee, trading reliability for lower latency.", ["Computer Networks", "TCP vs UDP"]),
          q("Which of these is NOT one of the four necessary conditions for a deadlock?", ["Mutual exclusion", "Hold and wait", "Preemption allowed on held resources", "Circular wait"], 2, "Hard", "Deadlock actually requires NO preemption (resources can't be forcibly taken away) - allowing preemption is precisely one way to break a deadlock, not a condition that causes one.", ["Operating Systems", "Deadlock"]),
        ],
      },
      {
        name: "HR & Behavioral Best Practices",
        questions: [
          q("What is the strongest way to answer \"Why do you want to join TCS?\"", ["Cite specifics - its scale (600k+ employees), the iON platform, Tata Group values", "Say it's a good company with a big brand name", "Say a friend already works there", "Say you heard the interview process is easy"], 0, "Medium", "Generic answers like \"good company, big brand\" are the most commonly reported reason for HR rejection feedback - specifics show real research.", ["HR Interview", "Why TCS"]),
          q("Before a TCS interview, what should you be ready to explain in detail, since interviewers frequently anchor questions on it?", ["Every line of your own resume", "The entire TCS annual report", "Every question from the NQT", "Nothing in particular - it's unpredictable"], 0, "Easy", "TCS interviewers consistently anchor questions on the candidate's own resume, so knowing it thoroughly (including terms you listed) is essential prep.", ["HR Interview", "Resume"]),
          q("TCS's HR round commonly checks a candidate's willingness to accept which condition, tied to Ninja/Digital/Prime offers?", ["Relocating anywhere in India and working night shifts under the standard service agreement", "Working only from their home city", "A four-day work week", "Choosing their own project from day one"], 0, "Medium", "Recurring HR questions specifically probe openness to relocation, night shifts, and the multi-year service agreement.", ["HR Interview"]),
          q("How long should a well-prepared \"tell me about your project\" pitch ideally run, according to common interview advice?", ["10 seconds", "90 seconds, with one concrete metric", "10 minutes", "As long as the interviewer allows, with no real limit"], 1, "Easy", "A tight, roughly 90-second pitch that includes one measurable outcome keeps the answer focused and memorable.", ["HR Interview", "Project Pitch"]),
          q("If asked to explain an academic backlog or education gap, what's the best approach?", ["Explain it honestly and briefly, then pivot to what you learned or how you improved afterward", "Avoid the topic entirely and change the subject", "Blame the institution or a specific teacher", "Deny that it happened"], 0, "Medium", "A brief, honest explanation followed by a positive pivot reads as maturity; evasion or blame reads as a red flag.", ["HR Interview"]),
          q("What is the best structure for answering a behavioral question like \"tell me about a time you worked under pressure\"?", ["Situation, Task, Action, Result (STAR)", "A single-word answer", "A generic list of your skills with no example", "Politely ask to skip the question"], 0, "Easy", "The STAR structure (Situation, Task, Action, Result) gives a concrete, complete answer that behavioral interviewers are specifically listening for.", ["HR Interview", "Behavioral Questions"]),
        ],
      },
    ],
  },
];

const existing = await db.collection("companies").where("name", "==", "TCS").get();
if (!existing.empty) {
  console.log(`"TCS" already exists (${existing.docs[0].id}) - skipping creation.`);
  process.exit(0);
}

const companyRef = await db.collection("companies").add({
  name: "TCS",
  ctc: "3.36 - 11.5 LPA (Ninja to Prime)",
  difficulty: "Medium",
  description: "India's largest IT services company by headcount, part of the Tata Group and a Fortune 500 firm. Hires through the centralised National Qualifier Test (NQT) on TCS iON, with three package tiers - Ninja, Digital and Prime - decided by one Integrated Test Pattern (ITP) score.",
  eligibility: "B.E./B.Tech/M.E./M.Tech/MCA/M.Sc across all streams. Minimum 60% or 6 CGPA throughout Class 10, Class 12, UG and PG, with no standing backlogs at the time of application or joining.",
  hiringOverview: "The ITP runs 190 minutes: Part A Foundation (75 min, 65 questions - Numerical 20 / Verbal 25 / Reasoning 20) decides the Ninja band. Part B Advanced (115 min - 15 aptitude questions in 25 min, then 2 coding problems in 90 min) decides upgrades to Digital and Prime. No negative marking, no backward navigation. Clearing the NQT leads to a combined Technical + Managerial + HR interview.",
  resources: [],
  status: "published",
  order: 1,
  createdAt: admin.firestore.FieldValue.serverTimestamp(),
  createdBy: "devert.contact@gmail.com",
});

let roundCount = 0, categoryCount = 0, questionCount = 0;
for (let ri = 0; ri < ROUNDS.length; ri++) {
  const round = ROUNDS[ri];
  const roundRef = await companyRef.collection("rounds").add({
    name: round.name, description: round.description, duration: round.duration, order: ri,
  });
  roundCount++;
  for (let ci = 0; ci < round.categories.length; ci++) {
    const category = round.categories[ci];
    const categoryRef = await roundRef.collection("categories").add({ name: category.name, order: ci });
    categoryCount++;
    for (let qi = 0; qi < category.questions.length; qi++) {
      await categoryRef.collection("questions").add({ ...category.questions[qi], order: qi });
      questionCount++;
    }
  }
}

console.log(`Seeded "TCS" (${companyRef.id}): ${roundCount} rounds, ${categoryCount} categories, ${questionCount} questions.`);
