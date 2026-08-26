// Writes authored GATE lesson content from scripts/gate-lessons/ into
// Firestore's three-level catalog (gatePapers/{paperId}/subjects/{subjectId}/
// topics/{topicId}).
//
// Usage:
//   node scripts/write-gate-lessons.mjs --dry-run                     everything authored
//   node scripts/write-gate-lessons.mjs --dry-run --subject=general-aptitude
//   node scripts/write-gate-lessons.mjs --subject=general-aptitude
//   node scripts/write-gate-lessons.mjs --paper=cs                    one paper only
//   node scripts/write-gate-lessons.mjs
//
// FAN-OUT. Lessons are authored once per (subjectId, topicId) and written to
// EVERY published paper whose tree contains that exact path - general-aptitude
// lands in cs, da and cs-da; algorithms lands in cs and cs-da. That is a
// deliberate consequence of lib/gateSyllabus.js giving the same subject the same
// ids in every paper it appears in. The alternative (authoring per paper) means
// three copies of one lesson, drifting apart from the first edit onward.
//
// SAFETY. Never creates a topic: a (subject, topic) pair with no live document in
// a paper is reported as SKIPPED, so a typo'd id surfaces instead of quietly
// seeding an orphan outside the official syllabus tree. A real write dumps every
// field it is about to overwrite to scripts/gate-lesson-backup-<timestamp>.json,
// and appends the prior document state to `previousVersions` exactly as
// lib/gate.js's saveTopic does - so a bad batch is recoverable from either the
// file or the document itself.

import admin from "firebase-admin";
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";
import { GATE_LESSONS } from "./gate-lessons/index.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const subjectArg = args.find(a => a.startsWith("--subject="));
const paperArg = args.find(a => a.startsWith("--paper="));
const ONLY_SUBJECT = subjectArg ? subjectArg.split("=")[1] : null;
const ONLY_PAPER = paperArg ? paperArg.split("=")[1] : null;

const serviceAccount = JSON.parse(readFileSync(path.join(__dirname, "service-account.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const MAX_VERSIONS = 5;

// Mirrors withVersionSnapshot() in devert-frontend/lib/contentVersioning.js -
// duplicated rather than imported because that file lives under the Next app
// (CommonJS-resolved from here) and this script must stay runnable with plain
// `node`. Keep the two in step if either changes.
function withVersionSnapshot(existing) {
  if (!existing) return { previousVersions: [] };
  const { previousVersions: _drop, updatedAt: _drop2, ...snapshot } = existing;
  const prior = existing.previousVersions || [];
  return {
    previousVersions: [...prior, { ...snapshot, savedAt: new Date().toISOString() }].slice(-MAX_VERSIONS),
  };
}

// Only the lesson-content fields. Deliberately excludes title / module / order /
// status / difficulty / estimatedMinutes: those come from the official syllabus
// via lib/gateSyllabus.js's seedPaper and are re-seedable, so authoring must not
// fight them. A lesson file CAN override difficulty/estimatedMinutes/rewards
// (they are editorial judgements about the lesson, not syllabus facts), which is
// why those three are listed here.
// Keep this list in step with FIELD_SPEC in devert-frontend/lib/gateLessonImport.js -
// they are the two write paths into the same document, and a field present in one
// but absent from the other is silently dropped rather than rejected. That is
// exactly how `keyPoints` was lost on the first authoring run: authored in the
// lesson file, accepted by the importer, and missing from here.
const CONTENT_FIELDS = [
  "concept", "deepDive", "dryRun",
  "whatYoullLearn", "prerequisites",
  "codeExample", "workedExamples",
  "keyPoints", "analogies", "commonMistakes", "memoryTricks", "formulas", "shortcuts",
  "pyqRelevance", "interviewConnection", "revisionSummary", "shortNotes",
  "mcqs", "numericals", "assignment", "resources",
  "difficulty", "estimatedMinutes", "xpReward", "coinReward",
];

function payloadOf(lesson) {
  const out = {};
  for (const f of CONTENT_FIELDS) if (lesson[f] !== undefined) out[f] = lesson[f];
  return out;
}

// Drift guard between this script and the browser-side importer. Both write the
// same topic document, and a field one accepts while the other omits is dropped
// SILENTLY - no error, no warning, the content just never appears. That is how
// keyPoints was lost, so the agreement is now checked at startup rather than
// trusted. Parsed out of the lib file by regex because that file lives under the
// Next app and cannot be imported from a plain `node` script (see
// withVersionSnapshot above for the same constraint).
function checkFieldDrift() {
  const specPath = path.join(__dirname, "..", "devert-frontend", "lib", "gateLessonImport.js");
  let src;
  try { src = readFileSync(specPath, "utf8"); } catch { return; } // lib moved - not this script's job to fail
  const block = src.match(/const FIELD_SPEC = \{([\s\S]*?)\n\};/);
  if (!block) return;
  const importerFields = new Set([...block[1].matchAll(/^\s{2}([a-zA-Z]+):\s*\{/gm)].map(m => m[1]));
  if (importerFields.size === 0) return;

  // Fields the importer rejects but this script would happily write.
  const unknownToImporter = CONTENT_FIELDS.filter(f => !importerFields.has(f));
  // Content fields the importer accepts but this script ignores. Identity and
  // syllabus-owned fields are expected to differ, so they are excluded.
  const OWNED_ELSEWHERE = new Set(["subjectId", "topicId", "title", "module", "order", "status"]);
  const ignoredHere = [...importerFields].filter(f => !OWNED_ELSEWHERE.has(f) && !CONTENT_FIELDS.includes(f));

  if (unknownToImporter.length) {
    console.error(`FIELD DRIFT: this script writes ${unknownToImporter.join(", ")}, which lib/gateLessonImport.js would reject. Reconcile the two lists.`);
    process.exit(1);
  }
  if (ignoredHere.length) {
    console.log(`NOTE: lib/gateLessonImport.js accepts ${ignoredHere.join(", ")} but this script ignores ${ignoredHere.length === 1 ? "it" : "them"} - authored values would be silently dropped.\n`);
  }
}

function words(text) {
  return (text || "").trim().split(/\s+/).filter(Boolean).length;
}

// A rough structural summary for the report - what stages this lesson lights up
// in the topic view's journey strip, so the dry run shows what a student will
// actually get rather than just a word count.
function describe(lesson) {
  const stages = [
    lesson.whatYoullLearn?.length && "intro",
    lesson.concept?.trim() && "theory",
    (lesson.codeExample?.code?.trim() || lesson.workedExamples?.length) && "ex",
    lesson.dryRun?.trim() && "dry",
    lesson.mcqs?.length && "mcq",
    lesson.numericals?.length && "nat",
    (lesson.revisionSummary?.trim() || lesson.shortNotes?.oneMinute?.trim()) && "rev",
    lesson.resources?.length && "vid",
  ].filter(Boolean);
  const total = words(lesson.concept) + words(lesson.deepDive) + words(lesson.dryRun)
    + (lesson.workedExamples || []).reduce((n, e) => n + words(e.problem) + words(e.solution), 0);
  const unclosed = [lesson.concept, lesson.deepDive, lesson.dryRun,
    ...(lesson.workedExamples || []).flatMap(e => [e.problem, e.solution]),
    ...(lesson.numericals || []).map(n => n.solution)]
    .filter(Boolean)
    .reduce((n, text) => {
      const lines = text.split("\n");
      const opens = lines.filter(l => /^:::[ \t]*[a-zA-Z]/.test(l)).length;
      const closes = lines.filter(l => /^:::[ \t]*$/.test(l)).length;
      return n + Math.max(0, opens - closes);
    }, 0);
  return { stages: stages.join("/"), words: total, unclosed };
}

async function run() {
  checkFieldDrift();

  const subjectIds = Object.keys(GATE_LESSONS).filter(id => !ONLY_SUBJECT || id === ONLY_SUBJECT);

  if (subjectIds.length === 0) {
    console.error(ONLY_SUBJECT
      ? `No authored lessons for subject "${ONLY_SUBJECT}". Authored: ${Object.keys(GATE_LESSONS).join(", ") || "(none)"}`
      : "No authored lessons found in scripts/gate-lessons/.");
    process.exit(1);
  }

  console.log(DRY_RUN ? "DRY RUN - nothing will be written.\n" : "APPLYING - Firestore will be written.\n");

  // Which papers exist, and which of them carry each authored subject. Read once
  // up front so the fan-out is reported before anything is written.
  const papersSnap = await db.collection("gatePapers").get();
  const papers = papersSnap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(p => !ONLY_PAPER || p.id === ONLY_PAPER)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  if (papers.length === 0) {
    console.error(ONLY_PAPER ? `No paper "${ONLY_PAPER}" in gatePapers.` : "No papers in gatePapers - seed the syllabus first.");
    process.exit(1);
  }

  const unpublished = papers.filter(p => p.status !== "published");
  if (unpublished.length) {
    console.log(`NOTE: ${unpublished.map(p => p.id).join(", ")} ${unpublished.length === 1 ? "is" : "are"} not published - content written there stays invisible to students until it is.\n`);
  }

  const backup = {};
  const skipped = [];
  const pending = [];
  let unclosedTotal = 0;

  for (const subjectId of subjectIds) {
    const topics = GATE_LESSONS[subjectId];

    // Which papers actually have this subject, and their live topic docs.
    const live = new Map();
    for (const paper of papers) {
      const snap = await db.collection("gatePapers").doc(paper.id)
        .collection("subjects").doc(subjectId).collection("topics").get();
      if (!snap.empty) live.set(paper.id, new Map(snap.docs.map(d => [d.id, d.data()])));
    }

    if (live.size === 0) {
      skipped.push(`${subjectId}: not present in any ${ONLY_PAPER ? `paper "${ONLY_PAPER}"` : "paper"}`);
      continue;
    }

    console.log(`=== ${subjectId} (${Object.keys(topics).length} authored) -> papers: ${[...live.keys()].join(", ")} ===`);

    for (const [topicId, lesson] of Object.entries(topics)) {
      const d = describe(lesson);
      unclosedTotal += d.unclosed > 0 ? 1 : 0;

      const landsIn = [];
      for (const [paperId, topicMap] of live) {
        const existing = topicMap.get(topicId);
        if (!existing) {
          skipped.push(`${subjectId}/${topicId}: no such topic under paper "${paperId}"`);
          continue;
        }
        landsIn.push(paperId);
        backup[`${paperId}/${subjectId}/${topicId}`] = Object.fromEntries(
          CONTENT_FIELDS.filter(f => existing[f] !== undefined).map(f => [f, existing[f]])
        );
        pending.push({ paperId, subjectId, topicId, existing, payload: payloadOf(lesson) });
      }

      console.log(
        `  ${topicId.padEnd(46)} ${String(d.words).padStart(4)}w  [${d.stages}]  -> ${landsIn.length} paper(s)` +
        (d.unclosed > 0 ? `  !! ${d.unclosed} UNCLOSED FENCE` : "")
      );
    }
    console.log("");
  }

  if (skipped.length > 0) {
    console.log("SKIPPED:");
    skipped.forEach(s => console.log("  " + s));
    console.log("");
  }

  if (unclosedTotal > 0) {
    // An unterminated fence still renders (the parser never drops content), but
    // it swallows everything after it into one block - always an authoring bug,
    // never intent, so refuse to write it.
    console.error(`REFUSING TO WRITE: ${unclosedTotal} lesson(s) have an unclosed ::: fence. Fix those first.`);
    process.exit(1);
  }

  const distinct = new Set(pending.map(p => `${p.subjectId}/${p.topicId}`)).size;
  console.log(`${distinct} distinct lesson(s) -> ${pending.length} document write(s) across ${papers.length} paper(s).`);

  if (DRY_RUN) {
    console.log("Dry run complete - no writes performed.");
    return;
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = path.join(__dirname, `gate-lesson-backup-${stamp}.json`);
  writeFileSync(backupPath, JSON.stringify(backup, null, 2), "utf8");
  console.log(`Previous field values saved to ${path.basename(backupPath)}`);

  let written = 0;
  for (const { paperId, subjectId, topicId, existing, payload } of pending) {
    await db.collection("gatePapers").doc(paperId)
      .collection("subjects").doc(subjectId).collection("topics").doc(topicId).set({
        ...payload,
        ...withVersionSnapshot(existing),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
    written++;
  }

  console.log(`Wrote ${written} document(s).`);
}

run().catch(e => { console.error(e); process.exit(1); });
