import admin from "firebase-admin";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(join(__dirname, "service-account.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// DSA-450-sheet ingestion, STRING topic, PART 2. The original
// seed-dsa-string-problems.mjs only covered a curated subset of the sheet's
// String rows without saying so; this file fills the genuine gap against the
// real sheet row list. Legitimate skips (not filled here, and not a mistake):
//   - "Why are strings immutable in Java?" - conceptual, not codeable.
//   - "Boyer-Moore Algorithm for Pattern Searching" - same input/output
//     contract as the already-seeded KMP + Rabin-Karp pattern-search
//     problems, so it would be a real duplicate, not a new problem.
//   - "String matching where one string contains wildcard characters" -
//     already correctly seeded as "Wildcard Pattern Matching" under the
//     Dynamic Programming category (scripts/seed-dsa-dp-problems.mjs) - a
//     sheet row that's cross-filed there rather than under Strings.
// Every other codeable row from the sheet's String topic that wasn't already
// present is added below. All expectedOutput values were derived from
// hand-verified reference implementations (run and cross-checked, not
// guessed) - see e.g. the "Transform One String to Another" problem, whose
// naive back-to-back greedy algorithm was checked against brute force and
// found to disagree on ~45% of random cases, so the brute-force-verified
// values are what's stored here.

const REWARD = { Easy: [30, 10], Medium: [50, 20], Hard: [80, 30] };
function p(title, category, difficulty, tags, statement, constraints, examplesText, hints, sampleTests, hiddenTests) {
  const [xpReward, coinReward] = REWARD[difficulty];
  return { title, category, difficulty, tags, statement, constraints, examplesText, hints, xpReward, coinReward, sampleTests, hiddenTests };
}

const PROBLEMS = [

p("Rearrange a String So That No Two Adjacent Characters Are the Same", "Strings", "Medium", ["String", "Heap", "Greedy"],
  "Given a string s of lowercase English letters, rearrange its characters (using every character exactly once) so that no two adjacent characters are equal. Build the arrangement with this exact greedy procedure so the result is unambiguous: repeatedly place the character with the largest remaining count; if multiple characters are tied on remaining count, prefer the alphabetically smallest one; if the resulting top choice is the same character you just placed, temporarily set it aside and place the next-best character instead (returning the set-aside one to the pool for later). Print the final string, or print -1 if no valid arrangement exists.",
  "1 <= |s| <= 10^5, s consists of lowercase English letters",
  "Input:\naab\nOutput:\naba",
  ["A valid arrangement exists if and only if the most frequent character's count does not exceed ceil(|s| / 2).", "A max-heap keyed by (remaining count, character) lets you always pop the best next candidate in the tie-break order described above.", "When the popped candidate equals the character you just placed, pop the next one instead, use it, then push the first one back into the heap unchanged for a future turn."],
  [{ input: "aab", expectedOutput: "aba", explanation: "" },
   { input: "aa", expectedOutput: "-1", explanation: "Both characters are 'a' - they'd always be adjacent." }],
  [{ input: "aabbcc", expectedOutput: "abcabc", points: 1 },
   { input: "aabb", expectedOutput: "abab", points: 1 },
   { input: "aaab", expectedOutput: "-1", points: 1 }]),

p("Generate All Valid IP Addresses from a String of Digits", "Strings", "Medium", ["String", "Backtracking"],
  "Given a string s of digits, insert exactly three dots into it to split it into four segments forming a valid IPv4 address. Each segment must be non-empty, at most 3 digits long, represent an integer between 0 and 255, and must not have a leading zero unless the segment is exactly '0'. Print every valid IP address obtainable this way, space-separated, in the order produced by trying the first segment's length from 1 to 3, then (for each) the second segment's length from 1 to 3, then the third segment's length from 1 to 3 (the fourth segment takes whatever digits remain). If none exist, print 'None'.",
  "4 <= |s| <= 12, s consists of digits '0'-'9'",
  "Input:\n25525511135\nOutput:\n255.255.11.135 255.255.111.35",
  ["Only strings of length 4 to 12 can ever form a valid IPv4 address, since each of the 4 segments is 1 to 3 digits.", "Try every combination of segment lengths (1, 2, or 3) for the first three segments; the fourth segment is whatever's left over, and must also be 1 to 3 digits.", "A segment is invalid if it's longer than 3 digits, exceeds 255 numerically, or has a leading zero while having more than one digit."],
  [{ input: "25525511135", expectedOutput: "255.255.11.135 255.255.111.35", explanation: "" },
   { input: "0000", expectedOutput: "0.0.0.0", explanation: "" }],
  [{ input: "1111", expectedOutput: "1.1.1.1", points: 1 },
   { input: "010010", expectedOutput: "0.10.0.10 0.100.1.0", points: 1 },
   { input: "101023", expectedOutput: "1.0.10.23 1.0.102.3 10.1.0.23 10.10.2.3 101.0.2.3", points: 1 }]),

p("Smallest Window Containing All Distinct Characters of a String", "Strings", "Medium", ["String", "Sliding Window"],
  "Given a string s, find the smallest substring of s that contains every distinct character appearing in s at least once. If more than one substring achieves this minimum length, print the one that starts earliest (leftmost).",
  "1 <= |s| <= 10^5",
  "Input:\naabcbcdbca\nOutput:\ndbca",
  ["Use a sliding window: expand the right end, tracking counts of each character currently inside the window, until the window contains all distinct characters of s.", "Once the window is valid, try shrinking from the left as much as possible while it remains valid, recording the best (smallest, then leftmost) window seen.", "The total number of distinct characters in s is fixed upfront - compute it once before sliding."],
  [{ input: "aabcbcdbca", expectedOutput: "dbca", explanation: "" },
   { input: "aaaa", expectedOutput: "a", explanation: "" }],
  [{ input: "abcabc", expectedOutput: "abc", points: 1 },
   { input: "aabbcc", expectedOutput: "abbc", points: 1 },
   { input: "geeksforgeeks", expectedOutput: "eksforg", points: 1 }]),

p("Smallest Window in a String Containing All Characters of Another String", "Strings", "Hard", ["String", "Sliding Window", "Hashing"],
  "Given strings s and t, find the smallest contiguous substring of s that contains every character of t, including repeated characters at least as many times as they occur in t. If more than one substring of that minimum length qualifies, print the one that starts earliest. If no such window exists, print -1.",
  "1 <= |s|, |t| <= 10^5",
  "Input:\nADOBECODEBANC\nABC\nOutput:\nBANC",
  ["Track how many of each required character (from t) are still missing inside the current window, using a frequency map.", "Slide the window's right edge forward, and whenever the window has zero missing characters, try shrinking from the left as far as possible while staying valid.", "If t is longer than s, or contains more of some character than s has in total, no valid window can ever exist."],
  [{ input: "ADOBECODEBANC\nABC", expectedOutput: "BANC", explanation: "" },
   { input: "a\na", expectedOutput: "a", explanation: "" }],
  [{ input: "a\naa", expectedOutput: "-1", points: 1 },
   { input: "aa\naa", expectedOutput: "aa", points: 1 },
   { input: "aaflslflsldkalskaaa\naaa", expectedOutput: "aaa", points: 1 }]),

p("Number of Flips to Make a Binary String Alternating", "Strings", "Easy", ["String", "Greedy"],
  "Given a binary string s, find the minimum number of characters you must flip (change a '0' to '1' or a '1' to '0') so that the resulting string alternates, meaning no two adjacent characters are equal.",
  "1 <= |s| <= 10^5",
  "Input:\n0001\nOutput:\n1",
  ["There are only two possible alternating targets for a given length: one starting with '0' and one starting with '1'.", "For each target pattern, count how many positions of s already disagree with it - that count is exactly how many flips that target would need.", "The two counts always add up to |s|, so computing one tells you the other for free; the answer is the smaller of the two."],
  [{ input: "0001", expectedOutput: "1", explanation: "" },
   { input: "1010", expectedOutput: "0", explanation: "Already alternating." }],
  [{ input: "0000", expectedOutput: "2", points: 1 },
   { input: "1", expectedOutput: "0", points: 1 },
   { input: "0110", expectedOutput: "2", points: 1 }]),

p("Find the First Repeated Word in a String", "Strings", "Easy", ["String", "Hashing"],
  "Given a sentence of space-separated words, find the first word (scanning left to right) that has already appeared earlier in the sentence. Print that word, or print 'None' if no word repeats. Comparison is case-sensitive and exact.",
  "1 <= number of words <= 10^5, 1 <= |each word| <= 50, words consist of English letters only",
  "Input:\nthe quick brown fox jumps over the lazy dog\nOutput:\nthe",
  ["Scan the words left to right, keeping a set of every word seen so far.", "The first word you encounter that's already in the set is the answer - stop immediately, don't keep scanning for a possibly 'better' repeat.", "If you reach the end without ever hitting a word already in the set, no word repeats."],
  [{ input: "the quick brown fox jumps over the lazy dog", expectedOutput: "the", explanation: "" },
   { input: "a b c d", expectedOutput: "None", explanation: "" }],
  [{ input: "x x", expectedOutput: "x", points: 1 },
   { input: "hello world hello", expectedOutput: "hello", points: 1 },
   { input: "one two three two one", expectedOutput: "two", points: 1 }]),

p("Search a Word in a 2D Grid of Characters", "Strings", "Medium", ["String", "Matrix", "Backtracking"],
  "Given an R x C grid of lowercase letters and a word, print 'Yes' if the word can be found by starting at some cell and reading consecutive characters in a straight line in one of the 8 directions (up, down, left, right, and the four diagonals) without going out of bounds, otherwise print 'No'. The first line of input is R and C; the next R lines are the grid's rows; the last line is the word.",
  "1 <= R, C <= 100, 1 <= |word| <= 100",
  "Input:\n3 3\nabc\ndef\nghi\nadg\nOutput:\nYes",
  ["For every cell that matches the word's first character, try extending in each of the 8 directions and check every subsequent character along that line.", "Stop checking a direction as soon as a character mismatches or the next position falls outside the grid.", "A word longer than max(R, C) can still be found along a diagonal, so don't rule it out just from R and C alone - check all 8 directions properly."],
  [{ input: "3 3\nabc\ndef\nghi\nadg", expectedOutput: "Yes", explanation: "'a','d','g' read straight down column 0." },
   { input: "3 3\nabc\ndef\nghi\ncat", expectedOutput: "No", explanation: "" }],
  [{ input: "3 3\nabc\ndef\nghi\naei", expectedOutput: "Yes", points: 1 },
   { input: "3 3\nabc\ndef\nghi\nceg", expectedOutput: "Yes", points: 1 },
   { input: "3 3\nabc\ndef\nghi\nxyz", expectedOutput: "No", points: 1 }]),

p("Count Occurrences of a Given String in a 2D Character Array", "Strings", "Medium", ["String", "Matrix"],
  "Given an R x C grid of characters and a word, count how many times word occurs in the grid, searching only left-to-right along each row and top-to-bottom along each column (no other directions, no wraparound). Overlapping occurrences within the same row or column both count. The first line of input is R and C; the next R lines are the grid's rows; the last line is the word. Print the total count.",
  "1 <= R, C <= 100, 1 <= |word| <= 100",
  "Input:\n3 3\nabx\nabx\nxyz\nab\nOutput:\n2",
  ["Check every row as a plain string for occurrences of word (including overlapping ones), then do the same for every column read top-to-bottom.", "Building each column as a string first (by reading down) makes it just as easy to search as a row.", "A single long run of the same character (like 'aaaa' with word 'aa') can contain multiple overlapping matches - count every starting position, not just non-overlapping ones."],
  [{ input: "3 3\nabx\nabx\nxyz\nab", expectedOutput: "2", explanation: "'ab' occurs at the start of row 0 and row 1." },
   { input: "2 2\naa\nba\nab", expectedOutput: "1", explanation: "'ab' occurs reading column 0 top-to-bottom." }],
  [{ input: "2 2\nab\nab\nab", expectedOutput: "2", points: 1 },
   { input: "1 4\naaaa\naa", expectedOutput: "3", points: 1 },
   { input: "2 3\nxyz\nxyz\nab", expectedOutput: "0", points: 1 }]),

p("Convert a Sentence to Its Mobile Numeric Keypad Sequence", "Strings", "Easy", ["String"],
  "Given a sentence s of uppercase English letters and spaces, convert it to the digit sequence you would type on an old numeric-keypad mobile phone, where each key is pressed a number of times equal to the letter's position within that key's group: 2 -> A(1) B(2) C(3); 3 -> D(1) E(2) F(3); 4 -> G(1) H(2) I(3); 5 -> J(1) K(2) L(3); 6 -> M(1) N(2) O(3); 7 -> P(1) Q(2) R(3) S(4); 8 -> T(1) U(2) V(3); 9 -> W(1) X(2) Y(3) Z(4); 0 -> space (1 press). Print the concatenation of every character's keypress digits, in order, with no separators.",
  "1 <= |s| <= 1000, s consists of uppercase English letters and spaces",
  "Input:\nSKY\nOutput:\n777755999",
  ["Build a fixed lookup table mapping every letter (and the space character) to its exact digit-press string once, then just concatenate lookups for each character of s.", "The letters S and Z are the only ones needing 4 presses (they're the fourth letter of keys 7 and 9); every other letter needs 1 to 3.", "Space is a real, always-present character in this mapping (mapping to a single '0') - it is never skipped or dropped."],
  [{ input: "SKY", expectedOutput: "777755999", explanation: "S=7777, K=55, Y=999." },
   { input: "AB", expectedOutput: "222", explanation: "A=2, B=22." }],
  [{ input: "GEEKSFORGEEKS", expectedOutput: "4333355777733366677743333557777", points: 1 },
   { input: "HELLO WORLD", expectedOutput: "4433555555666096667775553", points: 1 },
   { input: "SOS", expectedOutput: "77776667777", points: 1 }]),

p("Number of Customers Who Could Not Get a Computer", "Strings", "Medium", ["String", "Simulation"],
  "A shop has N computers. A sequence of events is given as a string s in which every character (each representing one customer) appears exactly twice: a customer's first occurrence in s is their arrival, and their second occurrence is their departure, with all events happening strictly in the left-to-right order of s. On arrival, a customer is given a free computer if one is available (and keeps it until their departure); if none is available, they leave immediately and never use a computer at all. Print the total number of customers who never got a computer.",
  "1 <= N <= 10^5, 2 <= |s| <= 2*10^5, every character of s occurs exactly twice",
  "Input:\n1\nABAB\nOutput:\n1",
  ["Keep a running count of currently-occupied computers and, per customer, remember whether they actually got one on arrival.", "On a first occurrence (arrival): assign a computer and increment the occupied count if it's below N; otherwise this customer is rejected.", "On a second occurrence (departure): free a computer (decrement occupied) only if this exact customer had been assigned one - a rejected customer's 'departure' changes nothing."],
  [{ input: "1\nABAB", expectedOutput: "1", explanation: "A takes the 1 computer; B is rejected on arrival; B's later 'departure' frees nothing." },
   { input: "3\nAABBCC", expectedOutput: "0", explanation: "3 computers are enough for every customer." }],
  [{ input: "2\nABBAJJKZKZ", expectedOutput: "0", points: 1 },
   { input: "2\nGACCBDDBAGEE", expectedOutput: "3", points: 1 },
   { input: "1\nABCABC", expectedOutput: "2", points: 1 }]),

p("Transform One String to Another Using Minimum Number of Given Operation", "Strings", "Hard", ["String", "Two Pointers"],
  "You're given two strings A and B. The only operation allowed is: remove any single character from A and reinsert it at the very front of A. Find the minimum number of such operations needed to make A equal to B. If A and B are not anagrams of each other (don't contain exactly the same multiset of characters), no number of operations can ever make them equal - print -1.",
  "1 <= |A|, |B| <= 2000",
  "Input:\nEACBD\nEABCD\nOutput:\n3",
  ["If A and B aren't anagrams, the answer is immediately -1.", "Moving k characters to the front (in some order you choose) leaves the other |A|-k characters behind in their original relative order - so those |A|-k characters, as they sit in A, must spell out exactly the corresponding suffix of B.", "Check, for k = 0, 1, 2, ... in increasing order, whether B's suffix of length |A|-k is a subsequence of A; the first k for which this holds is the answer."],
  [{ input: "EACBD\nEABCD", expectedOutput: "3", explanation: "" },
   { input: "ABC\nABC", expectedOutput: "0", explanation: "Already equal." }],
  [{ input: "ABC\nCBA", expectedOutput: "2", points: 1 },
   { input: "AABB\nBABA", expectedOutput: "3", points: 1 },
   { input: "XYZ\nZZZ", expectedOutput: "-1", points: 1 }]),

p("Check if Two Strings Are Isomorphic", "Strings", "Easy", ["String", "Hashing"],
  "Given two strings s1 and s2, print 'Yes' if they are isomorphic - meaning there's a one-to-one correspondence between the distinct characters of s1 and the distinct characters of s2 such that replacing every occurrence of each character of s1 with its corresponding character of s2 throughout reproduces s2 exactly (and no two different characters of s1 ever map to the same character of s2). Otherwise, or if the two strings have different lengths, print 'No'.",
  "1 <= |s1|, |s2| <= 10^5",
  "Input:\negg\nadd\nOutput:\nYes",
  ["If the lengths differ, the answer is immediately 'No'.", "Maintain two hashmaps - one from s1's characters to s2's, one from s2's back to s1's - and check both stay consistent at every position.", "A mapping conflict in either direction (the same source character mapping to two different targets, or two different source characters mapping to the same target) immediately means 'No'."],
  [{ input: "egg\nadd", expectedOutput: "Yes", explanation: "" },
   { input: "foo\nbar", expectedOutput: "No", explanation: "'o' would need to map to both 'a' and 'r'." }],
  [{ input: "paper\ntitle", expectedOutput: "Yes", points: 1 },
   { input: "ab\naa", expectedOutput: "No", points: 1 },
   { input: "badc\nbaba", expectedOutput: "No", points: 1 }]),

p("Print All Sentences from a List of Word Lists", "Strings", "Medium", ["String", "Recursion", "Backtracking"],
  "You're given M lists of words, one list per position in a sentence. Print every sentence that can be formed by picking exactly one word from each list, in order. Generate them by trying the first list's words in the given order, and for each choice, recursively trying the next list's words in given order (standard nested left-to-right enumeration). Print each sentence as its chosen words space-separated, and separate different sentences with ' | ', in the order generated. Input: the first line is M; each of the next M lines starts with that list's word count followed by its words, space-separated.",
  "1 <= M <= 6, 1 <= words per list <= 6, 1 <= |each word| <= 20",
  "Input:\n3\n2 you we\n2 have are\n3 sleep eat drink\nOutput:\nyou have sleep | you have eat | you have drink | you are sleep | you are eat | you are drink | we have sleep | we have eat | we have drink | we are sleep | we are eat | we are drink",
  ["This is exactly Print All Permutations of a String's kind of backtracking, except each 'position' now has its own distinct set of choices instead of sharing one pool of characters.", "Recurse position by position: at each list, try every word in the order given, recursing into the remaining lists before moving to the next word.", "The total number of sentences is the product of each list's word count - make sure your recursion visits all of them in the specified nested order."],
  [{ input: "3\n2 you we\n2 have are\n3 sleep eat drink", expectedOutput: "you have sleep | you have eat | you have drink | you are sleep | you are eat | you are drink | we have sleep | we have eat | we have drink | we are sleep | we are eat | we are drink", explanation: "" },
   { input: "2\n2 a b\n1 x", expectedOutput: "a x | b x", explanation: "" }],
  [{ input: "1\n3 red green blue", expectedOutput: "red | green | blue", points: 1 },
   { input: "2\n1 only\n2 x y", expectedOutput: "only x | only y", points: 1 },
   { input: "3\n1 a\n1 b\n1 c", expectedOutput: "a b c", points: 1 }]),

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
console.log(`STRING topic (part 2): created ${created} problem(s), skipped ${skipped} already-existing.`);
