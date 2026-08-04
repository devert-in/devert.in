// Subject-level introductions for the thirteen most-interviewed CS Core
// subjects. See ./index.mjs for the authoring rules and the field contract.

export const CORE_INTROS = {
  "operating-systems": {
    overview: `## The Manager You Never See

::: story
Picture a restaurant at 8pm on a Saturday. Forty customers ordering, four chefs cooking, waiters running plates out, the card machine beeping at the till.

Now take the manager away. Waiters wander into the kitchen and grab whichever stove looks free. Two of them reach for the same pan. Table 9 is served twice and table 12 is never served at all.

Nobody did anything wrong. There was simply nobody deciding who gets what, and when.
:::

Your laptop is that restaurant. Two hundred programs want the CPU, they all want memory, and they all want the disk at once. The **operating system** is the manager: it never cooks and never carries a plate, it only decides.

This subject is how it decides - and every decision it makes is one you will eventually feel in code you write.

## Why This One Comes First

Almost everything else in CS Core stands on it. Why your program froze, why two threads corrupted the same variable, why the server ran out of memory at 3am, why a database needs locks at all - the answer is in this subject.

::: cards
Processes and threads :: What a running program actually is, and what happens when one splits into several.
Scheduling :: Eight cores, two hundred programs. Who runs next, and who decides.
Synchronization and deadlock :: Why shared data breaks, and why the fix can freeze everything solid.
Memory and virtual memory :: How every program gets told it owns the whole machine, and why that lie holds.
Storage and file systems :: How a featureless disk becomes named files in folders.
:::`,
    whyLearn: [
      "One of the four subjects (with DBMS, Networks and OOP) asked in nearly every product-company technical interview.",
      "Deadlock, process-vs-thread and paging questions come up so reliably that not knowing them reads as a gap rather than a specialism.",
      "It explains the bugs that look like magic - the frozen server, the race condition, the memory leak - in every language you will ever write.",
      "It is the foundation the DBMS, Distributed Systems and Linux subjects all build on.",
    ],
    whereUsed: [
      "Linux, Windows and Android are direct implementations of everything in this subject.",
      "Every backend service that handles concurrent requests is doing scheduling and synchronization, whether its author knows it or not.",
      "Databases reimplement OS ideas - locking, buffer pools, write-ahead logs - one layer up.",
      "Container runtimes like Docker are built directly on OS process and namespace primitives.",
    ],
    skillsGained: [
      "Reason about concurrency correctly instead of adding locks until the crash stops.",
      "Diagnose why a process is slow, blocked or consuming memory it shouldn't be.",
      "Answer deadlock and scheduling questions with the four conditions and the trade-offs, not a memorised definition.",
      "Read a stack trace or a `top` output and know what the numbers mean.",
    ],
    prerequisites: ["Basic programming in any language - you should be comfortable with variables, functions and loops."],
    interviewImportance: 5,
    topCompanies: ["Amazon", "Microsoft", "Google", "Oracle", "Qualcomm", "VMware"],
    interviewQuestions: [
      "What is the difference between a process and a thread?",
      "What are the four necessary conditions for deadlock, and how do you break each one?",
      "Explain paging and how virtual memory maps to physical memory.",
      "What is a race condition, and how does a mutex actually prevent one?",
      "Compare preemptive and non-preemptive scheduling. When would you want each?",
    ],
  },

  "dbms": {
    overview: `## Three Cabinets, Three Versions Of The Truth

::: story
A college keeps its records on paper. Grades in one cabinet, attendance in a second, fee payments in a third. Each cabinet has its own clerk, and each clerk writes things down their own way.

Nothing stops two clerks editing the same student's file at once and overwriting each other. Nothing stops one spelling a name differently from another. And "every student who scored above 90% *and* paid fees on time" means walking between three cabinets, cross-referencing by hand, and hoping.

That is not a filing problem. It is a *truth* problem: three answers to the same question, and no way to tell which is right.
:::

A **Database Management System** is the software built to end that specific mess. Not because it stores data - a text file stores data - but because it makes guarantees about it: stored once, checked automatically, safe when many people write at once, and answerable in one query instead of an afternoon.

## What This Subject Actually Teaches

Everything here is a mechanism for keeping one of those guarantees.

::: cards
ER modelling and normalization :: Designing the schema before you build, so the structure cannot represent a contradiction.
SQL and joins :: Asking the question in one line instead of walking between cabinets.
Transactions and ACID :: What "the transfer either fully happened or fully didn't" costs to actually guarantee.
Concurrency control :: How many writers work at once without corrupting each other.
Indexing :: Why a query takes 4ms or 4 seconds against the exact same data.
:::

::: remember
Two words people use interchangeably and shouldn't. The **database** is the organised data. The **DBMS** is the software managing it - MySQL, PostgreSQL, Oracle. Interviewers do check this one.
:::`,
    whyLearn: [
      "Asked at almost every company, product and service alike - normalization, keys, joins and ACID come up regardless of the role you applied for.",
      "Every application you will ever build stores data, so schema design is a decision you cannot avoid making, only avoid making well.",
      "A badly normalized schema is one of the few mistakes that gets more expensive every single day it stays in production.",
      "SQL is the one language that has survived every framework fashion of the last forty years.",
    ],
    whereUsed: [
      "Instagram, WhatsApp and every social product storing billions of rows of posts, messages and likes.",
      "Bank cores and UPI settlement, where a transaction that half-completes is a real-money problem.",
      "Hospital records, airline seat inventory, and your own college's ERP.",
      "Analytics and data engineering pipelines, which are mostly SQL underneath the tooling.",
    ],
    skillsGained: [
      "Design a schema from a plain-English requirement, and normalize it to 3NF on purpose.",
      "Write joins, aggregates and subqueries fluently rather than by trial and error.",
      "Explain ACID with a concrete failure for each letter, which is what interviews are really testing.",
      "Read a slow query and know whether the fix is an index, a rewrite, or the schema.",
    ],
    prerequisites: [],
    interviewImportance: 5,
    topCompanies: ["Oracle", "Amazon", "Adobe", "Microsoft", "Salesforce", "Infosys"],
    interviewQuestions: [
      "What is normalization, and why would you ever deliberately denormalize?",
      "Explain ACID, with an example of what breaks when each property is missing.",
      "What is the difference between a clustered and a non-clustered index?",
      "Explain the difference between INNER, LEFT and FULL OUTER JOIN.",
      "How do primary keys, foreign keys and unique constraints differ?",
    ],
  },

  "computer-networks": {
    overview: `## A Letter That Crosses The World In 40 Milliseconds

::: story
You send a postcard to another country. You write an address on it and drop it in a box, and that is the entire extent of your involvement.

Somebody sorts it by city. Somebody puts it on the right van, then the right plane. Somebody at the far end knows which street, then which house. Dozens of handoffs, each done by someone who knows only their own step and nothing about yours.
:::

That is a network. A WhatsApp message travels the same way: split into pieces, addressed, handed between routers that each know only the next hop, and reassembled at the far end - in about the time it takes to blink.

This subject is the postal system: who does the sorting, how the addresses work, what happens when a van breaks down, and why some letters are sealed.

## The Layers, And Why There Are Layers

::: cards
The OSI and TCP/IP models :: The division of labour that lets your app ignore the plane and the van entirely.
IP addressing and subnetting :: How an address identifies one machine out of billions.
Routing :: How each hop knows the next one without anyone knowing the whole path.
TCP versus UDP :: Guaranteed delivery in order, or speed with no promises - and why video calls choose the second.
HTTP, HTTPS and DNS :: The protocols you use hundreds of times a day.
Sockets and security :: What your code actually opens, and what makes the envelope sealed.
:::`,
    whyLearn: [
      "Frequently tested at product companies, and close to mandatory for backend, infra and DevOps roles.",
      "The OSI model, TCP vs UDP and 'what happens when you type a URL' are three of the most-asked questions in all of technical interviewing.",
      "Every bug that looks like 'it works on my machine' is usually a network fact you didn't know.",
      "It is the layer under REST APIs, System Design and Distributed Systems - all three get easier once this is solid.",
    ],
    whereUsed: [
      "Every page load, API call and video stream on the internet.",
      "Microservices calling each other inside a datacentre, which is the same problem at a shorter distance.",
      "CDNs and load balancers, whose entire job is routing and caching decisions.",
      "Anything you will ever debug with `ping`, `traceroute`, `curl` or the browser's network tab.",
    ],
    skillsGained: [
      "Walk through what actually happens when you type a URL and press enter, end to end.",
      "Choose TCP or UDP for a real requirement and defend the choice.",
      "Subnet an address range without guessing.",
      "Debug a connectivity problem by layer instead of by restarting things.",
    ],
    prerequisites: [],
    interviewImportance: 5,
    topCompanies: ["Cisco", "Amazon", "Google", "Juniper", "Akamai", "Nvidia"],
    interviewQuestions: [
      "Walk me through what happens when you type a URL into a browser and press enter.",
      "What is the difference between TCP and UDP, and when would you choose UDP?",
      "Explain the TCP three-way handshake and why it takes three steps rather than two.",
      "What are the layers of the OSI model, and what lives at each?",
      "How does HTTPS actually protect a request - what does TLS add on top of HTTP?",
    ],
  },

  "oop": {
    overview: `## The Cutter Is Not The Cookie

::: story
A cookie cutter is not a cookie. You cannot eat it. There is only one of it, even after you have stamped out fifty cookies - and each of those cookies is its own thing, with its own icing, that you can eat or drop or give away without affecting the cutter or the other forty-nine.
:::

A **class** is the cutter. An **object** is the cookie. Almost everything else in this subject is an answer to a question that follows from that one distinction: what if two cutters are nearly the same (inheritance), what if the same instruction should produce different shapes (polymorphism), what if nobody outside should be allowed to reach in and bend the metal (encapsulation).

## Why It Is On Every Interview List

Object-oriented programming is not a language feature, it is a way of dividing a problem up - which is why the questions are the same whether you write Java, C++, Python or C#. An interviewer asking about the four pillars is not checking whether you memorised four words. They are checking whether you can decide where a piece of behaviour belongs.

::: cards
The four pillars :: Encapsulation, inheritance, polymorphism, abstraction - what each is *for*, not just what each is called.
Classes and objects :: The cutter and the cookie, and the constructor that stamps one out.
Interfaces and abstract classes :: The USB port and the half-finished blueprint - and when to reach for which.
SOLID principles :: Five rules that keep a growing codebase from calcifying.
Composition over inheritance :: The most common real-world correction to how OOP is first taught.
:::`,
    whyLearn: [
      "Asked in almost every interview regardless of language - the four pillars are treated as baseline knowledge, not as a differentiator.",
      "It is the vocabulary your team will use in code review, whether or not anyone says the words out loud.",
      "Design Patterns, System Design and most enterprise codebases are unreadable without it.",
      "'Abstract class or interface here?' is a real decision you will make in your first week on a real project.",
    ],
    whereUsed: [
      "Java and C# backends, which are the dominant enterprise stack in Indian product and service companies alike.",
      "Android development, where the whole framework is built from inheritance and interfaces.",
      "Spring, Django and virtually every framework you will use - all of them assume you think in objects.",
      "Any codebase large enough that more than two people touch it.",
    ],
    skillsGained: [
      "Decide where behaviour belongs instead of piling it into one class that does everything.",
      "Explain each of the four pillars with a real example rather than a textbook sentence.",
      "Apply SOLID without turning a fifty-line problem into fifteen files.",
      "Recognise when inheritance is the wrong tool and composition is the right one.",
    ],
    prerequisites: ["Comfort writing functions and using variables in at least one language."],
    interviewImportance: 5,
    topCompanies: ["TCS", "Infosys", "Accenture", "Amazon", "Microsoft", "Cognizant"],
    interviewQuestions: [
      "What are the four pillars of OOP, and give a real example of each.",
      "What is the difference between an abstract class and an interface, and when do you use each?",
      "Explain method overloading versus method overriding.",
      "What does the Single Responsibility Principle mean in practice?",
      "Why is composition often preferred over inheritance?",
    ],
  },

  "software-engineering": {
    overview: `## The Part That Isn't Code

::: story
Two teams build the same feature. One ships in three weeks and it works. The other ships in three months, breaks twice in production, and the thing it finally delivered was not what anyone asked for.

Both teams could code. The difference was never the code.
:::

Software engineering is everything around the typing: working out what to build, agreeing how to build it, dividing it up, checking it, shipping it, and keeping it alive for the years afterwards. It is the difference between a program and a product.

## Why A Fresher Should Care

This is the subject students skip because it has no syntax to memorise, and then get caught by in an interview - because it is the one an interviewer uses to work out whether you have ever worked on a *team*.

::: cards
SDLC models :: Waterfall, iterative, Agile - and what each one is actually optimising for.
Agile and Scrum :: Sprints, standups and retrospectives, and what goes wrong when they become ritual.
Requirements :: How a shipped-the-wrong-thing failure starts months before anyone writes code.
Design and quality :: Coupling, cohesion, code review, and technical debt as a real cost rather than a metaphor.
Testing :: Unit, integration and the pyramid - what each catches and what each cannot.
Delivery and maintenance :: CI/CD, versioning, and the fact that most of a system's life happens after launch.
:::`,
    whyLearn: [
      "Tested in HR and managerial rounds at nearly every company, and increasingly in technical rounds too.",
      "'Tell me about your development process' is a question you will be asked, and 'we just coded it' is a bad answer.",
      "You will join a team that already runs sprints - arriving fluent in the vocabulary is a real head start.",
      "It converts your college projects into things you can describe professionally on a resume.",
    ],
    whereUsed: [
      "Every software team you will ever join operates under some version of this, formally or not.",
      "Jira, GitHub Projects and Azure DevOps are direct implementations of the ideas in this subject.",
      "Code review and CI pipelines - the two quality gates you will meet on day one.",
      "Client-facing service work, where requirements and estimation are the whole job.",
    ],
    skillsGained: [
      "Describe your own project work in the language a hiring manager expects.",
      "Tell the difference between a requirements failure and an engineering one.",
      "Write and reason about tests as a design tool rather than a chore.",
      "Participate in a sprint without needing the ceremonies explained to you.",
    ],
    prerequisites: [],
    interviewImportance: 3,
    topCompanies: ["TCS", "Infosys", "Wipro", "Capgemini", "Accenture", "Deloitte"],
    interviewQuestions: [
      "What are the phases of the SDLC, and what does skipping one cost you?",
      "Compare Waterfall and Agile - when is Waterfall actually the better choice?",
      "What is technical debt, and how do you decide when to pay it down?",
      "Explain the difference between unit, integration and end-to-end testing.",
      "What is coupling and cohesion, and which do you want more of?",
    ],
  },

  "computer-organization": {
    overview: `## Why Your Code Is Fast Or Slow

::: story
Ask an electrical engineer to build a circuit that reliably tells apart ten different voltage levels, and you get a hard question back: how far apart, and how much can they drift before 6 reads as 7?

Ask for two levels - on and off - and it is easy. That is the whole reason computers are binary. Not elegance. Reliability.
:::

This subject builds strictly upward from that: bits, then gates, then a CPU, then memory, then the pipeline that makes it fast. The payoff is the instruction cycle lesson, where the whole stack finally connects and you can see your own code being fetched, decoded and executed.

## The Question It Answers

Every other subject treats the machine as a box that runs things. This one opens the box - and once it is open, a set of performance facts that previously had to be memorised become obvious instead.

::: cards
Number systems and binary :: Why two symbols, and how negative numbers and decimals are represented at all.
Logic gates :: The handful of switches everything else is built from.
CPU architecture :: Registers, the ALU, the control unit, and the fetch-decode-execute cycle.
Memory hierarchy :: Why there are registers, cache, RAM and disk instead of just one big fast memory.
Pipelining :: How a CPU works on five instructions at once, and what a branch does to that.
Performance :: What a benchmark number actually measures.
:::`,
    whyLearn: [
      "A standard subject in core-company interviews and one of the heaviest-weighted papers in GATE.",
      "Number systems and logic gates also turn up in aptitude and written rounds at service companies.",
      "It explains cache-friendly code, which is one of the few optimisations that reliably matters.",
      "It is the layer directly under Operating Systems and directly above Digital Logic Design.",
    ],
    whereUsed: [
      "Every performance decision that involves cache locality, alignment or memory access patterns.",
      "Embedded and firmware work, where the hardware is not an abstraction you get to ignore.",
      "Compiler and systems engineering, where instruction cost is the currency.",
      "Understanding why the same algorithm runs at two very different speeds on two machines.",
    ],
    skillsGained: [
      "Convert between binary, hex and decimal without reaching for a calculator.",
      "Explain the fetch-decode-execute cycle and where a pipeline stall comes from.",
      "Reason about cache hits and misses when reading a hot loop.",
      "Answer number-representation questions (two's complement, floating point) confidently.",
    ],
    prerequisites: [],
    interviewImportance: 3,
    topCompanies: ["Intel", "Qualcomm", "Nvidia", "AMD", "Texas Instruments", "Bosch"],
    interviewQuestions: [
      "How is a negative number represented in binary, and why two's complement?",
      "Explain the fetch-decode-execute cycle.",
      "What is pipelining, and what is a pipeline hazard?",
      "Why does a memory hierarchy exist instead of one large fast memory?",
      "What is the difference between RISC and CISC?",
    ],
  },

  "compiler-design": {
    overview: `## Nobody Translates A Book In One Pass

::: story
A translator working on a book does not read a page and produce the translated page in one motion. They read letters into words. Words into grammatical sentences. Then they ask whether the sentence means anything at all - because "the green idea sleeps furiously" is perfectly grammatical and completely meaningless.

Only then do they write the other language.
:::

A compiler does exactly that, in the same order, for the same reason: each stage can only be done once the previous one has produced something structured enough to work with.

## Six Phases, One Pipeline

This subject follows a single program from text to machine code. The last lesson walks the whole chain end to end, which is also the shape most interview questions on it take.

::: cards
Lexical analysis :: Letters into words - the tokeniser.
Syntax analysis :: Words into grammatical sentences - the parser and the parse tree.
Semantic analysis :: Does the sentence actually mean anything? Type checking lives here.
Intermediate code :: The pivot-language trick real translation bureaus use - and exactly why LLVM exists.
Optimization :: Saying the same thing in fewer words.
Code generation :: Finally writing the target language.
:::

::: behind
That pivot-language step is the one worth understanding properly. It is why supporting a new language on ten architectures is ten times cheaper than it looks, and it is the single idea behind LLVM, the JVM and WebAssembly alike.
:::`,
    whyLearn: [
      "A regular GATE subject, and asked at companies building developer tools, languages or runtimes.",
      "It demystifies error messages - once you know which phase produced one, you know what it is telling you.",
      "Parsing shows up far outside compilers: config files, query languages, log formats, template engines.",
      "It is the practical payoff of Theory of Computation, which otherwise stays abstract.",
    ],
    whereUsed: [
      "Every language you use - gcc, the JVM, the Python interpreter, the TypeScript compiler.",
      "LLVM, which sits under Swift, Rust and Clang alike.",
      "Linters, formatters and IDE refactoring tools, which are parsers with a different output stage.",
      "Database query planners, which optimise a parse tree exactly the way a compiler does.",
    ],
    skillsGained: [
      "Name the six phases and say what each consumes and produces.",
      "Read a grammar and build a parse tree from it.",
      "Tell a lexical error, a syntax error and a semantic error apart from the message alone.",
      "Understand why intermediate representations exist rather than treating them as a detail.",
    ],
    prerequisites: ["Theory of Computation helps a great deal, particularly finite automata and context-free grammars."],
    interviewImportance: 2,
    topCompanies: ["Google", "Microsoft", "Nvidia", "Oracle", "Adobe", "Intel"],
    interviewQuestions: [
      "What are the phases of a compiler, and what does each produce?",
      "What is the difference between a compiler and an interpreter?",
      "Explain the difference between a lexical error and a syntax error.",
      "Why do compilers generate intermediate code rather than machine code directly?",
      "What is the role of a symbol table?",
    ],
  },

  "design-patterns": {
    overview: `## A Named Shape, Not A Building

::: story
"Open floor plan kitchen" is not a house. It is a shape that has worked so often that it earned a name - and every actual house using it has its own dimensions, materials and constraints.

Nobody builds an open floor plan because it is on a list. They build it because they have a specific problem: a small footprint that needs to feel bigger, a family that wants to talk while cooking.
:::

A design pattern works the same way. It is a named solution to a recurring problem, and the name is only useful if you also carry the problem. A pattern learned without its problem is exactly how patterns end up applied where they do not belong - which is the failure mode this subject should be inoculating you against.

## What You Will Actually Learn

Every lesson here names the problem before it names the pattern, on purpose.

::: cards
Creational :: Singleton, Factory, Builder - problems about *how a thing gets made*.
Structural :: Adapter, Decorator, Proxy - problems about *how things fit together*.
Behavioural :: Observer, Strategy, Command - problems about *how things talk*.
Architecture :: MVC and friends, where the same thinking applies at the scale of a whole application.
:::

::: interview
The Singleton question is a trap worth knowing about. Interviewers often follow "explain Singleton" with "and what is wrong with it?" - if you have only memorised the pattern, that second question ends the conversation.
:::`,
    whyLearn: [
      "Common in product-company interviews, and a strong code-quality signal even for a fresher.",
      "Real frameworks are built from these - you are already using them, named or not.",
      "It gives you shared vocabulary in a code review: 'make it a strategy' replaces a five-minute explanation.",
      "It is the natural next step once OOP's four pillars are solid.",
    ],
    whereUsed: [
      "Spring Framework uses Factory, Singleton and Proxy extensively - it is close to a pattern catalogue in itself.",
      "React's component model and hooks are Observer and Strategy under other names.",
      "Java's own standard library: InputStream is Decorator, Collections.sort takes a Strategy.",
      "Any codebase old enough to have been refactored at least once.",
    ],
    skillsGained: [
      "Recognise the problem a pattern solves before reaching for the pattern.",
      "Name what you have already built, which is most of what a code review needs.",
      "Argue the downsides - Singleton's testability problem, over-abstraction, pattern soup.",
      "Read an unfamiliar framework faster, because its structure stops being arbitrary.",
    ],
    prerequisites: ["Object-Oriented Programming - the four pillars, interfaces and abstract classes."],
    interviewImportance: 4,
    topCompanies: ["Amazon", "Adobe", "Microsoft", "Oracle", "SAP", "ServiceNow"],
    interviewQuestions: [
      "Explain the Singleton pattern - and what is wrong with it?",
      "What is the difference between the Factory and Builder patterns?",
      "Where would you use the Observer pattern, and what does it decouple?",
      "What problem does the Adapter pattern solve that inheritance does not?",
      "What is the difference between Strategy and simple if/else branching?",
    ],
  },

  "system-design-beginner": {
    overview: `## Working At 100 Users Proves Nothing

::: story
An app is fast, well-tested, and has no bugs. It serves a hundred users beautifully.

Then it is featured somewhere, and a hundred thousand people arrive in an hour. Nothing about the code changed. Everything about whether it works did.
:::

System design is what you do about that - and the reason it is asked even of freshers now is that it is the cheapest way for an interviewer to find out whether you think about consequences.

## One Architecture, Built Up In Stages

The lessons here build a single system cumulatively. Each one names the problem the previous one created, because that chain *is* the subject.

::: cards
Scalability :: Vertical or horizontal, and why the answer is almost always horizontal eventually.
Load balancing :: One entrance, many servers - and what happens to a user's session.
Caching :: The single highest-leverage change available, and the two hard problems it brings.
Databases at scale :: Replication, sharding, and read replicas.
Message queues :: Doing work later so the user does not wait for it.
CAP and consistency :: The trade-off you cannot design your way out of, only choose within.
:::

::: remember
There is no correct answer to a system design question. There is a defended answer. An interviewer is listening for the trade-off you name, not the diagram you draw.
:::`,
    whyLearn: [
      "Increasingly asked at fresher and intern level as a 'how do you think about scale' screening question.",
      "It is the interview round with the least memorisable content and the most reusable thinking.",
      "It connects OS, DBMS, Networks and Distributed Systems into one picture.",
      "Every backend role above entry level assumes it, so building the habit early compounds.",
    ],
    whereUsed: [
      "Every product that grew past one server - which is every product you have heard of.",
      "Load balancers, CDNs and Redis caches are in front of almost all production traffic.",
      "Kafka and RabbitMQ queues sit inside nearly every system that does background work.",
      "The architecture diagram in any real design document at any real company.",
    ],
    skillsGained: [
      "Take a vague prompt ('design a URL shortener') and turn it into requirements, then a diagram.",
      "Estimate load and storage well enough to justify a choice.",
      "Name the trade-off in a decision instead of presenting it as obviously right.",
      "Talk about consistency, availability and latency as things you are spending, not things you get.",
    ],
    prerequisites: ["Basic DBMS and Computer Networks - you should know what a database and an HTTP request are."],
    interviewImportance: 4,
    topCompanies: ["Amazon", "Flipkart", "Uber", "Swiggy", "Google", "Atlassian"],
    interviewQuestions: [
      "How would you design a URL shortener?",
      "What is the difference between horizontal and vertical scaling, and when is vertical still right?",
      "Explain the CAP theorem and what choosing AP over CP costs you.",
      "Where would you put a cache in a read-heavy system, and how do you invalidate it?",
      "What does a message queue buy you that a direct call does not?",
    ],
  },

  "cloud-fundamentals": {
    overview: `## The Guess You Used To Have To Make

::: story
Before cloud computing, launching a website meant buying servers. Which meant guessing - months ahead - how popular you were about to be.

Guess low and you crash on the day it matters. Guess high and you have paid for a rack of machines that sit idle for a year. There was no third option, and both wrong answers were expensive.
:::

The cloud removed the guess. Capacity became something you rent by the hour and change in a minute, which is a smaller change than it sounds and a bigger one than it looks.

## What This Subject Covers

::: cards
The service models :: IaaS, PaaS and SaaS - who is responsible for what, which is the actual distinction.
The big three :: AWS, Azure and GCP, mostly as name-mapping between equivalent services.
Compute :: Virtual machines, and why serverless exists as an alternative.
Containers :: Docker, and the "works on my machine" problem it was built to end.
Orchestration :: Kubernetes, and the problem you have to already have before it is worth its complexity.
Cost and reliability :: Regions, availability zones, and why the bill is a design output.
:::

::: tip
This subject is deliberately practical rather than theoretical. The Operating Systems and Distributed Systems subjects cover the concepts underneath - here you are learning the tools and the vocabulary.
:::`,
    whyLearn: [
      "A genuine resume differentiator for a fresher - basic AWS and Docker familiarity is listed as 'good to have' on a large share of job descriptions.",
      "Nearly all modern software is deployed to the cloud, so this is where your code will actually live.",
      "Docker is the fastest single skill for making your own projects reproducible and demoable.",
      "It is the vocabulary of every DevOps and platform conversation you will overhear.",
    ],
    whereUsed: [
      "Netflix, Zomato and most Indian startups run entirely on AWS or GCP.",
      "Docker containers are the standard unit of deployment across the industry.",
      "Kubernetes runs the majority of large-scale production workloads.",
      "CI/CD pipelines, which build and ship into exactly these environments.",
    ],
    skillsGained: [
      "Explain IaaS, PaaS and SaaS by who is responsible for what, not by examples alone.",
      "Containerise a project with a Dockerfile and run it anywhere.",
      "Read an architecture diagram that names real cloud services.",
      "Reason about cost and availability as design constraints.",
    ],
    prerequisites: ["Linux Fundamentals helps - most cloud servers are Linux boxes."],
    interviewImportance: 3,
    topCompanies: ["Amazon", "Microsoft", "Google", "Accenture", "Deloitte", "IBM"],
    interviewQuestions: [
      "What is the difference between IaaS, PaaS and SaaS?",
      "What problem does Docker solve that a virtual machine does not?",
      "What is the difference between a container image and a running container?",
      "Why would you choose serverless over a virtual machine, and what does it cost you?",
      "What is the difference between a region and an availability zone?",
    ],
  },

  "linux-fundamentals": {
    overview: `## Not A Worse Version Of The File Explorer

::: story
A file explorer can do exactly what someone built a button for. Rename this file, move that folder, search for a name.

"Find every log file modified in the last two days, that mentions this error, and tell me which service wrote the most of them" has no button. It never will. In a terminal it is one line.
:::

That is the whole argument for this subject. The terminal is not a harder way to do the easy things - it is the only way to do the specific things.

## Hands-On, Not Theoretical

The Operating Systems subject covers the concepts. This one is the situations these commands actually get reached for: the 2am diagnosis, the cron job that worked when you ran it manually, the permission somebody fixed with 777.

::: cards
The shell and filesystem :: Navigating, and what the directory tree is actually organised by.
Files and text :: grep, find, pipes - the composition idea that makes the whole thing work.
Permissions :: Users, groups, and what 755 really means.
Processes :: ps, top, kill - and finding what is eating the CPU.
Networking and services :: Ports, systemd, and reading logs.
Shell scripting :: Automating the thing you have now typed four times.
:::`,
    whyLearn: [
      "An assumed baseline for any backend, DevOps or infra role - it is taught once you are hired only if you are lucky.",
      "The overwhelming majority of production servers are Linux, so this is a daily-use skill, not an occasional one.",
      "Terminal fluency makes every other tool faster - git, docker, ssh, cloud CLIs all live here.",
      "It is the fastest way to look like you have worked on real systems, because you have.",
    ],
    whereUsed: [
      "Every cloud VM, container and CI runner you will ever touch.",
      "Debugging production - reading logs, checking processes, tracing a port.",
      "Android and macOS are Unix underneath, so the mental model transfers.",
      "Your own development environment, once you stop fighting it.",
    ],
    skillsGained: [
      "Navigate, search and manipulate files without leaving the keyboard.",
      "Chain commands with pipes to answer a question nobody built a tool for.",
      "Read and fix permissions properly instead of reaching for 777.",
      "Diagnose a slow or stuck server: what is running, what is listening, what is filling the disk.",
    ],
    prerequisites: [],
    interviewImportance: 3,
    topCompanies: ["Amazon", "Red Hat", "Google", "Cisco", "Nutanix", "Zoho"],
    interviewQuestions: [
      "What does chmod 755 mean, permission by permission?",
      "How would you find which process is using the most memory right now?",
      "What is the difference between a hard link and a symbolic link?",
      "How do you find all files containing a given string under a directory tree?",
      "What is the difference between `>` and `>>`, and what is `2>&1` doing?",
    ],
  },

  "git-github": {
    overview: `## Writing Without An Undo Button

::: story
Imagine writing a fifty-page document where every save overwrites the last, there is no undo, and three other people are editing the same file at the same time.

That is what programming without version control is. Everyone who has done it has the same story: a folder full of \`project-final\`, \`project-final-2\`, \`project-final-USE-THIS-ONE\`.
:::

Git is the fix, and the mental image worth carrying is a chain of photographs. A **commit** is a photo of the whole project at a moment. History is the chain. A **branch** is a second chain growing off the same photo. Merge and rebase are the two ways of bringing one chain back into the other.

## Git Is Not GitHub

This distinction is set up in the first lesson and paid off in the pull requests lesson, and it is worth stating plainly: **Git** is the version control system running on your machine. **GitHub** is a website that hosts Git repositories and adds collaboration features on top. You can use Git with no internet and no account at all.

::: cards
Repositories and commits :: The photo, the chain, and what staging is for.
Branching :: Working on something without touching what already works.
Merging and rebasing :: Two ways to reconcile, and when each is the wrong one.
Remotes :: push, pull, fetch, and what "the remote is ahead" means.
Pull requests :: Where the platform features and the code review culture start.
Recovering :: reset, revert, stash, reflog - the commands worth knowing *before* you need them.
:::`,
    whyLearn: [
      "Rarely asked as trivia, but expected as a working skill from day one of any internship or job.",
      "Your GitHub profile is often checked directly - a clean commit history is part of the application.",
      "Merge conflicts and 'I lost my work' are the two most common first-week panics, and both are avoidable.",
      "It is what makes collaborating on a college project stop being a shared-folder nightmare.",
    ],
    whereUsed: [
      "Virtually every software team on earth - the near-universal default for version control.",
      "GitHub, GitLab and Bitbucket, which together host essentially all open source.",
      "CI/CD pipelines, which trigger on Git events.",
      "Your own portfolio, which for most fresher applications *is* your GitHub.",
    ],
    skillsGained: [
      "Branch, commit and merge with intent rather than by copying commands.",
      "Resolve a merge conflict calmly, understanding what both sides changed.",
      "Recover work you thought you lost with reflog, reset and stash.",
      "Open a pull request that a reviewer can actually read.",
    ],
    prerequisites: [],
    interviewImportance: 3,
    topCompanies: ["GitHub", "Atlassian", "Amazon", "Microsoft", "Zoho", "Freshworks"],
    interviewQuestions: [
      "What is the difference between git merge and git rebase?",
      "What is the difference between git fetch and git pull?",
      "How do you undo a commit that has already been pushed?",
      "What does git stash do, and when would you use it?",
      "Explain the staging area - why does Git have one at all?",
    ],
  },

  "rest-apis": {
    overview: `## Request, Response, Repeat

::: story
Every page you load, every app that fetches anything, every backend service calling another one - all of it is the same two-step exchange. Someone asks. Someone answers.

The entire web is that, several billion times a second.
:::

A **REST API** is a set of conventions for making those asks predictable: what the address means, what the verb means, and what the number that comes back means. None of it is enforced by anything. All of it is what makes an API usable by someone who has never seen your documentation.

## What This Subject Covers

Note that this deliberately overlaps Computer Networks' HTTP lessons. That subject asks *where HTTP sits in the stack*. This one asks *how to design with it*.

::: cards
HTTP methods :: GET, POST, PUT, PATCH, DELETE - and why using the right one matters beyond style.
Status codes :: What 200, 201, 400, 401, 403, 404 and 500 tell a caller, and why 401 and 403 are not interchangeable.
Resource design :: Why it is /users/42/orders and not /getOrdersForUser.
Authentication :: API keys, sessions, JWT, OAuth, and what each is actually for.
Versioning and errors :: Changing an API without breaking everyone using it.
REST versus GraphQL :: Where each is the better answer.
:::`,
    whyLearn: [
      "Core knowledge for any full-stack or backend interview - status codes, auth and CRUD design come up constantly.",
      "It is the interface between every frontend and every backend you will build.",
      "Bad API design is one of the few decisions that outlives every rewrite of the code behind it.",
      "It makes your own projects integrable, which is what turns them into portfolio pieces.",
    ],
    whereUsed: [
      "Every mobile and web app talking to its backend.",
      "Payment gateways, maps, SMS, and every third-party service you will integrate.",
      "Microservices calling each other inside a company's own infrastructure.",
      "Public APIs - GitHub, Stripe, Twilio - which are also the best design references available.",
    ],
    skillsGained: [
      "Design endpoints a stranger can guess correctly without reading docs.",
      "Choose and defend the right status code, including the ones people get wrong.",
      "Implement and reason about token-based authentication.",
      "Test and debug an API with curl or Postman rather than only through a UI.",
    ],
    prerequisites: ["Basic Computer Networks knowledge - what HTTP is and roughly how a request travels."],
    interviewImportance: 4,
    topCompanies: ["Amazon", "Razorpay", "Stripe", "Zoho", "Freshworks", "Swiggy"],
    interviewQuestions: [
      "What makes an API RESTful? Name the constraints.",
      "What is the difference between PUT and PATCH, and between POST and PUT?",
      "When would you return 401 versus 403?",
      "How does JWT authentication work, and where do you store the token?",
      "How would you version an API without breaking existing clients?",
    ],
  },
};
