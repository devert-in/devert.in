// Shared, framework-free helpers for the /prep/faculty cockpit.
// Scores are ALWAYS recomputed here from responses + key + paper via
// scoreSubmission — never trusted from the submission doc (design §5/§9).

import { scoreSubmission } from "@/lib/prep/grading";
import { CATEGORY_MAP } from "@/lib/prep/constants";

export const ABSENT = "absent";
export const IN_PROGRESS = "in-progress";
export const SUBMITTED = "submitted";

/** Red/orange/green threshold used everywhere a percentage needs a color. */
export function pctColor(pct) {
  if (pct == null || Number.isNaN(pct)) return "rgba(255,255,255,0.25)";
  if (pct < 35) return "#FF3B3B";
  if (pct < 60) return "#FF9500";
  return "#00FF41";
}

export function average(nums) {
  const list = nums.filter((n) => typeof n === "number" && !Number.isNaN(n));
  if (!list.length) return 0;
  return list.reduce((a, b) => a + b, 0) / list.length;
}

export function median(nums) {
  const list = nums.filter((n) => typeof n === "number" && !Number.isNaN(n)).sort((a, b) => a - b);
  if (!list.length) return 0;
  const mid = Math.floor(list.length / 2);
  return list.length % 2 ? list[mid] : (list[mid - 1] + list[mid]) / 2;
}

export const round1 = (n) => Math.round(n * 10) / 10;

/**
 * One recomputed record per submission: { uid, sub, score:{total,max,perQuestion}, pct }.
 * `paper`/`key` come straight from getPaper/getKey.
 */
export function recomputeAll(submissions, key, paper) {
  return submissions.map((sub) => {
    const score = scoreSubmission(sub.responses || {}, key, paper);
    const pct = score.max > 0 ? round1((score.total / score.max) * 100) : 0;
    return { uid: sub.uid, sub, score, pct };
  });
}

/** correct / wrong / blank counts for one recomputed submission. */
export function outcomeCounts(record) {
  const responses = (record.sub && record.sub.responses) || {};
  let correct = 0;
  let wrong = 0;
  let blank = 0;
  record.score.perQuestion.forEach((q) => {
    const raw = responses[q.idx];
    const attempted = q.type === "coding" ? raw !== undefined && raw !== null : q.chosen !== null;
    if (!attempted) blank += 1;
    else if (q.correct) correct += 1;
    else wrong += 1;
  });
  return { correct, wrong, blank };
}

/** 10-bucket (0-10%, 10-20%, ... 90-100%) histogram of percentage scores. */
export function buildHistogram(pcts) {
  const buckets = Array.from({ length: 10 }, (_, i) => ({
    label: `${i * 10}-${i * 10 + 10}`,
    count: 0,
  }));
  pcts.forEach((p) => {
    const idx = Math.min(9, Math.max(0, Math.floor(p / 10)));
    buckets[idx].count += 1;
  });
  return buckets;
}

/** Per-question cohort stats: percent correct + option distribution (mcq only). */
export function questionStats(records, paper) {
  const questions = (paper && paper.questions) || [];
  return questions.map((q) => {
    let attempted = 0;
    let correct = 0;
    let correctIndex = null;
    const optionCounts = q.type === "mcq" ? [0, 0, 0, 0] : null;
    records.forEach((rec) => {
      const raw = (rec.sub.responses || {})[q.idx];
      const perQ = rec.score.perQuestion.find((p) => p.idx === q.idx);
      if (perQ && correctIndex === null && typeof perQ.correctIndex === "number") correctIndex = perQ.correctIndex;
      const isAttempted = q.type === "coding" ? raw !== undefined && raw !== null : perQ?.chosen != null;
      if (!isAttempted) return;
      attempted += 1;
      if (perQ?.correct) correct += 1;
      if (optionCounts && typeof perQ?.chosen === "number" && perQ.chosen >= 0 && perQ.chosen <= 3) {
        optionCounts[perQ.chosen] += 1;
      }
    });
    const pctCorrect = attempted > 0 ? round1((correct / attempted) * 100) : 0;
    return {
      idx: q.idx,
      type: q.type,
      topic: q.topic || "—",
      difficulty: q.difficulty || "medium",
      category: q.category || "—",
      marks: q.marks,
      attempted,
      correct,
      correctIndex,
      pctCorrect,
      optionCounts,
      flagged: attempted > 0 && pctCorrect < 35,
    };
  });
}

export function categoryLabel(id) {
  return CATEGORY_MAP[id]?.label || id || "—";
}

// ── CSV export ───────────────────────────────────────────────────────────

function csvCell(v) {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function downloadCsv(filename, rows) {
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function slugify(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "export";
}
