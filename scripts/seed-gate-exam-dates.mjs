// Sets the real GATE 2027 exam date on each paper doc, so gate-overview.jsx's
// "Days to Exam" tile (lib/gate.js's daysUntilExam()) shows a genuine
// countdown instead of "Date not announced yet". Source: gate2027.iitm.ac.in's
// Important Dates page, fetched directly - all dates below cross-checked
// against their own stated day-of-week (all matched exactly).
//
//   GOAPS opens:              14 Aug 2026 (Fri) / 27 Aug 2026 (Thu)
//   Regular registration end: 21 Sep 2026 (Mon) / 27 Sep 2026 (Sun)
//   Extended registration end:30 Sep 2026 (Wed) / 5 Oct 2026 (Mon)
//   City allotment notice:    4 Jan 2027 (Mon)
//   Admit card download:      TBA
//   Examination:              6-7 Feb 2027, 13-14 Feb 2027, 20-21 Feb 2027 (Sat/Sun each)
//   Results:                  19 Mar 2027 (Fri)
//
// examDate is set to the FIRST exam day (6 Feb 2027) - a candidate sits on one
// specific day within this 3-weekend window, not all three, so the first day
// is the earliest-honest countdown target. All dates are officially "liable
// to change" per the source page - this is a point-in-time value, not a
// promise, exactly like every other GATE-derived fact in this codebase.
//
// Usage:
//   node scripts/seed-gate-exam-dates.mjs --dry-run
//   node scripts/seed-gate-exam-dates.mjs

import admin from "firebase-admin";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DRY_RUN = process.argv.includes("--dry-run");

const serviceAccount = JSON.parse(readFileSync(path.join(__dirname, "service-account.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const EXAM_DATE = new Date("2027-02-06T00:00:00+05:30"); // first exam day, IST
const PAPERS = ["cs", "da", "cs-da"];

async function run() {
  console.log(DRY_RUN ? "DRY RUN - nothing will be written.\n" : "APPLYING - Firestore will be written.\n");
  for (const paperId of PAPERS) {
    const ref = db.collection("gatePapers").doc(paperId);
    const snap = await ref.get();
    if (!snap.exists) { console.log(`  gatePapers/${paperId}  SKIPPED - no such paper`); continue; }
    console.log(`  gatePapers/${paperId}  examDate -> 2027-02-06 (IST midnight; toISOString below is UTC, so it prints one day earlier)`);
    if (!DRY_RUN) {
      await ref.set({
        examDate: admin.firestore.Timestamp.fromDate(EXAM_DATE),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
    }
  }
  console.log(`\n${PAPERS.length} paper(s) ${DRY_RUN ? "would be updated" : "updated"}.`);
}

run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
