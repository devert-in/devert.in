import admin from "firebase-admin";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(join(__dirname, "service-account.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// Appends two more categories to four of TCS's six existing rounds, mining
// previously-unused questions from "TCS prev years questions.pdf" (the
// 300-question Ultimate Guide) - its Aptitude and Reasoning sections alone
// have 100 questions each and only ~30 were used in the original seed.
// Foundation - Verbal Ability and Advanced Quantitative & Reasoning are left
// alone: every question the source PDFs provide for those two rounds
// specifically is already in use, so expanding them further would mean
// inventing content the source never gave.

function q(question, options, correctIndex, difficulty, explanation, tags) {
  return { question, options, correctIndex, difficulty, marks: 1, explanation, tags, attemptCount: 0, correctCount: 0, totalTimeSec: 0 };
}

const NEW_CATEGORIES_BY_ROUND = {
  "Foundation - Numerical Ability": [
    {
      name: "Ratio, Mixtures & Partnership",
      questions: [
        q("Rs. 782 is divided in the ratio 1/2 : 2/3 : 3/4. The smallest share is:", ["Rs. 190", "Rs. 204", "Rs. 272", "Rs. 306"], 1, "Medium", "Multiplying through by 12 gives the ratio 6:8:9 (23 parts); 782/23 = 34, so the smallest share is 6 x 34 = Rs. 204.", ["Ratio & Proportion"]),
        q("Present ages of A and B are in the ratio 4:5; after 6 years the ratio becomes 5:6. Their present ages are:", ["20, 25", "24, 30", "28, 35", "16, 20"], 1, "Medium", "(4x+6)/(5x+6) = 5/6 gives x = 6, so the present ages are 24 and 30.", ["Ratio & Proportion", "Ages"]),
        q("A 40 kg alloy has zinc and copper in ratio 5:3. How much zinc must be added to make the ratio 2:1?", ["4 kg", "5 kg", "6 kg", "8 kg"], 1, "Medium", "Zinc is 25 kg, copper 15 kg; to reach a 2:1 ratio zinc must become 30 kg, so 5 kg must be added.", ["Ratio & Proportion", "Mixtures"]),
        q("A milkman sells a milk-water mixture at the cost price of pure milk and still gains 25%. The ratio of water to milk in the mixture is:", ["1:3", "1:4", "1:5", "2:5"], 1, "Medium", "Selling 5 units for the cost of 5 units of milk while only 4 units are actually milk gives a profit fraction of 1/4, i.e. a 1:4 water-to-milk ratio.", ["Mixtures", "Profit & Loss"]),
        q("The average weight of 20 students is 40 kg. Including the teacher, the average becomes 41 kg. The teacher's weight is:", ["58 kg", "60 kg", "61 kg", "65 kg"], 2, "Medium", "41 x 21 - 40 x 20 = 861 - 800 = 61 kg.", ["Averages"]),
        q("Incomes of A and B are in ratio 9:7, their expenditures in ratio 4:3, and each saves Rs. 2,000. A's income is:", ["Rs. 14,000", "Rs. 16,000", "Rs. 18,000", "Rs. 21,000"], 2, "Hard", "Solving 9x - 4y = 7x - 3y = 2000 gives x = 2000, so A's income (9x) is Rs. 18,000.", ["Ratio & Proportion", "Income & Expenditure"]),
      ],
    },
    {
      name: "Geometry, Mensuration & Data Interpretation",
      questions: [
        q("A rectangle's length is twice its breadth and its perimeter is 72 cm. Its area is:", ["216 sq cm", "288 sq cm", "324 sq cm", "432 sq cm"], 1, "Easy", "6b = 72 gives b = 12 and l = 24, so the area is 12 x 24 = 288 sq cm.", ["Mensuration"]),
        q("The area of a circle is 616 sq cm. Its radius is (use pi = 22/7):", ["12 cm", "14 cm", "16 cm", "21 cm"], 1, "Easy", "r^2 = 616 x 7/22 = 196, so r = 14 cm.", ["Mensuration"]),
        q("A right triangle has legs 5 cm and 12 cm. Its hypotenuse and area are:", ["13 cm, 30 sq cm", "13 cm, 60 sq cm", "17 cm, 30 sq cm", "15 cm, 36 sq cm"], 0, "Easy", "This is the classic 5-12-13 right triangle; area = (5 x 12)/2 = 30 sq cm.", ["Mensuration", "Geometry"]),
        q("Volume of a cone with radius 3 cm and height 7 cm (pi = 22/7):", ["44 cu cm", "66 cu cm", "88 cu cm", "99 cu cm"], 1, "Medium", "(1/3) x 22/7 x 9 x 7 = 66 cu cm.", ["Mensuration"]),
        q("A firm's production ('000 units) was 400 in 2019, 500 in 2020, 450 in 2021 and 600 in 2022. The percentage increase from 2019 to 2022 is:", ["40%", "45%", "50%", "60%"], 2, "Easy", "(600 - 400)/400 x 100 = 50%.", ["Data Interpretation"]),
        q("A monthly income of Rs. 72,000 is split by a pie chart into Rent 90, Food 120, Travel 60, Savings 90 (degrees). The spending on food is:", ["Rs. 18,000", "Rs. 20,000", "Rs. 24,000", "Rs. 30,000"], 2, "Medium", "120/360 x 72000 = Rs. 24,000.", ["Data Interpretation"]),
      ],
    },
  ],
  "Foundation - Reasoning Ability": [
    {
      name: "Coding-Decoding & Analogy",
      questions: [
        q("If CAT is coded as DBU, DOG is coded as:", ["EPH", "EQH", "FPH", "EPI"], 0, "Easy", "Each letter shifts forward by 1: C-D, A-B, T-U for CAT->DBU, and the same rule gives D-E, O-P, G-H for DOG->EPH.", ["Coding-Decoding"]),
        q("If PALE = 2134 and EARTH = 41567, then PEARL = ?", ["24157", "24153", "24315", "21453"], 1, "Medium", "Substituting each letter's known digit: P2 E4 A1 R5 L3 gives 24153.", ["Coding-Decoding"]),
        q("If TRAIN is written as NIART, PLANE is written as:", ["ENALP", "ENAPL", "NALEP", "PENAL"], 0, "Easy", "The code simply reverses the word; PLANE reversed is ENALP.", ["Coding-Decoding"]),
        q("Doctor : Hospital :: Teacher : ?", ["Class", "School", "Students", "Books"], 1, "Easy", "This is a workplace relationship - a doctor works in a hospital, a teacher works in a school.", ["Analogy"]),
        q("Book : Pages :: Ladder : ?", ["Climbing", "Wood", "Rungs", "Height"], 2, "Easy", "This is a whole-to-constituent-parts relationship - a book is made of pages, a ladder is made of rungs.", ["Analogy"]),
        q("Ornithology : Birds :: Entomology : ?", ["Fossils", "Insects", "Plants", "Fish"], 1, "Medium", "This is a study-of relationship - ornithology studies birds, entomology studies insects.", ["Analogy"]),
      ],
    },
    {
      name: "Seating, Puzzles & Data Sufficiency",
      questions: [
        q("In a row of boys, Rohan is 7th from the left and 4th from the right. How many boys are in the row?", ["9", "10", "11", "12"], 1, "Easy", "Total = 7 + 4 - 1 = 10.", ["Ranking"]),
        q("In a class of 30, Kiran ranks 11th from the top. His rank from the bottom is:", ["19", "20", "21", "22"], 1, "Easy", "Rank from the bottom = 30 - 11 + 1 = 20.", ["Ranking"]),
        q("A group contains 2 fathers and 2 sons. The minimum number of people in the group is:", ["2", "3", "4", "5"], 1, "Medium", "A grandfather, a father and a son works: the middle person is simultaneously a son (to the grandfather) and a father (to the son), so only 3 people are needed.", ["Puzzles"]),
        q("If the day before yesterday was Thursday, when will Sunday be?", ["Today", "Tomorrow", "Day after tomorrow", "Yesterday"], 1, "Easy", "The day before yesterday being Thursday makes today Saturday, so Sunday is tomorrow.", ["Calendar"]),
        q("Is x greater than y? Statement I: x^2 is greater than y^2. Statement II: x and y are both positive.", ["Statement I alone is sufficient", "Statement II alone is sufficient", "Both statements together are needed", "Even both together are insufficient"], 2, "Medium", "Squares alone ignore sign (e.g. x=-3,y=2 breaks it), but combined with both being positive, x > y follows.", ["Data Sufficiency"]),
        q("What is the value of x? Statement I: x + y = 10. Statement II: x - y = 4.", ["Statement I alone is sufficient", "Statement II alone is sufficient", "Both statements together are needed", "Even both together are insufficient"], 2, "Medium", "Each equation alone has two unknowns; solving them together gives x = 7, y = 3.", ["Data Sufficiency"]),
      ],
    },
  ],
  "Coding Aptitude (MCQ)": [
    {
      name: "More Predict the Output",
      questions: [
        q("A program reverses a string using two pointers swapping from both ends. For the input 'hello', what is the output?", ["olleh", "hello", "oellh", "Error"], 0, "Easy", "Swapping symmetric positions inward reverses the string in place.", ["Strings"]),
        q("A program checks whether a number reads the same backward by reversing its digits mathematically. For the input 1221, what does it print?", ["YES", "NO", "1221", "Error"], 0, "Easy", "Reversing 1221 gives 1221 again - it's a palindrome.", ["Palindrome"]),
        q("Using F(1) = F(2) = 1 and F(n) = F(n-1) + F(n-2), what is the 7th Fibonacci number?", ["8", "13", "21", "11"], 1, "Medium", "The sequence is 1,1,2,3,5,8,13 - the 7th term is 13.", ["Fibonacci"]),
        q("What is the GCD of 36 and 60, computed via Euclid's algorithm (gcd(a,b) = gcd(b, a mod b))?", ["6", "12", "18", "4"], 1, "Easy", "36 and 60 share a greatest common divisor of 12.", ["Number Theory"]),
        q("Tracking the largest and second-largest distinct values in a single pass, what is the second largest in [7, 2, 9, 4, 9, 1]?", ["9", "7", "4", "2"], 1, "Medium", "The largest value is 9 (appearing twice); the second-largest distinct value is 7.", ["Arrays"]),
        q("An array holds 4 distinct numbers from 1 to 5 with exactly one missing. For [1, 2, 4, 5], which number is missing?", ["1", "3", "4", "5"], 1, "Easy", "The expected sum 1+2+3+4+5=15 minus the actual sum 1+2+4+5=12 leaves 3 as the missing number.", ["Arrays", "Missing Number"]),
      ],
    },
    {
      name: "More Predict the Output II",
      questions: [
        q("What is the sum of the digits of 4728?", ["19", "21", "23", "25"], 1, "Easy", "4 + 7 + 2 + 8 = 21.", ["Math"]),
        q("A program reverses the digits of an integer using rev = rev*10 + n%10, which naturally drops leading zeros. What does it print for the input 1200?", ["0021", "21", "2100", "1200"], 1, "Easy", "Reversing 1200 digit by digit gives 0021, but integer arithmetic drops the leading zeros, printing 21.", ["Math"]),
        q("Is the year 1900 a leap year under the standard rule (divisible by 4, and not by 100 unless also by 400)?", ["Yes, LEAP", "No, ORDINARY", "Only in February", "Cannot be determined"], 1, "Easy", "1900 is divisible by 100 but not by 400, so it is not a leap year.", ["Leap Year"]),
        q("What is the decimal value of the binary string '1011'?", ["9", "11", "13", "7"], 1, "Easy", "Folding left (val = val*2 + bit) for 1,0,1,1 gives 11.", ["Number System"]),
        q("A program keeps only the first occurrence of each element, preserving order. For the input [4, 2, 4, 1, 2, 5], what is the output?", ["4 2 1 5", "1 2 4 5", "4 2 4 1 2 5", "2 4 1 5"], 0, "Medium", "4 and 2 each repeat later and are dropped on their second occurrence, leaving 4, 2, 1, 5 in original order.", ["Arrays", "Duplicates"]),
        q("What is 5! (factorial of 5)?", ["24", "120", "60", "720"], 1, "Easy", "5! = 5 x 4 x 3 x 2 x 1 = 120.", ["Math", "Recursion"]),
      ],
    },
  ],
  "Technical & HR Interview Prep": [
    {
      name: "More C/C++ & Programming Concepts",
      questions: [
        q("On a typical 64-bit compiler (GCC/Linux), sizeof(int) is:", ["2 bytes", "4 bytes", "8 bytes", "A compiler-independent constant"], 1, "Easy", "Mainstream 64-bit ABIs keep int at 4 bytes even though the platform itself is 64-bit.", ["C Programming"]),
        q("What does 'int a = 10; printf(\"%d\", a++);' print?", ["10", "11", "Undefined", "Compiler error"], 0, "Easy", "Post-increment (a++) yields the old value (10) in the expression, then increments a afterward.", ["C Programming"]),
        q("For 'int a[5];', what happens when you access a[5]?", ["It returns the last element", "It returns zero", "Undefined behaviour", "A compile error"], 2, "Medium", "Valid indices are 0 through 4; accessing index 5 is out-of-bounds undefined behaviour, not a guaranteed crash or zero.", ["C Programming", "Arrays"]),
        q("Every C string is terminated by:", ["EOF", "the null character '\\0'", "'\\n'", "A space character"], 1, "Easy", "Standard library string functions rely on this null terminator to find where a string ends.", ["C Programming", "Strings"]),
        q("What happens when a recursive function is called without a proper base case?", ["An infinite loop with no real harm", "Stack overflow", "A compile error", "It simply returns 0"], 1, "Medium", "Each call consumes stack space, and without a base case to stop the recursion, that space is eventually exhausted.", ["Recursion"]),
        q("Where is memory for global (file-scope) variables typically allocated?", ["The stack", "The heap", "The data segment", "The code segment"], 2, "Medium", "Initialised globals go into .data and zero-initialised ones into .bss, both part of the data segment - locals use the stack, and malloc uses the heap.", ["C Programming", "Memory Management"]),
      ],
    },
    {
      name: "More OS, Networks & DSA",
      questions: [
        q("Round Robin CPU scheduling works by:", ["Always running the shortest job first", "Giving each ready process a fixed time quantum in turn", "Being non-preemptive", "Always minimising average wait time"], 1, "Medium", "It's a preemptive scheme; too small a quantum causes excessive context-switch overhead, too large degenerates toward FCFS.", ["Operating Systems", "Scheduling"]),
        q("Virtual memory primarily allows:", ["Programs larger than physical RAM to run", "A faster CPU clock speed", "Completely eliminating page faults", "Direct execution straight from disk"], 0, "Medium", "Demand paging loads pages into RAM only when first accessed, letting a program's total size exceed physical memory.", ["Operating Systems", "Virtual Memory"]),
        q("What is the correct order of the OSI model's layers, from bottom to top?", ["Physical, Data Link, Network, Transport, Session, Presentation, Application", "Application, Presentation, Session, Transport, Network, Data Link, Physical, listed bottom-up", "Physical, Network, Data Link, Session, Transport, Application, Presentation", "Data Link, Physical, Transport, Network, Application, Session, Presentation"], 0, "Medium", "A common mnemonic for this exact order is 'Please Do Not Throw Sausage Pizza Away'.", ["Computer Networks", "OSI Model"]),
        q("An IPv4 address is how many bits, and an IPv6 address?", ["16 / 64", "32 / 128", "32 / 64", "64 / 128"], 1, "Easy", "IPv4 uses 32-bit addresses; IPv6 expands this to 128 bits, also removing the practical need for NAT.", ["Computer Networks"]),
        q("Which data structure is best suited for implementing a call stack and undo/redo operations?", ["Stack (LIFO)", "Queue (FIFO)", "Binary Search Tree", "Hash Table"], 0, "Easy", "A stack's Last-In-First-Out order matches exactly how nested function calls and undo operations need to unwind.", ["Data Structures", "Stack"]),
        q("Which statement correctly contrasts an array with a linked list?", ["Arrays give O(1) random access but have a fixed size; linked lists give O(1) insertion at a known node but only O(n) access", "Arrays and linked lists have identical performance characteristics", "Linked lists always use less total memory than arrays", "Arrays can never be resized under any circumstance"], 0, "Medium", "The right choice between them depends on whether random access or flexible insertion/deletion is the dominant operation.", ["Data Structures", "Array vs Linked List"]),
      ],
    },
  ],
};

const snap = await db.collection("companies").where("name", "==", "TCS").get();
if (snap.empty) { console.log('No "TCS" company found - run seed-tcs-company-prep.mjs first.'); process.exit(1); }
const companyRef = snap.docs[0].ref;

const roundsSnap = await companyRef.collection("rounds").get();
const roundsByName = new Map(roundsSnap.docs.map(d => [d.data().name, d.ref]));

let categoriesAdded = 0, questionsAdded = 0;

for (const [roundName, categories] of Object.entries(NEW_CATEGORIES_BY_ROUND)) {
  const roundRef = roundsByName.get(roundName);
  if (!roundRef) { console.log(`Round "${roundName}" not found - skipping.`); continue; }
  const existingCats = await roundRef.collection("categories").get();
  const existingNames = new Set(existingCats.docs.map(d => d.data().name));
  let nextOrder = existingCats.size;
  for (const category of categories) {
    if (existingNames.has(category.name)) { console.log(`Category "${category.name}" already exists under "${roundName}" - skipping.`); continue; }
    const categoryRef = await roundRef.collection("categories").add({ name: category.name, order: nextOrder++ });
    categoriesAdded++;
    for (let qi = 0; qi < category.questions.length; qi++) {
      await categoryRef.collection("questions").add({ ...category.questions[qi], order: qi });
      questionsAdded++;
    }
  }
}

console.log(`TCS expansion: +${categoriesAdded} categories, +${questionsAdded} questions.`);
