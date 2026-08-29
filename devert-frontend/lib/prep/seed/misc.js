// Seed class groups, announcements, and the 7-day daily-task schedule (design §10).

import { DEFAULT_CLASS_GROUPS } from "@/lib/prep/constants.js";

// Doc id defaults to the group name in db.js's upsertClassGroup ("CSE-A" etc.),
// so we mirror that convention here for idempotent re-installs.
export const seedClassGroups = DEFAULT_CLASS_GROUPS.map((g) => ({
  id: g.name,
  name: g.name,
  branch: g.branch,
  active: true,
}));

export const seedAnnouncements = [
  {
    id: "seed-ann-001",
    text:
      "Welcome to Placements Prep! Complete your onboarding (roll number + branch + class group) before attempting any exam or contest — it's your test identity on every submission.",
    date: "2026-07-13",
    link: "/prep/onboarding",
  },
  {
    id: "seed-ann-002",
    text:
      "New this week: Aptitude Bootcamp Week and DSA Foundations Week are live under Learn — 5 days each, with instant-feedback quizzes after every lesson.",
    date: "2026-07-13",
    link: "/prep/learn",
  },
  {
    id: "seed-ann-003",
    text:
      "The first weekend test (25 MCQs, 60 minutes) and coding contest (4 problems, 90 minutes) are scheduled for this weekend. Check the countdown on the Exams and Contests pages.",
    date: "2026-07-13",
    link: "/prep/exams",
  },
];

const DAY_MS = 24 * 60 * 60 * 1000;

/** Parses a yyyy-mm-dd key as noon IST so +/- a day never crosses into the wrong date. */
function parseDateKey(key) {
  return new Date(`${key}T12:00:00+05:30`);
}

function formatDateKey(d) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/**
 * Builds 7 days of prepDailyTasks (today .. today+6), cycling through the two
 * seed courses' lessons plus a couple of standalone practice items each day.
 * Returns { [dateKey]: { items: [...] } } — ready to setDoc one entry at a time
 * (or batch-write) onto prepDailyTasks/{dateKey}.
 */
export function buildSeedDailyTasks(todayKey) {
  const base = parseDateKey(todayKey);
  const schedule = {};

  // day (1-5) => { aptitudeLessonId, dsaLessonId, quizQid, codingQid }
  const plan = [
    { aptitude: "aptitude-day-1", dsa: "dsa-day-1", quiz: "seed-apt-001", coding: "seed-code-001" },
    { aptitude: "aptitude-day-2", dsa: "dsa-day-2", quiz: "seed-rea-001", coding: "seed-code-002" },
    { aptitude: "aptitude-day-3", dsa: "dsa-day-3", quiz: "seed-dsa-005", coding: "seed-code-003" },
    { aptitude: "aptitude-day-4", dsa: "dsa-day-4", quiz: "seed-py-001", coding: "seed-code-005" },
    { aptitude: "aptitude-day-5", dsa: "dsa-day-5", quiz: "seed-java-001", coding: "seed-code-007" },
  ];

  for (let i = 0; i < 7; i++) {
    const dateKey = formatDateKey(new Date(base.getTime() + i * DAY_MS));
    const p = plan[i % plan.length];
    schedule[dateKey] = {
      items: [
        {
          type: "lesson",
          refId: p.aptitude,
          courseId: "seed-course-aptitude",
          title: "Aptitude Bootcamp — today's lesson",
          category: "aptitude",
        },
        {
          type: "lesson",
          refId: p.dsa,
          courseId: "seed-course-dsa",
          title: "DSA Foundations — today's lesson",
          category: "dsa",
        },
        {
          type: "quiz",
          refId: p.quiz,
          title: "Quick warm-up question",
          category: p.quiz.includes("apt")
            ? "aptitude"
            : p.quiz.includes("rea")
            ? "reasoning"
            : p.quiz.includes("dsa")
            ? "dsa"
            : p.quiz.includes("py")
            ? "python"
            : "java",
        },
        {
          type: "coding",
          refId: p.coding,
          title: "Daily coding drill",
          category: p.coding === "seed-code-001" || p.coding === "seed-code-002" || p.coding === "seed-code-003"
            ? "dsa"
            : p.coding === "seed-code-005"
            ? "python"
            : "java",
        },
      ],
    };
  }

  return schedule;
}
