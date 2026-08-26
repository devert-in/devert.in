// MRCET Independence Day special contest - Saturday 15 Aug 2026.
//
// One paper for every year, deliberately. Unlike
// seed-mrcet-yearwise-contests-2026-08-08.mjs (three year-scoped papers), this
// is a festival contest: targetScope stays mode "all" so I/II/III/IV Year all
// see the same questions and sit on the same leaderboard. That is the point -
// a first year should be able to beat a final year on GK and aptitude.
//
// Consequence of "common for all years": everything here is pitched at
// first-year-reachable. 27 objective questions (India/Independence GK,
// Independence-themed aptitude, programming fundamentals) plus 2 coding
// questions - one that is arithmetic with a single edge case, one that is a
// genuine single-pass array algorithm. Nothing assumes a syllabus a II Year
// has not reached.
//
// NOT proctored, unlike the 08 Aug papers. No camera, no fullscreen lock. This
// is a celebration contest with certificates, not a placement round, and
// requiring camera uploads from ~600 students on a holiday for a fun contest
// buys nothing.
//
// Coding grading requires devert-backend to be live with BOTH
// JUDGE0_API_KEY and FIREBASE_SERVICE_ACCOUNT_JSON set. FirebaseConfig fails
// soft, so if either is missing the MCQs still grade fine and every coding
// score silently stays 0. Verify before publishing, not after.
//
// Seeded as status "draft". Publishing is a separate deliberate step
// (--publish, or flip it in Campus > Manage > Contests).
//
// Re-running is safe: it looks for its own seedKey and refuses to duplicate.

import admin from "firebase-admin";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
admin.initializeApp({
  credential: admin.credential.cert(
    JSON.parse(readFileSync(join(__dirname, "service-account.json"), "utf8"))
  ),
});
const db = admin.firestore();
const FV = admin.firestore.FieldValue;
const TS = (iso) => admin.firestore.Timestamp.fromDate(new Date(iso));

const INSTITUTION_ID = "mrcet";
const SEED_KEY = "mrcet-independence-2026-08-15";
const PUBLISH = process.argv.includes("--publish");
const DRY_RUN = process.argv.includes("--dry-run");

// The only four values worth editing. Everything downstream - the rules text,
// the "start by" cutoff, the description - is derived from them, so changing a
// time here cannot leave a stale time printed somewhere a student reads.
//
// The window is 4.5 hours wide for a 90-minute paper, deliberately. This is
// being deployed on the morning of the contest, and a window only as wide as
// the duration means any deployment slip eats straight into student time.
// Wide window + fixed duration costs nothing: a student still gets exactly 90
// minutes whenever they start, and LAST_START below is the honest cutoff after
// which they'd get less.
const DURATION_MINUTES = 90;
const START = "2026-08-15T11:30:00+05:30";
const END = "2026-08-15T16:00:00+05:30";
const REG_START = "2026-08-14T18:00:00+05:30";

// Latest a student can begin and still get the full duration.
const LAST_START = new Date(new Date(END).getTime() - DURATION_MINUTES * 60000).toISOString();

const istTime = (iso) => new Date(iso)
  .toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "numeric", minute: "2-digit", hour12: true })
  .toUpperCase();

const SETTINGS = {
  leaderboardEnabled: true,
  rankingVisibility: "campus_only",
  // after_end resolves to phase === "past", i.e. the moment contestEnd passes.
  // No separate resultPublishAt needed.
  answerKeyRelease: "after_end",
  explanationsRelease: "after_end",
  analysisRelease: "after_end",
  scoreRelease: "after_end",
  allowQuestionReview: true,
  showCorrectAnswers: true,
  highlightIncorrect: true,
  proctoringEnabled: false,
};

const RULES_TEXT = [
  `- Duration: ${DURATION_MINUTES} minutes from the moment you start. The window closes at ${istTime(END)} regardless, so start by ${istTime(LAST_START)} to get the full time.`,
  "- One attempt only. Your answers are submitted once and cannot be reopened.",
  "- Section A (GK) has NO negative marking.",
  "- Sections B and C deduct 0.5 marks for a wrong answer. Leaving a question blank costs you nothing.",
  "- Section D (coding) has no negative marking, and partial credit is given for partially passing solutions. Submit whatever works.",
  "- Coding questions are graded on hidden test cases. Read from standard input and print EXACTLY the required output - no prompts, no extra text, no trailing blank lines.",
  "- Press Submit on each coding question separately. Section A/B/C answers are submitted together at the end.",
  "- Solo attempt. No external help, no AI assistants, no sharing answers.",
  `- Results and the leaderboard go live automatically when the contest window closes at ${istTime(END)}.`,
].join("\n");

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------
const opt = (id, text) => ({ id, text });
const O4 = (a, b, c, d) => [opt("a", a), opt("b", b), opt("c", c), opt("d", d)];
const TF = [opt("true", "True"), opt("false", "False")];

const mcq = (question, options, correct, explanation, topic, difficulty = "easy", marks = 2, negativeMarks = 0.5) => ({
  kind: "objective", type: "mcq", question, options, correctOptionIds: [correct], correctText: "",
  explanation, topic, difficulty, marks, negativeMarks,
});

const multi = (question, options, correctIds, explanation, topic, difficulty = "medium", marks = 2, negativeMarks = 0.5) => ({
  kind: "objective", type: "multiselect", question, options, correctOptionIds: correctIds, correctText: "",
  explanation, topic, difficulty, marks, negativeMarks,
});

// GK section runs at 1 mark and zero negative on purpose - it is the section a
// first year can clear on general reading alone, and punishing a guess there
// would defeat the "common for all years" premise.
const tf = (question, correct, explanation, topic, marks = 1, negativeMarks = 0) => ({
  kind: "objective", type: "truefalse", question, options: TF,
  correctOptionIds: [correct ? "true" : "false"], correctText: "",
  explanation, topic, difficulty: "easy", marks, negativeMarks,
});

// correctText is pipe-separated alternatives - see isAnswerCorrect() in
// lib/contests.js, which lowercases and trims both sides before comparing.
const fib = (question, correctText, explanation, topic, marks = 2, negativeMarks = 0) => ({
  kind: "objective", type: "fillblank", question, options: [], correctOptionIds: [], correctText,
  explanation, topic, difficulty: "easy", marks, negativeMarks,
});

const coding = ({ question, topic, difficulty, marks, hintText, estimatedTimeSec, samples, hidden }) => ({
  kind: "coding", type: "coding", question, topic, difficulty, marks, negativeMarks: 0,
  hintText, estimatedTimeSec, samples, hidden,
});

// ---------------------------------------------------------------------------
// SECTION A - India & Independence GK. 8 questions, 1 mark, no negative.
// ---------------------------------------------------------------------------
const SECTION_A = [
  mcq("Who designed the flag on which the Indian national tricolour is based?",
    O4("Rabindranath Tagore", "Pingali Venkayya", "Bankim Chandra Chatterjee", "Sarojini Naidu"),
    "b",
    "Pingali Venkayya, from Andhra Pradesh, designed the flag adopted by the Congress in 1921 that the present tricolour is based on.",
    "Independence History", "easy", 1, 0),

  mcq("How many spokes does the Ashoka Chakra on the Indian national flag have?",
    O4("12", "18", "24", "32"),
    "c",
    "The navy blue Ashoka Chakra at the centre of the white band has 24 spokes.",
    "National Symbols", "easy", 1, 0),

  mcq("On which date did the Constituent Assembly adopt the Indian national flag in its present form?",
    O4("26 January 1950", "22 July 1947", "15 August 1947", "26 November 1949"),
    "b",
    "The Constituent Assembly adopted the tricolour on 22 July 1947, three weeks before Independence.",
    "Independence History", "easy", 1, 0),

  mcq("Who delivered the 'Tryst with Destiny' speech on the eve of India's independence?",
    O4("Sardar Vallabhbhai Patel", "Dr. Rajendra Prasad", "Jawaharlal Nehru", "Mahatma Gandhi"),
    "c",
    "Jawaharlal Nehru delivered it in the Constituent Assembly just before midnight on 14 August 1947, as India's first Prime Minister.",
    "Independence History", "easy", 1, 0),

  mcq("The boundary line drawn to partition British India into India and Pakistan in 1947 is known as the:",
    O4("Durand Line", "McMahon Line", "Radcliffe Line", "Line of Control"),
    "c",
    "It is named after Sir Cyril Radcliffe, who chaired the Boundary Commission. The Durand Line is the Afghanistan border and the McMahon Line the north-eastern one.",
    "Independence History", "easy", 1, 0),

  mcq("Which freedom fighter gave the call 'Give me blood, and I will give you freedom'?",
    O4("Bhagat Singh", "Subhas Chandra Bose", "Lala Lajpat Rai", "Chandrashekhar Azad"),
    "b",
    "Netaji Subhas Chandra Bose used it while raising the Indian National Army.",
    "Independence History", "easy", 1, 0),

  tf("On Independence Day, the Prime Minister of India hoists the national flag at the Red Fort in Delhi.",
    true,
    "The PM hoists the flag at the Red Fort on 15 August. On Republic Day it is the President who unfurls it, at Kartavya Path.",
    "National Symbols"),

  tf("The Constitution of India came into effect on 15 August 1947.",
    false,
    "It was adopted on 26 November 1949 and came into effect on 26 January 1950. 15 August 1947 is Independence Day, not Republic Day.",
    "Independence History"),
];

// ---------------------------------------------------------------------------
// SECTION B - Aptitude & Reasoning, Independence-themed. 11 questions,
// 2 marks, -0.5. Placement-standard topics dressed in the day's theme.
// ---------------------------------------------------------------------------
const SECTION_B = [
  mcq("A college orders 1250 national flags for its Independence Day programme. 12% of them arrive damaged. How many usable flags are left?",
    O4("1100", "1150", "1050", "1120"),
    "a",
    "12% of 1250 = 150 damaged. 1250 - 150 = 1100 usable. Equivalently 88% of 1250 = 1100.",
    "Percentages", "easy"),

  mcq("The Indian national flag has a length : height ratio of 3 : 2. If a flag is 1.8 m long, what is its height?",
    O4("0.9 m", "1.2 m", "1.5 m", "2.7 m"),
    "b",
    "Height = length x (2/3) = 1.8 x 2/3 = 1.2 m.",
    "Ratio and Proportion", "easy"),

  mcq("6 volunteers can decorate the college auditorium in 8 hours. Working at the same rate, how long will 12 volunteers take?",
    O4("3 hours", "5 hours", "4 hours", "6 hours"),
    "c",
    "Total work = 6 x 8 = 48 volunteer-hours. With 12 volunteers: 48 / 12 = 4 hours. Doubling the workers halves the time.",
    "Time and Work", "easy"),

  mcq("The Dandi March covered about 385 km in 24 days. What was the average distance covered per day, to the nearest km?",
    O4("14 km", "16 km", "18 km", "20 km"),
    "b",
    "385 / 24 = 16.04, so about 16 km per day.",
    "Averages", "easy"),

  mcq("Five contingents in the Independence Day parade have 48, 52, 60, 44 and 56 cadets. What is the average number of cadets per contingent?",
    O4("50", "51", "52", "54"),
    "c",
    "Total = 48 + 52 + 60 + 44 + 56 = 260. Average = 260 / 5 = 52.",
    "Averages", "easy"),

  mcq("The 24 spokes of the Ashoka Chakra are equally spaced around the circle. What is the angle between two adjacent spokes?",
    O4("10 degrees", "12 degrees", "15 degrees", "24 degrees"),
    "c",
    "A full circle is 360 degrees, so 360 / 24 = 15 degrees.",
    "Geometry", "easy"),

  mcq("The flag hoisting programme begins at 8:15 AM and runs for 2 hours 50 minutes. At what time does it end?",
    O4("10:45 AM", "10:55 AM", "11:05 AM", "11:15 AM"),
    "c",
    "8:15 AM + 2 hours = 10:15 AM. 10:15 AM + 50 minutes = 11:05 AM.",
    "Time Calculation", "easy"),

  mcq("15 August 2026 falls on a Saturday. On which day of the week did 15 August 2025 fall?",
    O4("Thursday", "Friday", "Saturday", "Sunday"),
    "b",
    "The span 15 Aug 2025 to 15 Aug 2026 does not contain a 29 February, so it is 365 days = 52 weeks + 1 odd day. Going back one day from Saturday gives Friday.",
    "Calendar", "medium"),

  mcq("In a certain code, BHARAT is written as CIBSBU. How is INDIA written in that code?",
    O4("JOEJB", "JOFJB", "HMCHZ", "JOEIB"),
    "a",
    "Every letter shifts forward by one: B-C, H-I, A-B, R-S, A-B, T-U. Applying the same rule to INDIA: I-J, N-O, D-E, I-J, A-B, giving JOEJB.",
    "Coding-Decoding", "medium"),

  mcq("Find the odd one out from the following freedom fighters:",
    O4("Bhagat Singh", "Sukhdev", "Rajguru", "Rabindranath Tagore"),
    "d",
    "Bhagat Singh, Sukhdev and Rajguru were revolutionaries executed together on 23 March 1931. Tagore was a poet and Nobel laureate, not a revolutionary.",
    "Odd One Out", "easy"),

  mcq("A parade contingent marches 3 km due North from the Red Fort and then 4 km due East. How far is it from its starting point in a straight line?",
    O4("5 km", "6 km", "7 km", "3.5 km"),
    "a",
    "North and East are perpendicular, so this is a right triangle with legs 3 and 4. The straight-line distance is the hypotenuse: sqrt(9 + 16) = 5 km.",
    "Direction Sense", "easy"),
];

// ---------------------------------------------------------------------------
// SECTION C - Programming fundamentals every year has covered. 8 questions,
// 2 marks. Deliberately language-spread (concepts, Python, OOP) so no cohort
// is advantaged by which language their semester happens to be teaching.
// ---------------------------------------------------------------------------
const SECTION_C = [
  mcq("What is the time complexity of binary search on a sorted array of n elements?",
    O4("O(n)", "O(n log n)", "O(log n)", "O(1)"),
    "c",
    "Each comparison discards half the remaining range, so it takes about log2(n) steps.",
    "Algorithms", "easy"),

  mcq("Which of the following data structures follows the FIFO (First In First Out) principle?",
    O4("Stack", "Queue", "Binary Tree", "Graph"),
    "b",
    "A queue removes elements in the same order they were inserted. A stack is LIFO - last in, first out.",
    "Data Structures", "easy"),

  mcq("What does the Python statement print(len('INDEPENDENCE')) output?",
    O4("11", "12", "13", "Error"),
    "b",
    "I-N-D-E-P-E-N-D-E-N-C-E is 12 characters, and len() counts characters in a string.",
    "Python Basics", "easy"),

  mcq("In Python 3, what is the value of the expression 10 // 3 ?",
    O4("3.33", "3", "4", "1"),
    "b",
    "// is floor division, which discards the fractional part, so 10 // 3 is 3. Plain / would give 3.333..., and % would give the remainder 1.",
    "Python Basics", "easy"),

  mcq("Which of the following is NOT a principle of Object-Oriented Programming?",
    O4("Encapsulation", "Inheritance", "Polymorphism", "Compilation"),
    "d",
    "Compilation is a build step, not an OOP principle. The four pillars are abstraction, encapsulation, inheritance and polymorphism.",
    "OOP", "easy"),

  mcq("In Python, what is the result of the expression 'INDIA'[::-1] ?",
    O4("INDIA", "AIDNI", "AIDN", "Error"),
    "b",
    "A slice with step -1 walks the string backwards, reversing it to AIDNI.",
    "Python Basics", "medium"),

  multi("Which of the following are linear data structures? (select all that apply)",
    O4("Array", "Linked List", "Binary Tree", "Queue"),
    ["a", "b", "d"],
    "Arrays, linked lists and queues arrange elements in a single sequence, each with one predecessor and one successor. A binary tree is hierarchical, so it is non-linear.",
    "Data Structures", "medium"),

  fib("In Python, the ___ built-in function returns the number of items in a list.",
    "len|len()",
    "len(my_list) returns the number of elements in the list. It works on strings, tuples and dictionaries too.",
    "Python Basics"),
];

// ---------------------------------------------------------------------------
// SECTION D - 2 coding questions. One arithmetic-with-an-edge-case that any
// first year can finish, one real single-pass array algorithm to separate the
// top of the leaderboard. Both are pure stdin/stdout, solvable in Java,
// Python, C, C++ or JavaScript.
// ---------------------------------------------------------------------------
const SECTION_D = [
  coding({
    question: `Years of Freedom

India became independent on 15 August 1947.

Given a year Y, print how many full years of independence India has completed as of 15 August of that year.

If Y is before 1947, print NOT YET instead.

INPUT
A single integer Y (1900 <= Y <= 3000).

OUTPUT
A single integer - the number of years completed - or the text NOT YET.

EXAMPLE
Input:
2026

Output:
79

2026 - 1947 = 79 years of freedom.`,
    topic: "Basic Input Output", difficulty: "easy", marks: 14,
    hintText: "Subtraction and one comparison. The only case worth pausing on is the year 1947 itself.",
    estimatedTimeSec: 600,
    samples: [
      { input: "2026", expectedOutput: "79", explanation: "2026 - 1947 = 79." },
      { input: "1930", expectedOutput: "NOT YET", explanation: "1930 is before Independence, so there is nothing to count yet." },
    ],
    hidden: [
      { input: "2026", expectedOutput: "79" },
      // 1947 itself is the boundary: it is NOT "before 1947", so it prints 0,
      // not NOT YET. A `<=` instead of `<` fails exactly here and nowhere else.
      { input: "1947", expectedOutput: "0" },
      { input: "1946", expectedOutput: "NOT YET" },
      { input: "2000", expectedOutput: "53" },
      { input: "1900", expectedOutput: "NOT YET" },
      { input: "3000", expectedOutput: "1053" },
    ],
  }),

  coding({
    question: `Parade Formation

N cadets stand in a single file for the Independence Day parade, in the order given.

The commander walks from the FRONT of the line to the back and salutes a cadet only if that cadet is STRICTLY taller than every cadet standing ahead of them. The first cadet in the line is always saluted, since nobody stands ahead of them.

Count how many cadets get saluted.

INPUT
Line 1: an integer N (1 <= N <= 100000)
Line 2: N space-separated integers - the heights in cm, front of the line first

OUTPUT
A single integer - the number of cadets saluted.

EXAMPLE
Input:
6
170 165 180 175 190 185

Output:
3

Cadets of height 170, 180 and 190 are each taller than everyone ahead of them. 165, 175 and 185 are not.

A nested loop is O(n*n) and will time out on the larger hidden tests. One pass is enough.`,
    topic: "Arrays", difficulty: "medium", marks: 20,
    hintText: "Carry the tallest height seen so far as you walk the line, and update it only when someone beats it.",
    estimatedTimeSec: 1200,
    samples: [
      { input: "6\n170 165 180 175 190 185", expectedOutput: "3", explanation: "170, 180 and 190 are each a new tallest-so-far." },
      { input: "5\n5 4 3 2 1", expectedOutput: "1", explanation: "Only the first cadet is saluted - everyone after is shorter than someone ahead." },
    ],
    hidden: [
      { input: "6\n170 165 180 175 190 185", expectedOutput: "3" },
      { input: "5\n1 2 3 4 5", expectedOutput: "5" },
      { input: "5\n5 4 3 2 1", expectedOutput: "1" },
      { input: "1\n42", expectedOutput: "1" },
      // The equal-heights test. "Strictly taller" means a tie earns no salute,
      // so this is 4 and not 6 - a >= comparison fails here and passes
      // everything else, which is the whole point of including it.
      { input: "8\n10 10 10 20 15 25 25 30", expectedOutput: "4" },
      { input: "7\n3 1 4 1 5 9 2", expectedOutput: "4" },
      { input: "10\n100 90 100 110 105 120 119 121 1 200", expectedOutput: "5" },
    ],
  }),
];

const QUESTIONS = [...SECTION_A, ...SECTION_B, ...SECTION_C, ...SECTION_D];

// ---------------------------------------------------------------------------
const DESCRIPTION = `Har Ghar Tiranga, har laptop code.

A one-off Independence Day special open to every year at MRCET - I, II, III and IV sit the same paper and share one leaderboard. No syllabus cutoff, no seniors-only advantage.

90 minutes, 80 marks, four sections: India & Independence GK, Independence-themed aptitude & reasoning, programming fundamentals, and two India-themed coding problems you can solve in Java, Python, C, C++ or JavaScript.

Freedom isn't graded on a curve. Neither is this.`;

const PRIZE_TEXT = "Top 3 on the leaderboard receive an Independence Day certificate from the MRCET Training & Placement Cell. Every student scoring above 50% receives a participation certificate.";

async function main() {
  const objective = QUESTIONS.filter(q => q.kind === "objective").length;
  const codingCount = QUESTIONS.filter(q => q.kind === "coding").length;
  const maxMarks = QUESTIONS.reduce((s, q) => s + q.marks, 0);

  console.log(`Independence Day contest for ${INSTITUTION_ID}${DRY_RUN ? " [DRY RUN]" : ""}`);
  console.log(`  ${objective} objective + ${codingCount} coding = ${QUESTIONS.length} questions, ${maxMarks} marks`);
  console.log(`  window ${istTime(START)} -> ${istTime(END)} IST, ${DURATION_MINUTES} min per attempt`);
  console.log(`  last start for a full attempt: ${istTime(LAST_START)} IST`);

  // Deployed on the morning of the contest, so the schedule is the thing most
  // likely to be stale by the time this actually runs. Say so loudly rather
  // than silently seeding a window that already opened or already closed.
  const now = new Date();
  const mins = (t) => Math.round((new Date(t) - now) / 60000);
  if (now > new Date(END)) {
    console.log(`\n  !! The contest window CLOSED ${-mins(END)} min ago. Edit START/END before seeding.`);
  } else if (now > new Date(START)) {
    console.log(`\n  !! The window is ALREADY OPEN (started ${-mins(START)} min ago); it closes in ${mins(END)} min.`);
    console.log(`     Students starting after ${istTime(LAST_START)} get less than the full ${DURATION_MINUTES} minutes.`);
  } else {
    console.log(`  starts in ${mins(START)} min`);
  }
  console.log("");
  console.log(`  status: ${PUBLISH ? "PUBLISHED (live)" : "draft (publish from Campus > Manage > Contests, or re-run with --publish)"}\n`);

  // --dry-run touches Firestore not at all, deliberately: it is the one mode
  // that must still work when the service-account key is stale, so the paper
  // can be proof-read without credentials.
  if (DRY_RUN) {
    const byType = {};
    for (const q of QUESTIONS) byType[q.type] = (byType[q.type] || 0) + 1;
    console.log("  by type:", byType);
    for (const q of QUESTIONS.filter(x => x.kind === "coding")) {
      console.log(`  coding "${q.question.split("\n")[0]}": ${q.samples.length} sample + ${q.hidden.length} hidden tests, ${q.marks} marks`);
    }
    console.log("  [dry-run] nothing written.");
    return;
  }

  const existing = await db.collection("contests").where("seedKey", "==", SEED_KEY).limit(1).get();
  if (!existing.empty) {
    console.log(`SKIP - already seeded as contests/${existing.docs[0].id}`);
    return;
  }

  const ref = db.collection("contests").doc();
  await ref.set({
    title: "Azadi Code Sprint - Independence Day Special",
    category: "Placement Preparation",
    difficulty: "Easy",
    contestType: "mixed",
    bannerUrl: "",
    description: DESCRIPTION,
    rules: RULES_TEXT,
    eligibility: "Open to all approved MRCET students - I, II, III and IV Year.",
    organizer: "MRCET Training & Placement Cell",
    tags: ["MRCET", "Independence Day", "Aptitude", "GK", "Coding", "All Years"],

    registrationStart: TS(REG_START),
    // Registration stays open until the contest itself ends, not until it
    // starts. A festival contest should not lock out someone who hears about
    // it at 11 AM - the attempt is still capped by durationMinutes and the
    // 1:00 PM window close either way.
    registrationEnd: TS(END),
    contestStart: TS(START),
    contestEnd: TS(END),
    durationMinutes: DURATION_MINUTES,

    // mode "all" - every approved MRCET student, every year, one leaderboard.
    targetScope: { mode: "all", departments: [], years: [], sections: [], classroomIds: [], uids: [] },

    prizeXp: 0,
    prizeCoins: 0,
    prizeText: PRIZE_TEXT,
    status: PUBLISH ? "published" : "draft",
    settings: SETTINGS,

    institutionId: INSTITUTION_ID,
    participantCount: 0,
    questionCount: QUESTIONS.length,
    maxMarks,
    seedKey: SEED_KEY,
    createdAt: FV.serverTimestamp(),
    createdBy: "devert.contact@gmail.com",
  });

  let order = 0;
  for (const q of QUESTIONS) {
    const qRef = ref.collection("questions").doc();
    await qRef.set({
      type: q.type,
      question: q.question,
      options: q.options || [],
      marks: q.marks,
      negativeMarks: q.negativeMarks,
      topic: q.topic,
      category: "",
      tags: [],
      difficulty: q.difficulty,
      order,
      estimatedTimeSec: q.estimatedTimeSec ?? null,
      hintText: q.hintText || "",
      imageUrl: "",
      codeSnippet: "",
      createdAt: FV.serverTimestamp(),
    });

    if (q.kind === "objective") {
      await ref.collection("answerKeys").doc(qRef.id).set({
        correctOptionIds: q.correctOptionIds,
        correctText: q.correctText,
        explanation: q.explanation,
      });
    } else {
      // Coding questions deliberately get NO answerKeys doc - there is nothing
      // client-gradable, and hidden tests must never be client-readable.
      for (const t of q.samples) {
        await qRef.collection("sampleTests").doc().set({
          input: t.input, expectedOutput: t.expectedOutput, explanation: t.explanation || "",
        });
      }
      for (const t of q.hidden) {
        await qRef.collection("hiddenTests").doc().set({
          input: t.input, expectedOutput: t.expectedOutput,
        });
      }
    }
    order++;
  }

  console.log(`created contests/${ref.id}`);
  console.log(`  ${QUESTIONS.length} questions, ${maxMarks} marks, status=${PUBLISH ? "published" : "draft"}`);
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
