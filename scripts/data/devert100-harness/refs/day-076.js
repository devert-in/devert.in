/**
 * @param {number} V
 * @param {number[][]} edges
 * @param {number} src
 * @return {number[]}
 */
var bellmanFord = function(V, edges, src) {
    const INF = 100000000;
    const dist = new Array(V).fill(INF);
    dist[src] = 0;
    for (let i = 0; i < V; i++) {
        for (const [u, v, w] of edges) {
            if (dist[u] !== INF && dist[u] + w < dist[v]) {
                if (i === V - 1) return [-1];
                dist[v] = dist[u] + w;
            }
        }
    }
    return dist;
};
