/**
 * @param {number} V
 * @param {number[][]} adj
 * @return {number[]}
 */
var articulationPoints = function(V, adj) {
    const tin = new Array(V).fill(-1), low = new Array(V).fill(0);
    const isAp = new Array(V).fill(false);
    let timer = 0;
    const dfs = (u, parent) => {
        tin[u] = low[u] = timer++;
        let children = 0;
        for (const v of adj[u]) {
            if (v === parent) continue;
            if (tin[v] === -1) {
                dfs(v, u);
                low[u] = Math.min(low[u], low[v]);
                if (parent !== -1 && low[v] >= tin[u]) isAp[u] = true;
                children++;
            } else {
                low[u] = Math.min(low[u], tin[v]);
            }
        }
        if (parent === -1 && children > 1) isAp[u] = true;
    };
    for (let i = 0; i < V; i++) if (tin[i] === -1) dfs(i, -1);
    const out = [];
    for (let i = 0; i < V; i++) if (isAp[i]) out.push(i);
    return out.length ? out : [-1];
};
