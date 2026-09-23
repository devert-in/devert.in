// Normalises em/en dashes to a plain hyphen across EVERY Campus content
// collection in Firestore.
//
// Supersedes normalize-dashes.mjs, which covered only six roots
// (programmingLanguages, csCoreSubjects, opportunities, problems, companies,
// institutions) and predates GATE, Roadmaps, DSA sheets/concepts, Aptitude,
// Software Engineering and the global Daily Learning bank.
//
// SCOPE IS AN EXPLICIT ALLOW-LIST, not every collection in the project. It
// covers authored LEARNING CONTENT only. User-generated text - users,
// pulse_posts, submissions, comments, coin_transactions - is deliberately NOT
// touched: rewriting what a student typed is not ours to do, and none of it is
// the "Campus content" this was asked for.
//
// SUBCOLLECTION DISCOVERY IS SAMPLED, NOT PER-DOCUMENT. An earlier version
// called listCollections() on every document, which is one network round trip
// per doc and took longer than the whole rest of the job - on a bank the size
// of gate_pyqs that is thousands of sequential calls. Firestore has no way to
// list subcollections collection-wide, but within one collection the shape is
// uniform in this schema (every gatePapers doc has `subjects`, every companies
// doc has `rounds`), so this samples the first SAMPLE_N docs of a collection,
// unions the subcollection names it finds, and walks those names on every doc.
// If a collection ever holds documents with genuinely different children, raise
// SAMPLE_N or list that parent explicitly.
//
// DRY RUN BY DEFAULT. Pass --apply to write. An --apply run writes every
// document it changes to scripts/dash-normalize-backup-<ISO>.json first,
// matching the backup convention the other one-off scripts here use, so the
// edit is reversible.

import admin from "firebase-admin";
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(path.join(__dirname, "service-account.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const APPLY = process.argv.includes("--apply");
const SAMPLE_N = 3;
// Deliberately far below Firestore's 500-write cap. A first --apply run died
// to `14 UNAVAILABLE: read ECONNRESET` partway through, and because the
// backup was only written at the very end and the batch only flushed every
// 400 writes, the run lost everything it had done. Small batches + an
// append-as-you-go backup mean a dropped connection now costs one batch.
const BATCH_LIMIT = 50;
const DASH_RE = /[—–]/;

// Same two rules as the source-code sweep, so database and codebase end up
// with identical typography:
//   " word - word "  spaced dash stays spaced, just swapped
//   "word-word"      bare dash, no spaces introduced
function normalizeDashes(str) {
  if (typeof str !== "string" || !DASH_RE.test(str)) return str;
  return str.replace(/\s+[—–]\s+/g, " - ").replace(/[—–]/g, "-");
}

// Timestamps, GeoPoints and DocumentReferences must pass through untouched.
function isPlainData(v) {
  return v && typeof v === "object"
    && typeof v.toDate !== "function"
    && !(v instanceof admin.firestore.GeoPoint)
    && !(v instanceof admin.firestore.DocumentReference);
}

function normalizeValue(v) {
  if (typeof v === "string") return normalizeDashes(v);
  if (Array.isArray(v)) return v.map(normalizeValue);
  if (isPlainData(v)) {
    const out = {};
    for (const [k, val] of Object.entries(v)) out[k] = normalizeValue(val);
    return out;
  }
  return v;
}

function hasDash(v) {
  if (typeof v === "string") return DASH_RE.test(v);
  if (Array.isArray(v)) return v.some(hasDash);
  if (isPlainData(v)) return Object.values(v).some(hasDash);
  return false;
}

function countDashes(v) {
  if (typeof v === "string") return (v.match(/[—–]/g) || []).length;
  if (Array.isArray(v)) return v.reduce((n, x) => n + countDashes(x), 0);
  if (isPlainData(v)) return Object.values(v).reduce((n, x) => n + countDashes(x), 0);
  return 0;
}

// Firestore's client retries internally but gives up after a 60s total
// deadline; on a flaky link that surfaces as UNAVAILABLE/ECONNRESET and
// kills the process. These are all transient and safe to retry: every
// operation here is either a read or an idempotent field overwrite.
const TRANSIENT = new Set([4, 8, 10, 13, 14]);
async function retry(label, fn, attempts = 5) {
  let delay = 1000;
  for (let i = 1; i <= attempts; i++) {
    try { return await fn(); }
    catch (e) {
      const code = e && e.code;
      if (i === attempts || !TRANSIENT.has(code)) throw e;
      console.log(`    retry ${i}/${attempts - 1} on ${label} (code ${code}) in ${delay}ms`);
      await new Promise(r => setTimeout(r, delay));
      delay *= 2;
    }
  }
}

function tsReplacer(_k, v) {
  if (v && typeof v === "object" && typeof v._seconds === "number") return { __ts: v._seconds };
  return v;
}

const ROOTS = [
  "programmingLanguages", "csCoreSubjects", "seModules", "aptitude_topics",
  "concepts", "dsaConceptTracks", "dsaSheets", "roadmaps", "learningTracks",
  "courses", "modules", "lessons", "subjects", "topics",
  "problems", "companies", "questionBank", "questions", "sampleTests",
  "interviewExperiences", "mockInterviews",
  "gatePapers", "gate_pyqs", "gate_notes", "gate_formulas", "gate_resources",
  "gate_tests", "gate_daily", "gate_roadmap_days", "gate_announcements",
  "dailyLearning", "prepCourses", "prepQuestions", "prepExamPapers", "prepExams",
  "prepDailyTasks", "prepAnnouncements",
  "institutions", "classrooms", "contests", "announcements", "opportunities",
  "achievements", "missions", "changelog",
];

// Child collections that hold authored content. Anything a sample turns up
// that is NOT in here (submissions, attempts, students, roster...) is skipped:
// those are user data, and the allow-list above exists precisely to stay out
// of them.
const CONTENT_SUBS = new Set([
  "topics", "subjects", "modules", "lessons", "rounds", "categories",
  "questions", "dailyLearning", "items", "sections", "tasks", "rounds",
]);

let docsScanned = 0, docsChanged = 0, dashesFound = 0;
const perCollection = {};
const backup = [];
let batch = db.batch(), batchCount = 0, writesCommitted = 0;
const BACKUP_FILE = APPLY
  ? path.join(__dirname, `dash-normalize-backup-${new Date().toISOString().replace(/[:.]/g, "-")}.json`)
  : null;

// The backup is flushed to disk BEFORE the batch commits, so the on-disk
// record is always a superset of what was actually written - never the
// other way round.
async function flush() {
  if (batchCount === 0) return;
  if (BACKUP_FILE) writeFileSync(BACKUP_FILE, JSON.stringify(backup, null, 2));
  const n = batchCount;
  await retry(`commit ${n} writes`, () => batch.commit());
  writesCommitted += n;
  batch = db.batch(); batchCount = 0;
  console.log(`    committed ${writesCommitted} docs so far`);
}

async function discoverSubs(snapDocs) {
  const names = new Set();
  for (const doc of snapDocs.slice(0, SAMPLE_N)) {
    const subs = await retry(`listCollections ${doc.ref.path}`, () => doc.ref.listCollections());
    for (const s of subs) if (CONTENT_SUBS.has(s.id)) names.add(s.id);
  }
  return [...names];
}

async function walk(colRef, label) {
  let snap;
  try { snap = await retry(`read ${label}`, () => colRef.get()); }
  catch (e) { console.log(`  ! ${label}: ${e.code || e.message}`); return; }
  if (snap.empty) return;

  const subNames = await discoverSubs(snap.docs);

  for (const doc of snap.docs) {
    docsScanned++;
    const data = doc.data();

    if (hasDash(data)) {
      const n = countDashes(data);
      dashesFound += n; docsChanged++;
      perCollection[label] = perCollection[label] || { docs: 0, dashes: 0 };
      perCollection[label].docs++; perCollection[label].dashes += n;

      if (APPLY) {
        const fixed = {};
        for (const [k, v] of Object.entries(data)) if (hasDash(v)) fixed[k] = normalizeValue(v);
        backup.push({ path: doc.ref.path, before: JSON.parse(JSON.stringify(data, tsReplacer)) });
        batch.update(doc.ref, fixed);
        if (++batchCount >= BATCH_LIMIT) await flush();
      }
    }

    for (const name of subNames) {
      await walk(doc.ref.collection(name), `${label}/*/${name}`);
    }
  }
}

async function main() {
  console.log(APPLY ? "MODE: APPLY (writing)" : "MODE: DRY RUN (no writes - pass --apply to write)");
  for (const root of ROOTS) {
    const before = dashesFound;
    await walk(db.collection(root), root);
    const delta = dashesFound - before;
    if (delta) console.log(`  ${root.padEnd(22)} ${String(delta).padStart(6)} dashes`);
  }
  await flush();

  console.log("\n--- by collection ---");
  const rows = Object.entries(perCollection).sort((a, b) => b[1].dashes - a[1].dashes);
  if (!rows.length) console.log("  (none)");
  for (const [k, v] of rows) {
    console.log("  " + k.padEnd(34) + String(v.dashes).padStart(6) + " dashes in " + String(v.docs).padStart(5) + " docs");
  }
  console.log("\nscanned " + docsScanned + " docs | " + docsChanged + " need changes | " + dashesFound + " dashes");
  if (APPLY) console.log("committed " + writesCommitted + " document updates");

  if (APPLY && backup.length) {
    writeFileSync(BACKUP_FILE, JSON.stringify(backup, null, 2));
    console.log("backup: " + path.basename(BACKUP_FILE) + " (" + backup.length + " docs)");
  }
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
