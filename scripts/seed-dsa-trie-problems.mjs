import admin from "firebase-admin";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(join(__dirname, "service-account.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// DSA-450-sheet ingestion, TRIE topic. Rows already covered elsewhere
// (grouping anagrams, word-break) are skipped rather than reseeded.

const REWARD = { Easy: [30, 10], Medium: [50, 20], Hard: [80, 30] };
function p(title, category, difficulty, tags, statement, constraints, examplesText, hints, sampleTests, hiddenTests) {
  const [xpReward, coinReward] = REWARD[difficulty];
  return { title, category, difficulty, tags, statement, constraints, examplesText, hints, xpReward, coinReward, sampleTests, hiddenTests };
}

const PROBLEMS = [

p("Implement a Trie - Insert and Search Words", "Trie", "Medium", ["Trie"],
  "Build a trie from n given words, then answer q queries; each query is a word, and you print 'Yes' if it was one of the originally inserted words, otherwise 'No'. Print all q answers space-separated on one line.",
  "1 <= n, q <= 10^5",
  "Input:\n3\napple\napp\napricot\n3\napp\nappl\napricot\nOutput:\nYes No Yes",
  ["Build a tree of characters where each node has up to 26 children (one per letter) and a flag marking 'a complete word ends here'.", "A query word exists only if you can follow its characters node by node all the way through AND the final node's end-of-word flag is set - reaching a node that only continues as a prefix of a longer word doesn't count."],
  [{ input: "3\napple\napp\napricot\n3\napp\nappl\napricot", expectedOutput: "Yes No Yes", explanation: "" },
   { input: "1\ncat\n2\ncat\nca", expectedOutput: "Yes No", explanation: "" }],
  [{ input: "1\na\n1\na", expectedOutput: "Yes", points: 1 },
   { input: "2\nhello\nworld\n3\nhell\nworld\nworlds", expectedOutput: "No Yes No", points: 1 },
   { input: "1\ntest\n2\ntest\ntest", expectedOutput: "Yes Yes", points: 1 }]),

p("Find the Shortest Unique Prefix for Every Word", "Trie", "Hard", ["Trie"],
  "Given n distinct words, find, for each word, its shortest prefix that is not a prefix of any other word in the list. If no such prefix exists within the word's own length (every one of its prefixes, including its full length, is shared with some other word), use the entire word itself. Print the answers in the same order as the input words, space-separated.",
  "1 <= n <= 10^5",
  "Input:\n4\nzebra\ndog\nduck\ndove\nOutput:\nz dog du dov",
  ["Build a trie of all the words, and additionally store, at every trie node, a count of how many words pass through it.", "For each word, walk down its trie path and stop at the first node whose pass-through count is exactly 1 - that node's path is the answer; if you reach the end of the word without finding one, use the full word."],
  [{ input: "4\nzebra\ndog\nduck\ndove", expectedOutput: "z dog du dov", explanation: "" },
   { input: "3\ndog\ndeer\ndeal", expectedOutput: "do dee dea", explanation: "" }],
  [{ input: "1\na", expectedOutput: "a", points: 1 },
   { input: "2\nab\nac", expectedOutput: "ab ac", points: 1 },
   { input: "3\na\nab\nabc", expectedOutput: "a ab abc", points: 1 }]),

p("Phone Directory - Autocomplete by Prefix", "Trie", "Medium", ["Trie"],
  "Given n contact names and q query prefixes, for each query print every contact name that starts with that prefix, sorted alphabetically and space-separated on one line (print 'None' if nothing matches). Print one line of output per query.",
  "1 <= n, q <= 10^5",
  "Input:\n4\ngugu\ngujju\ngujjubhai\ngoogler\n2\ngu\ngug\nOutput:\ngugu gujju gujjubhai\ngugu",
  ["A trie lets you walk directly to the node representing the prefix, then collect every complete word reachable below it.", "Sort each query's matches alphabetically before printing - a trie naturally visits children in a fixed order if you always explore them in sorted order."],
  [{ input: "4\ngugu\ngujju\ngujjubhai\ngoogler\n2\ngu\ngug", expectedOutput: "gugu gujju gujjubhai\ngugu", explanation: "" },
   { input: "1\ncat\n2\nc\nd", expectedOutput: "cat\nNone", explanation: "" }],
  [{ input: "1\na\n1\na", expectedOutput: "a", points: 1 },
   { input: "2\napple\napp\n1\napp", expectedOutput: "app apple", points: 1 },
   { input: "2\nhello\nworld\n1\nx", expectedOutput: "None", points: 1 }]),

p("Print Unique Rows in a Boolean Matrix", "Trie", "Medium", ["Trie", "Matrix"],
  "Given a matrix of 0s and 1s, print only its distinct rows, in their original relative order (the first occurrence of each distinct row pattern is kept; later duplicates are dropped). Print each kept row on its own line, space-separated.",
  "1 <= rows, cols <= 1000",
  "Input:\n4 5\n0 1 0 0 1\n1 0 1 1 0\n0 1 0 0 1\n1 1 1 0 0\nOutput:\n0 1 0 0 1\n1 0 1 1 0\n1 1 1 0 0",
  ["Insert each row (as a sequence of 0/1 'characters') into a trie one at a time.", "A row is a duplicate of an earlier one exactly when its entire path already existed in the trie before you inserted it - track a 'seen as a complete row before' flag at the end-of-row node."],
  [{ input: "4 5\n0 1 0 0 1\n1 0 1 1 0\n0 1 0 0 1\n1 1 1 0 0", expectedOutput: "0 1 0 0 1\n1 0 1 1 0\n1 1 1 0 0", explanation: "" },
   { input: "2 2\n1 1\n1 1", expectedOutput: "1 1", explanation: "" }],
  [{ input: "1 1\n1", expectedOutput: "1", points: 1 },
   { input: "3 2\n0 0\n1 1\n0 0", expectedOutput: "0 0\n1 1", points: 1 },
   { input: "4 2\n1 0\n0 1\n1 0\n0 1", expectedOutput: "1 0\n0 1", points: 1 }]),

p("Maximum XOR of Two Numbers in an Array", "Trie", "Hard", ["Trie", "Bit Manipulation"],
  "Given an array of n non-negative integers, find the maximum value of arr[i] XOR arr[j] over any pair of elements (i can equal j, though pairing an element with itself is never optimal unless the array is all zeros).",
  "1 <= n <= 10^5, 0 <= arr[i] <= 10^9",
  "Input:\n6\n3 10 5 25 2 8\nOutput:\n28",
  ["Insert every number's binary representation (fixed width, e.g. 32 bits) into a trie, bit by bit from the most significant bit.", "For each number, greedily walk the trie trying to go the OPPOSITE way at every bit (which maximizes the XOR at that bit position) whenever that branch actually exists."],
  [{ input: "6\n3 10 5 25 2 8", expectedOutput: "28", explanation: "5 XOR 25 = 28." },
   { input: "2\n1 2", expectedOutput: "3", explanation: "" }],
  [{ input: "2\n0 0", expectedOutput: "0", points: 1 },
   { input: "2\n1 1", expectedOutput: "0", points: 1 },
   { input: "8\n8 1 2 12 7 6 0 15", expectedOutput: "15", points: 1 }]),

p("Count Distinct Substrings of a String", "Trie", "Medium", ["Trie", "String"],
  "Given a string s, count the number of distinct non-empty substrings it contains (substrings with the same characters count only once, even if they occur at different positions).",
  "1 <= |s| <= 2000",
  "Input:\naab\nOutput:\n5",
  ["Insert every suffix of the string into a trie, one character at a time.", "The total number of distinct substrings equals the total number of nodes created in the trie (excluding the root) - every trie node represents exactly one distinct substring (a prefix of some suffix)."],
  [{ input: "aab", expectedOutput: "5", explanation: "a, aa, ab, aab, b." },
   { input: "abc", expectedOutput: "6", explanation: "" }],
  [{ input: "a", expectedOutput: "1", points: 1 },
   { input: "aa", expectedOutput: "2", points: 1 },
   { input: "aaa", expectedOutput: "3", points: 1 }]),

p("Count Words With a Given Prefix", "Trie", "Easy", ["Trie"],
  "Given n words and a prefix string, count how many of the words start with that prefix.",
  "1 <= n <= 10^5",
  "Input:\n4\napple\napp\napplication\nbanana\napp\nOutput:\n3",
  ["Build a trie of all the words, storing at each node a count of how many words pass through it.", "Walk the trie along the prefix's characters; the count stored at the node you land on (if the whole prefix path exists) is the answer - if the path breaks before the prefix ends, the answer is 0."],
  [{ input: "4\napple\napp\napplication\nbanana\napp", expectedOutput: "3", explanation: "" },
   { input: "2\ncat\ndog\nc", expectedOutput: "1", explanation: "" }],
  [{ input: "1\na\na", expectedOutput: "1", points: 1 },
   { input: "1\na\nab", expectedOutput: "0", points: 1 },
   { input: "4\nhello\nhelp\nhelicopter\nworld\nhel", expectedOutput: "3", points: 1 }]),

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
console.log(`TRIE topic: created ${created} problem(s), skipped ${skipped} already-existing.`);
