import admin from "firebase-admin";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(join(__dirname, "service-account.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const arenaDoc = await db.doc("system/arena").get();
console.log("system/arena challenges:", arenaDoc.exists ? (arenaDoc.data().challenges || []).length : "doc missing");

const dailyGrindSnap = await db.collection("dailyGrind").limit(5).get();
console.log("dailyGrind docs:", dailyGrindSnap.size);

const missionsSnap = await db.collection("missions").get();
console.log("missions docs:", missionsSnap.size);

const hackathonsSnap = await db.collection("hackathons").get();
console.log("hackathons docs:", hackathonsSnap.size);

const problemsSnap = await db.collection("problems").get();
console.log("codelab problems docs:", problemsSnap.size);

const contestsSnap = await db.collection("contests").get();
console.log("contests docs:", contestsSnap.size);

const aptSnap = await db.collection("aptitude_topics").get();
console.log("aptitude_topics docs:", aptSnap.size);

process.exit(0);
