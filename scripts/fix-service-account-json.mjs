/**
 * fix-service-account-json.mjs
 *
 * Repairs scripts/service-account.json when it contains raw (unescaped)
 * newline/control characters inside JSON string values - a common result
 * of copy-pasting a key through a text field instead of saving the file
 * directly. Performs a generic string-aware re-escape; never reads or
 * prints any field value.
 *
 *   node scripts/fix-service-account-json.mjs
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FILE = join(__dirname, "service-account.json");

if (!existsSync(FILE)) {
  console.error(`File not found: ${FILE}`);
  process.exit(1);
}

const raw = readFileSync(FILE, "utf8");

// Quick check: is it already valid JSON? If so, nothing to do.
try {
  JSON.parse(raw);
  console.log("File is already valid JSON - no repair needed.");
  process.exit(0);
} catch {
  // fall through to repair
}

function repair(text) {
  let out = "";
  let inString = false;
  let escaped = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (!inString) {
      if (ch === '"') inString = true;
      out += ch;
      continue;
    }

    // inString === true
    if (escaped) {
      out += ch;
      escaped = false;
      continue;
    }
    if (ch === "\\") {
      out += ch;
      escaped = true;
      continue;
    }
    if (ch === '"') {
      inString = false;
      out += ch;
      continue;
    }
    if (ch === "\n") {
      out += "\\n";
      continue;
    }
    if (ch === "\r") {
      // drop bare CR; a following \n (if any) becomes \\n above
      continue;
    }
    const code = ch.charCodeAt(0);
    if (code < 0x20) {
      out += "\\u" + code.toString(16).padStart(4, "0");
      continue;
    }
    out += ch;
  }

  return out;
}

const repaired = repair(raw);

let parsed;
try {
  parsed = JSON.parse(repaired);
} catch (err) {
  console.error(`Automatic repair failed: ${err.message}`);
  console.error("The file may have deeper corruption. Re-download a fresh key from Firebase Console instead.");
  process.exit(1);
}

writeFileSync(FILE, JSON.stringify(parsed, null, 2) + "\n", "utf8");
console.log("✓ Repaired scripts/service-account.json (re-escaped embedded newlines). No key content was printed.");
