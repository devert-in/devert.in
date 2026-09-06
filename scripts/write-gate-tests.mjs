// Writes authored GATE subject tests (scripts/gate-tests-content/*.mjs) into
// Firestore: one gate_tests document per (paper, subject), each with its
// `questions` and `answerKeys` subcollections split exactly per
// lib/gateTests.js's own trust boundary (questions carry no answers;
// answerKeys are the only place a correct answer/explanation lives).
//
// Every question here is ORIGINAL, GATE-style content authored fresh for
// this test - not a real past-year paper (that's a "pyq"-type test, sourced
// and verified separately). Fan-out mirrors write-gate-lessons.mjs: a test
// authored once for a subjectId is written to every paper whose syllabus
// tree actually contains that subject, discovered live rather than assumed.
//
// Usage:
//   node scripts/write-gate-tests.mjs --dry-run
//   node scripts/write-gate-tests.mjs

import admin from "firebase-admin";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

import { TEST as ENGINEERING_MATHEMATICS } from "./gate-tests-content/engineering-mathematics.mjs";
import { TEST as DIGITAL_LOGIC } from "./gate-tests-content/digital-logic.mjs";
import { TEST as PROGRAMMING_AND_DATA_STRUCTURES } from "./gate-tests-content/programming-and-data-structures.mjs";
import { TEST as ALGORITHMS } from "./gate-tests-content/algorithms.mjs";
import { TEST as COMPUTER_ORGANIZATION_AND_ARCHITECTURE } from "./gate-tests-content/computer-organization-and-architecture.mjs";
import { TEST as OPERATING_SYSTEM } from "./gate-tests-content/operating-system.mjs";
import { TEST as THEORY_OF_COMPUTATION } from "./gate-tests-content/theory-of-computation.mjs";
import { TEST as COMPILER_DESIGN } from "./gate-tests-content/compiler-design.mjs";
import { TEST as DATABASES } from "./gate-tests-content/databases.mjs";
import { TEST as COMPUTER_NETWORKS } from "./gate-tests-content/computer-networks.mjs";
import { TEST as GENERAL_APTITUDE } from "./gate-tests-content/general-aptitude.mjs";

const ALL_TESTS = [
  ENGINEERING_MATHEMATICS, DIGITAL_LOGIC, PROGRAMMING_AND_DATA_STRUCTURES, ALGORITHMS,
  COMPUTER_ORGANIZATION_AND_ARCHITECTURE, OPERATING_SYSTEM, THEORY_OF_COMPUTATION,
  COMPILER_DESIGN, DATABASES, COMPUTER_NETWORKS, GENERAL_APTITUDE,
];

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DRY_RUN = process.argv.includes("--dry-run");

const serviceAccount = JSON.parse(readFileSync(path.join(__dirname, "service-account.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

function buildQuestionDoc(q, order) {
  return {
    questionType: q.questionType || "mcq",
    marks: Number(q.marks) === 2 ? 2 : 1,
    question: (q.question || "").trim(),
    options: q.questionType === "nat" ? [] : (q.options || []).filter(o => o?.text?.trim()),
    subjectId: q.subjectId || "",
    topicId: q.topicId || "",
    difficulty: q.difficulty || "Moderate",
    natUnit: (q.natUnit || "").trim(),
    imageUrl: "",
    codeSnippet: q.codeSnippet || "",
    estimatedTimeSec: q.estimatedTimeSec || null,
    order,
  };
}

function buildAnswerKeyDoc(q) {
  return {
    correctOptionIds: q.questionType === "nat" ? [] : (q.correctOptionIds || []),
    natMin: q.questionType === "nat" ? Number(q.natMin) : null,
    natMax: q.questionType === "nat" ? Number(q.natMax ?? q.natMin) : null,
    solution: (q.solution || "").trim(),
    explanation: (q.explanation || "").trim(),
    alternateSolution: "",
    timeSavingTrick: "",
    whyStudentsErr: "",
    relatedConcepts: [],
  };
}

async function papersHavingSubject(subjectId) {
  const candidates = ["cs", "cs-da", "da"];
  const found = [];
  for (const paperId of candidates) {
    const snap = await db.doc(`gatePapers/${paperId}/subjects/${subjectId}`).get();
    if (snap.exists) found.push(paperId);
  }
  return found;
}

async function run() {
  let totalTests = 0, totalQuestions = 0;

  for (const test of ALL_TESTS) {
    const totalMarks = test.questions.reduce((n, q) => n + (Number(q.marks) === 2 ? 2 : 1), 0);
    const papers = await papersHavingSubject(test.subjectId);
    console.log(`\n=== ${test.subjectId} (${test.questions.length} questions, ${totalMarks} marks) -> papers: ${papers.join(", ") || "NONE FOUND - skipped"} ===`);
    if (!papers.length) continue;

    for (const paperId of papers) {
      totalTests++;
      totalQuestions += test.questions.length;
      const testDocData = {
        paperId,
        title: test.title,
        description: test.description || "",
        testType: test.testType || "subject",
        durationMinutes: test.durationMinutes,
        instructions: test.instructions || "",
        subjectIds: [test.subjectId],
        topicIds: [],
        sourceYear: null,
        status: "published",
        order: 1,
        questionCount: test.questions.length,
        totalMarks,
      };

      if (DRY_RUN) {
        console.log(`  [dry-run] would create gate_tests/${paperId}_${test.subjectId} with ${test.questions.length} questions + answer keys`);
        continue;
      }

      const testRef = db.collection("gate_tests").doc(`${paperId}_${test.subjectId}_subjecttest`);
      await testRef.set({
        ...testDocData,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });

      let order = 1;
      for (const q of test.questions) {
        const qWithSubject = { ...q, subjectId: test.subjectId };
        const qRef = testRef.collection("questions").doc();
        await qRef.set({ ...buildQuestionDoc(qWithSubject, order), createdAt: admin.firestore.FieldValue.serverTimestamp() });
        await testRef.collection("answerKeys").doc(qRef.id).set(buildAnswerKeyDoc(qWithSubject));
        order++;
      }
      console.log(`  wrote gate_tests/${testRef.id} with ${test.questions.length} questions + answer keys`);
    }
  }

  console.log(`\n${DRY_RUN ? "Dry run complete" : "Done"}: ${totalTests} test document(s), ${totalQuestions} question(s) total (across all paper fan-outs).`);
}

run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
