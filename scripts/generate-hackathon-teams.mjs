// Provisions hackathon team accounts for the AI Gateway (functions/index.js's
// aiGateway) directly in Firestore's hackathon_teams collection. Each team
// gets a short teamId and a random password; only a scrypt hash + its salt
// is stored - the plaintext password exists nowhere but the CSV this script
// writes for organizers to hand out, never in git (see .gitignore).
//
// Safe to re-run: an existing teamId is left untouched (merge: true only
// sets fields that don't already exist would be wrong here, so instead this
// SKIPS any teamId that already has a document, exactly like
// seed-aptitude-week6.mjs does for dates - re-running never resets a team's
// password or tokensUsed count mid-event).
//
// Usage:
//   node scripts/generate-hackathon-teams.mjs --count=400 --limit=10000 --dry-run
//   node scripts/generate-hackathon-teams.mjs --count=400 --limit=10000

import admin from "firebase-admin";
import crypto from "crypto";
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const countArg = args.find(a => a.startsWith("--count="));
const limitArg = args.find(a => a.startsWith("--limit="));
const prefixArg = args.find(a => a.startsWith("--prefix="));
const COUNT = countArg ? parseInt(countArg.split("=")[1], 10) : 400;
const TOKENS_LIMIT = limitArg ? parseInt(limitArg.split("=")[1], 10) : 10000;
const PREFIX = prefixArg ? prefixArg.split("=")[1] : "team";

const serviceAccount = JSON.parse(readFileSync(path.join(__dirname, "service-account.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// Avoids 0/O/1/I ambiguity - these get read off a printed slip and typed on
// a phone under time pressure.
const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
function randomPassword(length = 8) {
  let out = "";
  for (let i = 0; i < length; i++) out += ALPHABET[crypto.randomInt(ALPHABET.length)];
  return out;
}

function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString("hex");
}

async function run() {
  const rows = [];
  for (let i = 1; i <= COUNT; i++) {
    const teamId = `${PREFIX}${String(i).padStart(3, "0")}`;
    const password = randomPassword();
    const salt = crypto.randomBytes(16).toString("hex");
    rows.push({ teamId, password, salt, passwordHash: hashPassword(password, salt) });
  }

  console.log(`${DRY_RUN ? "DRY RUN" : "APPLYING"} - provisioning ${rows.length} team(s) (${PREFIX}001..${PREFIX}${String(COUNT).padStart(3, "0")}), ${TOKENS_LIMIT} tokens each.\n`);

  let created = 0, skipped = 0;
  const toWrite = [];
  for (const r of rows) {
    const existing = await db.collection("hackathon_teams").doc(r.teamId).get();
    if (existing.exists) {
      console.log(`  SKIP   ${r.teamId} - already provisioned`);
      skipped++;
      continue;
    }
    toWrite.push(r);
  }

  if (!DRY_RUN) {
    for (let i = 0; i < toWrite.length; i += 400) {
      const batch = db.batch();
      toWrite.slice(i, i + 400).forEach(r => {
        batch.set(db.collection("hackathon_teams").doc(r.teamId), {
          teamId: r.teamId,
          salt: r.salt,
          passwordHash: r.passwordHash,
          tokensUsed: 0,
          tokensLimit: TOKENS_LIMIT,
          disabled: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      });
      await batch.commit();
    }
  }
  created = toWrite.length;
  console.log(`\n${DRY_RUN ? "would create" : "created"}: ${created}   skipped (already present): ${skipped}`);

  // The CSV always lists every requested team (not just newly-created ones)
  // so re-running with a bigger --count still yields one complete handout
  // sheet - but a skipped team's real password is unknown to this run, so
  // its password column is left blank rather than printing a value that
  // doesn't match what's actually hashed in Firestore.
  const csvLines = ["teamId,password,tokensLimit"];
  for (const r of rows) {
    const wasSkipped = toWrite.every(w => w.teamId !== r.teamId) && !DRY_RUN;
    csvLines.push(`${r.teamId},${wasSkipped ? "(already provisioned - see original handout sheet)" : r.password},${TOKENS_LIMIT}`);
  }
  const csvPath = path.join(__dirname, DRY_RUN ? "hackathon-team-credentials.dryrun.csv" : "hackathon-team-credentials.csv");
  if (!DRY_RUN) writeFileSync(csvPath, csvLines.join("\n"));
  console.log(`${DRY_RUN ? "Dry run - no CSV written, no Firestore writes." : `Credentials CSV written to ${csvPath} - NOT committed to git, hand it to organizers only.`}`);
}

run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
