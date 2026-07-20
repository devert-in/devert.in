// One-off seed for the Cognizant Company Prep guide, transcribed from the
// placement-prep PDF the user shared. Communication/Aptitude/IT Basics
// sections are genuine 4-option MCQ straight from the source's own answer
// key. The OOP/DBMS/DSA/OS&Networks "Q&A" section had no options in the
// source (open Q&A, e.g. "What is encapsulation? -> Answer: ...") - per the
// user's explicit choice, those are converted to MCQ by fabricating 3
// plausible wrong-answer options per question; the correct answer text
// itself is still the source's own answer. Pure behavioral/HR/project
// questions (Tell me about yourself, Why Cognizant, etc.) have no single
// correct answer at all, so they were NOT forced into MCQ - they're folded
// into the company's hiringOverview as a "what to prepare" note instead.
//
// Run with: node scripts/seed-cognizant-prep.mjs
import admin from "firebase-admin";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(join(__dirname, "service-account.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

// ---------------------------------------------------------------------------
// Company
// ---------------------------------------------------------------------------

const COMPANY = {
  name: "Cognizant",
  logo: "",
  description: "Founded in 1994, headquartered in Teaneck, New Jersey. A Fortune 500 company and global leader in business and technology services, providing solutions across Healthcare IT, Banking, Retail, and Insurance.",
  website: "https://www.cognizant.com/",
  ctc: "4.0 - 6.75 LPA (GenC Foundation to GenC Next)",
  difficulty: "Medium",
  eligibility: "B.E./B.Tech/M.E./M.Tech/MCA/M.Sc (typically CS, IT, Electronics, Mechanical and relevant science disciplines). Minimum 60% or 6 CGPA across Class 10, Class 12, UG and PG. No standing backlogs at application or joining. Maximum 2-year academic gap across the whole education history.",
  hiringOverview: `Cognizant filters candidates into three tiers by assessment/interview performance - you don't apply to a tier directly, your score routes you:
- GenC (Foundation Software Engineer) - basic coding + core CS fundamentals, ~4.0 LPA
- GenC Elevate (Advanced Technical Role) - clean Java/Python/C++, Easy-Medium DSA, strong CS, ~5.4 LPA
- GenC Next (Top-Tier Developer) - excellent problem-solving, strong DSA, deep project knowledge, ~6.75 LPA

Selection process (each round is a strict gate - failing one usually ends the process):
1. Communication Assessment - AI-based voice evaluation (fluency, pronunciation, reading speed, listening comprehension), ~60 minutes.
2. Aptitude Assessment - Quantitative, Logical Reasoning, Verbal Ability, often with game-based modules.
3. Technical Assessment - cluster-based test on CS fundamentals (OOP, DBMS, OS, Networks) plus 1-2 coding questions. High scorers get flagged for GenC Elevate/Next.
4. Technical + HR Interview - a combined 30-45 minute interview covering DSA, SQL, core CS concepts, your own project in detail, and behavioral fit.

What to prepare for the HR/Behavioral portion of round 4 (no single "correct" answer, so these aren't in the practice question bank below, but come ready with real answers):
- Tell me about yourself (keep it focused on education, skills, projects)
- Why do you want to join Cognizant?
- Give an example of a time you showed leadership or handled a team conflict
- Are you open to relocation and flexible shifts?
- Be ready to explain your project's architecture, why you chose that tech stack, the biggest challenge you hit, and your specific contribution.`,
  resources: [],
  status: "draft",
  order: 0,
};

// ---------------------------------------------------------------------------
// Round 1: Communication Assessment
// ---------------------------------------------------------------------------

const ROUND_1 = {
  name: "Communication Assessment",
  description: "AI-based voice evaluation testing spoken fluency, pronunciation, reading speed, and listening comprehension.",
  duration: "60 minutes",
  passingMarks: "",
  instructions: "Covers Read Aloud, Repeat Sentences, Listening Comprehension and Sentence Completion in the real assessment - the question bank below focuses on the Verbal Ability / English Language MCQ portion asked historically alongside it.",
};

const IDIOMS = [
  { q: "To take with a grain of salt.", o: ["To take it lightly", "To take with some reservation", "Not to believe anyone", "To take it on heart"], c: 1 },
  { q: "To talk through one's hat", o: ["To talk nonsense", "To talk sensibly", "To talk privately", "To talk against someone"], c: 0 },
  { q: "To be rolling in money", o: ["Under debt", "Going through financial loss", "To give wrong advice", "Very rich"], c: 3 },
  { q: "To give up the ghost", o: ["To die", "To have a bad dream", "Encounter with a ghost", "An impractical thinking"], c: 0 },
  { q: "To wash one's dirty linen in public", o: ["To talk nonsense in front of public", "To act in a childish way", "To discuss dirty and scandalous matters in public", "To face humiliation in front of strangers"], c: 2 },
].map(x => ({ question: x.q, options: x.o, correctIndex: x.c, difficulty: "Easy", tags: ["Idioms"] }));

const ONE_WORD = [
  { q: "A senior Christian priest", o: ["Pastor", "Preacher", "Evangelist", "Archdeacon"], c: 3 },
  { q: "A person who dabbles in a subject for enjoyment", o: ["Drake", "Dilettante", "Estuary", "Erudite"], c: 1 },
  { q: "Intended to teach or give moral instruction", o: ["Didactic", "Diction", "Dictionary", "Instructor"], c: 0 },
  { q: "A political leader appealing to popular desires and prejudices.", o: ["Haranguer", "Demagogue", "Politician", "Agitator"], c: 1 },
  { q: "Fear of Needles", o: ["Belenophobia", "Bibliophobia", "Chionophobia", "Cryophobia"], c: 0 },
].map(x => ({ question: x.q, options: x.o, correctIndex: x.c, difficulty: "Medium", tags: ["One-Word Substitution"] }));

const CLOZE_P1 = 'Market share is ___[1]___ very important to a company, oddly sometimes more ___[2]___ than the bottom line. There is always great competition for new customers. Many times the efforts and resources devoted to ___[3]___, marketing and selling to new customers are at the expense of a company\'s loyal customer base. This can even be seen at the local level. Where I live heating oil companies ___[4]___ offer new customers a deal for the first year in order to lure them in. This, of course, is done at the expense of old, loyal customers who have to make up the slack. The result is that many savvy oil customers these days do a lot of shopping each year to find the best deal ___[5]___ is a thing of the past. Companies are interested in luring you in but then once they have you; they don\'t quite value you as much as the next ___[6]___ customer they want to corral.';
const CLOZE_P2 = 'Whether in politics, professional sports, or in business, players ___[1]___ believe that because of their importance they can ride out any issue or problem. They can\'t. Johnson & Johnson has ___[2]___ gone through a spate of recalls of tainted children\'s Tylenol and Motrin. And for the last decade it has been settling with claimants for a variety of injuries and death allegedly due from Ortho Evra, a contraceptive ___[3]___ made by its subsidiary, Ortho McNeil. It appears clear that the current management of J&J has not followed in the footsteps of the management that handled the Tylenol crisis of 1982 which is ___[4]___ cited as the quintessential example of crisis management in modern corporate history. Unfortunately that does not ___[5]___ to be the philosophy today. There is clearly a danger in believing one\'s invincibility.';

const CLOZE = [
  { q: `${CLOZE_P1}\n\nWhich word correctly fills blank [1]?`, o: ["Usually", "Usual", "Actually", "Maybe"], c: 0 },
  { q: `${CLOZE_P1}\n\nWhich word correctly fills blank [2]?`, o: ["Crucial", "Resourceful", "Important", "Required"], c: 2 },
  { q: `${CLOZE_P1}\n\nWhich word correctly fills blank [3]?`, o: ["Advert", "Advertising", "Loyalty", "Branding"], c: 1 },
  { q: `${CLOZE_P1}\n\nWhich word correctly fills blank [4]?`, o: ["Consistent", "Consistently", "Consider", "Regularly"], c: 3 },
  { q: `${CLOZE_P1}\n\nWhich word correctly fills blank [5]?`, o: ["Loyal", "Marketing", "Selling", "Loyalty"], c: 3 },
  { q: `${CLOZE_P1}\n\nWhich word correctly fills blank [6]?`, o: ["Potential", "Wanted", "Important", "Potent"], c: 0 },
  { q: `${CLOZE_P2}\n\nWhich word correctly fills blank [1]?`, o: ["Yet", "Still", "Will", "want"], c: 1 },
  { q: `${CLOZE_P2}\n\nWhich word correctly fills blank [2]?`, o: ["Recently", "Just", "Not", "Now"], c: 0 },
  { q: `${CLOZE_P2}\n\nWhich word correctly fills blank [3]?`, o: ["Area", "Patch", "Now", "When"], c: 1 },
  { q: `${CLOZE_P2}\n\nWhich word correctly fills blank [4]?`, o: ["Commonly", "Now", "Even", "Often"], c: 3 },
  { q: `${CLOZE_P2}\n\nWhich word correctly fills blank [5]?`, o: ["Seem", "Likely", "Appear", "Wish"], c: 0 },
].map(x => ({ question: x.q, options: x.o, correctIndex: x.c, difficulty: "Medium", tags: ["Cloze Test"] }));

const SPELLING = [
  { q: "Choose the correctly spelt word.", o: ["Dramatize", "Nany", "Muzle", "Myrle"], c: 0 },
  { q: "Choose the correctly spelt word.", o: ["Sady", "Naphthalene", "Narcism", "Nailve"], c: 1 },
  { q: "Choose the correctly spelt word.", o: ["Fonde", "Foly", "Makish", "Fondant"], c: 3 },
].map(x => ({ question: x.q, options: x.o, correctIndex: x.c, difficulty: "Medium", tags: ["Spelling"] }));

const GRAMMAR = [
  { q: "Spot the grammatically wrong sentence.", o: [
    "One of the most difficult facilitation tasks is time management -- time seems to run out before tasks are completed. Therefore, the biggest challenge is keeping momentum to keep the process moving.",
    "Develop the agendas together have key participants in the meeting.",
    "Have someone designated to record important actions, assignments and due dates during the meeting.",
    "Meeting management tends to be a set of skills often overlooked by leaders and managers.",
  ], c: 1 },
  { q: "Spot the grammatically wrong sentence.", o: [
    "Always start on time; this respects those who showed up on time and reminds late-comers that the scheduling is serious.",
    "Always end meetings on time and attempt to end on a positive note.",
    "As he has anticipated, an thundering iron gate fall nearby, barricading the entrance to the suite.",
    "The curator felt a surge of adrenaline. How could he possibly know this?",
  ], c: 2 },
  { q: "Spot the grammatically wrong sentence.", o: [
    "An telephone was ringing in a darkness--a tinny, unfamiliar rings.",
    "A collection of the world's most famous paintings seemed to smile down on him like old friends.",
    "Slowly, the fog began to lift.",
    "His eyes focused now on a crumpled flyer on his bedside table.",
  ], c: 0 },
  { q: "Spot the grammatically wrong sentence.", o: [
    "The hostess began reading choice excerpts from the inane article, and Langdon felt himself sinking lower and lower in his chair.",
    "I cannot presume the authority to stop him.",
    "The hall erupted in laughter.",
    "And if I find who one of you provides that article, I have the consulate deport you.",
  ], c: 3 },
  { q: "Spot the grammatically wrong sentence.", o: [
    "This photo takes less than an hour ago.",
    "I cannot fully express my gratitude to the exceptional team.",
    "The spiked cilice belt that he wore around his thigh cut into his flesh, and yet his soul sang with satisfaction of service to the Lord.",
    "A little over a year ago, Langdon had received a photograph of a corpse and a similar request for help.",
  ], c: 0 },
].map(x => ({ question: x.q, options: x.o, correctIndex: x.c, difficulty: "Hard", tags: ["Grammar", "Error Spotting"] }));

const REARRANGE = [
  { q: "Choose the correct sequence: A. Review the agenda at the beginning | B. And accept them. | C. of each meeting, giving participants a chance to understand all | D. proposed major topics, change them", o: ["ABCD", "ABDC", "ACDB", "DCBA"], c: 2 },
  { q: "Choose the correct sequence: A. Organizational performance involves the | B. monitor progress toward the goals, | C. recurring activities to establish organizational goals, | D. and make adjustments to achieve those goals", o: ["ADCB", "ACBD", "DCBA", "CBDA"], c: 1 },
  { q: "Choose the correct sequence: A. it's very helpful to | B. regularly conduct assessments of the | C. Current performance of the organization. | D. When seeking to improve the performance of an organization", o: ["ABCD", "DCBA", "DABC", "CBDA"], c: 2 },
  { q: "Choose the correct sequence: A. whether explicitly or implicitly, | B. it helps to have some basis by which | C. Once you've conducted assessments of your organization, | D. To analyse the results.", o: ["CABD", "DCBA", "ADCB", "ACBD"], c: 0 },
  { q: "Choose the correct sequence: A. looking for ways to have their work make a | B. In my travels around the country providing workshops on the topic of working spiritually, | C. Difference and to feel energized in a richer way in their work. | D. I've found consistently that people are", o: ["DCAB", "CBAD", "BDAC", "CABD"], c: 2 },
  { q: "Keeping sentences 1 and 6 fixed, order A-D between them.\n1. Operations management focuses on carefully managing the processes to produce and distribute products and services.\nA. Major, overall activities often include product creation, development, production and distribution.\nB. Related activities include managing purchases, inventory control, quality control, storage, logistics and evaluations of processes.\nC. A great deal of focus is on efficiency and effectiveness of processes.\nD. Therefore, operations management often includes substantial measurement and analysis of internal processes.\n6. Ultimately, the nature of how operations management is carried out in an organization depends very much on the nature of the products or services in the organization.", o: ["ADBC", "CDBA", "DCBA", "ABCD"], c: 3 },
  { q: "Keeping sentences 1 and 6 fixed, order A-D between them.\n1. Waiting time is the third generic service output.\nA. The lower the waiting time, the higher the level of supply chain service.\nB. Waiting time is defined as the amount of time the customer must wait between ordering and receiving products.\nC. In the personal computer industry, a consumer may visit an electronics or computer specialty store, make a purchase, and carry home a computer with literally no waiting time.\nD. Alternative supply chains offer consumers and end users choices in terms of the amount of waiting time required.\n6. Alternatively, the customer may order from a catalogue or via the Internet and wait for delivery to the home or office.", o: ["BCDA", "CBDA", "DCBA", "BADC"], c: 3 },
  { q: "Keeping sentences 1 and 6 fixed, order A-D between them.\n1. Supply chains provide additional service outputs to their customers.\nA. The point to keep in mind is that there is no such thing as a homogeneous market where all consumers desire the same services presented in the same way.\nB. They may differ in terms of which services are most important and in terms of the level of each of the services desired to accommodate their needs.\nC. For example, some consumers may require immediate availability of a personal computer while others feel that waiting 3 days for a computer configured to their exact requirements is preferable.\nD. In addition to the four generic service outputs discussed above, other researchers have identified services related to information, product customization, and after-sales support as critical to selected customers.\n6. Additionally, customers differ in terms of how much they are willing to pay for services.", o: ["DABC", "CBDA", "DCBA", "DBAC"], c: 0 },
  { q: "Keeping sentences 1 and 6 fixed, order A-D between them.\n1. The word hiring is sometimes used interchangeably with staffing, which does an injustice to the broad scope of activities involved in staffing.\nA. Even before a new employee is hired to do a job, the job should be clearly designed or defined.\nB. Jobs are usually designed by conducting a job analysis, which includes examining the tasks and sequences of tasks necessary to perform the job.\nC. Hiring might be thought more specifically as screening the best job candidates, but especially making a formal job offer to the best candidate.\nD. A job is a collection of tasks and responsibilities that an employee is responsible to conduct. Jobs have titles.\n6. A task is typically defined as a unit of work, that is, a set of activities needed to produce some result.", o: ["ADBC", "BCAD", "CBAD", "CADB"], c: 2 },
  { q: "Keeping sentences 1 and 6 fixed, order A-D between them.\n1. The decision about what approach to take to training depends on several factors.\nA. These factors include the amount of funding available for training, specificity and complexity of the knowledge and skills needed, timeliness of training needed, and capacity and motivation of the learner.\nB. Self-directed, informal learning can be very low-cost, however the learner should have the capability and motivation to pursue their own training.\nC. Other-directed, formal training is typically more expensive than other approaches, but is often the most reliable to use for the learner to achieve the desired knowledge and skills in a timely fashion.\nD. Training may take longer than other-directed forms.\n6. Highly specific and routine tasks can often be trained without complete, formal approaches.", o: ["ACBD", "DCBA", "CBDA", "ABDC"], c: 3 },
].map(x => ({ question: x.q, options: x.o, correctIndex: x.c, difficulty: "Hard", tags: ["Sentence Rearrangement"] }));

const VOCAB = [
  { q: "He brought him ________ with great difficulty.", o: ["about", "in", "up", "over"], c: 2 },
  { q: "Choose the word closest in meaning to VITUPERATE.", o: ["abuse", "rebuke", "praise", "retort"], c: 2 },
  { q: "The young, thin boy surprised his wrestling opponent with his ________ strength.", o: ["fraudulent", "wiry", "frolicsome", "pretentious"], c: 1 },
  { q: "An extremely deep crack or opening in the ground is a", o: ["Chasm", "Aperture", "Ditch", "Pit"], c: 0 },
  { q: "Modern ________ (choose the correct suffix)", o: ["ity", "ty", "ize", "ite"], c: 0 },
  { q: 'Find the error: "He took to (A) / reading times (B) / for better knowledge (C) / of the facts (D)"', o: ["he took to", "reading times", "for better knowledge", "of the facts"], c: 1 },
  { q: "Which of these is the root-word match for 'Likelihood'?", o: ["liken", "likely", "like", "likeable"], c: 2 },
  { q: "With Justine's ________ nature and passion for art, she would make an excellent tour guide for the museum.", o: ["volatile", "congenial", "servile", "fledgling"], c: 1 },
  { q: "\"The train had left.\" Identify the tense.", o: ["past perfect", "past continuous", "past future", "simple present"], c: 0 },
  { q: "Convert to passive voice: \"You will have finished this work by tomorrow.\"", o: ["This work will be finished by tomorrow.", "This work will finished tomorrow.", "This work will have been finished by tomorrow.", "This work will have been finished tomorrow."], c: 2 },
  { q: "Combine the sentences: \"He may be innocent. I do not know.\" a) I doubt | b) I do not | c) That he is", o: ["Only A", "Only B", "Only C", "A & B"], c: 1 },
  { q: "Choose the word closest in meaning to CONVIVIAL.", o: ["prodigal", "serious", "disloyal", "friendly"], c: 3 },
  { q: "If he is averse ________ recommending my name, he should not hesitate to admit it.", o: ["about", "for", "to", "against"], c: 2 },
  { q: "Choose the word closest in meaning to EPITOMIZE.", o: ["disappoint", "distend", "exemplify", "generate"], c: 2 },
  { q: "According to pirate lore, a terrible ________ would follow whoever opened the treasure chest.", o: ["precursor", "precession", "rendition", "malediction"], c: 3 },
].map(x => ({ question: x.q, options: x.o, correctIndex: x.c, difficulty: "Medium", tags: ["Vocabulary"] }));

const ROUND_1_CATEGORIES = [
  { name: "Idioms & Proverbs", questions: IDIOMS },
  { name: "One-Word Substitutions", questions: ONE_WORD },
  { name: "Passage Fill-in-the-Blanks (Cloze Test)", questions: CLOZE },
  { name: "Spelling Identification", questions: SPELLING },
  { name: "Grammar & Error Spotting", questions: GRAMMAR },
  { name: "Sentence Rearrangement & Logical Sequence", questions: REARRANGE },
  { name: "Vocabulary & English Mechanics", questions: VOCAB },
];

// ---------------------------------------------------------------------------
// Round 2: Aptitude Assessment
// ---------------------------------------------------------------------------

const ROUND_2 = {
  name: "Aptitude Assessment",
  description: "Quantitative, Logical Reasoning and Verbal Ability - evaluates mathematical problem-solving, logical deduction, and English grammar. Often includes game-based aptitude modules.",
  duration: "",
  passingMarks: "",
  instructions: "",
};

const QUANT = [
  { q: "Express a speed of 36 kmph in meters per second?", o: ["10 mps", "12 mps", "14 mps", "17 mps"], c: 0 },
  { q: "Express 25 mps in kmph?", o: ["15 kmph", "99 kmph", "90 kmph", "None"], c: 2 },
  { q: "The speed of a train is 90 kmph. What is the distance covered by it in 10 minutes?", o: ["15 km", "12 km", "10 km", "5 km"], c: 0 },
  { q: "A car covers a distance of 624 km in 6 1/2 hours. Find its speed?", o: ["104 kmph", "140 kmph", "104 mph", "10.4 kmph"], c: 0 },
  { q: "A and B together can complete a piece of work in 6 days. A alone can do it in 10 days. In how many days can B alone do it?", o: ["3.75 days", "15 days", "12 days", "6 days"], c: 1 },
  { q: "A can do a piece of work in 4 days. B can do it in 5 days. With the assistance of C they completed the work in 2 days. Find in how many days can C alone do it?", o: ["10 days", "20 days", "5 days", "4 days"], c: 1 },
  { q: "A, B and C can do a piece of work in 24, 30 and 40 days respectively. They start the work together but C leaves 4 days before the completion of the work. In how many days is the work done?", o: ["15 days", "14 days", "13 days", "11 days"], c: 3 },
  { q: "5 men and 12 boys finish a piece of work in 4 days, 7 men and 6 boys do it in 5 days. The ratio between the efficiencies of a man and boy is?", o: ["1:2", "2:1", "2:3", "6:5"], c: 3 },
  { q: "A and B can finish a work in 16 days while A alone can do the same work in 24 days. In how many days B alone will complete the work?", o: ["56", "48", "36", "58"], c: 1 },
  { q: "Some persons can do a piece of work in 12 days. Two times the number of these people will do half of that work in?", o: ["3 days", "4 days", "6 days", "12 days"], c: 0 },
  { q: "What number has a 5:1 ratio to the number 10?", o: ["42", "50", "55", "62"], c: 1 },
  { q: "Two same glasses are respectively 1/4th and 1/5th full of milk. They are then filled with water and the contents mixed in a tumbler. The ratio of milk and water in the tumbler is?", o: ["3:8", "9:31", "8:21", "10:27"], c: 1 },
  { q: "A and B entered a partnership investing Rs.25000 and Rs.30000 respectively. After 4 months C also joined the business with an investment of Rs.35000. What is the share of C in an annual profit of Rs.47000?", o: ["Rs.16000", "Rs.15000", "Rs.17000", "Rs.14000"], c: 3 },
  { q: "In how many years does a sum of Rs. 5000 yield a simple interest of Rs. 16500 at 15% p.a.?", o: ["22", "24", "25", "23"], c: 0 },
  { q: "The radius of a circle is increased by 1%. Find how much % does its area increase?", o: ["1.01%", "5.01%", "3.01%", "2.01%"], c: 3 },
  { q: "Fill in the gap: 18/3 + 2/9 + 7/3 + ? = 158/63", o: ["145/21", "11/21", "111/63", "145/63"], c: 1 },
  { q: "Calculate: 1/√3 + 1/(2√3) + 1/(3√3) = ?", o: ["11/6√3", "6√3/11", "2√3/11", "3√3/11"], c: 0 },
  { q: "Solve for ?: (13 5/8 + 9 3/8) - (15 2/5 + 7 3/5) = ?", o: ["0", "23", "46", "64"], c: 0 },
  { q: "Calculate: 5/13 × 6/13 × 5 19/30 = ?", o: ["0", "1/13", "2/13", "1"], c: 3 },
  { q: "Simplify: ((856+167)^2 + (856-167)^2) / ((856×856) + (167×167))", o: ["1", "2", "689", "1023"], c: 1 },
  { q: "What least value must be given to * so that the number 451*603 is exactly divisible by 9?", o: ["2", "5", "8", "7"], c: 2 },
  { q: "On dividing a number by 999, the quotient is 366 and the remainder is 103. The number is", o: ["364724", "365737", "365387", "366757"], c: 1 },
  { q: "The HCF of two numbers is 11 and their LCM is 7700. If one of these numbers is 275, then the other one is", o: ["279", "283", "318", "308"], c: 3 },
  { q: "Find the greatest fraction among 41/37, 41/27, 41/17, 41/7", o: ["41/7", "41/17", "41/27", "41/77"], c: 0 },
  { q: "Calculate: (75983×75983 - 45983×45983) / 30000 = ?", o: ["121796", "121966", "121866", "121956"], c: 1 },
  { q: "(51 + 52 + 53 + ... + 100) is equal to", o: ["3775", "2525", "2975", "3225"], c: 0 },
  { q: "A gardener arranges 441 plants in such a way that each row contains as many plants as there are rows. Find the number of plants in a row.", o: ["20", "22", "21", "23"], c: 2 },
  { q: "The greatest possible length of scale to measure exactly 6 mt 25 cm, 9 mtr 50 cm and 12 mt 25 cm is", o: ["50 cm", "25 cm", "125 cm", "none of these"], c: 1 },
  { q: "Which of the following numbers is prime?", o: ["117", "147", "159", "149"], c: 3 },
  { q: "A boy was asked to multiply a number by 7/8. Instead he divided the number by 7/8 and got a result 15 more than the correct result. What was the number?", o: ["96", "36", "56", "65"], c: 2 },
].map(x => ({ question: x.q, options: x.o, correctIndex: x.c, difficulty: "Medium", tags: ["Quantitative"] }));

const LOGICAL = [
  { q: "Class A has a higher enrollment than Class B. Class C has a lower enrollment than Class B. Class A has a lower enrollment than Class C. If the first two statements are true, the third statement is", o: ["true", "false", "uncertain", "None"], c: 1 },
  { q: "All animals have", o: ["Eyes", "Four legs", "Horns", "Instincts"], c: 3 },
  { q: "Argument: Comfort Stationers' new smooth-flow pen and gradual-friction paper reduce finger strain and allow faster writing, therefore replacing your pen and paper with these products reduces the cost of clerical jobs. Which of the following, if true, would most weaken this conclusion?", o: [
    "Those already using the new products report greater difficulty switching back to regular ones than switching to the new ones.",
    "The cost of manufacturing the new products is no higher than the regular ones, and the new products last longer.",
    "The number of offices using the products is increasing month by month.",
    "These products must be purchased in huge lots and stored in special conditions - procurement and storage costs are quite high.",
  ], c: 3 },
  { q: "Choose the alternative that continues the pattern: 2, 3, 5, 7, 11, (....), 17", o: ["12", "13", "14", "15"], c: 1 },
  { q: "Event (A): The Archaeological Survey of India found no evidence the Rama Sethu is man-made. Event (B): Mt. Kailash, a natural formation, is considered holy by Hindus and Buddhists worldwide. What is the relationship between A and B?", o: ["A is the cause, B is its effect", "B is the cause, A is its effect", "Both are independent causes", "Both are effects of independent causes"], c: 3 },
  { q: "Statement: The principal instructed all teachers to be careful in class because some students may disturb others. Assumptions: I. Teachers may handle the situation and restrict naughty students. II. The students will welcome the principal's decision.", o: ["Only assumption I is implicit", "Only assumption II is implicit", "Either I or II is implicit", "Neither I nor II is implicit"], c: 0 },
  { q: "Labourer is related to wages in the same way as an entrepreneur is related to?", o: ["Loan", "Interest", "Taxes", "Profit"], c: 3 },
  { q: "Event (A): Company X is opening an office in city Y to market its products. Event (B): Company X has an expansion plan to raise production capacity at its existing plants. What is the relationship between A and B?", o: ["A is the effect, B its immediate/principal cause", "B is the effect, A its immediate/principal cause", "A is the effect, but B is not its immediate/principal cause", "B is the effect, but A is not its immediate/principal cause"], c: 2 },
  { q: "Statement: Cutting down forests threatens wildlife; many species are near extinction. Courses of action: I. Protect endangered species via wildlife sanctuaries with native flora. II. Stop deforestation as much as possible. III. Grow urban forests to compensate.", o: ["Only II follows", "Only III follows", "Only I and II follow", "Only I and III follow"], c: 2 },
  { q: "Find the next number in the series: 522 1235 2661 4800 7652 11217 ?", o: ["15495", "16208", "14782", "16921"], c: 0 },
  { q: "Trees : Branches ::", o: ["River : Tributaries", "Continent : Island", "Stream : Delta", "Ocean : Seas"], c: 0 },
  { q: "Relax : work ::", o: ["Play : Cheat", "Lunch : Dinner", "Smile : Laugh", "Fresh : Stale"], c: 3 },
  { q: "Square : Cube ::", o: ["Line : Cylinder", "Triangle : Prism", "Circle : Sphere", "Sphere : Earth"], c: 2 },
  { q: "Carnivore : Herbivore ::", o: ["Animal : Bird", "Camel : Giraffe", "Flesh : Plant", "Horse : Lion"], c: 2 },
  { q: "Accident : Mishap ::", o: ["Abrupt : Sudden", "Eminent : Notorious", "Pacify : Provoke", "Dearth : Plenty"], c: 0 },
  { q: "Which of the following belongs with flood, fire, cyclone?", o: ["Damage", "Earthquake", "Rain", "Accident"], c: 1 },
  { q: "Which of the following belongs with rabbit, rat, mole?", o: ["Mongoose", "Frog", "Earthworm", "Ant"], c: 0 },
  { q: "Which of the following belongs with measles, rabies, cancer?", o: ["Pneumonia", "Diabetes", "Tetanus", "Hepatitis"], c: 2 },
  { q: "Which of the following belongs with wrestling, karate, boxing?", o: ["Swimming", "Judo", "Pole Vault", "Polo"], c: 1 },
  { q: "In a certain code, MONKEY is written as XDJMNL. How is TIGER written in that code?", o: ["QDFHS", "SDFHS", "SHFDQ", "UJHFS"], c: 0 },
  { q: "If in a certain language NATURE is coded as MASUQE, how is FAMINE coded in that language?", o: ["FBMJND", "FZMHND", "GANIOE", "EALIME"], c: 1 },
  { q: "If clock is called television, television is called oven, oven is called grinder, and grinder is called iron, in what will a lady bake?", o: ["Radio", "Oven", "Grinder", "Iron"], c: 2 },
  { q: "If train is called bus, bus is called tractor, tractor is called car, car is called scooter, scooter is called bicycle, and bicycle is called moped, which of these is used to plough a field?", o: ["train", "bus", "tractor", "car"], c: 3 },
  { q: "A man is facing south. He turns 135 degrees anticlockwise, then 180 degrees clockwise. Which direction is he facing now?", o: ["North-East", "North-West", "South-East", "South-West"], c: 3 },
].map(x => ({ question: x.q, options: x.o, correctIndex: x.c, difficulty: "Medium", tags: ["Logical Reasoning"] }));

const PUZZLES = [
  { q: "Arti, Banti, Chetan and Dolly together have Rs.100. Arti and Banti together have as much as Chetan and Dolly combined. Arti has more money than Banti. Chetan has half as much as Dolly. Arti has Rs.5 more than Dolly. Who has the most money?", o: ["Arti", "Dolly", "Chetan", "Cannot be determined"], c: 0 },
  { q: "(Same puzzle as above.) How much does Banti have?", o: ["12.03", "11.6", "13.3", "None of these"], c: 1 },
  { q: "(Same puzzle as above.) Who has the second biggest sum?", o: ["Arti", "Chetan", "Dolly", "Banti"], c: 2 },
  { q: "(Same puzzle as above.) What is the ratio of the amount with Chetan and Dolly?", o: ["2:1", "1:2", "1:3", "1:4"], c: 1 },
  { q: "(Same puzzle as above.) Who has the least amount of money?", o: ["Banti", "Arti", "Chetan", "Dolly"], c: 0 },
  { q: "A machine follows: Step1 X=0,A=2,B=3. Step2 If X<5 do Steps 3-6 else Step7. Step3 Y=A+B, replace A by B, replace B by Y. Step4 Type Y. Step5 Increase X by 2. Step6 Goto Step2. Step7 Exit. When X=4, what value of Y is typed?", o: ["12", "8", "13", "5"], c: 2 },
  { q: "(Same machine.) Suppose Step 5 is replaced by 'Increase X by 5' - what would be the last value of Y typed?", o: ["5", "4", "6", "9"], c: 0 },
  { q: "(Same machine, with the original Step 5.) After the instructions finish at Step 7, what is the value of X?", o: ["5", "4", "3", "7"], c: 1 },
  { q: "Five brothers A-E have a pair of twins among them who are neither the oldest nor the youngest. E is older than C but younger than B. D is younger than 3 brothers. Who is the youngest?", o: ["A", "B", "C", "D"], c: 2 },
  { q: "(Same puzzle as above.) Who is one of the twin pair?", o: ["B", "C", "D", "E"], c: 3 },
  { q: "(Same puzzle as above.) Who is the eldest?", o: ["A", "B", "C", "E"], c: 1 },
  { q: "(Same puzzle as above.) Who has as many elder brothers as younger brothers?", o: ["A", "B", "E", "none of these"], c: 0 },
  { q: "(Same puzzle as above.) Who is the fourth brother (by age, from oldest)?", o: ["A", "B", "D", "E"], c: 2 },
  { q: "Five Mumbai offices are run by five couples (husbands Bala/Girish/Jai/Jayesh/Pratap; wives Beena/Chand/Maya/Preeti/Sangeeta; surnames Bakshi/Joshi/Natwar/Parikh/Sahni; offices Air India/Jet/Ashiana/Indian Court/American Court). No husband shares a first-name initial with his wife; exactly one husband (not Pratap) shares his first-name initial with his own surname. Air India is run by Jai and his wife. Girish and Maya are a couple. Chand's husband is Mr. Natwar. Mrs. Joshi owns Jet; Preeti owns American Court; neither is married to Jayesh. The Sahnis' office name includes 'Court'. Ashiana isn't run by Mr. Parikh, whose wife isn't Sangeeta. Who is Jai's wife?", o: ["Preeti", "Chand", "Maya", "Beena"], c: 3 },
  { q: "(Same puzzle as above.) Which restaurant/office do the Sahnis run?", o: ["Ashiana", "Air India", "Jet", "Indian Court"], c: 3 },
  { q: "(Same puzzle as above.) Which of the men has the surname Natwar?", o: ["Bala", "Pratap", "Jai", "Jayesh"], c: 3 },
  { q: "(Same puzzle as above.) Which of these women is Mrs. Joshi?", o: ["Preeti", "Chandni", "Sangeeta", "Beena"], c: 2 },
  { q: "(Same puzzle as above.) What is Bala's surname?", o: ["Parikh", "Joshi", "Bakshi", "Sahni"], c: 2 },
  { q: "A rearrangement machine moves the smallest remaining number to the front, then the largest remaining number to the end, alternating, each step. For the input 101 85 66 49 73 39 142 25 115 74, how many steps are needed to reach the final sorted output?", o: ["5", "6", "7", "8"], c: 3 },
  { q: "Organizing a newspaper needs 4 editors (managing, news, sports, entertainment). The managing editor cannot start until each of the others has completed at least one full day of work. Given a Monday-start week, when is the earliest the managing editor can work?", o: ["Wednesday afternoon", "Friday morning", "Monday morning", "Thursday afternoon"], c: 1 },
  { q: "(Same scenario.) One editor must work completely alone for a full day to avoid confusion, without any other editor losing available time. Which is the only valid option?", o: ["The news editor on Tuesday", "The managing editor on Friday", "The sports editor on Monday", "The entertainment editor on Thursday"], c: 0 },
  { q: "A chair manufacturer's installed capacity was 3 lac units in 1994, growing at a stated schedule through 1996. Given the source's production/price figures, what was the total sales revenue in 1996?", o: ["1,900,360", "2,066,680", "1,890,560", "2,135,500"], c: 1 },
  { q: "(Same scenario.) What was the total market size in 1997?", o: ["84.39 lac", "86.45 lac", "79.69 lac", "cannot be determined"], c: 1 },
].map(x => ({ question: x.q, options: x.o, correctIndex: x.c, difficulty: "Hard", tags: ["Puzzles", "Data Arrangement"] }));

const ROUND_2_CATEGORIES = [
  { name: "Quantitative", questions: QUANT },
  { name: "Logical & Analytical Reasoning", questions: LOGICAL },
  { name: "Data Arrangement & Puzzles", questions: PUZZLES },
];

// ---------------------------------------------------------------------------
// Round 3: Technical Assessment
// ---------------------------------------------------------------------------

const ROUND_3 = {
  name: "Technical Assessment",
  description: "Cluster-based test on CS fundamentals (OOP, DBMS, OS, Networks) alongside 1-2 coding questions. High scorers get flagged for GenC Elevate or GenC Next.",
  duration: "",
  passingMarks: "",
  instructions: "The OOP/DBMS/DSA/OS & Networks categories below are MCQ-ified from open Q&A in the source material - the correct answer is the source's own answer, the 3 wrong options are illustrative distractors, not official Cognizant material.",
};

const IT_BASICS = [
  { q: "The weight of an object would be minimum when it is placed at the", o: ["North pole", "South pole", "Equator", "Centre of the earth"], c: 3 },
  { q: "A car and a loaded truck are moving with the same speed along a road. As compared to the truck, the car shall possess", o: ["More kinetic energy", "More potential energy", "Less kinetic energy", "Less potential energy"], c: 2 },
  { q: "When two bodies stick together after collision, the collision is said to be", o: ["Partially elastic", "Elastic", "Inelastic", "None of the above"], c: 2 },
  { q: "A red hot steel bar is an example of", o: ["Mechanical Energy", "Vibrational Energy", "Kinetic Energy", "None of the above"], c: 3 },
  { q: "The time taken by light to travel from the sun to the earth is approximately", o: ["8 seconds", "8 minutes", "8 hours", "8 light years"], c: 1 },
  { q: "The velocity of sound is largest in", o: ["Air", "Water", "Oil", "Steel"], c: 3 },
  { q: "The super sonic speed of an aeroplane is expressed in", o: ["Mach number", "Decibel", "Hertz", "None of them"], c: 0 },
  { q: "The quality of sound is judged by", o: ["Its frequency", "Its various over-tones", "longer wave lengths", "All the above"], c: 1 },
  { q: "One can't hear sound on the moon because it has no", o: ["Light", "Atmosphere", "Darkness", "None of the above"], c: 1 },
  { q: "A spherical mirror is nothing but", o: ["A spherical ball polished on its surface", "A plane mirror only", "A large number of plane mirrors equally inclined to each other", "None of the above"], c: 0 },
  { q: "The types of radiation emitted by a radioactive substance are", o: ["Alpha rays", "Beta rays", "Gamma rays", "All of these"], c: 3 },
  { q: "Which of the following comets appears after 76 years?", o: ["Halley's", "Hale-Bopp's", "Donati's", "Alpha Centauri"], c: 0 },
  { q: "The angle in the case of a water molecule is approximately", o: ["90 degrees", "180 degrees", "105 degrees", "75 degrees"], c: 2 },
  { q: "Atoms with the same atomic number but different mass numbers are called", o: ["Isotones", "Isobars", "Isomers", "Isotopes"], c: 3 },
  { q: "Which type of cell division occurs in cancer cells?", o: ["Mitosis", "Meiosis", "Both mitosis and meiosis", "Cell division doesn't occur"], c: 0 },
  { q: "The sensation of fatigue in the muscles after prolonged strenuous physical work is caused by", o: ["Decrease in supply of oxygen", "Minor wear and tear of muscle fibres", "Accumulation of lactic acid", "None of the above"], c: 2 },
  { q: "Milk, meat and eggs are good sources of", o: ["Fats", "Carbohydrates", "Proteins", "Vitamins"], c: 2 },
  { q: "Saffron is dried", o: ["Flower buds", "Styles", "Stigmas", "Perianth"], c: 2 },
  { q: "Which animal uses sound as its \"eyes\"?", o: ["Dog", "Bat", "Cat", "Snake"], c: 1 },
  { q: "Computer speed is measured in", o: ["Kilobyte", "Bits", "Hertz", "Megabyte"], c: 2 },
].map(x => ({ question: x.q, options: x.o, correctIndex: x.c, difficulty: "Medium", tags: ["General Science"] }));

const OOP = [
  { q: "What is the process of hiding the implementation details and showing only the functionality to the user called?", o: ["Abstraction", "Encapsulation", "Polymorphism", "Inheritance"], c: 0 },
  { q: "Which OOP concept binds code and the data it manipulates into a single unit?", o: ["Abstraction", "Encapsulation", "Inheritance", "Polymorphism"], c: 1 },
  { q: "What is it called when a child class re-implements a method already provided by its parent class?", o: ["Method Overloading", "Constructor Chaining", "Method Overriding (Runtime Polymorphism)", "Data Hiding"], c: 2 },
  { q: "Can you instantiate an Abstract Class in Java?", o: ["Yes, always", "Yes, but only with a factory method", "No, abstract classes cannot be instantiated directly", "Only if it has no abstract methods"], c: 2 },
  { q: "What is the difference between a Class and an Object?", o: ["A class is an instance of an object", "A class is a blueprint/template; an object is a real-world instance of that class", "A class and an object are the same thing", "An object is a static member of a class"], c: 1 },
  { q: "Which access modifier makes a variable visible only within its own class?", o: ["public", "protected", "default", "private"], c: 3 },
  { q: "What is a constructor?", o: ["A method that destroys objects", "A static utility method", "A special method used to initialize objects - same name as the class, no return type", "A method that must always return a value"], c: 2 },
  { q: "Can a class inherit from multiple classes in Java or C#?", o: ["Yes, up to 3 classes", "Yes, without restriction", "No - Java/C# don't support multiple inheritance with classes (only with interfaces)", "Only in Java, not C#"], c: 2 },
  { q: "What is Method Overloading?", o: ["Redefining a parent method in a child class", "Multiple methods in the same class with the same name but different parameters (compile-time polymorphism)", "Having one method call itself", "Hiding a method from subclasses"], c: 1 },
  { q: "What is the super keyword used for in Java?", o: ["To declare a class as final", "A reference variable used to refer to the immediate parent class object", "To create a new thread", "To mark a method as abstract"], c: 1 },
  { q: "What is the purpose of the final keyword in Java?", o: ["Marks a method as abstract", "Allows multiple inheritance", "Restricts the user - final variables can't change, final methods can't be overridden, final classes can't be inherited", "Declares a variable as static"], c: 2 },
  { q: "What is a default constructor?", o: ["A constructor that must be private", "A constructor that takes no arguments - the compiler provides one automatically if none is written", "The last constructor defined in a class", "A constructor that always throws an exception"], c: 1 },
  { q: "What does the \"IS-A\" relationship represent in OOP?", o: ["Inheritance (e.g. a Car IS-A Vehicle)", "Association/Composition", "Encapsulation", "Polymorphism"], c: 0 },
  { q: "What does the \"HAS-A\" relationship represent in OOP?", o: ["Inheritance", "Association/Composition (e.g. a Car HAS-A Engine)", "Abstraction", "Method Overriding"], c: 1 },
  { q: "Does C++ support multiple inheritance?", o: ["No, never", "Only through interfaces", "Yes", "Only in C++20 and later"], c: 2 },
  { q: "What is a Destructor?", o: ["A method that creates a new object", "A method that overloads an operator", "A method automatically invoked when an object is destroyed or goes out of scope, used to free resources", "A static initializer block"], c: 2 },
].map(x => ({ question: x.q, options: x.o, correctIndex: x.c, difficulty: "Medium", tags: ["OOP"] }));

const DBMS = [
  { q: "What does ACID stand for in DBMS?", o: ["Association, Consistency, Integrity, Dependency", "Atomicity, Consistency, Isolation, Durability", "Atomicity, Concurrency, Isolation, Duration", "Accuracy, Consistency, Isolation, Durability"], c: 1 },
  { q: "What is the difference between DELETE and TRUNCATE?", o: ["DELETE is DDL, TRUNCATE is DML", "Both can always be rolled back", "DELETE is DML and can be rolled back (removes rows one by one); TRUNCATE is DDL, cannot be rolled back (deletes all rows at once)", "TRUNCATE removes the table structure, DELETE doesn't"], c: 2 },
  { q: "What is a Primary Key?", o: ["A key that can contain duplicate values", "A column (or set of columns) that uniquely identifies each row and cannot contain NULL", "A key that links two tables together", "A key that can be NULL but not duplicated"], c: 1 },
  { q: "What is a Foreign Key?", o: ["A key that must be unique within its own table", "A key used only for indexing", "A field in one table that uniquely identifies a row of another table, linking the two", "A key that enforces the primary key's data type"], c: 2 },
  { q: "Which query correctly finds the second-highest salary from an Employee table?", o: [
    "SELECT MAX(Salary) FROM Employee LIMIT 2",
    "SELECT MAX(Salary) FROM Employee WHERE Salary < (SELECT MAX(Salary) FROM Employee)",
    "SELECT Salary FROM Employee ORDER BY Salary DESC",
    "SELECT MIN(Salary) FROM Employee WHERE Salary > (SELECT MIN(Salary) FROM Employee)",
  ], c: 1 },
  { q: "What is the difference between INNER JOIN and LEFT JOIN?", o: ["INNER JOIN returns all rows, LEFT JOIN only matches", "They are functionally identical", "INNER JOIN returns only matching records from both tables; LEFT JOIN returns all records from the left table plus matches from the right", "LEFT JOIN never includes NULLs"], c: 2 },
  { q: "What is Normalization?", o: ["Duplicating data across tables for speed", "The process of organizing data to reduce redundancy and improve data integrity", "Converting a database to use only one table", "Encrypting data before storage"], c: 1 },
  { q: "What is the First Normal Form (1NF)?", o: ["A table with no foreign keys", "A table where every column is indexed", "A table is in 1NF if it has no repeating groups and all attributes are atomic (single-valued)", "A table normalized to remove all NULL values"], c: 2 },
  { q: "What is a trigger in SQL?", o: ["A manual script run by the DBA", "A type of index", "A constraint that prevents deletion", "A stored procedure that automatically fires in response to INSERT/UPDATE/DELETE on a table"], c: 3 },
  { q: "What does the GROUP BY clause do?", o: ["Sorts rows alphabetically", "Groups rows with the same values into summary rows, typically used with aggregate functions", "Filters rows before aggregation", "Removes duplicate rows"], c: 1 },
  { q: "What is the difference between WHERE and HAVING?", o: ["They are interchangeable", "HAVING filters rows before aggregation, WHERE filters after", "WHERE filters rows before aggregation; HAVING filters groups after aggregation", "WHERE only works with numeric columns"], c: 2 },
  { q: "What is an Index in DBMS?", o: ["A backup copy of the table", "A constraint that enforces uniqueness only", "A data structure that improves the speed of data retrieval on a table", "A type of foreign key"], c: 2 },
  { q: "What do DDL, DML and DCL stand for?", o: ["All three refer to the same set of commands", "Data Definition (CREATE, ALTER), Data Manipulation (SELECT, INSERT, UPDATE), Data Control (GRANT, REVOKE)", "DDL handles transactions, DML defines schema", "DCL is used only for backups"], c: 1 },
  { q: "What is a View in SQL?", o: ["A physical copy of a table", "A type of index", "A virtual table based on the result-set of an SQL statement", "A stored procedure that returns void"], c: 2 },
  { q: "What is the difference between UNION and UNION ALL?", o: ["UNION ALL removes duplicates, UNION keeps them", "They both sort results descending", "UNION only works on two columns", "UNION removes duplicates; UNION ALL keeps duplicates"], c: 3 },
].map(x => ({ question: x.q, options: x.o, correctIndex: x.c, difficulty: "Medium", tags: ["DBMS", "SQL"] }));

const DSA = [
  { q: "Which data structure operates on a Last-In-First-Out (LIFO) principle?", o: ["Stack", "Queue", "Linked List", "Tree"], c: 0 },
  { q: "Which data structure operates on a First-In-First-Out (FIFO) principle?", o: ["Stack", "Queue", "Hash Table", "Graph"], c: 1 },
  { q: "What is the time complexity of searching an element in a Binary Search Tree (BST) in the worst case?", o: ["O(log n) always", "O(n) (if the tree is highly skewed)", "O(1)", "O(n log n)"], c: 1 },
  { q: "What is the time complexity of Binary Search on a sorted array?", o: ["O(n)", "O(log n)", "O(n^2)", "O(1)"], c: 1 },
  { q: "Which sorting algorithm has the best average-case time complexity?", o: ["Bubble Sort", "Selection Sort", "Merge Sort / Quick Sort (O(n log n))", "Insertion Sort"], c: 2 },
  { q: "What is a Linked List?", o: ["A fixed-size, contiguous block of memory", "A key-value lookup structure", "A linear data structure of nodes, each holding data and a pointer to the next node", "A hierarchical tree of parent-child nodes"], c: 2 },
  { q: "What is the key difference between an Array and a Linked List?", o: ["Arrays are always slower to access than Linked Lists", "Linked Lists require a fixed size at declaration", "Arrays have fixed size and contiguous memory; Linked Lists have dynamic size and non-contiguous memory", "They are functionally identical in memory layout"], c: 2 },
  { q: "What is a Hash Table?", o: ["A table that stores only sorted numeric keys", "A data structure that maps keys to values for efficient lookup/insertion/deletion via a hash function", "A structure that stores data in strict insertion order only", "A type of binary tree"], c: 1 },
  { q: "What is a graph data structure?", o: ["A strictly hierarchical structure with one root", "A linear sequence of connected nodes", "A non-linear data structure of nodes (vertices) and edges connecting them", "A fixed 2D array of values"], c: 2 },
  { q: "What is Recursion?", o: ["A loop that never terminates", "A function that calls a different function repeatedly", "A function calling itself to solve a smaller instance of the same problem, stopping at a base case", "A technique for sorting arrays in place"], c: 2 },
].map(x => ({ question: x.q, options: x.o, correctIndex: x.c, difficulty: "Medium", tags: ["DSA"] }));

const OS_NETWORKS = [
  { q: "What is the OSI Model, and how many layers does it have?", o: ["A 5-layer model", "The TCP/IP model with 4 layers", "Open Systems Interconnection model - 7 layers (Physical, Data Link, Network, Transport, Session, Presentation, Application)", "A 6-layer model with no Session layer"], c: 2 },
  { q: "What is the difference between TCP and UDP?", o: ["UDP is reliable and TCP is not", "Both guarantee delivery equally", "TCP is connection-oriented, reliable and guarantees delivery; UDP is connectionless, faster, no delivery guarantee", "TCP is used only for streaming"], c: 2 },
  { q: "What is an IP address?", o: ["A hardware serial number burned into the NIC", "A password used to access a router", "A unique string of numbers identifying each device on a network using the Internet Protocol", "A DNS record type"], c: 2 },
  { q: "What is the purpose of DNS?", o: ["Encrypts traffic between client and server", "Assigns MAC addresses to devices", "Translates human-readable domain names into machine-readable IP addresses", "Compresses data for faster transfer"], c: 2 },
  { q: "What is the difference between a Process and a Thread?", o: ["A thread is heavier than a process", "They are the same thing", "A process can only ever have one thread", "A process is a program in execution (heavyweight); a thread is a smaller segment of a process that runs concurrently (lightweight)"], c: 3 },
  { q: "What is a Deadlock?", o: ["A process that has finished execution", "A memory leak caused by unfreed pointers", "A situation where processes are blocked, each holding a resource and waiting for another held by another process", "A CPU running at 100% utilization"], c: 2 },
  { q: "What are the four necessary conditions for Deadlock?", o: ["Starvation, Priority Inversion, Thrashing, Paging", "Mutual Exclusion, Hold and Wait, No Preemption, Circular Wait", "Mutual Exclusion, Preemption, Linear Wait, Isolation", "Atomicity, Consistency, Isolation, Durability"], c: 1 },
  { q: "What is Virtual Memory?", o: ["Memory that exists only inside the CPU cache", "A backup RAM module", "A memory management capability giving the illusion of a large main memory by transferring data between RAM and disk", "Memory reserved exclusively for the OS kernel"], c: 2 },
  { q: "What is Paging in OS?", o: ["A technique for compressing files on disk", "A way of numbering pages in a printed document", "A memory management scheme dividing physical memory into fixed-size blocks called frames, avoiding contiguous allocation", "A method of prioritizing processes in the scheduler"], c: 2 },
  { q: "What is the difference between HTTP and HTTPS?", o: ["HTTP is encrypted and HTTPS is not", "They use the same port number", "HTTPS is only used for downloading files", "HTTPS adds SSL/TLS encryption; HTTP sends data in plain text"], c: 3 },
  { q: "What port does HTTP use by default?", o: ["Port 80", "Port 443", "Port 21", "Port 8080"], c: 0 },
  { q: "What is a MAC address?", o: ["A software-assigned address that changes every session", "The same thing as an IP address", "A hardware identification number that uniquely identifies each device on a network, assigned to the NIC", "A password used for Wi-Fi authentication"], c: 2 },
  { q: "What is thrashing in an OS?", o: ["A CPU scheduling algorithm", "A type of deadlock", "A network congestion event", "A situation where the OS spends more time paging than executing actual processes"], c: 3 },
  { q: "What is a socket in networking?", o: ["A physical network cable connector", "A type of firewall rule", "One endpoint of a two-way communication link between two programs on a network", "A DNS caching mechanism"], c: 2 },
  { q: "What does a Router do?", o: ["Amplifies a Wi-Fi signal only", "Assigns domain names to IP addresses", "Encrypts all outgoing traffic", "Forwards data packets between distinct networks, operating at the Network layer"], c: 3 },
].map(x => ({ question: x.q, options: x.o, correctIndex: x.c, difficulty: "Medium", tags: ["OS", "Networks"] }));

const ROUND_3_CATEGORIES = [
  { name: "IT Basics & General Science", questions: IT_BASICS },
  { name: "OOP", questions: OOP },
  { name: "DBMS & SQL", questions: DBMS },
  { name: "Data Structures & Algorithms", questions: DSA },
  { name: "OS & Networks", questions: OS_NETWORKS },
];

// ---------------------------------------------------------------------------
// Seeding
// ---------------------------------------------------------------------------

async function seedRound(companyRef, roundMeta, categories, order) {
  const roundRef = await companyRef.collection("rounds").add({
    ...roundMeta, order, createdAt: FieldValue.serverTimestamp(),
  });
  let total = 0;
  for (let ci = 0; ci < categories.length; ci++) {
    const cat = categories[ci];
    const catRef = await roundRef.collection("categories").add({
      name: cat.name, order: ci, createdAt: FieldValue.serverTimestamp(),
    });
    let batch = db.batch();
    let inBatch = 0;
    for (let qi = 0; qi < cat.questions.length; qi++) {
      const qRef = catRef.collection("questions").doc();
      batch.set(qRef, {
        ...cat.questions[qi],
        marks: 1, explanation: cat.questions[qi].explanation || "",
        attemptCount: 0, correctCount: 0, totalTimeSec: 0,
        order: qi, createdAt: FieldValue.serverTimestamp(),
      });
      inBatch++;
      if (inBatch >= 400) { await batch.commit(); batch = db.batch(); inBatch = 0; }
    }
    if (inBatch > 0) await batch.commit();
    console.log(`  - ${cat.name}: ${cat.questions.length} question(s)`);
    total += cat.questions.length;
  }
  console.log(`Round "${roundMeta.name}": ${categories.length} categories, ${total} questions total.`);
}

async function deleteRoundCascade(roundRef) {
  const catSnap = await roundRef.collection("categories").get();
  for (const catDoc of catSnap.docs) {
    const qSnap = await catDoc.ref.collection("questions").get();
    await Promise.all(qSnap.docs.map(q => q.ref.delete()));
    await catDoc.ref.delete();
  }
  await roundRef.delete();
}

const existing = await db.collection("companies").where("name", "==", "Cognizant").get();
let companyRef;
if (!existing.empty) {
  companyRef = existing.docs[0].ref;
  console.log(`Found existing "Cognizant" company (${companyRef.id}) - this looks like manual test data (no real questions under it), so updating its metadata in place and clearing its placeholder round(s) rather than creating a duplicate.`);
  await companyRef.update({ ...COMPANY, createdAt: existing.docs[0].data().createdAt || FieldValue.serverTimestamp() });
  const oldRounds = await companyRef.collection("rounds").get();
  for (const r of oldRounds.docs) await deleteRoundCascade(r.ref);
  console.log(`Cleared ${oldRounds.size} existing round(s).`);
} else {
  companyRef = await db.collection("companies").add({ ...COMPANY, createdAt: FieldValue.serverTimestamp() });
  console.log(`Created company "Cognizant" (${companyRef.id}) as a DRAFT.`);
}
console.log("Set back to DRAFT - publish it from /admin once you've spot-checked the content.");

await seedRound(companyRef, ROUND_1, ROUND_1_CATEGORIES, 0);
await seedRound(companyRef, ROUND_2, ROUND_2_CATEGORIES, 1);
await seedRound(companyRef, ROUND_3, ROUND_3_CATEGORIES, 2);

console.log("Done.");
process.exit(0);
