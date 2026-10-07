class Solution {
    vector<vector<int>> g, out;
    vector<int> disc, low;
    int timer = 0;
    void dfs(int u, int parent) {
        disc[u] = low[u] = ++timer;
        for (int v : g[u]) {
            if (v == parent) continue;
            if (disc[v]) low[u] = min(low[u], disc[v]);
            else {
                dfs(v, u);
                low[u] = min(low[u], low[v]);
                if (low[v] > disc[u]) out.push_back({u, v});
            }
        }
    }
public:
    vector<vector<int>> criticalConnections(int n, vector<vector<int>>& connections) {
        g.assign(n, {}); disc.assign(n, 0); low.assign(n, 0);
        for (auto& e : connections) { g[e[0]].push_back(e[1]); g[e[1]].push_back(e[0]); }
        for (int i = 0; i < n; i++) if (!disc[i]) dfs(i, -1);
        return out;
    }
};
