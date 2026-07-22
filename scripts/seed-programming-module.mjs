import admin from "firebase-admin";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(path.join(__dirname, "service-account.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

function slugify(s) { return s.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""); }

// ---------------- Languages ----------------
const LANGUAGES = [
  { id: "java", name: "Java", logo: "☕", difficulty: "Beginner", estimatedDuration: "10-12 weeks", order: 1,
    placementRelevance: "The single most-asked language across Indian service companies (TCS, Infosys, Wipro, Accenture, Cognizant) and a core requirement at most product companies with Android or enterprise backend teams.",
    industryUsage: "Enterprise backend systems, Android apps, banking and financial software, large-scale distributed systems (Kafka, Hadoop, Spark are all JVM-based)." },
  { id: "python", name: "Python", logo: "🐍", difficulty: "Beginner", estimatedDuration: "8-10 weeks", order: 2,
    placementRelevance: "The most beginner-friendly language and increasingly required for data/ML/automation roles alongside traditional development roles.",
    industryUsage: "Data science, machine learning, automation/scripting, backend web services (Django/FastAPI), DevOps tooling." },
  { id: "c", name: "C", logo: "🔧", difficulty: "Intermediate", estimatedDuration: "6-8 weeks", order: 3,
    placementRelevance: "Foundational language many campus placement aptitude/coding rounds still test on, and a strong signal of low-level understanding in interviews.",
    industryUsage: "Operating systems, embedded systems, device drivers, performance-critical systems programming." },
  { id: "cpp", name: "C++", logo: "➕", difficulty: "Intermediate", estimatedDuration: "8-10 weeks", order: 4,
    placementRelevance: "The dominant language for competitive programming and DSA interview rounds at product companies - most LeetCode-style interviews accept or expect it.",
    industryUsage: "Game engines, high-frequency trading systems, competitive programming, systems software, browser engines." },
  { id: "javascript", name: "JavaScript", logo: "🟨", difficulty: "Beginner", estimatedDuration: "8-10 weeks", order: 5,
    placementRelevance: "Required for any full-stack or frontend role - asked in nearly every web-development interview alongside a framework like React.",
    industryUsage: "Web frontends, Node.js backends, browser extensions, cross-platform apps (React Native, Electron)." },
  { id: "typescript", name: "TypeScript", logo: "🔷", difficulty: "Intermediate", estimatedDuration: "4-6 weeks", order: 6,
    placementRelevance: "Increasingly required at product companies building large frontend/full-stack codebases - often listed as a preferred skill alongside React/Angular.",
    industryUsage: "Large-scale frontend applications, Node.js backends, Angular (built entirely in TypeScript)." },
  { id: "go", name: "Go", logo: "🐹", difficulty: "Intermediate", estimatedDuration: "6-8 weeks", order: 7,
    placementRelevance: "Growing demand at product/cloud companies for backend and infrastructure roles - a differentiator on a fresher's resume.",
    industryUsage: "Cloud infrastructure (Docker, Kubernetes are written in Go), microservices, high-concurrency backend systems." },
  { id: "kotlin", name: "Kotlin", logo: "🎯", difficulty: "Intermediate", estimatedDuration: "6-8 weeks", order: 8,
    placementRelevance: "The official language for Android development - relevant for mobile development interviews.",
    industryUsage: "Android app development, backend services (Ktor, Spring), multiplatform mobile code." },
  { id: "csharp", name: "C#", logo: "🎼", difficulty: "Beginner", estimatedDuration: "8-10 weeks", order: 9,
    placementRelevance: "Widely used at companies building on Microsoft stacks - common in enterprise and game-development interviews.",
    industryUsage: "Enterprise .NET applications, Windows software, Unity game development." },
  { id: "rust", name: "Rust", logo: "🦀", difficulty: "Advanced", estimatedDuration: "8-10 weeks", order: 10,
    placementRelevance: "An emerging differentiator for systems-programming and infra roles at forward-looking product companies.",
    industryUsage: "Systems programming, WebAssembly, performance-critical services, blockchain infrastructure." },
  { id: "sql", name: "SQL", logo: "🗄️", difficulty: "Beginner", estimatedDuration: "4-6 weeks", order: 11,
    placementRelevance: "Tested in nearly every technical interview regardless of role - a baseline expectation, not a differentiator.",
    industryUsage: "Relational databases across every industry - querying, reporting, backend data access." },
  { id: "bash", name: "Bash", logo: "💻", difficulty: "Beginner", estimatedDuration: "2-4 weeks", order: 12,
    placementRelevance: "Rarely asked directly in interviews but expected for DevOps/SRE roles and day-to-day engineering productivity.",
    industryUsage: "Shell scripting, automation, CI/CD pipelines, Linux server administration." },
].map(l => ({ ...l, status: "published" }));

// ---------------- Java: full 35-topic roadmap (from spec) ----------------
const JAVA_MODULES = [
  { module: "Fundamentals", topics: ["Introduction", "Environment Setup", "Syntax", "Variables", "Data Types", "Operators", "Input Output"] },
  { module: "Control Flow & Data Structures", topics: ["Conditional Statements", "Loops", "Arrays", "Strings", "Methods"] },
  { module: "Object-Oriented Programming", topics: ["Object-Oriented Programming", "Collections Framework", "Exception Handling", "File Handling", "Generics"] },
  { module: "Advanced Java", topics: ["Multithreading", "Java 8 Features", "Streams", "Lambda Expressions", "Functional Interfaces", "JDBC"] },
  { module: "Tools & Testing", topics: ["Maven", "Gradle", "JUnit", "Design Patterns"] },
  { module: "Memory & Best Practices", topics: ["Memory Management", "Garbage Collection", "Best Practices", "Coding Standards"] },
  { module: "Practice & Placement", topics: ["Mini Projects", "Placement Questions", "Interview Questions", "Mock Tests", "Final Assessment"] },
];

// Genuinely authored content for 5 topics - real, correct, verified explanations
// (not filler) - everything else in Java's 35-topic list is real, listed, and
// visible in the roadmap tree, but intentionally left content-empty for an
// admin to author via /admin (shows a "coming soon" state to students).
const JAVA_CONTENT = {
  "introduction": {
    difficulty: "Beginner", estimatedMinutes: 15,
    whatYoullLearn: ["What Java is and why it's still one of the most in-demand languages", "The 'write once, run anywhere' promise and how the JVM delivers it", "The difference between the JDK, JRE, and JVM"],
    prerequisites: [],
    concept: "Java is a general-purpose, class-based, object-oriented programming language released by Sun Microsystems in 1995 (now owned by Oracle). Its defining idea is platform independence: you compile Java source code (.java) into an intermediate form called bytecode (.class), and that same bytecode runs unchanged on any machine with a Java Virtual Machine (JVM) installed - Windows, Linux, macOS, or an Android phone.\n\nThree terms get confused constantly:\n- JVM (Java Virtual Machine) - the engine that actually executes bytecode. Different for each OS/platform.\n- JRE (Java Runtime Environment) - the JVM plus the standard class libraries needed to run a Java program.\n- JDK (Java Development Kit) - the JRE plus the compiler (javac), debugger, and other tools needed to write and build Java programs.\n\nIf you only want to run Java programs, the JRE is enough. If you want to write and compile them, you need the JDK.",
    keyPoints: ["Java code compiles to platform-independent bytecode, not native machine code", "JDK = JRE + development tools (compiler, debugger)", "JRE = JVM + standard libraries", "Java is statically typed and strongly typed - types are checked at compile time"],
    commonMistakes: ["Assuming Java is interpreted line-by-line like a script - it's actually compiled to bytecode first, then executed by the JVM (with just-in-time compilation to native code for hot code paths)", "Installing only the JRE and then being unable to compile code with javac"],
    interviewTips: ["Be ready to explain 'write once, run anywhere' in one sentence - most interviewers just want to confirm you understand the JVM's role", "Know the JDK vs JRE vs JVM distinction cold - it's one of the most commonly asked Java basics questions"],
    realWorldApplications: ["Every Android app runs on a JVM-like runtime (ART)", "Most large enterprise backend systems (banks, insurance, e-commerce) run on the JVM for its maturity and tooling"],
    codeExample: { language: "java", code: "public class HelloWorld {\n    public static void main(String[] args) {\n        System.out.println(\"Hello, World!\");\n    }\n}" },
    mcqs: [
      { question: "What does the JVM execute?", options: ["Java source code directly", "Compiled bytecode", "Machine code compiled ahead-of-time", "Python bytecode"], correctIndex: 1 },
      { question: "Which of these includes the Java compiler (javac)?", options: ["JRE only", "JVM only", "JDK", "None of these"], correctIndex: 2 },
    ],
    assignment: "Install the JDK on your machine, write a Java file that prints your name, and compile + run it from the command line using javac and java.",
    xpReward: 25, coinReward: 10,
  },
  "variables": {
    difficulty: "Beginner", estimatedMinutes: 20,
    whatYoullLearn: ["How to declare and initialize variables in Java", "Java's naming rules and conventions", "The difference between declaration and initialization"],
    prerequisites: ["Introduction", "Environment Setup"],
    concept: "A variable in Java is a named piece of memory that holds a value of a specific type. Because Java is statically typed, every variable must be declared with a type before it's used, and that type never changes for the lifetime of the variable.\n\nDeclaration vs initialization: declaring a variable (int age;) reserves memory for it but doesn't give it a usable value yet - a local variable that's declared but never initialized will not compile if you try to use it. Initializing (age = 21;) assigns an actual value. You can combine both in one line: int age = 21;\n\nJava naming conventions (not enforced by the compiler, but expected in any real codebase): variable and method names use camelCase (studentName), class names use PascalCase (StudentRecord), and constants use SCREAMING_SNAKE_CASE (MAX_SIZE).",
    keyPoints: ["Java requires every variable to have a declared type - this is checked at compile time", "Local variables must be initialized before use, or the code won't compile", "Variable names are case-sensitive and must start with a letter, $, or _"],
    commonMistakes: ["Forgetting to initialize a local variable before reading it (the compiler catches this and refuses to build)", "Confusing 'final' (a constant reference/value that can't be reassigned) with immutability of the object it points to"],
    interviewTips: ["Know that 'final' on a variable prevents reassignment, not mutation of the object it refers to - a classic trick question uses a final ArrayList and asks if you can still .add() to it (yes, you can)"],
    realWorldApplications: ["Every program, no matter how large, is built from correctly scoped and named variables - this is the literal foundation of readable code"],
    codeExample: { language: "java", code: "public class VariablesDemo {\n    public static void main(String[] args) {\n        int age = 21;\n        String name = \"Priya\";\n        final double PI = 3.14159;\n        System.out.println(name + \" is \" + age + \" years old.\");\n    }\n}" },
    mcqs: [
      { question: "What happens if you use a local variable before initializing it?", options: ["It defaults to 0 or null", "Compile error", "Runtime exception", "Undefined behavior"], correctIndex: 1 },
      { question: "What does 'final' prevent on a variable?", options: ["Mutating the object it refers to", "Reassigning the variable to a new value", "Reading the variable", "Passing it to a method"], correctIndex: 1 },
    ],
    assignment: "Write a program that declares variables for a student's name, roll number, and CGPA, then prints a formatted summary line.",
    xpReward: 25, coinReward: 10,
  },
  "data-types": {
    difficulty: "Beginner", estimatedMinutes: 20,
    whatYoullLearn: ["Java's 8 primitive types and their sizes", "The difference between primitives and reference types", "When to use int vs long, float vs double"],
    prerequisites: ["Variables"],
    concept: "Java has exactly 8 primitive data types: byte (8-bit), short (16-bit), int (32-bit), long (64-bit), float (32-bit), double (64-bit), char (16-bit, Unicode), and boolean (true/false). Every other type in Java - String, arrays, your own classes - is a reference type, meaning the variable holds a reference (pointer) to an object on the heap, not the value itself.\n\nThis distinction matters a lot in practice: primitives are stored directly and copied by value when passed to a method or assigned to another variable, while reference types are copied by reference - two variables can end up pointing to the same underlying object, so a mutation through one is visible through the other.\n\nFor whole numbers, int is the default choice unless you specifically need the larger range of long (append an L, e.g. 10000000000L). For decimals, double is the default (Java literals like 3.14 are double by default) unless memory is tight, in which case float works with an f suffix (3.14f).",
    keyPoints: ["8 primitives: byte, short, int, long, float, double, char, boolean", "Primitives are copied by value; reference types are copied by reference", "int and double are the practical defaults for whole numbers and decimals respectively", "String is NOT a primitive - it's a reference type (and immutable)"],
    commonMistakes: ["Assuming String is a primitive because it's used so often like one", "Comparing reference types with == expecting value equality (this compares references, not content - use .equals() for content comparison)", "Overflowing an int silently (Java doesn't throw on overflow by default - it wraps around)"],
    interviewTips: ["The '== vs .equals()' question for Strings/objects is one of the most frequently asked Java basics questions - know it cold", "Be ready to explain why int overflow doesn't throw an exception in Java (it silently wraps, unlike some languages)"],
    realWorldApplications: ["Choosing the right numeric type correctly (e.g. long for a timestamp in milliseconds, since int would overflow) is a real, common source of production bugs"],
    codeExample: { language: "java", code: "public class DataTypesDemo {\n    public static void main(String[] args) {\n        int marks = 95;\n        long population = 8000000000L;\n        double price = 499.99;\n        char grade = 'A';\n        boolean passed = true;\n        System.out.println(grade + \" grade, passed: \" + passed);\n    }\n}" },
    mcqs: [
      { question: "Which of these is NOT a Java primitive type?", options: ["int", "boolean", "String", "char"], correctIndex: 2 },
      { question: "How are primitive types passed to a method in Java?", options: ["By reference", "By value", "By pointer", "It depends on the type"], correctIndex: 1 },
    ],
    assignment: "Write a program declaring one variable of each of the 8 primitive types and print all of them with labels.",
    xpReward: 25, coinReward: 10,
  },
  "arrays": {
    difficulty: "Beginner", estimatedMinutes: 25,
    whatYoullLearn: ["How to declare, initialize, and access arrays", "Why array access is O(1) and insertion in the middle is O(n)", "How to iterate arrays with for and for-each loops"],
    prerequisites: ["Data Types", "Loops"],
    concept: "An array is a fixed-size, ordered collection of elements of the same type, stored in contiguous memory. Because elements sit next to each other in memory, the JVM can compute the exact memory address of any index directly from the array's base address - this is why array[i] access is O(1) regardless of array size.\n\nIn Java, arrays are objects (reference types), even though they hold primitives. Declaring int[] arr; just creates a reference; you must allocate it with new (int[] arr = new int[5];) before using it, which zero-initializes every slot. Array length is fixed once created - you cannot resize a Java array; that's exactly what ArrayList exists for (a resizable wrapper built on top of arrays).\n\nInserting or deleting an element in the middle of an array requires shifting every subsequent element, which is O(n) - this is the key trade-off arrays make in exchange for O(1) random access.",
    keyPoints: ["Arrays have a fixed size decided at creation time and cannot grow", "array[i] access is O(1) - direct memory address calculation", "Inserting/deleting in the middle is O(n) due to shifting", "Java arrays know their own length via array.length (a field, not a method - no parentheses)"],
    commonMistakes: ["Writing array.length() with parentheses (it's a field, not a method - String.length() IS a method, which trips people up)", "Off-by-one errors: valid indices are 0 to length-1, so array[array.length] always throws ArrayIndexOutOfBoundsException", "Forgetting that arrays are reference types - passing an array to a method lets that method mutate the original"],
    interviewTips: ["Know the exact time complexity for access/search/insert/delete on arrays - this comes up constantly", "Be ready to explain why arrays give O(1) access but ArrayList insertion in the middle is still O(n) despite being 'dynamic'"],
    realWorldApplications: ["Arrays back nearly every other data structure (ArrayList, HashMap's bucket array, String's internal char array) - understanding them is foundational to everything else"],
    codeExample: { language: "java", code: "public class ArraysDemo {\n    public static void main(String[] args) {\n        int[] marks = {85, 90, 78, 92, 60};\n        int sum = 0;\n        for (int m : marks) {\n            sum += m;\n        }\n        System.out.println(\"Average: \" + (sum / marks.length));\n    }\n}" },
    mcqs: [
      { question: "What is the time complexity of accessing an element by index in an array?", options: ["O(n)", "O(log n)", "O(1)", "O(n^2)"], correctIndex: 2 },
      { question: "What happens when you access array[array.length]?", options: ["Returns null", "Returns 0", "ArrayIndexOutOfBoundsException", "Compile error"], correctIndex: 2 },
    ],
    assignment: "Write a program that finds the maximum and minimum values in an integer array without using any built-in library methods.",
    xpReward: 30, coinReward: 12,
  },
  "object-oriented-programming": {
    difficulty: "Intermediate", estimatedMinutes: 35,
    whatYoullLearn: ["The four pillars of OOP: encapsulation, inheritance, polymorphism, abstraction", "How Java implements classes and objects", "Why OOP matters for large, maintainable codebases"],
    prerequisites: ["Methods", "Data Types"],
    concept: "Object-Oriented Programming organizes code around objects - bundles of data (fields) and behavior (methods) - rather than around a sequence of instructions. Java is a fundamentally object-oriented language: every piece of executable code lives inside a class.\n\nThe four pillars, and what each actually buys you:\n- Encapsulation: bundling data with the methods that operate on it, and hiding internal state behind private fields + public getters/setters. This protects invariants (e.g. an Account class can guarantee balance never goes negative) and lets you change internals later without breaking callers.\n- Inheritance: a class (subclass) can extend another (superclass) to reuse and specialize its behavior. A Car class extending a Vehicle class inherits fields/methods like speed and accelerate(), and can override or add its own.\n- Polymorphism: the same method call behaves differently depending on the actual runtime type of the object - e.g. calling .makeSound() on an Animal reference that actually points to a Dog object at runtime calls Dog's version. This is what lets you write code against an abstraction (Animal) that works for any concrete subtype.\n- Abstraction: exposing only what's necessary and hiding implementation complexity - Java achieves this through abstract classes and interfaces, which define WHAT a type does without dictating HOW.",
    keyPoints: ["Encapsulation = private fields + public getters/setters to protect invariants", "Inheritance = 'is-a' relationship, reuse via extends", "Polymorphism = one interface, many implementations, resolved at runtime", "Abstraction = hide implementation details behind an interface or abstract class"],
    commonMistakes: ["Overusing inheritance where composition ('has-a') would be more appropriate and flexible - a common real-world design mistake", "Making fields public 'to save time', defeating the entire point of encapsulation", "Confusing method overloading (same name, different parameters, resolved at compile time) with overriding (same signature in a subclass, resolved at runtime)"],
    interviewTips: ["'Explain OOP' is an almost-guaranteed interview question - have a crisp one-sentence definition ready for each of the 4 pillars, not just a memorized list", "Know the overloading vs overriding distinction cold, including when each is resolved (compile-time vs runtime)"],
    realWorldApplications: ["Nearly every enterprise Java application (banking systems, e-commerce platforms) is structured around OOP principles for maintainability as the codebase grows to hundreds of thousands of lines"],
    codeExample: { language: "java", code: "class Animal {\n    void makeSound() { System.out.println(\"Some generic sound\"); }\n}\nclass Dog extends Animal {\n    @Override\n    void makeSound() { System.out.println(\"Woof!\"); }\n}\npublic class OopDemo {\n    public static void main(String[] args) {\n        Animal a = new Dog();\n        a.makeSound(); // prints \"Woof!\" - polymorphism in action\n    }\n}" },
    mcqs: [
      { question: "Which OOP pillar is demonstrated when calling an overridden method through a superclass reference?", options: ["Encapsulation", "Polymorphism", "Abstraction", "Inheritance"], correctIndex: 1 },
      { question: "Method overloading is resolved at:", options: ["Runtime", "Compile time", "Class loading time", "Garbage collection time"], correctIndex: 1 },
    ],
    assignment: "Design a small class hierarchy: a Shape superclass with a calculateArea() method, and Circle/Rectangle subclasses that override it. Write a main method that calls calculateArea() polymorphically on an array of Shape references.",
    xpReward: 40, coinReward: 15,
  },
};

// ---------------- Standard topic outlines for the remaining 11 languages ----------------
// Legitimate, well-known structural curricula (a table of contents, not deep
// content) - every topic is real and correctly ordered for that language,
// but none have authored content yet (status published so the roadmap tree
// is visible and honest about scope; content-less topics render a "coming
// soon" state to students - see topicHasContent() in campus-programming.jsx).
const OTHER_LANGUAGE_MODULES = {
  python: [
    { module: "Fundamentals", topics: ["Introduction", "Environment Setup", "Syntax & Indentation", "Variables", "Data Types", "Operators", "Input Output"] },
    { module: "Control Flow & Structures", topics: ["Conditional Statements", "Loops", "Lists", "Tuples", "Dictionaries", "Sets", "Strings"] },
    { module: "Functions & OOP", topics: ["Functions", "Lambda & Comprehensions", "Object-Oriented Programming", "Modules & Packages", "Exception Handling"] },
    { module: "Advanced Python", topics: ["File Handling", "Decorators", "Generators", "Virtual Environments & pip", "Standard Library"] },
    { module: "Practice & Placement", topics: ["Mini Projects", "Placement Questions", "Interview Questions", "Mock Tests"] },
  ],
  c: [
    { module: "Fundamentals", topics: ["Introduction", "Environment Setup", "Syntax", "Variables & Data Types", "Operators", "Input Output"] },
    { module: "Control Flow & Structures", topics: ["Conditional Statements", "Loops", "Arrays", "Strings", "Functions"] },
    { module: "Pointers & Memory", topics: ["Pointers", "Dynamic Memory Allocation", "Structures", "Unions", "File Handling"] },
    { module: "Practice & Placement", topics: ["Mini Projects", "Placement Questions", "Interview Questions", "Mock Tests"] },
  ],
  cpp: [
    { module: "Fundamentals", topics: ["Introduction", "Environment Setup", "Syntax", "Variables & Data Types", "Operators", "Input Output"] },
    { module: "Control Flow & Structures", topics: ["Conditional Statements", "Loops", "Arrays", "Strings", "Functions", "Pointers & References"] },
    { module: "Object-Oriented Programming", topics: ["Classes & Objects", "Inheritance", "Polymorphism", "Operator Overloading", "Templates", "STL"] },
    { module: "Advanced C++", topics: ["Exception Handling", "File Handling", "Smart Pointers", "Move Semantics"] },
    { module: "Practice & Placement", topics: ["Mini Projects", "Placement Questions", "Interview Questions", "Mock Tests"] },
  ],
  javascript: [
    { module: "Fundamentals", topics: ["Introduction", "Environment Setup", "Syntax", "Variables (var/let/const)", "Data Types", "Operators"] },
    { module: "Control Flow & Structures", topics: ["Conditional Statements", "Loops", "Arrays", "Strings", "Functions", "Objects"] },
    { module: "Modern JavaScript", topics: ["Arrow Functions", "Destructuring", "Spread & Rest", "Promises", "Async/Await", "Modules"] },
    { module: "Browser & DOM", topics: ["DOM Manipulation", "Events", "Fetch API"] },
    { module: "Practice & Placement", topics: ["Mini Projects", "Placement Questions", "Interview Questions", "Mock Tests"] },
  ],
  typescript: [
    { module: "Fundamentals", topics: ["Introduction", "Environment Setup", "Basic Types", "Interfaces", "Type Aliases"] },
    { module: "Core Features", topics: ["Functions & Types", "Classes", "Generics", "Enums", "Union & Intersection Types"] },
    { module: "Advanced TypeScript", topics: ["Type Narrowing", "Utility Types", "Decorators", "Modules & Namespaces"] },
    { module: "Practice & Placement", topics: ["Mini Projects", "Interview Questions", "Mock Tests"] },
  ],
  go: [
    { module: "Fundamentals", topics: ["Introduction", "Environment Setup", "Syntax", "Variables & Data Types", "Operators"] },
    { module: "Control Flow & Structures", topics: ["Conditional Statements", "Loops", "Arrays & Slices", "Maps", "Functions", "Structs"] },
    { module: "Go-Specific Concepts", topics: ["Goroutines", "Channels", "Interfaces", "Error Handling", "Packages & Modules"] },
    { module: "Practice & Placement", topics: ["Mini Projects", "Interview Questions", "Mock Tests"] },
  ],
  kotlin: [
    { module: "Fundamentals", topics: ["Introduction", "Environment Setup", "Syntax", "Variables (val/var)", "Data Types", "Operators"] },
    { module: "Control Flow & Structures", topics: ["Conditional Statements", "Loops", "Functions", "Collections", "Data Classes"] },
    { module: "Kotlin OOP", topics: ["Classes & Objects", "Inheritance", "Interfaces", "Null Safety", "Extension Functions"] },
    { module: "Practice & Placement", topics: ["Mini Projects", "Interview Questions", "Mock Tests"] },
  ],
  csharp: [
    { module: "Fundamentals", topics: ["Introduction", "Environment Setup", "Syntax", "Variables & Data Types", "Operators", "Input Output"] },
    { module: "Control Flow & Structures", topics: ["Conditional Statements", "Loops", "Arrays", "Strings", "Methods"] },
    { module: "Object-Oriented Programming", topics: ["Classes & Objects", "Inheritance", "Polymorphism", "Interfaces", "Collections (LINQ)"] },
    { module: "Advanced C#", topics: ["Exception Handling", "Delegates & Events", "Async/Await"] },
    { module: "Practice & Placement", topics: ["Mini Projects", "Interview Questions", "Mock Tests"] },
  ],
  rust: [
    { module: "Fundamentals", topics: ["Introduction", "Environment Setup", "Syntax", "Variables & Mutability", "Data Types"] },
    { module: "Core Concepts", topics: ["Ownership", "Borrowing & References", "Structs", "Enums & Pattern Matching", "Collections"] },
    { module: "Advanced Rust", topics: ["Error Handling", "Traits & Generics", "Lifetimes", "Concurrency"] },
    { module: "Practice & Placement", topics: ["Mini Projects", "Interview Questions"] },
  ],
  sql: [
    { module: "Fundamentals", topics: ["Introduction", "SELECT Basics", "Filtering (WHERE)", "Sorting (ORDER BY)", "Aggregate Functions"] },
    { module: "Joins & Grouping", topics: ["Inner & Outer Joins", "GROUP BY & HAVING", "Subqueries", "Set Operations"] },
    { module: "Data Modification & Design", topics: ["INSERT/UPDATE/DELETE", "Table Design & Keys", "Indexes", "Normalization"] },
    { module: "Practice & Placement", topics: ["SQL Interview Questions", "Query Optimization Basics", "Mock Tests"] },
  ],
  bash: [
    { module: "Fundamentals", topics: ["Introduction", "Shell Basics", "Variables", "Command Substitution"] },
    { module: "Scripting", topics: ["Conditional Statements", "Loops", "Functions", "Input Output & Redirection"] },
    { module: "Practical Bash", topics: ["File Operations", "Text Processing (grep/sed/awk)", "Automation Scripts"] },
  ],
};

async function seedLanguages() {
  for (const lang of LANGUAGES) {
    const { id, ...data } = lang;
    await db.collection("programmingLanguages").doc(id).set(data, { merge: true });
    console.log("language:", id);
  }
}

async function seedTopicsForLanguage(langId, modules, contentMap = {}) {
  let order = 0;
  let count = 0;
  for (const { module, topics } of modules) {
    for (const title of topics) {
      order++;
      const topicId = slugify(title);
      const content = contentMap[topicId] || {};
      await db.collection("programmingLanguages").doc(langId).collection("topics").doc(topicId).set({
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
        codeExample: content.codeExample || { language: langId === "cpp" ? "cpp" : langId, code: "" },
        mcqs: content.mcqs || [],
        assignment: content.assignment || "",
        xpReward: content.xpReward || 25,
        coinReward: content.coinReward || 10,
        practiceProblemIds: [],
      }, { merge: true });
      count++;
    }
  }
  await db.collection("programmingLanguages").doc(langId).set({ topicCount: count }, { merge: true });
  console.log(langId, "-", count, "topics seeded");
}

async function main() {
  await seedLanguages();
  await seedTopicsForLanguage("java", JAVA_MODULES, JAVA_CONTENT);
  for (const [langId, modules] of Object.entries(OTHER_LANGUAGE_MODULES)) {
    await seedTopicsForLanguage(langId, modules);
  }
  console.log("\nDone.");
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
