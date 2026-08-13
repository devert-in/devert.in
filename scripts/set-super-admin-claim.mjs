// Grants (or revokes) the `superAdmin: true` custom auth claim - a strictly
// smaller circle than `admin` (see set-admin-claim.mjs), for surfaces like the
// Payments panel that an ordinary institution or platform admin has no
// business seeing. Same claim-based pattern as admin, deliberately not an
// email check baked into the frontend - see CLAUDE.md on why a hardcoded
// admin email was migrated away from. Usage:
//   node scripts/set-super-admin-claim.mjs someone@example.com          (grant)
//   node scripts/set-super-admin-claim.mjs someone@example.com --revoke (revoke)
import admin from "firebase-admin";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(join(__dirname, "service-account.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

const email = process.argv[2];
const revoke = process.argv.includes("--revoke");

if (!email) {
  console.error("Usage: node scripts/set-super-admin-claim.mjs <email> [--revoke]");
  process.exit(1);
}

const user = await admin.auth().getUserByEmail(email);
await admin.auth().setCustomUserClaims(user.uid, { ...user.customClaims, superAdmin: revoke ? null : true });

const check = await admin.auth().getUser(user.uid);
console.log(`${revoke ? "Revoked" : "Granted"} superAdmin claim for ${email} (uid: ${user.uid}).`);
console.log("Current claims:", check.customClaims);
console.log("Note: the user must sign out and back in (or refresh their ID token) for this to take effect client-side.");
