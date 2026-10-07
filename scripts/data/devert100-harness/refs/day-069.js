/**
 * @param {number} V
 * @param {number[][]} adj
 * @return {boolean}
 */
var isCycle = function(V, adj) {
    const seen = new Array(V).fill(false);
    for (let s = 0; s < V; s++) {
        if (seen[s]) continue;
        seen[s] = true;
        const q = [[s, -1]];
        let h = 0;
        while (h < q.length) {
            const [u, parent] = q[h++];
            for (const v of adj[u]) {
                if (!seen[v]) { seen[v] = true; q.push([v, u]); }
                else if (v !== parent) return true;
            }
        }
    }
    return false;
};
