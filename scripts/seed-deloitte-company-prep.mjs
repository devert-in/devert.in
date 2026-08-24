import admin from "firebase-admin";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(join(__dirname, "service-account.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// Company Prep - Deloitte. Source: "Deloitte Placement Master Question Bank"
// (230 Qs) - unlike the TCS PDFs, its Quant/Reasoning/Verbal sections (A-C)
// are already single-answer MCQ with an answer key, so those are ported
// as-is. Its Coding & Technical and HR sections (D-E) are open Q&A with
// model answers/approaches, not MCQ, so those were reframed as "which of
// these is correct/best" questions - the correct option is always the PDF's
// own answer or approach, just given a shape that fits this schema's
// single-answer-MCQ-only design (see lib/companyPrep.js). No CTC/package
// figures or eligibility criteria are stated in the source for Deloitte
// (unlike the TCS PDFs, which gave exact ones) - left unset here rather than
// invented.

function q(question, options, correctIndex, difficulty, explanation, tags) {
  return { question, options, correctIndex, difficulty, marks: 1, explanation, tags, attemptCount: 0, correctCount: 0, totalTimeSec: 0 };
}

const ROUNDS = [
  {
    name: "Quantitative Aptitude", duration: "~1 minute per question",
    description: "Stage 1 of Deloitte's Online Assessment - a sharply timed test. Percentages, profit-loss, time-work-speed and averages are the most repeated clusters.",
    categories: [
      {
        name: "Percentages & Profit-Loss",
        questions: [
          q("If a number is first increased by 20% and then decreased by 20%, the net change in the number is:", ["No change", "4% increase", "4% decrease", "2% decrease"], 2, "Easy", "Net change = +20 - 20 - (20x20)/100 = -4%, i.e. a 4% decrease.", ["Percentages"]),
          q("A trader sells an article at 10% profit. Had he bought it 10% cheaper and sold it for Rs. 3 less, he would have gained 20%. The cost price is:", ["Rs. 100", "Rs. 120", "Rs. 150", "Rs. 175"], 2, "Hard", "SP = 1.1x; the alternate scenario gives 1.2(0.9x) = 1.1x - 3, so 0.02x = 3, x = 150.", ["Profit & Loss"]),
          q("A man buys 12 pens for Rs. 10 and sells 10 pens for Rs. 12. His profit percentage is:", ["40%", "44%", "48%", "50%"], 1, "Medium", "Cost per pen = 10/12, selling price per pen = 12/10; working out the ratio gives a 44% profit.", ["Profit & Loss"]),
          q("Two articles are sold at Rs. 1,980 each - one at 10% gain and the other at 10% loss. The overall result is:", ["1% profit", "1% loss", "No profit, no loss", "2% loss"], 1, "Medium", "When the selling price is the same and gain% equals loss% = x, the result is always a loss of x^2/100 percent, i.e. 1%.", ["Profit & Loss"]),
          q("A dishonest dealer sells goods at cost price but uses a 900 g weight instead of 1 kg. His gain percentage is:", ["10%", "11.11%", "12.5%", "9%"], 1, "Medium", "Gain = 100/900 x 100 = 11.11%.", ["Profit & Loss"]),
          q("After two successive discounts of 20% and 10%, an item sells for Rs. 720. Its marked price is:", ["Rs. 950", "Rs. 1,000", "Rs. 1,050", "Rs. 1,100"], 1, "Medium", "MP x 0.8 x 0.9 = 720, so MP = 720/0.72 = Rs. 1,000.", ["Profit & Loss", "Discounts"]),
        ],
      },
      {
        name: "Ratio, Time & Work, Speed",
        questions: [
          q("Rs. 1,210 is divided among A, B and C such that A : B = 5 : 4 and B : C = 9 : 10. A's share is:", ["Rs. 400", "Rs. 450", "Rs. 500", "Rs. 420"], 1, "Medium", "Combining the ratios gives A:B:C = 45:36:40 (121 parts); each part is 10, so A gets Rs. 450.", ["Ratio & Proportion"]),
          q("A can do a piece of work in 12 days and B in 18 days. Working together they finish it in:", ["7.2 days", "7.5 days", "6.8 days", "8 days"], 0, "Easy", "1/12 + 1/18 = 5/36, so together they take 36/5 = 7.2 days.", ["Time & Work"]),
          q("Pipe A fills a tank in 6 hours, pipe B in 8 hours and pipe C empties it in 12 hours. With all three open, the tank fills in:", ["4.8 hours", "5 hours", "4.5 hours", "6 hours"], 0, "Medium", "1/6 + 1/8 - 1/12 = 5/24, so the tank fills in 24/5 = 4.8 hours.", ["Time & Work"]),
          q("A 150 m long train crosses a pole in 15 seconds. Its speed is:", ["30 km/h", "36 km/h", "40 km/h", "45 km/h"], 1, "Easy", "Speed = 150/15 = 10 m/s = 36 km/h.", ["Time, Speed & Distance"]),
          q("Walking at 5 km/h a student reaches school 6 minutes late; at 6 km/h he reaches 6 minutes early. The distance to school is:", ["5 km", "6 km", "7 km", "7.5 km"], 1, "Medium", "d/5 - d/6 = 12/60, which gives d/30 = 1/5, so d = 6 km.", ["Time, Speed & Distance"]),
          q("A thief runs at 8 km/h. A policeman 200 m behind chases him at 10 km/h. The policeman catches the thief in:", ["5 minutes", "6 minutes", "8 minutes", "10 minutes"], 1, "Medium", "The relative speed is 2 km/h; closing a 0.2 km gap takes 0.1 hour, which is 6 minutes.", ["Time, Speed & Distance"]),
        ],
      },
      {
        name: "Averages, Interest, P&C & Data Interpretation",
        questions: [
          q("A batsman's average in 10 innings is 32. How many runs must he score in the 11th innings to raise his average to 35?", ["60", "62", "65", "70"], 2, "Medium", "Needed = 11x35 - 10x32 = 385 - 320 = 65.", ["Averages"]),
          q("The compound interest on Rs. 10,000 at 10% per annum for 2 years is:", ["Rs. 2,000", "Rs. 2,100", "Rs. 2,200", "Rs. 1,900"], 1, "Easy", "Amount = 10000 x 1.1 x 1.1 = 12,100, so CI = Rs. 2,100.", ["Compound Interest"]),
          q("In how many distinct ways can the letters of the word DELOITTE be arranged?", ["5,040", "10,080", "20,160", "40,320"], 1, "Medium", "8 letters with E twice and T twice: 8!/(2! x 2!) = 40320/4 = 10,080.", ["Permutations & Combinations"]),
          q("At a meeting, every one of 12 people shakes hands with every other person exactly once. The total number of handshakes is:", ["60", "64", "66", "72"], 2, "Easy", "C(12,2) = 66.", ["Permutations & Combinations"]),
          q("The unit digit of 7 raised to the power 95 is:", ["1", "3", "7", "9"], 1, "Medium", "The units cycle of 7 is 7, 9, 3, 1; 95 mod 4 = 3, so the unit digit is the 3rd term, 3.", ["Number System"]),
          q("Using the sales table (P: 120/150/180, Q: 200/180/220, R: 80/120/100 in Rs. lakh across 2021/2022/2023), the percentage growth in sales of product P from 2021 to 2023 is:", ["40%", "45%", "50%", "60%"], 2, "Medium", "(180 - 120)/120 x 100 = 50%.", ["Data Interpretation"]),
        ],
      },
    ],
  },
  {
    name: "Logical Reasoning", duration: "~1 minute per question",
    description: "Part of Deloitte's Stage 1 Online Assessment. Series, coding-decoding and syllogisms are the most repeated clusters.",
    categories: [
      {
        name: "Series & Coding-Decoding",
        questions: [
          q("Find the next term: 2, 6, 12, 20, 30, ?", ["40", "42", "44", "36"], 1, "Easy", "Differences are 4, 6, 8, 10, then 12: 30 + 12 = 42 (the pattern is n x (n+1)).", ["Number Series"]),
          q("Find the next term: 5, 11, 23, 47, ?", ["93", "94", "95", "97"], 2, "Medium", "Each term = previous x 2 + 1, so 47 x 2 + 1 = 95.", ["Number Series"]),
          q("In a code, DELHI is written as EFMIJ. How is MUMBAI written in that code?", ["NVNCBJ", "NWNCBJ", "OVOCBJ", "NVNBCJ"], 0, "Medium", "Each letter shifts forward by 1: M-N, U-V, M-N, B-C, A-B, I-J, giving NVNCBJ.", ["Coding-Decoding"]),
          q("If DELOITTE is written as ETTIOLED, how is CONSULTING written in the same code?", ["GNITLUSNOC", "GNITLUSONC", "CONSULTGNI", "GNTILUSNOC"], 0, "Easy", "The code simply reverses the word; CONSULTING reversed is GNITLUSNOC.", ["Coding-Decoding"]),
          q("If A = 1, B = 2, ..., Z = 26, the value of the word WORK is:", ["65", "66", "67", "68"], 2, "Easy", "W(23) + O(15) + R(18) + K(11) = 67.", ["Coding-Decoding"]),
          q("If MANGO is coded as OCPIQ, then APPLE is coded as:", ["CRRNG", "CQQNG", "BQQKD", "CRRMG"], 0, "Medium", "Every letter shifts forward by 2: A-C, P-R, P-R, L-N, E-G, giving CRRNG.", ["Coding-Decoding"]),
        ],
      },
      {
        name: "Blood Relations, Directions & Syllogisms",
        questions: [
          q("Pointing to a photograph, a man says, 'She is the daughter of my grandfather's only son.' How is the woman related to the man?", ["Mother", "Sister", "Aunt", "Cousin"], 1, "Medium", "The grandfather's only son is the man's own father; his father's daughter is his sister.", ["Blood Relations"]),
          q("P is Q's father, R is P's mother and S is Q's daughter. How is R related to S?", ["Grandmother", "Great-grandmother", "Mother", "Aunt"], 1, "Medium", "R (P's mother) is Q's grandmother, and S is Q's daughter, so R is S's great-grandmother.", ["Blood Relations"]),
          q("A man walks 5 km north, turns right and walks 3 km, then turns right again and walks 5 km. How far and in which direction is he from the start?", ["3 km east", "3 km west", "5 km north", "8 km east"], 0, "Medium", "The two 5 km legs cancel out, leaving only the 3 km eastward leg as the net displacement.", ["Direction Sense"]),
          q("One morning after sunrise, Suresh noticed that his shadow fell exactly behind him. Which direction was he facing?", ["East", "West", "North", "South"], 0, "Medium", "In the morning the sun is in the east and shadows point west; a shadow directly behind him means he is facing east.", ["Direction Sense"]),
          q("Statements: All pens are books. All books are chairs. Conclusions: I. All pens are chairs. II. Some chairs are pens.", ["Only I follows", "Only II follows", "Both follow", "Neither follows"], 2, "Medium", "Pens are inside books, and books are inside chairs, so both conclusions follow.", ["Syllogisms"]),
          q("Statements: No apple is an orange. All oranges are fruits. Conclusions: I. Some fruits are not apples. II. No fruit is an apple.", ["Only I follows", "Only II follows", "Both follow", "Neither follows"], 0, "Medium", "Oranges are fruits and are not apples, so some fruits are definitely not apples; concluding NO fruit is an apple is too strong a claim.", ["Syllogisms"]),
        ],
      },
      {
        name: "Arrangements, Ranking & Miscellaneous",
        questions: [
          q("Five friends A, B, C, D and E sit in a row facing north. E is at the extreme left, B is to the immediate right of A, and C sits between B and D. Who sits exactly in the middle?", ["A", "B", "C", "E"], 1, "Medium", "The order from the left works out to E, A, B, C, D - so B sits exactly in the middle.", ["Seating Arrangement"]),
          q("In a class, Ravi's rank is 17th from the top and 28th from the bottom. How many students are in the class?", ["43", "44", "45", "46"], 1, "Easy", "Total students = 17 + 28 - 1 = 44.", ["Ranking"]),
          q("The angle between the hour hand and the minute hand of a clock at 3:30 is:", ["75 degrees", "90 degrees", "105 degrees", "60 degrees"], 0, "Medium", "The hour hand is at 105 degrees (3.5 x 30) and the minute hand at 180 degrees; the difference is 75 degrees.", ["Clocks"]),
          q("Find the odd one out: 3, 5, 7, 11, 14, 17", ["3", "5", "14", "17"], 2, "Easy", "All the others are prime numbers; 14 is composite (and the only even number here).", ["Odd One Out"]),
          q("A clock shows 2:35. What time does its mirror image show?", ["9:25", "9:35", "10:25", "8:25"], 0, "Medium", "Mirror time = 11:60 - 2:35 = 9:25.", ["Clocks"]),
          q("A cube painted on all faces is cut into 64 equal smaller cubes. How many small cubes have exactly two faces painted?", ["16", "20", "24", "32"], 2, "Medium", "Two-face-painted cubes lie along the edges (excluding corners): 12 edges x (4 - 2) = 24.", ["Cube Cutting"]),
        ],
      },
    ],
  },
  {
    name: "Verbal Ability", duration: "~1 minute per question",
    description: "Part of Deloitte's Stage 1 Online Assessment. Synonyms, antonyms, grammar correction and reading comprehension are the most repeated clusters.",
    categories: [
      {
        name: "Synonyms & Antonyms",
        questions: [
          q("Choose the word closest in meaning to ABUNDANT:", ["Scarce", "Plentiful", "Moderate", "Rare"], 1, "Easy", "Abundant means existing in large quantities - plentiful.", ["Synonyms"]),
          q("Choose the word closest in meaning to CANDID:", ["Secretive", "Rude", "Frank", "Shy"], 2, "Easy", "Candid means truthful and straightforward - frank.", ["Synonyms"]),
          q("Choose the word closest in meaning to PRUDENT:", ["Reckless", "Foolish", "Wise and cautious", "Hasty"], 2, "Easy", "Prudent means acting with care and thought for the future.", ["Synonyms"]),
          q("Choose the word opposite in meaning to TRANSPARENT:", ["Clear", "Bright", "Opaque", "Visible"], 2, "Easy", "The opposite of transparent (see-through) is opaque.", ["Antonyms"]),
          q("Choose the word opposite in meaning to HOSTILE:", ["Aggressive", "Friendly", "Angry", "Bitter"], 1, "Easy", "Hostile means unfriendly; its opposite is friendly.", ["Antonyms"]),
          q("Choose the word opposite in meaning to OPTIMISTIC:", ["Hopeful", "Cheerful", "Pessimistic", "Confident"], 2, "Easy", "The opposite of optimistic is pessimistic.", ["Antonyms"]),
        ],
      },
      {
        name: "Grammar, Fill-ups & Para-jumbles",
        questions: [
          q("Which correction fixes the error in: \"Each of the students have submitted the assignment.\"", ["Each of the students has submitted the assignment.", "Each of the student have submitted the assignment.", "Each of the students had submit the assignment.", "The sentence is already correct."], 0, "Easy", "'Each' is singular, so it takes the singular auxiliary 'has', not 'have'.", ["Grammar", "Error Spotting"]),
          q("Fill in the blank: \"She is allergic ____ dust.\"", ["with", "to", "from", "at"], 1, "Easy", "'Allergic' takes the preposition 'to'.", ["Fill in the Blanks"]),
          q("Fill in the blank: \"He has been working in this company ____ 2019.\"", ["for", "since", "from", "before"], 1, "Easy", "Use 'since' with a fixed point in time (2019).", ["Fill in the Blanks"]),
          q("Fill in the blank: \"Despite ____ very hard, he could not clear the exam.\"", ["work", "worked", "working", "to work"], 2, "Medium", "'Despite' is followed by a gerund: despite working.", ["Fill in the Blanks"]),
          q("Fill in the blank: \"The manager, along with his team members, ____ attending the seminar.\"", ["are", "is", "were", "have"], 1, "Medium", "The subject 'manager' is singular; 'along with...' does not change the verb's number.", ["Grammar"]),
          q("Arrange into a meaningful paragraph. P: It soon became the most downloaded app in the country. Q: A small startup launched a budgeting app last year. R: Encouraged by the response, the team now adds new features every month. S: Initially, only a few hundred users signed up.", ["QSPR", "SQPR", "QPSR", "QSRP"], 0, "Medium", "Launch (Q), slow start (S), success (P), continued improvement (R).", ["Para-jumbles"]),
        ],
      },
      {
        name: "Idioms, Vocabulary & Reading Comprehension",
        questions: [
          q("The idiom 'to break the ice' means:", ["To start a conversation in an awkward or formal situation", "To end a fight", "To make something cold", "To damage something valuable"], 0, "Easy", "'Break the ice' means to ease initial awkwardness and get things started.", ["Idioms"]),
          q("The idiom 'once in a blue moon' means:", ["Very frequently", "Very rarely", "On every full-moon day", "Never"], 1, "Easy", "It means something that happens very rarely.", ["Idioms"]),
          q("One word for 'a person who can speak many languages':", ["Polyglot", "Bilingual", "Orator", "Translator"], 0, "Easy", "A polyglot knows or uses several languages.", ["One-Word Substitution"]),
          q("One word for 'something that cannot be avoided':", ["Inevitable", "Impossible", "Invisible", "Incredible"], 0, "Easy", "Inevitable means certain to happen and unavoidable.", ["One-Word Substitution"]),
          q("Passage: \"Automation is reshaping the modern workplace... Companies therefore invest heavily in reskilling programmes, recognising that technology is most powerful when paired with capable people.\" What is the central idea?", ["Automation will eliminate all jobs", "Continuous learning is essential as automation reshapes work", "Companies dislike new technology", "Employees should avoid using software"], 1, "Medium", "The passage argues that automation changes work and makes continuous skill-building essential.", ["Reading Comprehension"]),
          q("In that same passage, the word 'resist' most nearly means:", ["Oppose", "Accept", "Enjoy", "Study"], 0, "Easy", "To resist change is to oppose or push back against it.", ["Reading Comprehension", "Vocabulary in Context"]),
        ],
      },
    ],
  },
  {
    name: "Coding & Technical (MCQ)", duration: "N/A - concept check",
    description: "Technology/Analyst roles get an additional technical/coding section in Stage 1, and Stage 3 is a full Technical Interview. This round checks the underlying concepts and predicted outputs behind the must-practise coding problems from the source material, since writing and submitting real code belongs in CodeLab, not a multiple-choice quiz.",
    categories: [
      {
        name: "Predict the Output & Algorithms",
        questions: [
          q("What does this Java snippet print? int a = 5; int b = a++ + ++a; System.out.println(b + \", \" + a);", ["12, 7", "11, 7", "12, 6", "10, 6"], 0, "Medium", "a++ uses 5 then makes a = 6; ++a makes a = 7 and uses 7; b = 5 + 7 = 12.", ["Java", "Predict the Output"]),
          q("What does this Java snippet print? String s = \"hello\"; s.toUpperCase(); System.out.println(s);", ["hello", "HELLO", "Hello", "Compile error"], 0, "Medium", "Strings are immutable - toUpperCase() returns a new string that was discarded here, so s is unchanged.", ["Java", "Predict the Output"]),
          q("What is the time complexity of binary search on a sorted array of n elements?", ["O(n)", "O(log n)", "O(n log n)", "O(1)"], 1, "Easy", "The search space is halved at every step, giving O(log n). It requires the data to be sorted.", ["Binary Search", "Complexity"]),
          q("Which data structure works on the FIFO (First In, First Out) principle?", ["Stack", "Queue", "Binary Tree", "Hash Table"], 1, "Easy", "A queue is FIFO; a stack, by contrast, is LIFO (Last In, First Out).", ["Data Structures"]),
          q("What is the worst-case time complexity of quicksort, and when does it typically occur?", ["O(n log n), on random input", "O(n^2), when the pivot repeatedly splits the array very unevenly", "O(log n), always", "O(n), on sorted input"], 1, "Medium", "This happens with, for example, already-sorted input when the first or last element is always chosen as the pivot. The average case is O(n log n).", ["Sorting", "Complexity"]),
          q("An array holds the numbers 1 to n with exactly one missing. What is the standard O(n) time, O(1) space approach to find it?", ["Sort the array and scan for a gap", "Compute the expected sum n(n+1)/2 and subtract the array's actual sum", "Use a nested loop to check every pair", "Binary search the array"], 1, "Medium", "The difference between the expected sum and the actual sum is exactly the missing number - no sorting needed.", ["Arrays", "Missing Number"]),
        ],
      },
      {
        name: "OOP, DBMS & CS Fundamentals",
        questions: [
          q("Which statement correctly distinguishes method overloading from method overriding?", ["Overloading is resolved at compile time (same class, different parameters); overriding is resolved at runtime (a subclass redefines the same signature)", "They are two names for the exact same concept", "Overriding can only happen within the same class", "Overloading always requires inheritance"], 0, "Medium", "Overloading picks a method based on the parameter list at compile time; overriding uses dynamic dispatch at runtime.", ["OOPs"]),
          q("Which of DELETE, TRUNCATE and DROP removes the table's structure itself, not just its rows?", ["DELETE", "TRUNCATE", "DROP", "None of them"], 2, "Easy", "DELETE removes selected rows and can be rolled back; TRUNCATE clears all rows quickly; DROP removes the entire table structure along with its data.", ["SQL"]),
          q("What does the acronym ACID stand for in database transactions?", ["Atomicity, Consistency, Isolation, Durability", "Access, Control, Integrity, Data", "Aggregation, Composition, Inheritance, Delegation", "Authentication, Caching, Indexing, Deletion"], 0, "Medium", "Atomicity (all or nothing), Consistency (valid state transitions), Isolation (concurrent transactions don't interfere), Durability (committed changes survive failures).", ["DBMS", "Transactions"]),
          q("Which of these is NOT one of the four necessary conditions for a deadlock?", ["Mutual exclusion", "Hold and wait", "Preemption allowed on held resources", "Circular wait"], 2, "Hard", "Deadlock actually requires NO preemption - allowing preemption is one way to break a deadlock, not a condition that causes one.", ["Operating Systems", "Deadlock"]),
          q("What port does HTTPS use by default, and what does it add over plain HTTP?", ["Port 443, with TLS/SSL encryption and server authentication via certificate", "Port 80, with faster caching", "Port 21, with file transfer support", "Port 443, with no actual encryption"], 0, "Easy", "HTTPS secures HTTP with TLS/SSL: data is encrypted in transit and the server is authenticated by a certificate.", ["Computer Networks"]),
          q("Which transport-layer protocol is connection-oriented and guarantees reliable, ordered delivery?", ["UDP", "TCP", "IP", "ICMP"], 1, "Easy", "TCP adds handshaking, acknowledgement and retransmission for reliability; UDP is connectionless with no such guarantee.", ["Computer Networks", "TCP vs UDP"]),
        ],
      },
    ],
  },
  {
    name: "HR Interview Prep", duration: "N/A - interview round",
    description: "Deloitte's Stage 4 HR Interview checks fit, attitude, communication, flexibility to relocate, and knowledge about the firm. Use the STAR method (Situation, Task, Action, Result) for behavioural questions, and keep every answer to 60-90 seconds.",
    categories: [
      {
        name: "About You & Deloitte",
        questions: [
          q("What is the best approach when asked 'Tell me about yourself' in an interview?", ["A 60-90 second pitch covering education, 2-3 key skills or projects, one achievement, and enthusiasm for the role", "Reciting your resume line by line in full detail", "A single sentence with just your name", "Listing every certification you have ever earned"], 0, "Easy", "The interviewer already has your resume - a focused pitch is far more memorable than a recitation of it.", ["HR Interview"]),
          q("Which statement about Deloitte is accurate for interview preparation?", ["It is one of the Big Four global professional-services networks, operating in 150+ countries across service lines like Audit, Consulting, Financial Advisory, Risk Advisory and Tax", "It is a single-country firm focused only on auditing", "It was founded in India and has no global presence", "It only hires for technology roles"], 0, "Easy", "Knowing the actual service lines and scale shows real research, which HR interviewers explicitly look for.", ["HR Interview", "About Deloitte"]),
          q("Which set best reflects Deloitte's shared values, as commonly cited in placement prep material?", ["Lead the way; serve with integrity; take care of each other; foster inclusion; collaborate for measurable impact", "Move fast and break things", "Work hard, play hard, no exceptions", "Profit above all else"], 0, "Medium", "Picking one value and linking it to a genuine personal story makes this answer memorable rather than generic.", ["HR Interview", "About Deloitte"]),
          q("What is the best way to answer 'Are you willing to relocate?' if you genuinely can?", ["Answer positively and frame it as an opportunity to grow and work with new teams", "Say you'll decide only after receiving the offer letter", "Refuse outright to negotiate a higher salary", "Avoid answering directly"], 0, "Medium", "Client-serving firms need mobility - a genuine, positive answer signals fit; a real constraint should still be stated honestly rather than hidden.", ["HR Interview"]),
          q("As a fresher in campus placement, what's the safest way to answer 'What is your salary expectation?'", ["Say you're comfortable with the standard compensation for the role and your priority is learning and proving yourself", "Quote a specific high number to anchor negotiation", "Say you have no idea and ask them to guess", "Refuse to answer the question"], 0, "Medium", "This framing avoids sounding either mercenary or naive at the campus-hire stage.", ["HR Interview"]),
          q("What is the best way to answer 'What will you do if you are not selected today?'", ["Show resilience: ask for feedback, work on the gaps, and try again", "Say you would give up on this company entirely", "Say it doesn't matter to you either way", "Argue that the decision is unfair"], 0, "Easy", "Resilience and a growth mindset read far better than indifference or defensiveness.", ["HR Interview"]),
        ],
      },
      {
        name: "Behavioral & Situational",
        questions: [
          q("What is the STAR method used for structuring behavioural interview answers?", ["Situation, Task, Action, Result", "Story, Truth, Answer, Response", "Skill, Talent, Ability, Reputation", "Start, Try, Achieve, Repeat"], 0, "Easy", "STAR keeps behavioural answers concrete and complete: set up the context briefly, then focus on your actions and the measurable result.", ["HR Interview", "STAR Method"]),
          q("What is the most mature way to describe resolving a conflict with a team member in an interview?", ["You listened first, focused on the issue rather than the person, found common ground, and reached a workable outcome", "You reported them to a senior immediately without discussion", "You avoided them for the rest of the project", "You insisted on doing everything your way"], 0, "Medium", "This shows maturity and ownership; painting the other person as a villain is a common reported red flag.", ["HR Interview", "Behavioral"]),
          q("What's a strong approach to describe when asked how you prioritize multiple tasks?", ["Weighing urgency versus importance and stakeholder impact, and communicating trade-offs early", "Doing whichever task is easiest first, regardless of deadlines", "Working on everything simultaneously with no order", "Waiting until a manager assigns explicit priority to each task"], 0, "Medium", "Communicating trade-offs early, rather than silently dropping things, is the part interviewers specifically listen for.", ["HR Interview", "Behavioral"]),
          q("What is the recommended structure for a two-minute explanation of your final-year project?", ["The problem, your specific role, the tech stack, one key challenge and how you solved it, and the result", "A word-for-word reading of your project report's abstract", "Just the final grade you received", "A list of every tool mentioned in your resume"], 0, "Medium", "This structure covers exactly what a technical interviewer will want to probe further, and every claim should be defensible under follow-up questions.", ["HR Interview", "Project Discussion"]),
          q("What is the best way to explain an academic gap year or backlog if asked?", ["Be brief, honest and non-defensive: state the reason, what you did during that period, and evidence the issue is resolved", "Avoid the topic entirely and change the subject", "Blame the institution or a specific teacher", "Deny that it happened"], 0, "Medium", "A brief, honest explanation followed by a positive pivot reads as maturity; evasion or blame reads as a red flag.", ["HR Interview"]),
          q("What should you do when an interviewer asks 'Do you have any questions for us?'", ["Always ask 1-2 thoughtful questions, e.g. about team structure or what success looks like in the first year", "Say 'No, I don't have any questions'", "Immediately ask about salary and leave policy", "Ask them to repeat the entire interview"], 0, "Easy", "Thoughtful questions signal genuine interest; saying you have none, or leading with salary, are both commonly flagged as weak closes.", ["HR Interview"]),
        ],
      },
    ],
  },
];

const existing = await db.collection("companies").where("name", "==", "Deloitte").get();
if (!existing.empty) {
  console.log(`"Deloitte" already exists (${existing.docs[0].id}) - skipping creation.`);
  process.exit(0);
}

const companyRef = await db.collection("companies").add({
  name: "Deloitte",
  difficulty: "Medium",
  description: "One of the Big Four global professional-services networks, operating in 150+ countries across Audit & Assurance, Consulting, Financial Advisory, Risk Advisory, and Tax & Legal. Campus hiring pattern varies by role (Technology/Analyst, Audit & Assurance, Consulting, Risk Advisory, Tax) and by year.",
  hiringOverview: "Stage 1 - Online Assessment: a sharply timed test (~1 minute per question) covering Quantitative Aptitude, Logical Reasoning and Verbal Ability; Technology roles usually get an additional technical/coding section. Stage 2 - Group Discussion / JAM (some campuses). Stage 3 - Technical Interview: projects, programming fundamentals, data structures, OOP, DBMS/SQL, and sometimes puzzles or case-style questions. Stage 4 - HR Interview: fit, attitude, communication, flexibility to relocate, and knowledge about Deloitte.",
  resources: [],
  status: "published",
  order: 2,
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

console.log(`Seeded "Deloitte" (${companyRef.id}): ${roundCount} rounds, ${categoryCount} categories, ${questionCount} questions.`);
