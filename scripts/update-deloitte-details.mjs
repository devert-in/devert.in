import admin from "firebase-admin";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(join(__dirname, "service-account.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// Fills in the CTC/eligibility fields the Deloitte placement PDF itself
// never stated (unlike the TCS PDFs, which gave exact figures) - sourced
// from public reporting (salaryinsight.in, PrepInsta, CareerWithMohit,
// freshersnow.com) rather than invented, since these numbers directly
// inform a student's real decisions.

const snap = await db.collection("companies").where("name", "==", "Deloitte").get();
if (snap.empty) { console.log('No "Deloitte" company found.'); process.exit(1); }

await snap.docs[0].ref.update({
  ctc: "4 - 15 LPA (Audit/Tax Analyst ~4-6, USI Tech Analyst ~7-9, Consulting ~8-15, role-dependent)",
  eligibility: "B.E./B.Tech/MCA/M.Sc (CS or IT) in any full-time, recognised engineering discipline. Minimum 60% or equivalent CGPA throughout Class 10, Class 12 and graduation/post-graduation. No active backlogs (cleared historical backlogs are fine). Maximum one-year academic gap allowed after Class 12; no gap permitted during or after the degree.",
});

console.log(`Updated "Deloitte" (${snap.docs[0].id}) with researched CTC/eligibility.`);
