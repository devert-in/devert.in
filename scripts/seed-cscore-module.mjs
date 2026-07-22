import admin from "firebase-admin";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(path.join(__dirname, "service-account.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

function slugify(s) { return s.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""); }

const SUBJECTS = [
  { id: "operating-systems", name: "Operating Systems", icon: "🖥️", difficulty: "Intermediate", estimatedDuration: "6-8 weeks", order: 1,
    placementRelevance: "One of the four subjects asked in nearly every product-company technical interview (alongside DBMS, Networks, OOP) - process/thread and deadlock questions are especially common.",
    industryUsage: "Underpins process scheduling, memory management, and file systems in every real operating system - Linux, Windows, Android." },
  { id: "dbms", name: "Database Management System", icon: "🗄️", difficulty: "Intermediate", estimatedDuration: "5-7 weeks", order: 2,
    placementRelevance: "A core interview subject at almost every company - normalization, keys, joins, and transactions are asked constantly regardless of role.",
    industryUsage: "Every application with persistent data relies on database design principles - from a college ERP to a bank's core system." },
  { id: "computer-networks", name: "Computer Networks", icon: "🌐", difficulty: "Intermediate", estimatedDuration: "5-7 weeks", order: 3,
    placementRelevance: "Frequently tested at product companies, especially for backend/infra roles - OSI model, TCP vs UDP, and HTTP/HTTPS are classic questions.",
    industryUsage: "Every networked application - from a browser loading a webpage to a microservice calling another - relies on these fundamentals." },
  { id: "oop", name: "Object-Oriented Programming", icon: "🧩", difficulty: "Beginner", estimatedDuration: "3-4 weeks", order: 4,
    placementRelevance: "Asked in almost every interview regardless of language - the four pillars and SOLID principles are baseline expectations.",
    industryUsage: "The dominant paradigm behind most enterprise software architecture, from Java backends to C# desktop apps." },
  { id: "software-engineering", name: "Software Engineering", icon: "📐", difficulty: "Beginner", estimatedDuration: "3-4 weeks", order: 5,
    placementRelevance: "Tested in HR/managerial rounds and increasingly in technical rounds at companies that value process maturity (Agile/Scrum experience).",
    industryUsage: "Every real software team operates under some SDLC model - understanding Agile/Scrum is table stakes for working on a team." },
  { id: "computer-organization", name: "Computer Organization & Architecture", icon: "⚙️", difficulty: "Intermediate", estimatedDuration: "4-6 weeks", order: 6,
    placementRelevance: "Common in core/hardware-adjacent company interviews and GATE - number systems and logic gates also show up in aptitude rounds.",
    industryUsage: "Explains why software behaves the way it does at the hardware level - caching, pipelining, and memory hierarchy decisions all trace back here." },
  { id: "compiler-design", name: "Compiler Design", icon: "🔨", difficulty: "Advanced", estimatedDuration: "4-6 weeks", order: 7,
    placementRelevance: "Asked mainly at companies building developer tools/languages, and a common GATE subject - less universal than OS/DBMS/Networks.",
    industryUsage: "Explains how every programming language you use actually gets turned into something a machine can run." },
  { id: "design-patterns", name: "Design Patterns", icon: "🏗️", difficulty: "Intermediate", estimatedDuration: "3-4 weeks", order: 8,
    placementRelevance: "Common in product-company interviews for experienced/senior-track roles, and a strong signal of code-quality awareness for freshers.",
    industryUsage: "Reusable solutions applied throughout real codebases - Spring Framework alone uses Factory, Singleton, and Proxy patterns extensively." },
  { id: "system-design-beginner", name: "System Design (Beginner)", icon: "🏛️", difficulty: "Intermediate", estimatedDuration: "4-6 weeks", order: 9,
    placementRelevance: "Increasingly asked even at the fresher/intern level at product companies as a 'how do you think about scale' screening question.",
    industryUsage: "The actual discipline behind designing every large-scale system - load balancers, caches, and CDNs are everywhere in production software." },
  { id: "cloud-fundamentals", name: "Cloud Fundamentals", icon: "☁️", difficulty: "Beginner", estimatedDuration: "3-4 weeks", order: 10,
    placementRelevance: "A differentiator on a fresher's resume - basic AWS/Docker/Kubernetes familiarity is often listed as a 'good to have' in job descriptions.",
    industryUsage: "Nearly all modern software is deployed to the cloud - containers and orchestration are standard practice, not niche skills." },
  { id: "linux-fundamentals", name: "Linux Fundamentals", icon: "🐧", difficulty: "Beginner", estimatedDuration: "2-4 weeks", order: 11,
    placementRelevance: "Expected baseline for any backend/DevOps role - basic terminal fluency is often assumed, not taught, once you're hired.",
    industryUsage: "The overwhelming majority of production servers run Linux - comfort with the terminal is a daily-use skill for most engineers." },
  { id: "git-github", name: "Git & GitHub", icon: "🔀", difficulty: "Beginner", estimatedDuration: "1-2 weeks", order: 12,
    placementRelevance: "Rarely asked as trivia, but expected as a working skill from day one of any internship or job - and often checked via your GitHub profile itself.",
    industryUsage: "The universal version control system behind virtually every software team's workflow." },
  { id: "rest-apis", name: "REST APIs", icon: "🔌", difficulty: "Beginner", estimatedDuration: "2-3 weeks", order: 13,
    placementRelevance: "Core knowledge for any full-stack/backend interview - status codes, authentication, and CRUD design come up constantly.",
    industryUsage: "The standard way frontend and backend systems (and different backend services) communicate with each other." },
  { id: "security-fundamentals", name: "Security Fundamentals", icon: "🔐", difficulty: "Intermediate", estimatedDuration: "3-4 weeks", order: 14,
    placementRelevance: "Increasingly asked even outside dedicated security roles - SQL injection and XSS are common 'what would you check for' interview questions.",
    industryUsage: "Every production application needs to defend against the OWASP Top 10 - this isn't optional specialist knowledge anymore." },
  { id: "aptitude-foundations", name: "Aptitude Foundations", icon: "🧮", difficulty: "Beginner", estimatedDuration: "2-3 weeks", order: 15,
    placementRelevance: "The gatekeeper round at nearly every service-company placement drive (TCS, Infosys, Wipro, Cognizant) - often the very first filter before any technical round.",
    industryUsage: "Not directly used on the job, but the actual first hurdle most students face in the placement process." },
].map(s => ({ ...s, status: "published" }));

const OS_MODULES = [
  { module: "Introduction & Processes", topics: ["Introduction", "Processes", "Threads"] },
  { module: "Scheduling & Synchronization", topics: ["CPU Scheduling", "Synchronization", "Deadlocks"] },
  { module: "Memory Management", topics: ["Memory Management", "Paging", "Segmentation", "Virtual Memory"] },
  { module: "Storage", topics: ["File Systems", "Disk Scheduling"] },
  { module: "Systems & Practice", topics: ["System Calls", "Linux Basics", "OS Interview Questions", "Mock Test"] },
];

const OS_CONTENT = {
  "introduction": {
    difficulty: "Beginner", estimatedMinutes: 15,
    whatYoullLearn: ["What an operating system actually does", "The four main roles of an OS: process, memory, file, and device management", "The difference between a kernel and an OS"],
    prerequisites: [],
    concept: "An Operating System is the software layer that sits between hardware and every application you run, managing hardware resources so applications don't have to talk to hardware directly. Without an OS, every program would need its own code to manage the CPU, memory, disk, and every connected device - which is exactly how early computers worked, and exactly why the OS was invented.\n\nThe OS has four core responsibilities:\n- Process management: deciding which program gets the CPU and for how long\n- Memory management: allocating and protecting RAM between running programs\n- File management: organizing data into files and directories on storage\n- Device management: mediating access to hardware like disks, keyboards, and network cards\n\nThe kernel is the core part of the OS that actually does this - it runs in a privileged CPU mode with direct hardware access, while normal applications run in user mode and must ask the kernel (via system calls) to do anything privileged, like reading a file or allocating memory.",
    keyPoints: ["The OS manages hardware resources so applications don't have to", "The kernel is the privileged core of the OS; applications run in user mode", "System calls are how user-mode programs request kernel services"],
    commonMistakes: ["Treating 'kernel' and 'operating system' as identical - the kernel is the core, but a full OS also includes libraries, utilities, and a user interface", "Assuming the OS runs 'alongside' programs rather than beneath them, managing them"],
    interviewTips: ["Be ready to name the OS's core responsibilities without hesitation - it's often the opening question in an OS round", "Know the user-mode vs kernel-mode distinction - it comes up when discussing system calls, context switches, and security"],
    realWorldApplications: ["Every device you use - phone, laptop, server - runs an OS doing exactly this job, whether it's Linux, Windows, iOS, or Android"],
    codeExample: { language: "c", code: "// A system call in action - open() asks the OS kernel to open a file,\n// something user-mode code cannot do directly.\n#include <fcntl.h>\nint main() {\n    int fd = open(\"data.txt\", O_RDONLY);\n    return 0;\n}" },
    mcqs: [
      { question: "What CPU mode does the kernel run in?", options: ["User mode", "Privileged/kernel mode", "Both simultaneously", "Neither - it's hardware"], correctIndex: 1 },
      { question: "Which of these is NOT one of the OS's core responsibilities?", options: ["Process management", "Memory management", "Compiling source code", "File management"], correctIndex: 2 },
    ],
    assignment: "List five operating systems you've used (phone, laptop, etc.) and identify which kernel each is built on (e.g. Android -> Linux kernel).",
    xpReward: 25, coinReward: 10,
  },
  "processes": {
    difficulty: "Beginner", estimatedMinutes: 20,
    whatYoullLearn: ["What a process is and how it differs from a program", "The process states: new, ready, running, waiting, terminated", "What's stored in a Process Control Block (PCB)"],
    prerequisites: ["Introduction"],
    concept: "A program is a passive set of instructions stored on disk (like an .exe file); a process is that program actually loaded into memory and running, with its own allocated resources - memory space, open file handles, and CPU register state. The same program can be run multiple times as multiple distinct processes (e.g. opening two browser windows).\n\nEvery process moves through a lifecycle of states: New (being created) -> Ready (waiting for CPU time) -> Running (actively executing on the CPU) -> Waiting/Blocked (waiting on I/O or an event) -> Terminated. The OS tracks every process's current state, register values, memory allocation, and more in a data structure called the Process Control Block (PCB) - one PCB per process, which is what makes context switching between processes possible: the OS saves the current process's PCB and loads the next one's.",
    keyPoints: ["A process is a program in execution, with its own memory and resources", "Process states: New, Ready, Running, Waiting, Terminated", "The PCB stores everything the OS needs to pause and resume a process"],
    commonMistakes: ["Using 'program' and 'process' interchangeably - a program is static code on disk; a process is a live, running instance of it", "Forgetting that a single program can spawn multiple independent processes"],
    interviewTips: ["Be ready to draw or describe the process state diagram from memory - it's one of the most commonly asked OS diagrams", "Know what's stored in a PCB (register values, process state, memory pointers, scheduling info)"],
    realWorldApplications: ["Your Task Manager or Activity Monitor is literally listing the OS's current processes and their states in real time"],
    codeExample: { language: "c", code: "#include <unistd.h>\n#include <stdio.h>\nint main() {\n    pid_t pid = fork(); // creates a new process\n    if (pid == 0) printf(\"Child process\\n\");\n    else printf(\"Parent process\\n\");\n    return 0;\n}" },
    mcqs: [
      { question: "What is stored in a Process Control Block?", options: ["Only the process's source code", "Process state, register values, and memory info", "Only the process ID", "The compiled binary"], correctIndex: 1 },
      { question: "A program becomes a process when:", options: ["It's compiled", "It's loaded into memory and executed", "It's saved to disk", "It's written in a text editor"], correctIndex: 1 },
    ],
    assignment: "Open your system's task/activity manager and identify 5 running processes, noting which program each belongs to.",
    xpReward: 25, coinReward: 10,
  },
  "cpu-scheduling": {
    difficulty: "Intermediate", estimatedMinutes: 30,
    whatYoullLearn: ["Why CPU scheduling exists and what it optimizes for", "The main scheduling algorithms: FCFS, SJF, Round Robin, Priority", "How to calculate waiting time and turnaround time"],
    prerequisites: ["Processes"],
    concept: "With multiple processes ready to run but only a limited number of CPU cores, the OS's scheduler decides which process gets the CPU next and for how long. Good scheduling matters because it directly affects system responsiveness and throughput.\n\nCommon algorithms, each with a different trade-off:\n- FCFS (First Come First Served): processes run in arrival order. Simple, but a long process can block short ones behind it (the 'convoy effect').\n- SJF (Shortest Job First): the shortest process runs next, minimizing average waiting time - but requires knowing job length in advance, which is often impossible, and can starve long jobs.\n- Round Robin: each process gets a fixed time slice (quantum), then moves to the back of the queue. Fair and responsive for interactive systems, but a very small quantum increases context-switching overhead.\n- Priority Scheduling: higher-priority processes run first; can starve low-priority ones unless combined with 'aging' (gradually increasing the priority of processes that have waited a long time).\n\nTwo numbers you'll calculate constantly: Waiting Time = Turnaround Time - Burst Time, and Turnaround Time = Completion Time - Arrival Time.",
    keyPoints: ["FCFS is simple but suffers from the convoy effect", "SJF minimizes average waiting time but needs to know burst time in advance", "Round Robin is fair and used in most real interactive/time-sharing systems", "Waiting Time = Turnaround Time - Burst Time"],
    commonMistakes: ["Confusing waiting time with turnaround time - turnaround time includes the burst (execution) time, waiting time doesn't", "Assuming SJF is always better - it requires future knowledge of burst time, which is a major practical limitation", "Choosing too small a Round Robin quantum, which increases overhead from excessive context switching"],
    interviewTips: ["Practice solving a Gantt chart for FCFS/SJF/Round Robin by hand with a small example set - this is a very common written/whiteboard question", "Be ready to explain the convoy effect and starvation, and how aging solves priority starvation"],
    realWorldApplications: ["Linux's Completely Fair Scheduler (CFS) is a real-world evolution of these same ideas, balancing fairness and responsiveness across all running processes"],
    codeExample: { language: "python", code: "# Turnaround and waiting time for a simple FCFS example\nprocesses = [(\"P1\", 0, 5), (\"P2\", 1, 3), (\"P3\", 2, 8)]  # (name, arrival, burst)\ntime = 0\nfor name, arrival, burst in processes:\n    start = max(time, arrival)\n    completion = start + burst\n    turnaround = completion - arrival\n    waiting = turnaround - burst\n    print(name, \"waiting:\", waiting, \"turnaround:\", turnaround)\n    time = completion" },
    mcqs: [
      { question: "Which scheduling algorithm can suffer from the 'convoy effect'?", options: ["Round Robin", "FCFS", "Priority with aging", "SJF with known burst times"], correctIndex: 1 },
      { question: "Waiting Time is calculated as:", options: ["Completion Time - Arrival Time", "Turnaround Time - Burst Time", "Burst Time - Arrival Time", "Completion Time - Burst Time"], correctIndex: 1 },
    ],
    assignment: "Given 4 processes with arrival and burst times of your choosing, compute the waiting and turnaround time under FCFS and Round Robin (quantum = 2), and compare the average waiting times.",
    xpReward: 35, coinReward: 15,
  },
  "deadlocks": {
    difficulty: "Intermediate", estimatedMinutes: 25,
    whatYoullLearn: ["The four necessary conditions for deadlock", "The difference between deadlock prevention, avoidance, and detection", "How the Banker's Algorithm avoids deadlock"],
    prerequisites: ["Synchronization"],
    concept: "A deadlock happens when a set of processes are each waiting for a resource held by another process in the same set, so none of them can ever proceed. Four conditions must ALL hold simultaneously for deadlock to occur (Coffman conditions): Mutual Exclusion (a resource can only be held by one process at a time), Hold and Wait (a process holds one resource while waiting for another), No Preemption (a resource can't be forcibly taken away), and Circular Wait (a cycle of processes each waiting on the next).\n\nHandling deadlock falls into three strategies: Prevention (structurally deny one of the four conditions - e.g. force processes to request all resources upfront to deny Hold and Wait), Avoidance (allow requests dynamically but only grant them if the resulting state is still 'safe' - the Banker's Algorithm is the classic example, simulating whether granting a request could ever lead to deadlock before actually granting it), and Detection & Recovery (let deadlock happen, detect it via a resource-allocation graph cycle check, then kill or roll back a process to break it).",
    keyPoints: ["Deadlock requires all 4 Coffman conditions simultaneously: mutual exclusion, hold-and-wait, no preemption, circular wait", "Breaking even one condition prevents deadlock entirely", "The Banker's Algorithm avoids deadlock by only granting requests that keep the system in a 'safe state'"],
    commonMistakes: ["Thinking any resource contention is a deadlock - a normal wait for a busy resource is not deadlock unless it's circular and permanent", "Confusing deadlock avoidance (dynamic, checks before granting) with deadlock prevention (structural, denies a condition outright)"],
    interviewTips: ["Memorize the 4 Coffman conditions - this is asked almost verbatim in most OS interviews", "Be ready to trace through a small Banker's Algorithm example (given allocation/max/available matrices, determine if a state is safe)"],
    realWorldApplications: ["Database systems detect and resolve transaction deadlocks constantly (by aborting one of the conflicting transactions) - this is deadlock detection & recovery in production"],
    codeExample: { language: "java", code: "// Circular wait illustrated with two locks acquired in opposite order -\n// classic deadlock setup between two threads.\nObject lockA = new Object(), lockB = new Object();\n// Thread 1: synchronized(lockA) { synchronized(lockB) { ... } }\n// Thread 2: synchronized(lockB) { synchronized(lockA) { ... } }\n// If both threads hold their first lock and wait for the second, deadlock." },
    mcqs: [
      { question: "Which of these is NOT one of the four necessary conditions for deadlock?", options: ["Mutual Exclusion", "Hold and Wait", "Preemption", "Circular Wait"], correctIndex: 2 },
      { question: "The Banker's Algorithm is an example of deadlock:", options: ["Prevention", "Avoidance", "Detection", "Ignorance"], correctIndex: 1 },
    ],
    assignment: "Explain, in your own words, how always acquiring multiple locks in a fixed global order prevents deadlock (hint: which Coffman condition does it deny?).",
    xpReward: 30, coinReward: 12,
  },
  "virtual-memory": {
    difficulty: "Intermediate", estimatedMinutes: 25,
    whatYoullLearn: ["Why virtual memory exists", "How paging enables virtual memory", "What a page fault is and what happens when one occurs"],
    prerequisites: ["Paging", "Memory Management"],
    concept: "Virtual memory is a technique that gives each process the illusion of having its own large, contiguous address space, independent of how much physical RAM is actually installed and independent of what other processes are doing. This solves two problems at once: it lets programs run even if they're larger than physical RAM, and it isolates processes from each other so one process can't read or corrupt another's memory.\n\nVirtual memory is implemented on top of paging: a process's virtual address space is divided into fixed-size pages, and physical RAM into same-sized frames. A page table maps virtual pages to physical frames - critically, not every virtual page needs to be in RAM at once. Pages currently unused can be swapped out to disk. When a process accesses a page that isn't currently in RAM, the CPU triggers a page fault, which pauses the process, has the OS load the required page from disk into a free frame (evicting another page if RAM is full, based on a replacement policy like LRU), updates the page table, and resumes the process - completely transparently to the program itself.",
    keyPoints: ["Virtual memory lets a process use more address space than physical RAM allows", "Paging maps virtual pages to physical frames via a page table", "A page fault occurs when an accessed page isn't currently in RAM, triggering the OS to load it from disk"],
    commonMistakes: ["Assuming a page fault is always an error - it's a normal, expected event in virtual memory systems, handled transparently", "Confusing paging (fixed-size blocks) with segmentation (variable-size, logically meaningful blocks) - they solve related but distinct problems"],
    interviewTips: ["Be ready to walk through what happens step-by-step on a page fault, in order - this is a very common follow-up question", "Know at least one page replacement policy (LRU is the most commonly asked) and be able to explain why it's a reasonable heuristic"],
    realWorldApplications: ["Every modern OS (Windows, Linux, macOS) uses virtual memory - it's why you can run programs whose combined memory usage exceeds your installed RAM, with the OS quietly swapping pages to disk"],
    codeExample: { language: "c", code: "// Conceptually: a virtual address splits into a page number and offset.\n// virtual_address = (page_number << OFFSET_BITS) | offset\n// The OS's page table maps page_number -> physical_frame_number,\n// then physical_address = (physical_frame_number << OFFSET_BITS) | offset" },
    mcqs: [
      { question: "What triggers a page fault?", options: ["Accessing a page currently in RAM", "Accessing a page not currently in RAM", "A process terminating", "A context switch"], correctIndex: 1 },
      { question: "Virtual memory primarily solves which problem?", options: ["CPU scheduling fairness", "Running programs larger than physical RAM and isolating processes", "Disk fragmentation", "Network latency"], correctIndex: 1 },
    ],
    assignment: "Explain why virtual memory also improves security/isolation between processes, not just capacity - what would happen without it?",
    xpReward: 35, coinReward: 15,
  },
};

async function seedSubjects() {
  for (const s of SUBJECTS) {
    const { id, ...data } = s;
    await db.collection("csCoreSubjects").doc(id).set(data, { merge: true });
    console.log("subject:", id);
  }
}

async function seedTopicsForSubject(subjectId, modules, contentMap = {}) {
  let order = 0;
  let count = 0;
  for (const { module, topics } of modules) {
    for (const title of topics) {
      order++;
      const topicId = slugify(title);
      const content = contentMap[topicId] || {};
      await db.collection("csCoreSubjects").doc(subjectId).collection("topics").doc(topicId).set({
        title, module, order, status: "published",
        difficulty: content.difficulty || "Beginner",
        estimatedMinutes: content.estimatedMinutes || 20,
        whatYoullLearn: content.whatYoullLearn || [],
        prerequisites: content.prerequisites || [],
        concept: content.concept || "",
        keyPoints: content.keyPoints || [],
        commonMistakes: content.commonMistakes || [],
        interviewTips: content.interviewTips || [],
        realWorldApplications: content.realWorldApplications || [],
        codeExample: content.codeExample || { language: "java", code: "" },
        mcqs: content.mcqs || [],
        assignment: content.assignment || "",
        xpReward: content.xpReward || 25,
        coinReward: content.coinReward || 10,
        practiceProblemIds: [],
      }, { merge: true });
      count++;
    }
  }
  await db.collection("csCoreSubjects").doc(subjectId).set({ topicCount: count }, { merge: true });
  console.log(subjectId, "-", count, "topics seeded");
}

const OTHER_SUBJECT_MODULES = {
  dbms: [
    { module: "Foundations", topics: ["Introduction", "ER Model", "Relational Model", "Keys"] },
    { module: "Design & Querying", topics: ["Normalization", "Joins", "SQL", "Views"] },
    { module: "Transactions & Performance", topics: ["Transactions", "Concurrency", "Indexing", "Stored Procedures", "Triggers"] },
    { module: "Practice & Placement", topics: ["DBMS Interview Questions", "Mock Test"] },
  ],
  "computer-networks": [
    { module: "Models & Addressing", topics: ["OSI Model", "TCP/IP", "IP Addressing", "Routing", "Switching"] },
    { module: "Core Protocols", topics: ["DNS", "DHCP", "HTTP", "HTTPS", "FTP", "SMTP"] },
    { module: "Transport & Sockets", topics: ["TCP", "UDP", "Sockets"] },
    { module: "Security & Practice", topics: ["Firewalls", "Network Security", "Interview Questions"] },
  ],
  oop: [
    { module: "The Four Pillars", topics: ["Classes", "Objects", "Inheritance", "Polymorphism", "Abstraction", "Encapsulation"] },
    { module: "Design", topics: ["Interfaces", "Abstract Classes", "SOLID Principles", "Design Principles"] },
    { module: "Practice", topics: ["Interview Questions"] },
  ],
  "software-engineering": [
    { module: "Process Models", topics: ["SDLC", "Agile", "Scrum", "Waterfall"] },
    { module: "Design & Quality", topics: ["Requirement Analysis", "UML", "Testing"] },
    { module: "Delivery", topics: ["Version Control", "CI/CD", "Deployment", "Project Management"] },
  ],
  "computer-organization": [
    { module: "Number Systems & Logic", topics: ["Binary", "Number Systems", "Boolean Algebra", "Logic Gates"] },
    { module: "CPU & Memory", topics: ["CPU", "Registers", "Memory", "Instruction Cycle"] },
    { module: "Performance", topics: ["Pipeline", "Cache", "Interrupts", "Performance"] },
  ],
  "compiler-design": [
    { module: "Front End", topics: ["Lexical Analysis", "Parsing", "Syntax Trees"] },
    { module: "Back End", topics: ["Intermediate Code", "Optimization", "Code Generation"] },
  ],
  "design-patterns": [
    { module: "Creational", topics: ["Singleton", "Factory", "Builder"] },
    { module: "Behavioral", topics: ["Observer", "Strategy"] },
    { module: "Structural", topics: ["Adapter", "Decorator", "MVC"] },
    { module: "Architecture", topics: ["Dependency Injection"] },
  ],
  "system-design-beginner": [
    { module: "Scaling Basics", topics: ["Scalability", "Load Balancer", "Caching"] },
    { module: "Data & Messaging", topics: ["Databases", "Queues"] },
    { module: "Architecture Patterns", topics: ["Microservices", "API Gateway", "CDN"] },
    { module: "Consistency", topics: ["Consistency", "CAP Theorem"] },
  ],
  "cloud-fundamentals": [
    { module: "Cloud Basics", topics: ["Cloud Computing", "AWS Basics", "Azure Basics", "GCP Basics"] },
    { module: "Compute & Containers", topics: ["Virtual Machines", "Containers", "Docker", "Kubernetes", "Serverless"] },
  ],
  "linux-fundamentals": [
    { module: "Basics", topics: ["Terminal", "Commands", "Permissions", "Shell"] },
    { module: "System Administration", topics: ["Processes", "Networking", "SSH", "Cron", "Bash"] },
  ],
  "git-github": [
    { module: "Core Concepts", topics: ["Repositories", "Commits", "Branches"] },
    { module: "Collaboration", topics: ["Merge", "Rebase", "Pull Requests", "GitHub Actions"] },
  ],
  "rest-apis": [
    { module: "Foundations", topics: ["HTTP", "REST", "JSON", "CRUD"] },
    { module: "Auth & Quality", topics: ["Authentication", "JWT", "OAuth", "Status Codes", "API Testing"] },
  ],
  "security-fundamentals": [
    { module: "Access Control", topics: ["Authentication", "Authorization"] },
    { module: "Cryptography", topics: ["Encryption", "Hashing"] },
    { module: "Common Vulnerabilities", topics: ["OWASP", "SQL Injection", "XSS", "CSRF", "JWT Security"] },
  ],
  "aptitude-foundations": [
    { module: "Core Skills", topics: ["Basic Mathematics", "Logical Thinking", "Problem Solving", "Analytical Reasoning"] },
  ],
};

async function main() {
  await seedSubjects();
  await seedTopicsForSubject("operating-systems", OS_MODULES, OS_CONTENT);
  for (const [subjectId, modules] of Object.entries(OTHER_SUBJECT_MODULES)) {
    await seedTopicsForSubject(subjectId, modules);
  }
  console.log("\nDone.");
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
