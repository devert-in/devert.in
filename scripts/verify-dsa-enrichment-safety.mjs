import admin from "firebase-admin";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(path.join(__dirname, "service-account.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function main() {
  const snap = await db.collection("problems").get();
  const enriched = snap.docs.filter(d => !!d.data().simpleExplanation);
  console.log(`Found ${enriched.length} problems with enrichment applied.\n`);

  let issues = 0;
  for (const d of enriched) {
    const p = d.data();
    const label = `${d.id} (${p.title})`;
    if (!p.statement || !p.statement.trim()) { console.log(`ISSUE: ${label} - statement is empty!`); issues++; }
    if (!p.constraints) { console.log(`NOTE: ${label} - constraints is falsy (may be legitimately empty)`); }
    if (!p.examplesText || !p.examplesText.trim()) { console.log(`ISSUE: ${label} - examplesText is empty!`); issues++; }
    if (!p.hints || p.hints.length === 0) { console.log(`NOTE: ${label} - hints is empty (may be legitimate)`); }
    // Structural check on the new fields themselves
    const requiredFields = ["simpleExplanation", "realWorldAnalogy", "dryRun", "bruteForceIntuition", "optimizedIntuition", "timeComplexityPlain", "spaceComplexityPlain", "interviewTip", "keyObservation"];
    for (const f of requiredFields) {
      if (!p[f] || !String(p[f]).trim()) { console.log(`ISSUE: ${label} - missing/empty enrichment field: ${f}`); issues++; }
    }
    if (!p.visualWalkthrough || p.visualWalkthrough.length === 0) { console.log(`ISSUE: ${label} - missing/empty visualWalkthrough`); issues++; }
  }
  console.log(`\nTotal enriched: ${enriched.length}, issues found: ${issues}`);
  process.exit(issues > 0 ? 1 : 0);
}
main().catch(e => { console.error(e); process.exit(1); });
