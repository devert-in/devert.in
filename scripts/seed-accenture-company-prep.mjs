import admin from "firebase-admin";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(join(__dirname, "service-account.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// Company Prep - Accenture. Matches the exact companies/{id}/rounds/{id}/
// categories/{id}/questions/{id} MCQ schema used by Cognizant/Deloitte/TCS/
// Infosys (see lib/companyPrep.js). Source: the user-provided "Get Placed at
// Accenture" guide (NLT structure, section breakdown, eligibility, salary
// bands) - every question here is still original, pattern-based practice
// (not copied from any leaked/verified question bank), so none of it is
// labelled "memory-based." Round 4 (Technical Assessment) deliberately adds
// a Databases/Cloud/Networking category, since the source guide calls that
// out as a distinct, Accenture-specific section the other four companies'
// scripts don't cover. Seeded as status: "draft" (Cognizant/Infosys
// convention for unreviewed fresh content) - flip it from the admin panel
// once spot-checked.

function q(question, options, correctIndex, difficulty, explanation, tags) {
  return { question, options, correctIndex, difficulty, marks: 1, explanation, tags, attemptCount: 0, correctCount: 0, totalTimeSec: 0 };
}

const ROUNDS = [
  {
    name: "Quantitative Aptitude", duration: "~30 minutes",
    description: "Part of the Cognitive Assessment section of the NLT (National Level Test) - this section has its own independent cut-off, so it can't be skipped in favour of a stronger section.",
    categories: [
      {
        name: "Percentages, Profit & Loss and Interest",
        questions: [
          q("A shopkeeper buys an item for Rs. 1,200 and sells it at a 20% profit. What is the selling price?", ["1380", "1400", "1440", "1460"], 2, "Easy", "1200 x 1.20 = 1440.", ["Percentages", "Profit & Loss"]),
          q("By selling a fan for Rs. 1,150, a shopkeeper incurs a loss of 8%. What was the cost price?", ["1200", "1225", "1250", "1275"], 2, "Medium", "CP = 1150 / (1 - 0.08) = 1150 / 0.92 = 1250.", ["Profit & Loss"]),
          q("A shopkeeper marks goods 50% above cost price and then gives a 20% discount. What is his profit percent?", ["10%", "15%", "20%", "25%"], 2, "Medium", "1.50 x 0.80 = 1.20, a net 20% profit.", ["Profit & Loss", "Discounts"]),
          q("What is the compound interest on Rs. 8,000 for 2 years at 5% per annum, compounded annually?", ["780", "800", "820", "840"], 2, "Medium", "CI = 8000 x (1.05^2 - 1) = 8000 x 0.1025 = 820.", ["Compound Interest"]),
          q("A sum doubles itself in 8 years at simple interest. What is the annual rate of interest?", ["10%", "12.5%", "15%", "20%"], 1, "Medium", "Amount = 2P means interest earned = P; rate = (P x 100) / (P x 8) = 12.5%.", ["Simple Interest"]),
          q("The price of rice increases by 25%. By what percent should a family reduce its consumption to keep expenditure unchanged?", ["15%", "20%", "25%", "30%"], 1, "Easy", "Required reduction = 25 / 125 = 20%.", ["Percentages"]),
        ],
      },
      {
        name: "Time, Speed, Distance & Work",
        questions: [
          q("A can finish a task in 15 days, B in 10 days. Working together, how many days will they take?", ["5 days", "6 days", "7 days", "8 days"], 1, "Easy", "1/15 + 1/10 = 1/6, so together they take 6 days.", ["Time & Work"]),
          q("A train 180 m long running at 72 km/h crosses a platform in 15 seconds. What is the length of the platform?", ["100 m", "110 m", "120 m", "130 m"], 2, "Medium", "72 km/h = 20 m/s; total distance covered = 300 m; platform = 300 - 180 = 120 m.", ["Time, Speed & Distance"]),
          q("Two trains, 100 m and 150 m long, run in opposite directions at 54 km/h and 36 km/h. How long do they take to cross each other?", ["8 s", "9 s", "10 s", "12 s"], 2, "Medium", "Relative speed = 90 km/h = 25 m/s; total length = 250 m; time = 250/25 = 10 s.", ["Time, Speed & Distance"]),
          q("18 workers can complete a project in 24 days. How many workers are needed to finish it in 16 days?", ["24", "25", "27", "30"], 2, "Medium", "18 x 24 = 432 worker-days; 432/16 = 27 workers.", ["Time & Work"]),
          q("A boat's speed in still water is 15 km/h, and the current flows at 5 km/h. How long does it take to travel 40 km upstream?", ["3 h", "3.5 h", "4 h", "4.5 h"], 2, "Easy", "Upstream speed = 15 - 5 = 10 km/h; time = 40/10 = 4 hours.", ["Time, Speed & Distance"]),
          q("Pipe A fills a tank in 8 hours, pipe B in 12 hours, and pipe C (an outlet) empties it in 24 hours. If all three run together, how long will it take to fill the tank?", ["5 hours", "6 hours", "7 hours", "8 hours"], 1, "Hard", "1/8 + 1/12 - 1/24 = 4/24 = 1/6, so the tank fills in 6 hours.", ["Time & Work", "Pipes & Cisterns"]),
        ],
      },
      {
        name: "Number System, Averages & Ratios",
        questions: [
          q("What is the sum of the first 25 natural numbers?", ["300", "315", "325", "335"], 2, "Easy", "n(n+1)/2 = 25 x 26 / 2 = 325.", ["Number System"]),
          q("Find the unit digit of 8^37.", ["2", "4", "6", "8"], 3, "Medium", "Powers of 8 cycle 8, 4, 2, 6 (period 4); 37 mod 4 = 1, so the unit digit is 8.", ["Number System"]),
          q("The average of 7 consecutive integers is 20. What is the largest number?", ["21", "22", "23", "24"], 2, "Medium", "For 7 evenly-spaced integers the average equals the middle (4th) one, 20; the largest is 20 + 3 = 23.", ["Averages"]),
          q("Two numbers are in the ratio 4:7. If their sum is 121, what is the smaller number?", ["40", "44", "48", "52"], 1, "Easy", "4x + 7x = 121, so x = 11 and the smaller number is 4x = 44.", ["Ratio & Proportion"]),
          q("The average age of 10 employees increases by 2 years when a new employee replaces one aged 35. What is the age of the new employee?", ["45", "50", "55", "60"], 2, "Medium", "Total age increases by 10 x 2 = 20, so the new employee is 35 + 20 = 55 years old.", ["Averages"]),
          q("What is the least number that must be added to 2143 so the sum is exactly divisible by 12?", ["3", "4", "5", "6"], 2, "Medium", "2143 mod 12 = 7 (2136 is the nearest multiple below), so adding 5 gives 2148, divisible by 12.", ["Number System"]),
        ],
      },
    ],
  },
  {
    name: "Logical Reasoning", duration: "~30 minutes",
    description: "The other half of the Cognitive Assessment - series, coding-decoding and blood relations are the most frequently repeated question types.",
    categories: [
      {
        name: "Series, Coding-Decoding & Blood Relations",
        questions: [
          q("Find the next number in the series: 3, 8, 15, 24, 35, ?", ["42", "46", "48", "50"], 2, "Easy", "The differences are 5, 7, 9, 11, 13, so the next term is 35 + 13 = 48.", ["Number Series"]),
          q("If GARDEN is coded as HBSEFO (each letter shifted forward by 1), how is FLOWER coded in the same scheme?", ["GMPXFS", "GMPXFT", "GNPXFS", "GMQXFS"], 0, "Medium", "Shifting each letter forward by 1: F-G, L-M, O-P, W-X, E-F, R-S gives GMPXFS.", ["Coding-Decoding"]),
          q("Pointing to a photograph, a man said, 'The father of her brother is my father's only son.' How is the woman in the photograph related to the man?", ["Daughter", "Sister", "Wife", "Niece"], 0, "Medium", "'My father's only son' is the man himself, so he is the father of her brother - meaning he is her father too, making her his daughter.", ["Blood Relations"]),
          q("If TRAIN is coded as WUDLQ (each letter shifted forward by 3), how is METRO coded in the same scheme?", ["PHWUR", "PHWUS", "PGWUR", "PHXUR"], 0, "Easy", "Shifting each letter forward by 3: M-P, E-H, T-W, R-U, O-R gives PHWUR.", ["Coding-Decoding"]),
          q("Find the odd one out among: 25, 36, 45, 64.", ["25", "36", "45", "64"], 2, "Easy", "25, 36 and 64 are perfect squares (5^2, 6^2, 8^2); 45 is not.", ["Number Series", "Classification"]),
          q("A is the mother of B. C is B's son. D is C's father. How is A related to D?", ["Mother-in-law", "Grandmother", "Aunt", "Sister-in-law"], 0, "Medium", "D is B's spouse (as C's father while B is C's parent), and A is B's mother - making A the mother-in-law of D.", ["Blood Relations"]),
        ],
      },
      {
        name: "Puzzles, Direction Sense & Seating",
        questions: [
          q("A man walks 8 km south, then turns right and walks 6 km. How far is he from his starting point?", ["8 km", "9 km", "10 km", "12 km"], 2, "Easy", "Turning right while facing south means walking west; the two legs (8 km, 6 km) form a right angle, so the distance is sqrt(8^2 + 6^2) = 10 km.", ["Direction Sense"]),
          q("In a row of 25 students facing north, Ravi is 9th from the left and Sita is 11th from the right. How many students are seated between them?", ["4", "5", "6", "7"], 1, "Medium", "Sita's position from the left is 25 - 11 + 1 = 15. Between position 9 and position 15, there are 5 students (positions 10-14).", ["Seating in a Row"]),
          q("A person facing north turns 90 degrees clockwise, then 90 degrees clockwise again, then 180 degrees. Which direction is he facing now?", ["North", "South", "East", "West"], 0, "Medium", "Using degrees (N=0, E=90, S=180, W=270): 0 + 90 + 90 + 180 = 360, which is the same as 0 - North.", ["Direction Sense"]),
          q("Priya is taller than Rohit but shorter than Ankit. Ankit is shorter than Vikram. Who is the shortest?", ["Priya", "Rohit", "Ankit", "Vikram"], 1, "Easy", "The order is Vikram > Ankit > Priya > Rohit, so Rohit is the shortest.", ["Ordering & Comparison"]),
          q("Six friends P-U sit around a circular table facing the centre. Q sits immediately right of P. T sits immediately left of P. R sits directly opposite P. Who sits directly opposite Q?", ["S", "U", "R", "Cannot be determined"], 3, "Hard", "This fixes P, Q, T and R's seats, but leaves S and U's seats (including the one opposite Q) unassigned between the two of them - it cannot be determined from the given information.", ["Circular Arrangement"]),
          q("A man walks 12 km east, turns left and walks 5 km, then turns left again and walks 12 km. How far and in which direction is he from his starting point?", ["5 km North", "5 km South", "17 km North", "0 km (back to start)"], 0, "Medium", "The two 12 km east/west legs cancel out, leaving only the 5 km northward leg as the net displacement.", ["Direction Sense"]),
        ],
      },
      {
        name: "Syllogisms & Statement-Conclusion",
        questions: [
          q("Statements: All laptops are electronic devices. All electronic devices need power. Conclusions: I. All laptops need power. II. Some devices that need power are laptops.", ["Only I follows", "Only II follows", "Both I and II follow", "Neither follows"], 2, "Easy", "Laptops are a subset of electronic devices, which are a subset of things needing power, so I follows; since laptops exist, II also follows.", ["Syllogisms"]),
          q("Statements: Some engineers are managers. All managers are graduates. Conclusions: I. Some engineers are graduates. II. All graduates are managers.", ["Only I follows", "Only II follows", "Both follow", "Neither follows"], 0, "Medium", "I follows validly (some engineers are managers, all managers are graduates, so some engineers are graduates); II does not, since graduates could include non-managers.", ["Syllogisms"]),
          q("Statement: 'Only employees with an ID card will be allowed inside the office.' Conclusion I: Everyone with an ID card will be allowed inside. Conclusion II: No one without an ID card will be allowed inside.", ["Only I follows", "Only II follows", "Both follow", "Neither follows"], 1, "Medium", "'Only' marks having an ID card as a necessary, not sufficient, condition - so I does not follow, but II (the contrapositive) does.", ["Statement-Conclusion"]),
          q("Statements: All pens are instruments. No instrument is a toy. Conclusions: I. No pen is a toy. II. Some instruments are pens.", ["Only I follows", "Only II follows", "Both follow", "Neither follows"], 2, "Medium", "Since pens are a subset of instruments and instruments share nothing with toys, no pen is a toy (I); and since pens exist, some instruments are pens (II).", ["Syllogisms"]),
          q("Statement: 'If the server crashes, the website goes offline.' Conclusion I: The server did not crash, so the website did not go offline. Conclusion II: The website did not go offline, so the server did not crash.", ["Only I follows", "Only II follows", "Both follow", "Neither follows"], 1, "Hard", "Conclusion I denies the antecedent, which is not logically valid; Conclusion II is the contrapositive of the original statement, which is always valid.", ["Statement-Conclusion"]),
          q("Statements: Some doctors are professors. Some professors are authors. Conclusion: Some doctors are authors.", ["Follows", "Does not follow", "Follows only if the group sizes are equal", "Cannot be determined without more data"], 1, "Medium", "Two particular ('some') premises can never validly yield a conclusion in syllogistic logic - this is a classic invalid form.", ["Syllogisms"]),
        ],
      },
    ],
  },
  {
    name: "Verbal Ability & Communication", duration: "~30 minutes",
    description: "Covers both the Cognitive Assessment's verbal section and the separate Communication Assessment - candidate reports consistently flag communication as the section strong coders most often underestimate, since it has its own independent cut-off.",
    categories: [
      {
        name: "Vocabulary, Synonyms & Antonyms",
        questions: [
          q("Choose the word closest in meaning to 'DILIGENT':", ["Hardworking", "Lazy", "Careless", "Arrogant"], 0, "Easy", "DILIGENT describes someone who works with care and sustained effort.", ["Synonyms"]),
          q("Choose the antonym of 'GENEROUS':", ["Charitable", "Stingy", "Kind", "Liberal"], 1, "Easy", "GENEROUS means freely giving; its opposite is STINGY.", ["Antonyms"]),
          q("Choose the word closest in meaning to 'CANDID':", ["Frank and honest", "Deceptive", "Confused", "Timid"], 0, "Medium", "CANDID means open and truthful in expression.", ["Synonyms"]),
          q("Choose the antonym of 'TRANSPARENT' (as in 'easily understood'):", ["Clear", "Obscure", "Visible", "Plain"], 1, "Medium", "The opposite of easily understood is OBSCURE.", ["Antonyms"]),
          q("Choose the word closest in meaning to 'METICULOUS':", ["Careful and precise", "Careless", "Hasty", "Indifferent"], 0, "Medium", "METICULOUS describes great attention to detail.", ["Synonyms"]),
          q("Choose the antonym of 'ABUNDANT':", ["Plentiful", "Scarce", "Ample", "Copious"], 1, "Easy", "ABUNDANT means present in large quantity; its opposite is SCARCE.", ["Antonyms"]),
        ],
      },
      {
        name: "Error Spotting, Correction & Fill in the Blanks",
        questions: [
          q("Identify the error: 'Neither of the answers are correct.'", ["\"Neither\" is wrong", "\"are\" should be \"is\"", "\"answers\" is wrong", "No error"], 1, "Medium", "'Neither' is a singular subject and takes the singular verb 'is', not 'are'.", ["Error Spotting"]),
          q("Fill in the blank: 'She has worked at this company ____ five years.'", ["since", "for", "from", "during"], 1, "Easy", "'For' is used with a duration of time; 'since' is used with a specific starting point.", ["Prepositions"]),
          q("Choose the grammatically correct sentence:", ["He don't know the answer.", "He doesn't knows the answer.", "He doesn't know the answer.", "He not know the answer."], 2, "Easy", "'Doesn't' already carries the third-person singular, so the main verb stays in its base form.", ["Sentence Correction"]),
          q("Identify the error: 'Each of the employees have submitted their report.'", ["\"Each\" is wrong", "\"have\" should be \"has\"", "\"report\" is wrong", "No error"], 1, "Medium", "'Each' is a singular subject and takes the singular verb 'has', not 'have'.", ["Error Spotting"]),
          q("Fill in the blank: 'The manager, along with his team, ____ attending the meeting.'", ["is", "are", "were", "have been"], 0, "Medium", "A phrase starting with 'along with' doesn't change the subject's number - the subject remains the singular 'manager', so 'is' is correct.", ["Subject-Verb Agreement"]),
          q("Choose the correctly punctuated sentence:", ["Its raining outside, isnt it", "It's raining outside, isn't it?", "Its' raining outside, isn't it.", "It is raining outside isn't it?"], 1, "Easy", "'It's' (it is) and 'isn't' (is not) both need apostrophes, and the sentence needs a question mark.", ["Punctuation"]),
        ],
      },
      {
        name: "Reading Comprehension & Para Jumbles",
        questions: [
          q("Passage: 'Cloud computing lets businesses rent computing power instead of owning physical servers, reducing upfront costs but introducing new dependencies on network reliability and vendor uptime.' According to the passage, what does cloud computing reduce?", ["Network dependency", "Upfront hardware costs", "Vendor uptime", "The need for the internet"], 1, "Easy", "The passage explicitly states cloud computing reduces upfront costs by renting rather than owning servers.", ["Reading Comprehension"]),
          q("Passage: 'Effective communication in the workplace depends not just on clarity of speech but on active listening - restating what was heard to confirm understanding before responding.' What does the passage say effective communication depends on, besides clarity?", ["Speaking loudly", "Active listening and confirming understanding", "Using formal vocabulary", "Avoiding questions"], 1, "Easy", "The passage names active listening and confirming understanding as the other key ingredient.", ["Reading Comprehension"]),
          q("Arrange into a coherent paragraph: P. This eventually improved customer satisfaction scores significantly. Q. The company initially received frequent complaints about slow response times. R. As a result, resolution times dropped sharply. S. Management then introduced a dedicated support team to handle escalations.", ["Q-S-R-P", "Q-R-S-P", "S-Q-R-P", "Q-S-P-R"], 0, "Medium", "The logical flow is: complaints arise (Q) -> a support team is introduced (S) -> resolution times drop (R) -> satisfaction improves (P).", ["Para-jumbles"]),
          q("Passage: 'A well-structured resume highlights measurable achievements rather than listing responsibilities, since quantified impact is what recruiters scan for first.' What should a well-structured resume highlight, per the passage?", ["A long list of responsibilities", "Measurable, quantified achievements", "Personal hobbies", "Every past job in exhaustive detail"], 1, "Easy", "The passage states recruiters scan for quantified impact, not a list of duties.", ["Reading Comprehension"]),
          q("Arrange logically: P. The team then validated the fix in a staging environment. Q. A critical defect was found during testing. R. Developers rolled back the release. S. Once confirmed stable, the fix was deployed to production.", ["Q-R-P-S", "Q-P-R-S", "R-Q-P-S", "Q-R-S-P"], 0, "Medium", "The events happen in this order: a defect is found (Q), the release is rolled back (R), the fix is validated in staging (P), then deployed once stable (S).", ["Para-jumbles"]),
          q("Passage: 'While automation increases efficiency, over-reliance on it without human oversight can let errors propagate undetected across a system.' What risk does the passage highlight about automation?", ["It is always inaccurate", "Errors can propagate undetected without human oversight", "It eliminates the need for testing", "It is illegal in most industries"], 1, "Medium", "The passage's stated risk is specifically errors propagating undetected without human oversight.", ["Reading Comprehension"]),
        ],
      },
    ],
  },
  {
    name: "Technical Assessment", duration: "~30 minutes",
    description: "The NLT's Technical Assessment section - programming MCQs, pseudocode, fundamentals of programming, plus basics of databases, cloud and networking and common applications like MS Office.",
    categories: [
      {
        name: "Pseudocode Dry Runs",
        questions: [
          q("Pseudocode: SET total = 0; FOR i = 1 TO 6: total = total + i; PRINT total. What is printed?", ["15", "18", "21", "24"], 2, "Easy", "total = 1+2+3+4+5+6 = 21.", ["Pseudocode"]),
          q("Pseudocode: SET x = 8; IF x > 5 THEN x = x - 2 ELSE x = x + 2; IF x > 5 THEN x = x * 3; PRINT x. What is printed?", ["6", "12", "18", "24"], 2, "Medium", "8 > 5, so x becomes 6; then 6 > 5, so x becomes 18.", ["Pseudocode"]),
          q("Pseudocode: SET a = 3, b = 2; WHILE a < 30: a = a * b; PRINT a. What is the final printed value of a?", ["24", "36", "48", "54"], 2, "Medium", "a goes 3 -> 6 -> 12 -> 24 -> 48; once a reaches 48 the condition a < 30 is false and the loop stops, so 48 is printed.", ["Pseudocode", "Loops"]),
          q("Pseudocode: FUNCTION factorial(n): IF n <= 1 RETURN 1; ELSE RETURN n * factorial(n-1). What does factorial(6) return?", ["120", "360", "720", "840"], 2, "Easy", "factorial(6) = 6x5x4x3x2x1 = 720.", ["Pseudocode", "Recursion"]),
          q("Pseudocode: SET arr = [12, 4, 9, 21, 7]; SET min = arr[0]; FOR each element e IN arr: IF e < min THEN min = e; PRINT min. What is printed?", ["4", "7", "9", "12"], 0, "Easy", "The loop tracks the running minimum, which ends up as 4.", ["Pseudocode", "Arrays"]),
          q("Pseudocode: SET count = 0; FOR i = 1 TO 15: IF i MOD 4 == 0 THEN count = count + 1; PRINT count. What is printed?", ["2", "3", "4", "5"], 1, "Medium", "The multiples of 4 between 1 and 15 are 4, 8 and 12 - a count of 3.", ["Pseudocode"]),
        ],
      },
      {
        name: "Programming Fundamentals & Data Structures Basics",
        questions: [
          q("Which data structure uses First-In-First-Out (FIFO) ordering?", ["Stack", "Queue", "Tree", "Graph"], 1, "Easy", "A queue removes the earliest-added element first, which is FIFO ordering.", ["Data Structures", "Queue"]),
          q("What is the time complexity of searching for an element in an unsorted array of n elements?", ["O(1)", "O(log n)", "O(n)", "O(n^2)"], 2, "Easy", "Without any ordering to exploit, every element may need to be checked in the worst case.", ["Data Structures", "Complexity"]),
          q("Which of the following best describes a pointer/reference variable?", ["A variable that stores the memory address of another variable", "A variable that can only store integers", "A variable exclusive to loops", "A type of array"], 0, "Easy", "A pointer holds the address of another variable rather than a value directly.", ["Programming Fundamentals"]),
          q("In a doubly linked list, what is the main advantage over a singly linked list?", ["It uses less memory per node", "It allows traversal in both forward and backward directions", "It cannot have a null pointer", "It is always sorted"], 1, "Medium", "Each node's extra 'previous' pointer is exactly what enables backward traversal, at the cost of a little extra memory.", ["Data Structures", "Linked List"]),
          q("What distinguishes a compiler from an interpreter?", ["A compiler translates the whole program before execution; an interpreter executes line by line", "A compiler only works with low-level languages", "There is no real difference", "An interpreter always compiles to machine code first"], 0, "Medium", "Compilers translate the entire source upfront; interpreters execute source statements one at a time.", ["Programming Fundamentals"]),
          q("What is recursion, and what must every correct recursive function have?", ["A function calling itself, with a base case to stop the recursion", "A loop disguised as a function", "A function that cannot return a value", "A function that only works on arrays"], 0, "Easy", "Without a base case, a recursive function would call itself indefinitely.", ["Programming Fundamentals", "Recursion"]),
        ],
      },
      {
        name: "Databases, Cloud & Networking Basics",
        questions: [
          q("Which SQL keyword is used to remove duplicate rows from a result set?", ["UNIQUE", "DISTINCT", "REMOVE", "FILTER"], 1, "Easy", "SELECT DISTINCT returns only unique rows from the result.", ["SQL"]),
          q("What does the acronym ACID stand for in database transactions?", ["Atomicity, Consistency, Isolation, Durability", "Access, Control, Integrity, Data", "Aggregation, Composition, Inheritance, Delegation", "Authentication, Caching, Indexing, Deletion"], 0, "Medium", "Atomicity (all-or-nothing), Consistency (valid state transitions), Isolation (concurrent transactions don't interfere), Durability (committed data survives crashes).", ["DBMS", "Transactions"]),
          q("In cloud computing, what does 'IaaS' stand for?", ["Infrastructure as a Service", "Internet as a Service", "Integration as a Service", "Information as a Service"], 0, "Easy", "IaaS provides virtualised computing infrastructure - servers, storage and networking - over the internet.", ["Cloud Computing"]),
          q("Which of these best describes the difference between public, private, and hybrid cloud?", ["Public cloud is shared infrastructure open to multiple customers; private cloud is dedicated to one organisation; hybrid combines both", "They are all identical, just marketing terms", "Private cloud is always cheaper than public cloud", "Hybrid cloud means no cloud provider is involved"], 0, "Medium", "The distinction is about who the infrastructure is shared with, not price or provider involvement.", ["Cloud Computing"]),
          q("What is the primary purpose of DNS (Domain Name System) in networking?", ["Encrypting network traffic", "Translating domain names into IP addresses", "Assigning MAC addresses to devices", "Managing firewall rules"], 1, "Easy", "DNS resolves human-readable domain names like example.com into the IP addresses computers use to connect.", ["Computer Networks"]),
          q("Which transport-layer protocol is connectionless and does not guarantee delivery, favouring lower latency over reliability?", ["TCP", "UDP", "HTTP", "FTP"], 1, "Medium", "UDP skips handshaking and acknowledgement for lower overhead, trading reliability for speed.", ["Computer Networks"]),
        ],
      },
    ],
  },
  {
    name: "Coding Assessment (MCQ)", duration: "N/A - concept check",
    description: "Accenture's real Coding Assessment is two written problems solved and submitted as actual code in C, C++, Java or Python - this round instead checks whether you can predict a correct program's output and reason about the right algorithmic approach, which is exactly what you should be able to do before you sit the real thing.",
    categories: [
      {
        name: "Predict the Output",
        questions: [
          q("A program removes all duplicate elements from an array while preserving the first occurrence's order. For the input [4, 2, 4, 5, 2, 8], what is the output?", ["4 2 5 8", "2 4 5 8", "4 2 4 5 8", "8 5 4 2"], 0, "Easy", "Each value's first occurrence (4, 2, 5, 8) is kept in its original order; later repeats are dropped.", ["Arrays", "Deduplication"]),
          q("A program checks whether a string is a palindrome, ignoring case. For the input \"MadaM\", what does it print?", ["PALINDROME", "NOT A PALINDROME", "Compile error", "Depends on the language"], 0, "Easy", "Case-insensitively, \"madam\" reads the same forwards and backwards.", ["Strings", "Palindrome"]),
          q("A program counts the vowels in a string. For the input \"Accenture\", what is the output?", ["3", "4", "5", "6"], 1, "Medium", "The vowels in Accenture are A, e, u, e - a count of 4.", ["Strings", "Frequency Counting"]),
          q("A program computes N factorial iteratively. For N = 0, what should a correctly written program output?", ["0", "1", "Error", "Undefined"], 1, "Medium", "0! is defined as 1, the standard base case for factorial.", ["Recursion", "Base Cases"]),
          q("Given the array [2, 7, 11, 15] and a target sum of 9, a program finds the indices of the two numbers that add up to the target. What indices does it return?", ["0 and 1", "1 and 2", "0 and 3", "2 and 3"], 0, "Easy", "arr[0] + arr[1] = 2 + 7 = 9, matching the target.", ["Arrays", "Two Sum"]),
          q("A program uses a stack to check whether the brackets in \"([{}])\" are balanced. What does it report?", ["BALANCED", "NOT BALANCED", "Compile error", "Depends on the language"], 0, "Easy", "Every opening bracket is matched by the correct closing bracket in the correct order, so the stack empties out cleanly.", ["Stack", "Balanced Parentheses"]),
        ],
      },
      {
        name: "Algorithm & Complexity",
        questions: [
          q("What is the time complexity of binary search on a sorted array of n elements?", ["O(1)", "O(log n)", "O(n)", "O(n log n)"], 1, "Easy", "The search space is halved at every step, giving O(log n).", ["Binary Search", "Complexity"]),
          q("What are the worst-case time complexities of Quick sort and Merge sort respectively?", ["O(n^2), O(n log n)", "O(n log n), O(n^2)", "O(n log n), O(n log n)", "O(n), O(n)"], 0, "Medium", "Quick sort degrades to O(n^2) on already-sorted or adversarial input; Merge sort's divide-and-conquer structure guarantees O(n log n) regardless of input.", ["Sorting", "Complexity"]),
          q("Which data structure is most naturally suited to implement a Last-In-First-Out undo feature?", ["Queue", "Stack", "Array", "Graph"], 1, "Easy", "Undo naturally reverses the most recent action first, which is exactly LIFO behaviour.", ["Stack"]),
          q("What is the space complexity of an iterative (non-recursive) factorial function?", ["O(1)", "O(n)", "O(n^2)", "O(log n)"], 0, "Medium", "An iterative version uses a fixed number of variables regardless of n, unlike a recursive version's call stack.", ["Complexity", "Recursion vs Iteration"]),
          q("In a min-heap, where is the smallest element always located?", ["At the root", "At the last leaf", "At a random position", "At the middle of the array"], 0, "Easy", "The min-heap property guarantees the smallest element is always at the root.", ["Heap", "Priority Queue"]),
          q("What distinguishes dynamic programming from plain recursion?", ["It always avoids using functions", "It stores and reuses results of overlapping subproblems instead of recomputing them", "It only works on strings", "It never has a base case"], 1, "Medium", "DP needs both optimal substructure and overlapping subproblems, memoising results that plain recursion would recompute.", ["Dynamic Programming"]),
        ],
      },
    ],
  },
  {
    name: "Technical + HR Interview Prep", duration: "N/A - interview round",
    description: "Clearing the NLT leads to a Technical Interview (DSA, SQL/DBMS, OOP, and a deep discussion of your project) and then an HR Interview (behavioural fit, relocation/shift flexibility, and compensation) - the whole process usually takes 2-4 weeks.",
    categories: [
      {
        name: "OOPs, Java & DBMS/SQL",
        questions: [
          q("Which four concepts together form the pillars of Object-Oriented Programming?", ["Encapsulation, Abstraction, Inheritance, Polymorphism", "Compilation, Linking, Loading, Execution", "Class, Object, Method, Variable", "Stack, Heap, Queue, Tree"], 0, "Easy", "These four concepts together form the foundation of OOP design.", ["OOPs"]),
          q("In Java, which keyword prevents a variable from being reassigned after initialization?", ["static", "final", "private", "abstract"], 1, "Easy", "A variable declared 'final' can only be assigned once.", ["Java"]),
          q("What is method overloading, and how does it differ from overriding?", ["Same method name with different parameter lists in the same class (compile-time); overriding redefines a parent method in a subclass (runtime)", "They mean exactly the same thing", "Overloading only happens in constructors", "Overriding is only possible in interfaces"], 0, "Medium", "Overloading is resolved at compile time based on parameter types/count; overriding is resolved at runtime via dynamic dispatch.", ["Java", "OOPs"]),
          q("Which SQL JOIN returns only the rows that have matching values in both tables?", ["LEFT JOIN", "RIGHT JOIN", "INNER JOIN", "FULL OUTER JOIN"], 2, "Easy", "An INNER JOIN keeps only rows with a match on both sides.", ["SQL"]),
          q("What is the purpose of a primary key in a relational database table?", ["To uniquely identify each row, and it never allows NULLs", "To allow duplicate rows", "To store the largest value in a table", "To encrypt sensitive columns"], 0, "Easy", "A primary key guarantees uniqueness and non-nullability for every row.", ["DBMS", "Keys"]),
          q("What does database normalization primarily aim to reduce?", ["Query execution time only", "Data redundancy and update anomalies", "The number of tables", "The need for indexes"], 1, "Medium", "Normalization organizes data to minimize redundancy and the anomalies that come with it.", ["DBMS"]),
        ],
      },
      {
        name: "Operating Systems & Computer Networks",
        questions: [
          q("What is a deadlock in an operating system?", ["A process that never terminates", "A situation where two or more processes wait indefinitely for resources held by each other", "A crash caused by a missing driver", "A type of memory leak"], 1, "Easy", "A deadlock is a circular wait where no involved process can make progress.", ["Operating Systems"]),
          q("What is the main purpose of virtual memory?", ["To let programs use more memory than physically available, using disk as an extension", "To make the CPU run at a higher clock speed", "To eliminate the need for RAM", "To speed up network requests"], 0, "Medium", "Virtual memory pages data to and from disk so programs can address more memory than physically installed.", ["Operating Systems"]),
          q("Which scheduling algorithm assigns the CPU to whichever process arrived first, run to completion?", ["Round Robin", "First-Come-First-Served (FCFS)", "Priority Scheduling", "Shortest Job Next"], 1, "Easy", "FCFS processes requests strictly in arrival order with no preemption.", ["Operating Systems"]),
          q("What is the key difference between a process and a thread?", ["A process has its own separate memory space; threads within a process share memory but have their own stack", "A thread always outlives its parent process", "A process cannot have more than one thread", "There is no real difference"], 0, "Medium", "This shared-memory, separate-execution-state design is exactly why threads are called 'lightweight' processes.", ["Operating Systems", "Process vs Thread"]),
          q("Which protocol is responsible for reliable, ordered, connection-oriented delivery of data over a network?", ["UDP", "TCP", "ARP", "ICMP"], 1, "Easy", "TCP adds handshaking, ordering and retransmission to guarantee reliable delivery.", ["Computer Networks"]),
          q("What does a firewall primarily do?", ["Filters network traffic based on defined security rules", "Speeds up internet connections", "Compresses files for storage", "Translates domain names to IP addresses"], 0, "Easy", "A firewall inspects and allows/blocks traffic according to configured security rules.", ["Computer Networks"]),
        ],
      },
      {
        name: "HR & Behavioral Best Practices",
        questions: [
          q("What is the strongest way to answer 'Why do you want to join Accenture?'", ["Cite specifics - its scale, global project exposure, learning/certification culture, and how they fit your goals", "Say it's a good company with a big name", "Say a friend suggested applying", "Say you heard the process is easy"], 0, "Medium", "Generic answers are the most commonly reported reason for HR rejection feedback - specifics show real research.", ["HR Interview", "Why Accenture"]),
          q("Accenture's HR round commonly checks a candidate's openness to which practical condition?", ["Relocation and working in shifts", "Choosing their own project from day one", "A four-day work week", "Working only from their home city"], 0, "Medium", "Recurring HR questions specifically probe openness to relocation and shift flexibility, given Accenture's project-based, client-driven staffing model.", ["HR Interview"]),
          q("What is the STAR method used for in behavioural interviews?", ["Structuring answers around Situation, Task, Action, and Result", "A coding pattern for output formatting", "A scoring rubric used only by interviewers", "A type of aptitude test"], 0, "Easy", "STAR gives behavioural answers a clear, complete structure that's easy for an interviewer to follow.", ["HR Interview", "Behavioral Questions"]),
          q("When explaining your own project in a technical interview, what should you be ready to cover?", ["The problem it solved, your specific role, the tech stack used, and what you would improve", "Only the programming language used", "Nothing - interviewers rarely ask about projects", "Just the project title"], 0, "Easy", "A complete project walkthrough covers the problem, your contribution, the tools used, and reflective improvement - not just a title.", ["Technical Interview", "Project Discussion"]),
          q("If asked about a weakness, what is generally the strongest approach?", ["Deny having any weaknesses", "Name a genuine, relevant weakness along with concrete steps taken to improve it", "Mention a strength disguised as a weakness with no real substance", "Give an unrelated personal weakness"], 1, "Medium", "A real weakness paired with a genuine improvement effort reads as self-aware and mature.", ["HR Interview"]),
          q("Why does Accenture's process formally test spoken and written communication, not just technical skill?", ["Because client-facing consulting and delivery roles require clear communication, and neglecting it is a common reason strong coders get rejected", "It is not actually evaluated", "Only non-tech candidates are tested on communication", "It only affects the final offer letter wording"], 0, "Medium", "Every candidate sits the Communication Assessment, tech or non-tech, since client-facing delivery work depends on it.", ["HR Interview", "Communication"]),
        ],
      },
    ],
  },
];

const existing = await db.collection("companies").where("name", "==", "Accenture").get();
if (!existing.empty) {
  console.log(`"Accenture" already exists (${existing.docs[0].id}) - skipping creation.`);
  process.exit(0);
}

const companyRef = await db.collection("companies").add({
  name: "Accenture",
  ctc: "3 - 10 LPA (Operations/Business Process Associate to Advanced App Engineering Analyst, role-dependent)",
  difficulty: "Medium",
  description: "Global technology, consulting and operations leader serving Fortune 500 clients - one of India's highest-volume fresher recruiters, hiring across technology, cloud/security, data/AI and operations every year, with Strategy & Consulting reserved mostly for MBAs and experienced hires.",
  eligibility: "B.E./B.Tech/M.E./M.Tech/MCA/M.Sc/Dual Degree across all branches (including Mechanical, Civil and EEE) for the Associate Software Engineer role - any graduate is eligible for Operations/Business Process roles. Minimum 60% or 6.0 CGPA across Class 10, Class 12 and graduation (some drives ask for 65%). No active backlogs during the process, and usually no re-appearing for Accenture's process within 3 months of a previous attempt.",
  hiringOverview: "Hiring runs through the NLT (National Level Test) - a mandatory practice mock assessment first, then a single ~120-minute online test with four independently cut-off sections: Cognitive (quantitative aptitude, logical reasoning, verbal ability), Technical (programming MCQs, pseudocode, fundamentals, plus basics of databases, cloud, networking and MS Office), Coding (2 problems in C, C++, Java or Python), and Communication (spoken and written English) - missing any one section's cut-off ends the process regardless of how well the others went. Clearing the NLT leads to a Technical Interview (DSA, SQL/DBMS, OOP, and a deep discussion of your own project) and then an HR Interview (behavioural fit, willingness to relocate and work in shifts, and compensation discussion). The whole process usually takes 2-4 weeks.",
  resources: [],
  status: "draft",
  order: 4,
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

console.log(`Seeded "Accenture" (${companyRef.id}): ${roundCount} rounds, ${categoryCount} categories, ${questionCount} questions.`);
