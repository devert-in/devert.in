// GATE Computer Organization and Architecture - authored lesson content.
// Follows the authoring rules documented at the top of general-aptitude.mjs.
//
// status is intentionally absent: scripts/write-gate-lessons.mjs excludes it from
// CONTENT_FIELDS, because publication state belongs to the syllabus seeder.

export const COMPUTER_ORGANIZATION_AND_ARCHITECTURE = {

  "cache-memory-mapping": {
    difficulty: "Moderate",
    estimatedMinutes: 40,
    // Verified real (title confirmed via direct fetch, 2026-08-13).
    resources: [{
      kind: "video",
      title: "Cache Address Mapping | Direct Mapping 1 | Memory | GATE | Computer Organisation & Architecture",
      url: "https://www.youtube.com/watch?v=1ZC4ACs5KCQ",
      description: "Whole video covers this topic from the start.",
    }],
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

  // ---------------- Instruction Set and Addressing ----------------

  "instruction-set-architecture": {
    difficulty: "Easy",
    estimatedMinutes: 30,
    xpReward: 20, coinReward: 8,
    // Verified real (title confirmed via direct fetch, 2026-08-13) - one
    // chapter covering both this topic and addressing-modes together; the
    // same video is linked on both topics for that reason.
    resources: [{
      kind: "video",
      title: "Machine Instructions & Addressing Modes | Chapter-4 | Computer Organization & Architecture",
      url: "https://www.youtube.com/watch?v=tGZvB_YorIM",
      description: "Covers instruction sets and addressing modes together.",
    }],
    whatYoullLearn: [
      "What an instruction set architecture actually is - the contract between hardware and software, not an implementation detail",
      "RISC versus CISC, and why the split is a design trade-off rather than one side simply being \"better\"",
      "How operand count (3-, 2-, 1-, 0-address) reshapes program length, and how instruction format spends a fixed bit budget",
    ],
    prerequisites: ["Binary Arithmetic"],
    concept: `## The Contract Above The Circuit

::: story
Every processor family - x86, ARM, RISC-V - ships with a manual that says nothing about wires or transistors. It says: here are the instructions you can write, here is what each one does, here are the registers you can name.

That manual is the Instruction Set Architecture. It is a promise the hardware keeps, not a description of how it keeps it - two completely different chips can implement the identical ISA and run the same compiled program correctly, one of them faster than the other, without either one being "wrong".
:::

::: remember
The ISA is the line where software's view of the machine ends and hardware's freedom to implement it begins. A compiler targets the ISA and never needs to know whether the chip underneath is hardwired or microprogrammed, pipelined or not - that is exactly the next several topics in this subject.
:::

## RISC Versus CISC: A Trade-off, Not A Winner

::: cards Two philosophies for the same job
CISC (Complex Instruction Set Computer) :: Few, powerful instructions doing multi-step work in one go (load-modify-store in a single instruction, say). Often variable-length encoding.
RISC (Reduced Instruction Set Computer) :: Many, simple, uniform, fixed-length instructions, each doing one small step. Strict load-store design - only load/store instructions ever touch memory.
:::

::: mistake
"RISC is always faster" is a slogan, not a fact. RISC's real advantage is that fixed-length, uniform instructions are dramatically easier to pipeline well - the speed comes from that downstream effect, not from simply having fewer instructions to choose from.
:::

## How Many Operands Does An Instruction Name?

::: flow
3-address -> ADD R1, R2, R3 means R1 = R2 + R3. Shortest programs, widest instructions.
2-address -> ADD R1, R2 means R1 = R1 + R2 - one operand is overwritten.
1-address (accumulator) -> ADD R means ACC = ACC + R - one implicit operand, the accumulator.
0-address (stack) -> ADD pops two values and pushes their sum - no operand fields at all, everything is implicit via the stack.
:::

::: checkpoint
Which architecture needs the MOST instructions to compute a single expression like A = B + C * D?
- ( ) 3-address
- ( ) 2-address
- ( ) 1-address
- (x) 0-address (stack)
> Stack machines have zero operand fields, so every value must be explicitly pushed and every intermediate result explicitly popped and pushed again - it takes the most instructions of the four, even though each individual instruction is the smallest.
:::

## What The Instruction Format Actually Encodes

::: cards Reading a fixed-length instruction word
Opcode field :: Which operation. A width of w bits allows at most 2^w distinct instructions.
Operand / register fields :: Which registers, or which addressing mode. Width depends on how many registers must be nameable.
Address / immediate field :: Whatever bits remain once the opcode and operand fields are fixed.
:::

::: tip
"How many bits does the opcode need" and "how many registers can this ISA name" are the same arithmetic problem in both directions - given a fixed total instruction width, growing one field always shrinks another. Expect a question that hands you the total and one field, and asks for what's left.
:::`,
    workedExamples: [
      {
        title: "Counting instructions across operand counts",
        problem: "Compute X = (A + B) * (C - D) on (a) a 3-address machine and (b) a 1-address (accumulator) machine. How many instructions does each need?",
        solution: `Step 1 (3-address): each instruction can name two sources and a distinct destination.
  ADD T1, A, B      T1 = A + B
  SUB T2, C, D      T2 = C - D
  MUL X,  T1, T2    X  = T1 * T2
  3 instructions total.

Step 2 (1-address, accumulator): every operation implicitly uses the accumulator, so a value must be loaded before it is used and stored before the accumulator is needed for something else.
  LOAD  A
  ADD   B          ACC = A + B
  STORE T1
  LOAD  C
  SUB   D          ACC = C - D
  STORE T2
  LOAD  T1
  MUL   T2         ACC = T1 * T2
  STORE X
  9 instructions total.

Same computation, 3 instructions versus 9 - the operand-count trade-off made concrete.`,
      },
    ],
    keyPoints: [
      "An ISA is the contract between hardware and software - instructions, registers, data types, addressing modes, formats - independent of how any particular chip implements it",
      "RISC versus CISC is a trade-off between instruction count and instruction complexity, not a simple better/worse split",
      "Operand count (3-, 2-, 1-, 0-address) trades instruction WIDTH against instruction COUNT - fewer operand fields means more instructions per program",
      "An opcode field of w bits bounds the ISA to at most 2^w distinct instructions",
      "A stack (0-address) machine needs the MOST instructions for a given expression; a 3-address machine needs the fewest",
    ],
    commonMistakes: [
      "Treating RISC vs CISC as \"better vs worse\" rather than a trade-off between instruction count and instruction complexity",
      "Forgetting the ISA is an abstraction - it says nothing about pipelining, clock speed, or whether control is hardwired or microprogrammed underneath",
      "Assuming a stack (0-address) machine needs FEWER instructions because it has no operand fields - it is the opposite, it needs the most",
      "Miscounting the accumulator as \"no operand\" in a 1-address machine - it is a real operand, just an implicit, unnamed one",
    ],
    analogies: [
      "An ISA is a restaurant menu, not the kitchen - it fixes exactly what you can order (instructions) without saying anything about how the kitchen (microarchitecture) cooks it",
      "Operand count is how many blanks a form leaves you to fill in: a 3-blank form (3-address) states a whole computation in one line, a 0-blank form (stack) makes you write a separate line for every single value",
    ],
    memoryTricks: [
      "The address count in the name IS the operand count: 3-address names three, 2-address two, 1-address one (the accumulator, unnamed), 0-address none (the stack, unnamed)",
      "Fewer operand fields per instruction means more instructions per program - it's a seesaw, never a free lunch",
    ],
    formulas: [
      "Maximum distinct instructions with an opcode field of w bits = 2^w",
      "Fixed instruction length = opcode bits + all operand/register field bits combined",
      "Directly addressable memory with an address field of a bits = 2^a locations",
    ],
    shortcuts: [
      "Given the total instruction width and the opcode width, the remaining bits are automatically the operand budget - no need to design the whole format first",
      "If a question says \"accumulator machine\", expect one operand per instruction and a LOAD/STORE pair around every value not already sitting in the accumulator",
    ],
    mcqs: [
      {
        question: "Which statement about an Instruction Set Architecture is correct?",
        options: [
          "It fully determines the clock speed of any chip that implements it",
          "It is an abstraction hardware must honour, independent of the implementation underneath",
          "It specifies whether control is hardwired or microprogrammed",
          "It is identical to the microarchitecture",
        ],
        correctIndex: 1,
        explanation: "The ISA is the software-visible contract - registers, instructions, data types, addressing modes. Clock speed, control-unit design and microarchitecture are all implementation choices below the ISA, free to differ between two chips implementing the same one.",
      },
      {
        question: "A 3-address machine typically needs fewer instructions than a 0-address (stack) machine for the same expression because:",
        options: [
          "3-address instructions execute faster per cycle",
          "Each 3-address instruction can name two sources and a destination in one step, while a stack machine must push and pop every intermediate value explicitly",
          "Stack machines cannot perform arithmetic",
          "3-address machines have no opcode field",
        ],
        correctIndex: 1,
        explanation: "Instruction count depends on how much a single instruction can say. Three explicit operand fields let one 3-address instruction do what a stack machine needs several push/pop/operate instructions to do.",
      },
      {
        question: "An instruction set uses a 5-bit opcode field. What is the maximum number of distinct opcodes it can encode?",
        options: ["16", "25", "32", "10"],
        correctIndex: 2,
        explanation: "Maximum distinct instructions = 2^(opcode bits) = 2^5 = 32.",
      },
    ],
    numericals: [
      {
        question: "An ISA uses a fixed 16-bit instruction word: 6 bits for the opcode, and the rest split equally between two register operand fields. How many registers can each field address?",
        answerMin: 32, answerMax: 32,
        unit: "registers",
        solution: "Remaining bits = 16 - 6 = 10, split equally between 2 fields = 5 bits each. Registers addressable per field = 2^5 = **32**.",
      },
    ],
    pyqRelevance: `ISA basics rarely get their own dedicated numerical, but two shapes recur: an operand-count instruction-counting question ("how many instructions does a k-address machine need for expression E"), and a RISC/CISC characteristic-matching MCQ, almost every year in some form.

The instruction-format arithmetic (opcode bits vs operand bits vs total width) is the same log2/subtraction pattern that reappears across this entire subject, so it is worth being fast at here rather than treating it as a one-off.`,
    interviewConnection: `Understanding ISA is why cross-compiling makes sense at all, and why "which architecture does this binary target" is a real, load-bearing question - the same C source compiles to very different-looking assembly on ARM versus x86 while behaving identically, because both honour the same language-level contract in different instruction sets.`,
    revisionSummary: `ISA = the contract between hardware and software (instructions, registers, data types, addressing modes, formats), independent of implementation.

RISC vs CISC is a trade-off (instruction count vs instruction complexity, and RISC's uniformity is what makes it pipeline well), not a simple ranking.

Operand count trades instruction width against instruction count: 3-address needs the fewest instructions, 0-address (stack) needs the most.

Instruction format arithmetic: opcode bits bound the number of instructions (2^w); given a fixed total width, growing one field shrinks another.`,
    shortNotes: {
      fiveMinute: `An ISA is the software-visible contract a chip must honour - instructions, registers, data types, addressing modes, instruction formats - completely separate from HOW the chip implements it. Two very different chips can share one ISA.

RISC vs CISC is a trade-off, not a ranking: CISC packs more work into fewer, richer instructions (often variable length); RISC uses many simple, fixed-length instructions in a strict load-store design, which is what makes RISC easy to pipeline well.

Operand count (how many addresses an instruction names) trades instruction WIDTH against instruction COUNT: 3-address is shortest in instruction count, 0-address (stack) is longest, with 2-address and 1-address (accumulator) in between.

A fixed instruction word splits into opcode bits (bounding the instruction count to 2^w) and operand/address bits (whatever remains) - growing one field always shrinks the other.`,
      oneMinute: "ISA = HW/SW contract, independent of implementation. RISC vs CISC = trade-off (instruction count vs complexity), not a ranking. Operand count: 3-address fewest instructions, 0-address (stack) most. Opcode field of w bits -> max 2^w instructions; fixed word width splits between opcode and operand fields.",
      nightBefore: "ISA = contract, not implementation. RISC/CISC = trade-off. Operand count: more addresses per instruction = fewer instructions, shorter program. Opcode bits bound instruction count as 2^w.",
    },
  },

  "addressing-modes": {
    difficulty: "Moderate",
    estimatedMinutes: 35,
    // Verified real (title confirmed via direct fetch, 2026-08-13) - same
    // video as instruction-set-architecture, which covers both together.
    resources: [{
      kind: "video",
      title: "Machine Instructions & Addressing Modes | Chapter-4 | Computer Organization & Architecture",
      url: "https://www.youtube.com/watch?v=tGZvB_YorIM",
      description: "Covers instruction sets and addressing modes together.",
    }],
    xpReward: 25, coinReward: 10,
    whatYoullLearn: [
      "The addressing modes GATE actually asks about, and the effective-address rule each one computes",
      "Why indirect addressing costs an extra memory access that direct addressing does not",
      "How to chase a multi-level indirect address through memory to find the final operand",
    ],
    prerequisites: ["Instruction Set Architecture"],
    concept: `## Every Instruction Needs A Way To Point

::: story
An instruction like ADD R1, X does not just carry an operation - X has to be resolved into an actual value somewhere in memory or a register. Addressing mode is the rule for that resolution: given what the instruction literally contains, how do you compute the effective address (EA) of the real operand?
:::

::: remember
Effective address is the actual memory location the operand lives at, once you have followed the addressing mode's rule. In some modes there is no memory address at all - the operand is right there in the instruction, and that is worth noticing rather than assuming.
:::

## The Modes, By How Far You Have To Look

::: cards From "no lookup" to "keep looking"
Immediate :: The operand IS the instruction's own operand field. No memory access to fetch it.
Register :: The operand field names a register. No memory access - the fastest mode.
Direct (absolute) :: The operand field IS the address. One memory access gets the operand.
Register indirect :: The operand field names a register that HOLDS the address. One memory access.
Indirect :: The operand field is an address, and the memory AT that address holds the real address. Two memory accesses minimum before the operand itself is even read.
Indexed / base + displacement :: EA = base register + displacement. One addition, then one memory access.
PC-relative :: EA = program counter + signed displacement. Used for branches, so code stays correct wherever it is loaded.
:::

::: mistake
Indirect and indexed are the pair confused hardest. Indexed ADDS a register to a constant to compute the address of the data - one arithmetic step. Indirect makes the given address point to ANOTHER address, which must itself be dereferenced - a chain of lookups, not arithmetic.
:::

::: checkpoint
Register R1 contains the value 200. Memory location 200 contains the value 350. Under register-indirect addressing using R1, what is the operand's value?
- ( ) 200
- (x) 350
- ( ) The value at memory location 350
- ( ) Cannot be determined
> Register-indirect means R1 holds the ADDRESS of the operand. R1 = 200, so the operand is whatever memory location 200 contains: 350 - one memory access after reading the register. A further, second indirection would go on to read location 350 too, which is exactly what separates single-level from multi-level indirection.
:::

## Why The Extra Hop Costs A Cycle

::: tip
Every extra level of indirection is a genuine additional memory access, not just a conceptual step. An honest count of "memory accesses per instruction" is exactly what indirect or multi-level-indirect addressing adds - which is the practical reason indirect addressing, however flexible, is used sparingly on a performance-critical path.
:::

## PC-Relative Addressing Earns Its Own Mention

::: remember
PC-relative addressing computes EA = PC (usually already advanced past the current instruction) + a signed displacement. This is exactly what lets compiled code be relocated in memory without patching every branch target - the displacement is a distance, not an absolute address, so it stays correct wherever the code is loaded.
:::`,
    workedExamples: [
      {
        title: "Chasing a two-level indirect address",
        problem: "Register R2 = 500. Memory[500] = 700. Memory[700] = 42. Find the operand under (a) register-indirect addressing via R2, and (b) double-indirect addressing where the instruction's address field is 500.",
        solution: `Step 1 (register-indirect via R2): EA = contents of R2 = 500. One memory access: Memory[500] = 700. That 700 is the operand itself - register-indirect stops after one hop. Answer: 700.

Step 2 (double-indirect, address field = 500): the first access, Memory[500] = 700, is treated as ANOTHER address, not the operand yet. A second access follows it: Memory[700] = 42. Answer: 42.

Same starting numbers, different mode named in the question, two different correct answers - identifying the mode always comes before doing any arithmetic.`,
      },
    ],
    keyPoints: [
      "Effective address is the actual location the operand is read from - each addressing mode computes it differently",
      "Immediate and register modes need no memory access for the operand; direct and indexed need one; indirect needs at least two",
      "Indexed is arithmetic (base + offset); indirect is a further lookup (address-of-address) - different verbs, different mode",
      "PC-relative addressing enables position-independent code, and is used mainly for branches",
      "More indirection buys more flexibility (dynamic addresses, pointers) at the cost of more memory accesses per instruction",
    ],
    commonMistakes: [
      "Confusing indexed (address = base + offset, one hop) with indirect (the address found there is itself an address, an extra hop)",
      "Assuming immediate addressing touches memory for the operand - it never does, the value sits in the instruction itself",
      "Getting PC-relative wrong by forgetting the PC has typically already advanced past the current instruction before the displacement is added",
      "Under-counting memory accesses for indirect modes when asked \"how many memory references does this instruction need\"",
    ],
    analogies: [
      "Direct addressing is a house number written on an envelope. Indirect addressing is a forwarding slip at that house telling the postman a different address to actually deliver to",
      "Indexed addressing is \"walk N steps from where I'm standing\" - one calculation, one destination, no forwarding slip involved",
    ],
    memoryTricks: [
      "Immediate: no memory, ever. Direct/register/indexed: one hop. Indirect: at least two hops - the first one lands on ANOTHER address",
      "Indexed = ADD to find data. Indirect = FOLLOW to find data",
    ],
    formulas: [
      "EA (direct) = address field",
      "EA (register indirect) = contents of the named register",
      "EA (indexed) = base register + displacement",
      "EA (PC-relative) = PC + signed displacement",
    ],
    shortcuts: [
      "Count \"hops\": immediate = 0, direct/register/indexed = 1 memory access for the operand, indirect = 2 or more, one more per further indirection level",
      "When a question gives register/memory contents as a table, resolve the mode name first, then follow the pointer chain one step at a time - never skip a hop mentally",
    ],
    mcqs: [
      {
        question: "Which addressing mode requires NO memory access at all to obtain the operand?",
        options: ["Direct", "Indirect", "Immediate", "Indexed"],
        correctIndex: 2,
        explanation: "Immediate addressing carries the operand's actual value inside the instruction word itself - there is nothing to fetch from memory.",
      },
      {
        question: "In indexed addressing, the effective address is computed as:",
        options: [
          "The contents of the memory location named by the address field",
          "Base register plus displacement",
          "A chain of two memory lookups",
          "The program counter alone",
        ],
        correctIndex: 1,
        explanation: "Indexed addressing is a single arithmetic step - base register plus displacement - giving the data's address directly, unlike indirect addressing's chain of lookups.",
      },
      {
        question: "Why is PC-relative addressing especially useful for branch instructions?",
        options: [
          "It is the fastest addressing mode available",
          "It never requires a memory access",
          "It expresses the target as a distance from the current instruction, so relocated code still branches correctly",
          "It can only be used for immediate operands",
        ],
        correctIndex: 2,
        explanation: "Because the displacement is relative to the PC rather than an absolute address, code can be loaded anywhere in memory and its branches still land on the right target - the basis of position-independent code.",
      },
    ],
    numericals: [
      {
        question: "An instruction uses indirect addressing with its address field pointing to memory location 1000. Memory[1000] = 2048. Memory[2048] = 77. What value does the instruction operate on?",
        answerMin: 77, answerMax: 77,
        unit: "value",
        solution: "Indirect addressing: Memory[1000] = 2048 is the REAL address, not the operand. Memory[2048] = **77** is the operand.",
      },
    ],
    pyqRelevance: `Addressing modes appear almost every year, either as MCQ definitions or as a 1-2 mark numerical tracing effective address through a small memory/register table - the "given these register and memory contents, what's the operand under mode X" shape.

The indirect-versus-indexed confusion is the distractor design GATE returns to most, so practising the "hop count" habit pays off directly.`,
    interviewConnection: `Pointers, array indexing, and struct field access in C compile down to exactly these modes - indexed for array[i], indirect for *p, PC-relative for function calls. Understanding addressing modes is understanding why *p costs a genuinely extra memory fetch compared to a plain variable access, which is precisely why pointer-chasing (linked lists, trees) is slower per element than array traversal.`,
    revisionSummary: `Effective address (EA) is the real location an operand is read from, computed differently per mode.

Immediate: no memory access, value is in the instruction. Register: no memory access, value is in a register. Direct/indexed: one memory access. Indirect: two or more, one extra per further indirection level.

Indexed = base + displacement (arithmetic). Indirect = the address found is itself another address (a lookup chain). PC-relative = PC + displacement, used for branches to keep relocated code correct.

More indirection = more flexibility, at the direct cost of more memory accesses per instruction.`,
    shortNotes: {
      fiveMinute: `Addressing mode is the rule for turning an instruction's operand field into the effective address (EA) - the real location the operand is read from.

Ordered by memory accesses needed: immediate (0, value is in the instruction) and register (0, value is in a register) are fastest. Direct (EA = the address field itself) and indexed (EA = base register + displacement) both need exactly one memory access for the operand. Indirect needs at least two: the address field points to ANOTHER address, which must itself be read.

Indexed is arithmetic (add and go); indirect is a lookup chain (follow, then follow again). PC-relative addressing computes EA = PC + signed displacement, which is what lets branch targets stay correct however the code is relocated in memory.

Every extra level of indirection is a real, additional memory access - not free, and exactly why indirect addressing is used sparingly on a hot path.`,
      oneMinute: "EA = the real operand location, computed per mode. Immediate/register: 0 memory accesses. Direct/indexed: 1. Indirect: 2+ (address found there is ANOTHER address). Indexed = base+displacement (arithmetic). Indirect = follow a chain. PC-relative = PC + displacement, for branches.",
      nightBefore: "Immediate = value in instruction. Register indirect = register holds the address. Indirect = one MORE hop than direct. Indexed = base + offset, one hop. Count hops before doing arithmetic.",
    },
  },

  // ---------------- ALU and Control Unit ----------------

  "design-of-arithmetic-and-logic-unit-alu": {
    difficulty: "Moderate",
    estimatedMinutes: 35,
    xpReward: 25, coinReward: 10,
    // Verified real (title confirmed via direct fetch, 2026-08-13).
    resources: [{
      kind: "video",
      title: "What is ALU (Arithmetic Logic Unit)? | How ALU Works? | Combinational Logic",
      url: "https://www.youtube.com/watch?v=U6GDGzEGRgc",
      description: "Whole video covers this topic from the start.",
    }],
    whatYoullLearn: [
      "Why the ALU is purely combinational, and how one adder is reused for both addition and subtraction",
      "Ripple-carry versus carry-lookahead addition, and why wide adders never ship as plain ripple-carry",
      "Carry versus overflow - the same bit pattern answering two different questions, unsigned and signed",
    ],
    prerequisites: ["Addressing Modes"],
    concept: `## A Calculator Bolted Into The CPU

::: story
Every arithmetic and logic operation a CPU performs - add, subtract, AND, OR, shift, compare - runs through one shared circuit: the ALU. It is a calculator's core wired directly into the datapath, and which "button" gets pressed is just a few control bits called the function-select lines.
:::

::: remember
The ALU is purely combinational: given the same inputs and the same function-select code, it always produces the same output, instantly and continuously. It has no memory of its own - whatever "remembers" a result afterward is a register sitting outside it.
:::

## Building Addition First

::: cards From one bit to many
Half adder :: Adds two bits, produces sum and carry-out. No carry-in, so it cannot be chained.
Full adder :: Adds two bits PLUS a carry-in, producing sum and carry-out - the buildable unit.
Ripple-carry adder :: n full adders chained, each one's carry-out feeding the next one's carry-in. Simple, but the carry has to physically ripple through all n stages before the final sum is correct.
Carry-lookahead adder :: Computes every carry in parallel from generate/propagate signals instead of waiting for a ripple. More gates, far less delay.
:::

::: mistake
Ripple-carry delay grows LINEARLY with the number of bits (n full-adder delays) - exactly why wide adders (32-bit, 64-bit) never use plain ripple-carry in a real design. Carry-lookahead, or a hybrid, is what actually ships.
:::

## Subtraction Is Not A Separate Circuit

::: remember
Two's complement makes subtraction free: A - B = A + (B's bits inverted) + 1. The same adder that does addition does subtraction too, with an XOR gate on the B inputs - controlled by the same bit that supplies the +1 carry-in - flipping between the two operations.
:::

## One Multiplexer Decides What Comes Out

::: flow
Inputs A, B -> Adder/subtractor, AND array, OR array, XOR array all computed IN PARALLEL -> a multiplexer selects one result by function code -> Output, plus status flags
:::

::: checkpoint
Why does an ALU compute the AND, OR, and ADD results of A and B all at once every cycle, even though only one is ever used?
- ( ) It saves power
- (x) Because it is a combinational circuit - every gate's output exists continuously, and the multiplexer only selects which already-computed result is routed forward
- ( ) Because every instruction needs all four results
- ( ) It doesn't - only the selected operation is actually computed
> Combinational logic has no "compute on demand": every gate's output is ready as soon as its inputs are stable. The function-select code does not tell the circuit what to compute - it only tells the output multiplexer which already-computed result to pass through.
:::

## Flags Are A Side Effect, Not An Instruction

::: cards The four status flags
Zero (Z) :: Set when the result is all zero bits.
Carry (C) :: Set when an UNSIGNED add/subtract overflows the bit width - a real carry-out (or borrow) occurred.
Overflow (V) :: Set when a SIGNED result is wrong - the sign of the result cannot be correct given the signs of the operands.
Sign / Negative (N) :: Just the result's most significant bit.
:::

::: interview
Carry and overflow are computed differently and answer different questions on the exact same bit pattern - carry is about unsigned arithmetic, overflow is about signed arithmetic. A question asking "does this overflow" is asking about signed interpretation, not the raw carry-out.
:::`,
    deepDive: `## Generate And Propagate, The Carry-Lookahead Trick

For bit position i: G_i = A_i AND B_i (this position generates a carry regardless of carry-in). P_i = A_i XOR B_i (this position propagates an incoming carry through).

  C_(i+1) = G_i + (P_i . C_i)

Expanding this recurrence for every bit turns each carry into one two-level AND-OR expression instead of a chain n stages deep - the whole reason carry-lookahead trades gates for speed.

::: behind
Overflow, computed from carries, has a compact rule: overflow occurs exactly when the carry INTO the sign bit differs from the carry OUT of the sign bit. It is a one-line check, not a re-derivation from the operand signs each time - though checking "same sign in, different sign out" works just as well and is often faster to reason about under exam pressure.
:::`,
    workedExamples: [
      {
        title: "Ripple-carry delay versus carry-lookahead",
        problem: "A full adder has an 8 ns propagation delay. Compare the total addition delay of a 16-bit ripple-carry adder against a carry-lookahead adder whose carries are all ready after a constant 3 full-adder-delay-equivalent, plus one more 8 ns stage to produce the final sum bits.",
        solution: `Step 1 (ripple-carry): delay = n x (full-adder delay) = 16 x 8 = 128 ns.

Step 2 (carry-lookahead): delay = 3 x 8 (parallel carry generation) + 8 (final sum stage) = 24 + 8 = 32 ns.

Step 3 (compare): 128 / 32 = 4x faster. The saving grows with n - a 32-bit or 64-bit ripple-carry adder would look even worse by comparison, which is exactly why nothing that wide ships as plain ripple-carry.`,
      },
    ],
    keyPoints: [
      "The ALU is purely combinational - it has no memory, and every possible result exists continuously, with a multiplexer selecting which one is output",
      "Subtraction reuses the adder: A - B = A + B' + 1 (two's complement), selected by an XOR on the B inputs",
      "Ripple-carry delay grows linearly with bit width; carry-lookahead computes carries in parallel from generate/propagate signals to cut that delay",
      "Carry (C) reflects UNSIGNED overflow; Overflow (V) reflects SIGNED overflow - same bits, two different questions",
      "Status flags are set as a side effect of the ALU operation itself, never by a separate instruction",
    ],
    commonMistakes: [
      "Treating subtraction as needing separate hardware instead of two's-complement plus the same adder",
      "Confusing carry-out with overflow - one is about unsigned arithmetic, the other about signed",
      "Assuming the ALU stores or remembers previous results - it is purely combinational",
      "Believing ripple-carry and carry-lookahead differ in WHAT they compute rather than HOW FAST they compute it",
      "Forgetting that flags are set as a side effect of the operation, not by any separate instruction",
    ],
    analogies: [
      "The ALU is a calculator's core: pressing +, -, AND, or OR selects which of several results, already computed internally, gets shown on the readout",
      "Ripple carry is a bucket brigade passing one bucket hand to hand down the line; carry-lookahead is everyone in line already knowing, from a shouted signal, whether they'll need to pass a full bucket - so nobody waits on a neighbour",
    ],
    memoryTricks: [
      "Carry cares about MAGNITUDE (unsigned). Overflow cares about SIGN (signed). Same bits, two different questions",
      "Subtraction = Add + invert + one: A + B' + 1",
    ],
    formulas: [
      "A - B = A + (bitwise NOT B) + 1 (two's complement subtraction via the same adder)",
      "Ripple-carry adder delay = n x (full-adder delay)",
      "Carry-lookahead: G_i = A_i AND B_i, P_i = A_i XOR B_i, C_(i+1) = G_i + P_i . C_i",
    ],
    shortcuts: [
      "If a question mentions \"the same adder does add and subtract\", it is testing two's-complement plus an XOR-controlled input, not a separate subtractor circuit",
      "For overflow-vs-carry MCQs, check the operand signs: overflow occurs only when both operands share a sign and the result's sign differs",
    ],
    mcqs: [
      {
        question: "Why can the same adder circuit perform both addition and subtraction?",
        options: [
          "Subtraction uses a completely separate circuit that shares the output bus",
          "Two's complement lets A - B be computed as A + (NOT B) + 1, using the same adder with inverted B and a carry-in of 1",
          "The ALU stores the previous result and subtracts it internally",
          "Subtraction is not actually supported by the ALU",
        ],
        correctIndex: 1,
        explanation: "Inverting B and adding 1 (two's complement) turns subtraction into addition, so an XOR gate on the B inputs plus the carry-in bit is all that's needed to reuse the same adder.",
      },
      {
        question: "A signed overflow occurs when:",
        options: [
          "The unsigned result exceeds the bit width",
          "The result is zero",
          "Both operands share the same sign but the result's sign is different",
          "Any carry-out is generated",
        ],
        correctIndex: 2,
        explanation: "Signed overflow means the true mathematical result cannot be represented correctly - which happens exactly when both operands share a sign yet the result flips to the opposite sign. A raw carry-out is a separate, unsigned-only concern.",
      },
      {
        question: "Why does a carry-lookahead adder have less delay than a ripple-carry adder of the same width?",
        options: [
          "It uses fewer gates overall",
          "It computes every bit's carry in parallel from generate/propagate signals, instead of waiting for the carry to ripple through every stage",
          "It only adds the most significant bits",
          "It avoids using two's complement",
        ],
        correctIndex: 1,
        explanation: "Carry-lookahead trades more gates for a carry computation that does not depend on waiting for the previous stage to finish - every carry is expressed directly in terms of the generate/propagate signals, in parallel.",
      },
    ],
    numericals: [
      {
        question: "A full adder has a propagation delay of 5 ns. What is the total addition delay, in ns, of an 8-bit ripple-carry adder?",
        answerMin: 40, answerMax: 40,
        unit: "ns",
        solution: "Ripple-carry delay = n x (full-adder delay) = 8 x 5 = **40 ns**.",
      },
    ],
    pyqRelevance: `ALU questions are mostly conceptual MCQs - carry vs overflow, why one adder handles both add and subtract, why ripple-carry does not scale. A ripple-carry-versus-carry-lookahead delay comparison is the recurring 1-2 mark numerical, pure multiplication once the per-stage delay is given.`,
    interviewConnection: `Integer overflow bugs in real code trace directly back to this: signed overflow is undefined behaviour in C precisely because the hardware's overflow flag, not silent wraparound, is what a correct program is supposed to check - and knowing carry versus overflow is the difference between debugging an off-by-a-huge-number bug correctly and guessing.`,
    revisionSummary: `The ALU is purely combinational - no memory, every result exists continuously, a multiplexer selects the output by function code.

Subtraction reuses the adder via two's complement: A - B = A + B' + 1, selected by an XOR on the B input.

Ripple-carry delay grows linearly with bit width (n x full-adder delay); carry-lookahead computes carries in parallel from generate (G = A.B) and propagate (P = A xor B) signals, trading gates for speed.

Carry (C) = unsigned overflow. Overflow (V) = signed overflow (same operand sign, different result sign). Flags are a side effect of the operation, not a separate instruction.`,
    shortNotes: {
      fiveMinute: `The ALU is a purely combinational circuit - it computes AND, OR, ADD, and more, all simultaneously and continuously, and a multiplexer driven by the function-select bits just picks which already-computed result becomes the output. It stores nothing itself.

Subtraction is not a separate circuit: two's complement makes A - B = A + (NOT B) + 1, so the same adder used for addition handles subtraction too, via an XOR gate on the B inputs.

Ripple-carry adders chain full adders, so their delay grows linearly with bit width (n x full-adder delay) - the carry has to physically ripple through every stage. Carry-lookahead adders compute every carry in parallel from generate (G = A.B) and propagate (P = A xor B) signals, trading extra gates for much less delay - which is why nothing wide ships as plain ripple-carry.

Carry and overflow are NOT the same flag: Carry reflects unsigned arithmetic overflowing the bit width; Overflow reflects signed arithmetic giving a result whose sign cannot be correct. Both, along with Zero and Sign, are set as a side effect of the ALU operation itself.`,
      oneMinute: "ALU = combinational, no memory, mux selects the output. Subtraction = A + B' + 1 via the same adder + XOR. Ripple-carry delay = n x full-adder delay (linear); carry-lookahead computes carries in parallel (G=A.B, P=A xor B). Carry = unsigned overflow; Overflow = signed overflow. Flags are a side effect.",
      nightBefore: "Same adder does add and subtract via two's complement + XOR. Ripple-carry = linear delay. Carry-lookahead = parallel, faster, more gates. Carry != Overflow: unsigned vs signed.",
    },
  },

  "hardwired-control-unit-design": {
    difficulty: "Moderate",
    estimatedMinutes: 35,
    xpReward: 25, coinReward: 10,
    // Verified real (title confirmed via direct fetch, 2026-08-13) - a
    // comparison video also linked on microprogrammed-control-unit-design.
    resources: [{
      kind: "video",
      title: "Hardwired Control Unit vs Microprogrammed Control Unit: Key Differences and Comparisons",
      url: "https://www.youtube.com/watch?v=l1vBkZWyELk",
      description: "Covers both hardwired and microprogrammed control unit design, compared side by side.",
    }],
    whatYoullLearn: [
      "What a control unit actually does - deciding WHEN and WHICH, never computing data itself",
      "How hardwired control implements instruction sequencing as pure combinational/sequential logic, with no control memory at all",
      "Why hardwired control is fast but rigid, and why that trade-off favours simple, uniform instruction sets",
    ],
    prerequisites: ["Design of Arithmetic and Logic Unit (ALU)"],
    concept: `## The Conductor Behind Every Instruction

::: story
An ALU can add. A register can hold a value. Neither one decides WHEN to add, or WHICH register to read from, or what happens next. Something has to raise exactly the right control signals, in exactly the right cycle, for every instruction the ISA defines. That something is the control unit - the conductor directing every other part of the datapath like an orchestra, cueing each section in and staying silent otherwise.
:::

::: remember
A control unit's job is entirely about WHEN and WHICH: which registers, which ALU function, which memory operation, in which cycle of the instruction's execution. It generates zero data itself.
:::

## Hardwired Control: The Score Is Carved In

::: cards What a hardwired control unit is built from
Instruction register :: Holds the opcode currently being executed - the input the whole unit reacts to.
State / step counter :: Tracks which cycle of THIS instruction's execution is underway (fetch, decode, execute, ...).
Combinational logic :: A fixed network of gates computing which control signals go high, directly as a function of (opcode, current state, condition flags).
:::

::: remember
This is a finite state machine in exactly the sense a Digital Logic sequential circuit is one: control signals are the outputs, (opcode, state, flags) is the input, and the next state is computed the same way any Mealy or Moore machine's next-state logic is.
:::

## Fast, But Set In Stone

::: mistake
Hardwired control has no notion of "instructions" the way software does - there is no control store, no memory being read by the control unit itself. Every possible control-signal pattern is baked directly into gates. That is exactly why it is fast (pure logic, no extra memory access) and exactly why extending the instruction set means redesigning the circuit, not editing data.
:::

::: checkpoint
Why is hardwired control typically favoured for RISC processors?
- ( ) RISC instructions need more control signals than CISC ones
- (x) RISC's small, uniform instruction set keeps the combinational logic tractable to hardwire, and the resulting speed matters most when instructions are already simple
- ( ) Hardwired control is cheaper to redesign than microprogrammed control
- ( ) RISC processors do not use a control unit
> A small, regular instruction set keeps hardwired control's logic manageable to design and verify, and it delivers exactly the per-cycle speed RISC's philosophy is built around. A large, irregular CISC instruction set makes that same logic explode in complexity, which is why CISC historically leaned microprogrammed instead.
:::

## Tracing One Instruction Through The States

::: flow
State 0 (Fetch) -> MAR gets PC; MDR gets Memory[MAR]; IR gets MDR; PC increments
State 1 (Decode) -> Opcode identified, operand registers selected
State 2 (Execute) -> ALU operation performed, or a memory address computed
State 3 (Writeback) -> Result stored to register or memory; control returns to State 0
:::

::: tip
When a question gives you a "control signal table" - rows of (state, opcode) mapped to a set of signals - it is testing hardwired control directly, and answering it is just table lookup: find the row, read off which signals are 1.
:::`,
    deepDive: `## Why This Doesn't Scale To CISC

Every additional instruction, once its behaviour differs from existing ones in even one control signal at one state, adds real terms to the combinational logic's Boolean equations. For a handful of RISC-like instructions this stays manageable; for the hundreds of instruction variants a CISC ISA can have, the equations grow large, hard to verify, and expensive to change - exactly the design pressure that motivated microprogrammed control (the next topic).

::: behind
Formally, each control signal is its own Boolean function of (opcode bits, state bits, flag bits). Hardwired design is deriving and minimising dozens of such functions simultaneously - the same scale of problem as Karnaugh-map or Quine-McCluskey minimisation, multiplied by the number of signals rather than done once.
:::`,
    workedExamples: [
      {
        title: "Reading control signals off a state table",
        problem: "A simplified hardwired control unit's row for State 2 (Execute) under opcode ADD reads: ALU_OP = ADD, RegWrite = 1, MemRead = 0, MemWrite = 0. What is happening this cycle, and which resource sits idle?",
        solution: `Step 1: ALU_OP = ADD configures the ALU's function-select lines to route the adder's result to the output.

Step 2: RegWrite = 1 means the result will be latched into the register file at the end of this cycle.

Step 3: MemRead = 0 and MemWrite = 0 mean neither memory port is used this cycle - the memory subsystem is idle during this state, for this instruction. (This is precisely the kind of idle cycle a pipelined design, covered later in this subject, tries to fill with a DIFFERENT instruction's work instead of wasting it.)`,
      },
    ],
    keyPoints: [
      "A control unit decides WHEN and WHICH - it generates control signals, never data",
      "Hardwired control implements sequencing as pure combinational/sequential logic: instruction register + state counter + gates computing signals directly from (opcode, state, flags)",
      "There is no control memory in hardwired design - every signal pattern is wired in, which is what makes it fast and also what makes it rigid",
      "Extending the instruction set means redesigning the logic, not editing data - a real cost that scales badly for large, irregular instruction sets",
      "RISC's small, uniform instruction set is exactly what keeps hardwired control's logic tractable",
    ],
    commonMistakes: [
      "Thinking the hardwired control unit \"runs\" instructions itself - it only sequences the datapath; the ALU and registers do the actual work",
      "Believing hardwired control uses a memory or control store - it does not; that is the defining feature of the next topic instead",
      "Assuming the state counter tracks WHICH instruction is running - it tracks which CYCLE of the current instruction's execution is underway",
      "Underestimating how quickly hardwired logic complexity grows as the instruction set grows",
    ],
    analogies: [
      "A control unit is a conductor directing an orchestra - cueing each section in exactly on time and staying silent otherwise, never playing an instrument itself",
      "Hardwired control is a music box: the tune is physically carved into the cylinder's pins. Fast and reliable, but changing the tune means building a new cylinder, not writing new sheet music",
    ],
    memoryTricks: [
      "Hardwired = wired-in logic, NO control memory. Fast, rigid",
      "State = which cycle of THIS instruction, never which instruction is executing",
    ],
    formulas: [
      "Number of control-unit states per instruction = number of clock cycles that instruction's datapath execution needs",
      "Hardwired design complexity grows with the number of distinct (opcode, state) combinations needing different control-signal patterns",
    ],
    shortcuts: [
      "For a design/trace question, list states in fetch -> decode -> execute -> writeback order and assign the required signals per state - most GATE questions stop right after this listing",
      "\"Fixed\", \"fast\", \"gate-level\" in a question's wording points to hardwired; \"flexible\", \"control store\", \"firmware\" points to the next topic, microprogrammed control",
    ],
    mcqs: [
      {
        question: "A hardwired control unit generates its control signals as a function of:",
        options: [
          "A microinstruction read from a control store",
          "The opcode, the current state, and condition flags, computed directly by combinational logic",
          "The ALU's previous output only",
          "A software routine executed by the CPU",
        ],
        correctIndex: 1,
        explanation: "Hardwired control has no memory of its own to read from - control signals are a direct Boolean function of (opcode, state, flags), wired as gates.",
      },
      {
        question: "What is the main disadvantage of hardwired control unit design?",
        options: [
          "It is slower per cycle than microprogrammed control",
          "It cannot generate more than one control signal per cycle",
          "Extending or modifying the instruction set requires redesigning the logic circuit itself",
          "It cannot be used with an ALU",
        ],
        correctIndex: 2,
        explanation: "Because every control-signal pattern is wired directly into gates, adding or changing an instruction means changing the hardware, not editing data - the opposite of microprogrammed control's flexibility.",
      },
      {
        question: "Why does hardwired control suit RISC processors particularly well?",
        options: [
          "RISC instructions require more control signals overall",
          "RISC's small, regular instruction set keeps the combinational logic simple enough to hardwire while delivering maximum speed",
          "RISC processors have no control unit",
          "Hardwired control is only compatible with fixed-length instructions found in RISC",
        ],
        correctIndex: 1,
        explanation: "A small, uniform instruction set keeps hardwired logic's complexity manageable, and buys exactly the per-cycle speed RISC's design philosophy is built around.",
      },
    ],
    pyqRelevance: `Hardwired versus microprogrammed control is asked almost every year as a comparative MCQ - matching characteristics (speed, flexibility, presence of a control memory, typical use case) to the correct term. Direct control-signal-table questions are less common but appear as short conceptual 2-markers.`,
    interviewConnection: `This connects to why a RISC-V or ARM core can hit higher clock speeds than a heavily-microcoded legacy core for simple operations, and to state-machine design in general - the same discipline used for any digital control block described in Verilog or VHDL.`,
    revisionSummary: `A control unit decides WHEN and WHICH control signals fire - it never computes data itself.

Hardwired control implements this as pure combinational/sequential logic: instruction register, state counter, and gates computing each signal directly from (opcode, state, flags) - a finite state machine, no control memory involved.

This makes hardwired control fast but rigid: extending the instruction set means redesigning the logic circuit, not editing data. That trade-off is exactly why hardwired control suits small, regular (RISC-like) instruction sets far better than large, irregular (CISC-like) ones.`,
    shortNotes: {
      fiveMinute: `A control unit's entire job is deciding WHEN and WHICH control signals to raise for the datapath to execute an instruction - it never performs arithmetic or holds data itself.

Hardwired control builds this directly out of gates: an instruction register holding the current opcode, a state counter tracking which cycle of this instruction is underway, and combinational logic computing every control signal as a function of (opcode, state, flags) - exactly the same kind of finite state machine as any Digital Logic sequential circuit.

There is no control memory at all - every signal pattern is wired in. That buys real speed (pure logic, no extra memory access per cycle) at the cost of rigidity: adding or changing an instruction means redesigning the circuit, not editing data. This is precisely why hardwired control historically suited small, uniform (RISC-like) instruction sets, where the logic stays tractable, far better than large, irregular (CISC-like) ones.`,
      oneMinute: "Control unit = decides WHEN/WHICH signals, computes no data. Hardwired = pure gates: instruction register + state counter + combinational logic -> signals, as a function of (opcode, state, flags). No control memory. Fast, but changing instructions means redesigning the circuit. Suits small, regular (RISC) instruction sets.",
      nightBefore: "Hardwired control = gates only, no memory. Fast, rigid. State = cycle within ONE instruction. Suits RISC (small, uniform ISA). Contrast with microprogrammed next.",
    },
  },

  "microprogrammed-control-unit-design": {
    difficulty: "Moderate",
    estimatedMinutes: 35,
    xpReward: 25, coinReward: 10,
    // Verified real (title confirmed via direct fetch, 2026-08-13) - same
    // comparison video as hardwired-control-unit-design.
    resources: [{
      kind: "video",
      title: "Hardwired Control Unit vs Microprogrammed Control Unit: Key Differences and Comparisons",
      url: "https://www.youtube.com/watch?v=l1vBkZWyELk",
      description: "Covers both hardwired and microprogrammed control unit design, compared side by side.",
    }],
    whatYoullLearn: [
      "How a control store and micro-sequencer replace hardwired logic with data a designer can edit",
      "Horizontal versus vertical microinstructions, and the real speed-versus-space trade-off between them",
      "How to size a control store and its address width from the number and width of microinstructions",
    ],
    prerequisites: ["Hardwired Control Unit Design"],
    concept: `## Reading Sheet Music Instead Of Carving It In

::: story
Hardwired control bakes every control-signal pattern into gates. Microprogrammed control does almost the opposite: it stores those same patterns as data, in a small, fast memory called the control store, and a micro-sequencer just reads through it - like a conductor reading sheet music page by page instead of having memorised every note as muscle memory.
:::

::: remember
Each "page" is a microinstruction: one row saying exactly which control signals to assert THIS cycle, plus where to go next. A macro-instruction (an ordinary ISA instruction like ADD) is implemented as a short sequence of microinstructions - a microprogram, or microroutine.
:::

## Two Ways To Encode A Microinstruction

::: cards Horizontal versus vertical microinstructions
Horizontal :: One bit per control signal. Wide words, but a bit IS the signal - no decoding needed, so it's fast. Wastes control-store space, since most signals are 0 in any given cycle.
Vertical :: Signals grouped into encoded fields, like a mini-opcode, needing a decoder to expand into actual signals. Compact control store, but the decode step adds delay.
:::

::: mistake
"Vertical microinstructions are always better because they're smaller" ignores that decoding costs time on every single cycle. The horizontal/vertical choice is a genuine speed-versus-space trade-off, not a strictly-better option.
:::

## Finding The Right Microprogram

::: flow
Opcode fetched into IR -> a mapping ROM converts the opcode into a starting address in the control store -> the micro-sequencer walks through that macro-instruction's microroutine -> each microinstruction executes one cycle's control signals AND names the NEXT microinstruction address (sequential, or a branch on a condition)
:::

::: checkpoint
What replaces the combinational "next-state logic" of a hardwired control unit, in a microprogrammed one?
- ( ) Nothing - microprogrammed control has no notion of sequencing
- (x) An explicit "next address" field written into each microinstruction, read by a micro-sequencer
- ( ) The ALU
- ( ) The instruction register alone
> Instead of gates computing the next state, the current microinstruction simply CONTAINS the address of the next one (or a branch condition and two candidate addresses). Sequencing becomes a data-driven walk through the control store rather than logic-driven state transitions.
:::

## Why This Wins For Rich Instruction Sets

::: remember
Extending or fixing the instruction set means writing new rows into the control store - genuinely closer to "reprogramming" than "rewiring". That flexibility is exactly why microprogrammed control was the standard approach for CISC processors with large, irregular instruction sets, where hardwiring every instruction's logic directly would be an enormous, error-prone undertaking.
:::

::: interview
The cost is an extra memory access - the control store itself - every single cycle, which is why microprogrammed control is inherently slower per cycle than an equivalent hardwired design. Fewer, richer instructions can offset that by needing fewer total instruction fetches; the trade GATE wants you to see is instruction-count-vs-cycle-speed, not "microprogrammed is simply slower and therefore worse".
:::`,
    deepDive: `## Sizing The Control Store

  control store size (bits) = (number of microinstructions) x (bits per microinstruction)
  micro-sequencer address width = ceil(log2(number of microinstructions))

::: behind
A horizontal design with, say, 40 independent control signals needs at least 40 bits per microinstruction - one per signal, often plus a next-address field on top - so horizontal control stores are wide as well as usually no deeper than a vertical alternative built for the same instruction set.
:::`,
    workedExamples: [
      {
        title: "Sizing a control store",
        problem: "A control store holds 1024 microinstructions, each 30 bits wide. Find (a) the address width needed to uniquely reference every microinstruction, and (b) the total control store size in KB (1 KB = 1024 x 8 bits).",
        solution: `Step 1 (address width): 1024 = 2^10, so 10 address bits uniquely reference every microinstruction.

Step 2 (total size): 1024 microinstructions x 30 bits = 30720 bits = 30720 / 8 = 3840 bytes.

Step 3 (in KB): 3840 / 1024 = **3.75 KB**.`,
      },
    ],
    keyPoints: [
      "Microprogrammed control stores control-signal patterns as DATA (microinstructions) in a control store, walked by a micro-sequencer",
      "A macro-instruction (ADD, say) maps to a short sequence of microinstructions - a microroutine, located via a mapping step from the opcode",
      "Horizontal microinstructions (one bit per signal) are fast but wide; vertical ones (encoded fields) are compact but need a decoder, adding delay",
      "Control store size = microinstruction count x width; address width = ceil(log2(microinstruction count))",
      "Microprogrammed control trades per-cycle speed (an extra memory access) for flexibility - editing behaviour means rewriting data, not redesigning gates",
    ],
    commonMistakes: [
      "Assuming vertical (encoded) microinstructions are faster because they're smaller - the decode step actually costs cycle time",
      "Treating microprogrammed control as \"software\" the way an OS is - it sits below the ISA entirely, invisible to any program, and is more accurately called firmware",
      "Forgetting the mapping step (opcode -> starting control-store address) and assuming every instruction's microroutine starts at address 0",
      "Treating a control-store access as free - it is a real memory access, adding to cycle time exactly like any other memory read",
    ],
    analogies: [
      "A microprogrammed control unit is a conductor reading printed sheet music instead of having memorised the piece - correcting a wrong note means editing the page, not retraining years of muscle memory",
      "The control store is a lookup table of \"what to do this cycle\", addressed by opcode much the way a jump table dispatches a switch statement",
    ],
    memoryTricks: [
      "Horizontal = one bit, one signal, no decode, wide and fast. Vertical = encoded fields, needs a decoder, compact and slower",
      "Micro-sequencer address width is just log2 of the microinstruction count - the same log2 arithmetic as everywhere else in this subject",
    ],
    formulas: [
      "Control store size (bits) = number of microinstructions x microinstruction width",
      "Micro-sequencer address width = ceil(log2(number of microinstructions))",
      "Horizontal microinstruction width >= number of independent control signals",
    ],
    shortcuts: [
      "For control-store sizing questions, compute address width and total size as two separate one-line calculations - they don't depend on each other",
      "\"Flexible\", \"easy to modify\", \"firmware\", \"control store\" in a question's wording all point to microprogrammed control; \"fixed\", \"fast\", \"gate-level\" points to hardwired",
    ],
    mcqs: [
      {
        question: "In microprogrammed control, what determines the control signals asserted in a given cycle?",
        options: [
          "Combinational logic computed directly from the opcode and state",
          "A microinstruction read from the control store",
          "The ALU's status flags alone",
          "A hardwired sequencer with no memory",
        ],
        correctIndex: 1,
        explanation: "Microprogrammed control stores the signal patterns as data - each cycle's signals come from reading a microinstruction out of the control store, not from combinational logic.",
      },
      {
        question: "What is the main disadvantage of microprogrammed control compared to hardwired control?",
        options: [
          "It cannot support complex instructions",
          "It requires an extra memory access (the control store itself) every cycle, making it slower per cycle",
          "It cannot be modified once built",
          "It requires more registers",
        ],
        correctIndex: 1,
        explanation: "Reading each microinstruction from the control store is a real memory access every cycle, which hardwired control's direct combinational logic does not need - the source of microprogrammed control's inherent per-cycle speed disadvantage.",
      },
      {
        question: "A control store must hold 256 microinstructions. How many address bits does the micro-sequencer need?",
        options: ["6", "8", "16", "256"],
        correctIndex: 1,
        explanation: "256 = 2^8, so 8 address bits are needed to uniquely reference every microinstruction.",
      },
    ],
    numericals: [
      {
        question: "A control store holds 512 microinstructions. How many address bits does the micro-sequencer need to uniquely reference every microinstruction?",
        answerMin: 9, answerMax: 9,
        unit: "bits",
        solution: "512 = 2^9, so the address width is **9 bits**.",
      },
    ],
    pyqRelevance: `Hardwired-versus-microprogrammed comparison MCQs (speed, flexibility, presence of a control store, typical use case) are asked nearly every year. Numerically, control-store sizing (address bits, total size) is the recurring 1-2 mark computation, and it is pure log2/multiplication arithmetic once the microinstruction count and width are given.`,
    interviewConnection: `Microcode still exists in real x86 CPUs today specifically to patch instruction behaviour via firmware updates - microcode updates that fix silicon bugs, including security issues, without a new chip - which is a direct, present-day payoff of the same idea taught here.`,
    revisionSummary: `Microprogrammed control stores control-signal patterns as data (microinstructions) in a control store, sequenced by a micro-sequencer that reads a next-address field from each microinstruction rather than computing it with logic.

Horizontal microinstructions (one bit per signal) are fast but wide; vertical ones (encoded, needing a decoder) are compact but slower per cycle.

Control store size = microinstruction count x width. Address width = ceil(log2(microinstruction count)).

Trade-off versus hardwired: an extra memory access per cycle (slower), in exchange for editing behaviour by rewriting data instead of redesigning gates (far more flexible) - which is why it suited large, irregular CISC instruction sets historically.`,
    shortNotes: {
      fiveMinute: `Microprogrammed control stores what a hardwired unit would wire into gates as DATA instead: a control store (a small, fast memory) holding microinstructions, each one saying exactly which control signals to assert this cycle and which microinstruction comes next. A micro-sequencer just walks through them, guided by a next-address field baked into each microinstruction rather than by combinational next-state logic.

A macro-instruction like ADD maps to a short microroutine - a handful of microinstructions - located by mapping the opcode to a starting control-store address.

Microinstructions come in two styles: horizontal (one bit per control signal - wide, but no decoding needed, so fast) and vertical (signals grouped into encoded fields - compact, but needs a decoder, adding delay). Neither is simply better; it's a real space-versus-speed trade-off.

Sizing: control store size = microinstruction count x width; address width = ceil(log2(microinstruction count)).

The cost of all this flexibility is an extra memory access (the control store read) every cycle - inherently slower per cycle than hardwired control - which is exactly why microprogrammed control suited large, irregular CISC instruction sets, where hardwiring every instruction directly would be unmanageable.`,
      oneMinute: "Microprogrammed = control signals stored as microinstructions in a control store, walked by a micro-sequencer using an explicit next-address field. Horizontal = 1 bit/signal, fast, wide. Vertical = encoded, needs decoder, compact, slower. Store size = count x width; address bits = log2(count). Extra memory access per cycle = slower than hardwired, but far more flexible (edit data, not gates).",
      nightBefore: "Control store = memory holding microinstructions (data, not gates). Horizontal = wide+fast, no decode. Vertical = compact+slower, needs decode. Extra memory read per cycle vs hardwired. Suits CISC (rich, irregular ISA).",
    },
  },

  // ---------------- Memory Interfacing and Hierarchy ----------------

  "memory-hierarchy-and-performance": {
    difficulty: "Moderate",
    estimatedMinutes: 35,
    xpReward: 25, coinReward: 10,
    // Verified real (title confirmed via direct fetch, 2026-08-13).
    resources: [{
      kind: "video",
      title: "Memory Hierarchy & Interfacing - Neso Academy",
      url: "https://www.youtube.com/watch?v=lQcU4WwVALI",
      description: "Whole video covers this topic from the start.",
    }],
    whatYoullLearn: [
      "Why no single memory technology can be both fast and huge, and how the hierarchy is the answer to that limit",
      "Temporal and spatial locality - the one empirical fact that makes any of this worthwhile",
      "How to compute Average Memory Access Time (AMAT), including chaining it across multiple levels",
    ],
    prerequisites: ["Microprogrammed Control Unit Design"],
    concept: `## Why Not Just Build One Big Fast Memory?

::: story
A memory that's as fast as a register and as large as a hard disk would be wonderful, and nobody can build it - fast memory (SRAM) is expensive and physically limited in size, cheap memory (DRAM, disk) is slow. So instead of one memory, real systems stack several: small-and-fast on top, huge-and-slow at the bottom, exactly like keeping the tools you use constantly on your desk, the ones you use weekly in a drawer, and everything else in a storeroom down the hall.
:::

::: cards The stack, top to bottom
Registers :: A handful of words, inside the CPU itself. Effectively zero access time.
Cache (L1/L2/L3) :: Kilobytes to a few megabytes, on or near the CPU die. A few to a few tens of cycles.
Main memory (RAM) :: Gigabytes, off-chip. Tens to a couple hundred cycles.
Secondary storage (SSD/disk) :: Terabytes. Thousands to millions of cycles.
:::

::: remember
Going down the hierarchy: capacity goes UP, cost per byte goes DOWN, and access time goes UP. No level is "better" - each is a different point on the same trade-off, and the hierarchy only works because of one empirical fact about how programs actually behave.
:::

## The One Fact That Justifies All Of This

::: cards Locality, the property that makes hierarchy work
Temporal locality :: If a location was accessed recently, it's likely to be accessed again soon (loop variables, frequently-called functions).
Spatial locality :: If a location was accessed, nearby locations are likely to be accessed soon too (array traversal, sequential instruction fetch).
:::

::: mistake
Without locality, caching would be pointless - a cache only helps if the SAME or NEARBY data keeps getting reused while it's still sitting in the fast level. A program that accesses memory in a genuinely random, unpredictable pattern gets little benefit from any cache size at all.
:::

## Judging The Hierarchy By One Number

::: remember
Average Memory Access Time (AMAT) is what a memory hierarchy is actually judged by - not hit rate alone, because a very high hit rate paired with an expensive miss penalty can still lose to a lower hit rate with a cheap one.

  AMAT = Hit time + Miss rate x Miss penalty
:::

::: checkpoint
Design A: hit time 1 cycle, miss rate 5%, miss penalty 100 cycles. Design B: hit time 2 cycles, miss rate 2%, miss penalty 100 cycles. Which has the better (lower) AMAT?
- ( ) Design A (1 + 0.05x100 = 6)
- (x) Design B (2 + 0.02x100 = 4)
- ( ) They are equal
- ( ) Cannot be determined
> AMAT(A) = 1 + 5 = 6 cycles. AMAT(B) = 2 + 2 = 4 cycles. Design B has a slower hit but a much lower miss rate, and comes out ahead - exactly the trap that comparing hit rates alone would miss.
:::

## Multi-Level Hierarchies Chain The Same Formula

::: tip
With an L1 and L2 cache, AMAT nests: AMAT = L1 hit time + L1 miss rate x (L2 hit time + L2 miss rate x main memory access time). Each level's "miss penalty" is really just the AMAT of everything below it - the same formula applied recursively, one level at a time, worked out from the BOTTOM up.
:::`,
    workedExamples: [
      {
        title: "Average access time through a two-level hierarchy",
        problem: "L1 hit time = 2 cycles, L1 miss rate = 8%. L2 hit time = 15 cycles, L2 miss rate (of L1 misses reaching L2) = 20%. Main memory access time = 200 cycles. Find the overall AMAT.",
        solution: `Step 1 (innermost first): AMAT of L2-and-below = L2 hit time + L2 miss rate x main memory time = 15 + 0.20 x 200 = 15 + 40 = 55 cycles.

Step 2 (plug in as L1's miss penalty): overall AMAT = L1 hit time + L1 miss rate x (AMAT of L2-and-below) = 2 + 0.08 x 55 = 2 + 4.4 = **6.4 cycles**.

Working bottom-up is essential here - computing L1's contribution before L2's would use a miss penalty that hasn't been found yet.`,
      },
    ],
    keyPoints: [
      "Memory hierarchy exists because no single technology is both fast and large: registers, cache, main memory, disk trade capacity for speed at every step down",
      "Temporal locality (reuse soon) and spatial locality (reuse nearby) are the two properties that make any hierarchy actually pay off",
      "AMAT = Hit time + Miss rate x Miss penalty is the single number a hierarchy design is judged by, not hit rate alone",
      "Multi-level AMAT nests: each level's miss penalty IS the AMAT of everything below it, computed from the bottom up",
      "A design with a higher miss rate can still win on AMAT if its hit time or miss penalty is enough smaller - never compare hit rates alone",
    ],
    commonMistakes: [
      "Comparing hit rates directly between two designs instead of finishing the full AMAT calculation",
      "Working a multi-level AMAT problem top-down instead of bottom-up, and plugging in a miss penalty that hasn't been computed yet",
      "Assuming a bigger cache or a bigger level always wins - ignoring cost and the fact that a bigger level is usually also slower per access",
      "Confusing temporal and spatial locality when asked which one explains a specific access pattern (looping over the same variable vs scanning an array sequentially)",
    ],
    analogies: [
      "Keeping frequently used tools on your desk instead of a distant supply cupboard - reach for the desk first (cache), the drawer next (a further cache level), the cupboard down the hall only when you must (main memory or disk)",
    ],
    memoryTricks: [
      "Down the hierarchy: bigger, cheaper per byte, slower. Every level is a trade, never an upgrade",
      "AMAT = pay the hit price always, plus the miss price only sometimes (miss rate x penalty)",
    ],
    formulas: [
      "AMAT = Hit time + Miss rate x Miss penalty",
      "Multi-level AMAT = L1 hit time + L1 miss rate x (L2 hit time + L2 miss rate x main memory time)",
    ],
    shortcuts: [
      "Always compute the innermost (lowest) level's AMAT first in a multi-level problem, then use it as the outer level's miss penalty - never work top-down",
      "Never compare two hierarchy designs on hit rate alone - always finish the AMAT calculation before deciding which is better",
    ],
    mcqs: [
      {
        question: "Which property of program behaviour justifies keeping recently accessed data in a fast cache?",
        options: ["Spatial locality", "Temporal locality", "Register allocation", "Instruction pipelining"],
        correctIndex: 1,
        explanation: "Temporal locality is the tendency to reuse the SAME location again soon - it is exactly what makes keeping recently touched data nearby pay off.",
      },
      {
        question: "A design with a higher miss rate than another can still have a lower (better) AMAT if:",
        options: [
          "It never actually happens",
          "Its hit time or miss penalty is sufficiently smaller to offset the higher miss rate",
          "Hit rate is always the deciding factor regardless of other terms",
          "AMAT does not depend on miss rate",
        ],
        correctIndex: 1,
        explanation: "AMAT combines all three terms - hit time, miss rate, and miss penalty. A sufficiently smaller hit time or miss penalty can outweigh a higher miss rate, which is why comparing hit rate alone is unreliable.",
      },
      {
        question: "In a two-level memory hierarchy, the correct way to compute overall AMAT is to:",
        options: [
          "Add L1's AMAT and L2's AMAT directly",
          "Compute L2's AMAT (using main memory as its miss penalty) first, then use that as L1's miss penalty",
          "Ignore L2 if L1's hit rate is high enough",
          "Use main memory's access time as the only miss penalty for L1",
        ],
        correctIndex: 1,
        explanation: "The formula nests: each level's miss penalty is the AMAT of everything below it. That means the lowest level must be resolved first, then substituted upward - working top-down uses a number that doesn't exist yet.",
      },
    ],
    numericals: [
      {
        question: "A cache has a hit time of 2 cycles, a miss rate of 5%, and a miss penalty of 160 cycles. What is the AMAT in cycles?",
        answerMin: 10, answerMax: 10,
        unit: "cycles",
        solution: "AMAT = hit time + miss rate x miss penalty = 2 + 0.05 x 160 = 2 + 8 = **10 cycles**.",
      },
    ],
    pyqRelevance: `Memory hierarchy questions split into conceptual MCQs (locality, why hierarchy exists, ordering levels by speed/cost) and the most common numerical shape in this whole subject: given hit times, miss rates, and penalties - often across two levels - compute AMAT. Getting the recursive multi-level formula right, worked from the bottom up, is worth more marks than any other single habit in Computer Organization.`,
    interviewConnection: `"Why is my code slow" in a real job is very often a memory-hierarchy answer: a cache-unfriendly access pattern (poor locality) turns cheap register/cache-speed operations into main-memory-speed ones - which is the entire reason profilers report cache-miss rates at all.`,
    revisionSummary: `Memory hierarchy exists because no single technology is both fast and large - registers, cache, RAM, disk trade capacity for speed going down.

Temporal locality (reuse soon) and spatial locality (reuse nearby) are why any of this pays off; without locality, a cache would not help.

AMAT = Hit time + Miss rate x Miss penalty is the single figure a design is judged by, never hit rate alone. Multi-level AMAT nests - resolve the lowest level first, and use its AMAT as the level above's miss penalty.`,
    shortNotes: {
      fiveMinute: `No memory technology is both fast and huge, so real systems stack several: registers (near-zero access time, a handful of words) at the top, cache (a few to some tens of cycles, kilobytes to megabytes) next, main memory (tens to hundreds of cycles, gigabytes) below that, and disk/SSD (thousands-plus cycles, terabytes) at the bottom. Going down: bigger, cheaper per byte, slower - a trade at every step, never a simple upgrade.

This only pays off because of locality: temporal (recently accessed data tends to be accessed again soon) and spatial (accessing one location makes nearby locations likely to be accessed soon too).

The hierarchy is judged by Average Memory Access Time, not hit rate alone: AMAT = hit time + miss rate x miss penalty. A slower hit time with a much lower miss rate can still win - always finish the calculation rather than comparing hit rates directly.

For multiple levels, the formula nests: each level's "miss penalty" is the AMAT of everything below it, so a multi-level problem must be solved from the BOTTOM level upward.`,
      oneMinute: "Hierarchy: registers > cache > RAM > disk - bigger, cheaper, slower going down. Works because of temporal + spatial locality. AMAT = hit time + miss rate x miss penalty; judge designs on AMAT, never hit rate alone. Multi-level: solve bottom level first, use its AMAT as the level above's miss penalty.",
      nightBefore: "AMAT = hit time + miss rate x penalty. Multi-level: bottom-up, not top-down. Locality (temporal/spatial) is WHY hierarchy works at all. Never compare on hit rate alone.",
    },
  },

  "cache-performance-and-replacement-policies": {
    difficulty: "Moderate",
    estimatedMinutes: 40,
    xpReward: 25, coinReward: 10,
    // Verified real (title confirmed via direct fetch, 2026-08-13).
    resources: [{
      kind: "video",
      title: "Cache Replacement Policies - MRU, LRU, Pseudo-LRU, & LFU - Neso Academy",
      url: "https://www.youtube.com/watch?v=_Hh-NcdbHCY",
      description: "Whole video covers this topic from the start.",
    }],
    whatYoullLearn: [
      "LRU, FIFO, Optimal and Random replacement - what each one assumes, and how to hand-trace hits and misses",
      "Belady's Anomaly - why a bigger FIFO cache can genuinely produce MORE misses, and why LRU can never do that",
      "Which write-policy pairing (write-back+write-allocate, write-through+no-write-allocate) goes with which, and why",
    ],
    prerequisites: ["Cache Memory Mapping"],
    concept: `## When The Cache Is Full, Something Has To Leave

::: story
Mapping decides which set a block CAN live in. Once that set is full and a new block needs to come in, something already there has to be evicted. Replacement policy is the rule for choosing the victim - like deciding which book to pull off an already-full shelf to make room for a new one.
:::

::: cards The policies GATE actually asks about
LRU (Least Recently Used) :: Evict whichever line hasn't been touched for the longest time. Exploits temporal locality directly.
FIFO (First In, First Out) :: Evict whichever line arrived earliest, regardless of how recently it was used. Simple, ignores usage entirely.
Optimal / MIN (Belady's algorithm) :: Evict whichever line won't be needed again for the longest time in the FUTURE. Needs to see the future, so it is never actually implementable - it exists purely as the theoretical best case every real policy is measured against.
Random :: Evict a randomly chosen line. Cheap in hardware, and often not much worse than LRU in practice.
:::

::: remember
LRU needs real hardware to track recency - counters or a stack per set - which gets genuinely expensive at high associativity. Real caches often approximate it (pseudo-LRU) rather than tracking it exactly.
:::

## Belady's Anomaly: Bigger Isn't Always Better

::: mistake
It seems obvious that a LARGER cache can only have fewer or equal misses than a smaller one, for the same reference string. That's true for LRU and Optimal, but FIFO can violate it: for some reference strings, a bigger FIFO cache genuinely produces MORE misses than a smaller one. This is Belady's Anomaly. LRU and Optimal are "stack algorithms" - a smaller cache's contents are always a SUBSET of what a bigger cache holds at every point in the sequence - which rules the anomaly out for them by construction; FIFO has no such guarantee.
:::

::: checkpoint
Which replacement policy can exhibit Belady's Anomaly (more misses with a larger cache, same reference string)?
- ( ) LRU
- ( ) Optimal
- (x) FIFO
- ( ) All of the above equally
> FIFO is the classic example. LRU and Optimal are stack algorithms - a smaller cache's contents are always a subset of a larger cache's contents at every point in the sequence - which makes the anomaly structurally impossible for them.
:::

## Write Policy Rides Along With Replacement

::: cards Two independent choices that usually travel together
Write-through :: Every write goes to cache AND memory immediately. Simpler, needs no dirty bit, but generates more memory traffic.
Write-back :: Writes only update the cache; memory is updated later, on eviction, only if the dirty bit is set. Less memory traffic, but eviction may now need an extra write-back.
Write-allocate :: On a write MISS, the block is fetched into the cache first, then written. Usually paired with write-back.
No-write-allocate :: On a write miss, the write goes straight to memory, bypassing the cache. Usually paired with write-through.
:::

::: tip
"Write-back + write-allocate" and "write-through + no-write-allocate" are the two combinations GATE actually uses - each pairing avoids creating a cost the OTHER policy would otherwise add. Write-back already defers memory writes, so it is worth caching the whole block on a miss too, since it may be written again; write-through already writes every time, so there's no benefit to allocating a whole line just for one write.
:::`,
    codeExample: {
      language: "javascript",
      code: `function simulate(useLRU, refs, capacity) {
  var cache = [];
  var hits = 0, misses = 0;
  for (var i = 0; i < refs.length; i++) {
    var page = refs[i];
    var idx = cache.indexOf(page);
    if (idx !== -1) {
      hits++;
      if (useLRU) {
        cache.splice(idx, 1);
        cache.push(page);
      }
      continue;
    }
    misses++;
    if (cache.length === capacity) cache.shift();
    cache.push(page);
  }
  return { hits: hits, misses: misses };
}

// The classic Belady's Anomaly reference string
var refs = [1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5];

console.log("FIFO, 3 frames:", simulate(false, refs, 3));
console.log("FIFO, 4 frames:", simulate(false, refs, 4));
console.log("LRU,  3 frames:", simulate(true, refs, 3));
console.log("LRU,  4 frames:", simulate(true, refs, 4));`,
      expectedOutput: `FIFO, 3 frames: { hits: 3, misses: 9 }
FIFO, 4 frames: { hits: 2, misses: 10 }
LRU,  3 frames: { hits: 2, misses: 10 }
LRU,  4 frames: { hits: 4, misses: 8 }`,
    },
    workedExamples: [
      {
        title: "Hand-tracing LRU on a short reference string",
        problem: "A cache can hold 3 lines. Reference string (block IDs): 1, 2, 3, 1, 4, 2. Using LRU, trace hits and misses.",
        solution: `Step 1: ref 1 - miss. Cache = [1].
Step 2: ref 2 - miss. Cache = [1, 2].
Step 3: ref 3 - miss. Cache = [1, 2, 3] (now full).
Step 4: ref 1 - HIT. Move 1 to most-recently-used position: Cache = [2, 3, 1].
Step 5: ref 4 - miss. Evict least-recently-used = 2. Cache = [3, 1, 4].
Step 6: ref 2 - miss. Evict least-recently-used = 3. Cache = [1, 4, 2].

Total: 5 misses (1, 2, 3, 4, 2), 1 hit (the second reference to 1). Final cache contents: {1, 4, 2}.`,
      },
    ],
    keyPoints: [
      "Replacement policy decides which line to evict once a set is full - LRU (recency), FIFO (arrival order), Optimal (future knowledge, unimplementable), Random",
      "Belady's Anomaly: FIFO can produce MORE misses with a LARGER cache on the same reference string; LRU and Optimal never can, because they are stack algorithms",
      "LRU needs real hardware (counters/a stack per set) to track exact recency, which is why pseudo-LRU approximations are common in practice",
      "Write-back defers memory updates until eviction, tracked by a dirty bit; write-through updates memory on every write, needing no dirty bit",
      "The standard pairings are write-back + write-allocate, and write-through + no-write-allocate - each avoids adding the cost the other policy would create",
    ],
    commonMistakes: [
      "Assuming a bigger cache always has fewer or equal misses under ANY policy - true for LRU/Optimal, false for FIFO (Belady's Anomaly)",
      "Believing LRU is provably optimal - it is a heuristic exploiting temporal locality; only Optimal/MIN (which needs future knowledge) is the true best case",
      "Mismatching write-policy pairings - assuming write-through pairs with write-allocate, when the standard pairing is the opposite",
      "Assuming true LRU is cheap in hardware - exact recency tracking needs per-set counters or a stack, which is why pseudo-LRU exists at all",
      "Forgetting FIFO and LRU can give genuinely different results for the SAME reference string and cache size - one is not simply a simpler version of the other",
    ],
    analogies: [
      "Evicting from a full shelf: LRU removes the book you haven't touched in the longest time; FIFO removes whichever book arrived first, even if you read it five minutes ago; Optimal (impossible in real time) removes the book you happen to know you won't need again for the longest time",
    ],
    memoryTricks: [
      "FIFO can betray you as the cache grows - Belady's Anomaly. LRU and Optimal never can - they're stack algorithms",
      "Write-BACK defers, so it's worth ALLOCATING the whole line on a miss (you'll likely write it again). Write-THROUGH already pays every time, so don't bother allocating on a miss you may not reuse",
    ],
    formulas: [
      "Hit ratio = hits / total references; miss ratio = 1 - hit ratio",
      "For a stack algorithm (LRU, Optimal), misses(cache size k) is monotonically non-increasing as k grows - this does NOT hold for FIFO",
    ],
    shortcuts: [
      "For a hand-trace question, keep an explicit ordered list per set: front = next to evict. Every hit under LRU means \"move to the back\"; every hit under FIFO means \"do nothing to the order\"",
      "If a question asks you to demonstrate that a bigger cache can perform worse, it is asking about FIFO and Belady's Anomaly - no other listed policy can produce that result",
    ],
    mcqs: [
      {
        question: "Which statement about Belady's Anomaly is correct?",
        options: [
          "It can occur under LRU, FIFO, and Optimal equally",
          "It is the phenomenon where a larger FIFO cache can produce MORE misses than a smaller one, for the same reference string",
          "It means LRU always outperforms FIFO",
          "It only occurs in fully associative caches",
        ],
        correctIndex: 1,
        explanation: "Belady's Anomaly is specifically that increasing FIFO cache size can increase misses - a genuine counterexample to the intuition that bigger caches can only help. LRU and Optimal are stack algorithms and cannot exhibit it.",
      },
      {
        question: "Which write-policy pairing is standard, and why?",
        options: [
          "Write-through with write-allocate, because both add work on every access",
          "Write-back with write-allocate, and write-through with no-write-allocate, because each pairing avoids adding the cost the other policy would create",
          "Write-back always requires no-write-allocate",
          "Write policy and allocation policy are unrelated choices with no typical pairing",
        ],
        correctIndex: 1,
        explanation: "Write-back defers writes, so caching the whole block on a miss (write-allocate) is worthwhile since it may be written again before eviction. Write-through already writes through on every access, so allocating a whole line for one write (no-write-allocate skips this) buys little.",
      },
      {
        question: "Why is exact LRU often approximated (pseudo-LRU) in real hardware rather than implemented precisely?",
        options: [
          "LRU is not actually better than random replacement",
          "Precisely tracking recency needs per-set counters or a stack, which becomes expensive as associativity grows",
          "LRU cannot be implemented in hardware at all",
          "Pseudo-LRU is required by the ISA",
        ],
        correctIndex: 1,
        explanation: "Exact LRU needs real bookkeeping - counters or an ordered stack per set - that grows more expensive with higher associativity, which is why practical designs often approximate recency instead of tracking it perfectly.",
      },
    ],
    numericals: [
      {
        question: "A cache with 3 lines uses LRU. For the reference string (block IDs) 1, 2, 3, 1, 4, 2, how many misses occur?",
        answerMin: 5, answerMax: 5,
        unit: "misses",
        solution: "Trace: 1(miss) 2(miss) 3(miss) 1(HIT) 4(miss, evicts 2) 2(miss, evicts 3). Misses = 1,2,3,4,2 = **5 misses**, 1 hit.",
      },
    ],
    pyqRelevance: `Cache performance questions split into two shapes: a hit/miss trace under a named policy (LRU/FIFO) for a given reference string and cache size, and a conceptual MCQ on which policy suffers Belady's Anomaly or which write-policy pairing is standard. Both are frequent, low-effort marks once the trace method - an explicit ordered list, updated per access - is automatic.`,
    interviewConnection: `Real production caches (CPU caches, but also application-level caches like Redis or a CDN cache) live and die by exactly this trade-off - LRU is the default eviction policy in most real systems for the same reason it is taught here, and "why did our cache hit rate drop after we resized it" is sometimes, surprisingly, an actual instance of Belady's-Anomaly-shaped behaviour in a FIFO-like eviction scheme.`,
    revisionSummary: `Replacement policy decides which line to evict when a full set needs room: LRU (least recently used), FIFO (earliest arrival), Optimal/MIN (future knowledge, theoretical only), Random.

Belady's Anomaly: FIFO can produce MORE misses with a BIGGER cache on the same reference string. LRU and Optimal cannot - they are stack algorithms, where a smaller cache's contents are always a subset of a bigger one's.

Write-back defers memory updates (needs a dirty bit); write-through updates memory every write (no dirty bit needed). Standard pairings: write-back+write-allocate, write-through+no-write-allocate.`,
    shortNotes: {
      fiveMinute: `When a full set needs to evict a line, the replacement policy decides which one: LRU evicts the least-recently-used line (exploiting temporal locality), FIFO evicts whichever arrived earliest regardless of use, Optimal/MIN evicts whichever won't be needed for the longest time in the future (impossible to implement, used only as the theoretical benchmark), and Random evicts arbitrarily.

Belady's Anomaly is the surprising fact that a BIGGER FIFO cache can produce MORE misses than a smaller one on the same reference string. This cannot happen for LRU or Optimal, because both are "stack algorithms" - a smaller cache's contents are always a subset of what a larger cache holds at every point in the sequence.

Write policy is a separate axis: write-through pushes every write to memory immediately (no dirty bit needed); write-back defers memory updates until eviction, tracked by a dirty bit. The standard pairings are write-back with write-allocate (fetch the block into cache on a write miss, since write-back writes will likely reuse it) and write-through with no-write-allocate (skip caching a block you're only writing to once).

Hand-tracing hits/misses: keep an explicit ordered list per set, moving the accessed line to the "most recent" end on every LRU hit, and never reordering on a FIFO hit.`,
      oneMinute: "Replacement: LRU (recency), FIFO (arrival order), Optimal (future, ideal only), Random. Belady's Anomaly: bigger FIFO cache can have MORE misses - impossible for LRU/Optimal (stack algorithms). Write-back+write-allocate and write-through+no-write-allocate are the standard pairings. Trace hits/misses with an explicit ordered list per set.",
      nightBefore: "FIFO can get WORSE with a bigger cache (Belady's Anomaly). LRU/Optimal never can. Write-back = defer + dirty bit + write-allocate. Write-through = immediate + no dirty bit + no-write-allocate.",
    },
  },

  "memory-interfacing": {
    difficulty: "Moderate",
    estimatedMinutes: 35,
    xpReward: 25, coinReward: 10,
    // Verified real (title confirmed via direct fetch, 2026-08-13) - same
    // chapter video as memory-hierarchy-and-performance, which covers both.
    resources: [{
      kind: "video",
      title: "Memory Hierarchy & Interfacing - Neso Academy",
      url: "https://www.youtube.com/watch?v=lQcU4WwVALI",
      description: "Covers memory interfacing and hierarchy together.",
    }],
    whatYoullLearn: [
      "How memory chips combine for width (data bus size) and depth (address space size) as two separate calculations",
      "Where address bits go: which bits address a location INSIDE a chip, and which bits select WHICH chip",
      "Full versus partial address decoding, and the real hazard partial decoding creates (address aliasing)",
    ],
    prerequisites: ["Cache Performance and Replacement Policies"],
    concept: `## Wiring Memory Chips Into A CPU

::: story
A real memory system is rarely one chip - it's several chips wired together, because no single chip gives exactly the width (bits per word) and depth (number of words) a design needs. Memory interfacing is the job of combining chips, and correctly telling the CPU's address which chip and which location inside it a given address means - the same way standard-sized shelving units get combined into a custom-sized bookcase.
:::

::: cards Two separate dimensions to expand
Width expansion :: Need MORE BITS per word than one chip provides? Put chips side by side, each handling a slice of the data bus, all sharing the same address bus and the same chip-select.
Depth expansion :: Need MORE WORDS than one chip provides? Put chip GROUPS one after another, each group getting its own chip-select range, decoded from the high-order address bits.
:::

::: remember
Total chips needed = (chips needed for width) x (chips needed for depth). Work these out as two separate, independent divisions, then multiply - never as one combined calculation.
:::

## Where The Address Bits Actually Go

::: flow
Low-order address bits -> select the word WITHIN a chip (must cover every word one chip holds)
High-order address bits -> feed a decoder that generates chip-select signals, choosing WHICH group of chips is active
:::

::: checkpoint
You need to build 1M x 8 memory from 256K x 8 chips. How many chips, and how are the address bits split?
- ( ) 4 chips; all address bits go to each chip
- (x) 4 chips; the low 18 bits (log2(256K)) go to every chip's own address pins, and the top 2 bits feed a decoder selecting which one of the 4 chips is enabled
- ( ) 8 chips; split the data bus in half
- ( ) 1 chip is enough
> 1M / 256K = 4, and since each chip already supplies the full 8-bit width, this is pure depth expansion - no width expansion needed. 256K = 2^18, so 18 low address bits go into every chip; the remaining top bits (log2(4) = 2) select which single chip is enabled via chip-select.
:::

## Decoding: Full Versus Partial

::: cards Two ways to generate chip-select
Full decoding :: Every high-order address bit is used, so each address maps to exactly one chip, uniquely, with no wasted or overlapping ranges.
Partial decoding :: Some high-order bits are ignored. Cheaper decoder hardware, but the same physical chip now answers to MULTIPLE address ranges (aliasing) - a real design hazard, not just a theoretical curiosity.
:::

::: tip
"Foldback" or "aliasing" in a memory-map question is exactly what partial decoding produces - the same physical byte is reachable at more than one address, because the decoder never bothered checking every bit that could have distinguished them.
:::

## Bus Timing, In One Sentence

::: remember
A read or write cycle is not instantaneous - the address must be stable on the bus for a minimum SETUP time before the control signal (a read or write strobe) is asserted, and stable for a minimum HOLD time after, or the memory chip may capture the wrong value. That is why memory speed is quoted as an access time, not treated as instant.
:::`,
    workedExamples: [
      {
        title: "Combining chips for both width and depth",
        problem: "Design a 64K x 16 memory system using 16K x 4 chips. How many chips are needed in total, and how are they arranged?",
        solution: `Step 1 (width expansion): required width / chip width = 16 / 4 = 4 chips needed side by side, to build one full 16-bit-wide row.

Step 2 (depth expansion): required depth / chip depth = 64K / 16K = 4 groups needed, one after another.

Step 3 (total chips): width chips x depth groups = 4 x 4 = **16 chips**.

Step 4 (address split): the word-select going into every chip = log2(16K) = 14 bits, identical on every chip. The remaining log2(4) = 2 high-order bits feed a decoder producing 4 chip-select lines, each one enabling one whole row of 4 (width-expansion) chips together.`,
      },
    ],
    keyPoints: [
      "Memory interfacing combines chips along two independent dimensions: width (more bits per word) and depth (more words)",
      "Total chips needed = (width expansion factor) x (depth expansion factor), computed as two separate divisions then multiplied",
      "Low-order address bits always select the word WITHIN a chip; high-order bits feed a decoder that selects WHICH chip group is active",
      "Full decoding maps every address to exactly one chip; partial decoding is cheaper but causes address aliasing (foldback)",
      "Bus timing (setup and hold times around the address and control signals) makes a memory access a real, non-instantaneous operation",
    ],
    commonMistakes: [
      "Doing one combined calculation instead of separate width and depth expansions, then multiplying",
      "Forgetting that low-order address bits go to EVERY chip identically - only the high-order bits differ per chip group",
      "Confusing full and partial decoding, or assuming partial decoding is simply \"wrong\" rather than a real, sometimes deliberate, cost trade-off",
      "Ignoring setup/hold timing and treating a memory access as instantaneous",
    ],
    analogies: [
      "Building a custom bookcase from standard shelving units: put units side by side for more width per shelf (data bus), stack a whole additional shelving unit for more shelves (address depth) - and the topmost digits of the shelf number decide which unit to open (chip-select decoding)",
    ],
    memoryTricks: [
      "Width = side by side (splits the DATA bus). Depth = one after another (splits the ADDRESS space)",
      "Full decoding = no aliasing. Partial decoding = cheaper, but the same byte answers to more than one address",
    ],
    formulas: [
      "Chips for width = required data width / chip width",
      "Chips for depth = required number of words / chip's number of words",
      "Total chips = chips for width x chips for depth",
      "Address bits into each chip = log2(chip's word count); address bits into the chip-select decoder = log2(number of depth groups)",
    ],
    shortcuts: [
      "Always solve width expansion and depth expansion as two separate divisions, then multiply - doing it in one combined step is where arithmetic mistakes creep in",
      "The low-order address bits going INTO a chip are always log2(that chip's own word count) - this never changes no matter how many chips are combined around it",
    ],
    mcqs: [
      {
        question: "A 64K x 8 memory is built from 16K x 8 chips. How many chips are needed?",
        options: ["2", "4", "8", "16"],
        correctIndex: 1,
        explanation: "This is pure depth expansion (widths already match): 64K / 16K = 4 chips, each holding a different range of addresses.",
      },
      {
        question: "In a memory system built from multiple chips, the low-order address bits are used to:",
        options: [
          "Select which chip is active",
          "Select the word within a chip - identical wiring on every chip",
          "Generate the chip-select signal only",
          "Control the read/write strobe timing",
        ],
        correctIndex: 1,
        explanation: "Low-order bits address a location inside a single chip and are wired identically to every chip in the system; the high-order bits are what differ per chip group, feeding the chip-select decoder.",
      },
      {
        question: "What is the practical consequence of partial address decoding?",
        options: [
          "It makes the memory system faster",
          "It requires more chips than full decoding",
          "The same physical memory location becomes reachable at more than one address (aliasing)",
          "It has no practical consequence",
        ],
        correctIndex: 2,
        explanation: "Partial decoding ignores some high-order address bits to save decoder hardware, which means several different addresses all activate the same chip - a real hazard called address aliasing or foldback.",
      },
    ],
    numericals: [
      {
        question: "How many total chips are needed to build a 64K x 16 memory system from 16K x 4 chips?",
        answerMin: 16, answerMax: 16,
        unit: "chips",
        solution: "Width chips = 16/4 = 4. Depth groups = 64K/16K = 4. Total = 4 x 4 = **16 chips**.",
      },
    ],
    pyqRelevance: `Memory interfacing questions are almost always the same numerical shape: given a target memory size and a chip size, compute the number of chips (as two separate divisions multiplied together) and/or the address-bit split between chip-internal addressing and chip-select decoding. It is mechanical once the width/depth split habit is automatic.`,
    interviewConnection: `This is the reasoning behind why real DIMMs (memory modules) are built from multiple DRAM chips in parallel, and why "memory channels" and "ranks" in a spec sheet are width and depth expansion by another name.`,
    revisionSummary: `Memory interfacing combines chips along two independent axes: width (more bits per word, chips side by side) and depth (more words, chip groups one after another). Total chips = width factor x depth factor, always computed as two separate divisions.

Low-order address bits always select the word within a chip, identical on every chip; high-order bits feed a decoder that selects which chip group is active. Full decoding maps every address uniquely; partial decoding is cheaper but causes aliasing.

Bus timing (setup and hold around the address and control signals) makes an access a real, non-zero operation.`,
    shortNotes: {
      fiveMinute: `A target memory system is usually bigger, in both width and depth, than any single available chip - so chips are combined along two SEPARATE axes. Width expansion puts chips side by side to widen the data bus (all chips share the same address bus and chip-select). Depth expansion stacks whole chip-groups one after another, each with its own chip-select range, to extend the address space.

Total chips needed = (required width / chip width) x (required depth / chip depth) - two independent divisions, multiplied, never one combined calculation.

Address bits split into two roles: low-order bits address a WORD INSIDE a chip (wired identically to every chip, width = log2 of that chip's own word count), and high-order bits feed a decoder that picks WHICH chip group is active (width = log2 of the number of depth groups).

Full decoding uses every high-order bit, giving each chip a unique, non-overlapping address range. Partial decoding skips some of those bits to save decoder hardware, at the cost of address aliasing - the same physical chip answering to more than one address range.

A real access also costs time: the address must be stable for a setup time before the read/write strobe fires, and held stable afterward, which is why access time is quoted as a real, non-zero number.`,
      oneMinute: "Total chips = (width factor) x (depth factor), two separate divisions. Low address bits -> word within a chip (same on every chip). High address bits -> decoder selecting which chip group. Full decoding = unique addresses. Partial decoding = cheaper, but aliasing. Access has real setup/hold timing.",
      nightBefore: "Chips needed = width factor x depth factor (two divisions, then multiply). Low bits = inside chip. High bits = which chip (decoder). Partial decoding = aliasing risk.",
    },
  },

  // ---------------- I/O Interface ----------------

  "i-o-interface-interrupts": {
    difficulty: "Moderate",
    estimatedMinutes: 35,
    xpReward: 25, coinReward: 10,
    // Verified real (title confirmed via direct fetch, 2026-08-13).
    resources: [{
      kind: "video",
      title: "I/O Interfacing | Chapter-6 | Computer Organization & Architecture",
      url: "https://www.youtube.com/watch?v=hcSVNyZG5BM",
      description: "Whole video covers this topic from the start.",
    }],
    whatYoullLearn: [
      "Polling versus interrupt-driven I/O, and why the CPU only checks for interrupts at instruction boundaries",
      "The full interrupt cycle - what gets saved, what gets dispatched, and what gets restored",
      "Vectored vs non-vectored and maskable vs non-maskable interrupts, and how simultaneous requests get prioritised",
    ],
    prerequisites: ["Memory Interfacing"],
    concept: `## Two Ways To Notice A Device Is Ready

::: story
Suppose the CPU is waiting for a slow keyboard or disk to have data ready. It has two options: keep asking "are you done yet?" over and over (polling), or keep working on something else entirely and let the device interrupt it the moment it's actually ready - the difference between constantly checking your phone for a text versus just working, and letting it ring when a call actually comes in.
:::

::: cards Polling versus interrupt-driven I/O
Polling (programmed I/O) :: The CPU repeatedly checks a status flag in a loop. Simple, but wastes CPU cycles on a device that is almost always not ready yet.
Interrupt-driven I/O :: The CPU runs its own program; the device signals readiness by asserting an interrupt line. The CPU only stops when there is actually something to do.
:::

::: remember
An interrupt is checked by the CPU only at INSTRUCTION BOUNDARIES, never in the middle of executing one. Whatever instruction is currently in flight always finishes first.
:::

## What Actually Happens During An Interrupt

::: flow
Device asserts interrupt request (IRQ) -> CPU finishes the current instruction -> CPU saves context (PC and status flags, at minimum) -> CPU loads the address of the Interrupt Service Routine (ISR) -> ISR executes, servicing the device -> a return-from-interrupt instruction restores the saved context -> the normal program resumes exactly where it left off
:::

::: mistake
Saving "just the PC" is not enough context - the status/flags register must be saved and restored too, or the interrupted program could resume with condition codes it never set itself. Any question asking "what must be saved" wants PC AND flags, and on some designs general registers the ISR will clobber.
:::

## Vectored, Non-Vectored, Maskable, And Priority

::: cards Four independent classifications of interrupts
Vectored :: The device itself supplies (or hardware directly computes) the address of its ISR - fast dispatch, no searching.
Non-vectored :: The CPU jumps to one fixed address and must poll each device in software to find out which one interrupted - slower, simpler hardware.
Maskable :: Can be temporarily ignored (disabled) by software, for ordinary devices.
Non-maskable (NMI) :: Cannot be disabled - reserved for events too critical to postpone, like a power failure.
:::

::: checkpoint
Two devices interrupt at nearly the same moment. What decides which one is serviced first?
- ( ) Whichever asserted its line a nanosecond earlier, always
- (x) Priority - assigned either by a hardware priority encoder/daisy chain, or by a software polling order for non-vectored designs
- ( ) The CPU services both simultaneously
- ( ) The one at the lower memory address always wins
> Multiple simultaneous interrupt requests are resolved by a PRIORITY scheme - a priority encoder, a daisy chain wired in priority order, or, for non-vectored designs, a software polling sequence that checks the highest-priority device's status first.
:::

::: interview
Interrupts and DMA are easy to conflate - an interrupt is a NOTIFICATION mechanism (something needs attention), while DMA is a DATA-MOVEMENT mechanism (bulk data moves without the CPU touching each byte). A DMA transfer typically still ends by raising one interrupt at completion, so "does DMA use interrupts" is legitimately "yes, but once per whole block, not once per byte".
:::`,
    workedExamples: [
      {
        title: "Comparing polling and interrupt-driven overhead",
        problem: "A device becomes ready on average once every 10,000 CPU cycles. Polling checks its status every cycle, costing 1 cycle per check whether or not the device is ready. Interrupt-driven I/O costs 0 cycles while waiting, but pays a fixed 50-cycle overhead (save + dispatch + restore) every time the device interrupts. Compare CPU cycles spent on I/O management, per 10,000-cycle window, under each approach.",
        solution: `Step 1 (polling): checks every single cycle for 10,000 cycles = 10,000 cycles spent purely on checking, regardless of whether the device was ever ready.

Step 2 (interrupt-driven): the device interrupts once in this window, costing exactly 50 cycles of overhead; the remaining 9,950 cycles are fully available to the CPU's own program.

Step 3 (compare): polling spends 10,000 cycles on housekeeping versus interrupt-driven's 50 cycles - a 200x difference here, and the gap only widens the less frequently the device is actually ready.`,
      },
    ],
    keyPoints: [
      "Polling wastes CPU cycles checking a device that is usually not ready; interrupt-driven I/O lets the CPU work until the device signals readiness itself",
      "Interrupts are only checked at instruction boundaries - the current instruction always finishes first",
      "A full interrupt cycle saves PC and status flags (context), dispatches to the ISR, and restores that context before resuming the interrupted program",
      "Vectored interrupts supply the ISR address directly; non-vectored ones require software polling to identify the source",
      "Maskable interrupts can be disabled by software; non-maskable interrupts cannot, and are reserved for critical, undeferrable events",
    ],
    commonMistakes: [
      "Confusing interrupt-driven I/O with DMA - interrupts still route every byte through the CPU; DMA does not",
      "Believing the CPU checks for interrupts mid-instruction - it only checks at instruction boundaries",
      "Saving only the PC and forgetting the status/flags register as part of the context",
      "Assuming all interrupts are maskable - non-maskable interrupts exist specifically for events that cannot be deferred",
      "Assuming polling is strictly worse - for a device that is ready almost constantly, polling can beat interrupt overhead; the trade-off depends on how rarely the device is actually ready",
    ],
    analogies: [
      "Interrupt-driven I/O is getting a phone call while you work, instead of checking your phone every thirty seconds just in case (polling) - you only get pulled away when there is actually something to answer",
    ],
    memoryTricks: [
      "Interrupts are checked between instructions, never inside one - \"finish what you started\" is the rule",
      "Save PC AND flags. Just the PC is half a context",
      "Vectored = the device tells you where to jump. Non-vectored = you have to go ask around",
    ],
    formulas: [
      "Total interrupt overhead over T cycles = (T / average cycles between interrupts) x (cost per interrupt)",
      "CPU cycles spent by polling over a window ~ the length of the window itself, if checked every cycle",
    ],
    shortcuts: [
      "For \"compare polling vs interrupt overhead\" questions, compute polling's cost as simply the window length, and interrupt's cost as (number of interrupts) x (fixed overhead per interrupt) - then compare directly",
      "Anything described as \"cannot be disabled\" or \"reserved for catastrophic events\" is, by definition, the non-maskable interrupt",
    ],
    mcqs: [
      {
        question: "At what point does a CPU check for a pending interrupt?",
        options: [
          "After every micro-operation, mid-instruction",
          "Only at instruction boundaries, after the current instruction fully completes",
          "Only when explicitly polled by software",
          "Continuously, in parallel with instruction execution",
        ],
        correctIndex: 1,
        explanation: "Interrupts are sampled at instruction boundaries - the currently executing instruction always finishes before the CPU responds to a pending request.",
      },
      {
        question: "What must, at minimum, be saved as context when an interrupt is accepted?",
        options: [
          "Only the program counter",
          "Only the status/flags register",
          "The program counter and the status/flags register",
          "Nothing - the ISR handles its own state",
        ],
        correctIndex: 2,
        explanation: "Resuming the interrupted program correctly requires both the return address (PC) and the condition codes (flags) it was relying on - saving only one leaves the resumed program with corrupted state.",
      },
      {
        question: "A non-maskable interrupt (NMI) differs from an ordinary maskable interrupt in that:",
        options: [
          "It can be disabled by software for higher-priority work",
          "It cannot be disabled, and is reserved for events too critical to postpone",
          "It is always vectored while maskable interrupts never are",
          "It does not require saving any context",
        ],
        correctIndex: 1,
        explanation: "NMIs exist precisely because some events (such as an imminent power failure) must never be deferred - the defining property of \"non-maskable\" is that software cannot disable it.",
      },
    ],
    numericals: [
      {
        question: "A device interrupts on average once every 5,000 cycles, and each interrupt costs a fixed 40 cycles of overhead. Over a 100,000-cycle period, how many total cycles are spent on interrupt overhead?",
        answerMin: 800, answerMax: 800,
        unit: "cycles",
        solution: "Number of interrupts = 100000 / 5000 = 20. Total overhead = 20 x 40 = **800 cycles**.",
      },
    ],
    pyqRelevance: `Polling-versus-interrupt comparison and "what gets saved/restored during an interrupt" are the recurring conceptual MCQ shapes; a numerical comparing total overhead cycles for the two approaches over a fixed window appears less often but is a clean, mechanical 2-marker when it does.`,
    interviewConnection: `Every asynchronous callback, event loop, and signal handler in real software is the same idea one layer up - code "polls" when it spins on a flag, and gets an "interrupt" when an OS signal or an event-loop callback fires instead, with the same save-context/handle/restore-context shape underneath.`,
    revisionSummary: `Polling wastes CPU cycles checking a device that is usually not ready; interrupt-driven I/O lets the CPU work until the device itself signals readiness, checked only at instruction boundaries.

An interrupt cycle: save context (PC and flags, at minimum) -> dispatch to the ISR -> service the device -> restore context -> resume exactly where the program left off.

Vectored interrupts supply the ISR address directly; non-vectored ones need software polling to find the source. Maskable interrupts can be disabled by software; non-maskable ones cannot, and are reserved for critical events. Simultaneous requests are resolved by priority (encoder, daisy chain, or polling order).`,
    shortNotes: {
      fiveMinute: `Polling has the CPU repeatedly check a device's status flag in a loop - simple, but wasteful when the device is rarely ready. Interrupt-driven I/O instead lets the CPU run its own program and only reacts when the device asserts an interrupt line - checked strictly at INSTRUCTION BOUNDARIES, never mid-instruction.

The interrupt cycle: the current instruction finishes, the CPU saves context (the program counter AND the status/flags register, at minimum), it dispatches to the Interrupt Service Routine (ISR) via a vectored address or a fixed jump address, the ISR services the device, and a return-from-interrupt instruction restores the saved context so the original program resumes exactly where it left off.

Interrupts come with independent classifications: vectored (device supplies the ISR address) vs non-vectored (software must poll to find the source); maskable (software can disable it) vs non-maskable/NMI (cannot be disabled, reserved for critical events like power failure). Simultaneous interrupt requests are resolved by priority - a hardware priority encoder or daisy chain, or a fixed software polling order.

Interrupts and DMA are easy to conflate: an interrupt is a notification mechanism, DMA is a data-movement mechanism - and DMA still typically raises one interrupt, at the very end of a transfer.`,
      oneMinute: "Polling = CPU checks every cycle, wasteful. Interrupts = checked only at instruction boundaries, device signals readiness. Cycle: save (PC+flags) -> dispatch to ISR -> service -> restore -> resume. Vectored = device gives ISR address; non-vectored = software polls to find it. Maskable = can disable; NMI = cannot. Priority resolves simultaneous requests.",
      nightBefore: "Interrupts checked at instruction boundaries only. Save PC + FLAGS, not just PC. Vectored = fast dispatch. NMI = cannot be disabled. Priority breaks ties between simultaneous requests.",
    },
  },

  "i-o-interface-dma": {
    difficulty: "Moderate",
    estimatedMinutes: 35,
    xpReward: 25, coinReward: 10,
    // Verified real (title confirmed via direct fetch, 2026-08-13).
    resources: [{
      kind: "video",
      title: "GATE CSIT - COA | Direct Memory Access | DMA Full Concept - Bharat Acharya",
      url: "https://www.youtube.com/watch?v=9BeDKma4YfY",
      description: "Whole video covers this topic from the start.",
    }],
    whatYoullLearn: [
      "Why DMA moves data directly between device and memory without the CPU touching each byte",
      "Burst/block mode versus cycle stealing, and what the CPU is actually doing during each",
      "When DMA's setup overhead makes it worse, not better, than plain programmed I/O",
    ],
    prerequisites: ["I/O Interface: Interrupts"],
    concept: `## Hiring Movers Instead Of Carrying Every Box Yourself

::: story
Interrupt-driven I/O still routes every single byte through the CPU - the ISR reads a device register and writes it to memory, one value at a time. For a genuinely large transfer (a disk block, a video frame), that is an enormous number of tiny CPU-mediated copies. Direct Memory Access hands the whole job to separate hardware instead: tell it the source, the destination, and the word count, and it moves the entire block directly between device and memory - no CPU involvement per byte at all, the same way you'd hire movers and give them an address and inventory instead of carrying every box yourself.
:::

::: remember
The CPU's role in a DMA transfer is almost entirely at the START: it programs the DMA controller with a source address, destination address, and word count, then goes back to running its own program. The DMA controller does the actual moving.
:::

## Somebody Has To Own The Bus

::: cards How the DMA controller gets access to memory
DMA request / DMA acknowledge :: The DMA controller asks the CPU for the bus; the CPU finishes its current bus cycle and grants it.
Burst (block) mode :: The DMA controller holds the bus for the WHOLE transfer, moving it as fast as possible. Fastest transfer, but the CPU is fully locked out of memory for that entire time.
Cycle stealing :: The DMA controller takes the bus for just one cycle at a time, interleaved with the CPU's own bus cycles. Slower transfer, but the CPU keeps making progress on its own work throughout.
:::

::: mistake
"DMA never uses an interrupt" is wrong. DMA typically raises exactly ONE interrupt, at the END of the entire transfer, to tell the CPU it's done - it eliminates per-byte CPU involvement, not the single completion notification.
:::

## DMA Isn't Automatically The Right Choice

::: tip
DMA has real setup overhead - programming the controller costs cycles before a single byte moves. For a very SHORT transfer, plain programmed I/O can actually finish sooner; DMA's advantage grows with the size of the transfer, which is exactly why it is used for disk blocks and video frames, not for reading one status register.
:::

::: checkpoint
A large disk block is being transferred using cycle-stealing DMA. What is the CPU doing during this transfer?
- ( ) Completely halted until the transfer finishes
- (x) Continuing to execute its own program, occasionally losing a single bus cycle to the DMA controller
- ( ) Running the same transfer in software as a backup
- ( ) Waiting for an interrupt after every word
> Cycle stealing interleaves one DMA bus cycle at a time with the CPU's own cycles, so the CPU keeps executing - just slightly slower, due to the occasional stolen cycle - rather than being frozen for the whole transfer, which is what burst/block mode would do instead.
:::`,
    workedExamples: [
      {
        title: "Break-even point between programmed I/O and DMA",
        problem: "Transferring one word via programmed I/O costs 20 cycles of CPU overhead per word. Setting up a DMA transfer costs a fixed 100 cycles, after which each word moves at 2 cycles of bus-stealing overhead to the CPU. For a transfer of N words, find where DMA starts to cost the CPU less total overhead than programmed I/O, and confirm at N = 10.",
        solution: `Step 1: Programmed I/O total CPU overhead = 20 x N.

Step 2: DMA total CPU overhead = 100 + 2 x N.

Step 3 (break-even): 20N = 100 + 2N -> 18N = 100 -> N ~ 5.6, so from N = 6 words onward DMA costs the CPU less.

Step 4 (check N = 10): Programmed I/O = 20 x 10 = 200 cycles. DMA = 100 + 2 x 10 = 120 cycles. DMA is indeed cheaper, confirming the estimate.`,
      },
    ],
    keyPoints: [
      "DMA moves data directly between device and memory, without the CPU touching each byte - the CPU only programs source, destination, and word count at the start",
      "Burst/block mode holds the bus for the entire transfer (fastest, CPU fully locked out); cycle stealing takes the bus one cycle at a time (slower transfer, CPU keeps running)",
      "DMA still typically raises exactly one interrupt, at completion - it removes per-byte CPU involvement, not the single completion notice",
      "DMA has real setup overhead, so for a very short transfer programmed I/O can finish sooner - DMA's advantage grows with transfer size",
      "Comparing DMA and programmed I/O is a break-even calculation: DMA's fixed setup cost against its lower per-word cost",
    ],
    commonMistakes: [
      "Assuming DMA transfers need zero interrupts at all - one completion interrupt is standard",
      "Assuming DMA is always better than programmed/interrupt-driven I/O regardless of transfer size - the fixed setup cost can lose for very small transfers",
      "Confusing burst/block mode (CPU locked out entirely) with cycle stealing (CPU still runs, just slower)",
      "Thinking the CPU actively participates in moving each word during DMA - it does not, that is precisely what DMA removes",
    ],
    analogies: [
      "DMA is hiring a moving company: you (the CPU) give them the pickup address, drop-off address, and inventory count once, then go back to your own day - they only knock on your door again when the whole job is done",
    ],
    memoryTricks: [
      "DMA still rings once at the end - one interrupt for the whole block, not one per byte",
      "Burst mode = CPU frozen, fastest transfer. Cycle stealing = CPU limps along, transfer takes longer wall-clock time but the CPU keeps working",
    ],
    formulas: [
      "DMA total CPU overhead = setup overhead + (words transferred x per-word bus-steal cost)",
      "Programmed/interrupt-driven I/O total CPU overhead = words transferred x per-word overhead",
      "Break-even word count = setup overhead / (per-word programmed cost - per-word DMA cost)",
    ],
    shortcuts: [
      "For \"is DMA worth it here\" questions, set the two overhead formulas equal and solve for N directly - don't build large cycle-count tables by hand",
      "Map the question's wording to one of two options: \"CPU keeps running, slightly slower\" is cycle stealing; \"CPU stops entirely, fastest transfer\" is burst/block mode",
    ],
    mcqs: [
      {
        question: "During a DMA transfer in cycle-stealing mode, the CPU:",
        options: [
          "Is completely halted until the transfer finishes",
          "Continues executing its own program, occasionally losing single bus cycles to the DMA controller",
          "Executes the transfer itself, one word at a time",
          "Is disconnected from the bus permanently",
        ],
        correctIndex: 1,
        explanation: "Cycle stealing interleaves single DMA bus cycles with the CPU's own, so the CPU keeps running throughout the transfer, just marginally slower.",
      },
      {
        question: "Which statement about DMA and interrupts is correct?",
        options: [
          "DMA never generates an interrupt",
          "DMA generates one interrupt per byte transferred",
          "DMA typically generates exactly one interrupt, at the end of the whole transfer",
          "DMA replaces interrupts entirely across the whole system",
        ],
        correctIndex: 2,
        explanation: "DMA removes the CPU's involvement in moving each individual byte, but it still commonly signals completion of the entire block with a single interrupt.",
      },
      {
        question: "For a very short data transfer, which approach can actually finish sooner than DMA?",
        options: [
          "Burst-mode DMA, always",
          "Plain programmed I/O, because DMA's fixed setup overhead outweighs the saving on so few words",
          "Cycle-stealing DMA, always",
          "None - DMA is always faster regardless of size",
        ],
        correctIndex: 1,
        explanation: "DMA pays a fixed setup cost before any word moves. For a small enough transfer, that setup cost is not recovered by DMA's lower per-word overhead, so plain programmed I/O can win.",
      },
    ],
    numericals: [
      {
        question: "Programmed I/O costs 20 cycles/word. DMA costs 100 cycles setup plus 2 cycles/word. What is the total CPU overhead, in cycles, for a DMA transfer of 50 words?",
        answerMin: 200, answerMax: 200,
        unit: "cycles",
        solution: "DMA overhead = setup + (words x per-word cost) = 100 + 2 x 50 = 100 + 100 = **200 cycles**.",
      },
    ],
    pyqRelevance: `DMA questions are mostly conceptual MCQs distinguishing it from interrupt-driven I/O (does it use interrupts, who moves the data, cycle-stealing vs burst) plus, less often, an overhead or break-even style numerical comparing DMA setup cost against per-word programmed I/O cost.`,
    interviewConnection: `This is the reasoning behind why bulk network or disk I/O in real systems uses DMA-backed paths (zero-copy transfers) instead of the CPU copying buffers byte by byte - and why a badly configured system doing "programmed" copies for large transfers shows up as unexpectedly high CPU usage during I/O-heavy workloads.`,
    revisionSummary: `DMA moves data directly between device and memory without the CPU touching each byte - the CPU only sets up source, destination, and word count, then the DMA controller does the actual transfer.

Burst/block mode holds the bus for the entire transfer (fastest, CPU fully locked out); cycle stealing takes the bus one cycle at a time (CPU keeps running, transfer takes longer). DMA still typically raises one interrupt, at completion.

DMA has real setup overhead, so it is not automatically better than programmed I/O for very small transfers - compare via a break-even calculation.`,
    shortNotes: {
      fiveMinute: `DMA (Direct Memory Access) moves an entire block of data directly between a device and memory without the CPU touching each individual byte. The CPU's role is almost entirely at the start: it programs the DMA controller with a source address, destination address, and word count, then returns to its own program while the controller does the actual transfer.

The DMA controller must still get access to the bus: it requests it (DMA request), and the CPU grants it (DMA acknowledge) once its current bus cycle finishes. Burst/block mode holds the bus for the WHOLE transfer - fastest, but the CPU is fully locked out of memory throughout. Cycle stealing takes the bus one cycle at a time, interleaved with the CPU's own cycles - slower overall, but the CPU keeps making progress the entire time.

DMA still typically ends with exactly one interrupt, signalling completion of the whole block - it removes per-byte CPU involvement, not that single notification.

DMA is not automatically better than programmed I/O: it pays a real, fixed setup cost before any word moves, so for a very short transfer plain programmed I/O can actually finish sooner. DMA's advantage grows with transfer size, which is why it is used for disk blocks and video frames rather than single status-register reads.`,
      oneMinute: "DMA moves data directly device<->memory, no per-byte CPU involvement - CPU only sets up source/destination/count. Burst mode = CPU locked out, fastest. Cycle stealing = CPU keeps running, slower transfer. One completion interrupt is standard. DMA has real setup overhead - can lose to programmed I/O for very short transfers.",
      nightBefore: "DMA: CPU sets up, controller moves data, one interrupt at the end. Burst = CPU frozen. Cycle stealing = CPU keeps going, just slower. Setup overhead means DMA isn't always the win for tiny transfers.",
    },
  },

  // ---------------- Pipelining ----------------

  "instruction-pipelining": {
    difficulty: "Moderate",
    estimatedMinutes: 40,
    xpReward: 30, coinReward: 12,
    // Verified real (title confirmed via direct fetch, 2026-08-13).
    resources: [{
      kind: "video",
      title: "Instruction Pipelining | Chapter-7 | Computer Organization & Architecture",
      url: "https://www.youtube.com/watch?v=j8RKaeANQ-o",
      description: "Whole video covers this topic from the start.",
    }],
    whatYoullLearn: [
      "Why pipelining improves throughput, not the latency of any single instruction",
      "The classic 5-stage pipeline, and why cycle time is set by the slowest stage",
      "How to compute pipelined execution time and speedup for n instructions on a k-stage pipeline",
    ],
    prerequisites: ["I/O Interface: DMA", "Design of Arithmetic and Logic Unit (ALU)"],
    concept: `## An Assembly Line For Instructions

::: story
A car factory does not wait for one car to be fully built, painted, and driven off the line before starting the next one. While car 3 gets its engine, car 2 is being painted, and car 1 already has its wheels attached - several cars in progress simultaneously, each at a different STAGE. Instruction pipelining does exactly this to a CPU's instructions: while one instruction executes, the next is being decoded, and the one after that is already being fetched.
:::

::: remember
Pipelining does NOT make any single instruction finish faster - each instruction still passes through every stage, so its own latency is the same, or slightly worse due to pipeline-register overhead. What improves dramatically is THROUGHPUT: how many instructions complete per unit time, once the pipeline is full.
:::

## The Classic Five Stages

::: cards A textbook 5-stage pipeline
IF (Instruction Fetch) :: Read the instruction from memory using the PC.
ID (Instruction Decode / Operand Fetch) :: Identify the opcode, read the needed registers.
EX (Execute) :: The ALU performs the computation, or computes a memory address.
MEM (Memory access) :: Read or write memory - only loads and stores actually use this stage.
WB (Write Back) :: Write the result into the register file.
:::

::: remember
Each stage hands its result to a pipeline register before the next clock edge, so the next instruction can enter the stage that just freed up. Cycle time is set by the SLOWEST stage plus that register overhead - every faster stage sits idle for part of each cycle, waiting on the slowest one.
:::

## Counting The Speedup

::: remember
For n instructions on a k-stage pipeline with no stalls at all (the ideal case):

  Pipelined time = (k + n - 1) cycles
  Non-pipelined time = n x k cycles
  Speedup = (n x k) / (k + n - 1)

As n grows very large, speedup approaches k - the number of stages - but never quite reaches it, because the pipeline still has to fill up (k - 1 cycles) before the first result appears, and that fixed cost is paid only once no matter how many instructions follow.
:::

::: checkpoint
A 5-stage pipeline executes 100 instructions with no stalls. Which is closest to the actual speedup over a non-pipelined design?
- ( ) Exactly 5
- (x) Slightly less than 5
- ( ) Exactly 100
- ( ) Slightly more than 5
> Speedup = (100 x 5) / (5 + 100 - 1) = 500 / 104 ~ 4.8 - close to the stage count (5) but always slightly under it, because of the one-time cost of filling the pipeline.
:::

::: tip
"How many cycles does the FIRST instruction take" is always k - it still passes through every stage. "How many cycles until the LAST of n instructions finishes" is k + n - 1 - one instruction retires every single cycle once the pipeline is full, so after the first one finishes, the rest arrive one per cycle.
:::`,
    codeExample: {
      language: "javascript",
      code: `function pipelineTime(n, k) { return k + n - 1; }
function speedup(n, k) { return (n * k) / (k + n - 1); }

[1, 4, 10, 100, 1000].forEach(function (n) {
  var k = 5;
  console.log("n=" + n + ": pipelined=" + pipelineTime(n, k) + " cycles, speedup=" + speedup(n, k).toFixed(2) + "x");
});`,
      expectedOutput: `n=1: pipelined=5 cycles, speedup=1.00x
n=4: pipelined=8 cycles, speedup=2.50x
n=10: pipelined=14 cycles, speedup=3.57x
n=100: pipelined=104 cycles, speedup=4.81x
n=1000: pipelined=1004 cycles, speedup=4.98x`,
    },
    dryRun: `Trace 4 instructions (I1-I4) through the classic 5-stage pipeline (IF, ID, EX, MEM, WB), assuming no hazards at all.

::: timeline Cycle-by-cycle occupancy
Cycle 1 :: I1 in IF. Nothing else has entered yet.
Cycle 2 :: I1 moves to ID. I2 enters IF.
Cycle 3 :: I1 in EX. I2 in ID. I3 enters IF.
Cycle 4 :: I1 in MEM. I2 in EX. I3 in ID. I4 enters IF.
Cycle 5 :: I1 in WB - I1 RETIRES. I2 in MEM. I3 in EX. I4 in ID.
Cycle 6 :: I2 in WB - I2 retires. I3 in MEM. I4 in EX.
Cycle 7 :: I3 in WB - I3 retires. I4 in MEM.
Cycle 8 :: I4 in WB - I4 retires.
:::

  Cycle:   1    2    3    4    5    6    7    8
  I1:     IF   ID   EX   MEM  WB
  I2:          IF   ID   EX   MEM  WB
  I3:               IF   ID   EX   MEM  WB
  I4:                    IF   ID   EX   MEM  WB

Total cycles for 4 instructions = k + n - 1 = 5 + 4 - 1 = 8, matching the diagram exactly - I1 finishes at cycle 5 (= k), and each subsequent instruction finishes exactly one cycle after the previous one.

Compare with non-pipelined execution: 4 instructions x 5 cycles each = 20 cycles, fully serial. Speedup here = 20 / 8 = 2.5 - well under the eventual limit of 5, because with only 4 instructions the one-time pipeline-fill cost is a large fraction of the total.`,
    workedExamples: [
      {
        title: "Speedup for a pipeline with uneven stage timing",
        problem: "A non-pipelined datapath executes each instruction serially through 4 stages of 2 ns, 3 ns, 2 ns, and 2 ns (9 ns per instruction total). The equivalent pipeline uses a fixed cycle time equal to the SLOWEST stage, 3 ns. For 20 instructions, find the pipelined execution time and the speedup over non-pipelined execution.",
        solution: `Step 1 (non-pipelined time): 20 instructions x 9 ns/instruction = 180 ns.

Step 2 (pipeline cycle time): set by the slowest stage = 3 ns (every stage is padded to this width).

Step 3 (pipelined time): (k + n - 1) x cycle time = (4 + 20 - 1) x 3 = 23 x 3 = 69 ns.

Step 4 (speedup): 180 / 69 ~ 2.61x - noticeably less than the stage count (4), because one stage (3 ns) is much slower than the others, so the pipeline wastes time in every faster stage waiting for it.`,
      },
    ],
    keyPoints: [
      "Pipelining overlaps stages of DIFFERENT instructions, improving throughput - not the latency of any single instruction",
      "Ideal pipelined time for n instructions, k stages = k + n - 1 cycles; non-pipelined time = n x k cycles",
      "Speedup = (n x k) / (k + n - 1), approaching k as n grows, but never quite reaching it",
      "Cycle time is set by the slowest stage (plus pipeline-register overhead) - an uneven pipeline wastes time in every faster stage",
      "The classic 5-stage pipeline is IF, ID, EX, MEM, WB",
    ],
    commonMistakes: [
      "Believing pipelining speeds up a SINGLE instruction - it does not, and can slightly worsen single-instruction latency",
      "Using n x k for pipelined time instead of k + n - 1",
      "Forgetting the one-time pipeline-fill cost, which matters a lot for small n and becomes negligible for large n",
      "Assuming cycle time is the AVERAGE of the stage delays rather than the MAXIMUM (slowest stage)",
    ],
    analogies: [
      "A car factory assembly line: several cars are mid-construction simultaneously, each at a different station - no single car finishes any faster, but cars roll off the far end far more often",
    ],
    memoryTricks: [
      "k + n - 1, not n x k - the \"-1\" and \"+n\" exist because the pipeline fills once, then finishes one instruction every cycle after that",
      "Speedup approaches k but never touches it - the fill cost is a one-time tax that never fully disappears",
    ],
    formulas: [
      "Pipelined execution time = (k + n - 1) x cycle time",
      "Non-pipelined execution time = n x (sum of all stage times), or n x k x (per-stage time) if stages are equal",
      "Speedup = (n x k) / (k + n - 1); limit as n -> infinity is k",
      "Cycle time = max(individual stage delays) + pipeline register overhead",
    ],
    shortcuts: [
      "For large n, just answer \"approximately k\" for speedup without working the full fraction - questions with n >= 100 rarely need more precision than that",
      "First instruction always finishes at cycle k. Last of n instructions finishes at cycle k + n - 1. Most timing questions are built from just these two facts",
    ],
    mcqs: [
      {
        question: "Pipelining a datapath primarily improves:",
        options: [
          "The latency of each individual instruction",
          "The throughput of the processor - instructions completed per unit time",
          "The size of the instruction set",
          "The number of registers available",
        ],
        correctIndex: 1,
        explanation: "Every instruction still passes through all k stages, so its own latency does not improve (and may slightly worsen). What pipelining buys is throughput - one instruction retiring per cycle once the pipeline is full.",
      },
      {
        question: "For n instructions on an ideal, stall-free k-stage pipeline, the total execution time in cycles is:",
        options: ["n x k", "k + n - 1", "n + k", "n x (k - 1)"],
        correctIndex: 1,
        explanation: "The pipeline fills over k - 1 cycles, and then one instruction completes every subsequent cycle, giving a total of k + n - 1 cycles - not the fully serial n x k.",
      },
      {
        question: "The clock cycle time of a pipeline is determined by:",
        options: [
          "The average delay across all stages",
          "The fastest stage's delay",
          "The slowest stage's delay, plus pipeline register overhead",
          "The sum of all stage delays",
        ],
        correctIndex: 2,
        explanation: "Every stage must fit within one cycle, so the cycle time cannot be shorter than the slowest stage (plus the overhead of latching into the pipeline register) - faster stages simply sit idle for the remainder of the cycle.",
      },
    ],
    numericals: [
      {
        question: "A 5-stage pipeline with no stalls executes 50 instructions. How many clock cycles does it take in total?",
        answerMin: 54, answerMax: 54,
        unit: "cycles",
        solution: "Pipelined time = k + n - 1 = 5 + 50 - 1 = **54 cycles**.",
      },
    ],
    pyqRelevance: `Pipelining numericals (compute pipelined time, non-pipelined time, or speedup for given n and k, sometimes with uneven stage timing) are one of the most reliable 2-mark question shapes in the whole subject. The cycle-by-cycle diagram is also asked directly, especially once hazards are added (the next topic).`,
    interviewConnection: `Every modern CPU is pipelined, often far more than 5 stages, which is exactly why "instructions per cycle" rather than "cycles per instruction" became the headline performance number, and why a single mispredicted branch or cache miss - which flushes or stalls the pipeline - costs far more than one cycle's worth of work.`,
    revisionSummary: `Pipelining overlaps different instructions across stages, improving throughput, not the latency of any single instruction.

Ideal pipelined time for n instructions, k stages = k + n - 1 cycles; non-pipelined = n x k. Speedup = (n x k) / (k + n - 1), approaching k as n grows but never reaching it, because the one-time pipeline-fill cost is paid only once.

Cycle time is set by the slowest stage plus pipeline-register overhead - an uneven pipeline wastes time in every faster stage. Classic 5 stages: IF, ID, EX, MEM, WB.`,
    shortNotes: {
      fiveMinute: `Pipelining overlaps DIFFERENT instructions across stages - while one instruction executes, the next is being decoded, and the one after is being fetched - like a car factory assembly line where several cars are mid-construction at once, each at a different station. No single instruction (or car) finishes any faster; what improves dramatically is throughput, how many complete per unit time.

The classic pipeline has five stages: IF (fetch), ID (decode/read registers), EX (ALU operation), MEM (memory access, loads/stores only), WB (write result back). Each stage hands off through a pipeline register, and the cycle time is set by the SLOWEST stage plus that register overhead - faster stages sit idle for the rest of each cycle.

For n instructions on a k-stage pipeline with no stalls: pipelined time = k + n - 1 cycles (the pipeline fills once over k-1 cycles, then one instruction retires per cycle), versus n x k for fully serial execution. Speedup = (n x k) / (k + n - 1), approaching k as n grows large but never reaching it exactly, because the fill cost is paid once no matter how many instructions follow.`,
      oneMinute: "Pipelining overlaps different instructions' stages - improves throughput, not any single instruction's latency. 5 stages: IF ID EX MEM WB. Pipelined time = k+n-1 cycles (not n x k). Speedup = (n x k)/(k+n-1), approaches k as n grows. Cycle time = slowest stage + register overhead.",
      nightBefore: "Pipelined time = k+n-1, NOT n x k. Speedup approaches k but never reaches it. Cycle time = SLOWEST stage. First instruction finishes at cycle k; last of n finishes at k+n-1.",
    },
  },

  "pipeline-hazards": {
    difficulty: "Hard",
    estimatedMinutes: 45,
    xpReward: 30, coinReward: 12,
    // Verified real (title confirmed via direct fetch, 2026-08-13).
    resources: [{
      kind: "video",
      title: "Pipelining 5: Pipeline Hazards",
      url: "https://www.youtube.com/watch?v=8B7fLf5QYH8",
      description: "Whole video covers this topic from the start.",
    }],
    whatYoullLearn: [
      "The three hazard types - structural, data, control - and which fix (duplicate hardware, forwarding, prediction) belongs to each",
      "Why even full forwarding cannot save a load-use hazard, and why that costs exactly one stall cycle",
      "How to trace total execution cycles through stalls and branch misprediction penalties",
    ],
    prerequisites: ["Instruction Pipelining"],
    concept: `## When The Assembly Line Can't Just Keep Going

::: story
An assembly line works perfectly as long as every station always has what it needs, exactly when it needs it. A pipeline hazard is any situation where that breaks - a station needs a part that isn't ready yet, two stations need the same tool at once, or the line only discovers several cars in that it built the wrong model. Every pipeline hazard is one of exactly three kinds.
:::

::: cards The three hazard types
Structural hazard :: Two instructions need the SAME hardware resource in the same cycle (classically, a single shared memory port needed by an instruction fetch AND a data access at once).
Data hazard :: An instruction needs a value that a PRIOR instruction hasn't finished producing yet (a true Read-After-Write dependency).
Control hazard :: A branch instruction changes the PC, but the pipeline has already fetched the WRONG next instructions before the branch is even resolved.
:::

::: remember
Structural hazards are fixed by adding hardware (a separate instruction cache and data cache instead of one shared memory) or by stalling. Data and control hazards are fundamentally about TIME - a value or a decision simply isn't ready yet - so hardware alone can reduce, but not always eliminate, the wait.
:::

## Data Hazards: Forwarding First, Stalling Last

::: flow
ADD R1, R2, R3 (R1 ready at the end of EX) -> SUB R4, R1, R5 (needs R1 in ITS OWN EX stage, one cycle later) -> without forwarding: SUB must STALL until R1 is written back and read again -> with forwarding/bypassing: R1's value is routed directly from the ADD's EX/MEM pipeline register straight into SUB's EX stage, no stall needed
:::

::: mistake
Forwarding does not remove every data hazard for free. A LOAD followed immediately by an instruction that uses the loaded value (a load-use hazard) still needs at least one stall cycle even with full forwarding, because the loaded value genuinely isn't available until after the MEM stage - there is nothing earlier to forward from.
:::

## Control Hazards: Guess, Then Recover If Wrong

::: cards Handling a branch in a pipeline
Stall until resolved :: Simplest and correct, but wastes cycles on every branch whether taken or not.
Static prediction :: Always guess "not taken" (or always "taken") and start fetching accordingly; flush and refetch if wrong.
Dynamic prediction :: Use a hardware predictor that learns from a branch's own recent history; usually right, occasionally wrong.
Delayed branch :: Redefine the ISA so the instruction right after a branch always executes regardless of outcome, and compilers fill that slot usefully.
:::

::: remember
Whatever the strategy, a WRONG guess means every instruction fetched behind the mispredicted branch must be flushed (thrown away) and refetched - the branch penalty. A perfect predictor still pays this cost on every genuine misprediction; it only reduces how OFTEN that happens.
:::

::: checkpoint
A pipeline forwards every data hazard except load-use, which still costs one stall cycle. Instruction I2 uses a register loaded by I1 (LOAD) immediately before it. What happens?
- ( ) Nothing - forwarding handles it like any other data hazard
- (x) The pipeline inserts exactly one stall cycle (bubble) before I2 can proceed, because the loaded value isn't ready until after I1's MEM stage
- ( ) I2 is discarded entirely
- ( ) Two stall cycles are always needed regardless of design
> A load-use hazard is the one data hazard forwarding alone cannot fully erase, because the needed value doesn't exist until MEM completes - one stall (bubble) is the standard fix, not zero and not automatically two.
:::

::: interview
Structural, data, and control are worth naming precisely, because "why did my loop run slower than expected" in a real profiling conversation is frequently one of these by another name: a branch misprediction (control), a dependent chain of instructions that can't overlap (data), or contention for a shared resource under high parallelism (structural).
:::`,
    dryRun: `Trace I1 (LOAD), I2 (ADD, uses the loaded value - a load-use hazard), and I3 (SUB, independent) through a 5-stage pipeline with forwarding for every hazard except load-use.

::: timeline Building the trace
Cycle 1 :: I1 (LOAD) enters IF.
Cycle 2 :: I1 in ID. I2 (ADD, needs R1) enters IF.
Cycle 3 :: I1 in EX (computing the memory address). I2 in ID - but R1 will not exist until I1's MEM stage finishes, so I2 CANNOT advance to EX next cycle. I3 enters IF.
Cycle 4 :: I1 in MEM - R1's value is now available and can be forwarded. I2 is held in ID for a second cycle (a stall/bubble). I3 is held in IF, unable to advance while I2 blocks ID.
Cycle 5 :: I1 in WB. I2 finally enters EX, receiving R1 forwarded directly from I1's MEM/WB pipeline register - no need to wait for an actual register-file write. I3 enters ID.
Cycle 6 :: I2 in MEM. I3 in EX.
Cycle 7 :: I2 in WB. I3 in MEM.
Cycle 8 :: I3 in WB.
:::

  Cycle:        1    2    3    4    5    6    7    8
  I1 LOAD:     IF   ID   EX   MEM  WB
  I2 ADD:            IF   ID   ID*  EX   MEM  WB
  I3 SUB:                 IF   IF*  ID   EX   MEM  WB

  ID* / IF* = a bubble cycle - the stage repeats instead of admitting a new instruction.

Without the load-use hazard, I3 would finish at cycle 7 (k + n - 1 = 5 + 3 - 1 = 7); the one bubble pushes total completion to cycle 8 - exactly one extra cycle, matching "one stall per load-use hazard", however many instructions sit behind it.`,
    workedExamples: [
      {
        title: "Total cycles with one load-use stall",
        problem: "3 instructions execute on a 5-stage pipeline. Exactly one load-use hazard occurs, forcing one stall cycle. What is the total number of cycles to complete all 3 instructions?",
        solution: `Step 1 (ideal, no hazards): k + n - 1 = 5 + 3 - 1 = 7 cycles.

Step 2: each stall/bubble adds exactly one cycle to the total.

Step 3 (total): 7 + 1 = **8 cycles** - matching the cycle-by-cycle trace above exactly.`,
      },
      {
        title: "Branch misprediction penalty over a program",
        problem: "A pipeline pays a 4-cycle penalty on every branch misprediction. In a program of 1000 instructions, 20% are branches, and the predictor is wrong 10% of the time it predicts a branch. Ignoring all other hazards, how many extra cycles does branch misprediction add in total?",
        solution: `Step 1: number of branches = 20% of 1000 = 200.

Step 2: number of mispredictions = 10% of 200 = 20.

Step 3: extra cycles = 20 mispredictions x 4 cycles penalty each = **80 extra cycles**.`,
      },
    ],
    keyPoints: [
      "There are exactly three hazard types: structural (resource conflict), data (a value isn't ready yet - RAW), and control (a branch outcome isn't known yet)",
      "Structural hazards are fixed by duplicating hardware or stalling; data hazards mainly by forwarding, with one stall still needed for load-use; control hazards by prediction, delayed branch, or stalling",
      "A load-use hazard needs one stall cycle even with full forwarding, because the loaded value doesn't exist until after MEM",
      "Every mispredicted branch flushes every instruction already fetched behind it - the branch penalty",
      "Total execution cycles = ideal (k + n - 1) + total stall/bubble cycles from all hazards actually encountered",
    ],
    commonMistakes: [
      "Miscategorizing a hazard - for example, calling a load-use dependency \"structural\" instead of \"data\"",
      "Assuming forwarding removes ALL data hazards including load-use - one stall remains even with full forwarding",
      "Assuming branch prediction removes the branch penalty entirely, rather than just reducing how often it is paid",
      "Forgetting that EVERY instruction fetched behind a mispredicted branch must be flushed, not just the branch instruction itself",
      "Confusing RAW (the hazard that matters in a simple in-order pipeline) with WAR/WAW, which only become relevant once instructions can complete out of order",
    ],
    analogies: [
      "Structural hazard is two workers needing the one shared tool at once. Data hazard is waiting on a part still being made three stations back. Control hazard is realising, after several cars have already gone down the line, that the wrong model was being built, and having to scrap them",
    ],
    memoryTricks: [
      "Structural = same HARDWARE, wanted twice. Data = same VALUE, not ready yet. Control = wrong INSTRUCTION, fetched too soon",
      "Load-use is the one data hazard even forwarding can't fully save - one stall, no exceptions",
      "Misprediction penalty = flush + refetch, paid exactly once per WRONG guess, however rarely that happens",
    ],
    formulas: [
      "Total stall cycles for a load-use hazard (with forwarding) = 1 per occurrence",
      "Total execution cycles = ideal (k + n - 1) + total stall cycles from all hazards",
      "Branch misprediction extra cycles = (number of branches x misprediction rate) x branch penalty",
    ],
    shortcuts: [
      "For a stall-counting question, work out the ideal k + n - 1 first, then just ADD one cycle per stall/bubble - never recompute the whole schedule from scratch once the ideal baseline is known",
      "For a branch-penalty question, multiply (number of branches) x (misprediction rate) x (penalty per misprediction) as one straight-line calculation - no diagram needed",
    ],
    mcqs: [
      {
        question: "A structural hazard arises when:",
        options: [
          "An instruction needs a value a prior instruction hasn't produced yet",
          "Two instructions need the same hardware resource in the same cycle",
          "A branch outcome is not yet known",
          "The pipeline runs out of registers",
        ],
        correctIndex: 1,
        explanation: "Structural hazards are pure resource conflicts - the classic example is one shared memory port needed simultaneously for instruction fetch and a data access.",
      },
      {
        question: "Why does a load-use hazard still require a stall cycle even with full operand forwarding?",
        options: [
          "Forwarding does not exist for load instructions",
          "The loaded value genuinely does not exist until after the MEM stage completes, so there is nothing earlier to forward from",
          "Load instructions never use the ALU",
          "It is a structural hazard, not a data hazard, so forwarding does not apply",
        ],
        correctIndex: 1,
        explanation: "Forwarding routes a value from wherever it becomes available to wherever it's needed next - but a load's value only exists after MEM, one stage later than an ALU result. That one-cycle gap is unavoidable without a stall.",
      },
      {
        question: "When a branch is mispredicted, what happens to instructions already fetched behind it?",
        options: [
          "They are executed normally and results discarded only if wrong",
          "They must be flushed (discarded) and the correct instructions refetched",
          "Nothing - misprediction only affects the branch instruction itself",
          "They are converted into stall cycles automatically",
        ],
        correctIndex: 1,
        explanation: "Every instruction the pipeline speculatively fetched down the wrong path must be flushed and the correct path refetched - this flush-and-refetch cost is exactly the branch misprediction penalty.",
      },
    ],
    numericals: [
      {
        question: "A pipeline pays a 3-cycle penalty on every branch misprediction. Out of 500 instructions, 100 are branches, and 20% of those are mispredicted. How many total extra cycles does branch misprediction cost?",
        answerMin: 60, answerMax: 60,
        unit: "cycles",
        solution: "Mispredicted branches = 20% of 100 = 20. Extra cycles = 20 x 3 = **60 cycles**.",
      },
      {
        question: "5 instructions execute on a 5-stage pipeline. Exactly 2 stall cycles occur (from data/control hazards) during the run. What is the total number of cycles to complete all 5 instructions?",
        answerMin: 11, answerMax: 11,
        unit: "cycles",
        solution: "Ideal = k + n - 1 = 5 + 5 - 1 = 9 cycles. Add 2 stall cycles: 9 + 2 = **11 cycles**.",
      },
    ],
    pyqRelevance: `Pipeline hazards are GATE's favourite hard numerical in this subject: full cycle-by-cycle traces with stalls, or a "total execution time given n instructions and m stalls of s cycles each" computation, plus conceptual MCQs distinguishing the three hazard types and the fixes for each. Structural-vs-data-vs-control misclassification is the single most common way marks are lost here.`,
    interviewConnection: `Pipeline hazards are the hardware ancestor of dependency stalls anywhere in computing - a data hazard is the same shape as waiting on a value from a previous async call before starting the next step, and a branch misprediction is exactly why speculative-execution vulnerabilities (like Spectre) exist: the CPU genuinely executes down a guessed path before that path is confirmed correct.`,
    revisionSummary: `Exactly three hazard types: structural (a shared resource wanted by two instructions at once), data (a value isn't ready yet - RAW), control (a branch outcome isn't known yet).

Fixes: structural - duplicate hardware or stall. Data - forwarding, except load-use still needs one stall. Control - prediction (static or dynamic), delayed branch, or stalling; a wrong guess always flushes every instruction fetched behind it.

Total execution cycles = ideal (k + n - 1) + all stall/bubble cycles from every hazard encountered. Branch misprediction extra cycles = (branches x misprediction rate) x penalty per misprediction.`,
    shortNotes: {
      fiveMinute: `A pipeline hazard is any situation where the assembly-line assumption - every station has what it needs, exactly when it needs it - breaks down. There are exactly three kinds: structural (two instructions want the SAME hardware resource at once, like a shared memory port), data (an instruction needs a value a PRIOR instruction hasn't produced yet - a Read-After-Write dependency), and control (a branch changes the PC, but the pipeline already fetched the wrong instructions before that was known).

Structural hazards are fixed by duplicating hardware (separate instruction and data caches) or by stalling. Data hazards are mainly fixed by forwarding/bypassing - routing a value straight from where it's produced to where it's needed, skipping the register file - EXCEPT for a load-use hazard, where the loaded value genuinely doesn't exist until after the MEM stage, so one stall cycle remains unavoidable even with full forwarding.

Control hazards are handled by stalling until the branch resolves, static prediction (always guess one way), dynamic prediction (learn from history), or delayed branch (redefine the ISA so the slot after a branch always executes). Whatever the strategy, every WRONG guess flushes every instruction already fetched behind the branch - the branch penalty - and a better predictor only reduces how OFTEN that penalty is paid, never eliminates it.

Total execution cycles = the ideal, hazard-free k + n - 1, plus one cycle for every stall/bubble actually inserted.`,
      oneMinute: "3 hazards: structural (resource), data (value not ready, RAW), control (branch outcome not known). Structural -> duplicate HW or stall. Data -> forwarding, except load-use (1 stall always). Control -> prediction/delayed branch/stall; misprediction flushes everything fetched behind it. Total cycles = (k+n-1) + all stalls.",
      nightBefore: "Structural = hardware clash. Data = value not ready (RAW). Control = branch not resolved yet. Load-use = 1 stall even with forwarding. Misprediction = flush + refetch, every time it's wrong.",
    },
  },

};
