// Daily Learning - DSA Series, WEEK 7 (Mon 31 Aug - Sat 5 Sep 2026).
//
// Continues the existing sequence exactly:
//   Week 1  2026-07-20  Arrays              Days 1-5   + Week 1 Recap Test
//   Week 2  2026-07-27  Linked Lists        Days 8-12  + Week 2 Master Test
//   Week 3  2026-08-03  Stacks & Queues     Days 13-17 + Week 3 Master Test
//   Week 4  2026-08-10  Recursion & Trees   Days 18-22 + Week 4 Master Test
//   Week 5  2026-08-17  Heaps & Hashing     Days 25-29 + Week 5 Master Test
//   Week 6  2026-08-24  Graphs              Days 30-34 + Week 6 Master Test
//   Week 7  2026-08-31  Advanced Graphs     Days 35-39 + Week 7 Master Test  <- this file
//
// WHY THIS TOPIC NEXT: week 6's own Dijkstra lesson (Day 34) closed on an
// explicit unfinished thread - "a negative edge could make a 'settled'
// vertex's distance wrong later, which is why negative weights need a
// different algorithm entirely, outside this week's scope." Day 38
// (Bellman-Ford) is that promised algorithm, named directly. Week 6 also
// ended on Dijkstra without ever covering how a MINIMUM SPANNING TREE is
// actually built - this week opens on exactly that gap: Union-Find
// (Day 35) as the prerequisite data structure, then Kruskal's (Day 36) as
// its first real use, then Prim's (Day 37) as the alternative approach
// that reuses the min-heap machinery Dijkstra already established. Floyd-
// Warshall (Day 39) closes the week by generalising from "shortest path
// from ONE source" (BFS/Dijkstra/Bellman-Ford) to "shortest path between
// EVERY pair" - the natural last step once every single-source tool exists.
//
// DAY NUMBERING matches currentDayIndex (lib/dailyLearning.js's
// fetchTrackProgress) - a live count of every published item to date, with
// no gaps. Week 6 ended at Day 34 (Fri) + its Sat test = 35 total items
// live; this week's first lesson is therefore Day 35.
//
// SHAPE matches the live docs exactly (checked against week 6,
// 2026-08-24 through 2026-08-29):
//   lesson (Mon-Fri): 5 MCQs, xpReward 50,  coinReward 20, 1-2 problemIds
//   test   (Sat):    10 MCQs, xpReward 150, coinReward 60, 2 problemIds
//   date, weekId (the week's Monday), dow, type, title, concept, mcqs[],
//   problemIds[], status "published", audiences ["legacy"], createdAt.
//
// audiences: ["legacy"] is deliberate, not a placeholder - same reasoning
// week 5/6 both documented; anything else would make the week invisible to
// every existing reader (no account carries an `auds` claim yet).
//
// problemIds are REAL ids, verified live against the `problems` collection
// (queried directly - status=="published", category=="Graphs" - and each
// candidate's full statement read before assignment, same throwaway-script
// precedent week 5/6 used). Days 35-39 each carry only the problem(s) that
// exist for THAT exact algorithm - the published bank has exactly one
// Prim's problem and one Floyd-Warshall problem, so those two days
// deliberately carry a single problemId each, same as week 6's Day 30.
//
// The Saturday test uses two problems the week's lessons did NOT set -
// "Making Wired Connections" (Union-Find: count components, check if
// enough edges exist to reconnect everything) and "Total Number of
// Spanning Trees" (small n, brute-force every candidate edge subset and
// verify connectivity with Union-Find - a direct, if unusual, transfer of
// Day 35's own data structure). No third/fourth/fifth problem was added
// beyond these two: every other unused published Graphs problem tests a
// DIFFERENT topic (bridges, SCCs, colouring, Eulerian paths) this week
// never taught, and padding the test with those would test recall of
// nothing rather than transfer of this week's ideas - the same "no silent
// padding" discipline applied throughout.
//
// Idempotent: refuses to overwrite a date that already exists.
//
//   node scripts/seed-daily-learning-week7-2026-08-31.mjs            # dry run
//   node scripts/seed-daily-learning-week7-2026-08-31.mjs --apply

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
const WEEK_ID = "2026-08-31";

const mcq = (id, text, options, correctIndex) => ({ id, text, options, correctIndex });

const DAYS = [
  {
    date: "2026-08-31", dow: "mon", type: "lesson",
    title: "Day 35: Union-Find (Disjoint Set Union) - Merging and Querying Groups",
    problemIds: [
      "wt4Zxe0PSSNokDBr7BcQ", // Journey to the Moon (Medium, Graph)
    ],
    concept:
`Union-Find (also called Disjoint Set Union, or DSU) answers a question graph traversal is the wrong tool for: not "how do I walk from A to B", but "are A and B in the same group right now, given a stream of merges so far". It supports exactly two operations, both meant to run close to O(1): FIND(x), which returns a group's representative element, and UNION(x, y), which merges x's group and y's group into one.

THE NAIVE VERSION: an array \`parent\`, where parent[x] initially points to itself (n groups, each of size 1). find(x) walks parent[x], parent[parent[x]], and so on until it reaches an element that points to itself - that element is the group's representative. union(x, y) finds both representatives and makes one point at the other. This works, but on unlucky input the parent chain can degrade into a straight line n elements long, making every find O(n).

TWO OPTIMISATIONS FIX THIS COMPLETELY:

PATH COMPRESSION: while find(x) walks up to the representative, make every node it passed through point DIRECTLY at that representative, not just at its old parent. The next find from any of those nodes is then O(1). This costs nothing extra during the walk you were already doing - it just also rewires it.

  find(x):
    if parent[x] != x: parent[x] = find(parent[x])   # rewire on the way back up
    return parent[x]

UNION BY RANK (or by size): when merging two groups, always attach the SMALLER tree under the LARGER tree's root, never the reverse. Tracked with a \`rank\` array (a size estimate that only matters relative to other ranks, not an exact height once path compression is also in play).

  union(x, y):
    rootX, rootY = find(x), find(y)
    if rootX == rootY: return                         # already the same group
    if rank[rootX] < rank[rootY]: swap(rootX, rootY)
    parent[rootY] = rootX
    if rank[rootX] == rank[rootY]: rank[rootX] += 1

WITH BOTH TOGETHER, the amortized time per operation is nearly O(1) - technically O(alpha(n)), the inverse Ackermann function, which is at most 4 or 5 for any n that could ever fit in memory. Either optimisation alone already gives a good bound; using both is the standard, and is what every real implementation does.

WHAT UNION-FIND IS ACTUALLY FOR: cycle detection in an undirected graph without running DFS at all (before adding edge u-v, check find(u) == find(v) - if so, the edge would close a cycle), counting connected components (start with n groups, one union per edge, the final number of distinct representatives is the component count), and - as tomorrow's lesson builds on directly - deciding, one edge at a time, whether adding an edge to a growing spanning tree would create a cycle.`,
    mcqs: [
      mcq("q1", "Union-Find (Disjoint Set Union) is the right tool specifically for:", [
        "Finding the shortest path between two vertices", "Answering \"are these two elements in the same group\" while merging groups over time",
        "Sorting a list of elements", "Finding the maximum value in a range",
      ], 1),
      mcq("q2", "Path compression works by:", [
        "Deleting nodes that are no longer needed", "Making every node visited during a find point directly at the group's representative",
        "Compressing the array into a smaller size", "Removing duplicate elements from a group",
      ], 1),
      mcq("q3", "Union by rank/size works by:", [
        "Always attaching the smaller tree under the larger tree's root, never the reverse", "Always attaching the larger tree under the smaller tree's root",
        "Picking a random root to attach to", "Sorting elements by rank before every union",
      ], 0),
      mcq("q4", "With both path compression and union by rank, the amortized time per Union-Find operation is:", [
        "O(n)", "O(log n)", "Nearly O(1) - technically O(alpha(n)), the inverse Ackermann function", "O(n log n)",
      ], 2),
      mcq("q5", "Union-Find lets you detect a cycle in an undirected graph by:", [
        "Running a full DFS before adding every edge", "Before adding an edge u-v, checking whether find(u) == find(v) already - if so, the edge would close a cycle",
        "Checking if the graph has more than n-1 edges", "Sorting all edges first",
      ], 1),
    ],
  },
  {
    date: "2026-09-01", dow: "tue", type: "lesson",
    title: "Day 36: Kruskal's Algorithm - Building a Minimum Spanning Tree",
    problemIds: [
      "XEznkKp4tshNzS4qr45o", // Minimum Spanning Tree Weight (Medium, Graph/Heap/Greedy)
      "ebEYVRW6rXroB1dTT3Ty", // Kruskal's Algorithm - MST Edges (Medium, Graph/Greedy)
    ],
    concept:
`A MINIMUM SPANNING TREE (MST) of a connected, undirected, weighted graph is a subset of its edges that connects every vertex, contains no cycle, and has the smallest possible total edge weight among all such subsets. A spanning tree over n vertices always has exactly n - 1 edges - one less than the vertex count, the same relationship a tree always has.

KRUSKAL'S ALGORITHM builds an MST by working on EDGES, globally, sorted by weight:
  1. Sort every edge in the graph in ascending order of weight.
  2. Walk the sorted list. For each edge (u, v, w): if u and v are already in the same Union-Find group, SKIP it (adding it would close a cycle, since they are already connected some other way). Otherwise, ADD the edge to the MST and UNION u and v's groups.
  3. Stop once n - 1 edges have been added - the tree is complete.

Yesterday's Union-Find is not incidental here - it is exactly the mechanism that answers "would this edge create a cycle" in near-O(1), which is what makes checking every edge in sorted order actually cheap.

WHY THE GREEDY CHOICE IS CORRECT: at every step, Kruskal's takes the cheapest available edge that does not create a cycle. This is provably safe (the "cut property" of MSTs: for any way of splitting the vertices into two groups, the cheapest edge crossing that split must belong to SOME minimum spanning tree) - so no cheaper alternative is ever passed over in a way that could have led to a better final answer. This is one of the few genuinely correct textbook greedy algorithms, not just a heuristic.

  worked example - edges (u, v, weight): (2,3,4) (0,3,5) (0,2,6) (0,1,10) (1,3,15)
  sorted ascending:                      (2,3,4) (0,3,5) (0,2,6) (0,1,10) (1,3,15)
  process (2,3,4): different groups -> ADD.        groups: {2,3} {0} {1}
  process (0,3,5): different groups -> ADD.        groups: {0,2,3} {1}
  process (0,2,6): 0 and 2 already same group -> SKIP (would close a cycle)
  process (0,1,10): different groups -> ADD.       groups: {0,1,2,3}    <- 3 edges added, n=4, done
  MST weight = 4 + 5 + 10 = 19

COMPLEXITY: sorting the edges is O(E log E), and the E union-find operations that follow cost close to O(E) total - so the sort dominates, making Kruskal's overall O(E log E). It is the natural choice when a graph is SPARSE (edges given as a plain list, not many of them relative to the vertex count), since it never needs to build or scan an adjacency structure at all.`,
    mcqs: [
      mcq("q1", "Kruskal's algorithm processes edges in what order?", [
        "Ascending order of weight", "Descending order of weight", "The order they appear in the input", "Randomly",
      ], 0),
      mcq("q2", "Kruskal's algorithm uses which data structure to decide whether adding an edge would create a cycle?", [
        "A stack", "Union-Find (Disjoint Set Union)", "A min-heap", "A hash map",
      ], 1),
      mcq("q3", "A minimum spanning tree of a graph with n vertices has exactly:", [
        "n edges", "n - 1 edges", "n + 1 edges", "2n edges",
      ], 1),
      mcq("q4", "Kruskal's overall time complexity is dominated by:", [
        "The Union-Find operations", "Sorting the edges, O(E log E)", "Building an adjacency matrix", "Running BFS from every vertex",
      ], 1),
      mcq("q5", "Kruskal's algorithm is the natural choice when a graph is:", [
        "Dense (many edges relative to vertices)", "Sparse (few edges relative to vertices), since it works directly off the edge list",
        "Disconnected", "A tree already",
      ], 1),
    ],
  },
  {
    date: "2026-09-02", dow: "wed", type: "lesson",
    title: "Day 37: Prim's Algorithm - The Other Way to Build an MST",
    problemIds: [
      "NMgGoACg6uCj9BE54P5I", // Prim's Algorithm - MST Edges (Medium, Graph/Heap/Greedy)
    ],
    concept:
`Prim's algorithm builds the same kind of result as Kruskal's - a minimum spanning tree - by a completely different route: instead of considering every edge in the graph globally, it grows ONE connected tree outward from a single starting vertex, one edge at a time.

THE ALGORITHM, starting from any vertex (vertex 0 by convention):
  1. Mark the start vertex as "in the tree". Every other vertex is "outside".
  2. Repeat: among all edges with exactly one endpoint inside the tree and one outside, pick the one with the SMALLEST weight. Add it to the MST, and move its outside endpoint into the tree.
  3. Stop once every vertex is inside the tree.

THE DATA STRUCTURE THAT MAKES THIS EFFICIENT is a min-heap of (weight, vertex) pairs - exactly the same structure Dijkstra used two weeks ago. Push every edge leaving the tree as it becomes available; repeatedly pop the smallest; if its far endpoint is already inside the tree, that entry is stale (a cheaper way in was already found) - skip it, the same "stale pop" check Dijkstra's algorithm needed.

  worked example - same graph as yesterday: edges (2,3,4) (0,3,5) (0,2,6) (0,1,10) (1,3,15), start at vertex 0
  tree = {0}. Edges out of the tree: (0,1,10) (0,2,6) (0,3,5). Cheapest: (0,3,5) -> ADD.   tree = {0,3}
  Edges out of the tree now include 3's edges too: (0,1,10) (0,2,6) (2,3,4) (1,3,15). Cheapest: (2,3,4) -> ADD.   tree = {0,2,3}
  Remaining: (0,1,10) (1,3,15). Cheapest: (0,1,10) -> ADD.   tree = {0,1,2,3}, done.
  MST weight = 5 + 4 + 10 = 19  <- same total Kruskal's found, as it must; an MST's TOTAL weight is unique even when the exact edge set built along the way differs.

PRIM'S vs KRUSKAL'S is a genuine choice, not just two roads to the same place with no trade-off: Prim's grows a single connected tree and never needs to check for cycles at all (every candidate edge by construction has exactly one endpoint already in the tree, so it can never close a cycle) - Kruskal's, by contrast, considers edges with no regard for connectivity and relies on Union-Find specifically to rule cycles out.

COMPLEXITY: with a binary heap, O(E log V) - identical to Dijkstra's, and for the same reason (every edge can trigger one push, each push/pop costs O(log V)). Prim's is generally preferred on DENSE graphs (given as an adjacency list/matrix rather than a bare edge list), where growing outward from one vertex avoids ever touching the far side of the graph; Kruskal's is preferred on SPARSE graphs, where sorting a short edge list is cheap and there is no adjacency structure to build in the first place.`,
    mcqs: [
      mcq("q1", "Prim's algorithm builds the MST by:", [
        "Sorting every edge in the graph first", "Growing a single tree from a start vertex, always adding the cheapest edge connecting the tree to a new vertex",
        "Running DFS from every vertex", "Removing the heaviest edges one at a time",
      ], 1),
      mcq("q2", "The data structure that makes Prim's algorithm efficient is:", [
        "A stack", "A min-heap of (weight, vertex) pairs - the same structure Dijkstra uses", "A hash set", "A trie",
      ], 1),
      mcq("q3", "The key difference between Prim's and Kruskal's algorithms is that Prim's:", [
        "Cannot handle weighted graphs", "Grows one connected tree outward, so it never needs a separate cycle check, unlike Kruskal's which relies on Union-Find",
        "Always produces a different total MST weight than Kruskal's", "Only works on directed graphs",
      ], 1),
      mcq("q4", "With a binary heap, Prim's algorithm's time complexity is:", [
        "O(V + E)", "O(E log V)", "O(V^2 log E)", "O(E^2)",
      ], 1),
      mcq("q5", "Prim's algorithm is generally preferred over Kruskal's when the graph is:", [
        "Sparse, given as a bare edge list", "Dense (given as an adjacency list/matrix, many edges relative to vertices)",
        "Disconnected", "Directed",
      ], 1),
    ],
  },
  {
    date: "2026-09-03", dow: "thu", type: "lesson",
    title: "Day 38: Bellman-Ford Algorithm - Shortest Paths with Negative Edges",
    problemIds: [
      "P6slTgAZZXjL35Jtv3JP", // Bellman-Ford - Shortest Paths From a Source (Medium, Graph)
      "5n2vnDQ1pAA8B9VvmV0C", // Bellman-Ford - Detect a Negative-Weight Cycle (Hard, Graph)
    ],
    concept:
`Dijkstra's algorithm (Day 34) explicitly required every edge weight to be non-negative - a negative edge can make a vertex's already-"finalised" distance wrong later, which breaks the greedy min-heap logic Dijkstra depends on. BELLMAN-FORD is the algorithm that handles negative edges correctly, at the cost of being slower.

THE ALGORITHM is deliberately simple - no heap, no greedy choice, just brute-force repetition:
  dist[source] = 0, every other vertex = infinity
  repeat (V - 1) times:
    for every edge (u, v, w) in the graph:
      if dist[u] + w < dist[v]: dist[v] = dist[u] + w     # "relax" the edge

WHY EXACTLY (V - 1) ROUNDS SUFFICE: the shortest SIMPLE path between any two vertices (one that never revisits a vertex) can have at most V - 1 edges - there are only V vertices to visit. Each full round of relaxing every edge is guaranteed to correctly extend the shortest path found so far by at least one more edge, in the worst case. So after V - 1 rounds, every shortest path - however many edges it needs, up to the maximum possible - has been fully found.

DETECTING A NEGATIVE-WEIGHT CYCLE: run ONE additional (the V-th) round of relaxation. If ANY distance can still improve on this extra round, that improvement could only come from a cycle whose total weight is negative - a real shortest path can never need more than V - 1 edges, so any edge that still relaxes after V - 1 rounds is proof a negative cycle is reachable from the source (and "shortest path" stops being well-defined, since you could loop the cycle forever to keep decreasing the distance).

  worked example - edges (u,v,w): (0,1,6) (0,2,7) (1,2,8) (1,3,5) (1,4,-4) (2,3,-3) (2,4,9) (3,1,-2) (4,3,7) (4,0,2), source = 0, V = 5
  init: dist = [0, inf, inf, inf, inf]
  round 1 relaxes (0,1,6) and (0,2,7): dist = [0, 6, 7, inf, inf]
  round 2 relaxes (1,2,8)->no improvement (7<14), (1,3,5)->dist[3]=11, (1,4,-4)->dist[4]=2, (2,3,-3)->dist[3]=min(11,7-3=4)=4
  round 3 relaxes (3,1,-2)->dist[1]=min(6,4-2=2)=2, which then lets (1,4,-4) improve dist[4] to 2-4=-2
  after V-1=4 rounds this settles to: dist = [0, 2, 7, 4, -2]  <- matches the verified answer for this exact graph
  a 5th round changes nothing further, confirming no negative cycle is reachable from 0.

COMPLEXITY: O(V * E) - V - 1 rounds, each scanning every one of the E edges. This is worse than Dijkstra's O(E log V), which is exactly the price paid for correctly handling negative weights - reach for Bellman-Ford only when negative edges are actually possible, and Dijkstra otherwise.`,
    mcqs: [
      mcq("q1", "Bellman-Ford is needed instead of Dijkstra specifically when:", [
        "The graph is very large", "The graph has negative edge weights", "The graph is directed", "The graph has cycles",
      ], 1),
      mcq("q2", "Bellman-Ford relaxes every edge how many times to guarantee correct shortest distances?", [
        "V (the vertex count)", "V - 1", "E (the edge count)", "log V",
      ], 1),
      mcq("q3", "Bellman-Ford's (V - 1)-round bound works because:", [
        "There are only V - 1 edges in any graph", "Any shortest SIMPLE path in a graph with V vertices has at most V - 1 edges",
        "The algorithm always converges in V - 1 steps regardless of graph size", "V - 1 is just a safety margin with no real justification",
      ], 1),
      mcq("q4", "To detect a negative-weight cycle, Bellman-Ford:", [
        "Checks if any edge weight is negative before starting", "Performs one additional (V-th) relaxation pass - if any distance still improves, a negative cycle is reachable",
        "Cannot detect negative cycles at all", "Runs Dijkstra afterward as a check",
      ], 1),
      mcq("q5", "Bellman-Ford's time complexity is:", [
        "O(E log V)", "O(V * E)", "O(V + E)", "O(V^2 * E^2)",
      ], 1),
    ],
  },
  {
    date: "2026-09-04", dow: "fri", type: "lesson",
    title: "Day 39: Floyd-Warshall Algorithm - Shortest Paths Between Every Pair",
    problemIds: [
      "Iqr4LUi6CFx66m1Oolao", // Floyd-Warshall - All-Pairs Shortest Paths (Medium, Graph/Matrix)
    ],
    concept:
`Every shortest-path algorithm this week and last has been SINGLE-SOURCE: BFS, Dijkstra and Bellman-Ford all answer "shortest distance from one source to everywhere else". FLOYD-WARSHALL answers a different question entirely: the shortest distance between EVERY pair of vertices, all at once.

THE ALGORITHM is a dynamic program over which vertices are allowed as intermediate stops. Start with dist[i][j] = the direct edge weight from i to j (or infinity if no direct edge, 0 when i == j). Then, for each vertex k in turn, ask: for every pair (i, j), is the path i -> k -> j shorter than the best path found so far?

  for k in 0..V-1:
    for i in 0..V-1:
      for j in 0..V-1:
        if dist[i][k] + dist[k][j] < dist[i][j]:
          dist[i][j] = dist[i][k] + dist[k][j]

WHY THIS IS CORRECT: after the outer loop has processed vertices 0 through k, dist[i][j] holds the shortest path from i to j using ONLY vertices 0..k as allowed intermediate stops. Processing vertex k extends that guarantee by exactly one more allowed vertex: either the best path still doesn't need to pass through k (dist[i][j] stays as it was), or it does, in which case it splits cleanly into a best path from i to k, followed by a best path from k to j - both of which were already correctly computed using vertices 0..k-1, one loop iteration ago. By the time k reaches V - 1, every vertex is an allowed intermediate, and every dist[i][j] is the true shortest path.

  worked example - edges (undirected, so listed both directions): 0-1 (5), 1-2 (3), 2-3 (1), 0-3 (10)
  initial: dist[0][3] = 10 (the only direct edge)
  after k=1: dist[0][2] relaxes via 0->1->2 = 5+3 = 8 (was infinity)
  after k=2: dist[0][3] relaxes via 0->2->3 = 8+1 = 9, beating the direct edge's 10
  final dist[0][3] = 9  <- matches the verified answer for this exact graph (the full matrix is 4x4, symmetric since the graph is undirected)

COMPLEXITY: O(V^3) - three nested loops over every vertex. This is why Floyd-Warshall is only practical for SMALL-to-MEDIUM, DENSE graphs (a few hundred vertices at most) - the published problem for today caps V at 500 for exactly this reason. It correctly handles negative edge weights, provided there is no negative-weight CYCLE anywhere in the graph (same caveat Bellman-Ford has).

WHEN TO REACH FOR IT over running Bellman-Ford or Dijkstra from every single vertex: when you genuinely need every pair's distance (not just one source's), and the graph is small/dense enough that O(V^3) is competitive with V separate single-source runs - and because the three-loop structure is far simpler to implement correctly than V repeated single-source calls.`,
    mcqs: [
      mcq("q1", "Floyd-Warshall computes:", [
        "The shortest path from one source to everywhere else", "Shortest distances between EVERY pair of vertices, all at once",
        "The minimum spanning tree", "Whether a graph is bipartite",
      ], 1),
      mcq("q2", "Floyd-Warshall's core recurrence relaxes dist[i][j] by considering:", [
        "Only the direct edge between i and j", "Whether going through an intermediate vertex k gives a shorter path: dist[i][k] + dist[k][j]",
        "The degree of vertex i", "A random intermediate vertex",
      ], 1),
      mcq("q3", "Floyd-Warshall's time complexity is:", [
        "O(V^2)", "O(V log V)", "O(V^3)", "O(E log V)",
      ], 2),
      mcq("q4", "Floyd-Warshall correctly handles negative edge weights as long as:", [
        "All edges are negative", "There is no negative-weight CYCLE anywhere in the graph", "The graph is undirected", "V is less than 10",
      ], 1),
      mcq("q5", "Floyd-Warshall is typically preferred over running Bellman-Ford from every vertex when:", [
        "The graph is huge and sparse", "You need every pair's distance and the graph is small/dense enough that O(V^3) is competitive",
        "The graph has only one vertex", "Negative edges are impossible",
      ], 1),
    ],
  },
  {
    date: "2026-09-05", dow: "sat", type: "test",
    title: "Week 7 Master Test: Advanced Graph Algorithms",
    xpReward: 150, coinReward: 60,
    // Two problems the week's lessons did NOT set, so this tests transfer
    // rather than recall. "Making Wired Connections" reuses Day 35's
    // Union-Find to count components and check reconnectability - not an
    // algorithm taught this week, but the exact data structure. "Total
    // Number of Spanning Trees" (tiny n) is solvable by brute-forcing every
    // candidate edge subset of size n-1 and verifying connectivity with
    // Union-Find - the same transfer, applied to a counting problem instead
    // of a yes/no one.
    problemIds: [
      "Bon0UzVIDbGIBlODQuxR", // Making Wired Connections (Medium, Graph)
      "on50U8ZPSydqfqpTNIP8", // Total Number of Spanning Trees in a Graph (Hard, Graph)
    ],
    concept:
`Everything from Days 35-39: Union-Find (path compression + union by rank, near-O(1) amortized), Kruskal's algorithm (sort edges, add greedily, skip anything that would close a cycle per Union-Find), Prim's algorithm (grow one tree outward with a min-heap, same machinery as Dijkstra), Bellman-Ford (V-1 relaxation rounds for negative edges, a V-th round to detect a negative cycle), and Floyd-Warshall (all-pairs shortest paths via a triple loop over intermediate vertices, O(V^3)).

Ten questions, then two problems - deliberately ones you have not been set this week, so they test whether you understood the ideas rather than memorised the exercises. Watch for "Making Wired Connections" in particular: it is Day 35's Union-Find used for something you were never shown directly - counting how many separate groups exist, and whether enough spare wires exist to merge them into one.`,
    mcqs: [
      mcq("q1", "Union-Find's two key optimizations are:", [
        "Sorting and binary search", "Path compression and union by rank/size", "Recursion and memoization", "Hashing and chaining",
      ], 1),
      mcq("q2", "The amortized time per Union-Find operation with both optimizations is:", [
        "O(n)", "O(log n)", "Nearly O(1) - technically O(alpha(n))", "O(n^2)",
      ], 2),
      mcq("q3", "Kruskal's algorithm adds each sorted edge unless:", [
        "It is the heaviest edge remaining", "Its two endpoints are already in the same Union-Find group (adding it would create a cycle)",
        "It is the first edge processed", "The graph is already connected",
      ], 1),
      mcq("q4", "A minimum spanning tree of a connected graph with V vertices has exactly:", [
        "V edges", "V - 1 edges", "V + 1 edges", "2V edges",
      ], 1),
      mcq("q5", "Prim's algorithm differs from Kruskal's in that it:", [
        "Grows a single tree from a start vertex rather than considering edges globally", "Cannot handle weighted graphs",
        "Always finds a different total MST weight", "Does not need any special data structure",
      ], 0),
      mcq("q6", "Bellman-Ford handles a case Dijkstra cannot:", [
        "Disconnected graphs", "Negative edge weights", "Directed graphs", "Graphs with cycles",
      ], 1),
      mcq("q7", "Bellman-Ford relaxes every edge V - 1 times because:", [
        "That is an arbitrary safety margin", "The longest possible shortest SIMPLE path has at most V - 1 edges",
        "There are exactly V - 1 edges in any graph", "V - 1 is always a prime number",
      ], 1),
      mcq("q8", "Floyd-Warshall's recurrence relaxes dist[i][j] via:", [
        "The degree of vertex i", "An intermediate vertex k: dist[i][k] + dist[k][j]", "A random neighbour of j", "Sorting all vertices first",
      ], 1),
      mcq("q9", "Floyd-Warshall computes shortest paths:", [
        "From one source to everywhere else", "Between every pair of vertices (all-pairs)", "Only for adjacent vertex pairs", "Only for the two farthest vertices",
      ], 1),
      mcq("q10", "Detecting a negative-weight cycle with Bellman-Ford requires:", [
        "Checking every edge weight before starting", "One extra (V-th) relaxation pass - if any distance still improves, a cycle exists",
        "Running Floyd-Warshall instead", "Nothing extra - it is detected automatically after V - 1 rounds",
      ], 1),
    ],
  },
];

async function main() {
  const col = db.collection("institutions").doc(INSTITUTION_ID).collection("dailyLearning");

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
