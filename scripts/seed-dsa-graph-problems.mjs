import admin from "firebase-admin";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(join(__dirname, "service-account.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// DSA-450-sheet ingestion, GRAPH topic. Traversal-order problems (BFS/DFS,
// topological sort) fix a deterministic tie-break rule (always the smallest
// available vertex number) since a graph can have multiple valid orders
// otherwise - stated explicitly in each problem. Rows with no single correct
// answer as stated (word ladder's dictionary format varies, snake-and-ladder
// needs a whole board layout) are skipped.

const REWARD = { Easy: [30, 10], Medium: [50, 20], Hard: [80, 30] };
function p(title, category, difficulty, tags, statement, constraints, examplesText, hints, sampleTests, hiddenTests) {
  const [xpReward, coinReward] = REWARD[difficulty];
  return { title, category, difficulty, tags, statement, constraints, examplesText, hints, xpReward, coinReward, sampleTests, hiddenTests };
}

const PROBLEMS = [

p("BFS Traversal of a Graph", "Graphs", "Easy", ["Graph", "Queue"],
  "Given an undirected graph with n vertices (0-indexed) and m edges, and a starting vertex, print its breadth-first traversal order starting from that vertex, space-separated. When multiple unvisited neighbors are available, visit them in ascending order of vertex number. Only vertices reachable from the start should appear.",
  "1 <= n <= 10^5",
  "Input:\n5\n4\n0 1\n0 2\n1 3\n2 4\n0\nOutput:\n0 1 2 3 4",
  ["Use a queue: dequeue a vertex, visit it, then enqueue its unvisited neighbors in ascending order.", "Mark a vertex visited the moment it's enqueued, not when it's dequeued, to avoid enqueuing it twice."],
  [{ input: "5\n4\n0 1\n0 2\n1 3\n2 4\n0", expectedOutput: "0 1 2 3 4", explanation: "" },
   { input: "4\n3\n0 1\n1 2\n2 3\n0", expectedOutput: "0 1 2 3", explanation: "" }],
  [{ input: "1\n0\n0", expectedOutput: "0", points: 1 },
   { input: "3\n2\n0 1\n0 2\n1", expectedOutput: "1 0 2", points: 1 },
   { input: "4\n0\n0", expectedOutput: "0", points: 1 }]),

p("DFS Traversal of a Graph", "Graphs", "Easy", ["Graph"],
  "Given an undirected graph with n vertices (0-indexed) and m edges, and a starting vertex, print its depth-first traversal order starting from that vertex, space-separated. When multiple unvisited neighbors are available, visit them in ascending order of vertex number. Only vertices reachable from the start should appear.",
  "1 <= n <= 10^5",
  "Input:\n5\n4\n0 1\n0 2\n1 3\n2 4\n0\nOutput:\n0 1 3 2 4",
  ["Recursively visit the current vertex, then recurse into its smallest unvisited neighbor first, continuing to fully explore that branch before returning to try the next neighbor.", "An explicit stack works too, as long as you push neighbors in a way that pops the smallest one first."],
  [{ input: "5\n4\n0 1\n0 2\n1 3\n2 4\n0", expectedOutput: "0 1 3 2 4", explanation: "" },
   { input: "4\n3\n0 1\n1 2\n2 3\n0", expectedOutput: "0 1 2 3", explanation: "" }],
  [{ input: "1\n0\n0", expectedOutput: "0", points: 1 },
   { input: "3\n2\n0 1\n0 2\n1", expectedOutput: "1 0 2", points: 1 },
   { input: "4\n0\n0", expectedOutput: "0", points: 1 }]),

p("Detect a Cycle in an Undirected Graph", "Graphs", "Medium", ["Graph"],
  "Given an undirected graph with n vertices and m edges, print 'Yes' if it contains a cycle, otherwise 'No'.",
  "1 <= n <= 10^5",
  "Input:\n4\n4\n0 1\n1 2\n2 3\n3 0\nOutput:\nYes",
  ["Do a DFS (or BFS) from every unvisited vertex, tracking each vertex's parent in the traversal.", "If you reach an already-visited vertex that isn't the current vertex's immediate parent, you've found a cycle."],
  [{ input: "4\n4\n0 1\n1 2\n2 3\n3 0", expectedOutput: "Yes", explanation: "" },
   { input: "4\n3\n0 1\n1 2\n2 3", expectedOutput: "No", explanation: "" }],
  [{ input: "1\n0", expectedOutput: "No", points: 1 },
   { input: "3\n3\n0 1\n1 2\n2 0", expectedOutput: "Yes", points: 1 },
   { input: "5\n2\n0 1\n3 4", expectedOutput: "No", points: 1 }]),

p("Detect a Cycle in a Directed Graph", "Graphs", "Medium", ["Graph"],
  "Given a directed graph with n vertices and m edges, print 'Yes' if it contains a cycle, otherwise 'No'.",
  "1 <= n <= 10^5",
  "Input:\n3\n3\n0 1\n1 2\n2 0\nOutput:\nYes",
  ["Do a DFS from every unvisited vertex, tracking which vertices are currently 'on the recursion stack' (in progress) versus fully finished.", "A back-edge to a vertex that's still on the current recursion stack means a cycle - a self-loop (an edge from a vertex to itself) also counts as a cycle."],
  [{ input: "3\n3\n0 1\n1 2\n2 0", expectedOutput: "Yes", explanation: "" },
   { input: "3\n2\n0 1\n1 2", expectedOutput: "No", explanation: "" }],
  [{ input: "1\n1\n0 0", expectedOutput: "Yes", points: 1 },
   { input: "2\n2\n0 1\n1 0", expectedOutput: "Yes", points: 1 },
   { input: "4\n4\n0 1\n0 2\n1 3\n2 3", expectedOutput: "No", points: 1 }]),

p("Topological Sort of a Directed Acyclic Graph", "Graphs", "Medium", ["Graph"],
  "Given a directed acyclic graph with n vertices (0-indexed) and m edges, print a valid topological order of its vertices, space-separated. Since multiple valid orders can exist, use Kahn's algorithm and always process the smallest-numbered vertex among those currently available (in-degree 0).",
  "1 <= n <= 10^5",
  "Input:\n6\n6\n5 2\n5 0\n4 0\n4 1\n2 3\n3 1\nOutput:\n4 5 0 2 3 1",
  ["Compute every vertex's in-degree, and start with all in-degree-0 vertices in a min-priority-queue (or sorted set) instead of a plain queue, so ties always resolve to the smallest vertex.", "When you process a vertex, decrement its neighbors' in-degrees, adding any that drop to 0 into the same ordered structure."],
  [{ input: "6\n6\n5 2\n5 0\n4 0\n4 1\n2 3\n3 1", expectedOutput: "4 5 0 2 3 1", explanation: "" },
   { input: "3\n2\n0 1\n1 2", expectedOutput: "0 1 2", explanation: "" }],
  [{ input: "1\n0", expectedOutput: "0", points: 1 },
   { input: "2\n1\n1 0", expectedOutput: "1 0", points: 1 },
   { input: "4\n4\n0 1\n0 2\n1 3\n2 3", expectedOutput: "0 1 2 3", points: 1 }]),

p("Count Connected Components in an Undirected Graph", "Graphs", "Easy", ["Graph"],
  "Given an undirected graph with n vertices and m edges, count the number of connected components (an isolated vertex with no edges counts as its own component).",
  "1 <= n <= 10^5",
  "Input:\n5\n2\n0 1\n1 2\nOutput:\n2",
  ["Run a BFS or DFS from every not-yet-visited vertex, marking everything it reaches as visited.", "Each time you start a fresh traversal from an unvisited vertex, that's one more component."],
  [{ input: "5\n2\n0 1\n1 2", expectedOutput: "3", explanation: "{0,1,2}, {3}, and {4} are the three components." },
   { input: "4\n0", expectedOutput: "4", explanation: "" }],
  [{ input: "1\n0", expectedOutput: "1", points: 1 },
   { input: "6\n4\n0 1\n1 2\n2 0\n3 4", expectedOutput: "3", points: 1 },
   { input: "3\n3\n0 1\n1 2\n2 0", expectedOutput: "1", points: 1 }]),

p("Number of Islands in a 2D Grid", "Graphs", "Medium", ["Graph", "Matrix"],
  "Given a grid of 0s (water) and 1s (land), count the number of islands - maximal groups of land cells connected horizontally or vertically (not diagonally).",
  "1 <= rows, cols <= 1000",
  "Input:\n4 5\n1 1 0 0 0\n1 1 0 0 0\n0 0 1 0 0\n0 0 0 1 1\nOutput:\n3",
  ["Scan every cell; whenever you find an unvisited land cell, that's a new island - flood-fill outward from it (BFS or DFS) marking every connected land cell as visited.", "Only 4-directional neighbors (up, down, left, right) count as connected, not diagonal ones."],
  [{ input: "4 5\n1 1 0 0 0\n1 1 0 0 0\n0 0 1 0 0\n0 0 0 1 1", expectedOutput: "3", explanation: "" },
   { input: "3 3\n1 1 1\n1 1 1\n1 1 1", expectedOutput: "1", explanation: "" }],
  [{ input: "2 2\n0 0\n0 0", expectedOutput: "0", points: 1 },
   { input: "2 2\n1 0\n0 1", expectedOutput: "2", points: 1 },
   { input: "3 3\n1 1 1\n0 1 0\n1 1 1", expectedOutput: "1", points: 1 }]),

p("Check if a Graph Is Bipartite", "Graphs", "Medium", ["Graph"],
  "Given an undirected graph with n vertices and m edges, print 'Yes' if its vertices can be split into two groups such that every edge connects a vertex in one group to a vertex in the other (equivalently, it has no odd-length cycle), otherwise print 'No'.",
  "1 <= n <= 10^5",
  "Input:\n4\n4\n0 1\n1 2\n2 3\n3 0\nOutput:\nYes",
  ["Try 2-coloring the graph with a BFS or DFS: color the start vertex, then alternate colors for every neighbor.", "If you ever need to color a vertex differently from a color it's already been assigned, the graph isn't bipartite."],
  [{ input: "4\n4\n0 1\n1 2\n2 3\n3 0", expectedOutput: "Yes", explanation: "" },
   { input: "3\n3\n0 1\n1 2\n2 0", expectedOutput: "No", explanation: "" }],
  [{ input: "1\n0", expectedOutput: "Yes", points: 1 },
   { input: "2\n1\n0 1", expectedOutput: "Yes", points: 1 },
   { input: "5\n5\n0 1\n1 2\n2 3\n3 4\n4 0", expectedOutput: "No", points: 1 }]),

p("Dijkstra's Shortest Path From a Source", "Graphs", "Medium", ["Graph", "Heap"],
  "Given an undirected weighted graph with n vertices (0-indexed), m edges (each u, v, weight - all weights non-negative), and a source vertex, find the shortest distance from the source to every vertex. Print the n distances, space-separated, in vertex order; print 'INF' for any vertex unreachable from the source.",
  "1 <= n <= 10^5, 0 <= weight <= 10^4",
  "Input:\n5\n6\n0 1 4\n0 2 1\n2 1 2\n1 3 1\n2 3 5\n3 4 3\n0\nOutput:\n0 3 1 4 7",
  ["Use a min-heap keyed by current best known distance; repeatedly extract the closest unfinished vertex and relax its edges.", "Once a vertex is finalized (popped from the heap), its distance never needs to change again."],
  [{ input: "5\n6\n0 1 4\n0 2 1\n2 1 2\n1 3 1\n2 3 5\n3 4 3\n0", expectedOutput: "0 3 1 4 7", explanation: "" },
   { input: "3\n2\n0 1 5\n1 2 3\n0", expectedOutput: "0 5 8", explanation: "" }],
  [{ input: "1\n0\n0", expectedOutput: "0", points: 1 },
   { input: "3\n0\n0", expectedOutput: "0 INF INF", points: 1 },
   { input: "4\n4\n0 1 1\n1 2 1\n0 2 4\n2 3 1\n0", expectedOutput: "0 1 2 3", points: 1 }]),

p("Bellman-Ford - Detect a Negative-Weight Cycle", "Graphs", "Hard", ["Graph"],
  "Given a directed weighted graph with n vertices, m edges (each u, v, weight - weights may be negative), and a source vertex, print 'Yes' if there is a negative-weight cycle reachable from the source, otherwise 'No'.",
  "1 <= n <= 10^4",
  "Input:\n3\n3\n0 1 1\n1 2 -1\n2 0 -1\n0\nOutput:\nYes",
  ["Run n-1 rounds of relaxing every edge (standard Bellman-Ford) to compute shortest distances assuming no negative cycle.", "Then run one more round: if any edge can still be relaxed (found even shorter), a negative cycle reachable from the source exists."],
  [{ input: "3\n3\n0 1 1\n1 2 -1\n2 0 -1\n0", expectedOutput: "Yes", explanation: "" },
   { input: "3\n2\n0 1 1\n1 2 2\n0", expectedOutput: "No", explanation: "" }],
  [{ input: "1\n0\n0", expectedOutput: "No", points: 1 },
   { input: "2\n2\n0 1 -5\n1 0 1\n0", expectedOutput: "Yes", points: 1 },
   { input: "3\n3\n0 1 5\n1 2 -3\n2 0 1\n0", expectedOutput: "No", points: 1 }]),

p("Minimum Spanning Tree Weight", "Graphs", "Medium", ["Graph", "Heap", "Greedy"],
  "Given a connected undirected weighted graph with n vertices and m edges (each u, v, weight), find the total weight of its minimum spanning tree.",
  "1 <= n <= 10^5",
  "Input:\n4\n5\n0 1 10\n0 2 6\n0 3 5\n1 3 15\n2 3 4\nOutput:\n19",
  ["Prim's algorithm: grow a tree from any starting vertex, always adding the cheapest edge that connects a new vertex - a min-heap of candidate edges makes this efficient.", "Kruskal's algorithm is an equally valid alternative: sort all edges by weight and greedily add each one that doesn't create a cycle, using a union-find structure to check that quickly."],
  [{ input: "4\n5\n0 1 10\n0 2 6\n0 3 5\n1 3 15\n2 3 4", expectedOutput: "19", explanation: "" },
   { input: "3\n3\n0 1 1\n1 2 2\n0 2 3", expectedOutput: "3", explanation: "" }],
  [{ input: "1\n0", expectedOutput: "0", points: 1 },
   { input: "2\n1\n0 1 7", expectedOutput: "7", points: 1 },
   { input: "4\n4\n0 1 1\n1 2 1\n2 3 1\n3 0 1", expectedOutput: "3", points: 1 }]),

p("Count Strongly Connected Components", "Graphs", "Hard", ["Graph"],
  "Given a directed graph with n vertices and m edges, count the number of strongly connected components - maximal groups of vertices where every vertex in the group can reach every other vertex in the group.",
  "1 <= n <= 10^5",
  "Input:\n5\n5\n1 0\n0 2\n2 1\n0 3\n3 4\nOutput:\n3",
  ["Kosaraju's algorithm: do a DFS recording finish order, then DFS the graph with all edges reversed, processing vertices in reverse finish order - each DFS tree in that second pass is one SCC.", "Every vertex belongs to exactly one SCC, even an isolated vertex with no edges at all (it's trivially strongly connected to itself)."],
  [{ input: "5\n5\n1 0\n0 2\n2 1\n0 3\n3 4", expectedOutput: "3", explanation: "" },
   { input: "4\n3\n0 1\n1 2\n2 3", expectedOutput: "4", explanation: "" }],
  [{ input: "1\n0", expectedOutput: "1", points: 1 },
   { input: "2\n2\n0 1\n1 0", expectedOutput: "1", points: 1 },
   { input: "3\n2\n0 1\n1 2", expectedOutput: "3", points: 1 }]),

p("Minimum Steps for a Knight to Reach a Target Square", "Graphs", "Medium", ["Graph", "Matrix"],
  "On an n x n chessboard (0-indexed rows and columns), given a knight's starting square and a target square, find the minimum number of knight moves needed to reach the target.",
  "1 <= n <= 1000",
  "Input:\n8\n0 0\n7 7\nOutput:\n6",
  ["This is a shortest-path problem on an unweighted graph where each square connects to up to 8 others (the knight's possible moves) - BFS from the start finds the minimum move count directly.", "Be careful to stay within the board's bounds when generating a square's knight-move neighbors."],
  [{ input: "8\n0 0\n7 7", expectedOutput: "6", explanation: "" },
   { input: "8\n0 0\n1 2", expectedOutput: "1", explanation: "" }],
  [{ input: "8\n0 0\n0 0", expectedOutput: "0", points: 1 },
   { input: "1\n0 0\n0 0", expectedOutput: "0", points: 1 },
   { input: "8\n0 0\n0 1", expectedOutput: "3", points: 1 }]),

p("Flood Fill Algorithm", "Graphs", "Easy", ["Graph", "Matrix"],
  "Given a grid of integers, a starting cell, and a new color, replace the color of every cell in the starting cell's connected region (4-directionally connected cells sharing the starting cell's original color) with the new color. Print the resulting grid, one row per line, space-separated.",
  "1 <= rows, cols <= 1000",
  "Input:\n3 3\n1 1 1\n1 1 0\n1 0 1\n1 1\n2\nOutput:\n2 2 2\n2 2 0\n2 0 1",
  ["BFS or DFS outward from the starting cell, only continuing into neighbors that still have the original color.", "The lone cell with the original color that isn't 4-directionally connected to the start must be left unchanged - check connectivity, not just matching color."],
  [{ input: "3 3\n1 1 1\n1 1 0\n1 0 1\n1 1\n2", expectedOutput: "2 2 2\n2 2 0\n2 0 1", explanation: "" },
   { input: "2 2\n0 0\n0 0\n0 0\n1", expectedOutput: "1 1\n1 1", explanation: "" }],
  [{ input: "1 1\n5\n0 0\n7", expectedOutput: "7", points: 1 },
   { input: "2 2\n1 2\n2 1\n0 0\n3", expectedOutput: "3 2\n2 1", points: 1 },
   { input: "3 3\n0 0 0\n0 1 0\n0 0 0\n0 0\n5", expectedOutput: "5 5 5\n5 1 5\n5 5 5", points: 1 }]),

p("Rotten Oranges - Minimum Time for All to Rot", "Graphs", "Medium", ["Graph", "Queue"],
  "Given a grid where each cell is 0 (empty), 1 (fresh orange), or 2 (rotten orange), every minute every rotten orange rots its 4-directionally adjacent fresh oranges. Find the minimum number of minutes until no fresh orange remains, or print -1 if some fresh orange can never be reached.",
  "1 <= rows, cols <= 1000",
  "Input:\n3 3\n2 1 1\n1 1 0\n0 1 1\nOutput:\n4",
  ["This is a multi-source BFS: start with every initially rotten orange in the queue at time 0, and expand outward level by level.", "The answer is the time at which the last fresh orange gets rotted - if any fresh orange is left unreached after the BFS finishes, print -1."],
  [{ input: "3 3\n2 1 1\n1 1 0\n0 1 1", expectedOutput: "4", explanation: "" },
   { input: "1 3\n2 1 1", expectedOutput: "2", explanation: "" }],
  [{ input: "1 1\n0", expectedOutput: "0", points: 1 },
   { input: "1 1\n1", expectedOutput: "-1", points: 1 },
   { input: "2 2\n2 1\n0 1", expectedOutput: "2", points: 1 }]),

];

let created = 0, skipped = 0;
for (const prob of PROBLEMS) {
  const existing = await db.collection("problems").where("title", "==", prob.title).get();
  if (!existing.empty) { skipped++; continue; }
  const { sampleTests, hiddenTests, ...problemFields } = prob;
  const problemRef = await db.collection("problems").add({
    ...problemFields, estimatedTime: 20, status: "published",
    totalSubmissions: 0, acceptedSubmissions: 0,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    createdBy: "devert.contact@gmail.com",
  });
  for (const t of sampleTests) await problemRef.collection("sampleTests").add(t);
  for (const t of hiddenTests) await problemRef.collection("hiddenTests").add(t);
  created++;
}
console.log(`GRAPH topic: created ${created} problem(s), skipped ${skipped} already-existing.`);
