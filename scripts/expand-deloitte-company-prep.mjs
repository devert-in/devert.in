import admin from "firebase-admin";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(join(__dirname, "service-account.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// Appends one more category to each of Deloitte's five existing rounds
// (mining previously-unused questions from the same source PDF) plus an
// entirely new "Group Discussion & JAM" round for Stage 2 of the real
// process, which had zero coverage before this - the source describes it
// but doesn't give it question-bank content the way it does for the other
// stages, so these are original best-practice MCQs built from its own Stage
// 2 description and tip #9, not invented facts about Deloitte itself.

function q(question, options, correctIndex, difficulty, explanation, tags) {
  return { question, options, correctIndex, difficulty, marks: 1, explanation, tags, attemptCount: 0, correctCount: 0, totalTimeSec: 0 };
}

const NEW_CATEGORIES_BY_ROUND = {
  "Quantitative Aptitude": {
    name: "Ratio, Ages & Interest Extended",
    questions: [
      q("If A : B = 3 : 4 and B : C = 5 : 6, then A : B : C is:", ["15 : 20 : 24", "3 : 4 : 6", "15 : 20 : 25", "12 : 15 : 20"], 0, "Medium", "Making B common: A:B = 15:20, B:C = 20:24, so A:B:C = 15:20:24.", ["Ratio & Proportion"]),
      q("Two numbers are in the ratio 3 : 5. If 9 is subtracted from each, the ratio becomes 12 : 23. The numbers are:", ["27 and 45", "33 and 55", "36 and 60", "30 and 50"], 1, "Medium", "(3x-9)/(5x-9) = 12/23 gives 9x = 99, x = 11; the numbers are 33 and 55.", ["Ratio & Proportion"]),
      q("The average weight of 8 persons increases by 2.5 kg when a new person replaces one weighing 65 kg. The new person's weight is:", ["76 kg", "82.5 kg", "85 kg", "90 kg"], 2, "Medium", "New weight = 65 + 8x2.5 = 85 kg.", ["Averages"]),
      q("The simple interest on Rs. 5,000 at 8% per annum for 3 years is:", ["Rs. 1,000", "Rs. 1,200", "Rs. 1,250", "Rs. 1,400"], 1, "Easy", "SI = 5000 x 8 x 3 / 100 = Rs. 1,200.", ["Simple Interest"]),
      q("A sum doubles itself in 8 years at simple interest. The annual rate of interest is:", ["10%", "12.5%", "15%", "8%"], 1, "Medium", "The interest earned equals the principal in 8 years, so the rate is 100/8 = 12.5%.", ["Simple Interest"]),
      q("The difference between CI and SI on Rs. 8,000 for 2 years at 5% per annum is:", ["Rs. 15", "Rs. 20", "Rs. 25", "Rs. 40"], 1, "Medium", "Difference = P(r/100)^2 = 8000 x 0.0025 = Rs. 20.", ["Compound Interest"]),
    ],
  },
  "Logical Reasoning": {
    name: "More Series, Relations & Puzzles",
    questions: [
      q("Find the next term: 3, 7, 15, 31, 63, ?", ["125", "127", "131", "123"], 1, "Medium", "Each term = previous x 2 + 1, so 63 x 2 + 1 = 127.", ["Number Series"]),
      q("Find the next term: A, C, F, J, O, ?", ["T", "U", "V", "S"], 1, "Medium", "The gaps increase by one each time (+2, +3, +4, +5, next +6): O(15) + 6 = U(21).", ["Letter Series"]),
      q("A is B's brother, C is A's mother, and D is C's father. How is B related to D?", ["Grandchild", "Nephew", "Son-in-law", "Brother"], 0, "Medium", "C is B's mother and D is C's father, so D is B's grandfather; B is therefore D's grandchild.", ["Blood Relations"]),
      q("Introducing a man, a woman says, 'His wife is the only daughter of my mother.' How is the woman related to the man?", ["Wife", "Sister", "Mother", "Daughter"], 0, "Medium", "The only daughter of her mother is the woman herself, so she is his wife.", ["Blood Relations"]),
      q("A person facing east turns 90 degrees clockwise, then 180 degrees anticlockwise. Which direction is he facing now?", ["North", "South", "East", "West"], 0, "Medium", "East, turned 90 clockwise, faces south; turning 180 anticlockwise from south faces north.", ["Direction Sense"]),
      q("A is 10 m to the north of B, and C is 10 m to the east of B. In which direction is C with respect to A?", ["South-east", "North-east", "South-west", "East"], 0, "Medium", "From A, C lies south (down to B's level) and east, i.e. south-east.", ["Direction Sense"]),
    ],
  },
  "Verbal Ability": {
    name: "More Vocabulary & Grammar",
    questions: [
      q("Choose the word closest in meaning to METICULOUS:", ["Careless", "Lazy", "Quick", "Very careful and precise"], 3, "Medium", "Meticulous means showing great attention to detail.", ["Synonyms"]),
      q("Choose the word opposite in meaning to EXPAND:", ["Grow", "Stretch", "Widen", "Contract"], 3, "Easy", "The opposite of expand is contract.", ["Antonyms"]),
      q("Choose the word opposite in meaning to VICTORY:", ["Success", "Win", "Triumph", "Defeat"], 3, "Easy", "The opposite of victory is defeat.", ["Antonyms"]),
      q("Which correction fixes the error in: \"He is senior than me.\"", ["He is senior to me.", "He is more senior than me.", "He is senior from me.", "The sentence is already correct."], 0, "Medium", "'Senior' takes the preposition 'to', not 'than'.", ["Grammar", "Error Spotting"]),
      q("Which correction fixes the error in: \"She did not knew the answer.\"", ["She did not know the answer.", "She did not knowing the answer.", "She was not know the answer.", "The sentence is already correct."], 0, "Easy", "After 'did not', use the base form of the verb: 'know', not 'knew'.", ["Grammar", "Error Spotting"]),
      q("Fill in the blank: \"The meeting was put ____ because of heavy rain.\"", ["on", "in", "off", "up"], 2, "Easy", "'Put off' means postponed.", ["Fill in the Blanks"]),
    ],
  },
  "Coding & Technical (MCQ)": {
    name: "More Programming & CS Fundamentals",
    questions: [
      q("What is the standard two-pointer approach to reverse a string in place, without using a built-in reverse function?", ["Swap characters from both ends moving inward until the two pointers meet", "Sort the characters alphabetically", "Convert every character to uppercase first", "Only recursion works - a loop cannot do this"], 0, "Easy", "This runs in O(n) time and needs no extra string allocation.", ["Strings", "Two Pointer"]),
      q("What is the standard way to check if a number is a palindrome, without converting it to a string?", ["Reverse its digits mathematically (rev = rev*10 + n%10) and compare the result with the original number", "Check if the number is divisible by 2", "Sum its digits and check whether the sum is even", "Check whether it has an even number of digits"], 0, "Medium", "Rebuilding the reversed number arithmetically avoids any string conversion entirely.", ["Math", "Palindrome"]),
      q("A number is an Armstrong number (like 153) exactly when:", ["The sum of each of its digits raised to the power of the total digit count equals the number itself", "It is divisible by 3", "All of its digits are identical", "It is a perfect square"], 0, "Medium", "For 153 (3 digits): 1^3 + 5^3 + 3^3 = 1 + 125 + 27 = 153.", ["Math", "Armstrong Number"]),
      q("Which of these is NOT a common application of a stack?", ["Function-call management (the call stack)", "Undo/redo operations", "Balanced-parentheses checking", "Scheduling print jobs in first-come, first-served order"], 3, "Medium", "First-come-first-served scheduling is a classic queue (FIFO) application, not a stack (LIFO) one.", ["Data Structures", "Stack"]),
      q("In a binary search tree, which property must hold at every single node?", ["Its left subtree holds only smaller values and its right subtree holds only larger values", "It must always have exactly two children", "Its value must equal the sum of its children's values", "It must be a leaf node"], 0, "Easy", "This ordering is what gives a BST its average O(log n) search, insert and delete, and makes an inorder traversal come out sorted.", ["Data Structures", "Binary Search Tree"]),
      q("Which SQL join returns all rows from both tables, matched where possible and NULL-padded where there's no match on either side?", ["INNER JOIN", "FULL OUTER JOIN", "CROSS JOIN", "SELF JOIN"], 1, "Medium", "INNER JOIN keeps only matching rows; FULL OUTER JOIN keeps every row from both tables regardless of a match.", ["SQL", "Joins"]),
    ],
  },
  "HR Interview Prep": {
    name: "More Behavioral & Firm-Fit Questions",
    questions: [
      q("What's the best way to answer 'What are your strengths and weaknesses?'", ["State 2-3 strengths backed by short proof stories, plus one genuine, non-fatal weakness with the concrete steps you're taking to improve", "List only strengths and dodge the weakness part entirely", "Say you have no weaknesses at all", "Give a vague cliche like 'I'm a perfectionist' with no supporting example"], 0, "Medium", "A genuine weakness paired with real improvement steps reads as self-aware, not as a liability.", ["HR Interview"]),
      q("What's the best way to answer 'Where do you see yourself in five years?'", ["Show ambition within the firm: deep domain expertise, relevant certifications, and mentoring or leading a small team", "Say you plan to start a competing company", "Say you have no idea and haven't thought about it", "Name a completely unrelated career path"], 0, "Medium", "This signals stability and direction without sounding either rehearsed or disloyal.", ["HR Interview"]),
      q("What's the best way to answer 'Why should we hire you?'", ["Match 2-3 requirements from the job description to your own skills and attitude, with evidence for each, ending with adaptability and willingness to learn", "Simply say you need the job", "List generic adjectives with no supporting evidence", "Compare yourself unfavourably to other candidates"], 0, "Medium", "Proof beats adjectives - concrete evidence for each matched requirement is what actually lands.", ["HR Interview"]),
      q("What makes a strong answer to 'What is your biggest achievement so far?'", ["One achievement with a measurable outcome, plus a brief note on the effort and obstacles behind it", "The vaguest possible answer, to avoid sounding boastful", "An achievement that actually belongs to someone else", "No answer at all, since achievements don't matter"], 0, "Easy", "A measurable outcome (rank, prize, users, marks improved) makes the achievement concrete and memorable.", ["HR Interview"]),
      q("What's a strong way to answer 'How do you handle pressure and tight deadlines?'", ["Describe a real technique - breaking work into smaller tasks, prioritising, communicating early when at risk - backed by one example where it worked", "Say you never feel pressure", "Say you simply work through the night every time", "Avoid giving any concrete example"], 0, "Medium", "A real technique plus a real example is far more convincing than a vague claim of calmness.", ["HR Interview"]),
      q("What's the best way to answer 'What are your hobbies?'", ["Mention real hobbies and add one line on what each teaches you, and be ready for a follow-up question on any hobby you name", "List hobbies you don't actually have, to sound impressive", "Say you have no hobbies", "Give a one-word answer with no elaboration"], 0, "Easy", "Genuine hobbies with a reflective line (discipline from sport, patience from chess) hold up under a follow-up question - invented ones don't.", ["HR Interview"]),
    ],
  },
};

const NEW_ROUND = {
  name: "Group Discussion & JAM", duration: "Stage 2 - some campuses only",
  description: "A short group discussion or 'Just A Minute' (JAM) extempore round some campuses run to test communication and clarity of thought, between the Online Assessment and the Technical Interview. Content matters less here than clarity and listening.",
  categories: [
    {
      name: "GD & JAM Best Practices",
      questions: [
        q("In a Deloitte Group Discussion or JAM round, what matters most according to standard interview guidance?", ["Clarity of thought and listening to others, more than the sheer volume of content said", "Speaking the loudest and for the longest", "Interrupting others to make your point first", "Staying completely silent to avoid making a mistake"], 0, "Medium", "Content matters less than clarity and listening in these rounds - a few well-structured points beat a long, unfocused ramble.", ["GD/JAM"]),
        q("What is JAM (as used in some Deloitte campus drives)?", ["'Just A Minute' - a short extempore speaking round testing communication and clarity of thought", "A written aptitude test", "A technical coding round", "A one-on-one HR interview"], 0, "Easy", "It's a brief, unprepared speaking exercise, distinct from the group discussion format.", ["GD/JAM"]),
        q("What is the recommended way to enter and participate in a group discussion?", ["Enter early, speak in structured points, and let others finish before responding", "Arrive late to make a dramatic entrance", "Speak only in single words", "Wait until everyone else has spoken twice before saying anything"], 0, "Medium", "Entering early and speaking in clear, structured points signals preparedness and confidence without dominating the room.", ["GD/JAM"]),
        q("Which of these best describes a 'structured point' in a group discussion?", ["A clear claim backed by a brief reason or example, stated concisely", "A long, unbroken monologue with no clear claim", "Simply repeating what the previous speaker already said", "A question with no actual opinion attached"], 0, "Medium", "A claim plus a brief supporting reason is easy for the panel to follow and credit, unlike a rambling monologue.", ["GD/JAM"]),
        q("Why does actively listening to other participants matter in a GD, even though it isn't your own speaking time?", ["It lets you build on or respectfully counter points already made, showing genuine engagement with the discussion", "It has no real effect on how you're evaluated", "It only matters if you happen to be the moderator", "It's only relevant in written rounds, not spoken ones"], 0, "Medium", "Referencing or building on what others said (rather than only delivering pre-planned points) is a clear signal of real listening.", ["GD/JAM"]),
        q("What is a common mistake candidates make in JAM (Just A Minute) rounds?", ["Rambling without a clear structure (a beginning, middle and end) within the short time limit", "Speaking too concisely", "Preparing a rough structure in advance", "Making eye contact with the panel"], 0, "Medium", "A minute disappears fast - candidates who ramble without a plan often run out of time before making a real point.", ["GD/JAM"]),
      ],
    },
  ],
};

const snap = await db.collection("companies").where("name", "==", "Deloitte").get();
if (snap.empty) { console.log('No "Deloitte" company found - run seed-deloitte-company-prep.mjs first.'); process.exit(1); }
const companyRef = snap.docs[0].ref;

const roundsSnap = await companyRef.collection("rounds").get();
const roundsByName = new Map(roundsSnap.docs.map(d => [d.data().name, d.ref]));

let categoriesAdded = 0, questionsAdded = 0;

for (const [roundName, category] of Object.entries(NEW_CATEGORIES_BY_ROUND)) {
  const roundRef = roundsByName.get(roundName);
  if (!roundRef) { console.log(`Round "${roundName}" not found - skipping its extra category.`); continue; }
  const existingCats = await roundRef.collection("categories").get();
  const alreadyThere = existingCats.docs.some(d => d.data().name === category.name);
  if (alreadyThere) { console.log(`Category "${category.name}" already exists under "${roundName}" - skipping.`); continue; }
  const nextOrder = existingCats.size;
  const categoryRef = await roundRef.collection("categories").add({ name: category.name, order: nextOrder });
  categoriesAdded++;
  for (let qi = 0; qi < category.questions.length; qi++) {
    await categoryRef.collection("questions").add({ ...category.questions[qi], order: qi });
    questionsAdded++;
  }
}

const existingRoundNames = new Set(roundsSnap.docs.map(d => d.data().name));
if (!existingRoundNames.has(NEW_ROUND.name)) {
  const nextRoundOrder = roundsSnap.size;
  const newRoundRef = await companyRef.collection("rounds").add({
    name: NEW_ROUND.name, description: NEW_ROUND.description, duration: NEW_ROUND.duration, order: nextRoundOrder,
  });
  for (let ci = 0; ci < NEW_ROUND.categories.length; ci++) {
    const category = NEW_ROUND.categories[ci];
    const categoryRef = await newRoundRef.collection("categories").add({ name: category.name, order: ci });
    categoriesAdded++;
    for (let qi = 0; qi < category.questions.length; qi++) {
      await categoryRef.collection("questions").add({ ...category.questions[qi], order: qi });
      questionsAdded++;
    }
  }
  console.log(`Added new round "${NEW_ROUND.name}".`);
} else {
  console.log(`Round "${NEW_ROUND.name}" already exists - skipping.`);
}

console.log(`Deloitte expansion: +${categoriesAdded} categories, +${questionsAdded} questions.`);
