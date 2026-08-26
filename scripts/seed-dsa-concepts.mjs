// Seeds the DSA Concepts catalog (dsaConceptTracks/{langId}/concepts/{conceptId}).
//
// This is the FIRST VERTICAL SLICE of the module: two concepts (Arrays ->
// Sliding Window) in two languages (Java, Python), authored end-to-end so the
// whole loop is real - story, analogy, visualization, runnable language-
// specific code, dry run, pattern triggers, common mistakes, interview notes,
// revision, an assessment quiz, prerequisite gating, and linked practice
// problems. Everything else in the roadmap is authored against this template.
//
// The lesson body is ONE string in `concept`, written in the existing Campus
// lesson format (lib/lessonBlocks.js) - `::: story`, `::: analogy`,
// `::: mistake`, `::: interview`, `::: revision`, `::: checkpoint`,
// `::: flow`, `::: table` are all already-supported variants, so none of this
// needs new renderer code. That is deliberate: authoring is the expensive part
// of this module, so it goes through the format every other Campus module
// already renders rather than inventing a parallel one.
//
// Concept -> problem linking is by `problemCategories`, matched live against
// each problem's existing CODELAB_CATEGORIES `category` value - never a
// duplicated tag list. See lib/dsaConcepts.js's header.
//
// Usage:
//   node scripts/seed-dsa-concepts.mjs            (dry run - prints a plan)
//   node scripts/seed-dsa-concepts.mjs --apply
import admin from "firebase-admin";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(join(__dirname, "service-account.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

const db = admin.firestore();
const apply = process.argv.includes("--apply");

// Must include an audience the reader actually has, or firestore.rules'
// contentReadable() hides the doc from every non-admin however "published" it
// says it is. 'legacy' is the fallback audience every real user carries today
// (see readerAud() in firestore.rules).
const AUDIENCES = ["public", "legacy"];

// ---------------------------------------------------------------------------
// Shared narrative. The story/analogy/complexity/mistakes of Sliding Window
// are language-INDEPENDENT, so they're composed once here and specialised per
// language below. Only the code, the dry run and the language-specific gotchas
// actually differ - which is also the honest answer to "how do we ever author
// 30 topics x 5 languages": most of a lesson is shared, and the per-language
// delta is the implementation, not the teaching.
// ---------------------------------------------------------------------------
const slidingWindowBody = (lang) => `
## Why brute force hurts

You are asked for the largest sum of any ${"`k`"} consecutive numbers in an array.

The obvious approach: look at every window, add up its ${"`k`"} numbers, keep the best.
That re-adds almost the same numbers over and over. For an array of 1,000,000
numbers and a window of 1,000, that is a billion additions.

::: story
Picture reading a long sentence through a cardboard tube.
To move one word to the right, you do **not** re-read the whole sentence.
You let one word fall off the left and let one new word in on the right.
That is the entire idea. You already understand a sliding window.
:::

::: analogy A train window
You are on a train, watching the landscape through a window.
The window never grows - the world moves through it.
When a new tree enters on the right, an old tree leaves on the left.
Your view updates with **two** small changes, not by re-scanning everything.
:::

## The mechanic

::: flow
Add the new right element -> Remove the old left element -> Record the answer -> Slide again
:::

The window carries a **running total**. Sliding it costs one addition and one
subtraction, no matter how wide the window is. The whole array is visited once.

::: remember The invariant
A sliding window works when the answer for a window can be **updated** from the
previous window in O(1) - instead of recomputed from scratch. If you can't
update it cheaply, it isn't a sliding-window problem.
:::

## Two shapes you must recognise

::: cards
Fixed window :: The size is given to you ("exactly k elements", "every substring of length 3"). Both edges move together, in lockstep. Every window is valid.
Variable window :: The size is whatever satisfies a condition ("longest substring without repeats", "smallest subarray with sum >= target"). The right edge expands greedily; the left edge only catches up when the window becomes invalid.
:::

The variable shape is where most people lose marks, because the left edge must
move in a ${"`while`"} loop, not an ${"`if`"} - one new element on the right can
invalidate several elements on the left at once.

::: checkpoint
An array of 100,000 numbers, window size 500. How many additions does a correct
sliding window perform, roughly?
- ( ) 50,000,000 - one pass per window
- (x) 100,000 - one per element, entering the window once
- ( ) 500 - one per window slot
> Each element enters the window exactly once and leaves exactly once. The cost
> is proportional to the array length, completely independent of the window size.
:::

## Recognising it in the wording

::: remember Trigger words
These phrases in a problem statement are near-certain sliding window:
- **contiguous** subarray, or **substring** (not *subsequence* - order-preserving
  gaps break the window entirely)
- **longest** / **shortest** / **maximum** / **minimum** ... satisfying a condition
- **exactly k** / **at most k** distinct values
- a **fixed-length** window ("every window of size k")
:::

The single most useful filter: the word *contiguous* (or *substring*). If the
elements are allowed to be non-adjacent, a window cannot model it - that is
usually Dynamic Programming or Two Pointers on a sorted array instead.

::: mistake Four ways this goes wrong
- Using ${"`if`"} instead of ${"`while`"} to shrink a variable window. One insertion can
  break the condition several times over.
- Recording the answer at the wrong moment - for a *longest* window record it
  **after** restoring validity; for a *shortest* record it **while** the window is
  still valid.
- Forgetting to remove the outgoing element's bookkeeping (its count, its sum)
  when the left edge moves. The window then silently describes elements it no
  longer contains.
- Assuming it works with negative numbers. "Smallest subarray with sum >= target"
  is **not** a sliding-window problem if values can be negative: shrinking no
  longer reliably reduces the sum. That needs prefix sums plus a deque.
:::

## Cost

::: table Complexity
Aspect | Cost | Why
Time | O(n) | Each element enters once and leaves once
Space | O(1) | A fixed window of size k needs only a running total
Space (distinct-count) | O(k) | A map/set holding the window's contents
:::

::: interview What to say out loud
State the brute force and its cost first, then say the words *"but each window
overlaps the previous one, so I can update instead of recompute"*. That single
sentence is what the interviewer is listening for - it shows you spotted the
redundancy, which is the actual insight being tested. Then confirm the edge
cases: is ${"`k`"} larger than the array? can values be negative? is the array empty?
:::

::: revision One-line summary
Keep a running answer for a contiguous range; move the right edge to grow it and
the left edge to fix it, updating in O(1) so the whole array is scanned once.
:::

${lang.notes}
`.trim();

const JAVA_CODE = `import java.util.*;

public class Main {
    // Fixed window: largest sum of exactly k consecutive elements.
    static int maxSum(int[] nums, int k) {
        if (nums.length < k) return 0;

        // Build the first window once.
        int windowSum = 0;
        for (int i = 0; i < k; i++) windowSum += nums[i];
        int best = windowSum;

        // Slide: one element in on the right, one out on the left.
        for (int right = k; right < nums.length; right++) {
            windowSum += nums[right] - nums[right - k];
            best = Math.max(best, windowSum);
        }
        return best;
    }

    // Variable window: longest substring with no repeated character.
    static int longestUnique(String s) {
        Map<Character, Integer> lastSeen = new HashMap<>();
        int best = 0, left = 0;

        for (int right = 0; right < s.length(); right++) {
            char c = s.charAt(right);
            // while, not if - the left edge may need several jumps.
            if (lastSeen.containsKey(c) && lastSeen.get(c) >= left) {
                left = lastSeen.get(c) + 1;
            }
            lastSeen.put(c, right);
            best = Math.max(best, right - left + 1);
        }
        return best;
    }

    public static void main(String[] args) {
        System.out.println(maxSum(new int[]{2, 1, 5, 1, 3, 2}, 3)); // 9
        System.out.println(longestUnique("abcabcbb"));              // 3
    }
}
`;

const PYTHON_CODE = `def max_sum(nums, k):
    """Fixed window: largest sum of exactly k consecutive elements."""
    if len(nums) < k:
        return 0

    # Build the first window once.
    window_sum = sum(nums[:k])
    best = window_sum

    # Slide: one element in on the right, one out on the left.
    for right in range(k, len(nums)):
        window_sum += nums[right] - nums[right - k]
        best = max(best, window_sum)
    return best


def longest_unique(s):
    """Variable window: longest substring with no repeated character."""
    last_seen = {}
    best = left = 0

    for right, ch in enumerate(s):
        # The left edge only ever moves forward, never back.
        if ch in last_seen and last_seen[ch] >= left:
            left = last_seen[ch] + 1
        last_seen[ch] = right
        best = max(best, right - left + 1)
    return best


print(max_sum([2, 1, 5, 1, 3, 2], 3))  # 9
print(longest_unique("abcabcbb"))       # 3
`;

const LANG_NOTES = {
  java: `## Java specifics

::: tip
- ${"`s.charAt(i)`"} is O(1) - but building substrings with ${"`s.substring()`"} inside the
  loop is O(n) each time and quietly turns your O(n) solution into O(n^2).
- Prefer ${"`int[]`"} over ${"`Integer[]`"} for the window's bookkeeping: autoboxing every
  count is a real cost in a tight loop.
- For a lowercase-only alphabet, ${"`new int[26]`"} beats a ${"`HashMap`"} outright - same
  O(1) lookup, no hashing, no boxing.
- Watch ${"`windowSum`"} overflowing ${"`int`"} on large inputs; use ${"`long`"} when the
  constraints allow big values.
:::`,
  python: `## Python specifics

::: tip
- ${"`sum(nums[:k])`"} is fine **once** to build the first window, but slicing inside
  the loop copies the window every iteration - that is the most common way a
  Python sliding window accidentally becomes O(n*k).
- ${"`collections.Counter`"} and ${"`defaultdict(int)`"} are the idiomatic window
  bookkeeping. Remember to ${"`del`"} a key when its count hits zero, or
  ${"`len(counter)`"} keeps counting characters the window no longer holds.
- ${"`enumerate()`"} gives you the right index and the element together, which keeps
  the loop readable.
- ${"`collections.deque`"} is the right tool the moment you need the window's
  max/min rather than its sum.
:::`,
};

const ARRAYS_BODY = `
## The one idea behind arrays

An array is a single block of memory holding equally-sized slots, back to back.

That is the whole definition - and every array superpower and every array
limitation follows from it.

::: analogy A street of identical houses
House numbers go 1, 2, 3... with no gaps. To visit house 47 you don't walk past
the first 46 - you know exactly where it is, because every house is the same
width and they start at a known point. That is O(1) indexing.

Now insert a new house in the middle of the street. Every house after it has to
be renumbered and physically moved. That is O(n) insertion.
:::

::: table What it costs
Operation | Cost | Why
Read/write by index | O(1) | address = start + index x slot size
Append (room left) | O(1) | write one slot past the end
Insert/delete in middle | O(n) | everything after it shifts
Search (unsorted) | O(n) | no shortcut but to look
:::

::: checkpoint
Why is reading ${"`nums[500]`"} no slower than reading ${"`nums[0]`"}?
- ( ) The CPU caches the whole array first
- (x) The address is computed by arithmetic, not by walking the elements
- ( ) Arrays are always sorted
> start + 500 x slotSize is one multiply and one add. Index size is irrelevant.
:::

::: mistake
- Off-by-one at the boundary: valid indices are ${"`0`"} to ${"`length - 1`"}. The
  last element is never ${"`nums[length]`"}.
- Assuming a "fixed-size" array grows. Appending past capacity means allocating a
  bigger block and copying - which is exactly what a dynamic list does for you.
- Modifying an array while iterating it, and being surprised by skipped elements.
:::

::: interview
Nearly every "optimise this" array question is really asking you to avoid a
second pass or a second array. Say your brute force, name its cost, then look for
redundant work between adjacent steps - that is the doorway to Two Pointers,
Prefix Sums and Sliding Window, all three of which are just arrays plus one idea.
:::

::: revision
Contiguous memory buys O(1) indexing and costs O(n) insertion. Everything else
about arrays is a consequence of that trade.
:::
`.trim();

// ---------------------------------------------------------------------------

const TRACKS = [
  { id: "java", label: "Java", order: 10 },
  { id: "python", label: "Python", order: 20 },
];

function conceptsFor(langId) {
  const code = langId === "java" ? JAVA_CODE : PYTHON_CODE;
  return [
    {
      id: "arrays",
      title: "Arrays",
      subtitle: "Contiguous memory, and everything that follows from it",
      order: 10,
      status: "published",
      audiences: AUDIENCES,
      difficulty: "Beginner",
      estimatedMinutes: 18,
      prerequisites: [],
      problemCategories: ["Arrays"],
      concept: ARRAYS_BODY,
      // videoUrl deliberately absent - the lesson must render a clean layout
      // with NO Watch section rather than an empty player. Adding a URL later
      // is a content edit, not a code change.
      codeExample: null,
      xpReward: 40,
      coinReward: 8,
      visualization: null,
      quiz: [
        {
          question: "What makes indexing into an array O(1)?",
          options: [
            { id: "a", text: "Arrays are kept sorted" },
            { id: "b", text: "The address is computed arithmetically from the index" },
            { id: "c", text: "The CPU caches every element up front" },
            { id: "d", text: "Each element stores a pointer to the next" },
          ],
          correctOptionIds: ["b"],
          explanation: "address = start + index x slotSize. One multiply, one add - independent of how large the index is.",
        },
        {
          question: "Inserting into the middle of an array is O(n) because:",
          options: [
            { id: "a", text: "The array must be re-sorted" },
            { id: "b", text: "Every element after the insertion point shifts" },
            { id: "c", text: "Arrays cannot be modified once created" },
            { id: "d", text: "The whole array is rehashed" },
          ],
          correctOptionIds: ["b"],
          explanation: "Contiguity is the constraint: to keep the slots adjacent, everything after the gap must move.",
        },
      ],
    },
    {
      id: "sliding-window",
      title: "Sliding Window",
      subtitle: "Update the answer instead of recomputing it",
      order: 20,
      status: "published",
      audiences: AUDIENCES,
      difficulty: "Intermediate",
      estimatedMinutes: 35,
      // Prerequisite gating is what makes this a roadmap rather than a list -
      // Sliding Window is meaningless before Arrays. Enforced client-side only
      // (see isConceptUnlocked): it is pedagogy, not a security boundary.
      prerequisites: ["arrays"],
      problemCategories: ["Sliding Window"],
      concept: slidingWindowBody({ notes: LANG_NOTES[langId] }),
      codeExample: { language: langId, code },
      xpReward: 60,
      coinReward: 12,
      // Drives the animated visualiser (components/campus/dsa-concept-viz.jsx).
      // Data, not code, so a future concept adds a visual by adding a field.
      visualization: { kind: "slidingWindow", array: [2, 1, 5, 1, 3, 2], windowSize: 3 },
      quiz: [
        {
          question: "Which phrase in a problem statement most strongly suggests a sliding window?",
          options: [
            { id: "a", text: "\"longest contiguous subarray satisfying...\"" },
            { id: "b", text: "\"any subsequence of the array\"" },
            { id: "c", text: "\"the k-th smallest element\"" },
            { id: "d", text: "\"count the distinct pairs\"" },
          ],
          correctOptionIds: ["a"],
          explanation: "Contiguous is the key word. A subsequence allows gaps, which a window cannot represent.",
        },
        {
          question: "Sliding a fixed window of size k one step to the right costs:",
          options: [
            { id: "a", text: "O(k) - the window is re-summed" },
            { id: "b", text: "O(1) - one addition and one subtraction" },
            { id: "c", text: "O(log k)" },
            { id: "d", text: "O(n)" },
          ],
          correctOptionIds: ["b"],
          explanation: "That O(1) update is the entire point - it is what turns O(n*k) into O(n).",
        },
        {
          question: "When shrinking a VARIABLE window, why must the left edge move in a while loop rather than an if?",
          options: [
            { id: "a", text: "To avoid an infinite loop" },
            { id: "b", text: "One new right element can invalidate several left elements at once" },
            { id: "c", text: "Because if statements cannot modify the index" },
            { id: "d", text: "It makes no difference in practice" },
          ],
          correctOptionIds: ["b"],
          explanation: "A single insertion can break the condition repeatedly, so the left edge may need several steps to restore validity.",
        },
        {
          question: "\"Smallest subarray with sum >= target\" where values may be NEGATIVE is not a sliding-window problem because:",
          options: [
            { id: "a", text: "Negative numbers cannot be summed" },
            { id: "b", text: "Shrinking the window no longer reliably reduces its sum" },
            { id: "c", text: "The window size is unknown" },
            { id: "d", text: "It requires sorting first" },
          ],
          correctOptionIds: ["b"],
          explanation: "The technique relies on monotonicity: shrink => smaller sum. Negatives destroy that, so it needs prefix sums plus a deque.",
        },
      ],
    },
  ];
}

let plannedTracks = 0, plannedConcepts = 0;

for (const track of TRACKS) {
  const trackRef = db.collection("dsaConceptTracks").doc(track.id);
  const trackDoc = {
    label: track.label, order: track.order,
    status: "published", audiences: AUDIENCES,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
  plannedTracks++;
  console.log(`${apply ? "SET " : "PLAN"} dsaConceptTracks/${track.id} (${track.label})`);
  if (apply) await trackRef.set(trackDoc, { merge: true });

  for (const concept of conceptsFor(track.id)) {
    plannedConcepts++;
    const words = (concept.concept || "").split(/\s+/).length;
    console.log(`  ${apply ? "SET " : "PLAN"} concepts/${concept.id} - "${concept.title}" `
      + `(${words} words, ${concept.quiz.length} quiz Qs, prereqs: ${concept.prerequisites.join(",") || "none"}`
      + `${concept.visualization ? ", visualised" : ""}${concept.codeExample ? ", runnable code" : ""})`);
    if (apply) {
      await trackRef.collection("concepts").doc(concept.id).set({
        ...concept,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
    }
  }
}

console.log(`\n${apply ? "Applied" : "Dry run"}: ${plannedTracks} track(s), ${plannedConcepts} concept(s).`);
if (!apply) console.log("Re-run with --apply to write.");
process.exit(0);
