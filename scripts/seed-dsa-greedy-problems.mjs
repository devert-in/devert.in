import admin from "firebase-admin";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(join(__dirname, "service-account.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// DSA-450-sheet ingestion, GREEDY topic. Rows with genuinely ambiguous output
// shape (Huffman coding's actual bit-string depends on tie-breaking choices
// in the algorithm, cash-flow minimization needs a graph model) are skipped
// in favor of well-defined ones with a single correct numeric/string answer.

const REWARD = { Easy: [30, 10], Medium: [50, 20], Hard: [80, 30] };
function p(title, category, difficulty, tags, statement, constraints, examplesText, hints, sampleTests, hiddenTests) {
  const [xpReward, coinReward] = REWARD[difficulty];
  return { title, category, difficulty, tags, statement, constraints, examplesText, hints, xpReward, coinReward, sampleTests, hiddenTests };
}

const PROBLEMS = [

p("Activity Selection Problem", "Greedy", "Medium", ["Greedy", "Sorting"],
  "Given n activities with their start and end times, find the maximum number of activities a single person can perform, assuming a person can only work on one activity at a time (an activity that starts exactly when another ends is allowed).",
  "1 <= n <= 10^5",
  "Input:\n6\n1 3 0 5 8 5\n2 4 6 7 9 9\nOutput:\n4",
  ["Sort activities by their end time.", "Greedily pick the next activity whose start time is not before the end time of the last picked activity."],
  [{ input: "6\n1 3 0 5 8 5\n2 4 6 7 9 9", expectedOutput: "4", explanation: "" },
   { input: "3\n10 12 20\n20 25 30", expectedOutput: "2", explanation: "" }],
  [{ input: "1\n1\n2", expectedOutput: "1", points: 1 },
   { input: "2\n1 2\n2 3", expectedOutput: "2", points: 1 },
   { input: "3\n1 1 1\n5 5 5", expectedOutput: "1", points: 1 }]),

p("Job Sequencing Problem", "Greedy", "Medium", ["Greedy", "Sorting"],
  "Given n jobs, each with a deadline and a profit, and each job takes exactly one unit of time to complete (only one job can run per time unit, and a job must finish by its deadline to earn its profit), find the maximum total profit achievable. Jobs are given as n (deadline, profit) pairs.",
  "1 <= n <= 10^5, 1 <= deadline <= n",
  "Input:\n5\n2 100\n1 19\n2 27\n1 25\n3 15\nOutput:\n127",
  ["Sort jobs by profit in descending order.", "For each job, greedily try to schedule it in the latest available free time slot at or before its deadline - this leaves earlier slots open for jobs with tighter deadlines."],
  [{ input: "5\n2 100\n1 19\n2 27\n1 25\n3 15", expectedOutput: "127", explanation: "" },
   { input: "1\n1 5", expectedOutput: "5", explanation: "" }],
  [{ input: "2\n1 5\n1 10", expectedOutput: "10", points: 1 },
   { input: "2\n2 5\n2 10", expectedOutput: "15", points: 1 },
   { input: "3\n1 20\n2 15\n2 10", expectedOutput: "35", points: 1 }]),

p("Fractional Knapsack Problem", "Greedy", "Medium", ["Greedy", "Sorting"],
  "Given n items, each with a weight and a value, and a knapsack of capacity W, find the maximum total value obtainable, where any fraction of an item may be taken. Print the answer with exactly one decimal place.",
  "1 <= n <= 10^5, items are given as n (weight, value) pairs",
  "Input:\n3\n10 60\n20 100\n30 120\n50\nOutput:\n240.0",
  ["Sort items by value-per-unit-weight (value / weight) in descending order.", "Take as much as possible of the best ratio item first, then move to the next-best, taking a fraction of the last item that doesn't fully fit."],
  [{ input: "3\n10 60\n20 100\n30 120\n50", expectedOutput: "240.0", explanation: "" },
   { input: "1\n10 10\n5", expectedOutput: "5.0", explanation: "" }],
  [{ input: "1\n5 10\n10", expectedOutput: "10.0", points: 1 },
   { input: "2\n10 20\n10 30\n15", expectedOutput: "40.0", points: 1 },
   { input: "3\n2 10\n3 5\n5 15\n10", expectedOutput: "30.0", points: 1 }]),

p("Minimum Number of Platforms Required for a Railway Station", "Greedy", "Medium", ["Greedy", "Sorting"],
  "Given the arrival and departure times of n trains at a railway station, find the minimum number of platforms needed so that no train has to wait.",
  "1 <= n <= 10^5",
  "Input:\n6\n900 940 950 1100 1500 1800\n910 1200 1120 1130 1900 2000\nOutput:\n3",
  ["Sort the arrival times and departure times independently.", "Walk through both sorted lists with two pointers: an incoming arrival before the next departure needs a new platform, and a departure frees one up."],
  [{ input: "6\n900 940 950 1100 1500 1800\n910 1200 1120 1130 1900 2000", expectedOutput: "3", explanation: "" },
   { input: "3\n900 1100 1235\n1000 1200 1240", expectedOutput: "1", explanation: "" }],
  [{ input: "1\n900\n910", expectedOutput: "1", points: 1 },
   { input: "2\n900 900\n910 910", expectedOutput: "2", points: 1 },
   { input: "4\n100 140 150 200\n110 300 220 250", expectedOutput: "3", points: 1 }]),

p("Minimum and Maximum Amount to Buy All N Candies", "Greedy", "Medium", ["Greedy", "Sorting"],
  "A shop sells n candies with given costs. There's an offer: for every candy you pay for, you may take k other candies for free. Find the minimum amount needed to buy all the candies, and separately the maximum amount you could end up paying if you always chose the worst valid strategy. Print 'min max'.",
  "1 <= n <= 10^5, 0 <= k < n",
  "Input:\n3\n3 1 2\n2\nOutput:\n1 3",
  ["To minimize: sort ascending, always pay for the cheapest remaining candy and take the k most expensive remaining candies free.", "To maximize: sort ascending, always pay for the most expensive remaining candy and take the k cheapest remaining candies free."],
  [{ input: "3\n3 1 2\n2", expectedOutput: "1 3", explanation: "" },
   { input: "3\n3 1 2\n0", expectedOutput: "6 6", explanation: "No candies are free, so order doesn't matter." }],
  [{ input: "1\n5\n5", expectedOutput: "5 5", points: 1 },
   { input: "4\n1 2 3 4\n1", expectedOutput: "3 7", points: 1 },
   { input: "3\n10 20 30\n1", expectedOutput: "30 50", points: 1 }]),

p("Maximum Product Subset of an Array", "Greedy", "Medium", ["Greedy", "Array"],
  "Given an array of n integers (which may include negatives and zeros), find the maximum product achievable by any non-empty subset of its elements.",
  "1 <= n <= 10^5",
  "Input:\n5\n-1 -1 -2 4 3\nOutput:\n24",
  ["Take every positive number. Among the negative numbers, take all of them if their count is even; if odd, drop the negative number closest to zero (the one with the smallest absolute value) to make the count even.", "Special-case arrays that are all zero (the answer is 0), and arrays with no positive numbers and only one negative number (the answer is that single negative number)."],
  [{ input: "5\n-1 -1 -2 4 3", expectedOutput: "24", explanation: "" },
   { input: "3\n0 0 0", expectedOutput: "0", explanation: "" }],
  [{ input: "1\n5", expectedOutput: "5", points: 1 },
   { input: "1\n-1", expectedOutput: "-1", points: 1 },
   { input: "3\n-1 0 -2", expectedOutput: "2", points: 1 }]),

p("Maximize Array Sum After K Negations", "Greedy", "Medium", ["Greedy", "Heap"],
  "Given an array of n integers and a number k, you may repeatedly choose any element and flip its sign, doing this exactly k times in total (the same element can be chosen more than once). Find the maximum possible sum of the array afterward.",
  "1 <= n <= 10^5, 0 <= k <= 10^5",
  "Input:\n3\n-2 -3 -1\n3\nOutput:\n6",
  ["Always flip the current smallest (most negative) element - this is the greedy choice at every step.", "A min-heap makes repeatedly finding and updating the smallest element efficient."],
  [{ input: "3\n-2 -3 -1\n3", expectedOutput: "6", explanation: "" },
   { input: "4\n3 -1 0 2\n3", expectedOutput: "6", explanation: "" }],
  [{ input: "1\n5\n1", expectedOutput: "-5", points: 1 },
   { input: "1\n5\n2", expectedOutput: "5", points: 1 },
   { input: "4\n-5 -3 -1 2\n2", expectedOutput: "9", points: 1 }]),

p("Maximize Sum of arr[i] * i After Rearranging", "Greedy", "Medium", ["Greedy", "Sorting"],
  "Given an array of n integers, rearrange its elements to maximize the sum of arr[i] * i over all 0-indexed positions i. Print that maximum sum.",
  "1 <= n <= 10^5",
  "Input:\n5\n5 3 2 4 1\nOutput:\n40",
  ["Sort the array ascending - pairing the smallest values with the smallest (least-weighted) indices and the largest values with the largest indices maximizes the total.", "Once sorted, just compute sum of value * its new index."],
  [{ input: "5\n5 3 2 4 1", expectedOutput: "40", explanation: "" },
   { input: "3\n1 2 3", expectedOutput: "8", explanation: "" }],
  [{ input: "1\n5", expectedOutput: "0", points: 1 },
   { input: "2\n1 1", expectedOutput: "1", points: 1 },
   { input: "4\n4 3 2 1", expectedOutput: "20", points: 1 }]),

p("Minimum Sum of Absolute Differences of Pairs of Two Arrays", "Greedy", "Medium", ["Greedy", "Sorting"],
  "Given two arrays a and b, each with n integers, pair up every element of a with a distinct element of b (forming n pairs total) so as to minimize the sum of absolute differences across all pairs. Print that minimum sum.",
  "1 <= n <= 10^5",
  "Input:\n4\n4 1 8 7\n2 3 6 5\nOutput:\n6",
  ["Sort both arrays independently in ascending order.", "Pairing them index-by-index after sorting (smallest with smallest, and so on) always minimizes the total absolute difference."],
  [{ input: "4\n4 1 8 7\n2 3 6 5", expectedOutput: "6", explanation: "" },
   { input: "2\n1 2\n3 4", expectedOutput: "4", explanation: "" }],
  [{ input: "1\n5\n5", expectedOutput: "0", points: 1 },
   { input: "2\n1 5\n1 5", expectedOutput: "0", points: 1 },
   { input: "3\n10 20 30\n1 2 3", expectedOutput: "54", points: 1 }]),

p("Shortest Job First (SJF) CPU Scheduling - Average Waiting Time", "Greedy", "Medium", ["Greedy", "Sorting"],
  "Given the burst times of n processes, all of which arrive at time 0, and scheduled non-preemptively by shortest burst time first, find the average waiting time across all processes. Print it with exactly two decimal places.",
  "1 <= n <= 10^5",
  "Input:\n4\n6 8 7 3\nOutput:\n7.00",
  ["Sort the burst times ascending - this is exactly the schedule SJF produces.", "The waiting time of the process at sorted position i is the sum of all burst times before it; average them all at the end."],
  [{ input: "4\n6 8 7 3", expectedOutput: "7.00", explanation: "" },
   { input: "1\n5", expectedOutput: "0.00", explanation: "" }],
  [{ input: "3\n1 1 1", expectedOutput: "1.00", points: 1 },
   { input: "2\n10 5", expectedOutput: "2.50", points: 1 },
   { input: "4\n4 2 7 1", expectedOutput: "2.75", points: 1 }]),

p("LRU Page Replacement - Count Page Faults", "Greedy", "Medium", ["Greedy", "Hashing"],
  "Given a cache of capacity n and a sequence of m page requests, simulate the Least Recently Used (LRU) page replacement policy: on a page already in the cache, mark it as most recently used; on a page not in the cache, it's a page fault - insert it (evicting the least recently used page first if the cache is full). Print the total number of page faults.",
  "1 <= n <= 1000, 1 <= m <= 10^5",
  "Input:\n3\n13\n7 0 1 2 0 3 0 4 2 3 0 3 2\nOutput:\n9",
  ["A hash map plus a doubly linked list (or an ordered structure that supports 'move to front') gives O(1) lookup and eviction.", "Every cache hit still requires updating recency - only cache misses count as faults."],
  [{ input: "3\n13\n7 0 1 2 0 3 0 4 2 3 0 3 2", expectedOutput: "9", explanation: "" },
   { input: "2\n4\n1 2 1 2", expectedOutput: "2", explanation: "" }],
  [{ input: "1\n3\n1 2 3", expectedOutput: "3", points: 1 },
   { input: "5\n3\n1 2 3", expectedOutput: "3", points: 1 },
   { input: "2\n3\n1 1 1", expectedOutput: "1", points: 1 }]),

p("Smallest Number With Given Number of Digits and Digit Sum", "Greedy", "Medium", ["Greedy", "Math"],
  "Given the number of digits d and a target digit sum s, find the smallest d-digit number (no leading zero, unless d = 1 and s = 0) whose digits add up to exactly s. If no such number exists, print -1.",
  "1 <= d <= 10^5, 0 <= s <= 9*d",
  "Input:\n3\n6\nOutput:\n105",
  ["To keep the number small, keep the leftmost digits as small as possible - which means pushing as much of the digit sum as possible into the rightmost digits (maxing each at 9).", "The leading digit must be at least 1 (except the single-digit case where 0 is allowed): reserve that 1 first, then greedily fill from the rightmost position backward with the rest of the sum."],
  [{ input: "3\n6", expectedOutput: "105", explanation: "" },
   { input: "2\n20", expectedOutput: "-1", explanation: "Max possible sum for 2 digits is 18." }],
  [{ input: "1\n0", expectedOutput: "0", points: 1 },
   { input: "1\n9", expectedOutput: "9", points: 1 },
   { input: "4\n1", expectedOutput: "1000", points: 1 }]),

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
console.log(`GREEDY topic: created ${created} problem(s), skipped ${skipped} already-existing.`);
