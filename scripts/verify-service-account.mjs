/**
 * verify-service-account.mjs
 *
 * Sanity-checks scripts/service-account.json without ever printing the
 * private key material. Run this after downloading a fresh key from
 * Firebase Console to confirm the file is well-formed before using it.
 *
 *   node scripts/verify-service-account.mjs
 */

import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FILE = join(__dirname, "service-account.json");

const REQUIRED_FIELDS = [
  "type",
  "project_id",
  "private_key_id",
  "private_key",
  "client_email",
  "client_id",
  "token_uri",
];

function fail(msg) {
  console.error(`✗ ${msg}`);
  process.exitCode = 1;
}

if (!existsSync(FILE)) {
  fail(`File not found: ${FILE}`);
  process.exit(1);
}

let raw;
try {
  raw = readFileSync(FILE, "utf8");
} catch (err) {
  fail(`Could not read file: ${err.message}`);
  process.exit(1);
}

let json;
try {
  json = JSON.parse(raw);
} catch (err) {
  fail(`Not valid JSON: ${err.message}`);
  process.exit(1);
}

let ok = true;

if (json.type !== "service_account") {
  fail(`"type" is "${json.type}", expected "service_account"`);
  ok = false;
}

if (json.project_id !== "devert-me") {
  fail(`"project_id" is "${json.project_id}", expected "devert-me"`);
  ok = false;
}

for (const field of REQUIRED_FIELDS) {
  if (!json[field] || typeof json[field] !== "string" || json[field].length === 0) {
    fail(`Missing or empty required field: "${field}"`);
    ok = false;
  }
}

if (typeof json.client_email === "string" &&
    !json.client_email.endsWith("@devert-me.iam.gserviceaccount.com")) {
  fail(`"client_email" does not look like a devert-me service account: ${json.client_email}`);
  ok = false;
}

if (typeof json.private_key === "string") {
  const key = json.private_key;
  const hasBegin = key.startsWith("-----BEGIN PRIVATE KEY-----");
  const hasEnd = key.trim().endsWith("-----END PRIVATE KEY-----");
  const lineCount = key.split("\n").filter(Boolean).length;

  if (!hasBegin) fail('"private_key" does not start with "-----BEGIN PRIVATE KEY-----"'), (ok = false);
  if (!hasEnd) fail('"private_key" does not end with "-----END PRIVATE KEY-----"'), (ok = false);
  if (lineCount < 5) fail(`"private_key" looks too short (${lineCount} lines) - likely truncated`), (ok = false);

  // Never print the key itself - only report shape.
  console.log(`  private_key: ${hasBegin && hasEnd ? "PEM headers OK" : "PEM headers MISSING"}, ${lineCount} lines, length ${key.length}`);
}

if (ok) {
  console.log("✓ service-account.json looks structurally valid.");
  console.log(`  project_id:   ${json.project_id}`);
  console.log(`  client_email: ${json.client_email}`);
  console.log(`  key_id:       ${json.private_key_id}`);
} else {
  console.error("\nFile failed validation - re-download a fresh key from Firebase Console rather than hand-editing this one.");
  process.exit(1);
}
