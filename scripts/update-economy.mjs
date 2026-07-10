import admin from "firebase-admin";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(join(__dirname, "service-account.json"), "utf8"));

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

const db = admin.firestore();

const economy = {
  PER_LIKE:      10,
  PER_COMMENT:   25,
  PER_SAVE:      15,
  XP_PER_COIN:   5,
  COINS_PER_INR: 200,
  MIN_PAYOUT:    2000,
  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
};

await db.doc("system/economy").set(economy);
console.log("system/economy updated:", economy);
