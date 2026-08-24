/**
 * upload-intel-resources.mjs
 *
 * Uploads the ByteMart Java PDF bundle to Firebase Storage and writes
 * the download URLs into Firestore intel_resources/{moduleId}.
 *
 * SETUP (one-time):
 *   1. npm install  (from repo root - installs firebase-admin)
 *   2. Download a service-account key from:
 *        Firebase Console → Project Settings → Service accounts → Generate new private key
 *      Save it as:  scripts/service-account.json   (already gitignored)
 *   3. npm run upload:resources
 *
 * ALTERNATIVELY use Application Default Credentials:
 *   npx gcloud auth application-default login
 *   then set USE_ADC=true below.
 */

import admin from "firebase-admin";
import { readFileSync, readdirSync, statSync, existsSync } from "fs";
import { join, basename, dirname, extname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Config ───────────────────────────────────────────────────────────────────

const BUCKET        = "devert-me.firebasestorage.app";
const PROJECT_ID    = "devert-me";
const SERVICE_ACCT  = join(__dirname, "service-account.json");
const USE_ADC       = !existsSync(SERVICE_ACCT);  // fallback to ADC if no key file

const BYTEMART_ROOT = join(__dirname, "..", "ByteMart Java");
const BUNDLE1       = join(BYTEMART_ROOT, "Java Ebook Course Bundle");
const BUNDLE2       = join(BYTEMART_ROOT, "Java, Springboot and Microservices - bytemartdigital.in");

// ── Module → source folder mapping ───────────────────────────────────────────

const MODULES = [
  // ── Java Ebook Bundle ──
  { id: "java-handwritten",  folder: join(BUNDLE1, "1. Java Handwritten Notes") },
  { id: "java-digital",      folder: join(BUNDLE1, "2. Java Digital Notes") },
  { id: "java-cheatsheet",   folder: join(BUNDLE1, "3. Java CheatSheet Notes") },
  { id: "java-interview",    folder: join(BUNDLE1, "4. Java Interview Q& A") },
  { id: "java-projects",     folder: join(BUNDLE1, "5. Java Projects") },
  { id: "java-paid-links",   folder: join(BUNDLE1, "6. Java Course  Paid Links") },
  { id: "java-dsa",          folder: join(BUNDLE1, "7. Java With DSA") },
  { id: "company-leetcode",  folder: join(BUNDLE1, "8. Company Wise Leetcode") },
  { id: "ds-leetcode",       folder: join(BUNDLE1, "9. Data Structures Leetcode") },
  { id: "java-backend",      folder: join(BUNDLE1, "Java Backend Topic Guide") },
  // ── Spring Bundle ──
  { id: "core-java",         folder: join(BUNDLE2, "1. Core Java") },
  { id: "advanced-java",     folder: join(BUNDLE2, "2. Advanced Java") },
  { id: "spring",            folder: join(BUNDLE2, "3. Spring") },
  { id: "springboot",        folder: join(BUNDLE2, "4. Springboot") },
  { id: "hibernate",         folder: join(BUNDLE2, "5. Hibernate") },
  { id: "microservices",     folder: join(BUNDLE2, "6. Microservices") },
  { id: "spring-bonus",      folder: join(BUNDLE2, "Bonus") },
  { id: "spring-interview",  folder: join(BUNDLE2, "Interview Questions") },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function collectPdfs(dir) {
  const results = [];
  if (!existsSync(dir)) { console.warn(`  ⚠ folder not found: ${dir}`); return results; }
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      results.push(...collectPdfs(full));
    } else if (extname(entry).toLowerCase() === ".pdf") {
      results.push(full);
    }
  }
  return results;
}

async function uploadFile(bucket, localPath, destPath) {
  await bucket.upload(localPath, {
    destination: destPath,
    metadata: { contentType: "application/pdf", cacheControl: "public, max-age=86400" },
  });
  const file = bucket.file(destPath);
  const [url] = await file.getSignedUrl({
    action: "read",
    expires: "03-01-2030",
  });
  return url;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  // Init Firebase Admin
  if (USE_ADC) {
    console.log("ℹ  No service-account.json found - using Application Default Credentials.");
    console.log("   Make sure you have run: gcloud auth application-default login\n");
    admin.initializeApp({ credential: admin.credential.applicationDefault(), storageBucket: BUCKET, projectId: PROJECT_ID });
  } else {
    const sa = JSON.parse(readFileSync(SERVICE_ACCT, "utf-8"));
    admin.initializeApp({ credential: admin.credential.cert(sa), storageBucket: BUCKET, projectId: PROJECT_ID });
    console.log("✓  Loaded service account:", sa.client_email, "\n");
  }

  const db     = admin.firestore();
  const bucket = admin.storage().bucket();

  let totalFiles = 0;
  let totalBytes = 0;

  for (const mod of MODULES) {
    const pdfs = collectPdfs(mod.folder);
    console.log(`\n📦  ${mod.id}  (${pdfs.length} PDFs)`);

    if (pdfs.length === 0) {
      console.log("    skip - no PDFs found");
      continue;
    }

    const files = [];
    for (const pdf of pdfs) {
      const name    = basename(pdf);
      const dest    = `intel-resources/${mod.id}/${name}`;
      const sizeMB  = (statSync(pdf).size / 1_048_576).toFixed(1);
      process.stdout.write(`    ↑ ${name} (${sizeMB} MB)... `);
      try {
        const url = await uploadFile(bucket, pdf, dest);
        files.push({ name, url });
        totalBytes += statSync(pdf).size;
        totalFiles++;
        console.log("✓");
      } catch (err) {
        console.log(`✗  ${err.message}`);
      }
    }

    if (files.length === 0) continue;

    // Save to Firestore
    const docData = {
      files,
      status:    "available",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    // If single file, also set `url` for backward-compat
    if (files.length === 1) docData.url = files[0].url;

    await db.collection("intel_resources").doc(mod.id).set(docData, { merge: true });
    console.log(`    ✓ Firestore intel_resources/${mod.id} updated (${files.length} files)`);
  }

  console.log(`\n✅  Done! Uploaded ${totalFiles} files (${(totalBytes / 1_048_576).toFixed(0)} MB total)\n`);
}

main().catch(err => { console.error("Fatal:", err); process.exit(1); });
