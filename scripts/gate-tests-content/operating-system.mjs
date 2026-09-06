export const TEST = {
  subjectId: "operating-system",
  title: "Operating System — Subject Test",
  description: "8 questions covering processes, concurrency, deadlock, scheduling, memory management, and file systems.",
  testType: "subject",
  durationMinutes: 45,
  instructions: "Standard GATE marking applies: MCQ negative marking (-1/3 for 1-mark, -2/3 for 2-mark), no negative marking for MSQ or NAT.",
  questions: [
    {
      questionType: "mcq", marks: 1, difficulty: "Easy",
      question: "What is the key difference between a process and a thread?",
      options: [
        { id: "a", text: "Threads have their own separate address space; processes share one" },
        { id: "b", text: "Threads within the same process share an address space; each process has its own" },
        { id: "c", text: "There is no meaningful difference" },
        { id: "d", text: "A process can only have one thread" },
      ],
      correctOptionIds: ["b"],
      solution: "Threads within the same process SHARE that process's address space (code, data, heap); each process has its OWN separate address space.",
      explanation: "This shared address space is exactly why inter-thread communication is cheaper than inter-process communication, but also why threads can more easily corrupt each other's data.",
    },
    {
      questionType: "mcq", marks: 2, difficulty: "Moderate",
      question: "Which of the four necessary conditions for deadlock is targeted by the Banker's Algorithm's approach (deadlock AVOIDANCE)?",
      options: [
        { id: "a", text: "It prevents mutual exclusion" },
        { id: "b", text: "It grants a resource request only if the resulting state is still 'safe' (won't lead to deadlock)" },
        { id: "c", text: "It eliminates the hold-and-wait condition entirely" },
        { id: "d", text: "It preempts resources whenever requested" },
      ],
      correctOptionIds: ["b"],
      solution: "The Banker's Algorithm checks, before granting a request, whether the resulting resource-allocation state is still SAFE (a sequence exists where all processes can complete) - avoidance, not prevention of any specific necessary condition.",
      explanation: "This distinguishes AVOIDANCE (dynamic, per-request checking) from PREVENTION (statically ruling out one of the four necessary conditions ahead of time).",
    },
    {
      questionType: "nat", marks: 2, difficulty: "Moderate",
      question: "Processes with burst times 6, 8, 7, 3 arrive at the same time. Using SJF (non-preemptive) scheduling, what is the average waiting time?",
      natMin: 7, natMax: 7,
      solution: `SJF executes in ascending burst-time order: 3, 6, 7, 8.
Waiting time = start time of each (all arrive at 0):
  Burst 3: starts at 0, waits 0
  Burst 6: starts at 3, waits 3
  Burst 7: starts at 3+6=9, waits 9
  Burst 8: starts at 9+7=16, waits 16
Sum = 0+3+9+16 = 28. Average = 28/4 = 7.`,
      explanation: "SJF non-preemptive orders execution purely by burst time when all arrive together, minimizing average waiting time among non-preemptive policies for this arrival pattern.",
    },
    {
      questionType: "mcq", marks: 1, difficulty: "Moderate",
      question: "Which CPU scheduling algorithm can lead to STARVATION of long processes?",
      options: [
        { id: "a", text: "Round Robin" },
        { id: "b", text: "FCFS (First Come First Served)" },
        { id: "c", text: "Shortest Job First (SJF)" },
        { id: "d", text: "None of these can cause starvation" },
      ],
      correctOptionIds: ["c"],
      solution: "SJF can starve long processes indefinitely if a continuous stream of shorter jobs keeps arriving and getting prioritized ahead of them.",
      explanation: "FCFS and Round Robin both guarantee every process eventually runs (no indefinite postponement), unlike SJF's priority-by-length approach.",
    },
    {
      questionType: "mcq", marks: 2, difficulty: "Hard",
      question: "In a paging system, what causes a PAGE FAULT?",
      options: [
        { id: "a", text: "A process tries to access a memory address outside its allocated space" },
        { id: "b", text: "A process references a page that is not currently loaded in physical memory" },
        { id: "c", text: "The CPU cache misses" },
        { id: "d", text: "A syntax error in the program" },
      ],
      correctOptionIds: ["b"],
      solution: "A page fault occurs when a referenced page is not currently resident in physical memory (RAM), requiring the OS to load it from disk (swap space).",
      explanation: "This is distinct from a segmentation fault (option a, an out-of-bounds/invalid access) - a page fault is a normal, expected event handled by the OS, not necessarily an error.",
    },
    {
      questionType: "mcq", marks: 1, difficulty: "Moderate",
      question: "Which page replacement algorithm can suffer from BELADY'S ANOMALY (more frames leading to MORE page faults)?",
      options: [
        { id: "a", text: "LRU (Least Recently Used)" },
        { id: "b", text: "Optimal (OPT)" },
        { id: "c", text: "FIFO (First In First Out)" },
        { id: "d", text: "None of these" },
      ],
      correctOptionIds: ["c"],
      solution: "FIFO page replacement can exhibit Belady's Anomaly - counterintuitively, increasing the number of frames can sometimes INCREASE the total number of page faults.",
      explanation: "LRU and Optimal are both 'stack algorithms', a property that specifically guarantees they never suffer Belady's Anomaly; FIFO is not a stack algorithm.",
    },
    {
      questionType: "nat", marks: 1, difficulty: "Easy",
      question: "In the semaphore-based solution to the producer-consumer problem with a bounded buffer of size 10, what should the initial value of the 'empty' semaphore be?",
      natMin: 10, natMax: 10,
      solution: "The 'empty' semaphore tracks available empty slots - initially, the entire buffer (all 10 slots) is empty, so it starts at 10.",
      explanation: "The 'full' semaphore, by contrast, starts at 0 (no items produced yet) - the two semaphores track opposite quantities.",
    },
    {
      questionType: "msq", marks: 2, difficulty: "Hard",
      question: "Which of the following are among the FOUR necessary conditions for deadlock to occur?",
      options: [
        { id: "a", text: "Mutual exclusion" },
        { id: "b", text: "Hold and wait" },
        { id: "c", text: "Preemption (resources can always be forcibly taken)" },
        { id: "d", text: "Circular wait" },
      ],
      correctOptionIds: ["a", "b", "d"],
      solution: "The four necessary (Coffman) conditions are: mutual exclusion (a: TRUE), hold and wait (b: TRUE), NO preemption (resources cannot be forcibly taken - the OPPOSITE of option c, making c FALSE as stated), and circular wait (d: TRUE).",
      explanation: "Option (c) states the condition backwards - the actual necessary condition is 'no preemption', not 'preemption is always possible'; this reversal is a common trap.",
    },
  ],
};
