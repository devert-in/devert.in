// Parallel Computing - rewritten lesson bodies. See operating-systems.mjs for
// the authoring rules. Race conditions, deadlock and Amdahl's Law all appear in
// other subjects too - so each lesson says which lens it's applying rather than
// pretending the material is new, which is also what the interview lesson asks
// students to do.

export const PARALLEL_COMPUTING = {
  "introduction-to-parallel-computing": {
    concept: `## When Clock Speed Stopped Rising

::: story
For decades, next year's computer was faster because next year's chip ran at a higher clock speed. 500MHz, then 1GHz, then 3GHz.

Then it stopped, in the mid-2000s, and not because anyone ran out of ideas. Power consumption and heat rise sharply with clock speed, and chips reached the point where going faster meant not being able to cool them.

So the industry went sideways instead: more cores rather than faster ones.
:::

Which made **parallel computing** everyone's problem. Software that only uses one core stopped getting faster the year the clock speeds stopped climbing.

## Parallel Is Not Concurrent

::: cards The distinction that gets asked about
Concurrent :: Multiple tasks make progress over overlapping time periods. A single core rapidly switching between them qualifies - nothing is ever truly simultaneous.
Parallel :: Multiple tasks execute at the same physical instant. Requires genuinely multiple execution units.
:::

::: remember
The clean summary: **concurrency is about structure, parallelism is about execution.**

Concurrency is how you organise a program to handle several things at once. Parallelism is whether the hardware actually does them simultaneously. A concurrent program on one core is still concurrent; it just isn't parallel.
:::

::: checkpoint
A single-core machine runs a browser with twenty tabs. Concurrent, parallel, or both?
- ( ) Both
- (x) Concurrent only - the core switches between tabs rapidly, never running two at the same instant
- ( ) Parallel only
- ( ) Neither
> Concurrent. The switching is fast enough to feel simultaneous, and only one instruction stream executes at any moment - which is exactly the distinction the definitions are for.
:::

::: cards Four flavours of parallelism
Bit-level :: More bits per operation. 32-bit to 64-bit processors.
Instruction-level :: One core overlapping independent instructions - the pipelining from Computer Organization.
Data :: The same operation across many data elements at once. GPUs.
Task :: Different independent tasks running simultaneously. Multi-core CPUs.
:::

::: behind
**Amdahl's Law** - its own lesson later - is worth knowing about from the start, because it's sobering.

Any part of a program that must run sequentially puts a hard ceiling on total speedup, regardless of core count. More cores is not a general answer, and knowing that early stops a lot of wasted effort.
:::`,
  },

  "flynn-s-taxonomy": {
    concept: `## Four Categories From Two Questions

::: story
How many instruction streams does the machine run, and how many data streams does it process?

Single or multiple, for each. Cross them and you get four architectures - and each one corresponds to real hardware you've used.
:::

## The Four

::: cards
SISD :: Single instruction, single data. A traditional sequential single core. No parallelism at all.
SIMD :: Single instruction, multiple data. One operation applied to many elements at once. GPUs and CPU vector instructions.
MISD :: Multiple instructions, single data. Rare - mostly fault-tolerant systems running the same input through independent paths as a cross-check.
MIMD :: Multiple instructions, multiple data. Each unit runs its own program on its own data. Multi-core CPUs and clusters.
:::

::: story
SIMD is easiest to see with an example. Brighten every pixel in an image: identical operation, millions of independent data elements, no element depending on any other.

That's a GPU's ideal workload, and it's why a GPU has thousands of simple cores rather than eight complex ones.
:::

::: checkpoint
A web server handles a thousand independent user requests. Which category?
- ( ) SISD
- ( ) SIMD
- (x) MIMD - each request is different work on different data
- ( ) MISD
> MIMD, which is what multi-core CPUs are built for. SIMD would require every request to be the identical operation, which is exactly what they aren't.
:::

::: remember
The practical value of this taxonomy is matching hardware to workload.

Same operation, many data elements: SIMD, so a GPU. Different independent tasks: MIMD, so a multi-core CPU. Running the wrong workload on the wrong architecture is how you end up with expensive hardware performing badly.
:::

::: behind
**SIMT** - single instruction, multiple threads - is how modern GPUs are actually described.

It's SIMD organised around thread groups rather than raw data lanes, and it permits limited per-thread branching: threads in a group can take different paths, at a real cost when they diverge, because the hardware must execute both paths and mask off the inactive threads.

Which is why GPU code avoids branching in inner loops.
:::`,
  },

  "parallel-architectures": {
    concept: `## Who Can See Which Memory

::: story
Flynn's Taxonomy classifies by instruction and data streams. There's a second, independent question that shapes everything about how you program a parallel system: can the processing units see each other's memory?
:::

::: cards Two organisations
Shared memory :: All cores access one unified memory space. Communication is just reading and writing a shared variable. A multi-core CPU.
Distributed memory :: Each node has private memory nobody else can touch. Communication requires explicitly sending messages. A cluster.
:::

## The Trade

::: story
Shared memory is easy to program and hard to scale.

Easy because sharing data is a variable assignment. Hard to scale because every core competes for the same memory bandwidth - add enough cores and they spend their time waiting for memory rather than computing.

Distributed memory inverts both. Every message must be written explicitly, and there's no shared bottleneck, so it scales to thousands of machines.
:::

::: checkpoint
Why does shared memory stop scaling as core count rises?
- ( ) The cores run out of instructions
- (x) They contend for the same memory bandwidth, so adding cores adds waiting rather than throughput
- ( ) Shared memory has a hard core limit
- ( ) Cache is disabled above a certain count
> Bandwidth contention. It's a physical limit of one shared path to memory, which is why very large machines are built as many small shared-memory nodes rather than one enormous one.
:::

::: remember
Which is exactly what large systems do: **shared memory within a node, message passing between nodes.**

A cluster training a large model is dozens of multi-core machines, each shared-memory internally, coordinating by messages. Both models at once, each where it's strongest.
:::

::: mistake
Message passing looks like unnecessary ceremony to someone used to shared memory - all that explicit send and receive for something a variable assignment would do.

The explicitness is what makes it scale. Nothing is implicitly shared, so nothing contends, and the cost of communication is visible in the code rather than hidden in memory traffic you can't see.
:::

::: behind
**NUMA** - non-uniform memory access - is the refinement that shared memory needs at scale.

In a large multi-socket machine, memory is physically divided into banks, each closer to some cores than others. All of it is accessible; some of it is measurably slower to reach.

NUMA-aware software keeps a thread's data in its own nearby bank, and the performance difference between doing that and ignoring it is substantial - which makes "shared memory" less uniform than the name suggests.
:::`,
  },

  "parallel-programming-models": {
    concept: `## Three Ways To Write It

::: story
The architecture decides what's available; the programming model is how you use it.

Three dominate, and they map onto the previous lesson almost directly.
:::

::: cards
Threads :: For shared memory. One program, several execution paths, all sharing the same memory. Simple to start with, and correctness requires the synchronisation from the next lesson.
Message passing (MPI) :: For distributed memory. Separate processes explicitly sending and receiving. More effort per line, and it scales to thousands of machines.
MapReduce :: A higher-level abstraction. You write two functions; the system handles everything else.
:::

## What MapReduce Actually Removes

::: story
Writing a distributed word count with raw MPI means handling: splitting the input across machines, distributing the work, collecting partial results, combining them, and dealing with a machine dying halfway through.

That last one is most of the difficulty. In a cluster of a thousand machines, something failing during a long job isn't an edge case, it's expected.
:::

::: cards What you write versus what you get
You write map :: Applied independently to each chunk of data, in parallel.
You write reduce :: Combines the partial results into a final answer.
The system handles :: Splitting, distribution, scheduling, moving data between machines, retrying failed chunks, and assembling the output.
:::

::: checkpoint
Why is MapReduce restrictive compared to raw MPI, and why is that acceptable?
- ( ) It isn't restrictive
- (x) It only fits problems expressible as map-then-reduce - and that covers a large share of real data processing, in exchange for the system handling failures for you
- ( ) It's slower for all workloads
- ( ) It only runs on one machine
> Restricted expressiveness for automatic fault tolerance. A tightly-coupled simulation with constant inter-node communication doesn't fit, which is why MPI still exists in scientific computing.
:::

::: remember
That trade - less control, dramatically less to get wrong - recurs throughout computing. Frameworks earn their place by removing the parts people reliably get wrong, and distributed failure handling is firmly in that category.
:::

::: behind
**Apache Spark** is MapReduce's successor and fixes its main practical flaw.

MapReduce writes intermediate results to disk between stages. For a single pass that's fine; for an iterative algorithm - most ML training - it means writing and re-reading the same data every iteration.

Spark keeps intermediates in memory across stages, which is a large speedup for exactly the workloads MapReduce handled worst.
:::`,
  },

  "synchronization-race-conditions": {
    concept: `## One Line, Three Operations

::: story
Two threads each run \`balance = balance + 10\`. The balance starts at 100. It should end at 120.

  Thread A reads balance: 100
  Thread B reads balance: 100
  Thread A writes 110
  Thread B writes 110

It ends at 110. Ten pounds vanished, and no line of code was wrong.
:::

That single statement isn't atomic - it's a read, an add, and a write. Interleave two of them badly and one update is silently overwritten.

::: remember
This is a **race condition**, and it's the same hazard the Operating Systems subject covers from the scheduling side. Here it's viewed as parallelism's central correctness problem.

What makes it nasty: it depends on timing, so it passes every test and fails in production, intermittently, at a rate proportional to load.
:::

## Locks

::: cards
Critical section :: The code that touches shared data.
Lock (mutex) :: Acquired before entering, released after. A second thread attempting to acquire it waits.
Result :: Only one thread is inside at a time, so the read-modify-write completes without interleaving.
:::

::: checkpoint
Why isn't \`balance = balance + 10\` atomic when it's one line of source?
- ( ) It is atomic in most languages
- (x) It compiles to separate read, add and write instructions, and another thread can run between them
- ( ) The compiler reorders it
- ( ) Only floating-point operations are non-atomic
> Source lines aren't machine instructions. Which is the general lesson: atomicity is a property of the hardware operation, not of how compact the code looks.
:::

## The Fix That Creates A New Problem

::: story
Thread A holds lock 1 and wants lock 2. Thread B holds lock 2 and wants lock 1.

Neither will release what it has until it gets what it wants. Both wait forever, and the program stops - not crashing, not erroring, just permanently still.
:::

::: remember
**Deadlock**, the same phenomenon the Operating Systems subject analyses via the Coffman conditions.

The standard prevention here is a **consistent lock ordering**: if every thread acquires lock 1 before lock 2, the circular wait cannot form. Simple discipline, and it has to be followed everywhere - one function acquiring in the other order is enough.
:::

::: behind
**Atomic operations** avoid locks entirely for simple cases.

Hardware instructions like compare-and-swap perform a whole read-modify-write indivisibly, with no lock to acquire and no waiting.

Ideal for incrementing a counter, where acquiring and releasing a lock costs far more than the work it protects. Not a general replacement - anything spanning multiple variables still needs a lock.
:::`,
  },

  "speedup-amdahl-s-law": {
    concept: `## The Ceiling

::: story
**Speedup** is the honest metric: sequential time divided by parallel time. Four times faster is a speedup of 4.

The question worth asking is how much speedup is available - and the answer is less encouraging than "as many cores as you can afford".
:::

::: story
Some part of any program cannot be parallelised. Reading the input file. Initialising. Combining the final results. Writing the answer out.

Whatever fraction that is, it runs at the same speed no matter how many cores you add. And it sets a hard ceiling on everything.
:::

**Amdahl's Law**: if fraction **P** is parallelisable, maximum speedup with infinite processors is

  1 / (1 - P)

## What The Numbers Look Like

::: cards What that means concretely
P = 0.5 :: Maximum speedup 2x. Half the program is sequential, so you cannot beat halving the runtime.
P = 0.9 :: Maximum speedup 10x. Ninety percent parallel sounds excellent and caps at ten.
P = 0.95 :: Maximum speedup 20x. Adding cores past that point buys almost nothing.
:::

::: checkpoint
A program is 80% parallelisable. Maximum speedup with 1000 cores?
- ( ) 800x
- (x) 5x - 1/(1−0.8) = 1/0.2
- ( ) 80x
- ( ) 1000x
> 5x. The sequential fifth dominates completely, and the 996th core contributes essentially nothing - which is the sort of calculation worth doing before buying hardware.
:::

::: remember
Which flips where optimisation effort should go.

A team parallelising the remaining 5% of an already-parallel program is chasing a ceiling they've already hit. Reducing the *sequential* fraction from 10% to 5% moves the ceiling from 10x to 20x - a doubling that no amount of extra cores could deliver.

The sequential portion is almost always the higher-leverage target, and it's almost always the one that gets ignored.
:::

::: behind
**Gustafson's Law** reframes this more optimistically, and often more realistically.

Amdahl asks how much faster a fixed problem can run. Gustafson asks how much bigger a problem can be solved in the same time.

In practice, more compute usually gets spent on larger problems - more data, finer resolution, bigger models - rather than finishing yesterday's problem sooner. Under that framing scaling looks far better, and it's a different question rather than a contradiction.
:::`,
  },

  "load-balancing-gpu-computing": {
    concept: `## Everyone Waits For The Slowest

::: story
Split a job across four processors. Three finish in one second; the fourth takes thirty.

The job took thirty seconds. Three processors spent twenty-nine of them idle.

Total time is set by the slowest worker, which makes distributing the work evenly as important as parallelising it at all.
:::

::: cards Two strategies
Static :: Divide the work up front, based on an estimate. Simple, with no runtime overhead - and badly wrong if the estimate is.
Dynamic :: Hand out work as processors become free. Adapts to uneven task costs, at the cost of coordination.
:::

::: checkpoint
Four processors, four tasks each. Is the load balanced?
- ( ) Yes - equal task counts
- (x) Not necessarily - equal counts only balance if the tasks take similar time
- ( ) Yes, if the tasks are the same type
- ( ) Only with dynamic balancing
> Counting tasks isn't measuring work. Four quick tasks and four slow ones is an equal count and a terrible balance - which is the trap static balancing falls into.
:::

## GPUs

::: story
A CPU has a handful of complex cores, each good at anything, including branching, prediction and irregular work.

A GPU has thousands of simple cores that all do the same thing to different data. It cannot handle irregular work well, and it doesn't need to.
:::

::: remember
Which makes GPUs a SIMD machine in Flynn's terms, and explains their unexpected second career.

Neural network training is dominated by matrix multiplication - the same arithmetic applied across millions of independent values. That is exactly the workload shape GPUs were built for, and the fit was noticed rather than designed.

The hardware was made for graphics. The workload happened to be the same shape.
:::

::: remember
And that's this subject's recurring point, made concrete: **match the architecture to the workload's parallelism pattern.**

Data-parallel work on a GPU is transformative. The same work on a CPU is slow, and irregular branching work on a GPU is worse than useless.
:::

::: behind
**Work stealing** is the elegant version of dynamic balancing.

Each processor keeps its own task queue. A processor that empties its queue steals a task from a busy one's queue rather than idling.

No central coordinator to become a bottleneck, and balance emerges from local decisions - which is why most modern parallel runtimes use it.
:::`,
  },

  "interview-questions": {
    concept: `## Systems Interviews, And Increasingly ML Ones

::: story
Parallel computing questions used to belong to systems and HPC roles.

GPU computing changed that. ML infrastructure interviews now ask the same material, because everything about training large models is a parallelism problem.
:::

## The Answer Shape

::: timeline
State it precisely :: The definition, the formula, the architecture.
Compute or demonstrate :: Amdahl's Law with real numbers; the race condition traced step by step.
Connect it outward :: To the Operating Systems subject, or to Machine Learning's GPU dependence.
:::

::: reveal What connecting outward sounds like
Asked why GPUs are used for machine learning, an adequate answer says they're faster for parallel work.

A strong one is specific:

"Neural network training is dominated by matrix multiplication - the same arithmetic across millions of independent values, with no element depending on another. That's data parallelism, SIMD in Flynn's terms, which is precisely what a GPU's thousands of simple cores are built for.

Which also says where GPUs *don't* help. Irregular, branch-heavy work gets no benefit - the cores execute in lockstep, so divergent branches serialise. It's a workload-shape match, not a general speed advantage."

Same claim, with the reason and the limit attached.
:::

::: cards The five to have cold
Parallel vs concurrent :: Simultaneous execution versus overlapping progress, with an example of each.
Flynn's Taxonomy :: Four categories, real hardware for each.
Race conditions :: The bank balance traced through, how a lock fixes it, how locks cause deadlock.
Amdahl's Law :: The formula, computed instantly for any P.
GPUs and data parallelism :: Why the fit exists, and where it doesn't.
:::

::: checkpoint
Asked for maximum speedup at P = 0.85, what should happen?
- ( ) Explain that it depends on core count
- (x) Compute it: 1/(1−0.85) = 1/0.15 ≈ 6.7x
- ( ) Say it's unbounded
- ( ) Ask for more information
> Compute it. It's a one-step calculation and hesitating on it suggests the formula was memorised rather than used - which is exactly what the question checks.
:::

::: mistake
The other frequent slip is treating this subject as disconnected from Operating Systems.

Race conditions and deadlock are the same phenomena that subject covers. Saying so demonstrates you recognise one problem viewed from two angles, rather than having learned it twice without noticing.
:::

::: behind
At senior level, expect the ML training case in detail.

**Data parallelism** puts a full copy of the model on each GPU and splits the training batch between them. **Model parallelism** splits a single model across GPUs when it's too large for one device's memory.

Large models use both simultaneously, plus pipeline parallelism across stages - which is this subject's data-versus-task distinction, at the largest scale anyone currently operates.
:::`,
  },
};
