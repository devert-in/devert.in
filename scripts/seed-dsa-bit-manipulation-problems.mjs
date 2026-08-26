import admin from "firebase-admin";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(join(__dirname, "service-account.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// DSA-450-sheet ingestion, BIT MANIPULATION topic - the 15th and final topic
// of the DSA 450 sheet ingestion (see DSA_Hyperlink_Master_Index.pdf). The
// "power set via bitmasking" row is skipped since it's the same underlying
// exercise as the already-seeded "print all distinct subsequences" problem.

const REWARD = { Easy: [30, 10], Medium: [50, 20], Hard: [80, 30] };
function p(title, category, difficulty, tags, statement, constraints, examplesText, hints, sampleTests, hiddenTests) {
  const [xpReward, coinReward] = REWARD[difficulty];
  return { title, category, difficulty, tags, statement, constraints, examplesText, hints, xpReward, coinReward, sampleTests, hiddenTests };
}

const PROBLEMS = [

p("Count Set Bits in an Integer", "Bit Manipulation", "Easy", ["Bit Manipulation"],
  "Given a non-negative integer n, count the number of 1 bits in its binary representation.",
  "0 <= n <= 10^9",
  "Input:\n9\nOutput:\n2",
  ["Repeatedly check the lowest bit (n & 1) and shift right, or use the trick n & (n-1) which clears the lowest set bit each time - counting how many times you can do that.", "Some languages expose a built-in popcount function, but implementing it yourself is the point of this exercise."],
  [{ input: "9", expectedOutput: "2", explanation: "9 is 1001 in binary." },
   { input: "15", expectedOutput: "4", explanation: "" }],
  [{ input: "0", expectedOutput: "0", points: 1 },
   { input: "1", expectedOutput: "1", points: 1 },
   { input: "1023", expectedOutput: "10", points: 1 }]),

p("Find the Two Non-Repeating Elements in an Array", "Bit Manipulation", "Medium", ["Bit Manipulation", "Array"],
  "Given an array where every element appears exactly twice except for two elements that each appear exactly once, find those two elements. Print them in ascending order, space-separated.",
  "1 <= n <= 10^5",
  "Input:\n8\n2 3 7 9 11 2 3 11\nOutput:\n7 9",
  ["XOR every element together - the result is the XOR of just the two unique numbers (every twice-repeated value cancels itself out).", "Pick any set bit in that XOR result to split all numbers into two groups (those with that bit set, and those without) - XOR-ing each group separately isolates one unique number per group."],
  [{ input: "8\n2 3 7 9 11 2 3 11", expectedOutput: "7 9", explanation: "" },
   { input: "4\n1 2 1 3", expectedOutput: "2 3", explanation: "" }],
  [{ input: "2\n5 6", expectedOutput: "5 6", points: 1 },
   { input: "4\n4 4 5 6", expectedOutput: "5 6", points: 1 },
   { input: "6\n10 20 10 30 30 40", expectedOutput: "20 40", points: 1 }]),

p("Count Bits to Flip to Convert A to B", "Bit Manipulation", "Easy", ["Bit Manipulation"],
  "Given two non-negative integers a and b, find the minimum number of bits that need to be flipped to convert a into b.",
  "0 <= a, b <= 10^9",
  "Input:\n10\n20\nOutput:\n4",
  ["The bits that differ between a and b are exactly the set bits of (a XOR b).", "So the answer is simply the number of set bits in a XOR b."],
  [{ input: "10\n20", expectedOutput: "4", explanation: "" },
   { input: "7\n10", expectedOutput: "3", explanation: "" }],
  [{ input: "0\n0", expectedOutput: "0", points: 1 },
   { input: "1\n0", expectedOutput: "1", points: 1 },
   { input: "255\n0", expectedOutput: "8", points: 1 }]),

p("Count Total Set Bits From 1 to N", "Bit Manipulation", "Medium", ["Bit Manipulation", "Math"],
  "Given a non-negative integer n, find the total number of set bits across the binary representations of every integer from 1 to n (inclusive).",
  "0 <= n <= 10^9",
  "Input:\n3\nOutput:\n4",
  ["A direct loop counting bits for every number up to n works for small n, but is too slow for large n.", "For an efficient solution, use the pattern that among numbers 0 to 2^k - 1, exactly half have each bit position set, and build up the answer bit-length by bit-length."],
  [{ input: "3", expectedOutput: "4", explanation: "1(1) + 2(1) + 3(2) = 4." },
   { input: "6", expectedOutput: "9", explanation: "" }],
  [{ input: "0", expectedOutput: "0", points: 1 },
   { input: "1", expectedOutput: "1", points: 1 },
   { input: "7", expectedOutput: "12", points: 1 }]),

p("Check if a Number Is a Power of 2", "Bit Manipulation", "Easy", ["Bit Manipulation"],
  "Given an integer n, print 'Yes' if it is a power of 2 (1, 2, 4, 8, ...), otherwise print 'No'. 0 is not a power of 2.",
  "0 <= n <= 10^9",
  "Input:\n16\nOutput:\nYes",
  ["A power of 2 has exactly one set bit in its binary representation.", "The expression n & (n-1) clears the lowest set bit - for a power of 2, that leaves exactly 0 (but be careful to special-case n = 0, which isn't a power of 2 despite n & (n-1) also being 0)."],
  [{ input: "16", expectedOutput: "Yes", explanation: "" },
   { input: "18", expectedOutput: "No", explanation: "" }],
  [{ input: "1", expectedOutput: "Yes", points: 1 },
   { input: "0", expectedOutput: "No", points: 1 },
   { input: "1024", expectedOutput: "Yes", points: 1 }]),

p("Find the Position of the Only Set Bit", "Bit Manipulation", "Easy", ["Bit Manipulation"],
  "Given an integer n that is guaranteed to be a power of 2 (so it has exactly one set bit), find the 1-indexed position of that bit, counting from the least significant bit as position 1. If n does not have exactly one set bit, print -1.",
  "0 <= n <= 10^9",
  "Input:\n16\nOutput:\n5",
  ["First verify n has exactly one set bit (n != 0 and n & (n-1) == 0) - otherwise the answer is -1.", "Then repeatedly right-shift n until it becomes 1, counting the shifts, to find the bit's position."],
  [{ input: "16", expectedOutput: "5", explanation: "16 = 10000, the set bit is at position 5." },
   { input: "1", expectedOutput: "1", explanation: "" }],
  [{ input: "2", expectedOutput: "2", points: 1 },
   { input: "0", expectedOutput: "-1", points: 1 },
   { input: "17", expectedOutput: "-1", points: 1 }]),

p("Divide Two Integers Without Using *, /, or %", "Bit Manipulation", "Medium", ["Bit Manipulation"],
  "Given two integers, dividend and divisor, compute their integer quotient (truncated toward zero, the way most languages' integer division works) without using the *, /, or % operators.",
  "-2*10^9 <= dividend, divisor <= 2*10^9, divisor != 0",
  "Input:\n10\n3\nOutput:\n3",
  ["Work with absolute values and track the sign of the result separately.", "Subtract the largest possible shifted multiple of the divisor (divisor doubled repeatedly via left-shift) at each step, similar to how long division works in binary."],
  [{ input: "10\n3", expectedOutput: "3", explanation: "" },
   { input: "7\n-3", expectedOutput: "-2", explanation: "" }],
  [{ input: "0\n5", expectedOutput: "0", points: 1 },
   { input: "-10\n3", expectedOutput: "-3", explanation: "Truncated toward zero, not floored.", points: 1 },
   { input: "100\n1", expectedOutput: "100", points: 1 }]),

p("Calculate the Square of a Number Without Using *, /, or pow()", "Bit Manipulation", "Easy", ["Bit Manipulation"],
  "Given an integer n (which may be negative), compute n squared without using the *, /, or built-in power operators.",
  "-10^4 <= n <= 10^4",
  "Input:\n5\nOutput:\n25",
  ["n squared can be built entirely from addition and bit shifts: express n as a sum of its set bits' place values, and accumulate n shifted by each of those amounts.", "Handle the sign separately - a square is always non-negative, so work with the absolute value of n."],
  [{ input: "5", expectedOutput: "25", explanation: "" },
   { input: "0", expectedOutput: "0", explanation: "" }],
  [{ input: "1", expectedOutput: "1", points: 1 },
   { input: "-4", expectedOutput: "16", points: 1 },
   { input: "12", expectedOutput: "144", points: 1 }]),

p("Find XOR of All Numbers From L to R", "Bit Manipulation", "Medium", ["Bit Manipulation", "Math"],
  "Given two integers l and r, find the XOR of every integer from l to r, inclusive.",
  "0 <= l <= r <= 10^9",
  "Input:\n4\n8\nOutput:\n8",
  ["Define f(n) = XOR of every integer from 1 to n; then XOR(l..r) = f(r) XOR f(l-1) (with f(0) = 0).", "f(n) follows a repeating pattern based on n mod 4: it equals n, 1, n+1, or 0 depending on the remainder - this avoids looping over the whole range."],
  [{ input: "4\n8", expectedOutput: "8", explanation: "" },
   { input: "1\n5", expectedOutput: "1", explanation: "" }],
  [{ input: "1\n1", expectedOutput: "1", points: 1 },
   { input: "5\n5", expectedOutput: "5", points: 1 },
   { input: "10\n10", expectedOutput: "10", points: 1 }]),

p("Find the Element That Appears Once (All Others Appear Exactly Three Times)", "Bit Manipulation", "Medium", ["Bit Manipulation"],
  "Given an array where every element appears exactly three times except for one element that appears exactly once, find that element.",
  "1 <= n <= 10^5",
  "Input:\n4\n2 2 3 2\nOutput:\n3",
  ["For each of the 32 bit positions, count how many numbers in the array have that bit set - if a value appears three times each of its bits gets counted a multiple of 3, so a bit-count not divisible by 3 must come from the unique element.", "Build the answer bit by bit from those counts modulo 3."],
  [{ input: "4\n2 2 3 2", expectedOutput: "3", explanation: "" },
   { input: "7\n0 1 0 1 0 1 99", expectedOutput: "99", explanation: "" }],
  [{ input: "1\n5", expectedOutput: "5", points: 1 },
   { input: "4\n7 7 7 8", expectedOutput: "8", points: 1 },
   { input: "4\n-1 -1 -1 -2", expectedOutput: "-2", points: 1 }]),

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
console.log(`BIT MANIPULATION topic: created ${created} problem(s), skipped ${skipped} already-existing.`);
