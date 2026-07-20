import admin from "firebase-admin";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(join(__dirname, "service-account.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// Company Prep - Infosys. Matches the exact companies/{id}/rounds/{id}/
// categories/{id}/questions/{id} MCQ schema used by Cognizant/Deloitte/TCS
// (see lib/companyPrep.js) - every question here is original, pattern-based
// practice matching Infosys's well-documented public hiring format (online
// assessment -> technical interview -> HR interview), NOT sourced from any
// leaked/verified question bank, so none of it is labelled "memory-based."
// Seeded as status: "draft" (Cognizant's convention for unreviewed fresh
// content) rather than "published" (Deloitte/TCS's convention) - flip it
// from the admin panel once spot-checked.

function q(question, options, correctIndex, difficulty, explanation, tags) {
  return { question, options, correctIndex, difficulty, marks: 1, explanation, tags, attemptCount: 0, correctCount: 0, totalTimeSec: 0 };
}

const ROUNDS = [
  {
    name: "Quantitative Aptitude", duration: "~35 minutes",
    description: "Part of the single combined online assessment. Percentages, profit & loss, and time/work/speed are the most repeated clusters in candidate reports.",
    categories: [
      {
        name: "Percentages, Profit & Loss and Interest",
        questions: [
          q("A retailer buys an item for Rs. 800 and sells it at a 15% profit. What is the selling price?", ["880", "900", "920", "940"], 2, "Easy", "800 x 1.15 = 920.", ["Percentages", "Profit & Loss"]),
          q("By selling a chair for Rs. 1,540, a shopkeeper incurs a loss of 12%. What was the cost price?", ["1600", "1680", "1750", "1800"], 2, "Medium", "CP = 1540 / (1 - 0.12) = 1540 / 0.88 = 1750.", ["Profit & Loss"]),
          q("The population of a town increases by 10% in the first year and decreases by 10% in the second year. What is the net percentage change over the two years?", ["No change", "1% decrease", "1% increase", "2% decrease"], 1, "Medium", "1.10 x 0.90 = 0.99, a net 1% decrease.", ["Percentages"]),
          q("What is the compound interest on Rs. 10,000 for 2 years at 10% per annum, compounded annually?", ["2000", "2100", "2200", "2500"], 1, "Medium", "CI = 10000 x (1.10^2 - 1) = 10000 x 0.21 = 2100.", ["Compound Interest"]),
          q("A sum triples itself in 8 years at simple interest. What is the rate of interest per annum?", ["20%", "25%", "30%", "33.3%"], 1, "Medium", "Amount = 3P means interest earned = 2P; rate = (2P x 100) / (P x 8) = 25%.", ["Simple Interest"]),
          q("A shopkeeper marks an item 40% above cost price and then offers a 25% discount. What is his overall profit or loss percent?", ["5% profit", "5% loss", "10% profit", "No profit no loss"], 0, "Medium", "1.40 x 0.75 = 1.05, a net 5% profit.", ["Profit & Loss", "Discounts"]),
        ],
      },
      {
        name: "Time, Speed, Distance & Work",
        questions: [
          q("A can complete a task in 12 days and B in 18 days. Working together, how many days will they take?", ["6 days", "7.2 days", "8 days", "9 days"], 1, "Easy", "1/12 + 1/18 = 5/36, so together they take 36/5 = 7.2 days.", ["Time & Work"]),
          q("A train 200 m long crosses a platform 300 m long in 25 seconds. What is the speed of the train in km/h?", ["60 km/h", "64.8 km/h", "72 km/h", "80 km/h"], 2, "Easy", "500 m in 25 s = 20 m/s = 72 km/h.", ["Time, Speed & Distance"]),
          q("Two trains 120 m and 180 m long run in opposite directions at 54 km/h and 36 km/h. How long do they take to cross each other?", ["10 s", "12 s", "14 s", "15 s"], 1, "Medium", "Relative speed = 90 km/h = 25 m/s; total length 300 m; time = 300/25 = 12 s.", ["Time, Speed & Distance"]),
          q("15 workers can complete a wall in 20 days. How many workers are needed to complete it in 12 days?", ["18", "20", "22", "25"], 3, "Medium", "15 x 20 = 300 worker-days; 300/12 = 25 workers.", ["Time & Work"]),
          q("A boat's speed in still water is 12 km/h and the current's speed is 4 km/h. How long does it take to travel 32 km downstream?", ["1.5 h", "2 h", "2.5 h", "3 h"], 1, "Easy", "Downstream speed = 16 km/h; time = 32/16 = 2 hours.", ["Time, Speed & Distance"]),
          q("Pipe A fills a tank in 6 hours, pipe B in 12 hours, and pipe C (an outlet) empties it in 24 hours. If all three are opened together, how long will it take to fill the tank?", ["4 hours", "4.8 hours", "5 hours", "6 hours"], 1, "Hard", "1/6 + 1/12 - 1/24 = 5/24, so the tank fills in 24/5 = 4.8 hours.", ["Time & Work", "Pipes & Cisterns"]),
        ],
      },
      {
        name: "Number System, Averages & Ratios",
        questions: [
          q("What is the sum of the first 20 natural numbers?", ["190", "200", "210", "220"], 2, "Easy", "n(n+1)/2 = 20 x 21 / 2 = 210.", ["Number System"]),
          q("Find the unit digit of 7^85.", ["1", "3", "7", "9"], 2, "Medium", "Powers of 7 cycle 7, 9, 3, 1 (period 4); 85 mod 4 = 1, so the unit digit is 7.", ["Number System"]),
          q("The average of 5 consecutive even numbers is 24. What is the largest number?", ["26", "28", "30", "32"], 1, "Medium", "For 5 evenly-spaced numbers the average equals the middle one (24); the largest is 24 + 4 = 28.", ["Averages"]),
          q("Two numbers are in the ratio 3:5. If their sum is 96, what is the larger number?", ["36", "48", "60", "72"], 2, "Easy", "3x + 5x = 96, so x = 12 and the larger number is 5x = 60.", ["Ratio & Proportion"]),
          q("The average weight of 8 people increases by 2.5 kg when a new person replaces one weighing 65 kg. What is the weight of the new person?", ["75 kg", "80 kg", "85 kg", "90 kg"], 2, "Medium", "Total weight increases by 8 x 2.5 = 20 kg, so the new person weighs 65 + 20 = 85 kg.", ["Averages"]),
          q("What is the least number that should be subtracted from 1294 so that the remainder is divisible by 9?", ["4", "5", "7", "8"], 2, "Medium", "1294 mod 9 = 7 (digit sum 16 -> 7), so subtracting 7 leaves 1287, which is divisible by 9.", ["Number System"]),
        ],
      },
    ],
  },
  {
    name: "Logical Reasoning", duration: "~30 minutes",
    description: "Series, coding-decoding and blood relations are the most frequently repeated question types.",
    categories: [
      {
        name: "Series, Coding-Decoding & Blood Relations",
        questions: [
          q("Find the next number in the series: 2, 6, 12, 20, 30, ?", ["36", "40", "42", "44"], 2, "Easy", "The differences are 4, 6, 8, 10, 12, so the next term is 30 + 12 = 42.", ["Number Series"]),
          q("If TABLE is coded as UBCMF (each letter shifted forward by 1), how is CHAIR coded in the same scheme?", ["DIBJS", "DIBIS", "DJBIS", "DIBJT"], 0, "Medium", "Shifting each letter forward by 1: C-D, H-I, A-B, I-J, R-S gives DIBJS.", ["Coding-Decoding"]),
          q("Pointing to a man, a woman said, 'His mother is the only daughter of my mother.' How is the woman related to the man?", ["Mother", "Sister", "Aunt", "Grandmother"], 0, "Medium", "'The only daughter of my mother' is the woman herself, so the man's mother is the woman - she is his mother.", ["Blood Relations"]),
          q("If ROAD is coded as URDG (each letter shifted forward by 3), how is PLAN coded in the same scheme?", ["SODQ", "SOFQ", "RODQ", "SODP"], 0, "Easy", "Shifting each letter forward by 3: P-S, L-O, A-D, N-Q gives SODQ.", ["Coding-Decoding"]),
          q("Find the odd one out among: 27, 64, 100, 125.", ["27", "64", "100", "125"], 2, "Easy", "27, 64 and 125 are perfect cubes (3^3, 4^3, 5^3); 100 is not a perfect cube.", ["Number Series", "Classification"]),
          q("A is B's sister. C is B's mother. D is C's father. How is A related to D?", ["Granddaughter", "Daughter", "Niece", "Sister"], 0, "Medium", "D is C's father, and C is the mother of both A and B, so D is the grandfather of both - A is his granddaughter.", ["Blood Relations"]),
        ],
      },
      {
        name: "Puzzles, Direction Sense & Seating",
        questions: [
          q("A man walks 6 km east, then turns left and walks 8 km. How far is he from his starting point?", ["8 km", "10 km", "12 km", "14 km"], 1, "Easy", "Turning left while facing east means walking north; the two legs (6 km, 8 km) form a right angle, so the distance is sqrt(6^2 + 8^2) = 10 km.", ["Direction Sense"]),
          q("In a row of 20 children facing north, Meena is 7th from the left and Sita is 9th from the right. How many children are seated between them?", ["2", "3", "4", "5"], 2, "Medium", "Sita's position from the left is 20 - 9 + 1 = 12. Between position 7 and position 12, there are 4 children (positions 8, 9, 10, 11).", ["Seating in a Row"]),
          q("A man facing South turns 90 degrees clockwise, then 180 degrees, and finally 90 degrees anticlockwise. Which direction does he now face?", ["North", "South", "East", "West"], 0, "Hard", "Using degrees (N=0, E=90, S=180, W=270, clockwise positive): 180 + 90 - ... actually 180 +90=270(W), +180=90(E) [180 either way gives the same result], -90=0 -> North.", ["Direction Sense"]),
          q("Ram is taller than Shyam but shorter than Mohan. Mohan is shorter than Vijay. Who is the tallest?", ["Ram", "Shyam", "Mohan", "Vijay"], 3, "Easy", "The order is Vijay > Mohan > Ram > Shyam, so Vijay is the tallest.", ["Ordering & Comparison"]),
          q("Six people A-F sit around a circular table facing the centre. B sits immediately to A's right, C sits immediately to A's left, and D sits directly opposite A. Who sits directly opposite B?", ["E", "F", "D", "Cannot be determined"], 3, "Hard", "This fixes A, B, C and D's seats, but leaves E and F's seats (including the one opposite B) unassigned between the two of them - it cannot be determined from the given information.", ["Circular Arrangement"]),
          q("A man walks 10 km north, turns right and walks 6 km, then turns right again and walks 10 km. How far and in which direction is he from his starting point?", ["6 km East", "6 km West", "16 km East", "0 km (back to start)"], 0, "Medium", "The two 10 km north/south legs cancel out, leaving only the 6 km eastward leg as the net displacement.", ["Direction Sense"]),
        ],
      },
      {
        name: "Syllogisms & Statement-Conclusion",
        questions: [
          q("Statements: All cats are animals. All animals are living beings. Conclusions: I. All cats are living beings. II. Some living beings are cats.", ["Only I follows", "Only II follows", "Both I and II follow", "Neither follows"], 2, "Easy", "Cats are a subset of animals, which are a subset of living beings, so I follows directly; since cats exist, II also follows.", ["Syllogisms"]),
          q("Statements: Some doctors are teachers. All teachers are readers. Conclusions: I. Some doctors are readers. II. All readers are teachers.", ["Only I follows", "Only II follows", "Both follow", "Neither follows"], 0, "Medium", "I follows validly (some doctors are teachers, all teachers are readers, so some doctors are readers); II does not, since readers could include non-teachers.", ["Syllogisms"]),
          q("Statement: 'The company will hire only candidates who score above 80% in the assessment.' Conclusion I: Every candidate who scored above 80% will be hired. Conclusion II: No candidate scoring 80% or below will be hired.", ["Only I follows", "Only II follows", "Both follow", "Neither follows"], 1, "Medium", "'Only' marks scoring above 80% as a necessary, not sufficient, condition - so I does not follow, but II (the contrapositive) does.", ["Statement-Conclusion"]),
          q("Statements: All pens are books. No book is a pencil. Conclusions: I. No pen is a pencil. II. Some books are pens.", ["Only I follows", "Only II follows", "Both follow", "Neither follows"], 2, "Medium", "Since pens are a subset of books and books share nothing with pencils, no pen is a pencil (I); and since pens exist, some books are pens (II).", ["Syllogisms"]),
          q("Statement: 'If it rains, the match will be postponed.' Conclusion I: It did not rain, so the match was not postponed. Conclusion II: The match was not postponed, so it did not rain.", ["Only I follows", "Only II follows", "Both follow", "Neither follows"], 1, "Hard", "Conclusion I denies the antecedent, which is not logically valid; Conclusion II is the contrapositive of the original statement, which is always valid.", ["Statement-Conclusion"]),
          q("Statements: Some engineers are managers. Some managers are directors. Conclusion: Some engineers are directors.", ["Follows", "Does not follow", "Follows only if the group sizes are equal", "Cannot be determined without more data"], 1, "Medium", "Two particular ('some') premises can never validly yield a conclusion in syllogistic logic - this is a classic invalid form.", ["Syllogisms"]),
        ],
      },
    ],
  },
  {
    name: "Verbal Ability", duration: "~25 minutes",
    description: "Vocabulary, grammar correction and short reading-comprehension passages are the recurring formats.",
    categories: [
      {
        name: "Vocabulary, Synonyms & Antonyms",
        questions: [
          q("Choose the word closest in meaning to 'CANDID':", ["Frank", "Secretive", "Confused", "Arrogant"], 0, "Easy", "CANDID means open and honest, closest to 'Frank'.", ["Synonyms"]),
          q("Choose the antonym of 'BENEVOLENT':", ["Generous", "Malevolent", "Charitable", "Compassionate"], 1, "Easy", "BENEVOLENT means kind and well-meaning; its opposite is MALEVOLENT.", ["Antonyms"]),
          q("Choose the word closest in meaning to 'METICULOUS':", ["Careful and precise", "Careless and hasty", "Generous", "Talkative"], 0, "Medium", "METICULOUS describes someone who shows great attention to detail.", ["Synonyms"]),
          q("Choose the antonym of 'TRANSPARENT' (as in 'easily understood'):", ["Clear", "Obscure", "Honest", "Visible"], 1, "Medium", "The opposite of easily understood is OBSCURE.", ["Antonyms"]),
          q("Choose the word closest in meaning to 'PROCRASTINATE':", ["To delay or postpone", "To hurry up", "To celebrate", "To organise"], 0, "Easy", "PROCRASTINATE means to delay doing something.", ["Synonyms"]),
          q("Choose the antonym of 'ABUNDANT':", ["Plentiful", "Scarce", "Excessive", "Generous"], 1, "Easy", "ABUNDANT means present in large quantity; its opposite is SCARCE.", ["Antonyms"]),
        ],
      },
      {
        name: "Error Spotting, Correction & Fill in the Blanks",
        questions: [
          q("Identify the error: 'Each of the students have submitted their assignment.'", ["\"Each\" is wrong", "\"have\" should be \"has\"", "\"their\" is wrong", "No error"], 1, "Medium", "'Each' is a singular subject and takes the singular verb 'has', not 'have'.", ["Error Spotting"]),
          q("Fill in the blank: 'Neither the manager nor the employees ____ aware of the new policy.'", ["is", "was", "were", "be"], 2, "Medium", "With 'neither...nor', the verb agrees with the nearer subject - the plural 'employees' - so 'were' is correct.", ["Subject-Verb Agreement"]),
          q("Choose the grammatically correct sentence:", ["She don't like coffee.", "She doesn't likes coffee.", "She doesn't like coffee.", "She not like coffee."], 2, "Easy", "'Doesn't' already carries the third-person singular, so the main verb stays in its base form: 'doesn't like'.", ["Sentence Correction"]),
          q("Fill in the blank: 'He has been living in this city ____ ten years.'", ["since", "for", "from", "during"], 1, "Easy", "'For' is used with a duration of time; 'since' is used with a specific starting point.", ["Prepositions"]),
          q("Identify the error: 'The number of applicants have increased this year.'", ["\"number\" is wrong", "\"have\" should be \"has\"", "\"applicants\" is wrong", "No error"], 1, "Medium", "'The number of' takes a singular verb ('has increased'); only 'A number of' takes a plural verb.", ["Error Spotting"]),
          q("Choose the correctly punctuated sentence:", ["Its a beautiful day, isnt it?", "It's a beautiful day, isn't it?", "Its' a beautiful day, isn't it", "It is a beautiful day isn't it."], 1, "Easy", "'It's' (it is) and 'isn't' (is not) both need apostrophes, and the sentence needs a question mark.", ["Punctuation"]),
        ],
      },
      {
        name: "Reading Comprehension & Para Jumbles",
        questions: [
          q("Passage: 'Automation has transformed manufacturing by increasing precision and reducing repetitive manual labor, but it has also shifted the demand toward workers skilled in operating and maintaining automated systems.' According to the passage, what has automation primarily shifted?", ["The location of factories", "The demand toward workers skilled in operating automated systems", "The price of raw materials", "The number of manufacturing companies"], 1, "Easy", "The passage explicitly states the shift is toward workers skilled in operating and maintaining automated systems.", ["Reading Comprehension"]),
          q("Passage: 'Despite initial skepticism, remote work has proven effective for many roles, though it has also highlighted challenges in maintaining team cohesion and spontaneous collaboration.' What challenge does the passage associate with remote work?", ["Increased travel costs", "Difficulty in maintaining team cohesion and spontaneous collaboration", "Lower employee salaries", "Reduced use of technology"], 1, "Easy", "The passage names team cohesion and spontaneous collaboration as the specific challenges.", ["Reading Comprehension"]),
          q("Arrange into a coherent paragraph: P. This eventually led to widespread adoption across industries. Q. Cloud computing was initially viewed with skepticism due to security concerns. R. As security measures matured, businesses began trusting cloud providers with sensitive data. S. Over time, major companies demonstrated robust safeguards.", ["Q-S-R-P", "Q-R-S-P", "S-Q-R-P", "Q-P-S-R"], 0, "Medium", "The logical flow is: initial skepticism (Q) -> companies show safeguards (S) -> trust grows (R) -> adoption follows (P).", ["Para-jumbles"]),
          q("Passage: 'A well-designed API abstracts the complexity of a system, exposing only the operations a consumer needs while hiding internal implementation details.' What does a well-designed API primarily do, per the passage?", ["Exposes all internal implementation details", "Hides complexity while exposing only necessary operations", "Increases the system's complexity", "Removes the need for documentation"], 1, "Easy", "The passage states an API hides implementation detail while exposing only what's needed.", ["Reading Comprehension"]),
          q("Arrange logically: P. The team then tested the fix in a staging environment. Q. A critical bug was discovered in production. R. Engineers rolled back the previous deployment. S. Once confirmed stable, the fix was deployed to production.", ["Q-R-P-S", "Q-P-R-S", "R-Q-P-S", "Q-R-S-P"], 0, "Medium", "The events happen in this order: a bug is found (Q), the deployment is rolled back (R), the fix is tested in staging (P), then deployed once stable (S).", ["Para-jumbles"]),
          q("Passage: 'Critics argue that while artificial intelligence can augment human decision-making, over-reliance on automated recommendations risks eroding critical thinking skills.' What risk does the passage highlight regarding AI recommendations?", ["AI recommendations are always inaccurate", "Over-reliance may erode critical thinking skills", "AI recommendations are illegal in some countries", "AI cannot augment human decision-making at all"], 1, "Medium", "The passage's stated risk is specifically the erosion of critical thinking from over-reliance.", ["Reading Comprehension"]),
        ],
      },
    ],
  },
  {
    name: "Pseudocode & Programming Fundamentals", duration: "~20 minutes",
    description: "Infosys's assessment includes pseudocode dry-run questions instead of a written coding round at the Systems Engineer level - reading code carefully matters more than typing speed here.",
    categories: [
      {
        name: "Pseudocode Dry Runs",
        questions: [
          q("Pseudocode: SET sum = 0; FOR i = 1 TO 5: sum = sum + i; PRINT sum. What is printed?", ["10", "15", "20", "25"], 1, "Easy", "sum = 1+2+3+4+5 = 15.", ["Pseudocode"]),
          q("Pseudocode: SET x = 10; IF x > 5 THEN x = x - 3 ELSE x = x + 3; IF x > 5 THEN x = x * 2; PRINT x. What is printed?", ["7", "10", "14", "20"], 2, "Medium", "10 > 5, so x becomes 7; then 7 > 5, so x becomes 14.", ["Pseudocode"]),
          q("Pseudocode: SET a = 2, b = 3; WHILE a < 20: a = a * b; PRINT a. What is the final printed value of a?", ["18", "36", "54", "60"], 2, "Medium", "a goes 2 -> 6 -> 18 -> 54; once a reaches 54, the condition a < 20 is false and the loop stops, so 54 is printed.", ["Pseudocode", "Loops"]),
          q("Pseudocode: FUNCTION factorial(n): IF n <= 1 RETURN 1; ELSE RETURN n * factorial(n-1). What does factorial(5) return?", ["24", "60", "120", "150"], 2, "Easy", "factorial(5) = 5x4x3x2x1 = 120.", ["Pseudocode", "Recursion"]),
          q("Pseudocode: SET arr = [4, 2, 7, 1, 9]; SET max = arr[0]; FOR each element e IN arr: IF e > max THEN max = e; PRINT max. What is printed?", ["4", "7", "9", "1"], 2, "Easy", "The loop tracks the running maximum, which ends up as 9.", ["Pseudocode", "Arrays"]),
          q("Pseudocode: SET count = 0; FOR i = 1 TO 10: IF i MOD 3 == 0 THEN count = count + 1; PRINT count. What is printed?", ["2", "3", "4", "5"], 1, "Medium", "The multiples of 3 between 1 and 10 are 3, 6 and 9 - a count of 3.", ["Pseudocode"]),
        ],
      },
      {
        name: "Programming Fundamentals & Data Structures Basics",
        questions: [
          q("Which data structure uses Last-In-First-Out (LIFO) ordering?", ["Queue", "Stack", "Linked List", "Array"], 1, "Easy", "A stack removes the most recently added element first, which is LIFO ordering.", ["Data Structures", "Stack"]),
          q("What is the time complexity of accessing an element by index in an array?", ["O(1)", "O(log n)", "O(n)", "O(n^2)"], 0, "Easy", "Array elements are stored contiguously, so any index can be computed and accessed directly in constant time.", ["Data Structures", "Complexity"]),
          q("Which of the following best describes recursion?", ["A function that never terminates", "A function that calls itself to solve smaller subproblems", "A loop that runs exactly once", "A method exclusive to object-oriented languages"], 1, "Easy", "Recursion breaks a problem into smaller instances of itself, with a base case that stops the calls.", ["Programming Fundamentals", "Recursion"]),
          q("In a singly linked list, what is the time complexity of inserting a node at the beginning?", ["O(1)", "O(log n)", "O(n)", "O(n^2)"], 0, "Medium", "Inserting at the head only requires updating the new node's next pointer and the head reference - no traversal needed.", ["Data Structures", "Linked List"]),
          q("Which of these best describes a key difference between a compiler and an interpreter?", ["A compiler translates the entire program before execution, while an interpreter executes line by line", "A compiler only works with C, an interpreter only with Python", "There is no real difference", "An interpreter always produces faster programs than a compiler"], 0, "Medium", "Compilers translate the whole source into machine/byte code upfront; interpreters execute source statements one at a time.", ["Programming Fundamentals"]),
          q("What does the acronym 'FIFO' stand for, and which data structure typically implements it?", ["First-In-First-Out; implemented by a Queue", "First-In-First-Out; implemented by a Stack", "Fixed-In-Fixed-Out; implemented by an Array", "First-In-Final-Out; implemented by a Tree"], 0, "Easy", "FIFO means the first element added is the first one removed, which is exactly how a Queue behaves.", ["Data Structures", "Queue"]),
        ],
      },
    ],
  },
  {
    name: "Technical + HR Interview Prep", duration: "N/A - interview round",
    description: "The Technical and HR interviews are frequently combined into a single panel discussion. Expect core CS fundamentals, a deep dive into your own project, and standard behavioral questions.",
    categories: [
      {
        name: "OOPs, Java & DBMS",
        questions: [
          q("Which four pillars together define Object-Oriented Programming?", ["Encapsulation, Abstraction, Inheritance, Polymorphism", "Compilation, Linking, Loading, Execution", "Class, Object, Method, Variable", "Stack, Heap, Queue, Tree"], 0, "Easy", "These four concepts together form the foundation of OOP design.", ["OOPs"]),
          q("In Java, which keyword prevents a class from being inherited?", ["static", "final", "private", "abstract"], 1, "Easy", "A class declared 'final' cannot be extended by any other class.", ["Java"]),
          q("What is the main difference between an abstract class and an interface, under pre-Java 8 semantics?", ["An abstract class can have method implementations and constructors; an interface could only declare method signatures", "There is no difference", "Interfaces can have constructors, abstract classes cannot", "Abstract classes cannot have any methods at all"], 0, "Medium", "Before Java 8's default methods, interfaces were purely abstract method declarations, while abstract classes could mix implemented and unimplemented methods, plus constructors.", ["Java", "OOPs"]),
          q("Which SQL clause is used to filter grouped results after a GROUP BY?", ["WHERE", "HAVING", "ORDER BY", "FILTER"], 1, "Easy", "WHERE filters rows before grouping; HAVING filters the resulting groups.", ["SQL"]),
          q("What does normalization in a relational database primarily aim to reduce?", ["Query execution time only", "Data redundancy and update anomalies", "The number of tables", "The need for primary keys"], 1, "Medium", "Normalization organizes data to minimize redundancy and the anomalies that come with it.", ["DBMS"]),
          q("Which JOIN returns all rows from the left table and only the matching rows from the right table (NULLs where there's no match)?", ["INNER JOIN", "LEFT JOIN", "RIGHT JOIN", "CROSS JOIN"], 1, "Easy", "A LEFT JOIN keeps every row from the left table regardless of a match on the right.", ["SQL"]),
        ],
      },
      {
        name: "Operating Systems & Computer Networks",
        questions: [
          q("What is a deadlock in an operating system?", ["A situation where a process runs forever without finishing", "A situation where two or more processes are each waiting for a resource held by the other, and neither can proceed", "A crash caused by a missing device driver", "A type of memory leak"], 1, "Easy", "A deadlock is a circular wait where no process can make progress.", ["Operating Systems"]),
          q("Which scheduling algorithm can cause starvation if not managed carefully?", ["Round Robin", "Priority Scheduling", "First-Come-First-Served", "None of these can cause starvation"], 1, "Medium", "Under strict priority scheduling, low-priority processes can be perpetually delayed by a steady stream of higher-priority ones.", ["Operating Systems"]),
          q("What is the main advantage of using virtual memory?", ["It allows programs larger than physical RAM to run by using disk space as an extension of memory", "It makes the CPU run faster", "It eliminates the need for a hard disk", "It prevents all types of crashes"], 0, "Medium", "Virtual memory lets the system run programs that need more memory than is physically available by paging to disk.", ["Operating Systems"]),
          q("Which layer of the OSI model is primarily responsible for routing packets between different networks?", ["Data Link Layer", "Network Layer", "Transport Layer", "Session Layer"], 1, "Easy", "The Network layer (Layer 3) handles logical addressing and routing between networks.", ["Computer Networks"]),
          q("What is the key difference between TCP and UDP?", ["TCP is connection-oriented and reliable; UDP is connectionless and does not guarantee delivery", "UDP is always faster and also reliable", "TCP does not use acknowledgements", "There is no meaningful difference"], 0, "Easy", "TCP adds handshaking, acknowledgements and retransmission; UDP skips all of that for lower overhead.", ["Computer Networks"]),
          q("What does DNS primarily do?", ["Encrypts network traffic", "Translates human-readable domain names into IP addresses", "Assigns MAC addresses to devices", "Manages firewall rules"], 1, "Easy", "DNS resolves domain names like example.com into the IP addresses computers actually use to connect.", ["Computer Networks"]),
        ],
      },
      {
        name: "HR & Behavioral Best Practices",
        questions: [
          q("What is the most effective way to answer 'Why should we hire you?'", ["List generic strengths like 'hardworking' and 'team player' without examples", "Connect specific skills and projects to what the role actually needs, with concrete examples", "Say you need the job for financial reasons", "Compare yourself negatively to other candidates"], 1, "Medium", "Concrete, role-relevant examples are far more convincing than generic self-descriptions.", ["HR Interview"]),
          q("Before an interview, what should a candidate be ready to explain in detail, since interviewers frequently anchor questions on it?", ["Every line of their own resume", "The interviewer's own career history", "Unrelated general knowledge trivia", "Nothing in particular"], 0, "Easy", "Interviewers commonly probe deeply into anything listed on the candidate's resume - projects, skills and tools alike.", ["HR Interview", "Resume"]),
          q("What is the STAR method used for in behavioral interviews?", ["Structuring answers around Situation, Task, Action, and Result", "A scoring system used only by interviewers", "A coding pattern for star-shaped output", "A type of aptitude test"], 0, "Easy", "STAR gives behavioral answers a clear, complete structure that's easy for an interviewer to follow.", ["HR Interview", "Behavioral Questions"]),
          q("If asked about a weakness, what is generally considered the strongest approach?", ["Deny having any weaknesses", "Name a genuine, relevant weakness along with concrete steps taken to improve it", "Mention a strength disguised as a weakness with no real substance", "Give a weakness unrelated to work entirely"], 1, "Medium", "A real weakness paired with a genuine improvement effort reads as self-aware and mature.", ["HR Interview"]),
          q("How should a candidate typically respond when asked about willingness to relocate or work flexible shifts, if genuinely open to it?", ["Answer honestly and affirmatively if true, since this is commonly a practical screening question", "Refuse to answer the question", "Say it depends on the salary alone", "Avoid giving a direct answer"], 0, "Easy", "This is usually a straightforward logistics question, and a direct, honest answer is the strongest response.", ["HR Interview"]),
          q("What is generally the best way to close an interview when asked 'Do you have any questions for us?'", ["Say 'No, I think you covered everything'", "Ask a thoughtful question about the role, team, or growth opportunities", "Ask only about salary and holidays", "Ask nothing to save time"], 1, "Medium", "A thoughtful closing question signals genuine interest and engagement with the role.", ["HR Interview"]),
        ],
      },
    ],
  },
];

const existing = await db.collection("companies").where("name", "==", "Infosys").get();
if (!existing.empty) {
  console.log(`"Infosys" already exists (${existing.docs[0].id}) - skipping creation.`);
  process.exit(0);
}

const companyRef = await db.collection("companies").add({
  name: "Infosys",
  ctc: "3.6 - 9.5 LPA (Systems Engineer to Digital Specialist Engineer, band depends on role and performance)",
  difficulty: "Medium",
  description: "India's second-largest IT services company, headquartered in Bengaluru - a Fortune 500 firm known for its large-scale campus hiring and its Mysore training campus, one of the biggest corporate training facilities in the world.",
  eligibility: "B.E./B.Tech/M.E./M.Tech/MCA/M.Sc across all streams for the Systems Engineer role; Specialist Programmer and Digital Specialist Engineer roles are typically restricted to CS/IT/Electronics-adjacent branches with stronger coding expectations. Minimum 60% or 6 CGPA throughout Class 10, Class 12, UG and PG, with no standing backlogs at the time of interview.",
  hiringOverview: "Candidates take a single online assessment covering Quantitative Aptitude, Logical Reasoning, Verbal Ability and Pseudocode - roughly 2 hours combined, with Specialist Programmer / Digital Specialist Engineer aspirants also facing an additional hands-on coding test. Clearing the assessment leads to a Technical Interview (core CS fundamentals, projects, and sometimes puzzles), followed by an HR interview - the two are frequently combined into a single panel discussion. Selected candidates go through onboarding and foundation training, much of it delivered at Infosys's Mysore campus.",
  resources: [],
  status: "draft",
  order: 3,
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

console.log(`Seeded "Infosys" (${companyRef.id}): ${roundCount} rounds, ${categoryCount} categories, ${questionCount} questions.`);
