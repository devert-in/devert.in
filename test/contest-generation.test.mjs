// Tests for the contest question-generation engine
// (devert-frontend/lib/contestGeneration.js).
//
// The engine makes four promises that are worthless unless pinned:
//   - every question comes from the syllabus window and nowhere else;
//   - the same student always derives the same paper;
//   - different students get different papers;
//   - every paper is equivalent in difficulty and spread across the syllabus.
// The last two pull against each other, which is exactly why they are tested
// together rather than asserted in a comment.
//
// The fixture mirrors MRCET's real content as measured before the engine was
// written: 12 published days over two weeks, 68 MCQs, 26 coding problems split
// 16 Easy / 10 Medium across Arrays and Linked List, and - importantly - MCQs
// with no difficulty and no topic, because that is what the live data has.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "fs";

const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8");

// contestGeneration imports seededShuffle across the "@/" alias, which a
// data: URL cannot resolve - so quizRandom's source is inlined ahead of it,
// the same splice trick test/roster-filters.test.mjs uses for institutions.js.
const quizSrc = read("../devert-frontend/lib/quizRandom.js")
  .replace(/^export /gm, "");
const genSrc = read("../devert-frontend/lib/contestGeneration.js")
  .replace(/^import \{[^}]*\} from "@\/lib\/quizRandom";$/m, "");

const {
  syllabusWeeks, shiftWeekId, buildQuestionBank, defaultBlueprint,
  validateBank, generatePaper, coverageReport,
} = await import(`data:text/javascript;base64,${Buffer.from(quizSrc + "\n" + genSrc).toString("base64")}`);

// ---------------- fixture ----------------

const WEEKS = ["2026-07-20", "2026-07-27"];
const DOWS = ["mon", "tue", "wed", "thu", "fri", "sat"];

function makeItems() {
  const items = [];
  let pid = 0;
  WEEKS.forEach((weekId, w) => {
    DOWS.forEach((dow, d) => {
      const isTest = dow === "sat";
      const date = shiftDate(weekId, d);
      const nMcq = isTest ? (w === 0 ? 8 : 10) : 5;
      const nProb = isTest ? (w === 0 ? 3 : 5) : 2;
      items.push({
        id: date, date, weekId, dow, status: "published",
        type: isTest ? "test" : "lesson",
        title: `${weekId} ${dow}`,
        // No difficulty, no topic - exactly like the live data.
        mcqs: Array.from({ length: nMcq }, (_, i) => ({
          question: `${date} Q${i}`, options: ["a", "b", "c", "d"], correctIndex: i % 4,
        })),
        problemIds: Array.from({ length: nProb }, () => `p${pid++}`),
      });
    });
  });
  return items;
}
function shiftDate(weekId, days) {
  const [y, m, d] = weekId.split("-").map(Number);
  const x = new Date(y, m - 1, d + days);
  const p = (n) => String(n).padStart(2, "0");
  return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}`;
}

const ITEMS = makeItems();
// The live window has 28 problem REFERENCES but only 26 distinct problems -
// two are taught on more than one day. Mirrored here so the main fixture
// exercises deduplication rather than pretending it never happens.
ITEMS[ITEMS.length - 1].problemIds.splice(0, 2, ITEMS[0].problemIds[0], ITEMS[1].problemIds[0]);

const UNIQUE_PROBLEMS = new Set(ITEMS.flatMap(i => i.problemIds)).size;
const PROBLEMS = {};
[...new Set(ITEMS.flatMap(i => i.problemIds))].forEach((id, i) => {
  PROBLEMS[id] = {
    title: `Problem ${id}`,
    // 16 Easy / 10 Medium over 26, matching the measured live split.
    difficulty: i < 16 ? "Easy" : "Medium",
    category: i % 2 === 0 ? "Arrays" : "Linked List",
  };
});

const BANK = buildQuestionBank(ITEMS, PROBLEMS, { weeks: WEEKS });
const BP = defaultBlueprint();

// ---------------- window ----------------

test("the syllabus window is the last two weeks, oldest first", () => {
  assert.deepEqual(syllabusWeeks("2026-07-27", 2), ["2026-07-20", "2026-07-27"]);
  assert.deepEqual(syllabusWeeks("2026-07-27", 1), ["2026-07-27"]);
  assert.equal(shiftWeekId("2026-08-03", -1), "2026-07-27");
});

test("the bank matches the measured live pool and carries provenance", () => {
  assert.equal(BANK.mcqs.length, 68);
  assert.equal(BANK.coding.length, 26);
  assert.equal(BANK.coding.length, UNIQUE_PROBLEMS, "references deduplicate to distinct problems");
  assert.equal(BANK.days.length, 12);
  for (const q of [...BANK.mcqs, ...BANK.coding]) {
    assert.ok(q.sourceDate, "every question must name the day it came from");
    assert.ok(WEEKS.includes(q.weekId));
  }
});

test("draft days and out-of-window days are excluded from the bank", () => {
  const extra = [
    ...ITEMS,
    { id: "2026-07-13", date: "2026-07-13", weekId: "2026-07-13", dow: "mon", status: "published",
      mcqs: [{ question: "OLD", options: ["a", "b"], correctIndex: 0 }], problemIds: ["old1"] },
    { id: "2026-07-29x", date: "2026-07-29x", weekId: "2026-07-27", dow: "wed", status: "draft",
      mcqs: [{ question: "DRAFT", options: ["a", "b"], correctIndex: 0 }], problemIds: ["draft1"] },
  ];
  const bank = buildQuestionBank(extra, { ...PROBLEMS, old1: { difficulty: "Easy" }, draft1: { difficulty: "Easy" } }, { weeks: WEEKS });
  assert.equal(bank.mcqs.length, 68, "an older week must not leak in");
  assert.ok(!bank.mcqs.some(m => m.question === "OLD"));
  assert.ok(!bank.mcqs.some(m => m.question === "DRAFT"), "unpublished days must not leak in");
  assert.ok(!bank.coding.some(c => c.problemId === "old1" || c.problemId === "draft1"));
});

test("a problem taught on two days appears once, so it cannot be drawn twice", () => {
  const dup = ITEMS.map((it, i) => (i === 1 ? { ...it, problemIds: [...it.problemIds, "p0"] } : it));
  const bank = buildQuestionBank(dup, PROBLEMS, { weeks: WEEKS });
  assert.equal(bank.coding.filter(c => c.problemId === "p0").length, 1);
});

// ---------------- the out-of-syllabus guarantee ----------------

test("every question in every generated paper comes from the bank", () => {
  // The spec's hardest requirement. Checked across many students rather than
  // one, since a leak would likely be seed-dependent.
  const codingKeys = new Set(BANK.coding.map(c => c.key));
  const mcqKeys = new Set(BANK.mcqs.map(m => m.key));
  for (let i = 0; i < 200; i++) {
    const p = generatePaper(BANK, BP, `contest1:student${i}`);
    p.coding.forEach(c => assert.ok(codingKeys.has(c.key), `coding ${c.key} is not in the bank`));
    p.mcqs.forEach(m => assert.ok(mcqKeys.has(m.key), `mcq ${m.key} is not in the bank`));
  }
});

// ---------------- determinism vs variety ----------------

test("the same student always derives the same paper", () => {
  // Refresh, reconnect, lost draft - all must reproduce the identical paper.
  const a = generatePaper(BANK, BP, "contest1:studentA");
  const b = generatePaper(BANK, BP, "contest1:studentA");
  assert.deepEqual(a.coding.map(c => c.key), b.coding.map(c => c.key));
  assert.deepEqual(a.mcqs.map(m => m.key), b.mcqs.map(m => m.key));
});

test("different students get different papers", () => {
  const sigs = new Set();
  for (let i = 0; i < 100; i++) {
    const p = generatePaper(BANK, BP, `contest1:student${i}`);
    sigs.add([...p.coding.map(c => c.key), ...p.mcqs.map(m => m.key)].join("|"));
  }
  // With 26 coding and 68 MCQs, 100 students should be overwhelmingly unique.
  assert.ok(sigs.size > 90, `expected near-unique papers, got ${sigs.size} distinct of 100`);
});

test("a different contest reshuffles the same student", () => {
  const a = generatePaper(BANK, BP, "contest1:studentA");
  const b = generatePaper(BANK, BP, "contest2:studentA");
  const same = a.mcqs.map(m => m.key).join() === b.mcqs.map(m => m.key).join();
  assert.ok(!same, "the same student in a different contest must not get the same paper");
});

// ---------------- fairness ----------------

test("every paper honours the difficulty mix exactly", () => {
  // The spec's explicit requirement: nobody gets three Hard while someone
  // else gets three Easy.
  for (let i = 0; i < 200; i++) {
    const p = generatePaper(BANK, BP, `contest1:student${i}`);
    const counts = p.coding.reduce((a, c) => ({ ...a, [c.difficulty]: (a[c.difficulty] || 0) + 1 }), {});
    assert.equal(p.coding.length, 3, "every paper has exactly 3 coding problems");
    assert.equal(counts.Easy, 1, `student${i} got ${counts.Easy} Easy`);
    assert.equal(counts.Medium, 2, `student${i} got ${counts.Medium} Medium`);
  }
});

test("every paper has the full MCQ count and no duplicates", () => {
  for (let i = 0; i < 200; i++) {
    const p = generatePaper(BANK, BP, `contest1:student${i}`);
    assert.equal(p.mcqs.length, 10);
    assert.equal(new Set(p.mcqs.map(m => m.key)).size, 10, "no question twice in one paper");
    assert.equal(new Set(p.coding.map(c => c.key)).size, 3);
    assert.equal(p.totalMarks, 25, "3 x 5 + 10 x 1");
  }
});

test("MCQs are spread across the syllabus, not clustered on one day", () => {
  // Ten questions drawn from twelve days must come from ten distinct days -
  // the round-robin stratifier guarantees it, and this is what makes the
  // "equivalent coverage" claim real.
  for (let i = 0; i < 100; i++) {
    const p = generatePaper(BANK, BP, `contest1:student${i}`);
    const days = new Set(p.mcqs.map(m => m.sourceDate));
    assert.equal(days.size, 10, `student${i} drew from only ${days.size} distinct days`);
  }
});

test("coding problems are spread across categories where the tier allows", () => {
  // The two Medium picks should not both be the same category every time.
  let mixed = 0;
  for (let i = 0; i < 100; i++) {
    const p = generatePaper(BANK, BP, `contest1:student${i}`);
    const meds = p.coding.filter(c => c.difficulty === "Medium");
    if (new Set(meds.map(c => c.category)).size > 1) mixed++;
  }
  assert.ok(mixed > 60, `expected most papers to mix coding categories, got ${mixed}/100`);
});

test("the whole pool gets exercised across a cohort, not just a favoured few", () => {
  const papers = Array.from({ length: 260 }, (_, i) => generatePaper(BANK, BP, `contest1:student${i}`));
  const report = coverageReport(BANK, papers);
  assert.equal(report.papers, 260);
  assert.equal(report.unusedCoding, 0, "every coding problem should be seen by someone in a 260-student cohort");
  assert.equal(report.unusedMcqs, 0, "every MCQ should be seen by someone");
  // And no single question should dominate.
  const maxShare = Math.max(...report.mcqs.map(m => m.timesSelected)) / 260;
  assert.ok(maxShare < 0.35, `one MCQ went to ${Math.round(maxShare * 100)}% of students`);
});

// ---------------- honest degradation ----------------

test("a pool too small to run the contest is an error, not a quietly weaker paper", () => {
  const thin = buildQuestionBank(ITEMS.slice(0, 1), PROBLEMS, { weeks: WEEKS });
  const v = validateBank(thin, BP);
  assert.equal(v.ok, false);
  assert.ok(v.errors.some(e => /MCQs/.test(e)), v.errors.join(" | "));
  assert.ok(v.errors.some(e => /coding/.test(e)), v.errors.join(" | "));
});

test("a healthy pool validates, and flags that MCQs carry no difficulty", () => {
  const v = validateBank(BANK, BP);
  assert.equal(v.ok, true, v.errors.join(" | "));
  assert.ok(v.warnings.some(w => /difficulty/.test(w)),
    "should say MCQ difficulty balancing is unavailable on this data");
});

test("asking for a difficulty the syllabus does not contain warns and still fills the paper", () => {
  // There are no Hard problems in the live window at all.
  const bp = { ...BP, coding: { ...BP.coding, difficultyMix: { Easy: 1, Medium: 1, Hard: 1 } } };
  const v = validateBank(BANK, bp);
  assert.ok(v.warnings.some(w => /Hard/.test(w)), v.warnings.join(" | "));
  const p = generatePaper(BANK, bp, "contest1:studentA");
  assert.equal(p.coding.length, 3, "a missing tier must not produce a 2-question paper");
  assert.equal(p.short, false);
});

test("a barely-sufficient pool warns that papers will overlap heavily", () => {
  const small = { ...BANK, coding: BANK.coding.slice(0, 4), mcqs: BANK.mcqs.slice(0, 12) };
  const v = validateBank(small, BP);
  assert.equal(v.ok, true, "it can run...");
  assert.ok(v.warnings.some(w => /overlapping/.test(w)), "...but the admin must be told papers will overlap");
});
