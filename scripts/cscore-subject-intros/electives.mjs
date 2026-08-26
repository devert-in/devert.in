// Subject-level introductions for the specialist and elective CS Core
// subjects. See ./index.mjs for the authoring rules and the field contract.

export const ELECTIVE_INTROS = {
  "security-fundamentals": {
    overview: `## Everything Else Assumes This Question Is Answered

::: story
An application checks, on every single page, whether you are allowed to see it. Careful code, reviewed twice, no bugs.

It never checks *who you are*. It trusts a user id sent by the browser. Change the number, become somebody else.
:::

Authentication is the question every other control silently assumes has been answered correctly. This subject is application-level security: the vulnerabilities that live in code you wrote, not in a firewall someone else configured.

## One Root Cause, Three Famous Names

Injection, XSS and CSRF are taught as three separate attacks. They are closer to three faces of one mistake - trusting input that came from outside - which is why each lesson names that root cause rather than presenting them as three facts to memorise.

::: cards
Authentication :: Proving who you are. Password hashing, salting, and why MD5 is not an opinion.
Authorization :: What you are allowed to do once you are known - and why the check has to be server-side.
Cryptography :: Hashing versus encryption, symmetric versus asymmetric, and TLS.
Injection :: SQL injection, and the parameterised query that ends it.
XSS and CSRF :: Attacks that use the browser's own trust against it.
The OWASP Top 10 :: The industry's shared list of what actually goes wrong.
:::

::: mistake
This subject is distinct from Cyber Security, which covers the organisational and operational side - policy, incident response, governance. This one is what you check for in a code review.
:::`,
    whyLearn: [
      "Increasingly asked outside dedicated security roles - 'what would you check for here' is a normal code-review question now.",
      "SQL injection and XSS are the two vulnerabilities most likely to appear in a fresher's own project.",
      "Every production application has to defend against the OWASP Top 10; this stopped being specialist knowledge.",
      "One security mistake can undo an otherwise excellent piece of work, which makes the ratio of effort to risk unusually good.",
    ],
    whereUsed: [
      "Every login form, session and API token in every application.",
      "Code review, where injection and missing authorization are the highest-value things to catch.",
      "Payment and fintech work, where the standards are external and non-negotiable.",
      "Bug bounty programmes, which are the OWASP Top 10 with money attached.",
    ],
    skillsGained: [
      "Store passwords correctly - hashed, salted, with an algorithm chosen on purpose.",
      "Write queries that cannot be injected, and explain why parameterisation works.",
      "Tell authentication and authorization apart, and place each check where it belongs.",
      "Read your own code looking for the trust boundary you forgot to check.",
    ],
    prerequisites: ["Basic web development - you should know what a request, a session and a cookie are."],
    interviewImportance: 4,
    topCompanies: ["Amazon", "PayPal", "Razorpay", "Cisco", "Palo Alto Networks", "Zscaler"],
    interviewQuestions: [
      "What is SQL injection, and how do parameterised queries prevent it?",
      "What is the difference between hashing and encryption?",
      "Explain XSS and CSRF - how do they differ, and what stops each?",
      "Why is it wrong to store a password with MD5 or SHA-256 alone?",
      "What is the difference between authentication and authorization?",
    ],
  },

  "aptitude-foundations": {
    overview: `## You Are Not Being Tested On Maths

::: story
Thirty questions, thirty minutes. That is one minute each, including reading the question.

Nobody solving that is deriving anything from first principles. They are recognising the question type in the first few seconds and applying the method they already know.
:::

That reframing is the entire subject. The aptitude round is a timed *recognition* test wearing a maths costume, and preparing for it as though it were a maths exam is the most common way to fail it.

## The Round That Comes Before Every Other Round

At most service companies this is the very first filter - before any technical question, before anyone looks at your projects. It is also, unlike most of CS Core, a subject where a few weeks of focused practice reliably moves your score.

::: cards
Quantitative :: Percentages, ratios, time-speed-distance, profit and loss - the recurring types.
Logical reasoning :: Series, arrangements, blood relations, syllogisms.
Verbal :: Reading comprehension, sentence correction, vocabulary in context.
Data interpretation :: Reading a table or chart under time pressure without over-calculating.
:::

::: tip
The traps in this subject are kept as checkpoints rather than warnings, on purpose - a trap you have personally fallen for once is worth far more than a trap you read about.
:::`,
    whyLearn: [
      "The gatekeeper round at nearly every service-company placement drive - TCS, Infosys, Wipro, Cognizant, Capgemini.",
      "It is the first filter, so a technical strength you never got to demonstrate does not help you.",
      "Score improvement here is unusually predictable: it responds to practice more directly than any other subject.",
      "The same patterns appear in CAT, GRE and bank exams, so the preparation is reusable.",
    ],
    whereUsed: [
      "Campus placement aptitude rounds, which are the immediate reason to learn it.",
      "Online assessment platforms - AMCAT, CoCubes, HackerRank aptitude sections.",
      "MBA and government entrance exams, which reuse the same question families.",
      "Estimation questions in technical interviews, where the underlying skill is the same.",
    ],
    skillsGained: [
      "Recognise a question's type within seconds instead of deriving from scratch.",
      "Work accurately under a clock, which is a separate skill from working accurately.",
      "Know when to skip - the highest-value decision in a timed test.",
      "Apply shortcuts for percentages, ratios and averages without a calculator.",
    ],
    prerequisites: [],
    interviewImportance: 4,
    topCompanies: ["TCS", "Infosys", "Wipro", "Cognizant", "Capgemini", "Accenture"],
    interviewQuestions: [
      "A shopkeeper marks up 40% then gives a 25% discount - what is the profit percent?",
      "Two trains travelling toward each other - when and where do they meet?",
      "If A can do a job in 12 days and B in 18, how long together?",
      "Find the next term in the series: 2, 6, 12, 20, 30, ?",
      "Given a table of sales by region and quarter, which region grew fastest?",
    ],
  },

  "theory-of-computation": {
    overview: `## A Different Kind Of Question

::: story
Every other subject here teaches you to build something. Write the algorithm, design the schema, configure the server.

This one asks a question that sounds strange until you sit with it: are there problems that no program can ever solve? Not "we have not worked it out yet" - *no program, ever, on any machine, however fast*.

The answer is yes, and we can prove it.
:::

That is the subject most likely to be dismissed as academic, so it is worth saying immediately what it is for: the tools you use every day come directly out of it. Regex engines are finite automata. Compiler parsers are pushdown automata. The reason a linter cannot tell you for certain whether your loop terminates is a theorem in here, not a limitation of the linter.

## The Ladder

Each machine model in this subject is strictly more powerful than the last, and each step up buys exactly one new capability.

::: cards
Finite automata :: No memory. Enough for regular expressions and lexical analysis.
Regular languages :: What a regex genuinely cannot match, and why.
Context-free grammars :: Add a stack, and you can now match nested brackets - which is parsing.
Turing machines :: The model of computation itself.
Decidability :: The halting problem, and what "unsolvable" means precisely.
P versus NP :: Why some problems get approximate answers in practice, and the open question underneath.
:::`,
    whyLearn: [
      "A heavily weighted GATE subject and a classic fundamentals check in core-CS interviews.",
      "It is the theory that makes Compiler Design make sense rather than feel arbitrary.",
      "Knowing what regex can and cannot do saves you from a class of bug that is hard to see otherwise.",
      "P vs NP is the reason we accept approximate answers to real problems - useful judgement, not trivia.",
    ],
    whereUsed: [
      "Every regex engine, in every language and every text editor.",
      "Compiler and interpreter parsers, and the grammar of every language you use.",
      "Protocol and input validation, where a state machine is the right model.",
      "Recognising an NP-hard problem in the wild and choosing a heuristic instead of an exact solution.",
    ],
    skillsGained: [
      "Build a DFA or NFA for a language, and convert between them.",
      "Write and reason about a context-free grammar.",
      "Explain the halting problem's proof sketch rather than only its statement.",
      "Identify which class a problem falls into, and what that implies about approaching it.",
    ],
    prerequisites: ["Comfort with sets and basic discrete mathematics."],
    interviewImportance: 2,
    topCompanies: ["Google", "Microsoft", "Adobe", "Oracle", "Samsung R&D", "Nvidia"],
    interviewQuestions: [
      "What is the difference between a DFA and an NFA - and are they equally powerful?",
      "Give a language that is context-free but not regular, and explain why.",
      "State the halting problem and explain why it is undecidable.",
      "What does it mean for a problem to be NP-complete?",
      "Why can a regular expression not match balanced parentheses?",
    ],
  },

  "digital-logic-design": {
    overview: `## Knowing A Gate Isn't Designing A Circuit

::: story
The Computer Organization subject covered AND, OR, NOT, NAND and NOR - what each one does, and their truth tables.

Knowing what a brick does is not the same as being able to build a wall. This subject is the building.
:::

It sits directly on top of Computer Organization's gate coverage and directly under Microprocessors, and the point of finishing it is being able to see the whole path from a single NAND gate up to a working CPU.

## Two Halves, And The Difference Between Them

The dividing line in this subject is memory. A **combinational** circuit's output depends only on its current inputs. A **sequential** circuit's output also depends on what happened before - which is what makes storage, counters and state machines possible at all.

::: cards
Boolean algebra :: Simplifying an expression before you build it, because gates cost money and power.
Karnaugh maps :: Doing that simplification visually and reliably.
Combinational circuits :: Adders, multiplexers, decoders - the building blocks with no memory.
Flip-flops and latches :: The moment a circuit gains the ability to remember one bit.
Counters and registers :: What you can build once one bit can be remembered.
State machines :: Designing behaviour over time rather than a single output.
:::`,
    whyLearn: [
      "A standard subject in core and hardware-track interviews, and a well-weighted GATE topic.",
      "It is the direct link between the physics of a transistor and the logic of a program.",
      "Karnaugh maps and flip-flop questions are highly predictable, which makes preparation efficient.",
      "It makes Microprocessors and Computer Organization click rather than remain memorised.",
    ],
    whereUsed: [
      "Every processor, memory chip and microcontroller ever fabricated.",
      "FPGA and ASIC design, which is this subject as a full-time job.",
      "Embedded systems, robotics and automotive electronics.",
      "Hardware description languages like Verilog and VHDL, which describe exactly these circuits.",
    ],
    skillsGained: [
      "Simplify Boolean expressions algebraically and with Karnaugh maps.",
      "Design combinational circuits - adders, multiplexers, decoders - from a specification.",
      "Explain how a flip-flop stores a bit, and the difference between the common types.",
      "Design a finite state machine and draw its state diagram.",
    ],
    prerequisites: ["Computer Organization's number systems and logic gates lessons, or equivalent."],
    interviewImportance: 2,
    topCompanies: ["Intel", "Qualcomm", "Texas Instruments", "Nvidia", "Bosch", "Samsung"],
    interviewQuestions: [
      "What is the difference between combinational and sequential circuits?",
      "Explain the difference between a latch and a flip-flop.",
      "Simplify this Boolean expression using a Karnaugh map.",
      "How would you build a full adder from basic gates?",
      "Why are NAND and NOR called universal gates?",
    ],
  },

  "distributed-systems": {
    overview: `## Three Things That Stop Being True

::: story
Write a program for one machine and you get guarantees for free, without ever noticing you had them.

Messages arrive. The clock is the clock. If a function returns, it ran.

Spread that program across three machines and all three stop being true. Messages get lost, or arrive twice, or arrive out of order. Each machine has its own clock and they disagree. A call that times out might have succeeded, might have failed, and you cannot tell which.
:::

Distributed systems is what you do once those guarantees are gone. It is the theory underneath System Design's practical vocabulary - and the payoff is seeing quorum arithmetic and recognising the CAP trade-off you already met by name.

## What This Subject Covers

::: cards
Failure models :: What actually goes wrong, and why "the network is reliable" is the first fallacy.
Time and ordering :: Logical clocks, and why wall-clock timestamps cannot order distributed events.
Consensus :: Paxos and Raft - how a group of machines agrees on one value despite failures.
Replication and quorums :: Copies for safety, and the arithmetic that keeps them consistent.
CAP and consistency models :: Strong, eventual, causal - what each promises and what each costs.
Distributed transactions :: Two-phase commit, sagas, and why the easy answer does not scale.
:::

::: behind
Every algorithm in this subject is running in production somewhere you use. Raft is inside etcd, which is inside Kubernetes. Spanner runs Paxos. Kafka's replication is quorum arithmetic.
:::`,
    whyLearn: [
      "Asked in senior and infrastructure-focused interviews, where it separates depth from system-design vocabulary.",
      "Every backend at scale is a distributed system, whether or not anyone designed it as one.",
      "It explains the bugs that only happen in production and never reproduce locally.",
      "Understanding consensus makes Kubernetes, Kafka and modern databases legible instead of magical.",
    ],
    whereUsed: [
      "Google Spanner, etcd and ZooKeeper implement these algorithms directly.",
      "Kafka, Cassandra and DynamoDB, whose whole design is a set of consistency trade-offs.",
      "Kubernetes, which is a consensus system with a scheduler on top.",
      "Any payment or booking system that must not double-charge or double-book.",
    ],
    skillsGained: [
      "Reason about partial failure instead of assuming success or failure.",
      "Explain CAP precisely, including why 'pick two' is a simplification.",
      "Understand how consensus is reached, and why it needs a majority.",
      "Choose a consistency model deliberately for a given requirement.",
    ],
    prerequisites: ["System Design (Beginner) and Computer Networks - this subject assumes both."],
    interviewImportance: 3,
    topCompanies: ["Google", "Amazon", "Confluent", "MongoDB", "Databricks", "Uber"],
    interviewQuestions: [
      "Explain the CAP theorem - and why is 'pick any two' misleading?",
      "How does the Raft consensus algorithm elect a leader?",
      "What is eventual consistency, and when is it acceptable?",
      "Why can you not use wall-clock timestamps to order events across machines?",
      "What is the two-phase commit protocol, and what is its failure mode?",
    ],
  },

  "artificial-intelligence": {
    overview: `## AI Is Not Machine Learning

::: story
Ask most people what AI means today and they will describe machine learning - systems that learn from data.

That is one branch. A chess engine that beats a grandmaster contains no learning at all: it searches millions of positions and evaluates them with rules a human wrote. A GPS finding the fastest route is running A*, an algorithm from 1968, on a graph.
:::

Both are AI. Neither learns anything. This subject is classical, symbolic AI - search, logic, knowledge representation, planning - deliberately distinct from the Machine Learning subject, because conflating the two is the single most common misunderstanding students arrive with.

## What This Subject Covers

::: cards
Intelligent agents :: The frame the whole field is built on - perceive, decide, act.
Uninformed search :: BFS, DFS, uniform cost - exploring a problem space with no hints.
Informed search :: Heuristics, greedy search and A*, which is the one you will actually use.
Adversarial search :: Minimax and alpha-beta pruning - how a game-playing engine thinks.
Knowledge representation :: Propositional and predicate logic, and reasoning over facts.
Planning and constraints :: Getting from a state to a goal under rules.
:::

::: remember
A* is the crossover point where this subject stops feeling theoretical. It is in your maps app, in game pathfinding, and in routing systems - and it is a normal DSA interview question too.
:::`,
    whyLearn: [
      "Increasingly asked at companies building AI-adjacent products, where search and representation are the fundamentals check.",
      "A* and minimax are directly reusable algorithms, not just exam content.",
      "It is the vocabulary that makes the ML, NLP and Data Mining subjects sit in context rather than float.",
      "It is a well-weighted GATE and university subject with predictable question types.",
    ],
    whereUsed: [
      "Google Maps and every routing engine, which run A* or a descendant of it.",
      "Game AI - pathfinding, decision trees, and the engine behind any chess or Go program.",
      "Scheduling and timetabling systems, which are constraint satisfaction problems.",
      "Robotics, where planning under a goal and a set of rules is the core loop.",
    ],
    skillsGained: [
      "Model a problem as states, actions and a goal - which is most of solving it.",
      "Choose and defend a search strategy, including when a heuristic is admissible.",
      "Trace minimax with alpha-beta pruning by hand.",
      "Represent knowledge in logic and reason over it.",
    ],
    prerequisites: ["Basic data structures - graphs, queues and trees especially."],
    interviewImportance: 3,
    topCompanies: ["Google", "Microsoft", "Adobe", "Samsung R&D", "Nvidia", "Fractal"],
    interviewQuestions: [
      "What is the difference between informed and uninformed search?",
      "Explain A* - what makes a heuristic admissible, and why does that matter?",
      "How does alpha-beta pruning improve on plain minimax?",
      "What is the difference between AI, machine learning and deep learning?",
      "How would you represent 'all students who passed the exam' in predicate logic?",
    ],
  },

  "machine-learning": {
    overview: `## Rules You Can't Write

::: story
Write a program to add two numbers and you write the rule. Write one to sort a list - same thing, you know the logic, you type it out.

Now write a program that decides whether a photo contains a cat. Try to state the rule. Whiskers? Drawn cats have whiskers. Fur? So does a rug. Every rule you write has a counterexample, and you will still be writing rules next year.
:::

Machine learning is what you do when the rule exists but cannot be stated: you show the program enough examples that it derives the rule itself. That is the whole idea, and everything else in the subject is machinery for doing it reliably.

## The Through-Line Worth Watching

"Training" is optimisation. Gradient descent appears in the linear regression lesson and returns, unchanged in principle, in the neural network lesson. Every lesson that can point at that connection does, because it turns a list of algorithms into one idea applied repeatedly.

::: cards
Supervised versus unsupervised :: Learning from labelled answers, or finding structure without any.
Regression :: Predicting a number, and meeting gradient descent for the first time.
Classification :: Logistic regression, decision trees, SVMs - predicting a category.
Clustering :: k-means and friends, for when nobody labelled anything.
Overfitting and validation :: The single most important idea in the subject, and the most-asked interview question in it.
Neural networks :: The same optimisation, stacked - and where deep learning starts.
:::`,
    whyLearn: [
      "A genuine differentiator on a fresher's resume, and a core requirement for data and ML-adjacent roles.",
      "Overfitting, the bias-variance trade-off and model evaluation are near-guaranteed interview questions.",
      "It is the fastest-growing area of hiring in Indian tech, and the entry bar is knowledge rather than experience.",
      "Understanding evaluation properly protects you from the most common mistake in the field: trusting accuracy.",
    ],
    whereUsed: [
      "Recommendation engines at Netflix, YouTube, Amazon and Spotify.",
      "Fraud detection in banking and UPI, where the pattern changes faster than rules can be written.",
      "Medical imaging, credit scoring and demand forecasting.",
      "Nearly every 'smart' feature shipped in the last decade.",
    ],
    skillsGained: [
      "Frame a real problem as supervised, unsupervised or neither.",
      "Explain overfitting with a concrete example and name three ways to reduce it.",
      "Choose an evaluation metric that matches the problem - and know why accuracy is often the wrong one.",
      "Train, validate and test without leaking data between the three.",
    ],
    prerequisites: ["Comfort with basic statistics and linear algebra helps, though every lesson explains what it uses."],
    interviewImportance: 4,
    topCompanies: ["Google", "Amazon", "Microsoft", "Fractal", "Mu Sigma", "Flipkart"],
    interviewQuestions: [
      "What is overfitting, and how do you detect and reduce it?",
      "Explain the bias-variance trade-off.",
      "Why is accuracy a poor metric for imbalanced data, and what would you use instead?",
      "What is the difference between supervised and unsupervised learning?",
      "How does gradient descent work, and what does the learning rate control?",
    ],
  },

  "nlp": {
    overview: `## Why Language Is Hard

::: story
"I deposited money at the bank." "I sat by the river bank."

Same word. Nothing in the letters tells you which is which - only the words around it do. Now scale that to sarcasm, idioms, pronouns pointing three sentences back, and a language where word order carries meaning that another language carries in endings.
:::

Natural Language Processing is teaching a machine to work with that. And this subject has an unusually clean spine: **each way of representing text exists to fix a specific, nameable limitation of the one before it.** Every lesson states which limitation it is answering, because that chain is both the best way to learn it and exactly what interviews ask about.

## The Chain

::: cards
Text preprocessing :: Tokenisation, stemming, lemmatisation - turning prose into units.
Bag of words and TF-IDF :: Counting words. Fast, useful, and completely blind to order and meaning.
Word embeddings :: Word2Vec and GloVe - words as vectors, so "king" and "queen" are finally related.
Sequence models :: RNNs and LSTMs, which finally read in order but forget over distance.
Attention and transformers :: Reading everything at once and deciding what matters - the architecture behind every modern language model.
Applications :: Sentiment, named entities, translation, question answering.
:::`,
    whyLearn: [
      "Directly relevant to ML interviews at companies building language products, where embeddings and transformers are current topics.",
      "It is the subject behind the tools that have changed the industry most in the last three years.",
      "The limitation-and-fix chain makes it one of the most explainable subjects in an interview.",
      "Text is the most abundant unstructured data in every business, so the demand is broad rather than niche.",
    ],
    whereUsed: [
      "Search engines, autocomplete and spell correction.",
      "Chatbots and voice assistants, including every customer-support bot you have argued with.",
      "Machine translation, subtitling and content moderation at scale.",
      "Resume screening, sentiment analysis and document summarisation in enterprise software.",
    ],
    skillsGained: [
      "Preprocess text deliberately rather than by copying a pipeline.",
      "Explain why embeddings beat bag-of-words, in terms of what the older method could not represent.",
      "Describe what attention computes and why it displaced recurrence.",
      "Choose a representation that matches the task instead of the newest one available.",
    ],
    prerequisites: ["Machine Learning fundamentals - supervised learning, training and evaluation."],
    interviewImportance: 3,
    topCompanies: ["Google", "Microsoft", "Amazon", "Adobe", "Sprinklr", "Observe.AI"],
    interviewQuestions: [
      "What is the difference between stemming and lemmatisation?",
      "Why are word embeddings better than one-hot encoding or bag-of-words?",
      "What problem does attention solve that RNNs and LSTMs could not?",
      "Explain TF-IDF - what is each term doing?",
      "How would you approach a sentiment classification task from scratch?",
    ],
  },

  "computer-graphics": {
    overview: `## The Algorithms, Not The Software

::: story
Computer graphics is often confused with graphic design. They share a subject and almost nothing else.

Graphic design is what to draw. Computer graphics is *how a machine turns numbers into lit pixels* - sixty times a second, for two million pixels, without missing a frame.
:::

This subject is one pipeline taught in stages, and the ordering is itself the content. Why clipping happens before rasterization, why transformations are matrices, why a 3D scene becomes a 2D image in that particular sequence - each answer explains the next stage.

## The Pipeline

::: cards
Raster fundamentals :: Line and circle drawing algorithms - Bresenham, and why integer arithmetic won.
2D transformations :: Translation, rotation, scaling as matrices, and why matrices at all.
Clipping and windowing :: Discarding what is off-screen before paying to draw it.
3D transformations and projection :: Getting from a world of coordinates to a flat image.
Hidden surface removal :: Deciding what is in front of what.
Lighting and shading :: Why a sphere looks like a sphere rather than a circle.
:::

::: behind
Every one of these runs on your GPU right now, thousands of times per frame. The subject is old, but nothing in it has been replaced - only accelerated.
:::`,
    whyLearn: [
      "Relevant for game development and graphics-adjacent interviews, where transformation matrices and the pipeline are the classic checks.",
      "It makes linear algebra concrete in a way no other subject does - matrices become something you can see.",
      "Graphics programming is one of the few areas where a strong personal project speaks louder than a resume.",
      "It is a well-defined GATE and university subject with highly predictable question types.",
    ],
    whereUsed: [
      "Every video game engine - Unity and Unreal implement exactly this pipeline.",
      "CAD tools, 3D animation software and architectural visualisation.",
      "Medical imaging and scientific visualisation.",
      "AR and VR, which are this pipeline under a much harder latency budget.",
    ],
    skillsGained: [
      "Apply and compose transformation matrices, and know why the order matters.",
      "Trace Bresenham's algorithm and explain why it avoids floating point.",
      "Explain the full pipeline from world coordinates to a rendered pixel.",
      "Reason about why a rendering step is where it is in the sequence.",
    ],
    prerequisites: ["Basic linear algebra - matrices and vectors."],
    interviewImportance: 2,
    topCompanies: ["Nvidia", "Adobe", "Unity", "Autodesk", "Qualcomm", "Ubisoft"],
    interviewQuestions: [
      "Why does Bresenham's algorithm use only integer arithmetic?",
      "How do you represent a rotation as a matrix, and why does the order of transformations matter?",
      "What is the difference between orthographic and perspective projection?",
      "Explain the z-buffer algorithm for hidden surface removal.",
      "Why is clipping performed before rasterization rather than after?",
    ],
  },

  "data-mining": {
    overview: `## Ore From Rock

::: story
Mining moves an enormous volume of rock to extract a small amount of something valuable. Nobody wants the rock. The whole operation is justified by what is hidden in it.

A supermarket chain has ten years of till receipts. Hundreds of millions of rows. Almost all of it is unremarkable. Somewhere in there is the fact that changes what they stock and where they put it.
:::

Data mining is the extraction. Not storing the data - that is DBMS - and not predicting with it, which is where this subject and Machine Learning deliberately overlap. The difference is emphasis: ML optimises for *predicting accurately*, data mining for *explaining a pattern a human can act on*.

## What This Subject Covers

Several lessons here use the same algorithms as the Machine Learning subject. Each one names which of the two goals it is serving rather than re-deriving mechanics covered elsewhere.

::: cards
The KDD process :: Selection, preprocessing, transformation, mining, evaluation - the mining is the small part.
Data preprocessing :: Cleaning, integration and reduction, which is where most of the time actually goes.
Association rules :: Apriori, market basket analysis, and the support/confidence/lift trio.
Classification :: Decision trees, applied for interpretability rather than raw accuracy.
Clustering :: Finding groups nobody defined in advance.
Anomaly detection :: The rare row that matters more than the million ordinary ones.
:::`,
    whyLearn: [
      "Directly relevant to data analyst and business intelligence roles, which hire heavily at fresher level.",
      "Association rules and the KDD process are standard university and interview content.",
      "It teaches the part of data work everyone underestimates: preprocessing is most of the job.",
      "Explaining a pattern to a non-technical stakeholder is a distinct, valuable skill this subject trains.",
    ],
    whereUsed: [
      "Retail basket analysis - the classic 'customers who bought this also bought' engine.",
      "Fraud and anomaly detection in banking and insurance.",
      "Customer segmentation and churn analysis in every subscription business.",
      "Healthcare analytics, finding correlations across large patient datasets.",
    ],
    skillsGained: [
      "Run the KDD process end to end rather than jumping straight to an algorithm.",
      "Compute and interpret support, confidence and lift, including why lift is the honest one.",
      "Clean and reduce a messy dataset deliberately.",
      "Choose interpretability over accuracy when the audience is a decision-maker.",
    ],
    prerequisites: ["Basic statistics, and DBMS or SQL familiarity."],
    interviewImportance: 3,
    topCompanies: ["Mu Sigma", "Fractal", "Amazon", "Walmart Labs", "ZS Associates", "Accenture"],
    interviewQuestions: [
      "What are the steps of the KDD process?",
      "Explain support, confidence and lift - why is high confidence alone misleading?",
      "How does the Apriori algorithm reduce the search space?",
      "What is the difference between classification and clustering?",
      "How would you handle missing values in a real dataset?",
    ],
  },

  "parallel-computing": {
    overview: `## When Clock Speed Stopped Rising

::: story
For decades, next year's computer was faster because next year's chip ran at a higher clock speed. 500MHz, then 1GHz, then 3GHz. You wrote ordinary sequential code and it got faster on its own.

Then, around 2005, it stopped. Physics - heat, mostly. Chips did not get faster. They got *wider*: two cores, then four, then sixteen.
:::

That is the reason this subject exists. Free speedups ended, and the only remaining way to go faster is to do several things at once - which is a fundamentally harder way to write a program.

## What This Subject Covers

Race conditions, deadlock and Amdahl's Law appear in other subjects too. Each lesson here says which lens it is applying rather than pretending the material is new, which is also what the interview lesson asks you to do.

::: cards
Parallel architectures :: Flynn's taxonomy, shared versus distributed memory.
Amdahl's and Gustafson's laws :: The arithmetic of how much speedup is even possible.
Threads and shared memory :: OpenMP-style parallelism, and the synchronisation cost that comes with it.
Message passing :: MPI, and parallelism across machines rather than cores.
GPU computing :: Thousands of small cores, and the problems that suit them.
Correctness :: Race conditions and deadlock, seen again from the performance side.
:::

::: remember
Amdahl's Law is the one that changes how you think. If 10% of a program is inherently sequential, then infinite cores buy you at most a 10x speedup - forever. Knowing that stops a lot of wasted effort.
:::`,
    whyLearn: [
      "Relevant to HPC, systems and performance-engineering interviews, where Amdahl's Law is a standard question.",
      "Every machine you will write code for has multiple cores, so this is the default situation and not a special case.",
      "It sharpens the concurrency knowledge from Operating Systems by adding the performance dimension.",
      "GPU computing is the foundation of modern ML infrastructure.",
    ],
    whereUsed: [
      "Scientific computing, weather simulation and computational biology.",
      "Video encoding, rendering farms and image processing pipelines.",
      "Machine learning training, which is GPU parallelism almost end to end.",
      "Any backend service handling concurrent requests across cores.",
    ],
    skillsGained: [
      "Apply Amdahl's Law to decide whether parallelising something is worth it at all.",
      "Tell shared-memory and message-passing models apart and pick correctly.",
      "Recognise which problems suit a GPU and which do not.",
      "Reason about synchronisation overhead as a real cost, not a footnote.",
    ],
    prerequisites: ["Operating Systems - processes, threads and synchronisation."],
    interviewImportance: 2,
    topCompanies: ["Nvidia", "Intel", "AMD", "Qualcomm", "Ansys", "Siemens"],
    interviewQuestions: [
      "State Amdahl's Law and explain what it implies about adding cores.",
      "What is the difference between concurrency and parallelism?",
      "Compare shared memory and message passing models.",
      "What kinds of problems are a good fit for a GPU, and why?",
      "What is false sharing, and why does it hurt performance?",
    ],
  },

  "microprocessors": {
    overview: `## A Brain In A Jar

::: story
A microprocessor on its own can think and do nothing else. It cannot see, cannot remember anything for long, cannot act on the world. Power it up in isolation and it is a brain in a jar.

Every part of this subject after the first lesson is wiring one more thing onto it - memory, senses, reflexes - until the microcontroller lesson puts the whole nervous system on a single piece of silicon the size of a fingernail.
:::

## Overlap With Computer Organization, Stated On Purpose

These two subjects cover related ground. Computer Organization asks *how a CPU is designed*. This one asks *how you build a working system around one and program it*. Each lesson names the overlap and says which level it is working at, rather than re-teaching it.

::: cards
Architecture :: Registers, buses, and the pin-level view of a real chip.
Instruction sets and assembly :: Programming at the level the hardware actually executes.
Memory interfacing :: Address decoding, and connecting real memory chips.
I/O and peripherals :: Giving the brain senses - ports, timers, serial communication.
Interrupts :: Reflexes - responding to the world without polling for it.
Microcontrollers :: CPU, memory and I/O on one die, which is what is inside almost every device you own.
:::`,
    whyLearn: [
      "A core subject for embedded, VLSI and hardware-track roles, which hire steadily and competitively.",
      "Assembly and interrupt questions are standard in core-company interviews and GATE alike.",
      "It is the most direct route to understanding what your high-level code actually becomes.",
      "Embedded projects with real hardware are unusually persuasive on a fresher's resume.",
    ],
    whereUsed: [
      "Every embedded device - washing machines, cars, medical instruments, industrial controllers.",
      "IoT hardware and robotics, where the microcontroller is the whole computer.",
      "Automotive electronics, a large and growing engineering employer in India.",
      "Arduino and ESP32 projects, which are this subject with a friendlier toolchain.",
    ],
    skillsGained: [
      "Read and write basic assembly and know what each instruction costs.",
      "Explain how an interrupt is serviced, step by step.",
      "Interface memory and peripherals with correct address decoding.",
      "Choose between a microprocessor and a microcontroller for a real requirement.",
    ],
    prerequisites: ["Computer Organization and Digital Logic Design."],
    interviewImportance: 2,
    topCompanies: ["Intel", "Texas Instruments", "Bosch", "Qualcomm", "Continental", "L&T Technology"],
    interviewQuestions: [
      "What is the difference between a microprocessor and a microcontroller?",
      "Explain how an interrupt is handled, from signal to return.",
      "What is the difference between memory-mapped and I/O-mapped addressing?",
      "What are the address, data and control buses, and what does each carry?",
      "Why would you use polling instead of an interrupt, or the other way round?",
    ],
  },

  "cyber-security": {
    overview: `## Three Words That Cover Everything

::: story
A hospital's patient records system is encrypted so thoroughly that nobody outside the building could ever read a single record.

Then a power failure takes it offline for two days, and the doctors treating patients cannot read them either.

Nothing was stolen. Nothing was altered. It was still a serious security failure.
:::

**Confidentiality, integrity, availability.** The CIA triad is not a memorable acronym for an exam - it is the reason that hospital's failure counts as a security failure at all. Every control in this subject exists as an answer to a threat against one of the three.

## Organisational, Not Only Technical

This subject is operational and organisational security, deliberately distinct from Security Fundamentals, which covers the application-level vulnerabilities you find in code review. Here the questions are about defending an organisation: what the attacker does, what you monitor, who is accountable, and what happens at 3am when something goes wrong.

::: cards
The CIA triad and threat models :: The frame everything else hangs on.
Attack types :: Malware, phishing, social engineering, DDoS - what is actually used, and how often.
Network defence :: Firewalls, IDS/IPS, VPNs, segmentation.
Cryptography in practice :: Keys, certificates and PKI as operational concerns.
Incident response :: Detection, containment, eradication, recovery - the runbook.
Governance and compliance :: Policy, risk, audit, and why the paperwork is load-bearing.
:::`,
    whyLearn: [
      "Security hiring is growing faster than almost any other specialism, and the fresher bar is knowledge-based.",
      "The CIA triad, attack types and incident response are standard interview ground for any security-adjacent role.",
      "Phishing and social engineering are the leading real-world attack vectors - and the least technical.",
      "It is useful to every developer, not only security specialists: you are part of the attack surface.",
    ],
    whereUsed: [
      "Security operations centres, which run detection and incident response as a full-time function.",
      "Banking, fintech and healthcare, where compliance is a legal requirement rather than a preference.",
      "Every company's internal IT and access management.",
      "Penetration testing and red teaming, which is this subject from the attacker's side.",
    ],
    skillsGained: [
      "Classify a threat against the CIA triad and name the control that answers it.",
      "Explain the phases of incident response in order and say what each is for.",
      "Recognise phishing and social engineering patterns, including the ones aimed at engineers.",
      "Read a security architecture and identify what is defending what.",
    ],
    prerequisites: ["Computer Networks - firewalls, VPNs and segmentation assume it."],
    interviewImportance: 3,
    topCompanies: ["Palo Alto Networks", "Cisco", "Zscaler", "Deloitte", "EY", "Qualys"],
    interviewQuestions: [
      "What is the CIA triad, and give a real failure for each element.",
      "What is the difference between a threat, a vulnerability and a risk?",
      "Explain the phases of incident response.",
      "What is the difference between symmetric and asymmetric encryption, and where is each used?",
      "How does a firewall differ from an IDS and an IPS?",
    ],
  },
};
