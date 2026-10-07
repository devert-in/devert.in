class Solution {
    vector<int> disc, low;
    vector<bool> ap;
    int timer = 0;
    void dfs(int u, int parent, vector<vector<int>>& adj) {
        disc[u] = low[u] = ++timer;
        int children = 0;
        for (int v : adj[u]) {
            if (v == parent) continue;
            if (disc[v]) low[u] = min(low[u], disc[v]);
            else {
                children++;
                dfs(v, u, adj);
                low[u] = min(low[u], low[v]);
                if (parent != -1 && low[v] >= disc[u]) ap[u] = true;
            }
        }
        if (parent == -1 && children > 1) ap[u] = true;
    }
public:
    vector<int> articulationPoints(int V, vector<vector<int>>& adj) {
        disc.assign(V, 0); low.assign(V, 0); ap.assign(V, false);
        for (int i = 0; i < V; i++) if (!disc[i]) dfs(i, -1, adj);
        vector<int> out;
        for (int i = 0; i < V; i++) if (ap[i]) out.push_back(i);
        if (out.empty()) out.push_back(-1);
        return out;
    }
};
