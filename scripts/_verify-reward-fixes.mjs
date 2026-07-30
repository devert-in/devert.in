import admin from "firebase-admin";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(join(__dirname, "service-account.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const revoked = JSON.parse(readFileSync(join(__dirname, "duplicate-rewards-applied-2026-07-29.json"), "utf8"));
const granted = JSON.parse(readFileSync(join(__dirname, "retroactive-daily-learning-rewards-applied-2026-07-29.json"), "utf8"));

const revokedUids = new Set((revoked.duplicateUsers || revoked.users || []).map(u => u.uid));
console.log("Revoked-from users:", revokedUids.size);

let negativeXp = 0, negativeCoins = 0, checked = 0;
const usersSnap = await db.collection("users").get();
usersSnap.forEach(doc => {
  const d = doc.data();
  checked++;
  if ((d.xp || 0) < 0) { negativeXp++; console.log("NEGATIVE XP:", doc.id, d.xp); }
  if ((d.pulseCoins || 0) < 0) { negativeCoins++; console.log("NEGATIVE COINS:", doc.id, d.pulseCoins); }
});
console.log(`\nChecked ${checked} users. Negative XP: ${negativeXp}. Negative coins: ${negativeCoins}.`);
process.exit(0);
