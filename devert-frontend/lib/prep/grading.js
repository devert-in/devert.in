// The ONLY scoring implementation (design §9). Both the student review page
// and the faculty dashboards import this — scores are NEVER trusted from the
// submission doc, they are always recomputed from responses + key at read time.
//
// Pure function. No firebase imports.
//
//   scoreSubmission(responses, key, paper)
//     responses: prepSubmissions.responses — { [idx]: number | { lang, code, publicPassed, publicTotal } }
//     key:       prepExamKeys doc          — { answers: { [idx]: correctIndex }, ... }
//     paper:     prepExamPapers doc        — { questions: [{ idx, type, marks, ... }] }
//   → { total, max, perQuestion: [{ idx, type, correct, chosen, correctIndex, marksAwarded, marks }] }

const round2 = (n) => Math.round(n * 100) / 100;

export function scoreSubmission(responses, key, paper) {
  const questions = (paper && Array.isArray(paper.questions) && paper.questions) || [];
  const answers = (key && key.answers) || {};
  const resp = responses || {};

  const perQuestion = questions.map((q, pos) => {
    const idx = q && q.idx != null ? q.idx : pos;
    const marks = Number(q && q.marks) || 0;
    const raw = resp[idx]; // numeric idx coerces to the string map key

    if (q && q.type === "coding") {
      // Coding marks are scaled by the public test-case pass ratio recorded in
      // the response at submit time. Re-running hidden tests against the key's
      // hiddenTestCases is a staff-side future upgrade — the stored code makes
      // that possible without touching this contract.
      const publicPassed = raw && typeof raw === "object" ? Number(raw.publicPassed) || 0 : 0;
      const publicTotal = raw && typeof raw === "object" ? Number(raw.publicTotal) || 0 : 0;
      const ratio = publicTotal > 0 ? Math.min(publicPassed / publicTotal, 1) : 0;
      return {
        idx,
        type: "coding",
        correct: publicTotal > 0 && publicPassed >= publicTotal,
        chosen: null,
        correctIndex: null,
        marksAwarded: round2(marks * ratio),
        marks,
      };
    }

    // MCQ: correct iff responses[idx] === key.answers[idx]
    const keyed = answers[idx];
    const correctIndex = typeof keyed === "number" ? keyed : null;
    const chosen = typeof raw === "number" ? raw : null;
    const correct = chosen !== null && correctIndex !== null && chosen === correctIndex;
    return {
      idx,
      type: "mcq",
      correct,
      chosen,
      correctIndex,
      marksAwarded: correct ? marks : 0,
      marks,
    };
  });

  const total = round2(perQuestion.reduce((sum, q) => sum + q.marksAwarded, 0));
  const max = round2(perQuestion.reduce((sum, q) => sum + q.marks, 0));
  return { total, max, perQuestion };
}
