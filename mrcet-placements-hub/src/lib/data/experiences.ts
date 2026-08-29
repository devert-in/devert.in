export type ExperienceStatus = "Selected" | "Not Selected" | "Waitlisted";

export interface ExperienceRound {
  roundName: string;
  description: string;
}

export interface Experience {
  id: string;
  studentName: string;
  branch: string;
  company: string;
  role: string;
  status: ExperienceStatus;
  difficulty: number;
  tags: string[];
  rounds: ExperienceRound[];
  proTip: string;
}

export const allExperienceTags = [
  "#ProductBased",
  "#OnCampus",
  "#OffCampus",
  "#AI_ML",
  "#WebDev",
  "#DataScience",
  "Amazon",
  "TCS",
  "Cognizant",
  "Capgemini",
  "Accenture",
  "Deloitte",
  "EPAM Systems",
  "Salesforce",
  "TekSystems",
];

export const experiences: Experience[] = [
  {
    id: "e1",
    studentName: "K. Sai Nikhil",
    branch: "CSE",
    company: "Amazon",
    role: "SDE-1",
    status: "Selected",
    difficulty: 5,
    tags: ["#ProductBased", "#OnCampus", "Amazon"],
    rounds: [
      { roundName: "Online Assessment", description: "Two DSA problems: a sliding-window subarray problem and a graph BFS shortest-path problem, plus a 20-minute work simulation." },
      { roundName: "Technical Interview 1", description: "Solved 'find the k-th largest element in a stream' using a min-heap. Discussed time complexity trade-offs vs sorting on every insert." },
      { roundName: "Technical Interview 2", description: "Low-level design of a parking lot system with OOP principles, followed by a binary tree serialization/deserialization problem." },
      { roundName: "Bar Raiser", description: "Deep behavioral round on Ownership and Dive Deep leadership principles, plus a recursion-based backtracking problem (N-Queens variant)." },
      { roundName: "HR Round", description: "Compensation breakdown, relocation to Hyderabad campus, and joining date confirmation." },
    ],
    proTip: "Practice heaps and graph traversal until they are second nature — Amazon's bar raiser round tests composure under pressure more than raw difficulty.",
  },
  {
    id: "e2",
    studentName: "Anonymous",
    branch: "IT",
    company: "TCS",
    role: "TCS Digital - Developer",
    status: "Selected",
    difficulty: 3,
    tags: ["#OnCampus", "TCS"],
    rounds: [
      { roundName: "TCS NQT", description: "Quant covered time-speed-distance and probability; coding section had a matrix rotation problem in C++." },
      { roundName: "Technical Interview", description: "Explained DBMS normalization forms with examples, then wrote SQL joins for a sample schema on paper." },
      { roundName: "Managerial Round", description: "Asked about willingness to relocate and handling conflicting priorities in a team project." },
      { roundName: "HR Interview", description: "Standard background check and salary structure explanation for the Digital track." },
    ],
    proTip: "For TCS Digital, brush up on SQL joins and normalization — it comes up in almost every technical round regardless of your branch.",
  },
  {
    id: "e3",
    studentName: "M. Sindhu Reddy",
    branch: "CSE-AI&ML",
    company: "Salesforce",
    role: "Associate Software Engineer",
    status: "Selected",
    difficulty: 5,
    tags: ["#ProductBased", "#OnCampus", "#AI_ML", "Salesforce"],
    rounds: [
      { roundName: "Online Assessment", description: "Array/string problem on longest palindromic substring and a graph problem on detecting cycles in a directed graph." },
      { roundName: "Technical Interview 1", description: "Live-coded a LRU cache implementation using a doubly linked list and hashmap, discussed eviction policy edge cases." },
      { roundName: "Technical Interview 2", description: "OOP design questions on polymorphism, plus basic cloud computing and multi-tenancy concepts relevant to Salesforce's platform." },
      { roundName: "Hiring Manager Round", description: "Behavioral round on growth mindset, handling failure in an academic ML project, and team collaboration." },
    ],
    proTip: "Salesforce cares deeply about how you communicate your thought process — narrate your approach out loud even before you start typing code.",
  },
  {
    id: "e4",
    studentName: "G. Charan Teja",
    branch: "IT",
    company: "EPAM Systems",
    role: "Junior Software Engineer",
    status: "Selected",
    difficulty: 4,
    tags: ["#ProductBased", "#OnCampus", "#WebDev", "EPAM Systems"],
    rounds: [
      { roundName: "Online Coding Test", description: "Implemented a custom stack using two queues, and a second problem on merging overlapping intervals." },
      { roundName: "Technical Interview 1", description: "Deep questions on Java OOP — abstract classes vs interfaces, and exception handling hierarchy." },
      { roundName: "Technical Interview 2", description: "Designed a basic REST API for a library management system, discussed HTTP methods and status codes." },
      { roundName: "HR Interview", description: "Discussed relocation flexibility and long-term career interest in software engineering vs testing roles." },
    ],
    proTip: "EPAM values clean, readable code over clever one-liners — always explain your naming choices and structure during live coding.",
  },
  {
    id: "e5",
    studentName: "P. Keerthana",
    branch: "CSE-AI&ML",
    company: "Accenture",
    role: "Digital Engineer",
    status: "Selected",
    difficulty: 2,
    tags: ["#OnCampus", "Accenture"],
    rounds: [
      { roundName: "Cognitive Assessment", description: "Verbal reasoning, number series, and a short coding assessment with a basic array manipulation problem." },
      { roundName: "Versant Communication Test", description: "Automated spoken English assessment reading paragraphs and answering prompts aloud." },
      { roundName: "Technical Interview", description: "Explained an academic recommendation-system mini project and wrote a simple Python function for cosine similarity." },
      { roundName: "HR Interview", description: "Discussed shift flexibility and long-term aspirations within Accenture's Advanced Technology Centers." },
    ],
    proTip: "Keep your Versant round answers structured and clear — fluency matters more than vocabulary complexity.",
  },
  {
    id: "e6",
    studentName: "V. Sathwik Reddy",
    branch: "CSE",
    company: "Deloitte",
    role: "Analyst",
    status: "Selected",
    difficulty: 4,
    tags: ["#OnCampus", "Deloitte"],
    rounds: [
      { roundName: "Online Assessment", description: "Quant and logical reasoning followed by a case-study reading comprehension on a business transformation scenario." },
      { roundName: "Group Discussion", description: "Discussed 'Is remote work sustainable for consulting firms' in a group of nine, moderated for 15 minutes." },
      { roundName: "Technical Interview", description: "SQL query writing for aggregate functions, plus basic questions on OOP and data structures used in academic projects." },
      { roundName: "Partner Interview", description: "Discussed resume projects in depth and Deloitte's core values around integrity and client service." },
    ],
    proTip: "In the GD round, prioritize being a good listener who builds on others' points — Deloitte evaluates collaboration as much as individual articulation.",
  },
  {
    id: "e7",
    studentName: "Anonymous",
    branch: "ECE",
    company: "Capgemini",
    role: "Analyst",
    status: "Not Selected",
    difficulty: 3,
    tags: ["#OnCampus", "Capgemini"],
    rounds: [
      { roundName: "Games-Based Assessment", description: "Cognitive games testing pattern recognition and numerical reasoning under a strict timer." },
      { roundName: "Pseudo-Code Test", description: "Pseudocode logic-building questions along with an English usage and comprehension section." },
      { roundName: "Technical Interview", description: "Struggled with a question on normalization in DBMS and could not fully explain 3NF with an example." },
    ],
    proTip: "Don't skip DBMS normalization even if you're from ECE — Capgemini asks it regardless of branch, so prepare core CS basics broadly.",
  },
  {
    id: "e8",
    studentName: "A. Sruthi",
    branch: "CSE",
    company: "Cognizant",
    role: "GenC Pro",
    status: "Selected",
    difficulty: 3,
    tags: ["#OnCampus", "#DataScience", "Cognizant"],
    rounds: [
      { roundName: "AMCAT-based Aptitude Test", description: "Quant, logical reasoning, verbal, and an automata round with two coding problems on string manipulation." },
      { roundName: "Technical + HR Panel", description: "Live coding a problem to reverse words in a sentence, followed by questions on a data analytics course project and HR fit questions." },
    ],
    proTip: "For GenC Pro, the bar is noticeably higher than regular GenC — practice medium-level array and string problems specifically.",
  },
  {
    id: "e9",
    studentName: "R. Deepak Reddy",
    branch: "CSE-AI&ML",
    company: "Cognizant",
    role: "GenC Pro",
    status: "Waitlisted",
    difficulty: 3,
    tags: ["#OnCampus", "#AI_ML", "Cognizant"],
    rounds: [
      { roundName: "AMCAT-based Aptitude Test", description: "Cleared quant and verbal comfortably; automata coding round had a moderately tricky recursion problem." },
      { roundName: "Technical + HR Panel", description: "Discussed a machine learning classification mini-project; panel probed deeply on overfitting and cross-validation, answer was only partially convincing." },
    ],
    proTip: "If you list an ML project on your resume, be ready to explain evaluation metrics in detail — vague answers can push you to a waitlist.",
  },
  {
    id: "e10",
    studentName: "G. Praveen",
    branch: "ECE",
    company: "TekSystems",
    role: "Associate Consultant",
    status: "Selected",
    difficulty: 2,
    tags: ["#OffCampus", "TekSystems"],
    rounds: [
      { roundName: "Aptitude & English Assessment", description: "Quantitative reasoning and business-English comprehension test conducted online, off-campus." },
      { roundName: "Technical Interview", description: "Basic programming questions in C, plus a scenario question on debugging a client's reported issue." },
      { roundName: "HR Interview", description: "Focused on adaptability to different client environments and willingness to travel for onsite consulting." },
    ],
    proTip: "TekSystems values adaptability over depth — be ready with real examples of adjusting quickly to new tools or environments.",
  },
  {
    id: "e11",
    studentName: "B. Vikram Chary",
    branch: "CSE",
    company: "EPAM Systems",
    role: "Junior Software Engineer",
    status: "Selected",
    difficulty: 5,
    tags: ["#ProductBased", "#OnCampus", "#WebDev", "EPAM Systems"],
    rounds: [
      { roundName: "Online Coding Test", description: "Implemented a trie-based autocomplete system and an OOP design question for a vehicle rental system." },
      { roundName: "Technical Interview 1", description: "Whiteboard-coded a graph coloring problem and discussed time complexity of DFS-based approaches." },
      { roundName: "Technical Interview 2", description: "System design basics for a URL shortener, including database schema and hashing strategy." },
      { roundName: "HR Interview", description: "Discussed long-term interest in backend engineering and relocation to Hyderabad or Pune offices." },
    ],
    proTip: "EPAM's second technical round often drifts into lightweight system design even for freshers — know the basics of hashing, caching, and schema design.",
  },
  {
    id: "e12",
    studentName: "N. Alekhya",
    branch: "CSE-DS",
    company: "Cognizant",
    role: "GenC",
    status: "Not Selected",
    difficulty: 2,
    tags: ["#OnCampus", "#DataScience", "Cognizant"],
    rounds: [
      { roundName: "AMCAT-based Aptitude Test", description: "Cleared the quant and verbal sections but scored low on the automata coding round due to time pressure." },
      { roundName: "Technical + HR Panel", description: "Did not get shortlisted after the aptitude cutoff; panel round was not conducted." },
    ],
    proTip: "Speed matters as much as accuracy in the automata round — do timed daily practice on basic-to-medium coding problems in the two weeks before the drive.",
  },
];
