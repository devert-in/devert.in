import admin from "firebase-admin";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(path.join(__dirname, "service-account.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const CATEGORY_FILTER = process.argv.slice(2); // e.g. "Quantitative" "Logical" "Verbal" - empty means all

async function main() {
  const snap = await db.collection("aptitude_topics").orderBy("order", "asc").get();
  const topics = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(t => CATEGORY_FILTER.length === 0 || CATEGORY_FILTER.includes(t.category));

  let totalIssues = 0;
  const byCategory = {};
  for (const t of topics) (byCategory[t.category] ||= []).push(t);

  for (const [category, catTopics] of Object.entries(byCategory)) {
    console.log(`\n=== ${category} (${catTopics.length} topics) ===`);
    for (const t of catTopics) {
      const issues = [];
      const label = t.name;
      if (!t.concept?.trim()) issues.push(`${label}: EMPTY concept`);
      if (!t.keyPoints?.length) issues.push(`${label}: EMPTY keyPoints`);
      if (!t.commonMistakes?.length) issues.push(`${label}: EMPTY commonMistakes`);
      if (!t.interviewTips?.length) issues.push(`${label}: EMPTY interviewTips`);
      if (!t.whatYoullLearn?.length) issues.push(`${label}: EMPTY whatYoullLearn`);
      if (!t.mcqs?.length) {
        issues.push(`${label}: NO topic-level mcqs`);
      } else {
        t.mcqs.forEach((q, i) => {
          if (!q.question?.trim()) issues.push(`${label}: mcq[${i}] missing question text`);
          if (!q.options || q.options.length < 2) issues.push(`${label}: mcq[${i}] fewer than 2 options`);
          if (typeof q.correctIndex !== "number" || q.correctIndex < 0 || q.correctIndex >= (q.options?.length || 0)) {
            issues.push(`${label}: mcq[${i}] correctIndex out of bounds`);
          }
        });
      }

      const qSnap = await db.collection("aptitude_topics").doc(t.id).collection("questions").get();
      const questions = qSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      if (questions.length === 0) issues.push(`${label}: NO practice questions`);
      questions.forEach(q => {
        const qLabel = `${label}/q/${q.id}`;
        if (!q.question?.trim()) issues.push(`${qLabel}: missing question text`);
        if (!q.options || q.options.length < 2) issues.push(`${qLabel}: fewer than 2 options`);
        if (typeof q.correctIndex !== "number" || q.correctIndex < 0 || q.correctIndex >= (q.options?.length || 0)) {
          issues.push(`${qLabel}: correctIndex (${q.correctIndex}) out of bounds for ${q.options?.length} options`);
        }
        if (!q.explanation?.trim()) issues.push(`${qLabel}: missing explanation`);
      });

      if (issues.length === 0) {
        console.log(`  OK - ${label} (${questions.length} practice questions, ${t.mcqs?.length || 0} topic quiz MCQs)`);
      } else {
        issues.forEach(i => console.log("  ISSUE:", i));
        totalIssues += issues.length;
      }
    }
  }

  console.log(`\nTotal issues found: ${totalIssues}`);
  process.exit(totalIssues > 0 ? 1 : 0);
}

main().catch(e => { console.error(e); process.exit(1); });
