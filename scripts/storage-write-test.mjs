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
const testPath = `_healthcheck/quota-test-${Date.now()}.txt`;
const file = bucket.file(testPath);

try {
  await file.save("ok", { contentType: "text/plain" });
  console.log("WRITE OK:", testPath);
  await file.delete();
  console.log("CLEANUP OK: test file removed");
} catch (err) {
  console.error("WRITE FAILED:", err.code || err.message);
  process.exit(1);
}
