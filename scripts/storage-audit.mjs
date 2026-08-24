import admin from "firebase-admin";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(join(__dirname, "service-account.json"), "utf8"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "devert-me.firebasestorage.app",
});

const bucket = admin.storage().bucket();

const [files] = await bucket.getFiles();

let total = 0;
const byPrefix = {};

for (const f of files) {
  const size = parseInt(f.metadata.size || "0", 10);
  total += size;
  const prefix = f.name.split("/")[0] || "(root)";
  byPrefix[prefix] = (byPrefix[prefix] || 0) + size;
}

const mb = (n) => (n / 1024 / 1024).toFixed(2) + " MB";

console.log(`Total files: ${files.length}`);
console.log(`Total size:  ${mb(total)}`);
console.log("\nBy top-level folder:");
for (const [prefix, size] of Object.entries(byPrefix).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${prefix.padEnd(24)} ${mb(size)}`);
}

const sorted = files
  .map(f => ({ name: f.name, size: parseInt(f.metadata.size || "0", 10) }))
  .sort((a, b) => b.size - a.size)
  .slice(0, 15);

console.log("\nLargest 15 files:");
for (const f of sorted) {
  console.log(`  ${mb(f.size).padEnd(12)} ${f.name}`);
}
