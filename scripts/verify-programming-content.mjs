import admin from "firebase-admin";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(path.join(__dirname, "service-account.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const LANG_IDS_TO_CHECK = process.argv.slice(2).length ? process.argv.slice(2) : ["java"];

async function verifyLanguage(langId) {
  const issues = [];
  const snap = await db.collection("programmingLanguages").doc(langId).collection("topics").get();
  const topics = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  const seenIds = new Map();
  for (const t of topics) seenIds.set(t.id, (seenIds.get(t.id) || 0) + 1);
  for (const [id, count] of seenIds) {
    if (count > 1) issues.push(`DUPLICATE topic id "${id}" appears ${count} times`);
  }

  for (const t of topics) {
    const label = `${langId}/${t.id}`;
    const hasContent = !!(t.concept?.trim() || t.keyPoints?.length || t.codeExample?.code?.trim());
    if (!hasContent) { issues.push(`${label}: NO CONTENT AT ALL (renders Coming Soon)`); continue; }
    if (!t.concept || !t.concept.trim()) issues.push(`${label}: EMPTY concept`);
    if (!t.keyPoints || t.keyPoints.length === 0) issues.push(`${label}: EMPTY keyPoints`);
    if (!t.commonMistakes || t.commonMistakes.length === 0) issues.push(`${label}: EMPTY commonMistakes`);
    if (!t.interviewTips || t.interviewTips.length === 0) issues.push(`${label}: EMPTY interviewTips`);
    if (!t.realWorldApplications || t.realWorldApplications.length === 0) issues.push(`${label}: EMPTY realWorldApplications`);
    if (!t.assignment || !t.assignment.trim()) issues.push(`${label}: MISSING assignment`);
    if (!t.goingDeeper || !t.goingDeeper.trim()) issues.push(`${label}: MISSING goingDeeper`);
    if (!t.codeExample || !t.codeExample.code || !t.codeExample.code.trim()) {
      issues.push(`${label}: EMPTY codeExample`);
    } else {
      const opens = (t.codeExample.code.match(/\{/g) || []).length;
      const closes = (t.codeExample.code.match(/\}/g) || []).length;
      if (opens !== closes) issues.push(`${label}: codeExample has UNBALANCED BRACES (${opens} open vs ${closes} close) - likely truncated`);
    }
    if (!t.whatYoullLearn || t.whatYoullLearn.length === 0) issues.push(`${label}: EMPTY whatYoullLearn`);

    if (!t.mcqs || t.mcqs.length === 0) {
      issues.push(`${label}: NO MCQs`);
    } else {
      t.mcqs.forEach((q, i) => {
        if (!q.question || !q.question.trim()) issues.push(`${label}: mcq[${i}] missing question text`);
        if (!q.options || q.options.length < 2) issues.push(`${label}: mcq[${i}] has fewer than 2 options`);
        if (typeof q.correctIndex !== "number" || q.correctIndex < 0 || (q.options && q.correctIndex >= q.options.length)) {
          issues.push(`${label}: mcq[${i}] correctIndex (${q.correctIndex}) out of bounds for ${q.options?.length} options`);
        }
        (q.options || []).forEach((opt, oi) => {
          if (!opt || !opt.trim()) issues.push(`${label}: mcq[${i}] option[${oi}] is empty`);
        });
      });
    }
  }

  return { langId, topicCount: topics.length, contentCount: topics.filter(t => t.concept?.trim() || t.keyPoints?.length || t.codeExample?.code?.trim()).length, issues };
}

async function main() {
  let totalIssues = 0;
  for (const langId of LANG_IDS_TO_CHECK) {
    const result = await verifyLanguage(langId);
    console.log(`\n=== ${result.langId} (${result.contentCount}/${result.topicCount} topics have content) ===`);
    if (result.issues.length === 0) {
      console.log("  OK - no structural issues found among content-bearing topics.");
    } else {
      result.issues.forEach(i => console.log("  ISSUE:", i));
      totalIssues += result.issues.length;
    }
  }
  console.log(`\nTotal issues found: ${totalIssues}`);
  process.exit(totalIssues > 0 ? 1 : 0);
}

main().catch(e => { console.error(e); process.exit(1); });
