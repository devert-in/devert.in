// Computer Organization & Architecture - rewritten lesson bodies. See
// operating-systems.mjs for the authoring rules. This subject builds strictly
// bottom-up (bits, gates, CPU, memory, pipeline, performance), so each lesson
// deliberately names what it's standing on - the payoff is the Instruction
// Cycle lesson, where the whole stack finally connects.

export const COMPUTER_ORGANIZATION = {
  "binary": {
    concept: `## Why Only Two Symbols?

::: story
Ask an electrical engineer to build a circuit that reliably tells apart ten different voltage levels, and you'll get a hard question back: how far apart, and how much can they drift before 6 reads as 7?

Ask for a circuit that tells apart *two* states - current flowing or not - and it's almost trivially easy. Voltage can sag, noise can creep in, components can age, and "on or off" survives all of it.
:::

Computers use **binary** because of that, and not for any historical or aesthetic reason. A transistor is at its most reliable as a two-state switch.

::: cards The units everything is measured in
Bit :: A single binary digit. One 0 or one 1. The smallest thing there is.
Byte :: Eight bits together. The unit storage and memory are measured in - kilobytes, megabytes, gigabytes upward from here.
:::

## Reading A Binary Number

Each position is a power of 2, counting from the **rightmost** bit.

::: flow
1 (8) -> 0 (4) -> 1 (2) -> 1 (1) = 11
:::

So \`1011\` is (1x8) + (0x4) + (1x2) + (1x1) = 11.

::: mistake
The one reliable way to get this wrong is counting positions from the left. Powers of 2 start at the right-hand end with 2^0 = 1, and grow leftward. Every conversion error in this topic is that mistake wearing a different hat.
:::

::: checkpoint
What is binary \`101\` in decimal?
- ( ) 3
- (x) 5
- ( ) 7
- ( ) 101
> (1x4) + (0x2) + (1x1) = 5. Right to left: 1, 2, 4.
:::

::: didyouknow
This is also why computer numbers are always powers of two - 4GB, 8GB, 256, 1024. Those aren't marketing conventions. They're the round numbers of a base-2 world, in exactly the way 10, 100 and 1000 are the round numbers of ours.
:::

::: behind
**Hexadecimal** - base 16, digits 0-9 then A-F - exists as shorthand for binary. Each hex digit maps to exactly 4 bits, so one byte is always exactly 2 hex digits.

That clean mapping is why memory addresses, colour codes and MAC addresses are written in hex: it's much shorter than raw binary and converts back to it without arithmetic. \`#FF5733\` is three bytes, and an experienced eye reads it as bits.
:::`,
  },

  "number-systems": {
    concept: `## Four Bases, Two Of Them Just Convenience

::: story
Binary is what the hardware uses. Decimal is what you think in. Octal and hexadecimal are neither - they exist purely because reading long strings of 1s and 0s out loud is miserable.
:::

A **base** is how many digit symbols exist before you carry into the next position.

::: cards
Binary - base 2 :: 0 and 1. What the circuits actually do.
Octal - base 8 :: 0-7. Exactly 3 bits per digit, since 2^3 = 8.
Decimal - base 10 :: 0-9. What humans count in.
Hexadecimal - base 16 :: 0-9 and A-F. Exactly 4 bits per digit, since 2^4 = 16.
:::

::: remember
Octal and hexadecimal are not better number systems. They're compression for human eyes, and their whole value is that the conversion to binary requires no arithmetic - each digit expands independently into a fixed group of bits.
:::

## Negative Numbers, With No Minus Sign Available

Binary has 0 and 1 and nothing else. So representing a negative number needs a convention, and the one virtually every computer uses is **two's complement**.

::: timeline Negating a binary number
Start with the number :: 0000 0101, which is decimal 5.
Invert every bit :: 1111 1010. Every 0 becomes 1, every 1 becomes 0.
Add 1 :: 1111 1011. This now represents -5.
:::

::: mistake
It's two steps, and stopping after the first gives you a different (and wrong) scheme called one's complement. Invert, *then* add one.
:::

::: reveal Why this specific scheme, rather than a simpler one?
Because it lets the CPU throw away an entire circuit.

Subtracting B from A is the same as adding the two's-complement negation of B to A. So a processor that can add can also subtract, using the exact same adder hardware, with no separate subtraction circuitry at all.

A simpler-looking convention - reserving one bit as a sign flag - reads more naturally to a human and requires the CPU to check the sign and branch to different logic. Two's complement looks stranger on paper and makes the hardware simpler, which is the trade that actually matters when you're building it out of transistors.
:::

::: checkpoint
Under two's complement with a fixed 8 bits, what happens when you add 1 to the largest positive value?
- ( ) It stays at the maximum
- (x) It wraps around to the most negative value
- ( ) The CPU raises an error
- ( ) It becomes zero
> It wraps. Nothing warns you. That's **integer overflow**, and it's a well-known source of subtle bugs in low-level code - the value doesn't just cap, it flips sign entirely.
:::

::: behind
That wraparound has caused real damage - it's the class of bug behind more than one spectacular systems failure, because the arithmetic doesn't fail, it silently returns an answer with the wrong sign.

Which is why languages and libraries aimed at safety-critical work either check for it explicitly or refuse to have fixed-width integers at all.
:::`,
  },

  "boolean-algebra": {
    concept: `## Mathematics With Only Two Values

::: story
Ordinary algebra works with infinitely many numbers. Boolean algebra works with two: true and false, or equivalently 1 and 0.

That sounds like a toy. It is the entire mathematical foundation every digital circuit is built on.
:::

::: cards The three operations everything else is made of
AND :: True only if *both* inputs are true. Written A · B.
OR :: True if *either* input is true, or both. Written A + B.
NOT :: The opposite of its input. Written with a bar over the letter.
:::

A **truth table** lists every possible input combination and the resulting output - which, for two inputs, is only four rows, and is therefore a complete and exhaustive proof of what a circuit does.

::: checkpoint
When is A OR B true?
- ( ) Only when both are true
- (x) When at least one is true - including when both are
- ( ) Only when exactly one is true
- ( ) Only when both are false
> At least one. "Or both" catches people out - the operation that's true for *exactly* one is XOR, which shows up in the next lesson's adder.
:::

## Simplification Is Not A Paper Exercise

::: remember
Boolean laws let you rewrite an expression into a simpler equivalent one - and this matters physically, not just aesthetically.

A simpler expression means **fewer logic gates** once it's built. Fewer transistors, less power, less heat, less cost, and a shorter path for the signal to travel. Simplifying on paper is designing cheaper hardware.
:::

**De Morgan's Laws** are the most useful pair:

::: cards
NOT(A AND B) :: equals (NOT A) OR (NOT B)
NOT(A OR B) :: equals (NOT A) AND (NOT B)
:::

They let you push a NOT inward across an expression, and the AND/OR flips as it passes through. Which frequently opens up a simplification that wasn't visible before.

::: didyouknow
De Morgan's Laws also describe something you already do in ordinary speech. "It's not both raining and cold" means "either it isn't raining, or it isn't cold." The formalism just makes the flip explicit.
:::

::: behind
A **Karnaugh map** is the practical tool for simplification once an expression has four or more variables, where pure algebra becomes error-prone.

Truth-table outputs are arranged in a grid ordered so that adjacent cells differ by exactly one variable. Groups of adjacent 1s then correspond directly to simplified terms - turning an algebraic hunt into a visual pattern-spotting task, which humans are considerably better at.
:::`,
  },

  "logic-gates": {
    concept: `## The Mathematics, Made Of Transistors

::: story
The last lesson's AND, OR and NOT were operations on paper. A **logic gate** is one of them built out of transistors, where the output *voltage* is the correct Boolean result of the input voltages.

Not a model of the operation. The operation itself, running at the speed of electricity.
:::

## Two Gates That Can Build Everything

**NAND** (NOT-AND) and **NOR** (NOT-OR) are **universal**: either one, combined with copies of itself, can construct every other gate - AND, OR, NOT, all of them.

::: remember
This isn't a mathematical curiosity, it's a manufacturing decision. Perfecting the production of *one* gate type at enormous scale is easier and cheaper than perfecting several - so real chips are often built almost entirely from NAND gates.

A single well-understood component, repeated billions of times, beats a varied toolkit.
:::

::: checkpoint
Why does it matter that NAND is universal?
- ( ) NAND gates are the fastest type
- (x) A whole chip can be built from one gate type, which simplifies manufacturing enormously
- ( ) NAND uses no transistors
- ( ) It's a mathematical fact with no practical consequence
> One component to optimise, characterise and produce reliably, instead of five. At a scale of billions of gates per chip, that consolidation is worth a great deal.
:::

## Building Something That Adds

Combine gates and useful behaviour appears. A **half adder** adds two single bits:

::: cards
Sum = A XOR B :: True when exactly one input is 1 - which is precisely the sum bit of binary addition.
Carry = A AND B :: True only when both are 1 - which is exactly when addition needs to carry.
:::

Check it against 1 + 1: XOR gives 0, AND gives 1, so the result is carry 1 and sum 0 - binary \`10\`, which is 2. Correct.

::: didyouknow
Two gates. That's the whole thing. The arithmetic your CPU performs billions of times a second is built up from a component you could sketch on a napkin - chained across bit positions, with each position's carry feeding the next, exactly like column addition on paper.

The jump from "two gates" to "runs a spreadsheet" is repetition and scale, not a fundamentally different kind of magic.
:::

::: behind
A **full adder** extends the half adder with a carry-*in*, so several can be chained to add multi-bit numbers - a **ripple carry adder**.

The name warns you about its flaw: each position must wait for the carry to ripple through from every position below it, so the delay grows with the number of bits. Modern CPUs use **carry-lookahead** adders, which compute the carries in parallel rather than passing them along the chain, at the cost of considerably more gates.
:::`,
  },

  "cpu": {
    concept: `## Two Components, One Conductor

::: story
An orchestra has musicians who play, and a conductor who plays nothing at all.

Remove the musicians and there's no sound. Remove the conductor and there's sound, arriving in no agreed order, which is worse than silence.
:::

The **CPU** fetches instructions, decodes what they mean, and executes them - billions of times a second. Inside it, two components split that work.

::: cards
ALU - Arithmetic Logic Unit :: Where computation actually happens. Arithmetic (built from the adder circuits of the last lesson) and logic (AND, OR, comparisons). The musicians.
Control Unit :: Computes nothing. Directs data to the right place at the right time, tells the ALU which operation to perform, and drives the fetch-decode-execute sequence. The conductor.
:::

::: remember
The distinction is asked about constantly and is easy to state precisely: **the ALU does the work, the Control Unit decides what work is done and when.** An ALU alone would have no idea what to compute.
:::

## What Clock Speed Doesn't Tell You

**Clock speed** in GHz sets the pace of the cycle - billions of cycles per second.

::: mistake
It's tempting to read GHz as a performance score, and comparing two CPUs on it alone is one of the most common misreadings in this subject.

Clock speed says how many cycles happen. It says nothing about how much work each cycle accomplishes - that's **architecture** - and nothing about how many independent instruction streams can run at once - that's **core count**.

A 3GHz chip with a better architecture routinely beats a 4GHz one with a worse one.
:::

::: checkpoint
CPU A runs at 4GHz with one core. CPU B runs at 3GHz with eight cores. Which handles a heavily parallel workload better?
- ( ) A - higher clock speed always wins
- (x) B - eight streams of work at 3GHz beats one at 4GHz for parallel work
- ( ) They perform identically
- ( ) Impossible to say without knowing the RAM
> B, for *parallel* work specifically. On a strictly sequential task A may well win, which is exactly why one number can't answer the question - and Amdahl's Law, the last lesson in this subject, puts real limits on how far B's advantage goes.
:::

::: behind
**Hyper-threading** (and simultaneous multithreading generally) makes one physical core appear as two logical cores, by keeping two instruction streams' state loaded and interleaving them to fill stalls - the gaps where one stream is waiting on memory.

It improves throughput on many workloads. It is not equivalent to two real cores: two streams sharing one core's execution resources is a way to waste less time waiting, not a doubling of capacity.
:::`,
  },

  "registers": {
    concept: `## The Fastest Storage There Is

::: story
Everything else in this computer requires the CPU to ask for data and wait for it to arrive.

A **register** is inside the CPU. There's no request, no bus, no waiting - the data is already where the computation happens.
:::

A register holds a single value, typically 32 or 64 bits matching the CPU's word size, and it is by a wide margin the fastest storage anywhere in the system.

::: cards Two registers worth knowing by name
Program Counter (PC) :: Holds the address of the *next* instruction to fetch. Increments automatically after each one - or is overwritten entirely by a jump, branch or function call.
Accumulator :: In simpler architectures, a general-purpose register holding an in-progress arithmetic result - a running total partway through a calculation.
:::

## Why Not Just Have More Of Them?

::: story
There are dozens of registers. Not thousands. A program with a hundred live variables cannot keep them all in registers, so something has to constantly decide which values deserve the fastest storage right now.

The obvious response is: build more registers. And that's exactly the thing that would undo them.
:::

::: reveal So why can't a CPU just have thousands of registers?
Several reasons compound, and they all pull the same way.

Registers are fast partly because they're *physically close* to the execution units. A larger register file is a bigger piece of silicon, so some registers end up further away, and the wire delay starts to matter at these speeds.

The selection circuitry also grows. Picking one of 32 registers is a small, fast decode; picking one of 4096 is a much deeper one, sitting directly in the critical path of every instruction.

And the instruction encoding has to name them. Addressing 32 registers takes 5 bits per operand; 4096 takes 12. Instructions get bigger, so fewer fit in cache - and you've slowed down the memory system to speed up the register file.

Scarcity isn't an oversight in the design. It's the condition that makes registers fast.
:::

::: checkpoint
Why is a register faster than RAM?
- ( ) Registers use a more expensive kind of memory chip
- (x) The data never leaves the CPU - no bus request, no waiting for a response
- ( ) Registers are physically larger
- ( ) There's no real difference; it's a naming convention
> Location. Every other storage tier involves going somewhere and waiting. That's also why the register file can't grow without giving up the property that makes it worth having.
:::

::: behind
Real CPUs have far more *physical* registers than the architectural ones an instruction set exposes. **Register renaming** maps the small set of programmer-visible names onto a larger hidden pool.

The purpose is removing false dependencies: two independent instructions that happen to reuse the same register name look dependent to the hardware, and would have to run in order. Renaming gives them different physical registers so they can execute out of order - which the pipeline lesson will make use of.
:::`,
  },

  "memory": {
    concept: `## Fast, Big, Cheap - Pick Two

::: story
There is no storage technology that is simultaneously the fastest, the largest and the cheapest. There never has been.

So no computer picks one. Every real system stacks several, each chosen for the role its particular balance suits.
:::

::: timeline The memory hierarchy, fastest first
Registers :: Inside the CPU. Fastest, tiniest, most expensive per byte.
Cache :: On or beside the CPU. Very fast, small, expensive. Its own lesson later.
RAM :: Off-chip working memory. Slower, much larger, cheaper.
Secondary storage :: SSD or hard disk. Slowest by far, vastly larger, cheapest per byte.
:::

Each step down is slower, bigger and cheaper. That consistent trade is the whole reason the hierarchy exists.

## The Distinction That Explains Saving

::: cards
RAM is volatile :: Contents vanish the instant power is removed. This is a property of the technology, not a bug or a configuration choice.
Secondary storage is non-volatile :: Contents persist with no power at all - which is why your files are still there tomorrow.
:::

::: story
An unsaved document exists only in RAM.

Not "mostly in RAM", not "in RAM with a backup". Only there. When the power goes, the bytes are not misplaced or recoverable - the physical state that encoded them is gone.

Saving is the act of copying from volatile to non-volatile storage. It is the only thing that protects your work, and no amount of application sophistication substitutes for it.
:::

::: checkpoint
Your editor auto-saves every two minutes. Power fails. How much work is at risk?
- ( ) None - auto-save keeps everything in RAM safely
- (x) Up to two minutes of it - whatever hadn't been written to disk yet
- ( ) All of it, since auto-save only affects the display
- ( ) None, because modern RAM retains data briefly
> Up to two minutes. Auto-save is valuable precisely because it shortens this window - it doesn't eliminate it, and it works by doing exactly what manual saving does, more often.
:::

::: behind
**Persistent memory** technologies - Intel's Optane being the best-known attempt, since discontinued - were both far faster than secondary storage *and* non-volatile, sitting awkwardly between two tiers this lesson describes as distinct.

Worth knowing mainly as a reminder that the hierarchy is a description of current technology rather than a law of nature. A new tier arriving changes which trade-offs are available to design around.
:::`,
  },

  "instruction-cycle": {
    concept: `## Where The Whole Subject Connects

::: story
So far this subject has built pieces: bits, gates, an adder, an ALU, a control unit, registers, memory.

This lesson runs them. And what comes out is startlingly simple for something that runs everything.
:::

The **instruction cycle** is the sequence every instruction goes through, repeating billions of times a second.

## Three Steps, Forever

::: timeline Fetch, decode, execute
Fetch :: The CPU reads the instruction at the address in the Program Counter, loading it into an instruction register. The PC then increments to the next instruction - unless this one turns out to be a jump, which overrides it.
Decode :: The Control Unit works out what the instruction means: which operation, and which registers or memory locations it touches.
Execute :: The ALU performs the operation and the result is written where the instruction specifies - a register, or back out to memory.
Repeat :: Immediately. Fetch whatever the Program Counter now points at.
:::

::: checkpoint
Which component holds the address of the instruction to fetch next?
- ( ) The ALU
- ( ) The Control Unit
- (x) The Program Counter
- ( ) Cache
> The Program Counter, from the Registers lesson. Its automatic increment is what makes a program run in order - and overwriting it is exactly what a loop, an if, or a function call does.
:::

::: remember
That last point is worth sitting with. Every loop you've written, every conditional, every function call, is ultimately a value being written into the Program Counter instead of it incrementing by one.

Control flow isn't a separate mechanism layered on top. It's the same fetch step, pointed somewhere else.
:::

::: didyouknow
Your Python script, a Java application, and this page's JavaScript all reduce to this. Different languages, different runtimes, different decades of design - and at the hardware level, the same three steps repeating.

The whole towering stack of modern software is this cycle, executed a very large number of times.
:::

::: behind
The obvious inefficiency in the sequence above is that most of the CPU is idle at any moment: while the ALU executes, the fetch hardware has nothing to do.

**Pipelining** - the next lesson - fixes exactly that, by starting the next instruction's fetch while the current one is still being decoded or executed. Everything after this point in the subject is a refinement of this cycle rather than a replacement for it.
:::`,
  },

  "pipeline": {
    concept: `## The Assembly Line

::: story
One worker building an entire car from start to finish, then beginning the next, is a factory where almost every tool sits idle almost all the time.

Put the car on a moving line with a worker per station and the tools are all busy. Cars still take just as long to build individually - but they come off the end far more often.
:::

**Pipelining** does that to the instruction cycle. Rather than finishing one instruction before fetching the next, the stages overlap: while instruction 1 executes, instruction 2 decodes and instruction 3 is fetched.

::: flow
Cycle 1: I1 fetch -> Cycle 2: I1 decode, I2 fetch -> Cycle 3: I1 execute, I2 decode, I3 fetch
:::

## Throughput, Not Latency

::: remember
This is the distinction the topic is really about, and it's the one interviewers probe.

Pipelining improves **throughput** - instructions completed per unit time. It does not improve **latency** - any single instruction still takes just as long to travel through all three stages.

The car takes the same time to build. More cars finish per hour.
:::

::: checkpoint
A 3-stage pipeline runs 100 instructions. Compared to non-pipelined execution, what improves?
- ( ) Each instruction completes in a third of the time
- (x) The total time for all 100 drops sharply, while each individual instruction takes as long as before
- ( ) Nothing changes without more cores
- ( ) Both latency and throughput improve equally
> Total time falls because instructions overlap; individual latency is unchanged. Confusing the two is the single most common error on this topic.
:::

## What Stalls The Line

::: cards
Data hazard :: An instruction needs a result that an earlier, still-in-flight instruction hasn't finished computing. The pipeline must wait.
Control hazard :: A branch. The CPU doesn't know which instruction comes next until the branch resolves - but the pipeline has already started fetching a guess.
:::

::: story
A control hazard is the awkward one, because a pipeline cannot afford to wait and see.

So it guesses, and keeps going. If the guess was right, nothing was lost. If it was wrong, every instruction fetched on the wrong path must be thrown away and the pipeline refilled from the correct address.

**Branch prediction** is the machinery devoted to guessing well, and modern predictors are correct well over 95% of the time - by keeping histories of how each branch behaved before.
:::

::: didyouknow
Speculative execution - doing work before knowing whether it's needed - turned out to have a security dimension nobody planned for. The Spectre and Meltdown vulnerabilities exploited traces left behind by *discarded* speculative work to read memory a program should never have seen.

A performance optimisation from the 1990s became a security problem in 2018, which is a useful reminder that hardware optimisations are part of the security surface.
:::

::: behind
**Superscalar** architecture goes beyond overlapping stages: multiple parallel execution units let a CPU fetch, decode and execute *several independent instructions in the same clock cycle*.

Pipelining keeps every stage busy on different instructions. Superscalar duplicates the stages. Modern high-performance CPUs are both at once.
:::`,
  },

  "cache": {
    concept: `## Bridging A Very Large Gap

::: story
Registers are inside the CPU. RAM is a trip off-chip and a wait measured in hundreds of cycles.

That gap is enormous, and a CPU that went to RAM for everything would spend most of its life waiting rather than computing.
:::

**Cache** sits between them: small, fast memory on or beside the CPU, automatically holding recently-accessed data so a repeat access is served without the trip.

::: cards
Cache hit :: The data is already there. Fast.
Cache miss :: Not there. Fetch from RAM - slow - and store it in cache on the way past, in case it's wanted again.
:::

## Why It Works At All

::: story
Caching only helps if the data you want next is data you've recently wanted. Stated baldly, that sounds like wishful thinking.

It isn't, because real programs are not random. They loop over the same variables. They walk arrays in order. They call the same functions repeatedly.

That regularity has a name, and cache design is built entirely on relying on it.
:::

::: cards The principle of locality
Temporal locality :: Recently-used data is likely to be used again soon. A loop counter, read and written every iteration.
Spatial locality :: Data near recently-used data is likely next. Array element 5 follows element 4.
:::

::: remember
Spatial locality is why caches fetch a whole **line** of adjacent bytes rather than the single byte requested. If you touched one, you'll probably touch its neighbours - so bringing them along costs almost nothing extra and often saves the next miss entirely.
:::

::: checkpoint
Iterating an array in order versus in random order - same array, same number of accesses. Why is sequential faster?
- ( ) Random access uses more CPU instructions
- (x) Sequential access hits cache lines already fetched; random order misses constantly
- ( ) The compiler optimises sequential loops only
- ( ) There's no measurable difference
> One fetch brings in several adjacent elements, so sequential access gets multiple hits per miss. Random order wastes most of every line it fetches - and the gap can be an order of magnitude on large arrays, from identical-looking code.
:::

::: cards The three levels real CPUs use
L1 :: Smallest and fastest, per core, usually split into separate instruction and data caches.
L2 :: Larger, slightly slower, still per core.
L3 :: Largest and slowest of the three, typically shared across all cores.
:::

Which is the memory hierarchy again, recursively, inside the gap between two of its own tiers.

::: behind
**Cache coherence** is the problem multiple cores create: if two cores each hold a cached copy of the same memory location and one modifies it, the other's copy is now wrong.

Protocols like **MESI** track each cached line's state - modified, exclusive, shared, invalid - and coordinate between cores to keep them consistent. It's real hardware machinery, and it's why writing to memory shared between threads costs far more than writing to memory only one thread touches.
:::`,
  },

  "interrupts": {
    concept: `## Don't Call Us, We'll Call You

::: story
Two ways to run a shop.

Stand at the door asking every few seconds whether anyone has arrived - all day, mostly to an empty street.

Or fit a bell, get on with your work, and look up when it rings.
:::

An **interrupt** is the bell. A signal that pauses the CPU's current work to handle something urgent - a key pressed, a packet arriving, a timer expiring.

The alternative is **polling**: repeatedly checking every device in a loop, and getting "nothing new" back almost every time.

::: cards
Polling :: The CPU asks, constantly. Cycles burned on checks that find nothing. Response time depends on how often you get round to asking.
Interrupts :: The device tells the CPU. No cycles wasted waiting, and the response happens the moment the event does.
:::

::: didyouknow
Consider the scale. A fast typist produces maybe 6 keystrokes a second; a CPU runs billions of cycles in that time. Polling the keyboard means asking hundreds of millions of times per keystroke and being told "no" almost every time.

The waste isn't marginal. It's essentially total.
:::

## Getting Back To What You Were Doing

::: timeline Handling an interrupt
Something happens :: A device raises an interrupt while the CPU is mid-program.
State is saved :: The Program Counter and relevant registers are stored, so the current work can resume exactly where it stopped.
The handler runs :: A small piece of code written specifically for this kind of event - reading the keystroke, for instance.
State is restored :: The saved registers and Program Counter come back.
The program resumes :: Exactly where it was, with no evidence anything happened.
:::

::: remember
The save-and-restore is the whole trick, and it's the same mechanism as the OS context switch from the Operating Systems subject. Both rely on the fact that a program's entire resumable state is a finite set of register values - which is why a Process Control Block can exist at all.
:::

::: checkpoint
Why must the CPU save state before running the handler?
- ( ) To make a backup in case the handler crashes
- (x) Because the handler will overwrite registers the interrupted program was using
- ( ) To log the interrupt for debugging
- ( ) It doesn't - handlers use separate registers
> The handler is ordinary code using the same registers. Without saving first, the interrupted program would resume with its variables replaced by the handler's - which is not a subtle bug, it's total corruption.
:::

::: behind
Interrupts have priorities, and some can be temporarily **masked** - disabled while the CPU is in a critical section that must not be interrupted partway.

A **non-maskable interrupt** cannot be disabled at all, and is reserved for events where deferring is not an option: hardware failure, uncorrectable memory error. When one fires, whatever the CPU was protecting is less important than what just went wrong.
:::`,
  },

  "performance": {
    concept: `## The Ceiling On Throwing Cores At It

::: story
Four cooks in a kitchen finish dinner much faster than one.

Sixteen cooks don't finish it four times faster again. At some point they're queueing for the one oven, and the meal takes as long as the oven takes, however many people are standing around it.

There is a part of the job that cannot be divided, and it sets the floor on how fast the whole thing can possibly go.
:::

**Amdahl's Law** puts a number on that.

If a fraction **P** of a program can be parallelised, and the rest is inescapably sequential, then speedup with **N** cores is:

  Speedup = 1 / ((1 - P) + P/N)

::: story
Take P = 0.9 - a program 90% parallelisable, which sounds excellent.

Set N to infinity. The P/N term vanishes entirely. Speedup = 1 / 0.1 = **10x**.

Ten times. That's the ceiling with *unlimited* cores, because the stubborn 10% still runs one instruction at a time and nothing can be done about it.
:::

::: checkpoint
A program is 50% parallelisable. Maximum speedup with infinite cores?
- ( ) Infinite
- (x) 2x
- ( ) 50x
- ( ) No speedup at all
> 1 / 0.5 = 2x. Half the work becoming instantaneous still leaves the other half taking exactly as long as it did - so the whole thing can at best halve.
:::

::: remember
This is why "add more cores" so often disappoints, and why the useful question is never "how many cores can we get" but "what fraction of this work is actually parallel". The second number sets the ceiling the first one is climbing toward.
:::

## The Whole Subject, As Performance Levers

::: cards What you've actually built up to
Logic gates and adders :: Determine what one operation costs at the bottom.
Pipelining :: Improves throughput within a single core by overlapping stages.
Cache :: Reduces the cost of memory access by exploiting locality.
Multiple cores :: Enable real parallelism - bounded by Amdahl's Law.
:::

::: remember
None of these substitute for each other. A perfectly pipelined core stalls on cache misses. Excellent cache behaviour doesn't parallelise sequential logic. More cores don't help a program that's 20% parallel.

Reasoning about performance means knowing which lever the bottleneck is actually on - which is why guessing, or optimising whatever's easiest to optimise, so often changes nothing.
:::

::: behind
**Gustafson's Law** reframes Amdahl's pessimism, and is often the more realistic lens.

Amdahl asks: how much faster can a *fixed-size* problem run with more cores? Gustafson asks: how much *more work* can be done in the same time, given more cores?

In practice, extra capacity usually gets spent on bigger problems rather than finishing the same one sooner - more data, higher resolution, more users. Under that framing the scaling looks much better, and it's a genuinely different question rather than a contradiction of Amdahl.
:::`,
  },
};
