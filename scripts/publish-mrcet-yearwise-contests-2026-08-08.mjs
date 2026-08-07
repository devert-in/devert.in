// One-off: flips the 3 already-seeded MRCET 08-Aug contests from draft to
// published. Not a job for seed-mrcet-yearwise-contests-2026-08-08.mjs
// itself - its --publish flag only sets status at CREATE time and its
// seedKey check SKIPs existing docs, so re-running it against these three
// (already created by an earlier draft run) would never touch them.
//
// Mirrors lib/contests.js's transitionContestLifecycle(id, "registrationOpen")
// exactly - same status/lifecycleState pair, same lifecycleHistory shape -
// so every admin lifecycle action (Force End, Pause, Extend Time) that reads
// lifecycleState keeps working on these later. Setting `status: "published"`
// alone would leave lifecycleState unset, and transitionContestLifecycle
// treats a missing lifecycleState as "draft", which would make future
// admin-console lifecycle actions (e.g. Force End) reject with "cannot move
// from draft" even though the contest is actually live to students.
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
const db = admin.firestore();

const SEED_KEY = "mrcet-yearwise-2026-08-08";
const DRY_RUN = process.argv.includes("--dry-run");

async function main() {
  const snap = await db.collection("contests")
    .where("seedKey", ">=", `${SEED_KEY}:`).where("seedKey", "<=", `${SEED_KEY}:`).get();

  console.log(`found ${snap.size} seeded contests`);

  for (const d of snap.docs) {
    const c = d.data();
    if (c.status === "published") {
      console.log(`  SKIP ${d.id} "${c.title}" - already published`);
      continue;
    }
    console.log(`  ${DRY_RUN ? "[dry-run] would publish" : "publishing"} ${d.id} "${c.title}"`);
    if (DRY_RUN) continue;

    const history = c.lifecycleHistory || [];
    await d.ref.update({
      status: "published",
      lifecycleState: "registrationOpen",
      lifecycleHistory: [...history, {
        state: "registrationOpen",
        at: admin.firestore.Timestamp.now(),
        byUid: "devert.contact@gmail.com",
      }],
    });
  }

  if (DRY_RUN) { console.log("\ndry run - no writes made."); return; }

  const after = await db.collection("contests")
    .where("seedKey", ">=", `${SEED_KEY}:`).where("seedKey", "<=", `${SEED_KEY}:`).get();
  console.log("\nverified:");
  after.docs.forEach(d => console.log(`  ${d.id}  status=${d.data().status}  lifecycleState=${d.data().lifecycleState}`));
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
