import admin from "firebase-admin";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(join(__dirname, "service-account.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const issues = [];

const companySnap = await db.collection("companies").where("name", "==", "Knowvation Learnings").get();
if (companySnap.empty) { console.log("ISSUE: Knowvation Learnings company not found."); process.exit(1); }
const companyDoc = companySnap.docs[0];
const company = companyDoc.data();

if (!company.description?.trim()) issues.push("company: EMPTY description");
if (!company.eligibility?.trim()) issues.push("company: EMPTY eligibility");
if (!company.prepRoadmap?.length) issues.push("company: EMPTY prepRoadmap");
company.prepRoadmap?.forEach((d, i) => {
  if (!d.title?.trim()) issues.push(`prepRoadmap[${i}]: missing title`);
  if (!d.tasks?.length) issues.push(`prepRoadmap[${i}]: no tasks`);
});

const roundsSnap = await companyDoc.ref.collection("rounds").get();
if (roundsSnap.size !== 4) issues.push(`Expected 4 rounds, found ${roundsSnap.size}`);

let totalCategories = 0, totalQuestions = 0;
for (const roundDoc of roundsSnap.docs) {
  const round = roundDoc.data();
  const label = `round/${round.name}`;
  for (const f of ["whatTheyEvaluate", "format", "eliminationCriteria", "prepStrategy", "commonMistakes"]) {
    if (!round[f]?.trim()) issues.push(`${label}: EMPTY ${f}`);
  }
  const catSnap = await roundDoc.ref.collection("categories").get();
  totalCategories += catSnap.size;
  for (const catDoc of catSnap.docs) {
    const cat = catDoc.data();
    const catLabel = `${label}/category/${cat.name}`;
    if (!cat.concept?.trim()) issues.push(`${catLabel}: EMPTY concept`);
    if (!cat.keyPoints?.length) issues.push(`${catLabel}: EMPTY keyPoints`);
    if (!cat.commonMistakes?.length) issues.push(`${catLabel}: EMPTY commonMistakes`);
    if (!cat.interviewTips?.length) issues.push(`${catLabel}: EMPTY interviewTips`);
    if (!cat.whatYoullLearn?.length) issues.push(`${catLabel}: EMPTY whatYoullLearn`);

    const qSnap = await catDoc.ref.collection("questions").get();
    totalQuestions += qSnap.size;
    if (qSnap.size < 6) issues.push(`${catLabel}: only ${qSnap.size} questions (expected 6+)`);
    qSnap.docs.forEach(qDoc => {
      const q = qDoc.data();
      const qLabel = `${catLabel}/q/${qDoc.id}`;
      if (!q.question?.trim()) issues.push(`${qLabel}: missing question text`);
      if (!q.options || q.options.length < 2) issues.push(`${qLabel}: fewer than 2 options`);
      if (typeof q.correctIndex !== "number" || q.correctIndex < 0 || q.correctIndex >= (q.options?.length || 0)) {
        issues.push(`${qLabel}: correctIndex (${q.correctIndex}) out of bounds`);
      }
      if (!q.explanation?.trim()) issues.push(`${qLabel}: missing explanation`);
    });
  }
}

const expSnap = await companyDoc.ref.collection("interviewExperiences").get();
if (expSnap.size === 0) issues.push("No interview experiences found");
expSnap.docs.forEach(d => {
  const e = d.data();
  if (!e.tips?.trim()) issues.push(`interviewExperience/${d.id}: missing tips`);
});

const mockSnap = await companyDoc.ref.collection("mockInterviews").get();
if (mockSnap.size === 0) issues.push("No mock interviews found");
mockSnap.docs.forEach(d => {
  const m = d.data();
  if (!m.categoryRefs?.length) issues.push(`mockInterview/${d.id} (${m.name}): no categoryRefs - would run with zero questions`);
});

console.log(`\n=== Knowvation Learnings (${companyDoc.id}) ===`);
console.log(`${roundsSnap.size} rounds, ${totalCategories} categories, ${totalQuestions} questions, ${expSnap.size} interview experiences, ${mockSnap.size} mock interviews.`);
if (issues.length === 0) {
  console.log("OK - no structural issues found.");
} else {
  issues.forEach(i => console.log("ISSUE:", i));
}
console.log(`\nTotal issues found: ${issues.length}`);
process.exit(issues.length > 0 ? 1 : 0);
