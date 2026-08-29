export interface SampleQuestion {
  question: string;
  topic: string;
}

export interface CompanyResource {
  companySlug: string;
  companyName: string;
  type: "Sample Aptitude Paper" | "Previous Year Coding Questions" | "Technical Cheat Sheet";
  description: string;
  questions: SampleQuestion[];
}

export const companyResources: CompanyResource[] = [
  {
    companySlug: "amazon",
    companyName: "Amazon",
    type: "Sample Aptitude Paper",
    description: "Work simulation and OA-style questions covering logical and numerical reasoning.",
    questions: [
      { question: "A warehouse robot can sort 40 packages per hour. If 3 robots work together with a 10% efficiency loss due to coordination overhead, how many packages are sorted in 5 hours?", topic: "Time & Work" },
      { question: "Given a delivery route matrix, determine the shortest path using given distances between 5 hubs.", topic: "Logical Reasoning" },
      { question: "If the probability of an on-time delivery is 0.92, what is the probability that at least 2 of 3 independent deliveries are on time?", topic: "Probability" },
      { question: "A situational judgment question: how would you prioritize customer complaints during a system outage?", topic: "Work Simulation" },
      { question: "Simplify a series of nested percentage discounts applied to an order value.", topic: "Percentages" },
    ],
  },
  {
    companySlug: "amazon",
    companyName: "Amazon",
    type: "Previous Year Coding Questions",
    description: "DSA problems frequently reported from Amazon's online assessment and interview rounds.",
    questions: [
      { question: "Find the k-th largest element in an unsorted array in optimal time.", topic: "Heaps" },
      { question: "Given a grid of 0s and 1s, find the number of islands.", topic: "Graphs / BFS-DFS" },
      { question: "Design and implement an LRU cache with O(1) get and put operations.", topic: "Design" },
      { question: "Serialize and deserialize a binary tree.", topic: "Trees" },
      { question: "Find the shortest path in a weighted graph representing delivery hubs.", topic: "Dijkstra's Algorithm" },
      { question: "Given a stream of integers, maintain the median efficiently.", topic: "Heaps" },
    ],
  },
  {
    companySlug: "amazon",
    companyName: "Amazon",
    type: "Technical Cheat Sheet",
    description: "Quick-reference notes on Amazon's Leadership Principles and system design basics for freshers.",
    questions: [
      { question: "Ownership: Be ready with a story where you took responsibility beyond your assigned scope.", topic: "Leadership Principles" },
      { question: "Dive Deep: Prepare an example of debugging a subtle, hard-to-find issue.", topic: "Leadership Principles" },
      { question: "Low-level design basics: SOLID principles and class diagram notation.", topic: "System Design" },
      { question: "Big-O cheat sheet for common data structure operations.", topic: "Complexity Analysis" },
    ],
  },
  {
    companySlug: "tcs",
    companyName: "TCS",
    type: "Sample Aptitude Paper",
    description: "TCS NQT-style quantitative, verbal, and reasoning practice set.",
    questions: [
      { question: "A train travels 360 km at a uniform speed. If the speed had been 5 km/h more, it would have taken 1 hour less. Find the original speed.", topic: "Time, Speed & Distance" },
      { question: "Find the next number in the series: 2, 6, 12, 20, 30, ?", topic: "Number Series" },
      { question: "Choose the correctly spelled word from the given options.", topic: "Verbal Ability" },
      { question: "If A is coded as 1, B as 2, decode a given word into its numeric sequence.", topic: "Coding-Decoding" },
      { question: "A can complete a task in 12 days, B in 18 days. How long will they take working together?", topic: "Time & Work" },
    ],
  },
  {
    companySlug: "tcs",
    companyName: "TCS",
    type: "Previous Year Coding Questions",
    description: "Programming logic questions from TCS NQT and TCS Digital coding rounds.",
    questions: [
      { question: "Write a program to check whether a given number is an Armstrong number.", topic: "Basic Programming" },
      { question: "Rotate a given matrix by 90 degrees in place.", topic: "Arrays" },
      { question: "Find the frequency of each character in a string.", topic: "Strings" },
      { question: "Implement a basic calculator that evaluates a simple expression string.", topic: "Stacks" },
    ],
  },
  {
    companySlug: "tcs",
    companyName: "TCS",
    type: "Technical Cheat Sheet",
    description: "Core CS fundamentals TCS interviewers commonly probe for the Digital track.",
    questions: [
      { question: "Normalization forms (1NF, 2NF, 3NF, BCNF) with simple examples.", topic: "DBMS" },
      { question: "Difference between process and thread.", topic: "Operating Systems" },
      { question: "OOP pillars: encapsulation, inheritance, polymorphism, abstraction.", topic: "OOP" },
      { question: "TCP vs UDP quick comparison.", topic: "Computer Networks" },
    ],
  },
  {
    companySlug: "cognizant",
    companyName: "Cognizant",
    type: "Sample Aptitude Paper",
    description: "AMCAT-style aptitude and automata coding practice for Cognizant GenC drives.",
    questions: [
      { question: "A shopkeeper marks up goods by 40% and gives a discount of 20%. Find the overall profit percentage.", topic: "Profit & Loss" },
      { question: "Identify the odd one out among a set of given words.", topic: "Verbal Reasoning" },
      { question: "Solve a syllogism with two given statements and conclusions.", topic: "Logical Reasoning" },
      { question: "A boat's speed in still water is 8 km/h; the current speed is 2 km/h. Find the time to cover 30 km downstream.", topic: "Boats & Streams" },
    ],
  },
  {
    companySlug: "cognizant",
    companyName: "Cognizant",
    type: "Previous Year Coding Questions",
    description: "Automata-round style problems reported by past Cognizant GenC/GenC Pro candidates.",
    questions: [
      { question: "Reverse the words in a given sentence without using built-in reverse functions.", topic: "Strings" },
      { question: "Check whether a given linked list is a palindrome.", topic: "Linked Lists" },
      { question: "Find the missing number in an array containing 1 to N.", topic: "Arrays" },
      { question: "Print all permutations of a given string.", topic: "Recursion & Backtracking" },
    ],
  },
  {
    companySlug: "cognizant",
    companyName: "Cognizant",
    type: "Technical Cheat Sheet",
    description: "Quick-glance notes for the combined technical + HR panel round.",
    questions: [
      { question: "SQL joins: inner, left, right, and full outer with examples.", topic: "SQL" },
      { question: "Exception handling hierarchy in Java.", topic: "Java" },
      { question: "Agile vs Waterfall — key differences.", topic: "SDLC" },
    ],
  },
  {
    companySlug: "capgemini",
    companyName: "Capgemini",
    type: "Sample Aptitude Paper",
    description: "Games-based cognitive assessment and pseudo-code style practice set.",
    questions: [
      { question: "Pattern completion: identify the missing tile in a 3x3 grid of shapes.", topic: "Cognitive Ability" },
      { question: "Pseudocode trace: determine the output of a given loop-based pseudocode block.", topic: "Pseudo-Code" },
      { question: "Comprehension passage followed by 3 inference-based questions.", topic: "English Comprehension" },
      { question: "A sequence of numbers follows a hidden rule; predict the next two terms.", topic: "Number Series" },
    ],
  },
  {
    companySlug: "capgemini",
    companyName: "Capgemini",
    type: "Previous Year Coding Questions",
    description: "Logic-building problems from Capgemini's pseudo-code and technical rounds.",
    questions: [
      { question: "Write pseudocode to find the second largest number in an array.", topic: "Pseudo-Code" },
      { question: "Implement bubble sort and trace its steps for a sample array.", topic: "Sorting" },
      { question: "Check if two strings are anagrams of each other.", topic: "Strings" },
    ],
  },
  {
    companySlug: "capgemini",
    companyName: "Capgemini",
    type: "Technical Cheat Sheet",
    description: "SDLC and OOP quick reference for the Capgemini technical interview.",
    questions: [
      { question: "Waterfall vs Agile vs Scrum — one-line distinctions.", topic: "SDLC" },
      { question: "Method overloading vs overriding with examples.", topic: "OOP" },
    ],
  },
  {
    companySlug: "accenture",
    companyName: "Accenture",
    type: "Sample Aptitude Paper",
    description: "Cognitive and technical assessment practice for the Accenture ASE/Digital drive.",
    questions: [
      { question: "A mixture contains milk and water in the ratio 5:2. If 14 liters of water is added, the ratio becomes 5:4. Find the initial quantity of milk.", topic: "Ratio & Proportion" },
      { question: "Choose the sentence with correct grammar from the given options.", topic: "Verbal Ability" },
      { question: "Given a set of premises, identify the valid logical conclusion.", topic: "Logical Reasoning" },
    ],
  },
  {
    companySlug: "accenture",
    companyName: "Accenture",
    type: "Previous Year Coding Questions",
    description: "Coding assessment questions reported from recent Accenture drives.",
    questions: [
      { question: "Find all pairs in an array that sum to a target value.", topic: "Arrays" },
      { question: "Check whether a given number is prime using an efficient method.", topic: "Number Theory" },
      { question: "Implement a simple queue using two stacks.", topic: "Stacks & Queues" },
    ],
  },
  {
    companySlug: "accenture",
    companyName: "Accenture",
    type: "Technical Cheat Sheet",
    description: "Communication and technical fundamentals reference for Accenture's Versant + technical rounds.",
    questions: [
      { question: "Tips for scoring well on the Versant automated English test.", topic: "Communication" },
      { question: "Basic SQL query patterns: SELECT, WHERE, GROUP BY, HAVING.", topic: "SQL" },
    ],
  },
  {
    companySlug: "deloitte",
    companyName: "Deloitte",
    type: "Sample Aptitude Paper",
    description: "Quant, reasoning, and case-study comprehension practice for Deloitte USI.",
    questions: [
      { question: "A case-study passage on a company's digital transformation followed by 3 analytical questions.", topic: "Case Study Comprehension" },
      { question: "Compute compound interest for a given principal, rate, and time.", topic: "Simple & Compound Interest" },
      { question: "Direction sense: determine the final direction after a series of turns.", topic: "Logical Reasoning" },
    ],
  },
  {
    companySlug: "deloitte",
    companyName: "Deloitte",
    type: "Previous Year Coding Questions",
    description: "Technical round coding and SQL questions reported by past Deloitte candidates.",
    questions: [
      { question: "Write a SQL query to find the second highest salary from an Employee table.", topic: "SQL" },
      { question: "Find duplicate elements in an array in O(n) time.", topic: "Arrays" },
    ],
  },
  {
    companySlug: "deloitte",
    companyName: "Deloitte",
    type: "Technical Cheat Sheet",
    description: "Group discussion strategy and core CS notes for Deloitte's multi-round process.",
    questions: [
      { question: "Group discussion framework: how to open, build on points, and conclude within time.", topic: "Group Discussion" },
      { question: "Normalization vs denormalization — when to use which.", topic: "DBMS" },
    ],
  },
  {
    companySlug: "epam",
    companyName: "EPAM Systems",
    type: "Sample Aptitude Paper",
    description: "Logic and OOP-oriented pre-screening practice for EPAM's Junior Software Engineer program.",
    questions: [
      { question: "Identify the design pattern being described in a short scenario (Singleton, Factory, Observer).", topic: "Design Patterns" },
      { question: "A logic grid puzzle involving 4 people, their departments, and preferred languages.", topic: "Logical Reasoning" },
    ],
  },
  {
    companySlug: "epam",
    companyName: "EPAM Systems",
    type: "Previous Year Coding Questions",
    description: "Medium-difficulty DSA and OOP design questions from EPAM's coding rounds.",
    questions: [
      { question: "Implement a trie and support prefix-based search.", topic: "Tries" },
      { question: "Design a simple OOP model for a vehicle rental system.", topic: "OOP Design" },
      { question: "Detect a cycle in a directed graph.", topic: "Graphs" },
      { question: "Merge overlapping intervals from a given list.", topic: "Arrays / Intervals" },
    ],
  },
  {
    companySlug: "epam",
    companyName: "EPAM Systems",
    type: "Technical Cheat Sheet",
    description: "Java/Python fundamentals and lightweight system design reference for EPAM interviews.",
    questions: [
      { question: "Abstract class vs interface — when to choose which.", topic: "OOP" },
      { question: "Basics of REST API design: verbs, status codes, idempotency.", topic: "System Design" },
    ],
  },
  {
    companySlug: "salesforce",
    companyName: "Salesforce",
    type: "Sample Aptitude Paper",
    description: "DSA-focused pre-screening practice reflecting Salesforce's selective hiring bar.",
    questions: [
      { question: "Given a stream of stock prices, find the maximum profit from a single buy-sell transaction.", topic: "Arrays" },
      { question: "A logic puzzle involving scheduling meetings without conflicts.", topic: "Logical Reasoning" },
    ],
  },
  {
    companySlug: "salesforce",
    companyName: "Salesforce",
    type: "Previous Year Coding Questions",
    description: "Coding and design questions reported from Salesforce ASE interviews.",
    questions: [
      { question: "Implement an LRU cache using a doubly linked list and hashmap.", topic: "Design" },
      { question: "Find the lowest common ancestor of two nodes in a binary tree.", topic: "Trees" },
      { question: "Detect and remove a cycle in a linked list.", topic: "Linked Lists" },
    ],
  },
  {
    companySlug: "salesforce",
    companyName: "Salesforce",
    type: "Technical Cheat Sheet",
    description: "Cloud computing basics and OOP fundamentals relevant to Salesforce's platform.",
    questions: [
      { question: "Multi-tenancy in cloud architecture — key concept and benefits.", topic: "Cloud Computing" },
      { question: "SOQL vs SQL — key differences relevant to the Salesforce platform.", topic: "Databases" },
    ],
  },
  {
    companySlug: "teksystems",
    companyName: "TekSystems",
    type: "Sample Aptitude Paper",
    description: "Quantitative reasoning and business-English practice for TekSystems consulting roles.",
    questions: [
      { question: "A client project requires allocating 12 consultants across 3 teams in a fixed ratio — determine the allocation.", topic: "Ratio & Proportion" },
      { question: "Business-English comprehension passage with vocabulary-in-context questions.", topic: "Verbal Ability" },
    ],
  },
  {
    companySlug: "teksystems",
    companyName: "TekSystems",
    type: "Previous Year Coding Questions",
    description: "Foundational programming questions from TekSystems' technical screening.",
    questions: [
      { question: "Write a program to check if a string is a palindrome.", topic: "Strings" },
      { question: "Find the factorial of a number using recursion and iteration.", topic: "Basic Programming" },
    ],
  },
  {
    companySlug: "teksystems",
    companyName: "TekSystems",
    type: "Technical Cheat Sheet",
    description: "Client-consulting scenario notes and adaptability talking points.",
    questions: [
      { question: "How to structure an answer about adapting to a new client's tech stack quickly.", topic: "Consulting Mindset" },
      { question: "SDLC awareness: how consulting engagements typically track project phases.", topic: "SDLC" },
    ],
  },
];

export interface PracticeTopic {
  title: string;
  detail: string;
}

export interface PracticeCategory {
  id: string;
  label: string;
  description: string;
  topics: PracticeTopic[];
}

export const practiceCategories: PracticeCategory[] = [
  {
    id: "quant",
    label: "Quantitative Aptitude",
    description: "Core numerical ability topics tested across almost every recruiter's first round.",
    topics: [
      { title: "Time, Speed & Distance", detail: "Relative speed, boats & streams, races and circular tracks." },
      { title: "Percentages & Profit-Loss", detail: "Successive percentage changes, discount chains, and marked price problems." },
      { title: "Time & Work", detail: "Combined work rates, pipes & cisterns, and efficiency-based problems." },
      { title: "Permutations & Combinations", detail: "Arrangement vs selection problems and common shortcut identities." },
      { title: "Probability", detail: "Classical probability, conditional probability, and expected value basics." },
      { title: "Simple & Compound Interest", detail: "Interest computation shortcuts and difference-of-interest problems." },
    ],
  },
  {
    id: "reasoning",
    label: "Logical Reasoning",
    description: "Pattern recognition and structured logic questions common in aptitude rounds.",
    topics: [
      { title: "Series Completion", detail: "Number, letter, and alphanumeric series pattern identification." },
      { title: "Syllogisms", detail: "Statement-conclusion validity using Venn diagram techniques." },
      { title: "Blood Relations", detail: "Family tree mapping from layered relationship statements." },
      { title: "Direction Sense", detail: "Tracking net displacement and final direction after multiple turns." },
      { title: "Puzzles & Seating Arrangement", detail: "Linear/circular arrangement and logic-grid puzzles." },
      { title: "Coding-Decoding", detail: "Letter shifting, number coding, and symbol substitution patterns." },
    ],
  },
  {
    id: "verbal",
    label: "Verbal Ability",
    description: "English comprehension and usage topics tested in most service-based company drives.",
    topics: [
      { title: "Reading Comprehension", detail: "Passage-based inference, tone, and vocabulary-in-context questions." },
      { title: "Sentence Correction", detail: "Grammar, subject-verb agreement, and tense consistency." },
      { title: "Synonyms & Antonyms", detail: "High-frequency word lists commonly tested in aptitude rounds." },
      { title: "Para Jumbles", detail: "Rearranging jumbled sentences into a coherent paragraph." },
      { title: "Spotting Errors", detail: "Identifying grammatical errors within a given sentence." },
    ],
  },
  {
    id: "dsa",
    label: "Data Structures & Algorithms",
    description: "The backbone of technical interviews at every product-based recruiter.",
    topics: [
      { title: "Arrays & Strings", detail: "Two-pointer, sliding window, and prefix-sum techniques." },
      { title: "Linked Lists", detail: "Reversal, cycle detection, and merge operations." },
      { title: "Trees & Graphs", detail: "Traversals, BFS/DFS, shortest path, and topological sort." },
      { title: "Dynamic Programming", detail: "Knapsack variants, longest common subsequence, and memoization patterns." },
      { title: "Heaps & Priority Queues", detail: "Top-k problems, median maintenance, and scheduling problems." },
      { title: "Recursion & Backtracking", detail: "Permutations, subsets, N-Queens, and Sudoku-style problems." },
    ],
  },
  {
    id: "core-cs",
    label: "Core Technical Subject Notes",
    description: "Fundamentals interviewers probe across DBMS, OS, CN, and OOP regardless of your branch.",
    topics: [
      { title: "DBMS Normalization", detail: "1NF through BCNF with practical schema examples." },
      { title: "Operating Systems Basics", detail: "Process vs thread, scheduling algorithms, and deadlock conditions." },
      { title: "Computer Networks", detail: "OSI vs TCP/IP model, TCP vs UDP, and common protocol ports." },
      { title: "Object-Oriented Programming", detail: "Encapsulation, inheritance, polymorphism, and abstraction with examples." },
      { title: "SQL Query Patterns", detail: "Joins, subqueries, aggregate functions, and window functions." },
    ],
  },
];
