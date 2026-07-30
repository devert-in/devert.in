// Read-only report on what the GATE module actually has in Firestore. Writes
// nothing.
//
//   node scripts/audit-gate-content.mjs
//
// The GATE workspace renders "GATE preparation is being set up" when
// fetchPapers() (which filters on status == "published") comes back empty, and
// each of its sixteen sections renders its own GateNoContent state when its own
// bank is empty. This tells you which of those is the case, so a blank screen
// can be traced to the exact missing collection rather than guessed at.

import admin from "firebase-admin";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(path.join(__dirname, "service-account.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

function hasBody(t) {
  return !!(t.concept?.trim() || t.keyPoints?.length || t.formulas?.length);
}

const papers = await db.collection("gatePapers").get();

if (papers.empty) {
  console.log("gatePapers: EMPTY - no paper documents at all.");
  console.log("  The module renders \"GATE preparation is being set up\" for every student.");
} else {
  console.log(`gatePapers: ${papers.size} paper(s)\n`);
  for (const paper of papers.docs) {
    const p = paper.data();
    console.log(`=== ${paper.id}  (${p.name || "unnamed"})  status=${p.status || "MISSING"} ===`);
    const subjects = await paper.ref.collection("subjects").get();
    let topics = 0, published = 0, withBody = 0, words = 0;
    const rows = [];
    for (const s of subjects.docs) {
      const ts = await s.ref.collection("topics").get();
      let sBody = 0, sWords = 0;
      for (const t of ts.docs) {
        const d = t.data();
        topics++;
        if (d.status === "published") published++;
        if (hasBody(d)) { withBody++; sBody++; sWords += (d.concept || "").split(/\s+/).filter(Boolean).length; }
      }
      words += sWords;
      rows.push({ id: s.id, status: s.data().status, topics: ts.size, withBody: sBody, words: sWords });
    }
    for (const r of rows) {
      console.log(`  ${r.id.padEnd(44)} ${String(r.topics).padStart(3)} topics  ${String(r.withBody).padStart(3)} with body  ${String(r.words).padStart(6)}w  ${r.status !== "published" ? `[${r.status}]` : ""}`);
    }
    console.log(`  -- ${subjects.size} subjects | ${topics} topics (${published} published) | ${withBody} with a lesson body | ${words} words\n`);
  }
}

// The flat, paperId-tagged banks each GATE section reads from.
for (const col of ["gate_pyqs", "gate_tests", "gate_formulas", "gate_resources"]) {
  const snap = await db.collection(col).get();
  const byPaper = {};
  for (const d of snap.docs) {
    const key = d.data().paperId || "(untagged)";
    byPaper[key] = (byPaper[key] || 0) + 1;
  }
  const detail = Object.entries(byPaper).map(([k, n]) => `${k}=${n}`).join(" ");
  console.log(`${col.padEnd(16)} ${String(snap.size).padStart(5)} doc(s)${detail ? `   ${detail}` : ""}`);
}

process.exit(0);
