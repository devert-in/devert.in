// Seeds the CORE SPINE of the DSA Concepts roadmap - the 9 concepts that
// follow Arrays -> Sliding Window (seeded by seed-dsa-concepts.mjs), taking the
// roadmap from "two techniques" to a genuinely walkable path:
//
//   arrays -> sliding-window        (part 1)
//   two-pointers, hashing, strings, binary-search, sorting, recursion,
//   linked-list, stacks, queues     (this file)
//
// The remaining topics (trees, heaps, graphs, greedy, backtracking, DP, bit
// manipulation, tries, math) are seed-dsa-concepts-part3.mjs, split the same
// way the DSA PROBLEM seeds in this directory already split into `-part2`
// files - one reviewable batch per run, not one 3000-line script.
//
// AUTHORING CONTRACT (matches part 1 exactly, verified against production):
//   - Lesson bodies go in `concept` as ONE string in the lib/lessonBlocks.js
//     format. Only the variants that file actually implements are used here:
//     story, analogy, table, checkpoint, mistake, interview, revision, tip.
//   - Bodies are LANGUAGE-INDEPENDENT and shared across both tracks. Only
//     `codeExample` differs per language - the same split part 1's header
//     argues for ("most of a lesson is shared; the per-language delta is the
//     implementation, not the teaching").
//   - `visualization` is null on every concept here. components/campus/
//     dsa-concept-viz.jsx implements exactly one kind today ("slidingWindow"),
//     so anything else would render an empty frame. Adding a visual later is a
//     field edit once that component learns a new kind.
//   - Concept -> problem linking is by `problemCategories`, matched live
//     against each problem's existing CODELAB_CATEGORIES `category`. Never a
//     duplicated tag list. Every category named below was verified present in
//     the live problem bank (545 published problems, 21 categories in use).
//   - `prerequisites` is what makes this a roadmap rather than a list, and is
//     enforced client-side only (isConceptUnlocked) - pedagogy, not security.
//
// Usage:
//   node scripts/seed-dsa-concepts-part2.mjs            (dry run - prints a plan)
//   node scripts/seed-dsa-concepts-part2.mjs --apply
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
// says it is. Identical to part 1.
const AUDIENCES = ["public", "legacy"];

const TRACKS = [
  { id: "java", label: "Java", order: 10 },
  { id: "python", label: "Python", order: 20 },
];

// Backticks inside these template literals have to be written as ${"`x`"} -
// same escape part 1 uses.
const C = (s) => "`" + s + "`";

// ---------------------------------------------------------------------------
// 30 - Two Pointers
// ---------------------------------------------------------------------------
const TWO_POINTERS_BODY = `
## The one idea

Two indices walking the same array, where the movement of each one is *justified*
by something you already know about the data.

That justification is the whole technique. Without it you are just writing a
nested loop with extra steps.

::: analogy Closing in from both ends
You are looking for two numbers in a **sorted** list that add to 100. You put a
finger on the smallest and a finger on the largest.

Their sum is 130 - too big. The only way to get smaller is to move the right
finger left, because the left finger is already on the smallest number available.

Sum is 80 - too small. Symmetrically, only the left finger can help.

Every comparison eliminates an entire row or column of the pairs you would have
checked by brute force. That is how O(n^2) becomes O(n).
:::

::: table The three shapes
Shape | Pointers start | Used for
Opposite ends | 0 and n-1 | pair sums in sorted data, palindromes, reversing
Same end, different speed | 0 and 0 | in-place removal, dedup, partitioning
Two sequences | 0 and 0 in each | merging, intersection of sorted lists
:::

::: checkpoint
Why does the opposite-ends version need the array sorted?
- ( ) Because comparisons are faster on sorted data
- (x) Because sortedness is what proves which pointer to move
- ( ) Because it uses binary search internally
> If the data is unsorted, "sum too big" tells you nothing about which side to
> move - the answer could be anywhere. Sortedness is the justification.
:::

::: mistake
- Sorting the array when the question wants **original indices**. Sort the
  (value, index) pairs, or use a hash map instead.
- Moving both pointers on the same step "to save time". You skip candidate pairs.
- Forgetting the ${C("left < right")} guard and letting the pointers cross, which
  double-counts the middle element.
- Using two pointers on unsorted data out of habit. Check the justification first.
:::

::: interview
Say the invariant out loud: "everything left of ${C("slow")} is already correct."
That single sentence is what interviewers are listening for - it proves you know
why the loop terminates with the right answer, not just that it happens to.
:::

::: revision
Two pointers is a nested loop where the data lets you throw away half the
remaining candidates at every comparison. No justification, no technique.
:::
`.trim();

const TWO_POINTERS_CODE = {
  java: `public class TwoPointers {

    // Opposite ends: does any pair in a SORTED array sum to target?
    static int[] pairSum(int[] nums, int target) {
        int left = 0, right = nums.length - 1;
        while (left < right) {
            int sum = nums[left] + nums[right];
            if (sum == target) return new int[]{left, right};
            // Sortedness is the justification for each move.
            if (sum < target) left++;
            else right--;
        }
        return new int[]{-1, -1};
    }

    // Same end, different speed: remove duplicates in place.
    // Invariant: everything at or before 'slow' is already deduped.
    static int dedupe(int[] nums) {
        if (nums.length == 0) return 0;
        int slow = 0;
        for (int fast = 1; fast < nums.length; fast++) {
            if (nums[fast] != nums[slow]) {
                slow++;
                nums[slow] = nums[fast];
            }
        }
        return slow + 1; // new length
    }

    public static void main(String[] args) {
        System.out.println(java.util.Arrays.toString(pairSum(new int[]{2, 7, 11, 15}, 18))); // [1, 2]
        System.out.println(dedupe(new int[]{1, 1, 2, 2, 2, 3}));                             // 3
    }
}
`,
  python: `def pair_sum(nums, target):
    """Opposite ends: does any pair in a SORTED array sum to target?"""
    left, right = 0, len(nums) - 1
    while left < right:
        total = nums[left] + nums[right]
        if total == target:
            return (left, right)
        # Sortedness is the justification for each move.
        if total < target:
            left += 1
        else:
            right -= 1
    return (-1, -1)


def dedupe(nums):
    """Same end, different speed: remove duplicates in place.

    Invariant: everything at or before 'slow' is already deduped.
    """
    if not nums:
        return 0
    slow = 0
    for fast in range(1, len(nums)):
        if nums[fast] != nums[slow]:
            slow += 1
            nums[slow] = nums[fast]
    return slow + 1  # new length


print(pair_sum([2, 7, 11, 15], 18))   # (1, 2)
print(dedupe([1, 1, 2, 2, 2, 3]))     # 3
`,
};

// ---------------------------------------------------------------------------
// 40 - Hashing
// ---------------------------------------------------------------------------
const HASHING_BODY = `
## The one idea

A hash map turns "have I seen this before?" from a search into a single lookup.

That is the entire reason it shows up in perhaps a third of all interview
solutions: it buys O(1) membership by spending O(n) memory.

::: story
The classic Two Sum question is the cleanest demonstration in all of DSA.

Brute force checks every pair: O(n^2). The insight is that while walking the
array you are not actually looking for *a pair* - you are looking for **one**
number, ${C("target - current")}, and you already know every number behind you.

So remember what you have passed in a map, and each element becomes one
question with an instant answer. One pass, O(n).
:::

::: analogy A guest list versus a queue
Finding a name on an unsorted printed list means reading it top to bottom.

A hash map is a cloakroom: the name itself tells you which hook to check. You go
straight to that hook. It does not matter whether ten coats are stored or ten
million - unless everyone's name lands on the same hook, which is exactly the
worst case below.
:::

::: table What it costs
Operation | Average | Worst | Note
Insert | O(1) | O(n) | worst case is every key colliding
Lookup | O(1) | O(n) | same reason
Delete | O(1) | O(n) | same reason
Ordered traversal | not supported | - | use a sorted structure for that
:::

::: checkpoint
You need the k most frequent elements. What does the map give you?
- ( ) The answer directly, because maps are sorted by value
- (x) The counts - which then need a heap or a sort to rank
- ( ) Nothing useful; this needs a different structure entirely
> Counting is the map's job. Ranking is not: a hash map has no order at all.
> Count first, then rank with a heap.
:::

::: mistake
- Using a mutable object as a key. Mutate it and its hash changes, so the entry
  becomes unreachable - still in memory, impossible to find.
- Expecting insertion or sorted order. If you need order, that is a different
  structure (or an explicitly ordered map variant).
- Counting frequencies and forgetting to remove a key when its count hits zero,
  so "how many distinct?" over-reports.
- Reaching for a map when a fixed-size array would do. For lowercase letters,
  ${C("int[26]")} is faster and simpler than any map.
:::

::: interview
When you say "I will use a hash map", immediately follow it with what the key is
and what the value is. "Key: the number I still need. Value: the index I saw it
at." Interviewers accept the approach the moment those two are concrete.
:::

::: revision
A hash map trades memory for the ability to answer "seen this?" instantly. It
has no order - counting is its job, ranking is not.
:::
`.trim();

const HASHING_CODE = {
  java: `import java.util.*;

public class Hashing {

    // Two Sum in one pass: the map holds "value -> index I saw it at".
    static int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> seen = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int need = target - nums[i];
            // Ask about the number we NEED, not the one we hold.
            if (seen.containsKey(need)) return new int[]{seen.get(need), i};
            seen.put(nums[i], i);
        }
        return new int[]{-1, -1};
    }

    // Frequency counting. Note the remove() - without it, size() would keep
    // counting characters the map no longer really holds.
    static boolean isAnagram(String a, String b) {
        if (a.length() != b.length()) return false;
        Map<Character, Integer> count = new HashMap<>();
        for (char c : a.toCharArray()) count.merge(c, 1, Integer::sum);
        for (char c : b.toCharArray()) {
            Integer n = count.get(c);
            if (n == null) return false;
            if (n == 1) count.remove(c);
            else count.put(c, n - 1);
        }
        return count.isEmpty();
    }

    public static void main(String[] args) {
        System.out.println(Arrays.toString(twoSum(new int[]{2, 7, 11, 15}, 9))); // [0, 1]
        System.out.println(isAnagram("listen", "silent"));                      // true
    }
}
`,
  python: `from collections import Counter


def two_sum(nums, target):
    """One pass: the map holds value -> index I saw it at."""
    seen = {}
    for i, value in enumerate(nums):
        need = target - value
        # Ask about the number we NEED, not the one we hold.
        if need in seen:
            return (seen[need], i)
        seen[value] = i
    return (-1, -1)


def is_anagram(a, b):
    """Counter does the bookkeeping; equality does the comparison."""
    if len(a) != len(b):
        return False
    return Counter(a) == Counter(b)


def first_unique(s):
    """Two passes: count everything, then find the first count of 1."""
    counts = Counter(s)
    for i, ch in enumerate(s):
        if counts[ch] == 1:
            return i
    return -1


print(two_sum([2, 7, 11, 15], 9))   # (0, 1)
print(is_anagram("listen", "silent"))  # True
print(first_unique("leetcode"))      # 0
`,
};

// ---------------------------------------------------------------------------
// 50 - Strings
// ---------------------------------------------------------------------------
const STRINGS_BODY = `
## The one idea

A string is an array of characters with a library attached. Every array
technique you already know applies - but one property changes the cost of
everything: in most languages a string is **immutable**.

::: story
A student writes a loop that builds a result string with ${C("result += ch")},
one character at a time, and cannot understand why it times out on a 100,000
character input.

Because the string is immutable, ${C("+=")} does not append. It **allocates a
brand-new string** and copies everything across. Character 50,000 copies 50,000
characters. The innocent-looking one-liner is O(n^2).

The fix is a mutable builder, joined once at the end. Same logic, O(n).
:::

::: analogy Carving versus assembling
An immutable string is carved in stone: to change one letter you carve a whole
new stone. Fine once, ruinous in a loop.

A builder is a row of loose letter tiles - push tiles on cheaply, then set them
in stone a single time when you are done.
:::

::: table The costs that matter
Operation | Cost | Watch out
Index a character | O(1) | same as any array
Concatenate in a loop | O(n^2) | the classic trap - use a builder
Substring | O(k) | copies k characters in most modern runtimes
Compare two strings | O(n) | not O(1) - it walks until a mismatch
Sort the characters | O(n log n) | the cheap anagram key
:::

::: checkpoint
Which is the reliable way to test whether two words are anagrams?
- ( ) Compare their lengths
- (x) Compare character counts, or compare their sorted forms
- ( ) Compare their hash codes
> Equal length is necessary but nowhere near sufficient. Counting is O(n);
> sorting is O(n log n) and easier to write. Equal hashes do not prove equality.
:::

::: mistake
- Building a string with ${C("+=")} inside a loop. The single most common
  accidental O(n^2) in interviews.
- Assuming one character equals one byte. Outside plain ASCII that is false, and
  reversing a string naively can corrupt multi-byte characters.
- Using ${C("==")} where the language compares references rather than contents.
- Writing your own palindrome check without deciding whether case and
  punctuation count. Ask before you code.
:::

::: interview
Most string questions are an array technique in disguise. "Longest substring
without repeats" is sliding window. "Group anagrams" is hashing with a sorted
key. Name the underlying technique first and the string part stops being scary.
:::

::: revision
A string is an array of characters, plus immutability. Build with a builder,
count with a map, and check whether the question means bytes or characters.
:::
`.trim();

const STRINGS_CODE = {
  java: `import java.util.*;

public class Strings {

    // The right way to build: one builder, one toString.
    static String reverseWords(String s) {
        String[] parts = s.trim().split("\\\\s+");
        StringBuilder out = new StringBuilder();
        for (int i = parts.length - 1; i >= 0; i--) {
            out.append(parts[i]);
            if (i > 0) out.append(' ');
        }
        return out.toString();
    }

    // Two pointers over a string, skipping anything that is not alphanumeric.
    static boolean isPalindrome(String s) {
        int left = 0, right = s.length() - 1;
        while (left < right) {
            while (left < right && !Character.isLetterOrDigit(s.charAt(left))) left++;
            while (left < right && !Character.isLetterOrDigit(s.charAt(right))) right--;
            if (Character.toLowerCase(s.charAt(left)) != Character.toLowerCase(s.charAt(right))) return false;
            left++;
            right--;
        }
        return true;
    }

    // Sorted characters as the anagram key - hashing plus strings.
    static Map<String, List<String>> groupAnagrams(String[] words) {
        Map<String, List<String>> groups = new HashMap<>();
        for (String w : words) {
            char[] key = w.toCharArray();
            Arrays.sort(key);
            groups.computeIfAbsent(new String(key), k -> new ArrayList<>()).add(w);
        }
        return groups;
    }

    public static void main(String[] args) {
        System.out.println(reverseWords("  the sky  is blue "));            // blue is sky the
        System.out.println(isPalindrome("A man, a plan, a canal: Panama")); // true
        System.out.println(groupAnagrams(new String[]{"eat", "tea", "tan"}));
    }
}
`,
  python: `from collections import defaultdict


def reverse_words(s):
    """split() already collapses runs of whitespace; join builds once."""
    return " ".join(reversed(s.split()))


def is_palindrome(s):
    """Two pointers, skipping anything that is not alphanumeric."""
    left, right = 0, len(s) - 1
    while left < right:
        while left < right and not s[left].isalnum():
            left += 1
        while left < right and not s[right].isalnum():
            right -= 1
        if s[left].lower() != s[right].lower():
            return False
        left += 1
        right -= 1
    return True


def group_anagrams(words):
    """Sorted characters as the key - hashing plus strings."""
    groups = defaultdict(list)
    for w in words:
        groups["".join(sorted(w))].append(w)
    return dict(groups)


print(reverse_words("  the sky  is blue "))          # blue is sky the
print(is_palindrome("A man, a plan, a canal: Panama"))  # True
print(group_anagrams(["eat", "tea", "tan"]))
`,
};

// ---------------------------------------------------------------------------
// 60 - Binary Search
// ---------------------------------------------------------------------------
const BINARY_SEARCH_BODY = `
## The one idea

Every comparison throws away half of what is left.

That is why 1,000,000 items take about 20 steps. But the real skill is not
searching a sorted array - it is *recognising* that a question is secretly
sorted.

::: story
"Given n piles of bananas and h hours, what is the smallest eating speed that
finishes them all in time?"

There is no array to search. But think about the answer space: if speed 8 works,
then 9, 10 and 11 all work. If 7 fails, so does 6.

So the answers form ${C("false false false true true true")} - sorted, without
anyone sorting anything. Binary search the **answer**, not the input, and check
each candidate with a helper. This is the single highest-value pattern in the
whole topic.
:::

::: analogy The dictionary
Nobody looks up "monotonic" by starting at page one. You open the middle, see
"K", and discard the first half without reading a word of it. Then the middle of
what remains. Six or seven opens for a thousand pages.
:::

::: table The two questions to ask
Question | What you need
Is the input sorted? | plain binary search over indices
Is the ANSWER monotonic? | binary search over the answer range + a feasibility check
:::

::: checkpoint
Why is ${C("mid = (low + high) / 2")} risky in a fixed-width integer language?
- ( ) It rounds the wrong way
- (x) ${C("low + high")} can overflow before the division happens
- ( ) It is slower than the alternative
> Use ${C("low + (high - low) / 2")}. Identical result, no overflow. This is a
> real bug that sat in production library code for years.
:::

::: mistake
- An off-by-one that makes the loop never terminate. Fix the invariant, not the
  symptom: decide once whether ${C("high")} is inclusive, and keep it that way.
- Using ${C("<")} where the invariant needs ${C("<=")}, so the final single
  candidate is never examined.
- Searching data that is not actually sorted by the key you compare on.
- Writing "find any match" when the question wants the **first** match.
  Duplicates need the loop that keeps going left after a hit.
:::

::: interview
Say the invariant before you write the loop: "the answer is always inside
${C("[low, high]")}." Then every line either preserves that or shrinks the range.
Almost all binary search bugs are a violated invariant, not a typo.
:::

::: revision
Binary search needs monotonicity, not an array. If "works at x" implies "works
at x+1", you can binary search the answer.
:::
`.trim();

const BINARY_SEARCH_CODE = {
  java: `public class BinarySearch {

    // Textbook form. high is INCLUSIVE - and stays inclusive throughout.
    static int find(int[] nums, int target) {
        int low = 0, high = nums.length - 1;
        while (low <= high) {
            int mid = low + (high - low) / 2; // never (low + high) / 2
            if (nums[mid] == target) return mid;
            if (nums[mid] < target) low = mid + 1;
            else high = mid - 1;
        }
        return -1;
    }

    // First index whose value is >= target ("lower bound"). The pattern behind
    // every "first/last occurrence" question: on a hit, keep looking LEFT.
    static int lowerBound(int[] nums, int target) {
        int low = 0, high = nums.length; // exclusive here, deliberately
        while (low < high) {
            int mid = low + (high - low) / 2;
            if (nums[mid] < target) low = mid + 1;
            else high = mid;
        }
        return low;
    }

    // Binary search over the ANSWER: smallest speed that clears the piles in h hours.
    static int minEatingSpeed(int[] piles, int h) {
        int low = 1, high = 0;
        for (int p : piles) high = Math.max(high, p);
        while (low < high) {
            int mid = low + (high - low) / 2;
            long hours = 0;
            for (int p : piles) hours += (p + mid - 1) / mid; // ceiling division
            if (hours <= h) high = mid;  // mid works, so nothing bigger is needed
            else low = mid + 1;
        }
        return low;
    }

    public static void main(String[] args) {
        System.out.println(find(new int[]{1, 3, 5, 7, 9}, 7));            // 3
        System.out.println(lowerBound(new int[]{1, 2, 2, 2, 3}, 2));      // 1
        System.out.println(minEatingSpeed(new int[]{3, 6, 7, 11}, 8));    // 4
    }
}
`,
  python: `def find(nums, target):
    """Textbook form. high is INCLUSIVE - and stays inclusive throughout."""
    low, high = 0, len(nums) - 1
    while low <= high:
        mid = low + (high - low) // 2
        if nums[mid] == target:
            return mid
        if nums[mid] < target:
            low = mid + 1
        else:
            high = mid - 1
    return -1


def lower_bound(nums, target):
    """First index whose value is >= target.

    The pattern behind every first/last occurrence question: on a hit,
    keep looking LEFT.
    """
    low, high = 0, len(nums)  # exclusive here, deliberately
    while low < high:
        mid = low + (high - low) // 2
        if nums[mid] < target:
            low = mid + 1
        else:
            high = mid
    return low


def min_eating_speed(piles, h):
    """Binary search over the ANSWER, not the input."""
    low, high = 1, max(piles)
    while low < high:
        mid = low + (high - low) // 2
        hours = sum(-(-p // mid) for p in piles)  # ceiling division
        if hours <= h:
            high = mid       # mid works, nothing bigger is needed
        else:
            low = mid + 1
    return low


print(find([1, 3, 5, 7, 9], 7))          # 3
print(lower_bound([1, 2, 2, 2, 3], 2))   # 1
print(min_eating_speed([3, 6, 7, 11], 8))  # 4
`,
};

// ---------------------------------------------------------------------------
// 70 - Sorting
// ---------------------------------------------------------------------------
const SORTING_BODY = `
## The one idea

You will almost never implement a sort in an interview. You will constantly
decide **whether to sort**, and that decision is worth more than the code.

Sorting costs O(n log n) once and can collapse an O(n^2) problem to O(n log n)
- or ruin a solution that needed the original order.

::: analogy Tidying before you search
Handed a thousand loose invoices and asked one question, you just look through
them. Asked forty questions, you sort them first - the sort pays for itself
after the second or third lookup.
:::

::: table What to actually remember
Algorithm | Time | Space | Stable | Why it matters
Merge sort | O(n log n) | O(n) | yes | the stable choice; basis of counting inversions
Quick sort | O(n log n) avg, O(n^2) worst | O(log n) | no | fast in practice; worst case on bad pivots
Heap sort | O(n log n) | O(1) | no | in-place guarantee, poor cache behaviour
Counting sort | O(n + k) | O(k) | yes | beats n log n when values are small integers
:::

::: story
"Sort an array of 0s, 1s and 2s." Reaching for a general sort gets O(n log n) and
a polite nod.

But the values are only ever three things - so no comparison sort is needed.
Three pointers partition the array in ONE pass, O(n), no extra memory. That is
the Dutch National Flag partition, and noticing that a *constraint* beats a
general algorithm is exactly the instinct interviews test.
:::

::: checkpoint
Sorting employees by salary, and equal salaries must keep their original order.
What do you need?
- ( ) Any sort, then reverse the ties
- (x) A stable sort
- ( ) Quick sort with a random pivot
> Stability means equal keys keep their relative order. Merge sort has it;
> quick sort and heap sort do not.
:::

::: mistake
- Sorting when the question needs original indices, and losing them.
- Assuming the language's default sort is stable. Some are, some are not.
- Comparators that are not consistent (${C("a<b")} and ${C("b<a")} both true) -
  some runtimes throw, others silently corrupt the order.
- Sorting numbers with a string comparator, giving 1, 10, 2. Very common when
  keys are strings that look like numbers.
- Paying O(n log n) for the k largest items when a heap does it in O(n log k).
:::

::: interview
Say the cost out loud: "sorting makes this O(n log n), which dominates the O(n)
pass afterwards." Then check yourself: is there a constraint - small range, only
k needed, already-partially-sorted - that makes the sort unnecessary?
:::

::: revision
Sorting is a decision, not a task. It costs O(n log n) and buys order; a tight
constraint on the values often buys the same thing for O(n).
:::
`.trim();

const SORTING_CODE = {
  java: `import java.util.*;

public class Sorting {

    // Dutch National Flag: sort 0s, 1s and 2s in ONE pass, no extra memory.
    // Invariant: [0,low) is 0s, [low,mid) is 1s, (high,end] is 2s.
    static void sortColors(int[] nums) {
        int low = 0, mid = 0, high = nums.length - 1;
        while (mid <= high) {
            if (nums[mid] == 0) swap(nums, low++, mid++);
            else if (nums[mid] == 1) mid++;
            // Do NOT advance mid here - the value swapped in is unexamined.
            else swap(nums, mid, high--);
        }
    }

    static void swap(int[] a, int i, int j) { int t = a[i]; a[i] = a[j]; a[j] = t; }

    // Sorting as a decision: sort by one key, keep the object intact.
    record Employee(String name, int salary) {}

    static List<Employee> bySalary(List<Employee> staff) {
        List<Employee> copy = new ArrayList<>(staff);
        // Collections.sort is a stable merge sort - equal salaries keep their order.
        copy.sort(Comparator.comparingInt(Employee::salary));
        return copy;
    }

    public static void main(String[] args) {
        int[] colors = {2, 0, 2, 1, 1, 0};
        sortColors(colors);
        System.out.println(Arrays.toString(colors)); // [0, 0, 1, 1, 2, 2]

        System.out.println(bySalary(List.of(
            new Employee("Asha", 50), new Employee("Bala", 40), new Employee("Chitra", 50))));
    }
}
`,
  python: `def sort_colors(nums):
    """Dutch National Flag: sort 0s, 1s and 2s in ONE pass, no extra memory.

    Invariant: [0,low) is 0s, [low,mid) is 1s, (high,end] is 2s.
    """
    low = mid = 0
    high = len(nums) - 1
    while mid <= high:
        if nums[mid] == 0:
            nums[low], nums[mid] = nums[mid], nums[low]
            low += 1
            mid += 1
        elif nums[mid] == 1:
            mid += 1
        else:
            # Do NOT advance mid - the value swapped in is unexamined.
            nums[mid], nums[high] = nums[high], nums[mid]
            high -= 1
    return nums


def by_salary(staff):
    """Python's sort is stable, so equal salaries keep their original order."""
    return sorted(staff, key=lambda e: e["salary"])


def top_k(nums, k):
    """Sorting costs O(n log n); a heap costs O(n log k). Prefer the heap."""
    import heapq
    return heapq.nlargest(k, nums)


print(sort_colors([2, 0, 2, 1, 1, 0]))  # [0, 0, 1, 1, 2, 2]
print(by_salary([{"name": "Asha", "salary": 50}, {"name": "Bala", "salary": 40}]))
print(top_k([5, 1, 9, 3, 7], 2))        # [9, 7]
`,
};

// ---------------------------------------------------------------------------
// 80 - Recursion
// ---------------------------------------------------------------------------
const RECURSION_BODY = `
## The one idea

Solve a problem by assuming you already have the answer to a smaller version of
the same problem.

That assumption feels like cheating. It is not - it is induction, and getting
comfortable with it is the gateway to trees, graphs, backtracking and dynamic
programming. Every one of those is recursion with a different shape.

::: story
To reverse a linked list recursively, you do **not** think about the whole list.

You say: "assume the rest of the list is already reversed." Now there is exactly
one job left - point the next node back at me, and null out my own next pointer.
Two lines.

The hard part was never the code. It was trusting the assumption.
:::

::: analogy Russian dolls
To count the dolls you do not need to see them all. Open one. If it is solid,
that is 1. Otherwise it is 1 plus however many are inside - and you trust that
counting *those* works the same way. Solid doll = base case.
:::

::: table The three things every recursion needs
Part | Question it answers | If you get it wrong
Base case | when do I stop? | infinite recursion, stack overflow
Recursive step | what smaller problem do I trust? | wrong answer
Progress | why is the input strictly smaller? | it never reaches the base case
:::

::: checkpoint
Naive recursive Fibonacci is exponential. Why?
- ( ) Function calls are slow
- (x) The same subproblems are recomputed over and over
- ( ) It recurses on two branches instead of one
> ${C("fib(5)")} computes ${C("fib(3)")} twice, ${C("fib(2)")} three times. The
> tree of calls has about 2^n nodes. Remembering answers is memoisation - and
> that is the entire step from recursion to dynamic programming.
:::

::: mistake
- No base case, or one that cannot be reached because the input is not shrinking.
- Recursion depth on large inputs. Most runtimes cap the stack in the low
  thousands; a 100,000-node list needs a loop, not recursion.
- Mutating shared state across branches and forgetting to undo it. That undo is
  the whole idea of backtracking.
- Recomputing the same subproblem. If the call tree overlaps, memoise.
:::

::: interview
State the recursion in one sentence before coding: "the max depth of a tree is
one plus the max depth of its deeper child." If you cannot say it in a sentence,
the code will not come out right either.
:::

::: revision
Base case, a strictly smaller subproblem, and trust. If subproblems repeat,
memoise - that is dynamic programming.
:::
`.trim();

const RECURSION_CODE = {
  java: `public class Recursion {

    // Three parts, visible: base case, smaller subproblem, trust.
    static int factorial(int n) {
        if (n <= 1) return 1;              // base case
        return n * factorial(n - 1);       // trust the smaller answer
    }

    // Naive: exponential, because subproblems repeat.
    static int fibSlow(int n) {
        if (n < 2) return n;
        return fibSlow(n - 1) + fibSlow(n - 2);
    }

    // Memoised: each n computed once. This one change is the step from
    // plain recursion to dynamic programming.
    //
    // long, not int: fib(50) is 12,586,269,025, which overflows a 32-bit int
    // and silently prints a negative number. Checking whether the ANSWER fits
    // the return type is part of getting a recursion right.
    static long fib(int n, Long[] memo) {
        if (n < 2) return n;
        if (memo[n] != null) return memo[n];
        return memo[n] = fib(n - 1, memo) + fib(n - 2, memo);
    }

    // "Assume the rest is already reversed" - then one pointer flip remains.
    static class Node { int val; Node next; Node(int v) { val = v; } }

    static Node reverse(Node head) {
        if (head == null || head.next == null) return head;
        Node newHead = reverse(head.next); // trust
        head.next.next = head;             // point the rest back at me
        head.next = null;                  // and I become the tail
        return newHead;
    }

    public static void main(String[] args) {
        System.out.println(factorial(5));               // 120
        System.out.println(fibSlow(20));                // 6765 (slowly)
        System.out.println(fib(50, new Long[51]));      // 12586269025 (instantly)

        Node head = new Node(1);
        head.next = new Node(2);
        head.next.next = new Node(3);
        for (Node n = reverse(head); n != null; n = n.next) System.out.print(n.val + " "); // 3 2 1
    }
}
`,
  python: `import sys
from functools import lru_cache


def factorial(n):
    """Three parts, visible: base case, smaller subproblem, trust."""
    if n <= 1:
        return 1                    # base case
    return n * factorial(n - 1)     # trust the smaller answer


def fib_slow(n):
    """Exponential, because subproblems repeat."""
    if n < 2:
        return n
    return fib_slow(n - 1) + fib_slow(n - 2)


@lru_cache(maxsize=None)
def fib(n):
    """One decorator turns exponential into linear. This is memoisation -
    the step from plain recursion into dynamic programming."""
    if n < 2:
        return n
    return fib(n - 1) + fib(n - 2)


def reverse(head):
    """'Assume the rest is already reversed', then one pointer flip remains."""
    if head is None or head.next is None:
        return head
    new_head = reverse(head.next)   # trust
    head.next.next = head           # point the rest back at me
    head.next = None                # and I become the tail
    return new_head


print(factorial(5))       # 120
print(fib_slow(20))       # 6765 (slowly)
print(fib(300))           # instant - but note the recursion limit below
print(sys.getrecursionlimit())  # ~1000: deep recursion needs a loop instead
`,
};

// ---------------------------------------------------------------------------
// 90 - Linked List
// ---------------------------------------------------------------------------
const LINKED_LIST_BODY = `
## The one idea

Nodes scattered anywhere in memory, each holding the address of the next.

Give up O(1) indexing; gain O(1) insertion and deletion **once you are holding
the right node**. That last clause is where most of the difficulty lives.

::: analogy A treasure hunt
An array is a street with numbered houses - go straight to number 47.

A linked list is a chain of clues: each location tells you where the next one
is. To reach the fifth clue you must visit four. But splicing a new clue in is
trivial - rewrite one note. No renumbering, no shifting.
:::

::: table Array versus linked list
Operation | Array | Linked list
Index | O(1) | O(n)
Insert/delete at front | O(n) | O(1)
Insert/delete given the node | O(n) | O(1)
Memory per element | just the value | value plus a pointer
Cache friendliness | excellent | poor - nodes are scattered
:::

::: story
Two pointers, one moving twice as fast as the other, is the technique that makes
linked lists interesting.

If there is a cycle, the fast pointer laps the slow one and they meet - no extra
memory needed. If there is no cycle, fast simply runs off the end.

The same trick finds the middle in one pass: when fast reaches the end, slow is
exactly halfway. It also finds the k-th from last, by starting fast k nodes
ahead. One idea, three classic questions.
:::

::: checkpoint
Why does a **dummy head** node simplify so many linked list solutions?
- ( ) It makes the list shorter to traverse
- (x) It removes the special case where the real head itself changes
- ( ) It is required for a doubly linked list
> Without one, "delete the first node" and "delete any other node" are different
> code paths. With one, every node has a predecessor and there is a single path.
:::

::: mistake
- Losing the rest of the list by reassigning ${C("next")} before saving it. Save
  the next pointer *first*, always.
- Dereferencing null at the end. Check ${C("fast != null && fast.next != null")}
  in that order - the order matters.
- Forgetting that the head can change, then returning a stale head. Use a dummy.
- Recursing on a very long list and overflowing the stack.
:::

::: interview
Draw it. Three boxes and arrows, and physically re-point them as you narrate.
Nobody solves reverse-a-sublist in their head, and interviewers expect the
drawing - working without one reads as guessing.
:::

::: revision
Pointers instead of contiguity: O(n) to find, O(1) to change. Fast/slow pointers
and a dummy head solve most of the classic questions.
:::
`.trim();

const LINKED_LIST_CODE = {
  java: `public class LinkedLists {

    static class Node {
        int val; Node next;
        Node(int v) { val = v; }
        Node(int v, Node n) { val = v; next = n; }
    }

    // Iterative reverse. Save 'next' BEFORE re-pointing, or the rest is lost.
    static Node reverse(Node head) {
        Node prev = null, curr = head;
        while (curr != null) {
            Node next = curr.next; // save first
            curr.next = prev;      // then re-point
            prev = curr;
            curr = next;
        }
        return prev;
    }

    // Fast/slow: fast moves 2, slow moves 1. If they meet, there is a cycle.
    static boolean hasCycle(Node head) {
        Node slow = head, fast = head;
        while (fast != null && fast.next != null) { // order of checks matters
            slow = slow.next;
            fast = fast.next.next;
            if (slow == fast) return true;
        }
        return false;
    }

    // The same trick: when fast hits the end, slow is at the middle.
    static Node middle(Node head) {
        Node slow = head, fast = head;
        while (fast != null && fast.next != null) { slow = slow.next; fast = fast.next.next; }
        return slow;
    }

    // A dummy head removes the "what if the answer starts here" special case.
    static Node mergeSorted(Node a, Node b) {
        Node dummy = new Node(0), tail = dummy;
        while (a != null && b != null) {
            if (a.val <= b.val) { tail.next = a; a = a.next; }
            else { tail.next = b; b = b.next; }
            tail = tail.next;
        }
        tail.next = (a != null) ? a : b; // one is already null
        return dummy.next;
    }

    public static void main(String[] args) {
        Node list = new Node(1, new Node(3, new Node(5)));
        Node other = new Node(2, new Node(4));
        for (Node n = mergeSorted(list, other); n != null; n = n.next) System.out.print(n.val + " "); // 1 2 3 4 5
        System.out.println();
        System.out.println(middle(new Node(1, new Node(2, new Node(3)))).val); // 2
    }
}
`,
  python: `class Node:
    def __init__(self, val, next=None):
        self.val = val
        self.next = next


def reverse(head):
    """Save 'next' BEFORE re-pointing, or the rest of the list is lost."""
    prev, curr = None, head
    while curr:
        nxt = curr.next   # save first
        curr.next = prev  # then re-point
        prev, curr = curr, nxt
    return prev


def has_cycle(head):
    """Fast moves 2, slow moves 1. If they meet, there is a cycle."""
    slow = fast = head
    while fast and fast.next:   # order of checks matters
        slow = slow.next
        fast = fast.next.next
        if slow is fast:
            return True
    return False


def middle(head):
    """Same trick: when fast hits the end, slow is at the middle."""
    slow = fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
    return slow


def merge_sorted(a, b):
    """A dummy head removes the 'what if the answer starts here' special case."""
    dummy = tail = Node(0)
    while a and b:
        if a.val <= b.val:
            tail.next, a = a, a.next
        else:
            tail.next, b = b, b.next
        tail = tail.next
    tail.next = a or b   # one of them is already None
    return dummy.next


def to_list(head):
    out = []
    while head:
        out.append(head.val)
        head = head.next
    return out


print(to_list(merge_sorted(Node(1, Node(3, Node(5))), Node(2, Node(4)))))  # [1,2,3,4,5]
print(middle(Node(1, Node(2, Node(3)))).val)  # 2
`,
};

// ---------------------------------------------------------------------------
// 100 - Stacks
// ---------------------------------------------------------------------------
const STACKS_BODY = `
## The one idea

Last in, first out. One end, two operations.

The trivial part is the structure. The valuable part is recognising the shape of
a problem that *needs* one: whenever the thing you must resolve next is the most
recent unresolved thing.

::: story
"Is ${C("{[()]}")} balanced?"

Every closing bracket must match the **most recent** unmatched opening bracket -
not the first, not any. That phrase is the tell. Push openers; on a closer, pop
and compare. Empty at the end means balanced.

Once you hear "most recent unresolved", you are looking at a stack. That covers
undo history, expression evaluation, and every nested structure.
:::

::: analogy A stack of plates
Add to the top, take from the top. Reaching the bottom plate means moving every
plate above it - which is exactly why a stack gives you no random access, and
why that is a feature, not a limitation.
:::

::: table Where it shows up
Problem | Why a stack
Balanced brackets | the pending opener is always the most recent
Expression evaluation | operators resolve innermost-first
Undo / back button | the last action is the first undone
Recursion itself | the call stack IS a stack
Next greater element | monotonic stack - see below
:::

::: story
The monotonic stack is the pattern worth real effort.

"For each element, find the next greater element to its right." Brute force is
O(n^2). Instead, keep a stack of elements still *waiting* for their answer, held
in decreasing order.

When a new element arrives, it is the answer for everything on the stack smaller
than it - pop those and record it. Each element is pushed once and popped once,
so the whole thing is O(n) despite the inner loop.
:::

::: checkpoint
A monotonic stack has a loop inside a loop, yet it is O(n). Why?
- ( ) The inner loop runs at most twice
- (x) Each element is pushed once and popped once across the entire run
- ( ) The stack never exceeds a constant size
> Count total operations, not nesting depth. 2n pushes and pops means O(n) - an
> amortised argument worth being able to state out loud.
:::

::: mistake
- Popping an empty stack. Check first; an unmatched closer is a real input.
- Finishing without checking the stack is empty - ${C("((")} has no errors until
  you look at what is left over.
- Forgetting the leftovers in a monotonic stack: whatever remains has no next
  greater element, and usually needs -1.
- Storing values when you need indices. Most monotonic stack questions want
  positions, not magnitudes.
:::

::: interview
Say "the most recent unresolved thing" when you spot it. That phrase tells the
interviewer you recognised the pattern rather than pattern-matched the title.
:::

::: revision
LIFO. Reach for it when the next thing to resolve is the most recent unresolved
one. Monotonic stacks answer next-greater questions in O(n).
:::
`.trim();

const STACKS_CODE = {
  java: `import java.util.*;

public class Stacks {

    // Every closer must match the MOST RECENT unmatched opener.
    static boolean isBalanced(String s) {
        Deque<Character> stack = new ArrayDeque<>();
        Map<Character, Character> pairs = Map.of(')', '(', ']', '[', '}', '{');
        for (char c : s.toCharArray()) {
            if (pairs.containsValue(c)) stack.push(c);
            else if (pairs.containsKey(c)) {
                // Check emptiness BEFORE popping - an unmatched closer is real input.
                if (stack.isEmpty() || stack.pop() != pairs.get(c)) return false;
            }
        }
        return stack.isEmpty(); // "((" only fails at this line
    }

    // Monotonic stack: next greater element to the right, in O(n).
    // The stack holds INDICES still waiting for an answer.
    static int[] nextGreater(int[] nums) {
        int[] answer = new int[nums.length];
        Arrays.fill(answer, -1); // leftovers have no greater element
        Deque<Integer> waiting = new ArrayDeque<>();
        for (int i = 0; i < nums.length; i++) {
            while (!waiting.isEmpty() && nums[waiting.peek()] < nums[i]) {
                answer[waiting.pop()] = nums[i];
            }
            waiting.push(i);
        }
        return answer;
    }

    public static void main(String[] args) {
        System.out.println(isBalanced("{[()]}"));  // true
        System.out.println(isBalanced("(]"));      // false
        System.out.println(isBalanced("(("));      // false
        System.out.println(Arrays.toString(nextGreater(new int[]{2, 1, 2, 4, 3})));  // [4, 2, 4, -1, -1]
    }
}
`,
  python: `def is_balanced(s):
    """Every closer must match the MOST RECENT unmatched opener."""
    pairs = {")": "(", "]": "[", "}": "{"}
    stack = []
    for c in s:
        if c in pairs.values():
            stack.append(c)
        elif c in pairs:
            # Check emptiness BEFORE popping - an unmatched closer is real input.
            if not stack or stack.pop() != pairs[c]:
                return False
    return not stack   # "((" only fails at this line


def next_greater(nums):
    """Monotonic stack: next greater element to the right, in O(n).

    The stack holds INDICES still waiting for an answer. Each index is
    pushed once and popped once, so the nested loop is still linear.
    """
    answer = [-1] * len(nums)   # leftovers have no greater element
    waiting = []
    for i, value in enumerate(nums):
        while waiting and nums[waiting[-1]] < value:
            answer[waiting.pop()] = value
        waiting.append(i)
    return answer


print(is_balanced("{[()]}"))  # True
print(is_balanced("(]"))      # False
print(is_balanced("(("))      # False
print(next_greater([2, 1, 2, 4, 3]))  # [4, 2, 4, -1, -1]
`,
};

// ---------------------------------------------------------------------------
// 110 - Queues
// ---------------------------------------------------------------------------
const QUEUES_BODY = `
## The one idea

First in, first out. Add at one end, remove from the other.

A stack explores as deep as it can; a queue explores everything one step away
before anything two steps away. That single difference is the difference between
depth-first and breadth-first search - and it is why a queue is what finds
**shortest** paths.

::: story
Find the fewest moves from A to B in a maze.

Use a stack and you charge down one corridor to its end, then back up - you will
find *a* path, with no reason to think it is short.

Use a queue and you fan out evenly: every square one move away, then every
square two moves away. The first time you reach B, you cannot have arrived in
fewer moves, because everything shorter was already examined. Breadth-first
search finds shortest paths on unweighted graphs *for free* - just from FIFO.
:::

::: analogy A ticket counter
People are served in arrival order. Fair, and no one waits forever - unlike the
stack of plates, where the bottom plate can wait all day.
:::

::: table The variants worth knowing
Variant | What it adds | Classic use
Queue | FIFO | BFS, task scheduling
Deque | add/remove at both ends | sliding window maximum
Circular queue | fixed array, wrapped indices | bounded buffers
Priority queue | ordered by priority, not arrival | Dijkstra, top-k
:::

::: story
A deque unlocks sliding window maximum.

Naively, the max of every window of size k is O(n*k). Instead keep a deque of
indices whose values decrease from front to back.

A new element evicts every smaller one from the back - they can never be the
maximum again, because this one is bigger *and* newer. The front is always the
current window's maximum, and anything that fell out of the window is dropped
from the front. O(n) overall.
:::

::: checkpoint
Why is a priority queue NOT a queue in the FIFO sense?
- ( ) It is slower
- (x) Order of removal is decided by priority, not by arrival
- ( ) It can only hold numbers
> Priority queues are usually heaps. Same "add / remove next" interface,
> completely different notion of "next".
:::

::: mistake
- Using an array-with-shift as a queue. Removing from the front of an array is
  O(n); a real deque is O(1).
- Marking nodes visited when you *dequeue* instead of when you *enqueue*, so the
  same node is queued many times.
- Forgetting the level boundary in BFS when the question asks for a distance -
  record the level size before draining it.
- Storing values instead of indices in the sliding window deque, so you cannot
  tell what has left the window.
:::

::: interview
"Shortest" or "fewest" in an unweighted setting means BFS, and you should say so
immediately. If weights are involved, it becomes a priority queue and Dijkstra.
:::

::: revision
FIFO. Queue gives breadth-first order, so BFS finds shortest paths on unweighted
graphs. A deque gives O(n) sliding window extremes.
:::
`.trim();

const QUEUES_CODE = {
  java: `import java.util.*;

public class Queues {

    // BFS on a grid: the first time we reach the target, the distance is minimal.
    static int shortestPath(int[][] grid) {
        int rows = grid.length, cols = grid[0].length;
        int[][] dirs = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
        boolean[][] seen = new boolean[rows][cols];
        Deque<int[]> queue = new ArrayDeque<>();

        queue.add(new int[]{0, 0});
        seen[0][0] = true; // mark on ENQUEUE, not on dequeue
        int steps = 0;

        while (!queue.isEmpty()) {
            int levelSize = queue.size(); // freeze the level before draining it
            for (int i = 0; i < levelSize; i++) {
                int[] cell = queue.poll();
                if (cell[0] == rows - 1 && cell[1] == cols - 1) return steps;
                for (int[] d : dirs) {
                    int r = cell[0] + d[0], c = cell[1] + d[1];
                    if (r < 0 || c < 0 || r >= rows || c >= cols) continue;
                    if (seen[r][c] || grid[r][c] == 1) continue;
                    seen[r][c] = true;
                    queue.add(new int[]{r, c});
                }
            }
            steps++;
        }
        return -1;
    }

    // Deque holding INDICES whose values decrease front to back.
    static int[] slidingWindowMax(int[] nums, int k) {
        int[] out = new int[nums.length - k + 1];
        Deque<Integer> window = new ArrayDeque<>();
        for (int i = 0; i < nums.length; i++) {
            // Anything smaller can never be the max again: bigger AND newer.
            while (!window.isEmpty() && nums[window.peekLast()] <= nums[i]) window.pollLast();
            window.addLast(i);
            if (window.peekFirst() <= i - k) window.pollFirst(); // fell out of the window
            if (i >= k - 1) out[i - k + 1] = nums[window.peekFirst()];
        }
        return out;
    }

    public static void main(String[] args) {
        System.out.println(shortestPath(new int[][]{{0, 0, 0}, {1, 1, 0}, {0, 0, 0}})); // 4
        System.out.println(Arrays.toString(slidingWindowMax(new int[]{1, 3, -1, -3, 5, 3}, 3))); // [3, 3, 5, 5]
    }
}
`,
  python: `from collections import deque


def shortest_path(grid):
    """BFS: the first time we reach the target, the distance is minimal."""
    rows, cols = len(grid), len(grid[0])
    queue = deque([(0, 0)])
    seen = {(0, 0)}          # mark on ENQUEUE, not on dequeue
    steps = 0

    while queue:
        for _ in range(len(queue)):   # freeze the level before draining it
            r, c = queue.popleft()
            if (r, c) == (rows - 1, cols - 1):
                return steps
            for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nr, nc = r + dr, c + dc
                if not (0 <= nr < rows and 0 <= nc < cols):
                    continue
                if (nr, nc) in seen or grid[nr][nc] == 1:
                    continue
                seen.add((nr, nc))
                queue.append((nr, nc))
        steps += 1
    return -1


def sliding_window_max(nums, k):
    """Deque holding INDICES whose values decrease front to back."""
    window, out = deque(), []
    for i, value in enumerate(nums):
        # Anything smaller can never be the max again: bigger AND newer.
        while window and nums[window[-1]] <= value:
            window.pop()
        window.append(i)
        if window[0] <= i - k:
            window.popleft()        # fell out of the window
        if i >= k - 1:
            out.append(nums[window[0]])
    return out


print(shortest_path([[0, 0, 0], [1, 1, 0], [0, 0, 0]]))     # 4
print(sliding_window_max([1, 3, -1, -3, 5, 3], 3))          # [3, 3, 5, 5]
`,
};

// ---------------------------------------------------------------------------

function conceptsFor(langId) {
  const pick = (m) => m[langId];
  return [
    {
      id: "two-pointers", title: "Two Pointers",
      subtitle: "A nested loop the data lets you collapse",
      order: 30, status: "published", audiences: AUDIENCES,
      difficulty: "Beginner", estimatedMinutes: 22,
      prerequisites: ["arrays"],
      problemCategories: ["Two Pointer"],
      concept: TWO_POINTERS_BODY,
      codeExample: { language: langId, code: pick(TWO_POINTERS_CODE) },
      xpReward: 45, coinReward: 9, visualization: null,
      quiz: [
        {
          question: "The opposite-ends two pointer technique requires the array to be sorted because:",
          options: [
            { id: "a", text: "Comparisons are faster on sorted data" },
            { id: "b", text: "Sortedness is what proves which pointer to move" },
            { id: "c", text: "It performs a binary search internally" },
            { id: "d", text: "Unsorted arrays cannot be indexed from both ends" },
          ],
          correctOptionIds: ["b"],
          explanation: "If the data is unsorted, 'sum too big' gives no information about which side to move. Sortedness is the justification for the move.",
        },
        {
          question: "In the in-place dedupe loop, what is the invariant?",
          options: [
            { id: "a", text: "Everything after fast is sorted" },
            { id: "b", text: "slow and fast are always adjacent" },
            { id: "c", text: "Everything at or before slow is already deduped" },
            { id: "d", text: "The array length never changes" },
          ],
          correctOptionIds: ["c"],
          explanation: "That sentence is what proves the loop ends with the right answer, and it is what interviewers listen for.",
        },
        {
          question: "A question asks for the ORIGINAL indices of a pair summing to a target. What breaks if you sort first?",
          options: [
            { id: "a", text: "Nothing - indices are preserved by sorting" },
            { id: "b", text: "The indices no longer refer to the original positions" },
            { id: "c", text: "The sum can no longer be computed" },
            { id: "d", text: "Two pointers stops being O(n)" },
          ],
          correctOptionIds: ["b"],
          explanation: "Sort (value, index) pairs, or use a hash map, which needs no sorting at all.",
        },
      ],
    },
    {
      id: "hashing", title: "Hashing",
      subtitle: "Trading memory for instant lookup",
      order: 40, status: "published", audiences: AUDIENCES,
      difficulty: "Beginner", estimatedMinutes: 24,
      prerequisites: ["arrays"],
      problemCategories: ["Hashing"],
      concept: HASHING_BODY,
      codeExample: { language: langId, code: pick(HASHING_CODE) },
      xpReward: 45, coinReward: 9, visualization: null,
      quiz: [
        {
          question: "What is the worst-case lookup cost of a hash map?",
          options: [
            { id: "a", text: "O(1) always - that is the guarantee" },
            { id: "b", text: "O(log n)" },
            { id: "c", text: "O(n), when every key collides" },
            { id: "d", text: "O(n log n)" },
          ],
          correctOptionIds: ["c"],
          explanation: "O(1) is the AVERAGE case. If every key hashes to the same bucket, a lookup degenerates to scanning a list.",
        },
        {
          question: "Why is a mutable object a dangerous hash map key?",
          options: [
            { id: "a", text: "It uses more memory than an immutable one" },
            { id: "b", text: "Mutating it changes its hash, so the entry becomes unreachable" },
            { id: "c", text: "Maps reject mutable keys at runtime" },
            { id: "d", text: "It forces the map to rehash on every read" },
          ],
          correctOptionIds: ["b"],
          explanation: "The entry stays in memory but the map looks in the wrong bucket for it - a silent, very hard to trace bug.",
        },
        {
          question: "For counting only lowercase English letters, what beats a hash map?",
          options: [
            { id: "a", text: "Nothing - a map is optimal" },
            { id: "b", text: "A fixed-size array of 26 counters" },
            { id: "c", text: "A sorted list of characters" },
            { id: "d", text: "A second string" },
          ],
          correctOptionIds: ["b"],
          explanation: "A 26-slot array needs no hashing at all and is both faster and simpler. Reach for a map when the key space is large or unknown.",
        },
      ],
    },
    {
      id: "strings", title: "Strings",
      subtitle: "An array of characters, plus immutability",
      order: 50, status: "published", audiences: AUDIENCES,
      difficulty: "Beginner", estimatedMinutes: 26,
      prerequisites: ["arrays", "hashing"],
      problemCategories: ["Strings"],
      concept: STRINGS_BODY,
      codeExample: { language: langId, code: pick(STRINGS_CODE) },
      xpReward: 50, coinReward: 10, visualization: null,
      quiz: [
        {
          question: "Why is building a string with += inside a loop O(n^2)?",
          options: [
            { id: "a", text: "String comparison is O(n)" },
            { id: "b", text: "Immutability means each += allocates and copies the whole string" },
            { id: "c", text: "The garbage collector runs on every iteration" },
            { id: "d", text: "Strings are stored as linked lists of characters" },
          ],
          correctOptionIds: ["b"],
          explanation: "Character i copies i characters. Summed over n iterations that is n^2/2. Use a builder and join once.",
        },
        {
          question: "Which reliably determines whether two words are anagrams?",
          options: [
            { id: "a", text: "Equal lengths" },
            { id: "b", text: "Equal hash codes" },
            { id: "c", text: "Equal character counts" },
            { id: "d", text: "Equal first and last characters" },
          ],
          correctOptionIds: ["c"],
          explanation: "Equal length is necessary but not sufficient; equal hashes do not prove equality. Counting (or comparing sorted forms) does.",
        },
        {
          question: "'Longest substring without repeating characters' is really which technique?",
          options: [
            { id: "a", text: "Binary search" },
            { id: "b", text: "Sliding window" },
            { id: "c", text: "Sorting" },
            { id: "d", text: "Backtracking" },
          ],
          correctOptionIds: ["b"],
          explanation: "Most string questions are an array technique in disguise. Naming the technique first makes the string part routine.",
        },
      ],
    },
    {
      id: "binary-search", title: "Binary Search",
      subtitle: "Throw away half, and search answers as well as arrays",
      order: 60, status: "published", audiences: AUDIENCES,
      difficulty: "Intermediate", estimatedMinutes: 30,
      prerequisites: ["arrays"],
      problemCategories: ["Binary Search", "Searching"],
      concept: BINARY_SEARCH_BODY,
      codeExample: { language: langId, code: pick(BINARY_SEARCH_CODE) },
      xpReward: 60, coinReward: 12, visualization: null,
      quiz: [
        {
          question: "Why prefer low + (high - low) / 2 over (low + high) / 2?",
          options: [
            { id: "a", text: "It rounds down more predictably" },
            { id: "b", text: "low + high can overflow a fixed-width integer" },
            { id: "c", text: "It is measurably faster" },
            { id: "d", text: "It handles empty ranges automatically" },
          ],
          correctOptionIds: ["b"],
          explanation: "Same result, no overflow. This exact bug sat in widely used library code for years.",
        },
        {
          question: "What does binary search actually require?",
          options: [
            { id: "a", text: "A sorted array" },
            { id: "b", text: "Random access to memory" },
            { id: "c", text: "Monotonicity - if it holds at x it holds beyond x" },
            { id: "d", text: "Distinct elements" },
          ],
          correctOptionIds: ["c"],
          explanation: "A sorted array is just the most familiar monotonic thing. Monotonic ANSWERS can be searched with no array at all.",
        },
        {
          question: "In 'minimum eating speed', what is being binary searched?",
          options: [
            { id: "a", text: "The pile sizes" },
            { id: "b", text: "The candidate speeds - the answer space" },
            { id: "c", text: "The hours available" },
            { id: "d", text: "The number of piles" },
          ],
          correctOptionIds: ["b"],
          explanation: "The input is unsorted and irrelevant to the search. The answers form false...false,true...true, which is what gets halved.",
        },
        {
          question: "To find the FIRST occurrence of a duplicated target, what changes?",
          options: [
            { id: "a", text: "Nothing - plain binary search returns the first" },
            { id: "b", text: "On a match, keep searching to the left" },
            { id: "c", text: "The array must be reversed first" },
            { id: "d", text: "You must scan linearly after the match" },
          ],
          correctOptionIds: ["b"],
          explanation: "Plain binary search returns SOME match. Recording it and continuing left is the lower-bound pattern.",
        },
      ],
    },
    {
      id: "sorting", title: "Sorting",
      subtitle: "A decision, not a task",
      order: 70, status: "published", audiences: AUDIENCES,
      difficulty: "Intermediate", estimatedMinutes: 26,
      prerequisites: ["arrays"],
      problemCategories: ["Sorting"],
      concept: SORTING_BODY,
      codeExample: { language: langId, code: pick(SORTING_CODE) },
      xpReward: 50, coinReward: 10, visualization: null,
      quiz: [
        {
          question: "What does it mean for a sort to be stable?",
          options: [
            { id: "a", text: "It never hits its worst case" },
            { id: "b", text: "Equal keys keep their original relative order" },
            { id: "c", text: "It uses O(1) extra memory" },
            { id: "d", text: "It performs the same on sorted and unsorted input" },
          ],
          correctOptionIds: ["b"],
          explanation: "Merge sort is stable; quick sort and heap sort are not. It matters whenever you sort by one key and the rest must not be shuffled.",
        },
        {
          question: "Sorting an array of only 0s, 1s and 2s can be done in:",
          options: [
            { id: "a", text: "O(n log n), the comparison lower bound" },
            { id: "b", text: "O(n) with three pointers and no extra memory" },
            { id: "c", text: "O(n^2)" },
            { id: "d", text: "O(log n)" },
          ],
          correctOptionIds: ["b"],
          explanation: "The n log n bound applies to COMPARISON sorts on arbitrary data. Only three distinct values is a constraint that beats it - the Dutch National Flag partition.",
        },
        {
          question: "You need the 5 largest of a million numbers. Best approach?",
          options: [
            { id: "a", text: "Sort everything, then take 5 - O(n log n)" },
            { id: "b", text: "A size-5 heap in one pass - O(n log k)" },
            { id: "c", text: "Five linear scans" },
            { id: "d", text: "Binary search for each" },
          ],
          correctOptionIds: ["b"],
          explanation: "Sorting does far more work than the question asks for. If only k items are needed, a heap of size k is the right tool.",
        },
      ],
    },
    {
      id: "recursion", title: "Recursion",
      subtitle: "Trust the smaller answer",
      order: 80, status: "published", audiences: AUDIENCES,
      difficulty: "Intermediate", estimatedMinutes: 30,
      prerequisites: ["arrays"],
      problemCategories: ["Recursion"],
      concept: RECURSION_BODY,
      codeExample: { language: langId, code: pick(RECURSION_CODE) },
      xpReward: 60, coinReward: 12, visualization: null,
      quiz: [
        {
          question: "Which three parts does every correct recursion need?",
          options: [
            { id: "a", text: "A loop, a counter and a return" },
            { id: "b", text: "A base case, a smaller subproblem, and guaranteed progress toward the base case" },
            { id: "c", text: "Memoisation, a stack and a queue" },
            { id: "d", text: "Two branches and a merge step" },
          ],
          correctOptionIds: ["b"],
          explanation: "Miss the base case and it never stops; miss progress and it never reaches the base case; miss the subproblem and it is just a loop.",
        },
        {
          question: "Naive recursive Fibonacci is exponential because:",
          options: [
            { id: "a", text: "Function calls are inherently slow" },
            { id: "b", text: "It branches twice per call" },
            { id: "c", text: "The same subproblems are recomputed many times" },
            { id: "d", text: "It exceeds the stack limit" },
          ],
          correctOptionIds: ["c"],
          explanation: "Branching twice is fine when subproblems are distinct. It is the OVERLAP that is fatal - and memoising it is exactly the step to dynamic programming.",
        },
        {
          question: "A 100,000-node linked list must be reversed. Why avoid recursion?",
          options: [
            { id: "a", text: "Recursion cannot reverse a list" },
            { id: "b", text: "Recursion depth would exceed the call stack" },
            { id: "c", text: "It would be O(n^2)" },
            { id: "d", text: "It needs O(n) extra pointers" },
          ],
          correctOptionIds: ["b"],
          explanation: "Most runtimes cap the stack in the low thousands. The iterative version is O(1) space and never overflows.",
        },
      ],
    },
    {
      id: "linked-list", title: "Linked List",
      subtitle: "O(n) to find, O(1) to change",
      order: 90, status: "published", audiences: AUDIENCES,
      difficulty: "Intermediate", estimatedMinutes: 28,
      prerequisites: ["arrays", "recursion"],
      problemCategories: ["Linked List"],
      concept: LINKED_LIST_BODY,
      codeExample: { language: langId, code: pick(LINKED_LIST_CODE) },
      xpReward: 55, coinReward: 11, visualization: null,
      quiz: [
        {
          question: "What does a dummy head node buy you?",
          options: [
            { id: "a", text: "A shorter traversal" },
            { id: "b", text: "It removes the special case where the real head changes" },
            { id: "c", text: "O(1) indexing" },
            { id: "d", text: "Protection against cycles" },
          ],
          correctOptionIds: ["b"],
          explanation: "With a dummy, every node has a predecessor, so 'delete the first' and 'delete any other' become one code path.",
        },
        {
          question: "In the iterative reverse, why save curr.next before re-pointing?",
          options: [
            { id: "a", text: "To keep the loop O(n)" },
            { id: "b", text: "Because overwriting curr.next first loses the rest of the list" },
            { id: "c", text: "To avoid a null check" },
            { id: "d", text: "It is only a style preference" },
          ],
          correctOptionIds: ["b"],
          explanation: "That pointer is the only reference to the remainder. Overwrite it first and everything after this node is unreachable.",
        },
        {
          question: "Fast and slow pointers detect a cycle using how much extra memory?",
          options: [
            { id: "a", text: "O(n), for a visited set" },
            { id: "b", text: "O(log n)" },
            { id: "c", text: "O(1) - just two pointers" },
            { id: "d", text: "O(n) for recursion" },
          ],
          correctOptionIds: ["c"],
          explanation: "That is the whole appeal: a hash set of visited nodes also works, but costs O(n) memory for the same answer.",
        },
      ],
    },
    {
      id: "stacks", title: "Stacks",
      subtitle: "When the next thing to resolve is the most recent one",
      order: 100, status: "published", audiences: AUDIENCES,
      difficulty: "Intermediate", estimatedMinutes: 28,
      prerequisites: ["arrays"],
      problemCategories: ["Stack"],
      concept: STACKS_BODY,
      codeExample: { language: langId, code: pick(STACKS_CODE) },
      xpReward: 55, coinReward: 11, visualization: null,
      quiz: [
        {
          question: "A monotonic stack contains a nested loop yet runs in O(n). Why?",
          options: [
            { id: "a", text: "The inner loop runs at most twice" },
            { id: "b", text: "The stack size is bounded by a constant" },
            { id: "c", text: "Each element is pushed once and popped once overall" },
            { id: "d", text: "The input is sorted" },
          ],
          correctOptionIds: ["c"],
          explanation: "An amortised argument: 2n total operations regardless of nesting. Being able to state this is what distinguishes knowing the pattern from having memorised it.",
        },
        {
          question: "Which phrase in a problem statement most suggests a stack?",
          options: [
            { id: "a", text: "'the smallest element'" },
            { id: "b", text: "'the most recent unmatched / unresolved item'" },
            { id: "c", text: "'the shortest path'" },
            { id: "d", text: "'in sorted order'" },
          ],
          correctOptionIds: ["b"],
          explanation: "'Most recent unresolved' is LIFO stated in English. 'Shortest path' points at a queue instead.",
        },
        {
          question: "After processing all brackets, why must you check the stack is empty?",
          options: [
            { id: "a", text: "To free memory" },
            { id: "b", text: "Because unmatched OPENERS like '((' produce no error until then" },
            { id: "c", text: "To reset for the next input" },
            { id: "d", text: "You do not need to check" },
          ],
          correctOptionIds: ["b"],
          explanation: "Every closer was matched, so nothing failed mid-loop. The leftover openers are the only evidence of imbalance.",
        },
      ],
    },
    {
      id: "queues", title: "Queues",
      subtitle: "FIFO, and why it finds shortest paths",
      order: 110, status: "published", audiences: AUDIENCES,
      difficulty: "Intermediate", estimatedMinutes: 28,
      prerequisites: ["stacks"],
      problemCategories: ["Queue"],
      concept: QUEUES_BODY,
      codeExample: { language: langId, code: pick(QUEUES_CODE) },
      xpReward: 55, coinReward: 11, visualization: null,
      quiz: [
        {
          question: "Why does BFS find shortest paths on an unweighted graph?",
          options: [
            { id: "a", text: "It sorts the nodes by distance first" },
            { id: "b", text: "FIFO order examines everything at distance d before anything at d+1" },
            { id: "c", text: "It uses a priority queue internally" },
            { id: "d", text: "It backtracks whenever it finds a longer path" },
          ],
          correctOptionIds: ["b"],
          explanation: "The first arrival cannot be beaten, because every shorter possibility was already examined. The guarantee comes free from FIFO.",
        },
        {
          question: "In BFS, when should a node be marked visited?",
          options: [
            { id: "a", text: "When it is dequeued" },
            { id: "b", text: "When it is enqueued" },
            { id: "c", text: "After all its neighbours are processed" },
            { id: "d", text: "It does not matter" },
          ],
          correctOptionIds: ["b"],
          explanation: "Marking on dequeue lets the same node be enqueued several times before it is first processed - wasted work, and sometimes wrong distances.",
        },
        {
          question: "In the sliding window maximum deque, why evict smaller elements from the back?",
          options: [
            { id: "a", text: "To keep the deque sorted for binary search" },
            { id: "b", text: "Because a smaller AND older element can never be the maximum again" },
            { id: "c", text: "To bound the deque to size k" },
            { id: "d", text: "To avoid duplicate values" },
          ],
          correctOptionIds: ["b"],
          explanation: "The arriving element outlives it and beats it, so it is permanently irrelevant. That is what keeps the whole scan O(n).",
        },
        {
          question: "How does a priority queue differ from a plain queue?",
          options: [
            { id: "a", text: "It is slower to insert" },
            { id: "b", text: "Removal order is by priority, not arrival" },
            { id: "c", text: "It cannot grow" },
            { id: "d", text: "It only supports numbers" },
          ],
          correctOptionIds: ["b"],
          explanation: "Same interface, different meaning of 'next'. Usually a heap underneath, and the basis of Dijkstra and top-k.",
        },
      ],
    },
  ];
}

let plannedConcepts = 0;

for (const track of TRACKS) {
  const trackRef = db.collection("dsaConceptTracks").doc(track.id);
  // The track doc itself is already seeded by part 1 - only touch `updatedAt`
  // here, and only via merge, so a label/order/status edit made in the admin
  // console since then is never silently reverted by re-running this script.
  console.log(`${apply ? "SET " : "PLAN"} dsaConceptTracks/${track.id} (${track.label}) - touch only`);
  if (apply) {
    await trackRef.set({ updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
  }

  for (const concept of conceptsFor(track.id)) {
    plannedConcepts++;
    const words = (concept.concept || "").split(/\s+/).length;
    console.log(`  ${apply ? "SET " : "PLAN"} concepts/${concept.id} - "${concept.title}" `
      + `[order ${concept.order}] (${words} words, ${concept.quiz.length} quiz Qs, `
      + `cats: ${concept.problemCategories.join("+")}, prereqs: ${concept.prerequisites.join(",") || "none"}`
      + `${concept.codeExample ? ", runnable code" : ""})`);
    if (apply) {
      await trackRef.collection("concepts").doc(concept.id).set({
        ...concept,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
    }
  }
}

console.log(`\n${apply ? "Applied" : "Dry run"}: ${plannedConcepts} concept doc(s) across ${TRACKS.length} tracks `
  + `(${plannedConcepts / TRACKS.length} concepts x ${TRACKS.length} languages).`);
if (!apply) console.log("Re-run with --apply to write.");
process.exit(0);
