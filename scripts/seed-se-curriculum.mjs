// Seeds the Software Engineering Fundamentals curriculum via firebase-admin.
//
// The same seeder runs in the browser from /admin (lib/seCurriculum.js's
// seedCurriculum), which is the path a real admin uses. This script exists so a
// deployment can be stood up without clicking, and so the structure can be
// re-applied after a curriculum revision from CI. Both write identical documents.
//
// SAFE TO RE-RUN: every write is merge:true and carries only structural fields
// (title, order, status, accent, hours). Authored lesson bodies are absent from
// the payload, so a merge leaves concept/story/checks/lab/video untouched.
import admin from "firebase-admin";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DRY_RUN = process.argv.includes("--dry-run");

const serviceAccount = JSON.parse(readFileSync(path.join(__dirname, "service-account.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// The module list comes from devert-frontend/lib/se-curriculum-data.mjs - a
// dependency-free data module shared with the browser-side seeder, so the two
// cannot drift. That file deliberately imports nothing, which is what makes it
// resolvable from a plain `node` script with no Next alias handling.
const { SE_MODULES } = await import("../devert-frontend/lib/se-curriculum-data.mjs");

function slug(t) { return t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }

const ops = [];
SE_MODULES.forEach((m, mi) => {
  ops.push({
    ref: db.collection("seModules").doc(m.id),
    data: {
      number: m.number, title: m.title, subtitle: m.subtitle, question: m.question,
      description: m.description, accent: m.accent, estimatedHours: m.estimatedHours,
      order: (mi + 1) * 10, status: "published", lessonCount: m.lessons.length,
      curriculumVersion: "v1",
      seededAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
  });
  m.lessons.forEach((title, li) => {
    ops.push({
      ref: db.collection("seModules").doc(m.id).collection("lessons").doc(slug(title)),
      data: {
        title, order: (li + 1) * 10, status: "published",
        difficulty: m.number <= 2 ? "Beginner" : m.number <= 7 ? "Intermediate" : "Advanced",
        estimatedMinutes: 25, xpReward: 20, coinReward: 8,
        video: { status: "coming-soon", provider: "youtube", youtubeId: "", url: "", durationSeconds: null, chapters: [], transcript: "", notesUrl: "" },
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
    });
  });
});

console.log(`${SE_MODULES.length} modules, ${ops.length - SE_MODULES.length} lessons -> ${ops.length} documents`);
SE_MODULES.forEach(m => console.log(`  ${String(m.number).padStart(2)} ${m.title.padEnd(46)} ${m.lessons.length} lessons`));

if (DRY_RUN) { console.log("\nDry run - nothing written."); process.exit(0); }

for (let i = 0; i < ops.length; i += 450) {
  const batch = db.batch();
  ops.slice(i, i + 450).forEach(({ ref, data }) => batch.set(ref, data, { merge: true }));
  await batch.commit();
  console.log(`  committed ${Math.min(i + 450, ops.length)}/${ops.length}`);
}
console.log(`\nWrote ${ops.length} documents.`);
