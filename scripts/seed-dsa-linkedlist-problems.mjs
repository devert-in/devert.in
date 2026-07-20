import admin from "firebase-admin";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(join(__dirname, "service-account.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// DSA-450-sheet ingestion, LINKEDLIST topic. Rows that need real node-identity
// (delete-given-node-only, clone-with-random-pointer, intersection point of
// two lists) don't have a clean, unambiguous stdin/stdout serialization as an
// array and are skipped; everything else is represented as "n then n values"
// (plus a loop-back position where relevant), matching how online judges
// conventionally test linked-list problems without a real pointer structure.

const REWARD = { Easy: [30, 10], Medium: [50, 20], Hard: [80, 30] };
function p(title, category, difficulty, tags, statement, constraints, examplesText, hints, sampleTests, hiddenTests) {
  const [xpReward, coinReward] = REWARD[difficulty];
  return { title, category, difficulty, tags, statement, constraints, examplesText, hints, xpReward, coinReward, sampleTests, hiddenTests };
}

const PROBLEMS = [

p("Reverse a Linked List", "Linked List", "Easy", ["Linked List"],
  "A singly linked list is given as its n node values in order. Print the values in reverse order.",
  "1 <= n <= 10^5",
  "Input:\n5\n1 2 3 4 5\nOutput:\n5 4 3 2 1",
  ["Walk the list once, relinking each node's next pointer to point to the previous node instead of the next.", "Track three pointers as you go: previous, current, and next."],
  [{ input: "5\n1 2 3 4 5", expectedOutput: "5 4 3 2 1", explanation: "" },
   { input: "1\n7", expectedOutput: "7", explanation: "" }],
  [{ input: "2\n1 2", expectedOutput: "2 1", points: 1 },
   { input: "3\n5 5 5", expectedOutput: "5 5 5", points: 1 },
   { input: "4\n-1 -2 -3 -4", expectedOutput: "-4 -3 -2 -1", points: 1 }]),

p("Reverse a Linked List in Groups of Size K", "Linked List", "Medium", ["Linked List"],
  "A singly linked list is given as n node values. Reverse every consecutive group of k nodes independently and print the resulting sequence. If the final group has fewer than k nodes, reverse that group too.",
  "1 <= k <= n <= 10^5",
  "Input:\n8\n1 2 3 4 5 6 7 8\n3\nOutput:\n3 2 1 6 5 4 8 7",
  ["Process the list k nodes at a time, reversing the links within each chunk before moving to the next chunk.", "Don't forget to reverse a trailing partial group too."],
  [{ input: "8\n1 2 3 4 5 6 7 8\n3", expectedOutput: "3 2 1 6 5 4 8 7", explanation: "" },
   { input: "5\n1 2 3 4 5\n2", expectedOutput: "2 1 4 3 5", explanation: "" }],
  [{ input: "1\n9\n1", expectedOutput: "9", points: 1 },
   { input: "4\n1 2 3 4\n4", expectedOutput: "4 3 2 1", points: 1 },
   { input: "6\n1 2 3 4 5 6\n1", expectedOutput: "1 2 3 4 5 6", points: 1 }]),

p("Detect a Loop in a Linked List", "Linked List", "Medium", ["Linked List"],
  "A singly linked list has n node values. Its last node's next pointer is connected back to the node at 0-indexed position pos (or there is no loop if pos is -1). Print 'Yes' if the list has a loop, otherwise 'No'.",
  "1 <= n <= 10^5, -1 <= pos < n",
  "Input:\n4\n1 2 3 4\n1\nOutput:\nYes",
  ["Floyd's cycle detection: move a slow pointer one step and a fast pointer two steps at a time - they meet if and only if there's a loop.", "pos = -1 simply means the last node's next pointer is null."],
  [{ input: "4\n1 2 3 4\n1", expectedOutput: "Yes", explanation: "" },
   { input: "3\n1 2 3\n-1", expectedOutput: "No", explanation: "" }],
  [{ input: "1\n1\n0", expectedOutput: "Yes", points: 1 },
   { input: "1\n1\n-1", expectedOutput: "No", points: 1 },
   { input: "5\n1 2 3 4 5\n4", expectedOutput: "Yes", points: 1 }]),

p("Find the Length of the Loop in a Linked List", "Linked List", "Medium", ["Linked List"],
  "A singly linked list has n node values. Its last node's next pointer is connected back to the node at 0-indexed position pos (or there is no loop if pos is -1). Print the number of nodes in the loop, or 0 if there is no loop.",
  "1 <= n <= 10^5, -1 <= pos < n",
  "Input:\n4\n1 2 3 4\n1\nOutput:\n3",
  ["First detect the loop with Floyd's algorithm (slow/fast pointers), then from the meeting point, keep moving one pointer around the loop, counting steps, until it returns to the meeting point.", "pos = -1 means the loop length is simply 0."],
  [{ input: "4\n1 2 3 4\n1", expectedOutput: "3", explanation: "" },
   { input: "3\n1 2 3\n-1", expectedOutput: "0", explanation: "" }],
  [{ input: "1\n1\n0", expectedOutput: "1", points: 1 },
   { input: "5\n1 2 3 4 5\n4", expectedOutput: "1", points: 1 },
   { input: "6\n1 2 3 4 5 6\n3", expectedOutput: "3", points: 1 }]),

p("Find the Middle of a Linked List", "Linked List", "Easy", ["Linked List"],
  "A singly linked list has n node values. Print the value of its middle node. If n is even, print the value at 0-indexed position n/2 (the second of the two middle nodes).",
  "1 <= n <= 10^5",
  "Input:\n5\n1 2 3 4 5\nOutput:\n3",
  ["The classic technique: move a slow pointer one step and a fast pointer two steps; when fast reaches the end, slow is at the middle.", "For an even-length list this lands on the second middle node, matching the required convention here."],
  [{ input: "5\n1 2 3 4 5", expectedOutput: "3", explanation: "" },
   { input: "6\n1 2 3 4 5 6", expectedOutput: "4", explanation: "" }],
  [{ input: "1\n9", expectedOutput: "9", points: 1 },
   { input: "2\n1 2", expectedOutput: "2", points: 1 },
   { input: "7\n10 20 30 40 50 60 70", expectedOutput: "40", points: 1 }]),

p("Merge Two Sorted Linked Lists", "Linked List", "Easy", ["Linked List"],
  "Given two sorted singly linked lists (as n1 values, then n2 values), merge them into a single sorted list and print it.",
  "1 <= n1, n2 <= 10^5",
  "Input:\n3\n1 3 5\n3\n2 4 6\nOutput:\n1 2 3 4 5 6",
  ["Walk both lists with two pointers, at each step taking the smaller front value and advancing that pointer.", "Once one list is exhausted, append the rest of the other list unchanged."],
  [{ input: "3\n1 3 5\n3\n2 4 6", expectedOutput: "1 2 3 4 5 6", explanation: "" },
   { input: "1\n5\n1\n5", expectedOutput: "5 5", explanation: "" }],
  [{ input: "1\n1\n1\n2", expectedOutput: "1 2", points: 1 },
   { input: "3\n1 1 1\n2\n1 1", expectedOutput: "1 1 1 1 1", points: 1 },
   { input: "4\n1 3 5 7\n4\n2 4 6 8", expectedOutput: "1 2 3 4 5 6 7 8", points: 1 }]),

p("Find the Nth Node From the End of a Linked List", "Linked List", "Easy", ["Linked List"],
  "A singly linked list has n node values. Given k, print the value of the kth node counting from the end (k=1 means the last node). If k is greater than n, print -1.",
  "1 <= n <= 10^5, 1 <= k <= 10^5",
  "Input:\n5\n1 2 3 4 5\n2\nOutput:\n4",
  ["Use two pointers: advance one pointer k steps ahead first, then move both together - when the lead pointer reaches the end, the trailing pointer is at the target node.", "This finds the answer in a single pass without needing to know the list's length in advance."],
  [{ input: "5\n1 2 3 4 5\n2", expectedOutput: "4", explanation: "" },
   { input: "5\n1 2 3 4 5\n10", expectedOutput: "-1", explanation: "" }],
  [{ input: "1\n7\n1", expectedOutput: "7", points: 1 },
   { input: "3\n1 2 3\n3", expectedOutput: "1", points: 1 },
   { input: "3\n1 2 3\n4", expectedOutput: "-1", points: 1 }]),

p("Check if a Linked List Is a Palindrome", "Linked List", "Medium", ["Linked List", "Two Pointer"],
  "A singly linked list has n node values. Print 'Yes' if the sequence of values reads the same forwards and backwards, otherwise print 'No'.",
  "1 <= n <= 10^5",
  "Input:\n5\n1 2 3 2 1\nOutput:\nYes",
  ["Find the middle of the list, reverse the second half, then compare it against the first half node by node.", "A single-node list is always a palindrome."],
  [{ input: "5\n1 2 3 2 1", expectedOutput: "Yes", explanation: "" },
   { input: "4\n1 2 3 1", expectedOutput: "No", explanation: "" }],
  [{ input: "1\n5", expectedOutput: "Yes", points: 1 },
   { input: "2\n1 1", expectedOutput: "Yes", points: 1 },
   { input: "2\n1 2", expectedOutput: "No", points: 1 }]),

p("Rotate a Linked List by N Nodes", "Linked List", "Medium", ["Linked List"],
  "A singly linked list has values given in order. Rotate it left by n nodes (the first n nodes move, in order, to the end of the list) and print the result.",
  "1 <= list length <= 10^5, 0 <= n <= list length",
  "Input:\n7\n1 2 3 4 5 6 7\n3\nOutput:\n4 5 6 7 1 2 3",
  ["Find the (n+1)th node - that becomes the new head. Connect the old tail's next to the old head, and cut the link after the nth node.", "n equal to the list length (or 0) leaves the list unchanged."],
  [{ input: "7\n1 2 3 4 5 6 7\n3", expectedOutput: "4 5 6 7 1 2 3", explanation: "" },
   { input: "5\n1 2 3 4 5\n2", expectedOutput: "3 4 5 1 2", explanation: "" }],
  [{ input: "1\n1\n0", expectedOutput: "1", points: 1 },
   { input: "3\n1 2 3\n3", expectedOutput: "1 2 3", points: 1 },
   { input: "2\n1 2\n1", expectedOutput: "2 1", points: 1 }]),

p("Segregate 0s, 1s, and 2s in a Linked List", "Linked List", "Medium", ["Linked List"],
  "A singly linked list contains only the values 0, 1, and 2. Rearrange it so every 0 comes before every 1, which comes before every 2, preserving the original relative order of nodes within each value group. Print the result.",
  "1 <= n <= 10^5",
  "Input:\n6\n1 2 0 2 1 0\nOutput:\n0 0 1 1 2 2",
  ["Build three separate small lists (for 0s, 1s, 2s) in a single pass, appending each node to the matching list as you encounter it.", "Concatenate the three lists (0s, then 1s, then 2s) at the end."],
  [{ input: "6\n1 2 0 2 1 0", expectedOutput: "0 0 1 1 2 2", explanation: "" },
   { input: "3\n0 1 2", expectedOutput: "0 1 2", explanation: "" }],
  [{ input: "3\n2 1 0", expectedOutput: "0 1 2", points: 1 },
   { input: "3\n2 2 2", expectedOutput: "2 2 2", points: 1 },
   { input: "6\n0 0 1 1 2 2", expectedOutput: "0 0 1 1 2 2", points: 1 }]),

p("Segregate Even and Odd Nodes in a Linked List", "Linked List", "Medium", ["Linked List"],
  "A singly linked list contains n integer values. Rearrange it so all even-valued nodes come before all odd-valued nodes, preserving the original relative order within each group. Print the result.",
  "1 <= n <= 10^5",
  "Input:\n6\n1 2 3 4 5 6\nOutput:\n2 4 6 1 3 5",
  ["Build two chains as you walk the list once: one collecting even values, one collecting odd values, in the order encountered.", "Attach the odd chain after the even chain to get the final list."],
  [{ input: "6\n1 2 3 4 5 6", expectedOutput: "2 4 6 1 3 5", explanation: "" },
   { input: "3\n2 4 6", expectedOutput: "2 4 6", explanation: "" }],
  [{ input: "3\n1 3 5", expectedOutput: "1 3 5", points: 1 },
   { input: "1\n1", expectedOutput: "1", points: 1 },
   { input: "4\n4 1 3 2", expectedOutput: "4 2 1 3", points: 1 }]),

p("Delete Nodes Which Have a Greater Value on the Right Side", "Linked List", "Medium", ["Linked List", "Stack"],
  "A singly linked list contains n integer values. Delete every node that has some node with a strictly greater value anywhere to its right. Print the values that remain, in their original order.",
  "1 <= n <= 10^5",
  "Input:\n8\n12 15 10 11 5 6 2 3\nOutput:\n15 11 6 3",
  ["Scan from right to left, keeping the maximum value seen so far. A node survives exactly when its value is greater than or equal to that running maximum.", "This is equivalent to keeping only the nodes that form a non-increasing 'suffix maximum' sequence."],
  [{ input: "8\n12 15 10 11 5 6 2 3", expectedOutput: "15 11 6 3", explanation: "" },
   { input: "3\n10 20 30", expectedOutput: "30", explanation: "" }],
  [{ input: "1\n5", expectedOutput: "5", points: 1 },
   { input: "3\n3 2 1", expectedOutput: "3 2 1", points: 1 },
   { input: "3\n1 2 3", expectedOutput: "3", points: 1 }]),

p("Merge K Sorted Linked Lists", "Linked List", "Medium", ["Linked List", "Heap"],
  "Given k sorted singly linked lists (each given as its length followed by its sorted values), merge all of them into a single sorted list and print it.",
  "1 <= k <= 100, 1 <= each list's length <= 1000",
  "Input:\n3\n3\n1 4 5\n3\n1 3 4\n2\n2 6\nOutput:\n1 1 2 3 4 4 5 6",
  ["A min-heap holding the current front node of each list lets you always extract the next-smallest value in O(log k) per step.", "Repeatedly pop the smallest, output it, and push that list's next node (if any) back onto the heap."],
  [{ input: "3\n3\n1 4 5\n3\n1 3 4\n2\n2 6", expectedOutput: "1 1 2 3 4 4 5 6", explanation: "" },
   { input: "2\n1\n1\n1\n0", expectedOutput: "0 1", explanation: "" }],
  [{ input: "1\n3\n5 3 1", expectedOutput: "1 3 5", explanation: "Values are combined and fully sorted regardless of each list's own order.", points: 1 },
   { input: "2\n1\n2\n1\n1", expectedOutput: "1 2", points: 1 },
   { input: "3\n2\n1 2\n2\n3 4\n2\n5 6", expectedOutput: "1 2 3 4 5 6", points: 1 }]),

p("Add Two Numbers Represented by Linked Lists", "Linked List", "Medium", ["Linked List", "Math"],
  "Two non-negative integers are each represented as a linked list of digits, most-significant digit first. Given both lists, print the digits of their sum, most-significant digit first (no leading zeros, unless the sum itself is 0).",
  "1 <= number of digits in each list <= 10^4",
  "Input:\n3\n1 2 3\n3\n4 5 6\nOutput:\n5 7 9",
  ["Reverse both digit sequences conceptually (or use a stack) so you can add from the least-significant digit, carrying over just like manual addition.", "Reverse the resulting digit sequence back before printing, and drop any leading zero unless the whole result is zero."],
  [{ input: "3\n1 2 3\n3\n4 5 6", expectedOutput: "5 7 9", explanation: "" },
   { input: "2\n9 9\n1\n1", expectedOutput: "1 0 0", explanation: "" }],
  [{ input: "1\n0\n1\n0", expectedOutput: "0", points: 1 },
   { input: "1\n5\n1\n5", expectedOutput: "1 0", points: 1 },
   { input: "3\n1 0 0\n2\n9 9", expectedOutput: "1 9 9", points: 1 }]),

p("Remove Duplicates From a Sorted Linked List", "Linked List", "Easy", ["Linked List"],
  "A sorted singly linked list has n values, possibly with consecutive duplicates. Remove duplicate values so each distinct value appears only once, and print the result.",
  "1 <= n <= 10^5",
  "Input:\n5\n1 1 2 3 3\nOutput:\n1 2 3",
  ["Since the list is sorted, any duplicate of a value is guaranteed to be immediately adjacent to it.", "Walk the list once, comparing each node to the next, and skip over (delete) any node that repeats the current value."],
  [{ input: "5\n1 1 2 3 3", expectedOutput: "1 2 3", explanation: "" },
   { input: "4\n1 1 1 1", expectedOutput: "1", explanation: "" }],
  [{ input: "1\n5", expectedOutput: "5", points: 1 },
   { input: "3\n1 2 3", expectedOutput: "1 2 3", points: 1 },
   { input: "6\n-2 -2 -1 0 0 0", expectedOutput: "-2 -1 0", points: 1 }]),

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
console.log(`LINKEDLIST topic: created ${created} problem(s), skipped ${skipped} already-existing.`);
