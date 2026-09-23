// Seed courses - weekday LMS content (design §10). Each lesson is 300-600 words of
// real teaching material and links 3-4 question ids that genuinely exist in the
// aptitude/dsa seed banks (cross-check against questions-aptitude.js / questions-dsa.js
// if you ever renumber those files).

export const seedCourses = [
  {
    id: "seed-course-aptitude",
    title: "Aptitude Bootcamp Week",
    category: "aptitude",
    description:
      "A five-day sprint through the exact aptitude topics TCS NQT, Cognizant GenC and most on-campus drives set from: percentages, ratios, time-speed-distance, profit & loss, averages, compound interest, time & work, probability and number system. Each day ends with linked practice questions.",
    order: 1,
    published: true,
    lessons: [
      {
        id: "aptitude-day-1",
        title: "Percentages & Ratios - the base layer of every aptitude paper",
        day: 1,
        contentMarkdown:
          "## Why this comes first\n\n" +
          "Almost every other aptitude topic - profit & loss, compound interest, mixtures - is just percentages wearing a costume. If you're fast and accurate at percentages, half the paper gets easier automatically. So we start here.\n\n" +
          "### The one rule that matters\n\n" +
          "`percentage = (part / whole) × 100`. Everything else is this rule rearranged. When a question describes TWO successive percentage changes - say a price rises 20% then falls 20% - resist the urge to add them (+20 − 20 = 0%). That is wrong, because the second change acts on a NEW base, not the original one. The correct way is to multiply the fractional multipliers: `1.20 × 0.80 = 0.96`, a net 4% DECREASE, not zero. In general, successive changes of `+x%` then `−x%` always give a net `−x²/100` change - memorise this shortcut, it appears constantly in placement papers.\n\n" +
          "### Turning word problems into one equation\n\n" +
          "Exam-setters love disguising percentage questions as stories about students' pass marks. The trick that works every time: name the unknown (usually the maximum marks or the pass mark), write ONE equation per sentence, and solve. \"Scores 35% and fails by 40 marks\" becomes `0.35M + 40 = P`. \"Scores 60% and clears by 35 marks\" becomes `0.60M − 35 = P`. Two equations, two unknowns - subtract to eliminate P and solve for M directly.\n\n" +
          "### Ratios: think in \"parts\", not fractions\n\n" +
          "A ratio like 3 : 5 splits a total into 3 + 5 = 8 equal PARTS. The single most useful habit in ratio questions is finding the value of ONE part first (total ÷ number of parts), then multiplying up. When a question mixes ratios with real-world units - coins of different denominations, ages, mixtures - convert everything to the SAME unit (e.g. all coin values to rupees) before you start adding, or you will add apples to oranges without noticing.\n\n" +
          "### Common traps to watch for\n\n" +
          "1. Percentage change base confusion - always ask \"percentage of WHAT?\"\n" +
          "2. Assuming successive percentage changes cancel out - they don't, except when one is the exact reciprocal multiplier of the other.\n" +
          "3. Forgetting units when converting ratio parts into real quantities (coins, ages, mixture volumes).\n\n" +
          "### Practice now\n\n" +
          "Work through the four linked questions below. Do them WITHOUT a calculator first - mental percentage arithmetic (10%, 5%, 1% building blocks) is exactly what timed placement tests reward.",
        questionIds: ["seed-apt-001", "seed-apt-002", "seed-apt-003", "seed-apt-004"],
      },
      {
        id: "aptitude-day-2",
        title: "Time, Speed & Distance - trains, platforms and average speed",
        day: 2,
        contentMarkdown:
          "## The one formula everything derives from\n\n" +
          "`distance = speed × time`. Every train, boat, and average-speed question is a variation on rearranging this single relationship - the hard part is correctly identifying WHAT distance is being covered, not the arithmetic.\n\n" +
          "### The conversion factor you must have memorised\n\n" +
          "Speeds are usually given in km/h but distances in metres and times in seconds, so you constantly convert between the two: multiply by `5/18` to go from km/h to m/s, and by `18/5` to go the other way. Get this backwards under time pressure and every answer in a train question will be wrong by a factor of 3.6 - so drill it until it's automatic.\n\n" +
          "### Trains: the distance depends on what you're crossing\n\n" +
          "This is the single most tested distinction in this topic. When a train crosses a POLE (or a stationary point-like object, or a person standing still), it only needs to cover its OWN length - the pole has no length to add. But when a train crosses a PLATFORM, a bridge, or another train, it must cover its own length PLUS the length of the object it's crossing. Missing this distinction is the #1 reason students get train questions wrong even when their arithmetic is fine.\n\n" +
          "### Average speed is NOT the average of the speeds\n\n" +
          "This is the classic trap. If someone travels a distance at speed `a` and returns the SAME distance at speed `b`, their average speed for the whole round trip is the HARMONIC MEAN, `2ab/(a+b)` - never the simple arithmetic mean `(a+b)/2`. Why? Because they spend MORE TIME travelling at the slower speed, which drags the average down below the midpoint. For example, 40 km/h out and 60 km/h back gives an average of 48 km/h, not 50. This only applies when the two distances are EQUAL - if the distances differ, you must fall back to total distance ÷ total time from scratch.\n\n" +
          "### A worked strategy\n\n" +
          "For any time-speed-distance question: (1) identify every distance being covered and by whom, (2) convert everything to consistent units before touching the arithmetic, (3) decide whether you need `d = st` directly, or a relative-speed setup (for two moving objects), or the harmonic-mean shortcut (for round trips at two speeds).\n\n" +
          "### Practice now\n\n" +
          "The three linked questions cover a basic pole-crossing, a platform-crossing, and the average-speed trap - work through all three to lock in the distinction between them.",
        questionIds: ["seed-apt-005", "seed-apt-006", "seed-apt-007"],
      },
      {
        id: "aptitude-day-3",
        title: "Profit & Loss - cost price, markup and discount chains",
        day: 3,
        contentMarkdown:
          "## The one rule: profit/loss % is ALWAYS on cost price\n\n" +
          "Unless a question explicitly says otherwise, profit percentage and loss percentage are calculated as a percentage of the COST PRICE, never the selling price. `Profit % = (Selling Price − Cost Price) / Cost Price × 100`. Get this base wrong and every downstream number is wrong too.\n\n" +
          "### Markup and discount don't simply subtract\n\n" +
          "A shopkeeper marks goods up 40% above cost, then offers a 20% discount on the MARKED price. It is extremely tempting to compute 40% − 20% = 20% profit - this is WRONG, because the discount is taken on the marked price, not the original cost price, which is a different base entirely. The correct method is to chain the multipliers: if cost = 100, marked price = 100 × 1.40 = 140, and after a 20% discount the selling price = 140 × 0.80 = 112 - an actual profit of 12%, not 20%. Whenever you see a sequence of percentage operations (markup, then discount, then tax, etc.), convert each into a multiplier and multiply them all together; never add or subtract the raw percentages.\n\n" +
          "### The \"equal profit % equals loss %\" shortcut\n\n" +
          "A recurring question type: \"selling at price X gives the same profit % as the loss % from selling at price Y - find the cost price.\" There's an elegant shortcut here: when profit % exactly equals loss % on the SAME cost price, the cost price is simply the ARITHMETIC MEAN of the two selling prices, `(X + Y) / 2`. This works because the two scenarios are symmetric around the cost price - one overshoots by the same percentage the other undershoots. It's much faster than setting up and solving the full equation, though setting up `(X − C)/C = (C − Y)/C` and solving is the fallback if you ever doubt the shortcut.\n\n" +
          "### A three-step method for any profit/loss word problem\n\n" +
          "1. Identify what's known: cost price, selling price, marked price, discount %, profit/loss %, or some combination.\n" +
          "2. Pick ONE unknown to represent with a variable (very often the cost price - set it to 100 if no absolute values are given, since percentages then read off directly).\n" +
          "3. Chain every percentage operation as a multiplier applied in the ORDER the question describes them - order matters when there's more than one operation.\n\n" +
          "### Practice now\n\n" +
          "Work the three linked questions in order: a plain profit % calculation, a markup-then-discount chain, and the equal-profit-equals-loss shortcut. Try solving the third one both the long way (equation) and the shortcut way, and confirm they agree.",
        questionIds: ["seed-apt-008", "seed-apt-009", "seed-apt-010"],
      },
      {
        id: "aptitude-day-4",
        title: "Averages & Compound Interest - totals beat averages, and CI beats SI by compounding",
        day: 4,
        contentMarkdown:
          "## Averages: always convert to totals first\n\n" +
          "The single biggest time-saver in average questions is refusing to work with the average directly and instead converting immediately to a TOTAL: `total = average × count`. Take a question like \"the average of 5 numbers is 27; if one is excluded the average of the remaining 4 becomes 25 - find the excluded number.\" Working with averages directly invites algebra mistakes. Working with totals is one line: total of all 5 = 5 × 27 = 135; total of remaining 4 = 4 × 25 = 100; excluded number = 135 − 100 = 35. Whenever a question mixes averages of different-sized groups, this totals-first habit removes almost all the difficulty.\n\n" +
          "### Compound interest: it's simple interest PLUS interest-on-interest\n\n" +
          "Simple interest only ever earns interest on the original principal: `SI = P × R × T / 100`. Compound interest, in contrast, earns interest on the ACCUMULATED amount (principal + all previously earned interest), which is why it grows faster. The direct formula is `Amount = P × (1 + R/100)^T`, and `CI = Amount − P`.\n\n" +
          "For a concrete feel: ₹10,000 at 10% per annum for 2 years. Simple interest would give a flat ₹1,000 each year - ₹2,000 total. Compound interest gives ₹1,000 in year 1 (bringing the amount to ₹11,000), then in year 2 you earn 10% of the FULL ₹11,000, i.e. ₹1,100 - a total of ₹2,100. The extra ₹100 over simple interest is interest earned ON the first year's interest. In general, for exactly 2 years, `CI − SI = P × (R/100)²` - a handy shortcut for quick mental checks when R and T are small.\n\n" +
          "### When to reach for compounding vs a flat rate\n\n" +
          "Bank fixed deposits, population growth, and depreciating asset values in real placement-style questions are almost always compound-interest scenarios (the base changes every period), while simple loan-interest questions where a fixed sum is quoted \"per year\" on the ORIGINAL principal are simple interest. Reading which base each period's interest is calculated on is the entire skill here.\n\n" +
          "### A quick sanity check\n\n" +
          "For small rates and short durations, CI and SI are close but CI is always slightly larger (for T > 1) - if your CI answer comes out smaller than the equivalent SI, you've made an arithmetic error somewhere.\n\n" +
          "### Practice now\n\n" +
          "Work through the two linked questions - one on the totals-first averages technique, one applying the compound interest formula directly.",
        questionIds: ["seed-apt-011", "seed-apt-012"],
      },
      {
        id: "aptitude-day-5",
        title: "Time & Work, Probability and Number System - the closing sprint",
        day: 5,
        contentMarkdown:
          "## Time & Work: convert everyone to a RATE, then add rates\n\n" +
          "If A finishes a job in 12 days, A's RATE of work is `1/12` of the job per day. Rates from different workers ADD when they work together: if B takes 18 days (rate `1/18`), together their combined rate is `1/12 + 1/18`. Using a common denominator (LCM of 12 and 18 is 36): `3/36 + 2/36 = 5/36` of the job per day, so together they finish in `36/5 = 7.2` days. A faster variant of this same idea: pretend the total work is exactly `LCM(12, 18) = 36` \"units\". Then A does `36/12 = 3` units/day and B does `36/18 = 2` units/day - together 5 units/day, so `36 ÷ 5 = 7.2` days. This LCM-as-total-work trick avoids fractions entirely and is much faster under time pressure.\n\n" +
          "### The \"pairs\" trick for three-worker problems\n\n" +
          "When a question gives you PAIR combinations instead of individuals - \"A and B together take 12 days, B and C take 15 days, A and C take 20 days\" - add all three pair-rates together. Each individual's rate gets counted exactly TWICE in that sum (once in each pair they belong to), so the sum equals `2 × (A + B + C)`. Halve it to get the combined rate of all three together, then invert to get the number of days.\n\n" +
          "### Probability: count favourable outcomes carefully\n\n" +
          "For two dice, always count ORDERED pairs - (3, 6) and (6, 3) are two DIFFERENT outcomes, because the two dice are physically distinct objects, even though the numbers shown look symmetric. There are 36 equally likely ordered outcomes in total (6 × 6). For a sum of 9, the favourable ordered pairs are (3,6), (4,5), (5,4), (6,3) - four outcomes - giving a probability of `4/36 = 1/9`. Treating (4,5) and (5,4) as the same outcome and getting `2/36` instead is the single most common dice-probability mistake.\n\n" +
          "### Number system: divisibility and remainders\n\n" +
          "A frequently tested question type: \"find the largest n-digit number divisible by k.\" The method: take the largest n-digit number, divide by k, note the REMAINDER, and subtract that remainder from the number - what's left is guaranteed divisible by k (since you removed exactly the \"extra\" part that broke divisibility). For the smallest n-digit number divisible by k, instead subtract the remainder and then add k.\n\n" +
          "### Practice now\n\n" +
          "The four linked questions close out the week: a two-worker time-and-work problem, the three-worker pairs trick, a two-dice probability question, and a divisibility question. Together they round out the topic list most placement papers actually test.",
        questionIds: ["seed-apt-013", "seed-apt-014", "seed-apt-015", "seed-apt-016"],
      },
    ],
  },
  {
    id: "seed-course-dsa",
    title: "DSA Foundations Week",
    category: "dsa",
    description:
      "Five days covering the data-structures theory that shows up in every technical MCQ round: complexity analysis, arrays and linked lists, sorting, trees, and hashing/graphs/heaps. Built for students who need the CONCEPTS clean before they start solving coding problems.",
    order: 2,
    published: true,
    lessons: [
      {
        id: "dsa-day-1",
        title: "Complexity Analysis & Arrays - measuring \"how fast\" and \"how much memory\"",
        day: 1,
        contentMarkdown:
          "## Why Big-O exists\n\n" +
          "Big-O notation describes how an algorithm's running time (or memory use) GROWS as the input size `n` grows - it deliberately ignores constant factors and lower-order terms, because what matters for large inputs is the dominant trend, not the exact operation count. `O(n)` means running time roughly doubles when `n` doubles; `O(n²)` means it roughly QUADRUPLES; `O(log n)` barely grows at all even for huge `n`.\n\n" +
          "### Binary search: the canonical O(log n) algorithm\n\n" +
          "Binary search on a SORTED array halves the remaining search space with every single comparison - check the middle element, and discard either the left or right half entirely. Starting from `n` elements, after `k` halvings you have `n / 2^k` elements left, so you need only about `log₂ n` comparisons to get down to one element. Two conditions are mandatory for binary search to work at all: the data must be SORTED, and you need O(1) random access to any index (which is why binary search works beautifully on arrays but is awkward and pointless on a plain linked list - walking to the middle would itself cost O(n)).\n\n" +
          "### Arrays: the power (and limits) of contiguous memory\n\n" +
          "An array stores its elements in one contiguous block of memory, so the computer can jump straight to any index with simple arithmetic: `address = base_address + index × element_size`. That's a single calculation regardless of how large the array is - hence O(1) random access, the array's defining advantage. The price for this is that INSERTING or DELETING in the middle of an array is expensive (O(n)), because every element after the insertion point must physically shift over to keep the memory contiguous. This tradeoff - fast access, slow insertion in the middle - is the array's whole personality, and it's exactly what a linked list flips around (slow access, fast insertion).\n\n" +
          "### Reading recurrence relations (a preview)\n\n" +
          "Some algorithms (especially the divide-and-conquer ones you'll meet later this week) don't have an obvious closed-form running time - instead you get a RECURRENCE like `T(n) = 2T(n/2) + n`, read as \"solve two half-size subproblems, then do O(n) extra work to combine them.\" The Master Theorem is the standard tool for converting such a recurrence directly into Big-O without expanding it by hand every time - you'll see it applied to merge sort's recurrence specifically later this week.\n\n" +
          "### Practice now\n\n" +
          "The three linked questions cover binary search's complexity, array index access, and reading a Master-Theorem recurrence - the theoretical backbone the rest of the week builds on.",
        questionIds: ["seed-dsa-001", "seed-dsa-002", "seed-dsa-013"],
      },
      {
        id: "dsa-day-2",
        title: "Linked Lists & Stacks - pointer-based structures and LIFO order",
        day: 2,
        contentMarkdown:
          "## Linked lists: the pointer trade-off\n\n" +
          "A singly linked list stores each element in its own node, alongside a pointer to the NEXT node - there is no contiguous memory block, so there is no O(1) random access by index (you must walk from the head, node by node, costing O(n) to reach position `i`). What you gain in exchange is CHEAP insertion: to insert a new node at the FRONT of the list (given just the head pointer), you create the node, point its `next` at the current head, and update the head pointer to the new node - three constant-time steps, O(1) total, with no shifting of any other element. Compare this to inserting at the front of an ARRAY, which is O(n) because every existing element must shift right by one slot to make room. This exact trade-off - arrays fast to access/slow to insert, linked lists slow to access/fast to insert (at known positions) - is the central theme connecting yesterday's lesson to today's.\n\n" +
          "### Stacks: Last-In-First-Out, and why function calls need one\n\n" +
          "A stack supports exactly two operations at one end: `push` (add) and `pop` (remove the most-recently-added item) - Last-In-First-Out (LIFO) order. The most important real-world example is how every programming language runtime manages function calls: when function A calls function B, an \"activation record\" (holding B's local variables and its return address) is PUSHED onto the call stack; when B returns, its record is POPPED off and control resumes exactly where A left off. Recursion is just repeated self-calls, each pushing another activation record - which is precisely why runaway/infinite recursion crashes with a \"stack overflow\": the stack of activation records grows until it exhausts its allotted memory.\n\n" +
          "### Evaluating postfix expressions with a stack\n\n" +
          "A classic stack application: evaluating a postfix (Reverse Polish) expression like `5 3 + 8 2 − *`. Scan left to right - push every number you see, and whenever you hit an OPERATOR, pop the top two numbers, apply the operator, and push the result back. For `5 3 + 8 2 − *`: push 5, push 3, see `+` → pop 3 and 5, push `5+3=8`; push 8, push 2, see `−` → pop 2 and 8, push `8−2=6`; finally see `*` → pop 6 and 8, push `8×6=48`. The subtlety to watch: for non-commutative operators like `−` and `÷`, the SECOND value popped is the LEFT operand of the operation (here it's `8 − 2`, not `2 − 8`) - mixing up the pop order is the single most common mistake when evaluating postfix by hand.\n\n" +
          "### Practice now\n\n" +
          "The three linked questions cover linked-list front-insertion complexity, why the call stack is a stack, and tracing a postfix evaluation by hand - do the postfix one on paper, tracking the stack contents at every step.",
        questionIds: ["seed-dsa-003", "seed-dsa-004", "seed-dsa-014"],
      },
      {
        id: "dsa-day-3",
        title: "Sorting Algorithms - worst-case guarantees and stability",
        day: 3,
        contentMarkdown:
          "## Two questions every sorting algorithm answers differently\n\n" +
          "When comparing sorting algorithms, two properties matter far more than \"which one is fastest in general\": (1) what is the WORST-CASE time complexity, and (2) is the algorithm STABLE (does it preserve the relative order of equal elements)? Placement papers test both relentlessly, usually by asking you to pick the odd one out among several sorting algorithms.\n\n" +
          "### Worst-case complexity: merge sort's guarantee\n\n" +
          "Merge sort ALWAYS splits the array exactly in half, recursively sorts each half, and merges the two sorted halves in linear time - and critically, this split is always balanced regardless of the input's arrangement, so its worst-case complexity is a guaranteed `O(n log n)`, no exceptions. Quick sort, by contrast, also averages `O(n log n)` but can degrade to `O(n²)` in the worst case if the chosen pivot repeatedly produces a wildly unbalanced split (e.g. always picking the smallest or largest element as pivot on already-sorted input). Bubble sort and (plain) insertion sort are both `O(n²)` even on average - though it's worth remembering insertion sort actually runs in close to `O(n)` on NEARLY-sorted input, since each element only needs to shift a short distance, a fact placement papers love to sneak in as a follow-up twist.\n\n" +
          "### Stability: why it matters in practice\n\n" +
          "A sort is STABLE if two elements that compare as equal keep their original relative order after sorting. This matters enormously when you sort by one key and then need to sort AGAIN by a second key while preserving the first sort's ordering among ties - for example, sorting a student list by marks, and wanting students with equal marks to still appear in their original (say, alphabetical) order. Merge sort is stable because its merge step, on a tie, always takes from the LEFT half first - preserving original order. Quick sort, heap sort and selection sort all involve swapping elements across long distances in the array, which can and does scramble the relative order of equal elements, making all three UNSTABLE by default.\n\n" +
          "### A quick reference to keep in your head\n\n" +
          "Merge sort: O(n log n) worst case, stable, needs O(n) extra space. Quick sort: O(n log n) average but O(n²) worst case, in-place, NOT stable. Heap sort: O(n log n) worst case guaranteed, in-place, NOT stable. Bubble/insertion sort: O(n²) in general, but insertion sort is close to O(n) on nearly-sorted data; both ARE stable in their standard implementations.\n\n" +
          "### Practice now\n\n" +
          "Work through the two linked questions: one on identifying the best worst-case guarantee, one on identifying the stable sort among the options. Both are extremely common exact-wording placement questions.",
        questionIds: ["seed-dsa-005", "seed-dsa-006"],
      },
      {
        id: "dsa-day-4",
        title: "Trees & Binary Search Trees - structure, traversal and reconstruction",
        day: 4,
        contentMarkdown:
          "## Counting nodes: the geometric-series shortcut\n\n" +
          "In a FULL binary tree, level `L` (counting the root as level 0) can hold at most `2^L` nodes, since each node at the previous level can have up to 2 children. Summing every level from 0 to height `h` gives a geometric series: `2⁰ + 2¹ + ... + 2^h = 2^(h+1) − 1` - the maximum possible number of nodes in a binary tree of height `h`. Watch the height CONVENTION carefully: some textbooks count the root itself as height 1 rather than height 0, which shifts every formula by one - always check which convention a specific question is using before applying the formula blindly.\n\n" +
          "### Binary Search Trees: why inorder = sorted\n\n" +
          "A Binary Search Tree (BST) maintains one invariant at every single node: everything in its LEFT subtree is smaller, everything in its RIGHT subtree is larger. INORDER traversal visits nodes in the order left-subtree → node → right-subtree, and because of the BST invariant holding at every node recursively, this visiting order always produces the keys in ascending SORTED order - this isn't a coincidence, it's a direct consequence of the definition. This same fact gives you a free O(n) way to verify whether a given tree really is a valid BST: perform an inorder traversal and check the output is strictly increasing.\n\n" +
          "### Reconstructing a tree from two traversals\n\n" +
          "A favourite \"hard\" MCQ type gives you a tree's PREORDER and INORDER traversals and asks about the reconstructed tree's structure. The technique: the FIRST element of preorder is always the ROOT (since preorder visits node → left → right). Find that root's position in the INORDER list - everything to its LEFT in inorder belongs to the left subtree, everything to its RIGHT belongs to the right subtree. Now split the REMAINDER of the preorder list (after the root) into two chunks matching those subtree sizes - the first chunk (matching the left subtree's size) is the left subtree's preorder, the rest is the right subtree's preorder. You can recurse from there, but for MCQs you usually only need one level of this splitting to answer the question asked.\n\n" +
          "### A worked example, briefly\n\n" +
          "Given preorder `A B D E C F` and inorder `D B E A F C`: the root is `A` (first in preorder). In inorder, everything before `A` is `D B E` (left subtree, size 3) and everything after is `F C` (right subtree, size 2). Removing the 3 left-subtree nodes from the remaining preorder `B D E C F` leaves `C F` - the right subtree's preorder.\n\n" +
          "### Practice now\n\n" +
          "The three linked questions cover node-counting by height, the inorder-BST connection, and a full preorder/inorder reconstruction - work the reconstruction one on paper with a sketch of the tree.",
        questionIds: ["seed-dsa-007", "seed-dsa-008", "seed-dsa-009"],
      },
      {
        id: "dsa-day-5",
        title: "Hashing, Graphs & Heaps - the workhorses of technical interviews",
        day: 5,
        contentMarkdown:
          "## Hashing: average O(1), worst-case O(n)\n\n" +
          "A hash table's speed comes from spreading keys across many \"buckets\" using a hash function, so that on AVERAGE each bucket holds only a small, roughly constant number of items - giving average-case O(1) lookup, insertion and deletion. But this is a probabilistic guarantee, not an absolute one: if the hash function distributes keys poorly (or an adversary deliberately chooses keys that all collide into the same bucket), every key could end up in ONE bucket, degrading lookup to O(n) - you'd effectively be scanning a single long list. This average-vs-worst-case gap is exactly why interviewers ask for BOTH numbers together, and it's also why real hash table implementations use techniques like randomized hash seeds to make adversarial collisions harder to engineer.\n\n" +
          "### Graph traversal: BFS uses a queue, DFS uses a stack\n\n" +
          "Breadth-First Search (BFS) explores a graph LEVEL BY LEVEL - visit a node, then enqueue all of its unvisited neighbours, then dequeue the next node to visit. This First-In-First-Out behaviour is precisely what a QUEUE provides, which is why BFS is built around one. Depth-First Search (DFS), in contrast, dives as deep as possible down one path before backtracking - implemented either with an explicit STACK or (more commonly) via recursion, where the language's own call stack plays that role implicitly. One bonus fact worth remembering for interviews: BFS, because it explores level by level, is also the standard way to find SHORTEST paths in an unweighted graph - the first time you reach a node during a BFS is guaranteed to be via a shortest path to it.\n\n" +
          "### Heaps: O(log n) to remove the extreme, O(1) to peek at it\n\n" +
          "A binary min-heap keeps the SMALLEST element always at the root, but does NOT keep the rest of the elements fully sorted - it only maintains the weaker \"heap property\" (each parent ≤ its children). Because of this, merely PEEKING at the minimum (reading the root) is O(1) - no work required. But EXTRACTING the minimum (removing the root and restoring the heap property) costs O(log n): you move the last element to the root position, then \"sift it down\" by repeatedly swapping it with its smaller child until the heap property is restored - at most one swap per level, and a complete binary tree with `n` nodes has about `log₂ n` levels. Heaps are the standard engine behind priority queues, and behind efficient graph algorithms like Dijkstra's shortest path.\n\n" +
          "### Tying the week together\n\n" +
          "Notice the recurring theme across this whole week: nearly every data structure trades one operation's speed for another's - arrays (fast access, slow insertion) vs linked lists (slow access, fast insertion); hash tables (fast average case, weak worst case) vs BSTs (reliable O(log n) for both, when balanced); heaps (fast extremes, no full ordering) vs fully sorted structures. Recognising WHICH trade-off a question is really testing is more valuable than memorising formulas in isolation.\n\n" +
          "### Practice now\n\n" +
          "The three linked questions close the week: hash table average-case lookup, identifying BFS by its queue, and heap extract-min complexity.",
        questionIds: ["seed-dsa-010", "seed-dsa-011", "seed-dsa-012"],
      },
    ],
  },
];
