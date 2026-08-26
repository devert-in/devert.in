import admin from "firebase-admin";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(path.join(__dirname, "service-account.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function main() {
  console.log("=== PROGRAMMING LANGUAGES ===");
  const langsSnap = await db.collection("programmingLanguages").get();
  for (const langDoc of langsSnap.docs) {
    const topicsSnap = await db.collection("programmingLanguages").doc(langDoc.id).collection("topics").get();
    let authored = 0;
    topicsSnap.docs.forEach(d => { const t = d.data(); if (t.concept?.trim() || t.keyPoints?.length) authored++; });
    console.log(`${langDoc.id}: ${authored}/${topicsSnap.size} topics authored`);
  }

  console.log("\n=== CS CORE SUBJECTS ===");
  const subjSnap = await db.collection("csCoreSubjects").get();
  for (const subjDoc of subjSnap.docs) {
    const topicsSnap = await db.collection("csCoreSubjects").doc(subjDoc.id).collection("topics").get();
    let authored = 0;
    topicsSnap.docs.forEach(d => { const t = d.data(); if (t.concept?.trim() || t.keyPoints?.length) authored++; });
    console.log(`${subjDoc.id}: ${authored}/${topicsSnap.size} topics authored`);
  }
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
