// Operating Systems - rewritten lesson bodies in the block format (see
// devert-frontend/lib/lessonBlocks.js). Only the `concept` field; every other
// field on these topics already renders as its own card in the topic view.
//
// Authoring rules followed here, worth keeping to for later subjects:
//
//  - Every fact in the original prose survives. This is a restructure and an
//    expansion, never a trim - a student must not lose information by us
//    making the page nicer to read.
//  - Explain before naming. The story comes first, the term arrives after it.
//  - Do NOT restate keyPoints / commonMistakes / interviewTips inside the
//    concept - they render as their own cards directly underneath it, and
//    repeating them verbatim is what made the old pages feel padded.
//  - One running analogy per subject where possible. Here it's a restaurant:
//    the OS is the manager (Introduction), threads are chefs sharing one
//    kitchen (Threads), and the last egg in the fridge is the race condition
//    (Synchronization). Continuity beats a fresh unrelated metaphor per page.

export const OPERATING_SYSTEMS = {
  "introduction": {
    concept: `## What Does An Operating System Actually Do?

::: story
Picture a restaurant at 8pm on a Saturday. Forty customers are ordering, four chefs are cooking, waiters are running plates out, and the card machine is beeping at the till.

Now imagine there is no manager. Waiters wander into the kitchen and start using whichever stove looks free. Two of them grab the same pan. Table 9 gets served twice and table 12 never gets served at all.

Nobody is doing anything wrong on purpose. There is simply nobody deciding who gets what, and when.

Hire one manager and the chaos disappears - not because the manager cooks or carries plates, but because the manager *decides*.

Your computer is that restaurant. The operating system is that manager.
:::

Without an OS, every program would have to carry its own code for driving the CPU, the memory, the disk, and every device attached to the machine. That is not hypothetical: it is exactly how the earliest computers worked, and exactly why the OS was invented.

::: flow
You -> Application -> Operating System -> Hardware
:::

An application never reaches the hardware directly. It asks, and the OS decides.

## The Four Jobs It Never Stops Doing

Everything an operating system does falls into four buckets. Tap each one to open it.

::: cards
Process management :: Deciding which program gets the CPU, and for how long. Two hundred programs open, eight cores - somebody has to choose.
Memory management :: Handing out RAM to programs, and making sure none of them can read or wreck another one's memory.
File management :: Turning a featureless disk into named files inside folders, and remembering which blocks belong to which file.
Device management :: Standing between programs and the disk, keyboard, screen and network card so they never fight over them.
:::

::: checkpoint
Your laptop has 8 CPU cores and 200 processes that all want to run *right now*. Which of the four jobs decides what happens next?
- ( ) Memory management
- (x) Process management
- ( ) File management
- ( ) Device management
> Process management - and specifically the part of it called the scheduler, which gets a whole lesson to itself later in this subject.
:::

## Kernel, Or Operating System?

These two words get used as though they mean the same thing. They don't.

The **kernel** is the core that does the actual work described above. It runs in a privileged CPU mode with direct hardware access.

The **operating system** is the kernel *plus* everything shipped around it: libraries, utilities, a shell, usually a graphical interface.

::: analogy Back to the restaurant
The kernel is the manager. The operating system is the whole restaurant - manager, menus, tills, uniforms and front door included.
:::

Your own code runs in **user mode**, which deliberately cannot touch hardware. To do anything privileged - open a file, allocate memory, start a new process - it has to ask the kernel through a **system call**.

::: behind
A system call is not an ordinary function call. It deliberately trips the CPU into kernel mode, runs the privileged work there, then drops back into user mode before your next line executes. There's a full lesson on this later; for now just notice that the boundary exists, and that crossing it is a real event rather than a detail.
:::

::: didyouknow
Android runs on the Linux kernel. So does ChromeOS. So does almost every server on the internet. The same kernel that runs a phone in your pocket runs machines with a thousand times its memory - the manager's job description doesn't change with the size of the restaurant.
:::`,
  },

  "processes": {
    concept: `## A Recipe Is Not A Meal

::: story
A recipe card for biryani sits in a drawer. It is precise, complete, and completely inert. Nothing is cooking. Nobody is eating.

Now a chef takes that card, walks into the kitchen, claims a stove, a pot, and a counter, and starts cooking. *That* is happening. It occupies space. It has a current step. You could interrupt it, and it would resume.

One recipe card. Any number of meals being cooked from it at once, each at a different step.
:::

The recipe card is a **program**: a passive set of instructions sitting on disk, like an \`.exe\` file. The cooking is a **process**: that program loaded into memory and actually running, with its own memory space, its own open file handles, and its own CPU register state.

The same program can run as several completely separate processes at once. Two browser windows are one program, two processes.

::: checkpoint
You double-click the same music player icon twice and get two windows. How many programs and how many processes now exist?
- ( ) Two programs, one process
- (x) One program, two processes
- ( ) Two programs, two processes
- ( ) One program, one process
> One program on disk; two independent live instances of it, each with its own memory and its own register state.
:::

## The Five States Every Process Moves Through

::: timeline Process lifecycle
New :: Being created. The OS is allocating its memory and building its record.
Ready :: Loaded and perfectly able to run - just waiting for a free CPU core.
Running :: Actually executing on a core, right now.
Waiting :: Blocked. It asked for something slow (disk, network, keyboard) and cannot continue until that arrives.
Terminated :: Finished or killed. The OS reclaims everything it was holding.
:::

The arrow that surprises people is Running back to Ready. A process doesn't only leave the CPU when it finishes or blocks - the OS can simply take the CPU away because someone else's turn has come.

::: remember
Ready means "able to run, not currently running". Waiting means "cannot run yet, even if a core is free". Those are completely different situations, and confusing them makes the rest of this subject much harder than it needs to be.
:::

## How Does It Resume Exactly Where It Left Off?

If the OS can pause a process mid-instruction and come back to it later, something has to remember precisely where it was. That something is the **Process Control Block** - one PCB per process.

::: cards What's in a PCB
Process state :: Which of the five states above it's in right now.
Register values :: Including the program counter - the exact instruction to resume from.
Memory information :: Where this process's memory lives, and how much of it there is.
Scheduling information :: Priority, and how much CPU time it has already had.
Open files :: Which file handles it currently holds.
:::

Swapping the CPU from one process to another means saving the outgoing process's PCB and loading the incoming one's. That operation is called a **context switch**, and the PCB is what makes it possible at all.

::: behind
A context switch is not free. Along with copying register state, it invalidates CPU cache lines and TLB entries that belonged to the old process, so the new process starts out running against a cold cache. This cost is precisely why an OS cannot just switch processes infinitely often to seem fair - and it becomes a direct input into how the next lesson picks a time slice length.
:::`,
  },

  "cpu-scheduling": {
    concept: `## One Doctor, Twelve Patients

::: story
A single doctor is on duty at a clinic. Twelve patients are in the waiting room. She can only see one at a time, and every choice about who goes next has a consequence for everyone else.

Call them strictly in arrival order and it feels fair - until the first patient turns out to need a forty-minute consultation while eleven people with two-minute problems wait behind him.

Call the quick cases first and the room empties fast - but the man with the complicated case may never get called at all.

Give everyone exactly ten minutes and send them back to the queue if they aren't done, and nobody waits forever - but the constant swapping in and out wastes time.

Take emergencies first and you're obviously right - and the routine check-up in the corner might sit there all day.
:::

There is no correct answer in that story, only trade-offs. That is genuinely the whole of CPU scheduling: many processes ready to run, a limited number of cores, and a decision to make about which one goes next and for how long. It directly determines whether the machine feels responsive and how much total work it gets through.

## The Four Algorithms, And What Each One Costs You

::: cards
FCFS - First Come First Served :: Processes run in arrival order. Beautifully simple. One long process can block a queue of short ones behind it - the convoy effect.
SJF - Shortest Job First :: The shortest process runs next, which minimises average waiting time. Requires knowing how long each job will take in advance, which is usually impossible, and can starve long jobs forever.
Round Robin :: Every process gets a fixed time slice (a quantum), then goes to the back of the queue. Fair and responsive, which is why interactive systems use it. Too small a quantum and you spend your time context switching instead of working.
Priority scheduling :: Higher priority runs first. Low-priority work can starve, unless you add aging - gradually raising the priority of anything that has waited a long time.
:::

::: analogy The convoy effect
One tractor on a single-lane road. Behind it, eleven cars that could each be doing 80. Nothing is broken, nobody is at fault, and everyone is late. That is FCFS with one long job at the front.
:::

::: checkpoint
Four processes arrive at almost the same moment: three need 2ms of CPU each, one needs 400ms. Under FCFS, the 400ms job happened to arrive first. What goes wrong?
- ( ) The long job never finishes
- (x) The three short jobs wait ~400ms each for 2ms of work
- ( ) The CPU sits idle
- ( ) All four finish at the same time
> That's the convoy effect. Nothing is starved permanently - but average waiting time is terrible, and on an interactive machine it feels like a freeze.
:::

## The Two Numbers You Will Calculate Constantly

::: remember
**Turnaround Time = Completion Time − Arrival Time** - the total time from showing up to being finished, waiting included.

**Waiting Time = Turnaround Time − Burst Time** - the same span with the actual work subtracted out, so what's left is pure queueing.
:::

Burst time is how long the process actually needs on the CPU. Notice that turnaround time *includes* the burst and waiting time does not - which is the single most common place students lose marks on this topic.

::: reveal Why does Round Robin's quantum size matter so much?
Two forces pull in opposite directions.

Make the quantum large and Round Robin slowly degenerates into FCFS - if the slice is longer than most jobs need, everyone simply runs to completion in arrival order, convoy effect included.

Make it tiny and every process gets served almost instantly, but the CPU spends a growing share of its time saving and restoring register state instead of executing your code. Each of those switches also leaves the new process running against a cold cache.

Real systems land in the middle, typically a few milliseconds - long enough that the switching overhead stays a small fraction of the slice, short enough that a keystroke still feels immediate.
:::

::: behind
Real schedulers don't pick one of these four and stop. Linux's Completely Fair Scheduler is a direct descendant of these ideas: it tracks how much CPU time each process has already received and always runs whichever one is furthest behind its fair share - approximating "shortest job first" without needing the future knowledge that makes true SJF impossible.
:::`,
  },

  "deadlocks": {
    concept: `## Four Cars, One Intersection

::: story
Four cars reach an unmarked four-way crossing at the same instant. Each one edges forward into the junction. Each one now needs the space occupied by the car to its right.

Nobody can move forward. Nobody will reverse - each driver is already committed and waiting for the space ahead to clear.

Every driver is behaving reasonably. Every driver is waiting for something that will never happen. They will sit there until somebody breaks the pattern from outside.
:::

That is a **deadlock**: a set of processes each holding a resource the next one needs, waiting in a closed circle, so none of them can ever proceed.

## It Takes All Four Conditions At Once

A deadlock cannot happen unless all four of these hold simultaneously. They're called the **Coffman conditions**, and the reason to learn them as a set of four is practical: break any single one and deadlock becomes impossible.

::: cards The Coffman conditions
Mutual exclusion :: A resource can only be held by one process at a time. Two cars cannot occupy the same square metre of junction.
Hold and wait :: A process holds one resource while waiting for another. Each driver holds their bit of the junction while waiting for the next bit.
No preemption :: A resource cannot be forcibly taken away - it has to be released voluntarily. No crane arrives to lift a car out.
Circular wait :: A closed chain where each process waits on the next. Exactly the four-car ring.
:::

::: checkpoint
A car park rule says: you may only enter the junction if you can see that your exit is already clear. Which Coffman condition does that break?
- ( ) Mutual exclusion
- (x) Hold and wait
- ( ) No preemption
- ( ) Circular wait
> You now acquire everything you need at once or nothing at all, so you never sit holding one resource while waiting for another. Requiring all resources upfront is the classic way to deny hold-and-wait.
:::

## Three Ways To Deal With It

::: cards
Prevention :: Structurally deny one of the four conditions so deadlock cannot arise. Requiring every process to request all its resources upfront denies hold-and-wait; enforcing one global lock-acquisition order denies circular wait.
Avoidance :: Allow requests as they come, but only grant one if the resulting state is still safe. This is what the Banker's Algorithm does - it simulates whether granting a request could ever lead to deadlock, before granting it.
Detection and recovery :: Let deadlock happen, notice it, then break it. Detection means looking for a cycle in the resource-allocation graph; recovery usually means killing or rolling back one of the trapped processes.
:::

::: behind
The resource-allocation graph is the formal tool detection actually uses. Processes and resources are nodes; an edge from a process to a resource means "waiting for"; an edge from a resource to a process means "held by". Where each resource type has exactly one instance, a deadlock exists precisely when that graph contains a cycle. With multiple interchangeable instances of a resource type, a cycle becomes necessary but no longer sufficient, and a more general algorithm is needed.
:::

::: didyouknow
Databases hit this constantly - two transactions each locking a row the other one wants. Rather than trying to prevent it, most database engines simply detect the cycle and abort one transaction with a "deadlock detected" error, expecting your application to retry. That is detection and recovery, running in production, thousands of times a day.
:::

::: reveal Deadlock or livelock - what's the difference?
In a deadlock, everything is stuck and nothing is happening. Every process sits blocked, waiting.

In a **livelock**, everything is happening and nothing is progressing. Processes keep responding to each other, changing state constantly, burning CPU - and getting nowhere.

Two people meeting in a narrow corridor: both step left, both step right, both step left again, politely and indefinitely. Nobody is blocked. Nobody gets through either.
:::`,
  },

  "virtual-memory": {
    concept: `## A Small Desk And A Huge Filing Cabinet

::: story
You have a desk that fits three open folders, and a filing cabinet holding four hundred of them.

This is not a problem, because you never need four hundred folders at once. You work with the two or three in front of you; when you need a fourth, you put one back and fetch it. Someone watching you work would conclude you had access to all four hundred - and they'd be right. Just not simultaneously.

The desk is your RAM. The cabinet is your disk. And the fetching happens without the program ever noticing.
:::

**Virtual memory** gives every process the illusion of its own large, contiguous address space - regardless of how much physical RAM is actually installed, and regardless of what every other process is doing.

That illusion buys two things at once:

::: cards
Capacity :: A program can run even if it's larger than physical RAM, because only the parts currently in use need to be resident.
Isolation :: Each process sees only its own address space, so one process cannot read or corrupt another's memory - even by accident.
:::

## How The Illusion Is Built

Virtual memory sits on top of paging. A process's virtual address space is divided into fixed-size **pages**; physical RAM is divided into same-sized **frames**. A **page table** records which frame currently holds each page.

The crucial part: not every page has to be in RAM. Pages that aren't being used can be swapped out to disk, and the page table simply records that they're not resident.

::: checkpoint
A process's page table says page 7 is not currently in RAM. The process reads an address on page 7 anyway. What happens?
- ( ) The process crashes with a memory error
- ( ) The read silently returns garbage
- (x) The CPU raises a page fault and the OS fetches the page from disk
- ( ) The OS kills the process to protect memory
> A page fault. It sounds like an error and isn't one - it's the completely normal mechanism by which virtual memory does its job.
:::

## What A Page Fault Actually Does

::: timeline Handling a page fault
CPU raises the fault :: The process is trying to touch a page that isn't resident. Execution is suspended mid-instruction.
OS takes over :: Control transfers to the kernel's page-fault handler, which works out which page is needed.
A frame is found :: If RAM is full, the OS evicts an existing page using a replacement policy - LRU, least recently used, being the classic choice.
The page is loaded :: The required page is read from disk into that frame. This is by far the slowest step.
Page table updated :: The entry for that page now points at its new frame and is marked resident.
Process resumes :: The interrupted instruction runs again, this time successfully. The program never knew.
:::

::: remember
A page fault is not a bug and not a crash. It's an expected, routine event that happens constantly on every machine you've ever used. The thing that *is* an error - an access to memory your process has no right to touch at all - is a different event entirely, and it's covered in the Segmentation lesson.
:::

::: behind
Two consequences of this design are worth carrying forward.

**Demand paging** is why an enormous application can start almost instantly: nothing is loaded until it is actually touched, and much of a large program is never touched in a given run.

**Thrashing** is the failure mode at the other extreme. Pack too many processes into too little RAM and the system spends more time swapping pages than doing work. The giveaway is counter-intuitive and worth recognising: CPU utilisation *drops* while disk activity goes through the roof. The machine looks busy and is achieving almost nothing.
:::`,
  },

  "threads": {
    concept: `## One Chef, Or Four?

::: story
Picture a single chef running an entire restaurant kitchen alone - taking orders, chopping vegetables, grilling, plating, washing up. One task at a time, in sequence. That's a single-threaded process.

Now the chef hires three sous-chefs. All four work in the *same* kitchen, sharing the *same* pantry, the *same* stove, the *same* fridge - but each is independently chopping, grilling or plating at the same time.

The shared kitchen is the process. Each chef working inside it is a thread.
:::

This is exactly why threads are called **lightweight processes**. Hiring another chef is far cheaper than opening a second restaurant, because the chef walks into an already-equipped kitchen instead of building one from scratch.

## What Each Thread Owns, And What They Share

A thread is the smallest unit of CPU execution inside a process.

::: cards
Shared across all threads :: The heap, global variables, and open file handles - the pantry and the stove. Every thread sees the same values, and a change by one is immediately visible to the others.
Private to each thread :: Its own stack, program counter, and register set - which is what lets a single thread be paused, scheduled and resumed independently of its siblings.
:::

Because threads share a memory space, switching between two of them is far cheaper than switching between two processes, which share nothing at all.

::: checkpoint
Two threads in the same process both increment the same shared counter, 1000 times each. What's the final value?
- ( ) Exactly 2000, always
- ( ) Exactly 1000, always
- (x) Often less than 2000, and unpredictably so
- ( ) Zero - threads can't share variables
> Often less. Both threads can read the same value before either writes back, and one increment overwrites the other. That shared pantry is a feature *and* a hazard - and fixing it is the entire subject of the next lesson.
:::

## Concurrency Is Not Parallelism

These two words get swapped freely and they are not the same thing.

::: analogy One stove or four
**Concurrency** is one chef juggling three dishes on one stove - starting the rice, turning to the curry while it simmers, coming back. Multiple tasks make progress by interleaving. Only one is ever actually being worked on at a given instant.

**Parallelism** is four chefs at four stoves. Four dishes genuinely progressing at the same literal moment.
:::

Multithreading gives you both, and which one you actually get depends on how many CPU cores are available. A single-core machine can run threads concurrently but can never run them in parallel.

::: remember
Concurrency is about structure - dealing with many things at once. Parallelism is about execution - doing many things at once. A single-core phone from 2008 was concurrent. It was never parallel.
:::

::: behind
Real operating systems distinguish **user-level threads** - managed entirely by a library in user space, invisible to the kernel, very fast to create and switch, but if one blocks on I/O the whole process can block - from **kernel-level threads**, which the OS schedules directly, so each can run on a different core, at the cost of more expensive creation and switching. Most production systems map user threads onto kernel threads one-to-one or many-to-many.

**Thread pools** exist to amortise creation cost: a fixed set of pre-created workers pulls tasks off a queue, so a server handling ten thousand short requests doesn't create ten thousand threads. This is what's happening under the hood in essentially every web server and job runner you'll ever deploy.
:::`,
  },

  "synchronization": {
    concept: `## The Last Egg

::: story
Back in the shared kitchen. Two chefs both need an egg, and there is exactly one left.

Chef A opens the fridge, sees one egg, and starts walking toward it.

At that same instant Chef B opens the fridge, sees the same one egg - because Chef A hasn't picked it up yet - and starts walking toward it too.

Both chefs now believe they have an egg. There was only ever one. Nothing was done incorrectly; the *timing* was simply unlucky.
:::

That is a **race condition**: the outcome depends entirely on the interleaving of two threads touching the same shared resource. Run it a thousand times and it might be fine nine hundred and ninety-nine of them, which is exactly what makes these bugs so unpleasant.

::: timeline How the egg gets lost
Chef A checks :: Sees eggs = 1. Decides to take it.
Chef B checks :: Also sees eggs = 1, because A hasn't written anything back yet. Also decides to take it.
Chef A takes it :: Writes eggs = 0. Correct so far.
Chef B takes it :: Writes eggs = 0 as well - based on the stale value it read in step two. One egg has served two chefs, and the count agrees with neither reality.
:::

## One Key To The Fridge

The fix real kitchens use: a single key. Whoever holds it can open the fridge; everyone else waits outside.

In OS terms that key is a **lock**, also called a **mutex** - short for mutual exclusion. Before touching shared data, a thread must acquire the lock; when it's done, it releases it and the next waiting thread gets in.

The stretch of code that touches the shared resource - the fridge itself - is the **critical section**. The entire goal of synchronization is that no two threads are ever inside the same critical section at the same time.

::: checkpoint
Three threads all want to run a critical section protected by one mutex. Thread 1 holds the lock. What are threads 2 and 3 doing?
- ( ) Running the critical section anyway
- (x) Waiting until thread 1 releases the lock
- ( ) Being terminated by the OS
- ( ) Running a copy of the shared data
> Waiting. That waiting is the entire point - it's what makes the outcome correct regardless of timing. It's also why holding a lock longer than necessary hurts everyone.
:::

## When One Key Isn't The Right Shape

Now imagine the restaurant has **four** identical stoves, and a box at the counter holding four tokens. Take a token before using a stove, return it when you're done. Four chefs can cook at once; a fifth waits for a token to come back.

That's a **semaphore**: a counter, rather than a single key.

::: cards
Mutex :: Exactly one thread through at a time. Binary - locked or unlocked - and owned by whichever thread took it.
Counting semaphore :: Up to N threads through at a time. No single owner; just a count of how many permits remain.
:::

A mutex is really just a semaphore whose count is one. The counting version is what you want when the thing you're protecting is a pool of interchangeable resources rather than a single one - four stoves, ten database connections, three worker slots.

::: mistake
It's tempting to read "race condition" as "rare, therefore not urgent". The opposite is true: a race that fires one time in ten thousand will pass every test you write and then fail in production under real load, at a scale where one-in-ten-thousand happens every few minutes. Rarity is what makes it dangerous, not what makes it safe.
:::

::: behind
Real systems build higher-level tools on top of these primitives.

A **monitor** is a lock plus condition variables, letting a thread wait until some condition becomes true and then be woken. Java's \`synchronized\` combined with \`wait()\` and \`notify()\` is a monitor.

A **reader-writer lock** allows many simultaneous readers but only one exclusive writer - the right tool when reads vastly outnumber writes, as in a cache.

The **Dining Philosophers** problem is the classic exercise for all of this: five philosophers, five shared forks, and no way to eat without coordinating. It's worth working through on paper once, because it forces every idea in this lesson to interact at the same time.
:::`,
  },

  "memory-management": {
    concept: `## The Shared Warehouse Shelf

::: story
Think of physical RAM as one long shelf in a shared warehouse. Every running process is a customer who needs a stretch of that shelf for their boxes.

The warehouse manager has two hard jobs. Give every customer enough space for what they actually need. And make absolutely certain that no customer can ever peer into, move, or damage another customer's boxes.

Get the first wrong and programs run out of room unnecessarily. Get the second wrong and one buggy program quietly corrupts another one's data.
:::

That manager is the OS's memory manager, and its work divides into three responsibilities:

::: cards
Allocation :: Deciding where a process's memory goes, and reserving it.
Protection :: Guaranteeing one process's memory is invisible and untouchable to every other one. Enforced in hardware by the CPU's Memory Management Unit, not by OS policy alone.
Reclamation :: Taking memory back when a process ends, so it can be handed out again.
:::

::: didyouknow
Protection being a hardware guarantee - the MMU, not the kernel, refusing the access - is exactly why one program crashing on a bad memory access doesn't corrupt its neighbours. The check happens on every single access, in silicon, far too often for software to do it.
:::

## Two Kinds Of Wasted Space

The simplest allocation scheme gives each process one unbroken block of shelf. Easy to manage - and it degrades badly over time.

::: cards
External fragmentation :: Processes come and go, leaving small unusable gaps *between* allocated blocks. Like a bookshelf with single-book gaps scattered along it: plenty of total free space, none of it big enough for the book you're holding.
Internal fragmentation :: Give a process a fixed-size chunk slightly larger than it needs and the leftover space *inside* that chunk is wasted - allocated to someone, usable by nobody.
:::

Contiguous allocation suffers external fragmentation. Splitting a process's memory into scattered fixed-size chunks - which is what paging does, next lesson - eliminates that entirely, and introduces internal fragmentation instead.

::: checkpoint
You have 900MB of RAM free, spread across gaps of 100MB, 300MB, 200MB and 300MB. A process asks for one contiguous 500MB block. What happens?
- ( ) It succeeds - 900MB is free
- (x) It fails, despite 900MB being free
- ( ) The OS automatically merges the gaps instantly
- ( ) The process is given 300MB
> It fails. The total is sufficient and the shape is wrong. This is external fragmentation, and it's why "not enough memory" messages sometimes look absurd next to your free-memory figure.
:::

::: reveal If the gaps are the problem, why not just push everything together?
You can. It's called **compaction**: shift every allocated block to one end so all the free gaps merge into one large usable region.

The reason it isn't the default is cost. Every affected process has to be paused, all its data physically copied, and every memory reference it holds rewritten to match its new location. On a machine with gigabytes in play, that's an eternity.

Which is why most real systems dodge the problem instead of solving it, abandoning contiguous allocation altogether in favour of paging - accepting a small, bounded amount of internal fragmentation in exchange for never having to compact anything.
:::`,
  },

  "paging": {
    concept: `## Lockers, Not Shelves

::: story
A library could give every reader one continuous run of shelf space - and would then face the awkward scattered gaps of the last lesson's warehouse.

Instead it uses identical small lockers spread throughout the building. Locker 4 might be three floors away from locker 191. The library keeps a master directory: *Reader X's box 1 is in locker 4, box 2 is in locker 191.*

Reader X never notices, and never needs to. Their things are not together, and everything works.
:::

That is paging. A process's virtual address space is split into fixed-size **pages** - 4KB is the usual size. Physical RAM is split into identically sized **frames**. Each process gets a **page table**: the master directory mapping each of its pages to whichever frame currently holds it.

Because any page can live in any free frame, a process's memory never needs to be one contiguous block. External fragmentation disappears completely - there is no such thing as an awkwardly-shaped gap when every free frame is interchangeable.

::: flow Translating one address
Virtual address :: split into a page number and an offset
Page table lookup :: page number gives the frame number
Physical address :: frame number recombined with the same offset
:::

The offset never changes during translation. Only the block it sits inside gets relocated.

::: checkpoint
Page size is 4KB. A process needs 10,500 bytes. How many pages, and how much space is wasted in the last one?
- ( ) 2 pages, 0 bytes wasted
- ( ) 3 pages, 500 bytes wasted
- (x) 3 pages, 1,788 bytes wasted
- ( ) 4 pages, 1,788 bytes wasted
> Three pages: 4096 + 4096 = 8192 covers the first two, leaving 2,308 bytes on a third full 4096-byte page. 4096 − 2308 = 1,788 bytes allocated and unusable. That's internal fragmentation, and it's bounded - never more than one page per process.
:::

## The Price Of The Directory

::: mistake
Internal fragmentation can't be compacted away the way external fragmentation can - the waste is *inside* a page that belongs to someone. The only lever is a smaller page size, and that lever has a cost of its own: more, smaller pages means a larger page table with more entries to store and walk.
:::

::: behind
Two hardware realities make paging practical at real scale.

A **multi-level page table** exists because one flat table for a 64-bit address space would itself be far too large to keep per process. Real systems use a hierarchy - a directory pointing to tables pointing to frames - and only allocate the inner tables for address ranges a process actually uses.

The **Translation Lookaside Buffer** is a small, extremely fast cache of recent translations sitting right beside the CPU core. It exists because a page-table lookup happens on *every single memory access*, and walking the hierarchy every time would be ruinous. A TLB hit skips the walk entirely; TLB miss rates are among the most obsessively optimised numbers in both OS and CPU design.
:::

::: didyouknow
Every general-purpose operating system you're likely to touch - Linux, Windows, macOS, Android, iOS - uses paging as the foundation of its memory management. Of everything in this subject, this is the single most universally deployed idea.
:::`,
  },

  "segmentation": {
    concept: `## Chapters, Not Fixed-Length Sections

::: story
Cutting a book into exactly fifty-page sections works, and it is completely indifferent to the book. A section might start halfway through one chapter and end halfway through another.

Dividing the same book into its actual chapters gives you pieces of wildly different lengths - but each piece *means* something. You can hand someone chapter 4. You cannot meaningfully hand them "pages 150 to 200".
:::

Paging is the fifty-page cut: equal-sized, meaning-blind. **Segmentation** is the chapter cut. It divides a process's memory by what that memory actually *is* - one segment for code, one for global data, one for the stack, one for the heap - each sized exactly to what it logically needs.

::: cards A process's segments
Code :: The instructions themselves. Naturally read-only, and shareable between multiple running instances of the same program.
Data :: Global and static variables.
Stack :: Function calls, local variables, return addresses. Grows and shrinks as calls nest.
Heap :: Dynamically allocated memory - whatever the program asks for at runtime.
:::

## Base, Limit, And Where "Segfault" Comes From

Each segment carries a **base** - where it starts in physical memory - and a **limit** - how big it is. A memory reference is really a pair: a segment number, and an offset within that segment. Hardware checks every access to confirm the offset never exceeds that segment's limit.

::: remember
That limit check is exactly where the famous **segmentation fault** comes from. It isn't a generic crash. It's the hardware catching a program reading an offset outside its segment's declared bounds - asking for page 300 of a chapter that has 50 - and refusing, rather than letting the program wander into memory that isn't its own.
:::

::: checkpoint
A C program declares \`int arr[5]\` and then writes to \`arr[100]\`. Why does this so often end in a segmentation fault?
- ( ) Because arrays cannot be larger than 5 in C
- (x) Because the offset for element 100 can fall outside what's actually mapped and valid for this process
- ( ) Because the compiler forbids it
- ( ) Because the OS is out of memory
> The offset lands beyond the valid bounds, and the hardware refuses the access. Notice C's compiler happily allows the code - the check is a runtime hardware one, not a compile-time one.
:::

## Why Both Schemes Still Exist

Segmentation's advantage is that it matches how programmers actually think. Logical units make protection and sharing natural: mark the code segment read-only, share one copy of it across every running instance of the program.

Its disadvantage is the one contiguous allocation already had. Segments vary in size and each needs a contiguous physical block, so external fragmentation is back.

::: cards Side by side
Paging :: Fixed size. Meaning-blind. No external fragmentation, bounded internal fragmentation.
Segmentation :: Variable size. Logically meaningful. External fragmentation returns, no internal fragmentation.
:::

::: behind
Which is why real systems rarely pick one. **Segmented paging** divides a process into logical segments as above, then pages each segment internally rather than demanding a contiguous block for it - keeping segmentation's clarity and protection while inheriting paging's freedom from external fragmentation. That hybrid is much closer to what modern virtual memory actually implements than either scheme taught alone.
:::`,
  },

  "file-systems": {
    concept: `## An Empty Warehouse Floor

::: story
A hard disk, by itself, is an enormous undifferentiated sequence of storage blocks. There is no such thing as a file on it, and no such thing as a folder. Those concepts do not exist at that level.

It's a giant warehouse floor with no shelving, no aisles and no labels. Everything you own could be on that floor, and you would never find any of it again.
:::

A **file system** is the organising scheme layered on top. It groups raw blocks into named **files**, arranges those files into a hierarchy of **directories**, and tracks exactly which blocks belong to which file so nothing is lost or overwritten by accident.

::: flow
Folder -> Sub-folder -> File -> Disk blocks
:::

## The Metadata Problem

A file is more than its contents. Something has to record its size, its permissions, its owner, its timestamps - and critically, *which physical blocks hold its data*.

Most file systems keep all of that in a structure called an **inode**, one per file.

::: cards What an inode holds
Size :: How many bytes the file contains.
Permissions and owner :: Who may read, write or execute it.
Timestamps :: Created, last modified, last accessed.
Block pointers :: Where the file's actual data physically lives on disk.
Not the filename :: The name lives in the directory entry that points *at* this inode - which turns out to matter enormously.
:::

::: checkpoint
You rename a 40GB video file. Why is it instant?
- ( ) The OS copies it in the background after returning
- (x) Only the directory entry changes - the inode and every data block stay exactly where they are
- ( ) Because renaming is queued and happens later
- ( ) Because 40GB is small for modern disks
> The name was never stored inside the file. Renaming rewrites one small directory entry pointing at the same unchanged inode. Not a single byte of video moves.
:::

## A Directory Is Just A File

Seen this way, a directory is nothing special: it is itself a file, whose contents happen to be a list of *name to inode number* pairs.

That's why a folder holding ten thousand files isn't itself enormous. It stores none of their data - only the mapping.

::: didyouknow
Deleting a file usually doesn't erase anything. It removes the directory entry and marks the inode's blocks free for reuse. The actual bytes sit there untouched until something else claims those blocks - which is precisely why file-recovery tools work at all, and why "deleted" is not the same word as "gone" when you're disposing of a hard drive.
:::

::: behind
Two mechanisms built directly on this design are worth knowing.

**Journaling** file systems - ext4, NTFS - write intended metadata changes to a log before committing them, so a crash mid-write can be replayed or rolled back on reboot instead of leaving the file system inconsistent. It's the main reason modern machines survive sudden power loss so much better than older ones.

**Hard links** are multiple directory entries pointing at the same inode - each one genuinely *is* the file, under a different name. A **symbolic link** is instead a small separate file storing a path to another file. Delete the original and the symlink breaks while a hard link carries on, which follows directly from what each one actually points at.
:::`,
  },

  "disk-scheduling": {
    concept: `## The Zig-Zagging Elevator

::: story
An elevator in a tall building answers requests in the exact order they were pressed: floor 9, then floor 1, then floor 8, then floor 2.

It works. It also spends its life crossing the building repeatedly, and everyone waits far longer than they needed to.

A well-designed elevator sweeps in one direction instead, collecting everyone along the way, then reverses.
:::

A traditional spinning hard disk has exactly this problem. Its read/write head physically has to travel across the platter to reach different data, and that movement - **seek time** - is by far the slowest part of any disk operation. Ordering requests well is therefore the difference between a fast disk and a slow one.

## Four Ways To Order The Queue

::: cards
FCFS :: Serve requests in arrival order. Simple, and exactly the zig-zagging elevator - large amounts of avoidable head travel.
SSTF - Shortest Seek Time First :: Always serve whichever pending request is physically closest to the head. Much better average seek time; a request far from the current hot zone can be starved indefinitely while nearer ones keep arriving.
SCAN :: Sweep the head in one direction serving everything on the way, hit the end, reverse. Predictable and starvation-free. This is literally called the elevator algorithm.
C-SCAN :: Like SCAN, but instead of reversing at the end it jumps back to the start and sweeps the same way again - giving more uniform waiting times across the whole disk rather than favouring the middle.
:::

::: checkpoint
The head is at track 50. Requests are pending at tracks 10, 22, 60, 75 and 90, and new requests near track 55 keep arriving. Under SSTF, what happens to the request at track 10?
- ( ) It's served first, being the oldest
- (x) It can wait indefinitely while closer requests keep being served
- ( ) It's served after exactly one sweep
- ( ) It's cancelled by the OS
> Starvation. SSTF optimises the average and offers no fairness guarantee at all - which is precisely the trade-off SCAN was designed to fix.
:::

::: didyouknow
SCAN's nickname isn't an analogy someone invented later for teaching. The algorithm was named the elevator algorithm because it is, in the most literal sense, the algorithm elevators use.
:::

## Why This Topic Is Quietly Becoming History

On an SSD there is no head and nothing to move. Any location can be reached in roughly the same time, much like RAM. Seek-time-driven scheduling is therefore largely a legacy-hardware concern today.

::: remember
The algorithms are ageing; the reasoning is not. Average performance versus fairness versus starvation is the same tension you already met in CPU scheduling and will meet again in any queue anywhere. That's the transferable part - and it's the part interviewers are usually checking for when they ask why SSDs changed things.
:::

::: behind
**LOOK** and **C-LOOK** refine SCAN and C-SCAN in an obvious-once-said way: rather than sweeping all the way to the physical end of the disk, the head only travels as far as the last actual pending request in that direction before reversing or jumping back - never wasting movement across empty space.

Production schedulers layer more on top of raw seek minimisation. Linux's historical CFQ, and today's deadline and BFQ schedulers, add guarantees that no request waits indefinitely and prioritise latency-sensitive I/O over bulk throughput.
:::`,
  },

  "system-calls": {
    concept: `## Ask At The Front Desk

::: story
A hotel guest wants something only staff are permitted to do - unlock a different room, open the safe, use the master keycard in the lift.

The guest cannot simply walk behind the front desk and do it. They make a formal request. The desk verifies they're allowed, performs the privileged action on their behalf, and hands control back.

The guest never touches the master key. They also get what they needed.
:::

That formal request is a **system call**.

Your code runs in **user mode**: a restricted CPU mode that deliberately cannot reach hardware or another process's memory, precisely so one misbehaving program can't damage the machine. Anything privileged - opening a file, allocating memory, creating a process, sending a packet - must be requested from the kernel.

::: timeline What actually happens
Your program calls it :: A system call is invoked, e.g. asking to open a file.
A trap fires :: A deliberate, controlled software interrupt switches the CPU into kernel mode. This is the boundary crossing.
Kernel entry point :: Control lands at a fixed handler, which looks up the requested operation by its system call number in the system call table.
The kernel does the work :: With full privileges - and with permission checks enforced along the way.
Back to user mode :: Your program's context is restored, the result is returned, and your next line runs.
:::

::: mistake
It's easy to assume any function that does something external *is* a system call. Usually it's a library function that makes one or more real system calls underneath - \`printf\` eventually calls \`write\`. And the mode distinction isn't about which *program* is running; it's about which privilege level the CPU is in right now. The same program crosses that line constantly.
:::

## The Families Of System Calls

::: cards
Process control :: \`fork\`, \`exec\`, \`exit\` - creating, replacing and ending processes.
File management :: \`open\`, \`read\`, \`write\`, \`close\` - everything to do with files.
Device management :: Requesting and releasing access to a device.
Information maintenance :: Asking the system for the time, a process ID, and similar.
:::

::: checkpoint
Your program prints one line of text to the screen. How many privilege-level crossings does that involve, at minimum?
- ( ) Zero - printing is a user-mode operation
- (x) At least one - the text has to be handed to the kernel to reach the terminal
- ( ) Exactly two, always
- ( ) None, unless the program is running as root
> At least one. Every single thing your program does that touches the world outside its own memory goes through this boundary somewhere beneath the library call you actually wrote.
:::

::: didyouknow
On Linux you can watch this happen. \`strace ./yourprogram\` prints every system call a running program makes, in order, live. Running it once on a program you wrote yourself is genuinely clarifying - a "hello world" makes far more calls than you'd guess.
:::

::: behind
A system call is a fundamentally different mechanism from a function call, not just a slower one. A function call never changes privilege level; it jumps within the same address space and the same mode. A system call switches CPU privilege, enters through a fixed kernel gate, is dispatched by number through a table, and restores your context on the way out. That's why it costs meaningfully more - and why high-performance code works hard to make fewer, larger calls rather than many small ones.
:::`,
  },

  "linux-basics": {
    concept: `## The Same Folders, Typed Instead Of Clicked

::: story
If you've only ever navigated with a mouse, a Linux terminal looks like the controls of a spacecraft with the labels removed.

Then you notice that \`cd Documents\` is double-clicking the Documents folder. \`ls\` is looking at what's in the window you just opened. \`rm file.txt\` is dragging a file to the trash.

It isn't another universe. It's the same filesystem, described in words instead of icons.
:::

::: cards The commands worth knowing cold
pwd :: Print working directory - "which folder am I looking at?"
ls :: List what's in it. \`ls -l\` adds permissions, owner, size and date.
cd :: Change directory - walk into a folder, or \`cd ..\` to step back out.
mkdir :: Make a new folder.
cp / mv :: Copy, and move-or-rename.
rm :: Remove. There is no recycle bin here.
:::

## Who Is Allowed To Do What

Every file and directory has an **owner**, a **group**, and permissions for three separate audiences: the owner, the group, and everyone else. Each audience independently gets read (**r**), write (**w**) and execute (**x**).

You'll see it written as a string like \`rwxr-xr--\`, which reads in three blocks of three:

::: cards Reading rwxr-xr--
rwx - owner :: Can read, write and execute.
r-x - group :: Can read and execute. Cannot modify.
r-- - others :: Can only read.
:::

This exists for the reason you'd guess: to stop one user on a shared machine from reading or modifying another's files.

::: checkpoint
A file is \`-rw-r--r--\`, owned by alice, group students. Bob is not alice and is not in students. What can Bob do?
- ( ) Read and write it
- (x) Read it only
- ( ) Nothing at all
- ( ) Execute it
> Bob falls in "others", which has \`r--\`. Read, and nothing more.
:::

::: mistake
The most expensive habit in this whole lesson is reaching for \`sudo\` whenever a permission is denied, to make the error go away. A denied permission is information. Prefixing it with \`sudo\` doesn't answer the question of *why* the system said no - and root can delete things that are not supposed to be deletable.
:::

## The Idea Linux Made Famous

**Piping** feeds the output of one command straight into the input of the next, so small focused tools chain into something none of them could do alone.

::: flow
cat access.log -> grep ERROR -> wc -l
:::

Read the file, keep only the lines containing ERROR, count what's left. Three tiny single-purpose tools and one pipe.

::: analogy An assembly line
Each station does one simple job extremely well. The belt between them carries the work along. Nobody station knows or cares what the others do - which is exactly why you can reorder them, swap one out, or add a new one, and the line still works.
:::

::: behind
Beyond the rwx model, Linux also supports **access control lists** for cases the owner/group/other model can't express - granting one specific extra user read access without touching the group.

And the shell itself is a full programming language: variables, loops, conditionals. That's why so much real infrastructure - CI pipelines, deployment scripts, cron jobs - is written as shell scripts rather than in a general-purpose language. It's the natural glue for chaining exactly the kind of small tools above.
:::`,
  },

  "os-interview-questions": {
    concept: `## Same Material, Different Pressure

::: story
You know all of this now. You've read every lesson in this subject.

Then someone across a table says "so, what's a deadlock?" - and you have about four seconds before the silence becomes the answer.

Knowing something and being able to say it out loud, in order, under attention, are two different skills. This lesson trains the second one. There's no new material here; it's a rehearsal.
:::

## The Shape Of A Strong Answer

Almost every good answer in an OS round has the same three-part structure, whatever the question.

::: timeline Answer structure
Define it precisely :: One sentence. No hedging, no "basically".
Give a concrete example :: An example or an analogy that shows you can apply it, not just recite it.
Name the trade-off :: Why it matters, or what it costs. This is the part that separates understanding from memorisation.
:::

::: reveal What that sounds like for "what is a deadlock?"
"A deadlock is when a set of processes are each waiting for a resource held by another process in the same set, so none of them can ever proceed.

Four cars entering a four-way junction at once, each blocked by the car to its right, is the everyday version.

It needs all four Coffman conditions to hold at the same time - so breaking any one of them prevents it. Enforcing a single global lock-acquisition order, for instance, denies circular wait, which is why it's such a common rule in real codebases."

Definition, example, trade-off. Around twenty seconds. Nothing memorised word-for-word - just the three slots, filled.
:::

## The Five To Over-Prepare

If your remaining time is limited, these come up almost everywhere regardless of the company.

::: cards
Process vs thread :: Separate memory versus shared memory; expensive versus cheap to create; a crashing process spares its neighbours, a crashing thread can take its whole process down.
The four Coffman conditions :: Mutual exclusion, hold and wait, no preemption, circular wait - and which strategy denies which.
Paging vs segmentation :: Fixed and meaning-blind versus variable and logical; internal versus external fragmentation.
The process state diagram :: All five states, and every legal transition between them - including Running back to Ready.
Preemptive vs non-preemptive scheduling :: Whether the OS can take the CPU away mid-execution, and what that buys or costs.
:::

::: checkpoint
An interviewer asks about deadlock, you answer well, and they immediately ask "how would virtual memory make this better or worse?" What's happening?
- ( ) They didn't believe your first answer
- (x) A cross-topic synthesis question - they're testing whether you can connect ideas, not just recall them
- ( ) They've moved on to a new unrelated topic
- ( ) They're running out of questions
> Chained follow-ups across topics are the norm, not a bad sign. Usually it means the first answer landed and they're probing for depth.
:::

::: mistake
Two failure modes cost far more marks than not knowing something.

Reciting a definition you can't explain - the follow-up "why?" exposes it instantly.

And freezing. Saying "let me think through the Coffman conditions here" while you work is dramatically better than silence. A partial, well-reasoned answer out loud beats a perfect answer you didn't finish reaching.
:::

::: interview
Practise out loud, not silently. The words that arrive under pressure are different from the words that feel obvious on a re-read, and you only find that out by hearing yourself try.
:::`,
  },

  "mock-test": {
    concept: `## A Diagnostic, Not A Formality

::: story
There's a specific and very common way to fail an exam you were ready for: you re-read everything, it all felt familiar, and familiarity felt like knowledge.

Recognising a correct answer and producing one are different skills. This test exists to tell you which of the two you currently have - while it's still cheap to find out.
:::

The quiz below spans every module in this subject: processes and threads, scheduling, synchronization, deadlocks, memory management, paging and segmentation, file systems, disk scheduling, system calls, and Linux basics.

::: remember
Attempt it closed-book. No scrolling back to earlier lessons, no looking anything up mid-question. The moment you check an answer while answering, the result stops measuring anything useful.
:::

## How To Use What It Tells You

::: timeline After you finish
Score it honestly :: Including the ones you guessed correctly - a lucky guess is a gap, not a point.
Sort wrong answers by topic :: Two misses in memory management is a signal. One miss each across six topics is a different signal entirely.
Re-study, don't re-read :: Go back to the actual lesson for each gap. Re-reading the explanation attached to this test is the weakest possible version of that.
Come back and retake it :: Later, cold. A score that holds up a week later is the only one worth trusting.
:::

::: remember
A wrong answer here is more valuable than a right one. The right ones tell you nothing you didn't already believe; the wrong ones are a map of exactly where your remaining preparation time should go.
:::

::: interview
Time yourself. Real interview and exam pressure is as much about pace as recall, and the only way to calibrate how long you actually take is to measure it once under conditions you didn't enjoy.
:::

::: behind
Real interviews rarely stop at recall-level questions like these. Expect at least one design-flavoured follow-up that combines several topics at once - "design a simple thread pool, and tell me what happens when a new task arrives while every worker is busy" reaches into threads, synchronization, scheduling and queueing in a single question.

Once this test feels easy, the next step isn't another test. It's explaining your answers out loud to another person, which is a measurably different skill from knowing them.
:::`,
  },
};
