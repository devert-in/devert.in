// Builds a contest's question bank from a syllabus window of Daily Learning,
// then draws a per-student paper from it that is different for every student
// but equivalent in difficulty and coverage.
//
// Pure - no Firestore, no React. The caller fetches the Daily Learning items
// and the referenced CodeLab problems; everything here is a function of that
// input, which is what makes the fairness properties testable rather than
// asserted.
//
// TWO THINGS THE REAL DATA DICTATES, both verified against MRCET's live
// content before this was written:
//
//  1. Coding problems carry real `difficulty` and `category` (16 Easy /
//     10 Medium across Arrays and Linked List over the last two weeks), so
//     coding CAN be balanced by difficulty. There are no Hard problems at
//     all, so a blueprint asking for one has to degrade honestly rather than
//     silently hand out an easier paper.
//  2. Daily Learning MCQs carry NO difficulty and NO topic - all 68 of them
//     have both fields unset. So MCQ "difficulty balance" is not something
//     this can honestly promise today. What every MCQ does have is the day it
//     came from, so MCQs are stratified across DAYS instead: ten questions
//     spread over twelve days covers the syllabus evenly and is a real
//     fairness guarantee rather than a decorative one. If MCQs ever gain a
//     difficulty field, add it to the blueprint - the stratifier is written
//     to take any key.

import { seededShuffle } from "@/lib/quizRandom";

// ---------------- syllabus window ----------------

export function shiftWeekId(weekId, deltaWeeks) {
  const [y, m, d] = String(weekId).split("-").map(Number);
  const x = new Date(y, m - 1, d + deltaWeeks * 7);
  const p = (n) => String(n).padStart(2, "0");
  return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}`;
}

// The weeks a contest draws from, oldest first. `weeksBack: 2` anchored on
// this week means "this week and last week" - the two weeks students have
// actually just worked through.
export function syllabusWeeks(anchorWeekId, weeksBack = 2) {
  const n = Math.max(1, weeksBack);
  return Array.from({ length: n }, (_, i) => shiftWeekId(anchorWeekId, -(n - 1 - i)));
}

// ---------------- question bank ----------------

// An inline MCQ has no id of its own - it is an entry in the day's `mcqs`
// array - so identity is the day plus its index. Stable as long as a day's
// question order is not rewritten underneath a running contest, which is why
// a generated paper is also persisted by the caller rather than re-derived.
const mcqKey = (date, i) => `${date}#${i}`;

export function buildQuestionBank(items, problemsById = {}, { weeks } = {}) {
  const warnings = [];
  const inWindow = (items || []).filter(it =>
    (!weeks || weeks.includes(it.weekId)) && it.status !== "draft");

  const mcqs = [];
  const coding = [];
  const seenProblem = new Set();

  for (const it of [...inWindow].sort((a, b) => String(a.date || a.id).localeCompare(String(b.date || b.id)))) {
    const date = it.date || it.id;
    (it.mcqs || []).forEach((m, i) => {
      mcqs.push({
        key: mcqKey(date, i), kind: "mcq", index: i,
        question: m.question, options: m.options || [], correctIndex: m.correctIndex,
        explanation: m.explanation || "",
        // Provenance - the spec's traceability requirement. Every question in
        // a paper can be pointed back at the exact day it was taught.
        sourceDate: date, dow: it.dow, weekId: it.weekId,
        sourceTitle: it.title || "", sourceType: it.type || "lesson",
        difficulty: m.difficulty || null, topic: m.topic || null,
      });
    });
    (it.problemIds || []).forEach(pid => {
      // A problem taught twice is still one problem - deduplicated so it can
      // never appear twice in the same paper.
      if (seenProblem.has(pid)) return;
      seenProblem.add(pid);
      const p = problemsById[pid];
      if (!p) { warnings.push(`Problem ${pid} (from ${date}) could not be loaded and was skipped.`); return; }
      coding.push({
        key: pid, kind: "coding", problemId: pid,
        title: p.title || pid, difficulty: p.difficulty || "Easy", category: p.category || null,
        sourceDate: date, dow: it.dow, weekId: it.weekId, sourceTitle: it.title || "",
      });
    });
  }

  const missingDifficulty = mcqs.filter(m => !m.difficulty).length;
  if (missingDifficulty === mcqs.length && mcqs.length > 0) {
    warnings.push(`None of the ${mcqs.length} MCQs carry a difficulty, so MCQs are balanced across days instead.`);
  }

  return { mcqs, coding, weeks: weeks || [], days: [...new Set(mcqs.map(m => m.sourceDate))], warnings };
}

// ---------------- blueprint ----------------

// The contest pattern, as data. Everything an admin can configure lives here,
// so a daily / weekly / placement / semester contest is the same engine with a
// different blueprint.
export function defaultBlueprint() {
  return {
    coding: { count: 3, marks: 5, difficultyMix: { Easy: 1, Medium: 2 } },
    mcq: { count: 10, marks: 1, stratifyBy: "sourceDate" },
  };
}

// Run before publishing. The spec is explicit that a thin pool must warn
// rather than silently produce a weaker contest, so shortfalls are errors and
// "technically enough but everyone gets the same paper" is a warning.
export function validateBank(bank, blueprint = defaultBlueprint()) {
  const errors = [];
  const warnings = [...(bank.warnings || [])];

  if (bank.coding.length < blueprint.coding.count) {
    errors.push(`Only ${bank.coding.length} coding problems in the syllabus window - the contest needs ${blueprint.coding.count}.`);
  }
  if (bank.mcqs.length < blueprint.mcq.count) {
    errors.push(`Only ${bank.mcqs.length} MCQs in the syllabus window - the contest needs ${blueprint.mcq.count}.`);
  }

  for (const [level, want] of Object.entries(blueprint.coding.difficultyMix || {})) {
    const have = bank.coding.filter(c => c.difficulty === level).length;
    if (have < want) {
      warnings.push(`Wanted ${want} ${level} coding problem${want === 1 ? "" : "s"} but the window has ${have}; the shortfall is filled from other difficulties, so papers will vary in difficulty.`);
    }
  }

  // A pool barely bigger than the paper means near-identical papers, which
  // defeats the point of generating per student.
  if (bank.coding.length >= blueprint.coding.count && bank.coding.length < blueprint.coding.count * 2) {
    warnings.push(`The coding pool (${bank.coding.length}) is less than twice the ${blueprint.coding.count} needed, so students will see heavily overlapping problems.`);
  }
  if (bank.mcqs.length >= blueprint.mcq.count && bank.mcqs.length < blueprint.mcq.count * 2) {
    warnings.push(`The MCQ pool (${bank.mcqs.length}) is less than twice the ${blueprint.mcq.count} needed, so students will see heavily overlapping questions.`);
  }

  return { ok: errors.length === 0, errors, warnings };
}

// ---------------- selection ----------------

// Round-robin across strata, taking one at a time from each, so a paper is
// spread over the whole syllabus instead of clustering on whichever day
// happened to shuffle first. Both the order of the strata and the order
// within each are seeded, so two students get different questions while each
// still gets the same even spread.
function stratifiedPick(pool, count, keyOf, seed) {
  if (count <= 0 || pool.length === 0) return [];
  const groups = new Map();
  for (const item of pool) {
    const k = String(keyOf(item) ?? "(none)");
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(item);
  }
  const order = seededShuffle([...groups.keys()], `${seed}:strata`);
  const queues = order.map(k => seededShuffle(groups.get(k), `${seed}:within:${k}`));

  const picked = [];
  let round = 0;
  while (picked.length < count) {
    let tookAny = false;
    for (const q of queues) {
      if (picked.length >= count) break;
      if (q.length > round) { picked.push(q[round]); tookAny = true; }
    }
    if (!tookAny) break; // pool exhausted
    round++;
  }
  return picked;
}

// Honours the difficulty mix exactly when the pool allows, and fills any
// shortfall from what is left rather than returning a short paper - a student
// must never sit a 2-question coding round because the Hard bucket was empty.
function pickCoding(pool, blueprint, seed) {
  const want = blueprint.coding.count;
  const mix = blueprint.coding.difficultyMix || {};
  const used = new Set();
  const picked = [];

  for (const [level, n] of Object.entries(mix)) {
    const tier = pool.filter(c => c.difficulty === level && !used.has(c.key));
    // Spread across categories within a tier too, so a paper is not three
    // Linked List problems when Arrays was also on the syllabus.
    const chosen = stratifiedPick(tier, n, c => c.category, `${seed}:coding:${level}`);
    chosen.forEach(c => { used.add(c.key); picked.push(c); });
  }

  if (picked.length < want) {
    const rest = pool.filter(c => !used.has(c.key));
    stratifiedPick(rest, want - picked.length, c => c.difficulty, `${seed}:coding:fill`)
      .forEach(c => { used.add(c.key); picked.push(c); });
  }

  // Presented hardest-last so a student meets an easy problem first.
  const rank = { Easy: 0, Medium: 1, Hard: 2 };
  return picked.slice(0, want).sort((a, b) => (rank[a.difficulty] ?? 1) - (rank[b.difficulty] ?? 1));
}

/**
 * One student's paper. Deterministic in `seedKey` - the same student always
 * derives the same paper, so a refresh, a reconnect, or a lost draft all
 * reproduce it exactly, with no stored state required. The caller should
 * STILL persist the result: determinism protects against losing the paper,
 * persistence protects against the pool changing underneath a running contest
 * (an admin publishing a new Daily Learning day mid-contest would otherwise
 * change what an in-progress student sees).
 */
export function generatePaper(bank, blueprint = defaultBlueprint(), seedKey = "preview") {
  const coding = pickCoding(bank.coding, blueprint, seedKey);
  const mcqs = stratifiedPick(
    bank.mcqs, blueprint.mcq.count,
    m => m[blueprint.mcq.stratifyBy || "sourceDate"],
    `${seedKey}:mcq`,
  );
  return {
    seedKey,
    coding,
    mcqs,
    totalMarks: coding.length * (blueprint.coding.marks ?? 5) + mcqs.length * (blueprint.mcq.marks ?? 1),
    short: coding.length < blueprint.coding.count || mcqs.length < blueprint.mcq.count,
  };
}

// ---------------- reporting ----------------

// Which of the eligible questions actually got used, once papers exist. Drives
// the admin's coverage view and answers "did this contest represent the
// syllabus fairly".
export function coverageReport(bank, papers = []) {
  const usedCoding = new Map();
  const usedMcq = new Map();
  for (const p of papers) {
    (p.coding || []).forEach(c => usedCoding.set(c.key, (usedCoding.get(c.key) || 0) + 1));
    (p.mcqs || []).forEach(m => usedMcq.set(m.key, (usedMcq.get(m.key) || 0) + 1));
  }
  const tally = (pool, used) => pool.map(q => ({ ...q, timesSelected: used.get(q.key) || 0 }));

  const byDay = {};
  for (const q of [...bank.mcqs, ...bank.coding]) {
    const d = q.sourceDate;
    if (!byDay[d]) byDay[d] = { day: d, eligible: 0, selections: 0 };
    byDay[d].eligible++;
    byDay[d].selections += (usedMcq.get(q.key) || 0) + (usedCoding.get(q.key) || 0);
  }

  const difficulty = {};
  for (const c of bank.coding) {
    const k = c.difficulty || "(unset)";
    if (!difficulty[k]) difficulty[k] = { eligible: 0, selections: 0 };
    difficulty[k].eligible++;
    difficulty[k].selections += usedCoding.get(c.key) || 0;
  }

  return {
    papers: papers.length,
    coding: tally(bank.coding, usedCoding),
    mcqs: tally(bank.mcqs, usedMcq),
    unusedCoding: bank.coding.filter(c => !usedCoding.has(c.key)).length,
    unusedMcqs: bank.mcqs.filter(m => !usedMcq.has(m.key)).length,
    byDay: Object.values(byDay).sort((a, b) => a.day.localeCompare(b.day)),
    difficulty,
  };
}
