// Week 5's lesson titles were numbered "Day 23-27", continuing the OLD
// title-numbering scheme - but that scheme has a pre-existing 2-day gap
// (Week 1 titles end at "Day 5", Week 2 titles start at "Day 8", skipping
// 6 and 7, even though only 6 chronological items - Week 1's Saturday test
// - separate them). fetchTrackProgress's currentDayIndex (lib/dailyLearning.js)
// counts every published item to date, so it has no such gap: by Monday
// 2026-08-17, 24 items already exist (weeks 1-4) and this is the 25th,
// which is what the sidebar actually shows. Renumbering titles here to
// 25-29 makes them match that count going forward instead of perpetuating
// the old gap.
import admin from "firebase-admin";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
admin.initializeApp({
  credential: admin.credential.cert(JSON.parse(readFileSync(join(__dirname, "service-account.json"), "utf8"))),
});
const db = admin.firestore();
const col = db.collection("institutions").doc("mrcet").collection("dailyLearning");

const RENAMES = {
  "2026-08-17": "Day 25: Binary Heaps - The Heap Property",
  "2026-08-18": "Day 26: Heap Operations - Insert, Extract, Build-Heap",
  "2026-08-19": "Day 27: Priority Queues, Heap Sort & Top-K Patterns",
  "2026-08-20": "Day 28: Hashing Fundamentals - Hash Tables & Collisions",
  "2026-08-21": "Day 29: Hash Table Applications - Sets, Frequency Counting & Anagrams",
};

for (const [date, title] of Object.entries(RENAMES)) {
  const ref = col.doc(date);
  const snap = await ref.get();
  if (!snap.exists) { console.log(`SKIP ${date} - doc does not exist`); continue; }
  const before = snap.data().title;
  await ref.update({ title });
  console.log(`${date}: "${before}" -> "${title}"`);
}
process.exit(0);
