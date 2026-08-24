import admin from "firebase-admin";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(path.join(__dirname, "service-account.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function main() {
  const snap = await db.collection("problems").orderBy("category").get();
  const byCategory = {};
  snap.docs.forEach(d => {
    const data = d.data();
    if (!byCategory[data.category]) byCategory[data.category] = [];
    byCategory[data.category].push({ id: d.id, title: data.title, difficulty: data.difficulty, hasEnrichment: !!(data.simpleExplanation) });
  });
  let total = 0, enriched = 0;
  for (const [cat, problems] of Object.entries(byCategory)) {
    console.log(`\n=== ${cat} (${problems.length}) ===`);
    problems.forEach(p => {
      total++;
      if (p.hasEnrichment) enriched++;
      console.log(`  [${p.hasEnrichment ? "X" : " "}] ${p.id} | ${p.difficulty} | ${p.title}`);
    });
  }
  console.log(`\nTotal: ${total}, already enriched: ${enriched}`);
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
