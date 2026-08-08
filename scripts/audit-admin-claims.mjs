// Lists every Auth account carrying the `admin` custom claim.
//
// The content lockdown (components/content-guard.jsx) exempts admins and only
// admins, keying off this exact claim on the ID token. So "copy/paste still
// works on a student account" has one very cheap explanation worth ruling out
// first: that account holds the claim, the guard is working exactly as designed,
// and the account simply is not a student as far as the token is concerned.
//
// Read-only.
import admin from "firebase-admin";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
admin.initializeApp({
  credential: admin.credential.cert(
    JSON.parse(readFileSync(join(__dirname, "service-account.json"), "utf8"))
  ),
});

const LOOKUP = process.argv.slice(2).filter(a => !a.startsWith("--"));

async function main() {
  if (LOOKUP.length) {
    for (const ident of LOOKUP) {
      try {
        const u = ident.includes("@")
          ? await admin.auth().getUserByEmail(ident)
          : await admin.auth().getUser(ident);
        const claims = u.customClaims || {};
        console.log(`${u.email || u.uid}`);
        console.log(`  uid    : ${u.uid}`);
        console.log(`  claims : ${JSON.stringify(claims)}`);
        console.log(`  admin  : ${claims.admin === true ? "YES - content guard is DISABLED for this account" : "no"}`);
      } catch (e) {
        console.log(`${ident} -> lookup failed: ${e.code || e.message}`);
      }
    }
    return;
  }

  let total = 0, admins = 0;
  let pageToken;
  do {
    const res = await admin.auth().listUsers(1000, pageToken);
    for (const u of res.users) {
      total++;
      if ((u.customClaims || {}).admin === true) {
        admins++;
        console.log(`ADMIN  ${u.email || "(no email)"}  uid=${u.uid}`);
      }
    }
    pageToken = res.pageToken;
  } while (pageToken);

  console.log(`\n${admins} account(s) with the admin claim, out of ${total} total.`);
  console.log("Every one of these bypasses the copy/paste lockdown by design.");
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
