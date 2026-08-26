// Daily Learning - DSA Series, WEEK 6 (Mon 24 Aug - Sat 29 Aug 2026).
//
// Continues the existing sequence exactly:
//   Week 1  2026-07-20  Arrays              Days 1-5   + Week 1 Recap Test
//   Week 2  2026-07-27  Linked Lists        Days 8-12  + Week 2 Master Test
//   Week 3  2026-08-03  Stacks & Queues     Days 13-17 + Week 3 Master Test
//   Week 4  2026-08-10  Recursion & Trees   Days 18-22 + Week 4 Master Test
//   Week 5  2026-08-17  Heaps & Hashing     Days 25-29 + Week 5 Master Test
//   Week 6  2026-08-24  Graphs              Days 30-34 + Week 6 Master Test  <- this file
//
// WHY THIS TOPIC NEXT: week 5's own script called this out explicitly -
// "Both topics [heaps, hashing] are also direct prerequisites for graph
// algorithms (Dijkstra needs a heap; visited-tracking needs a hash set),
// which is why they sit here rather than later." This week collects on
// that setup: Day 34 (Dijkstra) uses the Week 5 heap directly, and the
// Saturday capstone ("Clone a Graph") uses a hash map to avoid re-visiting
// a vertex, tying hashing back in too. Trees (Week 4) already established
// vertices/edges/traversal - graphs simply drop the "no cycles, one parent"
// restriction a tree enforces, so the whole week reads as "what trees
// generalize to" rather than a cold start.
//
// DAY NUMBERING matches currentDayIndex (lib/dailyLearning.js's
// fetchTrackProgress) - a live count of every published item to date, with
// no gaps - exactly as week 5's own patch established. Week 5 was Days
// 25-29, so week 6 opens at Day 30.
//
// SHAPE matches the live docs exactly (checked against week 5, 2026-08-17
// through 2026-08-22):
//   lesson (Mon-Fri): 5 MCQs, xpReward 50,  coinReward 20, 1-3 problemIds
//   test   (Sat):    10 MCQs, xpReward 150, coinReward 60, 5 problemIds
//   date, weekId (the week's Monday), dow, type, title, concept, mcqs[],
//   problemIds[], status "published", audiences ["legacy"], createdAt.
//
// audiences: ["legacy"] is deliberate, not a placeholder - see week 5's own
// note; anything else would make the week invisible to every existing reader.
//
// problemIds are REAL ids, verified live against the `problems` collection
// (queried via scripts/tmp-find-graph-problems.mjs, since deleted - same
// throwaway-script precedent week 5 used). All 45 published "Graphs"-
// category problems were pulled and read before assigning any of them to a
// day, so each day only gets problems solvable with THAT day's own concept
// (no problem requires a technique taught on a later day). Day 30
// deliberately carries only one problem - the published set has exactly one
// "pure representation, no traversal needed" problem, and assigning a
// traversal-based problem before BFS/DFS are taught would contradict that
// same-day-solvable rule the other four weeks all kept.
//
// The Saturday test deliberately uses five problems the week's lessons did
// not, so it tests transfer rather than recall of the same five; "Clone a
// Graph" is a deliberate capstone since it is a graph traversal (BFS or
// DFS) AND a hash map (Week 5) in one problem, the same "this week's ideas,
// combined" role "Top K Frequent Elements" played in week 5's test.
//
// Idempotent: refuses to overwrite a date that already exists.
//
//   node scripts/seed-daily-learning-week6-2026-08-24.mjs            # dry run
//   node scripts/seed-daily-learning-week6-2026-08-24.mjs --apply

import admin from "firebase-admin";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
admin.initializeApp({
  credential: admin.credential.cert(
    JSON.parse(readFileSync(join(__dirname, "service-account.json"), "utf8"))
  ),
});
const db = admin.firestore();
const FV = admin.firestore.FieldValue;

const APPLY = process.argv.includes("--apply");
const INSTITUTION_ID = "mrcet";
const WEEK_ID = "2026-08-24";

const mcq = (id, text, options, correctIndex) => ({ id, text, options, correctIndex });

const DAYS = [
  {
    date: "2026-08-24", dow: "mon", type: "lesson",
    title: "Day 30: Graph Representation - Vertices, Edges & Adjacency Structures",
    problemIds: [
      "mLdWEc7RXnWLXGh9RMdv", // Create a Graph and Print Its Adjacency List (Easy, Graph)
    ],
    concept:
`A graph generalizes the tree structures of the past two weeks: instead of one parent per node with no cycles allowed, a graph is just VERTICES (nodes) connected by EDGES (connections), with no restriction on how many connections a node has or whether following them can loop back on itself.

Two definitions to get straight before anything else:
  DIRECTED    edge A->B is one-way (following it does not mean B->A also exists)
  UNDIRECTED  edge A-B is two-way (implicitly also B->A)
And separately:
  UNWEIGHTED  every edge is equivalent - only "connected or not" matters
  WEIGHTED    every edge carries a cost/distance - "connected, and how much would it cost"
These two choices are independent - a graph can be any combination of the two.

REPRESENTING a graph in code has two standard options, and the trade-off between them is the first thing to internalize:
  ADJACENCY LIST    for each vertex, keep a list of its neighbors. Space: O(V + E). Fast to iterate "who does this vertex connect to" - exactly what BFS/DFS need. Slow, O(degree), to answer "are A and B directly connected?"
  ADJACENCY MATRIX  a V x V grid; matrix[i][j] = 1 (or the weight) if an edge exists. Space: O(V^2), regardless of how few edges exist. O(1) to check "are A and B connected?" but wastes huge amounts of memory on a SPARSE graph (far fewer than V^2 edges - the overwhelming majority of real graphs).

Because almost every graph problem cares about walking from vertex to vertex (which the list does well) rather than instantly checking arbitrary pairs (which the matrix does well), the adjacency list is the default choice - reach for a matrix only when the graph is dense or you specifically need O(1) pair-lookup.

DEGREE of a vertex is how many edges touch it (in directed graphs, split into in-degree and out-degree). It's the most basic property you can read straight off either representation: a vertex with degree 0 is isolated, and in an undirected graph the sum of every vertex's degree is always exactly 2x the edge count, since each edge touches two vertices.`,
    mcqs: [
      mcq("q1", "A directed edge A->B differs from an undirected edge A-B in that:", [
        "Directed only lets you travel A to B, unless a separate B->A edge also exists", "Undirected edges are always weighted",
        "Directed edges cannot have weights", "There is no real difference",
      ], 0),
      mcq("q2", "The two standard ways to represent a graph in code are:", [
        "A stack and a queue", "An adjacency list and an adjacency matrix",
        "A hash map and a hash set", "Preorder and postorder arrays",
      ], 1),
      mcq("q3", "An adjacency list's space complexity is:", [
        "O(V^2) always", "O(V + E)", "O(E^2)", "O(1)",
      ], 1),
      mcq("q4", "An adjacency matrix is the better representation specifically when:", [
        "The graph is sparse", "You need O(1) lookup for whether two specific vertices are directly connected",
        "Memory is extremely limited", "The graph is a tree",
      ], 1),
      mcq("q5", "The degree of a vertex is:", [
        "The number of vertices in the whole graph", "The number of edges touching that vertex",
        "The shortest path from it to any other vertex", "Always exactly 2",
      ], 1),
    ],
  },
  {
    date: "2026-08-25", dow: "tue", type: "lesson",
    title: "Day 31: Breadth-First Search (BFS) - Level-by-Level Traversal",
    problemIds: [
      "VFPhkbaJDdtT3R4byklB", // BFS Traversal of a Graph (Easy, Graph/Queue)
      "J7cJLj1BAwf2dlwGPboc", // Rotten Oranges - Minimum Time for All to Rot (Medium, Graph/Queue)
      "QV1E0ANxeldi1xfdCDVX", // Water Jug Problem Using BFS (Medium, Graph/Queue)
    ],
    concept:
`BFS explores a graph LEVEL BY LEVEL: visit the start vertex, then every vertex exactly one edge away, then every vertex exactly two edges away, and so on - never visiting a vertex further away before every closer vertex has already been visited.

That level-by-level guarantee is what makes BFS the right tool whenever a problem asks for the SHORTEST PATH in an UNWEIGHTED graph (every edge costs the same "1 step") - the first time BFS reaches a vertex is guaranteed to be via the shortest possible number of edges, because it can only reach that vertex "early" by way of a shorter path it would have already explored first.

THE ALGORITHM uses a QUEUE (FIFO) and a VISITED set:
  1. Push the start vertex, mark it visited.
  2. While the queue isn't empty: pop the front vertex, process it, then push every UNVISITED neighbor - marking each visited the moment it's pushed, not when it's popped (marking late lets the same vertex get pushed twice through two different paths).
  3. Track distance by remembering which "layer" each push happened in, or by storing (vertex, distance) pairs in the queue instead of bare vertices.

Why a queue and not a stack: a queue processes vertices in the ORDER they were discovered - first discovered, first explored - which is exactly what keeps the exploration level-by-level. Swap it for a stack (last in, first out) and you'd dive deep down one branch before coming back - that's DFS instead (tomorrow's topic).

MULTI-SOURCE BFS starts from MULTIPLE vertices in the queue at once instead of one (e.g. "every rotten orange rots its neighbors simultaneously") - it's the identical algorithm, just seeded with more than one starting point, and it still finds the shortest distance from "any source" to every other vertex.

Time complexity is O(V + E): every vertex is visited once, and every edge is examined once, from whichever endpoint discovers it first.`,
    mcqs: [
      mcq("q1", "BFS explores a graph in what order?", [
        "Depth-first, diving as far as possible down one path first", "Level by level - all vertices 1 edge away, then all 2 edges away, etc",
        "Randomly", "Alphabetically by vertex name",
      ], 1),
      mcq("q2", "BFS is the right choice specifically when a problem asks for:", [
        "The shortest path in a weighted graph", "The shortest path (fewest edges) in an unweighted graph",
        "A topological order", "The maximum spanning tree",
      ], 1),
      mcq("q3", "The data structure BFS uses to decide which vertex to process next is a:", [
        "Stack", "Queue", "Heap", "Trie",
      ], 1),
      mcq("q4", "In BFS, a vertex should be marked visited:", [
        "Only after it's popped from the queue", "The moment it's pushed into the queue, to avoid pushing it twice",
        "Never - visited tracking isn't needed", "Only if it has no unvisited neighbors",
      ], 1),
      mcq("q5", "BFS's time complexity for a graph with V vertices and E edges is:", [
        "O(V)", "O(E)", "O(V + E)", "O(V * E)",
      ], 2),
    ],
  },
  {
    date: "2026-08-26", dow: "wed", type: "lesson",
    title: "Day 32: Depth-First Search (DFS) - Diving Deep Before Backtracking",
    problemIds: [
      "ZYetgE5aCKN4gMGJZDK9", // DFS Traversal of a Graph (Easy, Graph)
      "3Y4t8YmBeg9BOOnPwtUF", // Count Connected Components in an Undirected Graph (Easy, Graph)
      "PAt2RYeVA0gusaT1kK3d", // Detect a Cycle in an Undirected Graph (Medium, Graph)
    ],
    concept:
`Where BFS spreads outward level by level, DFS dives as deep as possible down ONE path before backtracking - visit a vertex, then recurse into an unvisited neighbor, and keep recursing into THAT neighbor's unvisited neighbors, only backtracking once every neighbor down the current path has already been visited.

THE ALGORITHM (recursive - the natural fit after two weeks on recursion):
  dfs(vertex):
    mark vertex visited
    for each neighbor of vertex:
      if neighbor not visited: dfs(neighbor)

An explicit STACK gives the identical traversal order without recursion (push instead of recursing, pop instead of returning) - useful when recursion depth risks a stack overflow on a very large/deep graph, but the recursive version is what you'll write by default.

CONNECTED COMPONENTS: run DFS from any unvisited vertex, and everything it visits before returning is exactly one connected component (a maximal set of vertices all reachable from each other). Loop over every vertex in the graph; every time you find one still unvisited, that's the start of a NEW component - run DFS from it, increment a counter. The number of times a fresh DFS starts is the total component count.

CYCLE DETECTION (undirected graph): while running DFS, if you reach a vertex that is ALREADY visited and it is NOT the vertex you just came from (i.e. not simply walking back along the same edge you arrived by), you've found a back edge to an earlier vertex - a cycle exists. Tracking "the parent I arrived from" alongside "visited" is what tells a genuine cycle apart from harmlessly walking back the edge you just used.

DFS and BFS both run in O(V + E) - the difference is never speed, it's WHICH property they naturally expose: BFS gives you shortest paths for free; DFS gives you traversal ORDER (useful for topological sort, tomorrow's topic) and makes connectivity/cycle questions fall out naturally from the recursion structure.`,
    mcqs: [
      mcq("q1", "DFS's exploration strategy is to:", [
        "Visit all vertices at the current distance before going further", "Dive as deep as possible down one path, backtracking only when stuck",
        "Visit vertices in a random order", "Always visit the lowest-numbered vertex next",
      ], 1),
      mcq("q2", "The natural, default way to implement DFS is:", [
        "Iteratively with a queue", "Recursively (or with an explicit stack for the same order)",
        "With a heap", "With a hash map only",
      ], 1),
      mcq("q3", "To count the connected components of an undirected graph, you:", [
        "Run DFS once from vertex 0 only", "Run DFS from every still-unvisited vertex, counting how many times a fresh DFS starts",
        "Count the total number of edges", "Check if the graph is a tree",
      ], 1),
      mcq("q4", "During DFS-based cycle detection in an undirected graph, revisiting an already-visited vertex indicates a cycle UNLESS:", [
        "It's the vertex you started DFS from", "It's the parent you just arrived from (that's just the edge you came in on)",
        "It has degree 1", "It's an isolated vertex",
      ], 1),
      mcq("q5", "DFS and BFS share the same O(V + E) time complexity; the real difference between them is:", [
        "DFS is always faster in practice", "Which property each one naturally exposes - BFS gives shortest paths, DFS gives traversal order for things like topological sort",
        "DFS cannot detect cycles", "BFS cannot be implemented on a directed graph",
      ], 1),
    ],
  },
  {
    date: "2026-08-27", dow: "thu", type: "lesson",
    title: "Day 33: Topological Sort & Cycle Detection in Directed Graphs",
    problemIds: [
      "bBhDnbmjvihjgKJ4ZpeE", // Detect a Cycle in a Directed Graph (Medium, Graph)
      "AAeRJ6xbhNRRIS33pIrR", // Topological Sort of a Directed Acyclic Graph (Medium, Graph)
      "Wmfg2RSgINLeJ9ksFo5F", // Course Schedule - Possible to Finish All Tasks (Medium, Graph)
    ],
    concept:
`A DIRECTED ACYCLIC GRAPH (DAG) is a directed graph with no cycles - there's no sequence of edges you can follow that leads back to where you started. DAGs show up whenever "X must happen before Y" relationships exist: course prerequisites, build-system dependencies, task scheduling.

A TOPOLOGICAL SORT is a linear ordering of a DAG's vertices such that for every directed edge U->V, U appears BEFORE V - a valid order to "do" every vertex that respects every prerequisite. A topological sort exists if and only if the graph has NO CYCLE (a cycle would mean two things each require the other first, which is unsatisfiable).

DFS-BASED TOPOLOGICAL SORT: run DFS from every unvisited vertex; the moment a vertex FINISHES (every one of its neighbors has already been fully explored), push it onto the front of the result (or append to a list and reverse it at the end). A vertex only finishes after everything IT depends on has already finished - exactly the ordering guarantee needed.

CYCLE DETECTION IN A DIRECTED GRAPH is subtly different from yesterday's undirected version: instead of just tracking "visited," track which vertices are CURRENTLY on the recursion stack (an "in progress" set, distinct from "fully done"). If DFS ever reaches a vertex still on the CURRENT recursion stack (not just visited at some point, but actively an ancestor in this call chain), that's a back edge to an ancestor - a genuine cycle. Reaching an already-FINISHED vertex (no longer on the stack) is fine - it just means two different paths both lead to it, which directed graphs allow without implying a cycle.

COURSE SCHEDULE ("can you finish every course given prerequisite pairs?") is topological sort's canonical real-world framing: it's solvable exactly by attempting a topological sort - if you can produce one, you can finish everything (that IS the schedule); if the graph has a cycle, you cannot.`,
    mcqs: [
      mcq("q1", "A topological sort of a DAG is:", [
        "Any random ordering of its vertices", "An ordering where every edge U->V has U appearing before V",
        "A sorted-by-value ordering of vertex labels", "The shortest path through every vertex",
      ], 1),
      mcq("q2", "A topological sort exists for a directed graph if and only if:", [
        "It is connected", "It has no cycles (it's a DAG)", "Every vertex has the same degree", "It has fewer than 10 vertices",
      ], 1),
      mcq("q3", "In DFS-based topological sort, a vertex is added to the result:", [
        "As soon as it's first visited", "Only after every one of its neighbors has already finished being explored",
        "Before its neighbors are visited", "In alphabetical order",
      ], 1),
      mcq("q4", "Detecting a cycle in a DIRECTED graph during DFS requires tracking:", [
        "Only a visited set, exactly like the undirected case", "A separate \"currently on the recursion stack\" set, distinct from \"visited overall\"",
        "The total edge count only", "Nothing extra - it's identical to the undirected case",
      ], 1),
      mcq("q5", "\"Course Schedule\" (can all courses be completed given prerequisites) is solvable by:", [
        "Running BFS once from any course", "Attempting a topological sort - it succeeds exactly when no cycle exists",
        "Sorting courses alphabetically", "Counting connected components",
      ], 1),
    ],
  },
  {
    date: "2026-08-28", dow: "fri", type: "lesson",
    title: "Day 34: Dijkstra's Algorithm - Shortest Path in Weighted Graphs",
    problemIds: [
      "h2QPTv6y0xjLX5wIJ9nr", // Dijkstra's Shortest Path From a Source (Medium, Graph/Heap)
      "oOrcyjBLF4k4dgRcx9Gy", // Cheapest Flights Within K Stops (Medium, Graph)
    ],
    concept:
`BFS finds shortest paths, but only when every edge costs the same. The moment edges carry different weights (real distances, costs, times), BFS's guarantee breaks - a path with more edges can still be CHEAPER than a path with fewer, if its edges are lighter. DIJKSTRA'S ALGORITHM finds the shortest weighted path from one source to every other vertex, and it needs a heap - exactly the structure Week 5 introduced - to do it efficiently.

THE ALGORITHM: maintain a distance array, initialised to infinity for every vertex except the source (distance 0). Use a MIN-HEAP of (distance, vertex) pairs, seeded with just the source. Repeatedly:
  1. Pop the pair with the smallest distance from the heap - call its vertex U.
  2. If this popped distance is already worse than U's current recorded best distance, skip it (a cheaper path to U was already processed - this popped entry is stale).
  3. Otherwise, for each neighbor V of U with edge weight w: if dist[U] + w < dist[V], that's a cheaper path to V - update dist[V] and push (dist[V], V) onto the heap.

Why the min-heap specifically: it guarantees the NEXT vertex you finalize is always the closest one not yet finalized, among everything currently reachable - the exact greedy choice that makes the algorithm correct. This only works because Dijkstra requires ALL edge weights to be NON-NEGATIVE; a negative edge could make a "settled" vertex's distance wrong later, which is why negative weights need a different algorithm entirely, outside this week's scope.

COMPLEXITY: with a binary heap, each of the E edges can trigger one push, and each push/pop is O(log V), giving O(E log V) overall - a direct payoff of the heap operations from two weeks ago being O(log n) each.

Dijkstra vs BFS is really one idea in two special cases: BFS is Dijkstra where every edge weight is exactly 1 (in which case a plain queue is already optimal, no heap needed); Dijkstra is what you reach for the moment weights differ.`,
    mcqs: [
      mcq("q1", "BFS fails to guarantee the shortest path the moment:", [
        "The graph has more than 100 vertices", "Edges have different weights (costs) rather than all being equal",
        "The graph is directed", "The graph has a cycle",
      ], 1),
      mcq("q2", "Dijkstra's algorithm uses a min-heap to always:", [
        "Process vertices in insertion order", "Process the not-yet-finalized vertex with the smallest known distance next",
        "Process vertices in reverse order", "Avoid needing a distance array",
      ], 1),
      mcq("q3", "Dijkstra's algorithm requires that every edge weight be:", [
        "Exactly 1", "An integer", "Non-negative", "Less than the number of vertices",
      ], 2),
      mcq("q4", "With a binary heap, Dijkstra's overall time complexity is:", [
        "O(V + E)", "O(E log V)", "O(V^2)", "O(E^2)",
      ], 1),
      mcq("q5", "BFS can be understood as a special case of Dijkstra where:", [
        "The graph has no edges", "Every edge weight is exactly 1, so a plain queue already gives the same result a heap would",
        "The graph is a tree", "There is only one vertex",
      ], 1),
    ],
  },
  {
    date: "2026-08-29", dow: "sat", type: "test",
    title: "Week 6 Master Test: Graphs",
    xpReward: 150, coinReward: 60,
    // Five problems the week's lessons did NOT set, so this tests transfer
    // rather than recall of the same five. "Clone a Graph" is a deliberate
    // capstone since it is a graph traversal (BFS or DFS) AND a hash map
    // (Week 5) in one problem, the same role "Top K Frequent Elements"
    // played in week 5's own test.
    problemIds: [
      "SU6TK1CzUqqPARommfU4", // Flood Fill Algorithm (Easy, Graph/Matrix)
      "BmPBoXH6ODzsckjchKJD", // Number of Islands in a 2D Grid (Medium, Graph/Matrix)
      "MdRUtwCyduM3jIqoSLvP", // Check if a Graph Is Bipartite (Medium, Graph)
      "aIC4LQaqfS7oJkwYH1jy", // Clone a Graph (Medium, Graph/Queue)
      "QjmUcn5oS0QTYa1MHhpy", // Longest Path in a Directed Acyclic Graph (Medium, Graph)
    ],
    concept:
`Everything from Days 30-34: graph representation (adjacency list vs matrix, directed/undirected, weighted/unweighted), BFS for shortest paths in unweighted graphs, DFS for connectivity/cycle detection, topological sort for dependency ordering, and Dijkstra for shortest paths in weighted graphs.

Ten questions, then five problems - deliberately ones you have not been set this week, so they test whether you understood the patterns rather than memorised the exercises. Watch for "Clone a Graph" in particular: it's this entire month in one problem - a graph traversal (BFS or DFS) combined with a hash map (Week 5) to avoid cloning the same vertex twice.`,
    mcqs: [
      mcq("q1", "The two standard representations of a graph are:", [
        "A stack and a queue", "An adjacency list and an adjacency matrix", "A hash map and an array", "A heap and a trie",
      ], 1),
      mcq("q2", "The degree of a vertex is:", [
        "The number of edges touching it", "Its distance from the source", "Its position in a topological sort", "Always 1",
      ], 0),
      mcq("q3", "BFS uses which data structure to decide traversal order?", [
        "Stack", "Queue", "Heap", "None",
      ], 1),
      mcq("q4", "BFS guarantees the shortest path when:", [
        "All edge weights are equal", "The graph is a DAG", "The graph has no cycles", "Never",
      ], 0),
      mcq("q5", "DFS's natural implementation style is:", [
        "Iterative with a queue", "Recursive (or an equivalent explicit stack)", "Only possible with a heap", "Only possible with a hash map",
      ], 1),
      mcq("q6", "In undirected-graph DFS cycle detection, revisiting a vertex indicates a genuine cycle unless it is:", [
        "The source vertex", "The parent you just arrived from", "A leaf", "Isolated",
      ], 1),
      mcq("q7", "A topological sort exists for a directed graph exactly when:", [
        "It's connected", "It has no cycles (it's a DAG)", "Every vertex has equal degree", "It has an even number of vertices",
      ], 1),
      mcq("q8", "Detecting a cycle in a DIRECTED graph during DFS additionally requires tracking:", [
        "Nothing extra", "A \"currently on the recursion stack\" set separate from \"visited\"", "The total edge count", "Vertex degrees",
      ], 1),
      mcq("q9", "Dijkstra's algorithm relies on a min-heap to:", [
        "Sort all vertices upfront", "Always process the closest not-yet-finalized vertex next",
        "Avoid needing a distance array", "Detect negative cycles",
      ], 1),
      mcq("q10", "Dijkstra's algorithm generalizes BFS to handle:", [
        "Directed graphs", "Graphs with unequal edge weights", "Disconnected graphs", "Graphs with cycles",
      ], 1),
    ],
  },
];

async function main() {
  const col = db.collection("institutions").doc(INSTITUTION_ID).collection("dailyLearning");

  // Confirms the module is switched on - a perfectly seeded week is invisible to
  // students if dailyLearning/_module has enabled false.
  const mod = await col.doc("_module").get();
  console.log(`_module.enabled = ${mod.exists ? mod.data().enabled : "(missing)"}`);

  let created = 0, skipped = 0;
  for (const d of DAYS) {
    const existing = await col.doc(d.date).get();
    if (existing.exists) {
      console.log(`  SKIP   ${d.date} - already exists: "${existing.data().title}"`);
      skipped++;
      continue;
    }

    const payload = {
      date: d.date,
      weekId: WEEK_ID,
      dow: d.dow,
      type: d.type,
      title: d.title,
      concept: d.concept,
      mcqs: d.mcqs,
      problemIds: d.problemIds,
      xpReward: d.xpReward ?? 50,
      coinReward: d.coinReward ?? 20,
      status: "published",
      audiences: ["legacy"],
      createdAt: FV.serverTimestamp(),
    };

    console.log(`  ${APPLY ? "CREATE" : "would create"} ${d.date} [${d.dow}/${d.type}] ${d.title}`);
    console.log(`         mcqs=${d.mcqs.length} problems=${d.problemIds.length} xp=${payload.xpReward} coins=${payload.coinReward} concept=${d.concept.length} chars`);

    if (APPLY) await col.doc(d.date).set(payload);
    created++;
  }

  // Every referenced problem must exist and be published, or the day renders a
  // broken practice list to a whole cohort.
  const ids = [...new Set(DAYS.flatMap(d => d.problemIds))];
  let bad = 0;
  for (const id of ids) {
    const p = await db.collection("problems").doc(id).get();
    const ok = p.exists && p.data().status === "published";
    if (!ok) { console.log(`  *** BAD problemId ${id} - exists=${p.exists} status=${p.exists ? p.data().status : "-"}`); bad++; }
  }
  console.log(`\nproblemIds checked: ${ids.length}, unresolved: ${bad}`);
  console.log(`${APPLY ? "created" : "would create"}: ${created}   skipped (already present): ${skipped}`);
  if (!APPLY) console.log("\ndry run - re-run with --apply");
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
