// GATE Computer Organization and Architecture - authored lesson content.
// Follows the authoring rules documented at the top of general-aptitude.mjs.
//
// status is intentionally absent: scripts/write-gate-lessons.mjs excludes it from
// CONTENT_FIELDS, because publication state belongs to the syllabus seeder.

export const COMPUTER_ORGANIZATION_AND_ARCHITECTURE = {

  "cache-memory-mapping": {
    difficulty: "Moderate",
    estimatedMinutes: 40,
    whatYoullLearn: [
      "How a physical address splits into tag, index and block offset, and why the split is where it is",
      "The three mapping schemes and what each trades away",
      "How to compute tag/index/offset widths for any cache configuration",
      "How to size the tag directory, including valid and dirty bits",
      "Which miss types each scheme can and cannot suffer",
    ],
    prerequisites: ["Memory Hierarchy and Performance", "Number Systems and Base Conversion"],
    concept: `## The problem

Main memory is enormous and slow. Cache is tiny and fast. So the same small cache has to stand in for a memory hundreds of times its size, which means many memory blocks compete for each cache slot.

Mapping is the rule that decides which slot a given block may occupy. Every question in this topic is ultimately about that one decision.

## The address split

A cache never stores individual bytes - it stores fixed-size **blocks** (also called lines). So the CPU's address has to answer three questions at once:

::: cards What each field answers
Block offset :: Which byte inside the block? Width = log2(block size in bytes).
Index :: Which set may hold this block? Width = log2(number of sets).
Tag :: Which of the many blocks competing for that set is actually here? Whatever bits remain.
:::

The offset takes the **lowest** bits and the tag the **highest**, and that ordering is not arbitrary. Consecutive addresses differ in their low bits, so putting the offset there keeps a block's bytes contiguous; putting the index next means consecutive blocks land in *different* sets rather than fighting over one.

::: behind
If the index were taken from the high bits instead, a sequentially-scanned array would map every one of its blocks onto the same set and thrash a large cache as badly as a tiny one. The field order is a deliberate design decision, not a convention.
:::

## Three schemes, one spectrum

::: flow
Direct-mapped (1 way) -> Set-associative (k ways) -> Fully associative (all ways)
:::

**Direct-mapped** gives each block exactly one legal slot: \`line = block address mod number of lines\`. One tag comparison, so it is the fastest and cheapest to build - and the most fragile, because two hot blocks that happen to map to the same line evict each other repeatedly even while the rest of the cache sits empty.

**Fully associative** lets a block sit anywhere. No index field at all, so no conflicts ever - but a hit requires comparing the tag against every line in parallel, which is expensive in hardware and does not scale.

**Set-associative** is the compromise everything real uses: the cache is divided into sets of \`k\` lines each, the index picks the set, and the block may occupy any of the \`k\` ways within it. \`k\` comparators instead of one or thousands.

::: checkpoint
A 4-way set-associative cache has 2048 lines. How many sets does it have?
- ( ) 2048
- (x) 512
- ( ) 8192
- ( ) 4
> Sets = lines / associativity = 2048 / 4 = 512. The index field is therefore log2(512) = 9 bits wide.
:::

## What the tag directory costs

Each line stores more than data. It needs its tag, a **valid** bit (is there anything here at all?), and for a write-back cache a **dirty** bit (has this been modified since it was loaded?).

That overhead is what "cache size" figures usually exclude - a stated 64 KB cache means 64 KB of *data*, with the directory on top.

## Misses that mapping can and cannot fix

::: cards The three C's
Compulsory :: The first reference to a block. Unavoidable by any mapping - only prefetching or a larger block helps.
Capacity :: The working set simply exceeds the cache. Only a bigger cache helps.
Conflict :: Blocks evicted by other blocks mapping to the same set, while space exists elsewhere. This is the one associativity removes.
:::

::: remember
A fully associative cache has no conflict misses by definition. If a question reports conflict misses in a fully associative cache, something in the premise is wrong.
:::`,
    deepDive: `## Replacement only exists where there is a choice

Direct-mapped caches need no replacement policy - there is exactly one candidate slot, so the decision is forced. LRU, FIFO and random only become meaningful at \`k >= 2\`, which is why replacement-policy questions always specify a set-associative or fully associative cache.

## Write policy interacts with the dirty bit

A **write-through** cache pushes every write to memory immediately, so no line is ever stale and no dirty bit is needed. A **write-back** cache defers, which is faster but means eviction may require writing the old line out first - and that is exactly what the dirty bit tracks. A question that gives you a dirty bit is telling you the cache is write-back.

## Why associativity is always a power of two

Both the index and the way-select are extracted by bit slicing. A 3-way cache would need a division by 3 on the critical path of every access, so real designs use 1, 2, 4, 8 or 16 ways. GATE follows suit.

## The figure that actually matters

Average memory access time, not hit rate, is what a design is judged on:

  AMAT = hit time + miss rate x miss penalty

A cache with a 95% hit rate and a 200-cycle penalty performs worse than one with 90% and 20 cycles. Questions exploit this: raising associativity cuts the miss rate but can raise hit time, and the right answer is sometimes the *less* associative design.`,
    dryRun: `A byte-addressable machine has **32-bit addresses**. The cache is **64 KB**, with **32-byte blocks**, **4-way set associative**, write-back.

::: timeline Working
Total lines :: cache size / block size = 65536 / 32 = **2048 lines**.
Sets :: lines / associativity = 2048 / 4 = **512 sets**.
Block offset :: log2(block size) = log2(32) = **5 bits**.
Index :: log2(sets) = log2(512) = **9 bits**.
Tag :: address bits - index - offset = 32 - 9 - 5 = **18 bits**.
Directory size :: Each line stores 18 tag bits + 1 valid + 1 dirty = 20 bits. Across 2048 lines that is 40960 bits = **5 KB** of overhead on top of the 64 KB of data.
:::

Now change **one** thing at a time and watch which field moves:

- Make it **direct-mapped**: sets = lines = 2048, so index = 11 bits and tag = 32 - 11 - 5 = **16 bits**. More index, less tag.
- Make it **fully associative**: one set, so index = 0 bits and tag = 32 - 0 - 5 = **27 bits**. All tag, no index.
- **Double the block size** to 64 bytes (keeping 4-way): lines = 1024, sets = 256, offset = 6, index = 8, tag = 32 - 8 - 6 = **18 bits**.

::: tip
Offset depends only on block size. Index depends only on the number of sets. Change associativity and the offset cannot move - if your arithmetic says otherwise, recheck.
:::`,
    keyPoints: [
      "Address = tag | index | block offset, with offset in the lowest bits so a block's bytes stay contiguous",
      "Offset width = log2(block size in bytes); index width = log2(number of sets); tag takes the remainder",
      "Sets = total lines / associativity, so direct-mapped has sets = lines and fully associative has exactly one set",
      "Only conflict misses are removed by increasing associativity - compulsory and capacity misses are not",
      "A replacement policy is meaningless in a direct-mapped cache because there is only one candidate slot",
      "A dirty bit implies write-back; write-through needs none",
      "AMAT = hit time + miss rate x miss penalty, and it can favour the less associative design",
    ],
    commonMistakes: [
      "Dividing cache size by block size to get the number of sets - that gives the number of LINES, which must then be divided by associativity",
      "Forgetting valid and dirty bits when asked for tag directory or total overhead size",
      "Letting the offset width change when only associativity changed - offset depends solely on block size",
      "Assuming a larger cache always lowers the miss rate; a bigger block can raise conflict misses by reducing the line count",
      "Applying a replacement policy to a direct-mapped cache",
      "Comparing designs on hit rate alone instead of computing AMAT",
    ],
    analogies: [
      "Direct-mapped is an assigned parking bay: one space, and if it is taken you circle back later. Fully associative is any-space-in-the-lot but a guard checks every bay. Set-associative assigns you a small zone and lets you take any bay inside it",
    ],
    memoryTricks: [
      "TIO from high bits to low: Tag, Index, Offset",
      "'Lines then sets' - divide by block size for lines, then by associativity for sets. Two divisions, never one",
      "Fully associative means Fully-no-index: the index field vanishes and all its bits become tag",
    ],
    formulas: [
      "number of lines = cache size / block size",
      "number of sets = number of lines / associativity",
      "block offset bits = log2(block size in bytes)",
      "index bits = log2(number of sets)",
      "tag bits = address bits - index bits - offset bits",
      "tag directory size = number of lines x (tag bits + valid bit + dirty bit if write-back)",
      "AMAT = hit time + miss rate x miss penalty",
    ],
    shortcuts: [
      "Compute offset and index first; the tag is always just whatever is left over, so it never needs its own derivation",
      "For a fully associative cache set index = 0 immediately - no set arithmetic is needed at all",
      "If a question changes only associativity, the offset is unchanged and index+tag shift by exactly log2 of the associativity change",
    ],
    pyqRelevance: "Computer Organization carries around 8 marks and cache is the most reliably examined part of it. The dominant shape is a 2-mark numerical: given cache size, block size, associativity and address width, compute tag/index/offset widths or total tag directory size. A second common shape gives hit time, miss rate and miss penalty and asks for AMAT, sometimes comparing two configurations where the higher-associativity one is deliberately the worse answer. Both are pure arithmetic once the two divisions are done in the right order.",
    interviewConnection: "Cache-line size and associativity come up directly in performance interviews: why iterating a 2D array row-major is faster than column-major, why false sharing between threads destroys throughput, and why padding a struct to a cache-line boundary can matter. All three are this topic applied.",
    revisionSummary: "Address splits as tag | index | offset. Lines = cache size / block size, then sets = lines / associativity. Offset = log2(block size), index = log2(sets), tag = remainder. Associativity removes only conflict misses. Directory overhead = lines x (tag + valid + dirty). Judge designs on AMAT, not hit rate.",
    shortNotes: {
      fiveMinute: `A cache stores fixed-size **blocks**, so an address splits into three fields: **tag | index | block offset**, with the offset in the lowest bits (keeps a block contiguous) and the index next (spreads consecutive blocks across sets rather than onto one).

Two divisions, in order: \`lines = cache size / block size\`, then \`sets = lines / associativity\`. Then \`offset = log2(block size)\`, \`index = log2(sets)\`, and the tag is whatever bits remain.

Direct-mapped has sets = lines and needs no replacement policy. Fully associative has one set, so index = 0 bits and everything else is tag. Set-associative sits between and is what real hardware uses.

Of the three C's - compulsory, capacity, conflict - only **conflict** misses are reduced by more associativity.

Overhead: each line also carries a valid bit and, if write-back, a dirty bit. \`AMAT = hit time + miss rate x miss penalty\` is the figure that decides which design is better.`,
      oneMinute: "TIO: Tag, Index, Offset from high bits down. lines = size/block, then sets = lines/associativity. offset = log2(block), index = log2(sets), tag = rest. Associativity only fixes conflict misses. Directory = lines x (tag + valid + dirty). Compare on AMAT.",
      nightBefore: "Two divisions, in order: size/block gives LINES, lines/ways gives SETS. Offset depends only on block size. Fully associative means index = 0 bits. Don't forget valid and dirty bits.",
    },
    mcqs: [
      {
        question: "A 32 KB cache has 64-byte blocks and is 8-way set associative. How many sets does it have?",
        options: ["512", "64", "4096", "8"],
        correctIndex: 1,
        explanation: "Lines = 32768 / 64 = 512. Sets = lines / associativity = 512 / 8 = 64. The common error is stopping at 512, which is the line count, not the set count.",
      },
      {
        question: "Which field of the address is unaffected by a change in associativity, all else being equal?",
        options: ["The tag", "The index", "The block offset", "All three change"],
        correctIndex: 2,
        explanation: "The offset width is log2(block size) and depends on nothing else. Changing associativity changes the set count, which moves bits between index and tag only.",
      },
      {
        question: "Increasing associativity primarily reduces which kind of miss?",
        options: ["Compulsory", "Capacity", "Conflict", "All three equally"],
        correctIndex: 2,
        explanation: "Conflict misses arise when blocks evict each other despite free space elsewhere. More ways per set removes that. First references (compulsory) and an oversized working set (capacity) are unaffected.",
      },
      {
        question: "Why does a direct-mapped cache not need a replacement policy?",
        options: [
          "Because it never suffers misses",
          "Because each block has exactly one legal slot, so there is no choice to make",
          "Because it is always write-through",
          "Because it has no valid bit",
        ],
        correctIndex: 1,
        explanation: "Mapping is forced: line = block address mod line count. A policy like LRU only has meaning once a set holds two or more candidate ways.",
      },
      {
        question: "The presence of a dirty bit per cache line indicates the cache is:",
        options: ["Write-through", "Write-back", "Fully associative", "Direct-mapped"],
        correctIndex: 1,
        explanation: "A dirty bit records that a line was modified and must be written out on eviction. Write-through propagates every write immediately, so it has nothing to track.",
      },
    ],
    numericals: [
      {
        question: "A byte-addressable machine has 32-bit addresses. A 64 KB, 4-way set-associative cache uses 32-byte blocks. How many bits wide is the tag?",
        answerMin: 18, answerMax: 18,
        unit: "bits",
        solution: "Lines = 65536/32 = 2048. Sets = 2048/4 = 512. Offset = log2(32) = 5. Index = log2(512) = 9. Tag = 32 - 9 - 5 = **18 bits**.",
      },
      {
        question: "For that same cache made fully associative instead (64 KB, 32-byte blocks, 32-bit addresses), how many bits wide is the tag?",
        answerMin: 27, answerMax: 27,
        unit: "bits",
        solution: "A fully associative cache has one set, so the index field disappears: index = 0 bits. Tag = 32 - 0 - 5 = **27 bits**.",
      },
      {
        question: "A write-back, 4-way set-associative cache has 2048 lines and an 18-bit tag. What is the total tag directory size in kilobytes (1 KB = 1024 bytes)?",
        answerMin: 5, answerMax: 5,
        unit: "KB",
        solution: "Per line: 18 tag + 1 valid + 1 dirty = 20 bits. Total = 2048 x 20 = 40960 bits = 5120 bytes = **5 KB**.",
      },
      {
        question: "A cache has a hit time of 2 cycles, a miss rate of 10% and a miss penalty of 100 cycles. What is the AMAT in cycles?",
        answerMin: 12, answerMax: 12,
        unit: "cycles",
        solution: "AMAT = hit time + miss rate x miss penalty = 2 + 0.10 x 100 = 2 + 10 = **12 cycles**.",
      },
    ],
  },

};
