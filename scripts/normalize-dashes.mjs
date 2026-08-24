import admin from "firebase-admin";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(path.join(__dirname, "service-account.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const EM_DASH = "—";
const EN_DASH = "–";
const DASH_RE = /[—–]/;

// " word — word " -> " word - word " (spaced dash stays spaced, just swapped)
// "word—word"     -> "word-word" (bare dash, no spaces added)
function normalizeDashes(str) {
  if (typeof str !== "string" || !DASH_RE.test(str)) return str;
  return str
    .replace(/\s+[—–]\s+/g, " - ")
    .replace(/[—–]/g, "-");
}

function normalizeValue(v) {
  if (typeof v === "string") return normalizeDashes(v);
  if (Array.isArray(v)) return v.map(normalizeValue);
  if (v && typeof v === "object" && typeof v.toDate !== "function") {
    const out = {};
    for (const [k, val] of Object.entries(v)) out[k] = normalizeValue(val);
    return out;
  }
  return v;
}

function hasDash(v) {
  if (typeof v === "string") return DASH_RE.test(v);
  if (Array.isArray(v)) return v.some(hasDash);
  if (v && typeof v === "object" && typeof v.toDate !== "function") return Object.values(v).some(hasDash);
  return false;
}

async function fixCollection(colRef, label) {
  const snap = await colRef.get();
  let changed = 0;
  for (const doc of snap.docs) {
    const data = doc.data();
    if (!hasDash(data)) continue;
    const fixed = {};
    for (const [k, v] of Object.entries(data)) {
      if (hasDash(v)) fixed[k] = normalizeValue(v);
    }
    await doc.ref.update(fixed);
    changed++;
  }
  console.log(`${label}: ${changed}/${snap.size} docs updated`);
  return changed;
}

async function main() {
  let total = 0;

  // Programming module (global) - the biggest source, just authored today
  const langsSnap = await db.collection("programmingLanguages").get();
  total += await fixCollection(db.collection("programmingLanguages"), "programmingLanguages (top-level)");
  for (const langDoc of langsSnap.docs) {
    total += await fixCollection(
      db.collection("programmingLanguages").doc(langDoc.id).collection("topics"),
      `programmingLanguages/${langDoc.id}/topics`
    );
  }

  // CS Core (global)
  const subjSnap = await db.collection("csCoreSubjects").get();
  total += await fixCollection(db.collection("csCoreSubjects"), "csCoreSubjects (top-level)");
  for (const subjDoc of subjSnap.docs) {
    total += await fixCollection(
      db.collection("csCoreSubjects").doc(subjDoc.id).collection("topics"),
      `csCoreSubjects/${subjDoc.id}/topics`
    );
  }

  // Opportunities (global)
  total += await fixCollection(db.collection("opportunities"), "opportunities");

  // CodeLab problems - solutions.{brute,better,optimal} authored earlier this session
  total += await fixCollection(db.collection("problems"), "problems");

  // Companies / rounds / categories / questions (Company Vault content)
  const companiesSnap = await db.collection("companies").get();
  total += await fixCollection(db.collection("companies"), "companies");
  for (const companyDoc of companiesSnap.docs) {
    const roundsSnap = await db.collection("companies").doc(companyDoc.id).collection("rounds").get();
    total += await fixCollection(db.collection("companies").doc(companyDoc.id).collection("rounds"), `companies/${companyDoc.id}/rounds`);
    for (const roundDoc of roundsSnap.docs) {
      const catsSnap = await db.collection("companies").doc(companyDoc.id).collection("rounds").doc(roundDoc.id).collection("categories").get();
      total += await fixCollection(
        db.collection("companies").doc(companyDoc.id).collection("rounds").doc(roundDoc.id).collection("categories"),
        `companies/${companyDoc.id}/rounds/${roundDoc.id}/categories`
      );
      for (const catDoc of catsSnap.docs) {
        total += await fixCollection(
          db.collection("companies").doc(companyDoc.id).collection("rounds").doc(roundDoc.id).collection("categories").doc(catDoc.id).collection("questions"),
          `companies/${companyDoc.id}/rounds/${roundDoc.id}/categories/${catDoc.id}/questions`
        );
      }
    }
  }

  // Institutions (Daily Learning content is a subcollection per institution)
  const instSnap = await db.collection("institutions").get();
  total += await fixCollection(db.collection("institutions"), "institutions");
  for (const instDoc of instSnap.docs) {
    total += await fixCollection(
      db.collection("institutions").doc(instDoc.id).collection("dailyLearning"),
      `institutions/${instDoc.id}/dailyLearning`
    );
  }

  console.log("\nTOTAL DOCS UPDATED:", total);
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
