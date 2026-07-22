import admin from "firebase-admin";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(path.join(__dirname, "service-account.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const PYTHON_CONTENT = {
  "introduction": {
    difficulty: "Beginner", estimatedMinutes: 15,
    whatYoullLearn: ["What Python is and why it's used so widely", "The difference between an interpreted and a compiled language", "How Python code actually gets executed (CPython, bytecode, the PVM)"],
    prerequisites: [],
    concept: "Python is a high-level, interpreted, general-purpose programming language created by Guido van Rossum and first released in 1991. Its design philosophy prioritizes code readability - Python code tends to read almost like structured English, using indentation instead of braces to define blocks.\n\n'Interpreted' doesn't mean Python skips compilation entirely: the reference implementation (CPython, the one you install from python.org) compiles your .py source into an intermediate bytecode (.pyc) the first time it's imported, then the Python Virtual Machine (PVM) executes that bytecode line by line. This is different from Java (compiles to bytecode, then a JIT compiler in the JVM optimizes hot paths to native code) and from C (compiles all the way to native machine code ahead of time). Because Python resolves types and interprets bytecode at runtime, it's generally slower than compiled languages for raw computation, but this trade-off buys enormous productivity - concise syntax, dynamic typing, and one of the largest library ecosystems (PyPI) of any language.",
    keyPoints: ["Python is interpreted via CPython -> bytecode -> PVM, not compiled directly to machine code", "Indentation is syntactically significant in Python - it replaces braces for defining blocks", "Python is dynamically typed - a variable's type is determined at runtime, not declared upfront"],
    commonMistakes: ["Mixing tabs and spaces for indentation in the same file - this is a real syntax error in Python 3, not just a style issue", "Assuming Python has no compilation step at all - CPython does compile to bytecode, it just does so transparently"],
    interviewTips: ["Be ready to explain why Python is generally slower than Java/C++ for CPU-bound work (interpretation overhead, dynamic typing) despite being competitive or faster to develop in", "Know that 'Python' the language has multiple implementations - CPython (the standard, C-based), PyPy (JIT-compiled, faster for long-running code), Jython (runs on the JVM)"],
    realWorldApplications: ["Instagram, Spotify, and Dropbox all run substantial parts of their backend in Python", "Nearly the entire modern machine learning ecosystem (PyTorch, TensorFlow, scikit-learn) is Python-first"],
    codeExample: { language: "python", code: "print(\"Hello, World!\")\n\n# Indentation defines this function's body - no braces needed\ndef greet(name):\n    return f\"Hello, {name}!\"\n\nprint(greet(\"Priya\"))" },
    mcqs: [
      { question: "What does CPython compile Python source code into before execution?", options: ["Native machine code", "Bytecode, run by the PVM", "Assembly language", "It doesn't compile at all"], correctIndex: 1 },
      { question: "What defines a code block in Python instead of braces?", options: ["Semicolons", "Parentheses", "Indentation", "The 'begin'/'end' keywords"], correctIndex: 2 },
    ],
    assignment: "Write a Python script that defines a function to calculate the area of a rectangle, then calls it with two different sets of dimensions and prints both results.",
    xpReward: 25, coinReward: 10,
  },
  "variables": {
    difficulty: "Beginner", estimatedMinutes: 20,
    whatYoullLearn: ["How variable assignment works in Python (no type declaration needed)", "Python's naming rules and PEP 8 conventions", "What 'dynamic typing' actually means in practice"],
    prerequisites: ["Introduction"],
    concept: "In Python, you create a variable simply by assigning a value to a name - there's no separate declaration step and no type keyword: age = 21 both creates the variable and gives it a value in one step. This is because Python is dynamically typed: the variable name is really just a label (a reference) pointing to an object in memory, and that object carries its own type information - the variable itself has no fixed type and can be reassigned to a completely different type later (age = 21 then age = \"twenty-one\" is perfectly legal, even if it's poor practice).\n\nThis is fundamentally different from Java's static typing, where int age = 21; permanently fixes age's type at compile time. Python's approach trades some compile-time safety for flexibility and speed of writing code - a trade-off often mitigated in larger codebases using type hints (age: int = 21) which tools like mypy can check, though Python itself doesn't enforce them at runtime.\n\nNaming conventions (PEP 8, the official style guide): variables and functions use snake_case (student_name), classes use PascalCase (StudentRecord), and constants use SCREAMING_SNAKE_CASE (MAX_SIZE) - by convention only, since Python has no true constant keyword.",
    keyPoints: ["Assignment creates a variable - no separate declaration or type keyword needed", "A variable is a reference to an object; the object has a type, not the variable itself", "PEP 8 is Python's official style guide: snake_case for variables/functions, PascalCase for classes"],
    commonMistakes: ["Assuming Python variables have a fixed type like in Java/C - reassigning to a different type is legal (though often a code smell)", "Ignoring type hints entirely in larger projects, making it harder for tools and other developers to reason about expected types"],
    interviewTips: ["Be ready to explain 'everything in Python is an object' - even integers and functions are objects with their own identity (id()), type (type()), and methods", "Know what type hints are and that they're optional, unenforced annotations - not real static typing"],
    realWorldApplications: ["Type hints (PEP 484) are now standard practice in most professional/production Python codebases specifically to recover some of the safety static typing provides"],
    codeExample: { language: "python", code: "age = 21          # int\nname = \"Priya\"    # str\nage = \"twenty-one\"  # legal, but usually poor practice\n\n# With a type hint (not enforced at runtime, but checkable by mypy)\ncgpa: float = 8.7" },
    mcqs: [
      { question: "What determines a variable's type in Python?", options: ["The keyword used to declare it", "The object it currently references", "Its name", "The file it's declared in"], correctIndex: 1 },
      { question: "What is Python's official style guide called?", options: ["PEP 8", "ES6", "RFC 20", "PSR-1"], correctIndex: 0 },
    ],
    assignment: "Write a program with variables for a product's name, price, and in-stock status, then reassign the price variable and print both values with labels.",
    xpReward: 25, coinReward: 10,
  },
  "data-types": {
    difficulty: "Beginner", estimatedMinutes: 20,
    whatYoullLearn: ["Python's built-in core types: int, float, str, bool, None", "The difference between mutable and immutable types", "How to check and convert between types"],
    prerequisites: ["Variables"],
    concept: "Python's core built-in types are int (arbitrary-precision integers - Python ints don't overflow like fixed-size int in C/Java), float (double-precision decimals), str (immutable sequences of Unicode characters), bool (True/False, actually a subclass of int where True == 1), and None (Python's null - the single instance representing 'no value').\n\nA crucial distinction that trips up beginners coming from other languages: mutability. Immutable types (int, float, str, tuple, bool) can never be changed in place - any operation that looks like modification (e.g. s = s + \"!\") actually creates a brand new object and rebinds the variable to it. Mutable types (list, dict, set) CAN be changed in place - append()ing to a list modifies the same object every other reference to it sees.\n\nYou can check a value's type with type(x) or isinstance(x, int) (the latter is generally preferred since it correctly handles inheritance), and convert between types explicitly with int(\"42\"), str(42), float(\"3.14\"), etc. - Python will raise a ValueError if the conversion isn't sensible (e.g. int(\"abc\")).",
    keyPoints: ["Python ints have arbitrary precision - they never overflow the way fixed-size integers do in C/Java", "str, int, float, tuple, and bool are immutable; list, dict, and set are mutable", "isinstance() is generally preferred over type() for type checks since it respects inheritance"],
    commonMistakes: ["Assuming string concatenation modifies the original string in place - strings are immutable, so s += \"x\" creates a new string object", "Using a mutable default argument (def f(items=[])) - since default arguments are evaluated once, this shared list persists and accumulates across calls, a very common real bug", "Forgetting that bool is a subclass of int, so True + True == 2 is valid and evaluates to 2"],
    interviewTips: ["The 'mutable default argument' gotcha (def f(x=[])) is an extremely common Python interview/code-review question - know why it happens and how to fix it (use None as the default, then create the list inside the function)", "Be ready to explain immutability with a concrete example, not just define it"],
    realWorldApplications: ["Understanding mutability is essential for avoiding subtle bugs when passing lists/dicts between functions - a very common real-world source of 'why did this data change unexpectedly' bugs"],
    codeExample: { language: "python", code: "x = 10          # int\ny = 3.14        # float\nname = \"Priya\"  # str (immutable)\nis_valid = True # bool\n\nnums = [1, 2, 3]  # list (mutable)\nnums.append(4)    # modifies the SAME list object\nprint(nums)       # [1, 2, 3, 4]" },
    mcqs: [
      { question: "Which of these Python types is mutable?", options: ["str", "tuple", "list", "int"], correctIndex: 2 },
      { question: "What happens when you do s += \"!\" on a string s?", options: ["Modifies the string in place", "Creates a new string object and rebinds s to it", "Raises an error", "Appends to a shared buffer"], correctIndex: 1 },
    ],
    assignment: "Write a function that demonstrates the mutable default argument bug (a list default that accumulates across calls), then fix it using None as the default.",
    xpReward: 25, coinReward: 10,
  },
  "lists": {
    difficulty: "Beginner", estimatedMinutes: 25,
    whatYoullLearn: ["How to create, index, and slice Python lists", "Common list operations and their time complexity", "The difference between a list and Python's other sequence types"],
    prerequisites: ["Data Types"],
    concept: "A Python list is a mutable, ordered, dynamically-resizable sequence that can hold elements of any (even mixed) type: nums = [1, 2, 3], mixed = [1, \"two\", 3.0]. Internally, CPython implements a list as a dynamic array (similar to Java's ArrayList or C++'s std::vector) - it's over-allocated with some spare capacity so that appending is amortized O(1) rather than needing to resize on every single append.\n\nIndexing (list[0]) and length (len(list)) are O(1). Appending to the end (list.append(x)) is amortized O(1). But inserting or deleting at the front or middle (list.insert(0, x), list.pop(0)) is O(n), since every subsequent element must shift.\n\nSlicing is one of Python's most distinctive list features: list[1:3] returns a NEW list containing elements from index 1 up to (but not including) index 3; list[::-1] reverses a list; list[:5] takes the first 5 elements. Slicing always returns a new list (a copy), never a view into the original - an important distinction from something like NumPy arrays, where slices ARE views.",
    keyPoints: ["Lists are mutable, ordered, and can hold mixed types", "Indexing/length is O(1); appending to the end is amortized O(1); inserting/deleting at the front is O(n)", "Slicing (list[a:b]) always returns a new list, not a view into the original"],
    commonMistakes: ["Using list.insert(0, x) or list.pop(0) in a loop without realizing each call is O(n) - this silently turns an intended O(n) algorithm into O(n^2)", "Assuming a slice is a view (like in NumPy) - list slicing always copies", "Copying a list with new_list = old_list (this just creates a second reference to the SAME list - use old_list.copy() or old_list[:] for a real copy)"],
    interviewTips: ["Know the time complexity of every common list operation cold - append, insert(0,...), pop(), pop(0), and indexing are all fair game", "Be ready to explain why new_list = old_list doesn't actually copy anything - a very common real bug for beginners"],
    realWorldApplications: ["Lists back an enormous amount of everyday Python code - anywhere you need an ordered, resizable collection without the strict type constraints of, say, a NumPy array"],
    codeExample: { language: "python", code: "nums = [10, 20, 30, 40, 50]\nprint(nums[1:3])    # [20, 30] - a new list\nprint(nums[::-1])   # [50, 40, 30, 20, 10] - reversed copy\n\nnums.append(60)     # O(1) amortized\nnums.insert(0, 5)   # O(n) - shifts everything right\nprint(nums)" },
    mcqs: [
      { question: "What is the time complexity of list.append(x)?", options: ["O(n)", "Amortized O(1)", "O(log n)", "O(n^2)"], correctIndex: 1 },
      { question: "What does list[1:3] return?", options: ["A view into the original list", "A new list with elements at index 1 and 2", "A new list with elements at index 1, 2, and 3", "A single element"], correctIndex: 1 },
    ],
    assignment: "Write a function that takes a list of numbers and returns a new list with duplicates removed, preserving the original order (without using set(), since that doesn't preserve order).",
    xpReward: 30, coinReward: 12,
  },
  "functions": {
    difficulty: "Beginner", estimatedMinutes: 25,
    whatYoullLearn: ["How to define and call functions with def", "Default arguments, *args, and **kwargs", "The difference between positional and keyword arguments"],
    prerequisites: ["Conditional Statements", "Loops"],
    concept: "A function in Python is defined with def, groups a block of reusable code under a name, and can accept parameters and return a value with return (a function with no return statement implicitly returns None). Python functions support several parameter styles that make them notably flexible compared to many other languages:\n\n- Default arguments: def greet(name, greeting=\"Hello\") lets callers omit greeting and get a sensible default.\n- *args collects any number of extra positional arguments into a tuple: def total(*nums): sum(nums).\n- **kwargs collects any number of extra keyword arguments into a dict: def configure(**options).\n- Keyword arguments let callers pass arguments by name regardless of order: greet(greeting=\"Hi\", name=\"Amit\").\n\nParameters are passed by 'assignment' (sometimes called 'pass by object reference'): for immutable arguments (int, str, tuple), the function can't affect the caller's variable, since any 'change' just rebinds the local name to a new object. For mutable arguments (list, dict), the function receives a reference to the SAME object, so calling methods that mutate it in place (like list.append()) IS visible to the caller after the function returns.",
    keyPoints: ["def defines a function; a function with no return statement returns None", "*args collects extra positional args as a tuple; **kwargs collects extra keyword args as a dict", "Mutating a mutable argument (e.g. list.append()) inside a function affects the caller's object; reassigning the parameter name does not"],
    commonMistakes: ["Using a mutable default argument (def f(items=[])) - defaults are evaluated ONCE at function definition time, so this same list is shared and accumulates across every call that doesn't pass its own list", "Confusing 'reassigning a parameter inside a function' (has no effect on the caller) with 'mutating the object a parameter refers to' (IS visible to the caller) for mutable arguments"],
    interviewTips: ["The mutable-default-argument gotcha is one of the most commonly asked 'what's wrong with this code' Python interview questions - be ready to both spot it and fix it", "Know the exact difference between *args/**kwargs and be able to write a function signature that uses both correctly"],
    realWorldApplications: ["**kwargs is used extensively in real-world Python libraries (like Django and Flask) to let functions accept flexible configuration options without a rigid, ever-growing parameter list"],
    codeExample: { language: "python", code: "def greet(name, greeting=\"Hello\"):\n    return f\"{greeting}, {name}!\"\n\ndef total(*nums):\n    return sum(nums)\n\nprint(greet(\"Amit\"))               # Hello, Amit!\nprint(greet(\"Amit\", \"Hi\"))         # Hi, Amit!\nprint(total(1, 2, 3, 4))           # 10" },
    mcqs: [
      { question: "What does a Python function return if it has no explicit return statement?", options: ["0", "An empty string", "None", "It raises an error"], correctIndex: 2 },
      { question: "What does **kwargs collect?", options: ["Extra positional arguments as a list", "Extra keyword arguments as a dict", "Only required arguments", "Nothing - it's just a naming convention"], correctIndex: 1 },
    ],
    assignment: "Write a function that accepts a variable number of numbers via *args and returns their average, handling the case of zero arguments gracefully (return 0 instead of dividing by zero).",
    xpReward: 30, coinReward: 12,
  },
};

async function main() {
  for (const [topicId, content] of Object.entries(PYTHON_CONTENT)) {
    await db.collection("programmingLanguages").doc("python").collection("topics").doc(topicId).set(content, { merge: true });
    console.log("updated:", topicId);
  }
  console.log("\nDone.");
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
