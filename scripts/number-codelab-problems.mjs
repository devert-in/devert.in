import admin from "firebase-admin";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(join(__dirname, "service-account.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// Assigns a stable, sequential `number` field to every problem (LeetCode-
// style "#1 Two Sum", "#2 Reverse the Array", ...) - ordered by createdAt so
// the numbering matches the order problems were actually authored in
// (pre-existing problems first, then this session's DSA-450 batches in the
// same topic sequence they were seeded: Arrays, Matrix, Strings, ...).

const snap = await db.collection("problems").orderBy("createdAt", "asc").get();
console.log(`Numbering ${snap.size} problems...`);

const batchSize = 400;
let batch = db.batch();
let opsInBatch = 0;
let n = 1;
for (const doc of snap.docs) {
  batch.update(doc.ref, { number: n });
  n++;
  opsInBatch++;
  if (opsInBatch >= batchSize) {
    await batch.commit();
    batch = db.batch();
    opsInBatch = 0;
  }
}
if (opsInBatch > 0) await batch.commit();

console.log(`Numbered #1 through #${n - 1}.`);
