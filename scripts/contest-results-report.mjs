// READ-ONLY overall + classwise results for the MRCET III and IV Year papers.
// Writes a CSV and a print-ready HTML report per contest. Touches nothing in
// Firestore.
//
// WHY IT RE-GRADES INSTEAD OF READING `score`
//
// Scores are computed from `answers` + `answerKeys` here rather than trusting the
// stored `graded`/`score` fields, because a submission is only graded after
// contestEnd (firestore.rules gates the grading write on request.time >
// contestEnd) and an admin actually pressing Grade. A report that read the
// stored fields would silently omit every ungraded student - which is most of
// them, most of the time, and exactly when you want the report.
//
// CODING MARKS ARE INCLUDED. scripts/_tmp-classwise-report.mjs skipped coding
// questions outright (`if (q.type === "coding") continue`). On these papers that
// would drop 30 of 50 marks for III Year and 30 of 80 for IV Year - every
// student would look like they failed. Coding scores are not client-gradable
// (hidden tests are server-only), so they are read from each submission's
// codingResults subcollection, which devert-backend writes when the student
// submits their code. A coding question with no codingResults entry scores 0 and
// is reported as ungraded rather than silently treated as wrong.
//
// RANKING IS BY PERCENTAGE, not raw score, so the III and IV Year papers (50 vs
// 80 marks) stay comparable if you ever merge the two reports. Ties break on
// time taken, then on name, so the order is stable across runs.
//
//   node scripts/contest-results-report.mjs
//   node scripts/contest-results-report.mjs --contest <contestId>

import admin from "firebase-admin";
import { readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
admin.initializeApp({
  credential: admin.credential.cert(
    JSON.parse(readFileSync(join(__dirname, "service-account.json"), "utf8"))
  ),
});
const db = admin.firestore();

const INSTITUTION_ID = "mrcet";
const argIdx = process.argv.indexOf("--contest");
const CONTESTS = argIdx > -1
  ? [process.argv[argIdx + 1]]
  : [
      "705UBMMcxDjL3SjguGSL", // MRCET III Year - Stacks & Queues, Week 3
      "yVBx52sUzizUga2nKKGC", // MRCET IV Year - Placement Readiness Round
    ];

const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);

const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
const htmlEsc = (v) => String(v ?? "").replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
const fmtTime = (sec) => {
  if (sec === null || sec === undefined) return "-";
  const m = Math.floor(sec / 60), s = sec % 60;
  return `${m}m ${String(s).padStart(2, "0")}s`;
};

function isCorrect(q, key, given) {
  if (q.type === "multiselect") {
    const a = [...(given || [])].sort(), b = [...(key.correctOptionIds || [])].sort();
    return a.length === b.length && a.every((v, i) => v === b[i]);
  }
  if (q.type === "fillblank") {
    return (key.correctText || "").split("|").map(s => s.trim().toLowerCase()).filter(Boolean)
      .includes(String(given).trim().toLowerCase());
  }
  return given === (key.correctOptionIds || [])[0];
}

async function buildReport(contestId) {
  const cSnap = await db.doc(`contests/${contestId}`).get();
  if (!cSnap.exists) { console.log(`contest ${contestId} not found`); return; }
  const contest = cSnap.data();

  const questions = (await db.collection(`contests/${contestId}/questions`).get())
    .docs.map(d => ({ id: d.id, ...d.data() }));
  const answerKeys = {};
  (await db.collection(`contests/${contestId}/answerKeys`).get()).docs.forEach(d => { answerKeys[d.id] = d.data(); });

  const mcqQs = questions.filter(q => q.type !== "coding");
  const codingQs = questions.filter(q => q.type === "coding");
  const paperMarks = questions.reduce((a, q) => a + (q.marks || 1), 0);
  const codingMarks = codingQs.reduce((a, q) => a + (q.marks || 1), 0);

  const roster = new Map();
  (await db.collection(`institutions/${INSTITUTION_ID}/students`).get()).docs
    .forEach(d => roster.set(d.id, d.data()));

  const regs = (await db.collection(`contests/${contestId}/registrations`).get()).docs.map(d => d.id);
  const subs = await db.collection(`contests/${contestId}/submissions`).get();

  const rows = [];
  for (const d of subs.docs) {
    const s = d.data();
    const answers = s.answers || {};

    // ---- MCQ half, recomputed ----
    let mcqScore = 0, correct = 0, attempted = 0;
    for (const q of mcqQs) {
      const key = answerKeys[q.id], given = answers[q.id];
      const blank = given === undefined || given === null || given === ""
        || (Array.isArray(given) && given.length === 0);
      if (!key || blank) continue;
      attempted++;
      if (isCorrect(q, key, given)) { correct++; mcqScore += (q.marks || 1); }
      else mcqScore -= (q.negativeMarks || 0);
    }
    mcqScore = Math.max(0, Math.round(mcqScore * 100) / 100);

    // ---- coding half, from the server-written results ----
    const cr = await d.ref.collection("codingResults").get();
    const crById = new Map(cr.docs.map(x => [x.id, x.data()]));
    let codingScore = 0, codingGraded = 0;
    for (const q of codingQs) {
      const r = crById.get(q.id);
      if (!r) continue;                       // never run - counts 0, reported below
      codingGraded++;
      codingScore += Number(r.score || 0);
    }

    const r = roster.get(d.id) || {};
    const total = Math.round((mcqScore + codingScore) * 100) / 100;
    rows.push({
      uid: d.id,
      name: r.displayName || r.name || s.campusFullName || `(not on roster) ${d.id.slice(0, 8)}`,
      roll: r.rollNumber || s.rollNumber || "",
      cls: (r.year || r.department || r.section)
        ? `${r.year || "?"} / ${r.department || "?"} / ${r.section || "?"}`
        : "Unassigned",
      mcqScore, codingScore, total,
      pct: paperMarks > 0 ? Math.round((total / paperMarks) * 1000) / 10 : 0,
      correct, attempted,
      accuracy: attempted > 0 ? Math.round((correct / attempted) * 1000) / 10 : 0,
      codingGraded, codingTotal: codingQs.length,
      timeSec: typeof s.timeTakenSeconds === "number" ? s.timeTakenSeconds : null,
      submittedAt: s.submittedAt?.toDate?.().toISOString() || "",
      storedGraded: !!s.graded,
    });
  }

  // Percentage first, then the faster paper, then name - deterministic.
  const rank = (a, b) => b.pct - a.pct
    || (a.timeSec ?? Infinity) - (b.timeSec ?? Infinity)
    || a.name.localeCompare(b.name);

  const overall = [...rows].sort(rank);
  const byClass = new Map();
  for (const r of rows) {
    if (!byClass.has(r.cls)) byClass.set(r.cls, []);
    byClass.get(r.cls).push(r);
  }
  const classes = [...byClass.entries()]
    .map(([cls, list]) => [cls, list.sort(rank)])
    .sort((a, b) => a[0].localeCompare(b[0]));

  // Registered but never submitted - the list a placement cell chases.
  const submittedIds = new Set(rows.map(r => r.uid));
  const noShow = regs.filter(uid => !submittedIds.has(uid)).map(uid => {
    const r = roster.get(uid) || {};
    return { roll: r.rollNumber || uid.slice(0, 10), name: r.displayName || r.name || "(not on roster)", cls: (r.year || "?") + " / " + (r.department || "?") + " / " + (r.section || "?") };
  }).sort((a, b) => String(a.roll).localeCompare(String(b.roll)));

  const ungradedCoding = rows.filter(r => r.codingGraded < r.codingTotal).length;

  // ---------- console ----------
  console.log(`\n=== ${contest.title}`);
  console.log(`    paper: ${questions.length} questions / ${paperMarks} marks  (${mcqQs.length} mcq, ${codingQs.length} coding worth ${codingMarks})`);
  console.log(`    registered ${regs.length} | submitted ${rows.length} | did not attempt ${noShow.length}`);
  if (ungradedCoding) console.log(`    NOTE: ${ungradedCoding} submission(s) have at least one coding question with no result - those score 0 for it`);
  classes.forEach(([cls, list]) => {
    const avg = (list.reduce((a, r) => a + r.pct, 0) / list.length).toFixed(1);
    console.log(`    ${cls}  ${String(list.length).padStart(3)} students  avg ${avg}%  top: ${list[0].name} (${list[0].pct}%)`);
  });

  // ---------- CSV ----------
  const slug = contest.title.replace(/[^\w]+/g, "-").toLowerCase().replace(/^-|-$/g, "");
  const csv = [
    "scope,class,rank,name,rollNumber,total,paperMarks,percent,mcqScore,codingScore,correct,attempted,accuracy,codingGraded,codingQuestions,timeTaken,timeTakenSeconds,submittedAt,storedGraded",
    ...overall.map((r, i) => ["OVERALL", r.cls, i + 1, r.name, r.roll, r.total, paperMarks, r.pct, r.mcqScore, r.codingScore,
      r.correct, r.attempted, r.accuracy, r.codingGraded, r.codingTotal, fmtTime(r.timeSec), r.timeSec ?? "", r.submittedAt, r.storedGraded].map(esc).join(",")),
    ...classes.flatMap(([cls, list]) => list.map((r, i) => ["CLASS", cls, i + 1, r.name, r.roll, r.total, paperMarks, r.pct, r.mcqScore, r.codingScore,
      r.correct, r.attempted, r.accuracy, r.codingGraded, r.codingTotal, fmtTime(r.timeSec), r.timeSec ?? "", r.submittedAt, r.storedGraded].map(esc).join(","))),
    ...noShow.map(n => ["NO_ATTEMPT", n.cls, "", n.name, n.roll, "", paperMarks, "", "", "", "", "", "", "", "", "", "", "", ""].map(esc).join(",")),
  ].join("\n");
  const csvFile = join(__dirname, `results-${slug}-${stamp}.csv`);
  writeFileSync(csvFile, csv);

  // ---------- HTML (print to PDF) ----------
  const medal = (i) => i === 0 ? "background:#FFD70022;font-weight:700"
    : i === 1 ? "background:#C0C0C022;font-weight:600"
    : i === 2 ? "background:#B8733322;font-weight:600" : "";
  const table = (list) => `<table><thead><tr><th>#</th><th>Name</th><th>Roll No</th><th>Total</th><th>%</th><th>MCQ</th><th>Coding</th><th>Correct</th><th>Att.</th><th>Acc.</th><th>Time</th></tr></thead><tbody>${
    list.map((r, i) => `<tr style="${medal(i)}"><td>${i + 1}</td><td>${htmlEsc(r.name)}</td><td class="mono">${htmlEsc(r.roll)}</td><td class="mono"><b>${r.total}</b>/${paperMarks}</td><td class="mono">${r.pct}%</td><td class="mono">${r.mcqScore}</td><td class="mono">${r.codingScore}${r.codingGraded < r.codingTotal ? ` <span class="flag" title="${r.codingTotal - r.codingGraded} coding question(s) never graded">*</span>` : ""}</td><td class="mono">${r.correct}</td><td class="mono">${r.attempted}</td><td class="mono">${r.accuracy}%</td><td class="mono">${fmtTime(r.timeSec)}</td></tr>`).join("")
  }</tbody></table>`;

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${htmlEsc(contest.title)} - Results</title><style>
body{font-family:system-ui,Segoe UI,Arial,sans-serif;margin:24px;color:#111;background:#fff}
h1{font-size:20px;margin:0 0 4px} h2{font-size:15px;margin:26px 0 8px;padding-top:10px;border-top:2px solid #4F46E5;color:#4F46E5}
.sub{color:#666;font-size:12px;margin-bottom:14px}
table{border-collapse:collapse;width:100%;font-size:12px;margin-bottom:8px}
th,td{border:1px solid #e5e7eb;padding:5px 8px;text-align:left}
th{background:#F3F4F6;font-size:11px;text-transform:uppercase;letter-spacing:.04em}
.mono{font-family:ui-monospace,Consolas,monospace}
.meta{color:#666;font-size:11.5px;margin-bottom:8px}
.flag{color:#DC2626;font-weight:700}
.note{background:#FEF3C7;border-left:3px solid #F59E0B;padding:10px 12px;font-size:12px;margin:14px 0;border-radius:4px}
@media print{h2{page-break-before:always}h2:first-of-type{page-break-before:avoid}}
</style></head><body>
<h1>${htmlEsc(contest.title)}</h1>
<div class="sub">Overall &amp; classwise results &middot; ${questions.length} questions / ${paperMarks} marks &middot;
registered ${regs.length}, submitted ${rows.length}, did not attempt ${noShow.length} &middot; generated ${stamp}</div>
<div class="note">Scores are <b>recomputed from the answer sheet</b>, not read from the stored grade, so students whose
submission has not been graded yet still appear. Coding marks come from the server's own test results; a
<span class="flag">*</span> marks a student with at least one coding question that was never graded, which scores 0.
Ranking is by <b>percentage</b>.</div>
<h2>Overall</h2>${table(overall)}
${classes.map(([cls, list]) => {
  const avg = (list.reduce((a, r) => a + r.pct, 0) / list.length).toFixed(1);
  const timed = list.filter(r => r.timeSec !== null);
  const avgTime = timed.length ? Math.round(timed.reduce((a, r) => a + r.timeSec, 0) / timed.length) : null;
  return `<h2>${htmlEsc(cls)}</h2><div class="meta">${list.length} students &middot; class average ${avg}% &middot; average time ${fmtTime(avgTime)} &middot; top: <b>${htmlEsc(list[0].name)}</b> (${list[0].pct}%)</div>${table(list)}`;
}).join("")}
${noShow.length ? `<h2>Registered but did not attempt (${noShow.length})</h2><table><thead><tr><th>#</th><th>Roll No</th><th>Name</th><th>Class</th></tr></thead><tbody>${
  noShow.map((n, i) => `<tr><td>${i + 1}</td><td class="mono">${htmlEsc(n.roll)}</td><td>${htmlEsc(n.name)}</td><td>${htmlEsc(n.cls)}</td></tr>`).join("")
}</tbody></table>` : ""}
</body></html>`;
  const htmlFile = join(__dirname, `results-${slug}-${stamp}.html`);
  writeFileSync(htmlFile, html);

  console.log(`    CSV : ${csvFile}`);
  console.log(`    HTML: ${htmlFile}   <- open in a browser, Ctrl+P -> Save as PDF`);
}

for (const id of CONTESTS) await buildReport(id);
console.log("\ndone - read-only, nothing written to Firestore");
process.exit(0);
