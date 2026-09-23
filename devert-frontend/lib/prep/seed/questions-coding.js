// Seed coding questions - stdin/stdout judge contracts. Every test case below was
// traced by hand against the stated contract before being written down.
// starterCode only scaffolds I/O parsing (per design §6/§9); the algorithm itself
// is intentionally left as a TODO for the student to fill in.

export const codingQuestions = [
  {
    id: "seed-code-001",
    type: "coding",
    category: "dsa",
    topic: "arrays",
    difficulty: "easy",
    prompt:
      "**Reverse an Array**\n\n" +
      "Read an integer `n` on the first line, then `n` space-separated integers on the second line. " +
      "Print the array reversed, as space-separated integers on a single line.\n\n" +
      "**Input**\n```\nn\na1 a2 ... an\n```\n**Output**\n```\nan ... a2 a1\n```\n\n" +
      "**Example**\nInput:\n```\n5\n1 2 3 4 5\n```\nOutput:\n```\n5 4 3 2 1\n```",
    explanation:
      "Read all n integers into a list, then either loop from the last index down to 0, or use the language's built-in reverse (Python slicing `[::-1]`, `Collections.reverse` in Java) and print the elements space-separated. O(n) time, O(n) extra space if you don't reverse in place.",
    starterCode: {
      python:
        "import sys\n\ndef main():\n    data = sys.stdin.read().split()\n    n = int(data[0])\n    arr = list(map(int, data[1:1 + n]))\n    # TODO: reverse arr and print it, space-separated\n    pass\n\nif __name__ == \"__main__\":\n    main()\n",
      java:
        "import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        int[] arr = new int[n];\n        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        // TODO: reverse arr and print it, space-separated\n    }\n}\n",
      cpp:
        "#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    int n; cin >> n;\n    vector<int> arr(n);\n    for (int i = 0; i < n; i++) cin >> arr[i];\n    // TODO: reverse arr and print it, space-separated\n    return 0;\n}\n",
    },
    testCases: [
      { input: "5\n1 2 3 4 5", expectedOutput: "5 4 3 2 1", hidden: false },
      { input: "3\n10 20 30", expectedOutput: "30 20 10", hidden: false },
      { input: "1\n7", expectedOutput: "7", hidden: true },
      { input: "4\n-1 -2 -3 -4", expectedOutput: "-4 -3 -2 -1", hidden: true },
      { input: "6\n0 0 1 2 0 5", expectedOutput: "5 0 2 1 0 0", hidden: true },
    ],
    tags: ["arrays", "reversal"],
  },
  {
    id: "seed-code-002",
    type: "coding",
    category: "dsa",
    topic: "strings",
    difficulty: "easy",
    prompt:
      "**Palindrome Check**\n\n" +
      "Read a single line string `s` (letters and/or digits, no spaces). Print `YES` if `s` reads the same " +
      "forwards and backwards (case-SENSITIVE comparison), otherwise print `NO`.\n\n" +
      "**Input**\n```\ns\n```\n**Output**\n```\nYES  or  NO\n```\n\n" +
      "**Example**\nInput:\n```\nmadam\n```\nOutput:\n```\nYES\n```",
    explanation:
      "Compare the string to its own reverse; they are equal exactly when the string is a palindrome. In Python, `s == s[::-1]` is the whole solution. Remember the comparison is case-sensitive here, so \"Madam\" is NOT a palindrome under this contract (M ≠ m).",
    starterCode: {
      python:
        "def main():\n    s = input().strip()\n    # TODO: print YES if s is a palindrome (case-sensitive), else NO\n    pass\n\nif __name__ == \"__main__\":\n    main()\n",
      java:
        "import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String s = sc.nextLine().trim();\n        // TODO: print YES if s is a palindrome (case-sensitive), else NO\n    }\n}\n",
      cpp:
        "#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    string s; getline(cin, s);\n    // TODO: print YES if s is a palindrome (case-sensitive), else NO\n    return 0;\n}\n",
    },
    testCases: [
      { input: "madam", expectedOutput: "YES", hidden: false },
      { input: "hello", expectedOutput: "NO", hidden: false },
      { input: "a", expectedOutput: "YES", hidden: true },
      { input: "Madam", expectedOutput: "NO", hidden: true },
      { input: "12321", expectedOutput: "YES", hidden: true },
    ],
    tags: ["strings", "palindrome"],
  },
  {
    id: "seed-code-003",
    type: "coding",
    category: "dsa",
    topic: "arrays",
    difficulty: "medium",
    prompt:
      "**Second Largest Distinct Element**\n\n" +
      "Read an integer `n`, then `n` space-separated integers. Print the second largest DISTINCT value in the array. " +
      "If fewer than two distinct values exist, print `NONE`.\n\n" +
      "**Input**\n```\nn\na1 a2 ... an\n```\n**Output**\n```\nsecond_largest  or  NONE\n```\n\n" +
      "**Example**\nInput:\n```\n5\n4 1 3 4 2\n```\nOutput:\n```\n3\n```",
    explanation:
      "Collect the distinct values (a set), and if there are at least two, the answer is the second-largest of that distinct set - NOT the second element after a plain sort of the original array, which could repeat the maximum. A single pass tracking the largest and second-largest-so-far (skipping ties with the current largest) solves it in O(n) without sorting.",
    starterCode: {
      python:
        "import sys\n\ndef main():\n    data = sys.stdin.read().split()\n    n = int(data[0])\n    arr = list(map(int, data[1:1 + n]))\n    # TODO: print the second largest DISTINCT value, or NONE\n    pass\n\nif __name__ == \"__main__\":\n    main()\n",
      java:
        "import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        int[] arr = new int[n];\n        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        // TODO: print the second largest DISTINCT value, or NONE\n    }\n}\n",
      cpp:
        "#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    int n; cin >> n;\n    vector<int> arr(n);\n    for (int i = 0; i < n; i++) cin >> arr[i];\n    // TODO: print the second largest DISTINCT value, or NONE\n    return 0;\n}\n",
    },
    testCases: [
      { input: "5\n4 1 3 4 2", expectedOutput: "3", hidden: false },
      { input: "3\n10 10 10", expectedOutput: "NONE", hidden: false },
      { input: "6\n5 5 4 4 3 3", expectedOutput: "4", hidden: true },
      { input: "1\n9", expectedOutput: "NONE", hidden: true },
      { input: "4\n-5 -1 -1 -3", expectedOutput: "-3", hidden: true },
    ],
    tags: ["arrays", "second-largest"],
  },
  {
    id: "seed-code-004",
    type: "coding",
    category: "dsa",
    topic: "hashing",
    difficulty: "medium",
    prompt:
      "**Count Pairs With Given Sum**\n\n" +
      "Read `n` and `target` (space-separated) on the first line, then `n` space-separated integers on the second line. " +
      "Print the number of index pairs `(i, j)` with `i < j` such that `arr[i] + arr[j] == target`.\n\n" +
      "**Input**\n```\nn target\na1 a2 ... an\n```\n**Output**\n```\ncount\n```\n\n" +
      "**Example**\nInput:\n```\n5 9\n1 8 2 7 3\n```\nOutput:\n```\n2\n```",
    explanation:
      "Naive O(n²) checks every pair, which is fine for small n. The O(n) upgrade uses a hash map of value → count seen so far: for each new number x, add the current count of (target − x) to the answer, then increment x's own count. Watch out for duplicate values (e.g. two 2's both pairing with a 3) - the frequency-map approach handles that correctly, a plain set does not.",
    starterCode: {
      python:
        "import sys\n\ndef main():\n    data = sys.stdin.read().split()\n    n, target = int(data[0]), int(data[1])\n    arr = list(map(int, data[2:2 + n]))\n    # TODO: count index pairs (i < j) with arr[i] + arr[j] == target\n    pass\n\nif __name__ == \"__main__\":\n    main()\n",
      java:
        "import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        int target = sc.nextInt();\n        int[] arr = new int[n];\n        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        // TODO: count index pairs (i < j) with arr[i] + arr[j] == target\n    }\n}\n",
      cpp:
        "#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    int n; long long target; cin >> n >> target;\n    vector<long long> arr(n);\n    for (auto &x : arr) cin >> x;\n    // TODO: count index pairs (i < j) with arr[i] + arr[j] == target\n    return 0;\n}\n",
    },
    testCases: [
      { input: "5 9\n1 8 2 7 3", expectedOutput: "2", hidden: false },
      { input: "4 5\n2 2 3 3", expectedOutput: "4", hidden: false },
      { input: "3 100\n1 2 3", expectedOutput: "0", hidden: true },
      { input: "2 4\n2 2", expectedOutput: "1", hidden: true },
      { input: "6 0\n-3 3 -1 1 0 0", expectedOutput: "3", hidden: true },
    ],
    tags: ["hashing", "two-sum", "pairs"],
  },
  {
    id: "seed-code-005",
    type: "coding",
    category: "python",
    topic: "math",
    difficulty: "easy",
    prompt:
      "**Digital Root**\n\n" +
      "Read a non-negative integer `n`. Repeatedly replace it with the sum of its digits until only a single digit " +
      "remains, then print that digit.\n\n" +
      "**Input**\n```\nn\n```\n**Output**\n```\ndigital_root\n```\n\n" +
      "**Example**\nInput:\n```\n9875\n```\nOutput:\n```\n2\n```\n(9+8+7+5=29, 2+9=11, 1+1=2)",
    explanation:
      "You can solve it by literally looping \"sum the digits\" until the number is under 10, which works fine for any input size. There is also a famous O(1) formula: for n > 0, the digital root equals `1 + (n - 1) % 9` (and it's 0 for n = 0) - because summing digits repeatedly is the same operation as reducing modulo 9, a fact used in an old accounting technique called \"casting out nines\".",
    starterCode: {
      python:
        "def main():\n    n = int(input().strip())\n    # TODO: reduce n to its digital root and print it\n    pass\n\nif __name__ == \"__main__\":\n    main()\n",
      java:
        "import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        long n = sc.nextLong();\n        // TODO: reduce n to its digital root and print it\n    }\n}\n",
      cpp:
        "#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    long long n; cin >> n;\n    // TODO: reduce n to its digital root and print it\n    return 0;\n}\n",
    },
    testCases: [
      { input: "9875", expectedOutput: "2", hidden: false },
      { input: "12345", expectedOutput: "6", hidden: false },
      { input: "0", expectedOutput: "0", hidden: true },
      { input: "999999999", expectedOutput: "9", hidden: true },
      { input: "7", expectedOutput: "7", hidden: true },
    ],
    tags: ["math", "digits"],
  },
  {
    id: "seed-code-006",
    type: "coding",
    category: "python",
    topic: "dictionaries",
    difficulty: "medium",
    prompt:
      "**Most Frequent Element**\n\n" +
      "Read `n`, then `n` space-separated integers. Print the value that occurs most often. " +
      "If several values tie for the highest frequency, print the SMALLEST of those values.\n\n" +
      "**Input**\n```\nn\na1 a2 ... an\n```\n**Output**\n```\nmost_frequent_value\n```\n\n" +
      "**Example**\nInput:\n```\n7\n1 2 2 3 3 3 1\n```\nOutput:\n```\n3\n```",
    explanation:
      "Build a frequency dictionary in one pass (`count[x] = count.get(x, 0) + 1` in Python, or a `HashMap<Integer,Integer>` in Java). Then scan the dictionary once to find the maximum count, and among values with that maximum count keep the smallest one - do this by comparing carefully on ties, not just taking whichever appears first.",
    starterCode: {
      python:
        "import sys\n\ndef main():\n    data = sys.stdin.read().split()\n    n = int(data[0])\n    arr = list(map(int, data[1:1 + n]))\n    # TODO: print the most frequent value (smallest value on a tie)\n    pass\n\nif __name__ == \"__main__\":\n    main()\n",
      java:
        "import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        int[] arr = new int[n];\n        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();\n        // TODO: print the most frequent value (smallest value on a tie)\n    }\n}\n",
      cpp:
        "#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    int n; cin >> n;\n    vector<int> arr(n);\n    for (auto &x : arr) cin >> x;\n    // TODO: print the most frequent value (smallest value on a tie)\n    return 0;\n}\n",
    },
    testCases: [
      { input: "7\n1 2 2 3 3 3 1", expectedOutput: "3", hidden: false },
      { input: "5\n4 4 5 5 6", expectedOutput: "4", hidden: false },
      { input: "1\n42", expectedOutput: "42", hidden: true },
      { input: "6\n1 1 2 2 3 3", expectedOutput: "1", hidden: true },
      { input: "8\n5 5 5 1 1 2 2 2", expectedOutput: "2", hidden: true },
    ],
    tags: ["dictionaries", "frequency", "mode"],
  },
  {
    id: "seed-code-007",
    type: "coding",
    category: "java",
    topic: "2d-arrays",
    difficulty: "medium",
    prompt:
      "**Matrix Transpose**\n\n" +
      "Read two integers `r` and `c` (rows, columns) on the first line, then `r` lines follow, each with `c` " +
      "space-separated integers describing the matrix. Print the transpose: `c` lines, each with `r` " +
      "space-separated integers, where row `j` of the output is column `j` of the input.\n\n" +
      "**Input**\n```\nr c\nrow1\nrow2\n...\nrowr\n```\n**Output**\n```\nc lines, r numbers each\n```\n\n" +
      "**Example**\nInput:\n```\n2 3\n1 2 3\n4 5 6\n```\nOutput:\n```\n1 4\n2 5\n3 6\n```",
    explanation:
      "Read the matrix into a 2D array of shape r×c, then build the output by iterating columns as the outer loop and rows as the inner loop: `transpose[j][i] = matrix[i][j]`. No extra data structure is strictly required - you can print `matrix[i][j]` directly while looping `j` outer, `i` inner, skipping the explicit transpose array.",
    starterCode: {
      python:
        "import sys\n\ndef main():\n    data = sys.stdin.read().split('\\n')\n    r, c = map(int, data[0].split())\n    matrix = [list(map(int, data[i + 1].split())) for i in range(r)]\n    # TODO: print the transpose - c lines, each with r numbers\n    pass\n\nif __name__ == \"__main__\":\n    main()\n",
      java:
        "import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int r = sc.nextInt(), c = sc.nextInt();\n        int[][] matrix = new int[r][c];\n        for (int i = 0; i < r; i++)\n            for (int j = 0; j < c; j++)\n                matrix[i][j] = sc.nextInt();\n        // TODO: print the transpose - c lines, each with r numbers\n    }\n}\n",
      cpp:
        "#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    int r, c; cin >> r >> c;\n    vector<vector<int>> matrix(r, vector<int>(c));\n    for (int i = 0; i < r; i++)\n        for (int j = 0; j < c; j++)\n            cin >> matrix[i][j];\n    // TODO: print the transpose - c lines, each with r numbers\n    return 0;\n}\n",
    },
    testCases: [
      { input: "2 3\n1 2 3\n4 5 6", expectedOutput: "1 4\n2 5\n3 6", hidden: false },
      { input: "3 1\n7\n8\n9", expectedOutput: "7 8 9", hidden: false },
      { input: "1 1\n5", expectedOutput: "5", hidden: true },
      { input: "2 2\n1 2\n3 4", expectedOutput: "1 3\n2 4", hidden: true },
      { input: "3 3\n1 2 3\n4 5 6\n7 8 9", expectedOutput: "1 4 7\n2 5 8\n3 6 9", hidden: true },
    ],
    tags: ["matrix", "2d-arrays"],
  },
  {
    id: "seed-code-008",
    type: "coding",
    category: "java",
    topic: "number-theory",
    difficulty: "medium",
    prompt:
      "**Count Primes Up To N**\n\n" +
      "Read a non-negative integer `n`. Print the count of prime numbers that are ≤ `n`. " +
      "(For `n` = 0 or 1 the answer is 0, since there are no primes that small.)\n\n" +
      "**Input**\n```\nn\n```\n**Output**\n```\ncount\n```\n\n" +
      "**Example**\nInput:\n```\n10\n```\nOutput:\n```\n4\n```\n(2, 3, 5, 7)",
    explanation:
      "The Sieve of Eratosthenes is the standard O(n log log n) approach: create a boolean array of size n+1 marked \"prime\" by default, then for every i from 2 to √n, if i is still marked prime, mark all its multiples (starting from i×i) as not prime. Finally count the indices still marked prime. A naive per-number trial-division check also works for modest n, just slower.",
    starterCode: {
      python:
        "def main():\n    n = int(input().strip())\n    # TODO: count primes <= n (Sieve of Eratosthenes is the efficient way)\n    pass\n\nif __name__ == \"__main__\":\n    main()\n",
      java:
        "import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        // TODO: count primes <= n (Sieve of Eratosthenes is the efficient way)\n    }\n}\n",
      cpp:
        "#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    int n; cin >> n;\n    // TODO: count primes <= n (Sieve of Eratosthenes is the efficient way)\n    return 0;\n}\n",
    },
    testCases: [
      { input: "10", expectedOutput: "4", hidden: false },
      { input: "1", expectedOutput: "0", hidden: false },
      { input: "2", expectedOutput: "1", hidden: true },
      { input: "20", expectedOutput: "8", hidden: true },
      { input: "0", expectedOutput: "0", hidden: true },
    ],
    tags: ["number-theory", "sieve", "primes"],
  },
];
