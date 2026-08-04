// The DeVert Interview Sheet's curation, plus the title-resolution used to turn
// it into problems/{id} references. Shared by:
//   - scripts/audit-interview-sheet-coverage.mjs  (report only)
//   - scripts/seed-devert-interview-sheet.mjs     (writes the sheet)
// so the audit can never disagree with what actually gets seeded.
//
// WHY TITLE MATCHING AT ALL
// -------------------------
// DeVert's problems carry no external/LeetCode id, and they are authored with
// their own descriptive names: LC 206 "Reverse Linked List" exists here as
// "Reverse a Linked List", LC 155 "Min Stack" as "Min Stack - Support getMin in
// O(1)", LC 103 as "Zig-Zag Level Order Traversal". Exact string matching
// reported Trees and Linked Lists as 0% covered when both are well covered, so
// resolution is scored and TIERED instead:
//
//   CONFIRMED  exact normalized title match      -> safe to reference
//   LIKELY     >= 0.85 token similarity          -> safe to reference
//   REVIEW     0.55-0.85                         -> NOT referenced; needs a human
//   UNRESOLVED < 0.55                            -> no such problem exists here
//
// The REVIEW tier is deliberately excluded from seeding. Roughly a third of it
// is wrong in ways that look plausible ("Merge Sorted Array" -> "Squares of a
// Sorted Array", "Sum of Two Integers" -> "Two Sum"), and putting a wrong
// problem in front of someone preparing for interviews is worse than a shorter
// sheet. Those rows are reported, never guessed at.

// [leetcodeNumber, title]. The number is a human cross-reference only - nothing
// resolves by it. Order within a section is the author's intended order and is
// preserved inside each difficulty group.
export const SHEET = {
  "Arrays": [
    [1, "Two Sum"], [121, "Best Time to Buy and Sell Stock"], [53, "Maximum Subarray"],
    [88, "Merge Sorted Array"], [26, "Remove Duplicates from Sorted Array"], [189, "Rotate Array"],
    [238, "Product of Array Except Self"], [169, "Majority Element"], [283, "Move Zeroes"],
    [217, "Contains Duplicate"], [268, "Missing Number"], [448, "Find All Numbers Disappeared in an Array"],
    [75, "Sort Colors"], [31, "Next Permutation"], [42, "Trapping Rain Water"],
    [11, "Container With Most Water"], [134, "Gas Station"], [55, "Jump Game"],
    [45, "Jump Game II"], [135, "Candy"],
  ],
  "Strings": [
    [242, "Valid Anagram"], [125, "Valid Palindrome"], [14, "Longest Common Prefix"],
    [344, "Reverse String"], [151, "Reverse Words in a String"], [28, "Implement strStr"],
    [5, "Longest Palindromic Substring"], [3, "Longest Substring Without Repeating Characters"],
    [49, "Group Anagrams"], [20, "Valid Parentheses"], [8, "String to Integer atoi"],
    [12, "Integer to Roman"], [13, "Roman to Integer"], [6, "Zigzag Conversion"],
    [76, "Minimum Window Substring"], [438, "Find All Anagrams in a String"],
    [205, "Isomorphic Strings"], [290, "Word Pattern"], [394, "Decode String"],
    [271, "Encode and Decode Strings"],
  ],
  "Binary Search": [
    [704, "Binary Search"], [35, "Search Insert Position"], [74, "Search a 2D Matrix"],
    [34, "Find First and Last Position of Element in Sorted Array"], [33, "Search in Rotated Sorted Array"],
    [81, "Search in Rotated Sorted Array II"], [153, "Find Minimum in Rotated Sorted Array"],
    [162, "Find Peak Element"], [875, "Koko Eating Bananas"],
    [1011, "Capacity To Ship Packages Within D Days"], [410, "Split Array Largest Sum"],
    [4, "Median of Two Sorted Arrays"], [69, "Sqrt x"], [367, "Valid Perfect Square"],
    [287, "Find the Duplicate Number"],
  ],
  "Two Pointers & Sliding Window": [
    [125, "Valid Palindrome"], [167, "Two Sum II Input Array Is Sorted"], [11, "Container With Most Water"],
    [15, "3Sum"], [18, "4Sum"], [26, "Remove Duplicates from Sorted Array"], [283, "Move Zeroes"],
    [75, "Sort Colors"], [3, "Longest Substring Without Repeating Characters"],
    [424, "Longest Repeating Character Replacement"], [567, "Permutation in String"],
    [438, "Find All Anagrams in a String"], [209, "Minimum Size Subarray Sum"],
    [76, "Minimum Window Substring"], [904, "Fruit Into Baskets"], [239, "Sliding Window Maximum"],
    [713, "Subarray Product Less Than K"], [1004, "Max Consecutive Ones III"],
    [1438, "Longest Continuous Subarray With Absolute Diff Less Than or Equal to Limit"],
    [42, "Trapping Rain Water"],
  ],
  "Bit Manipulation": [
    [136, "Single Number"], [137, "Single Number II"], [268, "Missing Number"], [191, "Number of 1 Bits"],
    [338, "Counting Bits"], [190, "Reverse Bits"], [231, "Power of Two"], [342, "Power of Four"],
    [201, "Bitwise AND of Numbers Range"], [371, "Sum of Two Integers"], [29, "Divide Two Integers"],
    [78, "Subsets"], [89, "Gray Code"], [421, "Maximum XOR of Two Numbers in an Array"],
    [393, "UTF-8 Validation"], [1442, "Count Triplets That Can Form Two Arrays of Equal XOR"],
    [1318, "Minimum Flips to Make a OR b Equal to c"], [1835, "Find XOR Sum of All Pairs Bitwise AND"],
    [1720, "Decode XORed Array"], [1310, "XOR Queries of a Subarray"],
  ],
  "Hashing & Prefix Sum": [
    [1, "Two Sum"], [217, "Contains Duplicate"], [242, "Valid Anagram"], [49, "Group Anagrams"],
    [347, "Top K Frequent Elements"], [128, "Longest Consecutive Sequence"], [202, "Happy Number"],
    [205, "Isomorphic Strings"], [560, "Subarray Sum Equals K"], [523, "Continuous Subarray Sum"],
    [325, "Maximum Size Subarray Sum Equals K"], [525, "Contiguous Array"], [724, "Find Pivot Index"],
    [303, "Range Sum Query Immutable"], [238, "Product of Array Except Self"],
    [438, "Find All Anagrams in a String"], [383, "Ransom Note"], [349, "Intersection of Two Arrays"],
    [350, "Intersection of Two Arrays II"], [169, "Majority Element"],
  ],
  "Linked Lists": [
    [206, "Reverse Linked List"], [21, "Merge Two Sorted Lists"], [141, "Linked List Cycle"],
    [142, "Linked List Cycle II"], [876, "Middle of the Linked List"],
    [19, "Remove Nth Node From End of List"], [234, "Palindrome Linked List"],
    [160, "Intersection of Two Linked Lists"], [2, "Add Two Numbers"], [23, "Merge k Sorted Lists"],
    [138, "Copy List with Random Pointer"], [143, "Reorder List"], [24, "Swap Nodes in Pairs"],
    [25, "Reverse Nodes in k-Group"], [61, "Rotate List"], [86, "Partition List"],
    [83, "Remove Duplicates from Sorted List"], [237, "Delete Node in a Linked List"],
    [148, "Sort List"], [430, "Flatten a Multilevel Doubly Linked List"],
  ],
  "Stacks & Queues": [
    [20, "Valid Parentheses"], [155, "Min Stack"], [232, "Implement Queue using Stacks"],
    [225, "Implement Stack using Queues"], [739, "Daily Temperatures"], [496, "Next Greater Element I"],
    [503, "Next Greater Element II"], [84, "Largest Rectangle in Histogram"], [85, "Maximal Rectangle"],
    [735, "Asteroid Collision"], [394, "Decode String"], [150, "Evaluate Reverse Polish Notation"],
    [224, "Basic Calculator"], [227, "Basic Calculator II"], [239, "Sliding Window Maximum"],
  ],
  "Trees & BST": [
    [104, "Maximum Depth of Binary Tree"], [100, "Same Tree"], [101, "Symmetric Tree"],
    [226, "Invert Binary Tree"], [102, "Binary Tree Level Order Traversal"],
    [103, "Binary Tree Zigzag Level Order Traversal"], [199, "Binary Tree Right Side View"],
    [543, "Diameter of Binary Tree"], [110, "Balanced Binary Tree"],
    [236, "Lowest Common Ancestor of a Binary Tree"], [98, "Validate Binary Search Tree"],
    [230, "Kth Smallest Element in a BST"], [235, "Lowest Common Ancestor of a BST"],
    [108, "Convert Sorted Array to Binary Search Tree"],
    [105, "Construct Binary Tree from Preorder and Inorder Traversal"],
    [297, "Serialize and Deserialize Binary Tree"], [112, "Path Sum"], [113, "Path Sum II"],
    [124, "Binary Tree Maximum Path Sum"], [116, "Populating Next Right Pointers in Each Node"],
  ],
  "Heaps & Priority Queue": [
    [215, "Kth Largest Element in an Array"], [347, "Top K Frequent Elements"], [23, "Merge k Sorted Lists"],
    [295, "Find Median from Data Stream"], [973, "K Closest Points to Origin"], [1046, "Last Stone Weight"],
    [621, "Task Scheduler"], [451, "Sort Characters By Frequency"], [767, "Reorganize String"],
    [253, "Meeting Rooms II"], [632, "Smallest Range Covering Elements from K Lists"],
    [373, "Find K Pairs with Smallest Sums"], [502, "IPO"], [1383, "Maximum Performance of a Team"],
    [218, "The Skyline Problem"], [1167, "Minimum Cost to Connect Sticks"],
    [1845, "Seat Reservation Manager"], [355, "Design Twitter"], [1834, "Single-Threaded CPU"],
    [1642, "Furthest Building You Can Reach"],
  ],
};

// One-line blurb per section, in the same voice as the DSA Sheet's blurbs.
export const SECTION_BLURBS = {
  "Arrays": "The most-asked category there is - scanning, counting, and in-place tricks.",
  "Strings": "Parsing, palindromes and anagrams, plus the traps that come with them.",
  "Binary Search": "On arrays, on matrices, and on an answer space rather than an index.",
  "Two Pointers & Sliding Window": "Two indices doing the work of a nested loop.",
  "Bit Manipulation": "XOR identities, masks, and thinking in binary.",
  "Hashing & Prefix Sum": "Trading memory for time, and precomputing running totals.",
  "Linked Lists": "Pointer surgery - reversal, cycle detection, and merging.",
  "Stacks & Queues": "Monotonic stacks, expression evaluation, and next-greater patterns.",
  "Trees & BST": "Traversal, recursion, and the ordering invariant that makes BSTs fast.",
  "Heaps & Priority Queue": "Top-K, streaming medians, and scheduling.",
};

// Roman-numeral and single-letter suffixes are significant and PRESERVED:
// "Single Number" and "Single Number II" are different problems and must never
// collapse into one.
export const norm = (s) => String(s || "")
  .toLowerCase()
  .replace(/&/g, " and ")
  .replace(/[^a-z0-9]+/g, " ")
  .trim()
  .replace(/\s+/g, " ");

const STOP = new Set(["a", "an", "the", "of", "in", "to", "from", "with", "and", "is", "are", "on", "for"]);
const tokenize = (s) => new Set(norm(s).split(" ").filter(t => t && !STOP.has(t)));

export function similarity(sheetTitle, dbTitle) {
  const a = tokenize(sheetTitle);
  const b = tokenize(dbTitle);
  if (a.size === 0 || b.size === 0) return 0;
  let shared = 0;
  for (const t of a) if (b.has(t)) shared++;
  const coverage = shared / a.size;
  const noise = (b.size - shared) / Math.max(b.size, 1);
  return coverage - noise * 0.25;
}

export function classify(score, exact) {
  if (exact) return "CONFIRMED";
  if (score >= 0.85) return "LIKELY";
  if (score >= 0.55) return "REVIEW";
  return "UNRESOLVED";
}

// Only CONFIRMED and LIKELY become sheet references.
export const REFERENCEABLE = new Set(["CONFIRMED", "LIKELY"]);

/**
 * Resolves one sheet title against the problem list.
 * @returns {{tier: string, score: number, problem: object|null}}
 */
export function resolveTitle(title, problems, byNorm) {
  const exact = byNorm.get(norm(title));
  if (exact?.length) return { tier: "CONFIRMED", score: 1, problem: exact[0] };

  let best = null, bestScore = 0;
  for (const p of problems) {
    const s = similarity(title, p.title);
    if (s > bestScore) { bestScore = s; best = p; }
  }
  const tier = classify(bestScore, false);
  return { tier, score: bestScore, problem: tier === "UNRESOLVED" ? null : best };
}

export function indexByNormalizedTitle(problems) {
  const byNorm = new Map();
  for (const p of problems) {
    const k = norm(p.title);
    if (!byNorm.has(k)) byNorm.set(k, []);
    byNorm.get(k).push(p);
  }
  return byNorm;
}
