import admin from "firebase-admin";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(path.join(__dirname, "service-account.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function tallySubjects(subjectIds) {
  let topics = 0, mcqs = 0, assignments = 0;
  for (const id of subjectIds) {
    const snap = await db.collection("csCoreSubjects").doc(id).collection("topics").get();
    snap.docs.forEach(d => {
      const t = d.data();
      if (t.concept?.trim() || t.keyPoints?.length) { topics++; mcqs += t.mcqs?.length || 0; if (t.assignment?.trim()) assignments++; }
    });
  }
  return { topics, mcqs, assignments };
}

async function tallyLanguage(langId) {
  const snap = await db.collection("programmingLanguages").doc(langId).collection("topics").get();
  let topics = 0, mcqs = 0, assignments = 0;
  snap.docs.forEach(d => {
    const t = d.data();
    if (t.concept?.trim() || t.keyPoints?.length) { topics++; mcqs += t.mcqs?.length || 0; if (t.assignment?.trim()) assignments++; }
  });
  return { topics, mcqs, assignments };
}

async function tallyDsa() {
  const snap = await db.collection("problems").get();
  const enriched = snap.docs.filter(d => !!d.data().simpleExplanation);
  return { total: snap.size, enriched: enriched.length };
}

async function main() {
  const cscore = await tallySubjects(["operating-systems", "dbms", "oop"]);
  const java = await tallyLanguage("java");
  const python = await tallyLanguage("python");
  const dsa = await tallyDsa();

  console.log("CS Core (OS+DBMS+OOP):", cscore);
  console.log("Java:", java);
  console.log("Python:", python);
  console.log("DSA:", dsa);

  const totalTopics = cscore.topics + java.topics + python.topics;
  const totalMcqs = cscore.mcqs + java.mcqs + python.mcqs;
  const totalAssignments = cscore.assignments + java.assignments + python.assignments;
  console.log(`\nGrand total lesson topics with content: ${totalTopics}`);
  console.log(`Grand total MCQs (lessons): ${totalMcqs}`);
  console.log(`Grand total assignments (lessons): ${totalAssignments}`);
  console.log(`DSA problems enriched: ${dsa.enriched} / ${dsa.total}`);
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
