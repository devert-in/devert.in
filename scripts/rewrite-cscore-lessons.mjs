// Rewrites CS Core lesson bodies (the `concept` field) from wall-of-text
// prose into the block format the Campus lesson engine renders - story and
// analogy first, sections, cards, diagrams, checkpoints. See
// devert-frontend/lib/lessonBlocks.js for the format itself.
//
// Only `concept` is touched. keyPoints / commonMistakes / interviewTips /
// realWorldApplications / mcqs / assignment / goingDeeper already render as
// their own well-structured cards in the topic view, so rewriting them would
// be churn; the wall of text was always the `concept` field alone.
//
// Usage:
//   node scripts/rewrite-cscore-lessons.mjs --dry-run              every authored subject
//   node scripts/rewrite-cscore-lessons.mjs --dry-run --subject=operating-systems
//   node scripts/rewrite-cscore-lessons.mjs --subject=operating-systems
//   node scripts/rewrite-cscore-lessons.mjs                        apply everything authored
//
// A real write ALWAYS dumps every previous `concept` to
// scripts/cscore-rewrite-backup-<timestamp>.json first, and appends the prior
// document state to `previousVersions` the same way the admin console's own
// saveTopic does (see devert-frontend/lib/contentVersioning.js) - so a bad
// batch is recoverable from either the file or the doc itself.

import admin from "firebase-admin";
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";
import { LESSONS } from "./cscore-lessons/index.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const subjectArg = args.find(a => a.startsWith("--subject="));
const ONLY_SUBJECT = subjectArg ? subjectArg.split("=")[1] : null;

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

// A cheap structural read of a lesson body, so the dry run can report what
// actually changed rather than just "it's different". Intentionally a rough
// count, not a re-implementation of the real parser.
function describe(text) {
  const lines = (text || "").split("\n");
  const words = (text || "").trim().split(/\s+/).filter(Boolean).length;
  const sections = lines.filter(l => /^##[ \t]/.test(l)).length;
  const fences = lines.filter(l => /^:::[ \t]*[a-zA-Z]/.test(l));
  const kinds = {};
  fences.forEach(l => {
    const kind = l.match(/^:::[ \t]*([a-zA-Z][a-zA-Z0-9-]*)/)[1].toLowerCase();
    kinds[kind] = (kinds[kind] || 0) + 1;
  });
  const opens = fences.length;
  const closes = lines.filter(l => /^:::[ \t]*$/.test(l)).length;
  return { words, sections, blocks: opens, kinds, unclosed: opens - closes };
}

function formatKinds(kinds) {
  const entries = Object.entries(kinds).sort((a, b) => b[1] - a[1]);
  return entries.length ? entries.map(([k, n]) => `${k}${n > 1 ? `x${n}` : ""}`).join(" ") : "-";
}

async function run() {
  const subjectIds = Object.keys(LESSONS).filter(id => !ONLY_SUBJECT || id === ONLY_SUBJECT);

  if (subjectIds.length === 0) {
    console.error(ONLY_SUBJECT
      ? `No authored lessons for subject "${ONLY_SUBJECT}". Authored: ${Object.keys(LESSONS).join(", ") || "(none)"}`
      : "No authored lessons found in scripts/cscore-lessons/.");
    process.exit(1);
  }

  console.log(DRY_RUN ? "DRY RUN - nothing will be written.\n" : "APPLYING - Firestore will be written.\n");

  const backup = {};
  const skipped = [];
  const pending = [];
  let unclosedTotal = 0;

  for (const subjectId of subjectIds) {
    const topics = LESSONS[subjectId];
    const snap = await db.collection("csCoreSubjects").doc(subjectId).collection("topics").get();
    const live = new Map(snap.docs.map(d => [d.id, d.data()]));

    console.log(`=== ${subjectId} (${Object.keys(topics).length} authored / ${snap.size} live topics) ===`);

    for (const [topicId, rewrite] of Object.entries(topics)) {
      const existing = live.get(topicId);
      if (!existing) {
        // Never create a topic here - this script only rewrites lessons that
        // already exist, so a typo'd topic id is reported instead of silently
        // seeding a new, orphaned document.
        skipped.push(`${subjectId}/${topicId}: no such topic in Firestore`);
        continue;
      }

      const before = describe(existing.concept);
      const after = describe(rewrite.concept);
      unclosedTotal += after.unclosed > 0 ? 1 : 0;

      console.log(
        `  ${topicId.padEnd(28)} ${String(before.words).padStart(4)}w -> ${String(after.words).padStart(4)}w` +
        ` | ${before.sections}->${after.sections} sections | blocks: ${formatKinds(after.kinds)}` +
        (after.unclosed > 0 ? `  !! ${after.unclosed} UNCLOSED FENCE` : "")
      );

      backup[`${subjectId}/${topicId}`] = existing.concept ?? null;
      pending.push({ subjectId, topicId, existing, concept: rewrite.concept });
    }
    console.log("");
  }

  if (skipped.length > 0) {
    console.log("SKIPPED:");
    skipped.forEach(s => console.log("  " + s));
    console.log("");
  }

  if (unclosedTotal > 0) {
    // An unterminated fence still renders (the parser never drops content),
    // but it swallows everything after it into one block - always an
    // authoring bug, never intent, so refuse to write it.
    console.error(`REFUSING TO WRITE: ${unclosedTotal} lesson(s) have an unclosed ::: fence. Fix those first.`);
    process.exit(1);
  }

  console.log(`${pending.length} lesson(s) ready.`);

  if (DRY_RUN) {
    console.log("Dry run complete - no writes performed.");
    return;
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = path.join(__dirname, `cscore-rewrite-backup-${stamp}.json`);
  writeFileSync(backupPath, JSON.stringify(backup, null, 2), "utf8");
  console.log(`Previous lesson bodies saved to ${path.basename(backupPath)}`);

  let written = 0;
  for (const { subjectId, topicId, existing, concept } of pending) {
    await db.collection("csCoreSubjects").doc(subjectId).collection("topics").doc(topicId).set({
      concept,
      ...withVersionSnapshot(existing),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    written++;
  }

  console.log(`Wrote ${written} lesson(s).`);
}

run().catch(e => { console.error(e); process.exit(1); });
