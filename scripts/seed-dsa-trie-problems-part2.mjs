import admin from "firebase-admin";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(join(__dirname, "service-account.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// DSA-450-sheet ingestion, TRIE topic, part 2 - closing the gap against the
// sheet's verbatim row list after auditing what seed-dsa-trie-problems.mjs
// already covers.
//
// Row-by-row disposition:
//   - "Construct a trie from scratch"                 -> already covered by
//     "Implement a Trie - Insert and Search Words". Skipped.
//   - "Find shortest unique prefix..."                 -> already covered by
//     "Find the Shortest Unique Prefix for Every Word". Skipped.
//   - "Word Break Problem (Trie solution)"             -> genuinely missing.
//     Firestore has "Word Break Problem" (Strings, DP, Yes/No) and
//     "Word Break - Count All Ways" (Backtracking, counts ways) - neither
//     asks for the actual segmentations, which is the framing that makes a
//     trie-based walk (matching multiple dictionary words per starting
//     index in one pass) the natural solution. Added below.
//   - "print all anagrams together"                    -> already covered
//     by "Group Anagrams Together" (Strings). Skipped as duplicate.
//   - "Implement a Phone Directory"                     -> already covered
//     by "Phone Directory - Autocomplete by Prefix". Skipped.
//   - "Print unique rows in a given boolean matrix"     -> already covered
//     by "Print Unique Rows in a Boolean Matrix". Skipped.

const REWARD = { Easy: [30, 10], Medium: [50, 20], Hard: [80, 30] };
function p(title, category, difficulty, tags, statement, constraints, examplesText, hints, sampleTests, hiddenTests) {
  const [xpReward, coinReward] = REWARD[difficulty];
  return { title, category, difficulty, tags, statement, constraints, examplesText, hints, xpReward, coinReward, sampleTests, hiddenTests };
}

const PROBLEMS = [

p("Word Break - Print All Sentences (Trie)", "Trie", "Hard", ["Trie", "Backtracking", "String"],
  "Given a string s and a dictionary of words (space-separated on the second input line, each word reusable any number of times), find every way to segment s into a sequence of dictionary words. Print each valid segmentation as its words separated by single spaces, one segmentation per line, sorted in ascending lexicographic order of the printed sentence. If no segmentation exists, print 'None'. It is guaranteed that at most 200 distinct segmentations exist for the given input.",
  "1 <= |s| <= 20, 1 <= number of dictionary words <= 50",
  "Input:\ncatsanddog\ncat cats and sand dog\nOutput:\ncat sand dog\ncats and dog",
  ["Build a trie of all the dictionary words up front, rather than a hash set.", "Backtrack from each starting index i: walk the trie one character at a time along s[i..]; every trie node you pass through that marks the end of a word gives you a valid dictionary word ending there, so you can recurse from that next index - this finds every matching dictionary word starting at i in a single walk instead of testing each dictionary word separately.", "Collect every completed segmentation (a walk that reaches the end of s) as a space-joined sentence, then sort the full list of sentences lexicographically before printing - that way the output order doesn't depend on trie child order or dictionary input order."],
  [{ input: "catsanddog\ncat cats and sand dog", expectedOutput: "cat sand dog\ncats and dog", explanation: "" },
   { input: "leetcode\nleet code", expectedOutput: "leet code", explanation: "" }],
  [{ input: "ab\na", expectedOutput: "None", points: 1 },
   { input: "aaa\na aa", expectedOutput: "a a a\na aa\naa a", points: 1 },
   { input: "pineapplepenapple\napple pen applepen pine pineapple", expectedOutput: "pine apple pen apple\npine applepen apple\npineapple pen apple", points: 1 }]),

];

let created = 0, skipped = 0;
for (const prob of PROBLEMS) {
  const existing = await db.collection("problems").where("title", "==", prob.title).get();
  if (!existing.empty) { skipped++; continue; }
  const { sampleTests, hiddenTests, ...problemFields } = prob;
  const problemRef = await db.collection("problems").add({
    ...problemFields, estimatedTime: 20, status: "published",
    totalSubmissions: 0, acceptedSubmissions: 0,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    createdBy: "devert.contact@gmail.com",
  });
  for (const t of sampleTests) await problemRef.collection("sampleTests").add(t);
  for (const t of hiddenTests) await problemRef.collection("hiddenTests").add(t);
  created++;
}
console.log(`TRIE topic (part 2): created ${created} problem(s), skipped ${skipped} already-existing.`);
