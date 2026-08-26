// GATE Operating System - authored lesson content. Follows the authoring
// rules documented at the top of general-aptitude.mjs.
//
// status is intentionally absent: scripts/write-gate-lessons.mjs excludes it from
// CONTENT_FIELDS, because publication state belongs to the syllabus seeder, not to
// a lesson body.

export const OPERATING_SYSTEM = {

  // ---------------- Processes and Threads ----------------

  "system-calls": {
    difficulty: "Easy",
    estimatedMinutes: 30,
    xpReward: 25, coinReward: 10,
    // Verified real (title confirmed via direct fetch, 2026-08-13).
    resources: [{
      kind: "video",
      title: "System Calls - Neso Academy",
      url: "https://www.youtube.com/watch?v=lhToWeuWWfw",
      description: "Whole video covers this topic from the start.",
    }],
    whatYoullLearn: [
      "What a system call actually is, and why your program cannot touch hardware directly",
      "The user mode / kernel mode switch that happens underneath every system call",
      "The five broad categories of system calls, with real POSIX examples",
    ],
    prerequisites: [],
    concept: `## A Locked Door Between Your Code And The Machine

::: story
Your program wants to write a line to a file. It cannot just reach out and move the disk head itself - if every program could do that, two programs writing at once would wreck each other's data, and a buggy program could overwrite the OS itself.

So there is a locked door. On one side is your program, running with restricted privileges. On the other side is the kernel, the only piece of software allowed to touch hardware directly. A **system call** is you knocking on that door and asking the kernel to do the operation for you.
:::

::: remember
A system call is a **request to the operating system kernel** for a service user code is not permitted to perform itself - reading a file, allocating memory, creating a process, sending data over a socket. The kernel checks the request, does it safely, and hands control back.
:::

## Two Modes, One Trap Instruction

::: cards Where the switch happens
User mode :: Where your program's ordinary code runs. Hardware access, most instructions that touch devices, and privileged CPU state are off-limits.
Kernel mode :: Where the OS runs. Full access to hardware, memory management, everything.
The trap :: A system call executes a special trap/software-interrupt instruction. The CPU switches to kernel mode, jumps to a fixed kernel entry point, runs the requested service, then switches back to user mode and resumes your program.
:::

::: mistake
A library function is not automatically a system call. \`printf\` usually buffers your text in user space and only calls \`write()\` - the actual system call - once the buffer fills or you flush it. Confusing the two is why "how many system calls did this program make" trips people up.
:::

::: checkpoint
Why can't a user program directly modify the page table that maps its own virtual memory?
- ( ) It is too slow to do from user mode
- (x) Modifying it directly could corrupt another process's memory or crash the machine, so only the kernel is trusted with it
- ( ) The page table does not exist until a system call creates it
- ( ) User programs do not use virtual memory
> The kernel is the only code trusted to touch structures that affect every process on the machine. That trust boundary is the entire reason system calls exist.
:::

## The Five Categories Worth Knowing By Name

::: cards What GATE actually asks about
Process control :: fork, exec, exit, wait - creating, replacing, and ending processes.
File management :: open, read, write, close, lseek - everything about files and their contents.
Device management :: ioctl, read/write on a device file - talking to hardware through a uniform interface.
Information maintenance :: getpid, alarm, sleep - asking the OS for facts about the system or the calling process.
Communication :: pipe, shmget, socket - moving data between processes, covered properly in Inter-Process Communication.
:::

::: tip
When a GATE question describes a scenario and asks "which category does this system call belong to", match the *effect*, not the function name you might not have memorised. Creating a process is process control regardless of which specific call is used.
:::`,
    codeExample: {
      language: "c",
      code: `#include <unistd.h>
#include <stdio.h>

int main(void) {
    /* write() is a genuine system call: it crosses into the kernel */
    write(1, "before\\n", 7);

    /* getpid() is also a system call: only the kernel knows this process's id */
    printf("pid = %d\\n", getpid());

    /* printf usually buffers in user space - it may not trap immediately */
    printf("after");   /* no trailing newline: may sit in the buffer */

    return 0;           /* exit() is a system call too - it tears down the process */
}`,
      expectedOutput: `before
pid = 1234
after`,
    },
    workedExamples: [
      {
        title: "Tracing one read() call",
        problem: "A C program calls read(fd, buffer, 100) to read 100 bytes from a file. Describe, step by step, everything that happens between the call and the program resuming.",
        solution: `1. Your code calls the C library's read() wrapper, still running in user mode.
2. The wrapper loads the system call number for "read" into a fixed register and executes a trap instruction.
3. The CPU switches to kernel mode and jumps to the kernel's system call handler.
4. The kernel validates the arguments (is fd open? is the buffer address valid?), then performs the actual disk/file read.
5. The kernel copies the data into the user-space buffer you provided.
6. The kernel sets a return value (bytes read, or -1 on error) and executes a return-from-trap instruction.
7. The CPU switches back to user mode, and your program resumes right after the read() call, now with data in its buffer.

The two mode switches (step 3 and step 7) are the fixed cost every system call pays, independent of how much work it does - which is exactly why batching I/O into fewer, larger reads is faster than many tiny ones.`,
      },
    ],
    analogies: [
      "A system call is like a hotel guest calling the front desk instead of walking into the boiler room themselves - the front desk (kernel) is the only one trusted with the master key.",
    ],
    commonMistakes: [
      "Treating every library function as a system call. Many, like strlen() or most of printf's work, do no kernel crossing at all.",
      "Assuming system calls are free. Each one pays for two mode switches plus register save/restore, which is why frequent tiny I/O calls are slow.",
      "Thinking a system call always blocks the calling process. Many system calls have non-blocking variants (e.g. non-blocking read on a socket).",
      "Confusing a system call with an interrupt. An interrupt is triggered by hardware or a trap instruction; a system call is one specific, deliberate use of a trap by user code.",
    ],
    memoryTricks: [
      "PFDIC for the five categories: Process control, File management, Device management, Information maintenance, Communication.",
      "Trap = a self-inflicted interrupt. User code deliberately causes it to ask for kernel help.",
    ],
    formulas: [
      "Fixed cost per system call ≈ 2 mode switches (user→kernel, kernel→user) + register save/restore, independent of the work requested.",
      "Effective I/O cost ≈ (number of system calls) × (per-call overhead) + total data-transfer time - which is why fewer, larger calls beat many small ones.",
    ],
    shortcuts: [
      "If a question describes an action a normal user program cannot safely do alone (touch a disk, create a process, talk to a device), it is a system call by definition - no need to recall the exact function name.",
      "When comparing library call vs system call in an option, ask: does this need kernel privilege? If not, it's a library function even if it looks similar.",
    ],
    pyqRelevance: `System calls appear as short conceptual 1-mark questions: matching a described action to its category (process control / file / device / information / communication), or asking what happens during the user-to-kernel mode switch.

They also show up indirectly inside process/fork questions, where knowing that fork() and exec() are system calls (not library conveniences) is assumed background.

Rarely a numerical, since there is nothing to compute - budget this topic for quick, confident recall rather than practice problems.`,
    interviewConnection: `"What happens when you call read() on a file descriptor" is a frequent interview question precisely because the answer (trap, mode switch, kernel service, mode switch back) tests whether you understand what's actually underneath the abstraction you use every day.

Understanding system call overhead is also why buffered I/O, batching, and vectored I/O calls (readv/writev) exist - a detail that separates "I called a function" from "I understand what it costs".`,
    revisionSummary: `A system call is a request to the kernel for a service user code cannot perform itself. It works via a trap instruction that switches the CPU from user mode to kernel mode, runs the service, and switches back.

Five categories: process control, file management, device management, information maintenance, communication.

A library function is not automatically a system call - it may only call one occasionally (or never). Every system call pays a fixed mode-switch cost regardless of how much work it does, which is why batching I/O calls is faster than making many small ones.`,
    shortNotes: {
      fiveMinute: "System call = request to kernel for a privileged service. Trap instruction switches user mode -> kernel mode -> user mode. Five categories: process control, file management, device management, information maintenance, communication. Library calls (printf) are not always system calls - they may batch several into one (write). Fixed cost per call = 2 mode switches, so fewer/larger calls beat many small ones.",
      oneMinute: "System call = kernel request via trap, switching user mode -> kernel -> user mode. Categories: process control, file mgmt, device mgmt, info maintenance, communication. Library call != system call.",
      nightBefore: "Trap -> kernel mode -> service -> back to user mode. 5 categories (PFDIC). fork/exec/exit are system calls.",
    },
    keyPoints: [
      "A system call is a controlled request to the kernel for a privileged service user code cannot perform directly.",
      "The mode switch happens via a trap instruction: user mode -> kernel mode -> service -> back to user mode.",
      "Five categories: process control, file management, device management, information maintenance, communication.",
      "A library function is not automatically a system call - printf may buffer and call write() only occasionally.",
      "Every system call has a fixed overhead (mode switches + register save/restore) regardless of the work done.",
    ],
    mcqs: [
      {
        question: "What CPU privilege change occurs when a user program makes a system call?",
        options: [
          "No change - system calls run entirely in user mode",
          "The CPU switches from user mode to kernel mode for the duration of the call, then switches back",
          "The CPU permanently switches to kernel mode",
          "The CPU switches to a third, intermediate mode reserved for I/O",
        ],
        correctIndex: 1,
        explanation: "A trap instruction switches the CPU to kernel mode so the OS can perform the privileged operation, then a return-from-trap switches it back to user mode so the calling program resumes.",
      },
      {
        question: "Which of these is a process-control system call?",
        options: ["read", "fork", "ioctl", "getpid"],
        correctIndex: 1,
        explanation: "fork() creates a new process, which is the defining example of process control. read is file management, ioctl is device management, getpid is information maintenance.",
      },
      {
        question: "Why is printf() not guaranteed to trigger a system call every time it is used?",
        options: [
          "printf never uses a system call",
          "printf typically buffers output in user space and only calls the write() system call when the buffer is flushed or full",
          "printf runs entirely in kernel mode",
          "printf is itself a system call, so it always triggers exactly one trap",
        ],
        correctIndex: 1,
        explanation: "Standard I/O libraries buffer output to reduce the number of expensive system calls; the underlying write() system call only fires when the buffer is flushed, is full, or the program exits.",
      },
    ],
  },

  "processes": {
    difficulty: "Moderate",
    estimatedMinutes: 35,
    xpReward: 25, coinReward: 10,
    // Verified real (title confirmed via direct fetch, 2026-08-13).
    resources: [{
      kind: "video",
      title: "Process State - Neso Academy",
      url: "https://www.youtube.com/watch?v=jZ_6PXoaoxo",
      description: "Whole video covers this topic from the start.",
    }],
    whatYoullLearn: [
      "What a process actually is, and everything the OS tracks in its PCB",
      "The process state diagram, and what each transition really means",
      "fork() and the parent/child relationship it creates",
      "The core scheduling-adjacent timings every process carries: arrival, burst, completion, turnaround, waiting",
    ],
    prerequisites: ["System Calls"],
    concept: `## A Program Is A Recipe. A Process Is The Meal Being Cooked.

::: story
A program on disk is inert - a file full of instructions, going nowhere on its own. The moment you run it, the OS creates a **process**: that program, plus its own private memory, its own set of open files, its own register values, its own place in line for the CPU.

Run the same program twice and you get two processes. Same recipe, two separate meals, cooked independently, and one boiling over does not affect the other.
:::

::: remember
A process is a program **in execution**, along with everything the OS needs to run it and keep it separate from every other process: its address space, open file table, and current CPU register state (saved when it's not actually running).
:::

## Everything The OS Remembers About You: The PCB

::: cards Fields inside the Process Control Block
Process ID (PID) :: A unique identifier the OS and other processes use to refer to it.
Process state :: New, ready, running, waiting, or terminated - see below.
Program counter and registers :: Saved exactly as they were when the process last stopped running, so it can resume perfectly.
Memory management info :: Base/limit registers or page tables - what memory this process is allowed to touch.
Open file list, I/O status :: Which files and devices it currently has open.
Scheduling info :: Priority, CPU burst history, pointers to its place in the ready queue.
:::

::: mistake
The PCB is switched on every **context switch**, not just when a process ends. Every time the CPU moves from running process A to running process B, A's entire PCB is saved and B's is loaded - and that save/restore work is pure overhead, not useful computation.
:::

## The Five-State Life Of A Process

::: flow
New -> Ready -> Running -> Terminated
Running -> Waiting -> Ready
:::

::: cards What each state means
New :: Being created - the OS is setting up the PCB and address space.
Ready :: Loaded into memory, waiting only for the CPU. Sitting in the ready queue.
Running :: Actually executing on the CPU right now (one per core).
Waiting (blocked) :: Cannot proceed until some event happens - an I/O completion, a signal, data arriving on a socket.
Terminated :: Finished, but its exit status may still be held until a parent collects it (see the Threads/IPC lessons for zombies and orphans).
:::

::: checkpoint
A running process calls read() on a file and must wait for the disk. What state does it enter, and what state does it enter next?
- ( ) Ready, then Running
- (x) Waiting, then Ready (once the I/O completes)
- ( ) Terminated, then New
- ( ) It stays Running throughout
> A process that is blocked on I/O cannot use the CPU, so it moves to Waiting. Once the disk finishes, it becomes Ready again - eligible for the CPU, but not guaranteed it immediately.
:::

## fork(): One Process Becomes Two

::: story
fork() is the strangest-looking system call in C, because it returns twice - once in each process. The **parent** gets back the child's PID; the **child** gets back 0. Both processes now run the same code, from the same point, with their own private copy of memory.
:::

::: tip
GATE loves counting how many total processes/lines get printed after a sequence of forks. The rule: each fork() call doubles the number of processes executing everything from that point forward, so n forks in sequence can create up to 2^n processes total.
:::`,
    codeExample: {
      language: "c",
      code: `#include <stdio.h>
#include <unistd.h>

int main(void) {
    pid_t pid = fork();   /* one call, two returns */

    if (pid < 0) {
        perror("fork failed");
    } else if (pid == 0) {
        printf("child: my pid is %d\\n", getpid());
    } else {
        printf("parent: my child's pid is %d\\n", pid);
    }
    return 0;
}`,
      expectedOutput: `parent: my child's pid is 5231
child: my pid is 5231`,
    },
    workedExamples: [
      {
        title: "Counting processes after nested fork()",
        problem: "A program executes fork(); fork(); with no conditionals around either call. How many total processes exist after both lines run, including the original?",
        solution: `Each fork() doubles the number of processes running the code from that point on.

  Start:            1 process
  After 1st fork():  2 processes (1 original x 2)
  After 2nd fork():  4 processes (2 x 2, because EVERY process from the
                      first fork - parent and child alike - executes the
                      second fork() independently)

  Total = 2^2 = 4 processes.

General rule: n unconditional fork() calls in sequence produce 2^n processes. This is a favourite GATE question exactly because it's easy to undercount by forgetting that the child from the first fork also executes the second fork().`,
      },
    ],
    dryRun: `Trace the state of a single process through one CPU burst, one I/O wait, and completion.

::: timeline A process's journey
Created (New) :: OS builds the PCB, allocates address space. Arrival time is recorded here.
Admitted to Ready queue :: Loaded in memory, waiting only for the CPU.
Dispatched (Running) :: The scheduler picks it; its CPU burst begins.
Issues a read() mid-burst (Waiting) :: Blocked until the disk responds - the CPU is freed for someone else.
I/O completes (back to Ready) :: Eligible for the CPU again, but must wait its turn.
Dispatched again (Running) :: Finishes its remaining burst.
Exits (Terminated) :: Completion time is recorded here.
:::

  Completion Time (CT)  = the moment it finally terminates
  Turnaround Time (TAT) = CT - Arrival Time
  Waiting Time (WT)     = TAT - total CPU Burst Time

These three numbers are exactly what CPU Scheduling later computes for a whole batch of processes at once - Processes is where they are first defined.`,
    analogies: [
      "A process is a customer in a bank queue: they have a case file (PCB) that gets picked up and put down every time a teller (CPU) switches to serve someone else, and the file always has enough detail to resume exactly where it left off.",
      "fork() is like photocopying a person mid-sentence: both copies wake up at the exact same point, and the only way to tell them apart afterward is a note that says which one is the 'original' (parent, non-zero return) and which is the 'copy' (child, zero return).",
    ],
    commonMistakes: [
      "Confusing a program (a static file) with a process (a running instance with its own memory and state).",
      "Assuming a Waiting process can move directly back to Running. It must pass through Ready and win the scheduler's attention first.",
      "Undercounting processes after multiple fork() calls by forgetting that children also execute later fork() statements.",
      "Thinking the PCB is only saved when a process terminates, rather than on every context switch.",
      "Mixing up arrival time (when the process enters the ready queue) with the moment it first gets the CPU.",
    ],
    memoryTricks: [
      "Five states, one loop: New -> Ready -> Running -> (Waiting -> Ready ->) Running -> Terminated.",
      "n forks in a row -> 2^n total processes. Each fork doubles everything downstream of it.",
      "TAT = CT - AT. WT = TAT - Burst. Memorise the chain, not each formula separately.",
    ],
    formulas: [
      "Turnaround Time = Completion Time - Arrival Time",
      "Waiting Time = Turnaround Time - Burst Time",
      "Response Time = Time of first CPU allocation - Arrival Time",
      "Total processes after n unconditional sequential fork() calls = 2^n",
    ],
    shortcuts: [
      "For fork()-counting questions, just count fork() calls that are NOT inside an if that only one branch executes, and raise 2 to that power.",
      "If a question gives completion time and asks for waiting time, go through turnaround time as the middle step - don't try to derive waiting time directly.",
    ],
    pyqRelevance: `Two recurring GATE shapes: "how many processes/lines of output after this fork() sequence" (near guaranteed most years), and definitional questions on process states and PCB contents.

The fork()-counting questions often add conditionals (only the child forks again, only pid > 0 forks again) specifically to break the naive 2^n shortcut - trace each branch instead of pattern-matching once you see an if.

Arrival/completion/turnaround/waiting time definitions are asked here in isolation and then reused, uncredited, inside every CPU Scheduling numerical - so getting the chain solid now pays off directly in the next topic.`,
    interviewConnection: `"What is the difference between a process and a program" and "what happens on fork()" are near-universal early interview questions, because they test whether you understand the execution model beneath the language you write in.

Process isolation - the fact that one process's crash or infinite loop doesn't corrupt another's memory - is also the entire reason browser tabs, containers, and sandboxed plugins are separate processes rather than threads in one.`,
    revisionSummary: `A process is a program in execution: its own memory, open files, and saved CPU state, tracked by the OS in a Process Control Block (PCB).

Five states: New, Ready, Running, Waiting, Terminated. A blocked process must return to Ready before it can run again - never Waiting straight to Running.

fork() creates a child by duplicating the calling process; parent gets the child's PID, child gets 0. n sequential unconditional forks produce 2^n total processes.

Core timings: Turnaround = Completion - Arrival. Waiting = Turnaround - Burst. Response = first CPU allocation - Arrival. These carry straight into CPU Scheduling.`,
    shortNotes: {
      fiveMinute: "Process = program in execution + PCB (PID, state, registers, memory info, open files, scheduling info). PCB saved/restored on every context switch. States: New -> Ready -> Running -> (Waiting -> Ready) -> Terminated; blocked processes must pass through Ready again. fork() duplicates the process: parent gets child PID, child gets 0; n sequential forks = 2^n processes. TAT = CT - AT; WT = TAT - Burst; Response = first run - AT.",
      oneMinute: "Process = running program + PCB. States: New/Ready/Running/Waiting/Terminated, blocked always returns via Ready. fork(): parent gets PID, child gets 0; n forks = 2^n processes. TAT=CT-AT, WT=TAT-Burst.",
      nightBefore: "PCB saved every context switch. 5 states, Waiting always -> Ready first. n forks -> 2^n processes. TAT=CT-AT, WT=TAT-Burst.",
    },
    keyPoints: [
      "A process is a program in execution, tracked via its Process Control Block (PID, state, registers, memory info, open files, scheduling data).",
      "The PCB is saved and restored on every context switch, not just at process termination.",
      "Five states: New, Ready, Running, Waiting, Terminated - a blocked process always returns to Ready before Running again.",
      "fork() duplicates the calling process; the parent receives the child's PID, the child receives 0.",
      "n sequential, unconditional fork() calls create 2^n total processes - conditionals on pid break this shortcut.",
      "Turnaround Time = Completion - Arrival; Waiting Time = Turnaround - Burst; these definitions carry directly into CPU Scheduling.",
    ],
    mcqs: [
      {
        question: "Which transition is IMPOSSIBLE in the standard five-state process model?",
        options: ["Ready to Running", "Running to Waiting", "Waiting to Running", "Running to Ready"],
        correctIndex: 2,
        explanation: "A waiting (blocked) process cannot go straight to Running - it must first become Ready and then be dispatched by the scheduler like any other ready process.",
      },
      {
        question: "A program contains fork() followed unconditionally by another fork(), with no branching in between. How many total processes exist after both statements execute?",
        options: ["2", "3", "4", "8"],
        correctIndex: 2,
        explanation: "Each fork doubles the process count: 1 -> 2 after the first fork, then 2 -> 4 after the second, since both the original and its child each execute the second fork(). 2^2 = 4.",
      },
      {
        question: "Which of these is NOT normally stored in a Process Control Block?",
        options: ["Program counter and CPU registers", "Open file list", "The source code of the program", "Process scheduling priority"],
        correctIndex: 2,
        explanation: "The PCB tracks the process's execution state and OS bookkeeping - registers, files, scheduling info - not the program's source code, which lives in the executable file, not the running process's metadata.",
      },
    ],
    numericals: [
      {
        question: "A process arrives at time 2, waits in the ready queue, runs, and completes at time 20. Its total CPU burst time was 10. What is its waiting time?",
        answerMin: 8,
        answerMax: 8,
        unit: "time units",
        solution: `  Turnaround Time = Completion - Arrival = 20 - 2 = 18
  Waiting Time     = Turnaround - Burst   = 18 - 10 = 8

The process spent 18 units from arrival to finish, of which 10 were
actual execution - the remaining 8 were spent waiting for the CPU
(in the Ready state, not Waiting/blocked - different use of the word).`,
      },
    ],
  },

  "threads": {
    difficulty: "Moderate",
    estimatedMinutes: 30,
    xpReward: 25, coinReward: 10,
    // Verified real (title confirmed via direct fetch, 2026-08-13).
    resources: [{
      kind: "video",
      title: "Operating Systems Lecture 12: Introduction to Threads and Concurrency",
      url: "https://www.youtube.com/watch?v=SVHLonf5AGY",
      description: "Whole video covers this topic from the start.",
    }],
    whatYoullLearn: [
      "What a thread shares with its siblings, and what stays private",
      "User-level versus kernel-level threads, and why the distinction affects blocking",
      "The many-to-one, one-to-one, and many-to-many threading models",
      "Why creating a thread is cheaper than creating a process",
    ],
    prerequisites: ["Processes"],
    concept: `## A Company And Its Employees, Sharing One Office

::: story
A process is like a company: it has one office (address space), one set of filing cabinets (open files), one mailing address. A **thread** is an employee working inside that company - it shares the office and the filing cabinets with every other employee, but it keeps its own desk, its own notepad, and its own current task.

Two employees in the same company can read the same filing cabinet at the same time - that's powerful, and it's also exactly how they can collide and mess it up for each other, which is the whole subject of the next lesson.
:::

::: remember
Threads within one process **share**: the address space (code, global/heap data), open files, and other OS resources.

Threads within one process each keep **private**: their own program counter, registers, and stack (their "notepad" of local variables and function call history).
:::

## Why Bother With Threads At All

::: cards What threads buy you
Cheaper creation :: No new address space to set up - just a new stack and register set. Far less OS work than fork().
Cheaper context switch :: Switching between two threads of the same process doesn't need to reload memory-mapping hardware, since the address space is unchanged.
Natural concurrency :: A web server can have one thread per connection, all sharing the same in-memory cache, without the overhead of one process per connection.
Responsiveness :: One thread can keep a UI responsive while another does slow work in the background.
:::

::: mistake
"Threads are faster" does NOT mean "threads are free of coordination". Because they share memory, two threads writing the same variable at once is a bug waiting to happen - covered fully in Concurrency and Synchronization. Threads trade isolation for speed.
:::

## Where The Threads Actually Live

::: cards Three threading models
User-level threads :: Managed entirely by a library in user space; the kernel sees only the one process. Fast to create and switch, but if one thread makes a blocking system call, the WHOLE process blocks - the kernel doesn't know the other threads exist.
Kernel-level threads :: The kernel itself schedules each thread individually. Slightly more overhead per operation, but one thread blocking on I/O does not stall its siblings.
Many-to-many model :: Many user threads are multiplexed onto a smaller or equal number of kernel threads, aiming to get the low overhead of user threads without the "one blocks all" problem.
:::

::: checkpoint
A process uses pure user-level threads (many-to-one model). One thread calls a blocking read(). What happens to the process's other threads?
- (x) They are all blocked too, because the kernel only sees one schedulable entity for the whole process
- ( ) They keep running normally, since threads are independent
- ( ) Only threads created after the read() are blocked
- ( ) The OS automatically promotes one of them to run in its place
> This is the single biggest weakness of the many-to-one model, and the reason kernel-level and many-to-many models exist: the kernel has no visibility into individual user threads, so a blocking call from any one of them stalls the entire process.
:::

## Thread Control Blocks, Briefly

Each thread has its own small Thread Control Block (TCB): thread ID, saved registers, program counter, stack pointer. Compare that to a process's PCB, which additionally carries memory maps and the open file table - resources threads share rather than duplicate. That difference in what must be copied is exactly why thread creation and context switches are cheaper than a process's.`,
    codeExample: {
      language: "c",
      code: `#include <stdio.h>
#include <pthread.h>

int shared_counter = 0;   /* shared by BOTH threads - the whole point */

void *increment(void *arg) {
    for (int i = 0; i < 100000; i++) {
        shared_counter++;   /* not atomic - see Concurrency lesson */
    }
    return NULL;
}

int main(void) {
    pthread_t t1, t2;
    pthread_create(&t1, NULL, increment, NULL);
    pthread_create(&t2, NULL, increment, NULL);
    pthread_join(t1, NULL);
    pthread_join(t2, NULL);
    printf("counter = %d\\n", shared_counter);  /* expected 200000, often less */
    return 0;
}`,
      expectedOutput: `counter = 200000   (expected value - in practice, often LESS, because
shared_counter++ is not a single atomic operation; see the
Concurrency and Synchronization lesson for why)`,
    },
    workedExamples: [
      {
        title: "Process fork vs thread create: what gets copied",
        problem: "Compare what the OS must set up when a process calls fork() versus when it calls pthread_create() for a new thread. Why is the thread operation cheaper?",
        solution: `fork() (new process): the OS must create a new PCB, a full new address space (or set up copy-on-write page tables pointing at the parent's pages), duplicate the open file table's references, and set up a fresh set of registers/stack.

pthread_create() (new thread): the OS creates a new TCB, allocates a new stack, and sets up a fresh program counter and register set - and that's it. The address space, open files, and global data are simply shared with the existing threads; nothing about them needs to be copied or newly mapped.

Because thread creation skips the address-space and file-table setup entirely, it does measurably less work, which is why thread creation and context switching are consistently cheaper than the process equivalents - the standard exam answer to "why use threads over processes".`,
      },
    ],
    analogies: [
      "A process is a company; its threads are employees sharing one office (address space) and one filing cabinet (open files), but each keeping a private notepad (stack) and current task (registers/program counter).",
      "Many-to-one threading is like one phone line shared by an entire office - if one employee ties it up, nobody else in that office can make a call, even though they're each doing unrelated work.",
    ],
    commonMistakes: [
      "Believing each thread has its own copy of global variables - they share the same global/heap memory, which is exactly what makes race conditions possible.",
      "Assuming threads are always faster with no downside. They trade memory isolation for speed, and lost isolation means new bugs (race conditions) that a single-threaded process never had.",
      "Confusing user-level and kernel-level threads. Only the kernel-level (or many-to-many) model lets one thread block without stalling its siblings.",
      "Thinking a thread has its own open-file table. It uses the same one as every other thread in its process.",
    ],
    memoryTricks: [
      "Threads SHARE code/data/files, KEEP PRIVATE stack/registers/PC. Shared = the office; private = the notepad.",
      "Many-to-one: one call, everybody blocks. Kernel doesn't see individual threads at all.",
    ],
    formulas: [
      "Per-thread creation overhead ≈ new stack + new TCB only (no new address space) - much smaller than per-process overhead ≈ new PCB + new address space + duplicated file table.",
      "Context switch cost: same-process thread switch < cross-process switch, because the memory-mapping hardware (page tables/TLB) does not need to be reloaded.",
    ],
    shortcuts: [
      "If a question asks 'why are threads cheaper than processes', the answer is always about what does NOT need to be duplicated: address space and open files.",
      "If a scenario says one blocking call froze an entire multi-threaded process, that's the many-to-one model - kernel-level or many-to-many wouldn't behave that way.",
    ],
    pyqRelevance: `Threads questions are usually conceptual 1-mark items: what is shared versus private between threads of a process, or which threading model has the "one blocks all" weakness.

A recurring numerical-adjacent question gives a shared-variable increment loop across multiple threads (like the code example above) and asks for the range of possible final values - that's really testing Concurrency and Synchronization, but it's introduced here as motivation.

Comparisons of thread vs process creation/context-switch cost are asked directly and are pure recall once you know what each one must copy.`,
    interviewConnection: `"What's the difference between a process and a thread" is asked in nearly every systems-adjacent interview, and the sharp answer is exactly this lesson: shared address space and files, private stack and registers.

Understanding the many-to-one model's blocking problem also explains real production incidents: a single slow synchronous call inside an old-style green-threaded runtime can freeze an entire service, which is why modern runtimes moved toward kernel threads or async I/O instead.`,
    revisionSummary: `A thread is a unit of execution within a process. Threads SHARE the address space, open files, and global/heap data of their process; each thread keeps PRIVATE its own program counter, registers, and stack.

Threads are cheaper to create and switch between than processes because there's no new address space or file table to set up.

Three models: user-level (many-to-one, fast but one blocking call blocks everyone), kernel-level (one-to-one, each thread independently schedulable), many-to-many (multiplexes many user threads onto fewer kernel threads, aiming for both benefits).

A Thread Control Block (TCB) holds just the private state: thread ID, registers, PC, stack pointer.`,
    shortNotes: {
      fiveMinute: "Thread = execution unit inside a process. Shares: address space, open files, global/heap data. Private: PC, registers, stack. Cheaper create/switch than processes (no new address space/file table). Models: many-to-one (user-level, one block = all block), one-to-one (kernel-level), many-to-many (best of both). TCB holds only private state.",
      oneMinute: "Threads share memory+files, keep private stack+registers+PC. Cheaper than processes to create/switch. Many-to-one: one blocking call blocks all threads (kernel unaware of them). One-to-one/many-to-many avoid that.",
      nightBefore: "Share: memory, files. Private: stack, registers, PC. Many-to-one = one block, all block.",
    },
    keyPoints: [
      "Threads within a process share the address space, open files, and global/heap data; each keeps a private stack, registers, and program counter.",
      "Thread creation and context switches are cheaper than a process's because no new address space or file table needs to be set up.",
      "In the many-to-one (pure user-level) model, one thread's blocking system call blocks the entire process, since the kernel only sees one schedulable entity.",
      "One-to-one and many-to-many models involve the kernel directly, so a blocking call in one thread does not stall its siblings.",
      "A Thread Control Block (TCB) is smaller than a Process Control Block (PCB) because it tracks only the thread-private state.",
    ],
    mcqs: [
      {
        question: "Which of the following is PRIVATE to each thread, not shared with other threads in the same process?",
        options: ["Open file descriptors", "Global variables", "The stack and program counter", "The heap"],
        correctIndex: 2,
        explanation: "Each thread needs its own execution context - its own call stack and current instruction pointer - to run independently. Files, globals, and the heap are all shared process-wide resources.",
      },
      {
        question: "In the many-to-one threading model, what happens if one user-level thread issues a blocking system call?",
        options: [
          "Only that thread blocks; others continue",
          "The entire process blocks, since the kernel schedules the process as a single unit",
          "The kernel automatically switches to another thread within the same process",
          "The blocking call is silently converted to non-blocking",
        ],
        correctIndex: 1,
        explanation: "The kernel has no knowledge of individual threads in the many-to-one model - it only sees one process - so a blocking call stalls every thread inside it.",
      },
      {
        question: "Why is creating a new thread generally cheaper than creating a new process via fork()?",
        options: [
          "Threads do not need a program counter",
          "A new thread reuses the existing address space and open files instead of duplicating them",
          "Threads are not tracked by the operating system",
          "Thread creation does not require any OS involvement",
        ],
        correctIndex: 1,
        explanation: "fork() must set up a new address space and duplicate file-table references; a new thread only needs a new stack and register set, sharing everything else with its process.",
      },
    ],
  },

  "inter-process-communication": {
    difficulty: "Moderate",
    estimatedMinutes: 35,
    xpReward: 25, coinReward: 10,
    // Verified real (title confirmed via direct fetch, 2026-08-13).
    resources: [{
      kind: "video",
      title: "Interprocess Communication: Shared Memory & Message Passing",
      url: "https://www.youtube.com/watch?v=PfGcNa7Bw8o",
      description: "Whole video covers this topic from the start.",
    }],
    whatYoullLearn: [
      "Why separate processes need a deliberate mechanism to talk at all",
      "Shared memory versus message passing, and the speed/safety trade-off between them",
      "Pipes, message queues, and shared memory as concrete implementations",
      "The producer-consumer problem as the running example for every IPC mechanism",
    ],
    prerequisites: ["Threads"],
    concept: `## Two Companies Cannot Just Walk Into Each Other's Office

::: story
Threads share memory automatically because they're employees of the same company. Two separate **processes** are two separate companies - by design, one process cannot read another's memory, and that isolation is a safety feature, not a bug.

But sometimes two processes genuinely need to cooperate: a shell piping output from one program into another, a browser's renderer process reporting back to its main process. Inter-Process Communication (IPC) is the OS deliberately opening a narrow, controlled channel between two otherwise-isolated processes.
:::

::: remember
IPC exists because process isolation is normally a *feature*. Every IPC mechanism is the OS punching one specific, controlled hole in that isolation - never removing it wholesale.
:::

## Two Families Of Mechanism

::: cards Shared memory vs message passing
Shared memory :: The OS maps the same physical memory region into both processes' address spaces. After setup, communication is just reading/writing memory - no further OS involvement, so it's very fast. But now the processes must synchronize themselves (see the next lesson) since the OS is no longer mediating each access.
Message passing :: Processes exchange data via explicit send()/receive() system calls. Every message goes through the kernel, which is slower, but the kernel enforces the discipline - no separate synchronization scheme is needed for the transfer itself.
:::

::: mistake
"Shared memory is always faster" is true only after setup and only if you also correctly build the synchronization the OS no longer provides for you. A shared-memory IPC with a subtle race condition is not actually faster than a correct message-passing one - it's just broken faster.
:::

## Concrete Mechanisms

::: cards What each one actually is
Pipe :: A unidirectional byte stream between two related processes (typically parent/child), read like a file. \`ls | grep foo\` connects ls's stdout to grep's stdin through exactly this.
Named pipe (FIFO) :: Like a pipe, but has a name in the filesystem, so unrelated processes can open and use it too.
Message queue :: The kernel maintains a queue of discrete messages; senders enqueue, receivers dequeue - order and boundaries are preserved, unlike a raw byte stream.
Shared memory segment :: A region of physical memory both processes map into their own address space - the fastest mechanism, at the cost of needing manual synchronization.
Sockets :: Message passing that also works across machines over a network, not just within one.
:::

::: checkpoint
Two unrelated processes on the same machine need to exchange large amounts of data as fast as possible, and are willing to write their own synchronization. Which IPC mechanism fits best?
- ( ) An ordinary anonymous pipe
- ( ) A message queue
- (x) A shared memory segment
- ( ) None - unrelated processes cannot communicate
> Shared memory avoids a kernel round-trip on every read/write once it's set up, making it the fastest option for high-volume data - provided the processes handle their own synchronization, which the question states they will.
:::

## The Producer-Consumer Problem

::: story
A producer process generates data into a shared buffer; a consumer process removes it. This single scenario is THE canonical example used to explain every IPC and synchronization mechanism in the syllabus, because it exposes every problem at once: what if the buffer is full? What if it's empty? What if both write to it at the same instant?
:::

::: tip
Whenever a GATE question describes "one process filling a buffer and another draining it," recognize it as producer-consumer immediately - the vocabulary (bounded buffer, full/empty conditions) is the same every time, and it's solved properly with semaphores in the next lesson.
:::`,
    codeExample: {
      language: "c",
      code: `#include <stdio.h>
#include <unistd.h>

int main(void) {
    int fd[2];
    pipe(fd);              /* fd[0] = read end, fd[1] = write end */

    if (fork() == 0) {
        close(fd[0]);                       /* child only writes */
        write(fd[1], "hello from child", 16);
        close(fd[1]);
    } else {
        close(fd[1]);                       /* parent only reads */
        char buf[17] = {0};
        read(fd[0], buf, 16);
        printf("parent received: %s\\n", buf);
        close(fd[0]);
    }
    return 0;
}`,
      expectedOutput: `parent received: hello from child`,
    },
    workedExamples: [
      {
        title: "Choosing an IPC mechanism for a shell pipeline",
        problem: "Explain, in terms of IPC mechanisms, what the shell does to run `cat file.txt | sort | uniq`, and why a pipe rather than shared memory is the natural fit here.",
        solution: `The shell creates three processes: cat, sort, and uniq. Between cat and sort it creates a pipe and connects cat's stdout to the pipe's write end and sort's stdin to the pipe's read end; it does the same between sort and uniq with a second pipe.

Data flows as a byte stream, in order, from one process's output directly into the next's input - exactly what a pipe provides, with the kernel buffering and synchronizing the flow (blocking the writer if the reader is slow, and vice versa) automatically.

Shared memory would be the wrong tool here: the data is a simple sequential stream between two RELATED processes (children of the same shell) with no need for random access or persistence, and using shared memory would mean the shell's pipeline machinery would have to hand-roll its own full/empty signaling - work a pipe already does for free.`,
      },
    ],
    analogies: [
      "Message passing is like sending letters through a postal service (the kernel) - reliable and mediated, but each letter takes a trip. Shared memory is like two people writing on the same whiteboard - instant, but they must agree on turn-taking themselves or they'll scribble over each other.",
    ],
    commonMistakes: [
      "Assuming shared memory needs no synchronization because 'the OS handles the memory'. The OS maps the memory; it does NOT protect against concurrent access - that's the processes' job.",
      "Confusing a pipe (unidirectional, byte stream, no message boundaries) with a message queue (discrete messages, boundaries preserved).",
      "Thinking any two processes can use an anonymous pipe. Anonymous pipes require a common ancestor (usually parent/child); unrelated processes need a named pipe or another mechanism.",
      "Believing message passing is always slower and therefore worse - for infrequent, small, or cross-machine communication, its lack of manual synchronization is a real advantage.",
    ],
    memoryTricks: [
      "Shared memory = fast but you're on your own for synchronization. Message passing = slower but the kernel handles the hand-off.",
      "Pipe = one-way stream, related processes only. FIFO = named pipe, works for unrelated processes too. Message queue = discrete messages with boundaries kept.",
    ],
    formulas: [
      "Message-passing overhead per exchange ≈ 2 system calls (send + receive) + kernel copy of the data, paid on EVERY transfer.",
      "Shared-memory overhead ≈ one-time mapping setup, then near-zero per access - but synchronization cost is added separately and is the process's own responsibility.",
    ],
    shortcuts: [
      "If a question emphasizes speed/large volume and lets the processes manage their own coordination, the answer is shared memory. If it emphasizes simplicity, safety, or crossing a network, it's message passing.",
      "'Related processes' + 'one-way stream' in a question is almost always describing a pipe; 'unrelated processes' needing a byte stream points to a named pipe/FIFO.",
    ],
    pyqRelevance: `IPC questions are mostly conceptual: matching a scenario to shared memory vs message passing, or identifying which concrete mechanism (pipe, FIFO, message queue, shared memory) fits a described need.

The producer-consumer setup introduced here reappears, unlabeled, as the scenario behind nearly every semaphore/synchronization numerical in the next two lessons - recognizing the shape early saves time later.

Direct numericals on IPC itself are rare; the topic mostly earns marks through correct classification rather than computation.`,
    interviewConnection: `Understanding pipes and shared memory explains real tools you already use daily: shell pipelines, Redis/memcached as a shared cache, and why microservices typically communicate over sockets (message passing) rather than shared memory across machines.

The shared-memory-needs-its-own-synchronization point is exactly the lesson behind most "why is my multi-process cache getting corrupted" production bugs - the mechanism moved data instantly but nobody added the missing coordination.`,
    revisionSummary: `IPC is the OS deliberately opening a controlled channel between otherwise-isolated processes.

Two families: shared memory (fast after setup, but the processes must synchronize themselves) and message passing (every exchange goes through the kernel via send/receive, slower but no separate synchronization needed for the transfer).

Mechanisms: pipe (unidirectional stream, related processes), named pipe/FIFO (same, but works for unrelated processes via a filesystem name), message queue (discrete, ordered messages), shared memory segment (mapped physical memory), sockets (message passing, works across machines).

The producer-consumer problem - one process filling a buffer, another draining it - is the running example that motivates synchronization, covered next.`,
    shortNotes: {
      fiveMinute: "IPC = controlled channel between isolated processes. Shared memory: fast, no per-access kernel involvement, but processes must synchronize themselves. Message passing: send/receive via kernel, slower, kernel handles the hand-off. Pipe = one-way stream, related processes. FIFO = named pipe, unrelated processes. Message queue = discrete messages. Sockets = works across machines. Producer-consumer = the standard motivating scenario.",
      oneMinute: "Shared memory = fast, self-synchronized. Message passing = kernel-mediated send/receive, slower, safer. Pipe (related procs, byte stream) vs FIFO (named, unrelated procs) vs message queue (discrete msgs) vs shared memory (mapped region).",
      nightBefore: "Shared memory = fast, DIY sync. Message passing = kernel mediates, slower. Pipe = related only; FIFO = named, unrelated ok.",
    },
    keyPoints: [
      "IPC deliberately opens a controlled communication channel between processes that are otherwise isolated by design.",
      "Shared memory is fast after setup but requires the processes to synchronize access themselves - the OS no longer mediates each read/write.",
      "Message passing routes every exchange through the kernel via send/receive, which is slower but needs no separate synchronization scheme for the transfer.",
      "Pipes are unidirectional byte streams between related processes; named pipes (FIFOs) extend this to unrelated processes via a filesystem name.",
      "The producer-consumer problem (one process fills a buffer, another drains it) is the standard scenario used to introduce synchronization in the next lesson.",
    ],
    mcqs: [
      {
        question: "What is the main trade-off of using shared memory for IPC instead of message passing?",
        options: [
          "Shared memory cannot transfer large amounts of data",
          "Shared memory is faster after setup but requires the processes to handle their own synchronization",
          "Shared memory works only across a network",
          "Shared memory requires no kernel involvement at all, ever",
        ],
        correctIndex: 1,
        explanation: "Once mapped, shared memory access has no per-operation kernel overhead, making it fast - but because the kernel is no longer mediating each access, the communicating processes must implement their own synchronization.",
      },
      {
        question: "Which IPC mechanism allows two UNRELATED processes to exchange a byte stream?",
        options: ["An anonymous pipe", "A named pipe (FIFO)", "Shared registers", "None - unrelated processes cannot use pipes"],
        correctIndex: 1,
        explanation: "An anonymous pipe requires a common ancestor process to set it up and share the descriptors; a named pipe has a filesystem name that any process can open, removing that requirement.",
      },
      {
        question: "In the producer-consumer problem with a bounded buffer, what must be prevented?",
        options: [
          "The producer running slower than the consumer",
          "The producer adding to a full buffer, and the consumer removing from an empty one",
          "The consumer running at all before the producer starts",
          "Both processes using the same programming language",
        ],
        correctIndex: 1,
        explanation: "A bounded buffer has finite capacity, so the producer must not write when it's full and the consumer must not read when it's empty - both conditions require synchronization, which is exactly what semaphores solve in the next lesson.",
      },
    ],
  },

  // ---------------- Concurrency and Synchronization ----------------

  "concurrency-and-synchronization": {
    difficulty: "Hard",
    estimatedMinutes: 40,
    xpReward: 30, coinReward: 12,
    // Verified real (title confirmed via direct fetch, 2026-08-13).
    resources: [{
      kind: "video",
      title: "Process Synchronization | Chapter-6 | Operating System",
      url: "https://www.youtube.com/watch?v=EOGyyyzmEGw",
      description: "Whole video covers this topic from the start.",
    }],
    whatYoullLearn: [
      "What a race condition actually is, down to the individual machine instructions",
      "The critical section problem and its three required properties",
      "Why a plain boolean flag does not solve mutual exclusion",
      "Peterson's solution as a worked example of a correct software-only solution",
    ],
    prerequisites: ["Inter-Process Communication"],
    concept: `## When Two Threads Read The Same Line At Once

::: story
\`shared_counter++\` looks like one step. It is not. The CPU actually does three: load the value into a register, add one, store it back.

Now suppose two threads run this on the same variable, and their steps interleave: both load the value 5, both add one to get 6, both store 6. Two increments happened, but the counter only went up by one. Nothing crashed - the answer is just quietly wrong.
:::

::: remember
A **race condition** occurs when the outcome of concurrent execution depends on the specific timing or interleaving of operations on shared data. Same code, same inputs, different answer depending on scheduling luck - that unpredictability is the defining symptom.
:::

## The Critical Section Problem

::: cards Three requirements a solution MUST satisfy
Critical section :: The piece of code that touches shared data and must not run concurrently with another process's copy of itself.
Mutual exclusion :: If one process is inside its critical section, no other process may be inside its own.
Progress :: If no process is in its critical section, a process that wants to enter must eventually be allowed to - decided only among those actually wanting to enter, in finite time.
Bounded waiting :: There is a limit on how many times other processes may enter their critical section after one process has requested entry and before that request is granted. No process waits forever.
:::

::: mistake
"Just use a shared boolean flag" is the classic wrong first attempt. A simple \`while (lock) ; lock = true;\` still has a gap between the check and the set - two processes can both pass the check before either sets the flag, and both enter. The check-then-set has to be a single, indivisible (atomic) step, which a plain variable read/write does not give you.
:::

::: checkpoint
Which of the following, by itself, guarantees mutual exclusion for two processes sharing one boolean flag \`lock\`?
- ( ) \`if (!lock) { lock = true; /* critical section */ }\`
- ( ) Checking \`lock\` twice before entering
- (x) None of the boolean-flag approaches shown here - the check and the set must be a single atomic operation
- ( ) Adding a sleep() before checking the flag
> Every plain read-then-write scheme has a window between the read and the write where a second process can slip through. Without a hardware-provided atomic instruction (or a carefully constructed algorithm like Peterson's), a shared boolean cannot close that window.
:::

## Peterson's Solution: Correct, Software-Only, Two Processes

::: cards The two pieces that make it work
flag[i] :: Process i sets flag[i] = true to say "I want to enter."
turn :: Whichever process set turn LAST is the one that politely waits if both want in at once.
The entry condition :: Process i waits while (flag[j] && turn == j). It can proceed once the other process doesn't want in, or it is not the other's turn.
:::

::: tip
Peterson's solution only works for exactly two processes, and only on architectures that don't reorder memory operations (modern hardware often does, which is exactly why real systems use hardware primitives - test-and-set, compare-and-swap - instead of pure Peterson's in production). GATE treats it as the textbook proof that software-only mutual exclusion is *possible* even before dedicated hardware instructions are involved.
:::`,
    deepDive: `## Hardware's Answer: One Instruction, Not Two Steps

Peterson's solution proves mutual exclusion is achievable in software, but real systems lean on hardware instead, because hardware can make "check and set" genuinely atomic - one instruction, no window for interleaving.

::: cards Two hardware primitives GATE names directly
Test-and-Set (TAS) :: Reads a memory location's OLD value and unconditionally sets it to true, as one indivisible instruction. A process spins (busy-waits) while TAS keeps returning true.
Compare-and-Swap (CAS) :: Compares a memory location to an expected value and, only if they match, swaps in a new value - also atomic. The basis of most modern lock-free data structures.
:::

::: behind
Both instructions solve mutual exclusion trivially: acquire the lock by looping "while (TAS(&lock) == true) ;", release it with "lock = false". The hardware guarantees no two processes can both see the lock as free at the same instant - the exact gap that broke the plain-boolean attempt.
:::

## Counting Interleavings

If process A's critical-section-adjacent code has \`m\` instructions and process B's has \`n\`, and every interleaving of those instructions (preserving each process's own order) is possible without synchronization, the number of distinct interleavings is C(m+n, m) - choose which m of the m+n total slots belong to A.

This is why "just eyeball it" fails once critical sections have more than a couple of instructions: the number of orderings to check grows combinatorially, which is precisely the argument for a correctness proof rather than testing every case by hand.`,
    codeExample: {
      language: "c",
      code: `/* Peterson's solution for two processes, 0 and 1 */
#include <stdbool.h>

bool flag[2] = {false, false};
int turn;

void enter_critical(int i) {
    int j = 1 - i;
    flag[i] = true;   /* "I want to enter" */
    turn = j;         /* politely offer the other process to go first */
    while (flag[j] && turn == j) {
        /* busy-wait: only loops if BOTH want in and it is j's turn */
    }
}

void leave_critical(int i) {
    flag[i] = false;  /* "I'm done" - lets a waiting process proceed */
}`,
      expectedOutput: `No printed output - this is the classic entry/exit protocol.
Correctness is proved by argument, not by running it: whichever
process sets 'turn' LAST is the one that waits, so exactly one
process can ever be inside the critical section at a time.`,
    },
    workedExamples: [
      {
        title: "Losing an update through interleaving",
        problem: "shared_counter starts at 5. Two threads each execute `load counter; add 1; store counter` with no synchronization. Show an interleaving where the final value is 6 instead of the correct 7.",
        solution: `Instruction-level interleaving, one possible bad ordering:

  Thread A: load counter        -> A's register = 5
  Thread B: load counter        -> B's register = 5   (before A stores!)
  Thread A: add 1                -> A's register = 6
  Thread A: store counter        -> counter = 6
  Thread B: add 1                -> B's register = 6
  Thread B: store counter        -> counter = 6        <- OVERWRITES A's update

Final value: 6. Correct value if the two increments had not overlapped: 7.

The lost update happened because Thread B read the counter's value BEFORE Thread A's increment was written back - both threads worked from the same stale value of 5. This is the canonical race condition, and it is why "increment a shared counter without a lock" is the standard broken example in every textbook and every interview.`,
      },
    ],
    dryRun: `Count the possible interleavings of two very short critical-section preludes, to see why "just check by hand" stops working quickly.

::: timeline Setup
Process A's code :: 2 instructions: A1, A2 (in that fixed order)
Process B's code :: 3 instructions: B1, B2, B3 (in that fixed order)
Question :: How many distinct valid interleavings exist, preserving each process's own internal order?
:::

  Total instruction slots = 2 + 3 = 5
  Choose which 2 of the 5 slots belong to A (the rest are B, in order)

    C(5, 2) = 5! / (2! x 3!) = 10

Ten distinct interleavings - for just 2 and 3 instructions. A real critical section prelude with, say, 5 and 5 instructions gives C(10,5) = 252 interleavings. Nobody is checking 252 cases by hand for correctness - which is exactly why the critical section problem is solved with a *proof* (mutual exclusion + progress + bounded waiting, verified logically) rather than by trying every ordering.`,
    analogies: [
      "A race condition is like two people editing the same shared spreadsheet cell at once, both starting from the same number they saw a moment ago - whichever save happens last wins, and the other person's edit vanishes without any error message.",
      "Peterson's 'turn' variable is like two people reaching a doorway together, and the polite rule is: whoever spoke last ('after you') is the one who actually waits.",
    ],
    commonMistakes: [
      "Assuming a single line of high-level code (like counter++) is one indivisible operation. It is almost always multiple machine instructions with room to interleave.",
      "Believing a plain shared boolean flag can enforce mutual exclusion. The check-then-set gap is exactly where two processes both slip through.",
      "Forgetting that Peterson's solution is specifically a TWO-process solution - it does not generalise directly to n processes without modification.",
      "Treating 'disable interrupts' as a general-purpose fix. It only works on a single-processor system and blocks everything, including unrelated processes - too blunt for real multiprocessor systems.",
      "Confusing progress (someone eventually gets in) with bounded waiting (no one waits forever) - a solution can satisfy one without the other.",
    ],
    memoryTricks: [
      "Critical section needs MPB: Mutual exclusion, Progress, Bounded waiting.",
      "Peterson's rule in one line: I want in (flag[i]=true), but you go first (turn=j) - then wait only if you ALSO want in and it's genuinely your turn.",
      "Race condition = result depends on TIMING, not on input. If rerunning the same input can give a different answer, suspect a race.",
    ],
    formulas: [
      "Number of distinct interleavings of two sequences of length m and n (each internally ordered) = C(m+n, m).",
      "A race condition exists whenever two or more accesses to shared data occur concurrently and at least one is a write, with no synchronization enforcing an order.",
    ],
    shortcuts: [
      "If a question's 'solution' to mutual exclusion is a single shared variable checked and set in two separate statements, it is broken - look for the gap.",
      "For interleaving-count questions, just apply C(m+n, m) directly rather than enumerating orderings.",
    ],
    pyqRelevance: `Concurrency questions appear both as direct definitional MCQs (what are the three critical-section requirements, what's wrong with a given boolean-flag attempt) and as code-tracing questions asking what values a shared variable can end up with after concurrent execution.

Peterson's solution is asked either as "trace this code and determine if mutual exclusion holds" or as filling in a blank in the entry/exit protocol.

Interleaving-counting questions (C(m+n,m)) appear as NAT numericals and are pure combinatorics once you recognise the pattern - the hard part is realising that's what's being asked.`,
    interviewConnection: `Race conditions are one of the most common real-world bug categories, and "have you debugged a race condition" is a near-standard systems interview question, because they don't crash predictably and can pass every test run before failing in production under load.

Understanding WHY a plain boolean check-then-set fails is exactly the reasoning behind why every real lock implementation (mutex, spinlock) is built on a hardware atomic instruction rather than ordinary reads and writes.`,
    revisionSummary: `A race condition is when concurrent execution's outcome depends on the timing/interleaving of operations on shared data - typically because a "single" operation is actually several machine instructions.

The critical section problem requires three properties: mutual exclusion (only one process inside at a time), progress (someone wanting in eventually gets in), and bounded waiting (no infinite wait).

A plain shared boolean cannot enforce mutual exclusion because check-then-set is not atomic. Peterson's solution fixes this for two processes using a flag array plus a turn variable, but does not generalise past two processes and assumes no hardware reordering.

Number of interleavings of two instruction sequences of length m and n = C(m+n, m) - which is why correctness is proved logically, not checked by hand.`,
    shortNotes: {
      fiveMinute: "Race condition = outcome depends on timing of concurrent access to shared data (a 'single' statement is often 3+ machine instructions). Critical section needs: mutual exclusion, progress, bounded waiting. A plain boolean flag fails because check-then-set is not atomic. Peterson's solution (flag[] + turn) is correct for 2 processes only. Interleavings of length-m and length-n sequences = C(m+n,m). Hardware fixes this properly via test-and-set / compare-and-swap.",
      oneMinute: "Race condition = timing-dependent result on shared data. Need: mutual exclusion, progress, bounded waiting. Boolean flag fails (check-then-set not atomic). Peterson's = 2-process fix via flag[]+turn. Interleavings = C(m+n,m).",
      nightBefore: "3 requirements: mutual exclusion, progress, bounded waiting. Boolean flag = broken (not atomic). Peterson's = 2 processes only.",
    },
    keyPoints: [
      "A race condition occurs when concurrent execution's result depends on the interleaving/timing of operations on shared data.",
      "A 'single' high-level statement like counter++ is usually several machine instructions (load, modify, store), leaving room for interleaving.",
      "The critical section problem requires mutual exclusion, progress, and bounded waiting - all three, simultaneously.",
      "A plain shared boolean flag cannot enforce mutual exclusion because the check-then-set sequence is not atomic.",
      "Peterson's solution (flag[] array + turn variable) is a correct software-only solution, but only for exactly two processes.",
      "The number of distinct interleavings of two instruction sequences of length m and n is C(m+n, m).",
    ],
    mcqs: [
      {
        question: "Which of the following is NOT one of the three required properties of a critical-section solution?",
        options: ["Mutual exclusion", "Progress", "Bounded waiting", "Maximum throughput"],
        correctIndex: 3,
        explanation: "Throughput is not part of the formal critical-section requirements. The three required properties are mutual exclusion, progress, and bounded waiting - a solution can satisfy all three while being slow.",
      },
      {
        question: "Why does a simple shared boolean flag, checked and then set in two separate statements, fail to guarantee mutual exclusion?",
        options: [
          "Booleans cannot be shared between processes",
          "The check and the set are not a single atomic operation, so two processes can both pass the check before either sets the flag",
          "Boolean variables are always cached and never updated",
          "It works correctly, but only on multiprocessor systems",
        ],
        correctIndex: 1,
        explanation: "There is a gap between reading the flag and writing to it. If both processes read the flag as false in that gap before either writes true, both proceed into the critical section.",
      },
      {
        question: "In Peterson's solution for two processes, what does the 'turn' variable ensure?",
        options: [
          "It counts how many times each process has entered its critical section",
          "It decides which process waits when both processes want to enter at the same time",
          "It disables interrupts for the waiting process",
          "It is used only to detect deadlock, not to prevent it",
        ],
        correctIndex: 1,
        explanation: "When both flags are true (both processes want in), 'turn' breaks the tie: whichever process set turn LAST is the one that waits, guaranteeing exactly one proceeds.",
      },
    ],
    numericals: [
      {
        question: "Process A's critical-section prelude has 3 instructions and Process B's has 4, each internally ordered. With no synchronization, how many distinct interleavings of the combined instruction stream are possible?",
        answerMin: 35,
        answerMax: 35,
        unit: "interleavings",
        solution: `  Total slots = 3 + 4 = 7
  Choose which 3 of the 7 slots belong to A (the rest, in order, are B's)

    C(7,3) = 7! / (3! x 4!) = (7 x 6 x 5) / (3 x 2 x 1) = 35

35 distinct interleavings from just 3 and 4 instructions - which is
exactly why correctness is argued formally (mutual exclusion / progress
/ bounded waiting) rather than checked case by case.`,
      },
    ],
  },

  "semaphores-and-monitors": {
    difficulty: "Hard",
    estimatedMinutes: 40,
    xpReward: 30, coinReward: 12,
    // Verified real (title confirmed via direct fetch, 2026-08-13).
    resources: [{
      kind: "video",
      title: "4.8 Semaphores in Process Synchronization in OS",
      url: "https://www.youtube.com/watch?v=VcVbUbPNIfw",
      description: "Whole video covers this topic from the start.",
    }],
    whatYoullLearn: [
      "What a semaphore actually is: an integer plus two atomic operations",
      "Binary versus counting semaphores, and what each models",
      "Solving producer-consumer correctly with three semaphores",
      "Monitors as a higher-level, compiler-enforced alternative to raw semaphores",
    ],
    prerequisites: ["Concurrency and Synchronization"],
    concept: `## A Parking Garage With A Sign-In Sheet

::: story
Imagine a parking garage with exactly N spots and a sign-in sheet at the barrier. Every car that enters signs in and takes a spot; every car that leaves signs out and frees one. If the sheet says zero spots are free, the barrier stays down and the next car waits - no argument, no guessing, no two cars fighting over the same spot.

A **semaphore** is that sign-in sheet, formalised: an integer counting available "spots," with exactly two operations allowed to touch it, both atomic.
:::

::: remember
A semaphore S is an integer variable accessed only through **wait(S)** (also called P) and **signal(S)** (also called V):

wait(S): decrement S; if S is now negative, the calling process blocks.
signal(S): increment S; if some process was blocked on S, wake one of them.

Both operations are indivisible - no interleaving is possible mid-operation, which is exactly the atomicity the previous lesson showed a plain boolean cannot provide.
:::

## Binary Versus Counting

::: cards Two flavours, two purposes
Binary semaphore :: Only ever 0 or 1. Used exactly like a lock/mutex - one resource, one owner at a time.
Counting semaphore :: Can range over N+1 values (0 to N). Used for N interchangeable resources - N parking spots, N buffer slots, N identical printers.
:::

::: mistake
A semaphore is not automatically released the way a monitor's lock is. If a process calls wait(S) and then exits (or crashes, or takes an error path) before calling signal(S), that resource is leaked forever - every future wait(S) will block, permanently. Every wait() needs a matching signal() on EVERY code path, including error paths.
:::

## Producer-Consumer, Solved Properly

::: cards Three semaphores, three jobs
mutex :: Binary, initial value 1. Protects the buffer itself from concurrent access.
empty :: Counting, initial value N (buffer capacity). Counts empty slots. The producer waits on this before adding.
full :: Counting, initial value 0. Counts filled slots. The consumer waits on this before removing.
:::

::: checkpoint
In the standard producer-consumer solution, why must the producer call wait(empty) and wait(mutex) in THAT order, not the reverse?
- ( ) It doesn't matter, either order works
- (x) If mutex were acquired first and the buffer turns out to be full, the producer would block while HOLDING mutex, permanently locking the consumer out too - a deadlock
- ( ) wait(mutex) must always be called first by convention
- ( ) empty must be checked after the item is already in the buffer
> Acquiring the resource-availability semaphore (empty) before the mutual-exclusion semaphore (mutex) means a producer that has to wait does so WITHOUT holding mutex - leaving the consumer free to drain the buffer and eventually signal empty, breaking the wait.
:::

## Monitors: The Same Discipline, Enforced By The Language

::: cards What a monitor bundles
Shared data + procedures :: A monitor is a module containing shared variables and the only procedures allowed to touch them.
Automatic mutual exclusion :: Only one process can be executing inside any of the monitor's procedures at a time - the compiler/runtime enforces this, so you cannot forget a lock() call.
Condition variables :: wait() and signal() on a named condition, used for waiting on something OTHER than mutual exclusion (e.g. "buffer not full") - not the same wait/signal as semaphores, despite the shared names.
:::

::: tip
The practical selling point of monitors over raw semaphores: you cannot forget to release a monitor's lock, because the language itself releases it when you leave the procedure. Every "forgot to call signal()" bug the previous section warned about is structurally impossible inside a correctly used monitor.
:::`,
    deepDive: `## Dining Philosophers: The Standard Stress Test

Five philosophers sit around a table with five forks, one between each pair. Each needs BOTH forks beside them to eat. This toy problem is the standard way synchronization schemes get stress-tested, because the naive solution ("pick up left fork, then right fork") deadlocks if every philosopher picks up their left fork at once - now everyone holds one fork and waits forever for the second.

::: cards Fixes GATE expects you to recognise
Resource ordering :: Make at least one philosopher pick up their right fork first, breaking the symmetry that caused the circular wait.
Limit concurrent diners :: Allow at most 4 of the 5 philosophers to attempt picking up forks at once (via a counting semaphore initialised to 4) - guaranteeing at least one succeeds.
Use a monitor :: Model "pick up both forks" as one atomic monitor procedure, so no philosopher can ever be seen holding just one fork.
:::

## Hoare Versus Mesa Monitor Semantics

When a process inside a monitor calls signal() on a condition and wakes a waiter, who runs next - the waker or the woken?

::: cards Two conventions
Hoare semantics :: The signaled process runs IMMEDIATELY, and the signaler waits. Simpler to reason about, but rarely implemented as-is in real systems.
Mesa semantics (used by almost every real system, including Java's synchronized) :: The signaler keeps running; the woken process merely becomes eligible again and must recheck its condition before proceeding - which is exactly why condition waits are always written as a while loop, not an if.
:::`,
    codeExample: {
      language: "c",
      code: `#include <semaphore.h>
#include <pthread.h>

#define N 5
int buffer[N];
sem_t empty, full, mutex;   /* initialised to N, 0, 1 respectively */

void producer(int item) {
    sem_wait(&empty);   /* wait for a free slot   */
    sem_wait(&mutex);   /* THEN lock the buffer   */
    /* ... add item to buffer ... */
    sem_post(&mutex);
    sem_post(&full);     /* signal one more filled slot */
}

void consumer(void) {
    sem_wait(&full);     /* wait for a filled slot */
    sem_wait(&mutex);    /* THEN lock the buffer   */
    /* ... remove item from buffer ... */
    sem_post(&mutex);
    sem_post(&empty);    /* signal one more free slot */
}`,
      expectedOutput: `No printed output - this is the standard bounded-buffer protocol.
Correctness: the producer never blocks while holding mutex (empty is
checked first), so the consumer can always make progress and vice versa.`,
    },
    workedExamples: [
      {
        title: "Tracing semaphore values through three operations",
        problem: "A bounded buffer has capacity 4. Semaphores start at empty=4, full=0, mutex=1. Trace the values of empty and full after: (1) the producer adds one item, (2) the producer adds a second item, (3) the consumer removes one item.",
        solution: `Start:  empty = 4, full = 0

(1) Producer adds an item:
    wait(empty): empty = 4 - 1 = 3
    wait(mutex), add item, signal(mutex)
    signal(full): full = 0 + 1 = 1
    -> empty = 3, full = 1

(2) Producer adds a second item:
    wait(empty): empty = 3 - 1 = 2
    signal(full): full = 1 + 1 = 2
    -> empty = 2, full = 2

(3) Consumer removes one item:
    wait(full): full = 2 - 1 = 1
    signal(empty): empty = 2 + 1 = 3
    -> empty = 3, full = 1

Final state: empty = 3, full = 1 - meaning 1 item sits in the buffer and 3 slots remain free, which matches reality (2 added, 1 removed = 1 remaining).`,
      },
    ],
    analogies: [
      "A counting semaphore is the parking garage's sign-in sheet: N spots, one atomic sign-in/sign-out operation each, and the barrier physically cannot let in a car when the count hits zero.",
      "A monitor is a library's single reading room with one librarian at the door: only one patron is ever let inside at a time, and the librarian - not the patron - is the one who enforces it, so nobody can 'forget' to leave properly.",
    ],
    commonMistakes: [
      "Calling wait(mutex) before wait(empty)/wait(full) in producer-consumer, which lets a process block while holding mutex and deadlock its counterpart.",
      "Forgetting a matching signal() on an error or early-return path, permanently leaking a resource count.",
      "Treating a monitor's condition-variable wait/signal as identical to semaphore wait/signal - they serve a different purpose (waiting on a condition, not counting resources) and, under Mesa semantics, require re-checking the condition in a while loop after waking.",
      "Assuming a binary semaphore and a mutex lock are interchangeable in every respect - a mutex is typically owned only by the thread that locked it, while a binary semaphore can legally be signaled by a different thread than the one that waited.",
      "Believing semaphore operations are safe if 'mostly' atomic. wait() and signal() must be fully atomic, or the same race conditions from the previous lesson reappear inside the semaphore implementation itself.",
    ],
    memoryTricks: [
      "P and V come from Dutch: P = 'proberen' (to test/try, i.e. wait), V = 'verhogen' (to increment, i.e. signal).",
      "Producer-consumer order: wait(empty/full) BEFORE wait(mutex) - resource check first, lock second - to avoid blocking while holding the lock.",
      "Binary semaphore = mutex-like (0/1). Counting semaphore = N interchangeable resources.",
    ],
    formulas: [
      "Semaphore invariant for a counting semaphore over N resources: 0 <= S <= N at all times.",
      "Producer-consumer initial values: empty = buffer capacity N, full = 0, mutex = 1.",
      "Number of processes that can be simultaneously inside a monitor's procedures = 1, by construction (equivalent to a binary semaphore of 1 around every entry).",
    ],
    shortcuts: [
      "If a producer-consumer question's semaphore order has mutex acquired first, mark it broken immediately - it's the classic deadlock-by-ordering trap.",
      "For 'trace the semaphore value' numericals, just track empty/full as running totals of adds and removes - no need to re-derive the protocol each time.",
    ],
    pyqRelevance: `Semaphore questions come in two shapes: trace-the-value numericals (given a sequence of wait/signal calls, find the final semaphore value or determine if a process blocks), and correctness questions (is this producer-consumer solution correct, and if not, which line is wrong).

Monitor questions are usually conceptual - contrasting monitors with semaphores, or asking what happens under Mesa semantics when several processes are woken by one signal (answer: they must recheck the condition, since only one can actually proceed).

The dining philosophers problem, if it appears, is almost always asking for the fix (resource ordering, or limiting concurrent diners to n-1) rather than the failure mode.`,
    interviewConnection: `sem_wait/sem_post (or their language equivalent - Java's Semaphore class, Python's threading.Semaphore) show up directly in concurrent-programming interview questions, and producer-consumer with a bounded queue is one of the most commonly asked "implement this" exercises.

Monitors are the conceptual ancestor of every "synchronized" block or "with lock:" statement in modern languages - understanding why they exist (to make forgetting to release a lock structurally impossible) explains why those language features look the way they do.`,
    revisionSummary: `A semaphore is an integer accessed only via wait() (decrement, block if negative) and signal() (increment, wake a waiter), both atomic. Binary semaphores (0/1) act like locks; counting semaphores (0..N) manage N interchangeable resources.

Producer-consumer needs three semaphores: mutex (buffer protection), empty (free slots, init N), full (filled slots, init 0) - and empty/full must be waited on BEFORE mutex, or a process can block while holding the lock and deadlock the other side.

A monitor bundles shared data with the only procedures allowed to touch it, enforcing mutual exclusion automatically, plus condition variables for waiting on things other than mutual exclusion itself. Under Mesa semantics (the common real-world case), a woken process must recheck its condition in a while loop, since it isn't guaranteed to run immediately.`,
    shortNotes: {
      fiveMinute: "Semaphore = integer + atomic wait()/signal(). Binary (0/1) = mutex-like. Counting (0..N) = N resources. Producer-consumer: mutex + empty(init N) + full(init 0); MUST wait(empty/full) before wait(mutex) to avoid deadlock. Monitor = shared data + procedures with automatic mutual exclusion + condition variables. Mesa semantics: recheck condition in a while loop after waking (most real systems). Dining philosophers fixed by resource ordering or limiting to n-1 concurrent diners.",
      oneMinute: "Semaphore = integer + atomic wait/signal. Binary=mutex-like, counting=N resources. Producer-consumer: wait(empty/full) BEFORE wait(mutex). Monitor = auto mutual exclusion + condition variables; Mesa = recheck condition in while loop.",
      nightBefore: "wait(empty/full) before wait(mutex), always. Monitor = built-in mutual exclusion. Mesa = recheck condition (while, not if).",
    },
    keyPoints: [
      "A semaphore is an integer variable modified only through atomic wait() (decrement, block if negative) and signal() (increment, wake a waiter) operations.",
      "Binary semaphores (0/1) behave like a lock; counting semaphores (0 to N) manage N interchangeable resources.",
      "Producer-consumer needs mutex + empty + full, with empty/full waited on BEFORE mutex to prevent a process blocking while holding the lock.",
      "A monitor bundles shared data with the only procedures that may touch it, enforcing mutual exclusion automatically - unlike semaphores, you cannot forget to release it.",
      "Under Mesa semantics (used by nearly all real systems), a woken process must recheck its condition in a while loop rather than assuming it can proceed immediately.",
    ],
    mcqs: [
      {
        question: "What is the key difference between a binary semaphore and a counting semaphore?",
        options: [
          "Binary semaphores can only be used by two processes",
          "A binary semaphore takes only values 0/1 (like a lock); a counting semaphore ranges over 0..N to manage N interchangeable resources",
          "Counting semaphores are always faster",
          "There is no functional difference",
        ],
        correctIndex: 1,
        explanation: "A binary semaphore models exclusive access to one resource, while a counting semaphore tracks how many of N identical resources are currently available.",
      },
      {
        question: "In the standard producer-consumer solution, why must wait(empty) happen before wait(mutex) in the producer?",
        options: [
          "It doesn't matter, any order is correct",
          "So the producer never blocks on a full buffer while holding the mutex, which would deadlock the consumer",
          "Because empty must always be checked last",
          "To make the code run faster",
        ],
        correctIndex: 1,
        explanation: "If mutex were acquired first, a producer blocking because the buffer is full would hold mutex indefinitely, preventing the consumer from ever removing an item and freeing a slot - a deadlock.",
      },
      {
        question: "Under Mesa monitor semantics, what must a process do immediately after being woken from a condition wait?",
        options: [
          "Proceed immediately, since it is guaranteed the condition now holds",
          "Recheck the condition (typically in a while loop), since another process may have run first and invalidated it",
          "Re-acquire a semaphore, since monitors do not use locks",
          "Terminate, since Mesa semantics forbid resuming a waiting process",
        ],
        correctIndex: 1,
        explanation: "Under Mesa semantics the signaler keeps running and the woken process only becomes eligible - by the time it actually runs, some other process may have changed the state again, so the condition must be rechecked.",
      },
    ],
    numericals: [
      {
        question: "A bounded buffer has capacity 6 (empty starts at 6, full starts at 0). The producer adds 4 items, then the consumer removes 2 items. What is the value of 'full' after these operations?",
        answerMin: 2,
        answerMax: 2,
        unit: "",
        solution: `  Start: empty = 6, full = 0

  Producer adds 4 items: each add does wait(empty), signal(full)
    full: 0 -> 1 -> 2 -> 3 -> 4

  Consumer removes 2 items: each removal does wait(full), signal(empty)
    full: 4 -> 3 -> 2

  Final full = 2

(This matches reality: 4 added, 2 removed, 2 items remain in the buffer.)`,
      },
    ],
  },

  // ---------------- Deadlock ----------------

  "deadlock": {
    difficulty: "Hard",
    estimatedMinutes: 40,
    xpReward: 30, coinReward: 12,
    // Verified real (title confirmed via direct fetch, 2026-08-13).
    resources: [{
      kind: "video",
      title: "Deadlocks | Chapter-7 | Operating System - Neso Academy",
      url: "https://www.youtube.com/watch?v=7bnpFpYZtVk",
      description: "Whole video covers this topic from the start.",
    }],
    whatYoullLearn: [
      "The four Coffman conditions, and why deadlock needs all four at once",
      "Resource allocation graphs, and when a cycle actually means deadlock",
      "The three strategies for handling deadlock: prevention, avoidance, detection and recovery",
      "The Banker's algorithm's safety check, traced step by step",
    ],
    prerequisites: ["Semaphores and Monitors"],
    concept: `## Two Cars, One Bridge, Neither Reverses

::: story
Two cars meet nose-to-nose on a narrow one-lane bridge. Each is blocking the other's only way forward. Neither can go around, and neither is willing to reverse first. They will sit there forever unless something outside the situation intervenes.

That is **deadlock**: a set of processes, each holding a resource the next one needs, waiting in a cycle that will never break on its own.
:::

::: remember
A deadlock is a state where every process in a set is waiting for a resource held by another process in the same set, so **none of them can ever proceed**, no matter how long they wait.
:::

## The Four Coffman Conditions - ALL Must Hold

::: cards Every one of these is necessary
Mutual exclusion :: At least one resource is held in a non-shareable way - only one process can use it at a time.
Hold and wait :: A process is holding at least one resource while waiting to acquire additional resources held by others.
No preemption :: A resource can only be released voluntarily by the process holding it - the OS cannot forcibly take it back.
Circular wait :: There exists a cycle of processes, each waiting for a resource held by the next one in the cycle.
:::

::: mistake
Deadlock cannot occur unless **all four** conditions hold simultaneously - not three, not "most of them." This is the single most commonly tested fact in this topic. It also means breaking deadlock only requires ensuring ONE of the four never holds; you do not need to attack all four at once.
:::

## Resource Allocation Graphs

::: cards Reading a RAG
Process node -> Resource node :: A request edge - the process wants that resource.
Resource node -> Process node :: An assignment edge - that resource is currently held by the process.
Single instance per resource type :: A cycle in the graph is both necessary AND sufficient for deadlock.
Multiple instances per resource type :: A cycle is necessary but NOT sufficient - the cycle might still resolve if a currently-held instance becomes free along the way.
:::

::: checkpoint
A resource allocation graph has a cycle, and every resource type involved has more than one instance. Can you conclude deadlock exists?
- ( ) Yes, a cycle always means deadlock
- (x) Not necessarily - with multiple instances per resource type, a cycle is necessary but not sufficient for deadlock
- ( ) No, cycles are impossible with multiple instances
- ( ) Only if there are at least 4 processes in the cycle
> With single-instance resources a cycle guarantees deadlock, but with multiple instances, another process outside the cycle might still release an instance that lets someone in the cycle proceed, breaking it. You must check further (e.g. via the detection algorithm) before concluding deadlock.
:::

## Three Ways To Handle It

::: cards Prevention, avoidance, detection+recovery
Prevention :: Structurally deny one of the four Coffman conditions so deadlock becomes impossible - e.g. force all processes to request resources in one fixed global order, which eliminates circular wait.
Avoidance :: Allow all four conditions to be possible, but never grant a request that would move the system into an unsafe state. The Banker's Algorithm is the standard example - it checks, before granting, whether a safe sequence still exists.
Detection and recovery :: Allow deadlock to happen, periodically check for it (cycle detection / graph reduction), and recover by preempting resources or terminating processes when found.
:::

::: tip
GATE frequently asks you to name which of the four conditions a given prevention technique denies. "Request all resources at once, up front" denies hold-and-wait. "Impose a global resource ordering" denies circular wait. Match the technique to the condition, not to a vague notion of "preventing deadlock."
:::`,
    deepDive: `## The Banker's Algorithm, Mechanically

The Banker's Algorithm decides whether granting a resource request would leave the system in a **safe state** - one where SOME order exists in which every process can still finish, even in the worst case.

::: cards The matrices involved
Allocation :: What each process currently holds, per resource type.
Max :: The maximum each process could ever request, per resource type (declared up front).
Need :: Max - Allocation - what each process might still ask for.
Available :: What's left unallocated, per resource type.
:::

::: behind
Safety check algorithm: find any process whose Need is entirely <= Available. Pretend it runs to completion and releases everything it holds (Available += that process's Allocation). Repeat with the now-larger Available. If every process gets found and finished this way, the state is safe and a safe sequence exists. If you get stuck with no process satisfiable, the state is unsafe - NOT necessarily deadlocked yet, but one bad request away from it.
:::

## Detection: Graph Reduction

For resource-allocation graphs with multiple instances, deadlock detection also proceeds by "pretending to finish" processes whose needs can currently be satisfied, removing their edges, and repeating. Any process left with unremovable edges at the end is genuinely deadlocked - this is the same reasoning as the Banker's safety check, just applied after the fact instead of before granting a request.`,
    codeExample: {
      language: "c",
      code: `/* Classic lock-ordering deadlock: two threads, two mutexes,
   acquired in OPPOSITE order - the textbook real-world case */
#include <pthread.h>

pthread_mutex_t A = PTHREAD_MUTEX_INITIALIZER;
pthread_mutex_t B = PTHREAD_MUTEX_INITIALIZER;

void *thread1(void *arg) {
    pthread_mutex_lock(&A);
    /* ... window where thread2 can run ... */
    pthread_mutex_lock(&B);   /* waits here if thread2 holds B */
    /* critical section using both resources */
    pthread_mutex_unlock(&B);
    pthread_mutex_unlock(&A);
    return NULL;
}

void *thread2(void *arg) {
    pthread_mutex_lock(&B);
    /* ... window where thread1 can run ... */
    pthread_mutex_lock(&A);   /* waits here if thread1 holds A */
    pthread_mutex_unlock(&A);
    pthread_mutex_unlock(&B);
    return NULL;
}
/* If thread1 gets A and thread2 gets B before either gets the second
   lock, each now waits forever for a lock the other holds: circular
   wait, plus mutual exclusion, hold-and-wait, and no preemption - all
   four Coffman conditions, hence deadlock. FIX: always lock in the
   same global order (e.g. always A before B) in every thread. */`,
      expectedOutput: `No output - both threads hang forever. This IS the bug, demonstrated
in real, compilable code: fixing it means locking A before B in
BOTH functions, which denies circular wait by construction.`,
    },
    workedExamples: [
      {
        title: "Spotting deadlock from a resource allocation graph description",
        problem: "Process P1 holds R1 and requests R2. Process P2 holds R2 and requests R1. Both R1 and R2 have exactly one instance. Is this system deadlocked?",
        solution: `Draw the edges:
  R1 -> P1   (P1 holds R1)
  P1 -> R2   (P1 requests R2)
  R2 -> P2   (P2 holds R2)
  P2 -> R1   (P2 requests R1)

Following the edges: P1 -> R2 -> P2 -> R1 -> P1. This is a cycle.

Since both resource types have a SINGLE instance each, a cycle in the resource allocation graph is both necessary and sufficient for deadlock. Yes, this system is deadlocked - P1 will never get R2 (P2 has it and won't release it until getting R1), and P2 will never get R1 (P1 has it and won't release it until getting R2).

Note the single-instance qualifier: if either resource type had a second instance available elsewhere, the cycle alone would not be enough to conclude deadlock.`,
      },
    ],
    dryRun: `Run the Banker's Algorithm safety check for 3 processes and 1 resource type with 10 total instances.

  Allocation:  P0=2, P1=3, P2=2      (sum = 7, so Available = 10 - 7 = 3)
  Max:         P0=6, P1=5, P2=4
  Need = Max - Allocation:  P0=4, P1=2, P2=2

::: timeline Safety check
Available = 3 :: Look for a process whose Need <= Available. P0 needs 4 (too much), P1 needs 2 (fits!), P2 needs 2 (fits!). Pick P1 first (either works; pick the one that unblocks the most, as a tie-break habit).
Run P1, it finishes and releases :: Available = 3 - 2 (used) + 3 (returned, its full Allocation) = 3 + 3 = 6. Wait - correctly: Available increases by P1's ALLOCATION when it finishes: 3 + 3 = 6.
Look again with Available = 6 :: P0 needs 4 (fits now!), P2 needs 2 (fits). Pick P0.
Run P0, it finishes and releases :: Available = 6 + 2 (P0's allocation) = 8.
Look again with Available = 8 :: P2 needs 2 (fits).
Run P2, it finishes and releases :: Available = 8 + 2 = 10. Everything is back.
:::

Safe sequence found: **P1, P0, P2**. Since every process could be scheduled to finish, the state is SAFE - granting whatever request led to this Allocation/Max snapshot was a safe decision. If NO process's Need had fit at some point with processes still remaining, the state would be unsafe.`,
    analogies: [
      "Deadlock is two cars stopped nose-to-nose on a one-lane bridge, each blocking the other's only way forward, with neither willing to reverse - nothing external forces either of them to yield.",
      "The Banker's Algorithm is a literal bank manager refusing a loan if approving it could leave the bank unable to satisfy some customer's maximum possible future withdrawal, even in the worst realistic case.",
    ],
    commonMistakes: [
      "Forgetting that ALL FOUR Coffman conditions must hold simultaneously for deadlock - breaking any single one is sufficient to prevent it.",
      "Assuming a cycle in a resource allocation graph always means deadlock. That's only guaranteed for single-instance resource types; with multiple instances a cycle is necessary but not sufficient.",
      "Confusing deadlock with starvation. A starved process is merely repeatedly passed over (it CAN eventually run); a deadlocked process mathematically cannot ever proceed without outside intervention.",
      "Treating an 'unsafe' state (Banker's Algorithm) as the same thing as a deadlocked state. Unsafe means SOME sequence of future requests could lead to deadlock - it has not happened yet.",
      "Believing the Banker's Algorithm reacts after the fact. It is an avoidance technique - it checks safety BEFORE granting a request, never after.",
    ],
    memoryTricks: [
      "Deadlock needs all four: Mutual exclusion, Hold-and-wait, No preemption, Circular wait - remember it as 'MHNC', and remove just ONE to prevent deadlock.",
      "Single instance + cycle = deadlock, guaranteed. Multiple instances + cycle = maybe - check further.",
      "Banker's Algorithm: pretend the smallest-Need process finishes first, give its resources back, repeat. If everyone finishes this way, it's safe.",
    ],
    formulas: [
      "Need[i] = Max[i] - Allocation[i], for each resource type.",
      "A request by process i is grantable only if Request[i] <= Need[i] AND Request[i] <= Available.",
      "Safety check: repeatedly find a process with Need <= Available, simulate its completion (Available += its Allocation), until all processes finish (safe) or none can proceed (unsafe).",
    ],
    shortcuts: [
      "When asked 'which Coffman condition does this prevention technique deny', match the technique's effect directly: resource ordering -> circular wait, request-all-upfront -> hold-and-wait, preemptible resources -> no preemption.",
      "For single-instance RAG questions, just hunt for a cycle - it fully answers the deadlock question. For multi-instance RAGs, run the reduction/safety check instead of trusting the cycle alone.",
    ],
    pyqRelevance: `Deadlock is one of the heaviest-weighted OS topics: expect both a conceptual MCQ (Coffman conditions, RAG cycle rules, which strategy is which) and a Banker's Algorithm numerical almost every year.

Banker's Algorithm numericals typically give Allocation and Max matrices plus total resources, and ask for the safe sequence, whether a specific state is safe, or whether a specific request can be immediately granted - all solved by the same safety-check procedure.

RAG questions with multiple resource instances specifically test the "cycle is not sufficient" nuance - GATE has used this as a deliberate trap more than once.`,
    interviewConnection: `Real production deadlocks are almost always the two-mutex, opposite-order case shown in the code example above, and "how would you prevent database/lock deadlocks" is a standard systems-design interview question - the standard answer is exactly Coffman-condition denial: impose a consistent lock ordering across the whole codebase (denies circular wait).

Distributed systems take this further with deadlock detection across multiple machines (no shared clock, no single resource graph), which is a direct, harder extension of the graph-reduction idea covered here.`,
    revisionSummary: `Deadlock: a set of processes each waiting for a resource held by another in the set, unable to ever proceed without outside intervention.

Requires all four Coffman conditions simultaneously: mutual exclusion, hold-and-wait, no preemption, circular wait. Removing any ONE prevents deadlock.

Resource allocation graph: with single-instance resources, a cycle = deadlock (necessary and sufficient). With multiple instances, a cycle is necessary but not sufficient.

Three handling strategies: prevention (structurally deny one condition), avoidance (Banker's Algorithm - only grant requests that keep the system in a safe state), detection and recovery (allow it, detect via graph reduction, recover by preemption or termination).

Banker's safety check: repeatedly find a process with Need <= Available, simulate its finish, add its Allocation back to Available, repeat until all finish (safe) or stuck (unsafe).`,
    shortNotes: {
      fiveMinute: "Deadlock = circular wait for resources, unresolvable without intervention. Needs ALL 4 Coffman conditions: mutual exclusion, hold-and-wait, no preemption, circular wait - remove any one to prevent it. RAG: single-instance cycle = deadlock; multi-instance cycle = necessary but not sufficient. Strategies: prevention (deny a condition), avoidance (Banker's Algorithm, safety check before granting), detection+recovery (find cycles/graph-reduce after the fact, then preempt or kill). Banker's: Need=Max-Allocation; simulate finishing processes with Need<=Available, growing Available, until all finish (safe) or stuck (unsafe).",
      oneMinute: "Deadlock needs all 4 Coffman conditions (MHNC). Single-instance RAG cycle = deadlock; multi-instance cycle = maybe. Prevention/avoidance(Banker's)/detection+recovery. Banker's: Need=Max-Alloc, simulate smallest-Need-first, safe if all finish.",
      nightBefore: "All 4 Coffman conditions needed. Single-instance cycle = deadlock; multi-instance = check further. Banker's: Need<=Available -> simulate finish -> repeat.",
    },
    keyPoints: [
      "Deadlock is a set of processes each waiting for a resource held by another in the same set, unable to proceed without outside intervention.",
      "All four Coffman conditions - mutual exclusion, hold-and-wait, no preemption, circular wait - must hold simultaneously; denying any one prevents deadlock.",
      "In a resource allocation graph with single-instance resource types, a cycle is both necessary and sufficient for deadlock; with multiple instances, a cycle is necessary but not sufficient.",
      "Three strategies: prevention (structurally deny a condition), avoidance (Banker's Algorithm - grant only requests that preserve a safe state), detection and recovery (find deadlock after the fact and break it).",
      "The Banker's Algorithm's safety check repeatedly finds a process whose Need fits within Available, simulates its completion, and grows Available - reaching every process means the state is safe.",
    ],
    mcqs: [
      {
        question: "Which of the following is a correct statement about the four Coffman conditions?",
        options: [
          "Deadlock can occur if any three of the four conditions hold",
          "Deadlock requires all four conditions - mutual exclusion, hold-and-wait, no preemption, and circular wait - to hold simultaneously",
          "Only circular wait is necessary for deadlock",
          "The four conditions apply only to single-instance resources",
        ],
        correctIndex: 1,
        explanation: "All four conditions are individually necessary; if even one is absent, deadlock cannot occur. This is why prevention techniques only need to structurally deny one of the four.",
      },
      {
        question: "A resource allocation graph has a cycle, and one of the resource types involved has 3 instances. What can you conclude?",
        options: [
          "Deadlock is certain",
          "Deadlock is impossible",
          "Deadlock is possible but not certain - further checking (e.g. graph reduction) is needed",
          "The graph is drawn incorrectly, since cycles cannot occur with multiple instances",
        ],
        correctIndex: 2,
        explanation: "With multiple instances per resource type, a cycle is necessary but not sufficient for deadlock - some process outside the cycle might still release an instance that breaks it.",
      },
      {
        question: "What does the Banker's Algorithm do when a process requests additional resources?",
        options: [
          "It always grants the request immediately if resources are available",
          "It simulates granting the request and checks whether the resulting state is still safe before actually granting it",
          "It kills the requesting process to prevent deadlock",
          "It waits for a fixed timeout before deciding",
        ],
        correctIndex: 1,
        explanation: "The Banker's Algorithm is an avoidance technique: it only grants a request if doing so leaves the system in a safe state (a state from which all processes can still finish in some order); otherwise it makes the process wait.",
      },
    ],
    numericals: [
      {
        question: "A system has 1 resource type with 12 total instances. Three processes have Allocation = {P0: 3, P1: 2, P2: 2} and Max = {P0: 9, P1: 4, P2: 7}. What is Available?",
        answerMin: 5,
        answerMax: 5,
        unit: "instances",
        solution: `  Total allocated = 3 + 2 + 2 = 7
  Available = Total instances - Total allocated = 12 - 7 = 5

  (Need, for reference: P0 = 9-3 = 6, P1 = 4-2 = 2, P2 = 7-2 = 5.
  With Available = 5, only P1 (Need 2) and P2 (Need 5) currently fit;
  P0 needs 6, which exceeds Available until someone else finishes first.)`,
      },
    ],
  },

  // ---------------- Scheduling ----------------

  "cpu-scheduling": {
    difficulty: "Hard",
    estimatedMinutes: 45,
    xpReward: 30, coinReward: 12,
    // Verified real (title confirmed via direct fetch, 2026-08-13).
    resources: [{
      kind: "video",
      title: "Introduction to CPU Scheduling - Neso Academy",
      url: "https://www.youtube.com/watch?v=EWkQl0n0w5M",
      description: "Whole video covers this topic from the start.",
    }],
    whatYoullLearn: [
      "Preemptive versus non-preemptive scheduling, and what changes when the OS can interrupt a running process",
      "FCFS, SJF/SRTF, Round Robin, and Priority scheduling - how each one picks the next process",
      "Computing average waiting and turnaround time for a given algorithm, step by step",
      "The convoy effect and starvation - which algorithms cause them, and how each is fixed",
    ],
    prerequisites: ["Deadlock"],
    concept: `## One CPU, One Lane, A Traffic Officer Deciding Who Goes Next

::: story
The CPU is a single-lane junction. Every ready process is a car waiting to cross. Different traffic officers (scheduling algorithms) run the junction differently: one lets cars through strictly in arrival order, another waves through whoever needs the least time to clear the junction, another gives everyone a fixed number of seconds before making them wait their turn again.

Same junction, same cars - wildly different average wait depending on which officer is on duty. That's the entire subject: CPU scheduling is the policy for deciding which ready process runs next.
:::

::: remember
CPU scheduling picks which process in the Ready queue gets the CPU next, and for how long, using only information already available: burst time, arrival time, priority, or how much has already run.
:::

## Preemptive Versus Non-Preemptive

::: cards The one distinction that changes everything
Non-preemptive :: Once a process gets the CPU, it keeps it until it finishes or voluntarily blocks (e.g. for I/O). The scheduler only acts when the CPU becomes free.
Preemptive :: The OS can forcibly take the CPU away from a running process - on a timer interrupt, or when a higher-priority/shorter process arrives - and give it to someone else.
:::

## The Algorithms

::: cards How each one picks
FCFS (First-Come, First-Served) :: Simplest possible rule: whoever arrived first runs first, non-preemptive, no exceptions. Simple and fair-looking, but suffers the convoy effect.
SJF (Shortest Job First) :: Non-preemptive; among the processes currently in Ready, always pick the one with the shortest CPU burst. Provably minimizes average waiting time when all processes are compared at once - but requires knowing burst times in advance, which is rarely exact in practice.
SRTF (Shortest Remaining Time First) :: The preemptive version of SJF - if a new arrival has a shorter remaining burst than what's currently running, preempt immediately.
Round Robin (RR) :: Preemptive, time-sliced: each process gets a fixed quantum, then is preempted and sent to the back of the Ready queue if not finished. Fair by construction, at the cost of context-switch overhead.
Priority scheduling :: Each process has a priority number; the highest-priority ready process runs. Can be preemptive or non-preemptive, and is vulnerable to starvation unless fixed.
:::

::: mistake
The **convoy effect**: under FCFS, one long CPU-bound process ahead in the queue forces every short process behind it to wait far longer than its own burst time would suggest - a handful of quick jobs stuck behind one slow one, inflating average waiting time for everybody.
:::

::: checkpoint
Under SRTF, a process with remaining burst time 8 is currently running. A new process arrives needing only 3 units of CPU time. What happens?
- ( ) The new process waits until the running one finishes, since SRTF is non-preemptive
- (x) The running process is immediately preempted, since the new process's burst (3) is shorter than the running process's REMAINING time (8)
- ( ) Nothing changes unless the new process has higher priority too
- ( ) The scheduler flips a coin
> SRTF compares remaining time, not original burst time, and always preempts in favour of whichever process needs the CPU for the shortest remaining stretch - that's what the "preemptive" in SRTF means.
:::

::: tip
Priority scheduling can starve a low-priority process forever if higher-priority processes keep arriving. The standard fix is **aging**: gradually increase a waiting process's priority the longer it waits, guaranteeing it eventually becomes the highest priority in the queue.
:::`,
    deepDive: `## SJF Is Optimal - But Only Under One Condition

SJF (and SRTF) provably minimizes average waiting time **among all processes available for scheduling at the same decision point**. This optimality result is exactly why it's the benchmark every other algorithm gets compared against, even though it's rarely used unmodified in practice (predicting exact burst times ahead of time is unrealistic - real systems approximate it instead, e.g. via exponential averaging of past bursts).

## Multilevel Queues And Feedback

::: cards Beyond a single queue
Multilevel queue :: Ready processes are split into separate queues by category (e.g. interactive vs batch), each with its own scheduling algorithm, and a fixed policy decides how the queues share the CPU between them.
Multilevel feedback queue :: Like multilevel queues, but a process can MOVE between queues based on observed behavior - a CPU-heavy process gradually drops to a lower-priority, longer-quantum queue, while an I/O-bound process that keeps blocking quickly stays in a high-priority, short-quantum queue. This is the closest model to how real general-purpose OS schedulers actually behave.
:::

## Time Quantum: The Round Robin Knob

A quantum that's too large makes Round Robin degrade toward FCFS behavior (each process nearly finishes its burst before being preempted). A quantum that's too small makes context-switch overhead dominate actual work - the CPU spends more time switching than computing. GATE routinely asks you to reason about this trade-off qualitatively rather than compute an "optimal" quantum, since there is no single correct value in general.`,
    codeExample: {
      language: "javascript",
      code: `// FCFS scheduling: compute completion, turnaround, and waiting time
const processes = [
  { name: "P1", arrival: 0, burst: 5 },
  { name: "P2", arrival: 1, burst: 3 },
  { name: "P3", arrival: 2, burst: 8 },
  { name: "P4", arrival: 3, burst: 6 },
];

let clock = 0;
let totalWaiting = 0, totalTurnaround = 0;

for (const p of processes) {
  const start = Math.max(clock, p.arrival);   // CPU may sit idle until arrival
  const completion = start + p.burst;
  const turnaround = completion - p.arrival;
  const waiting = turnaround - p.burst;
  totalWaiting += waiting;
  totalTurnaround += turnaround;
  clock = completion;
  console.log(\`\${p.name}: completion=\${completion} turnaround=\${turnaround} waiting=\${waiting}\`);
}

console.log("avg waiting =", totalWaiting / processes.length);
console.log("avg turnaround =", totalTurnaround / processes.length);`,
      expectedOutput: `P1: completion=5 turnaround=5 waiting=0
P2: completion=8 turnaround=7 waiting=4
P3: completion=16 turnaround=14 waiting=6
P4: completion=22 turnaround=19 waiting=13
avg waiting = 5.75
avg turnaround = 11.25`,
    },
    workedExamples: [
      {
        title: "FCFS average waiting time, by hand",
        problem: "Processes P1(arrival 0, burst 5), P2(arrival 1, burst 3), P3(arrival 2, burst 8), P4(arrival 3, burst 6) are scheduled FCFS. Find the average waiting time.",
        solution: `FCFS runs strictly in arrival order: P1, P2, P3, P4.

  P1: starts 0, runs 5  -> completes 5.  TAT = 5-0=5.  WT = 5-5=0.
  P2: arrives at 1, but CPU free only at 5 -> starts 5, runs 3 -> completes 8.
      TAT = 8-1=7.  WT = 7-3=4.
  P3: arrives at 2, CPU free at 8 -> starts 8, runs 8 -> completes 16.
      TAT = 16-2=14.  WT = 14-8=6.
  P4: arrives at 3, CPU free at 16 -> starts 16, runs 6 -> completes 22.
      TAT = 22-3=19.  WT = 19-6=13.

  Average waiting time = (0 + 4 + 6 + 13) / 4 = 23 / 4 = 5.75
  Average turnaround time = (5 + 7 + 14 + 19) / 4 = 45 / 4 = 11.25

Notice P3 (burst 8) delays P4 by its ENTIRE burst even though P4 only needs 6 - a small, visible instance of the convoy effect.`,
      },
      {
        title: "SJF (non-preemptive) average waiting time, by hand",
        problem: "Four processes all arrive at time 0: P1 (burst 6), P2 (burst 8), P3 (burst 7), P4 (burst 3). Schedule them with non-preemptive SJF and find the average waiting time.",
        solution: `Since all arrive together, SJF simply sorts by burst time, shortest first:
  Order: P4 (3), P1 (6), P3 (7), P2 (8)

  P4: starts 0, runs 3  -> completes 3.  WT = 0.
  P1: starts 3, runs 6  -> completes 9.  WT = 3.
  P3: starts 9, runs 7  -> completes 16. WT = 9.
  P2: starts 16, runs 8 -> completes 24. WT = 16.

  Average waiting time = (0 + 3 + 9 + 16) / 4 = 28 / 4 = 7

Compare this to running the SAME four processes under FCFS in the order P1,P2,P3,P4: average waiting time works out to (0+6+14+21)/4 = 41/4 = 10.25 - noticeably worse, which is exactly the optimality SJF provides when every process is available at once.`,
      },
    ],
    dryRun: `Trace Round Robin with quantum = 4 for P1(burst 5), P2(burst 3), P3(burst 8), P4(burst 6), all arriving at time 0, queue order P1-P2-P3-P4.

::: timeline Gantt chart, one quantum at a time
0-4: P1 runs 4 of 5 :: Remaining 1. Not finished -> sent to back of queue. Queue is now: P2, P3, P4, P1.
4-7: P2 runs 3 of 3 :: Finished exactly within the quantum, completes at time 7. Queue: P3, P4, P1.
7-11: P3 runs 4 of 8 :: Remaining 4 -> back of queue. Queue: P4, P1, P3.
11-15: P4 runs 4 of 6 :: Remaining 2 -> back of queue. Queue: P1, P3, P4.
15-16: P1 runs its last 1 unit :: Finished, completes at time 16. Queue: P3, P4.
16-20: P3 runs its last 4 units :: Finished, completes at time 20. Queue: P4.
20-22: P4 runs its last 2 units :: Finished, completes at time 22. Queue empty - done.
:::

  Completion:  P1=16, P2=7,  P3=20, P4=22   (arrival = 0 for all, so TAT = completion)
  Waiting = TAT - Burst:
    P1: 16-5=11   P2: 7-3=4   P3: 20-8=12   P4: 22-6=16

  Average waiting time    = (11+4+12+16)/4 = 43/4  = 10.75
  Average turnaround time = (16+7+20+22)/4 = 65/4 = 16.25

Compare this to the plain SJF example above (average waiting 7): Round Robin trades a worse average for GUARANTEED fairness - no process ever waits more than (n-1) x quantum before its next turn, which SJF/FCFS make no promise about at all.`,
    analogies: [
      "FCFS is a single checkout line with no express lane - fair in principle, but one shopper with a full cart (a long burst) holds up everyone behind them with just two items, which is the convoy effect in one sentence.",
      "Round Robin is a group project where everyone gets exactly 5 minutes to speak before the mic passes on, cycling back around - nobody dominates the meeting, but nobody who only needed 30 seconds gets to finish early either.",
    ],
    commonMistakes: [
      "Forgetting that the CPU can sit idle if the next arrival hasn't happened yet - completion time is max(CPU-free-time, arrival) + burst, not just previous-completion + burst.",
      "Applying SJF/SRTF without checking arrival times - SJF only picks the shortest burst AMONG PROCESSES THAT HAVE ALREADY ARRIVED, not the shortest burst overall.",
      "In Round Robin, forgetting that a process which arrives DURING another's quantum joins the ready queue before that quantum's process is re-added, if using the common tie-breaking convention - always check the question's stated convention.",
      "Confusing SRTF (preemptive, compares REMAINING time) with SJF (non-preemptive, decided once at start).",
      "Assuming priority scheduling is always preemptive. It can be implemented either way, and the question will specify which.",
    ],
    memoryTricks: [
      "TAT = Completion - Arrival. WT = TAT - Burst. Always compute TAT first, then subtract burst for WT.",
      "SJF/SRTF = optimal average waiting time, but only among processes available AT THE SAME DECISION POINT.",
      "Round Robin quantum too big -> behaves like FCFS. Too small -> death by context-switch overhead. Convoy effect = one big vehicle blocking many small ones behind it (FCFS specifically).",
    ],
    formulas: [
      "Turnaround Time = Completion Time - Arrival Time. Waiting Time = Turnaround Time - Burst Time. Response Time = first CPU allocation - Arrival Time.",
      "Average Waiting Time = (sum of all processes' Waiting Time) / number of processes - same pattern for average Turnaround Time.",
      "FCFS completion time for the k-th process in arrival order = max(previous completion, its arrival) + its burst.",
      "Round Robin: worst-case wait before a process's NEXT turn <= (n - 1) x quantum, for n ready processes.",
    ],
    shortcuts: [
      "Build the Gantt chart first, always - completion times fall out of it directly, and TAT/WT follow mechanically from completion.",
      "For SJF/SRTF questions, re-sort the READY set (not the full process list) at every decision point - arrivals mid-execution can change what's shortest.",
      "If a question only gives burst times and no arrival times, assume all arrive at 0 unless stated otherwise - this turns SJF into a simple sort.",
    ],
    pyqRelevance: `CPU scheduling is one of the most heavily numerically tested OS topics: expect a Gantt-chart-based question (compute average waiting/turnaround time for a given algorithm) most years, often comparing two algorithms on the same process set.

Round Robin questions specifically test whether you can correctly track the queue order through preemptions - a common trap is mishandling a tie between "process finishes exactly at quantum boundary" and "new process arrives at the same instant."

Conceptual questions (convoy effect, SJF optimality condition, starvation and aging, preemptive vs non-preemptive) round out the rest, usually at 1 mark each.`,
    interviewConnection: `Every real OS scheduler (Linux's CFS, Windows' priority scheduler) is a refinement of the ideas here - multilevel feedback queues in particular are the direct ancestor of how modern general-purpose schedulers balance interactive responsiveness against CPU-bound throughput.

"Why might a long-running batch job slow down an interactive application" is really the convoy effect and priority/starvation reasoning applied to a real production complaint, and understanding the underlying scheduling policy is what lets you diagnose it instead of guessing.`,
    revisionSummary: `CPU scheduling picks which Ready process runs next. Non-preemptive: keeps the CPU until it finishes or blocks. Preemptive: the OS can forcibly take it back.

FCFS: simple, but causes the convoy effect. SJF: minimizes average waiting time among processes available at once, but needs known burst times; SRTF is its preemptive version. Round Robin: fixed quantum, fair by construction, but quantum size trades off against context-switch overhead. Priority scheduling: can starve low-priority processes without aging.

Core formulas: TAT = Completion - Arrival. WT = TAT - Burst. Build the Gantt chart first; everything else follows from it.`,
    shortNotes: {
      fiveMinute: "Non-preemptive: keeps CPU till done/blocked. Preemptive: OS can take it back. FCFS = simple, convoy effect. SJF = optimal avg waiting (needs known bursts), non-preemptive; SRTF = its preemptive version, compares REMAINING time. Round Robin = fixed quantum, fair, quantum too big->FCFS-like, too small->overhead. Priority = can starve, fixed by aging. TAT=Completion-Arrival, WT=TAT-Burst. Build the Gantt chart first.",
      oneMinute: "FCFS=convoy effect. SJF/SRTF=optimal avg wait (SRTF compares remaining time, preemptive). RR=fair, quantum trade-off. Priority=starvation, fix=aging. TAT=Completion-Arrival, WT=TAT-Burst.",
      nightBefore: "TAT=Completion-Arrival, WT=TAT-Burst. SJF=optimal avg wait. RR quantum too big=FCFS, too small=overhead. Priority needs aging vs starvation.",
    },
    keyPoints: [
      "Non-preemptive scheduling keeps a process on the CPU until it finishes or blocks; preemptive scheduling lets the OS forcibly reclaim the CPU.",
      "FCFS is simple but causes the convoy effect - one long process delays many short ones behind it.",
      "SJF minimizes average waiting time among processes available at the same decision point; SRTF is its preemptive version, comparing REMAINING time on every new arrival.",
      "Round Robin gives every process a fixed quantum, guaranteeing fairness at the cost of context-switch overhead; quantum size is a real trade-off, not a free parameter.",
      "Priority scheduling can starve low-priority processes indefinitely unless fixed with aging (gradually raising the priority of processes that have waited a long time).",
      "Turnaround Time = Completion - Arrival; Waiting Time = Turnaround - Burst; both are computed from the Gantt chart, which should be built first.",
    ],
    mcqs: [
      {
        question: "Which scheduling algorithm is provably optimal for minimizing average waiting time among a set of processes available at the same time?",
        options: ["FCFS", "SJF", "Round Robin", "Priority scheduling"],
        correctIndex: 1,
        explanation: "SJF (and its preemptive form, SRTF) minimizes average waiting time when all processes being compared are already available - this optimality is the standard benchmark result for this topic.",
      },
      {
        question: "What is the 'convoy effect' in CPU scheduling?",
        options: [
          "Processes deliberately grouping together to reduce context switches",
          "A long CPU-bound process ahead in an FCFS queue forcing many short processes behind it to wait far longer than their own burst suggests",
          "Multiple processes with the same priority running simultaneously",
          "A hardware effect that only appears on multiprocessor systems",
        ],
        correctIndex: 1,
        explanation: "Under FCFS's strict arrival-order policy, one long process blocks every shorter process queued behind it, inflating their waiting time well beyond what their own burst time would suggest.",
      },
      {
        question: "In Round Robin scheduling, what happens if the time quantum is set very large compared to typical burst times?",
        options: [
          "The algorithm behaves like SJF",
          "The algorithm behaves like FCFS, since most processes finish within a single quantum",
          "Starvation becomes guaranteed",
          "Context-switch overhead dominates total time",
        ],
        correctIndex: 1,
        explanation: "If the quantum is larger than nearly every burst, each process effectively runs to completion on its first turn - which is exactly FCFS behavior with extra bookkeeping.",
      },
    ],
    numericals: [
      {
        question: "Using the Round Robin trace above (quantum = 4; P1 burst 5, P2 burst 3, P3 burst 8, P4 burst 6, all arriving at time 0), what is the average waiting time?",
        answerMin: 10.75,
        answerMax: 10.75,
        unit: "time units",
        solution: `  Completion times from the Gantt chart: P1=16, P2=7, P3=20, P4=22
  All arrive at 0, so Turnaround = Completion.

  Waiting = Turnaround - Burst:
    P1: 16 - 5  = 11
    P2: 7  - 3  = 4
    P3: 20 - 8  = 12
    P4: 22 - 6  = 16

  Average waiting time = (11 + 4 + 12 + 16) / 4 = 43 / 4 = 10.75`,
      },
      {
        question: "Four processes arrive together at time 0 with bursts 6, 8, 7, 3. Using non-preemptive SJF, what is the average waiting time?",
        answerMin: 7,
        answerMax: 7,
        unit: "time units",
        solution: `  SJF order (shortest burst first): 3, 6, 7, 8

  Waiting times: 0, 3, 9, 16   (each process waits for all shorter ones ahead of it)

  Average waiting time = (0 + 3 + 9 + 16) / 4 = 28 / 4 = 7`,
      },
    ],
  },

  "i-o-scheduling": {
    difficulty: "Moderate",
    estimatedMinutes: 35,
    xpReward: 25, coinReward: 12,
    // Verified real (title confirmed via direct fetch, 2026-08-13).
    resources: [{
      kind: "video",
      title: "Easy-How-To Disk Scheduling Algorithm (FCFS, SCAN, and C-SCAN) Tutorial",
      url: "https://www.youtube.com/watch?v=yrO5fvXlESE",
      description: "Whole video covers this topic from the start.",
    }],
    whatYoullLearn: [
      "Why disk scheduling optimizes head movement, not CPU time - a genuinely different goal from CPU scheduling",
      "FCFS, SSTF, SCAN, C-SCAN, LOOK, and C-LOOK, and how each one decides its next stop",
      "Computing total head movement for a given request queue and algorithm",
      "Why SCAN-family algorithms exist even though SSTF has better average movement",
    ],
    prerequisites: ["CPU Scheduling"],
    concept: `## The Disk Head Is An Elevator, Not A Queue

::: story
A building elevator doesn't serve floors in the order people pressed the button. A good elevator sweeps in one direction, picking up everyone along the way, then reverses. It would be absurd to go to floor 9, then floor 1, then floor 8, then floor 2, just because that's the order the buttons lit up.

A spinning disk's read/write head faces exactly the same problem: pending requests name cylinders (like floors) scattered across the disk, and moving the head (**seek time**) is by far the slowest part of a disk operation. I/O scheduling decides the ORDER in which to visit them.
:::

::: remember
Disk (I/O) scheduling reorders pending read/write requests, given as cylinder numbers, to minimize the total distance the head has to travel - because seek time, not the actual data transfer, dominates disk I/O latency.
:::

## The Algorithms

::: cards How each one picks the next stop
FCFS (disk) :: Service requests in arrival order, ignoring position entirely. Simple and fair, but can mean huge, wasteful swings back and forth across the disk.
SSTF (Shortest Seek Time First) :: Always jump to whichever pending request is CLOSEST to the head's current position. Minimizes movement locally, but can starve a request sitting far from the action if closer requests keep arriving.
SCAN :: Sweep in one direction, servicing every request along the way, all the way to the disk's physical edge - THEN reverse and sweep back. Like an elevator that always rides to the top floor even if nobody there pressed a button.
C-SCAN (Circular SCAN) :: Sweep in one direction only, servicing requests along the way; upon reaching the edge, jump back to the START without servicing anything on the way back, then sweep forward again. Produces more UNIFORM wait times than SCAN.
LOOK / C-LOOK :: Like SCAN/C-SCAN, but reverse (or jump back) as soon as there are no more requests ahead in the current direction - never travels all the way to the disk's edge if nothing is waiting there.
:::

::: mistake
SCAN and LOOK are frequently confused. SCAN always travels to the disk's physical boundary before reversing, even with no request there; LOOK stops (and reverses) at the LAST actual pending request in that direction. The difference is exactly the wasted trip to an empty edge - which is precisely what LOOK saves.
:::

::: checkpoint
Why don't real disk schedulers just always use SSTF, given that it minimizes average head movement?
- ( ) SSTF is actually slower than FCFS in every case
- (x) SSTF can indefinitely starve a request that sits far from the head if closer requests keep arriving, since it always prefers proximity over fairness
- ( ) SSTF cannot be implemented in hardware
- ( ) SSTF only works for solid-state drives
> SSTF greedily chases whatever is nearest, with no guarantee a distant request ever gets serviced if a stream of closer ones keeps showing up - the SCAN family exists specifically to bound this worst case, trading a bit of average performance for a guarantee.
:::

## Choosing Between Them

::: tip
GATE numericals almost always give you a starting head position, a list of pending cylinder requests, the disk's cylinder range, and an initial direction, then ask for total head movement under a named algorithm. Sort the requests once, split them into "ahead of the head" and "behind it" in the current direction, then simulate the sweep - the arithmetic is just a sum of absolute differences between consecutive stops.
:::`,
    codeExample: {
      language: "javascript",
      code: `// FCFS disk scheduling: total head movement is just the sum of
// absolute distances between consecutively serviced requests.
const head = 50;
const requests = [98, 183, 37, 122, 14, 124, 65, 67];

let totalMovement = 0;
let current = head;
for (const r of requests) {
  totalMovement += Math.abs(r - current);
  current = r;
}
console.log("Total head movement (FCFS):", totalMovement);`,
      expectedOutput: `Total head movement (FCFS): 643`,
    },
    workedExamples: [
      {
        title: "SSTF total head movement",
        problem: "Head starts at cylinder 50. Pending requests: 98, 183, 37, 122, 14, 124, 65, 67. Using SSTF, find the total head movement.",
        solution: `Always jump to the nearest remaining request.

  From 50: nearest is 65 (distance 15)      -> move to 65,  total=15
  From 65: nearest is 67 (distance 2)       -> move to 67,  total=17
  From 67: nearest is 37 (distance 30, vs 98 at 31) -> move to 37, total=47
  From 37: nearest is 14 (distance 23, vs 98 at 61) -> move to 14, total=70
  From 14: nearest remaining is 98 (distance 84)    -> move to 98, total=154
  From 98: nearest is 122 (distance 24)     -> move to 122, total=178
  From 122: nearest is 124 (distance 2)     -> move to 124, total=180
  From 124: last one left is 183 (distance 59) -> move to 183, total=239

Total head movement (SSTF) = 239 cylinders - noticeably better than FCFS's 643 on the same queue, but notice 14 and 37 both got serviced only after being passed over twice in favour of closer requests, which is exactly the starvation risk SSTF carries.`,
      },
    ],
    dryRun: `Trace SCAN for the same queue: head at 50, requests {98, 183, 37, 122, 14, 124, 65, 67}, disk cylinders 0-199, head initially moving toward INCREASING cylinder numbers.

::: timeline Sweep up, hit the edge, sweep back
Sort requests :: Ascending: 14, 37, 65, 67, 98, 122, 124, 183.
Split by direction :: Ahead of 50 (increasing): 65, 67, 98, 122, 124, 183. Behind 50: 37, 14.
Sweep upward, servicing each in order :: 50->65 (15) ->67 (2) ->98 (31) ->122 (24) ->124 (2) ->183 (59). Running total so far: 133.
Continue to the disk's physical edge :: 183->199 (16), even though nothing is requested at 199 - SCAN always finishes the sweep to the boundary. Running total: 149.
Reverse direction, service what's behind :: 199->37 (162) ->14 (23). Running total: 149+162+23 = 334.
:::

Total head movement (SCAN) = 334 cylinders.

Now compare **LOOK** on the identical queue: it behaves identically up to 183, but reverses immediately instead of continuing to 199, since no request lies beyond 183 in that direction:

  124 -> 183 (59) -> 37 (146, direct reverse, no trip to 199) -> 14 (23)

Total head movement (LOOK) = 133 + 146 + 23 = 302 cylinders - saving exactly the 2 x 16 = 32 cylinders SCAN spent on an empty round trip to the disk's edge.`,
    analogies: [
      "SCAN and LOOK are an elevator: SCAN always rides to the top floor even with nobody there, LOOK peeks first and turns around at the highest floor someone actually pressed.",
      "SSTF is always answering whichever email is shortest to reply to - fast on average, but the one long, important email at the bottom of the pile can sit unanswered indefinitely if short ones keep arriving.",
    ],
    commonMistakes: [
      "Confusing SCAN (always sweeps to the disk's physical edge) with LOOK (reverses at the last actual pending request, no trip to the edge).",
      "Confusing SCAN (services requests in BOTH directions across two passes) with C-SCAN (services in only ONE direction, then jumps back without servicing).",
      "Assuming SSTF is simply 'the best' algorithm because it minimizes average movement - it can starve distant requests indefinitely, which is precisely why SCAN-family algorithms exist.",
      "Forgetting to state (or assume) an initial direction before simulating SCAN/LOOK - the same request set gives a different total depending on which way the head starts moving.",
      "Adding the head's own starting position as a 'serviced request' in the total count - it is the starting point for the FIRST movement, not a request itself.",
    ],
    memoryTricks: [
      "SCAN = elevator that always finishes the ride to the wall. LOOK = elevator that looks ahead and turns around early if nobody's there.",
      "C- prefix (C-SCAN, C-LOOK) = Circular: service only ONE direction, then jump back to the start without servicing on the way.",
      "SSTF = greedy nearest-neighbour. Fast on average, unfair in the worst case - exactly the same trade-off as SJF has for CPU scheduling.",
    ],
    formulas: [
      "Total head movement = sum of |difference| between each consecutively serviced cylinder, in the order actually visited.",
      "Average seek time = Total head movement / number of requests serviced.",
      "SCAN total = LOOK total + 2 x (distance from the last serviced request to the disk's edge in the sweep direction) - the extra round trip SCAN pays and LOOK skips.",
    ],
    shortcuts: [
      "Split the sorted request list into 'ahead of head' and 'behind head' once, then simulate the sweep - don't recompute distances from scratch at every step.",
      "If a question asks for LOOK/C-LOOK versus SCAN/C-SCAN on the same queue, compute SCAN first, then just subtract the wasted edge trip(s) to get LOOK - faster than re-simulating.",
    ],
    pyqRelevance: `Disk scheduling numericals (compute total head movement for a stated algorithm, given a head position, request queue, and direction) are extremely common - expect one most years, sometimes comparing two algorithms on the same queue.

Conceptual questions test the SCAN-vs-LOOK and SCAN-vs-C-SCAN distinctions directly, and "why doesn't every system just use SSTF" (starvation) is a recurring 1-mark question.

Always read the initial direction and disk boundary carefully - they are the two details most likely to be varied between an easy and a hard version of the same question.`,
    interviewConnection: `Disk-scheduling reasoning generalises directly to any system that must order competing requests over a physical/positional resource - modern SSD schedulers, network packet scheduling, and even browser tab-loading prioritization borrow the same "sweep vs greedy-nearest vs bound the worst case" trade-off.

The SSTF-starves-distant-requests lesson is the same one behind "why did this one API request get stuck for 30 seconds" incidents in systems that prioritize by naive proximity/recency without a fairness bound.`,
    revisionSummary: `Disk scheduling reorders pending requests to minimize total head movement (seek time dominates disk I/O latency).

FCFS: arrival order, ignores position. SSTF: always nearest request, best average, can starve distant ones. SCAN: sweep one direction all the way to the disk edge, then reverse. C-SCAN: sweep one direction only, jump back to start without servicing, giving more uniform waits. LOOK/C-LOOK: like SCAN/C-SCAN but reverse/jump as soon as no requests remain ahead, skipping the empty trip to the edge.

Total head movement = sum of absolute differences between consecutive stops in the order actually visited. SCAN total = LOOK total + 2 x (last request to edge distance).`,
    shortNotes: {
      fiveMinute: "Disk scheduling minimizes total head movement (seek time dominates). FCFS=arrival order. SSTF=always nearest, best average but can starve far requests. SCAN=sweep to disk edge then reverse. C-SCAN=one direction only, jump back to start. LOOK/C-LOOK=like SCAN/C-SCAN but turn around at the last request, not the edge. Total movement=sum of |differences| between consecutive stops. SCAN=LOOK+2x(edge trip).",
      oneMinute: "SSTF=nearest first, can starve. SCAN=sweep to edge, reverse. C-SCAN=one direction, jump back. LOOK/C-LOOK=turn at last request, no edge trip. Total=sum of |diffs|.",
      nightBefore: "SCAN goes to the edge; LOOK turns at the last request. C- versions = one direction only, jump back. SSTF can starve.",
    },
    keyPoints: [
      "Disk (I/O) scheduling reorders pending requests to minimize total head movement, since seek time dominates disk I/O latency.",
      "SSTF always services the nearest pending request, giving the best average movement but risking starvation of distant requests.",
      "SCAN sweeps in one direction all the way to the disk's physical edge before reversing; LOOK reverses as soon as no requests remain ahead, skipping the empty trip to the edge.",
      "C-SCAN and C-LOOK service only one direction, then jump back to the start without servicing on the way back, producing more uniform wait times than their non-circular counterparts.",
      "Total head movement is the sum of absolute distances between consecutively serviced cylinders, in the order actually visited - and SCAN's total exceeds LOOK's by exactly twice the distance from the last request to the disk's edge.",
    ],
    mcqs: [
      {
        question: "Which disk scheduling algorithm can indefinitely starve a request that lies far from the head's current position?",
        options: ["FCFS", "SSTF", "SCAN", "C-SCAN"],
        correctIndex: 1,
        explanation: "SSTF always chooses the closest pending request; if closer requests keep arriving, a distant request can be passed over indefinitely - the classic argument for using SCAN-family algorithms instead.",
      },
      {
        question: "What is the key difference between SCAN and LOOK?",
        options: [
          "SCAN services requests in only one direction; LOOK services both directions",
          "SCAN always travels to the disk's physical edge before reversing; LOOK reverses as soon as no requests remain ahead",
          "LOOK is non-preemptive while SCAN is preemptive",
          "There is no difference; they are two names for the same algorithm",
        ],
        correctIndex: 1,
        explanation: "SCAN completes the sweep to the boundary regardless of whether any request is there; LOOK 'looks ahead' and turns around at the last actual pending request, saving the otherwise-wasted trip to the edge.",
      },
      {
        question: "What distinguishes C-SCAN from SCAN?",
        options: [
          "C-SCAN services requests in only one direction, then jumps back to the start without servicing on the way",
          "C-SCAN is identical to FCFS",
          "C-SCAN always starts from cylinder 0",
          "C-SCAN cannot handle more than 10 requests",
        ],
        correctIndex: 0,
        explanation: "C-SCAN's 'circular' behavior services requests while sweeping in one direction only, then returns to the starting edge without servicing anything on the return trip, which produces more uniform waiting times across requests than plain SCAN.",
      },
    ],
    numericals: [
      {
        question: "Head starts at cylinder 50. Pending requests: 98, 183, 37, 122, 14, 124, 65, 67. Using SSTF, what is the total head movement (in cylinders)?",
        answerMin: 239,
        answerMax: 239,
        unit: "cylinders",
        solution: `  50->65(15)->67(2)->37(30)->14(23)->98(84)->122(24)->124(2)->183(59)

  Total = 15+2+30+23+84+24+2+59 = 239 cylinders`,
      },
      {
        question: "For the same head position (50) and request queue (98, 183, 37, 122, 14, 124, 65, 67), moving initially toward increasing cylinders, what is the total head movement using LOOK (no trip to the disk's physical edge)?",
        answerMin: 302,
        answerMax: 302,
        unit: "cylinders",
        solution: `  Ahead (increasing): 65,67,98,122,124,183 -> 50 to 183 costs 15+2+31+24+2+59=133
  Reverse directly to 37 (no edge trip): |183-37| = 146
  Then to 14: |37-14| = 23

  Total = 133 + 146 + 23 = 302 cylinders

(This is exactly the SCAN total of 334 minus the 32-cylinder round trip
SCAN would have spent travelling from 183 to the edge at 199 and back.)`,
      },
    ],
  },

  // ---------------- Memory Management ----------------

  "memory-management": {
    difficulty: "Hard",
    estimatedMinutes: 40,
    xpReward: 30, coinReward: 12,
    // Verified real (title confirmed via direct fetch, 2026-08-13).
    resources: [{
      kind: "video",
      title: "Main Memory | Chapter-8 | Operating System - Neso Academy",
      url: "https://www.youtube.com/watch?v=d9WyerblWQc",
      description: "Whole video covers this topic from the start.",
    }],
    whatYoullLearn: [
      "Contiguous allocation, and why it causes fragmentation - internal AND external",
      "First-fit, best-fit, and worst-fit placement, traced on the same example to see why they differ",
      "Paging: fixed-size pages and frames, and how a logical address becomes a physical one",
      "Segmentation: variable-size, logically meaningful units, and how it trades one fragmentation problem for the other",
    ],
    prerequisites: ["I/O Scheduling"],
    concept: `## Assigning Rooms In A Hostel

::: story
Imagine a hostel warden assigning rooms to arriving guests. If every guest must get a single unbroken block of adjacent rooms (**contiguous allocation**), the warden constantly deals with two different kinds of waste: a guest who needed 3 rooms but got a 5-room block leaves 2 rooms sitting empty and unusable by anyone else (**internal fragmentation**), and a scattering of small 1-2 room gaps between occupied blocks that no incoming guest's group is small enough to use (**external fragmentation**).
:::

::: remember
Memory management decides WHERE in physical memory each process's data lives, and translates the addresses a program uses (logical/virtual addresses) into the real physical addresses backing them.
:::

## Contiguous Allocation And Its Two Kinds Of Waste

::: cards Internal vs external fragmentation
Internal fragmentation :: Space wasted INSIDE a block that WAS allocated to a process, because the block is bigger than what the process actually needed.
External fragmentation :: Space wasted BETWEEN allocated blocks - free memory exists in total, but scattered into pieces too small individually for the next request, even though their sum might be enough.
:::

::: cards Placement strategies for dynamic partitioning
First-fit :: Allocate the FIRST free block big enough, scanning from the start. Fast, but tends to fragment the front of memory over time.
Best-fit :: Allocate the SMALLEST free block that's still big enough. Minimizes the leftover per allocation, but that tiny leftover is often too small to ever be useful - many small unusable fragments.
Worst-fit :: Allocate the LARGEST free block available. Leaves the biggest possible leftover, hoping it stays usable - in practice, usually the weakest of the three.
:::

::: mistake
Internal and external fragmentation are NOT the same failure and are not fixed the same way. Compaction (shuffling allocated blocks together to merge free space) fixes external fragmentation, but does nothing for internal fragmentation - the wasted space is trapped INSIDE an allocated block, and no amount of shuffling frees it.
:::

## Paging: Fixed-Size Pieces, No External Fragmentation

::: cards How paging works
Page :: A fixed-size chunk of a process's logical (virtual) address space.
Frame :: A fixed-size chunk of physical memory, exactly the same size as a page.
Page table :: A per-process map from page number to frame number - the OS's lookup table for translating logical addresses.
:::

::: checkpoint
A logical address is split into a page number and an offset. If the page size is 2^d bytes, how many bits does the offset need?
- ( ) d bits, rounded up to the nearest byte
- (x) Exactly d bits - the offset just counts positions within one page, and a page holds exactly 2^d addressable positions
- ( ) log2(number of pages) bits
- ( ) It depends on the frame size, not the page size
> The offset identifies WHERE within a page/frame a byte sits, and a page of size 2^d has exactly 2^d distinct byte positions - which takes exactly d bits to number, regardless of how many pages or frames exist in total.
:::

## Segmentation: The Reverse Trade-Off

::: cards Segments are logical, not fixed-size
Segment :: A variable-size, logically meaningful unit of a program - code, the stack, the heap, each its own segment - rather than an arbitrary fixed-size slice.
Segment table :: Maps each segment number to a (base, limit) pair: where the segment starts in physical memory, and how long it is.
:::

::: tip
Paging eliminates external fragmentation (every frame is interchangeable) but reintroduces internal fragmentation (a process's last page is rarely used completely). Segmentation is the mirror image: no internal fragmentation (a segment is exactly the size it needs), but external fragmentation returns, because segments are again variable-size blocks competing for contiguous space.
:::`,
    deepDive: `## Address Translation, Worked As A Formula

For a paged system with page size P = 2^d bytes:

  page number   = floor(logical address / P)
  offset        = logical address mod P
  physical addr = (frame number from the page table) x P + offset

The page table is consulted ONCE per memory access (twice, counting the TLB lookup first in a real system) - it is pure lookup, no searching, which is exactly why paging is fast despite adding a translation step.

## Segmented Paging: Getting Both

Real systems often combine the two: a program is divided into logically meaningful segments (code, stack, heap), and EACH segment is internally divided into fixed-size pages. This keeps paging's frame-based physical allocation (no external fragmentation) while keeping segmentation's logical structure (protection and sharing can be applied per-segment, e.g. "code segment is read-only, shared across processes running the same binary").`,
    codeExample: {
      language: "javascript",
      code: `// First-fit allocation over free blocks (KB), classic textbook example
let freeBlocks = [100, 500, 200, 300, 600];
const requests = [212, 417, 112, 426];

for (const size of requests) {
  const i = freeBlocks.findIndex(b => b >= size);
  if (i === -1) {
    console.log(\`Request \${size}K: NOT allocated (no block big enough)\`);
    continue;
  }
  const leftover = freeBlocks[i] - size;
  console.log(\`Request \${size}K: allocated in block of \${freeBlocks[i]}K, leftover \${leftover}K\`);
  freeBlocks[i] = leftover;
}`,
      expectedOutput: `Request 212K: allocated in block of 500K, leftover 288K
Request 417K: allocated in block of 600K, leftover 183K
Request 112K: allocated in block of 288K, leftover 176K
Request 426K: NOT allocated (no block big enough)`,
    },
    workedExamples: [
      {
        title: "Address translation with a page table",
        problem: "Page size is 1024 bytes (2^10). Logical address 5000 belongs to page 4, and the page table maps page 4 to frame 7. What physical address does 5000 translate to?",
        solution: `  Page number = floor(5000 / 1024) = 4        (matches the given page)
  Offset      = 5000 - 4 x 1024 = 5000 - 4096 = 904

  Physical address = frame number x page size + offset
                    = 7 x 1024 + 904
                    = 7168 + 904
                    = 8072

The offset (904) is the ONE thing that carries over unchanged from logical to physical address - only the page number gets replaced, by the frame number the page table supplies.`,
      },
    ],
    dryRun: `Allocate processes 212K, 417K, 112K, 426K (in that order) against free blocks 100K, 500K, 200K, 300K, 600K, using first-fit, best-fit, and worst-fit, to see why the three strategies genuinely differ.

::: timeline First-fit
212K :: First block >= 212K, scanning from the start: 500K. Allocate, leftover 288K. Blocks now: 100,288,200,300,600.
417K :: First block >= 417K: 600K. Allocate, leftover 183K. Blocks now: 100,288,200,300,183.
112K :: First block >= 112K: 288K. Allocate, leftover 176K. Blocks now: 100,176,200,300,183.
426K :: No remaining block is >= 426K (largest is 300K). NOT allocated.
:::

::: timeline Best-fit
212K :: Smallest block that still fits: 300K (beats 500K, 600K). Allocate, leftover 88K. Blocks: 100,500,200,88,600.
417K :: Smallest that fits: 500K. Allocate, leftover 83K. Blocks: 100,83,200,88,600.
112K :: Smallest that fits: 200K. Allocate, leftover 88K. Blocks: 100,83,88,88,600.
426K :: Only 600K fits. Allocate, leftover 174K. ALL FOUR requests allocated.
:::

::: timeline Worst-fit
212K :: Largest block: 600K. Allocate, leftover 388K. Blocks: 100,500,200,300,388.
417K :: Largest remaining: 500K. Allocate, leftover 83K. Blocks: 100,83,200,300,388.
112K :: Largest remaining: 388K. Allocate, leftover 276K. Blocks: 100,83,200,300,276.
426K :: Largest remaining is only 300K. NOT allocated.
:::

Same requests, same starting blocks - first-fit and worst-fit both fail to place the last request, while best-fit places all four. This is the standard textbook proof that "best-fit" is not just a name; on some inputs it genuinely does better, though on others its tiny leftover fragments can pile up and hurt it instead.`,
    analogies: [
      "Contiguous allocation is assigning hostel guests unbroken blocks of rooms: internal fragmentation is empty rooms inside a guest's own block; external fragmentation is scattered single free rooms between different guests' blocks that no new guest's group is small enough to use.",
      "Paging is like a library storing a long book across many same-sized boxes scattered anywhere in the warehouse, with a catalog card (page table) recording which box holds which chapter - the boxes never need to be adjacent.",
    ],
    commonMistakes: [
      "Confusing internal fragmentation (waste INSIDE an allocated block) with external fragmentation (unusable gaps BETWEEN allocated blocks).",
      "Assuming compaction fixes internal fragmentation. It only fixes external fragmentation by merging free gaps; space wasted inside an already-allocated block is untouched by compaction.",
      "Forgetting that best-fit's smallest-leftover strategy can itself create many small, useless fragments over time, despite doing well on any single allocation.",
      "Mixing up units when computing offset/page-number bits - always convert page size to bytes (and confirm it's a power of two) before taking log2.",
      "Believing paging has no fragmentation at all. It removes EXTERNAL fragmentation but still has internal fragmentation, in the last (partially used) page of each process.",
    ],
    memoryTricks: [
      "Internal = waste INSIDE what you were given. External = waste BETWEEN what everyone has - gaps too small to use.",
      "Page size = 2^d bytes -> offset needs exactly d bits. No exceptions, no rounding.",
      "Paging fixes external frag but keeps internal (last page). Segmentation fixes internal frag but keeps external (variable-size segments).",
    ],
    formulas: [
      "For page size P = 2^d bytes: page number = floor(logical address / P); offset = logical address mod P.",
      "Physical address = (frame number from page table) x page size + offset.",
      "Number of pages needed for a process of size S with page size P = ceil(S / P); internal fragmentation = (pages x P) - S.",
      "Number of page-table entries for a process = number of pages it has; number of bits for the frame number = log2(number of physical frames).",
    ],
    shortcuts: [
      "For fragmentation questions, first classify: is the waste inside an allocated block (internal) or in the gaps between blocks (external)? That alone often answers the question.",
      "For address translation, always split logical address = quotient (page number) and remainder (offset) using the page size - the remainder never changes across translation, only the page number does.",
    ],
    pyqRelevance: `Expect a first-fit/best-fit/worst-fit allocation trace (given free blocks and a sequence of requests, which strategy succeeds/fails, or what's the final free-block layout) most years - it's a compact, popular numerical.

Address translation questions (given page size, a logical address, and a page table entry, find the physical address, or work backward from a physical address to the logical one) are equally common and are pure arithmetic once the page-size-to-bits conversion is solid.

Conceptual questions on internal vs external fragmentation, and on what compaction does and does not fix, round out the rest at 1 mark each.`,
    interviewConnection: `Understanding fragmentation is the direct ancestor of why real memory allocators (malloc implementations, JVM heap regions) use size-class buckets and defragmentation/compaction passes - the exact same trade-offs (best-fit-style bucket matching vs compaction cost) show up in garbage collector design.

"Why does virtual memory use fixed-size pages instead of variable-size segments" is a natural systems-interview follow-up, and the honest answer is precisely this lesson: fixed size trades away internal fragmentation control in exchange for eliminating the external fragmentation problem entirely.`,
    revisionSummary: `Contiguous allocation causes two distinct kinds of waste: internal fragmentation (space wasted inside an allocated block) and external fragmentation (unusable gaps between blocks). First-fit, best-fit, and worst-fit are three different tie-breaking rules for which free block to use, and they genuinely produce different outcomes on the same input.

Paging divides logical memory into fixed-size pages and physical memory into same-sized frames, mapped by a per-process page table; it eliminates external fragmentation but keeps some internal fragmentation in a process's last page.

Segmentation divides a program into variable-size, logically meaningful units (code, stack, heap), mapped via base+limit in a segment table; it eliminates internal fragmentation but reintroduces external fragmentation.

Address translation: page number = floor(address / page size); offset = address mod page size; physical address = frame number x page size + offset.`,
    shortNotes: {
      fiveMinute: "Internal frag = waste inside an allocated block. External frag = unusable gaps between blocks. First-fit/best-fit/worst-fit are different free-block choice rules - same input can give different success/failure. Paging: fixed pages/frames, page table maps page->frame, eliminates external frag, keeps internal frag (last page). Segmentation: variable-size logical units, segment table (base+limit), eliminates internal frag, keeps external frag. Address translation: page# = addr/pagesize, offset = addr mod pagesize, physical = frame#*pagesize+offset.",
      oneMinute: "Internal frag=inside a block, external frag=between blocks. Paging=fixed size, no external frag, some internal frag. Segmentation=variable size, no internal frag, has external frag. Physical addr = frame# x pagesize + offset.",
      nightBefore: "Internal=inside block, external=between blocks. Paging: no external frag. Segmentation: no internal frag. Physical = frame#*pagesize+offset.",
    },
    keyPoints: [
      "Internal fragmentation is wasted space inside an allocated block; external fragmentation is wasted space in gaps between allocated blocks.",
      "First-fit, best-fit, and worst-fit are different rules for choosing which free block to allocate, and can produce genuinely different success/failure outcomes on identical input.",
      "Compaction fixes external fragmentation by merging free gaps together; it does nothing for internal fragmentation.",
      "Paging uses fixed-size pages/frames and a per-process page table, eliminating external fragmentation but retaining some internal fragmentation in the last page.",
      "Segmentation uses variable-size, logically meaningful units mapped via base+limit, eliminating internal fragmentation but reintroducing external fragmentation.",
      "Address translation: page number = floor(logical address / page size); offset = logical address mod page size; physical address = frame number x page size + offset.",
    ],
    mcqs: [
      {
        question: "Which technique fixes external fragmentation but does NOT fix internal fragmentation?",
        options: ["Compaction", "Using larger pages", "Best-fit allocation", "Increasing physical memory"],
        correctIndex: 0,
        explanation: "Compaction merges scattered free gaps into contiguous free memory (fixing external fragmentation), but it cannot recover space wasted inside an already-allocated block - that space is internal fragmentation and untouched by shuffling blocks around.",
      },
      {
        question: "A page size is 2^12 bytes. How many bits are needed for the offset portion of a logical address?",
        options: ["10", "12", "16", "It depends on the number of pages"],
        correctIndex: 1,
        explanation: "A page of size 2^d bytes has exactly 2^d distinct byte positions within it, needing exactly d bits to number them - here d = 12, independent of how many pages or frames exist.",
      },
      {
        question: "What is the key trade-off between paging and segmentation?",
        options: [
          "Paging has no fragmentation at all; segmentation always has both kinds",
          "Paging eliminates external fragmentation but keeps some internal fragmentation; segmentation eliminates internal fragmentation but reintroduces external fragmentation",
          "Segmentation is always faster than paging",
          "There is no meaningful difference between the two",
        ],
        correctIndex: 1,
        explanation: "Paging's fixed-size units remove external fragmentation (any frame fits any page) but waste space in a partially-used last page; segmentation's variable, logically-sized units remove that waste but bring back the external-fragmentation problem of matching variable-size blocks to variable-size gaps.",
      },
    ],
    numericals: [
      {
        question: "A process needs 6000 bytes of memory and the page size is 1024 bytes. What is the internal fragmentation, in bytes?",
        answerMin: 144,
        answerMax: 144,
        unit: "bytes",
        solution: `  Pages needed = ceil(6000 / 1024) = ceil(5.859...) = 6 pages
  Total allocated = 6 x 1024 = 6144 bytes

  Internal fragmentation = 6144 - 6000 = 144 bytes

The process is given 6 whole pages because a page can't be partially
allocated, and the leftover space in the 6th page (144 bytes) is
wasted - unusable by any other process.`,
      },
      {
        question: "Page size is 1024 bytes. Logical address 6500 maps via the page table to frame 3. What is the physical address?",
        answerMin: 3652,
        answerMax: 3652,
        unit: "",
        solution: `  Page number = floor(6500 / 1024) = 6
  Offset      = 6500 - 6 x 1024 = 6500 - 6144 = 356

  Physical address = frame number x page size + offset
                    = 3 x 1024 + 356
                    = 3072 + 356
                    = 3428

  (Re-check: 3 x 1024 = 3072; 3072 + 356 = 3428.)`,
      },
    ],
  },

  "virtual-memory-and-paging": {
    difficulty: "Hard",
    estimatedMinutes: 40,
    xpReward: 30, coinReward: 12,
    // Verified real (title confirmed via direct fetch, 2026-08-13).
    resources: [{
      kind: "video",
      title: "Virtual Memory | Chapter-9 | Operating System - Neso Academy",
      url: "https://www.youtube.com/watch?v=puobwv1xjqc",
      description: "Whole video covers this topic from the start.",
    }],
    whatYoullLearn: [
      "What virtual memory actually gives every program: a private illusion of ample address space",
      "Demand paging and page faults - why a program can run without being fully loaded into RAM",
      "FIFO, LRU, and Optimal page replacement, and Belady's anomaly",
      "Computing page fault rate and effective memory access time",
    ],
    prerequisites: ["Memory Management"],
    concept: `## Everyone Gets Their Own Illusion Of Unlimited Desk Space

::: story
Imagine an office where every employee is told they have an enormous private desk, bigger than the building's actual floor space could allow if everyone's desk were real at once. It works because a quiet facilities team keeps only what you're ACTUALLY using right now on a small real desk, storing the rest in a warehouse nearby, and swapping things in and out the instant you reach for them - so fast you never notice, unless something you need isn't on the desk yet.

That illusion is **virtual memory**: every process believes it has its own large, private address space, while the OS quietly maps only the actively-used parts onto real, limited physical RAM.
:::

::: remember
Virtual memory gives each process its own virtual address space, which the OS maps to physical frames ON DEMAND - not everything needs to be resident in RAM at once, which is exactly why a program's total address space can exceed installed physical memory.
:::

## Demand Paging And Page Faults

::: cards The lazy-loading mechanism
Demand paging :: A page is loaded into a physical frame only when it is actually referenced, not in advance. Most of a large program is never touched during any single run, so this saves real memory and load time.
Page fault :: The referenced page is NOT currently in memory. The CPU traps to the OS, which finds or frees a frame, loads the page from disk, updates the page table, and restarts the very instruction that faulted.
:::

::: mistake
A page fault is not an error or a crash - it's the mechanism working exactly as designed, just an expensive one. Confusing "page fault occurred" with "something went wrong" misses the entire point of demand paging: faults are supposed to happen sometimes, in exchange for not loading everything upfront.
:::

## Choosing Who Gets Evicted

::: cards Three page replacement policies
FIFO :: Evict whichever page has been in memory the LONGEST, regardless of how recently it was used. Simple to implement, but can behave counterintuitively (see Belady's anomaly below).
LRU (Least Recently Used) :: Evict whichever page hasn't been referenced for the longest time. Usually approximates the optimal policy well, at the cost of extra bookkeeping to track recency.
Optimal (Belady's algorithm) :: Evict whichever page won't be needed again for the longest time INTO THE FUTURE. Provably the fewest possible faults for any reference string - but requires knowing the future, so it's used only as a theoretical benchmark, never implemented for real.
:::

::: checkpoint
Why is the Optimal page replacement algorithm never actually used in a real operating system?
- ( ) It causes more page faults than FIFO
- (x) It requires knowing which pages will be referenced in the future, which is not knowable while a program is actually running
- ( ) It is too simple to implement correctly
- ( ) It only works with a single frame
> Optimal is a benchmark for comparison, not a deployable algorithm - real replacement policies (like LRU) try to APPROXIMATE what Optimal would have done, using only past behavior as a guide for future behavior.
:::

## Belady's Anomaly

::: tip
Common sense says more physical frames should never cause MORE page faults. FIFO breaks that intuition: for some reference strings, FIFO genuinely produces more faults with 4 frames than with 3. LRU and Optimal never do this - they belong to a class called "stack algorithms," which guarantee more frames can only help or leave the fault count unchanged, never make it worse.
:::`,
    deepDive: `## Belady's Anomaly, Traced Exactly

Reference string: 1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5. Compare FIFO with 3 frames against FIFO with 4 frames.

With 3 frames, tracking faults carefully gives **9 faults**. With 4 frames, the SAME reference string gives **10 faults** - strictly worse, despite having an entire extra frame available. See the dryRun below for the full step-by-step trace of both.

## Thrashing And The Working Set

If the total memory DEMANDED by all running processes' active pages exceeds physical memory, the system spends more time servicing page faults than doing useful work - this is **thrashing**. The standard fix is the working-set model: track each process's actual set of recently-referenced pages, and only run as many processes as physical memory can hold working sets for, rather than blindly maximizing the number of processes in memory (higher multiprogramming degree is not always better, past this point it actively makes things worse).`,
    codeExample: {
      language: "javascript",
      code: `// FIFO page replacement: count faults for a reference string, 3 frames
function fifoFaults(refs, capacity) {
  const frames = [];   // frames[0] is the OLDEST (next to evict)
  let faults = 0;
  for (const page of refs) {
    if (!frames.includes(page)) {
      faults++;
      if (frames.length === capacity) frames.shift();   // evict oldest
      frames.push(page);
    }
  }
  return faults;
}

const refs = [1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5];
console.log("FIFO faults with 3 frames:", fifoFaults(refs, 3));
console.log("FIFO faults with 4 frames:", fifoFaults(refs, 4));`,
      expectedOutput: `FIFO faults with 3 frames: 9
FIFO faults with 4 frames: 10`,
    },
    workedExamples: [
      {
        title: "LRU page faults, traced step by step",
        problem: "Reference string 1, 2, 3, 1, 2, 4, 1, 2, 3, 4 with 3 frames. Count the page faults under LRU.",
        solution: `Track frames as a recency list, most-recently-used at the front.

  ref=1: not present -> FAULT. frames=[1]                       (fault 1)
  ref=2: not present -> FAULT. frames=[2,1]                      (fault 2)
  ref=3: not present -> FAULT. frames=[3,2,1]  (full)            (fault 3)
  ref=1: present (move to front) -> frames=[1,3,2]               (hit)
  ref=2: present (move to front) -> frames=[2,1,3]               (hit)
  ref=4: not present -> evict LRU end (3) -> FAULT. frames=[4,2,1] (fault 4)
  ref=1: present (move to front) -> frames=[1,4,2]               (hit)
  ref=2: present (move to front) -> frames=[2,1,4]               (hit)
  ref=3: not present -> evict LRU end (4) -> FAULT. frames=[3,2,1] (fault 5)
  ref=4: not present -> evict LRU end (1) -> FAULT. frames=[4,3,2] (fault 6)

Total: 6 faults out of 10 references. Running FIFO on this exact same string instead gives 8 faults - LRU's extra bookkeeping (tracking actual recency, not just insertion order) pays for itself here, which is the standard argument for preferring it over FIFO despite the overhead.`,
      },
    ],
    dryRun: `Trace FIFO on the reference string 1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5 with 3 frames, then again with 4 frames, to see Belady's anomaly directly.

::: timeline FIFO with 3 frames
1,2,3 :: Three faults filling empty frames. frames=[1,2,3] (oldest first: 1).
4 :: Fault - evict oldest (1). frames=[2,3,4].
1,2 :: Both already evicted or still present? 1 is NOT present (evicted) -> fault, evict oldest(2) -> frames=[3,4,1]. Then 2 is NOT present -> fault, evict oldest(3) -> frames=[4,1,2].
5 :: Fault - evict oldest (4). frames=[1,2,5].
1,2 :: Both present (no eviction happened since they were just loaded) -> two HITS.
3 :: Fault - evict oldest (1). frames=[2,5,3].
4 :: Fault - evict oldest (2). frames=[5,3,4].
5 :: Present -> HIT.
:::

Count the faults: 1,2,3,4,1,2,5 = 7 faults, then 1,2 = hits, then 3,4 = 2 more faults (total 9), then 5 = hit. **Total = 9 faults.**

::: timeline FIFO with 4 frames
1,2,3,4 :: Four faults filling the (now larger) empty frame set. frames=[1,2,3,4].
1,2 :: Both still present (never evicted, since nothing has been evicted yet) -> two HITS.
5 :: Fault - evict oldest (1). frames=[2,3,4,5].
1 :: NOT present (evicted) -> fault, evict oldest(2) -> frames=[3,4,5,1].
2 :: NOT present -> fault, evict oldest(3) -> frames=[4,5,1,2].
3 :: NOT present -> fault, evict oldest(4) -> frames=[5,1,2,3].
4 :: NOT present -> fault, evict oldest(5) -> frames=[1,2,3,4].
5 :: NOT present -> fault, evict oldest(1) -> frames=[2,3,4,5].
:::

Count the faults: 1,2,3,4 = 4 faults, then 1,2 = hits, then 5,1,2,3,4,5 = 6 MORE faults. **Total = 10 faults.**

Four frames produced ONE MORE fault than three frames, on the identical reference string, under FIFO - this is exactly Belady's anomaly, and it is specific to FIFO; LRU and Optimal are provably immune to it.`,
    analogies: [
      "Virtual memory is an office where everyone believes they have an enormous private desk; a quiet facilities team keeps only what you're using right now on a small real desk and fetches the rest from a warehouse the instant you reach for it.",
      "Demand paging is like only downloading the parts of a large map you actually scroll to, instead of loading the entire world map before you can look at anything.",
    ],
    commonMistakes: [
      "Treating a page fault as an error condition rather than the normal (if expensive) mechanism demand paging relies on.",
      "Assuming more physical frames always reduces or maintains the fault count. FIFO can violate this (Belady's anomaly); only LRU and Optimal are guaranteed immune.",
      "Confusing FIFO (evicts by insertion order, ignoring recent use) with LRU (evicts by actual recency of use) - a page that was just re-referenced is protected under LRU but not under FIFO.",
      "Forgetting that Optimal requires future knowledge and is therefore a THEORETICAL benchmark only, never an implementable real-system policy.",
      "Miscomputing effective access time by forgetting to weight the fast (no-fault) and slow (fault) cases by their respective probabilities.",
    ],
    memoryTricks: [
      "FIFO = oldest resident, evicted regardless of recent use. LRU = oldest UNUSED, evicted based on actual recency.",
      "Optimal = the impossible-in-practice benchmark: it needs to see the future, so it only exists for comparison.",
      "Belady's anomaly: more frames, MORE faults - only possible under FIFO, never under LRU/Optimal. EAT = (1 - fault rate) x normal access time + fault rate x fault service time.",
    ],
    formulas: [
      "Effective Access Time (EAT) = (1 - p) x ma + p x page_fault_service_time, where p = page fault rate and ma = memory access time (no fault).",
      "Page fault rate p = number of page faults / total number of memory references.",
      "Number of frames needed for a process = ceil(process size / frame size), same formula as pages needed under paging.",
    ],
    shortcuts: [
      "For a FIFO/LRU trace, just track the frame set and its eviction order (queue for FIFO, recency list for LRU) mechanically - don't try to reason about which page 'should' be evicted intuitively.",
      "If a question specifically asks to demonstrate a counterintuitive result about MORE frames, it's almost certainly testing Belady's anomaly under FIFO.",
      "For EAT questions, plug numbers directly into (1-p)*ma + p*service_time - there's rarely more to it than correct unit conversion (ms vs ns).",
    ],
    pyqRelevance: `Page replacement numericals (count faults for a given reference string and frame count, under FIFO/LRU/Optimal) are extremely common, and Belady's anomaly specifically (showing MORE frames causing MORE FIFO faults) is a recurring, well-loved GATE trap.

Effective Access Time (EAT) numericals - given memory access time, page fault rate, and page fault service time, compute EAT - appear almost every year and are pure formula substitution once the page-fault mechanism itself is understood.

Conceptual questions (why Optimal isn't implementable, what thrashing is, FIFO vs LRU trade-offs) round out the remaining marks.`,
    interviewConnection: `Virtual memory and page replacement are the direct conceptual ancestors of every modern cache eviction policy - LRU caches (Redis, CDN edge caches, CPU cache lines) all face the exact same "which entry hasn't been used in a while" problem, just at a different layer of the stack.

"Why doesn't your database's buffer pool just cache everything" is really a working-set/thrashing question in disguise, and recognizing that a cache miss is the exact same trade-off as a page fault - not free, but by design - is a genuinely transferable piece of systems intuition.`,
    revisionSummary: `Virtual memory gives each process the illusion of a large, private address space by mapping only actively-used pages to physical frames on demand (demand paging). A page fault - the referenced page isn't in memory - is the expected mechanism, not an error, and triggers the OS to fetch the page from disk.

Three replacement policies: FIFO (evict oldest-resident, ignoring recent use), LRU (evict least-recently-used, approximates optimal well), Optimal (evict the page needed furthest in the future - provably best, but requires knowing the future, so it's a benchmark only).

Belady's anomaly: FIFO can produce MORE faults with MORE frames, on some reference strings - LRU and Optimal never do this.

EAT = (1-p) x ma + p x page_fault_service_time, where p is the page fault rate.`,
    shortNotes: {
      fiveMinute: "Virtual memory = illusion of large private address space, pages mapped to frames on demand. Page fault = page not in memory, triggers OS fetch - NORMAL mechanism, not an error. FIFO = evict oldest resident (ignores recent use). LRU = evict least-recently-used (approximates optimal). Optimal = evict page needed furthest in future (benchmark only, needs future knowledge). Belady's anomaly: FIFO can get MORE faults with MORE frames; LRU/Optimal never do. EAT = (1-p)*ma + p*fault_service_time.",
      oneMinute: "Page fault = normal demand-paging event, not an error. FIFO=oldest resident evicted. LRU=least recently used evicted. Optimal=benchmark only. Belady's anomaly=FIFO can worsen with more frames. EAT=(1-p)*ma+p*fault_time.",
      nightBefore: "FIFO can worsen with more frames (Belady's). LRU approximates Optimal. EAT=(1-p)*ma+p*fault_service_time.",
    },
    keyPoints: [
      "Virtual memory maps only actively-used pages to physical frames on demand, giving each process the illusion of a large private address space.",
      "A page fault - the referenced page isn't currently in memory - is demand paging's normal (if costly) mechanism, not an error condition.",
      "FIFO evicts the oldest-resident page regardless of recent use; LRU evicts the least-recently-used page; Optimal evicts the page needed furthest in the future but requires unknowable future information, so it is a benchmark only.",
      "Belady's anomaly: FIFO can produce MORE page faults with MORE frames on certain reference strings - LRU and Optimal are provably immune to this.",
      "Effective Access Time = (1 - page fault rate) x normal memory access time + page fault rate x page fault service time.",
    ],
    mcqs: [
      {
        question: "What is Belady's anomaly?",
        options: [
          "A page fault that never gets serviced",
          "The counterintuitive result that FIFO page replacement can produce MORE page faults with MORE available frames",
          "A bug that only occurs with LRU replacement",
          "The requirement that Optimal replacement needs future knowledge",
        ],
        correctIndex: 1,
        explanation: "Belady's anomaly is specifically the FIFO result that adding frames can increase, rather than decrease or maintain, the total number of page faults for certain reference strings - LRU and Optimal never exhibit this.",
      },
      {
        question: "Why is the Optimal page replacement algorithm not used in real operating systems?",
        options: [
          "It causes more faults than FIFO in practice",
          "It requires knowledge of future page references, which is not available while a program is running",
          "It is too complex to ever implement",
          "It only works for single-frame systems",
        ],
        correctIndex: 1,
        explanation: "Optimal replacement evicts the page that won't be needed for the longest time in the future - information no real system has in advance. It serves only as a theoretical best-case benchmark for comparing real algorithms.",
      },
      {
        question: "What does a page fault trigger the operating system to do?",
        options: [
          "Immediately terminate the faulting process",
          "Find or free a physical frame, load the required page from disk, update the page table, and restart the faulting instruction",
          "Ignore the reference and return zero",
          "Convert the process to use segmentation instead of paging",
        ],
        correctIndex: 1,
        explanation: "A page fault is handled by finding/freeing a frame, fetching the page from backing storage, updating the page table entry, and re-executing the instruction that originally faulted - the process resumes as if the page had been there all along, just slower.",
      },
    ],
    numericals: [
      {
        question: "Memory access time is 100 ns, page fault service time is 8 ms, and the page fault rate is 0.001. What is the effective access time, in nanoseconds?",
        answerMin: 8099.9,
        answerMax: 8099.9,
        unit: "ns",
        solution: `  Convert: page fault service time = 8 ms = 8,000,000 ns

  EAT = (1 - p) x ma + p x fault_service_time
      = (1 - 0.001) x 100 + 0.001 x 8,000,000
      = 0.999 x 100 + 8000
      = 99.9 + 8000
      = 8099.9 ns

Even a tiny 0.1% fault rate dominates the effective access time,
because the fault service time (8 ms) is roughly 80,000 times the
normal access time (100 ns) - which is exactly why keeping the
page fault rate low matters so much in practice.`,
      },
      {
        question: "For the reference string 1,2,3,4,1,2,5,1,2,3,4,5 with 3 frames, how many page faults occur under FIFO?",
        answerMin: 9,
        answerMax: 9,
        unit: "faults",
        solution: `  Tracing FIFO (see the dryRun above for the full step-by-step trace):
  1,2,3 -> 3 faults; 4 -> fault (evict 1); 1,2 -> both faults again
  (evicted earlier); 5 -> fault (evict 4); 1,2 -> both HITS this time;
  3 -> fault (evict 1); 4 -> fault (evict 2); 5 -> HIT.

  Total = 9 faults.

  (With 4 frames, the SAME string produces 10 faults - Belady's
  anomaly: MORE frames giving MORE faults under FIFO.)`,
      },
    ],
  },

  // ---------------- File Systems ----------------

  "file-systems": {
    difficulty: "Moderate",
    estimatedMinutes: 40,
    xpReward: 30, coinReward: 12,
    // Verified real (title confirmed via direct fetch, 2026-08-13).
    resources: [{
      kind: "video",
      title: "File System Implementation | Chapter-11 | Operating System - Neso Academy",
      url: "https://www.youtube.com/watch?v=-yNgx1pAa64",
      description: "Whole video covers this topic from the start.",
    }],
    whatYoullLearn: [
      "What a file system actually organizes: files, directories, and the metadata tracking them",
      "Contiguous, linked, and indexed file allocation, and the trade-offs between them",
      "Multi-level (single/double/triple indirect) indexing, and computing maximum file size from it",
      "Free space management: bitmaps versus free lists",
    ],
    prerequisites: ["Virtual Memory and Paging"],
    concept: `## A Library's Card Catalog For Your Disk

::: story
A library without a card catalog is just a warehouse of books piled on the floor - the books (data blocks) exist, but finding "War and Peace" means checking every shelf. The card catalog (a directory entry plus an inode/File Control Block) is what turns a pile of blocks into something you can actually navigate: a name, a location, and everything else worth knowing about it.
:::

::: remember
A file system organizes data into named files, tracks where each file's blocks physically live via metadata (an inode or FCB), and groups files together using directories. Nearly everything else in this topic is a design decision about HOW that block-location tracking is done.
:::

## Three Ways To Track A File's Blocks

::: cards Allocation methods, and their trade-offs
Contiguous :: All of a file's blocks sit in one unbroken run. Fastest for both sequential AND random access (just start block + offset), but suffers external fragmentation and requires knowing the file's final size in advance.
Linked :: Each block holds a pointer to the next block of the same file, scattered anywhere on disk. No external fragmentation, and files can grow freely - but random access is slow (must follow pointers from the start every time), space is spent on pointers, and one broken link corrupts everything after it.
Indexed :: A dedicated index block holds pointers to ALL of the file's data blocks. Fast random access (look up the index, jump straight there) with no external fragmentation, at the cost of the index block's own overhead - and small files still need one.
:::

::: mistake
Linked allocation and indexed allocation are NOT the same thing, despite both avoiding external fragmentation. Linked allocation's random access is slow - reaching block 500 means following 500 pointers from the start. Indexed allocation reaches ANY block directly through the index, which is exactly why real file systems use indexing (or a hybrid), not plain linked lists.
:::

## Multi-Level Indexing: How Real Inodes Handle Big Files

::: cards The classic Unix inode structure
Direct blocks :: A handful of block pointers stored right in the inode itself - fast, no extra disk read, but only covers small files.
Single indirect :: One pointer to a block that is ITSELF full of pointers to data blocks - one extra disk read to reach the data, but covers far more blocks per inode entry used.
Double indirect :: A pointer to a block of pointers to blocks of pointers - two extra disk reads, covering a vastly larger range.
Triple indirect :: One more level still - three extra disk reads, for genuinely enormous files.
:::

::: checkpoint
An inode has 10 direct block pointers and 1 single-indirect pointer. Each index block holds 256 pointers. What is the maximum file size, in blocks?
- ( ) 256 blocks
- (x) 10 + 256 = 266 blocks
- ( ) 10 x 256 = 2560 blocks
- ( ) 256 x 256 = 65536 blocks
> The direct blocks and the single-indirect region are ADDITIVE, not multiplicative - the file's total block count is whatever the direct pointers cover PLUS whatever the one single-indirect block's 256 pointers cover: 10 + 256 = 266.
:::

## Free Space Management

::: cards Tracking what's NOT in use
Bitmap :: One bit per block, 1 = used, 0 = free. Compact, and finding a run of contiguous free blocks is a simple bit-scan.
Free list (linked list) :: Each free block holds a pointer to the next free block. Simple, but finding a contiguous run of free blocks means walking the list - no shortcut, unlike a bitmap's direct scan.
:::

::: tip
GATE almost always asks the multi-level indexing question as a maximum-file-size computation: multiply pointers-per-block by itself once per indirection level (single = 1x, double = 2x, triple = 3x), then add every level's contribution to the direct blocks - additive across levels, multiplicative WITHIN a level.
:::`,
    deepDive: `## Computing Maximum File Size, In Full

For an inode with D direct pointers, and single/double/triple indirect pointers each leading to index blocks holding N pointers apiece:

  Max file size (in blocks) = D + N + N^2 + N^3
  Max file size (in bytes)  = (D + N + N^2 + N^3) x block size

N itself comes from N = block size / pointer size - so a 4 KB block with 4-byte pointers gives N = 1024, and the triple-indirect term alone (N^3 = 1024^3 ≈ 1.07 billion blocks) is why triple indirection supports genuinely enormous files despite each individual inode staying tiny.

## Why Additive Across Levels, Multiplicative Within One

Each indirection level is an independent additional REGION of the file's address space - the direct region, then the single-indirect region, then the double, then the triple - so their block counts simply sum. But WITHIN one level, every extra hop through an index block multiplies the reach by N again, because each of the N pointers at one level leads to another full block of N pointers at the next. Mixing these two up (adding when you should multiply, or vice versa) is the single most common error in this calculation.`,
    codeExample: {
      language: "javascript",
      code: `// Maximum file size from a classic multi-level-index inode structure
function pointersPerBlock(blockSize, pointerSize) {
  return blockSize / pointerSize;
}

function maxFileSizeBlocks(direct, blockSize, pointerSize, levels) {
  const N = pointersPerBlock(blockSize, pointerSize);
  let total = direct;
  for (let level = 1; level <= levels; level++) {
    total += Math.pow(N, level);   // N, N^2, N^3 for single/double/triple
  }
  return total;
}

// 12 direct blocks, 1KB blocks, 4-byte pointers, single + double indirect (2 levels)
const blocks = maxFileSizeBlocks(12, 1024, 4, 2);
console.log("Pointers per block (N):", pointersPerBlock(1024, 4));
console.log("Max file size (blocks):", blocks);
console.log("Max file size (bytes):", blocks * 1024);`,
      expectedOutput: `Pointers per block (N): 256
Max file size (blocks): 65804
Max file size (bytes): 67383296`,
    },
    workedExamples: [
      {
        title: "Maximum file size with direct + single + double indirect",
        problem: "An inode has 12 direct block pointers, 1 single-indirect pointer, and 1 double-indirect pointer. Block size is 1024 bytes and each pointer is 4 bytes. What is the maximum file size, in blocks and in bytes?",
        solution: `  Pointers per index block, N = block size / pointer size = 1024 / 4 = 256

  Direct region       = 12 blocks
  Single indirect      = N     = 256 blocks
  Double indirect       = N^2   = 256 x 256 = 65536 blocks

  Max file size (blocks) = 12 + 256 + 65536 = 65804 blocks
  Max file size (bytes)  = 65804 x 1024 = 67,383,296 bytes ≈ 64.27 MB

Notice how much of the total comes from the double-indirect term alone (65536 out of 65804 blocks, over 99.5%) - which is exactly why adding one more indirection level buys a disproportionate amount of maximum file size for a tiny fixed cost (one more pointer in the inode).`,
      },
    ],
    dryRun: `Trace which blocks the file system must read to access byte offset 20000 of a file, given: block size 1024 bytes, 12 direct block pointers (indices 0-11), then a single-indirect region (indices 12 onward) with 256 pointers per index block.

::: timeline Locating byte 20000
Find the block index :: block index = floor(20000 / 1024) = 19 (since 19 x 1024 = 19456). Offset within that block = 20000 - 19456 = 544.
Is index 19 direct or indirect? :: Direct covers indices 0-11 (12 blocks). Index 19 is NOT direct - it falls in the single-indirect region.
Find the position within the single-indirect region :: 19 - 12 = 7. This is entry #7 (0-indexed) of the single-indirect index block.
Read the index block :: The inode's single-indirect pointer leads to an index block full of 256 data-block pointers - this costs ONE disk read.
Read entry 7 of that index block :: This pointer gives the actual data block's location on disk.
Read the data block :: A SECOND disk read fetches the actual data block. Byte 544 within it is the byte originally requested.
:::

Total disk reads to satisfy this single request: 2 (one for the index block, one for the data block) - beyond the inode itself, which is typically already cached in memory. Compare this to a DIRECT block access (index 0-11), which needs only 1 disk read - the extra read is exactly the cost of one level of indirection, and it is why deeply indexed accesses are measurably slower than accesses to a file's first few blocks.`,
    analogies: [
      "A file system is a library's card catalog: without it, the data blocks are just books piled on the floor, findable only by checking every shelf. The catalog (directory + inode) is what makes lookup direct instead of exhaustive.",
      "Multi-level indexing is a postal address hierarchy: direct blocks are like knowing someone's exact house (no extra step), while triple-indirect is like only knowing their country, so you go country -> state -> city -> street -> house, one more directory lookup at each level.",
    ],
    commonMistakes: [
      "Confusing linked allocation's slow random access (must follow pointers from the start) with indexed allocation's fast random access (jump straight there via the index).",
      "Forgetting the index block itself takes up space (and, for indirect blocks, an extra disk read) - it's overhead, not free bookkeeping.",
      "Computing multi-level maximum file size by adding levels that should be multiplied, or multiplying levels that should be added - it's ADDITIVE across direct/single/double/triple regions, but MULTIPLICATIVE (N, N^2, N^3) within how far each level reaches.",
      "Forgetting to include the direct blocks' contribution when computing total maximum file size - they're a separate, smaller region, not folded into the indirect calculation.",
      "Assuming a bitmap and a free list manage free space identically. A bitmap allows a direct bit-scan for contiguous runs; a free list requires walking pointers, which is slower for exactly that purpose.",
    ],
    memoryTricks: [
      "Linked = slow random access (follow pointers). Indexed = fast random access (jump via the index block).",
      "Max file size: ADD across levels (direct + single + double + triple), MULTIPLY within a level (N, N^2, N^3).",
      "N = block size / pointer size. Compute N once, reuse it for every indirection level.",
    ],
    formulas: [
      "Pointers per index block, N = block size / pointer size.",
      "Max file size (blocks) = direct blocks + N (single indirect) + N^2 (double indirect) + N^3 (triple indirect).",
      "Max file size (bytes) = Max file size (blocks) x block size.",
      "Disk reads to access a block at indirection level k (0 = direct) = k + 1 (k index-block reads, plus 1 for the data block itself).",
    ],
    shortcuts: [
      "Compute N (pointers per block) once at the start of any multi-level indexing question - every subsequent term is just a power of N.",
      "When asked which allocation region a given block index falls into, subtract the direct-block count first, then divide by N to see how many full single-indirect index blocks it takes to reach that far.",
    ],
    pyqRelevance: `Maximum-file-size computation from a multi-level inode structure (given block size, pointer size, and the number of direct/indirect levels) is a near-guaranteed GATE numerical - the arithmetic is mechanical once N is computed correctly.

Conceptual questions compare allocation methods directly (which has the best random access, which wastes the most space on pointers, which requires knowing file size in advance) and are common 1-mark items.

Free space management (bitmap vs free list) is asked less often but shows up as a straightforward "which is better for finding contiguous free space" question.`,
    interviewConnection: `Real file systems (ext4, NTFS, APFS) are all refinements of exactly this indexed-allocation idea, and understanding WHY deeply nested files/directories or heavily fragmented large files can be slower to access ties directly back to the extra disk-read-per-indirection-level cost shown in the dry run above.

"Why do some databases avoid the OS file system and manage raw disk blocks themselves" is a real systems-design question whose honest answer routes through exactly this material - a database engine often wants tighter control over allocation and indexing than a general-purpose file system's indexed-inode scheme provides.`,
    revisionSummary: `A file system organizes data into named files, tracked via metadata (inode/FCB) and grouped into directories.

Three allocation methods: contiguous (fast, but external fragmentation and requires knowing size upfront), linked (no external fragmentation, but slow random access and pointer overhead), indexed (fast random access via a dedicated index block, no external fragmentation, some index overhead).

Multi-level indexing (direct, single/double/triple indirect) is additive across levels but multiplicative within a level: max file size (blocks) = direct + N + N^2 + N^3, where N = block size / pointer size.

Free space is tracked via a bitmap (direct bit-scan for contiguous runs) or a free list (must walk pointers).`,
    shortNotes: {
      fiveMinute: "File system = files + directories + metadata (inode/FCB) tracking block locations. Contiguous=fast but external frag + needs size upfront. Linked=no external frag but slow random access + pointer overhead. Indexed=fast random access via index block, no external frag, index overhead. Multi-level: direct + single(N) + double(N^2) + triple(N^3), additive across levels, multiplicative within a level; N=blocksize/pointersize. Free space: bitmap (direct scan) vs free list (must walk pointers).",
      oneMinute: "Contiguous=fast, external frag. Linked=slow random access. Indexed=fast random access via index block. Max file size=direct+N+N^2+N^3, N=blocksize/pointersize. Bitmap vs free list for free space.",
      nightBefore: "Indexed = fast random access; linked = slow. Max file size = direct+N+N^2+N^3 (N=blocksize/pointersize).",
    },
    keyPoints: [
      "A file system tracks a file's blocks via metadata (inode/FCB) and organizes files into directories.",
      "Contiguous allocation is fast but suffers external fragmentation and needs the file size known in advance; linked allocation avoids external fragmentation but has slow random access; indexed allocation gives fast random access via a dedicated index block.",
      "Multi-level indexing (direct, single/double/triple indirect) is additive across levels but multiplicative within a level: max file size in blocks = direct + N + N^2 + N^3, where N = block size / pointer size.",
      "Each additional indirection level costs one more disk read to reach the data block, but the reach (N per level) grows multiplicatively, which is why one extra level buys a disproportionate increase in maximum file size.",
      "Free space is tracked via a bitmap (fast bit-scan for contiguous runs) or a free list (must walk pointers to find contiguous free space).",
    ],
    mcqs: [
      {
        question: "Why is random access slow under linked file allocation but fast under indexed allocation?",
        options: [
          "Linked allocation stores files on slower disks",
          "Reaching a block under linked allocation requires following pointers from the start of the file, while indexed allocation can jump directly to any block via the index",
          "Indexed allocation does not use disk blocks at all",
          "There is no difference between the two for random access",
        ],
        correctIndex: 1,
        explanation: "Linked allocation only knows the NEXT block from the current one, so reaching block k requires k pointer hops from the start; indexed allocation stores every block's location directly in the index, reachable in one lookup regardless of position.",
      },
      {
        question: "An inode has 10 direct pointers, 1 single-indirect pointer, and 1 double-indirect pointer, with 100 pointers per index block. What is the maximum file size, in blocks?",
        options: ["110", "10,100", "10,110", "1,000,010"],
        correctIndex: 2,
        explanation: "Direct = 10, single indirect = 100 (N), double indirect = 100 x 100 = 10,000 (N^2). Total = 10 + 100 + 10,000 = 10,110 blocks - additive across levels, with each level's own reach computed as a power of N.",
      },
      {
        question: "Which free space management technique allows a direct bit-scan to find contiguous free blocks?",
        options: ["Free list (linked list of free blocks)", "Bitmap", "Indexed allocation", "Contiguous allocation"],
        correctIndex: 1,
        explanation: "A bitmap dedicates one bit per block, so scanning for a run of contiguous free blocks is a direct scan over bits; a free list only knows each free block's NEXT pointer, requiring a pointer-chasing walk to find a contiguous run.",
      },
    ],
    numericals: [
      {
        question: "An inode has 8 direct block pointers, 1 single-indirect pointer, and 1 double-indirect pointer. The block size is 512 bytes and each pointer is 4 bytes. What is the maximum file size, in blocks?",
        answerMin: 16520,
        answerMax: 16520,
        unit: "blocks",
        solution: `  Pointers per block, N = 512 / 4 = 128

  Direct           = 8
  Single indirect  = N   = 128
  Double indirect  = N^2 = 128 x 128 = 16,384

  Max file size = 8 + 128 + 16,384 = 16,520 blocks`,
      },
    ],
  },

};
