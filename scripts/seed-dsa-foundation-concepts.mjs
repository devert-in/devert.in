// Seeds the DSA concept lessons for the sheet sections that have NO matching
// problem category - the nine "EMPTY - needs authored content" rows that
// scripts/seed-devert-dsa-sheet.mjs reports.
//
// Seven of those nine are genuinely lesson-shaped (there is nothing to solve in
// "Language Collections & STL" - there is something to LEARN), so they become
// real concepts in dsaConceptTracks/dsa/concepts and the sheet section
// links them via conceptIds. The remaining two are deliberately left alone:
//
//   advanced       - a curated cross-topic problem set. Every published problem
//                    already sits in its own topic section, and re-listing some
//                    here would double-count them in the sheet's own totals.
//                    Needs genuinely NEW hard problems authored, not a re-slice.
//   mock-interviews- needs a timed mixed-set assessment runner, which is a
//                    feature, not content. Faking it with a plain problem list
//                    would misrepresent what it is.
//
// One concept doc per topic, with the teaching body shared and only
// `languageVariants[lang] = { code, notes }` differing per language - the model
// lib/dsaConcepts.js's conceptVariant() reads. Distinct doc ids + merge:true, so
// this never fights the rest of the catalog. Authoring format throughout:
// lib/lessonBlocks.js fences.
//
// Usage:
//   node scripts/seed-dsa-foundation-concepts.mjs            (dry run)
//   node scripts/seed-dsa-foundation-concepts.mjs --apply
import admin from "firebase-admin";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(join(__dirname, "service-account.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

const db = admin.firestore();
const apply = process.argv.includes("--apply");

const AUDIENCES = ["public", "legacy"];
const LANGS = ["java", "python"];
const C = (s) => "`" + s + "`";

// ---------------------------------------------------------------------------
// Shared narratives. Only code and language idioms differ per language, so the
// teaching is written once - see seed-dsa-concepts.mjs for the same split.
// ---------------------------------------------------------------------------

const BASICS = `
## What this section is actually for

You are not here to memorise syntax. You are here to stop syntax from being the
thing that costs you a problem you already knew how to solve.

::: story
Two people sit the same interview. Both spot that the answer is a hash map.
One spends four minutes remembering how to iterate a map and print the result.
The other writes it in twenty seconds and spends the four minutes explaining
their complexity. Same understanding. Very different outcome.
:::

## The five things you must be able to write without thinking

::: cards
Read input :: Numbers, lines, and a whole array, without looking it up.
Loop :: Forward, backward, and over two indices at once.
Branch :: Including the early return that removes a whole level of nesting.
Function :: Taking parameters, returning a value - not printing from inside.
Print :: A number, a list, and a formatted line.
:::

## Complexity, the short version

You will see O(n) long before you formally study it, so learn the reading now.

::: table What the notation means
Notation | Means | Rough feel at n = 1,000,000
O(1) | Fixed cost | Instant
O(log n) | Halving each step | ~20 steps
O(n) | One pass | Fine
O(n log n) | Sort, then a pass | Fine
O(n^2) | Every pair | Far too slow
:::

::: remember The only rule you need today
Count the loops that depend on the input size, and how deep they nest. Two
nested loops over n elements is O(n^2). One loop that halves the range is
O(log n). That covers most of what you will meet for a long while.
:::

::: checkpoint
A loop runs from 1 to n, and inside it another loop runs from 1 to n. What is
the complexity?
- ( ) O(n)
- (x) O(n^2)
- ( ) O(2n)
> Nesting multiplies. Sequential loops would add, and O(n) + O(n) is still O(n).
:::

::: mistake
- Printing from inside a helper instead of returning a value. It works for one
  test and then blocks you the moment the caller needs the number.
- Integer division surprising you. Check what your language does with 7/2 before
  you rely on it.
- Reading input the wrong shape - one line versus one token per line is the most
  common reason a correct algorithm scores zero.
:::

::: interview
Nobody is grading your syntax. But fluency buys you thinking time, and thinking
time is what is actually being graded. If you fumble the mechanics, you spend
your budget on the easy part.
:::

::: revision
Be fluent in input, loops, branches, functions and output. Learn to count nested
loops. That is the whole of this section.
:::
`.trim();

const LOGICAL = `
## The gap nobody teaches

Most people who "can't do DSA" can code perfectly well. What they cannot do is
turn an English paragraph into a sequence of steps. That is a separate,
learnable skill, and this is where you learn it.

::: analogy Giving directions
"Get to the station" is a goal, not instructions. "Left at the lights, past the
bakery, second right" is instructions. A problem statement hands you a goal.
Your job is to produce the instructions before you write any code.
:::

## The routine

::: flow
Restate it in your own words -> Do one example BY HAND -> Notice what you did -> Write that down as steps -> Only then code
:::

Step three is the one everybody skips, and it is the one that matters. When you
solve an instance by hand, you already used an algorithm. Catching yourself doing
it is the whole trick.

::: reveal Worked example: "find the second largest number"
Do it by hand on ${C("[3, 9, 4, 9, 1]")}. What did you actually do?

You kept two things in your head - the biggest so far, and the runner-up. When
you met 9 you pushed the old biggest down into the runner-up slot.

That is the algorithm. One pass, two variables. You did not sort. You did not
compare every pair. Notice also what your hand did with the *second* 9: you
probably ignored it. That instinct is the edge case the problem is really testing.
:::

## Invariants: the idea that makes loops provable

An invariant is something true before the loop, true after every iteration, and
therefore true at the end.

For second-largest: *"best and second are the two largest values seen so far."*
If that holds every iteration, it holds at the end - which is the answer. Being
able to say your invariant out loud is what separates "I think this works" from
"this works".

::: checkpoint
You are asked for the longest run of equal numbers. What is the natural
invariant?
- ( ) The array is sorted so far
- (x) currentRun is the run ending at i, and best is the longest run seen so far
- ( ) Every pair has been compared
> Naming what your two variables mean at every step IS the invariant, and it
> makes the update rule obvious.
:::

::: mistake
- Coding before doing one example by hand. You end up debugging your
  understanding through the compiler, which is the slowest possible way.
- Forgetting the boring inputs: empty, one element, all-equal, already-sorted,
  negatives. Most wrong answers die here, not on the clever case.
- Confusing "it passed the sample" with "it is correct".
:::

::: interview
Say your invariant out loud. "I'll keep the best window so far, and this stays
true because..." is the single most senior-sounding thing you can do, and it
often gets you a nudge instead of a rejection when you drift.
:::

::: revision
Restate, hand-solve, notice, write steps, then code. Name your invariant. Test
the boring inputs first.
:::
`.trim();

const PATTERNS = `
## Why pattern printing is not a waste of time

It looks like a toy. It is actually the cheapest possible drill for the one skill
every array, matrix, grid and DP problem needs: reasoning about what an index
means at a given moment.

::: story
Nobody will ever ask you to print a triangle of stars in an interview. But the
person who has printed thirty of them never hesitates over "does this loop run
i times or i+1 times", and the person who hasn't loses a minute to it every
single time.
:::

## The one question

For every pattern, ask only: **for row i, what do I print, and how many?**

::: table Reading a pattern
Row i (0-based) | Spaces | Stars | Gives
0 | n-1 | 1 | a centred pyramid
1 | n-2 | 3 |
i | n-1-i | 2i+1 |
:::

Once that table exists, the code writes itself. The mistake is trying to write
the loops first and then working out the counts by trial and error.

::: flow
Draw 4 rows on paper -> Count spaces and stars per row -> Express both in terms of i -> Write the loops
:::

::: checkpoint
For a left-aligned triangle where row 0 has 1 star, how many stars are on row i
(0-based)?
- (x) i + 1
- ( ) i
- ( ) 2i + 1
> Row 0 has 1, row 1 has 2. Off-by-one here is exactly the habit this drill
> exists to kill.
:::

::: mistake
- Mixing 0-based and 1-based within one pattern. Pick one and write it down.
- Forgetting the newline, or printing it inside the inner loop.
- Guessing the counts instead of deriving them from i.
:::

::: revision
Every pattern is "for row i: how many, of what". Derive the count as a formula
in i before writing a single loop.
:::
`.trim();

const COLLECTIONS = `
## The structures you will actually reach for

You will implement a linked list once, to understand it. You will *use* a hash
map in a hundred problems. This section is about the second thing.

::: analogy A toolbox
You do not forge a spanner before every repair. You learn which spanner is
already in the box, and what each one is good at. Knowing that a set gives you
O(1) membership and a sorted map gives you "nearest key above" is worth more in
an interview than being able to hand-roll either.
:::

## Choose by the question you are asking

::: cards
Do I have this? :: A set. O(1) membership, no duplicates.
How many of this? :: A map from value to count. The single most useful structure in all of DSA.
What is the smallest/largest right now? :: A heap / priority queue. O(log n) push and pop.
What did I see most recently? :: A stack. Undo, matching brackets, monotonic tricks.
What arrived first? :: A queue. BFS is a queue with a visited set, and nothing more.
Both ends? :: A deque. Sliding-window maximum lives here.
Ordered keys, with range queries? :: A sorted map / tree map. Floor, ceiling, and in-order iteration.
:::

::: remember The complexity you must know cold
Hash-based set and map: O(1) average for insert, lookup, delete - but no order.
Tree-based: O(log n) for the same, and ordered. Choosing hash when you need
order, or tree when you only need membership, is a real and common mistake.
:::

::: checkpoint
You need the most frequent element in an array. Which structure?
- (x) A map from value to count, then one pass over its entries
- ( ) A sorted list, then scan for the longest run
- ( ) A stack
> Sorting works and costs O(n log n). Counting costs O(n). Both are "right";
> only one is the answer they want.
:::

::: mistake
- Iterating a hash map and expecting a stable or sorted order. It is not
  guaranteed, and code that relies on it passes locally and fails elsewhere.
- Mutating a collection while iterating it.
- Reaching for a heap when you only need the single max - one pass and a variable
  is simpler and faster.
:::

::: interview
Saying "I'll use a frequency map" is fine. Saying "I'll use a frequency map, so
it's O(n) time and O(k) space where k is the number of distinct values" is the
answer. Always name the space cost too - it is the half people forget.
:::

::: revision
Match the structure to the question: membership -> set, counting -> map,
extremes -> heap, recency -> stack, arrival order -> queue, ordered ranges ->
tree map.
:::
`.trim();

const BST = `
## One rule, and everything follows

A Binary Search Tree is a binary tree with a single promise:

> everything in the left subtree is smaller than this node; everything in the
> right subtree is larger.

That is it. Every BST operation is a consequence.

::: analogy A well-organised filing cabinet
Looking for "Mehta"? You do not read every folder. You open the middle drawer,
see "P", and know instantly to go left. Each decision throws away half of what
remains. That is O(log n) - as long as the cabinet is evenly filled.
:::

## Search, insert, delete

::: flow
Compare with node -> smaller? go left -> larger? go right -> equal? found
:::

Insert follows the identical path and puts the new node where the search would
have run out. Delete is the only fiddly one, and only in one case:

::: cards
Leaf :: Just remove it.
One child :: Splice the child up into its place.
Two children :: Replace its value with its in-order successor (the smallest node in the right subtree), then delete THAT node - which is guaranteed to have at most one child.
:::

::: remember In-order traversal of a BST is sorted
Left, node, right, gives you the values in ascending order. A huge number of BST
problems are just "do an in-order traversal and notice something" - k-th
smallest, validate a BST, find two nodes summing to a target.
:::

## The catch that makes balance matter

Insert 1, 2, 3, 4, 5 into an empty BST in that order. Every node goes right. You
have built a linked list with extra steps, and search is now O(n).

::: mistake
- Assuming O(log n). That is the BALANCED case. Sorted input produces the worst
  case, and sorted input is extremely common in the real world.
- Validating a BST by only comparing each node with its immediate children. That
  passes trees that are not BSTs - a node deep in the left subtree can still be
  larger than the root. Carry a (min, max) range down instead.
- Forgetting that duplicates need an explicit policy.
:::

::: interview
If you say "O(log n)", expect "and if I insert sorted data?". Get there first:
say "O(log n) when balanced, O(n) in the worst case, which is why AVL and
Red-Black trees exist". You do not need to implement a rotation - you need to
know why one exists.
:::

::: revision
Left smaller, right larger. In-order gives sorted. Delete-with-two-children uses
the in-order successor. O(log n) only if balanced.
:::
`.trim();

const ADVANCED_DP = `
## Same idea, harder state

Ordinary DP is "stop recomputing what you already worked out". Advanced DP is
exactly that - the difficulty is never the recursion, it is **choosing what the
state is**.

::: remember The only question that matters
"What do I need to know to solve the rest of the problem?" That answer, and
nothing more, is your state. Too little and it is wrong. Too much and it is too
slow.
:::

## Three shapes worth recognising

::: cards
DP on trees :: State is (node, something). You solve children first and combine upward - a post-order traversal that returns a small tuple instead of a single number. "Max path sum", "cover all nodes", "independent set on a tree".
Bitmask DP :: State includes a SET, encoded as bits of an integer. Only viable when n is tiny - about 20 - because the state space is 2^n. Travelling salesman, assignment problems, "visit every X exactly once".
Digit DP :: You build a number digit by digit, carrying (position, tight, extra). Answers "how many numbers below N satisfy P" without iterating to N.
:::

::: table Which shape a problem is
Signal in the statement | Shape
"tree", "each node has children" | DP on trees
n <= 20, "every subset", "visit all" | Bitmask
"count numbers from 1 to 10^18" | Digit DP
:::

That ${C("n <= 20")} constraint is not a coincidence. Constraints are a hint about
the intended complexity: 2^20 is about a million, which is fine. 2^40 is not.

::: checkpoint
A problem says n <= 18 and asks for the cheapest way to visit every city
exactly once. What should you reach for?
- (x) Bitmask DP over subsets of visited cities
- ( ) Greedy nearest-neighbour
- ( ) Plain DP on one index
> The tiny n is the tell. Greedy is not optimal for this, and one index cannot
> express "which cities have I already used".
:::

::: mistake
- A state that does not capture everything the rest of the decision depends on -
  the classic source of "it works on samples, fails on the fourth test".
- Recomputing instead of memoising, because the state is not hashable or the
  cache key omits part of the state.
- Bitmask DP with n = 40. Check 2^n against the time limit before you write it.
:::

::: interview
Say the state definition out loud FIRST, in words: "dp[node][0/1] is the best
answer for this subtree when the node is or isn't used." If the state is right,
the recurrence is usually mechanical - and the interviewer can correct a wrong
state in ten seconds, before you have wasted the whole slot on it.
:::

::: revision
The hard part is the state, never the recursion. Trees -> combine upward.
Tiny n + subsets -> bitmask. Counting up to a huge N -> digit DP. Read the
constraints as a hint.
:::
`.trim();

const SEGMENT_TREE = `
## The problem these solve

"Sum of the range [l, r]" is easy with a prefix-sum array: O(1) per query after
O(n) setup.

Now allow **updates**. One changed element invalidates the whole prefix array,
so every update costs O(n). With many updates and many queries, that dies.

::: analogy A company reporting structure
You want the total sales of one region. You do not ring every salesperson - you
ask a few managers whose numbers already summarise their teams. When one person's
figure changes, only their chain of managers needs updating, not everybody. That
is a segment tree: O(log n) per query AND per update.
:::

## The shape

::: flow
Leaves are the elements -> each internal node summarises its two children -> the root summarises everything
:::

A range query walks down and stops as soon as a node is entirely inside the
range - so it touches O(log n) nodes. An update walks from one leaf to the root,
fixing each ancestor: also O(log n).

::: table Picking the right tool
Need | Use | Update cost | Query cost
Range sum, no updates | Prefix sums | n/a | O(1)
Range sum, with updates | Fenwick (BIT) | O(log n) | O(log n)
Range min/max/gcd, with updates | Segment tree | O(log n) | O(log n)
Range update AND range query | Segment tree + lazy | O(log n) | O(log n)
:::

::: remember Fenwick vs segment tree
A Fenwick tree (Binary Indexed Tree) is shorter to write and uses less memory,
but really only handles invertible operations like sum. A segment tree is longer
but handles min, max, gcd, and assignment - anything you can merge. If you need
min with updates, it must be a segment tree.
:::

::: checkpoint
Many updates, and queries for the MINIMUM of a range. What do you use?
- (x) Segment tree
- ( ) Prefix sums
- ( ) Fenwick tree
> Prefix sums cannot handle updates, and min is not invertible so a plain Fenwick
> does not apply.
:::

::: mistake
- Reaching for one of these when the array never changes. Prefix sums are simpler
  and strictly faster - do not over-engineer.
- Forgetting lazy propagation when the problem updates a whole RANGE. Without it
  a range update is O(n log n) and you have gained nothing.
- Off-by-one between 0-based arrays and 1-based tree indices. Write the
  convention down before you start; this is where almost all the bugs are.
:::

::: interview
The insight they want is the trade: prefix sums are O(1) query but O(n) update,
segment trees make both O(log n). Say that sentence and you have shown you know
WHY the structure exists, which matters more than reciting the build function.
:::

::: revision
Static ranges -> prefix sums. Sums with updates -> Fenwick. Min/max/gcd with
updates -> segment tree. Range updates -> add lazy propagation. Everything is
O(log n).
:::
`.trim();

// ---------------------------------------------------------------------------
// Per-language code + idiom notes.
// ---------------------------------------------------------------------------

const CODE = {
  basics: {
    java: `import java.util.*;

public class Main {
    // The five mechanics, in one place, so you can stop looking them up.
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);

        // Read a count, then that many numbers into an array.
        // (Falls back to a fixed array if there is no input, so this runs as-is.)
        int[] nums = sc.hasNextInt() ? readArray(sc) : new int[]{3, 9, 4, 9, 1};

        System.out.println("count  = " + nums.length);
        System.out.println("sum    = " + sum(nums));
        System.out.println("max    = " + max(nums));
        System.out.println("array  = " + Arrays.toString(nums));
    }

    static int[] readArray(Scanner sc) {
        int n = sc.nextInt();
        int[] a = new int[n];
        for (int i = 0; i < n; i++) a[i] = sc.nextInt();
        return a;
    }

    // Return a value; never print from inside a helper.
    static int sum(int[] a) {
        int total = 0;
        for (int x : a) total += x;      // for-each when the index is not needed
        return total;
    }

    static int max(int[] a) {
        if (a.length == 0) return Integer.MIN_VALUE;   // handle empty explicitly
        int best = a[0];
        for (int i = 1; i < a.length; i++) {
            if (a[i] > best) best = a[i];
        }
        return best;
    }
}
`,
    python: `import sys


def read_array():
    """Read a count then that many ints. Falls back so this runs as-is."""
    data = sys.stdin.read().split()
    if not data:
        return [3, 9, 4, 9, 1]
    n = int(data[0])
    return [int(x) for x in data[1:1 + n]]


def total(nums):
    """Return a value; never print from inside a helper."""
    result = 0
    for x in nums:            # iterate values directly when the index is unused
        result += x
    return result


def largest(nums):
    if not nums:              # handle empty explicitly
        return None
    best = nums[0]
    for x in nums[1:]:
        if x > best:
            best = x
    return best


nums = read_array()
print("count  =", len(nums))
print("sum    =", total(nums))
print("max    =", largest(nums))
print("array  =", nums)
`,
  },
  collections: {
    java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        int[] nums = {4, 7, 4, 1, 7, 7, 9};

        // "Do I have this?" -> Set. O(1) membership.
        Set<Integer> seen = new HashSet<>();
        for (int x : nums) seen.add(x);
        System.out.println("distinct     = " + seen.size());

        // "How many of this?" -> frequency map. The workhorse of DSA.
        Map<Integer, Integer> freq = new HashMap<>();
        for (int x : nums) freq.merge(x, 1, Integer::sum);
        System.out.println("freq         = " + freq);

        int mostCommon = Collections.max(freq.entrySet(), Map.Entry.comparingByValue()).getKey();
        System.out.println("mostCommon   = " + mostCommon);

        // "Smallest right now?" -> PriorityQueue is a MIN-heap by default.
        PriorityQueue<Integer> minHeap = new PriorityQueue<>(List.of(5, 1, 9));
        System.out.println("heap poll    = " + minHeap.poll());
        // Max-heap needs an explicit comparator - a classic slip.
        PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Comparator.reverseOrder());
        maxHeap.addAll(List.of(5, 1, 9));
        System.out.println("maxHeap poll = " + maxHeap.poll());

        // Recency -> Deque as a stack. ArrayDeque, never the legacy Stack class.
        Deque<Integer> stack = new ArrayDeque<>();
        stack.push(1); stack.push(2);
        System.out.println("stack pop    = " + stack.pop());

        // Arrival order -> the same Deque as a queue. BFS lives here.
        Deque<Integer> queue = new ArrayDeque<>(List.of(1, 2, 3));
        System.out.println("queue poll   = " + queue.poll());

        // Ordered keys -> TreeMap gives floor/ceiling and sorted iteration.
        TreeMap<Integer, String> tree = new TreeMap<>();
        tree.put(10, "ten"); tree.put(20, "twenty");
        System.out.println("floorKey(15) = " + tree.floorKey(15));
    }
}
`,
    python: `from collections import Counter, defaultdict, deque
import heapq

nums = [4, 7, 4, 1, 7, 7, 9]

# "Do I have this?" -> set. O(1) membership.
seen = set(nums)
print("distinct     =", len(seen))

# "How many of this?" -> Counter is a frequency map with batteries included.
freq = Counter(nums)
print("freq         =", dict(freq))
print("mostCommon   =", freq.most_common(1)[0][0])

# defaultdict when you want to append without checking the key first.
groups = defaultdict(list)
for x in nums:
    groups[x % 3].append(x)
print("byRemainder  =", dict(groups))

# "Smallest right now?" -> heapq is a MIN-heap over a plain list.
heap = [5, 1, 9]
heapq.heapify(heap)
print("heap pop     =", heapq.heappop(heap))
# There is no max-heap: push negated values and negate on the way out.
maxheap = [-x for x in (5, 1, 9)]
heapq.heapify(maxheap)
print("maxHeap pop  =", -heapq.heappop(maxheap))

# Recency -> list as a stack (append/pop are both O(1) at the end).
stack = [1, 2]
print("stack pop    =", stack.pop())

# Arrival order -> deque. NEVER list.pop(0), which is O(n).
queue = deque([1, 2, 3])
print("queue popleft=", queue.popleft())
`,
  },
};

const NOTES = {
  basics: {
    java: `## Java specifics

::: tip
- ${C("Scanner")} is fine for interviews; for large competitive input use
  ${C("BufferedReader")} - ${C("Scanner")} is genuinely slow enough to time out.
- ${C("int")} overflows silently at about 2.1 billion. A sum of large values needs
  ${C("long")}. This is one of the most common wrong answers in all of DSA.
- ${C("7/2")} is ${C("3")} - integer division truncates. Use ${C("7/2.0")} for ${C("3.5")}.
- ${C("Arrays.toString(a)")} to print an array; plain ${C("System.out.println(a)")}
  prints a useless hash.
:::`,
    python: `## Python specifics

::: tip
- ${C("input()")} in a loop is slow for large input; read once with
  ${C("sys.stdin.read().split()")} and index into it.
- Integers never overflow - a real advantage over Java here.
- ${C("7/2")} is ${C("3.5")} and ${C("7//2")} is ${C("3")}. Mixing them up is the
  single most common Python slip in DSA.
- ${C("-7//2")} is ${C("-4")}, not ${C("-3")}: floor division rounds toward negative
  infinity. It bites when you compute a midpoint with negatives.
:::`,
  },
  logical: { java: "", python: "" },
  patterns: {
    java: `## Java specifics

::: tip
- ${C("System.out.print")} for no newline, ${C("println")} for one. Building a row
  with ${C("StringBuilder")} and printing once is far faster than printing per char.
- ${C('" ".repeat(n)')} beats a manual space loop and reads better.
:::`,
    python: `## Python specifics

::: tip
- ${C('print("*" * count)')} builds a whole row with no inner loop at all.
- ${C('print(x, end="")')} suppresses the newline.
- ${C('f"{\'\':>{n}}"')} right-pads to n spaces if you prefer formatting to
  multiplication.
:::`,
  },
  collections: {
    java: `## Java specifics

::: tip
- ${C("map.merge(k, 1, Integer::sum)")} is the cleanest frequency counter;
  ${C("getOrDefault")} is the older equivalent.
- ${C("PriorityQueue")} is a MIN-heap. A max-heap needs
  ${C("Comparator.reverseOrder()")} - forgetting this is a very common bug.
- Use ${C("ArrayDeque")} for both stacks and queues. The legacy ${C("Stack")} class
  is synchronised and iterates in a surprising order.
- ${C("TreeMap")} gives ${C("floorKey")}/${C("ceilingKey")} - the "nearest key" tool
  a ${C("HashMap")} simply cannot provide.
:::`,
    python: `## Python specifics

::: tip
- ${C("Counter")} and ${C("defaultdict(int)")} both count; ${C("Counter")} adds
  ${C("most_common()")} for free.
- ${C("heapq")} is a min-heap over a plain list. For a max-heap, push ${C("-x")}
  and negate on the way out.
- Use ${C("deque")} for queues. ${C("list.pop(0)")} is O(n) and silently turns an
  O(n) algorithm into O(n^2) - a top cause of "correct but too slow".
- Python has no built-in sorted map. Use ${C("bisect")} on a sorted list, or the
  third-party ${C("sortedcontainers")} where allowed.
:::`,
  },
  bst: { java: "", python: "" },
  advancedDp: { java: "", python: "" },
  segmentTree: { java: "", python: "" },
};

// ---------------------------------------------------------------------------

// One concept doc, not one per language: the teaching body is shared and each
// language contributes only `{ code, notes }` under languageVariants, which the
// concept page renders behind a language switcher (see conceptVariant() in
// lib/dsaConcepts.js). This is why authoring 30 topics across 5 languages is
// tractable at all - the expensive part is written once.
function variants(key) {
  const out = {};
  for (const langId of LANGS) {
    const code = CODE[key]?.[langId] || null;
    const notes = NOTES[key]?.[langId] || null;
    if (code || notes) out[langId] = { ...(code ? { code } : {}), ...(notes ? { notes } : {}) };
  }
  return out;
}

function concepts() {
  return [
    {
      id: "basics", title: "Learn the Basics", subtitle: "Stop syntax from costing you problems you already understand",
      order: 1, difficulty: "Beginner", estimatedMinutes: 25, prerequisites: [],
      concept: BASICS,
      languageVariants: variants("basics"),
      xpReward: 35, coinReward: 7, visualization: null,
      quiz: [
        { question: "Two loops, each from 1 to n, one nested inside the other. Complexity?",
          options: [{ id: "a", text: "O(n)" }, { id: "b", text: "O(n^2)" }, { id: "c", text: "O(2n)" }, { id: "d", text: "O(log n)" }],
          correctOptionIds: ["b"], explanation: "Nesting multiplies; sequential loops would add, and O(n)+O(n) is still O(n)." },
        { question: "Why return a value from a helper instead of printing inside it?",
          options: [{ id: "a", text: "Printing is slower" }, { id: "b", text: "So the caller can use the result" }, { id: "c", text: "It uses less memory" }, { id: "d", text: "No real difference" }],
          correctOptionIds: ["b"], explanation: "A helper that prints can only ever be used one way. Returning composes." },
      ],
    },
    {
      id: "logical-thinking", title: "Build Logical Thinking", subtitle: "Turning a paragraph into steps - the skill nobody teaches",
      order: 2, difficulty: "Beginner", estimatedMinutes: 30, prerequisites: ["basics"],
      concept: LOGICAL, languageVariants: {}, xpReward: 40, coinReward: 8, visualization: null,
      quiz: [
        { question: "What is an invariant?",
          options: [{ id: "a", text: "A variable that never changes" }, { id: "b", text: "Something true before the loop and after every iteration" }, { id: "c", text: "The loop counter" }, { id: "d", text: "A constant in the problem statement" }],
          correctOptionIds: ["b"], explanation: "That is exactly why it proves the result: if it holds at every step, it holds at the end." },
        { question: "What should you do before writing any code?",
          options: [{ id: "a", text: "Solve one example by hand and notice what you did" }, { id: "b", text: "Look up a similar solution" }, { id: "c", text: "Write the loops and adjust until samples pass" }, { id: "d", text: "Optimise for the largest input" }],
          correctOptionIds: ["a"], explanation: "Hand-solving reveals the algorithm you already used instinctively." },
      ],
    },
    {
      id: "patterns", title: "Patterns", subtitle: "The cheapest drill for index reasoning",
      order: 3, difficulty: "Beginner", estimatedMinutes: 20, prerequisites: ["basics"],
      concept: PATTERNS, languageVariants: variants("patterns"), xpReward: 30, coinReward: 6, visualization: null,
      quiz: [
        { question: "Left-aligned triangle, row 0 has 1 star. Stars on row i (0-based)?",
          options: [{ id: "a", text: "i" }, { id: "b", text: "i + 1" }, { id: "c", text: "2i + 1" }, { id: "d", text: "n - i" }],
          correctOptionIds: ["b"], explanation: "Row 0 has 1, row 1 has 2. Deriving it beats guessing." },
      ],
    },
    {
      id: "collections", title: "Language Collections & STL", subtitle: "Match the structure to the question you are asking",
      order: 4, difficulty: "Beginner", estimatedMinutes: 35, prerequisites: ["basics"],
      concept: COLLECTIONS,
      languageVariants: variants("collections"),
      xpReward: 50, coinReward: 10, visualization: null,
      quiz: [
        { question: "You need the most frequent element in an array. Best structure?",
          options: [{ id: "a", text: "A frequency map, then one pass over its entries" }, { id: "b", text: "Sort, then find the longest run" }, { id: "c", text: "A stack" }, { id: "d", text: "A min-heap" }],
          correctOptionIds: ["a"], explanation: "Counting is O(n); sorting is O(n log n). Both work, one is the answer." },
        { question: "You need membership checks AND sorted iteration. Which?",
          options: [{ id: "a", text: "Hash set" }, { id: "b", text: "Tree-based set/map" }, { id: "c", text: "Array" }, { id: "d", text: "Queue" }],
          correctOptionIds: ["b"], explanation: "Hash structures give O(1) but no order. Needing order means paying O(log n)." },
        { question: "Why is removing from the FRONT of a dynamic array/list a problem?",
          options: [{ id: "a", text: "It is O(n) - every remaining element shifts" }, { id: "b", text: "It corrupts the array" }, { id: "c", text: "It is not allowed" }, { id: "d", text: "It is O(log n)" }],
          correctOptionIds: ["a"], explanation: "This silently turns an O(n) algorithm into O(n^2). Use a deque for queues." },
      ],
    },
    {
      id: "bst", title: "Binary Search Trees", subtitle: "One ordering rule, and every operation follows",
      order: 120, difficulty: "Intermediate", estimatedMinutes: 30, prerequisites: ["binary-search"],
      concept: BST, languageVariants: {}, xpReward: 55, coinReward: 11, visualization: null,
      quiz: [
        { question: "What does an in-order traversal of a BST produce?",
          options: [{ id: "a", text: "Values in ascending order" }, { id: "b", text: "Values level by level" }, { id: "c", text: "Values in insertion order" }, { id: "d", text: "Leaves first" }],
          correctOptionIds: ["a"], explanation: "Left, node, right. A large family of BST problems is just this plus one observation." },
        { question: "You insert 1,2,3,4,5 in that order into an empty BST. Search cost?",
          options: [{ id: "a", text: "O(log n) - it is a BST" }, { id: "b", text: "O(n) - it degenerated into a list" }, { id: "c", text: "O(1)" }, { id: "d", text: "O(n log n)" }],
          correctOptionIds: ["b"], explanation: "Sorted input is the worst case. This is precisely why balanced trees exist." },
        { question: "Why is comparing each node only with its immediate children an invalid BST check?",
          options: [{ id: "a", text: "It is too slow" }, { id: "b", text: "A deep node can violate an ancestor's bound while satisfying its parent" }, { id: "c", text: "It fails on empty trees" }, { id: "d", text: "It only works on balanced trees" }],
          correctOptionIds: ["b"], explanation: "You must carry a (min, max) range down the recursion." },
      ],
    },
    {
      id: "advanced-dp", title: "Advanced DP", subtitle: "The hard part is the state, never the recursion",
      order: 140, difficulty: "Advanced", estimatedMinutes: 45, prerequisites: ["recursion"],
      concept: ADVANCED_DP, languageVariants: {}, xpReward: 80, coinReward: 16, visualization: null,
      quiz: [
        { question: "n <= 18, cheapest route visiting every city exactly once. Approach?",
          options: [{ id: "a", text: "Bitmask DP over subsets" }, { id: "b", text: "Greedy nearest neighbour" }, { id: "c", text: "Plain DP on one index" }, { id: "d", text: "Binary search" }],
          correctOptionIds: ["a"], explanation: "The tiny n is the tell: 2^18 states is affordable, and greedy is not optimal here." },
        { question: "What is the right test for whether your DP state is correct?",
          options: [{ id: "a", text: "It captures everything the rest of the decision depends on, and nothing more" }, { id: "b", text: "It uses as few variables as possible" }, { id: "c", text: "It fits in an array" }, { id: "d", text: "It passes the sample cases" }],
          correctOptionIds: ["a"], explanation: "Too little is wrong; too much is too slow. That balance IS the skill." },
      ],
    },
    {
      id: "segment-tree", title: "Segment & Fenwick Trees", subtitle: "Range queries when the data keeps changing",
      order: 150, difficulty: "Advanced", estimatedMinutes: 40, prerequisites: ["arrays"],
      concept: SEGMENT_TREE, languageVariants: {}, xpReward: 80, coinReward: 16, visualization: null,
      quiz: [
        { question: "Many updates, and queries for the MINIMUM of a range. Which structure?",
          options: [{ id: "a", text: "Segment tree" }, { id: "b", text: "Prefix sums" }, { id: "c", text: "Fenwick tree" }, { id: "d", text: "Hash map" }],
          correctOptionIds: ["a"], explanation: "Prefix sums cannot take updates, and min is not invertible so a plain Fenwick does not apply." },
        { question: "The array never changes and you only need range sums. Best choice?",
          options: [{ id: "a", text: "Prefix sums" }, { id: "b", text: "Segment tree" }, { id: "c", text: "Fenwick tree with lazy propagation" }, { id: "d", text: "Balanced BST" }],
          correctOptionIds: ["a"], explanation: "O(1) queries and trivial to write. Reaching for a tree here is over-engineering." },
        { question: "What does lazy propagation exist for?",
          options: [{ id: "a", text: "Making RANGE updates O(log n) instead of O(n log n)" }, { id: "b", text: "Reducing memory" }, { id: "c", text: "Handling duplicates" }, { id: "d", text: "Balancing the tree" }],
          correctOptionIds: ["a"], explanation: "Without it, updating a whole range costs a point-update per element and you have gained nothing." },
      ],
    },
  ];
}

// Validation against the LIVE catalog, not a hardcoded list. A prerequisite
// naming a concept that doesn't exist can never be completed, so it would lock
// the lesson permanently - lib/dsaConcepts.js ignores unknown prerequisites at
// runtime precisely so a typo degrades instead of dead-ending, but it should
// still be caught loudly HERE, where it can actually be fixed.
const TRACK_ID = "dsa"; // must match DSA_TRACK_ID in lib/dsaConcepts.js
const trackRef = db.collection("dsaConceptTracks").doc(TRACK_ID);

const track = await trackRef.get();
if (!track.exists) {
  console.error(`Track dsaConceptTracks/${TRACK_ID} does not exist. Seed the concept catalog first.`);
  process.exit(1);
}

const liveIds = (await trackRef.collection("concepts").get()).docs.map(d => d.id);
const all = concepts();
const knownIds = new Set([...liveIds, ...all.map(c => c.id)]);
const badPrereqs = all.flatMap(c => (c.prerequisites || [])
  .filter(p => !knownIds.has(p)).map(p => `${c.id} -> ${p}`));
if (badPrereqs.length) {
  console.error(`Unresolvable prerequisites (would lock the lesson): ${badPrereqs.join(", ")}`);
  process.exit(1);
}

// An order collision would make the roadmap sequence ambiguous (two lessons
// claiming the same slot sort by nothing in particular), so it is worth a loud
// warning rather than a silent shuffle.
const liveOrders = new Map();
for (const d of (await trackRef.collection("concepts").get()).docs) liveOrders.set(d.get("order"), d.id);
const clashes = all.filter(c => liveOrders.has(c.order) && liveOrders.get(c.order) !== c.id)
  .map(c => `${c.id}@${c.order} clashes with ${liveOrders.get(c.order)}`);
if (clashes.length) console.warn(`WARNING order clashes: ${clashes.join("; ")}\n`);

console.log(`Track ${TRACK_ID}: ${liveIds.length} existing concept(s). Prerequisites validated against ${knownIds.size} ids.\n`);

let written = 0;
for (const c of all) {
  const words = c.concept.split(/\s+/).length;
  const langs = Object.keys(c.languageVariants || {});
  console.log(`${apply ? "SET " : "PLAN"} ${c.id.padEnd(18)} order=${String(c.order).padStart(3)} `
    + `${String(words).padStart(4)} words, ${c.quiz.length} quiz Q(s)`
    + `${langs.length ? `, variants: ${langs.join("/")}` : ", language-agnostic"}`
    + `${c.prerequisites.length ? `, after ${c.prerequisites.join("+")}` : ""}`);
  if (apply) {
    await trackRef.collection("concepts").doc(c.id).set({
      ...c, status: "published", audiences: AUDIENCES,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
  }
  written++;
}

console.log(`\n${apply ? "Applied" : "Dry run"}: ${written} concept(s) into dsaConceptTracks/${TRACK_ID}.`);
if (!apply) console.log("Re-run with --apply to write.");
process.exit(0);
