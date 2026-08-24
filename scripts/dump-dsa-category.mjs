import admin from "firebase-admin";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(path.join(__dirname, "service-account.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const category = process.argv[2];

async function main() {
  const snap = await db.collection("problems").where("category", "==", category).get();
  snap.docs.forEach(d => {
    const p = d.data();
    console.log(`\n### ${d.id} | ${p.difficulty} | ${p.title}`);
    console.log("STATEMENT:", p.statement);
    console.log("CONSTRAINTS:", p.constraints);
    console.log("EXAMPLES:", p.examplesText);
    console.log("HINTS:", JSON.stringify(p.hints));
  });
  console.log(`\nTotal in ${category}: ${snap.size}`);
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
