class Solution {
    bool dfs(int u, int parent, vector<vector<int>>& adj, vector<bool>& seen) {
        seen[u] = true;
        for (int v : adj[u]) {
            if (!seen[v]) { if (dfs(v, u, adj, seen)) return true; }
            else if (v != parent) return true;
        }
        return false;
    }
public:
    bool isCycle(int V, vector<vector<int>>& adj) {
        vector<bool> seen(V, false);
        for (int i = 0; i < V; i++)
            if (!seen[i] && dfs(i, -1, adj, seen)) return true;
        return false;
    }
};
