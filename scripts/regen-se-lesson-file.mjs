// Regenerates a scripts/se-lessons/<module>.mjs authoring file FROM Firestore.
//
// Usage:
//   node scripts/regen-se-lesson-file.mjs welcome > scripts/se-lessons/welcome.mjs
//
// Why this exists: the authoring files embed lesson prose in JS template
// literals, and lesson prose legitimately contains backticks (the lesson format
// writes inline code as `word`). Every one of those has to be escaped in the
// source, and hand-repairing a file where that went wrong is error-prone -
// whereas Firestore holds the content with no escaping concerns at all.
//
// So when an authoring file is corrupted but its content is already written, the
// database is the authoritative copy and this script rebuilds the file from it.
// The emitter escapes backslashes, backticks and ${ correctly by construction,
// which is the part that is easy to get wrong by hand.

import admin from "firebase-admin";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const moduleId = process.argv[2];
if (!moduleId) {
  console.error("Usage: node scripts/regen-se-lesson-file.mjs <moduleId>");
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(path.join(__dirname, "service-account.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const BT = String.fromCharCode(96);
const BS = String.fromCharCode(92);

// Order matters only for readability of the generated file; it mirrors the order
// the reader renders sections in (LESSON_SECTIONS in lib/softwareEngineering.js).
const FIELD_ORDER = [
  "subtitle", "difficulty", "estimatedMinutes", "xpReward", "coinReward",
  "learningObjectives", "prerequisites",
  "story", "problemStatement", "concept", "walkthrough",
  "codeExample",
  "commonMistakes", "industryPerspective", "devertCaseStudy",
  "knowledgeChecks", "lab", "assignment",
  "summary", "goingDeeper", "resources", "tags",
];

// Fields that are curriculum-owned or bookkeeping - never part of an authoring file.
const SKIP = new Set(["title", "order", "status", "updatedAt", "previousVersions", "video", "seededAt"]);

const MULTILINE = new Set([
  "story", "problemStatement", "concept", "walkthrough",
  "industryPerspective", "devertCaseStudy", "goingDeeper",
]);

function tpl(s) {
  // Escape in this order: backslash first (so later escapes are not re-escaped),
  // then backtick, then the ${ interpolation opener.
  const escaped = String(s)
    .split(BS).join(BS + BS)
    .split(BT).join(BS + BT)
    .split("${").join(BS + "${");
  return BT + escaped + BT;
}

function lit(v, indent) {
  const pad = " ".repeat(indent);
  if (v === null || v === undefined) return "null";
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (typeof v === "string") return JSON.stringify(v);
  if (Array.isArray(v)) {
    if (v.length === 0) return "[]";
    const items = v.map(x => pad + "  " + lit(x, indent + 2));
    return "[\n" + items.join(",\n") + ",\n" + pad + "]";
  }
  // plain object
  const keys = Object.keys(v).filter(k => v[k] !== undefined);
  if (keys.length === 0) return "{}";
  const parts = keys.map(k => `${pad}  ${JSON.stringify(k)}: ${lit(v[k], indent + 2)}`);
  return "{\n" + parts.join(",\n") + ",\n" + pad + "}";
}

const snap = await db.collection("seModules").doc(moduleId).collection("lessons").orderBy("order").get();
if (snap.empty) { console.error(`No lessons under seModules/${moduleId}`); process.exit(1); }

const exportName = moduleId.toUpperCase().replace(/-/g, "_");

const out = [];
out.push(`// Module: ${moduleId} - regenerated from Firestore by`);
out.push(`// scripts/regen-se-lesson-file.mjs. Firestore is the authoritative copy of`);
out.push(`// authored content; this file is the reviewable source for the next edit.`);
out.push(`//`);
out.push(`// Prose fields are template literals, so any inline-code backtick in the text`);
out.push(`// appears here escaped as ${BS}${BT}. That escaping is generated, not hand-written -`);
out.push(`// see the header of the regen script for why.`);
out.push("");
out.push(`export const ${exportName} = {`);
out.push("");

for (const d of snap.docs) {
  const data = d.data();
  out.push(`  ${JSON.stringify(d.id)}: {`);
  for (const key of FIELD_ORDER) {
    if (SKIP.has(key)) continue;
    const v = data[key];
    if (v === undefined || v === null) continue;
    if (typeof v === "string" && !v.trim()) continue;
    if (Array.isArray(v) && v.length === 0) continue;

    if (typeof v === "string" && (MULTILINE.has(key) || v.includes("\n"))) {
      out.push(`    ${key}: ${tpl(v)},`);
    } else if (typeof v === "string") {
      out.push(`    ${key}: ${JSON.stringify(v)},`);
    } else if (typeof v === "number" || typeof v === "boolean") {
      out.push(`    ${key}: ${v},`);
    } else if (key === "lab" || key === "codeExample") {
      // These carry multi-line prose inside an object, so their string members
      // need the template-literal treatment too.
      const inner = Object.entries(v)
        .filter(([, x]) => x !== undefined && x !== null && !(typeof x === "string" && !x.trim()))
        .map(([k, x]) => {
          if (typeof x === "string" && x.includes("\n")) return `      ${k}: ${tpl(x)},`;
          return `      ${k}: ${lit(x, 6)},`;
        });
      out.push(`    ${key}: {\n${inner.join("\n")}\n    },`);
    } else {
      out.push(`    ${key}: ${lit(v, 4)},`);
    }
  }
  out.push("  },");
  out.push("");
}

out.push("};");
console.log(out.join("\n"));
process.exit(0);
