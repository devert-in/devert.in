/**
 * @param {number} n
 * @param {number[][]} connections
 * @return {number[][]}
 */
var criticalConnections = function(n, connections) {
    const adj = Array.from({ length: n }, () => []);
    for (const [a, b] of connections) { adj[a].push(b); adj[b].push(a); }
    const tin = new Array(n).fill(-1), low = new Array(n).fill(0);
    const out = [];
    let timer = 0;
    const dfs = (u, parent) => {
        tin[u] = low[u] = timer++;
        for (const v of adj[u]) {
            if (v === parent) continue;
            if (tin[v] === -1) {
                dfs(v, u);
                low[u] = Math.min(low[u], low[v]);
                if (low[v] > tin[u]) out.push([u, v]);
            } else {
                low[u] = Math.min(low[u], tin[v]);
            }
        }
    };
    for (let i = 0; i < n; i++) if (tin[i] === -1) dfs(i, -1);
    return out;
};
