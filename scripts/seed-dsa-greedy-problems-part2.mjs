import admin from "firebase-admin";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(join(__dirname, "service-account.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// DSA-450-sheet ingestion, GREEDY topic, PART 2 - closing the real gap against the
// sheet's verbatim Greedy row list. Every expectedOutput below was computed with a
// hand-written Python reference solution and (where the greedy's global optimality
// was not obvious) cross-checked against a brute-force search over small inputs -
// see the task's verification notes. Rows genuinely skipped, with reasons:
//   - "Rearrange characters..." - not duplicated under Strings (checked Firestore),
//     but redefined here as a Yes/No feasibility check rather than "print the
//     rearranged string", because - exactly like this file's pre-existing Huffman
//     skip note - a valid rearrangement is not unique, so an exact-string-match
//     grader would wrongly reject other correct answers.
//   - "CHOCOLA - Chocolate" - same underlying problem as "Minimum Cost to Cut a
//     Board Into Squares" below (board-cutting == chocolate-bar-breaking); one
//     problem covers both sheet rows.
//   - "DEFKIN", "GERGOVIA", "ARRANGE" - obscure-looking SPOJ names, but pinned down
//     via web research to well-defined, gradable problems; included below.
//   - "DIEHARD" and "Picking Up Chicks" - genuinely skipped. spoj.com returned 403
//     to every fetch attempt, and secondary sources (blogs/GitHub solutions) gave
//     incomplete or mutually inconsistent accounts of critical rules (DIEHARD: how
//     "survive forever" is detected/printed, whether the starting location is free;
//     Picking Up Chicks/GCJ101BB: exact meaning of its K/B/T parameters and swap-
//     counting rule). Authoring exact-match hidden tests on a live autograder from
//     an unverified spec risked shipping a wrong problem, so these are left out.

const REWARD = { Easy: [30, 10], Medium: [50, 20], Hard: [80, 30] };
function p(title, category, difficulty, tags, statement, constraints, examplesText, hints, sampleTests, hiddenTests) {
  const [xpReward, coinReward] = REWARD[difficulty];
  return { title, category, difficulty, tags, statement, constraints, examplesText, hints, xpReward, coinReward, sampleTests, hiddenTests };
}

const PROBLEMS = [

p("Huffman Coding - Total Encoded Length", "Greedy", "Medium", ["Greedy", "Heap"],
  "Given n characters with their frequencies of occurrence in a message, build an optimal Huffman tree using the standard algorithm - repeatedly merge the two nodes with the smallest weight into a new node whose weight is their sum - and find the total number of bits required to encode the entire message with the resulting prefix codes (the sum, over every character, of its frequency times its code length in the tree). This total is the same regardless of how ties are broken during merging, so it's well-defined even though the exact codes aren't unique.",
  "1 <= n <= 10^4, 1 <= frequency <= 10^6",
  "Input:\n6\n5 9 12 13 16 45\nOutput:\n224",
  ["Use a min-heap keyed by weight; repeatedly pop the two smallest weights and push their sum back as a new merged node - that sum also adds directly to the running total.", "Keep merging until only one node remains in the heap; the sum of every merge's cost is the answer.", "A single character (n = 1) still needs 1 bit per occurrence, even with no second symbol to distinguish it from."],
  [{ input: "6\n5 9 12 13 16 45", expectedOutput: "224", explanation: "" },
   { input: "2\n4 5", expectedOutput: "9", explanation: "" }],
  [{ input: "4\n1 1 1 1", expectedOutput: "8", points: 1 },
   { input: "1\n7", expectedOutput: "7", points: 1 },
   { input: "4\n10 20 5 15", expectedOutput: "95", points: 1 }]),

p("Water Connection Problem", "Greedy", "Medium", ["Greedy", "Graph"],
  "A village has n houses numbered 1 to n. p pipes are given as (a, b, d), meaning water flows from house a to house b through a pipe of diameter d. Every house has at most one outgoing pipe and at most one incoming pipe, so the pipes form simple non-branching chains. A house with an outgoing pipe but no incoming pipe is a tank (a chain's start); a house with an incoming pipe but no outgoing pipe is a tap (a chain's end). For every chain, find its tank, its tap, and the minimum diameter along the whole chain (the bottleneck that limits its flow). Print the number of chains, then one line per chain as 'tank tap minDiameter', ordered by increasing tank number.",
  "1 <= n <= 10^4, 0 <= p < n",
  "Input:\n9\n6\n7 4 98\n5 9 72\n4 6 10\n2 8 22\n9 7 17\n3 1 66\nOutput:\n3\n2 8 22\n3 1 66\n5 6 10",
  ["A house is a chain start if it has an outgoing pipe but never appears as anyone's pipe destination.", "From each start, walk forward along outgoing pipes until reaching a house with no outgoing pipe, tracking the minimum diameter seen along the way.", "Sort the resulting chains by their starting house number before printing."],
  [{ input: "9\n6\n7 4 98\n5 9 72\n4 6 10\n2 8 22\n9 7 17\n3 1 66", expectedOutput: "3\n2 8 22\n3 1 66\n5 6 10", explanation: "" },
   { input: "4\n3\n1 2 5\n2 3 3\n3 4 7", expectedOutput: "1\n1 4 3", explanation: "" }],
  [{ input: "5\n2\n1 2 10\n3 4 5", expectedOutput: "2\n1 2 10\n3 4 5", points: 1 },
   { input: "1\n0", expectedOutput: "0", points: 1 },
   { input: "6\n2\n5 6 8\n1 2 4", expectedOutput: "2\n1 2 4\n5 6 8", points: 1 }]),

p("Greedy Algorithm to Find Minimum Number of Coins", "Greedy", "Easy", ["Greedy"],
  "Using the standard Indian currency denominations {1, 2, 5, 10, 20, 50, 100, 500, 2000}, find the minimum number of coins/notes needed to make up a given amount by always using as many of the current largest denomination as possible before moving to the next smaller one.",
  "1 <= amount <= 10^9",
  "Input:\n93\nOutput:\n5",
  ["Process denominations from largest to smallest, taking as many of each as fit into the remaining amount.", "Keep a running remainder and a running coin count; this greedy is optimal for this specific denomination set."],
  [{ input: "93", expectedOutput: "5", explanation: "50+20+20+2+1" },
   { input: "121", expectedOutput: "3", explanation: "100+20+1" }],
  [{ input: "43", expectedOutput: "4", points: 1 },
   { input: "1", expectedOutput: "1", points: 1 },
   { input: "2000", expectedOutput: "1", points: 1 }]),

p("Maximum Trains for Which Stoppage Can Be Provided", "Greedy", "Medium", ["Greedy", "Heap", "Sorting"],
  "A railway station has p platforms. Given the arrival and departure times of n trains, determine the maximum number of trains that can be given a stoppage using this procedure: process trains in increasing order of arrival time; if some currently occupied platform has already been vacated (its train's departure time is at or before the current train's arrival), reuse that platform; otherwise, if a platform is still free, use it; if neither is possible, that train is skipped. Print how many trains get a platform under this procedure.",
  "1 <= n <= 10^5, 1 <= p <= 10^3",
  "Input:\n4\n100 140 150 200\n110 300 220 250\n2\nOutput:\n3",
  ["Sort trains by arrival time.", "Maintain a min-heap of the departure times of trains currently holding a platform (size at most p) - its minimum tells you the earliest a platform frees up.", "If the heap's minimum departure is <= the current train's arrival, pop it and push the new departure (reuse); else push a new departure only if the heap has room; otherwise skip the train."],
  [{ input: "4\n100 140 150 200\n110 300 220 250\n2", expectedOutput: "3", explanation: "" },
   { input: "6\n900 940 950 1100 1500 1800\n910 1200 1120 1130 1900 2000\n3", expectedOutput: "6", explanation: "" }],
  [{ input: "3\n10 10 10\n20 20 20\n2", expectedOutput: "2", points: 1 },
   { input: "3\n1 2 3\n10 10 10\n2", expectedOutput: "2", points: 1 },
   { input: "1\n5\n10\n1", expectedOutput: "1", points: 1 }]),

p("Buy Maximum Stocks if i Stocks Can Be Bought on the i-th Day", "Greedy", "Medium", ["Greedy", "Sorting"],
  "Given the price of a stock on each of n days (1-indexed) and a total budget k, where on day i you may buy at most i shares (in total, in any order you like across days), find the maximum number of shares you can buy without exceeding the budget.",
  "1 <= n <= 10^5, 1 <= price <= 10^4, 1 <= k <= 10^9",
  "Input:\n3\n7 10 4\n100\nOutput:\n6",
  ["Process days in increasing order of price - buying the cheapest shares first always leaves the most budget for the rest.", "On each day (in that price order) buy as many as you can afford, capped by both the remaining budget and that day's per-day limit (its 1-indexed day number)."],
  [{ input: "3\n7 10 4\n100", expectedOutput: "6", explanation: "" },
   { input: "3\n7 10 4\n2", expectedOutput: "0", explanation: "" }],
  [{ input: "3\n10 5 3\n20", expectedOutput: "5", points: 1 },
   { input: "3\n1 2 3\n10", expectedOutput: "4", points: 1 },
   { input: "4\n5 5 5 5\n15", expectedOutput: "3", points: 1 }]),

p("Minimize Cash Flow Among Friends", "Greedy", "Hard", ["Greedy", "Recursion"],
  "n friends have lent and borrowed money among themselves, leaving each with a net balance: positive means that friend should receive that much overall, negative means they owe that much overall (all balances sum to 0). Settle everything using this procedure: repeatedly find the friend with the largest positive balance and the friend with the most negative balance (lowest index first on ties), transfer the smaller of (the creditor's balance, the debtor's debt) between them as one transaction, and update both balances; repeat until every balance is 0. Print the total number of transactions this procedure performs.",
  "1 <= n <= 100, -10^9 <= balance <= 10^9, balances sum to 0",
  "Input:\n3\n-1000 2000 -1000\nOutput:\n2",
  ["At every step only the single largest creditor and single largest debtor matter - settle the smaller of the two amounts between them in one transaction.", "After each transaction, at least one of the two balances involved becomes exactly zero and drops out.", "Repeating this step (recursively or in a loop) until all balances are zero gives the total transaction count."],
  [{ input: "3\n-1000 2000 -1000", expectedOutput: "2", explanation: "" },
   { input: "3\n0 0 0", expectedOutput: "0", explanation: "" }],
  [{ input: "2\n100 -100", expectedOutput: "1", points: 1 },
   { input: "4\n50 50 -30 -70", expectedOutput: "3", points: 1 },
   { input: "4\n10 -10 20 -20", expectedOutput: "2", points: 1 }]),

p("Minimum Cost to Cut a Board Into Squares", "Greedy", "Hard", ["Greedy", "Sorting"],
  "A rectangular board is m units by n units and must be cut into 1x1 unit squares. Cutting along one horizontal or vertical grid line, all the way across whichever piece it currently runs through, costs a fixed amount depending only on which line it is (given as array X of m-1 horizontal-cut costs and array Y of n-1 vertical-cut costs) - but that fixed cost is paid separately for every already-separated piece the line has to cut through. Find the minimum total cost to cut the whole board into unit squares. (This is the same underlying problem as the classic 'CHOCOLA' chocolate-bar puzzle.)",
  "1 <= m, n <= 10^3",
  "Input:\n5\n3\n2 1 3 1 4\n4 1 2\nOutput:\n42",
  ["Whichever cut currently costs the most should be made first - once a cut is made, every future cut in the other direction has to pass through one more separated piece, multiplying its effective cost.", "Sort both cost arrays in descending order and merge them greedily, always taking the larger of the two current fronts next, while tracking how many horizontal and vertical pieces exist so far."],
  [{ input: "5\n3\n2 1 3 1 4\n4 1 2", expectedOutput: "42", explanation: "" },
   { input: "2\n2\n1\n1", expectedOutput: "3", explanation: "" }],
  [{ input: "2\n3\n5\n3 2", expectedOutput: "15", points: 1 },
   { input: "3\n3\n1 2\n1 2", expectedOutput: "11", points: 1 },
   { input: "3\n3\n2 2\n2 2", expectedOutput: "16", points: 1 }]),

p("Check if It Is Possible to Survive on the Island", "Greedy", "Hard", ["Greedy"],
  "You must survive on an island for exactly M days (numbered 1 to M). A market is open on the first N days of every 7-day week (a day d is a market day if (d-1) mod 7 < N) and closed the rest of the week. Each market visit lets you buy enough food to cover that day plus the next S-1 days (S consecutive days starting from the day of purchase). Find the minimum number of market visits needed to have food on every day through day M, or print -1 if it's impossible.",
  "1 <= M <= 10^6, 1 <= N <= 7, 1 <= S <= 10^6",
  "Input:\n10\n2\n6\nOutput:\n3",
  ["This is an interval-covering problem: a visit on market day d covers days d..d+S-1, and you want the fewest visits covering 1..M.", "Whenever your current coverage runs out, look among all market days at or before the first uncovered day and pick the latest one (the one pushing coverage furthest) - the same idea as the classic minimum-refueling-stops greedy.", "If no market day exists at or before the first uncovered day, survival is impossible."],
  [{ input: "10\n2\n6", expectedOutput: "3", explanation: "" },
   { input: "7\n1\n7", expectedOutput: "1", explanation: "" }],
  [{ input: "10\n1\n3", expectedOutput: "-1", points: 1 },
   { input: "20\n2\n3", expectedOutput: "-1", points: 1 },
   { input: "14\n3\n7", expectedOutput: "2", points: 1 }]),

p("Find Maximum Meetings in One Room", "Greedy", "Medium", ["Greedy", "Sorting"],
  "There is a single meeting room. Given n meetings, each with a start and end time, find the maximum number of meetings that can be held such that no two overlap - one meeting must strictly end before the next starts (they cannot share the boundary instant). Print the count, then the 1-indexed numbers of the chosen meetings, space-separated, in the order they are held.",
  "1 <= n <= 10^5",
  "Input:\n6\n1 3 0 5 3 5\n2 4 6 7 8 9\nOutput:\n3\n1 2 4",
  ["Sort meetings by end time, breaking ties by the earlier start.", "Greedily take a meeting only if its start time is strictly greater than the end time of the last meeting taken - the same principle as activity selection, but with a strict inequality.", "Remember each meeting's original 1-indexed position before sorting, so you can report it in the answer."],
  [{ input: "6\n1 3 0 5 3 5\n2 4 6 7 8 9", expectedOutput: "3\n1 2 4", explanation: "" },
   { input: "1\n1\n2", expectedOutput: "1\n1", explanation: "" }],
  [{ input: "2\n1 2\n10 3", expectedOutput: "1\n2", points: 1 },
   { input: "4\n4 1 2 7\n5 3 4 8", expectedOutput: "3\n2 1 4", points: 1 },
   { input: "4\n1 3 2 5\n2 4 3 6", expectedOutput: "3\n1 2 4", points: 1 }]),

p("Maximum Sum of Absolute Difference of an Array", "Greedy", "Medium", ["Greedy", "Sorting"],
  "Given an array of n integers, rearrange its elements in a straight line (not circular) to maximize the sum of |arr[i] - arr[i+1]| over all consecutive pairs i = 0..n-2. Print that maximum possible sum (print 0 if n = 1).",
  "1 <= n <= 10^5",
  "Input:\n4\n1 2 4 8\nOutput:\n16",
  ["The two elements that end up at the very ends of the line each touch only one neighbour, while every interior element touches two - so it pays to let your most extreme values do 'double duty' in the interior.", "Sorting the array and experimenting with small cases by hand reveals which split between 'low' and 'high' values should feed the interior versus the ends.", "For small n, reasoning about (or brute-forcing) the distinct rearrangements directly is a reliable way to find the true maximum."],
  [{ input: "4\n1 2 4 8", expectedOutput: "16", explanation: "" },
   { input: "3\n10 5 1", expectedOutput: "14", explanation: "" }],
  [{ input: "3\n1 1 1", expectedOutput: "0", points: 1 },
   { input: "1\n7", expectedOutput: "0", points: 1 },
   { input: "8\n3 1 4 1 5 9 2 6", expectedOutput: "33", points: 1 }]),

p("Maximize Sum of Consecutive Differences in a Circular Array", "Greedy", "Medium", ["Greedy", "Sorting"],
  "Given an array of n integers, rearrange its elements around a circle to maximize the sum of |arr[i] - arr[(i+1) mod n]| over all n consecutive pairs, including the wraparound pair. Print that maximum possible sum.",
  "1 <= n <= 10^5",
  "Input:\n4\n1 2 4 8\nOutput:\n18",
  ["Sort the array and split it into a 'lower half' and an 'upper half' of equal (or near-equal) size.", "Arranging the circle so it alternates between the lower half and the upper half makes every edge cross between a small and a large value, which maximizes the total.", "The resulting maximum equals twice the difference between the sum of the upper half and the sum of the lower half."],
  [{ input: "4\n1 2 4 8", expectedOutput: "18", explanation: "" },
   { input: "3\n10 5 1", expectedOutput: "18", explanation: "" }],
  [{ input: "3\n1 1 1", expectedOutput: "0", points: 1 },
   { input: "1\n7", expectedOutput: "0", points: 1 },
   { input: "8\n3 1 4 1 5 9 2 6", expectedOutput: "34", points: 1 }]),

p("Smallest Subset With Sum Greater Than All Other Elements", "Greedy", "Easy", ["Greedy", "Sorting"],
  "Given an array of n positive integers, find the smallest possible subset of elements whose sum is strictly greater than the sum of all the elements NOT picked. Print the picked elements, in non-increasing order, space-separated.",
  "1 <= n <= 10^5",
  "Input:\n4\n3 1 7 1\nOutput:\n7",
  ["Sort the array in descending order and greedily add the next-largest remaining element to the picked set.", "Stop as soon as the picked sum exceeds the sum of everything still remaining - taking the largest elements first reaches that point with the fewest picks."],
  [{ input: "4\n3 1 7 1", expectedOutput: "7", explanation: "" },
   { input: "7\n1 1 1 1 1 1 10", expectedOutput: "10", explanation: "" }],
  [{ input: "4\n4 4 4 4", expectedOutput: "4 4 4", points: 1 },
   { input: "1\n5", expectedOutput: "5", points: 1 },
   { input: "5\n2 2 2 2 2", expectedOutput: "2 2 2", points: 1 }]),

p("Chocolate Distribution Problem", "Greedy", "Medium", ["Greedy", "Sorting"],
  "A shop has n packets of chocolates, packet i containing a[i] chocolates. Distribute chocolates to m students by choosing m of the n packets (each student gets exactly one whole packet) so that the difference between the maximum and minimum packet given out is as small as possible. Print that minimum possible difference.",
  "1 <= m <= n <= 10^5",
  "Input:\n8\n3 4 1 9 56 7 9 12\n5\nOutput:\n6",
  ["Sort the array - the m packets you choose should always form a contiguous block in sorted order, since spreading the choice out can only widen the max-min gap.", "Slide a window of size m across the sorted array and track the minimum (last - first) across all such windows."],
  [{ input: "8\n3 4 1 9 56 7 9 12\n5", expectedOutput: "6", explanation: "" },
   { input: "4\n1 2 3 4\n2", expectedOutput: "1", explanation: "" }],
  [{ input: "17\n12 4 7 9 2 23 25 41 30 40 28 42 30 44 48 43 50\n7", expectedOutput: "10", points: 1 },
   { input: "7\n7 3 2 4 9 12 56\n3", expectedOutput: "2", points: 1 },
   { input: "4\n10 10 10 10\n4", expectedOutput: "0", points: 1 }]),

p("Defense of a Kingdom", "Greedy", "Hard", ["Greedy", "Sorting"],
  "A rectangular kingdom is a grid W columns wide and H rows tall. n crossbow towers stand on distinct integer cells (xi, yi), no two sharing a column or a row; each tower defends its entire row and its entire column. The undefended cells form one or more rectangular blocks. Find the area (number of cells) of the largest such undefended block. (Classic SPOJ 'DEFKIN' problem.)",
  "1 <= W, H <= 10^4, 0 <= n <= min(W, H)",
  "Input:\n4\n4\n2\n1 1\n3 3\nOutput:\n1",
  ["Sort the towers' x-coordinates and, separately, their y-coordinates.", "The largest undefended horizontal gap is the biggest difference between consecutive x-coordinates (minus 1), also checking the two boundary gaps against 0 and W+1; do the same for y.", "The largest undefended rectangle's area is exactly (largest x-gap) times (largest y-gap)."],
  [{ input: "4\n4\n2\n1 1\n3 3", expectedOutput: "1", explanation: "" },
   { input: "5\n5\n1\n1 1", expectedOutput: "16", explanation: "" }],
  [{ input: "10\n10\n3\n2 3\n7 8\n5 5", expectedOutput: "6", points: 1 },
   { input: "6\n3\n1\n3 2", expectedOutput: "3", points: 1 },
   { input: "8\n6\n3\n2 2\n5 4\n7 1", expectedOutput: "4", points: 1 }]),

p("Wine Trading in Gergovia", "Greedy", "Easy", ["Greedy", "Arrays"],
  "n villages sit along a straight road, numbered 1 to n from west to east. Village i's wine balance is a[i]: positive means a surplus of that many units to sell, negative means a need of that many units to buy (balances always sum to 0). Wine can only move between adjacent villages, and moving one unit across one village-to-village segment costs 1 unit of work. Find the minimum total work needed to satisfy every village. (Classic SPOJ 'GERGOVIA' problem.)",
  "2 <= n <= 10^5, -1000 <= a[i] <= 1000, sum of a[i] = 0",
  "Input:\n5\n5 -5 10 -3 -7\nOutput:\n22",
  ["Track the running prefix sum of balances as you sweep west to east - it represents exactly how much wine must cross the road right after that point.", "The total work is simply the sum of the absolute value of that running prefix sum after every village.", "One linear pass over the array is all that's needed - no sorting or routing required."],
  [{ input: "5\n5 -5 10 -3 -7", expectedOutput: "22", explanation: "" },
   { input: "4\n1 2 3 -6", expectedOutput: "10", explanation: "" }],
  [{ input: "3\n0 0 0", expectedOutput: "0", points: 1 },
   { input: "2\n3 -3", expectedOutput: "3", points: 1 },
   { input: "4\n10 -3 -3 -4", expectedOutput: "21", points: 1 }]),

p("K Centers Problem", "Greedy", "Hard", ["Greedy"],
  "Given n vertices of a complete graph with a symmetric distance matrix, choose k of them as 'centers' to minimize the maximum distance from any vertex to its nearest center, using the standard greedy: start with vertex 0 as the first center, then repeatedly add whichever remaining vertex is currently farthest (in nearest-center distance) from all centers chosen so far, until k centers have been chosen. Print the resulting maximum distance from any vertex to its nearest center.",
  "1 <= k <= n <= 500",
  "Input:\n4\n2\n0 4 8 5\n4 0 10 7\n8 10 0 9\n5 7 9 0\nOutput:\n5",
  ["Maintain, for every vertex, its current distance to the nearest chosen center, initialized using vertex 0 as the sole center.", "At each step, the next center to add is the vertex whose current nearest-center distance is the largest; then update every vertex's nearest-center distance using this new center.", "After k centers are chosen, the answer is the maximum nearest-center distance remaining across all vertices."],
  [{ input: "4\n2\n0 4 8 5\n4 0 10 7\n8 10 0 9\n5 7 9 0", expectedOutput: "5", explanation: "" },
   { input: "3\n1\n0 10 20\n10 0 15\n20 15 0", expectedOutput: "20", explanation: "" }],
  [{ input: "3\n2\n0 10 20\n10 0 15\n20 15 0", expectedOutput: "10", points: 1 },
   { input: "4\n2\n0 1 4 5\n1 0 2 6\n4 2 0 3\n5 6 3 0", expectedOutput: "3", points: 1 },
   { input: "4\n3\n0 1 4 5\n1 0 2 6\n4 2 0 3\n5 6 3 0", expectedOutput: "1", points: 1 }]),

p("Minimum Cost of Ropes", "Greedy", "Medium", ["Greedy", "Heap"],
  "Given n ropes of various lengths, connect all of them into a single rope. Connecting two ropes of length a and b costs a + b, and the newly formed rope can itself be connected again. Find the minimum total cost to connect all n ropes into one.",
  "1 <= n <= 10^5",
  "Input:\n4\n4 3 2 6\nOutput:\n29",
  ["Always connect the two currently shortest ropes next - a min-heap gives fast access to the two smallest lengths at every step.", "Push the newly formed rope's length back into the heap and repeat until only one rope remains, summing every connection's cost along the way."],
  [{ input: "4\n4 3 2 6", expectedOutput: "29", explanation: "" },
   { input: "5\n1 2 3 4 5", expectedOutput: "33", explanation: "" }],
  [{ input: "1\n5", expectedOutput: "0", points: 1 },
   { input: "3\n1 2 3", expectedOutput: "9", points: 1 },
   { input: "4\n10 10 10 10", expectedOutput: "80", points: 1 }]),

p("Rearrange Characters in a String Such That No Two Adjacent Are Same", "Greedy", "Medium", ["Greedy", "Heap", "Strings"],
  "Given a string s of lowercase English letters, determine whether its characters can be rearranged so that no two adjacent characters are the same. Print 'Yes' if such a rearrangement exists, 'No' otherwise.",
  "1 <= |s| <= 10^5, s contains only lowercase English letters",
  "Input:\naab\nOutput:\nYes",
  ["Count the frequency of each character; a valid rearrangement exists if and only if the highest frequency is at most ceil(n / 2), where n is the string's length.", "A max-heap keyed by remaining frequency is how you'd greedily build such a rearrangement in practice (always place the most frequent remaining character that differs from the one you just placed) - but the frequency check alone already decides feasibility, no construction needed.", "Since more than one valid rearrangement can exist for the same input, this problem only asks for feasibility, not the rearranged string itself."],
  [{ input: "aab", expectedOutput: "Yes", explanation: "" },
   { input: "aaab", expectedOutput: "No", explanation: "" }],
  [{ input: "aabb", expectedOutput: "Yes", points: 1 },
   { input: "aaabc", expectedOutput: "Yes", points: 1 },
   { input: "a", expectedOutput: "Yes", points: 1 }]),

p("Maximum Sum Possible With Equal Sum of Three Stacks", "Greedy", "Medium", ["Greedy", "Stack"],
  "You are given three stacks of positive integers, each given as an array listing its elements from top to bottom. In one move you may remove the top element of any one stack. Repeatedly remove the top element of whichever stack currently has the strictly largest total sum, until all three stacks have equal total sum. Print that common sum (print 0 if they all end up empty).",
  "1 <= size of each stack <= 10^5",
  "Input:\n5\n3 2 1 1 1\n3\n4 3 2\n4\n1 1 4 1\nOutput:\n5",
  ["If the three sums aren't already equal, popping from a stack that isn't the current largest can never help close the gap.", "Repeatedly pop the top of whichever stack has the strictly largest sum right now; once no single stack is strictly the largest (all equal, or all empty), you're done."],
  [{ input: "5\n3 2 1 1 1\n3\n4 3 2\n4\n1 1 4 1", expectedOutput: "5", explanation: "" },
   { input: "2\n3 10\n2\n4 5\n2\n2 1", expectedOutput: "0", explanation: "" }],
  [{ input: "3\n1 2 3\n1\n4\n1\n5", expectedOutput: "0", points: 1 },
   { input: "3\n1 1 1\n3\n1 1 1\n3\n1 1 1", expectedOutput: "3", points: 1 },
   { input: "1\n5\n5\n1 1 1 1 1\n2\n3 2", expectedOutput: "5", points: 1 }]),

p("Arranging Amplifiers", "Greedy", "Hard", ["Greedy", "Sorting", "Math"],
  "You have n amplifiers, each loaded with a positive integer value. Wired one after another, an amplifier loaded with value Y that receives an incoming signal of strength X outputs a signal of strength Y^X (Y to the power X); the first amplifier in the chain receives an initial signal of strength 1. Find the arrangement (order to wire the amplifiers, from first/innermost to last/outermost) producing the strongest possible final signal, and print the amplifier values in that order, space-separated. (Classic SPOJ 'ARRANGE' problem; test data is kept small enough that the optimal order is unique.)",
  "1 <= n <= 8, 1 <= value <= 9",
  "Input:\n3\n5 6 4\nOutput:\n6 5 4",
  ["In general, larger values should be placed earlier (closer to the start) - compare two candidates for adjacent placement by which order yields the bigger power tower.", "Watch for two special cases: amplifiers loaded with 1 contribute least when placed early (1 raised to anything is 1), so place any 1's first; and the specific pair of values 2 and 3 is a well-known exception to the 'bigger first' rule.", "For inputs this small, directly comparing candidate orderings with big-integer arithmetic is a safe way to double-check your reasoning."],
  [{ input: "3\n5 6 4", expectedOutput: "6 5 4", explanation: "" },
   { input: "2\n2 3", expectedOutput: "2 3", explanation: "" }],
  [{ input: "3\n1 2 3", expectedOutput: "1 2 3", points: 1 },
   { input: "3\n2 3 4", expectedOutput: "4 3 2", points: 1 },
   { input: "4\n1 1 2 3", expectedOutput: "1 1 2 3", points: 1 }]),

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
  console.log(`Created: ${prob.title}`);
}
console.log(`GREEDY topic PART 2: created ${created} problem(s), skipped ${skipped} already-existing.`);
process.exit(0);
