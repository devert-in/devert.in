import admin from "firebase-admin";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(join(__dirname, "service-account.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const snap = await db.collection("contests").where("title", "==", "DeVert Aptitude & Reasoning Challenge #1").get();
if (snap.empty) {
  console.log("Sample contest not found.");
  process.exit(1);
}

const now = Date.now();
const registrationStart = new Date(now);
const registrationEnd   = new Date(now + 8 * 60 * 1000);   // +8 min
const contestStart      = new Date(now + 9 * 60 * 1000);   // +9 min
const contestEnd        = new Date(now + 69 * 60 * 1000);  // +69 min (60 min contest)

const doc = snap.docs[0];
await doc.ref.update({ registrationStart, registrationEnd, contestStart, contestEnd });

console.log(`Rescheduled "${doc.data().title}" (${doc.id}):`);
console.log(`Registration: ${registrationStart.toLocaleString()} - ${registrationEnd.toLocaleString()}`);
console.log(`Contest: ${contestStart.toLocaleString()} - ${contestEnd.toLocaleString()}`);
