// Grants or revokes users/{uid}.fullAccess - the flag that switches OFF
// sequential unlocking for one account:
//   - lib/learning.js's getTaskStatus     (Learn course task chain)
//   - lib/dsaConcepts.js's isConceptUnlocked (DSA Concepts prerequisite chain)
//
// Both of those are pedagogical guardrails, not confidentiality boundaries, so
// this grants no access to anything hidden - it only stops the product from
// insisting a learner finish step N before opening step N+1.
//
// WHY A FLAG AND A SCRIPT, NOT AN EMAIL IN THE CODE
// -------------------------------------------------
// CLAUDE.md is explicit that a hardcoded admin email was deliberately migrated
// away from, and the same reasoning applies here: an email in a source file
// means a redeploy to change who has this, and it silently rots when an address
// changes. The flag lives on the user doc, and firestore.rules puts `fullAccess`
// in the users-update denylist so the OWNER cannot write it - only isAdmin()
// can, which in practice means this script running with the service account.
//
// This is NOT the admin claim. It gives no content-authoring rights, no access
// to hidden test cases, and no coin/economy powers. For those, the separate and
// far more consequential scripts/set-admin-claim.mjs is the right tool.
//
// Usage:
//   node scripts/set-full-access.mjs <email>              (dry run - shows the plan)
//   node scripts/set-full-access.mjs <email> --apply
//   node scripts/set-full-access.mjs <email> --revoke --apply
import admin from "firebase-admin";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(join(__dirname, "service-account.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

const db = admin.firestore();
const args = process.argv.slice(2);
const email = args.find(a => !a.startsWith("--"));
const apply = args.includes("--apply");
const revoke = args.includes("--revoke");

if (!email) {
  console.error("Usage: node scripts/set-full-access.mjs <email> [--revoke] [--apply]");
  process.exit(1);
}

const user = await admin.auth().getUserByEmail(email).catch(() => null);
if (!user) {
  console.error(`No Firebase Auth user for ${email}. Nothing to do.`);
  process.exit(1);
}

const ref = db.doc(`users/${user.uid}`);
const snap = await ref.get();
if (!snap.exists) {
  // Deliberately refuse rather than creating the doc: users/{uid} is created by
  // AuthContext on first sign-in with a full profile shape, and a doc conjured
  // here would be missing every field the rest of the app reads.
  console.error(`users/${user.uid} does not exist yet - have ${email} sign in once first.`);
  process.exit(1);
}

const current = snap.get("fullAccess") === true;
const target = !revoke;

console.log(`${email}`);
console.log(`  uid          : ${user.uid}`);
console.log(`  displayName  : ${snap.get("displayName") || "(none)"}`);
console.log(`  fullAccess   : ${current} -> ${target}`);

if (current === target) {
  console.log("\nAlready in the requested state. No write needed.");
  process.exit(0);
}

if (!apply) {
  console.log("\nDry run. Re-run with --apply to write.");
  process.exit(0);
}

await ref.set({ fullAccess: target, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
console.log(`\nApplied. fullAccess = ${target} for ${email}.`);
console.log("The client picks this up from its live profile listener - no sign-out needed,");
console.log("unlike the admin claim, which requires a token refresh.");
process.exit(0);
