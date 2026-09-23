// Seed / starter-pack aggregator (design §10). The admin panel's "Install starter
// pack" button batch-writes everything exported here. Nothing in this module
// talks to Firestore directly except for building Timestamp values - no reads,
// no writes; that stays the admin feature's job.

import { Timestamp } from "firebase/firestore";

import { aptitudeQuestions } from "./questions-aptitude.js";
import { reasoningQuestions } from "./questions-reasoning.js";
import { verbalQuestions } from "./questions-verbal.js";
import { dsaQuestions } from "./questions-dsa.js";
import { pythonQuestions } from "./questions-python.js";
import { javaQuestions } from "./questions-java.js";
import { codingQuestions } from "./questions-coding.js";
import { seedCourses } from "./courses.js";
import { seedClassGroups, seedAnnouncements, buildSeedDailyTasks } from "./misc.js";

export { seedCourses, seedClassGroups, seedAnnouncements, buildSeedDailyTasks };

/** Flat array of every seed MCQ + coding question, each carrying a deterministic `id`. */
export const seedQuestions = [
  ...aptitudeQuestions, // 16
  ...reasoningQuestions, // 14
  ...verbalQuestions, // 8
  ...dsaQuestions, // 14
  ...pythonQuestions, // 10
  ...javaQuestions, // 10
  ...codingQuestions, // 8
];

const seedQuestionsById = Object.fromEntries(seedQuestions.map((q) => [q.id, q]));

function questionsByIds(ids) {
  return ids.map((id) => {
    const q = seedQuestionsById[id];
    if (!q) throw new Error(`buildSeedExams: unknown seed question id "${id}"`);
    return q;
  });
}

// ── date helpers (Asia/Kolkata, matching lib/prep/db.js's dateKey convention) ──

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAY_INDEX = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

function istDateKey(d) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function istWeekdayIndex(d) {
  const short = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Kolkata", weekday: "short" }).format(d);
  return WEEKDAY_INDEX[short];
}

function addDaysToKey(key, n) {
  return istDateKey(new Date(new Date(`${key}T12:00:00+05:30`).getTime() + n * DAY_MS));
}

/** Timestamp for a wall-clock IST time on the given yyyy-mm-dd key. */
function istTimestamp(dateKeyStr, hh, mm) {
  const pad = (n) => String(n).padStart(2, "0");
  return Timestamp.fromDate(new Date(`${dateKeyStr}T${pad(hh)}:${pad(mm)}:00+05:30`));
}

// ── paper/key splitting (mirrors lib/prep/db.js's createExam, but produces the
// {exam, paper, key} data shape directly instead of writing to Firestore) ─────

function buildExamBundle({ id, title, kind, description, dateKeyStr, startHH, durationMins, questions, marksEach }) {
  const startsAt = istTimestamp(dateKeyStr, startHH, 0);
  const endsAt = Timestamp.fromMillis(startsAt.toMillis() + durationMins * 60 * 1000);

  const paperQuestions = [];
  const answers = {};
  const explanations = {};
  const hiddenTestCases = {};
  const categorySet = new Set();

  questions.forEach((q, idx) => {
    categorySet.add(q.category);
    const marks = marksEach;
    const base = {
      idx,
      type: q.type,
      category: q.category,
      topic: q.topic,
      difficulty: q.difficulty,
      prompt: q.prompt,
      marks,
    };

    if (q.type === "mcq") {
      paperQuestions.push({ ...base, options: q.options });
      answers[idx] = q.correctIndex;
      explanations[idx] = q.explanation;
    } else {
      const cases = Array.isArray(q.testCases) ? q.testCases : [];
      paperQuestions.push({
        ...base,
        starterCode: q.starterCode,
        publicTestCases: cases.filter((t) => !t.hidden).map((t) => ({ input: t.input, expectedOutput: t.expectedOutput })),
      });
      hiddenTestCases[idx] = cases.filter((t) => t.hidden).map((t) => ({ input: t.input, expectedOutput: t.expectedOutput }));
      explanations[idx] = q.explanation;
    }
  });

  return {
    id,
    exam: {
      title,
      kind,
      description,
      startsAt,
      endsAt,
      durationMins,
      categories: [...categorySet],
      questionCount: paperQuestions.length,
      totalMarks: paperQuestions.length * marksEach,
      classGroups: [],
      published: true,
    },
    paper: { questions: paperQuestions },
    key: { answers, explanations, hiddenTestCases },
  };
}

const WEEKEND_TEST_QUESTION_IDS = [
  "seed-apt-001", "seed-apt-002", "seed-apt-003", "seed-apt-004", "seed-apt-005",
  "seed-apt-006", "seed-apt-007", "seed-apt-008", "seed-apt-009",
  "seed-rea-001", "seed-rea-002", "seed-rea-003", "seed-rea-004", "seed-rea-005",
  "seed-rea-006", "seed-rea-007", "seed-rea-008",
  "seed-dsa-001", "seed-dsa-002", "seed-dsa-003", "seed-dsa-004", "seed-dsa-005",
  "seed-dsa-006", "seed-dsa-007", "seed-dsa-008",
]; // 9 aptitude + 8 reasoning + 8 dsa = 25

const CODING_CONTEST_QUESTION_IDS = ["seed-code-001", "seed-code-003", "seed-code-005", "seed-code-007"]; // 4

/**
 * Builds the sample weekend test (Saturday, 25 MCQs, 60 min) and the sample
 * coding contest (the following Sunday, 4 problems, 90 min), relative to `now`.
 * Returns [{ id, exam, paper, key }] - write each entry to prepExams/{id},
 * prepExamPapers/{id} and prepExamKeys/{id} respectively.
 */
export function buildSeedExams(now = new Date()) {
  const todayKey = istDateKey(now);
  const dow = istWeekdayIndex(now);
  const daysToSaturday = (6 - dow + 7) % 7; // 6 = Saturday; today counts as "next" if it IS Saturday
  const saturdayKey = addDaysToKey(todayKey, daysToSaturday);
  const sundayKey = addDaysToKey(saturdayKey, 1);

  const weekendTest = buildExamBundle({
    id: "seed-exam-weekend-test-1",
    title: "Weekend Aptitude & DSA Test #1",
    kind: "weekend-test",
    description:
      "25 MCQs mixing aptitude, reasoning and DSA theory - the same spread TCS NQT and Cognizant GenC screening rounds use. 60 minutes, no negative marking.",
    dateKeyStr: saturdayKey,
    startHH: 10,
    durationMins: 60,
    questions: questionsByIds(WEEKEND_TEST_QUESTION_IDS),
    marksEach: 4,
  });

  const codingContest = buildExamBundle({
    id: "seed-exam-coding-contest-1",
    title: "Weekend Coding Contest #1",
    kind: "coding-contest",
    description:
      "4 coding problems spanning arrays, hashing, math and matrices. 90 minutes, partial credit for passing a subset of test cases.",
    dateKeyStr: sundayKey,
    startHH: 10,
    durationMins: 90,
    questions: questionsByIds(CODING_CONTEST_QUESTION_IDS),
    marksEach: 25,
  });

  return [weekendTest, codingContest];
}
