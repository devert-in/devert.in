// Writes authored Software Engineering Fundamentals lesson content from
// scripts/se-lessons/ into Firestore (seModules/{moduleId}/lessons/{lessonId}).
//
// Usage:
//   node scripts/write-se-lessons.mjs --dry-run
//   node scripts/write-se-lessons.mjs --dry-run --module=welcome
//   node scripts/write-se-lessons.mjs --module=welcome
//   node scripts/write-se-lessons.mjs
//
// SAFETY, carried over from scripts/write-gate-lessons.mjs:
//   - Never creates a lesson. A lessonId with no live document is reported as
//     SKIPPED, so a typo surfaces instead of quietly seeding a lesson outside the
//     curriculum.
//   - A real write dumps every field it is about to overwrite to
//     scripts/se-lesson-backup-<timestamp>.json, and appends the prior document
//     state to `previousVersions` exactly as lib/softwareEngineering.js's
//     saveLesson does - so a bad batch is recoverable from either.
//   - Refuses to write a lesson with an unclosed ::: fence. An unterminated fence
//     still renders (the parser never drops content) but swallows everything
//     after it into one block - always an authoring bug, never intent.
//   - Checks its own field list against LESSON_SECTIONS at startup. This is the
//     lesson learned from the GATE module, where `keyPoints` was authored,
//     accepted by one writer and silently dropped by another because two lists
//     disagreed.

import admin from "firebase-admin";
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";
import { SE_LESSONS } from "./se-lessons/index.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const moduleArg = args.find(a => a.startsWith("--module="));
const ONLY_MODULE = moduleArg ? moduleArg.split("=")[1] : null;

const serviceAccount = JSON.parse(readFileSync(path.join(__dirname, "service-account.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const MAX_VERSIONS = 5;

// Mirrors withVersionSnapshot() in devert-frontend/lib/contentVersioning.js -
// duplicated rather than imported because that file lives under the Next app and
// this script must stay runnable with plain `node`. Keep the two in step.
function withVersionSnapshot(existing) {
  if (!existing) return { previousVersions: [] };
  const { previousVersions: _drop, updatedAt: _drop2, ...snapshot } = existing;
  const prior = existing.previousVersions || [];
  return {
    previousVersions: [...prior, { ...snapshot, savedAt: new Date().toISOString() }].slice(-MAX_VERSIONS),
  };
}

// Lesson-content fields only. Deliberately excludes title / order / status:
// those come from the curriculum via lib/seCurriculum.js's seedCurriculum and are
// re-seedable, so authoring must not fight them. difficulty, estimatedMinutes and
// the rewards ARE listed - they are editorial judgements about the lesson rather
// than curriculum facts. `video` is listed so a lesson can ship with chapters
// pre-authored even while the slot stays masked.
const CONTENT_FIELDS = [
  "subtitle",
  "learningObjectives", "prerequisites",
  "story", "problemStatement", "concept", "walkthrough",
  "codeExample",
  "commonMistakes", "industryPerspective", "devertCaseStudy",
  "knowledgeChecks", "lab", "assignment",
  "summary", "goingDeeper", "resources",
  "video", "tags",
  "difficulty", "estimatedMinutes", "xpReward", "coinReward",
];

// Drift guard. LESSON_SECTIONS in lib/softwareEngineering.js is the contract
// between the CMS, the reader and this writer; a section the reader draws but
// this script omits is content silently thrown away. Parsed by regex because
// that file cannot be imported from plain node (Next "@/" alias + client SDK).
function checkFieldDrift() {
  const libPath = path.join(__dirname, "..", "devert-frontend", "lib", "softwareEngineering.js");
  let src;
  try { src = readFileSync(libPath, "utf8"); } catch { return; }
  const block = src.match(/export const LESSON_SECTIONS = \[([\s\S]*?)\n\];/);
  if (!block) return;
  const readerKeys = [...block[1].matchAll(/key:\s*"([a-zA-Z]+)"/g)].map(m => m[1]);
  if (readerKeys.length === 0) return;
  const missing = readerKeys.filter(k => !CONTENT_FIELDS.includes(k));
  if (missing.length) {
    console.error(`FIELD DRIFT: the reader renders ${missing.join(", ")} but this script does not write ${missing.length === 1 ? "it" : "them"}. Authored values would be silently dropped.`);
    process.exit(1);
  }
}

function payloadOf(lesson) {
  const out = {};
  for (const f of CONTENT_FIELDS) if (lesson[f] !== undefined) out[f] = lesson[f];
  return out;
}

function words(text) {
  return (text || "").trim().split(/\s+/).filter(Boolean).length;
}

// Which of the reader's sections this lesson lights up, plus a word count and a
// fence-balance check - so the dry run shows what a learner will actually get
// rather than just "1 document".
function describe(lesson) {
  const stages = [
    lesson.learningObjectives?.length && "obj",
    lesson.story?.trim() && "story",
    lesson.problemStatement?.trim() && "prob",
    lesson.concept?.trim() && "body",
    lesson.walkthrough?.trim() && "walk",
    lesson.codeExample?.code?.trim() && "demo",
    lesson.commonMistakes?.length && "mist",
    lesson.industryPerspective?.trim() && "ind",
    lesson.devertCaseStudy?.trim() && "devert",
    lesson.knowledgeChecks?.length && "check",
    (lesson.lab?.title?.trim() || lesson.lab?.brief?.trim()) && "lab",
    lesson.assignment && Object.values(lesson.assignment).some(v => String(v || "").trim()) && "assign",
    lesson.summary?.trim() && "sum",
    lesson.goingDeeper?.trim() && "deep",
    lesson.resources?.length && "res",
  ].filter(Boolean);

  const proseFields = [lesson.story, lesson.problemStatement, lesson.concept, lesson.walkthrough,
    lesson.industryPerspective, lesson.devertCaseStudy, lesson.goingDeeper, lesson.summary,
    lesson.lab?.brief];
  const total = proseFields.reduce((n, t) => n + words(t), 0);

  // `summary` renders as PLAIN text (no block parser), so a ::: fence there shows
  // literally. Checked separately from the balance test.
  const plainWithFence = (lesson.summary || "").includes(":::");

  const unclosed = proseFields.filter(Boolean).reduce((n, text) => {
    const lines = text.split("\n");
    const opens = lines.filter(l => /^:::[ \t]*[a-zA-Z]/.test(l)).length;
    const closes = lines.filter(l => /^:::[ \t]*$/.test(l)).length;
    return n + Math.max(0, opens - closes);
  }, 0);

  return { stages: stages.join("/"), words: total, unclosed, plainWithFence };
}

async function run() {
  checkFieldDrift();

  const moduleIds = Object.keys(SE_LESSONS).filter(id => !ONLY_MODULE || id === ONLY_MODULE);
  if (moduleIds.length === 0) {
    console.error(ONLY_MODULE
      ? `No authored lessons for module "${ONLY_MODULE}". Authored: ${Object.keys(SE_LESSONS).join(", ") || "(none)"}`
      : "No authored lessons found in scripts/se-lessons/.");
    process.exit(1);
  }

  console.log(DRY_RUN ? "DRY RUN - nothing will be written.\n" : "APPLYING - Firestore will be written.\n");

  const backup = {};
  const skipped = [];
  const pending = [];
  let problems = 0;

  for (const moduleId of moduleIds) {
    const lessons = SE_LESSONS[moduleId];

    const modSnap = await db.collection("seModules").doc(moduleId).get();
    if (!modSnap.exists) {
      skipped.push(`${moduleId}: no such module - seed the curriculum first`);
      continue;
    }
    const liveSnap = await db.collection("seModules").doc(moduleId).collection("lessons").get();
    const live = new Map(liveSnap.docs.map(d => [d.id, d.data()]));

    console.log(`=== ${moduleId} (module ${modSnap.data().number}) - ${Object.keys(lessons).length} authored, ${live.size} live ===`);

    for (const [lessonId, lesson] of Object.entries(lessons)) {
      const d = describe(lesson);
      if (d.unclosed > 0 || d.plainWithFence) problems++;

      const existing = live.get(lessonId);
      if (!existing) {
        skipped.push(`${moduleId}/${lessonId}: no such lesson in the curriculum`);
        continue;
      }

      backup[`${moduleId}/${lessonId}`] = Object.fromEntries(
        CONTENT_FIELDS.filter(f => existing[f] !== undefined).map(f => [f, existing[f]])
      );
      pending.push({ moduleId, lessonId, existing, payload: payloadOf(lesson) });

      console.log(
        `  ${lessonId.padEnd(44)} ${String(d.words).padStart(4)}w  [${d.stages}]`
        + (d.unclosed > 0 ? `  !! ${d.unclosed} UNCLOSED FENCE` : "")
        + (d.plainWithFence ? "  !! ::: IN summary (renders literally)" : "")
      );
    }
    console.log("");
  }

  if (skipped.length) {
    console.log("SKIPPED:");
    skipped.forEach(s => console.log("  " + s));
    console.log("");
  }

  if (problems > 0) {
    console.error(`REFUSING TO WRITE: ${problems} lesson(s) have an authoring problem above. Fix those first.`);
    process.exit(1);
  }

  console.log(`${pending.length} lesson(s) to write.`);
  if (DRY_RUN) { console.log("Dry run complete - no writes performed."); return; }

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = path.join(__dirname, `se-lesson-backup-${stamp}.json`);
  writeFileSync(backupPath, JSON.stringify(backup, null, 2), "utf8");
  console.log(`Previous field values saved to ${path.basename(backupPath)}`);

  let written = 0;
  for (const { moduleId, lessonId, existing, payload } of pending) {
    await db.collection("seModules").doc(moduleId).collection("lessons").doc(lessonId).set({
      ...payload,
      ...withVersionSnapshot(existing),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    written++;
  }
  console.log(`Wrote ${written} lesson(s).`);
}

run().catch(e => { console.error(e); process.exit(1); });
